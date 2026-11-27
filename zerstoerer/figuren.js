/* Ezekiel – The Destroyer · Figuren
   Alles wird mit Vektoren gezeichnet: Ezekiel (mit Umhangphysik), Gegner, Bosse, Gefährten, Waffen und Symbole.
   Koordinaten lokal: Ursprung zwischen den Füßen, Blick nach rechts (+x), y wächst nach unten.
   Ezekiel wird über ein Posen-System gezeichnet: Jeder Zustand (Laufen, Springen, Schlag …) legt Zielwerte
   für Hüfte, Oberkörper, Füße und Hände fest; Beine und Arme folgen per Zwei-Gelenk-IK. Beim Wechsel des
   Zustands wird kurz überblendet, damit die Bewegung flüssig bleibt. */
(function () {
  "use strict";
  const Z = window.Z, U = Z.U, PI = Math.PI, TAU = PI * 2;

  /* ---------- Zeichenhilfen ---------- */
  function limb(c, x1, y1, x2, y2, w, col) { c.strokeStyle = col; c.lineWidth = w; c.lineCap = "round"; c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.stroke(); }
  function circ(c, x, y, r, col) { c.fillStyle = col; c.beginPath(); c.arc(x, y, r, 0, PI * 2); c.fill(); }
  function poly(c, pts, col) { c.fillStyle = col; c.beginPath(); c.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 2) c.lineTo(pts[i], pts[i + 1]); c.closePath(); c.fill(); }
  function ell(c, x, y, rx, ry, col, rot) { c.fillStyle = col; c.beginPath(); c.ellipse(x, y, Math.max(0.01, rx), Math.max(0.01, ry), rot || 0, 0, PI * 2); c.fill(); }
  /* Linienzug (offen) */
  function line(c, pts, w, col) { c.strokeStyle = col; c.lineWidth = w; c.lineCap = "round"; c.lineJoin = "round"; c.beginPath(); c.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 2) c.lineTo(pts[i], pts[i + 1]); c.stroke(); }
  /* Leuchten: vorgerenderte Verläufe je Farbe (deutlich schneller als jedes Mal einen Verlauf zu bauen) */
  /* Viele Aufrufer bauen die Farbe mit wechselnder Deckkraft („rgba(255,90,60,0.37)“). Früher entstand dafür
     jedes Mal eine neue Leinwand (Cache lief über) – jetzt: Farbe zerlegen, ein Sprite je Grundfarbe (Deckkraft 1),
     die Deckkraft geht über globalAlpha. Ergebnis identisch (Verlauf Farbe → transparentes Schwarz). */
  const GLOW = new Map(), PARSE = new Map();
  function parseCol(col) {
    let v = PARSE.get(col); if (v) return v;
    const m = /^rgba\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*\)$/.exec(col);
    v = m ? ["rgb(" + (+m[1] | 0) + "," + (+m[2] | 0) + "," + (+m[3] | 0) + ")", Math.max(0, Math.min(1, +m[4]))] : [col, 1];
    if (PARSE.size > 4000) PARSE.clear(); PARSE.set(col, v); return v;
  }
  function baseSprite(key, col) {
    let cv = GLOW.get(key); if (cv) return cv;
    cv = document.createElement("canvas"); cv.width = cv.height = 64; const g = cv.getContext("2d");
    const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, col); gr.addColorStop(1, "rgba(0,0,0,0)"); g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
    if (GLOW.size > 400) GLOW.clear(); GLOW.set(key, cv); return cv;
  }
  /* für andere Module (zeichnen direkt mit drawImage): Deckkraft in 1/32-Stufen eingebacken */
  function glowSprite(col) {
    const [rgb, a] = parseCol(col); if (a >= 1) return baseSprite(rgb, rgb);
    const q = Math.round(a * 32) / 32, m = /\((.*)\)/.exec(rgb)[1];
    return baseSprite(rgb + "@" + q, "rgba(" + m + "," + q + ")");
  }
  function glow(c, x, y, r, col, a) {
    if (r <= 0) return;
    const [rgb, ca] = parseCol(col); if (ca <= 0) return;
    const pa = c.globalAlpha, po = c.globalCompositeOperation;
    c.globalCompositeOperation = "lighter"; c.globalAlpha = pa * (a == null ? 1 : a) * ca;
    c.drawImage(baseSprite(rgb, rgb), x - r, y - r, r * 2, r * 2);
    c.globalAlpha = pa; c.globalCompositeOperation = po;
  }
  Z.glowSprite = glowSprite;
  /* Zwei-Glieder-Arm/Bein per Winkel; gibt Endpunkt zurück */
  function seg2(c, x, y, a1, l1, a2, l2, w, col, col2) {
    const x1 = x + Math.cos(a1) * l1, y1 = y + Math.sin(a1) * l1, x2 = x1 + Math.cos(a2) * l2, y2 = y1 + Math.sin(a2) * l2;
    limb(c, x, y, x1, y1, w, col); limb(c, x1, y1, x2, y2, w * 0.85, col2 || col);
    return [x2, y2, x1, y1];
  }
  Z.draw = { limb, circ, poly, ell, glow, seg2 };

  /* ---------- Mathe ---------- */
  const cl = (v, a, b) => (v < a ? a : v > b ? b : v);
  const lp = (a, b, k) => a + (b - a) * k;
  const eo = k => 1 - (1 - k) * (1 - k);
  const eio = k => (k < 0.5 ? 2 * k * k : 1 - 2 * (1 - k) * (1 - k));
  const eb = k => { const s = 1.6; k -= 1; return k * k * ((s + 1) * k + s) + 1; };
  /* Zwei-Gelenk-IK: Ansatz (x1,y1) → Ziel (x2,y2). bend +1 knickt nach vorn (Knie), −1 nach hinten/unten (Ellbogen).
     Liefert [Gelenk x, Gelenk y, End x, End y]; zu weite Ziele werden auf die Reichweite gekürzt. */
  function ik(x1, y1, x2, y2, l1, l2, bend) {
    let dx = x2 - x1, dy = y2 - y1, d = Math.hypot(dx, dy);
    const max = l1 + l2 - 0.02;
    if (d > max) { dx *= max / d; dy *= max / d; d = max; }
    if (d < 0.05) { d = 0.05; dy = 0.05; dx = 0; }
    const a = Math.acos(cl((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d), -1, 1));
    const b = Math.atan2(dy, dx) - a * bend;
    return [x1 + Math.cos(b) * l1, y1 + Math.sin(b) * l1, x1 + dx, y1 + dy];
  }
  /* kleines, deterministisches Rauschen (für Zittern ohne Math.random) */
  const jit = (t, s) => Math.sin(t * 61.3 + s) * Math.sin(t * 37.1 + s * 2.3);

  /* ======================= WAFFEN IN DER HAND ======================= */
  /* zeichnet die Waffe am Ursprung, Griff am Ursprung, Klinge entlang +x */
  function weapon(c, icon, col, t, ext) {
    switch (icon) {
      case "sickles": case "sickle":
        limb(c, -3, 0, 3, 0, 2.2, "#2a1a16"); limb(c, -1.6, 0, 1.6, 0, 2.5, "#5a2622"); circ(c, -3.4, 0, 1.2, "#6a5a50");
        c.lineCap = "round";
        c.strokeStyle = "#8a8280"; c.lineWidth = 2.4; c.beginPath(); c.arc(6.5, -5, 7, 0.55, 2.65); c.stroke();
        c.strokeStyle = "#e8e0d8"; c.lineWidth = 0.8; c.beginPath(); c.arc(6.5, -5, 8, 0.62, 2.45); c.stroke();
        c.strokeStyle = col; c.lineWidth = 0.6; c.beginPath(); c.arc(6.5, -5, 5.9, 0.8, 2.3); c.stroke();
        poly(c, [12.2, -1.2, 14.2, -3.4, 12.4, -0.2], "#e8e0d8"); break;
      case "dagger":
        limb(c, -3, 0, 2, 0, 2, "#2a1e2a"); limb(c, -2, 0, 0, 0, 2.3, "#4a3040"); circ(c, -3.3, 0, 1, col);
        limb(c, 2, -3, 2, 3, 1.3, "#8a7a6a"); circ(c, 2, -3, 0.7, col); circ(c, 2, 3, 0.7, col);
        poly(c, [2.6, -1.6, 11, -0.8, 13.5, 0, 11, 0.8, 2.6, 1.6], "#c8c0d0"); limb(c, 3, -0.2, 11, -0.2, 0.5, "#f4f0ff"); break;
      case "dawn": {
        limb(c, -5, 0, 3, 0, 2.4, "#5a3a1a"); for (let i = -4; i < 3; i += 2) limb(c, i, -1.1, i + 1, 1.1, 0.5, "#e5b454"); circ(c, -5.4, 0, 1.6, "#ffd27a");
        poly(c, [3, -1, 2, -5, 4.5, -2.4, 4.5, 2.4, 2, 5, 3, 1], "#e5b454");
        poly(c, [4, -2.2, 26, -1.4, 30, 0, 26, 1.4, 4, 2.2], "#fff4d8"); limb(c, 5, 0, 26, 0, 0.8, "#ffd27a");
        glow(c, 16, 0, 18, "rgba(255,220,140,.55)"); circ(c, 4.5, 0, 1.1, "#ff9a3a"); break;
      }
      case "hammer":
        limb(c, -5, 0, 18, 0, 2.4, "#5a4030"); for (let i = -4; i < 6; i += 2) limb(c, i, -1.2, i + 1, 1.2, 0.5, "#2a1e16");
        poly(c, [14, -7, 24, -7, 25, -5.5, 25, 5.5, 24, 7, 14, 7, 13, 5.5, 13, -5.5], "#5e5e66"); poly(c, [14, -7, 24, -7, 25, -5.5, 13, -5.5], "#9a9aa4");
        poly(c, [24, -7, 25, -5.5, 25, 5.5, 24, 7], "#3e3e46"); limb(c, 19, -5, 19, 5, 1.2, col); circ(c, 19, 0, 1.4, col);
        glow(c, 19, 0, 6, "rgba(255,170,60,.35)"); break;
      case "scythe":
        limb(c, -7, 0, 27, 0, 2, "#4a3020"); limb(c, 6, 0, 6, 3.5, 1.5, "#4a3020"); limb(c, -6, 0, -3, 0, 2.4, "#2a1a12");
        c.fillStyle = "#b8b0b8"; c.beginPath(); c.moveTo(27, 0); c.quadraticCurveTo(29, -18, 8, -23); c.quadraticCurveTo(22, -14, 24, 0); c.fill();
        c.strokeStyle = "#f0e8f0"; c.lineWidth = 0.7; c.beginPath(); c.moveTo(24.5, -1); c.quadraticCurveTo(23, -14, 9, -22); c.stroke();
        c.strokeStyle = col; c.lineWidth = 0.8; c.beginPath(); c.moveTo(26, -2); c.quadraticCurveTo(26.5, -15, 11, -20.5); c.stroke(); circ(c, 26, 0, 1.6, "#3a2a20"); break;
      case "whip":
        limb(c, -3, 0, 4, 0, 2.2, "#3a2a20"); limb(c, -2, 0, 3, 0, 2.6, "#5a3a22"); circ(c, -3.4, 0, 1.2, col);
        if (!ext) { c.strokeStyle = "#8a7a6a"; c.lineWidth = 1.2; c.setLineDash([1.4, 0.8]); c.beginPath(); c.moveTo(4, 0); c.quadraticCurveTo(11, 9, 6, 12); c.quadraticCurveTo(1, 14, 3, 9); c.stroke(); c.setLineDash([]); } break;
      case "spear":
        limb(c, -13, 0, 30, 0, 1.8, "#6a4a30"); limb(c, -13, 0, -11, 0, 2.4, "#3a2a1a"); limb(c, 27, 0, 30, 0, 2.6, "#8a3a2a");
        poly(c, [30, -4.2, 39, -1, 40, 0, 39, 1, 30, 4.2, 32.5, 0], "#d8706a"); poly(c, [30, -4.2, 39, -1, 32.5, 0], "#f0a090");
        limb(c, 30, -4, 34, -7, 1.2, "#e08a80"); limb(c, 30, 4, 33, 6, 1, "#b85a50"); break;
      case "axe":
        limb(c, -5, 0, 17, 0, 2.2, "#5a3a20"); limb(c, -4, 0, -1, 0, 2.6, "#2a1a10");
        c.fillStyle = "#6a5e58"; c.beginPath(); c.moveTo(11.5, -1.5); c.quadraticCurveTo(21, -9, 21, -12); c.quadraticCurveTo(25, -3, 20, 8); c.quadraticCurveTo(19, 4, 11.5, 2); c.fill();
        c.strokeStyle = "#ff8a3a"; c.lineWidth = 1.1; c.beginPath(); c.moveTo(21, -11); c.quadraticCurveTo(24.5, -3, 20, 7.5); c.stroke();
        glow(c, 20, -2, 9, "rgba(255,120,40,.6)"); poly(c, [16, -1.2, 11, -3.5, 13, 0, 11, 3.5, 16, 1.2], "#4a3e3a"); break;
      case "club":
        limb(c, -5, 0, 8, 0, 3, "#5a4030"); limb(c, -5, 0, 0, 0, 3.4, "#3a2a1a");
        poly(c, [7, -3.5, 18, -7, 27, -8, 31, -3, 29, 6, 18, 5.5, 7, 3.5], "#7a6050"); poly(c, [7, -3.5, 18, -7, 27, -8, 29, -5, 18, -4, 8, -1], "#9a7a62");
        for (const [x, y] of [[14, -5], [20, -6.6], [26, -7.6], [22, 5.2], [28, 4.6], [30, -1]]) poly(c, [x - 1, y, x, y + (y < 0 ? -2.6 : 2.6), x + 1, y], "#c8c0b0");
        circ(c, 17, -1, 1.2, "#4a3a2a"); circ(c, 24, 1.5, 1.4, "#4a3a2a"); break;
      case "rapier":
        limb(c, -3, 0, 2, 0, 2, "#3a3020"); circ(c, -3.4, 0, 1.1, "#c8a060");
        c.strokeStyle = col; c.lineWidth = 1.1; c.beginPath(); c.arc(1, 0, 3.2, -1.7, 1.7); c.stroke(); limb(c, 2, -2.4, 2, 2.4, 1, "#c8a060");
        limb(c, 2, 0, 27, 0, 1.2, "#e8f0d0"); limb(c, 19, 0, 27.5, 0, 1.4, col); glow(c, 26, 0, 4, "rgba(170,230,80,.5)"); break;
      case "scimitar":
        limb(c, -3, 0, 2, 0, 2, "#2a1e2a"); circ(c, -3.3, 0, 1, col); limb(c, 2, -2.2, 2, 2.2, 1.2, "#7a6a80");
        c.fillStyle = "#d8d0e8"; c.beginPath(); c.moveTo(2.4, -1.2); c.quadraticCurveTo(12, -4.5, 19, -2); c.quadraticCurveTo(13, 1, 2.4, 1.6); c.fill();
        c.strokeStyle = col; c.lineWidth = 0.6; c.beginPath(); c.moveTo(3, 0.2); c.quadraticCurveTo(12, -2.4, 17, -1.6); c.stroke(); break;
      case "claw": circ(c, 0, 0, 3, "#3a3a30"); poly(c, [1.5, -2.4, 14, -1, 1.5, 0.6], "#d8c040"); poly(c, [1.5, -2.4, 14, -1, 4, -1.2], "#f0e070"); poly(c, [1, 1, 10, 4, 1, 3], "#b8a030"); circ(c, 0, 0, 1.4, "#5a5a40"); break;
      case "anchor":
        limb(c, -3, 0, 21, 0, 2.6, "#6a5a4a"); limb(c, -3, 0, 1, 0, 3, "#3a2e24"); c.strokeStyle = "#8a7a6a"; c.lineWidth = 1.2; c.beginPath(); c.arc(-4.5, 0, 2, 0, TAU); c.stroke();
        c.strokeStyle = "#8a7a6a"; c.lineWidth = 3; c.beginPath(); c.arc(20, 0, 7, -PI / 2 - 1.1, -PI / 2 + 1.1, true); c.stroke();
        c.strokeStyle = "#a89a88"; c.lineWidth = 1; c.beginPath(); c.arc(20, 0, 8, -PI / 2 - 1, -PI / 2 + 1, true); c.stroke();
        poly(c, [13, 5.5, 12, 9, 15.5, 6.5], "#8a7a6a"); poly(c, [13, -5.5, 12, -9, 15.5, -6.5], "#8a7a6a"); limb(c, 5, -4.5, 5, 4.5, 2, "#8a7a6a"); break;
      case "stonefist": circ(c, 2, 0, 5, "#6a5a4c"); circ(c, 3, -1, 3.4, "#8a7a68"); circ(c, 5, 1.5, 1.6, "#7a6a5a"); limb(c, 0, -2, 3, 1, 0.8, "#ffa040"); limb(c, 3, 1, 5.5, -1.5, 0.8, "#ffa040"); glow(c, 2, 0, 7, "rgba(255,150,60,.5)"); break;
      case "fist": circ(c, 1, 0, 3.2, "#3a2e2a"); circ(c, 1.6, -0.6, 1.9, "#4a3a34"); for (let i = -1; i <= 1; i++) poly(c, [3.4, i * 1.4 - 0.5, 5.4, i * 1.4, 3.4, i * 1.4 + 0.5], "#8a7a70"); break;
      case "bow": {
        const dr = ext || 0;
        c.strokeStyle = "#5a3a1e"; c.lineWidth = 2.2; c.lineCap = "round"; c.beginPath(); c.arc(-6, 0, 12, -1.1, 1.1); c.stroke();
        c.strokeStyle = col || "#b89a6a"; c.lineWidth = 0.8; c.beginPath(); c.arc(-6, 0, 12.6, -1.0, 1.0); c.stroke();
        limb(c, -0.5, -2, -0.5, 2, 2.8, "#3a2a1a");
        const tx = -6 + Math.cos(1.1) * 12, ty = Math.sin(1.1) * 12, sx = -6 - dr * 8;
        limb(c, tx, -ty, sx, 0, 0.6, "#e8e0d0"); limb(c, sx, 0, tx, ty, 0.6, "#e8e0d0");
        if (dr > 0.05) { limb(c, sx, 0, 8, 0, 0.9, "#c8a070"); poly(c, [8, -1.6, 11, 0, 8, 1.6], "#e8e0d8"); poly(c, [sx, -1.2, sx + 2.5, 0, sx, 1.2], "#c03a2a"); }
        break;
      }
      case "xbow":
        limb(c, -5, 0, 14, 0, 2.6, "#5a4030"); limb(c, -5, 1, -1, 2.5, 2.2, "#4a3020"); c.strokeStyle = "#6a5a4a"; c.lineWidth = 1.8; c.beginPath(); c.arc(10, 0, 8, -1.3, 1.3); c.stroke();
        limb(c, 4, 0, 10 + Math.cos(1.3) * 8, -Math.sin(1.3) * 8, 0.6, "#e8e0d0"); limb(c, 4, 0, 10 + Math.cos(1.3) * 8, Math.sin(1.3) * 8, 0.6, "#e8e0d0");
        if (!ext) { limb(c, 4, -0.8, 16, -0.8, 0.9, "#8a7a6a"); poly(c, [16, -2, 18.5, -0.8, 16, 0.4], "#d8d0c8"); } break;
      case "knives": poly(c, [0, -1, 9, 0, 0, 1], "#e0d8d0"); limb(c, -3, 0, 0, 0, 1.4, "#4a3a30"); poly(c, [-1, 2, 7, 3, -1, 4], "#c0b8b0"); limb(c, -3.5, 3, -1, 3, 1.2, "#4a3a30"); break;
      case "vial": circ(c, 3, 0, 3.4, "#e8f0e0"); circ(c, 3, 0.4, 2.6, col); limb(c, 3, -3, 3, -5.4, 1.8, "#e0d8c0"); limb(c, 3, -5.2, 3, -6, 2, "#8a6a40"); circ(c, 2, -0.8, 0.7, "rgba(255,255,255,.8)"); glow(c, 3, 0, 6, "rgba(130,210,110,.5)"); break;
      case "staff":
        limb(c, -11, 0, 21, 0, 1.8, "#5a4a30"); for (let i = -8; i < 14; i += 5) limb(c, i, -1, i + 1, 1, 0.5, "#3a2a1a");
        c.strokeStyle = "#7a6440"; c.lineWidth = 1.4; c.beginPath(); c.arc(23, 0, 3.6, PI * 0.6, PI * 1.4, true); c.stroke();
        circ(c, 23, 0, 2.6, col || "#e8e070"); circ(c, 22.4, -0.7, 0.9, "#fffbe0"); glow(c, 23, 0, 9 + Math.sin(t * 6) * 1.2, "rgba(240,230,110,.6)"); break;
      case "web": ell(c, 3, 0, 5, 3.5, "#d8d0dc"); ell(c, 2.4, -0.8, 3, 1.8, "#f0ecf4"); circ(c, 7, 0, 1.6, "#a8a0b0"); limb(c, 0, 0, -3, 2, 0.5, "#e0dce8"); break;
      case "shield": c.fillStyle = "#5a4a3a"; c.fillRect(-2, -12, 7, 24); c.fillStyle = "#8a7a62"; c.fillRect(-1, -11, 5, 22); limb(c, 1.5, -11, 1.5, 11, 1, "#c8a060"); limb(c, -1, -4, 4, -4, 0.8, "#6a5a48"); limb(c, -1, 4, 4, 4, 0.8, "#6a5a48"); for (const y of [-9, 0, 9]) circ(c, 3, y, 0.7, "#c8c0b0"); break;
      case "goldshield": ell(c, 1, 0, 5, 11, "#a8701a"); ell(c, 1.5, 0, 3.8, 9.4, "#ffd27a"); ell(c, 2.2, -2, 1.4, 4, "rgba(255,255,230,.7)"); circ(c, 1.5, 0, 2, "#e0a040"); break;
      case "thornshield": ell(c, 1, 0, 5, 10, "#4a3a22"); ell(c, 1.5, 0, 3.6, 8.4, "#6a5a32"); for (let i = -8; i <= 8; i += 4) poly(c, [5, i - 1, 9, i, 5, i + 1], "#8a6a3a"); break;
      default: if (Z.WICON && Z.WICON[icon]) Z.WICON[icon](c, col, t);
    }
  }
  Z.drawWeapon = weapon;
  /* Waffengattungen für die Haltung */
  const W2H = { dawn: 1, hammer: 1, scythe: 1, club: 1, anchor: 1, axe: 1, zweihaender: 1, kampfstab: 1, hellebarde: 1, spear: 1, staff: 1, eiszapfen: 1 };
  const DUAL = { sickles: 1, sickle: 1, scimitar: 1, fist: 1, stonefist: 1, krallen: 1 };
  const FISTS = { fist: 1, stonefist: 1, krallen: 1 };
  /* Wo liegt der zweite Griff entlang der Waffe (für die hintere Hand)? */
  const GRIP2 = { spear: -7, hellebarde: -7, kampfstab: -6, scythe: -5, staff: -6, eiszapfen: -6, dawn: -3, zweihaender: -3, hammer: -4, club: -3, anchor: -2, axe: -3 };

  /* ======================= EZEKIEL ======================= */
  /* Farben der Rüstung (bewusst warm: Schwarzrot, Knochen, Glut) */
  const EZ = {
    plate: "#241a1d", plate2: "#30242a", edge: "#4a3638", dark: "#160f11", leg: "#1c1416", leg2: "#241a1d",
    hood: "#8a1616", hood2: "#5e0f10", horn: "#140d0f", hornHi: "#3e2c2e", bone: "#d6c8ae", bone2: "#a89a80",
    belt: "#3a2a22", glow: "#ff6a1a", glowHi: "#ffc070", cloth: "#7a1414", cloth2: "#4e0c0e"
  };
  const CAPE_N = 8, CAPE_L = 3.0;
  /* W30 Grafik: feinere Ezekiel-Animation (Landungen, Rutschen, Treffer je Richtung, Rolle, Umhang, Waffenspuren je Waffe, Leerlauf, Blick). Schalter Z.gfx.off.w30ez */
  const w30on = () => !(Z.gfx && Z.gfx.off && Z.gfx.off.w30ez);
  function capeInit(P) { P.cape = []; for (let i = 0; i < CAPE_N; i++) P.cape.push({ x: P.x + P.w / 2, y: P.y + 6 + i * CAPE_L, ox: P.x + P.w / 2, oy: P.y + 6 + i * CAPE_L }); }
  Z.capeUpdate = function (P, dt) {
    if (!P.cape || P.cape.length !== CAPE_N) capeInit(P);
    const pts = P.cape;
    const roll = P.rollT > 0;
    /* Ansatzpunkt: der Nacken der zuletzt gezeichneten Pose (sonst Näherung) */
    const A = P.capeA;
    let ax, ay;
    if (A && !roll) { ax = A.x; ay = A.y; }
    else { ax = P.x + P.w / 2 - P.face * 3; ay = P.y + (roll ? P.h - 9 : P.crouch ? 4 : 7); }
    pts[0].x = ax; pts[0].y = ay;
    /* Wind: Grundwind + Böen; Fahrtwind entsteht von selbst durch die Verlet-Trägheit */
    /* Böen draußen kräftiger als drinnen; dazu sanftes Atmen des Stoffs */
    const outside = !!(Z.level && (Z.level.out || (Z.biome && Z.biome.open)));
    const gust = (Math.sin(P.time * 2.3) * 8 + Math.sin(P.time * 5.7 + 1) * 3 + Math.sin(P.time * 0.7) * 4) * (outside ? 1 : 0.45);
    /* W11 R17: Zugluft aus Schächten (effekte.js setzt Z.zugWind im Raum des Spielers) */
    const wind = (Z.windX || 0) + gust + (Z.zugWind || 0);
    /* W11 R17: Absprung reißt den Umhang nach unten, Landung lässt ihn nachsacken und kurz aufschlagen */
    const airNow = !P.onGround;
    if (P._capeAir !== undefined && airNow !== P._capeAir) {
      const jump = airNow && P.vy < -150, land = !airNow && (P._capeVy || 0) > 250;
      if (jump || land) for (let i = 1; i < CAPE_N; i++) { const f = i / CAPE_N, q = pts[i]; if (jump) q.oy -= 2.2 * f; else { q.oy -= 1.6 * f; q.ox += P.face * 1.2 * f; } }
    }
    P._capeAir = airNow; P._capeVy = P.vy;
    const w30 = w30on(); /* W30 Grafik: träger, schwingt länger nach; beim Wenden schwingt er herum statt umzuklappen */
    const damp = w30 ? (P.onGround ? 0.93 : 0.95) : P.onGround ? 0.9 : 0.93;
    if (w30 && P._capeFace != null && P._capeFace !== P.face && !roll) for (let i = 1; i < CAPE_N; i++) { const f = i / CAPE_N; pts[i].ox += P.face * 2.4 * f; pts[i].oy += 0.8 * f; }
    P._capeFace = P.face;
    /* Fahrtwind-Flattern (Welle läuft den Umhang hinunter) und Ruck beim Zurechtschütteln */
    const spd = Math.min(1, Math.abs(P.vx) / 160) + (P.onGround ? 0 : Math.min(0.6, Math.abs(P.vy) / 600));
    const kick = P.capeKick > 0 ? P.capeKick : 0;
    if (kick > 0) P.capeKick = Math.max(0, kick - dt * 1.4);
    for (let i = 1; i < CAPE_N; i++) {
      const p = pts[i]; const vx = (p.x - p.ox) * damp, vy = (p.y - p.oy) * damp;
      p.ox = p.x; p.oy = p.y;
      const f = i / CAPE_N;
      const flut = spd > 0.2 ? Math.sin(P.time * 17 - i * 1.1) * spd * f * 0.32 : 0;
      p.x += vx + (wind - P.face * (4 + 10 * Math.min(1, spd))) * dt * dt * 60; p.y += vy + 400 * dt * dt + flut;
      if (kick > 0) { p.x += Math.sin(P.time * 31 + i * 0.8) * kick * f * 0.9; p.y -= kick * f * 0.35; }
    }
    const bx = P.x + P.w / 2;
    for (let k = 0; k < 3; k++) for (let i = 1; i < CAPE_N; i++) {
      const a = pts[i - 1], b = pts[i], dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 1, diff = (d - CAPE_L) / d;
      b.x -= dx * diff; b.y -= dy * diff;
      /* nicht vor den Körper schwingen */
      if (!roll && !P.dead) {
        if (P.face > 0 && b.x > bx - 1) b.x = U.lerp(b.x, bx - 1, 0.35);
        if (P.face < 0 && b.x < bx + 1) b.x = U.lerp(b.x, bx + 1, 0.35);
      }
      if (Z.world && Z.world.solidAt(b.x, b.y)) { b.y -= 1; }
      /* W30 Grafik: Biegesteifigkeit – kein Abknicken, die Welle läuft weich durch */
      if (w30 && i >= 2) { const a2 = pts[i - 2], ex = b.x - a2.x, ey = b.y - a2.y, dd = Math.hypot(ex, ey) || 1, mn = CAPE_L * 1.55; if (dd < mn) { const q = (mn - dd) / dd * 0.5; b.x += ex * q; b.y += ey * q; } }
    }
  };
  function drawCape(c, P, alpha, time, glowK) {
    const pts = P.cape; if (!pts) return;
    const N = pts.length, w0 = 7.6;
    const col0 = (Z.capeCol && Z.capeCol[0]) || "#8a1414", col1 = (Z.capeCol && Z.capeCol[1]) || "#4a0a0c";
    c.save(); c.globalAlpha = alpha;
    const L = CL, R = CR;
    for (let i = 0; i < N; i++) {
      const p = pts[i], q = pts[Math.min(N - 1, i + 1)], r0 = pts[Math.max(0, i - 1)];
      const dx = q.x - r0.x, dy = q.y - r0.y, d = Math.hypot(dx, dy) || 1, nx = -dy / d, ny = dx / d;
      const w = w0 * (0.5 + i / N * 0.75) * (i === 0 ? 0.8 : 1);
      L[i * 2] = p.x + nx * w * 0.5; L[i * 2 + 1] = p.y + ny * w * 0.5; R[i * 2] = p.x - nx * w * 0.5; R[i * 2 + 1] = p.y - ny * w * 0.5;
    }
    /* Grundfläche */
    const outline = () => {
      c.beginPath(); c.moveTo(L[0], L[1]);
      for (let i = 1; i < N; i++) c.lineTo(L[i * 2], L[i * 2 + 1]);
      /* ausgefranster Saum */
      const lx = L[(N - 1) * 2], ly = L[(N - 1) * 2 + 1], rx = R[(N - 1) * 2], ry = R[(N - 1) * 2 + 1];
      for (let k = 0; k <= 6; k++) { const t = k / 6; c.lineTo(lp(lx, rx, t) + Math.sin(P.time * 9 + k * 1.7) * 0.6, lp(ly, ry, t) + (k % 2 ? 2.6 + Math.sin(P.time * 7 + k) * 0.6 : -0.4)); }
      for (let i = N - 1; i >= 0; i--) c.lineTo(R[i * 2], R[i * 2 + 1]);
      c.closePath();
    };
    c.fillStyle = col1; outline(); c.fill();
    /* hellere Außenseite: schmalerer Streifen auf der Körperseite */
    c.fillStyle = col0; c.beginPath(); c.moveTo(L[0], L[1]);
    for (let i = 1; i < N; i++) c.lineTo(lp(L[i * 2], R[i * 2], 0.08), lp(L[i * 2 + 1], R[i * 2 + 1], 0.08));
    for (let i = N - 1; i >= 0; i--) c.lineTo(lp(L[i * 2], R[i * 2], 0.62 - i * 0.04), lp(L[i * 2 + 1], R[i * 2 + 1], 0.62 - i * 0.04));
    c.closePath(); c.fill();
    /* Faltenlinien (Stufe 0: weggelassen – unter einem Pixel breit) */
    if (!(Z.gq && Z.gq.lean && !Z.sprOff)) {
      c.strokeStyle = "rgba(0,0,0,.28)"; c.lineWidth = 0.6; c.beginPath();
      for (let i = 2; i < N; i++) { const m = 0.35 + 0.25 * Math.sin(i * 1.9); c.moveTo(lp(L[i * 2 - 2], R[i * 2 - 2], m), lp(L[i * 2 - 1], R[i * 2 - 1], m)); c.lineTo(lp(L[i * 2], R[i * 2], m + 0.05), lp(L[i * 2 + 1], R[i * 2 + 1], m + 0.05)); }
      c.stroke();
    }
    /* W30 Grafik: Saumborte und Zeichen in der Umhangfarbe (Härte-/Erfolgs-Umhänge sehen sich so ähnlicher) */
    if (w30on() && Z.capeCol && Z.capeCol[0] && Z.capeCol[0] !== "#8a1414" && !(Z.gq && Z.gq.lean)) {
      const trim = Z.capeCol[2] || capeTrim(col0, col1);
      c.strokeStyle = trim; c.lineWidth = 0.9; c.beginPath();
      for (let k = 0; k <= 6; k++) { const t = k / 6, i0 = (N - 2) * 2, i1 = (N - 1) * 2; const x = lp(lp(L[i0], L[i1], 0.75), lp(R[i0], R[i1], 0.75), t), y = lp(lp(L[i0 + 1], L[i1 + 1], 0.75), lp(R[i0 + 1], R[i1 + 1], 0.75), t); k ? c.lineTo(x, y) : c.moveTo(x, y); }
      c.stroke();
      const i = 4, mx = lp(L[i * 2], R[i * 2], 0.4), my = lp(L[i * 2 + 1], R[i * 2 + 1], 0.4);
      c.fillStyle = trim; c.beginPath(); c.moveTo(mx, my - 1.5); c.lineTo(mx + 1.1, my); c.lineTo(mx, my + 1.5); c.lineTo(mx - 1.1, my); c.closePath(); c.fill();
    }
    /* glühende Darkin-Rune auf dem Umhang */
    if (glowK > 0.05) {
      const i = 3, mx = lp(L[i * 2], R[i * 2], 0.45), my = lp(L[i * 2 + 1], R[i * 2 + 1], 0.45);
      const pu = (0.45 + 0.35 * Math.sin(time * 3)) * glowK;
      c.strokeStyle = "rgba(255,110,40," + pu.toFixed(3) + ")"; c.lineWidth = 0.6; c.beginPath(); c.moveTo(mx, my - 1.6); c.lineTo(mx, my + 1.6); c.moveTo(mx - 1.2, my - 0.4); c.lineTo(mx, my + 0.6); c.lineTo(mx + 1.2, my - 0.4); c.stroke();
    }
    c.restore();
  }
  const CL = new Array(32).fill(0), CR = new Array(32).fill(0);
  /* W30 Grafik: Borte = hellere Umhangfarbe, bei hellen Umhängen die dunkle Gegenfarbe (kein Blau: Blauanteil gedeckelt) */
  const TRIM = new Map();
  function capeTrim(a, b) {
    const k = a + b; let r = TRIM.get(k); if (r) return r;
    const h = x => { const n = parseInt(String(x).slice(1), 16) || 0; return [n >> 16 & 255, n >> 8 & 255, n & 255]; };
    const A = h(a), B = h(b), lum = A[0] * 0.3 + A[1] * 0.59 + A[2] * 0.11;
    let c = lum > 150 ? B.map(v => v * 0.8) : A.map(v => Math.min(255, v * 1.5 + 40));
    c[2] = Math.min(c[2], Math.max(c[0], c[1]));
    r = "rgb(" + c.map(v => v | 0).join(",") + ")"; TRIM.set(k, r); return r;
  }

  /* ---------- Posen ---------- */
  /* Geblendete Pose-Werte: Hüfte (hx,hy), Rumpfneigung, Kopfneigung, Füße (relativ zu den Füßen-Ursprung),
     Hände (relativ zur jeweiligen Schulter), Zehenwinkel, Wappenrock-Schwung */
  const PK = ["hx", "hy", "lean", "head", "fFx", "fFy", "fBx", "fBy", "toeF", "toeB", "hFx", "hFy", "hBx", "hBy", "tab"];
  const PST = new WeakMap();
  function pstate(P) { let s = PST.get(P); if (!s) { s = { cur: null, from: null, key: "", bt: 0, bd: 0.1, lt: null, deadT0: null }; PST.set(P, s); } return s; }
  const TG = {}; /* Ziel-Pose (wird jedes Bild neu befüllt) */
  const WI = {}; /* Waffen-Info für das aktuelle Bild */
  const L1 = 5.2, L2 = 5.0, T1 = 6.8, T2 = 6.6; /* Ober-/Unterarm, Ober-/Unterschenkel */
  /* Hand relativ zur Schulter aus Winkeln (s: Oberarm, 0 = nach vorn, PI/2 = nach unten; e: Ellbogen relativ) */
  function setH(T, side, s, e, r) {
    const k = r == null ? 1 : r;
    T["h" + side + "x"] = (Math.cos(s) * L1 + Math.cos(s + e) * L2) * k;
    T["h" + side + "y"] = (Math.sin(s) * L1 + Math.sin(s + e) * L2) * k;
  }
  function poseBase(T) {
    T.hx = 0; T.hy = -12.8; T.lean = 0.04; T.head = 0; T.fFx = 3; T.fFy = 0; T.fBx = -3; T.fBy = 0; T.toeF = 0; T.toeB = 0; T.tab = 0;
    setH(T, "F", PI / 2 - 0.15, -0.35); setH(T, "B", PI / 2 + 0.2, -0.3);
    T.eF = -1; T.eB = -1; T.key = "idle"; T.rot = 0; T.rotY = -13; T.sx = 1; T.sy = 1; T.tuck = 0; T.blendD = 0.1;
  }
  /* Fußbahn im Lauf: Bodenkontakt (Fuß wandert unter dem Körper nach hinten), dann Schwung mit Fersenheben */
  const ST = 0.3;
  function runFoot(u, amp, out) {
    if (u < ST) { const s = u / ST; out[0] = lp(6.2, -6.2, s) * amp; out[1] = 0; out[2] = s > 0.7 ? (s - 0.7) * 1.6 : 0; }
    else {
      const s = (u - ST) / (1 - ST);
      out[0] = lp(-6.2, 6.6, eio(s)) * amp; out[1] = -Math.pow(Math.sin(PI * Math.pow(s, 0.8)), 1.1) * 5.6 * amp - (s < 0.35 ? s * 3 : 0) * amp;
      out[2] = s < 0.5 ? 0.9 - s : -0.25;
    }
    return out;
  }
  const FA = [0, 0, 0], FB = [0, 0, 0];

  /* Zielpose aus dem Spielerzustand. Liefert Waffen-Info in WI. */
  function computePose(T, P, time, S) {
    const A = P.anim, act = P.act;
    poseBase(T);
    WI.icon = null; WI.col = "#fff"; WI.ang = 0; WI.ext = 0; WI.icon2 = null; WI.ang2 = 0; WI.grip2 = null; WI.hand2Icon = null; WI.back = null; WI.glowHand = null; WI.shieldBack = null; WI.bowDraw = 0; WI.punchBack = false; WI.hand2Col = null; WI.hurt = 0; WI.flask = 0; WI.wallHands = false; WI.headTurn = 0;
    const speed = Math.abs(P.vx);
    const run = P.onGround && speed > 30 && !(act && act.phase !== "post" && act.type !== "shield" && act.type !== "charge");
    const dead = P.dead;
    /* ---- Tod ---- */
    if (dead) {
      if (S.deadT0 == null) S.deadT0 = time;
      const kd = time - S.deadT0;
      const k1 = eo(cl(kd / 0.28, 0, 1)), k2 = cl((kd - 0.28) / 0.42, 0, 1);
      T.key = "dead"; T.blendD = 0.08;
      T.hy = lp(-12.8, -6.6, k1); T.lean = lp(0.2, 0.75, k1); T.head = lp(-0.3, 0.6, k1); T.fFx = 3.5; T.fBx = -2.5; T.toeB = 0.8 * k1;
      setH(T, "F", PI / 2 - 0.5 * k1, -0.2); setH(T, "B", PI / 2 - 0.2, -0.1);
      if (k2 > 0) { const kk = eb(k2); T.rot = kk * 0.84; T.rotY = -1.5; T.hy = lp(-6.6, -5.6, k2); T.fFx = lp(3.5, 1.5, k2); T.fBx = lp(-2.5, -4, k2); setH(T, "F", lp(PI / 2 - 0.5, -0.2, k2), -0.1); setH(T, "B", lp(PI / 2 - 0.2, 0.1, k2), 0); T.head = lp(0.6, 0.2, k2); }
      return;
    }
    S.deadT0 = null;
    /* ---- Leiter ---- */
    if (P.climbing) {
      const ph = (A.climb || 0) * TAU, s = Math.sin(ph);
      T.key = "climb"; T.hy = -13.6 - s * 0.3; T.lean = -0.04; T.head = -0.25;
      T.fFx = 2.2; T.fFy = -1.5 - 3 * (0.5 + 0.5 * s); T.fBx = 1.2; T.fBy = -1.5 - 3 * (0.5 - 0.5 * s); T.toeF = 0.3; T.toeB = 0.3;
      T.hFx = 2.4; T.hFy = -5.5 + 3 * s; T.hBx = 1.6; T.hBy = -5.5 - 3 * s; T.eF = -1; T.eB = -1;
      return;
    }
    /* ---- Kante hochziehen ---- */
    if (P.ledge) {
      const l = P.ledge, k = cl(l.t / (l.dur || 0.17), 0, 1);
      const cx = P.x + P.w / 2, fy = P.y + P.h;
      const edgeX = P.face > 0 ? l.x1 - 1 : l.x1 + P.w + 1;
      const ex = (edgeX - cx) * P.face, ey = (l.y1 + P.h) - fy;
      T.key = "ledge"; T.blendD = 0.04;
      T.lean = lp(0.15, 0.45, k); T.head = -0.2 + k * 0.3; T.hy = -13.2;
      /* Hände greifen die Kante (relativ zur Schulter wird unten in der Zeichnung umgerechnet) */
      T.handAbsF = [ex + 1.5, ey]; T.handAbsB = [ex + 0.5, ey];
      if (k < 0.45) { T.fFx = 2.5; T.fFy = -1 - k * 6; T.fBx = -1; T.fBy = 0.5; T.toeF = 0.6; T.toeB = 0.8; }
      else { const kk = (k - 0.45) / 0.55; T.fFx = lp(ex - 1, 3, kk); T.fFy = lp(ey, 0, kk); T.fBx = lp(-1, -3, kk); T.fBy = lp(0, 0, kk); T.hy = lp(-9, -12.8, kk); T.lean = lp(0.5, 0.1, kk); }
      return;
    }
    /* ---- Boden / Luft: Grundhaltung ---- */
    if (P.onGround) {
      if (P.crouch) {
        T.key = "crouch"; T.hy = -7.4; T.lean = 0.42; T.head = -0.3; T.fFx = 4.4; T.fBx = -3.2; T.toeB = 0.5;
        setH(T, "F", 0.8, -0.8); setH(T, "B", 1.1, -0.5);
        if (speed > 8) { const u = (A.run * 0.9) % 1; runFoot(u, 0.45, FA); runFoot((u + 0.5) % 1, 0.45, FB); T.fFx = 2.6 + FA[0]; T.fFy = FA[1] * 0.6; T.fBx = -2 + FB[0]; T.fBy = FB[1] * 0.6; T.hy = -7.4 - Math.abs(Math.sin(u * TAU)) * 0.4; T.key = "crawl"; }
      } else if (run) {
        const amp = cl(speed / 156, 0.45, 1);
        const u = (A.run * 0.5) % 1, f = (u * 2) % 1;
        runFoot(u, amp, FA); runFoot((u + 0.5) % 1, amp, FB);
        T.key = "run"; T.fFx = FA[0] + 0.6; T.fFy = FA[1]; T.toeF = FA[2]; T.fBx = FB[0] - 0.4; T.fBy = FB[1]; T.toeB = FB[2];
        T.hy = -12.5 + Math.cos(TAU * (f - ST / 2)) * 1.0 * amp; T.hx = 0.6 * amp;
        T.lean = 0.08 + 0.18 * amp + Math.sin(TAU * f) * 0.03; T.head = -0.12 * amp;
        const sw = Math.cos(TAU * u) * 0.95 * amp;
        setH(T, "F", PI / 2 + sw, -1.35 * amp - 0.2); setH(T, "B", PI / 2 - sw, -1.35 * amp - 0.2);
        T.tab = -0.7 * amp;
      } else {
        /* Stehen: Atmen und leichte Gewichtsverlagerung */
        const br = Math.sin(A.t * 2.2), sw = Math.sin(A.t * 0.9);
        T.hx = sw * 0.35; T.hy = -12.7 + br * 0.22; T.lean = 0.05 + br * 0.012; T.head = -0.04 + Math.sin(A.t * 0.6) * 0.05;
        T.fFx = 3.2; T.fBx = -3.1; T.tab = Math.sin(A.t * 1.3) * 0.08;
        setH(T, "F", PI / 2 - 0.18 + br * 0.03, -0.4); setH(T, "B", PI / 2 + 0.22 - br * 0.03, -0.3);
        if (P.lookDown) { T.key = "look"; T.hy = -10.6; T.lean = 0.3; T.head = 0.45; T.fFx = 3.6; }
        else if (P.lookUp) { T.key = "look"; T.head = -0.45; T.lean = -0.06; }
      }
      /* Landung: Stauchung über gebeugte Knie, Füße bleiben am Boden */
      const ld = A.land || 0;
      if (ld > 0.02 && !P.crouch) {
        const k = ld * (run ? 0.55 : 1);
        T.hy += k * 5.5; T.lean += k * 0.32; T.head -= k * 0.15;
        if (!run) { T.fFx = lp(T.fFx, 4.2, k); T.fBx = lp(T.fBx, -3.8, k); setH(T, "F", lp(PI / 2 - 0.18, 0.9, k), -0.5); setH(T, "B", lp(PI / 2 + 0.2, 1.3, k), -0.2); }
      }
      /* W30 Grafik: schwere Landung – tief in die Knie, vordere Hand stützt sich am Boden ab, dann aufrichten */
      if (w30on() && !P.crouch && !act && (S.landV || 0) > 430 && S.landT < 0.42) {
        const k = 1 - eio(cl(S.landT / 0.42, 0, 1)), hv = cl((S.landV - 430) / 300, 0.4, 1) * k;
        T.key = run ? T.key : "landH"; T.blendD = 0.03;
        T.hy = lp(T.hy, -7.2, hv); T.lean = lp(T.lean, 0.62, hv); T.head = lp(T.head, 0.15, hv);
        if (!run) { T.fFx = lp(T.fFx, 5.6, hv); T.fBx = lp(T.fBx, -4.8, hv); T.toeB = lp(T.toeB, 0.9, hv); setH(T, "F", lp(PI / 2, 1.25, hv), lp(-0.4, 0.15, hv)); setH(T, "B", lp(PI / 2 + 0.2, PI / 2 + 1.3, hv), -0.4); }
      }
      /* W30 Grafik: Abbremsen beim Richtungswechsel – Füße stemmen sich, Oberkörper lehnt in die neue Richtung */
      const hd = P === Z.player && Z.input && Z.input.held, want = hd ? (hd.right ? 1 : 0) - (hd.left ? 1 : 0) : 0;
      if (w30on() && !act && !P.crouch && speed > 80 && want && Math.sign(want) !== Math.sign(P.vx)) {
        const k = cl((speed - 80) / 90, 0.3, 1), back = Math.sign(P.vx) !== Math.sign(P.face || 1); /* rutscht rückwärts zur Blickrichtung */
        T.key = "skid"; T.blendD = 0.06;
        T.hy = -11 + (1 - k) * 1.2; T.lean = back ? 0.34 * k : -0.3 * k; T.head = back ? -0.1 : 0.05; T.hx = back ? 0.9 : -0.9;
        T.fFx = back ? 3.2 : 6.4; T.fFy = 0; T.fBx = back ? -6.6 : -2.4; T.fBy = 0; T.toeF = back ? 0.2 : -0.5; T.toeB = back ? 0.7 : 0.2;
        setH(T, "F", back ? 0.6 : -0.6, -0.5); setH(T, "B", back ? -2.4 : PI - 0.4, 0.3); T.tab = back ? -0.6 : 0.6;
        if (!lowGfx() && Math.random() < (S.pdt || 0) * 26) { const fx = P.x + P.w / 2 - Math.sign(P.vx) * 3; Z.fx.p({ x: fx, y: P.y + P.h - 1, vx: P.vx * 0.3 + (Math.random() - 0.5) * 20, vy: -15 - Math.random() * 20, life: 0.35, size: 1.8, col: Z.dustCol || "#8a7a70", kind: "smoke", a: 0.55 }); if (Math.random() < 0.3) Z.fx.p({ x: fx, y: P.y + P.h - 1, vx: P.vx * 0.4, vy: -40, life: 0.2, size: 1, col: "#ffd8a0", kind: "spark", add: true, g: 300 }); }
      }
    } else {
      /* in der Luft */
      const vy = P.vy;
      T.key = "air";
      if ((P.jumpT || 0) < 0.08 && vy < -150) {
        T.key = "takeoff"; T.blendD = 0.05; T.hy = -13.6; T.lean = 0.1; T.fFx = 1.4; T.fFy = 0.8; T.fBx = -2.6; T.fBy = 1.8; T.toeF = 0.9; T.toeB = 1.0;
        setH(T, "F", -1.1, -0.4); setH(T, "B", -1.9, -0.2); T.head = -0.2;
      } else if (vy < -70) {
        T.hy = -13.2; T.lean = 0.12; T.fFx = 3.6; T.fFy = -5; T.toeF = 0.3; T.fBx = -2.2; T.fBy = 0.6; T.toeB = 0.8; T.head = -0.15;
        setH(T, "F", -0.5, -0.9); setH(T, "B", PI / 2 + 0.95, -0.5); T.tab = 0.4;
      } else if (vy < 130) {
        T.key = "apex"; T.hy = -13; T.lean = 0.1; T.fFx = 3.2; T.fFy = -4.2; T.fBx = -0.8; T.fBy = -2.6; T.toeB = 0.6;
        setH(T, "F", 0.1, -0.6); setH(T, "B", PI - 0.5, 0.3); T.tab = 0.2;
      } else {
        const k = cl((vy - 130) / 300, 0, 1);
        T.key = "fall"; T.hy = -13; T.lean = 0.06; T.fFx = 3.2; T.fFy = lp(-2.4, 0.4, k); T.fBx = -2.4; T.fBy = lp(-1.2, -0.4, k); T.toeF = -0.2; T.toeB = 0.4;
        setH(T, "F", -0.8 - k * 0.5, -0.7 + Math.sin(time * 14) * 0.15 * k); setH(T, "B", -2.3 - k * 0.3, 0.4 - Math.sin(time * 13) * 0.15 * k); T.head = -0.12 - 0.12 * k; T.tab = -0.6;
      }
      /* Doppelsprung: Salto vorwärts */
      if (P.airJumps === 0 && (P.jumpT || 0) < 0.34 && vy < 200 && !P.plunge) {
        const k = cl(P.jumpT / 0.34, 0, 1);
        T.key = "flip"; T.blendD = 0.04; T.rot = eo(k) * TAU; T.rotY = -12;
        const tk = Math.sin(k * PI);
        T.fFx = lp(T.fFx, 3, tk); T.fFy = lp(T.fFy, -7, tk); T.fBx = lp(T.fBx, 0.5, tk); T.fBy = lp(T.fBy, -6, tk);
        T.hFx = lp(T.hFx, 4, tk); T.hFy = lp(T.hFy, 6, tk); T.hBx = lp(T.hBx, 3, tk); T.hBy = lp(T.hBy, 7, tk); T.head = lp(T.head, 0.4, tk);
      }
      if (P.plunge) {
        T.key = "plunge"; T.blendD = 0.05; T.hy = -14; T.lean = 0.15; T.head = 0.35; T.fFx = 2; T.fFy = -6; T.fBx = -1.5; T.fBy = -4.5; T.toeF = 0.6; T.toeB = 0.8; T.tab = 0.8;
      }
      if (P.grapple) { T.key = "grapple"; setH(T, "F", -0.4, 0); T.lean = 0.3; }
    }
    /* ---- Waffen und Handlungen ---- */
    const curW = act && act.d && (act.type === "melee" || act.type === "shot" || act.type === "charge" || act.type === "shield" || act.type === "shieldDown") ? act.d : null;
    if (curW) { WI.icon = curW.icon; WI.col = curW.col; }
    if (curW && act.type === "melee" && act.def && act.def.up) poseUp(T, P, act, time);
    else if (curW && act.type === "melee" && act.bash) poseBash(T, P, act);
    else if (curW && act.type === "melee") poseMelee(T, P, act, time);
    else if (curW && act.type === "shot") poseShot(T, P, act, time);
    else if (curW && act.type === "charge") poseCharge(T, P, act, time);
    else if (curW && (act.type === "shield" || act.type === "shieldDown")) poseShield(T, P, act);
    else if (act && act.type === "skill") poseSkill(T, P, act);
    else if (!P.ledge) restWeapon(T, P, run, time);
    if (P.plunge) {
      const it = P.plungeItem, d = it ? Z.WEAPONS[it.id] : Z.WEAPONS.faeuste;
      if (d) { WI.icon = d.icon; WI.col = d.col; WI.icon2 = null; }
      setH(T, "F", 1.25, -0.2); setH(T, "B", 1.35, -0.3); WI.ang = PI / 2 - 0.05; WI.grip2 = d && W2H[d.icon] ? (GRIP2[d.icon] || -3) : null;
    }
    if (!act && !P.plunge && !P.ledge && !P.climbing) poseExtras(T, P, time, S, run);
    else { S.idleT = 0; S.gest = null; }
    /* ---- Trank ---- */
    if (P.drinkT > 0) {
      const k = Math.sin(cl(1 - P.drinkT / 0.42, 0, 1) * PI);
      T.key = T.key + "|drink"; T.head = lp(T.head, -0.5, k); T.hFx = lp(T.hFx, 3, k); T.hFy = lp(T.hFy, -3.2, k); WI.flask = k;
      WI.icon = null; WI.icon2 = null;
    } else WI.flask = 0;
    /* ---- Treffer ---- */
    if (P.hurtT > 0 || P.grabbed) {
      const k = P.grabbed ? 0.7 + Math.sin(time * 22) * 0.3 : cl(P.hurtT / 0.2, 0, 1);
      T.key = P.grabbed ? "grabbed" : "hurt"; T.blendD = 0.03;
      if (w30on() && !P.grabbed && S.hurtDir > 0) {
        /* W30 Grafik: Treffer von hinten – nach vorn gestoßen, Kopf eingezogen, Arme fangen ab */
        T.lean = lp(T.lean, 0.62, k); T.hx += 1.8 * k; T.head = lp(T.head, 0.45, k); T.hy += 1.2 * k;
        setH(T, "F", lp(PI / 2, 0.5, k), -0.3); setH(T, "B", lp(PI / 2, -0.4, k), -0.6);
      } else {
      T.lean = lp(T.lean, -0.42, k); T.hx -= 1.8 * k; T.head = lp(T.head, -0.55, k);
      setH(T, "F", lp(PI / 2, -2.2, k), 0.5); setH(T, "B", lp(PI / 2, PI + 0.4, k), 0.3);
      }
      if (P.onGround) { T.fFx = lp(T.fFx, 4.5, k); T.fFy = lp(T.fFy, -2.8, k); T.hy += 0.8 * k; }
      WI.hurt = k;
    } else WI.hurt = 0;
  }

  /* ---- Wandkontakt und Leerlauf-Gesten ---- */
  function heldAny() { const h = Z.input && Z.input.held; if (!h) return false; for (const k in h) if (h[k]) return true; return false; }
  function poseExtras(T, P, time, S, run) {
    const dt = S.pdt || 0;
    const W = Z.world, h = Z.input && Z.input.held;
    const push = h ? (h.right ? 1 : 0) - (h.left ? 1 : 0) : 0;
    /* Wand: gegen eine Wand drücken (am Boden: anstemmen; in der Luft: Hand und Fuß streifen die Wand) */
    let wall = false;
    if (W && push && push === P.face && Math.abs(P.vx) < 25 && !P.crouch && !(P.hurtT > 0) && !(P.drinkT > 0)) {
      const wx = P.face > 0 ? P.x + P.w + 1.5 : P.x - 1.5;
      if (W.solidAt(wx, P.y + P.h * 0.35) && W.solidAt(wx, P.y + P.h * 0.75)) wall = true;
    }
    if (wall) {
      const wl = P.w / 2 + 0.6; /* Wandfläche, lokal */
      T.key = "wall"; T.blendD = 0.12;
      if (P.onGround) {
        const br = Math.sin(time * 5) * 0.25; /* angestrengtes Schieben */
        T.lean = 0.38; T.hx = -1.6; T.hy = -11.6 + br * 0.3; T.head = 0.05; T.fFx = 1.4; T.fBx = -6.2; T.toeB = 0.9; T.toeF = 0.2; T.tab = -0.3;
        T.handAbsF = [wl - 0.6, -17.2 + br * 0.4]; T.handAbsB = [wl - 0.9, -13.6 - br * 0.3]; WI.wallHands = true; if (WI.icon && !W2H[WI.icon]) WI.ang = -1.8; if (WI.icon2) WI.ang2 = -1.6;
      } else {
        const sl = cl(P.vy / 300, 0, 1);
        T.lean = 0.12; T.head = -0.15; T.fFx = wl - 2.2; T.fFy = -5; T.toeF = -0.6; T.fBx = -2; T.fBy = -1; T.toeB = 0.6;
        T.handAbsF = [wl - 0.6, -21 - sl * 1.5]; T.handAbsB = [-3, -9]; T.tab = 0.4; WI.wallHands = true; if (WI.icon && !W2H[WI.icon]) WI.ang = -1.3;
        /* Funken/Staub beim Rutschen an der Wand */
        if (P.vy > 120 && Math.random() < dt * 14 && !lowGfx()) Z.fx.p({ x: P.face > 0 ? P.x + P.w + 1 : P.x - 1, y: P.y + 5, vx: -P.face * 10, vy: -20, life: 0.4, size: 1.6, col: Z.dustCol || "#8a7a70", kind: "smoke", a: 0.6 });
      }
      S.idleT = 0; S.gest = null; return;
    }
    /* Leerlauf: nach einigen Sekunden Stillstand kleine Gesten */
    const still = P.onGround && !run && Math.abs(P.vx) < 5 && !P.crouch && !P.lookUp && !P.lookDown && !(P.hurtT > 0) && !(P.drinkT > 0) && T.key === "idle" && !heldAny();
    if (!still) { S.idleT = 0; S.gest = null; return; }
    S.idleT = (S.idleT || 0) + dt;
    if (!S.gest && S.idleT > (S.nextG || 3.4)) {
      const list = w30on() ? ["shoulder", "look", "shake", "inspect", "look", "breath", "stretch", "shoulder"] : ["shoulder", "look", "shake", "look", "shoulder", "breath"]; /* W30 Grafik: + Waffe prüfen, Nacken strecken */
      S.gi = ((S.gi == null ? -1 : S.gi) + 1) % list.length;
      S.gest = { k: list[S.gi], t: 0, d: list[S.gi] === "look" ? 3.0 : list[S.gi] === "shake" ? 1.6 : list[S.gi] === "stretch" ? 2.2 : 2.6 };
    }
    const G = S.gest; if (!G) return;
    G.t += dt;
    if (G.t >= G.d) { S.gest = null; S.idleT = 0; S.nextG = 4.5 + ((S.gi * 1.7) % 3); return; }
    const u = G.t / G.d, env = eio(cl(Math.min(u / 0.2, (1 - u) / 0.2), 0, 1));
    if (G.k === "shoulder") {
      /* Waffe schultern (Einhänder) bzw. Zweihänder vor sich aufstützen */
      if (WI.icon && W2H[WI.icon]) {
        const tap = u > 0.35 && u < 0.5 ? Math.sin((u - 0.35) / 0.15 * PI) * 0.6 : 0; /* Waffe tippt auf den Boden */
        const hFx = lp(T.hFx, 5.6, env), hFy = lp(T.hFy, 4.4 - tap, env);
        T.hFx = hFx; T.hFy = hFy; WI.ang = angLp(WI.ang, PI / 2 - 0.12, env); WI.grip2 = lp(0, -2.5, env) || null;
        T.lean = lp(T.lean, 0.16, env); T.hx = lp(T.hx, -0.6, env); T.fBx = lp(T.fBx, -4.2, env);
      } else if (WI.icon) {
        const sw = Math.sin(u * PI * 3) * 0.08 * env;
        T.hFx = lp(T.hFx, 0.8, env); T.hFy = lp(T.hFy, -2.6, env); WI.ang = angLp(WI.ang, -2.75 + sw, env);
        setH(T, "B", lp(PI / 2 + 0.22, PI / 2 - 0.5, env), lp(-0.3, -1.6, env)); /* andere Hand in die Hüfte */
        T.lean = lp(T.lean, 0.0, env); T.head = lp(T.head, -0.12, env);
      } else { T.hFx = lp(T.hFx, 2.5, env); T.hFy = lp(T.hFy, 4.5, env); }
    } else if (G.k === "look") {
      /* umsehen: erst nach vorn in die Ferne, dann über die Schulter nach hinten */
      const a = u < 0.4 ? Math.sin(u / 0.4 * PI) : 0, b = u > 0.38 ? cl(Math.min((u - 0.38) / 0.12, (0.95 - u) / 0.12), 0, 1) : 0;
      T.head = lp(T.head, -0.22, a * env); T.lean = lp(T.lean, 0.0, env); T.hx += Math.sin(u * PI) * 0.4;
      WI.headTurn = eio(b); /* 0 = nach vorn, 1 = nach hinten */
      if (b > 0) { T.lean -= 0.04 * b; T.head += 0.08 * b; }
    } else if (G.k === "shake") {
      /* Umhang zurechtschütteln: Schultern zucken, Umhang bekommt einen Ruck */
      const s = Math.sin(u * PI * 4) * env;
      T.hy += -Math.abs(s) * 0.7; T.lean += s * 0.05; T.hx += s * 0.5;
      setH(T, "B", lp(PI / 2 + 0.22, PI / 2 + 1.1, env), -0.6 + s * 0.3);
      if (!P.capeKick || P.capeKick < 0.2) P.capeKick = 1;
    } else if (G.k === "inspect") {
      /* W30 Grafik: Waffe vor sich heben, drehen und die Schneide prüfen; ohne Waffe: Handschuh zurechtziehen */
      const s2 = Math.sin(u * PI * 2) * 0.35;
      if (WI.icon) { T.hFx = lp(T.hFx, 5.2, env); T.hFy = lp(T.hFy, -4.2, env); WI.ang = angLp(WI.ang, -0.6 + s2, env); T.head = lp(T.head, 0.12, env); T.lean = lp(T.lean, 0.06, env); WI.grip2 = null; setH(T, "B", lp(PI / 2 + 0.22, 0.4, env), lp(-0.3, -1.4, env)); }
      else { setH(T, "F", lp(PI / 2 - 0.18, 0.9, env), -1.2 + s2 * 0.5); setH(T, "B", lp(PI / 2 + 0.22, 0.6, env), -1.6); T.head = lp(T.head, 0.25, env); }
    } else if (G.k === "stretch") {
      /* W30 Grafik: Nacken kreisen, Schultern rollen */
      const a = u * TAU; T.head = lp(T.head, Math.sin(a) * 0.32, env); T.hx += Math.cos(a) * 0.4 * env; T.hy -= Math.abs(Math.sin(a)) * 0.3 * env;
      setH(T, "B", lp(PI / 2 + 0.22, PI / 2 + 0.5 + Math.sin(a + 1) * 0.2, env), -0.3);
    } else if (G.k === "breath") {
      /* tief durchatmen: Brust hebt sich, Kopf in den Nacken */
      const s = Math.sin(u * PI);
      T.hy -= s * 0.6 * env; T.lean = lp(T.lean, -0.04, s * env); T.head = lp(T.head, -0.3, s * env);
      setH(T, "F", lp(PI / 2 - 0.18, PI / 2 - 0.4, s * env), -0.4); setH(T, "B", lp(PI / 2 + 0.22, PI / 2 + 0.5, s * env), -0.3);
      if (WI.icon && !W2H[WI.icon]) WI.ang = Math.atan2(T.hFy, T.hFx) + 0.55;
    }
  }

  /* Waffe in Ruhe: erste Waffe in der vorderen Hand, Schild auf dem Rücken */
  function restWeapon(T, P, run, time) {
    if (P.dead || P.climbing) return;
    const sl = P.slots || {};
    let main = null, shield = null;
    for (const s of ["a1", "a2"]) { const it = sl[s]; const d = it ? Z.WEAPONS[it.id] : null; if (!d) continue; if (d.kind === "shield") { if (!shield) shield = d; } else if (!main) main = d; }
    if (shield) WI.shieldBack = shield;
    if (!main || P.drinkT > 0) return;
    WI.icon = main.icon; WI.col = main.col;
    if (W2H[main.icon] && main.kind === "melee") {
      /* große Waffen ruhen auf der Schulter */
      const bob = run ? Math.sin(P.anim.run * PI) * 0.15 : Math.sin(P.anim.t * 2) * 0.04;
      setH(T, "F", 1.35 + bob * 0.5, -2.1); WI.ang = -2.35 + bob;
    } else if (main.icon === "bow" || main.icon === "xbow") {
      WI.ang = main.icon === "bow" ? 0.15 : Math.atan2(T.hFy, T.hFx) - 1.1;
    } else if (main.icon === "staff" || main.icon === "eiszapfen") {
      setH(T, "F", 1.0, -1.0); WI.ang = -1.45;
    } else {
      WI.ang = Math.atan2(T.hFy, T.hFx) + (run ? 0.75 : 0.55);
    }
    if (DUAL[main.icon]) { WI.icon2 = main.icon; WI.ang2 = Math.atan2(T.hBy, T.hBx) + 0.6; }
    if (!(Z.gfx.off && Z.gfx.off.haltung)) stance(T, P, main, run, time);
  }
  /* W11 R17: Haltung je Waffe in Ruhe und Lauf (nur am Boden, nicht geduckt/schauend) –
     Zweihänder: breiter, schwerer Stand und vorgebeugter Lauf; Stangenwaffen: aufrecht neben sich, im Lauf gesenkt;
     Dolche: tief, Klinge im Rückhandgriff; Rapier: En-garde mit erhobener hinterer Hand; Fäuste/Sicheln/Krallen:
     Deckung mit federndem Wippen; Bogen: Bogen gesenkt, Sehnenhand an der Hüfte; Stab: aufgestützt. */
  const POLE = { spear: 1, hellebarde: 1, kampfstab: 1, scythe: 1 };
  function stance(T, P, d, run, time) {
    if (!P.onGround || P.crouch || P.lookUp || P.lookDown || P.drinkT > 0 || (T.key !== "idle" && T.key !== "run")) return;
    const ic = d.icon, idle = T.key === "idle", br = Math.sin(time * 2.2);
    if (POLE[ic]) {
      if (idle) { setH(T, "F", 1.25, -1.5); WI.ang = -1.62 + br * 0.02; T.lean = 0.02; }
      else { setH(T, "F", 0.9, -1.1); WI.ang = -0.35; T.lean += 0.06; }
    } else if (W2H[ic] && d.kind === "melee" && ic !== "staff" && ic !== "eiszapfen") {
      if (idle) { T.fFx += 1; T.fBx -= 1; T.hy += 0.7; T.lean += 0.03; T.head = -0.05; }
      else T.lean += 0.1;
    } else if (ic === "dagger" || ic === "knives") {
      if (idle) { T.hy += 1.3; T.fFx += 0.8; T.fBx -= 0.6; T.lean += 0.12; setH(T, "F", 0.55, -1.25); setH(T, "B", 0.75, -1.6); WI.ang = 1.9 + br * 0.04; }
      else { T.lean += 0.1; WI.ang = 1.8; }
    } else if (ic === "rapier") {
      if (idle) { setH(T, "F", 0.2, -0.55); WI.ang = -0.22 + br * 0.03; setH(T, "B", -2.3, -1.1); T.fFx += 1.4; T.fBx -= 0.4; T.lean = -0.02; }
    } else if (DUAL[ic]) {
      const bob = idle ? Math.abs(Math.sin(time * 4.2)) * 0.6 : 0;
      setH(T, "F", 0.35, -1.85); setH(T, "B", 0.15, -1.95); T.hy += 0.6 + bob; T.lean += 0.08;
      if (idle) { T.fFx += 0.8; T.fBx -= 0.6; }
      WI.ang = Math.atan2(T.hFy, T.hFx) - 0.4; if (WI.icon2) WI.ang2 = Math.atan2(T.hBy, T.hBx) - 0.4;
    } else if (ic === "bow" || ic === "xbow") {
      if (idle) { setH(T, "B", PI / 2 - 0.5, -0.9); T.lean = 0.0; }
    } else if (ic === "staff" || ic === "eiszapfen") {
      if (idle) { setH(T, "F", 0.95, -0.75); WI.ang = -1.6; T.lean = 0.0; }
    } else if (d.kind === "melee") {
      if (!idle) WI.ang = Math.atan2(T.hFy, T.hFx) + 1.0;
    }
  }

  /* Nahkampf: Ausholen (Körper spannt sich), Schlag (Ausfallschritt), Nachschwung */
  function poseMelee(T, P, act, time) {
    const d = act.d, def = act.def, sm = def.smear || { a0: -1, a1: 1 };
    const icon = d.icon, heavy = !!(W2H[icon] || def.heavy), two = !!W2H[icon];
    const ph = act.phase;
    const kPre = ph === "pre" ? cl(act.t / Math.max(0.01, def.pre), 0, 1) : 1;
    const kAct = ph === "act" ? cl(act.t / Math.max(0.01, def.act), 0, 1) : ph === "post" ? 1 : 0;
    const kPost = ph === "post" ? cl(act.t / Math.max(0.01, def.post || 0.1), 0, 1) : 0;
    const dir = sm.a1 >= sm.a0 ? 1 : -1;
    const air = !P.onGround;
    T.key = "melee" + (act.step || 0); T.blendD = 0.035;
    let ang;
    const wind = sm.a0 - 0.5 * dir * (heavy ? 1.3 : 1);
    if (sm.stab) {
      /* Stoß: Hand zurück an die Brust, dann gestreckt nach vorn */
      ang = sm.a0 * (ph === "pre" ? 1 : 1 - kAct) + sm.a1 * kAct;
      let reach;
      if (ph === "pre") reach = lp(0.55, 0.15, eo(kPre)); else if (ph === "act") reach = lp(0.15, 1, eb(kAct)); else reach = lp(1, 0.75, kPost);
      T.hFx = lp(-1.5, 10.2, reach); T.hFy = lp(4.5, 0.8, reach) + ang * 6;
      T.lean = ph === "pre" ? lp(0.05, -0.12, kPre) : ph === "act" ? lp(-0.12, 0.32, eo(kAct)) : lp(0.32, 0.18, kPost);
      T.hx = ph === "pre" ? -1 * kPre : ph === "act" ? lp(-1, 2.2, eo(kAct)) : lp(2.2, 1, kPost);
      if (!air) { const st = ph === "pre" ? 0 : ph === "act" ? eo(kAct) : 1 - kPost * 0.4; T.fFx = lp(3.2, 7.4, st); T.fBx = lp(-3.6, -5.6, st); T.hy = lp(-12.4, -10.6, st); T.toeB = 0.5 * st; }
      if (two) WI.grip2 = GRIP2[icon] || -6;
      else if (icon === "rapier") { setH(T, "B", -2.2, -0.9); }
      else setH(T, "B", PI / 2 + 0.9, -0.6);
      WI.ext = 0;
    } else {
      if (ph === "pre") ang = lp(sm.a0 + 0.25 * dir, wind, eo(kPre));
      else if (ph === "act") ang = lp(wind, sm.a1 + 0.18 * dir, eo(kAct));
      else ang = lp(sm.a1 + 0.18 * dir, sm.a1 + 0.05 * dir, kPost);
      if (def.spin && ph === "act") ang = -PI + kAct * TAU;
      /* Arm folgt dem Waffenwinkel; beim Ausholen gebeugt, im Schlag gestreckt */
      const reach = ph === "pre" ? lp(8.6, 7.2, kPre) : ph === "act" ? lp(7.4, 10, eo(kAct)) : lp(10, 9, kPost);
      const aa = cl(ang, -2.7, 2.2);
      T.hFx = Math.cos(aa) * reach; T.hFy = Math.sin(aa) * reach;
      /* Körper: Ausholen = zurücklehnen, Gewicht hinten; Schlag = nach vorn werfen */
      const leanPre = (heavy ? -0.26 : -0.12) * (dir > 0 ? 1 : -0.4), leanAct = (heavy ? 0.42 : 0.26) * (dir > 0 ? 1 : 0.15);
      T.lean = ph === "pre" ? lp(0.05, leanPre, eo(kPre)) : ph === "act" ? lp(leanPre, leanAct, eo(kAct)) : lp(leanAct, 0.14, kPost);
      T.head = ph === "pre" ? -0.1 * kPre : 0.08;
      T.hx = ph === "pre" ? -1.2 * kPre : ph === "act" ? lp(-1.2, 2, eo(kAct)) : lp(2, 1, kPost);
      if (!air) {
        const st = ph === "pre" ? 0 : ph === "act" ? eo(kAct) : 1 - kPost * 0.3;
        const deep = heavy && dir > 0 ? 1 : 0.55;
        T.fFx = lp(heavy ? 2.4 : 3, 7.2, st); T.fBx = lp(heavy ? -4.6 : -3.8, -5.4, st);
        T.hy = ph === "pre" ? lp(-12.6, heavy ? -11 : -12, kPre) : lp(heavy ? -11 : -12, dir > 0 ? -12.6 + 3.6 * deep : -13.6, st);
        T.toeB = 0.6 * st; if (dir < 0 && ph !== "pre") { T.toeF = 0.3 * st; }
        if (ph === "pre" && heavy && kPre > 0.6) { T.hx += jit(time, 1) * 0.35; } /* Zittern vor dem großen Schlag */
      }
      if (two) WI.grip2 = GRIP2[icon] || -3;
      else if (FISTS[icon]) {
        /* Fäuste: abwechselnd vordere/hintere Hand; der Rest des Körpers dreht mit */
        const back = (act.step || 0) % 2 === 1 && !def.heavy;
        if (back) {
          T.hBx = T.hFx + 2; T.hBy = T.hFy; setH(T, "F", 1.0, -2.2); WI.punchBack = true;
          T.lean += 0.08;
        } else setH(T, "B", 1.1, -2.1);
        WI.icon2 = icon;
      } else if (DUAL[icon]) {
        /* zweite Klinge folgt versetzt */
        const lag = ph === "act" ? cl(kAct - 0.35, 0, 1) / 0.65 : ph === "post" ? 1 : 0;
        const a2 = ph === "pre" ? wind + 0.6 * dir : lp(wind + 0.6 * dir, sm.a1 + 0.5 * dir, eo(lag));
        const r2 = 8.4; T.hBx = Math.cos(a2) * r2 + 1.5; T.hBy = Math.sin(a2) * r2;
        WI.icon2 = icon; WI.ang2 = a2 + ((act.step || 0) % 2 ? 0.7 : -0.6);
      } else {
        /* freie Hand: Gegengewicht */
        setH(T, "B", ph === "pre" ? PI / 2 - 0.6 : PI / 2 + 0.9, -0.7);
      }
      if (def.spin && ph === "act") { const cs = Math.cos(kAct * TAU); T.sx = (cs < 0 ? -1 : 1) * Math.max(0.35, Math.abs(cs)); }
      if (def.dash && ph === "act") { T.lean = 0.5; T.hy = -10.2; T.fFx = 7; T.fBx = -7; T.toeB = 1; T.tab = -1; }
    }
    if (icon === "whip") {
      /* Peitsche: Arm über die Schulter zurück, dann Knall nach vorn */
      if (ph === "pre") { T.hFx = lp(4, -3.5, eo(kPre)); T.hFy = lp(4, -7.5, eo(kPre)); ang = lp(0.3, -2.5, eo(kPre)); WI.ext = 0; }
      else { const k = ph === "act" ? eo(kAct) : 1; T.hFx = lp(-3.5, 9.6, k); T.hFy = lp(-7.5, 1.2, k); ang = lp(-2.5, 0.05, k); WI.ext = 1; }
    }
    if (air && !P.plunge) { T.fFx = 3.2; T.fFy = -4; T.fBx = -2.2; T.fBy = -0.5; T.toeB = 0.6; T.hy = -13; }
    WI.ang = ang;
    if (sm.stab && act.phase === "act") WI.ext = 0;
  }
  /* W7 Aufwärtsangriff: Ausholen (in die Knie, Waffe tief), Schlag (Körper streckt sich, Blick nach oben), Nachschwung.
     Gattungen aus kampf.js (def.cls): klinge, stich, faust, wucht, sense, stoss, peitsche, schild */
  function poseUp(T, P, act, time) {
    const d = act.d, def = act.def, icon = d.icon, cls = def.cls, two = !!W2H[icon], ph = act.phase;
    const kPre = ph === "pre" ? cl(act.t / Math.max(0.01, def.pre), 0, 1) : 1;
    const kAct = ph === "act" ? cl(act.t / Math.max(0.01, def.act), 0, 1) : ph === "post" ? 1 : 0;
    const kPost = ph === "post" ? cl(act.t / Math.max(0.01, def.post || 0.1), 0, 1) : 0;
    const air = !P.onGround, rise = ph === "pre" ? 0 : ph === "act" ? eo(kAct) : 1 - kPost * 0.5;
    T.key = "up" + cls; T.blendD = 0.035;
    /* Körper: erst sammeln, dann nach oben strecken */
    T.lean = ph === "pre" ? lp(0.05, 0.22, eo(kPre)) : lp(0.22, -0.2, rise);
    T.head = ph === "pre" ? lp(-0.1, -0.3, kPre) : lp(-0.3, -0.62, rise);
    T.hx = ph === "pre" ? -0.6 * kPre : lp(-0.6, 0.6, rise);
    if (!air) {
      const crouch = ph === "pre" ? eo(kPre) : 1 - rise;
      T.hy = lp(-13.4, -10.6, crouch); T.fFx = lp(3.4, 4.4, crouch); T.fBx = lp(-3, -4.2, crouch); T.toeB = 0.6 * rise; T.toeF = 0.4 * rise;
    } else { T.fFx = 2.6; T.fFy = lp(-3, -1, rise); T.fBx = -1.8; T.fBy = lp(-2, 1.5, rise); T.toeB = 0.8; T.toeF = 0.5; T.hy = -13; }
    const hand = (aa, r) => { T.hFx = Math.cos(aa) * r; T.hFy = Math.sin(aa) * r; };
    let ang;
    if (cls === "stich" || cls === "stoss") {
      /* Stoß senkrecht nach oben: Hand von der Brust über den Kopf */
      const reach = ph === "pre" ? lp(0.4, 0.1, eo(kPre)) : ph === "act" ? lp(0.1, 1, eb(kAct)) : lp(1, 0.8, kPost);
      T.hFx = lp(2.5, 1.6, reach); T.hFy = lp(3, -10.2, reach); ang = -PI / 2 + lp(0.35, 0.1, reach);
      if (two) WI.grip2 = GRIP2[icon] || -6; else setH(T, "B", PI / 2 + 0.7, -0.6);
    } else if (cls === "peitsche") {
      if (ph === "pre") { T.hFx = lp(4, -2, eo(kPre)); T.hFy = lp(4, 6, eo(kPre)); ang = lp(0.3, 2.3, eo(kPre)); WI.ext = 0; }
      else { const k = ph === "act" ? eo(kAct) : 1; T.hFx = lp(-2, 2, k); T.hFy = lp(6, -9.6, k); ang = lp(2.3, -1.57, k); WI.ext = 1; }
      setH(T, "B", PI / 2 + 0.8, -0.6);
    } else if (cls === "schild") {
      const k = ph === "pre" ? 0 : ph === "act" ? eo(kAct) : 1 - kPost * 0.3;
      T.hFx = lp(5, 2.2, k); T.hFy = lp(3, -9.4, k); ang = lp(-0.1, -1.5, k);
      setH(T, "B", 0.9, -1.4);
    } else if (cls === "faust") {
      /* Aufwärtshaken: Faust tief, dann steil nach oben, andere Faust deckt */
      const k = ph === "pre" ? 0 : ph === "act" ? eb(kAct) : 1 - kPost * 0.2;
      T.hFx = lp(lp(3.5, 2, kPre), 3.6, k); T.hFy = lp(lp(3, 5, kPre), -9.6, k); ang = lp(0.5, -1.4, k);
      setH(T, "B", 1.1, -2.1); WI.icon2 = icon;
    } else {
      /* Bögen (Klinge, Wucht, Sense/Stab): von unten-vorn (bzw. hinten bei schweren Waffen) über den Kopf */
      const sm = def.smear || { a0: 0.9, a1: -2.5 }, heavy = cls === "wucht" || cls === "sense";
      const wind = heavy ? Math.min(2.6, sm.a0 + 0.7) : sm.a0 + 0.25, end = sm.a1 + 0.15;
      if (ph === "pre") ang = lp(0.6, wind, eo(kPre));
      else if (ph === "act") ang = lp(wind, end, eo(kAct));
      else ang = lp(end, end + 0.25, kPost);
      const reach = ph === "pre" ? lp(8.6, 7.4, kPre) : ph === "act" ? lp(7.4, 10, eo(kAct)) : lp(10, 9, kPost);
      hand(cl(ang, -2.7, 2.4), reach);
      if (two) WI.grip2 = GRIP2[icon] || -3;
      else if (DUAL[icon]) {
        const lag = ph === "act" ? cl(kAct - 0.35, 0, 1) / 0.65 : ph === "post" ? 1 : 0;
        const a2 = ph === "pre" ? wind + 0.4 : lp(wind + 0.4, end + 0.5, eo(lag));
        T.hBx = Math.cos(cl(a2, -2.7, 2.4)) * 8.4 + 1.5; T.hBy = Math.sin(cl(a2, -2.7, 2.4)) * 8.4; WI.icon2 = icon; WI.ang2 = a2 - 0.4;
      } else setH(T, "B", ph === "pre" ? PI / 2 - 0.4 : PI / 2 + 0.9, -0.7);
      if (ph === "pre" && heavy && kPre > 0.6) T.hx += jit(time, 1) * 0.3;
    }
    WI.ang = ang;
  }
  function poseBash(T, P, act) {
    const def = act.def, ph = act.phase;
    const k = ph === "pre" ? -cl(act.t / Math.max(0.01, def.pre), 0, 1) : ph === "act" ? 1 : 1 - cl(act.t / Math.max(0.01, def.post), 0, 1) * 0.6;
    T.key = "bash"; T.blendD = 0.03;
    const kk = Math.max(0, k);
    T.hFx = lp(3, 9, kk); T.hFy = lp(4, 3, kk); T.lean = k < 0 ? -0.15 : 0.35 * kk; T.hx = 2 * kk;
    if (P.onGround) { T.fFx = lp(3, 7, kk); T.fBx = lp(-3.5, -5.5, kk); T.hy = lp(-12, -10.8, kk); }
    setH(T, "B", PI / 2 + 0.7, -0.5); WI.ang = -0.1;
  }
  function poseShot(T, P, act, time) {
    if (act.up) return poseShotUp(T, P, act);
    const d = act.d, icon = d.icon, ph = act.phase;
    const def = act.def;
    const k = ph === "pre" ? cl(act.t / Math.max(0.01, def.pre), 0, 1) : ph === "act" ? 1 : 1 + cl(act.t / Math.max(0.01, def.post), 0, 1);
    /* k: 0..1 Ausholen, 1..2 Nachbewegung */
    T.key = "shot"; T.blendD = 0.04;
    if (P.onGround) { T.fFx = 4; T.fBx = -4; T.hy = -12.2; }
    if (icon === "bow" || icon === "xbow") {
      T.hFx = 9.6; T.hFy = -0.6; WI.ang = icon === "bow" ? -0.05 : 0;
      if (icon === "bow") { const dr = k <= 1 ? k : 0; WI.ext = dr; T.hBx = 9.6 - 6 - dr * 6 + 3; T.hBy = -1.2; if (k > 1) { T.hBx = -2 - (k - 1) * 2; T.hBy = 0; } }
      else { WI.grip2 = -4; if (k > 1) { const r = Math.sin(cl(k - 1, 0, 1) * PI); T.hFx -= r * 2; WI.ang = -0.3 * r; } }
      T.lean = -0.04; T.head = 0;
    } else if (icon === "knives" || icon === "schleuder" || icon === "web") {
      if (k <= 1) { T.hFx = lp(4, -4, eo(k)); T.hFy = lp(4, -6, eo(k)); WI.ang = lp(0.4, -2.4, eo(k)); T.lean = lp(0.05, -0.14, k); }
      else { const kk = eo(cl(k - 1, 0, 1)); T.hFx = lp(-4, 9.6, Math.min(1, kk * 2.5)); T.hFy = lp(-6, 0.4, Math.min(1, kk * 2.5)); WI.ang = 0.2; T.lean = 0.25; T.hx = 1; }
      setH(T, "B", PI / 2 + 0.8, -0.6);
      if (icon === "knives" && k > 1) WI.icon = null;
    } else if (icon === "vial") {
      if (k <= 1) { T.hFx = lp(3, -5, eo(k)); T.hFy = lp(5, 5, k); WI.ang = 2.2; T.lean = -0.1; }
      else { const kk = Math.min(1, eo(cl(k - 1, 0, 1)) * 2.2); T.hFx = lp(-5, 6, kk); T.hFy = lp(5, -7, kk); WI.ang = -0.9; T.lean = 0.18; if (k > 1.15) WI.icon = null; }
      setH(T, "B", PI / 2 + 0.6, -0.5);
    } else {
      /* Stäbe, Bücher, Zauber: nach vorn stoßen, Kugel leuchtet */
      if (k <= 1) { T.hFx = lp(4, 2, k); T.hFy = lp(3, 2, k); WI.ang = lp(-1.4, -1.0, k); T.lean = -0.06; }
      else { const kk = Math.min(1, eo(cl(k - 1, 0, 1)) * 2); T.hFx = lp(2, 9.4, kk); T.hFy = lp(2, -1.6, kk); WI.ang = lp(-1.0, -0.25, kk); T.lean = 0.2; }
      setH(T, "B", 0.2, -0.4); WI.glowHand = d.col || "#ffd27a";
      if (W2H[icon]) WI.grip2 = GRIP2[icon] || -6;
    }
  }
  /* W7: Schuss/Wurf nach oben – Arm und Waffe zeigen in den Zielwinkel (act.upAng), Würfe holen tief aus */
  function poseShotUp(T, P, act) {
    const d = act.d, icon = d.icon, ph = act.phase, def = act.def;
    const k = ph === "pre" ? cl(act.t / Math.max(0.01, def.pre), 0, 1) : ph === "act" ? 1 : 1 + cl(act.t / Math.max(0.01, def.post), 0, 1);
    const aim = act.upAng != null ? act.upAng : -1.3, ca = Math.cos(aim), sa = Math.sin(aim);
    T.key = "shotUp"; T.blendD = 0.04; T.lean = -0.12; T.head = lp(-0.3, -0.6, Math.min(1, k));
    if (P.onGround) { T.fFx = 3.8; T.fBx = -3.8; T.hy = -12.6; }
    if (icon === "bow" || icon === "xbow") {
      T.hFx = ca * 9.6; T.hFy = sa * 9.6; WI.ang = aim;
      if (icon === "bow") { T.hBx = ca * 4; T.hBy = sa * 4; WI.ext = k <= 1 ? k : 0; } else WI.grip2 = -4;
    } else if (icon === "knives" || icon === "schleuder" || icon === "web" || icon === "vial") {
      if (k <= 1) { T.hFx = lp(3, -2, eo(k)); T.hFy = lp(4, 7, eo(k)); WI.ang = lp(0.4, 2.2, eo(k)); }
      else { const kk = Math.min(1, eo(cl(k - 1, 0, 1)) * 2.5); T.hFx = lp(-2, ca * 9.6, kk); T.hFy = lp(7, sa * 9.6, kk); WI.ang = aim; if ((icon === "knives" || icon === "vial") && k > 1.1) WI.icon = null; }
      setH(T, "B", PI / 2 + 0.8, -0.6);
    } else {
      const kk = k <= 1 ? 0 : Math.min(1, eo(cl(k - 1, 0, 1)) * 2);
      T.hFx = lp(3, ca * 9.4, kk); T.hFy = lp(2, sa * 9.4, kk); WI.ang = lp(-1.0, aim, kk); WI.glowHand = d.col || "#ffd27a";
      setH(T, "B", 0.2, -0.4); if (W2H[icon]) WI.grip2 = GRIP2[icon] || -6;
    }
  }
  function poseCharge(T, P, act, time) {
    if (act.upAim && act.d.icon === "bow") {
      const ch = cl(act.charge || 0, 0, 1), aim = Z.upAngle ? Z.upAngle(P) : -1.3, ca = Math.cos(aim), sa = Math.sin(aim);
      T.key = "chargeUp"; T.blendD = 0.06; T.hFx = ca * 9.4; T.hFy = sa * 9.4; WI.ang = aim; WI.ext = ch;
      T.hBx = ca * (6.4 - ch * 6); T.hBy = sa * (6.4 - ch * 6); T.lean = -0.14; T.head = -0.5;
      if (P.onGround) { T.fFx = 4.4; T.fBx = -4.6; T.hy = -11.8; }
      return;
    }
    const ch = cl(act.charge || 0, 0, 1);
    T.key = "charge"; T.blendD = 0.06;
    T.hFx = 9.4; T.hFy = -0.8 + (ch > 0.98 ? jit(time, 2) * 0.3 : 0); WI.ang = -0.05; WI.ext = ch;
    T.hBx = 9.4 - 6 - ch * 6 + 3; T.hBy = -1.4;
    T.lean = -0.05 - ch * 0.06; T.head = -0.05;
    if (P.onGround) { T.fFx = 4.4; T.fBx = -4.6; T.hy = -11.8 - ch * 0.3; }
    if (act.d.icon !== "bow") { WI.ext = 0; T.hBx = 4; T.hBy = 0; WI.glowHand = act.d.col; }
  }
  function poseShield(T, P, act) {
    T.key = "shield"; T.blendD = 0.04;
    const down = act.type === "shieldDown";
    T.hFx = down ? 4 : 6.4; T.hFy = down ? 5 : 2.6; WI.ang = -0.08;
    T.lean = 0.12; T.head = 0.05;
    if (P.onGround) { T.fFx = 4.6; T.fBx = -4.2; T.hy = -11.2; T.toeB = 0.3; }
    setH(T, "B", 0.9, -1.4);
    const sl = P.slots || {}; for (const s of ["a1", "a2"]) { if (s === act.slot) continue; const it = sl[s]; const d = it ? Z.WEAPONS[it.id] : null; if (d && d.kind !== "shield") { WI.hand2Icon = d.icon; WI.hand2Col = d.col; } }
  }
  function poseSkill(T, P, act) {
    const k = cl(act.t / Math.max(0.01, (act.def && act.def.post) || 0.14), 0, 1);
    const e = Math.sin(Math.min(1, k * 1.4) * PI * 0.5) * (1 - k * 0.5);
    T.key = "skill"; T.blendD = 0.04;
    T.hFx = lp(3, 9, e); T.hFy = lp(4, -3, e); T.lean = lp(0.05, -0.1, e); T.head = -0.15 * e;
    setH(T, "B", PI / 2 + 0.6 * e, -0.4);
    WI.glowHand = (act.d && act.d.col) || "#ff6a3a";
    restWeaponKeepHands(P);
  }
  function restWeaponKeepHands(P) {
    const sl = P.slots || {}; for (const s of ["a1", "a2"]) { const it = sl[s]; const d = it ? Z.WEAPONS[it.id] : null; if (d && d.kind !== "shield") { WI.hand2Icon = d.icon; WI.hand2Col = d.col; return; } }
  }

  /* Überblendung zwischen Zuständen */
  /* Winkel auf kürzestem Weg überblenden */
  function angLp(a, b, k) { let d = (b - a) % TAU; if (d > PI) d -= TAU; else if (d < -PI) d += TAU; return a + d * k; }
  function blendPose(S, T, dt) {
    if (!S.cur) { S.cur = {}; for (const k of PK) S.cur[k] = T[k]; S.key = T.key; S.ww = 0; return S.cur; }
    if (S.key !== T.key) {
      if (!S.from) S.from = {};
      Object.assign(S.from, S.cur); S.bt = 0; S.bd = T.blendD || 0.1;
      const was = S.key || "", now = T.key || "";
      /* Anschluss zwischen Kombo-Schlägen: der neue Schlag holt aus der Endhaltung des alten heraus aus */
      if (now.startsWith("melee") && was.startsWith("melee")) S.bd = Math.max(S.bd, 0.075);
      /* zurück in die Ruhe nach einem Angriff: weich ausschwingen statt einrasten */
      else if ((was.startsWith("melee") || was === "shot" || was === "bash" || was === "skill") && (now === "idle" || now === "run")) S.bd = Math.max(S.bd, 0.16);
      else if (was === "wall" || now === "wall") S.bd = Math.max(S.bd, 0.12);
      else if (was === "roll") S.bd = Math.max(S.bd, 0.14); /* W30 Grafik: aus der Rolle weich aufrichten */
      /* Waffenwinkel mit überblenden (sonst springt die Klinge beim Zustandswechsel) */
      S.fromA = S.lastA; S.fromA2 = S.lastA2; S.fromIcon = S.lastIcon; S.fromIcon2 = S.lastIcon2;
      S.key = T.key; S.blending = true;
    }
    S.bt += dt;
    const w = S.blending ? 1 - cl(S.bt / S.bd, 0, 1) : 0;
    const ww = w * w * (3 - 2 * w);
    for (const k of PK) S.cur[k] = ww > 0 ? lp(T[k], S.from[k], ww) : T[k];
    if (w <= 0) S.blending = false;
    S.ww = ww;
    return S.cur;
  }

  /* ---------- Zeichnen ---------- */
  /* Rumpf-Koordinaten → Figur-Koordinaten */
  let pHx = 0, pHy = 0, pC = 1, pS = 0;
  const toF = (x, y, o) => { o[0] = pHx + x * pC - y * pS; o[1] = pHy + x * pS + y * pC; return o; };
  const SF = [0, 0], SB = [0, 0], NK = [0, 0];

  function kneeF(c, front) { poly(c, [-1.6, -1.2, 1.8, -0.8, 2.6, 0.8, 0, 1.6, -1.8, 0.6], front ? "#3a2c2e" : "#241a1c"); poly(c, [1.4, -0.4, 4, -0.6, 2.2, 0.8], front ? "#4a3a3c" : "#2a1e20"); }
  function bootF(c, front) {
    poly(c, [-1.7, -1.4, 1.2, -1.6, 3.6, 0.2, 3.9, 1.2, -1.8, 1.3], front ? "#120c0e" : "#0e090a");
    limb(c, -1.2, -1.2, 1, -1.3, 0.8, front ? "#3a2c2e" : "#241a1c");
    poly(c, [3.2, 0.2, 5, 0.6, 3.6, 1.2], front ? "#2a1e20" : "#1a1214");
  }
  const KNEE = [g => kneeF(g, false), g => kneeF(g, true)], BOOT = [g => bootF(g, false), g => bootF(g, true)];
  function drawLeg(c, hx, hy, ax, ay, toe, front, glowK, time, pps) {
    const [kx, ky, ex, ey] = ik(hx, hy, ax, ay, T1, T2, 1);
    const cT = front ? EZ.leg : "#140d0f", cS = front ? EZ.leg2 : "#1a1214";
    if (pps) { LP[0] = hx; LP[1] = hy; LP[2] = kx; LP[3] = ky; LP[4] = ex; LP[5] = ey; line(c, LP, front ? 3.9 : 3.7, cS); } /* Stufe 0: Ober- und Unterschenkel in einem Zug (Farben fast gleich) */
    else { limb(c, hx, hy, kx, ky, front ? 4.2 : 4, cT); limb(c, kx, ky, ex, ey, front ? 3.6 : 3.4, cS); }
    /* Beinschiene */
    const sx = lp(kx, ex, 0.35), sy = lp(ky, ey, 0.35);
    limb(c, sx, sy, lp(kx, ex, 0.85), lp(ky, ey, 0.85), front ? 2.4 : 2.2, front ? "#2e2226" : "#201719");
    /* Knieschutz mit Dorn */
    const ka = Math.atan2(ey - ky, ex - kx) - PI / 2;
    c.save(); c.translate(kx, ky); c.rotate(ka);
    if (!(pps && partSpr(c, "PK|" + pps + "|" + (front ? 1 : 0), 4, 6, 4, 4, pps, KNEE[front ? 1 : 0]))) kneeF(c, front);
    c.restore();
    /* glühende Ader am Oberschenkel */
    if (front && glowK > 0.05) { const a = (0.35 + 0.3 * Math.sin(time * 4 + 1.3)) * glowK; c.strokeStyle = "rgba(255,110,40," + a.toFixed(3) + ")"; c.lineWidth = 0.55; c.beginPath(); c.moveTo(lp(hx, kx, 0.15) + 0.6, lp(hy, ky, 0.15)); c.lineTo(lp(hx, kx, 0.5) + 1.1, lp(hy, ky, 0.5)); c.lineTo(lp(hx, kx, 0.8) + 0.5, lp(hy, ky, 0.8)); c.stroke(); }
    /* Stiefel */
    c.save(); c.translate(ex, ey); c.rotate(toe);
    if (!(pps && partSpr(c, "PB|" + pps + "|" + (front ? 1 : 0), 4, 7, 4, 4, pps, BOOT[front ? 1 : 0]))) bootF(c, front);
    c.restore();
  }
  const LP = [0, 0, 0, 0, 0, 0];
  function drawArm(c, sx, sy, hx, hy, bend, front, glowK, time, pps) {
    const [ex, ey, wx, wy] = ik(sx, sy, hx, hy, L1, L2, bend);
    if (pps) { LP[0] = sx; LP[1] = sy; LP[2] = ex; LP[3] = ey; LP[4] = wx; LP[5] = wy; line(c, LP, front ? 3.15 : 2.95, front ? "#241a1d" : "#181012"); } /* Stufe 0: Ober- und Unterarm in einem Zug */
    else { limb(c, sx, sy, ex, ey, front ? 3.3 : 3.1, front ? "#1e1618" : "#150e10"); limb(c, ex, ey, wx, wy, front ? 3.0 : 2.8, front ? "#2a1f22" : "#1c1416"); }
    /* Armschiene */
    limb(c, lp(ex, wx, 0.25), lp(ey, wy, 0.25), lp(ex, wx, 0.8), lp(ey, wy, 0.8), front ? 3.5 : 3.2, front ? "#352829" : "#211819");
    if (front) {
      /* Dornen an der Armschiene */
      const ang = Math.atan2(wy - ey, wx - ex), nx = Math.sin(ang), ny = -Math.cos(ang);
      const mx = lp(ex, wx, 0.45), my = lp(ey, wy, 0.45);
      poly(c, [mx + nx * 1.5 - Math.cos(ang) * 0.8, my + ny * 1.5 - Math.sin(ang) * 0.8, mx + nx * 3.2 - Math.cos(ang) * 1.6, my + ny * 3.2 - Math.sin(ang) * 1.6, mx + nx * 1.5 + Math.cos(ang) * 0.8, my + ny * 1.5 + Math.sin(ang) * 0.8], "#3e2e30");
      if (glowK > 0.05) { const a = (0.45 + 0.35 * Math.sin(time * 5 - 0.6)) * glowK; c.strokeStyle = "rgba(255,120,40," + a.toFixed(3) + ")"; c.lineWidth = 0.55; c.beginPath(); c.moveTo(lp(ex, wx, 0.2), lp(ey, wy, 0.2)); c.lineTo(lp(ex, wx, 0.55) - nx * 0.6, lp(ey, wy, 0.55) - ny * 0.6); c.lineTo(lp(ex, wx, 0.85), lp(ey, wy, 0.85)); c.stroke(); }
    }
    return [wx, wy, ex, ey];
  }
  function drawHand(c, x, y, front, lean) { circ(c, x, y, front ? 1.7 : 1.6, front ? "#2c2022" : "#1e1618"); if (!lean) circ(c, x + 0.5, y - 0.4, 0.7, front ? "#4a3a3c" : "#2a1e20"); }

  function drawTorso(c, p, glowK, time, hurt, part) {
    /* lokaler Rumpf: Ursprung Hüfte, oben = −y. part: 1 = nur fester Teil (Sprite), 2 = nur glühender Kern */
    const br = Math.sin(time * 2.2) * 0.15;
    if (part !== 2) {
    /* Rückenplatte und hinterer Lendenschurz */
    poly(c, [-3.6, 0.5, -5.2, 5.5 + Math.sin(time * 3) * 0.3, -2.2, 4.6, -1, 0.5], EZ.cloth2);
    /* Rumpf */
    poly(c, [-4.2, 0, 3.8, 0, 5.2, -5.6, 5.6 - br, -9.6, 3.8, -12, -3.4, -12, -5.1, -10, -5, -5], EZ.plate);
    /* Brustpanzer mit Kante */
    poly(c, [-2.6, -5.4, 4.6, -5.8, 5.3 - br, -9.6, 3.4, -11.4, -1.8, -11.4, -3.6, -9.2], EZ.plate2);
    limb(c, 4.6, -5.8, 5.3 - br, -9.6, 0.7, EZ.edge); limb(c, -1.8, -11.4, 3.4, -11.4, 0.6, EZ.edge);
    /* Bauchschienen */
    limb(c, -3.6, -2.4, 4.2, -2.6, 0.6, "#120c0e"); limb(c, -3.8, -4.2, 4.6, -4.5, 0.6, "#120c0e");
    limb(c, -3, -3.3, 4.2, -3.5, 0.6, "#3a2c2e");
    }
    if (part !== 1) {
    /* Darkin-Kern: Riss im Brustpanzer, glüht und pulsiert */
    const pulse = 0.6 + 0.4 * Math.sin(time * 3 + 1);
    const g = glowK * (0.55 + pulse * 0.45);
    c.strokeStyle = "rgba(255," + (90 + pulse * 70 | 0) + ",40," + (0.85 * glowK).toFixed(3) + ")"; c.lineWidth = 0.75; c.lineCap = "round";
    c.beginPath(); c.moveTo(-2, -5.6); c.lineTo(0.6, -7.6); c.lineTo(3.4, -6.4); c.moveTo(0.6, -7.6); c.lineTo(1.4, -10.6); c.moveTo(0.6, -7.6); c.lineTo(-1.6, -9.6); c.stroke();
    circ(c, 0.9, -7.8, 1.15, glowK > 0.3 ? "#ff8a2a" : "#5a2a1a"); circ(c, 0.9, -7.8, 0.5, glowK > 0.3 ? "#ffe0a0" : "#6a3a2a");
    if (g > 0.05) glow(c, 0.9, -7.8, 5.5 + hurt * 3, "rgba(255,110,40,.5)", g);
    }
    if (part === 2) return;
    /* Gürtel mit Schädelschnalle */
    limb(c, -4.4, -0.6, 4.2, -0.8, 1.7, EZ.belt); limb(c, -4.2, -1.2, 4, -1.4, 0.4, "#5a4232");
    ell(c, 3.2, -0.7, 1.5, 1.4, EZ.bone); c.fillStyle = "#1a1010"; c.fillRect(3.1, -1.1, 0.6, 0.5); c.fillRect(3.9, -1.1, 0.5, 0.5);
    circ(c, -2.6, 0.2, 0.9, EZ.bone2);
  }
  /* Gürtelteile: Lederriemen mit Knochenamulett (hinten) und Beutel (Seite) – Pendel in Weltlage */
  function drawTrinkets(c, S, rot) {
    const a1 = PI / 2 + (S.b1 || 0) - rot, a2 = PI / 2 + (S.b2 || 0) - rot;
    /* Beutel an der Seite */
    const bx = -1.2, by = 0.4, ex = bx + Math.cos(a2) * 2.2, ey = by + Math.sin(a2) * 2.2;
    limb(c, bx, by, ex, ey, 0.6, "#2a1c16");
    c.save(); c.translate(ex, ey); c.rotate(a2 - PI / 2);
    ell(c, 0, 1.3, 1.4, 1.5, "#3a2418"); poly(c, [-1.4, 0.4, 1.4, 0.4, 1, 1.3, -1, 1.3], "#4e3222");
    c.restore();
    /* Riemen mit Knochenamulett hinten */
    const rx = -3.8, ry = 0.2, mx = rx + Math.cos(a1) * 2, my = ry + Math.sin(a1) * 2, kx = mx + Math.cos(a1 + (S.b1v || 0) * 0.02) * 1.8, ky = my + Math.sin(a1 + (S.b1v || 0) * 0.02) * 1.8;
    line(c, [rx, ry, mx, my, kx, ky], 0.55, "#3a2a22");
    c.save(); c.translate(kx, ky); c.rotate(a1 - PI / 2);
    poly(c, [-0.7, 0, 0.7, 0, 0.55, 1.3, 0, 2, -0.55, 1.3], EZ.bone2);
    c.restore();
  }
  function drawTabard(c, p, time, springA, lean) {
    /* vorderer Wappenrock: hängt vom Gürtel, federt der Bewegung hinterher */
    const sw = (springA != null ? springA : p.tab) + Math.sin(time * 2.6) * 0.05;
    const tx = 2.4 + Math.sin(sw) * 4.5, ty = 5 - Math.abs(sw) * 1.1;
    c.fillStyle = EZ.cloth2; c.beginPath(); c.moveTo(1, -0.4); c.lineTo(3.8, -0.5); c.quadraticCurveTo(3.6 + sw * 2, 2.6, tx + 1.1, ty); c.lineTo(tx, ty + 1); c.lineTo(tx - 1.1, ty); c.quadraticCurveTo(1.2 + sw * 2, 2.6, 1, -0.4); c.fill();
    if (!lean) { c.strokeStyle = "#8a1a1a"; c.lineWidth = 0.6; c.beginPath(); c.moveTo(2.4, 0.2); c.quadraticCurveTo(2.4 + sw * 2.2, 2.6, tx, ty + 0.4); c.stroke(); }
  }
  function drawHead(c, P, glowK, time, alpha, hurt, wrath, rotW, part) {
    /* Kopf-Ursprung: Nacken; oben = −y. part: 1 = fester Teil (Sprite), 2 = nur Kapuzenzipfel, 3 = nur Leuchten */
    /* Kapuzenzipfel hinten: Stoffzunge, die als Pendel nachschwingt */
    if (SECV && rotW != null && (!part || part === 2)) {
      const a = PI / 2 + 0.55 + (SECV.hd || 0) - rotW, a2 = a + cl((SECV.hdv || 0) * 0.04, -0.6, 0.6);
      const x0 = -4.3, y0 = -1.5, x1 = x0 + Math.cos(a) * 2.6, y1 = y0 + Math.sin(a) * 2.6, x2 = x1 + Math.cos(a2) * 2.4, y2 = y1 + Math.sin(a2) * 2.4;
      const nx = -Math.sin(a), ny = Math.cos(a);
      poly(c, [-4.6, -3.6, x1 - nx * 1.1, y1 - ny * 1.1, x2, y2, x1 + nx * 0.9, y1 + ny * 0.9, -3.4, 0.6], EZ.hood2);
      limb(c, x1, y1, x2, y2, 0.5, "#3e0a0c");
    }
    if (part === 2) return;
    const hg = wrath ? 1 : 0;
    if (part !== 3) {
    /* Kapuze */
    poly(c, [-3.9, 1.2, -4.8, -2.8, -3.8, -6.8, -0.6, -8.6, 3, -8.1, 5.1, -5.6, 5.7, -2.4, 4.9, 0.6, 2, 1.6], EZ.hood);
    poly(c, [-3.9, 1.2, -4.8, -2.8, -3.8, -6.8, -1.6, -7.6, -2.4, -2.4, -1.4, 1.5], EZ.hood2);
    limb(c, -0.6, -8.4, 3, -7.9, 0.5, "#a82020");
    /* Hörner: schwarz, nach hinten oben gebogen, mit Rillen */
    c.fillStyle = EZ.horn;
    c.beginPath(); c.moveTo(-1.8, -7.2); c.quadraticCurveTo(-9, -9.8, -7, -16.6); c.quadraticCurveTo(-5.8, -11.8, 0.4, -8.3); c.fill();
    c.beginPath(); c.moveTo(2, -7.9); c.quadraticCurveTo(3.4, -13.6, 7.4, -16.4); c.quadraticCurveTo(4.8, -12, 4.6, -7.4); c.fill();
    c.strokeStyle = hg ? "#c02a1a" : EZ.hornHi; c.lineWidth = 0.5;
    c.beginPath(); c.moveTo(-4.6, -9.4); c.lineTo(-3.4, -8.6); c.moveTo(-6.2, -11.6); c.lineTo(-5, -11.2); c.moveTo(-6.8, -13.8); c.lineTo(-5.8, -13.6);
    c.moveTo(3, -10.6); c.lineTo(4.4, -10.4); c.moveTo(4.2, -12.8); c.lineTo(5.4, -12.8); c.stroke();
    }
    if (hg && part !== 1) { glow(c, 7, -15.6, 4, "rgba(255,60,30,.7)", alpha); glow(c, -6.8, -15.8, 4, "rgba(255,60,30,.7)", alpha); }
    if (part !== 3) {
    /* Gesichtsöffnung im Schatten */
    poly(c, [0.6, -6.3, 4.3, -5.9, 5.3, -2.5, 4.4, 0.1, 1.1, 0.6], "#0e0809");
    /* Knochenmaske */
    poly(c, [1.9, -5.3, 4.7, -4.9, 5.3, -2.5, 4.5, -0.4, 2.6, 0.1, 1.9, -1.4], EZ.bone);
    poly(c, [1.9, -1.6, 4.9, -1.4, 4.5, -0.4, 2.6, 0.1], EZ.bone2);
    c.fillStyle = "#2a1a14"; for (let i = 0; i < 3; i++) c.fillRect(2.6 + i * 0.75, -0.9, 0.35, 0.8);
    /* glühende Augen */
    }
    const blink = P.anim && P.anim.blink > 0 ? 0.25 : 1;
    const eh = (hurt > 0.3 ? 0.5 : 1) * blink;
    if (glowK > 0.02) {
      if (part !== 3) {
        c.fillStyle = "#ff6a1a"; c.fillRect(2.9, -3.9, 1.7, 1.15 * eh); c.fillRect(4.9, -3.7, 0.8, 0.95 * eh);
        c.fillStyle = "#ffd0a0"; c.fillRect(3.3, -3.7, 0.7, 0.6 * eh);
      }
      if (part !== 1) glow(c, 4, -3.3, wrath ? 8 : 6, wrath ? "rgba(255,50,30,.85)" : "rgba(255,90,30,.75)", alpha * glowK);
    } else if (part !== 3) { c.fillStyle = "#2a1410"; c.fillRect(2.9, -3.6, 1.7, 0.6); }
  }

  /* ---------- Sekundärbewegung, Waffenspur, Glanz ---------- */
  /* Waffenspitze lokal (Griff am Ursprung): [innen x,y, außen x,y] – daraus wird die Wischspur aufgespannt */
  const TIP = { sickles: [5, 0, 13, -2], sickle: [5, 0, 13, -2], dagger: [4, 0, 13.5, 0], dawn: [8, 0, 30, 0], hammer: [13, 0, 25, 0], scythe: [22, -4, 12, -21],
    whip: [4, 0, 20, 0], spear: [24, 0, 40, 0], axe: [14, 0, 23, -6], club: [10, 0, 31, -2], rapier: [11, 0, 27.5, 0], scimitar: [5, -1, 19, -2], claw: [2, 0, 14, -1],
    anchor: [8, 0, 24, 0], stonefist: [0, 0, 7, 0], fist: [0, 0, 5.5, 0], krallen: [1, 0, 12, 0], staff: [12, 0, 25, 0], eiszapfen: [8, 0, 24, 0] };
  const tipOf = icon => TIP[icon] || (W2H[icon] ? [10, 0, 28, 0] : [6, 0, 18, 0]);
  /* Spurfarbe: Waffenfarbe, bläuliche Töne werden warm umgefärbt (kein Blau im Spiel) */
  const TCOL = new Map();
  function trailCol(col) {
    let r = TCOL.get(col); if (r) return r;
    r = col;
    const m = /^#([0-9a-f]{6})$/i.exec(col || "");
    if (m) { const n = parseInt(m[1], 16), R = n >> 16, G = (n >> 8) & 255, B = n & 255; const mx = Math.max(R, G, B), mn = Math.min(R, G, B); if (mx - mn > 30) { let h = mx === R ? ((G - B) / (mx - mn)) % 6 : mx === G ? (B - R) / (mx - mn) + 2 : (R - G) / (mx - mn) + 4; h *= 60; if (h < 0) h += 360; if (h > 185 && h < 255) r = "#ffd8b0"; } } else r = "#ffd8b0";
    if (TCOL.size > 100) TCOL.clear(); TCOL.set(col, r); return r;
  }
  /* gedämpfte Feder: Wert v, Tempo w, Ziel z */
  function spring(o, kv, kw, z, k, d, dt) { o[kw] += ((z - o[kv]) * k - o[kw] * d) * dt; o[kv] += o[kw] * dt; }
  /* Pendel (Gürtelteile, Kapuzenzipfel): Winkel zur Senkrechten, angetrieben von Beschleunigung und Fahrtwind */
  function pendulum(S, ka, kw, L, ax, drag, dt) {
    const a = S[ka];
    S[kw] += (-(620 / L) * Math.sin(a) - S[kw] * 7 + (ax / L) * Math.cos(a) * 0.9 + drag * Math.cos(a)) * dt; /* + = nach hinten */
    S[ka] = cl(a + S[kw] * dt, -1.6, 1.6);
  }
  function secPre(S, P, dt, time) {
    const vx = P.vx || 0, vy = P.vy || 0;
    if (S.pvx == null) { S.pvx = vx; S.pvy = vy; S.pg = !!P.onGround; S.tabA = 0; S.tabV = 0; S.b1 = 0; S.b1v = 0; S.b2 = 0; S.b2v = 0; S.hd = 0; S.hdv = 0; S.lq = 0; S.lqv = 0; S.look = 0; S.lookV = 0; S.ax = 0; S.trail = []; S.breathT = 0; }
    if (dt > 0) {
      const ax = cl((vx - S.pvx) / dt, -2500, 2500);
      S.ax = lp(S.ax, ax * P.face, 0.5);
      /* Landung: Stauchfeder mit Nachfedern; Absprung: kurzes Strecken */
      if (P.onGround && !S.pg && !P.climbing && !P.dead) S.lqv += 3 + cl(S.pvy / 520, 0, 1.2) * 13;
      /* W30 Grafik: Landung (Wucht) und Trefferrichtung merken */
      if (P.onGround && !S.pg && !P.climbing && !P.dead && !P.ledge) { S.landV = S.pvy; S.landT = 0; if (S.pvy > 430 && w30on()) w30Dust(P, S.pvy); }
      S.landT = (S.landT == null ? 9 : S.landT) + dt;
      if (P.hurtT > 0 && !(S.hurtP > 0)) S.hurtDir = Math.sign(vx || 0) * (P.face || 1) > 0 ? 1 : -1; /* +1: nach vorn gestoßen = Treffer von hinten */
      S.hurtP = P.hurtT || 0;
      if (!P.onGround && S.pg && vy < -150) S.lqv -= 6;
      spring(S, "lq", "lqv", 0, 430, 17, dt); S.lq = cl(S.lq, -0.6, 1);
      const drag = (vx * P.face) * 0.3 + (P.onGround ? 0 : -Math.abs(vy) * 0.05);
      const bob = P.onGround && Math.abs(vx) > 40 ? Math.sin((P.anim.run || 0) * TAU) * 30 : 0;
      pendulum(S, "b1", "b1v", 3.6, S.ax + bob, drag * 0.9, dt);
      pendulum(S, "b2", "b2v", 2.8, S.ax - bob * 0.7, drag * 0.7, dt);
      pendulum(S, "hd", "hdv", 4.2, S.ax * 0.8, drag * 1.2 - (Z.windX || 0) * 2 * P.face, dt);
    }
    S.pvx = vx; S.pvy = vy; S.pg = !!P.onGround;
  }
  /* nächster wacher Gegner vor Ezekiel → Kopf dreht sich hin (alle paar Bilder gesucht) */
  function lookTarget(S, P) {
    S.lf = (S.lf || 0) + 1;
    if (S.lf % 6 === 0) {
      S.le = null; let best = 1e9; const cx = P.x + P.w / 2, cy = P.y + 6;
      if (Z.enemies) for (const e of Z.enemies) {
        if (e.dead || !e.aware || e.hidden > 0) continue;
        const dx = (e.x + e.w / 2 - cx) * P.face, dy = e.y + e.h * 0.4 - cy;
        if (dx < 6 || dx > (e.def && e.def.boss && w30on() ? 300 : 130) || Math.abs(dy) > (e.def && e.def.boss && w30on() ? 140 : 70)) continue; /* W30 Grafik: Bosse auch von weiter weg im Blick */
        const d = dx + Math.abs(dy) * 1.5; if (d < best) { best = d; S.le = e; }
      }
    }
    const e = S.le; if (!e || e.dead) return 0;
    const dx = Math.max(6, (e.x + e.w / 2 - P.x - P.w / 2) * P.face), dy = e.y + e.h * 0.4 - P.y - 6;
    return cl(Math.atan2(dy, dx) * 0.6, -0.32, 0.36);
  }
  /* Waffenspur: Ring aus Abtastungen im Figurenraum (Ursprung zwischen den Füßen, Blick +x) */
  const TRAIL_MAX = 14;
  function trailPush(S, Fm, icon, time, cls) {
    const tp = tipOf(icon), tr = S.trail;
    const hx = Fm.e, hy = Fm.f;
    const ix = Fm.a * tp[0] + Fm.c * tp[1] + Fm.e, iy = Fm.b * tp[0] + Fm.d * tp[1] + Fm.f;
    const ox = Fm.a * tp[2] + Fm.c * tp[3] + Fm.e, oy = Fm.b * tp[2] + Fm.d * tp[3] + Fm.f;
    const s = { hx, hy, ia: Math.atan2(iy - hy, ix - hx), ir: Math.hypot(ix - hx, iy - hy), oa: Math.atan2(oy - hy, ox - hx), or: Math.hypot(ox - hx, oy - hy), t: time };
    const last = tr[tr.length - 1];
    /* große Sprünge zwischen zwei Bildern mit Zwischenschritten füllen (Bogen um die Hand statt gerader Kante) */
    if (last && time - last.t < 0.06) {
      let da = s.oa - last.oa; if (da > PI) da -= TAU; else if (da < -PI) da += TAU;
      const n = Math.min(5, Math.floor(Math.abs(da) / 0.22));
      for (let i = 1; i <= n; i++) { const k = i / (n + 1); tr.push({ hx: lp(last.hx, hx, k), hy: lp(last.hy, hy, k), ia: angLp(last.ia, s.ia, k), ir: lp(last.ir, s.ir, k), oa: angLp(last.oa, s.oa, k), or: lp(last.or, s.or, k), t: lp(last.t, time, k) }); }
    }
    tr.push(s); while (tr.length > TRAIL_MAX * 2) tr.shift();
    S.trCls = cls; S.trIcon = icon; /* W30 Grafik: Spurstil je Waffe */
  }
  function drawTrail(c, S, time, col, alpha) {
    const tr = S.trail, cls = S.trCls || "blade";
    const sty = w30on() ? TSTY[S.trIcon] : null; /* W30 Grafik: eigener Schwungbogen je Waffenart */
    const life = sty && sty.life ? sty.life : cls === "heavy" ? 0.15 : cls === "fist" ? 0.08 : cls === "stab" ? 0.09 : 0.11;
    while (tr.length && time - tr[0].t > life) tr.shift();
    const n = tr.length; if (n < 2) return;
    const pa = c.globalAlpha, po = c.globalCompositeOperation;
    c.globalCompositeOperation = "lighter";
    /* Außen- (Schneide) und Innenkante; die Innenkante zieht sich mit dem Alter zur Schneide hin zusammen → sichelförmig */
    const wIn = sty && sty.wIn != null ? sty.wIn : cls === "heavy" ? 0.42 : cls === "blade" ? 0.55 : cls === "stab" ? 0.75 : cls === "fist" ? 0.3 : 0.85;
    const OX = TRX, OY = TRY, IX = TRX2, IY = TRY2;
    for (let i = 0; i < n; i++) {
      const s = tr[i], u = cl(1 - (time - s.t) / life, 0, 1);
      OX[i] = s.hx + Math.cos(s.oa) * s.or; OY[i] = s.hy + Math.sin(s.oa) * s.or;
      const ix = s.hx + Math.cos(s.ia) * s.ir, iy = s.hy + Math.sin(s.ia) * s.ir, k = wIn * u * u;
      IX[i] = lp(OX[i], ix, k); IY[i] = lp(OY[i], iy, k);
    }
    /* drei Altersstufen als je eine Fläche (keine Nahtlinien zwischen Einzelvierecken) */
    const base = sty && sty.base ? sty.base : (cls === "heavy" ? 0.36 : 0.3) * (cls === "fist" ? 0.8 : 1);
    c.fillStyle = col;
    const B = 3;
    for (let b = 0; b < B; b++) {
      const i0 = Math.floor(b * (n - 1) / B), i1 = Math.min(n - 1, Math.floor((b + 1) * (n - 1) / B) + 1);
      if (i1 - i0 < 1) continue;
      c.globalAlpha = pa * base * (b + 1) / B;
      c.beginPath(); c.moveTo(OX[i0], OY[i0]);
      for (let i = i0 + 1; i <= i1; i++) c.lineTo(OX[i], OY[i]);
      for (let i = i1; i >= i0; i--) c.lineTo(IX[i], IY[i]);
      c.closePath(); c.fill();
    }
    /* heller Schneidenkern als ein Linienzug: dünn am alten Ende, kräftig an der Klinge */
    c.lineCap = "round"; c.lineJoin = "round";
    c.strokeStyle = cls === "heavy" ? "#ffc080" : "#fff6e6";
    const half = Math.max(0, Math.floor(n / 2) - 1);
    c.globalAlpha = pa * 0.35; c.lineWidth = cls === "heavy" ? 1 : 0.6;
    c.beginPath(); c.moveTo(OX[0], OY[0]); for (let i = 1; i <= half + 1 && i < n; i++) c.lineTo(OX[i], OY[i]); c.stroke();
    c.globalAlpha = pa * 0.8; c.lineWidth = cls === "heavy" ? 1.5 : 0.9;
    c.beginPath(); c.moveTo(OX[half], OY[half]); for (let i = half + 1; i < n; i++) c.lineTo(OX[i], OY[i]); c.stroke();
    /* W30 Grafik: Waffen mit eigener Kante (Zweihänder golden, Sense dunkelrot-violett, Hellebarde breit, Dolche scharf) */
    if (sty && sty.edge && n > 3) {
      c.strokeStyle = sty.edge; c.lineWidth = sty.ew || 1.6; c.globalAlpha = pa * (sty.ea || 0.3);
      c.beginPath(); for (let i = half; i < n; i++) { const s = tr[i], x = OX[i] + Math.cos(s.oa) * 1.4, y = OY[i] + Math.sin(s.oa) * 1.4; if (i === half) c.moveTo(x, y); else c.lineTo(x, y); } c.stroke();
    }
    /* Wucht-Waffen: glühender Außenrand */
    if (cls === "heavy" && !(sty && sty.edge)) {
      c.strokeStyle = "#ff5a1a"; c.lineWidth = 2.4; c.globalAlpha = pa * 0.22;
      c.beginPath(); for (let i = half; i < n; i++) { const s = tr[i], x = OX[i] + Math.cos(s.oa) * 1.1, y = OY[i] + Math.sin(s.oa) * 1.1; if (i === half) c.moveTo(x, y); else c.lineTo(x, y); } c.stroke();
    }
    c.globalAlpha = pa; c.globalCompositeOperation = po;
  }
  /* W30 Grafik: Spurstile je Waffe (life Sekunden, wIn Sichelbreite, base Deckkraft, edge Kantenfarbe) – kein Blau */
  const TSTY = {
    dagger: { life: 0.065, wIn: 0.28, base: 0.26 }, knives: { life: 0.065, wIn: 0.28, base: 0.26 }, rapier: { life: 0.075, wIn: 0.22, base: 0.24, edge: "#fff0d8", ew: 0.7, ea: 0.45 },
    scimitar: { life: 0.1, wIn: 0.5 }, sickles: { life: 0.09, wIn: 0.62, base: 0.26 }, sickle: { life: 0.09, wIn: 0.62, base: 0.26 }, claw: { life: 0.08, wIn: 0.4 }, krallen: { life: 0.08, wIn: 0.4 },
    dawn: { life: 0.18, wIn: 0.5, base: 0.4, edge: "#ffc040", ew: 2.6, ea: 0.3 }, zweihaender: { life: 0.18, wIn: 0.5, base: 0.4, edge: "#ffb040", ew: 2.6, ea: 0.28 },
    hammer: { life: 0.16, wIn: 0.36, base: 0.42, edge: "#ff6a1a", ew: 3, ea: 0.24 }, club: { life: 0.15, wIn: 0.4, base: 0.38 }, axe: { life: 0.15, wIn: 0.46, base: 0.38, edge: "#ff7a2a", ew: 2.2, ea: 0.24 }, anchor: { life: 0.16, wIn: 0.38, base: 0.4 },
    scythe: { life: 0.21, wIn: 0.95, base: 0.3, edge: "#b0305a", ew: 2.4, ea: 0.32 }, hellebarde: { life: 0.17, wIn: 0.72, base: 0.34, edge: "#ffd080", ew: 1.6, ea: 0.28 },
    spear: { life: 0.1, wIn: 0.85, base: 0.3 }, kampfstab: { life: 0.13, wIn: 0.6, base: 0.3 }, staff: { life: 0.13, wIn: 0.6, base: 0.28 }, whip: { life: 0.12, wIn: 0.9, base: 0.26 }
  };
  /* W30 Grafik: Staubring und Steinsplitter bei harter Landung (nicht auf Stufe 0) */
  function w30Dust(P, v) {
    if (lowGfx() || !Z.fx) return;
    const x = P.x + P.w / 2, y = P.y + P.h - 1, k = Math.min(1, (v - 430) / 300), col = Z.dustCol || "#8a7a70";
    for (const d of [-1, 1]) Z.fx.burst(x + d * 3, y, 4 + Math.round(4 * k), { col, sp: 70 + 60 * k, ang: d > 0 ? -0.25 : Math.PI + 0.25, spread: 0.5, life: 0.45, size: 2.4, kind: "smoke", g: -12 });
    Z.fx.burst(x, y, 3 + Math.round(3 * k), { col: ["#5a4a40", "#7a6a5a"], sp: 90, ang: -Math.PI / 2, spread: 1.6, life: 0.5, size: 1.4, kind: "shard", g: 600 });
    if (k > 0.5 && Z.fx.ring) Z.fx.ring(x, y, 18 + 10 * k, "rgba(200,180,150,.5)", 0.3, 1);
  }
  const TRX = new Float32Array(TRAIL_MAX * 2 + 8), TRY = new Float32Array(TRAIL_MAX * 2 + 8), TRX2 = new Float32Array(TRAIL_MAX * 2 + 8), TRY2 = new Float32Array(TRAIL_MAX * 2 + 8);
  /* Punkt aus dem aktuellen Zeichenraum in Weltkoordinaten (für Partikel an Hörnern/Mund) */
  function toWorld(c, M0inv, x, y) {
    const m = c.getTransform(), X = m.a * x + m.c * y + m.e, Y = m.b * x + m.d * y + m.f;
    return [M0inv.a * X + M0inv.c * Y + M0inv.e, M0inv.b * X + M0inv.d * Y + M0inv.f];
  }
  /* kalte Gebiete: Atemwolken */
  const COLD = { zinnen: 1, sturm: 1, wehrgang: 1, hafen: 1, see: 1 };
  function isCold() {
    const lv = Z.level; if (!lv) return false;
    if (lv.hub) return false;
    const bid = lv.biome || (lv.base) || ""; if (COLD[bid]) return true;
    const w = Z.biome && Z.biome.weather; return !!(w && (w.includes("rain") || w.includes("drizzle") || w.includes("snow")));
  }
  let SECV = null; /* Sekundärwerte für die Teilzeichner (Kopf, Rumpf) */

  /* hinterer Schulterpanzer (Rumpf-Koordinaten) */
  function backShoulder(c) { poly(c, [-5.6, -12.4, -2.6, -14.6, 0.6, -13, -0.6, -10.4, -4.6, -10], "#140d0f"); poly(c, [-3.6, -13.8, -6, -17.4, -1.8, -14.2], "#100a0c"); }
  const TORSO = g => { drawTorso(g, null, 1, 0, 0, 1); backShoulder(g); };
  /* vorderer Schulterpanzer (über dem Oberarm), Ursprung Schulter */
  function shoulderF(c) {
    poly(c, [-1.4, -2.6, -4.6, -5.8, -0.2, -3], "#100a0c"); poly(c, [-2.8, -1.4, -6.4, -2.8, -2.6, 0], "#100a0c");
    ell(c, 0, 0.2, 3.4, 2.7, "#1a1214", -0.2);
    ell(c, 0.2, -0.3, 2.7, 2, "#2c2024", -0.2);
    c.strokeStyle = EZ.edge; c.lineWidth = 0.6; c.beginPath(); c.ellipse(0, 0.2, 3.1, 2.4, -0.2, PI * 1.05, PI * 1.85); c.stroke();
    limb(c, -2.6, 1.6, 2.6, 1.0, 0.6, "#120c0e");
  }
  /* Waffen ohne Zeitabhängigkeit dürfen auf Stufe 0 aus dem Sprite-Zwischenspeicher kommen (Bogen/Peitsche: Spannung in 1/8-Stufen) */
  const WSPR = new Set(["sickles", "sickle", "dagger", "dawn", "hammer", "scythe", "whip", "spear", "axe", "club", "rapier", "scimitar", "claw", "anchor", "stonefist", "fist", "bow", "xbow", "knives", "vial", "web", "shield", "goldshield", "thornshield"]);
  function weaponP(c, icon, col, t, ext, pps) {
    if (pps && WSPR.has(icon)) {
      const eq = Math.round((ext || 0) * 8) / 8, key = "PW|" + pps + "|" + icon + "|" + col + "|" + eq;
      if (partSpr(c, key, 20, 48, 30, 20, pps, g => weapon(g, icon, col, 0, eq))) return;
    }
    weapon(c, icon, col, t, ext);
  }

  Z.drawPlayer = function (c, P, time) {
    if (!P.cape) capeInit(P);
    const S = pstate(P);
    const dt = S.lt == null ? 0 : cl(time - S.lt, 0, 0.1); S.lt = time; S.pdt = dt;
    secPre(S, P, dt, time);
    const low = lowGfx();
    const flick = P.iframe > 0 && P.hurtT <= 0 && P.rollT <= 0 && !P.ledge && Math.floor(time * 20) % 2 === 0 && P.iframe < 0.7 && P.iframe > 0.05 && !(P.act && P.act.dash);
    const alpha = P.invis > 0 ? 0.28 : flick ? 0.45 : 1;
    const cx = P.x + P.w / 2, fy = P.y + P.h;
    const wrath = P.wrath > 0;
    /* Glut-Aura bei Darkin-Zorn */
    if (wrath) { glow(c, cx, P.y + 14, 30 + Math.sin(time * 10) * 4, "rgba(255,40,40,.45)"); if (Math.random() < 0.5) Z.fx.p({ x: cx + (Math.random() - 0.5) * 14, y: P.y + Math.random() * P.h, vx: 0, vy: -40, life: 0.5, size: 2, col: "#ff3a2a", kind: "glow", add: true }); }
    /* ---- Rolle: zusammengerollte Kugel mit Hörnern und eingewickeltem Umhang ---- */
    if (P.rollT > 0) {
      const k = 1 - P.rollT / Z.PC.ROLL;
      P.capeA = { x: cx - P.face * 2, y: fy - 8 };
      c.save(); c.translate(cx, fy); c.scale(P.face, 1); c.globalAlpha = alpha;
      /* Wischspur */
      c.save(); c.globalAlpha = alpha * 0.35 * Math.sin(k * PI); c.strokeStyle = (Z.capeCol && Z.capeCol[0]) || "#8a1414"; c.lineWidth = 3;
      c.beginPath(); c.arc(0, -8, 9.5, PI * 0.55, PI * 1.25); c.stroke(); c.restore();
      const sq = k < 0.12 ? 1 - k * 1.2 : k > 0.88 ? 1 - (1 - k) * 0.9 : 0.88 + Math.abs(Math.sin(k * TAU * 2)) * 0.06;
      c.translate(0, -8 * sq); c.scale(1 / Math.sqrt(sq), sq); c.rotate(k * TAU);
      ell(c, 0, 0, 8.6, 7.8, "#1e1517"); ell(c, 0.6, -0.4, 6.8, 6, EZ.plate);
      /* Umhang um die Kugel gewickelt */
      c.fillStyle = (Z.capeCol && Z.capeCol[0]) || "#7a1414"; c.beginPath(); c.arc(0, 0, 9.2, 0.3, PI + 0.6); c.arc(0, 0, 6.2, PI + 0.6, 0.3, true); c.fill();
      c.strokeStyle = (Z.capeCol && Z.capeCol[1]) || "#4a0a0c"; c.lineWidth = 0.6; c.beginPath(); c.arc(0, 0, 7.8, 0.6, PI + 0.3); c.stroke();
      /* Hörner, Maske, Augenglut */
      poly(c, [-2.6, -6.8, -1, -13.4, 1.6, -7.2], EZ.horn); poly(c, [2.4, -6.4, 7, -11.2, 5.4, -5], EZ.horn);
      poly(c, [3, -5.4, 6.6, -3.6, 6.2, -0.6, 3.2, -1.6], EZ.bone);
      circ(c, 5, -3.4, 0.9, "#ff8a2a"); glow(c, 5, -3.4, 4, "rgba(255,110,40,.6)", alpha);
      limb(c, -2.5, 2.5, 2.2, 3.4, 1.2, "#ff6a1a");
      c.restore();
      /* W30 Grafik: Nachbilder hinter der Kugel (ab Stufe 1) und geduckte Haltung als Ausgangspunkt für das Aufrichten */
      if (w30on()) {
        if (!low && Math.abs(P.vx) > 40) { c.save(); for (let j = 1; j <= 2; j++) { c.globalAlpha = alpha * 0.16 / j; ell(c, cx - Math.sign(P.vx) * j * 5, fy - 8, 8, 7.4, (Z.capeCol && Z.capeCol[0]) || "#7a1414"); } c.restore(); }
        if (S.cur) { Object.assign(S.cur, { hx: 0.6, hy: -7.4, lean: 0.55, head: 0.25, fFx: 4, fFy: -0.8, fBx: -2.6, fBy: 0, toeF: 0.3, toeB: 0.8, hFx: 4.4, hFy: 4.6, hBx: 3.2, hBy: 5.4, tab: 0.6 }); S.key = "roll"; S.blending = false; }
        if (k > 0.8 && !S.rollDust && !low) { S.rollDust = 1; Z.fx.burst(cx, fy - 1, 4, { col: Z.dustCol || "#8a7a70", sp: 40, ang: -Math.PI / 2 - Math.sign(P.vx || 1) * 0.6, spread: 1.2, life: 0.35, size: 2, kind: "smoke", g: -10 }); }
        if (k < 0.5) S.rollDust = 0;
      }
      return;
    }
    /* ---- Pose bestimmen und überblenden ---- */
    computePose(TG, P, time, S);
    /* W11 R45: Schwebe-Schlag von der Leiter (P.ladHov) – Beine angezogen, Fußspitzen gestreckt, statt hängender Sprungbeine */
    if (P.ladHov > 0 && !P.onGround && !P.climbing && !P.dead) { const k = Math.min(1, P.ladHov / 0.15); TG.fFy = Math.min(TG.fFy, -3.4 * k); TG.fBy = Math.min(TG.fBy, -2.2 * k); TG.fFx += 0.8 * k; TG.toeF = Math.max(TG.toeF || 0, 0.8 * k); TG.toeB = Math.max(TG.toeB || 0, 0.9 * k); }
    const T = TG;
    if (T.key === "wall" && T.handAbsF) {
      /* Wandhände relativ zur Schulter der Zielpose, damit sie mit überblendet werden */
      pHx = T.hx; pHy = T.hy; pC = Math.cos(T.lean); pS = Math.sin(T.lean);
      toF(0.6, -10.4, SF); toF(-1.8, -10.2, SB);
      T.hFx = T.handAbsF[0] - SF[0]; T.hFy = T.handAbsF[1] - SF[1]; T.hBx = T.handAbsB[0] - SB[0]; T.hBy = T.handAbsB[1] - SB[1]; T.handAbsF = null; T.handAbsB = null;
    }
    const p = blendPose(S, TG, dt);
    /* Waffenwinkel überblenden (gleiche Waffe vorher/nachher) */
    if (S.ww > 0) {
      if (WI.icon && S.fromIcon === WI.icon && S.fromA != null && !(P.act && P.act.def && P.act.def.spin)) WI.ang = angLp(WI.ang, S.fromA, S.ww);
      if (WI.icon2 && S.fromIcon2 === WI.icon2 && S.fromA2 != null) WI.ang2 = angLp(WI.ang2, S.fromA2, S.ww);
    }
    S.lastA = WI.ang; S.lastA2 = WI.ang2; S.lastIcon = WI.icon; S.lastIcon2 = WI.icon2;
    /* Wappenrock federt der Pose hinterher, Kopf dreht sich zu nahen Gegnern */
    if (dt > 0) {
      spring(S, "tabA", "tabV", p.tab - cl(S.ax / 1400, -0.7, 0.7) + (P.onGround ? 0 : cl(-P.vy / 900, -0.5, 0.5)), 160, 9, dt);
      spring(S, "look", "lookV", (P.dead || WI.headTurn > 0) ? 0 : lookTarget(S, P), 70, 13, dt);
    }
    SECV = S;
    const headA = p.head + (S.look || 0);
    pHx = p.hx; pHy = p.hy; pC = Math.cos(p.lean); pS = Math.sin(p.lean);
    const deadK = P.dead && S.deadT0 != null ? cl((time - S.deadT0 - 0.6) / 1.2, 0, 1) : 0;
    const glowK = (wrath ? 1.4 : 1) * (1 - deadK);
    /* Umhang-Ansatz (Weltkoordinaten) für die Physik im nächsten Bild */
    toF(-2.2, -11.6, NK);
    {
      let nx = NK[0], ny = NK[1];
      if (T.rot) { const rc = Math.cos(T.rot), rs = Math.sin(T.rot), yy = ny - T.rotY; const x2 = nx * rc - yy * rs, y2 = nx * rs + yy * rc + T.rotY; nx = x2; ny = y2; }
      P.capeA = { x: cx + nx * P.face * T.sx, y: fy + ny * T.sy };
    }
    /* Umhang (in Weltkoordinaten) */
    drawCape(c, P, alpha, time, glowK);
    let M0inv = null; /* Weltmatrix nur bei Bedarf lesen (getTransform legt jedes Mal ein Objekt an) */
    /* Stufe 0: feste Teile (Rumpf, Kopf, Schulterpanzer, Waffen) aus dem Sprite-Zwischenspeicher, doppelt aufgelöst (drehen sauber);
       Gliedmaßen (IK), Umhang, Wappenrock, Pendel und alles Leuchten bleiben dynamisch */
    let pps = 0;
    if (Z.gq && Z.gq.lean && !Z.sprOff && c.canvas && c.canvas.id === "cv" && Z.gfx) { pps = Math.max(1, Math.round(Z.gfx.scale * 4) / 2); sprTick(); }
    const wantEmb = !low && !P.dead && (wrath || Math.abs(P.vx) > 140 || (P.act && P.act.type === "melee" && P.act.phase === "act")) && Math.random() < dt * (wrath ? 22 : 7);
    let wantBreath = false;
    if (!P.dead && dt > 0 && isCold()) { S.breathT -= dt; if (S.breathT <= 0) { wantBreath = true; S.breathT = Math.abs(P.vx) > 60 ? 0.9 : 2.3; } }
    if (wantEmb || wantBreath) M0inv = c.getTransform().inverse();
    c.save(); c.translate(cx, fy); c.scale(P.face, 1); c.globalAlpha = alpha;
    /* Streckung im Sprung, Stauchung beim Fallen (Squash & Stretch) */
    if (!P.onGround && !P.climbing && !P.ledge && !P.dead) { const k = cl(-P.vy / 420, -1, 1); if (k > 0.15) c.scale(1 - k * 0.06, 1 + k * 0.08); else if (k < -0.6) c.scale(1.03, 0.97); }
    /* Landefeder: Stauchen beim Aufkommen, leichtes Nachfedern; Strecken beim Absprung */
    if (Math.abs(S.lq) > 0.004 && !P.dead && !P.climbing) { const q = S.lq; c.scale(1 + q * 0.09, 1 - q * 0.11); }
    const F0 = low ? null : c.getTransform(); /* nur für die Waffenspur (nicht auf Stufe 0) */
    if (T.rot) { c.translate(0, T.rotY); c.rotate(T.rot); c.translate(0, -T.rotY); }
    if (T.sx !== 1 || T.sy !== 1) c.scale(T.sx, T.sy);
    if (P.dead && T.rot) c.translate(0, -2 * Math.min(1, T.rot / 0.84));
    /* Bodenschatten */
    if (P.onGround && !P.dead) { c.save(); c.globalAlpha = alpha * 0.28; ell(c, p.hx * 0.3, 0.6, 6.5, 1.3, "#000"); c.restore(); }
    /* Schultern und Hüftgelenke */
    toF(0.6, -10.4, SF); toF(-1.8, -10.2, SB);
    const hipF = [p.hx + 0.9, p.hy], hipB = [p.hx - 0.9, p.hy];
    /* Handziele */
    let hFx = SF[0] + p.hFx, hFy = SF[1] + p.hFy, hBx = SB[0] + p.hBx, hBy = SB[1] + p.hBy;
    if (T.handAbsF) { hFx = T.handAbsF[0]; hFy = T.handAbsF[1]; hBx = T.handAbsB[0]; hBy = T.handAbsB[1]; T.handAbsF = null; T.handAbsB = null; }
    /* zweiter Griff an Zweihändern: hintere Hand greift tiefer am Schaft */
    if (WI.grip2 != null && WI.icon) { hBx = hFx + Math.cos(WI.ang) * WI.grip2; hBy = hFy + Math.sin(WI.ang) * WI.grip2; }
    const ext = WI.ext;
    /* ---- hinteres Bein, hinterer Arm ---- */
    drawLeg(c, hipB[0], hipB[1], p.fBx, p.fBy - 1.3, p.toeB, false, glowK, time, pps);
    /* Schild auf dem Rücken */
    if (WI.shieldBack && !P.dead) { const q = [0, 0]; toF(-4.4, -6.5, q); c.save(); c.translate(q[0], q[1]); c.rotate(p.lean + 0.2); c.scale(0.7, 0.7); weaponP(c, WI.shieldBack.icon, WI.shieldBack.col, time, 0, pps); c.restore(); }
    const bA = drawArm(c, SB[0], SB[1], hBx, hBy, T.eB, false, glowK, time, pps);
    /* hintere Hand: zweite Klinge, Bogensehne, Faust */
    if (WI.icon2 && !WI.punchBack) { c.save(); c.translate(bA[0], bA[1]); c.rotate(WI.ang2); weaponP(c, WI.icon2, WI.col, time, 0, pps);
      /* W30 Grafik: zweite Klinge (Sicheln, Krummsäbel) zieht ihre eigene Spur */
      if (F0 && w30on() && P.act && P.act.type === "melee" && P.act.phase === "act" && !FISTS[WI.icon2]) { const t0 = S.trail, c0 = S.trCls, i0 = S.trIcon; S.trail = S.trail2 || (S.trail2 = []); trailPush(S, F0.inverse().multiply(c.getTransform()), WI.icon2, time, "blade"); S.trail = t0; S.trCls = c0; S.trIcon = i0; }
      c.restore(); }
    if (F0 && S.trail2 && S.trail2.length && w30on()) { if (S.trFace !== P.face) S.trail2.length = 0; else { const t0 = S.trail, c0 = S.trCls, i0 = S.trIcon; S.trail = S.trail2; S.trCls = "blade"; S.trIcon = WI.icon2 || i0; c.save(); c.setTransform(F0); drawTrail(c, S, time, trailCol(WI.col || "#ffd8b0"), alpha * 0.8); c.restore(); S.trail = t0; S.trCls = c0; S.trIcon = i0; } }
    else if (WI.icon2 && WI.punchBack) { c.save(); c.translate(bA[0], bA[1]); c.rotate(0); weaponP(c, WI.icon2, WI.col, time, 0, pps); c.restore(); }
    if (WI.hand2Icon) { c.save(); c.translate(bA[0], bA[1]); c.rotate(Math.atan2(bA[1] - bA[3], bA[0] - bA[2]) + 0.5); weaponP(c, WI.hand2Icon, WI.hand2Col, time, 0, pps); c.restore(); }
    drawHand(c, bA[0], bA[1], false, pps > 0);
    /* ---- vorderes Bein (unter dem Wappenrock) ---- */
    drawLeg(c, hipF[0], hipF[1], p.fFx, p.fFy - 1.3, p.toeF, true, glowK, time, pps);
    /* ---- Rumpf ---- */
    c.save(); c.translate(p.hx, p.hy); c.rotate(p.lean);
    /* Stufe 0: Rumpf samt hinterem Schulterpanzer als Sprite (überlappt Gürtelzeug und Wappenrock nicht); Gürtelanhänger entfallen (Pixelgröße) */
    const torsoSpr = pps && partSpr(c, "PT|" + pps, 8, 8, 19, 7, pps, TORSO);
    if (torsoSpr) drawTorso(c, p, glowK, time, WI.hurt, 2);
    else { drawTorso(c, p, glowK, time, WI.hurt); drawTrinkets(c, S, p.lean + (T.rot || 0)); }
    drawTabard(c, p, time, S.tabA, pps > 0);
    if (!torsoSpr) backShoulder(c);
    /* Kopf */
    c.save(); c.translate(1.1, -12.4); c.rotate(headA);
    if (WI.headTurn > 0) { let hs = Math.cos(WI.headTurn * PI); if (Math.abs(hs) < 0.18) hs = hs < 0 ? -0.18 : 0.18; c.translate(0.6, 0); c.scale(hs, 1); c.translate(-0.6, 0); }
    const rotW = p.lean + headA + (T.rot || 0);
    if (pps) {
      const hk = "PH|" + pps + "|" + (wrath ? 1 : 0) + (WI.hurt > 0.3 ? 1 : 0) + (P.anim && P.anim.blink > 0 ? 1 : 0) + (glowK > 0.02 ? 1 : 0);
      drawHead(c, P, glowK, time, alpha, WI.hurt, wrath, rotW, 2);
      if (!partSpr(c, hk, 11, 9, 19, 4, pps, g => drawHead(g, P, glowK, 0, 1, WI.hurt, wrath, 0, 1))) drawHead(c, P, glowK, time, alpha, WI.hurt, wrath, rotW, 1);
      drawHead(c, P, glowK, time, alpha, WI.hurt, wrath, rotW, 3);
    } else drawHead(c, P, glowK, time, alpha, WI.hurt, wrath, rotW);
    /* Glut an den Hornspitzen (bei Tempo, Zorn, im Schlag) */
    if (wantEmb) { const tipH = Math.random() < 0.5 ? [7.2, -16.2] : [-6.9, -16.4]; const w = toWorld(c, M0inv, tipH[0], tipH[1]); Z.fx.p({ x: w[0], y: w[1], vx: -P.vx * 0.25 + (Math.random() - 0.5) * 12, vy: -18 - Math.random() * 16, life: 0.45, size: 1.3, col: wrath ? "#ff4a2a" : "#ff8a3a", kind: "glow", add: true }); }
    /* Atemwolke aus der Maske */
    if (wantBreath) { const w = toWorld(c, M0inv, 5.6, -1.2); for (let i = 0; i < 2; i++) Z.fx.p({ x: w[0] + P.face * i, y: w[1], vx: P.face * (10 + i * 6) + P.vx * 0.3, vy: -4 - i * 3, life: 0.9 + i * 0.3, size: 1.4 + i * 0.5, col: "#e8e2dc", kind: "smoke", a: 0.55, drag: 0.94 }); }
    c.restore();
    c.restore();
    /* ---- vorderer Arm, Waffe, Schulterpanzer ---- */
    /* Waffenspur (unter dem Arm, über dem Körper) */
    const act = P.act, swingOn = !low && act && act.type === "melee" && WI.icon && !P.dead && (act.phase === "act" || (act.phase === "post" && act.t < 0.05) || P.plunge);
    if (S.trail && S.trail.length && (S.trFace !== P.face)) S.trail.length = 0;
    S.trFace = P.face;
    if (!low && S.trail && S.trail.length) { c.save(); c.setTransform(F0); drawTrail(c, S, time, trailCol(S.trCol || WI.col || "#ffd8b0"), alpha); c.restore(); }
    const fA = drawArm(c, SF[0], SF[1], hFx, hFy, T.eF, true, glowK, time, pps);
    if (WI.icon && !(WI.icon2 && WI.punchBack && FISTS[WI.icon] && false)) {
      c.save(); c.translate(fA[0], fA[1]); c.rotate(WI.ang);
      weaponP(c, WI.icon, WI.col, time, WI.icon === "bow" || WI.icon === "whip" || WI.icon === "xbow" ? ext : 0, pps);
      if (swingOn) {
        const sm = act.def && act.def.smear, cls = FISTS[WI.icon] ? "fist" : (sm && sm.stab) || WI.icon === "spear" && !(sm && !sm.stab) ? "stab" : WI.icon === "whip" ? "whip" : W2H[WI.icon] || (act.def && act.def.heavy) ? "heavy" : "blade";
        trailPush(S, F0.inverse().multiply(c.getTransform()), WI.icon, time, cls); S.trCol = WI.col;
      }
      /* Glanz beim Aufladen: Lichtpunkt wandert die Klinge entlang, voll geladen blitzt die Spitze */
      let gl = 0;
      if (act && act.type === "charge") gl = cl(act.charge || 0, 0, 1);
      else if (act && act.type === "melee" && act.phase === "pre" && act.def && (act.def.heavy || W2H[WI.icon])) gl = cl(act.t / Math.max(0.01, act.def.pre), 0, 1);
      if (gl > 0.25 && !P.dead) {
        const tp = tipOf(WI.icon), run = (time * 3.2) % 1, gx = lp(tp[0], tp[2], run), gy = lp(tp[1], tp[3], run);
        const pa = c.globalAlpha; c.globalCompositeOperation = "lighter";
        c.globalAlpha = pa * (gl - 0.25) * 1.2 * Math.sin(run * PI); star4(c, gx, gy, 1.6 + gl, "#fff4dc", time * 4);
        if (gl > 0.92) { const pu = 0.7 + 0.3 * Math.sin(time * 30); c.globalAlpha = pa * pu; star4(c, tp[2], tp[3], 3.4 * pu + 1, "#fffaf0", 0.3); c.globalAlpha = pa; glow(c, tp[2], tp[3], 7, "rgba(255,220,150,.8)", pu); }
        c.globalAlpha = pa; c.globalCompositeOperation = "source-over";
      }
      c.restore();
    }
    if (!swingOn && S.trail && S.trail.length && act && act.type === "melee" && act.phase === "pre") S.trail.length = 0;
    if (WI.flask > 0) { c.save(); c.translate(fA[0], fA[1]); c.rotate(-0.6 - WI.flask * 1.2); poly(c, [-1.6, 0, 1.6, 0, 2.2, -4.6, 0.8, -5.2, -0.8, -5.2, -2.2, -4.6], "#e8d8d0"); poly(c, [-1.3, -0.4, 1.3, -0.4, 1.8, -3.4, -1.8, -3.4], "#c02a2a"); limb(c, 0, -5.2, 0, -6.4, 1.3, "#8a6a40"); glow(c, 0, -2.5, 5, "rgba(255,80,80,.5)", alpha); c.restore(); }
    if (WI.glowHand) { glow(c, fA[0] + 1.5, fA[1], 7, "rgba(255,150,70,.6)", alpha); circ(c, fA[0] + 1.5, fA[1], 1.2, "#ffe0b0"); }
    drawHand(c, fA[0], fA[1], true, pps > 0);
    /* vorderer Schulterpanzer (über dem Oberarm) */
    c.save(); c.translate(SF[0], SF[1]); c.rotate(p.lean * 0.5 + (Math.atan2(fA[3] - SF[1], fA[2] - SF[0]) - PI / 2) * 0.3);
    if (!(pps && partSpr(c, "PS|" + pps, 8, 5, 7, 4, pps, shoulderF))) shoulderF(c);
    c.restore();
    /* Treffer: kurzes rotes Aufleuchten */
    if (WI.hurt > 0.3) glow(c, p.hx, p.hy - 8, 12, "rgba(255,40,30,.5)", alpha * WI.hurt);
    c.restore();
  };

  /* ======================= GEGNER ======================= */
  /* Q: Animationszustand des gerade gezeichneten Gegners (für alle Gestalten gleich ausgewertet)
     ph: ""/"pre"/"act"/"post", pre/act/post: Fortschritt 0..1, kind: Angriffsart, hurt: Rückstoß 0..1,
     dead: Todesfortschritt 0..1, alt: Wechselschlag bei Kombos */
  const Q = { ph: "", pre: 0, act: 0, post: 0, kind: "", hurt: 0, dead: 0, deadT: 0, alt: 0, air: false, time: 0, boss: false, mv: "" };
  /* Winkel/Wert für einen Schwung: Ruhe → ausgeholt → durchgezogen → zurück */
  function swing(rest, back, fwd) {
    if (Q.ph === "pre") return lp(rest, back, eo(Q.pre));
    if (Q.ph === "act") return lp(back, fwd, eo(Q.act));
    if (Q.ph === "post") return lp(fwd, rest, eio(Q.post));
    return rest;
  }
  /* 0 in Ruhe, steigt beim Ausholen auf 1, bleibt im Schlag, klingt danach ab */
  function charge() { return Q.ph === "pre" ? eo(Q.pre) : Q.ph === "act" ? 1 : Q.ph === "post" ? 1 - Q.post : 0; }
  /* Zittern am Ende des Ausholens */
  function shake(a) { return Q.ph === "pre" && Q.pre > 0.7 ? jit(Q.time, 3) * a * (Q.pre - 0.7) / 0.3 : 0; }
  function setQ(e, time) {
    Q.time = time; Q.ph = ""; Q.pre = Q.act = Q.post = 0; Q.kind = ""; Q.alt = 0; Q.mv = "";
    const act = e.act, d = e.def;
    if (act && act.a) {
      const a = act.a; Q.kind = a.k || ""; Q.ph = act.phase;
      if (act.phase === "pre") Q.pre = cl(act.t / Math.max(0.01, a.pre || 0.3), 0, 1);
      else if (act.phase === "act") {
        const gap = a.n > 1 && a.gap ? a.gap : 0;
        if (gap) { Q.alt = Math.floor(act.t / gap) % 2; Q.act = cl((act.t % gap) / Math.max(0.05, Math.min(gap * 0.8, (a.act || 0.1) + 0.04)), 0, 1); }
        else Q.act = cl(act.t / Math.max(0.05, (a.act || 0.1) + 0.03), 0, 1);
      } else if (act.phase === "post") Q.post = cl(act.t / Math.max(0.01, a.post || 0.3), 0, 1);
    } else if (d.boss && e.mv && d.moves && d.moves[e.mv.id]) {
      const m = e.mv, md = d.moves[m.id]; Q.mv = m.id; Q.kind = m.id;
      if (m.stage === "pre") { Q.ph = "pre"; Q.pre = cl(m.t / Math.max(0.01, md.pre || 0.5), 0, 1); }
      else if (m.stage === "act") { Q.ph = "act"; const dur = m.dur != null ? m.dur : md.dur || 0.2; Q.act = cl(m.t / Math.max(0.08, Math.min(dur, 0.35)), 0, 1); Q.actLong = cl(m.t / Math.max(0.05, dur), 0, 1); }
      else { Q.ph = "post"; Q.post = cl(m.t / Math.max(0.01, md.post || 0.5), 0, 1); }
    }
    Q.hurt = e.dead ? 0 : Math.max(e.kbT > 0 ? cl(e.kbT / 0.18, 0, 1) : 0, e.stagger > 0 ? cl(e.stagger * 3, 0, 0.8) : 0);
    Q.deadT = e.dead ? e.deadT || 0 : 0; Q.dead = e.dead ? cl(Q.deadT / 0.3, 0, 1) : 0;
    Q.air = !e.onGround && !d.fly; Q.boss = !!d.boss;
  }
  /* Beine mit Knie (IK): Hüfte (hx,hy), Schrittlänge, Farben; Füße stehen in Ruhe, schreiten im Lauf */
  function legs(c, k, o) {
    const hy = o.hy, len = o.len, mv = o.mv, ph = o.ph, st = o.stride || 3, lift = o.lift || 2, sp = o.spread == null ? 2 : o.spread;
    const l1 = len * 0.5, l2 = len * 0.5;
    for (let i = 0; i < 2; i++) {
      const s = i === 0 ? 1 : -1; /* i=0 hinteres Bein */
      let fx, fy;
      if (mv) { const a = ph + (i ? PI : 0); fx = Math.sin(a) * st; fy = -Math.max(0, Math.cos(a)) * lift; }
      else { fx = (i ? sp : -sp); fy = 0; }
      if (Q.ph === "pre" && !mv) fx += (i ? -0.5 : -1.5) * eo(Q.pre) * (o.brace || 1);
      if ((Q.ph === "act" || Q.ph === "post") && !mv) fx += (i ? 2.2 : -1) * (Q.ph === "act" ? eo(Q.act) : 1 - Q.post) * (o.brace || 1);
      if (Q.air) { fx = i ? 2 : -1.5; fy = i ? -3 : -1.5; }
      const hx = (o.hx || 0) + (i ? 0.8 : -0.8);
      const [kx, ky, ax, ay] = ik(hx, hy, fx, fy - (o.ankle || 0.8), l1, l2, o.bend || 1);
      const colT = k(i ? o.colF : o.colB), colS = k(i ? (o.colF2 || o.colF) : (o.colB2 || o.colB));
      limb(c, hx, hy, kx, ky, o.w, colT); limb(c, kx, ky, ax, ay, o.w * 0.88, colS);
      if (o.foot !== false) { const fc = k(i ? (o.footF || "#1a1410") : (o.footB || "#120e0c")); poly(c, [ax - 1.2, ay - 0.6, ax + 0.8, ay - 0.9, ax + (o.toe || 2.4), ay + 0.4, ax + (o.toe || 2.4), ay + 0.9, ax - 1.2, ay + 0.9], fc); }
      if (o.knee) circ(c, kx + 0.3, ky, o.w * 0.45, k(o.knee));
    }
  }
  /* Arm per IK von der Schulter zu einem Handziel; gibt [hx,hy,ex,ey] */
  function arm(c, k, sx, sy, tx, ty, l1, l2, w, col, col2, bend) {
    const r = ik(sx, sy, tx, ty, l1, l2, bend == null ? -1 : bend);
    limb(c, sx, sy, r[0], r[1], w, k(col)); limb(c, r[0], r[1], r[2], r[3], w * 0.9, k(col2 || col));
    return [r[2], r[3], r[0], r[1]];
  }
  /* Handziel aus Winkel (0 = vorn, PI/2 = unten) und Reichweite */
  const HT = [0, 0];
  function hand(sx, sy, ang, r) { HT[0] = sx + Math.cos(ang) * r; HT[1] = sy + Math.sin(ang) * r; return HT; }
  /* Todesarten je Gestalt */
  const DEATH = { goblin: "fall", human: "fall", zombie: "fall", armor: "scatter", golem: "crumbleBig", golemBig: "crumbleBig", kuotoa: "fall", duergar: "fall", ettercap: "fall", mane: "fall", blight: "fall",
    skel: "crumble", blob: "splat", bloat: "burst", wraith: "fade", wisp: "fade", sac: "splat", rat: "flip", spider: "flip", crab: "flip", wolf: "side", wolfrider: "side",
    stirge: "drop", harpy: "drop", ray: "drop", dummy: "none" };
  const BOSSD = { dragon: "side", spider: "flip", wasp: "drop", vulture: "drop", demogorgon: "sink", golem: "crumbleBig", golemBig: "crumbleBig", wraith: "fade" };
  /* Wie stark sich der ganze Körper beim Ausholen/Schlagen neigt */
  const LEANF = { wolf: 0.35, wolfrider: 0.35, rat: 0.3, spider: 0.25, crab: 0.3, blob: 0, bloat: 0.3, wisp: 0, sac: 0, ray: 0.3, stirge: 0.4, harpy: 0.6, wraith: 0.6, golem: 0.6, golemBig: 0.6, dummy: 0, dragon: 0.25, demogorgon: 0, wasp: 0.35, vulture: 0.5, giant: 0.7 };

  /* Animationsgedächtnis je Gegner: geglättete Geschwindigkeit (Gewicht/Neigung), Rückstoß-Feder,
     eingefrorene Zeit, Aufmerksam-Werden. Nur kleine Zahlen, kein Zeichnen. */
  const EST = new WeakMap();
  function estate(e, time) {
    let s = EST.get(e);
    if (!s) { s = { lt: time, sv: e.vx || 0, kr: 0, kv: 0, kd: 1, fz: null, fa: 0, am: 0.5, pa: e.alertT || 0, sq: 0, sqv: 0, air: !e.onGround }; EST.set(e, s); }
    const dt = cl(time - s.lt, 0, 0.05); s.lt = time; s.dt = dt;
    return s;
  }
  /* niedrige Grafikstufe („Handheld“): weniger Zusatzschmuck */
  const lowGfx = () => !!(Z.gq && (Z.gq.level === 0 || (Z.gq.level === -1 && Z.gq.part < 0.3)));
  Z.lowGfx = lowGfx;
  /* vierzackiger Stern (Betäubung, Glanz) */
  function star4(c, x, y, r, col, rot) {
    c.fillStyle = col; c.beginPath();
    for (let i = 0; i < 8; i++) { const a = (rot || 0) + i * PI / 4, rr = i % 2 ? r * 0.32 : r; if (i) c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); else c.moveTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
    c.closePath(); c.fill();
  }
  Z.draw.star4 = star4;
  /* Flammenzunge (Spitze nach oben), Höhe h, Breite w */
  function flame(c, x, y, w, h, col, sway) {
    c.fillStyle = col; c.beginPath(); c.moveTo(x - w, y);
    c.quadraticCurveTo(x - w * 1.05, y - h * 0.55, x + sway, y - h);
    c.quadraticCurveTo(x + w * 1.05, y - h * 0.55, x + w, y);
    c.quadraticCurveTo(x, y + w * 0.7, x - w, y); c.fill();
  }
  /* Zustands-Überlagerungen in Weltkoordinaten (nach der Gestalt) */
  function statusFx(c, e, d, time, S, low) {
    const x = e.x, y = e.y, w = e.w, h = e.h, cx = x + w / 2;
    const st = e.st || {};
    /* Eis: Kristallpanzer an den Füßen und Kanten, Reif-Funkeln (kein Blau: weiß, grünlich-grau) */
    if (e.frozenT > 0) {
      const a = Math.min(1, e.frozenT * 3);
      c.save(); c.globalAlpha *= a;
      const n = Math.max(3, Math.min(7, Math.round(w / 5)));
      for (let i = 0; i < n; i++) {
        const u = (i + 0.5) / n, bx = x + u * w, hh = Math.min(h * 0.42, 3 + h * (0.12 + 0.2 * Math.abs(Math.sin(i * 2.7 + 1)))), ww = w / n * 0.62 + 0.8;
        const tilt = (u - 0.5) * 3;
        poly(c, [bx - ww, y + h + 0.5, bx - ww * 0.4 + tilt * 0.3, y + h - hh, bx + tilt, y + h - hh - ww * 0.8, bx + ww * 0.5 + tilt * 0.3, y + h - hh * 0.8, bx + ww, y + h + 0.5], i % 2 ? "rgba(236,246,242,.72)" : "rgba(214,232,226,.66)");
        limb(c, bx - ww * 0.25, y + h - 1, bx + tilt * 0.8, y + h - hh - ww * 0.5, 0.5, "rgba(255,255,255,.9)");
      }
      /* Splitterkappe oben und Reif-Linien */
      poly(c, [cx - w * 0.35, y + 2, cx - w * 0.1, y - 2.5, cx + w * 0.05, y + 1, cx + w * 0.3, y - 1.5, cx + w * 0.4, y + 2.5], "rgba(240,250,246,.7)");
      c.strokeStyle = "rgba(255,255,255,.55)"; c.lineWidth = 0.5; c.beginPath();
      c.moveTo(x + 1, y + h * 0.3); c.lineTo(x + w * 0.3, y + h * 0.45); c.lineTo(x + w * 0.2, y + h * 0.65);
      c.moveTo(x + w - 1, y + h * 0.2); c.lineTo(x + w * 0.7, y + h * 0.4); c.stroke();
      if (!low) for (let i = 0; i < 3; i++) { const ph = (time * 0.9 + i * 0.37) % 1; if (ph < 0.35) { const s = Math.sin(ph / 0.35 * PI); star4(c, x + w * ((i * 0.37 + 0.2) % 1), y + h * ((i * 0.61 + 0.15) % 1), 2.2 * s, "rgba(255,255,255,.95)", 0.4); } }
      c.restore();
    }
    /* Brennen: Flammenzungen auf dem Körper (additiv), dunkle Rußkante */
    if (st.burn > 0 && !(e.frozenT > 0)) {
      const a = Math.min(1, st.burn * 2);
      c.save(); c.globalAlpha *= a; c.globalCompositeOperation = "lighter";
      const n = low ? 2 : Math.max(2, Math.min(5, Math.round(w / 6)));
      for (let i = 0; i < n; i++) {
        const u = (i + 0.5) / n, fx = x + w * (0.15 + u * 0.7), ph = time * 9 + i * 2.1;
        const fh = h * (0.32 + 0.12 * Math.sin(ph)) + 2, fw = 1.6 + w * 0.06, base = y + h * (0.45 + 0.35 * ((i * 0.53) % 1));
        flame(c, fx, base, fw, fh, "rgba(255,90,20,.55)", Math.sin(ph * 1.3) * 1.5);
        flame(c, fx, base, fw * 0.55, fh * 0.62, "rgba(255,210,110,.75)", Math.sin(ph * 1.3) * 1.1);
      }
      c.restore();
      glow(c, cx, y + h * 0.5, h * 0.75, "rgba(255,110,30,.35)", a);
    }
    /* Gift: aufsteigende grüne Bläschen, Tropfen, fahler Schimmer */
    if (st.poison > 0) {
      const a = Math.min(1, st.poison * 2);
      c.save(); c.globalAlpha *= a;
      const n = low ? 2 : 4;
      for (let i = 0; i < n; i++) {
        const ph = (time * 0.8 + i * 0.29) % 1, bx = x + w * ((i * 0.41 + 0.2) % 1) + Math.sin(time * 4 + i) * 1.2, by = y + h * 0.5 - ph * (h * 0.6 + 6);
        const r = 0.8 + ((i * 7) % 3) * 0.35 + ph * 0.5;
        c.globalAlpha = a * (ph < 0.85 ? 0.9 : (1 - ph) / 0.15 * 0.9);
        c.strokeStyle = "#9ad04a"; c.lineWidth = 0.6; c.beginPath(); c.arc(bx, by, r, 0, TAU); c.stroke();
        circ(c, bx - r * 0.35, by - r * 0.35, r * 0.3, "rgba(220,255,170,.8)");
      }
      const dp = (time * 1.3) % 1; c.globalAlpha = a * (1 - dp); circ(c, x + w * 0.6, y + h * 0.55 + dp * h * 0.45, 0.7, "#7ab03a");
      c.restore();
      glow(c, cx, y + h * 0.5, h * 0.6, "rgba(140,210,60,.28)", a * (0.7 + 0.3 * Math.sin(time * 5)));
    }
    /* Betäubung: kreisende Sterne (und bei großen Gegnern zwei Vögelchen) über dem Kopf */
    if (st.stun > 0 && !(e.frozenT > 0) && !e.dead) {
      const hy = y - 4 - (d.boss ? 4 : 0), rx = Math.max(5, w * 0.45), ry = 2.2;
      const n = d.boss || d.heavy ? 4 : 3;
      for (let i = 0; i < n; i++) {
        const a = time * 5 + i * TAU / n, sx = cx + Math.cos(a) * rx, sy = hy + Math.sin(a) * ry, front = Math.sin(a) > 0;
        const sz = (front ? 2.4 : 1.7) * (0.9 + 0.1 * Math.sin(time * 12 + i));
        if ((d.boss || d.heavy) && i % 2) {
          /* Vögelchen: zwei flatternde Bögen */
          const fl = Math.sin(time * 22 + i) * 1.1;
          c.strokeStyle = front ? "#f0e6d8" : "#a8a098"; c.lineWidth = 0.8; c.beginPath(); c.moveTo(sx - 2.2, sy - fl); c.quadraticCurveTo(sx - 1, sy - 1.2, sx, sy); c.quadraticCurveTo(sx + 1, sy - 1.2, sx + 2.2, sy - fl); c.stroke();
        } else star4(c, sx, sy, sz, front ? "#ffe48a" : "#c8a050", a);
      }
      if (!low) glow(c, cx, hy, rx + 3, "rgba(255,220,120,.25)");
    }
  }
  /* „!“-Sprechblase beim Aufmerksam-Werden (weiß, rund – bewusst anders als die gelben Angriffs-Warnungen) */
  function alertBubble(c, x, y, u) {
    const pop = u < 0.25 ? eb(u / 0.25) : 1, fade = u > 0.8 ? 1 - (u - 0.8) / 0.2 : 1;
    if (fade <= 0) return;
    c.save(); c.globalAlpha *= fade; c.translate(x, y - (u < 0.25 ? (1 - u / 0.25) * 3 : 0)); c.scale(pop, pop);
    c.fillStyle = "rgba(20,14,12,.85)"; c.beginPath(); c.ellipse(0, -4, 4.4, 4.8, 0, 0, TAU); c.fill();
    poly(c, [-1.6, 0, 1.2, 0, -2.4, 2.8], "rgba(20,14,12,.85)");
    c.fillStyle = "#fff4e4"; c.beginPath(); c.ellipse(0, -4, 3.6, 4, 0, 0, TAU); c.fill();
    poly(c, [-1, -0.5, 0.6, -0.5, -1.8, 1.8], "#fff4e4");
    c.fillStyle = "#c0281e"; c.fillRect(-0.7, -7, 1.4, 3.6); c.fillRect(-0.7, -2.6, 1.4, 1.3);
    c.restore();
  }

  /* ---------- Sprite-Zwischenspeicher für Gegner-Gestalten (nur Stufe 0 / Handheld) ----------
     Die Gestalt (Gliedmaßen, Waffe, Gesicht) wird je Gegnerart × Zustand × quantisiertem Bild einmal in eine kleine
     Leinwand gezeichnet (beim ersten Bedarf, höchstens wenige je Bild) und danach nur noch per drawImage gesetzt.
     Ganzkörper-Bewegung (Ausholen-Neigung, Rückstoß, Stauchen, Tod), Blickrichtung (Spiegelung), Leuchten der
     Vorwarnung, Zustände, Glyphen und Balken bleiben dynamisch. Speicher: LRU-Obergrenze (32 MB, minimal 20 MB).
     Bilder je Zyklus: Ruhe 12 (2 s, 6 B/s), Lauf 8 je Schritt-Zyklus, Ausholen 6 (letztes = voll ausgeholt), Schlag 6, Nachlauf 4, Tod 6. */
  const SPR = new Map(), SPRBIG = new WeakMap(), DID = new WeakMap();
  let sprDid = 0, sprFrame = -1, sprMade = 0, sprScratch = null, sprSg = null;
  let rbEmpty = 0, rbFull = 0; /* W22 Geist */
  const SPRS = { hit: 0, miss: 0, fall: 0, evict: 0, scan: 0 };
  /* Sammelseiten (Atlas) in drei Größen: 128² für gewöhnliche Gestalten, 256²/512² für große. Kleine Seiten sind deutlich
     billiger – drawImage aus einer Leinwand und das Nachschreiben kosten in Chrome mit der Größe der Quell-Leinwand.
     Obergrenze 32 MB (minimal 20 MB); verdrängt wird die am längsten unbenutzte Seite. */
  const PAGES = [], CUR = {};
  let pgBytes = 0;
  const sprMaxBytes = () => (Z.gq && Z.gq.mini ? 20 : 32) * 1048576;
  function defId(d) { let i = DID.get(d); if (!i) { i = ++sprDid; DID.set(d, i); } return i; }
  function pageDrop(pg) {
    for (const k of pg.keys) SPR.delete(k);
    pg.keys.length = 0; pg.gen++; pgBytes -= pg.S * pg.S * 4; pg.cv.width = pg.cv.height = 0; SPRS.evict++;
    const i = PAGES.indexOf(pg); if (i >= 0) PAGES.splice(i, 1);
    for (const k in CUR) if (CUR[k] === pg) CUR[k] = null;
  }
  /* W22 Geist: alle Sprite-Seiten verwerfen (Kontextverlust, verfälschtes Rücklesen, Wächter) – Neuaufbau beim nächsten Bedarf */
  (Z._cachesNeu = Z._cachesNeu || []).push(() => {
    for (const pg of PAGES.slice()) pageDrop(pg);
    SPR.clear(); SBOX.clear(); pgBytes = 0; for (const k in CUR) CUR[k] = null; sprScratch = null; sprSg = null; rbEmpty = 0;
  });
  function pageAlloc(bw, bh) {
    const pw = bw + 2, ph = bh + 2; /* 1 px Rand gegen Überblenden beim Filtern */
    const S = Math.max(pw, ph) <= 128 ? 128 : Math.max(pw, ph) <= 256 ? 256 : 512;
    if (pw > S || ph > S) return null;
    let pg = CUR[S];
    if (pg) { if (pg.x + pw > S) { pg.x = 0; pg.y += pg.rh; pg.rh = 0; } if (pg.y + ph > S) pg = CUR[S] = null; }
    if (!pg) {
      while (pgBytes + S * S * 4 > sprMaxBytes()) {
        let lru = null; for (const q of PAGES) if (q.used < sprFrame && (!lru || q.used < lru.used)) lru = q;
        if (!lru) return null;
        pageDrop(lru);
      }
      const cv = document.createElement("canvas"); cv.width = cv.height = S;
      cv.addEventListener("contextrestored", () => { Z.cachesNeu && Z.cachesNeu("sprite-kontext"); }); /* W22 Geist: Seite nach Kontextverlust leer */
      pg = { cv, g: cv.getContext("2d"), S, keys: [], used: 0, gen: 0, x: 0, y: 0, rh: 0 }; PAGES.push(pg); pgBytes += S * S * 4; CUR[S] = pg;
    }
    const sx = pg.x + 1, sy = pg.y + 1; pg.x += pw; if (ph > pg.rh) pg.rh = ph; pg.used = sprFrame;
    return { pg, sx, sy };
  }
  /* In Zwischenleinwand zeichnen (Rahmen lokal: links L, rechts R, oben U, unten D; Maßstab ps), benutzten Bereich
     suchen und in eine Sammelseite kopieren. Rückgabe null = nicht möglich (zu groß, Fehler), {pg:null} = leer.
     edge (falls übergeben) wird gesetzt, wenn der Inhalt an den Rahmen stößt. */
  function sprMake(key, L, R, U, D, ps, draw, edge) {
    const W = Math.ceil((L + R) * ps), H = Math.ceil((U + D) * ps);
    if (W > 640 || H > 640 || W < 1 || H < 1) return null;
    if (!sprScratch) { sprScratch = document.createElement("canvas"); sprScratch.width = sprScratch.height = 160; sprSg = sprScratch.getContext("2d", { willReadFrequently: true }); }
    if (sprScratch.width < W || sprScratch.height < H) { sprScratch.width = Math.max(sprScratch.width, W); sprScratch.height = Math.max(sprScratch.height, H); }
    const g = sprSg;
    g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = "source-over"; g.clearRect(0, 0, W, H);
    g.save(); g.setTransform(ps, 0, 0, ps, L * ps, U * ps);
    try { draw(g); } catch (err) { g.restore(); return null; }
    g.restore(); g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = "source-over";
    /* benutzten Bereich suchen (Deckkraft > 2/255) */
    let x0 = W, x1 = -1, y0 = H, y1 = -1;
    /* W22 Geist: verfälschtes Rücklesen (Brave-Shields & Co.) → ganzer Rahmen statt Umriss-Suche (sonst „leer“ = unsichtbar) */
    if (Z.canvasLesbar && !Z.canvasLesbar()) { x0 = 0; y0 = 0; x1 = W - 1; y1 = H - 1; }
    else {
      const px = new Uint32Array(g.getImageData(0, 0, W, H).data.buffer);
      for (let y = 0; y < H; y++) {
        const o = y * W; let a = -1, b = -1;
        for (let x = 0; x < W; x++) if ((px[o + x] >>> 24) > 2) { a = x; break; }
        if (a < 0) continue;
        for (let x = W - 1; x >= a; x--) if ((px[o + x] >>> 24) > 2) { b = x; break; }
        if (y < y0) y0 = y; y1 = y; if (a < x0) x0 = a; if (b > x1) x1 = b;
      }
      /* W22 Geist: nur leere Ergebnisse, nie ein gefülltes → Rücklesen liefert offenbar Nullen (Lesetest umgangen) */
      if (x1 < 0) { if (++rbEmpty >= 30 && !rbFull && Z.canvasUnlesbar) Z.canvasUnlesbar("nur leere Sprites"); return { pg: null }; }
      rbFull++;
    }
    if (edge && (x0 === 0 || y0 === 0 || x1 === W - 1 || y1 === H - 1)) edge.hit = true;
    const bw = x1 - x0 + 1, bh = y1 - y0 + 1, slot = pageAlloc(bw, bh);
    if (!slot) return null;
    slot.pg.g.drawImage(sprScratch, x0, y0, bw, bh, slot.sx, slot.sy, bw, bh); slot.pg.keys.push(key);
    return { pg: slot.pg, sx: slot.sx, sy: slot.sy, sw: bw, sh: bh, x: x0 / ps - L, y: y0 / ps - U, w: bw / ps, h: bh / ps };
  }
  const EDGE = { hit: false };
  /* Gegner-Gestalt: Rahmen aus Körpergröße; stößt sie an, wird der Rahmen für diese Art vergrößert (nächster Aufbau) */
  /* Umrisse je Art × Maßstab × Zustandsgruppe: die ersten Bilder werden vermessen (Scan), danach wird direkt in die
     Sammelseite gezeichnet (Rahmen = vermessener Umriss + Rand, abgeschnitten) – kein Zurücklesen mehr.
     Schlag- und Todesbilder (Klinge/Knochen fliegen weit) werden immer vermessen. */
  const SBOX = new Map();
  function sprBuild(key, cat, fn, e, d, k, t, mv, ph, ak, time, ps, hLoc) {
    const draw = g => fn(g, e, d, k, t, mv, ph, ak, time);
    const bk = defId(d) + "|" + ps + "|" + cat; let b = SBOX.get(bk);
    if (!b || b.n < (cat[0] === "a" || cat[0] === "D" ? 1 : 3)) {
      SPRS.scan++;
      const big = SPRBIG.get(d) || 1, s = e.size || 1;
      const R = (Math.max(hLoc * 1.6, e.w / s * 1.3, 24) + 10) * big, up = (hLoc * 1.9 + 16) * big, dn = (hLoc * 0.6 + 10) * big;
      EDGE.hit = false;
      const r = sprMake(key, R, R, up, dn, ps, draw, EDGE);
      if (EDGE.hit && big < 2.2) SPRBIG.set(d, big * 1.4);
      if (r && r.pg && !EDGE.hit) {
        if (!b) { b = { n: 0, x0: r.x, y0: r.y, x1: r.x + r.w, y1: r.y + r.h }; if (SBOX.size > 3000) SBOX.clear(); SBOX.set(bk, b); }
        b.n++; b.x0 = Math.min(b.x0, r.x); b.y0 = Math.min(b.y0, r.y); b.x1 = Math.max(b.x1, r.x + r.w); b.y1 = Math.max(b.y1, r.y + r.h);
      }
      return r;
    }
    const pad = 2 + 0.12 * Math.max(b.x1 - b.x0, b.y1 - b.y0);
    const L = pad - b.x0, U = pad - b.y0, W = Math.ceil((b.x1 + pad + L) * ps), H = Math.ceil((b.y1 + pad + U) * ps);
    const slot = pageAlloc(W, H); if (!slot) return null;
    const g = slot.pg.g;
    g.save(); g.beginPath(); g.rect(slot.sx, slot.sy, W, H); g.clip(); g.setTransform(ps, 0, 0, ps, slot.sx + L * ps, slot.sy + U * ps);
    try { draw(g); } catch (err) { g.restore(); g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(slot.sx, slot.sy, W, H); return null; }
    g.restore(); g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = "source-over";
    slot.pg.keys.push(key);
    return { pg: slot.pg, sx: slot.sx, sy: slot.sy, sw: W, sh: H, x: -L, y: -U, w: W / ps, h: H / ps };
  }
  /* Welche Zustände eine Gestalt überhaupt unterscheidet (aus ihrem Quelltext und aufgerufenen Gestalten);
     fremde Gestalten (Nemesis) zählen vorsichtshalber alles */
  const SDEP = new WeakMap();
  function shapeDeps(fn, shape) {
    let r = SDEP.get(fn); if (r) return r;
    let src = ""; const seen = new Set();
    const add = f => { if (typeof f !== "function" || seen.has(f)) return; seen.add(f); const t = String(f); src += t; t.replace(/SHAPES\.(\w+)/g, (m, n) => { add(SHAPES[n]); return m; }); };
    add(fn);
    const all = /^nm_/.test(shape || "") || !src;
    const has = re => all || re.test(src);
    r = { vy: has(/e\.vy|e\.onGround/), aware: has(/e\.aware/), hurt: has(/Q\.hurt/), stun: has(/e\.st\b|broken/), sleep: has(/e\.sleep/), rev: has(/e\.revealed/), gr: has(/e\.grounded/), wob: has(/e\.wob/), alt: has(/Q\.alt/) };
    SDEP.set(fn, r); return r;
  }
  const NOK = col => col, FLASHK = () => "#fff6ea";
  /* Aufbau sofort beim ersten Bedarf (kleine Sammelseiten: Nachschreiben nach dem Lesen kostet kaum etwas) */
  function sprTick() { const fr = Z.gfx ? Z.gfx.frame : 0; if (fr !== sprFrame) { sprFrame = fr; sprMade = 0; } }
  /* Bauteil (Spieler) aus dem Zwischenspeicher setzen; false → selbst zeichnen */
  function partSpr(c, key, L, R, U, D, ps, draw) {
    const s = sprGet(key, () => sprMake(key, L, R, U, D, ps, draw));
    if (!s) return false;
    if (s.pg) c.drawImage(s.pg.cv, s.sx, s.sy, s.sw, s.sh, s.x, s.y, s.w, s.h);
    return true;
  }
  /* Schrift (Warn-Glyphen, Elite-Namen, Zustandssymbole) als Sprite: Text zeichnen ist auf schwachen Geräten teuer.
     (x, y) wie fillText mit textAlign center und Grundlinie alphabetic. */
  function txtSpr(c, txt, font, size, fill, stroke, lw, x, y) {
    if (document.fonts && document.fonts.status !== "loaded") return false; /* sonst bliebe die Ersatzschrift im Speicher */
    const ps = Z.gfx.scale * 2, key = "T|" + ps + "|" + font + "|" + fill + "|" + (stroke || "") + "|" + txt;
    const s = sprGet(key, () => {
      if (!sprSg) { sprScratch = document.createElement("canvas"); sprScratch.width = sprScratch.height = 160; sprSg = sprScratch.getContext("2d", { willReadFrequently: true }); }
      sprSg.font = font; const tw = sprSg.measureText(txt).width;
      const w = tw + lw + 2, up = size + lw / 2 + 1, h = up + size * 0.35 + lw / 2 + 1;
      const W = Math.ceil(w * ps), H = Math.ceil(h * ps), slot = pageAlloc(W, H); if (!slot) return null;
      const g = slot.pg.g;
      g.save(); g.beginPath(); g.rect(slot.sx, slot.sy, W, H); g.clip(); g.setTransform(ps, 0, 0, ps, slot.sx + (w / 2) * ps, slot.sy + up * ps);
      g.font = font; g.textAlign = "center"; g.textBaseline = "alphabetic";
      if (stroke) { g.strokeStyle = stroke; g.lineWidth = lw; g.lineJoin = "round"; g.strokeText(txt, 0, 0); }
      g.fillStyle = fill; g.fillText(txt, 0, 0); g.restore();
      slot.pg.keys.push(key);
      return { pg: slot.pg, sx: slot.sx, sy: slot.sy, sw: W, sh: H, x: -w / 2, y: -up, w: W / ps, h: H / ps };
    });
    if (!s) return false;
    if (s.pg) c.drawImage(s.pg.cv, s.sx, s.sy, s.sw, s.sh, x + s.x, y + s.y, s.w, s.h);
    return true;
  }
  function sprGet(key, mk) {
    const s = SPR.get(key);
    if (s) { if (s.pg && s.pg.gen !== s.gen) SPR.delete(key); else { SPRS.hit++; if (s.pg) s.pg.used = sprFrame; return s; } }
    if (sprMade >= (Z.gq && Z.gq.mini ? 2 : 3)) { SPRS.fall++; return null; } /* Aufbau-Budget je Bild erschöpft: diesmal direkt zeichnen */
    sprMade++; SPRS.miss++;
    let n = null; try { n = mk(); } catch (err) { n = null; }
    if (!n) return null;
    if (n.pg) n.gen = n.pg.gen;
    SPR.set(key, n); return n;
  }
  /* Gestalt per Sprite zeichnen; false → Aufrufer zeichnet wie bisher. Q ist bereits gesetzt (setQ). */
  function sprShape(c, e, d, fn, k, flash, tA, moving, phase, ps, hLoc) {
    let fk, qt, qph = 0, cat;
    const q0 = Q.pre, q1 = Q.act, q2 = Q.post, q3 = Q.hurt, q4 = Q.deadT, q5 = Q.dead, q6 = Q.time, q7 = Q.alt;
    const dp = shapeDeps(fn, d.shape);
    sprTick();
    if (e.dead) { const b = Math.min(5, (Q.deadT / 0.1) | 0); fk = "D" + b; cat = fk; Q.deadT = (b + 0.5) * 0.1; Q.dead = cl(Q.deadT / 0.3, 0, 1); qt = 0; flash = false; }
    else {
      let wb = -1;
      if (moving) { wb = ((((phase % TAU) + TAU) % TAU) / TAU * 8) | 0; if (Q.ph) wb &= 6; /* im Angriff 4 Schrittbilder */ qph = (wb + 0.5) * TAU / 8; }
      if (Q.ph === "pre") { const b = Math.min(5, (Q.pre * 6) | 0); Q.pre = (b + 1) / 6; fk = "p" + b; qt = 0.5; cat = "p" + Q.kind; }
      else if (Q.ph === "act") { const b = Math.min(5, (Q.act * 6) | 0); Q.act = (b + 0.5) / 6; if (!dp.alt) Q.alt = 0; fk = "a" + b + Q.alt; qt = 0.5; cat = "a" + b + Q.alt + Q.kind; }
      else if (Q.ph === "post") { const b = Math.min(3, (Q.post * 4) | 0); Q.post = (b + 0.5) / 4; fk = "o" + b; qt = 0.5; cat = "p" + Q.kind; }
      else if (wb >= 0) { fk = "w"; qt = wb * 0.25; cat = "i"; }
      else { const b = Q.air || Q.hurt > 0.4 ? 0 : ((tA * 6) | 0) % 12; fk = "i" + b; qt = b / 6; cat = "i"; } /* in der Luft/getroffen: Ruhe-Atmen egal */
      if (wb >= 0 && !Q.ph && (Q.air || Q.hurt > 0.4)) { wb &= 6; qph = (wb + 0.5) * TAU / 8; }
      if (wb >= 0) fk += "m" + wb;
      if (Q.ph) fk += Q.kind;
      /* Rückstoß zeigt die Ganzkörper-Feder; in der Gestalt nur „getroffen ja/nein“ (und nur, wenn die Gestalt es zeigt) */
      if (Q.hurt > 0.4 && dp.hurt) { Q.hurt = 0.8; fk += "h"; } else Q.hurt = 0;
    }
    Q.time = qt;
    const st = e.st;
    if (Q.air && !e.dead) { fk += dp.vy ? (e.vy < 0 ? "u" : "f") : "A"; cat += "A"; }
    if (dp.aware && e.aware && !Q.ph && !e.dead) fk += "w";
    if (dp.stun && ((st && st.stun > 0) || e.broken > 0)) fk += "s";
    if (dp.sleep && e.sleep) fk += "z";
    if (dp.rev && e.revealed) fk += "r";
    if (dp.gr && e.grounded) fk += "g";
    if (dp.wob && e.wob > 0) fk += "b";
    const psq = Math.max(0.5, Math.round(ps * 4) / 4);
    const key = defId(d) + "|" + psq + "|" + fk;
    const ak = legacyAk();
    /* Treffer-Blitz: eigene Variante mit weißen Körperfarben (wie k() beim direkten Zeichnen) */
    const fkey = flash ? key + "!" : key;
    const s0 = SPR.get(fkey);
    const s = s0 && !(s0.pg && s0.pg.gen !== s0.gen) ? (SPRS.hit++, s0.pg && (s0.pg.used = sprFrame), s0) : sprGet(fkey, () => sprBuild(fkey, cat, fn, e, d, flash ? FLASHK : NOK, qt, moving, qph, ak, qt, psq, hLoc));
    Q.pre = q0; Q.act = q1; Q.post = q2; Q.hurt = q3; Q.deadT = q4; Q.dead = q5; Q.time = q6; Q.alt = q7;
    if (!s) return false;
    if (s.pg) c.drawImage(s.pg.cv, s.sx, s.sy, s.sw, s.sh, s.x, s.y, s.w, s.h);
    return true;
  }
  Z.figSpr = { stats: () => ({ n: SPR.size, mb: +(pgBytes / 1048576).toFixed(2), pages: PAGES.length, hit: SPRS.hit, miss: SPRS.miss, scan: SPRS.scan, fall: SPRS.fall, evict: SPRS.evict }),
    clear: () => { SPR.clear(); while (PAGES.length) pageDrop(PAGES[0]); }, keys: () => [...SPR.keys()] };

  Z.drawEnemy = function (c, e, time) {
    const d = e.def;
    if (e.ceil && !e.aware) { /* Spinne an der Decke: Faden */ limb(c, e.x + e.w / 2, e.y - 60, e.x + e.w / 2, e.y + 2, 0.5, "rgba(230,230,240,.5)"); }
    const flash = e.flash > 0;
    const k = col => (flash ? "#fff6ea" : col);
    const cx = e.x + e.w / 2, fy = e.y + e.h;
    const act = e.act, pre = act && act.phase === "pre";
    const ES = estate(e, time), edt = ES.dt, low = lowGfx();
    /* Einfrieren: Zeit und Bewegung bleiben stehen */
    const frozen = e.frozenT > 0 && !e.dead;
    if (frozen) { if (ES.fz == null) { ES.fz = time; ES.fa = e.anim; } time = ES.fz; } else ES.fz = null;
    setQ(e, time);
    let alpha = e.hidden > 0 ? 0.12 : 1;
    if (e.spawnT > 0) alpha *= 1 - e.spawnT / 0.4;
    if (e.dead) alpha = d.boss ? Math.max(0, 1 - Math.max(0, e.deadT - 0.5) / 1.1) : Math.max(0, 1 - Math.max(0, e.deadT - 0.22) / 0.36);
    if (alpha <= 0.001) return;
    /* Elite-Aura */
    if (e.elite && !e.dead && !e.disguise) { glow(c, cx, e.y + e.h * 0.5, e.h * 1.1, "rgba(255,120,40,.35)"); if (Math.random() < 0.3) Z.fx.p({ x: cx + (Math.random() - 0.5) * e.w, y: fy - Math.random() * e.h, vx: 0, vy: -30, life: 0.6, size: 2, col: "#ff8a3a", kind: "glow", add: true }); }
    if (e.armorUp > 0) { c.save(); c.globalAlpha = 0.5; c.strokeStyle = "#ffd27a"; c.lineWidth = 1; c.beginPath(); c.ellipse(cx, e.y + e.h / 2, e.w * 0.9, e.h * 0.7, 0, 0, PI * 2); c.stroke(); c.restore(); }
    /* Vorwarnung: rotes Glühen, das kurz vor dem Schlag hell aufblitzt */
    if (pre && !d.boss) {
      const k2 = act.t / act.a.pre, tg = Z.enemyTg ? Z.enemyTg(act.a) : (act.a.glyph === "!!" || act.a.unblockable ? 3 : 1);
      if (tg) glow(c, cx, e.y + e.h * 0.45, e.h * (0.7 + k2 * 0.5), tg === 3 ? "rgba(255,40,30,.55)" : tg === 2 ? "rgba(255,110,30,.5)" : "rgba(255,190,70,.42)");
      if (k2 > 0.75) glow(c, cx, e.y + e.h * 0.45, e.h * 0.6, "rgba(255,255,230,.6)");
    }
    if (d.boss && e.tele > 0) glow(c, cx, e.y + e.h * 0.45, e.h * 0.8, "rgba(255,90,40," + (0.3 + 0.3 * Math.sin(time * 30)) + ")");
    c.save(); c.globalAlpha = alpha; c.translate(cx, fy);
    const s = e.size || 1;
    /* Bodenschatten */
    if (!d.fly && e.onGround !== false && !e.ceil && d.shape !== "sac") { c.save(); c.globalAlpha = alpha * 0.22 * (1 - Q.dead * 0.5); ell(c, 0, 0.4, Math.max(4, e.w * 0.55), 1.4 + s * 0.3, "#000"); c.restore(); }
    if (e.pile > 0 && e.st.stun > 0) { /* Knochenhaufen (steht gleich wieder auf) */ c.scale(e.face * s, s); bonePile(c, k, 1, time, e.pile < 0.5 ? (0.5 - e.pile) * 2 : 0); c.restore(); return; }
    const dead = e.dead;
    c.scale(e.face * s, s);
    const shape = d.shape;
    /* Stufe 0: Gestalt aus dem Sprite-Zwischenspeicher (Pixelmaßstab vor der Ganzkörper-Bewegung bestimmen) */
    let sprPs = 0;
    if (Z.gq && Z.gq.lean && !Z.sprOff) { if (!d.boss && shape !== "dummy" && c.canvas && c.canvas.id === "cv" && Z.gfx) sprPs = Z.gfx.scale * s; }
    else if (PAGES.length && !(Z.gq && Z.gq.lean)) Z.figSpr.clear(); /* Stufe gewechselt: Speicher freigeben */
    const hLoc = e.h / s; /* Körperhöhe in lokalen Einheiten */
    /* ---- Ganzkörper-Bewegung: Anspannen, Zuschlagen, Rückstoß ---- */
    const lf = LEANF[shape] != null ? LEANF[shape] : 1;
    const piv = d.fly ? -hLoc * 0.5 : 0;
    const moving = !frozen && Math.abs(e.vx) > 15 && e.onGround;
    const tA = frozen ? ES.fa : e.anim;
    const phase = tA * (Math.abs(e.vx) / 18 + 2);
    /* Feder für Landungen (Gegner springen/fallen auch) */
    const onG = e.onGround !== false || d.fly;
    if (onG && ES.air && !d.fly && !dead) ES.sqv -= 9;
    ES.air = !onG;
    ES.sqv += (-ES.sq * 260 - ES.sqv * 16) * edt; ES.sq += ES.sqv * edt;
    /* geglättete Geschwindigkeit → Beschleunigung → Gewichtsneigung */
    const vk = 1 - Math.exp(-edt * 7);
    const accel = frozen ? 0 : (e.vx || 0) - ES.sv; ES.sv += accel * vk;
    /* Rückstoß-Feder: zieht zum Zielwinkel, schwingt nach dem Treffer kurz über */
    let kTarget = 0;
    if (Q.hurt > 0 && !frozen) { if (e.kbT > 0 && Math.abs(e.vx) > 20) ES.kd = e.vx * e.face > 0 ? -1 : 1; kTarget = -0.26 * Q.hurt * (lf || 0.5) * ES.kd; }
    if (Math.abs(kTarget) > Math.abs(ES.kr) || kTarget * ES.kr < 0) { ES.kr = kTarget; ES.kv = 0; } /* Treffer wirkt sofort */
    ES.kv += ((kTarget - ES.kr) * 300 - ES.kv * 15) * edt; ES.kr += ES.kv * edt;
    if (!dead) {
      let rot = 0, sx = 1, sy = 1, ox = 0, oy = 0;
      if (Q.ph === "pre") { const p = eo(Q.pre); rot = -0.1 * p * lf; sy = 1 - 0.07 * p * (lf ? 1 : 0); sx = 1 + 0.05 * p * (lf ? 1 : 0); ox = -1 * p * lf + shake(0.6); }
      else if (Q.ph === "act") { const p = eo(Q.act); rot = lp(-0.1, 0.12, p) * lf; sx = lp(1.05, 1.03, p); sy = lp(0.93, 0.98, p); ox = lp(-1, 1.2, p) * lf; }
      else if (Q.ph === "post") { const p = 1 - Q.post; rot = 0.12 * p * lf; ox = 1.2 * p * lf; }
      /* Rückstoß: Federwinkel statt starrer Neigung; Körper rutscht nach hinten und wird gestaucht */
      if (Q.hurt > 0) { ox -= 1.6 * Q.hurt * ES.kd; sx *= 1 + 0.06 * Q.hurt; sy *= 1 - 0.05 * Q.hurt; }
      rot += ES.kr;
      /* Gewicht im Lauf: nach vorn lehnen, beim Bremsen/Anfahren nachgeben; schwere Gestalten stauchen bei jedem Auftritt */
      if (moving && !d.fly) {
        const spd = cl(Math.abs(e.vx) / 90, 0, 1);
        rot += 0.05 * spd * (lf || 0.4);
        const heavyW = d.heavy || d.boss || (e.size || 1) > 1.25;
        const contact = Math.pow(1 - Math.abs(Math.sin(phase)), 4);
        if (heavyW) { sy *= 1 - 0.035 * contact; sx *= 1 + 0.025 * contact; }
        else oy += contact * 0.35;
      }
      if (!frozen) rot += cl(accel * e.face / 260, -1, 1) * 0.1 * (lf || 0.3) * (d.fly ? 0.6 : 1);
      if (d.fly && !frozen) rot += cl((e.vx || 0) * e.face / 400, -0.2, 0.2);
      /* Landefeder */
      if (Math.abs(ES.sq) > 0.002) { sy *= 1 + ES.sq * 0.06; sx *= 1 - ES.sq * 0.045; }
      /* Aufmerksam werden: kurzes Zusammenzucken mit Hüpfer */
      if (e.alertT > 0 && e.aware && !frozen) {
        if (e.alertT > ES.pa + 0.01) ES.am = Math.max(0.2, e.alertT);
        const u = 1 - e.alertT / ES.am;
        if (u < 0.18) { const q = u / 0.18; sy *= 1 - 0.12 * Math.sin(q * PI) ; sx *= 1 + 0.08 * Math.sin(q * PI); }
        else if (u < 0.6) { const q = (u - 0.18) / 0.42; oy -= Math.sin(q * PI) * (d.fly ? 1.5 : 2.6); rot -= Math.sin(q * PI) * 0.08 * (lf || 0.4); }
      }
      ES.pa = e.alertT || 0;
      /* Betäubt: schwankt benommen um die Füße */
      if (e.st && e.st.stun > 0 && !frozen) { rot += Math.sin(time * 6.5) * 0.11 * (lf ? Math.min(1, lf + 0.3) : 0.4); ox += Math.sin(time * 3.2) * 0.6; sy *= 1 - 0.03 * (0.5 + 0.5 * Math.sin(time * 13)); }
      /* Bosse atmen sichtbar, solange sie nicht angreifen */
      if (d.boss && !Q.ph && !moving && !frozen) { const br = Math.sin(time * 1.7); sy *= 1 + 0.022 * br; sx *= 1 - 0.011 * br; }
      if (ox || oy) c.translate(ox, oy);
      if (rot) { c.translate(0, piv); c.rotate(rot); c.translate(0, -piv); }
      if (sx !== 1 || sy !== 1) { c.translate(0, piv); c.scale(sx, sy); c.translate(0, -piv); }
    } else {
      /* ---- Tod ---- */
      const kd = Q.dead, dt0 = Q.deadT;
      const ty = d.boss ? BOSSD[shape] || "boss" : DEATH[shape] || "fall";
      if (ty === "fall" || ty === "boss") {
        /* kippt mit Schwung um, prallt einmal kurz vom Boden ab */
        const dur = d.boss ? 0.8 : 0.3, kk = eb(cl(dt0 / dur, 0, 1));
        const bt = (dt0 - dur) / (dur * 0.6), bounce = bt > 0 && bt < 1 ? Math.sin(bt * PI) * (1 - bt) * 1.8 : 0;
        c.translate(-2.5 * kk, -1.6 * kk - bounce); c.rotate(-PI / 2 * 0.92 * kk + bounce * 0.05); if (d.boss && d.fly) c.translate(0, -dt0 * 30);
      }
      else if (ty === "splat") { const wob = Math.sin(dt0 * 38) * Math.exp(-dt0 * 9) * 0.25; c.scale(1 + kd * 0.9 + wob, 1 - kd * 0.78 - wob * 0.6); }
      else if (ty === "burst") { const kk = eo(kd), tr = Math.sin(dt0 * 70) * (1 - kd) * 0.06; c.translate(0, -hLoc * 0.4); c.scale(1 + kk * 0.5 + tr, 1 + kk * 0.35 - tr); c.translate(0, hLoc * 0.4); }
      else if (ty === "fade") { c.translate(Math.sin(dt0 * 14) * 1.5 * kd, -8 * eo(kd)); c.scale(1 - 0.35 * kd, 1 + 0.4 * kd); c.globalAlpha *= 1 - kd * 0.6; }
      else if (ty === "flip") { const kk = eo(kd), hop = Math.sin(cl(dt0 / 0.3, 0, 1) * PI) * 3.5; c.translate(0, -hLoc * 0.45 - hop); c.scale(1, lp(1, -0.85, kk)); c.translate(0, hLoc * 0.45); }
      else if (ty === "side") { const kk = eo(kd); c.translate(0, -1 * kk); c.scale(1, 1 - 0.35 * kk); c.rotate(0.15 * kk); }
      else if (ty === "drop") { const tt = Math.min(dt0, 0.45); c.translate(0, piv + tt * tt * 160); c.rotate(tt * 6); c.translate(0, -piv); }
      else if (ty === "sink") { c.translate(Math.sin(dt0 * 30) * (1 - cl(dt0 / 1.4, 0, 1)) * 1.2, eo(cl(dt0 / 1.4, 0, 1)) * hLoc * 0.5); }
      else if (ty === "scatter") { const kk = eo(kd); c.rotate(-0.25 * kk + Math.sin(dt0 * 40) * 0.04 * (1 - kd)); c.scale(1 + 0.25 * kk, 1 - 0.6 * kk); }
      else if (ty === "crumbleBig") { c.translate(Math.sin(dt0 * 50) * (1 - kd) * 0.8, 0); c.scale(1 + kd * 0.15, 1 - kd * 0.45); }
    }
    const shFn = SHAPES[shape] || SHAPES.human;
    if (!(sprPs > 0 && sprShape(c, e, d, shFn, k, flash, tA, moving, phase, sprPs, hLoc))) shFn(c, e, d, k, tA, moving, phase, legacyAk(), time);
    c.restore();
    /* Zustände: Eis, Feuer, Gift, Benommenheit */
    if (!dead && (e.frozenT > 0 || (e.st && (e.st.burn > 0 || e.st.poison > 0 || e.st.stun > 0)))) statusFx(c, e, d, time, ES, low);
    /* Aufmerksam geworden */
    if (e.alertT > 0 && e.aware && !dead && !d.boss && !pre) alertBubble(c, cx + e.face * e.w * 0.3, e.y - 3, 1 - e.alertT / ES.am);
    /* Glyphe über dem Kopf */
    const tgA = pre && !d.boss ? (Z.enemyTg ? Z.enemyTg(act.a) : (act.a.glyph === "!!" || act.a.unblockable ? 3 : 1)) : 0;
    if (pre && !d.boss && act.t > 0.05 && tgA) {
      /* W10: einheitliche Vorwarnung – Klasse 1 gelbes „!“, Klasse 2 (schwer) oranges „!!“, Klasse 3 (nicht blockbar) rotes „!!“ */
      const red = tgA >= 2, gl = red ? "!!" : "!", fc = tgA === 3 ? "#ff3a2a" : tgA === 2 ? "#ff8a2a" : "#ffd27a";
      const yy = e.y - 6 - Math.sin(act.t * 20) * 1.5;
      if (!(sprPs > 0 && txtSpr(c, gl, "900 " + (red ? 13 : 11) + "px 'Alegreya Sans',sans-serif", red ? 13 : 11, fc, "rgba(0,0,0,.8)", 2.5, cx, yy))) {
        c.save(); c.font = "900 " + (red ? 13 : 11) + "px 'Alegreya Sans',sans-serif"; c.textAlign = "center";
        c.fillStyle = fc; c.strokeStyle = "rgba(0,0,0,.8)"; c.lineWidth = 2.5;
        c.strokeText(gl, cx, yy); c.fillText(gl, cx, yy); c.restore();
      }
      /* Ziellinie für Schützen */
      if (act.a.aimLine && act.aim) { c.save(); c.globalAlpha = 0.15 + 0.35 * (act.t / act.a.pre); c.strokeStyle = "#ff4a3a"; c.lineWidth = 0.6; c.setLineDash([3, 3]); c.beginPath(); c.moveTo(cx, e.y + e.h * 0.35); c.lineTo(act.aim.x, act.aim.y); c.stroke(); c.restore(); }
    }
    /* Zug-Seil (Ettercap, Folterknecht) */
    if (act && act.tether && Z.player) { const P = Z.player; c.strokeStyle = act.a.web ? "rgba(240,236,244,.8)" : act.a.tongue ? "#d86a7a" : act.a.tentacle ? d.c : "#7a6a5a"; c.lineWidth = act.a.tongue || act.a.tentacle ? 1.8 : 1; c.beginPath(); c.moveTo(cx, e.y + e.h * 0.4); c.lineTo(P.x + P.w / 2, P.y + 12); c.stroke(); }
    /* Lebensbalken */
    if (!d.boss && !dead && (e.hp < e.hpMax || e.elite) && !e.disguise) {
      const w = Math.max(16, e.w + 4), x = cx - w / 2, y = e.y - (e.elite ? 10 : 5);
      c.fillStyle = "rgba(0,0,0,.6)"; c.fillRect(x - 0.5, y - 0.5, w + 1, 3);
      c.fillStyle = e.elite ? "#ff8a3a" : "#e0545a"; c.fillRect(x, y, w * Math.max(0, e.hp / e.hpMax), 2);
      if (e.elite) {
        const lab = Z.L(Z.ELITE[e.elite] || ["Elite", "Elite"]) + " · " + Z.L(d.n); /* W35 Optik: Koop-Eliten (koop.js e.elite = true) zeigten „undefined · …“ */
        if (!(sprPs > 0 && txtSpr(c, lab, "700 6px 'Alegreya Sans',sans-serif", 6, "#ffb070", null, 0, cx, y - 2))) { c.font = "700 6px 'Alegreya Sans',sans-serif"; c.textAlign = "center"; c.fillStyle = "#ffb070"; c.fillText(lab, cx, y - 2); }
      }
    }
    /* Statussymbole */
    const icons = [];
    /* Betäubung zeigen die kreisenden Sterne */ if (e.st.root > 0) icons.push(["⌇", "#9ad04a"]); if (e.st.weak > 0) icons.push(["♪", "#ffc24a"]); if (e.st.mark > 0) icons.push(["◎", "#c88a4a"]); if (e.st.fear > 0) icons.push(["?", "#ffc24a"]);
    if (icons.length && !dead) { c.font = "700 7px sans-serif"; c.textAlign = "center"; icons.forEach((ic, i) => { const ix = cx - (icons.length - 1) * 4 + i * 8 + (ic[0] === "✦" ? Math.sin(time * 8) * 2 : 0); if (!(sprPs > 0 && txtSpr(c, ic[0], "700 7px sans-serif", 7, ic[1], null, 0, ix, e.y - 12))) { c.font = "700 7px sans-serif"; c.textAlign = "center"; c.fillStyle = ic[1]; c.fillText(ic[0], ix, e.y - 12); } }); }
  };
  /* alter Schwungwert (−1 Ausholen … +1 Schlag), stetig statt sprunghaft */
  function legacyAk() { return Q.ph === "pre" ? -eo(Q.pre) : Q.ph === "act" ? lp(-1, 1, eo(Q.act)) : Q.ph === "post" ? 1 - Q.post : 0; }
  /* Knochenhaufen: zerfallenes Skelett (k: 1 = liegt; rise: 0..1 setzt sich wieder zusammen) */
  function bonePile(c, k, kk, time, rise) {
    const col = k("#e2dccb"), dk = k("#a8a090");
    const r = rise || 0;
    limb(c, -7, -1, -2, -1.6 - r * 3, 1.5, col); limb(c, 1, -1, 6, -0.6, 1.5, col); limb(c, -4, -0.6, 3, -2.4 - r * 4, 1.3, dk);
    for (let i = 0; i < 3; i++) limb(c, -2 + i * 1.8, -2.4 - r * 6, -1 + i * 1.8, -0.4 - r * 6, 1, dk);
    circ(c, 3.4, -3 - r * 12 + Math.sin(time * 9) * r, 2.9, col); c.fillStyle = k("#1a1010"); c.fillRect(4, -3.8 - r * 12, 1.2, 1.2); c.fillRect(2.4, -3.8 - r * 12, 1, 1);
    if (r > 0) glow(c, 4.4, -3.4 - r * 12, 3, "rgba(160,255,140,.6)");
  }

  /* Gestalten (lokal, Füße bei 0, Blick +x). Signatur: (c, e, d, k, t, moving, phase, ak, time) */
  const SHAPES = {
    /* ---------- Goblins: Dolch, Bogen, Keule, Bomben ---------- */
    goblin(c, e, d, k, t, mv, ph, ak) {
      const brute = !!d.club, bow = !!d.bow, bomb = !!d.bomb;
      const bob = mv ? Math.abs(Math.sin(ph)) * 1.1 : Math.sin(t * 3) * 0.35;
      const cr = Q.ph === "pre" ? eo(Q.pre) * 1.4 : 0;
      const hy = -6.2 + cr;
      const skin = d.c, skin2 = "#3e5a22";
      /* Köcher / Bombensack auf dem Rücken */
      if (bow) { c.save(); c.translate(-3.5, -10 - bob); c.rotate(-0.4); poly(c, [-1.6, -4, 1.6, -4, 1.4, 4, -1.4, 4], k("#5a3a22")); for (let i = 0; i < 3; i++) limb(c, -1 + i, -4, -1.4 + i * 1.2, -6.5, 0.6, k("#c8a070")); poly(c, [-1.4, -6.5, 0, -7.6, 1.4, -6.5], k("#c03a2a")); c.restore(); }
      if (bomb) { ell(c, -4.2, -8.5 - bob, 3, 3.4, k("#6a4a2a")); circ(c, -4.6, -11.4 - bob, 1.6, k("#2a2a2a")); circ(c, -3, -11.8 - bob, 1.3, k("#3a3a3a")); }
      legs(c, k, { hy, len: 6.6, mv, ph, stride: 2.6, lift: 1.8, w: 2.3, colB: skin2, colF: skin, footB: skin2, footF: skin, toe: 2.6, spread: 1.8 });
      /* Rumpf: zerlumpter Kittel */
      const ty = -9.4 - bob + cr * 0.7;
      ell(c, -0.3, ty, 4.5, 4.2, k(d.t));
      poly(c, [-4.4, ty + 1.5, -3, ty + 4.6, -1.6, ty + 3.4, 0, ty + 4.8, 1.6, ty + 3.4, 3, ty + 4.6, 4.2, ty + 1.5], k(d.t));
      limb(c, -4, ty + 1.6, 4, ty + 1.2, 1.1, k("#2a1a10")); circ(c, 2.4, ty + 1.3, 0.8, k("#c8a050"));
      if (brute) { /* Knochen-Schulterpanzer */ ell(c, 0.4, ty - 3, 3.6, 2, k("#d8ccb0")); limb(c, -2.6, ty - 3.4, 3.4, ty - 3.8, 0.6, k("#a89a80")); poly(c, [-1, ty - 4.4, -0.2, ty - 7, 1, ty - 4.6], k("#e8e0d0")); }
      /* Kopf: groß, mit langen zuckenden Ohren */
      const hx = 1.4, hY = -14.6 - bob + cr * 0.8 + (Q.hurt ? -1 : 0);
      const flick = Math.pow(Math.max(0, Math.sin(t * 1.7 + e.patrol)), 12) * 0.5 + (Q.ph === "pre" ? -0.25 : 0) + Q.hurt * 0.4;
      c.save(); c.translate(hx, hY); c.rotate(Q.hurt * -0.3 + (Q.ph === "act" ? 0.1 : 0));
      c.save(); c.rotate(-flick); poly(c, [-2.6, -1.2, -9.4, -3.8, -3, 0.8], k(skin)); poly(c, [-3, -0.6, -7.6, -2.8, -3.2, 0.2], k("#c88a7a")); c.restore();
      ell(c, 0, 0, 4.3, 3.7, k(skin));
      ell(c, -1.2, 0.6, 3, 2.6, k(skin2));
      c.save(); c.rotate(flick * 0.6); poly(c, [2, -2.6, 6.6, -6.6, 3.4, -1.2], k(skin)); c.restore();
      /* Nase, Auge, Maul */
      poly(c, [3.4, -0.6, 6.6, 0.4, 3.6, 1], k("#5a8a30"));
      ell(c, 2.4, -1.3, 1.25, 1, k(bomb ? "#3a2a1a" : "#ffe04a")); c.fillStyle = k("#1a1008"); c.fillRect(2.8, -1.7, 0.7, 0.9);
      if (bomb) { limb(c, -3.6, -1.6, 3.6, -1.6, 0.9, k("#5a3a22")); circ(c, 2.4, -1.4, 1.2, k("#d8a040")); circ(c, 2.4, -1.4, 0.7, k("#ffe8a0")); }
      limb(c, 1, -2.6, 3.4, -2, 0.6, k("#2a3a14"));
      const mo = Q.ph === "act" || Q.ph === "pre" ? 1.4 * charge() : Q.hurt * 1.2;
      poly(c, [1.4, 1.6, 4.4, 1.4, 4, 1.8 + mo, 1.8, 2 + mo * 0.6], k("#2a1010")); poly(c, [2, 1.5, 2.5, 2.4, 3, 1.5], k("#f0e8d0")); poly(c, [3.3, 1.4, 3.8, 2.3, 4.2, 1.4], k("#f0e8d0"));
      c.restore();
      /* Arme und Waffen */
      const sx = 1, sy = -11.6 - bob + cr * 0.7;
      if (bow) {
        const dr = Q.ph === "pre" ? eo(Q.pre) : Q.ph === "act" ? 1 - eo(Q.act) : 0;
        const aimA = -0.1;
        const fh = hand(sx, sy, aimA, 7.6);
        arm(c, k, sx - 2, sy + 0.5, fh[0] - 6 - dr * 4 + 3, fh[1] - 0.4, 3.6, 3.6, 1.6, skin2);
        const [hx2, hy2] = arm(c, k, sx, sy, fh[0], fh[1], 3.8, 3.8, 1.8, skin);
        c.save(); c.translate(hx2, hy2); c.rotate(aimA); weapon(c, "bow", "#c9b38a", t, dr); c.restore();
        return;
      }
      if (brute) {
        const a = swing(-0.9, -2.5, 0.85) + shake(0.08);
        const r = Q.ph === "act" ? 7.5 : 6.4;
        const h = hand(sx, sy, a, r);
        arm(c, k, sx - 1.6, sy + 0.4, h[0] - Math.cos(a) * 2.4, h[1] - Math.sin(a) * 2.4, 3.8, 3.8, 2, skin2);
        const [hx2, hy2] = arm(c, k, sx, sy, h[0], h[1], 3.8, 3.8, 2.2, skin);
        c.save(); c.translate(hx2, hy2); c.rotate(a + 0.15); c.scale(0.62, 0.62); weapon(c, "club", "#7a6050", t); c.restore();
        circ(c, hx2, hy2, 1.2, k(skin));
        return;
      }
      if (bomb) {
        const a = swing(-0.6, -2.6, -0.2);
        const h = hand(sx, sy, a, 6.4);
        arm(c, k, sx - 1.6, sy + 0.4, sx + 1, sy + 6, 3.6, 3.6, 1.6, skin2);
        const [hx2, hy2] = arm(c, k, sx, sy, h[0], h[1], 3.6, 3.6, 1.8, skin);
        if (!(Q.ph === "act" && Q.act > 0.4) && Q.ph !== "post") {
          circ(c, hx2 + 0.6, hy2 - 1.8, 2.5, k("#2a2a2a")); circ(c, hx2 - 0.1, hy2 - 2.6, 0.8, k("#5a5a5a")); limb(c, hx2 + 1.2, hy2 - 4, hx2 + 2, hy2 - 5.6, 0.6, k("#c8b090"));
          const sp = 0.6 + 0.4 * Math.sin(Q.time * 40); circ(c, hx2 + 2, hy2 - 5.8, 0.7 * sp + 0.3, "#ffd27a"); glow(c, hx2 + 2, hy2 - 5.8, 3.5, "rgba(255,190,80,.7)");
        }
        return;
      }
      /* Dolch: Stich (lunge) oder Wurf (shoot) */
      let a, r = 6;
      if (Q.kind === "lunge") { a = swing(0.9, 0.5, 0.05); r = Q.ph === "pre" ? lp(6, 3, eo(Q.pre)) : Q.ph === "act" ? lp(3, 7.6, eo(Q.act)) : Q.ph === "post" ? lp(7.6, 6, Q.post) : 6; }
      else if (Q.kind === "shoot") a = swing(0.9, -2.5, 0.1);
      else a = swing(0.9, -2.3, 0.6);
      const h = hand(sx, sy, a, r);
      arm(c, k, sx - 1.6, sy + 0.4, sx - 2.5 + (Q.ph ? -1 : 0), sy + 5.6, 3.6, 3.6, 1.6, skin2);
      const [hx2, hy2] = arm(c, k, sx, sy, h[0], h[1], 3.6, 3.6, 1.8, skin);
      if (!(Q.kind === "shoot" && (Q.ph === "act" || Q.ph === "post"))) { c.save(); c.translate(hx2, hy2); c.rotate(Q.kind === "lunge" ? a * 0.4 : a - 0.6); c.scale(0.8, 0.8); weapon(c, "dagger", "#c9b38a", t); c.restore(); }
      circ(c, hx2, hy2, 1, k(skin));
    },
    /* ---------- Menschen: Rote Roben, Wachen, Söldner, Drow, Feuerschlucker … ---------- */
    human(c, e, d, k, t, mv, ph, ak) {
      const drunk = d.bottle ? Math.sin(t * 2.1) * 0.12 + Math.sin(t * 0.7) * 0.06 : 0;
      c.rotate(drunk);
      const bob = mv ? Math.abs(Math.sin(ph)) * 1.2 : Math.sin(t * 2) * 0.3;
      const robe = !!(d.hood || d.c === "#9a2424" || d.hat);
      const cr = Q.ph === "pre" ? eo(Q.pre) * (d.mace || d.chain ? 1.6 : 1) : 0;
      const hy = -9.6 + cr;
      const skin = d.skin || "#d9b08c";
      const metal = !!(d.helm || d.shield);
      const legCol = metal ? "#4a4a4e" : d.skin === "#4a3e5e" ? "#1a1420" : "#2a2020";
      /* Kapuzen-/Umhangzipfel hinten */
      if (robe) { const fl = Math.sin(t * 3) * 0.8 + (mv ? -1.8 : 0); poly(c, [-3.2, -18.5 - bob, -6.4 + fl, -7 - bob * 0.5, -3.6, -9 - bob * 0.3], k(shade(d.c))); }
      if (d.hair && d.skin === "#4a3e5e") { const fl = (mv ? -2 : 0) + Math.sin(t * 2.6) * 0.6; poly(c, [-2.6, -24 - bob, -6.4 + fl, -16 - bob, -4.8 + fl, -13.5 - bob, -2.6, -18 - bob], k(d.hair)); }
      if (d.netBag) { const nb = -15 - bob; ell(c, -4.6, nb, 3.4, 4.2, k("#8a7a5a")); for (let i = -1; i <= 1; i++) { limb(c, -7.6, nb + i * 2, -1.8, nb + i * 2 + 0.4, 0.4, k("#5a4a32")); limb(c, -4.6 + i * 2, nb - 4, -4.4 + i * 2, nb + 4, 0.4, k("#5a4a32")); } }
      legs(c, k, { hy, len: 9.4, mv, ph, stride: 3.2, lift: 2, w: 2.7, colB: shade(legCol), colF: legCol, footB: "#1a1210", footF: "#2a1e18", toe: 2.6, knee: metal ? "#6a6a72" : null });
      /* Rumpf */
      const sy0 = -18.4 - bob + cr * 0.9;
      if (robe) {
        /* Robe mit schwingendem Saum */
        const sw = (mv ? Math.sin(ph) * 0.8 : Math.sin(t * 1.6) * 0.3) - (mv ? 0.8 : 0);
        poly(c, [-3.8, sy0, 3.8, sy0, 4.6, hy + 1, 5.4 + sw, -3, 2.2 + sw, -2.2, 0 + sw, -3.4, -2.4 + sw, -2.2, -5.2 + sw, -3, -4.6, hy + 1], k(d.c));
        poly(c, [-3.8, sy0, -1, sy0, -1.6 + sw, -2.6, -5.2 + sw, -3, -4.6, hy + 1], k(shade(d.c)));
        limb(c, 1.4, sy0 + 1, 1.8 + sw * 0.6, -3, 0.6, k(d.t));
      } else {
        poly(c, [-4, sy0, 4, sy0, 4.4, hy + 0.6, -4.4, hy + 0.6], k(d.c));
        poly(c, [-4, sy0, -1.2, sy0, -1.6, hy + 0.6, -4.4, hy + 0.6], k(shade(d.c)));
        poly(c, [-4.4, hy + 0.2, 4.4, hy + 0.2, 4, hy + 3, -4, hy + 3], k(shade(d.c)));
      }
      limb(c, -4, hy - 0.6, 4.2, hy - 0.9, 1.3, k(d.t)); circ(c, 2.8, hy - 0.8, 0.8, k("#c8a050"));
      if (metal) { /* Kettenhemd-Andeutung und Schulterplatte */ for (let i = 0; i < 3; i++) limb(c, -3, sy0 + 2 + i * 2, 3.6, sy0 + 2 + i * 2, 0.4, k("#8a8a92")); ell(c, -0.6, sy0 + 0.8, 3.2, 1.6, k("#7a7a84")); limb(c, -3.2, sy0 + 0.2, 2, sy0 - 0.2, 0.5, k("#aaaab4")); }
      if (d.mace) { /* Schläger: Lederschürze, breite Schultern */ poly(c, [-2, hy - 0.4, 3.6, hy - 0.4, 3.2, hy + 4, -1.6, hy + 4], k("#4a3a2a")); }
      if (humanWeapon(d) === "chain") { /* Folterknecht: Schürze mit Flecken, Kettenschlinge */ poly(c, [-1.6, sy0 + 3, 4, sy0 + 3, 3.6, hy + 4, -1.2, hy + 4], k("#5a4a3a")); circ(c, 1.6, hy + 1, 0.9, k("#6a1a1a")); circ(c, 2.6, sy0 + 6, 0.7, k("#6a1a1a")); }
      /* Kopf */
      const hY = sy0 - 3.4 + (Q.hurt ? -0.6 : 0);
      c.save(); c.translate(0.6, hY); c.rotate(-Q.hurt * 0.35 + (Q.ph === "pre" ? -0.08 : 0) + (d.bottle ? -drunk : 0));
      ell(c, 0, 0, 3.1, 3.3, k(skin));
      poly(c, [2.6, -0.4, 4, 0.6, 2.8, 1.1], k(skin)); /* Nase */
      ell(c, -0.8, 0.4, 1.4, 2.4, k(shade(skin)));
      const angry = Q.ph ? 1 : 0;
      if (d.hood) {
        /* Gesicht im Kapuzenschatten, nur die Augen glimmen */
        poly(c, [-3.6, 2.6, -4, -1.6, -1.2, -4.2, 2.8, -3.9, 4.2, -1.2, 3.8, 0.6, 1.2, -1.4, -0.4, 2.8], k(d.c));
        poly(c, [-3.6, 2.6, -4, -1.6, -1.2, -4.2, -1.4, 2.6], k(shade(d.c)));
        poly(c, [1.2, -1.6, 3.9, -1.2, 3.6, 1.4, 1.8, 2.2], k("rgba(20,8,8,.75)"));
        c.fillStyle = k(d.bald ? "#ff8a3a" : "#ffb060"); c.fillRect(2.3, -0.6, 1.1, 0.7); if (!flashOf(k)) glow(c, 2.8, -0.3, 2.2, "rgba(255,150,60,.6)");
      } else {
        c.fillStyle = k(d.skin === "#4a3e5e" ? "#ff4a4a" : "#1a1010"); c.fillRect(1.9, -0.9, 1.1, 1);
        limb(c, 1.4, -1.7 - angry * 0.2, 3.2, -1.3 + angry * 0.5, 0.5, k("#2a1a14"));
        limb(c, 2.2, 2, 3.4, 1.8 + (Q.ph === "act" ? 0.6 : 0), 0.5, k("#5a2a20"));
        if (d.skin === "#4a3e5e") { if (!flashOf(k)) glow(c, 2.4, -0.4, 2.4, "rgba(255,60,60,.6)"); poly(c, [-1.2, -1.6, -2.8, -5, -0.4, -1.4], k(skin)); }
      }
      if (d.helm) { poly(c, [-3.6, 0, -3.4, -3.4, -1, -4.6, 2.6, -4.4, 3.8, -2.4, 3.9, -0.4], k("#6a6a72")); limb(c, -4.6, -0.2, 4.6, -0.4, 1, k("#8a8a94")); limb(c, 3, -0.6, 3.2, 1.6, 0.8, k("#7a7a84")); limb(c, -2, -4.2, 2.4, -4.2, 0.5, k("#aaaab4")); }
      if (d.tricorn) { poly(c, [-5.6, -2, 5.8, -2.2, 3.6, -4.6, 0.4, -6, -3.2, -4.8], k("#1e1a18")); poly(c, [-5.6, -2, -6.8, -3.8, -4, -3.4], k("#1e1a18")); limb(c, -5.6, -2.1, 5.8, -2.3, 0.9, k("#4a3626")); circ(c, 4.4, -3, 0.6, k("#c8a040")); limb(c, 1.4, -1.4, 3.8, 0.4, 0.5, k("#1a1410")); }
      if (d.hat) { const fl = Math.sin(t * 2) * 0.6 + (mv ? -1 : 0); poly(c, [-4.6, -2.2, 5, -2.4, 1, -4.4, -2 + fl, -9.6, -5 + fl, -8.6, -1.6, -4.2], k(d.c)); limb(c, -4.6, -2.3, 5, -2.5, 1.2, k(d.t)); circ(c, -5 + fl, -8.6, 0.9, k(d.t)); }
      if (d.hair && d.skin !== "#4a3e5e") poly(c, [-3.4, 1, -3.4, -3, 0, -4.2, 3, -3.4, 1, -2.4, -1.4, 2.6], k(d.hair));
      if (d.hair && d.skin === "#4a3e5e") poly(c, [-3.4, 1.4, -3.4, -2.8, -0.6, -4, 3.2, -3.4, 3.6, -1.8, 0.6, -2.6, -1.6, 3], k(d.hair));
      if (d.crown) poly(c, [-3, -3, -2.4, -6, -1, -4.2, 0.4, -6.6, 1.8, -4.2, 3, -6, 3.2, -3], k("#e5b454"));
      if (d.bald) { limb(c, -1.6, -2.6, 0.4, -1, 0.6, k("#ff8a3a")); limb(c, 0.4, -1, -0.8, 0.6, 0.6, k("#ff8a3a")); }
      c.restore();
      /* ---- Arme und Waffe ---- */
      const sx = 1, sy = sy0 + 1;
      const armCol = d.c, armCol2 = robe ? d.c : skin;
      let back = [sx - 2.6, sy + 7];
      const W = humanWeapon(d);
      let a, r = 6.4, wRot = 0, wIcon = null, wCol = d.t, wExt = 0, two = false;
      if (W === "bow" || W === "xbow") {
        a = -0.1; r = 6.6; wIcon = W; wRot = -0.1; wCol = d.t;
        if (W === "bow") { wExt = Q.ph === "pre" ? eo(Q.pre) : 0; const fh = hand(sx, sy, a, r); back = [fh[0] - 6 - wExt * 4 + 3, fh[1] - 0.4]; }
        else { const rc = Q.ph === "act" ? Math.sin(Q.act * PI) : 0; a = -0.1 - rc * 0.4; r = 6.2 - rc; back = [sx + 2, sy + 2]; wRot = a; }
        if (!Q.ph && !e.aware) { a = 1.2; wRot = W === "bow" ? 0.2 : 1.2; back = [sx - 2.6, sy + 7]; }
      } else if (W === "staff") {
        const casting = Q.kind === "mark" || Q.kind === "shield" || Q.kind === "heal" || Q.kind === "teleport" || Q.mv;
        a = casting ? swing(0.6, -1.5, -0.6) : swing(0.6, -1.0, -0.2); r = 5.4; wIcon = "staff"; wCol = d.glowStaff || "#e8e070";
        wRot = casting ? swing(-1.4, -1.6, -1.1) : swing(-1.4, -1.3, -0.3);
        back = casting && Q.ph ? [sx + 3 + charge() * 2, sy - 4 * charge()] : [sx - 2.2, sy + 6.6];
      } else if (W === "spear") {
        if (Q.kind === "lunge") { a = 0; r = Q.ph === "pre" ? lp(5, 1.6, eo(Q.pre)) : Q.ph === "act" ? lp(1.6, 8, eo(Q.act)) : Q.ph === "post" ? lp(8, 5, Q.post) : 5; wRot = 0; back = [sx - 4 + r * 0.4, sy + 1.6]; }
        else { a = swing(0.5, -2.2, 0.6); wRot = swing(-1.3, -0.6, 0.6); back = [sx + 0.6, sy + 3]; }
        wIcon = "spear"; wCol = "#d8706a";
      } else if (W === "chain") {
        a = swing(0.9, -1.9, 0.0); wIcon = "chain";
      } else if (W === "bottle") {
        const sip = !Q.ph ? Math.pow(Math.max(0, Math.sin(t * 0.8)), 8) : 0;
        a = Q.ph ? swing(0.8, -2.5, -0.2) : lp(0.8, -1.4, sip); r = lp(6.4, 4.6, sip); wIcon = "bottle"; wRot = Q.ph ? a : lp(-0.6, -2.6, sip);
      } else if (W === "torch") {
        a = Q.kind === "spray" ? swing(0.8, 0.4, -0.3) : swing(0.8, -2.2, 0.4); wIcon = "torch"; wRot = Q.kind === "spray" ? -1.2 : a - 2;
      } else {
        /* Nahkampf: Schwert, Krummsäbel, Streitkolben */
        const heavy = W === "mace";
        if (Q.kind === "lunge") { a = swing(0.9, 0.3, 0.05); r = Q.ph === "pre" ? lp(6.4, 3.4, eo(Q.pre)) : Q.ph === "act" ? lp(3.4, 8.2, eo(Q.act)) : Q.ph === "post" ? lp(8.2, 6.4, Q.post) : 6.4; wRot = a * 0.3; }
        else if (Q.kind === "grab") { a = swing(0.8, 0.4, -0.15); r = Q.ph === "act" ? 8.4 : 6.4; wRot = a - 0.5; back = Q.ph ? [sx + 5 + charge() * 2, sy + 1] : back; }
        else if (Q.kind === "combo" && Q.alt) { a = swing(0.9, 1.2, -1.6); wRot = a - 0.4; }
        else { a = swing(0.9, heavy ? -2.6 : -2.3, 0.65) + shake(0.1); wRot = a - (heavy ? 0.4 : 0.6); }
        if (Q.kind !== "lunge" && Q.kind !== "grab") r = Q.ph === "act" ? 7.4 : 6.4;
        wIcon = W; wCol = W === "scim" ? "#b080ff" : W === "mace" ? "#a08060" : "#c8c0b8";
        if (heavy) { two = true; }
        if (d.shield) back = [sx + 4, sy + 3]; /* Schildhand vorn */
      }
      const h = hand(sx, sy, a, r);
      if (two) back = [h[0] - Math.cos(wRot) * 2.6, h[1] - Math.sin(wRot) * 2.6];
      /* hinterer Arm */
      const bh = arm(c, k, sx - 2.2, sy + 0.2, back[0], back[1], 4, 3.8, 2.1, shade(armCol), shade(armCol2));
      circ(c, bh[0], bh[1], 1, k(shade(skin)));
      /* vorderer Arm + Waffe */
      const fh = arm(c, k, sx, sy, h[0], h[1], 4, 3.8, 2.3, armCol, armCol2);
      if (wIcon) {
        c.save(); c.translate(fh[0], fh[1]); c.rotate(wRot);
        if (wIcon === "chain") {
          if (Q.ph === "pre") { const sp = Q.time * 18; limb(c, 0, 0, Math.cos(sp) * 5, Math.sin(sp) * 2.5 - 2, 0.8, k("#8a7a6a")); circ(c, Math.cos(sp) * 5, Math.sin(sp) * 2.5 - 2, 1.8, k("#5a5a5a")); }
          else if (Q.ph === "act" || (Q.ph === "post" && Q.post < 0.3)) { line(c, [0, 0, 8, -1, 16, 0], 0.8, k("#8a7a6a")); poly(c, [16, -2, 19, 0, 16, 2, 17, 0], k("#8a8a90")); }
          else { const sw = Math.sin(t * 2.4) * 2; line(c, [0, 0, 1 + sw * 0.3, 4, sw, 7.5], 0.8, k("#8a7a6a")); poly(c, [sw - 1.4, 7.5, sw + 1.4, 7.5, sw, 10.6], k("#8a8a90")); }
        } else if (wIcon === "bottle") { poly(c, [0, -1.4, 5, -1.4, 6.4, -0.7, 8.4, -0.7, 8.4, 0.7, 6.4, 0.7, 5, 1.4, 0, 1.4], k("#4a7a3a")); limb(c, 1, -0.6, 4.4, -0.6, 0.5, k("#a8d890")); }
        else if (wIcon === "torch") { limb(c, -2, 0, 7, 0, 1.6, k("#5a3a22")); const fl = 1 + Math.sin(Q.time * 23) * 0.2; poly(c, [6.4, -1.8, 9.6 + fl, -0.6, 11 + fl * 2, 0, 9.6 + fl, 0.6, 6.4, 1.8], "#ff8a2a"); circ(c, 8, 0, 1.2, "#ffe08a"); glow(c, 8.4, 0, 7, "rgba(255,140,50,.6)"); }
        else if (wIcon === "sword") { limb(c, -2, 0, 2, 0, 1.6, k("#3a2a1a")); limb(c, 2, -2, 2, 2, 1, k("#8a7a62")); poly(c, [2.4, -1.2, 13, -0.6, 15, 0, 13, 0.6, 2.4, 1.2], k("#c8c0b8")); limb(c, 3, 0, 12.4, 0, 0.4, k("#e8e4e0")); }
        else if (wIcon === "mace") weapon(c, "hammer", "#a08060", t);
        else if (wIcon === "scim") { c.scale(0.8, 0.8); weapon(c, "scimitar", "#b080ff", t); }
        else weapon(c, wIcon, wCol, t, wExt);
        c.restore();
      }
      circ(c, fh[0], fh[1], 1.1, k(skin));
      /* Schild (vorn) */
      if (d.shield) {
        const up = e.st.stun > 0 || e.broken > 0 ? 6 : 0, br = e.broken > 0;
        const sxx = 4.2 + (Q.kind === "lunge" ? charge() * 1.5 : 0);
        poly(c, [sxx, -20.5 + up - bob, sxx + 4, -19.5 + up - bob, sxx + 4.2, -8 + up - bob, sxx + 2, -5.4 + up - bob, sxx - 0.2, -6.4 + up - bob], k(br ? "#5a4a3a" : "#6a5a44"));
        poly(c, [sxx + 0.8, -19.4 + up - bob, sxx + 3.4, -18.8 + up - bob, sxx + 3.4, -8.4 + up - bob, sxx + 1.8, -6.6 + up - bob, sxx + 0.8, -7.4 + up - bob], k(br ? "#6a5a48" : "#8a7652"));
        limb(c, sxx + 2, -19 + up - bob, sxx + 2, -7 + up - bob, 0.9, k("#c8a060")); circ(c, sxx + 2, -13 + up - bob, 1, k("#d8b070"));
        if (br) limb(c, sxx + 0.6, -15 + up, sxx + 3.6, -11 + up, 0.6, k("#2a2018"));
      }
    },
    rat(c, e, d, k, t, mv, ph, ak) {
      const b = mv ? Math.sin(ph * 1.5) : 0;
      const cr = Q.ph === "pre" ? eo(Q.pre) : 0, lunge = Q.ph === "act" ? 1 - Q.act : 0;
      c.translate(0, cr * 0.8);
      /* Schwanz */
      c.strokeStyle = k(d.t); c.lineWidth = 0.9; c.lineCap = "round"; c.beginPath(); c.moveTo(-5.6, -3.6); c.quadraticCurveTo(-10, -7 + b * 2 + Math.sin(t * 4) * 1, -14, -2.6 + Math.sin(t * 3) * 0.8); c.stroke();
      c.lineWidth = 0.5; c.beginPath(); c.moveTo(-12, -3.6); c.lineTo(-15.5, -1.6 + Math.sin(t * 3) * 0.8); c.stroke();
      /* Beine */
      for (const [x, p] of [[-3.6, -b], [3, b]]) { limb(c, x, -2.4, x + p * 1.8 - 0.6, 0, 1.3, k(shade(d.c))); }
      ell(c, -0.6, -4 + b * 0.3 - lunge, 6, 3.5 + cr * 0.4, k(d.c));
      ell(c, -1.6, -5.4 + b * 0.3 - lunge, 4, 1.6, k(shade(d.c, 0.82)));
      for (let i = 0; i < 3; i++) limb(c, -4 + i * 2, -6.8 - lunge, -5 + i * 2, -7.8 - lunge, 0.5, k(shade(d.c)));
      for (const [x, p] of [[-2.4, b], [3.8, -b]]) { limb(c, x, -2, x + p * 1.8 + 0.4, 0, 1.3, k(d.c)); limb(c, x + p * 1.8 + 0.4, 0, x + p * 1.8 + 1.4, 0, 0.6, k(d.t)); }
      /* Kopf */
      c.save(); c.translate(4.8 + lunge * 1.6, -4.4 - lunge * 1.2); c.rotate(Q.ph === "pre" ? -0.15 : Q.hurt * -0.4);
      poly(c, [-2, -2.2, 2.6, -1.2, 5, 0.4, 4.6, 1, 0, 2, -2, 1.4], k(d.c));
      circ(c, 4.9, 0.5, 0.7, k(d.t));
      circ(c, 1.6, -0.6, 0.65, k("#ff3a3a")); if (!flashOf(k)) glow(c, 1.6, -0.6, 2, "rgba(255,50,50,.5)");
      ell(c, -0.6, -2.4, 1.3, 1.6, k(d.t)); ell(c, -0.5, -2.3, 0.7, 1, k(shade(d.t)));
      if (Q.ph) { poly(c, [3.2, 1.2, 3.6, 2.4, 4, 1.2], k("#f0e8c8")); }
      c.strokeStyle = k("rgba(230,220,210,.6)"); c.lineWidth = 0.3; c.beginPath(); c.moveTo(4, 0.4); c.lineTo(7, -0.6); c.moveTo(4, 0.6); c.lineTo(7, 1.2); c.stroke();
      c.restore();
    },
    wolf(c, e, d, k, t, mv, ph, ak) {
      const run = mv ? ph : 0, b = mv ? Math.sin(ph) : 0;
      const leap = !e.onGround ? (e.vy < 0 ? -0.25 : 0.15) : 0;
      const cr = Q.ph === "pre" ? eo(Q.pre) : 0, st = Q.ph === "act" ? 1 : 0;
      const magma = !!d.glow;
      c.rotate(leap - cr * 0.12);
      const bodyY = -8 + cr * 2 + (mv ? Math.abs(Math.cos(ph)) * -0.8 : Math.sin(t * 2.4) * 0.2);
      if (magma) glow(c, 0, bodyY, 13, "rgba(255,100,30,.4)");
      /* Schwanz */
      const tw = Math.sin(t * (Q.ph ? 2 : 5)) * 1.2 + (Q.ph === "pre" ? -2 : 0);
      poly(c, [-8, bodyY - 1.4, -13.5, bodyY - 4.2 + tw + b, -16, bodyY - 1.6 + tw, -12.4, bodyY + 0.6, -8, bodyY + 1.2], k(magma ? "#2a1a14" : d.t));
      if (magma) poly(c, [-13.6, bodyY - 3.6 + tw, -16, bodyY - 1.6 + tw, -14, bodyY - 1.2 + tw], "#ff8a2a");
      /* Beine: Gangart mit zwei Gelenken */
      const leg = (x, p, col, back) => {
        const a = run + p;
        let fx = x + (mv ? Math.sin(a) * 3.4 : 0), fy = mv ? -Math.max(0, Math.cos(a)) * 1.8 : 0;
        if (Q.ph === "pre") fx += back ? 1.4 : -1.2;
        if (!e.onGround) { fx = x + (back ? -3 : 3); fy = -2.5; }
        const [kx, ky, ax, ay] = ik(x, bodyY + 2, fx, fy - 0.4, 3.6, 4.4, back ? -1 : 1);
        limb(c, x, bodyY + 1, kx, ky, back ? 2.4 : 1.9, k(col)); limb(c, kx, ky, ax, ay, 1.3, k(col)); limb(c, ax, ay, ax + 1.2, ay + 0.3, 1, k(col));
      };
      const lc = magma ? "#2a1a14" : d.t;
      leg(-5.6, PI, shade(lc), true); leg(4.6, 0, shade(lc), false);
      /* Körper mit Fell */
      ell(c, -1, bodyY, 9, 4.2, k(d.c));
      ell(c, 0.6, bodyY + 1.4, 6.6, 2.4, k(shade(d.c, 1.15)));
      for (let i = 0; i < 5; i++) poly(c, [-7 + i * 3, bodyY - 3.6, -6 + i * 3, bodyY - 5.6 - (i === 3 ? 1 : 0), -4.8 + i * 3, bodyY - 3.8], k(magma ? "#2a1810" : shade(d.c)));
      if (magma) for (let i = 0; i < 3; i++) { const a = 0.5 + 0.5 * Math.sin(t * 4 + i * 2); limb(c, -6 + i * 4, bodyY - 1.5 + (i % 2), -4 + i * 4, bodyY + 1 - (i % 2), 0.7, flashOf(k) ? "#fff" : "rgba(255," + (110 + 80 * a | 0) + ",40,.9)"); }
      leg(-3.8, 0, lc, true); leg(6.2, PI, lc, false);
      /* Kopf: Schnauze, Ohren, Augen; Maul öffnet sich beim Angriff */
      const op = Q.ph === "pre" ? eo(Q.pre) * 0.4 : Q.ph === "act" ? 0.6 * (1 - Q.act * 0.5) : Q.kind === "spray" && Q.ph ? 0.6 : 0;
      c.save(); c.translate(7.2, bodyY - 2 + (mv ? b * 0.4 : 0)); c.rotate(-0.1 + cr * 0.25 - op * 0.3 - Q.hurt * 0.4);
      poly(c, [-3, -2.6, 1.4, -3.2, 3, -1.8, 7, -0.8, 7.2, 0.2, 3, 0.6, -1.6, 2.8], k(d.c));
      c.save(); c.translate(2.2, 0.6); c.rotate(op); poly(c, [0, 0, 4.6, -0.2, 4.4, 1, 0.4, 1.8], k(shade(d.c))); if (op > 0.1) for (let i = 0; i < 3; i++) poly(c, [1 + i * 1.2, -0.1, 1.5 + i * 1.2, -1, 2 + i * 1.2, -0.1], k("#f0e8d8")); c.restore();
      if (op > 0.1) { poly(c, [3, 0.6, 6.6, 0.1, 6.2, -0.4], k("#f0e8d8")); }
      circ(c, 7.1, -0.5, 0.7, k("#1a1414"));
      poly(c, [-1.6, -2.4, -0.6, -6.6, 1.2, -2.8], k(d.t)); poly(c, [-2.6, -2.2, -2.6, -5.6, -0.8, -2.6], k(shade(d.t)));
      c.fillStyle = k(magma ? "#ffd27a" : "#ffe04a"); c.fillRect(2.2, -2.1, 1.4, 0.9); if (!flashOf(k)) glow(c, 2.9, -1.7, magma ? 4 : 2.5, magma ? "rgba(255,200,80,.8)" : "rgba(255,230,80,.5)");
      limb(c, 1.6, -2.6, 3.8, -2.1, 0.5, k(shade(d.c)));
      c.restore();
      if (Q.kind === "spray" && Q.ph === "act") glow(c, 15, bodyY - 1, 7, "rgba(255,140,40,.7)");
      if (st && magma) glow(c, 0, bodyY, 10, "rgba(255,120,40,.5)");
    },
    wolfrider(c, e, d, k, t, mv, ph, ak) {
      SHAPES.wolf(c, e, { c: "#5a5048", t: "#34302c" }, k, t, mv, ph, 0);
      const b = mv ? Math.abs(Math.cos(ph)) * 0.8 : 0;
      /* Sattel */
      poly(c, [-4.4, -11.6 + b, 2.4, -11.6 + b, 3, -10 + b, -5, -10 + b], k("#6a3a1a")); limb(c, -1, -10 + b, -1.4, -5.6, 0.8, k("#3a2010"));
      c.save(); c.translate(-1.4, -10.4 + b);
      /* Reiter: kleiner Goblin, Lanze nach vorn gesenkt */
      const lean = Q.ph === "pre" ? -0.2 * eo(Q.pre) : Q.ph === "act" ? 0.35 : mv ? 0.15 : 0;
      c.rotate(lean);
      limb(c, 0, -1, 2.2, 2.4, 2, k(d.c)); limb(c, 2.2, 2.4, 1.2, 4.6, 1.8, k(d.c));
      ell(c, 0, -4.6, 3.4, 3.6, k("#5a3a22")); limb(c, -3, -3.2, 3, -3.6, 0.8, k("#2a1a10"));
      c.save(); c.translate(1, -10.2); ell(c, 0, 0, 3.4, 3, k(d.c)); poly(c, [-2, -1, -7.6, -3.4 - Math.sin(t * 6) * 0.6, -2.4, 0.6], k(d.c)); poly(c, [2.6, -0.6, 5.2, 0.4, 2.8, 1], k("#5a8a30"));
      c.fillStyle = k("#ffe04a"); c.fillRect(1.6, -1.4, 1.1, 0.9); poly(c, [-2.8, -1.6, -2, -4.4, 2.4, -3.6, 3, -1.8], k("#6a6a72"));
      if (Q.ph) poly(c, [1, 1.4, 3.4, 1.2, 3, 2.4], k("#2a1010"));
      c.restore();
      const la = Q.ph === "pre" ? lp(-0.6, -1.2, eo(Q.pre)) : Q.ph === "act" ? 0.1 : Q.ph === "post" ? lp(0.1, -0.6, Q.post) : -0.6 + Math.sin(t * 2) * 0.05;
      c.save(); c.translate(2.4, -5); c.rotate(la); limb(c, -8, 0, 16, 0, 1.3, k("#6a4a30")); poly(c, [16, -1.6, 21, 0, 16, 1.6], k("#c8c0b8")); poly(c, [4, -0.6, 7, -3.4, 7, -0.6], k("#9a2a1a")); c.restore();
      limb(c, 0.6, -6, 2.6, -4.6, 1.5, k(d.c));
      c.restore();
    },
    /* ---------- Schleime: Phiolenwesen (lebende Flasche), Glutlinge ---------- */
    blob(c, e, d, k, t, mv, ph, ak) {
      const cr = Q.ph === "pre" ? eo(Q.pre) : 0;
      const hop = mv ? Math.abs(Math.sin(ph * 0.8)) : 0;
      const sq = 1 + Math.sin(t * 6) * 0.06 - cr * 0.25 + hop * 0.15 + (Q.ph === "act" ? 0.2 : 0) + (!e.onGround ? 0.18 : 0);
      if (d.glow) {
        /* Glutling: Magmaklumpen mit Kruste, Glutrissen und Funken */
        glow(c, 0, -5, 15 + cr * 5, "rgba(255,110,30,.6)");
        const rx = 6.5 / Math.sqrt(sq), ry = 5 * sq;
        ell(c, 0, -ry, rx, ry, k(d.c));
        ell(c, -0.8, -ry * 1.2, rx * 0.65, ry * 0.5, k(d.t));
        for (let i = 0; i < 4; i++) { const a = i * 1.7 + 0.4; poly(c, [Math.cos(a) * rx * 0.9, -ry + Math.sin(a) * ry * 0.9, Math.cos(a + 0.35) * rx * 0.75, -ry + Math.sin(a + 0.35) * ry * 0.75, Math.cos(a + 0.7) * rx * 0.92, -ry + Math.sin(a + 0.7) * ry * 0.92], k("#3a1a10")); }
        const ey = -ry * 1.15;
        ell(c, 2.6, ey, 1.1, 1.3 * (Q.ph === "pre" ? 0.6 : 1), k("#2a0a04")); ell(c, -0.2, ey, 1, 1.2 * (Q.ph === "pre" ? 0.6 : 1), k("#2a0a04"));
        circ(c, 2.8, ey - 0.3, 0.4, k("#fff4c0")); circ(c, 0, ey - 0.3, 0.4, k("#fff4c0"));
        if (Q.ph || mv) poly(c, [0.4, ey + 2, 3, ey + 2, 1.8, ey + 3.2], k("#2a0a04"));
        if (Math.random() < 0.12) Z.fx.p({ x: e.x + e.w / 2 + (Math.random() - 0.5) * e.w, y: e.y + 2, vx: 0, vy: -30, life: 0.5, size: 1.4, col: "#ffb040", kind: "glow", add: true });
        return;
      }
      /* Phiolenwesen: Glaskolben mit schwappender Flüssigkeit, Korken, Stummelbeinchen */
      const slosh = Math.sin(t * 5) * 1.2 + (mv ? Math.sin(ph) * 1.5 : 0);
      const lean = mv ? 0.12 : 0;
      c.rotate(lean + Math.sin(t * 3) * 0.04 + shake(0.08));
      limb(c, -2, -1.6, -2.6 - hop, 0, 1.1, k("#3a6a5a")); limb(c, 2, -1.6, 2.6 + hop, 0, 1.1, k("#3a6a5a"));
      const by = -5.4 * sq - 0.6, r = 5.2 / Math.sqrt(sq);
      ell(c, 0, by, r + 0.5, 5 * sq, k("rgba(220,240,230,.55)"));
      c.save(); c.beginPath(); c.ellipse(0, by, r, 4.6 * sq, 0, 0, TAU); c.clip();
      c.fillStyle = k(d.c); c.beginPath(); c.moveTo(-r - 1, by - 0.6 + slosh * 0.5); c.quadraticCurveTo(0, by - 2 - slosh, r + 1, by - 0.6 - slosh * 0.5); c.lineTo(r + 1, by + 6 * sq); c.lineTo(-r - 1, by + 6 * sq); c.fill();
      for (let i = 0; i < 3; i++) { const yy = by + 3 - ((t * 2 + i * 0.37) % 1) * 5; circ(c, -1.6 + i * 1.6, yy, 0.5, k("rgba(255,255,255,.6)")); }
      c.restore();
      poly(c, [-1.6, by - 4.4 * sq, 1.6, by - 4.4 * sq, 1.4, by - 7 * sq, -1.4, by - 7 * sq], k("rgba(220,240,230,.7)"));
      poly(c, [-1.8, by - 6.6 * sq, 1.8, by - 6.6 * sq, 1.4, by - 8.8 * sq, -1.4, by - 8.8 * sq], k("#8a6a40"));
      ell(c, -2, by - 1.6, 0.8, 2, k("rgba(255,255,255,.55)"), 0.3);
      /* Gesicht im Glas */
      const blink = Math.sin(t * 1.3 + e.patrol) > 0.97 ? 0.2 : 1;
      ell(c, 2.4, by + 0.6, 0.8, 1 * blink, k("#10201a")); ell(c, -0.2, by + 0.6, 0.8, 1 * blink, k("#10201a"));
      if (Q.ph === "pre") { limb(c, 0.6, by + 2.8, 2.6, by + 2.6, 0.6, k("#10201a")); glow(c, 0, by, 8 + cr * 6, "rgba(160,240,190," + (0.3 + cr * 0.4).toFixed(2) + ")"); }
      else limb(c, 0.8, by + 2.4, 2.2, by + 2.8, 0.5, k("#10201a"));
    },
    /* ---------- Skelette ---------- */
    skel(c, e, d, k, t, mv, ph, ak) {
      const bone = d.c, bone2 = d.t === "#6b5040" ? "#b8b0a0" : d.t;
      if (e.dead) { skelCrumble(c, k, Q.deadT, bone, bone2, !!d.bow); return; }
      const bob = mv ? Math.abs(Math.sin(ph)) : Math.sin(t * 2.2) * 0.25;
      const rattle = mv ? Math.sin(ph * 2) * 0.3 : 0;
      const cr = Q.ph === "pre" ? eo(Q.pre) * 0.8 : 0;
      const hy = -9.8 + cr;
      /* Beine: Knochen mit Gelenkknubbeln */
      legs(c, k, { hy, len: 9.8, mv, ph, stride: 3, lift: 2, w: 1.3, colB: bone2, colF: bone, footB: bone2, footF: bone, toe: 2.2, knee: bone });
      /* Becken */
      poly(c, [-2.6, hy - 0.6, 2.6, hy - 0.6, 1.6, hy + 1.6, -1.6, hy + 1.6], k(bone));
      circ(c, 0, hy + 0.4, 0.7, k("#1a1010"));
      /* Wirbelsäule und Rippen */
      const sy = -17.6 - bob + cr;
      for (let i = 0; i < 4; i++) circ(c, -0.4 + rattle * 0.2, lp(hy - 1, sy, i / 3), 0.75, k(bone));
      for (let i = 0; i < 3; i++) { const yy = sy + 1.4 + i * 1.8; c.strokeStyle = k(i % 2 ? bone2 : bone); c.lineWidth = 0.9; c.beginPath(); c.moveTo(-0.4, yy); c.quadraticCurveTo(3.6, yy - 0.6, 3.2, yy + 1.2); c.stroke(); c.beginPath(); c.moveTo(-0.4, yy); c.quadraticCurveTo(-3.4, yy - 0.4, -2.8, yy + 1.2); c.stroke(); }
      limb(c, -3.2, sy, 3.2, sy, 1, k(bone));
      /* zerrissener Lumpen um die Hüfte */
      poly(c, [-3, hy - 1.6, 3, hy - 1.6, 3.4, hy + 2.6, 1.6, hy + 1.4, 0.4, hy + 3.4, -1, hy + 1.6, -3.2, hy + 2.8], k("#4a3a2a"));
      /* Schädel: Kiefer klappert beim Ausholen */
      const jaw = Q.ph === "pre" ? Math.abs(Math.sin(Q.time * 30)) * 1.2 : Q.ph === "act" ? 1.4 : Q.hurt;
      c.save(); c.translate(0.6, sy - 3.8); c.rotate(-Q.hurt * 0.4 + rattle * 0.1);
      ell(c, 0, -0.6, 3.1, 3, k(bone));
      ell(c, -0.6, -1.4, 1.8, 1.4, k("#f4f0e4"));
      poly(c, [0.2, 1.4 + jaw, 3.4, 1.2 + jaw, 3.2, 2.4 + jaw, 0.6, 2.6 + jaw], k(bone2));
      for (let i = 0; i < 3; i++) c.fillRect(1 + i * 0.8, 1.1, 0.4, 0.7);
      c.fillStyle = k("#1a1010"); c.fillRect(1.2, -1.4, 1.5, 1.5); c.fillRect(-1, -1.4, 1.1, 1.3); c.fillRect(2.8, 0.2, 0.5, 0.7);
      if (!flashOf(k)) { circ(c, 2, -0.7, 0.45, "#c0ff9a"); glow(c, 2, -0.7, 3, "rgba(160,255,140,.6)"); }
      c.restore();
      /* Arme und Waffe */
      const sx = 1, sy2 = sy + 0.4;
      if (d.bow) {
        const dr = Q.ph === "pre" ? eo(Q.pre) : 0;
        const fh = hand(sx, sy2, -0.12, 6.6);
        const bh = arm(c, k, sx - 2.2, sy2, Q.ph === "pre" ? fh[0] - 6 - dr * 4 + 3 : sx - 2.6, Q.ph === "pre" ? fh[1] - 0.4 : sy2 + 6.6, 3.8, 3.6, 1, bone2);
        const h2 = arm(c, k, sx, sy2, fh[0], fh[1], 3.8, 3.6, 1.1, bone);
        c.save(); c.translate(h2[0], h2[1]); c.rotate(-0.12); weapon(c, "bow", "#6b5040", t, dr); c.restore();
        return;
      }
      const lunge = Q.kind === "lunge";
      const a = lunge ? swing(0.8, 0.3, 0) : Q.kind === "lob" ? swing(0.9, -2.6, -0.4) : swing(0.9, -2.3, 0.7);
      const r = lunge ? (Q.ph === "pre" ? lp(6.4, 3.2, eo(Q.pre)) : Q.ph === "act" ? lp(3.2, 7.4, eo(Q.act)) : 6.4) : Q.ph === "act" ? 7.2 : 6.4;
      arm(c, k, sx - 2.2, sy2, sx - 2.6 + (Q.ph ? -1 : 0), sy2 + 6.4, 3.8, 3.6, 1, bone2);
      const h = hand(sx, sy2, a, r);
      const fh = arm(c, k, sx, sy2, h[0], h[1], 3.8, 3.6, 1.1, bone);
      c.save(); c.translate(fh[0], fh[1]);
      if (Q.kind === "lob" && Q.ph) { circ(c, 0, -1, 1.8, k(bone)); }
      else { c.rotate(lunge ? a * 0.3 : a - 0.7); limb(c, -1.4, 0, 2.6, 0, 1.4, k("#4a3a2a")); limb(c, 2.4, -1.8, 2.4, 1.8, 0.9, k("#6a5a48")); poly(c, [2.8, -1.1, 11, -1, 13.4, 0.3, 11, 1, 2.8, 1.1], k("#9a9282")); poly(c, [6, -1, 7, -0.2, 8, -1], k("#6a6050")); limb(c, 3.2, -0.2, 10.4, -0.3, 0.4, k("#c8c0b0")); }
      c.restore();
    },
    /* ---------- Untote: Zombie, Ertrunkener ---------- */
    zombie(c, e, d, k, t, mv, ph, ak) {
      const wet = !!d.wet;
      const l1 = mv ? Math.sin(ph * 0.7) : 0;
      const lurch = mv ? Math.abs(Math.sin(ph * 0.7)) * 1.2 : 0;
      c.rotate(0.12 + Math.sin(t * 1.4) * 0.03);
      const cr = Q.ph === "pre" ? eo(Q.pre) : 0;
      const hy = -9.6 + cr * 0.6;
      /* ein Bein schleift nach */
      legs(c, k, { hy, len: 9.6, mv, ph: ph * 0.7, stride: 2.6, lift: 1.2, w: 2.7, colB: shade(d.t), colF: d.t, footB: shade(d.skin), footF: d.skin, toe: 2.2 });
      const sy0 = -18.6 - lurch * 0.4 + cr;
      /* zerfetztes Hemd mit freiliegenden Rippen */
      poly(c, [-4.2, sy0, 4, sy0, 4.6, hy + 0.4, 3, hy + 2.2, 1.4, hy + 0.8, -0.4, hy + 2.6, -2.4, hy + 0.6, -4.4, hy + 1.6], k(d.c));
      poly(c, [-4.2, sy0, -1.4, sy0, -2, hy + 1, -4.4, hy + 1.6], k(shade(d.c)));
      ell(c, 2, sy0 + 4.4, 1.6, 2, k(shade(d.skin)));
      for (let i = 0; i < 3; i++) limb(c, 1, sy0 + 3.4 + i * 1.1, 3, sy0 + 3.2 + i * 1.1, 0.4, k("#d8d0b8"));
      limb(c, -4, hy, 4.4, hy - 0.2, 1, k("#3a2a1a"));
      if (wet) { for (let i = 0; i < 3; i++) limb(c, -3 + i * 2.6, sy0 + 1, -3.4 + i * 2.6 + Math.sin(t * 2 + i) * 0.5, sy0 + 6 + i, 0.6, k("#3a6a3a")); }
      /* Kopf hängt schief, Kiefer offen */
      const jaw = Q.ph ? 1 + charge() : 0.4 + Math.sin(t * 3) * 0.3;
      c.save(); c.translate(1.4, sy0 - 3); c.rotate(0.35 - cr * 0.5 - Q.hurt * 0.5 + Math.sin(t * 1.1) * 0.08);
      ell(c, 0, 0, 3.1, 3.3, k(d.skin));
      ell(c, -1, -0.6, 1.8, 2.4, k(shade(d.skin)));
      poly(c, [0.6, 1.6, 3.4, 1.4, 3, 2.2 + jaw, 1, 2.4 + jaw], k("#2a1a14"));
      c.fillStyle = k("#ffe04a"); c.fillRect(1.8, -1, 1, 0.9); c.fillStyle = k("#1a1010"); c.fillRect(-0.4, -1.2, 1, 1.1);
      if (!flashOf(k)) glow(c, 2.3, -0.6, 2, "rgba(255,230,80,.5)");
      poly(c, [-3, -1, -2.6, -3.6, 0.6, -3.6, -0.6, -2.4, -2.2, 0.6], k(wet ? "#2a4a3a" : "#3a3020"));
      if (wet) limb(c, -2.4, -1, -3.4, 3, 0.7, k("#3a6a3a"));
      c.restore();
      /* Arme: ausgestreckt, beim Greifen nach vorn schnellend */
      const sx = 1, sy = sy0 + 1;
      let reach = Q.kind === "grab" || Q.kind === "hit" ? swing(0.15, -0.35, 0.05) : Q.kind === "lob" ? swing(0.15, -2.4, -0.4) : 0.15;
      const rr = Q.ph === "act" ? 8.4 : Q.ph === "pre" ? lp(7.2, 5.4, eo(Q.pre)) : 7.2;
      const sw = Math.sin(t * 1.6) * 0.08;
      const bh = hand(sx - 2, sy + 0.6, reach + 0.18 + sw, rr);
      arm(c, k, sx - 2, sy + 0.6, bh[0], bh[1], 4, 4, 2, shade(d.c), shade(d.skin), 1);
      const fh = hand(sx, sy, reach - sw, rr);
      const f = arm(c, k, sx, sy, fh[0], fh[1], 4, 4, 2.1, d.c, d.skin, 1);
      for (let i = -1; i <= 1; i++) limb(c, f[0], f[1], f[0] + 1.6, f[1] + i * 0.8 + 0.4, 0.5, k(shade(d.skin)));
      if (wet && Math.random() < 0.05) Z.fx.p({ x: e.x + e.w / 2, y: e.y + 8, vx: 0, vy: 20, g: 300, life: 0.4, size: 1.2, col: "#8a9a8a", kind: "drop" });
    },
    bloat(c, e, d, k, t, mv, ph, ak) {
      const cr = Q.ph === "pre" ? eo(Q.pre) : 0;
      const sw = 1 + cr * 0.3 + Math.sin(t * 4) * 0.03 + (Q.ph === "pre" ? Math.sin(Q.time * 30) * 0.03 * cr : 0);
      const l1 = mv ? Math.sin(ph * 0.6) * 2 : 0;
      limb(c, -3, -6, -3 - l1, 0, 3, k("#3a3a2a")); limb(c, 3, -6, 3 + l1, 0, 3, k("#3a3a2a"));
      ell(c, -3.4 - l1, 0, 2, 1, k("#5a6a4a")); ell(c, 3.4 + l1, 0, 2, 1, k("#5a6a4a"));
      /* aufgeblähter Bauch mit Nähten und Adern */
      ell(c, 0, -12, 9 * sw, 8.4 * sw, k(d.c));
      ell(c, 2, -11, 5.6 * sw, 4.8 * sw, k("#9aaa6a"));
      ell(c, -3, -15, 3, 2, k(shade(d.c)));
      c.strokeStyle = k("#4a3a2a"); c.lineWidth = 0.5; c.beginPath(); c.moveTo(-1 * sw, -16 * sw); c.quadraticCurveTo(3 * sw, -12, 0, -6 * sw); c.stroke();
      for (let i = 0; i < 4; i++) limb(c, -1.4 * sw + i * 0.9, -14 * sw + i * 2.4, 1 + i * 0.9, -13.6 * sw + i * 2.4, 0.4, k("#4a3a2a"));
      const vg = 0.3 + cr * 0.7;
      c.strokeStyle = flashOf(k) ? "#fff" : "rgba(170,220,60," + vg.toFixed(2) + ")"; c.lineWidth = 0.6;
      c.beginPath(); c.moveTo(5 * sw, -15 * sw); c.lineTo(6.4 * sw, -12 * sw); c.lineTo(5.4 * sw, -9 * sw); c.moveTo(-6 * sw, -9 * sw); c.lineTo(-4 * sw, -7.4 * sw); c.stroke();
      if (Q.ph === "pre") glow(c, 0, -12, 14 * sw, "rgba(160,220,60," + (cr * 0.5).toFixed(2) + ")");
      /* Stummelarme und kleiner Kopf */
      limb(c, -7 * sw, -14, -9 * sw, -9 + Math.sin(t * 2) * 1, 1.8, k("#7a8a6a"));
      limb(c, 7 * sw, -14, 9 * sw, -10 - cr * 3, 1.8, k("#7a8a6a"));
      c.save(); c.translate(2.4, -20.6 * Math.min(1.1, sw)); c.rotate(Math.sin(t * 1.3) * 0.1);
      ell(c, 0, 0, 3, 2.8, k("#8a9a7a")); c.fillStyle = k("#ffe04a"); c.fillRect(1.4, -0.9, 1, 1);
      poly(c, [0.4, 1, 2.8, 0.8, 2.2, 1.8 + cr], k("#3a2a1a"));
      c.restore();
    },
    /* ---------- Belebte Rüstung: leer, Teile schweben mit Glut dazwischen ---------- */
    armor(c, e, d, k, t, mv, ph, ak) {
      const fl = Math.sin(t * 2.2) * 0.4, gap = 0.6 + Math.sin(t * 3) * 0.3 + (Q.ph === "pre" ? eo(Q.pre) * 1.2 : 0) + Q.hurt * 1.5;
      const cr = Q.ph === "pre" ? eo(Q.pre) * 1.2 : 0;
      const hy = -11 + cr;
      const charging = Q.kind === "charge" && (Q.ph === "act" || Q.ph === "pre");
      if (charging) c.rotate(Q.ph === "act" ? 0.25 : -0.05);
      legs(c, k, { hy, len: 11, mv, ph, stride: 3.2, lift: 1.8, w: 3.2, colB: "#4a4e56", colF: "#6a6e78", footB: "#3a3e46", footF: "#5a5e68", toe: 3, knee: "#9a9ea8" });
      /* Glut im Inneren */
      if (!flashOf(k)) glow(c, 0, -16, 9, "rgba(255,150,60," + (0.25 + 0.15 * Math.sin(t * 4)).toFixed(2) + ")");
      /* Faltenrock aus Plattenstreifen */
      for (let i = 0; i < 4; i++) poly(c, [-4.6 + i * 2.4, hy - 0.4, -2.4 + i * 2.4, hy - 0.4, -2.2 + i * 2.4, hy + 3, -4.6 + i * 2.4, hy + 3.2], k(i % 2 ? "#6a6e78" : "#5a5e68"));
      /* Brustpanzer (schwebt leicht) */
      const by = -1.4 - gap * 0.6 + fl;
      poly(c, [-5, hy - 0.6 + by, 5, hy - 0.6 + by, 6, -21 + by, 3, -22.4 + by, -3, -22.4 + by, -6, -21 + by], k(d.c));
      poly(c, [-3.6, hy - 2 + by, 4, hy - 2 + by, 4.6, -19.4 + by, -4.2, -19.4 + by], k("#9a9ea8"));
      limb(c, 0.4, -20 + by, 0.4, hy - 2.4 + by, 0.6, k("#6a6e78"));
      limb(c, -4.2, -19.4 + by, 4.6, -19.4 + by, 0.6, k("#c8ccd4"));
      circ(c, 2, -16 + by, 1.1, k(d.t));
      /* Schulterplatten */
      ell(c, -4.4, -21 + by - gap * 0.4, 2.6, 1.8, k("#5a5e68")); ell(c, 4.6, -21.2 + by - gap * 0.5, 3, 2, k("#7a7e88")); limb(c, 2.4, -22.4 + by - gap * 0.5, 6.4, -21.6 + by - gap * 0.5, 0.5, k("#c8ccd4"));
      /* Helm mit Sehschlitz und Federbusch */
      const hY = -26 + by - gap * 1.2;
      c.save(); c.translate(0.4, hY); c.rotate(-Q.hurt * 0.35 + (charging ? 0.15 : 0));
      const plume = Math.sin(t * 4) * 0.6 + (mv ? -1.4 : 0);
      poly(c, [-1, -3.4, -4 + plume, -5.4, -6.6 + plume, -3, -4.6 + plume, -2.2, -1.6, -2.6], k(d.t === "#c88a2a" ? "#8a2a1a" : d.t));
      poly(c, [-3.6, 3, -3.6, -2.4, -1.6, -3.8, 2.4, -3.8, 4, -2, 4, 3], k(d.c));
      poly(c, [-2.8, 2.6, -2.8, -2, 0, -3, 0, 2.6], k(shade(d.c)));
      c.fillStyle = k("#120c08"); c.fillRect(0.4, -1, 3.8, 1.2);
      c.fillStyle = k(d.t); c.fillRect(1.6, -0.8, 2.2, 0.8);
      if (!flashOf(k)) glow(c, 2.6, -0.4, 4 + (Q.ph ? 2 : 0), "rgba(255,170,60,.75)");
      for (let i = 0; i < 3; i++) limb(c, 1 + i * 1.1, 1, 1 + i * 1.1, 2.4, 0.4, k("#2a2a30"));
      c.restore();
      /* Schwert: großer Zweihänder */
      const a = charging ? (Q.ph === "act" ? 0.1 : -0.3) : (Q.kind === "combo" && Q.alt ? swing(0.6, 1.2, -1.5) : swing(0.6, -2.4, 0.7) + shake(0.1));
      const sx = 2, sy = -20.4 + by;
      const h = hand(sx, sy, a, Q.ph === "act" ? 7.6 : 6.6);
      /* schwebende Panzerhandschuhe statt Arme: Glut zwischen den Gliedern */
      const ex = lp(sx, h[0], 0.5), ey = lp(sy, h[1], 0.5) + 0.6;
      ell(c, ex, ey, 1.6, 1.3, k("#6a6e78"));
      if (!flashOf(k)) { circ(c, lp(sx, ex, 0.5), lp(sy, ey, 0.5), 0.6, "#ffb060"); circ(c, lp(ex, h[0], 0.5), lp(ey, h[1], 0.5), 0.6, "#ffb060"); }
      c.save(); c.translate(h[0], h[1]); c.rotate(a - 0.5);
      limb(c, -2.4, 0, 3.6, 0, 2, k("#4a3a2a")); limb(c, 3.4, -3, 3.4, 3, 1.4, k("#8a8e98")); circ(c, -2.8, 0, 1.1, k(d.t));
      poly(c, [4, -1.8, 20, -1.2, 23, 0, 20, 1.2, 4, 1.8], k("#c8c0b8")); limb(c, 5, 0, 19, 0, 0.6, k("#8a8480"));
      c.restore();
      ell(c, h[0], h[1], 1.7, 1.5, k("#7a7e88"));
    },
    /* ---------- Golem: Runenwächter, Wächter der Schmiede ---------- */
    golem(c, e, d, k, t, mv, ph, ak) {
      const l1 = mv ? Math.sin(ph * 0.7) * 2.5 : 0;
      const cr = Q.ph === "pre" ? eo(Q.pre) : 0;
      const slam = Q.kind === "slam" || Q.mv === "stampf";
      const beam = Q.kind === "beam" || Q.mv === "strahl" || Q.mv === "runenregen";
      const bob = mv ? Math.abs(Math.sin(ph * 0.7)) * 0.8 : Math.sin(t * 1.4) * 0.3;
      const hy = -9 + cr * (slam ? 2 : 0.6);
      const rune = (a) => flashOf(k) ? "#fff" : "rgba(255," + (150 + 60 * a | 0) + ",60," + (0.6 + 0.4 * a).toFixed(2) + ")";
      const pul = 0.5 + 0.5 * Math.sin(t * 3) + (beam ? charge() : 0);
      if (e.dead) { golemCrumble(c, k, Q.deadT, d); return; }
      /* Beine: Steinblöcke */
      for (const [x, s2, col] of [[-4, -1, "#3a3e48"], [4, 1, "#4a4e58"]]) {
        const fx = x + l1 * s2 + (Q.ph === "act" && slam ? s2 * 1.5 : 0);
        poly(c, [x - 2.6, hy, x + 2.6, hy, fx + 3, -0.4, fx - 3, -0.4], k(col));
        poly(c, [fx - 3.4, -2, fx + 3.8, -2, fx + 3.8, 0, fx - 3.4, 0], k(shade(col)));
        limb(c, x - 1.6, hy + 3, x + 1.6, hy + 2.6, 0.5, k("#2a2e36"));
      }
      /* Rumpf: Steinplatten mit Rune */
      const ty = -bob + cr * (slam ? 2 : 0.5);
      poly(c, [-8, hy + ty, 8, hy + ty, 10, -22 + ty, 6, -24 + ty, -6, -24 + ty, -10, -22 + ty], k(d.c));
      poly(c, [-6.6, hy - 1.6 + ty, 6.6, hy - 1.6 + ty, 8, -20.6 + ty, -8, -20.6 + ty], k(shade(d.c, 1.18)));
      limb(c, -8, -15 + ty, -4, -14 + ty, 0.6, k(shade(d.c))); limb(c, 4, -18 + ty, 8.4, -17 + ty, 0.6, k(shade(d.c))); limb(c, -3, -11 + ty, -6, -9.6 + ty, 0.6, k(shade(d.c)));
      for (let i = 0; i < 3; i++) circ(c, -6 + i * 6, -23 + ty, 0.6, k("#8a8e98"));
      c.strokeStyle = rune(pul); c.lineWidth = 1.1; c.beginPath(); c.arc(0, -15 + ty, 4, 0, TAU); c.stroke();
      c.beginPath(); c.moveTo(-2, -13 + ty); c.lineTo(0, -18 + ty); c.lineTo(2, -13 + ty); c.moveTo(-1.2, -15 + ty); c.lineTo(1.2, -15 + ty); c.stroke();
      glow(c, 0, -15 + ty, 10 + (beam ? charge() * 8 : 0), "rgba(255,170,60,.55)");
      if (beam && Q.ph === "act") glow(c, 6, -15 + ty, 14, "rgba(255,200,90,.8)");
      /* Kopf: Block mit leuchtendem Visier */
      c.save(); c.translate(0, -24 + ty);
      poly(c, [-5, 0, 5, 0, 4.4, -6.6, 2, -7.6, -3.6, -7.4, -4.6, -5.6], k(d.c));
      poly(c, [-5, 0, -1.4, 0, -1.6, -7.4, -3.6, -7.4, -4.6, -5.6], k(shade(d.c)));
      c.fillStyle = k("#140c08"); c.fillRect(0, -4.6, 4.6, 1.8);
      c.fillStyle = k(d.t); c.fillRect(1, -4.2, 3.4, 1.1); glow(c, 2.6, -3.6, 5 + (Q.ph ? 3 : 0), "rgba(255,170,60,.8)");
      limb(c, -2.6, -7.6, -3.4, -9.6, 1, k("#6a6e78")); limb(c, 1.6, -7.8, 2.2, -9.8, 1, k("#6a6e78"));
      c.restore();
      /* Arme: schwere Steinfäuste; Stampfen = beide über den Kopf, dann nieder */
      let aF, aB;
      if (slam) { aF = swing(1.4, -1.7, 1.2) + shake(0.08); aB = aF + 0.15; }
      else if (beam) { aF = swing(1.4, 0.2, 0.0); aB = swing(1.6, -0.2, 0.2); }
      else { aF = swing(1.4, -1.6, 0.5); aB = 1.6 + Math.sin(t * 1.4) * 0.05; }
      for (const [sx, a, col, col2] of [[-8.6, aB, "#3a3e48", "#4a4e58"], [8.6, aF, "#4a4e58", "#5a5e68"]]) {
        const syy = -21 + ty;
        const ex = sx + Math.cos(a) * 6, ey = syy + Math.sin(a) * 6;
        const hx = ex + Math.cos(a - 0.3) * 6, hy2 = ey + Math.sin(a - 0.3) * 6;
        limb(c, sx, syy, ex, ey, 4.4, k(col)); circ(c, ex, ey, 2.4, k(shade(col)));
        limb(c, ex, ey, hx, hy2, 4.2, k(col));
        poly(c, [hx - 3.6, hy2 - 3, hx + 3.6, hy2 - 3.4, hx + 4.4, hy2 + 3, hx - 3, hy2 + 3.6], k(col2));
        limb(c, hx - 2, hy2 - 0.6, hx + 2.6, hy2 - 1, 0.5, k(shade(col2)));
        if (sx > 0) { c.strokeStyle = rune(pul); c.lineWidth = 0.7; c.beginPath(); c.moveTo(hx - 1.6, hy2 + 1.6); c.lineTo(hx, hy2 - 1.2); c.lineTo(hx + 1.6, hy2 + 1.6); c.stroke(); }
      }
      ell(c, 8.6, -22 + ty, 3.6, 2.8, k(shade(d.c, 1.1)));
    },
    stirge(c, e, d, k, t, mv, ph, ak) {
      const dive = Q.kind === "dive" && (Q.ph === "act" || Q.ph === "pre");
      const fl = dive && Q.ph === "act" ? -3 : Math.sin(t * 30) * 5;
      if (dive) c.rotate(Q.ph === "act" ? 0.5 : -0.3 * eo(Q.pre));
      /* Flügel: Hautflügel mit Fingerknochen */
      poly(c, [0, -6, -4, -12 + fl, -11, -10 + fl, -8, -7 + fl * 0.3, -5, -4.4], k(shade(d.c)));
      limb(c, 0, -6, -4, -12 + fl, 0.5, k("#3a1a1a")); limb(c, -1, -6, -9, -10 + fl, 0.4, k("#3a1a1a"));
      /* Beinchen baumeln */
      for (let i = 0; i < 3; i++) limb(c, -1 + i * 1.6, -3, -2 + i * 1.6 + Math.sin(t * 6 + i) * 0.6, 0 + (dive ? 1 : 0), 0.5, k("#3a2020"));
      ell(c, -1, -5, 4, 3, k(d.c)); ell(c, -2.6, -4.2, 2.4, 1.8, k(d.t));
      circ(c, 2.4, -6, 2.2, k(d.c));
      /* Rüssel */
      const pr = dive ? 9 : 6 + (Q.ph === "pre" ? Q.pre * 2 : 0);
      limb(c, 3.8, -5.6, 3.8 + pr, -4.6 + (dive ? 0.6 : 0), 0.8, k(d.t));
      circ(c, 3, -6.8, 0.8, k("#ffe04a")); if (!flashOf(k)) glow(c, 3, -6.8, 2, "rgba(255,230,80,.5)");
      poly(c, [0, -6, 4, -13 - fl, 9, -11 - fl, 6, -7 - fl * 0.3, 3, -4.4], k(d.c));
      limb(c, 0.4, -6, 4, -13 - fl, 0.5, k("#3a1a1a"));
    },
    harpy(c, e, d, k, t, mv, ph, ak) {
      const dive = Q.kind === "dive";
      const shoot = Q.kind === "shoot";
      const fl = shoot && Q.ph === "act" ? 8 : dive && Q.ph === "act" ? -6 : Math.sin(t * 9) * 6;
      const tilt = dive ? (Q.ph === "act" ? 0.5 : Q.ph === "pre" ? -0.35 * eo(Q.pre) : 0) : 0;
      c.rotate(tilt);
      /* hinterer Flügel */
      poly(c, [-1, -13, -10, -20 + fl, -16, -14 + fl, -12, -12 + fl * 0.5, -10, -9 + fl * 0.3, -3, -10], k(shade(d.c)));
      for (let i = 0; i < 4; i++) poly(c, [-10 - i * 1.6, -15 + fl + i * 1.4, -14 - i * 1.4, -12 + fl * 0.7 + i * 1.6, -11 - i * 1.4, -11 + fl * 0.5 + i * 1.2], k(shade(d.c, 0.8)));
      /* Vogelbeine mit Krallen (strecken sich beim Sturz nach vorn) */
      const talon = dive && Q.ph === "act" ? 1 : 0;
      for (const [x, col] of [[-1, shade("#a08060")], [1, "#a08060"]]) {
        const tx = x + talon * 4, ty2 = 1 - talon * 2;
        limb(c, x, -4, tx, ty2, 1.2, k(col)); for (let i = -1; i <= 1; i++) limb(c, tx, ty2, tx + 1.4, ty2 + 0.6 + i * 0.6, 0.5, k("#2a2018"));
      }
      /* Leib mit Federkleid */
      ell(c, 0, -8, 3.6, 5, k(d.c));
      for (let i = 0; i < 3; i++) poly(c, [-2.6, -6 + i * 2, 0, -4 + i * 2, 2.6, -6 + i * 2], k(shade(d.c, 1.2)));
      ell(c, 0.8, -10.6, 2.6, 2.6, k(d.skin));
      /* vorderer Flügel (Arm) */
      poly(c, [1, -12.6, 10, -21 - fl, 15, -15 - fl, 11, -12 - fl * 0.5, 9, -9 - fl * 0.3, 3, -10], k(d.t));
      for (let i = 0; i < 4; i++) poly(c, [9 + i * 1.4, -16 - fl + i * 1.4, 13 + i * 1, -13 - fl * 0.7 + i * 1.6, 10 + i * 1.2, -12 - fl * 0.5 + i * 1.2], k(shade(d.t, 0.85)));
      limb(c, 1, -12.6, 10, -21 - fl, 0.6, k(shade(d.t, 0.7)));
      /* Kopf mit wildem Haar */
      c.save(); c.translate(1, -14.4); c.rotate(-Q.hurt * 0.4 + (Q.ph === "pre" ? -0.15 : 0));
      const hair = Math.sin(t * 5) * 0.8;
      poly(c, [-2.6, -1.6, -7 + hair, -3, -8 + hair, 0, -6 + hair, 2.4, -3, 2, -1, -3.2], k("#3a2a20"));
      ell(c, 0, 0, 2.8, 3, k(d.skin));
      poly(c, [-2.6, -1.4, -1.2, -3.4, 2.4, -3, 2.8, -1.4, 0.6, -2, -1.6, 0], k("#3a2a20"));
      c.fillStyle = k("#ff3a2a"); c.fillRect(1.4, -0.8, 1, 0.8); if (!flashOf(k)) glow(c, 1.9, -0.4, 2, "rgba(255,60,40,.5)");
      poly(c, [0.8, 1.2, 2.6, 1, 2.2, 1.6 + (Q.ph ? 1 : 0)], k("#4a1a14"));
      c.restore();
    },
    mane(c, e, d, k, t, mv, ph, ak) {
      const b = mv ? Math.abs(Math.sin(ph)) : Math.sin(t * 3) * 0.3;
      const cr = Q.ph === "pre" ? eo(Q.pre) : 0;
      legs(c, k, { hy: -4.6 + cr, len: 5, mv, ph, stride: 2.4, lift: 1.6, w: 2, colB: shade(d.c), colF: d.c, footB: "#2a1418", footF: "#3a1a20", toe: 2, bend: -1 });
      /* gebückter Leib mit Wirbelhöckern */
      ell(c, -0.4, -7.4 - b + cr, 5, 4.4, k(d.c));
      ell(c, 0.4, -6.4 - b + cr, 3.4, 2.8, k(shade(d.c, 1.2)));
      for (let i = 0; i < 3; i++) poly(c, [-3.6 + i * 1.6, -10.6 - b + cr + i * 0.4, -3 + i * 1.6, -12.6 - b + cr + i * 0.3, -2.2 + i * 1.6, -10.6 - b + cr + i * 0.4], k(shade(d.c, 0.7)));
      /* Kopf: großes Maul */
      const op = Q.ph === "pre" ? 0.5 + Math.sin(Q.time * 20) * 0.2 : Q.ph === "act" ? 1 : 0.15;
      c.save(); c.translate(2, -11 - b + cr); c.rotate(-Q.hurt * 0.4);
      ell(c, 0, 0, 3.4, 3, k(d.c));
      poly(c, [0.6, 0.6, 4, 0.2, 3.6, 1.4 + op * 2, 0.8, 1.8 + op], k("#2a0a10"));
      for (let i = 0; i < 3; i++) poly(c, [1.2 + i * 0.9, 0.5, 1.6 + i * 0.9, 1.4, 2 + i * 0.9, 0.5], k("#f0e0d0"));
      poly(c, [-1, -2.6, -0.4, -6, 0.8, -2.8], k("#3a1a20")); poly(c, [1.4, -2.6, 2.6, -5, 2.6, -2.2], k("#3a1a20"));
      c.fillStyle = k(d.t); c.fillRect(1.4, -1.4, 1.2, 1); c.fillRect(-0.6, -1.4, 0.9, 0.9);
      if (!flashOf(k)) glow(c, 1.6, -0.9, 3, "rgba(255,140,90,.6)");
      c.restore();
      /* Krallenarme */
      const a = swing(0.7, -2, 0.6) + (Q.kind === "hit" && Q.alt ? 0.6 : 0);
      for (const [sx, off, col] of [[-1.2, 0.35, shade(d.c)], [1.4, 0, d.c]]) {
        const h = hand(sx, -9 - b + cr, a + off, 5.4);
        const r = arm(c, k, sx, -9 - b + cr, h[0], h[1], 3, 3, 1.4, col);
        for (let i = -1; i <= 1; i++) limb(c, r[0], r[1], r[0] + Math.cos(a + off + i * 0.4) * 2.2, r[1] + Math.sin(a + off + i * 0.4) * 2.2, 0.5, k("#e8d8c8"));
      }
    },
    kuotoa(c, e, d, k, t, mv, ph, ak) {
      const bob = mv ? Math.abs(Math.sin(ph)) : Math.sin(t * 2) * 0.4;
      const cr = Q.ph === "pre" ? eo(Q.pre) : 0;
      const hy = -9 + cr * 0.8;
      const boss = !!d.boss;
      legs(c, k, { hy, len: 9.2, mv, ph, stride: 3, lift: 1.6, w: 2.4, colB: shade(d.c), colF: d.c, footB: shade(d.c, 0.8), footF: "#3a7a6a", toe: 3, bend: 1 });
      /* Rückenflosse */
      const fin = Math.sin(t * 3) * 0.6;
      poly(c, [-3.6, -20 - bob, -6.6 + fin, -17 - bob, -6 + fin, -12 - bob, -4, -10 - bob], k(d.t === "#e5b454" ? "#c08a3a" : d.t));
      for (let i = 0; i < 3; i++) limb(c, -4, -18 + i * 3 - bob, -6 + fin, -16.6 + i * 2 - bob, 0.4, k(shade(d.c)));
      /* Rumpf mit Schuppen */
      ell(c, 0, -13.4 - bob + cr * 0.6, 5, 6, k(d.c));
      ell(c, 1.2, -12.4 - bob + cr * 0.6, 3, 4.2, k("#5a9a86"));
      for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) { c.strokeStyle = k(shade(d.c, 0.75)); c.lineWidth = 0.4; c.beginPath(); c.arc(-2.6 + j * 2.2, -16 + i * 2 - bob + cr * 0.6, 1, 0.2, PI - 0.2); c.stroke(); }
      if (boss || d.staff) { /* Priestergewand: Fischnetzschärpe mit Muscheln */ limb(c, -4, -18 - bob, 4, -9 - bob, 1, k("#c8b890")); for (let i = 0; i < 3; i++) circ(c, -2.6 + i * 2.6, -16 + i * 2.6 - bob, 0.8, k("#f0e0d0")); }
      /* Kopf: Fischkopf mit Glubschaugen */
      const hY = -21 - bob + cr * 0.8;
      c.save(); c.translate(1.6, hY); c.rotate(-Q.hurt * 0.35 + (Q.ph === "pre" ? -0.1 : 0));
      ell(c, 0, 0, 4.4, 3.6, k(d.c));
      ell(c, 1.6, 1.2, 3, 1.8, k("#5a9a86"));
      const gape = Q.ph ? 0.6 + charge() * 1.2 : 0.3 + Math.sin(t * 2.4) * 0.3;
      poly(c, [2, 1.8, 4.8, 1.4, 4.6, 2.4 + gape, 2.4, 2.6 + gape * 0.5], k("#2a0a10"));
      circ(c, 2.2, -1.2, 2, k("#f0f0e0")); circ(c, 2.6, -1.2, 1, k("#101010")); circ(c, 2.9, -1.6, 0.35, k("#fff"));
      for (let i = 0; i < 3; i++) limb(c, -2 + i, 1.6, -2.4 + i, 3.2, 0.4, k(shade(d.c, 0.7)));
      poly(c, [-2.6, -2.6, -1.4, -6, 0.2, -3.2, 1.4, -5, 1.6, -3], k(d.t));
      if (d.crown) { poly(c, [-2.6, -3, -2, -7.4, -0.6, -4.6, 0.8, -8.4, 2.2, -4.4, 3.6, -7, 3.8, -3], k("#e8e0c0")); circ(c, 0.8, -5, 0.7, k("#c03a5a")); if (!flashOf(k)) glow(c, 0.8, -6, 6, "rgba(255,210,120,.4)"); }
      c.restore();
      limb(c, 4.4, -19.4 - bob, 7, -18.4 - bob + Math.sin(t * 3) * 0.6, 0.6, k("#f0e0d0"));
      /* Arme mit Schwimmhäuten und Waffe */
      const sx = 2, sy = -16.6 - bob + cr * 0.6;
      let a, wr;
      if (d.staff) { const cast = Q.ph && Q.kind !== "hit"; a = cast ? swing(0.6, -1.4, -0.5) : 0.6; wr = cast ? swing(-1.4, -1.6, -0.9) : -1.4; }
      else if (d.spear) { a = swing(0.4, -2.4, -0.1); wr = swing(-0.3, -0.5, -0.05); }
      else { a = Q.kind === "web" ? swing(0.5, -2.2, 0) : swing(0.5, 0.2, 0.05); wr = a * 0.3; }
      const r = Q.ph === "act" && !d.staff ? 7.6 : 6;
      const h = hand(sx, sy, a, r);
      arm(c, k, sx - 3, sy + 0.6, d.staff && Q.ph ? sx + 2 : sx - 3.4, d.staff && Q.ph ? sy - 4 : sy + 6, 4, 3.6, 1.6, shade(d.c));
      const f = arm(c, k, sx, sy, h[0], h[1], 4, 3.6, 1.8, d.c);
      c.save(); c.translate(f[0], f[1]); c.rotate(wr);
      if (d.staff) { limb(c, -10, 0, 18, 0, 1.4, k("#6a4a30")); c.strokeStyle = k("#e5b454"); c.lineWidth = 1.1; c.beginPath(); c.arc(21, 0, 3.4, PI * 0.7, PI * 1.3, true); c.stroke(); limb(c, 18, -2, 23, -3.6, 0.8, k("#e5b454")); limb(c, 18, 2, 23, 3.6, 0.8, k("#e5b454")); const g = 0.6 + charge() * 0.6; glow(c, 21, 0, 6 + g * 5, "rgba(255,230,140,.7)"); if (Q.ph === "act") { for (let i = 0; i < 2; i++) line(c, [21, 0, 24, -2 + i * 4, 26, 0 + i * 2, 29, -1 + i * 3], 0.6, "#fff4c0"); } }
      else if (Q.kind === "web" && Q.ph) { ell(c, 1, -0.6, 2, 1.6, k("#d8d0dc")); }
      else { limb(c, -10, 0, 22, 0, 1.3, k("#6a4a30")); poly(c, [22, -3, 28, -4.4, 26, 0, 28, 4.4, 22, 3], k("#d8706a")); poly(c, [22, -3, 28, -4.4, 26, 0], k("#f0a090")); }
      c.restore();
      poly(c, [f[0] - 0.8, f[1] - 1, f[0] + 1.8, f[1], f[0] - 0.4, f[1] + 1.4], k("#3a7a6a"));
    },
    ray(c, e, d, k, t, mv, ph, ak) {
      const fl = Math.sin(t * 6) * 4 + (Q.kind === "dive" && Q.ph === "act" ? -3 : 0);
      c.save(); c.globalAlpha *= 0.95;
      glow(c, 0, -5, 14, "rgba(220,220,200,.25)");
      /* Schwanz mit Stachel */
      c.strokeStyle = k(d.t); c.lineWidth = 0.9; c.lineCap = "round"; c.beginPath(); c.moveTo(-8, -5); c.quadraticCurveTo(-15, -4 + Math.sin(t * 5) * 3, -22, -5 + Math.sin(t * 5 + 1) * 3); c.stroke();
      poly(c, [-21, -6 + Math.sin(t * 5 + 1) * 3, -24, -5 + Math.sin(t * 5 + 1) * 3, -21, -4 + Math.sin(t * 5 + 1) * 3], k("#e8e0d0"));
      /* Leib mit Flügelsaum (wellt sich) */
      c.fillStyle = k(d.c); c.beginPath(); c.moveTo(10, -5);
      c.quadraticCurveTo(6, -9 - fl, 2, -11 - fl); c.quadraticCurveTo(-4, -9 - fl * 0.6, -10, -6); c.lineTo(-10, -4);
      c.quadraticCurveTo(-4, -1 + fl * 0.6, 2, 1 + fl); c.quadraticCurveTo(6, -1 + fl, 10, -5); c.fill();
      ell(c, 0, -5, 5, 2, k(d.t));
      for (let i = 0; i < 4; i++) circ(c, -3 + i * 2, -5, 0.5, k(shade(d.t)));
      poly(c, [9, -6, 12, -9, 11, -5], k(d.t)); poly(c, [9, -4, 12, -1, 11, -5], k(d.t));
      circ(c, 7, -6, 0.7, k("#2a1010"));
      c.restore();
    },
    crab(c, e, d, k, t, mv, ph, ak) {
      const b = mv ? Math.sin(ph * 2) : 0;
      const cr = Q.ph === "pre" ? eo(Q.pre) : 0;
      /* Beine: je Seite drei, trippeln */
      for (let i = 0; i < 3; i++) {
        const o = Math.sin(ph * 2 + i * 2) * (mv ? 1.4 : 0);
        for (const s of [-1, 1]) { const x0 = s * (2 + i * 1.6), kx = s * (6 + i * 2) + o, ky = -7.6 + Math.abs(o) * 0.3, fx = s * (7.6 + i * 2) + o * 0.6; limb(c, x0, -5, kx, ky, 1.2, k(s < 0 ? shade(d.c) : d.c)); limb(c, kx, ky, fx, 0, 1, k(s < 0 ? shade(d.c) : d.c)); }
      }
      /* Panzer */
      ell(c, 0, -6 + cr * 0.6, 9, 4.6, k(d.c));
      ell(c, 0, -7 + cr * 0.6, 6.6, 2.8, k(d.t));
      for (let i = 0; i < 4; i++) circ(c, -4 + i * 2.6, -9.2 + cr * 0.6 + Math.abs(i - 1.5) * 0.4, 0.6, k(shade(d.c)));
      limb(c, -8, -4.6 + cr * 0.6, 8, -4.6 + cr * 0.6, 0.6, k(shade(d.c)));
      /* Stielaugen */
      const look = Math.sin(t * 1.2) * 0.4;
      for (const x of [2.6, 5]) { limb(c, x, -9 + cr * 0.6, x + look, -12.4, 0.8, k(d.c)); circ(c, x + look, -12.6, 1, k("#101010")); circ(c, x + look + 0.3, -12.9, 0.3, k("#fff")); }
      /* Scheren: öffnen sich beim Ausholen, schnappen im Angriff zu */
      const op = Q.ph === "pre" ? 0.3 + eo(Q.pre) * 0.7 : Q.ph === "act" ? 0.05 : 0.25 + Math.sin(t * 2) * 0.08;
      const ext = Q.ph === "act" ? 4 : Q.ph === "pre" ? -1.4 * eo(Q.pre) : 0;
      const claw = (x, y, sc, col) => {
        c.save(); c.translate(x + ext, y); c.scale(sc, sc);
        limb(c, -4, 2, 0, 0, 1.6, k(col));
        c.save(); c.rotate(-op * 0.6); poly(c, [0, -1.6, 4.6, -3.4, 7.6, -1.6, 6.6, -0.4, 1.6, 0], k(col)); c.restore();
        c.save(); c.rotate(op * 0.4); poly(c, [0, 0.4, 6, 1, 6.6, 1.8, 1, 1.8], k(shade(col))); c.restore();
        c.restore();
      };
      claw(8.6, -9.4 + cr, 1, d.c);
      claw(5.4, -6 + cr, 0.75, shade(d.c));
    },
    spider(c, e, d, k, t, mv, ph, ak) {
      const big = !!d.boss;
      const cr = Q.ph === "pre" ? eo(Q.pre) : 0;
      const lunge = Q.ph === "act" ? 1 - Q.act * 0.5 : 0;
      const by = -6.6 + cr * 1.6 - lunge * 1.4 + (mv ? Math.sin(ph * 3) * 0.3 : Math.sin(t * 2) * 0.2);
      /* acht Beine mit Knie, abwechselnde Gangart */
      const legsSide = (front) => {
        for (let i = 0; i < 4; i++) {
          const o = mv ? Math.sin(ph * 1.6 + i * 1.6 + (front ? PI : 0)) : Math.sin(t * 1.5 + i) * 0.15;
          const dir = i < 2 ? 1 : -1;
          const rx = (i < 2 ? 1 + i * 1.4 : -1 - (i - 2) * 1.4);
          const fx = rx + dir * (5 + (i % 2 ? 3 : 1.6)) + o * 1.6 + (Q.ph === "pre" && i < 2 ? -1.4 * cr : 0) + (front ? 0.6 : -0.6);
          const fy = mv ? -Math.max(0, Math.cos(ph * 1.6 + i * 1.6 + (front ? PI : 0))) * 1.6 : 0;
          const kx = (rx + fx) / 2 + dir * 1.2, ky = by - 4.4 - (i % 2) * 0.8 + (front ? 0 : -0.5);
          const col = k(front ? d.t : shade(d.t, 0.75));
          limb(c, rx, by, kx, ky, big ? 1.1 : 1.2, col); limb(c, kx, ky, fx, fy, big ? 0.8 : 0.9, col);
          circ(c, kx, ky, 0.6, col);
        }
      };
      legsSide(false);
      /* Hinterleib mit Zeichnung */
      ell(c, -4.6, by - 0.8, 6.6, 5, k(d.c));
      ell(c, -5.4, by - 2, 3.6, 2, k(shade(d.c, 1.25)));
      if (big) { c.fillStyle = k(d.t); poly(c, [-6, by - 3, -4.4, by - 1, -2.8, by - 3, -4.4, by + 1.6], k(d.t)); }
      else { limb(c, -7.6, by - 1.4, -2, by - 1.4, 0.6, k("#8a6a40")); circ(c, -5, by + 0.6, 0.6, k("#8a6a40")); }
      for (let i = 0; i < 3; i++) limb(c, -8 + i * 2.4, by - 4.2 + (i === 1 ? -0.4 : 0), -8.4 + i * 2.4, by - 5.2, 0.4, k(shade(d.c, 0.7)));
      /* Kopfbruststück */
      ell(c, 2.4, by + 0.2, 3.6, 3, k(d.c));
      legsSide(true);
      /* Augen-Häufchen */
      for (let i = 0; i < 4; i++) circ(c, 3.8 + (i % 2) * 1.1, by - 1.2 + Math.floor(i / 2) * 1, i < 2 ? 0.75 : 0.5, k("#ff3030"));
      if (!flashOf(k)) glow(c, 4.4, by - 0.8, big ? 4 : 2.4, "rgba(255,50,40,.55)");
      /* Kieferklauen: zucken, öffnen sich beim Angriff */
      const op = Q.ph ? 0.4 + charge() * 0.5 : 0.15 + Math.sin(t * 6) * 0.08;
      c.save(); c.translate(5.4, by + 1.4); c.rotate(op); poly(c, [0, -0.6, 2.4, 0.4, 1.8, 2.2, 0.6, 0.8], k("#e8d8b0")); c.restore();
      c.save(); c.translate(5, by + 1.8); c.rotate(-op * 0.5); poly(c, [0, -0.4, 2, 1.2, 0.6, 2, -0.2, 0.6], k(shade("#e8d8b0"))); c.restore();
      /* Netz-Spinndrüse beim Netzschuss */
      if ((Q.kind === "web" || Q.kind === "shoot") && Q.ph === "pre") { circ(c, -9.6, by, 1 + cr, k("#e8e4ec")); }
    },
    ettercap(c, e, d, k, t, mv, ph, ak) {
      const cr = Q.ph === "pre" ? eo(Q.pre) : 0;
      const bob = mv ? Math.abs(Math.sin(ph)) * 0.8 : Math.sin(t * 2) * 0.3;
      legs(c, k, { hy: -9 + cr, len: 9.4, mv, ph, stride: 3, lift: 1.8, w: 2, colB: shade(d.c), colF: d.c, footB: "#2a1e2a", footF: "#3a2a3a", toe: 2.4, bend: -1 });
      /* Hinterleib (Spinndrüsen) und gebückter Rumpf */
      ell(c, -3.6, -10.4 - bob + cr, 3.6, 4.4, k(shade(d.c, 1.15)));
      for (let i = 0; i < 3; i++) limb(c, -5.6, -12 + i * 1.6 - bob + cr, -7, -12.6 + i * 1.8 - bob + cr, 0.5, k(d.t));
      ell(c, 0, -14 - bob + cr, 4.6, 5.6, k(d.c));
      ell(c, 0.8, -13 - bob + cr, 2.6, 3.8, k("#6a5a6a"));
      for (let i = 0; i < 3; i++) limb(c, -1, -16 + i * 2 - bob + cr, 2.4, -15.6 + i * 2 - bob + cr, 0.4, k("#3a2a3a"));
      /* Kopf: Spinnenaugen und Mandibeln */
      c.save(); c.translate(2.2, -21 - bob + cr); c.rotate(-Q.hurt * 0.4 + cr * 0.15);
      ell(c, 0, 0, 3.6, 3.4, k(d.c));
      for (let i = 0; i < 4; i++) circ(c, 1.4 + (i % 2) * 1.2, -1.4 + Math.floor(i / 2) * 1.1, i < 2 ? 0.7 : 0.5, k("#ff3030"));
      if (!flashOf(k)) glow(c, 2, -1, 2.6, "rgba(255,50,40,.5)");
      const op = Q.ph ? charge() * 0.6 : Math.sin(t * 5) * 0.12;
      c.save(); c.translate(2.6, 2); c.rotate(op); poly(c, [0, -0.6, 3, 0.8, 1.4, 1.8], k(d.t)); c.restore();
      c.save(); c.translate(1.6, 2.2); c.rotate(-op); poly(c, [0, 0, 2.4, 1.6, 0.4, 2], k(shade(d.t))); c.restore();
      c.restore();
      /* lange Arme mit Sichelklauen */
      const pull = Q.kind === "pull";
      const a = pull ? swing(0.7, -2.2, 0) : (Q.alt ? swing(0.6, 1.2, -1.3) : swing(0.6, -2.2, 0.7));
      for (const [sx, off, col] of [[-1.4, 0.4, shade(d.c)], [1.6, 0, d.c]]) {
        const h = hand(sx, -17 - bob + cr, a + off, Q.ph === "act" ? 8.4 : 7);
        const r = arm(c, k, sx, -17 - bob + cr, h[0], h[1], 4.2, 4.2, 1.5, col);
        c.save(); c.translate(r[0], r[1]); c.rotate(a + off + 1); poly(c, [0, -0.8, 4, -0.2, 5, 2, 0.4, 0.8], k(d.t)); c.restore();
      }
    },
    /* ---------- Geister: Schatten, Schmiedegeist, Wraith ---------- */
    wraith(c, e, d, k, t, mv, ph, ak) {
      const fire = d.t === "#ff8a2a";
      const gl = fire ? "rgba(255,120,40,.35)" : "rgba(140,90,255,.35)";
      const boss = !!d.boss;
      c.save(); c.globalAlpha *= 0.88;
      const fl = Math.sin(t * 4) * 2;
      const cr = Q.ph === "pre" ? eo(Q.pre) : 0;
      glow(c, 0, -14, 20 + cr * 6, gl);
      /* zerfetzte Robe, Saum flattert in Fetzen */
      c.fillStyle = k(d.c); c.beginPath(); c.moveTo(-5, -20); c.quadraticCurveTo(-8 - cr, -8, -6.4 + fl, 1);
      for (let i = 0; i <= 5; i++) { const x = lp(-6.4 + fl, 6 - fl, i / 5); c.lineTo(x, (i % 2 ? -2.4 : 2.4) + Math.sin(t * 6 + i * 1.3) * 1.2); }
      c.quadraticCurveTo(8 + cr, -8, 5, -20); c.closePath(); c.fill();
      c.fillStyle = k(shade(d.c, 0.6)); c.beginPath(); c.moveTo(-1, -19); c.quadraticCurveTo(-2.6, -9, -1.6 + fl * 0.5, -1); c.lineTo(0.2 + fl * 0.4, -3); c.quadraticCurveTo(-0.6, -10, 0.6, -19); c.fill();
      /* Glutfunken / Schattenschleier unter dem Saum */
      if (Math.random() < 0.2 && !e.dead) Z.fx.p({ x: e.x + e.w / 2 + (Math.random() - 0.5) * 10, y: e.y + e.h - 2, vx: 0, vy: fire ? -30 : 10, life: 0.6, size: 1.6, col: fire ? "#ff8a2a" : "#6a4aa0", kind: fire ? "glow" : "smoke", add: fire });
      /* Kapuze und Gesicht: Dunkelheit mit Augen */
      c.save(); c.translate(0.5, -22); c.rotate(-Q.hurt * 0.4 + (Q.ph === "pre" ? -0.2 * cr : Q.ph === "act" ? 0.15 : 0));
      poly(c, [-4.6, 3, -5, -2, -2.6, -5.6, 1.6, -6, 4.6, -3, 5, 1, 3.6, 3.6], k(d.c));
      ell(c, 1.6, -0.4, 2.8, 3.2, k("#05030a"));
      c.fillStyle = k(d.t); c.fillRect(2, -1.4, 1.5, 1.1 + cr * 0.6); c.fillRect(-0.4, -1.4, 1.2, 1.1 + cr * 0.6);
      glow(c, 1.6, -0.9, 4 + cr * 3, fire ? "rgba(255,140,40,.8)" : "rgba(170,120,255,.8)");
      if (Q.ph === "act" || (boss && Q.mv === "schrei" && Q.ph)) ell(c, 1.8, 1.6, 1, 1.4, k(d.t));
      if (boss) poly(c, [-3.8, -4.4, -3, -7.6, -1.6, -5.4, 0, -8.6, 1.4, -5.6, 3, -7.4, 3.4, -4.6], k("#4a3a5a"));
      c.restore();
      /* Klauenhände: greifen beim Ausholen weit aus */
      const aa = Q.kind === "shoot" || Q.kind === "dive" || Q.kind === "spray" ? swing(-0.2, -1.4, 0.2) : swing(-0.2, -1.6, 0.4);
      for (const s of [1, -0.6]) {
        const ex = s * 7 + (s > 0 && Q.ph === "act" ? 3 : 0), ey = -14 + aa * 4;
        c.strokeStyle = k(d.c); c.lineWidth = 2; c.lineCap = "round"; c.beginPath(); c.moveTo(s * 3, -17); c.quadraticCurveTo(s * 6, -16 + aa * 2, ex, ey); c.stroke();
        for (let f = -1; f <= 1; f++) limb(c, ex, ey, ex + s * 3, ey + f * 1.6 + 0.6, 0.6, k(d.t));
      }
      if (fire && Q.kind === "spray" && Q.ph === "act") glow(c, 10, -12, 9, "rgba(255,150,40,.8)");
      c.restore();
    },
    sac(c, e, d, k, t) {
      const p = 1 + Math.sin(t * 3) * 0.06 + (Q.ph === "pre" ? eo(Q.pre) * 0.15 : 0);
      limb(c, 0, -18, 0, -40, 0.6, "rgba(230,230,240,.5)");
      for (let i = 0; i < 4; i++) limb(c, 0, -17, -6 + i * 4, -22 - (i % 2) * 2, 0.4, "rgba(230,230,240,.35)");
      ell(c, 0, -9, 7 * p, 9 * p, k(d.c)); ell(c, 1, -8, 4.6 * p, 6.4 * p, k(d.t));
      c.strokeStyle = k("rgba(255,255,255,.35)"); c.lineWidth = 0.5; for (let i = 0; i < 4; i++) { c.beginPath(); c.ellipse(0, -9, 7 * p - i * 0.4, 9 * p, 0, -1.2 + i * 0.7, -0.6 + i * 0.7); c.stroke(); }
      /* zappelnde Spinnenjunge im Inneren */
      for (let i = 0; i < 4; i++) { const x = -2.4 + i * 1.6 + Math.sin(t * 5 + i) * 0.8, y = -10 + Math.sin(t * 4 + i * 2) * 2.2; circ(c, x, y, 1, k("#3a2a20")); limb(c, x - 1, y, x + 1, y, 0.3, k("#3a2a20")); }
      ell(c, -2.6, -12, 1.6, 2.6, k("rgba(255,255,255,.3)"), 0.3);
    },
    wisp(c, e, d, k, t) {
      const cr = Q.ph === "pre" ? eo(Q.pre) : 0;
      const r = 4 + Math.sin(t * 8) * 0.8 + cr * 1.5;
      glow(c, 0, -6, 14 + cr * 6, "rgba(255,170,60,.7)");
      /* rotierender Runenring */
      c.save(); c.translate(0, -6); c.rotate(t * 1.5);
      c.strokeStyle = k("rgba(255,200,110,.7)"); c.lineWidth = 0.6; c.beginPath(); c.arc(0, 0, 7.4, 0, TAU); c.stroke();
      for (let i = 0; i < 6; i++) { c.save(); c.rotate(i * PI / 3); limb(c, 7.4, -1, 7.4, 1, 0.6, k(d.t)); limb(c, 6.6, 0, 8.2, -0.8, 0.5, k(d.t)); c.restore(); }
      c.restore();
      circ(c, 0, -6, r, k(d.c)); circ(c, 0, -6, r * 0.5, k(d.t));
      for (let i = 0; i < 3; i++) { const a = t * 3 + i * 2.1; circ(c, Math.cos(a) * 9, -6 + Math.sin(a) * 4, 1, k(d.t)); }
    },
    duergar(c, e, d, k, t, mv, ph, ak) {
      const bob = mv ? Math.abs(Math.sin(ph)) : Math.sin(t * 2) * 0.3;
      const cr = Q.ph === "pre" ? eo(Q.pre) * 1.2 : 0;
      const hy = -7 + cr;
      legs(c, k, { hy, len: 7.2, mv, ph, stride: 2.4, lift: 1.4, w: 3.2, colB: "#22201f", colF: "#2e2a2a", footB: "#1a1414", footF: "#2a2020", toe: 2.6, knee: "#5a5a62" });
      /* gedrungener Rumpf mit Platten und Gürtel */
      const ty = -bob + cr * 0.8;
      poly(c, [-5.6, hy + 1 + ty, 5.6, hy + 1 + ty, 6.2, -15 + ty, -6.2, -15 + ty], k(d.c));
      poly(c, [-5.6, hy + 1 + ty, -2, hy + 1 + ty, -2.4, -15 + ty, -6.2, -15 + ty], k(shade(d.c)));
      poly(c, [-1.6, -14 + ty, 4.6, -14 + ty, 4.8, hy - 1 + ty, -1.4, hy - 1 + ty], k("#5a5a62"));
      for (let i = 0; i < 3; i++) limb(c, -1.2, -12 + i * 2 + ty, 4.4, -12 + i * 2 + ty, 0.4, k("#3a3a40"));
      limb(c, -5.4, hy - 0.4 + ty, 5.6, hy - 0.4 + ty, 1.4, k("#3a2a1a")); poly(c, [1.4, hy - 1.6 + ty, 3.6, hy - 1.6 + ty, 3.6, hy + 0.8 + ty, 1.4, hy + 0.8 + ty], k(d.t));
      ell(c, -4.6, -14.6 + ty, 3, 1.8, k("#4a4a52")); ell(c, 4.6, -14.6 + ty, 3, 1.8, k("#5a5a62"));
      /* Kopf: graue Haut, langer geflochtener Bart, Helm mit Kamm */
      c.save(); c.translate(0.6, -17.6 + ty); c.rotate(-Q.hurt * 0.35);
      ell(c, 0, 0, 3.6, 3.4, k(d.skin));
      poly(c, [-1.8, 1, 4.2, 0.6, 3.6, 5, 1.6, 8.6, 0.4, 5.4, -1.2, 3.4], k("#d8d8de"));
      limb(c, 1.6, 4, 1.6, 8, 0.5, k("#a8a8b0")); circ(c, 1.6, 8.4, 0.7, k("#8a6a3a"));
      poly(c, [-3.8, -0.4, -3.4, -3.8, 0, -4.8, 3.8, -4.2, 4.6, -0.8], k("#5a5a62"));
      poly(c, [-2.6, -4.4, 2, -6.6, 3.4, -4.2], k("#4a4a52"));
      limb(c, -4.4, -0.4, 5, -0.6, 1, k("#6a6a72"));
      c.fillStyle = k("#ff4a2a"); c.fillRect(2, -1.6, 1.4, 1); if (!flashOf(k)) glow(c, 2.7, -1.1, 2.4, "rgba(255,80,40,.6)");
      limb(c, 1.4, -2.4, 3.6, -2, 0.6, k("#3a3a40"));
      c.restore();
      /* Waffe */
      const sx = 2.4, sy = -13.6 + ty;
      if (d.xbow) {
        const rc = Q.ph === "act" ? Math.sin(Q.act * PI) : 0;
        const h = hand(sx, sy, -0.05 - rc * 0.4, 5.6 - rc);
        arm(c, k, sx - 3, sy + 0.4, h[0] - 3, h[1] + 0.6, 3.4, 3.4, 2.2, shade(d.c));
        const f = arm(c, k, sx, sy, h[0], h[1], 3.4, 3.4, 2.3, d.c);
        c.save(); c.translate(f[0], f[1]); c.rotate(-0.05 - rc * 0.4); weapon(c, "xbow", d.t, t, Q.ph === "post" ? 1 : 0); c.restore();
        return;
      }
      const a = swing(0.8, -2.5, 0.7) + shake(0.08);
      const h = hand(sx, sy, a, Q.ph === "act" ? 6.6 : 5.8);
      const back = [h[0] - Math.cos(a) * 2.6, h[1] - Math.sin(a) * 2.6];
      arm(c, k, sx - 3.6, sy + 0.4, back[0], back[1], 3.4, 3.4, 2.2, shade(d.c));
      const f = arm(c, k, sx, sy, h[0], h[1], 3.4, 3.4, 2.4, d.c);
      c.save(); c.translate(f[0], f[1]); c.rotate(a - 0.4); weapon(c, "axe", d.t, t); c.restore();
      circ(c, f[0], f[1], 1.2, k(d.skin));
    },
    blight(c, e, d, k, t, mv, ph, ak) {
      const vine = !!d.vine, needle = !!d.needle;
      const cr = Q.ph === "pre" ? eo(Q.pre) : 0;
      const sway = Math.sin(t * 1.8) * 0.06;
      c.rotate(sway);
      const l1 = mv ? Math.sin(ph) * 3 : 0;
      /* Wurzelbeine */
      for (const [x, s2, col] of [[-1, -1, shade(d.c)], [1, 1, d.c]]) {
        const fx = x * 2 + l1 * s2, fy = mv ? -Math.max(0, Math.cos(ph + (s2 > 0 ? 0 : PI))) * 1.6 : 0;
        line(c, [x, -9 + cr, x + s2 * 0.6 + l1 * s2 * 0.4, -4.6 + cr * 0.5, fx, fy], 1.7, k(col));
        limb(c, fx, fy, fx + 1.6, fy + 0.2, 0.6, k(col)); limb(c, fx, fy, fx - 1.2, fy + 0.3, 0.5, k(col));
      }
      /* knorriger Stamm */
      line(c, [0, -9 + cr, -0.6, -13 + cr, 0.6, -19 + cr], 2.8, k(d.c));
      limb(c, -1, -12 + cr, 0, -15 + cr, 0.5, k(shade(d.c)));
      if (needle) for (let i = 0; i < 6; i++) { const a = -PI / 2 + (i - 2.5) * 0.45, y0 = -12 - (i % 3) * 2.4 + cr; limb(c, Math.cos(a) * 1.4, y0, Math.cos(a) * 4.2 + (i % 2 ? 1 : -1), y0 + Math.sin(a) * 1.6 - 1, 0.5, k("#a8b070")); }
      /* Krone aus Zweigen */
      for (let i = 0; i < 5; i++) { const a = -PI / 2 + (i - 2) * 0.48 + Math.sin(t * 2 + i) * 0.05; const x2 = 0.6 + Math.cos(a) * 5.6, y2 = -19 + cr + Math.sin(a) * 5.6; limb(c, 0.6, -19 + cr, x2, y2, 1, k(d.c)); limb(c, x2, y2, x2 + Math.cos(a - 0.6) * 2, y2 + Math.sin(a - 0.6) * 2, 0.5, k(d.c)); if (i % 2 === 0) ell(c, x2, y2, 1.2, 0.7, k(vine ? "#4a7a2a" : "#5a6a2a"), a); }
      /* rotes Auge in einer Astgabel */
      c.fillStyle = k(d.t); c.fillRect(1.4, -18.2 + cr, 1.3, 1.2 + cr * 0.4); glow(c, 2, -17.6 + cr, 3 + cr * 2, "rgba(255,50,40,.6)");
      /* Astarme */
      const a = needle && Q.kind === "shoot" ? swing(0.2, -1.6, 0.0) : Q.alt ? swing(0.1, 1.1, -1.2) : swing(0.1, -1.8, 0.6);
      const ex = 0.5 + Math.cos(a) * 5, ey = -15 + cr + Math.sin(a) * 5;
      line(c, [0.5, -15 + cr, ex, ey, ex + Math.cos(a - 0.5) * 3.4, ey + Math.sin(a - 0.5) * 3.4], 1.2, k(d.c));
      for (let f = -1; f <= 1; f++) limb(c, ex + Math.cos(a - 0.5) * 3.4, ey + Math.sin(a - 0.5) * 3.4, ex + Math.cos(a - 0.5 + f * 0.5) * 5.2, ey + Math.sin(a - 0.5 + f * 0.5) * 5.2, 0.5, k(d.c));
      line(c, [0, -14 + cr, -3, -11.6 + cr + Math.sin(t * 2) * 0.5, -4.6, -9 + cr], 1, k(shade(d.c)));
      if (vine) for (let i = 0; i < 4; i++) { c.strokeStyle = k("#4a7a2a"); c.lineWidth = 1; c.beginPath(); c.moveTo(0, -12 - i * 3 + cr); c.quadraticCurveTo(6 + Math.sin(t * 2 + i) * 3 + (Q.kind === "pull" ? charge() * 5 : 0), -14 - i * 3, 9 + (Q.kind === "pull" && Q.ph === "act" ? 6 : 0), -10 - i * 3); c.stroke(); circ(c, 9 + (Q.kind === "pull" && Q.ph === "act" ? 6 : 0), -10 - i * 3, 0.7, k("#7aaa3a")); }
    },

    /* ---------- Bosse ---------- */
    bugbear(c, e, d, k, t, mv, ph, ak) {
      const bob = mv ? Math.abs(Math.sin(ph)) * 1.5 : Math.sin(t * 2) * 0.5;
      const m = Q.mv, cr = Q.ph === "pre" ? eo(Q.pre) : 0;
      const charging = m === "sturm" && Q.ph === "act";
      if (charging) c.rotate(0.28);
      const hy = -11 + cr * 1.6;
      legs(c, k, { hy, len: 11.4, mv: mv || charging, ph: charging ? Q.time * 14 : ph, stride: 4, lift: 2.4, w: 4.4, colB: "#3a2418", colF: "#4a3020", footB: "#2a1a10", footF: "#3a2418", toe: 3.4, bend: 1 });
      const ty = -bob + cr * 1.2;
      /* Fellumhang hinten */
      poly(c, [-6, -26 + ty, -10 + Math.sin(t * 2) * 0.6, -12 + ty, -7, -10 + ty, -4, -24 + ty], k("#5a3a1a"));
      /* massiger Leib mit Fellbrust und Lederriemen */
      ell(c, 0, -17 + ty, 8, 9, k(d.c));
      ell(c, 1.4, -15.6 + ty, 5, 6, k("#c8a060"));
      for (let i = 0; i < 4; i++) limb(c, -1 + i * 1.6, -19 + ty + i * 0.4, 0 + i * 1.6, -17 + ty + i * 0.4, 0.5, k("#a88040"));
      limb(c, -6, -23 + ty, 6, -10 + ty, 1.6, k("#4a2a14")); for (let i = 0; i < 3; i++) circ(c, -3 + i * 3, -20 + i * 3.4 + ty, 0.8, k("#c8c0b0"));
      ell(c, -5.4, -23.4 + ty, 3.4, 2.4, k("#6a6a72")); poly(c, [-6.4, -25.4 + ty, -5.4, -28.4 + ty, -4.2, -25.6 + ty], k("#9a9aa4"));
      /* Kopf: Bärenschnauze, Hauer, kleine Augen */
      c.save(); c.translate(3, -28 + ty); c.rotate((m === "gebruell" && Q.ph ? -0.4 * charge() : 0) - Q.hurt * 0.3 + (charging ? -0.2 : 0));
      ell(c, 0, 0, 5, 4.6, k(d.c));
      ell(c, -1.4, -0.6, 3.6, 3.4, k(shade(d.c)));
      poly(c, [-3.4, -3.4, -3.6, -7.4, -1, -4.2], k(d.t)); poly(c, [1.6, -4, 3.4, -7.6, 4, -3.2], k(d.t));
      poly(c, [-2.6, -3.6, -2.8, -6, -1.6, -4], k("#c88a7a"));
      ell(c, 4.6, 1.2, 2.6, 2, k(shade(d.c, 1.2))); circ(c, 6.8, 0.6, 1, k("#1a1010"));
      const roar = (m === "gebruell" || m === "morgenstern") && Q.ph ? charge() : Q.ph ? 0.4 : 0.1;
      poly(c, [2.4, 2.4, 6.4, 2.4, 5.6, 3 + roar * 3, 2.8, 3.4 + roar * 2], k("#3a1010"));
      poly(c, [5, 2.6, 6, 0.4, 5.8, 2.8], k("#f0f0e0")); poly(c, [3, 2.8, 3.6, 1, 3.8, 2.8], k("#f0f0e0"));
      c.fillStyle = k("#ffe04a"); c.fillRect(2.2, -1.6, 1.6, 1.1); glow(c, 3, -1.1, 3, "rgba(255,220,80,.6)");
      limb(c, 1.2, -2.6, 4.2, -2, 0.7, k(shade(d.c, 0.7)));
      c.restore();
      /* Morgenstern an der Kette / Krallenhieb */
      const sx = 5, sy = -23 + ty;
      let a = m === "morgenstern" ? swing(0.4, -2.7, 0.9) + shake(0.08) : m === "hieb" ? (Q.ph === "act" ? -1.4 + Math.sin(Q.actLong * PI * 3) * 1.6 : swing(0.4, -1.6, 0.6)) : charging ? -0.2 : 0.4 + Math.sin(t * 2) * 0.05;
      const h = hand(sx, sy, a, Q.ph === "act" ? 9 : 7.6);
      arm(c, k, sx - 9, sy + 1, m === "hieb" && Q.ph ? sx + 3 : sx - 10, m === "hieb" && Q.ph ? sy + 2 : sy + 8, 5, 5, 3.4, shade(d.c), shade(d.c));
      const f = arm(c, k, sx, sy, h[0], h[1], 5, 5, 3.6, d.c, d.c);
      if (m === "hieb") { for (let i = -1; i <= 1; i++) limb(c, f[0], f[1], f[0] + Math.cos(a + i * 0.4) * 3.6, f[1] + Math.sin(a + i * 0.4) * 3.6, 0.8, k("#f0e8d8")); }
      else {
        c.save(); c.translate(f[0], f[1]); c.rotate(a - 0.5);
        limb(c, -3, 0, 20, 0, 2.4, k("#5a4030")); limb(c, -3, 0, 2, 0, 2.8, k("#2a1a10"));
        circ(c, 23, 0, 5, k("#5a5a62")); circ(c, 22, -1.4, 2.6, k("#7a7a84"));
        for (let i = 0; i < 8; i++) { const aa = i / 8 * TAU; poly(c, [23 + Math.cos(aa) * 4, Math.sin(aa) * 4, 23 + Math.cos(aa + 0.2) * 8.4, Math.sin(aa + 0.2) * 8.4, 23 + Math.cos(aa + 0.45) * 4, Math.sin(aa + 0.45) * 4], k("#8a8a94")); }
        c.restore();
      }
      circ(c, f[0], f[1], 2, k(d.c));
    },
    druidin(c, e, d, k, t, mv, ph, ak) {
      if (e.revealed) {
        /* wahre Gestalt: Drow-Klingentänzerin mit zwei Krummsäbeln */
        SHAPES.human(c, e, { c: "#1a1420", t: "#3a2a4a", skin: "#3a2e4e", hair: "#f0f0ff", scim: 1 }, k, t, mv, ph, ak);
        const spin = Q.mv === "klingensturm" && Q.ph === "act" ? Q.time * 20 : 0;
        c.save(); c.translate(-2, -16); c.rotate(spin || swing(0.6, -1.8, 1.2) + 0.4); weapon(c, "scimitar", "#b080ff", t); c.restore();
        if (Q.mv === "schattensprung" || Q.mv === "dunkelheit") glow(c, 0, -12, 18, "rgba(150,90,255," + (0.4 * charge()).toFixed(2) + ")");
        return;
      }
      /* Tarngestalt: Druidin in Grün mit Geweihkranz und Rankenstab */
      const bob = Math.sin(t * 2) * 0.4;
      const cast = Q.ph ? charge() : 0;
      const fl = Math.sin(t * 2.4) * 0.6;
      poly(c, [-5, 0, 5.4, 0, 4, -18 - bob, -4, -18 - bob], k(d.c));
      poly(c, [-5, 0, -1, 0, -1.4, -18 - bob, -4, -18 - bob], k(shade(d.c)));
      for (let i = 0; i < 5; i++) poly(c, [-5 + i * 2.2, 0, -4 + i * 2.2, -3 - (i % 2), -3 + i * 2.2, 0], k("#4a7a3a"));
      poly(c, [-4.5, -10, 4.5, -10, 4, -18 - bob, -4, -18 - bob], k("#4a7a3a"));
      limb(c, -4, -10.6, 4.2, -10.6, 1, k("#8a5a2a")); circ(c, 2, -10.6, 0.9, k(d.t));
      /* Blätterumhang */
      for (let i = 0; i < 4; i++) ell(c, -4.6 + fl * 0.3, -16 + i * 3.4 - bob, 1.8, 1, k(i % 2 ? "#5a8a3a" : "#3a6a2a"), 0.6);
      c.save(); c.translate(0.5, -21 - bob);
      ell(c, 0, 0, 3.2, 3.4, k(d.skin));
      poly(c, [-3.8, 1.4, -3, -3.6, 1.6, -4, 3.6, -1.8, 0, -2.6, -2, 3.6], k("#c8c0c0"));
      c.fillStyle = k("#3a6a2a"); c.fillRect(1.8, -0.8, 1.1, 0.9);
      c.strokeStyle = k("#6a4a2a"); c.lineWidth = 0.8; c.beginPath(); c.moveTo(-2, -3); c.lineTo(-5, -7); c.lineTo(-7, -7.6); c.moveTo(-4.2, -6); c.lineTo(-4.6, -8.6); c.moveTo(2, -3.4); c.lineTo(4, -7.6); c.lineTo(6.4, -8); c.moveTo(3.4, -6.4); c.lineTo(3.2, -9); c.stroke();
      c.restore();
      const a = swing(0.6, -1.5, -0.4);
      const h = hand(1, -17 - bob, a, 6);
      arm(c, k, -1.6, -17 - bob, Q.ph ? 4 : -2.4, Q.ph ? -21 - bob : -10, 4, 3.6, 2, shade(d.c));
      const f = arm(c, k, 1, -17 - bob, h[0], h[1], 4, 3.6, 2.2, d.c);
      c.save(); c.translate(f[0], f[1]); c.rotate(swing(-1.35, -1.6, -0.8)); weapon(c, "staff", "#9ad04a", t);
      for (let i = 0; i < 3; i++) { c.strokeStyle = k("#4a7a2a"); c.lineWidth = 0.6; c.beginPath(); c.moveTo(-6 + i * 6, 0); c.quadraticCurveTo(-4 + i * 6, -2.4, -2 + i * 6, 0); c.stroke(); }
      c.restore();
      if (cast > 0.1) glow(c, f[0] + 3, f[1] - 8, 10 * cast, "rgba(160,230,90,.6)");
    },
    giant(c, e, d, k, t, mv, ph, ak) {
      const bob = mv ? Math.abs(Math.sin(ph * 0.5)) * 1.5 : Math.sin(t * 1.5) * 0.6;
      const m = Q.mv, cr = Q.ph === "pre" ? eo(Q.pre) : 0;
      const stomp = m === "stampfen", rock = m === "felswurf", punch = m === "fausthieb", quake = m === "erdbeben";
      const hy = -12 + (quake || punch ? cr * 2 : 0);
      /* Beine; beim Stampfen hebt sich das vordere Bein */
      const lift = stomp ? (Q.ph === "pre" ? eo(Q.pre) * 7 : Q.ph === "act" ? 0 : 0) : 0;
      const l1 = mv ? Math.sin(ph * 0.5) * 4 : 0;
      limb(c, -4, hy, -4 - l1, 0, 6, k("#4a3a34")); ell(c, -3 - l1, -0.6, 4, 1.8, k("#3a2a24"));
      limb(c, 4, hy, 5 + l1 + lift * 0.3, -lift, 6.4, k("#5a4a44")); ell(c, 6 + l1 + lift * 0.3, -0.6 - lift, 4.2, 1.9, k("#4a3a34"));
      /* Lendenschurz aus Fellen mit Gürtelseil */
      poly(c, [-8, -11, 8, -11, 9, -16, -9, -16], k("#6a4a2a"));
      poly(c, [-6, -11, -2, -11, -3, -6, -6.4, -7], k("#5a3a1a")); poly(c, [1, -11, 6, -11, 5, -6.6, 2, -7.4], k("#7a5a3a"));
      limb(c, -9, -15.6, 9, -15.6, 1.4, k("#8a6a3a"));
      /* Rumpf */
      const ty = -bob + (quake || punch ? cr * 2 : 0);
      ell(c, 0, -22 + ty, 9.4, 8.4, k(d.c));
      ell(c, 2, -20 + ty, 5.4, 5.2, k("#9a8a80"));
      limb(c, -4, -24 + ty, 2, -21 + ty, 0.6, k("#6a5a50")); limb(c, -6, -18 + ty, -2, -16 + ty, 0.6, k("#6a5a50"));
      /* Schädelkette */
      for (let i = -2; i <= 2; i++) { circ(c, i * 2.6 + 1, -27.4 + ty + Math.abs(i) * 0.7, 1.5, k("#e8e0d0")); c.fillStyle = k("#2a1a14"); c.fillRect(i * 2.6 + 1.2, -27.8 + ty + Math.abs(i) * 0.7, 0.6, 0.6); }
      /* Kopf: kleiner Schädel, Unterbiss, wütende Augen */
      const roar = Q.ph && (stomp || quake) ? charge() : 0.2;
      c.save(); c.translate(1.5, -32.6 + ty); c.rotate(-Q.hurt * 0.3 + (quake && Q.ph === "pre" ? -0.3 * cr : 0));
      ell(c, 0, 0, 5.6, 5.4, k(d.c));
      ell(c, -1.6, -0.6, 3.4, 4, k(shade(d.c)));
      poly(c, [-3.6, -4, -1, -6.4, 3, -6, 5, -3.6, 1, -4.6], k("#4a3a2a"));
      limb(c, 1.6, -2.6, 5, -1.4, 1, k(shade(d.c, 0.6)));
      c.fillStyle = k("#f0f0e0"); c.fillRect(2.6, -1.6, 2.4, 1.8); c.fillStyle = k("#2a1010"); c.fillRect(3.8, -1.2, 1, 1);
      poly(c, [1, 2.4, 5.6, 2, 5.4, 3 + roar * 2.6, 1.4, 3.4 + roar], k("#3a1010"));
      poly(c, [2, 3.4 + roar, 2.6, 1.6 + roar * 0.6, 3.2, 3.4 + roar], k("#f0f0e0")); poly(c, [4.2, 3.2 + roar, 4.8, 1.4 + roar * 0.6, 5.2, 3 + roar], k("#f0f0e0"));
      circ(c, -5, 1, 1.4, k("#e5b454"));
      c.restore();
      /* Arme */
      const sxF = 6, syF = -26 + ty;
      let aF, aB;
      if (rock) { aF = swing(1.2, -2.3, -0.2); aB = swing(1.5, -2.1, 0.2); }
      else if (punch) { aF = swing(0.6, 2.4, 0.05) + shake(0.06); aB = 1.5; }
      else if (quake) { aF = swing(1.2, -1.9, 1.3) + shake(0.06); aB = aF + 0.2; }
      else if (stomp) { aF = lp(0.6, -0.4, charge()); aB = lp(1.6, 2.4, charge()); }
      else { aF = 0.6 + Math.sin(t * 1.5) * 0.05; aB = 1.6; }
      const rF = punch && Q.ph === "act" ? 14 : 11, rB = 10;
      const hB = hand(-6, syF, aB, rB);
      const b = arm(c, k, -6, syF, hB[0], hB[1], 6, 6, 4.8, shade(d.c), shade(d.c));
      circ(c, b[0], b[1], 4, k("#6a5a52"));
      const hF = hand(sxF, syF, aF, rF);
      const f = arm(c, k, sxF, syF, hF[0], hF[1], 6, 6, 5.2, d.c, d.c);
      circ(c, f[0], f[1], 4.6, k("#7a6a62")); limb(c, f[0] + 1, f[1] - 2.4, f[0] + 3.6, f[1] - 1, 0.6, k("#5a4a44"));
      if (rock && Q.ph === "pre") { const rx = (f[0] + b[0]) / 2, ry = Math.min(f[1], b[1]) - 5; ell(c, rx, ry, 8, 6.4, k("#6a6058")); ell(c, rx - 2, ry - 2, 4, 2.6, k("#8a8070")); limb(c, rx - 4, ry + 1, rx + 2, ry + 3, 0.6, k("#4a4038")); }
      if (e.sleep) { c.font = "700 8px sans-serif"; c.fillStyle = "#e8e0d0"; c.fillText("z", 6, -42 + Math.sin(t * 2) * 3); c.fillText("Z", 10, -48 + Math.sin(t * 2 + 1) * 3); }
    },
    wasp(c, e, d, k, t, mv, ph, ak) {
      const m = Q.mv, cr = Q.ph === "pre" ? eo(Q.pre) : 0;
      const sting = (m === "stich" || m === "doppelstich") && Q.ph;
      const fl = Math.sin(t * 40) * 6;
      if (sting) c.rotate(Q.ph === "act" ? 0.35 : -0.25 * cr);
      /* Flügel (durchscheinend) */
      c.save(); c.globalAlpha *= 0.5; ell(c, -2, -15 - fl * 0.3, 10, 3.2, k("#e8e0d0"), -0.5); ell(c, 2, -15 + fl * 0.3, 10, 3.2, k("#e8e0d0"), 0.5);
      c.strokeStyle = k("rgba(60,40,30,.5)"); c.lineWidth = 0.4; c.beginPath(); c.moveTo(-6, -18); c.lineTo(4, -12); c.moveTo(-2, -19); c.lineTo(6, -14); c.stroke(); c.restore();
      /* Hinterleib mit Ringen und Stachel; krümmt sich beim Stechen nach vorn */
      const curl = sting ? charge() : 0;
      c.save(); c.translate(-3, -7); c.rotate(-curl * 0.9);
      ell(c, -5, 1, 7.4, 4.6, k(d.c)); for (let i = 0; i < 4; i++) limb(c, -10 + i * 3, -2.6, -10 + i * 3, 4.6, 1, k(d.t));
      poly(c, [-11.6, 0, -18, 1.6 + (sting ? 0 : 1.6), -11.6, 2.4], k("#e0d0a0")); if (sting) glow(c, -16, 1.6, 4, "rgba(255,220,120,.6)");
      c.restore();
      /* Brust, Kopf mit Facettenaugen und Fühlern */
      ell(c, 2, -7, 4.4, 3.8, k(d.c)); ell(c, 2.6, -8, 2.6, 2, k(shade(d.c, 1.4)));
      c.save(); c.translate(7, -8.4); c.rotate(-Q.hurt * 0.4);
      circ(c, 0, 0, 3.6, k(d.c)); ell(c, 1.6, -0.6, 2.2, 2.8, k(d.t)); glow(c, 1.6, -0.6, 6, "rgba(255,60,40,.6)");
      for (let i = 0; i < 3; i++) circ(c, 1 + (i % 2) * 1.2, -1.6 + i * 0.9, 0.35, k("#ffb0a0"));
      limb(c, 0.4, -3, 3, -7 + Math.sin(t * 7) * 0.8, 0.5, k("#1a1a1a")); limb(c, -0.6, -3.2, 0.6, -7.4 + Math.sin(t * 7 + 1) * 0.8, 0.5, k("#1a1a1a"));
      const op = Q.ph ? 0.4 + charge() * 0.4 : Math.sin(t * 8) * 0.15;
      c.save(); c.translate(3, 1.6); c.rotate(op); poly(c, [0, -0.6, 3.6, 0.6, 0.6, 1.2], k("#2a1a1a")); c.restore();
      c.save(); c.translate(3, 1.8); c.rotate(-op); poly(c, [0, 0, 3.2, 1.8, 0.4, 1.4], k("#3a2a2a")); c.restore();
      c.restore();
      for (let i = 0; i < 3; i++) { const a = Math.sin(t * 6 + i) * 0.3; line(c, [1 + i * 2, -5, i * 2.6 - 0.6, -1 + a * 2, i * 3 + 0.4, 2], 0.8, k(d.c)); }
    },
    vulture(c, e, d, k, t, mv, ph, ak) {
      const m = Q.mv, cr = Q.ph === "pre" ? eo(Q.pre) : 0;
      const dive = m === "sturzflug" && Q.ph === "act";
      const scream = m === "schrei" && Q.ph;
      const fl = dive ? -10 : m === "federn" && Q.ph === "act" ? 12 : Math.sin(t * 9) * 8;
      if (dive) c.rotate(0.6); else if (m === "sturzflug" && Q.ph === "pre") c.rotate(-0.3 * cr);
      /* hinterer Flügel mit Schwungfedern */
      const wing = (sgn, col, col2, f) => {
        poly(c, [sgn * 2, -16, sgn * 18, -26 + f, sgn * 24, -14 + f, sgn * 14, -10, sgn * 4, -10], k(col));
        for (let i = 0; i < 5; i++) poly(c, [sgn * (13 + i * 2.4), -12 + f * (0.4 + i * 0.12), sgn * (16 + i * 2.6), -6 + f * (0.3 + i * 0.12) + i, sgn * (14 + i * 2.4), -9 + f * (0.4 + i * 0.12)], k(col2));
      };
      wing(-1, d.c, shade(d.c, 0.75), fl);
      /* Fänge */
      const talon = dive ? 1 : 0;
      for (const [x, col] of [[-2, "#6a5a40"], [2, "#8a7a60"]]) { const tx = x + talon * 5, ty = 2 - talon * 2; limb(c, x, -3, tx, ty, 1.6, k(col)); for (let i = -1; i <= 1; i++) limb(c, tx, ty, tx + 1.8, ty + 0.8 + i * 0.8, 0.6, k("#2a2018")); }
      ell(c, 0, -10, 6, 8, k(d.c));
      for (let i = 0; i < 3; i++) poly(c, [-4, -8 + i * 3, 0, -5 + i * 3, 4, -8 + i * 3], k(shade(d.c, 1.3)));
      /* Halskrause, nackter Hals, Geierkopf */
      ell(c, 2, -16, 4.6, 2.4, k("#d8d0c0"));
      const nx = scream ? 8 : 6, ny = scream ? -22 : -24;
      limb(c, 2, -16, nx, ny, 2.2, k("#c09070"));
      c.save(); c.translate(nx + 1, ny - 2); c.rotate(scream ? -0.5 * charge() : -Q.hurt * 0.4);
      circ(c, 0, 0, 3.5, k("#c09070")); ell(c, -1, -1, 2, 1.6, k("#a87050"));
      const op = scream ? charge() * 0.6 : Q.ph ? 0.2 : 0;
      c.save(); c.translate(2, -0.6); c.rotate(-op * 0.4); poly(c, [0, -1.2, 5.6, 0.4, 7, 2, 4.6, 1, 0, 0.4], k("#e0d0a0")); c.restore();
      c.save(); c.translate(2, 0.6); c.rotate(op); poly(c, [0, 0, 4.6, 0.6, 0, 1.4], k("#c8b888")); c.restore();
      c.fillStyle = k("#ff3030"); c.fillRect(0.6, -1.4, 1.3, 1.3); glow(c, 1.2, -0.8, 3, "rgba(255,50,40,.6)");
      c.restore();
      if (scream && Q.ph === "act") { c.strokeStyle = "rgba(255,230,200,.5)"; c.lineWidth = 0.8; for (let i = 1; i <= 3; i++) { c.beginPath(); c.arc(nx + 6, ny - 2, i * 3 + (Q.time * 30 % 3), -0.7, 0.7); c.stroke(); } }
      wing(1, "#2a2a24", "#3a3a30", -fl);
    },
    dragon(c, e, d, k, t, mv, ph, ak) {
      const fly = !e.grounded;
      const m = e.mv && e.mv.id;
      const green = d.t === "#a8e050";
      const breath = m === "odem" || m === "giftatem";
      const cr = Q.ph === "pre" ? eo(Q.pre) : 0;
      const fl = fly ? Math.sin(t * 7) * 10 : m === "fluegel" && Q.ph ? (Q.ph === "act" ? -14 : 8 * cr) : Math.sin(t * 1.5) * 2;
      const wingCol = green ? "#2a5a2a" : "#7a1a12", wingMem = green ? "#3a7a3a" : "#c03a20";
      /* Flügel hinten: Knochen und Membran */
      const wingB = () => { poly(c, [-2, -14, -14, -34 + fl, -30, -28 + fl, -24, -22 + fl * 0.4, -20, -18, -12, -12], k(wingCol)); limb(c, -2, -14, -14, -34 + fl, 1.4, k(shade(d.c, 0.7))); limb(c, -14, -34 + fl, -24, -22 + fl * 0.4, 0.8, k(shade(d.c, 0.7))); limb(c, -14, -34 + fl, -30, -28 + fl, 0.8, k(shade(d.c, 0.7))); };
      wingB();
      /* Schwanz mit Stachelkamm */
      const tw = Math.sin(t * 2) * 3, tw2 = Math.sin(t * 2.3) * 4;
      c.strokeStyle = k(d.c); c.lineWidth = 4.6; c.lineCap = "round"; c.beginPath(); c.moveTo(-12, -9); c.quadraticCurveTo(-24, -6 + tw, -32, -12 + tw2); c.stroke();
      c.lineWidth = 2.6; c.beginPath(); c.moveTo(-31, -12 + tw2); c.lineTo(-36, -14 + tw2); c.stroke();
      poly(c, [-35, -17 + tw2, -40, -14 + tw2, -35, -11 + tw2], k(d.t));
      for (let i = 0; i < 4; i++) { const x = -15 - i * 4.4, y = -9 + tw * (i / 4) - 2.2 - i * 0.6; poly(c, [x - 1.4, y, x, y - 3, x + 1.4, y], k(d.t)); }
      /* Beine mit Krallen */
      const legF = (x, back) => {
        const run = mv ? Math.sin(ph * 0.5 + (back ? PI : 0)) * 3 : 0;
        const kx = x + (fly ? -3 : 2), ky = fly ? -4 : -5;
        const fx = x + (fly ? -4 : 1 + run), fy = fly ? -1 : 0;
        limb(c, x, -9, kx, ky, back ? 3.8 : 4.4, k(back ? shade(d.c) : d.c)); limb(c, kx, ky, fx, fy, 3, k(back ? shade(d.c) : d.c));
        for (let i = -1; i <= 1; i++) limb(c, fx, fy, fx + 2.4, fy + 0.4 + i * 0.6, 0.7, k("#e8e0d0"));
      };
      legF(-7, true); legF(5, true);
      /* Körper: Schuppen, heller Bauch, Rückenstacheln */
      const by = cr * (breath ? 1 : 0.5);
      ell(c, 0, -11 + by, 14.4, 7.4, k(d.c));
      ell(c, 2, -7.6 + by, 10.4, 3.6, k(d.belly || d.t));
      for (let i = 0; i < 5; i++) limb(c, -6 + i * 3.4, -9 + by, -5.4 + i * 3.4, -5 + by, 0.6, k(shade(d.belly || d.t, 0.8)));
      for (let i = 0; i < 6; i++) poly(c, [-10 + i * 4, -17 + by, -8 + i * 4, -21.6 + by, -6 + i * 4, -17 + by], k(d.t));
      for (let i = 0; i < 6; i++) for (let j = 0; j < 2; j++) { c.strokeStyle = k(shade(d.c, 0.75)); c.lineWidth = 0.5; c.beginPath(); c.arc(-9 + i * 3.6 + j * 1.8, -14 + j * 2.6 + by, 1.2, 0.3, PI - 0.3); c.stroke(); }
      legF(-5, false); legF(7, false);
      /* Hals und Kopf: holt beim Odem Luft (Hals zurück, Brust glüht), stößt dann vor */
      const hx = 16 + (breath ? (Q.ph === "pre" ? -3 * cr : 2) : m === "klauen" && Q.ph === "act" ? 4 : 0);
      const hy = -19 + (ak < 0 ? -2 : 0) + (breath ? (Q.ph === "pre" ? -3 * cr : 3) : 0);
      c.strokeStyle = k(d.c); c.lineWidth = 6; c.lineCap = "round"; c.beginPath(); c.moveTo(8, -14 + by); c.quadraticCurveTo(13, -14 + (hy + 14) * 0.2, hx - 2, hy + 2); c.stroke();
      for (let i = 0; i < 3; i++) poly(c, [9 + i * 2.6, -18 + (hy + 19) * i * 0.3, 10 + i * 2.6, -21.4 + (hy + 19) * i * 0.3, 11.4 + i * 2.6, -17.6 + (hy + 19) * i * 0.3], k(d.t));
      if (breath && Q.ph === "pre") glow(c, 8, -12, 10 * cr, green ? "rgba(170,230,80,.6)" : "rgba(255,150,40,.7)");
      const jaw = breath ? (Q.ph === "act" ? 1 : Q.ph === "pre" ? cr * 0.4 : 0) : Q.ph ? 0.3 : 0.05;
      c.save(); c.translate(hx, hy); c.rotate(Q.hurt * -0.3 + (breath && Q.ph === "pre" ? -0.2 * cr : 0));
      poly(c, [-4, -3, 6, -3.4, 12, -0.6, 12, 0.6, 6, 0.6, -3, 3], k(d.c));
      c.save(); c.translate(4, 0.6); c.rotate(jaw * 0.45); poly(c, [-6, 0, 7, 0, 7.6, 1.4, -5, 3.2], k(shade(d.c))); for (let i = 0; i < 4; i++) poly(c, [-1 + i * 2.2, 0, -0.4 + i * 2.2, -1.6, 0.2 + i * 2.2, 0], k("#f0f0e0")); c.restore();
      for (let i = 0; i < 4; i++) poly(c, [3 + i * 2.2, 0.6, 3.6 + i * 2.2, 2.4, 4.2 + i * 2.2, 0.6], k("#f0f0e0"));
      limb(c, 1, -2.4, 7, -2.8, 0.7, k(shade(d.c, 0.7)));
      poly(c, [-2, -3, -9, -9, -1, -4], k("#1a1a1a")); poly(c, [1, -3, -4, -10.4, 3, -4], k("#1a1a1a"));
      limb(c, -5, -6.4, -3.4, -6.6, 0.5, k("#3a3a3a"));
      c.fillStyle = k("#ffe04a"); c.fillRect(3, -1.8, 1.8, 1.2); glow(c, 4, -1.2, 4, "rgba(255,220,80,.7)");
      circ(c, 11, -1.4, 0.5, k("#1a1010"));
      if (breath && Q.ph === "act") glow(c, 14, 1, 16, green ? "rgba(170,230,80,.75)" : "rgba(255,160,50,.85)");
      if (Math.random() < 0.05 && !e.dead) Z.fx.p({ x: e.x + e.w / 2 + e.face * (hx + 11) * (e.size || 1), y: e.y + e.h + (hy - 1) * (e.size || 1), vx: e.face * 10, vy: -16, life: 0.8, size: 2, col: green ? "#8aa040" : "#6a5a50", kind: "smoke" });
      c.restore();
      /* Flügel vorne */
      poly(c, [2, -15, 8, -36 - fl, 20, -32 - fl, 17, -24 - fl * 0.4, 12, -18], k(wingMem));
      limb(c, 2, -15, 8, -36 - fl, 1.6, k(d.c)); limb(c, 8, -36 - fl, 17, -24 - fl * 0.4, 0.9, k(d.c)); limb(c, 8, -36 - fl, 20, -32 - fl, 0.9, k(d.c));
      poly(c, [7, -36 - fl, 8, -39 - fl, 9, -36 - fl], k("#e8e0d0"));
    },
    demogorgon(c, e, d, k, t, mv, ph, ak) {
      const m = Q.mv, cr = Q.ph === "pre" ? eo(Q.pre) : 0;
      const sw = Math.sin(t * 1.2) * 2;
      const gaze = (m === "blick" || m === "doppelblick") && Q.ph;
      const scream = m === "schrei" && Q.ph;
      glow(c, 0, -60, 90, "rgba(200,120,255,.14)");
      /* Leib */
      ell(c, 0, -40, 26, 34, k("#2b2130"));
      ell(c, -8, -46, 14, 22, k("#3a2b3e"));
      for (let i = 0; i < 9; i++) { const yy = -70 + i * 7, xx = Math.sin(i * 1.7) * 14; c.save(); c.globalCompositeOperation = "lighter"; c.strokeStyle = "rgba(232,200,106," + (0.25 + 0.25 * Math.sin(t * 2 + i) + (scream ? 0.3 * charge() : 0)).toFixed(2) + ")"; c.lineWidth = 1.2; c.beginPath(); c.moveTo(xx - 6, yy); c.quadraticCurveTo(xx, yy + 3, xx + 7, yy - 1); c.stroke(); c.restore(); }
      /* Saugnapf-Reihe auf dem Bauch */
      for (let i = 0; i < 5; i++) { circ(c, 6, -58 + i * 8, 2, k("#5e3a4a")); circ(c, 6, -58 + i * 8, 1, k("#2a1018")); }
      /* Beine */
      limb(c, -12, -12, -18, 10, 8, k("#2e2232")); limb(c, 12, -12, 18, 10, 8, k("#2e2232"));
      for (const s of [-1, 1]) for (let i = -1; i <= 1; i++) limb(c, s * 18, 10, s * 18 + i * 4 + s * 2, 14, 2, k("#1a1219"));
      /* Tentakel-Arme: holen beim Ausholen aus, peitschen beim Angriff */
      const lash = m === "tentakel" || m === "tentakelsturm";
      const tent = (side, ph2) => {
        const up = lash ? (Q.ph === "pre" ? -20 * cr : Q.ph === "act" ? 14 * Math.sin(Q.time * 12 + ph2) : 0) : 0;
        const ex = side * 46 + Math.sin(t * 2.4 + ph2) * 6 + (lash && Q.ph === "act" ? side * 8 : 0), ey = -20 + up;
        c.strokeStyle = k("#3a2a3c"); c.lineWidth = 6; c.lineCap = "round"; c.beginPath(); c.moveTo(side * 20, -58); c.bezierCurveTo(side * 40, -70 + Math.sin(t * 2 + ph2) * 10 + up, side * 52, -40 + Math.cos(t * 1.7 + ph2) * 14 + up * 0.5, ex, ey); c.stroke();
        c.strokeStyle = k("#d8a6a8"); c.lineWidth = 1.4; c.setLineDash([1.6, 3]); c.beginPath(); c.moveTo(side * 22, -60); c.bezierCurveTo(side * 40, -72 + Math.sin(t * 2 + ph2) * 10 + up, side * 50, -42 + Math.cos(t * 1.7 + ph2) * 14 + up * 0.5, ex, ey - 2); c.stroke(); c.setLineDash([]);
        c.strokeStyle = k("#3a2a3c"); c.lineWidth = 3; c.beginPath(); c.moveTo(ex, ey); c.lineTo(side * 52, ey + 8); c.moveTo(ex, ey); c.lineTo(side * 40, ey + 10); c.stroke();
      };
      tent(-1, 0); tent(1, 1.5);
      /* zwei Pavianköpfe: beim Blick leuchten die Augen gleißend, beim Schrei reißen die Mäuler auf */
      const head = (hx, hy, ph2, side) => {
        hy += Math.sin(t * 2 + ph2) * 2 - (scream ? 6 * charge() : 0);
        limb(c, hx * 0.4, -70, hx, hy + 6, 8, k(side < 0 ? "#1e1c14" : "#2a1618"));
        c.save(); c.translate(hx, hy); c.rotate(side * (Math.sin(t * 0.9 + ph2) * 0.08) + (scream ? -side * 0.2 * charge() : 0));
        ell(c, 0, 0, 11, 9, k("#2e2228"));
        poly(c, [-10, -4, -14, -10, -7, -7], k("#cfc4b0")); poly(c, [10, -4, 14, -10, 7, -7], k("#cfc4b0"));
        ell(c, 4 * side, 3, 6, 4.5, k("#5e2c6c")); limb(c, 4 * side, -1, 4 * side, 6, 1.6, k("#a82436")); circ(c, 4 * side - 1.6, 2, 0.9, k("#2a1010")); circ(c, 4 * side + 1.6, 2, 0.9, k("#2a1010"));
        const op = scream ? charge() * 4 : Q.ph ? 1 : 0;
        poly(c, [-6, 5, 6, 5, 4, 8 + op * 1.6, -4, 8 + op * 1.6], k("#2a0a0a"));
        for (let i = 0; i < 4; i++) poly(c, [-3 + i * 2.5, 5, -2 + i * 2.5, 9 + op * 0.4, -1 + i * 2.5, 5], k("#f0f0d0"));
        const eg = gaze ? 1 + charge() * 2 : 1;
        c.fillStyle = k(gaze ? "#fffbe0" : side < 0 ? "#b8ff4a" : "#ff6a3a"); c.fillRect(-5, -3, 3, 2); c.fillRect(1, -3, 3, 2);
        glow(c, -1, -2, 10 * eg, side < 0 ? "rgba(184,255,74,.6)" : "rgba(255,106,58,.6)");
        c.restore();
      };
      head(-16, -90 + sw, 0, -1); head(16, -92 - sw, 2, 1);
    }
  };
  SHAPES.golemBig = SHAPES.golem;

  /* ======================= W10: Gestalten der neuen Gegnerarten =======================
     Nur Q (Angriffsphase), t, mv/ph, d (Art) und e.revealed/e.aware/e.vy werden gelesen – damit bleibt der
     Sprite-Zwischenspeicher (Stufe 0) gültig (shapeDeps liest die Abhängigkeiten aus dem Quelltext). */
  function gobHead(c, k, x, y, skin, skin2, tilt, paint) {
    c.save(); c.translate(x, y); c.rotate(tilt || 0);
    poly(c, [-2.6, -1.2, -8.6, -3.4, -3, 0.8], k(skin)); poly(c, [-3, -0.6, -7, -2.4, -3.2, 0.2], k("#c88a7a"));
    ell(c, 0, 0, 4.1, 3.5, k(skin)); ell(c, -1.2, 0.6, 2.8, 2.4, k(skin2));
    poly(c, [2, -2.6, 6.2, -6, 3.4, -1.2], k(skin));
    poly(c, [3.4, -0.6, 6.4, 0.4, 3.6, 1], k(shade(skin, 0.85)));
    ell(c, 2.4, -1.3, 1.2, 1, k("#ffe04a")); c.fillStyle = k("#1a1008"); c.fillRect(2.8, -1.7, 0.7, 0.9);
    if (paint) { limb(c, 0.4, -3, 1, 2, 0.7, k(paint)); limb(c, -1.2, -3.2, -0.8, 1.6, 0.7, k(paint)); }
    const mo = Q.ph ? 1.2 * charge() : 0;
    poly(c, [1.4, 1.6, 4.2, 1.4, 3.8, 1.8 + mo, 1.8, 2 + mo * 0.6], k("#2a1010")); poly(c, [2, 1.5, 2.5, 2.3, 3, 1.5], k("#f0e8d0"));
    c.restore();
  }
  Object.assign(SHAPES, {
    /* Goblin-Trommler: Kriegstrommel vor dem Bauch, zwei Schlegel, Federschmuck */
    drummer(c, e, d, k, t, mv, ph) {
      const bob = mv ? Math.abs(Math.sin(ph)) * 1.1 : Math.sin(t * 3) * 0.35, skin = d.c, skin2 = "#3e5a22";
      const cr = Q.ph === "pre" ? eo(Q.pre) * 1.2 : 0;
      legs(c, k, { hy: -6.2 + cr, len: 6.6, mv, ph, stride: 2.4, lift: 1.6, w: 2.3, colB: skin2, colF: skin, footB: skin2, footF: skin, toe: 2.6, spread: 1.8 });
      const ty = -9.6 - bob + cr * 0.6;
      ell(c, -0.4, ty, 4.4, 4.2, k(d.t)); limb(c, -3.8, ty - 3, 4, ty + 2.6, 1, k("#c8a050"));
      gobHead(c, k, 1.2, -15 - bob + cr * 0.7, skin, skin2, Q.hurt * -0.3, "#c03a2a");
      poly(c, [-1, -18.4 - bob, -3.6, -24 - bob + Math.sin(t * 4) * 0.6, -0.2, -18.8 - bob], k("#e8c060")); poly(c, [0.4, -18.6 - bob, -0.6, -23 - bob, 1.4, -18.6 - bob], k("#c03a2a"));
      /* Trommel */
      const dx = 5.4, dy = ty + 1.2, beat = Q.kind === "drum" && Q.ph === "act" ? Math.sin(Q.act * TAU * 3) : 0;
      ell(c, dx, dy, 3.4, 4.8, k("#6a4a2a")); ell(c, dx + 2.4, dy, 1.5, 4.6, k("#e8d8b0")); ell(c, dx + 2.4, dy, 0.8, 3.4, k("#d8c8a0"));
      line(c, [dx - 2.6, dy - 4, dx - 0.6, dy + 4, dx + 1.4, dy - 4], 0.5, k("#c8a050")); limb(c, dx - 3, dy - 4.4, dx + 2.4, dy - 4.6, 0.8, k("#3a2a1a")); limb(c, dx - 3, dy + 4.4, dx + 2.4, dy + 4.6, 0.8, k("#3a2a1a"));
      /* Schlegel: Ausholen hoch, im Schlag abwechselnd auf das Fell */
      const sx = 1, sy = -11.8 - bob + cr * 0.6;
      for (let i = 0; i < 2; i++) {
        const up = Q.kind === "drum" ? (Q.ph === "pre" ? eo(Q.pre) : Q.ph === "act" ? (i ? Math.max(0, beat) : Math.max(0, -beat)) : 0) : 0;
        const a = Q.kind === "drum" ? lp(0.4, -1.6, up) : swing(0.5, -2.2, 0.9) + (i ? 0.25 : 0);
        const h = hand(sx - i * 1.4, sy + i * 0.4, a, 6);
        const [hx2, hy2] = arm(c, k, sx - i * 1.4, sy + i * 0.4, h[0], h[1], 3.4, 3.4, 1.7, i ? skin2 : skin);
        const sa = a + 0.9; limb(c, hx2, hy2, hx2 + Math.cos(sa) * 5, hy2 + Math.sin(sa) * 5, 0.9, k("#8a6a42")); circ(c, hx2 + Math.cos(sa) * 5, hy2 + Math.sin(sa) * 5, 1.2, k("#e8d8b0"));
      }
    },
    /* Goblin-Schildträger: großer Türschild mit Nägeln und Zacken vor dem Körper, nur Ohren und Augen lugen darüber */
    schildgoblin(c, e, d, k, t, mv, ph) {
      const bob = mv ? Math.abs(Math.sin(ph)) * 1.1 : Math.sin(t * 3) * 0.35, skin = d.c, skin2 = "#3e5a22";
      const cr = Q.ph === "pre" ? eo(Q.pre) * 1.2 : 0;
      legs(c, k, { hy: -6.2 + cr, len: 6.6, mv, ph, stride: 2.2, lift: 1.4, w: 2.4, colB: skin2, colF: skin, footB: skin2, footF: skin, toe: 2.6, spread: 2.2 });
      ell(c, -0.6, -9.6 - bob + cr * 0.6, 4.4, 4.2, k(d.t));
      gobHead(c, k, 0.6, -15.4 - bob + cr * 0.8, skin, skin2, Q.hurt * -0.3);
      /* Stich unter dem Schild hervor */
      const stab = Q.kind === "hit" ? (Q.ph === "pre" ? -eo(Q.pre) * 2 : Q.ph === "act" ? eo(Q.act) * 7 : Q.ph === "post" ? (1 - Q.post) * 5 : 0) : 0;
      if (Q.kind === "hit") { limb(c, 3, -6, 9 + stab, -5.4, 0.9, k("#c9b38a")); poly(c, [9 + stab, -6.2, 12 + stab, -5.4, 9 + stab, -4.6], k("#e8e0d0")); }
      /* Schild: beim Stoß nach vorn, beim Schildwall tief eingestemmt */
      const push = Q.kind === "lunge" ? (Q.ph === "pre" ? -1.6 * eo(Q.pre) : Q.ph === "act" ? 3 * eo(Q.act) : Q.ph === "post" ? 3 * (1 - Q.post) : 0) : 0;
      const wall = Q.kind === "brace" && Q.ph ? 1 : 0;
      c.save(); c.translate(4.6 + push, -9.4 - bob * 0.5 + wall * 1.6); c.rotate(Q.kind === "lunge" && Q.ph === "pre" ? -0.12 : 0.04);
      poly(c, [-2.6, -9.6, 3.6, -10.8, 4.2, 8.4, -2.2, 9.4], k("#6a4a2a")); poly(c, [-2.6, -9.6, -0.6, -10, 0, 9, -2.2, 9.4], k("#4a321c"));
      for (let i = 0; i < 3; i++) limb(c, -2.2, -6 + i * 6, 3.8, -6.6 + i * 6, 0.8, k("#3a2a18"));
      for (let i = 0; i < 4; i++) { circ(c, 2.4, -7.6 + i * 4.8, 0.5, k("#a8a090")); circ(c, -1.2, -7.4 + i * 4.8, 0.45, k("#a8a090")); }
      poly(c, [3.6, -10.8, 5.8, -13.4, 3.2, -9], k("#c8c0b0")); poly(c, [4.2, 8.4, 6.2, 10.4, 3.8, 7], k("#c8c0b0")); poly(c, [4, -1.6, 6.8, -0.6, 4, 0.6], k("#c8c0b0"));
      if (wall) { limb(c, -2, 9.2, 3, 9.6, 1, k("#2a1e14")); }
      c.restore();
      const hh = hand(1, -11.6 - bob, 0.3, 4.2); arm(c, k, 0, -11.6 - bob, hh[0] + push, hh[1], 2.6, 2.6, 1.8, skin);
    },
    /* Kobold-Laternenträger: kleiner rotbrauner Echsenkerl mit Stange und Laterne, Schwanz */
    kobold(c, e, d, k, t, mv, ph) {
      const bob = mv ? Math.abs(Math.sin(ph)) * 1 : Math.sin(t * 3.4) * 0.3, cr = Q.ph === "pre" ? eo(Q.pre) : 0, skin = d.c, dk = shade(d.c, 0.7);
      line(c, [-2.4, -6, -6, -4.6 + Math.sin(t * 3) * 0.6, -8.6, -2.4 + Math.sin(t * 3 + 1) * 0.8], 1.6, k(dk));
      legs(c, k, { hy: -5.4 + cr, len: 5.6, mv, ph, stride: 2.4, lift: 1.6, w: 2, colB: dk, colF: skin, footB: dk, footF: skin, toe: 2.4, spread: 1.6 });
      const ty = -8.6 - bob + cr * 0.5;
      ell(c, -0.4, ty, 3.4, 3.6, k("#5a3a2a")); poly(c, [-3.4, ty, 3.2, ty, 2.6, ty + 3.6, -3, ty + 3.6], k("#4a2e22"));
      /* Kopf: Schnauze, kleine Hörner */
      c.save(); c.translate(1.2, -13.2 - bob + cr * 0.6); c.rotate(-Q.hurt * 0.3);
      ell(c, 0, 0, 3, 2.6, k(skin)); poly(c, [1.4, -1.2, 5.6, 0, 1.6, 1.6], k(skin)); poly(c, [-1.6, -1.8, -4.2, -4, -0.6, -2.2], k("#e8d8b0"));
      circ(c, 1.2, -0.8, 0.9, k("#ffd23a")); c.fillStyle = k("#1a1008"); c.fillRect(1.4, -1.3, 0.5, 1);
      c.restore();
      /* Laterne an der Stange */
      const a = Q.kind === "hit" ? swing(-0.6, -2.2, 0.9) : Q.kind === "lob" ? swing(-0.6, -2.6, -0.2) : Q.kind === "flare" ? lp(-0.6, -1.5, charge()) : -0.6 + Math.sin(t * 2) * 0.05;
      const sx = 1, sy = -10.6 - bob + cr * 0.5, h = hand(sx, sy, a, 5);
      const [hx2, hy2] = arm(c, k, sx, sy, h[0], h[1], 2.8, 2.8, 1.5, skin);
      const px = hx2 + Math.cos(a) * 7, py = hy2 + Math.sin(a) * 7;
      limb(c, hx2 - Math.cos(a) * 3, hy2 - Math.sin(a) * 3, px, py, 0.9, k("#6a4a2a"));
      const lx = px, ly = py + 2.8, fl = 0.8 + 0.2 * Math.sin(t * 13);
      limb(c, px, py, lx, ly - 1.6, 0.5, k("#2a2420"));
      poly(c, [lx - 1.8, ly - 1.6, lx + 1.8, ly - 1.6, lx + 1.4, ly + 2.4, lx - 1.4, ly + 2.4], k("#3a3028"));
      poly(c, [lx - 1.1, ly - 1, lx + 1.1, ly - 1, lx + 0.9, ly + 1.8, lx - 0.9, ly + 1.8], k("#ffcf6a"));
      if (!flashOf(k)) glow(c, lx, ly + 0.4, 6 + fl * 3 + (Q.kind === "flare" ? charge() * 10 : 0), "rgba(255,200,110,.6)");
      if (Q.kind === "lob" && Q.ph === "pre") circ(c, hx2 - 2, hy2 + 1, 1.3, k("#8a6a3a"));
    },
    /* Gallertwürfel: durchscheinender Würfel mit Knochen, Münzen und einem verschluckten Helm */
    cube(c, e, d, k, t, mv, ph) {
      const wob = Math.sin(t * 2.2) * 0.6 + (mv ? Math.sin(ph) * 0.5 : 0), cr = Q.ph === "pre" ? eo(Q.pre) : 0;
      const W2 = 11 + cr * 1.2 + (Q.kind === "grab" && Q.ph === "act" ? 2.5 : 0), H = 22 - cr * 1.6 + wob * 0.4;
      c.save(); c.globalAlpha *= 0.9;
      /* Inhalt */
      ell(c, -3, -6, 2.4, 1.6, k("#e8e0c8"), 0.4); limb(c, -6, -9, 1, -12, 1, k("#d8d0b8")); circ(c, 4, -4, 1.1, k("#ffd27a")); circ(c, 2.4, -3, 1, k("#e8b84a")); circ(c, 5.4, -14, 1, k("#ffd27a"));
      poly(c, [-1, -17, 3, -18.4, 5, -15.6, 1, -14.4], k("#8a8a90"));
      /* Körper */
      c.fillStyle = k("rgba(150,205,120,.42)"); c.beginPath(); c.moveTo(-W2, 0); c.lineTo(-W2 + wob * 0.6, -H); c.lineTo(W2 + wob * 0.6, -H - 0.6); c.lineTo(W2, 0); c.closePath(); c.fill();
      c.fillStyle = k("rgba(200,240,170,.25)"); c.fillRect(-W2 + 1.4 + wob * 0.6, -H + 1.4, W2 * 0.9, 3);
      c.strokeStyle = k("rgba(210,245,180,.65)"); c.lineWidth = 0.7; c.beginPath(); c.moveTo(-W2, 0); c.lineTo(-W2 + wob * 0.6, -H); c.lineTo(W2 + wob * 0.6, -H - 0.6); c.lineTo(W2, 0); c.stroke();
      /* Scheinfuß */
      if (Q.kind === "hit" && Q.ph) { const r = Q.ph === "pre" ? eo(Q.pre) * 2 : Q.ph === "act" ? 4 + eo(Q.act) * 12 : (1 - Q.post) * 14; ell(c, W2 + r * 0.5, -10, r * 0.7 + 1, 2.6, k("rgba(150,205,120,.55)")); }
      c.restore();
      if (!flashOf(k)) for (let i = 0; i < 3; i++) circ(c, -6 + i * 5, -H + 4 + ((t * 6 + i * 7) % 14), 0.6, "rgba(230,255,200,.5)");
    },
    /* Mimik: getarnt eine Truhe (mit winzigem Speichelfaden als Hinweis), enthüllt mit Zähnen, Zunge und Beinchen */
    mimic(c, e, d, k, t, mv, ph) {
      const rev = !!e.revealed;
      if (!rev) {
        const br = Math.sin(t * 1.3) * 0.25;
        poly(c, [-8, 0, 8, 0, 8, -8.6 - br, -8, -8.6 - br], k("#6a4426")); ell(c, 0, -9 - br, 8, 3.4, k("#7a5030"));
        limb(c, -8, -4.4, 8, -4.4, 1.2, k("#c8a040")); limb(c, -4, 0, -4, -11.6, 1, k("#c8a040")); limb(c, 4, 0, 4, -11.6, 1, k("#c8a040"));
        poly(c, [-1.2, -9.6, 1.2, -9.6, 1.2, -7, -1.2, -7], k("#e8c860"));
        if (!flashOf(k)) { const dr = (t * 0.7) % 1; limb(c, 6.6, -8.4, 6.8, -8.4 + dr * 3, 0.4, "rgba(220,230,200,.55)"); }
        return;
      }
      const open = Q.kind === "grab" ? (Q.ph === "pre" ? eo(Q.pre) : Q.ph === "act" ? 1 - eo(Q.act) : 0) : Q.kind === "pull" && Q.ph ? 0.7 : Q.ph === "pre" ? eo(Q.pre) * 0.6 : 0.25 + Math.sin(t * 4) * 0.08;
      const hop = mv ? Math.abs(Math.sin(ph)) * 1.6 : 0;
      for (let i = 0; i < 3; i++) { const lx = -6 + i * 6, s = mv ? Math.sin(ph + i * 2) * 1.6 : 0; line(c, [lx, -3 - hop, lx + s - 1, -1.4, lx + s + 1, 0], 1.1, k("#4a2a1a")); }
      c.save(); c.translate(0, -hop);
      poly(c, [-8, -2, 8, -2, 8, -8.4, -8, -8.4], k("#6a4426")); limb(c, -8, -5, 8, -5, 1.1, k("#c8a040"));
      for (let i = 0; i < 5; i++) poly(c, [-7 + i * 3.4, -8.4, -5.6 + i * 3.4, -6.4, -4.2 + i * 3.4, -8.4], k("#f0e8d0"));
      c.save(); c.translate(-8, -8.4); c.rotate(-open * 0.9);
      poly(c, [0, 0, 16, 0, 16, -3.6, 0, -3.6], k("#7a5030")); ell(c, 8, -3.6, 8, 2.4, k("#7a5030")); limb(c, 12, 0, 12, -5.8, 1, k("#c8a040"));
      for (let i = 0; i < 5; i++) poly(c, [1 + i * 3.4, 0, 2.4 + i * 3.4, 2, 3.8 + i * 3.4, 0], k("#f0e8d0"));
      circ(c, 13.6, -2.4, 1.2, k("#ffe04a")); c.fillStyle = k("#1a0a08"); c.fillRect(13.8, -3, 0.6, 1.2);
      c.restore();
      ell(c, 0, -8.4, 7 * open, 2.2 * open, k("#5a1414"));
      if (Q.kind === "pull" && Q.ph === "pre") { const r = eo(Q.pre) * 5; line(c, [3, -8.4, 3 + r, -9 - r * 0.3, 4 + r * 1.4, -8], 1.6, k("#d86a7a")); }
      c.restore();
    },
    /* Kenku: Krähenmensch im Kapuzenmantel, langer Schnabel, Federn am Saum */
    kenku(c, e, d, k, t, mv, ph) {
      const bob = mv ? Math.abs(Math.sin(ph)) * 1.2 : Math.sin(t * 3) * 0.3, cr = Q.ph === "pre" ? eo(Q.pre) * 1.2 : 0;
      const ev = Q.kind === "evade" && Q.ph === "act";
      legs(c, k, { hy: -8.6 + cr, len: 8.4, mv, ph, stride: 3, lift: 2, w: 1.6, colB: "#5a4a30", colF: "#8a7040", footB: "#5a4a30", footF: "#8a7040", toe: 3.4, spread: 2, bend: -1 });
      const sy0 = -17 - bob + cr * 0.8, sw = mv ? Math.sin(ph) * 0.8 : Math.sin(t * 1.6) * 0.3;
      poly(c, [-3.4, sy0, 3.4, sy0, 4.4, -7, 3 + sw, -5.4, 1 + sw, -7, -1 + sw, -5, -3 + sw, -6.8, -5 + sw, -5.6, -4.4, -9], k(d.c));
      poly(c, [-3.4, sy0, -0.6, sy0, -2 + sw, -6, -5 + sw, -5.6, -4.4, -9], k(shade(d.c, 0.7)));
      if (ev) poly(c, [-3, sy0 + 1, -11, sy0 - 4, -10, sy0 + 3, -4, sy0 + 5], k(shade(d.c, 0.8)));
      c.save(); c.translate(1, -20.4 - bob + cr * 0.8); c.rotate(-Q.hurt * 0.3 + (Q.ph === "pre" ? -0.15 * cr : 0));
      ell(c, 0, 0, 3.4, 3.2, k("#1a1418")); poly(c, [-3.6, 2, -4, -2.6, -0.6, -4.4, 3, -3, 3.6, 0.6], k(d.c));
      poly(c, [2.2, -0.8, 8.4, 0.6, 2.4, 1.6], k(d.t)); limb(c, 2.4, 0.6, 7.6, 0.8, 0.4, k(shade(d.t, 0.6)));
      circ(c, 1.6, -0.8, 0.8, k("#e8e0c0")); c.fillStyle = k("#000"); c.fillRect(1.7, -1.1, 0.5, 0.6);
      c.restore();
      const sx = 1, sy = -15.6 - bob + cr * 0.7;
      const a = Q.kind === "shoot" ? swing(0.6, -2.4, 0.1) : swing(0.7, -2, 0.7);
      const h = hand(sx, sy, a, 6);
      const [hx2, hy2] = arm(c, k, sx, sy, h[0], h[1], 3.4, 3.2, 1.6, d.c);
      if (!(Q.kind === "shoot" && Q.ph === "act")) { c.save(); c.translate(hx2, hy2); c.rotate(a - 0.5); c.scale(0.75, 0.75); weapon(c, "dagger", "#c9b38a", t); c.restore(); }
      for (let f = -1; f <= 1; f++) limb(c, hx2, hy2, hx2 + 1.6, hy2 + f * 0.8, 0.4, k("#8a7040"));
    },
    /* Grimlock: grau, gebückt, augenloses Gesicht mit Narben, Steinkeule */
    grimlock(c, e, d, k, t, mv, ph) {
      const bob = mv ? Math.abs(Math.sin(ph)) * 1.2 : Math.sin(t * 2.4) * 0.4, cr = Q.ph === "pre" ? eo(Q.pre) * 1.4 : 0, skin = d.c, dk = shade(skin, 0.72);
      legs(c, k, { hy: -9 + cr, len: 9, mv, ph, stride: 3.2, lift: 2, w: 2.6, colB: dk, colF: skin, footB: dk, footF: skin, toe: 3, spread: 2.2 });
      const sy0 = -17.4 - bob + cr * 0.9;
      poly(c, [-4, sy0 + 1, 3.6, sy0, 4.4, -9 + cr, -4, -8.6 + cr], k(skin)); poly(c, [-4.4, -10 + cr, 4.4, -10.4 + cr, 4, -7.6 + cr, -4, -7.6 + cr], k(d.t));
      limb(c, -2, sy0 + 3, 2, sy0 + 2, 0.5, k(dk)); limb(c, -2, sy0 + 5, 2.6, sy0 + 4.4, 0.5, k(dk));
      /* Kopf vorgeschoben, lauschend geneigt; keine Augen, nur Narben */
      const lis = Q.ph ? 0 : Math.sin(t * 0.9) * 0.15;
      c.save(); c.translate(2.6, -19.4 - bob + cr); c.rotate(0.25 + lis - Q.hurt * 0.3);
      ell(c, 0, 0, 3.6, 3.2, k(skin)); poly(c, [-3, -1, -5.6, -3, -3.6, 0.4], k(dk));
      limb(c, 0.6, -1.4, 3, -1, 0.6, k(dk)); limb(c, 0.6, -0.4, 3, -0.4, 0.5, k(dk));
      const mo = Q.ph ? 1.6 * charge() : 0.4; poly(c, [0.6, 1.2, 3.6, 1, 3.2, 1.6 + mo, 0.8, 1.8 + mo], k("#2a1010")); poly(c, [1.2, 1.1, 1.6, 2, 2, 1.1], k("#e8e0d0")); poly(c, [2.4, 1.1, 2.8, 2, 3.2, 1.1], k("#e8e0d0"));
      c.restore();
      const sx = 1, sy = -15.6 - bob + cr * 0.8;
      const a = Q.kind === "lob" ? swing(-0.8, -2.8, -0.2) : swing(-0.9, -2.6, 0.9) + shake(0.08) + (Q.alt ? 0.3 : 0);
      const h = hand(sx, sy, a, 7);
      arm(c, k, sx - 1.6, sy + 0.4, sx + 2, sy + 7, 3.8, 3.8, 2, dk);
      const [hx2, hy2] = arm(c, k, sx, sy, h[0], h[1], 4, 4, 2.2, skin);
      if (Q.kind === "lob" && Q.ph !== "post" && !(Q.ph === "act" && Q.act > 0.3)) circ(c, hx2, hy2 - 2, 2.6, k("#7a6a5a"));
      else { c.save(); c.translate(hx2, hy2); c.rotate(a + 0.1); limb(c, 0, 0, 7, 0, 1.2, k("#5a4a3a")); ell(c, 7.4, 0, 2.6, 2, k("#8a8070")); c.restore(); }
    },
    /* Ghul: hager, lange Krallen, vorgereckt auf allen vieren beim Sprung */
    ghoul(c, e, d, k, t, mv, ph) {
      const bob = mv ? Math.abs(Math.sin(ph)) * 1.2 : Math.sin(t * 2.8) * 0.4, cr = Q.ph === "pre" ? eo(Q.pre) * 2 : 0, skin = d.c, dk = shade(skin, 0.7);
      const crouch = Q.kind === "leap" && (Q.ph === "pre" || Q.ph === "act") ? 1 : 0;
      legs(c, k, { hy: -8.6 + cr + crouch * 2, len: 9, mv, ph, stride: 3.6, lift: 2.2, w: 1.6, colB: dk, colF: skin, footB: dk, footF: skin, toe: 3.2, spread: 2.2 });
      c.save(); c.translate(0, -8.6 + cr); c.rotate(0.35 + crouch * 0.5);
      poly(c, [-2.6, 0, 2.6, 0, 3, -8.6, -2.6, -8.4], k(skin)); for (let i = 0; i < 3; i++) limb(c, -2, -2.4 - i * 2, 2.4, -2.6 - i * 2, 0.4, k(dk));
      poly(c, [-3, 0, 3, 0, 2.4, 2.6, -2.6, 2.6], k(d.t === "#c8c0a0" ? "#4a4038" : d.t));
      c.save(); c.translate(1.2, -10.8); c.rotate(-0.35 - crouch * 0.4 - Q.hurt * 0.3);
      ell(c, 0, 0, 3, 3.2, k(skin)); poly(c, [-2.4, -1.6, -4.8, -4.4, -1.2, -2.6], k(skin));
      circ(c, 1.6, -0.8, 0.9, k("#ffe8a0")); if (!flashOf(k)) glow(c, 1.6, -0.8, 2, "rgba(255,230,160,.5)");
      const mo = Q.ph ? 2 * charge() : 0.6; poly(c, [0.4, 1.2, 3.4, 1, 3, 1.6 + mo, 0.6, 1.8 + mo], k("#2a0a0a"));
      if (Q.ph) limb(c, 2, 1.6 + mo, 3.4, 3.4 + mo, 0.8, k("#b04a5a"));
      c.restore(); c.restore();
      const sx = 2 + crouch * 2, sy = -14 - bob + cr + crouch * 3;
      for (const s of [0, 1]) {
        const a = (Q.kind === "combo" ? swing(0.6, -2, 0.9) + (Q.alt === s ? 0.5 : -0.4) : Q.kind === "leap" ? lp(0.6, -0.2, charge()) : 0.9) - s * 0.3;
        const h = hand(sx - s * 1.4, sy + s * 0.4, a, 7.6);
        const [hx2, hy2] = arm(c, k, sx - s * 1.4, sy + s * 0.4, h[0], h[1], 3.8, 4, 1.3, s ? dk : skin);
        for (let f = -1; f <= 1; f++) limb(c, hx2, hy2, hx2 + Math.cos(a + f * 0.35) * 2.8, hy2 + Math.sin(a + f * 0.35) * 2.8, 0.45, k("#e8e0c8"));
      }
    },
    /* Glockengeist: zerschlissener Geist, um eine bronzene Glocke geschlungen, Kette baumelt */
    bellghost(c, e, d, k, t, mv, ph) {
      const cr = Q.ph === "pre" ? eo(Q.pre) : 0, sw = Q.kind === "toll" ? (Q.ph === "pre" ? -0.6 * cr : Q.ph === "act" ? lp(-0.6, 0.5, eo(Q.act)) : Q.ph === "post" ? 0.5 * (1 - Q.post) : 0) : Math.sin(t * 1.8) * 0.12;
      c.save(); c.globalAlpha *= 0.85;
      glow(c, 0, -10, 16 + cr * 6, "rgba(240,220,170,.3)");
      const fl = Math.sin(t * 4) * 1.6;
      c.fillStyle = k(d.c); c.beginPath(); c.moveTo(-4, -20); c.quadraticCurveTo(-8, -10, -5 + fl, 0);
      for (let i = 0; i <= 4; i++) c.lineTo(lp(-5 + fl, 5 - fl, i / 4), (i % 2 ? -2.6 : 1.6) + Math.sin(t * 6 + i) * 0.8);
      c.quadraticCurveTo(8, -10, 4, -20); c.closePath(); c.fill();
      c.save(); c.translate(0, -21); c.rotate(-Q.hurt * 0.3);
      ell(c, 0, 0, 3.6, 3.8, k(d.c)); ell(c, 0.8, 0.2, 2.4, 2.8, k("#1a1418"));
      ell(c, 0.2, -0.4, 0.6, 0.7, k("#ffe8b0")); ell(c, 2, -0.4, 0.6, 0.7, k("#ffe8b0"));
      if (Q.ph) ell(c, 1.2, 1.6, 0.8, 1 + cr, k("#ffe8b0"));
      c.restore();
      c.restore();
      /* Glocke (schwingt beim Schlag) */
      c.save(); c.translate(0, -16); c.rotate(sw);
      limb(c, 0, 0, 0, 2, 1, k("#5a4a3a"));
      poly(c, [-2.6, 2, 2.6, 2, 3.4, 8, 5.4, 10.4, -5.4, 10.4, -3.4, 8], k(d.t)); limb(c, -5.2, 10.2, 5.2, 10.2, 1, k(shade(d.t, 1.25))); poly(c, [-2, 3, -1, 3, -2.4, 9, -3.6, 9], k(shade(d.t, 1.3)));
      circ(c, 0, 11.4 + (Q.ph === "act" ? 0.6 : 0), 1.3, k("#5a4a3a"));
      c.restore();
      for (let i = 0; i < 4; i++) circ(c, -3 + Math.sin(t * 2 + i) * 0.6, -6 + i * 2, 0.6, k("#7a7068"));
      if (Q.kind === "toll" && Q.ph === "act" && !flashOf(k)) glow(c, 0, -8, 22, "rgba(255,230,150,.55)");
    },
    /* Myconid: Pilzwesen mit breitem Hut, Lamellen, Sporen rieseln */
    myconid(c, e, d, k, t, mv, ph) {
      const bob = mv ? Math.abs(Math.sin(ph)) * 0.8 : Math.sin(t * 1.6) * 0.4, cr = Q.ph === "pre" ? eo(Q.pre) : 0, st = d.c, cap = d.t;
      legs(c, k, { hy: -6 + cr * 0.6, len: 6, mv, ph, stride: 2, lift: 1.2, w: 3, colB: shade(st, 0.75), colF: st, footB: shade(st, 0.7), footF: shade(st, 0.85), toe: 1.8, spread: 1.8 });
      poly(c, [-3, -5.6, 3, -5.6, 2.4, -15 - bob, -2.4, -15 - bob], k(st)); limb(c, -1, -7, -1.4, -14, 0.5, k(shade(st, 0.8)));
      circ(c, 0.8, -12 - bob, 0.7, k("#2a1a1a")); circ(c, 2.2, -12 - bob, 0.7, k("#2a1a1a"));
      /* Hut: plustert sich beim Ausholen auf */
      const p = 1 + cr * 0.15 + (Q.kind === "spores" && Q.ph === "act" ? 0.2 : 0);
      c.save(); c.translate(0, -15.6 - bob); c.scale(p, p);
      ell(c, 0, 0, 9, 4.6, k(cap)); ell(c, 0, 1.4, 8, 1.6, k(shade(cap, 0.7)));
      for (let i = -3; i <= 3; i++) limb(c, i * 2.2, 1, i * 2.6, 2.8, 0.4, k(shade(cap, 0.55)));
      circ(c, -4, -1.6, 1.2, k("#e8d8c8")); circ(c, 2.6, -2.6, 1, k("#e8d8c8")); circ(c, 5.6, -0.6, 0.8, k("#e8d8c8"));
      c.restore();
      const a = Q.kind === "hit" ? swing(0.8, -1.8, 0.8) : Q.kind === "heal" ? lp(0.8, -1.2, charge()) : 0.9;
      const h = hand(1, -12 - bob, a, 5.4); arm(c, k, 1, -12 - bob, h[0], h[1], 2.8, 2.8, 1.8, st);
      if (!flashOf(k)) for (let i = 0; i < 3; i++) { const u = (t * 0.5 + i / 3) % 1; circ(c, -5 + i * 5 + Math.sin(t + i) * 1, -14 + u * 12, 0.5, "rgba(230,200,210," + (0.6 * (1 - u)) + ")"); }
    },
    /* Drider: Drow-Oberkörper auf einem schwarzen Spinnenleib, Armbrust */
    drider(c, e, d, k, t, mv, ph) {
      const cr = Q.ph === "pre" ? eo(Q.pre) : 0, bob = mv ? Math.abs(Math.sin(ph * 1.5)) * 0.8 : Math.sin(t * 2) * 0.3;
      /* Spinnenbeine */
      for (let i = 0; i < 4; i++) for (const s of [-1, 1]) {
        const base = -4 + i * 3, a = mv ? Math.sin(ph * 1.5 + i * 1.3 + (s > 0 ? PI : 0)) * 2 : 0;
        const kx = base + s * 6 + a, fx = base + s * 11 + a * 1.4, col = s > 0 ? "#2a2236" : "#1a1424";
        line(c, [base, -9 - bob, kx, -15 - bob + Math.abs(a) * 0.3, fx, 0], 1.3, k(col));
      }
      ell(c, -7, -9 - bob, 7, 5, k("#1a1424")); ell(c, -8, -10 - bob, 4.6, 3, k("#2a2236")); limb(c, -12, -9 - bob, -3, -11 - bob, 0.6, k("#6a2a3a"));
      ell(c, 1, -9 - bob, 3.6, 3.2, k("#221a2e"));
      /* Drow-Oberkörper */
      const sy0 = -20 - bob + cr * 0.8;
      poly(c, [-1.4, -10 - bob, 4.6, -10 - bob, 4.2, sy0, -1, sy0], k(d.c)); limb(c, -1, sy0 + 3, 4.2, sy0 + 3, 0.6, k("#6a5a8a"));
      c.save(); c.translate(2, sy0 - 3); c.rotate(-Q.hurt * 0.3);
      poly(c, [-2.6, -2, -6.4 + Math.sin(t * 2.4) * 0.6, 6, -4, 7, -2.6, 2], k(d.hair));
      ell(c, 0, 0, 2.8, 3.1, k(d.skin)); poly(c, [-3, 1.2, -3, -2.6, -0.4, -3.6, 3, -3, 3.2, -1.6, 0.4, -2.2, -1.4, 2.6], k(d.hair));
      c.fillStyle = k("#ff4a5a"); c.fillRect(1.2, -0.8, 1.1, 0.7); c.restore();
      const sx = 3, sy = sy0 + 1.4;
      if (Q.kind === "shoot" || Q.kind === "thread") {
        const h = hand(sx, sy, -0.05, 6.4); const [hx2, hy2] = arm(c, k, sx, sy, h[0], h[1], 3.2, 3.2, 1.5, d.skin);
        if (Q.kind === "shoot") { c.save(); c.translate(hx2, hy2); weapon(c, "xbow", "#3a2a4a", t, Q.ph === "pre" ? Q.pre : 0); c.restore(); }
        else { line(c, [hx2, hy2, hx2 + 4, hy2 - 1, hx2 + 6, hy2 + 1], 0.4, k("#eee8f0")); }
      } else {
        const a = swing(0.5, -1.8, 0.8), h = hand(sx, sy, a, 6.4); const [hx2, hy2] = arm(c, k, sx, sy, h[0], h[1], 3.2, 3.2, 1.5, d.skin);
        c.save(); c.translate(hx2, hy2); c.rotate(a - 0.3); c.scale(0.8, 0.8); weapon(c, "scimitar", "#c8c0e0", t); c.restore();
      }
    },
    /* Rostmonster: insektenhaft, rostrot, gefiederte Fühler, propellerartiger Schwanz */
    rustmonster(c, e, d, k, t, mv, ph) {
      const cr = Q.ph === "pre" ? eo(Q.pre) : 0, bob = mv ? Math.abs(Math.sin(ph * 1.3)) * 0.8 : Math.sin(t * 2.6) * 0.3;
      for (let i = 0; i < 3; i++) for (const s of [0, 1]) { const bx = -5 + i * 5, a = mv ? Math.sin(ph * 1.3 + i * 2 + s * PI) * 1.6 : 0; line(c, [bx, -5 - bob, bx + a + (s ? 1.4 : -1), -2.6, bx + a * 1.3 + (s ? 2 : -0.6), 0], 1.1, k(s ? d.c : shade(d.c, 0.6))); }
      /* Schwanz mit Propellerflossen */
      line(c, [-6, -7 - bob, -10, -9 - bob, -12.6, -7.6 - bob], 1.6, k(shade(d.c, 0.8)));
      c.save(); c.translate(-12.8, -7.6 - bob); c.rotate(t * 9); poly(c, [0, 0, -1, -3, 1, -3], k(d.t)); poly(c, [0, 0, 1, 3, -1, 3], k(d.t)); c.restore();
      ell(c, -1, -7 - bob, 7.4, 4.2, k(d.c)); for (let i = 0; i < 4; i++) limb(c, -6 + i * 3.4, -10.6 - bob, -5.4 + i * 3.4, -4 - bob, 0.6, k(shade(d.c, 0.7)));
      ell(c, -1, -8.6 - bob, 5, 1.6, k(shade(d.c, 1.25)));
      c.save(); c.translate(6.4, -7.4 - bob + cr); ell(c, 0, 0, 3, 2.6, k(shade(d.c, 0.9))); circ(c, 1.4, -0.8, 0.8, k("#1a1008"));
      /* Fühler: tasten, beim Ausholen weit nach vorn gestreckt */
      const reach = Q.kind === "hit" ? (Q.ph === "pre" ? -eo(Q.pre) * 2 : Q.ph === "act" ? 4 + eo(Q.act) * 6 : (1 - Q.post) * 8) : Math.sin(t * 3) * 1;
      for (const s of [-1, 1]) {
        const ex = 6 + reach, ey = -5 + s * 1.4 + Math.sin(t * 5 + s) * 0.8;
        line(c, [1, -1, 3.4 + reach * 0.4, -4 + s, ex, ey], 0.6, k("#5a2a10"));
        for (let f = 0; f < 4; f++) { const fx = lp(3, ex, f / 4), fy = lp(-3.6, ey, f / 4); limb(c, fx, fy, fx - 0.6, fy - 1.6, 0.5, k(d.t)); }
      }
      c.restore();
    },
    /* Quasit: kleiner grüner Dämon mit Fledermausflügeln, Hörnern und Giftstachel */
    quasit(c, e, d, k, t, mv, ph) {
      const dive = Q.kind === "dive" && (Q.ph === "act" || Q.ph === "pre"), fl = dive && Q.ph === "act" ? -3 : Math.sin(t * 22) * 4;
      if (dive) c.rotate(Q.ph === "act" ? 0.6 : -0.3 * eo(Q.pre));
      poly(c, [-1, -9, -6, -15 + fl, -11, -11 + fl, -7, -9 + fl * 0.3, -4, -6.6], k(shade(d.c, 0.6)));
      line(c, [-2, -5, -6, -3, -7.4, -5 + Math.sin(t * 5) * 1.2], 0.8, k(d.c)); poly(c, [-7.4, -6, -9, -4.6, -7.2, -4.2], k(d.t));
      ell(c, -0.6, -6.6, 3.2, 3.6, k(d.c)); limb(c, -1, -3.6, -1.6, -0.6, 0.9, k(shade(d.c, 0.7))); limb(c, 0.8, -3.6, 1.4, -0.6, 0.9, k(d.c));
      c.save(); c.translate(1.4, -11); ell(c, 0, 0, 2.8, 2.5, k(d.c)); poly(c, [-1.4, -1.8, -3, -4.4, -0.2, -2.2], k("#e8d8b0")); poly(c, [1, -2, 1.6, -4.6, 2.2, -1.8], k("#e8d8b0"));
      circ(c, 1.4, -0.4, 0.8, k(d.t)); if (!flashOf(k)) glow(c, 1.4, -0.4, 2.2, "rgba(255,140,60,.6)");
      poly(c, [0.6, 1, 2.8, 0.8, 1.6, 2], k("#2a0a0a")); c.restore();
      poly(c, [0, -9, 5, -15 - fl, 10, -12 - fl, 6, -9 - fl * 0.3, 3, -6.6], k(shade(d.c, 0.8)));
      const a = dive ? -0.2 : swing(0.6, -1.6, 0.6), h = hand(1.6, -7.6, a, 4); arm(c, k, 1.6, -7.6, h[0], h[1], 2.2, 2.2, 1, d.c);
    },
    /* Wasserspeier: als Statue geduckt auf einem Sockel; wach mit Steinflügeln und glühenden Augen */
    gargoyle(c, e, d, k, t, mv, ph) {
      const rev = !!e.revealed, st = d.c, dk = shade(st, 0.72), cr = Q.ph === "pre" ? eo(Q.pre) : 0;
      const fl = rev ? (Q.kind === "dive" && Q.ph === "act" ? -4 : Math.sin(t * 7) * 5) : 2;
      if (rev && Q.kind === "dive" && Q.ph) c.rotate(Q.ph === "act" ? 0.45 : -0.25 * cr);
      if (!rev) { poly(c, [-8, 0, 8, 0, 7, -3, -7, -3], k(shade(st, 0.85))); limb(c, -7, -3, 7, -3, 0.8, k(shade(st, 1.2))); c.translate(0, -3); }
      poly(c, [-2, -12, -8, -20 + fl, -15, -15 + fl, -10, -11 + fl * 0.4, -6, -8], k(dk));
      for (let i = 0; i < 3; i++) limb(c, -2, -12, -8 - i * 2.4, -20 + fl + i * 2.4, 0.5, k(shade(st, 0.55)));
      const hy = rev ? -7 : -4.6;
      line(c, [-3, -6, -6, -3, -9, -2], 1.4, k(dk)); poly(c, [-9, -3, -11, -1, -8.6, -1], k(dk));
      legs(c, k, { hy, len: rev ? 7 : 5, mv: rev && mv, ph, stride: 2, lift: 1.4, w: 2.4, colB: dk, colF: st, footB: dk, footF: st, toe: 3, spread: 2.6, bend: -1 });
      poly(c, [-4, hy, 4, hy, 4.6, hy - 9, 0, hy - 11, -4.4, hy - 8.6], k(st)); limb(c, -3, hy - 3, 3, hy - 3.4, 0.5, k(dk));
      c.save(); c.translate(2.6, hy - 12.4); c.rotate(rev ? -Q.hurt * 0.3 : 0.2);
      ell(c, 0, 0, 3.4, 3, k(st)); poly(c, [-1.8, -2, -4, -5.6, -0.4, -2.6], k(dk)); poly(c, [1, -2.4, 1.4, -5.4, 2.6, -2], k(dk));
      poly(c, [1.6, 0.6, 5.4, 1.2, 2, 2.6], k(dk));
      if (rev) { circ(c, 1.6, -0.8, 0.8, k(d.t)); if (!flashOf(k)) glow(c, 1.6, -0.8, 2.6, "rgba(255,140,60,.7)"); } else limb(c, 0.8, -0.8, 2.4, -0.8, 0.5, k(dk));
      c.restore();
      poly(c, [0, -12, 6, -21 - fl, 12, -17 - fl, 7, -12 - fl * 0.4, 3, -8], k(st));
      const a = rev ? (Q.kind === "hit" ? swing(0.7, -1.8, 0.8) : 0.8) : 1.2, h = hand(2, hy - 8, a, 5.6);
      const [hx2, hy2] = arm(c, k, 2, hy - 8, h[0], h[1], 3, 3, 1.8, st);
      for (let f = -1; f <= 1; f++) limb(c, hx2, hy2, hx2 + Math.cos(a + f * 0.4) * 2.4, hy2 + Math.sin(a + f * 0.4) * 2.4, 0.5, k(dk));
    },
    /* Grindylow: Goblinkopf auf einem Tintenfischleib mit sechs Tentakeln */
    grindylow(c, e, d, k, t, mv, ph) {
      const cr = Q.ph === "pre" ? eo(Q.pre) : 0, bob = Math.sin(t * 2.4) * 0.6 + (mv ? Math.abs(Math.sin(ph)) * 0.8 : 0);
      for (let i = 0; i < 6; i++) {
        const bx = -5 + i * 2, w1 = Math.sin(t * 4 + i * 1.1 + (mv ? ph : 0)) * 2;
        line(c, [bx, -6 - bob, bx + w1 - 1.4, -3, bx + w1 * 1.5 + (i % 2 ? 2 : -2), 0], 1.4 - i * 0.05, k(i % 2 ? d.c : shade(d.c, 0.7)));
      }
      ell(c, 0, -8 - bob, 5.4, 4.2, k(d.c)); for (let i = 0; i < 4; i++) circ(c, -3 + i * 2, -6 - bob, 0.6, k(d.t));
      c.save(); c.translate(1.6, -13.4 - bob + cr * 0.8); c.rotate(-Q.hurt * 0.3);
      ell(c, 0, 0, 3.8, 3.4, k(shade(d.c, 1.15))); poly(c, [-2.4, -1, -6.6, -3.2, -2.6, 0.8], k(shade(d.c, 1.1)));
      circ(c, 1.8, -1, 1.1, k(d.t)); c.fillStyle = k("#1a1008"); c.fillRect(2.2, -1.4, 0.6, 0.9);
      const mo = Q.ph ? 1.6 * charge() : 0.3; poly(c, [0.6, 1.2, 3.8, 1, 3.4, 1.8 + mo, 1, 2 + mo], k("#1a0a0a")); poly(c, [1.4, 1.1, 1.8, 2.2, 2.2, 1.1], k("#f0e8d0")); poly(c, [2.8, 1, 3.2, 2.1, 3.6, 1], k("#f0e8d0"));
      c.restore();
      /* Fangarm: beim Zug/Packen weit nach vorn */
      const reach = Q.kind === "pull" || Q.kind === "grab" ? (Q.ph === "pre" ? -eo(Q.pre) * 3 : Q.ph === "act" ? 6 + eo(Q.act) * 8 : (1 - Q.post) * 10) : Q.kind === "combo" && Q.ph === "act" ? 5 : 0;
      line(c, [3, -9 - bob, 6 + reach * 0.5, -11 - bob - reach * 0.2, 8 + reach, -8 - bob + Math.sin(t * 6) * 1], 1.4, k(d.c));
      circ(c, 8 + reach, -8 - bob + Math.sin(t * 6) * 1, 1, k(d.t));
    },
    /* Glutfledermaus: kleine Fledermaus mit glühendem Leib und Glutschweif */
    firebat(c, e, d, k, t, mv, ph) {
      const dive = Q.kind === "dive" && (Q.ph === "act" || Q.ph === "pre"), fl = dive && Q.ph === "act" ? -2 : Math.sin(t * 34) * 4;
      if (dive) c.rotate(Q.ph === "act" ? 0.6 : -0.3 * eo(Q.pre));
      if (!flashOf(k)) glow(c, 0, -4, 11 + (dive ? 4 : 0), "rgba(255,120,40,.7)");
      poly(c, [0, -4, -3, -9 + fl, -7, -7 + fl, -5.4, -5 + fl * 0.4, -3, -3], k(d.c));
      poly(c, [0, -4, 3, -9 - fl, 7, -7 - fl, 5.4, -5 - fl * 0.4, 3, -3], k("#6a2a18")); limb(c, 0.4, -4, 3, -9 - fl, 0.4, k("#ff8a3a")); limb(c, 0.4, -4, 6.6, -7 - fl, 0.35, k("#ff8a3a"));
      ell(c, 0, -4, 2.6, 2.2, k("#5a2216")); ell(c, 0.4, -4.2, 1.7, 1.4, k(d.t)); ell(c, 0.4, -4.3, 0.8, 0.7, k("#ffe8a0"));
      poly(c, [-0.8, -5.6, -1.4, -7.4, -0.2, -6], k(d.c)); poly(c, [0.8, -5.6, 1.4, -7.4, 0.4, -6], k(d.c));
      circ(c, 1.2, -4.6, 0.5, k("#ffe8a0"));
      flame(c, -2, -3.4, 1, 3 + Math.sin(t * 20), k(d.t), -2);
    },
    /* Salamander: Schlangenleib, Echsenoberkörper mit Feuerkamm, Speer */
    salamander(c, e, d, k, t, mv, ph) {
      const cr = Q.ph === "pre" ? eo(Q.pre) : 0, sw = mv ? Math.sin(ph) : Math.sin(t * 2) * 0.4;
      const tail = Q.kind === "hit" ? (Q.ph === "pre" ? -eo(Q.pre) : Q.ph === "act" ? lp(-1, 1, eo(Q.act)) : Q.ph === "post" ? 1 - Q.post : 0) : 0;
      line(c, [2, -3, -3, -1.6 + sw * 0.6, -8, -2.4 - sw * 0.6, -12 - tail * 3, -4 + tail * 3 - (tail > 0.5 ? tail * 4 : 0)], 3.6, k(d.c));
      line(c, [-8, -2.4 - sw * 0.6, -12 - tail * 3, -4 + tail * 3 - (tail > 0.5 ? tail * 4 : 0), -14 - tail * 5, -7 + tail * 4], 2, k(shade(d.c, 0.8)));
      ell(c, 2, -3, 4, 3, k(d.c));
      poly(c, [-1, -4, 4.4, -4, 4, -15 + cr, 0, -15 + cr], k(d.c)); poly(c, [0, -6, 3.6, -6, 3.4, -13 + cr, 0.4, -13 + cr], k(shade(d.c, 1.2)));
      for (let i = 0; i < 5; i++) flame(c, -0.6, -6 - i * 2.2 + cr, 1, 2.4 + Math.sin(t * 9 + i) * 0.8, k(d.t), -1.4);
      c.save(); c.translate(2.6, -17.4 + cr); c.rotate(-Q.hurt * 0.3);
      ell(c, 0, 0, 3, 2.6, k(d.c)); poly(c, [1.2, -1.2, 6, 0.2, 1.4, 1.6], k(d.c)); circ(c, 1.4, -0.8, 0.8, k("#ffe04a"));
      flame(c, -1.4, -1.6, 1.2, 3.6 + Math.sin(t * 11) * 1, k(d.t), -1);
      c.restore();
      const a = Q.kind === "lunge" ? swing(0.15, 0.1, 0.02) : 0.3, r = Q.kind === "lunge" ? (Q.ph === "pre" ? lp(5, 2, eo(Q.pre)) : Q.ph === "act" ? lp(2, 8, eo(Q.act)) : Q.ph === "post" ? lp(8, 5, Q.post) : 5) : 5;
      const h = hand(2.4, -12.6 + cr, a, r); const [hx2, hy2] = arm(c, k, 2.4, -12.6 + cr, h[0], h[1], 3, 3, 1.6, d.c);
      c.save(); c.translate(hx2, hy2); c.rotate(a * 0.4); limb(c, -8, 0, 10, 0, 0.9, k("#3a2a1a")); poly(c, [10, -1.2, 14, 0, 10, 1.2], k("#ffb040")); if (!flashOf(k)) glow(c, 12, 0, 3, "rgba(255,160,60,.6)"); c.restore();
    },
    /* Säureschnecke: großes Haus, schleimiger Leib, Augenstiele; zieht sich ins Haus zurück */
    slug(c, e, d, k, t, mv, ph) {
      const sh = Q.kind === "shell" && (Q.ph === "act" || Q.ph === "pre") ? (Q.ph === "pre" ? eo(Q.pre) : 1) : 0, cr = Q.ph === "pre" ? eo(Q.pre) : 0;
      const wav = mv ? Math.sin(ph) * 0.8 : Math.sin(t * 1.4) * 0.3;
      if (sh < 0.9) {
        const ext = 1 - sh;
        c.fillStyle = k(d.c); c.beginPath(); c.moveTo(-10, 0); c.quadraticCurveTo(-4, -4 - wav, 4 * ext, -6); c.quadraticCurveTo(12 * ext, -6 + cr, 12 * ext + 1, -1); c.lineTo(12 * ext + 2, 0); c.closePath(); c.fill();
        c.fillStyle = k(shade(d.c, 1.25)); c.fillRect(-9, -1.4, 18 * ext + 2, 1.2);
        for (const s of [0, 1]) { const ex = (8 + s * 2) * ext, ey = -11 * ext - 1 + Math.sin(t * 3 + s) * 0.8 - cr; line(c, [(6 + s) * ext, -5, ex, ey], 0.8, k(d.c)); circ(c, ex, ey, 1, k("#e8f0a0")); circ(c, ex + 0.3, ey, 0.5, k("#1a1a10")); }
        if (Q.kind === "lob" && Q.ph === "pre") ell(c, 12 * ext + 1, -3, 1.6 * cr + 0.4, 1.4 * cr + 0.4, k("#c8e060"));
      }
      /* Haus mit Spirale */
      c.save(); c.translate(-2 + sh * 2, -9 + sh * 2);
      ell(c, 0, 0, 7.4, 7, k(d.t)); ell(c, 0.6, 0.4, 5, 4.6, k(shade(d.t, 1.2))); ell(c, 1, 0.6, 2.8, 2.6, k(d.t)); circ(c, 1.2, 0.8, 1, k(shade(d.t, 0.7)));
      for (let i = 0; i < 3; i++) limb(c, -6 + i * 1.4, 2 + i, -4 + i * 1.6, 5.6, 0.5, k(shade(d.t, 0.65)));
      c.restore();
      if (!flashOf(k)) for (let i = 0; i < 2; i++) circ(c, -8 + i * 9 + Math.sin(t + i) * 2, -0.6, 0.9, "rgba(200,230,90,.55)");
    },
    /* Sturm-Mephit: kleiner Luftgeist mit Fledermausflügeln, Wirbelleib und Funkenaugen */
    mephit(c, e, d, k, t, mv, ph) {
      const cr = Q.ph === "pre" ? eo(Q.pre) : 0, fl = Math.sin(t * 16) * 4;
      if (!flashOf(k)) glow(c, 0, -7, 10 + cr * 6, "rgba(230,240,190,.35)");
      poly(c, [-1, -9, -6, -14 + fl, -10, -10 + fl, -6, -8, -3, -6], k(shade(d.c, 0.75)));
      for (let i = 0; i < 3; i++) { c.strokeStyle = k(i % 2 ? d.c : shade(d.c, 1.25)); c.lineWidth = 0.9; c.beginPath(); c.arc(0, -3 + i * 0.6, 3.6 - i, t * 6 + i, t * 6 + i + 4); c.stroke(); }
      ell(c, 0, -8, 3, 3.4, k(d.c));
      c.save(); c.translate(0.8, -12.6); ell(c, 0, 0, 2.6, 2.4, k(d.c)); poly(c, [-1.6, -1.6, -3.4, -4, -0.4, -2], k(shade(d.c, 0.7)));
      circ(c, 1.2, -0.4, 0.7, k(d.t)); if (!flashOf(k)) glow(c, 1.2, -0.4, 2, "rgba(255,250,190,.7)"); c.restore();
      poly(c, [1, -9, 6, -15 - fl, 10, -11 - fl, 6, -8, 3, -6], k(d.c));
      const a = Q.kind === "gust" ? lp(0.6, -1.4, charge()) : Q.kind === "mark" ? lp(0.6, -2.4, charge()) : 0.7, h = hand(1.6, -9, a, 4);
      arm(c, k, 1.6, -9, h[0], h[1], 2.2, 2.2, 1, d.c);
      if (Q.kind === "mark" && Q.ph === "pre" && !flashOf(k)) { star4(c, h[0], h[1] - 1, 1.6 + cr * 2, "#fffbe0", t * 6); }
      if (Q.kind === "gust" && Q.ph === "pre") for (let i = 0; i < 3; i++) limb(c, 4 + i * 2, -12 + i * 3, 8 + i * 2 + cr * 3, -12 + i * 3, 0.5, k("#e8f0d8"));
    }
  });
  Object.assign(DEATH, { drummer: "fall", schildgoblin: "fall", kobold: "fall", cube: "splat", mimic: "flip", kenku: "fall", grimlock: "fall", ghoul: "fall", bellghost: "fade", myconid: "fall", drider: "flip", rustmonster: "flip", quasit: "drop", gargoyle: "crumbleBig", grindylow: "splat", firebat: "drop", salamander: "side", slug: "splat", mephit: "fade" });
  Object.assign(LEANF, { cube: 0.1, mimic: 0.35, drider: 0.3, rustmonster: 0.3, quasit: 0.4, gargoyle: 0.5, grindylow: 0.3, firebat: 0.3, slug: 0.15, mephit: 0.3, bellghost: 0.4, myconid: 0.6 });
  /* ---------- Pracht-Zusätze der neuen Gegner (Grafik-Runde 12, ab Stufe 2, nie bei lean) ----------
     Mehr Volumen und Sekundärbewegung: Gallertwürfel mit Tiefe, Glanzkante und Tropfen; Glutfledermaus mit Glutspur;
     Mephit mit Windfäden; Glockengeist mit Schleierfahnen; Myconid mit Sporen; Salamander mit Hitzeflimmern und Glut;
     Schnecke mit Schleimglanz; Rostmonster mit Rostflocken. Telegrafie: alle neuen Arten zeigen im Anlauf einen
     pulsierenden Warnhof am Boden (warm; „!!“-Angriffe rot). */
  const R12 = () => !lowGfx() && !(Z.gq && Z.gq.lean) && !(Z.gfx && Z.gfx.off && Z.gfx.off.gegnerpracht) && (!Z.gfx || !Z.gfx.lq || Z.gfx.lq() >= 2);
  const NEU12 = ["drummer", "schildgoblin", "kobold", "cube", "mimic", "kenku", "grimlock", "ghoul", "bellghost", "myconid", "drider", "rustmonster", "quasit", "gargoyle", "grindylow", "firebat", "salamander", "slug", "mephit"];
  const EXTRA12 = {
    cube(c, e, d, k, t) { const H = 22, W2 = 11, wob = Math.sin(t * 2.2) * 0.6;
      const g = c.createLinearGradient(0, -H, 0, 0); g.addColorStop(0, "rgba(220,250,190,.10)"); g.addColorStop(1, "rgba(40,80,30,.28)"); c.fillStyle = g; c.fillRect(-W2 + 0.6, -H + 0.6, W2 * 2 - 1.2, H - 0.6);
      c.fillStyle = "rgba(255,255,240,.35)"; c.fillRect(-W2 + 1 + wob * 0.6, -H + 2, 1, H - 5); c.fillRect(-W2 + 3 + wob * 0.6, -H + 1.2, 6, 0.8);
      for (let i = 0; i < 3; i++) { const u = ((t * 0.35 + i / 3) % 1); c.fillStyle = "rgba(170,220,140," + (0.6 * (1 - u)).toFixed(2) + ")"; c.beginPath(); c.ellipse(-6 + i * 6, u * 2.5, 0.8, 0.8 + u * 1.2, 0, 0, Math.PI * 2); c.fill(); }
      c.strokeStyle = "rgba(230,255,210,.22)"; c.lineWidth = 0.4; c.beginPath(); for (let i = 0; i < 3; i++) { const y = -H + 6 + i * 5 + Math.sin(t * 1.5 + i) * 1.2; c.moveTo(-W2 + 2, y); c.quadraticCurveTo(0, y - 1.5, W2 - 2, y + 0.5); } c.stroke(); },
    firebat(c, e, d, k, t) { if (Math.random() < 0.35) Z.fx.p({ x: e.x + e.w / 2 - e.face * 3, y: e.y + e.h - 4, vx: -e.face * 10 + (Math.random() - 0.5) * 10, vy: 10 + Math.random() * 10, life: 0.5, size: 1, col: Math.random() < 0.5 ? "#ffb040" : "#ff6a1a", kind: "glow", add: true });
      c.strokeStyle = "rgba(255,180,90,.35)"; c.lineWidth = 0.3; c.beginPath(); c.moveTo(0, -4); c.lineTo(-5, -8); c.moveTo(0, -4); c.lineTo(5, -8); c.stroke(); },
    mephit(c, e, d, k, t) { c.strokeStyle = "rgba(240,245,225,.45)"; c.lineWidth = 0.5; for (let i = 0; i < 3; i++) { const a0 = t * 5 + i * 2.1; c.beginPath(); c.ellipse(0, -7, 6 + i * 1.6, 3 + i, 0.3, a0, a0 + 1.6); c.stroke(); } },
    bellghost(c, e, d, k, t) { for (let i = 0; i < 3; i++) { const sw = Math.sin(t * 2 + i * 1.7) * 2; c.fillStyle = "rgba(230,225,215," + (0.18 - i * 0.04).toFixed(2) + ")"; c.beginPath(); c.moveTo(-5 + i * 3, -6); c.quadraticCurveTo(-6 + i * 3 + sw, 2, -4 + i * 3 + sw * 1.6, 6 + i * 2); c.lineTo(-2 + i * 3, -6); c.fill(); } },
    myconid(c, e, d, k, t) { if (Math.random() < 0.12) Z.fx.p({ x: e.x + e.w / 2 + (Math.random() - 0.5) * 10, y: e.y + 4, vx: (Math.random() - 0.5) * 8, vy: -6 - Math.random() * 8, life: 1.6, size: 1.1, col: Math.random() < 0.5 ? "#e8c8d8" : "#d8e8b0", kind: "glow", g: -4, add: true });
      c.fillStyle = "rgba(255,240,245,.25)"; c.beginPath(); c.ellipse(-2, -19, 4, 1.2, -0.2, 0, Math.PI * 2); c.fill(); },
    salamander(c, e, d, k, t) { if (Math.random() < 0.25) Z.fx.p({ x: e.x + e.w / 2 + (Math.random() - 0.5) * 8, y: e.y + 2, vx: (Math.random() - 0.5) * 6, vy: -20 - Math.random() * 20, life: 0.7, size: 0.9, col: "#ffc060", kind: "glow", add: true });
    },
    slug(c, e, d, k, t) { c.fillStyle = "rgba(240,255,200,.35)"; c.beginPath(); c.ellipse(2, -4.6, 6, 0.8, -0.1, 0, Math.PI * 2); c.fill(); c.fillStyle = "rgba(255,255,255,.45)"; c.beginPath(); c.ellipse(-4.5, -12.5, 2.2, 1, -0.6, 0, Math.PI * 2); c.fill(); },
    rustmonster(c, e, d, k, t, mv) { if (mv && Math.random() < 0.2) Z.fx.p({ x: e.x + e.w / 2 + (Math.random() - 0.5) * e.w, y: e.y + e.h * 0.4, vx: (Math.random() - 0.5) * 20, vy: -10, life: 0.6, size: 1, col: Math.random() < 0.5 ? "#a0501e" : "#c87a3a", kind: "shard", g: 300 }); }
  };
  /* ---------- Bosse (Grafik-Runde 13, ab Stufe 2, nie lean) ----------
     Für alle Bosse: sichtbare Phasen – ab halber Lebenskraft steigen Glut/Funken in Bossfarbe auf und beim Schwellen-
     übertritt (50 %, 25 %) fallen Rüstungs- bzw. Körperteile ab; unter 25 % Wut: pulsierender Hof hinter dem Körper,
     schnelleres Funkeln. Dazu Sekundärbewegung für die schwächer wirkenden Bosse: Wraith (wehende Schattenfetzen,
     Seelenfunken), Chasme (flirrende Flügel, Summlinien, Tropfen am Rüssel), Vrock (lose Federn, Sporenwolke), Weberin
     (Seidenfaden nach oben, Augenkranz, Sanduhr-Zeichnung), Glasstab (kreisende Glasscherben, Runenkreis). */
  const BKEY = new WeakMap();
  const bossKey = d => { if (!d || !d.boss || !Z.BOSSDEF) return null; let k = BKEY.get(d); if (k !== undefined) return k; k = null; for (const id in Z.BOSSDEF) if (Z.BOSSDEF[id] === d || (Z.BOSSDEF[id].shape === d.shape && Z.BOSSDEF[id].c === d.c)) { k = id; break; } BKEY.set(d, k); return k; };
  const hx2rgb = h => { const n = parseInt(String(h || "#ff8040").slice(1), 16); return ((n >> 16) & 255) + "," + ((n >> 8) & 255) + "," + (n & 255); };
  const BOSS13 = {
    wraith(c, e, d, k, t) { for (let i = 0; i < 4; i++) { const sw = Math.sin(t * 2.4 + i * 1.3) * 3; c.fillStyle = "rgba(20,14,30," + (0.55 - i * 0.1).toFixed(2) + ")"; c.beginPath(); c.moveTo(-6 + i * 4, -8); c.quadraticCurveTo(-8 + i * 4 + sw, 2, -10 + i * 4 + sw * 1.8, 8 + i * 2); c.lineTo(-3 + i * 4, -6); c.fill(); }
      if (Math.random() < 0.3) Z.fx.p({ x: e.x + e.w / 2 + (Math.random() - 0.5) * e.w, y: e.y + e.h * 0.4, vx: (Math.random() - 0.5) * 10, vy: -16, life: 0.9, size: 1.2, col: "#b890ff", kind: "glow", g: -10, add: true }); },
    chasme(c, e, d, k, t) { const fl = Math.sin(t * 40); c.fillStyle = "rgba(230,230,220,.14)"; for (const s2 of [-1, 1]) { c.beginPath(); c.ellipse(-2, -18 + s2 * 2, 16, 5 + fl * 2, -0.4 * s2, 0, Math.PI * 2); c.fill(); }
      c.strokeStyle = "rgba(255,255,240,.25)"; c.lineWidth = 0.4; for (let i = 0; i < 3; i++) { c.beginPath(); c.arc(-4, -16, 20 + i * 4, -2.4 + (t * 2 + i) % 0.6, -2.0 + (t * 2 + i) % 0.6); c.stroke(); }
      if (Math.random() < 0.08) Z.fx.p({ x: e.x + e.w / 2 + e.face * e.w * 0.5, y: e.y + e.h * 0.6, vx: 0, vy: 20, life: 0.7, size: 1.2, col: "#c03a2a", kind: "drop", g: 400 }); },
    vrock(c, e, d, k, t) { if (Math.random() < 0.06) Z.fx.p({ x: e.x + Math.random() * e.w, y: e.y + e.h * 0.3, vx: (Math.random() - 0.5) * 20, vy: 10, life: 2.2, size: 1.8, col: "#2a2a24", kind: "leaf", g: 60, drag: 0.94 });
      if (Math.random() < 0.15) Z.fx.p({ x: e.x + e.w / 2 + (Math.random() - 0.5) * e.w, y: e.y + e.h * 0.5, vx: (Math.random() - 0.5) * 12, vy: -6, life: 1.4, size: 1.6, col: "rgba(150,140,90,.6)", kind: "smoke", g: -4 });
      c.strokeStyle = "rgba(255,230,200,.18)"; c.lineWidth = 0.6; c.beginPath(); c.moveTo(-10, -26); c.quadraticCurveTo(0, -34, 14, -30); c.stroke(); },
    weberin(c, e, d, k, t) { const by = -6.6 + (Q.ph === "pre" ? eo(Q.pre) * 1.6 : 0) + Math.sin(t * 2) * 0.2;
      c.strokeStyle = "rgba(230,220,240,.35)"; c.lineWidth = 0.3; c.beginPath(); c.moveTo(-10.6, by - 1); c.lineTo(-10.6 + Math.sin(t) * 0.8, -60); c.stroke();
      /* Sanduhr auf dem Hinterleib, glimmend */
      const gl = 0.55 + 0.25 * Math.sin(t * 2.4); c.fillStyle = "rgba(255,60,70," + gl.toFixed(2) + ")"; c.beginPath(); c.moveTo(-6.2, by - 3.4); c.lineTo(-2.6, by - 3.4); c.lineTo(-4.4, by - 1); c.closePath(); c.fill(); c.beginPath(); c.moveTo(-6.2, by + 1.6); c.lineTo(-2.6, by + 1.6); c.lineTo(-4.4, by - 0.8); c.closePath(); c.fill();
      glow(c, -4.4, by - 1, 4, "rgba(255,60,70," + (gl * 0.5).toFixed(2) + ")");
      /* Augenkranz: acht Augen im Bogen über dem Kopfbruststück */
      for (let i = 0; i < 8; i++) { const a = Math.PI * (1.15 + i * 0.1), ex = 2.6 + Math.cos(a) * -2.4, ey = by - 0.6 + Math.sin(a) * 2.2; c.fillStyle = "rgba(255," + (60 + (i % 3) * 30) + ",60," + (0.75 + 0.2 * Math.sin(t * 3 + i)).toFixed(2) + ")"; c.beginPath(); c.arc(ex, ey, i % 2 ? 0.35 : 0.45, 0, Math.PI * 2); c.fill(); }
    },
    glasstab(c, e, d, k, t) { for (let i = 0; i < 4; i++) { const a = t * 1.4 + i * Math.PI / 2, x = Math.cos(a) * 12, y = -18 + Math.sin(a) * 4; c.fillStyle = "rgba(220,240,230," + (0.5 + 0.3 * Math.sin(a)).toFixed(2) + ")"; c.save(); c.translate(x, y); c.rotate(a * 2); c.beginPath(); c.moveTo(0, -2.4); c.lineTo(1.4, 1); c.lineTo(-1.2, 1.4); c.fill(); c.restore(); }
      c.strokeStyle = "rgba(229,180,84," + (0.3 + 0.15 * Math.sin(t * 2)).toFixed(2) + ")"; c.lineWidth = 0.6; c.beginPath(); c.ellipse(0, -0.5, 14, 2.4, 0, 0, Math.PI * 2); c.stroke(); for (let i = 0; i < 8; i++) { const a = t * 0.5 + i / 8 * Math.PI * 2; c.fillStyle = "rgba(229,180,84,.5)"; c.fillRect(Math.cos(a) * 12 - 0.5, -0.5 + Math.sin(a) * 2 - 0.5, 1, 1); } }
  };
  function bossPhase(c, e, d, k, t, before) {
    const f = e.hpMax ? e.hp / e.hpMax : 1, rgb = hx2rgb(d.t || d.c);
    if (before) {
      if (f < 0.25) { const a = 0.22 + 0.14 * Math.sin(t * 9); const g = c.createRadialGradient(0, -e.h * 0.5, 2, 0, -e.h * 0.5, Math.max(e.w, e.h) * 0.9); g.addColorStop(0, "rgba(255,60,40," + a.toFixed(2) + ")"); g.addColorStop(1, "rgba(255,60,40,0)"); c.fillStyle = g; c.beginPath(); c.arc(0, -e.h * 0.5, Math.max(e.w, e.h) * 0.9, 0, Math.PI * 2); c.fill(); }
      return;
    }
    const ph = f < 0.25 ? 2 : f < 0.5 ? 1 : 0;
    if (e._ph13 == null) e._ph13 = ph;
    if (ph > e._ph13) { e._ph13 = ph; Z.fx.burst(e.x + e.w / 2, e.y + e.h * 0.4, 10 + ph * 6, { col: [d.c || "#5a5a5a", d.t || "#ffd27a", "#3a3434"], sp: 160, ang: -Math.PI / 2, spread: 2.6, life: 1.1, size: 2.4, kind: "shard", g: 600, drag: 0.96 }); Z.fx.ring && Z.fx.ring(e.x + e.w / 2, e.y + e.h / 2, 40 + e.w, "rgba(" + rgb + ",.8)", 0.4, 3); }
    if (ph >= 1 && Math.random() < (ph === 2 ? 0.5 : 0.22)) Z.fx.p({ x: e.x + Math.random() * e.w, y: e.y + e.h * (0.2 + Math.random() * 0.6), vx: (Math.random() - 0.5) * 16, vy: -24 - Math.random() * 24, life: 0.8, size: 1.1 + ph * 0.3, col: "rgb(" + rgb + ")", kind: "glow", g: -20, add: true });
  }
  for (const sh of ["human", "kuotoa", "bugbear", "wraith", "golem", "wasp", "druidin", "giant", "vulture", "dragon", "spider"]) {
    const f0 = SHAPES[sh]; if (!f0) continue;
    SHAPES[sh] = function (c, e, d, k, t, mv, ph, ak) {
      const on = d && d.boss && R12() && !flashOf(k) && e && !e.dead && !(Z.gfx && Z.gfx.off && Z.gfx.off.bosspracht);
      if (!on) return f0.apply(this, arguments);
      const key = bossKey(d);
      c.save(); try { bossPhase(c, e, d, k, t, true); } catch (err) { } c.restore();
      const r = f0.apply(this, arguments);
      c.save(); try { if (key && BOSS13[key]) BOSS13[key](c, e, d, k, t); bossPhase(c, e, d, k, t, false); } catch (err) { } c.restore();
      return r;
    };
  }
  /* ---------- Ältere Gegner (Grafik-Runde 13, ab Stufe 2, nie lean) ----------
     Gleiche Telegrafie wie die neuen Arten (Warnhof am Boden im Anlauf) und etwas Sekundärbewegung: Skelette mit
     glimmenden Augenhöhlen und Knochenstaub, Zombies mit Fliegenschwarm, Kuo-Toa mit Wassertropfen und Glanz,
     Ratten mit zuckendem Schwanzstaub. */
  const OLD13X = {
    skel(c, e, d, k, t, mv) { c.fillStyle = "rgba(160,255,190," + (0.35 + 0.2 * Math.sin(t * 3)).toFixed(2) + ")"; c.beginPath(); c.arc(1.6, -e.h + 4.2, 1.6, 0, Math.PI * 2); c.fill(); if (mv && Math.random() < 0.15) Z.fx.p({ x: e.x + e.w / 2, y: e.y + e.h - 2, vx: (Math.random() - 0.5) * 12, vy: -8, life: 0.5, size: 1, col: "#d8d0bc", kind: "dot", g: 80 }); },
    zombie(c, e, d, k, t) { c.fillStyle = "rgba(20,16,12,.8)"; for (let i = 0; i < 4; i++) { const a = t * (4 + i) + i * 1.7, r = 6 + i * 1.5; c.fillRect(Math.cos(a) * r, -e.h + 2 + Math.sin(a * 1.3) * 3, 1, 0.8); } },
    kuotoa(c, e, d, k, t) { c.fillStyle = "rgba(230,255,240,.28)"; c.beginPath(); c.ellipse(-1.5, -e.h * 0.6, 1.2, e.h * 0.18, 0.1, 0, Math.PI * 2); c.fill(); if (Math.random() < 0.05) Z.fx.p({ x: e.x + e.w / 2 + (Math.random() - 0.5) * e.w, y: e.y + e.h * 0.5, vx: 0, vy: 10, life: 0.6, size: 1, col: "#b8e0c8", kind: "drop", g: 400 }); },
    goblin(c, e, d, k, t, mv) { const hy = -e.h + 6.5; c.fillStyle = "rgba(255,230,90," + (0.5 + 0.3 * Math.sin(t * 5)).toFixed(2) + ")"; c.beginPath(); c.arc(2.6, hy, 0.7, 0, Math.PI * 2); c.fill();
      c.fillStyle = "rgba(255,240,200,.25)"; c.beginPath(); c.ellipse(-1.5, hy - 1.5, 2.2, 0.8, -0.3, 0, Math.PI * 2); c.fill();
      if (mv && Math.random() < 0.12) Z.fx.p({ x: e.x + e.w / 2 - e.face * 4, y: e.y + e.h - 1, vx: -e.face * 14, vy: -10, life: 0.4, size: 1.2, col: Z.dustCol || "#8a7a70", kind: "dot", g: 80 }); },
    human(c, e, d, k, t, mv) { const sw = mv ? Math.sin(t * 9) : Math.sin(t * 1.6) * 0.5, col = d.c || "#6a2020";
      c.fillStyle = col; for (let i = 0; i < 3; i++) { const x = -4 + i * 3.2; c.beginPath(); c.moveTo(x, -3); c.lineTo(x + 2.6, -3); c.lineTo(x + 1.4 + sw * (0.8 + i * 0.3), 0.4 + (i % 2) * 0.6); c.fill(); }
      c.fillStyle = "rgba(255,230,200,.10)"; c.fillRect(-4.5, -e.h * 0.62, 1.2, e.h * 0.5);
      if (/robe|adept|kult/i.test(JSON.stringify(d.n || ""))) { const a = 0.25 + 0.2 * Math.sin(t * 2.2); c.strokeStyle = "rgba(255,190,110," + a.toFixed(2) + ")"; c.lineWidth = 0.4; c.beginPath(); c.arc(0.4, -e.h * 0.55, 1.6, 0, Math.PI * 2); c.moveTo(0.4, -e.h * 0.55 - 2.2); c.lineTo(0.4, -e.h * 0.55 + 2.2); c.stroke(); } },
    rat(c, e, d, k, t, mv) { if (mv && Math.random() < 0.12) Z.fx.p({ x: e.x + e.w / 2 - e.face * e.w * 0.5, y: e.y + e.h - 1, vx: -e.face * 10, vy: -6, life: 0.4, size: 1, col: Z.dustCol || "#8a7a70", kind: "dot", g: 60 }); }
  };
  const OLDSKIP = new Set(NEU12.concat(["dummy"]));
  for (const sh of Object.keys(SHAPES)) {
    if (OLDSKIP.has(sh)) continue; const f0 = SHAPES[sh]; if (typeof f0 !== "function") continue;
    SHAPES[sh] = function (c, e, d, k, t, mv, ph, ak) {
      const on = d && !d.boss && R12() && !flashOf(k) && e && !e.dead;
      if (on && Q.ph === "pre" && !d.fly) { const a = 0.25 + 0.25 * Math.sin(t * 18), red = e.act && e.act.a && (e.act.a.glyph === "!!" || e.act.a.unblockable), w = Math.max(8, e.w * 0.9); c.fillStyle = red ? "rgba(255,70,50," + (a * (0.6 + Q.pre * 0.6)).toFixed(2) + ")" : "rgba(255,190,90," + (a * (0.5 + Q.pre * 0.5)).toFixed(2) + ")"; c.beginPath(); c.ellipse(0, -0.5, w * (0.7 + Q.pre * 0.5), 1.8, 0, 0, Math.PI * 2); c.fill(); }
      const r = f0.apply(this, arguments);
      if (on && OLD13X[sh]) { c.save(); try { OLD13X[sh](c, e, d, k, t, mv); } catch (err) { } c.restore(); }
      return r;
    };
  }
  for (const sh of NEU12) {
    const f0 = SHAPES[sh]; if (!f0) continue;
    SHAPES[sh] = function (c, e, d, k, t, mv, ph, ak) {
      const on = R12() && !flashOf(k) && e && !e.dead;
      /* Telegrafie: Warnhof am Boden während des Anlaufs */
      if (on && Q.ph === "pre" && !d.fly) { const a = 0.25 + 0.25 * Math.sin(t * 18), red = e.act && e.act.a && (e.act.a.glyph === "!!" || e.act.a.unblockable); const w = Math.max(8, e.w * 0.9); c.fillStyle = red ? "rgba(255,70,50," + (a * (0.6 + Q.pre * 0.6)).toFixed(2) + ")" : "rgba(255,190,90," + (a * (0.5 + Q.pre * 0.5)).toFixed(2) + ")"; c.beginPath(); c.ellipse(0, -0.5, w * (0.7 + Q.pre * 0.5), 1.8, 0, 0, Math.PI * 2); c.fill(); }
      const r = f0.apply(this, arguments);
      if (on && EXTRA12[sh]) { c.save(); try { EXTRA12[sh](c, e, d, k, t, mv, ph); } catch (err) { } c.restore(); }
      return r;
    };
  }
  /* Trainingspuppe im Lager */
  SHAPES.dummy = function (c, e, d, k, t) {
    const wob = Math.sin(t * 9) * (e.flash > 0 || e.wob > 0 ? 0.25 : 0.02);
    c.rotate(wob);
    limb(c, 0, 0, 0, -26, 2.6, k("#6a4a2a")); limb(c, -9, -18, 9, -18, 2.4, k("#6a4a2a"));
    ell(c, 0, -15, 6, 8, k("#b09a6a")); circ(c, 0, -27, 4.5, k("#c8b080"));
    c.strokeStyle = k("#7a6a4a"); c.lineWidth = 0.6; for (let i = -4; i <= 4; i += 2) { c.beginPath(); c.moveTo(i, -21); c.lineTo(i * 1.2, -9); c.stroke(); }
    limb(c, -6, -12, 6, -12, 1, k("#5a3a1a"));
    c.fillStyle = k("#8a1a1a"); c.fillRect(-2.5, -28, 5, 1.2); c.fillRect(-0.6, -30, 1.2, 5);
    for (let i = -1; i <= 1; i += 2) poly(c, [i * 9, -19, i * 11, -18, i * 9, -17], k("#c8b080"));
  };
  Z.SHAPES = SHAPES;

  /* ---------- Hilfen der Gestalten ---------- */
  const SHADE = new Map();
  /* Farbe abdunkeln (f<1) oder aufhellen (f>1); nur #rgb/#rrggbb, sonst unverändert */
  function shade(col, f) {
    f = f == null ? 0.72 : f;
    const key = col + f; let r = SHADE.get(key); if (r) return r;
    if (typeof col !== "string" || col[0] !== "#") return col;
    let h = col.slice(1); if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    const n = parseInt(h, 16); if (isNaN(n)) return col;
    const ch = v => Math.max(0, Math.min(255, Math.round(f > 1 ? v + (255 - v) * (f - 1) : v * f)));
    r = "#" + [(n >> 16) & 255, (n >> 8) & 255, n & 255].map(v => ch(v).toString(16).padStart(2, "0")).join("");
    if (SHADE.size > 600) SHADE.clear(); SHADE.set(key, r); return r;
  }
  const flashOf = k => k("#000") !== "#000";
  function humanWeapon(d) {
    if (d.bow) return "bow"; if (d.xbow) return "xbow"; if (d.staff) return "staff"; if (d.spear) return "spear";
    if (d.bottle) return "bottle"; if (d.mace) return "mace"; if (d.scim) return "scim"; if (d.sword) return "sword"; if (d.bald) return "torch";
    if (d.chain === 1 || (d.atks && d.atks.some(a => a.k === "pull"))) return "chain"; return "sword";
  }
  /* Skelett zerfällt: Knochen fallen auseinander, Schädel kullert */
  function skelCrumble(c, k, dt, bone, bone2, bow) {
    const g = (v0, y0, tt) => Math.min(0, y0 + v0 * tt + 260 * tt * tt);
    const tt = Math.min(dt, 0.6);
    const parts = [[-2, -6, -1, -15, 1.4, 4], [2, -6, 1.6, -10, 1.4, -3], [0, -14, -2.4, -20, 1.6, 2], [-1, -17, 3, -25, 1.2, -5], [1, -12, -3.6, -12, 1.2, 6]];
    for (const [x, y, vx, vy, w, rs] of parts) {
      const px = x + vx * tt * 6, py = g(vy, y, tt);
      c.save(); c.translate(px, py - 0.6); c.rotate(rs * tt); limb(c, -2.6, 0, 2.6, 0, w, k(bone)); c.restore();
    }
    const sx = 1 + tt * 14, sy = g(-30, -21, tt) - 2.6;
    c.save(); c.translate(sx, sy); c.rotate(tt * 8); circ(c, 0, 0, 2.8, k(bone)); c.fillStyle = k("#1a1010"); c.fillRect(0.6, -0.8, 1.2, 1.2); c.fillRect(-1.2, -0.8, 1, 1); c.restore();
    if (!bow) { c.save(); c.translate(6 + tt * 6, -1); c.rotate(0.1); poly(c, [-1, -0.8, 9, -0.6, 11, 0.2, 9, 0.8, -1, 0.8], k("#9a9282")); c.restore(); }
  }
  /* Golem zerbricht in Steinblöcke, die Runenglut erlischt */
  function golemCrumble(c, k, dt, d) {
    const tt = Math.min(dt, 0.8);
    const blocks = [[-6, -20, -20, -60, 5], [6, -20, 24, -70, 5], [0, -28, 4, -90, 4], [-4, -10, -10, -20, 4], [4, -10, 12, -26, 4], [9, -18, 30, -40, 3]];
    for (const [x, y, vx, vy, r] of blocks) {
      const px = x + vx * tt, py = Math.min(-r * 0.7, y + vy * tt + 300 * tt * tt);
      c.save(); c.translate(px, py); c.rotate(vx * tt * 0.05); poly(c, [-r, -r * 0.8, r, -r, r * 1.1, r * 0.8, -r * 0.9, r], k(d.c)); poly(c, [-r, -r * 0.8, 0, -r * 0.9, -r * 0.2, r * 0.9, -r * 0.9, r], k(shade(d.c))); c.restore();
    }
    const gk = Math.max(0, 1 - dt * 2);
    if (gk > 0) glow(c, 0, -15, 12 * gk, "rgba(255,170,60,.6)");
  }

  /* ======================= GEFÄHRTEN ======================= */
  Z.drawRex = function (c, x, y, face, t, run, sit) {
    c.save(); c.translate(x, y); c.scale(face, 1);
    const b = run ? Math.sin(run * PI) : 0;
    const wag = Math.sin(t * 14) * 2;
    /* Schwanz */
    c.strokeStyle = "#8a5a2a"; c.lineWidth = 1.6; c.lineCap = "round"; c.beginPath(); c.moveTo(-7, -9 + (sit ? 1 : 0)); c.quadraticCurveTo(-10, -11, -11, -13 + wag); c.stroke();
    if (sit) { limb(c, -4, -5, -6, 0, 2.2, "#6a4a2a"); ell(c, -5, -0.4, 2.2, 1, "#5a3a1a"); }
    else for (const [xx, p] of [[-4, -b], [-6, b]]) { limb(c, xx, -5, xx + p * 2.5, 0, 1.6, "#5a3a1a"); }
    ell(c, -1, -8 + (sit ? 1 : 0), 7, 4, "#8a5a2a"); ell(c, 0, -7, 5, 2.4, "#c89a6a");
    ell(c, -2.4, -10.4 + (sit ? 1 : 0), 3, 1.4, "#6a4020");
    if (sit) { limb(c, 3, -5, 3, 0, 1.6, "#6a4a2a"); limb(c, 1.4, -5, 1.6, 0, 1.6, "#5a3a1a"); }
    else for (const [xx, p] of [[3, b], [1, -b]]) limb(c, xx, -5, xx + p * 2.5, 0, 1.6, "#6a4a2a");
    /* Kopf */
    const hb = sit ? Math.sin(t * 2) * 0.3 : b * 0.5;
    circ(c, 6, -12 + hb, 3.6, "#8a5a2a"); ell(c, 9, -11 + hb, 2.6, 1.8, "#a07040"); circ(c, 11, -11.5 + hb, 0.8, "#1a1010");
    poly(c, [4, -15 + hb, 5, -11 + hb, 3, -12 + hb], "#5a3a1a"); c.fillStyle = "#1a1010"; c.fillRect(6.5, -13.5 + hb, 1, 1);
    if (run || sit) { const tg = sit ? 0.6 + Math.sin(t * 6) * 0.3 : 1; ell(c, 9.6, -9.4 + hb, 1, 1.4 * tg, "#d85a6a"); }
    limb(c, 3, -11 + hb, 5, -10 + hb, 1, "#c03a3a"); circ(c, 4.4, -9.6 + hb, 0.6, "#e5b454");
    c.restore();
  };
  Z.drawAlly = function (c, a, t) {
    if (a.kind === "rex") { Z.drawRex(c, a.x + a.w / 2, a.y + a.h, a.face, t, a.run, false); return; }
    if (a.kind === "illusion") {
      c.save(); c.globalAlpha = 0.6 + 0.2 * Math.sin(t * 8); c.translate(a.x + a.w / 2, a.y + a.h); c.scale(0.28, 0.28);
      SHAPES.demogorgon(c, a, {}, x => x, t, false, 0, 0); c.restore();
    }
  };

  /* Lager-Figuren (Barradin, Friedrich, Echo, Nundro) */
  Z.drawNPC = function (c, id, x, y, t, face) {
    c.save(); c.translate(x, y); c.scale(face || 1, 1);
    const breathe = Math.sin(t * 2) * 0.4;
    c.save(); c.globalAlpha *= 0.25; ell(c, 0, 0.4, 6, 1.3, "#000"); c.restore();
    if (id === "B") { /* Barradin: Elf, Barde mit Laute, wippt im Takt */
      const beat = Math.abs(Math.sin(t * 4)) * 0.5;
      limb(c, -2, -10, -2.4, 0, 2.6, "#3a2a40"); limb(c, 2, -10, 2.6 + beat * 0.6, 0, 2.6, "#4a3450");
      ell(c, -2.2, -0.2, 1.8, 0.9, "#2a1a1a"); ell(c, 3, -0.2 - beat * 0.4, 1.8, 0.9, "#3a2420");
      /* Umhang */
      poly(c, [-3.6, -20 - breathe, -6.4 + Math.sin(t * 1.6) * 0.6, -6, -3, -7], "#8a3a2a");
      poly(c, [-4.5, -9, 4.5, -9, 4, -20 - breathe, -4, -20 - breathe], "#6a2a6a");
      poly(c, [-4.5, -9, -1.4, -9, -1.6, -20 - breathe, -4, -20 - breathe], "#4e1e4e");
      poly(c, [-4.6, -9.4, 4.6, -9.4, 5, -6, 2.6, -7, 0, -5.6, -2.6, -7, -5, -6], "#6a2a6a");
      limb(c, -4, -12, 4, -12, 1, "#e5b454"); circ(c, 1.6, -12, 0.8, "#ffe08a");
      limb(c, -1, -19.6 - breathe, 3.4, -13, 0.6, "#e5b454");
      /* Kopf */
      c.save(); c.translate(0.5, -23 - breathe); c.rotate(Math.sin(t * 4) * 0.06);
      circ(c, 0, 0, 3.2, "#e8c8a8"); poly(c, [2.6, -0.4, 3.8, 0.4, 2.8, 0.9], "#e8c8a8");
      poly(c, [-3.6, 1.2, -3.2, -3.4, 2.6, -3.6, 3.4, -1.6, -0.4, -2.2, -2.2, 3.6], "#e8d090");
      poly(c, [2.4, -1, 5.6, -3.4, 3, -0.2], "#e8c8a8");
      c.fillStyle = "#3a2a1a"; c.fillRect(1.6, -0.8, 1, 0.9); limb(c, 1.4, 1.6, 2.8, 1.4, 0.5, "#a0604a");
      poly(c, [-4, -3, 4, -3, 2, -6.4, -3, -6], "#4a2a5a"); limb(c, -4.4, -3, 4.4, -3, 1, "#3a1a4a");
      c.strokeStyle = "#e04a4a"; c.lineWidth = 0.8; c.beginPath(); c.moveTo(-2, -5.4); c.quadraticCurveTo(-5, -9, -8, -8.6 + Math.sin(t * 3) * 0.6); c.stroke();
      c.restore();
      /* Laute und spielende Hände */
      c.save(); c.translate(1.6, -15); c.rotate(-0.5);
      ell(c, 0, 0, 4.6, 3.6, "#a06a30"); ell(c, -0.4, 0, 3.6, 2.6, "#c08040"); circ(c, 0.4, 0, 1.2, "#3a2010");
      limb(c, 3, -0.8, 11, -4, 1.4, "#6a4a2a"); limb(c, 10.4, -3.8, 12, -4.6, 1.8, "#4a2a1a");
      for (let i = -1; i <= 1; i++) limb(c, -2.6, i * 0.5, 11, -4 + i * 0.3, 0.2, "rgba(255,240,200,.7)");
      c.restore();
      limb(c, -2, -19 - breathe, 6.6, -18.6 + Math.sin(t * 1.5) * 0.6, 1.8, "#6a2a6a"); circ(c, 6.8, -18.6 + Math.sin(t * 1.5) * 0.6, 1, "#e8c8a8");
      const st = Math.sin(t * 8) * 1.4;
      limb(c, 1, -18 - breathe, 2.6, -14 + st, 1.8, "#6a2a6a"); circ(c, 2.8, -13.6 + st, 1, "#e8c8a8");
      /* schwebende Noten */
      for (let i = 0; i < 2; i++) { const p = (t * 0.5 + i * 0.5) % 1; c.save(); c.globalAlpha *= Math.sin(p * PI) * 0.8; const nx = 6 + p * 6 + Math.sin(p * 9 + i) * 1.4, ny = -18 - p * 12; circ(c, nx, ny, 0.9, "#ffd27a"); limb(c, nx + 0.8, ny, nx + 0.8, ny - 3, 0.4, "#ffd27a"); c.restore(); }
    } else if (id === "G") { /* Friedrich: Waldläufer mit Bogen, prüft einen Pfeil */
      limb(c, -2, -10, -2, 0, 3, "#3a3020"); limb(c, 2, -10, 2.4, 0, 3, "#4a4028");
      ell(c, -1.6, -0.2, 2, 0.9, "#2a1e14"); ell(c, 3, -0.2, 2, 0.9, "#3a2a1a");
      /* Köcher */
      c.save(); c.translate(-3.6, -16); c.rotate(-0.3); poly(c, [-1.4, -4, 1.4, -4, 1.2, 4, -1.2, 4], "#5a3a22"); for (let i = 0; i < 3; i++) { limb(c, -0.8 + i * 0.8, -4, -1 + i, -7, 0.5, "#c8a070"); poly(c, [-1.6 + i, -7, -1 + i, -8.4, -0.4 + i, -7], "#e8e0d0"); } c.restore();
      poly(c, [-4.5, -9, 4.5, -9, 4, -20 - breathe, -4, -20 - breathe], "#3a5a2a");
      poly(c, [-4.5, -9, -1.4, -9, -1.6, -20 - breathe, -4, -20 - breathe], "#2a4220");
      poly(c, [-4.6, -9.4, 4.6, -9.4, 4.4, -6.4, -4.4, -6.4], "#3a5a2a");
      limb(c, -4, -13, 4, -13, 1, "#6a4a2a"); limb(c, -3.6, -20 - breathe, 3.6, -11, 0.8, "#6a4a2a");
      c.save(); c.translate(0.5, -23 - breathe);
      circ(c, 0, 0, 3.2, "#e0b890"); poly(c, [2.6, -0.4, 3.8, 0.4, 2.8, 0.9], "#e0b890");
      poly(c, [-3.5, 1, -3.5, -3, 3, -4, 4, -1, 0, -1.6], "#6a4a2a");
      poly(c, [0.6, 2, 3.6, 1.6, 3, 3.4, 1, 3.4], "#7a5a3a");
      c.fillStyle = "#2a2014"; c.fillRect(1.6, -0.6, 1, 0.9);
      poly(c, [-5, 3, -3.6, -4.6, 2, -5, 4.6, -1.6, 2.4, -3, -2, -2.4, -3, 3.4], "#2a4a20");
      c.restore();
      /* Bogen in der hinteren Hand, Pfeil in der vorderen (dreht ihn prüfend) */
      c.save(); c.translate(-4, -16); weapon(c, "bow", "#7a5a30", t, 0); c.restore();
      limb(c, -2, -19 - breathe, -4, -15, 1.8, "#3a5a2a");
      const tw = Math.sin(t * 1.3) * 0.4;
      limb(c, 1, -19 - breathe, 4.6, -15.6, 1.8, "#3a5a2a"); circ(c, 4.8, -15.4, 1, "#e0b890");
      c.save(); c.translate(4.8, -15.4); c.rotate(-0.9 + tw); limb(c, -4, 0, 5, 0, 0.6, "#c8a070"); poly(c, [5, -1, 7, 0, 5, 1], "#d8d0c8"); poly(c, [-4, -1, -2.4, 0, -4, 1], "#c03a2a"); c.restore();
    } else if (id === "E") { /* Echo: gehörnter Druide, sitzt auf Goldsack */
      ell(c, 0, -3, 7.4, 4.2, "#6a5a3a"); ell(c, -1, -4, 5, 2.4, "#7a6a48"); limb(c, -1, -7, 1, -6, 1, "#4a3a22");
      for (const [cx2, cy2] of [[-4, -6], [3, -6.5], [5.6, -2], [-6, -1.6]]) { circ(c, cx2, cy2, 1.8, "#e5b454"); circ(c, cx2 - 0.4, cy2 - 0.4, 0.7, "#fff0a0"); }
      if (Math.sin(t * 2.3) > 0.97) glow(c, 3, -7, 4, "rgba(255,230,140,.8)");
      limb(c, -2, -6, 2, -1, 2.4, "#d8d0c0"); limb(c, 2, -6, 5, -1.4, 2.4, "#e8e0d0");
      poly(c, [-4, -6, 4, -6, 3.5, -17 - breathe, -3.5, -17 - breathe], "#e8e0d0");
      poly(c, [-4, -6, -1, -6, -1.2, -17 - breathe, -3.5, -17 - breathe], "#c8c0b0");
      limb(c, -3, -10, 3, -10, 1, "#5a8a4a"); for (let i = 0; i < 3; i++) ell(c, -2 + i * 2, -10, 0.9, 0.6, "#7ab060", 0.5);
      c.save(); c.translate(0.5, -20 - breathe); c.rotate(Math.sin(t * 0.8) * 0.06);
      circ(c, 0, 0, 3.3, "#c8a888");
      c.strokeStyle = "#5a4a30"; c.lineWidth = 1.4; c.lineCap = "round"; c.beginPath(); c.moveTo(-2.5, -2); c.quadraticCurveTo(-6, -5, -7.4, -9); c.moveTo(2.5, -2); c.quadraticCurveTo(6, -5, 7.4, -9); c.stroke();
      c.lineWidth = 1; c.beginPath(); c.moveTo(-5.4, -6); c.lineTo(-8, -6.4); c.moveTo(5.4, -6); c.lineTo(8, -6.4); c.stroke();
      ell(c, -7.4, -9.4, 1, 0.6, "#7ab060", 0.4);
      c.fillStyle = "#3a6a2a"; c.fillRect(1.5, -1, 1.2, 1); limb(c, 1, 1.6, 2.6, 1.6, 0.5, "#8a5a4a");
      c.restore();
      limb(c, -2, -15 - breathe, -5, -10, 1.8, "#e8e0d0");
      c.save(); c.translate(4, -12); c.rotate(-0.6 + Math.sin(t * 1.3) * 0.1);
      limb(c, -2, 0, 3, 0, 1.8, "#e8e0d0"); circ(c, 4, 0, 1.6, "#ffd27a"); glow(c, 4, 0, 5 + Math.sin(t * 3) * 1, "rgba(255,210,120,.5)");
      c.restore();
    } else if (id === "A") { /* Nundro an der Schmiede */
      limb(c, -2.5, -7, -2.8, 0, 3.6, "#3a2a20"); limb(c, 2.5, -7, 2.8, 0, 3.6, "#3a2a20");
      ell(c, -2.6, -0.2, 2.2, 1, "#1a1410"); ell(c, 3, -0.2, 2.2, 1, "#2a2018");
      poly(c, [-5.5, -6, 5.5, -6, 6, -15 - breathe, -6, -15 - breathe], "#5a4030");
      poly(c, [-4, -6, 4, -6, 4, -14, -4, -14], "#8a6a4a"); limb(c, -4, -14, -2, -16 - breathe, 0.6, "#5a3a22"); limb(c, 4, -14, 2, -16 - breathe, 0.6, "#5a3a22");
      circ(c, 0.5, -17.5 - breathe, 3.6, "#d8a888");
      poly(c, [-2, -16, 4, -16, 3.4, -9, 1.6, -7.6, 0, -10], "#2a2020"); limb(c, 1.6, -12, 1.6, -8.4, 0.5, "#4a3a30");
      poly(c, [-3.6, -18 - breathe, -3, -21.4 - breathe, 3.6, -21.4 - breathe, 4.2, -18.4 - breathe], "#3a3036");
      c.fillStyle = "#1a1010"; c.fillRect(2, -18.8 - breathe, 1, 0.9);
      const ham = Math.sin(t * 4), hit = ham > 0.92;
      c.save(); c.translate(4, -13); c.rotate(-1.6 + Math.max(0, ham) * 1.3); c.scale(0.62, 0.62); weapon(c, "hammer", "#e5a43a", t); c.restore();
      limb(c, 2, -14, 4, -13, 2.4, "#d8a888");
      if (hit) { glow(c, 11, -6, 6, "rgba(255,170,60,.8)"); for (let i = 0; i < 4; i++) limb(c, 11, -6, 11 + Math.cos(i * 1.3 - 2) * 4, -6 + Math.sin(i * 1.3 - 2) * 4, 0.5, "#ffd27a"); }
    }
    c.restore();
  };
  /* Stufe 0: Lager-/Ereignis-Figuren und Rex aus dem Sprite-Zwischenspeicher (reine Funktionen der Zeit) */
  {
    const npc0 = Z.drawNPC, rex0 = Z.drawRex, NPCN = 48;
    const sprOk = c => Z.gq && Z.gq.lean && !Z.sprOff && c.canvas && c.canvas.id === "cv" && Z.gfx;
    Z.drawNPC = function (c, id, x, y, t, face) {
      if (sprOk(c)) {
        sprTick();
        const ps = Math.max(1, Math.round(Z.gfx.scale * 4) / 4), b = ((((t % TAU) + TAU) % TAU) / TAU * NPCN) | 0, qt = b * TAU / NPCN;
        c.save(); c.translate(x, y); c.scale(face || 1, 1);
        const ok = partSpr(c, "N|" + id + "|" + ps + "|" + b, 22, 22, 42, 8, ps, g => npc0(g, id, 0, 0, qt, 1));
        c.restore();
        if (ok) return;
      }
      return npc0.apply(this, arguments);
    };
    Z.drawRex = function (c, x, y, face, t, run, sit) {
      if (!sit && sprOk(c)) {
        sprTick();
        const ps = Math.max(1, Math.round(Z.gfx.scale * 4) / 4), rb = run ? ((((run % 2) + 2) % 2) * 4) | 0 : -1, wp = TAU / 14, wb = ((((t % wp) + wp) % wp) / wp * 6) | 0;
        c.save(); c.translate(x, y); c.scale(face, 1);
        const ok = partSpr(c, "R|" + ps + "|" + rb + "|" + wb, 16, 18, 22, 4, ps, g => rex0(g, 0, 0, 1, (wb + 0.5) * wp / 6, rb < 0 ? 0 : (rb + 0.5) / 4, false));
        c.restore();
        if (ok) return;
      }
      return rex0.apply(this, arguments);
    };
  }

  /* ======================= SYMBOLE (für HUD/Menüs) ======================= */
  const SKILL_ICON = {
    rex: c => Z.drawRex(c, -1, 7, 1, 0, 0, true),
    lute: c => { ell(c, -2, 2, 5, 4, "#a06a30"); limb(c, 1, 0, 8, -7, 1.6, "#6a4a2a"); circ(c, -2, 2, 1.4, "#3a2010"); },
    arrows: c => { for (let i = -1; i <= 1; i++) { limb(c, i * 4, -8, i * 4 + 2, 7, 1, "#c8a060"); poly(c, [i * 4 + 2, 9, i * 4, 5, i * 4 + 4, 6], "#e8e0d0"); } },
    bolt: c => poly(c, [1, -9, -4, 1, 0, 1, -2, 9, 5, -2, 1, -2, 3, -9], "#f0e060"),
    cloud: c => { circ(c, -3, 1, 4, "#9ad04a"); circ(c, 2, -1, 5, "#8ac040"); circ(c, 5, 2, 3.4, "#a0d060"); },
    smoke: c => { circ(c, -2, 2, 4.5, "#6a6070"); circ(c, 3, -1, 4, "#8a8090"); circ(c, 0, -4, 3, "#a09aa8"); },
    trap: c => { limb(c, -7, 4, 7, 4, 2, "#6a6058"); for (let i = -6; i <= 6; i += 3) poly(c, [i - 1, 3, i, -3, i + 1, 3], "#c0b0a0"); },
    flute: c => { limb(c, -7, 5, 7, -5, 2.2, "#c08a50"); for (let i = 0; i < 3; i++) circ(c, -3 + i * 3, 2 - i * 2.2, 0.7, "#3a2010"); },
    crystal: c => { poly(c, [0, -9, 5, -2, 2, 8, -2, 8, -5, -2], "#ff9a3a"); poly(c, [0, -9, 2, -2, 0, 8, -2, -2], "#ffd090"); },
    step: c => { circ(c, -3, 0, 4, "#3a2a4a"); poly(c, [0, -6, 9, 0, 0, 6], "#a060ff"); },
    herb: c => { for (let i = 0; i < 3; i++) ell(c, -3 + i * 3, -2 + (i % 2) * 2, 2.4, 4.5, "#7fd36a", -0.4 + i * 0.4); limb(c, 0, 8, 0, 0, 1, "#5a8a3a"); },
    horn: c => { c.fillStyle = "#c8a060"; c.beginPath(); c.moveTo(-8, 3); c.quadraticCurveTo(0, 4, 7, -5); c.lineTo(8, 1); c.quadraticCurveTo(0, 8, -8, 6); c.fill(); },
    bomb: c => { circ(c, 0, 2, 5, "#ff6a2a"); limb(c, 0, -3, 0, -6, 2, "#e0d8c0"); circ(c, 1, -8, 1.2, "#ffd27a"); },
    wrath: c => { circ(c, 0, 0, 6, "#5a0a0a"); poly(c, [-5, -1, 0, -9, 5, -1, 2, 6, -2, 6], "#ff2a3a"); },
    roots: c => { c.strokeStyle = "#5aa040"; c.lineWidth = 1.6; for (let i = -1; i <= 1; i++) { c.beginPath(); c.moveTo(i * 4, 8); c.quadraticCurveTo(i * 7, 0, i * 3, -8); c.stroke(); } },
    breath: c => { poly(c, [-8, 0, 7, -7, 7, 7], "#a8e050"); circ(c, -8, 0, 3, "#3a7a3a"); }
  };
  Z.SKILL_ICON = SKILL_ICON;
  Z.drawIcon = function (c, icon, x, y, size, col) {
    c.save(); c.translate(x, y); const s = (size || 14) / 18; c.scale(s, s);
    if (SKILL_ICON[icon]) SKILL_ICON[icon](c);
    else { c.rotate(-0.78); c.translate(-8, 0); weapon(c, icon, col || "#fff", 0); }
    c.restore();
  };
})();

/* Ezekiel – The Destroyer · Ezekiel: Ausrüstung, Treffer, Heilung (W11 Runde 17)
   – Sichtbare Lauf-Ausrüstung aus den Segen: Schulterplatte (Panzer-Segen; Steinhaut = Steinplatte), Amulett an
     einer Kette, dessen Stein die Farbe des zuletzt gewählten Segens trägt (Glaskanone rot, Erholung blutrot,
     Kontrolle violett, Nutzen gold) und mit der Zahl der Segen größer wird.
   – Treffer: kurzes helles Aufblitzen (warmweiß, dann rot), dazu ein paar Funken; die Rückstoß-Pose kommt aus dem Rig.
   – Heilung: warmer, goldener Schimmer mit aufsteigenden Funken (nicht lean).
   Alles nach dem Körper gezeichnet; Schalter Z.gfx.off.ezekiel2. */
(function () {
  const Z = window.Z, TAU = Math.PI * 2;
  const KCOL = { glas: "#ff4a3a", heil: "#c0203a", cc: "#b070d0", nutz: "#ffd060", tank: "#d8c8a8" };
  const st = new WeakMap(), LAST = { P: null, S: null, time: 0 };
  Z.ezDbg = () => LAST.S && { hurt: LAST.S.hurt, heal: LAST.S.heal, same: LAST.P === Z.player };
  const al0 = Z.drawAfterLight;
  Z.drawAfterLight = function (c) {
    if (al0) al0.apply(this, arguments);
    const P = LAST.P, S = LAST.S; if (!P || !S || P !== Z.player || P.dead || (Z.gfx.off && Z.gfx.off.ezekiel2)) return;
    const cx = P.x + P.w / 2;
    if (S.hurt > 0) { const k = S.hurt / 0.28; c.save(); c.globalAlpha = 0.8 * k; Z.draw.glow(c, cx, P.y + P.h * 0.45, 14 + 8 * (1 - k), k > 0.5 ? "#fff0e0" : "#ff5a3a"); c.restore(); }
    if (S.heal > 0) { const k = S.heal / 0.9, pu = 0.6 + 0.4 * Math.sin(LAST.time * 9); c.save(); c.globalAlpha = 0.5 * k * pu; Z.draw.glow(c, cx, P.y + P.h * 0.5, 20, "#ffc870"); c.restore(); }
  };
  const lean = () => !!(Z.gq && (Z.gq.lean || Z.gq.mini));
  const d0 = Z.drawPlayer;
  Z.drawPlayer = function (c, P, time) {
    const r = d0.apply(this, arguments);
    try { if (!(Z.gfx.off && Z.gfx.off.ezekiel2)) extras(c, P, time); } catch (e) { console.error(e); }
    return r;
  };
  function extras(c, P, time) {
    let S = st.get(P); if (!S) { S = { hp: P.hp, hurt: 0, heal: 0, lt: performance.now() / 1000, hurt0: 0 }; st.set(P, S); }
    const nowR = performance.now() / 1000, dt = Math.max(0, Math.min(0.1, nowR - S.lt)); S.lt = nowR; /* Echtzeit: time läuft bei Zeitlupe/Trefferstopp anders */
    const cx = P.x + P.w / 2, lo = lean();
    if (((P.hurtT || 0) > 0 && !(S.hurt0 > 0)) || (P.hp < S.hp - 0.5 && S.hurt <= 0.05)) { S.hurt = 0.28; if (!lo) Z.fx.burst(cx, P.y + 12, 5, { col: ["#ffe8d8", "#ff6a4a"], sp: 70, life: 0.25, size: 1.6, kind: "spark", add: true }); }
    S.hurt0 = P.hurtT || 0;
    if (P.hp > S.hp + 0.5 && !P.dead) S.heal = 0.9;
    S.hp = P.hp; S.hurt = Math.max(0, S.hurt - dt); S.heal = Math.max(0, S.heal - dt);
    if (P.dead || P.invis > 0) return;
    /* Ausrüstung */
    const A = P.capeA, bl = P.bless || [];
    if (A && bl.length && !(P.rollT > 0) && !P.climbing) {
      const f = P.face || 1, nx = A.x + f * 2.5, ny = A.y;
      let tank = false, stone = false, last = null;
      for (const id of bl) { const b = Z.BLESS && Z.BLESS[id]; if (!b) continue; if (b.k === "tank") { tank = true; if (id === "steinhaut") stone = true; } else last = b.k; }
      if (tank) { /* Schulterplatte über der vorderen Schulter */
        const sx = nx + f * 0.6, sy = ny + 2.6;
        c.fillStyle = stone ? "#5e574e" : "#45404a"; c.beginPath(); c.ellipse(sx, sy, 2.8, 1.9, f * -0.3, Math.PI, TAU); c.closePath(); c.fill();
        c.fillStyle = stone ? "#8e8576" : "#8a8290"; c.beginPath(); c.ellipse(sx, sy - 0.5, 2.1, 0.9, f * -0.3, Math.PI, TAU); c.closePath(); c.fill();
        c.fillStyle = stone ? "#3a352e" : "#26222a"; c.fillRect(sx - 2.8, sy - 0.2, 5.6, 0.6);
      }
      if (last) { /* Amulett an einer Kette, Stein in Segenfarbe */
        const col = KCOL[last], ax = nx + f * 1.4, ay = ny + 6.2, rr = Math.min(1.5, 0.9 + bl.length * 0.15);
        c.strokeStyle = "#b0905a"; c.lineWidth = 0.5; c.beginPath(); c.moveTo(nx - f * 1, ny + 1); c.quadraticCurveTo(ax - f * 0.5, ay - 1.5, ax, ay - rr); c.stroke();
        c.fillStyle = "#c8a050"; c.beginPath(); c.arc(ax, ay, rr + 0.45, 0, TAU); c.fill();
        c.fillStyle = col; c.beginPath(); c.arc(ax, ay, rr, 0, TAU); c.fill();
        c.fillStyle = "rgba(255,255,240,.8)"; c.fillRect(ax - rr * 0.5, ay - rr * 0.6, 0.7, 0.7);
        if (!lo) { c.save(); c.globalCompositeOperation = "lighter"; c.globalAlpha = 0.35 + 0.15 * Math.sin(time * 3); Z.draw.glow(c, ax, ay, 4, col); c.restore(); }
      }
    }
    /* Treffer-Blitz und Heil-Schimmer werden nach dem Licht gezeichnet (sonst schluckt die Dunkelheit sie) */
    LAST.P = P; LAST.S = S; LAST.time = time;
    if (S.heal > 0) {
      if (!lo && Math.random() < 0.5) Z.fx.p({ x: cx + (Math.random() - 0.5) * 14, y: P.y + P.h - Math.random() * 8, vx: 0, vy: -30 - Math.random() * 20, life: 0.7, size: 1.3, col: Math.random() < 0.5 ? "#ffe0a0" : "#ffb060", kind: "glow", add: true });
    }
  }
})();

/* Ezekiel – The Destroyer · Gemalte Porträts für Sprechblasen (W11 Runde 25)
   Z.portraet(name, text) → Bild-URL (oder null): kleines Brustbild im Pergament-Medaillon für die NSC des Lagers
   (Edda, Quirin, Sigrun, Wendel, Jori, Barradin, Alwin, Lotte, Mira), die fahrende Händlerin und den Verfluchten.
   Aussehen nach den Figuren in lager.js/figuren.js; der Gesichtsausdruck wird aus dem Satz geschätzt
   (froh, ernst, traurig, aufgeregt, fragend). Einmal gemalt, danach aus dem Zwischenspeicher. Kein Blau. */
(function () {
  const Z = window.Z; if (!Z) return;
  const LOOK = {
    edda: { skin: "#e8c09a", hair: "#8a4a22", hs: "kurz", hat: "feder", cloth: "#6a4628", cloth2: "#c8902a", scarf: 1 },
    quirin: { skin: "#e0b48e", hair: null, hs: "glatze", beard: "#ece4d4", cloth: "#5e6e26", cloth2: "#3e4a18", goggles: 1, age: 1 },
    sigrun: { skin: "#e4c0a4", hair: "#b8b4b0", hs: "zoepfe", hood: "#7a2234", cloth: "#5a1a28", rune: 1, age: 1 },
    wendel: { skin: "#d8a47e", hair: "#a8401c", hs: "kurz", beard: "#b04a20", cloth: "#7a5a36", cloth2: "#5a3e22", fur: 1, whistle: 1, broad: 1 },
    jori: { skin: "#ecc29c", hair: "#5a3a22", hs: "kurz", hat: "muetze", cloth: "#7a4e2c", cloth2: "#4a3222", soot: 1, young: 1 },
    barradin: { skin: "#ecccaa", hair: "#e8d090", hs: "lang", hat: "barde", cloth: "#6a2a6a", cloth2: "#8a3a2a", ears: 1 },
    alwin: { skin: "#dcb898", hair: "#c8c4bc", hs: "duenn", cloth: "#2a2430", cloth2: "#4a3e30", glasses: 1, age: 2 },
    lotte: { skin: "#ecc29e", hair: "#6a3a1e", hs: "kurz", scarfHead: "#c8402a", cloth: "#b03a24", cloth2: "#efe2c4", apron: 1 },
    mira: { skin: "#e6be98", hair: "#2a1a16", hs: "lang", cloth: "#a87a32", cloth2: "#c03a5a", threads: 1 },
    haendlerin: { skin: "#d8aa82", hair: "#3a2418", hs: "lang", hood: "#4a4226", cloth: "#5a3a22", cloth2: "#c8902a", earring: 1 },
    verfluchter: { skin: "#9a8a90", hair: null, hs: "glatze", hood: "#241a24", cloth: "#1e161e", cloth2: "#3a2a3a", cursed: 1 }
  };
  const ALIAS = [["edda", "edda"], ["quirin", "quirin"], ["sigrun", "sigrun"], ["wendel", "wendel"], ["jori", "jori"], ["barradin", "barradin"], ["alwin", "alwin"], ["lotte", "lotte"], ["mira", "mira"], ["händlerin", "haendlerin"], ["trader", "haendlerin"], ["verfluch", "verfluchter"], ["cursed", "verfluchter"]];
  function who(name) { const n = String(name || "").toLowerCase(); for (const [k, v] of ALIAS) if (n.includes(k)) return v; return null; }
  function mood(txt) {
    const s = String(txt || "");
    if (/(tot|verloren|leider|allein|vermiss|tränen|grab|nie wieder|dead|lost|alone|miss|sorry|tears|…$|\.\.\.$)/i.test(s)) return "traurig";
    if (/(hinter dir|vorsicht|achtung|lauf|weg hier|wächter|behind you|watch out|run)/i.test(s) || (s.match(/!/g) || []).length >= 2) return "aufgeregt";
    if (/\?\s*["“”«»]?\s*$/.test(s) || /\?$/.test(s.trim())) return "fragend";
    if (/(danke|gern|gut|schön|freu|ha!|haha|wunderbar|perfekt|thank|good|great|glad|lovely|well done)/i.test(s) || /!/.test(s)) return "froh";
    return "ernst";
  }
  const cache = new Map();
  function paint(L, md) {
    const S = 96, cv = document.createElement("canvas"); cv.width = cv.height = S; const c = cv.getContext("2d"), TAU = Math.PI * 2;
    const E = (x, y, rx, ry, col, r0) => { c.fillStyle = col; c.beginPath(); c.ellipse(x, y, rx, ry, r0 || 0, 0, TAU); c.fill(); };
    const P = (col, pts) => { c.fillStyle = col; c.beginPath(); c.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 2) c.lineTo(pts[i], pts[i + 1]); c.closePath(); c.fill(); };
    const Ln = (col, w, pts) => { c.strokeStyle = col; c.lineWidth = w; c.lineCap = "round"; c.beginPath(); c.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 2) c.lineTo(pts[i], pts[i + 1]); c.stroke(); };
    /* Medaillon: Pergamentgrund mit warmer Vignette, Holzrand */
    c.save(); c.beginPath(); c.arc(48, 48, 44, 0, TAU); c.clip();
    const bg = c.createRadialGradient(44, 38, 6, 48, 48, 50); bg.addColorStop(0, L.cursed ? "#5a4458" : "#f4e4c0"); bg.addColorStop(0.7, L.cursed ? "#2a1e2a" : "#d8bc88"); bg.addColorStop(1, L.cursed ? "#140c14" : "#9a7a4a");
    c.fillStyle = bg; c.fillRect(0, 0, S, S);
    if (L.rune) { c.globalAlpha = 0.35; Ln("#a04a8a", 2, [74, 20, 74, 34]); Ln("#a04a8a", 2, [74, 22, 80, 27, 74, 31]); Ln("#a04a8a", 2, [18, 30, 24, 22, 24, 36]); c.globalAlpha = 1; }
    const sk = L.skin, dk = "rgba(60,30,20,.22)", hx = 48, hy = L.broad ? 46 : 44, hr = L.young ? 15.5 : 16.5;
    /* Haar hinten / Kapuze hinten */
    if (L.hood) P(L.hood, [hx - 26, 98, hx - 25, hy - 6, hx - 14, hy - 26, hx, hy - 30, hx + 14, hy - 26, hx + 25, hy - 6, hx + 26, 98]);
    if (L.hs === "lang") P(L.hair, [hx - 18, hy - 6, hx - 21, hy + 26, hx - 10, hy + 30, hx + 10, hy + 30, hx + 21, hy + 26, hx + 18, hy - 6]);
    /* Schultern und Kleidung */
    const sw = L.broad ? 40 : 34;
    E(hx, 100, sw, 30, L.cloth);
    c.fillStyle = "rgba(0,0,0,.18)"; c.beginPath(); c.ellipse(hx + 10, 102, sw * 0.7, 26, 0, 0, TAU); c.fill();
    if (L.fur) for (let k = 0; k < 14; k++) { const a = Math.PI + k / 13 * Math.PI; E(hx + Math.cos(a) * (sw - 4), 80 + Math.abs(Math.sin(a)) * 2 + (k % 2) * 2, 5, 4, k % 2 ? "#a88a62" : "#8a6c48"); }
    if (L.apron) P(L.cloth2, [hx - 12, 76, hx + 12, 76, hx + 16, 98, hx - 16, 98]);
    if (L.cloth2 && !L.apron && !L.fur) P(L.cloth2, [hx - 7, 70, hx + 7, 70, hx + 4, 98, hx - 4, 98]);
    /* Hals */
    E(hx, hy + 20, 7, 8, sk); E(hx, hy + 22, 7, 5, dk);
    if (L.scarf) { E(hx, hy + 25, 15, 6, L.cloth2); E(hx + 6, hy + 33, 5, 9, L.cloth2, 0.3); Ln("rgba(90,50,10,.5)", 1, [hx - 12, hy + 25, hx + 12, hy + 26]); }
    if (L.whistle) { Ln("#3a2a1a", 1, [hx - 9, hy + 22, hx, hy + 36, hx + 9, hy + 22]); E(hx, hy + 38, 2.6, 4, "#c8a060"); }
    if (L.threads) { Ln("#c03a5a", 1.6, [hx - 22, 92, hx - 14, 90]); Ln("#c03a5a", 1.2, [hx - 22, 95, hx - 14, 93]); }
    /* Ohren */
    if (L.ears) { P(sk, [hx - 15, hy - 1, hx - 27, hy - 12, hx - 16, hy + 6]); P(sk, [hx + 15, hy - 1, hx + 27, hy - 12, hx + 16, hy + 6]); }
    else { E(hx - 16, hy + 2, 3, 5, sk); E(hx + 16, hy + 2, 3, 5, sk); }
    if (L.earring) E(hx + 16, hy + 9, 1.6, 1.6, "#e8c060");
    /* Kopf mit Licht von oben links */
    E(hx, hy, hr, hr * 1.17, sk);
    const sh = c.createLinearGradient(hx - hr, 0, hx + hr, 0); sh.addColorStop(0.55, "rgba(0,0,0,0)"); sh.addColorStop(1, "rgba(70,30,20,.28)"); c.fillStyle = sh; c.beginPath(); c.ellipse(hx, hy, hr, hr * 1.17, 0, 0, TAU); c.fill();
    E(hx - 9, hy + 7, 4, 2.6, "rgba(220,110,90,.22)"); E(hx + 9, hy + 7, 4, 2.6, "rgba(220,110,90,.22)");
    if (L.soot) { E(hx + 8, hy + 8, 4, 2.4, "rgba(40,30,30,.35)"); E(hx - 5, hy - 10, 3, 1.6, "rgba(40,30,30,.25)"); }
    if (L.cursed) { const g = c.createLinearGradient(0, hy - 20, 0, hy + 10); g.addColorStop(0, "rgba(10,4,12,.85)"); g.addColorStop(1, "rgba(10,4,12,.15)"); c.fillStyle = g; c.beginPath(); c.ellipse(hx, hy, hr, hr * 1.17, 0, 0, TAU); c.fill(); }
    /* Haar vorn */
    const H = L.hair;
    if (L.hs === "kurz") { P(H, [hx - hr - 1, hy + 2, hx - hr, hy - 10, hx - 8, hy - hr - 4, hx + 8, hy - hr - 4, hx + hr, hy - 10, hx + hr + 1, hy + 2, hx + 12, hy - 8, hx + 2, hy - 12, hx - 10, hy - 7]); }
    if (L.hs === "lang") { P(H, [hx - hr - 2, hy + 14, hx - hr - 1, hy - 10, hx - 6, hy - hr - 5, hx + 10, hy - hr - 3, hx + hr + 1, hy - 8, hx + hr + 2, hy + 14, hx + 13, hy - 4, hx + 4, hy - 13, hx - 8, hy - 11, hx - 13, hy - 2]); }
    if (L.hs === "zoepfe") { P(H, [hx - hr, hy - 2, hx - 8, hy - hr - 3, hx + 8, hy - hr - 3, hx + hr, hy - 2, hx + 6, hy - 12, hx - 6, hy - 12]); for (const sd of [-1, 1]) for (let k = 0; k < 5; k++) E(hx + sd * (hr + 1), hy + 6 + k * 6, 3.6, 3.4, k % 2 ? "#a8a4a0" : H); }
    if (L.hs === "duenn") { P(H, [hx - hr - 1, hy + 4, hx - hr, hy - 8, hx - 11, hy - 11, hx - 12, hy + 2]); P(H, [hx + hr + 1, hy + 4, hx + hr, hy - 8, hx + 11, hy - 11, hx + 12, hy + 2]); Ln("rgba(200,196,188,.7)", 1, [hx - 6, hy - hr - 1, hx + 2, hy - hr + 1]); }
    if (L.hs === "glatze" && !L.hood) { E(hx - 5, hy - 13, 5, 2.5, "rgba(255,240,220,.35)"); }
    /* Elfenohren ragen durchs Haar */
    if (L.ears) { P(L.skin, [hx - hr + 1, hy + 1, hx - 28, hy - 13, hx - hr + 1, hy + 7]); P(L.skin, [hx + hr - 1, hy + 1, hx + 28, hy - 13, hx + hr - 1, hy + 7]); Ln("rgba(120,60,40,.35)", 1, [hx - hr - 1, hy + 2, hx - 24, hy - 9]); Ln("rgba(120,60,40,.35)", 1, [hx + hr + 1, hy + 2, hx + 24, hy - 9]); }
    /* Kopfbedeckung */
    if (L.hood) { c.fillStyle = L.hood; c.beginPath(); c.moveTo(hx - hr - 6, hy + 18); c.quadraticCurveTo(hx - hr - 6, hy - hr - 12, hx, hy - hr - 12); c.quadraticCurveTo(hx + hr + 6, hy - hr - 12, hx + hr + 6, hy + 18); c.lineTo(hx + hr - 1, hy + 10); c.quadraticCurveTo(hx + hr, hy - hr + 2, hx, hy - hr + 1); c.quadraticCurveTo(hx - hr, hy - hr + 2, hx - hr + 1, hy + 10); c.closePath(); c.fill();
      Ln("rgba(255,220,190,.18)", 1.2, [hx - hr - 4, hy + 10, hx - hr - 3, hy - 8, hx - 8, hy - hr - 9]); }
    if (L.hat === "feder") { P("#5a3a22", [hx - hr - 3, hy - 10, hx - 10, hy - hr - 10, hx + 12, hy - hr - 9, hx + hr + 3, hy - 9]); Ln("#3a2414", 2, [hx - hr - 3, hy - 9, hx + hr + 3, hy - 8]); c.strokeStyle = "#c83a2a"; c.lineWidth = 3; c.beginPath(); c.moveTo(hx + 8, hy - hr - 8); c.quadraticCurveTo(hx + 22, hy - hr - 18, hx + 30, hy - hr - 10); c.stroke(); }
    if (L.hat === "muetze") { E(hx, hy - hr + 1, hr + 2, 9, "#4a3a2e"); Ln("#2e241c", 2.4, [hx - hr - 2, hy - hr + 6, hx + hr + 2, hy - hr + 6]); }
    if (L.hat === "barde") { P("#4a2a5a", [hx - hr - 6, hy - 9, hx - 10, hy - hr - 12, hx + 10, hy - hr - 14, hx + hr + 5, hy - 9]); Ln("#3a1a4a", 2.6, [hx - hr - 6, hy - 9, hx + hr + 6, hy - 9]); c.strokeStyle = "#e04a4a"; c.lineWidth = 2.4; c.beginPath(); c.moveTo(hx - 6, hy - hr - 10); c.quadraticCurveTo(hx - 20, hy - hr - 26, hx - 34, hy - hr - 20); c.stroke(); }
    if (L.scarfHead) { c.fillStyle = L.scarfHead; c.beginPath(); c.moveTo(hx - hr - 2, hy + 2); c.quadraticCurveTo(hx - hr - 2, hy - hr - 8, hx, hy - hr - 8); c.quadraticCurveTo(hx + hr + 2, hy - hr - 8, hx + hr + 2, hy + 2); c.quadraticCurveTo(hx + 2, hy - 16, hx - hr - 2, hy + 2); c.fill(); E(hx + hr, hy + 4, 4, 5, L.scarfHead); for (let k = 0; k < 4; k++) E(hx - 10 + k * 7, hy - hr - 1, 1.2, 1.2, "#efe2c4"); }
    /* Bart */
    if (L.beard) { c.fillStyle = L.beard; c.beginPath(); c.moveTo(hx - hr + 1, hy + 2); c.quadraticCurveTo(hx - hr + 2, hy + (L.broad ? 34 : 28), hx, hy + (L.broad ? 38 : 32)); c.quadraticCurveTo(hx + hr - 2, hy + (L.broad ? 34 : 28), hx + hr - 1, hy + 2); c.quadraticCurveTo(hx + 8, hy + 10, hx, hy + 10); c.quadraticCurveTo(hx - 8, hy + 10, hx - hr + 1, hy + 2); c.fill();
      Ln("rgba(0,0,0,.18)", 1, [hx - 6, hy + 18, hx - 4, hy + 28]); Ln("rgba(0,0,0,.18)", 1, [hx + 5, hy + 18, hx + 4, hy + 28]); }
    /* Gesicht je Stimmung */
    const ey = hy - 1, ex = 6.5;
    if (L.cursed) { for (const sd of [-1, 1]) { const g = c.createRadialGradient(hx + sd * ex, ey, 0, hx + sd * ex, ey, 6); g.addColorStop(0, "rgba(230,170,255,1)"); g.addColorStop(0.35, "rgba(180,80,220,.7)"); g.addColorStop(1, "rgba(120,40,160,0)"); c.fillStyle = g; c.fillRect(hx + sd * ex - 6, ey - 6, 12, 12); } }
    else if (md === "froh") { for (const sd of [-1, 1]) Ln("#2a1a14", 1.8, [hx + sd * ex - 2.6, ey + 0.6, hx + sd * ex, ey - 1.4, hx + sd * ex + 2.6, ey + 0.6]); }
    else for (const sd of [-1, 1]) { E(hx + sd * ex, ey, 2.2, md === "aufgeregt" ? 2.8 : 2.4, "#fff8ee"); E(hx + sd * ex + 0.3, ey + 0.3, 1.5, 1.7, "#2a1a14"); E(hx + sd * ex - 0.3, ey - 0.5, 0.5, 0.5, "#fff"); }
    if (L.age) { Ln("rgba(80,40,30,.3)", 0.8, [hx - ex - 4, ey + 3, hx - ex - 2, ey + 4]); Ln("rgba(80,40,30,.3)", 0.8, [hx + ex + 4, ey + 3, hx + ex + 2, ey + 4]); if (L.age > 1) Ln("rgba(80,40,30,.25)", 0.8, [hx - 6, hy - 12, hx + 6, hy - 12]); }
    /* Brauen */
    const bc = L.cursed ? "rgba(0,0,0,0)" : L.beard ? L.beard : L.hair || "#6a4a3a", by = ey - 5;
    const brow = (sd, inner, outer) => Ln(bc, 2, [hx + sd * 3, by + inner, hx + sd * 10, by + outer]);
    if (md === "froh") { brow(-1, -1.5, -1.5); brow(1, -1.5, -1.5); }
    else if (md === "traurig") { brow(-1, -2, 1); brow(1, -2, 1); }
    else if (md === "aufgeregt") { brow(-1, 1.2, -2.2); brow(1, 1.2, -2.2); }
    else if (md === "fragend") { brow(-1, 0, 0); brow(1, -2.5, -3.5); }
    else { brow(-1, 0, -0.5); brow(1, 0, -0.5); }
    /* Nase */
    Ln("rgba(90,40,30,.45)", 1.3, [hx + 0.5, ey + 2, hx + 2, ey + 8, hx - 1, ey + 9]);
    /* Mund */
    const my = hy + 13;
    if (L.beard) E(hx, my, 6, 2.2, L.beard);
    if (L.cursed) Ln("rgba(20,8,20,.8)", 1.4, [hx - 4, my, hx + 4, my + 0.5]);
    else if (md === "froh") { c.fillStyle = "#7a2a22"; c.beginPath(); c.moveTo(hx - 6, my - 1); c.quadraticCurveTo(hx, my + 6, hx + 6, my - 1); c.quadraticCurveTo(hx, my + 2, hx - 6, my - 1); c.fill(); }
    else if (md === "traurig") { c.strokeStyle = "#6a2a22"; c.lineWidth = 1.5; c.beginPath(); c.moveTo(hx - 5, my + 2); c.quadraticCurveTo(hx, my - 2, hx + 5, my + 2); c.stroke(); }
    else if (md === "aufgeregt") { E(hx, my + 1, 3.6, 3.2, "#4a1a16"); E(hx, my + 2.6, 2, 1, "#a04a3a"); }
    else if (md === "fragend") { E(hx + 1.5, my, 2, 1.8, "#5a2420"); }
    else Ln("#6a2a22", 1.5, [hx - 4.5, my, hx + 4.5, my]);
    /* Brille / Schutzbrille */
    if (L.glasses) { c.strokeStyle = "#3a2a1a"; c.lineWidth = 1.2; for (const sd of [-1, 1]) { c.beginPath(); c.arc(hx + sd * ex, ey, 4.2, 0, TAU); c.stroke(); } Ln("#3a2a1a", 1.2, [hx - 2.2, ey, hx + 2.2, ey]); c.fillStyle = "rgba(255,240,210,.18)"; c.fillRect(hx - ex - 3, ey - 3, 2, 2); }
    if (L.goggles) { Ln("#4a2e1a", 3, [hx - hr, hy - 9, hx + hr, hy - 9]); for (const sd of [-1, 1]) { E(hx + sd * 6, hy - 10, 5, 4.2, "#b06a2a"); E(hx + sd * 6, hy - 10, 3.2, 2.6, "#e8c890"); E(hx + sd * 6 - 1, hy - 11, 1, 0.8, "#fff"); } }
    c.restore();
    /* Rahmen: gemalter Holz-/Messingring */
    c.strokeStyle = "#5a3a1e"; c.lineWidth = 4; c.beginPath(); c.arc(48, 48, 44, 0, TAU); c.stroke();
    c.strokeStyle = "rgba(232,200,130,.7)"; c.lineWidth = 1.2; c.beginPath(); c.arc(48, 48, 41.6, Math.PI * 1.05, Math.PI * 1.75); c.stroke();
    c.strokeStyle = "rgba(30,16,8,.6)"; c.lineWidth = 1; c.beginPath(); c.arc(48, 48, 46, 0, TAU); c.stroke();
    return Z.leinwandURL ? Z.leinwandURL(cv) : cv.toDataURL(); /* W23 Browser */
  }
  Z.portraetStimmung = mood;
  Z.portraet = function (name, txt) {
    try { const id = who(name); if (!id) return null; const md = mood(txt), k = id + ":" + md; let u = cache.get(k); if (!u) { u = paint(LOOK[id], md); cache.set(k, u); } return u; }
    catch (e) { console.error(e); return null; }
  };
})();

/* Ezekiel – The Destroyer · Gegner- und Bossbilder aus den echten Figuren (W11 Runde 26)
   Z.gegnerBild(def, o) → Canvas: die Figur wird mit Z.drawEnemy in Ruhehaltung auf eine Leinwand gemalt, auf ihren
   Umriss zugeschnitten und eingepasst (Fundbuch: Gegner/Bosse). o.dunkel → nur Schattenriss (noch nicht begegnet).
   Z.bossPortraet(def) → Bild-URL: Kopf und Schultern des Bosses im Medaillon-Stil der NSC-Porträts, aber bedrohlich
   (Glutgrund, rote Vignette, dunkler Eisenring mit Dornen). Kein Blau. Ergebnisse werden zwischengespeichert. */
(function () {
  const Z = window.Z; if (!Z || !Z.drawEnemy) return;
  const raw = new Map(), cache = new Map();
  function render(d) {
    let r = raw.get(d); if (r) return r;
    const s = d.size || 1, w = d.w || 16, h = d.h || 20, SC = 4, pad = 80;
    const cv = document.createElement("canvas"); cv.width = Math.ceil((w * 4 + pad) * SC); cv.height = Math.ceil((h * 2.2 + pad) * SC);
    const c = cv.getContext("2d");
    const e = { def: d, x: 0, y: 0, w, h, face: 1, anim: 0.3, vx: 0, vy: 0, onGround: true, st: {}, size: s, hp: d.hp || 1, hpMax: d.hp || 1, aware: true, id: "bild" + Math.random(), kind: d.id, flash: 0, act: null, tele: 0, intro: 0 };
    c.save(); c.scale(SC, SC); c.translate(cv.width / SC / 2 - w / 2, cv.height / SC - pad / 2 - h);
    const gq = Z.gq; try { if (gq) Z.gq = Object.assign({}, gq, { lean: false }); Z.drawEnemy(c, e, 1.0); } catch (err) { console.error(err); } finally { Z.gq = gq; }
    c.restore();
    /* Umriss suchen */
    const id = c.getImageData(0, 0, cv.width, cv.height).data; let x0 = cv.width, y0 = cv.height, x1 = -1, y1 = -1;
    for (let y = 0; y < cv.height; y += 2) for (let x = 0; x < cv.width; x += 2) if (id[(y * cv.width + x) * 4 + 3] > 110) { /* Schein (Glühen) zählt nicht zum Umriss */ if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    /* Körpersäule (ohne seitlich ragende Waffen/Stäbe): oberster Punkt = Scheitel, für das Bossporträt */
    const cxp = cv.width / 2, hw = w * SC * 0.22; let bt = cv.height;
    for (let y = 0; y < cv.height && bt === cv.height; y += 2) for (let x = Math.floor(cxp - hw); x < cxp + hw; x += 2) if (id[(y * cv.width + x) * 4 + 3] > 110) { bt = y; break; }
    /* W23 Browser: Rücklesen verfälscht (Rauschen/Weiß/Nullen) → Umriss aus der Figurgröße schätzen statt aus den Pixeln */
    if (Z.canvasLesbar && !Z.canvasLesbar()) { const fy = cv.height - pad / 2 * SC; x0 = Math.max(0, Math.floor(cxp - w * SC * 1.3)); x1 = Math.min(cv.width - 2, Math.ceil(cxp + w * SC * 1.3)); y0 = Math.max(0, Math.floor(fy - h * SC * 1.25)); y1 = Math.min(cv.height - 2, Math.ceil(fy)); bt = Math.max(0, Math.floor(fy - h * SC)); }
    r = x1 < 0 ? null : { cv, x0, y0, x1: x1 + 2, y1: y1 + 2, cx: cxp, bt, bw: w * SC, bh: h * SC };
    raw.set(d, r); return r;
  }
  Z.gegnerBild = function (d, o) {
    o = o || {}; const W = o.w || 64, H = o.h || 64, key = (o.key || d.id || d.n && d.n[0]) + W + "x" + H + (o.dunkel ? "d" : "");
    let out = cache.get(key); if (out) return out;
    out = document.createElement("canvas"); out.width = W; out.height = H; const c = out.getContext("2d");
    const r = render(d);
    if (r) {
      const bw = r.x1 - r.x0, bh = r.y1 - r.y0, k = Math.min((W - 6) / bw, (H - 6) / bh), dw = bw * k, dh = bh * k;
      c.imageSmoothingQuality = "high";
      if (o.dunkel) { const t = document.createElement("canvas"); t.width = W; t.height = H; const tc = t.getContext("2d"); tc.drawImage(r.cv, r.x0, r.y0, bw, bh, (W - dw) / 2, H - 3 - dh, dw, dh); tc.globalCompositeOperation = "source-in"; tc.fillStyle = "rgba(96,74,70,.7)"; /* Schattenriss, auf dunklem Fenstergrund noch erkennbar */ tc.fillRect(0, 0, W, H); c.drawImage(t, 0, 0); }
      else { c.save(); c.globalAlpha = 0.3; c.fillStyle = "#000"; c.beginPath(); c.ellipse(W / 2, H - 3, dw * 0.4, 2.2, 0, 0, Math.PI * 2); c.fill(); c.restore(); c.drawImage(r.cv, r.x0, r.y0, bw, bh, (W - dw) / 2, H - 3 - dh, dw, dh); }
    }
    /* Schein, der über den Umriss hinausreicht, weich auslaufen lassen statt an der Bildkante abzuschneiden */
    c.save(); c.globalCompositeOperation = "destination-out";
    for (const [x0, y0, x1, y1, rx, ry, rw, rh] of [[0, 0, 7, 0, 0, 0, 7, H], [W, 0, W - 7, 0, W - 7, 0, 7, H], [0, 0, 0, 7, 0, 0, W, 7]]) { const g = c.createLinearGradient(x0, y0, x1, y1); g.addColorStop(0, "rgba(0,0,0,1)"); g.addColorStop(1, "rgba(0,0,0,0)"); c.fillStyle = g; c.fillRect(rx, ry, rw, rh); }
    c.restore();
    cache.set(key, out); return out;
  };
  /* Leinwand statt URL (sofort zeichenbar, z. B. im Boss-Titelband von uebergang.js) */
  Z.bossPortraetBild = function (d) { if (!d || !Z.bossPortraet(d)) return null; return cache.get("boss:" + (d.id || d.n[0]) + ":cv") || null; };
  Z.bossPortraet = function (d) {
    if (!d) return null; const key = "boss:" + (d.id || d.n[0]); let u = cache.get(key); if (u) return u;
    try {
      const r = render(d); if (!r) return null;
      const S = 96, cv = document.createElement("canvas"); cv.width = cv.height = S; const c = cv.getContext("2d"), TAU = Math.PI * 2;
      c.save(); c.beginPath(); c.arc(48, 48, 44, 0, TAU); c.clip();
      const bg = c.createRadialGradient(48, 60, 4, 48, 52, 54); bg.addColorStop(0, "#8a2a14"); bg.addColorStop(0.45, "#4a120c"); bg.addColorStop(1, "#120608"); c.fillStyle = bg; c.fillRect(0, 0, S, S);
      /* Glutfunken im Grund */
      for (let i = 0; i < 14; i++) { const a = i * 2.39, rr = 16 + (i * 37 % 26); c.fillStyle = "rgba(255," + (120 + (i * 29 % 80)) + ",60," + (0.25 + (i % 3) * 0.12) + ")"; c.fillRect(48 + Math.cos(a) * rr, 50 + Math.sin(a) * rr * 0.8, 1.6, 1.6); }
      /* Kopf und Schultern: oberer Teil des Umrisses (bei breiten Gestalten etwas mehr) */
      /* Ausschnitt um Kopf und Schultern: Mitte der Körpersäule, oben am Scheitel */
      const HEAD = { dragon: [0.3, 0.6, 1.05], spider: [0.22, 0.55, 1.15] }, hd = HEAD[d.shape]; /* breite Gestalten: Kopf liegt vorn (Blickrichtung) */
      const side = hd ? r.bw * hd[1] * 1.2 : Math.max(r.bw * 1.5, r.bh * 0.6), sx = r.cx + (hd ? r.bw * hd[0] : 0) - side / 2, sy = hd ? Math.max(0, r.y1 - r.bh * hd[2]) : Math.max(0, r.bt - side * 0.1);
      c.drawImage(r.cv, sx, sy, side, side, 4, 8, 88, 88);
      /* Randlicht von unten (Glut) und Vignette */
      const vg = c.createRadialGradient(48, 44, 22, 48, 48, 50); vg.addColorStop(0, "rgba(0,0,0,0)"); vg.addColorStop(1, "rgba(20,0,0,.75)"); c.fillStyle = vg; c.fillRect(0, 0, S, S);
      const lo = c.createLinearGradient(0, 60, 0, 96); lo.addColorStop(0, "rgba(255,90,30,0)"); lo.addColorStop(1, "rgba(255,90,30,.28)"); c.globalCompositeOperation = "lighter"; c.fillStyle = lo; c.fillRect(0, 0, S, S); c.globalCompositeOperation = "source-over";
      c.restore();
      /* Eisenring mit Dornen */
      c.fillStyle = "#1c1416"; for (let i = 0; i < 12; i++) { const a = i / 12 * TAU - Math.PI / 2; c.beginPath(); c.moveTo(48 + Math.cos(a - 0.09) * 44, 48 + Math.sin(a - 0.09) * 44); c.lineTo(48 + Math.cos(a) * 47.5, 48 + Math.sin(a) * 47.5); c.lineTo(48 + Math.cos(a + 0.09) * 44, 48 + Math.sin(a + 0.09) * 44); c.fill(); }
      c.strokeStyle = "#2a2024"; c.lineWidth = 5; c.beginPath(); c.arc(48, 48, 44, 0, TAU); c.stroke();
      c.strokeStyle = "rgba(255,120,60,.55)"; c.lineWidth = 1.2; c.beginPath(); c.arc(48, 48, 41.4, Math.PI * 0.15, Math.PI * 0.85); c.stroke();
      c.strokeStyle = "rgba(200,170,160,.35)"; c.lineWidth = 1; c.beginPath(); c.arc(48, 48, 46.4, Math.PI * 1.1, Math.PI * 1.6); c.stroke();
      u = Z.leinwandURL ? Z.leinwandURL(cv) : cv.toDataURL(); /* W23 Browser */ cache.set(key, u); cache.set(key + ":cv", cv); return u;
    } catch (e) { console.error(e); return null; }
  };
})();

/* Ezekiel – The Destroyer · Gemalte Siegel und Abzeichen (W11 Runde 27)
   Z.siegel(motiv, o) → Canvas 96×96 (Z.siegelURL → Bild-URL): Medaille im Stil der Porträts – geprägter Metallrand
   (o.stufe: bronze, silber, gold, blut), Grund mit Glanz, Motiv als Prägung; o.gesperrt → stumpfer Schattenriss mit
   Kette. o.band → Bandschleife unten. Motive: tod, sieg, schwert, schild, krone, schaedel, stern, karte, truhe, flamme,
   auge, feder, rune, glocke, zahnrad, pfote, faden, muenze, trank, blitz, herz, sanduhr, pfeil, tor; sonst Z.drawIcon.
   Für Laufbilanz (Tod/Sieg) und Erfolge. Kein Blau. */
(function () {
  const Z = window.Z; if (!Z) return;
  const TAU = Math.PI * 2, cache = new Map();
  const MET = { bronze: ["#f0b884", "#a8643a", "#5a2e16"], silber: ["#f4ecdc", "#a8a096", "#4e4842"], gold: ["#fff0b0", "#d8a038", "#6a4410"], blut: ["#ffb0a0", "#b0302a", "#4a0c0a"] };
  const GRUND = { bronze: ["#7a4a2a", "#3a2014"], silber: ["#5a5450", "#262220"], gold: ["#8a5a1a", "#3a2408"], blut: ["#6a1410", "#240606"] };
  function glyph(c, m, ink) {
    c.fillStyle = ink; c.strokeStyle = ink; c.lineCap = "round"; c.lineJoin = "round";
    const P = pts => { c.beginPath(); c.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 2) c.lineTo(pts[i], pts[i + 1]); c.closePath(); c.fill(); };
    const L = (w, pts) => { c.lineWidth = w; c.beginPath(); c.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 2) c.lineTo(pts[i], pts[i + 1]); c.stroke(); };
    const O = (x, y, r) => { c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); };
    switch (m) {
      case "tod": case "schaedel":
        c.beginPath(); c.arc(0, -3, 13, Math.PI * 0.85, Math.PI * 0.15); c.lineTo(8, 12); c.lineTo(-8, 12); c.closePath(); c.fill();
        c.save(); c.globalCompositeOperation = "destination-out"; O(-5, -2, 3.8); O(5, -2, 3.8); P([0, 3, -2, 7, 2, 7]); for (const x of [-4, 0, 4]) c.fillRect(x - 0.8, 9, 1.6, 4); c.restore();
        if (m === "tod") { c.save(); c.globalCompositeOperation = "destination-out"; L(1.6, [3, -16, 0, -8, 4, -4, 1, 2]); c.restore(); }
        break;
      case "sieg":
        O(0, -2, 7); for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; P([Math.cos(a - 0.12) * 9, -2 + Math.sin(a - 0.12) * 9, Math.cos(a) * 14, -2 + Math.sin(a) * 14, Math.cos(a + 0.12) * 9, -2 + Math.sin(a + 0.12) * 9]); }
        for (const sd of [-1, 1]) for (let k = 0; k < 5; k++) { const a = Math.PI / 2 + sd * (0.5 + k * 0.32); c.save(); c.translate(Math.cos(a) * 17, Math.sin(a) * 17); c.rotate(a + sd * 1.2); c.beginPath(); c.ellipse(0, 0, 2.2, 4.4, 0, 0, TAU); c.fill(); c.restore(); }
        break;
      case "schwert": P([-2, 10, -2, -14, 0, -18, 2, -14, 2, 10]); c.fillRect(-8, 8, 16, 3); c.fillRect(-1.6, 11, 3.2, 6); O(0, 18, 2.4); break;
      case "schild": c.beginPath(); c.moveTo(-12, -12); c.lineTo(12, -12); c.lineTo(11, 2); c.quadraticCurveTo(8, 12, 0, 16); c.quadraticCurveTo(-8, 12, -11, 2); c.closePath(); c.fill(); c.save(); c.globalCompositeOperation = "destination-out"; L(2, [0, -9, 0, 12]); L(2, [-9, -2, 9, -2]); c.restore(); break;
      case "krone": P([-14, 8, -14, -6, -7, 1, 0, -12, 7, 1, 14, -6, 14, 8]); c.fillRect(-14, 9, 28, 4); break;
      case "stern": c.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 6.5 : 15; c.lineTo(Math.cos(a) * r, Math.sin(a) * r); } c.closePath(); c.fill(); break;
      case "karte": P([-14, -10, -5, -13, 5, -10, 14, -13, 14, 11, 5, 14, -5, 11, -14, 14]); c.save(); c.globalCompositeOperation = "destination-out"; c.setLineDash([2.5, 2.5]); L(1.4, [-9, 6, -2, -2, 4, 2, 9, -6]); c.setLineDash([]); L(1.6, [7, -9, 11, -5]); L(1.6, [11, -9, 7, -5]); c.restore(); break;
      case "truhe": c.fillRect(-14, -2, 28, 14); c.beginPath(); c.moveTo(-14, -2); c.quadraticCurveTo(0, -16, 14, -2); c.fill(); c.save(); c.globalCompositeOperation = "destination-out"; c.fillRect(-14, -3, 28, 1.6); c.fillRect(-2.5, -4, 5, 6); c.restore(); break;
      case "flamme": c.beginPath(); c.moveTo(0, -17); c.quadraticCurveTo(13, -2, 9, 8); c.quadraticCurveTo(5, 15, 0, 15); c.quadraticCurveTo(-6, 15, -9, 8); c.quadraticCurveTo(-12, -2, -3, -6); c.quadraticCurveTo(-3, 0, 1, 1); c.quadraticCurveTo(4, -8, 0, -17); c.fill(); break;
      case "auge": c.beginPath(); c.moveTo(-16, 0); c.quadraticCurveTo(0, -14, 16, 0); c.quadraticCurveTo(0, 14, -16, 0); c.fill(); c.save(); c.globalCompositeOperation = "destination-out"; O(0, 0, 6); c.restore(); O(0, 0, 3.4); break;
      case "feder": c.beginPath(); c.moveTo(-12, 15); c.quadraticCurveTo(-4, -6, 12, -16); c.quadraticCurveTo(10, 2, -9, 12); c.fill(); L(1.4, [-14, 17, -6, 8]); break;
      case "rune": L(3, [0, -15, 0, 15]); L(3, [0, -11, 9, -4, 0, 3]); L(3, [0, 3, -8, 11]); break;
      case "glocke": c.beginPath(); c.moveTo(-12, 10); c.quadraticCurveTo(-10, -12, 0, -13); c.quadraticCurveTo(10, -12, 12, 10); c.closePath(); c.fill(); c.fillRect(-14, 9, 28, 3); O(0, 15, 3); O(0, -15, 2.4); break;
      case "zahnrad": O(0, 0, 10); for (let i = 0; i < 8; i++) { c.save(); c.rotate(i / 8 * TAU); c.fillRect(-3, -15, 6, 6); c.restore(); } c.save(); c.globalCompositeOperation = "destination-out"; O(0, 0, 4); c.restore(); break;
      case "pfote": c.beginPath(); c.ellipse(0, 6, 8, 7, 0, 0, TAU); c.fill(); for (const [x, y] of [[-10, -4], [-4, -10], [4, -10], [10, -4]]) { c.beginPath(); c.ellipse(x, y, 3.2, 4.2, x * 0.04, 0, TAU); c.fill(); } break;
      case "faden": c.lineWidth = 2.4; c.beginPath(); for (let i = 0; i <= 40; i++) { const u = i / 40, a = u * TAU * 2.2; c.lineTo(Math.cos(a) * (4 + u * 10), Math.sin(a) * (4 + u * 10)); } c.stroke(); break;
      case "muenze": O(0, 0, 13); c.save(); c.globalCompositeOperation = "destination-out"; c.lineWidth = 1.6; c.beginPath(); c.arc(0, 0, 10, 0, TAU); c.stroke(); c.font = "bold 14px serif"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText("Z", 0, 1); c.restore(); break;
      case "trank": c.beginPath(); c.arc(0, 5, 11, 0, TAU); c.fill(); c.fillRect(-4, -14, 8, 10); c.fillRect(-6, -16, 12, 3); c.save(); c.globalCompositeOperation = "destination-out"; c.fillRect(-11, 2, 22, 1.6); c.restore(); break;
      case "blitz": P([3, -17, -10, 2, -1, 2, -4, 17, 10, -3, 1, -3]); break;
      case "herz": c.beginPath(); c.moveTo(0, 14); c.bezierCurveTo(-18, 2, -12, -16, 0, -6); c.bezierCurveTo(12, -16, 18, 2, 0, 14); c.fill(); break;
      case "sanduhr": P([-10, -15, 10, -15, 1, 0, 10, 15, -10, 15, -1, 0]); c.fillRect(-12, -17, 24, 3); c.fillRect(-12, 14, 24, 3); break;
      case "pfeil": L(2.6, [-13, 13, 11, -11]); P([13, -13, 3, -11, 11, -3]); P([-13, 13, -14, 6, -9, 9]); P([-13, 13, -6, 14, -9, 9]); break;
      case "tor": c.beginPath(); c.moveTo(-13, 15); c.lineTo(-13, -2); c.quadraticCurveTo(-13, -15, 0, -15); c.quadraticCurveTo(13, -15, 13, -2); c.lineTo(13, 15); c.closePath(); c.fill(); c.save(); c.globalCompositeOperation = "destination-out"; for (const x of [-6, 0, 6]) c.fillRect(x - 1, -10, 2, 25); c.restore(); break;
      default: if (Z.drawIcon) { c.save(); Z.drawIcon(c, m, 0, 0, 30, ink); c.restore(); } else O(0, 0, 8);
    }
  }
  Z.siegel = function (motiv, o) {
    o = o || {}; const st = MET[o.stufe] ? o.stufe : "gold", lock = !!o.gesperrt, key = motiv + "|" + st + "|" + (lock ? 1 : 0) + "|" + (o.band ? 1 : 0);
    let cv = cache.get(key); if (cv) return cv;
    cv = document.createElement("canvas"); cv.width = cv.height = 96; const c = cv.getContext("2d");
    const M = lock ? ["#6a5e58", "#3a322e", "#1a1614"] : MET[st], G = lock ? ["#2a2220", "#120e0c"] : GRUND[st];
    if (o.band) { for (const sd of [-1, 1]) { c.fillStyle = lock ? "#2a2020" : st === "blut" ? "#5a0e0a" : "#7a1a12"; c.beginPath(); c.moveTo(48 + sd * 6, 66); c.lineTo(48 + sd * 22, 95); c.lineTo(48 + sd * 15, 88); c.lineTo(48 + sd * 10, 95); c.lineTo(48 + sd * 2, 70); c.fill(); } }
    /* geprägter Rand mit Zacken */
    c.save(); c.translate(48, 46);
    c.fillStyle = M[2]; c.beginPath(); for (let i = 0; i < 48; i++) { const a = i / 48 * TAU, r = i % 2 ? 37 : 39.5; c.lineTo(Math.cos(a) * r, Math.sin(a) * r); } c.closePath(); c.fill();
    const rg = c.createLinearGradient(-36, -36, 36, 36); rg.addColorStop(0, M[0]); rg.addColorStop(0.45, M[1]); rg.addColorStop(1, M[2]);
    c.fillStyle = rg; c.beginPath(); c.arc(0, 0, 35.5, 0, TAU); c.fill();
    const gg = c.createRadialGradient(-8, -10, 4, 0, 0, 30); gg.addColorStop(0, G[0]); gg.addColorStop(1, G[1]);
    c.fillStyle = gg; c.beginPath(); c.arc(0, 0, 29, 0, TAU); c.fill();
    c.strokeStyle = lock ? "rgba(0,0,0,.4)" : "rgba(0,0,0,.45)"; c.lineWidth = 1.2; c.beginPath(); c.arc(0, 0, 29, 0, TAU); c.stroke();
    c.strokeStyle = lock ? "rgba(140,120,110,.25)" : "rgba(255,240,210,.35)"; c.setLineDash([1.2, 2.6]); c.beginPath(); c.arc(0, 0, 32.5, 0, TAU); c.stroke(); c.setLineDash([]);
    /* Motiv: dunkle Prägekante, dann Metall */
    const g2 = document.createElement("canvas"); g2.width = g2.height = 96; const gc = g2.getContext("2d"); gc.translate(48, 46); gc.scale(1.15, 1.15); glyph(gc, motiv, "#fff");
    const tint = (col) => { const t = document.createElement("canvas"); t.width = t.height = 96; const tc = t.getContext("2d"); tc.drawImage(g2, 0, 0); tc.globalCompositeOperation = "source-in"; if (typeof col === "string") tc.fillStyle = col; else { const lg = tc.createLinearGradient(0, 20, 0, 76); lg.addColorStop(0, col[0]); lg.addColorStop(1, col[1]); tc.fillStyle = lg; } tc.fillRect(0, 0, 96, 96); return t; };
    c.restore();
    c.drawImage(tint("rgba(0,0,0,.6)"), 1.2, 1.8);
    c.drawImage(tint(lock ? ["#5a504a", "#322a26"] : [M[0], M[1]]), 0, 0);
    if (!lock) { c.globalAlpha = 0.5; c.drawImage(tint("rgba(255,250,230,.8)"), -0.8, -0.8); c.globalAlpha = 1; c.drawImage(tint([M[0], M[1]]), 0, 0); }
    /* Glanz oben links */
    if (!lock) { c.save(); c.translate(48, 46); c.globalCompositeOperation = "lighter"; const hl = c.createRadialGradient(-14, -18, 1, -14, -18, 22); hl.addColorStop(0, "rgba(255,240,210,.32)"); hl.addColorStop(1, "rgba(255,240,210,0)"); c.fillStyle = hl; c.beginPath(); c.arc(0, 0, 35, 0, TAU); c.fill(); c.restore(); }
    /* gesperrt: Kette quer */
    if (lock) { c.save(); c.translate(48, 46); c.rotate(-0.5); c.strokeStyle = "#4a423e"; c.lineWidth = 2.2; for (let x = -40; x <= 40; x += 9) { c.beginPath(); c.ellipse(x, 0, 5, x / 9 % 2 ? 1.6 : 3.2, 0, 0, TAU); c.stroke(); } c.fillStyle = "#3a322e"; c.fillRect(-6, -3, 12, 11); c.beginPath(); c.arc(0, -3, 4.5, Math.PI, 0); c.lineWidth = 2; c.stroke(); c.restore(); }
    cache.set(key, cv); return cv;
  };
  const urls = new Map();
  Z.siegelURL = function (motiv, o) { const cv = Z.siegel(motiv, o), k = cv; let u = urls.get(k); if (!u) { u = Z.leinwandURL ? Z.leinwandURL(cv) : cv.toDataURL(); /* W23 Browser */ urls.set(k, u); } return u; };
})();
