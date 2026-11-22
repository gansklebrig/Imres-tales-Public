/* Ezekiel – The Destroyer · Bilderbuch-Kulissen
   Eine zusätzliche, reich bemalte Tiefenebene je Gebiet – wie eine Seite aus einem alten Bilderbuch:
   Burgen mit Dutzenden Türmen, Fenstern, Erkern, Brücken und Bannern; Kellergewölbe mit Fassregalen;
   Hallen mit Freitreppen, Leuchtern und bunten Glasfenstern; Glockentürme voller Zahnräder;
   Schmieden mit glühenden Essen; Höhlen mit Pilzwäldern, versunkenen Tempeln und Wasserfällen;
   eine Glutstadt voller Kamine; Turmspitzen über den Wolken. Dazu lebendige Einzelheiten:
   flackernde Fensterlichter, wehende Banner, Rauchfahnen, drehende Zahnräder, Leuchtfeuer. */
(function () {
  "use strict";
  const Z = window.Z, G = Z.gfx;
  const TAU = Math.PI * 2;
  const PW = 1536; /* Breite einer Bilderbuchseite, wiederholt sich */
  const PF = 0.22, PY = 0.14; /* Parallaxe */

  /* ---------- Farben ---------- */
  const hex = h => { h = h.replace("#", ""); if (h.length === 3) h = h.split("").map(x => x + x).join(""); const n = parseInt(h, 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; };
  const toHex = a => "#" + a.map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0")).join("");
  const mix = (a, b, t) => { const A = hex(a), B2 = hex(b); return toHex(A.map((v, i) => v + (B2[i] - v) * t)); };
  const rgba = (h, a) => { const [r, g, b] = hex(h); return "rgba(" + r + "," + g + "," + b + "," + a + ")"; };

  /* ---------- Malwerkzeug ---------- */
  function P(c, R, pal) { return { c, R, pal, lights: [], flags: [], smoke: [], gears: [], beams: [], falls: [], glows: [] }; }

  function stoneTex(o, x, y, w, h, col, rows) {
    const { c, R } = o; rows = rows || 5;
    c.save(); c.beginPath(); c.rect(x, y, w, h); c.clip();
    c.fillStyle = rgba(mix(col, "#000", 0.5), 0.35);
    for (let yy = y + rows; yy < y + h; yy += rows) { c.fillRect(x, yy, w, 0.6); const off = ((yy / rows) % 2) * (rows * 1.6); for (let xx = x + off; xx < x + w; xx += rows * 3.2) c.fillRect(xx, yy - rows, 0.6, rows); }
    for (let i = 0; i < w * h / 90; i++) { c.fillStyle = rgba(R() < 0.5 ? mix(col, "#fff", 0.2) : mix(col, "#000", 0.3), 0.25); c.fillRect(x + R() * w, y + R() * h, 1 + R() * 3, 1 + R() * 2); }
    c.restore();
  }
  function shadeBody(o, x, y, w, h, col) {
    const { c } = o; const g = c.createLinearGradient(x, 0, x + w, 0);
    g.addColorStop(0, mix(col, "#fff", 0.16)); g.addColorStop(0.35, col); g.addColorStop(1, mix(col, "#000", 0.38));
    c.fillStyle = g; c.fillRect(x, y, w, h);
  }
  function archWin(o, x, y, w, h, lit, warm) {
    const { c } = o;
    c.fillStyle = lit ? (warm || "#ffcf7a") : "#0c080c";
    c.beginPath(); c.moveTo(x, y + h); c.lineTo(x, y + w / 2); c.arc(x + w / 2, y + w / 2, w / 2, Math.PI, 0); c.lineTo(x + w, y + h); c.closePath(); c.fill();
    if (lit) { c.fillStyle = "rgba(90,50,20,.55)"; c.fillRect(x + w / 2 - 0.3, y + 1, 0.6, h - 1); c.fillRect(x, y + h * 0.55, w, 0.6); o.lights.push({ x: x + w / 2, y: y + h / 2, r: 4 + w * 1.6, col: warm || "#ffcf7a", ph: o.R() * 10 }); }
    c.fillStyle = "rgba(0,0,0,.35)"; c.fillRect(x - 0.6, y + h, w + 1.2, 1);
  }
  function roofCone(o, cx, y, w, h, col) {
    const { c, R } = o;
    const g = c.createLinearGradient(cx - w / 2, 0, cx + w / 2, 0); g.addColorStop(0, mix(col, "#fff", 0.15)); g.addColorStop(1, mix(col, "#000", 0.45));
    c.fillStyle = g; c.beginPath(); c.moveTo(cx - w / 2 - 2, y); c.lineTo(cx, y - h); c.lineTo(cx + w / 2 + 2, y); c.closePath(); c.fill();
    c.save(); c.clip(); c.strokeStyle = rgba(mix(col, "#000", 0.5), 0.5); c.lineWidth = 0.5;
    for (let k = 3; k < h; k += 3) { const ww = (w + 4) * (k / h); c.beginPath(); for (let xx = -ww / 2; xx < ww / 2; xx += 3) c.arc(cx + xx + 1.5, y - h + k, 1.5, 0, Math.PI); c.stroke(); }
    c.restore();
    c.fillStyle = "#8a7a5a"; c.fillRect(cx - 0.4, y - h - 6, 0.8, 6); c.beginPath(); c.arc(cx, y - h - 6, 1, 0, TAU); c.fill();
    if (R() < 0.7) o.flags.push({ x: cx, y: y - h - 6, len: 8 + R() * 8, col: o.pal.banner[(R() * o.pal.banner.length) | 0], ph: R() * 6 });
  }
  function crenels(o, x, y, w, col, step) {
    const { c } = o; step = step || 5;
    c.fillStyle = mix(col, "#000", 0.2); c.fillRect(x - 1, y, w + 2, 2.5);
    c.fillStyle = col; for (let xx = x - 1; xx < x + w; xx += step) c.fillRect(xx, y - 3.5, step * 0.55, 3.5);
    c.fillStyle = "rgba(0,0,0,.3)"; for (let xx = x; xx < x + w; xx += 3) c.fillRect(xx, y + 2.5, 1.6, 2);
  }
  function tower(o, x, base, w, h, col, kind) {
    const { c, R } = o; const top = base - h;
    shadeBody(o, x, top, w, h, col); stoneTex(o, x, top, w, h, col, w > 20 ? 5 : 4);
    /* Strebepfeiler und Gesimse */
    c.fillStyle = rgba(mix(col, "#000", 0.45), 0.6); for (let yy = top + 18; yy < base - 6; yy += 24 + R() * 14) c.fillRect(x - 1, yy, w + 2, 1.4);
    /* Fenster */
    const cols = w > 26 ? 2 : 1;
    for (let yy = top + 10; yy < base - 14; yy += 15 + R() * 8) for (let k = 0; k < cols; k++) {
      const ww = Math.max(2.5, w * (cols > 1 ? 0.16 : 0.24)), xx = x + (cols > 1 ? w * (0.26 + k * 0.36) : w / 2 - ww / 2);
      if (R() < 0.18) { c.fillStyle = "#0c080c"; c.fillRect(xx + ww / 2 - 0.5, yy, 1, 6); continue; }
      archWin(o, xx, yy, ww, ww * 2, R() < o.pal.lit);
    }
    /* Erker */
    if (h > 90 && R() < 0.5) { const ey = top + h * (0.3 + R() * 0.3), ex = R() < 0.5 ? x - 6 : x + w - 2; c.fillStyle = mix(col, "#000", 0.2); c.fillRect(ex, ey, 8, 12); c.beginPath(); c.moveTo(ex, ey + 12); c.lineTo(ex + 4, ey + 18); c.lineTo(ex + 8, ey + 12); c.fill(); roofCone(o, ex + 4, ey, 8, 9, o.pal.roof); archWin(o, ex + 2.5, ey + 3, 3, 6, R() < 0.6); }
    /* Efeu */
    if (o.pal.ivy && R() < 0.6) { c.fillStyle = o.pal.ivy; const ih = h * (0.2 + R() * 0.4); for (let i = 0; i < ih * 1.4; i++) { const yy = base - R() * ih; c.globalAlpha = 0.7; c.beginPath(); c.arc(x + R() * w * 0.6, yy, 0.8 + R() * 1.6, 0, TAU); c.fill(); } c.globalAlpha = 1; }
    /* Kopf */
    kind = kind || (R() < 0.6 ? "cone" : "cren");
    if (kind === "cone") { c.fillStyle = mix(col, "#000", 0.25); c.fillRect(x - 2, top, w + 4, 4); for (let xx = x - 2; xx < x + w + 2; xx += 3) { c.fillStyle = "rgba(0,0,0,.4)"; c.fillRect(xx, top + 4, 1.5, 2); } roofCone(o, x + w / 2, top, w, w * (1.1 + R() * 0.9), o.pal.roof); }
    else if (kind === "spire") { roofCone(o, x + w / 2, top, w, w * 3.2, o.pal.roof); }
    else if (kind === "dome") { c.fillStyle = o.pal.roof; c.beginPath(); c.arc(x + w / 2, top, w / 2 + 1, Math.PI, 0); c.fill(); c.fillStyle = "rgba(255,255,255,.12)"; c.beginPath(); c.arc(x + w / 2 - w * 0.15, top - w * 0.2, w * 0.15, 0, TAU); c.fill(); }
    else { c.fillStyle = mix(col, "#000", 0.25); c.fillRect(x - 3, top - 2, w + 6, 5); crenels(o, x - 3, top - 2, w + 6, col, 4.5); if (R() < 0.5) o.flags.push({ x: x + w / 2, y: top - 14, len: 10 + R() * 8, col: o.pal.banner[(R() * o.pal.banner.length) | 0], ph: R() * 6, pole: 12 }); if (R() < 0.4) o.glows.push({ x: x + w / 2, y: top - 6, r: 10, col: "#ff9a3a", ph: R() * 9 }); }
    c.fillStyle = "rgba(0,0,0,.25)"; c.fillRect(x + w - 1, top, 1, h);
  }
  function wall(o, x, w, top, base, col, gate) {
    const { c, R } = o;
    shadeBody(o, x, top, w, base - top, mix(col, "#000", 0.08)); stoneTex(o, x, top, w, base - top, col, 4);
    crenels(o, x, top, w, col);
    if (gate) {
      const gx = x + w / 2 - 9, gy = base - 22; c.fillStyle = "#0a0608"; c.beginPath(); c.moveTo(gx, base); c.lineTo(gx, gy + 9); c.arc(gx + 9, gy + 9, 9, Math.PI, 0); c.lineTo(gx + 18, base); c.fill();
      c.strokeStyle = "rgba(120,100,80,.7)"; c.lineWidth = 0.6; for (let k = 2; k < 18; k += 3) { c.beginPath(); c.moveTo(gx + k, gy + 2); c.lineTo(gx + k, base - 6); c.stroke(); } for (let k = gy + 6; k < base - 6; k += 3) { c.beginPath(); c.moveTo(gx + 1, k); c.lineTo(gx + 17, k); c.stroke(); }
      o.glows.push({ x: gx - 4, y: gy + 4, r: 9, col: "#ff9a3a", ph: R() * 9 }); o.glows.push({ x: gx + 22, y: gy + 4, r: 9, col: "#ff9a3a", ph: R() * 9 });
    }
    for (let xx = x + 8; xx < x + w - 8; xx += 14 + R() * 20) if (R() < 0.3) { c.fillStyle = "#0c080c"; c.fillRect(xx, top + 8 + R() * 10, 1.2, 5); }
  }
  function house(o, x, base, w, h, col) {
    const { c, R } = o;
    shadeBody(o, x, base - h, w, h, col);
    c.strokeStyle = rgba(mix(col, "#000", 0.6), 0.8); c.lineWidth = 0.7; /* Fachwerk */
    c.strokeRect(x + 0.5, base - h + 0.5, w - 1, h - 1); for (let xx = x + 5; xx < x + w - 2; xx += 6) { c.beginPath(); c.moveTo(xx, base - h); c.lineTo(xx, base); c.stroke(); }
    c.beginPath(); c.moveTo(x, base - h * 0.5); c.lineTo(x + w, base - h * 0.5); c.stroke();
    for (let xx = x + 2; xx < x + w - 4; xx += 6) archWin(o, xx + 0.8, base - h + 3, 2.5, 4, R() < o.pal.lit * 0.9);
    const rh = h * (0.7 + R() * 0.5); c.fillStyle = o.pal.roof2 || o.pal.roof; c.beginPath(); c.moveTo(x - 2, base - h); c.lineTo(x + w / 2, base - h - rh); c.lineTo(x + w + 2, base - h); c.fill();
    c.fillStyle = "rgba(255,255,255,.08)"; c.beginPath(); c.moveTo(x - 2, base - h); c.lineTo(x + w / 2, base - h - rh); c.lineTo(x + w / 2, base - h); c.fill();
    if (R() < 0.7) { const chx = x + w * (0.6 + R() * 0.2), chy = base - h - rh * 0.55; c.fillStyle = mix(col, "#000", 0.35); c.fillRect(chx, chy - 6, 3, 8); o.smoke.push({ x: chx + 1.5, y: chy - 6, ph: R() * 10, s: 0.6 + R() * 0.5 }); }
  }
  function hills(o, base, amp, col, seed, step) {
    const { c } = o; c.fillStyle = col; c.beginPath(); c.moveTo(0, base + 200);
    for (let x = 0; x <= PW; x += step || 8) { const y = base - amp * (0.5 + 0.3 * Math.sin(x / PW * TAU * 2 + seed) + 0.2 * Math.sin(x / PW * TAU * 7 + seed * 3)); c.lineTo(x, y); }
    c.lineTo(PW, base + 200); c.closePath(); c.fill();
  }
  function pines(o, base, n, col, hmin, hmax) {
    const { c, R } = o; c.fillStyle = col;
    for (let i = 0; i < n; i++) { const x = R() * PW, h = hmin + R() * (hmax - hmin), w = h * 0.36; c.beginPath(); for (let k = 0; k < 4; k++) { const yy = base - h + k * h * 0.22; c.moveTo(x, yy); c.lineTo(x - w * (0.35 + k * 0.22), yy + h * 0.3); c.lineTo(x + w * (0.35 + k * 0.22), yy + h * 0.3); } c.fill(); c.fillRect(x - 0.6, base - 3, 1.2, 4); }
  }
  function mist(o, y, h, col, a) { const { c } = o; const g = c.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, rgba(col, 0)); g.addColorStop(0.5, rgba(col, a)); g.addColorStop(1, rgba(col, 0)); c.fillStyle = g; c.fillRect(0, y, PW, h); }
  function arcade(o, x, base, w, h, n, col, lit) {
    const { c } = o; const aw = w / n;
    shadeBody(o, x, base - h, w, h, col); stoneTex(o, x, base - h, w, h, col, 4);
    for (let i = 0; i < n; i++) { const ax = x + i * aw + aw * 0.18, ww = aw * 0.64; c.fillStyle = lit ? rgba(lit, 0.35) : "#0a0608"; c.beginPath(); c.moveTo(ax, base); c.lineTo(ax, base - h * 0.62 + ww / 2); c.arc(ax + ww / 2, base - h * 0.62 + ww / 2, ww / 2, Math.PI, 0); c.lineTo(ax + ww, base); c.fill(); }
  }
  function statue(o, x, base, s, col) {
    const { c } = o; c.fillStyle = col;
    c.fillRect(x - 5 * s, base - 6 * s, 10 * s, 6 * s); /* Sockel */
    c.beginPath(); c.moveTo(x - 3 * s, base - 6 * s); c.lineTo(x - 2.4 * s, base - 20 * s); c.lineTo(x + 2.4 * s, base - 20 * s); c.lineTo(x + 3 * s, base - 6 * s); c.fill();
    c.beginPath(); c.arc(x, base - 22.5 * s, 2.4 * s, 0, TAU); c.fill();
    c.fillRect(x + 2.4 * s, base - 30 * s, 0.9 * s, 26 * s); /* Speer/Schwert */
    c.fillStyle = "rgba(255,255,255,.1)"; c.fillRect(x - 2.4 * s, base - 20 * s, 1.2 * s, 14 * s);
  }
  function gearStatic(o, x, y, r, col) { o.gears.push({ x, y, r, col, sp: (o.R() < 0.5 ? -1 : 1) * (0.2 + o.R() * 0.5) * (12 / r), teeth: Math.max(8, Math.round(r * 0.9)) }); }
  function stalactites(o, n, col, maxH) { const { c, R } = o; c.fillStyle = col; for (let i = 0; i < n; i++) { const x = R() * PW, w = 4 + R() * 12, h = 10 + R() * maxH; c.beginPath(); c.moveTo(x - w / 2, 0); c.lineTo(x, h); c.lineTo(x + w / 2, 0); c.fill(); } }
  function mushroom(o, x, base, h, cap, glow) { const { c } = o; c.fillStyle = "#3a2e34"; c.fillRect(x - h * 0.06, base - h, h * 0.12, h); c.fillStyle = cap; c.beginPath(); c.ellipse(x, base - h, h * 0.35, h * 0.16, 0, Math.PI, 0); c.fill(); c.fillStyle = "rgba(255,255,255,.25)"; for (let k = 0; k < 4; k++) c.fillRect(x - h * 0.2 + k * h * 0.12, base - h - h * 0.08, 1, 1); o.glows.push({ x, y: base - h, r: h * 0.5, col: glow, ph: o.R() * 9, soft: true }); }
  function ship(o, x, base, s, col, sail) {
    const { c, R } = o;
    c.fillStyle = col; c.beginPath(); c.moveTo(x - 30 * s, base - 8 * s); c.lineTo(x + 34 * s, base - 8 * s); c.lineTo(x + 26 * s, base); c.lineTo(x - 24 * s, base); c.closePath(); c.fill();
    c.fillRect(x - 30 * s, base - 14 * s, 12 * s, 6 * s);
    for (let k = 0; k < 4; k++) archWin(o, x - 18 * s + k * 9 * s, base - 6 * s, 2, 2.5, R() < 0.5);
    for (const [mx, mh] of [[-12, 46], [6, 56], [22, 36]]) {
      c.fillStyle = mix(col, "#000", 0.2); c.fillRect(x + mx * s - 0.6, base - 8 * s - mh * s, 1.2, mh * s);
      c.fillStyle = sail; for (const [sy, sw] of [[0.25, 13], [0.55, 16]]) { c.beginPath(); const yy = base - 8 * s - mh * s * (1 - sy); c.moveTo(x + mx * s - sw * s / 2, yy); c.quadraticCurveTo(x + mx * s, yy + 10 * s, x + mx * s + sw * s / 2, yy); c.lineTo(x + mx * s + sw * s / 2, yy + 12 * s); c.quadraticCurveTo(x + mx * s, yy + 16 * s, x + mx * s - sw * s / 2, yy + 12 * s); c.fill(); }
      o.flags.push({ x: x + mx * s, y: base - 8 * s - mh * s, len: 7, col: o.pal.banner[0], ph: R() * 6 });
    }
    c.strokeStyle = rgba(col, 0.6); c.lineWidth = 0.4; c.beginPath(); c.moveTo(x - 30 * s, base - 12 * s); c.lineTo(x - 12 * s, base - 54 * s); c.lineTo(x + 6 * s, base - 64 * s); c.lineTo(x + 22 * s, base - 44 * s); c.lineTo(x + 40 * s, base - 10 * s); c.stroke();
    o.lights.push({ x: x + 34 * s, y: base - 12 * s, r: 8, col: "#ffcf7a", ph: R() * 9 });
  }

  /* ---------- Seiten je Gebiet ---------- */
  function castleCluster(o, cx, base, scale, col) {
    const { R } = o;
    wall(o, cx - 150 * scale, 300 * scale, base - 50 * scale, base, col, true);
    const n = 6 + (R() * 4 | 0);
    for (let i = 0; i < n; i++) {
      const w = (12 + R() * 16) * scale, h = (80 + R() * 150) * scale, x = cx - 160 * scale + (i / (n - 1)) * 320 * scale - w / 2 + (R() - 0.5) * 20;
      tower(o, x, base - (R() < 0.3 ? 10 : 0), w, h, mix(col, "#000", R() * 0.15), R() < 0.15 ? "spire" : null);
    }
    /* Bergfried */
    tower(o, cx - 22 * scale, base, 44 * scale, 220 * scale, mix(col, "#fff", 0.04), "cren");
    tower(o, cx - 8 * scale, base - 220 * scale, 16 * scale, 50 * scale, col, "spire");
    /* Brücke zwischen zwei Türmen */
    const by = base - 120 * scale; o.c.fillStyle = mix(col, "#000", 0.2); o.c.fillRect(cx - 110 * scale, by, 80 * scale, 4); for (let k = 0; k < 4; k++) { o.c.fillStyle = "#0a0608"; o.c.beginPath(); o.c.arc(cx - 100 * scale + k * 20 * scale, by + 10, 7 * scale, Math.PI, 0); o.c.fill(); }
  }
  const PAGES = {
    castle(o, H) {
      const { c, R, pal } = o;
      hills(o, H * 0.62, 70, mix(pal.sky1, "#000", 0.25), 1.3, 6); pines(o, H * 0.64, 60, mix(pal.sky1, "#000", 0.35), 10, 24);
      mist(o, H * 0.5, 60, pal.sky2, 0.4);
      castleCluster(o, 420, H * 0.78, 1, pal.stone); castleCluster(o, 1180, H * 0.8, 0.8, mix(pal.stone, pal.sky1, 0.3));
      mist(o, H * 0.7, 70, pal.sky2, 0.35);
      for (let x = 0; x < PW; x += 26 + R() * 30) house(o, x, H * 0.95, 14 + R() * 14, 12 + R() * 10, mix(pal.stone, "#5a4030", 0.4));
      pines(o, H * 1.0, 50, mix(pal.sky1, "#000", 0.55), 14, 30);
    },
    ramparts(o, H) {
      const { c, R, pal } = o;
      hills(o, H * 0.55, 90, mix(pal.sky1, "#000", 0.2), 0.4, 6); hills(o, H * 0.68, 50, mix(pal.sky1, "#000", 0.35), 2.2, 5);
      /* Fluss im Tal mit Mondspiegelung */
      c.fillStyle = rgba(mix(pal.sky2, "#fff", 0.3), 0.25); c.beginPath(); c.moveTo(0, H * 0.74); for (let x = 0; x <= PW; x += 16) c.lineTo(x, H * 0.74 + Math.sin(x / 140) * 8); c.lineTo(PW, H * 0.78); for (let x = PW; x >= 0; x -= 16) c.lineTo(x, H * 0.78 + Math.sin(x / 140) * 8); c.fill();
      for (let i = 0; i < 5; i++) { const x = 140 + i * 300 + R() * 80; c.fillStyle = mix(pal.sky1, "#000", 0.4); c.fillRect(x - 3, H * 0.66 - 22, 6, 22); c.beginPath(); c.moveTo(x - 5, H * 0.66 - 22); c.lineTo(x, H * 0.66 - 30); c.lineTo(x + 5, H * 0.66 - 22); c.fill(); o.gears.push({ x, y: H * 0.66 - 22, r: 14, col: mix(pal.sky1, "#000", 0.45), sp: 0.4, mill: true }); }
      /* Mauerzug in die Tiefe */
      for (let k = 0; k < 3; k++) { const base = H * (0.78 + k * 0.08), sc = 0.6 + k * 0.25, col = mix(pal.stone, pal.sky1, 0.45 - k * 0.15); let x = -40 + k * 90; while (x < PW) { const w = (90 + R() * 120) * sc; wall(o, x, w, base - 34 * sc, base + 40, col, R() < 0.2); tower(o, x + w - 8 * sc, base + 4, 20 * sc, (60 + R() * 70) * sc, col, R() < 0.5 ? "cren" : "cone"); x += w + 12 * sc; } mist(o, base - 10, 40, pal.sky2, 0.25); }
    },
    spires(o, H) {
      const { c, R, pal } = o;
      mist(o, H * 0.7, 120, mix(pal.sky2, "#fff", 0.2), 0.55);
      for (let i = 0; i < 14; i++) { const x = R() * PW, w = 10 + R() * 22, h = 160 + R() * 220; tower(o, x, H * 1.05, w, h, mix(pal.stone, pal.sky1, 0.2 + R() * 0.3), R() < 0.5 ? "spire" : "cren"); if (R() < 0.5) { const bx = x + w, by = H * 1.05 - h * (0.4 + R() * 0.3), bw = 30 + R() * 60; c.fillStyle = mix(pal.stone, "#000", 0.3); c.fillRect(bx, by, bw, 3); c.beginPath(); c.moveTo(bx, by + 3); c.quadraticCurveTo(bx + bw / 2, by + 16, bx + bw, by + 3); c.lineTo(bx + bw, by + 6); c.quadraticCurveTo(bx + bw / 2, by + 19, bx, by + 6); c.fill(); } }
      /* schwebende Felsen */
      for (let i = 0; i < 8; i++) { const x = R() * PW, y = H * (0.2 + R() * 0.4), w = 20 + R() * 30; c.fillStyle = mix(pal.stone, "#000", 0.35); c.beginPath(); c.moveTo(x - w / 2, y); c.lineTo(x + w / 2, y); c.lineTo(x + w * 0.1, y + w * 0.8); c.closePath(); c.fill(); c.fillStyle = pal.ivy || "#3a4a2a"; c.fillRect(x - w / 2, y - 2, w, 2.5); if (R() < 0.6) tower(o, x - 4, y, 8, 20 + R() * 20, pal.stone, "cone"); }
      mist(o, H * 0.85, 120, mix(pal.sky2, "#fff", 0.25), 0.6);
    },
    storm(o, H) {
      const { c, R, pal } = o;
      hills(o, H * 0.8, 60, mix(pal.sky1, "#000", 0.3), 4.1, 7);
      for (let i = 0; i < 10; i++) { const x = R() * PW, w = 14 + R() * 18, h = 100 + R() * 170; tower(o, x, H * 0.95, w, h, mix(pal.stone, pal.sky1, 0.3), "cren"); /* abgebrochen */ c.fillStyle = mix(pal.sky1, "#000", 0.1); c.beginPath(); c.moveTo(x - 4, H * 0.95 - h - 6); c.lineTo(x + w * R(), H * 0.95 - h + 10 + R() * 14); c.lineTo(x + w + 4, H * 0.95 - h - 6); c.fill(); c.fillStyle = "#6a6058"; c.fillRect(x + w / 2 - 0.5, H * 0.95 - h - 20, 1, 20); o.glows.push({ x: x + w / 2, y: H * 0.95 - h - 20, r: 8, col: "#c8ff8a", ph: R() * 9, zap: true }); }
      mist(o, H * 0.75, 100, "#5a7a3a", 0.25);
    },
    harbour(o, H) {
      const { c, R, pal } = o;
      c.fillStyle = mix(pal.sky1, "#000", 0.3); c.fillRect(0, H * 0.8, PW, H * 0.3);
      for (let y = H * 0.8; y < H; y += 3) { c.fillStyle = rgba(mix(pal.sky2, "#fff", 0.3), 0.06 + R() * 0.06); c.fillRect(R() * PW, y, 20 + R() * 60, 1); }
      castleCluster(o, 1150, H * 0.8, 0.6, mix(pal.stone, pal.sky1, 0.35));
      /* Leuchtturm */
      const lx = 260; tower(o, lx - 10, H * 0.82, 20, 150, "#c8bca8", "dome"); c.fillStyle = "#3a2a2a"; for (let yy = H * 0.82 - 140; yy < H * 0.82; yy += 22) c.fillRect(lx - 10, yy, 20, 6);
      o.beams.push({ x: lx, y: H * 0.82 - 156, len: 240 });
      o.glows.push({ x: lx, y: H * 0.82 - 156, r: 22, col: "#ffe0a0", ph: 0 });
      /* Lagerhäuser mit Kränen */
      for (let x = 420; x < 900; x += 60 + R() * 30) { house(o, x, H * 0.82, 40 + R() * 20, 26 + R() * 14, mix(pal.stone, "#6a4a30", 0.4)); if (R() < 0.6) { c.strokeStyle = "#2a1e1a"; c.lineWidth = 1.5; c.beginPath(); c.moveTo(x + 10, H * 0.82 - 40); c.lineTo(x + 10, H * 0.82 - 70); c.lineTo(x + 40, H * 0.82 - 66); c.stroke(); c.lineWidth = 0.5; c.beginPath(); c.moveTo(x + 38, H * 0.82 - 66); c.lineTo(x + 38, H * 0.82 - 46); c.stroke(); c.fillStyle = "#5a3a20"; c.fillRect(x + 35, H * 0.82 - 46, 6, 5); } }
      ship(o, 620, H * 0.86, 1.1, mix(pal.stone, "#3a2418", 0.6), "#d8ccb0"); ship(o, 1380, H * 0.84, 0.8, mix(pal.stone, "#3a2418", 0.7), "#c8b8a0"); ship(o, 980, H * 0.83, 0.55, mix(pal.sky1, "#000", 0.2), mix(pal.sky2, "#fff", 0.2));
      /* Stege */
      c.fillStyle = "#3a2a1e"; for (let x = 0; x < PW; x += 180) { c.fillRect(x, H * 0.86, 120, 3); for (let k = 0; k < 120; k += 12) c.fillRect(x + k, H * 0.86, 2, 20); }
    },
    /* Innen: tiefe Gewölbe, durch Fenster und Bögen sichtbar */
    halls(o, H) {
      const { c, R, pal } = o;
      for (let d = 0; d < 3; d++) {
        const sc = 0.55 + d * 0.25, base = H * (0.8 + d * 0.07), col = mix(pal.stone, pal.sky1, 0.5 - d * 0.18);
        arcade(o, 0, base, PW, 150 * sc, Math.round(PW / (70 * sc)), col, d < 2 ? "#ffb060" : null);
        for (let x = 20; x < PW; x += 70 * sc * 2) { statue(o, x, base, sc * 1.6, mix(col, "#000", 0.3)); }
        mist(o, base - 40, 60, pal.sky2, 0.25);
      }
      /* bunte Glasfenster und Kronleuchter */
      for (let i = 0; i < 8; i++) {
        const x = 90 + i * 190 + R() * 30, y = H * 0.18, w = 26, h = 60;
        c.fillStyle = "#1a1014"; c.beginPath(); c.moveTo(x - 2, y + h + 2); c.lineTo(x - 2, y + w / 2); c.arc(x + w / 2, y + w / 2, w / 2 + 2, Math.PI, 0); c.lineTo(x + w + 2, y + h + 2); c.fill();
        const cols = ["#c83a3a", "#e8b040", "#7ac04a", "#a050c0", "#e07a30"];
        for (let yy = 0; yy < h; yy += 5) for (let xx = 0; xx < w; xx += 5) { const dy = y + w / 2 - (y + yy), dx = x + w / 2 - (x + xx); if (yy < w / 2 && dx * dx + dy * dy > (w / 2) * (w / 2)) continue; c.fillStyle = cols[(R() * cols.length) | 0]; c.globalAlpha = 0.75; c.fillRect(x + xx + 0.5, y + yy + 0.5, 4, 4); }
        c.globalAlpha = 1; o.lights.push({ x: x + w / 2, y: y + h / 2, r: 30, col: "#ffb070", ph: R() * 9, soft: true });
        o.flags.push({ x: x + w / 2 + 95, y: y + 10, chand: true, ph: R() * 6 });
      }
      /* Freitreppe */
      const sx = 700; for (let k = 0; k < 14; k++) { c.fillStyle = mix(pal.stone, "#000", 0.1 + k * 0.02); c.fillRect(sx - 60 + k * 4, H * 0.92 - k * 6, 120 - k * 8, 6); } c.fillStyle = "#7a1a20"; c.fillRect(sx - 12, H * 0.92 - 84, 24, 84);
    },
    cellar(o, H) {
      const { c, R, pal } = o;
      for (let d = 0; d < 2; d++) {
        const sc = 0.7 + d * 0.3, base = H * (0.86 + d * 0.06), col = mix(pal.stone, pal.sky1, 0.45 - d * 0.2);
        arcade(o, 0, base, PW, 120 * sc, Math.round(PW / (90 * sc)), col, null);
        /* Fassregale */
        for (let x = 10; x < PW; x += 90 * sc) {
          const rx = x + 14 * sc; c.fillStyle = "#3a2618"; c.fillRect(rx, base - 50 * sc, 1.5, 50 * sc); c.fillRect(rx + 50 * sc, base - 50 * sc, 1.5, 50 * sc);
          for (let r = 0; r < 3; r++) for (let k = 0; k < 4; k++) { const bx = rx + 7 * sc + k * 12 * sc, by = base - 8 * sc - r * 16 * sc; c.fillStyle = mix("#6a4428", "#000", d * 0.2 + R() * 0.15); c.beginPath(); c.ellipse(bx, by, 6 * sc, 7 * sc, 0, 0, TAU); c.fill(); c.strokeStyle = "#2a1a10"; c.lineWidth = 0.8; c.beginPath(); c.ellipse(bx, by, 4 * sc, 5 * sc, 0, 0, TAU); c.stroke(); c.fillStyle = "#1a0e08"; c.beginPath(); c.arc(bx, by, 1, 0, TAU); c.fill(); }
        }
        mist(o, base - 30, 50, pal.sky2, 0.3);
      }
      for (let i = 0; i < 12; i++) { const x = R() * PW, y = H * (0.3 + R() * 0.3); c.strokeStyle = "#2a2018"; c.lineWidth = 0.5; c.beginPath(); c.moveTo(x, 0); c.lineTo(x, y); c.stroke(); c.fillStyle = "#7a4a2a"; c.beginPath(); c.ellipse(x, y + 7, 4, 8, 0, 0, TAU); c.fill(); }
      for (let i = 0; i < 10; i++) o.glows.push({ x: R() * PW, y: H * (0.55 + R() * 0.25), r: 22, col: "#ffa050", ph: R() * 9 });
    },
    dungeon(o, H) {
      const { c, R, pal } = o;
      for (let d = 0; d < 2; d++) {
        const sc = 0.7 + d * 0.3, base = H * (0.84 + d * 0.07), col = mix(pal.stone, pal.sky1, 0.45 - d * 0.2);
        shadeBody(o, 0, base - 130 * sc, PW, 130 * sc, col); stoneTex(o, 0, base - 130 * sc, PW, 130 * sc, col, 4);
        for (let x = 20; x < PW; x += 70 * sc) {
          const w = 44 * sc, h = 60 * sc; c.fillStyle = "#070506"; c.fillRect(x, base - h, w, h);
          if (R() < 0.35) { o.glows.push({ x: x + w / 2, y: base - h * 0.5, r: 16, col: "#ff9040", ph: R() * 9 }); }
          if (R() < 0.4) { c.fillStyle = mix(col, "#000", 0.4); const sx = x + 8 + R() * (w - 16); c.beginPath(); c.arc(sx, base - 14 * sc, 3 * sc, 0, TAU); c.fill(); c.fillRect(sx - 3 * sc, base - 11 * sc, 6 * sc, 9 * sc); }
          c.fillStyle = "#3a3430"; for (let k = 2; k < w; k += 5 * sc) c.fillRect(x + k, base - h, 1.2, h); c.fillRect(x, base - h + 6, w, 1.5); c.fillRect(x, base - 10, w, 1.5);
        }
        mist(o, base - 40, 60, "#3a4a2a", 0.25);
      }
      /* hängende Käfige und Ketten */
      for (let i = 0; i < 9; i++) { const x = R() * PW, y = H * (0.2 + R() * 0.25); c.strokeStyle = "#3a3430"; c.lineWidth = 0.8; c.setLineDash([2, 1]); c.beginPath(); c.moveTo(x, 0); c.lineTo(x, y); c.stroke(); c.setLineDash([]); c.strokeStyle = "#4a4440"; c.beginPath(); c.ellipse(x, y + 12, 8, 12, 0, 0, TAU); c.stroke(); for (let k = -6; k <= 6; k += 3) { c.beginPath(); c.moveTo(x + k, y + 1); c.lineTo(x + k, y + 23); c.stroke(); } if (R() < 0.5) { c.fillStyle = "#d8d0c0"; c.beginPath(); c.arc(x, y + 9, 2, 0, TAU); c.fill(); c.fillRect(x - 0.5, y + 11, 1, 6); } }
    },
    belltower(o, H) {
      const { c, R, pal } = o;
      shadeBody(o, 0, 0, PW, H, mix(pal.stone, pal.sky1, 0.5)); stoneTex(o, 0, 0, PW, H, mix(pal.stone, pal.sky1, 0.5), 6);
      for (let i = 0; i < 16; i++) gearStatic(o, R() * PW, H * (0.1 + R() * 0.8), 12 + R() * 40, mix("#8a6a3a", "#000", 0.2 + R() * 0.4));
      /* Glocken */
      for (let i = 0; i < 5; i++) { const x = 140 + i * 300 + R() * 60, y = H * (0.2 + R() * 0.25), s = 0.7 + R() * 0.6; c.strokeStyle = "#2a1e14"; c.lineWidth = 2; c.beginPath(); c.moveTo(x, 0); c.lineTo(x, y - 18 * s); c.stroke(); o.flags.push({ x, y, bell: true, s, ph: R() * 6 }); }
      /* Zifferblatt */
      const cx = 760, cy = H * 0.5; c.fillStyle = "#d8ccb0"; c.beginPath(); c.arc(cx, cy, 46, 0, TAU); c.fill(); c.strokeStyle = "#3a2a1a"; c.lineWidth = 3; c.stroke(); c.fillStyle = "#3a2a1a"; for (let k = 0; k < 12; k++) { const a = k / 12 * TAU; c.fillRect(cx + Math.cos(a) * 38 - 1.5, cy + Math.sin(a) * 38 - 1.5, 3, 3); }
      o.gears.push({ x: cx, y: cy, r: 34, clock: true, sp: 0.05 });
      for (let i = 0; i < 20; i++) { const x = R() * PW; c.strokeStyle = "rgba(60,44,30,.8)"; c.lineWidth = 0.8; c.beginPath(); c.moveTo(x, 0); c.lineTo(x + (R() - 0.5) * 30, H); c.stroke(); }
    },
    forge(o, H) {
      const { c, R, pal } = o;
      for (let d = 0; d < 2; d++) {
        const sc = 0.7 + d * 0.3, base = H * (0.86 + d * 0.06), col = mix(pal.stone, pal.sky1, 0.45 - d * 0.2);
        for (let x = 30; x < PW; x += 150 * sc) {
          const w = 70 * sc, h = 90 * sc; shadeBody(o, x, base - h, w, h, col); stoneTex(o, x, base - h, w, h, col, 4);
          c.fillStyle = mix(col, "#000", 0.2); c.fillRect(x + w * 0.3, 0, w * 0.4, base - h);
          c.fillStyle = "#1a0804"; c.beginPath(); c.arc(x + w / 2, base - h * 0.35, w * 0.28, Math.PI, 0); c.lineTo(x + w * 0.78, base - 4); c.lineTo(x + w * 0.22, base - 4); c.fill();
          o.glows.push({ x: x + w / 2, y: base - h * 0.3, r: w * 0.6, col: "#ff6a1a", ph: R() * 9, forge: true });
          c.fillStyle = "#2a2626"; c.fillRect(x + w + 10 * sc, base - 14 * sc, 24 * sc, 6 * sc); c.fillRect(x + w + 16 * sc, base - 8 * sc, 12 * sc, 8 * sc);
          o.smoke.push({ x: x + w / 2, y: base - h - 2, ph: R() * 9, s: 1.4 });
        }
      }
      for (let i = 0; i < 7; i++) { const x = R() * PW, y = H * (0.2 + R() * 0.3), r = 16 + R() * 20; o.glows.push({ x, y, r, col: "#ffb040", ph: R() * 9, rune: true }); }
    },
    chasm(o, H) {
      const { c, R, pal } = o;
      stalactites(o, 70, mix(pal.stone, "#000", 0.25), 90);
      for (let i = 0; i < 6; i++) { const x = R() * PW, y = H * (0.25 + R() * 0.4), r = 40 + R() * 70; c.strokeStyle = "rgba(220,210,230,.22)"; c.lineWidth = 0.5; for (let k = 0; k < 10; k++) { const a = k / 10 * TAU; c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); c.stroke(); } for (let rr = 8; rr < r; rr += 8) { c.beginPath(); for (let k = 0; k <= 10; k++) { const a = k / 10 * TAU; const px = x + Math.cos(a) * rr, py = y + Math.sin(a) * rr; k ? c.lineTo(px, py) : c.moveTo(px, py); } c.stroke(); } }
      hills(o, H * 0.95, 60, mix(pal.stone, "#000", 0.3), 2.2, 5);
      for (let i = 0; i < 40; i++) mushroom(o, R() * PW, H * (0.9 + R() * 0.08), 8 + R() * 30, R() < 0.5 ? "#8a4ac0" : "#c86ad0", R() < 0.5 ? "#c080ff" : "#ff8ae0");
      /* zerbrochene Hängebrücken */
      for (let i = 0; i < 3; i++) { const x = 200 + i * 500, y = H * 0.5 + R() * 40; c.strokeStyle = "#5a4a3a"; c.lineWidth = 0.8; c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + 80, y + 30, x + 140, y + 5); c.stroke(); for (let k = 0; k < 14; k++) { const t = k / 14; c.fillStyle = "#4a3828"; c.fillRect(x + t * 140, y + 30 * 2 * t * (1 - t) * 0.9 + 1 - t * 4, 6, 1.6); } }
    },
    lake(o, H) {
      const { c, R, pal } = o;
      stalactites(o, 50, mix(pal.stone, "#000", 0.3), 70);
      /* versunkener Tempel */
      for (let t = 0; t < 2; t++) { const cx = 380 + t * 760, base = H * 0.78; c.fillStyle = mix(pal.stone, pal.sky1, 0.4); c.beginPath(); c.moveTo(cx - 90, base - 70); c.lineTo(cx, base - 110); c.lineTo(cx + 90, base - 70); c.fill(); for (let k = -4; k <= 4; k++) { if (R() < 0.2) continue; const ph = 50 + R() * 20; shadeBody(o, cx + k * 20 - 4, base - ph, 8, ph, mix(pal.stone, pal.sky1, 0.3)); } c.fillStyle = "#0a1410"; c.fillRect(cx - 12, base - 50, 24, 50); o.glows.push({ x: cx, y: base - 30, r: 26, col: "#8aff9a", ph: R() * 9, soft: true }); for (let k = 0; k < 6; k++) statue(o, cx - 130 + k * 52, base, 0.9, mix(pal.stone, "#000", 0.35)); }
      /* Wasserfälle */
      for (let i = 0; i < 4; i++) { const x = 100 + i * 380 + R() * 100; o.falls.push({ x, y: 0, h: H * 0.8, w: 6 + R() * 8 }); }
      c.fillStyle = rgba(mix(pal.sky2, "#fff", 0.15), 0.35); c.fillRect(0, H * 0.78, PW, H * 0.3);
      for (let y = H * 0.78; y < H; y += 2) { c.fillStyle = rgba("#a0d0b0", 0.05 + R() * 0.05); c.fillRect(R() * PW, y, 10 + R() * 40, 0.7); }
    },
    embercity(o, H) {
      const { c, R, pal } = o;
      hills(o, H * 0.6, 40, mix(pal.stone, "#000", 0.4), 3.3, 8);
      for (let k = 0; k < 3; k++) { const base = H * (0.7 + k * 0.1), col = mix(pal.stone, pal.sky1, 0.5 - k * 0.15); for (let x = -10; x < PW; x += 18 + R() * 14) { house(o, x, base, 14 + R() * 12, 16 + R() * 26, col); if (R() < 0.15) tower(o, x, base, 12, 60 + R() * 60, col, "cren"); } mist(o, base - 20, 40, "#ff6a1a", 0.12); }
      /* Glutfluss */
      const g = c.createLinearGradient(0, H * 0.9, 0, H); g.addColorStop(0, "#ff8a2a"); g.addColorStop(1, "#6a1a06"); c.fillStyle = g; c.fillRect(0, H * 0.92, PW, H * 0.1);
      for (let i = 0; i < 12; i++) o.glows.push({ x: R() * PW, y: H * 0.93, r: 30, col: "#ff6a1a", ph: R() * 9 });
    }
  };
  PAGES.camp = PAGES.castle;
  PAGES.passage = PAGES.halls;
  PAGES.hoardbg = PAGES.embercity;
  PAGES.labbg = PAGES.dungeon;

  /* ---------- Seite bauen ---------- */
  let page = null;
  function build() {
    const B = Z.biome, lv = Z.level; if (!B || !lv) { page = null; return; }
    const ak = lv.arena && Z.ARENAS[lv.arena] ? Z.ARENAS[lv.arena].kind : null;
    const kind = ak === "hoard" ? "hoardbg" : ak === "lab" ? "labbg" : ak === "lakeboss" ? "lake" : ak === "towertop" ? "storm" : ak === "pier" ? "harbour" : ak === "tower" ? "ramparts" : B.bg;
    const fn = PAGES[kind]; if (!fn) { page = null; return; }
    const q = Z.gq ? Z.gq.level : 2; if (q === 0) { page = null; return; }
    const H = Math.ceil(Z.cam.h + 120), s = Math.min(G.scale || 1, q >= 3 ? 2 : 1.5);
    const cv = document.createElement("canvas"); cv.width = Math.ceil(PW * s); cv.height = Math.ceil(H * s);
    const c = cv.getContext("2d"); c.scale(s, s);
    const R = Z.Rng(((B.name[0].length * 7919) ^ ((lv.seed || 7) * 31)) >>> 0);
    const pal = {
      sky1: B.sky[1], sky2: B.sky[2], stone: mix(B.tile ? B.tile.base : "#5a5058", B.sky[1], 0.35), roof: mix("#5a2a2a", B.sky[1], 0.3), roof2: mix("#6a3a24", B.sky[1], 0.3),
      banner: ["#a82a2a", "#c8a040", "#7a2a6a", "#2a5a3a"], lit: 0.32, ivy: B.out || kind === "castle" ? "#2a3a22" : null
    };
    const o = P(c, R, pal);
    fn(o, H);
    /* Luftperspektive: zum Himmel hin verblassen */
    const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, rgba(B.sky[1], 0.25)); g.addColorStop(1, rgba(B.sky[2], 0.18)); c.fillStyle = g; c.globalCompositeOperation = "source-atop"; c.fillRect(0, 0, PW, H); c.globalCompositeOperation = "source-over";
    page = { cv, s, H, o, kind, lvRef: lv, q };
  }

  /* ---------- Lebendiges zeichnen ---------- */
  function drawLive(c, ox, oy, t, cam) {
    const o = page.o, vis = (x, y, r) => x + ox > cam.x - r && x + ox < cam.x + cam.w + r && y + oy > cam.y - r && y + oy < cam.y + cam.h + r;
    c.save(); c.translate(ox, oy);
    c.globalCompositeOperation = "lighter";
    for (const l of o.lights) { if (!vis(l.x, l.y, l.r)) continue; const f = 0.75 + 0.25 * Math.sin(t * 3 + l.ph) * Math.sin(t * 7.3 + l.ph * 2); const g = c.createRadialGradient(l.x, l.y, 0, l.x, l.y, l.r); g.addColorStop(0, rgba(l.col, (l.soft ? 0.18 : 0.32) * f)); g.addColorStop(1, rgba(l.col, 0)); c.fillStyle = g; c.fillRect(l.x - l.r, l.y - l.r, l.r * 2, l.r * 2); }
    for (const l of o.glows) {
      if (!vis(l.x, l.y, l.r * 2)) continue;
      let f = 0.7 + 0.3 * Math.sin(t * (l.forge ? 5 : 2.4) + l.ph);
      if (l.zap) f = Math.sin(t * 1.3 + l.ph) > 0.97 ? 2.5 : 0.25;
      const g = c.createRadialGradient(l.x, l.y, 0, l.x, l.y, l.r * (l.rune ? 1 : 1.6)); g.addColorStop(0, rgba(l.col, Math.min(1, 0.4 * f))); g.addColorStop(1, rgba(l.col, 0)); c.fillStyle = g; c.beginPath(); c.arc(l.x, l.y, l.r * 1.6, 0, TAU); c.fill();
      if (l.rune) { c.strokeStyle = rgba(l.col, 0.45 * f); c.lineWidth = 1; c.beginPath(); c.arc(l.x, l.y, l.r * 0.7, 0, TAU); c.stroke(); for (let k = 0; k < 6; k++) { const a = k / 6 * TAU + t * 0.3; c.beginPath(); c.moveTo(l.x + Math.cos(a) * l.r * 0.5, l.y + Math.sin(a) * l.r * 0.5); c.lineTo(l.x + Math.cos(a) * l.r * 0.85, l.y + Math.sin(a) * l.r * 0.85); c.stroke(); } }
    }
    for (const b of o.beams) { const a = t * 0.5, len = b.len; c.fillStyle = "rgba(255,230,170,.06)"; for (const s of [-1, 1]) { const aa = a + (s < 0 ? Math.PI : 0); c.beginPath(); c.moveTo(b.x, b.y); c.lineTo(b.x + Math.cos(aa - 0.07) * len, b.y + Math.sin(aa - 0.07) * len * 0.25); c.lineTo(b.x + Math.cos(aa + 0.07) * len, b.y + Math.sin(aa + 0.07) * len * 0.25); c.closePath(); c.fill(); } }
    c.globalCompositeOperation = "source-over";
    /* Banner, Kronleuchter, Glocken */
    for (const f of o.flags) {
      if (!vis(f.x, f.y, 40)) continue;
      if (f.chand) { const sw = Math.sin(t * 0.7 + f.ph) * 2; c.strokeStyle = "rgba(40,30,20,.9)"; c.lineWidth = 0.6; c.beginPath(); c.moveTo(f.x, 0); c.lineTo(f.x + sw, f.y); c.stroke(); c.fillStyle = "#6a4a20"; c.fillRect(f.x + sw - 12, f.y, 24, 2); for (let k = -10; k <= 10; k += 5) { c.fillStyle = "#e8dcc0"; c.fillRect(f.x + sw + k - 0.6, f.y - 4, 1.2, 4); c.globalCompositeOperation = "lighter"; c.fillStyle = rgba("#ffc060", 0.6 + 0.3 * Math.sin(t * 9 + k)); c.beginPath(); c.arc(f.x + sw + k, f.y - 5, 1.4, 0, TAU); c.fill(); c.globalCompositeOperation = "source-over"; } continue; }
      if (f.bell) { const a = Math.sin(t * 0.9 + f.ph) * 0.25, s = f.s; c.save(); c.translate(f.x, f.y - 18 * s); c.rotate(a); c.fillStyle = "#8a6a2a"; c.beginPath(); c.moveTo(-6 * s, 2 * s); c.quadraticCurveTo(-7 * s, 16 * s, -14 * s, 20 * s); c.lineTo(14 * s, 20 * s); c.quadraticCurveTo(7 * s, 16 * s, 6 * s, 2 * s); c.closePath(); c.fill(); c.fillStyle = "rgba(255,230,160,.25)"; c.fillRect(-5 * s, 4 * s, 2 * s, 14 * s); c.restore(); continue; }
      if (f.pole) { c.fillStyle = "#3a2a1a"; c.fillRect(f.x - 0.4, f.y, 0.8, f.pole); }
      c.fillStyle = f.col; c.beginPath(); c.moveTo(f.x, f.y);
      const n = 6, w = 3.2; for (let k = 0; k <= n; k++) { const u = k / n; c.lineTo(f.x + u * f.len, f.y + Math.sin(t * 4 + f.ph - u * 3) * 1.6 * u); }
      for (let k = n; k >= 0; k--) { const u = k / n; c.lineTo(f.x + u * f.len, f.y + w + Math.sin(t * 4 + f.ph - u * 3) * 1.6 * u - (k === n ? w * 0.5 : 0)); }
      c.fill();
    }
    /* Zahnräder, Windmühlen, Uhr */
    for (const g of o.gears) {
      if (!vis(g.x, g.y, g.r + 6)) continue;
      const a = t * g.sp;
      if (g.mill) { c.strokeStyle = g.col; c.lineWidth = 1.6; for (let k = 0; k < 4; k++) { const aa = a + k * Math.PI / 2; c.beginPath(); c.moveTo(g.x, g.y); c.lineTo(g.x + Math.cos(aa) * g.r, g.y + Math.sin(aa) * g.r); c.stroke(); c.fillStyle = g.col; c.save(); c.translate(g.x, g.y); c.rotate(aa); c.fillRect(g.r * 0.3, 0, g.r * 0.7, 3); c.restore(); } continue; }
      if (g.clock) { c.strokeStyle = "#2a1a10"; c.lineWidth = 2.4; c.beginPath(); c.moveTo(g.x, g.y); c.lineTo(g.x + Math.cos(a * 12 - 1.57) * g.r * 0.85, g.y + Math.sin(a * 12 - 1.57) * g.r * 0.85); c.stroke(); c.lineWidth = 3; c.beginPath(); c.moveTo(g.x, g.y); c.lineTo(g.x + Math.cos(a - 1.57) * g.r * 0.55, g.y + Math.sin(a - 1.57) * g.r * 0.55); c.stroke(); continue; }
      c.save(); c.translate(g.x, g.y); c.rotate(a); c.fillStyle = g.col; c.beginPath();
      for (let k = 0; k < g.teeth; k++) { const a0 = k / g.teeth * TAU, a1 = (k + 0.5) / g.teeth * TAU; c.lineTo(Math.cos(a0) * g.r, Math.sin(a0) * g.r); c.lineTo(Math.cos(a0) * (g.r + 4), Math.sin(a0) * (g.r + 4)); c.lineTo(Math.cos(a1) * (g.r + 4), Math.sin(a1) * (g.r + 4)); c.lineTo(Math.cos(a1) * g.r, Math.sin(a1) * g.r); }
      c.closePath(); c.fill(); c.fillStyle = "rgba(0,0,0,.35)"; c.beginPath(); c.arc(0, 0, g.r * 0.6, 0, TAU); c.fill(); c.fillStyle = g.col; for (let k = 0; k < 4; k++) { c.rotate(Math.PI / 2); c.fillRect(-1.5, 0, 3, g.r * 0.62); } c.beginPath(); c.arc(0, 0, g.r * 0.18, 0, TAU); c.fill(); c.restore();
    }
    /* Rauch */
    for (const s of o.smoke) {
      if (!vis(s.x, s.y - 30, 50)) continue;
      for (let k = 0; k < 6; k++) { const u = ((t * 0.25 * s.s + s.ph + k / 6) % 1), yy = s.y - u * 46, xx = s.x + Math.sin(u * 4 + s.ph) * 4 + u * 14 * (Z.windX ? Math.sign(Z.windX) : 1); c.fillStyle = "rgba(70,60,66," + (0.28 * (1 - u)) + ")"; c.beginPath(); c.arc(xx, yy, 2 + u * 7 * s.s, 0, TAU); c.fill(); }
    }
    /* Wasserfälle */
    for (const f of o.falls) {
      if (!vis(f.x, f.y + f.h / 2, f.h)) continue;
      c.fillStyle = "rgba(180,220,200,.18)"; c.fillRect(f.x, f.y, f.w, f.h);
      c.fillStyle = "rgba(220,240,230,.35)"; for (let k = 0; k < 8; k++) { const yy = ((t * 120 + k * f.h / 8) % f.h); c.fillRect(f.x + (k % 3) * f.w / 3, f.y + yy, 1, 14); }
      c.fillStyle = "rgba(220,240,230,.18)"; c.beginPath(); c.ellipse(f.x + f.w / 2, f.y + f.h, f.w * 2 + Math.sin(t * 5) * 2, 4, 0, 0, TAU); c.fill();
    }
    c.restore();
  }

  /* ---------- Einhängen: zwischen ferner Ebene und Mittelgrund ---------- */
  const life0 = Z.drawBackLife;
  Z.drawBackLife = function (c, cam, t, B, oy, LH) {
    if (life0) life0.apply(this, arguments);
    if (!Z.level) return;
    const q = Z.gq ? Z.gq.level : 2;
    if (!page || page.lvRef !== Z.level || page.q !== q || Math.abs(page.H - Math.ceil(Z.cam.h + 120)) > 2) build();
    if (!page) return;
    const lvH = Z.level.H * Z.TILE;
    const ox = cam.x * (1 - PF), py = cam.y - (cam.y - (lvH - cam.h) * 0.5) * PY - 30;
    const y0 = Math.max(py, cam.y - 2), y1 = Math.min(py + page.H, cam.y + cam.h + 2); if (y1 <= y0) return;
    let x = Math.floor((cam.x - ox) / PW) * PW + ox;
    for (; x < cam.x + cam.w; x += PW) {
      const vx0 = Math.max(x, cam.x - 2), vx1 = Math.min(x + PW, cam.x + cam.w + 2); if (vx1 <= vx0) continue;
      const k = page.s; c.drawImage(page.cv, (vx0 - x) * k, (y0 - py) * k, (vx1 - vx0) * k, (y1 - y0) * k, vx0, y0, vx1 - vx0, y1 - y0);
      if (q >= 1) drawLive(c, x, py, t, cam);
    }
  };
  Z.bilderbuchKinds = Object.keys(PAGES);
})();
