/* Ezekiel – The Destroyer · Bilderbuch-Kulissen
   Eine zusätzliche, reich bemalte Tiefenebene je Gebiet – wie eine Seite aus einem sehr detaillierten,
   epischen Bilderbuch. Jede Seite wird einmal pro Gebiet in ein Offscreen-Canvas gemalt (mehrere
   Tiefenstaffeln mit Luftperspektive, Mauerwerk, Dachziegel, Zinnen, Erker, Wasserspeier, Efeu, Felsen,
   Bäume; innen Gewölberippen, Säulen, Galerien, Statuen, Glasfenster …). Darüber läuft jedes Bild eine
   sparsame Lebendig-Schicht: flackernde Fenster, wandernde Lichter, wehende Banner, Rauch, Schwärme,
   Wachen auf fernen Mauern, treibende Boote, drehende Räder, Glocken, Funken, Nebel, Wasser, Blitze.
   Farbregel: kein Blau – alle Töne stammen aus Himmel/Kacheln des Gebiets oder aus Rot, Gold, Grün, Lila, Braun. */
(function () {
  "use strict";
  const Z = window.Z, G = Z.gfx;
  const TAU = Math.PI * 2, PI = Math.PI;
  const PW = 1536; /* Breite einer Bilderbuchseite, wiederholt sich */
  const PF = 0.22, PY = 0.14; /* Parallaxe */

  /* ======================= FARBEN ======================= */
  const HX = new Map();
  function hex(h) {
    let v = HX.get(h); if (v) return v;
    let s = h.charAt(0) === "#" ? h.slice(1) : h; if (s.length === 3) s = s[0] + s[0] + s[1] + s[1] + s[2] + s[2];
    const n = parseInt(s, 16); v = [n >> 16 & 255, n >> 8 & 255, n & 255]; HX.set(h, v); return v;
  }
  const cl = v => v < 0 ? 0 : v > 255 ? 255 : Math.round(v);
  const toHex = (r, g, b) => "#" + ((1 << 24) | (cl(r) << 16) | (cl(g) << 8) | cl(b)).toString(16).slice(1);
  function mix(a, b, t) { const A = hex(a), B = hex(b); return toHex(A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t); }
  const shade = (h, k) => k >= 0 ? mix(h, "#ffffff", k) : mix(h, "#000000", -k);
  function rgba(h, a) { const v = hex(h); return "rgba(" + v[0] + "," + v[1] + "," + v[2] + "," + (a < 0 ? 0 : a > 1 ? 1 : a).toFixed(3) + ")"; }
  /* kein Blau: Blauanteil höchstens leicht über Rot (Lila bleibt erlaubt) */
  function nb(h) { const v = hex(h); const m = Math.max(v[0] * 1.25, v[1]); return v[2] > m ? toHex(v[0], v[1], m) : h; }

  /* ======================= ZUFALL ======================= */
  /* eigener Zufall mit speicherbarem Zustand – so lassen sich Dinge an der Seitennaht identisch doppeln */
  function Rng(seed) {
    let s = seed >>> 0 || 1;
    const f = () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    f.get = () => s; f.set = v => { s = v; };
    f.r = (a, b) => a + f() * (b - a); f.pick = l => l[(f() * l.length) | 0];
    return f;
  }
  const hsh = i => { let h = Math.imul((i | 0) ^ 0x9e3779b9, 0x85ebca6b); h ^= h >>> 13; h = Math.imul(h, 0xc2b2ae35); h ^= h >>> 16; return (h >>> 0) / 4294967296; };
  const frac = v => v - Math.floor(v);

  /* ======================= LEUCHT-SPRITES (einmal erzeugt, dann nur noch drawImage) ======================= */
  const GLOW = new Map();
  function glowSpr(col, soft) {
    const key = col + (soft ? "s" : ""); let s = GLOW.get(key); if (s) return s;
    const cv = document.createElement("canvas"); cv.width = cv.height = 64; const c = cv.getContext("2d");
    const g = c.createRadialGradient(32, 32, 0, 32, 32, 32);
    if (soft) { g.addColorStop(0, rgba(col, 0.55)); g.addColorStop(0.5, rgba(col, 0.25)); g.addColorStop(1, rgba(col, 0)); }
    else { g.addColorStop(0, rgba(col, 1)); g.addColorStop(0.18, rgba(col, 0.55)); g.addColorStop(0.5, rgba(col, 0.16)); g.addColorStop(1, rgba(col, 0)); }
    c.fillStyle = g; c.fillRect(0, 0, 64, 64); GLOW.set(key, cv); return cv;
  }
  function glow(c, x, y, r, col, a, soft) { if (a <= 0.01) return; c.globalAlpha = a > 1 ? 1 : a; c.drawImage(glowSpr(col, soft), x - r, y - r, r * 2, r * 2); }
  /* eingebackenes Leuchten im Gemälde */
  function bake(o, x, y, r, col, a) { const c = o.c; c.globalCompositeOperation = "lighter"; glow(c, x, y, r, col, a); c.globalAlpha = 1; c.globalCompositeOperation = "source-over"; }

  /* ======================= MALOBJEKT ======================= */
  function P(c, R, pal, H, s) {
    const o = { c, R, pal, H, s,
      lights: [], flags: [], drapes: [], smoke: [], spin: [], swings: [], bobs: [], movers: [], gears: [], beams: [], falls: [], glows: [], flames: [],
      flocks: [], walkers: [], mists: [], glints: [], sparks: [], motes: [], drips: [], bolts: [], spiders: [], eyes: [], wanders: [], shafts: [], ripples: [], lava: [], chands: [],
      trains: [], lanterns: [], water: [] };
    o.hz = (col, d) => mix(col, pal.fog, d);
    return o;
  }
  /* eigenes kleines Bild (für Dinge, die sich bewegen: Zahnräder, Glocken, Schiffe …); Drehpunkt px/py */
  function mkSprite(o, w, h, px, py, fn) {
    const cv = document.createElement("canvas"); cv.width = Math.max(1, Math.ceil(w * o.s)); cv.height = Math.max(1, Math.ceil(h * o.s));
    const c = cv.getContext("2d"); c.scale(o.s, o.s); c.translate(px, py);
    const so = P(c, o.R, o.pal, o.H, o.s); so.hz = o.hz; fn(so);
    return { cv, w, h, px, py, sub: so };
  }
  /* an der Seitennaht doppeln (gleicher Zufall für beide Kopien) */
  function wrapX(o, x, w, fn) {
    const st = o.R.get(); fn(x);
    if (x + w > PW) { const e = o.R.get(); o.R.set(st); fn(x - PW); o.R.set(e); }
    else if (x < 0) { const e = o.R.get(); o.R.set(st); fn(x + PW); o.R.set(e); }
  }

  /* ======================= GRUNDFORMEN ======================= */
  /* Körper mit Licht von links (Mond / Fenster) */
  function body(o, x, y, w, h, col, k) {
    const c = o.c; k = k == null ? 1 : k; const g = c.createLinearGradient(x, 0, x + w, 0);
    g.addColorStop(0, shade(col, 0.17 * k)); g.addColorStop(0.25, col); g.addColorStop(0.72, shade(col, -0.18 * k)); g.addColorStop(1, shade(col, -0.45 * k));
    c.fillStyle = g; c.fillRect(x, y, w, h);
  }
  /* Rundkörper (Rundturm) – stärkere Wölbung */
  function roundBody(o, x, y, w, h, col) {
    const c = o.c, g = c.createLinearGradient(x, 0, x + w, 0);
    g.addColorStop(0, shade(col, 0.05)); g.addColorStop(0.22, shade(col, 0.2)); g.addColorStop(0.55, col); g.addColorStop(0.85, shade(col, -0.35)); g.addColorStop(1, shade(col, -0.55));
    c.fillStyle = g; c.fillRect(x, y, w, h);
  }
  /* Mauerwerk: Lagen, versetzte Fugen, einzeln getönte Steine, Risse, Flecken */
  function masonry(o, x, y, w, h, col, ch, round) {
    const { c, R } = o; ch = ch || 4; if (w < 4 || h < 3) return;
    const sw0 = ch * 2.3;
    c.save(); c.beginPath(); c.rect(x, y, w, h); c.clip();
    /* Steine gesammelt in drei Pfaden – ein Füllaufruf je Ton (schnell) */
    const hiP = new Path2D(), loP = new Path2D(), moP = new Path2D(), tlP = new Path2D();
    let row = 0;
    for (let yy = y; yy < y + h; yy += ch, row++) {
      moP.rect(x, yy, w, 0.45); tlP.rect(x, yy + 0.45, w, 0.3);
      let xx = x - (row & 1 ? sw0 * 0.5 : 0) - R() * sw0 * 0.4;
      while (xx < x + w) {
        /* Rundtürme: Steine am Rand schmaler (Wölbung) */
        let sw = sw0 * (0.65 + R() * 0.7);
        if (round) { const u = (xx - x) / w; sw *= 0.35 + Math.sin(Math.max(0.05, Math.min(0.95, u)) * PI) * 0.75; }
        const t = R(); if (t < 0.42) (t < 0.2 ? hiP : loP).rect(xx + 0.45, yy + 0.45, sw - 0.45, ch - 0.45);
        moP.rect(xx, yy, 0.4, ch); xx += sw;
      }
    }
    c.fillStyle = rgba(shade(col, 0.28), 0.2); c.fill(hiP); c.fillStyle = rgba(shade(col, -0.45), 0.24); c.fill(loP);
    c.fillStyle = rgba(shade(col, -0.62), 0.5); c.fill(moP); c.fillStyle = rgba(shade(col, 0.35), 0.13); c.fill(tlP);
    /* Risse und Wasserflecken */
    const n = w * h / 1600;
    c.strokeStyle = rgba(shade(col, -0.65), 0.55); c.lineWidth = 0.35; c.beginPath();
    for (let i = 0; i < n; i++) { let cx = x + R() * w, cy = y + R() * h; c.moveTo(cx, cy); for (let k = 0; k < 4; k++) { cx += (R() - 0.5) * 3; cy += 1 + R() * 2.5; c.lineTo(cx, cy); } }
    c.stroke();
    const st = new Path2D(), st2 = new Path2D();
    for (let i = 0; i < n * 0.7; i++) { const sx = x + R() * w, sy = y + R() * h * 0.7, sh = 6 + R() * 18, sw = 1 + R() * 2.5; st.rect(sx, sy, sw, sh * 0.5); st2.rect(sx, sy, sw, sh); }
    c.fillStyle = rgba(shade(col, -0.5), 0.1); c.fill(st); c.fill(st2);
    c.restore();
  }
  /* Ziegelmauerwerk (Keller) */
  function bricks(o, x, y, w, h, col, bh) {
    const { c, R } = o; bh = bh || 2.2; const bw = bh * 2.4;
    c.save(); c.beginPath(); c.rect(x, y, w, h); c.clip();
    const mo = new Path2D(), hi = new Path2D(), lo = new Path2D();
    let row = 0;
    for (let yy = y; yy < y + h; yy += bh, row++) {
      mo.rect(x, yy, w, 0.4);
      for (let xx = x - (row & 1 ? bw / 2 : 0); xx < x + w; xx += bw) { const t = R(); if (t < 0.45) (t < 0.22 ? hi : lo).rect(xx + 0.4, yy + 0.4, bw - 0.4, bh - 0.4); mo.rect(xx, yy, 0.4, bh); }
    }
    c.fillStyle = rgba(shade(col, 0.22), 0.25); c.fill(hi); c.fillStyle = rgba(shade(col, -0.35), 0.3); c.fill(lo); c.fillStyle = rgba(shade(col, -0.55), 0.55); c.fill(mo);
    c.restore();
  }
  /* Kantenlicht (Mond/Sonne): Stärke je Tageszeit (pal.rimK) */
  function rimLight(o, x, y, h, a) { const k = o.pal.rimK || 1; o.c.fillStyle = rgba(o.pal.light, (a || 0.25) * k); o.c.fillRect(x, y, k > 1.2 ? 0.9 : 0.6, h); }

  /* ---------- Fenster ---------- */
  const WARM = "#ffcf7a";
  function winPath(c, x, y, w, h, k) {
    c.beginPath();
    if (k === "rect") c.rect(x, y, w, h);
    else if (k === "point") { c.moveTo(x, y + h); c.lineTo(x, y + w * 0.75); c.quadraticCurveTo(x, y + w * 0.12, x + w / 2, y); c.quadraticCurveTo(x + w, y + w * 0.12, x + w, y + w * 0.75); c.lineTo(x + w, y + h); c.closePath(); }
    else { c.moveTo(x, y + h); c.lineTo(x, y + w / 2); c.arc(x + w / 2, y + w / 2, w / 2, PI, 0); c.lineTo(x + w, y + h); c.closePath(); }
  }
  function win(o, x, y, w, h, op) {
    const { c, R } = o; op = op || {}; const k = op.k || "arch";
    if (op.frame) { c.fillStyle = op.frame; winPath(c, x - 0.6, y - 0.6, w + 1.2, h + 0.9, k); c.fill(); }
    if (op.lit) {
      const col = op.col || WARM;
      c.fillStyle = shade(col, -0.4); winPath(c, x, y, w, h, k); c.fill();
      if (w > 1.2) { c.fillStyle = col; winPath(c, x + w * 0.2, y + w * 0.2, w * 0.6, h - w * 0.32, k); c.fill(); }
      if (w > 2.2) { c.fillStyle = "rgba(70,36,14,.7)"; c.fillRect(x + w / 2 - 0.22, y + w * 0.3, 0.44, h - w * 0.3); if (h > 5) c.fillRect(x, y + h * 0.56, w, 0.4); }
      if (op.far) bake(o, x + w / 2, y + h / 2, 2 + w * 2, col, 0.35);
      else o.lights.push({ x: x + w / 2, y: y + h / 2, r: 3 + w * 2.4, col, ph: R() * 60, a: op.la || 0.42, f: op.flick || (R() < 0.18 ? 2 : 1), wx: x, wy: y, ww: w, wh: h, k, tog: R() < (op.tog == null ? 0.1 : op.tog) });
    } else {
      c.fillStyle = op.dark || "#120b10"; winPath(c, x, y, w, h, k); c.fill();
      if (w > 1.8) { c.fillStyle = rgba(o.pal.light, 0.09); c.fillRect(x + 0.35, y + w * 0.45, 0.45, h * 0.5); }
    }
    if (op.sill !== false && w > 1.5) { c.fillStyle = rgba(o.pal.light, 0.16); c.fillRect(x - 0.5, y + h, w + 1, 0.6); c.fillStyle = "rgba(0,0,0,.32)"; c.fillRect(x - 0.5, y + h + 0.6, w + 1, 0.5); }
    return [x, y, w, h];
  }
  /* Schießscharte (Kreuzform) */
  function slit(o, x, y, h) { const c = o.c; c.fillStyle = "#0d080b"; c.fillRect(x - 0.35, y, 0.7, h); c.fillRect(x - 1.1, y + h * 0.4, 2.2, 0.6); c.fillStyle = rgba(o.pal.light, 0.12); c.fillRect(x - 0.9, y - 0.4, 1.8, 0.4); }

  /* ---------- Dächer ---------- */
  /* Kegeldach mit leicht geschwungenen Flanken und Schindelreihen */
  function coneRoof(o, cx, y, w, h, col, op) {
    op = op || {}; const { c, R } = o;
    const path = () => { c.beginPath(); c.moveTo(cx - w / 2, y); c.quadraticCurveTo(cx - w * 0.2, y - h * 0.32, cx, y - h); c.quadraticCurveTo(cx + w * 0.2, y - h * 0.32, cx + w / 2, y); c.closePath(); };
    c.save(); path();
    const g = c.createLinearGradient(cx - w / 2, 0, cx + w / 2, 0);
    g.addColorStop(0, shade(col, 0.25)); g.addColorStop(0.35, col); g.addColorStop(0.75, shade(col, -0.3)); g.addColorStop(1, shade(col, -0.55));
    c.fillStyle = g; c.fill(); c.clip();
    if (!op.plain && w > 5) {
      const rh = Math.max(1.3, Math.min(2.6, w / 12));
      /* Reihen leicht unterschiedlich getönt */
      for (let k = 0, row = 0; k < h; k += rh * 1.6, row++) if (R() < 0.35) { c.fillStyle = R() < 0.5 ? "rgba(255,230,200,.06)" : "rgba(0,0,0,.1)"; c.fillRect(cx - w / 2, y - h + k, w, rh * 1.6); }
      c.strokeStyle = rgba(shade(col, -0.6), 0.5); c.lineWidth = 0.35; c.beginPath();
      for (let k = rh, row = 0; k < h + rh; k += rh * 1.6, row++) { const yy = y - h + k; for (let xx = cx - w / 2 - (row & 1 ? rh : 0); xx < cx + w / 2 + rh; xx += rh * 2) { c.moveTo(xx + rh * 2, yy); c.arc(xx + rh, yy, rh, 0, PI); } }
      c.stroke();
      /* Moos- und Flechtenflecken */
      if (op.moss) for (let i = 0; i < w * h / 60; i++) { c.fillStyle = rgba(op.moss, 0.25 + R() * 0.25); c.beginPath(); c.arc(cx + (R() - 0.5) * w, y - R() * h * 0.6, 0.5 + R() * 1.4, 0, TAU); c.fill(); }
    }
    c.restore();
    /* Firstkante im Licht und Traufschatten */
    c.strokeStyle = rgba(o.pal.light, 0.35); c.lineWidth = 0.5; c.beginPath(); c.moveTo(cx - w / 2, y); c.quadraticCurveTo(cx - w * 0.2, y - h * 0.32, cx, y - h); c.stroke();
    c.fillStyle = "rgba(0,0,0,.4)"; c.fillRect(cx - w / 2 + 1, y, w - 2, 1);
    if (op.fin !== false) finial(o, cx, y - h, op.flag == null ? 0.7 : op.flag, op.far);
  }
  function finial(o, x, y, flagP, far) {
    const { c, R } = o; c.fillStyle = far ? o.hz("#c8a050", 0.4) : "#c8a050"; c.fillRect(x - 0.3, y - 6, 0.6, 6); c.beginPath(); c.arc(x, y - 2.5, 0.9, 0, TAU); c.fill();
    if (R() < flagP) o.flags.push({ x, y: y - 6, len: 6 + R() * 8, col: R.pick(o.pal.banner), ph: R() * 6, w: 2.4 + R() });
  }
  /* Satteldach (Häuser): Ziegelreihen, Ortgang, First */
  function gableRoof(o, x, y, w, h, col, op) {
    op = op || {}; const { c, R } = o;
    const hip = op.hip; const path = () => { c.beginPath(); c.moveTo(x, y); if (hip) { c.lineTo(x + w * 0.22, y - h); c.lineTo(x + w * 0.78, y - h); } else c.lineTo(x + w / 2, y - h); c.lineTo(x + w, y); c.closePath(); };
    c.save(); path();
    const g = c.createLinearGradient(x, 0, x + w, 0); g.addColorStop(0, shade(col, 0.2)); g.addColorStop(0.5, col); g.addColorStop(0.5, shade(col, -0.22)); g.addColorStop(1, shade(col, -0.45));
    c.fillStyle = hip ? col : g; c.fill(); c.clip();
    if (hip) { c.fillStyle = "rgba(255,230,200,.1)"; c.beginPath(); c.moveTo(x, y); c.lineTo(x + w * 0.22, y - h); c.lineTo(x + w * 0.22, y); c.fill(); c.fillStyle = "rgba(0,0,0,.25)"; c.beginPath(); c.moveTo(x + w, y); c.lineTo(x + w * 0.78, y - h); c.lineTo(x + w * 0.78, y); c.fill(); }
    if (w > 6 && !op.plain) {
      const rh = Math.max(1.1, Math.min(2, h / 7));
      c.fillStyle = rgba(shade(col, -0.6), 0.55);
      for (let yy = y - rh, row = 0; yy > y - h; yy -= rh, row++) { c.fillRect(x, yy, w, 0.4); for (let xx = x + (row & 1 ? rh : 0); xx < x + w; xx += rh * 2) c.fillRect(xx, yy, 0.35, rh); }
      for (let i = 0; i < w * h / 50; i++) { c.fillStyle = R() < 0.5 ? "rgba(255,220,190,.08)" : "rgba(0,0,0,.12)"; c.fillRect(x + R() * w, y - R() * h, 1.5 + R() * 2, rh * 0.9); }
      if (op.moss) for (let i = 0; i < w * h / 70; i++) { c.fillStyle = rgba(op.moss, 0.3 + R() * 0.3); c.beginPath(); c.arc(x + R() * w, y - R() * h * 0.5, 0.4 + R() * 1.1, 0, TAU); c.fill(); }
    }
    c.restore();
    c.strokeStyle = rgba(shade(col, -0.65), 0.9); c.lineWidth = 0.7; path(); c.stroke();
    c.strokeStyle = rgba(o.pal.light, 0.25); c.lineWidth = 0.4; c.beginPath(); c.moveTo(x, y); c.lineTo(hip ? x + w * 0.22 : x + w / 2, y - h); c.stroke();
    c.fillStyle = "rgba(0,0,0,.4)"; c.fillRect(x + 1, y, w - 2, 0.9);
  }

  /* ---------- Turmschmuck ---------- */
  function crenels(o, x, y, w, col, step) {
    const c = o.c; step = step || 4.5;
    c.fillStyle = shade(col, -0.12); c.fillRect(x - 0.6, y, w + 1.2, 2.6);
    c.fillStyle = rgba(o.pal.light, 0.22); c.fillRect(x - 0.6, y, w + 1.2, 0.5);
    for (let xx = x - 0.6; xx < x + w; xx += step) { const mw = Math.min(step * 0.56, x + w + 0.6 - xx); c.fillStyle = col; c.fillRect(xx, y - 3.4, mw, 3.4); c.fillStyle = rgba(o.pal.light, 0.22); c.fillRect(xx, y - 3.4, mw, 0.5); c.fillStyle = "rgba(0,0,0,.3)"; c.fillRect(xx + mw - 0.6, y - 3.4, 0.6, 3.4); }
    c.fillStyle = "rgba(0,0,0,.32)"; c.fillRect(x - 0.6, y + 2.6, w + 1.2, 1.2);
  }
  /* Pechnasen-Kragsteine unter der Brüstung */
  function machicolation(o, x, y, w, col) {
    const c = o.c; c.fillStyle = shade(col, -0.18); c.fillRect(x, y, w, 3.2);
    for (let xx = x + 0.5; xx < x + w - 1; xx += 2.6) { c.fillStyle = shade(col, 0.05); c.beginPath(); c.moveTo(xx, y + 3.2); c.lineTo(xx + 1.3, y + 3.2); c.lineTo(xx + 0.9, y + 5.4); c.lineTo(xx + 0.4, y + 5.4); c.fill(); c.fillStyle = "#0d080b"; c.fillRect(xx + 1.4, y + 2.4, 1.1, 1.2); }
  }
  function gargoyle(o, x, y, dir, col) {
    const c = o.c; c.fillStyle = shade(col, -0.3);
    c.beginPath(); c.moveTo(x, y - 1); c.lineTo(x + dir * 3.5, y - 2); c.lineTo(x + dir * 5.2, y - 3.2); c.lineTo(x + dir * 6.4, y - 1.6); c.lineTo(x + dir * 6.8, y + 0.2); c.lineTo(x + dir * 5.4, y + 0.6); c.lineTo(x + dir * 4.6, y - 0.4); c.lineTo(x + dir * 2.2, y + 1.6); c.lineTo(x, y + 1.6); c.closePath(); c.fill();
    c.beginPath(); c.moveTo(x + dir * 2, y - 1.4); c.lineTo(x + dir * 1.4, y - 4.6); c.lineTo(x + dir * 3.4, y - 1.8); c.fill(); /* Flügel */
    c.fillStyle = rgba(o.pal.light, 0.2); c.fillRect(x + dir * 2, y - 2, dir * 3, 0.4);
  }
  /* Ecktürmchen (Pfefferstreuer) */
  function bartizan(o, x, y, w, col, roof) {
    const { c, R } = o;
    c.fillStyle = shade(col, -0.2); c.beginPath(); c.moveTo(x, y); c.lineTo(x + w, y); c.lineTo(x + w / 2, y + w * 1.3); c.fill();
    for (let k = 1; k < 4; k++) { c.fillStyle = "rgba(0,0,0,.22)"; c.fillRect(x + w * k * 0.1, y + k * w * 0.3, w * (1 - k * 0.2), 0.4); }
    roundBody(o, x, y - w * 1.7, w, w * 1.7, col);
    slit(o, x + w / 2, y - w * 1.3, w * 0.8);
    coneRoof(o, x + w / 2, y - w * 1.7, w + 1.6, w * 1.7, roof, { flag: 0.35, plain: w < 5 });
    if (R() < 0.25) bake(o, x + w / 2, y - w * 0.9, 4, WARM, 0.3);
  }
  function ivy(o, x, base, w, h) {
    const { c, R, pal } = o; const cols = pal.ivy; if (!cols) return;
    const vines = 1 + (w / 16 | 0);
    for (let v = 0; v < vines; v++) {
      let vx = x + R() * w, vy = base; const top = base - h * (0.45 + R() * 0.55);
      while (vy > top) {
        vy -= 1.1; vx += (R() - 0.5) * 1.6; vx = Math.max(x + 0.5, Math.min(x + w - 0.5, vx));
        const sp = 1.5 + (vy - top) / h * 5;
        for (let k = 0; k < 2; k++) { const lx = Math.max(x, Math.min(x + w, vx + (R() - 0.5) * sp * 2)), ly = vy + (R() - 0.5) * 2; c.fillStyle = cols[(R() * 3) | 0]; c.beginPath(); c.arc(lx, ly, 0.5 + R() * 0.8, 0, TAU); c.fill(); }
      }
    }
  }
  function door(o, x, base, w, h, op) {
    const c = o.c; op = op || {};
    c.fillStyle = rgba(o.pal.light, 0.18); winPath(c, x - 0.8, base - h - 0.8, w + 1.6, h + 0.8, "arch"); c.fill();
    c.fillStyle = op.open ? shade(WARM, -0.3) : "#2a1a12"; winPath(c, x, base - h, w, h, "arch"); c.fill();
    if (!op.open) { c.fillStyle = "rgba(0,0,0,.35)"; for (let xx = x + 1; xx < x + w; xx += 1.4) c.fillRect(xx, base - h + w / 2, 0.3, h - w / 2); c.fillStyle = "#4a4038"; c.fillRect(x, base - h * 0.7, w, 0.4); c.fillRect(x, base - h * 0.3, w, 0.4); }
    else o.lights.push({ x: x + w / 2, y: base - h / 2, r: w * 2.5, col: WARM, ph: o.R() * 9, a: 0.4, f: 2 });
  }

  /* ---------- Turm ---------- */
  /* op: head (cone|spire|cren|broken|dome|onion|none), far (0 nah … 1 fern), roof, garg, bart, oriel, ivy, wk, lit, wander, round, door, drapes */
  function tower(o, x, base, w, h, col, op) {
    op = op || {}; const { c, R, pal } = o; const far = op.far || 0;
    const top = base - h, roof = op.roof || o.hz(R.pick(pal.roofs), far * 0.8);
    const ch = w > 26 ? 4.4 : w > 14 ? 3.6 : 3;
    const pl = h > 40 && op.plinth !== false ? Math.min(h * 0.08, 8) : 0;
    if (pl) { c.fillStyle = shade(col, -0.14); c.beginPath(); c.moveTo(x - w * 0.07, base + 3); c.lineTo(x, base - pl); c.lineTo(x + w, base - pl); c.lineTo(x + w * 1.07, base + 3); c.fill(); c.fillStyle = rgba(pal.light, 0.2); c.fillRect(x, base - pl, w, 0.6); }
    (op.round ? roundBody : body)(o, x, top, w, h - pl, col);
    if (far < 0.75 && w >= 6) masonry(o, x, top, w, h - pl, col, ch, op.round);
    /* Eckquader */
    if (!op.round && far < 0.55 && w > 10) for (let yy = top + 2, i = 0; yy < base - pl - 2; yy += ch, i++) { const qw = i & 1 ? 2.4 : 1.5; c.fillStyle = rgba(shade(col, 0.3), 0.3); c.fillRect(x, yy, qw, ch - 0.45); c.fillStyle = rgba(shade(col, -0.5), 0.3); c.fillRect(x + w - qw, yy, qw, ch - 0.45); }
    /* Gesimse */
    const courses = []; for (let yy = top + 14 + R() * 8; yy < base - pl - 16; yy += 24 + R() * 18) courses.push(yy);
    if (far < 0.85) for (const yy of courses) { c.fillStyle = shade(col, 0.1); c.fillRect(x - 0.8, yy, w + 1.6, 1); c.fillStyle = "rgba(0,0,0,.38)"; c.fillRect(x - 0.8, yy + 1, w + 1.6, 0.7); }
    /* Fenster */
    const pts = windows(o, x, top, w, base - pl, col, op);
    if (op.wander && pts.length > 3) o.wanders.push({ pts, per: 4 + R() * 4, ph: R() * 50, col: WARM });
    if (op.garg && w > 10) for (const yy of courses.slice(0, 2)) { gargoyle(o, x - 0.5, yy, -1, col); gargoyle(o, x + w + 0.5, yy, 1, col); }
    /* Erker */
    if (far < 0.5 && h > 80 && w > 12 && R() < (op.oriel == null ? 0.35 : op.oriel)) {
      const ey = top + h * (0.25 + R() * 0.3), left = R() < 0.5, ew = 7 + w * 0.12, ex = left ? x - ew + 2 : x + w - 2;
      c.fillStyle = shade(col, -0.25); c.beginPath(); c.moveTo(ex, ey + 12); c.lineTo(ex + ew, ey + 12); c.lineTo(ex + ew / 2, ey + 19); c.fill();
      body(o, ex, ey, ew, 12, shade(col, 0.03)); win(o, ex + ew / 2 - 1.3, ey + 3, 2.6, 6, { lit: R() < 0.6, k: "arch" });
      coneRoof(o, ex + ew / 2, ey, ew + 1.5, ew * 1.2, roof, { flag: 0.3 });
    }
    if (pal.ivy && far < 0.5 && R() < (op.ivy == null ? 0.45 : op.ivy)) ivy(o, x, base - pl, w, h * (0.18 + R() * 0.4));
    if (op.door) door(o, x + w / 2 - op.door / 2, base - pl, op.door, op.door * 1.7, { open: R() < 0.4 });
    /* Kopf */
    const kind = op.head || (R() < 0.6 ? "cone" : "cren");
    const cx = x + w / 2;
    if (kind === "cone" || kind === "spire") {
      c.fillStyle = shade(col, -0.28); c.fillRect(x - 1.5, top - 2, w + 3, 2.4);
      if (far < 0.6) for (let xx = x - 1; xx < x + w + 1; xx += 2.2) { c.fillStyle = "rgba(0,0,0,.4)"; c.fillRect(xx, top + 0.4, 1, 1.4); }
      const rh = kind === "spire" ? w * (3 + R() * 1.4) : w * (1.25 + R() * 0.9);
      coneRoof(o, cx, top - 2, w + 4, rh, roof, { moss: pal.moss, far });
      if (kind === "spire" && w > 9) { for (const px of [x - 1, x + w + 1]) coneRoof(o, px, top - 2, 3.4, w * 0.9, roof, { plain: true, flag: 0 }); }
      else if (w > 14 && far < 0.5 && R() < 0.6) { /* Gaube */ const dx = cx + (R() - 0.5) * w * 0.3, dy = top - 2 - rh * 0.3; c.fillStyle = shade(col, -0.05); c.fillRect(dx - 2, dy - 3, 4, 4); win(o, dx - 1, dy - 2.4, 2, 3.2, { lit: R() < 0.5, k: "rect", sill: false }); gableRoof(o, dx - 2.8, dy - 3, 5.6, 3, roof, { plain: true }); }
    } else if (kind === "cren" || kind === "broken") {
      if (kind === "cren") {
        if (far < 0.7) machicolation(o, x - 1.8, top - 1, w + 3.6, col);
        body(o, x - 1.8, top - 6, w + 3.6, 5, shade(col, 0.02)); crenels(o, x - 1.8, top - 6, w + 3.6, col, w > 30 ? 5 : 4.2);
        if (op.bart !== false && w > 15 && far < 0.6 && R() < (op.bart ? 1 : 0.6)) { const bw = 4 + w * 0.1; bartizan(o, x - bw * 0.6, top + 2, bw, col, roof); bartizan(o, x + w - bw * 0.4, top + 2, bw, col, roof); }
        if (R() < 0.45 && w > 12) { /* Wachstube mit Dach auf der Plattform */ const hw = w * 0.5; body(o, cx - hw / 2, top - 6 - hw * 0.6, hw, hw * 0.6, col); win(o, cx - 1, top - 6 - hw * 0.45, 2, 3, { lit: R() < 0.6 }); coneRoof(o, cx, top - 6 - hw * 0.6, hw + 3, hw * 1.2, roof, { far }); }
        else { o.flags.push({ x: cx, y: top - 20, len: 10 + R() * 8, col: R.pick(pal.banner), ph: R() * 6, pole: 14, w: 3.4 }); if (R() < 0.5) o.flames.push({ x: cx + w * 0.3, y: top - 7, s: 0.9, ph: R() * 9 }); }
      } else {
        /* gebrochene Krone: zackige Abbruchkante, freiliegende Balken */
        c.fillStyle = shade(col, -0.05); c.beginPath(); c.moveTo(x, top + 4); let xx = x;
        while (xx < x + w) { xx += 1.5 + R() * 3; c.lineTo(Math.min(xx, x + w), top - 6 + R() * 14); }
        c.lineTo(x + w, top + 4); c.fill();
        c.strokeStyle = "#2a1c14"; c.lineWidth = 0.8; c.beginPath(); for (let k = 0; k < 3; k++) { const bx = x + R() * w; c.moveTo(bx, top + 2); c.lineTo(bx + (R() - 0.5) * 10, top - 6 - R() * 8); } c.stroke();
      }
    } else if (kind === "dome" || kind === "onion") {
      c.fillStyle = shade(col, -0.25); c.fillRect(x - 1, top - 2, w + 2, 2.4);
      const g = c.createLinearGradient(x, 0, x + w, 0); g.addColorStop(0, shade(roof, 0.3)); g.addColorStop(0.5, roof); g.addColorStop(1, shade(roof, -0.5)); c.fillStyle = g;
      c.beginPath(); if (kind === "dome") c.arc(cx, top - 2, w / 2 + 1, PI, 0); else { c.moveTo(x - 1, top - 2); c.bezierCurveTo(x - 4, top - w * 0.8, cx - 1, top - w * 0.9, cx, top - w * 1.35); c.bezierCurveTo(cx + 1, top - w * 0.9, x + w + 4, top - w * 0.8, x + w + 1, top - 2); }
      c.fill(); finial(o, cx, kind === "dome" ? top - w / 2 - 3 : top - w * 1.35, 0.6, far);
    }
    if (far < 0.8) rimLight(o, x, top, h - pl, 0.18);
    return { x, top, w, pts };
  }
  function windows(o, x, top, w, bot, col, op) {
    const { R, pal } = o; const far = op.far || 0, pts = [];
    if (w < 4) return pts;
    const n = w < 12 ? 1 : w < 26 ? (R() < 0.5 ? 1 : 2) : w < 40 ? 2 : 3;
    const kind = op.wk || R.pick(["arch", "arch", "point", "rect"]);
    const ww = Math.max(1.3, Math.min(5.5, w / (n * 2.7)));
    const frame = far < 0.6 ? rgba(shade(col, 0.28), 0.45) : null;
    const rowH = Math.max(10, ww * 3.4 + 5);
    for (let yy = top + 8 + R() * 4; yy < bot - ww * 2.3 - 5; yy += rowH + R() * 5) {
      const floorLit = R() < (op.lit == null ? pal.lit : op.lit);
      for (let k = 0; k < n; k++) {
        const slot = w / n, xx = x + slot * k + slot / 2 - ww / 2, r = R();
        if (r < 0.1 && far < 0.7) { slit(o, xx + ww / 2, yy + 1, ww * 2); continue; }
        if (r < 0.17) continue;
        const lit = floorLit ? R() < 0.8 : R() < 0.07;
        const wo = { k: kind, lit, frame, far: far >= 0.45, col: op.wcol };
        if (ww > 2.8 && R() < 0.3) { const pw = ww * 0.44; win(o, xx, yy, pw, ww * 2.3, wo); win(o, xx + ww - pw, yy, pw, ww * 2.3, wo); }
        else win(o, xx, yy, ww, ww * 2.3, wo);
        pts.push([xx, yy, ww, ww * 2.3]);
      }
    }
    return pts;
  }

  /* ---------- Mauern, Tore, Brücken ---------- */
  function buttress(o, x, top, base, bw, col) {
    const c = o.c; const h = base - top;
    body(o, x, top + h * 0.35, bw, h * 0.65, shade(col, 0.04)); body(o, x + bw * 0.2, top, bw * 0.6, h * 0.36, shade(col, 0.04));
    c.fillStyle = rgba(o.pal.light, 0.25); c.beginPath(); c.moveTo(x, top + h * 0.35); c.lineTo(x + bw * 0.2, top + h * 0.33); c.lineTo(x + bw * 0.8, top + h * 0.33); c.lineTo(x + bw, top + h * 0.35); c.fill();
    c.fillStyle = "rgba(0,0,0,.25)"; c.fillRect(x + bw, top + h * 0.35, 1.2, h * 0.65);
  }
  function curtain(o, x, w, top, base, col, op) {
    op = op || {}; const { c, R } = o;
    body(o, x, top, w, base - top, shade(col, -0.05), 0.5); masonry(o, x, top, w, base - top, col, op.ch || 3.4);
    for (let xx = x + 8 + R() * 8; xx < x + w - 6; xx += 12 + R() * 16) if (R() < 0.4 && base - top > 14) slit(o, xx, top + 6 + R() * Math.max(1, base - top - 18), 4.5);
    if (op.butt !== false && base - top > 24) for (let xx = x + 18 + R() * 20; xx < x + w - 10; xx += 36 + R() * 30) buttress(o, xx, top + (base - top) * 0.3, base, 4.5, col);
    if (op.hoard) { /* hölzerner Wehrerker */ const hx = x + w * (0.2 + R() * 0.5), hw = 18 + R() * 14; c.fillStyle = "#3a2618"; c.fillRect(hx, top - 9, hw, 7); c.fillStyle = "rgba(0,0,0,.4)"; for (let k = hx + 1; k < hx + hw; k += 2.5) c.fillRect(k, top - 9, 0.4, 7); gableRoof(o, hx - 1.5, top - 9, hw + 3, 5, o.hz(o.pal.roofs[0], 0.1), { hip: true }); for (let k = hx + 2; k < hx + hw; k += 5) { c.fillStyle = "#2a1a10"; c.fillRect(k, top - 2, 0.8, 4); } }
    else crenels(o, x, top, w, col, op.step || 4.4);
    if (op.walk) o.walkers.push({ x0: x + 6, x1: x + w - 6, y0: top - 3.3, y1: top - 3.3, v: 3 + R() * 3, ph: R() * 100, kind: op.walkKind || "guard", s: op.ws || 1, torch: R() < 0.6 });
    if (op.ivy && o.pal.ivy) for (let k = 0; k < w / 50; k++) ivy(o, x + R() * (w - 20), base, 20, (base - top) * 0.8);
    if (op.torches) for (let xx = x + 30 + R() * 30; xx < x + w - 20; xx += 60 + R() * 60) torch(o, xx, top + Math.min(14, (base - top) * 0.4));
  }
  function torch(o, x, y, s) {
    const c = o.c; s = s || 1; c.fillStyle = "#2a1e16"; c.fillRect(x - 0.4 * s, y, 0.8 * s, 3 * s); c.fillRect(x - 1.2 * s, y + 1.6 * s, 2.4 * s, 0.6 * s);
    o.flames.push({ x, y: y - 0.2, s: 0.75 * s, ph: o.R() * 9 });
    bake(o, x, y + 2, 22 * s, "#ff9a40", 0.22);
  }
  /* Torhaus mit Fallgitter */
  function gate(o, cx, base, gw, gh, col) {
    const c = o.c; const x = cx - gw / 2;
    /* Bogensteine */
    c.fillStyle = shade(col, 0.12); winPath(c, x - 2.4, base - gh - 2.4, gw + 4.8, gh + 2.4, "arch"); c.fill();
    c.strokeStyle = rgba(shade(col, -0.6), 0.6); c.lineWidth = 0.4; c.beginPath(); for (let k = 0; k <= 8; k++) { const a = PI + k / 8 * PI, r0 = gw / 2, r1 = gw / 2 + 2.4, yy = base - gh + gw / 2; c.moveTo(cx + Math.cos(a) * r0, yy + Math.sin(a) * r0); c.lineTo(cx + Math.cos(a) * r1, yy + Math.sin(a) * r1); } c.stroke();
    c.fillStyle = "#0b0709"; winPath(c, x, base - gh, gw, gh, "arch"); c.fill();
    bake(o, cx, base - gh * 0.3, gw * 0.7, "#ff9a3a", 0.25);
    /* Fallgitter halb hochgezogen */
    c.save(); winPath(c, x, base - gh, gw, gh, "arch"); c.clip();
    c.strokeStyle = "rgba(110,92,74,.85)"; c.lineWidth = 0.55; c.beginPath(); const pb = base - gh * 0.45;
    for (let k = x + 1.4; k < x + gw; k += 2.2) { c.moveTo(k, base - gh); c.lineTo(k, pb); } for (let k = base - gh + 2; k < pb; k += 2.4) { c.moveTo(x, k); c.lineTo(x + gw, k); }
    c.stroke(); c.fillStyle = "rgba(110,92,74,.9)"; for (let k = x + 1.4; k < x + gw; k += 2.2) { c.beginPath(); c.moveTo(k - 0.5, pb); c.lineTo(k + 0.5, pb); c.lineTo(k, pb + 1.6); c.fill(); }
    c.restore();
    torch(o, x - 4, base - gh * 0.75); torch(o, x + gw + 4, base - gh * 0.75);
  }
  function bridgeArches(o, x0, x1, y, th, groundY, col, n, op) {
    op = op || {}; const { c } = o; const w = x1 - x0, aw = w / n;
    const arches = () => { for (let k = 0; k < n; k++) { const ax = x0 + k * aw + aw * 0.16, a2 = aw * 0.68; c.moveTo(ax, groundY + 1); c.lineTo(ax, y + th + a2 / 2); c.arc(ax + a2 / 2, y + th + a2 / 2, a2 / 2, PI, 0); c.lineTo(ax + a2, groundY + 1); c.closePath(); } };
    if (op.under) { c.fillStyle = op.under; c.beginPath(); arches(); c.fill(); }
    /* Brückenkörper ohne die Bögen (gerade-ungerade-Regel) */
    c.save(); c.beginPath(); c.rect(x0, y, w, groundY - y); arches(); c.clip("evenodd");
    body(o, x0, y, w, groundY - y, col, 0.3); masonry(o, x0, y, w, groundY - y, col, 2.6); c.restore();
    c.strokeStyle = rgba(shade(col, 0.3), 0.4); c.lineWidth = 0.5; for (let k = 0; k < n; k++) { const ax = x0 + k * aw + aw * 0.16, a2 = aw * 0.68; c.beginPath(); c.arc(ax + a2 / 2, y + th + a2 / 2, a2 / 2 + 0.6, PI, 0); c.stroke(); }
    /* Brüstung */
    c.fillStyle = shade(col, 0.05); c.fillRect(x0, y - 2.5, w, 2.5); c.fillStyle = rgba(o.pal.light, 0.3); c.fillRect(x0, y - 2.5, w, 0.5);
    if (op.lamps) for (let xx = x0 + aw / 2; xx < x1; xx += aw) { c.fillStyle = "#2a1e16"; c.fillRect(xx - 0.3, y - 7, 0.6, 4.5); o.lights.push({ x: xx, y: y - 7.5, r: 6, col: WARM, ph: o.R() * 9, a: 0.6, f: 2 }); c.fillStyle = WARM; c.fillRect(xx - 0.7, y - 8.4, 1.4, 1.6); }
  }
  /* Treppe (Stufenfolge) */
  function stairs(o, x, y, n, sw, sh, dir, col, depth) {
    const c = o.c; depth = depth || 6;
    for (let k = 0; k < n; k++) { const sx = x + dir * k * sw, sy = y - k * sh; c.fillStyle = shade(col, 0.15); c.fillRect(Math.min(sx, sx + dir * sw), sy - sh, sw + 0.2, 0.6); c.fillStyle = shade(col, -0.1 - (k % 2) * 0.05); c.fillRect(Math.min(sx, sx + dir * sw), sy - sh + 0.6, sw + 0.2, sh - 0.6); c.fillStyle = shade(col, -0.35); c.fillRect(Math.min(sx, sx + dir * sw), sy, sw + 0.2, depth); }
  }
  function balustrade(o, x0, x1, y, col, hgt) {
    const c = o.c; hgt = hgt || 4;
    c.fillStyle = shade(col, 0.08); c.fillRect(x0, y - hgt, x1 - x0, 0.9); c.fillRect(x0, y - 0.8, x1 - x0, 0.8);
    c.fillStyle = rgba(o.pal.light, 0.3); c.fillRect(x0, y - hgt, x1 - x0, 0.35);
    for (let xx = x0 + 1; xx < x1 - 0.5; xx += 1.7) { c.fillStyle = shade(col, -0.05); c.beginPath(); c.ellipse(xx, y - hgt / 2, 0.45, hgt / 2 - 0.6, 0, 0, TAU); c.fill(); }
  }

  /* ---------- Häuser, Kirchen ---------- */
  function house(o, x, base, w, h, op) {
    op = op || {}; const { c, R, pal } = o; const far = op.far || 0;
    const wallc = o.hz(op.wall || R.pick(pal.plaster), far), timber = o.hz("#3a2418", far * 0.9), stone = o.hz(pal.stone, far);
    const gh = h * (0.38 + R() * 0.1), jet = far < 0.6 && w > 10 ? 1.1 : 0;
    body(o, x, base - gh, w, gh, stone, 0.6); if (far < 0.5) masonry(o, x, base - gh, w, gh, stone, 2.3);
    body(o, x - jet, base - h, w + jet * 2, h - gh, wallc, 0.6);
    c.fillStyle = "rgba(0,0,0,.35)"; c.fillRect(x - jet, base - gh, w + jet * 2, 0.8);
    if (far < 0.7 && op.timber !== false) {
      c.strokeStyle = timber; c.lineWidth = far < 0.3 ? 0.75 : 0.55; c.strokeRect(x - jet + 0.4, base - h + 0.4, w + jet * 2 - 0.8, h - gh - 0.8);
      const step = 4.4 + R() * 1.6, mid = base - h + (h - gh) * 0.5; c.beginPath();
      for (let xx = x - jet + step; xx < x + w + jet - 1; xx += step) { c.moveTo(xx, base - h); c.lineTo(xx, base - gh); if (R() < 0.45) { c.moveTo(xx - step, mid); c.lineTo(xx, base - h); } else if (R() < 0.3) { c.moveTo(xx - step, base - gh); c.lineTo(xx, mid); c.moveTo(xx - step, mid); c.lineTo(xx, base - gh); } }
      c.moveTo(x - jet, mid); c.lineTo(x + w + jet, mid); c.stroke();
    }
    /* Fenster mit Läden */
    const ww = Math.max(1.6, Math.min(3, w / 7));
    for (let xx = x + 2.2; xx < x + w - ww - 1; xx += ww + 3 + R() * 2) {
      const lit = R() < (op.lit == null ? pal.lit * 1.15 : op.lit), wy = base - h + (h - gh) * 0.22;
      win(o, xx, wy, ww, ww * 1.4, { k: "rect", lit, far: far > 0.45, frame: far < 0.5 ? rgba(timber, 0.9) : null });
      if (far < 0.4 && !lit && R() < 0.5) { c.fillStyle = o.hz("#5a2a1e", far); c.fillRect(xx - 1, wy, 0.9, ww * 1.4); c.fillRect(xx + ww + 0.1, wy, 0.9, ww * 1.4); }
      if (far < 0.4 && R() < 0.25) { c.fillStyle = "#6a3a20"; c.fillRect(xx - 0.4, wy + ww * 1.4 + 0.6, ww + 0.8, 0.8); for (let k = 0; k < 3; k++) { c.fillStyle = R.pick(["#c83a3a", "#e0b040", "#d86aa0"]); c.fillRect(xx + R() * ww, wy + ww * 1.4 - 0.1, 0.7, 0.7); } }
    }
    if (far < 0.6) { const dx = x + w * (0.2 + R() * 0.5); door(o, dx, base, Math.min(3.4, w * 0.22), Math.min(6, gh * 0.85), { open: R() < 0.12 }); }
    const rh = op.rh || w * (0.55 + R() * 0.5); const roofc = o.hz(op.roof || R.pick(pal.roofs), far * 0.9);
    gableRoof(o, x - jet - 1.4, base - h, w + jet * 2 + 2.8, rh, roofc, { hip: R() < 0.3, moss: far < 0.4 ? pal.moss : null });
    if (R() < 0.8) {
      const chx = x + w * (0.55 + R() * 0.3), chy = base - h - rh * 0.45;
      c.fillStyle = shade(stone, -0.2); c.fillRect(chx, chy - 5, 2.6, 7); c.fillStyle = shade(stone, 0.1); c.fillRect(chx - 0.4, chy - 5.6, 3.4, 1);
      if (R() < (op.smoke == null ? 0.7 : op.smoke)) o.smoke.push({ x: chx + 1.3, y: chy - 6, ph: R() * 10, s: 0.5 + R() * 0.5 });
    }
    if (R() < 0.3 && far < 0.4) { /* Wirtshausschild */ c.fillStyle = "#2a1a10"; c.fillRect(x + w + jet, base - h + 3, 3, 0.4); c.fillStyle = "#8a5a2a"; c.fillRect(x + w + jet + 1, base - h + 3.6, 2.4, 2.2); }
  }
  function church(o, cx, base, s, far) {
    const { c, R, pal } = o; const col = o.hz(pal.stone, far), roof = o.hz(pal.roofs[2], far * 0.9);
    const nw = 50 * s, nh = 26 * s, nx = cx - 10 * s;
    body(o, nx, base - nh, nw, nh, col); if (far < 0.5) masonry(o, nx, base - nh, nw, nh, col, 2.6);
    for (let k = 0; k < 4; k++) win(o, nx + 6 * s + k * 11 * s, base - nh + 6 * s, 3 * s, 11 * s, { k: "point", lit: R() < 0.7, col: R.pick(["#ffcf7a", "#ffb060", "#e8a0d0"]), far: far > 0.45 });
    for (let k = 0; k < 5; k++) buttress(o, nx + k * 11.5 * s - 1, base - nh * 0.8, base, 2.4 * s, col);
    gableRoof(o, nx - 2, base - nh, nw + 4, 18 * s, roof, { hip: true });
    tower(o, cx - 26 * s, base, 18 * s, 70 * s, col, { head: "spire", far, wk: "point", garg: far < 0.4, oriel: 0 });
    /* Rosette */
    const rx = nx + nw - 4 * s, ry = base - nh - 6 * s; c.fillStyle = shade(col, 0.1); c.beginPath(); c.arc(rx, ry, 4 * s, 0, TAU); c.fill(); c.fillStyle = "#ffb060"; c.beginPath(); c.arc(rx, ry, 3 * s, 0, TAU); c.fill();
    o.lights.push({ x: rx, y: ry, r: 10 * s, col: "#ffb060", ph: R() * 9, a: 0.4, f: 1 });
  }

  /* ---------- Landschaft ---------- */
  /* periodischer Grat (passt an der Naht) */
  function ridgeFn(seed, ks) {
    const r = Rng(seed * 7919 + 13); const ph = ks.map(() => r() * TAU), am = ks.map((k, i) => (0.6 + r() * 0.6) / Math.pow(k, 0.75));
    let norm = 0; for (const a of am) norm += a;
    return x => { let v = 0; for (let i = 0; i < ks.length; i++) { const s = Math.sin(x / PW * PI * ks[i] + ph[i]); v += am[i] * (i < 3 ? 1 - Math.abs(s) : s * 0.5 + 0.5); } return v / norm; };
  }
  function range(o, base, amp, col, seed, op) {
    op = op || {}; const { c, R } = o; const f = ridgeFn(seed, op.ks || [3, 5, 8, 13, 21, 34]), y = x => base - amp * f(x);
    let minY = 1e9; for (let x = 0; x <= PW; x += 6) minY = Math.min(minY, y(x));
    const g = c.createLinearGradient(0, minY, 0, base + 30); g.addColorStop(0, shade(col, 0.04)); g.addColorStop(0.6, col); g.addColorStop(1, mix(col, o.pal.fog, 0.45));
    c.fillStyle = g; c.beginPath(); c.moveTo(0, o.H + 5); for (let x = 0; x <= PW; x += 3) c.lineTo(x, y(x)); c.lineTo(PW, o.H + 5); c.closePath(); c.fill();
    /* Licht- und Schattenflanken, weich gestaffelt */
    const lit = shade(col, 0.45), dk = shade(col, -0.4);
    for (const [k, al] of [[0.55, (op.lit || 0.18) * 0.8]]) {
      const pl = new Path2D(), pd = new Path2D();
      for (let x = 0; x < PW; x += 3) { const a = y(x), b = y(x + 3), d = (base - Math.min(a, b)) * k; const P2 = b < a - 0.15 ? pl : b > a + 0.15 ? pd : null; if (!P2) continue; const sk = (b < a ? -0.25 : 0.25) * d; P2.moveTo(x, a); P2.lineTo(x + 3, b); P2.lineTo(x + 3 + sk, b + d); P2.lineTo(x + sk, a + d); P2.closePath(); }
      c.fillStyle = rgba(lit, al); c.fill(pl); c.fillStyle = rgba(dk, al * 0.8); c.fill(pd);
    }
    /* Rinnen, Felsbänder, Geröll */
    c.strokeStyle = rgba(shade(col, -0.35), 0.45); c.lineWidth = 0.45; c.beginPath();
    for (let x = 6; x < PW; x += 6 + R() * 12) { let px = x, py = y(x) + 2; c.moveTo(px, py); const n = 3 + (R() * 6 | 0); for (let k = 0; k < n; k++) { px += (R() - 0.3) * 4; py += 3 + R() * 6; c.lineTo(px, py); } }
    c.stroke();
    c.fillStyle = rgba(lit, 0.08); for (let i = 0; i < PW / 5; i++) { const x = R() * PW, yy = y(x) + R() * (base - y(x)); c.fillRect(x, yy, 2 + R() * 6, 0.6); }
    /* Bergwald am Fuß */
    if (op.forest !== false) { const fc = mix(o.pal.leaf[0], o.pal.fog, 0.55), pth = new Path2D(); for (let x = 0; x < PW; x += 1.6 + R() * 1.6) { const top = base - amp * (0.06 + R() * 0.12) + 6; if (top < y(x)) continue; const h = 3 + R() * 4; pth.moveTo(x, top - h); pth.lineTo(x - h * 0.35, top + 1); pth.lineTo(x + h * 0.35, top + 1); pth.closePath(); } c.fillStyle = fc; c.fill(pth); c.fillRect(0, base - amp * 0.06 + 6, PW, 40); }
    if (op.snow) {
      const sl = base - amp * op.snow, sc = op.snowCol || "#e8dce0";
      const ps = new Path2D(), psd = new Path2D();
      for (let x = 0; x < PW; x += 3) { const a = y(x), b = y(x + 3); if (a < sl || b < sl) { const d1 = Math.max(0, sl - a) * (0.7 + R() * 0.5), d2 = Math.max(0, sl - b) * (0.7 + R() * 0.5); (b < a ? ps : psd).moveTo(x, a); const P2 = b < a ? ps : psd; P2.lineTo(x + 3, b); P2.lineTo(x + 3, b + d2); P2.lineTo(x, a + d1); P2.closePath(); } }
      c.fillStyle = sc; c.fill(ps); c.fillStyle = mix(sc, col, 0.45); c.fill(psd);
    }
    return y;
  }
  function hillsF(o, yf, col, op) {
    op = op || {}; const c = o.c;
    c.fillStyle = col; c.beginPath(); c.moveTo(0, o.H + 5); for (let x = 0; x <= PW; x += 4) c.lineTo(x, yf(x)); c.lineTo(PW, o.H + 5); c.closePath(); c.fill();
    c.strokeStyle = rgba(o.pal.light, op.rim || 0.18); c.lineWidth = 0.7; c.beginPath(); for (let x = 0; x <= PW; x += 4) { const a = yf(x), b = yf(x + 4); if (b <= a + 0.3) { c.moveTo(x, a); c.lineTo(x + 4, b); } } c.stroke();
  }
  const sinF = (base, parts) => x => { let v = base; for (const [a, k, p] of parts) v -= a * Math.sin(x / PW * TAU * k + p); return v; };
  /* Felder als Flickenteppich mit Hecken */
  function fields(o, yf, depth, far, cols) {
    const { c, R } = o; cols = cols.map(cc => o.hz(cc, far));
    const furrow = new Path2D(), hedge = new Path2D();
    let x = 0; while (x < PW) {
      const w = 26 + R() * 50, x2 = Math.min(PW, x + w), sk = (R() - 0.5) * 10;
      for (const [d0, d1] of [[2, depth * 0.45], [depth * 0.45, depth]]) {
        const col = R.pick(cols); c.fillStyle = col; c.beginPath(); c.moveTo(x, yf(x) + d0); c.lineTo(x2, yf(x2) + d0); c.lineTo(x2 + sk, yf(x2) + d1); c.lineTo(x + sk, yf(x) + d1); c.closePath(); c.fill();
        /* Furchen parallel zum Hang */
        for (let d = d0 + 1.2; d < d1 - 0.6; d += 1.6) { const u = (d - d0) / Math.max(1, d1 - d0), ox = sk * u; furrow.moveTo(x + ox + 1, yf(x) + d); furrow.lineTo(x2 + ox - 1, yf(x2) + d); }
      }
      for (let k = 0; k < depth; k += 1.6) { const hx = x + sk * k / depth, hy = yf(x) + k, r = 0.9 + R() * 0.5; hedge.moveTo(hx + r, hy); hedge.arc(hx, hy, r, 0, TAU); }
      for (let k = x; k < x2; k += 1.8) { const hy = yf(k) + depth * 0.45, r = 0.7 + R() * 0.5; hedge.moveTo(k + r, hy); hedge.arc(k, hy, r, 0, TAU); }
      if (R() < 0.35) tree(o, x + sk * 0.5, yf(x) + depth * 0.5, 7 + R() * 5, { cols: o.pal.leaf.map(cc => o.hz(cc, far)), trunk: o.hz("#2a1c14", far) });
      x = x2;
    }
    c.strokeStyle = "rgba(0,0,0,.14)"; c.lineWidth = 0.35; c.stroke(furrow);
    c.fillStyle = o.hz("#1e2a16", far * 0.8); c.fill(hedge);
  }
  function tree(o, x, base, h, op) {
    op = op || {}; const { c, R } = o; const cols = op.cols || o.pal.leaf; const tr = op.trunk || "#2a1c14";
    const cy = base - h * 0.62, rx = h * (op.wide || 0.34), ry = h * 0.36;
    c.fillStyle = tr; c.beginPath(); c.moveTo(x - h * 0.05, base); c.lineTo(x - h * 0.02, cy); c.lineTo(x + h * 0.02, cy); c.lineTo(x + h * 0.05, base); c.fill();
    c.strokeStyle = tr; c.lineWidth = Math.max(0.35, h * 0.025); c.beginPath(); c.moveTo(x, base - h * 0.35); c.lineTo(x - rx * 0.5, cy - ry * 0.1); c.moveTo(x, base - h * 0.45); c.lineTo(x + rx * 0.45, cy - ry * 0.3); c.stroke();
    const n = 8 + (h / 3 | 0), pts = [];
    for (let i = 0; i < n; i++) { const a = R() * TAU, d = Math.sqrt(R()); pts.push([x + Math.cos(a) * rx * d * 0.78, cy + Math.sin(a) * ry * d * 0.78, (0.28 + R() * 0.25) * rx]); }
    const pass = [[cols[0], 0.16, 0.14, 1], [cols[1], -0.02, -0.03, 0.76], [cols[2], -0.2, -0.24, 0.42]];
    for (const [col, dx, dy, sc] of pass) { c.fillStyle = col; c.beginPath(); for (let i = 0; i < pts.length; i++) { const [px, py, r] = pts[i]; if (sc < 0.5 && (i % 3) === 0) continue; const rr = r * sc, qx = px + dx * rx, qy = py + dy * ry; c.moveTo(qx + rr, qy); c.arc(qx, qy, rr, 0, TAU); } c.fill(); }
  }
  function pine(o, x, base, h, col, lit) {
    const c = o.c; const w = h * 0.32;
    c.fillStyle = col; c.beginPath();
    for (let k = 0; k < 5; k++) { const ty = base - h + k * h * 0.16, bw = w * (0.3 + k * 0.18), th = h * 0.27; c.moveTo(x, ty); c.lineTo(x - bw, ty + th); c.lineTo(x - bw * 0.4, ty + th - 1); c.lineTo(x, ty + th + 0.5); c.lineTo(x + bw * 0.45, ty + th - 1); c.lineTo(x + bw, ty + th); c.closePath(); }
    c.fill(); c.fillRect(x - 0.45, base - h * 0.15, 0.9, h * 0.15);
    if (lit) { c.fillStyle = lit; c.beginPath(); for (let k = 0; k < 5; k++) { const ty = base - h + k * h * 0.16, bw = w * (0.3 + k * 0.18), th = h * 0.27; c.moveTo(x, ty); c.lineTo(x - bw, ty + th); c.lineTo(x - bw * 0.35, ty + th * 0.78); c.closePath(); } c.fill(); }
  }
  function cypress(o, x, base, h, col, lit) { const c = o.c; c.fillStyle = col; c.beginPath(); c.ellipse(x, base - h * 0.5, h * 0.13, h * 0.5, 0, 0, TAU); c.fill(); if (lit) { c.fillStyle = lit; c.beginPath(); c.ellipse(x - h * 0.04, base - h * 0.55, h * 0.06, h * 0.4, 0, 0, TAU); c.fill(); } }
  function deadTree(o, x, base, h, col) {
    const { c, R } = o; c.strokeStyle = col; c.lineCap = "round";
    const br = (x0, y0, a, len, w, d) => { const x1 = x0 + Math.cos(a) * len, y1 = y0 + Math.sin(a) * len; c.lineWidth = w; c.beginPath(); c.moveTo(x0, y0); c.quadraticCurveTo((x0 + x1) / 2 + (R() - 0.5) * len * 0.3, (y0 + y1) / 2, x1, y1); c.stroke(); if (d > 0) { const n = 2 + (R() < 0.4 ? 1 : 0); for (let i = 0; i < n; i++) br(x1, y1, a + (i - (n - 1) / 2) * 0.7 + (R() - 0.5) * 0.5, len * (0.55 + R() * 0.2), w * 0.62, d - 1); } };
    br(x, base, -PI / 2 + (R() - 0.5) * 0.2, h * 0.42, h * 0.07, 4); c.lineCap = "butt";
  }
  /* Felsmassiv mit Schichten, Kanten im Licht, Moos */
  function crag(o, pts, base, col, op) {
    op = op || {}; const { c, R } = o;
    const x0 = pts[0][0], x1 = pts[pts.length - 1][0], span = x1 - x0;
    /* Oberkante an Stelle x (ohne teures Clipping) */
    let seg = 0; const topAt = x => { if (x <= x0) return pts[0][1]; if (x >= x1) return pts[pts.length - 1][1]; while (seg > 0 && pts[seg][0] > x) seg--; while (seg < pts.length - 2 && pts[seg + 1][0] < x) seg++; const a = pts[seg], b = pts[seg + 1]; return a[1] + (b[1] - a[1]) * (x - a[0]) / Math.max(0.01, b[0] - a[0]); };
    let minY = 1e9; for (const p2 of pts) minY = Math.min(minY, p2[1]);
    c.beginPath(); c.moveTo(x0, base); for (const p2 of pts) c.lineTo(p2[0], p2[1]); c.lineTo(x1, base); c.closePath();
    const g = c.createLinearGradient(0, minY, 0, base); g.addColorStop(0, shade(col, 0.1)); g.addColorStop(1, shade(col, -0.35)); c.fillStyle = g; c.fill();
    /* Schichtfugen */
    const sp = new Path2D();
    for (let yy = minY + 3; yy < base; yy += 3 + R() * 5) { let xx = x0, pen = false, wy = yy; while (xx < x1) { const nx = Math.min(x1, xx + 6 + R() * 10), ny = yy + (R() - 0.5) * 3; if (topAt(nx) < ny - 1 && topAt(xx) < wy - 1) { if (!pen) sp.moveTo(xx, wy); sp.lineTo(nx, ny); pen = true; } else pen = false; xx = nx; wy = ny; } }
    c.strokeStyle = rgba(shade(col, -0.5), 0.5); c.lineWidth = 0.5; c.stroke(sp);
    /* Klüfte und helle Facetten – gesammelt, je ein Füllaufruf */
    const pl = new Path2D(), pd = new Path2D();
    for (let i = 0; i < span / 7; i++) {
      const x = x0 + R() * span, t = topAt(x), w = 3 + R() * 9, h = 4 + R() * 12, y = t + 2 + R() * Math.max(1, base - t - h - 2);
      if (topAt(x + w * 0.5) > y - 1) continue;
      pl.moveTo(x, y); pl.lineTo(x + w * 0.3, y - h * 0.2); pl.lineTo(x + w * 0.4, y + h); pl.lineTo(x - w * 0.1, y + h * 0.8); pl.closePath();
      pd.moveTo(x + w * 0.4, y); pd.lineTo(x + w * 0.55, y + h * 1.1); pd.lineTo(x + w * 0.45, y + h * 1.1); pd.closePath();
    }
    c.fillStyle = rgba(shade(col, 0.35), 0.2); c.fill(pl); c.fillStyle = rgba(shade(col, -0.6), 0.35); c.fill(pd);
    /* Kante im Licht, Moos und Grasbüschel */
    c.strokeStyle = rgba(o.pal.light, 0.3); c.lineWidth = 0.6; c.beginPath(); c.moveTo(pts[0][0], pts[0][1]); for (const p2 of pts) c.lineTo(p2[0], p2[1]); c.stroke();
    if (op.moss) { const mp = new Path2D(); for (let i = 1; i < pts.length; i++) { const [xa, ya] = pts[i - 1], [xb, yb] = pts[i]; if (Math.abs(yb - ya) < (xb - xa) * 0.8) for (let x = xa; x < xb; x += 1.4) { const yy = ya + (yb - ya) * (x - xa) / (xb - xa), r = 0.6 + R() * 1; mp.moveTo(x + r, yy + 0.6); mp.arc(x, yy + 0.6, r, 0, TAU); } } c.fillStyle = op.moss; c.fill(mp); }
  }
  /* zackige Felslinie zu Punktliste */
  function jag(R, x0, x1, yf, step, amp) { const pts = []; for (let x = x0; x <= x1; x += step * (0.6 + R() * 0.8)) pts.push([x, yf(x) + (R() - 0.5) * amp]); pts.push([x1, yf(x1)]); return pts; }
  function mist(o, y, h, col, a) { const c = o.c; const g = c.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, rgba(col, 0)); g.addColorStop(0.5, rgba(col, a)); g.addColorStop(1, rgba(col, 0)); c.fillStyle = g; c.fillRect(0, y, PW, h); }
  /* gemalte Wolke: dunkle Unterseite, beleuchtete Oberseite */
  function cloud(o, x, y, w, h, col, lit, op) {
    op = op || {}; const { c, R } = o; const n = 6 + (w / 10 | 0), pts = [];
    for (let i = 0; i < n; i++) { const u = i / (n - 1); pts.push([x + u * w + (R() - 0.5) * 6, y - Math.sin(u * PI) * h * (0.4 + R() * 0.5), h * (0.25 + Math.sin(u * PI) * 0.45) * (0.7 + R() * 0.5)]); }
    c.fillStyle = shade(col, -0.3); c.beginPath(); c.ellipse(x + w / 2, y + h * 0.12, w / 2 + 6, h * 0.32, 0, 0, TAU); for (const [px, py, r] of pts) { c.moveTo(px + r, py + r * 0.35); c.arc(px, py + r * 0.35, r, 0, TAU); } c.fill();
    c.fillStyle = col; c.beginPath(); for (const [px, py, r] of pts) { c.moveTo(px + r * 0.92, py); c.arc(px, py, r * 0.92, 0, TAU); } c.fill();
    if (op.back) { c.save(); c.beginPath(); for (const [px, py, r] of pts) { c.moveTo(px + r * 0.92, py); c.arc(px, py, r * 0.92, 0, TAU); } c.clip(); c.fillStyle = lit; c.beginPath(); for (const [px, py, r] of pts) { c.moveTo(px + r * 0.9, py - r * 0.42); c.arc(px, py - r * 0.42, r * 0.9, 0, TAU); } c.globalAlpha = 0.35; c.fill(); c.globalAlpha = 1; c.fillStyle = col; c.beginPath(); for (const [px, py, r] of pts) { c.moveTo(px + r * 0.85, py + r * 0.12); c.arc(px, py + r * 0.12, r * 0.85, 0, TAU); } c.fill(); c.restore(); }
    else { c.fillStyle = lit; c.beginPath(); for (const [px, py, r] of pts) { c.moveTo(px - r * 0.2 + r * 0.6, py - r * 0.3); c.arc(px - r * 0.2, py - r * 0.3, r * 0.6, 0, TAU); } c.fill(); }
    /* Saum im Gegenlicht */
    c.strokeStyle = rgba(lit, 0.5); c.lineWidth = 0.6; c.beginPath(); for (const [px, py, r] of pts) { c.moveTo(px + Math.cos(3.6) * r * 0.92, py + Math.sin(3.6) * r * 0.92); c.arc(px, py, r * 0.92, 3.6, 5.2); } c.stroke();
  }
  /* Fluss / Gewässer-Glanzlichter */
  function addGlints(o, x0, x1, y0, y1, n, col, a) { const R = o.R; for (let i = 0; i < n; i++) o.glints.push({ x: x0 + R() * (x1 - x0), y: y0 + R() * (y1 - y0), w: 2 + R() * 8, ph: R() * TAU, sp: 0.6 + R() * 1.6, col: col || "#ffe8c8", a: a || 0.35 }); }
  /* Windmühle (Flügel drehen sich live) */
  function windmill(o, x, base, s, far) {
    const { c, R } = o; const col = o.hz("#8a7a66", far), roof = o.hz(o.pal.roofs[1], far);
    c.fillStyle = col; c.beginPath(); c.moveTo(x - 5 * s, base); c.lineTo(x - 3.2 * s, base - 22 * s); c.lineTo(x + 3.2 * s, base - 22 * s); c.lineTo(x + 5 * s, base); c.fill();
    c.fillStyle = "rgba(0,0,0,.25)"; c.beginPath(); c.moveTo(x + 1 * s, base); c.lineTo(x + 0.8 * s, base - 22 * s); c.lineTo(x + 3.2 * s, base - 22 * s); c.lineTo(x + 5 * s, base); c.fill();
    win(o, x - 0.6 * s, base - 14 * s, 1.4 * s, 2 * s, { k: "rect", lit: R() < 0.7, far: far > 0.45 }); door(o, x - 1.2 * s, base, 2.4 * s, 4 * s);
    gableRoof(o, x - 4 * s, base - 22 * s, 8 * s, 5 * s, roof, { plain: true });
    const r = 15 * s; const sp = mkSprite(o, r * 2 + 4, r * 2 + 4, r + 2, r + 2, so => { const sc = so.c; const wood = o.hz("#5a4030", far), cloth = o.hz("#d8c8a8", far);
      for (let k = 0; k < 4; k++) { sc.save(); sc.rotate(k * PI / 2); sc.fillStyle = wood; sc.fillRect(-0.4, 0, 0.8, r); sc.fillStyle = cloth; sc.fillRect(0.5, r * 0.25, r * 0.22, r * 0.72); sc.strokeStyle = wood; sc.lineWidth = 0.25; for (let j = 0.3; j < 1; j += 0.12) { sc.beginPath(); sc.moveTo(0.5, r * j); sc.lineTo(0.5 + r * 0.22, r * j); sc.stroke(); } sc.restore(); }
      sc.fillStyle = wood; sc.beginPath(); sc.arc(0, 0, 1.2, 0, TAU); sc.fill(); });
    o.spin.push({ sp, x, y: base - 20 * s, w: 0.35 + R() * 0.3 });
  }

  /* ======================= INNENRÄUME ======================= */
  /* gebündelte Säule mit Basis und Blattkapitell */
  function column(o, x, top, base, w, col, op) {
    op = op || {}; const c = o.c;
    body(o, x - w / 2, top, w, base - top, col, 1.2);
    c.fillStyle = rgba(shade(col, -0.45), 0.5); for (let k = 1; k < 4; k++) c.fillRect(x - w / 2 + w * k / 4 - 0.2, top + 3, 0.4, base - top - 6);
    c.fillStyle = rgba(o.pal.light, 0.16); c.fillRect(x - w / 2 + 0.6, top + 3, 0.6, base - top - 6);
    /* Basis */
    body(o, x - w / 2 - 1.6, base - 5, w + 3.2, 5, shade(col, 0.05)); body(o, x - w / 2 - 0.8, base - 7, w + 1.6, 2, shade(col, 0.1));
    /* Kapitell */
    body(o, x - w / 2 - 2, top - 2.4, w + 4, 2.4, shade(col, 0.1)); c.fillStyle = shade(col, -0.05);
    c.beginPath(); for (let k = 0; k < 5; k++) { const lx = x - w / 2 - 1 + k * (w + 2) / 4; c.moveTo(lx + 1.6, top + 2); c.arc(lx, top + 2, 1.6, 0, TAU); } c.fill();
    c.fillStyle = rgba(o.pal.light, 0.2); c.beginPath(); for (let k = 0; k < 5; k++) { const lx = x - w / 2 - 1.4 + k * (w + 2) / 4; c.moveTo(lx + 0.8, top + 1.4); c.arc(lx, top + 1.4, 0.8, 0, TAU); } c.fill();
    if (op.ring) for (let yy = top + 20; yy < base - 20; yy += 34) { c.fillStyle = shade(col, 0.12); c.fillRect(x - w / 2 - 0.6, yy, w + 1.2, 1.2); }
  }
  /* Spitzbogen-Rippen zwischen zwei Säulen bis zum Scheitel */
  function ribs(o, x0, x1, ySpring, yCrown, col, w) {
    const c = o.c; w = w || 2; const mx = (x0 + x1) / 2;
    c.lineCap = "round";
    for (const [lw, cc] of [[w + 1.4, shade(col, -0.45)], [w, col], [w * 0.35, rgba(o.pal.light, 0.35)]]) {
      c.strokeStyle = cc; c.lineWidth = lw; c.beginPath();
      c.moveTo(x0, ySpring); c.quadraticCurveTo(x0, yCrown, mx, yCrown); c.moveTo(x1, ySpring); c.quadraticCurveTo(x1, yCrown, mx, yCrown);
      c.moveTo(x0, ySpring); c.quadraticCurveTo(x0 + (x1 - x0) * 0.2, yCrown - (ySpring - yCrown) * 0.15, mx, yCrown - (ySpring - yCrown) * 0.35);
      c.moveTo(x1, ySpring); c.quadraticCurveTo(x1 - (x1 - x0) * 0.2, yCrown - (ySpring - yCrown) * 0.15, mx, yCrown - (ySpring - yCrown) * 0.35);
      c.stroke();
    }
    c.lineCap = "butt";
    c.fillStyle = "#b08a40"; c.beginPath(); c.arc(mx, yCrown, w * 0.9, 0, TAU); c.fill(); c.fillStyle = "rgba(255,240,200,.4)"; c.beginPath(); c.arc(mx - 0.4, yCrown - 0.4, w * 0.35, 0, TAU); c.fill();
  }
  /* Bleiglasfenster (Spitzbogen) mit Mosaik, Maßwerk und Lichtschacht */
  const GLASS = ["#c8382e", "#e0a83a", "#6a9a3a", "#8a3a9a", "#d86a2a", "#b02a5a", "#e8d070", "#4a8a4a", "#a84ab0"];
  function glassWin(o, x, y, w, h, op) {
    op = op || {}; const { c, R } = o; const far = op.far || 0;
    c.fillStyle = o.hz("#1a1014", far); winPath(c, x - 1.6, y - 1.6, w + 3.2, h + 2.4, "point"); c.fill();
    c.save(); winPath(c, x, y, w, h, "point"); c.clip();
    const cell = Math.max(1.6, w / 8);
    for (let yy = y; yy < y + h; yy += cell) for (let xx = x; xx < x + w; xx += cell) { c.fillStyle = o.hz(R.pick(GLASS), far * 0.8); c.globalAlpha = 0.65 + R() * 0.35; c.fillRect(xx + (R() - 0.5) * 0.6, yy + (R() - 0.5) * 0.6, cell + 0.4, cell + 0.4); }
    c.globalAlpha = 1;
    /* Figur im Fenster: Heiliger / Ritter */
    if (w > 10 && !op.plain) { const fx = x + w / 2, fy = y + h * 0.35; c.fillStyle = o.hz("#e8c890", far); c.beginPath(); c.arc(fx, fy, w * 0.12, 0, TAU); c.fill(); c.fillStyle = o.hz("#a02a3a", far); c.beginPath(); c.moveTo(fx - w * 0.18, fy + h * 0.38); c.lineTo(fx - w * 0.1, fy + w * 0.14); c.lineTo(fx + w * 0.1, fy + w * 0.14); c.lineTo(fx + w * 0.18, fy + h * 0.38); c.fill(); c.strokeStyle = o.hz("#f0d070", far); c.lineWidth = 0.6; c.beginPath(); c.arc(fx, fy, w * 0.2, PI * 1.1, PI * 1.9); c.stroke(); }
    /* Bleiruten */
    c.strokeStyle = "rgba(20,12,14,.85)"; c.lineWidth = 0.45; c.beginPath();
    for (let yy = y + cell; yy < y + h; yy += cell * 2) { c.moveTo(x, yy); c.lineTo(x + w, yy); }
    for (let xx = x + w / 4; xx < x + w; xx += w / 4) { c.moveTo(xx, y); c.lineTo(xx, y + h); }
    c.stroke(); c.restore();
    /* Maßwerk: Dreipass oben */
    c.strokeStyle = o.hz("#2a1c1c", far); c.lineWidth = Math.max(0.6, w * 0.06);
    c.beginPath(); c.moveTo(x + w / 2, y + w * 0.6); c.lineTo(x + w / 2, y + h); c.stroke();
    c.beginPath(); c.arc(x + w / 2, y + w * 0.45, w * 0.2, 0, TAU); c.stroke();
    if (!op.nolight) { o.lights.push({ x: x + w / 2, y: y + h / 2, r: w * 2.2, col: "#ffb070", ph: R() * 9, a: 0.28, f: 1, soft: true }); }
    if (op.shaft) o.shafts.push({ x: x, y: y + h * 0.3, w, len: op.shaft, ang: op.ang || 0.5, col: "#ffc890", a: op.sa || 0.06, ph: R() * 9 });
  }
  function rose(o, cx, cy, r, far) {
    const { c, R } = o;
    c.fillStyle = o.hz("#1a1014", far); c.beginPath(); c.arc(cx, cy, r + 2.4, 0, TAU); c.fill();
    const n = 12;
    for (let ring = 0; ring < 3; ring++) { const r0 = r * ring / 3, r1 = r * (ring + 1) / 3; for (let k = 0; k < n * (ring + 1) / 2 + 2; k++) { const m = Math.round(n * (ring + 1) / 2 + 2), a0 = k / m * TAU, a1 = (k + 1) / m * TAU; c.fillStyle = o.hz(R.pick(GLASS), far * 0.8); c.beginPath(); c.arc(cx, cy, r1, a0, a1); c.arc(cx, cy, r0, a1, a0, true); c.fill(); } }
    c.strokeStyle = o.hz("#22161a", far); c.lineWidth = 0.7; c.beginPath();
    for (let k = 0; k < n; k++) { const a = k / n * TAU; c.moveTo(cx + Math.cos(a) * r * 0.2, cy + Math.sin(a) * r * 0.2); c.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r); }
    for (let k = 1; k <= 3; k++) { c.moveTo(cx + r * k / 3, cy); c.arc(cx, cy, r * k / 3, 0, TAU); } c.stroke();
    for (let k = 0; k < n; k++) { const a = (k + 0.5) / n * TAU; c.beginPath(); c.arc(cx + Math.cos(a) * r * 0.72, cy + Math.sin(a) * r * 0.72, r * 0.14, 0, TAU); c.stroke(); }
    c.fillStyle = "#f0d070"; c.beginPath(); c.arc(cx, cy, r * 0.12, 0, TAU); c.fill();
    o.lights.push({ x: cx, y: cy, r: r * 2.6, col: "#ffb070", ph: R() * 9, a: 0.32, f: 1, soft: true });
  }
  /* Statue in Nische: Ritter mit Schwert und Schild oder Gestalt mit Robe */
  function statue(o, x, base, s, col, op) {
    op = op || {}; const c = o.c;
    if (op.niche) { c.fillStyle = shade(col, -0.45); winPath(c, x - 7 * s, base - 34 * s, 14 * s, 34 * s, "point"); c.fill(); c.fillStyle = "rgba(0,0,0,.3)"; winPath(c, x - 6 * s, base - 33 * s, 12 * s, 30 * s, "point"); c.fill(); }
    const g = c.createLinearGradient(x - 5 * s, 0, x + 5 * s, 0); g.addColorStop(0, shade(col, 0.3)); g.addColorStop(0.5, col); g.addColorStop(1, shade(col, -0.4)); c.fillStyle = g;
    c.fillRect(x - 5 * s, base - 4 * s, 10 * s, 4 * s); c.fillRect(x - 4 * s, base - 5 * s, 8 * s, 1 * s); /* Sockel */
    if (op.robe) { c.beginPath(); c.moveTo(x - 3.6 * s, base - 5 * s); c.quadraticCurveTo(x - 3 * s, base - 18 * s, x - 2 * s, base - 22 * s); c.lineTo(x + 2 * s, base - 22 * s); c.quadraticCurveTo(x + 3 * s, base - 18 * s, x + 3.6 * s, base - 5 * s); c.fill(); c.beginPath(); c.arc(x, base - 24 * s, 2.2 * s, 0, TAU); c.fill(); c.beginPath(); c.moveTo(x - 2.6 * s, base - 22 * s); c.quadraticCurveTo(x, base - 29 * s, x + 2.6 * s, base - 22 * s); c.fill(); }
    else {
      c.fillRect(x - 2.4 * s, base - 13 * s, 1.8 * s, 8 * s); c.fillRect(x + 0.6 * s, base - 13 * s, 1.8 * s, 8 * s); /* Beine */
      c.beginPath(); c.moveTo(x - 3 * s, base - 12 * s); c.lineTo(x - 3.4 * s, base - 21 * s); c.lineTo(x + 3.4 * s, base - 21 * s); c.lineTo(x + 3 * s, base - 12 * s); c.fill(); /* Rumpf */
      c.beginPath(); c.arc(x, base - 23.2 * s, 2 * s, 0, TAU); c.fill(); c.fillRect(x - 0.3 * s, base - 26.5 * s, 0.6 * s, 2 * s); /* Helm mit Kamm */
      c.fillRect(x - 0.4 * s, base - 30 * s, 0.8 * s, 18 * s); c.fillRect(x - 2.2 * s, base - 14 * s, 4.4 * s, 0.8 * s); /* Schwert vor dem Körper */
      c.beginPath(); c.moveTo(x - 6 * s, base - 20 * s); c.lineTo(x - 2.6 * s, base - 20 * s); c.lineTo(x - 2.6 * s, base - 14 * s); c.quadraticCurveTo(x - 4.3 * s, base - 11 * s, x - 6 * s, base - 14 * s); c.fill(); /* Schild */
      c.fillStyle = rgba(o.pal.light, 0.25); c.fillRect(x - 5.6 * s, base - 19.6 * s, 0.6 * s, 5 * s);
    }
    c.fillStyle = rgba(o.pal.light, 0.22); c.fillRect(x - 3 * s, base - 21 * s, 0.6 * s, 15 * s);
  }
  /* Wandteppich */
  function tapestry(o, x, y, w, h, col) {
    const { c, R } = o; c.fillStyle = "#2a1a10"; c.fillRect(x - 1, y - 1, w + 2, 1.2);
    body(o, x, y, w, h, col, 0.6); c.strokeStyle = "#d8b050"; c.lineWidth = 0.5; c.strokeRect(x + 1, y + 1, w - 2, h - 2);
    c.fillStyle = "#d8b050"; c.beginPath(); c.moveTo(x + w / 2, y + h * 0.25); c.lineTo(x + w * 0.7, y + h * 0.45); c.lineTo(x + w / 2, y + h * 0.65); c.lineTo(x + w * 0.3, y + h * 0.45); c.fill();
    for (let k = 0; k < w * h / 20; k++) { c.fillStyle = R() < 0.5 ? "rgba(255,220,160,.12)" : "rgba(0,0,0,.15)"; c.fillRect(x + R() * w, y + R() * h, 1, 1); }
    c.fillStyle = "#c8a040"; for (let xx = x + 0.5; xx < x + w; xx += 1.4) c.fillRect(xx, y + h, 0.5, 1.6);
  }
  /* Ritterrüstung auf Ständer */
  function armour(o, x, base, s, col) {
    const c = o.c; col = col || "#6a6260"; const g = c.createLinearGradient(x - 3 * s, 0, x + 3 * s, 0); g.addColorStop(0, shade(col, 0.4)); g.addColorStop(0.45, col); g.addColorStop(1, shade(col, -0.5)); c.fillStyle = g;
    c.fillRect(x - 2 * s, base - 9 * s, 1.5 * s, 9 * s); c.fillRect(x + 0.5 * s, base - 9 * s, 1.5 * s, 9 * s);
    c.beginPath(); c.moveTo(x - 3 * s, base - 9 * s); c.lineTo(x - 3.4 * s, base - 17 * s); c.lineTo(x + 3.4 * s, base - 17 * s); c.lineTo(x + 3 * s, base - 9 * s); c.fill();
    c.beginPath(); c.arc(x, base - 19 * s, 2 * s, 0, TAU); c.fill(); c.fillStyle = "#100a0c"; c.fillRect(x - 1.2 * s, base - 19.4 * s, 2.4 * s, 0.5 * s);
    c.fillStyle = g; c.fillRect(x - 4.2 * s, base - 17 * s, 1.2 * s, 8 * s); c.fillRect(x + 3 * s, base - 17 * s, 1.2 * s, 8 * s);
    c.fillStyle = "#a01a20"; c.fillRect(x - 0.3 * s, base - 22 * s, 0.6 * s, 1.6 * s);
  }
  /* liegendes Fass (Stirnseite) */
  function barrelEnd(o, x, y, r, col) {
    const c = o.c; c.fillStyle = shade(col, -0.35); c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill();
    const g = c.createRadialGradient(x - r * 0.3, y - r * 0.3, 0, x, y, r); g.addColorStop(0, shade(col, 0.25)); g.addColorStop(1, shade(col, -0.25)); c.fillStyle = g; c.beginPath(); c.arc(x, y, r * 0.84, 0, TAU); c.fill();
    c.strokeStyle = rgba(shade(col, -0.6), 0.6); c.lineWidth = 0.3; c.beginPath(); for (let k = -r * 0.84 + r * 0.28; k < r * 0.84; k += r * 0.28) { const hh = Math.sqrt(Math.max(0, r * r * 0.7 - k * k)); c.moveTo(x + k, y - hh); c.lineTo(x + k, y + hh); } c.stroke();
    c.strokeStyle = "#2a2220"; c.lineWidth = r * 0.12; c.beginPath(); c.arc(x, y, r * 0.92, 0, TAU); c.stroke();
    c.fillStyle = "#1a0e08"; c.beginPath(); c.arc(x, y + r * 0.45, r * 0.1, 0, TAU); c.fill();
  }
  /* stehendes / seitliches Fass */
  function barrelSide(o, x, base, w, h, col) {
    const c = o.c; const g = c.createLinearGradient(x, 0, x + w, 0); g.addColorStop(0, shade(col, 0.2)); g.addColorStop(0.4, col); g.addColorStop(1, shade(col, -0.5)); c.fillStyle = g;
    c.beginPath(); c.moveTo(x + w * 0.08, base); c.quadraticCurveTo(x - w * 0.06, base - h / 2, x + w * 0.08, base - h); c.lineTo(x + w * 0.92, base - h); c.quadraticCurveTo(x + w * 1.06, base - h / 2, x + w * 0.92, base); c.closePath(); c.fill();
    c.strokeStyle = "rgba(0,0,0,.3)"; c.lineWidth = 0.3; c.beginPath(); for (let k = 1; k < 5; k++) { const xx = x + w * k / 5; c.moveTo(xx, base); c.quadraticCurveTo(xx + (xx - x - w / 2) * 0.1, base - h / 2, xx, base - h); } c.stroke();
    c.fillStyle = "#2a2220"; for (const u of [0.12, 0.3, 0.7, 0.88]) c.fillRect(x + (u < 0.5 ? 0.3 : 0.3), base - h * u - 0.5, w - 0.6, 1);
  }
  /* Spinnennetz */
  function web(o, cx, cy, r, op) {
    op = op || {}; const { c, R } = o; const n = op.n || 12, col = op.col || "rgba(225,215,235,.3)";
    c.strokeStyle = col; c.lineWidth = op.lw || 0.35; c.beginPath();
    const ang = []; for (let k = 0; k < n; k++) ang.push(k / n * TAU + (R() - 0.5) * 0.3);
    const rad = ang.map(() => r * (0.75 + R() * 0.3));
    for (let k = 0; k < n; k++) { c.moveTo(cx, cy); c.lineTo(cx + Math.cos(ang[k]) * rad[k], cy + Math.sin(ang[k]) * rad[k]); }
    for (let rr = r * 0.08; rr < r; rr += r * 0.075) { for (let k = 0; k <= n; k++) { const i = k % n, f = Math.min(1, rr / rad[i] * 0.98), px = cx + Math.cos(ang[i]) * rad[i] * f, py = cy + Math.sin(ang[i]) * rad[i] * f; if (k) { const j = (k - 1) % n, f2 = Math.min(1, rr / rad[j] * 0.98), mx = cx + Math.cos((ang[i] + ang[j] + (k === n ? TAU : 0)) / 2) * rr * 0.92, my = cy + Math.sin((ang[i] + ang[j] + (k === n ? TAU : 0)) / 2) * rr * 0.92; c.quadraticCurveTo(mx, my, px, py); } else c.moveTo(px, py); } }
    c.stroke();
    if (op.anchor) { c.beginPath(); for (const [ax, ay] of op.anchor) { c.moveTo(cx + (ax - cx) * 0.8, cy + (ay - cy) * 0.8); c.lineTo(ax, ay); } c.stroke(); }
    for (let k = 0; k < r / 2; k++) { const a = R() * TAU, d = R() * r; o.glints.push({ x: cx + Math.cos(a) * d, y: cy + Math.sin(a) * d, w: 0.7, ph: R() * TAU, sp: 0.4 + R(), col: "#f0e8ff", a: 0.7, dot: true }); }
  }
  function stalactites(o, n, col, maxH, y0) {
    const { c, R } = o; y0 = y0 || 0;
    for (let i = 0; i < n; i++) { const x = R() * PW, w = 3 + R() * 12, h = 8 + R() * R() * maxH;
      const g = c.createLinearGradient(x - w / 2, 0, x + w / 2, 0); g.addColorStop(0, shade(col, 0.2)); g.addColorStop(0.5, col); g.addColorStop(1, shade(col, -0.45)); c.fillStyle = g;
      c.beginPath(); c.moveTo(x - w / 2, y0 - 2); c.quadraticCurveTo(x - w * 0.2, y0 + h * 0.6, x, y0 + h); c.quadraticCurveTo(x + w * 0.2, y0 + h * 0.6, x + w / 2, y0 - 2); c.fill();
      if (R() < 0.2) o.drips.push({ x, y: y0 + h, h: 40 + R() * 120, ph: R() * 9, sp: 0.25 + R() * 0.4, col: "#d8e8d0" });
    }
  }
  function stalagmite(o, x, base, w, h, col) {
    const c = o.c; const g = c.createLinearGradient(x - w / 2, 0, x + w / 2, 0); g.addColorStop(0, shade(col, 0.22)); g.addColorStop(0.5, col); g.addColorStop(1, shade(col, -0.45)); c.fillStyle = g;
    c.beginPath(); c.moveTo(x - w / 2, base); c.quadraticCurveTo(x - w * 0.18, base - h * 0.6, x, base - h); c.quadraticCurveTo(x + w * 0.18, base - h * 0.6, x + w / 2, base); c.fill();
    c.strokeStyle = rgba(shade(col, -0.5), 0.4); c.lineWidth = 0.4; c.beginPath(); for (let k = 1; k < 4; k++) { const yy = base - h * k / 4; const hw = w / 2 * (1 - k / 4) * 0.9; c.moveTo(x - hw, yy); c.quadraticCurveTo(x, yy + 1, x + hw, yy); } c.stroke();
  }
  /* Höhlenwand-Textur (Felsflecken) */
  function rockTex(o, x, y, w, h, col, n) {
    const { c, R } = o; const a = new Path2D(), b = new Path2D();
    for (let i = 0; i < (n || w * h / 60); i++) { const px = x + R() * w, py = y + R() * h, r = 2 + R() * 7, P2 = R() < 0.5 ? a : b; P2.moveTo(px - r, py); P2.lineTo(px - r * 0.3, py - r * 0.7); P2.lineTo(px + r, py - r * 0.2); P2.lineTo(px + r * 0.4, py + r * 0.6); P2.closePath(); }
    c.fillStyle = rgba(shade(col, 0.25), 0.14); c.fill(a); c.fillStyle = rgba(shade(col, -0.5), 0.2); c.fill(b);
  }
  function mushroom(o, x, base, h, cap, glowCol, op) {
    op = op || {}; const { c, R } = o; const cw = h * (0.42 + R() * 0.2), lean = (R() - 0.5) * h * 0.2;
    const stem = op.stem || "#cfc0b8";
    c.strokeStyle = shade(stem, -0.3); c.lineWidth = h * 0.11 + 0.4; c.beginPath(); c.moveTo(x, base); c.quadraticCurveTo(x + lean * 0.2, base - h * 0.5, x + lean, base - h); c.stroke();
    c.strokeStyle = stem; c.lineWidth = h * 0.07; c.beginPath(); c.moveTo(x - h * 0.015, base); c.quadraticCurveTo(x + lean * 0.2 - h * 0.015, base - h * 0.5, x + lean - h * 0.015, base - h); c.stroke();
    if (h > 14) { c.fillStyle = shade(stem, -0.1); c.beginPath(); c.ellipse(x + lean * 0.75, base - h * 0.72, h * 0.08, h * 0.025, 0, 0, TAU); c.fill(); }
    const cx = x + lean, cy = base - h;
    c.fillStyle = shade(cap, -0.45); c.beginPath(); c.ellipse(cx, cy + 0.4, cw, h * 0.07 + 0.6, 0, 0, PI); c.fill(); /* Lamellen */
    c.strokeStyle = rgba(shade(cap, 0.3), 0.4); c.lineWidth = 0.25; c.beginPath(); for (let k = -cw; k < cw; k += 1.2) { c.moveTo(cx, cy + 0.4); c.lineTo(cx + k, cy + Math.sqrt(Math.max(0, 1 - (k / cw) ** 2)) * (h * 0.07)); } c.stroke();
    const g = c.createLinearGradient(cx - cw, cy - h * 0.25, cx + cw, cy); g.addColorStop(0, shade(cap, 0.35)); g.addColorStop(0.5, cap); g.addColorStop(1, shade(cap, -0.4)); c.fillStyle = g;
    c.beginPath(); c.moveTo(cx - cw, cy + 0.5); c.bezierCurveTo(cx - cw, cy - h * 0.28, cx + cw, cy - h * 0.28, cx + cw, cy + 0.5); c.closePath(); c.fill();
    c.fillStyle = "rgba(255,240,250,.55)"; for (let k = 0; k < 3 + h / 5; k++) { const a = R(), b = R(); c.beginPath(); c.arc(cx + (a - 0.5) * cw * 1.6, cy - b * h * 0.16, 0.4 + R() * h * 0.025, 0, TAU); c.fill(); }
    if (glowCol) { o.glows.push({ x: cx, y: cy - h * 0.06, r: cw * 1.6, col: glowCol, ph: R() * 9, kind: "pulse", a: 0.32 }); bake(o, cx, cy + h * 0.1, cw * 2, glowCol, 0.18); }
  }
  function crystal(o, x, base, h, col) {
    const { c, R } = o; const n = 3 + (R() * 3 | 0);
    for (let i = 0; i < n; i++) { const a = -PI / 2 + (i - n / 2) * 0.3 + (R() - 0.5) * 0.2, hh = h * (0.5 + R() * 0.6), w = h * 0.12; const tx = x + Math.cos(a) * hh, ty = base + Math.sin(a) * hh;
      c.fillStyle = shade(col, -0.2); c.beginPath(); c.moveTo(x - w, base); c.lineTo(tx, ty); c.lineTo(x + w, base); c.fill(); c.fillStyle = shade(col, 0.35); c.beginPath(); c.moveTo(x - w, base); c.lineTo(tx, ty); c.lineTo(x, base); c.fill(); }
    o.glows.push({ x, y: base - h * 0.4, r: h, col, ph: R() * 9, kind: "pulse", a: 0.3 });
  }
  /* hängende Kette (statisch) */
  function chain(o, x, y0, y1, col, sag) {
    const c = o.c; col = col || "#4a4440"; c.strokeStyle = col; c.lineWidth = 0.5;
    for (let y = y0; y < y1; y += 1.6) { const k = ((y - y0) / 1.6) | 0; c.beginPath(); if (k & 1) { c.moveTo(x, y); c.lineTo(x, y + 1.8); } else c.ellipse(x, y + 0.9, 0.6, 1, 0, 0, TAU); c.stroke(); }
  }

  /* ======================= SPRITES FÜR BEWEGTES ======================= */
  function gearSprite(o, r, col, teeth) {
    const td = Math.max(1.6, r * 0.13), R2 = r + td; teeth = teeth || Math.max(8, Math.round(r * 0.6));
    return mkSprite(o, R2 * 2 + 2, R2 * 2 + 2, R2 + 1, R2 + 1, so => { const c = so.c;
      c.fillStyle = shade(col, -0.25); c.beginPath();
      for (let k = 0; k < teeth; k++) { const a0 = k / teeth * TAU, a1 = (k + 0.5) / teeth * TAU, da = 0.1 / teeth * TAU; c.lineTo(Math.cos(a0) * r, Math.sin(a0) * r); c.lineTo(Math.cos(a0 + da) * R2, Math.sin(a0 + da) * R2); c.lineTo(Math.cos(a1 - da) * R2, Math.sin(a1 - da) * R2); c.lineTo(Math.cos(a1) * r, Math.sin(a1) * r); }
      c.closePath(); c.fill();
      const g = c.createLinearGradient(-r, -r, r, r); g.addColorStop(0, shade(col, 0.35)); g.addColorStop(0.5, col); g.addColorStop(1, shade(col, -0.5));
      c.fillStyle = g; c.beginPath(); c.arc(0, 0, r, 0, TAU); c.arc(0, 0, r * 0.76, 0, TAU, true); c.fill();
      c.strokeStyle = rgba(shade(col, 0.5), 0.5); c.lineWidth = 0.4; c.beginPath(); c.arc(0, 0, r * 0.88, PI * 0.9, PI * 1.6); c.stroke();
      const n = r > 22 ? 6 : r > 9 ? 4 : 0;
      if (n) { for (let k = 0; k < n; k++) { c.save(); c.rotate(k / n * TAU); const sg = c.createLinearGradient(0, -r * 0.08, 0, r * 0.08); sg.addColorStop(0, shade(col, 0.2)); sg.addColorStop(1, shade(col, -0.4)); c.fillStyle = sg; c.beginPath(); c.moveTo(r * 0.15, -r * 0.09); c.lineTo(r * 0.8, -r * 0.06); c.lineTo(r * 0.8, r * 0.06); c.lineTo(r * 0.15, r * 0.09); c.fill(); c.restore(); } }
      else { c.fillStyle = shade(col, -0.15); c.beginPath(); c.arc(0, 0, r * 0.77, 0, TAU); c.fill(); c.fillStyle = "rgba(0,0,0,.55)"; for (let k = 0; k < 4; k++) { const a = k / 4 * TAU; c.beginPath(); c.arc(Math.cos(a) * r * 0.45, Math.sin(a) * r * 0.45, r * 0.15, 0, TAU); c.fill(); } }
      c.fillStyle = shade(col, 0.05); c.beginPath(); c.arc(0, 0, r * 0.22 + 0.8, 0, TAU); c.fill(); c.fillStyle = shade(col, -0.5); c.beginPath(); c.arc(0, 0, r * 0.08 + 0.4, 0, TAU); c.fill();
      c.fillStyle = rgba(shade(col, 0.6), 0.7); for (let k = 0; k < 10; k++) { const a = k / 10 * TAU; c.fillRect(Math.cos(a) * r * 0.88 - 0.3, Math.sin(a) * r * 0.88 - 0.3, 0.6, 0.6); }
    });
  }
  /* Zahnradkette: Radien, Startpunkt, Richtungswinkel – Räder greifen ineinander und drehen gegenläufig */
  function gearTrain(o, x, y, list, w0) {
    const { R } = o; let px = x, py = y, pr = 0, pw = w0, prevT = 0;
    for (let i = 0; i < list.length; i++) {
      const [r, ang, col] = list[i]; const teeth = Math.max(8, Math.round(r * 0.6));
      if (i) { const d = pr + r + Math.max(1.6, (pr + r) * 0.065); px += Math.cos(ang) * d; py += Math.sin(ang) * d; pw = -pw * prevT / teeth; }
      o.spin.push({ sp: gearSprite(o, r, col, teeth), x: px, y: py, w: pw, a0: R() * TAU, axle: true });
      pr = r; prevT = teeth;
    }
  }
  function bellSprite(o, s, col) {
    return mkSprite(o, 34 * s, 34 * s, 17 * s, 4 * s, so => { const c = so.c;
      c.fillStyle = "#2a1e14"; c.fillRect(-7 * s, -3 * s, 14 * s, 3 * s); c.fillRect(-1 * s, -4 * s, 2 * s, 5 * s);
      const g = c.createLinearGradient(-14 * s, 0, 14 * s, 0); g.addColorStop(0, shade(col, 0.4)); g.addColorStop(0.3, col); g.addColorStop(0.8, shade(col, -0.45)); g.addColorStop(1, shade(col, -0.6)); c.fillStyle = g;
      c.beginPath(); c.moveTo(-5 * s, 0); c.quadraticCurveTo(-6 * s, 14 * s, -12 * s, 22 * s); c.quadraticCurveTo(0, 25 * s, 12 * s, 22 * s); c.quadraticCurveTo(6 * s, 14 * s, 5 * s, 0); c.closePath(); c.fill();
      c.strokeStyle = rgba(shade(col, -0.6), 0.7); c.lineWidth = 0.5 * s; c.beginPath(); c.moveTo(-9.5 * s, 18 * s); c.quadraticCurveTo(0, 20.5 * s, 9.5 * s, 18 * s); c.moveTo(-6.5 * s, 9 * s); c.quadraticCurveTo(0, 10.5 * s, 6.5 * s, 9 * s); c.stroke();
      c.fillStyle = "rgba(255,240,180,.35)"; c.fillRect(-4 * s, 3 * s, 1.2 * s, 14 * s);
      c.fillStyle = shade(col, -0.5); c.beginPath(); c.arc(0, 24 * s, 2 * s, 0, TAU); c.fill(); /* Klöppel */
    });
  }
  function cageSprite(o, s, col, skel, L0) {
    const L = L0 || 30 * s;
    return mkSprite(o, 22 * s, L + 30 * s, 11 * s, 2, so => { const c = so.c;
      chain({ c, pal: o.pal }, 0, 0, L, "#3a3430");
      c.strokeStyle = col; c.lineWidth = 0.9; c.beginPath(); c.moveTo(-7 * s, L + 6 * s); c.quadraticCurveTo(0, L - 2 * s, 7 * s, L + 6 * s); c.stroke();
      c.beginPath(); for (let k = -7; k <= 7; k += 2.8) { c.moveTo(k * s, L + 6 * s - (1 - Math.abs(k) / 7) * 4 * s); c.lineTo(k * s, L + 24 * s); } c.stroke();
      c.lineWidth = 1; c.beginPath(); c.moveTo(-7.5 * s, L + 24 * s); c.lineTo(7.5 * s, L + 24 * s); c.moveTo(-7.2 * s, L + 14 * s); c.lineTo(7.2 * s, L + 14 * s); c.stroke();
      if (skel) { c.fillStyle = "#d8d0c0"; c.beginPath(); c.arc(-1 * s, L + 13 * s, 1.8 * s, 0, TAU); c.fill(); c.fillRect(-1.3 * s, L + 15 * s, 0.6 * s, 6 * s); c.fillRect(-3 * s, L + 16 * s, 4 * s, 0.4 * s); c.fillRect(-3 * s, L + 17.4 * s, 4 * s, 0.4 * s); c.strokeStyle = "#d8d0c0"; c.lineWidth = 0.5 * s; c.beginPath(); c.moveTo(-1 * s, L + 16 * s); c.lineTo(5 * s, L + 9 * s); c.moveTo(-1 * s, L + 21 * s); c.lineTo(-4 * s, L + 23.5 * s); c.lineTo(2 * s, L + 23.5 * s); c.stroke(); c.fillStyle = "#1a1010"; c.fillRect(-1.8 * s, L + 12.6 * s, 0.6 * s, 0.6 * s); c.fillRect(-0.4 * s, L + 12.6 * s, 0.6 * s, 0.6 * s); }
    });
  }
  /* Kronleuchter-Sprite; Flammenpositionen werden live dazugemalt */
  function chandelierSprite(o, s, len) {
    const flames = [];
    const sp = mkSprite(o, 40 * s, len + 16 * s, 20 * s, 1, so => { const c = so.c;
      c.strokeStyle = "rgba(40,30,20,.95)"; c.lineWidth = 0.6; c.beginPath(); c.moveTo(0, 0); c.lineTo(0, len); c.stroke();
      c.strokeStyle = "#8a6a2a"; c.lineWidth = 1; c.beginPath(); c.ellipse(0, len + 4 * s, 15 * s, 3 * s, 0, 0, TAU); c.stroke(); c.beginPath(); c.ellipse(0, len - 3 * s, 9 * s, 2 * s, 0, 0, TAU); c.stroke();
      c.lineWidth = 0.5; c.beginPath(); for (const k of [-15, -7, 0, 7, 15]) { c.moveTo(0, len - 6 * s); c.lineTo(k * s, len + 4 * s); } c.stroke();
      c.fillStyle = "#b08a3a"; c.beginPath(); c.arc(0, len + 6 * s, 2 * s, 0, TAU); c.fill();
      for (const [k, yy] of [[-15, 4], [-10, 6], [-4, 7], [4, 7], [10, 6], [15, 4], [-9, -3], [0, -3.4], [9, -3]]) { c.fillStyle = "#e8dcc0"; c.fillRect(k * s - 0.5, (len + yy * s) - 3, 1, 3); flames.push([k * s, len + yy * s - 3.6]); }
    });
    sp.flames = flames; return sp;
  }
  /* Segelschiff (Galeone) als Sprite – schaukelt live */
  function shipSprite(o, s, hull, sail, far) {
    const fl = o.pal.banner;
    const sp = mkSprite(o, 92 * s, 90 * s, 46 * s, 76 * s, so => { const c = so.c; const R = o.R;
      const hc = o.hz(hull, far), sc = o.hz(sail, far), dk = o.hz("#1a120c", far);
      /* Rumpf */
      const g = c.createLinearGradient(0, -14 * s, 0, 4 * s); g.addColorStop(0, shade(hc, 0.15)); g.addColorStop(1, shade(hc, -0.4)); c.fillStyle = g;
      c.beginPath(); c.moveTo(-40 * s, -16 * s); c.lineTo(-30 * s, -12 * s); c.lineTo(28 * s, -10 * s); c.lineTo(42 * s, -15 * s); c.quadraticCurveTo(36 * s, 0, 24 * s, 4 * s); c.lineTo(-26 * s, 4 * s); c.quadraticCurveTo(-36 * s, 0, -40 * s, -16 * s); c.fill();
      c.fillStyle = shade(hc, -0.1); c.fillRect(-40 * s, -24 * s, 14 * s, 9 * s); c.fillStyle = shade(hc, 0.1); c.fillRect(-41 * s, -25 * s, 16 * s, 1.2 * s); /* Achterkastell */
      c.fillStyle = shade(hc, -0.1); c.fillRect(24 * s, -17 * s, 12 * s, 6 * s);
      c.strokeStyle = rgba(shade(hc, -0.6), 0.7); c.lineWidth = 0.35; c.beginPath(); for (let k = -9; k < 3; k += 2.2) { c.moveTo(-34 * s, k * s); c.lineTo(32 * s, k * s - 1); } c.stroke();
      c.fillStyle = "#c8a040"; c.fillRect(-36 * s, -11.5 * s, 66 * s, 0.7 * s);
      for (let k = 0; k < 8; k++) { const lit = R() < 0.3; c.fillStyle = lit ? WARM : "#0e0a0a"; c.fillRect(-26 * s + k * 7 * s, -7.5 * s, 2 * s, 1.8 * s); }
      for (let k = 0; k < 3; k++) { c.fillStyle = WARM; c.fillRect(-38 * s + k * 4 * s, -21 * s, 2 * s, 2.5 * s); }
      /* Masten, Rahen, Segel */
      const masts = [[-18, 60], [4, 70], [24, 48]];
      c.strokeStyle = rgba(dk, 0.75); c.lineWidth = 0.3; c.beginPath(); c.moveTo(-40 * s, -24 * s); for (const [mx, mh] of masts) c.lineTo(mx * s, -12 * s - mh * s); c.lineTo(48 * s, -18 * s); for (const [mx, mh] of masts) { c.moveTo(mx * s, -12 * s - mh * s); c.lineTo(mx * s - 9 * s, -12 * s); c.moveTo(mx * s, -12 * s - mh * s); c.lineTo(mx * s + 9 * s, -12 * s); } c.stroke();
      c.lineWidth = 0.9 * s; c.strokeStyle = dk; c.beginPath(); c.moveTo(36 * s, -14 * s); c.lineTo(52 * s, -24 * s); c.stroke(); /* Bugspriet */
      for (const [mx, mh] of masts) {
        c.fillStyle = dk; c.fillRect(mx * s - 0.6, -12 * s - mh * s, 1.2, mh * s);
        for (const [u, sw] of [[0.18, 14], [0.46, 18], [0.74, 20]]) { if (mh < 55 && u > 0.7) continue; const yy = -12 * s - mh * s * (1 - u), hw = sw * s / 2, sh = mh * s * 0.24;
          c.fillStyle = dk; c.fillRect(mx * s - hw - 1, yy - 0.5, hw * 2 + 2, 0.8);
          const sg = c.createLinearGradient(mx * s - hw, 0, mx * s + hw, 0); sg.addColorStop(0, shade(sc, 0.12)); sg.addColorStop(0.6, sc); sg.addColorStop(1, shade(sc, -0.3)); c.fillStyle = sg;
          c.beginPath(); c.moveTo(mx * s - hw, yy); c.lineTo(mx * s + hw, yy); c.quadraticCurveTo(mx * s + hw + 2 * s, yy + sh * 0.5, mx * s + hw - 0.5, yy + sh); c.quadraticCurveTo(mx * s, yy + sh + 3 * s, mx * s - hw + 0.5, yy + sh); c.quadraticCurveTo(mx * s - hw + 2 * s, yy + sh * 0.5, mx * s - hw, yy); c.fill();
          c.strokeStyle = rgba(shade(sc, -0.4), 0.4); c.lineWidth = 0.3; c.beginPath(); c.moveTo(mx * s, yy); c.quadraticCurveTo(mx * s + 1.5 * s, yy + sh * 0.5, mx * s, yy + sh + 2.5 * s); c.stroke();
        }
        c.fillStyle = R.pick(fl); c.beginPath(); c.moveTo(mx * s, -12 * s - mh * s); c.lineTo(mx * s + 8 * s, -12 * s - mh * s + 1.5 * s); c.lineTo(mx * s, -12 * s - mh * s + 3 * s); c.fill();
      }
      /* Klüversegel */
      c.fillStyle = shade(sc, -0.05); c.beginPath(); c.moveTo(30 * s, -16 * s); c.lineTo(50 * s, -23 * s); c.lineTo(24 * s, -60 * s); c.fill();
    });
    sp.lantern = [-41 * s, -27 * s];
    return sp;
  }
  function boatSprite(o, s, col, sailCol) {
    const sp = mkSprite(o, 30 * s, 30 * s, 15 * s, 24 * s, so => { const c = so.c;
      c.fillStyle = col; c.beginPath(); c.moveTo(-12 * s, -3 * s); c.lineTo(12 * s, -3 * s); c.quadraticCurveTo(9 * s, 2 * s, 6 * s, 2 * s); c.lineTo(-7 * s, 2 * s); c.quadraticCurveTo(-11 * s, 1 * s, -12 * s, -3 * s); c.fill();
      c.fillStyle = shade(col, 0.25); c.fillRect(-11 * s, -3.4 * s, 22 * s, 0.6 * s);
      if (sailCol) { c.fillStyle = "#2a1a10"; c.fillRect(-0.4, -20 * s, 0.8, 17 * s); c.fillStyle = sailCol; c.beginPath(); c.moveTo(0.5, -19 * s); c.quadraticCurveTo(8 * s, -12 * s, 7 * s, -4 * s); c.lineTo(0.5, -4 * s); c.fill(); }
      else { c.fillStyle = "#1a1210"; c.beginPath(); c.arc(-3 * s, -6 * s, 1.4 * s, 0, TAU); c.fill(); c.fillRect(-4.4 * s, -5 * s, 2.8 * s, 2 * s); c.strokeStyle = "#3a2a1a"; c.lineWidth = 0.5; c.beginPath(); c.moveTo(-2 * s, -4.4 * s); c.lineTo(8 * s, 1 * s); c.stroke(); c.fillRect(6 * s, -9 * s, 0.5, 6 * s); }
    });
    sp.lantern = sailCol ? [9 * s, -5 * s] : [6.2 * s, -9.5 * s];
    return sp;
  }

  /* ======================= BAUGRUPPEN ======================= */
  /* ferne Burg auf einem Hügel (nur Umriss, Lichtpunkte) */
  function farCastle(o, cx, base, s, far) {
    const { c, R, pal } = o; const col = o.hz(pal.stone, far);
    c.fillStyle = o.hz(pal.rock, far + 0.05); c.beginPath(); c.moveTo(cx - 120 * s, base + 30); c.quadraticCurveTo(cx - 60 * s, base - 4, cx, base - 6); c.quadraticCurveTo(cx + 60 * s, base - 4, cx + 120 * s, base + 30); c.fill();
    c.fillStyle = col; c.fillRect(cx - 70 * s, base - 22 * s, 140 * s, 22 * s + 2); crenels(o, cx - 70 * s, base - 22 * s, 140 * s, col, 3.4);
    const n = 6 + (R() * 3 | 0);
    for (let i = 0; i < n; i++) { const w = (10 + R() * 12) * s, h = (40 + R() * 90) * s, x = cx - 80 * s + i / (n - 1) * 160 * s - w / 2; tower(o, x, base, w, h, mix(col, pal.fog, R() * 0.1), { far, head: R() < 0.2 ? "spire" : R() < 0.6 ? "cone" : "cren", bart: false }); }
    tower(o, cx - 10 * s, base - 4, 20 * s, 150 * s, col, { far, head: "spire" });
  }
  /* große Burg: hintere Türme, Palas, Kapelle, Bergfried, Brücke, Torhaus, Ringmauern mit Wachen */
  function grandCastle(o, cx, base) {
    const { c, R, pal } = o; const st = pal.stone, back = o.hz(st, 0.22), mid = o.hz(st, 0.1);
    const roofs = pal.roofs;
    /* hinterste Türme */
    for (const [dx, w, h, head] of [[-232, 15, 118, "cone"], [-140, 12, 168, "spire"], [-88, 14, 128, "cone"], [128, 14, 150, "cone"], [196, 18, 112, "cren"], [252, 12, 92, "cone"]]) tower(o, cx + dx, base - 30, w, h, back, { head, far: 0.2, garg: R() < 0.4 });
    /* innere Ringmauer */
    curtain(o, cx - 262, 524, base - 46, base - 10, mid, { walk: true, torches: true });
    /* Palas mit hohen Fenstern und Gauben */
    const px = cx - 196, pw = 120, ph = 50, pb = base - 30;
    body(o, px, pb - ph, pw, ph, mid); masonry(o, px, pb - ph, pw, ph, mid, 3.4);
    for (let k = 0; k < 7; k++) win(o, px + 7 + k * 16.4, pb - ph + 10, 4.6, 16, { k: "point", lit: R() < 0.65, frame: rgba(shade(mid, 0.3), 0.5), col: R() < 0.3 ? "#ffb060" : WARM });
    for (let k = 0; k < 8; k++) buttress(o, px + k * 16.4 - 1.8, pb - ph * 0.7, pb, 3.6, mid);
    gableRoof(o, px - 3, pb - ph, pw + 6, 34, o.hz(roofs[0], 0.08), { hip: true, moss: pal.moss });
    for (let k = 0; k < 4; k++) { const dx = px + 18 + k * 28, dy = pb - ph - 12; c.fillStyle = mid; c.fillRect(dx - 3, dy - 5, 6, 6); win(o, dx - 1.4, dy - 4, 2.8, 4, { lit: R() < 0.6, k: "arch", sill: false }); gableRoof(o, dx - 4, dy - 5, 8, 5, o.hz(roofs[0], 0.08), { plain: true }); }
    for (const dx of [px + 10, px + pw - 14]) { c.fillStyle = shade(mid, -0.2); c.fillRect(dx, pb - ph - 30, 4, 22); o.smoke.push({ x: dx + 2, y: pb - ph - 31, ph: R() * 9, s: 0.9 }); }
    /* Kapelle */
    church(o, cx + 150, base - 26, 0.9, 0.12);
    /* Bergfried */
    const kx = cx - 30, kw = 58, kh = 214;
    const keep = tower(o, kx, base - 8, kw, kh, shade(st, 0.03), { head: "cren", bart: true, garg: true, wander: true, oriel: 0, lit: 0.45 });
    for (const dx of [12, kw - 19]) o.drapes.push({ x: kx + dx, y: base - 8 - kh + 34, w: 7, h: 26, col: pal.banner[0], trim: "#d8b050", ph: R() * 9 });
    /* schlanker Nebenturm mit Spitze und Brücke zum Bergfried */
    tower(o, cx + 56, base - 14, 16, 166, st, { head: "spire", garg: true, oriel: 0 });
    const by = base - 128; c.fillStyle = shade(st, -0.05); c.fillRect(kx + kw, by, cx + 56 - kx - kw, 5); c.fillStyle = "#0d080b"; c.beginPath(); c.moveTo(kx + kw, by + 14); c.quadraticCurveTo((kx + kw + cx + 56) / 2, by + 3, cx + 56, by + 14); c.lineTo(cx + 56, by + 5); c.lineTo(kx + kw, by + 5); c.fill();
    balustrade(o, kx + kw, cx + 56, by, st, 3);
    o.walkers.push({ x0: kx + kw + 2, x1: cx + 54, y0: by - 0.2, y1: by - 0.2, v: 2.4, ph: R() * 50, kind: "lamp", s: 0.9 });
    /* Torhaus mit Flankentürmen */
    const gx = cx + 20;
    tower(o, gx - 30, base + 34, 20, 96, st, { head: "cren", bart: false, oriel: 0 }); tower(o, gx + 10, base + 34, 20, 96, st, { head: "cren", bart: false, oriel: 0 });
    body(o, gx - 10, base - 40, 20, 74, shade(st, -0.04)); masonry(o, gx - 10, base - 40, 20, 74, st, 3.4); crenels(o, gx - 10, base - 40, 20, st);
    gate(o, gx, base + 34, 12, 22, st);
    o.drapes.push({ x: gx - 3.5, y: base - 34, w: 7, h: 20, col: pal.banner[1], trim: "#2a1a10", ph: R() * 9 });
    /* äußere Ringmauer mit Rundtürmen */
    curtain(o, cx - 300, 300 - 30, base + 6, base + 48, st, { walk: true, ivy: true });
    curtain(o, gx + 30, cx + 300 - gx - 30, base + 6, base + 48, st, { walk: true, ivy: true });
    tower(o, cx - 318, base + 50, 28, 96, st, { head: "cone", round: true, oriel: 0 });
    tower(o, cx + 292, base + 50, 26, 84, st, { head: "cren", round: true });
    o.flocks.push({ x: kx + kw / 2, y: base - kh - 30, rx: 70, ry: 22, n: 11, sp: 0.22, size: 1.3, col: "#1a1016" });
  }
  /* Mauerzug am Hang (Wehrgang ins Tal) */
  function slopeWall(o, x0, y0, x1, y1, h, col, s) {
    const { c, R } = o;
    c.save(); c.beginPath(); c.moveTo(x0, y0 - h); c.lineTo(x1, y1 - h); c.lineTo(x1, y1 + 30 * s); c.lineTo(x0, y0 + 30 * s); c.closePath();
    const g = c.createLinearGradient(0, Math.min(y0, y1) - h, 0, Math.max(y0, y1) + 30 * s); g.addColorStop(0, shade(col, 0.08)); g.addColorStop(1, shade(col, -0.35)); c.fillStyle = g; c.fill(); c.clip();
    masonry(o, Math.min(x0, x1), Math.min(y0, y1) - h - 2, Math.abs(x1 - x0), Math.abs(y1 - y0) + h + 30 * s + 4, col, Math.max(1.6, 3.4 * s));
    c.restore();
    /* Zinnen, der Neigung folgend */
    const len = Math.hypot(x1 - x0, y1 - y0), step = Math.max(2.4, 4.6 * s); c.fillStyle = shade(col, -0.12);
    c.beginPath(); c.moveTo(x0, y0 - h); c.lineTo(x1, y1 - h); c.lineTo(x1, y1 - h + 2.2 * s); c.lineTo(x0, y0 - h + 2.2 * s); c.fill();
    for (let d = 0; d < len; d += step) { const u = d / len, x = x0 + (x1 - x0) * u, y = y0 + (y1 - y0) * u - h; c.fillStyle = col; c.fillRect(x, y - 3 * s, step * 0.55 * Math.abs(x1 - x0) / len, 3 * s); c.fillStyle = rgba(o.pal.light, 0.22); c.fillRect(x, y - 3 * s, step * 0.55 * Math.abs(x1 - x0) / len, 0.45); }
    for (let d = 10 * s; d < len - 6 * s; d += (18 + R() * 20) * s) if (R() < 0.5) { const u = d / len; slit(o, x0 + (x1 - x0) * u, y0 + (y1 - y0) * u - h * 0.55, 3 * s); }
    if (s > 0.25) o.walkers.push({ x0: x0 + (x1 - x0) * 0.05, x1: x0 + (x1 - x0) * 0.95, y0: y0 + (y1 - y0) * 0.05 - h - 0.5, y1: y0 + (y1 - y0) * 0.95 - h - 0.5, v: 3 * s + R() * 2 * s, ph: R() * 100, kind: "guard", s: Math.max(0.45, s), torch: R() < 0.7 });
  }
  /* Kran mit Tretrad (Hafen) */
  function crane(o, x, base, s) {
    const { c, R } = o; const wood = "#3a2618";
    c.fillStyle = wood; c.fillRect(x - 6 * s, base - 4 * s, 12 * s, 4 * s); c.fillRect(x - 1 * s, base - 40 * s, 2 * s, 36 * s);
    c.strokeStyle = wood; c.lineWidth = 1.2 * s; c.beginPath(); c.moveTo(x, base - 38 * s); c.lineTo(x + 26 * s, base - 46 * s); c.moveTo(x, base - 22 * s); c.lineTo(x + 16 * s, base - 43 * s); c.moveTo(x - 6 * s, base - 4 * s); c.lineTo(x, base - 18 * s); c.stroke();
    gableRoof(o, x - 5 * s, base - 38 * s, 10 * s, 5 * s, o.pal.roofs[1], { plain: true });
    const wr = 8 * s; const wh = mkSprite(o, wr * 2 + 2, wr * 2 + 2, wr + 1, wr + 1, so => { const sc = so.c; sc.strokeStyle = "#5a3a20"; sc.lineWidth = 1.2 * s; sc.beginPath(); sc.arc(0, 0, wr - 0.6, 0, TAU); sc.stroke(); sc.lineWidth = 0.5 * s; sc.beginPath(); for (let k = 0; k < 8; k++) { const a = k / 8 * TAU; sc.moveTo(0, 0); sc.lineTo(Math.cos(a) * wr, Math.sin(a) * wr); } sc.stroke(); sc.fillStyle = "#2a1a10"; sc.beginPath(); sc.arc(0, 0, 1.2 * s, 0, TAU); sc.fill(); });
    o.spin.push({ sp: wh, x: x - 4 * s, y: base - 12 * s, w: 0.6, osc: 2.2 });
    o.movers.push({ x: x + 25 * s, top: base - 46 * s, y0: base - 30 * s, y1: base - 8 * s, ph: R() * 9, fr: 0.25, kind: "hook", s });
  }

  /* Laternenzug entlang eines Pfades (Polylinie); sichtbar je nach Tageszeit */
  function train(o, pts, op) {
    const cum = [0]; for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
    o.trains.push(Object.assign({ pts, cum, len: cum[cum.length - 1], n: 6, gap: 7, v: 4, s: 0.6, ph: o.R() * 400 }, op || {}));
  }
  const pathOf = (x0, x1, step, yf) => { const p = []; for (let x = x0; step > 0 ? x <= x1 : x >= x1; x += step) p.push([x, yf(x)]); return p; };

  /* ======================= SEITEN JE GEBIET ======================= */
  const PAGES = {
    /* ---------- Torhof: Burgpanorama mit Dorf ---------- */
    castle(o, H) {
      const { c, R, pal } = o;
      range(o, 196, 136, o.hz(pal.rock, 0.74), 3, { snow: 0.58, lit: 0.22 });
      range(o, 226, 70, o.hz(pal.rock, 0.62), 7, { lit: 0.14, ks: [4, 7, 11, 19, 29, 41] });
      mist(o, 170, 80, pal.fog, 0.5);
      farCastle(o, 1300, 238, 0.42, 0.6); farCastle(o, 150, 234, 0.3, 0.66);
      /* Hügel mit Feldern, Wäldern, Windmühlen */
      const hy = sinF(258, [[10, 2, 0.7], [6, 5, 2.1], [3, 11, 4]]);
      hillsF(o, hy, o.hz(pal.grass, 0.5)); fields(o, hy, 34, 0.5, pal.field);
      for (let k = 0; k < 9; k++) { const fx = R() * PW, n = 6 + R() * 10; for (let i = 0; i < n; i++) { const x = fx + (R() - 0.5) * 50; wrapX(o, x - 4, 8, xx => pine(o, xx, hy(xx) + 3 + R() * 4, 7 + R() * 7, o.hz(pal.leaf[0], 0.45), o.hz(pal.leaf[2], 0.5))); } }
      windmill(o, 1010, hy(1010) + 4, 0.9, 0.42); windmill(o, 1470, hy(1470) + 5, 0.7, 0.48);
      /* Fluss mit Bogenbrücke */
      const ry = x => 298 + 5 * Math.sin(x / PW * TAU * 3 + 1);
      const vy = sinF(290, [[5, 3, 1.2], [3, 7, 0.4]]);
      hillsF(o, vy, o.hz(pal.grass, 0.36));
      c.fillStyle = pal.water; c.beginPath(); c.moveTo(0, ry(0)); for (let x = 0; x <= PW; x += 8) c.lineTo(x, ry(x)); for (let x = PW; x >= 0; x -= 8) c.lineTo(x, ry(x) + 9 + 3 * Math.sin(x / 90)); c.fill();
      c.strokeStyle = rgba(pal.light, 0.25); c.lineWidth = 0.5; c.beginPath(); for (let x = 0; x <= PW; x += 8) x ? c.lineTo(x, ry(x) + 0.3) : c.moveTo(x, ry(x) + 0.3); c.stroke();
      addGlints(o, 0, PW, 300, 306, 90, "#ffe0c0", 0.35);
      bridgeArches(o, 150, 320, ry(235) - 6, 3, ry(235) + 10, o.hz(pal.stone, 0.25), 5, { lamps: true, under: o.hz("#120a0e", 0.3) });
      o.walkers.push({ x0: 156, x1: 314, y0: ry(235) - 8.6, y1: ry(235) - 8.6, v: 4, ph: 7, kind: "lamp", s: 0.7 });
      o.bobs.push({ sp: boatSprite(o, 0.45, "#3a2618", null), x0: 380, x1: 1500, y: ry(800) + 6, v: 3, ph: 0, amp: 0.4, fr: 1.2, rot: 0.03 });
      /* Dorf mit Kirche (rechts) */
      for (let x = 1040; x < 1430; x += 13 + R() * 9) house(o, x, vy(x) + 6, 9 + R() * 8, 8 + R() * 6, { far: 0.3 });
      church(o, 1236, vy(1236) + 4, 0.8, 0.28);
      for (let x = 20; x < 140; x += 14 + R() * 9) house(o, x, vy(x) + 6, 9 + R() * 7, 8 + R() * 5, { far: 0.32 });
      /* Laternenzüge: vom Dorf hinauf zum Burgtor, ein zweiter fern über die Hügel; Himmelslaternen über dem Dorf */
      train(o, pathOf(1200, 724, -12, x => vy(x) + 5.5), { n: 7, gap: 7.5, v: 4.5, s: 0.62 });
      train(o, pathOf(240, 640, 16, x => hy(x) + 3), { n: 5, gap: 5, v: 3, s: 0.38, far: 1 });
      o.lanterns.push({ x: 1236, y: vy(1236) - 6, rise: 240, spread: 70, n: 7 }, { x: 70, y: vy(70) - 4, rise: 200, spread: 40, n: 4 });
      o.water.push({ y0: 299, y1: 309 });
      /* Hauptburg auf ihrem Felsen */
      const cy0 = sinF(262, [[8, 9, 1]]);
      crag(o, jag(R, 360, 1020, x => cy0(x) + Math.pow(Math.abs(x - 690) / 330, 3) * 36, 9, 5), H, o.hz(pal.rock, 0.06), { moss: pal.ivy[1] });
      grandCastle(o, 690, 262);
      /* Nebel und Vordergrund-Dorf */
      mist(o, 296, 40, pal.fog, 0.3);
      o.mists.push({ y: 228, h: 38, a: 0.35, sp: 4 }); o.mists.push({ y: 300, h: 46, a: 0.4, sp: -2.5 });
      const fy = sinF(346, [[6, 4, 2], [3, 9, 1]]);
      hillsF(o, fy, o.hz(pal.grass, 0.15));
      for (let x = -10; x < PW; x += 22 + R() * 16) { if (R() < 0.22) { wrapX(o, x, 20, xx => tree(o, xx + 8, fy(xx) + 8, 20 + R() * 12, {})); continue; } wrapX(o, x, 30, xx => house(o, xx, fy(xx) + 10, 15 + R() * 12, 14 + R() * 9, { far: 0.08 })); }
      o.flocks.push({ x: 300, y: 120, cross: true, v: 9, n: 7, size: 1.2, col: "#1a1016", span: 1800 });
      o.motes.push({ x: 0, y: 300, w: PW, h: 60, n: 40, col: "#e8f070", kind: "firefly" });
    },
    /* ---------- Wehrgang: Mauern ziehen sich ins Tal ---------- */
    ramparts(o, H) {
      const { c, R, pal } = o;
      range(o, 178, 104, o.hz(pal.rock, 0.74), 11, { snow: 0.62, lit: 0.24 });
      range(o, 208, 52, o.hz(pal.rock, 0.62), 5, { lit: 0.16, ks: [5, 8, 13, 21, 34, 55] });
      mist(o, 160, 70, pal.fog, 0.45);
      /* Talboden mit Fluss, der auf uns zukommt */
      const layers = [[236, 0.58, [[5, 3, 0.2], [3, 8, 1]]], [258, 0.46, [[8, 2, 1.4], [4, 6, 2]]], [288, 0.32, [[10, 2, 3.1], [4, 7, 0.3]]], [324, 0.18, [[9, 3, 0.9], [4, 9, 2.2]]]];
      const hfs = [];
      for (const [b, f, parts] of layers) { const yf = sinF(b, parts); hfs.push(yf); hillsF(o, yf, o.hz(pal.grass, f)); fields(o, yf, 16 + (b - 230) * 0.25, f, pal.field); }
      const wc = mix(pal.water, pal.light, 0.25);
      c.fillStyle = wc; c.beginPath(); c.moveTo(752, 234); c.quadraticCurveTo(700, 262, 760, 290); c.quadraticCurveTo(840, 320, 700, H); c.lineTo(860, H); c.quadraticCurveTo(940, 318, 800, 288); c.quadraticCurveTo(752, 262, 760, 234); c.fill();
      c.strokeStyle = rgba(pal.light, 0.3); c.lineWidth = 0.6; c.beginPath(); c.moveTo(752, 234); c.quadraticCurveTo(700, 262, 760, 290); c.quadraticCurveTo(840, 320, 700, H); c.stroke();
      addGlints(o, 690, 880, 250, H, 90, "#ffe0c0", 0.35);
      /* Festung und Städtchen im Tal */
      for (let x = 590; x < 930; x += 9 + R() * 6) house(o, x, hfs[0](x) + 6, 6 + R() * 5, 5 + R() * 4, { far: 0.55, smoke: 0.4 });
      farCastle(o, 770, hfs[0](770) - 2, 0.36, 0.5);
      bridgeArches(o, 735, 800, 266, 2, 276, o.hz(pal.stone, 0.42), 3, { under: o.hz("#120a0e", 0.4) });
      for (const x of [330, 1180]) windmill(o, x, hfs[1](x) + 4, 0.7, 0.45);
      train(o, pathOf(360, 640, 14, x => hfs[1](x) + 3), { n: 6, gap: 5, v: 3, s: 0.42, far: 1 });
      train(o, pathOf(1160, 920, -14, x => hfs[1](x) + 3), { n: 5, gap: 5, v: 2.6, s: 0.42, far: 1 });
      o.lanterns.push({ x: 770, y: hfs[0](770) - 4, rise: 190, spread: 80, n: 6 });
      for (let k = 0; k < 12; k++) { const fx = R() * PW, b = R() < 0.5 ? 1 : 2; for (let i = 0; i < 12; i++) { const x = fx + (R() - 0.5) * 60; wrapX(o, x - 4, 8, xx => tree(o, xx, hfs[b](xx) + 4 + R() * 6, 6 + R() * 6, { cols: pal.leaf.map(cc => o.hz(cc, 0.45 - b * 0.1)), trunk: o.hz("#2a1c14", 0.4) })); } }
      /* zwei Mauerzüge im Zickzack vom Vordergrund ins Tal */
      const chains = [
        [[40, 380, 1.0], [300, 336, 0.78], [190, 304, 0.6], [430, 280, 0.46], [330, 260, 0.36], [560, 246, 0.28], [640, 238, 0.22]],
        [[1500, 376, 1.0], [1230, 334, 0.76], [1350, 302, 0.58], [1100, 278, 0.45], [1210, 258, 0.35], [990, 244, 0.27], [880, 236, 0.21]]];
      for (const ch of chains) {
        for (let i = ch.length - 1; i > 0; i--) {
          const [x0, y0, s0] = ch[i], [x1, y1, s1] = ch[i - 1], col = o.hz(pal.stone, 0.5 - (s0 + s1) * 0.22);
          slopeWall(o, x0, y0, x1, y1, 34 * (s0 + s1) / 2, col, (s0 + s1) / 2);
          const tw = 26 * s0; tower(o, x0 - tw / 2, y0 + 6 * s0, tw, 74 * s0, col, { head: i === ch.length - 1 ? "cren" : R() < 0.5 ? "cren" : "cone", far: Math.max(0, 0.55 - s0), bart: s0 > 0.4, oriel: 0 });
          if (i === ch.length - 1) { o.flames.push({ x: x0, y: y0 + 6 * s0 - 74 * s0 - 8 * s0, s: 1.4, ph: 1 }); o.smoke.push({ x: x0, y: y0 + 6 * s0 - 74 * s0 - 12 * s0, ph: 2, s: 1.4 }); }
        }
        const [xn, yn] = ch[0]; tower(o, xn - 22, yn + 6, 44, 150, pal.stone, { head: "cren", bart: true, garg: true, lit: 0.45, wander: true });
      }
      mist(o, 236, 50, pal.fog, 0.3);
      o.mists.push({ y: 240, h: 34, a: 0.4, sp: 3 }); o.mists.push({ y: 280, h: 40, a: 0.3, sp: -2 });
      /* der eigene Wehrgang im Vordergrund: Brustwehr mit Zinnen, Fackeln, Bannern */
      const fy = 338, st = shade(pal.stone, -0.05);
      body(o, 0, fy, PW, H - fy, st, 0.3); masonry(o, 0, fy, PW, H - fy, st, 5);
      for (let x = 0; x < PW; x += 24) { body(o, x, fy - 15, 14, 15, st, 0.8); masonry(o, x, fy - 15, 14, 15, st, 5); c.fillStyle = rgba(pal.light, 0.3); c.fillRect(x - 0.5, fy - 16, 15, 1.2); c.fillStyle = "rgba(0,0,0,.35)"; c.fillRect(x + 14, fy - 15, 1.2, 15); slit(o, x + 7, fy - 12, 8); }
      c.fillStyle = rgba(pal.light, 0.25); c.fillRect(0, fy, PW, 0.8); c.fillStyle = "rgba(0,0,0,.35)"; c.fillRect(0, fy + 0.8, PW, 2);
      for (let x = 60; x < PW; x += 192) { torch(o, x + 19, fy - 6, 1.6); o.drapes.push({ x: x + 90, y: fy + 4, w: 12, h: 30, col: R.pick(pal.banner), trim: "#d8b050", ph: R() * 9 }); }
      for (let k = 0; k < 8; k++) ivy(o, R() * PW, H, 24, H - fy + 10);
      o.flocks.push({ x: 300, y: 110, cross: true, v: 12, n: 9, size: 1.3, col: "#1a1016", span: 1900 });
      o.flocks.push({ x: 760, y: 200, rx: 50, ry: 14, n: 7, sp: 0.3, size: 0.9, col: "#241820" });
    },
    /* ---------- Zinnen: Spitzen über den Wolken ---------- */
    spires(o, H) {
      const { c, R, pal } = o; const cl = nb(mix(pal.sky1, "#3a1424", 0.25)), clLit = mix(pal.sky2, "#ffe0a0", 0.55);
      /* ferne Nadeln */
      for (let i = 0; i < 26; i++) { const x = R() * PW, w = 5 + R() * 10, h = 90 + R() * 190; wrapX(o, x, w, xx => tower(o, xx, 300, w, h, o.hz(pal.stone, 0.72 + R() * 0.1), { far: 0.85, head: R() < 0.7 ? "spire" : "cren", lit: 0.25 })); }
      mist(o, 200, 100, pal.fog, 0.5);
      for (let i = 0; i < 18; i++) cloud(o, R() * PW - 40, 270 + R() * 20, 90 + R() * 120, 30 + R() * 20, o.hz(cl, 0.55), o.hz(clLit, 0.3), { back: true });
      /* schwebende Felsinseln mit Ruinen (bewegen sich sacht) */
      for (let i = 0; i < 5; i++) {
        const w = 36 + R() * 40, x = 120 + i * 300 + R() * 80, y = 70 + R() * 120;
        const sp = mkSprite(o, w + 20, w * 1.6 + 60, w / 2 + 10, 40, so => {
          const sc = so.c, rc = o.hz(pal.rock, 0.25);
          const pts = [[-w / 2, 0]]; for (let k = 1; k < 8; k++) pts.push([-w / 2 + k * w / 8 + (R() - 0.5) * 4, (Math.sin(k / 8 * PI) * w * 1.1) * (0.6 + R() * 0.5)]); pts.push([w / 2, 0]);
          sc.fillStyle = rc; sc.beginPath(); sc.moveTo(-w / 2, 0); for (const p of pts) sc.lineTo(p[0], p[1]); sc.closePath(); sc.fill();
          sc.fillStyle = rgba(shade(rc, -0.5), 0.5); sc.beginPath(); sc.moveTo(0, 0); for (const p of pts.slice(4)) sc.lineTo(p[0], p[1]); sc.closePath(); sc.fill();
          sc.strokeStyle = rgba(shade(rc, -0.5), 0.6); sc.lineWidth = 0.4; sc.beginPath(); for (let yy = 4; yy < w; yy += 4) { sc.moveTo(-w / 2, yy); sc.lineTo(w / 2, yy + (R() - 0.5) * 3); } sc.stroke();
          sc.strokeStyle = "#2a1c12"; sc.lineWidth = 0.4; sc.beginPath(); for (let k = 0; k < 6; k++) { const rx = (R() - 0.5) * w * 0.7; sc.moveTo(rx, w * 0.4); sc.quadraticCurveTo(rx + 3, w * 0.7, rx + (R() - 0.5) * 6, w * 0.8 + R() * 20); } sc.stroke();
          sc.fillStyle = pal.ivy[1]; sc.fillRect(-w / 2, -2, w, 2.4); sc.fillStyle = pal.ivy[2]; for (let k = -w / 2; k < w / 2; k += 1.5) { sc.beginPath(); sc.arc(k, -1.5, 0.6 + R() * 0.8, 0, TAU); sc.fill(); }
          if (R() < 0.75) tower(so, -6, 0, 12, 24 + R() * 20, o.hz(pal.stone, 0.15), { head: R() < 0.5 ? "broken" : "cone", oriel: 0, ivy: 1 });
          else { body(so, -w * 0.3, -10, w * 0.6, 10, o.hz(pal.stone, 0.2)); for (let k = 0; k < 3; k++) { sc.fillStyle = "#0d080b"; winPath(sc, -w * 0.25 + k * w * 0.2, -8, w * 0.1, 8, "arch"); sc.fill(); } }
          chain(so, w * 0.3, 0, 30, "#3a3430"); chain(so, -w * 0.35, 0, 22, "#3a3430");
        });
        o.bobs.push({ sp, x0: x, x1: x, y, v: 0, ph: R() * 9, amp: 4, fr: 0.25 + R() * 0.15, rot: 0.02 });
      }
      /* große gotische Spitzen mit Strebebögen und Brücken */
      const sp = []; for (let i = 0; i < 6; i++) sp.push([60 + i * 250 + R() * 80, 16 + R() * 12, 190 + R() * 80]);
      for (let i = 0; i < sp.length; i++) {
        const [x, w, h] = sp[i], col = o.hz(pal.stone, 0.22);
        if (i < sp.length - 1 && R() < 0.8) { const [x2, w2] = sp[i + 1], by = 330 - h * (0.45 + R() * 0.2); c.fillStyle = shade(col, -0.1); c.beginPath(); c.moveTo(x + w, by); c.lineTo(x2, by); c.lineTo(x2, by + 4); c.quadraticCurveTo((x + w + x2) / 2, by + 26, x + w, by + 4); c.fill(); balustrade(o, x + w, x2, by, col, 3); o.walkers.push({ x0: x + w + 3, x1: x2 - 3, y0: by - 0.2, y1: by - 0.2, v: 3, ph: R() * 40, kind: R() < 0.5 ? "lamp" : "guard", s: 0.9, torch: true }); }
        /* Strebebögen */
        for (const d of [-1, 1]) { const bx = d < 0 ? x - 24 : x + w + 24; c.fillStyle = shade(col, -0.15); c.fillRect(bx - 3, 330 - h * 0.35, 6, h * 0.35); coneRoof(o, bx, 330 - h * 0.35, 7, 18, o.hz(pal.roofs[2], 0.2), { plain: true, flag: 0.2 }); c.strokeStyle = shade(col, -0.05); c.lineWidth = 2.4; c.beginPath(); c.moveTo(bx, 330 - h * 0.33); c.quadraticCurveTo(bx + (d < 0 ? 10 : -10), 330 - h * 0.55, d < 0 ? x : x + w, 330 - h * 0.6); c.stroke(); }
        tower(o, x, 330, w, h, col, { head: R() < 0.6 ? "spire" : "cren", garg: true, wk: "point", oriel: 0.6, wander: R() < 0.5, lit: 0.4 });
        if (R() < 0.6) rose(o, x + w / 2, 330 - h * 0.72, w * 0.3, 0.2);
      }
      /* Wolkenmeer davor */
      mist(o, 280, 60, pal.fog, 0.35);
      for (let i = 0; i < 26; i++) cloud(o, R() * PW - 60, 318 + R() * 26, 80 + R() * 110, 26 + R() * 20, o.hz(cl, 0.25), clLit, { back: true });
      mist(o, 320, 50, pal.fog, 0.3);
      for (let i = 0; i < 22; i++) cloud(o, R() * PW - 60, 356 + R() * 20, 90 + R() * 120, 22 + R() * 16, shade(cl, -0.15), clLit, { back: true });
      o.mists.push({ y: 250, h: 50, a: 0.45, sp: 6, col: clLit }); o.mists.push({ y: 320, h: 44, a: 0.5, sp: -4, col: clLit });
      o.flocks.push({ x: 400, y: 100, rx: 140, ry: 40, n: 5, sp: 0.16, size: 4.2, col: "#1e0c10", kind: "demon" });
      o.flocks.push({ x: 1150, y: 150, rx: 110, ry: 30, n: 4, sp: -0.2, size: 3.6, col: "#1e0c10", kind: "demon" });
      o.sparks.push({ x: 0, y: 360, w: PW, h: 300, n: 60, col: "#ffa040", sp: 0.05, size: 0.8 });
    },
    /* ---------- Sturmspitze: zerbrochener Turm im Gewitter ---------- */
    storm(o, H) {
      const { c, R, pal } = o;
      range(o, 210, 140, o.hz(pal.rock, 0.72), 17, { lit: 0.12, ks: [4, 6, 9, 15, 23, 37] });
      for (let i = 0; i < 6; i++) { const x = R() * PW; tower(o, x, 230, 8 + R() * 8, 40 + R() * 60, o.hz(pal.stone, 0.72), { far: 0.8, head: "broken" }); }
      mist(o, 180, 80, pal.fog, 0.45);
      const hy = sinF(270, [[14, 2, 2], [6, 5, 1], [3, 13, 0.3]]); hillsF(o, hy, o.hz(pal.rock, 0.45));
      for (let i = 0; i < 26; i++) { const x = R() * PW; wrapX(o, x - 10, 20, xx => deadTree(o, xx, hy(xx) + 3, 14 + R() * 18, o.hz("#1a1612", 0.45))); }
      /* gebrochene Mauerzüge */
      for (let i = 0; i < 5; i++) { const x = R() * PW, w = 60 + R() * 90, b = hy(x) + 10, col = o.hz(pal.stone, 0.35); c.fillStyle = col; c.beginPath(); c.moveTo(x, b); let xx = x; c.lineTo(x, b - 20); while (xx < x + w) { xx += 3 + R() * 6; c.lineTo(xx, b - 8 - R() * 18); } c.lineTo(x + w, b); c.fill(); }
      /* Gifttümpel */
      for (let i = 0; i < 6; i++) { const x = R() * PW, y = 300 + R() * 30; bake(o, x, y, 40, "#a8d040", 0.18); }
      const gy = sinF(312, [[10, 3, 0.5], [5, 7, 2]]); hillsF(o, gy, o.hz(pal.rock, 0.3));
      /* Nebenruinen */
      tower(o, 210, gy(210) + 8, 30, 140, o.hz(pal.stone, 0.25), { head: "broken", oriel: 0 }); tower(o, 1250, gy(1250) + 8, 34, 170, o.hz(pal.stone, 0.22), { head: "broken", garg: true });
      /* der Donnerbaum: riesiger toter Baum */
      deadTree(o, 600, gy(600) + 10, 230, o.hz("#201a14", 0.12)); deadTree(o, 1010, gy(1010) + 10, 120, o.hz("#201a14", 0.2));
      /* Donnerbaums Turm: mächtig, mit Strebepfeilern, Außentreppe, zerborstener Krone */
      const tx = 716, tw = 88, tb = gy(760) + 14, th = 250, col = o.hz(pal.stone, 0.08);
      for (const d of [-1, 1]) { const bx = d < 0 ? tx - 15 : tx + tw + 1; buttress(o, bx, tb - th * 0.55, tb, 14, col); buttress(o, d < 0 ? bx - 13 : bx + 15, tb - th * 0.28, tb, 12, shade(col, -0.06)); }
      tower(o, tx, tb, tw, th, col, { head: "broken", garg: true, lit: 0.25, oriel: 0, ivy: 0.9, wander: true, wk: "point" });
      c.save(); c.beginPath(); c.rect(tx - 3, tb - th - 10, tw + 6, th); c.clip();
      for (let k = 0; k < 5; k++) { const y0 = tb - 26 - k * 46; c.fillStyle = shade(col, -0.25); c.beginPath(); c.moveTo(tx - 3, y0); c.lineTo(tx + tw + 3, y0 - 26); c.lineTo(tx + tw + 3, y0 - 21); c.lineTo(tx - 3, y0 + 5); c.fill(); c.strokeStyle = rgba(pal.light, 0.35); c.lineWidth = 0.6; c.beginPath(); c.moveTo(tx - 3, y0); c.lineTo(tx + tw + 3, y0 - 26); c.stroke(); c.strokeStyle = "rgba(0,0,0,.4)"; c.lineWidth = 0.4; c.beginPath(); for (let u = 0; u < 1; u += 0.06) { const sx = tx - 3 + u * (tw + 6), sy = y0 - u * 26; c.moveTo(sx, sy); c.lineTo(sx, sy + 5); } c.stroke(); }
      c.restore();
      /* zerborstene Krone: hohe Mauerzähne mit Fensterhöhlen */
      for (const [dx, w, hh] of [[0, 22, 46], [30, 12, 22], [58, 30, 34]]) { const x0 = tx + dx, y0 = tb - th; c.fillStyle = col; c.beginPath(); c.moveTo(x0, y0 + 2); c.lineTo(x0, y0 - hh * 0.7); c.lineTo(x0 + w * 0.3, y0 - hh); c.lineTo(x0 + w * 0.55, y0 - hh * 0.78); c.lineTo(x0 + w * 0.8, y0 - hh * 0.9); c.lineTo(x0 + w, y0 - hh * 0.4); c.lineTo(x0 + w, y0 + 2); c.fill(); masonry(o, x0, y0 - hh, w, hh + 2, col, 3.6); if (w > 20) win(o, x0 + w / 2 - 3, y0 - hh * 0.6, 6, 14, { k: "point", lit: false }); }
      c.strokeStyle = "#0d080b"; c.lineWidth = 1.6; c.beginPath(); let cx = tx + tw * 0.62, cy = tb - th; c.moveTo(cx, cy); const crk = []; while (cy < tb - 40) { cx += (R() - 0.5) * 9; cy += 6 + R() * 8; c.lineTo(cx, cy); crk.push([cx, cy]); } c.stroke();
      for (const [px, py] of crk) if (R() < 0.4) bake(o, px, py, 6, "#c8ff80", 0.35);
      c.fillStyle = "#3a3630"; c.fillRect(tx + 10, tb - th - 92, 1.4, 48); c.strokeStyle = "#5a5448"; c.lineWidth = 0.8; c.beginPath(); c.arc(tx + 10.7, tb - th - 92, 3, 0, TAU); c.stroke();
      o.glows.push({ x: tx + 10.7, y: tb - th - 92, r: 14, col: "#d8ff8a", ph: 0, kind: "zap", a: 0.6 });
      /* schwebende Trümmer um die Turmkrone */
      for (let i = 0; i < 9; i++) { const s = 2 + R() * 5; const sp = mkSprite(o, s * 2 + 2, s * 2 + 2, s + 1, s + 1, so => { const sc = so.c; sc.fillStyle = col; sc.beginPath(); for (let k = 0; k < 5; k++) { const a = k / 5 * TAU + R() * 0.5; sc.lineTo(Math.cos(a) * s * (0.6 + R() * 0.4), Math.sin(a) * s * (0.6 + R() * 0.4)); } sc.fill(); sc.fillStyle = rgba(pal.light, 0.3); sc.fillRect(-s * 0.5, -s * 0.5, s * 0.6, 0.5); });
        o.bobs.push({ sp, x0: tx + tw / 2 + (R() - 0.5) * 120, x1: 0, y: tb - th - 10 - R() * 50, v: 0, ph: R() * 9, amp: 3 + R() * 4, fr: 0.4 + R() * 0.4, rot: 0.4 }); }
      o.bolts.push({ x: tx + 10.7, y1: tb - th - 92, per: 7, ph: 0 }); o.bolts.push({ x: 610, y1: gy(610) - 150, per: 11, ph: 4 }); o.bolts.push({ x: 1265, y1: gy(1250) - 160, per: 13, ph: 8 });
      mist(o, 300, 60, "#6a8a3a", 0.25);
      o.mists.push({ y: 290, h: 50, a: 0.45, sp: 5, col: "#7a9a40" }); o.mists.push({ y: 230, h: 40, a: 0.3, sp: -3, col: "#5a7a3a" });
      o.flocks.push({ x: 760, y: 70, rx: 90, ry: 26, n: 10, sp: 0.3, size: 1.4, col: "#0e0a0a" });
      const fy = sinF(350, [[8, 3, 1], [4, 8, 0.2]]); hillsF(o, fy, o.hz(pal.rock, 0.12));
      for (let i = 0; i < 14; i++) { const x = R() * PW; wrapX(o, x - 15, 30, xx => deadTree(o, xx, fy(xx) + 4, 24 + R() * 26, "#120e0c")); }
    },
    /* ---------- Hafen: Schiffe, Leuchtturm, Lagerhäuser ---------- */
    harbour(o, H) {
      const { c, R, pal } = o; const sea = 252;
      /* ferne Inseln am Horizont */
      range(o, sea + 2, 34, o.hz(pal.rock, 0.72), 29, { lit: 0.12, ks: [3, 7, 12, 19, 31, 47] });
      c.fillStyle = o.hz(pal.water, 0.3); c.fillRect(0, sea, PW, H - sea);
      const g = c.createLinearGradient(0, sea, 0, H); g.addColorStop(0, rgba(pal.fog, 0.6)); g.addColorStop(0.3, rgba(pal.water, 0)); g.addColorStop(1, rgba("#000", 0.35)); c.fillStyle = g; c.fillRect(0, sea, PW, H - sea);
      for (let y = sea + 1; y < H; y += 1.6 + (y - sea) * 0.03) { c.fillStyle = rgba(R() < 0.5 ? pal.light : "#000", 0.05 + R() * 0.06); for (let k = 0; k < 10; k++) c.fillRect(R() * PW, y, 6 + R() * 30 * (1 + (y - sea) / 60), 0.5); }
      farCastle(o, 560, sea + 2, 0.3, 0.68);
      addGlints(o, 0, PW, sea + 3, H, 220, "#ffe0c0", 0.3);
      o.bobs.push({ sp: shipSprite(o, 0.3, "#3a2618", "#d8ccb0", 0.6), x0: 0, x1: PW, y: sea + 6, v: 2, ph: 300, amp: 0.3, fr: 0.6, rot: 0.01 });
      /* Leuchtturm auf Felsen (links) */
      crag(o, jag(R, 100, 360, x => 314 - Math.pow(Math.sin((x - 100) / 260 * PI), 0.6) * 54, 8, 5), 320, o.hz(pal.rock, 0.15), { moss: pal.ivy[1] });
      const lx = 214, lb = 262; const lt = tower(o, lx, lb, 22, 128, "#c8b8a0", { head: "none", round: true, oriel: 0, ivy: 0, lit: 0.3 });
      c.fillStyle = "#8a2a24"; for (let yy = lb - 120; yy < lb - 10; yy += 26) { c.globalAlpha = 0.85; c.fillRect(lx, yy, 22, 9); } c.globalAlpha = 1;
      c.fillStyle = "#3a2a22"; c.fillRect(lx - 4, lb - 130, 30, 3); balustrade(o, lx - 4, lx + 26, lb - 130, "#5a4a3a", 3); c.fillStyle = "#ffe8b0"; c.fillRect(lx + 3, lb - 142, 16, 12); c.strokeStyle = "#2a1e18"; c.lineWidth = 0.8; for (let k = 0; k < 4; k++) { c.beginPath(); c.moveTo(lx + 3 + k * 5.3, lb - 142); c.lineTo(lx + 3 + k * 5.3, lb - 130); c.stroke(); }
      c.fillStyle = "#4a2a24"; c.beginPath(); c.moveTo(lx, lb - 142); c.lineTo(lx + 11, lb - 156); c.lineTo(lx + 22, lb - 142); c.fill();
      o.beams.push({ x: lx + 11, y: lb - 136, len: 300 }); o.glows.push({ x: lx + 11, y: lb - 136, r: 26, col: "#ffe0a0", ph: 0, kind: "steady", a: 0.8 });
      /* Hafenstadt am Hang (rechts) */
      const hill = x => x < 880 ? 300 : 300 - Math.sin(Math.min(1, (x - 880) / 520) * PI * 0.5) * 110;
      c.fillStyle = o.hz(pal.rock, 0.3); c.beginPath(); c.moveTo(860, 310); for (let x = 860; x <= PW + 2; x += 6) c.lineTo(x, hill(x)); c.lineTo(PW + 2, 310); c.fill();
      for (let t = 0; t < 6; t++) { const f = 0.42 - t * 0.06; for (let x = 900 + R() * 10; x < PW - 10; x += 13 + R() * 8) { const b = hill(x) + 8 + t * 16; if (b > 306) continue; house(o, x, b, 9 + R() * 7, 10 + R() * 8, { far: f, smoke: 0.4 }); } }
      tower(o, 1410, hill(1410) + 4, 22, 120, o.hz(pal.stone, 0.42), { head: "cren", far: 0.42 }); tower(o, 1450, hill(1450) + 4, 14, 140, o.hz(pal.stone, 0.42), { head: "spire", far: 0.42 }); tower(o, 1350, hill(1350) + 4, 16, 90, o.hz(pal.stone, 0.42), { head: "cone", far: 0.42 });
      church(o, 1170, hill(1170) + 8, 0.7, 0.34);
      train(o, pathOf(905, 1470, 12, x => hill(x) + 9), { n: 7, gap: 6, v: 3.6, s: 0.5, far: 1 });
      o.lanterns.push({ x: 700, y: 296, rise: 230, spread: 90, n: 8 }, { x: 1200, y: hill(1200), rise: 160, spread: 50, n: 4 });
      o.water.push({ y0: sea + 2, y1: 298 });
      /* Hafenmole mit Bögen, Lagerhäuser mit Ladeluken, Kräne */
      bridgeArches(o, 380, 1536, 300, 3, 318, o.hz(pal.stone, 0.15), 22, { under: "#0e0a0e" });
      for (let x = 400; x < 1500; x += 70 + R() * 30) {
        const w = 44 + R() * 22, h = 30 + R() * 16, col = o.hz(mix(pal.stone, "#6a4a30", 0.4), 0.1);
        body(o, x, 298 - h, w, h, col); masonry(o, x, 298 - h, w, h, col, 2.6);
        for (let k = 0; k < 3; k++) { const fy = 298 - h + 4 + k * (h - 8) / 3; c.fillStyle = "#2a1a12"; c.fillRect(x + w / 2 - 3, fy, 6, (h - 8) / 3 - 2); c.fillStyle = "#4a3020"; c.fillRect(x + w / 2 - 3, fy, 6, 0.8); }
        for (let k = 0; k < 2; k++) win(o, x + 5 + k * (w - 14), 298 - h + 6, 3, 5, { k: "arch", lit: R() < 0.5 });
        gableRoof(o, x - 2, 298 - h, w + 4, w * 0.45, o.hz(R.pick(pal.roofs), 0.1), { moss: pal.moss });
        c.fillStyle = "#3a2418"; c.fillRect(x + w / 2 - 0.6, 298 - h - w * 0.32, 1.2, 4); c.fillRect(x + w / 2, 298 - h - w * 0.32, 8, 1.2);
        o.movers.push({ x: x + w / 2 + 7, top: 298 - h - w * 0.32 + 1, y0: 298 - h + 2, y1: 298 - h + 14, ph: R() * 9, fr: 0.18, kind: "crate" });
        for (let k = 0; k < 4; k++) { c.fillStyle = mix("#6a4a2a", "#000", R() * 0.3); const cw = 3 + R() * 3; c.fillRect(x + w + 2 + k * 5, 298 - cw, cw, cw); c.strokeStyle = "rgba(0,0,0,.4)"; c.lineWidth = 0.3; c.strokeRect(x + w + 2 + k * 5, 298 - cw, cw, cw); }
        if (R() < 0.5) barrelSide(o, x - 6, 298, 4, 5, "#6a4428");
        o.lights.push({ x: x + w / 2, y: 290, r: 10, col: WARM, ph: R() * 9, a: 0.4, f: 2 });
      }
      crane(o, 560, 298, 1); crane(o, 1060, 298, 0.9);
      o.walkers.push({ x0: 400, x1: 1480, y0: 297.5, y1: 297.5, v: 5, ph: 3, kind: "lamp", s: 0.9 }); o.walkers.push({ x0: 500, x1: 1300, y0: 297.5, y1: 297.5, v: 3.5, ph: 77, kind: "guard", s: 0.9, torch: false });
      /* Schiffe: Galeonen im Hafen schaukeln, Boote treiben */
      o.bobs.push({ sp: shipSprite(o, 1.0, "#4a2c1a", "#d8ccb0", 0.05), x0: 690, x1: 690, y: 336, v: 0, ph: 1, amp: 1.2, fr: 0.8, rot: 0.025, lantern: true });
      o.bobs.push({ sp: shipSprite(o, 0.72, "#3a2418", "#c8a890", 0.15), x0: 1150, x1: 1150, y: 326, v: 0, ph: 3, amp: 1, fr: 0.9, rot: 0.03, lantern: true });
      o.bobs.push({ sp: shipSprite(o, 0.5, "#2a1c14", "#b8a890", 0.3), x0: 380, x1: 380, y: 310, v: 0, ph: 5, amp: 0.8, fr: 1, rot: 0.03, lantern: true });
      o.bobs.push({ sp: boatSprite(o, 0.8, "#4a2e1a", "#c86a4a"), x0: -40, x1: PW + 40, y: 350, v: 6, ph: 200, amp: 1, fr: 1.4, rot: 0.06, lantern: true });
      o.bobs.push({ sp: boatSprite(o, 0.6, "#3a2414", null), x0: -40, x1: PW + 40, y: 342, v: -4, ph: 900, amp: 0.8, fr: 1.6, rot: 0.06, lantern: true });
      /* Stege im Vordergrund */
      for (let x = 20; x < PW; x += 200) { c.fillStyle = "#3a2a1e"; c.fillRect(x, 352, 130, 3); c.fillStyle = "rgba(255,220,180,.15)"; c.fillRect(x, 352, 130, 0.6); for (let k = 0; k < 130; k += 13) { c.fillStyle = "#2a1c14"; c.fillRect(x + k, 352, 2.4, 22); } c.fillStyle = "#2a1c14"; c.fillRect(x + 126, 338, 1.2, 14); o.lights.push({ x: x + 126.6, y: 337, r: 10, col: WARM, ph: R() * 9, a: 0.55, f: 2 }); c.fillStyle = WARM; c.fillRect(x + 125.6, 336, 2, 2); }
      /* Spiegelungen der Hafenlichter im Wasser */
      for (const l of o.lights.slice()) if (l.y > 250 && l.y < 340 && l.x > 360) for (let k = 0; k < 5; k++) o.glints.push({ x: l.x - 1.5 + R() * 3, y: Math.max(l.y, 304) + 4 + k * 4 + R() * 3, w: 3 + R() * 4, ph: R() * TAU, sp: 1 + R() * 2, col: l.col, a: 0.55 });
      o.mists.push({ y: sea - 10, h: 30, a: 0.4, sp: 3 }); o.mists.push({ y: 320, h: 40, a: 0.25, sp: -2 });
      o.flocks.push({ x: 700, y: 140, rx: 160, ry: 30, n: 9, sp: 0.18, size: 1.8, col: "#e8e0e0", kind: "gull" });
      o.flocks.push({ x: 1300, y: 120, rx: 90, ry: 20, n: 6, sp: -0.25, size: 1.6, col: "#e0d8d8", kind: "gull" });
    },

    /* ---------- Hallen: Bogengänge, Glasfenster, Kronleuchter ---------- */
    halls(o, H) {
      const { c, R, pal } = o; const st = pal.stone;
      /* hintere Wand mit Fensterreihe */
      const wb = o.hz(st, 0.55); body(o, 0, 0, PW, H, wb, 0.2);
      const vg = c.createLinearGradient(0, 0, 0, H); vg.addColorStop(0, "rgba(0,0,0,.45)"); vg.addColorStop(0.5, "rgba(0,0,0,0)"); vg.addColorStop(1, "rgba(0,0,0,.3)"); c.fillStyle = vg; c.fillRect(0, 0, PW, H);
      masonry(o, 0, 0, PW, H, wb, 5);
      for (let x = 32; x < PW; x += 64) { column(o, x, 40, 300, 6, o.hz(st, 0.5)); ribs(o, x, x + 64, 40, 6, o.hz(st, 0.5), 1.4); glassWin(o, x + 20, 70, 24, 80, { far: 0.45, plain: true }); }
      for (let x = 0; x < PW; x += 64) { arcadeRow(o, x + 4, 300, 56, 70, o.hz(st, 0.48)); }
      for (let x = 50; x < PW; x += 128) { statue(o, x + 14, 300, 1.1, o.hz(st, 0.4), { niche: true, robe: R() < 0.5 }); }
      mist(o, 180, 140, pal.fog, 0.35);
      /* Rosette in der Mitte */
      rose(o, 768, 96, 38, 0.3);
      /* große Joche mit Bleiglasfenstern, Galerie und Säulenbündeln */
      const bay = 192;
      for (let x = 0; x < PW; x += bay) {
        const col = o.hz(st, 0.2);
        if (Math.abs(x + bay / 2 - 768) > 60) glassWin(o, x + bay / 2 - 18, 52, 36, 118, { far: 0.15, shaft: 260, ang: 0.62, sa: 0.05 });
        /* Galerie */
        const gy = 208; body(o, x, gy, bay, 12, shade(col, -0.05)); c.fillStyle = "rgba(0,0,0,.35)"; c.fillRect(x, gy + 12, bay, 3);
        for (let k = 0; k < 6; k++) { const ax = x + 12 + k * 30; c.fillStyle = "#0e080a"; winPath(c, ax + 3, gy - 24, 18, 24, "point"); c.fill(); if (R() < 0.3) { o.lights.push({ x: ax + 12, y: gy - 8, r: 12, col: WARM, ph: R() * 9, a: 0.35, f: 2 }); bake(o, ax + 12, gy - 8, 10, WARM, 0.2); } }
        balustrade(o, x, x + bay, gy, col, 5);
        o.walkers.push({ x0: x + 10, x1: x + bay - 10, y0: gy - 0.5, y1: gy - 0.5, v: 2 + R() * 2, ph: R() * 90, kind: R() < 0.5 ? "lamp" : "monk", s: 1.1 });
        /* Wandteppiche und Banner unter der Galerie */
        tapestry(o, x + 30, gy + 22, 28, 46, R.pick(["#6a1a20", "#3a4a1a", "#5a2a4a", "#6a4a1a"]));
        o.drapes.push({ x: x + bay - 56, y: gy + 14, w: 12, h: 56, col: R.pick(pal.banner), trim: "#d8b050", ph: R() * 9 });
        o.drapes.push({ x: x + bay - 30, y: gy + 14, w: 12, h: 56, col: R.pick(pal.banner), trim: "#d8b050", ph: R() * 9 });
        /* Bögen unter der Galerie */
        for (let k = 0; k < 3; k++) { const ax = x + 72 + k * 34; if (k === 2) continue; c.fillStyle = "#0c0709"; winPath(c, ax, gy + 24, 18, 60, "point"); c.fill(); if (R() < 0.5) { bake(o, ax + 9, gy + 70, 14, "#ff9a40", 0.3); o.flames.push({ x: ax + 9, y: gy + 54, s: 1, ph: R() * 9 }); } }
        armour(o, x + 150, 316, 1.4, "#7a7270");
        /* Säulenbündel und Gewölberippen */
        column(o, x, 34, 318, 14, col, { ring: true }); ribs(o, x, x + bay, 34, 2, col, 2.6);
        c.fillStyle = col; c.fillRect(x - 9, 34, 18, 6);
        o.chands.push({ sp: chandelierSprite(o, 1.9, 30 + R() * 30), x: x + bay / 2, y: 4, amp: 0.035, fr: 0.5 + R() * 0.3, ph: R() * 9 });
      }
      /* Fußboden mit Schachbrettfliesen */
      const fy = 318; body(o, 0, fy, PW, H - fy, o.hz(st, 0.15), 0.2);
      for (let r = 0; r < 8; r++) { const yy = fy + r * (2 + r * 0.8), hh = 2 + r * 0.8, w = 8 + r * 2; for (let xx = (r & 1) * w; xx < PW; xx += w * 2) { c.fillStyle = "rgba(0,0,0,.22)"; c.fillRect(xx, yy, w, hh); } }
      c.fillStyle = "#6a1a20"; c.fillRect(0, fy + 10, PW, 12); c.fillStyle = "#c8a040"; c.fillRect(0, fy + 10, PW, 0.7); c.fillRect(0, fy + 21.3, PW, 0.7);
      /* Freitreppe zur Galerie */
      const sx = 700; for (let k = 0; k < 22; k++) { c.fillStyle = shade(o.hz(st, 0.1), -0.05 - (k % 2) * 0.05); c.fillRect(sx - 80 + k * 3.2, fy - k * 5, 160 - k * 6.4, 5); c.fillStyle = rgba(pal.light, 0.22); c.fillRect(sx - 80 + k * 3.2, fy - k * 5, 160 - k * 6.4, 0.6); }
      c.fillStyle = "#7a1a20"; c.beginPath(); c.moveTo(sx - 16, fy + 4); c.lineTo(sx - 12, fy - 110); c.lineTo(sx + 12, fy - 110); c.lineTo(sx + 16, fy + 4); c.fill(); c.fillStyle = "#c8a040"; c.fillRect(sx - 16, fy + 3, 32, 0.6);
      for (const d of [-1, 1]) { const bx = sx + d * 84; statue(o, bx, fy, 1.8, o.hz(st, 0.05)); o.flames.push({ x: bx + d * 12, y: fy - 40, s: 1.4, ph: R() * 9 }); c.fillStyle = "#4a3a20"; c.fillRect(bx + d * 12 - 0.6, fy - 38, 1.2, 38); }
      o.motes.push({ x: 0, y: 40, w: PW, h: 280, n: 70, col: "#ffe0b0", kind: "dust" });
      o.topFill = shade(wb, -0.5); o.botFill = shade(o.hz(st, 0.15), -0.3);
    },
    /* ---------- Keller: Fassgewölbe ---------- */
    cellar(o, H) {
      const { c, R, pal } = o; const br = mix(pal.stone, "#6a4030", 0.35);
      body(o, 0, 0, PW, H, o.hz(br, 0.6), 0.2); bricks(o, 0, 0, PW, H, o.hz(br, 0.6), 2.6);
      /* Tunnel in die Tiefe: Bögen hintereinander */
      for (let x = 80; x < PW; x += 300) tunnel(o, x + R() * 40, 300, 110, 150, br, 6);
      mist(o, 150, 160, pal.fog, 0.3);
      /* mächtige Pfeiler und Tonnengewölbe */
      for (let x = 0; x < PW; x += 256) {
        const col = o.hz(br, 0.18);
        c.save(); c.beginPath(); c.rect(x, 0, 256, 60); c.moveTo(x + 256, 150); c.arc(x + 128, 150, 120, 0, PI, true); c.closePath(); c.clip("evenodd");
        body(o, x, 0, 256, 160, col, 0.3); bricks(o, x, 0, 256, 160, col, 2.4); c.restore();
        /* Bogensteine */
        c.strokeStyle = shade(col, 0.1); c.lineWidth = 5; c.beginPath(); c.arc(x + 128, 150, 122, PI, 0); c.stroke();
        c.strokeStyle = rgba(shade(col, -0.6), 0.6); c.lineWidth = 0.5; c.beginPath(); for (let k = 0; k <= 30; k++) { const a = PI + k / 30 * PI; c.moveTo(x + 128 + Math.cos(a) * 119.5, 150 + Math.sin(a) * 119.5); c.lineTo(x + 128 + Math.cos(a) * 124.5, 150 + Math.sin(a) * 124.5); } c.stroke();
        body(o, x - 12, 140, 24, H - 140, col); masonry(o, x - 12, 140, 24, H - 140, col, 3.4); c.fillStyle = shade(col, 0.1); c.fillRect(x - 14, 138, 28, 4);
        /* Balken mit Schinken, Würsten, Zwiebelzöpfen */
        c.fillStyle = "#2e1e12"; c.fillRect(x + 20, 96, 216, 3);
        for (let k = 0; k < 9; k++) { const hx = x + 34 + k * 22 + R() * 6; c.strokeStyle = "#2a2018"; c.lineWidth = 0.4; const L = 8 + R() * 14; c.beginPath(); c.moveTo(hx, 99); c.lineTo(hx, 99 + L); c.stroke(); const t = R(); if (t < 0.35) { c.fillStyle = "#8a4a30"; c.beginPath(); c.ellipse(hx, 99 + L + 6, 3.2, 6.5, 0, 0, TAU); c.fill(); c.fillStyle = "#d8b090"; c.fillRect(hx - 0.6, 99 + L - 1, 1.2, 2); } else if (t < 0.7) { for (let j = 0; j < 5; j++) { c.fillStyle = j & 1 ? "#c8904a" : "#b07a3a"; c.beginPath(); c.arc(hx + (j & 1 ? 1 : -1), 99 + L + j * 2.2, 1.4, 0, TAU); c.fill(); } } else { c.fillStyle = "#6a2a1a"; for (let j = 0; j < 3; j++) { c.beginPath(); c.ellipse(hx + j * 1.4 - 1.4, 99 + L + 4, 0.9, 4, 0, 0, TAU); c.fill(); } } }
        o.swings.push({ sp: lanternSprite(o, 1, 22), x: x + 128, y: 30, amp: 0.06, fr: 0.7 + R() * 0.3, ph: R() * 9, light: [0, 30.5], lr: 34 });
      }
      /* Fassregale, Riesenfass, Weinregale */
      for (let x = 30; x < PW; x += 256) {
        const rx = x + 10, base = 318;
        if (((x / 256) | 0) % 3 === 1) {
          /* Riesenfass mit geschnitzter Stirn */
          c.fillStyle = "#2a1a10"; c.fillRect(rx + 20, base - 12, 150, 12); c.fillStyle = "#3a2618"; c.beginPath(); c.moveTo(rx + 30, base - 12); c.lineTo(rx + 50, base - 40); c.lineTo(rx + 140, base - 40); c.lineTo(rx + 160, base - 12); c.fill();
          barrelEnd(o, rx + 95, base - 70, 62, "#7a4a28");
          c.strokeStyle = "#c8a040"; c.lineWidth = 1; c.beginPath(); c.arc(rx + 95, base - 70, 26, 0, TAU); c.stroke(); c.fillStyle = "#c8a040"; c.beginPath(); c.moveTo(rx + 95, base - 92); c.lineTo(rx + 105, base - 70); c.lineTo(rx + 95, base - 48); c.lineTo(rx + 85, base - 70); c.fill();
          c.fillStyle = "#2a1a10"; c.fillRect(rx + 91, base - 22, 8, 6); c.fillStyle = "#8a6a3a"; c.fillRect(rx + 94, base - 16, 2, 3);
          o.drips.push({ x: rx + 95, y: base - 13, h: 12, ph: 1, sp: 0.5, col: "#8a2a3a" });
          continue;
        }
        c.fillStyle = "#3a2618"; c.fillRect(rx, base - 76, 2.4, 76); c.fillRect(rx + 168, base - 76, 2.4, 76); for (let r = 0; r < 4; r++) c.fillRect(rx, base - r * 19 - 1, 170, 1.8);
        for (let r = 0; r < 4; r++) for (let k = 0; k < 9; k++) { if (r === 3 && R() < 0.4) continue; barrelEnd(o, rx + 10 + k * 18.6, base - 10 - r * 19, 8.6, mix("#6a4428", "#000", R() * 0.25)); }
        /* Weinregal */
        const wx = rx + 186; c.fillStyle = "#2a1a10"; c.fillRect(wx, base - 90, 46, 90);
        for (let yy = base - 86; yy < base - 4; yy += 4.2) for (let xx = wx + 3; xx < wx + 44; xx += 4.2) { if (R() < 0.15) continue; c.fillStyle = R() < 0.5 ? "#2a3a1a" : "#3a1a20"; c.beginPath(); c.arc(xx, yy, 1.6, 0, TAU); c.fill(); c.fillStyle = "rgba(255,240,200,.35)"; c.fillRect(xx - 0.8, yy - 0.9, 0.6, 0.6); }
      }
      /* Treppe nach oben mit offener Tür */
      for (const sx of [570, 1340]) { stairs(o, sx, 318, 16, 5, 6, 1, o.hz(br, 0.1), 4); c.fillStyle = "#1a0e08"; c.fillRect(sx + 80, 318 - 96 - 30, 18, 30); door(o, sx + 80, 318 - 96, 18, 30, { open: true }); o.shafts.push({ x: sx + 80, y: 318 - 110, w: 18, len: 90, ang: 2.3, col: "#ffc890", a: 0.07, ph: 3 }); }
      /* Säcke, Käselaibe, Spinnweben */
      for (let i = 0; i < 26; i++) { const x = R() * PW, b = 318 + R() * 6; if (R() < 0.5) { c.fillStyle = mix("#8a7050", "#000", R() * 0.3); c.beginPath(); c.moveTo(x - 4, b); c.quadraticCurveTo(x - 5, b - 8, x - 1, b - 10); c.lineTo(x + 1, b - 10); c.quadraticCurveTo(x + 5, b - 8, x + 4, b); c.fill(); } else { c.fillStyle = "#d8a840"; c.beginPath(); c.ellipse(x, b - 2, 5, 2, 0, 0, TAU); c.fill(); c.fillStyle = "#b08030"; c.fillRect(x - 5, b - 2, 10, 2); } }
      for (let x = 0; x < PW; x += 256) { web(o, x + 18, 40, 30, { n: 8, col: "rgba(220,210,200,.22)" }); }
      c.fillStyle = shade(o.hz(br, 0.1), -0.3); c.fillRect(0, 318, PW, H - 318); bricks(o, 0, 318, PW, H - 318, shade(o.hz(br, 0.1), -0.2), 2);
      o.walkers.push({ x0: 60, x1: 1480, y0: 317.6, y1: 317.6, v: 4, ph: 0, kind: "lamp", s: 1.2 });
      o.walkers.push({ x0: 0, x1: PW, y0: 317.8, y1: 317.8, v: 22, ph: 13, kind: "rat", s: 1 }); o.walkers.push({ x0: 0, x1: PW, y0: 98.6, y1: 98.6, v: 16, ph: 40, kind: "rat", s: 0.9 });
      o.motes.push({ x: 0, y: 40, w: PW, h: 270, n: 50, col: "#ffd8a0", kind: "dust" });
      o.topFill = "#100a08"; o.botFill = "#120c0a";
    },
    /* ---------- Verlies: Zellenreihen, Käfige ---------- */
    dungeon(o, H) {
      const { c, R, pal } = o; const st = pal.stone;
      body(o, 0, 0, PW, H, o.hz(st, 0.62), 0.2); masonry(o, 0, 0, PW, H, o.hz(st, 0.62), 5);
      /* ferne Gewölbegänge ins Dunkel */
      for (let x = 20; x < PW; x += 128) { const col = o.hz(st, 0.52); tunnelArch(o, x + 64, 330, 90, 300, col); }
      mist(o, 60, 280, pal.fog, 0.5);
      /* drei Zellenebenen mit Laufgängen */
      const tiers = [[100, 0.24], [204, 0.14], [306, 0.05]];
      for (const [ty, f] of tiers) {
        const col = o.hz(st, f); body(o, 0, ty - 70, PW, 70, col, 0.3); masonry(o, 0, ty - 70, PW, 70, col, 3.6);
        for (let x = 14 + R() * 10; x < PW - 30; x += 46) {
          if (((x + 40) % 256) < 50) continue; /* Platz für die Pfeiler */
          const w = 24, h = 40, dx = x, dy = ty - h - 2, t = R();
          c.fillStyle = shade(col, 0.12); winPath(c, dx - 2, dy - 2, w + 4, h + 2, "arch"); c.fill(); c.fillStyle = "#060406"; winPath(c, dx, dy, w, h, "arch"); c.fill();
          c.strokeStyle = rgba(shade(col, -0.6), 0.6); c.lineWidth = 0.4; c.beginPath(); for (let k = 0; k <= 6; k++) { const a = PI + k / 6 * PI; c.moveTo(dx + w / 2 + Math.cos(a) * w / 2, dy + w / 2 + Math.sin(a) * w / 2); c.lineTo(dx + w / 2 + Math.cos(a) * (w / 2 + 2), dy + w / 2 + Math.sin(a) * (w / 2 + 2)); } c.stroke();
          if (R() < 0.2) { bake(o, dx + w / 2, dy + h * 0.7, 16, "#ff9040", 0.35); o.lights.push({ x: dx + w / 2, y: dy + h * 0.7, r: 12, col: "#ff9040", ph: R() * 9, a: 0.3, f: 2 }); }
          if (R() < 0.3) { c.fillStyle = "#c8c0b0"; const sx = dx + 4 + R() * 14; c.beginPath(); c.arc(sx, ty - 6, 1.6, 0, TAU); c.fill(); c.fillRect(sx - 1.6, ty - 4.5, 3.2, 2.2); }
          if (t < 0.18) { /* Holztür mit Guckloch */ c.fillStyle = "#3a2618"; winPath(c, dx + 1, dy + 1, w - 2, h - 1, "arch"); c.fill(); c.fillStyle = "rgba(0,0,0,.4)"; for (let k = dx + 3; k < dx + w - 1; k += 3) c.fillRect(k, dy + 6, 0.4, h - 7); c.fillStyle = "#4a4440"; c.fillRect(dx + 1, dy + 14, w - 2, 1.4); c.fillRect(dx + 1, dy + 30, w - 2, 1.4); const lit = R() < 0.5; c.fillStyle = lit ? "#ff9a40" : "#0a0608"; c.fillRect(dx + w / 2 - 3, dy + 8, 6, 4); c.strokeStyle = "#5a524a"; c.lineWidth = 0.4; c.beginPath(); for (let k = 1; k < 3; k++) { c.moveTo(dx + w / 2 - 3 + k * 2, dy + 8); c.lineTo(dx + w / 2 - 3 + k * 2, dy + 12); } c.stroke(); if (lit) o.lights.push({ x: dx + w / 2, y: dy + 10, r: 8, col: "#ff9a40", ph: R() * 9, a: 0.4, f: 2 }); continue; }
          const broken = t > 0.9;
          if (R() < 0.35 || t > 0.8) o.eyes.push({ x: dx + 6 + R() * 12, y: dy + 14 + R() * 14, ph: R() * 30, col: R() < 0.6 ? "#ff4a30" : "#d8e040" });
          c.save(); winPath(c, dx, dy, w, h, "arch"); c.clip(); c.strokeStyle = "#5a524a"; c.lineWidth = 0.8; c.beginPath();
          for (let b = dx + 2; b < dx + w; b += 3) { if (broken && b > dx + 7 && b < dx + 15) { c.moveTo(b, dy); c.lineTo(b + 3, dy + 14); continue; } c.moveTo(b, dy); c.lineTo(b, dy + h); }
          c.moveTo(dx, dy + 8); c.lineTo(dx + w, dy + 8); c.moveTo(dx, dy + h - 6); c.lineTo(dx + w, dy + h - 6); c.stroke(); c.strokeStyle = "rgba(255,240,220,.18)"; c.lineWidth = 0.3; c.beginPath(); for (let b = dx + 1.6; b < dx + w; b += 3) { c.moveTo(b, dy); c.lineTo(b, dy + h); } c.stroke(); c.restore();
          if (t > 0.8 && !broken) { c.fillStyle = "#b8a890"; c.fillRect(dx + 8, dy + 18, 1.4, 2.2); c.fillRect(dx + 14, dy + 17, 1.4, 2.2); } /* Hände an den Gitterstäben */
          c.fillStyle = "#3a3430"; c.fillRect(dx + w - 4, dy + h * 0.5, 2, 3);
          if (R() < 0.4) { chain(o, x + 36, ty - 62, ty - 40); c.strokeStyle = "#4a4440"; c.lineWidth = 0.6; c.beginPath(); c.arc(x + 36, ty - 38, 1.6, 0, TAU); c.stroke(); }
          if (R() < 0.35) torch(o, x + 38, ty - 56, 1.1);
        }
        /* Laufgang mit Geländer */
        c.fillStyle = shade(col, -0.2); c.fillRect(0, ty, PW, 5); c.fillStyle = rgba(pal.light, 0.2); c.fillRect(0, ty, PW, 0.6);
        c.fillStyle = "rgba(0,0,0,.45)"; c.fillRect(0, ty + 5, PW, 4);
        for (let x = 0; x < PW; x += 18) { c.fillStyle = shade(col, -0.3); c.beginPath(); c.moveTo(x, ty + 5); c.lineTo(x + 4, ty + 5); c.lineTo(x + 2, ty + 11); c.fill(); }
        c.strokeStyle = "#3a3430"; c.lineWidth = 0.7; c.beginPath(); c.moveTo(0, ty - 8); c.lineTo(PW, ty - 8); for (let x = 0; x < PW; x += 8) { c.moveTo(x, ty - 8); c.lineTo(x, ty); } c.stroke();
        o.walkers.push({ x0: 20, x1: PW - 20, y0: ty - 0.4, y1: ty - 0.4, v: 4 + R() * 3, ph: R() * 200, kind: "guard", s: 1.2, torch: true });
      }
      /* Treppen zwischen den Ebenen */
      for (const [sx, sy] of [[300, 204], [980, 204], [620, 306], [1320, 306]]) { stairs(o, sx, sy, 20, 3.4, 5.2, 1, o.hz(st, 0.1), 3); c.strokeStyle = "#3a3430"; c.lineWidth = 0.6; c.beginPath(); c.moveTo(sx, sy - 9); c.lineTo(sx + 68, sy - 113); c.stroke(); }
      /* mächtige Pfeiler mit Fackeln und zerschlissenen Bannern */
      for (let x = 216; x < PW; x += 256) { const col = shade(o.hz(st, 0.02), 0.05); body(o, x - 16, 0, 32, H, col); masonry(o, x - 16, 0, 32, H, col, 4); for (const yy of [30, 134, 238]) { c.fillStyle = shade(col, 0.12); c.fillRect(x - 18, yy, 36, 3); } torch(o, x, 60, 1.6); torch(o, x, 166, 1.6); o.drapes.push({ x: x - 7, y: 92, w: 14, h: 36, col: R.pick(["#4a1a1a", "#2a3a1a", "#3a1a3a"]), trim: "#8a7a40", ph: R() * 9 }); chain(o, x - 10, 240, 290); chain(o, x + 10, 240, 280); }
      /* Kettenrad über dem Schacht */
      const wr = 44; const wheel = mkSprite(o, wr * 2 + 4, wr * 2 + 4, wr + 2, wr + 2, so => { const sc = so.c; sc.strokeStyle = "#3a3430"; sc.lineWidth = 4; sc.beginPath(); sc.arc(0, 0, wr - 3, 0, TAU); sc.stroke(); sc.strokeStyle = "#5a524a"; sc.lineWidth = 1; sc.beginPath(); sc.arc(0, 0, wr - 4, PI, PI * 1.6); sc.stroke(); sc.strokeStyle = "#2e2a26"; sc.lineWidth = 2.2; sc.beginPath(); for (let k = 0; k < 8; k++) { const a = k / 8 * TAU; sc.moveTo(0, 0); sc.lineTo(Math.cos(a) * (wr - 3), Math.sin(a) * (wr - 3)); } sc.stroke(); for (let k = 0; k < 24; k++) { const a = k / 24 * TAU; sc.fillStyle = "#2a2622"; sc.fillRect(Math.cos(a) * wr - 1.2, Math.sin(a) * wr - 1.2, 2.4, 2.4); } sc.fillStyle = "#4a4440"; sc.beginPath(); sc.arc(0, 0, 5, 0, TAU); sc.fill(); });
      o.spin.push({ sp: wheel, x: 728, y: 56, w: 0, osc: 0.6, osc2: true }); o.spin[o.spin.length - 1].w = 0.25;
      /* hängende Käfige mitten im Raum */
      for (let i = 0; i < 9; i++) { const x = 40 + i * 172 + R() * 60, s = 1 + R() * 0.5, L = 40 + R() * 160; o.swings.push({ sp: cageSprite(o, s, "#7a7068", R() < 0.6, L), x, y: 0, amp: 0.04 + R() * 0.04, fr: 0.4 + R() * 0.3, ph: R() * 9 }); }
      for (let i = 0; i < 14; i++) { const x = R() * PW; chain(o, x, 0, 40 + R() * 160, "#2e2a26"); }
      /* Abflussrinne mit Schleimwasser */
      c.fillStyle = "#1a2414"; c.fillRect(0, 330, PW, 8); c.fillStyle = "rgba(120,170,60,.35)"; c.fillRect(0, 331, PW, 2); addGlints(o, 0, PW, 331, 337, 80, "#b8e070", 0.4);
      for (let x = 100; x < PW; x += 256) bake(o, x, 334, 30, "#90c040", 0.15);
      c.fillStyle = shade(o.hz(st, 0.05), -0.25); c.fillRect(0, 338, PW, H - 338); masonry(o, 0, 338, PW, H - 338, shade(o.hz(st, 0.05), -0.25), 4);
      for (let i = 0; i < 30; i++) o.drips.push({ x: R() * PW, y: 20 + R() * 260, h: 30 + R() * 40, ph: R() * 9, sp: 0.2 + R() * 0.3, col: "#a8c890" });
      o.walkers.push({ x0: 0, x1: PW, y0: 329.6, y1: 329.6, v: 20, ph: 33, kind: "rat", s: 1.1 });
      o.mists.push({ y: 300, h: 50, a: 0.3, sp: 2, col: "#4a5a3a" });
      o.flocks.push({ x: 500, y: 150, rx: 70, ry: 30, n: 8, sp: 0.5, size: 1.4, col: "#0e0a0c", kind: "bat" }); o.flocks.push({ x: 1200, y: 60, rx: 50, ry: 20, n: 6, sp: -0.6, size: 1.2, col: "#0e0a0c", kind: "bat" });
      o.topFill = "#0a0c0a"; o.botFill = "#0e100c";
    },
    /* ---------- Glockenturm: Zahnräder, Glocken, Uhr ---------- */
    belltower(o, H) {
      const { c, R, pal } = o; const st = pal.stone, wood = "#3a2618";
      const wb = o.hz(st, 0.45); body(o, 0, 0, PW, H, wb, 0.2); masonry(o, 0, 0, PW, H, wb, 6);
      for (let x = 0; x < PW; x += 256) { const g = c.createLinearGradient(x, 0, x + 256, 0); g.addColorStop(0, "rgba(0,0,0,.35)"); g.addColorStop(0.5, "rgba(0,0,0,0)"); g.addColorStop(1, "rgba(0,0,0,.35)"); c.fillStyle = g; c.fillRect(x, 0, 256, H); }
      /* Schallluken mit Nachthimmel */
      for (let x = 90; x < PW; x += 256) { if (Math.abs(x - 768) < 140) continue; c.fillStyle = mix(pal.sky1, pal.sky0, 0.4); winPath(c, x, 40, 34, 70, "point"); c.fill(); for (let k = 0; k < 12; k++) { c.fillStyle = "rgba(255,240,220,.8)"; c.fillRect(x + 3 + R() * 28, 46 + R() * 60, 0.6, 0.6); } c.fillStyle = wood; for (let yy = 56; yy < 110; yy += 6) { c.beginPath(); c.moveTo(x, yy); c.lineTo(x + 34, yy - 3); c.lineTo(x + 34, yy - 1); c.lineTo(x, yy + 2); c.fill(); } c.strokeStyle = shade(wb, 0.2); c.lineWidth = 2; winPath(c, x - 1, 39, 36, 71, "point"); c.stroke(); }
      /* hinteres Gebälk */
      const beamCol = o.hz(wood, 0.35);
      c.strokeStyle = beamCol; c.lineWidth = 5; c.beginPath(); for (let x = 0; x < PW; x += 128) { c.moveTo(x, 0); c.lineTo(x, H); c.moveTo(x, 130); c.lineTo(x + 128, 20); c.moveTo(x, 250); c.lineTo(x + 128, 140); } c.stroke();
      c.lineWidth = 6; c.beginPath(); for (const yy of [130, 250]) { c.moveTo(0, yy); c.lineTo(PW, yy); } c.stroke();
      /* fernes Räderwerk */
      for (let i = 0; i < 9; i++) { const r = 10 + R() * 26; let x = R() * PW; if (Math.abs(x - 768) < 150) x += 300; o.spin.push({ sp: gearSprite(o, r, o.hz(R.pick(["#8a6a3a", "#6a5a4a", "#9a7040"]), 0.55)), x, y: 30 + R() * 280, w: (R() < 0.5 ? -1 : 1) * (2 / r), a0: R() * TAU }); }
      mist(o, 0, H, pal.fog, 0.2);
      /* Rückseite des großen Zifferblatts, Mondlicht scheint hindurch */
      const cx = 768, cy = 150, cr = 92;
      c.fillStyle = shade(st, -0.1); c.beginPath(); c.arc(cx, cy, cr + 8, 0, TAU); c.fill();
      const dg = c.createRadialGradient(cx - 20, cy - 20, 10, cx, cy, cr); dg.addColorStop(0, "#f0e0b8"); dg.addColorStop(1, "#b89a68"); c.fillStyle = dg; c.beginPath(); c.arc(cx, cy, cr, 0, TAU); c.fill();
      c.strokeStyle = "#3a2a1a"; c.lineWidth = 2; c.beginPath(); c.arc(cx, cy, cr * 0.78, 0, TAU); c.stroke(); c.lineWidth = 1; c.beginPath(); c.arc(cx, cy, cr * 0.3, 0, TAU); c.stroke();
      c.lineWidth = 1.6; c.beginPath(); for (let k = 0; k < 12; k++) { const a = k / 12 * TAU; c.moveTo(cx + Math.cos(a) * cr * 0.3, cy + Math.sin(a) * cr * 0.3); c.lineTo(cx + Math.cos(a) * cr, cy + Math.sin(a) * cr); } c.stroke();
      /* spiegelverkehrte römische Ziffern (von innen gesehen) */
      c.fillStyle = "rgba(40,26,14,.8)"; for (let k = 0; k < 12; k++) { const a = -PI / 2 - k / 12 * TAU, rx = cx + Math.cos(a) * cr * 0.88, ry = cy + Math.sin(a) * cr * 0.88; const n = (k % 4) + 1; for (let j = 0; j < n; j++) c.fillRect(rx - n + j * 2, ry - 3, 0.9, 6); }
      o.lights.push({ x: cx, y: cy, r: cr * 2.2, col: "#ffe0b0", ph: 0, a: 0.25, f: 0, soft: true });
      o.shafts.push({ x: cx - cr * 0.6, y: cy, w: cr * 1.2, len: 280, ang: 1.15, col: "#ffe0b0", a: 0.05, ph: 1 });
      o.gears.push({ x: cx, y: cy, r: cr * 0.7, clock: true });
      /* Haupträderwerk: ineinandergreifende Zahnräder */
      const brass = "#a07a3a", iron = "#5a524c", bronze = "#8a5a32";
      /* Antriebswelle vom Zifferblatt zu den Rädern */
      c.fillStyle = "#4a3a2a"; c.fillRect(cx - cr - 60, cy - 2, cr * 2 + 120, 4); c.fillStyle = "rgba(255,230,180,.25)"; c.fillRect(cx - cr - 60, cy - 2, cr * 2 + 120, 0.8);
      gearTrain(o, cx + cr + 30, cy, [[24, 0, brass], [40, 0.4, iron], [16, -0.6, brass], [30, -1.3, bronze], [12, -0.2, brass]], 0.12);
      gearTrain(o, cx - cr - 30, cy, [[24, 0, brass], [46, PI - 0.3, bronze], [20, PI + 0.6, brass], [32, PI + 1.4, iron]], -0.12);
      gearTrain(o, cx, cy + cr + 26, [[20, 0, iron], [14, 0.2, brass]], 0.1);
      gearTrain(o, 130, 280, [[36, 0, iron], [18, -0.8, brass], [44, -0.2, bronze]], 0.08);
      gearTrain(o, 1300, 290, [[30, 0, bronze], [52, -2.6, iron], [14, -1.6, brass]], -0.1);
      gearTrain(o, 420, 60, [[28, 0, brass], [20, 0.9, iron], [36, 0.1, bronze]], 0.1);
      /* vorderes Gebälk mit Bühnen und Leitern */
      c.strokeStyle = wood; c.lineWidth = 7; c.beginPath(); for (let x = 64; x < PW; x += 384) { c.moveTo(x, 0); c.lineTo(x, H); c.moveTo(x + 40, 0); c.lineTo(x + 40, H); } c.stroke();
      c.strokeStyle = "rgba(255,220,170,.14)"; c.lineWidth = 1.2; c.beginPath(); for (let x = 61; x < PW; x += 384) { c.moveTo(x, 0); c.lineTo(x, H); c.moveTo(x + 37, 0); c.lineTo(x + 37, H); } c.stroke();
      for (const yy of [214, 330]) { c.fillStyle = wood; c.fillRect(0, yy, PW, 6); c.fillStyle = "rgba(0,0,0,.4)"; for (let x = 0; x < PW; x += 5) c.fillRect(x, yy, 0.4, 6); c.fillStyle = "rgba(255,220,170,.18)"; c.fillRect(0, yy, PW, 0.8); }
      for (let x = 200; x < PW; x += 420) { c.strokeStyle = "#4a3020"; c.lineWidth = 1; c.beginPath(); c.moveTo(x, 214); c.lineTo(x, 330); c.moveTo(x + 10, 214); c.lineTo(x + 10, 330); for (let yy = 218; yy < 330; yy += 6) { c.moveTo(x, yy); c.lineTo(x + 10, yy); } c.stroke(); }
      /* Glocken im Stuhl */
      for (let i = 0; i < 4; i++) {
        const x = 192 + i * 384, s = 2.1 + R() * 0.6, y = 120;
        c.fillStyle = wood; c.fillRect(x - 44, y - 26, 88, 7); c.fillRect(x - 44, y - 26, 6, 120); c.fillRect(x + 38, y - 26, 6, 120); c.strokeStyle = wood; c.lineWidth = 3; c.beginPath(); c.moveTo(x - 41, y + 60); c.lineTo(x - 20, y - 20); c.moveTo(x + 41, y + 60); c.lineTo(x + 20, y - 20); c.stroke();
        o.swings.push({ sp: bellSprite(o, s, R() < 0.5 ? "#a87a3a" : "#8a6a3a"), x, y: y - 20, amp: 0.3, fr: 0.9 + R() * 0.3, ph: R() * 9, bell: true });
        c.strokeStyle = "#c8b090"; c.lineWidth = 0.6; c.beginPath(); c.moveTo(x + 10, y - 18); c.quadraticCurveTo(x + 14, y + 80, x + 8, 330); c.stroke();
      }
      /* Pendel und Gegengewichte */
      o.swings.push({ sp: pendulumSprite(o, 190), x: cx, y: cy + 30, amp: 0.18, fr: 1.2, ph: 0 });
      for (let i = 0; i < 6; i++) { const x = 100 + i * 260 + R() * 60; o.movers.push({ x, top: 0, y0: 80 + R() * 40, y1: 220 + R() * 80, ph: R() * 9, fr: 0.04 + R() * 0.04, kind: "weight" }); }
      /* Wendeltreppe an der Wand */
      for (let x = 300; x < PW; x += 760) stairs(o, x, 330, 22, 4, 5.2, 1, o.hz(st, 0.05), 3);
      o.flocks.push({ x: 768, y: 70, cross: true, v: 10, n: 4, size: 1.6, col: "#c8c0c0", kind: "dove", span: 1700 });
      o.motes.push({ x: 0, y: 20, w: PW, h: 300, n: 60, col: "#ffe8c8", kind: "dust" });
      o.motes.push({ x: 0, y: 0, w: PW, h: 330, n: 14, col: "#e8e0d8", kind: "feather" });
      o.topFill = shade(wb, -0.5); o.botFill = "#1a120c";
    },
    /* ---------- Runenschmiede: Essen, Glutrinnen, Runen ---------- */
    forge(o, H) {
      const { c, R, pal } = o; const st = pal.stone;
      const wb = o.hz(st, 0.5); body(o, 0, 0, PW, H, wb, 0.2); masonry(o, 0, 0, PW, H, wb, 7);
      /* ferne Hallenpfeiler mit Runenbändern und Zwergenstatuen */
      for (let x = 64; x < PW; x += 128) { const col = o.hz(st, 0.42); body(o, x - 14, 0, 28, H, col); masonry(o, x - 14, 0, 28, H, col, 4); for (const yy of [80, 180, 280]) { c.fillStyle = shade(col, -0.2); c.fillRect(x - 15, yy, 30, 8); o.glows.push({ x, y: yy + 4, r: 10, col: "#ffb040", ph: R() * 9, kind: "rune", a: 0.5 }); c.fillStyle = "#ffb040"; for (let k = 0; k < 5; k++) c.fillRect(x - 11 + k * 5, yy + 2, 2, 4); } }
      for (let x = 0; x < PW; x += 256) dwarfStatue(o, x + 128, 250, 2.4, o.hz(st, 0.35));
      mist(o, 0, H, "#3a1e0c", 0.3);
      /* große Essen in Bogennischen */
      for (let x = 30; x < PW; x += 192) {
        const col = o.hz(st, 0.12), w = 120, base = 300;
        /* Rauchfang bis zur Decke */
        c.fillStyle = shade(col, -0.15); c.beginPath(); c.moveTo(x + 30, 0); c.lineTo(x + 90, 0); c.lineTo(x + 110, 180); c.lineTo(x + 10, 180); c.fill(); masonry(o, x + 10, 0, 100, 180, shade(col, -0.15), 4);
        body(o, x, 180, w, 120, col); masonry(o, x, 180, w, 120, col, 4); crenels(o, x - 2, 180, w + 4, col, 6);
        c.fillStyle = "#1a0804"; winPath(c, x + 22, 220, 76, 80, "arch"); c.fill();
        const fg = c.createLinearGradient(0, 240, 0, 300); fg.addColorStop(0, "rgba(255,120,30,0)"); fg.addColorStop(1, "rgba(255,150,50,.9)"); c.fillStyle = fg; winPath(c, x + 26, 240, 68, 60, "arch"); c.fill();
        for (let k = 0; k < 40; k++) { c.fillStyle = R() < 0.5 ? "#ffd060" : "#ff7a20"; c.beginPath(); c.arc(x + 30 + R() * 60, 296 - R() * 10, 1 + R() * 2.4, 0, TAU); c.fill(); }
        o.glows.push({ x: x + 60, y: 286, r: 60, col: "#ff6a1a", ph: R() * 9, kind: "forge", a: 0.5 });
        o.sparks.push({ x: x + 34, y: 290, w: 52, h: 120, n: 14, col: "#ffb040", sp: 0.35, size: 0.8 });
        o.smoke.push({ x: x + 60, y: 2, ph: R() * 9, s: 1.6 });
        /* Blasebalg */
        o.movers.push({ x: x + w + 10, top: 0, y0: 282, y1: 286, ph: R() * 9, fr: 0.5, kind: "bellows" });
        for (let k = 0; k < 4; k++) { c.fillStyle = "#2a1a10"; c.fillRect(x + 8 + k * 30, 175, 1, 5); c.fillStyle = "#4a4440"; c.fillRect(x + 6 + k * 30, 170, 5, 5); }
        /* Runenband am Rauchfang */
        c.fillStyle = shade(col, -0.35); c.fillRect(x + 18, 120, 84, 10); for (let k = 0; k < 9; k++) { c.fillStyle = "#ffb040"; const rx = x + 22 + k * 9; c.fillRect(rx, 122, 1, 6); c.fillRect(rx + 1, 122 + (k % 3) * 2, 3, 1); if (k & 1) c.fillRect(rx + 3, 124, 1, 4); }
        o.glows.push({ x: x + 60, y: 125, r: 30, col: "#ffb040", ph: x * 0.01, kind: "rune", a: 0.4 });
        dwarfStatue(o, x + 156, 300, 1.7, o.hz(st, 0.05)); c.fillStyle = "#ffb040"; c.beginPath(); c.arc(x + 156, 300 - 38 * 1.7, 1.2, 0, TAU); c.fill();
      }
      /* Laufkran mit Schmelztiegel */
      c.fillStyle = "#2a2422"; c.fillRect(0, 26, PW, 5); for (let x = 0; x < PW; x += 12) { c.fillStyle = "#3a3230"; c.fillRect(x, 31, 1.5, 4); }
      for (let i = 0; i < 3; i++) o.movers.push({ x0: 100 + i * 500, x1: 400 + i * 500, top: 31, y: 150, ph: R() * 9, fr: 0.05, kind: "crucible" });
      /* Glutrinnen im Boden, die über Stufen fließen */
      const fy = 318; c.fillStyle = shade(o.hz(st, 0.05), -0.2); c.fillRect(0, fy - 8, PW, H - fy + 8); masonry(o, 0, fy - 8, PW, H - fy + 8, shade(o.hz(st, 0.05), -0.2), 4);
      c.fillStyle = shade(o.hz(st, 0.05), 0.1); c.fillRect(0, fy - 2, PW, 2); c.fillRect(0, fy + 10, PW, 2); const lg = c.createLinearGradient(0, fy, 0, fy + 10); lg.addColorStop(0, "#ffe080"); lg.addColorStop(0.5, "#ff8a2a"); lg.addColorStop(1, "#a02a06"); c.fillStyle = lg; c.fillRect(0, fy, PW, 10);
      for (let x = 0; x < PW; x += 40) bake(o, x, fy + 3, 30, "#ff6a1a", 0.25);
      o.lava.push({ x0: 0, x1: PW, y: fy + 1, h: 8, n: 140, v: 14 });
      for (let x = 160; x < PW; x += 384) { c.fillStyle = "#ff8a2a"; c.beginPath(); c.moveTo(x - 3, 180); c.quadraticCurveTo(x - 4, 250, x - 2, fy); c.lineTo(x + 2, fy); c.quadraticCurveTo(x + 4, 250, x + 3, 180); c.fill(); o.lava.push({ x0: x - 2, x1: x + 2, y: 180, h: fy - 180, n: 18, v: 40, vert: true }); }
      /* Ambosse, Waffenständer, Rüstungen ohne Träger */
      for (let x = 60; x < PW; x += 150 + R() * 60) {
        const t = R();
        if (t < 0.4) { c.fillStyle = "#2a2626"; c.fillRect(x - 6, fy - 16, 12, 6); c.fillRect(x - 3, fy - 10, 6, 10); c.beginPath(); c.moveTo(x + 6, fy - 16); c.lineTo(x + 12, fy - 15); c.lineTo(x + 6, fy - 12); c.fill(); c.fillStyle = "rgba(255,220,200,.3)"; c.fillRect(x - 6, fy - 16, 12, 0.6); o.sparks.push({ x: x - 4, y: fy - 16, w: 8, h: 30, n: 6, col: "#ffd060", sp: 0.8, size: 0.6, burst: true }); }
        else if (t < 0.7) armour(o, x, fy - 8, 1.5, "#6a6060");
        else { c.fillStyle = "#3a2418"; c.fillRect(x - 10, fy - 30, 20, 1.6); c.fillRect(x - 10, fy - 18, 20, 1.6); for (let k = 0; k < 5; k++) { c.fillStyle = "#8a8280"; c.fillRect(x - 8 + k * 4, fy - 36, 0.8, 26); c.fillStyle = "#4a3020"; c.fillRect(x - 8.4 + k * 4, fy - 14, 1.6, 4); } }
      }
      /* Runenkreise am Boden und Wand */
      for (let i = 0; i < 6; i++) o.glows.push({ x: 128 + i * 256 + R() * 40, y: 120 + R() * 60, r: 20 + R() * 10, col: "#ffb040", ph: R() * 9, kind: "runering", a: 0.5 });
      o.motes.push({ x: 0, y: 0, w: PW, h: 320, n: 50, col: "#ff9a40", kind: "ember" });
      o.topFill = shade(wb, -0.5); o.botFill = "#1a0c06";
    },
    /* ---------- Spinnenschlund: Netze, Pilzwälder ---------- */
    chasm(o, H) {
      const { c, R, pal } = o; const rock = pal.rock;
      body(o, 0, 0, PW, H, o.hz(rock, 0.6), 0.1); rockTex(o, 0, 0, PW, H, o.hz(rock, 0.6), 1800);
      /* ferne Säulen (Tropfsteinsäulen) */
      for (let i = 0; i < 10; i++) { const x = R() * PW, w = 20 + R() * 40, col = o.hz(rock, 0.5); wrapX(o, x - w, w * 2, xx => { c.fillStyle = col; c.beginPath(); c.moveTo(xx - w, 0); c.quadraticCurveTo(xx - w * 0.15, H * 0.45, xx - w * 0.5, H); c.lineTo(xx + w * 0.5, H); c.quadraticCurveTo(xx + w * 0.15, H * 0.45, xx + w, 0); c.fill(); rockTex(o, xx - w * 0.4, 0, w * 0.8, H, col, 60); }); }
      mist(o, 60, 260, pal.fog, 0.4);
      for (let i = 0; i < 30; i++) mushroom(o, R() * PW, 250 + R() * 20, 10 + R() * 18, o.hz(R.pick(["#8a4ac0", "#c86ad0", "#a05a9a"]), 0.45), null);
      /* Felsterrassen mit Schichten */
      const t1 = sinF(262, [[14, 3, 0.4], [8, 7, 1.2], [3, 17, 2]]); crag(o, jag(R, -20, PW + 20, t1, 10, 5), H, o.hz(rock, 0.35), {});
      /* riesige Netze zwischen den Säulen */
      for (let i = 0; i < 6; i++) { const x = 120 + i * 260 + R() * 60, y = 90 + R() * 90, r = 60 + R() * 50; web(o, x, y, r, { n: 14, col: "rgba(230,220,240,.28)", lw: 0.4, anchor: [[x - r * 1.4, y - r], [x + r * 1.5, y - r * 0.8], [x - r * 1.2, y + r * 1.1], [x + r * 1.3, y + r * 1.2]] }); }
      /* Kokons */
      for (let i = 0; i < 9; i++) { const x = R() * PW, L = 20 + R() * 60, s = 0.8 + R() * 0.6; const sp = mkSprite(o, 14 * s, L + 20 * s, 7 * s, 1, so => { const sc = so.c; sc.strokeStyle = "rgba(230,220,240,.5)"; sc.lineWidth = 0.4; sc.beginPath(); sc.moveTo(0, 0); sc.lineTo(0, L); sc.stroke(); const g = sc.createLinearGradient(-5 * s, 0, 5 * s, 0); g.addColorStop(0, "#e8e0e8"); g.addColorStop(1, "#8a7a8a"); sc.fillStyle = g; sc.beginPath(); sc.ellipse(0, L + 8 * s, 4 * s, 9 * s, 0, 0, TAU); sc.fill(); sc.strokeStyle = "rgba(120,100,120,.6)"; sc.lineWidth = 0.35; sc.beginPath(); for (let k = 0; k < 7; k++) { sc.moveTo(-4 * s, L + k * 2.4 * s); sc.lineTo(4 * s, L + k * 2.4 * s + 2 * s); } sc.stroke(); });
        o.swings.push({ sp, x, y: 0, amp: 0.08, fr: 0.5 + R() * 0.4, ph: R() * 9 }); }
      /* Steinbrücke mit Drow-Statue und zerrissene Hängebrücken */
      const bx = 900; bridgeArches(o, bx, bx + 62, 176, 3, 196, o.hz(pal.stone, 0.2), 1, { under: null }); bridgeArches(o, bx + 92, bx + 220, 176, 3, 196, o.hz(pal.stone, 0.2), 3, { under: null });
      statue(o, bx + 170, 174, 1.4, o.hz(pal.stone, 0.15), { robe: true });
      for (let i = 0; i < 3; i++) { const x = 140 + i * 420, y = 150 + R() * 50; c.strokeStyle = "#5a4a3a"; c.lineWidth = 0.7; c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + 50, y + 30, x + 90, y + 18); c.moveTo(x, y - 8); c.quadraticCurveTo(x + 50, y + 22, x + 90, y + 10); c.stroke(); for (let k = 0; k < 12; k++) { const t = k / 12, yy = y + 2 * 30 * t * (1 - t) * 0.95 + t * 18 * t; c.fillStyle = "#4a3828"; c.save(); c.translate(x + t * 90, yy); c.rotate(0.2 * t); c.fillRect(0, 0, 5, 1.5); c.restore(); } c.beginPath(); c.moveTo(x + 90, y + 18); c.lineTo(x + 92, y + 50); c.stroke(); }
      /* Pilzwald im Vordergrund */
      const t2 = sinF(320, [[10, 4, 1.4], [5, 9, 0.6]]); crag(o, jag(R, -20, PW + 20, t2, 8, 4), H, o.hz(rock, 0.15), { moss: "#4a2a5a" });
      for (let i = 0; i < 60; i++) { const x = R() * PW, h = 10 + R() * R() * 70, cap = R.pick(["#8a4ac0", "#c86ad0", "#a85ab0", "#d88a40", "#6aa040"]); wrapX(o, x - h * 0.6, h * 1.2, xx => mushroom(o, xx, t2(xx) + 6, h, cap, h > 30 ? (cap === "#d88a40" ? "#ffb060" : cap === "#6aa040" ? "#b0ff70" : "#e090ff") : null)); }
      for (let i = 0; i < 12; i++) crystal(o, R() * PW, t2(0) + 10 + R() * 30, 10 + R() * 14, R() < 0.6 ? "#b070e0" : "#e070b0");
      for (let i = 0; i < 24; i++) stalagmite(o, R() * PW, H, 10 + R() * 20, 30 + R() * 60, o.hz(rock, 0.05));
      stalactites(o, 90, o.hz(rock, 0.1), 100);
      for (let i = 0; i < 10; i++) o.spiders.push({ x: R() * PW, y0: 0, len: 60 + R() * 160, ph: R() * 9, s: 0.8 + R() * 0.7 });
      o.motes.push({ x: 0, y: 120, w: PW, h: 240, n: 80, col: "#e8a0ff", kind: "spore" });
      o.eyes.push(...Array.from({ length: 10 }, () => ({ x: R() * PW, y: 60 + R() * 200, ph: R() * 30, col: "#ff3a40", many: true })));
      o.flocks.push({ x: 700, y: 90, rx: 120, ry: 40, n: 10, sp: 0.45, size: 1.4, col: "#0a060c", kind: "bat" });
      o.topFill = "#0c0812"; o.botFill = "#0c0812";
    },
    /* ---------- Schwarzer See: versunkener Tempel, Wasserfälle ---------- */
    lake(o, H) {
      const { c, R, pal } = o; const rock = pal.rock, wl = 262;
      body(o, 0, 0, PW, H, o.hz(rock, 0.6), 0.1); rockTex(o, 0, 0, PW, wl, o.hz(rock, 0.6), 1200);
      /* gestaffelte Felsbänke der fernen Höhlenwand, aus deren Kanten Wasser stürzt */
      const ledges = [[96, 0.52, 3.1], [150, 0.44, 1.7], [200, 0.36, 0.6]], lf = [];
      for (const [b, f, sd] of ledges) { const yf = sinF(b, [[18, 2, sd], [10, 5, sd * 2], [4, 13, sd * 3]]); lf.push(yf); crag(o, jag(R, -20, PW + 20, yf, 12, 5), H, o.hz(rock, f), { moss: o.hz("#2a4a2a", f) }); }
      for (const [x, li, w] of [[130, 0, 14], [560, 1, 10], [930, 0, 18], [1330, 1, 12], [1480, 2, 8], [300, 2, 7]]) { const y = lf[li](x) - 2; o.falls.push({ x: x - w / 2, y, h: wl - y, w }); c.fillStyle = o.hz(rock, 0.2); c.beginPath(); c.ellipse(x, y + 1, w * 0.8, 2.4, 0, 0, TAU); c.fill(); bake(o, x, wl, 34, "#c8e8c0", 0.18); }
      mist(o, 170, 110, pal.fog, 0.45);
      /* versunkene Bögen im Wasser */
      for (let i = 0; i < 6; i++) { const x = 60 + i * 260 + R() * 60, w = 30 + R() * 20, col = o.hz(pal.stone, 0.3); c.fillStyle = col; c.fillRect(x - w / 2 - 5, wl - w * 0.9, 5, w * 0.9 + 4); c.fillRect(x + w / 2, wl - w * 0.9, 5, w * 0.9 + 4); c.strokeStyle = col; c.lineWidth = 5; c.beginPath(); c.arc(x + 0, wl - w * 0.9, w / 2 + 2.5, PI, 0); c.stroke(); masonry(o, x - w / 2 - 5, wl - w * 1.45, w + 10, w * 1.45, col, 2.6); }
      /* zwei Tempel der Kuo-Toa */
      for (let t = 0; t < 2; t++) {
        const cx = 380 + t * 800, col = o.hz(pal.stone, 0.16 + t * 0.05), s = 1.25;
        for (let k = 0; k < 5; k++) { const w = (220 - k * 36) * s, y = wl - k * 18 * s; body(o, cx - w / 2, y - 18 * s, w, 18 * s, shade(col, -k * 0.03)); masonry(o, cx - w / 2, y - 18 * s, w, 18 * s, col, 3); c.fillStyle = rgba(pal.light, 0.2); c.fillRect(cx - w / 2, y - 18 * s, w, 0.7); for (let xx = cx - w / 2 + 6; xx < cx + w / 2 - 6; xx += 14) { c.fillStyle = rgba(shade(col, -0.4), 0.5); c.beginPath(); c.arc(xx, y - 9 * s, 2.2, 0, TAU); c.fill(); } }
        const top = wl - 90 * s;
        for (let k = -3; k <= 3; k++) { if (k === 0) continue; const px = cx + k * 26 * s, ct = top - 36 - (3 - Math.abs(k)) * 6; column(o, px, ct, top, 8, col); c.fillStyle = rgba(shade(col, -0.4), 0.4); for (let yy = ct + 4; yy < top - 6; yy += 3) for (let xx = px - 3; xx < px + 3; xx += 2) { c.beginPath(); c.arc(xx + ((yy / 3) & 1), yy, 0.8, 0, PI); c.fill(); } }
        c.fillStyle = shade(col, 0.05); c.beginPath(); c.moveTo(cx - 110 * s, top - 36); c.lineTo(cx, top - 80); c.lineTo(cx + 110 * s, top - 36); c.fill(); c.fillStyle = shade(col, -0.2); c.fillRect(cx - 110 * s, top - 38, 220 * s, 4);
        c.fillStyle = rgba(shade(col, -0.4), 0.6); c.beginPath(); c.moveTo(cx - 60, top - 42); c.lineTo(cx, top - 72); c.lineTo(cx + 60, top - 42); c.closePath(); c.fill(); c.fillStyle = "#8aff9a"; c.beginPath(); c.arc(cx, top - 54, 5, 0, TAU); c.fill(); o.glows.push({ x: cx, y: top - 54, r: 14, col: "#8aff9a", ph: R() * 9, kind: "pulse", a: 0.6 });
        c.fillStyle = "#0a1410"; winPath(c, cx - 16, top - 30, 32, 30, "arch"); c.fill(); bake(o, cx, top - 12, 26, "#8aff9a", 0.35);
        o.glows.push({ x: cx, y: top - 14, r: 34, col: "#8aff9a", ph: R() * 9, kind: "pulse", a: 0.45 });
        for (const d of [-1, 1]) fishStatue(o, cx + d * 150, wl - 2, 1.9, col, d);
        stairs(o, cx - 20, wl + 2, 6, 6.6, 3, 1, col, 2);
      }
      /* Kolossalstatue der Fischgöttin, halb im Wasser */
      idol(o, 780, wl + 4, 2.4, o.hz(pal.stone, 0.12));
      /* Spiegelung im Wasser: Streifen mit leichtem Versatz */
      const s = o.s, ref = document.createElement("canvas"); ref.width = Math.ceil(PW * s); ref.height = Math.ceil(160 * s); const rc = ref.getContext("2d"); rc.drawImage(c.canvas, 0, (wl - 160) * s, PW * s, 160 * s, 0, 0, PW * s, 160 * s);
      c.fillStyle = mix(pal.water, "#000", 0.3); c.fillRect(0, wl, PW, H - wl);
      c.save(); c.globalAlpha = 0.45; for (let yy = 0; yy < 120; yy += 2) { const off = Math.sin(yy * 0.7) * (1 + yy * 0.03); c.drawImage(ref, 0, (160 - yy - 2) * s, PW * s, 2 * s, off, wl + yy, PW, 2); } c.restore();
      const wg = c.createLinearGradient(0, wl, 0, H); wg.addColorStop(0, rgba(pal.water, 0.15)); wg.addColorStop(1, rgba("#000", 0.6)); c.fillStyle = wg; c.fillRect(0, wl, PW, H - wl);
      c.fillStyle = rgba(pal.light, 0.3); c.fillRect(0, wl, PW, 0.6);
      addGlints(o, 0, PW, wl + 1, H, 220, "#c8ffd0", 0.3);
      for (let i = 0; i < 30; i++) o.ripples.push({ x: R() * PW, y: wl + 4 + R() * 80, ph: R() * 9 });
      for (let i = 0; i < 40; i++) { const x = R() * PW, y = wl + R() * 90; bake(o, x, y, 6 + R() * 8, "#70e090", 0.2); }
      /* flache Felsinseln mit Pilzen und Tropfsteinen im Vordergrund */
      const fr = sinF(334, [[8, 3, 2], [4, 7, 0.3]]);
      for (let i = 0; i < 6; i++) { const x = 40 + i * 260 + R() * 80, w = 90 + R() * 80; crag(o, jag(R, x - 10, x + w + 10, xx => fr(xx) + 10 - Math.sin(Math.max(0, Math.min(1, (xx - x + 10) / (w + 20))) * PI) * (16 + 6 * Math.sin(xx * 0.13)), 5, 3), H, o.hz(rock, 0.06), { moss: "#2a4a2a" }); for (let k = 0; k < 6; k++) { const mx = x + 10 + R() * (w - 20); mushroom(o, mx, fr(mx) - 8, 6 + R() * 14, R.pick(["#4a9a5a", "#7ac070", "#c8a050"]), R() < 0.5 ? "#a0ff90" : null, { stem: "#c8d0b8" }); } stalagmite(o, x + w * 0.7, fr(x + w * 0.7) - 6, 8, 20 + R() * 24, o.hz(rock, 0.04)); }
      stalactites(o, 80, o.hz(rock, 0.12), 90);
      o.bobs.push({ sp: boatSprite(o, 1, "#2a2018", null), x0: -40, x1: PW + 40, y: wl + 30, v: 3, ph: 400, amp: 0.8, fr: 1, rot: 0.05, lantern: true, lcol: "#c8ffb0" });
      o.mists.push({ y: wl - 30, h: 50, a: 0.4, sp: 2, col: "#a8c8a8" }); o.mists.push({ y: 160, h: 60, a: 0.2, sp: -1.5, col: "#90b090" });
      o.motes.push({ x: 0, y: 100, w: PW, h: 160, n: 40, col: "#90ffa0", kind: "firefly" });
      o.topFill = "#06100c"; o.botFill = "#030806";
    },
    /* ---------- Glutgassen: Stadt mit Kaminen und Glutfluss ---------- */
    embercity(o, H) {
      const { c, R, pal } = o; const rock = pal.rock, st = pal.stone;
      body(o, 0, 0, PW, H, o.hz(rock, 0.55), 0.1); rockTex(o, 0, 0, PW, H, o.hz(rock, 0.55), 900);
      const glowBand = c.createLinearGradient(0, 120, 0, H); glowBand.addColorStop(0, "rgba(255,90,20,0)"); glowBand.addColorStop(1, "rgba(255,90,20,.25)"); c.fillStyle = glowBand; c.fillRect(0, 120, PW, H - 120);
      /* ferne Stadtterrassen an der Höhlenwand */
      for (let t = 0; t < 4; t++) { const base = 150 + t * 36, f = 0.62 - t * 0.06; for (let x = R() * 10; x < PW; x += 8 + R() * 6) { const w = 6 + R() * 6, h = 6 + R() * 12, col = o.hz(st, f); c.fillStyle = col; c.fillRect(x, base - h, w, h + 36); if (R() < 0.5) { c.fillStyle = "#ffa040"; c.globalAlpha = 0.7; c.fillRect(x + w / 2 - 0.6, base - h + 2, 1.2, 1.4); c.globalAlpha = 1; } } }
      mist(o, 120, 140, "#5a2a10", 0.4);
      /* Ketten von der Decke mit Plattformen */
      for (let i = 0; i < 5; i++) { const x = 150 + i * 300 + R() * 60; chain(o, x - 20, 0, 90, "#2e2420"); chain(o, x + 20, 0, 90, "#2e2420"); c.fillStyle = o.hz(st, 0.3); c.fillRect(x - 26, 90, 52, 6); house(o, x - 14, 90, 28, 18, { far: 0.3, wall: "#5a4a40", roof: "#3a2a24" }); }
      /* Schmiedetürme mit Schloten */
      for (let i = 0; i < 6; i++) { const x = 80 + i * 256 + R() * 60, w = 20 + R() * 12, h = 160 + R() * 60, col = o.hz(st, 0.25); tower(o, x, 300, w, h, col, { head: "cren", far: 0.25, bart: false, wcol: "#ffa040", lit: 0.5 }); for (const d of [0.25, 0.7]) { const sx = x + w * d - 2; c.fillStyle = shade(col, -0.2); c.fillRect(sx, 300 - h - 40, 4, 34); o.smoke.push({ x: sx + 2, y: 300 - h - 41, ph: R() * 9, s: 1.5, dark: true }); o.glows.push({ x: sx + 2, y: 300 - h - 40, r: 8, col: "#ff6a1a", ph: R() * 9, kind: "forge", a: 0.5 }); } }
      /* dichte Häuser in Terrassen mit Treppen und Balkonen */
      for (let t = 0; t < 3; t++) {
        const base = 250 + t * 30, f = 0.3 - t * 0.1;
        for (let x = -10 + R() * 20; x < PW; x += 16 + R() * 12) { const w = 14 + R() * 12, h = 16 + R() * 26; dwarfHouse(o, x, base, w, h, f); if (R() < 0.08) { stairs(o, x + w, base, 6, 2, 4, 1, o.hz(st, f), 3); } }
        c.fillStyle = o.hz(st, f + 0.05); c.fillRect(0, base, PW, 4); c.fillStyle = "rgba(255,140,60,.2)"; c.fillRect(0, base, PW, 0.6);
      }
      /* grüne Feuerschalen */
      for (let i = 0; i < 10; i++) { const x = R() * PW, y = 248 + ((R() * 3) | 0) * 30; c.fillStyle = "#2a2220"; c.fillRect(x - 3, y - 3, 6, 3); c.fillRect(x - 0.6, y, 1.2, 4); o.flames.push({ x, y: y - 3, s: 1.6, ph: R() * 9, col: "green" }); }
      /* Glutfluss mit Brücken und Glutfall */
      const ly = 322;
      const lg = c.createLinearGradient(0, ly, 0, H); lg.addColorStop(0, "#ffd070"); lg.addColorStop(0.2, "#ff8a2a"); lg.addColorStop(1, "#5a1404"); c.fillStyle = lg; c.fillRect(0, ly, PW, H - ly);
      const crust = new Path2D(); for (let i = 0; i < 220; i++) { const x = R() * PW, y = ly + 5 + R() * (H - ly - 5), w = 5 + R() * 16, h = 1 + R() * 2.4 + (y - ly) * 0.05; crust.moveTo(x - w, y); crust.lineTo(x - w * 0.4, y - h); crust.lineTo(x + w * 0.5, y - h * 0.8); crust.lineTo(x + w, y + h * 0.2); crust.lineTo(x + w * 0.2, y + h); crust.lineTo(x - w * 0.6, y + h * 0.8); crust.closePath(); }
      c.fillStyle = "rgba(58,16,6,.78)"; c.fill(crust); c.strokeStyle = "rgba(255,200,90,.45)"; c.lineWidth = 0.5; c.stroke(crust);
      for (let x = 0; x < PW; x += 60) bake(o, x, ly + 6, 50, "#ff6a1a", 0.25);
      o.lava.push({ x0: 0, x1: PW, y: ly + 1, h: H - ly - 4, n: 160, v: 10 });
      for (const x of [260, 1030]) { const lg2 = c.createLinearGradient(x - 8, 0, x + 8, 0); lg2.addColorStop(0, "#c8400a"); lg2.addColorStop(0.4, "#ffb050"); lg2.addColorStop(1, "#a0300a"); c.fillStyle = lg2; c.fillRect(x - 8, 0, 16, ly); o.falls.push({ x: x - 8, y: 0, h: ly, w: 16, lava: true }); bake(o, x, ly, 60, "#ff7a2a", 0.4); o.sparks.push({ x: x - 20, y: ly, w: 40, h: 60, n: 20, col: "#ffc060", sp: 0.6, size: 0.9 }); }
      for (const [x0, x1] of [[420, 620], [1200, 1400]]) { bridgeArches(o, x0, x1, ly - 14, 3, ly + 20, o.hz(st, 0.05), 3, { lamps: true, under: null }); o.walkers.push({ x0: x0 + 6, x1: x1 - 6, y0: ly - 16.6, y1: ly - 16.6, v: 5, ph: R() * 50, kind: "cart", s: 1 }); }
      stalactites(o, 70, o.hz(rock, 0.2), 70);
      o.motes.push({ x: 0, y: 100, w: PW, h: 260, n: 80, col: "#ff9a40", kind: "ember" });
      o.mists.push({ y: 190, h: 60, a: 0.3, sp: 3, col: "#5a3020" });
      o.topFill = "#140806"; o.botFill = "#5a1404";
    }
  };
  /* ---------- weitere Baugruppen für die Innenseiten ---------- */
  function arcadeRow(o, x, base, w, h, col) { const c = o.c; c.fillStyle = "#0c0709"; winPath(c, x + w * 0.15, base - h, w * 0.7, h, "point"); c.fill(); c.strokeStyle = shade(col, 0.15); c.lineWidth = 1; winPath(c, x + w * 0.15 - 0.5, base - h - 0.5, w * 0.7 + 1, h + 0.5, "point"); c.stroke(); }
  function tunnel(o, cx, base, w, h, col, n) {
    const c = o.c;
    for (let k = 0; k < n; k++) {
      const f = k / n, ww = w * (1 - f * 0.75), hh = h * (1 - f * 0.75), bb = base - h * f * 0.3, cc = o.hz(col, 0.5 + f * 0.4);
      c.fillStyle = shade(cc, -0.1 - f * 0.3); winPath(c, cx - ww / 2 - 4, bb - hh - 4, ww + 8, hh + 4, "arch"); c.fill();
      c.strokeStyle = rgba(shade(cc, 0.2), 0.5); c.lineWidth = 0.6; winPath(c, cx - ww / 2 - 4, bb - hh - 4, ww + 8, hh + 4, "arch"); c.stroke();
      c.fillStyle = shade(cc, -0.5 - f * 0.3); winPath(c, cx - ww / 2, bb - hh, ww, hh, "arch"); c.fill();
    }
    bake(o, cx, base - h * 0.3 - 10, 18, "#ffb060", 0.4); o.lights.push({ x: cx, y: base - h * 0.3 - 10, r: 14, col: WARM, ph: o.R() * 9, a: 0.4, f: 2 });
  }
  function tunnelArch(o, cx, base, w, h, col) {
    const c = o.c; c.fillStyle = shade(col, -0.15); winPath(c, cx - w / 2 - 5, base - h - 5, w + 10, h + 5, "point"); c.fill();
    const g = c.createLinearGradient(0, base - h, 0, base); g.addColorStop(0, rgba(shade(col, -0.55), 1)); g.addColorStop(1, rgba(shade(col, -0.25), 1)); c.fillStyle = g; winPath(c, cx - w / 2, base - h, w, h, "point"); c.fill();
    for (let k = 1; k < 4; k++) { const f = k / 4; c.strokeStyle = rgba(shade(col, -0.2), 0.5 - f * 0.1); c.lineWidth = 1; winPath(c, cx - w * (1 - f * 0.5) / 2, base - h * (1 - f * 0.45), w * (1 - f * 0.5), h * (1 - f * 0.45), "point"); c.stroke(); }
    if (o.R() < 0.4) bake(o, cx, base - h * 0.3, 14, "#ff9040", 0.25);
  }
  /* Kolossalstatue der Fischgöttin (Kuo-Toa), aus dem See ragend */
  function idol(o, x, base, s, col) {
    const c = o.c; const g = c.createLinearGradient(x - 30 * s, 0, x + 30 * s, 0); g.addColorStop(0, shade(col, 0.25)); g.addColorStop(0.45, col); g.addColorStop(1, shade(col, -0.5)); c.fillStyle = g;
    c.beginPath(); c.moveTo(x - 24 * s, base); c.quadraticCurveTo(x - 26 * s, base - 30 * s, x - 18 * s, base - 46 * s); c.lineTo(x + 18 * s, base - 46 * s); c.quadraticCurveTo(x + 26 * s, base - 30 * s, x + 24 * s, base); c.fill();
    /* Scheren erhoben */
    for (const d of [-1, 1]) { c.beginPath(); c.moveTo(x + d * 16 * s, base - 42 * s); c.quadraticCurveTo(x + d * 34 * s, base - 46 * s, x + d * 36 * s, base - 66 * s); c.lineTo(x + d * 30 * s, base - 68 * s); c.quadraticCurveTo(x + d * 26 * s, base - 52 * s, x + d * 14 * s, base - 50 * s); c.fill(); c.beginPath(); c.moveTo(x + d * 30 * s, base - 66 * s); c.quadraticCurveTo(x + d * 26 * s, base - 82 * s, x + d * 36 * s, base - 88 * s); c.quadraticCurveTo(x + d * 34 * s, base - 76 * s, x + d * 37 * s, base - 70 * s); c.quadraticCurveTo(x + d * 44 * s, base - 80 * s, x + d * 42 * s, base - 90 * s); c.quadraticCurveTo(x + d * 48 * s, base - 76 * s, x + d * 38 * s, base - 64 * s); c.closePath(); c.fill(); }
    /* Kopf: Fisch-/Hummerhaupt mit Fühlern */
    c.beginPath(); c.ellipse(x, base - 56 * s, 13 * s, 12 * s, 0, 0, TAU); c.fill();
    c.beginPath(); c.moveTo(x - 8 * s, base - 64 * s); c.lineTo(x - 3 * s, base - 80 * s); c.lineTo(x + 3 * s, base - 80 * s); c.lineTo(x + 8 * s, base - 64 * s); c.fill();
    c.strokeStyle = col; c.lineWidth = 1.2 * s; c.beginPath(); c.moveTo(x - 4 * s, base - 78 * s); c.quadraticCurveTo(x - 20 * s, base - 96 * s, x - 34 * s, base - 92 * s); c.moveTo(x + 4 * s, base - 78 * s); c.quadraticCurveTo(x + 20 * s, base - 96 * s, x + 34 * s, base - 92 * s); c.stroke();
    c.fillStyle = rgba(shade(col, -0.5), 0.5); for (let yy = base - 44 * s; yy < base; yy += 4 * s) for (let xx = x - 20 * s; xx < x + 20 * s; xx += 4 * s) { c.beginPath(); c.arc(xx + ((yy / (4 * s)) & 1) * 2 * s, yy, 1.5 * s, 0, PI); c.fill(); }
    c.fillStyle = rgba(o.pal.light, 0.25); c.fillRect(x - 22 * s, base - 40 * s, 1.2 * s, 36 * s);
    for (const d of [-1, 1]) { c.fillStyle = "#b0ffb0"; c.beginPath(); c.arc(x + d * 6 * s, base - 58 * s, 2.2 * s, 0, TAU); c.fill(); o.glows.push({ x: x + d * 6 * s, y: base - 58 * s, r: 12, col: "#90ff90", ph: d, kind: "pulse", a: 0.7 }); }
    c.fillStyle = "#2a4a2a"; for (let k = 0; k < 40; k++) { c.beginPath(); c.arc(x + (o.R() - 0.5) * 44 * s, base - o.R() * 14 * s, 0.6 + o.R() * 1.4, 0, TAU); c.fill(); }
  }
  function lanternSprite(o, s, L) {
    return mkSprite(o, 10 * s, L + 10 * s, 5 * s, 1, so => { const c = so.c; c.strokeStyle = "#2a2018"; c.lineWidth = 0.5; c.beginPath(); c.moveTo(0, 0); c.lineTo(0, L); c.stroke(); c.fillStyle = "#2a2018"; c.beginPath(); c.moveTo(-2.6 * s, L + 1.6 * s); c.lineTo(0, L - 0.4); c.lineTo(2.6 * s, L + 1.6 * s); c.fill(); c.fillStyle = WARM; c.fillRect(-2 * s, L + 1.6 * s, 4 * s, 4.6 * s); c.strokeStyle = "#2a2018"; c.lineWidth = 0.5; c.strokeRect(-2 * s, L + 1.6 * s, 4 * s, 4.6 * s); c.beginPath(); c.moveTo(0, L + 1.6 * s); c.lineTo(0, L + 6.2 * s); c.stroke(); c.fillStyle = "#2a2018"; c.fillRect(-2.4 * s, L + 6.2 * s, 4.8 * s, 0.8 * s); });
  }
  function pendulumSprite(o, L) {
    return mkSprite(o, 40, L + 40, 20, 2, so => { const c = so.c; c.fillStyle = "#6a5a40"; c.fillRect(-1, 0, 2, L); c.fillStyle = "rgba(255,230,180,.3)"; c.fillRect(-0.8, 0, 0.5, L); const g = c.createRadialGradient(-5, L - 5, 2, 0, L, 16); g.addColorStop(0, "#e8c070"); g.addColorStop(1, "#6a4a1a"); c.fillStyle = g; c.beginPath(); c.arc(0, L, 15, 0, TAU); c.fill(); c.strokeStyle = "#3a2a10"; c.lineWidth = 1; c.beginPath(); c.arc(0, L, 11, 0, TAU); c.stroke(); c.beginPath(); c.arc(0, L, 4, 0, TAU); c.stroke(); });
  }
  function dwarfStatue(o, x, base, s, col) {
    const c = o.c; const g = c.createLinearGradient(x - 12 * s, 0, x + 12 * s, 0); g.addColorStop(0, shade(col, 0.25)); g.addColorStop(0.5, col); g.addColorStop(1, shade(col, -0.4)); c.fillStyle = g;
    c.fillRect(x - 14 * s, base - 8 * s, 28 * s, 8 * s);
    c.beginPath(); c.moveTo(x - 10 * s, base - 8 * s); c.lineTo(x - 11 * s, base - 30 * s); c.quadraticCurveTo(x, base - 36 * s, x + 11 * s, base - 30 * s); c.lineTo(x + 10 * s, base - 8 * s); c.fill();
    c.beginPath(); c.arc(x, base - 38 * s, 5 * s, 0, TAU); c.fill(); c.beginPath(); c.moveTo(x - 6 * s, base - 37 * s); c.lineTo(x, base - 20 * s); c.lineTo(x + 6 * s, base - 37 * s); c.fill(); /* Bart */
    c.beginPath(); c.moveTo(x - 6 * s, base - 41 * s); c.quadraticCurveTo(x, base - 48 * s, x + 6 * s, base - 41 * s); c.fill(); /* Helm */
    c.fillRect(x + 10 * s, base - 46 * s, 1.6 * s, 26 * s); c.fillRect(x + 6 * s, base - 50 * s, 10 * s, 6 * s); /* Hammer */
    c.fillStyle = "rgba(255,170,80,.25)"; c.fillRect(x - 10 * s, base - 30 * s, 1 * s, 20 * s);
  }
  function fishStatue(o, x, base, s, col, d) {
    const c = o.c; c.fillStyle = shade(col, -0.1); c.fillRect(x - 6 * s, base - 6 * s, 12 * s, 6 * s);
    c.fillStyle = col; c.beginPath(); c.moveTo(x - 4 * s, base - 6 * s); c.lineTo(x - 4.5 * s, base - 22 * s); c.lineTo(x + 4.5 * s, base - 22 * s); c.lineTo(x + 4 * s, base - 6 * s); c.fill();
    c.beginPath(); c.ellipse(x + d * 1.5 * s, base - 27 * s, 6 * s, 5 * s, d * 0.3, 0, TAU); c.fill();
    c.fillStyle = "#c8ffb0"; c.beginPath(); c.arc(x + d * 4 * s, base - 28 * s, 1 * s, 0, TAU); c.fill();
    c.fillStyle = col; c.beginPath(); c.moveTo(x - d * 3 * s, base - 31 * s); c.lineTo(x - d * 1 * s, base - 37 * s); c.lineTo(x + d * 2 * s, base - 31 * s); c.fill(); /* Flosse */
    c.fillRect(x + d * 5 * s, base - 40 * s, 0.9 * s, 34 * s); c.beginPath(); c.moveTo(x + d * 5 * s - 2 * s, base - 40 * s); c.lineTo(x + d * 5.4 * s, base - 44 * s); c.lineTo(x + d * 5 * s + 2.6 * s, base - 40 * s); c.fill(); /* Dreizack */
    o.glows.push({ x: x + d * 4 * s, y: base - 28 * s, r: 5, col: "#a0ffa0", ph: o.R() * 9, kind: "pulse", a: 0.6 });
  }
  function dwarfHouse(o, x, base, w, h, far) {
    const { c, R } = o; const col = o.hz(mix(o.pal.stone, "#4a3a34", R() * 0.5), far);
    body(o, x, base - h, w, h, col); if (far < 0.25) masonry(o, x, base - h, w, h, col, 2.6);
    c.fillStyle = shade(col, -0.2); c.fillRect(x - 1, base - h - 2, w + 2, 2.4); c.fillStyle = rgba("#ff9a40", 0.18); c.fillRect(x - 1, base - h - 2, w + 2, 0.5);
    for (let yy = base - h + 4; yy < base - 6; yy += 8) for (let xx = x + 2.5; xx < x + w - 3; xx += 5) if (R() < 0.6) win(o, xx, yy, 2.2, 3, { k: "rect", lit: R() < 0.5, col: R() < 0.2 ? "#b0ff70" : "#ffa040", far: far > 0.25, sill: false });
    if (R() < 0.3) { c.fillStyle = "#2a1e18"; c.fillRect(x - 2, base - h * 0.5, w + 4, 1.2); for (let xx = x - 2; xx < x + w + 2; xx += 2) c.fillRect(xx, base - h * 0.5 - 3, 0.4, 3); }
    if (R() < 0.6) { const cx = x + w * (0.2 + R() * 0.6); c.fillStyle = shade(col, -0.3); c.fillRect(cx, base - h - 10, 3, 9); if (R() < 0.45) o.smoke.push({ x: cx + 1.5, y: base - h - 11, ph: R() * 9, s: 0.8, dark: true }); if (R() < 0.4) o.glows.push({ x: cx + 1.5, y: base - h - 10, r: 5, col: "#ff6a1a", ph: R() * 9, kind: "forge", a: 0.4 }); }
    c.fillStyle = "#1a0e0a"; c.fillRect(x + w / 2 - 1.5, base - 6, 3, 6);
  }
  PAGES.camp = PAGES.castle;
  PAGES.passage = PAGES.halls;
  PAGES.labbg = PAGES.dungeon;
  /* Hort: Glutstadt mit glitzernden Goldhaufen davor */
  PAGES.hoardbg = function (o, H) {
    PAGES.embercity(o, H); const { c, R } = o;
    for (let i = 0; i < 12; i++) { const x = R() * PW, w = 30 + R() * 60, b = 322; const g = c.createLinearGradient(0, b - w * 0.4, 0, b); g.addColorStop(0, "#ffe080"); g.addColorStop(1, "#8a5a10"); c.fillStyle = g; c.beginPath(); c.moveTo(x - w / 2, b); c.quadraticCurveTo(x, b - w * 0.6, x + w / 2, b); c.fill(); for (let k = 0; k < w; k++) { c.fillStyle = R() < 0.5 ? "#fff0a0" : "#c89020"; c.beginPath(); c.arc(x + (R() - 0.5) * w * 0.8, b - R() * w * 0.22, 0.6 + R() * 0.8, 0, TAU); c.fill(); } addGlints(o, x - w * 0.35, x + w * 0.35, b - w * 0.22, b, w / 3, "#fff8c0", 0.8); }
  };

  /* ======================= FARBPALETTE JE GEBIET ======================= */
  function palette(B, kind) {
    const sky = B.sky.map(nb), tile = B.tile || { base: "#5a5058", light: "#7a6a62", dark: "#231c20" };
    const out = { castle: 1, camp: 1, ramparts: 1, spires: 1, storm: 1, harbour: 1 }[kind];
    const tint = (l, k) => l.map(cc => nb(mix(cc, sky[1], k)));
    const pal = {
      sky0: sky[0], sky1: sky[1], sky2: sky[2],
      fog: nb(out ? mix(sky[2], sky[1], 0.35) : mix(sky[2], tile.base, 0.25)),
      light: nb(mix(sky[2], "#ffe8d0", 0.6)),
      stone: nb(mix(mix(tile.base, tile.light, 0.5), sky[1], 0.12)),
      rock: nb(mix(mix(tile.dark, tile.base, 0.65), sky[1], 0.15)),
      grass: nb(mix("#3a4a26", sky[1], 0.35)),
      field: tint(["#5a6a30", "#7a7a3a", "#8a6a34", "#4a5a2a", "#6a5a2a", "#7a6a40"], 0.3),
      leaf: tint(["#1c2a14", "#34481e", "#5a6e2c"], 0.2),
      ivy: ["#1e2e18", "#2e4220", "#4a5e2a"],
      moss: "#4a5a2a",
      roofs: tint(["#7a3a2a", "#5a3a2e", "#6a4a2a", "#4e3a3e", "#7a5030", "#5a2a2a"], 0.22),
      plaster: tint(["#c8b490", "#b8a07a", "#d0c0a0", "#a8987a"], 0.4),
      banner: ["#a82a2a", "#c8a040", "#7a2a6a", "#2a5a3a"],
      lit: 0.32,
      water: nb(mix(sky[1], sky[2], 0.55))
    };
    if (kind === "storm") { pal.grass = mix("#2a3420", sky[1], 0.3); pal.lit = 0.18; }
    if (kind === "spires") { pal.stone = nb(mix(pal.stone, "#4a3238", 0.45)); pal.fog = nb(mix(sky[1], sky[2], 0.5)); pal.light = nb(mix(sky[2], "#ffe0b0", 0.45)); }
    if (kind === "lake") pal.water = mix("#183a2a", sky[2], 0.35);
    if (kind === "harbour") pal.water = nb(mix(sky[1], "#2a2030", 0.4));
    if (!out) pal.lit = 0.4;
    /* Tageszeit (tageszeit.js): Kantenlicht, Fensteranteil, Dunst */
    const zt = Z.zeit && Z.zeit(); pal.zt = zt;
    if (zt) {
      if (out) {
        pal.light = nb(mix(pal.light, zt.light, 0.75));
        pal.lit = kind === "storm" ? zt.lit * 0.6 : zt.lit;
        pal.rimK = zt.k === "nacht" ? 0.7 + 1.1 * zt.moonBright : zt.k === "blut" ? 1.6 : 1.35;
        if (zt.k === "morgen") pal.fog = nb(mix(pal.fog, "#f0c4bc", 0.3));
        else if (zt.k === "abend") pal.fog = nb(mix(pal.fog, "#7a3a52", 0.42));
        else if (zt.k === "blut") pal.fog = nb(mix(pal.fog, "#4a1018", 0.3));
      } else pal.light = nb(mix(pal.light, zt.win, 0.25));
    }
    return pal;
  }
  function kindOf(B, lv) {
    const ak = lv.arena && Z.ARENAS && Z.ARENAS[lv.arena] ? Z.ARENAS[lv.arena].kind : null;
    return ak === "hoard" ? "hoardbg" : ak === "lab" ? "labbg" : ak === "lakeboss" ? "lake" : ak === "towertop" ? "storm" : ak === "pier" ? "harbour" : ak === "tower" ? "ramparts" : B.bg;
  }
  const curQ = () => Z.gq && Number.isFinite(Z.gq.level) && Z.gq.level >= 0 ? Z.gq.level : 2;

  /* weiche Nebelbahn (wird live verschoben) */
  function mistStrip(o, m) {
    const ms = Math.min(1, o.s * 0.5), cv = document.createElement("canvas"); cv.width = Math.ceil(PW * ms); cv.height = Math.ceil(m.h * ms);
    const c = cv.getContext("2d"); c.scale(ms, ms); const R = o.R, col = m.col || o.pal.fog;
    for (let i = 0; i < PW / 24; i++) { const x = R() * PW, y = m.h * (0.3 + R() * 0.4), r = m.h * (0.3 + R() * 0.5), w = r * (2 + R() * 3); for (const dx of [0, -PW, PW]) { if (x + dx + w < 0 || x + dx - w > PW) continue; c.globalAlpha = 0.25 + R() * 0.35; c.drawImage(glowSpr(col, true), x + dx - w, y - r, w * 2, r * 2); } }
    m.cv = cv; m.ms = ms;
  }
  /* Wasserfall-Textur: senkrechte Schlieren, nahtlos in der Höhe */
  function fallTex(o, f) {
    const s = o.s, P2 = 64, cv = document.createElement("canvas"); cv.width = Math.ceil(f.w * s); cv.height = Math.ceil(P2 * s);
    const c = cv.getContext("2d"); c.scale(s, s); const R = o.R;
    c.fillStyle = f.lava ? "rgba(255,140,40,.3)" : "rgba(190,225,200,.22)"; c.fillRect(0, 0, f.w, P2);
    for (let i = 0; i < f.w * 3; i++) { const x = R() * f.w, y = R() * P2, h = 8 + R() * 26, a = 0.15 + R() * 0.45, ww = 0.5 + R() * 0.7; const col = f.lava ? (R() < 0.5 ? "255,230,140," : "120,30,6,") : "235,250,235,"; for (const dy of [0, -P2]) { c.fillStyle = "rgba(" + col + a + ")"; c.fillRect(x, y + dy, ww, h); } }
    f.tex = cv; f.P = P2;
  }

  /* ======================= SEITE BAUEN ======================= */
  let page = null;
  function build() {
    const B = Z.biome, lv = Z.level; page = null; if (!B || !lv) return;
    const kind = kindOf(B, lv), fn = PAGES[kind]; if (!fn) return;
    const q = curQ(); if (q === 0) { page = { none: true, lvRef: lv, q, H: Math.ceil(Z.cam.h + 120) }; return; }
    const t0 = performance.now();
    const H = Math.ceil(Z.cam.h + 120), s = Math.min(Math.max(1, G.scale || 1), q >= 3 ? 1.9 : q >= 2 ? 1.6 : 1.2);
    const cv = document.createElement("canvas"); cv.width = Math.ceil(PW * s); cv.height = Math.ceil(H * s);
    /* exakt auf die Leinwand skalieren: sonst bleibt am rechten Rand eine halb durchsichtige Spalte (feine Naht alle 1536 px) */
    const sx = cv.width / PW, sy = cv.height / H;
    const c = cv.getContext("2d"); c.scale(sx, sy);
    const R = Rng(((B.name[0].length * 7919) ^ ((lv.seed || 7) * 31)) >>> 0);
    const pal = palette(B, kind);
    const o = P(c, R, pal, H, s);
    try { fn(o, H); } catch (err) { console.error("bilderbuch", kind, err); }
    const tF = performance.now();
    o.zt = pal.zt;
    try { zeitPage(o, c, H); } catch (err) { console.error("bilderbuch zeit", err); }
    /* Luftperspektive: zum Himmel hin leicht verblassen, unten satter */
    const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, rgba(pal.sky1, 0.16)); g.addColorStop(0.6, rgba(pal.fog, 0.06)); g.addColorStop(1, rgba("#000", 0.12));
    c.globalCompositeOperation = "source-atop"; c.fillStyle = g; c.fillRect(0, 0, PW, H); c.globalCompositeOperation = "source-over";
    for (const m of o.mists) mistStrip(o, m);
    for (const f of o.falls) { fallTex(o, f); if (!f.lava) { c.fillStyle = "rgba(200,230,210,.16)"; c.fillRect(f.x, f.y, f.w, f.h); } }
    o.smokeCol = nb(mix(pal.fog, "#8a8080", 0.35)); o.smokeDark = "#2a2220";
    const opaque = !!(o.topFill && o.botFill) && isOpaque(cv);
    /* Mittel (Stufe 1): ruhige Lichter und Strahlen einmal einbacken statt jedes Bild additiv zu malen
       (nur bei deckenden Innenseiten – dort sieht „lighter“ eingebacken genauso aus) */
    if (q <= 1 && opaque) bakeStatic(o, c);
    /* Umriss des Landes (für Wolkenschatten), dann Tiefenunschärfe (Stufe 2/3) */
    if (!opaque && o.zt && o.zt.out) try { o.landPath = landPath(cv, H); } catch (err) { o.landPath = null; }
    let out = cv; const tD = performance.now();
    if (q >= 2 && Z.zeitBlur) try { out = dofPage(cv, opaque); } catch (err) { console.error("bilderbuch dof", err); out = cv; }
    const tE = performance.now();
    page = { cv: out, s, sx, sy, H, o, kind, lvRef: lv, q, opaque, ms: +(tE - t0).toFixed(1), prof: { paint: +(tF - t0).toFixed(1), rest: +(tD - tF).toFixed(1), dof: +(tE - tD).toFixed(1) } };
  }
  /* ======================= TAGESZEIT AUF DER SEITE ======================= */
  const GRADE = {
    abend: [[0, "#ffb070", 0.08], [0.4, "#c05a50", 0.06], [0.7, "#5a2040", 0.16], [1, "#2a0c20", 0.34]],
    nacht: [[0, "#c8b8d8", 0.05], [0.35, "#1a1028", 0.22], [1, "#08040c", 0.42]],
    morgen: [[0, "#ffe4dc", 0.22], [0.5, "#f8bcb4", 0.1], [0.76, "#6a3050", 0.08], [1, "#2a1028", 0.24]],
    blut: [[0, "#ff4a30", 0.12], [0.4, "#3a0608", 0.26], [1, "#120204", 0.46]]
  };
  function zeitPage(o, c, H) {
    const zt = o.zt; if (!zt) return;
    if (!zt.out) {
      /* innen nur dezent: das Licht durch die Fenster nimmt die Farbe der Stunde an */
      const k = { abend: 1.3, nacht: 0.85, morgen: 1.05, blut: 1.15 }[zt.k] || 1;
      for (const s of o.shafts) { s.col = nb(mix(s.col, zt.win, 0.6)); s.a *= k; }
      for (const l of o.lights) if (l.soft) l.col = nb(mix(l.col, zt.win, 0.45));
      return;
    }
    const st = GRADE[zt.k]; if (!st) return;
    const g = c.createLinearGradient(0, 0, 0, H); for (const [u, col, a] of st) g.addColorStop(u, rgba(col, a * (zt.storm ? 0.7 : 1)));
    c.save(); c.globalCompositeOperation = "source-atop"; c.fillStyle = g; c.fillRect(0, 0, PW, H); c.restore();
    /* erleuchtete Fenster wieder voll leuchten lassen (die Tönung hat sie mitgedunkelt) */
    for (const l of o.lights) if (l.wx != null && l.ww > 1.2) { c.fillStyle = l.col; winPath(c, l.wx + l.ww * 0.2, l.wy + l.ww * 0.2, l.ww * 0.6, l.wh - l.ww * 0.32, l.k); c.fill(); }
    /* Morgengrauen: rosiger Nebel in den Tälern, Blutmond: roter Dunst */
    if (zt.mist > 0.25) {
      const col = zt.k === "morgen" ? "#ffe0d8" : zt.k === "blut" ? "#8a2020" : "#e0b0a0";
      for (const m of o.mists.slice()) { mist(o, m.y - 6, m.h * 1.4, col, 0.22 * zt.mist); o.mists.push({ y: m.y - 10, h: m.h * 1.3, a: Math.min(0.65, m.a * zt.mist * 1.2), sp: m.sp * 1.5 + 1, col }); }
    }
    /* Mondnacht: kühles Glänzen auf dem Wasser verstärkt, Abend: Gold */
    if (zt.k === "abend" || zt.k === "morgen") for (const g2 of o.glints) if (!g2.dot) g2.col = zt.k === "abend" ? "#ffc070" : "#ffd0c0";
    if (zt.k === "blut") for (const g2 of o.glints) if (!g2.dot) g2.col = "#ff7050";
  }
  /* Landumriss (oberste deckende Zeile je Spalte) als Pfad */
  function landPath(cv, H) {
    const w = 192, h = Math.ceil(H / 4), t = document.createElement("canvas"); t.width = w; t.height = h;
    const g = t.getContext("2d", { willReadFrequently: true }); g.drawImage(cv, 0, 0, w, h); const d = g.getImageData(0, 0, w, h).data;
    const p = new Path2D(); p.moveTo(-2, H + 2);
    for (let x = 0; x < w; x++) { let y = 0; while (y < h && d[(y * w + x) * 4 + 3] < 200) y++; p.lineTo((x + 0.5) * PW / w, Math.min(H, y * H / h + 2)); }
    p.lineTo(PW + 2, H + 2); p.closePath(); return p;
  }
  /* Tiefenunschärfe: hintere Staffeln weicher als vordere, einmal beim Bau */
  function dofPage(cv, opaque) {
    const s = cv.width / PW, back = Z.zeitBlur(cv, 1.05 * s, true), front = Z.zeitBlur(cv, 0.38 * s, true);
    const t = document.createElement("canvas"); t.width = cv.width; t.height = cv.height; const g = t.getContext("2d");
    g.drawImage(back, 0, 0); g.globalCompositeOperation = "destination-in";
    const gr = g.createLinearGradient(0, 0, 0, cv.height); gr.addColorStop(0, "#000"); gr.addColorStop(0.56, "#000"); gr.addColorStop(0.84, "rgba(0,0,0,0)"); g.fillStyle = gr; g.fillRect(0, 0, t.width, t.height);
    const f = front.getContext("2d"); f.drawImage(t, 0, 0);
    /* Ränder oben/unten: scharfes Original darunter, damit nichts durchscheint */
    const e = Math.ceil(5 * s); f.save(); f.globalCompositeOperation = "destination-over"; f.beginPath(); f.rect(0, 0, cv.width, e); f.rect(0, cv.height - e, cv.width, e); f.clip(); f.drawImage(cv, 0, 0); f.restore();
    if (opaque) { f.save(); f.globalCompositeOperation = "destination-over"; f.drawImage(cv, 0, 0); f.restore(); }
    return front;
  }
  /* deckt die Seite vollständig? (verkleinert prüfen – billig) */
  function isOpaque(cv) {
    try {
      const w = 96, h = 32, t = document.createElement("canvas"); t.width = w; t.height = h; const g = t.getContext("2d");
      g.drawImage(cv, 0, 0, w, h); const d = g.getImageData(0, 0, w, h).data;
      for (let i = 3; i < d.length; i += 4) if (d[i] < 250) return false;
      return true;
    } catch (e) { return false; }
  }
  function bakeStatic(o, c) {
    c.save(); c.globalCompositeOperation = "lighter";
    for (const s of o.shafts) {
      const a = s.a * 0.875, dx = Math.cos(s.ang), dy = Math.sin(s.ang); c.fillStyle = rgba(s.col, a);
      for (const L of [0.45, 0.75, 1]) { const l = s.len * L, sp = 1 + L * 0.5; c.beginPath(); c.moveTo(s.x, s.y); c.lineTo(s.x + s.w, s.y); c.lineTo(s.x + s.w * sp + dx * l, s.y + dy * l); c.lineTo(s.x - s.w * (sp - 1) + dx * l, s.y + dy * l); c.closePath(); c.fill(); }
    }
    o.shafts = [];
    const keep = [];
    for (const l of o.lights) { if (l.tog) { keep.push(l); continue; } glow(c, l.x, l.y, l.r, l.col, l.a * (l.f === 0 ? 1 : l.f === 2 ? 0.72 : 0.86), l.soft); }
    o.lights = keep;
    const gk = [];
    for (const g of o.glows) {
      const avg = g.kind === "steady" ? 1 : g.kind === "pulse" ? 0.65 : g.kind === "forge" ? 0.75 : g.kind == null || g.kind === "flicker" ? 0.75 : -1;
      if (avg < 0) { gk.push(g); continue; }
      glow(c, g.x, g.y, g.r * 1.6, g.col, (g.a || 0.4) * avg);
    }
    o.glows = gk;
    c.restore();
  }
  /* deckt die Bilderbuchseite gerade das ganze Bild? Dann braucht es weder Himmel noch ferne Ebene darunter */
  Z.bilderbuchCovers = () => !!(page && !page.none && page.opaque && page.lvRef === Z.level && page.q === curQ() && Math.abs(page.H - Math.ceil(Z.cam.h + 120)) <= 2);
  Z.bilderbuchPage = () => page;
  Z.bilderbuchBuild = () => { build(); return page && page.ms; };
  /* Prüfhilfe: ganze Seite samt Leben in ein Bild malen */
  Z.bilderbuchDump = function (t, sc) {
    if (!page || page.none) return null; sc = sc || 1.3; const cv = document.createElement("canvas"); cv.width = Math.ceil(PW * sc); cv.height = Math.ceil(page.H * sc);
    const c = cv.getContext("2d"); c.scale(sc, sc); c.fillStyle = page.o.pal.sky2; c.fillRect(0, 0, PW, page.H); c.drawImage(page.cv, 0, 0, PW, page.H);
    drawLive(c, 0, 0, t, { x: 0, y: 0, w: PW, h: page.H }, page.q); return cv.toDataURL("image/jpeg", 0.9);
  };

  /* ======================= LEBENDIGES ======================= */
  const DARK = "#160e12";
  function flame(c, x, y, s, t, ph, green) {
    const h = 3.2 * s * (0.8 + 0.25 * Math.sin(t * 13 + ph) * Math.sin(t * 7.7 + ph * 2)), sw = Math.sin(t * 6 + ph) * 0.5 * s + (Z.windX || 0) * 0.004 * s;
    c.fillStyle = green ? "#40c030" : "#ff6a1a"; c.beginPath(); c.moveTo(x - 1.1 * s, y); c.quadraticCurveTo(x - 1.2 * s, y - h * 0.5, x + sw, y - h); c.quadraticCurveTo(x + 1.2 * s, y - h * 0.5, x + 1.1 * s, y); c.fill();
    c.fillStyle = green ? "#c8ff90" : "#ffd870"; c.beginPath(); c.moveTo(x - 0.5 * s, y); c.quadraticCurveTo(x - 0.5 * s, y - h * 0.35, x + sw * 0.6, y - h * 0.62); c.quadraticCurveTo(x + 0.5 * s, y - h * 0.35, x + 0.5 * s, y); c.fill();
  }
  function figure(c, w, x, y, dir, t, rich) {
    const s = w.s || 1, step = Math.sin(t * (w.kind === "rat" ? 30 : 7) + w.ph) * (w.kind === "rat" ? 0.6 : 1);
    if (w.kind === "rat") { c.fillStyle = "#2a2024"; c.beginPath(); c.ellipse(x, y - 1 * s, 2 * s, 1 * s, 0, 0, TAU); c.fill(); c.beginPath(); c.arc(x + dir * 1.9 * s, y - 1.2 * s, 0.7 * s, 0, TAU); c.fill(); c.strokeStyle = "#3a2a2a"; c.lineWidth = 0.3; c.beginPath(); c.moveTo(x - dir * 2 * s, y - 0.8 * s); c.quadraticCurveTo(x - dir * 3.5 * s, y - 2 * s + step, x - dir * 5 * s, y - 0.6 * s); c.stroke(); return; }
    if (w.kind === "cart") { c.fillStyle = "#2a2422"; c.fillRect(x - 4 * s, y - 4 * s, 8 * s, 3 * s); c.beginPath(); c.arc(x - 2.5 * s, y - 0.8 * s, 0.9 * s, 0, TAU); c.arc(x + 2.5 * s, y - 0.8 * s, 0.9 * s, 0, TAU); c.fill(); c.fillStyle = "#ff9a3a"; c.fillRect(x - 3.4 * s, y - 4.6 * s, 6.8 * s, 0.8 * s); c.fillStyle = "#3a3030"; const px = x - dir * 6 * s; c.fillRect(px - 0.9 * s, y - 4.6 * s, 1.8 * s, 2.6 * s); c.beginPath(); c.arc(px, y - 5.4 * s, 0.9 * s, 0, TAU); c.fill(); c.fillRect(px - 0.6 * s + step * 0.3, y - 2 * s, 0.5 * s, 2 * s); c.fillRect(px + 0.2 * s - step * 0.3, y - 2 * s, 0.5 * s, 2 * s); return; }
    c.fillStyle = DARK; c.strokeStyle = DARK; c.lineWidth = 0.55 * s;
    c.beginPath(); c.moveTo(x - 0.4 * s, y - 2.4 * s); c.lineTo(x - 0.4 * s + step * 0.8 * s, y); c.moveTo(x + 0.4 * s, y - 2.4 * s); c.lineTo(x + 0.4 * s - step * 0.8 * s, y); c.stroke();
    if (w.kind === "monk" || w.kind === "lamp") { c.beginPath(); c.moveTo(x - 1.3 * s, y - 1 * s); c.lineTo(x - 0.8 * s, y - 5.4 * s); c.lineTo(x + 0.8 * s, y - 5.4 * s); c.lineTo(x + 1.3 * s, y - 1 * s); c.fill(); c.beginPath(); c.arc(x, y - 6 * s, 0.8 * s, 0, TAU); c.fill(); if (w.kind === "monk") { c.beginPath(); c.moveTo(x - 0.9 * s, y - 5.6 * s); c.quadraticCurveTo(x - dir * 0.2 * s, y - 7.8 * s, x + 0.9 * s, y - 5.6 * s); c.fill(); } }
    else { c.fillRect(x - 0.9 * s, y - 5.4 * s, 1.8 * s, 3.2 * s); c.beginPath(); c.arc(x, y - 6.2 * s, 0.8 * s, 0, TAU); c.fill(); c.beginPath(); c.moveTo(x - 1 * s, y - 6.4 * s); c.lineTo(x, y - 7.8 * s); c.lineTo(x + 1 * s, y - 6.4 * s); c.fill(); c.beginPath(); c.moveTo(x + dir * 1.1 * s, y - 9.5 * s); c.lineTo(x + dir * 1.1 * s, y - 0.4 * s); c.stroke(); c.beginPath(); c.moveTo(x + dir * 0.6 * s, y - 9.5 * s); c.lineTo(x + dir * 1.1 * s, y - 11 * s); c.lineTo(x + dir * 1.6 * s, y - 9.5 * s); c.fill(); c.beginPath(); c.moveTo(x - dir * 0.8 * s, y - 5.2 * s); c.lineTo(x - dir * 2.2 * s, y - 2.2 * s + Math.sin(t * 2 + w.ph) * 0.3); c.lineTo(x - dir * 0.6 * s, y - 2.4 * s); c.fill(); }
  }
  function drawLive(c, ox, oy, t, cam, q) {
    const o = page.o, rich = q >= 2;
    const X0 = cam.x - ox, X1 = X0 + cam.w, Y0 = cam.y - oy, Y1 = Y0 + cam.h;
    const vis = (x, y, r) => x > X0 - r && x < X1 + r && y > Y0 - r && y < Y1 + r;
    const wind = Z.windX ? Math.sign(Z.windX) : 1;
    c.save(); c.translate(ox, oy);
    /* ---- Licht (additiv) ---- */
    c.globalCompositeOperation = "lighter";
    for (const s of o.shafts) {
      if (!vis(s.x + Math.cos(s.ang) * s.len * 0.5, s.y + Math.sin(s.ang) * s.len * 0.5, s.len)) continue;
      const a = s.a * (0.75 + 0.25 * Math.sin(t * 0.4 + s.ph)), dx = Math.cos(s.ang), dy = Math.sin(s.ang);
      c.fillStyle = rgba(s.col, a);
      for (const L of [0.45, 0.75, 1]) { const l = s.len * L, sp = 1 + L * 0.5; c.beginPath(); c.moveTo(s.x, s.y); c.lineTo(s.x + s.w, s.y); c.lineTo(s.x + s.w * sp + dx * l, s.y + dy * l); c.lineTo(s.x - s.w * (sp - 1) + dx * l, s.y + dy * l); c.closePath(); c.fill(); }
    }
    for (const b of o.beams) {
      const a = t * 0.55, ca = Math.cos(a), sa = Math.sin(a);
      for (const dir of [1, -1]) {
        const ex = b.x + ca * b.len * dir, ey = b.y + sa * b.len * 0.1 * dir, hw = 6 + 18 * Math.abs(sa), front = 0.5 + 0.5 * Math.max(0, sa * dir);
        if (!vis((b.x + ex) / 2, b.y, b.len)) continue;
        for (const [k, al] of [[1, 0.05], [0.5, 0.07]]) { c.fillStyle = rgba("#ffe8b0", al * (0.6 + front)); c.beginPath(); c.moveTo(b.x, b.y - 1.5); c.lineTo(ex, ey - hw * k); c.lineTo(ex, ey + hw * k); c.lineTo(b.x, b.y + 1.5); c.closePath(); c.fill(); }
      }
    }
    for (const l of o.lights) {
      if (!vis(l.x, l.y, l.r)) continue;
      if (l.tog && Math.sin(t * 0.07 + l.ph) < -0.55) continue;
      const f = l.f === 0 ? 1 : l.f === 2 ? 0.72 + 0.28 * Math.sin(t * 9 + l.ph) * Math.sin(t * 13.7 + l.ph * 1.3) : 0.86 + 0.14 * Math.sin(t * 1.7 + l.ph) * Math.sin(t * 2.9 + l.ph);
      glow(c, l.x, l.y, l.r, l.col, l.a * f, l.soft);
    }
    for (const g of o.glows) {
      if (!vis(g.x, g.y, g.r * 1.6)) continue;
      let f = 0.75 + 0.25 * Math.sin(t * 2.4 + g.ph);
      if (g.kind === "pulse") f = 0.65 + 0.35 * Math.sin(t * 1.4 + g.ph);
      else if (g.kind === "forge") f = 0.75 + 0.25 * Math.sin(t * 5 + g.ph) * Math.sin(t * 3.1 + g.ph * 2);
      else if (g.kind === "zap") f = (Math.sin(t * 1.3 + g.ph) > 0.97 ? 2.2 : 0.3 + 0.15 * Math.sin(t * 23));
      else if (g.kind === "rune" || g.kind === "runering") f = 0.35 + 0.65 * Math.pow(0.5 + 0.5 * Math.sin(t * 0.9 + g.ph), 2);
      else if (g.kind === "steady") f = 1;
      glow(c, g.x, g.y, g.r * 1.6, g.col, (g.a || 0.4) * f);
      if (g.kind === "runering") { c.globalAlpha = 1; c.strokeStyle = rgba(g.col, 0.5 * f); c.lineWidth = 0.8; c.beginPath(); c.arc(g.x, g.y, g.r * 0.75, 0, TAU); c.stroke(); c.beginPath(); for (let k = 0; k < 8; k++) { const a = k / 8 * TAU + t * 0.25; c.moveTo(g.x + Math.cos(a) * g.r * 0.5, g.y + Math.sin(a) * g.r * 0.5); c.lineTo(g.x + Math.cos(a + 0.2) * g.r * 0.72, g.y + Math.sin(a + 0.2) * g.r * 0.72); } c.stroke(); }
    }
    for (const w of o.wanders) {
      const k = Math.floor((t + w.ph) / w.per), u = frac((t + w.ph) / w.per), p = w.pts[((k % w.pts.length) + w.pts.length) % w.pts.length];
      if (!vis(p[0], p[1], 20)) continue; const a = Math.sqrt(Math.sin(u * PI));
      glow(c, p[0] + p[2] / 2, p[1] + p[3] / 2, 4 + p[2] * 3, w.col, 0.7 * a); c.globalAlpha = a; c.fillStyle = "#ffd890"; c.fillRect(p[0] + p[2] * 0.2, p[1] + p[3] * 0.25, p[2] * 0.6, p[3] * 0.65);
    }
    c.globalAlpha = 1; c.globalCompositeOperation = "source-over";
    /* ausgeschaltete Fenster */
    c.fillStyle = "#170e12";
    for (const l of o.lights) if (l.tog && Math.sin(t * 0.07 + l.ph) < -0.55 && vis(l.x, l.y, 4)) { winPath(c, l.wx + 0.15, l.wy + 0.15, l.ww - 0.3, l.wh - 0.3, l.k); c.fill(); }
    /* ---- Wasser und Glut ---- */
    for (const f of o.falls) {
      if (!vis(f.x, f.y + f.h / 2, f.h / 2 + 10)) continue;
      c.save(); c.beginPath(); c.rect(f.x, Math.max(f.y, Y0 - 2), f.w, Math.min(f.y + f.h, Y1 + 2) - Math.max(f.y, Y0 - 2)); c.clip();
      const off = (t * 70) % f.P; for (let y = f.y - f.P + off; y < f.y + f.h; y += f.P) { if (y + f.P < Y0 || y > Y1) continue; c.drawImage(f.tex, f.x, y, f.w, f.P); }
      c.restore();
      if (rich) for (let k = 0; k < 6; k++) { const u = frac(t * 0.6 + k / 6), px = f.x + f.w / 2 + (hsh(k) - 0.5) * f.w * 2 * u; glow(c, px, f.y + f.h - u * 8, 4 + u * 10, f.lava ? "#ffb050" : "#e0f0e0", 0.35 * (1 - u), true); }
      c.globalAlpha = 1;
    }
    c.globalCompositeOperation = "lighter";
    for (let li = 0; li < o.lava.length; li++) {
      const L = o.lava[li]; const span = L.vert ? L.h : L.x1 - L.x0;
      for (let i = 0; i < L.n; i++) {
        const u = frac(hsh(i + li * 997) + t * L.v / span), h2 = hsh(i * 7 + li);
        const px = L.vert ? L.x0 + h2 * (L.x1 - L.x0) : L.x0 + u * span, py = L.vert ? L.y + u * span : L.y + h2 * L.h;
        if (!vis(px, py, 8)) continue;
        const a = 0.25 + 0.45 * Math.pow(Math.sin(t * 2 + i), 2);
        c.fillStyle = rgba(h2 < 0.5 ? "#ffe090" : "#ffb050", a); if (L.vert) c.fillRect(px - 0.4, py, 0.8, 4 + h2 * 6); else c.fillRect(px, py, 3 + h2 * 7, 0.7);
      }
      if (!L.vert) for (let x = L.x0 + 40; x < L.x1; x += 90) if (vis(x, L.y, 50)) glow(c, x + Math.sin(t * 0.3 + x) * 20, L.y + L.h * 0.3, 40, "#ff6a1a", 0.18 + 0.08 * Math.sin(t * 1.7 + x), true);
    }
    c.globalAlpha = 1; c.globalCompositeOperation = "source-over";
    /* ---- bewegte Sprites ---- */
    for (const g of o.spin) {
      const r = Math.max(g.sp.w, g.sp.h) * 0.6; if (!vis(g.x, g.y, r)) continue;
      const a = g.osc ? Math.sin(t * g.w) * g.osc : (g.a0 || 0) + t * g.w;
      c.save(); c.translate(g.x, g.y); c.rotate(a); c.drawImage(g.sp.cv, -g.sp.px, -g.sp.py, g.sp.w, g.sp.h); c.restore();
    }
    for (const g of o.gears) if (g.clock && vis(g.x, g.y, g.r)) {
      const a = -t * 0.02; c.strokeStyle = "#2a1a10"; c.lineCap = "round";
      c.lineWidth = 2.4; c.beginPath(); c.moveTo(g.x, g.y); c.lineTo(g.x + Math.cos(a * 12 - 1.57) * g.r * 0.95, g.y + Math.sin(a * 12 - 1.57) * g.r * 0.95); c.stroke();
      c.lineWidth = 3.4; c.beginPath(); c.moveTo(g.x, g.y); c.lineTo(g.x + Math.cos(a - 1.57) * g.r * 0.6, g.y + Math.sin(a - 1.57) * g.r * 0.6); c.stroke(); c.lineCap = "butt";
      c.fillStyle = "#3a2a1a"; c.beginPath(); c.arc(g.x, g.y, 4, 0, TAU); c.fill();
    }
    for (const w of o.swings) {
      if (!vis(w.x, w.y + w.sp.h * 0.5, w.sp.h)) continue;
      const a = w.amp * Math.sin(t * w.fr * PI + w.ph);
      c.save(); c.translate(w.x, w.y); c.rotate(a); c.drawImage(w.sp.cv, -w.sp.px, -w.sp.py, w.sp.w, w.sp.h); c.restore();
      if (w.light) { const ca = Math.cos(a), sa = Math.sin(a), lx = w.x + w.light[0] * ca - w.light[1] * sa, ly = w.y + w.light[0] * sa + w.light[1] * ca; c.globalCompositeOperation = "lighter"; glow(c, lx, ly, w.lr || 20, WARM, 0.5 + 0.1 * Math.sin(t * 9 + w.ph)); c.globalAlpha = 1; c.globalCompositeOperation = "source-over"; }
    }
    for (const w of o.chands) {
      if (!vis(w.x, w.y + w.sp.h * 0.5, w.sp.h)) continue;
      const a = w.amp * Math.sin(t * w.fr * PI + w.ph);
      c.save(); c.translate(w.x, w.y); c.rotate(a); c.drawImage(w.sp.cv, -w.sp.px, -w.sp.py, w.sp.w, w.sp.h);
      for (let i = 0; i < w.sp.flames.length; i++) { const [fx, fy] = w.sp.flames[i]; flame(c, fx, fy + 0.4, 0.45, t, i * 1.7 + w.ph); }
      c.globalCompositeOperation = "lighter"; const cy0 = w.sp.flames[0][1]; glow(c, 0, cy0, 46, "#ffc060", 0.32 + 0.05 * Math.sin(t * 7 + w.ph)); c.globalAlpha = 1; c.globalCompositeOperation = "source-over";
      c.restore();
    }
    for (const b of o.bobs) {
      let x = b.x0; if (b.v) { const L = b.x1 - b.x0; x = b.x0 + (((t * b.v + b.ph) % L) + L) % L; }
      if (!vis(x, b.y - b.sp.h * 0.4, Math.max(b.sp.w, b.sp.h))) continue;
      const y = b.y + Math.sin(t * b.fr + b.ph) * b.amp, r = Math.sin(t * b.fr * 0.8 + b.ph) * b.rot;
      const e = b.v ? Math.max(0, Math.min(1, Math.min(x - b.x0, b.x1 - x) / 40)) : 1;
      c.globalAlpha = e; c.save(); c.translate(x, y); c.rotate(r); if (b.v < 0) c.scale(-1, 1); c.drawImage(b.sp.cv, -b.sp.px, -b.sp.py, b.sp.w, b.sp.h); c.restore();
      if (b.lantern && b.sp.lantern) { const [lx0, ly0] = b.sp.lantern, lx = x + (b.v < 0 ? -lx0 : lx0), ly = y + ly0; c.globalCompositeOperation = "lighter"; glow(c, lx, ly, 12, b.lcol || WARM, 0.6 * e); c.globalAlpha = 0.25 * e; c.drawImage(glowSpr(b.lcol || WARM), lx - 2.5, b.y + 1, 5, 22); c.globalAlpha = 1; c.globalCompositeOperation = "source-over"; }
      c.globalAlpha = 1;
    }
    for (const m of o.movers) {
      if (m.kind === "crucible") {
        const L = m.x1 - m.x0, p = ((t * m.fr * L + m.ph * 50) % (2 * L)), x = m.x0 + (p < L ? p : 2 * L - p); if (!vis(x, m.y, 60)) continue;
        c.fillStyle = "#2a2422"; c.fillRect(x - 6, m.top - 4, 12, 5); chainLive(c, x - 3, m.top, m.y - 10); chainLive(c, x + 3, m.top, m.y - 10);
        c.fillStyle = "#3a3230"; c.beginPath(); c.moveTo(x - 9, m.y - 10); c.lineTo(x + 9, m.y - 10); c.lineTo(x + 6, m.y + 4); c.lineTo(x - 6, m.y + 4); c.fill(); c.fillStyle = "#ffb040"; c.fillRect(x - 8, m.y - 10, 16, 1.6);
        c.globalCompositeOperation = "lighter"; glow(c, x, m.y - 10, 22, "#ff8a2a", 0.4 + 0.1 * Math.sin(t * 4)); c.globalAlpha = 1; c.globalCompositeOperation = "source-over"; continue;
      }
      const y = m.y0 + (m.y1 - m.y0) * (0.5 + 0.5 * Math.sin(t * m.fr * TAU + m.ph)); if (!vis(m.x, (m.top + y) / 2, Math.abs(y - m.top) / 2 + 20)) continue;
      if (m.kind === "bellows") { const sq = 0.5 + 0.5 * Math.sin(t * m.fr * TAU + m.ph); c.fillStyle = "#4a2e1a"; c.beginPath(); c.moveTo(m.x, m.y0); c.lineTo(m.x + 18, m.y0 - 2 - sq * 5); c.lineTo(m.x + 18, m.y0 + 4); c.closePath(); c.fill(); c.strokeStyle = "#2a1a10"; c.lineWidth = 0.4; c.beginPath(); for (let k = 4; k < 18; k += 3) { c.moveTo(m.x + k, m.y0 - k * (2 + sq * 5) / 18); c.lineTo(m.x + k, m.y0 + 4 * k / 18); } c.stroke(); c.fillStyle = "#2a2422"; c.fillRect(m.x - 6, m.y0 - 0.5, 6, 1.4); continue; }
      c.strokeStyle = m.kind === "weight" ? "#3a3430" : "#2a1e14"; c.lineWidth = 0.5; c.beginPath(); c.moveTo(m.x, m.top); c.lineTo(m.x, y); c.stroke();
      if (m.kind === "weight") { const g = c.createLinearGradient(m.x - 5, 0, m.x + 5, 0); g.addColorStop(0, "#6a625a"); g.addColorStop(1, "#2a2624"); c.fillStyle = g; c.fillRect(m.x - 4, y, 8, 18); c.fillStyle = "#1a1614"; c.fillRect(m.x - 4, y + 4, 8, 0.8); c.fillRect(m.x - 4, y + 13, 8, 0.8); }
      else if (m.kind === "crate") { c.fillStyle = "#6a4a2a"; c.fillRect(m.x - 2.5, y, 5, 4.5); c.strokeStyle = "rgba(0,0,0,.5)"; c.lineWidth = 0.3; c.strokeRect(m.x - 2.5, y, 5, 4.5); }
      else { const s = m.s || 1; c.strokeStyle = "#5a5450"; c.lineWidth = 0.6 * s; c.beginPath(); c.arc(m.x, y + 1.5 * s, 1.4 * s, -1, PI * 0.9); c.stroke(); if (Math.sin(t * m.fr * TAU + m.ph) > 0) { c.fillStyle = "#5a3a20"; c.fillRect(m.x - 3 * s, y + 3 * s, 6 * s, 4 * s); } }
    }
    /* ---- Banner und Wimpel ---- */
    for (const f of o.flags) {
      if (!vis(f.x, f.y, f.len + 10)) continue;
      if (f.pole) { c.fillStyle = "#3a2a1a"; c.fillRect(f.x - 0.35, f.y, 0.7, f.pole); }
      const n = 6, w = f.w || 3; c.fillStyle = f.col; c.beginPath(); c.moveTo(f.x, f.y);
      for (let k = 1; k <= n; k++) { const u = k / n; c.lineTo(f.x + wind * u * f.len, f.y + Math.sin(t * 4 + f.ph - u * 3) * 1.5 * u + u * w * 0.25); }
      for (let k = n; k >= 0; k--) { const u = k / n; c.lineTo(f.x + wind * u * f.len, f.y + w * (1 - u * 0.5) + Math.sin(t * 4 + f.ph - u * 3) * 1.5 * u); }
      c.fill();
    }
    for (const d of o.drapes) {
      if (!vis(d.x + d.w / 2, d.y + d.h / 2, d.h)) continue;
      const sw = Math.sin(t * 1.1 + d.ph) * d.h * 0.05 + (Z.windX || 0) * 0.002 * d.h, sw2 = Math.sin(t * 1.7 + d.ph * 2) * d.h * 0.025;
      c.fillStyle = "#2a1a10"; c.fillRect(d.x - 1, d.y - 1, d.w + 2, 1.2);
      c.fillStyle = d.col; c.beginPath(); c.moveTo(d.x, d.y); c.lineTo(d.x + d.w, d.y); c.quadraticCurveTo(d.x + d.w + sw * 0.5, d.y + d.h * 0.5, d.x + d.w + sw + sw2, d.y + d.h); c.lineTo(d.x + d.w / 2 + sw, d.y + d.h * 0.82); c.lineTo(d.x + sw - sw2, d.y + d.h); c.quadraticCurveTo(d.x + sw * 0.5, d.y + d.h * 0.5, d.x, d.y); c.fill();
      c.fillStyle = "rgba(0,0,0,.22)"; c.beginPath(); c.moveTo(d.x + d.w * 0.6, d.y); c.lineTo(d.x + d.w, d.y); c.quadraticCurveTo(d.x + d.w + sw * 0.5, d.y + d.h * 0.5, d.x + d.w + sw + sw2, d.y + d.h); c.lineTo(d.x + d.w * 0.6 + sw, d.y + d.h * 0.88); c.fill();
      if (d.trim) { c.strokeStyle = d.trim; c.lineWidth = 0.5; c.beginPath(); c.moveTo(d.x + 0.8, d.y + 1); c.quadraticCurveTo(d.x + 0.8 + sw * 0.5, d.y + d.h * 0.5, d.x + sw - sw2 + 0.8, d.y + d.h - 1.5); c.moveTo(d.x + d.w - 0.8, d.y + 1); c.quadraticCurveTo(d.x + d.w - 0.8 + sw * 0.5, d.y + d.h * 0.5, d.x + d.w + sw + sw2 - 0.8, d.y + d.h - 1.5); c.stroke();
        const ex = d.x + d.w / 2 + sw * 0.35, ey = d.y + d.h * 0.36, r = d.w * 0.28; c.fillStyle = d.trim; c.beginPath(); c.moveTo(ex, ey - r); c.lineTo(ex + r, ey); c.lineTo(ex, ey + r); c.lineTo(ex - r, ey); c.fill(); }
    }
    /* ---- Figuren: Wachen, Laternenträger, Ratten, Karren ---- */
    for (const w of o.walkers) {
      const L = Math.abs(w.x1 - w.x0) || 1, p = ((t * w.v + w.ph) % (2 * L) + 2 * L) % (2 * L), u = p < L ? p / L : 2 - p / L, dir = (p < L ? 1 : -1) * Math.sign(w.x1 - w.x0 || 1);
      const x = w.x0 + (w.x1 - w.x0) * u, y = w.y0 + (w.y1 - w.y0) * u; if (!vis(x, y - 5, 20)) continue;
      figure(c, w, x, y, dir, t, rich);
      const s = w.s || 1;
      if (w.torch && w.kind === "guard") { const tx = x - dir * 1.4 * s, ty = y - 6.2 * s; c.fillStyle = "#2a1a10"; c.fillRect(tx - 0.25 * s, ty, 0.5 * s, 2.4 * s); flame(c, tx, ty, 0.55 * s, t, w.ph); c.globalCompositeOperation = "lighter"; glow(c, tx, ty - 1, 12 * s, "#ff9a3a", 0.45); c.globalAlpha = 1; c.globalCompositeOperation = "source-over"; }
      else if (w.kind === "lamp" || w.kind === "monk") { const tx = x + dir * 1.6 * s, ty = y - 3.4 * s; c.fillStyle = WARM; c.fillRect(tx - 0.6 * s, ty - 0.6 * s, 1.2 * s, 1.4 * s); c.globalCompositeOperation = "lighter"; glow(c, tx, ty, 11 * s, WARM, 0.5 + 0.08 * Math.sin(t * 9 + w.ph)); c.globalAlpha = 1; c.globalCompositeOperation = "source-over"; }
      else if (w.kind === "cart") { c.globalCompositeOperation = "lighter"; glow(c, x, y - 5 * s, 9 * s, "#ff8a2a", 0.5); c.globalAlpha = 1; c.globalCompositeOperation = "source-over"; }
    }
    /* ---- Rauch ---- */
    const np = rich ? 6 : 3;
    for (const s of o.smoke) {
      if (!vis(s.x + 10, s.y - 25 * s.s, 45 * s.s)) continue;
      const spr = glowSpr(s.dark ? o.smokeDark : o.smokeCol, true);
      for (let k = 0; k < np; k++) { const u = frac(t * 0.2 * (0.7 + s.s * 0.3) + s.ph + k / np), px = s.x + Math.sin(u * 4 + s.ph) * 2 * u + u * 16 * wind * s.s, py = s.y - u * 46 * s.s, r = (1.5 + u * 8) * s.s; c.globalAlpha = (1 - u) * Math.min(1, u * 6) * 0.55; c.drawImage(spr, px - r, py - r, r * 2, r * 2); }
    }
    c.globalAlpha = 1;
    /* ---- Flammen ---- */
    for (const f of o.flames) {
      if (!vis(f.x, f.y, 14)) continue; const gr = f.col === "green";
      flame(c, f.x, f.y, f.s, t, f.ph, gr); c.globalCompositeOperation = "lighter"; glow(c, f.x, f.y - 1.5 * f.s, 10 * f.s, gr ? "#70ff50" : "#ff9a3a", 0.5 + 0.12 * Math.sin(t * 11 + f.ph)); c.globalAlpha = 1; c.globalCompositeOperation = "source-over";
    }
    /* ---- Nebelbahnen ---- */
    if (rich) for (const m of o.mists) {
      if (m.y + m.h < Y0 || m.y > Y1) continue;
      const off = ((t * m.sp) % PW + PW) % PW, a0 = Math.max(0, X0), a1 = Math.min(PW, X1); if (a1 <= a0) continue;
      c.globalAlpha = m.a; let x = a0;
      while (x < a1 - 0.01) { const sx = ((x - off) % PW + PW) % PW, seg = Math.min(a1 - x, PW - sx); c.drawImage(m.cv, sx * m.ms, 0, Math.max(1, seg * m.ms), m.cv.height, x, m.y, seg, m.h); x += seg; }
      c.globalAlpha = 1;
    }
    /* ---- Funken, Staub, Sporen, Glühwürmchen, Glanzlichter ---- */
    c.globalCompositeOperation = "lighter";
    for (let si = 0; si < o.sparks.length; si++) {
      const S = o.sparks[si]; if (!vis(S.x + S.w / 2, S.y - S.h / 2, Math.max(S.w, S.h))) continue;
      if (S.burst && frac(t * 0.45 + hsh(si)) > 0.3) continue;
      const n = rich ? S.n : S.n >> 1; c.fillStyle = S.col;
      for (let i = 0; i < n; i++) { const hi = hsh(i + si * 131); let px, py, u;
        if (S.burst) { u = frac(t * 0.45 + hsh(si)) / 0.3; px = S.x + S.w / 2 + (hi - 0.5) * 30 * u; py = S.y - Math.sin(u * PI) * 14 * (0.5 + hsh(i * 3)) + u * 4; }
        else { u = frac(t * S.sp * (0.6 + 0.8 * hsh(i * 3)) + hi); px = S.x + hsh(i * 5 + si) * S.w + Math.sin(t * 2 + i) * 3 * u; py = S.y - u * S.h; }
        if (!vis(px, py, 2)) continue; c.globalAlpha = Math.sin(Math.min(1, u) * PI) * 0.9; c.fillRect(px, py, S.size, S.size); }
    }
    for (let mi = 0; mi < o.motes.length; mi++) {
      const M = o.motes[mi]; if (!rich && M.kind !== "firefly") continue;
      for (let i = 0; i < M.n; i++) {
        const a = hsh(i + mi * 77), b = hsh(i * 7 + mi), cc = hsh(i * 13 + mi * 3); let px, py, al, r = 0;
        if (M.kind === "dust") { px = M.x + frac(a + t * 0.004 * (0.4 + cc)) * M.w; py = M.y + frac(b + t * 0.003 * (0.3 + a)) * M.h + Math.sin(t * 0.5 + i) * 3; al = 0.25 + 0.2 * Math.sin(t * 1.3 + i); }
        else if (M.kind === "firefly") { px = M.x + a * M.w + Math.sin(t * 0.5 + i) * 12; py = M.y + b * M.h + Math.sin(t * 0.7 + i * 2) * 8; al = Math.pow(Math.max(0, Math.sin(t * 1.4 + i * 3)), 3); r = 5; }
        else if (M.kind === "spore") { px = M.x + a * M.w + Math.sin(t * 0.4 + i) * 10; py = M.y + M.h - frac(b + t * 0.012 * (0.5 + cc)) * M.h; al = 0.5 + 0.3 * Math.sin(t * 2 + i); r = 4; }
        else if (M.kind === "ember") { const u = frac(b + t * 0.05 * (0.5 + cc)); px = M.x + a * M.w + Math.sin(t * 1.3 + i) * 6 * u; py = M.y + M.h - u * M.h; al = Math.sin(u * PI) * (0.6 + 0.4 * Math.sin(t * 9 + i)); }
        else { /* Feder */ const u = frac(b + t * 0.015 * (0.5 + cc)); px = M.x + a * M.w + Math.sin(t * 1.4 + i) * 7; py = M.y + u * M.h; al = Math.sin(u * PI) * 0.6; }
        if (!vis(px, py, 6) || al <= 0.02) continue;
        if (r) glow(c, px, py, r, M.col, al * 0.6);
        c.globalAlpha = al; c.fillStyle = M.col;
        if (M.kind === "feather") { c.save(); c.translate(px, py); c.rotate(Math.sin(t * 1.4 + i) * 0.8); c.fillRect(-1.2, -0.2, 2.4, 0.5); c.restore(); } else c.fillRect(px - 0.35, py - 0.35, 0.7, 0.7);
      }
    }
    for (const g of o.glints) {
      if (!vis(g.x, g.y, g.w)) continue; const s = Math.sin(t * g.sp + g.ph); if (s <= 0.2) continue;
      c.globalAlpha = (s - 0.2) * 1.25 * g.a; c.fillStyle = g.col; if (g.dot) c.fillRect(g.x - 0.35, g.y - 0.35, 0.7, 0.7); else c.fillRect(g.x, g.y, g.w * (0.5 + 0.5 * s), 0.45);
    }
    c.globalAlpha = 1; c.globalCompositeOperation = "source-over";
    if (rich) {
      /* Tropfen, Wellenringe */
      for (const d of o.drips) {
        if (!vis(d.x, d.y + d.h / 2, d.h)) continue; const u = frac(t * d.sp + d.ph);
        if (u < 0.75) { const v = u / 0.75; c.fillStyle = rgba(d.col, 0.6); c.fillRect(d.x - 0.3, d.y + v * v * d.h, 0.6, 1.3); }
        else { const v = (u - 0.75) / 0.25; c.strokeStyle = rgba(d.col, 0.4 * (1 - v)); c.lineWidth = 0.4; c.beginPath(); c.ellipse(d.x, d.y + d.h, 1 + v * 4, 0.4 + v, 0, 0, TAU); c.stroke(); }
      }
      for (const r of o.ripples) { if (!vis(r.x, r.y, 20)) continue; const u = frac(t * 0.22 + r.ph); c.strokeStyle = rgba("#c8f0d0", 0.28 * (1 - u)); c.lineWidth = 0.4; c.beginPath(); c.ellipse(r.x, r.y, 2 + u * 16, 0.5 + u * 3.5, 0, 0, TAU); c.stroke(); }
      /* Spinnen am Faden */
      for (const s of o.spiders) {
        const y = s.y0 + (0.5 - 0.5 * Math.cos(t * 0.35 + s.ph)) * s.len; if (!vis(s.x, y, 10)) continue; const k = s.s;
        c.strokeStyle = "rgba(230,220,240,.35)"; c.lineWidth = 0.3; c.beginPath(); c.moveTo(s.x, s.y0); c.lineTo(s.x, y); c.stroke();
        c.strokeStyle = "#140e14"; c.lineWidth = 0.4 * k; c.beginPath(); for (let i = 0; i < 4; i++) { const w = Math.sin(t * 8 + i + s.ph) * 0.5; for (const d of [-1, 1]) { c.moveTo(s.x, y + i * 0.6 * k); c.lineTo(s.x + d * 2.4 * k, y - 1 * k + i * 1.1 * k + w); c.lineTo(s.x + d * 3.4 * k, y + 0.8 * k + i * 1.3 * k + w); } } c.stroke();
        c.fillStyle = "#1a121a"; c.beginPath(); c.ellipse(s.x, y + 2.6 * k, 1.8 * k, 2.2 * k, 0, 0, TAU); c.fill(); c.beginPath(); c.arc(s.x, y, 1.1 * k, 0, TAU); c.fill();
        c.fillStyle = "#ff3040"; c.fillRect(s.x - 0.6 * k, y - 0.3 * k, 0.4 * k, 0.4 * k); c.fillRect(s.x + 0.2 * k, y - 0.3 * k, 0.4 * k, 0.4 * k);
      }
    }
    /* Augen im Dunkeln */
    for (const e of o.eyes) {
      if (!vis(e.x, e.y, 6)) continue; if (Math.sin(t * 0.3 + e.ph) < 0.1 || frac(t * 0.37 + e.ph) < 0.035) continue;
      c.fillStyle = e.col; if (e.many) { for (const [dx, dy] of [[-1.2, 0], [1.2, 0], [-0.6, -1], [0.6, -1]]) c.fillRect(e.x + dx - 0.3, e.y + dy - 0.3, 0.6, 0.6); } else { c.fillRect(e.x - 1.3, e.y - 0.4, 0.8, 0.7); c.fillRect(e.x + 0.5, e.y - 0.4, 0.8, 0.7); }
      c.globalCompositeOperation = "lighter"; glow(c, e.x, e.y, 5, e.col, 0.35); c.globalAlpha = 1; c.globalCompositeOperation = "source-over";
    }
    /* ---- Schwärme ---- */
    if (rich) for (let fi = 0; fi < o.flocks.length; fi++) {
      const F = o.flocks[fi]; let bx = F.x, by = F.y;
      if (F.cross) { const span = F.span || 1800; bx = ((t * F.v + fi * 400) % span + span) % span - (span - PW) / 2; by = F.y + Math.sin(t * 0.3 + fi) * 10; }
      if (!vis(bx, by, (F.rx || 60) + 30)) continue;
      const k = F.kind, sz = F.size;
      if (k === "demon") { c.fillStyle = F.col; }
      else { c.strokeStyle = F.col; c.lineWidth = Math.max(0.5, sz * 0.4); c.beginPath(); }
      for (let i = 0; i < F.n; i++) {
        let px, py, d;
        if (F.cross) { const row = (i + 1) >> 1, side = i & 1 ? 1 : -1; px = bx - row * 5 * sz; py = by + side * row * 2.6 * sz + Math.sin(t * 1.3 + i) * 1.2; d = 1; }
        else { const a = t * F.sp + i * TAU / F.n + Math.sin(i * 1.7) * 0.5; px = bx + Math.cos(a) * F.rx * (0.7 + 0.3 * hsh(i + fi)); py = by + Math.sin(a) * F.ry * (0.7 + 0.3 * hsh(i * 3 + fi)) + Math.sin(t * 1.8 + i) * 2; d = -Math.sin(a) * Math.sign(F.sp) >= 0 ? 1 : -1; }
        const fl = Math.sin(t * (k === "demon" ? 4 : k === "gull" ? 5 : k === "bat" ? 18 : 10) + i * 2.1);
        if (k === "bat") { c.moveTo(px - sz, py - fl * sz * 0.8); c.lineTo(px - sz * 0.5, py + 0.2); c.lineTo(px - sz * 0.25, py - 0.3); c.lineTo(px, py + 0.3); c.lineTo(px + sz * 0.25, py - 0.3); c.lineTo(px + sz * 0.5, py + 0.2); c.lineTo(px + sz, py - fl * sz * 0.8); continue; }
        if (k === "demon") { c.beginPath(); c.moveTo(px - d * 1.6 * sz, py); c.lineTo(px - d * 0.4 * sz, py - 0.6 * sz); c.lineTo(px + d * 1.4 * sz, py - 0.3 * sz); c.lineTo(px + d * 1.6 * sz, py + 0.2 * sz); c.lineTo(px - d * 0.2 * sz, py + 0.6 * sz); c.closePath(); c.moveTo(px - 0.3 * sz, py - 0.3 * sz); c.lineTo(px - 2.6 * sz, py - 1.6 * sz - fl * 1.6 * sz); c.lineTo(px - 1.6 * sz, py - 0.2 * sz); c.lineTo(px - 0.8 * sz, py + 0.4 * sz); c.moveTo(px + 0.3 * sz, py - 0.3 * sz); c.lineTo(px + 2.6 * sz, py - 1.6 * sz - fl * 1.6 * sz); c.lineTo(px + 1.6 * sz, py - 0.2 * sz); c.lineTo(px + 0.8 * sz, py + 0.4 * sz); c.moveTo(px - d * 1.6 * sz, py); c.lineTo(px - d * 3.2 * sz, py + 0.8 * sz + Math.sin(t * 3 + i) * 0.5 * sz); c.lineTo(px - d * 1.5 * sz, py + 0.3 * sz); c.fill(); continue; }
        c.moveTo(px - sz, py - fl * sz * 0.7); c.quadraticCurveTo(px - sz * 0.4, py - fl * sz * 0.2 - 0.3, px, py); c.quadraticCurveTo(px + sz * 0.4, py - fl * sz * 0.2 - 0.3, px + sz, py - fl * sz * 0.7);
      }
      if (k !== "demon") c.stroke();
    }
    /* ---- Blitze ---- */
    for (let bi = 0; bi < o.bolts.length; bi++) {
      const b = o.bolts[bi], k = Math.floor((t + b.ph) / b.per), loc = t + b.ph - k * b.per; if (loc > 0.45) continue;
      const I = loc < 0.06 ? 1 : loc < 0.12 ? 0.15 : loc < 0.2 ? 0.85 : Math.max(0, 0.6 * (1 - (loc - 0.2) / 0.25));
      if (!vis(b.x, b.y1 / 2, Math.max(200, b.y1))) continue;
      const r = Rng(k * 131 + bi * 7 + 1); let x = b.x + (r() - 0.5) * 160, y = Math.min(Y0, 0) - 10; const pts = [[x, y]], n = 14;
      for (let i = 1; i <= n; i++) { const u = i / n; x = x + (b.x - x) * (1 / (n - i + 1)) + (r() - 0.5) * 14 * (1 - u); y = (Math.min(Y0, 0) - 10) + (b.y1 - (Math.min(Y0, 0) - 10)) * u; pts.push([x, y]); }
      c.globalCompositeOperation = "lighter"; c.globalAlpha = 1;
      c.fillStyle = rgba("#c8ffb0", 0.08 * I); c.fillRect(X0, Y0, cam.w, cam.h);
      for (const [lw, col, al] of [[4, "#b8ff90", 0.22], [1.6, "#e0ffc8", 0.6], [0.6, "#ffffff", 0.95]]) {
        c.strokeStyle = rgba(col, al * I); c.lineWidth = lw; c.beginPath(); c.moveTo(pts[0][0], pts[0][1]); for (const p of pts) c.lineTo(p[0], p[1]);
        const bi2 = 5 + ((r() * 5) | 0); c.moveTo(pts[bi2][0], pts[bi2][1]); let bx2 = pts[bi2][0], by2 = pts[bi2][1]; for (let j = 0; j < 5; j++) { bx2 += (r() - 0.3) * 14; by2 += 8 + r() * 6; c.lineTo(bx2, by2); } c.stroke();
      }
      glow(c, b.x, b.y1, 60, "#c8ff90", 0.7 * I); c.globalAlpha = 1; c.globalCompositeOperation = "source-over";
    }
    /* ---- Tageszeit: Laternenzüge, Himmelslaternen, Wolkenschatten, Mondpfad ---- */
    if (o.zt && o.zt.out) zeitLive(c, o, t, cam, ox, vis, X0, X1, rich);
    c.restore();
  }
  function zeitLive(c, o, t, cam, ox, vis, X0, X1, rich) {
    const zt = o.zt, k = zt.k, night = k !== "morgen";
    /* Laternen- und Fackelzüge (Blutmond: verhüllte Gestalten mit roten Fackeln) */
    if (night) for (const T of o.trains) {
      if (T.far && !rich) continue;
      const span = T.len + T.n * T.gap, D = ((t * T.v + T.ph) % span + span) % span;
      for (let i = 0; i < T.n; i++) {
        const d = D - i * T.gap; if (d < 0 || d > T.len) continue;
        let j = 1; while (j < T.cum.length - 1 && T.cum[j] < d) j++;
        const a0 = T.pts[j - 1], a1 = T.pts[j], u = (d - T.cum[j - 1]) / Math.max(0.001, T.cum[j] - T.cum[j - 1]);
        const x = a0[0] + (a1[0] - a0[0]) * u, y = a0[1] + (a1[1] - a0[1]) * u; if (!vis(x, y - 4, 16)) continue;
        const dir = a1[0] >= a0[0] ? 1 : -1, s = T.s, e = Math.min(1, d / 12, (T.len - d) / 12);
        const w = { kind: k === "blut" ? "monk" : i % 3 === 1 ? "guard" : "lamp", s, ph: i * 1.7 + T.ph };
        c.globalAlpha = e; figure(c, w, x, y, dir, t, rich);
        const tx = x + dir * 1.6 * s, ty = y - (k === "blut" ? 7 : 3.4) * s, lc = k === "blut" ? "#ff4a2a" : WARM;
        if (k === "blut") flame(c, tx, ty, 0.5 * s, t, i * 2.3, false); else { c.fillStyle = lc; c.fillRect(tx - 0.6 * s, ty - 0.6 * s, 1.2 * s, 1.4 * s); }
        c.globalCompositeOperation = "lighter"; glow(c, tx, ty, (T.far ? 7 : 10) * Math.max(0.6, s), lc, (0.55 + 0.1 * Math.sin(t * 9 + i)) * e); c.globalAlpha = 1; c.globalCompositeOperation = "source-over";
      }
    }
    c.globalAlpha = 1;
    /* Himmelslaternen steigen langsam aus dem Dorf auf */
    if (rich && (k === "abend" || k === "nacht") && !zt.storm) {
      const wind = (Z.windX || 6) * 0.02;
      for (let li = 0; li < o.lanterns.length; li++) {
        const L = o.lanterns[li];
        for (let j = 0; j < L.n; j++) {
          const hj = hsh(li * 31 + j), P = 46 + hj * 30, u = frac(t / P + hj * 7.3);
          const x = L.x + (hsh(j * 3 + li) - 0.5) * L.spread + u * (40 + 60 * wind) + Math.sin(t * 0.4 + j * 2) * 3, y = L.y - u * L.rise - hsh(j * 5) * 10;
          if (!vis(x, y, 10)) continue;
          const a = Math.min(1, u * 8) * (1 - smooth(0.7, 1, u)), s = 1.1 - u * 0.5, fl = 0.85 + 0.15 * Math.sin(t * 7 + j * 3);
          c.globalCompositeOperation = "lighter"; glow(c, x, y, 7 * s, "#ffb050", 0.55 * a * fl); c.globalCompositeOperation = "source-over";
          c.globalAlpha = a; c.fillStyle = "#ffd890"; c.beginPath(); c.moveTo(x - 1.1 * s, y - 1.6 * s); c.lineTo(x + 1.1 * s, y - 1.6 * s); c.lineTo(x + 0.8 * s, y + 1.2 * s); c.lineTo(x - 0.8 * s, y + 1.2 * s); c.closePath(); c.fill();
          c.fillStyle = "#c86a2a"; c.fillRect(x - 1.1 * s, y - 1.8 * s, 2.2 * s, 0.4 * s); c.fillStyle = "#fff4c0"; c.fillRect(x - 0.35 * s, y + 0.4 * s, 0.7 * s, 0.6 * s);
        }
      }
      c.globalAlpha = 1;
    }
    /* Wolkenschatten und Lichtflecken wandern über das Land */
    if (rich && o.landPath && !zt.storm) {
      const lightOk = k !== "nacht" || zt.moonBright > 0.45;
      c.save(); c.clip(o.landPath);
      for (let i = 0; i < 5; i++) {
        const rx = 140 + hsh(i * 7) * 160, ry = 26 + hsh(i * 11) * 26, vx = 5 + hsh(i * 13) * 5, span = PW + rx * 2;
        const x = ((hsh(i) * span + t * vx) % span) - rx, y = 210 + hsh(i * 17) * 130;
        for (const dx of [0, -PW, PW]) {
          const xx = x + dx; if (xx + rx < X0 || xx - rx > X1) continue;
          if (i % 2 === 0 || !lightOk) { c.globalAlpha = k === "nacht" ? 0.18 + 0.12 * zt.moonBright : 0.2; c.drawImage(glowSpr("#0a0610", true), xx - rx, y - ry, rx * 2, ry * 2); }
          else { c.globalCompositeOperation = "lighter"; c.globalAlpha = k === "nacht" ? 0.07 : 0.11; c.drawImage(glowSpr(zt.light, true), xx - rx, y - ry, rx * 2, ry * 2); c.globalCompositeOperation = "source-over"; }
        }
      }
      c.restore(); c.globalAlpha = 1;
    }
    /* Mondpfad: flirrendes Licht auf dem Wasser genau unter dem Mond */
    if (rich && o.water.length && (k === "nacht" || k === "blut") && Z.zeitMoons) {
      const col = k === "blut" ? "#ff6a40" : "#f4e8e4", br = k === "blut" ? 0.9 : zt.moonBright;
      if (br > 0.15) {
        c.globalCompositeOperation = "lighter"; c.fillStyle = col;
        for (const m of Z.zeitMoons(cam)) {
          const mx = m.x - ox; if (mx < X0 - 60 || mx > X1 + 60) continue;
          for (const W of o.water) for (let y = W.y0, r = 0; y < W.y1; y += 1.6, r++) {
            const sp = 2 + (y - W.y0) * 0.45, n = 2 + (r & 1);
            for (let q = 0; q < n; q++) { const h = hsh(r * 7 + q * 131), f = Math.sin(t * (1.5 + h * 2) + h * 40); if (f < 0.1) continue; c.globalAlpha = f * 0.55 * br * (1 - (y - W.y0) / (W.y1 - W.y0) * 0.5); c.fillRect(mx + (h - 0.5) * sp * 2 + Math.sin(t * 0.8 + r) * 1.5, y, 2 + h * 4, 0.6); }
          }
        }
        c.globalAlpha = 1; c.globalCompositeOperation = "source-over";
      }
    }
  }
  const smooth = (a, b, v) => { const u = Math.max(0, Math.min(1, (v - a) / (b - a))); return u * u * (3 - 2 * u); };
  function chainLive(c, x, y0, y1) { c.strokeStyle = "#3a3430"; c.lineWidth = 0.6; c.setLineDash([1.2, 0.8]); c.beginPath(); c.moveTo(x, y0); c.lineTo(x, y1); c.stroke(); c.setLineDash([]); }

  /* ======================= EINHÄNGEN: zwischen ferner Ebene und Mittelgrund ======================= */
  const life0 = Z.drawBackLife;
  Z.drawBackLife = function (c, cam, t, B, oy, LH) {
    /* was darunter läge (Wolken, ferne Tiere …), wäre unter einer deckenden Seite ohnehin unsichtbar */
    if (life0 && !Z.bilderbuchCovers()) life0.apply(this, arguments);
    if (!Z.level) return;
    const tA = performance.now();
    try { drawPage(c, cam, t); } finally { Z.bilderbuchMs = performance.now() - tA; }
  };
  function drawPage(c, cam, t) {
    const q = curQ();
    if (!page || page.lvRef !== Z.level || page.q !== q || Math.abs(page.H - Math.ceil(Z.cam.h + 120)) > 2) build();
    if (!page || page.none) return;
    const lvH = Z.level.H * Z.TILE;
    const ox = cam.x * (1 - PF), py = cam.y - (cam.y - (lvH - cam.h) * 0.5) * PY - 30;
    const o = page.o;
    /* Innenräume: Ränder ober- und unterhalb der Seite füllen */
    if (o.topFill && py > cam.y) { c.fillStyle = o.topFill; c.fillRect(cam.x - 2, cam.y - 2, cam.w + 4, py - cam.y + 3); }
    if (o.botFill && py + page.H < cam.y + cam.h) { c.fillStyle = o.botFill; c.fillRect(cam.x - 2, py + page.H - 1, cam.w + 4, cam.y + cam.h - py - page.H + 3); }
    const y0 = Math.max(py, cam.y - 2), y1 = Math.min(py + page.H, cam.y + cam.h + 2); if (y1 <= y0) return;
    let x = Math.floor((cam.x - ox) / PW) * PW + ox;
    for (; x < cam.x + cam.w; x += PW) {
      const vx0 = Math.max(x, cam.x - 2), vx1 = Math.min(x + PW, cam.x + cam.w + 2); if (vx1 <= vx0) continue;
      const kx = page.sx, ky = page.sy; c.drawImage(page.cv, (vx0 - x) * kx, (y0 - py) * ky, (vx1 - vx0) * kx, (y1 - y0) * ky, vx0, y0, vx1 - vx0, y1 - y0);
    }
    /* Leben auch für Elemente, die über die Seitennaht ragen */
    for (x = Math.floor((cam.x - ox) / PW) * PW + ox - PW; x < cam.x + cam.w; x += PW) {
      if (x + PW + 200 < cam.x || x - 200 > cam.x + cam.w) continue;
      try { drawLive(c, x, py, t, cam, q); } catch (err) { console.error("bilderbuch live", err); page.o = P(page.o.c, page.o.R, page.o.pal, page.H, page.s); }
    }
  }
  Z.bilderbuchKinds = Object.keys(PAGES);
  /* Farbhelfer für andere Module */
  Z.bbKit = { PW, mix, shade, rgba, nb, glowSpr, hsh };
})();
