/* Ezekiel – The Destroyer · Ausstattung und Bilderbuch-Vordergrund
   Räume, die bewohnt wirken – wie Seiten eines detaillierten Bilderbuchs:
   gedeckte Tafeln mit Kerzen und Fliegen über dem Braten, Wachstuben mit Würfelspiel, Bibliothekswinkel,
   Vorratskammern, Schmiedeecken, Folterkammern, Fischerecken, Uhrmacherwerkstätten, Kuo-Toa-Altäre …
   Dazu kleine Bewohner: huschende Ratten, Spinnen am Faden, schlafende Katzen, Hühner, Krähen, Möwen, Fledermäuse,
   tropfendes Wasser. Statische Teile werden einmal in Sprites gemalt (Schattierung, Maserung, Glanz, Gebrauchsspuren),
   nur Flammen, Pendel, Ketten und Tiere werden jedes Bild neu gezeichnet.
   Flammen und Glut werden nach dem Licht gemalt (gecachte Glow-Sprites) und schneiden sparsam Löcher ins Dunkel.
   Vordergrund: gemalte Silhouetten mit Randlicht und weicher Tiefenunschärfe (Parallaxe 1.5), zur Bildmitte durchscheinend.
   Zerbrechlich: Treffer, Geschosse, Explosionen und Gegnerschläge lassen die Stücke wackeln, reißen, auslaufen und zerbrechen
   (Teile aus dem Sprite geschnitten, mit Physik, bleiben abgedunkelt liegen); Wandschmuck fällt, Hängendes reißt ab,
   Kerzen verlöschen, Tiere fliehen. Schnittstellen: Z.ausstattungFlammen, Z.ausstattungKetten, Z.ausstattungImpuls, Z.ausstattungTreffer. */
(function () {
  "use strict";
  const Z = window.Z, T = Z.TILE, CW = Z.CW, CH = Z.CH;
  const TAU = Math.PI * 2, PI = Math.PI;
  const hash = (a, b) => { const s = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return s - Math.floor(s); };
  const strSeed = s => { let h = 2166136261; for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619); return h >>> 0; };
  const simple = () => Z.gq && Z.gq.level === 0;

  /* ======================= Farben ======================= */
  const SHC = new Map();
  /* hellt (k>0) oder dunkelt (k<0) eine #rrggbb-Farbe ab */
  function sh(col, k) {
    const key = col + k; let r = SHC.get(key); if (r) return r;
    const n = parseInt(col.slice(1), 16), f = v => Math.max(0, Math.min(255, Math.round(k >= 0 ? v + (255 - v) * k : v * (1 + k))));
    r = "rgb(" + f(n >> 16) + "," + f((n >> 8) & 255) + "," + f(n & 255) + ")"; SHC.set(key, r); return r;
  }
  const rgba = (col, a) => { const n = parseInt(col.slice(1), 16); return "rgba(" + (n >> 16) + "," + ((n >> 8) & 255) + "," + (n & 255) + "," + a + ")"; };

  /* ======================= Malwerkzeuge ======================= */
  function E(c, x, y, rx, ry, col, rot) { c.fillStyle = col; c.beginPath(); c.ellipse(x, y, Math.max(0.01, rx), Math.max(0.01, ry), rot || 0, 0, TAU); c.fill(); }
  function B(c, x, y, w, h, col) { c.fillStyle = col; c.fillRect(x, y, w, h); }
  function P(c, col, p) { c.fillStyle = col; c.beginPath(); c.moveTo(p[0], p[1]); for (let i = 2; i < p.length; i += 2) c.lineTo(p[i], p[i + 1]); c.closePath(); c.fill(); }
  function Ln(c, col, w, p) { c.strokeStyle = col; c.lineWidth = w; c.beginPath(); c.moveTo(p[0], p[1]); for (let i = 2; i < p.length; i += 2) c.lineTo(p[i], p[i + 1]); c.stroke(); }
  function Q(c, col, w, x0, y0, cx, cy, x1, y1) { c.strokeStyle = col; c.lineWidth = w; c.beginPath(); c.moveTo(x0, y0); c.quadraticCurveTo(cx, cy, x1, y1); c.stroke(); }
  function lg(c, x0, y0, x1, y1, cols) { const g = c.createLinearGradient(x0, y0, x1, y1); cols.forEach((s, i) => g.addColorStop(i / (cols.length - 1), s)); return g; }
  function rg(c, x, y, r, cols) { const g = c.createRadialGradient(x, y, 0, x, y, r); cols.forEach((s, i) => g.addColorStop(i / (cols.length - 1), s)); return g; }
  /* weicher Kontaktschatten am Boden */
  function shadow(c, x, y, rx, ry, a) { c.save(); c.translate(x, y); c.scale(1, ry / rx); c.fillStyle = rg(c, 0, 0, rx, ["rgba(0,0,0," + (a || 0.45) + ")", "rgba(0,0,0," + (a || 0.45) * 0.5 + ")", "rgba(0,0,0,0)"]); c.beginPath(); c.arc(0, 0, rx, 0, TAU); c.fill(); c.restore(); }
  /* Holz mit Maserung, Ästen, Lichtkante oben/links und Schattenkante */
  function wood(c, x, y, w, h, col, R, vert) {
    col = col || "#6a4428"; if (vert == null) vert = h > w;
    c.fillStyle = vert ? lg(c, x, 0, x + w, 0, [sh(col, 0.16), col, sh(col, -0.34)]) : lg(c, 0, y, 0, y + h, [sh(col, 0.16), col, sh(col, -0.34)]);
    c.fillRect(x, y, w, h);
    const span = vert ? w : h, len = vert ? h : w, n = Math.max(1, Math.round(span / 1.4));
    c.lineWidth = 0.28;
    for (let i = 0; i < n; i++) {
      c.strokeStyle = i % 2 ? "rgba(25,12,4,.32)" : "rgba(255,220,170,.08)";
      const o = (i + 0.5) / n * span, ph = R() * 9, am = 0.12 + R() * 0.3;
      c.beginPath();
      for (let k = 0; k <= len + 0.01; k += Math.min(2, len)) { const d = o + Math.sin(k * 0.33 + ph) * am; if (vert) k ? c.lineTo(x + d, y + k) : c.moveTo(x + d, y + k); else k ? c.lineTo(x + k, y + d) : c.moveTo(x + k, y + d); }
      c.stroke();
    }
    if (len > 8 && span > 2.4 && R() < 0.5) {
      const kx = vert ? x + w * (0.3 + R() * 0.4) : x + 2 + R() * (w - 4), ky = vert ? y + 2 + R() * (h - 4) : y + h * (0.3 + R() * 0.4);
      E(c, kx, ky, vert ? 0.45 : 1.1, vert ? 1.1 : 0.45, "rgba(30,14,6,.6)"); c.strokeStyle = "rgba(30,14,6,.25)"; c.lineWidth = 0.25; c.beginPath(); c.ellipse(kx, ky, vert ? 0.9 : 2, vert ? 2 : 0.9, 0, 0, TAU); c.stroke();
    }
    c.fillStyle = "rgba(255,226,180,.22)"; vert ? c.fillRect(x, y, 0.45, h) : c.fillRect(x, y, w, 0.45);
    c.fillStyle = "rgba(0,0,0,.38)"; vert ? c.fillRect(x + w - 0.4, y, 0.4, h) : c.fillRect(x, y + h - 0.4, w, 0.4);
  }
  /* Kratzer und abgestoßene Kanten */
  function wear(c, x, y, w, h, R, n, light) { c.lineWidth = 0.25; for (let i = 0; i < n; i++) { const sx = x + R() * w, sy = y + R() * h, a = (R() - 0.5) * 1.2; c.strokeStyle = light === false ? "rgba(0,0,0,.25)" : "rgba(255,235,200,.16)"; c.beginPath(); c.moveTo(sx, sy); c.lineTo(sx + Math.cos(a) * (1 + R() * 2), sy + Math.sin(a) * (1 + R() * 2)); c.stroke(); } }
  /* Metall mit Verlauf und Glanzlicht */
  function metal(c, x, y, w, h, col) { c.fillStyle = lg(c, x, y, x + w * 0.4, y + h, [sh(col, 0.42), col, sh(col, -0.48)]); c.fillRect(x, y, w, h); c.fillStyle = "rgba(255,250,235,.5)"; c.fillRect(x + w * 0.12, y + 0.15, Math.max(0.35, w * 0.3), Math.min(0.45, h * 0.4)); }
  function rivet(c, x, y, r) { r = r || 0.55; E(c, x, y, r, r, "#262022"); E(c, x - r * 0.3, y - r * 0.3, r * 0.45, r * 0.45, "rgba(255,240,220,.55)"); }
  function band(c, x, y, w, h) { h = h || 1.2; metal(c, x, y, w, h, "#4a4446"); for (let k = x + 1.4; k < x + w - 0.8; k += 4) rivet(c, k, y + h / 2, 0.36); }
  /* stehendes Fass mit Dauben, Wölbung, Reifen und Deckel */
  function fass(c, x, y, w, h, col, R, open) {
    col = col || "#6a4428"; const top = y - h;
    c.save(); c.beginPath(); c.moveTo(x - w * 0.42, y); c.quadraticCurveTo(x - w * 0.58, y - h / 2, x - w * 0.42, top); c.lineTo(x + w * 0.42, top); c.quadraticCurveTo(x + w * 0.58, y - h / 2, x + w * 0.42, y); c.closePath();
    c.fillStyle = lg(c, x - w / 2, 0, x + w / 2, 0, [sh(col, -0.4), sh(col, 0.2), col, sh(col, -0.55)]); c.fill(); c.clip();
    const n = Math.max(3, Math.round(w / 2.4));
    for (let i = 1; i < n; i++) { const u = i / n - 0.5; c.strokeStyle = "rgba(20,10,4,.45)"; c.lineWidth = 0.3; c.beginPath(); c.moveTo(x + u * w * 0.84, y); c.quadraticCurveTo(x + u * w * 1.12, y - h / 2, x + u * w * 0.84, top); c.stroke(); }
    for (let i = 0; i < 7; i++) E(c, x + (R() - 0.5) * w * 0.8, y - R() * h, 0.25, 0.8 + R() * 2, "rgba(20,10,4,.18)");
    B(c, x - w, y - h * 0.62, w * 2, h * 0.08, "rgba(255,220,170,.05)");
    c.restore();
    for (const fy of [0.15, 0.85, 0.42]) { if (fy === 0.42 && h < 12) continue; const yy = y - h * fy, ww = w * (0.43 + 0.13 * Math.sin(fy * PI)); c.fillStyle = lg(c, 0, yy - 0.8, 0, yy + 0.8, ["#868082", "#3a3436"]); c.fillRect(x - ww, yy - 0.75, ww * 2, 1.5); c.fillStyle = "rgba(255,240,220,.35)"; c.fillRect(x - ww * 0.7, yy - 0.75, ww * 0.5, 0.35); rivet(c, x - ww * 0.15, yy, 0.32); }
    if (open) { E(c, x, top, w * 0.42, w * 0.11, sh(col, -0.5)); E(c, x, top + 0.3, w * 0.36, w * 0.08, open); }
    else { E(c, x, top, w * 0.43, w * 0.11, sh(col, -0.25)); E(c, x, top - 0.1, w * 0.37, w * 0.08, sh(col, 0.06)); Ln(c, "rgba(20,10,4,.35)", 0.25, [x - w * 0.3, top, x + w * 0.3, top]); }
  }
  /* liegendes Fass von vorn: Stirnseite mit Brettern, Reifen, Spund */
  function fassStirn(c, x, y, r, col, R, hahn) {
    col = col || "#6a4428";
    E(c, x, y, r, r, "#3a3234"); E(c, x - 0.3, y - 0.3, r - 0.2, r - 0.2, lg(c, x - r, y - r, x + r, y + r, ["#8a8486", "#3a3436"]));
    c.save(); c.beginPath(); c.arc(x, y, r - 1.1, 0, TAU); c.clip();
    c.fillStyle = rg(c, x - r * 0.3, y - r * 0.3, r * 1.3, [sh(col, 0.2), col, sh(col, -0.45)]); c.fillRect(x - r, y - r, r * 2, r * 2);
    for (let k = -r; k < r; k += 2.2) Ln(c, "rgba(20,10,4,.45)", 0.3, [x - r, y + k, x + r, y + k]);
    wear(c, x - r, y - r, r * 2, r * 2, R, 4);
    c.restore();
    c.strokeStyle = "rgba(20,10,4,.4)"; c.lineWidth = 0.3; c.beginPath(); c.arc(x, y, r * 0.6, 0, TAU); c.stroke();
    E(c, x, y + r * 0.35, 0.9, 0.9, "#1e140c"); E(c, x - 0.2, y + r * 0.35 - 0.2, 0.5, 0.5, "#3a2a1a");
    if (hahn) { metal(c, x - 0.6, y + r * 0.5, 1.2, 3, "#b8923a"); metal(c, x - 1.6, y + r * 0.5 + 2.4, 3.2, 1, "#a8823a"); B(c, x - 0.3, y + r * 0.5 - 1.2, 0.6, 1.4, "#8a6a2a"); }
  }
  /* Kiste aus Brettern mit Rahmen, Strebe und Nägeln (x,y = oben links) */
  function kiste(c, x, y, w, h, col, R, o) {
    col = col || "#7a5432";
    const nb = Math.max(2, Math.round(h / 3.2));
    for (let i = 0; i < nb; i++) wood(c, x, y + i * h / nb, w, h / nb - 0.25, sh(col, (R() - 0.5) * 0.12), R, false);
    const fr = Math.min(1.6, w * 0.14), dk = sh(col, -0.2);
    wood(c, x, y, fr, h, dk, R, true); wood(c, x + w - fr, y, fr, h, dk, R, true);
    if (!(o && o.nobrace)) { c.save(); c.beginPath(); c.rect(x + fr, y, w - fr * 2, h); c.clip(); c.translate(x + w / 2, y + h / 2); c.rotate(Math.atan2(h, w - fr * 2)); wood(c, -w, -fr * 0.45, w * 2, fr * 0.9, dk, R, false); c.restore(); }
    for (const [nx, ny] of [[x + fr / 2, y + 0.8], [x + w - fr / 2, y + 0.8], [x + fr / 2, y + h - 0.8], [x + w - fr / 2, y + h - 0.8]]) rivet(c, nx, ny, 0.32);
    wear(c, x, y, w, h, R, 3);
    if (o && o.label) { B(c, x + w * 0.3, y + h * 0.3, w * 0.4, h * 0.25, "rgba(20,12,6,.35)"); }
  }
  /* Sack: gewölbt, mit Falten, Schnur und Flicken */
  function sack(c, x, y, s, col, R, open) {
    col = col || "#b8a080";
    c.beginPath(); c.moveTo(x - 6 * s, y); c.bezierCurveTo(x - 8 * s, y - 6 * s, x - 5 * s, y - 11 * s, x - 2 * s, y - 12 * s); c.lineTo(x + 2 * s, y - 12 * s); c.bezierCurveTo(x + 5 * s, y - 11 * s, x + 8 * s, y - 6 * s, x + 6 * s, y); c.closePath();
    c.fillStyle = lg(c, x - 7 * s, y - 12 * s, x + 7 * s, y, [sh(col, 0.2), col, sh(col, -0.4)]); c.fill();
    c.save(); c.clip(); c.lineWidth = 0.25; for (let k = 0; k < 4; k++) { const fx = x + (R() - 0.5) * 8 * s; Q(c, "rgba(40,28,14,.35)", 0.3, fx, y - 11 * s, fx + (R() - 0.5) * 3, y - 6 * s, fx + (R() - 0.5) * 4, y - 1); }
    for (let yy = y - 12 * s; yy < y; yy += 0.9) B(c, x - 8 * s, yy, 16 * s, 0.25, "rgba(255,240,210,.05)");
    if (R() < 0.4) { const px = x + (R() - 0.3) * 4 * s, py = y - 5 * s - R() * 3 * s; B(c, px, py, 3 * s, 2.6 * s, sh(col, -0.25)); c.setLineDash([0.4, 0.4]); c.strokeStyle = "rgba(30,20,10,.6)"; c.lineWidth = 0.2; c.strokeRect(px, py, 3 * s, 2.6 * s); c.setLineDash([]); }
    c.restore();
    if (open) { E(c, x, y - 12 * s, 3 * s, 1.1 * s, sh(col, -0.35)); E(c, x, y - 12.2 * s, 2.4 * s, 0.8 * s, open); }
    else { P(c, sh(col, -0.1), [x - 2 * s, y - 12 * s, x - 2.6 * s, y - 14.5 * s, x + 2.6 * s, y - 14.5 * s, x + 2 * s, y - 12 * s]); B(c, x - 2.4 * s, y - 12.6 * s, 4.8 * s, 0.7, "#6a4a2a"); }
  }
  /* Kerze (nur Körper; Flamme kommt als Animation) */
  function kerze(c, x, y, h, w, col) {
    col = col || "#e8dcc0";
    c.fillStyle = lg(c, x - w / 2, 0, x + w / 2, 0, [sh(col, 0.15), col, sh(col, -0.32)]); c.fillRect(x - w / 2, y - h, w, h);
    E(c, x - w / 2 + 0.15, y - h + 1.4, 0.3, 1.1, sh(col, 0.05)); E(c, x + w / 2 - 0.2, y - h + 2.2, 0.28, 1.7, sh(col, -0.08)); E(c, x - w / 2, y - h + 2.8, 0.25, 0.4, col);
    E(c, x, y - h, w / 2, 0.35, sh(col, 0.25)); B(c, x - 0.12, y - h - 0.9, 0.24, 0.9, "#1a1210");
  }
  function flasche(c, x, y, h, col, R) {
    const w = h * 0.36;
    c.fillStyle = lg(c, x - w / 2, 0, x + w / 2, 0, [sh(col, 0.25), col, sh(col, -0.5)]);
    c.beginPath(); c.moveTo(x - w / 2, y); c.lineTo(x - w / 2, y - h * 0.55); c.quadraticCurveTo(x - w / 2, y - h * 0.72, x - w * 0.18, y - h * 0.76); c.lineTo(x - w * 0.18, y - h); c.lineTo(x + w * 0.18, y - h); c.lineTo(x + w * 0.18, y - h * 0.76); c.quadraticCurveTo(x + w / 2, y - h * 0.72, x + w / 2, y - h * 0.55); c.lineTo(x + w / 2, y); c.closePath(); c.fill();
    B(c, x - w * 0.22, y - h - 0.6, w * 0.44, 1, "#8a6a40");
    B(c, x - w * 0.32, y - h * 0.5, 0.4, h * 0.4, "rgba(255,255,240,.45)");
    if (R && R() < 0.6) { B(c, x - w / 2, y - h * 0.42, w, h * 0.22, "#d8c8a0"); B(c, x - w / 2, y - h * 0.42, w, 0.3, "rgba(0,0,0,.25)"); }
  }
  function buch(c, x, y, w, h, col, R) {
    c.fillStyle = lg(c, x, 0, x + w, 0, [sh(col, 0.2), col, sh(col, -0.4)]); c.fillRect(x, y, w, h);
    B(c, x, y + h * 0.18, w, 0.35, "rgba(230,190,90,.55)"); B(c, x, y + h * 0.78, w, 0.35, "rgba(230,190,90,.55)");
    if (R && R() < 0.4) B(c, x + w * 0.3, y + h * 0.38, w * 0.4, h * 0.2, "rgba(230,200,140,.5)");
  }
  function stein(c, pts, col, R) {
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; for (let i = 0; i < pts.length; i += 2) { x0 = Math.min(x0, pts[i]); x1 = Math.max(x1, pts[i]); y0 = Math.min(y0, pts[i + 1]); y1 = Math.max(y1, pts[i + 1]); }
    c.save(); P(c, lg(c, x0, y0, x1, y1, [sh(col, 0.22), col, sh(col, -0.4)]), pts); c.clip();
    for (let i = 0; i < (x1 - x0) * (y1 - y0) * 0.15; i++) B(c, x0 + R() * (x1 - x0), y0 + R() * (y1 - y0), 0.4, 0.4, R() < 0.5 ? "rgba(0,0,0,.18)" : "rgba(255,240,220,.1)");
    c.restore();
  }
  /* statische Kette aus Gliedern */
  function kette(c, x0, y0, x1, y1, col, sag) {
    const d = Math.hypot(x1 - x0, y1 - y0), n = Math.max(2, Math.round(d / 1.8)); col = col || "#5a5456";
    for (let i = 0; i < n; i++) {
      const u = (i + 0.5) / n, x = x0 + (x1 - x0) * u, y = y0 + (y1 - y0) * u + Math.sin(u * PI) * (sag || 0), a = Math.atan2(y1 - y0, x1 - x0);
      c.save(); c.translate(x, y); c.rotate(a); c.strokeStyle = i % 2 ? sh(col, -0.25) : col; c.lineWidth = 0.5; c.beginPath(); c.ellipse(0, 0, 1.2, i % 2 ? 0.3 : 0.7, 0, 0, TAU); c.stroke(); if (!(i % 2)) { c.strokeStyle = "rgba(255,240,220,.3)"; c.lineWidth = 0.2; c.beginPath(); c.ellipse(0, 0, 1.2, 0.7, 0, PI, PI * 1.5); c.stroke(); } c.restore();
    }
  }
  /* gedrehtes Seil */
  function seil(c, pts, col, w) {
    col = col || "#a08050"; w = w || 1;
    c.lineCap = "round"; Ln(c, sh(col, -0.35), w + 0.3, pts); Ln(c, col, w, pts);
    c.setLineDash([0.5, 0.7]); Ln(c, "rgba(40,24,8,.5)", w * 0.7, pts); c.setLineDash([]); c.lineCap = "butt";
  }
  const BONE = "#d8cfb8";
  function knochen(c, x0, y0, x1, y1, w) { w = w || 1.1; c.lineCap = "round"; Ln(c, "#8a8270", w + 0.3, [x0, y0 + 0.2, x1, y1 + 0.2]); Ln(c, BONE, w, [x0, y0, x1, y1]); c.lineCap = "butt"; for (const [x, y] of [[x0, y0], [x1, y1]]) { E(c, x, y, w * 0.7, w * 0.7, BONE); } Ln(c, "rgba(255,255,240,.4)", 0.25, [x0, y0 - w * 0.3, x1, y1 - w * 0.3]); }
  function schaedel(c, x, y, r, rot) {
    c.save(); c.translate(x, y); c.rotate(rot || 0);
    c.fillStyle = rg(c, -r * 0.3, -r * 0.4, r * 1.6, ["#efe6d0", BONE, "#9a907a"]); c.beginPath(); c.arc(0, 0, r, 0, TAU); c.fill(); c.fillRect(-r * 0.55, r * 0.45, r * 1.1, r * 0.6);
    E(c, -r * 0.38, 0, r * 0.27, r * 0.3, "#1a1214"); E(c, r * 0.38, 0, r * 0.27, r * 0.3, "#1a1214");
    P(c, "#2a2020", [0, r * 0.3, -r * 0.14, r * 0.58, r * 0.14, r * 0.58]);
    for (let k = -2; k <= 2; k++) B(c, k * r * 0.2 - 0.18, r * 0.78, 0.36, r * 0.3, "#3a3030");
    Ln(c, "rgba(60,50,40,.5)", 0.2, [r * 0.2, -r * 0.9, r * 0.35, -r * 0.4, r * 0.1, -r * 0.2]);
    c.restore();
  }
  function apfel(c, x, y, r, col) { E(c, x, y, r, r * 0.92, col || "#a8302a"); E(c, x - r * 0.35, y - r * 0.35, r * 0.3, r * 0.22, "rgba(255,240,200,.45)"); B(c, x - 0.1, y - r - 0.6, 0.25, 0.8, "#4a3018"); E(c, x + 0.5, y - r - 0.3, 0.6, 0.25, "#4a6a2a", -0.4); }
  function brot(c, x, y, w) { E(c, x, y - w * 0.28, w * 0.5, w * 0.3, "#b07a3a"); E(c, x - w * 0.1, y - w * 0.36, w * 0.36, w * 0.17, "#d09a50"); for (let k = -1; k <= 1; k++) Ln(c, "#8a5a24", 0.3, [x + k * w * 0.18 - 0.6, y - w * 0.45, x + k * w * 0.18 + 0.6, y - w * 0.2]); }
  function teller(c, x, y, w, col) { E(c, x, y, w / 2, w * 0.13, "rgba(0,0,0,.3)"); E(c, x, y - 0.4, w / 2, w * 0.13, col || "#c8c0b4"); E(c, x, y - 0.5, w * 0.34, w * 0.08, sh(col || "#c8c0b4", -0.12)); }
  function becher(c, x, y, col) { col = col || "#b8923a"; P(c, lg(c, x - 1.4, 0, x + 1.4, 0, [sh(col, 0.4), col, sh(col, -0.5)]), [x - 1.4, y - 4, x + 1.4, y - 4, x + 0.5, y - 2, x + 0.4, y - 0.6, x + 1.2, y, x - 1.2, y, x - 0.4, y - 0.6, x - 0.5, y - 2]); E(c, x, y - 4, 1.4, 0.35, sh(col, -0.4)); B(c, x - 1, y - 3.8, 0.3, 1.4, "rgba(255,250,230,.6)"); }
  function krug(c, x, y, h, col) {
    col = col || "#9a6a4a"; const w = h * 0.6;
    c.fillStyle = lg(c, x - w / 2, 0, x + w / 2, 0, [sh(col, 0.25), col, sh(col, -0.45)]);
    c.beginPath(); c.moveTo(x - w * 0.3, y); c.quadraticCurveTo(x - w * 0.65, y - h * 0.5, x - w * 0.3, y - h * 0.85); c.lineTo(x - w * 0.36, y - h); c.lineTo(x + w * 0.36, y - h); c.lineTo(x + w * 0.3, y - h * 0.85); c.quadraticCurveTo(x + w * 0.65, y - h * 0.5, x + w * 0.3, y); c.closePath(); c.fill();
    c.strokeStyle = sh(col, -0.3); c.lineWidth = 0.7; c.beginPath(); c.arc(x + w * 0.48, y - h * 0.58, h * 0.2, -1.3, 1.3); c.stroke();
    B(c, x - w * 0.5, y - h * 0.55, w, 0.35, "rgba(0,0,0,.2)"); B(c, x - w * 0.28, y - h * 0.75, 0.4, h * 0.4, "rgba(255,240,220,.35)");
  }
  /* Stoffbahn mit Faltenwurf */
  function stoff(c, x, y, w, h, col, R, folds) {
    folds = folds || Math.max(2, Math.round(w / 3));
    const g = c.createLinearGradient(x, 0, x + w, 0);
    for (let k = 0; k <= folds * 2; k++) g.addColorStop(k / (folds * 2), k % 2 ? sh(col, -0.32) : sh(col, 0.1));
    c.fillStyle = g; c.fillRect(x, y, w, h);
    B(c, x, y + h - 0.5, w, 0.5, "rgba(0,0,0,.3)");
  }
  /* Holzbein gedrechselt */
  function drechsel(c, x, y, h, w, col, R) { wood(c, x - w / 2, y - h, w, h, col, R, true); for (const f of [0.2, 0.55, 0.85]) E(c, x, y - h * f, w * 0.75, 0.6, sh(col, -0.15)); E(c, x - w * 0.3, y - h * 0.55, w * 0.2, 0.3, "rgba(255,230,190,.3)"); }

  /* ======================= Glow, Flammen, Lichtlöcher ======================= */
  const GLOWC = { w: [255, 176, 90], g: [130, 255, 90], p: [205, 120, 255], e: [255, 100, 40], m: [220, 230, 170] };
  const GLOW = {};
  function glowSpr(k) {
    if (GLOW[k]) return GLOW[k];
    const cv = document.createElement("canvas"); cv.width = cv.height = 64; const c = cv.getContext("2d"), [r, g, b] = GLOWC[k] || GLOWC.w;
    c.fillStyle = rg(c, 32, 32, 32, ["rgba(" + r + "," + g + "," + b + ",1)", "rgba(" + r + "," + g + "," + b + ",.42)", "rgba(" + r + "," + g + "," + b + ",.12)", "rgba(" + r + "," + g + "," + b + ",0)"]); c.fillRect(0, 0, 64, 64);
    return (GLOW[k] = cv);
  }
  const FQ = [], GQ = [], HQ = []; let FQn = 0, GQn = 0, HQn = 0;
  let cx0 = 0, cy0 = 0, cf0 = 1, cvis = 1;
  /* Zustand beim Malen eines Stücks: Requisit, Flammenzähler, Drehung (Wackeln/Schwingen) um den Drehpunkt, Schnappschuss-Modus */
  let curP = null, curFi = 0, curRot = 0, curPy = 0, capture = false, WX = 0, WY = 0, TT = 0;
  function wpos(lx, ly) { const xf = lx * cf0; if (!curRot) { WX = cx0 + xf; WY = cy0 + ly; return; } const co = Math.cos(curRot), si = Math.sin(curRot), dy = ly - curPy; WX = cx0 + xf * co - dy * si; WY = cy0 + curPy + xf * si + dy * co; }
  /* dauerhafter Zustand je Flamme eines Requisits (Neigung l, Neigungsgeschwindigkeit v) – auch für weltspuren.js */
  function flameState(p, i, s, k) { const a = p.fst || (p.fst = []); let st = a[i]; if (!st) st = a[i] = { p, i, s, k: k || "w", l: 0, v: 0, x: 0, y: 0, seen: -9, col: FCOL[k || "w"] || FCOL.w }; return st; }
  const FCOL = { w: "255,176,90", e: "255,120,50", g: "130,255,90", p: "205,120,255" };
  /* Flamme an lokaler Position (wird nach dem Licht gemalt) */
  function fl(lx, ly, s, ph, k) {
    if (capture) return; let st = null;
    if (curP) { const i = curFi++; if (curP.out || curP.broken) return; st = flameState(curP, i, s, k); }
    if (FQn >= 90 || cvis < 0.05) { if (st) { wpos(lx, ly); st.x = WX; st.y = WY; st.seen = TT; } return; }
    const q = FQ[FQn] || (FQ[FQn] = {}); FQn++; wpos(lx, ly); q.x = WX; q.y = WY; q.s = s; q.ph = ph || 0; q.k = k || "w"; q.v = cvis; q.l = st ? st.l : 0;
    if (st) { st.x = WX; st.y = WY; st.s = s; st.seen = TT; }
  }
  /* reiner Schein (Glut, Pilzlicht, Runen) */
  function glow(lx, ly, r, a, k) { if (capture || GQn >= 60 || cvis < 0.05 || (curP && curP.broken)) return; const q = GQ[GQn] || (GQ[GQn] = {}); GQn++; wpos(lx, ly); q.x = WX; q.y = WY; q.r = r; q.a = a * cvis; q.k = k || "w"; }
  /* Loch im Dunkel (sparsam) */
  function hole(lx, ly, r, a) { if (capture || HQn >= 24 || cvis < 0.05 || (curP && (curP.out || curP.broken))) return; const q = HQ[HQn] || (HQ[HQn] = {}); HQn++; wpos(lx, ly); q.x = WX; q.y = WY; q.r = r; q.a = a; }
  const FLC = { w: ["rgba(255,150,60,.85)", "rgba(255,214,120,.95)", "rgba(255,252,230,1)"], g: ["rgba(60,200,60,.85)", "rgba(150,255,110,.95)", "rgba(235,255,220,1)"], e: ["rgba(255,90,30,.85)", "rgba(255,160,60,.95)", "rgba(255,230,160,1)"], p: ["rgba(170,80,255,.8)", "rgba(220,150,255,.9)", "rgba(250,230,255,1)"] };
  function drawFlame(c, x, y, s, t, ph, k, l) {
    l = l || 0;
    const f = 0.84 + 0.16 * Math.sin(t * 13 + ph) * Math.sin(t * 7.3 + ph * 2), sw = (Z.windX || 0) * 0.012 + Math.sin(t * 3.1 + ph) * 0.22 + Math.sin(t * 17 + ph) * 0.06 + l * 0.9, cl = FLC[k] || FLC.w;
    const h = 3.2 * s * f * (1 - Math.min(0.4, Math.abs(l) * 0.3));
    c.fillStyle = cl[0]; c.beginPath(); c.moveTo(x - 0.95 * s, y); c.bezierCurveTo(x - 1.1 * s, y - h * 0.45, x + sw * s * 0.4, y - h * 0.7, x + sw * s * 2, y - h); c.bezierCurveTo(x + sw * s * 0.4 + 0.5 * s, y - h * 0.6, x + 1.1 * s, y - h * 0.4, x + 0.95 * s, y); c.quadraticCurveTo(x, y + 0.7 * s, x - 0.95 * s, y); c.fill();
    E(c, x + sw * s * 0.5, y - h * 0.32, 0.55 * s, h * 0.3, cl[1]); E(c, x + sw * s * 0.2, y - h * 0.18, 0.3 * s, h * 0.16, cl[2]);
  }
  function flush(c, t) {
    if (!FQn && !GQn) return;
    c.save(); c.globalCompositeOperation = "lighter";
    for (let i = 0; i < GQn; i++) { const q = GQ[i], f = 0.85 + 0.15 * Math.sin(t * 2.3 + q.x * 0.1); c.globalAlpha = Math.min(1, q.a * f); c.drawImage(glowSpr(q.k), q.x - q.r, q.y - q.r, q.r * 2, q.r * 2); }
    for (let i = 0; i < FQn; i++) {
      const q = FQ[i], f = 0.8 + 0.2 * Math.sin(t * 9 + q.ph) * Math.sin(t * 5.3 + q.ph * 2), r = 15 * q.s;
      c.globalAlpha = 0.3 * f * q.v; c.drawImage(glowSpr(q.k), q.x - r, q.y - 1.6 * q.s - r, r * 2, r * 2);
      c.globalAlpha = 0.9 * q.v; drawFlame(c, q.x, q.y, q.s, t, q.ph, q.k, q.l);
    }
    c.restore(); c.globalAlpha = 1;
  }
  const le0 = Z.lightExtra;
  Z.lightExtra = function (holeFn) { if (le0) le0(holeFn); if (Z.level === lvRef) for (let i = 0; i < HQn; i++) { const q = HQ[i]; holeFn(q.x, q.y, q.r, q.a); } };

  /* Fliegen, die um Essen oder Aas kreisen */
  function fliegen(c, x, y, t, n, ph) {
    for (let i = 0; i < n; i++) {
      const a = t * (2.2 + i * 0.7) + ph + i * 2.1, fx = x + Math.sin(a) * (3 + i) + Math.sin(a * 2.7) * 1.2, fy = y - 3 - Math.abs(Math.cos(a * 1.3)) * (3 + i * 0.6) + Math.sin(a * 3.1) * 0.7;
      B(c, fx - 0.4, fy - 0.3, 0.8, 0.6, "#140e10"); if ((t * 40 + i * 7) % 2 < 1) B(c, fx - 0.6, fy - 0.8, 1.2, 0.4, "rgba(230,230,220,.45)");
    }
  }
  function rauch(c, x, y, t, ph, col) { for (let k = 0; k < 3; k++) { const u = (t * 0.35 + ph + k / 3) % 1; E(c, x + Math.sin(u * 6 + ph) * 2 * u + (Z.windX || 0) * u * 0.1, y - u * 18, 0.8 + u * 3, 0.8 + u * 3, "rgba(" + (col || "110,100,100") + "," + 0.2 * (1 - u) * Math.min(1, u * 5) + ")"); } }
  const nahe = (wx, wy, r) => { const p = Z.player; if (!p || p.dead) return false; const dx = p.x + p.w / 2 - wx, dy = p.y + p.h / 2 - wy; return dx * dx + dy * dy < r * r; };

  /* ======================= Requisiten =======================
     K[art] = { at: "f" Boden | "w" Wand | "c" Decke, w: Breite in Kacheln, box: [l,o,r,u] (lokal, Ursprung Mitte unten bzw. Deckenkante),
                nv: Varianten, s(c,R,v): statisch gemalt (gecacht), a(c,p,t): Animation, fls: [[x,y,s]] Kerzenflammen, holeR: Lichtloch,
                noflip, crit: Tier (eigene Logik) } */
  const K = {};
  /* ---------- Möbel und Tische ---------- */
  /* Tischgestell mit gedrechselten Beinen; liefert die Höhe der Tischoberfläche */
  function tisch(c, R, w, h, col, rough) {
    col = col || "#6a4026";
    shadow(c, 0, 0.5, w / 2 + 5, 2.6, 0.5);
    if (rough) { wood(c, -w / 2 + 4, -h + 1, 2.2, h - 1, sh(col, -0.35), R, true); wood(c, w / 2 - 5, -h + 1, 2.2, h - 1, sh(col, -0.35), R, true); wood(c, -w / 2 + 3, -h * 0.45, w - 6, 1.4, sh(col, -0.3), R, false); }
    else { drechsel(c, -w / 2 + 5, 0, h - 2, 2, sh(col, -0.38), R); drechsel(c, w / 2 - 4, 0, h - 2, 2, sh(col, -0.38), R); }
    wood(c, -w / 2 + 2, -h + 1.6, w - 4, 2.6, sh(col, -0.2), R, false);
    if (rough) { wood(c, -w / 2 + 1.5, -h + 1, 2.8, h - 1, col, R, true); wood(c, w / 2 - 4.3, -h + 1, 2.8, h - 1, col, R, true); }
    else { drechsel(c, -w / 2 + 2.6, 0, h - 1, 2.6, col, R); drechsel(c, w / 2 - 2.6, 0, h - 1, 2.6, col, R); }
    wood(c, -w / 2, -h - 1.1, w, 1.3, sh(col, 0.18), R, false);
    wood(c, -w / 2 - 1, -h, w + 2, 2.4, col, R, false);
    wear(c, -w / 2, -h - 1, w, 3, R, 5);
    return -h - 1;
  }
  function kandelaber3(c, x, y, s, col) {
    col = col || "#c8a040";
    E(c, x, y - 0.4, 3 * s, 0.9 * s, sh(col, -0.3)); metal(c, x - 0.6 * s, y - 7 * s, 1.2 * s, 6.6 * s, col); E(c, x, y - 4 * s, 1.1 * s, 0.6 * s, col);
    c.strokeStyle = col; c.lineWidth = 0.7 * s; c.beginPath(); c.moveTo(x - 4 * s, y - 8.5 * s); c.quadraticCurveTo(x - 4 * s, y - 6 * s, x, y - 6 * s); c.quadraticCurveTo(x + 4 * s, y - 6 * s, x + 4 * s, y - 8.5 * s); c.stroke();
    for (const dx of [-4, 0, 4]) { const yy = y - (dx ? 8.5 : 9.5) * s; B(c, x + dx * s - 1.2 * s, yy, 2.4 * s, 0.7 * s, sh(col, 0.1)); kerze(c, x + dx * s, yy, (dx ? 3.6 : 4.4) * s, 1.1 * s); }
  }
  Object.assign(K, {
    esstisch: { at: "f", w: 4, box: [-36, -36, 36, 4], s(c, R, v) {
      const ty = tisch(c, R, 54, 12, "#5e3a22");
      /* Tischtuch mit Faltenwurf und gestickter Borte */
      c.fillStyle = lg(c, 0, ty - 0.5, 0, ty + 6, ["#efe6d2", "#d8ccb4", "#b8aa90"]); c.beginPath(); c.moveTo(-27, ty - 0.6); c.lineTo(27, ty - 0.6); c.lineTo(28, ty + 5.5); for (let k = 0; k <= 12; k++) c.lineTo(28 - k * 56 / 12, ty + 5.5 + (k % 2 ? 0.8 : 0)); c.closePath(); c.fill();
      for (let k = -24; k < 26; k += 4.6) Ln(c, "rgba(120,100,80,.3)", 0.35, [k, ty + 0.4, k + 0.6, ty + 5.6]);
      B(c, -27.5, ty + 4.2, 55.5, 0.7, "#8a2a2a"); for (let k = -26; k < 27; k += 2) B(c, k, ty + 4.3, 0.8, 0.5, "#d8a840");
      B(c, -8, ty - 0.7, 16, 6.8, "#7a1a20"); B(c, -8, ty - 0.7, 16, 0.4, "rgba(255,200,160,.35)"); for (let k = -7; k < 8; k += 1.6) B(c, k, ty + 6, 0.5, 1.1, "#c89a40");
      if (v === 0) {
        kandelaber3(c, 0, ty, 1);
        teller(c, -18, ty, 9); /* Braten */ E(c, -18, ty - 2.4, 4.2, 2.6, "#9a5424"); E(c, -18.6, ty - 3.2, 3, 1.4, "#c07a3a"); E(c, -19.5, ty - 3.6, 1.2, 0.5, "rgba(255,230,180,.5)"); knochen(c, -14.5, ty - 2, -12, ty - 4, 0.8); knochen(c, -21.5, ty - 1.6, -23.6, ty - 3.6, 0.7);
        brot(c, -9.5, ty, 5); E(c, 9, ty - 1.2, 2.8, 1.4, "#e8c060"); P(c, "#c89a30", [9, ty - 1.2, 12, ty - 1.6, 11.6, ty - 0.2]); B(c, 7, ty - 1.4, 1, 0.4, "rgba(80,50,10,.5)");
        for (let k = 0; k < 7; k++) E(c, 14 + (k % 3) * 1.1 - (k > 5 ? 0 : 0), ty - 1 - Math.floor(k / 3) * 1.1, 0.75, 0.75, k % 2 ? "#6a2a4a" : "#7a3a5a");
        apfel(c, 17.5, ty - 1.4, 1.4); apfel(c, 19.6, ty - 1.2, 1.2, "#b8a030");
        becher(c, -5, ty); becher(c, 23, ty, "#acaaa6"); krug(c, 5.5, ty, 5.5, "#8a5a3a");
        E(c, 21, ty + 1.6, 2.6, 0.9, "rgba(110,20,30,.6)");
      } else if (v === 1) {
        kerze(c, -2, ty, 2.2, 1.6); B(c, -3.4, ty - 0.5, 2.8, 0.5, "#c8a040"); E(c, -2, ty - 0.2, 2.4, 0.5, "#e8dcc0");
        teller(c, -16, ty, 9); for (let k = 0; k < 4; k++) knochen(c, -19 + k * 2, ty - 1.4 - (k % 2), -17 + k * 2.2, ty - 0.6, 0.6);
        c.save(); c.translate(8, ty - 1.2); c.rotate(PI / 2); becher(c, 0, 1.4); c.restore(); E(c, 13, ty + 1.8, 5, 1.2, "rgba(110,20,30,.65)"); B(c, 14.5, ty + 3, 0.6, 3, "rgba(110,20,30,.5)");
        brot(c, 20, ty, 3.4); krug(c, -8, ty, 5, "#6a5a4a"); B(c, 3, ty - 0.4, 4.2, 0.4, "#b2b0ac"); B(c, 2, ty - 0.6, 1.6, 0.7, "#5a3a22");
      } else {
        kerze(c, 0, ty, 4.5, 1.3); E(c, 0, ty - 0.2, 2, 0.5, sh("#c8a040", -0.2));
        teller(c, -12, ty, 8); E(c, -12, ty - 1.8, 3, 1.6, "#a8783a"); E(c, -12, ty - 2.2, 2.4, 0.8, "#c89a50"); B(c, -10, ty - 4.4, 0.5, 2.6, "#a0a0a8");
        brot(c, 11, ty, 5); B(c, 15, ty - 0.5, 4, 0.5, "#a0a0a8"); becher(c, 20, ty, "#8a6a4a"); apfel(c, -21, ty - 1.4, 1.4, "#8a3a1a");
      }
    }, fls: [[-4, -24.1, 0.55, 0], [0, -25.1, 0.6, 0], [4, -24.1, 0.55, 0], [-2, -16.2, 0.5, 1], [0, -18.5, 0.55, 2]], holeR: [0, -22, 40, 0.45],
      a(c, p, t) { if (p.v !== 2) fliegen(c, p.v === 0 ? -18 : -16, -17, t, p.v === 0 ? 3 : 4, p.s * 9); } },
    stuhl: { at: "f", w: 1, box: [-9, -24, 9, 3], s(c, R, v) {
      const col = "#5a3820";
      if (v === 2) { /* umgekippt */ shadow(c, 0, 0.5, 9, 1.6, 0.45); c.save(); c.translate(0, -2.6); c.rotate(-PI / 2 + 0.1); wood(c, -2, -6, 2.2, 13, col, R, true); wood(c, 2, -6, 1.6, 6, sh(col, -0.2), R, true); wood(c, -2, -6, 6, 1.8, col, R, false); c.restore(); wood(c, -8, -3, 14, 1.6, col, R, false); wood(c, 4, -8, 1.6, 8, sh(col, -0.2), R, true); return; }
      shadow(c, 0, 0.5, 7, 1.8, 0.45);
      wood(c, 3.4, -7, 1.3, 7, sh(col, -0.35), R, true); wood(c, -4.6, -7, 1.3, 7, sh(col, -0.35), R, true);
      wood(c, -5.6, -21, 1.9, 21, col, R, true); wood(c, -5.6, -21.5, 3.4, 1.6, sh(col, 0.1), R, false); E(c, -4.7, -22, 1.3, 0.9, sh(col, 0.05));
      wood(c, -4, -17, 1.2, 9, sh(col, -0.1), R, true); wood(c, -3.8, -14, 0.9, 6, sh(col, -0.25), R, true);
      wood(c, -6, -8, 12, 1.8, sh(col, 0.08), R, false); wood(c, 4.4, -7, 1.6, 7, col, R, true); wood(c, -1, -4, 6, 0.9, sh(col, -0.2), R, false);
      if (v === 1) { c.fillStyle = lg(c, 0, -10.5, 0, -8, ["#a8303a", "#6a141c"]); c.beginPath(); c.moveTo(-5, -8); c.quadraticCurveTo(-5.4, -10.6, 0, -10.4); c.quadraticCurveTo(5.4, -10.6, 5, -8); c.fill(); for (const tx of [-5, 5]) E(c, tx, -8.4, 0.6, 0.6, "#d8a840"); }
    } },
    hocker: { at: "f", w: 1, box: [-8, -16, 8, 3], s(c, R, v) {
      const col = "#6a4428"; shadow(c, 0, 0.5, 7, 1.8, 0.45);
      c.save(); c.translate(-3, 0); c.rotate(0.14); wood(c, -0.8, -7, 1.6, 7, col, R, true); c.restore(); c.save(); c.translate(3, 0); c.rotate(-0.14); wood(c, -0.8, -7, 1.6, 7, col, R, true); c.restore(); wood(c, -0.6, -7, 1.2, 7, sh(col, -0.35), R, true);
      E(c, 0, -7.4, 5.2, 1.2, sh(col, -0.3)); wood(c, -5, -8.4, 10, 1.6, col, R, false); E(c, 0, -8.4, 5, 0.6, sh(col, 0.15));
      if (v === 2) { P(c, "#8e8c8a", [-1.6, -13, 1.6, -13, 1.4, -8.6, -1.4, -8.6]); B(c, -1.6, -13, 3.2, 0.5, "#b2b0ac"); c.strokeStyle = "#7e7c7a"; c.lineWidth = 0.5; c.beginPath(); c.arc(2, -11, 1.2, -1.4, 1.4); c.stroke(); E(c, 0, -12.9, 1.4, 0.3, "#e0d8b0"); }
    } },
    bank: { at: "f", w: 2, box: [-18, -12, 18, 3], s(c, R, v) { const col = "#5e3c22"; shadow(c, 0, 0.5, 16, 1.8, 0.45); for (const x of [-12, 11]) { wood(c, x, -6, 1.8, 6, col, R, true); wood(c, x + 0.5, -6, 1, 6, sh(col, -0.3), R, true); } wood(c, -12, -3, 24, 1, sh(col, -0.25), R, false); wood(c, -16, -7.4, 32, 1.8, col, R, false); if (v === 1) { E(c, 8, -8, 3, 0.8, "#6a4a2a"); B(c, 5.4, -9, 5, 1.2, "#8a6a40"); } } },
    wachtisch: { at: "f", w: 3, box: [-28, -32, 28, 4], s(c, R, v) {
      const ty = tisch(c, R, 38, 11, "#6a4a2c", true);
      /* Würfel, Becher, Münzen, Karten */
      for (const [dx, f] of [[-6, 4], [-3.6, 2]]) { B(c, dx, ty - 1.6, 1.6, 1.6, "#e8e0c8"); B(c, dx, ty - 1.6, 1.6, 0.4, "#fff8e8"); B(c, dx + 0.6, ty - 1, 0.35, 0.35, "#1a1214"); if (f > 2) { B(c, dx + 0.2, ty - 1.4, 0.3, 0.3, "#1a1214"); B(c, dx + 1.1, ty - 0.6, 0.3, 0.3, "#1a1214"); } }
      for (const [x, n] of [[-15, 4], [-12.5, 2], [8, 3]]) for (let k = 0; k < n; k++) { E(c, x, ty - 0.4 - k * 0.55, 1.3, 0.4, k % 2 ? "#c89a30" : "#e5c46a"); }
      E(c, 10.5, ty - 0.3, 1.2, 0.35, "#acaaa6");
      for (let k = 0; k < 4; k++) { c.save(); c.translate(1 + k * 1.2, ty - 0.4); c.rotate(-0.5 + k * 0.3); B(c, -1, -2.4, 2, 2.6, "#e8dcc0"); B(c, -0.7, -2, 1.4, 0.4, k % 2 ? "#a83030" : "#1a1214"); c.restore(); }
      P(c, "#8e8c8a", [-10.6, ty - 4.4, -7.8, ty - 4.4, -8, ty, -10.4, ty]); B(c, -10.6, ty - 4.4, 2.8, 0.4, "#b2b0ac"); c.strokeStyle = "#7e7c7a"; c.lineWidth = 0.5; c.beginPath(); c.arc(-7.6, ty - 2.4, 1.1, -1.4, 1.4); c.stroke();
      P(c, "#8e8c8a", [14, ty - 4, 16.6, ty - 4, 16.4, ty, 14.2, ty]); c.beginPath(); c.arc(16.8, ty - 2.2, 1, -1.4, 1.4); c.stroke();
      /* Kerzenstumpf in Halter mit Wachspfütze */
      E(c, -18, ty - 0.2, 2.2, 0.6, "#4a4446"); kerze(c, -18, ty - 0.4, 2.4, 1.5, "#d8c8a0"); E(c, -18, ty - 0.3, 2.6, 0.5, "rgba(232,220,192,.7)");
      /* Dolch in der Platte */
      c.save(); c.translate(11, ty + 0.5); c.rotate(0.25); metal(c, -0.5, -5, 1, 5, "#b2b0ac"); B(c, -1.8, -5.6, 3.6, 0.8, "#7a5a2a"); B(c, -0.5, -8.6, 1, 3, "#3a2a1a"); E(c, 0, -8.8, 0.7, 0.7, "#b8923a"); c.restore();
      if (v === 1) { kiste(c, -22, ty - 4, 3, 3, "#7a5432", R, { nobrace: true }); }
      if (v === 2) { brot(c, 19, ty, 3.6); B(c, 15.6, ty - 2, 2.4, 2, "#e0c060"); }
    }, fls: [[-18, -14.8, 0.5]], holeR: [-18, -14, 30, 0.4] },
    lesepult: { at: "f", w: 1, box: [-11, -30, 11, 3], s(c, R, v) {
      const col = "#4e2e18"; shadow(c, 0, 0.5, 8, 1.8, 0.45);
      P(c, sh(col, -0.2), [-5, 0, 5, 0, 3, -2, -3, -2]); drechsel(c, 0, -1.6, 15, 2.4, col, R);
      c.save(); c.translate(0, -18); c.rotate(-0.28); wood(c, -8, -1.2, 16, 2.4, col, R, false);
      /* aufgeschlagenes Buch */
      c.fillStyle = "#3a1a14"; c.fillRect(-7.4, -2.6, 14.8, 1.6);
      c.fillStyle = lg(c, -7, 0, 7, 0, ["#d8ccb0", "#efe6d0", "#c8b898", "#efe6d0", "#d8ccb0"]); c.beginPath(); c.moveTo(-7, -2.4); c.quadraticCurveTo(-3.5, -3.6, 0, -2.6); c.quadraticCurveTo(3.5, -3.6, 7, -2.4); c.lineTo(7, -1.4); c.lineTo(-7, -1.4); c.fill();
      for (let k = 0; k < 4; k++) { Ln(c, "rgba(60,40,30,.5)", 0.2, [-6, -1.9 - k * 0.2, -1, -2 - k * 0.2]); Ln(c, "rgba(60,40,30,.5)", 0.2, [1, -2 - k * 0.2, 6, -1.9 - k * 0.2]); }
      B(c, -0.25, -3, 0.5, 4, "#a8202a"); c.restore();
      /* Tintenfass mit Feder */
      E(c, 7, -15.4, 1.3, 0.5, "#1a1214"); B(c, 5.9, -17.4, 2.2, 2, "#2a2228"); Q(c, "#e8e0d0", 0.5, 7, -17.4, 8, -21, 10, -23.5); Q(c, "rgba(230,220,200,.6)", 1, 8.2, -19.5, 9, -21.6, 10, -23.5);
      kerze(c, -7, -19.6, 3.4, 1.2); B(c, -8.3, -20, 2.6, 0.6, "#c8a040");
    }, fls: [[-7, -23.4, 0.5]], holeR: [-4, -22, 28, 0.35] },
    kerzenstaender: { at: "f", w: 1, box: [-10, -40, 10, 3], s(c, R, v) {
      const col = "#b8923a"; shadow(c, 0, 0.5, 7, 1.6, 0.45);
      P(c, sh(col, -0.25), [-6, 0, 6, 0, 2, -2.4, -2, -2.4]); for (const dx of [-5, 5]) E(c, dx, -0.4, 1.4, 0.8, sh(col, -0.1));
      metal(c, -0.8, -26, 1.6, 24, col); for (const y of [-8, -16, -24]) E(c, 0, y, 1.6, 0.7, sh(col, 0.15));
      c.strokeStyle = col; c.lineWidth = 0.9; c.beginPath(); c.moveTo(-6.5, -29); c.quadraticCurveTo(-6.5, -25, 0, -25); c.quadraticCurveTo(6.5, -25, 6.5, -29); c.stroke();
      for (const dx of [-6.5, 0, 6.5]) { const y = dx ? -29 : -30.5; B(c, dx - 1.6, y, 3.2, 0.8, sh(col, 0.1)); kerze(c, dx, y, dx ? 4 : 5, 1.3); c.fillStyle = "rgba(232,220,192,.8)"; c.fillRect(dx - 0.3, y, 0.6, 1.6); }
    }, fls: [[-6.5, -33.6, 0.6], [0, -36.2, 0.65], [6.5, -33.6, 0.6]], holeR: [0, -32, 44, 0.55] },
    truhe: { at: "f", w: 2, box: [-14, -18, 14, 3], s(c, R, v) {
      const col = "#6a3a22"; shadow(c, 0, 0.5, 13, 2, 0.5);
      wood(c, -11, -9, 22, 9, col, R, false); B(c, -11, -9, 22, 0.5, "rgba(0,0,0,.3)");
      if (v === 2) { c.fillStyle = sh(col, -0.45); c.fillRect(-10, -10, 20, 1.4); c.save(); c.translate(-11, -9); c.rotate(-1.9); wood(c, 0, -1.6, 9, 3, col, R, false); c.restore(); c.fillStyle = "#6a2a4a"; c.beginPath(); c.moveTo(-6, -9); c.quadraticCurveTo(0, -12, 4, -9.5); c.quadraticCurveTo(9, -6, 12, -1); c.lineTo(9, -0.4); c.quadraticCurveTo(6, -6, 0, -9); c.fill(); B(c, 9.6, -1.2, 3, 0.6, "#c89a40"); }
      else { c.fillStyle = lg(c, 0, -15, 0, -9, [sh(col, 0.2), col]); c.beginPath(); c.moveTo(-11.5, -9); c.lineTo(-11.5, -12); c.quadraticCurveTo(0, -16.5, 11.5, -12); c.lineTo(11.5, -9); c.fill(); for (let k = -9; k < 10; k += 3.2) Ln(c, "rgba(30,14,6,.35)", 0.25, [k, -14.5, k, -9]); }
      for (const x of [-8.5, 7.5]) { band(c, x, -9, 1.2, 9); if (v !== 2) { c.fillStyle = "#4a4446"; c.beginPath(); c.moveTo(x, -9); c.lineTo(x, -12.5); c.quadraticCurveTo(x + 0.6, -13.4, x + 1.2, -12.5); c.lineTo(x + 1.2, -9); c.fill(); } }
      band(c, -11, -1.6, 22, 1); metal(c, -1.6, -10, 3.2, 3.6, "#b8923a"); B(c, -0.3, -8.4, 0.6, 1.2, "#1a1214");
      if (v === 0) { c.fillStyle = "#7a1a20"; c.beginPath(); c.moveTo(-12, -11.6); c.quadraticCurveTo(-4, -15.6, 2, -14.4); c.lineTo(3, -12); c.lineTo(-1, -5); c.lineTo(-6, -7); c.lineTo(-12, -6); c.fill(); B(c, -12, -6.4, 6, 0.5, "#c89a40"); }
      if (v === 1) { kerze(c, 5, -13.8, 3, 1.2); E(c, 5, -13.8, 1.6, 0.4, "#e8dcc0"); }
      wear(c, -11, -9, 22, 9, R, 5);
    }, fls: [[5, -17.6, 0.45, 1]] },
    teppich: { at: "f", w: 4, box: [-32, -3, 32, 2], s(c, R, v) {
      const cols = [["#7a1a20", "#c8a040"], ["#3a5a2a", "#d8b860"], ["#5a2a5a", "#c88a40"]][v];
      c.fillStyle = lg(c, 0, -1.6, 0, 0.6, [sh(cols[0], 0.2), cols[0], sh(cols[0], -0.4)]); c.fillRect(-28, -1.6, 56, 2);
      for (let k = -26; k < 26; k += 4) { B(c, k, -1.3, 1.6, 0.5, cols[1]); B(c, k + 2, -0.7, 1.2, 0.4, sh(cols[1], -0.3)); }
      B(c, -28, -1.7, 56, 0.35, sh(cols[1], -0.2)); for (const sd of [-1, 1]) for (let k = 0; k < 5; k++) B(c, sd * 28 + (sd < 0 ? -1.4 : 0), -1.4 + k * 0.4, 1.4, 0.2, cols[1]);
      B(c, 6, -1.7, 4, 0.5, sh(cols[0], -0.35));
    } },
    /* ---------- Torhof ---------- */
    karren: { at: "f", w: 3, box: [-32, -32, 32, 4], s(c, R, v) {
      const col = "#6a4428"; shadow(c, 0, 0.5, 26, 2.4, 0.5);
      c.save(); c.translate(17, -6); c.rotate(-0.18); wood(c, 0, -1, 14, 1.8, sh(col, -0.1), R, false); wood(c, 0, 1.6, 14, 1.4, sh(col, -0.3), R, false); c.restore();
      wood(c, -22, -12, 40, 2.6, sh(col, -0.15), R, false);
      for (let k = 0; k < 3; k++) wood(c, -23, -20 + k * 2.7, 42, 2.5, sh(col, (R() - 0.5) * 0.15), R, false);
      for (const x of [-22, -3, 16]) wood(c, x, -21, 2, 10, sh(col, -0.25), R, true);
      if (v === 0) { for (let k = 0; k < 3; k++) sack(c, -14 + k * 9, -20, 0.7, k === 1 ? "#a89070" : "#b8a080", R); }
      else if (v === 1) { E(c, -2, -22, 20, 6, "#b8984a"); for (let k = 0; k < 40; k++) { const a = R() * PI, rx = -2 + Math.cos(a) * 18 * R(), ry = -22 - Math.sin(a) * 5 * R(); Ln(c, R() < 0.5 ? "#d8b860" : "#8a7030", 0.35, [rx, ry, rx + (R() - 0.5) * 5, ry - R() * 2]); } }
      else { for (let k = 0; k < 7; k++) { const px = -16 + k * 5 + R(), py = -22 - (k % 2) * 2.4; E(c, px, py, 2.8, 2.3, "#c8701a"); for (let q = -1; q <= 1; q++) Ln(c, "rgba(90,40,10,.5)", 0.3, [px + q, py - 2.2, px + q * 1.4, py + 2]); B(c, px - 0.3, py - 3, 0.6, 1, "#4a5a2a"); } }
      for (const wx of [-13, 9]) {
        E(c, wx, -6.5, 6.6, 6.6, "#3a2414"); E(c, wx, -6.5, 5.6, 5.6, "rgba(0,0,0,0)");
        c.strokeStyle = "#4a4446"; c.lineWidth = 1; c.beginPath(); c.arc(wx, -6.5, 6.4, 0, TAU); c.stroke(); c.strokeStyle = "rgba(255,240,220,.3)"; c.lineWidth = 0.35; c.beginPath(); c.arc(wx, -6.5, 6.6, PI * 1.1, PI * 1.6); c.stroke();
        c.strokeStyle = "#5a3820"; c.lineWidth = 1.1; c.beginPath(); c.arc(wx, -6.5, 5.4, 0, TAU); c.stroke();
        for (let k = 0; k < 6; k++) { const a = k / 6 * PI + 0.2; c.lineWidth = 0.8; c.strokeStyle = "#5a3820"; c.beginPath(); c.moveTo(wx + Math.cos(a) * 5, -6.5 + Math.sin(a) * 5); c.lineTo(wx - Math.cos(a) * 5, -6.5 - Math.sin(a) * 5); c.stroke(); }
        E(c, wx, -6.5, 1.5, 1.5, "#3a3436"); rivet(c, wx, -6.5, 0.6);
      }
    } },
    heu: { at: "f", w: 2, box: [-16, -26, 16, 3], s(c, R, v) {
      shadow(c, 0, 0.5, 14, 2, 0.4);
      c.fillStyle = lg(c, 0, -14, 0, 0, ["#e0c070", "#b8984a", "#7a6028"]); c.beginPath(); c.moveTo(-13, 0); c.bezierCurveTo(-14, -9, -6, -14, 0, -14); c.bezierCurveTo(6, -14, 14, -9, 13, 0); c.fill();
      for (let k = 0; k < 70; k++) { const a = R() * PI, r = R(), x = Math.cos(a) * 12 * r, y = -Math.sin(a) * 13 * r; Ln(c, R() < 0.4 ? "#f0d890" : R() < 0.5 ? "#a8883a" : "#6a5020", 0.3, [x, y, x + (R() - 0.5) * 6, y + (R() - 0.3) * 3]); }
      for (let k = 0; k < 8; k++) { const x = -12 + R() * 24; Ln(c, "#d8b860", 0.3, [x, 0, x + (R() - 0.5) * 6, 1.4]); }
      if (v !== 1) { c.save(); c.translate(7, -12); c.rotate(0.35); wood(c, -0.5, -13, 1, 17, "#6a4a28", R, true); metal(c, -2.4, 4, 4.8, 0.7, "#6a6668"); for (const dx of [-2.2, 0, 2.2]) metal(c, dx - 0.3, 4.4, 0.6, 4, "#8a8688"); c.restore(); }
      if (v === 2) { E(c, -8, -2, 3, 2, "#c8b090"); }
    } },
    waffenstaender: { at: "f", w: 2, box: [-14, -34, 14, 3], s(c, R, v) {
      const col = "#5a3a22"; shadow(c, 0, 0.5, 12, 2, 0.45);
      wood(c, -11, -1.6, 22, 1.6, sh(col, -0.2), R, false); wood(c, -10, -20, 1.8, 20, col, R, true); wood(c, 8.2, -20, 1.8, 20, col, R, true); wood(c, -11, -21, 22, 2, col, R, false); wood(c, -10, -9, 20, 1.2, sh(col, -0.1), R, false);
      for (let k = 0; k < 4; k++) { const wx = -6 + k * 4; B(c, wx - 0.6, -20.6, 1.2, 0.8, "#1a1210"); }
      /* Speer, Schwert, Hellebarde, Axt */
      wood(c, -6.6, -30, 1.1, 30, "#6a4a2a", R, true); P(c, "#b2b0ac", [-6.1, -34, -7.6, -29.6, -6.1, -28.4, -4.6, -29.6]); B(c, -6.1, -33.4, 0.35, 4, "rgba(255,255,255,.5)");
      metal(c, -2.6, -26, 1.4, 17, "#a8a8b2"); B(c, -2.3, -25.5, 0.3, 15, "rgba(255,255,255,.55)"); B(c, -4.2, -9.4, 4.6, 1, "#7a5a2a"); B(c, -2.4, -9, 1, 4, "#3a2414"); E(c, -1.9, -4.6, 0.8, 0.8, "#b8923a");
      wood(c, 1.4, -31, 1.1, 31, "#5a3a22", R, true); P(c, "#9e9c98", [2.5, -30, 6, -28, 6.4, -24, 2.5, -25]); P(c, "#8a8a92", [1.4, -29, -0.4, -28, 1.4, -27]); B(c, 1.6, -33.4, 0.7, 3.4, "#9e9c98");
      wood(c, 5.4, -22, 1, 22, "#6a4a2a", R, true); P(c, "#9e9c98", [6.4, -22, 9.6, -24, 10, -18, 6.4, -18.6]); Ln(c, "rgba(255,255,255,.4)", 0.3, [9.6, -23.6, 10, -18.4]);
      if (v > 0) { E(c, -12, -6, 4, 6, v === 1 ? "#7a1a20" : "#3a5a2a"); c.strokeStyle = "#c8b080"; c.lineWidth = 0.6; c.beginPath(); c.ellipse(-12, -6, 4, 6, 0, 0, TAU); c.stroke(); E(c, -12, -6, 1.2, 1.2, "#c8a040"); }
    } },
    faesser: { at: "f", w: 2, box: [-15, -30, 15, 4], s(c, R, v) {
      shadow(c, 0, 0.5, 14, 2.2, 0.5);
      fass(c, -6.2, 0, 12, 13, "#6a4428", R); fass(c, 6.2, 0, 12, 13, "#5e3c22", R);
      if (v === 0) fass(c, 0, -13, 11, 12, "#7a5030", R); else if (v === 1) { fass(c, 0, -13, 11, 12, "#6a4428", R, "#2a1a10"); E(c, 0, -24.7, 3, 0.5, "rgba(255,240,200,.12)"); } else { sack(c, 0, -13, 0.65, "#b8a080", R); }
      B(c, -9, -6, 2.6, 2.6, "rgba(230,220,200,.22)"); P(c, "rgba(230,220,200,.22)", [6, -9, 8, -5, 4, -5]);
    } },
    kisten: { at: "f", w: 2, box: [-15, -26, 15, 3], s(c, R, v) {
      shadow(c, 0, 0.5, 14, 2, 0.5);
      kiste(c, -12, -11, 12, 11, "#7a5432", R); kiste(c, 0.6, -9, 10, 9, "#6a4428", R); kiste(c, -7, -20, 9, 9, "#80583a", R, { nobrace: true });
      seil(c, [-12, -6, -6, -5.6, 0, -6], "#a08050", 0.6);
      c.fillStyle = "rgba(20,12,6,.45)"; c.font = "bold 3px 'Alegreya Sans',sans-serif"; c.fillText(v === 0 ? "X" : v === 1 ? "O" : "†", -3.6, -13);
      if (v === 2) { flasche(c, 6, -9, 5, "#2a4a2a", R); }
      if (v === 1) sack(c, 6, -9, 0.45, "#a89070", R);
    } },
    brunnen: { at: "f", w: 3, box: [-22, -46, 22, 4], s(c, R, v) {
      shadow(c, 0, 0.5, 18, 2.4, 0.5);
      for (let r = 0; r < 3; r++) for (let k = 0; k < 4; k++) { const x = -15 + k * 7.5 + (r % 2) * 3.7, w = Math.min(7.2, 15 - x); if (x >= 15) continue; stein(c, [x, -10 + r * 3.4, x + w, -10 + r * 3.4, x + w, -6.8 + r * 3.4, x, -6.8 + r * 3.4], "#6a6068", R); }
      B(c, -16, -11.2, 32, 1.6, "#7a7078"); B(c, -16, -11.2, 32, 0.4, "rgba(255,240,220,.25)"); for (let k = 0; k < 6; k++) E(c, -14 + R() * 28, -1 - R() * 9, 1.4, 0.8, "#3a5a2a");
      wood(c, -14, -34, 2.2, 23, "#5a3a22", R, true); wood(c, 11.8, -34, 2.2, 23, "#5a3a22", R, true);
      wood(c, -13, -27, 26, 1.6, "#6a4428", R, false); E(c, 0, -26.2, 2.4, 2.4, "#5a3a22"); seil(c, [0, -24, 0, -16], "#a08050", 0.5);
      c.strokeStyle = "#4a4446"; c.lineWidth = 0.7; c.beginPath(); c.moveTo(14, -26.2); c.lineTo(17, -26.2); c.lineTo(17, -22); c.stroke();
      fass(c, 0, -12.6, 5, 4.2, "#6a4a2c", R);
      c.fillStyle = lg(c, 0, -44, 0, -32, ["#8a3a2a", "#5a2018"]); c.beginPath(); c.moveTo(-18, -32); c.lineTo(0, -43); c.lineTo(18, -32); c.lineTo(16, -31); c.lineTo(0, -41); c.lineTo(-16, -31); c.fill();
      for (let k = 0; k < 6; k++) { const u = k / 6; Ln(c, "rgba(30,10,6,.5)", 0.3, [-18 + u * 18, -32 - u * 11, -16 + u * 16, -31 - u * 10]); Ln(c, "rgba(30,10,6,.5)", 0.3, [18 - u * 18, -32 - u * 11, 16 - u * 16, -31 - u * 10]); }
      P(c, "#6a2a1e", [-18, -32, 0, -43, 0, -41.2, -16.6, -31]); Ln(c, "rgba(255,200,160,.25)", 0.4, [-18, -32, 0, -43]);
    } },
    hackklotz: { at: "f", w: 2, box: [-15, -22, 15, 3], s(c, R, v) {
      shadow(c, 0, 0.5, 13, 2, 0.45);
      c.fillStyle = lg(c, -6, 0, 6, 0, ["#8a6a44", "#6a4a2c", "#3a2414"]); c.fillRect(-5, -9, 10, 9); for (let k = -4; k < 5; k += 1.6) Ln(c, "rgba(30,14,6,.4)", 0.3, [k, -9, k + 0.3, 0]);
      E(c, 0, -9, 5, 1.4, "#b8946a"); for (let r = 1; r < 5; r += 1.1) { c.strokeStyle = "rgba(90,60,30,.5)"; c.lineWidth = 0.2; c.beginPath(); c.ellipse(0, -9, r, r * 0.28, 0, 0, TAU); c.stroke(); } Ln(c, "rgba(60,40,20,.6)", 0.3, [-3, -9.3, 2, -8.5]);
      c.save(); c.translate(1, -9.5); c.rotate(-0.5); wood(c, -0.6, -11, 1.2, 11, "#7a5a32", R, true); metal(c, -3.6, -1, 5, 2.6, "#7a7678"); B(c, -3.6, 1.4, 5, 0.5, "#c8c8cc"); c.restore();
      for (let k = 0; k < 9; k++) { const x = -13 + R() * 26; if (Math.abs(x) < 6) continue; P(c, R() < 0.5 ? "#c8a070" : "#9a7a50", [x, 0, x + 1.4, -0.6, x + 2, 0]); }
      for (const [x, a] of [[-10, 0.2], [9, -0.3]]) { c.save(); c.translate(x, -1.6); c.rotate(a); c.fillStyle = "#6a4a2c"; c.beginPath(); c.moveTo(-3, 1.6); c.lineTo(3, 1.6); c.lineTo(2.4, -1.6); c.arc(0, -1.6, 2.4, 0, PI, true); c.fill(); E(c, 0, -1.6, 2.4, 0.7, "#b8946a"); c.restore(); }
    } },
    holzstapel: { at: "f", w: 2, box: [-15, -20, 15, 3], s(c, R, v) {
      shadow(c, 0, 0.5, 14, 2, 0.45);
      const rows = [[6, 0], [5, 1], [4, 2], [v === 2 ? 2 : 3, 3]];
      for (const [n, r] of rows) for (let k = 0; k < n; k++) { const x = -12 + r * 2.2 + k * 4.4 + (R() - 0.5) * 0.5, y = -2.1 - r * 3.9, rr = 1.9 + R() * 0.4;
        E(c, x, y, rr + 0.3, rr + 0.3, "#3a2618"); E(c, x, y, rr, rr, rg(c, x - 0.6, y - 0.6, rr * 1.4, ["#d8b080", "#b08a5a", "#7a5a34"]));
        c.strokeStyle = "rgba(90,60,30,.5)"; c.lineWidth = 0.18; for (let q = 0.5; q < rr; q += 0.6) { c.beginPath(); c.arc(x + 0.1, y + 0.1, q, 0, TAU); c.stroke(); } Ln(c, "rgba(60,30,10,.6)", 0.25, [x, y, x + rr * 0.8, y - rr * 0.3]); }
      if (v === 1) { c.save(); c.translate(11, -12); c.rotate(0.5); wood(c, -0.5, -4, 1, 14, "#7a5a32", R, true); c.restore(); }
    } },
    trog: { at: "f", w: 2, box: [-15, -12, 15, 3], s(c, R, v) {
      shadow(c, 0, 0.5, 14, 2, 0.45);
      for (const x of [-11, 9]) wood(c, x, -3, 2, 3, "#4a2e1a", R, true);
      c.fillStyle = "#4a3020"; c.beginPath(); c.moveTo(-13, -9); c.lineTo(13, -9); c.lineTo(11, -2.6); c.lineTo(-11, -2.6); c.fill();
      wood(c, -13.4, -9.6, 26.8, 1.8, "#6a4428", R, false); for (let k = 0; k < 3; k++) wood(c, -12.6 + k * 0.6, -7.6 + k * 1.6, 25.2 - k * 1.2, 1.6, sh("#5a3a22", -k * 0.08), R, false);
      E(c, 0, -9.3, 12.4, 0.9, "#2e3426"); B(c, -8, -9.6, 7, 0.3, "rgba(230,240,210,.35)");
      for (let k = 0; k < 6; k++) Ln(c, "#c8a860", 0.35, [-12 + R() * 4, -9.4, -14 + R() * 4, -6]);
      band(c, -13, -6, 26, 0.8);
    }, a(c, p, t) { const u = (t * 0.6 + p.s * 5) % 1; c.strokeStyle = "rgba(230,240,210," + 0.35 * (1 - u) + ")"; c.lineWidth = 0.25; c.beginPath(); c.ellipse(2 + p.s * 4, -9.3, 1 + u * 5, 0.25 + u * 0.4, 0, 0, TAU); c.stroke(); } },
    zielscheibe: { at: "f", w: 2, box: [-14, -32, 14, 3], s(c, R, v) {
      shadow(c, 0, 0.5, 11, 1.8, 0.45);
      c.save(); c.translate(-6, 0); c.rotate(0.22); wood(c, -0.8, -26, 1.6, 26, "#5a3a22", R, true); c.restore(); c.save(); c.translate(6, 0); c.rotate(-0.22); wood(c, -0.8, -26, 1.6, 26, "#5a3a22", R, true); c.restore(); c.save(); c.translate(0, 0); c.rotate(0.05); wood(c, -0.7, -20, 1.4, 20, "#4a2e1a", R, true); c.restore();
      const cy = -18; E(c, 0, cy, 10.5, 10.5, "#8a7040"); for (let k = 0; k < 40; k++) { const a = R() * TAU, r = 9.5 + R(); Ln(c, "#c8a860", 0.35, [Math.cos(a) * r, cy + Math.sin(a) * r, Math.cos(a + 0.2) * r, cy + Math.sin(a + 0.2) * r]); }
      for (const [r, col] of [[9, "#e0d4b0"], [7, "#a8302a"], [5, "#e0d4b0"], [3, "#a8302a"], [1.3, "#e8c040"]]) E(c, 0, cy, r, r, col);
      E(c, -3, cy - 3, 4, 3, "rgba(255,240,210,.12)");
      const arrows = v === 0 ? [[1, -1, -0.3], [-3, 2, 0.2], [4, 4, -0.1]] : v === 1 ? [[0.4, 0.3, 0.1], [-0.6, -0.5, -0.2]] : [[6, -5, 0.3], [-7, 6, -0.2], [2, 7, 0.4], [-2, -6, 0]];
      for (const [ax, ay, a] of arrows) { c.save(); c.translate(ax, cy + ay); c.rotate(a + PI); Ln(c, "#6a5030", 0.6, [0, 0, 8, 0]); P(c, "#e8e0d0", [6, 0, 8.6, -1.4, 9, -1.2, 7.6, 0]); P(c, "#a83030", [6, 0, 8.6, 1.4, 9, 1.2, 7.6, 0]); c.restore(); }
    } },
    apfelkorb: { at: "f", w: 1, box: [-10, -14, 10, 3], s(c, R, v) {
      shadow(c, 0, 0.5, 8, 1.6, 0.45);
      const cols = [["#a8302a", "#c84a2a", "#8a2020"], ["#b8a030", "#a0b030", "#c8a040"], ["#c8701a", "#a8302a", "#d8a040"]][v];
      for (let k = 0; k < 9; k++) apfel(c, -4.5 + (k % 4) * 3 + (k > 3 ? 1.5 : 0), -7.6 - (k > 3 ? 2.2 : 0) - (k > 7 ? 2 : 0), 1.5, cols[k % 3]);
      c.fillStyle = "#8a6030"; c.beginPath(); c.moveTo(-7, -7.4); c.lineTo(7, -7.4); c.lineTo(5.4, 0); c.lineTo(-5.4, 0); c.fill();
      for (let r = 0; r < 4; r++) for (let k = 0; k < 7; k++) E(c, -6 + k * 2 + (r % 2) * 1 - r * 0.2 * (k < 3 ? -1 : 1), -6.4 + r * 1.8, 0.9, 0.55, r % 2 ? "#a07038" : "#b8844a");
      B(c, -7.2, -7.8, 14.4, 0.9, "#6a4422"); c.strokeStyle = "#6a4422"; c.lineWidth = 0.8; c.beginPath(); c.moveTo(-5, -7.6); c.quadraticCurveTo(0, -14, 5, -7.6); c.stroke();
      apfel(c, 8.6, -1.4, 1.4, cols[0]);
    } },
    eimer: { at: "f", w: 1, box: [-7, -12, 7, 3], s(c, R, v) {
      shadow(c, 0, 0.5, 5, 1.2, 0.45);
      c.fillStyle = lg(c, -4, 0, 4, 0, ["#7a5a3a", "#5a4028", "#3a2818"]); c.beginPath(); c.moveTo(-4, -8); c.lineTo(4, -8); c.lineTo(3.2, 0); c.lineTo(-3.2, 0); c.fill();
      for (let k = -3; k <= 3; k += 1.5) Ln(c, "rgba(20,10,4,.4)", 0.25, [k, -8, k * 0.82, 0]);
      band(c, -3.9, -6.6, 7.8, 0.8); band(c, -3.4, -2.2, 6.8, 0.8);
      E(c, 0, -8, 4, 0.8, "#2a1a10"); if (v !== 2) E(c, 0, -7.7, 3.4, 0.5, v === 0 ? "#3a4232" : "#4a3020");
      c.strokeStyle = "#4a4446"; c.lineWidth = 0.5; c.beginPath(); c.arc(0, -8, 4, PI, 0); c.stroke();
      if (v === 1) { c.save(); c.translate(1, -8); c.rotate(0.6); wood(c, -0.3, -7, 0.6, 7, "#8a6a40", R, true); E(c, 0, 0.4, 1.4, 0.8, "#6a4a2a"); c.restore(); }
    } },
    /* ---------- Wand (allgemein / Torhof) ---------- */
    schild: { at: "w", box: [-16, -42, 16, -4], s(c, R, v) {
      const col = ["#7a1a20", "#2a4a2a", "#c8a040"][v];
      for (const a of [-0.75, 0.75]) { c.save(); c.translate(0, -20); c.rotate(a); wood(c, -0.5, -16, 1, 30, "#6a4a2a", R, true); P(c, "#b2b0ac", [0, -20, -1.6, -15.6, 0, -14.4, 1.6, -15.6]); c.restore(); }
      c.fillStyle = "rgba(0,0,0,.3)"; c.beginPath(); c.moveTo(-6, -27); c.lineTo(8, -27); c.lineTo(8, -19); c.quadraticCurveTo(1, -10, -6, -19); c.fill();
      c.fillStyle = lg(c, -7, -28, 7, -12, [sh(col, 0.25), col, sh(col, -0.45)]); c.beginPath(); c.moveTo(-7, -28); c.lineTo(7, -28); c.lineTo(7, -20); c.quadraticCurveTo(0, -11, -7, -20); c.closePath(); c.fill();
      c.strokeStyle = "#c8b080"; c.lineWidth = 0.9; c.stroke(); c.strokeStyle = "rgba(255,240,200,.4)"; c.lineWidth = 0.3; c.beginPath(); c.moveTo(-6.4, -27.4); c.lineTo(6.4, -27.4); c.stroke();
      const em = v === 2 ? "#5a2a1a" : "#e8d8a0";
      if (v === 0) { B(c, -0.7, -27, 1.4, 13, em); B(c, -5, -23, 10, 1.4, em); }
      else if (v === 1) { c.fillStyle = em; c.beginPath(); c.moveTo(0, -25.5); c.lineTo(3, -20); c.lineTo(0, -16); c.lineTo(-3, -20); c.fill(); E(c, 0, -20.4, 1, 1, sh(col, -0.3)); }
      else { for (let k = 0; k < 3; k++) { P(c, em, [-5 + k * 3.4, -25, -3.4 + k * 3.4, -23, -5 + k * 3.4 + 3.2, -25]); } B(c, -6.4, -21, 12.8, 1.2, em); }
      wear(c, -7, -28, 14, 14, R, 6); for (const [x, y] of [[-5.5, -26.5], [5.5, -26.5]]) rivet(c, x, y, 0.45);
    } },
    wandlaterne: { at: "w", box: [-10, -42, 10, -6], s(c, R, v) {
      metal(c, -1, -36, 2, 6, "#3a3436"); c.strokeStyle = "#3a3436"; c.lineWidth = 0.9; c.beginPath(); c.moveTo(0, -33); c.lineTo(5, -33); c.quadraticCurveTo(7, -33, 7, -30); c.stroke(); B(c, -1.6, -37, 3.2, 1, "#2a2426"); rivet(c, 0, -35, 0.4); rivet(c, 0, -31, 0.4);
    }, a(c, p, t) {
      const sw = Math.sin(t * 1.4 + p.s * 9) * 0.06; c.save(); c.translate(7, -30); c.rotate(sw);
      Ln(c, "#2a2426", 0.4, [0, 0, 0, 2]); P(c, "#2e2628", [-3.4, 3, 0, 1.2, 3.4, 3]); B(c, -3, 3, 6, 0.8, "#3a3032");
      c.fillStyle = "rgba(255,200,110,.9)"; c.fillRect(-2.4, 3.8, 4.8, 6); B(c, -2.4, 3.8, 4.8, 6, "rgba(255,240,200,.25)");
      for (const gx of [-2.6, -0.3, 2]) B(c, gx, 3.6, 0.6, 6.6, "#2a2224"); B(c, -2.8, 6.6, 5.6, 0.5, "#2a2224");
      P(c, "#2e2628", [-3, 10, 3, 10, 1.6, 11.4, -1.6, 11.4]); c.restore();
      fl(7, -23, 0.5, p.s * 30); hole(7, -24, 34, 0.45);
    } },
    steckbrief: { at: "w", nv: 3, box: [-10, -40, 10, -12], s(c, R, v) {
      c.save(); c.rotate((v - 1) * 0.05);
      c.fillStyle = "rgba(0,0,0,.3)"; c.fillRect(-6.4, -34.4, 13.4, 17.4);
      c.fillStyle = lg(c, -7, -35, 7, -17, ["#e8d8b0", "#d0bc90", "#b09a70"]); c.beginPath(); c.moveTo(-7, -35); c.lineTo(7, -35); c.lineTo(6.6, -18); c.lineTo(4, -17.4); c.lineTo(3, -18.6); c.lineTo(-7, -18); c.closePath(); c.fill();
      for (let k = 0; k < 4; k++) B(c, -5.6, -33.6 + k * 0.4, 11, 0.25, "rgba(60,30,20,.08)");
      B(c, -5, -33.4, 10, 1.6, "#5a1a14"); /* Kopfzeile */
      c.fillStyle = "#3a2a1a"; c.beginPath(); c.ellipse(0, -27.4, 2.6, 3, 0, 0, TAU); c.fill(); c.fillStyle = "#d8c8a0"; c.beginPath(); c.ellipse(0, -27.2, 2, 2.5, 0, 0, TAU); c.fill();
      if (v === 0) { P(c, "#2a1a14", [-2.8, -28.6, 0, -33, 2.8, -28.6]); P(c, "#2a1a14", [-2.2, -31, -4, -33.6, -1.4, -31.6]); P(c, "#2a1a14", [2.2, -31, 4, -33.6, 1.4, -31.6]); }
      else if (v === 1) { B(c, -2.4, -29.6, 4.8, 1, "#3a2a1a"); Ln(c, "#3a2a1a", 0.4, [-1.6, -26, 1.6, -26]); }
      else { P(c, "#5a3a2a", [-2.6, -27, -2.2, -24.2, 2.2, -24.2, 2.6, -27, 0, -25.6]); }
      B(c, -1.2, -27.8, 0.6, 0.6, "#2a1a14"); B(c, 0.6, -27.8, 0.6, 0.6, "#2a1a14");
      Ln(c, "#3a2a1a", 0.3, [-5, -23, -5, -21.4, -4, -21.4]); for (let k = 0; k < 3; k++) B(c, -5, -22.6 + k * 1.3, 10 - k * 2.4, 0.4, "rgba(60,40,30,.55)");
      E(c, 4, -19.8, 1.4, 1.4, "#c89a30"); E(c, 4, -19.8, 0.8, 0.8, "#e5c46a");
      B(c, -0.4, -35.4, 0.8, 0.8, "#4a4446"); rivet(c, 0, -35, 0.45);
      c.restore();
    } },
    hufeisen: { at: "w", box: [-14, -36, 14, -14], s(c, R, v) {
      for (let k = 0; k < 3; k++) { const x = -8 + k * 8, y = -26 + (k % 2) * 3, up = k !== 1 || v === 0;
        rivet(c, x, y - 4, 0.5); c.strokeStyle = "#5a5456"; c.lineWidth = 1.5; c.beginPath(); if (up) c.arc(x, y, 3, PI * 0.1, PI * 0.9, true); else c.arc(x, y - 2, 3, PI * 1.1, PI * 1.9, true); c.stroke();
        c.strokeStyle = "rgba(255,240,220,.3)"; c.lineWidth = 0.35; c.beginPath(); if (up) c.arc(x, y, 3.5, PI * 1.2, PI * 1.6); else c.arc(x, y - 2, 3.5, PI * 1.2, PI * 1.6); c.stroke();
        for (let q = 0; q < 3; q++) B(c, x - 3 + q * 3 - 0.2, (up ? y + 0.3 : y - 2.6), 0.4, 0.4, "#1a1214"); }
      if (v === 2) { c.strokeStyle = "#a08050"; c.lineWidth = 0.6; c.beginPath(); c.moveTo(-10, -32); c.quadraticCurveTo(0, -29, 10, -32); c.stroke(); }
    } },
    werkzeugbrett: { at: "w", box: [-18, -44, 18, -6], s(c, R, v) {
      wood(c, -15, -38, 30, 2.6, "#5a3a22", R, false); for (const x of [-12, -4, 4, 12]) { B(c, x - 0.5, -36.8, 1, 2, "#3a2414"); rivet(c, x, -37, 0.4); }
      /* Rechen, Schaufel, Mistgabel, Sichel */
      wood(c, -12.5, -36, 1, 26, "#7a5a32", R, true); metal(c, -16, -12, 8, 1, "#6a6668"); for (let k = -15.5; k < -8; k += 1.3) B(c, k, -11, 0.4, 2.2, "#7a7678");
      wood(c, -4.5, -36, 1, 20, "#7a5a32", R, true); P(c, lg(c, -8, 0, -1, 0, ["#9a9698", "#5a5658"]), [-7.4, -16, -1.6, -16, -2, -9, -4, -7.6, -7, -9]);
      wood(c, 3.5, -36, 1, 20, "#6a4a28", R, true); metal(c, 1, -16, 6, 0.8, "#6a6668"); for (const dx of [1.2, 3.8, 6.4]) metal(c, dx - 0.2, -15.4, 0.5, 6, "#8a8688");
      c.strokeStyle = "#9a9698"; c.lineWidth = 0.9; c.beginPath(); c.arc(14, -28, 4.4, -PI * 0.6, PI * 0.5); c.stroke(); wood(c, 11.6, -24, 1.2, 6, "#6a4a28", R, true);
    } },
    /* ---------- Tiere ---------- */
    ratte: { at: "f", crit: true, run: true, noflip: true, w: 1, a(c, p, t) {
      const dt = Math.min(0.05, Math.max(0, t - (p.lt || t))); p.lt = t;
      if (p.rx == null) { p.rx = 0; p.dir = p.f; p.wait = 1 + p.s * 3; p.hide = 0; }
      const wx = cx0 + p.rx, wy = cy0;
      if (p.hide > 0) { p.hide -= dt; if (p.hide <= 0) { p.rx = p.dir > 0 ? p.rb : p.ra; p.dir = -p.dir; p.wait = 1; } return; }
      if (!p.flee && nahe(wx, wy - 6, 44)) { p.flee = true; p.wait = 0; p.dir = Z.player.x + Z.player.w / 2 > wx ? -1 : 1; }
      let moving = false;
      if (p.wait > 0) p.wait -= dt;
      else { moving = true; p.rx += p.dir * (p.flee ? 120 : 36) * dt;
        if (p.rx <= p.ra || p.rx >= p.rb) { p.rx = Math.max(p.ra, Math.min(p.rb, p.rx)); if (p.flee) { p.flee = false; p.hide = 5 + Math.random() * 6; return; } p.dir = -p.dir; p.wait = 1.5 + Math.random() * 3.5; }
        else if (!p.flee && Math.random() < dt * 0.5) p.wait = 0.5 + Math.random() * 1.6; }
      c.save(); c.translate(p.rx, 0); c.scale(p.dir, 1);
      const b = moving ? Math.abs(Math.sin(t * (p.flee ? 40 : 22))) * 0.7 : 0, sn = moving ? 0 : Math.sin(t * 18) * 0.25;
      E(c, 0, 0.2, 4.4, 0.8, "rgba(0,0,0,.35)");
      c.strokeStyle = "#a08078"; c.lineWidth = 0.45; c.beginPath(); c.moveTo(-3.4, -1.6); c.quadraticCurveTo(-7, -0.2 + Math.sin(t * 6 + p.s * 9) * 1.2, -9.5, -1.4 + Math.sin(t * 4 + p.s) * 0.8); c.stroke();
      E(c, -0.4, -2.3 - b, 3.6, 2.2, "#4a3e3a"); E(c, -0.8, -3.2 - b, 2.8, 1, "#6a5a52");
      E(c, 3.2, -2.6 - b + sn * 0.3, 1.9, 1.4, "#4e423e"); P(c, "#4e423e", [4.4, -3.4 - b, 6.2 + sn, -2.3 - b, 4.4, -1.6 - b]); E(c, 6.1 + sn, -2.3 - b, 0.45, 0.4, "#d88a8a");
      E(c, 2.8, -4 - b, 0.9, 1, "#5a4a46"); E(c, 2.8, -4 - b, 0.5, 0.6, "#c88a88"); E(c, 4, -3 - b, 0.42, 0.42, "#0a0606"); B(c, 3.9, -3.2 - b, 0.2, 0.2, "rgba(255,255,255,.8)");
      Ln(c, "rgba(220,210,200,.5)", 0.15, [6, -2.4 - b, 7.8, -3 - b]); Ln(c, "rgba(220,210,200,.5)", 0.15, [6, -2.2 - b, 7.8, -1.8 - b]);
      const lg2 = moving ? Math.sin(t * (p.flee ? 40 : 22)) * 1.2 : 0; B(c, -2.4 + lg2, -0.8, 0.8, 0.8, "#3a2e2a"); B(c, 1.6 - lg2, -0.8, 0.8, 0.8, "#3a2e2a");
      c.restore();
    } },
    katze: { at: "f", crit: true, noflip: true, w: 1, a(c, p, t) {
      if (p.gone && t < p.gone) return;
      if (p.panic) { const u = t - p.panic; if (u > 2.4 || u < 0) { p.gone = t + 18 + Math.random() * 15; p.panic = 0; p.kx = 0; return; } katzeFlucht(c, p, t, u); return; }
      const cols = [["#c07a3a", "#8a4a1a", "#e8b070"], ["#2a2426", "#141012", "#4a4244"], ["#8a8280", "#5a5250", "#c8c0b8"]][p.v];
      const wach = nahe(cx0, cy0 - 6, 56); p.aw = (p.aw || 0) + ((wach ? 1 : 0) - (p.aw || 0)) * 0.06; const aw = p.aw;
      const br = 1 + Math.sin(t * 1.8 + p.s * 9) * 0.04 * (1 - aw);
      c.save(); c.scale(p.f, 1);
      E(c, 0, 0.2, 7, 1.1, "rgba(0,0,0,.4)");
      const tw = Math.sin(t * 0.7 + p.s * 20) > 0.92 ? Math.sin(t * 20) * 1.2 : 0;
      c.strokeStyle = cols[0]; c.lineWidth = 1.6; c.lineCap = "round"; c.beginPath(); c.moveTo(-5, -1.4); c.quadraticCurveTo(-4, 1, 1, 0.2); c.quadraticCurveTo(4, -0.2, 5 + tw * 0.3, -1 + tw); c.stroke(); c.lineCap = "butt";
      E(c, -0.6, -3 * br, 5.6, 3 * br, cols[0]); E(c, -1.2, -4.4 * br, 4, 1.2, cols[2]);
      for (let k = 0; k < 4; k++) Ln(c, cols[1], 0.5, [-4 + k * 2, -5.6 * br, -3.4 + k * 2, -3.6 * br]);
      const hy = -3.4 - aw * 3.2, hx = 4 - aw * 0.6;
      E(c, hx, hy, 2.6, 2.2, cols[0]); P(c, cols[0], [hx - 2, hy - 1, hx - 1.4, hy - 3.6 - (Math.sin(t * 0.5 + p.s * 30) > 0.95 ? 0.6 : 0), hx - 0.2, hy - 1.6]); P(c, cols[0], [hx + 0.4, hy - 1.6, hx + 1.6, hy - 3.6, hx + 2.2, hy - 0.8]);
      P(c, "#c88a8a", [hx - 1.6, hy - 1.4, hx - 1.3, hy - 2.8, hx - 0.6, hy - 1.6]);
      E(c, hx + 1.8, hy + 0.6, 1, 0.8, cols[2]); E(c, hx + 2.5, hy + 0.3, 0.3, 0.25, "#d87a7a");
      if (aw > 0.5) { E(c, hx - 0.3, hy - 0.2, 0.55, 0.6, "#c8d84a"); E(c, hx + 1.3, hy - 0.2, 0.55, 0.6, "#c8d84a"); B(c, hx - 0.4, hy - 0.7, 0.2, 1, "#0a0806"); B(c, hx + 1.2, hy - 0.7, 0.2, 1, "#0a0806"); }
      else { Ln(c, "#140c0a", 0.3, [hx - 0.9, hy - 0.1, hx + 0.1, hy]); Ln(c, "#140c0a", 0.3, [hx + 0.8, hy, hx + 1.8, hy - 0.1]); }
      Ln(c, "rgba(240,230,220,.5)", 0.15, [hx + 2.2, hy + 0.8, hx + 4.4, hy + 0.2]); Ln(c, "rgba(240,230,220,.5)", 0.15, [hx + 2.2, hy + 1, hx + 4.4, hy + 1.4]);
      E(c, 3.4, -0.6, 1.4, 0.7, cols[0]); E(c, 4.2, -0.5, 0.7, 0.5, cols[2]);
      c.restore();
      if (aw < 0.2 && rich()) { for (let k = 0; k < 2; k++) { const u = (t * 0.25 + p.s + k * 0.5) % 1, zs = 0.8 + u * 0.9, zx = p.f * 3 + u * 3 + k * 1.2, zy = -8 - u * 8; c.globalAlpha = Math.sin(u * PI) * 0.7; Ln(c, "#e8e0d0", 0.3, [zx, zy, zx + zs, zy, zx, zy + zs, zx + zs, zy + zs]); } c.globalAlpha = 1; }
    } },
    huhn: { at: "f", crit: true, noflip: true, w: 1, a(c, p, t) {
      const cols = [["#e8e0d0", "#c8c0b0"], ["#a8642a", "#7a4418"], ["#2a2426", "#4a4244"]][p.v];
      const dt = Math.min(0.05, Math.max(0, t - (p.lt || t))); p.lt = t;
      const pan = p.panic && t - p.panic < 2.2;
      const scared = nahe(cx0, cy0 - 6, 40) || pan; if (scared && !p.sc) p.sc = t; if (!scared && p.sc && t - p.sc > 2) p.sc = 0;
      /* Panik: gackernd und flatternd davon, ein paar Federn fliegen */
      if (pan && p.pf !== p.panic) { p.pf = p.panic; if (rich()) for (let i = 0; i < 3; i++) tok("feder", cx0 + (p.cx || 0), cy0 - 5, p.pdir, 0.4); }
      const ph = (t * 0.6 + p.s * 7) % 3, peck = !p.sc && ph < 0.7 ? Math.max(0, Math.sin(ph / 0.7 * PI * 3)) : 0;
      const jump = p.sc ? Math.abs(Math.sin((t - p.sc) * 9)) * 3 * Math.max(0, 1 - (t - p.sc) / 1.5) : 0;
      if (p.cx == null) p.cx = 0;
      if (pan) { p.cx += p.pdir * 80 * dt; p.cx = Math.max(p.ra, Math.min(p.rb, p.cx)); }
      else { p.cx += Math.sin(t * 0.21 + p.s * 30) * 0.05; if (p.cx < p.ra * 0.5) p.cx += 6 * dt; else if (p.cx > p.rb * 0.5) p.cx -= 6 * dt; }
      const dir = pan ? p.pdir : Math.cos(t * 0.21 + p.s * 30) > 0 ? 1 : -1;
      c.save(); c.translate(p.cx, -jump); c.scale(dir, 1);
      E(c, 0, 0.2 + jump, 3.4, 0.6, "rgba(0,0,0,.35)");
      Ln(c, "#d8a040", 0.4, [-0.6, -2, -0.8, 0]); Ln(c, "#d8a040", 0.4, [0.8, -2, 1, 0]);
      E(c, 0, -3.6, 3.4, 2.4, cols[0]); P(c, cols[1], [-2.6, -4.6, -5, -6.4, -4.2, -3.6, -3, -2.6]);
      const wf = p.sc ? Math.sin(t * 40) * 2 : 0; E(c, -0.4, -3.6 - wf * 0.3, 2, 1.2 + Math.abs(wf) * 0.3, cols[1], wf * 0.2);
      const hx = 2.4 + peck * 0.8, hy = -6 + peck * 4;
      E(c, hx, hy, 1.3, 1.4, cols[0]); P(c, "#c82a20", [hx - 0.8, hy - 1.2, hx - 0.2, hy - 2.4, hx + 0.4, hy - 1.6, hx + 0.9, hy - 2.2, hx + 1, hy - 1]);
      P(c, "#e8b030", [hx + 1.1, hy - 0.2, hx + 2.4, hy + 0.2, hx + 1.1, hy + 0.5]); E(c, hx + 0.9, hy + 1, 0.4, 0.6, "#c82a20"); B(c, hx + 0.3, hy - 0.5, 0.4, 0.4, "#0a0606");
      c.restore();
      if (peck > 0.8 && Math.random() < 0.05 && rich()) Z.fx && Z.fx.p && Z.fx.p({ x: cx0 + p.cx + dir * 4, y: cy0 - 1, vx: (Math.random() - 0.5) * 20, vy: -20, life: 0.3, size: 0.6, col: "#b8946a", drag: 1, g: 300 });
    } },
    kraehe: { at: "f", crit: true, noflip: true, w: 1, a(c, p, t) { vogel(c, p, t, ["#1a1618", "#2e2a2e", "#d8a030", "#3a3640"]); } },
    moewe: { at: "f", crit: true, noflip: true, w: 1, a(c, p, t) { vogel(c, p, t, ["#e8e4dc", "#9a9690", "#e8b030", "#c8c4bc"]); } },
    taube: { at: "f", crit: true, noflip: true, w: 1, a(c, p, t) { vogel(c, p, t, ["#8a8486", "#5a5456", "#c8a080", "#6a7060"]); } }
  });
  const rich = () => !Z.gq || Z.gq.level !== 0;
  /* Katze erschrickt: Buckel und Fauchen zur Gefahr hin, dann gestreckt davon */
  function katzeFlucht(c, p, t, u) {
    const cols = [["#c07a3a", "#8a4a1a", "#e8b070"], ["#2a2426", "#141012", "#4a4244"], ["#8a8280", "#5a5250", "#c8c0b8"]][p.v];
    const dt = Math.min(0.05, Math.max(0, t - (p.lt || t))); p.lt = t;
    if (u >= 0.45) p.kx = (p.kx || 0) + p.pdir * 150 * dt;
    c.save(); c.translate(p.kx || 0, 0);
    if (u < 0.45) {
      c.scale(-p.pdir, 1); const q = Math.min(1, u * 8);
      E(c, 0, 0.2, 7, 1.1, "rgba(0,0,0,.4)");
      for (const lx of [-4, -2.6, 3, 4.4]) Ln(c, cols[0], 1.1, [lx, -4.5 * q - 1, lx + (lx > 0 ? 0.4 : -0.4), 0]);
      c.fillStyle = cols[0]; c.beginPath(); c.moveTo(-5.4, -3.6); c.bezierCurveTo(-5, -9 - 3 * q, 4, -9 - 3 * q, 5.2, -4); c.lineTo(4, -2.4); c.bezierCurveTo(2, -5 - 2 * q, -3, -5 - 2 * q, -4.4, -2.2); c.closePath(); c.fill();
      c.strokeStyle = cols[1]; c.lineWidth = 0.4; for (let k = 0; k < 7; k++) { const a = -2.4 + k * 0.5, bx = Math.cos(a) * 4.8, by = -6 - 2.6 * q + Math.sin(a) * 2; c.beginPath(); c.moveTo(bx, by); c.lineTo(bx * 1.1, by - 1.2 * q); c.stroke(); }
      c.strokeStyle = cols[0]; c.lineWidth = 1.8; c.lineCap = "round"; c.beginPath(); c.moveTo(-5, -4.4); c.quadraticCurveTo(-8, -8, -7, -12 - q); c.stroke();
      c.strokeStyle = cols[1]; c.lineWidth = 0.35; for (let k = 0; k < 6; k++) { const ty = -6 - k * 1.1; Ln(c, cols[1], 0.35, [-7.4, ty, -8.6, ty - 0.4]); Ln(c, cols[1], 0.35, [-6.4, ty, -5.4, ty - 0.5]); } c.lineCap = "butt";
      const hx = 6.4, hy = -4.6; E(c, hx, hy, 2.4, 2, cols[0]); P(c, cols[0], [hx - 2.2, hy - 0.6, hx - 3.4, hy - 1.6, hx - 1.4, hy - 1.6]); P(c, cols[0], [hx + 0.4, hy - 1.8, hx + 1.8, hy - 2.6, hx + 1.8, hy - 1]);
      E(c, hx + 1.4, hy + 0.9, 1, 0.8, "#3a1212"); P(c, "#f0e8e0", [hx + 0.8, hy + 0.4, hx + 1, hy + 1.2, hx + 1.2, hy + 0.4]);
      E(c, hx + 0.2, hy - 0.4, 0.55, 0.45, "#c8d84a"); B(c, hx + 0.1, hy - 0.8, 0.2, 0.8, "#0a0806");
      Ln(c, "rgba(240,230,220,.5)", 0.15, [hx + 2, hy + 0.5, hx + 4.4, hy - 0.4]);
    } else {
      c.scale(p.pdir, 1); if (u > 1.9) c.globalAlpha = Math.max(0, 1 - (u - 1.9) / 0.5);
      const r = Math.sin(t * 38), b = Math.abs(Math.cos(t * 38)) * 0.8;
      E(c, 0, 0.2, 6, 0.9, "rgba(0,0,0,.35)");
      Ln(c, cols[1], 1, [3 + r * 2.4, -3 - b, 4.6 + r * 3.4, 0]); Ln(c, cols[1], 1, [-3.4 - r * 2.4, -3 - b, -5 - r * 3.4, 0]);
      E(c, 0, -3.6 - b, 6.6, 2.1, cols[0]); E(c, -0.6, -4.8 - b, 4.6, 0.8, cols[2]);
      Ln(c, cols[0], 1, [3.4 - r * 2.2, -3 - b, 5 - r * 3, 0]); Ln(c, cols[0], 1, [-2.8 + r * 2.2, -3 - b, -4.6 + r * 3, 0]);
      c.strokeStyle = cols[0]; c.lineWidth = 1.4; c.lineCap = "round"; c.beginPath(); c.moveTo(-6, -4 - b); c.quadraticCurveTo(-9, -5 - b, -11.5, -4 + r * 0.6); c.stroke(); c.lineCap = "butt";
      const hx = 7, hy = -5 - b; E(c, hx, hy, 2.2, 1.8, cols[0]); P(c, cols[0], [hx - 1.4, hy - 1, hx - 2.8, hy - 2.2, hx - 0.4, hy - 1.6]); E(c, hx + 0.8, hy - 0.4, 0.5, 0.4, "#c8d84a");
    }
    c.restore(); c.globalAlpha = 1;
  }
  /* Vogel: pickt, schaut sich um, hüpft; fliegt auf, wenn man näher kommt, und kehrt später zurück */
  function vogel(c, p, t, pal) {
    if (p.gone && t < p.gone) return;
    if (p.flyT == null && nahe(cx0, cy0 - 6, 52)) { p.flyT = t; p.fdir = Z.player.x + Z.player.w / 2 > cx0 ? -1 : 1; }
    let x = 0, y = 0, dir = Math.sin(t * 0.3 + p.s * 40) > 0 ? 1 : -1, fly = 0;
    if (p.flyT != null) { const u = t - p.flyT; if (u > 2.2) { p.flyT = null; p.gone = t + 20 + p.s * 20; return; } fly = 1; dir = p.fdir; x = dir * u * u * 40; y = -u * 50 - u * u * 20; c.globalAlpha = Math.max(0, 1 - u / 2.2); }
    else { const hop = (t * 0.5 + p.s * 13) % 4; if (hop < 0.3) y = -Math.sin(hop / 0.3 * PI) * 2.4; }
    const peck = !fly && ((t * 0.8 + p.s * 5) % 2.6) < 0.4 ? 1 : 0;
    c.save(); c.translate(x, y); c.scale(dir, 1);
    if (!fly) E(c, 0, 0.2 - y, 3.2, 0.6, "rgba(0,0,0,.35)");
    if (!fly) { Ln(c, pal[2], 0.35, [-0.4, -2, -0.6, 0]); Ln(c, pal[2], 0.35, [0.6, -2, 0.8, 0]); }
    P(c, pal[1], [-2.4, -3.4, -6, -4.6, -5.4, -2.6, -2.2, -2.4]);
    E(c, 0, -3.2, 3, 1.9, pal[0], -0.15); E(c, 0.6, -2.4, 2, 0.9, pal[3]);
    if (fly) { const fw = Math.sin(t * 30) * 3.4; P(c, pal[1], [-1, -3.6, 1.6, -3.6, 0.6 - 2, -3.6 - fw * 1.4 - 1, -3, -3.6 - fw]); }
    else P(c, pal[1], [-2, -3.8, 2, -4, 0.6, -2.4, -2.4, -2.6]);
    const hx = 2.6 + peck * 0.8, hy = -4.6 + peck * 2.6;
    E(c, hx, hy, 1.4, 1.3, pal[0]); P(c, pal[2], [hx + 1.1, hy - 0.4, hx + 3, hy + 0.2, hx + 1.1, hy + 0.5]); E(c, hx + 0.6, hy - 0.3, 0.38, 0.38, "#0a0606"); B(c, hx + 0.5, hy - 0.5, 0.15, 0.15, "rgba(255,255,255,.8)");
    c.restore(); c.globalAlpha = 1;
  }
  /* ---------- Keller ---------- */
  function tropfAnim(c, x, y0, fall, t, ph, col) {
    /* Tropfen bildet sich, fällt, zerspritzt */
    const P0 = 2.6, u = ((t + ph) % P0) / P0, form = 0.55;
    col = col || "rgba(200,205,180,.85)";
    if (u < form) { const r = 0.3 + u / form * 0.7; E(c, x, y0 + r, r * 0.8, r, col); }
    else { const tt = (u - form) * P0, y = y0 + 1 + 300 * tt * tt; if (y < y0 + fall) { E(c, x, y, 0.6, 1.2, col); Ln(c, "rgba(220,220,200,.25)", 0.4, [x, y - 1, x, y - 4]); } else { const k = Math.min(1, (y - y0 - fall) / 60); c.strokeStyle = "rgba(220,220,200," + 0.5 * (1 - k) + ")"; c.lineWidth = 0.3; c.beginPath(); c.ellipse(x, y0 + fall - 0.3, 1 + k * 4, 0.3 + k * 0.6, 0, 0, TAU); c.stroke(); if (k < 0.4) { E(c, x - 1.5 - k * 4, y0 + fall - 1 - k * 4, 0.3, 0.3, col); E(c, x + 1.5 + k * 4, y0 + fall - 1.2 - k * 3, 0.3, 0.3, col); } } }
  }
  Object.assign(K, {
    fassregal: { at: "f", w: 3, box: [-26, -40, 26, 4], s(c, R, v) {
      shadow(c, 0, 0.5, 24, 2.2, 0.5);
      wood(c, -24, -36, 2.6, 36, "#4a2e1a", R, true); wood(c, 21.4, -36, 2.6, 36, "#4a2e1a", R, true);
      for (let r = 0; r < 3; r++) { const by = -6.5 - r * 11.5; wood(c, -24, by + 5.4, 48, 1.8, "#5a3a22", R, false);
        for (let k = 0; k < 4; k++) { if (r === 2 && k === (v + 1) % 4) continue; const bx = -15.6 + k * 10.4; fassStirn(c, bx, by, 4.8, sh("#6a4428", (R() - 0.5) * 0.2), R, r === 0 && k === 1);
          if (R() < 0.22) { c.strokeStyle = "rgba(240,236,220,.5)"; c.lineWidth = 0.3; c.beginPath(); c.moveTo(bx - 1.6, by - 1.8); c.lineTo(bx + 1.6, by + 1); c.moveTo(bx + 1.6, by - 1.8); c.lineTo(bx - 1.6, by + 1); c.stroke(); } } }
      wood(c, -24, -38, 48, 2.2, "#5a3a22", R, false);
      E(c, -5.2, 0, 3, 0.5, "rgba(80,20,30,.6)");
    }, a(c, p, t) { if (rich()) tropfAnim(c, -5.2, -3.5, 3.4, t, p.s * 10, "rgba(120,30,40,.9)"); } },
    weinfass: { at: "f", w: 2, box: [-16, -26, 16, 4], s(c, R, v) {
      shadow(c, 0, 0.5, 15, 2.2, 0.5);
      for (const x of [-9, 6]) { wood(c, x, -6, 3, 6, "#4a2e1a", R, true); }
      wood(c, -12, -6.5, 24, 2, "#5a3a22", R, false); for (const x of [-10, 8]) { c.fillStyle = "#4a2e1a"; c.beginPath(); c.moveTo(x - 2, -6.5); c.lineTo(x + 4, -6.5); c.lineTo(x + 3, -9); c.lineTo(x - 1, -9); c.fill(); }
      fassStirn(c, 0, -15.4, 9.6, "#6a3a22", R, true);
      c.fillStyle = "rgba(240,236,220,.55)"; c.font = "italic 3px 'Alegreya Sans',sans-serif"; c.fillText(["1312", "XIV", "Rot"][v], -4, -19);
      E(c, 0, -0.2, 3, 0.6, "rgba(80,20,30,.55)"); krug(c, 4.6, 0, 5, "#8a5a3a");
    }, a(c, p, t) { if (rich()) tropfAnim(c, 0, -8.6, 8.4, t, p.s * 10, "rgba(120,30,40,.9)"); } },
    vorratsregal: { at: "f", w: 2, box: [-16, -40, 16, 4], s(c, R, v) {
      shadow(c, 0, 0.5, 15, 2, 0.5);
      wood(c, -14, -38, 28, 38, "#3a2616", R, true); B(c, -14, -38, 28, 38, "rgba(0,0,0,.35)");
      wood(c, -15, -38, 2.2, 38, "#5a3a22", R, true); wood(c, 12.8, -38, 2.2, 38, "#5a3a22", R, true);
      for (let r = 0; r < 4; r++) wood(c, -15, -38 + r * 10 + 8, 30, 1.6, "#6a4428", R, false);
      /* Reihe 1: Einmachgläser */
      for (let k = 0; k < 5; k++) { const x = -11 + k * 5.4, y = -30.4, col = ["#6a7a2a", "#8a3a2a", "#c89a40", "#5a6a3a", "#9a5a2a"][(k + v) % 5]; c.fillStyle = "rgba(230,230,210,.25)"; c.fillRect(x - 1.8, y - 5.6, 3.6, 5.6); B(c, x - 1.6, y - 4.4, 3.2, 4.2, col); for (let q = 0; q < 3; q++) E(c, x - 0.8 + q * 0.8, y - 3 + (q % 2) * 1.4, 0.6, 0.6, sh(col, 0.2)); B(c, x - 1.9, y - 6.4, 3.8, 1, "#d8c8a0"); B(c, x - 1.9, y - 5.6, 3.8, 0.3, "#8a4a2a"); B(c, x - 1.3, y - 5, 0.4, 4.4, "rgba(255,255,240,.5)"); }
      /* Reihe 2: Tontöpfe mit Tuchdeckel und Käselaib */
      for (let k = 0; k < 3; k++) { const x = -10 + k * 6, y = -20.4; krug(c, x, y, 6, ["#9a6a4a", "#8a5a3a", "#a87a50"][k]); P(c, "#d8ccb0", [x - 2.4, y - 6, x + 2.4, y - 6, x + 2.8, y - 4.6, x - 2.8, y - 4.6]); B(c, x - 2, y - 5.2, 4, 0.4, "#6a4a2a"); }
      E(c, 9, -22.4, 3.6, 2, "#e8c060"); B(c, 5.4, -22.4, 7.2, 2, "#c8a040"); E(c, 9, -22.4, 3.6, 1, "#f0d070");
      /* Reihe 3: Mehlsack, Zwiebeln, Rüben */
      sack(c, -8, -10.4, 0.55, "#d8ccb0", R, "#efe8d8"); for (let k = 0; k < 6; k++) { const x = 0 + k * 2, y = -11.6 - (k % 2) * 0.8; E(c, x, y, 1.3, 1.2, k % 2 ? "#c8904a" : "#d8a860"); Ln(c, "#8a6a30", 0.3, [x, y - 1.2, x + 0.3, y - 2]); }
      for (let k = 0; k < 2; k++) { const x = 10 + k * 1.6; P(c, "#d86a2a", [x - 1, -12, x + 1, -12, x, -16.8]); B(c, x - 0.6, -12.6, 1.2, 0.8, "#5a8a2a"); }
      /* unten: Weidenkorb mit Eiern */
      c.fillStyle = "#8a6030"; c.beginPath(); c.moveTo(-10, -5); c.lineTo(10, -5); c.lineTo(9, 0); c.lineTo(-9, 0); c.fill(); for (let r = 0; r < 3; r++) for (let k = 0; k < 10; k++) E(c, -9 + k * 2 + (r % 2), -4.2 + r * 1.6, 0.9, 0.5, r % 2 ? "#a07038" : "#b8844a");
      for (let k = 0; k < 5; k++) E(c, -6 + k * 3, -5.6, 1.1, 1.4, k % 2 ? "#e8dcc8" : "#d8b888");
    } },
    saecke: { at: "f", w: 2, box: [-16, -26, 16, 3], s(c, R, v) {
      shadow(c, 0, 0.5, 15, 2, 0.5);
      sack(c, -6, 0, 1, "#b8a080", R); sack(c, 5.5, 0, 0.9, "#a89070", R, v === 0 ? "#e8dcc0" : v === 1 ? "#c8a040" : "#8a6a3a");
      if (v === 0) { for (let k = 0; k < 20; k++) E(c, 8 + R() * 6, -0.3 - R() * 1.2, 0.35, 0.3, "#e8dcc0"); }
      else if (v === 1) { for (let k = 0; k < 14; k++) E(c, 9 + R() * 5, -0.4 - R(), 0.4, 0.35, "#d8b040"); c.save(); c.translate(10, -3); c.rotate(0.4); metal(c, -1.6, -1, 3.2, 2, "#8a6a3a"); B(c, 1.6, -0.4, 3, 0.7, "#6a4a2a"); c.restore(); }
      sack(c, 0, -10, 0.75, "#c8b090", R);
      c.fillStyle = "rgba(60,30,20,.45)"; c.font = "bold 3px 'Alegreya Sans',sans-serif"; c.fillText(["M", "K", "H"][v], -7.4, -4);
    } },
    kaese: { at: "f", w: 1, box: [-10, -14, 10, 3], s(c, R, v) {
      shadow(c, 0, 0.5, 9, 1.6, 0.45);
      wood(c, -9, -1.6, 18, 1.6, "#7a5a32", R, false);
      const laib = (x, y, r, h) => { c.fillStyle = lg(c, x - r, 0, x + r, 0, ["#f0d070", "#e0b850", "#a88030"]); c.fillRect(x - r, y - h, r * 2, h); E(c, x, y, r, r * 0.25, "#a88030"); E(c, x, y - h, r, r * 0.25, "#f4dc88"); B(c, x - r, y - h * 0.5, r * 2, 0.3, "rgba(120,80,20,.3)"); };
      laib(-3, -1.6, 5, 3); laib(-3, -4.6, 4.4, 3); laib(5, -1.6, 3.4, 2.6);
      if (v !== 2) { c.fillStyle = "#e8c060"; c.beginPath(); c.moveTo(-3, -7.6); c.lineTo(1.4, -8.6); c.lineTo(1.4, -7.4); c.lineTo(-3, -6.2); c.fill(); }
      for (let k = 0; k < 5; k++) E(c, -6 + R() * 6, -2.2 - R() * 5, 0.4, 0.3, "#c89a30");
      if (v === 1) { E(c, 1.3, -3, 0.9, 0.8, "#2a1a10"); for (let k = 0; k < 4; k++) E(c, 2 + R() * 3, -0.2, 0.25, 0.2, "#e8c060"); }
      B(c, 6, -2.6, 3.6, 0.5, "#a0a0a8"); B(c, 8.4, -2.8, 1.6, 0.8, "#4a2e1a");
    } },
    krugreihe: { at: "f", w: 2, box: [-16, -20, 16, 3], s(c, R, v) {
      shadow(c, 0, 0.5, 15, 2, 0.45);
      const amph = (x, h, col, broken) => { const w = h * 0.5; c.fillStyle = lg(c, x - w / 2, 0, x + w / 2, 0, [sh(col, 0.2), col, sh(col, -0.45)]); c.beginPath(); c.moveTo(x - 1, 0); c.quadraticCurveTo(x - w * 0.7, -h * 0.4, x - w * 0.3, -h * 0.85); c.lineTo(x - w * 0.25, -h); c.lineTo(x + w * 0.25, -h); c.lineTo(x + w * 0.3, -h * 0.85); c.quadraticCurveTo(x + w * 0.7, -h * 0.4, x + 1, 0); c.fill();
        c.strokeStyle = sh(col, -0.3); c.lineWidth = 0.6; c.beginPath(); c.arc(x - w * 0.4, -h * 0.75, h * 0.1, PI * 0.5, PI * 1.5); c.stroke(); c.beginPath(); c.arc(x + w * 0.4, -h * 0.75, h * 0.1, -PI * 0.5, PI * 0.5); c.stroke();
        B(c, x - w * 0.45, -h * 0.5, w * 0.9, 0.4, "rgba(40,20,10,.35)"); B(c, x - w * 0.45, -h * 0.42, w * 0.9, 0.25, "rgba(255,220,180,.15)"); B(c, x - w * 0.25, -h * 0.7, 0.4, h * 0.4, "rgba(255,240,220,.3)");
        if (broken) { c.globalCompositeOperation = "destination-out"; P(c, "#000", [x + 1, -h, x + w * 0.4, -h * 0.6, x + w, -h * 0.65, x + w, -h - 2]); c.globalCompositeOperation = "source-over"; } };
      amph(-9, 15, "#a86a44", false); amph(-1, 12, "#9a5a3a", v === 1); amph(7, 14, "#b87a50", false);
      if (v === 1) { for (let k = 0; k < 4; k++) P(c, "#9a5a3a", [10 + k * 1.6, 0, 11 + k * 1.6, -1.2 - (k % 2), 12 + k * 1.6, 0]); E(c, 9, 0, 3, 0.5, "rgba(120,30,40,.5)"); }
      if (v === 2) { c.strokeStyle = "rgba(230,224,236,.4)"; c.lineWidth = 0.2; for (let k = 0; k < 5; k++) { c.beginPath(); c.moveTo(-9, -15); c.lineTo(-1 + k * 0.5, -12 + k * 0.3); c.stroke(); } }
    } },
    kartoffelkiste: { at: "f", w: 1, box: [-10, -14, 10, 3], s(c, R, v) {
      shadow(c, 0, 0.5, 9, 1.6, 0.45);
      const cols = [["#b8945a", "#a8844a"], ["#a83a4a", "#e8dcc8"], ["#d8783a", "#c8a050"]][v];
      for (let k = 0; k < 9; k++) E(c, -5 + (k % 5) * 2.5, -7.6 - Math.floor(k / 5) * 1.6, 1.5, 1.2, cols[k % 2]);
      if (v === 1) for (let k = 0; k < 3; k++) { Ln(c, "#5a8a2a", 0.5, [-4 + k * 3, -9, -4.4 + k * 3, -12]); }
      kiste(c, -7, -7.4, 14, 7.4, "#7a5432", R, { nobrace: true });
      E(c, 8.4, -1, 1.5, 1.2, cols[0]);
    } },
    besen: { at: "f", w: 1, box: [-10, -30, 10, 3], s(c, R, v) {
      shadow(c, 0, 0.5, 8, 1.4, 0.4);
      c.save(); c.translate(-2, 0); c.rotate(-0.12); wood(c, -0.6, -28, 1.2, 22, "#8a6a40", R, true); c.fillStyle = "#b8984a"; c.beginPath(); c.moveTo(-2, -7); c.lineTo(2, -7); c.lineTo(4, 0); c.lineTo(-4, 0); c.fill(); for (let k = -3.5; k < 4; k += 0.7) Ln(c, "#8a7030", 0.25, [k * 0.5, -6.5, k, 0]); B(c, -2.1, -7.6, 4.2, 1.2, "#6a4a2a"); c.restore();
      c.save(); c.translate(5, 0); c.fillStyle = lg(c, -3.4, 0, 3.4, 0, ["#7a5a3a", "#4a3020"]); c.beginPath(); c.moveTo(-3.4, -7); c.lineTo(3.4, -7); c.lineTo(2.8, 0); c.lineTo(-2.8, 0); c.fill(); band(c, -3.3, -5.6, 6.6, 0.7); band(c, -3, -2, 6, 0.7); E(c, 0, -7, 3.4, 0.7, "#2a1a10"); c.restore();
      c.fillStyle = "#a89a80"; c.beginPath(); c.moveTo(2, -7.2); c.quadraticCurveTo(4, -9, 6.4, -7.6); c.lineTo(8, -4); c.lineTo(7, -3.8); c.lineTo(5.6, -6.6); c.lineTo(2.6, -6.6); c.fill();
    } },
    kessel: { at: "f", w: 2, box: [-16, -30, 16, 4], s(c, R, v) {
      shadow(c, 0, 0.5, 14, 2, 0.5);
      for (const [a, b] of [[-11, -2], [11, 2]]) Ln(c, "#2a2426", 1, [a, 0, b * 0.2, -22]); Ln(c, "#2a2426", 1, [0, 0.5, 0, -22]); B(c, -2, -23, 4, 1.4, "#3a3436"); kette(c, 0, -22, 0, -15, "#4a4446");
      for (let k = 0; k < 6; k++) { const a = k / 6 * PI; stein(c, [-8 + k * 3.2, 0, -6 + k * 3.2, -2 - (k % 2), -4.6 + k * 3.2, 0], "#5a5058", R); }
      for (const [x, a] of [[-3, 0.3], [3, -0.3]]) { c.save(); c.translate(x, -1.6); c.rotate(a); wood(c, -4, -0.8, 8, 1.6, "#4a2e1a", R, false); B(c, -4, -0.8, 2, 1.6, "#1a1010"); c.restore(); }
      c.fillStyle = rg(c, -3, -10, 9, ["#5a5658", "#2a2628", "#121012"]); c.beginPath(); c.moveTo(-7, -14); c.quadraticCurveTo(-8, -5, 0, -4); c.quadraticCurveTo(8, -5, 7, -14); c.closePath(); c.fill();
      E(c, 0, -14, 7, 1.4, "#1a1618"); E(c, 0, -14, 6, 1, v === 2 ? "#8a7a3a" : v === 1 ? "#6a7a3a" : "#8a4a2a");
      c.strokeStyle = "#3a3436"; c.lineWidth = 0.5; c.beginPath(); c.arc(0, -14, 7.2, PI, 0); c.stroke(); B(c, -5, -12, 0.6, 4, "rgba(255,240,220,.2)");
      c.save(); c.translate(4, -15); c.rotate(0.5); wood(c, -0.4, -8, 0.8, 8, "#8a6a40", R, true); c.restore();
    }, fls: [[-2, -2.6, 0.9, null, "e"], [2, -2.2, 0.8, null, "w"], [0, -3, 1.1, null, "w"]], holeR: [0, -6, 46, 0.55],
      a(c, p, t) { for (let k = 0; k < 3; k++) { const u = (t * 1.3 + k * 0.33 + p.s) % 1; E(c, -4 + k * 4, -14.2, 0.8 * (1 - u), 0.5 * (1 - u), "rgba(255,230,180," + 0.4 * (1 - u) + ")"); } if (rich()) rauch(c, 0, -16, t, p.s * 5, "200,190,180"); } },
    kuechentisch: { at: "f", w: 3, box: [-26, -26, 26, 4], s(c, R, v) {
      const ty = tisch(c, R, 40, 11, "#7a5a3a", true);
      wood(c, -14, ty - 1.2, 14, 1.2, "#b8946a", R, false); for (let k = 0; k < 5; k++) Ln(c, "rgba(90,60,30,.4)", 0.2, [-12 + k * 2.6, ty - 1.1, -11 + k * 2.6, ty - 0.2]);
      for (let k = 0; k < 4; k++) { E(c, -10 + k * 1.2, ty - 1.9, 0.9, 0.7, "#e8dcc8"); }
      E(c, -4.6, ty - 2.2, 1.6, 1.5, "#d8a860"); E(c, -4.6, ty - 2.2, 1, 1, "#e8d4b0");
      c.save(); c.translate(-1, ty - 1.4); c.rotate(-0.1); metal(c, 0, -0.4, 5, 0.8, "#b2b0ac"); B(c, -2.4, -0.6, 2.4, 1.2, "#4a2e1a"); c.restore();
      for (let k = 0; k < 3; k++) { c.save(); c.translate(5 + k * 1.6, ty - 0.6); c.rotate(-0.3 + k * 0.2); P(c, "#d86a2a", [-0.8, 0, 0.8, 0, 0, -5]); P(c, "#5a8a2a", [-0.6, 0, 0, 1.6, 0.6, 0]); c.restore(); }
      brot(c, 13, ty, 5);
      if (v !== 2) { /* gerupftes Huhn */ E(c, 18, ty - 1.6, 2.4, 1.6, "#e8c8a0"); knochen(c, 19.6, ty - 2, 21, ty - 3.4, 0.6); }
      krug(c, -18, ty, 5, "#9a6a4a");
    }, a(c, p, t) { if (p.v !== 2) fliegen(c, 18, -14, t, 2, p.s * 7); } },
    /* Keller-Wand */
    flaschenregal: { at: "w", box: [-17, -40, 17, -8], s(c, R, v) {
      for (const y of [-24, -13]) { wood(c, -15, y, 30, 1.6, "#5a3a22", R, false); B(c, -15, y + 1.6, 30, 0.6, "rgba(0,0,0,.35)"); for (const x of [-13, 12]) { P(c, "#4a2e1a", [x, y + 1.6, x + 1.4, y + 1.6, x + 1.4, y + 5]); } }
      for (let r = 0; r < 2; r++) for (let k = 0; k < 6; k++) { if (R() < 0.12) continue; const bx = -12 + k * 4.8, by = -24 + r * 11;
        if (R() < 0.2) { c.save(); c.translate(bx, by - 1.2); c.rotate(PI / 2); flasche(c, 0, 1.3, 7, ["#2a4a2a", "#5a1a2a", "#3a2a1a", "#6a5a2a"][(R() * 4) | 0], R); c.restore(); }
        else flasche(c, bx, by, 6.4 + R() * 1.6, ["#2a4a2a", "#5a1a2a", "#3a2a1a", "#6a5a2a"][(R() * 4) | 0], R); }
      c.strokeStyle = "rgba(230,224,236,.35)"; c.lineWidth = 0.2; for (let k = 0; k < 5; k++) { c.beginPath(); c.moveTo(-15, -24); c.lineTo(-15 + k * 1.6, -32 + k * 1.6); c.stroke(); }
    } },
    wuerste: { at: "w", box: [-15, -40, 15, -6], s(c, R, v) {
      wood(c, -14, -34, 28, 2, "#5a3a22", R, false); Ln(c, "#3a2a1a", 0.5, [-13, -36, -13, -34]); Ln(c, "#3a2a1a", 0.5, [13, -36, 13, -34]);
    }, a(c, p, t) {
      for (let k = 0; k < 6; k++) { const wx = -11 + k * 4.4, sw = Math.sin(t * 0.9 + k + p.s * 9) * 0.7, L = 4 + (k % 3);
        Ln(c, "#5a4a2a", 0.3, [wx, -32, wx + sw * 0.5, -32 + L]); const y = -32 + L;
        if (k % 3 === 2) { c.fillStyle = "#e8e0d0"; c.beginPath(); c.moveTo(wx + sw, y); for (let q = 0; q < 5; q++) { const a = q / 5 * TAU; c.lineTo(wx + sw + Math.cos(a) * 1.6, y + 2.6 + Math.sin(a) * 2.2); } c.fill(); Ln(c, "rgba(160,150,130,.6)", 0.2, [wx + sw, y + 0.6, wx + sw, y + 4.6]); }
        else { c.fillStyle = k % 2 ? "#8a3a2a" : "#a0542a"; c.beginPath(); c.ellipse(wx + sw, y + 5.2, 1.5, 5, sw * 0.1, 0, TAU); c.fill(); E(c, wx + sw - 0.5, y + 4, 0.4, 2.6, "rgba(255,220,180,.3)"); for (let q = 0; q < 3; q++) E(c, wx + sw + (q - 1) * 0.6, y + 3 + q * 1.8, 0.25, 0.25, "#e8d0b0"); } }
    } },
    zwiebelzopf: { at: "w", box: [-14, -42, 14, -8], s(c, R, v) {
      for (let z = 0; z < 2; z++) { const x = -5 + z * 10; rivet(c, x, -37, 0.6); Ln(c, "#a8884a", 0.6, [x, -37, x, -12]);
        for (let k = 0; k < 8; k++) { const y = -34 + k * 3, dx = (k % 2 ? 1.6 : -1.6); if (z === 1 && v !== 2) { E(c, x + dx, y, 1.3, 1.2, "#e8e0c8"); E(c, x + dx - 0.3, y - 0.3, 0.5, 0.4, "rgba(255,255,255,.6)"); Ln(c, "#8a8a6a", 0.25, [x + dx, y - 1.2, x, y - 2]); } else { E(c, x + dx, y, 1.6, 1.4, k % 3 ? "#c8843a" : "#a8642a"); E(c, x + dx - 0.4, y - 0.4, 0.5, 0.4, "rgba(255,230,180,.45)"); Ln(c, "#8a6a30", 0.3, [x + dx, y - 1.3, x, y - 2.2]); } } }
    } },
    pfannen: { at: "w", box: [-18, -44, 18, -8], s(c, R, v) {
      wood(c, -16, -38, 32, 2, "#5a3a22", R, false);
      for (const [x, r, kind] of [[-11, 4.6, 0], [-1, 3.6, 1], [8, 0, 2], [13, 0, 3]]) {
        rivet(c, x, -37, 0.5);
        if (kind === 0 || kind === 1) { const col = kind ? "#b8643a" : "#3a3436"; Ln(c, kind ? "#8a4a2a" : "#2a2426", 1, [x, -37, x, -30]); c.fillStyle = rg(c, x - r * 0.3, -26 + r * 0 - r * 0.3, r * 1.2, [sh(col, 0.35), col, sh(col, -0.5)]); c.beginPath(); c.arc(x, -30 + r, r, 0, TAU); c.fill(); c.strokeStyle = sh(col, -0.3); c.lineWidth = 0.5; c.beginPath(); c.arc(x, -30 + r, r - 0.6, 0, TAU); c.stroke(); E(c, x - r * 0.3, -30 + r * 0.6, r * 0.25, r * 0.15, "rgba(255,240,220,.4)"); }
        else if (kind === 2) { Ln(c, "#7a7678", 0.6, [x, -37, x, -24]); E(c, x, -22.6, 1.8, 1.4, "#7a7678"); }
        else { Ln(c, "#6a4a2a", 0.8, [x, -37, x, -26]); P(c, "#8e8c8a", [x - 1.4, -26, x + 1.4, -26, x + 1.6, -20, x - 1.6, -20]); }
      }
    } },
    wandkerze: { at: "w", box: [-8, -36, 8, -12], s(c, R, v) {
      wood(c, -6, -20, 12, 1.6, "#5a3a22", R, false); P(c, "#4a2e1a", [-4, -18.4, 4, -18.4, 0, -14]); rivet(c, 0, -17, 0.4);
      kerze(c, -2, -20, 5, 1.4); E(c, -2, -20.2, 2.2, 0.5, "rgba(232,220,192,.8)"); B(c, -2.6, -20, 0.5, 2.4, "rgba(232,220,192,.7)");
      if (v === 1) { kerze(c, 2.6, -20, 3, 1.2, "#d8c8a0"); }
      if (v === 2) { schaedel(c, 3, -21.6, 1.8, 0); }
    }, fls: [[-2, -26, 0.55], [2.6, -24, 0.45, 1]], holeR: [0, -25, 26, 0.35] },
    wandregal: { at: "w", box: [-16, -42, 16, -10], s(c, R, v) {
      for (const y of [-28, -18]) { wood(c, -14, y, 28, 1.6, "#5a3a22", R, false); P(c, "#4a2e1a", [-11, y + 1.6, -9, y + 1.6, -11, y + 4]); P(c, "#4a2e1a", [11, y + 1.6, 9, y + 1.6, 11, y + 4]); }
      krug(c, -9, -28, 6, "#9a6a4a"); krug(c, -4, -28, 4.6, "#8a7a5a"); for (let k = 0; k < 3; k++) buch(c, 1 + k * 2, -34 + k * 0.4, 1.8, 6 - k * 0.4, ["#6a2a2a", "#2a4a3a", "#5a4a2a"][k], R); c.save(); c.translate(9, -28); c.rotate(-0.35); buch(c, 0, -6, 1.8, 6, "#4a2a5a", R); c.restore();
      if (v === 0) schaedel(c, -8, -20.4, 2.2, 0.2); else apfel(c, -9, -19.6, 1.4);
      E(c, 0, -19, 3, 0.8, "#8e8c8a"); E(c, 0, -19.4, 2.4, 0.5, "#acaaa6"); flasche(c, 7, -18, 6, "#5a1a2a", R); flasche(c, 10, -18, 5, "#2a4a2a", R);
    } },
    /* ---------- Hallen ---------- */
    buecherregal: { at: "f", w: 3, box: [-22, -50, 22, 4], s(c, R, v) {
      shadow(c, 0, 0.5, 20, 2.2, 0.5);
      wood(c, -19, -44, 38, 44, "#3a2414", R, true); B(c, -19, -44, 38, 44, "rgba(0,0,0,.45)");
      wood(c, -20, -44, 2.6, 44, "#5a3820", R, true); wood(c, 17.4, -44, 2.6, 44, "#5a3820", R, true);
      wood(c, -21, -46.6, 42, 2.8, "#6a4428", R, false); for (let k = -20; k < 21; k += 3) B(c, k, -44, 1.6, 1, "#5a3820"); wood(c, -20.5, -1.8, 41, 1.8, "#5a3820", R, false);
      for (let r = 0; r < 4; r++) { const sy = -34 + r * 10.2;
        wood(c, -17.4, sy, 34.8, 1.4, "#5a3820", R, false);
        let bx = -17; const end = 17.2;
        while (bx < end - 1.2) {
          const roll = R();
          if (roll < 0.025 && bx < end - 6) { /* Schädel */ schaedel(c, bx + 2.4, sy - 2.4, 2, 0.1); bx += 5; continue; }
          if (roll < 0.12 && bx < end - 6) { /* liegender Stapel */ for (let q = 0; q < 3; q++) buch(c, bx + 0.3 * q, sy - 1.6 - q * 1.6, 5.4 - q * 0.4, 1.5, ["#6a2a2a", "#2a4a3a", "#6a5a2a", "#4a2a5a"][(R() * 4) | 0], R); bx += 6.2; continue; }
          if (roll < 0.16 && bx < end - 5) { /* Schriftrollen */ for (let q = 0; q < 3; q++) { E(c, bx + 1.4 + q * 1.3, sy - 1.2 - (q % 2) * 1.6, 1.2, 1.2, "#e8dcc0"); E(c, bx + 1.4 + q * 1.3, sy - 1.2 - (q % 2) * 1.6, 0.5, 0.5, "#b8a880"); } bx += 4.8; continue; }
          if (roll < 0.19 && bx < end - 4) { kerze(c, bx + 1.6, sy, 3, 1.1); bx += 3.4; continue; }
          const bw = 1.3 + R() * 1.6, bh = 5.2 + R() * 3.2, lean = R() < 0.08 && bx > -15;
          const col = ["#7a2a2a", "#2a4a3a", "#6a5a2a", "#4a2a5a", "#8a6a3a", "#5a3a2a", "#3a3a2a", "#8a2a3a"][(R() * 8) | 0];
          if (lean) { c.save(); c.translate(bx, sy); c.rotate(-0.28); buch(c, 0, -bh, bw, bh, col, R); c.restore(); bx += bw + 1.6; }
          else { buch(c, bx, sy - bh, bw, bh, col, R); bx += bw + 0.15; }
        }
        B(c, -17.4, sy - 9, 34.8, 1.2, "rgba(0,0,0,.35)");
      }
      wear(c, -20, -44, 40, 44, R, 6);
    } },
    ruestung: { at: "f", w: 1, box: [-12, -46, 12, 3], s(c, R, v) {
      const st = "#8e8c88";
      shadow(c, 0, 0.5, 8, 1.6, 0.5); wood(c, -5.5, -2, 11, 2, "#3a2a1a", R, false);
      for (const sd of [-1, 1]) { metal(c, sd * 2.2 - 1.2, -14, 2.4, 12, st); E(c, sd * 2.2, -8.4, 1.6, 1.2, sh(st, 0.1)); P(c, sh(st, -0.2), [sd * 2.2 - 1.4, -2, sd * 2.2 + 1.4 + sd * 1.4, -2, sd * 2.2 + 1.4, -3.6, sd * 2.2 - 1.4, -3.6]); }
      metal(c, -4, -16, 8, 2.6, sh(st, -0.2)); for (let k = 0; k < 3; k++) B(c, -4, -15.4 + k * 0.8, 8, 0.25, "rgba(0,0,0,.3)");
      c.fillStyle = lg(c, -6, 0, 6, 0, [sh(st, 0.45), st, sh(st, -0.5)]); c.beginPath(); c.moveTo(-6, -27); c.lineTo(6, -27); c.quadraticCurveTo(6.4, -20, 4, -16); c.lineTo(-4, -16); c.quadraticCurveTo(-6.4, -20, -6, -27); c.fill();
      Ln(c, "rgba(255,255,255,.5)", 0.4, [-3.6, -26, -3.8, -18]); Ln(c, "rgba(0,0,0,.35)", 0.3, [0, -27, 0, -17]);
      for (const sd of [-1, 1]) { E(c, sd * 6.6, -25.6, 3, 2.2, sh(st, 0.05)); E(c, sd * 6.4, -26.4, 2, 0.8, "rgba(255,255,255,.35)"); metal(c, sd * 7 - 1, -24, 2, 8, sh(st, -0.1)); E(c, sd * 7, -15.4, 1.3, 1.5, sh(st, -0.25)); }
      c.fillStyle = lg(c, -4, 0, 4, 0, [sh(st, 0.4), st, sh(st, -0.5)]); c.beginPath(); c.moveTo(-3.6, -27.4); c.quadraticCurveTo(-4.2, -34, 0, -34.6); c.quadraticCurveTo(4.2, -34, 3.6, -27.4); c.fill();
      B(c, -3.2, -31, 6.4, 0.9, "#141016"); for (let k = -2.4; k < 3; k += 1.2) B(c, k, -29.6, 0.4, 1.6, "#141016"); Ln(c, "rgba(255,255,255,.45)", 0.35, [-2.6, -33.6, -3.2, -29]);
      const pl = ["#8a1a20", "#d8c8a0", "#3a5a2a"][v]; c.fillStyle = pl; c.beginPath(); c.moveTo(0, -34.4); c.bezierCurveTo(2, -38, 5, -39, 7, -36.4); c.bezierCurveTo(5, -37, 3, -36, 0.8, -33.6); c.fill(); B(c, -0.4, -35.4, 0.8, 1.4, "#b8923a");
      wood(c, 8.4, -44, 1.1, 44, "#5a3a22", R, true); P(c, lg(c, 9, -46, 14, -36, ["#cccac6", "#82807c"]), [9.4, -40, 14, -42.4, 14.4, -36, 9.4, -36.4]); P(c, "#a09e9a", [9, -46, 8.6, -40, 9.8, -40]); P(c, "#8e8c88", [8.4, -40, 5.6, -38.6, 8.4, -37.6]);
      wear(c, -6, -34, 12, 30, R, 6);
    } },
    globus: { at: "f", w: 1, box: [-10, -26, 10, 3], s(c, R, v) {
      shadow(c, 0, 0.5, 7, 1.4, 0.45);
      for (const sd of [-1, 1]) { c.save(); c.translate(sd * 4, 0); c.rotate(sd * 0.25); wood(c, -0.7, -10, 1.4, 10, "#5a3820", R, true); c.restore(); }
      wood(c, -6, -10.6, 12, 1.4, "#6a4428", R, false);
      const cy = -17; c.fillStyle = rg(c, -2, cy - 2, 8, ["#e8d8a8", "#c8b080", "#8a7048"]); c.beginPath(); c.arc(0, cy, 6.2, 0, TAU); c.fill();
      c.save(); c.beginPath(); c.arc(0, cy, 6.2, 0, TAU); c.clip(); c.translate(0, cy); c.rotate(0.4);
      for (const [x, y, rx, ry] of [[-2.6, -1.6, 2, 1.4], [-1.8, 1.8, 1.2, 2], [2.4, -1, 1.6, 1.2], [3, 2.6, 1.6, 1]]) E(c, x, y, rx, ry, R() < 0.5 ? "#7a8a3a" : "#8a6a3a");
      for (let k = -2; k <= 2; k++) { c.strokeStyle = "rgba(80,50,20,.35)"; c.lineWidth = 0.2; c.beginPath(); c.ellipse(0, 0, Math.abs(k) * 1.5 + 0.1, 6.2, 0, 0, TAU); c.stroke(); c.beginPath(); c.moveTo(-6.2, k * 2); c.lineTo(6.2, k * 2); c.stroke(); }
      c.restore(); E(c, -2.2, cy - 2.4, 1.8, 1.2, "rgba(255,250,230,.4)");
      c.strokeStyle = "#b8923a"; c.lineWidth = 0.8; c.beginPath(); c.arc(0, cy, 7.4, PI * 0.65, PI * 2.35); c.stroke(); E(c, 0, cy - 7.6, 0.6, 0.6, "#d8b050"); B(c, -0.4, -10.6, 0.8, 1.4, "#b8923a");
    } },
    standuhr: { at: "f", w: 1, box: [-9, -48, 9, 3], s(c, R, v) {
      const col = "#4a2a18"; shadow(c, 0, 0.5, 7, 1.4, 0.5);
      wood(c, -5.5, -32, 11, 32, col, R, true); wood(c, -6.6, -3, 13.2, 3, sh(col, 0.08), R, false); wood(c, -6.2, -33.6, 12.4, 2, sh(col, 0.1), R, false);
      c.fillStyle = "#1a0e08"; c.fillRect(-3.6, -29, 7.2, 22); c.fillStyle = "rgba(255,240,210,.08)"; c.fillRect(-3.6, -29, 2, 22); c.strokeStyle = "#b8923a"; c.lineWidth = 0.4; c.strokeRect(-3.6, -29, 7.2, 22);
      wood(c, -6.4, -44, 12.8, 10.6, sh(col, 0.05), R, true); c.fillStyle = sh(col, 0.1); c.beginPath(); c.moveTo(-6.6, -44); c.quadraticCurveTo(0, -48.4, 6.6, -44); c.fill(); E(c, 0, -47.6, 1, 1, "#b8923a");
      E(c, 0, -39, 4.4, 4.4, "#b8923a"); E(c, 0, -39, 3.8, 3.8, "#efe6d0"); for (let k = 0; k < 12; k++) { const a = k / 12 * TAU; B(c, Math.cos(a) * 3.2 - 0.2, -39 + Math.sin(a) * 3.2 - 0.2, 0.4, 0.4, "#2a1a14"); }
    }, a(c, p, t) {
      const a = Math.sin(t * PI) * 0.22; c.save(); c.translate(0, -28.4); c.rotate(a); Ln(c, "#b8923a", 0.4, [0, 0, 0, 16]); E(c, 0, 17, 2, 2, "#c8a040"); E(c, -0.6, 16.4, 0.7, 0.6, "rgba(255,250,220,.7)"); c.restore();
      const mn = t * 0.05 + p.s * 9, hr = mn / 12; c.strokeStyle = "#1a1210"; c.lineWidth = 0.4; c.beginPath(); c.moveTo(0, -39); c.lineTo(Math.sin(mn) * 3.2, -39 - Math.cos(mn) * 3.2); c.stroke(); c.lineWidth = 0.6; c.beginPath(); c.moveTo(0, -39); c.lineTo(Math.sin(hr) * 2, -39 - Math.cos(hr) * 2); c.stroke();
    } },
    harfe: { at: "f", w: 1, box: [-10, -34, 10, 3], s(c, R, v) {
      shadow(c, 0, 0.5, 7, 1.4, 0.45); const g = "#c8a040";
      c.strokeStyle = sh(g, -0.2); c.lineWidth = 2; c.beginPath(); c.moveTo(-5, -1); c.lineTo(-5, -28); c.stroke();
      c.strokeStyle = g; c.lineWidth = 1.6; c.beginPath(); c.moveTo(-5, -28); c.bezierCurveTo(0, -32, 2, -22, 7, -24); c.stroke();
      c.fillStyle = lg(c, -4, 0, 8, 0, ["#8a5a2a", "#6a4020"]); c.beginPath(); c.moveTo(-5, -1); c.lineTo(-3, -2); c.lineTo(7, -23); c.lineTo(5, -24); c.closePath(); c.fill();
      for (let k = 0; k < 9; k++) { const u = k / 8, x = -4.4 + u * 10.4, yTop = -28.5 + Math.sin(u * PI) * -1.5 + u * 5, yBot = -1.6 - u * 21.8; Ln(c, "rgba(240,230,200,.55)", 0.18, [x, yTop, x, yBot]); }
      E(c, -5, -28.6, 1.2, 1.2, sh(g, 0.2)); E(c, -5, -0.6, 2.4, 0.8, sh(g, -0.3));
    }, a(c, p, t) { const k = Math.floor((t * 2 + p.s * 9) % 9), u = k / 8, x = -4.4 + u * 10.4; c.globalAlpha = 0.3 + 0.3 * Math.sin(t * 8); Ln(c, "#fff0c0", 0.25, [x, -27 + u * 4, x, -2 - u * 21]); c.globalAlpha = 1; } },
    sessel: { at: "f", w: 2, box: [-14, -28, 14, 3], s(c, R, v) {
      const st = ["#7a1a20", "#3a5a2a", "#6a3a1a"][v], wd = "#4a2a18";
      shadow(c, 0, 0.5, 12, 1.8, 0.5);
      for (const x of [-9, 8]) { wood(c, x, -4, 1.6, 4, wd, R, true); E(c, x + 0.8, -0.3, 1.2, 0.5, sh(wd, -0.3)); }
      c.fillStyle = lg(c, -10, -24, 10, -4, [sh(st, 0.25), st, sh(st, -0.45)]); c.beginPath(); c.moveTo(-10, -5); c.lineTo(-10, -22); c.quadraticCurveTo(-10, -26, -5, -26); c.quadraticCurveTo(-2, -24, -2, -20); c.lineTo(-2, -12); c.lineTo(9, -12); c.lineTo(10, -5); c.closePath(); c.fill();
      for (const [x, y] of [[-7, -21], [-5, -17], [-7, -13], [-4.2, -22.4]]) { E(c, x, y, 0.5, 0.5, sh(st, -0.4)); E(c, x - 0.15, y - 0.15, 0.2, 0.2, "rgba(255,240,220,.4)"); }
      c.fillStyle = lg(c, 0, -14, 0, -10, [sh(st, 0.3), st]); c.beginPath(); c.moveTo(-3, -11); c.quadraticCurveTo(-3, -14, 0, -13.8); c.lineTo(8, -13.6); c.quadraticCurveTo(11, -13, 10.6, -10.4); c.lineTo(-3, -10); c.fill();
      wood(c, 7.4, -17, 3.6, 2, wd, R, false); wood(c, 9, -15, 1.6, 10, wd, R, true); E(c, 9.2, -17, 2.4, 1.2, sh(wd, 0.1));
      wood(c, -10.4, -5.6, 21, 1.8, wd, R, false); B(c, -10, -6, 20, 0.6, "#c89a40");
      if (v === 2) { c.save(); c.translate(3, -14.2); c.rotate(-0.15); buch(c, -2.6, -1.4, 5.2, 1.4, "#2a4a3a", R); c.restore(); }
      if (v === 1) { c.fillStyle = "#d8c8a0"; c.beginPath(); c.moveTo(-10, -22); c.quadraticCurveTo(-4, -24, -2, -18); c.lineTo(-3, -8); c.lineTo(-6, -9); c.quadraticCurveTo(-8, -16, -10, -14); c.fill(); for (let k = 0; k < 4; k++) B(c, -4 + k * 0.4, -8.6 + k * 0.3, 0.3, 1.4, "#c89a40"); }
    } },
    buestensaeule: { at: "f", w: 1, box: [-9, -38, 9, 3], s(c, R, v) {
      const m = "#c8c0b8"; shadow(c, 0, 0.5, 6, 1.4, 0.45);
      B(c, -5, -3, 10, 3, sh(m, -0.2)); c.fillStyle = lg(c, -3.6, 0, 3.6, 0, [sh(m, 0.2), m, sh(m, -0.4)]); c.fillRect(-3.4, -20, 6.8, 17); for (let k = -2.4; k < 3; k += 1.6) B(c, k, -19, 0.5, 15, "rgba(0,0,0,.15)"); B(c, -5, -22, 10, 2.4, sh(m, -0.1)); B(c, -5, -22, 10, 0.4, "rgba(255,255,255,.4)");
      for (let k = 0; k < 4; k++) Ln(c, "rgba(120,110,110,.35)", 0.2, [-3 + R() * 6, -20 + R() * 4, -3 + R() * 6, -10 - R() * 6]);
      const bc = ["#c8c0b8", "#a8a098", "#b8a060"][v];
      c.fillStyle = lg(c, -6, 0, 6, 0, [sh(bc, 0.3), bc, sh(bc, -0.45)]); c.beginPath(); c.moveTo(-6, -22); c.quadraticCurveTo(-6, -27, -2, -28); c.lineTo(2, -28); c.quadraticCurveTo(6, -27, 6, -22); c.fill(); B(c, -1.6, -29.6, 3.2, 2, sh(bc, -0.15));
      c.fillStyle = lg(c, -3, 0, 3, 0, [sh(bc, 0.3), bc, sh(bc, -0.45)]); c.beginPath(); c.ellipse(0, -32.4, 3, 3.6, 0, 0, TAU); c.fill(); P(c, sh(bc, -0.2), [2.6, -33, 3.6, -31.4, 2.6, -31]);
      if (v === 0) { for (let k = 0; k < 7; k++) E(c, -2.6 + k * 0.9, -35.2 + Math.sin(k) * 0.4, 0.9, 0.7, sh(bc, -0.1)); } else if (v === 1) { c.strokeStyle = "#5a7a3a"; c.lineWidth = 0.6; c.beginPath(); c.arc(0, -33.2, 3.2, PI * 1.05, PI * 1.95); c.stroke(); } else { P(c, "#c8a040", [-3, -35, -2, -37.6, -1, -35.4, 0, -38, 1, -35.4, 2, -37.6, 3, -35]); }
      B(c, 0.6, -33.2, 0.6, 0.4, "rgba(0,0,0,.4)"); B(c, 1.8, -33.2, 0.5, 0.4, "rgba(0,0,0,.4)");
    } },
    kamin: { at: "f", w: 3, box: [-28, -48, 28, 4], s(c, R, v) {
      shadow(c, 0, 0.5, 26, 2.2, 0.5);
      for (let r = 0; r < 9; r++) for (let k = 0; k < 2; k++) { const x = k ? 14 : -24, y = -4 - r * 4; stein(c, [x, y, x + 10, y, x + 10, y + 3.8, x, y + 3.8], "#7a6a68", R); }
      c.fillStyle = "#120a08"; c.beginPath(); c.moveTo(-14, 0); c.lineTo(-14, -26); c.quadraticCurveTo(0, -34, 14, -26); c.lineTo(14, 0); c.fill();
      c.fillStyle = rg(c, 0, -4, 18, ["rgba(140,50,10,.8)", "rgba(60,20,8,.5)", "rgba(20,8,4,0)"]); c.fillRect(-14, -30, 28, 30);
      for (let k = 0; k < 9; k++) stein(c, [-16 + k * 3.6, -30 - Math.sin(k / 8 * PI) * 4, -12.4 + k * 3.6, -30 - Math.sin((k + 1) / 8 * PI) * 4, -12.4 + k * 3.6, -27 - Math.sin((k + 1) / 8 * PI) * 3, -16 + k * 3.6, -27 - Math.sin(k / 8 * PI) * 3], "#8a7a78", R);
      wood(c, -27, -40, 54, 3, "#5a3820", R, false); B(c, -27, -37, 54, 1, "rgba(0,0,0,.4)");
      for (let r = 0; r < 2; r++) for (let k = 0; k < 6; k++) stein(c, [-24 + k * 8 + r * 4, -44 - r * 0 + 0, -16.4 + k * 8 + r * 4, -44, -16.4 + k * 8 + r * 4, -40, -24 + k * 8 + r * 4, -40], "#6a5a58", R);
      kerze(c, -22, -40, 4, 1.4); kerze(c, 22, -40, 3.2, 1.4); krug(c, -16, -40, 4, "#c8a040"); if (v === 0) schaedel(c, 12, -42.2, 2.2, 0.2); else if (v === 1) { for (let k = 0; k < 3; k++) buch(c, 9 + k * 2, -46, 1.8, 6, ["#6a2a2a", "#2a4a3a", "#4a2a5a"][k], R); } else { B(c, 8, -46, 8, 6, "#8a6a2a"); B(c, 9, -45, 6, 4, "#3a2a2a"); }
      for (const [x, a] of [[-4, 0.15], [4, -0.15], [0, 0]]) { c.save(); c.translate(x, -2.4 - (a ? 0 : 1.8)); c.rotate(a); wood(c, -6, -1.2, 12, 2.4, "#4a2e1a", R, false); E(c, 6, 0, 0.8, 1.2, "#b08a5a"); c.restore(); }
      metal(c, -10, -1.4, 20, 1.4, "#2a2628"); for (const x of [-8, 8]) { metal(c, x - 0.6, -5, 1.2, 4, "#2a2628"); E(c, x, -5.4, 0.9, 0.9, "#3a3436"); }
    }, fls: [[-4, -5, 1.5, null, "w"], [3, -4.6, 1.3, null, "e"], [0, -6, 1.8, null, "w"], [-22, -44.4, 0.5], [22, -43.6, 0.5]], holeR: [0, -12, 70, 0.75],
      a(c, p, t) { glow(0, -4, 22, 0.5, "e"); for (let k = 0; k < 6; k++) { const u = (t * 0.6 + k / 6 + p.s) % 1; E(c, -6 + k * 2.4 + Math.sin(u * 9) * 1.4, -4 - u * 22, 0.3, 0.3, "rgba(255,180,90," + (1 - u) * 0.8 + ")"); } } },
    /* Hallen-Wand */
    portraet: { at: "w", nv: 6, box: [-14, -44, 14, -6], s(c, R, v) {
      const w = 16, h = 20, px = -w / 2, py = -36;
      B(c, px - 2.6, py - 2.6, w + 5.2, h + 5.2, "rgba(0,0,0,.35)");
      c.fillStyle = lg(c, px - 3, py - 3, px + w + 3, py + h + 3, ["#e8c060", "#a8782a", "#6a4a1a", "#c8a040"]); c.fillRect(px - 3, py - 3, w + 6, h + 6);
      B(c, px - 1.4, py - 1.4, w + 2.8, h + 2.8, "#5a3a14"); for (let k = 0; k < 8; k++) { E(c, px - 1.5 + k * (w + 3) / 7, py - 2.2, 0.5, 0.5, "#f0d070"); E(c, px - 1.5 + k * (w + 3) / 7, py + h + 2.2, 0.5, 0.5, "#c8a040"); }
      for (const [cx2, cy2] of [[px - 2.2, py - 2.2], [px + w + 2.2, py - 2.2], [px - 2.2, py + h + 2.2], [px + w + 2.2, py + h + 2.2]]) E(c, cx2, cy2, 1.3, 1.3, "#e8c060");
      const bgc = ["#2a1e1a", "#1a2a22", "#2a1a2a", "#2a221a", "#1e1a2a", "#2a1a14"][v]; c.fillStyle = rg(c, px + w / 2, py + h * 0.4, w, [sh(bgc, 0.25), bgc, sh(bgc, -0.5)]); c.fillRect(px, py, w, h);
      const FACES = ["#6f9a3a", "#d8d0bc", "#8a6a9a", "#c8a080", "#5a7a6a", "#b85a3a"], fc = FACES[v], cx = px + w / 2;
      const robe = ["#3a2a3a", "#5a1a20", "#2e2a2a", "#4a3a1a", "#2a3a2a", "#3a1a14"][v];
      c.fillStyle = lg(c, px, 0, px + w, 0, [sh(robe, 0.2), robe, sh(robe, -0.4)]); c.beginPath(); c.moveTo(px + 1, py + h); c.quadraticCurveTo(cx, py + h - 10, px + w - 1, py + h); c.fill();
      B(c, cx - 1.4, py + h - 5, 2.8, 5, sh(fc, -0.2));
      c.fillStyle = rg(c, cx - 1.4, py + 7, 6, [sh(fc, 0.25), fc, sh(fc, -0.35)]); c.beginPath(); c.ellipse(cx, py + 8.4, 4, 5, 0, 0, TAU); c.fill();
      if (v === 0) { P(c, fc, [cx - 4, py + 7, cx - 7.4, py + 4.6, cx - 3.6, py + 9]); P(c, fc, [cx + 4, py + 7, cx + 7.4, py + 4.6, cx + 3.6, py + 9]); B(c, cx - 2, py + 11, 0.6, 1.2, "#f0e8d0"); B(c, cx + 1.4, py + 11, 0.6, 1.2, "#f0e8d0"); }
      if (v === 1) { c.fillStyle = "#4a3a2a"; c.beginPath(); c.moveTo(cx - 4.6, py + 6); c.lineTo(cx, py + 0.4); c.lineTo(cx + 4.6, py + 6); c.fill(); E(c, cx, py + 13, 2.6, 2, "#e8e0d0"); }
      if (v === 2) { for (const sd of [-1, 1]) P(c, "#3a2a3a", [cx + sd * 2, py + 4.4, cx + sd * 4.4, py - 0.6, cx + sd * 3.6, py + 4.8]); }
      if (v === 3) { c.fillStyle = "#c8a040"; c.beginPath(); c.moveTo(cx - 4, py + 4); for (let k = 0; k <= 4; k++) c.lineTo(cx - 4 + k * 2, py + (k % 2 ? 2.4 : 0.4)); c.lineTo(cx + 4, py + 4); c.fill(); E(c, cx, py + 1.6, 0.6, 0.6, "#a83030"); }
      if (v === 4) { B(c, cx - 4, py + 3, 8, 2, "#c8c0b0"); E(c, cx, py + 12.6, 2.6, 1.4, "#c8c0b0"); }
      if (v === 5) { c.fillStyle = "#7a2a1a"; c.beginPath(); c.ellipse(cx, py + 5, 5, 3, 0, PI, 0); c.fill(); Ln(c, "#2a1010", 0.5, [cx - 3, py + 8, cx - 0.6, py + 8.4]); }
      B(c, cx - 2, py + 7.6, 1, 1, "#1a1014"); B(c, cx + 1, py + 7.6, 1, 1, "#1a1014"); B(c, cx - 1.8, py + 7.6, 0.35, 0.35, "rgba(255,255,255,.6)"); B(c, cx + 1.2, py + 7.6, 0.35, 0.35, "rgba(255,255,255,.6)");
      c.strokeStyle = "#1a1014"; c.lineWidth = 0.45; c.beginPath(); c.arc(cx, py + 9.6, 1.6, 0.25, PI - 0.25); c.stroke();
      c.fillStyle = lg(c, px, py, px + w, py + h, ["rgba(255,240,200,.14)", "rgba(255,240,200,0)", "rgba(0,0,0,.18)"]); c.fillRect(px, py, w, h);
      for (let k = 0; k < 6; k++) Ln(c, "rgba(0,0,0,.18)", 0.15, [px + R() * w, py + R() * h, px + R() * w, py + R() * h]);
      metal(c, cx - 3.4, py + h + 3.4, 6.8, 1.6, "#c8a040"); B(c, cx - 2.4, py + h + 4, 4.8, 0.3, "rgba(60,30,10,.6)");
    } },
    wandteppich: { at: "w", box: [-14, -44, 14, -2], s(c, R, v) {
      wood(c, -12, -38, 24, 1.6, "#4a2e1a", R, false); E(c, -12.4, -37.2, 1.2, 1.2, "#c8a040"); E(c, 12.4, -37.2, 1.2, 1.2, "#c8a040");
    }, a(c, p, t) {
      const w = 18, h = 28, px = -w / 2, py = -36.4, sw = Math.sin(t * 0.7 + p.s * 5) * 0.6;
      const cols = [["#5a1a24", "#c8a040", "#2a4a2a"], ["#2a3a24", "#d8b860", "#7a1a20"], ["#3a1a3a", "#c88a40", "#5a1a24"]][p.v];
      c.fillStyle = cols[0]; c.beginPath(); c.moveTo(px, py); c.lineTo(px + w, py); c.lineTo(px + w + sw, py + h); c.lineTo(px + sw, py + h); c.fill();
      for (let k = 1; k < 6; k++) Ln(c, "rgba(0,0,0,.18)", 0.6, [px + k * 3, py + 1, px + k * 3 + sw * 0.9, py + h]);
      c.strokeStyle = cols[1]; c.lineWidth = 0.6; c.strokeRect(px + 1.4, py + 1.4, w - 2.8 + sw * 0.4, h - 2.8);
      for (let k = 0; k < 7; k++) { B(c, px + 2.4 + k * 2, py + 2.6, 1, 1, cols[2]); B(c, px + 2.4 + k * 2 + sw * 0.9, py + h - 3.6, 1, 1, cols[2]); }
      const mx = px + w / 2 + sw * 0.45, my = py + h * 0.48;
      if (p.v === 0) { E(c, mx, my, 2.6, 2.6, cols[1]); for (let k = 0; k < 10; k++) { const a = k / 10 * TAU; Ln(c, cols[1], 0.5, [mx + Math.cos(a) * 3.2, my + Math.sin(a) * 3.2, mx + Math.cos(a) * 5.2, my + Math.sin(a) * 5.2]); } E(c, mx, my, 1.3, 1.3, cols[2]); }
      else if (p.v === 1) { P(c, cols[1], [mx - 4, my + 6, mx - 4, my - 2, mx - 2, my, mx, my - 4, mx + 2, my, mx + 4, my - 2, mx + 4, my + 6]); E(c, mx, my - 5.6, 1, 1, cols[2]); }
      else { c.fillStyle = cols[1]; c.beginPath(); c.moveTo(mx - 5, my + 5); c.quadraticCurveTo(mx - 2, my - 6, mx + 2, my - 4); c.lineTo(mx + 5, my - 6); c.lineTo(mx + 3, my - 2); c.quadraticCurveTo(mx + 1, my + 2, mx + 4, my + 5); c.fill(); E(c, mx + 2.6, my - 4.2, 0.5, 0.5, cols[2]); }
      c.fillStyle = "rgba(255,240,210,.08)"; c.fillRect(px, py, 3, h);
      for (let k = 0; k < 6; k++) { B(c, px + 1 + k * 3.2 + sw, py + h, 0.8, 2.8, cols[1]); E(c, px + 1.4 + k * 3.2 + sw * 1.05, py + h + 3, 0.6, 0.6, sh(cols[1], -0.2)); }
    } },
    geweih: { at: "w", box: [-16, -44, 16, -14], s(c, R, v) {
      c.fillStyle = lg(c, -5, -28, 5, -20, ["#7a5030", "#4a2e1a"]); c.beginPath(); c.moveTo(-5, -26); c.quadraticCurveTo(0, -30, 5, -26); c.lineTo(4, -20); c.quadraticCurveTo(0, -17.6, -4, -20); c.fill(); c.strokeStyle = "#c8a040"; c.lineWidth = 0.4; c.stroke();
      if (v === 2) { /* ausgestopfter Eberkopf */ E(c, 0, -22, 4, 3.2, "#5a4030"); P(c, "#4a3020", [2, -22.6, 7, -21.6, 7, -19.8, 2, -20]); E(c, 7, -20.6, 0.8, 1, "#c88a7a"); P(c, "#efe6d0", [5, -19.8, 6, -18, 5.6, -19.8]); B(c, 1, -23.6, 0.8, 0.8, "#0a0606"); P(c, "#4a3020", [-2, -24.6, -3.6, -27, -0.6, -25]); return; }
      E(c, 0, -23, 2.4, 3, "#6a5038"); E(c, 0, -20.6, 1.2, 1, "#2a1a14");
      c.lineCap = "round"; for (const d of [-1, 1]) { const ln = (x0, y0, cx, cy, x1, y1, w) => { c.strokeStyle = "#8a7a60"; c.lineWidth = w + 0.3; c.beginPath(); c.moveTo(x0, y0); c.quadraticCurveTo(cx, cy, x1, y1); c.stroke(); c.strokeStyle = "#e0d0b0"; c.lineWidth = w; c.beginPath(); c.moveTo(x0, y0); c.quadraticCurveTo(cx, cy, x1, y1); c.stroke(); };
        ln(d * 1.6, -25.6, d * 8, -28, d * 10, -38, 1.2); ln(d * 5.6, -27.6, d * 3.4, -32, d * 4, -35, 0.8); ln(d * 8, -31.4, d * 12, -32, d * 13.6, -35.4, 0.8); if (v === 1) ln(d * 9.4, -35, d * 7, -38, d * 6.6, -40.6, 0.6); }
      c.lineCap = "butt";
    } },
    spiegel: { at: "w", box: [-12, -46, 12, -10], s(c, R, v) {
      const cx = 0, cy = -30; c.fillStyle = lg(c, -9, -42, 9, -16, ["#e8c060", "#8a6020", "#c8a040"]); c.beginPath(); c.ellipse(cx, cy, 8.4, 11.4, 0, 0, TAU); c.fill();
      for (let k = 0; k < 14; k++) { const a = k / 14 * TAU; E(c, cx + Math.cos(a) * 8, cy + Math.sin(a) * 11, 0.8, 0.8, "#f0d070"); }
      P(c, "#c8a040", [-3, -41, 0, -45, 3, -41]); E(c, 0, -42.4, 1, 1, "#a83030");
      c.fillStyle = lg(c, -6, -40, 6, -20, ["#8a8478", "#4a4640", "#2a2824", "#5a564e"]); c.beginPath(); c.ellipse(cx, cy, 6.6, 9.6, 0, 0, TAU); c.fill();
      c.save(); c.beginPath(); c.ellipse(cx, cy, 6.6, 9.6, 0, 0, TAU); c.clip(); P(c, "rgba(255,250,235,.28)", [-6, -34, -2, -40, 2, -40, -6, -26]); P(c, "rgba(255,250,235,.12)", [0, -24, 6, -32, 6, -28, 2, -22]); if (v === 2) { Ln(c, "rgba(255,255,255,.6)", 0.25, [-2, -38, 1, -30, -1, -26, 3, -22]); Ln(c, "rgba(255,255,255,.5)", 0.2, [1, -30, 4, -31]); } c.restore();
    } },
    wandleuchter: { at: "w", box: [-10, -40, 10, -12], s(c, R, v) {
      const g = "#c8a040"; c.fillStyle = lg(c, -2.4, -30, 2.4, -20, [sh(g, 0.3), g, sh(g, -0.4)]); c.beginPath(); c.ellipse(0, -24, 2.2, 5, 0, 0, TAU); c.fill(); E(c, 0, -24, 1, 1, "#a83030");
      c.strokeStyle = g; c.lineWidth = 0.9; c.beginPath(); c.moveTo(0, -21); c.quadraticCurveTo(-6, -21, -6, -26); c.moveTo(0, -21); c.quadraticCurveTo(6, -21, 6, -26); c.stroke();
      for (const x of [-6, 6]) { E(c, x, -26.4, 1.8, 0.6, sh(g, 0.1)); kerze(c, x, -26.6, 4, 1.2); }
      P(c, g, [-0.8, -19, 0.8, -19, 0, -16]);
    }, fls: [[-6, -31.5, 0.55], [6, -31.5, 0.55]], holeR: [0, -30, 34, 0.45] },
    wappen: { at: "w", box: [-17, -46, 17, -8], s(c, R, v) {
      for (const a of [-0.7, 0.7]) { c.save(); c.translate(0, -26); c.rotate(a); metal(c, -0.8, -17, 1.6, 22, "#b4b2ae"); Ln(c, "rgba(255,255,255,.6)", 0.3, [-0.3, -16.6, -0.3, 4]); P(c, "#b4b2ae", [-0.8, -17, 0, -19.6, 0.8, -17]); metal(c, -3, 5, 6, 1.2, "#b8923a"); B(c, -0.6, 6.2, 1.2, 4.4, "#3a2414"); E(c, 0, 11, 1, 1, "#b8923a"); c.restore(); }
      const col = ["#7a1a20", "#2a4a2a", "#3a2a4a"][v];
      c.fillStyle = "rgba(0,0,0,.35)"; c.beginPath(); c.moveTo(-7, -33); c.lineTo(9, -33); c.lineTo(9, -24); c.quadraticCurveTo(1, -14, -7, -24); c.fill();
      c.fillStyle = lg(c, -8, -34, 8, -16, ["#e8c060", "#a8782a"]); c.beginPath(); c.moveTo(-8.6, -34.6); c.lineTo(8.6, -34.6); c.lineTo(8.6, -25); c.quadraticCurveTo(0, -14, -8.6, -25); c.closePath(); c.fill();
      c.fillStyle = lg(c, -7, -33, 7, -17, [sh(col, 0.25), col, sh(col, -0.4)]); c.beginPath(); c.moveTo(-7.4, -33.4); c.lineTo(7.4, -33.4); c.lineTo(7.4, -25); c.quadraticCurveTo(0, -16, -7.4, -25); c.closePath(); c.fill();
      c.save(); c.clip(); c.fillStyle = "rgba(232,216,160,.85)"; c.beginPath(); c.moveTo(-7.4, -33.4); c.lineTo(0, -33.4); c.lineTo(0, -16); c.lineTo(-7.4, -16); c.fill(); c.restore();
      c.fillStyle = "#c8a040"; c.beginPath(); c.moveTo(-3, -24); c.quadraticCurveTo(-4, -30, -1, -30); c.lineTo(1, -32); c.lineTo(1.6, -29); c.quadraticCurveTo(4, -27, 3, -22); c.lineTo(-2, -21); c.fill(); E(c, 0.6, -29.6, 0.4, 0.4, "#1a1014");
      for (let k = 0; k < 3; k++) { P(c, "#c8a040", [-4 + k * 4, -38, -3 + k * 4, -36, -2 + k * 4, -38]); } B(c, -5, -36.6, 10, 1.6, "#c8a040");
    } },
    landschaft: { at: "w", box: [-16, -44, 16, -10], s(c, R, v) {
      const w = 24, h = 16, px = -12, py = -36;
      c.fillStyle = lg(c, px - 2, py - 2, px + w + 2, py + h + 2, ["#8a6a3a", "#5a3a1a", "#7a5a2a"]); c.fillRect(px - 2, py - 2, w + 4, h + 4); B(c, px - 2, py - 2, w + 4, 0.5, "rgba(255,220,160,.35)");
      const skies = [["#e8a060", "#a8506a", "#4a2a4a"], ["#f0c070", "#d8784a", "#6a3a3a"], ["#c8b890", "#8a8a6a", "#4a4a3a"]][v];
      c.fillStyle = lg(c, 0, py, 0, py + h, skies.slice().reverse()); c.fillRect(px, py, w, h);
      E(c, px + w * 0.7, py + h * 0.45, 2.4, 2.4, "#ffe0a0");
      c.fillStyle = "#4a3a3a"; c.beginPath(); c.moveTo(px, py + h * 0.62); c.lineTo(px + 6, py + h * 0.3); c.lineTo(px + 10, py + h * 0.5); c.lineTo(px + 15, py + h * 0.25); c.lineTo(px + w, py + h * 0.6); c.lineTo(px + w, py + h); c.lineTo(px, py + h); c.fill();
      c.fillStyle = "#2e3a22"; c.beginPath(); c.moveTo(px, py + h * 0.8); c.quadraticCurveTo(px + w * 0.4, py + h * 0.6, px + w, py + h * 0.78); c.lineTo(px + w, py + h); c.lineTo(px, py + h); c.fill();
      if (v === 0) { B(c, px + 4, py + h * 0.56, 1.6, 3, "#2a2028"); P(c, "#2a2028", [px + 3.6, py + h * 0.56, px + 4.8, py + h * 0.42, px + 6, py + h * 0.56]); }
      for (let k = 0; k < 4; k++) { const tx = px + 2 + k * 6 + R() * 2; E(c, tx, py + h * 0.82, 1.4, 2, "#1e2a16"); }
      c.fillStyle = "rgba(255,240,200,.1)"; c.fillRect(px, py, w, h * 0.3);
    } },
    /* ---------- Decke ---------- */
    spinne: { at: "c", crit: true, must: true, noflip: true, len: 4, a(c, p, t) {
      const P0 = Z.player, wx = cx0;
      let target = 18 + Math.sin(t * 0.4 + p.s * 30) * 8 + p.s * 14;
      if (P0 && Math.abs(P0.x + P0.w / 2 - wx) < 36 && P0.y > cy0) target = Math.min(p.fall - 6, Math.max(10, P0.y - cy0 - 4));
      if (P0 && Math.abs(P0.x + P0.w / 2 - wx) < 14) target = 6;
      const zip = p.zip && t < p.zip; if (zip) target = 2.5;
      target = Math.min(target, p.fall - 6);
      p.l = p.l == null ? target : p.l + (target - p.l) * (zip ? 0.12 : 0.03);
      const y = p.l, sw = Math.sin(t * 0.9 + p.s * 9) * 0.8;
      Ln(c, "rgba(230,226,236,.45)", 0.25, [0, 0, sw, y - 2]);
      c.save(); c.translate(sw, y);
      c.strokeStyle = "#1a1418"; c.lineWidth = 0.45;
      for (const sd of [-1, 1]) for (let k = 0; k < 4; k++) { const wig = Math.sin(t * 6 + k + sd) * 0.5; c.beginPath(); c.moveTo(sd * 0.8, -0.4 + k * 0.6); c.quadraticCurveTo(sd * (2.6 + k * 0.3), -2.4 + k * 1.2 + wig, sd * (3.6 + k * 0.2), 0.6 + k * 1.1 + wig); c.stroke(); }
      E(c, 0, -1.6, 1.6, 2, "#2a2028"); E(c, 0, 0.7, 1.1, 1, "#1a1418"); E(c, -0.5, -2.2, 0.5, 0.6, "rgba(255,240,240,.18)"); B(c, -0.6, -2.8, 1.2, 0.3, "#8a2a2a");
      E(c, -0.4, 1.2, 0.2, 0.2, "#c84a4a"); E(c, 0.4, 1.2, 0.2, 0.2, "#c84a4a");
      c.restore();
    } },
    tropfen: { at: "c", crit: true, must: true, noflip: true, len: 3, a(c, p, t) {
      E(c, 0, 0.6, 2.4, 0.9, "rgba(30,40,30,.45)"); E(c, 0, 0.4, 1.2, 0.5, "rgba(140,160,130,.35)");
      if (p.fall > 8) { E(c, 0, p.fall - 0.2, 5 + p.s * 3, 0.9, "rgba(40,50,40,.35)"); E(c, -1, p.fall - 0.4, 2.4, 0.3, "rgba(200,210,190,.25)"); }
      tropfAnim(c, 0, 0.6, Math.max(4, p.fall - 0.6), t, p.s * 10);
      if (p.s > 0.5) tropfAnim(c, 3, 0.4, Math.max(4, p.fall - 0.6), t * 0.8, p.s * 3);
    } },
    fledermaus: { at: "c", crit: true, noflip: true, len: 3, a(c, p, t) {
      if (p.gone && t < p.gone) return;
      if (p.flyT == null && nahe(cx0, cy0 + 8, 54)) p.flyT = t;
      const n = 2 + (p.v % 2);
      for (let i = 0; i < n; i++) {
        const bx = -5 + i * 5 + (i % 2) * 0.6, by = 0;
        c.save();
        if (p.flyT != null) { const u = t - p.flyT - i * 0.12; if (u > 2.4) { if (i === n - 1) { p.flyT = null; p.gone = t + 25; } c.restore(); continue; } if (u > 0) { const d = i % 2 ? 1 : -1; c.translate(bx + d * u * 60 + Math.sin(u * 9) * 4, by + 6 + Math.sin(u * 5) * 6 - u * 10); c.globalAlpha = Math.max(0, 1 - u / 2.4); const fw = Math.sin(t * 34 + i) * 3; E(c, 0, 0, 1.4, 1.1, "#2a2026"); P(c, "#1e161c", [-1, 0, -5, -fw, -3.6, 1, -6, 1.2 - fw * 0.5, -1, 1]); P(c, "#1e161c", [1, 0, 5, -fw, 3.6, 1, 6, 1.2 - fw * 0.5, 1, 1]); P(c, "#2a2026", [-1, -1, -0.6, -2.2, 0, -1.2, 0.6, -2.2, 1, -1]); c.restore(); continue; } }
        c.translate(bx, by + Math.sin(t * 1.3 + i * 2) * 0.2);
        Ln(c, "#2a2026", 0.3, [-0.4, 0, -0.4, 1]); Ln(c, "#2a2026", 0.3, [0.4, 0, 0.4, 1]);
        const st = Math.sin(t * 0.7 + i * 2 + p.s * 9) > 0.93 ? 1 : 0;
        if (st) { const fw = Math.sin(t * 20) * 0.6; P(c, "#1e161c", [-0.8, 1.4, -4.4, 1.6 + fw, -3, 3.6, -4.6, 4.8, -0.8, 4]); P(c, "#1e161c", [0.8, 1.4, 4.4, 1.6 + fw, 3, 3.6, 4.6, 4.8, 0.8, 4]); }
        c.fillStyle = "#2a2026"; c.beginPath(); c.moveTo(-1.6, 1); c.quadraticCurveTo(-2, 4, -1, 5.4); c.lineTo(1, 5.4); c.quadraticCurveTo(2, 4, 1.6, 1); c.fill(); E(c, -0.6, 2.2, 0.4, 1.4, "rgba(255,230,220,.1)");
        E(c, 0, 6, 1.2, 1.1, "#3a2e30"); P(c, "#3a2e30", [-1.1, 6.4, -1.4, 8, -0.4, 6.8]); P(c, "#3a2e30", [1.1, 6.4, 1.4, 8, 0.4, 6.8]); B(c, -0.6, 5.8, 0.3, 0.3, "#d8a040"); B(c, 0.3, 5.8, 0.3, 0.3, "#d8a040");
        c.restore();
      }
    } },
    laterne_h: { at: "c", len: 4, box: [-8, -1, 8, 34], s(c, R, v) {
      metal(c, -2, 0, 4, 1.2, "#3a3436"); rivet(c, 0, 0.6, 0.4);
    }, a(c, p, t) {
      const L = 12 + p.v * 3, a = Math.sin(t * 0.9 + p.s * 9) * 0.06; c.save(); c.rotate(a);
      kette(c, 0, 1, 0, L, "#3a3436");
      P(c, "#2e2628", [-4, L + 3, 0, L, 4, L + 3]); B(c, -3.6, L + 3, 7.2, 0.8, "#3a3032");
      c.fillStyle = "rgba(255,200,110,.9)"; c.fillRect(-2.8, L + 3.8, 5.6, 7); B(c, -2.8, L + 3.8, 5.6, 7, "rgba(255,240,200,.2)");
      for (const gx of [-3, -0.3, 2.4]) B(c, gx, L + 3.6, 0.6, 7.6, "#2a2224"); B(c, -3.2, L + 7, 6.4, 0.5, "#2a2224");
      P(c, "#2e2628", [-3.4, L + 10.8, 3.4, L + 10.8, 1.6, L + 12.4, -1.6, L + 12.4]);
      c.restore();
      const fx = Math.sin(a) * -(L + 8); fl(fx, L + 9.6, 0.55, p.s * 20); hole(fx, L + 7, 40, 0.5);
    } },
    kraeuter: { at: "c", len: 3, box: [-14, -1, 14, 18], s(c, R, v) {
      seil(c, [-13, 1, 0, 2.4, 13, 1], "#a08050", 0.5);
      for (let k = 0; k < 5; k++) { const x = -10 + k * 5, col = [["#5a7a3a", "#7a8a4a"], ["#6a5a3a", "#8a7a4a"], ["#7a4a5a", "#5a6a3a"]][v][k % 2];
        Ln(c, "#8a7a5a", 0.4, [x, 2, x, 4]); B(c, x - 0.8, 3.8, 1.6, 1, "#a07a4a");
        for (let q = 0; q < 9; q++) { const a = (q / 8 - 0.5) * 0.9; c.save(); c.translate(x, 4.6); c.rotate(a); Ln(c, sh(col, -0.2), 0.3, [0, 0, 0, 8 + R() * 3]); E(c, 0, 5 + R() * 4, 0.7, 1.3, q % 2 ? col : sh(col, 0.15)); E(c, 0.3, 8 + R() * 2, 0.6, 1.1, sh(col, -0.1)); c.restore(); }
        if (v === 2 && k % 2) for (let q = 0; q < 3; q++) E(c, x - 1 + q, 12 + q * 0.5, 0.6, 0.6, "#a85a8a"); }
    } },
    kronleuchter_k: { at: "c", len: 4, box: [-2, -1, 2, 2], s(c) { metal(c, -1.6, 0, 3.2, 1.2, "#3a3436"); }, a(c, p, t) {
      const L = 10, a = Math.sin(t * 0.6 + p.s * 9) * 0.03; c.save(); c.rotate(a); kette(c, 0, 1, 0, L, "#5a4a2a");
      const g = "#c8a040"; E(c, 0, L + 2, 1.6, 2.4, g); c.strokeStyle = g; c.lineWidth = 0.8; c.beginPath(); c.ellipse(0, L + 4, 10, 1.6, 0, 0, PI); c.stroke(); c.lineWidth = 0.4; c.beginPath(); c.ellipse(0, L + 4, 10, 1.6, 0, PI, TAU); c.stroke();
      for (let k = 0; k < 5; k++) { const ax = -10 + k * 5, ay = L + 4 + Math.sin((k / 4) * PI) * 1.6; Q(c, g, 0.5, 0, L + 3, ax * 0.6, L + 1, ax, ay - 0.6); B(c, ax - 1, ay - 1, 2, 0.6, g); kerze(c, ax, ay - 1, 2.6, 1); P(c, g, [ax - 0.5, ay, ax + 0.5, ay, ax, ay + 1.6]); }
      E(c, 0, L + 6.6, 0.8, 1.4, g); c.restore();
      for (let k = 0; k < 5; k++) { const ax = -10 + k * 5, ay = L + 4 + Math.sin((k / 4) * PI) * 1.6; fl(ax + Math.sin(a) * -(L + 2), ay - 3.8, 0.45, p.s * 30 + k); } hole(0, L + 2, 48, 0.5);
    } }
  });
  /* ---------- Wehrgang / Zinnen ---------- */
  function kugelHaufen(c, x, n, r, col) { const rows = n === 6 ? [3, 2, 1] : n === 3 ? [2, 1] : [4, 3, 2, 1]; let i = 0; rows.forEach((m, row) => { for (let k = 0; k < m; k++) { const bx = x + (k - (m - 1) / 2) * r * 2.05, by = -r - row * r * 1.75; c.fillStyle = rg(c, bx - r * 0.35, by - r * 0.4, r * 1.3, [sh(col, 0.35), col, sh(col, -0.55)]); c.beginPath(); c.arc(bx, by, r, 0, TAU); c.fill(); E(c, bx - r * 0.35, by - r * 0.4, r * 0.3, r * 0.2, "rgba(255,240,220,.35)"); if ((i++ + row) % 3 === 0) E(c, bx + r * 0.3, by + r * 0.2, r * 0.35, r * 0.25, "rgba(140,70,30,.4)"); } }); }
  Object.assign(K, {
    kanonenkugeln: { at: "f", w: 1, box: [-10, -16, 10, 3], s(c, R, v) { shadow(c, 0, 0.5, 9, 1.6, 0.45); kugelHaufen(c, 0, v === 1 ? 3 : v === 2 ? 10 : 6, v === 2 ? 1.8 : 2.4, "#3c3a38"); if (v === 1) { c.save(); c.translate(6, -1); E(c, 0, 0, 2.4, 2.4, "#3c3a38"); c.restore(); } } },
    kanone: { at: "f", w: 3, box: [-30, -22, 30, 4], s(c, R, v) {
      shadow(c, 0, 0.5, 24, 2.2, 0.5);
      c.fillStyle = "#5a3a22"; c.beginPath(); c.moveTo(-18, -3); c.lineTo(10, -3); c.lineTo(8, -11); c.lineTo(-12, -13); c.lineTo(-18, -9); c.fill(); wood(c, -18, -9.4, 28, 1.6, "#6a4428", R, false); band(c, -16, -6, 24, 0.8);
      const br = "#a87a3a"; c.save(); c.translate(-6, -13); c.rotate(-0.12);
      c.fillStyle = lg(c, 0, -4.6, 0, 4.6, [sh(br, 0.35), br, sh(br, -0.5)]); c.beginPath(); c.moveTo(-10, -4.2); c.lineTo(26, -3); c.lineTo(26, 3); c.lineTo(-10, 4.2); c.quadraticCurveTo(-14, 0, -10, -4.2); c.fill();
      for (const x of [-6, 4, 16, 24]) { c.fillStyle = lg(c, 0, -5, 0, 5, [sh(br, 0.25), sh(br, -0.3)]); c.fillRect(x, -4.4 + x * 0.03, 1.6, 8.8 - x * 0.06); }
      E(c, 26.4, 0, 1.2, 3.6, sh(br, -0.2)); E(c, 26.8, 0, 0.6, 2, "#140c08"); E(c, -14, 0, 1.6, 1.6, sh(br, -0.1)); B(c, -4, -4.8, 1, 0.8, "#2a1a10"); Ln(c, "rgba(255,240,200,.5)", 0.4, [-8, -3.2, 24, -2.4]);
      E(c, 6, 1.5, 2.6, 1.2, "rgba(60,90,60,.35)"); c.restore();
      for (const wx of [-12, 6]) { E(c, wx, -4.6, 4.6, 4.6, "#4a2e1a"); c.strokeStyle = "#3a3436"; c.lineWidth = 0.8; c.beginPath(); c.arc(wx, -4.6, 4.4, 0, TAU); c.stroke(); for (let k = 0; k < 4; k++) { const a = k / 4 * PI + 0.3; Ln(c, "#6a4428", 0.9, [wx + Math.cos(a) * 3.6, -4.6 + Math.sin(a) * 3.6, wx - Math.cos(a) * 3.6, -4.6 - Math.sin(a) * 3.6]); } rivet(c, wx, -4.6, 0.8); }
      c.save(); c.translate(20, 0); c.rotate(-1.15); wood(c, 0, -0.5, 20, 1, "#7a5a32", R, false); E(c, 20, 0, 1.6, 1.2, "#3a2a1a"); c.restore();
      if (v !== 0) { E(c, -23, -0.5, 3, 0.7, "rgba(20,16,16,.6)"); for (let k = 0; k < 6; k++) E(c, -24 + R() * 4, -0.6, 0.3, 0.2, "#1a1414"); }
    } },
    pulverfass: { at: "f", w: 1, box: [-9, -18, 9, 3], s(c, R, v) {
      shadow(c, 0, 0.5, 7, 1.4, 0.45); fass(c, 0, 0, 10, 11, "#5a3a22", R);
      c.strokeStyle = "rgba(230,220,200,.6)"; c.lineWidth = 0.6; c.beginPath(); c.moveTo(-2.4, -7.4); c.lineTo(2.4, -3.4); c.moveTo(2.4, -7.4); c.lineTo(-2.4, -3.4); c.stroke(); schaedel(c, 0, -5.6, 1.4, 0);
      seil(c, [2, -11, 4, -12, 6, -11.4, 7.6, -9], "#c8b080", 0.4);
      for (let k = 0; k < 8; k++) E(c, -7 + R() * 14, -0.2, 0.25, 0.18, "#1a1414");
    } },
    koecherfass: { at: "f", w: 1, box: [-9, -26, 9, 3], s(c, R, v) {
      shadow(c, 0, 0.5, 7, 1.4, 0.45);
      for (let k = 0; k < 11; k++) { const a = (k - 5) * 0.06 + (R() - 0.5) * 0.05, x0 = -3.4 + k * 0.7; c.save(); c.translate(x0, -9); c.rotate(a); Ln(c, "#8a6a40", 0.4, [0, 0, 0, -12]); P(c, k % 3 ? "#e8e0d0" : "#a83030", [0, -12, -1, -14.6, 0, -15.6]); P(c, k % 3 ? "#d8d0c0" : "#8a2020", [0, -12, 1, -14.6, 0, -15.6]); c.restore(); }
      fass(c, 0, 0, 9, 10, "#6a4428", R, "#2a1a10");
      if (v === 1) { c.save(); c.translate(6, -1); c.rotate(-0.4); wood(c, -0.4, -18, 0.8, 18, "#6a4a28", R, true); c.strokeStyle = "#5a3a22"; c.lineWidth = 0.8; c.beginPath(); c.arc(-4, -9, 9.6, -0.95, 0.95); c.stroke(); Ln(c, "rgba(230,220,200,.6)", 0.2, [1.6, -16.6, 1.6, -1.4]); c.restore(); }
    } },
    kohlebecken: { at: "f", w: 1, box: [-10, -20, 10, 3], s(c, R, v) {
      shadow(c, 0, 0.5, 7, 1.4, 0.45);
      for (const [a, b] of [[-5, -2.4], [5, 2.4]]) Ln(c, "#4a4446", 0.9, [a, 0, b, -7]); Ln(c, "#3a3436", 0.9, [0, 0.3, 0, -7]);
      c.fillStyle = lg(c, -6, 0, 6, 0, ["#8a8688", "#4a4648", "#1e1a1c"]); c.beginPath(); c.moveTo(-6.4, -11.6); c.lineTo(6.4, -11.6); c.quadraticCurveTo(5, -6, 0, -6); c.quadraticCurveTo(-5, -6, -6.4, -11.6); c.fill();
      for (let k = -5; k < 6; k += 2.4) rivet(c, k, -10.6, 0.35);
      E(c, 0, -11.6, 6.4, 1.1, "#1a1012"); for (let k = 0; k < 9; k++) E(c, -5 + R() * 10, -11.8 - R() * 1.4, 1.1, 0.8, R() < 0.5 ? "#2a1a14" : "#8a2a10");
      if (v === 2) { for (const a of [-0.5, 0.35]) { c.save(); c.translate(0, -12); c.rotate(a); metal(c, -0.4, -12, 0.8, 12, "#4a4446"); B(c, -0.8, -13, 1.6, 1.4, "#3a2a1a"); c.restore(); } }
    }, fls: [[-1.6, -12.4, 1.1, null, "e"], [1.8, -12.2, 0.9, null, "w"], [0, -12.8, 1.3, null, "w"]], holeR: [0, -16, 50, 0.6], a(c, p, t) { glow(0, -11.6, 10, 0.5, "e"); if (rich() && Math.random() < 0.04) Z.fx.p({ x: cx0 + (Math.random() - 0.5) * 6, y: cy0 - 15, vx: (Math.random() - 0.5) * 12 + (Z.windX || 0) * 0.3, vy: -26, life: 0.9, size: 0.9, col: "#ffb060", kind: "spark", add: true }); } },
    schluesselbrett: { at: "w", box: [-14, -40, 14, -14], s(c, R, v) {
      wood(c, -12, -34, 24, 5, "#5a3a22", R, false); B(c, -12, -29, 24, 0.6, "rgba(0,0,0,.35)"); for (const x of [-10, 10]) rivet(c, x, -31.6, 0.5);
      c.fillStyle = "rgba(230,220,200,.35)"; c.font = "2.6px 'Alegreya Sans',sans-serif"; c.fillText(["I II III IV", "Z1 Z2 Z3", "+ + +"][v], -9, -30.2);
    }, a(c, p, t) {
      for (let k = 0; k < 5; k++) { const x = -8 + k * 4, miss = (k + p.v) % 4 === 3; B(c, x - 0.3, -29.4, 0.6, 1.4, "#3a3436"); if (miss) continue; const a = Math.sin(t * 1.3 + k + p.s * 9) * 0.08; c.save(); c.translate(x, -28.2); c.rotate(a);
        c.strokeStyle = "#b8923a"; c.lineWidth = 0.45; c.beginPath(); c.arc(0, 1.2, 1.1, 0, TAU); c.stroke(); metal(c, -0.3, 2.2, 0.6, 4.2 + (k % 2), k % 2 ? "#8e8c8a" : "#b8923a"); B(c, 0.3, 5.2 + (k % 2), 1.1, 0.5, k % 2 ? "#8e8c8a" : "#b8923a"); B(c, 0.3, 4.2 + (k % 2), 0.8, 0.4, k % 2 ? "#8e8c8a" : "#b8923a"); c.restore(); }
    } },
    /* ---------- Verlies ---------- */
    streckbank: { at: "f", w: 3, box: [-28, -20, 28, 4], s(c, R, v) {
      shadow(c, 0, 0.5, 24, 2, 0.5);
      for (const x of [-20, 17]) { wood(c, x, -10, 2.6, 10, "#4a2e1a", R, true); }
      wood(c, -22, -12, 44, 3, "#5a3a22", R, false); wood(c, -22, -9, 44, 1, "#3a2414", R, false);
      for (const x of [-12, 0, 10]) { E(c, x, -12.6, 2.6, 0.6, "rgba(60,20,16,.6)"); }
      for (const x of [-22, 22]) { E(c, x, -13, 3.4, 3.4, "#4a2e1a"); E(c, x, -13, 2.4, 2.4, "#5a3a22"); c.strokeStyle = "#3a3436"; c.lineWidth = 0.6; c.beginPath(); c.arc(x, -13, 3.4, 0, TAU); c.stroke(); for (let k = 0; k < 4; k++) { const a = k / 4 * TAU + 0.4; wood(c, x + Math.cos(a) * 3 - 0.4, -13 + Math.sin(a) * 3 - 0.4, 0.8 + Math.abs(Math.cos(a)) * 3, 0.8 + Math.abs(Math.sin(a)) * 3, "#6a4428", R); } rivet(c, x, -13, 0.6); }
      seil(c, [-20, -13.2, -10, -13, -6, -12.8], "#a08050", 0.6); seil(c, [20, -13.2, 10, -13, 6, -12.8], "#a08050", 0.6);
      for (const x of [-6, 6]) { metal(c, x - 1.2, -14, 2.4, 1.6, "#5a5456"); }
      if (v === 0) { schaedel(c, 9, -14.8, 1.8, 0.4); }
      for (let k = 0; k < 4; k++) E(c, -8 + R() * 16, -0.2, 1 + R() * 2, 0.4, "rgba(70,20,16,.5)");
    } },
    stroh: { at: "f", w: 2, box: [-16, -10, 16, 3], s(c, R, v) {
      c.fillStyle = lg(c, 0, -6, 0, 0, ["#b89850", "#8a7038", "#5a4820"]); c.beginPath(); c.moveTo(-14, 0); c.quadraticCurveTo(-12, -6, 0, -6); c.quadraticCurveTo(12, -6, 14, 0); c.fill();
      for (let k = 0; k < 50; k++) { const x = -13 + R() * 26, y = -R() * 5.4 * (1 - Math.abs(x) / 15); Ln(c, R() < 0.5 ? "#d8b860" : "#7a6028", 0.3, [x, y, x + (R() - 0.5) * 5, y - R() * 1.4]); }
      c.fillStyle = ["#6a5a4a", "#5a4a5a", "#4a5a3a"][v]; c.beginPath(); c.moveTo(-4, -5.6); c.quadraticCurveTo(2, -7, 10, -4.6); c.lineTo(12, -1); c.lineTo(6, 0.4); c.lineTo(-3, -1.6); c.fill(); for (let k = 0; k < 3; k++) Ln(c, "rgba(0,0,0,.3)", 0.3, [-1 + k * 4, -5.4, 1 + k * 4, -1]);
      B(c, 4, -3.6, 2.4, 2, "#8a7a5a"); /* Flicken */
      if (v === 2) { E(c, -9, -5, 2, 1.4, "#c8b8a0"); E(c, -9, -6.6, 1.2, 1.2, "#c8b8a0"); B(c, -9.4, -7, 0.3, 0.3, "#1a1014"); B(c, -8.6, -7, 0.3, 0.3, "#1a1014"); }
    } },
    napf: { at: "f", w: 1, box: [-8, -8, 8, 3], s(c, R, v) {
      E(c, 0, -0.2, 4, 0.8, "rgba(0,0,0,.4)"); c.fillStyle = lg(c, -4, 0, 4, 0, ["#7a6a5a", "#4a3e34"]); c.beginPath(); c.moveTo(-4, -3); c.lineTo(4, -3); c.quadraticCurveTo(3.6, 0, 0, 0); c.quadraticCurveTo(-3.6, 0, -4, -3); c.fill(); E(c, 0, -3, 4, 0.8, "#3a3028"); E(c, 0, -2.9, 3.4, 0.55, v === 1 ? "#3a3028" : "#8a8a5a");
      c.save(); c.translate(1, -3.4); c.rotate(-0.5); metal(c, 0, -0.3, 5, 0.6, "#7a7678"); E(c, 0, 0, 1, 0.6, "#7a7678"); c.restore();
      brot(c, -6, 0, 3);
    } },
    knochen: { at: "f", w: 1, box: [-10, -8, 10, 3], s(c, R, v) {
      for (let k = 0; k < 5; k++) { const a = (R() - 0.5) * 0.8, l = 3 + R() * 3, bx = -6 + k * 3; knochen(c, bx - Math.cos(a) * l, -1 - Math.sin(a) * l * 0.4 - (k % 2), bx + Math.cos(a) * l, -0.8, 0.9); }
      schaedel(c, 5, -2.4, 2.4, 0.5 * (v - 1)); if (v === 2) { c.strokeStyle = "rgba(230,224,236,.4)"; c.lineWidth = 0.2; for (let k = 0; k < 4; k++) { c.beginPath(); c.moveTo(5, -4.6); c.lineTo(2 + k * 2, -8); c.stroke(); } }
    } },
    folterstuhl: { at: "f", w: 1, box: [-10, -26, 10, 3], s(c, R, v) {
      shadow(c, 0, 0.5, 8, 1.6, 0.45); const ir = "#4a4446";
      metal(c, -6, -22, 2, 22, ir); metal(c, 4, -9, 1.6, 9, ir); metal(c, -5, -9, 1.6, 9, ir); metal(c, -6, -10, 12, 1.6, sh(ir, 0.1));
      for (let k = 0; k < 6; k++) P(c, "#8e8c8a", [-5 + k * 2, -10, -4.4 + k * 2, -12, -3.8 + k * 2, -10]);
      for (let k = 0; k < 6; k++) P(c, "#8e8c8a", [-4, -20 + k * 2, -2.2, -19.4 + k * 2, -4, -18.8 + k * 2]);
      for (const y of [-16, -11.4]) { B(c, -6.4, y, 9, 1.2, "#4a2e1a"); metal(c, 1.6, y - 0.2, 1.6, 1.6, "#8e8c8a"); }
      E(c, -5, -23, 1.6, 1, sh(ir, 0.2)); for (let k = 0; k < 3; k++) E(c, -3 + R() * 6, -10.6, 0.8, 0.4, "rgba(80,20,16,.5)");
    } },
    jungfrau: { at: "f", w: 1, box: [-12, -34, 12, 3], s(c, R, v) {
      shadow(c, 0, 0.5, 8, 1.6, 0.5); const ir = "#4a4446";
      c.fillStyle = lg(c, -6, 0, 6, 0, [sh(ir, 0.25), ir, sh(ir, -0.5)]); c.beginPath(); c.moveTo(-6, 0); c.lineTo(-6.6, -20); c.quadraticCurveTo(-6, -28, -3, -29); c.quadraticCurveTo(0, -33, 3, -29); c.quadraticCurveTo(6, -28, 6.6, -20); c.lineTo(6, 0); c.fill();
      c.fillStyle = "#140c0c"; c.fillRect(-4.6, -26, 9.2, 25); for (let r = 0; r < 6; r++) for (let k = 0; k < 2; k++) P(c, "#8e8c8a", [-4.6 + k * 9.2, -24 + r * 4, -4.6 + k * 9.2 + (k ? -1.8 : 1.8), -23.4 + r * 4, -4.6 + k * 9.2, -22.8 + r * 4]);
      c.save(); c.translate(6, -1); c.transform(1, 0.12, 0, 1, 0, 0); c.fillStyle = lg(c, 0, 0, 7, 0, [sh(ir, -0.3), sh(ir, 0.2)]); c.fillRect(0, -26, 6, 25); for (let r = 0; r < 6; r++) P(c, "#9e9c9a", [0, -24 + r * 4, -1.8, -23.4 + r * 4, 0, -22.8 + r * 4]); E(c, 3, -20, 1.4, 1.8, "#c8b8a0"); B(c, 2.2, -20.4, 0.4, 0.4, "#1a1014"); B(c, 3.4, -20.4, 0.4, 0.4, "#1a1014"); c.restore();
      E(c, 0, -29.6, 2, 1.6, sh(ir, 0.1)); B(c, -1, -30, 0.6, 0.5, "#1a1414"); B(c, 0.4, -30, 0.6, 0.5, "#1a1414"); E(c, 0, -28.4, 0.6, 0.3, "#1a1414");
      for (let k = 0; k < 3; k++) E(c, -1 + R() * 4, -0.3, 1.4, 0.4, "rgba(80,20,16,.55)");
    } },
    bodenkaefig: { at: "f", w: 2, box: [-15, -22, 15, 3], s(c, R, v) {
      shadow(c, 0, 0.5, 13, 1.8, 0.45);
      for (let k = 0; k < 20; k++) Ln(c, R() < 0.5 ? "#b89850" : "#7a6028", 0.3, [-11 + R() * 22, -0.4, -11 + R() * 22, -1.6]);
      if (v !== 1) { c.save(); c.translate(-2, 0); knochen(c, -6, -1, 0, -0.6, 0.9); knochen(c, 1, -1.2, 6, -0.6, 0.8); schaedel(c, 4, -2.2, 2.2, 0.6); c.restore(); } else { sack(c, -3, 0, 0.5, "#8a7a5a", R); }
      const ir = "#3a3436"; metal(c, -12, -1.4, 24, 1.4, ir); metal(c, -12, -18, 24, 1.6, ir); c.fillStyle = ir; c.beginPath(); c.moveTo(-12, -18); c.quadraticCurveTo(0, -24, 12, -18); c.lineTo(12, -17); c.quadraticCurveTo(0, -22.6, -12, -17); c.fill();
      for (let k = -11; k <= 11; k += 2.75) metal(c, k - 0.4, -18 + (k === 5.5 && v === 2 ? 4 : 0), 0.8, 17 - (k === 5.5 && v === 2 ? 4 : 0), ir);
      B(c, 4, -12, 4, 4.4, "#4a4446"); B(c, 5.4, -10.6, 1.2, 1.6, "#1a1214"); metal(c, -1, -24.6, 2, 2, ir);
    } },
    fesseln: { at: "w", box: [-10, -40, 10, -10], s(c, R, v) { for (const x of [-5, 5]) { metal(c, x - 1.6, -34, 3.2, 3, "#3a3436"); rivet(c, x, -32.5, 0.6); } if (v === 2) { E(c, 0, -14, 4, 0.8, "rgba(70,20,16,.4)"); } }, a(c, p, t) {
      for (const dx of [-5, 5]) { const sw = Math.sin(t * 0.8 + dx + p.s * 9) * 1.2, L = dx < 0 ? 10 : 8 + p.v * 2; kette(c, dx, -31.4, dx + sw, -31.4 + L, "#5a5456"); const ex = dx + sw, ey = -31.4 + L; c.strokeStyle = "#4a4446"; c.lineWidth = 0.8; c.beginPath(); c.ellipse(ex, ey + 1.6, 1.6, 1.4, sw * 0.1, 0, TAU); c.stroke(); B(c, ex - 0.6, ey + 2.8, 1.2, 0.6, "#3a3436"); }
    } },
    strichliste: { at: "w", nv: 3, box: [-16, -42, 16, -8], s(c, R, v) {
      const n = [23, 57, 112][v];
      c.strokeStyle = "rgba(225,215,195,.55)"; c.lineWidth = 0.45; c.lineCap = "round";
      for (let k = 0; k < n; k++) { const grp = Math.floor(k / 5), col = grp % 5, row = Math.floor(grp / 5), gx = -13 + col * 5.4 + (k % 5) * 0.9, gy = -36 + row * 5.6; if (gy > -12) break; if (k % 5 === 4) { c.beginPath(); c.moveTo(gx - 4.4, gy + 3.6); c.lineTo(gx + 0.6, gy + 0.4); c.stroke(); } else { c.beginPath(); c.moveTo(gx + (R() - 0.5) * 0.3, gy); c.lineTo(gx + (R() - 0.5) * 0.4, gy + 4); c.stroke(); } }
      c.strokeStyle = "rgba(225,215,195,.45)"; c.lineWidth = 0.35;
      if (v === 0) { c.beginPath(); c.arc(8, -24, 2.4, 0, TAU); c.stroke(); for (let k = 0; k < 8; k++) { const a = k / 8 * TAU; c.beginPath(); c.moveTo(8 + Math.cos(a) * 3.2, -24 + Math.sin(a) * 3.2); c.lineTo(8 + Math.cos(a) * 4.6, -24 + Math.sin(a) * 4.6); c.stroke(); } }
      else if (v === 1) { c.beginPath(); c.arc(-6, -17, 1.2, 0, TAU); c.moveTo(-6, -15.8); c.lineTo(-6, -12.6); c.lineTo(-7.4, -10.4); c.moveTo(-6, -12.6); c.lineTo(-4.6, -10.4); c.moveTo(-7.6, -14.6); c.lineTo(-4.4, -14.6); c.stroke(); c.beginPath(); c.moveTo(-4, -18); c.lineTo(4, -18); c.lineTo(4, -10); c.stroke(); for (let k = -3; k < 4; k += 1.4) { c.beginPath(); c.moveTo(k, -18); c.lineTo(k, -10); c.stroke(); } }
      else { c.beginPath(); c.moveTo(-12, -13); c.lineTo(-9, -16); c.lineTo(-6, -13); c.lineTo(-3, -16); c.stroke(); c.beginPath(); c.arc(6, -15, 3, 0, PI, true); c.stroke(); c.beginPath(); c.moveTo(4, -15); c.lineTo(4.5, -15.5); c.moveTo(7.5, -15); c.lineTo(8, -15.5); c.stroke(); }
      c.lineCap = "butt";
    } },
    kerkerfenster: { at: "w", box: [-10, -42, 10, -14], s(c, R, v) {
      for (let k = 0; k < 4; k++) stein(c, [-8 + (k % 2) * 10, -38 + Math.floor(k / 2) * 14, -8 + (k % 2) * 10 + 6, -38 + Math.floor(k / 2) * 14, -8 + (k % 2) * 10 + 6, -38 + Math.floor(k / 2) * 14 + 4, -8 + (k % 2) * 10, -38 + Math.floor(k / 2) * 14 + 4], "#5a5e50", R);
      c.fillStyle = lg(c, 0, -34, 0, -22, ["#c8d0a8", "#8a9a7a", "#4a5444"]); c.fillRect(-5, -34, 10, 11); B(c, -5, -34, 10, 1, "#2a2e26"); B(c, -5, -23.6, 10, 0.8, "#6a6e5e");
      for (const x of [-3, 0, 3]) metal(c, x - 0.5, -34, 1, 11, "#2a2628"); metal(c, -5, -29.2, 10, 0.8, "#2a2628");
      if (v === 1) { B(c, 3, -24.6, 2, 1, "#4a6a2a"); E(c, 4, -25.4, 1, 0.6, "#6a8a3a"); }
    }, a(c, p, t) { c.save(); c.globalCompositeOperation = "lighter"; c.fillStyle = "rgba(200,210,170,.05)"; c.beginPath(); c.moveTo(-5, -23); c.lineTo(5, -23); c.lineTo(16, 14); c.lineTo(2, 14); c.fill(); c.restore(); for (let k = 0; k < 4; k++) { const u = (t * 0.05 + k * 0.25 + p.s) % 1; E(c, -2 + u * 12 + Math.sin(u * 9 + k) * 2, -22 + u * 34, 0.35, 0.35, "rgba(230,230,200," + 0.5 * Math.sin(u * PI) + ")"); } glow(0, -28, 12, 0.18, "m"); } },
    peitschen: { at: "w", box: [-16, -42, 16, -6], s(c, R, v) {
      wood(c, -14, -36, 28, 2, "#4a2e1a", R, false); for (const x of [-10, -2, 6, 12]) B(c, x - 0.4, -34, 0.8, 1.6, "#3a3436");
      Ln(c, "#5a3a22", 0.9, [-10, -32.4, -10, -26]); c.strokeStyle = "#3a2a1a"; c.lineWidth = 0.5; c.beginPath(); c.moveTo(-10, -26); c.bezierCurveTo(-14, -20, -6, -16, -11, -10); c.stroke(); for (let k = 0; k < 3; k++) Ln(c, "#3a2a1a", 0.3, [-11, -10, -12 + k, -7]);
      c.strokeStyle = "#5a5456"; c.lineWidth = 0.8; c.beginPath(); c.moveTo(-3, -32.4); c.lineTo(-1, -22); c.moveTo(-1, -32.4); c.lineTo(-3, -22); c.stroke(); E(c, -2, -29, 0.7, 0.7, "#6a6668");
      metal(c, 5.4, -32.4, 1.2, 4, "#4a2e1a"); P(c, "#8e8c8a", [6, -28.4, 4, -26, 4.4, -16, 7.6, -16, 8, -26]); for (let k = 0; k < 6; k++) P(c, "#7e7c7a", [4.4, -25 + k * 1.6, 3.6, -24.2 + k * 1.6, 4.4, -23.4 + k * 1.6]);
      c.strokeStyle = "#4a4446"; c.lineWidth = 0.7; c.beginPath(); c.arc(12, -26, 2.6, 0, TAU); c.stroke(); Ln(c, "#4a4446", 0.7, [12, -32.4, 12, -28.6]); Ln(c, "#4a2e1a", 1, [12, -23.4, 12, -18]);
    } },
    kritzelei: { at: "w", nv: 3, box: [-14, -40, 14, -10], s(c, R, v) {
      c.strokeStyle = "rgba(225,215,195,.5)"; c.lineWidth = 0.4; c.lineCap = "round";
      if (v === 0) { c.beginPath(); c.arc(0, -26, 7, 0, TAU); c.stroke(); for (let k = 0; k < 5; k++) { const a = -PI / 2 + k * TAU * 2 / 5, b = -PI / 2 + (k + 1) * TAU * 2 / 5; c.beginPath(); c.moveTo(Math.cos(a) * 7, -26 + Math.sin(a) * 7); c.lineTo(Math.cos(b) * 7, -26 + Math.sin(b) * 7); c.stroke(); } }
      else if (v === 1) { /* Spinne mit Kreuz drüber */ c.beginPath(); c.ellipse(0, -26, 2, 2.6, 0, 0, TAU); c.stroke(); for (const sd of [-1, 1]) for (let k = 0; k < 4; k++) { c.beginPath(); c.moveTo(sd * 1.6, -27 + k); c.lineTo(sd * 6, -30 + k * 2.4); c.lineTo(sd * 7, -25 + k * 2.4); c.stroke(); } c.strokeStyle = "rgba(200,90,70,.5)"; c.lineWidth = 0.6; c.beginPath(); c.moveTo(-8, -34); c.lineTo(8, -18); c.moveTo(8, -34); c.lineTo(-8, -18); c.stroke(); }
      else { /* Pfeil nach unten, Fluchtplan */ c.beginPath(); c.moveTo(-8, -34); c.lineTo(-8, -20); c.lineTo(4, -20); c.lineTo(4, -14); c.stroke(); c.beginPath(); c.moveTo(2.4, -16); c.lineTo(4, -13.4); c.lineTo(5.6, -16); c.stroke(); c.beginPath(); c.rect(-10, -36, 4, 3); c.stroke(); c.beginPath(); c.arc(8, -28, 1.6, 0, TAU); c.stroke(); }
      c.lineCap = "butt";
    } },
    haengekaefig: { at: "c", len: 5, box: [-3, -1, 3, 2], s(c) { metal(c, -2, 0, 4, 1.2, "#3a3436"); }, a(c, p, t) {
      const L = 8 + p.v * 3, a = Math.sin(t * 0.7 + p.s * 9) * 0.07; c.save(); c.rotate(a); kette(c, 0, 1, 0, L, "#4a4446");
      const ir = "#3a3436", y0 = L + 1; c.strokeStyle = ir; c.lineWidth = 0.7; c.beginPath(); c.arc(0, y0 + 2, 2, PI, 0); c.stroke();
      c.lineWidth = 0.9; c.beginPath(); c.ellipse(0, y0 + 3, 6, 1.2, 0, 0, TAU); c.stroke(); c.beginPath(); c.ellipse(0, y0 + 19, 6, 1.2, 0, 0, TAU); c.stroke();
      if (p.v !== 1) { knochen(c, -3, y0 + 17.6, 2, y0 + 17, 0.7); schaedel(c, 2.6, y0 + 16.4, 1.6, 0.6); knochen(c, -1.6, y0 + 12, -4.4, y0 + 17, 0.6); knochen(c, 1, y0 + 9, 6.6, y0 + 22, 0.6); }
      else { E(c, 0, y0 + 17, 3, 1.8, "#8a7a5a"); B(c, -2, y0 + 15.6, 4, 0.6, "#6a5a3a"); }
      c.lineWidth = 0.55; for (let k = -6; k <= 6; k += 2) { c.beginPath(); c.moveTo(k, y0 + 3); c.lineTo(k * 1.02, y0 + 19); c.stroke(); }
      B(c, -6.2, y0 + 19, 12.4, 1, ir); c.restore();
    } },
    ketten_h: { at: "c", len: 4, box: [-6, -1, 6, 2], s(c) { metal(c, -5, 0, 10, 1.2, "#3a3436"); }, a(c, p, t) {
      for (let k = 0; k < 2 + (p.v % 2); k++) { const x = -3 + k * 3, L = 12 + ((k * 7 + p.v * 5) % 11), sw = Math.sin(t * 0.6 + k * 2 + p.s * 9) * 1.4; kette(c, x, 1, x + sw, L, "#4a4446", 0.6); if (k === 1) { c.strokeStyle = "#5a5456"; c.lineWidth = 0.9; c.beginPath(); c.arc(x + sw - 1.4, L + 1.6, 1.6, -0.3, PI); c.stroke(); } else { c.strokeStyle = "#4a4446"; c.lineWidth = 0.7; c.beginPath(); c.ellipse(x + sw, L + 1.4, 1.3, 1.1, 0, 0, TAU); c.stroke(); } }
    } },
    /* ---------- Hafen ---------- */
    netze: { at: "f", w: 2, box: [-16, -14, 16, 3], s(c, R, v) {
      c.fillStyle = lg(c, 0, -10, 0, 0, ["#7a6a50", "#5a4a3a", "#3a2e24"]); c.beginPath(); c.moveTo(-14, 0); c.quadraticCurveTo(-10, -8, -2, -9); c.quadraticCurveTo(6, -10, 10, -6); c.quadraticCurveTo(14, -3, 14, 0); c.fill();
      c.strokeStyle = "rgba(210,190,150,.5)"; c.lineWidth = 0.25; for (let k = -13; k < 14; k += 1.6) { c.beginPath(); c.moveTo(k, 0); c.lineTo(k + 2.4, -8 + Math.abs(k) * 0.3); c.stroke(); c.beginPath(); c.moveTo(k, 0); c.lineTo(k - 2.4, -8 + Math.abs(k) * 0.3); c.stroke(); }
      for (const [x, y] of [[-8, -5], [3, -8.4], [10, -4]]) { E(c, x, y, 1.6, 1.2, "#c89a40"); E(c, x - 0.5, y - 0.4, 0.6, 0.4, "rgba(255,240,200,.5)"); }
      seil(c, [-14, -1, -16, -3, -15, -6], "#a08050", 0.5);
      if (v !== 2) { c.save(); c.translate(-3, -5); c.rotate(0.3); E(c, 0, 0, 3.4, 1.2, "#a8b0a0"); P(c, "#8a9488", [-3.4, 0, -5.4, -1.4, -5.4, 1.4]); B(c, 2, -0.4, 0.5, 0.5, "#1a1414"); c.restore(); }
    }, a(c, p, t) { if (p.v !== 2) fliegen(c, -3, -9, t, 2, p.s * 5); } },
    anker: { at: "f", w: 1, box: [-12, -30, 12, 3], s(c, R, v) {
      shadow(c, 0, 0.5, 10, 1.6, 0.45); const ir = "#4a4442";
      c.save(); c.rotate(v === 1 ? 0.25 : 0);
      metal(c, -1.1, -24, 2.2, 22, ir); c.strokeStyle = ir; c.lineWidth = 2.2; c.beginPath(); c.arc(0, -10, 8.6, 0.25, PI - 0.25); c.stroke(); c.strokeStyle = "rgba(255,240,220,.25)"; c.lineWidth = 0.4; c.beginPath(); c.arc(0, -10, 9.4, 0.6, PI - 0.6); c.stroke();
      for (const sd of [-1, 1]) P(c, ir, [sd * 8.4, -8, sd * 10.6, -10.4, sd * 8.6, -4.2, sd * 6.6, -6]);
      wood(c, -6, -21, 12, 2, "#5a3a22", R, false); c.strokeStyle = ir; c.lineWidth = 1; c.beginPath(); c.arc(0, -26, 2.2, 0, TAU); c.stroke();
      for (let k = 0; k < 6; k++) E(c, -1 + R() * 2, -22 + R() * 18, 0.6, 0.8, "rgba(140,70,30,.45)");
      c.restore();
      if (v !== 0) kette(c, 2, -26, 10, -0.6, "#4a4442", 6);
    } },
    tauwerk: { at: "f", w: 1, box: [-10, -10, 10, 3], s(c, R, v) {
      E(c, 0, -0.2, 7, 1.2, "rgba(0,0,0,.4)");
      for (let k = 0; k < 6; k++) { c.strokeStyle = sh("#a08050", -k * 0.04); c.lineWidth = 1.2; c.beginPath(); c.ellipse(0, -1.4 - k * 1.2, 6.4 - k * 0.5, 1.6, 0, 0, TAU); c.stroke(); c.strokeStyle = "rgba(60,40,10,.5)"; c.lineWidth = 0.5; c.setLineDash([0.5, 0.6]); c.stroke(); c.setLineDash([]); }
      seil(c, [5, -2, 9, -0.6, 10, 0], "#a08050", 1);
    } },
    fischkorb: { at: "f", w: 1, box: [-10, -14, 10, 3], s(c, R, v) {
      shadow(c, 0, 0.5, 8, 1.4, 0.45);
      for (let k = 0; k < 5; k++) { c.save(); c.translate(-3.6 + k * 1.8, -8.4 - (k % 2)); c.rotate(-0.6 + k * 0.3); const col = ["#a8b0a0", "#b8a888", "#98a088"][k % 3]; E(c, 0, 0, 1.1, 3.4, col); P(c, sh(col, -0.2), [0, -3.4, -1.3, -5.2, 1.3, -5.2]); E(c, -0.3, 1.4, 0.3, 0.3, "#1a1414"); E(c, 0.3, 0, 0.3, 2, "rgba(255,255,240,.4)"); c.restore(); }
      c.fillStyle = "#7a5a30"; c.beginPath(); c.moveTo(-6, -7.6); c.lineTo(6, -7.6); c.lineTo(5, 0); c.lineTo(-5, 0); c.fill();
      for (let r = 0; r < 4; r++) for (let k = 0; k < 6; k++) E(c, -5 + k * 2 + (r % 2), -6.8 + r * 1.8, 0.9, 0.5, r % 2 ? "#8a6a38" : "#a07a4a");
      B(c, -6.2, -7.8, 12.4, 0.9, "#5a4022");
    }, a(c, p, t) { fliegen(c, 0, -12, t, 3, p.s * 7); } },
    poller: { at: "f", w: 1, box: [-9, -16, 9, 3], s(c, R, v) {
      shadow(c, 0, 0.5, 6, 1.2, 0.45); const ir = "#3a3436";
      c.fillStyle = lg(c, -3, 0, 3, 0, [sh(ir, 0.3), ir, sh(ir, -0.4)]); c.fillRect(-3, -9, 6, 9); E(c, 0, -9, 4.2, 1.4, sh(ir, 0.15)); E(c, 0, -10.2, 3.4, 1.6, ir); E(c, -1, -10.8, 1.2, 0.5, "rgba(255,240,220,.3)");
      for (let k = 0; k < 3; k++) { c.strokeStyle = "#a08050"; c.lineWidth = 0.9; c.beginPath(); c.ellipse(0, -6 + k * 1.2, 3.6, 0.8, 0, 0, PI); c.stroke(); }
      seil(c, [3, -5, 6, -3, 9, -2.4], "#a08050", 0.9); for (let k = 0; k < 4; k++) E(c, -1 + R() * 2, -3 - R() * 5, 0.5, 0.6, "rgba(140,70,30,.4)");
    } },
    hummerkorb: { at: "f", w: 1, box: [-10, -12, 10, 3], s(c, R, v) {
      shadow(c, 0, 0.5, 8, 1.4, 0.45);
      if (v !== 2) { c.fillStyle = "#b8402a"; c.beginPath(); c.ellipse(0, -2.6, 3, 1.2, 0, 0, TAU); c.fill(); E(c, 3.4, -3.2, 1.2, 0.8, "#b8402a"); E(c, -3.6, -2.4, 1.6, 0.6, "#a8382a"); Ln(c, "#b8402a", 0.2, [3.6, -3.6, 6, -6]); }
      wood(c, -7, -1, 14, 1, "#6a4a2a", R, false); c.strokeStyle = "#6a4a2a"; c.lineWidth = 0.6; for (let k = -6; k <= 6; k += 2) { c.beginPath(); c.moveTo(k, -0.6); c.quadraticCurveTo(k * 0.9, -9, k * 0.5, -9); c.stroke(); } c.beginPath(); c.ellipse(0, -5, 7, 2.6, 0, PI, 0); c.stroke(); c.beginPath(); c.moveTo(-7, -1); c.quadraticCurveTo(-7, -9, 0, -9); c.quadraticCurveTo(7, -9, 7, -1); c.stroke();
      c.strokeStyle = "rgba(210,190,150,.5)"; c.lineWidth = 0.2; for (let k = -6; k < 7; k += 1.4) { c.beginPath(); c.moveTo(k, -1); c.lineTo(k + 1, -8); c.stroke(); }
    } },
    boot: { at: "f", w: 3, box: [-32, -22, 32, 4], s(c, R, v) {
      shadow(c, 0, 0.5, 26, 2.2, 0.5);
      for (const x of [-16, 14]) { c.save(); c.translate(x, 0); for (const a of [-0.3, 0.3]) { c.save(); c.rotate(a); wood(c, -0.7, -9, 1.4, 9, "#4a2e1a", R, true); c.restore(); } wood(c, -4, -9.6, 8, 1.6, "#5a3a22", R, false); c.restore(); }
      const col = v === 1 ? "#6a5a4a" : "#5a4430";
      c.save(); c.beginPath(); c.moveTo(-28, -10); c.quadraticCurveTo(-26, -20, -10, -20.6); c.lineTo(14, -20.6); c.quadraticCurveTo(26, -20, 29, -10); c.closePath(); c.fillStyle = lg(c, 0, -21, 0, -10, [sh(col, 0.2), col, sh(col, -0.3)]); c.fill(); c.clip();
      for (let k = 0; k < 4; k++) { const y = -20.6 + k * 2.8; Ln(c, "rgba(20,10,4,.5)", 0.35, [-30, y + 2.6, 30, y + 2.6]); B(c, -30, y + 2.2, 60, 0.4, "rgba(255,230,190,.08)"); for (let q = -24 + k * 3; q < 28; q += 8) rivet(c, q, y + 1.4, 0.3); }
      B(c, 2, -16, 6, 3.6, sh(col, -0.25)); c.restore();
      wood(c, -29, -10.6, 58, 1.4, sh(col, -0.2), R, false); wood(c, -1, -22, 2, 1.6, "#3a2414", R, false);
      c.fillStyle = "rgba(230,224,210,.5)"; c.font = "italic 2.8px 'Alegreya Sans',sans-serif"; c.fillText(["Möwe", "Selune", "Hoffnung"][v], -18, -12.4);
      c.save(); c.translate(18, 0); c.rotate(-0.5); wood(c, -0.5, -20, 1, 20, "#8a6a40", R, true); E(c, 0, -21, 1.4, 4, "#8a6a40"); c.restore();
    } },
    seekiste: { at: "f", w: 2, box: [-14, -16, 14, 3], s(c, R, v) {
      shadow(c, 0, 0.5, 13, 1.8, 0.45); const col = ["#5a3a22", "#6a2a22", "#3a3a2a"][v];
      wood(c, -11, -10, 22, 10, col, R, false); c.fillStyle = lg(c, 0, -14, 0, -10, [sh(col, 0.2), col]); c.beginPath(); c.moveTo(-11.4, -10); c.lineTo(-11, -13); c.lineTo(11, -13); c.lineTo(11.4, -10); c.fill();
      band(c, -11, -12.4, 22, 0.8); band(c, -11, -3, 22, 0.8); for (const x of [-11.6, 11.6]) { seil(c, [x, -8, x + (x < 0 ? -1.6 : 1.6), -6.4, x, -4.8], "#a08050", 0.6); }
      c.strokeStyle = "rgba(230,220,200,.55)"; c.lineWidth = 0.5; c.beginPath(); c.moveTo(0, -9); c.lineTo(0, -3.6); c.moveTo(-1.6, -8); c.lineTo(1.6, -8); c.stroke(); c.beginPath(); c.arc(0, -5, 2.2, 0.3, PI - 0.3); c.stroke();
      metal(c, -1, -10.6, 2, 2, "#b8923a"); wear(c, -11, -13, 22, 13, R, 6);
    } },
    ruderbuendel: { at: "f", w: 1, box: [-10, -34, 10, 3], s(c, R, v) {
      shadow(c, 0, 0.5, 6, 1.2, 0.4);
      for (let k = 0; k < 3; k++) { c.save(); c.translate(-3 + k * 3, 0); c.rotate(-0.12 + k * 0.1); wood(c, -0.5, -30, 1, 22, "#8a6a40", R, true); c.fillStyle = lg(c, -2, 0, 2, 0, ["#9a7a4a", "#6a4a2a"]); c.beginPath(); c.ellipse(0, -5, 2, 5.4, 0, 0, TAU); c.fill(); B(c, -0.8, -31.4, 1.6, 1.6, "#5a3a22"); c.restore(); }
      seil(c, [-4, -16, 0, -15, 4, -16], "#a08050", 0.6);
    } },
    rettungsring: { at: "w", box: [-10, -36, 10, -12], s(c, R, v) {
      rivet(c, 0, -31, 0.6); seil(c, [0, -31, -2, -29, 0, -29.4, 2, -29], "#a08050", 0.5);
      c.strokeStyle = "#d8d0c0"; c.lineWidth = 2.8; c.beginPath(); c.arc(0, -23, 5.4, 0, TAU); c.stroke();
      c.strokeStyle = "#b83a30"; for (let k = 0; k < 4; k++) { c.beginPath(); c.arc(0, -23, 5.4, k * PI / 2 + 0.3, k * PI / 2 + 0.9); c.stroke(); }
      c.strokeStyle = "rgba(255,255,255,.4)"; c.lineWidth = 0.6; c.beginPath(); c.arc(0, -23, 6.3, PI * 1.1, PI * 1.6); c.stroke(); c.strokeStyle = "rgba(0,0,0,.3)"; c.beginPath(); c.arc(0, -23, 4.4, 0, TAU); c.stroke();
      for (let k = 0; k < 4; k++) { const a = k * PI / 2 + 0.6; seil(c, [Math.cos(a) * 7, -23 + Math.sin(a) * 7, Math.cos(a + 0.8) * 7.4, -23 + Math.sin(a + 0.8) * 7.4], "#a08050", 0.4); }
    } },
    netzwand: { at: "w", box: [-16, -42, 16, -8], s(c, R, v) {
      for (const x of [-12, 12]) rivet(c, x, -36, 0.6);
      c.strokeStyle = "rgba(190,170,130,.65)"; c.lineWidth = 0.35;
      for (let k = 0; k < 9; k++) { c.beginPath(); c.moveTo(-12 + k * 3, -36 + Math.sin(k / 8 * PI) * 2); c.quadraticCurveTo(-12 + k * 3 + 1.4, -24, -12 + k * 3.1 + 0.6, -13 + Math.sin(k) * 1.2); c.stroke(); }
      for (let k = 0; k < 8; k++) { c.beginPath(); c.moveTo(-12, -34 + k * 3); c.quadraticCurveTo(0, -32 + k * 3 + 2.2, 13, -34 + k * 3 + 0.6); c.stroke(); }
      for (const [x, y] of [[-6, -22], [5, -30], [8, -17]]) { E(c, x, y, 1.6, 1.3, "#c89a40"); E(c, x - 0.5, y - 0.4, 0.6, 0.4, "rgba(255,240,200,.5)"); }
      if (v !== 1) { c.fillStyle = "#c86a3a"; c.beginPath(); for (let k = 0; k < 10; k++) { const a = -PI / 2 + k * PI / 5, r = k % 2 ? 1.2 : 3; c.lineTo(-4 + Math.cos(a) * r, -30 + Math.sin(a) * r); } c.fill(); for (let k = 0; k < 5; k++) E(c, -4 + Math.cos(-PI / 2 + k * TAU / 5) * 1.6, -30 + Math.sin(-PI / 2 + k * TAU / 5) * 1.6, 0.3, 0.3, "#e8a070"); }
    } },
    steuerrad: { at: "w", box: [-14, -42, 14, -8], s(c, R, v) {
      const cx = 0, cy = -25, col = "#6a4428";
      for (let k = 0; k < 8; k++) { const a = k / 8 * TAU; c.save(); c.translate(cx, cy); c.rotate(a); wood(c, -0.6, -12, 1.2, 12, col, R, true); E(c, 0, -12.4, 1, 1.6, sh(col, 0.1)); c.restore(); }
      c.strokeStyle = sh(col, -0.2); c.lineWidth = 2; c.beginPath(); c.arc(cx, cy, 7.6, 0, TAU); c.stroke(); c.strokeStyle = sh(col, 0.15); c.lineWidth = 0.5; c.beginPath(); c.arc(cx, cy, 8.4, PI * 1.1, PI * 1.7); c.stroke();
      E(c, cx, cy, 2.4, 2.4, "#b8923a"); E(c, cx - 0.6, cy - 0.6, 0.8, 0.8, "rgba(255,250,220,.6)");
    } },
    reuse: { at: "w", box: [-14, -40, 14, -10], s(c, R, v) {
      rivet(c, -8, -34, 0.6); seil(c, [-8, -34, -6, -30], "#a08050", 0.5);
      c.save(); c.translate(-6, -30); c.rotate(0.9);
      c.fillStyle = "rgba(120,90,50,.35)"; c.beginPath(); c.moveTo(0, -4); c.lineTo(16, -1.6); c.lineTo(16, 1.6); c.lineTo(0, 4); c.fill();
      c.strokeStyle = "#8a6a3a"; c.lineWidth = 0.4; for (let k = 0; k < 5; k++) { c.beginPath(); c.ellipse(k * 4, 0, 0.8, 4 - k * 0.55, 0, 0, TAU); c.stroke(); } for (let k = -3; k <= 3; k += 1.5) { c.beginPath(); c.moveTo(0, k); c.lineTo(16, k * 0.4); c.stroke(); }
      if (v !== 1) { E(c, 9, 0, 2.6, 0.9, "#a8b0a0"); } c.restore();
    } },
    schiffsglocke: { at: "w", box: [-10, -40, 10, -8], s(c, R, v) {
      metal(c, -1, -34, 2, 4, "#3a3436"); c.strokeStyle = "#3a3436"; c.lineWidth = 0.9; c.beginPath(); c.moveTo(0, -32); c.lineTo(5, -32); c.stroke(); rivet(c, 0, -33, 0.4);
    }, a(c, p, t) {
      const a = Math.sin(t * 0.8 + p.s * 9) * 0.06; c.save(); c.translate(5, -32); c.rotate(a); const br = "#c8943a";
      c.fillStyle = lg(c, -4, 0, 4, 0, [sh(br, 0.4), br, sh(br, -0.5)]); c.beginPath(); c.moveTo(-1.6, 1); c.quadraticCurveTo(-2.2, 6, -4, 8); c.lineTo(4, 8); c.quadraticCurveTo(2.2, 6, 1.6, 1); c.closePath(); c.fill();
      B(c, -3.6, 7.6, 7.2, 0.6, sh(br, -0.3)); B(c, -1.6, 2, 0.5, 5, "rgba(255,250,220,.55)"); E(c, 0, 0.6, 1, 0.7, br);
      seil(c, [0, 8, 0.6, 12, 0.2, 15], "#d8c8a0", 0.6); E(c, 0.2, 15.4, 0.8, 1, "#d8c8a0"); c.restore();
    } },
    ruder_x: { at: "w", box: [-16, -44, 16, -8], s(c, R, v) {
      for (const a of [-0.6, 0.6]) { c.save(); c.translate(0, -26); c.rotate(a); wood(c, -0.6, -14, 1.2, 22, "#8a6a40", R, true); c.fillStyle = lg(c, -2.4, 0, 2.4, 0, ["#a8804a", "#6a4a2a"]); c.beginPath(); c.ellipse(0, 11, 2.4, 6, 0, 0, TAU); c.fill(); c.restore(); }
      seil(c, [-2, -27, 0, -25, 2, -27], "#a08050", 0.6); rivet(c, 0, -26, 0.6);
    } },
    netz_h: { at: "c", len: 4, box: [-16, -1, 16, 24], s(c, R, v) {
      for (const x of [-12, 12]) metal(c, x - 1, 0, 2, 1.2, "#3a3436");
      c.fillStyle = "rgba(100,80,50,.25)"; c.beginPath(); c.moveTo(-12, 1); c.quadraticCurveTo(0, 30, 12, 1); c.fill();
      c.strokeStyle = "rgba(190,170,130,.6)"; c.lineWidth = 0.3; for (let k = -12; k <= 12; k += 2.4) { c.beginPath(); c.moveTo(k, 1); c.quadraticCurveTo(k * 0.6, 12, 0, 15.6); c.stroke(); } for (let k = 1; k < 6; k++) { c.beginPath(); c.moveTo(-12 + k * 1.6, 1 + k * 3); c.quadraticCurveTo(0, 6 + k * 3.4, 12 - k * 1.6, 1 + k * 3); c.stroke(); }
      for (let k = 0; k < 4; k++) { c.save(); c.translate(-4 + k * 2.6, 9 + (k % 2) * 2); c.rotate(0.4 - k * 0.3); E(c, 0, 0, 2.8, 1, ["#a8b0a0", "#b8a888", "#8a9a80", "#c8b890"][k]); P(c, "#7a8478", [-2.8, 0, -4.4, -1.2, -4.4, 1.2]); c.restore(); }
      E(c, -12, 2.4, 1.6, 1.2, "#c89a40"); E(c, 12, 2.4, 1.6, 1.2, "#c89a40");
    } },
    trockenfisch: { at: "c", len: 3, box: [-16, -1, 16, 14], s(c, R, v) {
      seil(c, [-15, 1, 0, 3, 15, 1], "#a08050", 0.5);
      for (let k = 0; k < 6; k++) { const x = -12 + k * 4.8, y = 1 + Math.sin((x + 15) / 30 * PI) * 2; Ln(c, "#8a7a5a", 0.3, [x, y, x, y + 1.4]); c.save(); c.translate(x, y + 1.4); E(c, 0, 4, 1.1, 3.8, ["#b8a070", "#a89060", "#c8b080"][k % 3]); P(c, "#8a7a50", [0, 7.6, -1.6, 10, 1.6, 10]); B(c, -0.25, 1, 0.5, 0.5, "#1a1414"); Ln(c, "rgba(90,70,40,.4)", 0.2, [0, 1.4, 0, 7]); c.restore(); }
    } },
    /* ---------- Glockenturm ---------- */
    zahnradkiste: { at: "f", w: 2, box: [-14, -18, 14, 3], s(c, R, v) {
      shadow(c, 0, 0.5, 12, 1.8, 0.45);
      kiste(c, -10, -9, 20, 9, "#6a4428", R, { nobrace: true });
      const gear = (x, y, r, col) => { c.fillStyle = lg(c, x - r, y - r, x + r, y + r, [sh(col, 0.35), col, sh(col, -0.45)]); zahnradF(c, x, y, r, Math.max(6, Math.round(r * 2.4)), r * 0.28); c.fill(); E(c, x, y, r * 0.35, r * 0.35, "#2a1a10"); E(c, x - r * 0.3, y - r * 0.4, r * 0.3, r * 0.15, "rgba(255,250,220,.4)"); };
      gear(-5, -10.4, 3.6, "#b8923a"); gear(1.4, -11, 2.6, "#a8643a"); gear(6, -10, 3, "#8e8c8a");
      c.strokeStyle = "#8e8c8a"; c.lineWidth = 0.4; c.beginPath(); for (let k = 0; k < 14; k++) c.lineTo(-9 + k * 0.6, -12 + (k % 2 ? 1 : -1) * 0.8); c.stroke();
      if (v !== 1) { c.fillStyle = "#6c6a68"; c.beginPath(); c.moveTo(10.6, 0); c.lineTo(10.6, -4); c.lineTo(13, -4); c.lineTo(13, 0); c.fill(); Ln(c, "#6c6a68", 0.4, [11.8, -4, 11, -7.4]); }
    } },
    kleineglocke: { at: "f", w: 1, box: [-10, -26, 10, 3], s(c, R, v) {
      shadow(c, 0, 0.5, 8, 1.4, 0.45); wood(c, -8, -23, 16, 2, "#4a2e1a", R, false); wood(c, -8, -23, 2, 23, "#4a2e1a", R, true); wood(c, 6, -23, 2, 23, "#4a2e1a", R, true); for (const x of [-7, 7]) { c.fillStyle = "#3a2414"; c.beginPath(); c.moveTo(x - 3, 0); c.lineTo(x + 3, 0); c.lineTo(x, -3); c.fill(); }
    }, a(c, p, t) { const a = Math.sin(t * 1.2 + p.s * 9) * 0.15, br = "#b0843a"; c.save(); c.translate(0, -21); c.rotate(a); c.fillStyle = lg(c, -5, 0, 5, 0, [sh(br, 0.4), br, sh(br, -0.5)]); c.beginPath(); c.moveTo(-2.4, 1); c.quadraticCurveTo(-3, 8, -5.6, 10); c.lineTo(5.6, 10); c.quadraticCurveTo(3, 8, 2.4, 1); c.fill(); B(c, -5.4, 9.4, 10.8, 0.7, sh(br, -0.3)); B(c, -1.8, 2, 0.6, 7, "rgba(255,250,220,.5)"); E(c, Math.sin(t * 1.2 + p.s * 9 - 0.4) * 2, 10.6, 0.9, 0.9, "#4a4446"); c.restore(); } },
    grosseglocke: { at: "f", w: 3, box: [-26, -30, 26, 4], s(c, R, v) {
      shadow(c, 0, 0.5, 22, 2.2, 0.55); const br = "#8a6a3a";
      c.fillStyle = lg(c, -20, 0, 20, 0, [sh(br, 0.25), sh(br, 0.05), br, sh(br, -0.55)]); c.beginPath(); c.moveTo(-8, -26); c.bezierCurveTo(-12, -26, -12, -14, -15, -6); c.quadraticCurveTo(-18, -1, -21, 0); c.lineTo(21, 0); c.quadraticCurveTo(18, -1, 15, -6); c.bezierCurveTo(12, -14, 12, -26, 8, -26); c.closePath(); c.fill(); c.save(); c.clip();
      for (const y of [-22, -12, -4]) { B(c, -18, y, 36, 0.6, "rgba(0,0,0,.25)"); B(c, -18, y + 0.6, 36, 0.4, "rgba(255,240,200,.12)"); }
      c.fillStyle = "rgba(100,140,90,.35)"; for (let k = 0; k < 10; k++) E(c, -12 + R() * 24, -20 + R() * 18, 1 + R() * 2, 0.8 + R(), "rgba(100,140,90,.3)");
      c.fillStyle = "rgba(230,210,160,.25)"; c.font = "2.6px 'Alegreya Sans',sans-serif"; c.fillText("+ VOX +", -6, -16);
      B(c, -9, -6, 0.5, 6, "rgba(255,240,200,.25)");
      Ln(c, "#1a1210", 0.7, [4, -26, 6, -20, 3, -14, 7, -8, 5, 0]); Ln(c, "rgba(255,240,200,.25)", 0.3, [4.5, -26, 6.5, -20, 3.5, -14]); c.restore();
      wood(c, -6, -29, 12, 3, "#4a2e1a", R, false); metal(c, -2.4, -28, 4.8, 2.2, "#4a4446");
      if (v !== 2) { c.save(); c.translate(19, -1.4); c.rotate(-0.2); metal(c, -6, -0.6, 8, 1.2, "#4a4446"); E(c, 3.4, 0, 2.4, 2.4, "#5a5456"); c.restore(); }
      if (v === 1) { for (let k = 0; k < 5; k++) P(c, br, [-22 - k * 1.4, 0, -21.4 - k * 1.4, -1.6, -20.4 - k * 1.4, 0]); }
    } },
    winde: { at: "f", w: 2, box: [-16, -24, 16, 3], s(c, R, v) {
      shadow(c, 0, 0.5, 14, 1.8, 0.45);
      for (const x of [-11, 9]) { wood(c, x, -14, 2, 14, "#4a2e1a", R, true); c.fillStyle = "#3a2414"; c.beginPath(); c.moveTo(x - 3, 0); c.lineTo(x + 5, 0); c.lineTo(x + 1, -4); c.fill(); }
      c.fillStyle = lg(c, 0, -15, 0, -7, ["#7a5432", "#4a2e1a"]); c.fillRect(-9, -14.6, 18, 7.4); for (let k = 0; k < 9; k++) { c.strokeStyle = "#a08050"; c.lineWidth = 1; c.beginPath(); c.moveTo(-8 + k * 2, -14.4); c.lineTo(-7.4 + k * 2, -7.4); c.stroke(); }
      seil(c, [0, -14.6, 0.4, -24], "#a08050", 0.9);
    }, a(c, p, t) { const a = t * 0.4 + p.s * 9; c.save(); c.translate(11, -11); metal(c, -0.5, -0.5, 3, 1, "#4a4446"); c.translate(2.4, 0); c.rotate(a); metal(c, -0.5, -0.5, 1, 5, "#4a4446"); wood(c, -0.6, 4, 3, 1.4, "#6a4428", Z.Rng(3)); c.restore(); } },
    uhrtisch: { at: "f", w: 3, box: [-26, -30, 26, 4], s(c, R, v) {
      const ty = tisch(c, R, 38, 12, "#5a3a22");
      wood(c, -16, ty - 0.6, 18, 0.6, "#3a2a1a", R, false);
      for (let k = 0; k < 9; k++) { const x = -14 + R() * 14, r = 0.6 + R() * 1.4, col = R() < 0.5 ? "#b8923a" : "#8e8c8a"; c.fillStyle = col; zahnradF(c, x, ty - r - 0.2, r, 8, r * 0.3); c.fill(); E(c, x, ty - r - 0.2, r * 0.3, r * 0.3, "#2a1a10"); }
      E(c, 6, ty - 3, 3, 3, "#b8923a"); E(c, 6, ty - 3, 2.4, 2.4, "#efe6d0"); Ln(c, "#1a1210", 0.3, [6, ty - 3, 6, ty - 5]); Ln(c, "#1a1210", 0.3, [6, ty - 3, 7.4, ty - 3]); B(c, 5.6, ty - 6.4, 0.8, 0.8, "#b8923a");
      c.save(); c.translate(-4, ty - 1); c.rotate(-0.6); metal(c, 0, -0.3, 6, 0.6, "#3a2a1a"); c.strokeStyle = "#b8923a"; c.lineWidth = 0.6; c.beginPath(); c.arc(7.6, 0, 1.8, 0, TAU); c.stroke(); c.fillStyle = "rgba(230,240,220,.35)"; c.beginPath(); c.arc(7.6, 0, 1.5, 0, TAU); c.fill(); c.restore();
      Ln(c, "#8e8c8a", 0.3, [10, ty - 0.2, 13, ty - 0.6]); Ln(c, "#8e8c8a", 0.3, [10, ty - 0.4, 13, ty - 0.2]);
      c.fillStyle = lg(c, 0, ty - 7, 0, ty, ["#c8a040", "#8a6a2a"]); c.beginPath(); c.moveTo(14, ty); c.lineTo(15, ty - 2); c.lineTo(17, ty - 2); c.lineTo(18, ty); c.fill(); c.fillStyle = "rgba(255,240,210,.35)"; c.beginPath(); c.ellipse(16, ty - 4.6, 1.8, 2.6, 0, 0, TAU); c.fill(); B(c, 15.2, ty - 7.6, 1.6, 0.6, "#8a6a2a");
    }, fls: [[16, -16.6, 0.4]], holeR: [10, -16, 30, 0.35] },
    zahnrad: { at: "w", box: [-4, -30, 4, -22], s(c) { E(c, 0, -26, 3, 3, "#2a1a10"); }, a(c, p, t) {
      const r1 = 5 + p.s * 4, r2 = r1 * 0.6, a = t * 0.4 * (p.s > 0.5 ? 1 : -1), col = ["#8a6a3a", "#a8643a", "#8e8c8a"][p.v];
      const g = (x, y, r, rot, cl) => { c.save(); c.translate(x, y); c.rotate(rot); c.fillStyle = lg(c, -r, -r, r, r, [sh(cl, 0.3), cl, sh(cl, -0.45)]); zahnradF(c, 0, 0, r, Math.round(r * 2.2), 1.8); c.fill(); c.globalCompositeOperation = "destination-out"; for (let k = 0; k < 4; k++) { const b = k / 4 * TAU + 0.4; E(c, Math.cos(b) * r * 0.55, Math.sin(b) * r * 0.55, r * 0.2, r * 0.2, "#000"); } c.globalCompositeOperation = "source-over"; E(c, 0, 0, r * 0.25, r * 0.25, "#2a1a10"); rivet(c, 0, 0, r * 0.12); c.restore(); };
      g(0, -26, r1, a, col); const n1 = Math.round(r1 * 2.2), n2 = Math.round(r2 * 2.2); g(r1 + r2 + 1.6, -26 + r2 * 0.4, r2, -a * n1 / n2 + 0.2, "#b8923a");
    } },
    seilrolle: { at: "w", box: [-10, -40, 10, -4], s(c, R, v) { metal(c, -3, -36, 6, 1.4, "#3a3436"); Ln(c, "#3a3436", 1, [0, -35, 0, -32]); }, a(c, p, t) {
      const a = t * 0.6 + p.s * 9, bob = Math.sin(t * 0.6 + p.s * 9) * 3; c.save(); c.translate(0, -30); c.rotate(a); E(c, 0, 0, 3.6, 3.6, "#5a3a22"); E(c, 0, 0, 2.6, 2.6, "#4a2e1a"); for (let k = 0; k < 4; k++) { const b = k / 4 * TAU; Ln(c, "#6a4428", 0.6, [0, 0, Math.cos(b) * 2.6, Math.sin(b) * 2.6]); } rivet(c, 0, 0, 0.6); c.restore();
      seil(c, [-3.6, -30, -3.6, -14 + bob], "#a08050", 0.6); seil(c, [3.6, -30, 3.6, -18 - bob], "#a08050", 0.6);
      metal(c, -5.6, -14 + bob, 4, 4, "#4a4446"); E(c, 3.6, -16 - bob, 1.4, 1.8, "#5a3a22"); } },
    uhrblatt: { at: "w", box: [-16, -46, 16, -6], s(c, R, v) {
      const cx = 0, cy = -26, r = 12; c.fillStyle = lg(c, -r, cy - r, r, cy + r, ["#c8a040", "#6a4a1a"]); c.beginPath(); c.arc(cx, cy, r + 1.4, 0, TAU); c.fill();
      c.fillStyle = rg(c, cx - 3, cy - 4, r * 1.2, ["#f4ecd8", "#d8ccb0", "#a89a7a"]); c.beginPath(); c.arc(cx, cy, r, 0, TAU); c.fill();
      const RN = ["XII", "I", "II", "III", "IIII", "V", "VI", "VII", "VIII", "IX", "X", "XI"]; c.fillStyle = "#2a1a14"; c.font = "bold 2.2px 'Alegreya Sans',sans-serif"; c.textAlign = "center"; c.textBaseline = "middle";
      for (let k = 0; k < 12; k++) { const a = k / 12 * TAU - PI / 2; c.fillText(RN[k], cx + Math.cos(a) * (r - 2.6), cy + Math.sin(a) * (r - 2.6)); B(c, cx + Math.cos(a) * (r - 0.8) - 0.2, cy + Math.sin(a) * (r - 0.8) - 0.2, 0.4, 0.4, "#2a1a14"); }
      c.textAlign = "start"; c.textBaseline = "alphabetic";
      c.strokeStyle = "rgba(80,60,40,.4)"; c.lineWidth = 0.2; c.beginPath(); c.arc(cx, cy, r - 4.4, 0, TAU); c.stroke();
      if (v === 2) Ln(c, "rgba(40,30,20,.6)", 0.3, [cx + 3, cy - r, cx + 1, cy - 4, cx + 4, cy + 2]);
    }, a(c, p, t) { const mn = t * 0.12 + p.s * 30, hr = mn / 12; c.strokeStyle = "#1a1210"; c.lineCap = "round"; c.lineWidth = 0.5; c.beginPath(); c.moveTo(0, -26); c.lineTo(Math.sin(mn) * 9, -26 - Math.cos(mn) * 9); c.stroke(); c.lineWidth = 0.9; c.beginPath(); c.moveTo(0, -26); c.lineTo(Math.sin(hr) * 6, -26 - Math.cos(hr) * 6); c.stroke(); c.lineCap = "butt"; E(c, 0, -26, 0.9, 0.9, "#c8a040"); } },
    werkzeugbrett_fein: { at: "w", box: [-16, -40, 16, -12], s(c, R, v) {
      wood(c, -14, -36, 28, 18, "#5a3a22", R, false); B(c, -14, -36, 28, 18, "rgba(0,0,0,.2)");
      for (let k = 0; k < 7; k++) { const x = -11 + k * 3.6; B(c, x - 0.3, -34.6, 0.6, 1, "#3a3436"); const tp = k % 4;
        if (tp === 0) { metal(c, x - 0.3, -33.4, 0.6, 7, "#8e8c8a"); B(c, x - 0.7, -27, 1.4, 4, "#6a2a2a"); }
        else if (tp === 1) { Ln(c, "#9e9c9a", 0.4, [x - 0.6, -33.4, x, -24]); Ln(c, "#9e9c9a", 0.4, [x + 0.6, -33.4, x, -24]); }
        else if (tp === 2) { metal(c, x - 1.4, -33, 2.8, 1.6, "#6a6668"); B(c, x - 0.3, -31.4, 0.6, 6, "#6a4428"); }
        else { c.strokeStyle = "#8e8c8a"; c.lineWidth = 0.5; c.beginPath(); c.arc(x, -31, 1.6, 0, TAU); c.stroke(); Ln(c, "#8e8c8a", 0.5, [x, -29.4, x, -24]); } }
      for (const [x, y] of [[-12, -21], [12, -21], [-12, -34], [12, -34]]) rivet(c, x, y, 0.4);
    } },
    glockenseil: { at: "c", len: 5, box: [-3, -1, 3, 2], s(c) { metal(c, -2, 0, 4, 1.2, "#3a3436"); }, a(c, p, t) {
      const L = 30 + p.v * 8, sw = Math.sin(t * 0.5 + p.s * 9) * 2; seil(c, [0, 1, sw * 0.5, L * 0.5, sw, L], "#c8b080", 0.9);
      c.fillStyle = "#7a1a20"; c.beginPath(); c.ellipse(sw, L + 2, 1.4, 2.6, 0, 0, TAU); c.fill(); for (let k = 0; k < 6; k++) Ln(c, "#c8a040", 0.3, [sw - 1.2 + k * 0.5, L + 4, sw - 1.4 + k * 0.55, L + 7]); B(c, sw - 1.4, L + 3.6, 2.8, 0.6, "#c8a040");
    } },
    flaschenzug: { at: "c", len: 5, box: [-3, -1, 3, 2], s(c) { metal(c, -2, 0, 4, 1.2, "#3a3436"); }, a(c, p, t) {
      const L = 16 + p.v * 4, sw = Math.sin(t * 0.6 + p.s * 9) * 0.05; c.save(); c.rotate(sw); kette(c, 0, 1, 0, 5, "#4a4446");
      B(c, -2.6, 5, 5.2, 7, "#5a3a22"); E(c, 0, 8.5, 2, 2, "#4a2e1a"); rivet(c, 0, 8.5, 0.5);
      seil(c, [-2, 8.5, -2, L + 6], "#a08050", 0.6); seil(c, [2, 8.5, 2, L], "#a08050", 0.6);
      c.strokeStyle = "#5a5456"; c.lineWidth = 1; c.beginPath(); c.moveTo(2, L); c.lineTo(2, L + 2); c.arc(0.6, L + 3.4, 1.4, 0, PI * 0.9); c.stroke(); c.restore();
    } }
  });
  function zahnradF(c, x, y, r, n, th) { c.beginPath(); for (let q = 0; q < n; q++) { const a = q / n * TAU, da = TAU / n; c.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); c.lineTo(x + Math.cos(a + da * 0.15) * (r + th), y + Math.sin(a + da * 0.15) * (r + th)); c.lineTo(x + Math.cos(a + da * 0.45) * (r + th), y + Math.sin(a + da * 0.45) * (r + th)); c.lineTo(x + Math.cos(a + da * 0.6) * r, y + Math.sin(a + da * 0.6) * r); } c.closePath(); }
  /* ---------- Spinnenschlund ---------- */
  Object.assign(K, {
    eiersack: { at: "f", w: 1, box: [-10, -34, 10, 3], breath: [0.04, 2], s(c, R, v) {
      c.strokeStyle = "rgba(230,224,236,.45)"; c.lineWidth = 0.3; for (const [x, y] of [[-8, -30], [7, -32], [-9, -2], [9, -1], [0, -33]]) { c.beginPath(); c.moveTo(0, -8); c.lineTo(x, y); c.stroke(); }
      E(c, 0, -0.3, 6, 1, "rgba(0,0,0,.35)");
      c.fillStyle = rg(c, -2, -9, 9, ["#f0e8f0", "#d0c4d4", "#9a8aa0"]); c.beginPath(); c.ellipse(0, -7, 6, 7, 0, 0, TAU); c.fill();
      for (let k = 0; k < 9; k++) { const ex = -3.4 + (k % 3) * 3.4 + (Math.floor(k / 3) % 2) * 1.2, ey = -10 + Math.floor(k / 3) * 3; E(c, ex, ey, 1.3, 1.3, "rgba(150,120,150,.5)"); E(c, ex - 0.4, ey - 0.4, 0.4, 0.4, "rgba(255,255,255,.4)"); }
      c.strokeStyle = "rgba(255,255,255,.35)"; c.lineWidth = 0.25; for (let k = -5; k < 6; k += 2) { c.beginPath(); c.moveTo(-6, -7 + k); c.quadraticCurveTo(0, -5 + k, 6, -8 + k); c.stroke(); }
      if (v === 1) { c.fillStyle = "#2a2028"; c.beginPath(); c.ellipse(2.4, -4, 1.4, 1.8, 0.4, 0, TAU); c.fill(); }
    }, a(c, p, t) {
      if (p.v === 2) { const u = (t * 0.2 + p.s) % 1; if (u < 0.5) { const sx = 2 + u * 20, sy = -3 + u * 3; E(c, sx, sy, 0.7, 0.5, "#2a2028"); for (let k = 0; k < 3; k++) Ln(c, "#2a2028", 0.15, [sx - 0.6, sy, sx - 1.2, sy + 0.6 + Math.sin(t * 30 + k) * 0.3]); } }
    } },
    pilze: { at: "f", w: 1, box: [-10, -18, 10, 3], s(c, R, v) {
      const caps = [["#c86ad0", "#8a4ac0"], ["#d88a4a", "#a85a2a"], ["#c8d86a", "#8aa04a"]][v];
      for (let k = 0; k < 5; k++) { const px = -6 + k * 3 + R() * 1.4, h = 3 + R() * 8, r = 1.6 + R() * 2.4, cap = caps[k % 2];
        c.fillStyle = lg(c, px - 0.6, 0, px + 0.6, 0, ["#efe6f0", "#b8a8c0"]); c.fillRect(px - 0.5, -h, 1, h); E(c, px, -h * 0.4, 0.9, 0.3, "rgba(255,255,255,.3)");
        c.fillStyle = rg(c, px - r * 0.3, -h - r * 0.3, r * 1.4, [sh(cap, 0.35), cap, sh(cap, -0.4)]); c.beginPath(); c.ellipse(px, -h, r, r * 0.6, 0, PI, 0); c.fill(); E(c, px, -h, r, r * 0.18, sh(cap, -0.5));
        for (let q = 0; q < 3; q++) E(c, px - r * 0.5 + R() * r, -h - R() * r * 0.4, 0.3, 0.25, "rgba(255,250,240,.7)"); }
      for (let k = 0; k < 8; k++) E(c, -8 + R() * 16, -0.3, 1 + R(), 0.4, "#2a3a22");
    }, a(c, p, t) { glow(0, -8, 12, 0.35, ["p", "e", "g"][p.v]); for (let k = 0; k < 2; k++) { const u = (t * 0.15 + k * 0.5 + p.s) % 1; E(c, -3 + k * 6 + Math.sin(u * 7 + k) * 3, -6 - u * 20, 0.35, 0.35, "rgba(220,180,255," + 0.7 * Math.sin(u * PI) + ")"); } } },
    knochenhaufen: { at: "f", w: 2, box: [-16, -16, 16, 3], s(c, R, v) {
      shadow(c, 0, 0.5, 14, 1.6, 0.4);
      for (let k = 0; k < 16; k++) { const a = (R() - 0.5) * 2.4, l = 2 + R() * 4, bx = -10 + R() * 20, by = -1 - R() * 6 * (1 - Math.abs(bx) / 13); knochen(c, bx - Math.cos(a) * l, by - Math.sin(a) * l * 0.5, bx + Math.cos(a) * l, by + Math.sin(a) * l * 0.5, 0.8 + R() * 0.4); }
      for (let k = 0; k < 3; k++) schaedel(c, -7 + k * 7 + R() * 2, -3 - (k === 1 ? 5 : 1.4), 2 + R() * 0.6, (R() - 0.5) * 1.4);
      c.fillStyle = lg(c, 0, -8, 0, -4, ["#7e7c7a", "#3c3a38"]); c.beginPath(); c.arc(9, -3.4, 3.4, PI, 0); c.fill(); B(c, 5.4, -3.6, 7.2, 0.8, "#4c4a48"); E(c, 8, -5.6, 0.8, 0.5, "rgba(140,70,30,.6)");
      c.strokeStyle = "rgba(230,224,236,.4)"; c.lineWidth = 0.25; for (let k = 0; k < 7; k++) { c.beginPath(); c.moveTo(-12 + R() * 24, -R() * 8); c.quadraticCurveTo(0, -12, -12 + R() * 24, -R() * 8); c.stroke(); }
    } },
    kristall: { at: "f", w: 1, box: [-10, -24, 10, 3], s(c, R, v) {
      const cols = [["#b87aff", "#6a3aa8"], ["#ff7ab0", "#a83a6a"], ["#c8ff8a", "#6aa83a"]][v];
      E(c, 0, -0.4, 7, 1.2, "rgba(0,0,0,.4)");
      for (let k = 0; k < 6; k++) { const a = (k - 2.5) * 0.32 + (R() - 0.5) * 0.2, h = 8 + R() * 12, w = 1.4 + R() * 1.6, x = (k - 2.5) * 2; c.save(); c.translate(x, 0); c.rotate(a);
        P(c, cols[1], [-w, 0, -w, -h, 0, -h - w * 1.6, 0, 0]); P(c, cols[0], [0, 0, 0, -h - w * 1.6, w, -h, w, 0]); Ln(c, "rgba(255,255,255,.6)", 0.3, [-w * 0.5, -1, -w * 0.5, -h + 1]); c.restore(); }
      stein(c, [-8, 0, -6, -3, 6, -3.4, 8, 0], "#3a3438", R);
    }, a(c, p, t) { glow(0, -10, 16, 0.4 + 0.15 * Math.sin(t * 1.5 + p.s * 9), ["p", "e", "g"][p.v]); } },
    kokon_boden: { at: "f", w: 2, box: [-16, -20, 16, 3], s(c, R, v) {
      E(c, 0, -0.3, 12, 1.2, "rgba(0,0,0,.4)");
      c.strokeStyle = "rgba(230,224,236,.45)"; c.lineWidth = 0.3; for (let k = 0; k < 8; k++) { c.beginPath(); c.moveTo(-8 + k * 2.4, -4); c.lineTo(-14 + k * 4, -18 + R() * 4); c.stroke(); }
      c.fillStyle = lg(c, 0, -9, 0, 0, ["#f0e8f0", "#c8bcd0", "#8a7a90"]); c.beginPath(); c.ellipse(0, -3.6, 11, 3.8, 0.05, 0, TAU); c.fill();
      c.strokeStyle = "rgba(160,150,170,.7)"; c.lineWidth = 0.3; for (let k = -10; k < 11; k += 1.8) { c.beginPath(); c.moveTo(k, -7); c.quadraticCurveTo(k + 1.6, -3.6, k - 0.4, -0.2); c.stroke(); }
      if (v !== 1) { c.fillStyle = "#c8b8a0"; c.beginPath(); c.moveTo(10, -4); c.lineTo(13, -5.6); c.lineTo(14, -5); c.lineTo(13.6, -3.4); c.lineTo(11, -2.6); c.fill(); for (let k = 0; k < 3; k++) Ln(c, "#c8b8a0", 0.35, [13.4, -5.2 + k * 0.6, 15, -6 + k * 0.8]); }
      else { B(c, 9, -4.4, 3, 3, "#3a2a1a"); B(c, 11.4, -2.6, 1.6, 1.6, "#2a1a10"); }
    } },
    kaefer: { at: "f", w: 2, box: [-16, -14, 16, 3], s(c, R, v) {
      E(c, 0, -0.3, 12, 1.2, "rgba(0,0,0,.4)"); const col = ["#3a2a3a", "#2a3a2a", "#4a3020"][v];
      c.strokeStyle = sh(col, -0.2); c.lineWidth = 0.8; for (let k = 0; k < 3; k++) { c.beginPath(); c.moveTo(-4 + k * 4, -3); c.lineTo(-6 + k * 5, -9 - k); c.lineTo(-8 + k * 6, -11 - k * 0.6); c.stroke(); }
      c.fillStyle = rg(c, -3, -7, 12, [sh(col, 0.45), col, sh(col, -0.5)]); c.beginPath(); c.ellipse(-1, -3.4, 10, 4.6, 0.1, PI, TAU); c.fill(); B(c, -11, -3.6, 20, 1, sh(col, -0.4));
      Ln(c, sh(col, -0.5), 0.4, [-1, -7.8, -1.6, -3]); E(c, -4, -6, 3, 1, "rgba(255,255,255,.25)");
      E(c, 10, -3.2, 2.6, 2, sh(col, 0.1)); Ln(c, sh(col, -0.2), 0.5, [12, -3.6, 15, -6]); Ln(c, sh(col, -0.2), 0.5, [12, -3, 15.6, -2]);
      c.globalCompositeOperation = "destination-out"; E(c, 3, -5, 2.4, 1.6, "#000"); c.globalCompositeOperation = "source-over";
    } },
    pilzring: { at: "f", w: 2, box: [-16, -8, 16, 3], s(c, R, v) {
      for (let k = 0; k < 11; k++) { const a = k / 11 * TAU, x = Math.cos(a) * 12, y = -0.6 + Math.sin(a) * 1.4 - 1, h = 1.6 + R() * 2.4, r = 0.9 + R() * 0.8; Ln(c, "#e8e0ec", 0.5, [x, y + h * 0.3, x, y - h]); E(c, x, y - h, r, r * 0.6, ["#c86ad0", "#e89a4a", "#d8e06a"][v]); E(c, x - r * 0.3, y - h - r * 0.2, r * 0.3, r * 0.15, "rgba(255,255,255,.5)"); }
    }, a(c, p, t) { glow(0, -2, 14, 0.25 + 0.1 * Math.sin(t * 2 + p.s * 9), ["p", "e", "g"][p.v]); } },
    spinnweben: { at: "w", box: [-26, -24, 26, 24], noflip: true, a(c, p, t) {
      const d = p.f, ax = d > 0 ? -8 : 8, ay = -16, wv = Math.sin(t * 0.8 + p.s * 9) * 0.6;
      c.strokeStyle = "rgba(230,224,236,.42)"; c.lineWidth = 0.35;
      for (let k = 0; k < 7; k++) { const a = k / 6 * PI / 2; c.beginPath(); c.moveTo(ax, ay); c.lineTo(ax + d * Math.cos(a) * 24, ay + Math.sin(a) * 24 + (k > 2 ? wv : 0)); c.stroke(); }
      for (let r = 4; r < 24; r += 3.4) { c.beginPath(); for (let k = 0; k <= 6; k++) { const a = k / 6 * PI / 2, px = ax + d * Math.cos(a) * r, py = ay + Math.sin(a) * r + (k > 2 ? wv * r / 24 : 0); if (!k) c.moveTo(px, py); else { const am = (k - 0.5) / 6 * PI / 2; c.quadraticCurveTo(ax + d * Math.cos(am) * r * 0.86, ay + Math.sin(am) * r * 0.86, px, py); } } c.stroke(); }
      for (let k = 0; k < 4; k++) { const a = (k + 0.5) / 4 * PI / 2, r = 8 + k * 4; E(c, ax + d * Math.cos(a) * r, ay + Math.sin(a) * r, 0.4, 0.4, "rgba(240,240,250,.6)"); }
      if (p.v === 1) { const fx = ax + d * 12, fy = ay + 10; E(c, fx, fy, 0.8, 0.6, "#1a1214"); c.strokeStyle = "rgba(240,236,244,.6)"; c.lineWidth = 0.25; c.beginPath(); c.ellipse(fx, fy, 1.3, 1, 0, 0, TAU); c.stroke(); }
    } },
    wandpilze: { at: "w", box: [-14, -40, 14, -8], s(c, R, v) {
      for (let k = 0; k < 6; k++) { const x = -9 + (k % 3) * 8 + R() * 2, y = -34 + Math.floor(k / 3) * 12 + R() * 4, r = 3 + R() * 2.4, col = ["#c8a080", "#a86ad0", "#d8c070"][v];
        c.fillStyle = lg(c, 0, y - r * 0.6, 0, y + 1, [sh(col, 0.3), col, sh(col, -0.45)]); c.beginPath(); c.ellipse(x, y, r, r * 0.55, 0, PI, TAU); c.lineTo(x + r, y + 0.6); c.lineTo(x - r, y + 0.6); c.fill();
        for (let q = 0; q < 3; q++) Ln(c, sh(col, -0.3), 0.2, [x - r + 0.6, y - q * 0.6, x + r - 0.6, y - q * 0.6]); B(c, x - r, y + 0.4, r * 2, 0.6, sh(col, -0.5)); }
    }, a(c, p, t) { if (p.v === 1) glow(0, -26, 16, 0.3, "p"); } },
    eier_wand: { at: "w", box: [-12, -40, 12, -10], s(c, R, v) {
      c.fillStyle = "rgba(230,224,236,.35)"; c.beginPath(); c.ellipse(0, -26, 10, 11, 0, 0, TAU); c.fill();
      for (let k = 0; k < 14; k++) { const a = R() * TAU, r = R() * 7, x = Math.cos(a) * r, y = -26 + Math.sin(a) * r * 1.1; E(c, x, y, 1.7, 1.9, "#e8dce0"); E(c, x - 0.5, y - 0.6, 0.6, 0.6, "rgba(255,255,255,.7)"); E(c, x + 0.4, y + 0.6, 0.8, 0.6, "rgba(150,120,150,.4)"); }
      c.strokeStyle = "rgba(240,236,244,.45)"; c.lineWidth = 0.25; for (let k = 0; k < 10; k++) { const a = k / 10 * TAU; c.beginPath(); c.moveTo(Math.cos(a) * 6, -26 + Math.sin(a) * 6); c.lineTo(Math.cos(a) * 13, -26 + Math.sin(a) * 14); c.stroke(); }
    } },
    gespinst: { at: "w", box: [-18, -44, 18, -4], s(c, R, v) {
      c.fillStyle = "rgba(230,224,236,.16)"; c.beginPath(); c.moveTo(-16, -40); c.quadraticCurveTo(0, -30, 16, -40); c.quadraticCurveTo(10, -20, 14, -6); c.quadraticCurveTo(0, -14, -14, -6); c.quadraticCurveTo(-10, -22, -16, -40); c.fill();
      c.strokeStyle = "rgba(240,236,244,.35)"; c.lineWidth = 0.3; for (let k = 0; k < 18; k++) { c.beginPath(); c.moveTo(-16 + R() * 32, -40 + R() * 6); c.quadraticCurveTo(-10 + R() * 20, -26, -14 + R() * 28, -8 - R() * 4); c.stroke(); }
      if (v !== 0) { c.fillStyle = "rgba(240,230,240,.8)"; c.beginPath(); c.ellipse(2, -24, 3, 6, 0.2, 0, TAU); c.fill(); for (let k = -4; k < 5; k += 1.6) Ln(c, "rgba(150,140,160,.6)", 0.25, [-1 + k * 0.2, -24 + k, 5 + k * 0.2, -25 + k]); }
    } },
    kokon_h: { at: "c", len: 5, box: [-2, -1, 2, 2], a(c, p, t) {
      const L = 14 + p.v * 6, sw = Math.sin(t * 0.7 + p.s * 9) * 1.6; Ln(c, "rgba(230,226,236,.5)", 0.35, [0, 0, sw, L]); for (const dx of [-8, 8]) Ln(c, "rgba(230,226,236,.25)", 0.25, [dx, 0, sw, L - 4]);
      c.save(); c.translate(sw, L + 9); c.rotate(sw * 0.04 + Math.sin(t * 3.1 + p.s) * (p.v === 2 ? 0.08 : 0));
      c.fillStyle = rg(c, -1.4, -3, 10, ["#f0e8f4", "#c8bcd0", "#8a7a92"]); c.beginPath(); c.ellipse(0, 0, 4.4, 9.6, 0, 0, TAU); c.fill();
      c.strokeStyle = "rgba(150,140,160,.7)"; c.lineWidth = 0.3; for (let k = -8; k < 9; k += 2) { c.beginPath(); c.moveTo(-4, k); c.quadraticCurveTo(0, k + 2.4, 4, k - 0.8); c.stroke(); }
      if (p.v === 0) { B(c, -1.2, 9, 2.4, 3, "#3a2a1a"); B(c, -1.6, 11.4, 3.2, 1.2, "#2a1a10"); } else if (p.v === 1) { E(c, 0, -6, 2, 2.2, "#c8b8a0"); B(c, -0.9, -6.4, 0.6, 0.6, "#1a1014"); B(c, 0.4, -6.4, 0.6, 0.6, "#1a1014"); }
      c.restore();
    } },
    /* ---------- Runenschmiede ---------- */
    amboss: { at: "f", w: 2, box: [-16, -22, 16, 3], s(c, R, v) {
      shadow(c, 0, 0.5, 13, 1.8, 0.5);
      c.fillStyle = lg(c, -6, 0, 6, 0, ["#8a6a44", "#5a3e24", "#3a2414"]); c.beginPath(); c.moveTo(-6, 0); c.lineTo(-5, -7); c.lineTo(5, -7); c.lineTo(6, 0); c.fill(); E(c, 0, -7, 5, 1, "#a8845a"); for (let k = -4; k < 5; k += 1.6) Ln(c, "rgba(30,14,6,.4)", 0.25, [k, -6.6, k * 1.1, 0]);
      const ir = "#4a4446"; c.fillStyle = lg(c, 0, -14, 0, -7, [sh(ir, 0.35), ir, sh(ir, -0.5)]); c.beginPath(); c.moveTo(-4, -7); c.lineTo(-3, -9.6); c.lineTo(-9, -10.2); c.lineTo(-13, -12.4); c.lineTo(8, -12.4); c.lineTo(9, -10); c.lineTo(4, -9.6); c.lineTo(4, -7); c.fill();
      B(c, -12, -12.6, 20, 0.6, "rgba(255,255,255,.45)"); B(c, 4, -12.2, 1, 0.8, "#1a1414"); B(c, 6, -12.2, 0.8, 0.8, "#1a1414");
      c.save(); c.translate(-12, -1.6); c.rotate(0.15); wood(c, 0, -0.6, 9, 1.2, "#7a5a32", R, false); metal(c, -2.4, -1.8, 3, 3.6, "#5a5658"); c.restore();
      if (v !== 1) { c.save(); c.translate(10, -1); metal(c, -1, -0.6, 7, 1, "#5a5658"); metal(c, -3, -1.6, 3, 2.4, "#4a4446"); c.restore(); }
    }, a(c, p, t) {
      const hot = 0.55 + 0.45 * Math.sin(t * 0.8 + p.s * 9);
      c.fillStyle = "rgba(255," + (120 + hot * 100 | 0) + ",40," + (0.5 + hot * 0.5) + ")"; c.fillRect(-6, -13.8, 8, 1.4); E(c, 2, -13.1, 1.2, 0.7, "rgba(255,230,140," + hot + ")");
      glow(-2, -13, 9, 0.35 * hot, "e");
      if (rich() && Math.random() < 0.015) Z.fx.burst(cx0 - 2 * cf0, cy0 - 13, 5, { col: ["#ffb040", "#fff0c0"], sp: 70, life: 0.35, size: 1, kind: "spark", add: true });
    } },
    schleifstein: { at: "f", w: 2, box: [-16, -22, 16, 3], s(c, R, v) {
      shadow(c, 0, 0.5, 12, 1.6, 0.45);
      for (const x of [-9, 7]) { c.save(); c.translate(x, 0); c.rotate(x < 0 ? 0.1 : -0.1); wood(c, -1, -12, 2, 12, "#5a3a22", R, true); c.restore(); }
      wood(c, -10, -6, 20, 1.4, "#4a2e1a", R, false);
      c.fillStyle = "#4a2e1a"; c.beginPath(); c.moveTo(-6, -11); c.lineTo(6, -11); c.lineTo(5, -14); c.lineTo(-5, -14); c.fill(); E(c, 0, -11, 5, 0.6, "#2a2a22"); E(c, 0, -11.2, 4, 0.4, "#5a6a4a");
      c.save(); c.translate(-12, -1); c.rotate(-0.2); wood(c, 0, -0.5, 14, 1.2, "#6a4428", R, false); c.restore();
    }, a(c, p, t) {
      const a = t * 3, r = 6.4, cy = -13; c.fillStyle = rg(c, -2, cy - 2, r * 1.3, ["#b8ae9a", "#8a8070", "#5a5048"]); c.beginPath(); c.arc(0, cy, r, 0, TAU); c.fill();
      c.strokeStyle = "rgba(60,50,40,.5)"; c.lineWidth = 0.3; for (let k = 0; k < 3; k++) { c.beginPath(); c.arc(0, cy, r - 1.4 - k * 1.4, a + k, a + k + 2.4); c.stroke(); }
      Ln(c, "#3a3436", 0.8, [Math.cos(a) * 1.2, cy + Math.sin(a) * 1.2, Math.cos(a + PI) * 1.2, cy + Math.sin(a + PI) * 1.2]); E(c, 0, cy, 1, 1, "#3a3436");
      c.strokeStyle = "#6a4428"; c.lineWidth = 0.7; c.beginPath(); c.moveTo(0, cy); c.lineTo(Math.cos(a) * 4, cy + Math.sin(a) * 4); c.lineTo(Math.cos(a) * 4, cy + Math.sin(a) * 4 + 9); c.stroke();
      if (Math.sin(t * 0.5 + p.s * 9) > 0.3) { metal(c, 4, cy - 7, 1, 7, "#b2b0ac"); for (let k = 0; k < 3; k++) { const u = (t * 4 + k / 3) % 1; E(c, 5 + u * 8, cy - 3 - u * 6 + u * u * 10, 0.3, 0.3, "rgba(255,200,90," + (1 - u) + ")"); } }
    } },
    runensteine: { at: "f", w: 2, box: [-14, -20, 14, 3], s(c, R, v) {
      shadow(c, 0, 0.5, 12, 1.6, 0.45);
      for (let k = 0; k < 3; k++) { const rx = -7 + k * 7, h = 8 + (k % 2) * 5; stein(c, [rx - 3.2, 0, rx - 2.6, -h, rx - 0.6, -h - 1.4, rx + 2.6, -h - 0.4, rx + 3.2, 0], "#5a5060", R); Ln(c, "rgba(255,255,255,.15)", 0.3, [rx - 2.6, -h, rx - 0.6, -h - 1.4]); }
    }, a(c, p, t) {
      for (let k = 0; k < 3; k++) { const rx = -7 + k * 7, h = 8 + (k % 2) * 5, g = 0.5 + 0.5 * Math.sin(t * 2 + k * 2 + p.s * 9);
        c.strokeStyle = "rgba(255," + (150 + g * 80 | 0) + ",60," + (0.4 + g * 0.6) + ")"; c.lineWidth = 0.6; c.beginPath();
        if ((k + p.v) % 3 === 0) { c.moveTo(rx - 1, -h + 2); c.lineTo(rx + 1, -h + 4.6); c.lineTo(rx - 1, -h + 7); } else if ((k + p.v) % 3 === 1) { c.moveTo(rx, -h + 1.6); c.lineTo(rx, -h + 7); c.moveTo(rx, -h + 3); c.lineTo(rx + 1.6, -h + 1.6); c.moveTo(rx, -h + 4.6); c.lineTo(rx + 1.6, -h + 3.2); } else { c.moveTo(rx - 1.4, -h + 2); c.lineTo(rx + 1.4, -h + 6); c.moveTo(rx + 1.4, -h + 2); c.lineTo(rx - 1.4, -h + 6); }
        c.stroke(); glow(rx, -h + 4, 5, 0.3 * g, "e"); }
    } },
    esse: { at: "f", w: 3, box: [-26, -48, 26, 4], s(c, R, v) {
      shadow(c, 0, 0.5, 24, 2, 0.5);
      for (let r = 0; r < 4; r++) for (let k = 0; k < 6; k++) { const x = -20 + k * 7 + (r % 2) * 3.4, y = -4 - r * 3.6; if (x > 18) continue; stein(c, [x, y, x + 6.8, y, x + 6.8, y + 3.4, x, y + 3.4], "#6a5e5a", R); }
      c.fillStyle = "#1a0e0a"; c.fillRect(-16, -16, 32, 3);
      for (let k = 0; k < 14; k++) E(c, -14 + R() * 28, -15.6 - R() * 1.6, 1.4, 1, R() < 0.4 ? "#2a1a14" : "#8a3010");
      c.fillStyle = lg(c, -20, 0, 20, 0, ["#5a4e4a", "#3a3230", "#1e1a18"]); c.beginPath(); c.moveTo(-20, -28); c.lineTo(20, -28); c.lineTo(10, -40); c.lineTo(-10, -40); c.closePath(); c.fill(); B(c, -7, -48, 14, 8, "#2e2826"); B(c, -21, -28, 42, 1.6, "#4a4240");
      for (let k = -18; k < 19; k += 6) rivet(c, k, -27.2, 0.5);
      for (const x of [-19, 17]) { metal(c, x, -27, 2, 11, "#3a3436"); }
      c.save(); c.translate(-24, -10); c.rotate(-0.1); c.fillStyle = "#4a2e1a"; c.beginPath(); c.moveTo(0, 0); c.lineTo(6, -3); c.lineTo(6, 3); c.closePath(); c.fill(); c.fillStyle = "#6a4a2a"; c.beginPath(); c.moveTo(-4, -4); c.quadraticCurveTo(2, -8, 6, -3); c.lineTo(6, 3); c.quadraticCurveTo(2, 8, -4, 4); c.fill(); for (let k = 0; k < 3; k++) Ln(c, "rgba(0,0,0,.3)", 0.4, [-2 + k * 2.4, -5.4 + k * 0.6, -2 + k * 2.4, 5.4 - k * 0.6]); c.restore();
    }, fls: [[-6, -16, 1.3, null, "e"], [2, -16, 1.6, null, "w"], [8, -15.6, 1.1, null, "e"]], holeR: [0, -20, 70, 0.7],
      a(c, p, t) { glow(0, -16, 22, 0.55 + 0.15 * Math.sin(t * 1.7), "e"); for (let k = 0; k < 12; k++) { const x = -14 + (k * 7.3 % 28), h = 0.5 + 0.5 * Math.sin(t * 2 + k * 1.7); E(c, x, -15.4, 1.2, 0.7, "rgba(255," + (90 + h * 120 | 0) + ",30," + (0.5 + h * 0.5) + ")"); } if (rich()) rauch(c, 0, -48, t, p.s * 3, "80,70,70"); } },
    wassertrog: { at: "f", w: 2, box: [-15, -16, 15, 3], s(c, R, v) {
      shadow(c, 0, 0.5, 13, 1.8, 0.45);
      fass(c, 0, 0, 22, 9, "#5a3a22", R, "#2a2c26"); E(c, -4, -9, 4, 0.4, "rgba(230,240,220,.25)");
      c.save(); c.translate(4, -8.6); c.rotate(-0.9); metal(c, -0.3, -9, 0.6, 9, "#3a3436"); metal(c, 0.4, -9, 0.6, 9, "#3a3436"); c.restore();
    }, a(c, p, t) { for (let k = 0; k < 3; k++) { const u = (t * 0.4 + k / 3 + p.s) % 1; E(c, -6 + k * 5 + Math.sin(u * 6 + k) * 2, -10 - u * 14, 1 + u * 3, 1 + u * 2.4, "rgba(230,230,220," + 0.25 * Math.sin(u * PI) + ")"); } } },
    barren: { at: "f", w: 1, box: [-10, -12, 10, 3], s(c, R, v) {
      shadow(c, 0, 0.5, 9, 1.4, 0.45);
      const cols = [["#7a7678", "#8a8688"], ["#b8643a", "#7a7678"], ["#c8a040", "#b8643a"]][v];
      const bar = (x, y, col) => { c.fillStyle = lg(c, 0, y - 2, 0, y, [sh(col, 0.4), col, sh(col, -0.4)]); c.beginPath(); c.moveTo(x - 3.4, y); c.lineTo(x - 2.6, y - 2); c.lineTo(x + 2.6, y - 2); c.lineTo(x + 3.4, y); c.fill(); B(c, x - 2.4, y - 2, 4.8, 0.35, "rgba(255,255,240,.5)"); };
      for (let k = 0; k < 3; k++) bar(-5.4 + k * 5.4, 0, cols[0]); for (let k = 0; k < 2; k++) bar(-2.7 + k * 5.4, -2, cols[k % 2]); bar(0, -4, cols[1]);
    } },
    ruestungsstaender: { at: "f", w: 1, box: [-10, -34, 10, 3], s(c, R, v) {
      shadow(c, 0, 0.5, 6, 1.2, 0.45);
      P(c, "#4a2e1a", [-5, 0, 5, 0, 1, -2, -1, -2]); wood(c, -0.8, -28, 1.6, 26, "#5a3a22", R, true); wood(c, -6, -26, 12, 1.4, "#5a3a22", R, false);
      const st = v === 2 ? "#8e8c88" : "#6c6a68";
      c.fillStyle = lg(c, -5.4, 0, 5.4, 0, [sh(st, 0.35), st, sh(st, -0.45)]); c.beginPath(); c.moveTo(-5.4, -25); c.lineTo(5.4, -25); c.quadraticCurveTo(5.6, -18, 3.6, -14); c.lineTo(-3.6, -14); c.quadraticCurveTo(-5.6, -18, -5.4, -25); c.fill();
      if (v !== 2) { for (let k = 0; k < 8; k++) E(c, -4 + R() * 8, -24 + R() * 9, 0.5, 0.4, "rgba(30,26,30,.4)"); Ln(c, "rgba(255,200,120,.5)", 0.4, [-3, -20, 2, -20]); }
      for (const sd of [-1, 1]) { E(c, sd * 6, -24.4, 2.4, 1.8, sh(st, 0.05)); }
      if (v === 0) { B(c, -1.4, -30, 2.8, 2, "#c8a060"); E(c, 0, -31, 2, 1.2, "#c8a060"); } else { c.fillStyle = lg(c, -3, 0, 3, 0, [sh(st, 0.35), st, sh(st, -0.45)]); c.beginPath(); c.moveTo(-3, -26); c.quadraticCurveTo(-3.4, -32, 0, -32.4); c.quadraticCurveTo(3.4, -32, 3, -26); c.fill(); B(c, -2.6, -29, 5.2, 0.7, "#141016"); }
      c.save(); c.translate(7, 0); c.rotate(-0.15); metal(c, -0.4, -9, 0.8, 9, "#6a4428"); metal(c, -2, -10.4, 4, 2, "#5a5658"); c.restore();
    } },
    gussform: { at: "f", w: 1, box: [-10, -14, 10, 3], s(c, R, v) {
      shadow(c, 0, 0.5, 8, 1.4, 0.45);
      c.fillStyle = "#8a7a5a"; c.fillRect(-8, -3, 9, 3); B(c, -8, -3, 9, 0.4, "#a8987a"); c.fillStyle = "#3a2a20"; c.beginPath(); c.moveTo(-6, -2.6); c.lineTo(-1, -2.6); c.lineTo(-2, -1.2); c.lineTo(-5, -1.2); c.fill();
      c.fillStyle = lg(c, 1, 0, 9, 0, ["#7a6a6a", "#4a3e3e"]); c.beginPath(); c.moveTo(2, -8); c.lineTo(8, -8); c.lineTo(7, 0); c.lineTo(3, 0); c.fill(); E(c, 5, -8, 3, 0.8, "#2a1a14");
      c.save(); c.translate(-2, -6); c.rotate(-0.5); metal(c, 0, -0.3, 10, 0.6, "#4a4446"); c.restore();
    }, a(c, p, t) { const h = 0.6 + 0.4 * Math.sin(t * 1.1 + p.s * 9); E(c, 5, -8, 2.4, 0.55, "rgba(255," + (130 + h * 80 | 0) + ",40,.95)"); B(c, -5.6, -2.4, 4, 0.6, "rgba(255,120,40," + 0.6 * h + ")"); glow(5, -8, 7, 0.4 * h, "e"); } },
    zangen: { at: "w", box: [-14, -40, 14, -8], s(c, R, v) {
      wood(c, -12, -34, 24, 2, "#4a3020", R, false); for (let k = 0; k < 4; k++) B(c, -9 + k * 6 - 0.4, -32, 0.8, 1.4, "#2a2426");
      for (let k = 0; k < 4; k++) { const x = -9 + k * 6, tp = (k + v) % 3;
        if (tp === 0) { c.strokeStyle = "#4a4448"; c.lineWidth = 0.8; c.beginPath(); c.moveTo(x - 1, -30.4); c.lineTo(x + 0.8, -16); c.moveTo(x + 1, -30.4); c.lineTo(x - 0.8, -16); c.stroke(); E(c, x, -27.6, 0.6, 0.6, "#6a6668"); B(c, x - 1.2, -18, 0.8, 2, "#2a2426"); }
        else if (tp === 1) { metal(c, x - 0.4, -30.4, 0.8, 11, "#6a4428"); metal(c, x - 2.4, -20, 4.8, 3, "#5a5658"); }
        else { c.strokeStyle = "#4a4448"; c.lineWidth = 0.7; c.beginPath(); c.moveTo(x, -30.4); c.lineTo(x, -18); c.arc(x + 1.4, -18, 1.4, PI, 0, true); c.stroke(); } }
    } },
    runentafel: { at: "w", box: [-12, -40, 12, -12], s(c, R, v) {
      stein(c, [-9, -36, 9, -36, 9.6, -16, -9.6, -16], "#4a4250", R); B(c, -9, -36, 18, 0.5, "rgba(255,255,255,.15)");
      c.strokeStyle = "rgba(20,14,16,.7)"; c.lineWidth = 0.9; c.beginPath(); c.moveTo(-5, -32); c.lineTo(0, -26); c.lineTo(5, -32); c.moveTo(-5, -22); c.lineTo(5, -22); c.moveTo(0, -26); c.lineTo(0, -19); c.stroke();
    }, a(c, p, t) { const g = 0.5 + 0.5 * Math.sin(t * 1.6 + p.s * 9); c.strokeStyle = "rgba(255," + (150 + g * 80 | 0) + ",60," + (0.4 + 0.6 * g) + ")"; c.lineWidth = 0.6; c.beginPath(); c.moveTo(-5, -32); c.lineTo(0, -26); c.lineTo(5, -32); c.moveTo(-5, -22); c.lineTo(5, -22); c.moveTo(0, -26); c.lineTo(0, -19); c.stroke(); glow(0, -26, 12, 0.35 * g, "e"); } },
    werkzeugwand: { at: "w", box: [-18, -42, 18, -8], s(c, R, v) {
      wood(c, -16, -36, 32, 2, "#4a3020", R, false); wood(c, -16, -22, 32, 1.6, "#4a3020", R, false);
      for (let k = 0; k < 5; k++) { const x = -12 + k * 6; B(c, x - 0.4, -34, 0.8, 1.2, "#2a2426"); metal(c, x - 0.5, -33, 1, 10, "#6a4428"); const sz = 1.6 + (k % 3) * 0.8; metal(c, x - sz, -25 + (k % 2), sz * 2, sz * 1.2, "#5a5658"); }
      for (let k = 0; k < 4; k++) { const x = -10 + k * 7; metal(c, x - 0.3, -20.4, 0.6, 7, "#8e8c8a"); B(c, x - 0.8, -14, 1.6, 2.6, "#5a3a22"); }
    } },
    schwertwand: { at: "w", box: [-18, -44, 18, -6], s(c, R, v) {
      wood(c, -16, -38, 32, 2.4, "#4a3020", R, false); wood(c, -16, -14, 32, 2.4, "#4a3020", R, false);
      for (let k = 0; k < 5; k++) { const x = -12 + k * 6, done = (k + v) % 3 !== 0; metal(c, x - 0.7, -34.6, 1.4, 20, done ? "#b4b2ae" : "#5a5658"); P(c, done ? "#b4b2ae" : "#5a5658", [x - 0.7, -34.6, x, -37, x + 0.7, -34.6]); if (done) { Ln(c, "rgba(255,255,255,.6)", 0.25, [x - 0.3, -34, x - 0.3, -16]); metal(c, x - 2, -15, 4, 1, "#b8923a"); B(c, x - 0.5, -14, 1, 3.6, "#3a2414"); E(c, x, -10, 0.8, 0.8, "#b8923a"); } else { E(c, x, -22, 1, 1.6, "rgba(255,140,60,.25)"); } }
    } },
    /* ---------- Zinnen / Sturm ---------- */
    ballista: { at: "f", w: 3, box: [-30, -24, 30, 3], s(c, R, v) {
      shadow(c, 0, 0.5, 22, 2, 0.5);
      for (const a of [-0.35, 0.35]) { c.save(); c.translate(0, 0); c.rotate(a); wood(c, -1, -12, 2, 12, "#4a2e1a", R, true); c.restore(); }
      c.save(); c.translate(0, -12); c.rotate(-0.15);
      wood(c, -16, -1.4, 32, 2.8, "#5a3a22", R, false); c.strokeStyle = "#5a3a22"; c.lineWidth = 1.8; c.beginPath(); c.moveTo(10, -1); c.quadraticCurveTo(4, -12, 6, -14); c.moveTo(10, 1); c.quadraticCurveTo(4, 12, 6, 14); c.stroke();
      Ln(c, "#d8c8a0", 0.35, [6, -14, -6, 0, 6, 14]); metal(c, -6, -1, 22, 0.8, "#6a4a28"); P(c, "#8e8c8a", [16, -0.6, 20, 0, 16, 1]); P(c, "#e8e0d0", [-6, -0.4, -9, -1.6, -8, -0.4]);
      E(c, -14, 0, 2, 2, "#4a4446"); for (let k = 0; k < 4; k++) { const a = k / 4 * PI; Ln(c, "#4a4446", 0.6, [-14 + Math.cos(a) * 3, Math.sin(a) * 3, -14 - Math.cos(a) * 3, -Math.sin(a) * 3]); }
      c.restore();
      for (let k = 0; k < 3; k++) { c.save(); c.translate(-20 + k * 1.4, -0.6 - k * 1.2); metal(c, 0, -0.3, 10, 0.6, "#6a4a28"); P(c, "#8e8c8a", [10, -0.6, 12.4, 0, 10, 0.6]); c.restore(); }
    } },
    statue: { at: "f", w: 1, box: [-12, -44, 12, 3], s(c, R, v) {
      const m = "#7a7480"; shadow(c, 0, 0.5, 8, 1.4, 0.45);
      stein(c, [-7, 0, -7, -6, 7, -6, 7, 0], sh(m, -0.1), R); B(c, -7.6, -6.6, 15.2, 1.2, sh(m, 0.1));
      c.fillStyle = lg(c, -5, 0, 5, 0, [sh(m, 0.3), m, sh(m, -0.45)]); c.beginPath(); c.moveTo(-4.6, -6.6); c.quadraticCurveTo(-5, -18, -4, -26); c.lineTo(4, -26); c.quadraticCurveTo(5, -18, 4.6, -6.6); c.fill();
      for (let k = 0; k < 5; k++) Ln(c, "rgba(0,0,0,.2)", 0.4, [-3.4 + k * 1.7, -24, -3.8 + k * 1.9, -7]);
      for (const sd of [-1, 1]) { c.fillStyle = sh(m, sd < 0 ? 0.1 : -0.2); c.beginPath(); c.ellipse(sd * 4.6, -23.6, 2, 1.6, 0, 0, TAU); c.fill(); }
      if (v === 0) { E(c, 0, -29, 3, 3.4, m); E(c, -1, -30, 1, 1.2, "rgba(255,255,255,.15)"); metal(c, 4.6, -40, 1.2, 36, sh(m, -0.1)); P(c, sh(m, 0.1), [5.2, -44, 3.4, -40, 7, -40]); }
      else if (v === 1) { /* kopflos, Bruchkante */ P(c, sh(m, -0.1), [-3, -26, -2, -28, 0, -27, 2, -28.6, 3, -26]); stein(c, [-10, 0, -8, -3, -5, -2.4, -6, 0], m, R); E(c, -9, -1, 2.6, 2.6, m); }
      else { E(c, 0, -29, 3, 3.4, m); c.strokeStyle = sh(m, 0.1); c.lineWidth = 1.2; c.beginPath(); c.moveTo(4.6, -23); c.lineTo(8, -30); c.stroke(); E(c, 8.4, -31.4, 2, 1.4, sh(m, 0.05)); }
      for (let k = 0; k < 9; k++) E(c, -5 + R() * 10, -2 - R() * 18, 1.2, 0.8, "#3a5a2a");
      Ln(c, "rgba(20,16,20,.5)", 0.4, [1, -26, 2, -18, 0.6, -12]);
    } },
    wasserspeier: { at: "f", w: 1, box: [-12, -26, 12, 3], s(c, R, v) {
      const m = "#5a5460"; shadow(c, 0, 0.5, 8, 1.4, 0.45); stein(c, [-7, 0, -7, -5, 7, -5, 7, 0], sh(m, -0.1), R);
      c.fillStyle = lg(c, -6, 0, 6, 0, [sh(m, 0.3), m, sh(m, -0.45)]); c.beginPath(); c.moveTo(-5, -5); c.lineTo(-4, -12); c.quadraticCurveTo(0, -16, 4, -13); c.lineTo(6, -5); c.fill();
      P(c, sh(m, -0.15), [-3, -12, -10, -22, -8, -14, -11, -15, -5, -9]); P(c, sh(m, -0.15), [3, -12, 9, -24, 7.6, -15, 10, -16, 5, -10]);
      E(c, 2, -15.6, 3.4, 3, m); P(c, m, [3.6, -15, 8, -13.4, 4, -12.4]); P(c, sh(m, 0.2), [0, -18, -1, -21.6, 1.4, -18.4]); P(c, sh(m, 0.2), [3, -18.4, 4, -22, 4.4, -18]);
      E(c, 3.4, -16, 0.6, 0.5, v === 1 ? "#c84a2a" : "#1a1414"); P(c, "#e8e0d0", [5, -13.4, 5.4, -12.2, 5.8, -13.2]);
      for (const sd of [-1, 1]) { B(c, sd * 3 - 1, -6, 2, 1, sh(m, 0.1)); }
      for (let k = 0; k < 4; k++) E(c, -4 + R() * 8, -6 - R() * 8, 1, 0.6, "#3a4a2a");
    } },
    fahnenmast: { at: "f", w: 1, box: [-6, -48, 26, 3], s(c, R, v) {
      shadow(c, 0, 0.5, 5, 1.2, 0.45); stein(c, [-4, 0, -3, -4, 3, -4, 4, 0], "#5a5058", R); wood(c, -0.8, -46, 1.6, 42, "#5a3a22", R, true); E(c, 0, -46.6, 1.2, 1.2, "#c8a040");
    }, a(c, p, t) {
      const col = ["#7a1a20", "#3a2a1a", "#2a3a2a"][p.v], wnd = (Z.windX || 20) / 30;
      c.fillStyle = col; c.beginPath(); c.moveTo(0.8, -45); for (let k = 0; k <= 6; k++) { const x = 0.8 + k * 3.4 * (0.7 + wnd * 0.3), y = -45 + Math.sin(t * 4 + k * 0.9) * k * 0.35; c.lineTo(x, y); } for (let k = 6; k >= 0; k--) { const x = 0.8 + k * 3.4 * (0.7 + wnd * 0.3), y = -37 + Math.sin(t * 4 + k * 0.9) * k * 0.35 + (k === 6 ? -2 : k === 4 ? 1.4 : 0); c.lineTo(x, y); } c.fill();
      c.fillStyle = "rgba(0,0,0,.2)"; c.beginPath(); c.moveTo(0.8, -41); for (let k = 0; k <= 6; k++) c.lineTo(0.8 + k * 3.4 * (0.7 + wnd * 0.3), -41 + Math.sin(t * 4 + k * 0.9 + 1) * k * 0.35); c.lineTo(0.8 + 20 * (0.7 + wnd * 0.3), -37); c.lineTo(0.8, -37); c.fill();
      E(c, 7, -41 + Math.sin(t * 4 + 2) * 0.7, 1.4, 1.4, "#c8a040");
    } },
    banner_zerrissen: { at: "w", box: [-10, -42, 10, -4], s(c, R, v) { wood(c, -8, -38, 16, 1.4, "#3a2a1a", R, false); E(c, -8.4, -37.3, 1, 1, "#5a4a2a"); E(c, 8.4, -37.3, 1, 1, "#5a4a2a"); }, a(c, p, t) {
      const col = ["#5a1a1a", "#3a1a2a", "#2a3a2a"][p.v], sw = Math.sin(t * 1.4 + p.s * 9) * (1 + (Z.windX || 0) / 30);
      c.fillStyle = col; c.beginPath(); c.moveTo(-6.6, -36.6); c.lineTo(6.6, -36.6); c.lineTo(6.6 + sw * 0.5, -24); c.lineTo(5 + sw, -14); c.lineTo(3 + sw * 0.8, -20); c.lineTo(1 + sw, -10); c.lineTo(-1.6 + sw * 0.7, -22); c.lineTo(-4 + sw, -12); c.lineTo(-6.6 + sw * 0.6, -26); c.closePath(); c.fill();
      c.globalCompositeOperation = "destination-out"; E(c, 2 + sw * 0.3, -28, 1.4, 2, "#000"); E(c, -3 + sw * 0.2, -31, 0.8, 1, "#000"); c.globalCompositeOperation = "source-over";
      Ln(c, "rgba(200,160,80,.6)", 0.5, [-6, -35.4, 6, -35.4]); E(c, sw * 0.3, -30.6, 2, 2, "rgba(200,160,80,.45)");
    } },
    truemmer: { at: "f", w: 2, box: [-16, -14, 16, 3], s(c, R, v) {
      shadow(c, 0, 0.5, 14, 1.6, 0.45); const m = "#6a6068";
      stein(c, [-14, 0, -11, -6, -4, -5, -2, 0], m, R); stein(c, [-3, 0, 0, -9, 6, -10, 9, -4, 8, 0], sh(m, -0.05), R); stein(c, [7, 0, 9, -3, 13, -3.4, 14, 0], sh(m, 0.05), R);
      B(c, 0, -9.4, 6, 0.6, "rgba(255,240,220,.18)"); for (let k = 0; k < 3; k++) Ln(c, "rgba(0,0,0,.35)", 0.4, [1 + k * 2, -9, 2 + k * 2, -2]);
      for (let k = 0; k < 10; k++) E(c, -13 + R() * 26, -0.6, 0.8 + R(), 0.6, sh(m, -0.2));
      if (v !== 2) for (let k = 0; k < 5; k++) blatt(c, -6 + k * 3, -1, 1.6, (R() - 0.5) * 1.4, "#3a5a2a");
      if (v === 1) { c.save(); c.translate(-8, -6); c.rotate(-0.4); P(c, "#8a8288", [0, 0, 6, 0, 5, -3, 1, -3]); B(c, 1, -3.6, 4, 0.6, sh(m, 0.2)); c.restore(); }
    } },
    kandelaber_um: { at: "f", w: 2, box: [-16, -10, 16, 3], s(c, R, v) {
      const g = "#a8823a"; E(c, 0, -0.3, 13, 1, "rgba(0,0,0,.4)");
      c.save(); c.translate(-10, -2); c.rotate(0.06); P(c, sh(g, -0.2), [-1.4, 3, -1.4, -3, -3.4, -4, -3.4, 4]); metal(c, -1, -0.6, 20, 1.2, g); for (const x of [5, 10, 15]) E(c, x, 0, 0.8, 1.4, sh(g, 0.1)); c.restore();
      c.strokeStyle = g; c.lineWidth = 0.8; c.beginPath(); c.moveTo(10, -1.6); c.quadraticCurveTo(14, -1.4, 14, -5); c.moveTo(10, -1.6); c.quadraticCurveTo(14, -1.8, 14, 1); c.stroke();
      for (const [x, a] of [[16, 0.3], [-2, -1.4], [6, 1.5]]) { c.save(); c.translate(x, -0.8); c.rotate(a); kerze(c, 0, 0.6, 3.6, 1.1, "#d8c8a0"); c.restore(); }
      E(c, 3, -0.2, 3, 0.5, "rgba(232,220,192,.6)"); E(c, 8, -0.3, 2, 0.4, "rgba(232,220,192,.5)");
    } },
    dornen: { at: "f", w: 2, box: [-16, -22, 16, 3], s(c, R, v) {
      c.lineCap = "round";
      for (let k = 0; k < 5; k++) { const x0 = -10 + k * 5, h = 8 + R() * 12, x1 = x0 + (R() - 0.5) * 12; c.strokeStyle = k % 2 ? "#3a4a2a" : "#2e3a22"; c.lineWidth = 1; c.beginPath(); c.moveTo(x0, 0); c.bezierCurveTo(x0, -h, x1, -h * 1.1, x1 + (R() - 0.5) * 6, -h * 0.7); c.stroke();
        for (let q = 0; q < 5; q++) { const u = q / 5, px = x0 + (x1 - x0) * u * 0.8, py = -h * u * 0.9, a = R() * TAU; P(c, "#5a5a3a", [px, py, px + Math.cos(a) * 1.6, py + Math.sin(a) * 1.6, px + Math.cos(a + 0.6) * 0.4, py + Math.sin(a + 0.6) * 0.4]); }
        if (R() < 0.6) blatt(c, x0 + (x1 - x0) * 0.5, -h * 0.5, 2, R() * 6, "#4a6a2a"); }
      c.lineCap = "butt";
      for (let k = 0; k < 3; k++) { const x = -8 + R() * 16, y = -8 - R() * 10, col = v === 1 ? "#8a4ac0" : "#a8d84a"; for (let q = 0; q < 5; q++) { const a = q / 5 * TAU; E(c, x + Math.cos(a) * 1.1, y + Math.sin(a) * 1.1, 0.8, 0.5, col, a); } E(c, x, y, 0.6, 0.6, "#e8d84a"); }
    }, a(c, p, t) { glow(0, -10, 10, 0.18, p.v === 1 ? "p" : "g"); } },
    giftpilze: { at: "f", w: 1, box: [-10, -16, 10, 3], s(c, R, v) {
      for (let k = 0; k < 4; k++) { const px = -5 + k * 3.4, h = 3 + R() * 6, r = 1.8 + R() * 1.6; Ln(c, "#c8d0a0", 1, [px, 0, px, -h]); c.fillStyle = rg(c, px - r * 0.3, -h - r * 0.3, r * 1.4, ["#d8ff8a", "#8ac83a", "#3a6a1a"]); c.beginPath(); c.ellipse(px, -h, r, r * 0.7, 0, PI, 0); c.fill(); for (let q = 0; q < 3; q++) E(c, px - r * 0.5 + R() * r, -h - R() * r * 0.5, 0.35, 0.3, "#f0f8c0"); E(c, px, -h + 0.2, r * 0.9, 0.3, "#2a4a1a"); }
    }, a(c, p, t) { glow(0, -6, 10, 0.3, "g"); for (let k = 0; k < 2; k++) { const u = (t * 0.2 + k * 0.5 + p.s) % 1; E(c, -3 + k * 5 + Math.sin(u * 7) * 2, -6 - u * 14, 0.8 + u * 1.6, 0.8 + u * 1.6, "rgba(160,220,90," + 0.2 * Math.sin(u * PI) + ")"); } } },
    ranken_w: { at: "w", box: [-14, -46, 14, -2], s(c, R, v) {
      c.lineCap = "round"; for (let k = 0; k < 4; k++) { let x = -9 + k * 6, y = -44; c.strokeStyle = "#2e3a22"; c.lineWidth = 0.9; c.beginPath(); c.moveTo(x, y); const pts = []; for (let q = 0; q < 8; q++) { x += (R() - 0.5) * 3; y += 4 + R() * 1.4; c.lineTo(x, y); pts.push([x, y]); } c.stroke(); for (const [px, py] of pts) if (R() < 0.8) blatt(c, px + (R() - 0.5) * 2, py, 1.6 + R(), (R() - 0.5) * 2 + PI, R() < 0.5 ? "#3a5a2a" : "#4a6a30"); }
      c.lineCap = "butt"; if (v === 2) for (let k = 0; k < 3; k++) { const x = -6 + k * 6, y = -30 + k * 6; for (let q = 0; q < 5; q++) { const a = q / 5 * TAU; E(c, x + Math.cos(a) * 1, y + Math.sin(a) * 1, 0.7, 0.45, "#a85a8a", a); } E(c, x, y, 0.5, 0.5, "#e8d84a"); }
    } },
    ranken_h: { at: "c", len: 4, box: [-14, -1, 14, 34], s(c, R, v) {
      c.lineCap = "round"; for (let k = 0; k < 5; k++) { let x = -10 + k * 5, y = 0; c.strokeStyle = "#2e3a22"; c.lineWidth = 0.8; c.beginPath(); c.moveTo(x, y); const L = 10 + R() * 20; const pts = []; while (y < L) { x += (R() - 0.5) * 2; y += 3; c.lineTo(x, y); pts.push([x, y]); } c.stroke(); for (const [px, py] of pts) if (R() < 0.7) blatt(c, px + (R() - 0.5) * 2, py, 1.4 + R(), PI + (R() - 0.5) * 2, R() < 0.5 ? "#3a5a2a" : "#4a6a30"); }
      c.lineCap = "butt";
    } },
    /* ---------- Schwarzer See ---------- */
    muscheln: { at: "f", w: 1, box: [-10, -8, 10, 3], s(c, R, v) {
      for (let k = 0; k < 7; k++) { const mx = -7 + R() * 14, my = -0.4 - R() * 2, col = ["#e8d8c8", "#d8b8a8", "#c8a890", "#e8c8b8"][k % 4], r = 1.4 + R() * 0.8; c.fillStyle = lg(c, 0, my - r, 0, my, [sh(col, 0.2), sh(col, -0.2)]); c.beginPath(); c.arc(mx, my, r, PI, 0); c.fill(); for (let q = -2; q <= 2; q++) Ln(c, sh(col, -0.3), 0.15, [mx, my, mx + q * r * 0.4, my - r * 0.9]); }
      if (v !== 0) { c.fillStyle = "#c8643a"; c.beginPath(); for (let k = 0; k < 10; k++) { const a = -PI / 2 + k * PI / 5, r = k % 2 ? 0.9 : 2.4; c.lineTo(5 + Math.cos(a) * r, -1.6 + Math.sin(a) * r * 0.6); } c.fill(); }
      if (v === 2) { E(c, -3, -1.6, 0.8, 0.8, "#f0ece4"); E(c, -3.2, -1.8, 0.3, 0.3, "#fff"); }
    } },
    goetze: { at: "f", w: 1, box: [-10, -26, 10, 3], s(c, R, v) {
      const m = "#4a6a5a"; shadow(c, 0, 0.5, 7, 1.2, 0.45); stein(c, [-6, 0, -6, -4, 6, -4, 6, 0], sh(m, -0.2), R);
      c.fillStyle = lg(c, -6, 0, 6, 0, [sh(m, 0.3), m, sh(m, -0.45)]); c.beginPath(); c.moveTo(-4.4, -4); c.quadraticCurveTo(-6.6, -16, 0, -21); c.quadraticCurveTo(6.6, -16, 4.4, -4); c.fill();
      P(c, sh(m, -0.1), [-4.6, -12, -8, -9, -4.4, -8]); P(c, sh(m, -0.1), [4.6, -12, 8, -9, 4.4, -8]); P(c, sh(m, 0.15), [-1.6, -20, 0, -24, 1.6, -20]);
      E(c, -2.2, -15, 1.6, 2, "#1a2a22"); E(c, 2.2, -15, 1.6, 2, "#1a2a22"); B(c, -3, -10.6, 6, 0.8, "#1a2a22"); for (let k = -2; k < 3; k += 1) P(c, "#d8d0c0", [k - 0.3, -10.6, k + 0.3, -10.6, k, -9.6]);
      for (let k = 0; k < 6; k++) Ln(c, "rgba(0,0,0,.25)", 0.3, [-3 + k * 1.2, -8, -3.2 + k * 1.3, -4.4]);
      for (let k = 0; k < 6; k++) E(c, -4 + R() * 8, -4 - R() * 12, 0.9, 0.6, "#2a5a3a");
    }, a(c, p, t) { const g = 0.6 + 0.4 * Math.sin(t * 1.3 + p.s * 9); E(c, -2.2, -15, 1, 1.4, "rgba(200,255,140," + g + ")"); E(c, 2.2, -15, 1, 1.4, "rgba(200,255,140," + g + ")"); glow(0, -15, 8, 0.4 * g, "g"); } },
    schilf: { at: "f", w: 2, box: [-14, -28, 14, 3], a(c, p, t) {
      /* abgemäht wächst das Schilf langsam nach; wer hindurchläuft, biegt es zur Seite */
      let grow = 1; if (p.cut) { grow = Math.max(0, Math.min(1, (t - p.cutT - 15) / 45)); if (grow >= 1) { p.cut = false; p.dmg = 0; } }
      const bend = p.bendT ? (p.bend || 0) * 4 * Math.exp(-(t - p.bendT) * 2.5) : 0;
      c.lineCap = "round"; for (let k = 0; k < 10; k++) { const rx = -10 + k * 2.2, h = 2.4 + (7.6 + hash(k, p.s) * 14) * grow, sw = (Math.sin(t * 1.3 + k + p.s * 9) * 1.5 + bend) * (0.3 + 0.7 * grow); c.strokeStyle = k % 2 ? "#4a6a3a" : "#3a5a2e"; c.lineWidth = 0.7; c.beginPath(); c.moveTo(rx, 0); c.quadraticCurveTo(rx + sw * 0.5, -h * 0.5, rx + sw, -h); c.stroke(); if (k % 3 === 0 && grow > 0.7) { E(c, rx + sw, -h + 1.4, 0.8, 2.4, "#6a4a2a"); Ln(c, "#4a6a3a", 0.3, [rx + sw, -h - 1, rx + sw * 1.1, -h - 3]); } if (k % 2) { c.fillStyle = "#3a5a2e"; c.beginPath(); c.moveTo(rx, 0); c.quadraticCurveTo(rx + 3 + sw, -h * 0.4, rx + 5 + sw, -h * 0.55); c.quadraticCurveTo(rx + 3 + sw, -h * 0.35, rx + 0.8, 0); c.fill(); } } c.lineCap = "butt";
    } },
    saeulenstumpf: { at: "f", w: 1, box: [-10, -24, 10, 3], s(c, R, v) {
      const m = "#5a6a64"; shadow(c, 0, 0.5, 7, 1.2, 0.45); stein(c, [-7, 0, -7, -3, 7, -3, 7, 0], sh(m, -0.15), R);
      const h = [14, 19, 10][v]; c.fillStyle = lg(c, -5, 0, 5, 0, [sh(m, 0.3), m, sh(m, -0.45)]); c.beginPath(); c.moveTo(-5, -3); c.lineTo(-5, -h); c.lineTo(-2, -h - 3); c.lineTo(1, -h - 0.6); c.lineTo(3, -h - 2.6); c.lineTo(5, -h); c.lineTo(5, -3); c.fill();
      for (let k = -3; k <= 3; k += 2) B(c, k - 0.3, -h, 0.6, h - 3, "rgba(0,0,0,.2)");
      for (let k = 0; k < 10; k++) { const x = -5 + R() * 10, y = -3 - R() * (h - 4); E(c, x, y, 0.6, 0.5, R() < 0.5 ? "#3a6a3a" : "#d8d0c0"); }
      c.fillStyle = "#2e5a34"; c.beginPath(); c.moveTo(-5, -6); for (let k = 0; k <= 5; k++) c.lineTo(-5 + k * 2, -6 + (k % 2 ? 2 : -1)); c.lineTo(5, -4); c.lineTo(-5, -4); c.fill();
    } },
    korallen: { at: "f", w: 1, box: [-10, -20, 10, 3], s(c, R, v) {
      const cols = [["#d85a4a", "#e88a6a"], ["#c84a7a", "#e87aa0"], ["#e8a04a", "#f0c070"]][v]; c.lineCap = "round";
      const branch = (x, y, a, l, w, d) => { if (d > 3) { E(c, x, y, w * 0.9, w * 0.9, cols[1]); return; } const x2 = x + Math.cos(a) * l, y2 = y + Math.sin(a) * l; Ln(c, cols[d % 2], w, [x, y, x2, y2]); branch(x2, y2, a - 0.45 - R() * 0.3, l * 0.72, w * 0.75, d + 1); branch(x2, y2, a + 0.35 + R() * 0.3, l * 0.7, w * 0.75, d + 1); };
      branch(-2, 0, -PI / 2 - 0.3, 6, 1.6, 0); branch(3, 0, -PI / 2 + 0.25, 5, 1.4, 0); c.lineCap = "butt";
      stein(c, [-6, 0, -4, -2, 4, -2.4, 6, 0], "#3a4a44", R);
    } },
    fischgraeten: { at: "f", w: 1, box: [-10, -8, 10, 3], s(c, R, v) {
      c.save(); c.translate(0, -1.6); c.rotate((v - 1) * 0.15);
      Ln(c, BONE, 0.5, [-6, 0, 5, 0]); for (let k = 0; k < 7; k++) { const x = -4 + k * 1.3; Q(c, BONE, 0.25, x, 0, x - 0.6, -1.4, x - 1.4, -2.2 + Math.abs(k - 3) * 0.2); Q(c, BONE, 0.25, x, 0, x - 0.6, 1.4, x - 1.4, 2.2 - Math.abs(k - 3) * 0.2); }
      c.fillStyle = BONE; c.beginPath(); c.moveTo(5, -1.8); c.lineTo(8.6, -0.4); c.lineTo(8.6, 0.6); c.lineTo(5, 1.8); c.closePath(); c.fill(); E(c, 6.6, -0.4, 0.6, 0.6, "#1a1214"); P(c, BONE, [-6, 0, -8.6, -2, -8, 0, -8.6, 2]);
      c.restore();
    }, a(c, p, t) { if (p.v === 0) fliegen(c, 0, -4, t, 2, p.s * 5); } },
    opferschale: { at: "f", w: 1, box: [-10, -16, 10, 3], s(c, R, v) {
      const m = "#4a5a54"; shadow(c, 0, 0.5, 7, 1.2, 0.45); stein(c, [-2.4, 0, -1.6, -6, 1.6, -6, 2.4, 0], m, R); c.fillStyle = lg(c, -6, 0, 6, 0, [sh(m, 0.3), m, sh(m, -0.4)]); c.beginPath(); c.moveTo(-7, -9); c.lineTo(7, -9); c.quadraticCurveTo(6, -5.6, 0, -5.6); c.quadraticCurveTo(-6, -5.6, -7, -9); c.fill(); E(c, 0, -9, 7, 1.2, sh(m, -0.4));
      for (let k = 0; k < 3; k++) { c.save(); c.translate(-3 + k * 3, -9.6); c.rotate(-0.4 + k * 0.4); E(c, 0, 0, 2.4, 0.9, ["#a8b0a0", "#b8a888", "#98a088"][k]); c.restore(); }
      for (const x of [-6, 6]) kerze(c, x, -9, 2.4, 1, "#c8d8b0");
    }, fls: [[-6, -11.8, 0.45, null, "g"], [6, -11.8, 0.45, null, "g"]], holeR: [0, -10, 30, 0.4] },
    amphore: { at: "f", w: 1, box: [-10, -18, 10, 3], s(c, R, v) {
      shadow(c, 0, 0.5, 7, 1.2, 0.45); const col = "#8a6a4a";
      c.save(); if (v === 1) { c.translate(0, -3); c.rotate(1.3); c.translate(0, 3); }
      c.fillStyle = lg(c, -5, 0, 5, 0, [sh(col, 0.2), col, sh(col, -0.45)]); c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(-6, -6, -3, -12); c.lineTo(-1.4, -14); c.lineTo(1.4, -14); c.lineTo(3, -12); c.quadraticCurveTo(6, -6, 0, 0); c.fill();
      c.strokeStyle = sh(col, -0.3); c.lineWidth = 0.6; c.beginPath(); c.arc(-3.2, -11.4, 1.6, PI * 0.5, PI * 1.5); c.stroke(); c.beginPath(); c.arc(3.2, -11.4, 1.6, -PI * 0.5, PI * 0.5); c.stroke();
      for (let k = 0; k < 8; k++) E(c, -3 + R() * 6, -2 - R() * 10, 0.6, 0.5, R() < 0.5 ? "#d8d0c0" : "#3a6a3a"); c.restore();
    } },
    wrackkiste: { at: "f", w: 2, box: [-15, -16, 15, 3], s(c, R, v) {
      shadow(c, 0, 0.5, 13, 1.6, 0.45); c.save(); c.translate(-2, 0); c.rotate(-0.08); kiste(c, -9, -10, 16, 10, "#5a4a3a", R); c.restore();
      c.globalCompositeOperation = "destination-out"; P(c, "#000", [2, -10.6, 8, -11, 6, -6, 3, -7]); c.globalCompositeOperation = "source-over"; E(c, 5, -8, 2, 1.6, "#1a1210");
      for (let k = 0; k < 9; k++) { const x = -10 + R() * 16, y = -R() * 10; E(c, x, y, 0.7, 0.6, "#d8d0c0"); E(c, x, y - 0.2, 0.3, 0.3, "#8a8070"); }
      for (let k = 0; k < 3; k++) { c.save(); c.translate(9 + k * 1.6, -0.6); c.rotate(0.4 * k); wood(c, -2, -0.5, 4, 1, "#5a4a3a", R, false); c.restore(); }
      c.strokeStyle = "#3a6a3a"; c.lineWidth = 0.6; for (let k = 0; k < 3; k++) { c.beginPath(); c.moveTo(-8 + k * 4, -10); c.quadraticCurveTo(-7 + k * 4, -13, -9 + k * 4, -15); c.stroke(); }
    } },
    algen: { at: "w", box: [-12, -44, 12, -4], a(c, p, t) {
      c.lineCap = "round"; for (let k = 0; k < 6; k++) { const ax = -9 + k * 3.6, sw = Math.sin(t * 0.9 + k + p.s * 9) * 2, L = 18 + ((k * 7 + p.v * 3) % 10); c.strokeStyle = k % 2 ? "#3a6a4a" : "#2e5a3a"; c.lineWidth = 1.2; c.beginPath(); c.moveTo(ax, -40); c.quadraticCurveTo(ax + sw, -40 + L * 0.5, ax - sw * 0.5, -40 + L); c.stroke(); if (k % 2) E(c, ax - sw * 0.4, -40 + L, 0.8, 0.8, "#5a8a4a"); } c.lineCap = "butt";
    } },
    kuo_glyphen: { at: "w", box: [-14, -42, 14, -10], s(c, R, v) {
      stein(c, [-10, -38, 10, -38, 11, -14, -11, -14], "#3a4a44", R); B(c, -10, -38, 20, 0.5, "rgba(255,255,255,.12)");
      c.strokeStyle = "rgba(10,16,12,.7)"; c.lineWidth = 0.6; c.beginPath(); c.ellipse(0, -28, 5, 3, 0, 0, TAU); c.moveTo(5, -28); c.lineTo(8, -31); c.lineTo(8, -25); c.closePath(); c.stroke(); c.beginPath(); c.arc(-2.4, -28.6, 0.8, 0, TAU); c.stroke();
      for (let k = 0; k < 4; k++) { c.beginPath(); c.moveTo(-8 + k * 4.4, -19); c.lineTo(-6 + k * 4.4, -21); c.lineTo(-4 + k * 4.4, -19); c.stroke(); }
      for (let k = 0; k < 6; k++) E(c, -9 + R() * 18, -16 - R() * 20, 0.9, 0.6, "#2a5a3a");
    }, a(c, p, t) { const g = 0.4 + 0.4 * Math.sin(t * 1.1 + p.s * 9); c.strokeStyle = "rgba(170,255,150," + g + ")"; c.lineWidth = 0.35; c.beginPath(); c.ellipse(0, -28, 5, 3, 0, 0, TAU); c.stroke(); glow(0, -28, 12, 0.25 * g, "g"); } },
    muschelwand: { at: "w", box: [-12, -40, 12, -12], s(c, R, v) {
      for (let k = 0; k < 9; k++) { const x = -8 + R() * 16, y = -36 + R() * 20, r = 1.4 + R() * 1.4, col = ["#e8d8c8", "#d8b8a8", "#c8a890"][k % 3]; c.save(); c.translate(x, y); c.rotate(R() * TAU); c.fillStyle = col; c.beginPath(); c.arc(0, 0, r, PI, 0); c.fill(); for (let q = -2; q <= 2; q++) Ln(c, sh(col, -0.3), 0.15, [0, 0, q * r * 0.4, -r * 0.9]); c.restore(); }
      for (let k = 0; k < 12; k++) { E(c, -9 + R() * 18, -36 + R() * 22, 0.6, 0.5, "#d8d0c0"); }
    } },
    wurzeln: { at: "c", len: 4, box: [-14, -1, 14, 30], s(c, R, v) {
      c.lineCap = "round"; for (let k = 0; k < 5; k++) { let x = -10 + k * 5 + R() * 2, y = 0, w = 1.6; c.strokeStyle = k % 2 ? "#3a2a1e" : "#4a3424"; c.beginPath(); c.moveTo(x, y); const L = 10 + R() * 18; while (y < L) { x += (R() - 0.5) * 3; y += 2.4; c.lineWidth = w; c.lineTo(x, y); w = Math.max(0.4, w * 0.92); } c.stroke(); if (R() < 0.6) { Ln(c, "#3a2a1e", 0.4, [x, y, x + (R() - 0.5) * 4, y + 3]); } }
      c.lineCap = "butt";
    } },
    algen_h: { at: "c", len: 4, box: [-2, -1, 2, 2], a(c, p, t) {
      c.lineCap = "round"; for (let k = 0; k < 5; k++) { const ax = -8 + k * 4, sw = Math.sin(t * 0.7 + k + p.s * 9) * 2, L = 12 + ((k * 5 + p.v * 4) % 14); c.strokeStyle = k % 2 ? "#3a6a4a" : "#2e5a3a"; c.lineWidth = 1.1; c.beginPath(); c.moveTo(ax, 0); c.quadraticCurveTo(ax + sw, L * 0.5, ax - sw * 0.5, L); c.stroke(); } c.lineCap = "butt";
    } },
    krabbe: { at: "f", crit: true, run: true, noflip: true, w: 1, a(c, p, t) {
      const dt = Math.min(0.05, Math.max(0, t - (p.lt || t))); p.lt = t; if (p.rx == null) { p.rx = 0; p.dir = 1; p.wait = 1; }
      const scared = nahe(cx0 + p.rx, cy0 - 3, 40) || p.scare > t; let mv = false;
      if (p.wait > 0 && !scared) p.wait -= dt; else { mv = true; p.rx += p.dir * (scared ? 60 : 18) * dt; if (p.rx < p.ra || p.rx > p.rb) { p.rx = Math.max(p.ra, Math.min(p.rb, p.rx)); p.dir = -p.dir; p.wait = scared ? 0 : 1 + Math.random() * 3; } }
      c.save(); c.translate(p.rx, 0); E(c, 0, 0.2, 3.6, 0.6, "rgba(0,0,0,.35)");
      for (const sd of [-1, 1]) for (let k = 0; k < 3; k++) { const wg = mv ? Math.sin(t * 30 + k * 2 + sd) * 0.6 : 0; Ln(c, "#a8402a", 0.4, [sd * 1.6, -1.6, sd * (3 + k * 0.6), -2.4 + wg, sd * (3.4 + k * 0.8), 0]); }
      c.fillStyle = rg(c, -0.6, -3, 4, ["#e86a4a", "#b8402a", "#7a2a1a"]); c.beginPath(); c.ellipse(0, -2.2, 3, 1.8, 0, PI, TAU); c.lineTo(3, -1.6); c.lineTo(-3, -1.6); c.fill();
      for (const sd of [-1, 1]) { const op = Math.sin(t * 3 + sd + p.s * 9) * 0.3; E(c, sd * 3.8, -3.6 + op, 1.2, 0.9, "#c84a2a"); Ln(c, "#a8402a", 0.5, [sd * 2, -2.6, sd * 3.2, -3.4]); }
      Ln(c, "#7a2a1a", 0.3, [-0.8, -3.8, -1, -5]); Ln(c, "#7a2a1a", 0.3, [0.8, -3.8, 1, -5]); E(c, -1, -5.1, 0.4, 0.4, "#1a1214"); E(c, 1, -5.1, 0.4, 0.4, "#1a1214");
      c.restore();
    } },
    /* ---------- Glutgassen ---------- */
    kohlenkarren: { at: "f", w: 3, box: [-28, -20, 28, 3], s(c, R, v) {
      for (let k = -26; k < 27; k += 5) wood(c, k, -1.2, 3.4, 1.2, "#3a2a1e", R, false); metal(c, -27, -2, 54, 0.8, "#5a5456");
      const ir = "#3a3434"; c.fillStyle = lg(c, 0, -14, 0, -4, [sh(ir, 0.3), ir, sh(ir, -0.3)]); c.beginPath(); c.moveTo(-15, -14); c.lineTo(15, -14); c.lineTo(12, -4); c.lineTo(-12, -4); c.fill();
      for (const x of [-12, -4, 4, 12]) rivet(c, x, -12.6, 0.5); band(c, -14, -14.6, 28, 1);
      for (let k = 0; k < 22; k++) E(c, -12 + R() * 24, -14.6 - R() * 3 * (1 - Math.abs(-12 + R() * 24) / 16), 1.6, 1.3, R() < 0.5 ? "#1a1616" : "#2a2424");
      for (const wx of [-8, 8]) { E(c, wx, -3.4, 3, 3, "#2a2424"); E(c, wx, -3.4, 1.8, 1.8, "#4a4446"); rivet(c, wx, -3.4, 0.6); }
    }, a(c, p, t) { for (let k = 0; k < 4; k++) { const g = 0.4 + 0.4 * Math.sin(t * 3 + k * 1.7 + p.s * 9); E(c, -9 + k * 6, -15.4 - (k % 2), 1.1, 0.7, "rgba(255,110,40," + g + ")"); } glow(0, -15, 14, 0.25, "e"); } },
    gruenfeuer: { at: "f", w: 1, box: [-10, -20, 10, 3], s(c, R, v) {
      shadow(c, 0, 0.5, 7, 1.4, 0.45); stein(c, [-6, 0, -5, -3, 5, -3, 6, 0], "#3a3434", R);
      c.fillStyle = lg(c, -6, 0, 6, 0, ["#6a6a6a", "#3a3a3a", "#1a1a1a"]); c.beginPath(); c.moveTo(-3, -3); c.lineTo(-6.6, -10); c.lineTo(6.6, -10); c.lineTo(3, -3); c.fill(); B(c, -7, -10.6, 14, 1.2, "#4a4a4a");
      for (let k = 0; k < 4; k++) P(c, "#4a4a4a", [-6 + k * 4, -10.6, -5 + k * 4, -13, -4 + k * 4, -10.6]);
      for (const sd of [-1, 1]) { c.strokeStyle = "#5a5a5a"; c.lineWidth = 0.6; c.beginPath(); c.arc(sd * 7, -8, 1.4, 0, TAU); c.stroke(); }
    }, fls: [[-1.8, -10.6, 1.2, null, "g"], [1.8, -10.4, 1, null, "g"], [0, -11, 1.5, null, "g"]], holeR: [0, -14, 48, 0.55], a(c, p, t) { glow(0, -10, 10, 0.4, "g"); } },
    schmelztiegel: { at: "f", w: 2, box: [-16, -22, 16, 3], s(c, R, v) {
      shadow(c, 0, 0.5, 13, 1.6, 0.45);
      for (let k = 0; k < 5; k++) stein(c, [-10 + k * 4, 0, -8.4 + k * 4, -4 - (k % 2), -6.4 + k * 4, 0], "#4a3a34", R);
      c.fillStyle = lg(c, -6, 0, 6, 0, ["#6a5a5a", "#3a2e2e", "#1a1414"]); c.beginPath(); c.moveTo(-6, -14); c.lineTo(6, -14); c.lineTo(4, -4); c.lineTo(-4, -4); c.fill(); E(c, 0, -14, 6, 1.2, "#2a1a14");
      for (const sd of [-1, 1]) Ln(c, "#4a4446", 1, [sd * 6, -13, sd * 10, -16]); Ln(c, "#4a4446", 1, [-10, -16, 10, -16]);
      c.save(); c.translate(9, -1); c.rotate(-0.9); metal(c, -0.4, -12, 0.8, 12, "#4a4446"); E(c, 0, 0.6, 2, 1.2, "#3a3436"); c.restore();
    }, fls: [[-2, -2.6, 0.9, null, "e"], [2, -2.4, 0.8, null, "e"]], holeR: [0, -12, 44, 0.5], a(c, p, t) { const h = 0.7 + 0.3 * Math.sin(t * 2 + p.s * 9); E(c, 0, -14, 5, 0.9, "rgba(255," + (150 + h * 70 | 0) + ",50,1)"); E(c, -1, -14.2, 2, 0.4, "rgba(255,250,200,.9)"); glow(0, -14, 12, 0.45 * h, "e"); if (rich()) rauch(c, 0, -15, t, p.s * 3, "90,80,80"); } },
    schlacke: { at: "f", w: 1, box: [-10, -10, 10, 3], s(c, R, v) {
      c.fillStyle = lg(c, 0, -7, 0, 0, ["#3a3030", "#1a1414"]); c.beginPath(); c.moveTo(-9, 0); c.quadraticCurveTo(-7, -6, -2, -7); c.quadraticCurveTo(4, -8, 7, -4); c.lineTo(9, 0); c.fill();
      for (let k = 0; k < 14; k++) E(c, -7 + R() * 14, -R() * 5.4, 0.8 + R(), 0.6, R() < 0.5 ? "#2a2020" : "#4a3a3a");
    }, a(c, p, t) { for (let k = 0; k < 4; k++) { const g = 0.35 + 0.35 * Math.sin(t * 1.4 + k * 2 + p.s * 9); E(c, -5 + k * 3.4, -2 - (k % 2) * 2.4, 0.8, 0.5, "rgba(255,90,30," + g + ")"); } } },
    erzhaufen: { at: "f", w: 2, box: [-15, -12, 15, 3], s(c, R, v) {
      shadow(c, 0, 0.5, 13, 1.6, 0.45);
      for (let k = 0; k < 18; k++) { const x = -11 + R() * 22, y = -1 - R() * 8 * (1 - Math.abs(x) / 13), r = 1.2 + R() * 1.6; stein(c, [x - r, y + r * 0.6, x - r * 0.4, y - r, x + r, y - r * 0.4, x + r * 0.6, y + r * 0.6], ["#4a3a3a", "#5a4a44", "#3a3434"][k % 3], R); if (R() < 0.35) { const gc = ["#e8c060", "#c87a3a", "#d8d0e0"][v]; B(c, x - 0.3, y - 0.3, 0.6, 0.6, gc); B(c, x - 0.1, y - 0.1, 0.25, 0.25, "#fff"); } }
      c.save(); c.translate(11, -2); c.rotate(0.5); wood(c, -0.4, -12, 0.8, 12, "#6a4a28", R, true); c.strokeStyle = "#5a5658"; c.lineWidth = 1; c.beginPath(); c.arc(0, -10, 4, PI * 1.1, PI * 1.9); c.stroke(); c.restore();
    } },
    duergarstatue: { at: "f", w: 1, box: [-12, -38, 12, 3], s(c, R, v) {
      const m = "#5a5050"; shadow(c, 0, 0.5, 8, 1.4, 0.45); stein(c, [-8, 0, -8, -6, 8, -6, 8, 0], sh(m, -0.15), R);
      c.fillStyle = lg(c, -7, 0, 7, 0, [sh(m, 0.3), m, sh(m, -0.45)]); c.beginPath(); c.moveTo(-6, -6); c.lineTo(-7, -20); c.lineTo(7, -20); c.lineTo(6, -6); c.fill();
      for (const sd of [-1, 1]) E(c, sd * 7, -19, 3, 2.4, sh(m, 0.05)); B(c, -7, -12, 14, 1.4, sh(m, -0.3));
      E(c, 0, -24, 4, 4, m); c.fillStyle = sh(m, -0.1); c.beginPath(); c.moveTo(-4.4, -22); c.lineTo(4.4, -22); c.lineTo(3, -14); c.lineTo(0, -12); c.lineTo(-3, -14); c.fill(); for (let k = -3; k < 4; k += 1.5) Ln(c, sh(m, -0.35), 0.3, [k, -21.6, k * 0.7, -14]);
      c.fillStyle = sh(m, 0.1); c.beginPath(); c.arc(0, -26, 4.4, PI, 0); c.fill(); B(c, -4.6, -26.4, 9.2, 1, sh(m, -0.2));
      metal(c, 6, -30, 1.4, 22, sh(m, -0.1)); P(c, sh(m, 0.1), [3.6, -32, 10, -32, 10, -27, 3.6, -27]);
    }, a(c, p, t) { const g = 0.5 + 0.5 * Math.sin(t * 1.2 + p.s * 9); E(c, -1.6, -24.6, 0.6, 0.4, "rgba(255,120,60," + g + ")"); E(c, 1.6, -24.6, 0.6, 0.4, "rgba(255,120,60," + g + ")"); } },
    ketten: { at: "w", box: [-10, -42, 10, -8], s(c, R, v) { for (const dx of [-5, 5]) { metal(c, dx - 1.2, -38, 2.4, 2, "#3a3436"); } }, a(c, p, t) { for (const dx of [-5, 5]) { const sw = Math.sin(t * 0.7 + dx + p.s * 9) * 1.5; kette(c, dx, -36, dx + sw * 1.5, -16 + (dx > 0 ? 4 : 0), "#4a4440", 1.6); } } },
    rohre: { at: "w", box: [-18, -44, 18, -4], s(c, R, v) {
      const pipe = (x0, y0, x1, y1, w) => { const hz = Math.abs(x1 - x0) > Math.abs(y1 - y0); c.fillStyle = hz ? lg(c, 0, y0 - w, 0, y0 + w, ["#7a6a5a", "#4a3e34", "#2a2420"]) : lg(c, x0 - w, 0, x0 + w, 0, ["#7a6a5a", "#4a3e34", "#2a2420"]); if (hz) c.fillRect(Math.min(x0, x1), y0 - w, Math.abs(x1 - x0), w * 2); else c.fillRect(x0 - w, Math.min(y0, y1), w * 2, Math.abs(y1 - y0)); };
      pipe(-16, -34, 16, -34, 1.6); pipe(-8, -34, -8, -6, 1.4); pipe(10, -34, 10, -14, 1.2);
      for (const [x, y, hz] of [[-12, -34, 0], [4, -34, 0], [-8, -22, 1], [10, -24, 1]]) { if (hz) B(c, x - 2.2, y, 4.4, 1.4, "#5a4a3e"); else B(c, x, y - 2.2, 1.4, 4.4, "#5a4a3e"); }
      E(c, -8, -14, 3, 3, "#5a4a3e"); E(c, -8, -14, 2.4, 2.4, "#e8dcc0"); Ln(c, "#a83030", 0.4, [-8, -14, -6.6, -15.4]); B(c, 8, -16, 4, 1, "#a83030"); E(c, 10, -16.4, 2, 0.6, "#a83030");
    }, a(c, p, t) { const u = (t * 0.5 + p.s) % 1; if (u < 0.5) for (let k = 0; k < 3; k++) { const w = (u * 2 + k * 0.2) % 1; E(c, 12 + w * 8, -15 - w * 6, 1 + w * 3, 1 + w * 2, "rgba(230,230,220," + 0.3 * (1 - w) + ")"); } } },
    kranhaken: { at: "c", len: 5, box: [-3, -1, 3, 2], s(c) { metal(c, -2, 0, 4, 1.2, "#3a3436"); }, a(c, p, t) {
      const L = 16 + p.v * 6, a = Math.sin(t * 0.5 + p.s * 9) * 0.05; c.save(); c.rotate(a); kette(c, 0, 1, 0, L, "#4a4446");
      if (p.v === 0) { c.strokeStyle = "#5a5456"; c.lineWidth = 1.2; c.beginPath(); c.moveTo(0, L); c.lineTo(0, L + 2); c.arc(-1.6, L + 3.6, 1.6, 0, PI * 0.9); c.stroke(); }
      else { Ln(c, "#4a4446", 0.6, [0, L, -4, L + 3]); Ln(c, "#4a4446", 0.6, [0, L, 4, L + 3]); c.fillStyle = lg(c, -5, 0, 5, 0, ["#6a5a5a", "#2a2424"]); c.beginPath(); c.moveTo(-5, L + 3); c.lineTo(5, L + 3); c.lineTo(4, L + 9); c.lineTo(-4, L + 9); c.fill(); for (let k = 0; k < 5; k++) E(c, -3.4 + k * 1.7, L + 2.6, 1, 0.7, k % 2 ? "#1a1616" : "rgba(255,110,40,.8)"); }
      c.restore();
    } }
  });
  /* @@PROPS@@ */

  /* ======================= Sprite-Cache ======================= */
  const SPR = new Map();
  function spriteOf(kind, v) {
    const res = Math.max(2, Math.min(4, Math.ceil((Z.gfx && Z.gfx.scale) || 2)));
    const key = kind + "|" + v + "|" + res; let s = SPR.get(key); if (s) return s;
    const d = K[kind], b = d.box, w = b[2] - b[0], h = b[3] - b[1];
    const cv = document.createElement("canvas"); cv.width = Math.ceil(w * res); cv.height = Math.ceil(h * res);
    const c = cv.getContext("2d"); c.scale(res, res); c.translate(-b[0], -b[1]);
    try { d.s(c, Z.Rng((strSeed(kind) + v * 7919) >>> 0), v); } catch (e) { console.error(kind, e); }
    s = { cv, l: b[0], t: b[1], w, h }; SPR.set(key, s); return s;
  }

  /* ======================= Platzierung ======================= */
  const SETS = {}, SCN = {};
  /* Einzelstücke je Gebiet (Boden, Wand, Decke, Tiere) */
  Object.assign(SETS, {
    torhof: { floor: ["karren", "heu", "waffenstaender", "faesser", "kisten", "brunnen", "hackklotz", "holzstapel", "trog", "zielscheibe", "apfelkorb", "eimer"], wall: ["schild", "wandlaterne", "steckbrief", "hufeisen", "werkzeugbrett", "schild"], ceil: ["laterne_h", "kraeuter", "spinne"], crit: ["ratte", "katze", "huhn", "huhn", "kraehe"] },
    keller: { floor: ["fassregal", "saecke", "kaese", "faesser", "kisten", "weinfass", "vorratsregal", "krugreihe", "kartoffelkiste", "besen"], wall: ["flaschenregal", "wuerste", "spinnweben", "zwiebelzopf", "pfannen", "wandkerze", "wandregal", "spinnweben"], ceil: ["kraeuter", "tropfen", "spinne", "fledermaus", "laterne_h", "tropfen"], crit: ["ratte", "ratte", "katze"] },
    hallen: { floor: ["buecherregal", "ruestung", "kerzenstaender", "globus", "standuhr", "harfe", "sessel", "buestensaeule", "teppich", "truhe", "ruestung"], wall: ["portraet", "portraet", "wandteppich", "geweih", "spiegel", "wandleuchter", "wappen", "landschaft"], ceil: ["kronleuchter_k", "kronleuchter_k", "spinne"], crit: ["katze", "ratte"] },
    wehrgang: { floor: ["heu", "faesser", "waffenstaender", "kanonenkugeln", "kisten", "zielscheibe", "koecherfass", "kohlebecken", "holzstapel", "pulverfass"], wall: ["schild", "wandlaterne", "steckbrief", "schluesselbrett", "banner_zerrissen"], ceil: ["laterne_h", "spinne"], crit: ["kraehe", "kraehe", "ratte", "taube"] },
    verlies: { floor: ["streckbank", "stroh", "eimer", "knochen", "napf", "folterstuhl", "jungfrau", "bodenkaefig", "kohlebecken", "knochen"], wall: ["fesseln", "strichliste", "fesseln", "kerkerfenster", "peitschen", "kritzelei", "schluesselbrett", "strichliste"], ceil: ["haengekaefig", "ketten_h", "tropfen", "spinne", "tropfen"], crit: ["ratte", "ratte", "ratte"] },
    hafen: { floor: ["netze", "anker", "tauwerk", "fischkorb", "kisten", "poller", "hummerkorb", "seekiste", "ruderbuendel", "faesser", "saecke"], wall: ["rettungsring", "netzwand", "steuerrad", "reuse", "schiffsglocke", "ruder_x", "wandlaterne"], ceil: ["netz_h", "laterne_h", "trockenfisch"], crit: ["moewe", "moewe", "ratte", "katze"] },
    glocken: { floor: ["zahnradkiste", "kleineglocke", "kisten", "standuhr", "winde", "grosseglocke"], wall: ["zahnrad", "zahnrad", "seilrolle", "uhrblatt", "werkzeugbrett_fein", "wandlaterne"], ceil: ["glockenseil", "flaschenzug", "fledermaus", "spinne", "glockenseil"], crit: ["taube", "taube", "ratte"] },
    schlund: { floor: ["eiersack", "pilze", "knochen", "eiersack", "knochenhaufen", "kristall", "kokon_boden", "kaefer", "pilzring"], wall: ["spinnweben", "spinnweben", "wandpilze", "eier_wand", "gespinst"], ceil: ["spinne", "kokon_h", "tropfen", "spinne"] },
    schmiede: { floor: ["amboss", "schleifstein", "runensteine", "waffenstaender", "wassertrog", "barren", "ruestungsstaender", "gussform", "kohlebecken"], wall: ["zangen", "runentafel", "werkzeugwand", "schwertwand", "ketten"], ceil: ["ketten_h", "flaschenzug", "kranhaken"] },
    zinnen: { floor: ["kanonenkugeln", "faesser", "statue", "kanone", "ballista", "pulverfass", "wasserspeier", "fahnenmast", "kohlebecken"], wall: ["schild", "wandlaterne", "banner_zerrissen"], ceil: ["ketten_h"], crit: ["kraehe", "kraehe"] },
    see: { floor: ["muscheln", "goetze", "schilf", "saeulenstumpf", "korallen", "fischgraeten", "amphore", "wrackkiste", "muscheln"], wall: ["algen", "kuo_glyphen", "muschelwand", "netzwand", "algen"], ceil: ["wurzeln", "tropfen", "algen_h", "tropfen"], crit: ["krabbe", "krabbe"] },
    glut: { floor: ["kohlenkarren", "kohlebecken", "kisten", "gruenfeuer", "schmelztiegel", "schlacke", "erzhaufen", "duergarstatue", "amboss"], wall: ["ketten", "wandlaterne", "rohre", "rohre", "zangen"], ceil: ["ketten_h", "kranhaken"], crit: ["ratte", "ratte"] },
    sturm: { floor: ["truemmer", "statue", "kanonenkugeln", "kandelaber_um", "dornen", "giftpilze", "knochen", "truemmer"], wall: ["wandlaterne", "schild", "ranken_w", "banner_zerrissen", "ranken_w"], ceil: ["ranken_h", "ranken_h"], crit: ["kraehe", "kraehe"] }
  });
  /* Szenen: zusammengehörige Arrangements [Art, dx in Kacheln, Blickrichtung] + Wandstücke [Art, dx, dy] */
  Object.assign(SCN, {
    torhof: [
      { f: [["heu", -1.8], ["trog", 0.4], ["eimer", 2]], w: [["hufeisen", 0, -1], ["werkzeugbrett", 2, -1]] },
      { f: [["karren", -1.4], ["apfelkorb", 0.8], ["kisten", 2.1]] },
      { f: [["waffenstaender", -1.5], ["hocker", 0, -1], ["faesser", 1.5]], w: [["steckbrief", 0, -1]] },
      { f: [["hackklotz", -1], ["holzstapel", 1]] },
      { f: [["huhn", -1.6], ["heu", 0], ["huhn", 1.6]] }
    ],
    keller: [
      { f: [["vorratsregal", -1.5], ["saecke", 0.6], ["kartoffelkiste", 2]], w: [["zwiebelzopf", 1, -1]] },
      { f: [["weinfass", -1.2], ["krugreihe", 1]], w: [["flaschenregal", 0, -1]] },
      { f: [["kessel", -2], ["kuechentisch", 0.8]], w: [["pfannen", 1, -1]] },
      { f: [["hocker", -1.9, 1], ["kuechentisch", 0], ["hocker", 1.9, -1]], w: [["wandkerze", 0, -1]] }
    ],
    hallen: [
      { f: [["stuhl", -2.3, 1], ["esstisch", 0], ["stuhl", 2.3, -1]], w: [["portraet", 0, -1]] },
      { f: [["stuhl", -3.1, 1], ["stuhl", -2.2, 1], ["esstisch", 0], ["stuhl", 2.2, -1], ["stuhl", 3.1, -1]], w: [["wandleuchter", -2, -1], ["wandleuchter", 2, -1]] },
      { f: [["buecherregal", -1.2], ["lesepult", 1], ["kerzenstaender", 2]] },
      { f: [["globus", -2], ["buecherregal", 0], ["sessel", 2.1]] },
      { f: [["sessel", -2.4, 1], ["kamin", 0.6]], w: [["landschaft", -2.4, -1]] },
      { f: [["ruestung", -2.2], ["teppich", 0], ["ruestung", 2.2]], w: [["wappen", 0, -1]] }
    ],
    wehrgang: [
      { f: [["hocker", -1.9, 1], ["wachtisch", 0], ["hocker", 1.9, -1]], w: [["steckbrief", -1, -1], ["schluesselbrett", 2, -1]] },
      { f: [["zielscheibe", -1], ["koecherfass", 1]] },
      { f: [["kanonenkugeln", -1.2], ["kohlebecken", 0], ["pulverfass", 1.2]] },
      { f: [["bank", -0.8], ["kohlebecken", 1.2]], w: [["wandlaterne", -1, -1]] }
    ],
    verlies: [
      { f: [["streckbank", -0.6], ["kohlebecken", 1.6]], w: [["peitschen", 0, -1]] },
      { f: [["stroh", -1], ["eimer", 0.8], ["napf", 1.6]], w: [["strichliste", -1, -1], ["kerkerfenster", 2, -1]] },
      { f: [["hocker", -1.9, 1], ["wachtisch", 0], ["hocker", 1.9, -1]], w: [["schluesselbrett", 0, -1]] },
      { f: [["folterstuhl", -1.3], ["jungfrau", 0.3], ["knochen", 1.6]] }
    ],
    hafen: [
      { f: [["hocker", -1.2, 1], ["fischkorb", 0], ["netze", 1.6]], w: [["reuse", 0, -1]] },
      { f: [["kisten", -1.8], ["faesser", 0], ["saecke", 1.8]] },
      { f: [["boot", 0], ["ruderbuendel", 2.4]], w: [["steuerrad", 0, -1]] },
      { f: [["poller", -1.2], ["tauwerk", 0], ["anker", 1.3]], w: [["rettungsring", 0, -1]] }
    ],
    glocken: [
      { f: [["hocker", -1.9, 1], ["uhrtisch", 0], ["standuhr", 2.1]], w: [["uhrblatt", 0, -1]] },
      { f: [["grosseglocke", -0.6], ["zahnradkiste", 1.8]] },
      { f: [["winde", -1], ["kisten", 1]], w: [["seilrolle", -1, -1]] }
    ],
    schlund: [
      { f: [["eiersack", -1.6], ["knochenhaufen", 0], ["eiersack", 1.5]] },
      { f: [["pilze", -1.6], ["pilzring", 0], ["pilze", 1.6]] },
      { f: [["kokon_boden", -0.6], ["kristall", 1.3]] }
    ],
    schmiede: [
      { f: [["esse", -1.4], ["amboss", 1], ["wassertrog", 2.6]], w: [["werkzeugwand", 1, -1]] },
      { f: [["waffenstaender", -1.5], ["ruestungsstaender", 0], ["barren", 1.3]], w: [["schwertwand", 0, -1]] },
      { f: [["schleifstein", -0.8], ["gussform", 1.2]] }
    ],
    zinnen: [
      { f: [["kanonenkugeln", -2.4], ["kanone", 0], ["pulverfass", 2.4]] },
      { f: [["ballista", 0], ["fahnenmast", 2.4]] }
    ],
    see: [
      { f: [["opferschale", -1.3], ["goetze", 0], ["muscheln", 1.3]], w: [["kuo_glyphen", 0, -1]] },
      { f: [["wrackkiste", -1], ["amphore", 0.6], ["fischgraeten", 1.6]] },
      { f: [["korallen", -1.2], ["saeulenstumpf", 0], ["korallen", 1.2]] }
    ],
    glut: [
      { f: [["schmelztiegel", -1.4], ["erzhaufen", 0.8], ["schlacke", 2.2]] },
      { f: [["gruenfeuer", -1.5], ["duergarstatue", 0], ["gruenfeuer", 1.5]] },
      { f: [["kohlenkarren", 0], ["erzhaufen", 2.6]] }
    ],
    sturm: [
      { f: [["truemmer", -1.6], ["statue", 0], ["kandelaber_um", 1.7]] },
      { f: [["dornen", -1], ["giftpilze", 0.7], ["knochen", 1.5]] }
    ]
  });
  /* ======================= Ausstattung nach Raumfunktion (welt.js assignRooms → cell.fn) =======================
     Räume mit Funktion holen Szenen und Einzelstücke aus ihrem eigenen Satz (Küche: Kessel, Pfannen, Würste …),
     gleiche Stückzahl wie sonst (Leistung). Schlüssel: "<gebiet>:<funktion>" vor "<funktion>". */
  const S3 = (a, b) => ({ f: [["hocker", -1.9, 1], [a, 0], ["hocker", 1.9, -1]], w: b ? [[b, 0, -1]] : undefined });
  const ROOMSET = (Z.ROOMSET = {
    wachstube: { scn: [{ f: [["hocker", -1.9, 1], ["wachtisch", 0], ["hocker", 1.9, -1]], w: [["steckbrief", -1, -1], ["schluesselbrett", 2, -1]] }], floor: ["waffenstaender", "faesser", "bank", "kohlebecken"], wall: ["schild", "schluesselbrett", "steckbrief", "wandlaterne"], ceil: ["laterne_h"], crit: ["katze", "ratte"] },
    stall: { scn: [{ f: [["heu", -1.8], ["trog", 0.4], ["eimer", 2]], w: [["hufeisen", 0, -1]] }, { f: [["huhn", -1.6], ["heu", 0], ["huhn", 1.6]] }], floor: ["heu", "trog", "eimer", "karren", "holzstapel"], wall: ["hufeisen", "werkzeugbrett"], ceil: ["kraeuter", "laterne_h"], crit: ["huhn", "huhn", "katze", "ratte"] },
    unterstand: { scn: [{ f: [["amboss", -1], ["kohlebecken", 1.2], ["wassertrog", 2.6]], w: [["zangen", 0, -1], ["werkzeugbrett", 2, -1]] }, { f: [["hackklotz", -1], ["holzstapel", 1]] }], floor: ["amboss", "holzstapel", "hackklotz", "kohlebecken"], wall: ["zangen", "werkzeugbrett", "hufeisen"], ceil: ["laterne_h"] },
    uebungsplatz: { scn: [{ f: [["zielscheibe", -1], ["koecherfass", 1]] }, { f: [["waffenstaender", -1.5], ["hocker", 0, -1], ["faesser", 1.5]], w: [["steckbrief", 0, -1]] }], floor: ["zielscheibe", "waffenstaender", "koecherfass", "heu"], wall: ["schild", "steckbrief"], crit: ["kraehe"] },
    schuppen: { scn: [{ f: [["kisten", -1.8], ["faesser", 0], ["saecke", 1.8]] }], floor: ["kisten", "faesser", "saecke", "holzstapel", "apfelkorb", "karren"], wall: ["werkzeugbrett"], ceil: ["kraeuter"], crit: ["ratte"] },
    kueche: { scn: [{ f: [["kessel", -2], ["kuechentisch", 0.8]], w: [["pfannen", 1, -1]] }, { f: [["hocker", -1.9, 1], ["kuechentisch", 0], ["hocker", 1.9, -1]], w: [["wuerste", 0, -1]] }], floor: ["kessel", "kuechentisch", "faesser", "saecke", "apfelkorb", "besen"], wall: ["pfannen", "wuerste", "zwiebelzopf", "wandregal"], ceil: ["kraeuter"], crit: ["katze", "ratte"] },
    weinkeller: { scn: [{ f: [["weinfass", -1.2], ["krugreihe", 1]], w: [["flaschenregal", 0, -1]] }], floor: ["weinfass", "fassregal", "faesser", "krugreihe"], wall: ["flaschenregal", "wandkerze", "spinnweben"], ceil: ["spinne", "tropfen"], crit: ["ratte"] },
    vorratskammer: { scn: [{ f: [["vorratsregal", -1.5], ["saecke", 0.6], ["kartoffelkiste", 2]], w: [["zwiebelzopf", 1, -1]] }], floor: ["vorratsregal", "saecke", "kaese", "kartoffelkiste", "kisten", "apfelkorb"], wall: ["wuerste", "zwiebelzopf", "wandregal"], ceil: ["kraeuter"], crit: ["ratte", "katze"] },
    gesindestube: { scn: [S3("kuechentisch", "wandkerze")], floor: ["bank", "hocker", "besen", "eimer"], wall: ["wandkerze", "wandregal"], crit: ["katze"] },
    brunnenkammer: { scn: [{ f: [["brunnen", 0], ["eimer", 1.8]] }], floor: ["eimer", "trog"], wall: ["spinnweben", "wandkerze"], ceil: ["tropfen"], crit: ["ratte"] },
    bankettsaal: { scn: [{ f: [["stuhl", -3.1, 1], ["stuhl", -2.2, 1], ["esstisch", 0], ["stuhl", 2.2, -1], ["stuhl", 3.1, -1]], w: [["wandleuchter", -2, -1], ["wandleuchter", 2, -1]] }, { f: [["stuhl", -2.3, 1], ["esstisch", 0], ["stuhl", 2.3, -1]], w: [["portraet", 0, -1]] }], floor: ["kerzenstaender", "teppich", "harfe"], wall: ["portraet", "wandteppich", "wandleuchter", "wappen", "geweih"], ceil: ["kronleuchter_k"], crit: ["katze"] },
    anrichte: { scn: [{ f: [["kuechentisch", -0.5], ["faesser", 1.8]], w: [["pfannen", 0, -1]] }, { f: [["krugreihe", -1], ["weinfass", 1.2]] }], floor: ["kuechentisch", "krugreihe", "faesser"], wall: ["wandregal", "flaschenregal", "pfannen"], crit: ["katze"] },
    bibliothek: { scn: [{ f: [["buecherregal", -1.2], ["lesepult", 1], ["kerzenstaender", 2]] }, { f: [["globus", -2], ["buecherregal", 0], ["sessel", 2.1]] }], floor: ["buecherregal", "lesepult", "globus", "sessel", "kerzenstaender"], wall: ["landschaft", "wandleuchter", "portraet"], ceil: ["kronleuchter_k", "spinne"] },
    kapelle: { scn: [{ f: [["kerzenstaender", -2], ["statue", 0], ["kerzenstaender", 2]], w: [["wandteppich", 0, -1]] }, { f: [["bank", -1.6], ["bank", 1.6]], w: [["wandkerze", 0, -1]] }], floor: ["kerzenstaender", "bank", "statue", "buestensaeule", "teppich"], wall: ["wandkerze", "wandteppich", "wappen"], ceil: ["kronleuchter_k"] },
    ahnengalerie: { scn: [{ f: [["ruestung", -2.2], ["teppich", 0], ["ruestung", 2.2]], w: [["wappen", 0, -1]] }, { f: [["buestensaeule", -1.5], ["buestensaeule", 1.5]], w: [["portraet", 0, -1]] }], floor: ["buestensaeule", "ruestung", "teppich"], wall: ["portraet", "portraet", "landschaft", "spiegel"], ceil: ["kronleuchter_k"] },
    schlafgemach: { scn: [{ f: [["sessel", -2.4, 1], ["kamin", 0.6]], w: [["landschaft", -2.4, -1]] }, { f: [["truhe", -1.2], ["teppich", 0.6], ["standuhr", 2.2]], w: [["spiegel", 0, -1]] }], floor: ["truhe", "sessel", "standuhr", "harfe", "teppich"], wall: ["spiegel", "portraet", "wandteppich"], crit: ["katze"] },
    ruestkammer: { scn: [{ f: [["waffenstaender", -1.5], ["ruestung", 0], ["waffenstaender", 1.5]], w: [["schild", 0, -1]] }, { f: [["ruestungsstaender", -1], ["koecherfass", 1]] }], floor: ["waffenstaender", "ruestung", "ruestungsstaender", "koecherfass", "kisten"], wall: ["schild", "schwertwand", "wappen"] },
    geschuetzstand: { scn: [{ f: [["kanonenkugeln", -2.4], ["kanone", 0], ["pulverfass", 2.4]] }, { f: [["kanonenkugeln", -1.2], ["kohlebecken", 0], ["pulverfass", 1.2]] }], floor: ["kanonenkugeln", "pulverfass", "kanone", "faesser"], wall: ["wandlaterne", "banner_zerrissen"], crit: ["kraehe", "taube"] },
    kaserne: { scn: [{ f: [["bank", -0.8], ["kohlebecken", 1.2]], w: [["wandlaterne", -1, -1]] }, S3("wachtisch", "steckbrief")], floor: ["stroh", "bank", "kisten", "faesser", "heu"], wall: ["schild", "steckbrief", "wandlaterne"] },
    schuetzenstand: { scn: [{ f: [["zielscheibe", -1], ["koecherfass", 1]] }], floor: ["koecherfass", "zielscheibe", "kisten"], wall: ["schild", "banner_zerrissen"], crit: ["kraehe"] },
    waerterstube: { scn: [S3("wachtisch", "schluesselbrett")], floor: ["wachtisch", "hocker", "kohlebecken", "faesser"], wall: ["schluesselbrett", "steckbrief", "wandlaterne"], crit: ["ratte"] },
    zellenblock: { scn: [{ f: [["stroh", -1], ["eimer", 0.8], ["napf", 1.6]], w: [["strichliste", -1, -1], ["kerkerfenster", 2, -1]] }], floor: ["stroh", "napf", "eimer", "bodenkaefig", "knochen"], wall: ["fesseln", "strichliste", "kritzelei", "kerkerfenster"], ceil: ["ketten_h", "tropfen", "haengekaefig"], crit: ["ratte"] },
    folterkammer: { scn: [{ f: [["streckbank", -0.6], ["kohlebecken", 1.6]], w: [["peitschen", 0, -1]] }, { f: [["folterstuhl", -1.3], ["jungfrau", 0.3], ["knochen", 1.6]] }], floor: ["streckbank", "folterstuhl", "jungfrau", "kohlebecken"], wall: ["peitschen", "fesseln"], ceil: ["haengekaefig", "ketten_h"] },
    gebeinhaus: { scn: [{ f: [["knochenhaufen", -1.5], ["knochen", 0.5], ["knochenhaufen", 1.8]] }], floor: ["knochen", "knochenhaufen"], wall: ["kritzelei", "spinnweben"], ceil: ["tropfen", "spinne"], crit: ["ratte"] },
    lagerhaus: { scn: [{ f: [["kisten", -1.8], ["faesser", 0], ["saecke", 1.8]] }, { f: [["seekiste", -1], ["kisten", 1]] }], floor: ["kisten", "faesser", "saecke", "seekiste", "tauwerk"], wall: ["wandlaterne", "netzwand"], ceil: ["netz_h", "laterne_h"], crit: ["ratte", "katze"] },
    bootsschuppen: { scn: [{ f: [["boot", 0], ["ruderbuendel", 2.4]], w: [["steuerrad", 0, -1]] }, { f: [["poller", -1.2], ["tauwerk", 0], ["anker", 1.3]], w: [["rettungsring", 0, -1]] }], floor: ["anker", "ruderbuendel", "tauwerk", "netze"], wall: ["ruder_x", "rettungsring", "steuerrad"], ceil: ["netz_h"], crit: ["moewe"] },
    taverne: { scn: [{ f: [["stuhl", -2.3, 1], ["esstisch", 0], ["stuhl", 2.3, -1]], w: [["schiffsglocke", 0, -1]] }, { f: [["weinfass", -1.2], ["krugreihe", 1]] }], floor: ["faesser", "weinfass", "hocker", "bank"], wall: ["wandlaterne", "rettungsring", "schiffsglocke"], ceil: ["laterne_h", "trockenfisch"], crit: ["katze"] },
    fischerkate: { scn: [{ f: [["hocker", -1.2, 1], ["fischkorb", 0], ["netze", 1.6]], w: [["reuse", 0, -1]] }], floor: ["fischkorb", "hummerkorb", "netze", "eimer"], wall: ["reuse", "netzwand"], ceil: ["trockenfisch", "netz_h"], crit: ["moewe", "katze"] },
    zollstube: { scn: [S3("wachtisch", "schluesselbrett")], floor: ["kisten", "seekiste", "saecke"], wall: ["steckbrief", "wandlaterne"] },
    glockenstube: { scn: [{ f: [["grosseglocke", -0.6], ["kleineglocke", 1.8]] }], floor: ["kleineglocke", "grosseglocke", "winde"], wall: ["seilrolle", "wandlaterne"], ceil: ["glockenseil", "glockenseil"], crit: ["taube"] },
    uhrwerk: { scn: [{ f: [["winde", -1], ["zahnradkiste", 1]], w: [["zahnrad", -1, -1], ["zahnrad", 2, -1]] }], floor: ["zahnradkiste", "winde"], wall: ["zahnrad", "uhrblatt"], ceil: ["flaschenzug"] },
    uhrmacher: { scn: [{ f: [["hocker", -1.9, 1], ["uhrtisch", 0], ["standuhr", 2.1]], w: [["uhrblatt", 0, -1]] }], floor: ["uhrtisch", "standuhr", "zahnradkiste"], wall: ["werkzeugbrett_fein", "uhrblatt"] },
    taubenschlag: { scn: [{ f: [["taube", -1.5], ["kisten", 0], ["taube", 1.5]] }], floor: ["kisten", "heu"], wall: ["wandlaterne"], crit: ["taube", "taube"] },
    seilkammer: { scn: [{ f: [["winde", -1], ["kisten", 1]], w: [["seilrolle", -1, -1]] }], floor: ["winde", "tauwerk", "kisten"], wall: ["seilrolle"], ceil: ["flaschenzug", "glockenseil"] },
    brutkammer: { scn: [{ f: [["eiersack", -1.6], ["kokon_boden", 0], ["eiersack", 1.5]], w: [["eier_wand", 0, -1]] }], floor: ["eiersack", "kokon_boden"], wall: ["eier_wand", "gespinst"], ceil: ["kokon_h", "spinne"] },
    beutelager: { scn: [{ f: [["knochen", -1.4], ["knochenhaufen", 0], ["kokon_boden", 1.6]] }], floor: ["knochenhaufen", "knochen", "kokon_boden"], wall: ["gespinst", "spinnweben"], ceil: ["kokon_h"] },
    pilzgrotte: { scn: [{ f: [["pilze", -1.6], ["pilzring", 0], ["pilze", 1.6]] }], floor: ["pilze", "pilzring", "kaefer"], wall: ["wandpilze"], ceil: ["tropfen"] },
    kristallhoehle: { scn: [{ f: [["kristall", -1.4], ["kristall", 1.4]] }], floor: ["kristall", "pilze"], wall: ["wandpilze"], ceil: ["tropfen"] },
    essenhalle: { scn: [{ f: [["esse", -1.4], ["amboss", 1], ["wassertrog", 2.6]], w: [["werkzeugwand", 1, -1]] }], floor: ["esse", "amboss", "wassertrog", "kohlebecken", "schleifstein"], wall: ["zangen", "werkzeugwand"], ceil: ["ketten_h", "flaschenzug"] },
    giesserei: { scn: [{ f: [["schmelztiegel", -1.4], ["gussform", 0.8], ["barren", 2.2]] }], floor: ["schmelztiegel", "gussform", "barren", "kohlebecken"], wall: ["zangen", "ketten"], ceil: ["kranhaken"] },
    "glut:giesserei": { scn: [{ f: [["schmelztiegel", -1.4], ["erzhaufen", 0.8], ["schlacke", 2.2]] }], floor: ["schmelztiegel", "kohlebecken", "schlacke"], wall: ["rohre", "zangen"], ceil: ["kranhaken", "ketten_h"] },
    erzlager: { scn: [{ f: [["kohlenkarren", 0], ["erzhaufen", 2.6]] }], floor: ["erzhaufen", "kohlenkarren", "kisten", "schlacke"], wall: ["ketten", "wandlaterne"], ceil: ["kranhaken"] },
    waffenkammer: { scn: [{ f: [["waffenstaender", -1.5], ["ruestungsstaender", 0], ["barren", 1.3]], w: [["schwertwand", 0, -1]] }], floor: ["waffenstaender", "ruestungsstaender", "barren"], wall: ["schwertwand", "werkzeugwand"] },
    runenkammer: { scn: [{ f: [["runensteine", -1.2], ["kohlebecken", 1.2]], w: [["runentafel", 0, -1]] }], floor: ["runensteine"], wall: ["runentafel"], ceil: ["ketten_h"] },
    wehrturm: { scn: [{ f: [["ballista", 0], ["fahnenmast", 2.4]] }], floor: ["ballista", "fahnenmast", "kanonenkugeln", "faesser"], wall: ["schild", "banner_zerrissen"], crit: ["kraehe"] },
    speiergalerie: { scn: [{ f: [["wasserspeier", -2], ["statue", 0], ["wasserspeier", 2]] }], floor: ["wasserspeier", "statue", "kohlebecken"], crit: ["kraehe"] },
    tempel: { scn: [{ f: [["opferschale", -1.3], ["goetze", 0], ["muscheln", 1.3]], w: [["kuo_glyphen", 0, -1]] }, { f: [["saeulenstumpf", -1.6], ["goetze", 0], ["saeulenstumpf", 1.6]] }], floor: ["goetze", "saeulenstumpf", "opferschale", "amphore"], wall: ["kuo_glyphen", "muschelwand"], ceil: ["algen_h"] },
    opferstaette: { scn: [{ f: [["opferschale", -1.3], ["goetze", 0], ["fischgraeten", 1.3]], w: [["kuo_glyphen", 0, -1]] }], floor: ["opferschale", "fischgraeten"], wall: ["kuo_glyphen"] },
    wrackhalde: { scn: [{ f: [["wrackkiste", -1], ["amphore", 0.6], ["fischgraeten", 1.6]] }], floor: ["wrackkiste", "amphore", "fischgraeten", "anker"], wall: ["netzwand"], crit: ["krabbe"] },
    korallengarten: { scn: [{ f: [["korallen", -1.2], ["saeulenstumpf", 0], ["korallen", 1.2]] }], floor: ["korallen", "muscheln", "schilf"], wall: ["algen"], ceil: ["algen_h"], crit: ["krabbe"] },
    schrein: { scn: [{ f: [["gruenfeuer", -1.5], ["duergarstatue", 0], ["gruenfeuer", 1.5]] }], floor: ["gruenfeuer", "duergarstatue"], wall: ["rohre"] },
    schlackehalde: { scn: [{ f: [["schlacke", -1.2], ["kohlenkarren", 0.6], ["schlacke", 2]] }], floor: ["schlacke", "erzhaufen", "kohlenkarren"], wall: ["rohre"] },
    "sturm:kapelle": { scn: [{ f: [["truemmer", -1.6], ["statue", 0], ["kandelaber_um", 1.7]] }], floor: ["statue", "kandelaber_um", "truemmer"], wall: ["ranken_w"] },
    giftgarten: { scn: [{ f: [["dornen", -1], ["giftpilze", 0.7], ["knochen", 1.5]] }], floor: ["giftpilze", "dornen"], wall: ["ranken_w"], ceil: ["ranken_h"] },
    "sturm:wachstube": { scn: [{ f: [["truemmer", -1.4], ["kanonenkugeln", 1.2]] }], floor: ["truemmer", "kanonenkugeln", "knochen"], wall: ["schild", "banner_zerrissen"] },
    truemmerhalle: { scn: [{ f: [["truemmer", -1.6], ["statue", 0], ["truemmer", 1.6]] }], floor: ["truemmer", "statue", "knochen"], wall: ["ranken_w"] },
    schatz: { scn: [{ f: [["truhe", -1.2], ["kisten", 1.2]] }], floor: ["truhe", "kisten"], wall: ["wappen", "wandleuchter"] }
  });
  /* Schlüsselstück je Raumtyp: steht gut sichtbar nahe der Raummitte (Prop-Feld key: true – z. B. für Lichtinseln in pracht.js) */
  const ROOMKEY = (Z.ROOMKEY = {"wachstube": "wachtisch", "stall": "trog", "unterstand": "amboss", "uebungsplatz": "zielscheibe", "schuppen": "karren", "kueche": "kessel", "weinkeller": "weinfass", "vorratskammer": "vorratsregal", "gesindestube": "kuechentisch", "brunnenkammer": "brunnen", "bankettsaal": "esstisch", "anrichte": "krugreihe", "bibliothek": "buecherregal", "kapelle": "statue", "ahnengalerie": "buestensaeule", "schlafgemach": "kamin", "ruestkammer": "ruestung", "geschuetzstand": "kanone", "kaserne": "wachtisch", "schuetzenstand": "zielscheibe", "waerterstube": "wachtisch", "zellenblock": "bodenkaefig", "folterkammer": "streckbank", "gebeinhaus": "knochenhaufen", "lagerhaus": "kisten", "bootsschuppen": "boot", "taverne": "weinfass", "fischerkate": "fischkorb", "zollstube": "wachtisch", "glockenstube": "grosseglocke", "uhrwerk": "winde", "uhrmacher": "uhrtisch", "taubenschlag": "kisten", "seilkammer": "winde", "brutkammer": "eiersack", "beutelager": "knochenhaufen", "pilzgrotte": "pilzring", "kristallhoehle": "kristall", "essenhalle": "esse", "giesserei": "schmelztiegel", "glut:giesserei": "schmelztiegel", "erzlager": "kohlenkarren", "waffenkammer": "waffenstaender", "runenkammer": "runensteine", "wehrturm": "ballista", "speiergalerie": "wasserspeier", "tempel": "goetze", "opferstaette": "opferschale", "wrackhalde": "wrackkiste", "korallengarten": "korallen", "schrein": "duergarstatue", "schlackehalde": "schlacke", "sturm:kapelle": "statue", "giftgarten": "giftpilze", "sturm:wachstube": "truemmer", "truemmerhalle": "statue", "schatz": "truhe"});
  const roomSet = (lv, cell) => cell && cell.fn ? ROOMSET[lv.biome + ":" + cell.fn] || ROOMSET[cell.fn] || null : null;
  let props = [], lvRef = null;
  const LAYER = { w: 0, c: 2, f: 1 };
  const FLOORDECO = new Set(["barrel", "crate", "bones", "skull", "pot", "sack", "statue", "armor", "table", "anvil", "forge", "mushroom", "coral", "shell", "hay", "cart", "brazier", "candelabra", "anchor", "statueKuo", "statueDuergar", "greenfire", "weapons", "rack", "crystal", "gargoyle", "mast", "candle", "tent"]);
  function setup(lv) {
    props = []; lvRef = lv; SPR.clear();
    if (!lv || lv.hub || lv.arena || lv.passage || !lv.cells) return;
    const set = SETS[lv.biome]; if (!set) return;
    const R = Z.Rng(((lv.seed || 4) * 9301 + 49297) >>> 0);
    const g = lv.get, sky = (x, y) => Z.gfx.sky && Z.gfx.sky[y * lv.W + x];
    const sp = Z.spuren ? Z.spuren() : [];
    const blocked = (x, y, w, wall, ersetz) => props.some(p => !!p.wall === !!wall && Math.abs(p.x - x) < (w + p.w) / 2 + (wall ? 2 : 0.5) && Math.abs(p.y - y) < 3)
      || (lv.doors || []).some(d => Math.abs(d.x - x) < 3 + w / 2 && Math.abs(d.y - y) < 3)
      || (lv.traps || []).some(t => Math.abs(t.x - x) < 2 + w / 2 && Math.abs(t.y - y) < 2)
      || (lv.decor || []).some(d => wall ? Math.abs(d.x - x) < 2 + w / 2 && Math.abs(d.y - y) < 3 : FLOORDECO.has(d.kind) ? !ersetz && Math.abs(d.x - x) < 1.5 + w / 2 && Math.abs(d.y - y) < 1 : Math.abs(d.x - x) < w / 2 && d.y <= y && y - d.y < 3)
      || (!wall && sp.some(s => Math.abs(s.x - x) < 4 + w / 2 && Math.abs(s.y - y) < 3))
      || (lv.start && Math.abs(lv.start.x - x) < 3 && Math.abs(lv.start.y - y) < 3);
    const floorOK = (x, y, w, hd) => { const h = Math.floor(w / 2); for (let i = -h; i <= w - 1 - h; i++) if (!Z.standable(lv, x + i, y, hd || 2) || g(x + i, y + 1) === 2) return false; return true; };
    const head = kind => { const d = K[kind]; return d.box ? Math.max(2, Math.ceil((-d.box[1] - 3) / T)) : 2; };
    const open = (x, y) => Z.gfx && Z.gfx.isOpen && Z.gfx.isOpen(x, y);
    const wallOK = (x, y, ww, wh) => { for (let dy = -wh + 1; dy <= 1; dy++) for (let dx = -ww; dx <= ww; dx++) if (g(x + dx, y + dy) !== 0 || sky(x + dx, y + dy) || open(x + dx, y + dy)) return false; return true; };
    const ceilOK = (x, y, len) => { if (g(x, y - 1) !== 1 || sky(x, y)) return false; for (let k = 0; k < len; k++) if (g(x, y + k) !== 0) return false; return true; };
    const mk = (kind, x, y, ex) => { const d = K[kind]; const p = Object.assign({ kind, x, y, w: d.w || 1, s: R(), f: R() < 0.5 ? -1 : 1, wall: d.at === "w", L: LAYER[d.at] + (d.crit ? 2 : 0) }, ex || {}); if (d.crit && p.ra == null) { p.ra = -2 * T; p.rb = 2 * T; } p.v = Math.min((d.nv || 3) - 1, (p.s * (d.nv || 3)) | 0); props.push(p); return p; };
    for (const k in lv.cells) {
      const cell = lv.cells[k], ox = cell.x * CW, oy = cell.y * CH;
      const rx = () => ox + 2 + R.int(0, CW - 5);
      /* Raumfunktion: eigene Szenen und Stücke (sonst die des Gebiets) */
      const RS = roomSet(lv, cell), scnL = (RS && RS.scn) || SCN[lv.biome];
      const fl = (RS && RS.floor) || set.floor, wl0 = (RS && RS.wall) || set.wall, cl = (RS && RS.ceil) || set.ceil, crl = (RS && RS.crit) || set.crit;
      /* alle Bodenplätze dieser Zelle (3 Kacheln Kopffreiheit, kein Steg) */
      const spots = []; for (let y = oy + 1; y < oy + CH - 1; y++) for (let x = ox + 1; x < ox + CW - 1; x++) if (floorOK(x, y, 1)) spots.push([x, y]);
      let scene = false;
      /* Schlüsselstück zuerst: Bodenplatz möglichst nah an der Raummitte (und weit unten im Raum, wo man läuft) */
      let keyed = false;
      const kk = RS && (ROOMKEY[lv.biome + ":" + cell.fn] || ROOMKEY[cell.fn]);
      if (kk && K[kk] && spots.length > 4) {
        const w = K[kk].w || 1, cx = ox + CW / 2;
        const cand = spots.filter(([x, y]) => floorOK(x, y, w, head(kk)) && !blocked(x, y, w)).sort((a, b) => (Math.abs(a[0] - cx) - a[1] * 0.3) - (Math.abs(b[0] - cx) - b[1] * 0.3));
        if (cand.length) { const [x, y] = cand[0]; mk(kk, x, y, { g: 1, key: true }); keyed = true; }
      }
      /* Szene: mehrere Stücke als Gruppe */
      if (scnL && spots.length > 6 && R() < (RS ? 0.95 : 0.75)) {
        for (let tries = 0; tries < 40 && !scene; tries++) {
          const sc = R.pick(scnL), [x, y] = R.pick(spots);
          let ok = true;
          for (const [kind, dx] of sc.f) { const w = K[kind].w || 1, xx = Math.round(x + dx); if (xx - w / 2 < ox || xx + w / 2 > ox + CW || !floorOK(xx, y, w, head(kind)) || blocked(x + dx, y, w, false, true)) { ok = false; break; } }
          if (!ok) continue;
          const wl = (sc.w || []).filter(([kind, dx, dy]) => wallOK(Math.round(x + dx), y + dy, 1, 3) && !blocked(x + dx, y + dy, 2, true));
          for (const [kind, dx, ff] of sc.f) mk(kind, x + dx, y, ff ? { f: ff, g: 1 } : { g: 1 });
          /* einfache Bodendeko, die der Szene im Weg steht, räumt den Platz */
          let x0 = 1e9, x1 = -1e9; for (const [kind, dx] of sc.f) { const w = K[kind].w || 1; x0 = Math.min(x0, x + dx - w / 2 - 1); x1 = Math.max(x1, x + dx + w / 2 + 1); }
          const weg = d => FLOORDECO.has(d.kind) && d.y === y && d.x >= x0 && d.x <= x1;
          if (lv.decor) lv.decor = lv.decor.filter(d => !weg(d)); if (lv.lights) lv.lights = lv.lights.filter(d => !weg(d));
          for (const [kind, dx, dy] of wl) mk(kind, x + dx, y + dy, { f: R() < 0.5 ? -1 : 1 });
          scene = true;
        }
      }
      /* Einzelstücke am Boden */
      let n = (scene ? 0 : 1) + (R() < 0.6 ? 1 : 0) + (R() < 0.3 ? 1 : 0) - (keyed ? 1 : 0); /* Schlüsselstück zählt mit (gleiche Stückzahl) */
      for (let tries = 0; tries < 40 && n > 0 && spots.length; tries++) {
        const kind = R.pick(fl), w = K[kind].w || 1, [x, y] = R.pick(spots);
        if (!floorOK(x, y, w, head(kind)) || blocked(x, y, w)) continue;
        mk(kind, x, y); n--;
      }
      /* Wand */
      let m = 1 + (R() < 0.5 ? 1 : 0);
      for (let tries = 0; tries < 60 && m > 0; tries++) {
        const kind = R.pick(wl0), x = rx(), y = oy + 2 + R.int(0, CH - 5);
        let ok;
        if (kind === "spinnweben") ok = g(x, y) === 0 && g(x, y - 1) === 1 && (g(x - 1, y) === 1 || g(x + 1, y) === 1) && !sky(x, y);
        else ok = wallOK(x, y, 1, 3);
        if (!ok || blocked(x, y, 2, true)) continue;
        mk(kind, x, y, kind === "spinnweben" ? { f: g(x - 1, y) === 1 ? 1 : -1 } : null); m--;
      }
      /* Decke: Hängendes */
      if (cl && R() < 0.65) {
        for (let tries = 0; tries < 40; tries++) {
          const kind = R.pick(cl), d = K[kind], x = rx(), y = oy + 1 + R.int(0, CH - 6);
          if (!ceilOK(x, y, d.len || 4) || props.some(p => p.L === 2 && Math.abs(p.x - x) < 4 && Math.abs(p.y - y) < 4) || (lv.decor || []).some(dd => Math.abs(dd.x - x) < 2 && Math.abs(dd.y - y) < 3)) continue;
          let fall = 0; while (fall < 30 && g(x, y + fall) === 0) fall++;
          mk(kind, x, y, { fall: fall * T }); break;
        }
      }
      /* Tiere */
      if (crl && R() < 0.4) {
        for (let tries = 0; tries < 30; tries++) {
          const kind = R.pick(crl), d = K[kind]; let x = rx(), y = oy + 1 + R.int(0, CH - 3);
          if (d.at !== "c") { if (!spots.length) break; [x, y] = R.pick(spots); }
          if (d.at === "c") { if (!ceilOK(x, y, d.len || 3)) continue; let fall = 0; while (fall < 30 && g(x, y + fall) === 0) fall++; mk(kind, x, y, { fall: fall * T }); break; }
          if (!floorOK(x, y, 1) || blocked(x, y, 1)) continue;
          let a = x, b = x; while (a > ox && x - a < 7 && floorOK(a - 1, y, 1)) a--; while (b < ox + CW - 1 && b - x < 7 && floorOK(b + 1, y, 1)) b++;
          if (d.run && b - a < 4) continue;
          mk(kind, x, y, { ra: (a - x) * T, rb: (b - x) * T }); break;
        }
      }
    }
    props.sort((a, b) => a.L - b.L);
    /* Sprites nach und nach vorbereiten, damit beim Betreten eines Raums nichts ruckelt */
    WARM.length = 0; const seen = new Set();
    for (const p of props) { const k = p.kind + "|" + p.v; if (K[p.kind].s && !seen.has(k)) { seen.add(k); WARM.push([p.kind, p.v]); } }
    const bg = Z.biome && Z.biome.bg; if (bg && FGK[bg]) for (const kind of FGK[bg]) for (let v = 0; v < 3; v++) WARM.push(["fg", kind, v, bg]);
  }
  const WARM = [];
  function warmTick() { let budget = 3; while (WARM.length && budget > 0) { const w = WARM.shift(); if (w[0] === "fg") { if (!simple()) fgSprite(w[1], w[2], w[3]); budget -= 3; } else { spriteOf(w[0], w[1]); budget--; } } }
  const load0 = Z.loadArea;
  Z.loadArea = function () { const r = load0.apply(this, arguments); try { setup(Z.level); initBreak(); } catch (e) { console.error(e); } return r; };

  /* ======================= Zeichnen ======================= */
  function paint(c, p, t, x, y) {
    const d = K[p.kind]; if (!d) return;
    const flip = p.f < 0 && !d.noflip;
    if (p.broken) { paintBroken(c, p, t, x, y, d, flip); return; }
    /* Wackeln (Boden, Drehpunkt unten), Schwingen (Decke: Aufhängung, Wand: Nagel oben) */
    const ang = (p.wob || 0) + (p.sw ? p.sw.a : 0), py = d.at === "w" && d.box ? d.box[1] + 3 : 0;
    if (p.shk > 0) x += Math.sin(t * 70 + p.s * 9) * 0.8 * Math.min(1, p.shk * 8);
    c.save(); c.translate(x, y); if (ang) { c.translate(0, py); c.rotate(ang); c.translate(0, -py); } if (flip) c.scale(-1, 1);
    cx0 = x; cy0 = y; cf0 = flip ? -1 : 1; curP = d.crit ? null : p; curFi = 0; curRot = ang; curPy = py;
    if (d.s) {
      const s = p.dspr || spriteOf(p.kind, p.v);
      if (d.breath) { const k = 1 + Math.sin(t * d.breath[1] + p.s * 7) * d.breath[0]; c.save(); c.scale(k, k); c.drawImage(s.cv, s.l, s.t, s.w, s.h); c.restore(); } else c.drawImage(s.cv, s.l, s.t, s.w, s.h);
      /* kurzer Aufhellblitz beim Treffer */
      if (p.fla > 0) { c.globalCompositeOperation = "lighter"; c.globalAlpha = Math.min(0.45, p.fla * 5); c.drawImage(s.cv, s.l, s.t, s.w, s.h); c.globalAlpha = 1; c.globalCompositeOperation = "source-over"; }
    }
    if (d.fls) for (let i = 0; i < d.fls.length; i++) { const q = d.fls[i]; if (q[3] != null && q[3] !== p.v) { curFi++; continue; } fl(q[0], q[1], q[2], p.s * 40 + i * 1.7, q[4]); }
    if (d.holeR) hole(d.holeR[0], d.holeR[1], d.holeR[2], d.holeR[3]);
    if (d.a && !(simple() && d.crit && !d.must)) d.a(c, p, t);
    c.restore(); curP = null; curRot = 0; curPy = 0;
  }
  const dwp0 = Z.drawWorldProps;
  Z.drawWorldProps = function (c, t) {
    FQn = 0; GQn = 0; HQn = 0; TT = t;
    if (WARM.length && Z.level === lvRef) warmTick();
    if (Z.level === lvRef && props.length) {
      const cam = Z.cam, sa = Z.sightAt;
      if (!simple()) try { drawLayerBack(c, t); } catch (e) { console.error(e); }
      for (const p of props) {
        const x = p.x * T + 8, y = p.L === 2 || p.L === 4 ? p.y * T : (p.y + 1) * T;
        if (x < cam.x - 70 || x > cam.x + cam.w + 70 || y < cam.y - 70 || y > cam.y + cam.h + 120) continue;
        cvis = sa ? Math.min(1, sa(x, y - 10) * 1.4) : 1;
        paint(c, p, t, x, y);
      }
      if (!simple()) try { drawLayerFront(c, t); } catch (e) { console.error(e); }
    }
    if (dwp0) dwp0.apply(this, arguments);
  };

  /* ======================= Gemalter Vordergrund =======================
     Dunkle Silhouetten mit Binnenzeichnung, Randlicht von oben links (Farbe je Gebiet) und weicher Unschärfe.
     Einmal pro Art/Variante/Gebiet gemalt; Lichter (Laternen, Kerzen, Esse) flackern über gecachte Glow-Sprites. */
  const FGK = {
    castle: ["saeule", "laterne", "ast", "efeu", "zaun"], ramparts: ["saeule", "banner", "laterne", "zinne", "speere"],
    spires: ["bogen", "banner", "wasserspeier", "zinne"], storm: ["bogen", "kraehe", "dornen", "toterbaum"],
    halls: ["vorhang", "kronleuchter", "saeule", "ruestung", "kandelaber"], cellar: ["fass", "spinnwebe", "pfeiler", "schinken", "weinregal"],
    dungeon: ["gitter", "kette", "kaefig", "pranger", "haken"], harbour: ["tau", "netz", "mast", "poller", "hafenlaterne"],
    belltower: ["zahnrad", "seil", "glocke", "balken"], forge: ["kette", "esse", "blasebalg", "werkzeug"],
    chasm: ["netzfaden", "pilz", "zapfen", "kokon", "spinne"], lake: ["schilf", "wurzel", "zapfen", "algenvorhang", "kuosaeule"],
    embercity: ["schlot", "laterne", "rohr", "kran"]
  };
  const RIM = { castle: "#ffc896", ramparts: "#ffb48a", spires: "#ff9a6a", storm: "#c8e69a", halls: "#ffb070", cellar: "#ffbc7a", dungeon: "#c8d896", harbour: "#e8d2b4", belltower: "#ffd2a0", forge: "#ff9040", chasm: "#d29aff", lake: "#9ae6aa", embercity: "#ff8a3a" };
  const D0 = "#07050a", D1 = "#0f0a0c", D2 = "#171012", D3 = "#211818", D4 = "#2c201e";
  function blatt(c, x, y, s, a, col) { c.save(); c.translate(x, y); c.rotate(a); c.fillStyle = col; c.beginPath(); c.moveTo(0, 0); c.bezierCurveTo(-s, -s * 0.4, -s * 0.9, -s * 1.3, 0, -s * 1.6); c.bezierCurveTo(s * 0.9, -s * 1.3, s, -s * 0.4, 0, 0); c.fill(); c.strokeStyle = "rgba(255,255,255,.04)"; c.lineWidth = 0.5; c.beginPath(); c.moveTo(0, 0); c.lineTo(0, -s * 1.4); c.stroke(); c.restore(); }
  function ranke(c, R, x0, y0, len, dir, col, lcol) {
    let x = x0, y = y0; c.strokeStyle = col; c.lineWidth = 1.6;
    c.beginPath(); c.moveTo(x, y); const pts = [];
    for (let k = 0; k < len; k += 6) { x += Math.sin(k * 0.08 + R() * 0.6) * 4; y += dir * 6; c.lineTo(x, y); pts.push([x, y]); }
    c.stroke();
    for (const [px, py] of pts) if (R() < 0.8) blatt(c, px + (R() - 0.5) * 6, py, 4 + R() * 4, (R() - 0.5) * 2.6 + (dir > 0 ? PI : 0), R() < 0.5 ? lcol : sh(lcol, 0.15));
  }
  function glied(c, x, y, w, h, rot, lw) { c.save(); c.translate(x, y); c.rotate(rot); c.lineWidth = lw; c.beginPath(); c.ellipse(0, 0, w, h, 0, 0, TAU); c.stroke(); c.restore(); }
  function zahnradForm(c, x, y, r, n, th) { c.beginPath(); for (let q = 0; q < n; q++) { const a = q / n * TAU, da = TAU / n; c.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); c.lineTo(x + Math.cos(a + da * 0.12) * (r + th), y + Math.sin(a + da * 0.12) * (r + th)); c.lineTo(x + Math.cos(a + da * 0.42) * (r + th), y + Math.sin(a + da * 0.42) * (r + th)); c.lineTo(x + Math.cos(a + da * 0.54) * r, y + Math.sin(a + da * 0.54) * r); } c.closePath(); }
  function laternenKopf(c, x, y, s) {
    /* Dach mit Spitze, Gitterkäfig, Bodenschale */
    P(c, D2, [x - 12 * s, y, x, y - 12 * s, x + 12 * s, y]); B(c, x - 13 * s, y - 1 * s, 26 * s, 3 * s, D3); E(c, x, y - 14 * s, 2.5 * s, 2.5 * s, D3);
    c.strokeStyle = D2; c.lineWidth = 1.5 * s; c.beginPath(); c.arc(x, y - 18 * s, 3 * s, 0, TAU); c.stroke();
    B(c, x - 10 * s, y + 2 * s, 20 * s, 30 * s, D1);
    P(c, D2, [x - 11 * s, y + 32 * s, x + 11 * s, y + 32 * s, x + 6 * s, y + 38 * s, x - 6 * s, y + 38 * s]); E(c, x, y + 40 * s, 1.8 * s, 2.4 * s, D2);
  }
  function laternenGlas(c, x, y, s) {
    c.fillStyle = lg(c, 0, y + 4 * s, 0, y + 31 * s, ["rgba(255,190,100,.55)", "rgba(255,220,150,.9)", "rgba(255,160,70,.6)"]); c.fillRect(x - 8 * s, y + 4 * s, 16 * s, 27 * s);
    E(c, x, y + 20 * s, 2.4 * s, 5 * s, "rgba(255,250,220,.95)");
    c.fillStyle = D1; for (const gx of [-8.6, -0.9, 7.2]) c.fillRect(x + gx * s, y + 3 * s, 1.6 * s, 29 * s); c.fillRect(x - 9 * s, y + 16 * s, 18 * s, 1.4 * s);
    c.strokeStyle = D2; c.lineWidth = 0.6 * s; for (let k = -6; k <= 6; k += 3) { c.beginPath(); c.moveTo(x + k * s, y + 4 * s); c.lineTo(x + k * s + 3 * s, y + 31 * s); c.stroke(); }
  }
  const FGD = {
    saeule: { W: 160, H: 260, paint(c, R, W, H) {
      const cx = W / 2, w = 46;
      c.fillStyle = lg(c, cx - w / 2, 0, cx + w / 2, 0, [D4, D2, D1, D0]); c.fillRect(cx - w / 2, 38, w, H);
      for (let k = 0; k < 6; k++) { const x = cx - w / 2 + 5 + k * 7; B(c, x, 40, 2.6, H, "rgba(0,0,0,.4)"); B(c, x + 2.6, 40, 1, H, "rgba(255,230,200,.05)"); }
      B(c, cx - w / 2 - 3, 33, w + 6, 6, D2); E(c, cx, 28, w / 2 + 9, 6, D3); B(c, cx - w / 2 - 14, 13, w + 28, 9, D3); B(c, cx - w / 2 - 16, 9, w + 32, 5, D2);
      c.strokeStyle = D4; c.lineWidth = 2; for (const sd of [-1, 1]) { c.beginPath(); for (let a = 0; a < 12; a += 0.3) { const r = 6.5 - a * 0.45, px = cx + sd * (w / 2 + 9) + Math.cos(a * sd) * r, py = 26 + Math.sin(a * sd) * r; a ? c.lineTo(px, py) : c.moveTo(px, py); } c.stroke(); }
      for (let k = 0; k < 4; k++) { const y = 90 + k * 52; B(c, cx - w / 2, y, w, 1.4, "rgba(0,0,0,.55)"); B(c, cx - w / 2, y + 1.4, w, 0.8, "rgba(255,230,200,.04)"); }
      Ln(c, "rgba(0,0,0,.6)", 1, [cx + 8, 120, cx + 4, 132, cx + 10, 140, cx + 6, 156]);
      ranke(c, R, cx - 18 + R() * 8, H, 200 + R() * 40, -1, "#0a0e08", "#0d150b");
      if (R() < 0.6) ranke(c, R, cx + 16, H, 120, -1, "#0a0e08", "#101a0c");
    } },
    pfeiler: { W: 150, H: 260, paint(c, R, W, H) {
      const cx = W / 2, w = 54;
      for (let y = 0; y < H; y += 22) { const off = ((y / 22) % 2) * 8; for (let x = cx - w / 2 - off; x < cx + w / 2; x += 26) { const x0 = Math.max(cx - w / 2, x), x1 = Math.min(cx + w / 2, x + 25); c.fillStyle = lg(c, x0, y, x1, y + 21, [D3, D2, D1]); c.fillRect(x0, y, x1 - x0, 21); B(c, x0, y, x1 - x0, 1, "rgba(255,220,180,.05)"); } }
      for (let k = 0; k < 40; k++) E(c, cx - w / 2 + R() * w, R() * H, 1 + R() * 2, 0.8 + R(), "rgba(0,0,0,.25)");
      for (let k = 0; k < 6; k++) { const y = 40 + R() * 200; E(c, cx - w / 2 + 4, y, 6, 3 + R() * 4, "#0b1009"); }
      c.strokeStyle = "rgba(40,50,30,.4)"; c.lineWidth = 1; for (let k = 0; k < 3; k++) { const x = cx - 10 + k * 12; c.beginPath(); c.moveTo(x, 0); c.lineTo(x + 2, 30 + R() * 50); c.stroke(); }
    } },
    laterne: { W: 80, H: 200, top: true, swing: 0.05, lights: [[40, 124, 46]], paint(c, R, W, H) {
      c.strokeStyle = D2; for (let y = 0; y < 98; y += 7) glied(c, W / 2, y + 3, y / 7 % 2 ? 1.6 : 3, y / 7 % 2 ? 4.5 : 4, 0, 1.8);
      laternenKopf(c, W / 2, 104, 1);
    }, em(c, R, W, H) { laternenGlas(c, W / 2, 104, 1); } },
    hafenlaterne: { W: 90, H: 260, lights: [[54, 64, 50]], paint(c, R, W, H) {
      c.fillStyle = lg(c, 18, 0, 32, 0, [D3, D1]); c.fillRect(18, 30, 14, H);
      for (let y = 60; y < H; y += 30) Ln(c, "rgba(0,0,0,.5)", 1, [18, y, 32, y + 4]);
      B(c, 14, 28, 48, 6, D2); Ln(c, D2, 3, [24, 60, 48, 31]); Ln(c, D2, 2, [54, 34, 54, 42]);
      laternenKopf(c, 54, 46, 0.62);
      seil(c, [18, 140, 34, 150, 18, 160, 34, 170], D3, 3);
    }, em(c, R, W, H) { laternenGlas(c, 54, 46, 0.62); } },
    ast: { W: 160, H: 200, top: true, swing: 0.012, paint(c, R, W, H) {
      c.lineCap = "round"; c.strokeStyle = D1;
      c.lineWidth = 12; c.beginPath(); c.moveTo(-10, 18); c.quadraticCurveTo(60, 38, 140, 88); c.stroke();
      c.lineWidth = 6; c.beginPath(); c.moveTo(70, 50); c.quadraticCurveTo(92, 82, 80, 124); c.stroke(); c.beginPath(); c.moveTo(110, 70); c.quadraticCurveTo(140, 68, 156, 48); c.stroke();
      c.lineWidth = 2.5; c.beginPath(); c.moveTo(40, 32); c.quadraticCurveTo(44, 60, 30, 80); c.stroke();
      c.strokeStyle = "rgba(255,230,200,.04)"; c.lineWidth = 1; c.beginPath(); c.moveTo(0, 14); c.quadraticCurveTo(60, 32, 138, 82); c.stroke();
      for (let i = 0; i < 160; i++) { const u = R(), x = -10 + u * 160 + (R() - 0.5) * 34, y = 22 + u * 70 + (R() - 0.5) * 44; blatt(c, x, y, 4 + R() * 4, R() * 6, R() < 0.5 ? "#0c120a" : "#121a0e"); }
    } },
    efeu: { W: 170, H: 220, top: true, paint(c, R, W, H) {
      c.fillStyle = lg(c, 0, 0, 0, 22, [D3, D1]); c.fillRect(0, 0, W, 22); for (let x = 0; x < W; x += 34) B(c, x, 0, 1.2, 22, "rgba(0,0,0,.5)"); B(c, 0, 20, W, 2, "rgba(255,230,200,.06)");
      for (let k = 0; k < 9; k++) ranke(c, R, 8 + k * 19 + R() * 6, 18, 40 + R() * 150, 1, "#090d07", k % 2 ? "#0c140a" : "#0f180c");
    } },
    zaun: { W: 180, H: 200, paint(c, R, W, H) {
      for (const x of [30, 140]) { c.fillStyle = lg(c, x - 6, 0, x + 6, 0, [D3, D1]); c.fillRect(x - 6, 70, 12, H); P(c, D2, [x - 6, 70, x, 60, x + 6, 70]); for (let y = 90; y < H; y += 24) Ln(c, "rgba(0,0,0,.5)", 0.8, [x - 5, y, x + 4, y + 3]); }
      for (const y of [92, 140]) { c.save(); c.translate(0, y); c.rotate(-0.03); c.fillStyle = lg(c, 0, -4, 0, 4, [D3, D1]); c.fillRect(10, -4, 160, 8); c.restore(); }
      E(c, 140, 52, 9, 7, D2); B(c, 132, 52, 16, 4, D1);
      c.strokeStyle = "#0b1009"; c.lineWidth = 1.6; for (let k = 0; k < 40; k++) { const x = R() * W, h = 30 + R() * 70; c.beginPath(); c.moveTo(x, H); c.quadraticCurveTo(x + (R() - 0.5) * 20, H - h * 0.6, x + (R() - 0.5) * 30, H - h); c.stroke(); }
      for (let k = 0; k < 5; k++) { const x = 20 + R() * 140, y = H - 60 - R() * 40; E(c, x, y, 3, 3, "#141010"); }
    } },
    banner: { W: 120, H: 230, top: true, swing: 0.02, paint(c, R, W, H) {
      const cx = W / 2; Ln(c, D2, 1.5, [cx - 30, 0, cx - 30, 20]); Ln(c, D2, 1.5, [cx + 30, 0, cx + 30, 20]);
      c.fillStyle = lg(c, 0, 18, 0, 25, [D3, D1]); c.fillRect(cx - 40, 18, 80, 6); E(c, cx - 41, 21, 4, 4, D3); E(c, cx + 41, 21, 4, 4, D3);
      c.beginPath(); c.moveTo(cx - 32, 24); c.lineTo(cx + 32, 24); c.lineTo(cx + 32, 170); for (let k = 0; k <= 8; k++) c.lineTo(cx + 32 - k * 8, 170 + (k % 2 ? -12 : 0) - (k === 4 ? 16 : 0) + R() * 6); c.closePath();
      const g = c.createLinearGradient(cx - 32, 0, cx + 32, 0); for (let k = 0; k <= 8; k++) g.addColorStop(k / 8, k % 2 ? "#120607" : "#1e0a0c"); c.fillStyle = g; c.fill();
      c.strokeStyle = "#2a1a10"; c.lineWidth = 2; c.strokeRect(cx - 27, 30, 54, 120);
      c.fillStyle = "#2a1c10"; c.beginPath(); c.arc(cx, 80, 12, 0, TAU); c.fill(); for (let k = 0; k < 12; k++) { const a = k / 12 * TAU; P(c, "#2a1c10", [cx + Math.cos(a) * 12, 80 + Math.sin(a) * 12, cx + Math.cos(a + 0.13) * 21, 80 + Math.sin(a + 0.13) * 21, cx + Math.cos(a + 0.26) * 12, 80 + Math.sin(a + 0.26) * 12]); }
      E(c, cx, 80, 7, 7, "#120607");
      if (R() < 0.7) { c.globalCompositeOperation = "destination-out"; E(c, cx + 14, 130, 6, 9, "#000"); c.globalCompositeOperation = "source-over"; }
    } },
    zinne: { W: 210, H: 210, paint(c, R, W, H) {
      const top = 80;
      const blk = (x0, y0, x1, y1) => { for (let y = y0; y < y1; y += 18) { const off = ((y - y0) / 18) % 2 ? 14 : 0; for (let x = x0 - off; x < x1; x += 28) { const a = Math.max(x0, x), b = Math.min(x1, x + 27); if (b <= a) continue; c.fillStyle = lg(c, a, y, b, y + 17, [D4, D2, D1]); c.fillRect(a, y, b - a, 17); B(c, a, y, b - a, 0.8, "rgba(255,220,180,.06)"); } } };
      blk(0, top, W, H); blk(10, top - 46, 80, top); blk(130, top - 46, 200, top);
      B(c, 5, top - 50, 80, 6, D3); B(c, 125, top - 50, 80, 6, D3);
      B(c, 40, top - 34, 6, 26, D0); B(c, 37, top - 24, 12, 4, D0);
      for (let k = 0; k < 10; k++) E(c, R() * W, top + R() * 4, 6 + R() * 8, 2 + R() * 2, "#0b1209");
    } },
    speere: { W: 140, H: 240, paint(c, R, W, H) {
      wood(c, 10, 120, 120, 8, "#1a1210", R, false); wood(c, 16, 120, 8, H, "#140e0c", R, true); wood(c, 116, 120, 8, H, "#140e0c", R, true);
      for (let k = 0; k < 6; k++) { const x = 26 + k * 16, a = (k - 2.5) * 0.04; c.save(); c.translate(x, H); c.rotate(a); B(c, -1.5, -220, 3, 220, D2); P(c, D3, [-5, -220, 0, -244, 5, -220, 0, -214]); B(c, -4, -212, 8, 2, D3); c.restore(); }
    } },
    bogen: { W: 180, H: 260, paint(c, R, W, H) {
      const pw = 32, r0 = W / 2 - pw, cy = 70;
      for (const x0 of [0, W - pw]) for (let y = cy; y < H; y += 24) { c.fillStyle = lg(c, x0, y, x0 + pw, y + 23, [D4, D2, D1]); c.fillRect(x0, y, pw, 23); B(c, x0, y, pw, 0.8, "rgba(255,220,180,.06)"); }
      for (let k = 0; k < 11; k++) { const a0 = PI + k / 11 * PI, a1 = PI + (k + 1) / 11 * PI - 0.02; c.beginPath(); c.arc(W / 2, cy, r0 + pw, a0, a1); c.arc(W / 2, cy, r0, a1, a0, true); c.closePath(); c.fillStyle = k === 5 ? D4 : k % 2 ? D2 : D3; c.fill(); }
      B(c, 0, 0, W, cy - r0 - pw + 2, D1); c.beginPath(); c.moveTo(0, 0); c.lineTo(W, 0); c.lineTo(W, cy); c.lineTo(W - pw, cy); c.arc(W / 2, cy, r0 + pw, 0, PI, true); c.lineTo(0, cy); c.closePath(); c.fillStyle = D1; c.fill();
      B(c, -2, cy - 4, pw + 6, 6, D3); B(c, W - pw - 4, cy - 4, pw + 6, 6, D3);
      for (let k = 0; k < 4; k++) ranke(c, R, 10 + R() * (W - 20), 10, 30 + R() * 70, 1, "#090d07", "#0d140a");
    } },
    wasserspeier: { W: 160, H: 220, paint(c, R, W, H) {
      c.fillStyle = lg(c, 0, 130, 0, H, [D3, D1]); c.fillRect(0, 130, W, H); B(c, -4, 124, W + 8, 8, D3);
      const x = 80, y = 124;
      P(c, D2, [x - 26, y, x - 22, y - 30, x - 8, y - 46, x + 12, y - 44, x + 28, y - 24, x + 30, y]);
      P(c, D1, [x - 18, y - 34, x - 60, y - 80, x - 50, y - 50, x - 70, y - 54, x - 40, y - 30]); P(c, D1, [x + 18, y - 34, x + 54, y - 86, x + 48, y - 56, x + 66, y - 58, x + 30, y - 30]);
      E(c, x + 10, y - 52, 13, 11, D2); P(c, D2, [x + 18, y - 50, x + 38, y - 44, x + 20, y - 40]);
      P(c, D3, [x + 2, y - 60, x - 4, y - 76, x + 8, y - 62]); P(c, D3, [x + 14, y - 62, x + 18, y - 78, x + 20, y - 60]);
      B(c, x - 22, y - 8, 8, 8, D3); B(c, x + 18, y - 8, 8, 8, D3);
    }, em(c, R, W, H) { E(c, 96, 74, 2, 1.4, "rgba(255,120,60,.7)"); } },
    kraehe: { W: 160, H: 180, paint(c, R, W, H) {
      c.lineCap = "round"; c.strokeStyle = D1; c.lineWidth = 12; c.beginPath(); c.moveTo(-10, 128); c.quadraticCurveTo(80, 118, 170, 132); c.stroke();
      c.lineWidth = 4; c.beginPath(); c.moveTo(120, 124); c.quadraticCurveTo(136, 100, 150, 96); c.stroke();
      E(c, 70, 104, 13, 9, D2, -0.2); E(c, 84, 92, 7, 6.5, D2); P(c, D3, [89, 90, 102, 94, 89, 96]); P(c, D2, [58, 104, 38, 114, 44, 108, 36, 110, 58, 110]);
      P(c, D1, [62, 100, 76, 98, 80, 108, 62, 110]); Ln(c, D3, 1.4, [66, 112, 64, 122]); Ln(c, D3, 1.4, [74, 112, 76, 122]);
    }, em(c, R, W, H) { E(c, 86, 90, 1.2, 1.2, "rgba(255,200,120,.6)"); } },
    dornen: { W: 200, H: 200, paint(c, R, W, H) {
      c.lineCap = "round";
      for (let k = 0; k < 7; k++) { const x0 = R() * W, h = 60 + R() * 120, x1 = x0 + (R() - 0.5) * 120; c.strokeStyle = k % 2 ? D1 : D2; c.lineWidth = 3 + R() * 3; c.beginPath(); c.moveTo(x0, H); c.bezierCurveTo(x0, H - h, x1, H - h * 1.2, x1 + (R() - 0.5) * 30, H - h * 0.7); c.stroke();
        for (let q = 0; q < 10; q++) { const u = q / 10, px = x0 + (x1 - x0) * u * 0.8, py = H - h * u; const a = R() * TAU; P(c, D1, [px, py, px + Math.cos(a) * 8, py + Math.sin(a) * 8, px + Math.cos(a + 0.5) * 2, py + Math.sin(a + 0.5) * 2]); } }
      for (let k = 0; k < 14; k++) blatt(c, R() * W, H - R() * 120, 4 + R() * 3, R() * 6, "#0c1409");
    } },
    toterbaum: { W: 200, H: 260, paint(c, R, W, H) {
      c.lineCap = "round"; c.fillStyle = lg(c, 70, 0, 130, 0, [D3, D1, D0]); c.beginPath(); c.moveTo(60, H); c.quadraticCurveTo(84, 160, 88, 80); c.lineTo(112, 80); c.quadraticCurveTo(118, 160, 140, H); c.fill();
      const br = (x, y, a, l, w, d) => { if (d > 4 || l < 8) return; const x2 = x + Math.cos(a) * l, y2 = y + Math.sin(a) * l; c.strokeStyle = D1; c.lineWidth = w; c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo((x + x2) / 2 + (R() - 0.5) * 10, (y + y2) / 2, x2, y2); c.stroke(); br(x2, y2, a - 0.4 - R() * 0.3, l * 0.7, w * 0.6, d + 1); br(x2, y2, a + 0.3 + R() * 0.4, l * 0.65, w * 0.6, d + 1); };
      br(100, 84, -PI / 2 - 0.2, 46, 12, 0); br(96, 120, PI + 0.4, 50, 8, 1); br(110, 130, -0.3, 54, 8, 1);
      for (let k = 0; k < 6; k++) Ln(c, "rgba(0,0,0,.5)", 1, [80 + k * 7, H, 90 + k * 4, 100 + R() * 40]);
      E(c, 104, 170, 6, 9, D0);
    } },
    vorhang: { W: 170, H: 270, top: true, paint(c, R, W, H) {
      const g = c.createLinearGradient(0, 0, W, 0); for (let k = 0; k <= 12; k++) g.addColorStop(k / 12, k % 2 ? "#12060a" : "#220c10");
      c.fillStyle = g; c.beginPath(); c.moveTo(0, 0); c.lineTo(W * 0.92, 0); c.bezierCurveTo(W * 0.85, H * 0.25, W * 0.5, H * 0.42, W * 0.48, H * 0.52); c.bezierCurveTo(W * 0.56, H * 0.62, W * 0.8, H * 0.8, W * 0.85, H); c.lineTo(0, H); c.closePath(); c.fill();
      c.strokeStyle = "rgba(0,0,0,.4)"; c.lineWidth = 2; for (let k = 1; k < 7; k++) { const x = k * W * 0.11; c.beginPath(); c.moveTo(x, 20); c.quadraticCurveTo(x * 0.8 + 10, H * 0.5, x * 0.9, H); c.stroke(); }
      c.fillStyle = "#2a1408"; c.fillRect(0, 0, W, 26); for (let k = 0; k < 8; k++) { c.beginPath(); c.moveTo(k * 22, 26); c.quadraticCurveTo(k * 22 + 11, 42, k * 22 + 22, 26); c.fill(); }
      c.fillStyle = "#3a2410"; for (let x = 2; x < W; x += 3.4) c.fillRect(x, 26 + Math.abs(Math.sin(x / 22 * PI)) * 14, 1.2, 6);
      B(c, 0, 4, W, 3, "#3a2410");
      c.fillStyle = "#3a2410"; c.beginPath(); c.ellipse(W * 0.5, H * 0.52, 16, 5, -0.3, 0, TAU); c.fill(); E(c, W * 0.5 + 16, H * 0.54, 5, 5, "#3a2410"); P(c, "#3a2410", [W * 0.5 + 12, H * 0.55, W * 0.5 + 20, H * 0.55, W * 0.5 + 23, H * 0.55 + 22, W * 0.5 + 9, H * 0.55 + 22]);
      c.fillStyle = "#2a1408"; for (let k = 0; k < 6; k++) c.fillRect(W * 0.5 + 10 + k * 2.4, H * 0.55 + 20, 1, 8);
    } },
    kronleuchter: { W: 180, H: 160, top: true, swing: 0.025, lights: [[90, 70, 80]], paint(c, R, W, H) {
      c.strokeStyle = D2; for (let y = 0; y < 64; y += 7) glied(c, W / 2, y + 3, y / 7 % 2 ? 1.5 : 2.6, y / 7 % 2 ? 4 : 3.6, 0, 1.6);
      E(c, W / 2, 72, 6, 8, D3); E(c, W / 2, 96, 8, 6, D2); P(c, D2, [W / 2 - 3, 100, W / 2 + 3, 100, W / 2, 112]);
      c.strokeStyle = D2; c.lineWidth = 4; c.beginPath(); c.ellipse(W / 2, 88, 66, 10, 0, 0, PI); c.stroke(); c.lineWidth = 2; c.beginPath(); c.ellipse(W / 2, 88, 66, 10, 0, PI, TAU); c.stroke();
      for (let k = 0; k < 7; k++) { const a = PI - k / 6 * PI, x = W / 2 + Math.cos(a) * 66, y = 88 + Math.sin(a) * 10; Q(c, D2, 1.6, W / 2, 80, (x + W / 2) / 2, 70, x, y - 2); B(c, x - 3.5, y - 4, 7, 3, D3); B(c, x - 1.8, y - 14, 3.6, 10, "#2a221c"); P(c, D2, [x - 2, y + 2, x + 2, y + 2, x, y + 8]); }
    }, em(c, R, W, H) { for (let k = 0; k < 7; k++) { const a = PI - k / 6 * PI, x = W / 2 + Math.cos(a) * 66, y = 88 + Math.sin(a) * 10 - 16; E(c, x, y, 3.4, 5.4, "rgba(255,170,80,.65)"); E(c, x, y + 1, 1.6, 3, "rgba(255,245,210,.95)"); } } },
    ruestung: { W: 140, H: 260, paint(c, R, W, H) {
      const x = 70; B(c, x - 30, H - 14, 60, 14, D2);
      for (const sd of [-1, 1]) { P(c, D2, [x + sd * 6, H - 14, x + sd * 16, H - 14, x + sd * 15, 170, x + sd * 4, 170]); E(c, x + sd * 10, 196, 6, 5, D3); }
      P(c, D2, [x - 22, 172, x + 22, 172, x + 26, 158, x - 26, 158]);
      c.fillStyle = lg(c, x - 26, 0, x + 26, 0, [D4, D2, D0]); c.beginPath(); c.moveTo(x - 24, 92); c.lineTo(x + 24, 92); c.quadraticCurveTo(x + 26, 130, x + 18, 160); c.lineTo(x - 18, 160); c.quadraticCurveTo(x - 26, 130, x - 24, 92); c.fill();
      Ln(c, "rgba(255,230,200,.06)", 1.5, [x - 2, 96, x - 2, 156]);
      for (const sd of [-1, 1]) { E(c, x + sd * 30, 98, 14, 10, D3); for (let k = 0; k < 3; k++) E(c, x + sd * 32, 108 + k * 6, 11 - k, 4, D2); P(c, D2, [x + sd * 30, 110, x + sd * 40, 110, x + sd * 38, 160, x + sd * 30, 160]); E(c, x + sd * 35, 166, 6, 7, D3); }
      c.fillStyle = D3; c.beginPath(); c.moveTo(x - 14, 90); c.quadraticCurveTo(x - 16, 56, x, 52); c.quadraticCurveTo(x + 16, 56, x + 14, 90); c.fill();
      B(c, x - 12, 70, 24, 3, D0); for (let k = -9; k <= 9; k += 3) B(c, x + k, 74, 1, 8, D0);
      c.fillStyle = "#1e0a0a"; c.beginPath(); c.moveTo(x, 52); c.bezierCurveTo(x + 10, 30, x + 30, 30, x + 36, 50); c.bezierCurveTo(x + 24, 40, x + 12, 44, x + 4, 56); c.fill();
      B(c, x + 44, 10, 3.5, H - 20, D2); P(c, D3, [x + 46, 0, x + 38, 30, x + 46, 40, x + 62, 26, x + 50, 22]); P(c, D3, [x + 42, 26, x + 30, 18, x + 32, 34]);
      E(c, x + 38, 140, 5, 5, D3);
    } },
    kandelaber: { W: 120, H: 260, lights: [[60, 40, 60]], paint(c, R, W, H) {
      const x = 60; P(c, D2, [x - 22, H, x + 22, H, x + 6, H - 16, x - 6, H - 16]);
      c.fillStyle = lg(c, x - 4, 0, x + 4, 0, [D4, D1]); c.fillRect(x - 3, 60, 6, H - 76); for (const y of [90, 140, 200]) E(c, x, y, 6, 3, D3);
      c.strokeStyle = D2; c.lineWidth = 3; c.beginPath(); c.moveTo(x - 34, 54); c.quadraticCurveTo(x - 34, 72, x, 72); c.quadraticCurveTo(x + 34, 72, x + 34, 54); c.stroke();
      for (const dx of [-34, 0, 34]) { B(c, x + dx - 6, 52, 12, 4, D3); B(c, x + dx - 2.5, 36 - (dx ? 0 : 6), 5, 18 + (dx ? 0 : 6), "#2a221c"); }
    }, em(c, R, W, H) { for (const dx of [-34, 0, 34]) { const y = dx ? 32 : 26; E(c, 60 + dx, y, 3.4, 5.6, "rgba(255,170,80,.65)"); E(c, 60 + dx, y + 1, 1.6, 3, "rgba(255,245,210,.95)"); } } },
    fass: { W: 170, H: 260, paint(c, R, W, H) {
      wood(c, 0, H - 104, W, 6, "#140c0a", R, false);
      for (const [x, y, r] of [[46, H - 40, 36], [124, H - 40, 36], [85, H - 142, 36]]) {
        c.fillStyle = rg(c, x - 10, y - 10, r * 1.2, [D4, D2, D0]); c.beginPath(); c.ellipse(x, y, r * 0.88, r, 0, 0, TAU); c.fill();
        c.strokeStyle = "rgba(0,0,0,.5)"; c.lineWidth = 3; c.beginPath(); c.ellipse(x, y, r * 0.88 - 3, r - 3, 0, 0, TAU); c.stroke();
        c.lineWidth = 1; for (let k = -r + 8; k < r; k += 9) { c.beginPath(); c.moveTo(x - Math.sqrt(Math.max(0, r * r - k * k)) * 0.8, y + k); c.lineTo(x + Math.sqrt(Math.max(0, r * r - k * k)) * 0.8, y + k); c.stroke(); }
        E(c, x, y + r * 0.4, 3, 3, D0); c.strokeStyle = "rgba(255,220,180,.05)"; c.lineWidth = 2; c.beginPath(); c.ellipse(x, y, r * 0.8, r * 0.9, 0, PI * 1.1, PI * 1.6); c.stroke();
      }
    } },
    spinnwebe: { W: 170, H: 170, top: true, paint(c, R, W, H) {
      c.strokeStyle = "rgba(230,222,236,.26)"; c.lineWidth = 0.9; for (let k = 0; k < 10; k++) { const a = k / 9 * PI / 2; c.beginPath(); c.moveTo(0, 0); c.lineTo(Math.cos(a) * 165, Math.sin(a) * 165); c.stroke(); }
      for (let r = 14; r < 165; r += 12 + r * 0.06) { c.beginPath(); for (let k = 0; k <= 9; k++) { const a = k / 9 * PI / 2, px = Math.cos(a) * r, py = Math.sin(a) * r; if (!k) c.moveTo(px, py); else { const am = (k - 0.5) / 9 * PI / 2; c.quadraticCurveTo(Math.cos(am) * r * 0.9, Math.sin(am) * r * 0.9, px, py); } } c.stroke(); }
      for (let k = 0; k < 4; k++) { c.beginPath(); c.moveTo(60 + R() * 60, 30 + R() * 60); c.quadraticCurveTo(80 + R() * 40, 100, 70 + R() * 50, 150); c.stroke(); }
      E(c, 64, 52, 5, 6, D2); E(c, 64, 44, 3, 3, D2); c.strokeStyle = D2; c.lineWidth = 1.2; for (let k = 0; k < 4; k++) for (const sd of [-1, 1]) { c.beginPath(); c.moveTo(64, 48); c.quadraticCurveTo(64 + sd * 8, 40 + k * 4, 64 + sd * 12, 46 + k * 5); c.stroke(); }
    } },
    schinken: { W: 180, H: 170, top: true, swing: 0.015, paint(c, R, W, H) {
      wood(c, 0, 8, W, 10, "#150d0a", R, false); B(c, 0, 18, W, 2, "rgba(0,0,0,.5)");
      for (let k = 0; k < 6; k++) { const x = 14 + k * 28 + R() * 6, l = 18 + R() * 24; Ln(c, D2, 1.2, [x, 18, x, 18 + l]); c.strokeStyle = D2; c.lineWidth = 1.5; c.beginPath(); c.arc(x, 18 + l + 3, 3, PI * 1.5, PI * 3.2); c.stroke();
        const y = 18 + l + 6;
        if (k % 3 === 0) { c.fillStyle = lg(c, x - 12, 0, x + 12, 0, ["#2a1410", "#1a0a08", "#0e0606"]); c.beginPath(); c.moveTo(x - 4, y); c.bezierCurveTo(x - 18, y + 20, x - 14, y + 56, x, y + 60); c.bezierCurveTo(x + 14, y + 56, x + 16, y + 20, x + 4, y); c.fill(); B(c, x - 3, y - 4, 6, 6, D3); E(c, x - 4, y + 36, 3, 8, "rgba(255,200,160,.05)"); }
        else if (k % 3 === 1) { for (let q = 0; q < 4; q++) { const sx = x - 9 + q * 6; Ln(c, D2, 0.8, [x, y, sx, y + 4]); E(c, sx, y + 20, 3, 14, q % 2 ? "#1e0c0a" : "#140806"); } }
        else { for (let q = 0; q < 7; q++) E(c, x + (q % 2 ? 4 : -4), y + 6 + q * 6, 5, 4.5, "#1c1614"); }
      }
    } },
    weinregal: { W: 180, H: 230, paint(c, R, W, H) {
      wood(c, 0, 40, 8, H, "#140c0a", R, true); wood(c, W - 8, 40, 8, H, "#140c0a", R, true); wood(c, 0, 36, W, 8, "#1a100c", R, false);
      c.strokeStyle = "#160e0b"; c.lineWidth = 4; for (let k = -6; k < 10; k++) { c.beginPath(); c.moveTo(8 + k * 24, 44); c.lineTo(8 + k * 24 + 190, H + 20); c.stroke(); c.beginPath(); c.moveTo(W - 8 - k * 24, 44); c.lineTo(W - 8 - k * 24 - 190, H + 20); c.stroke(); }
      for (let r = 0; r < 7; r++) for (let q = 0; q < 7; q++) { const x = 20 + q * 24 + (r % 2) * 12, y = 66 + r * 24; if (x > W - 14 || R() < 0.2) continue; E(c, x, y, 6, 6, "#0c0a08"); E(c, x, y, 2.6, 2.6, R() < 0.5 ? "#14100a" : "#1a0c0c"); E(c, x - 2, y - 2, 1.4, 1.4, "rgba(255,220,180,.07)"); }
    } },
    gitter: { W: 170, H: 260, paint(c, R, W, H) {
      const y0 = H * 0.36; c.fillStyle = lg(c, 0, y0, 0, y0 + 10, [D4, D1]); c.fillRect(20, y0, W - 40, 10); c.fillRect(20, y0 + 80, W - 40, 7);
      for (let x = 30, k = 0; x < W - 30; x += 18, k++) { c.fillStyle = lg(c, x, 0, x + 6, 0, [D4, D2, D0]); if (k === 3) { c.beginPath(); c.moveTo(x, y0); c.quadraticCurveTo(x + 14, y0 + 60, x, H); c.lineTo(x + 6, H); c.quadraticCurveTo(x + 20, y0 + 60, x + 6, y0); c.fill(); } else c.fillRect(x, y0 - 14, 6, H); E(c, x + 3, y0 - 14, 4, 3, D3); }
      for (let x = 30; x < W - 30; x += 18) { rivet(c, x + 3, y0 + 5, 1.6); rivet(c, x + 3, y0 + 83, 1.4); }
      B(c, 70, y0 + 96, 22, 18, D3); c.strokeStyle = D3; c.lineWidth = 3; c.beginPath(); c.arc(81, y0 + 96, 7, PI, 0); c.stroke(); B(c, 79, y0 + 102, 4, 6, D0);
    } },
    kette: { W: 70, H: 260, top: true, swing: 0.03, paint(c, R, W, H) {
      c.strokeStyle = D2; for (let y = 0; y < 220; y += 13) { const x = W / 2 + Math.sin(y * 0.02) * 4, o = (y / 13) % 2; glied(c, x, y, o ? 2.5 : 5.5, o ? 7.5 : 7, 0, 3.6); if (!o) { c.strokeStyle = "rgba(255,220,180,.06)"; glied(c, x - 1, y - 1, 4.5, 6, 0, 1); c.strokeStyle = D2; } }
      c.lineWidth = 5; c.beginPath(); c.arc(W / 2, 232, 9, -0.2, PI * 1.05); c.stroke(); P(c, D2, [W / 2 - 9, 230, W / 2 - 14, 224, W / 2 - 7, 226]);
    } },
    kaefig: { W: 140, H: 230, top: true, swing: 0.03, paint(c, R, W, H) {
      const cx = W / 2; c.strokeStyle = D2; for (let y = 0; y < 50; y += 9) glied(c, cx, y + 4, y / 9 % 2 ? 1.4 : 3, 5, 0, 2);
      c.strokeStyle = D2; c.lineWidth = 3; c.beginPath(); c.arc(cx, 58, 8, PI, 0); c.stroke();
      c.lineWidth = 5; c.beginPath(); c.ellipse(cx, 70, 42, 10, 0, 0, TAU); c.stroke(); c.beginPath(); c.ellipse(cx, 190, 42, 10, 0, 0, PI); c.stroke();
      for (let k = -40; k <= 40; k += 10) { c.lineWidth = 3; c.beginPath(); c.moveTo(cx + k, 74); c.lineTo(cx + k * 1.02, 194); c.stroke(); }
      c.strokeStyle = "#1c1814"; c.lineWidth = 3.5; c.lineCap = "round"; c.beginPath(); c.moveTo(cx + 10, 150); c.lineTo(cx + 46, 172); c.lineTo(cx + 54, 206); c.stroke();
      c.lineWidth = 1.6; for (let k = 0; k < 4; k++) { c.beginPath(); c.moveTo(cx + 54, 206); c.lineTo(cx + 50 + k * 3, 216); c.stroke(); }
      E(c, cx - 6, 176, 12, 10, "#1c1814"); E(c, cx - 10, 176, 3, 3, D0); E(c, cx - 1, 176, 3, 3, D0);
    } },
    pranger: { W: 170, H: 240, paint(c, R, W, H) {
      wood(c, 76, 40, 18, H, "#160e0b", R, true); wood(c, 10, 82, 150, 26, "#1c120e", R, false); B(c, 10, 94, 150, 1.6, "rgba(0,0,0,.6)");
      for (const [x, r] of [[40, 9], [85, 13], [130, 9]]) { E(c, x, 95, r, r, D0); }
      for (const x of [22, 150]) rivet(c, x, 88, 2);
      B(c, 70, 34, 30, 8, D3); P(c, D2, [76, H, 94, H, 110, H - 6, 60, H - 6]);
    } },
    haken: { W: 90, H: 240, top: true, swing: 0.04, paint(c, R, W, H) {
      c.strokeStyle = D2; for (let y = 0; y < 120; y += 9) glied(c, W / 2, y + 4, y / 9 % 2 ? 1.4 : 3, 5, 0, 2.2);
      c.lineWidth = 4; c.beginPath(); c.moveTo(W / 2, 128); c.lineTo(W / 2, 140); c.arc(W / 2 - 8, 140, 8, 0, PI * 0.9); c.stroke();
      c.fillStyle = lg(c, 20, 0, 70, 0, ["#1e1612", "#140e0c", "#0a0706"]); c.beginPath(); c.moveTo(W / 2 - 14, 150); c.bezierCurveTo(W / 2 - 34, 170, W / 2 - 30, 226, W / 2 - 6, 232); c.bezierCurveTo(W / 2 + 22, 230, W / 2 + 20, 176, W / 2 - 2, 150); c.fill(); Ln(c, D3, 2, [W / 2 - 16, 156, W / 2, 154]);
    } },
    tau: { W: 220, H: 200, top: true, paint(c, R, W, H) {
      seil(c, [0, 6, 50, 60, 110, 90, 170, 70, 220, 20], "#1c140e", 5);
      for (let k = 0; k < 5; k++) { const x = 30 + k * 40, y = k === 0 ? 40 : k === 4 ? 46 : 70 + (k === 2 ? 20 : 8); E(c, x, y, 6, 5, D3); seil(c, [x, y, x + 3, y + 30 + R() * 40], "#1a120c", 2.5); E(c, x + 3, y + 30 + 40 * R(), 3, 5, D3); }
    } },
    netz: { W: 180, H: 230, top: true, paint(c, R, W, H) {
      c.strokeStyle = "#140e0a"; c.lineWidth = 1.5;
      for (let k = 0; k < 13; k++) { c.beginPath(); c.moveTo(k * 14, 0); c.quadraticCurveTo(k * 14 + 18, 120, k * 14 - 8, 210 - Math.abs(k - 6) * 8); c.stroke(); }
      for (let k = 0; k < 13; k++) { c.beginPath(); c.moveTo(0, k * 16); c.quadraticCurveTo(90, k * 16 + 22, 180, k * 16 - 6); c.stroke(); }
      for (let k = 0; k < 5; k++) { const x = 20 + k * 34, y = 12 + R() * 10; E(c, x, y, 7, 5, D3); E(c, x - 2, y - 2, 2, 1.5, "rgba(255,220,180,.06)"); }
      for (let k = 0; k < 3; k++) { const x = 40 + R() * 100, y = 110 + R() * 70; P(c, D2, [x - 12, y, x + 8, y - 5, x + 14, y, x + 8, y + 5]); P(c, D2, [x - 12, y, x - 18, y - 5, x - 18, y + 5]); }
    } },
    mast: { W: 180, H: 260, paint(c, R, W, H) {
      c.fillStyle = lg(c, W / 2 - 8, 0, W / 2 + 8, 0, [D4, D2, D0]); c.fillRect(W / 2 - 7, 0, 14, H);
      for (const y of [80, 82, 160]) B(c, W / 2 - 9, y, 18, 4, D3);
      wood(c, 0, 40, W, 6, "#140e0a", R, false);
      c.strokeStyle = "#120c08"; c.lineWidth = 1.5; for (const x of [10, 40, 140, 170]) { c.beginPath(); c.moveTo(W / 2, 4); c.lineTo(x, H); c.stroke(); }
      c.lineWidth = 1; for (let y = 60; y < H; y += 14) { c.beginPath(); c.moveTo(W / 2 + 20 + (y - 60) * 0.25, y); c.lineTo(W / 2 + 46 + (y - 60) * 0.3, y); c.stroke(); }
      c.fillStyle = "#120c0a"; c.beginPath(); c.moveTo(8, 46); c.quadraticCurveTo(W / 2, 80, W - 8, 46); c.lineTo(W - 14, 56); c.quadraticCurveTo(W / 2, 92, 14, 56); c.fill();
    } },
    poller: { W: 150, H: 200, paint(c, R, W, H) {
      const x = 70; c.fillStyle = lg(c, x - 18, 0, x + 18, 0, [D4, D2, D0]); c.fillRect(x - 16, 90, 32, H); E(c, x, 90, 22, 8, D3); E(c, x, 84, 18, 10, D2); E(c, x - 6, 82, 6, 3, "rgba(255,220,180,.06)");
      for (let k = 0; k < 3; k++) { c.strokeStyle = "#1c140e"; c.lineWidth = 5; c.beginPath(); c.ellipse(x, 106 + k * 6, 20, 5, 0, 0, PI); c.stroke(); }
      seil(c, [x + 18, 112, x + 50, 130, W + 10, 120], "#1c140e", 5);
      for (let k = 0; k < 4; k++) { c.strokeStyle = "#160e0a"; c.lineWidth = 4; c.beginPath(); c.ellipse(x + 30, H - 12 - k * 5, 34 - k * 4, 8, 0, 0, TAU); c.stroke(); }
    } },
    zahnrad: { W: 220, H: 260, spin: 0.12, pivot: [110, 130], paint(c, R, W, H) {
      c.fillStyle = D1; zahnradForm(c, 110, 130, 78, 20, 12); c.fill();
      c.fillStyle = D2; c.beginPath(); c.arc(110, 130, 66, 0, TAU); c.fill();
      c.globalCompositeOperation = "destination-out"; for (let k = 0; k < 6; k++) { const a = k / 6 * TAU; c.beginPath(); c.moveTo(110 + Math.cos(a + 0.18) * 20, 130 + Math.sin(a + 0.18) * 20); c.arc(110, 130, 58, a + 0.2, a + TAU / 6 - 0.2); c.lineTo(110 + Math.cos(a + TAU / 6 - 0.18) * 20, 130 + Math.sin(a + TAU / 6 - 0.18) * 20); c.closePath(); c.fill(); } c.globalCompositeOperation = "source-over";
      E(c, 110, 130, 18, 18, D3); E(c, 110, 130, 7, 7, D0); for (let k = 0; k < 6; k++) { const a = k / 6 * TAU + 0.5; rivet(c, 110 + Math.cos(a) * 13, 130 + Math.sin(a) * 13, 1.6); }
    } },
    seil: { W: 170, H: 260, top: true, paint(c, R, W, H) {
      wood(c, 0, 0, W, 14, "#150d0a", R, false);
      E(c, 80, 30, 20, 20, D2); E(c, 80, 30, 14, 14, D1); E(c, 80, 30, 4, 4, D3); B(c, 76, 8, 8, 20, D2);
      seil(c, [60, 30, 60, H], "#1c140e", 4); seil(c, [100, 30, 102, H * 0.72], "#1c140e", 4);
      B(c, 90, H * 0.72, 24, 30, D2); B(c, 92, H * 0.72 + 4, 20, 2, D3); B(c, 92, H * 0.72 + 24, 20, 2, D3);
    } },
    glocke: { W: 170, H: 220, top: true, swing: 0.05, paint(c, R, W, H) {
      wood(c, 10, 0, W - 20, 18, "#150d0a", R, false); B(c, W / 2 - 4, 18, 8, 16, D3);
      const cx = W / 2; c.fillStyle = lg(c, cx - 50, 0, cx + 50, 0, [D4, D2, D1, D0]); c.beginPath(); c.moveTo(cx - 20, 34); c.bezierCurveTo(cx - 30, 36, cx - 30, 80, cx - 38, 120); c.quadraticCurveTo(cx - 44, 140, cx - 54, 146); c.lineTo(cx + 54, 146); c.quadraticCurveTo(cx + 44, 140, cx + 38, 120); c.bezierCurveTo(cx + 30, 80, cx + 30, 36, cx + 20, 34); c.closePath(); c.fill();
      for (const y of [60, 112, 136]) B(c, cx - 40, y, 80, 2, "rgba(0,0,0,.35)"); E(c, cx, 146, 54, 6, D0); E(c, cx + 8, 160, 8, 9, D2); Ln(c, D2, 3, [cx, 140, cx + 8, 154]);
    } },
    balken: { W: 220, H: 200, top: true, paint(c, R, W, H) {
      wood(c, 0, 20, W, 22, "#160e0b", R, false); c.save(); c.translate(20, 42); c.rotate(0.9); wood(c, 0, -7, 110, 14, "#140c0a", R, false); c.restore(); c.save(); c.translate(200, 42); c.rotate(PI - 0.9); wood(c, 0, -7, 110, 14, "#140c0a", R, false); c.restore();
      for (const x of [30, 110, 190]) { rivet(c, x, 31, 3); }
      seil(c, [140, 42, 142, 120], "#1c140e", 3); for (let k = 0; k < 4; k++) { c.strokeStyle = "#1c140e"; c.lineWidth = 3; c.beginPath(); c.ellipse(142, 130 + k * 4, 12, 4, 0, 0, TAU); c.stroke(); }
    } },
    esse: { W: 180, H: 260, lights: [[90, 196, 80]], paint(c, R, W, H) {
      for (let y = 140; y < H; y += 20) for (let x = 10 - ((y / 20) % 2) * 15; x < 170; x += 30) { c.fillStyle = lg(c, x, y, x + 29, y + 19, [D4, D2]); c.fillRect(Math.max(10, x), y, Math.min(29, 170 - Math.max(10, x)), 19); }
      c.fillStyle = D1; c.beginPath(); c.moveTo(4, 140); c.lineTo(176, 140); c.lineTo(130, 40); c.lineTo(50, 40); c.closePath(); c.fill(); B(c, 60, 0, 60, 42, D2); B(c, 0, 136, W, 8, D3);
      c.fillStyle = D0; c.beginPath(); c.moveTo(40, H); c.lineTo(40, 190); c.arc(90, 190, 50, PI, 0); c.lineTo(140, H); c.fill();
    }, em(c, R, W, H) {
      c.fillStyle = rg(c, 90, 230, 60, ["rgba(255,220,120,.95)", "rgba(255,120,40,.85)", "rgba(160,40,10,.4)", "rgba(80,20,10,0)"]); c.beginPath(); c.moveTo(44, H); c.lineTo(44, 192); c.arc(90, 192, 46, PI, 0); c.lineTo(136, H); c.fill();
      for (let k = 0; k < 18; k++) E(c, 52 + R() * 76, H - 20 - R() * 20, 4 + R() * 4, 3, R() < 0.5 ? "rgba(60,20,10,.7)" : "rgba(255,200,90,.6)");
    } },
    blasebalg: { W: 180, H: 200, paint(c, R, W, H) {
      wood(c, 20, H - 60, 8, 60, "#140c0a", R, true); wood(c, 150, H - 60, 8, 60, "#140c0a", R, true);
      c.fillStyle = "#1a100c"; c.beginPath(); c.moveTo(20, H - 70); c.quadraticCurveTo(80, H - 110, 150, H - 80); c.lineTo(160, H - 64); c.quadraticCurveTo(80, H - 50, 20, H - 60); c.fill();
      c.strokeStyle = "rgba(0,0,0,.5)"; c.lineWidth = 2; for (let k = 0; k < 5; k++) { c.beginPath(); c.moveTo(40 + k * 22, H - 88 + k * 3); c.lineTo(44 + k * 22, H - 60); c.stroke(); }
      wood(c, 10, H - 112, 140, 8, "#1c120e", R, false); wood(c, 10, H - 64, 140, 8, "#1c120e", R, false); B(c, 150, H - 74, 30, 8, D3); wood(c, -10, H - 140, 6, 40, "#140c0a", R, true);
    } },
    werkzeug: { W: 200, H: 200, top: true, paint(c, R, W, H) {
      Ln(c, D2, 1.5, [30, 0, 30, 30]); Ln(c, D2, 1.5, [170, 0, 170, 30]); wood(c, 10, 28, 180, 8, "#160e0b", R, false);
      for (let k = 0; k < 6; k++) { const x = 24 + k * 30, t2 = k % 3; Ln(c, D2, 2, [x, 36, x, 46]);
        if (t2 === 0) { B(c, x - 2, 46, 4, 70, "#1a120e"); B(c, x - 10, 46, 20, 12, D2); }
        else if (t2 === 1) { c.strokeStyle = D2; c.lineWidth = 3; c.beginPath(); c.moveTo(x - 3, 46); c.lineTo(x + 6, 120); c.moveTo(x + 3, 46); c.lineTo(x - 6, 120); c.stroke(); E(c, x, 56, 3, 3, D3); }
        else { B(c, x - 1.5, 46, 3, 60, D2); P(c, D2, [x - 6, 106, x + 6, 106, x, 130]); } }
    } },
    netzfaden: { W: 180, H: 260, top: true, paint(c, R, W, H) {
      c.strokeStyle = "rgba(230,222,236,.3)"; c.lineWidth = 1.1; for (let k = 0; k < 8; k++) { const x0 = R() * W, x1 = R() * W, x2 = R() * W; c.beginPath(); c.moveTo(x0, 0); c.quadraticCurveTo(x1, H * 0.5, x2, H); c.stroke(); for (let q = 0; q < 4; q++) { const u = R(); E(c, x0 + (x2 - x0) * u + (x1 - (x0 + x2) / 2) * 2 * u * (1 - u), H * u, 1.6, 2, "rgba(240,236,250,.35)"); } }
      for (let k = 0; k < 4; k++) { c.beginPath(); c.moveTo(R() * W, R() * 40); c.quadraticCurveTo(W / 2, 40 + R() * 60, R() * W, R() * 80); c.stroke(); }
    } },
    pilz: { W: 180, H: 260, paint(c, R, W, H) {
      for (let k = 0; k < 3; k++) { const x = 32 + k * 56 + R() * 10, h = 80 + R() * 110, r = 24 + R() * 14;
        c.fillStyle = lg(c, x - 8, 0, x + 8, 0, [D3, D1]); c.beginPath(); c.moveTo(x - 6, H); c.quadraticCurveTo(x - 10, H - h * 0.5, x - 5, H - h); c.lineTo(x + 5, H - h); c.quadraticCurveTo(x + 9, H - h * 0.5, x + 7, H); c.fill();
        E(c, x, H - h + 14, 8, 3, D2);
        c.fillStyle = lg(c, 0, H - h - r * 0.6, 0, H - h, [D4, D1]); c.beginPath(); c.ellipse(x, H - h, r, r * 0.6, 0, PI, 0); c.fill();
        c.strokeStyle = "rgba(0,0,0,.5)"; c.lineWidth = 0.8; for (let q = -r + 3; q < r; q += 3.5) { c.beginPath(); c.moveTo(x + q, H - h); c.lineTo(x + q * 0.3, H - h + 3); c.stroke(); } B(c, x - r, H - h - 1, r * 2, 2, D1); }
    }, em(c, R, W, H) { for (let k = 0; k < 14; k++) E(c, 20 + R() * 140, H - 90 - R() * 130, 1.6 + R() * 2, 1.2 + R(), "rgba(210,140,255,.55)"); } },
    zapfen: { W: 180, H: 260, top: true, paint(c, R, W, H) {
      B(c, 0, 0, W, 14, D1);
      for (let k = 0; k < 6; k++) { const x = 10 + k * 32 + R() * 10, w = 10 + R() * 14, h = 60 + R() * 170; c.fillStyle = lg(c, x - w, 0, x + w, 0, [D4, D2, D0]); c.beginPath(); c.moveTo(x - w, 0); c.quadraticCurveTo(x - w * 0.4, h * 0.5, x, h); c.quadraticCurveTo(x + w * 0.5, h * 0.5, x + w, 0); c.fill(); for (let q = 1; q < 4; q++) B(c, x - w * (1 - q / 4), h * q / 4 * 0.9, w * 2 * (1 - q / 4), 1, "rgba(0,0,0,.4)"); }
    } },
    kokon: { W: 90, H: 240, top: true, swing: 0.04, paint(c, R, W, H) {
      c.strokeStyle = "rgba(230,222,236,.35)"; c.lineWidth = 1.2; c.beginPath(); c.moveTo(W / 2, 0); c.lineTo(W / 2, 110); c.stroke(); c.beginPath(); c.moveTo(W / 2, 110); c.lineTo(10, 0); c.moveTo(W / 2, 110); c.lineTo(80, 0); c.stroke();
      c.fillStyle = lg(c, W / 2 - 20, 0, W / 2 + 20, 0, ["#2a2430", "#1a1620", "#0e0c12"]); c.beginPath(); c.ellipse(W / 2, 160, 18, 48, 0, 0, TAU); c.fill();
      c.strokeStyle = "rgba(255,255,255,.07)"; c.lineWidth = 1; for (let k = -40; k < 44; k += 6) { c.beginPath(); c.moveTo(W / 2 - 18, 160 + k); c.quadraticCurveTo(W / 2, 166 + k, W / 2 + 18, 156 + k); c.stroke(); }
      P(c, D2, [W / 2 - 6, 200, W / 2 + 4, 200, W / 2 + 2, 222, W / 2 + 10, 228, W / 2 - 6, 228]);
    } },
    spinne: { W: 140, H: 250, top: true, swing: 0.03, paint(c, R, W, H) {
      const cx = W / 2, cy = 190; c.strokeStyle = "rgba(230,222,236,.35)"; c.lineWidth = 1; c.beginPath(); c.moveTo(cx, 0); c.lineTo(cx, cy - 26); c.stroke();
      c.strokeStyle = D1; c.lineCap = "round"; for (const sd of [-1, 1]) for (let k = 0; k < 4; k++) { c.lineWidth = 4 - k * 0.4; c.beginPath(); c.moveTo(cx + sd * 6, cy - 4 + k * 4); c.quadraticCurveTo(cx + sd * (30 + k * 6), cy - 40 + k * 10, cx + sd * (44 + k * 4), cy + 10 + k * 14); c.stroke(); }
      E(c, cx, cy - 14, 15, 18, D2); E(c, cx, cy + 6, 10, 9, D1); E(c, cx - 5, cy - 22, 4, 6, "rgba(255,220,240,.05)");
      for (let k = 0; k < 3; k++) B(c, cx - 8, cy - 22 + k * 6, 16, 1.4, "rgba(0,0,0,.4)");
    }, em(c, R, W, H) { for (const [dx, dy] of [[-4, 10], [4, 10], [-2, 8], [2, 8]]) E(c, W / 2 + dx, 190 + dy, 1.2, 1.2, "rgba(255,90,90,.7)"); } },
    schilf: { W: 200, H: 260, paint(c, R, W, H) {
      c.lineCap = "round"; for (let k = 0; k < 18; k++) { const x = k * 11 + R() * 6, h = 110 + R() * 140, cur = (R() - 0.3) * 26; c.strokeStyle = k % 3 ? D1 : D2; c.lineWidth = 2.6; c.beginPath(); c.moveTo(x, H); c.quadraticCurveTo(x + cur * 0.3, H - h * 0.5, x + cur, H - h); c.stroke(); if (k % 3 === 0) { E(c, x + cur, H - h + 8, 3.6, 13, "#1c120c", cur * 0.01); Ln(c, D1, 1, [x + cur, H - h - 4, x + cur + 1, H - h - 14]); } }
      for (let k = 0; k < 10; k++) { const x = R() * W, h = 40 + R() * 80, a = (R() - 0.5) * 0.8; c.fillStyle = "#0a100a"; c.beginPath(); c.moveTo(x - 2, H); c.quadraticCurveTo(x + a * 40, H - h * 0.6, x + a * 70, H - h); c.quadraticCurveTo(x + a * 40 + 3, H - h * 0.6, x + 3, H); c.fill(); }
    } },
    wurzel: { W: 180, H: 240, top: true, paint(c, R, W, H) {
      B(c, 0, 0, W, 10, D1); c.lineCap = "round";
      for (let k = 0; k < 6; k++) { const x = 15 + k * 30; let w = 8 - k % 3; c.strokeStyle = k % 2 ? D1 : D2; c.lineWidth = w; c.beginPath(); c.moveTo(x, 0); c.bezierCurveTo(x + 22, 60, x - 22, 120, x + (R() - 0.5) * 40, 150 + R() * 80); c.stroke();
        c.lineWidth = w * 0.4; for (let q = 0; q < 3; q++) { const y = 30 + q * 40 + R() * 20; c.beginPath(); c.moveTo(x + Math.sin(y * 0.03) * 8, y); c.quadraticCurveTo(x + 20, y + 10, x + 16 + R() * 14, y + 24); c.stroke(); } }
    } },
    algenvorhang: { W: 180, H: 260, top: true, paint(c, R, W, H) {
      B(c, 0, 0, W, 8, D1);
      for (let k = 0; k < 12; k++) { const x = 8 + k * 15, h = 90 + R() * 160; c.fillStyle = k % 2 ? "#0a120c" : "#0e1810"; c.beginPath(); c.moveTo(x - 4, 0); for (let y = 0; y <= h; y += 10) c.lineTo(x - 4 + Math.sin(y * 0.06 + k) * 6 - (y / h) * 2, y); for (let y = h; y >= 0; y -= 10) c.lineTo(x + 4 + Math.sin(y * 0.06 + k) * 6 + (y / h) * 2, y); c.fill(); if (R() < 0.5) E(c, x + Math.sin(h * 0.06 + k) * 6, h * 0.6, 3, 3, D3); }
    } },
    kuosaeule: { W: 150, H: 260, paint(c, R, W, H) {
      const cx = W / 2; c.fillStyle = lg(c, cx - 24, 0, cx + 24, 0, [D4, D2, D0]); c.fillRect(cx - 22, 70, 44, H);
      for (let y = 100; y < H; y += 26) { B(c, cx - 22, y, 44, 2, "rgba(0,0,0,.5)"); for (let k = -16; k < 18; k += 8) { c.strokeStyle = "rgba(0,0,0,.45)"; c.lineWidth = 1; c.beginPath(); c.arc(cx + k, y + 13, 3, PI, 0); c.stroke(); } }
      c.fillStyle = D2; c.beginPath(); c.ellipse(cx, 50, 34, 28, 0, 0, TAU); c.fill(); P(c, D2, [cx - 30, 56, cx - 46, 72, cx - 20, 70]); P(c, D2, [cx + 30, 56, cx + 46, 72, cx + 20, 70]);
      P(c, D3, [cx - 10, 22, cx, 4, cx + 10, 22]); B(c, cx - 20, 64, 40, 3, D0); E(c, cx - 14, 46, 7, 7, D0); E(c, cx + 14, 46, 7, 7, D0);
      for (let k = 0; k < 5; k++) ranke(c, R, cx - 20 + R() * 40, H, 40 + R() * 80, -1, "#0a120c", "#0e1a10");
    }, em(c, R, W, H) { E(c, W / 2 - 14, 46, 3.4, 3.4, "rgba(170,255,150,.65)"); E(c, W / 2 + 14, 46, 3.4, 3.4, "rgba(170,255,150,.65)"); } },
    schlot: { W: 150, H: 260, lights: [[63, 120, 50]], paint(c, R, W, H) {
      for (let y = 40; y < H; y += 14) for (let x = 40 - ((y / 14) % 2) * 8; x < 92; x += 16) { const a = Math.max(40, x), b = Math.min(92, x + 15); c.fillStyle = lg(c, a, y, b, y + 13, [D4, D2]); c.fillRect(a, y, b - a, 13); }
      B(c, 34, 30, 64, 12, D3); B(c, 30, 26, 72, 5, D2); B(c, 38, 0, 56, 26, D1);
      for (const [x, y] of [[50, 90], [50, 160], [76, 120]]) { B(c, x - 2, y - 2, 18, 26, D3); c.fillStyle = D0; c.fillRect(x, y, 14, 22); }
    }, em(c, R, W, H) { for (const [x, y] of [[50, 90], [50, 160], [76, 120]]) { c.fillStyle = lg(c, 0, y, 0, y + 22, ["rgba(255,140,50,.6)", "rgba(255,200,100,.85)"]); c.fillRect(x, y, 14, 22); B(c, x + 6, y, 1.6, 22, "#0f0a0c"); B(c, x, y + 10, 14, 1.6, "#0f0a0c"); } } },
    rohr: { W: 200, H: 240, paint(c, R, W, H) {
      const pipe = (x, y0, y1, w) => { c.fillStyle = lg(c, x - w, 0, x + w, 0, [D4, D2, D0]); c.fillRect(x - w, y0, w * 2, y1 - y0); for (let y = y0 + 20; y < y1; y += 46) { B(c, x - w - 3, y, w * 2 + 6, 6, D3); rivet(c, x - w, y + 3, 1.2); rivet(c, x + w, y + 3, 1.2); } };
      pipe(40, 30, H, 12); pipe(120, 90, H, 9);
      c.fillStyle = D2; c.beginPath(); c.moveTo(28, 40); c.quadraticCurveTo(28, 10, 60, 10); c.lineTo(W, 10); c.lineTo(W, 32); c.lineTo(62, 32); c.quadraticCurveTo(52, 32, 52, 40); c.fill();
      c.beginPath(); c.moveTo(111, 100); c.quadraticCurveTo(111, 70, 140, 70); c.lineTo(W, 70); c.lineTo(W, 88); c.lineTo(140, 88); c.quadraticCurveTo(129, 88, 129, 100); c.fill();
      E(c, 40, 140, 16, 16, D3); E(c, 40, 140, 12, 12, D1); Ln(c, D4, 2, [40, 140, 46, 132]);
      c.strokeStyle = D3; c.lineWidth = 3; c.beginPath(); c.arc(120, 170, 12, 0, TAU); c.stroke(); Ln(c, D3, 3, [108, 170, 132, 170]); Ln(c, D3, 3, [120, 158, 120, 182]);
    }, em(c, R, W, H) { E(c, 40, 140, 9, 9, "rgba(255,170,90,.25)"); } },
    kran: { W: 220, H: 240, top: true, swing: 0.02, lights: [[150, 200, 40]], paint(c, R, W, H) {
      wood(c, 0, 10, W, 14, "#150d0a", R, false); for (let k = 0; k < 6; k++) Ln(c, D2, 2, [k * 36, 24, k * 36 + 18, 10]);
      E(c, 150, 34, 10, 10, D2); E(c, 150, 34, 3, 3, D3); c.strokeStyle = D2; for (let y = 44; y < 160; y += 9) glied(c, 150, y + 4, y / 9 % 2 ? 1.4 : 3, 5, 0, 2.2);
      c.lineWidth = 3; c.beginPath(); c.moveTo(126, 170); c.lineTo(150, 160); c.lineTo(174, 170); c.stroke();
      c.fillStyle = lg(c, 126, 0, 174, 0, [D4, D2, D0]); c.beginPath(); c.moveTo(124, 170); c.lineTo(176, 170); c.lineTo(168, 210); c.lineTo(132, 210); c.closePath(); c.fill(); B(c, 122, 168, 56, 5, D3);
    }, em(c, R, W, H) { for (let k = 0; k < 10; k++) E(c, 134 + R() * 32, 168 - R() * 6, 3 + R() * 3, 2.4, R() < 0.5 ? "rgba(255,120,40,.7)" : "rgba(255,200,100,.6)"); } }
  };
  const fgCache = new Map();
  function fgSprite(kind, v, bg) {
    const key = kind + v + bg; let s = fgCache.get(key); if (s) return s;
    const d = FGD[kind], W = d.W || 160, H = d.H || 260, RS = 1.1, R = Z.Rng((strSeed(kind) + v * 977) >>> 0);
    const mk = () => { const cv = document.createElement("canvas"); cv.width = Math.ceil(W * RS); cv.height = Math.ceil(H * RS); return { cv, c: cv.getContext("2d") }; };
    const m = mk(); m.c.scale(RS, RS); c0(m.c); d.paint(m.c, R, W, H);
    /* Randlicht: Maske minus versetzte Maske → helle Kante oben links */
    const r = mk(); r.c.drawImage(m.cv, 0, 0); r.c.globalCompositeOperation = "source-in"; r.c.fillStyle = RIM[bg] || "#ffc896"; r.c.fillRect(0, 0, r.cv.width, r.cv.height);
    r.c.globalCompositeOperation = "destination-out"; r.c.drawImage(m.cv, 2.6 * RS, 2.2 * RS);
    m.c.save(); m.c.setTransform(1, 0, 0, 1, 0, 0); m.c.globalCompositeOperation = "source-atop"; m.c.globalAlpha = 0.4; m.c.drawImage(r.cv, 0, 0); m.c.restore();
    if (d.em) { m.c.save(); d.em(m.c, R, W, H); m.c.restore(); }
    /* weiche Tiefenunschärfe */
    const o = mk(); if ("filter" in o.c) o.c.filter = "blur(" + (1.4 * RS).toFixed(1) + "px)"; o.c.drawImage(m.cv, 0, 0);
    s = { cv: o.cv, W, H }; fgCache.set(key, s); return s;
  }
  function c0(c) { c.lineCap = "butt"; c.lineJoin = "round"; }
  const al0 = Z.drawAfterLight;
  Z.drawAfterLight = function (c, cam, W, H, t) {
    if (al0) al0.apply(this, arguments);
    if (Z.level === lvRef && !simple()) flush(c, t);
    else if (Z.level === lvRef && FQn) { /* einfache Grafik: nur die Flammen, ohne Schein */ c.save(); c.globalCompositeOperation = "lighter"; for (let i = 0; i < FQn; i++) { const q = FQ[i]; drawFlame(c, q.x, q.y, q.s, t, q.ph, q.k, q.l); } c.restore(); }
    const B0 = Z.biome || {}, lv = Z.level; if (!lv || lv.hub || lv.arena || lv.passage) return;
    if (simple()) return;
    const kinds = FGK[B0.bg]; if (!kinds) return;
    const S = Z.gfx.scale || 1, f = 1.5, span = 520, sx = cam.x * f;
    const i0 = Math.floor(sx / span) - 1, i1 = Math.floor((sx + cam.w * 1.2) / span) + 1;
    c.save(); c.setTransform(S, 0, 0, S, 0, 0);
    for (let i = i0; i <= i1; i++) {
      const r = hash(i * 3.1, (lv.seed || 3) % 97); if (r < 0.6) continue;
      const kind = kinds[(hash(i, 7.7) * kinds.length) | 0], d = FGD[kind]; if (!d) continue;
      const spr = fgSprite(kind, (hash(i, 1.3) * 3) | 0, B0.bg);
      const sc = cam.h / 300 * (0.9 + hash(i, 4.4) * 0.4), w = spr.W * sc, h = spr.H * sc;
      const x = i * span + r * 200 - sx, y = d.top ? -h * 0.15 : cam.h - h * 0.85;
      if (x > cam.w + 20 || x + w < -20) continue;
      /* zur Bildmitte hin durchscheinend, damit der Vordergrund nie das Spiel verdeckt */
      const mid = Math.abs(x + w / 2 - cam.w / 2) / (cam.w * 0.5);
      const al0 = Math.max(0.28, Math.min(1, (mid - 0.15) / 0.55));
      /* nie vor Spieler, Gegnern, Geschossen, Gefahren oder Truhen/Türen: dann fast ganz ausblenden */
      const al = Z.gfx.fgAlpha ? Z.gfx.fgAlpha("a" + i, x, y, w, h, al0) : al0;
      if (al < 0.01) continue;
      c.save(); c.globalAlpha = al;
      const mir = (kind === "spinnwebe" || kind === "vorhang") && x + w / 2 > cam.w / 2;
      if (d.swing) { c.translate(x + w / 2, y); c.rotate(Math.sin(t * 0.6 + i * 1.7) * d.swing); c.translate(-w / 2, 0); } else c.translate(x, y);
      if (mir) { c.translate(w, 0); c.scale(-1, 1); }
      if (d.spin) { const [px, py] = d.pivot; c.translate(px * sc, py * sc); c.rotate(t * d.spin * (i % 2 ? 1 : -1)); c.translate(-px * sc, -py * sc); }
      c.drawImage(spr.cv, 0, 0, w, h);
      if (d.lights) { c.globalCompositeOperation = "lighter"; for (const [lx, ly, lr] of d.lights) { const fk = 0.75 + 0.25 * Math.sin(t * 9 + i) * Math.sin(t * 5.3 + i * 2); c.globalAlpha = 0.34 * fk; const rr = lr * sc; c.drawImage(glowSpr(kind === "esse" || kind === "schlot" || kind === "kran" ? "e" : "w"), lx * sc - rr, ly * sc - rr, rr * 2, rr * 2); } }
      c.restore();
    }
    c.restore();
  };


  /* ======================= Zerbrechliche Ausstattung =======================
     Treffer (Waffen, Geschosse, Explosionen, Gegnerschläge, fliegende Gegner) lassen die Requisiten wackeln, reißen,
     auslaufen und schließlich zerbrechen. Die Bruchstücke werden aus dem vorgemalten Sprite geschnitten (jedes Teil
     passt also genau zum Stück), fliegen mit Physik, prallen ab und bleiben als abgedunkelte Trümmer liegen.
     Dazu je Material Späne, Scherben, Stoffetzen, Stroh, Seiten oder Steinbrocken, auslaufende Flüssigkeit mit Pfütze,
     Wandschmuck, der herunterfällt und schief lehnt, Hängendes, das reißt, Kerzen, die verlöschen, kurze Flämmchen,
     Tiere, die vor dem Kampf fliehen. Alles rein dekorativ: keine Kollision, kein Schaden, gedeckte Farben.
     Grafikstufe 0: zerbricht schlicht (kurzer Splitterregen, keine Trümmer, keine Pfützen). */
  const SOLID = v => v === 1 || v === 7 || v === 12, PLAT = v => v === 2 || v === 8 || v === 10;
  const tileAt = (tx, ty) => { const lv = Z.level; return lv ? lv.get(tx, ty) : 1; };
  function groundY(x, y) { const tx = Math.floor(x / T); let ty = Math.floor(y / T); for (let k = 0; k < 40; k++, ty++) { const v = tileAt(tx, ty); if (SOLID(v)) return ty * T; if (PLAT(v) && ty * T >= y - 3) return ty * T; } return y + 4000; }
  function floorRun(x, gy) { const ty = Math.round(gy / T), t0 = Math.floor(x / T); let a = t0, b = t0; const ok = tx => { const v = tileAt(tx, ty); return (SOLID(v) || PLAT(v)) && !SOLID(tileAt(tx, ty - 1)); }; while (a > t0 - 8 && ok(a - 1)) a--; while (b < t0 + 8 && ok(b + 1)) b++; return [a * T, (b + 1) * T]; }
  const rnd = Math.random, sgn = v => (v > 0 ? 1 : v < 0 ? -1 : 0), clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const lvl = () => (Z.gq ? Z.gq.level : 2);
  const WS = () => (Z.weltspuren && Z.level === lvRef ? Z.weltspuren : null);
  const playS = (n, vol, rate, x, gap) => { if (A()) A().play(n, { vol, rate, x, gap }); };
  const A = () => Z.audio;

  /* Materialien: Splitterfarben, frische Bruchkante, Klang (Treffer/Bruch), Partikelart */
  const MAT = {
    holz: { c: ["#7a5432", "#5a3a20", "#9a7448", "#c8a070"], e: "rgba(236,204,156,.7)", hit: ["crate", 0.3, 1.35], brk: ["break", 0.6, 1], pk: "shard", dark: "rgba(20,12,6,.55)" },
    fass: { c: ["#6a4428", "#4a2e18", "#8a6440", "#5a5456"], e: "rgba(230,196,150,.7)", hit: ["crate", 0.32, 1.1], brk: ["break", 0.65, 0.85], pk: "shard", dark: "rgba(20,12,6,.55)" },
    kiste: { c: ["#7a5432", "#5a3a20", "#a07a4a", "#c8a070"], e: "rgba(236,204,156,.7)", hit: ["crate", 0.32, 1.25], brk: ["crate", 0.65, 0.95], pk: "shard", dark: "rgba(20,12,6,.55)" },
    glas: { c: ["#efe8d4", "#d8d0b4", "#fffbea", "#8a5a2a", "#5a2a1a"], e: "rgba(255,252,236,.85)", hit: ["glass", 0.22, 1.5], brk: ["glass", 0.55, 1], pk: "shard", dark: "rgba(255,250,235,.6)" },
    ton: { c: ["#a0603a", "#7a4428", "#c08060", "#5a3020"], e: "rgba(232,190,150,.75)", hit: ["rock", 0.22, 1.7], brk: ["glass", 0.45, 0.6], pk: "shard", dark: "rgba(40,16,8,.5)" },
    stein: { c: ["#8a8278", "#6a625a", "#a89e92", "#4a443e"], e: "rgba(222,214,202,.7)", hit: ["rock", 0.32, 1.15], brk: ["rock", 0.7, 0.85], pk: "shard", dark: "rgba(20,16,14,.5)" },
    metall: { c: ["#6a6466", "#9a9496", "#4a4446", "#b8b2ae"], e: "rgba(240,236,230,.75)", hit: ["hitMetal", 0.28, 1.2], brk: ["hitMetal", 0.45, 0.8], pk: "shard", dark: "rgba(16,14,16,.5)" },
    stoff: { c: ["#8a3a3a", "#c8b8a0", "#6a5a4a", "#a88a5a"], e: null, hit: ["slash", 0.2, 1.3], brk: ["slash", 0.32, 0.9], pk: "leaf", dark: "rgba(16,10,8,.5)" },
    stroh: { c: ["#c8a858", "#a88838", "#e0c878", "#8a6a28"], e: null, hit: ["slash", 0.16, 0.7], brk: ["break", 0.32, 1.45], pk: "leaf", dark: "rgba(30,20,6,.45)" },
    papier: { c: ["#efe4c8", "#d8c8a0", "#c8b48a"], e: null, hit: ["scroll", 0.3, 1], brk: ["scroll", 0.45, 0.9], pk: "leaf", dark: "rgba(40,30,16,.4)" },
    knochen: { c: ["#d8cfb8", "#b8b098", "#8a8270"], e: "rgba(255,250,236,.75)", hit: ["hitBone", 0.28, 1.2], brk: ["hitBone", 0.5, 0.9], pk: "shard", dark: "rgba(30,26,20,.45)" },
    pilz: { c: ["#c8a8b8", "#a87a98", "#e8d8c8", "#8a6a5a"], e: null, hit: ["slime", 0.22, 1.3], brk: ["slime", 0.42, 1], pk: "dot", dark: "rgba(20,10,20,.45)" },
    ei: { c: ["#e8e0c8", "#c8c0a8", "#d8d0c0"], e: null, hit: ["slime", 0.2, 1.5], brk: ["slime", 0.45, 0.8], pk: "dot", dark: "rgba(30,26,20,.4)" },
    kristall: { c: ["#e0b8ff", "#f4e4ff", "#b888e8"], e: "rgba(255,245,255,.9)", hit: ["gem", 0.3, 1.2], brk: ["glass", 0.55, 1.25], pk: "shard", dark: "rgba(30,10,40,.4)" },
    essen: { c: ["#e8c060", "#c89a40", "#a8302a", "#8a5a2a"], e: null, hit: ["hitFlesh", 0.16, 1.4], brk: ["hitFlesh", 0.28, 1.1], pk: "dot", dark: "rgba(30,16,6,.45)" },
    koralle: { c: ["#c86a5a", "#e89a7a", "#a84a3a"], e: "rgba(255,220,200,.7)", hit: ["rock", 0.22, 1.5], brk: ["rock", 0.45, 1.3], pk: "shard", dark: "rgba(30,10,8,.45)" }
  };
  /* Flüssigkeiten (nie blau: Wasser bleibt grau-oliv) */
  const LQ = { wein: ["74,12,24", 0.72], bier: ["122,78,20", 0.62], wasser: ["78,76,64", 0.42], oel: ["42,30,12", 0.7], suppe: ["94,66,32", 0.66], schleim: ["168,160,112", 0.55] };

  /* Je Art: m Material, hp Treffer bis zum Bruch, no unzerstörbar (nur Klang/Wackeln), wf Verhalten an Wand/Decke
     (fall: fällt und lehnt, shatter: zerspringt an Ort und Stelle, paper: flattert, roll: rollt davon, drop: Hängendes reißt ab),
     liq/lq Flüssigkeit und Menge, leak: läuft schon beim ersten Treffer aus, spill: Inhalt (Token:Anzahl), hitSpill: Inhalt je Treffer,
     gold/food: Beutechance, fire: brennende Lichter (verlöschen, kurzes Flämmchen), ring: Glocke, swing: schwingt, scatter: wirbelt Partikel auf,
     heavy: Krater und Beben, land: Material beim Aufschlagen */
  const C = {
    esstisch: { m: "holz", hp: 3, fire: 1, food: 0.15, liq: "wein", lq: 0.3, spill: "teller:2,apfel:2,brot:1,becher:1" },
    stuhl: { m: "holz", hp: 1 }, hocker: { m: "holz", hp: 1 }, bank: { m: "holz", hp: 2 },
    wachtisch: { m: "holz", hp: 3, fire: 1, gold: 0.25, liq: "bier", lq: 0.25, spill: "wuerfel:3,becher:1,karte:3" },
    lesepult: { m: "holz", hp: 2, fire: 1, spill: "buch:1,seite:6", hitSpill: "seite:1" },
    kerzenstaender: { m: "metall", hp: 2, fire: 1, spill: "kerze:3" },
    truhe: { m: "kiste", hp: 3, gold: 0.75, goldN: 2.2 },
    teppich: { no: 1, m: "stoff", soft: 1 },
    karren: { m: "holz", hp: 4, gold: 0.15, heavy: 1, spill: "scheit:2" },
    heu: { m: "stroh", hp: 2, scatter: 1, spill: "heu:8" },
    waffenstaender: { m: "holz", hp: 2, snd2: "hitMetal", spill: "speer:2" },
    faesser: { m: "fass", hp: 2, liq: "bier", lq: 1, leak: 1, gold: 0.15 },
    kisten: { m: "kiste", hp: 2, gold: 0.22 },
    brunnen: { no: 1, m: "stein" },
    hackklotz: { m: "holz", hp: 3, spill: "scheit:2" },
    holzstapel: { m: "holz", hp: 2, spill: "scheit:4" },
    trog: { m: "holz", hp: 2, liq: "wasser", lq: 0.8 },
    zielscheibe: { m: "stroh", hp: 2, scatter: 1, spill: "heu:5" },
    apfelkorb: { m: "stroh", hp: 1, food: 0.2, spill: "apfel:6" },
    eimer: { m: "holz", hp: 1, liq: "wasser", lq: 0.5 },
    fassregal: { m: "fass", hp: 4, liq: "wein", lq: 1.2, leak: 1, gold: 0.2, heavy: 1 },
    weinfass: { m: "fass", hp: 3, liq: "wein", lq: 1.3, leak: 1, gold: 0.12 },
    vorratsregal: { m: "holz", hp: 3, food: 0.15, gold: 0.15, spill: "zwiebel:3,brot:1,krug:2" },
    saecke: { m: "stoff", hp: 2, food: 0.12, scatter: 1, spill: "korn:14" },
    kaese: { m: "essen", hp: 1, food: 0.3, spill: "kaese:3" },
    krugreihe: { m: "ton", hp: 2, liq: "wein", lq: 0.7 },
    kartoffelkiste: { m: "kiste", hp: 1, food: 0.12, spill: "kartoffel:6" },
    besen: { m: "holz", hp: 1, spill: "heu:4" },
    kessel: { no: 1, m: "metall", snd: ["hitMetal", 0.35, 0.7] },
    kuechentisch: { m: "holz", hp: 3, food: 0.12, spill: "zwiebel:2,teller:1,brot:1" },
    buecherregal: { m: "holz", hp: 4, spill: "buch:7,seite:9", hitSpill: "seite:2,buch:1", heavy: 1 },
    ruestung: { m: "metall", hp: 3, snd2: "block" },
    globus: { m: "holz", hp: 2, spill: "seite:2" },
    standuhr: { m: "holz", hp: 3, spill: "zahnrad:4", snd2: "bell", heavy: 1 },
    harfe: { m: "holz", hp: 2, ring: ["bell", 0.12, 2.2] },
    sessel: { m: "stoff", hp: 3, spill: "feder:8", scatter: 1 },
    buestensaeule: { m: "stein", hp: 3, heavy: 1 },
    kamin: { no: 1, m: "stein" },
    kanonenkugeln: { no: 1, m: "metall" }, kanone: { no: 1, m: "metall", snd: ["hitMetal", 0.35, 0.6] },
    pulverfass: { m: "fass", hp: 1, pulver: 1 },
    koecherfass: { m: "fass", hp: 2, spill: "pfeil:5" },
    kohlebecken: { m: "metall", hp: 2, fire: 2, spill: "glut:6", snd2: "fire" },
    streckbank: { m: "holz", hp: 5, heavy: 1 },
    stroh: { no: 1, m: "stroh", scatter: 1, soft: 1 },
    napf: { m: "ton", hp: 1, liq: "suppe", lq: 0.3 },
    knochen: { m: "knochen", hp: 1, spill: "knochen:3" },
    folterstuhl: { m: "holz", hp: 3 },
    jungfrau: { no: 1, m: "metall", snd: ["hitMetal", 0.4, 0.55] },
    bodenkaefig: { no: 1, m: "metall", snd: ["chain", 0.3, 1] },
    netze: { no: 1, m: "stoff", soft: 1 },
    anker: { no: 1, m: "metall", snd: ["hitMetal", 0.4, 0.5] },
    tauwerk: { no: 1, m: "stoff", soft: 1 },
    fischkorb: { m: "stroh", hp: 1, food: 0.1, spill: "fisch:3" },
    poller: { no: 1, m: "holz" },
    hummerkorb: { m: "holz", hp: 1 },
    boot: { no: 1, m: "holz" },
    seekiste: { m: "kiste", hp: 2, gold: 0.35 },
    ruderbuendel: { m: "holz", hp: 2 },
    zahnradkiste: { m: "kiste", hp: 2, spill: "zahnrad:5" },
    kleineglocke: { no: 1, m: "metall", ring: ["bell", 0.3, 1.3] },
    grosseglocke: { no: 1, m: "metall", ring: ["gong", 0.3, 1] },
    winde: { no: 1, m: "holz" },
    uhrtisch: { m: "holz", hp: 3, fire: 1, spill: "zahnrad:4" },
    eiersack: { m: "ei", hp: 1, liq: "schleim", lq: 0.4, spinnen: 4 },
    pilze: { m: "pilz", hp: 1, sporen: 1 },
    knochenhaufen: { m: "knochen", hp: 2, spill: "knochen:5", scatter: 1 },
    kristall: { m: "kristall", hp: 3 },
    kokon_boden: { m: "ei", hp: 2, spill: "knochen:2", spinnen: 2 },
    kaefer: { no: 1, m: "ei" },
    pilzring: { no: 1, m: "pilz", sporen: 1 },
    amboss: { no: 1, m: "metall", snd: ["anvil", 0.35, 1] },
    schleifstein: { m: "stein", hp: 3 },
    runensteine: { m: "stein", hp: 3 },
    esse: { no: 1, m: "stein" },
    wassertrog: { no: 1, m: "stein" },
    barren: { no: 1, m: "metall" },
    ruestungsstaender: { m: "metall", hp: 2, snd2: "block" },
    gussform: { no: 1, m: "stein" },
    ballista: { no: 1, m: "holz" },
    statue: { m: "stein", hp: 4, heavy: 1 },
    wasserspeier: { m: "stein", hp: 3, heavy: 1 },
    fahnenmast: { no: 1, m: "holz" },
    truemmer: { no: 1, m: "stein" }, kandelaber_um: { no: 1, m: "metall" }, dornen: { no: 1, m: "holz" },
    giftpilze: { m: "pilz", hp: 1, sporen: 1 },
    muscheln: { no: 1, m: "koralle" },
    goetze: { m: "stein", hp: 3 },
    schilf: { cut: 1, m: "stroh", hp: 1 },
    saeulenstumpf: { no: 1, m: "stein" },
    korallen: { m: "koralle", hp: 2 },
    fischgraeten: { no: 1, m: "knochen" },
    opferschale: { m: "stein", hp: 2 },
    amphore: { m: "ton", hp: 1, liq: "oel", lq: 0.7, gold: 0.15 },
    wrackkiste: { m: "kiste", hp: 2, gold: 0.3 },
    kohlenkarren: { no: 1, m: "metall" }, gruenfeuer: { no: 1, m: "stein" }, schmelztiegel: { no: 1, m: "metall" }, schlacke: { no: 1, m: "stein" }, erzhaufen: { no: 1, m: "stein" },
    duergarstatue: { m: "stein", hp: 4, heavy: 1 },
    /* Wand */
    schild: { m: "metall", hp: 2, wf: "fall", land: ["block", 0.4, 1] },
    wandlaterne: { m: "metall", hp: 1, wf: "fall", fire: 1, land: ["glass", 0.4, 1.1] },
    steckbrief: { m: "papier", hp: 1, wf: "paper" },
    hufeisen: { m: "metall", hp: 1, wf: "fall", land: ["hitMetal", 0.3, 1.5] },
    werkzeugbrett: { m: "holz", hp: 2, wf: "shatter", snd2: "hitMetal" },
    flaschenregal: { m: "glas", hp: 2, wf: "shatter", liq: "wein", lq: 0.6 },
    wuerste: { m: "essen", hp: 1, wf: "shatter", food: 0.25 },
    zwiebelzopf: { m: "essen", hp: 1, wf: "shatter", food: 0.1, spill: "zwiebel:3" },
    pfannen: { m: "metall", hp: 2, wf: "shatter", snd2: "block" },
    wandkerze: { m: "metall", hp: 1, wf: "fall", fire: 1, land: ["hitMetal", 0.25, 1.6] },
    wandregal: { m: "holz", hp: 2, wf: "shatter", spill: "krug:1" },
    portraet: { m: "holz", hp: 2, wf: "fall", land: ["crate", 0.4, 0.8] },
    wandteppich: { m: "stoff", hp: 2, wf: "fall", swing: "stoff", land: ["slash", 0.2, 0.6] },
    geweih: { m: "knochen", hp: 2, wf: "fall", land: ["hitBone", 0.35, 0.9] },
    spiegel: { m: "glas", hp: 1, wf: "fall", landShatter: 1 },
    wandleuchter: { m: "metall", hp: 1, wf: "fall", fire: 1, land: ["hitMetal", 0.3, 1.3] },
    wappen: { m: "holz", hp: 2, wf: "fall", land: ["crate", 0.4, 0.9] },
    landschaft: { m: "holz", hp: 2, wf: "fall", land: ["crate", 0.4, 0.85] },
    schluesselbrett: { m: "holz", hp: 1, wf: "shatter", snd2: "coin" },
    fesseln: { no: 1, m: "metall", swing: "kette", snd: ["chain", 0.3, 1.1] },
    strichliste: { no: 1, m: "stein", flat: 1 }, kritzelei: { no: 1, m: "stein", flat: 1 }, kerkerfenster: { no: 1, m: "metall", flat: 1 }, runentafel: { no: 1, m: "stein", flat: 1 }, kuo_glyphen: { no: 1, m: "stein", flat: 1 },
    peitschen: { m: "stoff", hp: 1, wf: "fall", swing: "seil" },
    rettungsring: { m: "stoff", hp: 1, wf: "roll" },
    netzwand: { no: 1, m: "stoff", soft: 1 },
    steuerrad: { m: "holz", hp: 3, wf: "roll", land: ["crate", 0.35, 0.8] },
    reuse: { m: "stroh", hp: 1, wf: "fall" },
    schiffsglocke: { no: 1, m: "metall", swing: "kette", ring: ["bell", 0.3, 1.1] },
    ruder_x: { m: "holz", hp: 2, wf: "shatter" },
    zahnrad: { m: "metall", hp: 1, wf: "roll" },
    seilrolle: { m: "holz", hp: 1, wf: "roll" },
    uhrblatt: { m: "holz", hp: 3, wf: "shatter", spill: "zahnrad:3", snd2: "bell" },
    werkzeugbrett_fein: { m: "holz", hp: 2, wf: "shatter", snd2: "hitMetal", spill: "zahnrad:2" },
    wandpilze: { m: "pilz", hp: 1, wf: "shatter", sporen: 1 },
    eier_wand: { m: "ei", hp: 1, wf: "shatter", liq: "schleim", lq: 0.3, spinnen: 2 },
    gespinst: { no: 1, m: "ei", soft: 1 },
    zangen: { m: "metall", hp: 1, wf: "shatter" },
    werkzeugwand: { m: "holz", hp: 2, wf: "shatter", snd2: "hitMetal" },
    schwertwand: { m: "metall", hp: 2, wf: "shatter", snd2: "block" },
    banner_zerrissen: { no: 1, m: "stoff", swing: "stoff", soft: 1 },
    ranken_w: { no: 1, m: "stroh", leaves: 1, soft: 1 },
    algen: { no: 1, m: "stroh", soft: 1 },
    muschelwand: { no: 1, m: "koralle" },
    ketten: { no: 1, m: "metall", swing: "kette", snd: ["chain", 0.3, 1] },
    rohre: { no: 1, m: "metall", snd: ["hitMetal", 0.25, 0.7] },
    /* Decke */
    laterne_h: { m: "metall", hp: 2, wf: "drop", swing: "kette", fire: 1, landShatter: 1, land: ["glass", 0.5, 1] },
    kraeuter: { m: "stroh", hp: 2, wf: "drop", swing: "seil", leaves: 1, landShatter: 1 },
    kronleuchter_k: { m: "metall", hp: 3, wf: "drop", swing: "kette", fire: 1, landShatter: 1, heavy: 1, spill: "kerze:4", land: ["hitMetal", 0.6, 0.7] },
    haengekaefig: { no: 1, m: "metall", swing: "kette", snd: ["chain", 0.35, 0.9], snd2: "hitBone" },
    ketten_h: { no: 1, m: "metall", swing: "kette", snd: ["chain", 0.35, 1] },
    netz_h: { no: 1, m: "stoff", swing: "seil", soft: 1 },
    trockenfisch: { m: "essen", hp: 1, wf: "drop", swing: "seil", landShatter: 1, food: 0.12, spill: "fisch:3" },
    glockenseil: { no: 1, m: "stoff", swing: "seil", ring: ["bell", 0.16, 0.8], soft: 1 },
    flaschenzug: { no: 1, m: "holz", swing: "kette", snd: ["chain", 0.3, 1.1] },
    kokon_h: { m: "ei", hp: 2, wf: "drop", swing: "faden", landShatter: 1, spill: "knochen:2", liq: "schleim", lq: 0.25 },
    ranken_h: { no: 1, m: "stroh", swing: "seil", leaves: 1, soft: 1 },
    wurzeln: { no: 1, m: "holz", swing: "seil", soft: 1 },
    algen_h: { no: 1, m: "stroh", swing: "seil", soft: 1 },
    kranhaken: { no: 1, m: "metall", swing: "kette", snd: ["chain", 0.35, 0.9] }
  };
  /* Trefferflächen von Hängendem, das (auch) in der Animation gemalt wird – lokal, Ursprung an der Decke */
  const HANG = {
    laterne_h: v => [-4.5, 12 + v * 3, 4.5, 25 + v * 3], kronleuchter_k: () => [-11.5, 9, 11.5, 18.5],
    haengekaefig: v => [-6.6, 9 + v * 3, 6.6, 29 + v * 3], ketten_h: () => [-5, 1, 6, 24], kranhaken: v => [-5.5, 1, 5.5, 25 + v * 6],
    glockenseil: v => [-3, 1, 3, 37 + v * 8], flaschenzug: v => [-3, 1, 3, 23 + v * 4], kokon_h: v => [-4.6, 14 + v * 6, 4.6, 33 + v * 6],
    algen_h: () => [-9.5, 0, 9.5, 24]
  };

  /* ---------- Alpha-Maske eines Sprites (einmal je Sprite) ---------- */
  function alphaOf(s) {
    if (s.al) return s.al;
    const W = s.cv.width, H = s.cv.height, res = W / s.w;
    let a = null; try { const d = s.cv.getContext("2d").getImageData(0, 0, W, H).data; a = new Uint8Array(W * H); for (let i = 0; i < W * H; i++) a[i] = d[i * 4 + 3]; } catch (e) { a = null; }
    let x0 = W, y0 = H, x1 = -1, y1 = -1;
    if (a) for (let y = 0; y < H; y += 1) for (let x = 0; x < W; x += 1) if (a[y * W + x] > 50) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    if (x1 < 0) { x0 = 0; y0 = 0; x1 = W - 1; y1 = H - 1; }
    s.al = { a, W, H, res, bb: [s.l + x0 / res, s.t + y0 / res, s.l + (x1 + 1) / res, s.t + (y1 + 1) / res] };
    return s.al;
  }
  function baseSprite(p) { const d = K[p.kind]; return d && d.s ? spriteOf(p.kind, p.v) : null; }
  /* Trefferrechteck in Weltkoordinaten (genaue Umrisse aus der Alpha-Maske) */
  function rectOf(p) {
    const d = K[p.kind]; if (!d) return null;
    const X = p.x * T + 8, Y = p.L === 2 || p.L === 4 ? p.y * T : (p.y + 1) * T, f = p.f < 0 && !d.noflip ? -1 : 1;
    let bb = null;
    if (HANG[p.kind]) bb = HANG[p.kind](p.v);
    else if (d.s) { if (!p.bb) { const s = spriteOf(p.kind, p.v); p.bb = alphaOf(s).bb; } bb = p.bb; }
    else if (d.box) bb = d.box;
    else if (p.kind === "schilf") bb = [-12, -24, 12, 0];
    if (!bb) return null;
    let x0 = bb[0], x1 = bb[2]; if (f < 0) { x0 = -bb[2]; x1 = -bb[0]; }
    const sw = p.sw ? p.sw.a : 0, ox = d.at === "c" && sw ? -Math.sin(sw) * (bb[1] + bb[3]) / 2 : 0;
    return { x: X + x0 + ox, y: Y + bb[1], w: x1 - x0, h: bb[3] - bb[1], X, Y, f };
  }
  const ov = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

  /* ---------- Listen ---------- */
  let PCS = [], DROPS = [], PUD = [], FIRES = [], EMIT = [], SMOKE = [], CLK = 0, swingList = [];
  const actHit = new WeakMap(), projHit = new WeakMap();
  const maxFly = () => (lvl() >= 2 ? 70 : 34), maxRest = () => (lvl() >= 2 ? 160 : 60), maxPieces = () => (lvl() >= 2 ? 9 : 5);
  function resetBreak() { PCS = []; DROPS = []; PUD = []; FIRES = []; EMIT = []; SMOKE = []; swingList = []; }

  /* ---------- Teile aus einem Sprite schneiden ---------- */
  /* s: {cv,l,t,w,h}; al: Alpha-Maske; region [x0,y0,x1,y1] lokal; n: Höchstzahl; mat: Material (frische Kanten) */
  function cutSprite(s, al, region, n, mat) {
    const res = al.res, [rx0, ry0, rx1, ry1] = region, bw = rx1 - rx0, bh = ry1 - ry0;
    if (bw < 1 || bh < 1) return [];
    const cell = n >= 8 ? 9 : 13;
    let cols = clamp(Math.round(bw / cell), 1, 4), rows = clamp(Math.round(bh / cell), 1, 5);
    while (cols * rows > n) { if (cols >= rows && cols > 1) cols--; else rows--; }
    const tri = cols * rows * 2 <= n && cols * rows <= 4;
    const V = []; for (let j = 0; j <= rows; j++) { V.push([]); for (let i = 0; i <= cols; i++) { const inner = i > 0 && i < cols && j > 0 && j < rows; V[j].push([rx0 + i * bw / cols + (inner ? (rnd() - 0.5) * bw / cols * 0.6 : 0), ry0 + j * bh / rows + (inner ? (rnd() - 0.5) * bh / rows * 0.6 : (j > 0 && j < rows ? (rnd() - 0.5) * bh / rows * 0.3 : 0))]); } }
    /* Kante innen? (nicht auf dem Rand des Bereichs) */
    const onB = (a, b) => (a[0] === b[0] && (a[0] <= rx0 + 0.01 || a[0] >= rx1 - 0.01)) || (a[1] === b[1] && (a[1] <= ry0 + 0.01 || a[1] >= ry1 - 0.01));
    const polys = [];
    for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
      const a = V[j][i], b = V[j][i + 1], c = V[j + 1][i + 1], d = V[j + 1][i];
      if (tri) { if (rnd() < 0.5) { polys.push([a, b, c], [a, c, d]); } else { polys.push([a, b, d], [b, c, d]); } } else polys.push([a, b, c, d]);
    }
    const out = [], A = al.a, W = al.W, H = al.H;
    for (const poly of polys) {
      let mx0 = 1e9, my0 = 1e9, mx1 = -1e9, my1 = -1e9; for (const q of poly) { mx0 = Math.min(mx0, q[0]); mx1 = Math.max(mx1, q[0]); my0 = Math.min(my0, q[1]); my1 = Math.max(my1, q[1]); }
      const px0 = clamp(Math.floor((mx0 - s.l) * res), 0, W - 1), px1 = clamp(Math.ceil((mx1 - s.l) * res), 0, W - 1), py0 = clamp(Math.floor((my0 - s.t) * res), 0, H - 1), py1 = clamp(Math.ceil((my1 - s.t) * res), 0, H - 1);
      const pp = poly.map(q => [(q[0] - s.l) * res, (q[1] - s.t) * res]);
      const inside = (x, y) => { let r = false; for (let i = 0, j = pp.length - 1; i < pp.length; j = i++) { const xi = pp[i][0], yi = pp[i][1], xj = pp[j][0], yj = pp[j][1]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) r = !r; } return r; };
      let cnt = 0, ox0 = 1e9, oy0 = 1e9, ox1 = -1, oy1 = -1; const st = res >= 3 ? 2 : 1;
      for (let y = py0; y <= py1; y += st) for (let x = px0; x <= px1; x += st) { if (A && A[y * W + x] <= 50) continue; if (!inside(x + 0.5, y + 0.5)) continue; cnt++; if (x < ox0) ox0 = x; if (x > ox1) ox1 = x; if (y < oy0) oy0 = y; if (y > oy1) oy1 = y; }
      if (cnt * st * st < 14 * res * res / 9) continue;
      ox0 = Math.max(0, ox0 - st); oy0 = Math.max(0, oy0 - st); ox1 = Math.min(W - 1, ox1 + st); oy1 = Math.min(H - 1, oy1 + st);
      const cw = ox1 - ox0 + 1, ch = oy1 - oy0 + 1, cv = document.createElement("canvas"); cv.width = cw; cv.height = ch;
      const g = cv.getContext("2d"); g.translate(-ox0, -oy0);
      g.save(); g.beginPath(); pp.forEach((q, i) => (i ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1]))); g.closePath(); g.clip(); g.drawImage(s.cv, 0, 0); g.restore();
      if (mat && mat.e) { g.globalCompositeOperation = "source-atop"; g.strokeStyle = mat.e; g.lineWidth = Math.max(1, res * 0.55); g.beginPath(); for (let i = 0; i < poly.length; i++) { const a = poly[i], b = poly[(i + 1) % poly.length]; if (onB(a, b)) continue; g.moveTo(pp[i][0], pp[i][1]); g.lineTo(pp[(i + 1) % poly.length][0], pp[(i + 1) % poly.length][1]); } g.stroke(); g.globalCompositeOperation = "source-over"; }
      out.push({ cv, w: cw / res, h: ch / res, lx: s.l + (ox0 + cw / 2) / res, ly: s.t + (oy0 + ch / 2) / res });
    }
    return out;
  }
  /* ganzes Sprite (auf den sichtbaren Umriss beschnitten) als ein Stück */
  function wholePiece(s, al) {
    const [x0, y0, x1, y1] = al.bb, res = al.res, px0 = Math.floor((x0 - s.l) * res), py0 = Math.floor((y0 - s.t) * res), cw = Math.max(1, Math.ceil((x1 - x0) * res)), ch = Math.max(1, Math.ceil((y1 - y0) * res));
    const cv = document.createElement("canvas"); cv.width = cw; cv.height = ch; cv.getContext("2d").drawImage(s.cv, -px0, -py0);
    return { cv, w: cw / res, h: ch / res, lx: (x0 + x1) / 2, ly: (y0 + y1) / 2 };
  }
  /* Trümmerrest: unteres Stück mit gezackter Bruchkante, abgedunkelt */
  function stumpOf(s, al, hr, mat) {
    const [x0, , x1, y1] = al.bb, res = al.res, top = y1 - hr;
    const cv = document.createElement("canvas"), cw = Math.ceil((x1 - x0) * res) + 2, ch = Math.ceil((hr + 3) * res); cv.width = cw; cv.height = ch;
    const g = cv.getContext("2d"); g.scale(res, res); g.translate(-x0, -(top - 2.5));
    const pts = []; for (let x = x0; x <= x1 + 0.01; x += 2 + rnd() * 1.5) pts.push([x, top + rnd() * 2.6 - (rnd() < 0.2 ? 1.5 : 0)]); pts.push([x1, top + rnd() * 2]);
    g.save(); g.beginPath(); g.moveTo(x0, y1 + 1); pts.forEach(q => g.lineTo(q[0], q[1])); g.lineTo(x1, y1 + 1); g.closePath(); g.clip(); g.drawImage(s.cv, s.l, s.t, s.w, s.h);
    if (mat && mat.e) { g.globalCompositeOperation = "source-atop"; g.strokeStyle = mat.e; g.lineWidth = 0.55; g.beginPath(); pts.forEach((q, i) => (i ? g.lineTo(q[0], q[1] + 0.3) : g.moveTo(q[0], q[1] + 0.3))); g.stroke(); }
    g.globalCompositeOperation = "source-atop"; g.fillStyle = "rgba(14,9,6,.3)"; g.fillRect(x0 - 1, top - 3, x1 - x0 + 2, hr + 6); g.restore();
    return { cv, l: x0, t: top - 2.5, w: cw / res, h: ch / res };
  }
  /* beschädigtes Sprite: Kopie, auf die Risse, Dellen und Kerben gemalt werden (nur auf deckende Pixel) */
  function damage(p, hx, hy, k, mat) {
    const base = baseSprite(p); if (!base) return;
    if (!p.dspr) { const cv = document.createElement("canvas"); cv.width = base.cv.width; cv.height = base.cv.height; cv.getContext("2d").drawImage(base.cv, 0, 0); p.dspr = { cv, l: base.l, t: base.t, w: base.w, h: base.h, al: alphaOf(base) }; }
    const s = p.dspr, al = s.al, res = al.res, g = s.cv.getContext("2d");
    g.save(); g.scale(res, res); g.translate(-s.l, -s.t); g.globalCompositeOperation = "source-atop"; g.lineCap = "round"; g.lineJoin = "round";
    const [x0, y0, x1, y1] = al.bb, n = 1 + k;
    for (let i = 0; i < n; i++) {
      let x = clamp(hx + (rnd() - 0.5) * 6, x0 + 1, x1 - 1), y = clamp(hy + (rnd() - 0.5) * 6, y0 + 1, y1 - 1);
      if (mat === MAT.metall) { /* Delle */ g.fillStyle = "rgba(0,0,0,.35)"; g.beginPath(); g.ellipse(x, y, 1.6 + rnd(), 1 + rnd() * 0.6, rnd() * 3, 0, TAU); g.fill(); g.strokeStyle = "rgba(255,250,240,.45)"; g.lineWidth = 0.35; g.beginPath(); g.arc(x - 0.3, y - 0.3, 1.5, PI * 1.1, PI * 1.7); g.stroke(); continue; }
      if (mat === MAT.stoff || mat === MAT.stroh) { /* Riss im Stoff */ g.strokeStyle = "rgba(10,6,4,.75)"; g.lineWidth = 0.7; g.beginPath(); g.moveTo(x - 2, y - 1); g.lineTo(x + 0.4, y + 0.6); g.lineTo(x + 2.4, y - 0.4); g.stroke(); continue; }
      const vert = mat === MAT.holz || mat === MAT.fass || mat === MAT.kiste, star = mat === MAT.glas || mat === MAT.kristall;
      const arms = star ? 5 : 1 + (rnd() < 0.5 ? 1 : 0);
      for (let a = 0; a < arms; a++) {
        let ang = star ? a / arms * TAU + rnd() * 0.5 : vert ? (rnd() < 0.5 ? -PI / 2 : PI / 2) + (rnd() - 0.5) * 0.5 : rnd() * TAU, px = x, py = y;
        const len = (star ? 3 : 5) + rnd() * (star ? 4 : 7);
        const path = [[px, py]]; for (let l = 0; l < len; l += 1.4) { ang += (rnd() - 0.5) * (vert ? 0.35 : 0.9); px += Math.cos(ang) * 1.4; py += Math.sin(ang) * 1.4; path.push([px, py]); }
        g.strokeStyle = star ? "rgba(255,255,245,.55)" : mat ? mat.dark : "rgba(0,0,0,.5)"; g.lineWidth = star ? 0.3 : 0.55; g.beginPath(); path.forEach((q, i) => (i ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1]))); g.stroke();
        if (!star && mat && mat.e) { g.strokeStyle = mat.e.replace(/[\d.]+\)$/, ".35)"); g.lineWidth = 0.25; g.beginPath(); path.forEach((q, i) => (i ? g.lineTo(q[0] + 0.35, q[1] + 0.35) : g.moveTo(q[0] + 0.35, q[1] + 0.35))); g.stroke(); }
      }
      if (vert && rnd() < 0.6) { g.fillStyle = "rgba(20,10,4,.55)"; g.beginPath(); g.ellipse(x, y, 0.8, 0.5, 0, 0, TAU); g.fill(); }
    }
    g.restore();
  }

  /* ---------- Kleine Inhalte (Token), einmal gemalt ---------- */
  const TOKC = new Map();
  const TOK = {
    apfel: (c, R) => { apfel(c, 0, 0, 1.4, R() < 0.5 ? "#a8302a" : R() < 0.5 ? "#b8a030" : "#7a8a2a"); return [3.4, 3.6]; },
    kartoffel: (c, R) => { E(c, 0, 0, 1.6, 1.15, "#9a7a4a"); E(c, -0.5, -0.4, 0.6, 0.35, "rgba(255,230,180,.3)"); E(c, 0.6, 0.2, 0.2, 0.2, "#5a4020"); return [3.6, 2.8]; },
    zwiebel: (c, R) => { E(c, 0, 0.2, 1.5, 1.4, "#c8884a"); Ln(c, "#a86a30", 0.25, [0, -1.2, 0, 1.4]); P(c, "#8a6a3a", [-0.3, -1.1, 0, -2.4, 0.3, -1.1]); return [3.4, 4.2]; },
    brot: (c) => { brot(c, 0, 1.4, 4); return [5, 3]; },
    kaese: (c) => { P(c, "#e8c060", [-2, 1, 2, 1, 2, -0.4, -2, 0.6]); E(c, 0.4, 0.2, 0.4, 0.3, "#c89a30"); return [4.4, 2.4]; },
    fisch: (c, R) => { E(c, 0, 0, 2.6, 0.9, R() < 0.5 ? "#b8a070" : "#a89060"); P(c, "#8a7a50", [2.4, 0, 3.8, -1, 3.8, 1]); B(c, -2, -0.3, 0.4, 0.4, "#1a1414"); return [7, 2.4]; },
    teller: (c) => { E(c, 0, 0, 3, 0.8, "#c8c0b4"); E(c, 0, -0.1, 2, 0.5, "#b0a89c"); return [6.2, 1.8]; },
    becher: (c) => { becher(c, 0, 2, "#b8923a"); return [3, 4.4]; },
    krug: (c) => { krug(c, 0, 2.6, 5.2, "#8a5a3a"); return [4.6, 5.4]; },
    wuerfel: (c, R) => { B(c, -0.8, -0.8, 1.6, 1.6, "#e8e0d0"); B(c, -0.3, -0.3, 0.4, 0.4, "#2a1a1a"); return [1.8, 1.8]; },
    karte: (c, R) => { B(c, -1, -1.4, 2, 2.8, "#e8dcc0"); B(c, -0.4, -0.4, 0.8, 0.8, R() < 0.5 ? "#a82a2a" : "#2a2224"); return [2.2, 3]; },
    buch: (c, R) => { const col = ["#6a2a2a", "#2a4a2a", "#5a4a2a", "#4a2a4a", "#7a5a2a"][(R() * 5) | 0]; buch(c, -1.4, -2.4, 2.8, 4.8, col, R); return [3, 5]; },
    seite: (c) => { B(c, -1.4, -1.8, 2.8, 3.6, "#ece2c6"); for (let k = 0; k < 4; k++) B(c, -1, -1.2 + k * 0.8, 2 - (k % 2) * 0.6, 0.2, "rgba(60,40,30,.45)"); return [3, 3.8]; },
    feder: (c, R) => { const col = R() < 0.5 ? "#ece4d6" : "#c8b8a0"; E(c, 0, 0, 1.8, 0.5, col, 0.2); Ln(c, "rgba(120,100,80,.6)", 0.15, [-1.8, 0.2, 1.8, -0.2]); return [4, 1.4]; },
    kerze: (c) => { kerze(c, 0, 2, 4, 1.1); return [1.4, 5.4]; },
    scheit: (c, R) => { wood(c, -3.5, -1, 7, 2, "#6a4428", R, false); E(c, 3.5, 0, 0.6, 1, "#a07a4a"); return [8, 2.4]; },
    speer: (c) => { B(c, -7, -0.3, 13, 0.6, "#6a4a2a"); P(c, "#a8a6a2", [6, -0.9, 8.4, 0, 6, 0.9]); return [16, 2]; },
    pfeil: (c) => { B(c, -4, -0.2, 8, 0.4, "#7a5a32"); P(c, "#9a9896", [4, -0.6, 5.2, 0, 4, 0.6]); P(c, "#e8e0d0", [-4, 0, -4.8, -0.8, -3, 0]); return [10.4, 1.8]; },
    zahnrad: (c, R) => { const r = 1.2 + R() * 1; c.fillStyle = R() < 0.5 ? "#a8823a" : "#8a8486"; zahnradF(c, 0, 0, r, 8, 0.6); c.fill(); E(c, 0, 0, r * 0.35, r * 0.35, "#2a2224"); return [r * 2 + 1.6, r * 2 + 1.6]; },
    knochen: (c, R) => { if (R() < 0.3) { schaedel(c, 0, 0, 1.8, R() - 0.5); return [4, 4.4]; } knochen(c, -2.4, 0, 2.4, 0, 0.7); return [6, 1.8]; },
    heu: (c, R) => { for (let k = 0; k < 4; k++) Ln(c, ["#c8a858", "#a88838", "#e0c878"][k % 3], 0.3, [-2 + R(), -0.6 + R() * 1.2, 2 - R(), -0.6 + R() * 1.2]); return [4.6, 1.6]; },
    korn: (c, R) => { E(c, 0, 0, 0.5, 0.35, R() < 0.5 ? "#d8c088" : "#b89a60"); return [1.2, 1]; },
    glut: (c) => { E(c, 0, 0, 0.9, 0.7, "#ff8a3a"); E(c, -0.2, -0.2, 0.4, 0.3, "#ffd27a"); return [2, 1.6]; }
  };
  const FLUTTER = { seite: 1, feder: 1, heu: 1, karte: 1 };
  function tokSprite(type) {
    const v = (rnd() * 3) | 0, key = type + v; let o = TOKC.get(key); if (o) return o;
    const res = 3, cv = document.createElement("canvas"); cv.width = cv.height = 60; const g = cv.getContext("2d"); g.scale(res, res); g.translate(10, 10);
    const sz = TOK[type](g, Z.Rng((strSeed(type) + v * 31) >>> 0));
    const cw = Math.ceil(sz[0] * res) + 2, ch = Math.ceil(sz[1] * res) + 2, out = document.createElement("canvas"); out.width = cw; out.height = ch; out.getContext("2d").drawImage(cv, -(30 - cw / 2), -(30 - ch / 2));
    o = { cv: out, w: cw / res, h: ch / res }; TOKC.set(key, o); return o;
  }

  /* ---------- Stücke in die Welt werfen ---------- */
  function addPiece(o) {
    let fly = 0; for (const q of PCS) if (q.st < 2) fly++;
    if (fly >= maxFly()) return null;
    const q = Object.assign({ x: 0, y: 0, vx: 0, vy: 0, r: 0, vr: 0, f: 1, st: 0, t: 0, a: 1, sy: 1, gtx: -99999, gy: 0, mode: "" }, o);
    PCS.push(q); return q;
  }
  function throwPieces(list, X, Y, f, hx, dir, force, wall) {
    let area = 0; for (const pc of list) area += pc.w * pc.h;
    for (const pc of list) {
      const wx = X + pc.lx * f, wy = Y + pc.ly, m = Math.sqrt(pc.w * pc.h / 40) + 0.6, away = sgn(wx - hx) || dir || 1;
      const k = force / m;
      addPiece({ cv: pc.cv, w: pc.w, h: pc.h, x: wx, y: wy, f,
        vx: wall ? (rnd() - 0.5) * 40 * k + away * 20 : away * (30 + rnd() * 90) * k + dir * 40 * force + (rnd() - 0.5) * 30,
        vy: wall ? -10 - rnd() * 50 * k : -(50 + rnd() * 150) * k * (0.5 + Math.min(1, (Y - wy) / 30)),
        vr: (rnd() - 0.5) * 14 * k, r: 0 });
    }
  }
  function spill(spec, x, y, dir, force) {
    if (!spec || lvl() < 1) return;
    for (const part of spec.split(",")) {
      const [type, nS] = part.split(":"); let n = +nS || 1; if (lvl() < 2) n = Math.ceil(n / 2);
      if (type === "korn") { burst(x, y - 4, n * 2, ["#d8c088", "#b89a60", "#c8a870"], 110, "dot", 1.2, 600); for (let i = 0; i < Math.min(5, n); i++) tok("korn", x + (rnd() - 0.5) * 10, y - 3, dir, force * 0.6); continue; }
      if (type === "glut") { for (let i = 0; i < n; i++) { const q = tok("glut", x + (rnd() - 0.5) * 8, y - 6, dir, force); if (q) { q.glut = 4 + rnd() * 4; } } continue; }
      for (let i = 0; i < n; i++) tok(type, x + (rnd() - 0.5) * 12, y - 4 - rnd() * 8, dir, force);
    }
  }
  function tok(type, x, y, dir, force) {
    if (!TOK[type]) return null;
    const s = tokSprite(type), fl = !!FLUTTER[type];
    return addPiece({ cv: s.cv, w: s.w, h: s.h, x, y, f: rnd() < 0.5 ? -1 : 1, vx: (dir * 40 + (rnd() - 0.5) * 120) * force * (fl ? 0.6 : 1), vy: -(60 + rnd() * 140) * force * (fl ? 0.7 : 1), vr: (rnd() - 0.5) * 16, mode: fl ? "flutter" : "", ph: rnd() * TAU, tok: type });
  }
  function burst(x, y, n, cols, sp, kind, size, g) {
    if (!Z.fx) return; if (lvl() < 2) n = Math.ceil(n / 2);
    for (let i = 0; i < n; i++) { const a = -PI / 2 + (rnd() - 0.5) * 2.6, v = sp * (0.35 + rnd() * 0.8); Z.fx.p({ x: x + (rnd() - 0.5) * 6, y: y + (rnd() - 0.5) * 4, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 0.5 + rnd() * 0.6, size: size * (0.6 + rnd() * 0.8), col: cols[(rnd() * cols.length) | 0], g: g || 600, drag: kind === "leaf" ? 0.93 : 0.985, kind, vr: (rnd() - 0.5) * 14 }); }
  }
  function dust(x, y, n, s) { if (!Z.fx || lvl() < 1) return; for (let i = 0; i < n; i++) Z.fx.p({ x: x + (rnd() - 0.5) * 14 * s, y: y - rnd() * 6, vx: (rnd() - 0.5) * 50, vy: -10 - rnd() * 25, life: 0.8 + rnd() * 0.7, size: 3 + rnd() * 3 * s, col: "rgba(150,138,124,.55)", kind: "smoke", drag: 0.93, g: -15 }); }

  /* ---------- Flüssigkeit ---------- */
  function emitter(x, y, dir, lq, amt, life, spread) {
    if (lvl() < 1 || !LQ[lq]) return;
    EMIT.push({ x, y, dir, lq, rate: 24 * amt, t: 0, life, spread: spread || 0.25 });
    if (EMIT.length > 8) EMIT.shift();
  }
  function splash(x, y, lq, n, sp) {
    if (lvl() < 1 || !LQ[lq]) return;
    for (let i = 0; i < n && DROPS.length < 160; i++) { const a = -PI / 2 + (rnd() - 0.5) * 2.4, v = sp * (0.3 + rnd()); DROPS.push({ x: x + (rnd() - 0.5) * 8, y: y - rnd() * 6, vx: Math.cos(a) * v, vy: Math.sin(a) * v, lq, gy: groundY(x, y - 8) }); }
  }
  function puddleAdd(x, gy, lq, amt) {
    let best = null; for (const u of PUD) if (u.lq === lq && Math.abs(u.y - gy) < 2 && Math.abs(u.x - x) < u.hw + 6) { best = u; break; }
    if (!best) {
      if (PUD.length >= 22) PUD.splice(PUD.findIndex(u => u.wet <= 0) >= 0 ? PUD.findIndex(u => u.wet <= 0) : 0, 1);
      const run = floorRun(x, gy); if (x < run[0] || x > run[1]) return;
      best = { x, y: gy, hw: 1.5, tw: 3, lq, wet: 1, t: 0, run, seed: rnd() * 9 }; PUD.push(best);
    }
    best.tw = Math.min(30, best.tw + amt); best.wet = 1; best.t = Math.min(best.t, 2);
    best.x += (x - best.x) * 0.05;
  }

  /* ---------- Kleine Brände, Rauchfahnen ---------- */
  function smallFire(x, gy, n, life) {
    if (lvl() < 1) return;
    for (let i = 0; i < n && FIRES.length < 10; i++) FIRES.push({ x: x + (rnd() - 0.5) * 14, y: gy, t: -rnd() * 0.3, life: (life || 3) * (0.7 + rnd() * 0.6), s: 0.45 + rnd() * 0.35, ph: rnd() * 9 });
    playS("fire", 0.22, 1.3, x, 0.2);
    const ws = WS(); if (ws && ws.decal) try { ws.decal("brand", x, gy, { s: 0.45, fresh: 1 }); } catch (e) {}
  }
  function wisp(x, y) { if (lvl() >= 1) SMOKE.push({ x, y, t: 0, life: 2.5 + rnd(), ph: rnd() * 9 }); if (SMOKE.length > 24) SMOKE.shift(); }
  function douse(p) { if (!p.fst || p.out) return; p.out = true; for (const st of p.fst) if (st && st.seen > TT - 1) wisp(st.x, st.y - 2); }

  /* ---------- Impuls: alles in der Nähe reagiert (Flammen, Ketten, Tiere, kleine Stücke) ---------- */
  function impulse(x, y, s, dir) {
    if (Z.level !== lvRef || !props.length) return;
    const R = 70 + s * 90;
    for (const p of props) {
      const X = p.x * T + 8, Y = p.L === 2 || p.L === 4 ? p.y * T : (p.y + 1) * T, dx = X - x, dy = Y - 8 - y, dist = Math.hypot(dx, dy);
      const d = K[p.kind];
      if (d.crit) { if (dist < 110 + s * 120) scare(p, X, x, s); continue; }
      if (dist > R + 30) continue;
      const k = Math.max(0, 1 - dist / (R + 30)), sd = sgn(dx) || dir || 1;
      if (p.sw) p.sw.va += sd * k * s * (p.sw.kind === "stoff" ? 0.5 : 0.9) / (1 + p.sw.len / 50);
      if (p.fst) for (const st of p.fst) if (st) { st.v += sgn(st.x - x || sd) * k * s * 8; if (s >= 0.9 && st.s < 0.75 && k > 0.35 && rnd() < 0.5 * k) douse(p); }
      if (!p.broken && d.at === "f" && s >= 0.8 && k > 0.3 && C[p.kind] && !C[p.kind].no) { p.wv = (p.wv || 0) + sd * k * s * 1.2 / (1 + (p.bb ? (p.bb[3] - p.bb[1]) / 30 : 1)); }
    }
  }
  function scare(p, X, x, s) {
    const away = X >= x ? 1 : -1;
    switch (p.kind) {
      case "ratte": if (!(p.hide > 0) && !p.flee) { p.flee = true; p.wait = 0; p.dir = away; if (rnd() < 0.5) playS("rat", 0.12, 1.2, X, 0.4); } break;
      case "huhn": case "katze": if (!p.panic || TT - p.panic > 3.5) { p.panic = TT; p.pdir = away; } break;
      case "kraehe": case "moewe": case "taube": if (p.flyT == null && !(p.gone && TT < p.gone)) { p.flyT = TT; p.fdir = away; } break;
      case "fledermaus": if (p.flyT == null && !(p.gone && TT < p.gone)) p.flyT = TT; break;
      case "spinne": p.zip = TT + 5 + rnd() * 3; break;
      case "krabbe": p.scare = TT + 2.5; p.dir = away; break;
    }
  }

  /* ---------- Treffer ---------- */
  /* o: { hits, dir, x, y (Trefferpunkt), force, expl, src } */
  function hitProp(p, o) {
    const cfg = C[p.kind], d = K[p.kind]; if (!cfg || p.broken || !d) return false;
    if (cfg.flat && !o.expl) return false;
    if ((p.hcd || 0) > CLK) return false; p.hcd = CLK + 0.1;
    const r = rectOf(p); if (!r) return false;
    const mat = MAT[cfg.m] || MAT.holz, dir = o.dir || 1, hx = clamp(o.x, r.x, r.x + r.w), hy = clamp(o.y, r.y, r.y + r.h);
    const lx = (hx - r.X) * r.f, ly = hy - r.Y, big = r.h > 30 || r.w > 40;
    p.fla = 0.08; p.shk = 0.18;
    /* Wackeln, Schwingen, schief hängen */
    if (p.sw) { p.sw.va += dir * (p.sw.kind === "stoff" ? 1.4 : 2.2) * (o.expl ? 2 : 1) / (1 + p.sw.len / 40); if (d.at === "w" && !cfg.no) p.sw.rest = clamp(p.sw.rest + dir * (0.04 + rnd() * 0.08), -0.28, 0.28); }
    else if (d.at === "f") p.wv = (p.wv || 0) + dir * (cfg.no ? 0.6 : 3.2) / (1 + r.h / 26);
    impulse(hx, hy, o.expl ? 1.2 : 0.45, dir);
    /* Klang */
    const sn = cfg.snd || mat.hit; playS(sn[0], sn[1], sn[2] * (0.92 + rnd() * 0.16), hx);
    if (cfg.ring) playS(cfg.ring[0], cfg.ring[1], cfg.ring[2] * (0.95 + rnd() * 0.1), hx, 0.25);
    if (cfg.snd2 && rnd() < 0.6) playS(cfg.snd2, 0.18, 1.2, hx, 0.15);
    if (simple()) { if (!cfg.no) { p.dmg = (p.dmg || 0) + (o.hits || 1); if (p.dmg >= (cfg.hp || 1)) breakProp(p, o, r, cfg, mat); } return true; }
    /* Splitter, Staub, Fetzen */
    if (!cfg.soft) burst(hx, hy, cfg.no ? 2 : 4, mat.c, 90, mat.pk, mat.pk === "leaf" ? 1.6 : 1.3, mat.pk === "leaf" ? 160 : 650);
    if (cfg.scatter || cfg.leaves) burst(hx, hy, 6, cfg.leaves ? ["#4a6a3a", "#3a5a2e", "#5a7a3a"] : mat.c, 70, "leaf", 1.8, 140);
    if (cfg.sporen) sporen(hx, hy, 6);
    if (cfg.cut) { p.cut = true; p.cutT = TT; burst(r.X, r.Y - 8, 10, ["#4a6a3a", "#3a5a2e", "#6a4a2a"], 110, "leaf", 2, 200); playS("slash", 0.25, 1.1, hx); p.broken = false; p.dmg = 99; return true; }
    if (cfg.no) { if (d.at === "f" && big) dust(hx, r.Y, 1, 0.6); return true; }
    p.dmg = (p.dmg || 0) + (o.hits || 1);
    if (p.dmg >= cfg.hp) { breakProp(p, o, r, cfg, mat); return true; }
    /* Schaden sichtbar: Risse, Dellen; Fässer bekommen ein Leck, Regale verlieren Seiten */
    damage(p, lx, ly, Math.ceil(p.dmg / cfg.hp * 2), mat);
    if (cfg.leak && cfg.liq && !p.leak) { p.leak = true; emitter(hx, clamp(hy, r.y + r.h * 0.35, r.Y - 4), dir, cfg.liq, 0.5, 5); playS("splash", 0.2, 1.3, hx, 0.2); }
    if (cfg.hitSpill) spill(cfg.hitSpill, hx, hy, dir, 0.6);
    if (cfg.fire && rnd() < 0.5) douse(p);
    return true;
  }
  function sporen(x, y, n) { if (!Z.fx) return; for (let i = 0; i < n; i++) Z.fx.p({ x: x + (rnd() - 0.5) * 10, y: y - rnd() * 6, vx: (rnd() - 0.5) * 30, vy: -8 - rnd() * 14, life: 1.6 + rnd(), size: 1 + rnd(), col: "rgba(232,214,170,.75)", kind: "dot", drag: 0.95, g: -4 }); }

  function breakProp(p, o, r, cfg, mat) {
    const d = K[p.kind], dir = o.dir || 1, X = r.X, Y = r.Y, f = r.f, force = o.expl ? 1.7 : o.hits >= 2 ? 1.25 : 1;
    p.broken = true; p.brT = TT; p.dmg = cfg.hp;
    Z.stats && (Z.stats.zerbrochen = (Z.stats.zerbrochen || 0) + 1);
    const cxw = r.x + r.w / 2, cyw = r.y + r.h / 2;
    const bs = mat.brk; playS(bs[0], bs[1], bs[2] * (0.9 + rnd() * 0.2), cxw);
    if (cfg.snd2) playS(cfg.snd2, 0.3, 0.95, cxw, 0.1);
    loot(p, cfg, cxw, r.y + r.h * 0.4, d);
    if (cfg.fire) { douse(p); if (cfg.wf !== "fall" && cfg.wf !== "drop") smallFire(X, groundY(X, Y - 4), cfg.fire >= 2 ? 3 : 1 + (rnd() < 0.5 ? 1 : 0), 3); }
    impulse(cxw, cyw, cfg.heavy ? 1 : 0.6, dir);
    if (simple()) { burst(cxw, cyw, 8, mat.c, 140, "shard", 2.2, 700); if (d.at === "w" || d.at === "c") p.gone = true; return; }
    const ws = WS();
    if (cfg.heavy) { Z.fx && Z.fx.addShake && Z.fx.addShake(2.5); dust(cxw, Y, 5, 1.4); if (ws) try { ws.impact(cxw, Y - 4, 0.8, { dir }); if (mat === MAT.stein) ws.crater(cxw, Y - 2, 0.7, 3); } catch (e) {} }
    else if (ws && ws.impact) try { ws.impact(cxw, cyw, 0.35, { dir, noDust: true }); } catch (e) {}
    /* Wand und Decke: herunterfallen statt zerspringen */
    if (cfg.wf === "fall" || cfg.wf === "paper" || cfg.wf === "roll" || cfg.wf === "drop") { dropWhole(p, r, cfg, mat, dir, d); return; }
    const base = baseSprite(p); if (!base) { burst(cxw, cyw, 10, mat.c, 140, mat.pk, 2, 700); return; }
    const s = p.dspr || base, al = alphaOf(base), bb = al.bb, wall = d.at === "w";
    /* Rest am Boden: unteres Stück mit Bruchkante */
    let region = bb.slice();
    if (!wall && bb[3] - bb[1] > 9) { const hr = clamp((bb[3] - bb[1]) * 0.22, 3, 9); p.rest = stumpOf(s, al, hr, mat); region[3] = bb[3] - hr + 1.5; }
    else p.rest = null;
    if (wall) { p.gone = true; p.ghost = ghostOf(p); }
    const pcs = cutSprite(s, al, region, maxPieces(), mat);
    throwPieces(pcs, X, Y, f, o.x, dir, force, wall);
    /* Material-Splitter */
    burst(cxw, cyw, mat.pk === "leaf" ? 10 : 12, mat.c, 150 * force, mat.pk, mat.pk === "leaf" ? 2 : 1.6, mat.pk === "leaf" ? 160 : 700);
    if (mat === MAT.stein || mat === MAT.ton || mat === MAT.kristall) dust(cxw, Y, mat === MAT.stein ? 4 : 2, 1);
    if (mat === MAT.holz || mat === MAT.kiste || mat === MAT.fass) burst(cxw, cyw, 6, ["#c8a070", "#e0c090", "#8a6440"], 160 * force, "shard", 0.9, 800);
    if (cfg.scatter) burst(cxw, cyw, 10, mat.c, 120, "leaf", 2.2, 140);
    if (cfg.sporen) sporen(cxw, cyw, 14);
    spill(cfg.spill, cxw, cyw, dir, force);
    if (cfg.liq) { const gy = groundY(X, Y - 6); splash(cxw, Math.min(cyw, gy - 6), cfg.liq, Math.round(18 * cfg.lq), 120 * force); emitter(X + (rnd() - 0.5) * 6, wall ? cyw : Y - 3, dir, cfg.liq, 0.6 * cfg.lq, 2.5); puddleAdd(X, gy, cfg.liq, 6 * cfg.lq); playS("splash", 0.4, 0.95, cxw, 0.2); }
    if (cfg.pulver) { if (Z.fx) for (let i = 0; i < 12; i++) Z.fx.p({ x: cxw + (rnd() - 0.5) * 12, y: cyw, vx: (rnd() - 0.5) * 80, vy: -20 - rnd() * 50, life: 1 + rnd(), size: 4 + rnd() * 4, col: "rgba(60,56,54,.6)", kind: "smoke", drag: 0.92, g: -10 }); for (let i = 0; i < 6; i++) Z.fx && Z.fx.p({ x: cxw, y: cyw, vx: (rnd() - 0.5) * 160, vy: -40 - rnd() * 100, life: 0.4, size: 1.2, col: "#ffb040", kind: "spark", add: true, g: 300 }); playS("fire", 0.2, 1.6, cxw); if (ws) try { ws.decal("brand", X, groundY(X, Y - 4), { s: 0.55 }); } catch (e) {} }
    if (cfg.spinnen) spiders(cxw, Y, cfg.spinnen);
  }
  function loot(p, cfg, x, y, d) {
    if (!Z.R || Z.level !== lvRef) return;
    const R = Z.R, tier = Z.run ? Z.run.tier || 0 : 0, gm = Z.BAL && Z.BAL.goldMul ? Z.BAL.goldMul(tier) : 1;
    const gch = cfg.gold != null ? cfg.gold : cfg.m === "kiste" || cfg.m === "fass" ? 0.16 : cfg.m === "holz" ? 0.04 : 0;
    try {
      if (gch && R() < gch) Z.dropGold(x, y, Math.max(1, Math.round((2 + R() * 5) * gm * (cfg.goldN || 1))));
      if (cfg.food && Z.FOOD && R() < cfg.food) Z.spawnPickup("food", x, y, { food: R.pick(Z.FOOD), drop: true });
      if ((cfg.m === "kiste" || cfg.m === "fass") && R() < 0.015 && Z.dropShards) Z.dropShards(x, y, 1);
    } catch (e) { console.error(e); }
  }
  /* Spinnenjunge huschen aus Eiersäcken (rein dekorativ) */
  const SPID = [];
  function spiders(x, gy, n) { if (lvl() < 2) n = Math.ceil(n / 2); for (let i = 0; i < n && SPID.length < 16; i++) SPID.push({ x: x + (rnd() - 0.5) * 8, y: groundY(x, gy - 6), vx: (rnd() < 0.5 ? -1 : 1) * (40 + rnd() * 50), t: 0, life: 1.6 + rnd() * 1.4, ph: rnd() * 9 }); }

  /* Wandschmuck/Hängendes fällt als Ganzes */
  function snapshot(p, d) {
    const hr = HANG[p.kind] ? HANG[p.kind](p.v) : null, base = baseSprite(p);
    if (!d.a || !hr) { const s = p.dspr || base; return s ? { s, al: alphaOf(base) } : null; }
    const bx0 = Math.min(hr[0], base ? base.l : 0) - 3, by0 = Math.min(hr[1], base ? base.t : 0) - 3, bx1 = Math.max(hr[2], base ? base.l + base.w : 0) + 3, by1 = Math.max(hr[3], base ? base.t + base.h : 0) + 4;
    const res = 3, cv = document.createElement("canvas"); cv.width = Math.ceil((bx1 - bx0) * res); cv.height = Math.ceil((by1 - by0) * res);
    const g = cv.getContext("2d"); g.scale(res, res); g.translate(-bx0, -by0);
    capture = true; const sw = p.sw; p.sw = null; try { d.a(g, p, TT); } catch (e) { console.error(e); } capture = false; p.sw = sw;
    const s = { cv, l: bx0, t: by0, w: bx1 - bx0, h: by1 - by0 };
    /* Aufhängung (Bügel und oberste Kettenglieder) bleibt an der Decke: oben abschneiden */
    g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, cv.width, Math.max(0, (hr[1] - by0 - 0.5) * res)); g.restore();
    return { s, al: alphaOf(s) };
  }
  function dropWhole(p, r, cfg, mat, dir, d) {
    const sn = snapshot(p, d); p.gone = true; if (!sn) return;
    const wp = wholePiece(sn.s, sn.al), X = r.X, Y = r.Y, f = r.f;
    const ang = p.sw ? p.sw.a : 0;
    const q = addPiece({ cv: wp.cv, w: wp.w, h: wp.h, x: X + wp.lx * f, y: Y + wp.ly, f, r: ang, vx: dir * (cfg.wf === "drop" ? 20 : 30) + (rnd() - 0.5) * 20, vy: cfg.wf === "drop" ? 10 : -30 - rnd() * 30, vr: dir * (cfg.wf === "drop" ? 1 : 2.4) * (0.5 + rnd()), mode: cfg.wf === "paper" ? "flutter" : cfg.wf === "roll" ? "roll" : cfg.landShatter ? "shatter" : "lie", cfg, mat, big: 1, ph: rnd() * 9 });
    if (!q) return;
    if (cfg.wf === "paper") { q.vy = -20; q.vr = (rnd() - 0.5) * 3; }
    if (d.at === "c") { p.stub = cfg.swing || "kette"; playS(cfg.swing === "kette" ? "chain" : "slash", 0.35, 1, X, 0.1); }
    if (cfg.fire) q.lit = 1;
    if (cfg.leaves) burst(r.x + r.w / 2, r.y + r.h / 2, 10, ["#5a7a3a", "#7a8a4a", "#6a5a3a"], 80, "leaf", 2, 120);
    if (d.at === "w") { p.ghost = ghostOf(p); playS("door", 0.08, 1.8, X, 0.3); }
  }
  /* heller Abdruck an der Wand, wo das Stück hing, mit Nagel */
  function ghostOf(p) {
    const base = baseSprite(p); if (!base) return null; const al = alphaOf(base), [x0, y0, x1, y1] = al.bb;
    const res = 2, cv = document.createElement("canvas"); cv.width = Math.ceil((x1 - x0) * res) + 2; cv.height = Math.ceil((y1 - y0) * res) + 2;
    const g = cv.getContext("2d"); g.scale(res, res); g.translate(-x0, -y0); g.drawImage(base.cv, base.l, base.t, base.w, base.h);
    g.globalCompositeOperation = "source-in"; g.fillStyle = "rgba(255,236,206,.06)"; g.fillRect(x0 - 1, y0 - 1, x1 - x0 + 2, y1 - y0 + 2);
    g.globalCompositeOperation = "source-over"; g.fillStyle = "rgba(0,0,0,.22)"; g.fillRect(x0, y1 - 0.6, x1 - x0, 0.6);
    E(g, (x0 + x1) / 2, y0 + 2.5, 0.55, 0.55, "#1e1a1a"); E(g, (x0 + x1) / 2 - 0.15, y0 + 2.35, 0.2, 0.2, "rgba(255,240,220,.6)");
    return { cv, l: x0, t: y0, w: cv.width / res, h: cv.height / res };
  }
  /* ein fallendes Ganzstück schlägt auf */
  function landWhole(q) {
    const cfg = q.cfg, mat = q.mat || MAT.holz, x = q.x, gy = q.gy;
    if (q.lit) { smallFire(x, gy, 1 + (rnd() < 0.6 ? 1 : 0), 2.6); }
    if (cfg.land) playS(cfg.land[0], cfg.land[1], cfg.land[2] * (0.92 + rnd() * 0.16), x);
    impulse(x, gy - 4, cfg.heavy ? 1.1 : 0.4, sgn(q.vx) || 1);
    if (cfg.heavy) { Z.fx && Z.fx.addShake && Z.fx.addShake(3); dust(x, gy, 6, 1.4); const ws = WS(); if (ws) try { ws.impact(x, gy - 4, 1, {}); } catch (e) {} }
    if (q.mode === "shatter") {
      const s = { cv: q.cv, l: -q.w / 2, t: -q.h / 2, w: q.w, h: q.h };
      const al = alphaOf(s), pcs = cutSprite(s, al, al.bb, maxPieces(), mat);
      for (const pc of pcs) { const co = Math.cos(q.r), si = Math.sin(q.r), lx = pc.lx * q.f, ly = pc.ly; addPiece({ cv: pc.cv, w: pc.w, h: pc.h, x: x + lx * co - ly * si, y: q.y + lx * si + ly * co, f: q.f, r: q.r, vx: (rnd() - 0.5) * 120 + q.vx * 0.3, vy: -40 - rnd() * 110, vr: (rnd() - 0.5) * 12 }); }
      const bs = mat.brk; playS(bs[0], bs[1], bs[2], x); if (mat !== MAT.glas && cfg.landShatter && cfg.fire) playS("glass", 0.4, 1.1, x, 0.05);
      burst(x, gy - 3, 12, mat.c, 140, mat.pk, 1.5, 700);
      if (cfg.spill) spill(cfg.spill, x, gy - 3, sgn(q.vx) || 1, 0.8);
      if (cfg.liq) { splash(x, gy - 4, cfg.liq, 10, 90); puddleAdd(x, gy, cfg.liq, 6 * (cfg.lq || 0.5)); playS("splash", 0.3, 1, x, 0.1); }
      if (cfg.spinnen) spiders(x, gy, cfg.spinnen);
      return true;
    }
    burst(x, gy - 2, 4, mat.c, 60, mat.pk, 1.2, 600);
    return false;
  }

  /* ---------- Treffer verteilen ---------- */
  function hitArea(r, o) {
    if (Z.level !== lvRef || !props.length || !r) return 0;
    let n = 0;
    for (const p of props) {
      if (p.broken || K[p.kind].crit) { if (K[p.kind].crit && !p.broken) { const X = p.x * T + 8 + (p.rx || p.cx || 0), Y = p.L === 4 ? p.y * T + (p.l || 10) : (p.y + 1) * T - 4; if (X > r.x - 6 && X < r.x + r.w + 6 && Y > r.y - 8 && Y < r.y + r.h + 8) hitCritter(p, X, Y, o); } continue; }
      const pr = rectOf(p); if (!pr || !ov(r, pr)) continue;
      if (o.set) { if (o.set.has(p)) continue; o.set.add(p); }
      const hx = clamp(r.x + r.w / 2, pr.x, pr.x + pr.w), hy = clamp(r.y + r.h / 2, pr.y, pr.y + pr.h);
      if (hitProp(p, { hits: o.hits, dir: o.dir || (sgn(pr.x + pr.w / 2 - (r.x + r.w / 2)) || 1), x: hx, y: hy, expl: o.expl, src: o.src })) n++;
    }
    return n;
  }
  function hitCritter(p, X, Y, o) {
    if ((p.ccd || 0) > CLK) return; p.ccd = CLK + 1;
    scare(p, X, X - (o.dir || 1) * 10, 1);
    if (p.kind === "huhn") { for (let i = 0; i < (lvl() >= 2 ? 7 : 3); i++) tok("feder", X + (rnd() - 0.5) * 6, Y - 4, o.dir || 1, 0.5); }
    if (p.kind === "katze") burst(X, Y - 4, 4, ["#8a6a4a", "#5a4a40"], 40, "leaf", 1, 60);
  }

  /* ---------- Einhängen: Waffentreffer, Explosionen, Gegnertreffer ---------- */
  const hp0 = Z.hitProps;
  Z.hitProps = function (r, dmg, act) {
    try {
      if (r && Z.level === lvRef && props.length) {
        const expl = !act && r.w >= 70 && r.h >= 50, P = Z.player;
        let set = null; if (act) { set = actHit.get(act); if (!set) { set = new Set(); actHit.set(act, set); } }
        const heavy = act && act.def && (act.def.heavy || act.def.spin);
        hitArea(r, { hits: expl ? 9 : act ? (heavy ? 2 : 1) : 2, dir: act && P ? P.face : 0, expl, set, src: "p" });
      }
    } catch (e) { console.error(e); }
    return hp0 ? hp0.apply(this, arguments) : undefined;
  };
  const he0 = Z.hitEnemy;
  Z.hitEnemy = function (e, dmg, o) {
    const n = he0.apply(this, arguments);
    try { if (n > 0 && e && !(o && (o.dot || o.fx)) && Z.level === lvRef) impulse(e.x + e.w / 2, e.y + e.h / 2, o && (o.heavy || o.crit) ? 0.7 : 0.35, o && o.dir); } catch (err) { console.error(err); }
    return n;
  };
  const ex0 = Z.explode;
  Z.explode = function (x, y, r, dmg, owner, eff) {
    const res = ex0.apply(this, arguments);
    try {
      if (Z.level === lvRef) {
        const R = r || 40; impulse(x, y, 1.4, 0);
        if (owner !== "p") hitArea({ x: x - R, y: y - R, w: R * 2, h: R * 2 }, { hits: 9, expl: true, src: "e" });
      }
    } catch (err) { console.error(err); }
    return res;
  };

  /* ---------- Takt: Gegnerschläge, Geschosse, Physik ---------- */
  function enemyHits() {
    for (const e of Z.enemies || []) {
      if (e.dead) continue;
      const ac = e.act;
      if (ac && ac.phase === "act" && ac.a) {
        if (ac.a.box && !ac.ausHit) {
          ac.ausHit = true; const sz = e.size || 1, [bx, by, bw, bh] = ac.a.box.map(v => v * sz), cx = e.x + e.w / 2, fy = e.y + e.h;
          const r = e.face > 0 ? { x: cx + bx, y: fy + by, w: bw, h: bh } : { x: cx - bx - bw, y: fy + by, w: bw, h: bh };
          if (Z.clipHitBox) Z.clipHitBox(r, cx, e.y + e.h / 2, e.face); /* W8: Gegnerschläge enden an der Wand */
          hitArea(r, { hits: ac.a.k === "slam" ? 2 : 1, dir: e.face, src: "e" });
        }
        if (ac.a.k === "charge") { let set = actHit.get(ac); if (!set) { set = new Set(); actHit.set(ac, set); } hitArea(e, { hits: 2, dir: e.face, set, src: "e" }); }
      }
      /* zurückgeschleuderte Gegner krachen in Möbel */
      if (Math.abs(e.vx || 0) > 240 && (e.ausCd || 0) < CLK) { if (hitArea(e, { hits: 1, dir: sgn(e.vx), src: "e" })) e.ausCd = CLK + 0.3; }
    }
  }
  function projHits() {
    for (const q of Z.projs || []) {
      if (q.dead || q.t > (q.life || 9)) continue;
      const rr = Math.max(3, q.r || 3), r = { x: q.x - rr, y: q.y - rr, w: rr * 2, h: rr * 2 };
      let set = projHit.get(q); if (!set) { set = new Set(); projHit.set(q, set); }
      hitArea(r, { hits: 1, dir: sgn(q.vx) || q.dir || 1, set, src: q.owner });
    }
  }
  function playerTouch(dt) {
    const P = Z.player; if (!P || P.dead) return;
    const pr = { x: P.x, y: P.y, w: P.w, h: P.h }, mv = Math.abs(P.vx || 0);
    for (const p of props) {
      if (p.broken) continue; const d = K[p.kind]; if (d.crit) continue;
      if (!p.sw && !(d.at === "f" && mv > 60)) continue;
      const r = rectOf(p); if (!r || !ov(pr, r)) continue;
      const cfg = C[p.kind];
      if (p.sw && d.at === "c") { p.sw.va += (P.vx || 0) * 0.0035 * dt * 60 / (1 + p.sw.len / 40); if (mv > 90 && (p.tcd || 0) < CLK && cfg && cfg.snd && cfg.snd[0] === "chain") { p.tcd = CLK + 0.8; playS("chain", 0.12, 1.2, r.X, 0.3); } if (cfg && cfg.ring && mv > 120 && (p.tcd || 0) < CLK) { p.tcd = CLK + 1.2; playS(cfg.ring[0], cfg.ring[1] * 0.6, cfg.ring[2], r.X, 0.5); } }
      else if (d.at === "f" && cfg && !cfg.no && r.h < 28 && (p.tcd || 0) < CLK) {
        p.tcd = CLK + 0.6; p.wv = (p.wv || 0) + sgn(P.vx) * 1.4;
        /* rollend räumt Ezekiel kleine Dinge um */
        if (P.rollT > 0 && cfg.hp <= 1) hitProp(p, { hits: 1, dir: sgn(P.vx) || 1, x: r.x + r.w / 2, y: r.y + r.h / 2 });
      }
      if (cfg && cfg.cut && mv > 40 && !p.cut) { p.bend = sgn(P.vx); p.bendT = TT; }
    }
  }
  function physics(dt) {
    const g = 900;
    /* Wackeln und Schwingen */
    for (const p of props) {
      if (p.fla > 0) p.fla -= dt; if (p.shk > 0) p.shk -= dt;
      if (p.wv || p.wob) { p.wv = (p.wv || 0) + (-(p.wob || 0) * 260 - p.wv * 9) * dt; p.wob = clamp((p.wob || 0) + p.wv * dt, -0.35, 0.35); if (Math.abs(p.wob) < 0.0005 && Math.abs(p.wv) < 0.005) { p.wob = 0; p.wv = 0; } }
      const s = p.sw; if (s && !p.broken) { s.va += (-(s.a - s.rest) * s.k - s.va * s.c) * dt; s.a = clamp(s.a + s.va * dt, -1.2, 1.2); }
      if (p.fst) for (const st of p.fst) if (st) { st.v += (-st.l * 60 - st.v * 7) * dt; st.l = clamp(st.l + st.v * dt, -1.6, 1.6); }
    }
    /* Stücke */
    let rest = 0;
    for (let i = PCS.length - 1; i >= 0; i--) {
      const q = PCS[i]; q.t += dt;
      if (q.glut) { q.glut -= dt; if (q.glut <= 0) { q.glut = 0; q.cool = 1; } }
      if (q.fade) { q.a -= dt * 1.2; if (q.a <= 0) { PCS.splice(i, 1); continue; } }
      if (q.st === 2) { rest++; continue; }
      const tx = Math.floor(q.x / T); if (tx !== q.gtx || q.y > q.gy) { q.gtx = tx; q.gy = groundY(q.x, q.y - 2); }
      if (q.mode === "flutter") { q.vy = Math.min(q.vy + g * 0.25 * dt, 26 + Math.sin(q.t * 3 + q.ph) * 6); q.vx = q.vx * Math.pow(0.3, dt) + Math.sin(q.t * 2.6 + q.ph) * 40 * dt; q.r = Math.sin(q.t * 3 + q.ph) * 0.9; }
      else { q.vy += g * dt; q.vx *= Math.pow(0.85, dt); }
      const nx = q.x + q.vx * dt, ntx = Math.floor(nx / T), ty = Math.floor((q.y - 1) / T);
      if (ntx !== tx && SOLID(tileAt(ntx, ty))) { q.vx *= -0.35; q.vr *= 0.6; } else q.x = nx;
      q.y += q.vy * dt; q.r += q.vr * dt;
      const co = Math.abs(Math.cos(q.r)), si = Math.abs(Math.sin(q.r)), he = (co * q.h * q.sy + si * q.w) / 2;
      if (q.y + he >= q.gy) {
        q.y = q.gy - he;
        if (q.big && !q.landed) { q.landed = true; if (landWhole(q)) { PCS.splice(i, 1); continue; } if (q.mode === "roll") { q.vx = (sgn(q.vx) || (rnd() < 0.5 ? -1 : 1)) * (50 + rnd() * 40); q.vy = 0; } if (q.mode === "lie") { q.vy *= -0.15; q.vx *= 0.4; } }
        if (q.mode === "roll") { q.vy = 0; q.vx *= Math.pow(0.55, dt); q.vr = q.vx / Math.max(2, Math.min(q.w, q.h) / 2); if (Math.abs(q.vx) < 6) settle(q); continue; }
        if (q.mode === "flutter") { settle(q); continue; }
        if (q.vy > 70) { q.vy *= -0.28; q.vx *= 0.6; q.vr *= 0.5; if (rnd() < 0.35 && q.t > 0.2) playS(q.tok === "apfel" || q.tok === "kartoffel" ? "hitFlesh" : "crate", 0.05, 1.9, q.x, 0.06); }
        else { q.vy = 0; q.vx *= Math.pow(0.02, dt); q.vr *= Math.pow(0.02, dt); if (Math.abs(q.vx) < 8) settle(q); }
      }
      if (q.y > q.gy + 600 || q.t > 14) PCS.splice(i, 1);
    }
    if (rest > maxRest()) { let k = rest - maxRest(); for (const q of PCS) { if (k <= 0) break; if (q.st === 2 && !q.fade) { q.fade = 1; k--; } } }
    /* Tropfen und Pfützen */
    for (let i = EMIT.length - 1; i >= 0; i--) {
      const e = EMIT[i]; e.t += dt; if (e.t >= e.life) { EMIT.splice(i, 1); continue; }
      const k = 1 - e.t / e.life; let n = e.rate * k * dt; while (n > 0 && DROPS.length < 160) { if (n < 1 && rnd() > n) break; n--; DROPS.push({ x: e.x, y: e.y, vx: e.dir * (30 + rnd() * 30) * (0.4 + k) + (rnd() - 0.5) * 12, vy: -10 + rnd() * 20, lq: e.lq, gy: groundY(e.x, e.y) }); }
    }
    for (let i = DROPS.length - 1; i >= 0; i--) {
      const q = DROPS[i]; q.vy += g * dt; q.x += q.vx * dt; q.y += q.vy * dt;
      if (q.y >= q.gy) { puddleAdd(q.x, q.gy, q.lq, 0.45); if (rnd() < 0.25 && Z.fx) Z.fx.p({ x: q.x, y: q.gy - 1, vx: (rnd() - 0.5) * 40, vy: -30 - rnd() * 30, life: 0.25, size: 0.8, col: "rgba(" + LQ[q.lq][0] + ",.8)", g: 500 }); DROPS.splice(i, 1); continue; }
      if (q.y > q.gy + 400) DROPS.splice(i, 1);
    }
    for (const u of PUD) { u.t += dt; u.hw += (u.tw - u.hw) * Math.min(1, dt * 1.5); if (u.t > 25) u.wet = Math.max(0, 1 - (u.t - 25) / 50); }
    for (let i = FIRES.length - 1; i >= 0; i--) { const f = FIRES[i]; f.t += dt; if (f.t > f.life) { wisp(f.x, f.y - 3); FIRES.splice(i, 1); continue; } if (f.t > 0 && rnd() < dt * 6 && Z.fx && lvl() >= 2) Z.fx.p({ x: f.x + (rnd() - 0.5) * 3, y: f.y - 4, vx: (rnd() - 0.5) * 16, vy: -30 - rnd() * 30, life: 0.5 + rnd() * 0.4, size: 0.9, col: "#ffb060", kind: "spark", add: true, g: -20 }); }
    for (let i = SMOKE.length - 1; i >= 0; i--) { const s = SMOKE[i]; s.t += dt; if (s.t > s.life) SMOKE.splice(i, 1); }
    for (let i = SPID.length - 1; i >= 0; i--) { const s = SPID[i]; s.t += dt; const nx = s.x + s.vx * dt; if (SOLID(tileAt(Math.floor(nx / T), Math.floor((s.y - 2) / T))) || !(SOLID(tileAt(Math.floor(nx / T), Math.floor(s.y / T))) || PLAT(tileAt(Math.floor(nx / T), Math.floor(s.y / T))))) s.vx = -s.vx; else s.x = nx; if (s.t > s.life) SPID.splice(i, 1); }
  }
  /* zur Ruhe kommen: flach hinlegen, Ganzstücke lehnen schief, Papier liegt flach */
  function settle(q) {
    q.vx = 0; q.vy = 0; q.vr = 0;
    if (q.mode === "lie") { const lean = (q.r > 0 ? 1 : -1) * (0.12 + rnd() * 0.2); q.r = lean; }
    else if (q.mode === "flutter") { q.r = (rnd() - 0.5) * 0.3; q.sy = 0.35; }
    else if (q.mode !== "roll") { const flatA = q.w >= q.h ? 0 : PI / 2, cands = [flatA, flatA + PI, flatA - PI]; let best = cands[0]; for (const c of cands) { const a = ((q.r - c) % TAU + TAU + PI) % TAU - PI; if (Math.abs(a) < Math.abs(((q.r - best) % TAU + TAU + PI) % TAU - PI)) best = c; } q.r = best + (rnd() - 0.5) * 0.25; }
    const co = Math.abs(Math.cos(q.r)), si = Math.abs(Math.sin(q.r)), he = (co * q.h * q.sy + si * q.w) / 2; q.y = q.gy - he + 0.4;
    q.st = 2;
    /* liegende Trümmer abdunkeln, damit sie Hintergrund bleiben (einmal ins Teil gemalt) */
    if (!q.dark && q.cv) { q.dark = 1; const g = q.cv.getContext("2d"); g.globalCompositeOperation = "source-atop"; g.fillStyle = q.big ? "rgba(10,6,4,.22)" : "rgba(12,8,6,.38)"; g.fillRect(0, 0, q.cv.width, q.cv.height); g.globalCompositeOperation = "source-over"; }
  }

  const tk0 = Z.ebenenTick;
  Z.ebenenTick = function (dt) {
    if (tk0) tk0(dt);
    if (Z.level !== lvRef || !props.length) return;
    CLK += dt;
    try { enemyHits(); projHits(); playerTouch(dt); physics(dt); } catch (e) { console.error(e); }
  };

  /* ---------- Zeichnen ---------- */
  function paintBroken(c, p, t, x, y, d, flip) {
    if (p.rest) { c.save(); c.translate(x, y); if (flip) c.scale(-1, 1); c.drawImage(p.rest.cv, p.rest.l, p.rest.t, p.rest.w, p.rest.h); c.restore(); }
    if (p.ghost) { const gh = p.ghost; c.save(); c.translate(x, y); if (flip) c.scale(-1, 1); c.drawImage(gh.cv, gh.l, gh.t, gh.w, gh.h); c.restore(); }
    if (d.at === "c" && p.gone) {
      /* Bügel bleibt, ein Stück Kette/Seil baumelt nach */
      c.save(); c.translate(x, y); if (flip) c.scale(-1, 1);
      if (d.s) { const s = spriteOf(p.kind, p.v); c.drawImage(s.cv, s.l, s.t, s.w, s.h); }
      const a = p.sw ? p.sw.a : Math.sin(t * 1.4 + p.s * 9) * 0.1; c.rotate(a);
      if (p.stub === "kette") kette(c, 0, 1, 0, 7, "#3a3436");
      else if (p.stub === "seil") { seil(c, [0, 1, 0, 6], "#a08050", 0.5); for (let k = 0; k < 3; k++) Ln(c, "#c8a870", 0.2, [0, 6, -0.8 + k * 0.8, 7.6]); }
      else if (p.stub === "faden") Ln(c, "rgba(230,226,236,.45)", 0.3, [0, 0, 0.4, 6]);
      c.restore();
    }
  }
  function drawLayerBack(c, t) {
    /* Pfützen und Flecken unter allem */
    const cam = Z.cam;
    for (const u of PUD) {
      if (u.x < cam.x - 40 || u.x > cam.x + cam.w + 40 || u.y < cam.y - 20 || u.y > cam.y + cam.h + 20) continue;
      const L = LQ[u.lq], a = L[1] * (0.55 + 0.45 * u.wet), hw = u.hw;
      c.save(); c.beginPath(); c.rect(u.run[0], u.y - 4, u.run[1] - u.run[0], 8); c.clip();
      c.fillStyle = "rgba(" + L[0] + "," + a + ")"; c.beginPath(); c.ellipse(u.x, u.y + 0.3, hw, 0.9 + hw * 0.05, 0, 0, TAU); c.fill();
      for (let k = 0; k < 3; k++) { const ox = Math.sin(u.seed + k * 2.1) * hw * 0.7; c.beginPath(); c.ellipse(u.x + ox, u.y + 0.3, hw * 0.3, 0.7, 0, 0, TAU); c.fill(); }
      if (u.wet > 0.05) { c.fillStyle = "rgba(255,240,220," + 0.18 * u.wet + ")"; c.fillRect(u.x - hw * 0.5, u.y - 0.25, hw * 0.6, 0.35); }
      c.restore();
    }
  }
  function drawLayerFront(c, t) {
    const cam = Z.cam, x0 = cam.x - 40, x1 = cam.x + cam.w + 40, y0 = cam.y - 40, y1 = cam.y + cam.h + 60;
    for (const q of PCS) {
      if (q.x < x0 || q.x > x1 || q.y < y0 || q.y > y1) continue;
      c.save(); c.translate(q.x, q.y); c.rotate(q.r); c.scale(q.f, q.sy);
      if (q.a < 1) c.globalAlpha = q.a;
      c.drawImage(q.cv, -q.w / 2, -q.h / 2, q.w, q.h);
      if (q.glut > 0) { c.globalCompositeOperation = "lighter"; c.globalAlpha = Math.min(1, q.glut / 3) * (0.6 + 0.4 * Math.sin(t * 7 + q.ph)); c.drawImage(q.cv, -q.w / 2, -q.h / 2, q.w, q.h); }
      c.restore();
      if (q.lit && !q.landed && !simple()) Z.ausFlamme(q.x, q.y - q.h * 0.2, 0.5, q.ph, "w");
    }
    for (const q of DROPS) { if (q.x < x0 || q.x > x1 || q.y < y0 || q.y > y1) continue; c.fillStyle = "rgba(" + LQ[q.lq][0] + ",.85)"; c.fillRect(q.x - 0.45, q.y - 0.9, 0.9, 1.8); }
    /* Strahl aus dem Leck */
    for (const e of EMIT) { if (e.x < x0 || e.x > x1) continue; const k = 1 - e.t / e.life; c.strokeStyle = "rgba(" + LQ[e.lq][0] + "," + (0.75 * k) + ")"; c.lineWidth = 0.6 + k * 0.8; c.beginPath(); c.moveTo(e.x, e.y); const vx = e.dir * 45 * (0.4 + k); for (let s = 0.05; s < 0.6; s += 0.05) { const xx = e.x + vx * s, yy = e.y + 450 * s * s; if (yy > groundY(e.x, e.y) ) break; c.lineTo(xx, yy); } c.stroke(); }
    for (const s of SPID) { if (s.x < x0 || s.x > x1) continue; const lg2 = Math.sin(s.t * 40 + s.ph) * 0.6; c.globalAlpha = Math.min(1, (s.life - s.t) * 3); E(c, s.x, s.y - 1, 1.1, 0.8, "#2a2028"); for (const sd of [-1, 1]) for (let k = 0; k < 3; k++) Ln(c, "#1a1418", 0.25, [s.x + sd * 0.4, s.y - 1, s.x + sd * (1.6 + k * 0.3), s.y - 0.2 + (k % 2 ? lg2 : -lg2) * 0.4]); c.globalAlpha = 1; }
    for (const s of SMOKE) { const u = s.t / s.life; for (let k = 0; k < 3; k++) { const uu = Math.min(1, u + k * 0.12); E(c, s.x + Math.sin(uu * 6 + s.ph) * 2 * uu + (Z.windX || 0) * uu * 0.05, s.y - uu * 14, 0.6 + uu * 2.4, 0.6 + uu * 2.4, "rgba(120,112,108," + 0.22 * (1 - uu) * Math.min(1, s.t * 4) + ")"); } }
    for (const f of FIRES) { if (f.t < 0) continue; const k = Math.min(1, f.t * 4) * Math.min(1, (f.life - f.t) / 0.8); Z.ausFlamme(f.x, f.y - 0.5, f.s * k, f.ph, "w"); if (lvl() >= 2) Z.ausSchein(f.x, f.y - 3, 9 * k, 0.25 * k, "e"); if (rnd() < 0.08 && Z.fx) Z.fx.p({ x: f.x, y: f.y - 5, vx: (rnd() - 0.5) * 8, vy: -14, life: 1.2, size: 2.4, col: "rgba(90,84,82,.5)", kind: "smoke", g: -6, drag: 0.96 }); }
  }

  /* ---------- Schnittstellen für andere Module ---------- */
  /* Flammen der Requisiten (Weltkoordinaten), die gerade sichtbar sind: { x, y, s (Größe), k (Art), col ("r,g,b"), l (Neigung), v (Neigungsgeschwindigkeit), p, i }.
     Andere Module dürfen v anstoßen (v += …) – integriert wird hier. Dazu die kurzen Flämmchen am Boden (ohne l/v). */
  Z.ausstattungFlammen = () => {
    const out = []; if (Z.level !== lvRef) return out;
    for (const p of props) if (p.fst && !p.out && !p.broken) for (const st of p.fst) if (st && st.seen > TT - 0.3) out.push(st);
    for (const f of FIRES) if (f.t > 0) out.push({ x: f.x, y: f.y, s: f.s, k: "w", col: FCOL.w, l: 0, v: 0, floor: true });
    return out;
  };
  /* Schwingfähiges (Ketten, Seile, Fäden, Stoffbahnen): { x, y (Aufhängung, Welt), len, a (Winkel), va, kind, p }.
     Anstoßen über va += …; Feder und Dämpfung rechnet die Ausstattung. */
  Z.ausstattungKetten = () => (Z.level === lvRef ? swingList.filter(s => s.kind !== "nagel" && !s.p.broken && !s.p.gone) : []);
  /* allgemeiner Stoß an einer Stelle (Stärke s≈0..1.5): Flammen neigen sich, Ketten schwingen, Tiere fliehen */
  Z.ausstattungImpuls = (x, y, s, dir) => { try { impulse(x, y, s || 0.5, dir || 0); } catch (e) { console.error(e); } };
  /* ein Rechteck trifft die Ausstattung (z. B. für neue Waffen oder Fallen) */
  Z.ausstattungTreffer = (r, o) => hitArea(r, Object.assign({ hits: 1, dir: 0 }, o || {}));
  Z._zerbr = { C, MAT, LQ, HANG, rectOf, hitProp, breakProp: p => { const cfg = C[p.kind]; if (!cfg || p.broken) return; const r = rectOf(p); breakProp(p, { hits: 9, dir: 1, x: r.x + r.w / 2, y: r.y + r.h / 2 }, r, cfg, MAT[cfg.m] || MAT.holz); }, state: () => ({ pieces: PCS.length, flying: PCS.filter(q => q.st < 2).length, drops: DROPS.length, puddles: PUD.length, fires: FIRES.length, emit: EMIT.length, broken: props.filter(p => p.broken).length, swings: swingList.length }), lists: () => ({ PCS, PUD, FIRES, DROPS }) };

  /* nach dem Aufbau eines Gebiets: Schwinger anlegen, Listen leeren */
  function initBreak() {
    resetBreak(); SPID.length = 0; CLK = 0;
    for (const p of props) {
      const cfg = C[p.kind], d = K[p.kind]; if (!cfg || d.crit || !(cfg.swing || (d.at === "w" && (cfg.wf === "fall" || cfg.wf === "paper" || cfg.wf === "roll")))) continue;
      const X = p.x * T + 8, Y = d.at === "c" ? p.y * T : (p.y + 1) * T;
      let len = 20;
      if (HANG[p.kind]) len = HANG[p.kind](p.v)[3]; else if (d.box) len = d.box[3] - d.box[1];
      const sw = { p, x: X, y: d.at === "w" && d.box ? Y + d.box[1] + 3 : Y, len, a: 0, va: 0, rest: 0, kind: cfg.swing || "nagel", k: d.at === "c" ? 900 / (len + 10) : 140, c: d.at === "c" ? 0.9 : 2.6 };
      p.sw = sw; swingList.push(sw);
    }
  }

  /* Flammen/Schein/Licht in Weltkoordinaten für andere Module (z. B. Spuren) */
  Z.ausFlamme = (x, y, s, ph, k) => { const a = cx0, b = cy0, f = cf0, v = cvis; cx0 = x; cy0 = y; cf0 = 1; cvis = Z.sightAt ? Math.min(1, Z.sightAt(x, y - 6) * 1.4) : 1; fl(0, 0, s, ph, k); cx0 = a; cy0 = b; cf0 = f; cvis = v; };
  Z.ausSchein = (x, y, r, al, k) => { const a = cx0, b = cy0, f = cf0, v = cvis; cx0 = x; cy0 = y; cf0 = 1; cvis = Z.sightAt ? Math.min(1, Z.sightAt(x, y - 6) * 1.4) : 1; glow(0, 0, r, al, k); cx0 = a; cy0 = b; cf0 = f; cvis = v; };
  Z.ausLicht = (x, y, r, al) => { const a = cx0, b = cy0, f = cf0; cx0 = x; cy0 = y; cf0 = 1; hole(0, 0, r, al); cx0 = a; cy0 = b; cf0 = f; };
  Z.ausstattung = () => props;
  /* Prüfhilfe: einzelnes Stück an den Ursprung malen */
  Z._aus = { K, SETS, SCN, spriteOf, SPR, FGD, fgSprite, paint: (c, kind, v, f, t) => { FQn = GQn = HQn = 0; cvis = 1; const p = { kind, v: v || 0, s: (v || 0) / 3 + 0.1, f: f || 1, x: 0, y: 0, ra: -40, rb: 40, fall: 60 }; paint(c, p, t || 0, 0, 0); flush(c, t || 0); }, flushNow: flush };
})();
