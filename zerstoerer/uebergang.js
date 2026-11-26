/* Ezekiel – The Destroyer · Übergänge und filmreife Momente
   1) Buchseiten: Beim Betreten eines Gebiets liegt eine gemalte Titelseite über dem Bild – Pergament,
      verzierter Rahmen, Initiale, Kapitelzahl, Gebietsname, Untertitel, Erzählzeile und eine kleine
      gemalte Miniatur (aus der Bilderbuch-Kulisse geschnitten, sonst selbst gemalt). Dann blättert die Seite
      um (Eselsohr, Papierbiegung, Schatten, durchscheinende Rückseite) und gibt den Blick frei.
      Tod/Lagerrückkehr: eine Seite legt sich von links über das Bild („Hier endet das Kapitel“) und wird zur
      Lagerseite umgeblättert. Jede Taste, jeder Knopf, jedes Tippen blättert sofort weiter.
   2) Einführungsschwenk: beim ersten Betreten eines Gebiets im Lauf zeigt die Kamera kurz den Weg zum Ausgang
      (Kinobalken, Schild am Ausgang) und kehrt zu Ezekiel zurück – überspringbar.
   3) Höhepunkte: letzter Treffer gegen Boss/Wächter (Zoom, Farbblitz, Schockwellen, Stille, dann Lichtstrahlen
      und Funken), Lichtstrahl und Lichtkranz über legendären Funden, goldene Funken bei Erfolgen und Rekorden,
      Sog in die Tür beim Gebietswechsel.
   4) Bossauftritt mit Namensband im Bilderbuchstil und Kinobalken, Tintenrand beim Fallen,
      ruhiges Kamera-Atmen, wenn nichts los ist.
   Handheld (Grafikstufe 0): nur eine schlichte Titelkarte, sonst aus. Z.settings.cineOff = true schaltet alles ab.
   Farbregel: kein Blau. */
(function () {
  "use strict";
  const Z = window.Z, FX = Z.fx, A = Z.audio, inp = Z.input, ui = Z.ui, T = Z.TILE;
  const L = v => Z.L(v);
  const TAU = Math.PI * 2, PI = Math.PI;
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const lerp = (a, b, t) => a + (b - a) * t;
  const span = (u, a, b) => clamp((u - a) / (b - a), 0, 1);
  const easeIO = u => (u <= 0 ? 0 : u >= 1 ? 1 : u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2);
  const easeOut = u => (u <= 0 ? 0 : u >= 1 ? 1 : 1 - Math.pow(1 - u, 3));
  const easeIn = u => (u <= 0 ? 0 : u >= 1 ? 1 : u * u * u);
  const qLevel = () => { const q = Z.gq; if (!q || !Number.isFinite(q.level)) return 2; return q.level < 0 ? 2 : q.level; };
  const low = () => qLevel() === 0;
  /* Handheld (Stufe 0): ganz aus – dort zählt nur die Spielmechanik */
  const on = () => !(Z.settings && Z.settings.cineOff) && !(Z.gq && Z.gq.level === 0);
  const rich = () => on() && !low();
  /* Komfort „Schnellstart“: Kapitelseiten (Betreten, Lagerrückkehr) und die Kamerafahrt zum Ausgang immer überspringen */
  const quick = () => !!(Z.settings && Z.settings.schnellstart);
  const mk = (w, h) => { const c = document.createElement("canvas"); c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h)); return c; };
  const hashS = s => { let h = 2166136261; s = String(s); for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0) / 4294967296; };
  const roman = n => { n = Math.max(1, Math.min(3999, n | 0)); let o = ""; for (const [v, r] of [[1000, "M"], [900, "CM"], [500, "D"], [400, "CD"], [100, "C"], [90, "XC"], [50, "L"], [40, "XL"], [10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"]]) while (n >= v) { o += r; n -= v; } return o; };
  const fmtTime = s => { s = Math.floor(s || 0); return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0"); };

  /* ---------- Farben (Tinte, Rubrik-Rot, Gold, Pergament – kein Blau) ---------- */
  const INK = "#2a1810", INK2 = "#4a3020", RED = "#8a1f14", RED2 = "#5a120c", GOLD = "#c8952e", GOLD2 = "#f0cf7a";
  const hexRGB = h => { let s = String(h || "#000").replace("#", ""); if (s.length === 3) s = s.split("").map(x => x + x).join(""); const n = parseInt(s, 16) || 0; return [n >> 16 & 255, n >> 8 & 255, n & 255]; };
  const toHex = (r, g, b) => "#" + ((1 << 24) | (clamp(Math.round(r), 0, 255) << 16) | (clamp(Math.round(g), 0, 255) << 8) | clamp(Math.round(b), 0, 255)).toString(16).slice(1);
  const mix = (a, b, t) => { const A1 = hexRGB(a), B1 = hexRGB(b); return toHex(lerp(A1[0], B1[0], t), lerp(A1[1], B1[1], t), lerp(A1[2], B1[2], t)); };
  /* kein Blau: Blauanteil höchstens leicht über Rot/Grün (Lila bleibt erlaubt) */
  const nb = h => { const v = hexRGB(h), m = Math.max(v[0] * 1.2, v[1]); return v[2] > m ? toHex(v[0], v[1], m) : toHex(v[0], v[1], v[2]); };
  const rgba = (h, a) => { const v = hexRGB(h); return "rgba(" + v[0] + "," + v[1] + "," + v[2] + "," + clamp(a, 0, 1).toFixed(3) + ")"; };

  /* ---------- Schriften ---------- */
  const css = getComputedStyle(document.documentElement);
  const FD = (css.getPropertyValue("--fd") || "").trim() || "'IM Fell English SC',Georgia,serif";
  const FB = (css.getPropertyValue("--fb") || "").trim() || "'Alegreya Sans',sans-serif";
  const FI = "'IM Fell English','Palatino Linotype',Palatino,Georgia,serif";
  try { if (document.fonts && document.fonts.load) for (const f of ["40px 'IM Fell English SC'", "italic 30px 'IM Fell English'", "30px 'IM Fell English'"]) document.fonts.load(f).catch(() => {}); } catch (_) {}
  function fitFont(c, text, tpl, size, maxW, minSize) {
    let s = size; c.font = tpl.replace("$", s.toFixed(1));
    while (s > (minSize || 6) && c.measureText(text).width > maxW) { s *= 0.94; c.font = tpl.replace("$", s.toFixed(1)); }
    return s;
  }
  function wrap(c, text, maxW, maxLines) {
    const words = String(text || "").split(/\s+/).filter(Boolean), lines = []; let cur = "";
    for (const w of words) { const t = cur ? cur + " " + w : w; if (c.measureText(t).width > maxW && cur) { lines.push(cur); cur = w; } else cur = t; }
    if (cur) lines.push(cur);
    if (maxLines && lines.length > maxLines) { const k = lines.slice(0, maxLines); k[maxLines - 1] = k[maxLines - 1].replace(/[\s,.;:–-]*\S*$/, "") + " …"; return k; }
    return lines;
  }

  /* ======================= PERGAMENT ======================= */
  let parch = null, parchBack = null;
  function parchment(W, H) {
    if (parch && parch.width === W && parch.height === H) return parch;
    const cv = mk(W, H), c = cv.getContext("2d"), R = Z.Rng(7177), mn = Math.min(W, H);
    const g = c.createRadialGradient(W * 0.55, H * 0.45, mn * 0.1, W * 0.5, H * 0.5, Math.hypot(W, H) * 0.62);
    g.addColorStop(0, "#f2e3c0"); g.addColorStop(0.55, "#e6d1a2"); g.addColorStop(1, "#bf9558");
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    /* Wolken im Papier: klein malen, weich hochskalieren */
    const sw = Math.max(64, Math.round(W / 6)), sh = Math.max(36, Math.round(H / 6)), m = mk(sw, sh), mc = m.getContext("2d");
    for (let i = 0; i < 280; i++) {
      const x = R() * sw, y = R() * sh, r = 2 + R() * sw * 0.07, dark = R() < 0.55;
      const gg = mc.createRadialGradient(x, y, 0, x, y, r); gg.addColorStop(0, dark ? "rgba(120,78,30,.11)" : "rgba(255,248,225,.16)"); gg.addColorStop(1, "rgba(0,0,0,0)");
      mc.fillStyle = gg; mc.fillRect(x - r, y - r, r * 2, r * 2);
    }
    c.imageSmoothingEnabled = true; c.drawImage(m, 0, 0, W, H);
    /* Fasern: in wenigen Pfaden gebündelt (ein Strich-Aufruf je Farbton) */
    const lw = Math.max(0.6, mn / 700);
    const FIB = [["rgba(110,70,30,.07)", 1], ["rgba(110,70,30,.11)", 0.6], ["rgba(255,250,230,.12)", 1.2], ["rgba(255,250,230,.17)", 0.7]];
    for (const [col, wk] of FIB) {
      c.strokeStyle = col; c.lineWidth = lw * wk; c.beginPath();
      for (let i = 0; i < 160; i++) {
        const x = R() * W, y = R() * H, l = mn * (0.01 + R() * 0.03), a = (R() - 0.5) * 0.5 + (R() < 0.3 ? PI / 2 : 0);
        c.moveTo(x, y); c.quadraticCurveTo(x + Math.cos(a) * l * 0.5 + (R() - 0.5) * l * 0.3, y + Math.sin(a) * l * 0.5, x + Math.cos(a) * l, y + Math.sin(a) * l);
      }
      c.stroke();
    }
    /* Stockflecken */
    for (let i = 0; i < 26; i++) {
      const x = R() * W, y = R() * H, r = mn * (0.004 + R() * 0.018);
      const gg = c.createRadialGradient(x, y, 0, x, y, r); gg.addColorStop(0, "rgba(130,80,30," + (0.12 + R() * 0.16).toFixed(3) + ")"); gg.addColorStop(0.7, "rgba(130,80,30,.05)"); gg.addColorStop(1, "rgba(130,80,30,0)");
      c.fillStyle = gg; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill();
    }
    /* Bundsteg links (rechte Buchseite) und angebräunte Ränder */
    const gb = c.createLinearGradient(0, 0, W * 0.09, 0); gb.addColorStop(0, "rgba(60,32,10,.5)"); gb.addColorStop(0.35, "rgba(80,45,15,.18)"); gb.addColorStop(1, "rgba(80,45,15,0)");
    c.fillStyle = gb; c.fillRect(0, 0, W * 0.09, H);
    const ge = c.createRadialGradient(W / 2, H / 2, mn * 0.42, W / 2, H / 2, Math.hypot(W, H) * 0.56); ge.addColorStop(0, "rgba(90,50,15,0)"); ge.addColorStop(1, "rgba(90,50,15,.42)");
    c.fillStyle = ge; c.fillRect(0, 0, W, H);
    for (const [x0, y0, x1, y1] of [[0, 0, 0, H * 0.04], [0, H, 0, H * 0.96], [W, 0, W * 0.985, 0]]) { const e = c.createLinearGradient(x0, y0, x1, y1); e.addColorStop(0, "rgba(80,42,12,.35)"); e.addColorStop(1, "rgba(80,42,12,0)"); c.fillStyle = e; c.fillRect(0, 0, W, H); }
    parch = cv;
    /* Rückseite: heller, ohne Bundsteg */
    const b = mk(W, H), bc = b.getContext("2d"); bc.drawImage(cv, 0, 0); bc.fillStyle = "rgba(246,234,206,.42)"; bc.fillRect(0, 0, W, H); parchBack = b;
    return cv;
  }

  /* ======================= ZIERRAT ======================= */
  function leaf(c, x, y, r, rot) { c.save(); c.translate(x, y); c.rotate(rot); c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(r * 0.5, -r * 0.42, r, 0); c.quadraticCurveTo(r * 0.5, r * 0.42, 0, 0); c.fill(); c.restore(); }
  function diamond(c, x, y, r) { c.beginPath(); c.moveTo(x, y - r); c.lineTo(x + r * 0.7, y); c.lineTo(x, y + r); c.lineTo(x - r * 0.7, y); c.closePath(); c.fill(); }
  function spiral(c, x, y, r0, turns, ph) { c.beginPath(); const n = 36; for (let i = 0; i <= n; i++) { const u = i / n, a = ph + u * TAU * turns, r = r0 * (1 - u * 0.85); const px = x + Math.cos(a) * r, py = y + Math.sin(a) * r; i ? c.lineTo(px, py) : c.moveTo(px, py); } c.stroke(); }
  function corner(c, x, y, sx, sy, s) {
    c.save(); c.translate(x, y); c.scale(sx, sy); c.lineCap = "round";
    c.strokeStyle = INK2; c.lineWidth = s * 0.42;
    c.beginPath(); c.moveTo(0, 17 * s); c.bezierCurveTo(0, 6 * s, 6 * s, 0, 17 * s, 0); c.stroke();
    c.lineWidth = s * 0.28; c.beginPath(); c.moveTo(3 * s, 12 * s); c.bezierCurveTo(3 * s, 6 * s, 6 * s, 3 * s, 12 * s, 3 * s); c.stroke();
    c.lineWidth = s * 0.34; spiral(c, 7 * s, 7 * s, 3.1 * s, 1.5, 3.9);
    c.fillStyle = RED; leaf(c, 17.5 * s, 0.8 * s, 3.4 * s, 0.25); leaf(c, 0.8 * s, 17.5 * s, 3.4 * s, PI / 2 - 0.25);
    c.fillStyle = GOLD; diamond(c, 10.6 * s, 10.6 * s, 1.1 * s); c.beginPath(); c.arc(17 * s, 0, 0.7 * s, 0, TAU); c.arc(0, 17 * s, 0.7 * s, 0, TAU); c.fill();
    c.restore();
  }
  function fleuron(c, x, y, s, flip) {
    c.save(); c.translate(x, y); if (flip) c.scale(1, -1);
    c.strokeStyle = INK2; c.lineWidth = s * 0.3; c.lineCap = "round";
    for (const k of [-1, 1]) { c.beginPath(); c.moveTo(k * 1.6 * s, 0); c.bezierCurveTo(k * 5 * s, -2.6 * s, k * 9 * s, 1.6 * s, k * 12 * s, 0); c.stroke(); spiral(c, k * 12.8 * s, -1 * s, 1.5 * s, 1.2, k > 0 ? 1.7 : 1.4); }
    c.fillStyle = RED; diamond(c, 0, 0, 2 * s); c.fillStyle = GOLD; diamond(c, 0, 0, 0.9 * s);
    c.restore();
  }
  function divider(c, cx, y, w, s) {
    c.save(); c.strokeStyle = INK2; c.lineWidth = s * 0.25;
    c.beginPath(); c.moveTo(cx - w / 2, y); c.lineTo(cx - 4 * s, y); c.moveTo(cx + 4 * s, y); c.lineTo(cx + w / 2, y); c.stroke();
    c.fillStyle = INK2; for (const k of [-1, 1]) { c.beginPath(); c.arc(cx + k * w / 2, y, 0.55 * s, 0, TAU); c.fill(); }
    fleuron(c, cx, y, s * 0.55, false);
    c.restore();
  }
  function ornFrame(c, W, H, s) {
    const m = 4 * s;
    c.save();
    c.strokeStyle = INK2; c.lineWidth = s * 0.5; c.strokeRect(m, m, W - 2 * m, H - 2 * m);
    c.strokeStyle = GOLD; c.lineWidth = s * 0.32; c.strokeRect(m + 0.9 * s, m + 0.9 * s, W - 2 * m - 1.8 * s, H - 2 * m - 1.8 * s);
    c.strokeStyle = INK2; c.lineWidth = s * 0.16; c.strokeRect(m + 1.7 * s, m + 1.7 * s, W - 2 * m - 3.4 * s, H - 2 * m - 3.4 * s);
    const k = m + 1.7 * s;
    corner(c, k, k, 1, 1, s); corner(c, W - k, k, -1, 1, s); corner(c, k, H - k, 1, -1, s); corner(c, W - k, H - k, -1, -1, s);
    c.fillStyle = rgba("#e9d6ab", 1);
    for (const [x, y, f] of [[W / 2, m + 0.9 * s, false], [W / 2, H - m - 0.9 * s, true]]) { c.fillRect(x - 15 * s, y - 2.4 * s, 30 * s, 4.8 * s); fleuron(c, x, y, s, f); }
    c.restore();
  }
  /* Initiale: rotes Feld, Goldrand, Ranken, Goldbuchstabe */
  function dropCap(c, x, y, sz, ch, s) {
    c.save();
    const g = c.createLinearGradient(x, y, x + sz, y + sz); g.addColorStop(0, "#9a2a1a"); g.addColorStop(0.6, RED); g.addColorStop(1, RED2);
    c.fillStyle = g; c.fillRect(x, y, sz, sz);
    c.strokeStyle = GOLD; c.lineWidth = s * 0.55; c.strokeRect(x + s * 0.6, y + s * 0.6, sz - s * 1.2, sz - s * 1.2);
    c.strokeStyle = INK; c.lineWidth = s * 0.3; c.strokeRect(x, y, sz, sz);
    /* Ranken */
    c.strokeStyle = rgba(GOLD2, 0.55); c.lineWidth = s * 0.28; c.lineCap = "round";
    for (const [px, py, ph] of [[0.24, 0.24, 0.2], [0.76, 0.76, 3.3], [0.76, 0.24, 1.8], [0.24, 0.76, 4.9]]) spiral(c, x + sz * px, y + sz * py, sz * 0.14, 1.4, ph);
    c.fillStyle = rgba(GOLD2, 0.5); for (const [px, py, r] of [[0.5, 0.1, 0], [0.5, 0.9, PI], [0.1, 0.5, -PI / 2], [0.9, 0.5, PI / 2]]) leaf(c, x + sz * px, y + sz * py, sz * 0.1, r + PI / 2);
    /* Buchstabe */
    const fs = sz * 0.74; c.font = fs.toFixed(1) + "px " + FD; c.textAlign = "center"; c.textBaseline = "alphabetic";
    const ty = y + sz * 0.5 + fs * 0.34;
    c.lineWidth = s * 0.9; c.strokeStyle = "rgba(40,10,4,.9)"; c.strokeText(ch, x + sz / 2, ty);
    const gl = c.createLinearGradient(0, y + sz * 0.2, 0, y + sz * 0.85); gl.addColorStop(0, "#fff0b8"); gl.addColorStop(0.5, GOLD2); gl.addColorStop(1, "#b07a22");
    c.fillStyle = gl; c.fillText(ch, x + sz / 2, ty);
    c.restore();
  }

  /* ======================= MINIATUR ======================= */
  function arch(c, x, y, w, h) { const r = w / 2; c.beginPath(); c.moveTo(x, y + h); c.lineTo(x, y + r); c.arc(x + r, y + r, r, PI, 0); c.lineTo(x + w, y + h); c.closePath(); }
  /* kleine Tuschfiguren: Ezekiel steht / Schwert im Boden / Sieg / geht fort */
  function figure(c, x, y, h, pose) {
    c.save(); c.fillStyle = "#170d09"; c.strokeStyle = "#170d09"; c.lineCap = "round"; c.lineJoin = "round";
    const u = h / 10;
    if (pose === "sword") {
      c.lineWidth = u * 0.5; c.beginPath(); c.moveTo(x, y + u * 0.3); c.lineTo(x, y - u * 6); c.stroke();
      c.lineWidth = u * 0.55; c.beginPath(); c.moveTo(x - u * 1.6, y - u * 5.6); c.lineTo(x + u * 1.6, y - u * 5.6); c.stroke();
      c.beginPath(); c.arc(x, y - u * 6.6, u * 0.55, 0, TAU); c.fill();
      c.beginPath(); c.moveTo(x - u * 0.3, y - u * 5.3); c.quadraticCurveTo(x + u * 2.6, y - u * 4.4, x + u * 2.2, y); c.lineTo(x + u * 0.8, y); c.quadraticCurveTo(x + u * 1.2, y - u * 3, x - u * 0.3, y - u * 4.6); c.fill();
      c.restore(); return;
    }
    const lean = pose === "walk" ? 0.12 : 0;
    c.save(); c.translate(x, y); c.rotate(lean);
    /* Umhang */
    c.beginPath(); c.moveTo(-u * 1.1, -u * 6.4); c.quadraticCurveTo(-u * 2.4, -u * 3, -u * 2.2, 0); c.lineTo(u * 1.9, 0); c.quadraticCurveTo(u * 1.8, -u * 3.4, u * 1.1, -u * 6.4); c.closePath(); c.fill();
    /* Kapuze */
    c.beginPath(); c.arc(0, -u * 7.1, u * 1.15, 0, TAU); c.fill(); c.beginPath(); c.moveTo(-u * 1.1, -u * 7.4); c.quadraticCurveTo(-u * 0.2, -u * 9.4, u * 0.7, -u * 8.6); c.lineTo(u * 1, -u * 7); c.fill();
    c.lineWidth = u * 0.45;
    if (pose === "raise") { c.beginPath(); c.moveTo(u * 0.8, -u * 6); c.lineTo(u * 2, -u * 8.4); c.stroke(); c.lineWidth = u * 0.42; c.beginPath(); c.moveTo(u * 2, -u * 8.4); c.lineTo(u * 2.9, -u * 13.6); c.stroke(); c.beginPath(); c.moveTo(u * 1.1, -u * 8.9); c.lineTo(u * 3, -u * 8.2); c.stroke(); }
    else if (pose === "walk") { c.beginPath(); c.moveTo(-u * 0.6, -u * 6.2); c.lineTo(u * 2.4, -u * 9.8); c.stroke(); }
    else { c.beginPath(); c.moveTo(-u * 1.4, -u * 1.6); c.lineTo(u * 1.8, -u * 9.6); c.stroke(); }
    c.restore();
    if (pose === "walk") { c.globalAlpha = 0.5; for (let i = 1; i < 5; i++) { c.beginPath(); c.ellipse(x - i * u * 2.4, y + u * 0.2, u * 0.5, u * 0.22, 0, 0, TAU); c.fill(); } }
    c.restore();
  }
  function hills(c, x, y, w, h, info) {
    const B = info.B || {}, R = Z.Rng(((hashS(info.id) * 4294967296) >>> 0) || 7), sky = B.sky || ["#1a1020", "#4a2434", "#8a4a3a"];
    const far = nb(mix(sky[2] || "#8a4a3a", "#000000", 0.25)), mid = nb(mix(B.wall || "#2a2224", sky[1] || "#4a2434", 0.3)), near = nb(mix((B.tile && B.tile.dark) || "#1e1a14", "#000000", 0.2));
    [[far, 0.52, 0.1, false], [mid, 0.64, 0.12, true], [near, 0.8, 0.07, false]].forEach(([col, base, amp, towers]) => {
      c.fillStyle = col; c.beginPath(); c.moveTo(x, y + h);
      const ph = R() * 9, by = y + h * base;
      for (let i = 0; i <= 24; i++) { const px = x + w * i / 24; c.lineTo(px, by - Math.abs(Math.sin(i * 0.55 + ph)) * h * amp - Math.sin(i * 1.7 + ph) * h * amp * 0.25); }
      c.lineTo(x + w, y + h); c.closePath(); c.fill();
      if (towers) for (let k = 0; k < 3; k++) { const tx = x + w * (0.2 + k * 0.28 + R() * 0.08), tw = w * (0.05 + R() * 0.04), th = h * (0.16 + R() * 0.14); c.fillRect(tx, by - th, tw, th + h * 0.1); c.beginPath(); c.moveTo(tx - tw * 0.2, by - th); c.lineTo(tx + tw / 2, by - th - tw * 1.4); c.lineTo(tx + tw * 1.2, by - th); c.fill(); }
    });
  }
  function vignette(c, x, y, w, h, s, info) {
    const B = info.B || {}, sky = (B.sky || ["#1a1020", "#4a2434", "#8a4a3a"]).map(nb);
    c.save(); arch(c, x, y, w, h); c.clip();
    const g = c.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, sky[0]); g.addColorStop(0.5, sky[1]); g.addColorStop(1, sky[2]); c.fillStyle = g; c.fillRect(x, y, w, h);
    const hx = x + w * (0.25 + hashS(info.id + "m") * 0.5), hy = y + h * 0.26;
    const gg = c.createRadialGradient(hx, hy, 0, hx, hy, w * 0.5); gg.addColorStop(0, "rgba(255,236,190,.55)"); gg.addColorStop(0.25, "rgba(255,200,140,.18)"); gg.addColorStop(1, "rgba(255,200,140,0)"); c.fillStyle = gg; c.fillRect(x, y, w, h);
    c.fillStyle = "rgba(255,240,210,.85)"; c.beginPath(); c.arc(hx, hy, w * 0.045, 0, TAU); c.fill();
    let painted = false;
    const pg = info.page;
    if (pg && pg.cv) {
      try {
        /* Die Seiten sind von oben her aufgebaut: einen Ausschnitt wählen, der dem Querformat entspricht */
        const pw = pg.cv.width, ph = pg.cv.height, ky = pg.sy || ph / 370, sy = Math.min(ph * 0.11, 40 * ky), sh = Math.min(ph - sy, 330 * ky), sw = Math.min(pw, sh * w / h);
        const sx = hashS(info.id) * Math.max(0, pw - sw);
        c.drawImage(pg.cv, sx, sy, sw, sh, x, y, w, h); painted = true;
      } catch (_) {}
    }
    if (!painted) hills(c, x, y, w, h, info);
    /* Boden und Figur in Tusche */
    const gy = y + h * 0.9;
    c.fillStyle = "#1c110c"; c.beginPath(); c.moveTo(x, y + h); c.lineTo(x, gy + h * 0.02); c.quadraticCurveTo(x + w * 0.5, gy - h * 0.04, x + w, gy + h * 0.03); c.lineTo(x + w, y + h); c.closePath(); c.fill();
    figure(c, x + w * 0.5, gy - h * 0.012, h * 0.17, info.pose || "stand");
    /* Druck-Anmutung: warm getönt, Ränder dunkler, feine Schraffur */
    c.globalCompositeOperation = "multiply"; c.fillStyle = "rgba(236,212,166,.62)"; c.fillRect(x, y, w, h); c.globalCompositeOperation = "source-over";
    if (info.wash) { c.fillStyle = info.wash; c.fillRect(x, y, w, h); }
    const rg = c.createRadialGradient(x + w / 2, y + h * 0.55, Math.min(w, h) * 0.22, x + w / 2, y + h * 0.55, Math.max(w, h) * 0.72); rg.addColorStop(0, "rgba(40,20,5,0)"); rg.addColorStop(1, "rgba(40,20,5,.6)"); c.fillStyle = rg; c.fillRect(x, y, w, h);
    c.strokeStyle = "rgba(30,15,5,.13)"; c.lineWidth = Math.max(0.5, s * 0.14);
    c.beginPath(); for (let i = -h; i < w; i += s * 1.1) { c.moveTo(x + i, y + h); c.lineTo(x + i + h * 0.5, y + h * 0.5); } c.stroke();
    c.restore();
    /* Rahmen */
    c.save();
    arch(c, x, y, w, h); c.strokeStyle = INK; c.lineWidth = s * 0.9; c.stroke();
    arch(c, x - s * 1.1, y - s * 1.1, w + s * 2.2, h + s * 2.2); c.strokeStyle = GOLD; c.lineWidth = s * 0.5; c.stroke();
    arch(c, x - s * 1.9, y - s * 1.9, w + s * 3.8, h + s * 3.8); c.strokeStyle = INK2; c.lineWidth = s * 0.22; c.stroke();
    c.fillStyle = RED; diamond(c, x + w / 2, y - s * 1.1, s * 2.1); c.fillStyle = GOLD2; diamond(c, x + w / 2, y - s * 1.1, s * 0.9);
    c.restore();
  }

  /* ======================= SEITE BAUEN ======================= */
  function buildPage(W, H, info) {
    const cv = mk(W, H), c = cv.getContext("2d"), s = Math.min(W, H) / 100;
    if (info.low) {
      const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, "#eadab4"); g.addColorStop(1, "#d6bb84"); c.fillStyle = g; c.fillRect(0, 0, W, H);
      c.strokeStyle = INK2; c.lineWidth = s * 0.5; c.strokeRect(4 * s, 4 * s, W - 8 * s, H - 8 * s);
      c.strokeStyle = GOLD; c.lineWidth = s * 0.3; c.strokeRect(5 * s, 5 * s, W - 10 * s, H - 10 * s);
      c.textAlign = "center"; c.textBaseline = "middle";
      c.fillStyle = RED; c.font = (s * 3.6).toFixed(1) + "px " + FD; c.fillText(info.chapter, W / 2, H * 0.36);
      c.fillStyle = INK; fitFont(c, info.title, "$px " + FD, s * 11, W * 0.8); c.fillText(info.title, W / 2, H * 0.48);
      if (info.sub) { c.fillStyle = INK2; fitFont(c, info.sub, "italic $px " + FI, s * 4.2, W * 0.8, 4); c.fillText(info.sub, W / 2, H * 0.6); }
      return cv;
    }
    c.drawImage(parchment(W, H), 0, 0);
    ornFrame(c, W, H, s);
    const portrait = W / H < 1.2;
    let vx, vy, vw, vh, tx, tw;
    if (!portrait) {
      vh = H * 0.6; vw = vh * 0.74; if (vw > W * 0.3) { vw = W * 0.3; vh = vw / 0.74; }
      vx = W * 0.1; vy = (H - vh) / 2 + H * 0.015; tx = vx + vw + W * 0.065; tw = W * 0.9 - tx;
    } else {
      vw = W * 0.64; vh = vw / 0.8; if (vh > H * 0.44) { vh = H * 0.44; vw = vh * 0.8; }
      vx = (W - vw) / 2; vy = H * 0.1; tx = W * 0.1; tw = W * 0.8;
    }
    vignette(c, vx, vy, vw, vh, s, info);
    /* Textblock: Initiale über drei Zeilen (Kapitel, Name, Untertitel) */
    const title = String(info.title || ""), ch = title.charAt(0), rest = title.slice(1);
    const ls = s * 3.3, ss = s * 3.9;
    let fs = s * (portrait ? 9 : 10.5);
    const capGap = s * 2.2;
    let cap = ls * 1.7 + fs * 1.15 + ss * 1.7;
    fs = fitFont(c, rest || " ", "$px " + FD, fs, tw - cap - capGap, s * 4.5);
    cap = ls * 1.7 + fs * 1.15 + ss * 1.7;
    c.font = "italic " + (s * 3.3).toFixed(1) + "px " + FI;
    const story = info.story ? wrap(c, info.story, tw * 0.94, 3) : [];
    const lines2 = info.lines || [];
    const total = cap + s * 6 + (story.length ? story.length * s * 4.6 + s * 1.5 : 0) + (lines2.length ? lines2.length * s * 4.4 + s * 2 : 0);
    let y = portrait ? vy + vh + s * 6 + Math.max(0, (H * 0.9 - (vy + vh + s * 6) - total) / 2) : H / 2 - total / 2;
    dropCap(c, tx, y, cap, ch, s);
    const bx = tx + cap + capGap, bw = tw - cap - capGap;
    c.textAlign = "left"; c.textBaseline = "alphabetic";
    c.fillStyle = RED; c.font = ls.toFixed(1) + "px " + FD; fitFont(c, info.chapter, "$px " + FD, ls, bw);
    c.fillText(info.chapter, bx, y + ls * 1.15);
    c.fillStyle = INK; c.font = fs.toFixed(1) + "px " + FD; c.fillText(rest, bx - s * 0.2, y + ls * 1.7 + fs * 0.92);
    /* Goldglanz unter dem Namen */
    c.fillStyle = rgba(GOLD, 0.7); c.fillRect(bx, y + ls * 1.7 + fs * 1.07, Math.min(bw, c.measureText(rest).width) * 0.5, s * 0.28);
    if (info.sub) { c.fillStyle = INK2; fitFont(c, info.sub, "italic $px " + FI, ss, bw, 4); c.fillText(info.sub, bx, y + cap - ss * 0.42); }
    y += cap + s * 3.4;
    divider(c, tx + tw / 2, y, tw * 0.8, s); y += s * 2.6;
    if (story.length) {
      c.textAlign = "center"; c.fillStyle = "#3a2416"; c.font = "italic " + (s * 3.3).toFixed(1) + "px " + FI;
      story.forEach((ln, i) => c.fillText(ln, tx + tw / 2, y + s * 3.6 + i * s * 4.6));
      y += story.length * s * 4.6 + s * 1.5;
    }
    if (lines2.length) {
      c.textAlign = "center";
      lines2.forEach((ln, i) => { c.fillStyle = i === lines2.length - 1 && info.quote ? "#5a3a22" : INK; c.font = (i === lines2.length - 1 && info.quote ? "italic " + (s * 3.2).toFixed(1) + "px " + FI : (s * 3.4).toFixed(1) + "px " + FD); fitFont(c, ln, c.font.replace(/[\d.]+px/, "$px"), parseFloat(c.font.match(/([\d.]+)px/)[1]), tw); c.fillText(ln, tx + tw / 2, y + s * 4 + i * s * 4.4); });
    }
    /* Seitenzahl */
    if (info.pageNo) { c.textAlign = "center"; c.fillStyle = INK2; c.font = "italic " + (s * 2.8).toFixed(1) + "px " + FI; c.fillText("· " + roman(info.pageNo).toLowerCase() + " ·", W / 2, H - s * 9.5); }
    return cv;
  }

  /* ======================= UMBLÄTTERN ======================= */
  /* Halbebene schneiden (Sutherland–Hodgman mit einer Kante): pos = Seite mit p·n > d */
  function clipPoly(pts, nx, ny, d, pos) {
    const out = [], side = p => (p[0] * nx + p[1] * ny - d) * (pos ? 1 : -1);
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i], b = pts[(i + 1) % pts.length], sa = side(a), sb = side(b);
      if (sa >= 0) out.push(a);
      if ((sa >= 0) !== (sb >= 0)) { const t = sa / (sa - sb); out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]); }
    }
    return out;
  }
  const polyPath = (c, p) => { c.beginPath(); p.forEach((q, i) => (i ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1]))); c.closePath(); };
  /* e = 0: Seite liegt ganz, e = 1: Seite ist weg. Ecke unten rechts wird zur Mitte/links gezogen. */
  function drawTurn(c, W, H, front, under, e, fine) {
    const Cx = W, Cy = H;
    const Dx = W + (-(W * 1.0 + H * 0.75) - W) * e, Dy = H + (H * 0.18 - H) * e - Math.sin(PI * e) * H * 0.24;
    let nx = Cx - Dx, ny = Cy - Dy; const len = Math.hypot(nx, ny);
    if (len < 0.5) { c.drawImage(front, 0, 0, W, H); return; }
    nx /= len; ny /= len;
    const mx = (Cx + Dx) / 2, my = (Cy + Dy) / 2, d = mx * nx + my * ny;
    const rect = [[0, 0], [W, 0], [W, H], [0, H]];
    const keep = clipPoly(rect, nx, ny, d, false), gone = clipPoly(rect, nx, ny, d, true);
    const mn = Math.min(W, H), lift = Math.sin(PI * Math.min(1, e * 1.25));
    if (under && gone.length > 2) { c.save(); polyPath(c, gone); c.clip(); c.drawImage(under, 0, 0, W, H); c.restore(); }
    /* Schatten der gehobenen Seite auf dem, was darunter liegt */
    if (gone.length > 2) {
      const sw = mn * (0.05 + 0.12 * lift);
      c.save(); polyPath(c, gone); c.clip();
      const g = c.createLinearGradient(mx, my, mx + nx * sw, my + ny * sw); g.addColorStop(0, "rgba(16,8,3,.55)"); g.addColorStop(1, "rgba(16,8,3,0)");
      c.fillStyle = g; c.fillRect(0, 0, W, H); c.restore();
    }
    if (keep.length > 2) {
      c.save(); polyPath(c, keep); c.clip(); c.drawImage(front, 0, 0, W, H);
      const sw = mn * 0.08;
      const g = c.createLinearGradient(mx, my, mx - nx * sw, my - ny * sw); g.addColorStop(0, "rgba(50,25,6,.42)"); g.addColorStop(1, "rgba(50,25,6,0)");
      c.fillStyle = g; c.fillRect(0, 0, W, H); c.restore();
    }
    if (gone.length > 2) {
      /* Lasche: gespiegelt an der Falzlinie, etwas gestaucht (die Seite ist gebogen, nicht flach) */
      const k = 0.88 - 0.1 * lift, f = 1 + k;
      const a = 1 - f * nx * nx, b = -f * nx * ny, dd = 1 - f * ny * ny, ex = f * d * nx, ey = f * d * ny;
      const flap = gone.map(([x, y]) => [a * x + b * y + ex, b * x + dd * y + ey]);
      c.save();
      if (fine) { c.shadowColor = "rgba(20,10,0,.5)"; c.shadowBlur = mn * 0.035; c.shadowOffsetX = -nx * mn * 0.012; c.shadowOffsetY = -ny * mn * 0.012 + mn * 0.006; }
      polyPath(c, flap); c.fillStyle = "#dcc596"; c.fill(); c.restore();
      c.save(); polyPath(c, flap); c.clip();
      c.setTransform(a, b, b, dd, ex, ey);
      c.drawImage(parchBack || front, 0, 0, W, H);
      c.globalAlpha = 0.09; c.drawImage(front, 0, 0, W, H); c.globalAlpha = 1; /* durchscheinende Schrift */
      c.setTransform(1, 0, 0, 1, 0, 0);
      let far = 1; for (const q of flap) far = Math.max(far, d - (q[0] * nx + q[1] * ny));
      const g = c.createLinearGradient(mx, my, mx - nx * far, my - ny * far);
      g.addColorStop(0, "rgba(70,38,10,.5)"); g.addColorStop(0.1, "rgba(120,80,40,.12)"); g.addColorStop(0.24, "rgba(255,248,228,.34)"); g.addColorStop(0.5, "rgba(255,248,228,.06)"); g.addColorStop(1, "rgba(70,40,12,.3)");
      c.fillStyle = g; c.fillRect(0, 0, W, H);
      c.restore();
      c.save(); polyPath(c, flap); c.strokeStyle = "rgba(110,70,30,.55)"; c.lineWidth = Math.max(1, mn * 0.0016); c.stroke();
      c.beginPath(); c.moveTo(mx - ny * 4 * W, my + nx * 4 * W); c.lineTo(mx + ny * 4 * W, my - nx * 4 * W); c.restore();
    }
  }

  /* ======================= BUCH (Seitenstapel) ======================= */
  const hudEl = document.getElementById("hud"), promptEl = document.getElementById("prompt"), cardEl = document.getElementById("card");
  let book = null, muteBanner = false, skipReq = false, padPrev = [];
  const visitSeen = { seed: null, set: new Set() };
  const HOLD_IN = 0.8, TURN = 0.78, TURN_AREA = 0.55; /* Gebietsseiten: kurz, nicht blockierend (Spiel läuft darunter weiter) */
  let hudHidden = false;
  function hudHide(v) {
    if (!hudEl || hudHidden === !!v) return; hudHidden = !!v; ui.verdeckt = !!v;
    /* HUD, Meldungen und Weltschilder warten, solange die Seite über dem Bild liegt */
    for (const el of [hudEl, document.getElementById("meldungen"), document.getElementById("welt"), promptEl, cardEl]) if (el) /* W24 Auflösung: Fundkarte/Hinweis lagen über der Kapitelseite (kleine Schirme: halbe Seite verdeckt) */ { el.style.transition = "opacity .3s"; el.style.opacity = v ? "0" : ""; }
  }
  function pageInfo(id, B, lv) {
    const run = Z.run;
    if (lv.hub) return { kind: "hub", chapter: L(["Prolog", "Prologue"]), title: L(B.name), sub: L(["Hier beginnt jeder Lauf. Mit leeren Händen.", "Every run begins here. Empty-handed."]), story: L(["Am Feuer wird erzählt, was in der Feste geschah – und was noch geschehen wird.", "By the fire they tell what happened in the keep – and what is yet to happen."]), hold: 0.7, pose: "stand" };
    if (lv.passage) return { kind: "passage", chapter: L(["Zwischenspiel", "Interlude"]), title: L(["Durchgang", "Passage"]), sub: L(["Weiter nach: ", "Onward to: "]) + Z.areaName(lv.to), story: L(["Ein Atemzug zwischen zwei Kapiteln. Händler, Brunnen, ein Altar – und Nundros Rabe.", "A breath between two chapters. A merchant, a fountain, an altar – and Nundro's raven."]), hold: 0.5, pose: "stand" };
    const n = run ? run.route.length : 1;
    if (lv.arena) {
      const AR = Z.ARENAS[id] || {}, fin = !!AR.final;
      return { kind: "arena", chapter: (fin ? L(["Letztes Kapitel", "Final Chapter"]) : L(["Kapitel ", "Chapter "]) + roman(n)), title: Z.areaName(id), sub: fin ? L(["Am Ende eines Fadens", "At the end of a thread"]) : L(["Ein Kampf, von dem man noch erzählen wird", "A fight they will tell of"]), story: L((Z.BIOMES[AR.base] || {}).story || ["", ""]), hold: 0.8, pose: "stand", pageNo: n * 2 + 1 };
    }
    return { kind: "area", chapter: L(["Kapitel ", "Chapter "]) + roman(n), title: L(B.name), sub: L(B.sub || ["", ""]), story: B.story ? L(B.story) : "", hold: 0.75, pose: "stand", pageNo: n * 2 + 1 };
  }
  function grabPage() {
    try {
      /* schon gemalt (gleiches Gebiet)? Dann wiederverwenden – sonst jetzt malen (geschähe beim ersten Bild ohnehin) */
      let pg = Z.bilderbuchPage && Z.bilderbuchPage();
      if (!pg || pg.lvRef !== Z.level) { if (Z.bilderbuchBuild) Z.bilderbuchBuild(); pg = Z.bilderbuchPage && Z.bilderbuchPage(); }
      return pg && !pg.none && pg.cv ? pg : null;
    } catch (_) { return null; }
  }
  /* Buchseiten liegen auf einer eigenen Leinwand (#buchcv) in Bildschirmauflösung:
     die Spiel-Leinwand rechnet auf großen Bildschirmen mit verringerter Auflösung (z. B. 0,35–0,55 bei 1440p) –
     Schrift auf ihr wäre unscharf. Pixelzahl begrenzt (hohe Qualität 5,2 MP ≈ 3440×1440, sonst 2,4 MP). */
  let ov = null, ovc = null, ovOn = false;
  function ovSize() {
    const w = innerWidth, h = innerHeight, maxP = qLevel() >= 2 ? 5.2e6 : 2.4e6;
    let d = Math.min(window.devicePixelRatio || 1, 2); if (w * h * d * d > maxP) d = Math.sqrt(maxP / (w * h));
    return [Math.max(1, Math.round(w * d)), Math.max(1, Math.round(h * d))];
  }
  function overlay() {
    if (!ov) {
      ov = document.createElement("canvas"); ov.id = "buchcv"; ov.setAttribute("aria-hidden", "true");
      ov.style.cssText = "position:fixed;inset:0;width:100%;height:100%;pointer-events:none;display:none";
      const cv = document.getElementById("cv"); if (cv && cv.parentNode) cv.parentNode.insertBefore(ov, cv.nextSibling); else document.body.appendChild(ov);
      ovc = ov.getContext("2d");
    }
    const [w, h] = ovSize(); if (ov.width !== w || ov.height !== h) { ov.width = w; ov.height = h; }
    return ov;
  }
  function overlayShow(v) { if (ovOn === v) return; ovOn = v; if (ov) { ov.style.display = v ? "block" : "none"; if (!v) ovc.clearRect(0, 0, ov.width, ov.height); } }
  function canvasSize() { return ovSize(); }
  function newPage(info) {
    const [W, H] = canvasSize();
    return { cv: buildPage(W, H, info), hold: info.hold || 1, low: !!info.low, info };
  }
  function startBook(page, o) {
    o = o || {};
    book = { pages: [page], i: 0, mode: o.closing ? "in" : "hold", t: 0, age: 0, fast: false, closing: !!o.closing, onClosed: o.onClosed || null, pan: !!o.pan, low: !!page.low, appear: !o.closing };
    hudHide(true);
  }
  function endBook() { book = null; hudHide(!!pan); }
  function bookStep(dt) {
    const b = book; if (!b) return;
    b.age += dt;
    if (b.age > 14) { endBook(); return; } /* Sicherung */
    b.t += dt * (b.fast ? 2.8 : 1);
    if (b.mode === "in") { if (b.t >= HOLD_IN) { b.mode = "hold"; b.t = 0; } return; }
    if (b.mode === "hold") {
      const pg = b.pages[b.i], hold = b.fast ? 0.05 : pg.hold;
      if (b.t >= hold) {
        if (b.closing && b.onClosed && b.i === b.pages.length - 1) { const fn = b.onClosed; b.onClosed = null; try { fn(); } catch (e) { console.error(e); } if (!book) return; }
        b.mode = "turn"; b.t = 0;
        if (b.i === b.pages.length - 1 && b.pan) { b.pan = false; if (!b.fast) startPan(); }
      }
      return;
    }
    if (b.mode === "turn") {
      if (b.t >= (b.low ? 0.32 : b.closing ? TURN : TURN_AREA)) { b.i++; b.t = 0; b.appear = false; if (b.i >= b.pages.length) endBook(); else b.mode = "hold"; }
    }
  }
  function drawBook(c, W, H) {
    const b = book; if (!b) return;
    const pg = b.pages[b.i]; if (!pg) return;
    const under = b.pages[b.i + 1] ? b.pages[b.i + 1].cv : null;
    c.save(); c.setTransform(1, 0, 0, 1, 0, 0);
    if (b.low) {
      if (b.mode === "turn") { const e = easeIn(b.t / 0.32); if (under) c.drawImage(under, 0, 0, W, H); c.globalAlpha = 1 - e; c.drawImage(pg.cv, 0, -H * 0.35 * e, W, H); }
      else c.drawImage(pg.cv, 0, 0, W, H);
      c.restore(); return;
    }
    if (b.mode === "in") drawTurn(c, W, H, pg.cv, null, 1 - easeIO(Math.min(1, b.t / HOLD_IN)), qLevel() >= 2);
    else if (b.mode === "hold") {
      if (b.appear && ui.modalOpen) b.appear = false; /* wartet hinter einem Fenster (Steuerung, Erzählung): Seite gleich ganz zeigen */
      if (b.appear && b.t < 0.15) c.globalAlpha = b.t / 0.15;
      c.drawImage(pg.cv, 0, 0, W, H); c.globalAlpha = 1;
      /* leichtes Atmen des Papiers: Lichtkante wandert */
      const s = Math.min(W, H) / 100, a = 0.06 + 0.04 * Math.sin(b.age * 2.2);
      const g = c.createLinearGradient(W * (0.2 + 0.1 * Math.sin(b.age * 0.8)), 0, W, H); g.addColorStop(0, "rgba(255,240,200,0)"); g.addColorStop(0.5, "rgba(255,240,200," + a.toFixed(3) + ")"); g.addColorStop(1, "rgba(255,240,200,0)");
      if (qLevel() >= 2) { c.globalCompositeOperation = "lighter"; c.fillStyle = g; c.fillRect(0, 0, W, H); c.globalCompositeOperation = "source-over"; }
      /* Eselsohr unten rechts: hebt sich kurz vor dem Umblättern */
      const pre = span(b.t, Math.max(0, pg.hold - 0.45), pg.hold) * (b.fast ? 0 : 1);
      if (pre > 0 && !(b.closing && b.i === b.pages.length - 1 && b.onClosed)) { c.restore(); c.save(); c.setTransform(1, 0, 0, 1, 0, 0); drawTurn(c, W, H, pg.cv, under, 0.035 * easeIO(pre), true); }
      /* Hinweis */
      const ha = b.closing ? span(b.t, 0.35, 0.7) * 0.75 : 0; /* Gebietsseiten blättern von selbst um – kein Tastenhinweis */
      if (ha > 0) {
        const dev = inp.device === "pad" ? L(["Knopf: weiter", "Button: continue"]) : inp.device === "touch" || (ui.touchOn && inp.device !== "pad") ? L(["Tippen: weiter", "Tap: continue"]) : L(["Taste: weiter", "Any key: continue"]);
        c.globalAlpha = ha; c.fillStyle = INK2; c.font = "italic " + (s * 2.6).toFixed(1) + "px " + FI; c.textAlign = "right"; c.textBaseline = "alphabetic";
        c.fillText("— " + dev + " ▸", W - s * 25, H - s * 8); c.globalAlpha = 1;
      }
    } else if (b.mode === "turn") drawTurn(c, W, H, pg.cv, under, easeIO(Math.min(1, b.t / (b.closing ? TURN : TURN_AREA))), qLevel() >= 2);
    c.restore();
  }
  function skipAll() {
    if (book && book.age > 0.12) { book.fast = true; if (book.mode === "hold") book.t = 99; }
    if (pan) { pan = null; }
    if (suck && !suck.done) suck.t = suck.dur;
    w30Skip(); /* W30 Grafik: Boss-Auftritt */
  }

  /* ======================= EINFÜHRUNGSSCHWENK ======================= */
  let pan = null;
  function startPan() {
    const lv = Z.level, P = Z.player, cam = Z.cam; if (!lv || !P || !cam.bounds) return;
    const hx = cam.x + cam.w / 2, hy = cam.y + cam.h / 2;
    let tx, ty, door = null;
    if (lv.arena && lv.bossSpot) { tx = lv.bossSpot.x * T + 8; ty = lv.bossSpot.y * T - 10; }
    else {
      let best = null, bd = Infinity;
      for (const d of lv.doors || []) if (d.kind === "exit") { const dd = Math.hypot(d.x * T - hx, d.y * T - hy); if (dd < bd) { bd = dd; best = d; } }
      if (!best) return; door = best; tx = best.x * T + 8; ty = (best.y + 1) * T - 30;
    }
    let dx = tx - hx, dy = ty - hy; const dist = Math.hypot(dx, dy), maxD = cam.w * 2.6;
    if (dist < cam.w * 0.4) return;
    const reach = dist <= maxD; if (!reach) { dx *= maxD / dist; dy *= maxD / dist; }
    const go = clamp(0.75 + (Math.min(dist, maxD) / cam.w) * 0.28, 0.9, 1.5);
    pan = { t: 0, hx, hy, tx: hx + dx, ty: hy + dy, go, hold: reach ? 0.8 : 0.55, back: go * 0.8, door: reach ? door : null, arena: !!lv.arena, lv };
  }
  function panE(p) { return p.t < p.go ? easeIO(p.t / p.go) : p.t < p.go + p.hold ? 1 : 1 - easeIO((p.t - p.go - p.hold) / p.back); }

  /* ======================= SOG IN DIE TÜR ======================= */
  let suck = null;
  const fade0 = ui.fade;
  ui.fade = function (fn) {
    const it = Z.interactTarget, P = Z.player;
    if (!suck && rich() && Z.level && P && !P.dead && it && it.type === "door" && !book) {
      const d = it.d;
      suck = { t: 0, dur: 0.46, x: d.x * T + 8, y: (d.y + 1) * T - 15, fn, done: false, ps: [], gate: d.kind === "gate" };
      A.play("shadow", { vol: 0.3, rate: 0.8 }); A.play("magic", { vol: 0.22, rate: 0.7 });
      inp.rumble && inp.rumble(0.25, 300);
      return;
    }
    return fade0.apply(this, arguments);
  };
  function suckStep(dt) {
    const s = suck; if (!s) return;
    s.t += dt;
    const P = Z.player;
    if (!s.done && P && Z.level) { const k = 1 - Math.pow(0.02, dt); P.x += (s.x - P.w / 2 - P.x) * k * 0.5; }
    if (s.ps.length < 70 && s.t < s.dur) for (let i = 0; i < 3; i++) s.ps.push({ a: Math.random() * TAU, r: 22 + Math.random() * 30, v: 2.2 + Math.random() * 2, life: 1 });
    for (const p of s.ps) { p.r -= dt * (34 + (52 - p.r) * 1.6); p.a += dt * p.v * (1 + 40 / Math.max(6, p.r)); if (p.r < 3) p.life = 0; }
    s.ps = s.ps.filter(p => p.life > 0);
    if (!s.done && s.t >= s.dur) { s.done = true; s.doneT = s.t; try { fade0.call(ui, s.fn); } catch (e) { console.error(e); } }
    if (s.done && s.t > s.doneT + 0.6) suck = null;
  }
  function drawSuck(c) {
    const s = suck; if (!s) return;
    const u = clamp(s.t / s.dur, 0, 1), a = Math.min(1, s.t / 0.12);
    c.save();
    /* dunkler Schlund */
    const r0 = 7 + 12 * easeOut(u);
    const g = c.createRadialGradient(s.x, s.y, 0, s.x, s.y, r0 * 2.6); g.addColorStop(0, "rgba(8,3,2," + (0.85 * a).toFixed(3) + ")"); g.addColorStop(0.5, "rgba(20,8,4," + (0.5 * a).toFixed(3) + ")"); g.addColorStop(1, "rgba(20,8,4,0)");
    c.fillStyle = g; c.beginPath(); c.arc(s.x, s.y, r0 * 2.6, 0, TAU); c.fill();
    /* Spiralarme */
    c.globalCompositeOperation = "lighter"; c.lineCap = "round";
    for (let k = 0; k < 3; k++) {
      c.strokeStyle = k === 1 ? "rgba(255,150,80," + (0.45 * a) + ")" : "rgba(255,210,140," + (0.35 * a) + ")"; c.lineWidth = 1.4 - k * 0.3;
      c.beginPath();
      for (let i = 0; i <= 24; i++) { const q = i / 24, ang = s.t * 7 + k * TAU / 3 + q * 4.2, rr = (1 - q) * (34 - 14 * u) + 2; const px = s.x + Math.cos(ang) * rr, py = s.y + Math.sin(ang) * rr * 0.85; i ? c.lineTo(px, py) : c.moveTo(px, py); }
      c.stroke();
    }
    /* Funken, die als kurze Bögen hineingezogen werden */
    c.lineWidth = 1.1;
    for (const p of s.ps) {
      const k = clamp(p.r / 40, 0, 1); c.strokeStyle = "rgba(255,214,150," + (0.85 * a * (0.3 + 0.7 * (1 - k))).toFixed(3) + ")";
      c.save(); c.translate(s.x, s.y); c.scale(1, 0.85); c.beginPath(); c.arc(0, 0, Math.max(1, p.r), p.a - 0.5 - 0.3 * (1 - k), p.a); c.stroke(); c.restore();
    }
    c.restore();
  }

  /* ======================= BOSSAUFTRITT: NAMENSBAND ======================= */
  let plate = null;
  function buildPlate(W, H, e) {
    const s = Math.min(W, H) / 100, name = L(e.def.n), title = e.def.title ? L(e.def.title) : "";
    const tmp = mk(4, 4).getContext("2d");
    let fs = s * 7.4; tmp.font = fs + "px " + FD; fs = fitFont(tmp, name, "$px " + FD, fs, W * 0.6);
    const tw = tmp.measureText(name).width;
    /* W11 R27 (Grafik): gemaltes Boss-Porträt (figuren.js) als Wappen am linken Bandende; das Band wird dafür breiter */
    let por = null; try { por = Z.bossPortraetBild ? Z.bossPortraetBild(e.def) : null; } catch (_) { por = null; }
    const bh0 = title ? s * 14.5 : s * 10.5, md = por ? bh0 * 1.32 : 0;
    const tail = s * 11, pad = s * 3, bw = clamp(tw + s * 26 + md * 1.3, W * 0.34, Math.min(W * 0.86, W - 2 * (tail + pad))), bh = bh0; /* W24 Auflösung: hochkant/schmal ragte das Band samt Enden aus dem Bild */
    const cv = mk(bw + tail * 2 + pad * 2, bh + s * 10), c = cv.getContext("2d"), x0 = pad + tail, y0 = s * 3.5;
    /* Bandenden (hinten, gefaltet): ragen nach außen, gegabelt */
    for (const k of [-1, 1]) {
      const ex = k < 0 ? x0 + s * 2 : x0 + bw - s * 2, oy = y0 + s * 4.5, th = bh * 0.86;
      c.fillStyle = "#6a160e";
      c.beginPath(); c.moveTo(ex, oy); c.lineTo(ex + k * tail, oy); c.lineTo(ex + k * tail * 0.62, oy + th * 0.5); c.lineTo(ex + k * tail, oy + th); c.lineTo(ex, oy + th); c.closePath(); c.fill();
      c.fillStyle = "#3a0a06"; c.beginPath(); c.moveTo(ex, y0 + bh); c.lineTo(ex - k * s * 2, y0 + bh); c.lineTo(ex, oy + th); c.closePath(); c.fill();
      c.strokeStyle = rgba(GOLD, 0.8); c.lineWidth = s * 0.3; c.beginPath(); c.moveTo(ex + k * s, oy + s * 1.2); c.lineTo(ex + k * (tail - s * 1.5), oy + s * 1.2); c.moveTo(ex + k * s, oy + th - s * 1.2); c.lineTo(ex + k * (tail - s * 1.5), oy + th - s * 1.2); c.stroke();
    }
    /* Hauptband: Pergament mit leichter Wölbung */
    const g = c.createLinearGradient(0, y0, 0, y0 + bh); g.addColorStop(0, "#f4e6c4"); g.addColorStop(0.45, "#e7d2a2"); g.addColorStop(1, "#b88f56");
    c.fillStyle = g; c.beginPath(); c.moveTo(x0, y0); c.quadraticCurveTo(x0 + bw / 2, y0 - s * 2.2, x0 + bw, y0); c.lineTo(x0 + bw, y0 + bh); c.quadraticCurveTo(x0 + bw / 2, y0 + bh - s * 2.2, x0, y0 + bh); c.closePath(); c.fill();
    if (parch) { c.save(); c.clip(); c.globalAlpha = 0.35; c.globalCompositeOperation = "multiply"; c.drawImage(parch, 0, 0, parch.width * 0.3, parch.height * 0.3, x0, y0 - s * 3, bw, bh + s * 3); c.restore(); }
    c.strokeStyle = RED; c.lineWidth = s * 0.55;
    for (const off of [s * 1.3, bh - s * 1.3]) { c.beginPath(); c.moveTo(x0 + s * 2, y0 + off); c.quadraticCurveTo(x0 + bw / 2, y0 + off - s * 2.2, x0 + bw - s * 2, y0 + off); c.stroke(); }
    c.strokeStyle = INK2; c.lineWidth = s * 0.3; c.beginPath(); c.moveTo(x0, y0); c.quadraticCurveTo(x0 + bw / 2, y0 - s * 2.2, x0 + bw, y0); c.lineTo(x0 + bw, y0 + bh); c.quadraticCurveTo(x0 + bw / 2, y0 + bh - s * 2.2, x0, y0 + bh); c.closePath(); c.stroke();
    /* Schrift */
    c.textAlign = "center"; c.textBaseline = "alphabetic";
    const cx = x0 + bw / 2, ny = y0 + (title ? bh * 0.55 : bh * 0.68);
    c.font = fs.toFixed(1) + "px " + FD; c.fillStyle = INK; c.fillText(name, cx, ny);
    c.fillStyle = RED; c.font = (fs * 1.0).toFixed(1) + "px " + FD; c.fillText(name.charAt(0), cx - tw / 2 + c.measureText(name.charAt(0)).width / 2, ny);
    for (const k of [-1, 1]) { c.fillStyle = RED; diamond(c, cx + k * (tw / 2 + s * 4), ny - fs * 0.3, s * 1.4); c.fillStyle = GOLD; diamond(c, cx + k * (tw / 2 + s * 4), ny - fs * 0.3, s * 0.6); }
    if (title) { c.fillStyle = "#5a2a18"; fitFont(c, title, "italic $px " + FI, s * 3.6, bw * 0.8); c.fillText(title, cx, y0 + bh * 0.83); }
    if (por) {
      const mx = x0 + md * 0.42, my = y0 + bh / 2;
      /* Schlagschatten auf dem Band, dann das Medaillon */
      c.save(); c.fillStyle = "rgba(40,10,4,.45)"; c.beginPath(); c.ellipse(mx + s * 0.6, my + s * 1.1, md / 2, md / 2, 0, 0, TAU); c.fill(); c.restore();
      c.drawImage(por, mx - md / 2, my - md / 2, md, md);
    }
    return { cv, s, bh, y0 };
  }
  function drawPlate(c, W, H) {
    const p = plate; if (!p) return;
    const t = p.t, dur = p.dur, s = Math.min(W, H) / 100;
    c.save(); c.setTransform(1, 0, 0, 1, 0, 0);
    /* Kinobalken */
    const bar = easeIO(span(t, 0, 0.45)) * (1 - easeIO(span(t, dur - 0.55, dur))) * H * 0.085;
    if (bar > 0.5) { c.fillStyle = "#0a0605"; c.fillRect(0, 0, W, bar); c.fillRect(0, H - bar, W, bar); c.fillStyle = rgba(GOLD, 0.35); c.fillRect(0, bar - 1, W, 1); c.fillRect(0, H - bar, W, 1); }
    /* Band rollt sich auf */
    const open = easeOut(span(t, 0.15, 0.75)) * (1 - easeIn(span(t, dur - 0.6, dur - 0.1)));
    const pw = p.pl.cv.width, ph = p.pl.cv.height, px = W / 2 - pw / 2;
    /* W24 Auflösung: Band unter die Boss-Lebensleiste (HTML, wächst mit --hud) – auf kleinen Schirmen lag sie über dem Band */
    let py = H * 0.2; try { const bb = document.getElementById("bossbar"); if (bb && bb.offsetParent) { const r = bb.getBoundingClientRect(), k = W / (innerWidth || W); if (r.height > 0) py = Math.min(Math.max(py, (r.bottom + 4) * k), H * 0.32); } } catch (_) {}
    if (open > 0.01) {
      const vis = pw * open;
      c.save(); c.beginPath(); c.rect(W / 2 - vis / 2, 0, vis, H); c.clip(); c.drawImage(p.pl.cv, px, py); c.restore();
      if (open < 0.999) for (const k of [-1, 1]) {
        const rx = W / 2 + k * vis / 2, rw = s * 3, rh = p.pl.bh * 1.1, ry = py + p.pl.y0 - rh * 0.05;
        const g = c.createLinearGradient(rx - rw / 2, 0, rx + rw / 2, 0); g.addColorStop(0, "#8a6436"); g.addColorStop(0.45, "#f4e4c0"); g.addColorStop(1, "#7a5228");
        c.fillStyle = g; c.beginPath(); c.ellipse(rx, ry, rw / 2, rw * 0.3, 0, PI, 0); c.lineTo(rx + rw / 2, ry + rh); c.ellipse(rx, ry + rh, rw / 2, rw * 0.3, 0, 0, PI); c.closePath(); c.fill();
        c.strokeStyle = "rgba(60,30,10,.6)"; c.lineWidth = 1; c.stroke();
      }
      /* Einleitungssatz */
      const ia = span(t, 0.7, 1.1) * (1 - span(t, dur - 0.6, dur - 0.2));
      if (ia > 0 && p.intro) {
        c.font = "italic " + (s * 3.3).toFixed(1) + "px " + FI; const lines = wrap(c, p.intro, W * (W < H ? 0.86 : 0.62), W < H ? 4 : 2); /* W24 Auflösung: hochkant breiter/mehr Zeilen statt abgeschnitten */
        const ly = py + ph + s * 2.5;
        const gb = c.createLinearGradient(0, ly - s * 3, 0, ly + lines.length * s * 4.4 + s * 2); gb.addColorStop(0, "rgba(10,5,3,0)"); gb.addColorStop(0.3, "rgba(10,5,3,.55)"); gb.addColorStop(1, "rgba(10,5,3,0)");
        c.globalAlpha = ia; c.fillStyle = gb; c.fillRect(W * 0.12, ly - s * 3, W * 0.76, lines.length * s * 4.4 + s * 5);
        c.fillStyle = "#f2e2c2"; c.textAlign = "center"; c.textBaseline = "alphabetic"; c.shadowColor = "rgba(0,0,0,.9)"; c.shadowBlur = s;
        lines.forEach((ln, i) => c.fillText(ln, W / 2, ly + s * 1.6 + i * s * 4.4)); c.shadowBlur = 0; c.globalAlpha = 1;
      }
    }
    c.restore();
  }

  /* ======================= HÖHEPUNKT: LETZTER TREFFER ======================= */
  let climax = null;
  function startClimax(b) {
    const cx = b.x + b.w / 2, cy = b.y + b.h / 2, col = nb(b.def.t || "#ffd27a"), ground = b.y + b.h;
    const rays = []; for (let i = 0; i < 7; i++) rays.push({ dx: (i - 3) * 22 + (Math.random() - 0.5) * 14, w: 8 + Math.random() * 14, ph: Math.random() * TAU, tilt: (Math.random() - 0.5) * 0.25 });
    climax = { t: 0, x: cx, y: cy, gy: ground, col, rays, muted: false, released: false, warden: !!b.warden, lv: Z.level, firstWin: !!(Z.meta.bosses[b.id] && Z.meta.bosses[b.id].won === 1) };
    inp.rumble && inp.rumble(0.9, 450);
  }
  function climaxStep(dt) {
    const k = climax; if (!k) return;
    if (k.lv !== Z.level) { climax = null; if (k.muted && !k.released) A.muffle(20000); return; }
    k.t += dt;
    const P = Z.player;
    if (!k.muted && k.t > 0.1) { k.muted = true; if (!(P && P.dead)) A.muffle(340); }
    if (!k.released && k.t > 0.95) {
      k.released = true;
      if (!(P && P.dead) && !ui.modalOpen) A.muffle(20000);
      A.play("holy", { vol: 0.55 }); A.play("bell", { vol: 0.3, delay: 0.15 });
      if (k.firstWin) setTimeout(() => goldAtEl(document.getElementById("banner"), 1.4), 900);
    }
    if (k.t > 0.95 && k.t < 3.4 && qLevel() >= 1) {
      const n = qLevel() >= 2 ? 3 : 1;
      for (let i = 0; i < n; i++) if (Math.random() < 0.7) FX.p({ x: k.x + (Math.random() - 0.5) * 160, y: k.gy - Math.random() * 6, vx: (Math.random() - 0.5) * 16, vy: -30 - Math.random() * 50, life: 1.4 + Math.random(), size: 1.2 + Math.random() * 1.6, col: Math.random() < 0.5 ? "#ffd27a" : "#fff0c0", kind: "glow", add: true, drag: 0.99, keep: true });
    }
    if (k.t > 5) climax = null;
  }
  function drawClimaxWorld(c, cam) {
    const k = climax; if (!k) return;
    const t = k.t;
    c.save(); c.globalCompositeOperation = "lighter";
    /* Aufprall-Lichtkugel in Bossfarbe */
    if (t < 0.5) {
      const u = t / 0.5, r = 20 + 90 * easeOut(u);
      const g = c.createRadialGradient(k.x, k.y, 0, k.x, k.y, r); g.addColorStop(0, rgba("#fff6e0", 0.9 * (1 - u))); g.addColorStop(0.3, rgba(k.col, 0.6 * (1 - u))); g.addColorStop(1, rgba(k.col, 0));
      c.fillStyle = g; c.beginPath(); c.arc(k.x, k.y, r, 0, TAU); c.fill();
    }
    /* Schockwellen */
    for (const [d, R, w] of [[0, 260, 6], [0.09, 190, 4], [0.2, 130, 3]]) {
      const u = (t - d) / 0.7; if (u <= 0 || u >= 1) continue;
      const r = 8 + R * easeOut(u);
      c.globalAlpha = (1 - u) * 0.9; c.strokeStyle = d === 0 ? "#fff0d0" : k.col; c.lineWidth = w * (1 - u) + 0.6;
      c.beginPath(); c.arc(k.x, k.y, r, 0, TAU); c.stroke();
      c.globalAlpha = (1 - u) * 0.5; c.lineWidth = (w * (1 - u) + 0.6) * 0.5; c.beginPath(); c.ellipse(k.x, k.gy, r * 1.2, r * 0.18, 0, 0, TAU); c.stroke();
    }
    c.globalAlpha = 1;
    /* Erleichterung: Lichtstrahlen von oben – ein Fächer aus einer gemeinsamen Quelle, weich in drei Lagen */
    const ra = easeOut(span(t, 0.9, 1.7)) * (1 - easeIO(span(t, 3.4, 5)));
    if (ra > 0) {
      const sx = k.x + 50, sy = cam.y - 140, gy = k.gy + 3;
      for (const r of k.rays) {
        const sway = Math.sin(t * 0.7 + r.ph) * 5, bx = k.x + r.dx * 1.4 + sway, fl = 0.75 + 0.25 * Math.sin(t * 1.9 + r.ph * 2);
        for (const [wk, al] of [[1, 0.045], [0.55, 0.06], [0.22, 0.08]]) {
          const w = r.w * wk * 1.2, a = al * ra * fl;
          const g = c.createLinearGradient(0, sy, 0, gy); g.addColorStop(0, "rgba(255,230,170,0)"); g.addColorStop(0.45, rgba("#ffe0a0", a * 0.6)); g.addColorStop(1, rgba("#fff2c8", a));
          c.fillStyle = g; c.beginPath(); c.moveTo(sx - w * 0.08, sy); c.lineTo(sx + w * 0.08, sy); c.lineTo(bx + w, gy); c.lineTo(bx - w, gy); c.closePath(); c.fill();
        }
      }
      const gg = c.createRadialGradient(k.x, k.gy, 0, k.x, k.gy, 90); gg.addColorStop(0, rgba("#ffe0a0", 0.16 * ra)); gg.addColorStop(1, "rgba(255,224,160,0)");
      c.save(); c.translate(k.x, k.gy); c.scale(1, 0.22); c.translate(-k.x, -k.gy); c.fillStyle = gg; c.beginPath(); c.arc(k.x, k.gy, 90, 0, TAU); c.fill(); c.restore();
    }
    c.restore();
  }
  function drawClimaxScreen(c, W, H) {
    const k = climax, fk = Z.flashK ? Z.flashK() : 1; if (!k || k.t > 0.4 || fk <= 0) return;
    const u = k.t / 0.4, S = Z.gfx.scale || 1, cam = Z.cam;
    const sx = (k.x - cam.x) * S, sy = (k.y - cam.y) * S;
    c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.globalCompositeOperation = "lighter";
    const g = c.createRadialGradient(sx, sy, 0, sx, sy, Math.max(W, H) * (0.3 + 0.7 * u)); g.addColorStop(0, rgba(k.col, 0.55 * (1 - u) * fk)); g.addColorStop(1, rgba(k.col, 0));
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    c.restore();
  }

  /* ======================= LEGENDÄRE FUNDE ======================= */
  let clock = 0;
  function drawLegend(c, cam) {
    const lo = low();
    for (const p of Z.pickups) {
      if (p.kind !== "item" || !p.it || p.it.rar < 3 || p.it.cursed) continue;
      if (p.x < cam.x - 60 || p.x > cam.x + cam.w + 60 || p.y < cam.y - 40 || p.y > cam.y + cam.h + 200) continue;
      if (!p._ueAnn && p.x > cam.x + 10 && p.x < cam.x + cam.w - 10 && p.y > cam.y + 10 && p.y < cam.y + cam.h) {
        p._ueAnn = clock || 0.001;
        if (!lo) { A.play("holy", { vol: 0.45 }); A.play("bell", { vol: 0.25, delay: 0.1, rate: 1.2 }); FX.addShake(2); FX.burst(p.x, p.y - 8, 22, { col: ["#ffd27a", "#fff0c0", "#ff8d2e"], sp: 110, up: 40, life: 0.8, size: 1.8, kind: "spark", add: true }); }
      }
      const ann = p._ueAnn ? clock - p._ueAnn : 9, slam = ann < 0.7 ? 1 - ann / 0.7 : 0;
      const top = cam.y - 20, gy = p.y + 1, pulse = Math.sin(clock * 2.6 + p.x) * 0.5 + 0.5;
      c.save(); c.globalCompositeOperation = "lighter";
      const w = (lo ? 7 : 9 + 3 * pulse) + 26 * easeIn(slam);
      const g = c.createLinearGradient(0, top, 0, gy); g.addColorStop(0, "rgba(255,200,120,0)"); g.addColorStop(0.55, rgba("#ffcf80", 0.12 + 0.25 * slam)); g.addColorStop(1, rgba("#fff0c0", 0.28 + 0.5 * slam));
      c.fillStyle = g; c.beginPath(); c.moveTo(p.x - w * 0.35, top); c.lineTo(p.x + w * 0.35, top); c.lineTo(p.x + w / 2, gy); c.lineTo(p.x - w / 2, gy); c.closePath(); c.fill();
      if (!lo) {
        c.fillStyle = rgba("#fff8e0", 0.18 + 0.3 * slam); c.fillRect(p.x - 1, top, 2, gy - top);
        /* Lichtkranz am Boden */
        const rr = 13 + 2 * pulse + 30 * easeOut(1 - slam) * (slam > 0 ? 1 : 0);
        c.strokeStyle = rgba("#ffd27a", 0.55); c.lineWidth = 1.2; c.beginPath(); c.ellipse(p.x, gy, rr, rr * 0.28, 0, 0, TAU); c.stroke();
        c.fillStyle = rgba("#ffd890", 0.4);
        for (let i = 0; i < 12; i++) { const a = clock * 0.7 + i / 12 * TAU, x1 = p.x + Math.cos(a) * rr, y1 = gy + Math.sin(a) * rr * 0.28, x2 = p.x + Math.cos(a) * (rr + 6 + 2 * Math.sin(clock * 3 + i)), y2 = gy + Math.sin(a) * (rr + 6) * 0.28 - (i % 2 ? 3 : 1.5); c.beginPath(); c.moveTo(x1 - 0.8, y1); c.lineTo(x2, y2); c.lineTo(x1 + 0.8, y1); c.closePath(); c.fill(); }
        if (Math.random() < 0.25) FX.p({ x: p.x + (Math.random() - 0.5) * 14, y: gy - Math.random() * 6, vx: 0, vy: -20 - Math.random() * 20, life: 1.1, size: 1.3, col: "#ffe0a0", kind: "glow", add: true });
      }
      c.restore();
    }
  }

  /* ======================= GOLDENE FUNKEN (Bildschirm) ======================= */
  let gold = [], goldEm = [];
  function goldBurst(x, y, n, sp) { for (let i = 0; i < n; i++) { const a = Math.random() * TAU, v = (sp || 1) * (60 + Math.random() * 260); gold.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 80, life: 0.9 + Math.random() * 1.1, max: 2, sz: 1.5 + Math.random() * 3.5, star: Math.random() < 0.35, rot: Math.random() * TAU, col: ["#ffd27a", "#fff0b0", "#e8a530", "#ffe6a0"][i % 4] }); } }
  function goldAtEl(el, dur) {
    if (!on()) return;
    const cv = document.getElementById("cv"); if (!cv || !cv.clientWidth) return;
    const k = cv.width / cv.clientWidth;
    let r = el && !el.hidden ? el.getBoundingClientRect() : null;
    if (!r || r.width < 2) r = { left: cv.clientWidth * 0.35, top: cv.clientHeight * 0.12, width: cv.clientWidth * 0.3, height: 30 };
    const x = (r.left + r.width / 2) * k, y = (r.top + r.height / 2) * k;
    goldBurst(x, y, low() ? 18 : 60, k);
    if (!low()) goldEm.push({ x: r.left * k, y: r.top * k, w: r.width * k, h: r.height * k, t: 0, dur: dur || 1.1, k });
  }
  function goldStep(dt) {
    for (const e of goldEm) { e.t += dt; const n = Math.random() < 0.5 ? 2 : 1; for (let i = 0; i < n; i++) gold.push({ x: e.x + Math.random() * e.w, y: e.y + Math.random() * e.h, vx: (Math.random() - 0.5) * 40 * e.k, vy: (-30 - Math.random() * 60) * e.k, life: 0.8 + Math.random() * 0.8, max: 1.6, sz: 1 + Math.random() * 2.5, star: Math.random() < 0.3, rot: 0, col: Math.random() < 0.5 ? "#ffd27a" : "#fff0b0" }); }
    goldEm = goldEm.filter(e => e.t < e.dur);
    for (const p of gold) { p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 1 - 1.8 * dt; p.vy = p.vy * (1 - 1.8 * dt) + 40 * dt; p.rot += dt * 3; }
    gold = gold.filter(p => p.life > 0);
    if (gold.length > 500) gold.splice(0, gold.length - 500);
  }
  function drawGold(c) {
    if (!gold.length) return;
    c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.globalCompositeOperation = "lighter";
    for (const p of gold) {
      const a = clamp(p.life / 0.6, 0, 1) * (0.7 + 0.3 * Math.sin(p.life * 30 + p.rot)); c.globalAlpha = a; c.fillStyle = p.col;
      if (p.star) { const r = p.sz * 2.2; c.save(); c.translate(p.x, p.y); c.rotate(p.rot); c.beginPath(); c.moveTo(0, -r); c.lineTo(r * 0.2, 0); c.lineTo(0, r); c.lineTo(-r * 0.2, 0); c.closePath(); c.moveTo(-r, 0); c.lineTo(0, r * 0.2); c.lineTo(r, 0); c.lineTo(0, -r * 0.2); c.closePath(); c.fill(); c.restore(); }
      else { c.beginPath(); c.arc(p.x, p.y, p.sz * 0.6, 0, TAU); c.fill(); }
    }
    c.restore();
  }

  /* ======================= TINTENRAND BEIM FALLEN ======================= */
  let inkSpr = null, inkT = 0;
  function inkSprite() {
    if (inkSpr) return inkSpr;
    const w = 320, h = 180, cv = mk(w, h), c = cv.getContext("2d"), R = Z.Rng(4242);
    c.fillStyle = "rgb(22,10,5)"; c.fillRect(0, 0, w, h);
    c.globalCompositeOperation = "destination-out";
    const g = c.createRadialGradient(w / 2, h / 2, h * 0.18, w / 2, h / 2, w * 0.5); g.addColorStop(0, "rgba(0,0,0,1)"); g.addColorStop(0.7, "rgba(0,0,0,.85)"); g.addColorStop(1, "rgba(0,0,0,0)");
    c.fillStyle = g; c.fillRect(0, 0, w, h);
    for (let i = 0; i < 46; i++) { const a = R() * TAU, d = 0.34 + R() * 0.12, x = w / 2 + Math.cos(a) * w * d, y = h / 2 + Math.sin(a) * h * d * 1.05, r = 8 + R() * 22; const gg = c.createRadialGradient(x, y, 0, x, y, r); gg.addColorStop(0, "rgba(0,0,0,.9)"); gg.addColorStop(1, "rgba(0,0,0,0)"); c.fillStyle = gg; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); }
    c.globalCompositeOperation = "source-over";
    for (let i = 0; i < 30; i++) { const a = R() * TAU, x = w / 2 + Math.cos(a) * w * (0.47 + R() * 0.06), y = h / 2 + Math.sin(a) * h * (0.47 + R() * 0.06); c.fillStyle = "rgba(22,10,5," + (0.4 + R() * 0.5).toFixed(2) + ")"; c.beginPath(); c.arc(x, y, 1 + R() * 4, 0, TAU); c.fill(); }
    inkSpr = cv; return cv;
  }
  function drawInk(c, W, H, dt) {
    const P = Z.player;
    if (!P || !P.dead || !rich()) { inkT = 0; return; }
    inkT += dt; const a = easeOut(Math.min(1, inkT / 1.5));
    c.save(); c.setTransform(1, 0, 0, 1, 0, 0);
    if (qLevel() >= 2) { c.globalCompositeOperation = "saturation"; c.fillStyle = "rgba(128,128,128," + (0.7 * a).toFixed(3) + ")"; c.fillRect(0, 0, W, H); }
    c.globalCompositeOperation = "multiply"; c.fillStyle = "rgba(214,176,124," + (0.55 * a).toFixed(3) + ")"; c.fillRect(0, 0, W, H);
    c.globalCompositeOperation = "source-over"; c.globalAlpha = 0.92 * a; c.drawImage(inkSprite(), -W * 0.02, -H * 0.02, W * 1.04, H * 1.04);
    c.restore();
  }

  /* ======================= KINOBALKEN + SCHILD BEIM SCHWENK ======================= */
  function drawPanScreen(c, W, H) {
    if (!pan) return;
    const e = panE(pan), s = Math.min(W, H) / 100, bar = H * 0.075 * Math.min(1, pan.t / 0.35, e * 3 + (pan.t < pan.go ? 1 : 0));
    c.save(); c.setTransform(1, 0, 0, 1, 0, 0);
    c.fillStyle = "#0a0605"; c.fillRect(0, 0, W, bar); c.fillRect(0, H - bar, W, bar);
    if (bar > s * 3) {
      c.fillStyle = rgba(GOLD, 0.35); c.fillRect(0, bar - 1, W, 1); c.fillRect(0, H - bar, W, 1);
      c.textBaseline = "middle"; c.font = (s * 2.6).toFixed(1) + "px " + FD; c.fillStyle = rgba(GOLD2, 0.85); c.textAlign = "left";
      c.fillText(pan.arena ? L(["Die Arena", "The arena"]) : Z.level && Z.level.warden ? L(["Der Weg hinaus – ein Wächter hält ihn", "The way out – a warden holds it"]) : L(["Der Weg hinaus", "The way out"]), s * 4, H - bar / 2);
      const dev = inp.device === "pad" ? L(["Knopf: überspringen", "Button: skip"]) : inp.device === "touch" ? L(["Tippen: überspringen", "Tap: skip"]) : L(["Taste: überspringen", "Any key: skip"]);
      c.textAlign = "right"; c.font = "italic " + (s * 2.4).toFixed(1) + "px " + FI; c.fillStyle = "rgba(232,216,196,.7)"; c.fillText(dev + " ▸", W - s * 4, H - bar / 2);
    }
    c.restore();
  }
  function drawPanWorld(c) {
    if (!pan || !pan.door) return;
    const d = pan.door, e = panE(pan), a = span(e, 0.75, 1);
    if (a <= 0) return;
    const x = d.x * T + 8, y = d.y * T - 66 + Math.sin(clock * 3) * 1.5;
    const label = d.locked ? L(["Verriegelt – erst der Wächter", "Locked – the warden first"]) : L(["Weiter nach: ", "Onward to: "]) + Z.areaName(d.to);
    c.save(); c.globalAlpha = a; c.font = "7px " + FD; const tw = c.measureText(label).width + 10;
    c.fillStyle = "#e8d4a8"; c.strokeStyle = INK2; c.lineWidth = 0.6;
    c.beginPath(); c.moveTo(x - tw / 2, y - 14); c.lineTo(x + tw / 2, y - 14); c.lineTo(x + tw / 2 + 3, y - 9.5); c.lineTo(x + tw / 2, y - 5); c.lineTo(x + 3, y - 5); c.lineTo(x, y - 1); c.lineTo(x - 3, y - 5); c.lineTo(x - tw / 2, y - 5); c.lineTo(x - tw / 2 - 3, y - 9.5); c.closePath(); c.fill(); c.stroke();
    c.fillStyle = d.locked ? RED : INK; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText(label, x, y - 9.3);
    c.restore();
  }

  /* ======================= ZOOM (Nachbearbeitung) ======================= */
  let zb = null, zCur = 1, zFx = 0, zFy = 0;
  function zoomTarget() {
    let z = 1, fx = 0, fy = 0;
    const put = (v, x, y) => { if (v > z) { z = v; fx = x; fy = y; } };
    if (climax) { const t = climax.t; put(1 + 0.3 * easeOut(span(t, 0, 0.22)) * (1 - easeIO(span(t, 0.85, 1.7))), climax.x, climax.y); }
    if (suck) put(1 + 0.2 * easeIn(clamp(suck.t / suck.dur, 0, 1)), suck.x, suck.y);
    if (plate && plate.e && !plate.e.dead) { const t = plate.t; put(1 + 0.09 * easeOut(span(t, 0, 0.9)) * (1 - easeIO(span(t, 1.3, 2.1))), plate.e.x + plate.e.w / 2, plate.e.y + plate.e.h * 0.4); }
    w30Zoom(put); /* W30 Grafik: Boss-Auftritt/Phasenwechsel (Koop: alle Spieler bleiben im Bild) */
    return [z, fx, fy];
  }
  function applyZoom(c, W, H, dt) {
    if (!rich()) { zCur = 1; return; }
    const [z, wx, wy] = zoomTarget();
    if (z > 1.001) { const S = Z.gfx.scale || 1; zFx = (wx - Z.cam.x + FX.shakeX) * S; zFy = (wy - Z.cam.y + FX.shakeY) * S; }
    zCur += (z - zCur) * (1 - Math.pow(0.0005, dt));
    if (zCur < 1.002) { zCur = 1; return; }
    if (!zb || zb.width !== W || zb.height !== H) zb = mk(W, H);
    const zc = zb.getContext("2d"); zc.setTransform(1, 0, 0, 1, 0, 0); zc.drawImage(c.canvas, 0, 0);
    const fx = clamp(zFx, 0, W), fy = clamp(zFy, 0, H), sw = W / zCur, sh = H / zCur;
    c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.imageSmoothingEnabled = true;
    c.drawImage(zb, fx * (1 - 1 / zCur), fy * (1 - 1 / zCur), sw, sh, 0, 0, W, H);
    c.restore();
  }

  /* ======================= KAMERA: Schwenk + Atmen ======================= */
  const cam = Z.cam, cu0 = cam.update;
  let breath = { ox: 0, oy: 0, calm: 0, idle: 0, t: 0 };
  cam.update = function (dt, p) {
    cam.x -= breath.ox; cam.y -= breath.oy; breath.ox = breath.oy = 0;
    if (pan) {
      if (pan.lv !== Z.level || ui.modalOpen) { if (pan.lv !== Z.level) pan = null; else return; }
      else {
        pan.t += dt * tScale;
        if (pan.t >= pan.go + pan.hold + pan.back) pan = null;
        else { const e = panE(pan); cam.x = lerp(pan.hx, pan.tx, e) - cam.w / 2; cam.y = lerp(pan.hy, pan.ty, e) - cam.h / 2; cam.clamp(); return; }
      }
    }
    const r = cu0.apply(this, arguments);
    /* Atmen: nur wenn alles ruhig ist (kein Boss, keine wachen Gegner in der Nähe, Ezekiel steht) */
    const P = p;
    if (!rich() || !P || (Z.settings && Z.settings.shake === 0)) { breath.calm = 0; return r; }
    let still = !P.dead && !Z.boss && P.onGround && Math.abs(P.vx) < 8 && !P.act && !book;
    if (still) for (const e of Z.enemies) if (!e.dead && e.aware && !e.dummy && Math.abs(e.x - P.x) < 280 && Math.abs(e.y - P.y) < 200) { still = false; break; }
    breath.idle = still ? breath.idle + dt : 0;
    const want = breath.idle > 1.8 ? 1 : 0;
    breath.calm += (want - breath.calm) * Math.min(1, dt * (want ? 0.6 : 4));
    breath.t += dt;
    if (breath.calm > 0.01) {
      const bx = breath.calm * (Math.sin(breath.t * 0.41) * 1.7 + Math.sin(breath.t * 0.17 + 2) * 1.1), by = breath.calm * (Math.sin(breath.t * 0.29 + 1) * 1.4);
      const x0 = cam.x, y0 = cam.y; cam.x += bx; cam.y += by; cam.clamp(); breath.ox = cam.x - x0; breath.oy = cam.y - y0;
    }
    return r;
  };

  /* ======================= EINGABE: blockieren nur während überspringbarer Übergänge ======================= */
  /* Gebietsseiten blockieren nicht mehr: das Spiel läuft darunter weiter, jede Aktion blättert schneller um.
     Nur die Schlussseite (Tod/Rückkehr), die Kamerafahrt und der Sog in die Tür halten die Eingabe kurz an. */
  const blocking = () => !!((book && book.closing) || pan || (suck && !suck.done) || (suck && suck.done && suck.t < suck.doneT + 0.6) || w30Block()); /* W30 Grafik: Boss-Auftritt hält die Welt an */
  addEventListener("keydown", e => { if (!e.repeat && blocking() && !ui.modalOpen && !inp.capture) skipReq = true; }, true);
  addEventListener("pointerdown", e => { if (blocking() && !ui.modalOpen && e.target && (e.target.id === "cv" || (e.target.closest && e.target.closest("#touch")))) skipReq = true; }, true);
  const frame0 = ui.frame;
  ui.frame = function (dt) {
    if (Z.level && blocking() && !ui.modalOpen) {
      let any = skipReq; skipReq = false;
      for (const k in inp.pressed) if (inp.pressed[k] && k !== "left" && k !== "right" && k !== "up" && k !== "down") any = true;
      const pad = inp.lastPad;
      if (pad && pad.buttons) { const now = pad.buttons.map(b => !!b && (b.pressed || b.value > 0.45)); if (now.some((v, i) => v && !padPrev[i])) any = true; padPrev = now; }
      if (any) skipAll();
      for (const k in inp.pressed) inp.pressed[k] = false;
      for (const k in inp.released) inp.released[k] = false;
      FX.hitstop = Math.max(FX.hitstop || 0, 0.05);
      Z.interactTarget = null;
      if (promptEl) promptEl.hidden = true;
    } else {
      skipReq = false; const pad = inp.lastPad; if (pad && pad.buttons) padPrev = pad.buttons.map(b => !!b && (b.pressed || b.value > 0.45));
      /* offene Gebietsseite: eine Aktion blättert sofort um, die Taste wirkt trotzdem im Spiel */
      if (book && !book.closing && !ui.modalOpen && book.age > 0.15) { for (const k of ["jump", "roll", "a1", "a2", "s1", "s2", "use"]) if (inp.pressed[k]) { skipAll(); break; } }
    }
    return frame0.apply(this, arguments);
  };

  /* ======================= EINHÄNGEN: Bild ======================= */
  let lastT = 0, tScale = 1;
  const al0 = Z.drawAfterLight;
  Z.drawAfterLight = function (c, camR, W, H, t) {
    if (al0) al0.apply(this, arguments);
    if (!on()) return;
    try { drawLegend(c, camR); } catch (e) { console.error(e); }
    if (low()) return;
    try { drawClimaxWorld(c, camR); drawSuck(c); drawPanWorld(c); } catch (e) { console.error(e); }
  };
  const r0 = Z.gfx.render;
  /* liegt die Seite vollständig über dem Bild, braucht die Welt darunter nicht gemalt zu werden */
  function covered() {
    const b = book; if (!b || b.mode !== "hold" || b.fast) return false;
    const pg = b.pages[b.i]; if (!pg || (b.appear && b.t < 0.22)) return false;
    return b.t < pg.hold - 0.5 || (b.closing && b.onClosed);
  }
  Z.gfx.render = function (c, W, H) {
    const res = covered() ? undefined : r0.apply(this, arguments);
    const n = performance.now(), raw = Math.min(0.05, Math.max(0, (n - (lastT || n)) / 1000)) * tScale; lastT = n;
    const adv = ui.modalOpen || document.hidden ? 0 : raw;
    clock += raw;
    try {
      bookStep(adv); suckStep(adv); climaxStep(raw); goldStep(raw);
      w30Tick(raw); /* W30 Grafik */
      hudHide(!!(book || pan));
      if (plate) { plate.t += raw; if (plate.t >= plate.dur || plate.lv !== Z.level) plate = null; }
      applyZoom(c, W, H, raw);
      drawClimaxScreen(c, W, H);
      drawInk(c, W, H, raw);
      if (!baOff()) w30DrawScreen(c, W, H); /* W30 Grafik: Abdunkeln/Farbstimmung unter dem Namensband */
      drawPlate(c, W, H);
      drawPanScreen(c, W, H);
      drawGold(c);
      if (book) { const o = overlay(); ovc.setTransform(1, 0, 0, 1, 0, 0); ovc.clearRect(0, 0, o.width, o.height); drawBook(ovc, o.width, o.height); overlayShow(true); }
      else overlayShow(false);
    } catch (e) { console.error("uebergang", e); book = null; pan = null; suck = null; hudHide(false); overlayShow(false); }
    return res;
  };

  /* ======================= EINHÄNGEN: Ablauf ======================= */
  const banner0 = ui.banner;
  ui.banner = function () { if (muteBanner) return; return banner0.apply(this, arguments); };
  const oa0 = ui.onArea;
  ui.onArea = function (id, B, lv) {
    pan = null; climax = null; plate = null; zCur = 1; breath.ox = breath.oy = 0; breath.idle = 0; breath.calm = 0;
    if (suck && suck.done) suck = null;
    Z.interactTarget = null;
    let info = null;
    if (on() && !quick()) {
      try {
        info = pageInfo(id, B, lv); info.id = id; info.B = B; info.lv = lv; info.low = low();
        if (!info.low) info.page = grabPage();
        if (Z.run) { if (visitSeen.seed !== Z.run.seed) { visitSeen.seed = Z.run.seed; visitSeen.set = new Set(); } info.first = !visitSeen.set.has(id) && (info.kind === "area" || info.kind === "arena"); visitSeen.set.add(id); }
        if (!info.first && info.kind === "area") info.hold = 0.45;
        if (info.low) info.hold = Math.min(info.hold, 0.6);
      } catch (e) { console.error(e); info = null; }
    }
    muteBanner = !!info;
    try { return oa0.apply(this, arguments); }
    finally {
      muteBanner = false;
      if (info) {
        try {
          const pg = newPage(info);
          if (book && book.closing && !book.onClosed) { book.pages.push(pg); book.low = false; }
          else startBook(pg, { pan: !!info.first && rich() && !!(Z.settings && Z.settings.cinePan) });
        } catch (e) { console.error(e); endBook(); }
      }
    }
  };
  /* Lagerrückkehr: Seite legt sich über das Bild, dann wird zur Lagerseite umgeblättert */
  const back0 = Z.backToCamp;
  Z.backToCamp = function () {
    if (book && book.closing) return;
    if (!rich() || !Z.level || quick()) return back0.apply(this, arguments);
    try {
      const P = Z.player, run = Z.run, lv = Z.level, AR = lv.arena && Z.ARENAS[lv.arena];
      const kind = P && P.dead ? "fall" : AR && AR.final && Z.bossDefeated ? "win" : "abort";
      const where = lv.hub ? L(Z.biome.name) : lv.passage ? L(["einem Durchgang", "a passage"]) : Z.areaName(lv.id);
      const info = {
        id: lv.id + "-ende", B: Z.biome, lv, page: grabPage(), pose: kind === "fall" ? "sword" : kind === "win" ? "raise" : "walk",
        wash: kind === "fall" ? "rgba(90,14,8,.28)" : kind === "win" ? "rgba(255,200,120,.12)" : "rgba(40,24,12,.2)",
        chapter: L(["Hier endet das Kapitel", "Here the chapter ends"]),
        title: L(kind === "fall" ? ["Gefallen", "Fallen"] : kind === "win" ? ["Ein Faden reißt", "A Thread Snaps"] : ["Umgekehrt", "Turned Back"]),
        sub: kind === "win" && Z.TX && Z.TX.endings && Z.TX.endings[AR.final] ? L(Z.TX.endings[AR.final][0]) : L(["in ", "in "]) + where,
        lines: [
          (Z.stats ? Z.stats.kills || 0 : 0) + L([" erschlagen", " slain"]) + " · " + fmtTime(run ? run.time : 0) + " · " + (run ? run.shardsBank : 0) + L([" Splitter gesichert", " shards kept"]),
          L(kind === "fall" ? ["„Die Ballade ist noch nicht zu Ende.“ – Barradin", "'The ballad isn't over yet.' – Barradin"] : kind === "win" ? ["„Das schreibe ich in goldenen Lettern.“ – Barradin", "'I'll write this in golden letters.' – Barradin"] : ["„Ein kluger Rückzug ist auch ein Kapitel.“ – Barradin", "'A wise retreat is a chapter too.' – Barradin"])
        ],
        quote: true, hold: 1.5, pageNo: run ? run.route.length * 2 + 2 : 0
      };
      const pg = newPage(info);
      A.play("scroll", { vol: 0.5 });
      startBook(pg, { closing: true, onClosed: () => { const f = ui.fade; ui.fade = fn => fn(); try { back0.call(Z); } finally { ui.fade = f; } A.play("scroll", { vol: 0.45, delay: 0.1 }); } });
    } catch (e) { console.error(e); endBook(); return back0.apply(this, arguments); }
  };
  /* Bossauftritt */
  const bi0 = ui.bossIntro;
  ui.bossIntro = function (e) {
    const fancy = rich() && e && e.def;
    muteBanner = !!fancy;
    try { return bi0.apply(this, arguments); }
    finally {
      muteBanner = false;
      if (fancy) {
        try { const cvm = document.getElementById("cv"), W = cvm.width, H = cvm.height; plate = { t: 0, dur: 4.2, pl: buildPlate(W, H, e), e, intro: e.def.intro ? L(e.def.intro) : "", lv: Z.level }; A.play("horn", { vol: 0.35, delay: 0.25 }); }
        catch (err) { console.error(err); plate = null; banner0.call(ui, L(e.def.n), e.def.intro ? L(e.def.intro) : L(e.def.title || ["", ""]), 4200); }
      }
    }
  };
  /* Letzter Treffer gegen Boss oder Wächter */
  const bd0 = ui.bossDown;
  ui.bossDown = function (b) {
    const r = bd0.apply(this, arguments);
    if (rich() && b) try { plate = null; startClimax(b); } catch (e) { console.error(e); }
    return r;
  };
  /* Erfolge und Rekorde: goldene Funken */
  const toast0 = Z.toast;
  const toastW = function (msg) {
    const r = toast0.apply(this, arguments);
    try { if (on() && /🏆|Rekord|record/i.test(String(msg))) { const el = r || ui.lastNote; setTimeout(() => goldAtEl(el, 1.3), 60); } } catch (_) {}
    return r;
  };
  Z.toast = ui.toast = toastW;
  const death0 = Z.onPlayerDeath;
  Z.onPlayerDeath = function () {
    const P = Z.player, was = P && P.dead, old = (Z.meta.best && Z.meta.best.kills) || 0;
    const r = death0.apply(this, arguments);
    if (!was && on()) {
      inkT = 0; plate = null; pan = null;
      const k = (Z.stats && Z.stats.kills) || 0;
      if (old > 0 && k > old && !(Z.run && Z.run.gnade)) setTimeout(() => Z.toast("✦ " + L(["Neuer Rekord: ", "New record: "]) + k + L([" erschlagen", " slain"]) + " ✦", 3000), 650);
    }
    return r;
  };
  const end0 = ui.ending;
  ui.ending = function () {
    const old = (Z.meta.best && Z.meta.best.time) || 0;
    const r = end0.apply(this, arguments);
    try { const nt = Z.meta.best.time; if (on() && old > 0 && nt < old) setTimeout(() => Z.toast("✦ " + L(["Neuer Rekord: schnellster Sieg ", "New record: fastest win "]) + fmtTime(nt) + " ✦", 3400), 400); } catch (_) {}
    return r;
  };

  /* Pergament schon im Leerlauf vorbereiten (Titelbild), damit der erste Übergang nicht stockt */
  const idle = window.requestIdleCallback || (fn => setTimeout(fn, 200));
  setTimeout(() => idle(() => { try { if (rich()) { const [W, H] = canvasSize(); if (W > 1 && H > 1) parchment(W, H); } } catch (_) {} }), 1200);

  /* ======================= W30 Grafik: BOSS-AUFTRITTE INSZENIEREN =======================
     Auftritt (2–4 s, überspringbar): Kamerafahrt + Zoom auf den Boss, die Arena dunkelt in Bossfarbe ab, der Boss tritt mit
     eigener Geste auf (stürzt aus dem Dunkel, taucht aus dem See, Lichtsäule …), beim Aufprall Lichtwechsel, Beben und das
     Namensband (plate) rollt sich genau dann auf; Musik wird bis dahin gedämpft (Z.music.duck), danach setzt der Bosssatz ein.
     Während der Szene steht die Spielwelt (wie bei der Kamerafahrt: blocking → Trefferstopp), darum kostet sie keine Spielzeit
     (auch nicht die Bossrausch-Zeitwertung; dort läuft ohnehin nur die kurze Fassung).
     Phasenwechsel (bossphasen.js e.trans): Zoom + Abdunkeln beim Aufladen, beim Ausbruch Risse im Boden (bleiben für den Kampf),
     Trümmer von der Decke, Feuerwände an den Arenarändern (nur Feuer-Bosse, nur Optik), dauerhafte Farbstimmung je Phase
     und eine Wut-Aura um den Boss.
     Sieg: Abgang je Boss (Zerfall von oben nach unten mit Asche, Zusammenbruch mit Staub, Auflösen in Licht) und Beute-Fontäne.
     Koop: Kamera und Zoom halten alle Spieler (Z.players, falls vorhanden) im Bild.
     Einstellung Z.settings.bossAuftritt: "voll" (Standard) · "kurz" · "aus". Blitze über Z.flashK/FX.flashScreen/Z.lightFlash,
     Zeitlupe über FX.slowmo (Z.slowK), Wackeln über FX.addShake (Z.shakeK). Stufe 0: nur Kamera + Geste (kurz), keine Leinwand-Effekte.
     Schalter: Z.gfx.off.w30boss (alles aus). Prüfhilfe Z.w30boss. Kein Blau. */
  const BA = {
    glasstab: { g: "blink", col: "#c0283a", v: "zerfall" },
    erzpriesterin: { g: "saeule", col: "#ffe0a0", v: "licht" },
    bugbear: { g: "sprung", col: "#c87a3a", v: "sturz" },
    nezna: { g: "schatten", col: "#b080ff", v: "zerfall" },
    wraith: { g: "geist", col: "#c8b0d0", v: "zerfall" },
    schmiedewaechter: { g: "runen", col: "#ff8a3a", v: "sturz", fire: 1 },
    chasme: { g: "sturz", col: "#b8c050", v: "zerfall" },
    ilvaraW: { g: "laub", col: "#a8c060", v: "zerfall" },
    riese: { g: "fall", col: "#c8a070", v: "sturz", h: 150 },
    vrock: { g: "kreisen", col: "#c0503a", v: "zerfall" },
    demogorgon: { g: "eigen", col: "#b050a0", v: "sturz", live: 1 }, /* steigt mit eigener Animation (demogorgon.js) aus dem See: Welt läuft weiter, keine Versatz-Geste */
    themberchaud: { g: "fall", col: "#ff6a1a", v: "sturz", fire: 1, coins: 1, h: 300 },
    venomfang: { g: "sturz", col: "#9ac040", v: "sturz" },
    weberin: { g: "faden", col: "#c03a5a", v: "zerfall" }
  };
  const baDef = e => BA[e && e.id] || { g: "geist", col: nb((e && e.def && e.def.t) || "#ffd27a"), v: "zerfall" };
  const baOff = () => !!(Z.gfx && Z.gfx.off && Z.gfx.off.w30boss) || !!(Z.settings && Z.settings.cineOff);
  const baMode = () => { const m = Z.settings && Z.settings.bossAuftritt; return m === "kurz" || m === "aus" ? m : "voll"; };
  const baRausch = () => !!(Z.run && (Z.run.rausch || Z.run.w21rausch));
  /* Koop (W27): alle lebenden Spieler; ohne Z.players nur Ezekiel */
  function w30Players() { const a = Array.isArray(Z.players) && Z.players.length ? Z.players : [Z.player, Z.koop && Z.koop.p2]; return a.filter(p => p && !p.dead && p.w); } /* W27: Spieler 2 = Z.koop.p2 */
  /* größter Zoom (≤ zMax) um den Bildpunkt (fx, fy), bei dem alle Spieler im Bild bleiben */
  function w30FitZoom(zMax, fx, fy) {
    const cm = Z.cam, S = Z.gfx.scale || 1, ps = w30Players(); if (ps.length < 2) return zMax;
    const W = cm.w * S, H = cm.h * S, fxs = (fx - cm.x) * S, fys = (fy - cm.y) * S;
    for (let z = zMax; z > 1.005; z -= 0.02) {
      const x0 = fxs * (1 - 1 / z), y0 = fys * (1 - 1 / z), w = W / z, h = H / z, m = 14 * S;
      if (ps.every(p => { const px = (p.x + p.w / 2 - cm.x) * S, py0 = (p.y - cm.y) * S, py1 = (p.y + p.h - cm.y) * S; return px > x0 + m && px < x0 + w - m && py0 > y0 + m * 0.5 && py1 < y0 + h - m * 0.5; })) return z;
    }
    return 1;
  }

  /* ---------- Auftritt ---------- */
  let sc = null; /* { e, partner, d, t, D, Ti, g0, mode, cheap, hx, hy, tx, ty, done, skipT, imp } */
  function w30Start(e) {
    if (baOff() || !e || !e.def || baMode() === "aus" || !Z.cam || !Z.cam.bounds) return;
    const short = baMode() === "kurz" || baRausch() || low(), d = baDef(e);
    const cm = Z.cam, bx = e.x + e.w / 2, by = e.y + e.h * 0.5;
    /* Ziel: Boss, aber alle Spieler im Bild halten (Koop) */
    let tx = bx, ty = by - 10;
    /* allein: ganz auf den Boss (Welt steht ohnehin); Koop (W27, mehrere Spieler): alle Spieler bleiben im Bild */
    const ps = w30Players(), koop = ps.length > 1;
    if (koop) for (const p of ps) { const px = p.x + p.w / 2, py = p.y + p.h / 2; tx = clamp(tx, px - cm.w / 2 + 30, px + cm.w / 2 - 30); ty = clamp(ty, py - cm.h / 2 + 34, py + cm.h / 2 - 34); }
    let D = short ? 1.7 : 3.3, Ti = short ? 0.85 : 1.65, g0 = short ? 0.2 : 0.55;
    if (d.live) { D = Math.min(D, 1.6); Ti = Math.min(Ti, 0.9); g0 = 0.15; } /* Welt läuft weiter: nie länger als die Auftritts-Schonfrist des Bosses (e.intro 1,8 s) */
    /* die Welt steht während der Szene: ein laufendes Erscheinen (spawnT, Boden-Aufstieg) bliebe sonst halb sichtbar stehen – die Geste ersetzt es */
    e.spawnT = 0; if (e.partner) e.partner.spawnT = 0;
    sc = { e, partner: e.partner || null, d, t: 0, D, Ti, g0, short, cheap: low(), hx: cm.x + cm.w / 2, hy: cm.y + cm.h / 2, tx, ty, imp: false, done: false, skip: false, lv: Z.level, parts: [] };
    if (Z.music && Z.music.duck) try { Z.music.duck(0.45, Ti); } catch (_) {}
    A.play("shadow", { vol: 0.25, rate: 0.7 });
    if (d.g === "auftauchen") A.play("splash", { vol: 0.4, rate: 0.6, delay: Ti * 0.6 });
    if (d.g === "fall" || d.g === "sturz" || d.g === "kreisen") A.play("bat", { vol: 0.35, rate: 0.6, delay: Math.max(0, Ti - 0.5) });
  }
  /* Fortschritt der Geste 0..1 (1 = Aufprall) und Nachfedern 0..1 */
  const scU = s => clamp((s.t - s.g0) / Math.max(0.05, s.Ti - s.g0), 0, 1);
  const scV = s => clamp((s.t - s.Ti) / 0.45, 0, 1);
  function w30Impact(s) {
    s.imp = true;
    const e = s.e, d = s.d, x = e.x + e.w / 2, fy = e.y + e.h, col = d.col;
    const big = d.g === "fall" || d.g === "sprung" || d.g === "sturz" || d.g === "auftauchen";
    FX.addShake(big ? 9 : 5);
    inp.rumble && inp.rumble(big ? 0.7 : 0.35, 260);
    A.play(big ? "quake" : "magic", { vol: big ? 0.55 : 0.4 });
    if (Z.lightFlash) Z.lightFlash(x, e.y + e.h * 0.5, 160 + e.w, col, 0.75, 0.5);
    FX.flashScreen(col, 0.12);
    FX.ring(x, fy - 2, 70 + e.w, col, 0.5, 3);
    if (!s.cheap) {
      FX.ring(x, e.y + e.h * 0.45, 120 + e.w, "#fff2d0", 0.7, 2);
      if (big) { FX.burst(x, fy - 2, 14, { col: [Z.dustCol || "#8a7a70", "#b8a890", "#6a5a50"], sp: 210, ang: -Math.PI / 2, spread: 2.9, life: 0.7, size: 3.2, kind: "smoke", g: 80, jit: e.w * 0.8 }); }
      if (d.coins) FX.burst(x, fy - 6, 30, { col: ["#ffd27a", "#e8a530", "#fff0b0"], sp: 220, ang: -Math.PI / 2, spread: 1.8, life: 1.1, size: 2, kind: "spark", g: 520, add: true });
      if (d.g === "auftauchen") FX.burst(x, fy - 4, 30, { col: ["#d8c8d8", "#9a7a9a", "#5a4a5a"], sp: 200, ang: -Math.PI / 2, spread: 1.2, life: 0.9, size: 3, kind: "drop", g: 520 });
      if (d.g === "saeule" || d.g === "runen" || d.g === "geist" || d.g === "laub") FX.burst(x, e.y + e.h * 0.5, 30, { col: [col, "#fff2d0"], sp: 150, life: 0.8, size: 2.2, kind: "spark", add: true });
    }
    try { if (plate && plate.e === e && plate.t < 0) plate.t = 0.1; } catch (_) {}
  }
  function w30Step(raw) {
    const s = sc; if (!s) return;
    if (s.lv !== Z.level || !s.e || s.e.dead || s.e.hp <= 0 || Z.bossDefeated || (Z.player && Z.player.dead)) { sc = null; return; } /* Boss schon gefallen (Prüfläufe, Sofort-Sieg): Szene endet sofort */
    if (ui.modalOpen) return;
    s.t += raw;
    if (!s.imp && s.t >= s.Ti) w30Impact(s);
    /* Begleitpartikel der Geste (nur ab Stufe 1, gedrosselt) */
    if (!s.cheap && !s.imp && s.t > s.g0 && Math.random() < raw * 30) {
      const e = s.e, d = s.d, x = e.x + e.w / 2, o = w30Off(s, e);
      if (d.g === "blink") FX.p({ x: x + o.dx + (Math.random() - 0.5) * e.w, y: e.y + e.h * Math.random(), vx: 0, vy: -20, life: 0.6, size: 4, col: Math.random() < 0.5 ? "#6a1420" : "#3a1018", kind: "smoke", a: 0.7 });
      else if (d.g === "geist" || d.g === "schatten") FX.p({ x: x + (Math.random() - 0.5) * e.w * 1.6, y: e.y + e.h, vx: 0, vy: -35 - Math.random() * 30, life: 0.9, size: 3, col: d.g === "geist" ? "#8a7a90" : "#2a1a30", kind: "smoke", a: 0.55 });
      else if (d.g === "laub") { const a = Math.random() * TAU, r = 30 + e.w * 0.6; FX.p({ x: x + Math.cos(a) * r, y: e.y + e.h * 0.5 + Math.sin(a) * r * 0.6, vx: -Math.sin(a) * 90, vy: Math.cos(a) * 50 - 10, life: 0.7, size: 2.2, col: Math.random() < 0.5 ? "#8aa040" : "#c8a040", kind: "leaf" }); }
      else if (d.g === "runen") { const a = Math.random() * TAU, r = 40 + e.w * 0.7; FX.p({ x: x + Math.cos(a) * r, y: e.y + e.h * 0.5 + Math.sin(a) * r * 0.7, vx: -Math.cos(a) * 60, vy: -Math.sin(a) * 50, life: 0.5, size: 2, col: "#ffb060", kind: "glow", add: true }); }
      else if (d.g === "auftauchen") FX.p({ x: x + (Math.random() - 0.5) * e.w * 1.4, y: e.y + e.h - 2, vx: (Math.random() - 0.5) * 50, vy: -90 - Math.random() * 80, life: 0.6, size: 2, col: "#b8a0b8", kind: "drop", g: 500 });
      else if (d.g === "fall" && d.fire) FX.p({ x: x + o.dx + (Math.random() - 0.5) * e.w, y: e.y + o.dy + e.h * Math.random(), vx: (Math.random() - 0.5) * 30, vy: -80, life: 0.5, size: 2.4, col: Math.random() < 0.5 ? "#ff8a2a" : "#ffd27a", kind: "glow", add: true });
    }
    if (s.t >= s.D) { sc = null; }
  }
  function w30Skip() {
    const s = sc; if (!s || s.skip) return;
    if (!s.imp) { s.t = s.Ti; w30Impact(s); }
    s.skip = true; s.t = Math.max(s.t, s.D - 0.3);
    try { if (plate && plate.t < 0.1) plate.t = 0.1; } catch (_) {}
  }
  const w30Block = () => !!(sc && !sc.skip && !sc.d.live && sc.t < sc.D - 0.25);
  /* Zeichen-Versatz des Bosses während der Geste */
  const OFF = { dx: 0, dy: 0, a: 1, sx: 1, sy: 1, clipY: null };
  function w30Off(s, e) {
    const d = s.d, u = scU(s), v = scV(s), o = OFF; o.dx = 0; o.dy = 0; o.a = 1; o.sx = 1; o.sy = 1; o.clipY = null;
    const f = e.face || 1, g = d.g;
    if (g === "eigen") return o;
    if (s.t < s.g0 && g !== "runen") { /* vor der Geste: noch nicht da */
      if (g === "fall" || g === "sturz" || g === "kreisen" || g === "faden") { o.a = 0; return o; }
      if (g === "auftauchen") { o.dy = e.h * 1.1; o.clipY = e.y + e.h; return o; }
      if (g !== "sprung") { o.a = 0; return o; }
    }
    if (g === "fall") { const k = 1 - easeIn(u); o.dy = -(d.h || 220) * k; }
    else if (g === "sturz") { const k = 1 - easeIn(u); o.dy = -200 * k; o.dx = -f * 170 * k; }
    else if (g === "sprung") { o.dx = -f * 70 * (1 - u); o.dy = -110 * Math.sin(u * PI); }
    else if (g === "kreisen") { const a = u * PI * 2.5, r = 110 * (1 - easeOut(u)); o.dx = Math.cos(a) * r; o.dy = -150 * (1 - easeOut(u)) + Math.sin(a) * r * 0.25; }
    else if (g === "auftauchen") { o.dy = e.h * 1.1 * (1 - easeOut(u)); o.clipY = e.y + e.h; }
    else if (g === "faden") { o.dy = -230 * (1 - easeOut(u)) + Math.sin(s.t * 5) * 4 * (1 - u); }
    else if (g === "geist") { o.a = u * u; o.dy = 8 * (1 - u); o.dx = Math.sin(s.t * 23) * 2 * (1 - u); }
    else if (g === "blink") { o.a = (Z.flashK && Z.flashK() < 0.5) || (Z.blitzArm && Z.blitzArm()) ? easeIO(u) : u > 0.85 ? 1 : (Math.sin(s.t * 40) > 0.3 ? 0.55 * u : 0.08); } /* W31: „Blitzen reduzieren“ → weiches Einblenden statt Flackern */
    else if (g === "saeule" || g === "schatten" || g === "laub") { o.a = easeIO(u); }
    /* Aufprall: Stauchen und Nachfedern */
    if (s.imp && (g === "fall" || g === "sturz" || g === "sprung" || g === "kreisen")) { const q = (1 - v) * Math.sin(v * PI * 2.2) * 0.5 + (1 - v) * (1 - v) * 0.5; o.sy = 1 - 0.16 * q; o.sx = 1 + 0.12 * q; }
    return o;
  }
  /* Szene im Weltbild: Lichtsäule, Faden, Schatten am Boden, Runenkreis (nach dem Licht, additiv) */
  function w30DrawWorld(c, camR) {
    const s = sc; if (!s || s.cheap) return;
    const e = s.e, d = s.d, x = e.x + e.w / 2, fy = e.y + e.h, u = scU(s), t = s.t, o = w30Off(s, e);
    c.save();
    /* Schlagschatten am Boden wächst, während der Boss von oben kommt */
    if (d.g === "fall" || d.g === "sturz" || d.g === "kreisen" || d.g === "faden") {
      const k = t < s.g0 ? 0 : s.imp ? 1 - scV(s) : u;
      if (k > 0.01) { c.globalAlpha = 0.45 * k; c.fillStyle = "#0a0505"; c.beginPath(); c.ellipse(x, fy, e.w * (0.4 + 0.6 * k), 3 + 3 * k, 0, 0, TAU); c.fill(); }
    }
    c.globalCompositeOperation = "lighter";
    if (d.g === "saeule") {
      const a = easeOut(span(t, s.g0 * 0.5, s.Ti)) * (1 - easeIO(span(t, s.Ti + 0.3, s.D)));
      if (a > 0.01) {
        const top = camR.y - 20, w = e.w * 0.9 + 10 + 30 * (s.imp ? scV(s) : 0);
        const g = c.createLinearGradient(x - w, 0, x + w, 0); g.addColorStop(0, "rgba(255,224,160,0)"); g.addColorStop(0.5, rgba("#fff0c8", 0.5 * a)); g.addColorStop(1, "rgba(255,224,160,0)");
        c.fillStyle = g; c.fillRect(x - w, top, w * 2, fy - top);
        c.fillStyle = rgba("#fffaf0", 0.5 * a); c.fillRect(x - 1.5, top, 3, fy - top);
        c.globalAlpha = a; c.strokeStyle = rgba("#ffe0a0", 0.6); c.lineWidth = 1.2; c.beginPath(); c.ellipse(x, fy, w * 1.1, w * 0.22, 0, 0, TAU); c.stroke(); c.globalAlpha = 1;
      }
    } else if (d.g === "faden") {
      const top = camR.y - 10, by = e.y + o.dy + 2;
      c.globalCompositeOperation = "source-over"; c.strokeStyle = "rgba(232,216,224,.75)"; c.lineWidth = 0.9;
      c.beginPath(); c.moveTo(x + Math.sin(t * 3) * 3, top); c.lineTo(x, by); c.stroke();
    } else if (d.g === "runen") {
      const a = easeOut(span(t, 0.05, s.Ti)) * (1 - easeIO(span(t, s.Ti + 0.4, s.D)));
      if (a > 0.01) {
        const r = 36 + e.w * 0.7, cy = e.y + e.h * 0.5;
        c.strokeStyle = rgba("#ff9a40", 0.7 * a); c.lineWidth = 1.3; c.beginPath(); c.ellipse(x, cy, r, r * 0.75, 0, 0, TAU); c.stroke();
        c.fillStyle = rgba("#ffc070", 0.9 * a);
        for (let i = 0; i < 8; i++) { const ang = t * 0.8 + i * TAU / 8, px = x + Math.cos(ang) * r, py = cy + Math.sin(ang) * r * 0.75, on = span(t, 0.1 + i * 0.12 * (s.Ti / 1.65), 0.3 + i * 0.12 * (s.Ti / 1.65)); if (on <= 0) continue; c.globalAlpha = on; c.beginPath(); c.moveTo(px, py - 4); c.lineTo(px + 2.4, py); c.lineTo(px, py + 4); c.lineTo(px - 2.4, py); c.closePath(); c.fill(); }
        c.globalAlpha = 1;
      }
    } else if (d.g === "auftauchen" && !s.imp) {
      const k = u; c.strokeStyle = rgba("#e0c8e0", 0.5 * k); c.lineWidth = 1.2;
      for (let i = 0; i < 3; i++) { const r = ((t * 40 + i * 18) % 54) + e.w * 0.3; c.globalAlpha = 1 - ((t * 40 + i * 18) % 54) / 54; c.beginPath(); c.ellipse(x, fy, r, r * 0.16, 0, 0, TAU); c.stroke(); }
      c.globalAlpha = 1;
    }
    /* Bossfarbiges Licht beim Aufprall */
    if (s.imp) { const v = scV(s); if (v < 1) { const g = c.createRadialGradient(x, e.y + e.h * 0.5, 0, x, e.y + e.h * 0.5, 90 + e.w); g.addColorStop(0, rgba(d.col, 0.35 * (1 - v) * (Z.flashK ? Z.flashK("licht") : 1))); g.addColorStop(1, rgba(d.col, 0)); c.fillStyle = g; c.fillRect(x - 100 - e.w, e.y + e.h * 0.5 - 100 - e.w, 200 + 2 * e.w, 200 + 2 * e.w); } }
    c.restore();
  }
  /* Bildschirm: Abdunkeln in Bossfarbe + eigene Kinobalken (das Namensband bringt später seine eigenen) */
  function w30DrawScreen(c, W, H) {
    const s = sc;
    if (s && !s.cheap) {
      const t = s.t, inA = easeIO(span(t, 0, Math.min(0.5, s.Ti * 0.5))), outA = 1 - easeIO(span(t, s.D - 0.6, s.D));
      const dark = inA * outA * (s.imp ? lerp(1, 0.45, easeOut(scV(s))) : 1);
      if (dark > 0.01) {
        c.save(); c.setTransform(1, 0, 0, 1, 0, 0);
        const S = Z.gfx.scale || 1, cm = Z.cam, bx = (s.e.x + s.e.w / 2 - cm.x) * S, by = (s.e.y + s.e.h * 0.5 - cm.y) * S;
        const g = c.createRadialGradient(bx, by, Math.min(W, H) * 0.12, bx, by, Math.max(W, H) * 0.75);
        g.addColorStop(0, "rgba(10,4,4,0)"); g.addColorStop(1, rgba(mix("#0a0404", s.d.col, 0.18), 0.5 * dark));
        c.fillStyle = g; c.fillRect(0, 0, W, H);
        c.globalCompositeOperation = "soft-light"; c.fillStyle = rgba(s.d.col, 0.22 * dark); c.fillRect(0, 0, W, H);
        c.globalCompositeOperation = "source-over";
        const bar = H * 0.085 * inA * outA;
        if (bar > 0.5) { c.fillStyle = "#0a0605"; c.fillRect(0, 0, W, bar); c.fillRect(0, H - bar, W, bar); c.fillStyle = rgba(GOLD, 0.35); c.fillRect(0, bar - 1, W, 1); c.fillRect(0, H - bar, W, 1); }
        if (bar > H * 0.05 && !s.skip && !s.d.live) { const sz = Math.min(W, H) / 100; c.textBaseline = "middle"; c.textAlign = "right"; c.font = "italic " + (sz * 2.4).toFixed(1) + "px " + FI; c.fillStyle = "rgba(232,216,196,.6)"; c.fillText((inp.device === "pad" ? L(["Knopf: überspringen", "Button: skip"]) : inp.device === "touch" ? L(["Tippen: überspringen", "Tap: skip"]) : L(["Taste: überspringen", "Any key: skip"])) + " ▸", W - sz * 4, H - bar / 2); }
        c.restore();
      }
    }
    w30PhaseScreen(c, W, H);
  }
  /* Kamera: zum Boss und zurück (über dem Schwenk/Atmen aus diesem Modul) */
  const cuW30 = cam.update;
  cam.update = function (dt, p) {
    const r = cuW30.apply(this, arguments);
    const s = sc; if (!s || ui.modalOpen) return r;
    const go = s.short ? 0.35 : 0.6, back = s.skip ? 0.25 : s.short ? 0.35 : 0.55;
    const k = s.t < go ? easeIO(s.t / go) : s.t > s.D - back ? 1 - easeIO((s.t - (s.D - back)) / back) : 1;
    /* Startpunkt folgt der normalen Kamera (Rückweg landet dort, wo die Kamera sonst wäre) */
    const hx = cam.x + cam.w / 2, hy = cam.y + cam.h / 2;
    cam.x = lerp(hx, s.tx, k) - cam.w / 2; cam.y = lerp(hy, s.ty, k) - cam.h / 2; cam.clamp();
    return r;
  };
  function w30Zoom(put) {
    const s = sc;
    if (s && !s.cheap) {
      const go = s.short ? 0.4 : 0.7, k = easeOut(span(s.t, 0, go)) * (1 - easeIO(span(s.t, s.D - 0.5, s.D)));
      const fx = s.e.x + s.e.w / 2, fy = s.e.y + s.e.h * 0.45, zm = s.short ? 1.1 : 1.2;
      if (k > 0.001) put(1 + (w30FitZoom(zm, fx, fy) - 1) * k, fx, fy);
    }
    const ph = phx; if (ph && ph.e && !ph.e.dead && !low()) {
      const k = easeOut(span(ph.t, 0, 0.3)) * (1 - easeIO(span(ph.t, 0.85, 1.5)));
      const fx = ph.e.x + ph.e.w / 2, fy = ph.e.y + ph.e.h * 0.45;
      if (k > 0.001) put(1 + (w30FitZoom(1.1, fx, fy) - 1) * k, fx, fy);
    }
  }

  /* ---------- Phasenwechsel ---------- */
  let phx = null;                 /* laufender Phasenwechsel { e, t, col, fired } */
  let scars = null;               /* Risse im Boden (bleiben bis Gebietswechsel/Boss tot) */
  let fireW = null;               /* Feuerwände { t, x0, x1, fy, top } */
  const phaseSeen = new WeakMap();
  function w30PhaseWatch() {
    const b = Z.boss; if (!b || b.dead || !b.trans || baOff()) return;
    if (phaseSeen.get(b) === b.trans) return;
    phaseSeen.set(b, b.trans);
    const ph = b.def.phases && b.def.phases[b.trans.k];
    phx = { e: b, t: 0, col: nb((ph && ph.aura) || baDef(b).col || "#ff6a3a"), fired: false, k: b.trans.k, lv: Z.level };
  }
  function w30PhaseStep(raw) {
    w30PhaseWatch();
    const p = phx;
    if (p) {
      if (p.lv !== Z.level || p.e.dead) phx = null;
      else {
        p.t += raw;
        if (!p.fired && p.e.trans && p.e.trans.fired) { p.fired = true; w30PhaseFire(p); }
        if (p.t > 2.2) phx = null;
      }
    }
    if (fireW) { fireW.t += raw; if (fireW.t > 2.8 || fireW.lv !== Z.level) fireW = null; }
    if (scars && (scars.lv !== Z.level)) scars = null;
  }
  function w30PhaseFire(p) {
    const e = p.e, d = baDef(e), x = e.x + e.w / 2, fy = e.y + e.h, ar = (Z.bossKit && Z.bossKit.arena) ? Z.bossKit.arena() : null;
    if (!baRausch()) FX.slowmo(0.3, 0.3); /* kurzer Zeitlupen-Moment (Z.slowK wirkt in FX.slowmo) */
    if (low()) return;
    /* Risse: verzweigte Linien vom Boss weg am Boden entlang */
    if (!scars || scars.e !== e) scars = { e, lv: Z.level, list: [], t0: clock };
    const R = Z.Rng ? Z.Rng(((e.x | 0) * 31 + p.k * 977) >>> 0) : Math.random;
    for (const dir of [-1, 1]) {
      let cx = x + dir * e.w * 0.3, cy = fy - 1; const n = 6 + (R() * 4 | 0), pts = [cx, cy];
      for (let i = 0; i < n; i++) { cx += dir * (10 + R() * 16); const gy = Z.groundY ? Z.groundY(cx, cy - 10) : cy; if (Math.abs(gy - cy) > 18) break; cy = gy - 1 + (R() - 0.5) * 1.5; pts.push(cx, cy); if (R() < 0.35) scars.list.push({ pts: [cx, cy, cx + dir * (5 + R() * 8), cy - 2 - R() * 5], born: clock, col: p.col }); }
      scars.list.push({ pts, born: clock, col: p.col });
    }
    if (scars.list.length > 60) scars.list.splice(0, scars.list.length - 60);
    /* Trümmer von der Decke */
    const cm = Z.cam;
    for (let i = 0; i < (qLevel() >= 2 ? 16 : 7); i++) {
      const tx = cm.x + Math.random() * cm.w;
      FX.p({ x: tx, y: cm.y - 4, vx: (Math.random() - 0.5) * 20, vy: 40 + Math.random() * 120, life: 1.4, size: 2 + Math.random() * 3, col: Math.random() < 0.5 ? "#5a4a40" : "#7a6a5a", kind: "shard", g: 600, vr: (Math.random() - 0.5) * 10, collide: true, keep: true });
      if (i % 3 === 0) FX.p({ x: tx, y: cm.y, vx: 0, vy: 30, life: 1, size: 5, col: "#8a7a6a", kind: "smoke", a: 0.4, g: 40 });
    }
    /* Feuerwände an den Arenarändern (nur Optik, nur Feuer-Bosse) */
    if (d.fire && ar) fireW = { t: 0, x0: Math.max(ar.x0, cm.x + 6), x1: Math.min(ar.x1, cm.x + cm.w - 6), fy: ar.floor || fy, col: p.col, lv: Z.level };
  }
  function w30PhaseWorld(c, camR) {
    if (low()) return;
    const t = clock;
    /* Risse: dunkle Kerbe mit Glut, die langsam abkühlt */
    if (scars && scars.list.length) {
      c.save(); c.lineCap = "round"; c.lineJoin = "round";
      for (const sk of scars.list) {
        const age = t - sk.born, grow = clamp(age / 0.35, 0, 1), pts = sk.pts, n = pts.length / 2, m = Math.max(2, Math.ceil(n * grow));
        if (pts[0] < camR.x - 80 || pts[0] > camR.x + camR.w + 80) continue;
        c.strokeStyle = "rgba(14,8,6,.85)"; c.lineWidth = 1.8; c.beginPath(); c.moveTo(pts[0], pts[1]); for (let i = 1; i < m; i++) c.lineTo(pts[i * 2], pts[i * 2 + 1]); c.stroke();
        const heat = Math.max(0.12, 1 - age / 6);
        c.globalCompositeOperation = "lighter"; c.strokeStyle = rgba(sk.col, 0.55 * heat); c.lineWidth = 0.8; c.stroke(); c.globalCompositeOperation = "source-over";
      }
      c.restore();
    }
    /* Feuerwände */
    const f = fireW;
    if (f) {
      const a = easeOut(span(f.t, 0, 0.35)) * (1 - easeIO(span(f.t, 2.0, 2.8)));
      if (a > 0.01) {
        c.save(); c.globalCompositeOperation = "lighter";
        for (const ex of [f.x0, f.x1]) {
          const h = 90 * a;
          const g = c.createLinearGradient(0, f.fy - h, 0, f.fy); g.addColorStop(0, "rgba(255,120,40,0)"); g.addColorStop(0.6, rgba("#ff7a2a", 0.35 * a)); g.addColorStop(1, rgba("#ffd27a", 0.55 * a));
          c.fillStyle = g;
          c.beginPath(); c.moveTo(ex - 14, f.fy);
          for (let i = 0; i <= 8; i++) { const xx = ex - 14 + i * 3.5, yy = f.fy - h * (0.55 + 0.45 * Math.abs(Math.sin(t * 7 + i * 1.7 + ex))); c.lineTo(xx, yy); }
          c.lineTo(ex + 14, f.fy); c.closePath(); c.fill();
          if (Math.random() < 0.4) FX.p({ x: ex + (Math.random() - 0.5) * 24, y: f.fy - Math.random() * h * 0.6, vx: (Math.random() - 0.5) * 20, vy: -60 - Math.random() * 60, life: 0.6, size: 2, col: "#ffb050", kind: "glow", add: true });
        }
        c.restore();
      }
    }
    /* Wut-Aura (ab Phase 2): züngelnde Flammenkrone in Aurafarbe um den Boss */
    const b = Z.boss;
    if (b && !b.dead && !(b.hidden > 0) && (b.phase || 0) >= 1 && b.def && b.def.phases && b.def.phases.length > 1 && !(sc && sc.e === b)) {
      const col = nb(b.aura || baDef(b).col), x = b.x + b.w / 2, fy = b.y + b.h, k = Math.min(1, (b.phase || 0) / 2 + 0.4);
      c.save(); c.globalCompositeOperation = "lighter";
      const n = qLevel() >= 2 ? 9 : 5;
      for (let i = 0; i < n; i++) {
        const u = i / (n - 1), bx = x + (u - 0.5) * b.w * 1.1, hh = (b.h * 0.35 + 6) * k * (0.6 + 0.4 * Math.sin(t * 6 + i * 2.1));
        const g = c.createLinearGradient(0, fy - hh, 0, fy); g.addColorStop(0, rgba(col, 0)); g.addColorStop(1, rgba(col, 0.22 * k));
        c.fillStyle = g; c.beginPath(); c.moveTo(bx - 4, fy); c.quadraticCurveTo(bx - 3, fy - hh * 0.5, bx + Math.sin(t * 5 + i) * 3, fy - hh); c.quadraticCurveTo(bx + 3, fy - hh * 0.5, bx + 4, fy); c.closePath(); c.fill();
      }
      c.restore();
    }
  }
  /* Bildschirm: Abdunkeln beim Aufladen, danach dauerhafte Farbstimmung je Phase */
  function w30PhaseScreen(c, W, H) {
    if (low()) return;
    const b = Z.boss, p = phx;
    let tint = 0, col = null;
    if (b && !b.dead && (b.phase || 0) >= 1 && b.def && b.def.phases && b.def.phases.length > 1) { tint = Math.min(0.16, 0.07 * (b.phase || 0)); col = nb(b.aura || baDef(b).col); }
    let dark = 0;
    if (p && !p.e.dead) { dark = easeOut(span(p.t, 0, 0.5)) * (1 - easeIO(span(p.t, 0.8, 1.6))); col = p.col; tint = Math.max(tint, 0.25 * dark); }
    if (!col || (tint < 0.005 && dark < 0.005)) return;
    c.save(); c.setTransform(1, 0, 0, 1, 0, 0);
    if (dark > 0.01) { const S = Z.gfx.scale || 1, cm = Z.cam, bx = (p.e.x + p.e.w / 2 - cm.x) * S, by = (p.e.y + p.e.h * 0.5 - cm.y) * S; const g = c.createRadialGradient(bx, by, Math.min(W, H) * 0.15, bx, by, Math.max(W, H) * 0.7); g.addColorStop(0, "rgba(8,3,3,0)"); g.addColorStop(1, "rgba(8,3,3," + (0.5 * dark).toFixed(3) + ")"); c.fillStyle = g; c.fillRect(0, 0, W, H); }
    c.globalCompositeOperation = "soft-light"; c.fillStyle = rgba(col, tint); c.fillRect(0, 0, W, H);
    c.restore();
  }

  /* ---------- Sieg: Abgang und Beute-Fontäne ---------- */
  let win = null;
  function w30WinStart(b) {
    if (baOff() || !b) return;
    const d = baDef(b);
    win = { e: b, d, t: 0, x: b.x + b.w / 2, fy: b.y + b.h, top: b.y, h: b.h, w: b.w, lv: Z.level, fount: 0, cheap: low() };
    if (b.partner && b.partner.dead) win.p2 = b.partner;
    scars = scars && scars.e === b ? scars : null;
  }
  function w30WinStep(raw) {
    const k = win; if (!k) return;
    if (k.lv !== Z.level) { win = null; return; }
    k.t += raw;
    const e = k.e, dT = e.deadT || 0;
    /* Beute-Fontäne: Gold im Bogen, dann Lichtsäule über der Beute (ab Stufe 1) */
    if (!k.cheap) {
      if (k.t > 0.25 && k.t < 1.4) { const n = qLevel() >= 2 ? 3 : 1; for (let i = 0; i < n; i++) if (Math.random() < 0.8) FX.p({ x: k.x + (Math.random() - 0.5) * 8, y: k.fy - k.h * 0.4, vx: (Math.random() - 0.5) * 160, vy: -260 - Math.random() * 160, life: 1.3, size: 1.6 + Math.random(), col: Math.random() < 0.6 ? "#ffd27a" : "#fff0b0", kind: "spark", g: 620, add: true, drag: 0.995 }); }
      if (!k.fount && k.t > 1.0) { k.fount = 1; FX.burst(k.x, k.fy - 6, 24, { col: ["#ffd27a", "#fff0c0", "#e8a530"], sp: 200, ang: -Math.PI / 2, spread: 1.1, life: 1.0, size: 2, kind: "spark", g: 420, add: true }); A.play("coin", { vol: 0.45, rate: 0.9 }); }
      /* Abgang: Partikel je Art, gekoppelt an den Todesfortschritt des Bosses */
      if (dT < 1.7 && Math.random() < raw * 40) {
        const line = k.top + k.h * clamp(dT / 1.4, 0, 1);
        if (k.d.v === "zerfall") FX.p({ x: k.x + (Math.random() - 0.5) * k.w, y: line + (Math.random() - 0.5) * 4, vx: (Math.random() - 0.5) * 30, vy: -40 - Math.random() * 50, life: 1.1, size: 1.6 + Math.random() * 1.5, col: Math.random() < 0.5 ? "#3a302c" : mix(e.def.c || "#6a5a50", "#2a2020", 0.3), kind: "smoke", a: 0.8, g: -20 });
        else if (k.d.v === "sturz") FX.p({ x: k.x + (Math.random() - 0.5) * k.w * 1.4, y: k.fy - 2, vx: (Math.random() - 0.5) * 80, vy: -20 - Math.random() * 40, life: 0.9, size: 4, col: Z.dustCol || "#8a7a70", kind: "smoke", a: 0.6 });
        else FX.p({ x: k.x + (Math.random() - 0.5) * k.w, y: k.top + Math.random() * k.h, vx: 0, vy: -60 - Math.random() * 60, life: 1, size: 1.6, col: Math.random() < 0.5 ? "#fff0c0" : k.d.col, kind: "glow", add: true });
      }
    }
    if (k.t > 4) win = null;
  }
  function w30WinWorld(c, camR) {
    const k = win; if (!k || k.cheap) return;
    if (k.d.v === "licht") {
      const dT = k.e.deadT || 0, a = easeOut(span(dT, 0, 0.6)) * (1 - easeIO(span(k.t, 2.2, 3.6)));
      if (a > 0.01) {
        c.save(); c.globalCompositeOperation = "lighter";
        const top = camR.y - 20, w = k.w * 0.8 + 8;
        const g = c.createLinearGradient(k.x - w, 0, k.x + w, 0); g.addColorStop(0, "rgba(255,230,170,0)"); g.addColorStop(0.5, rgba("#fff2c8", 0.45 * a)); g.addColorStop(1, "rgba(255,230,170,0)");
        c.fillStyle = g; c.fillRect(k.x - w, top, w * 2, k.fy - top);
        c.restore();
      }
    }
  }
  /* Abgang am Boss selbst (Zeichen-Hülle): Zerfall schneidet von oben weg, Sturz sackt zusammen, Licht überstrahlt */
  function w30DrawDead(c, e, run) {
    const k = win, dT = e.deadT || 0, v = k.d.v;
    if (v === "zerfall") {
      const line = k.top + k.h * clamp(dT / 1.4, 0, 1) - 2;
      c.save(); c.beginPath(); c.rect(e.x - 200, line, e.w + 400, 400); c.clip();
      const r = run(); c.restore();
      if (!k.cheap && dT < 1.45) { c.save(); c.globalCompositeOperation = "lighter"; c.fillStyle = rgba(k.d.col, 0.55); c.fillRect(k.x - k.w * 0.6, line - 0.6, k.w * 1.2, 1.3); c.restore(); }
      return r;
    }
    if (v === "sturz") {
      const q = easeIn(clamp(dT / 1.2, 0, 1));
      c.save(); c.translate(k.x, k.fy); c.rotate((e.face || 1) * -0.22 * q); c.scale(1 + 0.08 * q, 1 - 0.28 * q); c.translate(-k.x, -k.fy);
      try { return run(); } finally { c.restore(); }
    }
    /* licht: Gestalt streckt sich leicht nach oben und überstrahlt */
    const q = easeOut(clamp(dT / 1.2, 0, 1));
    c.save(); c.translate(k.x, k.fy); c.scale(1 - 0.12 * q, 1 + 0.1 * q); c.translate(-k.x, -k.fy);
    let r; try { r = run(); } finally { c.restore(); }
    if (!k.cheap) { c.save(); c.globalCompositeOperation = "lighter"; const g = c.createRadialGradient(k.x, k.top + k.h * 0.5, 0, k.x, k.top + k.h * 0.5, k.h * 0.9 + 6); g.addColorStop(0, rgba("#fff6e0", 0.6 * q * (Z.flashK ? Z.flashK("licht") : 1))); g.addColorStop(1, "rgba(255,246,224,0)"); c.fillStyle = g; c.fillRect(k.x - k.h - 6, k.top - k.h * 0.4 - 6, 2 * k.h + 12, 1.8 * k.h + 12); c.restore(); }
    return r;
  }

  /* ---------- Einhängen ---------- */
  /* Boss-Zeichnung umhüllen (nach allen anderen Hüllen, darum beim Laden) */
  function w30WrapEnemy() {
    const de0 = Z.drawEnemy; if (!de0 || de0.w30) return;
    const de = function (c, e) {
      const s = sc;
      if (s && (e === s.e || e === s.partner) && !e.dead) {
        const o = w30Off(s, e === s.partner ? s.e : e);
        if (o.a <= 0.01) return;
        const x = s.e.x + s.e.w / 2, fy = s.e.y + s.e.h;
        /* Lichtwechsel: der Boss steht während seines Auftritts im eigenen Licht (wirkt im Lichtdurchgang dieses Bildes) */
        if (Z.addLight && e === s.e && !s.cheap) Z.addLight(x + o.dx, s.e.y + s.e.h * 0.45 + o.dy, 110 + s.e.w, s.d.col, (s.imp ? 0.75 : 0.45) * o.a);
        c.save();
        if (o.clipY != null) { c.beginPath(); c.rect(e.x - 300, o.clipY - 900, e.w + 600, 900 + 3); c.clip(); }
        c.translate(o.dx, o.dy);
        if (o.sx !== 1 || o.sy !== 1) { c.translate(x, fy); c.scale(o.sx, o.sy); c.translate(-x, -fy); }
        if (o.a < 1) c.globalAlpha *= o.a;
        try { return de0.apply(this, arguments); } finally { c.restore(); }
      }
      const k = win;
      if (k && e.dead && (e === k.e || e === k.p2) && !baOff()) { const self = this, args = arguments; return w30DrawDead(c, e, () => de0.apply(self, args)); }
      return de0.apply(this, arguments);
    };
    de.w30 = true; Z.drawEnemy = de;
  }
  if (document.readyState === "complete") setTimeout(w30WrapEnemy, 0); else addEventListener("load", () => setTimeout(w30WrapEnemy, 0));
  /* Bossauftritt: nach dem Namensband dieses Moduls (plate) starten und das Band auf den Aufprall legen */
  const biW30 = ui.bossIntro;
  ui.bossIntro = function (e) {
    const r = biW30.apply(this, arguments);
    try {
      w30WrapEnemy(); w30Start(e);
      if (sc && plate && plate.e === e) plate.t = -(sc.Ti - 0.12);
    } catch (err) { console.error("W30 Auftritt", err); sc = null; }
    return r;
  };
  const bdW30 = ui.bossDown;
  ui.bossDown = function (b) {
    const r = bdW30.apply(this, arguments);
    try { sc = null; phx = null; fireW = null; w30WinStart(b); } catch (err) { console.error("W30 Sieg", err); win = null; }
    return r;
  };
  const alW30 = Z.drawAfterLight;
  Z.drawAfterLight = function (c, camR) {
    if (alW30) alW30.apply(this, arguments);
    if (baOff() || !Z.level) return;
    try { w30PhaseWorld(c, camR); w30DrawWorld(c, camR); w30WinWorld(c, camR); } catch (err) { console.error("W30 Welt", err); }
  };
  function w30Tick(raw) { if (baOff()) { sc = null; phx = null; return; } w30Step(raw); w30PhaseStep(raw); w30WinStep(raw); }
  /* Einstellung „Boss-Auftritte: voll/kurz/aus“ als Zeile im Komfort-Fenster (Abschnitt „Ablauf“) – eigene Knöpfe, kein Eingriff in ui.js */
  const komfortW30 = ui.komfort;
  if (komfortW30) ui.komfort = function () {
    const r = komfortW30.apply(this, arguments);
    try {
      const box = document.querySelector(".komfort"); if (!box || box.querySelector('[data-k="bossAuftritt"]')) return r;
      const cur = baMode(), opts = [["voll", ["voll", "full"]], ["kurz", ["kurz", "short"]], ["aus", ["aus", "off"]]];
      const row = document.createElement("div"); row.className = "k-zeile"; row.dataset.k = "bossAuftritt";
      row.innerHTML = '<div class="k-text"><b>' + L(["Boss-Auftritte", "Boss entrances"]) + "</b><small>" + L(["Kamerafahrt, Geste und Namensband beim Erscheinen eines Bosses. Im Bossrausch immer kurz; die Spielzeit steht währenddessen.", "Camera move, gesture and name banner when a boss appears. Always short in the Boss Rush; game time is paused meanwhile."]) + '</small></div><div class="k-wahl" role="radiogroup">' +
        opts.map(([v, n]) => '<button class="k-seg' + (v === cur ? " an" : "") + '" role="radio" aria-checked="' + (v === cur) + '" data-w30ba="' + v + '">' + L(n) + "</button>").join("") + "</div>";
      const after = box.querySelector('[data-k="schnellstart"]');
      if (after && after.parentNode) after.parentNode.insertBefore(row, after.nextSibling); else box.appendChild(row);
      row.querySelectorAll("[data-w30ba]").forEach(btn => btn.addEventListener("click", ev => {
        ev.stopPropagation(); Z.settings.bossAuftritt = btn.dataset.w30ba; Z.saveSettings && Z.saveSettings();
        row.querySelectorAll(".k-seg").forEach(x => { const on = x === btn; x.classList.toggle("an", on); x.setAttribute("aria-checked", on); });
      }));
    } catch (err) { console.error("W30 Einstellung", err); }
    return r;
  };
  Z.w30boss = {
    state: () => ({ scene: sc ? { id: sc.e.id, t: +sc.t.toFixed(2), D: sc.D, Ti: sc.Ti, imp: sc.imp, short: sc.short, block: w30Block() } : null, phase: phx ? { t: +phx.t.toFixed(2), fired: phx.fired } : null, scars: scars ? scars.list.length : 0, fire: !!fireW, win: win ? { t: +win.t.toFixed(2), v: win.d.v } : null }),
    start: e => w30Start(e || Z.boss), skip: w30Skip, BA,
    /* Prüfhilfe für Bildfolgen: Szene auf Zeitpunkt t setzen */
    seek: t => { if (!sc) return; sc.t = t; if (!sc.imp && t >= sc.Ti) w30Impact(sc); }
  };

  /* Prüfhilfe */
  Z.uebergang = { bench: () => { const [W, H] = canvasSize(); parch = null; let t = performance.now(); parchment(W, H); const a = performance.now() - t; t = performance.now(); buildPage(W, H, Object.assign(pageInfo(Z.level.id, Z.biome, Z.level), { id: Z.level.id, B: Z.biome, page: grabPage() })); return [+a.toFixed(1), +(performance.now() - t).toFixed(1)]; }, state: () => ({ book: book ? { mode: book.mode, i: book.i, n: book.pages.length, t: +book.t.toFixed(2) } : null, pan: pan ? +pan.t.toFixed(2) : null, suck: !!suck, climax: climax ? +climax.t.toFixed(2) : null, plate: !!plate, gold: gold.length, zoom: +zCur.toFixed(3), calm: +breath.calm.toFixed(2) }), skip: skipAll, gold: goldAtEl, slow: v => { tScale = v > 0 ? v : 1; } };
})();
