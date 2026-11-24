/* Ezekiel – The Destroyer · Bildpracht
   Lichtstrahlen aus Fenstern mit tanzendem Staub, unscharfe Vordergrund-Silhouetten (Tiefe), Farbstimmung je Gebiet,
   Nachbilder bei Rolle und Sprint. Alles abschaltbar über die Grafikstufen (ab „Hoch“ bzw. Ebenen an). */
(function () {
  "use strict";
  const Z = window.Z, T = Z.TILE;
  const hash = (x, y) => { let h = (x * 374761393 + y * 668265263) ^ 0x5bd1e995; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
  /* weiche Sprites in Bildschirmgröße zwischengespeichert kopieren (bild.js), sonst wie drawImage */
  const DS = (c, s, x, y, w, h) => Z.gfx.drawScaled ? Z.gfx.drawScaled(c, s, x, y, w, h) : c.drawImage(s, x, y, w, h);
  const rich = () => !Z.gq || Z.gq.level === -1 ? (Z.gq ? Z.gq.layers !== false : true) : Z.gq.level >= 2;

  /* ---------- Lichtstrahlen (Weltkoordinaten, nach dem Licht – leuchten über die Dunkelheit) ----------
     Kleine Fenster werfen schmale, schräge Strahlen, große Bogenfenster breite Mondbahnen. Jeder Strahl endet dort,
     wo er auf Boden trifft, und legt dort einen weichen Lichtfleck hin. Läuft Ezekiel oder ein Gegner hindurch, wirft
     er einen Schatten in den Strahl (ausgeschnitten per Clip), und der Staub in diesem Schatten verschwindet. */
  const WARMSH = { spires: 1, embercity: 1, forge: 1 };
  /* Fensterlicht: in Glutgebieten warm, sonst Himmelslicht der Tageszeit (Z.zeit().win), ohne sie silbrig-violett */
  const shaftRGB = () => { if (WARMSH[(Z.biome || {}).bg]) return "255,214,160"; const z = Z.zeit ? Z.zeit() : null; return z && Z.gfx.lightRGB ? Z.gfx.lightRGB(z.win).join(",") : "236,226,248"; };
  /* Horizontdunst in der Farbe des Himmelshorizonts (bzw. der Tageszeit), aufgehellt – nie ein grauer Streifen */
  function hazeRGB(zt, B) {
    const h = (zt && zt.H && zt.H.sky ? zt.H.sky[2] : B && B.sky ? B.sky[2] : "#c8b0b0"), n = parseInt(h.slice(1), 16), L = v => Math.min(255, (v * 1.25 + 30) | 0);
    let r = L(n >> 16), g = L((n >> 8) & 255), b = L(n & 255); if (b > r) r = b; return r + "," + g + "," + b;
  }
  let SL = null, SLlv = null, SLop = null;
  /* Strahlen des Levels (einmal je Level berechnet): Ursprung, Neigung s (dx je dy), Länge bis zum Boden, Breiten */
  function shaftList() {
    const lv = Z.level, ops = Z.gfx && Z.gfx.openings;
    if (SL && SLlv === lv && SLop === ops) return SL;
    SL = []; SLlv = lv; SLop = ops; if (!lv) return SL;
    const W = Z.world, solid = (x, y) => W && W.solidAt ? W.solidAt(x, y) : false;
    const reach = (x, y, s, max) => { for (let k = 6; k < max; k += 4) if (solid(x + s * k, y + k)) return { len: k, hit: true }; return { len: max, hit: false }; };
    for (const d of lv.decor || []) {
      if (d.kind !== "window" || (Z.gfx.sky && Z.gfx.sky[d.y * lv.W + d.x]) || (Z.gfx.isOpen && Z.gfx.isOpen(d.x, d.y))) continue;
      const x = d.x * T + 8, y = d.y * T + 6, s = 0.42, r = reach(x, y + 4, s, 170);
      SL.push({ k: "win", x, y, s, len: r.len, hit: r.hit, w0: 10, w1: 10 + 34 * r.len / 150, a: 0.11, ph: d.x * 1.7 + d.y, dust: 9, id: "w" + d.x + "," + d.y });
    }
    const B = Z.biome || {};
    if (ops && B.open === "arch") for (const o of ops) {
      if (o.blind) continue;
      const L = o.x0 * T, R = (o.x1 + 1) * T, Tp = o.y0 * T, Bt = (o.y1 + 1) * T, oy = Tp + 10, full = Bt + 102 - oy, s = 85 / full, cx = (L + R) / 2;
      const r = reach(cx, Bt, s, 150), len = Math.min(full, Bt - oy + r.len);
      SL.push({ k: "arch", x: cx, y: oy, s, len, hit: r.hit, w0: R - L - 12, w1: R - L - 6, a: 0.05, ph: o.x0 * 0.9, dust: 16, id: "a" + o.x0 + "," + o.y0 });
    }
    return SL;
  }
  Z.prachtShafts = () => shaftList(); /* für Tests */
  /* Figuren, die Strahlen verdecken: Rechtecke x, y, w, h (einmal je Bild) */
  const OCC = []; let occFrame = -1;
  function occluders() {
    if (occFrame === Z.gfx.frame) return OCC; occFrame = Z.gfx.frame; OCC.length = 0;
    const P = Z.player; if (P && !P.dead && !(P.invis > 0)) OCC.push(P.x + 1, P.y - 3, P.w - 2, P.h + 3);
    for (const e of Z.enemies) if (!e.dead && !(e.hidden > 0) && !(e.def && e.def.shape === "wisp")) OCC.push(e.x, e.y, e.w, e.h);
    for (const a of Z.allies || []) if (a && a.x != null && a.w) OCC.push(a.x, a.y, a.w, a.h || 20);
    return OCC;
  }
  /* Schatten der Figuren aus dem Strahl ausschneiden (je Schatten ein Clip – Überlappungen bleiben dunkel) */
  function clipShadows(c, b) {
    const O = occluders(), yE = b.y + b.len, Y = yE + 30; let n = 0;
    for (let i = 0; i < O.length; i += 4) {
      const x0 = O[i], y0 = O[i + 1], x1 = x0 + O[i + 2], y1 = y0 + O[i + 3];
      if (y1 < b.y || y0 > yE) continue;
      const cy = Math.max(b.y, Math.min(yE, (y0 + y1) / 2)), u = (cy - b.y) / b.len, bx = b.x + b.s * (cy - b.y), hw = (b.w0 + (b.w1 - b.w0) * u) / 2;
      if (x1 < bx - hw || x0 > bx + hw) continue;
      c.beginPath(); c.rect(b.x - 300, b.y - 60, 600 + b.len, b.len + 200);
      c.moveTo(x0, y0); c.lineTo(x1, y0); c.lineTo(x1 + b.s * (Y - y0), Y); c.lineTo(x0 + b.s * (Y - y1), Y); c.lineTo(x0, y1); c.closePath();
      c.clip("evenodd"); n++;
    }
    return n;
  }
  function inShadow(mx, my, s) {
    const O = OCC;
    for (let i = 0; i < O.length; i += 4) { const y0 = O[i + 1], y1 = y0 + O[i + 3]; if (my < y0) continue; const yc = Math.min(my, (y0 + y1) / 2), bx = mx - s * (my - yc); if (bx >= O[i] && bx <= O[i] + O[i + 2]) return true; }
    return false;
  }
  function beamPath(c, b) {
    const ex = b.x + b.s * b.len, ey = b.y + b.len;
    c.beginPath(); c.moveTo(b.x - b.w0 / 2, b.y); c.lineTo(b.x + b.w0 / 2, b.y); c.lineTo(ex + b.w1 / 2, ey); c.lineTo(ex - b.w1 / 2, ey); c.closePath();
  }
  function shafts(c, cam, t) {
    const L = shaftList(); if (!L.length) return;
    const lvl = Z.gfx.lq ? Z.gfx.lq() : 2, rgb = shaftRGB();
    occluders();
    c.save(); c.globalCompositeOperation = "lighter";
    for (const b of L) {
      const ex = b.x + b.s * b.len, ey = b.y + b.len;
      if (Math.max(b.x, ex) + b.w1 < cam.x || Math.min(b.x, ex) - b.w1 > cam.x + cam.w || ey < cam.y || b.y > cam.y + cam.h) continue;
      const sv = Z.sightAt ? Math.min(1, Z.sightAt(b.x, b.y + 10) * 1.4) : 1; if (sv < 0.04) continue;
      const a = b.a * (0.82 + 0.18 * Math.sin(t * 0.7 + b.ph)) * sv;
      c.save();
      const sh = clipShadows(c, b);
      const g = c.createLinearGradient(b.x, b.y, ex, ey); g.addColorStop(0, "rgba(" + rgb + "," + a.toFixed(3) + ")"); g.addColorStop(0.7, "rgba(" + rgb + "," + (a * 0.45).toFixed(3) + ")"); g.addColorStop(1, "rgba(" + rgb + "," + (b.hit ? a * 0.25 : 0).toFixed(3) + ")");
      c.fillStyle = g; beamPath(c, b); c.fill();
      /* feine Lichtbahnen im Strahl, die langsam wandern (Gottesstrahlen) */
      if (lvl >= 3) {
        for (let i = 0; i < 3; i++) {
          const u = 0.5 + 0.38 * Math.sin(t * (0.13 + i * 0.05) + b.ph + i * 2.1), ww = 0.12 + 0.08 * Math.sin(t * 0.21 + i + b.ph);
          const x0 = b.x - b.w0 / 2 + b.w0 * u, x1 = ex - b.w1 / 2 + b.w1 * u, h0 = b.w0 * ww / 2, h1 = b.w1 * ww / 2;
          c.globalAlpha = 0.55; c.beginPath(); c.moveTo(x0 - h0, b.y); c.lineTo(x0 + h0, b.y); c.lineTo(x1 + h1, ey); c.lineTo(x1 - h1, ey); c.closePath(); c.fill();
        }
        c.globalAlpha = 1;
      }
      c.restore();
      /* Lichtfleck auf dem Boden (fällt mit dem Schatten zusammen nicht weg – der liegt im Strahl) */
      if (b.hit) {
        const pw = b.w1 * 1.15, ph = 5 + b.w1 * 0.12, pa = Math.min(1, a * 3.2);
        const gp = c.createRadialGradient(ex, ey, 0, ex, ey, pw / 2); gp.addColorStop(0, "rgba(" + rgb + "," + pa.toFixed(3) + ")"); gp.addColorStop(1, "rgba(" + rgb + ",0)");
        c.save(); c.translate(ex, ey - 1); c.scale(1, ph / pw * 2); c.translate(-ex, -ey); c.fillStyle = gp; c.fillRect(ex - pw / 2, ey - pw / 2, pw, pw); c.restore();
      }
      /* tanzender Staub: steigt und sinkt langsam, funkelt, fehlt im Schatten */
      const n = Math.round(b.dust * (lvl >= 3 ? 1.6 : 1));
      for (let i = 0; i < n; i++) {
        const k = (hash(b.ph * 7 + i, 3) + t * (0.012 + hash(i, b.ph) * 0.025)) % 1, yy = b.y + k * b.len * 0.95;
        const wB = b.w0 + (b.w1 - b.w0) * k, xx = b.x + k * b.len * 0.95 * b.s + (hash(i, b.ph * 3) - 0.5) * wB * 0.9 + Math.sin(t * (0.6 + hash(i, 5) * 0.5) + i) * 2.4, y2 = yy + Math.sin(t * 0.9 + i * 1.3) * 1.6;
        if (sh && inShadow(xx, y2, b.s)) continue;
        const tw = 0.55 + 0.45 * Math.sin(t * (2 + hash(i, 9) * 3) + i * 2.3), sz = hash(i, 11) < 0.2 ? 1.3 : 0.8;
        c.globalAlpha = 0.6 * Math.sin(k * Math.PI) * tw * sv; c.fillStyle = "#fff4e4"; c.fillRect(xx, y2, sz, sz);
      }
      c.globalAlpha = 1;
    }
    c.restore();
  }
  /* Lichtflecken der Strahlen auch in die Farbkarte (färben Boden und Figuren silbrig bzw. warm) */
  if (Z.gfx.lightGather) Z.gfx.lightGather.push(function (add, cam, t, lvl) {
    if (lvl < 2 || !Z.level) return;
    const L = shaftList(), rgb = shaftRGB();
    for (const b of L) { if (!b.hit) continue; const ex = b.x + b.s * b.len, ey = b.y + b.len; if (ex < cam.x - 80 || ex > cam.x + cam.w + 80 || ey < cam.y - 60 || ey > cam.y + cam.h + 60) continue; add(ex, ey - 6, b.w1 * 0.9 + 12, "rgb(" + rgb + ")", b.k === "arch" ? 0.22 : 0.3, 0); add(b.x + b.s * b.len * 0.4, b.y + b.len * 0.4, b.w1 * 0.7, "rgb(" + rgb + ")", 0.12, 0); }
    /* leuchtende Teilchen (Glut, Funken, Sporen, Glühwürmchen) werfen winzige Lichter */
    const parts = Z.fx && Z.fx.parts; if (!parts) return; let n = 0, max = lvl >= 3 ? 26 : 16;
    for (let i = parts.length - 1; i >= 0 && n < max; i--) { const p = parts[i]; if (p.kind !== "glow" || !p.add || !p.col) continue; if (p.x < cam.x || p.x > cam.x + cam.w || p.y < cam.y || p.y > cam.y + cam.h) continue; add(p.x, p.y, 14 + (p.size || 1) * 5, p.col, 0.32, 0); n++; }
  });
  /* sanfte Lichtwellen: Runen atmen alle paar Sekunden einen violetten Ring aus, der über Wände und Boden läuft */
  const ringSpr = (() => { let s = null; return () => { if (s) return s; s = document.createElement("canvas"); s.width = s.height = 64; const g = s.getContext("2d"), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, "rgba(255,255,255,0)"); gr.addColorStop(0.62, "rgba(255,255,255,0)"); gr.addColorStop(0.8, "rgba(255,255,255,1)"); gr.addColorStop(0.92, "rgba(255,255,255,.3)"); gr.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); return s; }; })();
  const tintSpr = {};
  function tinted(rgb) { const k = rgb; if (tintSpr[k]) return tintSpr[k]; const s = document.createElement("canvas"); s.width = s.height = 64; const g = s.getContext("2d"); g.drawImage(ringSpr(), 0, 0); g.globalCompositeOperation = "source-in"; g.fillStyle = "rgb(" + rgb + ")"; g.fillRect(0, 0, 64, 64); return (tintSpr[k] = s); }
  if (Z.gfx.colorOver) Z.gfx.colorOver.push(function (l, X0, Y0, sx, sy, LW, LH, t) {
    const lv = Z.level; if (!lv || !lv.lights || Z.darkness > 0) return;
    for (const d of lv.lights) {
      if (d.kind !== "rune" && d.kind !== "greenfire" && d.kind !== "altar") continue;
      const per = d.kind === "rune" ? 6.5 : 9, u = ((t + hash(d.x, d.y) * per) % per) / 2.6; if (u >= 1) continue;
      const x = (d.x * T + 8 - X0) * sx, y = (d.y * T - 6 - Y0) * sy, R = (14 + u * 150) * sx; if (x < -R || y < -R || x > LW + R || y > LH + R) continue;
      l.globalAlpha = 0.5 * (1 - u) * Math.min(1, u * 6); l.drawImage(tinted(d.kind === "rune" ? "190,110,255" : d.kind === "altar" ? "255,214,140" : "110,255,130"), x - R, y - R, R * 2, R * 2);
    }
  });

  /* ---------- Vordergrund-Silhouetten (Bildschirmkoordinaten, schneller als die Welt: Tiefe) ----------
     Vorgezeichnete Schattenrisse mit schwachem Randlicht: Säulen mit Basis und Kapitell, Bogenansätze,
     Ketten aus Gliedern, geknotete Taue und zerklüftete Tropfsteine. */
  const FG = { castle: "pillar", cellar: "chain", halls: "pillar", ramparts: "pillar", dungeon: "chain", harbour: "rope", belltower: "chain", chasm: "stalactite", forge: "chain", spires: "pillar", lake: "stalactite", embercity: "stalactite", storm: "pillar" };
  const fgCache = {};
  function fgSprite(kind, v) {
    const key = kind + ((v * 4) | 0); if (fgCache[key]) return fgCache[key];
    const W = 140, H = 420, cv = document.createElement("canvas"); cv.width = W; cv.height = H; const g = cv.getContext("2d");
    const col = "#0b0709", rim = "rgba(255,196,150,.13)", R = k => hash(k, (v * 97) | 0);
    g.fillStyle = col; g.strokeStyle = col;
    if (kind === "pillar") {
      /* von unten aufragende Säule: Sockel, kannelierter Schaft, Kapitell oder Bruchkante */
      const x0 = 45, x1 = 95, top = 70 + R(1) * 60, broken = v < 0.5;
      g.fillRect(x0 - 16, H - 34, x1 - x0 + 32, 34); g.fillRect(x0 - 10, H - 46, x1 - x0 + 20, 13);
      g.fillRect(x0, top, x1 - x0, H - top - 40);
      if (broken) { g.beginPath(); g.moveTo(x0, top + 2); for (let k = 0; k <= 6; k++) g.lineTo(x0 + (x1 - x0) * k / 6, top - 4 - R(k + 3) * 16); g.lineTo(x1, top + 2); g.fill(); }
      else { g.fillRect(x0 - 12, top - 18, x1 - x0 + 24, 12); g.fillRect(x0 - 6, top - 7, x1 - x0 + 12, 8); g.fillRect(x0 - 16, top - 24, x1 - x0 + 32, 7); }
      g.fillStyle = rim; g.fillRect(x0, top, 2.5, H - top - 46); g.fillRect(x0 - 16, H - 34, 2.5, 34); g.fillRect(x0 - 10, H - 46, x1 - x0 + 20, 1.5);
      g.fillStyle = "rgba(255,196,150,.05)"; for (let k = 1; k < 5; k++) g.fillRect(x0 + k * 10, top + 6, 1.2, H - top - 56);
    } else if (kind === "chain") {
      /* Kette aus Gliedern mit schwerem Haken */
      const len = 200 + R(2) * 160; g.lineWidth = 5;
      for (let y = -6, k = 0; y < len; y += 13, k++) { if (k % 2) { g.fillRect(W / 2 - 2.5, y, 5, 15); } else { g.beginPath(); g.ellipse(W / 2, y + 7, 7, 10, 0, 0, 6.283); g.stroke(); } }
      g.lineWidth = 8; g.beginPath(); g.moveTo(W / 2, len); g.lineTo(W / 2, len + 18); g.arc(W / 2 - 14, len + 18, 14, 0, Math.PI * 0.9); g.stroke();
      g.strokeStyle = rim; g.lineWidth = 1.2; g.beginPath(); g.arc(W / 2 - 14, len + 18, 17, 0.2, 1.4); g.stroke();
    } else if (kind === "rope") {
      const len = 220 + R(2) * 150; g.lineWidth = 6; g.beginPath(); g.moveTo(W / 2, -4); g.quadraticCurveTo(W / 2 + 10, len * 0.5, W / 2 + 4, len); g.stroke();
      for (let k = 0; k < 3; k++) { const y = 60 + k * 90 + R(k) * 30; g.beginPath(); g.ellipse(W / 2 + 6, y, 7, 9, 0, 0, 6.283); g.fill(); }
      g.strokeStyle = "rgba(255,196,150,.08)"; g.lineWidth = 1; for (let y = 0; y < len; y += 7) { g.beginPath(); g.moveTo(W / 2 - 2, y); g.lineTo(W / 2 + 3, y + 5); g.stroke(); }
      g.beginPath(); g.moveTo(W / 2 + 4, len); g.lineTo(W / 2 - 6, len + 30); g.moveTo(W / 2 + 4, len); g.lineTo(W / 2 + 12, len + 26); g.strokeStyle = col; g.lineWidth = 3; g.stroke();
    } else {
      /* Tropfsteine: zerklüftete Zapfen von der Decke, mit Nebenzapfen */
      const base = (cx, w, h, dir) => { g.beginPath(); g.moveTo(cx - w, dir > 0 ? -2 : H + 2); const n = 7; for (let k = 1; k < n; k++) { const u = k / n, yy = dir > 0 ? h * u : H - h * u; g.lineTo(cx - w * (1 - u) + (R(k + w) - 0.5) * 6, yy); } g.lineTo(cx + (R(w) - 0.5) * 3, dir > 0 ? h : H - h); for (let k = n - 1; k > 0; k--) { const u = k / n, yy = dir > 0 ? h * u : H - h * u; g.lineTo(cx + w * (1 - u) + (R(k * 3 + w) - 0.5) * 6, yy); } g.lineTo(cx + w, dir > 0 ? -2 : H + 2); g.fill(); };
      base(W / 2, 30 + R(1) * 14, 140 + R(2) * 120, 1); base(W / 2 - 34, 12, 60 + R(3) * 50, 1); base(W / 2 + 30, 10, 40 + R(4) * 40, 1);
      g.fillStyle = rim; g.beginPath(); g.moveTo(W / 2 - 30, 0); g.lineTo(W / 2 - 4, 130 + R(2) * 100); g.lineTo(W / 2 - 26, 0); g.fill();
    }
    return (fgCache[key] = cv);
  }
  function foreground(c, cam, W, H, S) {
    const B = Z.biome || {}, lv = Z.level; if (!lv || lv.hub || lv.arena || lv.passage) return;
    const kind = FG[B.bg] || "pillar", f = 1.35, span = 330;
    const sx = cam.x * f, i0 = Math.floor(sx / span) - 1, i1 = Math.floor((sx + cam.w * 1.1) / span) + 1;
    c.save(); c.setTransform(S, 0, 0, S, 0, 0);
    for (let i = i0; i <= i1; i++) {
      const r = hash(i, lv.seed || 3); if (r < 0.45) continue;
      const spr = fgSprite(kind, r), sc = cam.h / 300 * (0.85 + r * 0.3), w = spr.width * sc, h = spr.height * sc;
      const x = i * span + r * 120 - sx - w / 2;
      const fromTop = kind !== "pillar";
      const y = fromTop ? -h * (0.3 - r * 0.2) : cam.h - h * (0.42 + r * 0.12);
      /* zur Bildmitte hin durchscheinend, damit nichts das Spiel verdeckt */
      const mid = Math.abs(x + w / 2 - cam.w / 2) / (cam.w * 0.5);
      const a0 = Math.max(0.35, Math.min(0.95, (mid - 0.1) / 0.5));
      /* nie vor Spieler, Gegnern, Geschossen, Gefahren oder Truhen/Türen: dann fast ganz ausblenden */
      c.globalAlpha = Z.gfx.fgAlpha ? Z.gfx.fgAlpha("p" + i, x, y, w, h, a0) : a0;
      if (c.globalAlpha < 0.01) continue;
      if (kind === "chain" || kind === "rope") { const sway = Math.sin(Z.gfx.time * 0.6 + i) * 0.03; c.save(); c.translate(x + w / 2, y); c.rotate(sway); c.drawImage(spr, -w / 2, 0, w, h); c.restore(); }
      else DS(c, spr, x, y, w, h);
    }
    c.restore();
  }

  /* ---------- Farbstimmung je Gebiet ----------
     Zwei Teile, beide ohne eigenen Vollbild-Durchgang:
     1. In der Dunkelheitskarte: leichte Tönung oben und schwere Tiefe unten (wie bisher).
     2. Als Grundton der Lichtkarte (Z.gfx.colorBase; sie liegt mit „multiply“ über der Szene, weiß = neutral):
        Tönung des Umgebungslichts mit Farbtemperatur-Verlauf von oben nach unten. Weil Lichtquellen die Karte
        weiß/farbig aufhellen, wirken die Schatten kühl-violett (bzw. je Gebiet getönt) und das Licht warm und klar –
        das gibt Tiefe und Kontrast. Kein Blau: kühle Töne sind silbrig-violett. Werte: [oben], [Mitte], [unten]. */
  const GRADE = {
    castle: [[238, 228, 248], [232, 226, 238], [222, 206, 234]], camp: [[238, 228, 248], [232, 226, 238], [222, 206, 234]],
    ramparts: [[240, 230, 250], [234, 228, 238], [222, 208, 232]], harbour: [[234, 230, 242], [228, 224, 232], [214, 206, 228]],
    storm: [[228, 236, 224], [222, 228, 218], [206, 214, 204]], spires: [[255, 228, 206], [246, 218, 214], [228, 198, 216]],
    cellar: [[255, 238, 214], [242, 230, 226], [220, 204, 230]], halls: [[255, 236, 208], [246, 232, 224], [224, 206, 228]], passage: [[255, 236, 212], [244, 232, 226], [224, 208, 228]],
    dungeon: [[236, 242, 216], [226, 230, 218], [208, 204, 220]], belltower: [[254, 236, 216], [238, 230, 228], [216, 204, 228]],
    chasm: [[240, 216, 254], [228, 212, 240], [214, 194, 234]], forge: [[255, 228, 198], [250, 218, 206], [232, 198, 212]],
    lake: [[222, 242, 228], [214, 232, 220], [200, 220, 208]], embercity: [[255, 224, 194], [252, 212, 200], [234, 194, 202]]
  };
  let grade = null, gradeKey = "", gradeFrame = -1, cbase = null, cbaseKey = "";
  if (Z.gfx.lightOver) Z.gfx.lightOver.push(function (l, X0, Y0, sx, sy, LW, LH) {
    if (!rich() || !Z.level) return;
    gradeSprite(); l.drawImage(grade, 0, 0, LW, LH); gradeFrame = Z.gfx.frame;
  });
  function gradeSprite() {
    const B = Z.biome || {}, key = B.ambCol || "";
    if (key !== gradeKey || !grade) {
      gradeKey = key; grade = document.createElement("canvas"); grade.width = 8; grade.height = 64;
      const g = grade.getContext("2d"), n = parseInt((B.ambCol || "#3a2a2a").slice(1), 16), rgb = [Math.min(255, (n >> 16) + 60), Math.min(255, ((n >> 8) & 255) + 40), Math.min(255, (n & 255) + 20)].join(",");
      const lg = g.createLinearGradient(0, 0, 0, 64); lg.addColorStop(0, "rgba(" + rgb + ",.10)"); lg.addColorStop(0.45, "rgba(" + rgb + ",0)"); lg.addColorStop(0.7, "rgba(0,0,0,0)"); lg.addColorStop(1, "rgba(0,0,0,.22)");
      g.fillStyle = lg; g.fillRect(0, 0, 8, 64);
    }
    return grade;
  }
  /* Grundton der Lichtkarte: senkrechter Verlauf der Umgebungstönung, an den Rändern ein Hauch dunkler */
  Z.gfx.colorBase = function () {
    const B = Z.biome || {}, lv = Z.level, zt = Z.zeit ? Z.zeit() : null, outside = !!(lv && (lv.out || lv.hub)) || B.open === "arch";
    const key = (B.bg || "") + (outside ? "o" : "") + (zt ? zt.k + (zt.moonBright * 4 | 0) : "");
    if (cbase && cbaseKey === key) return cbase;
    cbaseKey = key; cbase = cbase || document.createElement("canvas"); cbase.width = 32; cbase.height = 18;
    let P = GRADE[B.bg] || [[250, 238, 228], [238, 232, 232], [222, 212, 228]];
    /* Tageszeit dezent einmischen (tageszeit.js): Dämmerung gold/rosa, Nacht silbrig und etwas dunkler, Blutmond Rotstich.
       Draußen und hinter Bogenfenstern stärker, tief drinnen kaum. */
    if (zt && zt.amb) {
      const a = Z.gfx.lightRGB ? Z.gfx.lightRGB(zt.amb) : [255, 255, 255], f0 = outside ? 0.24 : 0.07, dim = zt.k === "nacht" ? 0.95 - 0.04 * (1 - zt.moonBright) : zt.k === "blut" ? 0.95 : 1;
      const tint = (v, f) => v.map((c, i) => Math.min(255, (c * (1 - f) + c * (a[i] / 255) * f) * dim) | 0);
      P = [tint(P[0], f0), tint(P[1], f0 * 0.8), tint(P[2], f0 * (zt.k === "blut" ? 0.9 : 0.55))];
    }
    const g = cbase.getContext("2d"), s = v => "rgb(" + v.join(",") + ")";
    const lg = g.createLinearGradient(0, 0, 0, 18); lg.addColorStop(0, s(P[0])); lg.addColorStop(0.5, s(P[1])); lg.addColorStop(1, s(P[2])); g.fillStyle = lg; g.fillRect(0, 0, 32, 18);
    const rg = g.createRadialGradient(16, 9, 4, 16, 9, 19); rg.addColorStop(0, "rgba(255,255,255,.06)"); rg.addColorStop(1, "rgba(0,0,0,.08)"); g.fillStyle = rg; g.fillRect(0, 0, 32, 18);
    return cbase;
  };
  function colorGrade(c, W, H) {
    if (gradeFrame === Z.gfx.frame && Z.gfx.lightMerged && Z.gfx.lightMerged()) return;
    gradeSprite();
    c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.globalCompositeOperation = "source-over"; c.drawImage(grade, 0, 0, W, H); c.restore();
  }
  /* ---------- Filmkorn: sehr fein, animiert, kaum sichtbar (nur Stufe 3 „Ultra“) ---------- */
  let grainCv = null, grainPat = null, grainCtx = null;
  function grain(c, W, H, t) {
    if (!grainCv) {
      grainCv = document.createElement("canvas"); grainCv.width = grainCv.height = 96; const g = grainCv.getContext("2d"), id = g.createImageData(96, 96);
      let s = 1234567; const rnd = () => ((s = (s * 1103515245 + 12345) >>> 0) / 4294967296);
      for (let i = 0; i < id.data.length; i += 4) { const v = rnd(), w = v > 0.5; id.data[i] = id.data[i + 1] = id.data[i + 2] = w ? 255 : 0; id.data[i + 3] = (Math.abs(v - 0.5) * 2) ** 2 * 22; }
      g.putImageData(id, 0, 0);
    }
    if (grainCtx !== c) { grainPat = c.createPattern(grainCv, "repeat"); grainCtx = c; }
    const f = Math.floor(t * 24), ox = (hash(f, 1) * 96) | 0, oy = (hash(f, 2) * 96) | 0;
    c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.globalCompositeOperation = "source-over"; c.globalAlpha = 0.3;
    c.translate(-ox, -oy); c.fillStyle = grainPat; c.fillRect(0, 0, W + 96, H + 96); c.restore();
  }

  /* ---------- Nachbilder: Rolle, Rollsprung, Blinken ---------- */
  const ghosts = [];
  Z.prachtTick = function (dt) {
    const P = Z.player; if (!P) return;
    for (let i = ghosts.length - 1; i >= 0; i--) { ghosts[i].t += dt; if (ghosts[i].t > 0.22) ghosts.splice(i, 1); }
    const fast = P.rollT > 0 || Math.abs(P.vx) > Z.PC.RUN * 1.12 || P.grapple;
    P._gt = (P._gt || 0) - dt;
    if (fast && P._gt <= 0 && rich()) { P._gt = 0.03; ghosts.push({ x: P.x + P.w / 2, y: P.y + P.h / 2, roll: P.rollT > 0, face: P.face, t: 0 }); }
  };
  function drawGhosts(c) {
    if (!ghosts.length) return;
    c.save(); c.globalCompositeOperation = "lighter";
    for (const g of ghosts) {
      const k = 1 - g.t / 0.22;
      c.globalAlpha = 0.28 * k; c.fillStyle = "#ff5a3a";
      c.beginPath(); if (g.roll) c.arc(g.x, g.y + 5, 8, 0, 6.283); else c.ellipse(g.x, g.y, 5, 12, 0, 0, 6.283); c.fill();
    }
    c.restore();
  }

  /* ---------- Lebendige Ferne (zwischen ferner und mittlerer Ebene) ---------- */
  const OUT = { castle: 1, ramparts: 1, harbour: 1, spires: 1, storm: 1, camp: 1 };
  const CAVE = { chasm: 1, lake: 1, embercity: 1 };
  const sprites = {};
  function cloudSprite(key, col, w, h, seed) {
    const k = key + col; if (sprites[k]) return sprites[k];
    const cv = document.createElement("canvas"); cv.width = w; cv.height = h; const g = cv.getContext("2d");
    for (let i = 0; i < 14; i++) {
      const x = w * (0.18 + hash(seed, i) * 0.64), y = h * (0.45 + (hash(i * 3, seed) - 0.5) * 0.4);
      /* Radius nie über den Leinwandrand hinaus – sonst entstehen harte Rechteckkanten */
      const r = Math.min(h * (0.25 + hash(i, seed) * 0.3), x - 1, w - x - 1, y - 1, h - y - 1); if (r < 3) continue;
      const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, col.replace("A", "0.55")); gr.addColorStop(0.6, col.replace("A", "0.25")); gr.addColorStop(1, col.replace("A", "0"));
      g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2);
    }
    /* heller Rand oben (Mondlicht) */
    g.globalCompositeOperation = "source-atop"; const lg = g.createLinearGradient(0, 0, 0, h); const rim = (Z.zeit && Z.zeit() && Z.gfx.lightRGB) ? Z.gfx.lightRGB(Z.zeit().light).join(",") : "255,236,210"; lg.addColorStop(0, "rgba(" + rim + ",.35)"); lg.addColorStop(0.5, "rgba(" + rim + ",0)"); g.fillStyle = lg; g.fillRect(0, 0, w, h);
    return (sprites[k] = cv);
  }
  const rgba = (hex, f) => { const n = parseInt(hex.slice(1), 16); const r = Math.min(255, (n >> 16) * f + 20) | 0, g = Math.min(255, ((n >> 8) & 255) * f + 16) | 0, b = Math.min(255, (n & 255) * f + 14) | 0; return "rgba(" + r + "," + g + "," + b + ",A)"; };
  Z.drawBackLife = function (c, cam, t, B, oy, LH) {
    if (!B || !Z.gq || Z.gq.level === 0) return;
    const lvl = Z.level, kind = B.bg, out = OUT[kind] || (lvl && (lvl.hub || (lvl.arena && lvl.out)));
    const full = rich();
    const px = pf => cam.x * (1 - pf); /* Weltversatz für Parallaxe */
    c.save();
    if (out) {
      /* Wolkenbänke in zwei Tiefen */
      for (const [pf, n, sc, sp, a] of [[0.05, 5, 1, 3, 0.45], [0.1, 4, 1.4, 6, 0.6]]) {
        if (!full && pf > 0.06) continue;
        const zt = Z.zeit ? Z.zeit() : null, spr = cloudSprite("c" + pf + (zt ? zt.k : ""), rgba(zt && zt.H ? zt.H.sky[2] : B.sky[2], 1.25), 220, 70, pf * 100);
        const span = 900;
        for (let i = 0; i < n; i++) {
          const bx = ((hash(i, pf * 7) * span + t * sp) % span) - 200, by = LH * (0.12 + hash(pf * 9, i) * 0.32);
          const wx = bx + Math.floor((cam.x - px(pf) - bx) / span) * span + px(pf);
          for (const o of [0, span]) { const x = wx + o; if (x > cam.x + cam.w || x + 220 * sc < cam.x) continue; c.globalAlpha = a * (0.6 + hash(i, 3) * 0.4); DS(c, spr, x, oy + by, 220 * sc, 70 * sc); }
        }
      }
      c.globalAlpha = 1;
      if (full) {
        /* Vogelschwärme ziehen langsam vorbei */
        const fl = Math.floor(t / 26), ft = (t % 26) / 26, seedB = hash(fl, 5);
        if (seedB > 0.35 && kind !== "storm") {
          const x0 = cam.x - 60 + ft * (cam.w + 160) * (seedB > 0.6 ? 1 : 1), y0 = oy + LH * (0.15 + seedB * 0.2), dir = seedB > 0.65 ? -1 : 1;
          const bx = dir > 0 ? x0 : cam.x + cam.w + 60 - ft * (cam.w + 160);
          c.strokeStyle = "rgba(20,12,16,.7)"; c.lineWidth = 0.8;
          for (let i = 0; i < 7; i++) { const x = bx - dir * (i % 2 ? i * 6 : i * 5) , y = y0 + (i % 2 ? i * 2.5 : -i * 0.5) + Math.sin(t * 2 + i) * 1.5, w = Math.sin(t * 9 + i * 1.3) * 1.8; c.beginPath(); c.moveTo(x - 3, y - w); c.lineTo(x, y); c.lineTo(x + 3, y - w); c.stroke(); }
        }
        /* Sternschnuppen in klaren Nächten */
        if (!Z.zeit && (kind === "castle" || kind === "camp" || kind === "harbour" || kind === "ramparts")) { /* mit tageszeit.js zeichnet die den Himmel samt Sternschnuppen */
          const k = (t % 9) / 9, n = Math.floor(t / 9);
          if (k < 0.08 && hash(n, 11) > 0.4) { const sx = cam.x + cam.w * hash(n, 2), sy = oy + LH * 0.08 + hash(n, 4) * 40, d = k / 0.08; c.save(); c.globalCompositeOperation = "lighter"; const g = c.createLinearGradient(sx + d * 70, sy + d * 25, sx + d * 70 - 30, sy + d * 25 - 11); g.addColorStop(0, "rgba(255,250,230," + (1 - d) + ")"); g.addColorStop(1, "rgba(255,250,230,0)"); c.strokeStyle = g; c.lineWidth = 1; c.beginPath(); c.moveTo(sx + d * 70, sy + d * 25); c.lineTo(sx + d * 70 - 30, sy + d * 25 - 11); c.stroke(); c.restore(); }
        }
        /* Gewitter: ferne Blitze erhellen die Wolken */
        if (kind === "storm" || kind === "spires") {
          const n = Math.floor(t / 4.3), k = t % 4.3;
          if (hash(n, 21) > 0.45 && k < 0.25) { c.save(); c.globalCompositeOperation = "lighter"; c.globalAlpha = (0.25 - k) * (kind === "storm" ? 1.6 : 0.8) * (Z.flashK ? Z.flashK("licht") : 1); c.fillStyle = kind === "storm" ? "#e8f0d8" : "#ffb070"; c.fillRect(cam.x, oy, cam.w, LH * 0.6); c.restore();
            if (kind === "storm" && k < 0.12) { const lx = cam.x + cam.w * hash(n, 9); c.save(); c.strokeStyle = "rgba(255,255,240,.85)"; c.lineWidth = 1.2; c.beginPath(); let x = lx, y = oy + LH * 0.1; c.moveTo(x, y); for (let i = 0; i < 6; i++) { x += (hash(n, i) - 0.5) * 24; y += LH * 0.07; c.lineTo(x, y); } c.stroke(); c.restore(); } }
        }
        /* Dunst am Horizont, langsam ziehend */
        const hy = oy + LH * 0.6, zt = Z.zeit ? Z.zeit() : null, hz = hazeRGB(zt, B); c.save(); c.globalAlpha = zt && (zt.k === "nacht" || zt.k === "blut") ? 0.14 : 0.22;
        for (let i = 0; i < 3; i++) { const x = cam.x - ((t * (4 + i * 2) + i * 140) % 300), g = c.createLinearGradient(0, hy - 14, 0, hy + 14); g.addColorStop(0, "rgba(" + hz + ",0)"); g.addColorStop(0.5, "rgba(" + hz + ",.6)"); g.addColorStop(1, "rgba(" + hz + ",0)"); c.fillStyle = g; c.fillRect(x, hy - 14 + i * 9, cam.w + 320, 28); }
        c.restore();
      }
    } else if (full) {
      /* Innen und Unterreich: Fledermäuse, Glühwesen, Glutblasen in der Ferne */
      if (CAVE[kind] || kind === "cellar" || kind === "dungeon" || kind === "belltower") {
        const n = Math.floor(t / 11), k = (t % 11) / 11;
        if (hash(n, 31) > 0.3 && k < 0.5) { const d = k / 0.5, y0 = oy + LH * (0.2 + hash(n, 3) * 0.3); c.fillStyle = "rgba(10,6,8,.85)";
          for (let i = 0; i < 4; i++) { const x = cam.x - 30 + d * (cam.w + 60) - i * 14, y = y0 + Math.sin(t * 5 + i * 2) * 6 + i * 4, w = Math.sin(t * 22 + i) * 3; c.beginPath(); c.moveTo(x - 4, y - w); c.quadraticCurveTo(x - 2, y + 1, x, y); c.quadraticCurveTo(x + 2, y + 1, x + 4, y - w); c.lineTo(x, y + 1.5); c.fill(); } }
      }
      if (kind === "lake" || kind === "chasm") {
        c.save(); c.globalCompositeOperation = "lighter";
        for (let i = 0; i < 9; i++) { const pf = 0.15, x = px(pf) + ((hash(i, 7) * 700 + Math.sin(t * 0.2 + i) * 30) % 700), y = oy + LH * (0.25 + hash(7, i) * 0.45) + Math.sin(t * 0.5 + i * 2) * 10; const xx = x + Math.floor((cam.x - x) / 700 + 0.5) * 700;
          const col = kind === "lake" ? "rgba(170,240,210,.5)" : "rgba(200,130,255,.5)"; const g = c.createRadialGradient(xx, y, 0, xx, y, 7); g.addColorStop(0, col); g.addColorStop(1, "rgba(0,0,0,0)"); c.fillStyle = g; c.fillRect(xx - 7, y - 7, 14, 14); }
        c.restore();
      }
      if (kind === "embercity" || kind === "forge") {
        c.save(); c.globalCompositeOperation = "lighter"; const pulse = 0.5 + 0.5 * Math.sin(t * 0.8);
        const g = c.createLinearGradient(0, oy + LH * 0.55, 0, oy + LH); g.addColorStop(0, "rgba(255,90,20,0)"); g.addColorStop(1, "rgba(255,90,20," + (0.12 + pulse * 0.08) + ")"); c.fillStyle = g; c.fillRect(cam.x, oy + LH * 0.55, cam.w, LH * 0.45);
        for (let i = 0; i < 12; i++) { const life = (t * 0.25 + hash(i, 1)) % 1, x = cam.x + cam.w * hash(i, 8) + Math.sin(t + i) * 6, y = oy + LH * (0.95 - life * 0.7); c.fillStyle = "rgba(255," + (140 + life * 60 | 0) + ",60," + (0.6 * (1 - life)) + ")"; c.fillRect(x, y, 1.2, 1.2); }
        c.restore();
      }
    }
    c.restore();
  };

  /* ---------- Leben in der Szene: Rauch über Fackeln, Glimmen an Kerzen, Spinnweben im Luftzug ---------- */
  Z.drawMidLife = function (c, cam, t) {
    if (!rich()) return;
    const lv = Z.level; if (!lv || !lv.lights) return;
    const FX = Z.fx, q = Z.gq ? Z.gq.part : 1;
    for (const d of lv.lights) {
      const x = d.x * T + 8, y = d.y * T + (d.kind === "torch" ? -8 : 2);
      if (x < cam.x - 20 || x > cam.x + cam.w + 20 || y < cam.y - 20 || y > cam.y + cam.h + 20) continue;
      if ((d.kind === "torch" || d.kind === "brazier") && Math.random() < 0.06 * q) FX.p({ x: x + (Math.random() - 0.5) * 3, y: y - 4, vx: (Z.windX || 0) * 0.3 + (Math.random() - 0.5) * 4, vy: -14 - Math.random() * 8, life: 1.6, size: 3.5, col: "rgba(60,46,44,.35)", kind: "smoke", drag: 0.99 });
      if ((d.kind === "torch" || d.kind === "candelabra" || d.kind === "chandelier" || d.kind === "candle") && Math.random() < 0.03 * q) FX.p({ x: x + (Math.random() - 0.5) * 6, y: y - 2, vx: (Math.random() - 0.5) * 10, vy: -26 - Math.random() * 20, life: 0.9, size: 1, col: "#ffcf7a", kind: "glow", add: true });
    }
  };

  /* ---------- Bildschirmgrößen: Oberfläche passend skalieren ---------- */
  function fitUI() {
    const W = innerWidth, H = innerHeight, coarse = matchMedia("(pointer: coarse)").matches;
    const hud = coarse ? Math.max(0.78, Math.min(1.12, Math.min(H / 420, W / 860))) : Math.max(0.72, Math.min(1.9, Math.min(W / 1280, H / 720)));
    const ui = coarse ? Math.max(0.8, Math.min(1, H / 430)) : Math.max(0.85, Math.min(1.7, Math.min(W / 1280, H / 780)));
    const r = document.documentElement.style; r.setProperty("--hud", hud.toFixed(3)); r.setProperty("--ui", ui.toFixed(3));
    document.documentElement.classList.toggle("klein", H < 420 || W < 700);
  }
  addEventListener("resize", fitUI); addEventListener("orientationchange", () => setTimeout(fitUI, 200)); fitUI();

  /* ---------- Einhängen in das Bild ---------- */
  Z.drawBeforePlayer = function (c) { drawGhosts(c); };
  Z.drawAfterLight = function (c, cam, W, H, t) {
    if (!rich()) return;
    if (!Z.gfx.off || !Z.gfx.off.shafts) shafts(c, cam, t);
    foreground(c, cam, W, H, Z.gfx.scale);
    colorGrade(c, W, H);
    /* Filmkorn nur auf Ultra: kostet in Software-Darstellung einen ganzen Vollbild-Durchgang */
    if (Z.gfx.lq && Z.gfx.lq() >= 3 && !(Z.gfx.off && Z.gfx.off.grain)) grain(c, W, H, t);
  };
})();

/* Ezekiel – The Destroyer · Werkstatt der Steinmetze (Kachel-Feinschliff, nur Stufe 2/3)
   Läuft einmal je Chunk über den Haken G.tileHooks in bild.js (keine Kosten pro Bild). Bricht die Wiederholung
   der Mustervorlagen mit Zufall aus den Weltkoordinaten: großflächige Patina, Flickwerk aus anderen Steinen,
   Putzreste, Eisenringe mit Rostfahnen, Steinmetzzeichen und Reliefs, je Gebiet eigene Spuren (Strichlisten der
   Gefangenen, Kreidezeichen im Weinkeller, helle Abdrücke abgehängter Gemälde, Tidenlinie mit Seepocken,
   Ammoniten im Seefels, Anlauffarben in der Glut …), Mauerblümchen und Flechten, Bröckelschutt am Wandfuß,
   gerundete Felskanten, Kleinkram auf Laufflächen, Risse und Eisenbänder in Stegen. Kein Blau. */
(function () {
  "use strict";
  const Z = window.Z, G = Z.gfx; if (!G || !G.tileHooks) return;
  const TAU = Math.PI * 2, PI = Math.PI;
  /* Patina je Gebiet: [dunkel (rgb), hell (rgb), Fuß-Tönung (rgb), Stärke] */
  const PAT = {
    castle: ["14,12,8", "236,226,206", "58,80,36", 1], ramparts: ["14,12,10", "240,232,214", "60,78,40", 1], storm: ["10,14,8", "226,232,214", "56,84,40", 1.1],
    spires: ["20,8,4", "255,214,170", "40,16,8", 1], camp: ["14,12,8", "236,226,206", "58,80,36", 0.8], passage: ["14,10,8", "236,220,200", "40,30,20", 0.6],
    cellar: ["10,8,6", "238,228,210", "70,72,40", 1.1], halls: ["16,6,6", "255,226,190", "40,14,10", 0.8], dungeon: ["6,10,4", "214,226,196", "52,74,24", 1.2],
    harbour: ["14,10,6", "236,232,214", "48,58,36", 1], belltower: ["12,8,6", "240,224,200", "40,30,20", 0.9], chasm: ["10,4,14", "226,206,240", "40,20,50", 1],
    lake: ["4,12,8", "206,236,214", "30,66,44", 1.1], embercity: ["14,4,2", "255,190,120", "80,24,8", 1], forge: ["12,6,4", "255,206,150", "60,24,10", 1]
  };
  const rgbOf = h => { const n = parseInt(h.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; };
  let tmp = null;
  function tmpCv(w, h) { if (!tmp) tmp = document.createElement("canvas"); if (tmp.width !== w || tmp.height !== h) { tmp.width = w; tmp.height = h; } return tmp; }
  /* Pfad aller Wandkacheln (bzw. Felskacheln) des Ausschnitts für einen Clip */
  function tilePath(H, pick, x0, y0, x1, y1) { const c = H.c, T = H.T; c.beginPath(); let any = false; for (let y = y0; y < y1; y++) { let s = -1; for (let x = x0; x <= x1; x++) { const on = x < x1 && pick(x, y); if (on && s < 0) s = x; else if (!on && s >= 0) { c.rect(s * T, y * T, (x - s) * T, T); any = true; s = -1; } } } return any; }
  /* großflächige Patina: weiche Farbwolken in Weltkoordinaten (8-px-Zellen, weich vergrößert) */
  function patina(H, rock) {
    const { c, x0, y0, x1, y1, T, B, vnoise, lv, PR } = H, P = PAT[B.bg] || PAT.castle, K = 4;
    const X0 = (x0 - 1) * T, Y0 = (y0 - 1) * T, w = (x1 - x0 + 2) * T / K, h = (y1 - y0 + 2) * T / K;
    const cv = tmpCv(w, h), g = cv.getContext("2d"), id = g.createImageData(w, h), d = id.data;
    const dk = P[0].split(",").map(Number), lt = P[1].split(",").map(Number), ft = P[2].split(",").map(Number), str = P[3] * (rock ? 0.7 : 1);
    const pick = rock ? (x, y) => H.inLv(x, y) && H.sol(x, y) && PR.dep[y * lv.W + x] <= 3 : H.isWall;
    let tyL = -1, txL = -1, on = false, fbL = 0;
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
      const wx = X0 + i * K + 2, wy = Y0 + j * K + 2, tx = (wx / T) | 0, ty = (wy / T) | 0;
      if (tx !== txL || ty !== tyL) { txL = tx; tyL = ty; on = pick(tx, ty); fbL = on && !rock ? H.floorBelow(tx, ty, 2) : 0; }
      if (!on) continue;
      const n = vnoise(wx / 150, wy / 110) * 0.6 + vnoise(wx / 47 + 11, wy / 39 + 5) * 0.3 + vnoise(wx / 13 + 3, wy / 11) * 0.1;
      const o = (j * w + i) * 4;
      let r = 0, gg = 0, b = 0, a = 0;
      if (n > 0.56) { r = dk[0]; gg = dk[1]; b = dk[2]; a = Math.min(0.42, (n - 0.56) * 1.6) * str; }
      else if (n < 0.36) { r = lt[0]; gg = lt[1]; b = lt[2]; a = Math.min(0.12, (0.36 - n) * 0.5) * str; }
      /* Fuß der Wand: feuchte, bemooste bzw. verrußte Zone (nur Wand) */
      if (fbL) { const dy = fbL * T - (wy - ty * T); const k = Math.max(0, 1 - dy / 30) * (0.2 + vnoise(wx / 20, 3.3) * 0.3) * str; if (k > a * 0.8) { r = ft[0]; gg = ft[1]; b = ft[2]; a = Math.max(a, k); } }
      d[o] = r; d[o + 1] = gg; d[o + 2] = b; d[o + 3] = a * 255;
    }
    g.putImageData(id, 0, 0);
    c.imageSmoothingEnabled = true; c.drawImage(cv, 0, 0, w, h, X0, Y0, w * K, h * K);
  }
  /* unregelmäßiger Umriss (für Flickwerk und Putz) */
  function blob(c, cx, cy, rx, ry, seed, H, n) { n = n || 9; c.beginPath(); for (let k = 0; k <= n; k++) { const a = k / n * TAU, q = 0.72 + H.hash(seed * 7 + k % n, seed) * 0.5, x = cx + Math.cos(a) * rx * q, y = cy + Math.sin(a) * ry * q; k ? c.lineTo(x, y) : c.moveTo(x, y); } c.closePath(); }
  function rustStreak(c, x, y, len, w) { const g = c.createLinearGradient(0, y, 0, y + len); g.addColorStop(0, "rgba(120,52,20,.45)"); g.addColorStop(1, "rgba(120,52,20,0)"); c.fillStyle = g; c.beginPath(); c.moveTo(x - w / 2, y); c.lineTo(x + w / 2, y); c.lineTo(x + w * 0.2, y + len); c.lineTo(x - w * 0.15, y + len); c.fill(); }
  function iron(c, x, y, kind) {
    rustStreak(c, x, y + 2, 14, 3);
    c.fillStyle = "#1a1614"; c.fillRect(x - 2.5, y - 2.5, 5, 5); c.fillStyle = "#4a4240"; c.fillRect(x - 2.5, y - 2.5, 5, 0.8); c.fillStyle = "#6a3a20"; c.fillRect(x - 1.5, y + 1, 1, 1);
    if (kind === 0) { c.strokeStyle = "#2a2422"; c.lineWidth = 1.3; c.beginPath(); c.arc(x, y + 5.5, 4, 0, TAU); c.stroke(); c.strokeStyle = "rgba(200,180,160,.35)"; c.lineWidth = 0.5; c.beginPath(); c.arc(x, y + 5.5, 4, Math.PI * 1.1, Math.PI * 1.6); c.stroke(); }
    else if (kind === 1) { c.strokeStyle = "#2a2422"; c.lineWidth = 1.2; c.beginPath(); c.moveTo(x, y); c.lineTo(x, y + 6); c.quadraticCurveTo(x, y + 9, x + 3, y + 8); c.stroke(); }
    else { c.fillStyle = "#2a2422"; c.fillRect(x - 0.6, y, 1.2, 4); c.fillRect(x - 3, y + 3, 6, 1.2); }
  }
  function carve(c, H, cx, cy, s, g, hi) { c.strokeStyle = "rgba(0,0,0,.5)"; c.lineWidth = 0.8; H.runeGlyph(c, cx, cy, s, g); c.stroke(); c.strokeStyle = hi; c.lineWidth = 0.4; c.save(); c.translate(0.5, 0.5); H.runeGlyph(c, cx, cy, s, g); c.stroke(); c.restore(); }
  /* ---------- Rückwand ---------- */
  /* ---------- Bauabschnitte: großflächige Variation der Rückwand ----------
     Die Wand ist in senkrechte Abschnitte von 18–30 Kacheln geteilt (Grenzen aus dem Weltzufall). Ein Teil der Abschnitte
     ist in einem anderen Verband gemauert (Großquader, Bruchstein-Ausbesserung, ältere Fundamentsteine …), andere sind
     nur heller oder dunkler, wärmer oder kühler getönt; an den Grenzen steht ein Wandpfeiler, manche Abschnitte tragen ein
     Gurtgesims. So wiederholt sich die Mustervorlage nicht mehr über ganze Räume. */
  const SEC = 24;
  function secOf(x, h3) { let k = Math.floor(x / SEC); const b = k * SEC + ((h3(k, 0, 940) * 12) | 0) - 6; if (x < b) k--; return k; }
  function secBound(k, h3) { return k * SEC + ((h3(k, 0, 940) * 12) | 0) - 6; }
  function sections(H) {
    const { c, x0, y0, x1, y1, T, B, st, PAL, lit, mixH, rgba, h3, isWall } = H, wl = st.wall;
    const k0 = secOf(x0 - 1, h3), k1 = secOf(x1 + 1, h3);
    for (let k = k0; k <= k1; k++) {
      const st2 = h3(k, 1, 941), sx0 = Math.max(x0 - 1, secBound(k, h3)), sx1 = Math.min(x1 + 1, secBound(k + 1, h3)); if (sx1 <= sx0) continue;
      const kind = st2 < 0.4 ? 0 : st2 < 0.72 ? 1 : 2, warm = h3(k, 2, 942) < 0.5;
      const base = mixH(lit(B.wall, (h3(k, 3, 943) - 0.5) * 0.16), warm ? "#6a4632" : "#4a3a52", 0.12);
      const cols = [lit(base, -0.1), lit(base, -0.04), base, lit(base, 0.05)];
      for (let y = y0 - 1; y < y1 + 1; y++) for (let x = sx0; x < sx1; x++) {
        if (!isWall(x, y)) continue; const px = x * T, py = y * T; H.setCR(px, py, T, T);
        if (kind === 1 && wl !== "cave" && wl !== "panel" && wl !== "plank") {
          /* anderer Verband */
          const o = wl === "brick" ? { rowH: 8, bw: 16, off: 8, jit: 4, gap: 1, seed: 71 } : wl === "rubble" ? { rowH: 8, bw: 20, off: 10, jit: 2, gap: 1, seed: 72 } : wl === "slab" ? { rowH: 12, bw: 18, off: 9, jit: 3, gap: 1, seed: 73 } : { rowH: 16, bw: 30, off: 15, jit: 6, gap: 1, seed: 74 };
          c.fillStyle = B.brick; H.fr(c, px, py, T, T);
          H.masonry(c, Object.assign(o, { cols, hi: rgba(lit(base, 0.32), 0.5), hi2: rgba(lit(base, 0.2), 0.3), lo: "rgba(0,0,0,.32)", extra: H.chips }));
        } else if (kind === 2 || kind === 1) {
          /* nur Tönung: Abschnitt wärmer/kühler, heller/dunkler */
          c.fillStyle = warm ? "rgba(120,70,40,.08)" : "rgba(70,50,90,.09)"; H.fr(c, px, py, T, T);
          if (h3(k, 3, 943) < 0.4) { c.fillStyle = "rgba(0,0,0,.10)"; H.fr(c, px, py, T, T); }
        }
        /* Gurtgesims in manchen Abschnitten */
        if (kind && wl !== "cave" && h3(k, 4, 944) < 0.5 && ((y - 2) % 8 + 8) % 8 === 0 && !H.sol(x, y - 1)) {
          c.fillStyle = "rgba(0,0,0,.25)"; H.fr(c, px, py + 4, T, 2); c.fillStyle = PAL.stone; H.fr(c, px, py, T, 4); c.fillStyle = PAL.stoneHi; H.fr(c, px, py, T, 0.8); c.fillStyle = PAL.stoneLo; H.fr(c, px, py + 3.2, T, 0.8);
        }
      }
      /* Wandpfeiler an der Abschnittsgrenze */
      const bx = secBound(k, h3); if (wl !== "cave" && bx >= x0 - 1 && bx <= x1 + 1) for (let y = y0 - 1; y < y1 + 1; y++) {
        if (!isWall(bx, y) && !isWall(bx - 1, y)) continue; const px = bx * T, py = y * T; H.setCR(px - 8, py, 16, T);
        const pc = wl === "panel" ? mixH(B.wall, "#5a3a24", 0.5) : PAL.stone;
        c.fillStyle = "rgba(0,0,0,.28)"; H.fr(c, px + 5, py, 3, T); c.fillStyle = pc; H.fr(c, px - 5, py, 10, T); c.fillStyle = rgba(lit(pc, 0.3), 0.55); H.fr(c, px - 5, py, 1.2, T); c.fillStyle = "rgba(0,0,0,.2)"; H.fr(c, px + 3.5, py, 1.5, T);
        if (wl !== "panel") { c.fillStyle = "rgba(0,0,0,.22)"; H.fr(c, px - 5, py + (((y & 1) ? 10 : 2)), 10, 0.7); }
        if (H.sol(bx, y - 1) || H.sol(bx - 1, y - 1)) { c.fillStyle = lit(pc, 0.08); H.fr(c, px - 7, py, 14, 3); c.fillStyle = rgba(lit(pc, 0.35), 0.6); H.fr(c, px - 7, py + 3, 14, 0.7); }
      }
    }
  }
  function wall(H) {
    const { c, x0, y0, x1, y1, T, B, st, PAL, lit, mixH, rgba, h3, isWall, floorBelow } = H, bg = B.bg, wl = st.wall;
    sections(H);
    patina(H, false);
    setPieces(H);
    /* kein Clip nötig: Fels, Öffnungen und Himmel werden danach darübergemalt bzw. ausgeschnitten */
    c.save();
    const hiS = rgba(lit(B.wall, 0.4), 0.35);
    for (let y = y0 - 4; y < y1 + 4; y++) for (let x = x0 - 4; x < x1 + 4; x++) {
      if (!isWall(x, y)) continue;
      const px = x * T, py = y * T, r = h3(x, y, 211), r2 = h3(x, y, 212), r3 = h3(x, y, 213), fb = floorBelow(x, y, 3);
      /* Flickwerk: ein Fleck neuerer bzw. fremder Steine mit dunkler Mörtelkante */
      if (r < 0.011 && wl !== "cave" && wl !== "panel" && wl !== "plank") {
        const cx = px + 8, cy = py + 8, rx = 18 + r2 * 22, ry = 12 + r3 * 14, seed = x * 31 + y;
        c.save(); blob(c, cx, cy, rx, ry, seed, H); c.clip();
        const brickIn = wl === "ashlar" && r2 < 0.45, base = brickIn ? mixH(B.wall, "#6a3a2a", 0.2) : lit(B.wall, r3 < 0.5 ? 0.1 : -0.1);
        H.setCR(cx - rx * 1.3, cy - ry * 1.3, rx * 2.6, ry * 2.6);
        H.masonry(c, { rowH: brickIn ? 5 : 7, bw: brickIn ? 11 : 13, off: brickIn ? 5.5 : 6, jit: brickIn ? 0 : 3, gap: 1, seed: 40 + (seed & 7), cols: [lit(base, -0.08), base, lit(base, 0.06), lit(base, -0.03)], hi: rgba(lit(base, 0.35), 0.5), hi2: rgba(lit(base, 0.2), 0.25), lo: "rgba(0,0,0,.35)", extra: H.chips });
        c.restore();
        blob(c, cx, cy, rx, ry, seed, H); c.strokeStyle = "rgba(0,0,0,.45)"; c.lineWidth = 1.2; c.stroke(); c.strokeStyle = "rgba(255,240,220,.08)"; c.lineWidth = 0.5; c.save(); c.translate(-0.8, -0.8); c.stroke(); c.restore();
      }
      /* Putzreste auf Ziegeln und Fachwerk: helle Fläche mit abgeplatzter Kante */
      if ((wl === "brick" || wl === "timber") && r > 0.986) {
        const cx = px + 8, cy = py + 6, rx = 7 + r2 * 9, ry = 5 + r3 * 6, seed = x * 17 + y * 3, pc = mixH(lit(B.wall, -0.05), "#a89478", wl === "brick" ? 0.2 : 0.14);
        c.fillStyle = "rgba(0,0,0,.25)"; blob(c, cx + 0.8, cy + 1, rx, ry, seed, H, 11); c.fill();
        c.globalAlpha = 0.7; c.fillStyle = pc; blob(c, cx, cy, rx, ry, seed, H, 11); c.fill(); c.globalAlpha = 1;
        c.save(); c.clip();
        for (let k = 0; k < 26; k++) { c.fillStyle = k % 2 ? "rgba(0,0,0,.08)" : "rgba(255,250,240,.07)"; c.fillRect(cx - rx + h3(x, y, 300 + k) * rx * 2, cy - ry + h3(x, y, 330 + k) * ry * 2, 1 + h3(x, y, 360 + k) * 3, 1); }
        const g = c.createLinearGradient(0, cy - ry, 0, cy + ry); g.addColorStop(0, "rgba(255,250,240,.10)"); g.addColorStop(1, "rgba(0,0,0,.16)"); c.fillStyle = g; c.fillRect(cx - rx * 1.3, cy - ry * 1.3, rx * 2.6, ry * 2.6);
        /* Loch im Putz, durch das die Mauer schaut */
        if (r2 > 0.4) { c.strokeStyle = "rgba(0,0,0,.3)"; c.lineWidth = 0.5; c.beginPath(); c.moveTo(cx - rx * 0.5, cy - ry * 0.2); c.lineTo(cx - rx * 0.1, cy + ry * 0.1); c.lineTo(cx + rx * 0.2, cy - ry * 0.05); c.lineTo(cx + rx * 0.5, cy + ry * 0.3); c.stroke(); }
        c.restore();
        c.strokeStyle = rgba(lit(pc, 0.3), 0.5); c.lineWidth = 0.5; blob(c, cx - 0.4, cy - 0.4, rx, ry, seed, H, 11); c.stroke();
      }
      /* Eisen in der Wand: Ring, Haken oder Kloben mit Rostfahne */
      if (r > 0.02 && r < 0.03 && wl !== "cave") iron(c, px + 4 + r2 * 8, py + 3 + r3 * 6, (r2 * 3) | 0);
      /* Steinmetzzeichen */
      if (r > 0.03 && r < 0.05 && (wl === "ashlar" || wl === "slab" || wl === "rubble")) carve(c, H, px + 8, py + 8, 2.4, r2, hiS);
      /* Relief: Rosette oder Wappenstein */
      if (r > 0.05 && r < 0.056 && (bg === "castle" || bg === "halls" || bg === "spires" || bg === "ramparts" || bg === "forge") && isWall(x + 1, y) && isWall(x, y + 1)) {
        const cx = px + 16, cy = py + 14, s = PAL.stone;
        c.fillStyle = "rgba(0,0,0,.4)"; c.beginPath(); c.arc(cx + 1, cy + 1.2, 9, 0, TAU); c.fill(); c.fillStyle = s; c.beginPath(); c.arc(cx, cy, 9, 0, TAU); c.fill();
        c.strokeStyle = PAL.stoneHi; c.lineWidth = 0.7; c.beginPath(); c.arc(cx, cy, 8.4, Math.PI * 0.9, Math.PI * 1.8); c.stroke();
        if (r2 < 0.5) { for (let k = 0; k < 8; k++) { const a = k / 8 * TAU; c.fillStyle = k % 2 ? PAL.stoneLo : lit(s, 0.12); c.beginPath(); c.ellipse(cx + Math.cos(a) * 4.5, cy + Math.sin(a) * 4.5, 3, 1.6, a, 0, TAU); c.fill(); } c.fillStyle = PAL.stoneHi; c.beginPath(); c.arc(cx, cy, 1.8, 0, TAU); c.fill(); }
        else { c.fillStyle = PAL.stoneLo; c.beginPath(); c.moveTo(cx - 5, cy - 5); c.lineTo(cx + 5, cy - 5); c.lineTo(cx + 5, cy + 1); c.quadraticCurveTo(cx + 5, cy + 5, cx, cy + 7); c.quadraticCurveTo(cx - 5, cy + 5, cx - 5, cy + 1); c.closePath(); c.fill(); c.strokeStyle = PAL.stoneHi; c.lineWidth = 0.5; c.stroke(); c.fillStyle = "rgba(255,230,190,.18)"; c.fillRect(cx - 0.6, cy - 4, 1.2, 9); c.fillRect(cx - 4, cy - 1, 8, 1.2); }
        if (h3(x, y, 9) < 0.5) { c.strokeStyle = "rgba(0,0,0,.55)"; c.lineWidth = 0.6; c.beginPath(); c.moveTo(cx + 3, cy - 9); c.lineTo(cx + 1, cy - 3); c.lineTo(cx + 4, cy + 2); c.stroke(); }
      }
      /* ---- je Gebiet ---- */
      if (bg === "dungeon" && fb && fb <= 2 && r3 < 0.06) {
        /* Strichlisten der Gefangenen, dazu manchmal ein Strichmännchen oder eine Sonne */
        c.strokeStyle = "rgba(225,220,200,.28)"; c.lineWidth = 0.5; const gx = px + 2, gy = py + 4; const n = 1 + ((r2 * 4) | 0);
        c.beginPath(); for (let k = 0; k < n; k++) { const bx = gx + k * 6; for (let i = 0; i < 4; i++) { c.moveTo(bx + i * 1.2, gy); c.lineTo(bx + i * 1.2 + 0.3, gy + 5); } c.moveTo(bx - 0.6, gy + 4); c.lineTo(bx + 4.4, gy + 1); } c.stroke();
        if (r2 > 0.7) { c.beginPath(); c.arc(gx + 4, gy + 10, 1.4, 0, TAU); c.moveTo(gx + 4, gy + 11.4); c.lineTo(gx + 4, gy + 15); c.moveTo(gx + 2, gy + 12.5); c.lineTo(gx + 6, gy + 12.5); c.moveTo(gx + 4, gy + 15); c.lineTo(gx + 2.6, gy + 17.5); c.moveTo(gx + 4, gy + 15); c.lineTo(gx + 5.4, gy + 17.5); c.stroke(); }
        else if (r2 < 0.15) { c.beginPath(); c.arc(gx + 6, gy + 11, 2.4, 0, TAU); for (let k = 0; k < 8; k++) { const a = k / 8 * TAU; c.moveTo(gx + 6 + Math.cos(a) * 3.4, gy + 11 + Math.sin(a) * 3.4); c.lineTo(gx + 6 + Math.cos(a) * 5, gy + 11 + Math.sin(a) * 5); } c.stroke(); }
      }
      if (bg === "dungeon" && r3 > 0.97) { /* Fesseln an der Wand */ iron(c, px + 5, py + 4, 0); iron(c, px + 12, py + 4, 0); c.strokeStyle = "#2a2422"; c.lineWidth = 0.8; c.beginPath(); c.moveTo(px + 5, py + 9.5); c.quadraticCurveTo(px + 8.5, py + 15, px + 12, py + 9.5); c.stroke(); }
      if (bg === "cellar" && r3 < 0.016) {
        /* Kreidezeichen der Kellermeister: Zählstriche, Jahreszahl-Kringel, Kreuz */
        c.strokeStyle = "rgba(240,236,224,.17)"; c.lineWidth = 0.5; c.beginPath(); const gx = px + 3, gy = py + 5, k = (r2 * 4) | 0;
        if (k === 0) { for (let i = 0; i < 5; i++) { c.moveTo(gx + i * 1.6, gy); c.lineTo(gx + i * 1.6, gy + 5); } c.moveTo(gx - 1, gy + 3); c.lineTo(gx + 8, gy + 1.5); }
        else if (k === 1) { c.arc(gx + 4, gy + 3, 3, 0, TAU); c.moveTo(gx + 2.5, gy + 1.5); c.lineTo(gx + 5.5, gy + 4.5); c.moveTo(gx + 5.5, gy + 1.5); c.lineTo(gx + 2.5, gy + 4.5); }
        else if (k === 2) { c.moveTo(gx, gy); c.lineTo(gx + 3, gy + 6); c.lineTo(gx + 6, gy); c.moveTo(gx + 8, gy); c.lineTo(gx + 8, gy + 6); c.moveTo(gx + 10, gy); c.lineTo(gx + 10, gy + 6); }
        else { c.moveTo(gx + 4, gy - 1); c.lineTo(gx + 4, gy + 7); c.moveTo(gx + 1, gy + 2); c.lineTo(gx + 7, gy + 2); }
        c.stroke();
      }
      if ((bg === "cellar" || bg === "castle" || bg === "dungeon") && fb === 1 && r2 < 0.35) {
        /* Ausblühungen: weißes Salz am Mauerfuß */
        for (let k = 0; k < 9; k++) { c.fillStyle = "rgba(236,232,220," + (0.06 + h3(x, y, 400 + k) * 0.12).toFixed(2) + ")"; c.fillRect(px + h3(x, y, 410 + k) * 16, py + 10 + h3(x, y, 420 + k) * 6, 1 + h3(x, y, 430 + k) * 3, 0.8); }
      }
      if (bg === "halls" && r > 0.94 && r < 0.955 && isWall(x + 1, y) && isWall(x, y + 1) && isWall(x + 1, y + 1)) {
        /* heller Abdruck eines abgehängten Gemäldes, der Nagel steckt noch */
        const w = 18 + r2 * 10, h = 14 + r3 * 8, gx = px + 4, gy = py + 6;
        c.fillStyle = "rgba(255,236,200,.07)"; c.fillRect(gx, gy, w, h); c.strokeStyle = "rgba(0,0,0,.18)"; c.lineWidth = 0.6; c.strokeRect(gx, gy, w, h);
        c.fillStyle = "rgba(255,236,200,.05)"; c.fillRect(gx + 1.5, gy + 1.5, w - 3, h - 3);
        c.fillStyle = "#1a1210"; c.fillRect(gx + w / 2 - 0.6, gy - 4, 1.2, 1.2); c.strokeStyle = "rgba(255,236,200,.12)"; c.beginPath(); c.moveTo(gx + w / 2, gy - 3.4); c.lineTo(gx + 2, gy); c.moveTo(gx + w / 2, gy - 3.4); c.lineTo(gx + w - 2, gy); c.stroke();
      }
      if (bg === "harbour") {
        /* Tidenlinie mit Salzkruste und Seepocken knapp über dem Boden */
        if (fb === 1) { const ly = py + 6 + Math.sin(px * 0.05) * 1.2; c.fillStyle = "rgba(10,14,8,.22)"; c.fillRect(px, ly, T, T - 6); c.fillStyle = "rgba(230,226,210,.18)"; c.fillRect(px, ly - 0.8, T, 0.8); for (let k = 0; k < 4; k++) if (h3(x, y, 440 + k) < 0.5) { const bx = px + h3(x, y, 450 + k) * 15, by = ly + 3 + h3(x, y, 460 + k) * 6; c.fillStyle = "#8a8478"; c.beginPath(); c.arc(bx, by, 1.1, 0, TAU); c.fill(); c.fillStyle = "#2a2622"; c.fillRect(bx - 0.3, by - 0.3, 0.6, 0.6); } }
        if (r3 > 0.965) { /* Teerfleck */ c.fillStyle = "rgba(8,6,4,.5)"; blob(c, px + 8, py + 8, 4 + r2 * 3, 3 + r2 * 2, x + y * 9, H, 7); c.fill(); c.fillRect(px + 7, py + 10, 1, 4 + r2 * 6); }
      }
      if (bg === "belltower" && H.sol(x, y - 1) && r3 < 0.12) { /* Vogeldreck unter Balken */ c.fillStyle = "rgba(236,230,220,.35)"; const bx = px + 3 + r2 * 10; c.fillRect(bx, py, 1.2, 3 + r * 40 % 6); c.beginPath(); c.arc(bx + 0.6, py + 4 + r * 40 % 6, 1, 0, TAU); c.fill(); }
      if (bg === "belltower" && r3 > 0.975) { /* eingeritztes Herz mit Buchstaben */ c.strokeStyle = "rgba(255,230,200,.22)"; c.lineWidth = 0.5; const hx = px + 8, hy = py + 7; c.beginPath(); c.moveTo(hx, hy + 4); c.bezierCurveTo(hx - 6, hy, hx - 3, hy - 4, hx, hy - 1.5); c.bezierCurveTo(hx + 3, hy - 4, hx + 6, hy, hx, hy + 4); c.moveTo(hx - 2, hy - 0.5); c.lineTo(hx - 2, hy + 1.5); c.moveTo(hx + 1.2, hy - 0.5); c.lineTo(hx + 2.4, hy + 1.5); c.stroke(); }
      if (bg === "chasm") {
        if (r3 < 0.03) { /* Krallenspuren */ c.strokeStyle = "rgba(0,0,0,.45)"; c.lineWidth = 0.9; c.beginPath(); for (let k = 0; k < 3; k++) { c.moveTo(px + 3 + k * 3, py + 2); c.quadraticCurveTo(px + 5 + k * 3, py + 8, px + 4 + k * 3, py + 14); } c.stroke(); c.strokeStyle = "rgba(230,214,240,.15)"; c.lineWidth = 0.4; c.beginPath(); for (let k = 0; k < 3; k++) { c.moveTo(px + 3.8 + k * 3, py + 2); c.quadraticCurveTo(px + 5.8 + k * 3, py + 8, px + 4.8 + k * 3, py + 14); } c.stroke(); }
        if (r3 > 0.96) { /* Seidentuch: dünne Spinnenseide über der Wand */ const g = c.createLinearGradient(px, py, px, py + 30); g.addColorStop(0, "rgba(236,228,244,.16)"); g.addColorStop(1, "rgba(236,228,244,0)"); c.fillStyle = g; c.beginPath(); c.moveTo(px - 4, py); c.quadraticCurveTo(px + 8, py + 34 * r2 + 10, px + 22, py); c.fill(); c.strokeStyle = "rgba(240,232,248,.18)"; c.lineWidth = 0.4; c.beginPath(); for (let k = 0; k < 5; k++) { c.moveTo(px - 2 + k * 5, py); c.lineTo(px + 2 + k * 4, py + 10 + k % 2 * 6); } c.stroke(); }
      }
      if (bg === "lake") {
        if (r3 < 0.018) { /* Ammonit im Fels */ const cx = px + 8, cy = py + 8; c.strokeStyle = "rgba(0,0,0,.4)"; c.lineWidth = 0.8; c.beginPath(); for (let a = 0; a < 15; a += 0.3) { const rr = 0.4 + a * 0.36, xx = cx + Math.cos(a) * rr, yy = cy + Math.sin(a) * rr * 0.9; a ? c.lineTo(xx, yy) : c.moveTo(xx, yy); } c.stroke(); c.strokeStyle = "rgba(220,240,226,.2)"; c.lineWidth = 0.4; c.beginPath(); for (let a = 0; a < 15; a += 0.3) { const rr = 0.4 + a * 0.36, xx = cx + 0.5 + Math.cos(a) * rr, yy = cy - 0.4 + Math.sin(a) * rr * 0.9; a ? c.lineTo(xx, yy) : c.moveTo(xx, yy); } c.stroke(); for (let k = 0; k < 10; k++) { const a = k * 1.4, rr = 1 + a * 0.36; c.strokeStyle = "rgba(0,0,0,.25)"; c.beginPath(); c.moveTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr * 0.9); c.lineTo(cx + Math.cos(a) * (rr + 1.6), cy + Math.sin(a) * (rr + 1.6) * 0.9); c.stroke(); } }
        if (r3 > 0.94) { /* Quarzader mit Glitzern */ c.strokeStyle = "rgba(230,240,226,.11)"; c.lineWidth = 0.8; c.beginPath(); let xx = px, yy = py + r2 * 16; c.moveTo(xx, yy); for (let k = 0; k < 5; k++) { xx += 4 + h3(x, y, 470 + k) * 4; yy += (h3(x, y, 480 + k) - 0.5) * 7; c.lineTo(xx, yy); } c.stroke(); c.fillStyle = "rgba(255,255,240,.6)"; c.fillRect(px + 5 + r2 * 8, py + r2 * 16, 0.8, 0.8); }
        if (r2 < 0.05) { /* nasser Glanz */ const g = c.createLinearGradient(0, py, 0, py + 26); g.addColorStop(0, "rgba(200,240,220,.10)"); g.addColorStop(1, "rgba(200,240,220,0)"); c.fillStyle = g; c.fillRect(px + 4 + r * 80 % 8, py, 2.5, 26); }
      }
      if ((bg === "embercity" || bg === "forge" || bg === "spires") && r3 < 0.025) {
        /* Anlauffarben: Hitzehof in Strohgold, Kupfer und Purpur */
        const cx = px + 8, cy = py + 8, R = 10 + r2 * 10, g = c.createRadialGradient(cx, cy, 0, cx, cy, R);
        g.addColorStop(0, "rgba(255,214,140,.14)"); g.addColorStop(0.45, "rgba(214,120,60,.12)"); g.addColorStop(0.75, "rgba(130,60,120,.12)"); g.addColorStop(1, "rgba(130,60,120,0)"); c.fillStyle = g; c.fillRect(cx - R, cy - R, R * 2, R * 2);
      }
      if (bg === "forge" && r3 > 0.97 && isWall(x + 1, y)) { /* genietete Eisenplatte */ const gx = px + 2, gy = py + 2, w = 24, h = 12; c.fillStyle = "rgba(0,0,0,.4)"; c.fillRect(gx + 1, gy + 1, w, h); c.fillStyle = "#3a3230"; c.fillRect(gx, gy, w, h); c.fillStyle = "#5a504a"; c.fillRect(gx, gy, w, 0.8); c.fillStyle = "rgba(120,52,20,.35)"; c.fillRect(gx + 3, gy + h - 3, w - 8, 2); c.fillStyle = "#6a605a"; for (const [ax, ay] of [[2, 2], [w - 3, 2], [2, h - 3], [w - 3, h - 3]]) c.fillRect(gx + ax, gy + ay, 1.2, 1.2); }
      if ((bg === "castle" || bg === "ramparts" || bg === "storm" || bg === "camp") && r3 > 0.93) {
        /* Flechten: goldgelbe und rostrote Krusten draußen */
        const cx = px + r2 * 16, cy = py + r * 300 % 16; for (let k = 0; k < 7; k++) { c.fillStyle = k % 3 === 0 ? "rgba(214,168,60,.32)" : k % 3 === 1 ? "rgba(190,110,50,.26)" : "rgba(220,200,140,.22)"; c.beginPath(); c.arc(cx + (h3(x, y, 490 + k) - 0.5) * 7, cy + (h3(x, y, 500 + k) - 0.5) * 5, 0.8 + h3(x, y, 510 + k) * 1.6, 0, TAU); c.fill(); }
      }
      if ((bg === "castle" || bg === "ramparts" || bg === "storm" || bg === "dungeon" || bg === "camp") && r2 > 0.975 && !H.sol(x, y + 1)) {
        /* Mauerblümchen: Gras und Blüten wachsen aus einer Fuge */
        const jx = px + 4 + r * 400 % 8, jy = py + 8; c.strokeStyle = "#3e5a28"; c.lineWidth = 0.6; c.beginPath(); for (let k = 0; k < 6; k++) { const a = -Math.PI / 2 + (k - 2.5) * 0.32; c.moveTo(jx, jy); c.quadraticCurveTo(jx + Math.cos(a) * 3, jy + Math.sin(a) * 3 - 1, jx + Math.cos(a) * (4 + k % 2 * 2), jy + Math.sin(a) * (4 + k % 2 * 2) + 1.5); } c.stroke();
        if (bg !== "dungeon") { const fc = ["#e8c050", "#d8607a", "#ece4d6", "#b07ac8"][(r3 * 40 | 0) % 4]; for (let k = 0; k < 3; k++) { c.fillStyle = fc; c.beginPath(); c.arc(jx - 3 + k * 3, jy - 5 + (k % 2) * 1.5, 0.9, 0, TAU); c.fill(); } }
        c.fillStyle = "rgba(0,0,0,.4)"; c.fillRect(jx - 2, jy, 4, 0.8);
      }
      /* Bröckelschutt am Wandfuß (Übergang Wand → Boden) */
      if (fb === 1 && r < 0.3 && wl !== "panel") {
        const n = 2 + ((r2 * 5) | 0), base = (y + 1) * T;
        for (let k = 0; k < n; k++) { const sx = px + h3(x, y, 520 + k) * 16, s = 0.8 + h3(x, y, 530 + k) * 1.8; c.fillStyle = "rgba(0,0,0,.35)"; c.fillRect(sx - s, base - 0.6, s * 2.2, 0.8); c.fillStyle = PAL.wallCols[(h3(x, y, 540 + k) * 5) | 0]; c.beginPath(); c.moveTo(sx - s, base); c.lineTo(sx - s * 0.4, base - s * 1.2); c.lineTo(sx + s * 0.7, base - s); c.lineTo(sx + s, base); c.fill(); c.fillStyle = PAL.wHi; c.fillRect(sx - s * 0.4, base - s * 1.2, s, 0.5); }
      }
    }
    c.restore();
  }
  /* ---------- Rücklagen-Architektur: große Schaustücke an freien Wandflächen ----------
     Auf einem groben Raster (8×6 Kacheln) bekommt jede Zelle mit etwas Glück ein Schaustück, das ganz auf freier
     Wand liegen muss (keine Öffnung, kein Wandschmuck): Wandteppiche, Statuen in Nischen, Treppen im Hintergrund,
     Weinregale, Zellengitter, Glocken, Zahnräder, Spanten, Kokons, versunkene Säulen, Duergar-Gesichter, Esse-Hauben,
     Schilde und Ahnengalerie. Gedämpfte Farben, damit es Rückwand bleibt. */
  const GX = 8, GY = 6;
  const PIECES = {
    castle: ["tapestry", "statue", "stairs", "shields"], ramparts: ["shields", "statue", "stairs"], storm: ["statue", "shields"], camp: [],
    spires: ["tapestry", "statue", "chimney"], halls: ["tapestry", "gallery", "statue", "stairs"], cellar: ["rack", "stairs", "rack"], passage: ["tapestry"],
    dungeon: ["cell", "stairs", "cell"], harbour: ["ribs", "nets"], belltower: ["bell", "gear", "stairs"], chasm: ["cocoon", "cocoon"],
    lake: ["ruin", "ruin"], embercity: ["face", "chimney"], forge: ["chimney", "face", "shields"]
  };
  const SIZE = { tapestry: [2, 4], statue: [2, 4, 1], stairs: [6, 4, 1], shields: [3, 2], gallery: [4, 2], rack: [3, 3, 1], cell: [3, 3], ribs: [5, 3, 1], nets: [3, 3], bell: [3, 3], gear: [3, 3], cocoon: [2, 4], ruin: [3, 4, 1], face: [3, 3], chimney: [3, 5, 1] };
  let decSet = null, decLv = null;
  let decProps = null;
  function decorSet(lv) {
    /* Wandschmuck aus ausstattung.js (Pfannen, Regale …) ebenfalls freihalten – die Liste kann nach dem ersten Chunk kommen */
    const pr = Z.ausstattung ? Z.ausstattung() : null;
    if (decLv === lv && decSet && decProps === pr) return decSet; decLv = lv; decProps = pr; decSet = new Set();
    for (const d of lv.decor || []) for (let dy = -2; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) decSet.add((d.y + dy) * lv.W + d.x + dx);
    if (pr) for (const p of pr) if (p.wall) { const hw = Math.ceil((p.w || 1) / 2); for (let dy = -2; dy <= 1; dy++) for (let dx = -hw; dx <= hw; dx++) decSet.add((Math.round(p.y) + dy) * lv.W + Math.round(p.x) + dx); }
    return decSet;
  }
  /* Raumfunktion (welt.js assignRooms → lv.roomFns) an einer Kachel – nur intern; öffentlich gelten
     Z.raumTyp(cx, cy) (Zellen) und Z.raumTypAt(tx, ty) (Kacheln) aus welt.js */
  const raumTyp = (lv, tx, ty) => { const f = lv && lv.roomFns; return f ? f[Math.floor(tx / Z.CW) + "," + Math.floor(ty / Z.CH)] || null : null; };
  /* Liste der platzierten Raumstücke (Kacheln) für die Belebung in Runde 7; entsteht beim ersten Chunk */
  Z.raumStuecke = () => (rpLv === Z.level && rpList) || [];
  /* Schaustücke nach Raumfunktion: hier hängt, was in diesen Raum gehört (Bücherwände in der Bibliothek, Glasfenster in
     der Kapelle, Kupfertöpfe am Küchenkamin …). Räume ohne Eintrag nehmen die Gebietsliste. */
  const ROOMPIECE = {
    wachstube: ["waffen", "schluessel", "shields"], stall: ["hufeisen", "hufeisen", "seile"], unterstand: ["waffen", "hufeisen"], uebungsplatz: ["zielscheibe", "waffen", "zielscheibe"],
    schuppen: ["faesser", "seile"], kueche: ["kamin", "kupfer", "kamin", "kupfer"], weinkeller: ["faesser", "rack", "faesser"], vorratskammer: ["faesser", "teller"],
    gesindestube: ["teller", "kamin"], brunnenkammer: ["seile", "relief"], bankettsaal: ["kamin", "glasfenster", "tapestry", "gallery"], anrichte: ["teller", "kupfer"],
    bibliothek: ["buecherwand", "buecherwand", "buecherwand", "spiegel"], kapelle: ["glasfenster", "altarbild", "glasfenster", "statue"], ahnengalerie: ["gallery", "spiegel", "gallery"],
    schlafgemach: ["spiegel", "tapestry", "kamin"], ruestkammer: ["waffen", "shields", "waffen"], geschuetzstand: ["kugeln", "shields"], kaserne: ["waffen", "shields", "schluessel"],
    schuetzenstand: ["waffen", "zielscheibe"], waerterstube: ["schluessel", "waffen"], zellenblock: ["kerker", "cell", "kerker"], folterkammer: ["folter", "kerker", "folter"],
    gebeinhaus: ["schaedel", "schaedel"], lagerhaus: ["faesser", "seile", "faesser"], bootsschuppen: ["ribs", "nets", "seile"], taverne: ["wirtsschild", "krugbord", "faesser", "krugbord"],
    fischerkate: ["nets", "seile"], zollstube: ["waage", "schluessel"], glockenstube: ["bell", "uhr"], uhrwerk: ["uhr", "gear", "uhr"], uhrmacher: ["uhr", "gear"],
    taubenschlag: ["tauben", "tauben"], seilkammer: ["seile", "seile"], brutkammer: ["eier", "eier", "cocoon"], beutelager: ["cocoon", "eier"], pilzgrotte: ["riesenpilze", "riesenpilze"],
    kristallhoehle: ["kristall", "kristall"], essenhalle: ["chimney", "gussform"], giesserei: ["gussform", "chimney", "gussform"], erzlager: ["erz", "erz"], waffenkammer: ["waffen", "shields", "waffen"],
    runenkammer: ["runenstein", "runenstein"], wehrturm: ["shields", "waffen"], speiergalerie: ["statue", "statue"], tempel: ["relief", "relief", "ruin"], opferstaette: ["relief", "altarbild"],
    wrackhalde: ["ribs", "ribs"], korallengarten: ["korallen", "korallen"], schrein: ["face", "runenstein"], schlackehalde: ["chimney", "erz"], giftgarten: ["ranken", "ranken"],
    truemmerhalle: ["ruin", "statue"], geheim: ["spiegel", "runenstein"], schatz: ["shields", "gallery", "spiegel"]
  };
  function fits(H, ox, oy, w, h, stand, dec) {
    const W = H.lv.W;
    for (let y = oy; y < oy + h; y++) for (let x = ox; x < ox + w; x++) if (!H.isWall(x, y) || dec.has(y * W + x)) return false;
    if (stand) for (let x = ox; x < ox + w; x++) { const v = H.lv.get(x, oy + h); if (!(H.solidV(v) || H.isPlatV(v))) return false; }
    return true;
  }
  /* Raumplan: je Raum mit Funktion werden einmal pro Karte bis zu drei passende Stellen für seine Schaustücke gesucht
     (ganzer Raum, notfalls kleinere Fassung des Stücks). Das Ergebnis gilt für alle Chunks gleich. */
  let rpLv = null, rpProps = null, rpList = null;
  /* Räume ohne Funktion (Gänge, Treppenhäuser, Parcours) bekommen je Gebiet eigenen Charakter: Gangfresken, blinde
     Bogengänge, Wendeltreppen im Hintergrund, Wimpelketten – gemischt mit den Gebietsstücken */
  const GANG = {
    castle: ["fresko", "bogengang", "wendeltreppe", "tapestry", "shields"], ramparts: ["wimpel", "bogengang", "wendeltreppe", "shields"], storm: ["bogengang", "statue", "fresko"],
    halls: ["fresko", "bogengang", "wendeltreppe", "tapestry", "gallery"], spires: ["bogengang", "wendeltreppe", "tapestry"], cellar: ["bogengang", "wendeltreppe", "rack"],
    dungeon: ["bogengang", "wendeltreppe", "cell", "fresko"], harbour: ["wimpel", "nets", "ribs"], belltower: ["wendeltreppe", "gear", "bell", "wimpel"],
    forge: ["bogengang", "chimney", "face"], lake: ["ruin", "relief"], chasm: ["cocoon", "eier"], embercity: ["face", "chimney", "bogengang"], passage: ["tapestry", "fresko"]
  };
  /* stehende Stücke, die notfalls auch auf Kragsteinen an der Wand hängen dürfen (Bücherbord, Waffenbrett) */
  const FLOATOK = { buecherwand: 1, waffen: 1, krugbord: 1 };
  function roomPlan(H, dec) {
    const lv = H.lv;
    if (rpLv === lv && rpProps === decProps && rpList) return rpList;
    rpLv = lv; rpProps = decProps; rpList = []; const tRP = performance.now();
    if (lv.hub || lv.arena || !lv.roomFns) return rpList;
    const CW = Z.CW, CH = Z.CH, h3 = H.h3, taken = [];
    const free = (ox, oy, w, h) => !taken.some(t => ox < t[0] + t[2] + 1 && ox + w + 1 > t[0] && oy < t[1] + t[3] + 1 && oy + h + 1 > t[1]);
    const gang = GANG[H.B.bg], wk = lv.warden && lv.warden.cell ? lv.warden.cell.x + "," + lv.warden.cell.y : null;
    for (const k in (lv.cells || lv.roomFns)) {
      const fn = lv.roomFns[k], rl = fn ? ROOMPIECE[fn] : k !== wk ? gang : null; if (!rl) continue;
      const [cx, cy] = k.split(",").map(Number), rx = cx * CW, ry = cy * CH;
      const want = fn ? 2 + (h3(cx, cy, 905) < 0.5 ? 1 : 0) : 1 + (h3(cx, cy, 905) < 0.6 ? 1 : 0); let got = 0;
      for (let i = 0; i < rl.length * 2 && got < want; i++) {
        const kind = rl[(i + ((h3(cx, cy, 906) * rl.length) | 0)) % rl.length], sz = SIZE[kind]; if (!sz || !PIECE[kind]) continue;
        const stand = !!sz[2], sizes = [[sz[0], sz[1]], [sz[0], sz[1] - 1], [sz[0] - 1, sz[1]], [sz[0] - 1, sz[1] - 1]].filter(s => s[0] >= 2 && s[1] >= 2);
        let hit = null;
        for (const [w, h, fl] of FLOATOK[kind] ? sizes.concat(sizes.map(s => [s[0], s[1], 1]), [[sz[0], 2, 1], [sz[0] - 1, 2, 1]]) : sizes) {
          const nx = CW - w - 1, ny = CH - h + 1, sx = (h3(cx, cy, 907 + i) * nx) | 0;
          for (let j = 0; j < nx * ny && !hit; j++) {
            const ox = rx + 1 + (sx + (j % nx)) % nx, oy = ry + ((j / nx) | 0);
            if (free(ox, oy, w, h) && fits(H, ox, oy, w, h, stand && !fl, dec)) hit = [ox, oy, w, h, fl];
          }
          if (hit) break;
        }
        if (hit) { taken.push(hit); rpList.push({ kind, x: hit[0], y: hit[1], w: hit[2], h: hit[3], r: h3(hit[0], hit[1], 904), fn: fn || "gang", fl: !!hit[4] }); got++; }
      }
    }
    G.rpMs = +(performance.now() - tRP).toFixed(2);
    return rpList;
  }
  function setPieces(H) {
    const { x0, y0, x1, y1, B, h3, lv, T } = H, list0 = PIECES[B.bg];
    const dec = decorSet(lv), useRoom = !lv.hub && !lv.arena;
    const draw = (kind, ox, oy, w, h, r, fn) => { if (Z.gfx.pieceLog) Z.gfx.pieceLog.push([kind, fn, ox, oy]); H.c.save(); try { PIECE[kind](H.c, ox * T, oy * T, w * T, h * T, H, r); } catch (e) { console.error(e); } H.c.restore(); };
    if (useRoom) for (const p of roomPlan(H, dec)) if (!(p.x + p.w < x0 - 1 || p.x > x1 + 1 || p.y + p.h < y0 - 1 || p.y > y1 + 1)) {
      draw(p.kind, p.x, p.y, p.w, p.h, p.r, p.fn);
      if (p.fl) { const c = H.c, by = (p.y + p.h) * T, P = H.PAL; for (const bx of [p.x * T + 5, (p.x + p.w) * T - 11]) { c.fillStyle = "rgba(0,0,0,.35)"; c.beginPath(); c.moveTo(bx + 1, by); c.lineTo(bx + 7, by); c.lineTo(bx + 4, by + 8); c.fill(); c.fillStyle = P.stone; c.beginPath(); c.moveTo(bx, by - 1); c.lineTo(bx + 6, by - 1); c.lineTo(bx + 6, by + 1); c.quadraticCurveTo(bx + 2, by + 2, bx + 1, by + 7); c.lineTo(bx, by + 7); c.fill(); c.fillStyle = P.stoneHi; c.fillRect(bx, by - 1, 6, 0.6); } }
    }
    if (!list0 || !list0.length) return;
    for (let gy = Math.floor(y0 / GY) - 1; gy * GY < y1 + 1; gy++) for (let gx = Math.floor(x0 / GX) - 1; gx * GX < x1 + 1; gx++) {
      /* Räume mit eigenem Satz bekommen keine Gebietsstücke dazu */
      const tcx = gx * GX + GX / 2, tcy = gy * GY + GY / 2, fn = useRoom ? raumTyp(lv, tcx, tcy) : null; if (fn && ROOMPIECE[fn]) continue;
      if (useRoom && GANG[B.bg] && lv.cells && lv.cells[Math.floor(tcx / Z.CW) + "," + Math.floor(tcy / Z.CH)]) continue;
      if (h3(gx, gy, 900) > 0.42) continue;
      const kind = list0[(h3(gx, gy, 901) * list0.length) | 0], sz = SIZE[kind]; if (!sz || !PIECE[kind]) continue; const w = sz[0], h = sz[1], stand = !!sz[2];
      const ox = gx * GX + ((h3(gx, gy, 902) * (GX - w + 1)) | 0); let oy = -1;
      if (stand) { for (let dy = 0; dy <= GY - h; dy++) if (fits(H, ox, gy * GY + dy, w, h, true, dec)) { oy = gy * GY + dy; break; } }
      else { const c0 = gy * GY + ((h3(gx, gy, 903) * (GY - h + 1)) | 0); if (fits(H, ox, c0, w, h, false, dec)) oy = c0; }
      if (oy < 0 || ox + w < x0 - 1 || ox > x1 + 1 || oy + h < y0 - 1 || oy > y1 + 1) continue;
      draw(kind, ox, oy, w, h, h3(gx, gy, 904), null);
    }
  }
  const sh = (c, x, y, w, h, a) => { c.fillStyle = "rgba(0,0,0," + a + ")"; c.fillRect(x, y, w, h); };
  const PIECE = {
    /* Wandteppich mit Stange, Falten, Bordüre, Wappen und Fransen */
    tapestry(c, x, y, w, h, H, r) {
      const B = H.B, cols = B.bg === "spires" ? ["#3a1a30", "#c8803a"] : B.bg === "halls" ? ["#5a1418", "#c8963c"] : r < 0.5 ? ["#4a1a1c", "#b88a3a"] : ["#2a3a24", "#b0904a"], base = cols[0], gold = cols[1];
      const tx = x + 4, tw = w - 8, ty = y + 5, th = h - 10;
      c.fillStyle = "rgba(0,0,0,.35)"; c.fillRect(tx + 2, ty + 2, tw, th);
      c.fillStyle = base; c.beginPath(); c.moveTo(tx, ty); c.lineTo(tx + tw, ty); c.lineTo(tx + tw, ty + th - 6); c.lineTo(tx + tw / 2, ty + th); c.lineTo(tx, ty + th - 6); c.closePath(); c.fill();
      c.save(); c.clip();
      for (let k = 0; k < 5; k++) { const fx = tx + tw * (k + 0.5) / 5; const g = c.createLinearGradient(fx - 3, 0, fx + 3, 0); g.addColorStop(0, "rgba(0,0,0,0)"); g.addColorStop(0.5, k % 2 ? "rgba(0,0,0,.22)" : "rgba(255,230,200,.07)"); g.addColorStop(1, "rgba(0,0,0,0)"); c.fillStyle = g; c.fillRect(fx - 3, ty, 6, th); }
      c.strokeStyle = H.rgba(gold, 0.7); c.lineWidth = 1; c.strokeRect(tx + 2.5, ty + 2.5, tw - 5, th - 12);
      c.fillStyle = H.rgba(gold, 0.35); for (let yy = ty + 6; yy < ty + th - 12; yy += 6) for (let xx = tx + 5 + ((yy / 6) & 1) * 3; xx < tx + tw - 4; xx += 6) c.fillRect(xx, yy, 1, 1);
      const cx = tx + tw / 2, cy = ty + th * 0.42;
      c.fillStyle = H.rgba(gold, 0.85);
      if (r < 0.33) { c.beginPath(); c.arc(cx, cy, 4, 0, TAU); c.fill(); for (let k = 0; k < 8; k++) { const a = k / 8 * TAU; c.fillRect(cx + Math.cos(a) * 6 - 0.6, cy + Math.sin(a) * 6 - 0.6, 1.2, 1.2); } }
      else if (r < 0.66) { c.beginPath(); c.moveTo(cx - 6, cy - 6); c.lineTo(cx + 6, cy - 6); c.lineTo(cx + 6, cy); c.quadraticCurveTo(cx + 6, cy + 6, cx, cy + 8); c.quadraticCurveTo(cx - 6, cy + 6, cx - 6, cy); c.closePath(); c.fill(); c.fillStyle = base; c.fillRect(cx - 0.8, cy - 5, 1.6, 11); c.fillRect(cx - 5, cy - 1, 10, 1.6); }
      else { /* Lilie */ c.beginPath(); c.moveTo(cx, cy - 8); c.quadraticCurveTo(cx + 3, cy - 3, cx, cy + 2); c.quadraticCurveTo(cx - 3, cy - 3, cx, cy - 8); c.fill(); for (const d of [-1, 1]) { c.beginPath(); c.moveTo(cx + d * 1, cy); c.quadraticCurveTo(cx + d * 7, cy - 6, cx + d * 5, cy + 1); c.quadraticCurveTo(cx + d * 4, cy + 3, cx + d * 1, cy + 2); c.fill(); } c.fillRect(cx - 4, cy + 2, 8, 1.4); c.beginPath(); c.moveTo(cx - 1.5, cy + 3.4); c.lineTo(cx + 1.5, cy + 3.4); c.lineTo(cx, cy + 7); c.fill(); }
      c.restore();
      c.fillStyle = H.rgba(gold, 0.8); for (let k = 0; k < tw; k += 2) { const yy = k < tw / 2 ? ty + th - 6 + k / (tw / 2) * 6 : ty + th - (k - tw / 2) / (tw / 2) * 6; c.fillRect(tx + k, yy, 0.8, 3); }
      c.fillStyle = "#3a2a1c"; c.fillRect(x + 1, y + 3, w - 2, 2); c.fillStyle = "#6a5030"; c.fillRect(x + 1, y + 3, w - 2, 0.6); c.fillStyle = H.rgba(gold, 0.9); c.beginPath(); c.arc(x + 1.5, y + 4, 1.6, 0, TAU); c.arc(x + w - 1.5, y + 4, 1.6, 0, TAU); c.fill();
    },
    /* Statue in einer Bogennische: Ritter mit Schwert oder Gestalt mit Kapuze */
    statue(c, x, y, w, h, H, r) {
      const P = H.PAL, nx = x + 3, nw = w - 6, top = y + 4, bot = y + h, ar = nw / 2;
      c.fillStyle = "rgba(0,0,0,.45)"; c.beginPath(); c.moveTo(nx, bot); c.lineTo(nx, top + ar); c.arc(nx + ar, top + ar, ar, PI, 0); c.lineTo(nx + nw, bot); c.fill();
      const g = c.createLinearGradient(0, top, 0, top + 20); g.addColorStop(0, "rgba(0,0,0,.4)"); g.addColorStop(1, "rgba(0,0,0,0)"); c.fillStyle = g; c.fillRect(nx, top, nw, 20);
      c.strokeStyle = P.stoneHi; c.lineWidth = 1; c.beginPath(); c.moveTo(nx - 1, bot); c.lineTo(nx - 1, top + ar); c.arc(nx + ar, top + ar, ar + 1, PI, 0); c.lineTo(nx + nw + 1, bot); c.stroke();
      const sc = H.lit(H.B.wall, 0.22), sd = H.lit(H.B.wall, -0.05), cx = x + w / 2, fb = bot - 5;
      c.fillStyle = P.stone; c.fillRect(cx - 7, fb, 14, 5); c.fillStyle = P.stoneHi; c.fillRect(cx - 7, fb, 14, 0.8);
      c.fillStyle = sd;
      if (r < 0.5) { /* Ritter */ c.fillRect(cx - 4, fb - 18, 8, 18); c.beginPath(); c.arc(cx, fb - 22, 3.6, 0, TAU); c.fill(); c.fillRect(cx - 6, fb - 17, 12, 4); c.fillStyle = sc; c.fillRect(cx - 4, fb - 18, 1.6, 18); c.fillRect(cx - 3.6, fb - 25, 1.4, 4); c.fillStyle = sd; c.fillRect(cx - 0.7, fb - 16, 1.4, 16); c.fillRect(cx - 3, fb - 15, 6, 1.4); c.fillStyle = sc; c.fillRect(cx - 0.7, fb - 16, 0.5, 16); }
      else { /* Gestalt mit Kapuze, Hände gefaltet */ c.beginPath(); c.moveTo(cx - 6, fb); c.lineTo(cx - 4, fb - 18); c.quadraticCurveTo(cx, fb - 28, cx + 4, fb - 18); c.lineTo(cx + 6, fb); c.fill(); c.fillStyle = "rgba(0,0,0,.5)"; c.beginPath(); c.ellipse(cx, fb - 20, 2.2, 2.8, 0, 0, TAU); c.fill(); c.fillStyle = sc; c.beginPath(); c.moveTo(cx - 6, fb); c.lineTo(cx - 4, fb - 18); c.quadraticCurveTo(cx - 2, fb - 24, cx - 1, fb - 25); c.lineTo(cx - 2.5, fb - 18); c.lineTo(cx - 4.5, fb); c.fill(); c.fillStyle = sd; c.fillRect(cx - 2, fb - 12, 4, 2); }
      c.strokeStyle = "rgba(0,0,0,.4)"; c.lineWidth = 0.5; c.beginPath(); c.moveTo(cx + 2, fb - 14); c.lineTo(cx + 3, fb - 8); c.stroke();
    },
    /* Treppe im Hintergrund mit Geländer, die in die Wand hinaufführt */
    stairs(c, x, y, w, h, H, r) {
      const P = H.PAL, dir = r < 0.5 ? 1 : -1, n = 10, sw = w / n, stp = h / n, x0 = dir > 0 ? x : x + w;
      c.fillStyle = "rgba(0,0,0,.4)"; c.beginPath(); c.moveTo(x0, y + h); for (let i = 0; i <= n; i++) { c.lineTo(x0 + dir * i * sw, y + h - i * stp); c.lineTo(x0 + dir * (i + 1) * sw, y + h - i * stp); } c.lineTo(x0 + dir * w, y + h); c.fill();
      for (let i = 0; i < n; i++) { const sx = x0 + dir * i * sw - (dir < 0 ? sw : 0), sy = y + h - (i + 1) * stp; c.fillStyle = P.stone; c.fillRect(sx, sy, sw + 0.5, stp); c.fillStyle = P.stoneHi; c.fillRect(sx, sy, sw + 0.5, 0.8); c.fillStyle = "rgba(0,0,0,.25)"; c.fillRect(sx, sy + stp - 1, sw, 1); }
      /* Unterseite: dunkler Keil */
      c.fillStyle = "rgba(0,0,0,.25)"; c.beginPath(); c.moveTo(x0 + dir * w * 0.25, y + h); c.lineTo(x0 + dir * w, y + h * 0.05); c.lineTo(x0 + dir * w, y + h); c.fill();
      /* Geländer: Handlauf und Docken */
      c.strokeStyle = H.lit(H.B.wall, 0.15); c.lineWidth = 1; c.beginPath(); c.moveTo(x0, y + h - 9); c.lineTo(x0 + dir * w, y - 9 + 1); c.stroke();
      for (let i = 0; i < n; i += 2) { const bx = x0 + dir * (i + 0.5) * sw, by = y + h - (i + 1) * stp; c.fillStyle = P.stone; c.fillRect(bx - 0.6, by - 8, 1.2, 8); }
    },
    /* gekreuzte Speere hinter Rundschilden */
    shields(c, x, y, w, h, H, r) {
      const cx = x + w / 2, cy = y + h / 2 + 1;
      c.strokeStyle = "#3a2a1a"; c.lineWidth = 1.2; c.beginPath(); c.moveTo(cx - 18, cy + 10); c.lineTo(cx + 18, cy - 12); c.moveTo(cx + 18, cy + 10); c.lineTo(cx - 18, cy - 12); c.stroke();
      c.fillStyle = "#8a8480"; for (const [sx, sy, d] of [[cx + 18, cy - 12, 1], [cx - 18, cy - 12, -1]]) { c.beginPath(); c.moveTo(sx, sy); c.lineTo(sx - d * 3, sy + 1); c.lineTo(sx + d * 1, sy + 3.5); c.fill(); }
      const cols = [["#6a1a1a", "#c8a050"], ["#4a2a3a", "#c8c0b0"], ["#3a4a2a", "#c8a050"]]; const pick = cols[(r * 3) | 0].slice();
      if (H.B.bg === "forge") pick[0] = "#4a2a1a";
      for (const [sx, k] of [[cx - 7, 0], [cx + 7, 1]]) { const col = k ? pick[0] : H.lit(pick[0], 0.1); c.fillStyle = "rgba(0,0,0,.35)"; c.beginPath(); c.arc(sx + 1, cy + 1, 7, 0, TAU); c.fill(); c.fillStyle = col; c.beginPath(); c.arc(sx, cy, 7, 0, TAU); c.fill(); c.strokeStyle = pick[1]; c.lineWidth = 0.8; c.beginPath(); c.arc(sx, cy, 6.4, 0, TAU); c.stroke(); c.fillStyle = "#9a948e"; c.beginPath(); c.arc(sx, cy, 1.8, 0, TAU); c.fill(); c.fillStyle = "rgba(255,240,220,.15)"; c.beginPath(); c.arc(sx - 2, cy - 2, 3, 0, TAU); c.fill(); }
    },
    /* Ahnengalerie: zwei kleine Porträts in Goldrahmen */
    gallery(c, x, y, w, h, H, r) {
      for (let k = 0; k < 2; k++) { const fx = x + 6 + k * (w / 2), fy = y + 4, fw = w / 2 - 12, fh = h - 8; c.fillStyle = "rgba(0,0,0,.4)"; c.fillRect(fx + 1.5, fy + 1.5, fw, fh); c.fillStyle = "#7a5a1e"; c.fillRect(fx - 1.5, fy - 1.5, fw + 3, fh + 3); c.fillStyle = "#c89a40"; c.fillRect(fx - 1.5, fy - 1.5, fw + 3, 0.7);
        const bg = ["#2a1a22", "#1a2218", "#2a2018"][(r * 3 + k) % 3 | 0]; c.fillStyle = bg; c.fillRect(fx, fy, fw, fh); const px = fx + fw / 2; c.fillStyle = ["#5a1a1a", "#2a2a3a", "#3a2a1a"][(r * 7 + k) % 3 | 0]; c.beginPath(); c.moveTo(px - 6, fy + fh); c.quadraticCurveTo(px, fy + fh - 10, px + 6, fy + fh); c.fill(); c.fillStyle = "#c8a088"; c.beginPath(); c.ellipse(px, fy + fh - 12, 2.6, 3.2, 0, 0, TAU); c.fill(); c.fillStyle = ["#2a1a10", "#8a8070", "#5a3010"][(r * 5 + k) % 3 | 0]; c.beginPath(); c.ellipse(px, fy + fh - 14, 3, 2, 0, PI, TAU); c.fill(); }
    },
    /* Weinregal mit Flaschenböden */
    rack(c, x, y, w, h, H, r) {
      const wood = "#4a3020"; c.fillStyle = "rgba(0,0,0,.4)"; c.fillRect(x + 3, y + 3, w - 4, h - 3); c.fillStyle = wood; c.fillRect(x + 2, y + 2, w - 4, h - 2);
      c.fillStyle = "#1a120c"; const n = Math.floor((w - 8) / 6), m = Math.floor((h - 8) / 6);
      for (let j = 0; j < m; j++) for (let i = 0; i < n; i++) { const bx = x + 6 + i * 6, by = y + 6 + j * 6; c.fillStyle = "#1a120c"; c.fillRect(bx - 2.6, by - 2.6, 5.2, 5.2); const v = H.h3(i + x, j + y, 7); if (v < 0.75) { c.fillStyle = v < 0.3 ? "#2a3a1a" : v < 0.55 ? "#4a1a22" : "#3a2a10"; c.beginPath(); c.arc(bx, by, 2, 0, TAU); c.fill(); c.fillStyle = "rgba(255,240,200,.25)"; c.fillRect(bx - 1, by - 1.2, 0.8, 0.8); } }
      c.fillStyle = "#6a4a30"; c.fillRect(x + 2, y + 2, w - 4, 1); c.fillRect(x + 2, y + 2, 1, h - 2); c.fillRect(x + w - 3, y + 2, 1, h - 2);
    },
    /* Zellenfenster mit Gittern, dahinter Dunkel und manchmal ein Paar Augen */
    cell(c, x, y, w, h, H, r) {
      const fx = x + 8, fy = y + 6, fw = w - 16, fh = h - 14;
      c.fillStyle = "#0a0808"; c.fillRect(fx, fy, fw, fh); c.strokeStyle = H.PAL.stoneHi; c.lineWidth = 1; c.strokeRect(fx - 1, fy - 1, fw + 2, fh + 2);
      if (r < 0.4) { c.fillStyle = "rgba(255,200,90,.7)"; c.fillRect(fx + fw * 0.4, fy + fh * 0.45, 1.2, 0.8); c.fillRect(fx + fw * 0.4 + 3.5, fy + fh * 0.45, 1.2, 0.8); }
      c.fillStyle = "#2a2624"; for (let k = 1; k < 5; k++) c.fillRect(fx + k * fw / 5 - 0.8, fy - 1, 1.6, fh + 2); c.fillRect(fx - 1, fy + fh / 2 - 0.6, fw + 2, 1.2);
      c.fillStyle = "rgba(200,190,180,.2)"; for (let k = 1; k < 5; k++) c.fillRect(fx + k * fw / 5 - 0.8, fy - 1, 0.5, fh + 2);
      c.fillStyle = "rgba(120,52,20,.4)"; c.fillRect(fx, fy + fh + 1, fw, 3);
    },
    /* Glocke in einer Nische, mit Seil */
    bell(c, x, y, w, h, H, r) {
      const cx = x + w / 2, top = y + 6; c.fillStyle = "rgba(0,0,0,.4)"; c.fillRect(x + 4, y + 2, w - 8, h - 2); c.fillStyle = "#3a2a1a"; c.fillRect(x + 4, top - 3, w - 8, 3);
      c.fillStyle = "#6a5228"; c.beginPath(); c.moveTo(cx - 4, top); c.quadraticCurveTo(cx - 5, top + 10, cx - 11, top + 22); c.lineTo(cx + 11, top + 22); c.quadraticCurveTo(cx + 5, top + 10, cx + 4, top); c.closePath(); c.fill();
      c.fillStyle = "#9a7a3a"; c.beginPath(); c.moveTo(cx - 3, top + 1); c.quadraticCurveTo(cx - 4, top + 10, cx - 8, top + 21); c.lineTo(cx - 6, top + 21); c.quadraticCurveTo(cx - 2, top + 10, cx - 1.5, top + 1); c.fill();
      c.fillStyle = "#4a3818"; c.fillRect(cx - 11, top + 20, 22, 2.4); c.fillStyle = "#2a1a0c"; c.beginPath(); c.arc(cx, top + 23, 2, 0, TAU); c.fill();
      c.strokeStyle = "#8a7a5a"; c.lineWidth = 0.8; c.beginPath(); c.moveTo(cx + 6, top + 22); c.quadraticCurveTo(cx + 9, top + 30, cx + 7, y + h); c.stroke();
    },
    /* großes hölzernes Zahnrad */
    gear(c, x, y, w, h, H, r) {
      const cx = x + w / 2, cy = y + h / 2, R = Math.min(w, h) / 2 - 3, n = 12, rot = r * 2;
      c.fillStyle = "rgba(0,0,0,.4)"; c.beginPath(); c.arc(cx + 1.5, cy + 1.5, R, 0, TAU); c.fill();
      c.fillStyle = "#4a3420"; c.beginPath(); for (let k = 0; k < n * 2; k++) { const a = rot + k / (n * 2) * TAU, rr = k % 2 ? R : R - 3; c.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr); } c.closePath(); c.fill();
      c.fillStyle = H.lit(H.B.wall, -0.1); c.beginPath(); c.arc(cx, cy, R - 7, 0, TAU); c.fill(); c.fillStyle = "#4a3420"; for (let k = 0; k < 4; k++) { c.save(); c.translate(cx, cy); c.rotate(rot + k * PI / 4); c.fillRect(-R + 6, -1.5, (R - 6) * 2, 3); c.restore(); }
      c.beginPath(); c.arc(cx, cy, 4, 0, TAU); c.fill(); c.fillStyle = "#2a2622"; c.beginPath(); c.arc(cx, cy, 1.8, 0, TAU); c.fill();
      c.strokeStyle = "rgba(255,220,170,.15)"; c.lineWidth = 0.6; c.beginPath(); c.arc(cx, cy, R - 3.5, PI * 1.1, PI * 1.6); c.stroke();
    },
    /* Spanten eines Bootes im Bau */
    ribs(c, x, y, w, h, H, r) {
      const wood = "#4a3420", bot = y + h, cx = x + w / 2;
      c.strokeStyle = "rgba(0,0,0,.35)"; c.lineWidth = 3; c.beginPath(); c.moveTo(x + 4, bot - 6); c.quadraticCurveTo(cx, bot + 4, x + w - 4, bot - 10); c.stroke();
      c.strokeStyle = wood; c.lineWidth = 2.4; c.beginPath(); c.moveTo(x + 4, bot - 7); c.quadraticCurveTo(cx, bot + 2, x + w - 4, bot - 11); c.stroke();
      for (let k = 0; k < 7; k++) { const u = (k + 0.5) / 7, bx = x + 6 + u * (w - 12), by = bot - 3 - Math.sin(u * PI) * 0, hh = h - 10 - Math.abs(u - 0.5) * 14; c.strokeStyle = wood; c.lineWidth = 1.6; c.beginPath(); c.moveTo(bx, by); c.quadraticCurveTo(bx - 6 * (u - 0.5) * 2 - 4, by - hh * 0.5, bx - 8 * (u - 0.5), by - hh); c.stroke(); }
      c.fillStyle = "#3a2a1a"; c.fillRect(x + 2, bot - 4, 4, 4); c.fillRect(x + w - 6, bot - 4, 4, 4);
    },
    /* Netze mit Schwimmern zum Trocknen */
    nets(c, x, y, w, h, H, r) {
      c.strokeStyle = "#3a2a1a"; c.lineWidth = 1; c.beginPath(); c.moveTo(x + 2, y + 4); c.lineTo(x + w - 2, y + 4); c.stroke();
      c.strokeStyle = "rgba(200,180,140,.35)"; c.lineWidth = 0.5; c.beginPath();
      for (let k = 0; k <= 8; k++) { const xx = x + 4 + k * (w - 8) / 8; c.moveTo(xx, y + 4); c.quadraticCurveTo(xx + 2, y + h * 0.6, xx + (k - 4) * 0.8, y + h - 4 - Math.abs(k - 4)); }
      for (let j = 1; j < 6; j++) { const yy = y + 4 + j * (h - 8) / 6; c.moveTo(x + 4, yy); c.quadraticCurveTo(x + w / 2, yy + 3 + j, x + w - 4, yy); }
      c.stroke();
      for (let k = 0; k < 4; k++) { c.fillStyle = k % 2 ? "#b86a3a" : "#c8b080"; c.beginPath(); c.ellipse(x + 8 + k * (w - 16) / 3, y + h - 8 + (k % 2) * 2, 2.2, 1.6, 0, 0, TAU); c.fill(); }
    },
    /* eingesponnene Kokons an Seidenfäden */
    cocoon(c, x, y, w, h, H, r) {
      for (let k = 0; k < 2; k++) { const cx = x + 8 + k * (w - 16), len = 14 + H.h3(x, y + k, 5) * 18, cy = y + len; c.strokeStyle = "rgba(230,220,240,.35)"; c.lineWidth = 0.4; c.beginPath(); c.moveTo(cx, y); c.lineTo(cx, cy - 7); c.stroke();
        c.fillStyle = "#b8b0c0"; c.beginPath(); c.ellipse(cx, cy, 4, 8, 0, 0, TAU); c.fill(); c.strokeStyle = "rgba(90,70,100,.5)"; c.lineWidth = 0.5; c.beginPath(); for (let j = -6; j <= 6; j += 2.4) { c.moveTo(cx - 3.6, cy + j); c.quadraticCurveTo(cx, cy + j + 1.6, cx + 3.6, cy + j - 0.6); } c.stroke(); c.fillStyle = "rgba(255,250,255,.2)"; c.beginPath(); c.ellipse(cx - 1.4, cy - 2, 1.2, 4, 0, 0, TAU); c.fill(); }
    },
    /* versunkene Säulentrommeln und ein Fischgötzen-Relief */
    ruin(c, x, y, w, h, H, r) {
      const st = H.lit(H.B.wall, 0.12), bot = y + h;
      c.fillStyle = "rgba(0,0,0,.35)"; c.fillRect(x + 4, bot - 34, 13, 34);
      c.fillStyle = st; c.fillRect(x + 3, bot - 34, 12, 34); c.fillStyle = H.lit(st, 0.15); c.fillRect(x + 3, bot - 34, 2, 34); c.fillStyle = "rgba(0,0,0,.25)"; for (let k = 1; k < 4; k++) c.fillRect(x + 3 + k * 3, bot - 34, 0.7, 34);
      c.fillStyle = H.lit(H.B.wall, -0.1); c.beginPath(); c.moveTo(x + 3, bot - 34); c.lineTo(x + 7, bot - 38); c.lineTo(x + 11, bot - 35); c.lineTo(x + 15, bot - 37); c.lineTo(x + 15, bot - 34); c.fill();
      c.fillStyle = st; c.save(); c.translate(x + 30, bot - 4); c.rotate(-0.12); c.fillRect(-8, -8, 16, 8); c.fillStyle = "rgba(0,0,0,.25)"; c.fillRect(-4, -8, 0.7, 8); c.fillRect(2, -8, 0.7, 8); c.restore();
      const fx = x + w - 14, fy = y + 14; c.fillStyle = H.lit(H.B.wall, 0.05); c.beginPath(); c.ellipse(fx, fy, 8, 10, 0, 0, TAU); c.fill(); c.fillStyle = "rgba(0,0,0,.45)"; c.beginPath(); c.arc(fx - 3, fy - 2, 1.8, 0, TAU); c.arc(fx + 3, fy - 2, 1.8, 0, TAU); c.fill(); c.strokeStyle = "rgba(0,0,0,.45)"; c.lineWidth = 0.7; c.beginPath(); c.moveTo(fx - 4, fy + 4); c.quadraticCurveTo(fx, fy + 7, fx + 4, fy + 4); c.stroke(); c.fillStyle = "rgba(120,200,150,.25)"; c.fillRect(fx - 3.3, fy - 2.3, 0.8, 0.8); c.fillRect(fx + 2.7, fy - 2.3, 0.8, 0.8);
    },
    /* Duergar-Gesicht im Stein mit glimmenden Augen */
    face(c, x, y, w, h, H, r) {
      const cx = x + w / 2, cy = y + h / 2, st = H.lit(H.B.wall, 0.1);
      c.fillStyle = "rgba(0,0,0,.4)"; c.beginPath(); c.moveTo(cx - 14, cy - 14); c.lineTo(cx + 14, cy - 14); c.lineTo(cx + 12, cy + 8); c.lineTo(cx, cy + 20); c.lineTo(cx - 12, cy + 8); c.closePath(); c.fill();
      c.fillStyle = st; c.beginPath(); c.moveTo(cx - 13, cy - 15); c.lineTo(cx + 13, cy - 15); c.lineTo(cx + 11, cy + 7); c.lineTo(cx, cy + 18); c.lineTo(cx - 11, cy + 7); c.closePath(); c.fill();
      c.fillStyle = H.lit(st, -0.25); c.fillRect(cx - 10, cy - 7, 20, 3); c.beginPath(); c.moveTo(cx - 2, cy - 4); c.lineTo(cx + 2, cy - 4); c.lineTo(cx + 3, cy + 3); c.lineTo(cx - 3, cy + 3); c.fill();
      c.fillStyle = H.lit(st, -0.35); for (let k = 0; k < 6; k++) { c.beginPath(); c.moveTo(cx - 8 + k * 3, cy + 5); c.lineTo(cx - 6.5 + k * 3, cy + 15 - Math.abs(k - 2.5) * 2); c.lineTo(cx - 5 + k * 3, cy + 5); c.fill(); }
      c.save(); c.globalCompositeOperation = "lighter"; for (const ex of [cx - 5, cx + 5]) { const g = c.createRadialGradient(ex, cy - 5.5, 0, ex, cy - 5.5, 5); g.addColorStop(0, "rgba(255,120,40,.7)"); g.addColorStop(1, "rgba(255,120,40,0)"); c.fillStyle = g; c.fillRect(ex - 5, cy - 10.5, 10, 10); c.fillStyle = "rgba(255,200,120,.9)"; c.fillRect(ex - 1.2, cy - 6, 2.4, 1); } c.restore();
      c.fillStyle = H.lit(st, 0.2); c.fillRect(cx - 13, cy - 15, 26, 1);
    },
    /* Esse-Haube mit Rauchabzug und glimmendem Rost */
    chimney(c, x, y, w, h, H, r) {
      const cx = x + w / 2, bot = y + h, st = H.lit(H.B.wall, 0.08);
      c.fillStyle = "rgba(0,0,0,.4)"; c.fillRect(cx - 7, y, 16, h - 18);
      c.fillStyle = st; c.fillRect(cx - 8, y, 16, h - 22); c.fillStyle = H.lit(st, 0.15); c.fillRect(cx - 8, y, 2, h - 22);
      c.beginPath(); c.moveTo(cx - 8, bot - 22); c.lineTo(cx + 8, bot - 22); c.lineTo(cx + 18, bot - 12); c.lineTo(cx - 18, bot - 12); c.closePath(); c.fill();
      c.fillStyle = "rgba(0,0,0,.4)"; c.fillRect(cx - 18, bot - 12, 36, 2);
      c.fillStyle = "#1a0e08"; c.fillRect(cx - 12, bot - 10, 24, 10);
      c.save(); c.globalCompositeOperation = "lighter"; const g = c.createLinearGradient(0, bot - 10, 0, bot); g.addColorStop(0, "rgba(255,90,20,0)"); g.addColorStop(1, "rgba(255,110,30,.55)"); c.fillStyle = g; c.fillRect(cx - 12, bot - 10, 24, 10); c.fillStyle = "rgba(255,190,90,.8)"; for (let k = 0; k < 6; k++) c.fillRect(cx - 10 + k * 4 + H.h3(x, k, 3) * 2, bot - 2 - H.h3(k, y, 4) * 2, 1.2, 1); c.restore();
      c.fillStyle = "#2a2624"; for (let k = 0; k < 5; k++) c.fillRect(cx - 11 + k * 5, bot - 1.5, 3, 1.5);
      const s2 = c.createLinearGradient(0, y, 0, y + 30); s2.addColorStop(0, "rgba(8,5,4,.5)"); s2.addColorStop(1, "rgba(8,5,4,0)"); c.fillStyle = s2; c.fillRect(cx - 8, y, 16, 30);
    }
  };
  /* ---------- Schaustücke nach Raumfunktion (Runde 6) ----------
     Werden über ROOMPIECE gewählt; alle gedämpft genug, um Rückwand zu bleiben, aber erkennbar: Bücherwand, Glasfenster,
     Altarbild, Küchenkamin, Kupfertöpfe, Waffenrechen, Fassreihe, Folterwand, Wirtshausschild, Krugbord, Kerkerzelle,
     Uhrwerk, Gussformen, Tempelrelief, Eiersäcke, Schädelnischen, Schlüsselbrett, Taubenschlag, Seile, Hufeisen,
     Zielscheibe, Kugelpyramide, Erzhaufen, Runenstein, Korallen, Giftranken, Tellerbord, Waage, Spiegel, Riesenpilze,
     Kristalle. Kein Blau. */
  Object.assign(SIZE, { buecherwand: [4, 4, 1], glasfenster: [3, 5], altarbild: [4, 3], kamin: [4, 4, 1], kupfer: [4, 2], waffen: [3, 3, 1], faesser: [5, 3, 1], folter: [4, 3],
    wirtsschild: [3, 2], krugbord: [4, 2], kerker: [4, 3, 1], uhr: [4, 4], gussform: [4, 3, 1], relief: [4, 3], eier: [3, 3], schaedel: [4, 3], schluessel: [2, 2], tauben: [4, 3],
    seile: [3, 3], hufeisen: [3, 2], zielscheibe: [2, 2], kugeln: [3, 2, 1], erz: [3, 2, 1], runenstein: [3, 4, 1], korallen: [3, 3], ranken: [3, 4], teller: [4, 2], waage: [3, 2],
    spiegel: [2, 3], riesenpilze: [3, 4, 1], kristall: [3, 3] });
  const BOOK = ["#6a1e1e", "#3a4a22", "#5a3a18", "#4a2440", "#7a4a1a", "#2e3a24", "#5a2a2a", "#6a5a30", "#3a2a1c", "#7a2a3a"];
  const GLAS = ["#9a2020", "#c8902a", "#3a6a2a", "#6a2a6a", "#c86a2a", "#8a1a3a", "#a8a040"];
  const CU = { m: "#a85a28", hi: "#e8a060", lo: "#5a2a12" }, IRON = { m: "#4a4440", hi: "#8a8480", lo: "#1e1a18" };
  const lancet = (c, x, yT, w, yB) => { c.beginPath(); c.moveTo(x, yB); c.lineTo(x, yT + w * 0.62); c.quadraticCurveTo(x, yT + w * 0.12, x + w / 2, yT); c.quadraticCurveTo(x + w, yT + w * 0.12, x + w, yT + w * 0.62); c.lineTo(x + w, yB); c.closePath(); };
  const glow = (c, x, y, R, col, a) => { c.save(); c.globalCompositeOperation = "lighter"; const g = c.createRadialGradient(x, y, 0, x, y, R); g.addColorStop(0, H2rgba(col, a)); g.addColorStop(1, H2rgba(col, 0)); c.fillStyle = g; c.fillRect(x - R, y - R, R * 2, R * 2); c.restore(); };
  const H2rgba = (hex, a) => { const n = parseInt(hex.slice(1), 16); return "rgba(" + (n >> 16) + "," + ((n >> 8) & 255) + "," + (n & 255) + "," + a + ")"; };
  const peg = (c, x, y) => { c.fillStyle = "#2a1c12"; c.fillRect(x - 1, y - 1, 2, 2); c.fillStyle = "rgba(255,220,170,.25)"; c.fillRect(x - 1, y - 1, 2, 0.5); };
  const skull = (c, x, y, s, col) => { c.fillStyle = col || "#cfc4a8"; c.beginPath(); c.arc(x, y, 3.2 * s, PI, 0); c.lineTo(x + 2.4 * s, y + 2.6 * s); c.lineTo(x - 2.4 * s, y + 2.6 * s); c.closePath(); c.fill(); c.fillStyle = "rgba(20,12,8,.85)"; c.beginPath(); c.arc(x - 1.2 * s, y + 0.4 * s, 0.9 * s, 0, TAU); c.arc(x + 1.2 * s, y + 0.4 * s, 0.9 * s, 0, TAU); c.fill(); c.fillRect(x - 0.3 * s, y + 1.4 * s, 0.6 * s, 0.8 * s); c.fillStyle = "rgba(255,250,230,.25)"; c.fillRect(x - 2 * s, y - 2.4 * s, 2 * s, 0.6 * s); };
  Object.assign(PIECE, {
    /* Bücherwand: Regal mit Gesims, Bücher in vielen Höhen und Farben, liegende Stapel, gekippte Bände, Leiter */
    buecherwand(c, x, y, w, h, H, r) {
      const wd = "#3a2618", wl = "#6a4a2e", bot = y + h, n = Math.max(1, Math.round((h - 6) / 14.5)), sH = (h - 6) / n;
      sh(c, x + 3, y + 3, w - 3, h - 3, 0.45); c.fillStyle = wd; c.fillRect(x + 1, y + 2, w - 2, h - 2);
      for (let s = 0; s < n; s++) {
        const sy = y + 4 + s * sH, by = sy + sH - 2; c.fillStyle = "#170e08"; c.fillRect(x + 3, sy, w - 6, sH - 2);
        let bx = x + 4, i = 0;
        while (bx < x + w - 5 && i < 40) {
          const hv = k => H.h3((bx * 7) | 0, s * 31 + y, k + i), v = hv(1300); i++;
          if (v < 0.06) { bx += 3 + hv(1301) * 3; continue; }
          const bw = Math.min(x + w - 4 - bx, 1.7 + hv(1310) * 2.6), bh = (sH - 4) * (0.6 + hv(1320) * 0.38), col = BOOK[(hv(1330) * BOOK.length) | 0];
          if (v > 0.92 && bx < x + w - 15) { for (let k = 0; k < 3; k++) { c.fillStyle = BOOK[(k * 3 + i) % BOOK.length]; c.fillRect(bx + k * 0.6, by - 2.3 * (k + 1), 10 - k * 1.2, 2.1); c.fillStyle = "rgba(255,225,160,.3)"; c.fillRect(bx + k * 0.6, by - 2.3 * (k + 1), 10 - k * 1.2, 0.5); } bx += 11; continue; }
          if (v > 0.85 && v <= 0.92 && bx < x + w - 10) { c.save(); c.translate(bx + 0.5, by); c.rotate(0.38); c.fillStyle = col; c.fillRect(0, -bh, bw + 0.6, bh); c.fillStyle = "rgba(255,225,160,.3)"; c.fillRect(0, -bh + 2, bw + 0.6, 0.6); c.restore(); bx += bw + bh * 0.36 + 0.5; continue; }
          c.fillStyle = col; c.fillRect(bx, by - bh, bw, bh);
          c.fillStyle = "rgba(255,225,160,.32)"; c.fillRect(bx, by - bh + 1.6, bw, 0.6); c.fillRect(bx, by - 3.2, bw, 0.6);
          if (hv(1340) < 0.3) { c.fillStyle = "rgba(255,225,160,.25)"; c.fillRect(bx + bw / 2 - 0.3, by - bh * 0.6, 0.6, 1.4); }
          c.fillStyle = "rgba(0,0,0,.35)"; c.fillRect(bx + bw - 0.5, by - bh, 0.5, bh); bx += bw + 0.25;
        }
        c.fillStyle = wl; c.fillRect(x + 2, by, w - 4, 2); c.fillStyle = "rgba(255,220,170,.22)"; c.fillRect(x + 2, by, w - 4, 0.5); c.fillStyle = "rgba(0,0,0,.35)"; c.fillRect(x + 3, by + 2, w - 6, 1);
      }
      c.fillStyle = wl; c.fillRect(x + 1, y + 2, 2.2, h - 2); c.fillRect(x + w - 3.2, y + 2, 2.2, h - 2);
      c.fillStyle = "#5a3e26"; c.fillRect(x - 1, y, w + 2, 4); c.fillStyle = "rgba(255,220,170,.28)"; c.fillRect(x - 1, y, w + 2, 0.7); c.fillStyle = "rgba(0,0,0,.3)"; c.fillRect(x - 1, y + 3.3, w + 2, 0.7);
      /* Leiter an der Bücherwand */
      if (r > 0.55) { const lx = x + w * (0.55 + (r - 0.55) * 0.6); c.strokeStyle = "#7a5634"; c.lineWidth = 1.2; c.beginPath(); c.moveTo(lx, y + 2); c.lineTo(lx + 9, bot); c.moveTo(lx + 6, y + 2); c.lineTo(lx + 15, bot); c.stroke(); c.lineWidth = 0.9; c.beginPath(); for (let k = 1; k < 9; k++) { const u = k / 9; c.moveTo(lx + 9 * u, y + 2 + u * (h - 2)); c.lineTo(lx + 6 + 9 * u, y + 2 + u * (h - 2)); } c.stroke(); }
      else { /* Schädel oder Kerzenstumpf obenauf */ if (r < 0.25) skull(c, x + w * 0.75, y - 3, 0.8); else { c.fillStyle = "#e8dcc0"; c.fillRect(x + w * 0.2, y - 5, 2, 5); c.fillStyle = "rgba(240,230,210,.6)"; c.fillRect(x + w * 0.2 - 1, y - 0.6, 4, 0.6); } }
    },
    /* Glasfenster: Spitzbogen mit Maßwerk, bunte Scheiben in Bleiruten, Rosette, Heiligenfigur, schräger Lichtschein */
    glasfenster(c, x, y, w, h, H, r) {
      const P = H.PAL, fx = x + 8, fw = w - 16, top = y + 5, bot = y + h - 9, broken = H.B.bg === "storm";
      c.fillStyle = "rgba(0,0,0,.45)"; lancet(c, fx - 4, top - 4, fw + 8, bot + 6); c.fill();
      c.fillStyle = P.stone; lancet(c, fx - 3, top - 3, fw + 6, bot + 3); c.fill(); c.strokeStyle = P.stoneHi; c.lineWidth = 0.7; lancet(c, fx - 3, top - 3, fw + 6, bot + 3); c.stroke();
      c.save(); lancet(c, fx, top, fw, bot); c.clip();
      c.fillStyle = "#1a0e0c"; c.fillRect(fx, top, fw, bot - top);
      for (let yy = top; yy < bot; yy += 5) for (let xx = fx + (((yy - top) / 5) & 1) * 2.5 - 2.5; xx < fx + fw; xx += 5) {
        const v = H.h3((xx * 3) | 0, (yy * 5) | 0, 1400 + ((r * 50) | 0)); if (broken && v > 0.8) continue;
        c.fillStyle = GLAS[(v * GLAS.length) | 0]; c.globalAlpha = 0.55 + H.h3((xx | 0), (yy | 0), 1401) * 0.3; c.fillRect(xx + 0.5, yy + 0.5, 4, 4);
      }
      c.globalAlpha = 1;
      /* Heiligenfigur: Mantel, Gesicht, Heiligenschein */
      const cx = fx + fw / 2, fy = bot - 4; c.fillStyle = r < 0.5 ? "#7a1a1a" : "#2e5a24"; c.beginPath(); c.moveTo(cx - 8, fy); c.quadraticCurveTo(cx - 6, fy - 18, cx, fy - 26); c.quadraticCurveTo(cx + 6, fy - 18, cx + 8, fy); c.fill();
      c.fillStyle = "#c8a030"; c.beginPath(); c.arc(cx, fy - 30, 5.5, 0, TAU); c.fill(); c.fillStyle = "#e8c8a0"; c.beginPath(); c.arc(cx, fy - 30, 3, 0, TAU); c.fill();
      c.fillStyle = "#d8b878"; c.fillRect(cx - 0.6, fy - 22, 1.2, 14); c.fillRect(cx - 3, fy - 18, 6, 1.2);
      /* Rosette */
      const ry = top + fw * 0.42; c.fillStyle = "#c8902a"; c.beginPath(); c.arc(cx, ry, 6, 0, TAU); c.fill();
      for (let k = 0; k < 6; k++) { const a = k / 6 * TAU; c.fillStyle = k % 2 ? "#9a2020" : "#6a2a6a"; c.beginPath(); c.arc(cx + Math.cos(a) * 4, ry + Math.sin(a) * 4, 2.4, 0, TAU); c.fill(); }
      /* Bleiruten */
      c.strokeStyle = "rgba(20,14,10,.85)"; c.lineWidth = 0.6; c.beginPath(); for (let yy = top + 5; yy < bot; yy += 5) { c.moveTo(fx, yy); c.lineTo(fx + fw, yy); } c.stroke();
      c.lineWidth = 1.6; c.strokeStyle = "#2a201a"; c.beginPath(); c.moveTo(cx, ry + 7); c.lineTo(cx, bot); c.moveTo(fx, top + fw * 0.95); c.lineTo(fx + fw, top + fw * 0.95); c.stroke();
      c.beginPath(); c.arc(cx, ry, 6.5, 0, TAU); c.stroke();
      /* Glanz von außen */
      c.globalCompositeOperation = "lighter"; const g = c.createLinearGradient(fx, top, fx + fw, bot); g.addColorStop(0, "rgba(255,220,150,.22)"); g.addColorStop(0.5, "rgba(255,200,120,.06)"); g.addColorStop(1, "rgba(255,180,100,.12)"); c.fillStyle = g; c.fillRect(fx, top, fw, bot - top);
      c.restore();
      /* Fensterbank und schräger Lichtschein */
      c.fillStyle = P.stone; c.fillRect(fx - 5, bot + 2, fw + 10, 3); c.fillStyle = P.stoneHi; c.fillRect(fx - 5, bot + 2, fw + 10, 0.7);
      if (!broken) { c.save(); c.globalCompositeOperation = "lighter"; const lg = c.createLinearGradient(0, bot, 0, y + h + 40); lg.addColorStop(0, "rgba(255,200,120,.10)"); lg.addColorStop(1, "rgba(255,200,120,0)"); c.fillStyle = lg; c.beginPath(); c.moveTo(fx, bot + 5); c.lineTo(fx + fw, bot + 5); c.lineTo(fx + fw + 18, y + h + 40); c.lineTo(fx + 10, y + h + 40); c.fill(); c.restore(); }
      if (broken) { c.strokeStyle = "#3e5a28"; c.lineWidth = 0.7; c.beginPath(); c.moveTo(fx - 3, bot + 3); c.quadraticCurveTo(fx - 8, (top + bot) / 2, fx + 2, top + 6); c.stroke(); for (let k = 0; k < 6; k++) { c.fillStyle = "#4a6a2a"; c.beginPath(); c.ellipse(fx - 5 + Math.sin(k) * 3, bot - k * 7, 2, 1.2, k, 0, TAU); c.fill(); } }
    },
    /* Altarbild: Flügelaltar mit Goldgrund, Mittelfigur mit Heiligenschein, kniende Stifter, Kerzen */
    altarbild(c, x, y, w, h, H, r) {
      const cx = x + w / 2, top = y + 4, bot = y + h - 4, cw = 26, ww = 13, gold = "#b8903a";
      sh(c, x + 6, top + 2, w - 10, bot - top, 0.45);
      const panel = (px, pw, py, pointed) => { c.fillStyle = "#6a4a1a"; if (pointed) lancet(c, px - 1.5, py - 1.5, pw + 3, bot + 1.5); else c.rect(px - 1.5, py - 1.5, pw + 3, bot - py + 3); c.fill(); c.save(); c.beginPath(); if (pointed) lancet(c, px, py, pw, bot); else c.rect(px, py, pw, bot - py); c.clip(); const g = c.createLinearGradient(0, py, 0, bot); g.addColorStop(0, "#a8883c"); g.addColorStop(1, "#6a4a1c"); c.fillStyle = g; c.fillRect(px, py, pw, bot - py); c.fillStyle = "rgba(255,240,200,.12)"; for (let k = 0; k < 12; k++) c.fillRect(px + H.h3(k, px | 0, 1450) * pw, py + H.h3(k, py | 0, 1451) * (bot - py), 1, 1); return () => c.restore(); };
      let done = panel(cx - cw / 2, cw, top, true);
      c.fillStyle = "#f0d890"; c.globalAlpha = 0.6; c.beginPath(); c.arc(cx, top + 15, 6.5, 0, TAU); c.fill(); c.globalAlpha = 1;
      c.fillStyle = "#e8c8a0"; c.beginPath(); c.arc(cx, top + 15, 3, 0, TAU); c.fill();
      c.fillStyle = "#7a1a1a"; c.beginPath(); c.moveTo(cx - 9, bot); c.quadraticCurveTo(cx - 7, top + 22, cx, top + 18); c.quadraticCurveTo(cx + 7, top + 22, cx + 9, bot); c.fill();
      c.fillStyle = "#2e5028"; c.beginPath(); c.moveTo(cx - 10, bot); c.quadraticCurveTo(cx - 9, top + 22, cx - 1, top + 17); c.lineTo(cx - 4, bot); c.fill(); c.beginPath(); c.moveTo(cx + 10, bot); c.quadraticCurveTo(cx + 9, top + 22, cx + 1, top + 17); c.lineTo(cx + 4, bot); c.fill();
      c.fillStyle = "#e8c8a0"; c.beginPath(); c.arc(cx, top + 26, 1.6, 0, TAU); c.fill(); done();
      for (const d of [-1, 1]) {
        const px = d < 0 ? cx - cw / 2 - ww - 3 : cx + cw / 2 + 3; done = panel(px, ww, top + 8, false);
        const fx = px + ww / 2; c.fillStyle = d < 0 ? "#4a2440" : "#5a3a18"; c.beginPath(); c.moveTo(fx - 4, bot); c.lineTo(fx - 3, bot - 10); c.quadraticCurveTo(fx, bot - 16, fx + 3, bot - 10); c.lineTo(fx + 4, bot); c.fill(); c.fillStyle = "#e8c8a0"; c.beginPath(); c.arc(fx + d * -1, bot - 15, 2, 0, TAU); c.fill(); c.fillStyle = "rgba(240,216,144,.5)"; c.beginPath(); c.arc(fx + d * -1, bot - 15, 3.4, 0, TAU); c.fill(); done();
      }
      c.fillStyle = "#5a3e16"; c.fillRect(x + 4, bot + 1.5, w - 8, 3); c.fillStyle = gold; c.fillRect(x + 4, bot + 1.5, w - 8, 0.7);
      for (const kx of [x + 6, x + w - 8]) { c.fillStyle = "#e8dcc0"; c.fillRect(kx, bot - 6, 2, 7.5); glow(c, kx + 1, bot - 8, 7, "#ffd890", 0.35); c.fillStyle = "#fff0c0"; c.fillRect(kx + 0.5, bot - 8.5, 1, 2); }
    },
    /* Küchenkamin: Kaminbrust, Sims mit Töpfen, Feuerbogen, Glut, Kessel an der Kette, Rußfahne */
    kamin(c, x, y, w, h, H, r) {
      const P = H.PAL, st = H.lit(H.B.wall, 0.1), bot = y + h, cx = x + w / 2, ow = w - 20, oh = 24, oy = bot - oh;
      sh(c, x + 10, y, w - 18, h, 0.35); c.fillStyle = st; c.fillRect(x + 12, y, w - 24, h - oh - 8);
      c.fillStyle = "rgba(0,0,0,.2)"; for (let yy = y + 4; yy < bot - oh - 8; yy += 6) c.fillRect(x + 12, yy, w - 24, 0.7);
      const sg = c.createLinearGradient(0, y, 0, bot - oh); sg.addColorStop(0, "rgba(10,6,4,.0)"); sg.addColorStop(1, "rgba(10,6,4,.45)"); c.fillStyle = sg; c.fillRect(cx - 9, y, 18, h - oh);
      /* Haube und Sims */
      c.fillStyle = P.stone; c.beginPath(); c.moveTo(x + 12, bot - oh - 8); c.lineTo(x + w - 12, bot - oh - 8); c.lineTo(x + w - 2, bot - oh - 1); c.lineTo(x + 2, bot - oh - 1); c.closePath(); c.fill();
      c.fillStyle = "#4a3020"; c.fillRect(x, bot - oh - 2, w, 3.5); c.fillStyle = "rgba(255,220,170,.25)"; c.fillRect(x, bot - oh - 2, w, 0.6);
      /* Töpfe auf dem Sims */
      for (let k = 0; k < 4; k++) { const px = x + 6 + k * (w - 12) / 3.2, ps = 2.6 + H.h3(k, x, 1460) * 2; c.fillStyle = k % 2 ? CU.m : "#6a5040"; c.beginPath(); c.ellipse(px, bot - oh - 2 - ps, ps, ps, 0, PI, 0); c.lineTo(px + ps, bot - oh - 2); c.lineTo(px - ps, bot - oh - 2); c.fill(); c.fillStyle = k % 2 ? CU.hi : "#8a7060"; c.fillRect(px - ps * 0.6, bot - oh - 2 - ps * 1.4, 1, ps); }
      /* Feuerbogen */
      c.fillStyle = P.stone; c.fillRect(cx - ow / 2 - 4, oy - 2, ow + 8, oh + 2);
      c.fillStyle = "#140a06"; c.beginPath(); c.moveTo(cx - ow / 2, bot); c.lineTo(cx - ow / 2, oy + 6); c.quadraticCurveTo(cx, oy - 3, cx + ow / 2, oy + 6); c.lineTo(cx + ow / 2, bot); c.fill();
      c.strokeStyle = P.stoneHi; c.lineWidth = 0.7; c.beginPath(); c.moveTo(cx - ow / 2 - 4, oy - 2); c.lineTo(cx + ow / 2 + 4, oy - 2); c.stroke();
      c.save(); c.globalCompositeOperation = "lighter"; const g = c.createRadialGradient(cx, bot - 2, 0, cx, bot - 2, 18); g.addColorStop(0, "rgba(255,150,60,.75)"); g.addColorStop(0.5, "rgba(220,80,20,.3)"); g.addColorStop(1, "rgba(200,60,10,0)"); c.fillStyle = g; c.fillRect(cx - ow / 2, oy, ow, oh); c.restore();
      c.fillStyle = "#3a2214"; c.save(); c.translate(cx, bot - 2.5); c.rotate(0.15); c.fillRect(-9, -1.6, 18, 3.2); c.rotate(-0.4); c.fillRect(-8, -1.4, 16, 2.8); c.restore();
      c.fillStyle = "rgba(255,200,100,.9)"; for (let k = 0; k < 7; k++) c.fillRect(cx - 8 + k * 2.6, bot - 1.5 - H.h3(k, y, 1461) * 2.5, 1.2, 1);
      c.fillStyle = "rgba(255,180,80,.75)"; c.beginPath(); c.moveTo(cx - 5, bot - 3); c.quadraticCurveTo(cx - 3, bot - 11, cx - 1, bot - 3); c.moveTo(cx + 1, bot - 3); c.quadraticCurveTo(cx + 3, bot - 13, cx + 5, bot - 3); c.fill();
      /* Kessel an der Kette */
      c.strokeStyle = "#2a2420"; c.lineWidth = 0.8; c.beginPath(); c.moveTo(cx, oy + 2); c.lineTo(cx, bot - 14); c.stroke();
      c.fillStyle = "#1e1a18"; c.beginPath(); c.ellipse(cx, bot - 10, 6, 4.5, 0, 0, TAU); c.fill(); c.fillStyle = "rgba(255,160,70,.35)"; c.fillRect(cx - 5, bot - 8, 10, 0.8); c.strokeStyle = "#1e1a18"; c.beginPath(); c.arc(cx, bot - 13, 5, PI, 0); c.stroke();
    },
    /* Kupfertöpfe an der Hängestange: Pfannen, Töpfe, Kelle, Sieb */
    kupfer(c, x, y, w, h, H, r) {
      const ry = y + 5; c.fillStyle = "rgba(0,0,0,.35)"; c.fillRect(x + 3, ry + 1, w - 4, 2); c.fillStyle = IRON.m; c.fillRect(x + 2, ry, w - 4, 1.6); c.fillStyle = IRON.hi; c.fillRect(x + 2, ry, w - 4, 0.5);
      for (const bx of [x + 3, x + w - 4]) { c.fillStyle = IRON.lo; c.fillRect(bx, ry - 3, 1.4, 5); }
      const n = 5;
      for (let k = 0; k < n; k++) {
        const hx = x + 8 + k * (w - 16) / (n - 1), t = ((H.h3(k, x | 0, 1470) * 4) | 0), hy = ry + 2;
        c.strokeStyle = IRON.m; c.lineWidth = 0.6; c.beginPath(); c.moveTo(hx, hy - 1); c.quadraticCurveTo(hx + 1.5, hy + 1, hx, hy + 3); c.stroke();
        if (t === 0) { /* Pfanne */ c.fillStyle = CU.lo; c.fillRect(hx - 0.8, hy + 3, 1.6, 9); c.fillStyle = CU.m; c.beginPath(); c.arc(hx, hy + 18, 6.5, 0, TAU); c.fill(); c.fillStyle = CU.lo; c.beginPath(); c.arc(hx, hy + 18, 4.8, 0, TAU); c.fill(); c.fillStyle = CU.m; c.beginPath(); c.arc(hx, hy + 18, 4.2, 0, TAU); c.fill(); c.strokeStyle = CU.hi; c.lineWidth = 0.7; c.beginPath(); c.arc(hx, hy + 18, 5.8, PI * 1.1, PI * 1.6); c.stroke(); }
        else if (t === 1) { /* Topf */ c.fillStyle = CU.m; c.beginPath(); c.moveTo(hx - 5, hy + 6); c.lineTo(hx + 5, hy + 6); c.lineTo(hx + 4.5, hy + 15); c.quadraticCurveTo(hx, hy + 17, hx - 4.5, hy + 15); c.fill(); c.fillStyle = CU.lo; c.fillRect(hx - 5.5, hy + 5.5, 11, 1.4); c.fillStyle = CU.hi; c.fillRect(hx - 3.5, hy + 7.5, 1.1, 7); c.strokeStyle = CU.lo; c.lineWidth = 0.7; c.beginPath(); c.arc(hx, hy + 6, 4, PI, 0); c.stroke(); }
        else if (t === 2) { /* Kelle */ c.fillStyle = "#6a6058"; c.fillRect(hx - 0.5, hy + 3, 1, 14); c.fillStyle = CU.m; c.beginPath(); c.arc(hx, hy + 18, 3, 0, PI); c.fill(); c.fillStyle = CU.hi; c.fillRect(hx - 2, hy + 18, 1, 1); }
        else { /* Sieb */ c.fillStyle = CU.m; c.beginPath(); c.arc(hx, hy + 10, 5, 0, PI); c.fill(); c.fillStyle = CU.lo; c.fillRect(hx - 5.5, hy + 9.4, 11, 1.2); c.fillStyle = "rgba(20,10,6,.7)"; for (let j = 0; j < 7; j++) c.fillRect(hx - 3 + (j % 4) * 2, hy + 11.5 + (j > 3 ? 1.6 : 0), 0.7, 0.7); c.strokeStyle = CU.lo; c.lineWidth = 0.7; c.beginPath(); c.arc(hx, hy + 9, 3.6, PI, 0); c.stroke(); }
      }
    },
    /* Waffenrechen: Speere und Hellebarden, Schwerter mit Parierstange oder Bögen mit Köcher */
    waffen(c, x, y, w, h, H, r) {
      const wd = "#4a3020", wl = "#6a4a2e", bot = y + h;
      sh(c, x + 3, y + 6, w - 4, h - 6, 0.3);
      c.fillStyle = wd; c.fillRect(x + 3, y + 8, 2.5, h - 8); c.fillRect(x + w - 5.5, y + 8, 2.5, h - 8); c.fillRect(x + 2, y + 12, w - 4, 2.4); c.fillRect(x + 2, bot - 8, w - 4, 2.4); c.fillStyle = wl; c.fillRect(x + 2, y + 12, w - 4, 0.6); c.fillRect(x + 2, bot - 8, w - 4, 0.6);
      if (r < 0.5) {
        for (let k = 0; k < 5; k++) { const sx = x + 9 + k * (w - 18) / 4, lean = (H.h3(k, x | 0, 1480) - 0.5) * 3, top = y + 1 + H.h3(k, y | 0, 1481) * 5;
          c.strokeStyle = "#5a3a22"; c.lineWidth = 1.2; c.beginPath(); c.moveTo(sx, bot - 1); c.lineTo(sx + lean, top + 5); c.stroke();
          c.fillStyle = IRON.hi; c.beginPath(); if (k % 2) { c.moveTo(sx + lean, top - 2); c.lineTo(sx + lean + 1.8, top + 5); c.lineTo(sx + lean - 1.8, top + 5); } else { c.moveTo(sx + lean, top - 1); c.lineTo(sx + lean + 1, top + 4); c.lineTo(sx + lean + 4.5, top + 3); c.lineTo(sx + lean + 4.5, top + 8); c.lineTo(sx + lean, top + 7); c.lineTo(sx + lean - 1, top + 4); } c.fill(); c.fillStyle = IRON.lo; c.fillRect(sx + lean - 0.8, top + 5, 1.6, 1); }
      } else if (r < 0.8) {
        for (let k = 0; k < 4; k++) { const sx = x + 10 + k * (w - 20) / 3, top = y + 11;
          c.fillStyle = "#3a2a1e"; c.fillRect(sx - 0.8, top - 6, 1.6, 6); c.fillStyle = "#b08a3a"; c.beginPath(); c.arc(sx, top - 6.5, 1.3, 0, TAU); c.fill(); c.fillRect(sx - 4, top - 0.6, 8, 1.4);
          c.fillStyle = IRON.m; c.beginPath(); c.moveTo(sx - 1.6, top + 1); c.lineTo(sx + 1.6, top + 1); c.lineTo(sx + 1.2, bot - 12); c.lineTo(sx, bot - 9); c.lineTo(sx - 1.2, bot - 12); c.fill(); c.fillStyle = IRON.hi; c.fillRect(sx - 0.2, top + 1, 0.5, bot - top - 13); }
      } else {
        for (let k = 0; k < 2; k++) { const bx = x + 12 + k * 14; c.strokeStyle = "#7a4a22"; c.lineWidth = 1.4; c.beginPath(); c.moveTo(bx, y + 4); c.quadraticCurveTo(bx + 8, y + h / 2, bx, bot - 4); c.stroke(); c.strokeStyle = "rgba(230,220,200,.5)"; c.lineWidth = 0.4; c.beginPath(); c.moveTo(bx, y + 4); c.lineTo(bx, bot - 4); c.stroke(); }
        const qx = x + w - 12; c.fillStyle = "#5a3018"; c.beginPath(); c.moveTo(qx - 3, y + 14); c.lineTo(qx + 3, y + 14); c.lineTo(qx + 2.4, bot - 6); c.lineTo(qx - 2.4, bot - 6); c.fill(); for (let k = 0; k < 4; k++) { c.strokeStyle = "#8a6a40"; c.lineWidth = 0.5; c.beginPath(); c.moveTo(qx - 2 + k * 1.3, y + 14); c.lineTo(qx - 2.5 + k * 1.6, y + 6); c.stroke(); c.fillStyle = k % 2 ? "#c8c0b0" : "#9a2a2a"; c.fillRect(qx - 3.2 + k * 1.6, y + 5, 1.4, 3); }
      }
    },
    /* Fassreihe: zwei große Stückfässer auf dem Lager, ein kleines obenauf, Zapfhahn, Kreidezeichen */
    faesser(c, x, y, w, h, H, r) {
      const bot = y + h, cradle = "#3a2618";
      const barrel = (bx, by, R, tap) => {
        c.fillStyle = "rgba(0,0,0,.4)"; c.beginPath(); c.arc(bx + 1.5, by + 1.5, R, 0, TAU); c.fill();
        c.fillStyle = "#5a3a22"; c.beginPath(); c.arc(bx, by, R, 0, TAU); c.fill();
        c.save(); c.beginPath(); c.arc(bx, by, R - 2, 0, TAU); c.clip(); const n = Math.round(R / 2.2);
        for (let k = 0; k < n; k++) { c.fillStyle = k % 2 ? "#6a4628" : "#5e3e22"; c.fillRect(bx - R + k * (2 * R / n), by - R, 2 * R / n, 2 * R); c.fillStyle = "rgba(0,0,0,.25)"; c.fillRect(bx - R + k * (2 * R / n), by - R, 0.5, 2 * R); }
        const g = c.createRadialGradient(bx - R * 0.3, by - R * 0.3, 1, bx, by, R); g.addColorStop(0, "rgba(255,220,170,.12)"); g.addColorStop(1, "rgba(0,0,0,.3)"); c.fillStyle = g; c.fillRect(bx - R, by - R, 2 * R, 2 * R); c.restore();
        c.strokeStyle = IRON.m; c.lineWidth = 1.8; c.beginPath(); c.arc(bx, by, R - 1, 0, TAU); c.stroke(); c.strokeStyle = "rgba(200,190,180,.3)"; c.lineWidth = 0.5; c.beginPath(); c.arc(bx, by, R - 0.6, PI * 1.05, PI * 1.6); c.stroke();
        if (tap) { c.fillStyle = "#8a6a3a"; c.fillRect(bx - 1, by + R * 0.45, 2, 4); c.fillRect(bx - 2.5, by + R * 0.45 + 3, 5, 1.4); c.fillStyle = "#c8a050"; c.fillRect(bx - 0.5, by + R * 0.45 + 4.4, 1, 1.4); }
        if (H.h3(bx | 0, by | 0, 1490) < 0.6) { c.strokeStyle = "rgba(240,236,224,.3)"; c.lineWidth = 0.5; c.beginPath(); const k = (H.h3(bx | 0, 1, 1491) * 3) | 0; if (k === 0) { c.moveTo(bx - 3, by - 4); c.lineTo(bx - 1, by - 7); c.lineTo(bx + 1, by - 4); c.moveTo(bx + 3, by - 7); c.lineTo(bx + 3, by - 4); } else if (k === 1) { c.arc(bx, by - 5, 2, 0, TAU); } else { for (let i = 0; i < 4; i++) { c.moveTo(bx - 3 + i * 1.6, by - 7); c.lineTo(bx - 3 + i * 1.6, by - 3); } c.moveTo(bx - 4, by - 4); c.lineTo(bx + 3.5, by - 6.5); } c.stroke(); }
      };
      c.fillStyle = cradle; c.fillRect(x + 2, bot - 4, w - 4, 4); c.fillStyle = "rgba(255,220,170,.18)"; c.fillRect(x + 2, bot - 4, w - 4, 0.6);
      for (const bx of [x + 4, x + w / 2 - 2, x + w - 8]) { c.fillStyle = cradle; c.beginPath(); c.moveTo(bx, bot - 4); c.lineTo(bx + 6, bot - 4); c.lineTo(bx + 3, bot - 10); c.fill(); }
      const R = Math.min(16, (w - 10) / 4.4); barrel(x + 4 + R, bot - 4 - R, R, true); barrel(x + w - 4 - R, bot - 4 - R, R, r < 0.6);
      if (h > 2 * R + 14) barrel(x + w / 2, bot - 4 - 2 * R - R * 0.38, R * 0.55, false);
    },
    /* Folterwand: Zangen, Säge, Brandeisen, Fesseln an der Kette, Peitsche, dunkle Flecken */
    folter(c, x, y, w, h, H, r) {
      const by = y + 6; c.fillStyle = "#3a2618"; c.fillRect(x + 2, by - 2, w - 4, 3); c.fillStyle = "rgba(255,220,170,.15)"; c.fillRect(x + 2, by - 2, w - 4, 0.6);
      for (let k = 0; k < 6; k++) peg(c, x + 7 + k * (w - 14) / 5, by + 2);
      const X = k => x + 7 + k * (w - 14) / 5, Y = by + 3;
      /* Zange */ c.strokeStyle = IRON.m; c.lineWidth = 1.2; c.beginPath(); c.moveTo(X(0) - 2, Y + 18); c.lineTo(X(0) + 1.5, Y + 3); c.moveTo(X(0) + 2, Y + 18); c.lineTo(X(0) - 1.5, Y + 3); c.stroke(); c.fillStyle = IRON.lo; c.beginPath(); c.arc(X(0), Y + 7, 1, 0, TAU); c.fill();
      /* Säge */ c.fillStyle = "#5a3a22"; c.fillRect(X(1) - 1.4, Y, 2.8, 5); c.fillStyle = IRON.m; c.beginPath(); c.moveTo(X(1) - 2, Y + 5); c.lineTo(X(1) + 2, Y + 5); c.lineTo(X(1) + 1.2, Y + 22); c.lineTo(X(1) - 2, Y + 22); c.closePath(); c.fill(); c.fillStyle = IRON.lo; for (let k = 0; k < 8; k++) { c.beginPath(); c.moveTo(X(1) - 2, Y + 6 + k * 2); c.lineTo(X(1) - 3.2, Y + 7 + k * 2); c.lineTo(X(1) - 2, Y + 8 + k * 2); c.fill(); }
      /* Fesseln an der Kette */ c.strokeStyle = IRON.m; c.lineWidth = 0.9; c.beginPath(); for (let k = 0; k < 7; k++) { c.ellipse(X(2) + 2 + Math.sin(k * 0.6) * 2, Y + 2 + k * 2.4, 1, 1.4, 0, 0, TAU); } c.stroke(); c.lineWidth = 1.3; c.beginPath(); c.arc(X(2) - 1, Y + 21, 3, 0, TAU); c.moveTo(X(2) + 8, Y + 21); c.arc(X(2) + 5, Y + 21, 3, 0, TAU); c.stroke(); c.lineWidth = 0.8; c.beginPath(); c.moveTo(X(2) + 2, Y + 18); c.lineTo(X(2) - 1, Y + 18); c.moveTo(X(2) + 2, Y + 18); c.lineTo(X(2) + 5, Y + 18); c.stroke();
      /* Brandeisen */ c.fillStyle = "#5a3a22"; c.fillRect(X(3) - 1, Y, 2, 7); c.fillStyle = IRON.m; c.fillRect(X(3) - 0.6, Y + 7, 1.2, 12); c.strokeStyle = IRON.m; c.lineWidth = 1.1; c.beginPath(); c.arc(X(3), Y + 22, 2.6, 0, TAU); c.moveTo(X(3) - 2.6, Y + 22); c.lineTo(X(3) + 2.6, Y + 22); c.stroke();
      /* Peitsche */ c.fillStyle = "#4a2a18"; c.fillRect(X(4) - 1, Y, 2, 6); c.strokeStyle = "#3a2214"; c.lineWidth = 0.8; c.beginPath(); c.moveTo(X(4), Y + 6); c.bezierCurveTo(X(4) + 5, Y + 12, X(4) - 6, Y + 16, X(4) + 1, Y + 22); c.moveTo(X(4), Y + 6); c.bezierCurveTo(X(4) - 3, Y + 14, X(4) + 4, Y + 18, X(4) - 2, Y + 24); c.stroke();
      /* Daumenschraube */ c.fillStyle = IRON.m; c.fillRect(X(5) - 3, Y + 4, 6, 2); c.fillRect(X(5) - 3, Y + 10, 6, 2); c.fillRect(X(5) - 0.6, Y + 1, 1.2, 12); c.fillRect(X(5) - 2.5, Y + 1, 5, 1.2);
      /* dunkle Flecken an der Wand darunter */
      for (let k = 0; k < 4; k++) { const fx = x + 8 + H.h3(k, x | 0, 1500) * (w - 16), fy = y + h - 12 + H.h3(k, y | 0, 1501) * 6; c.fillStyle = "rgba(60,14,10,.28)"; c.beginPath(); c.ellipse(fx, fy, 3 + H.h3(k, 2, 1502) * 4, 1.6, 0, 0, TAU); c.fill(); c.fillRect(fx - 0.4, fy, 0.8, 3 + H.h3(k, 3, 1503) * 5); }
    },
    /* Wirtshausschild am geschmiedeten Ausleger: Krug mit Schaum, roter Rand */
    wirtsschild(c, x, y, w, h, H, r) {
      const ay = y + 5; c.fillStyle = IRON.lo; c.fillRect(x + 1, ay - 3, 3, 8); c.fillStyle = IRON.m; c.fillRect(x + 2, ay, w - 6, 1.6);
      c.strokeStyle = IRON.m; c.lineWidth = 1; c.beginPath(); c.moveTo(x + 3, ay + 6); c.quadraticCurveTo(x + 14, ay + 6, x + 20, ay + 1.5); c.stroke(); c.beginPath(); c.arc(x + 10, ay + 3.2, 2.2, 0, TAU); c.stroke();
      const bx = x + 14, bw = w - 18, bt = ay + 7, bh = h - 14;
      c.strokeStyle = "#2a2420"; c.lineWidth = 0.6; c.beginPath(); c.moveTo(bx + 2, ay + 1.6); c.lineTo(bx + 2, bt); c.moveTo(bx + bw - 2, ay + 1.6); c.lineTo(bx + bw - 2, bt); c.stroke();
      sh(c, bx + 1.5, bt + 1.5, bw, bh, 0.4); c.fillStyle = "#5a3a22"; c.fillRect(bx, bt, bw, bh); c.fillStyle = "#8a2a22"; c.fillRect(bx + 1, bt + 1, bw - 2, bh - 2); c.fillStyle = "#3a2214"; c.fillRect(bx + 2.2, bt + 2.2, bw - 4.4, bh - 4.4);
      const mx = bx + bw / 2 - 2, my = bt + bh / 2 + 1, ic = r < 0.5;
      if (ic) { c.fillStyle = "#c8902a"; c.fillRect(mx - 4, my - 4, 8, 8); c.fillStyle = "#e8b850"; c.fillRect(mx - 4, my - 4, 2, 8); c.strokeStyle = "#c8902a"; c.lineWidth = 1.2; c.beginPath(); c.arc(mx + 4.5, my, 2.6, -PI / 2, PI / 2); c.stroke(); c.fillStyle = "#f0e8d8"; c.beginPath(); c.arc(mx - 2.5, my - 4.5, 2, 0, TAU); c.arc(mx, my - 5, 2.3, 0, TAU); c.arc(mx + 2.6, my - 4.4, 1.9, 0, TAU); c.fill(); }
      else { /* Fisch und Anker – Hafentaverne */ c.fillStyle = "#c8902a"; c.beginPath(); c.ellipse(mx, my, 6, 3, 0, 0, TAU); c.fill(); c.beginPath(); c.moveTo(mx + 5, my); c.lineTo(mx + 9, my - 3); c.lineTo(mx + 9, my + 3); c.fill(); c.fillStyle = "#3a2214"; c.beginPath(); c.arc(mx - 3.5, my - 0.6, 0.8, 0, TAU); c.fill(); }
    },
    /* Krugbord: zwei Bretter mit Zinnkrügen, Tonbechern, Kanne und angelehnten Tellern; Krüge am Haken */
    krugbord(c, x, y, w, h, H, r) {
      for (let s = 0; s < 2; s++) {
        const sy = y + 12 + s * 14; c.fillStyle = "#4a3020"; c.fillRect(x + 2, sy, w - 4, 2); c.fillStyle = "rgba(255,220,170,.22)"; c.fillRect(x + 2, sy, w - 4, 0.5); c.fillStyle = "rgba(0,0,0,.35)"; c.fillRect(x + 3, sy + 2, w - 6, 1.2);
        c.fillStyle = "#3a2618"; c.beginPath(); c.moveTo(x + 4, sy + 2); c.lineTo(x + 7, sy + 2); c.lineTo(x + 4, sy + 6); c.fill(); c.beginPath(); c.moveTo(x + w - 4, sy + 2); c.lineTo(x + w - 7, sy + 2); c.lineTo(x + w - 4, sy + 6); c.fill();
        let bx = x + 5;
        for (let k = 0; k < 7 && bx < x + w - 8; k++) {
          const t = ((H.h3(k + s * 9, x | 0, 1510) * 4) | 0);
          if (t === 0) { c.fillStyle = "#8a8478"; c.fillRect(bx, sy - 7, 5, 7); c.fillStyle = "#b0aaa0"; c.fillRect(bx, sy - 7, 1.2, 7); c.fillStyle = "#6a645a"; c.fillRect(bx - 0.4, sy - 7.6, 5.8, 1.2); c.strokeStyle = "#6a645a"; c.lineWidth = 0.9; c.beginPath(); c.arc(bx + 5.6, sy - 3.6, 1.8, -PI / 2, PI / 2); c.stroke(); bx += 9; }
          else if (t === 1) { c.fillStyle = "#9a5a30"; c.beginPath(); c.moveTo(bx, sy); c.lineTo(bx + 0.6, sy - 5); c.lineTo(bx + 3.4, sy - 5); c.lineTo(bx + 4, sy); c.fill(); c.fillStyle = "rgba(255,220,170,.3)"; c.fillRect(bx + 0.8, sy - 4.6, 0.8, 4); bx += 6; }
          else if (t === 2) { c.fillStyle = "#c8b898"; c.beginPath(); c.ellipse(bx + 4, sy - 5, 4, 5, 0, 0, TAU); c.fill(); c.strokeStyle = "#8a2a22"; c.lineWidth = 0.7; c.beginPath(); c.ellipse(bx + 4, sy - 5, 2.6, 3.4, 0, 0, TAU); c.stroke(); c.fillStyle = "rgba(0,0,0,.3)"; c.fillRect(bx + 7, sy - 9, 1, 9); bx += 9; }
          else { c.fillStyle = "#7a4a28"; c.beginPath(); c.moveTo(bx + 1, sy); c.quadraticCurveTo(bx - 1, sy - 6, bx + 2, sy - 9); c.lineTo(bx + 4, sy - 9); c.quadraticCurveTo(bx + 7, sy - 6, bx + 5, sy); c.fill(); c.fillStyle = "#7a4a28"; c.beginPath(); c.moveTo(bx + 2, sy - 9); c.lineTo(bx + 0.4, sy - 10.5); c.lineTo(bx + 3, sy - 9.6); c.fill(); c.fillStyle = "rgba(255,220,170,.3)"; c.fillRect(bx + 1.4, sy - 7, 0.8, 5); bx += 9; }
        }
      }
    },
    /* Kerkerzelle hinter Gittern: Stroh, Kette, Gerippe oder Eimer */
    kerker(c, x, y, w, h, H, r) {
      const P = H.PAL, bot = y + h, ix = x + 4, iw = w - 8, it = y + 6;
      c.fillStyle = P.stone; c.fillRect(ix - 3, it - 3, iw + 6, bot - it + 3); c.fillStyle = P.stoneHi; c.fillRect(ix - 3, it - 3, iw + 6, 0.8);
      c.fillStyle = "#0c0908"; c.fillRect(ix, it, iw, bot - it); const g = c.createLinearGradient(0, it, 0, bot); g.addColorStop(0, "rgba(0,0,0,.5)"); g.addColorStop(1, "rgba(60,40,24,.25)"); c.fillStyle = g; c.fillRect(ix, it, iw, bot - it);
      c.strokeStyle = "rgba(200,170,90,.45)"; c.lineWidth = 0.5; c.beginPath(); for (let k = 0; k < 22; k++) { const sx = ix + H.h3(k, x | 0, 1520) * iw, a = (H.h3(k, 1, 1521) - 0.5) * 1.2; c.moveTo(sx, bot - 0.5); c.lineTo(sx + Math.sin(a) * 5, bot - 1 - Math.cos(a) * 2); } c.stroke();
      if (r < 0.55) { const sx = ix + iw * 0.62, sy = bot - 7; c.strokeStyle = IRON.m; c.lineWidth = 0.6; c.beginPath(); c.moveTo(sx - 5, it + 3); c.lineTo(sx - 4, sy - 8); c.moveTo(sx + 5, it + 3); c.lineTo(sx + 4, sy - 8); c.stroke(); c.strokeStyle = "#bdb39a"; c.lineWidth = 1; c.beginPath(); c.moveTo(sx, sy - 6); c.lineTo(sx, sy + 2); c.moveTo(sx - 4, sy - 8); c.lineTo(sx, sy - 4); c.lineTo(sx + 4, sy - 8); c.moveTo(sx, sy + 2); c.lineTo(sx - 5, sy + 6); c.moveTo(sx, sy + 2); c.lineTo(sx + 6, sy + 6.5); c.stroke(); c.lineWidth = 0.5; c.beginPath(); for (let k = 0; k < 3; k++) { c.moveTo(sx - 2.4, sy - 4 + k * 1.8); c.lineTo(sx + 2.4, sy - 4 + k * 1.8); } c.stroke(); skull(c, sx + 0.6, sy - 9.5, 0.75, "#bdb39a"); }
      else { const ex = ix + iw * 0.3; c.fillStyle = "#4a3422"; c.beginPath(); c.moveTo(ex - 4, bot - 8); c.lineTo(ex + 4, bot - 8); c.lineTo(ex + 3.4, bot); c.lineTo(ex - 3.4, bot); c.fill(); c.fillStyle = IRON.m; c.fillRect(ex - 4, bot - 6, 8, 0.8); c.fillRect(ex - 3.6, bot - 2.4, 7.2, 0.8); if (r > 0.8) { c.fillStyle = "rgba(255,200,90,.7)"; c.fillRect(ix + iw * 0.7, it + 12, 1.2, 0.8); c.fillRect(ix + iw * 0.7 + 3.4, it + 12, 1.2, 0.8); } }
      c.fillStyle = IRON.m; for (let k = 0; k <= 7; k++) { const bx = ix + k * iw / 7; c.fillRect(bx - 0.9, it - 1, 1.8, bot - it + 1); } c.fillStyle = "rgba(200,190,180,.25)"; for (let k = 0; k <= 7; k++) c.fillRect(ix + k * iw / 7 - 0.9, it - 1, 0.5, bot - it + 1);
      c.fillStyle = IRON.m; c.fillRect(ix - 1, it + 4, iw + 2, 1.8); c.fillRect(ix - 1, bot - 9, iw + 2, 1.8); c.fillStyle = "rgba(120,52,20,.45)"; c.fillRect(ix - 1, it + 5.8, iw + 2, 1.2);
      c.fillStyle = IRON.lo; c.fillRect(ix + iw * 0.5 - 2, it + 14, 4, 5); c.fillStyle = "#000"; c.fillRect(ix + iw * 0.5 - 0.5, it + 15.5, 1, 2);
    },
    /* Uhrwerk: großes Zifferblatt mit Stundenmarken, Zeigern und offenem Räderwerk dahinter */
    uhr(c, x, y, w, h, H, r) {
      const cx = x + w / 2, cy = y + h / 2, R = Math.min(w, h) / 2 - 3, brass = "#b08a3a", brassL = "#e0c070", brassD = "#5a4418";
      c.fillStyle = "rgba(0,0,0,.45)"; c.beginPath(); c.arc(cx + 2, cy + 2, R + 1, 0, TAU); c.fill();
      c.fillStyle = H.PAL.stone; c.beginPath(); c.arc(cx, cy, R + 1, 0, TAU); c.fill(); c.fillStyle = "#2a1e14"; c.beginPath(); c.arc(cx, cy, R - 3, 0, TAU); c.fill();
      /* Räderwerk hinter dem Blatt */
      c.save(); c.beginPath(); c.arc(cx, cy, R - 3, 0, TAU); c.clip();
      const wheel = (gx, gy, gr, n, rot) => { c.fillStyle = brassD; c.beginPath(); for (let k = 0; k < n * 2; k++) { const a = rot + k / (n * 2) * TAU, rr = k % 2 ? gr : gr - 1.6; c.lineTo(gx + Math.cos(a) * rr, gy + Math.sin(a) * rr); } c.closePath(); c.fill(); c.fillStyle = "#2a1e14"; c.beginPath(); c.arc(gx, gy, gr - 3, 0, TAU); c.fill(); c.fillStyle = brassD; for (let k = 0; k < 3; k++) { c.save(); c.translate(gx, gy); c.rotate(rot + k * PI / 3); c.fillRect(-gr + 3, -0.7, (gr - 3) * 2, 1.4); c.restore(); } };
      wheel(cx - R * 0.35, cy + R * 0.4, R * 0.42, 14, r); wheel(cx + R * 0.38, cy + R * 0.3, R * 0.3, 10, r * 3); wheel(cx + R * 0.1, cy - R * 0.45, R * 0.28, 9, r * 2);
      c.restore();
      c.strokeStyle = brass; c.lineWidth = 2.2; c.beginPath(); c.arc(cx, cy, R - 2, 0, TAU); c.stroke(); c.strokeStyle = brassL; c.lineWidth = 0.6; c.beginPath(); c.arc(cx, cy, R - 1.2, PI * 1.05, PI * 1.6); c.stroke();
      c.lineWidth = 3.2; c.strokeStyle = "rgba(200,180,140,.55)"; c.beginPath(); c.arc(cx, cy, R - 6.5, 0, TAU); c.stroke();
      for (let k = 0; k < 12; k++) { const a = k / 12 * TAU - PI / 2, big = k % 3 === 0; c.fillStyle = big ? brassL : brass; c.save(); c.translate(cx + Math.cos(a) * (R - 6.5), cy + Math.sin(a) * (R - 6.5)); c.rotate(a + PI / 2); c.fillRect(-0.6, -2, 1.2, 4); if (big) c.fillRect(-1.8, -2, 1, 4), c.fillRect(0.8, -2, 1, 4); c.restore(); }
      const ah = -PI / 2 + r * TAU, am = -PI / 2 + ((r * 12) % 1) * TAU;
      c.strokeStyle = "#1a120a"; c.lineWidth = 2; c.beginPath(); c.moveTo(cx, cy); c.lineTo(cx + Math.cos(ah) * R * 0.45, cy + Math.sin(ah) * R * 0.45); c.stroke(); c.lineWidth = 1.2; c.beginPath(); c.moveTo(cx, cy); c.lineTo(cx + Math.cos(am) * R * 0.7, cy + Math.sin(am) * R * 0.7); c.stroke();
      c.fillStyle = brassL; c.beginPath(); c.arc(cx + Math.cos(am) * R * 0.7, cy + Math.sin(am) * R * 0.7, 1.3, 0, TAU); c.fill(); c.fillStyle = brass; c.beginPath(); c.arc(cx, cy, 2.4, 0, TAU); c.fill(); c.fillStyle = brassL; c.fillRect(cx - 1, cy - 1.4, 1, 1);
    },
    /* Gießerei: Werkbank mit Glocken- und Barrenformen, frisch gegossener Barren glüht, Kellen an der Wand */
    gussform(c, x, y, w, h, H, r) {
      const bot = y + h, tb = bot - 14;
      for (let k = 0; k < 3; k++) { const lx = x + 10 + k * 16; peg(c, lx, y + 4); c.fillStyle = IRON.m; c.fillRect(lx - 0.6, y + 5, 1.2, 14); c.fillStyle = IRON.lo; c.beginPath(); c.arc(lx, y + 21, 3.4 - k * 0.4, 0, PI); c.fill(); c.fillStyle = "rgba(255,120,40,.25)"; c.fillRect(lx - 2.6, y + 21, 5.2, 0.8); }
      c.fillStyle = "#3a2618"; c.fillRect(x + 2, tb, w - 4, 3); c.fillRect(x + 4, tb + 3, 2.4, bot - tb - 3); c.fillRect(x + w - 6.4, tb + 3, 2.4, bot - tb - 3); c.fillStyle = "rgba(255,220,170,.2)"; c.fillRect(x + 2, tb, w - 4, 0.6);
      /* Glockenform aus Lehm */
      const gx = x + 16; c.fillStyle = "#8a6a4a"; c.beginPath(); c.moveTo(gx - 9, tb); c.quadraticCurveTo(gx - 8, tb - 10, gx - 4, tb - 16); c.quadraticCurveTo(gx, tb - 19, gx + 4, tb - 16); c.quadraticCurveTo(gx + 8, tb - 10, gx + 9, tb); c.fill(); c.fillStyle = "rgba(255,230,190,.2)"; c.fillRect(gx - 6, tb - 12, 1.2, 10); c.strokeStyle = "rgba(0,0,0,.35)"; c.lineWidth = 0.6; c.beginPath(); c.moveTo(gx - 8, tb - 5); c.lineTo(gx + 8, tb - 5); c.moveTo(gx - 6, tb - 11); c.lineTo(gx + 6, tb - 11); c.stroke();
      /* Barrenform mit Glut */
      const mx = x + w - 22; c.fillStyle = IRON.lo; c.fillRect(mx - 9, tb - 4, 18, 4); c.fillStyle = "#2a1408"; for (let k = 0; k < 3; k++) c.fillRect(mx - 8 + k * 6, tb - 3.4, 4.6, 2.6);
      c.save(); c.globalCompositeOperation = "lighter"; for (let k = 0; k < (r < 0.6 ? 2 : 1); k++) { c.fillStyle = "rgba(255,150,60,.9)"; c.fillRect(mx - 8 + k * 6, tb - 3.4, 4.6, 2.6); c.fillStyle = "rgba(255,230,150,.8)"; c.fillRect(mx - 7 + k * 6, tb - 3, 2.4, 0.8); } c.restore(); glow(c, mx - 4, tb - 3, 12, "#ff8a40", 0.3);
      /* Tiegel */ c.fillStyle = "#5a4a3a"; c.beginPath(); c.moveTo(x + w - 10, tb); c.lineTo(x + w - 9, tb - 7); c.lineTo(x + w - 3, tb - 7); c.lineTo(x + w - 4, tb); c.fill();
      for (let k = 0; k < 3; k++) { c.fillStyle = "#8a7a6a"; c.fillRect(x + 8 + k * 7, bot - 4, 6, 4); c.fillStyle = "rgba(255,240,220,.2)"; c.fillRect(x + 8 + k * 7, bot - 4, 6, 0.6); }
    },
    /* Tempelrelief: Fries mit fischköpfigen Gestalten, die einer Sonnenscheibe huldigen; Wellenband, Algen */
    relief(c, x, y, w, h, H, r) {
      const st = H.lit(H.B.wall, 0.14), hi = H.lit(st, 0.25), lo = H.lit(st, -0.3), cx = x + w / 2, cy = y + h / 2;
      sh(c, x + 3, y + 3, w - 4, h - 4, 0.4); c.fillStyle = st; c.fillRect(x + 2, y + 2, w - 4, h - 4); c.fillStyle = lo; c.fillRect(x + 4, y + 7, w - 8, h - 16);
      c.fillStyle = hi; c.fillRect(x + 2, y + 2, w - 4, 0.8);
      c.strokeStyle = hi; c.lineWidth = 0.8; c.beginPath(); for (let xx = x + 4; xx < x + w - 4; xx += 6) { c.moveTo(xx, y + h - 6); c.quadraticCurveTo(xx + 1.5, y + h - 9.5, xx + 3, y + h - 7); c.quadraticCurveTo(xx + 4.5, y + h - 4.5, xx + 6, y + h - 6); } c.stroke();
      c.fillStyle = st; c.beginPath(); c.arc(cx, cy - 2, 6, 0, TAU); c.fill(); c.strokeStyle = hi; c.lineWidth = 0.6; for (let k = 0; k < 10; k++) { const a = k / 10 * TAU; c.beginPath(); c.moveTo(cx + Math.cos(a) * 7, cy - 2 + Math.sin(a) * 7); c.lineTo(cx + Math.cos(a) * 9.5, cy - 2 + Math.sin(a) * 9.5); c.stroke(); } c.fillStyle = lo; c.beginPath(); c.arc(cx, cy - 2, 2, 0, TAU); c.fill();
      for (const d of [-1, 1]) for (let k = 0; k < 2; k++) {
        const fx = cx + d * (15 + k * 11), fb = y + h - 10; c.fillStyle = st;
        c.beginPath(); c.moveTo(fx - 3, fb); c.lineTo(fx - 2, fb - 12); c.lineTo(fx + 2, fb - 12); c.lineTo(fx + 3, fb); c.fill();
        c.beginPath(); c.ellipse(fx - d * 0.5, fb - 15, 3.4, 2.6, d * 0.3, 0, TAU); c.fill(); c.beginPath(); c.moveTo(fx + d * 2, fb - 16); c.lineTo(fx + d * 5, fb - 18); c.lineTo(fx + d * 5, fb - 13); c.fill();
        c.fillStyle = lo; c.fillRect(fx - d * 1.6 - 0.5, fb - 16, 1, 1); c.strokeStyle = st; c.lineWidth = 1.1; c.beginPath(); c.moveTo(fx - d * 1, fb - 10); c.lineTo(fx - d * 5, fb - 15); c.stroke();
        c.fillStyle = hi; c.fillRect(fx - 2, fb - 12, 0.6, 12);
      }
      for (let k = 0; k < 10; k++) { const ax = x + 3 + H.h3(k, x | 0, 1530) * (w - 6), ay = y + 2 + H.h3(k, y | 0, 1531) * h * 0.4; c.fillStyle = "rgba(70,110,50,.35)"; c.beginPath(); c.ellipse(ax, ay, 2 + H.h3(k, 1, 1532) * 3, 1.2, 0, 0, TAU); c.fill(); c.fillRect(ax - 0.3, ay, 0.6, 2 + H.h3(k, 2, 1533) * 6); }
      if (r < 0.4) { c.strokeStyle = "rgba(0,0,0,.5)"; c.lineWidth = 0.7; c.beginPath(); c.moveTo(x + w * 0.7, y + 2); c.lineTo(x + w * 0.66, y + h * 0.4); c.lineTo(x + w * 0.74, y + h * 0.7); c.stroke(); }
    },
    /* Eiersäcke: durchscheinende Trauben mit Schatten von Gelegen darin, nasser Glanz, Seidenfäden */
    eier(c, x, y, w, h, H, r) {
      c.strokeStyle = "rgba(236,228,244,.3)"; c.lineWidth = 0.4; c.beginPath(); for (let k = 0; k < 7; k++) { const sx = x + 4 + k * (w - 8) / 6; c.moveTo(sx, y); c.lineTo(sx + (H.h3(k, x | 0, 1540) - 0.5) * 10, y + h * 0.5); } c.stroke();
      const n = 9;
      for (let k = 0; k < n; k++) {
        const ex = x + 8 + H.h3(k, x | 0, 1541) * (w - 16), ey = y + h * 0.35 + H.h3(k, y | 0, 1542) * h * 0.52, rx = 3.4 + H.h3(k, 3, 1543) * 3, ry = rx * 1.25;
        c.fillStyle = "rgba(0,0,0,.3)"; c.beginPath(); c.ellipse(ex + 1, ey + 1.2, rx, ry, 0, 0, TAU); c.fill();
        c.fillStyle = k % 3 ? "rgba(210,196,210,.78)" : "rgba(226,214,186,.78)"; c.beginPath(); c.ellipse(ex, ey, rx, ry, 0, 0, TAU); c.fill();
        c.fillStyle = "rgba(60,30,50,.45)"; c.beginPath(); c.arc(ex + 0.4, ey + 0.6, rx * 0.45, 0.4, TAU - 0.6); c.fill();
        c.fillStyle = "rgba(255,250,255,.55)"; c.beginPath(); c.ellipse(ex - rx * 0.4, ey - ry * 0.45, rx * 0.22, ry * 0.3, -0.4, 0, TAU); c.fill();
      }
      const g = c.createLinearGradient(0, y + h - 8, 0, y + h); g.addColorStop(0, "rgba(200,220,170,0)"); g.addColorStop(1, "rgba(200,220,170,.15)"); c.fillStyle = g; c.fillRect(x + 6, y + h - 8, w - 12, 8);
    },
    /* Schädelnischen eines Beinhauses: gewölbte Fächer mit Schädeln, gekreuzte Knochen dazwischen */
    schaedel(c, x, y, w, h, H, r) {
      const P = H.PAL, cols = 4, rows = 2, cw = (w - 6) / cols, ch = (h - 8) / rows;
      sh(c, x + 3, y + 3, w - 4, h - 4, 0.35); c.fillStyle = P.stone; c.fillRect(x + 2, y + 2, w - 4, h - 4); c.fillStyle = P.stoneHi; c.fillRect(x + 2, y + 2, w - 4, 0.8);
      for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
        const nx = x + 4 + i * cw, ny = y + 5 + j * ch, nw = cw - 3, nh = ch - 4; c.fillStyle = "#120c0a"; c.beginPath(); c.moveTo(nx, ny + nh); c.lineTo(nx, ny + nw / 2); c.arc(nx + nw / 2, ny + nw / 2, nw / 2, PI, 0); c.lineTo(nx + nw, ny + nh); c.fill();
        if (H.h3(i, j + (y | 0), 1550) < 0.85) skull(c, nx + nw / 2, ny + nh - 3.6, 1, H.h3(i, j, 1551) < 0.5 ? "#c8bca0" : "#b0a488");
        if (H.h3(i, j + (x | 0), 1552) < 0.4) { c.strokeStyle = "#a89c80"; c.lineWidth = 1; c.beginPath(); c.moveTo(nx + 1, ny + nh - 0.6); c.lineTo(nx + nw - 1, ny + nh - 1.4); c.stroke(); }
      }
      c.strokeStyle = "#b0a488"; c.lineWidth = 1.2; for (let i = 0; i < cols - 1; i++) { const bx = x + 4 + (i + 1) * cw - 1.5, by = y + h - 5; c.beginPath(); c.moveTo(bx - 3, by - 3); c.lineTo(bx + 3, by + 2); c.moveTo(bx + 3, by - 3); c.lineTo(bx - 3, by + 2); c.stroke(); }
    },
    /* Schlüsselbrett mit Ring und Schlüsseln */
    schluessel(c, x, y, w, h, H, r) {
      const bx = x + 4, by = y + 6, bw = w - 8, bh = 6; sh(c, bx + 1, by + 1, bw, bh, 0.4); c.fillStyle = "#5a3a22"; c.fillRect(bx, by, bw, bh); c.fillStyle = "rgba(255,220,170,.25)"; c.fillRect(bx, by, bw, 0.6);
      for (let k = 0; k < 4; k++) { const kx = bx + 3 + k * (bw - 6) / 3; peg(c, kx, by + 4); if (H.h3(k, x | 0, 1560) < 0.25) continue; const len = 8 + H.h3(k, y | 0, 1561) * 5; c.strokeStyle = "#8a7a50"; c.lineWidth = 0.9; c.beginPath(); c.arc(kx, by + 7.5, 1.8, 0, TAU); c.stroke(); c.fillStyle = "#8a7a50"; c.fillRect(kx - 0.5, by + 9, 1, len); c.fillRect(kx, by + 7 + len, 2.4, 1.2); c.fillRect(kx, by + 5 + len, 1.8, 1); }
      c.strokeStyle = IRON.m; c.lineWidth = 1; c.beginPath(); c.arc(bx + bw - 3, by + bh + 5, 3.4, 0, TAU); c.stroke();
    },
    /* Taubenschlag: Nistlöcher mit Stroh, ein paar Tauben, weiße Spuren */
    tauben(c, x, y, w, h, H, r) {
      const P = H.PAL, cols = 4, rows = 3, cw = (w - 4) / cols, ch = (h - 4) / rows;
      for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
        const nx = x + 3 + i * cw, ny = y + 3 + j * ch, nw = cw - 4, nh = ch - 4;
        c.fillStyle = P.stone; c.fillRect(nx - 1, ny + nh, nw + 2, 2); c.fillStyle = "#140e0a"; c.beginPath(); c.moveTo(nx, ny + nh); c.lineTo(nx, ny + nw / 2); c.arc(nx + nw / 2, ny + nw / 2, nw / 2, PI, 0); c.lineTo(nx + nw, ny + nh); c.fill();
        c.strokeStyle = "rgba(200,170,90,.5)"; c.lineWidth = 0.5; c.beginPath(); c.moveTo(nx + 1, ny + nh - 0.5); c.lineTo(nx + nw - 1, ny + nh - 1.2); c.stroke();
        const v = H.h3(i, j + (y | 0), 1570);
        if (v < 0.35) { const px = nx + nw / 2, py = ny + nh - 2.5; c.fillStyle = v < 0.15 ? "#c8c0b4" : "#8a847c"; c.beginPath(); c.ellipse(px, py, 3.4, 2.2, 0, 0, TAU); c.fill(); c.beginPath(); c.arc(px + 2.6, py - 2, 1.4, 0, TAU); c.fill(); c.fillStyle = "#c86a3a"; c.fillRect(px + 3.8, py - 2, 1, 0.6); c.fillStyle = "#1a1410"; c.fillRect(px + 2.8, py - 2.4, 0.5, 0.5); c.fillStyle = "rgba(160,120,140,.6)"; c.fillRect(px + 1.4, py - 1, 1.6, 1); }
        if (v > 0.6) { c.fillStyle = "rgba(236,230,220,.35)"; c.fillRect(nx + nw * H.h3(i, j, 1571), ny + nh + 2, 1, 2 + v * 4); }
      }
    },
    /* Seile: aufgeschossene Taurollen an Pflöcken, eine Talje */
    seile(c, x, y, w, h, H, r) {
      for (let k = 0; k < 2; k++) { const px = x + 10 + k * (w - 20), py = y + 6; peg(c, px, py); const R = 6 + H.h3(k, x | 0, 1580) * 3;
        c.strokeStyle = "#7a6038"; c.lineWidth = 1.6; for (let j = 0; j < 4; j++) { c.beginPath(); c.ellipse(px, py + R + 1 + j * 0.8, R - j * 0.7, R + 1, 0, 0, TAU); c.stroke(); }
        c.strokeStyle = "rgba(255,230,180,.25)"; c.lineWidth = 0.5; c.beginPath(); c.ellipse(px, py + R + 1, R, R + 1, 0, PI * 1.1, PI * 1.7); c.stroke(); c.strokeStyle = "#7a6038"; c.lineWidth = 1.4; c.beginPath(); c.moveTo(px + R * 0.2, py + 2 * R); c.quadraticCurveTo(px + 2, py + 2 * R + 8, px - 1, y + h - 2); c.stroke(); }
      const tx = x + w / 2, ty = y + 10; c.fillStyle = "#5a3a22"; c.beginPath(); c.ellipse(tx, ty + 6, 3.4, 5, 0, 0, TAU); c.fill(); c.fillStyle = IRON.m; c.beginPath(); c.arc(tx, ty + 6, 1.4, 0, TAU); c.fill(); c.strokeStyle = IRON.m; c.lineWidth = 0.8; c.beginPath(); c.arc(tx, ty, 1.8, 0, TAU); c.stroke(); c.strokeStyle = "#7a6038"; c.lineWidth = 0.9; c.beginPath(); c.moveTo(tx - 3, ty + 7); c.lineTo(tx - 3, y + h - 6); c.moveTo(tx + 3, ty + 7); c.lineTo(tx + 3, y + h - 12); c.stroke();
    },
    /* Stallwand: Hufeisen auf Nägeln, Zaumzeug, Striegel */
    hufeisen(c, x, y, w, h, H, r) {
      for (let k = 0; k < 3; k++) { const hx = x + 9 + k * 12, hy = y + 8 + (k % 2) * 2; c.strokeStyle = IRON.m; c.lineWidth = 2; c.beginPath(); c.arc(hx, hy + 2, 3.6, PI * 0.1, PI * 0.9, true); c.stroke(); c.strokeStyle = IRON.hi; c.lineWidth = 0.5; c.beginPath(); c.arc(hx, hy + 2, 4.4, PI * 1.15, PI * 1.5); c.stroke(); c.fillStyle = IRON.lo; c.fillRect(hx - 0.5, hy - 2.5, 1, 1); }
      const bx = x + w - 10, by = y + 4; peg(c, bx, by); c.strokeStyle = "#5a3018"; c.lineWidth = 1; c.beginPath(); c.moveTo(bx, by + 1); c.quadraticCurveTo(bx - 6, by + 10, bx - 2, by + 20); c.moveTo(bx, by + 1); c.quadraticCurveTo(bx + 5, by + 12, bx + 1, by + 22); c.stroke(); c.strokeStyle = IRON.hi; c.lineWidth = 0.8; c.beginPath(); c.arc(bx - 0.5, by + 21, 2, 0, TAU); c.stroke();
      c.fillStyle = "#6a4a2a"; c.fillRect(x + 6, y + h - 9, 10, 3); c.fillStyle = "#3a2618"; for (let k = 0; k < 6; k++) c.fillRect(x + 6.5 + k * 1.6, y + h - 6, 0.7, 2);
    },
    /* Zielscheibe aus Stroh mit Pfeilen */
    zielscheibe(c, x, y, w, h, H, r) {
      const cx = x + w / 2, cy = y + h / 2, R = Math.min(w, h) / 2 - 2;
      sh(c, cx - R + 1.5, cy - R + 1.5, R * 2, R * 2, 0); c.fillStyle = "rgba(0,0,0,.35)"; c.beginPath(); c.arc(cx + 1.5, cy + 1.5, R, 0, TAU); c.fill();
      const ring = ["#b8984a", "#e8dcc0", "#9a2a22", "#e8dcc0", "#9a2a22"]; for (let k = 0; k < 5; k++) { c.fillStyle = ring[k]; c.beginPath(); c.arc(cx, cy, R * (1 - k * 0.19), 0, TAU); c.fill(); }
      c.strokeStyle = "rgba(90,60,20,.35)"; c.lineWidth = 0.5; c.beginPath(); for (let k = 0; k < 16; k++) { const a = k / 16 * TAU; c.moveTo(cx + Math.cos(a) * R * 0.85, cy + Math.sin(a) * R * 0.85); c.lineTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R); } c.stroke();
      for (let k = 0; k < 3; k++) { const a = H.h3(k, x | 0, 1590) * TAU, d = H.h3(k, y | 0, 1591) * R * 0.7, ax = cx + Math.cos(a) * d, ay = cy + Math.sin(a) * d; c.strokeStyle = "#5a3a22"; c.lineWidth = 0.8; c.beginPath(); c.moveTo(ax, ay); c.lineTo(ax + 5, ay - 4); c.stroke(); c.fillStyle = k % 2 ? "#e8dcc0" : "#9a2a22"; c.beginPath(); c.moveTo(ax + 4, ay - 3); c.lineTo(ax + 7, ay - 6.5); c.lineTo(ax + 5.4, ay - 2.4); c.fill(); }
    },
    /* Kugelpyramide neben dem Geschütz, dazu ein Ladestock */
    kugeln(c, x, y, w, h, H, r) {
      const bot = y + h, R = 4.6; c.strokeStyle = "#5a3a22"; c.lineWidth = 1.2; c.beginPath(); c.moveTo(x + w - 5, bot); c.lineTo(x + w - 9, y + 1); c.stroke(); c.fillStyle = "#3a2a1e"; c.beginPath(); c.ellipse(x + w - 9, y + 1.5, 2, 2.6, -0.2, 0, TAU); c.fill();
      for (let row = 0; row < 4; row++) for (let k = 0; k < 4 - row; k++) { const bx = x + 6 + R + k * R * 2.05 + row * R, by = bot - R - row * R * 1.75; c.fillStyle = "rgba(0,0,0,.35)"; c.beginPath(); c.arc(bx + 0.8, by + 0.8, R, 0, TAU); c.fill(); c.fillStyle = "#2a2624"; c.beginPath(); c.arc(bx, by, R, 0, TAU); c.fill(); c.fillStyle = "rgba(220,210,200,.3)"; c.beginPath(); c.arc(bx - 1.4, by - 1.6, 1.4, 0, TAU); c.fill(); }
    },
    /* Erzhaufen mit Glanz von Kupfer und Gold, Spitzhacke angelehnt */
    erz(c, x, y, w, h, H, r) {
      const bot = y + h; c.strokeStyle = "#5a3a22"; c.lineWidth = 1.3; c.beginPath(); c.moveTo(x + w - 6, bot); c.lineTo(x + w - 12, y + 6); c.stroke(); c.strokeStyle = IRON.m; c.lineWidth = 1.6; c.beginPath(); c.moveTo(x + w - 19, y + 9); c.quadraticCurveTo(x + w - 12, y + 3, x + w - 4, y + 6); c.stroke();
      for (let k = 0; k < 14; k++) { const t = k / 14, bx = x + 5 + H.h3(k, x | 0, 1600) * (w - 16), s = 2.5 + H.h3(k, 1, 1601) * 3.5, by = bot - s * 0.6 - (1 - Math.abs((bx - x - w * 0.4) / (w * 0.5))) * 10 * (1 - t * 0.3);
        c.fillStyle = ["#3a302a", "#4a3a30", "#2e2822"][k % 3]; c.beginPath(); c.moveTo(bx - s, by + s * 0.6); c.lineTo(bx - s * 0.6, by - s * 0.6); c.lineTo(bx + s * 0.5, by - s * 0.7); c.lineTo(bx + s, by + s * 0.6); c.fill();
        if (H.h3(k, 2, 1602) < 0.45) { c.fillStyle = H.h3(k, 3, 1603) < 0.5 ? "#c87a3a" : "#e0c060"; c.fillRect(bx - 0.6, by - 0.4, 1.2, 1); } }
    },
    /* Runenstein: aufrechte Stele mit eingemeißelten, violett glimmenden Runen */
    runenstein(c, x, y, w, h, H, r) {
      const bot = y + h, cx = x + w / 2, sw = w - 16, st = H.lit(H.B.wall, 0.15);
      c.fillStyle = "rgba(0,0,0,.4)"; c.beginPath(); c.moveTo(cx - sw / 2 + 2, bot); c.lineTo(cx - sw / 2 + 2, y + 10); c.quadraticCurveTo(cx + 2, y + 2, cx + sw / 2 + 2, y + 10); c.lineTo(cx + sw / 2 + 2, bot); c.fill();
      c.fillStyle = st; c.beginPath(); c.moveTo(cx - sw / 2, bot); c.lineTo(cx - sw / 2 + 1, y + 9); c.quadraticCurveTo(cx, y + 1, cx + sw / 2 - 1, y + 9); c.lineTo(cx + sw / 2, bot); c.fill();
      c.fillStyle = H.lit(st, 0.2); c.fillRect(cx - sw / 2 + 1, y + 9, 1.4, h - 9); c.fillStyle = "rgba(0,0,0,.25)"; c.fillRect(cx + sw / 2 - 2.4, y + 9, 1.4, h - 9);
      c.save(); c.globalCompositeOperation = "lighter"; c.strokeStyle = "rgba(200,140,255,.75)"; c.lineWidth = 0.9; c.beginPath();
      for (let k = 0; k < 5; k++) { const ry = y + 14 + k * 9, rx = cx - 3, v = H.h3(k * 13 + 3, ((x + r * 99) | 0) + k * 7, 1610 + k); c.moveTo(rx + 3, ry - 3); c.lineTo(rx + 3, ry + 4); if (v < 0.33) { c.moveTo(rx + 3, ry - 1); c.lineTo(rx + 6, ry - 3); c.moveTo(rx + 3, ry + 1); c.lineTo(rx + 6, ry - 1); } else if (v < 0.66) { c.moveTo(rx, ry - 2); c.lineTo(rx + 6, ry + 2); } else { c.moveTo(rx + 3, ry); c.lineTo(rx, ry - 3); c.moveTo(rx + 3, ry); c.lineTo(rx + 6, ry + 3); } }
      c.stroke(); c.restore(); glow(c, cx, y + h * 0.45, 18, "#c890ff", 0.18);
      c.fillStyle = "rgba(90,120,50,.4)"; for (let k = 0; k < 8; k++) c.fillRect(cx - sw / 2 + H.h3(k, 1, 1611) * sw, bot - 2 - H.h3(k, 2, 1612) * 8, 2, 1.2);
    },
    /* Korallengarten: Fächer- und Geweihkorallen in Rosa, Koralle und Ocker, Muscheln */
    korallen(c, x, y, w, h, H, r) {
      const bot = y + h, cols = ["#e08a8a", "#e0a060", "#c86a7a", "#d8b070"];
      const branch = (bx, by, len, a, d, col) => { if (d <= 0 || len < 1.5) return; const ex = bx + Math.cos(a) * len, ey = by + Math.sin(a) * len; c.strokeStyle = col; c.lineWidth = d * 0.6; c.beginPath(); c.moveTo(bx, by); c.lineTo(ex, ey); c.stroke(); branch(ex, ey, len * 0.72, a - 0.45, d - 1, col); branch(ex, ey, len * 0.72, a + 0.4, d - 1, col); };
      for (let k = 0; k < 3; k++) branch(x + 10 + k * (w - 20) / 2, bot - 2, 8 + H.h3(k, x | 0, 1620) * 4, -PI / 2 + (H.h3(k, 1, 1621) - 0.5) * 0.5, 4, cols[k % cols.length]);
      const fx = x + w * 0.5, fy = y + h * 0.42; c.fillStyle = H2rgba("#c86a7a", 0.55); c.beginPath(); c.moveTo(fx, fy + 12); c.quadraticCurveTo(fx - 14, fy - 2, fx - 6, fy - 12); c.quadraticCurveTo(fx, fy - 15, fx + 6, fy - 12); c.quadraticCurveTo(fx + 14, fy - 2, fx, fy + 12); c.fill(); c.strokeStyle = "rgba(90,30,40,.4)"; c.lineWidth = 0.4; c.beginPath(); for (let k = 0; k < 7; k++) { c.moveTo(fx, fy + 12); c.lineTo(fx - 9 + k * 3, fy - 10 + Math.abs(k - 3)); } c.stroke();
      for (let k = 0; k < 3; k++) { const sx = x + 6 + H.h3(k, 3, 1622) * (w - 12); c.fillStyle = "#e8d8c0"; c.beginPath(); c.arc(sx, bot - 1.5, 2.2, PI, 0); c.fill(); c.strokeStyle = "rgba(120,90,60,.5)"; c.lineWidth = 0.3; c.beginPath(); for (let j = -1; j <= 1; j++) { c.moveTo(sx, bot - 1.5); c.lineTo(sx + j * 1.6, bot - 3.4); } c.stroke(); }
    },
    /* Giftranken am Spalier: dunkle Ranken, Blätter, violette und gelbe Giftblüten, Beeren */
    ranken(c, x, y, w, h, H, r) {
      c.strokeStyle = "#4a3420"; c.lineWidth = 1; c.beginPath(); for (let k = 0; k <= 4; k++) { const xx = x + 4 + k * (w - 8) / 4; c.moveTo(xx, y + 2); c.lineTo(xx, y + h - 2); } for (let k = 0; k <= 5; k++) { const yy = y + 4 + k * (h - 8) / 5; c.moveTo(x + 3, yy); c.lineTo(x + w - 3, yy); } c.stroke();
      for (let v = 0; v < 3; v++) { let px = x + 8 + v * (w - 16) / 2, py = y + h; c.strokeStyle = "#2e4a20"; c.lineWidth = 1.2; c.beginPath(); c.moveTo(px, py);
        for (let k = 0; k < 7; k++) { const nx = px + (H.h3(v, k, 1630) - 0.5) * 12, ny = py - h / 7; c.quadraticCurveTo(px + (k % 2 ? 6 : -6), py - h / 14, nx, ny); px = nx; py = ny; } c.stroke();
        px = x + 8 + v * (w - 16) / 2; py = y + h;
        for (let k = 0; k < 9; k++) { const lx = px + (H.h3(v, k, 1631) - 0.5) * 14, ly = y + h - k * h / 9 - 3; c.fillStyle = k % 2 ? "#3e5a28" : "#4e6a2e"; c.beginPath(); c.ellipse(lx, ly, 2.6, 1.3, H.h3(v, k, 1632) * 3, 0, TAU); c.fill();
          const fv = H.h3(v, k, 1633); if (fv < 0.28) { c.fillStyle = fv < 0.14 ? "#8a3aa0" : "#d8c040"; for (let j = 0; j < 5; j++) { const a = j / 5 * TAU; c.beginPath(); c.arc(lx + Math.cos(a) * 1.6, ly - 2 + Math.sin(a) * 1.6, 1, 0, TAU); c.fill(); } c.fillStyle = "#2a1a10"; c.fillRect(lx - 0.4, ly - 2.4, 0.8, 0.8); } else if (fv > 0.86) { c.fillStyle = "#6a1a3a"; for (let j = 0; j < 3; j++) { c.beginPath(); c.arc(lx + j * 1.6 - 1.6, ly + 2 + (j % 2), 0.9, 0, TAU); c.fill(); } } }
      }
    },
    /* Tellerbord: aufgestellte Teller in der Leiste, darunter Becher an Haken */
    teller(c, x, y, w, h, H, r) {
      const sy = y + 16; c.fillStyle = "#4a3020"; c.fillRect(x + 2, sy, w - 4, 2.4); c.fillRect(x + 2, sy - 6, w - 4, 1.2); c.fillStyle = "rgba(255,220,170,.22)"; c.fillRect(x + 2, sy, w - 4, 0.5);
      for (let k = 0; k < 6; k++) { const px = x + 8 + k * (w - 16) / 5, R = 4.6 + H.h3(k, x | 0, 1640) * 1.4, col = ["#c8b898", "#a86a3a", "#8a8478", "#d8c8a8"][(H.h3(k, 1, 1641) * 4) | 0]; c.fillStyle = "rgba(0,0,0,.3)"; c.beginPath(); c.ellipse(px + 1, sy - R + 1, R * 0.9, R, 0, 0, TAU); c.fill(); c.fillStyle = col; c.beginPath(); c.ellipse(px, sy - R, R * 0.9, R, 0, 0, TAU); c.fill(); c.strokeStyle = "rgba(0,0,0,.2)"; c.lineWidth = 0.5; c.beginPath(); c.ellipse(px, sy - R, R * 0.6, R * 0.7, 0, 0, TAU); c.stroke(); if (k % 2 === 0) { c.strokeStyle = "rgba(138,42,34,.6)"; c.beginPath(); c.ellipse(px, sy - R, R * 0.78, R * 0.88, 0, 0, TAU); c.stroke(); } }
      c.fillStyle = "#4a3020"; c.fillRect(x + 2, sy - 6, w - 4, 1.2);
      for (let k = 0; k < 4; k++) { const hx = x + 10 + k * (w - 20) / 3; c.strokeStyle = IRON.m; c.lineWidth = 0.5; c.beginPath(); c.moveTo(hx, sy + 2.4); c.lineTo(hx, sy + 4.4); c.stroke(); c.fillStyle = k % 2 ? "#9a5a30" : "#8a8478"; c.fillRect(hx - 2, sy + 4.4, 4, 5); c.fillStyle = "rgba(255,230,190,.25)"; c.fillRect(hx - 2, sy + 4.4, 1, 5); }
    },
    /* Zollstube: Balkenwaage, Gewichte, Kassenbücher, Münzstapel */
    waage(c, x, y, w, h, H, r) {
      const sy = y + h - 6; c.fillStyle = "#4a3020"; c.fillRect(x + 2, sy, w - 4, 2.4); c.fillStyle = "rgba(255,220,170,.22)"; c.fillRect(x + 2, sy, w - 4, 0.5);
      const cx = x + 14, brass = "#b08a3a"; c.fillStyle = brass; c.fillRect(cx - 0.7, sy - 16, 1.4, 16); c.fillRect(cx - 3, sy - 1.4, 6, 1.4); c.fillRect(cx - 9, sy - 16, 18, 1); c.strokeStyle = brass; c.lineWidth = 0.4; c.beginPath(); for (const d of [-1, 1]) { c.moveTo(cx + d * 9, sy - 15); c.lineTo(cx + d * 9 - 2.5, sy - 8); c.moveTo(cx + d * 9, sy - 15); c.lineTo(cx + d * 9 + 2.5, sy - 8); } c.stroke(); c.fillStyle = brass; for (const d of [-1, 1]) { c.beginPath(); c.ellipse(cx + d * 9, sy - 7.6, 3.2, 1, 0, 0, PI); c.fill(); }
      for (let k = 0; k < 3; k++) { c.fillStyle = BOOK[(k * 3 + 1) % BOOK.length]; c.fillRect(x + 28 + k * 3.2, sy - 10 - k, 3, 10 + k); c.fillStyle = "rgba(255,225,160,.3)"; c.fillRect(x + 28 + k * 3.2, sy - 8 - k, 3, 0.5); }
      for (let k = 0; k < 2; k++) for (let j = 0; j < 3 + k; j++) { c.fillStyle = j % 2 ? "#c8a040" : "#e0c060"; c.fillRect(x + w - 10 + k * 4, sy - 1 - j * 1.2, 3.4, 1.1); }
    },
    /* Spiegel mit vergoldetem Rahmen, warmem Spiegelschein, manchmal gesprungen */
    spiegel(c, x, y, w, h, H, r) {
      const cx = x + w / 2, cy = y + h / 2, rx = w / 2 - 6, ry = h / 2 - 7;
      c.fillStyle = "rgba(0,0,0,.45)"; c.beginPath(); c.ellipse(cx + 1.5, cy + 1.5, rx + 3, ry + 3, 0, 0, TAU); c.fill();
      c.fillStyle = "#7a5a1e"; c.beginPath(); c.ellipse(cx, cy, rx + 3, ry + 3, 0, 0, TAU); c.fill(); c.strokeStyle = "#d8b050"; c.lineWidth = 0.8; c.beginPath(); c.ellipse(cx, cy, rx + 2.2, ry + 2.2, 0, PI * 1.0, PI * 1.7); c.stroke();
      for (let k = 0; k < 10; k++) { const a = k / 10 * TAU; c.fillStyle = "#c89a40"; c.beginPath(); c.arc(cx + Math.cos(a) * (rx + 2.6), cy + Math.sin(a) * (ry + 2.6), 1, 0, TAU); c.fill(); }
      c.fillStyle = "#c89a40"; c.beginPath(); c.moveTo(cx - 5, y + 2); c.quadraticCurveTo(cx, y - 3, cx + 5, y + 2); c.lineTo(cx, y + 5); c.fill();
      const g = c.createLinearGradient(cx - rx, cy - ry, cx + rx, cy + ry); g.addColorStop(0, "#8a8070"); g.addColorStop(0.45, "#3a342c"); g.addColorStop(1, "#5a5044"); c.fillStyle = g; c.beginPath(); c.ellipse(cx, cy, rx, ry, 0, 0, TAU); c.fill();
      c.save(); c.clip(); c.fillStyle = "rgba(255,245,225,.22)"; c.beginPath(); c.moveTo(cx - rx, cy - ry * 0.2); c.lineTo(cx - rx * 0.2, cy - ry); c.lineTo(cx + rx * 0.1, cy - ry); c.lineTo(cx - rx, cy + ry * 0.2); c.fill(); c.fillStyle = "rgba(255,245,225,.12)"; c.fillRect(cx + rx * 0.1, cy - ry, 2, ry * 2);
      if (r > 0.6) { c.strokeStyle = "rgba(255,250,240,.4)"; c.lineWidth = 0.5; c.beginPath(); c.moveTo(cx + 1, cy - 2); c.lineTo(cx - 4, cy - ry); c.moveTo(cx + 1, cy - 2); c.lineTo(cx + rx, cy + 3); c.moveTo(cx + 1, cy - 2); c.lineTo(cx - 2, cy + ry); c.moveTo(cx + 1, cy - 2); c.lineTo(cx - rx, cy + 4); c.stroke(); }
      c.restore();
    },
    /* Riesenpilze an der Grottenwand: Stiele, gefleckte Hüte, leuchtende Lamellen */
    riesenpilze(c, x, y, w, h, H, r) {
      const bot = y + h;
      for (let k = 0; k < 3; k++) { const px = x + 10 + k * (w - 20) / 2 + (H.h3(k, x | 0, 1650) - 0.5) * 6, ph = h * (0.45 + H.h3(k, 1, 1651) * 0.45) - 6, top = bot - ph, R = 6 + H.h3(k, 2, 1652) * 6, glowC = k % 2 ? "#e890b8" : "#a8e890";
        c.fillStyle = "#c8bca8"; c.beginPath(); c.moveTo(px - 2.4, bot); c.quadraticCurveTo(px - 1, (top + bot) / 2, px - 1.6, top); c.lineTo(px + 1.6, top); c.quadraticCurveTo(px + 1, (top + bot) / 2, px + 2.4, bot); c.fill(); c.fillStyle = "rgba(0,0,0,.2)"; c.fillRect(px + 0.8, top, 1, ph);
        c.fillStyle = k % 2 ? "#8a3a5a" : "#7a4a2a"; c.beginPath(); c.ellipse(px, top, R, R * 0.55, 0, PI, 0); c.fill();
        c.save(); c.globalCompositeOperation = "lighter"; c.fillStyle = H2rgba(glowC, 0.55); c.fillRect(px - R * 0.9, top - 0.5, R * 1.8, 1.4); c.restore(); glow(c, px, top + 2, R * 1.6, glowC, 0.22);
        c.fillStyle = "rgba(240,230,210,.7)"; for (let j = 0; j < 4; j++) { c.beginPath(); c.arc(px - R * 0.6 + j * R * 0.4, top - R * 0.25 - (j % 2) * R * 0.15, 0.8 + (j % 2) * 0.5, 0, TAU); c.fill(); } }
    },
    /* Kristallader: Amethystprismen aus dem Fels, innerer Schein */
    kristall(c, x, y, w, h, H, r) {
      const cx = x + w / 2, cy = y + h * 0.6; c.fillStyle = "rgba(0,0,0,.45)"; c.beginPath(); c.ellipse(cx, cy + 4, w / 2 - 6, 8, 0, 0, TAU); c.fill();
      glow(c, cx, cy - 4, w * 0.5, "#c890ff", 0.25);
      for (let k = 0; k < 7; k++) { const a = -PI / 2 + (k - 3) * 0.32 + (H.h3(k, x | 0, 1660) - 0.5) * 0.2, len = 10 + H.h3(k, 1, 1661) * 14 - Math.abs(k - 3) * 2, wd = 2.4 + H.h3(k, 2, 1662) * 1.6, bx = cx + (k - 3) * 2.6, by = cy + 2;
        c.save(); c.translate(bx, by); c.rotate(a + PI / 2); const col = k % 3 === 0 ? "#b070e0" : k % 3 === 1 ? "#d0a0f0" : "#8a4ab8";
        c.fillStyle = col; c.beginPath(); c.moveTo(-wd, 0); c.lineTo(-wd, -len); c.lineTo(0, -len - wd * 1.4); c.lineTo(wd, -len); c.lineTo(wd, 0); c.fill(); c.fillStyle = "rgba(255,240,255,.35)"; c.fillRect(-wd, -len, wd * 0.6, len); c.fillStyle = "rgba(40,10,60,.3)"; c.fillRect(wd * 0.4, -len, wd * 0.6, len); c.restore(); }
      c.fillStyle = "#fff"; c.fillRect(cx - 3, cy - 14, 1, 1); c.fillRect(cx + 5, cy - 8, 0.8, 0.8);
    }
  });
  /* ---------- Gangstücke (Runde 8): Fresko, blinder Bogengang, Wendeltreppe, Wimpelkette ---------- */
  Object.assign(SIZE, { fresko: [6, 2], bogengang: [6, 3], wendeltreppe: [3, 5, 1], wimpel: [5, 2] });
  Object.assign(PIECE, {
    /* verblasstes Gangfresko: Jagdszene mit Reitern, Hirsch und Bäumen auf altem Putz, Bordüre, abgeplatzte Stellen */
    fresko(c, x, y, w, h, H, r) {
      const fx = x + 3, fy = y + 4, fw = w - 6, fh = h - 8, pl = H.mixH(H.B.wall, "#a8906a", 0.55);
      sh(c, fx + 1, fy + 1, fw, fh, 0.35); c.fillStyle = pl; c.fillRect(fx, fy, fw, fh);
      const g = c.createLinearGradient(0, fy, 0, fy + fh); g.addColorStop(0, "rgba(200,170,120,.25)"); g.addColorStop(1, "rgba(60,40,20,.25)"); c.fillStyle = g; c.fillRect(fx, fy, fw, fh);
      c.fillStyle = "#6a2a1e"; c.fillRect(fx, fy, fw, 2); c.fillRect(fx, fy + fh - 2, fw, 2); c.fillStyle = "#c8a050"; for (let xx = fx + 2; xx < fx + fw - 2; xx += 5) { c.fillRect(xx, fy + 0.6, 2, 0.8); c.fillRect(xx + 2.5, fy + fh - 1.4, 2, 0.8); }
      c.save(); c.beginPath(); c.rect(fx, fy + 2, fw, fh - 4); c.clip();
      c.fillStyle = "rgba(70,96,50,.55)"; c.fillRect(fx, fy + fh - 7, fw, 5);
      for (let k = 0; k < 4; k++) { const tx = fx + 6 + k * fw / 4 + H.h3(k, x | 0, 1700) * 6; c.fillStyle = "rgba(60,40,24,.6)"; c.fillRect(tx - 0.6, fy + fh - 14, 1.2, 9); c.fillStyle = "rgba(60,96,44,.6)"; c.beginPath(); c.arc(tx, fy + fh - 15, 4, 0, TAU); c.fill(); }
      const dir = r < 0.5 ? 1 : -1;
      for (let k = 0; k < 2; k++) { const hx = fx + fw * (0.25 + k * 0.22), hy = fy + fh - 7; c.fillStyle = k ? "rgba(90,60,40,.75)" : "rgba(220,210,190,.7)"; c.beginPath(); c.ellipse(hx, hy - 5, 5, 2.6, 0, 0, TAU); c.fill(); c.fillRect(hx - 4, hy - 4, 1, 4); c.fillRect(hx + 3, hy - 4, 1, 4); c.beginPath(); c.moveTo(hx + dir * 4, hy - 6); c.lineTo(hx + dir * 7, hy - 9); c.lineTo(hx + dir * 7.6, hy - 7.6); c.fill();
        c.fillStyle = k ? "rgba(140,40,30,.8)" : "rgba(60,80,40,.8)"; c.fillRect(hx - 1, hy - 12, 2.4, 5); c.fillStyle = "rgba(220,190,150,.8)"; c.beginPath(); c.arc(hx + 0.2, hy - 13, 1.3, 0, TAU); c.fill(); c.strokeStyle = "rgba(60,40,24,.7)"; c.lineWidth = 0.5; c.beginPath(); c.moveTo(hx, hy - 11); c.lineTo(hx + dir * 6, hy - 14); c.stroke(); }
      const sx = fx + fw * 0.78, sy = fy + fh - 7; c.fillStyle = "rgba(150,90,50,.75)"; c.beginPath(); c.ellipse(sx, sy - 4, 4, 2, 0, 0, TAU); c.fill(); c.fillRect(sx - 3, sy - 3, 0.8, 3); c.fillRect(sx + 2, sy - 3, 0.8, 3); c.strokeStyle = "rgba(120,80,40,.8)"; c.lineWidth = 0.5; c.beginPath(); c.moveTo(sx + dir * 3, sy - 6); c.lineTo(sx + dir * 4, sy - 10); c.lineTo(sx + dir * 2, sy - 12); c.moveTo(sx + dir * 4, sy - 10); c.lineTo(sx + dir * 6, sy - 12); c.stroke();
      for (let k = 0; k < 4; k++) { const bx = fx + H.h3(k, y | 0, 1701) * fw, by = fy + H.h3(k, 3, 1702) * fh, R = 2 + H.h3(k, 4, 1703) * 4; c.fillStyle = H.lit(H.B.wall, -0.05); c.beginPath(); c.ellipse(bx, by, R, R * 0.7, k, 0, TAU); c.fill(); }
      for (let k = 0; k < 30; k++) { c.fillStyle = k % 2 ? "rgba(0,0,0,.08)" : "rgba(255,240,220,.06)"; c.fillRect(fx + H.h3(k, 9, 1704) * fw, fy + H.h3(k, 8, 1705) * fh, 1.5, 0.8); }
      c.restore();
    },
    /* blinder Bogengang: drei Rundbögen auf Säulchen mit Kapitellen, Nischen im Schatten */
    bogengang(c, x, y, w, h, H, r) {
      const P = H.PAL, n = 3, aw = (w - 6) / n, top = y + 4, bot = y + h - 2;
      c.fillStyle = P.stone; c.fillRect(x + 1, bot - 2, w - 2, 3); c.fillStyle = P.stoneHi; c.fillRect(x + 1, bot - 2, w - 2, 0.7);
      for (let k = 0; k < n; k++) {
        const ax = x + 3 + k * aw, cx = ax + aw / 2, ar = aw / 2 - 2.5;
        c.fillStyle = "rgba(0,0,0,.42)"; c.beginPath(); c.moveTo(ax + 2.5, bot - 2); c.lineTo(ax + 2.5, top + ar + 2); c.arc(cx, top + ar + 2, ar, Math.PI, 0); c.lineTo(ax + aw - 2.5, bot - 2); c.fill();
        const g = c.createLinearGradient(0, top, 0, top + 16); g.addColorStop(0, "rgba(0,0,0,.35)"); g.addColorStop(1, "rgba(0,0,0,0)"); c.fillStyle = g; c.fillRect(ax + 2.5, top, aw - 5, 16);
        c.strokeStyle = P.stone; c.lineWidth = 2.2; c.beginPath(); c.arc(cx, top + ar + 2, ar + 1, Math.PI, 0); c.stroke(); c.strokeStyle = "rgba(0,0,0,.35)"; c.lineWidth = 0.5; for (let j = 1; j < 6; j++) { const a = Math.PI + j / 6 * Math.PI; c.beginPath(); c.moveTo(cx + Math.cos(a) * ar, top + ar + 2 + Math.sin(a) * ar); c.lineTo(cx + Math.cos(a) * (ar + 2.2), top + ar + 2 + Math.sin(a) * (ar + 2.2)); c.stroke(); }
        c.strokeStyle = P.stoneHi; c.lineWidth = 0.5; c.beginPath(); c.arc(cx, top + ar + 2, ar + 2.1, Math.PI * 1.05, Math.PI * 1.45); c.stroke();
      }
      for (let k = 0; k <= n; k++) { const px = x + 3 + k * aw; c.fillStyle = "rgba(0,0,0,.3)"; c.fillRect(px - 0.5, top + 8, 3, bot - top - 10); c.fillStyle = P.stone; c.fillRect(px - 1.5, top + 8, 3, bot - top - 10); c.fillStyle = P.stoneHi; c.fillRect(px - 1.5, top + 8, 0.7, bot - top - 10); c.fillStyle = H.lit(H.B.wall, 0.12); c.fillRect(px - 2.6, top + 6.5, 5.2, 2); c.fillRect(px - 2.6, bot - 3.5, 5.2, 1.6); }
      if (r < 0.4) { const k = (r * 7) | 0 % n, cx = x + 3 + (k % n) * aw + aw / 2; c.fillStyle = "#e8dcc0"; c.fillRect(cx - 0.7, bot - 7, 1.4, 4.5); c.fillStyle = "rgba(255,210,120,.85)"; c.beginPath(); c.ellipse(cx, bot - 8, 0.6, 1.2, 0, 0, TAU); c.fill(); }
    },
    /* Wendeltreppe hinter einem Mauerschlitz: gerundeter Turmschaft, Stufen schrauben sich hinauf, Licht von oben */
    wendeltreppe(c, x, y, w, h, H, r) {
      const P = H.PAL, cx = x + w / 2, rw = w / 2 - 3, top = y + 2, bot = y + h;
      c.fillStyle = "rgba(0,0,0,.45)"; c.fillRect(cx - rw - 1, top, rw * 2 + 2, bot - top);
      const g = c.createLinearGradient(cx - rw, 0, cx + rw, 0); g.addColorStop(0, "rgba(0,0,0,.5)"); g.addColorStop(0.5, "rgba(60,44,30,.25)"); g.addColorStop(1, "rgba(0,0,0,.55)"); c.fillStyle = g; c.fillRect(cx - rw, top, rw * 2, bot - top);
      c.fillStyle = H.lit(H.B.wall, -0.15); c.fillRect(cx - 1.6, top, 3.2, bot - top);
      const n = Math.floor((bot - top) / 5);
      for (let k = 0; k < n; k++) { const ph = k * 0.9 + r * 6, yy = bot - 4 - k * 5, s1 = Math.sin(ph), wx = s1 * rw, front = Math.cos(ph) > 0; if (!front) continue;
        c.fillStyle = P.stone; c.beginPath(); c.moveTo(cx, yy); c.lineTo(cx + wx, yy - 1.5); c.lineTo(cx + wx, yy + 1.4); c.lineTo(cx, yy + 2.4); c.fill(); c.fillStyle = P.stoneHi; c.beginPath(); c.moveTo(cx, yy); c.lineTo(cx + wx, yy - 1.5); c.lineTo(cx + wx, yy - 0.8); c.lineTo(cx, yy + 0.6); c.fill(); }
      c.globalCompositeOperation = "lighter"; const lg = c.createLinearGradient(0, top, 0, top + 30); lg.addColorStop(0, "rgba(255,220,160,.16)"); lg.addColorStop(1, "rgba(255,220,160,0)"); c.fillStyle = lg; c.fillRect(cx - rw, top, rw * 2, 30); c.globalCompositeOperation = "source-over";
      for (const sd of [-1, 1]) { const ex = cx + sd * (rw + 1); c.fillStyle = P.stone; c.fillRect(ex - 1.5, top, 3, bot - top); c.fillStyle = sd < 0 ? P.stoneHi : "rgba(0,0,0,.3)"; c.fillRect(ex - 1.5, top, 0.7, bot - top); for (let yy = top + 3; yy < bot; yy += 7) { c.fillStyle = "rgba(0,0,0,.3)"; c.fillRect(ex - 1.5, yy, 3, 0.6); } }
      c.fillStyle = P.stone; c.fillRect(cx - rw - 2.5, top - 1, rw * 2 + 5, 3); c.fillStyle = P.stoneHi; c.fillRect(cx - rw - 2.5, top - 1, rw * 2 + 5, 0.7);
    },
    /* Wimpelkette quer über die Wand, dreieckige Fähnchen in Rot, Ocker, Grün und Creme */
    wimpel(c, x, y, w, h, H, r) {
      const y0 = y + 4, sag = 8 + r * 6, n = 9, cols = ["#8a2020", "#c8902a", "#3a5a2a", "#e0d4b8", "#6a2a5a"];
      const yAt = u => y0 + Math.sin(u * Math.PI) * sag;
      c.strokeStyle = "#3a2a1c"; c.lineWidth = 0.6; c.beginPath(); for (let k = 0; k <= 20; k++) { const u = k / 20, xx = x + 2 + u * (w - 4); k ? c.lineTo(xx, yAt(u)) : c.moveTo(xx, yAt(u)); } c.stroke();
      for (let k = 0; k < n; k++) { const u0 = (k + 0.15) / n, u1 = (k + 0.85) / n, x0 = x + 2 + u0 * (w - 4), x1 = x + 2 + u1 * (w - 4), y0b = yAt(u0), y1b = yAt(u1);
        c.fillStyle = "rgba(0,0,0,.3)"; c.beginPath(); c.moveTo(x0 + 0.8, y0b + 0.8); c.lineTo(x1 + 0.8, y1b + 0.8); c.lineTo((x0 + x1) / 2 + 0.8, (y0b + y1b) / 2 + 8.8); c.fill();
        c.fillStyle = cols[(k + ((r * 10) | 0)) % cols.length]; c.beginPath(); c.moveTo(x0, y0b); c.lineTo(x1, y1b); c.lineTo((x0 + x1) / 2, (y0b + y1b) / 2 + 8); c.fill(); c.fillStyle = "rgba(255,240,220,.15)"; c.beginPath(); c.moveTo(x0, y0b); c.lineTo((x0 + x1) / 2, (y0b + y1b) / 2); c.lineTo((x0 + x1) / 2, (y0b + y1b) / 2 + 8); c.fill(); }
      for (const ex of [x + 2, x + w - 2]) { c.fillStyle = "#2a2420"; c.fillRect(ex - 1, y0 - 1.5, 2, 3); }
    }
  });
  /* ---------- Fels: Patina, Kanten, Einschlüsse, Laufflächen ---------- */
  const DEBRIS = { castle: "leaf", ramparts: "leaf", storm: "leaf", camp: "leaf", cellar: "straw", harbour: "shell", dungeon: "bone", chasm: "bone", lake: "shroom", forge: "ash", embercity: "ash", spires: "ash", halls: "petal", belltower: "feather" };
  /* ---------- Gesteinsarten je Gebiet (auf den oberen drei Felsreihen, darunter verschluckt die Tiefe alles) ---------- */
  const ROCKART = { castle: "granit", ramparts: "granit", camp: "granit", storm: "schiefer", spires: "brand", cellar: "sandstein", halls: "marmor", passage: "granit", dungeon: "basalt", harbour: "kalk", belltower: "tuff", chasm: "violettschiefer", lake: "sinter", embercity: "obsidian", forge: "erz" };
  function rockArt(H, x, y, px, py, d) {
    const { c, h3, B } = H, art = ROCKART[B.bg]; if (!art) return; const a = d === 1 ? 1 : d === 2 ? 0.7 : 0.45;
    switch (art) {
      case "granit": for (let k = 0; k < 7; k++) { const v = h3(x, y, 1000 + k); c.fillStyle = v < 0.5 ? "rgba(255,245,235," + (0.08 * a) + ")" : "rgba(0,0,0," + (0.18 * a) + ")"; c.fillRect(px + h3(x, y, 1010 + k) * 15, py + h3(x, y, 1020 + k) * 15, 1, 1); } break;
      case "schiefer": c.fillStyle = "rgba(60,80,50," + (0.08 * a) + ")"; c.fillRect(px, py, T0, T0); c.fillStyle = "rgba(0,0,0," + (0.18 * a) + ")"; for (let k = 0; k < 4; k++) c.fillRect(px, py + 2 + k * 4 + h3(x, y, 1030 + k) * 2 - 1, T0, 0.6); break;
      case "brand": c.fillStyle = "rgba(90,30,10," + (0.12 * a) + ")"; c.fillRect(px, py, T0, T0); if (h3(x, y, 1040) < 0.3) { c.fillStyle = "rgba(0,0,0," + (0.25 * a) + ")"; c.fillRect(px + 3, py + h3(x, y, 1041) * 12, 9, 2); } break;
      case "sandstein": { c.fillStyle = "rgba(150,100,50," + (0.1 * a) + ")"; c.fillRect(px, py, T0, T0); c.strokeStyle = "rgba(60,36,16," + (0.22 * a) + ")"; c.lineWidth = 0.6; c.beginPath(); for (let k = 0; k < 3; k++) { const yy = py + 3 + k * 5; c.moveTo(px, yy + Math.sin(px * 0.07 + k) * 1.2); for (let xx = 4; xx <= T0; xx += 4) c.lineTo(px + xx, yy + Math.sin((px + xx) * 0.07 + k) * 1.2); } c.stroke(); break; }
      case "marmor": { c.fillStyle = "rgba(255,240,230," + (0.06 * a) + ")"; c.fillRect(px, py, T0, T0); c.strokeStyle = "rgba(255,245,235," + (0.16 * a) + ")"; c.lineWidth = 0.5; c.beginPath(); const o = ((x * 7 + y * 13) % 16); c.moveTo(px, py + o); c.quadraticCurveTo(px + 8, py + o - 4 + h3(x, y, 1050) * 8, px + T0, py + o - 6); c.stroke(); break; }
      case "basalt": c.fillStyle = "rgba(10,14,8," + (0.12 * a) + ")"; c.fillRect(px, py, T0, T0); c.fillStyle = "rgba(0,0,0," + (0.25 * a) + ")"; c.fillRect(px + (x % 2 ? 5 : 11), py, 0.7, T0); if (h3(x, y, 1060) < 0.3) { c.fillStyle = "rgba(70,100,40," + (0.3 * a) + ")"; c.fillRect(px + h3(x, y, 1061) * 12, py + h3(x, y, 1062) * 12, 3, 2); } break;
      case "kalk": c.fillStyle = "rgba(230,224,206," + (0.07 * a) + ")"; c.fillRect(px, py, T0, T0); for (let k = 0; k < 4; k++) { c.fillStyle = "rgba(0,0,0," + (0.25 * a) + ")"; c.beginPath(); c.arc(px + h3(x, y, 1070 + k) * 15, py + h3(x, y, 1080 + k) * 15, 0.5 + h3(x, y, 1090 + k) * 0.6, 0, TAU); c.fill(); } break;
      case "tuff": c.fillStyle = "rgba(140,90,60," + (0.09 * a) + ")"; c.fillRect(px, py, T0, T0); for (let k = 0; k < 5; k++) { c.fillStyle = "rgba(0,0,0," + (0.2 * a) + ")"; c.fillRect(px + h3(x, y, 1100 + k) * 15, py + h3(x, y, 1110 + k) * 15, 1.4, 1); } break;
      case "violettschiefer": c.fillStyle = "rgba(80,40,110," + (0.09 * a) + ")"; c.fillRect(px, py, T0, T0); c.fillStyle = "rgba(0,0,0," + (0.2 * a) + ")"; c.fillRect(px, py + 5 + h3(x, y, 1120) * 6, T0, 0.6); if (h3(x, y, 1121) < 0.15) { c.fillStyle = "rgba(240,220,255," + (0.5 * a) + ")"; c.fillRect(px + h3(x, y, 1122) * 14, py + h3(x, y, 1123) * 14, 0.8, 0.8); } break;
      case "sinter": { c.fillStyle = "rgba(60,110,80," + (0.08 * a) + ")"; c.fillRect(px, py, T0, T0); c.strokeStyle = "rgba(200,240,210," + (0.1 * a) + ")"; c.lineWidth = 0.6; c.beginPath(); const xx = px + h3(x, y, 1130) * 14; c.moveTo(xx, py); c.quadraticCurveTo(xx + 3, py + 8, xx - 1, py + T0); c.stroke(); break; }
      case "obsidian": c.fillStyle = "rgba(10,4,6," + (0.15 * a) + ")"; c.fillRect(px, py, T0, T0); if (h3(x, y, 1140) < 0.35) { c.strokeStyle = "rgba(255,220,200," + (0.18 * a) + ")"; c.lineWidth = 0.5; c.beginPath(); const xx = px + h3(x, y, 1141) * 10, yy = py + h3(x, y, 1142) * 10; c.moveTo(xx, yy + 4); c.lineTo(xx + 4, yy); c.stroke(); } break;
      case "erz": c.fillStyle = "rgba(60,40,30," + (0.08 * a) + ")"; c.fillRect(px, py, T0, T0); if (h3(x, y, 1150) < 0.3) { c.fillStyle = "rgba(140,60,24," + (0.35 * a) + ")"; c.beginPath(); c.arc(px + h3(x, y, 1151) * 14, py + h3(x, y, 1152) * 14, 1.4, 0, TAU); c.fill(); } if (h3(x, y, 1153) < 0.2) { c.fillStyle = "rgba(220,210,200," + (0.5 * a) + ")"; c.fillRect(px + h3(x, y, 1154) * 14, py + h3(x, y, 1155) * 14, 0.8, 0.8); } break;
    }
  }
  const T0 = 16;
  function rock(H) {
    const { c, x0, y0, x1, y1, T, B, st, lv, PR, lit, mixH, rgba, h3, sol } = H, tl = B.tile, bg = B.bg, W = lv.W;
    patina(H, true);
    const black = (x, y) => lv.get(x, y - 1) === 9;
    for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) {
      if (!sol(x, y) || black(x, y) || (y === 0 && lv.out)) continue;
      const d = PR.dep[y * W + x], px = x * T, py = y * T, r = h3(x, y, 611), r2 = h3(x, y, 612), r3 = h3(x, y, 613);
      const aU = !sol(x, y - 1), aD = !sol(x, y + 1), aL = !sol(x - 1, y), aR = !sol(x + 1, y);
      if (d <= 3) rockArt(H, x, y, px, py, d);
      if (d === 1) {
        /* gerundete Außenecken: dunkle Fase und helle Kante statt harter Ecke */
        const chip = (sx, sy, dx, dy) => { c.fillStyle = "rgba(0,0,0,.55)"; c.beginPath(); c.moveTo(sx, sy); c.lineTo(sx + dx * 3.2, sy); c.lineTo(sx, sy + dy * 3.2); c.fill(); c.strokeStyle = rgba(lit(tl.light, 0.1), 0.55); c.lineWidth = 0.6; c.beginPath(); c.moveTo(sx + dx * 3.6, sy + dy * 0.2); c.lineTo(sx + dx * 0.2, sy + dy * 3.6); c.stroke(); };
        if (aU && aL && !sol(x - 1, y - 1)) chip(px, py, 1, 1);
        if (aU && aR && !sol(x + 1, y - 1)) chip(px + T, py, -1, 1);
        if (aD && aL && !sol(x - 1, y + 1)) { c.fillStyle = "rgba(0,0,0,.55)"; c.beginPath(); c.moveTo(px, py + T); c.lineTo(px + 3, py + T); c.lineTo(px, py + T - 3); c.fill(); }
        if (aD && aR && !sol(x + 1, y + 1)) { c.fillStyle = "rgba(0,0,0,.55)"; c.beginPath(); c.moveTo(px + T, py + T); c.lineTo(px + T - 3, py + T); c.lineTo(px + T, py + T - 3); c.fill(); }
        /* Abbruchkerben an Seitenflächen */
        if ((aL || aR) && r < 0.18) { const sx = aL ? px : px + T, s = aL ? 1 : -1, yy = py + 3 + r2 * 9; c.fillStyle = "rgba(0,0,0,.5)"; c.beginPath(); c.moveTo(sx, yy); c.lineTo(sx + s * (2 + r3 * 2), yy + 1.5); c.lineTo(sx, yy + 3.5); c.fill(); c.fillStyle = rgba(tl.light, 0.3); c.fillRect(aL ? sx : sx - 1, yy - 0.5, 1, 0.5); }
        /* Risse von der Kante ins Gestein */
        if (r > 0.9 && (aU || aL || aR)) { c.strokeStyle = "rgba(0,0,0,.5)"; c.lineWidth = 0.7; c.beginPath(); let xx = aL ? px : aR ? px + T : px + 3 + r2 * 10, yy = aU ? py + 3 : py + 2 + r3 * 8; c.moveTo(xx, yy); for (let k = 0; k < 4; k++) { xx += aL ? 2 + h3(x, y, 620 + k) * 2 : aR ? -2 - h3(x, y, 620 + k) * 2 : (h3(x, y, 620 + k) - 0.5) * 4; yy += aU ? 2 + h3(x, y, 630 + k) * 2 : (h3(x, y, 630 + k) - 0.5) * 4; c.lineTo(xx, yy); } c.stroke(); }
        /* Moos und Wurzeln an Seitenflächen draußen bzw. im Verlies */
        if ((st.moss || tl.top === "moss") && (aL || aR) && r3 < 0.3) { const sx = aL ? px : px + T, s = aL ? 1 : -1; for (let k = 0; k < 8; k++) { c.fillStyle = k % 3 ? "rgba(70,96,42,.6)" : "rgba(104,134,60,.55)"; c.fillRect(sx + s * h3(x, y, 640 + k) * 2.4 - (s < 0 ? 1.4 : 0), py + h3(x, y, 650 + k) * T, 1.4, 1.2); } }
        if ((bg === "lake" || bg === "chasm") && aU && r3 > 0.86) { /* Kristallgrüppchen auf der Kante */ const cx = px + 4 + r2 * 8, col = bg === "lake" ? ["#9ae0b8", "#d8fff0"] : ["#b88ae0", "#f0e0ff"]; for (let k = 0; k < 3; k++) { const hh = 3 + h3(x, y, 660 + k) * 4, xx = cx + (k - 1) * 2; c.fillStyle = col[0]; c.beginPath(); c.moveTo(xx - 1.1, py + 0.5); c.lineTo(xx + (k - 1) * 0.8, py - hh); c.lineTo(xx + 1.1, py + 0.5); c.fill(); c.fillStyle = col[1]; c.fillRect(xx + (k - 1) * 0.8 - 0.2, py - hh + 0.5, 0.5, hh * 0.5); } }
      } else if (d === 2 || d === 3) {
        /* Einschlüsse im Gestein (die Tiefenkarte dunkelt sie nach innen ab) */
        if (r < 0.025) {
          if (st.rock === "cave") { c.strokeStyle = "rgba(0,0,0,.4)"; c.lineWidth = 0.7; c.beginPath(); c.ellipse(px + 8, py + 8, 4, 2.5, r2, 0, TAU); c.stroke(); c.strokeStyle = rgba(tl.light, 0.25); c.beginPath(); c.ellipse(px + 8, py + 7.5, 2.4, 1.3, r2, 0, TAU); c.stroke(); }
          else { /* Wappen- bzw. Schlussstein */ c.fillStyle = mixH(tl.base, tl.light, 0.2); c.fillRect(px + 2, py + 1, 12, 7); c.fillStyle = rgba(tl.light, 0.5); c.fillRect(px + 2, py + 1, 12, 0.8); c.fillStyle = "rgba(0,0,0,.4)"; c.fillRect(px + 2, py + 7.2, 12, 0.8); H.runeGlyph(c, px + 8, py + 4.5, 2, r2); c.strokeStyle = "rgba(0,0,0,.45)"; c.lineWidth = 0.6; c.stroke(); }
        }
        if (r > 0.97 && (bg === "dungeon" || bg === "chasm" || bg === "lake")) { /* Knochen im Gestein */ c.fillStyle = "rgba(220,210,190,.35)"; c.save(); c.translate(px + 8, py + 8); c.rotate(r2 * 3); c.fillRect(-4, -0.6, 8, 1.2); c.beginPath(); c.arc(-4, -0.6, 1, 0, TAU); c.arc(-4, 0.8, 1, 0, TAU); c.arc(4, -0.6, 1, 0, TAU); c.arc(4, 0.8, 1, 0, TAU); c.fill(); c.restore(); }
        if (r > 0.95 && r < 0.97 && (bg === "embercity" || bg === "forge")) { /* Glutader im Gestein */ c.save(); c.globalCompositeOperation = "lighter"; c.strokeStyle = "rgba(255,110,40,.3)"; c.lineWidth = 0.9; c.beginPath(); let xx = px, yy = py + r2 * 16; c.moveTo(xx, yy); for (let k = 0; k < 4; k++) { xx += 4; yy += (h3(x, y, 670 + k) - 0.5) * 6; c.lineTo(xx, yy); } c.stroke(); c.restore(); }
      }
    }
  }
  /* Kleinkram auf Laufflächen und Schutt in Innenecken (nach den Oberflächen gezeichnet) */
  function floorBits(H) {
    const { c, x0, y0, x1, y1, T, B, lv, h3, sol, PAL, PR } = H, kind = DEBRIS[B.bg] || "pebble";
    for (let y = y0; y <= y1; y++) for (let x = x0; x < x1; x++) {
      if (!H.inLv(x, y) || !sol(x, y) || sol(x, y - 1) || lv.get(x, y - 1) === 9 || (y === 0 && lv.out) || (G.sky && lv.get(x, y - 1) === 5)) continue;
      const px = x * T, py = y * T, r = h3(x, y, 711), r2 = h3(x, y, 712), r3 = h3(x, y, 713);
      /* Schutthaufen, wo der Boden an eine Wand stößt */
      const wl = sol(x - 1, y - 1), wr = sol(x + 1, y - 1);
      if ((wl || wr) && r < 0.75) {
        const s = wl ? 1 : -1, ex = wl ? px : px + T;
        for (let k = 0; k < 6; k++) { const dd = h3(x, y, 720 + k) * 9, sz = 1 + (1 - dd / 9) * 1.8 * h3(x, y, 730 + k) + 0.5, sx = ex + s * dd; c.fillStyle = "rgba(0,0,0,.35)"; c.fillRect(sx - sz, py - 0.4, sz * 2, 0.6); c.fillStyle = PAL.rockCols[(h3(x, y, 740 + k) * 5) | 0]; c.beginPath(); c.moveTo(sx - sz, py); c.lineTo(sx - sz * 0.3, py - sz * 1.1); c.lineTo(sx + sz * 0.8, py - sz * 0.8); c.lineTo(sx + sz, py); c.fill(); c.fillStyle = PAL.rHi; c.fillRect(sx - sz * 0.3, py - sz * 1.1, sz * 0.8, 0.5); }
      }
      if (r2 > 0.3) continue;
      const bx = px + 2 + r * 12;
      switch (kind) {
        case "leaf": { const cols = ["#8a5a28", "#a8702c", "#6a4a24", "#b04a28"]; for (let k = 0; k < 2; k++) { c.fillStyle = cols[(h3(x, y, 750 + k) * 4) | 0]; c.beginPath(); c.ellipse(bx + k * 4, py - 0.6, 1.6, 0.7, h3(x, y, 760 + k) - 0.5, 0, TAU); c.fill(); } break; }
        case "straw": { c.strokeStyle = "rgba(214,180,100,.7)"; c.lineWidth = 0.4; c.beginPath(); for (let k = 0; k < 4; k++) { const a = (h3(x, y, 770 + k) - 0.5) * 0.6; c.moveTo(bx + k * 1.5, py - 0.3); c.lineTo(bx + k * 1.5 + Math.cos(a) * 4, py - 0.3 + Math.sin(a) * 1.5); } c.stroke(); break; }
        case "shell": { c.fillStyle = "#d8ccb4"; c.beginPath(); c.arc(bx, py - 0.2, 1.4, Math.PI, 0); c.fill(); c.strokeStyle = "rgba(120,100,80,.6)"; c.lineWidth = 0.3; c.beginPath(); c.moveTo(bx, py); c.lineTo(bx - 0.8, py - 1.1); c.moveTo(bx, py); c.lineTo(bx + 0.8, py - 1.1); c.stroke(); break; }
        case "bone": { if (r3 < 0.5) { c.fillStyle = "#cfc4ac"; c.fillRect(bx, py - 1, 4, 0.9); c.beginPath(); c.arc(bx, py - 1, 0.7, 0, TAU); c.arc(bx + 4, py - 1, 0.7, 0, TAU); c.fill(); } else { c.fillStyle = "rgba(200,190,170,.6)"; c.fillRect(bx, py - 0.8, 1, 0.8); c.fillRect(bx + 3, py - 0.6, 1.4, 0.6); } break; }
        case "shroom": { c.fillStyle = "#c8d8b8"; c.fillRect(bx, py - 2.2, 0.6, 2.2); c.fillStyle = r3 < 0.5 ? "#c87a8a" : "#e0c070"; c.beginPath(); c.arc(bx + 0.3, py - 2.2, 1.3, Math.PI, 0); c.fill(); break; }
        case "ash": { c.fillStyle = "rgba(60,54,50,.7)"; for (let k = 0; k < 4; k++) c.fillRect(bx + h3(x, y, 780 + k) * 8, py - 0.6, 1 + h3(x, y, 790 + k) * 1.5, 0.6); if (r3 < 0.3) { c.fillStyle = "rgba(255,120,40,.8)"; c.fillRect(bx + 3, py - 0.6, 0.6, 0.6); } break; }
        case "petal": { c.fillStyle = "rgba(160,30,40,.8)"; c.beginPath(); c.ellipse(bx, py - 0.5, 1.2, 0.6, 0.4, 0, TAU); c.fill(); if (r3 < 0.4) { c.fillStyle = "rgba(232,200,120,.8)"; c.fillRect(bx + 4, py - 0.7, 1.6, 0.7); } break; }
        case "feather": { c.strokeStyle = "rgba(230,226,220,.75)"; c.lineWidth = 0.4; c.beginPath(); c.moveTo(bx, py - 0.4); c.quadraticCurveTo(bx + 2, py - 1.6, bx + 4, py - 1.2); c.stroke(); c.fillStyle = "rgba(220,216,210,.5)"; c.beginPath(); c.ellipse(bx + 2.4, py - 1.2, 1.8, 0.6, -0.2, 0, TAU); c.fill(); break; }
        default: { c.fillStyle = PAL.rockCols[(r3 * 5) | 0]; c.beginPath(); c.ellipse(bx, py - 0.6, 1.3, 0.8, 0, 0, TAU); c.fill(); }
      }
    }
  }
  /* Holzarten je Gebiet: Treibholz am Hafen, verkohlt in Glut und Schmiede, morsch im Verlies, poliert in den Hallen,
     dunkle Eiche im Glockenturm, glitschig am See */
  function woodArt(H, x, y, px, py) {
    const { c, h3, B } = H, r = h3(x, y, 1200);
    switch (B.bg) {
      case "harbour": c.fillStyle = "rgba(180,180,170,.16)"; c.fillRect(px, py, T0, 4.5); c.fillStyle = "rgba(240,236,224,.25)"; if (r < 0.4) c.fillRect(px + r * 30 % 12, py + 3.6, 4, 0.6); break;
      case "embercity": case "forge": c.fillStyle = "rgba(10,6,4,.4)"; c.fillRect(px, py, T0, 4.5); c.save(); c.globalCompositeOperation = "lighter"; c.fillStyle = "rgba(255,90,30,.35)"; c.fillRect(px, py + 4, T0, 0.7); if (r < 0.35) { c.fillStyle = "rgba(255,150,60,.6)"; c.fillRect(px + r * 40 % 14, py + 1.5, 1.2, 0.8); } c.restore(); break;
      case "dungeon": c.fillStyle = "rgba(20,30,10,.22)"; c.fillRect(px, py, T0, 4.5); if (r < 0.3) { c.fillStyle = "rgba(0,0,0,.35)"; c.beginPath(); c.ellipse(px + 4 + r * 20, py + 2.5, 2.4, 1, 0, 0, TAU); c.fill(); } break;
      case "halls": c.fillStyle = "rgba(255,230,190,.08)"; c.fillRect(px, py + 0.4, T0, 1.2); c.fillStyle = "#c89a40"; c.fillRect(px + 2, py + 2, 0.9, 0.9); c.fillRect(px + 13, py + 2, 0.9, 0.9); break;
      case "belltower": c.fillStyle = "rgba(30,16,8,.2)"; c.fillRect(px, py, T0, 4.5); c.fillStyle = "rgba(0,0,0,.25)"; c.fillRect(px, py + 1.2 + r, T0, 0.4); c.fillRect(px, py + 3 - r, T0, 0.4); break;
      case "lake": c.fillStyle = "rgba(60,120,70,.3)"; c.fillRect(px, py + 3.8, T0, 1); c.fillStyle = "rgba(200,255,220,.15)"; c.fillRect(px, py + 0.2, T0, 0.5); break;
    }
  }
  /* ---------- Stege: Bohlen verschieden alt, Risse, Eisenbänder, Moos ---------- */
  function fix(H) {
    const { c, x0, y0, x1, y1, T, B, lv, h3, lit, rgba } = H; if (B.webPlat) return;
    const pl = B.plat, mossy = B.bg === "castle" || B.bg === "dungeon" || B.bg === "storm" || B.bg === "ramparts" || B.bg === "lake";
    for (let y = y0; y <= y1; y++) for (let x = x0; x < x1; x++) {
      const v = lv.get(x, y), px = x * T, py = y * T, r = h3(x, y, 811), r2 = h3(x, y, 812);
      if (v === 2) {
        c.fillStyle = r < 0.5 ? "rgba(0,0,0," + (r * 0.2).toFixed(3) + ")" : "rgba(255,236,210," + ((r - 0.5) * 0.08).toFixed(3) + ")"; c.fillRect(px, py, T, 4.5);
        /* abgetretene Mitte */
        c.fillStyle = "rgba(255,240,220,.05)"; c.fillRect(px + 2, py + 0.9, T - 4, 1);
        if (r2 < 0.13) { /* Riss im Holz mit Splitter */ c.strokeStyle = rgba(lit(pl, -0.6), 0.8); c.lineWidth = 0.5; c.beginPath(); c.moveTo(px + 2 + r * 6, py + 1.6); c.lineTo(px + 8 + r * 4, py + 2.2); c.lineTo(px + 12, py + 1.8); c.stroke(); c.fillStyle = lit(pl, 0.15); c.fillRect(px + 12, py + 1.4, 1.5, 0.5); }
        else if (r2 < 0.22) { /* Eisenband mit Nieten */ c.fillStyle = "#2a2624"; c.fillRect(px + 5, py - 0.2, 2.2, 5.2); c.fillStyle = "#5a5450"; c.fillRect(px + 5, py - 0.2, 2.2, 0.5); c.fillStyle = "#7a706a"; c.fillRect(px + 5.7, py + 1, 0.8, 0.8); c.fillRect(px + 5.7, py + 3.2, 0.8, 0.8); c.fillStyle = "rgba(120,52,20,.4)"; c.fillRect(px + 5, py + 4, 2.2, 1.6); }
        else if (r2 > 0.9) { /* Astloch */ c.fillStyle = rgba(lit(pl, -0.5), 0.8); c.beginPath(); c.ellipse(px + 4 + r * 8, py + 2.4, 1.2, 0.8, 0, 0, TAU); c.fill(); }
        woodArt(H, x, y, px, py);
        if (mossy && h3(x, y, 813) < 0.25) { for (let k = 0; k < 6; k++) { c.fillStyle = k % 2 ? "rgba(70,100,44,.7)" : "rgba(110,140,60,.6)"; c.fillRect(px + h3(x, y, 820 + k) * 15, py - 0.6 + h3(x, y, 830 + k) * 0.6, 1.2 + h3(x, y, 840 + k), 0.9); } }
      } else if (v === 8 && r < 0.4) {
        /* Steinstufe: Abnutzung und abgeschlagene Kante */
        c.fillStyle = "rgba(255,240,220,.06)"; c.fillRect(px + 3, py + 0.4, T - 6, 0.8); c.fillStyle = "rgba(0,0,0,.4)"; c.beginPath(); c.moveTo(px + 6 + r * 10, py); c.lineTo(px + 8 + r * 10, py); c.lineTo(px + 7 + r * 10, py + 1.6); c.fill();
      }
    }
  }
  /* ---------- Übergänge (Runde 9): Torbögen in den Durchgängen zwischen Räumen, Schwellen am Boden ----------
     Wo zwei Räume seitlich verbunden sind und die Öffnung eine Decke hat, wird auf der Rückwand ein gemauerter
     Bogen mit Pfeilern und Schlussstein gemalt, dahinter ein Hauch Tiefe; am Boden liegt eine abgetretene Schwelle.
     Der Lichtschein aus dem Nachbarraum kommt aus dem Modul „Übergangslicht“ (Z.durchgaenge). */
  let dwLv = null, dwList = null;
  function doorways(lv) {
    if (dwLv === lv && dwList) return dwList; dwLv = lv; dwList = [];
    if (!lv || !lv.cells || lv.hub || lv.arena) return dwList;
    const CW = Z.CW, CH = Z.CH, g = (x, y) => lv.get(x, y), air = v => v === 0 || v === 4 || v === 10 || v === 12, solid = v => v === 1 || v === 7, stand = v => v === 1 || v === 7 || v === 2 || v === 8;
    for (const k in lv.cells) {
      const c = lv.cells[k], nk = (c.x + 1) + "," + c.y; if (!lv.cells[nk]) continue;
      const bx = (c.x + 1) * CW, ry = c.y * CH;
      let y = ry;
      while (y < ry + CH) {
        if (!(air(g(bx - 1, y)) && air(g(bx, y)))) { y++; continue; }
        let y1 = y; while (y1 + 1 < ry + CH && air(g(bx - 1, y1 + 1)) && air(g(bx, y1 + 1))) y1++;
        const h = y1 - y + 1;
        if (h >= 2 && h <= 7 && solid(g(bx, y - 1)) && solid(g(bx - 1, y - 1)) && (stand(g(bx, y1 + 1)) || stand(g(bx - 1, y1 + 1))))
          dwList.push({ x: bx, top: y, bot: y1, a: lv.roomFns ? lv.roomFns[k] || null : null, b: lv.roomFns ? lv.roomFns[nk] || null : null });
        y = y1 + 1;
      }
    }
    return dwList;
  }
  Z.durchgaenge = () => doorways(Z.level);
  function arches(H) {
    const { c, x0, x1, y0, y1, T, PAL, lv, h3 } = H;
    for (const d of doorways(lv)) {
      if (d.x < x0 - 3 || d.x > x1 + 3 || d.bot < y0 - 2 || d.top > y1 + 2) continue;
      if (!H.isWall(d.x, d.top) && !H.isWall(d.x - 1, d.top)) continue;
      const px = d.x * T, top = d.top * T, bot = (d.bot + 1) * T, hw = 22, ar = Math.min(hw, (bot - top) * 0.45), cy = top + ar + 3;
      H.setCR(px - hw - 8, top - 6, hw * 2 + 16, bot - top + 8);
      /* Tiefe des Durchgangs */
      const g = c.createLinearGradient(0, top, 0, bot); g.addColorStop(0, "rgba(0,0,0,.42)"); g.addColorStop(1, "rgba(0,0,0,.18)"); c.fillStyle = g;
      c.beginPath(); c.moveTo(px - hw, bot); c.lineTo(px - hw, cy); c.arc(px, cy, hw, Math.PI, 0); c.lineTo(px + hw, bot); c.fill();
      /* Pfeiler mit Sockel und Kämpfer */
      for (const sd of [-1, 1]) {
        const ex = px + sd * (hw + 3);
        c.fillStyle = "rgba(0,0,0,.3)"; c.fillRect(ex - 3 + sd * 1.5, cy, 6, bot - cy);
        c.fillStyle = PAL.stone; c.fillRect(ex - 3, cy, 6, bot - cy); c.fillStyle = sd < 0 ? PAL.stoneHi : "rgba(0,0,0,.22)"; c.fillRect(ex - 3, cy, 1, bot - cy);
        c.fillStyle = "rgba(0,0,0,.28)"; for (let yy = cy + 7; yy < bot - 3; yy += 8) c.fillRect(ex - 3, yy, 6, 0.7);
        c.fillStyle = H.lit(H.B.wall, 0.14); c.fillRect(ex - 4.5, cy - 2, 9, 2.4); c.fillRect(ex - 4.5, bot - 3, 9, 3);
      }
      /* Bogensteine mit Schlussstein */
      const n = 9;
      for (let k = 0; k < n; k++) {
        const a0 = Math.PI + k / n * Math.PI, a1 = Math.PI + (k + 1) / n * Math.PI, ri = hw, ro = hw + 6 + (k === (n >> 1) ? 2.5 : 0);
        c.fillStyle = k === (n >> 1) ? H.lit(PAL.stone, 0.08) : (k % 2 ? PAL.stone : H.lit(PAL.stone, -0.05));
        c.beginPath(); c.arc(px, cy, ro, a0 + 0.02, a1 - 0.02); c.arc(px, cy, ri, a1 - 0.02, a0 + 0.02, true); c.closePath(); c.fill();
      }
      c.strokeStyle = PAL.stoneHi; c.lineWidth = 0.7; c.beginPath(); c.arc(px, cy, hw + 6, Math.PI * 1.04, Math.PI * 1.45); c.stroke();
      c.strokeStyle = "rgba(0,0,0,.35)"; c.lineWidth = 0.6; c.beginPath(); c.arc(px, cy, hw, Math.PI, 0); c.stroke();
      /* Zeichen über dem Durchgang, wenn der Nachbarraum eine Funktion hat */
      const fn = d.b || d.a; if (fn && h3(d.x, d.top, 1800) < 0.5) { c.fillStyle = "rgba(255,230,190,.14)"; c.beginPath(); c.arc(px, cy - hw - 3, 1.6, 0, TAU); c.fill(); }
    }
  }
  /* Schwelle am Boden des Durchgangs: abgetretene Steinplatte mit glatter Mitte */
  function thresholds(H) {
    const { c, x0, x1, y0, y1, T, PAL, lv } = H;
    for (const d of doorways(lv)) {
      const fy = d.bot + 1; if (d.x < x0 - 3 || d.x > x1 + 3 || fy < y0 - 1 || fy > y1 + 1) continue;
      const px = d.x * T, py = fy * T; H.setCR(px - 30, py - 4, 60, 10);
      c.fillStyle = "rgba(0,0,0,.35)"; c.fillRect(px - 24, py + 2.4, 48, 1.2);
      c.fillStyle = H.lit(PAL.stone, 0.05); c.fillRect(px - 24, py - 1, 48, 3.6);
      c.fillStyle = PAL.stoneHi; c.fillRect(px - 24, py - 1, 48, 0.7);
      const g = c.createLinearGradient(px - 24, 0, px + 24, 0); g.addColorStop(0, "rgba(255,240,220,0)"); g.addColorStop(0.5, "rgba(255,240,220,.16)"); g.addColorStop(1, "rgba(255,240,220,0)"); c.fillStyle = g; c.fillRect(px - 24, py - 0.6, 48, 1.6);
      c.fillStyle = "rgba(0,0,0,.25)"; for (const ex of [px - 12, px + 9]) c.fillRect(ex, py - 1, 0.6, 3.6);
    }
  }
  /* ---------- Runde 10: senkrechte Verbindungen, Torhäuser an Gebietsausgängen, Nischen in Sackgassen ----------
     Alles wird je Karte aus den aktuellen Level-Daten abgeleitet (nichts über den Kartenaufbau angenommen, was sich
     ändern könnte; fehlende Felder werden übersprungen) und im Chunk-Cache gemalt. */
  const isAir = v => v === 0 || v === 4 || v === 10 || v === 12, isSolid = v => v === 1 || v === 7, isStand = v => v === 1 || v === 7 || v === 2 || v === 8;
  let shLv = null, shList = null;
  function shaftsOf(lv) {
    if (shLv === lv && shList) return shList; shLv = lv; shList = [];
    if (!lv || !lv.cells || lv.hub || lv.arena) return shList;
    const g = (x, y) => lv.get(x, y), CW = Z.CW, CH = Z.CH;
    for (const k in lv.cells) {
      const c = lv.cells[k]; if (!lv.cells[c.x + "," + (c.y + 1)]) continue;
      const by = (c.y + 1) * CH, rx = c.x * CW;
      for (let x = rx; x < rx + CW; x++) {
        if (!(isAir(g(x, by - 1)) && isAir(g(x, by)))) continue;
        let x1 = x; while (x1 + 1 < rx + CW && isAir(g(x1 + 1, by - 1)) && isAir(g(x1 + 1, by))) x1++;
        if (x1 - x + 1 <= 10) {
          /* Absatz: erste Reihe von unten nach oben, in der links und rechts der Öffnung fester Boden mit Luft darüber liegt */
          let ly = -1; for (let y = by; y >= by - 6; y--) if ((isStand(g(x - 1, y)) && isAir(g(x - 1, y - 1))) || (isStand(g(x1 + 1, y)) && isAir(g(x1 + 1, y - 1)))) { ly = y; break; }
          let lad = false; for (let xx = x; xx <= x1; xx++) if (g(xx, by) === 4 || g(xx, by - 1) === 4) lad = true;
          shList.push({ x0: x, x1, by, ly, lad, up: lv.roomFns ? lv.roomFns[k] || null : null, dn: lv.roomFns ? lv.roomFns[c.x + "," + (c.y + 1)] || null : null });
        }
        x = x1;
      }
    }
    return shList;
  }
  Z.schaechte = () => shaftsOf(Z.level);
  /* Balustrade an den Kanten einer Schachtöffnung: Pfosten, Docken, Handlauf auf dem Absatz */
  function balustrades(H) {
    const { c, x0, x1, y0, y1, T, PAL, lv } = H, g = (x, y) => lv.get(x, y);
    for (const s of shaftsOf(lv)) {
      if (s.ly < 0 || s.x1 < x0 - 4 || s.x0 > x1 + 4 || s.ly < y0 - 2 || s.ly > y1 + 2) continue;
      for (const [ex, dir] of [[s.x0 - 1, -1], [s.x1 + 1, 1]]) {
        if (!(isStand(g(ex, s.ly)) && isAir(g(ex, s.ly - 1)))) continue;
        let n = 1; while (n < 3 && isStand(g(ex + dir * n, s.ly)) && isAir(g(ex + dir * n, s.ly - 1))) n++;
        const xa = dir < 0 ? (ex - n + 1) * T : ex * T, w = n * T, py = s.ly * T, hh = 11; H.setCR(xa - 2, py - hh - 3, w + 4, hh + 4);
        c.fillStyle = "rgba(0,0,0,.3)"; c.fillRect(xa + 1, py - hh + 1, w, 2);
        c.fillStyle = PAL.stone; c.fillRect(xa, py - hh, w, 2.2); c.fillStyle = PAL.stoneHi; c.fillRect(xa, py - hh, w, 0.6);
        for (let k = 0; k <= n * 3; k++) { const bx = xa + 1 + k * (w - 2) / (n * 3); c.fillStyle = PAL.stone; c.beginPath(); c.ellipse(bx, py - hh / 2, 1.2, hh / 2 - 1.5, 0, 0, TAU); c.fill(); c.fillStyle = "rgba(0,0,0,.25)"; c.fillRect(bx + 0.4, py - hh + 2.5, 0.6, hh - 3); }
        c.fillStyle = H.lit(PAL.stone, 0.06); const pX = dir < 0 ? xa + w - 3 : xa; c.fillRect(pX, py - hh - 2.5, 3, hh + 2.5); c.fillStyle = PAL.stoneHi; c.fillRect(pX, py - hh - 2.5, 3, 0.7);
      }
    }
  }
  /* Leitern: abgegriffene Sprossenmitten, dunkle Griffspuren an den Holmen */
  function ladderWear(H) {
    const { c, x0, x1, y0, y1, T, lv, h3 } = H;
    for (let y = y0; y <= y1; y++) for (let x = x0; x < x1; x++) {
      if (lv.get(x, y) !== 4) continue; const px = x * T, py = y * T;
      c.fillStyle = "rgba(255,230,190,.16)"; for (let k = 3; k < T; k += 5) c.fillRect(px + 6, py + k, 4, 0.6);
      if (h3(x, y, 1900) < 0.5) { c.fillStyle = "rgba(0,0,0,.16)"; c.fillRect(px + 2.2, py + 4 + h3(x, y, 1901) * 6, 1, 3); c.fillRect(px + 11.2, py + 2 + h3(x, y, 1902) * 8, 1, 3); }
    }
  }
  /* Torhaus an Gebietsausgängen: Türme mit Zinnen, Bogensteine, hochgezogenes Fallgitter, Banner in der Farbe des
     Zielgebiets; dazu geht die Rückwand über einige Kacheln in dessen Gestein und Ton über */
  function targetOf(d) { const to = d.to, A = Z.ARENAS && Z.ARENAS[to]; return (Z.BIOMES && (Z.BIOMES[to] || (A && Z.BIOMES[A.base]))) || null; }
  function gatehouses(H) {
    const { c, x0, x1, y0, y1, T, PAL, lv, isWall } = H;
    for (const d of lv.doors || []) {
      if (d.kind !== "exit" || d.x < x0 - 10 || d.x > x1 + 10 || d.y < y0 - 8 || d.y > y1 + 4) continue;
      const TB = targetOf(d), px = d.x * T + 8, py = (d.y + 1) * T;
      if (!isWall(d.x, d.y - 1) && !isWall(d.x, d.y - 3)) continue;
      /* Übergang des Gesteins: weicher Hof in Wandfarbe und Grundton des Zielgebiets */
      if (TB && TB.wall) { H.setCR(px - 110, py - 110, 220, 120); const g = c.createRadialGradient(px, py - 30, 10, px, py - 30, 105); g.addColorStop(0, H.rgba(TB.wall, 0.55)); g.addColorStop(0.6, H.rgba(TB.wall, 0.25)); g.addColorStop(1, H.rgba(TB.wall, 0)); c.fillStyle = g; c.fillRect(px - 110, py - 140, 220, 150);
        if (TB.ambCol) { const g2 = c.createRadialGradient(px, py - 20, 0, px, py - 20, 70); g2.addColorStop(0, H.rgba(TB.ambCol, 0.25)); g2.addColorStop(1, H.rgba(TB.ambCol, 0)); c.fillStyle = g2; c.fillRect(px - 70, py - 90, 140, 90); } }
      H.setCR(px - 44, py - 92, 88, 94);
      const hw = 20, top = py - 62, st = PAL.stone;
      for (const sd of [-1, 1]) {
        const tx = px + sd * (hw + 9); c.fillStyle = "rgba(0,0,0,.35)"; c.fillRect(tx - 8 + sd * 2, top - 16, 16, py - top + 16);
        c.fillStyle = st; c.fillRect(tx - 8, top - 18, 16, py - top + 18); c.fillStyle = sd < 0 ? PAL.stoneHi : "rgba(0,0,0,.25)"; c.fillRect(tx - 8, top - 18, 1.2, py - top + 18);
        c.fillStyle = "rgba(0,0,0,.25)"; for (let yy = top - 12; yy < py; yy += 7) c.fillRect(tx - 8, yy, 16, 0.7);
        c.fillStyle = st; for (let k = 0; k < 3; k++) c.fillRect(tx - 8 + k * 6, top - 23, 4, 5); c.fillStyle = "#0e0a0a"; c.fillRect(tx - 1, top - 6, 2, 6);
        if (TB) { const bc = TB.ambCol || "#8a2020"; c.fillStyle = H.mixH(bc, "#7a1a1a", 0.35); c.beginPath(); c.moveTo(tx - 5, top); c.lineTo(tx + 5, top); c.lineTo(tx + 5, top + 26); c.lineTo(tx, top + 21); c.lineTo(tx - 5, top + 26); c.fill(); c.fillStyle = "rgba(255,220,160,.35)"; c.fillRect(tx - 5, top, 10, 1.2); c.fillStyle = "#b8923a"; c.beginPath(); c.arc(tx, top + 9, 2.2, 0, TAU); c.fill(); }
      }
      c.fillStyle = st; c.fillRect(px - hw - 2, top - 18, hw * 2 + 4, 6);
      const cy = top + 8;
      for (let k = 0; k < 9; k++) { const a0 = Math.PI + k / 9 * Math.PI, a1 = Math.PI + (k + 1) / 9 * Math.PI; c.fillStyle = k === 4 ? H.lit(st, 0.1) : k % 2 ? st : H.lit(st, -0.06); c.beginPath(); c.arc(px, cy, hw + 7, a0 + 0.02, a1 - 0.02); c.arc(px, cy, hw, a1 - 0.02, a0 + 0.02, true); c.closePath(); c.fill(); }
      c.strokeStyle = PAL.stoneHi; c.lineWidth = 0.7; c.beginPath(); c.arc(px, cy, hw + 7, Math.PI * 1.05, Math.PI * 1.45); c.stroke();
      /* hochgezogenes Fallgitter im Bogenscheitel */
      c.fillStyle = "#2a2422"; for (let k = -3; k <= 3; k++) { c.fillRect(px + k * 5 - 0.7, cy - hw + 2, 1.4, 10); c.beginPath(); c.moveTo(px + k * 5 - 1.4, cy - hw + 12); c.lineTo(px + k * 5, cy - hw + 15); c.lineTo(px + k * 5 + 1.4, cy - hw + 12); c.fill(); } c.fillRect(px - 17, cy - hw + 5, 34, 1.2);
      c.fillStyle = "rgba(0,0,0,.35)"; for (let k = -2; k <= 2; k++) c.fillRect(px + k * 8 - 1.5, top - 13, 3, 3);
    }
  }
  /* Nischen in Sackgassen: gemauerte Bogennische mit kleinem Schrein, Moos und einem Lichtstrahl von oben */
  let niLv = null, niList = null;
  function nichesOf(lv) {
    if (niLv === lv && niList) return niList; niLv = lv; niList = [];
    if (!lv || !lv.cells || lv.hub || lv.arena) return niList;
    const g = (x, y) => lv.get(x, y), CW = Z.CW, CH = Z.CH, D4 = [[1, 0, "R"], [-1, 0, "L"], [0, 1, "D"], [0, -1, "U"]];
    for (const k in lv.cells) {
      const c = lv.cells[k]; if (c === lv.startCell || (lv.warden && lv.warden.cell === c)) continue;
      let n = 0; for (const [dx, dy, s] of D4) { const v = c.need && c.need[s]; if (v && v !== "X" && lv.cells[(c.x + dx) + "," + (c.y + dy)]) n++; }
      if (n !== 1 && !c.dead) continue;
      let spot = null; for (const r of lv.rewards || []) if (r.cell === k) { spot = [r.x, r.y]; break; }
      if (!spot) { const rx = c.x * CW, ry = c.y * CH; let bd = 1e9; for (let y = ry + 1; y < ry + CH - 1; y++) for (let x = rx + 2; x < rx + CW - 2; x++) if (isAir(g(x, y)) && isAir(g(x, y - 1)) && isAir(g(x, y - 2)) && isStand(g(x, y + 1))) { const dd = Math.abs(x - (rx + CW / 2)) + Math.abs(y - (ry + CH - 3)) * 0.5; if (dd < bd) { bd = dd; spot = [x, y]; } } }
      if (spot) niList.push({ x: spot[0], y: spot[1], cell: k });
    }
    return niList;
  }
  Z.nischen = () => nichesOf(Z.level);
  function niches(H) {
    const { c, x0, x1, y0, y1, T, PAL, lv, isWall, h3 } = H;
    for (const n of nichesOf(lv)) {
      if (n.x < x0 - 3 || n.x > x1 + 3 || n.y < y0 - 5 || n.y > y1 + 2) continue;
      if (!isWall(n.x, n.y - 1) || !isWall(n.x, n.y - 2)) continue;
      const px = n.x * T + 8, bot = (n.y + 1) * T, w = 28, top = bot - 54; H.setCR(px - 40, top - 70, 80, bot - top + 72);
      /* Lichtstrahl von oben */
      c.save(); c.globalCompositeOperation = "lighter"; const lg = c.createLinearGradient(0, top - 60, 0, bot); lg.addColorStop(0, "rgba(255,230,170,0)"); lg.addColorStop(0.35, "rgba(255,230,170,.12)"); lg.addColorStop(1, "rgba(255,230,170,.05)"); c.fillStyle = lg; c.beginPath(); c.moveTo(px - 6, top - 60); c.lineTo(px + 6, top - 60); c.lineTo(px + 22, bot); c.lineTo(px - 14, bot); c.fill(); c.restore();
      c.fillStyle = "rgba(0,0,0,.4)"; c.beginPath(); c.moveTo(px - w / 2, bot); c.lineTo(px - w / 2, top + w / 2); c.arc(px, top + w / 2, w / 2, Math.PI, 0); c.lineTo(px + w / 2, bot); c.fill();
      c.strokeStyle = PAL.stone; c.lineWidth = 3; c.beginPath(); c.moveTo(px - w / 2 - 1.5, bot); c.lineTo(px - w / 2 - 1.5, top + w / 2); c.arc(px, top + w / 2, w / 2 + 1.5, Math.PI, 0); c.lineTo(px + w / 2 + 1.5, bot); c.stroke();
      c.strokeStyle = PAL.stoneHi; c.lineWidth = 0.6; c.beginPath(); c.arc(px, top + w / 2, w / 2 + 3, Math.PI * 1.05, Math.PI * 1.5); c.stroke();
      /* kleiner Schrein: Sockel, Figürchen, Opferschale */
      c.fillStyle = PAL.stone; c.fillRect(px - 7, bot - 18, 14, 3); c.fillStyle = PAL.stoneHi; c.fillRect(px - 7, bot - 18, 14, 0.6);
      c.fillStyle = H.lit(H.B.wall, 0.25); c.beginPath(); c.moveTo(px - 3, bot - 18); c.quadraticCurveTo(px - 3.5, bot - 26, px, bot - 30); c.quadraticCurveTo(px + 3.5, bot - 26, px + 3, bot - 18); c.fill(); c.beginPath(); c.arc(px, bot - 31.5, 2, 0, TAU); c.fill();
      c.fillStyle = "rgba(240,210,140,.35)"; c.beginPath(); c.arc(px, bot - 31.5, 3.6, 0, TAU); c.fill();
      c.fillStyle = "#6a4a2a"; c.beginPath(); c.ellipse(px, bot - 15, 5, 1.6, 0, 0, Math.PI); c.fill();
      for (let k = 0; k < 14; k++) { const a = Math.PI + h3(n.x, k, 1910) * Math.PI, r = w / 2 + 2 + h3(k, n.y, 1911) * 3; c.fillStyle = k % 3 ? "rgba(70,100,44,.75)" : "rgba(110,140,60,.7)"; c.beginPath(); c.arc(px + Math.cos(a) * r, top + w / 2 + Math.sin(a) * r, 1 + h3(n.x, k, 1912) * 1.4, 0, TAU); c.fill(); }
      for (let k = 0; k < 6; k++) { c.fillStyle = "rgba(70,100,44,.6)"; c.fillRect(px - w / 2 - 2 + (k % 2) * (w + 2), bot - 4 - h3(k, 9, 1913) * 20, 1.4, 3 + h3(k, 8, 1914) * 6); }
    }
  }
  /* ---------- Abnutzung, Pfützen, Wandflecken (Runde 9; alles im Chunk-Cache) ---------- */
  const WET = { cellar: 1, dungeon: 1, lake: 1, harbour: 1, storm: 1, chasm: 0.5 };
  const STAIN = { cellar: ["rgba(236,232,220,", "salpeter"], dungeon: ["rgba(60,80,40,", "moder"], lake: ["rgba(60,110,70,", "algen"], harbour: ["rgba(230,226,210,", "salz"], castle: ["rgba(20,16,12,", "wasser"],
    halls: ["rgba(20,14,10,", "wasser"], belltower: ["rgba(236,230,220,", "kalk"], forge: ["rgba(10,8,6,", "russ"], embercity: ["rgba(10,8,6,", "russ"], spires: ["rgba(10,8,6,", "russ"], ramparts: ["rgba(40,50,30,", "wasser"], storm: ["rgba(40,60,30,", "moder"], chasm: ["rgba(60,40,70,", "moder"] };
  function wearAndPuddles(H) {
    const { c, x0, x1, y0, y1, T, B, lv, h3, sol, PAL } = H, wet = WET[B.bg] || 0;
    for (let y = y0; y <= y1; y++) for (let x = x0; x < x1; x++) {
      if (!H.inLv(x, y) || !sol(x, y) || sol(x, y - 1) || lv.get(x, y - 1) !== 0) continue;
      const px = x * T, py = y * T, ck = lv.cells && lv.cells[Math.floor(x / Z.CW) + "," + Math.floor(y / Z.CH)], main = ck && ck.kind === "path";
      /* Laufbahn: auf dem Hauptweg glatt getretene, leicht glänzende Oberkante */
      if (main && sol(x - 1, y) && sol(x + 1, y) && !sol(x - 1, y - 1) && !sol(x + 1, y - 1)) {
        c.fillStyle = "rgba(255,240,220,.07)"; c.fillRect(px, py + 0.2, T, 1.2); c.fillStyle = "rgba(0,0,0,.08)"; c.fillRect(px, py + 1.6, T, 1);
        if (h3(x, y, 1810) < 0.3) { c.fillStyle = "rgba(0,0,0,.12)"; c.beginPath(); c.ellipse(px + 4 + h3(x, y, 1811) * 8, py + 0.6, 2.2, 0.5, 0, 0, TAU); c.fill(); }
      }
      /* Pfützen in feuchten Gebieten: flache Mulden mit dunklem Wasser, Spiegelglanz und Randlicht */
      if (wet && h3(x, y, 1820) < 0.035 * wet && sol(x + 1, y) && sol(x + 2, y) && lv.get(x + 1, y - 1) === 0 && lv.get(x + 2, y - 1) === 0 && sol(x - 1, y)) {
        const cx = px + 24, w2 = 14 + h3(x, y, 1821) * 8; H.setCR(cx - w2 - 2, py - 2, w2 * 2 + 4, 5);
        c.fillStyle = B.bg === "lake" ? "rgba(14,34,26,.85)" : "rgba(20,24,20,.8)"; c.beginPath(); c.ellipse(cx, py + 0.8, w2, 1.6, 0, 0, TAU); c.fill();
        const g = c.createLinearGradient(cx - w2, 0, cx + w2, 0); g.addColorStop(0, "rgba(220,230,210,0)"); g.addColorStop(0.4, "rgba(220,230,210,.22)"); g.addColorStop(0.6, "rgba(220,230,210,.08)"); g.addColorStop(1, "rgba(220,230,210,0)"); c.fillStyle = g; c.fillRect(cx - w2, py + 0.1, w2 * 2, 0.9);
        c.strokeStyle = "rgba(255,240,220,.12)"; c.lineWidth = 0.4; c.beginPath(); c.ellipse(cx, py + 0.8, w2, 1.6, 0, Math.PI * 1.05, Math.PI * 1.9); c.stroke();
        c.fillStyle = "rgba(0,0,0,.18)"; c.fillRect(cx - w2 - 1, py + 2.2, w2 * 2 + 2, 1);
      }
    }
    /* Trittspuren auf Steinstufen (v 8): ausgetretene Mitte, polierte Kante */
    for (let y = y0; y <= y1; y++) for (let x = x0; x < x1; x++) {
      if (lv.get(x, y) !== 8) continue; const px = x * T, py = y * T;
      c.fillStyle = "rgba(0,0,0,.14)"; c.beginPath(); c.ellipse(px + 8, py + 1.2, 5, 0.9, 0, 0, TAU); c.fill();
      c.fillStyle = "rgba(255,240,220,.16)"; c.fillRect(px + 1, py, T - 2, 0.6);
    }
  }
  function stains(H) {
    const { c, x0, x1, y0, y1, T, B, h3, isWall, sol } = H, st = STAIN[B.bg]; if (!st) return;
    for (let y = y0 - 1; y < y1 + 1; y++) for (let x = x0 - 1; x < x1 + 1; x++) {
      if (!isWall(x, y) || !sol(x, y - 1) || h3(x, y, 1830) > 0.07) continue;
      /* Fleck läuft von der Decke herab: Fahne mit ausgefranstem Rand, je Gebiet andere Farbe */
      const px = x * T + h3(x, y, 1831) * 10, py = y * T, len = 14 + h3(x, y, 1832) * 34, wd = 4 + h3(x, y, 1833) * 8, a = st[1] === "salpeter" || st[1] === "salz" || st[1] === "kalk" ? 0.16 : 0.2;
      H.setCR(px - wd, py, wd * 3, len + 4);
      const g = c.createLinearGradient(0, py, 0, py + len); g.addColorStop(0, st[0] + a + ")"); g.addColorStop(1, st[0] + "0)"); c.fillStyle = g;
      c.beginPath(); c.moveTo(px - wd * 0.6, py); c.quadraticCurveTo(px - wd, py + len * 0.5, px - wd * 0.3, py + len); c.lineTo(px + wd * 0.4, py + len * 0.8); c.quadraticCurveTo(px + wd, py + len * 0.4, px + wd * 0.7, py); c.fill();
      if (st[1] === "salpeter" || st[1] === "salz" || st[1] === "kalk") { c.fillStyle = st[0] + ".25)"; for (let k = 0; k < 8; k++) c.fillRect(px - wd * 0.6 + h3(x, y, 1840 + k) * wd * 1.4, py + h3(x, y, 1850 + k) * len * 0.7, 1 + h3(x, y, 1860 + k), 0.7); }
      if (st[1] === "algen" || st[1] === "moder") { c.fillStyle = st[0] + ".3)"; for (let k = 0; k < 5; k++) c.fillRect(px - 1 + (h3(x, y, 1870 + k) - 0.5) * wd, py, 0.7, 3 + h3(x, y, 1880 + k) * len * 0.6); }
    }
  }
  G.tileHooks.push(function (k, H) {
    if (Z.gfx.off && Z.gfx.off.steinmetz) return;
    const P = Z.gfx.stProf, t0 = P ? performance.now() : 0;
    const o10 = Z.gfx.off && Z.gfx.off.r10;
    if (k === "wall") { wall(H); if (!(Z.gfx.off && Z.gfx.off.textur)) { stains(H); arches(H); } if (!o10) { gatehouses(H); niches(H); } } else if (k === "rock") rock(H); else if (k === "fix") { floorBits(H); fix(H); if (!(Z.gfx.off && Z.gfx.off.textur)) { wearAndPuddles(H); thresholds(H); } if (!o10) { balustrades(H); ladderWear(H); } }
    if (P) { H.c.getImageData(0, 0, 1, 1); P[k] = (P[k] || 0) + performance.now() - t0; }
  });
})();

/* Ezekiel – The Destroyer · Lichtinseln (ab Stufe 1)
   Wo weit und breit keine Lichtquelle hängt, bringen Wandlaternen, Kerzen in Nischen, Leuchtpilze, Kristalle oder
   Glutrisse Licht in den Raum – mit sichtbarer Quelle, nie Licht aus dem Nichts. Dazu ein leichtes Anheben des
   Umgebungslichts (Stufe 2/3) und ein sanftes, warmes Wegelicht um Ezekiel, damit Wege lesbar bleiben, ohne dass die
   Stimmung verloren geht. Stufe 0 unverändert. Kein Blau. */
(function () {
  "use strict";
  const Z = window.Z, G = Z.gfx, T = Z.TILE, TAU = Math.PI * 2;
  const on = () => { const q = Z.gq; if (!q) return true; if (q.lean) return false; return q.level === -1 ? true : q.level >= 1; };
  const LAMP = { castle: "laterne", ramparts: "laterne", storm: "laterne", camp: "laterne", passage: "kerze", halls: "leuchter", cellar: "kerze", dungeon: "fackel", harbour: "schiffslaterne", belltower: "laterne", spires: "glutkorb", chasm: "kristall", lake: "pilz", embercity: "glutriss", forge: "runenlampe" };
  const COL = { laterne: "#ffc070", kerze: "#ffd890", leuchter: "#ffd080", fackel: "#ffa850", schiffslaterne: "#ffc880", glutkorb: "#ff8a40", kristall: "#d090ff", pilz: "#8af0b0", glutriss: "#ff7a30", runenlampe: "#ffcc70" };
  const hash = (x, y) => { let h = (x * 374761393 + y * 668265263) ^ 0x5bd1e995; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
  let L = null, Llv = null;
  function lamps() {
    const lv = Z.level, B = Z.biome; if (!lv || !B) return [];
    if (L && Llv === lv) return L; Llv = lv; L = [];
    const kind = LAMP[B.bg]; if (!kind || lv.hub) return L;
    const solid = v => v === 1 || v === 7, stand = v => v === 1 || v === 7 || v === 2 || v === 8, sky = G.sky;
    const src = (lv.lights || []).map(d => [d.x, d.y]);
    const near = (x, y, r) => { for (const [a, b] of src) if (Math.abs(a - x) <= r && Math.abs(b - y) <= r * 0.7) return true; return false; };
    const free = (x, y) => lv.get(x, y) === 0 && !(sky && sky[y * lv.W + x]) && !(G.isOpen && G.isOpen(x, y));
    const R = Math.max(7, 9 - ((lv.seed || 0) % 2));
    for (let y = 2; y < lv.H - 1; y++) for (let x = 2; x < lv.W - 2; x++) {
      if (!stand(lv.get(x, y + 1)) || lv.get(x, y) !== 0) continue;
      if (hash(x, y) > 0.35) continue;
      const ly = y - 1; if (!free(x, ly) || !free(x, y) || near(x, ly, R)) continue;
      /* Pilze und Glutrisse liegen am Boden, alles andere hängt an der Wand */
      const ground = kind === "pilz" || kind === "glutriss";
      L.push({ x, y: ground ? y : ly, k: kind, ground, ph: hash(y, x) * 9 }); src.push([x, ground ? y : ly]);
    }
    return L;
  }
  const lampPos = l => ({ x: l.x * T + 8, y: l.ground ? (l.y + 1) * T - 3 : l.y * T + 6 });
  if (G.lightGather) G.lightGather.push(function (add, cam, t, lvl) {
    if (!on() || !Z.level || Z.darkness > 0 || (G.off && G.off.inseln)) return;
    for (const l of lamps()) { const p = lampPos(l); if (p.x < cam.x - 120 || p.x > cam.x + cam.w + 120 || p.y < cam.y - 100 || p.y > cam.y + cam.h + 100) continue; const f = 0.9 + 0.1 * Math.sin(t * 7 + l.ph) * (l.k === "fackel" || l.k === "glutkorb" ? 1.6 : 0.6);
      add(p.x, p.y, l.k === "kerze" ? 90 : l.k === "pilz" || l.k === "kristall" ? 95 : 115, COL[l.k], (l.k === "kerze" ? 0.5 : 0.58) * f, l.k === "pilz" || l.k === "kristall" ? 6 : 10); }
    /* Wegelicht: warmes, weiches Licht um Ezekiel (lesbare Wege, keine Taschenlampe) */
    const P = Z.player; if (P && !P.dead) add(P.x + P.w / 2, P.y + P.h - 4, 140, "#fff0dc", 0.22, 0);
  });
  /* Umgebungslicht dezent anheben (Stufe 2/3, nicht in Abgrund-Dunkelheit) */
  if (G.colorOver) G.colorOver.push(function (a2, X0, Y0, sx, sy, AW, AH) {
    if (!on() || !Z.level || Z.darkness > 0 || (G.off && G.off.inseln)) return;
    const B = Z.biome || {}, k = Math.max(0, (B.dark || 0.5) - 0.3) * 0.28; if (k <= 0.005) return;
    a2.globalCompositeOperation = "lighter"; a2.globalAlpha = k; a2.fillStyle = "#f4ecf0"; a2.fillRect(0, 0, AW, AH); a2.globalAlpha = 1;
  });
  /* Lampen zeichnen (vor dem Licht, damit sie selbst beleuchtet und die Flammen danach im Schein liegen) */
  function drawLamp(c, l, t) {
    const p = lampPos(l), x = p.x, y = p.y, fl = 0.85 + 0.15 * Math.sin(t * 9 + l.ph) + 0.08 * Math.sin(t * 23 + l.ph);
    switch (l.k) {
      case "laterne": case "schiffslaterne": {
        c.fillStyle = "#2a2420"; c.fillRect(x - 0.6, y - 9, 1.2, 4); c.fillRect(x - 0.6, y - 9, 6, 1.2); c.fillRect(x + 4.4, y - 9, 1.2, 2.4);
        const lx = x + 5; c.fillStyle = "#3a3028"; c.fillRect(lx - 2.6, y - 6.6, 5.2, 1.2); c.fillRect(lx - 2.6, y + 1.6, 5.2, 1.2);
        c.fillStyle = l.k === "schiffslaterne" ? "#c87a2a" : "#ffcf7a"; c.globalAlpha = 0.9; c.fillRect(lx - 2, y - 5.4, 4, 7); c.globalAlpha = 1;
        c.fillStyle = "#fff0c0"; c.fillRect(lx - 0.6, y - 3 + (1 - fl), 1.2, 2.4 * fl);
        c.fillStyle = "#2a2420"; c.fillRect(lx - 2.6, y - 5.4, 0.7, 7); c.fillRect(lx + 1.9, y - 5.4, 0.7, 7); c.fillRect(lx - 0.35, y - 5.4, 0.7, 7); break;
      }
      case "kerze": {
        c.fillStyle = "rgba(0,0,0,.4)"; c.beginPath(); c.moveTo(x - 5, y + 4); c.lineTo(x - 5, y - 3); c.arc(x, y - 3, 5, Math.PI, 0); c.lineTo(x + 5, y + 4); c.fill();
        c.fillStyle = "#e8dcc0"; c.fillRect(x - 2.6, y - 2, 2, 6); c.fillRect(x + 0.8, y, 1.8, 4); c.fillStyle = "rgba(240,230,210,.7)"; c.fillRect(x - 3.4, y + 3.4, 7, 0.8);
        c.fillStyle = "#ffd890"; c.beginPath(); c.ellipse(x - 1.6, y - 3.4, 0.8, 1.6 * fl, 0, 0, TAU); c.ellipse(x + 1.7, y - 1.4, 0.7, 1.3 * fl, 0, 0, TAU); c.fill(); break;
      }
      case "leuchter": {
        c.fillStyle = "#8a6a2a"; c.fillRect(x - 0.7, y - 2, 1.4, 6); c.fillRect(x - 5, y + 1, 10, 1); c.fillRect(x - 5, y - 2, 1, 3); c.fillRect(x + 4, y - 2, 1, 3);
        c.fillStyle = "#efe4cc"; for (const dx of [-4.5, 0, 4.5]) c.fillRect(x + dx - 0.6, y - 5, 1.2, 3);
        c.fillStyle = "#ffe0a0"; for (const dx of [-4.5, 0, 4.5]) { c.beginPath(); c.ellipse(x + dx, y - 6, 0.6, 1.3 * fl, 0, 0, TAU); c.fill(); } break;
      }
      case "fackel": {
        c.fillStyle = "#2a2420"; c.fillRect(x - 2, y + 2, 4, 1.2); c.fillStyle = "#5a3a20"; c.save(); c.translate(x, y + 2); c.rotate(0.25); c.fillRect(-0.9, -8, 1.8, 9); c.restore();
        c.fillStyle = "#ff9a40"; c.beginPath(); c.moveTo(x - 0.8, y - 6); c.quadraticCurveTo(x - 3, y - 9, x - 0.4, y - 13 * fl + 2); c.quadraticCurveTo(x + 2.4, y - 9, x + 1.6, y - 6); c.fill(); c.fillStyle = "#ffe0a0"; c.beginPath(); c.ellipse(x, y - 8, 0.9, 1.8 * fl, 0, 0, TAU); c.fill(); break;
      }
      case "glutkorb": {
        c.fillStyle = "#2a2420"; c.fillRect(x - 0.6, y - 4, 1.2, 4); c.beginPath(); c.moveTo(x - 4, y - 4); c.lineTo(x + 4, y - 4); c.lineTo(x + 2.6, y + 1); c.lineTo(x - 2.6, y + 1); c.fill();
        c.fillStyle = "#ff7a30"; c.fillRect(x - 3, y - 5, 6, 1.4); c.fillStyle = "#ffd080"; c.fillRect(x - 1.4 + Math.sin(t * 5 + l.ph), y - 5.4, 1.2, 0.8); break;
      }
      case "kristall": {
        const cols = ["#b070e0", "#e8d0ff"]; for (let k = 0; k < 3; k++) { const hh = 4 + k * 2, xx = x - 3 + k * 3; c.fillStyle = cols[0]; c.beginPath(); c.moveTo(xx - 1.3, y + 4); c.lineTo(xx + (k - 1) * 0.6, y + 4 - hh); c.lineTo(xx + 1.3, y + 4); c.fill(); c.fillStyle = cols[1]; c.fillRect(xx + (k - 1) * 0.6 - 0.3, y + 4 - hh + 1, 0.6, hh * 0.5); }
        c.fillStyle = "#4a3a50"; c.fillRect(x - 5, y + 4, 10, 1.4); break;
      }
      case "pilz": {
        for (let k = 0; k < 4; k++) { const xx = x - 4 + k * 2.6 + (k % 2) * 0.6, hh = 2.5 + ((k * 7 + l.x) % 3); c.fillStyle = "#cfe8d0"; c.fillRect(xx - 0.3, y + 3 - hh, 0.6, hh); c.fillStyle = k % 2 ? "#8af0b0" : "#c0ffd0"; c.beginPath(); c.ellipse(xx, y + 3 - hh, 1.5, 1, 0, Math.PI, TAU); c.fill(); } break;
      }
      case "glutriss": {
        c.save(); c.globalCompositeOperation = "lighter"; c.strokeStyle = "rgba(255,120,40," + (0.6 * fl) + ")"; c.lineWidth = 1; c.beginPath(); c.moveTo(x - 6, y + 3); c.lineTo(x - 2, y + 1.6); c.lineTo(x + 1, y + 3); c.lineTo(x + 6, y + 2); c.stroke(); c.fillStyle = "rgba(255,200,120," + (0.7 * fl) + ")"; c.fillRect(x - 2.4, y + 1.2, 1.2, 0.8); c.restore(); break;
      }
      case "runenlampe": {
        c.fillStyle = "#3a3230"; c.fillRect(x - 3, y - 4, 6, 8); c.fillStyle = "#5a504a"; c.fillRect(x - 3, y - 4, 6, 0.8);
        c.strokeStyle = "rgba(255,200,110," + (0.8 * fl) + ")"; c.lineWidth = 0.7; c.beginPath(); c.moveTo(x, y - 2.6); c.lineTo(x, y + 2.6); c.moveTo(x, y - 1.2); c.lineTo(x + 1.6, y + 0.2); c.moveTo(x, y); c.lineTo(x - 1.6, y + 1.6); c.stroke(); break;
      }
    }
  }
  const mid0 = Z.drawMidLife;
  Z.drawMidLife = function (c, cam, t) {
    if (mid0) mid0.apply(this, arguments);
    if (!on() || !Z.level || (G.off && G.off.inseln)) return;
    c.save();
    for (const l of lamps()) { const x = l.x * T + 8, y = l.y * T; if (x < cam.x - 20 || x > cam.x + cam.w + 20 || y < cam.y - 20 || y > cam.y + cam.h + 20) continue; drawLamp(c, l, t); }
    c.restore();
  };
  Z.lichtinseln = () => lamps();
})();

/* Ezekiel – The Destroyer · Laufspuren (ab Stufe 1)
   Gras und Schilf neigen sich vor Ezekiel zur Seite und federn zurück, bei harten Landungen rieselt Staub von der
   Decke, auf nassem Boden spritzen beim Laufen kleine Tropfen, in Asche und Staub steigen kleine Wölkchen auf. */
(function () {
  "use strict";
  const Z = window.Z, G = Z.gfx, T = Z.TILE, FX = Z.fx;
  const on = () => { const q = Z.gq; if (!q) return true; if (q.lean) return false; return q.level === -1 ? true : q.level >= 1; };
  const WET = { cellar: 1, dungeon: 1, lake: 1, harbour: 1 }, DUSTY = { embercity: 1, forge: 1, spires: 1, belltower: 1, halls: 1, castle: 1 };
  const bend = new Map(); let bLv = null;
  let stepAcc = 0, wasAir = false, vyMax = 0;
  /* über Z.prachtTick (ebenen.js setzt Z.ebenenTick neu, ohne Kette) */
  const tick0 = Z.prachtTick;
  Z.prachtTick = function (dt) {
    if (tick0) tick0(dt);
    const P = Z.player, lv = Z.level, B = Z.biome; if (!on() || !P || P.dead || !lv || !B) return;
    const q = (Z.gq && Z.gq.part) || 1, onG = !!P.onGround, fx = P.x + P.w / 2, fy = P.y + P.h;
    if (!onG) vyMax = Math.max(vyMax, P.vy || 0);
    /* harte Landung: Staub von der Decke über Ezekiel */
    if (onG && wasAir && vyMax > 330) {
      const tx = Math.floor(fx / T); let ty = Math.floor(P.y / T) - 1, n = 0;
      while (ty > 0 && n < 7 && lv.get(tx, ty) === 0) { ty--; n++; }
      if (lv.get(tx, ty) === 1 && n < 7) { const cy = (ty + 1) * T; for (let i = 0; i < Math.round(8 * q); i++) FX.p({ x: fx + (Math.random() - 0.5) * 40, y: cy + 1, vx: (Math.random() - 0.5) * 6, vy: 10 + Math.random() * 30, g: 220, life: 1.6, size: 0.8 + Math.random(), col: Z.dustCol || "#8a7a70", kind: Math.random() < 0.3 ? "shard" : "dot" }); }
    }
    if (onG) vyMax = 0; wasAir = !onG;
    /* Schritte: Tropfen auf nassem Boden, Staubwölkchen in trockenen Hallen */
    const sp = Math.abs(P.vx || 0);
    if (onG && sp > 70) {
      stepAcc += dt * sp / 60;
      if (stepAcc > 1.6) {
        stepAcc = 0;
        if (WET[B.bg] && Math.random() < 0.8 * q) for (let i = 0; i < 3; i++) FX.p({ x: fx + (Math.random() - 0.5) * 6, y: fy - 1, vx: (Math.random() - 0.5) * 40 - (P.vx || 0) * 0.1, vy: -30 - Math.random() * 40, g: 500, life: 0.35, size: 0.9, col: B.bg === "lake" ? "rgba(200,240,220,.7)" : "rgba(210,205,200,.6)", kind: "dot" });
        else if (DUSTY[B.bg] && Math.random() < 0.5 * q) FX.p({ x: fx - Math.sign(P.vx) * 4, y: fy - 2, vx: -Math.sign(P.vx) * 8, vy: -6, g: -4, life: 0.8, size: 3, col: Z.dustCol || "rgba(150,130,120,.5)", kind: "smoke" });
      }
    }
    /* Gras: Neigung je Halm-Spalte nahe Ezekiel (federt zurück) */
    if (bLv !== lv) { bLv = lv; bend.clear(); }
    if (B.tile && (B.tile.top === "moss" || B.tile.top === "algae")) {
      const tx0 = Math.floor((fx - 40) / T), tx1 = Math.floor((fx + 40) / T), ty = Math.floor((fy + 2) / T);
      for (let tx = tx0; tx <= tx1; tx++) for (let k = 0; k < 6; k++) { const x = tx * T + k * 2.6 + 1, d = x - fx, key = tx * 8 + k + ty * 100000; if (Math.abs(d) < 14 && onG) { const tgt = Math.sign(d || 1) * (1 - Math.abs(d) / 14) * (0.9 + Math.min(1, sp / 200) * 0.5); const cur = bend.get(key) || 0; bend.set(key, cur + (tgt - cur) * Math.min(1, dt * 14)); } }
    }
    for (const [k, v] of bend) { const nv = v * Math.pow(0.02, dt); if (Math.abs(nv) < 0.01) bend.delete(k); else bend.set(k, nv); }
  };
  Z.laufspuren = () => bend.size;
  const mid0 = Z.drawMidLife;
  Z.drawMidLife = function (c, cam, t) {
    if (mid0) mid0.apply(this, arguments);
    if (!on() || !bend.size || !Z.level) return;
    const B = Z.biome, lv = Z.level, col = B.tile.topCol || "#4f6b34";
    c.save(); c.lineWidth = 0.9; c.lineCap = "round";
    for (const [key, v] of bend) {
      const ty = Math.floor(key / 100000), r = key - ty * 100000, tx = Math.floor(r / 8), k = r - tx * 8;
      if (!(lv.get(tx, ty) === 1 || lv.get(tx, ty) === 7) || lv.get(tx, ty - 1) !== 0) continue;
      const x = tx * T + k * 2.6 + 1, y = ty * T - 0.5, h = 4 + ((tx * 7 + k * 3) % 4), sw = Math.sin(t * 2 + x * 0.3) * 0.15;
      c.strokeStyle = k % 2 ? col : Z.shade(col, 0.15);
      c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + (v + sw) * h * 0.3, y - h * 0.6, x + (v + sw) * h * 0.95, y - h * (1 - Math.abs(v) * 0.45)); c.stroke();
    }
    c.restore();
  };
})();

/* Ezekiel – The Destroyer · Arena-Kulissen: Wachturm und Turmspitze (ab Stufe 1; Vordergrund ab Stufe 2)
   Wachturm: hinter der Plattform ein gewaltiges Glockengerüst mit gesprungener Glocke, ferne Wachtürme mit
   Signalfeuern auf den Hügeln, eine Wehrmauer, die in die Tiefe läuft, wehende Fahnen; zwei Feuerkörbe auf der Plattform.
   Turmspitze: der abgebrochene Turmhelm ragt in den Sturm, Wasserspeier, ziehende Giftnebelbänder, umherwirbelnde
   Trümmer; grüngoldene Hexenfeuer. Vordergrund: Zinnen- und Kettenschattenrisse an den Rändern (blenden vor Spielgeschehen aus). */
(function () {
  "use strict";
  const Z = window.Z, G = Z.gfx, T = Z.TILE, TAU = Math.PI * 2, PI = Math.PI;
  const on = () => { const q = Z.gq; if (!q) return true; if (q.lean) return false; return q.level === -1 ? true : q.level >= 1; };
  const rich = () => { const q = Z.gq; return !q || (q.level === -1 ? q.layers !== false : q.level >= 2); };
  const which = () => { const lv = Z.level; return lv && (lv.arena === "wachturm" || lv.arena === "venomfang") ? lv.arena : null; };
  function floorY() { const lv = Z.level, x = Math.floor(lv.W / 2); for (let y = 3; y < lv.H; y++) if (lv.get(x, y) === 1) return y * T; return (lv.H - 2) * T; }
  const par = (cam, wx, p) => cam.x * (1 - p) + wx * p;
  const zt = () => (Z.zeit ? Z.zeit() : null);
  const rimCol = () => { const z = zt(); return z && Z.gfx.lightRGB ? "rgba(" + Z.gfx.lightRGB(z.light).join(",") + ",.35)" : "rgba(255,220,200,.3)"; };
  /* ---------- Wachturm ---------- */
  function backTurm(c, cam, t) {
    const lv = Z.level, W = lv.W * T, fy = floorY(), rim = rimCol();
    /* ferne Hügel mit Wachtürmen und Signalfeuern */
    for (let i = 0; i < 5; i++) {
      const wx = par(cam, W * (0.1 + i * 0.2), 0.3), hy = fy - 30 - (i % 2) * 14;
      c.fillStyle = "rgba(22,14,24,.9)"; c.beginPath(); c.moveTo(wx - 90, fy + 20); c.quadraticCurveTo(wx - 30, hy - 10, wx, hy); c.quadraticCurveTo(wx + 40, hy + 4, wx + 100, fy + 20); c.fill();
      c.fillRect(wx - 5, hy - 34, 10, 34); c.fillRect(wx - 7, hy - 38, 14, 4); for (let k = 0; k < 3; k++) c.fillRect(wx - 7 + k * 5, hy - 41, 3, 3);
      const f = 0.7 + 0.3 * Math.sin(t * 6 + i * 2) + 0.1 * Math.sin(t * 17 + i);
      c.save(); c.globalCompositeOperation = "lighter"; const g = c.createRadialGradient(wx, hy - 44, 0, wx, hy - 44, 14); g.addColorStop(0, "rgba(255,170,80," + (0.7 * f) + ")"); g.addColorStop(1, "rgba(255,120,40,0)"); c.fillStyle = g; c.fillRect(wx - 14, hy - 58, 28, 28); c.fillStyle = "rgba(255,220,150," + f + ")"; c.fillRect(wx - 1, hy - 46, 2, 2.5); c.restore();
    }
    /* Wehrmauer, die in die Tiefe läuft */
    const mw0 = par(cam, -40, 0.55), mw1 = par(cam, W + 40, 0.55), my = fy - 52;
    c.fillStyle = "#1e1620"; c.fillRect(mw0, my, mw1 - mw0, 80); for (let x = mw0; x < mw1; x += 14) c.fillRect(x, my - 7, 8, 7);
    c.fillStyle = rim; c.fillRect(mw0, my, mw1 - mw0, 1); for (let x = mw0; x < mw1; x += 14) c.fillRect(x, my - 7, 8, 0.8);
    c.fillStyle = "rgba(0,0,0,.25)"; for (let x = mw0 + 40; x < mw1; x += 90) c.fillRect(x, my + 8, 4, 10);
    /* Glockengerüst mit gesprungener Glocke */
    /* die Riesenglocke hängt an einem Seil aus dem Himmel über den Bergen – gesprungen, schwingt kaum */
    const bx = par(cam, W * 0.55, 0.6), top = cam.y - 4, sway = Math.sin(t * 0.7) * 0.05, rim2 = rimCol();
    c.save(); c.globalAlpha = 0.9; c.translate(bx, top); c.rotate(sway);
    c.strokeStyle = "#1e1612"; c.lineWidth = 2; c.beginPath(); c.moveTo(0, 0); c.lineTo(0, 18); c.stroke();
    c.fillStyle = "#24180e"; c.fillRect(-5, 16, 10, 5);
    c.fillStyle = "#2c2016"; c.beginPath(); c.moveTo(-8, 21); c.quadraticCurveTo(-9, 40, -24, 62); c.lineTo(24, 62); c.quadraticCurveTo(9, 40, 8, 21); c.closePath(); c.fill();
    c.fillStyle = rim2; c.beginPath(); c.moveTo(-7, 22); c.quadraticCurveTo(-8, 40, -21, 61); c.lineTo(-18, 61); c.quadraticCurveTo(-5, 40, -4, 22); c.fill();
    c.fillStyle = "#1a120a"; c.fillRect(-25, 61, 50, 3); c.strokeStyle = "#0e0806"; c.lineWidth = 1.2; c.beginPath(); c.moveTo(5, 30); c.lineTo(9, 42); c.lineTo(5, 50); c.lineTo(11, 62); c.stroke();
    c.restore();
    /* Fahnen an Stangen */
    for (const [fx0, k] of [[W * 0.2, 0], [W * 0.8, 1]]) { const fx = par(cam, fx0, 0.8), py = fy - 120; c.fillStyle = "#24181a"; c.fillRect(fx - 1, py, 2, 120); c.fillStyle = "#7a1a1a"; c.beginPath(); c.moveTo(fx + 1, py + 2); for (let i = 0; i <= 6; i++) { const u = i / 6; c.lineTo(fx + 1 + u * 30, py + 2 + Math.sin(t * 3 + u * 5 + k) * 3 * u); } for (let i = 6; i >= 0; i--) { const u = i / 6; c.lineTo(fx + 1 + u * 30, py + 16 + Math.sin(t * 3 + u * 5 + k + 0.5) * 3 * u); } c.fill(); c.fillStyle = "rgba(232,180,80,.6)"; c.beginPath(); c.arc(fx + 12, py + 9 + Math.sin(t * 3 + 2 + k) * 1.4, 3, 0, TAU); c.fill(); }
  }
  /* ---------- Turmspitze ---------- */
  function backSpitze(c, cam, t) {
    const lv = Z.level, W = lv.W * T, fy = floorY(), rim = rimCol();
    /* abgebrochener Turmhelm */
    const sx = par(cam, W * 0.62, 0.7), base = fy + 10;
    c.fillStyle = "#1a1418"; c.beginPath(); c.moveTo(sx - 70, base); c.lineTo(sx - 52, base - 210); c.lineTo(sx - 30, base - 236); c.lineTo(sx - 14, base - 214); c.lineTo(sx + 6, base - 250); c.lineTo(sx + 22, base - 222); c.lineTo(sx + 52, base - 200); c.lineTo(sx + 70, base); c.closePath(); c.fill();
    c.strokeStyle = rim; c.lineWidth = 1; c.beginPath(); c.moveTo(sx - 70, base); c.lineTo(sx - 52, base - 210); c.lineTo(sx - 30, base - 236); c.lineTo(sx - 14, base - 214); c.lineTo(sx + 6, base - 250); c.stroke();
    /* Spitzbogenfenster mit grünem Glimmen */
    for (let k = 0; k < 3; k++) { const wy = base - 60 - k * 52, ww = 12 - k * 2; c.fillStyle = "#0a0608"; c.beginPath(); c.moveTo(sx - ww / 2, wy); c.lineTo(sx - ww / 2, wy - 18); c.quadraticCurveTo(sx, wy - 30, sx + ww / 2, wy - 18); c.lineTo(sx + ww / 2, wy); c.fill(); c.save(); c.globalCompositeOperation = "lighter"; c.fillStyle = "rgba(140,220,90," + (0.18 + 0.1 * Math.sin(t * 2 + k)) + ")"; c.fillRect(sx - ww / 2 + 2, wy - 16, ww - 4, 14); c.restore(); }
    /* Wasserspeier an den Kanten */
    for (const [gx, d] of [[sx - 62, -1], [sx + 60, 1]]) { const gy = base - 120; c.fillStyle = "#1a1418"; c.beginPath(); c.moveTo(gx, gy); c.lineTo(gx + d * 22, gy - 4); c.lineTo(gx + d * 30, gy - 10); c.lineTo(gx + d * 26, gy - 2); c.lineTo(gx + d * 30, gy + 4); c.lineTo(gx + d * 14, gy + 8); c.lineTo(gx, gy + 12); c.fill(); c.beginPath(); c.moveTo(gx + d * 12, gy - 2); c.lineTo(gx + d * 8, gy - 16); c.lineTo(gx + d * 18, gy - 4); c.fill(); }
    /* Giftnebelbänder (grün, kein Blau) */
    c.save(); c.globalCompositeOperation = "lighter";
    for (let i = 0; i < 4; i++) { const y = fy - 40 - i * 46, x = cam.x + ((t * (8 + i * 5) + i * 300) % (cam.w + 400)) - 200, g = c.createLinearGradient(0, y - 12, 0, y + 12); g.addColorStop(0, "rgba(110,190,80,0)"); g.addColorStop(0.5, "rgba(110,190,80,.08)"); g.addColorStop(1, "rgba(110,190,80,0)"); c.fillStyle = g; c.fillRect(x - 200, y - 12, 400, 24); }
    c.restore();
    /* wirbelnde Trümmer und Blätter */
    c.fillStyle = "#2a2024"; for (let i = 0; i < 10; i++) { const u = ((t * (0.05 + (i % 3) * 0.02)) + i * 0.13) % 1, x = cam.x - 20 + u * (cam.w + 40), y = cam.y + cam.h * (0.15 + (i * 0.37) % 0.6) + Math.sin(t * 2 + i) * 10; c.save(); c.translate(x, y); c.rotate(t * (1 + i % 3) + i); c.fillRect(-2, -1, 4, 2); c.restore(); }
  }
  const back0 = Z.drawBackLife;
  Z.drawBackLife = function (c, cam, t, B, oy, LH) {
    if (back0) back0.apply(this, arguments);
    const w = which(); if (!w || !on()) return;
    c.save(); try { if (w === "wachturm") backTurm(c, cam, t); else backSpitze(c, cam, t); } catch (e) { console.error(e); } c.restore();
  };
  /* Feuerkörbe auf der Plattform (Wachturm: Glut; Turmspitze: grüngoldenes Hexenfeuer) */
  const BRZ = [0.2, 0.8];
  function brazierPos(k) { const lv = Z.level; return { x: Math.round(lv.W * BRZ[k]) * T + 8, y: floorY() }; }
  const mid0 = Z.drawMidLife;
  Z.drawMidLife = function (c, cam, t) {
    if (mid0) mid0.apply(this, arguments);
    const w = which(); if (!w || !on()) return;
    c.save();
    for (let k = 0; k < 2; k++) {
      const p = brazierPos(k), x = p.x, y = p.y, f = 0.85 + 0.15 * Math.sin(t * 9 + k * 3);
      c.fillStyle = "#2a2422"; c.fillRect(x - 1, y - 12, 2, 12); c.fillRect(x - 5, y - 1.5, 10, 1.5); c.beginPath(); c.moveTo(x - 7, y - 16); c.lineTo(x + 7, y - 16); c.lineTo(x + 4.5, y - 11); c.lineTo(x - 4.5, y - 11); c.fill();
      const fc = w === "wachturm" ? ["#ff8a30", "#ffe0a0"] : ["#a0e040", "#f0f0a0"];
      c.fillStyle = fc[0]; c.beginPath(); c.moveTo(x - 5, y - 16); c.quadraticCurveTo(x - 4, y - 24 * f, x, y - 28 * f); c.quadraticCurveTo(x + 4, y - 22 * f, x + 5, y - 16); c.fill();
      c.fillStyle = fc[1]; c.beginPath(); c.ellipse(x, y - 19, 1.8, 3.4 * f, 0, 0, TAU); c.fill();
      if (Math.random() < 0.08) Z.fx.p({ x: x + (Math.random() - 0.5) * 6, y: y - 24, vx: (Math.random() - 0.5) * 10, vy: -30 - Math.random() * 20, life: 1, size: 1.2, col: fc[0], kind: "glow", add: true });
    }
    c.restore();
  };
  if (G.lightGather) G.lightGather.push(function (add, cam, t) {
    const w = which(); if (!w || !on()) return;
    for (let k = 0; k < 2; k++) { const p = brazierPos(k); add(p.x, p.y - 20, 130, w === "wachturm" ? "#ff9a40" : "#b0e050", 0.55 * (0.9 + 0.1 * Math.sin(t * 9 + k * 3)), 14); }
  });
  /* Vordergrund: Zinnen bzw. Wasserspeier-Trümmer an den unteren Ecken, Kette oben (blendet vor Spielgeschehen aus) */
  const al0 = Z.drawAfterLight;
  Z.drawAfterLight = function (c, cam, W, H, t) {
    if (al0) al0.apply(this, arguments);
    const w = which(); if (!w || !rich() || (G.off && G.off.arenaFg)) return;
    const S = G.scale; c.save(); c.setTransform(S, 0, 0, S, 0, 0);
    const sx = cam.x * 1.3, items = [];
    for (let i = Math.floor(sx / 260) - 1; i <= Math.floor((sx + cam.w * 1.3) / 260) + 1; i++) items.push(i);
    for (const i of items) {
      const x = i * 260 - sx, h = cam.h, key = "ar" + i, isL = (i & 1) === 0;
      const bx = x, by = h - 26, bw = 70, bh = 40;
      const a = G.fgAlpha ? G.fgAlpha(key, bx, by - 30, bw, bh + 30, 0.92) : 0.92; if (a < 0.02) continue;
      c.globalAlpha = a; c.fillStyle = "#0b0709";
      if (w === "wachturm" || isL) { c.fillRect(bx, by + 6, bw, bh); for (let k = 0; k < 4; k++) c.fillRect(bx + 2 + k * 18, by - 6, 12, 14); c.fillStyle = "rgba(255,196,150,.12)"; for (let k = 0; k < 4; k++) c.fillRect(bx + 2 + k * 18, by - 6, 12, 1); }
      else { c.beginPath(); c.moveTo(bx, h); c.lineTo(bx + 10, by - 4); c.lineTo(bx + 26, by - 14); c.lineTo(bx + 40, by - 8); c.lineTo(bx + 34, by + 2); c.lineTo(bx + 60, by + 6); c.lineTo(bx + 70, h); c.fill(); c.beginPath(); c.moveTo(bx + 26, by - 14); c.lineTo(bx + 22, by - 26); c.lineTo(bx + 32, by - 12); c.fill(); }
    }
    /* Kette oben links */
    const cx = 30 - (cam.x * 1.3) % 400 + 400, ca = G.fgAlpha ? G.fgAlpha("arc", cx - 10, 0, 20, 90, 0.9) : 0.9;
    if (ca > 0.02 && w === "wachturm") { c.globalAlpha = ca; c.strokeStyle = "#0b0709"; c.lineWidth = 3; const sw = Math.sin(t * 0.8) * 4; for (let y = -6, k = 0; y < 80; y += 9, k++) { const xx = cx + sw * y / 80; if (k % 2) { c.fillStyle = "#0b0709"; c.fillRect(xx - 1.5, y, 3, 10); } else { c.beginPath(); c.ellipse(xx, y + 5, 4, 6, 0, 0, TAU); c.stroke(); } } }
    c.restore();
  };
})();

/* Ezekiel – The Destroyer · Bewegte Luft (ab Stufe 2)
   Bodennebel in feuchten Gebieten (und überall im Morgengrauen) liegt in Schwaden über dem Boden und teilt sich, wenn
   Ezekiel oder ein Gegner hindurchläuft – danach fließt er langsam zurück. Über Kerzen und Leuchtern kräuselt sich ein
   dünner Rauchfaden. */
(function () {
  "use strict";
  const Z = window.Z, G = Z.gfx, T = Z.TILE, TAU = Math.PI * 2;
  const rich = () => { const q = Z.gq; if (!q) return true; if (q.lean) return false; return q.level === -1 ? q.layers !== false : q.level >= 2; };
  const MISTY = { lake: 1, dungeon: 1, harbour: 1, cellar: 1, chasm: 1 };
  const hash = (x, y) => { let h = (x * 374761393 + y * 668265263) ^ 0x5bd1e995; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
  let blob = null;
  function mistSpr() { if (blob) return blob; blob = document.createElement("canvas"); blob.width = 64; blob.height = 32; const g = blob.getContext("2d"), gr = g.createRadialGradient(32, 16, 0, 32, 16, 32); gr.addColorStop(0, "rgba(232,224,224,.5)"); gr.addColorStop(0.6, "rgba(232,224,224,.18)"); gr.addColorStop(1, "rgba(232,224,224,0)"); g.save(); g.scale(1, 0.5); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); g.restore(); return blob; }
  const off = new Map(); let offLv = null, lastT = 0;
  function mistOn() { const B = Z.biome || {}, z = Z.zeit ? Z.zeit() : null, lv = Z.level; return lv && !lv.hub && !lv.passage && !lv.arena && (MISTY[B.bg] || (z && z.k === "morgen")); }
  const mid0 = Z.drawMidLife;
  Z.drawMidLife = function (c, cam, t) {
    if (mid0) mid0.apply(this, arguments);
    const lv = Z.level; if (!lv || !rich() || (G.off && G.off.luft)) return;
    const dt = Math.min(0.05, Math.max(0, t - lastT)); lastT = t;
    if (offLv !== lv) { offLv = lv; off.clear(); }
    c.save();
    /* Rauchfäden über Kerzen */
    c.lineWidth = 0.5; c.lineCap = "round";
    for (const d of lv.lights || []) {
      const oy = d.kind === "candle" ? 3 : d.kind === "candelabra" ? -15 : d.kind === "chandelier" ? 14 : null; if (oy == null) continue;
      const x = d.x * T + 8, y = d.y * T + oy; if (x < cam.x - 10 || x > cam.x + cam.w + 10 || y < cam.y - 30 || y > cam.y + cam.h) continue;
      const wind = (Z.windX || 0) * 0.08; c.strokeStyle = "rgba(200,190,200,.16)"; c.beginPath(); c.moveTo(x, y);
      for (let k = 1; k <= 8; k++) { const u = k / 8; c.lineTo(x + Math.sin(t * 1.6 + d.x + u * 5) * 2.4 * u + wind * u * 10, y - u * 18); }
      c.stroke();
    }
    /* Bodennebel, der sich teilt */
    if (mistOn()) {
      const P = Z.player, movers = []; if (P && !P.dead) movers.push(P); for (const e of Z.enemies) if (!e.dead && Math.abs(e.x - cam.x - cam.w / 2) < cam.w) movers.push(e);
      const spr = mistSpr(), x0 = Math.max(1, Math.floor(cam.x / T) - 2), x1 = Math.min(lv.W - 2, Math.ceil((cam.x + cam.w) / T) + 2), y0 = Math.max(1, Math.floor(cam.y / T)), y1 = Math.min(lv.H - 2, Math.ceil((cam.y + cam.h) / T));
      for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) {
        if (hash(tx, ty * 3 + 1) > 0.42) continue; const v = lv.get(tx, ty + 1); if (lv.get(tx, ty) !== 0 || !(v === 1 || v === 7)) continue;
        const key = ty * lv.W + tx, bx = tx * T + 8 + Math.sin(t * 0.3 + tx) * 6, by = (ty + 1) * T - 4;
        let o = off.get(key); if (!o) { o = { x: 0, y: 0 }; off.set(key, o); }
        let tx2 = 0, ty2 = 0;
        for (const m of movers) { const mx = m.x + m.w / 2, my = m.y + m.h - 6, dx = bx - mx, dy = by - my, d = Math.hypot(dx, dy); if (d < 34) { const f = (34 - d) / 34 * (0.6 + Math.min(1, Math.abs(m.vx || 0) / 160)); tx2 += (dx / (d || 1)) * f * 26; ty2 += -f * 6; } }
        o.x += (tx2 - o.x) * Math.min(1, dt * (tx2 ? 6 : 0.8)); o.y += (ty2 - o.y) * Math.min(1, dt * (ty2 ? 6 : 0.8));
        const sp = Math.hypot(o.x, o.y), w = 46 + hash(tx, ty) * 20 - sp * 0.4, h = 14;
        c.globalAlpha = 0.3 * (1 - Math.min(0.6, sp / 40)); c.drawImage(spr, bx + o.x - w / 2, by + o.y - h / 2, w, h);
      }
    }
    c.restore();
  };
})();

/* Ezekiel – The Destroyer · Gemalter Sichtrand (ab Stufe 2)
   Der Sichtnebel (ebenen.js) bekommt am Rand eine Tusche-Kante: unregelmäßige, weich auslaufende Tintenkleckse in
   warmem Sepia statt einer glatten Schwärze, und die verborgenen Bereiche einen Hauch Pergamentbraun – wie eine
   Buchillustration, deren Ränder noch nicht ausgemalt sind. Läuft als letzte Überlagerung in der Lichtkarte. */
(function () {
  "use strict";
  const Z = window.Z, G = Z.gfx, T = Z.TILE, TAU = Math.PI * 2;
  const rich = () => { const q = Z.gq; if (!q) return true; if (q.lean) return false; return q.level === -1 ? q.layers !== false : q.level >= 2; };
  const hash = (x, y) => { let h = (x * 374761393 + y * 668265263) ^ 0x5bd1e995; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
  const BL = [];
  function blots() {
    if (BL.length) return BL;
    for (let v = 0; v < 4; v++) {
      const cv = document.createElement("canvas"); cv.width = cv.height = 32; const g = cv.getContext("2d");
      for (let k = 0; k < 7; k++) { const x = 16 + (hash(v, k) - 0.5) * 14, y = 16 + (hash(k, v + 9) - 0.5) * 14, r = 5 + hash(v * 3, k * 5) * 7, gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, "rgba(30,18,16,.75)"); gr.addColorStop(0.7, "rgba(30,18,16,.45)"); gr.addColorStop(1, "rgba(30,18,16,0)"); g.fillStyle = gr; g.fillRect(0, 0, 32, 32); }
      g.fillStyle = "rgba(30,18,16,.6)"; for (let k = 0; k < 6; k++) { g.beginPath(); g.arc(4 + hash(v + 20, k) * 24, 4 + hash(k + 30, v) * 24, 0.6 + hash(k, v + 40), 0, TAU); g.fill(); }
      BL.push(cv);
    }
    /* helle Pergament-Kleckse (Papier scheint durch): gleiche Form, warmes Sepia */
    for (let v = 0; v < 4; v++) { const cv = document.createElement("canvas"); cv.width = cv.height = 32; const g = cv.getContext("2d"); g.drawImage(BL[v], 0, 0); g.globalCompositeOperation = "source-in"; g.fillStyle = "rgb(150,104,66)"; g.fillRect(0, 0, 32, 32); BL.push(cv); }
    return BL;
  }
  const fogOn = lv => lv && !lv.hub && !lv.arena && !lv.passage && lv.cells;
  function edge(l, X0, Y0, sx, sy, LW, LH) {
    const lv = Z.level; if (!rich() || !fogOn(lv) || !Z.sightAt || Z.darkness > 0 || (G.off && G.off.tusche)) return;
    const cam = Z.cam, B = blots(), x0 = Math.max(0, Math.floor(X0 / T) - 1), x1 = Math.min(lv.W - 1, Math.ceil((X0 + cam.w) / T) + 1), y0 = Math.max(0, Math.floor(Y0 / T) - 1), y1 = Math.min(lv.H - 1, Math.ceil((Y0 + cam.h) / T) + 1);
    const t = G.time || 0; l.save(); l.globalCompositeOperation = "source-over"; G._tuscheN = (G._tuscheN || 0) + 1;
    for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) {
      const s = Z.sightAt(tx * T + 8, ty * T + 8); if (s >= 0.8) continue;
      const X = (tx * T + 8 - X0) * sx, Y = (ty * T + 8 - Y0) * sy;
      /* Pergamentbraun über verborgenen Stellen */
      if (s < 0.5) { l.globalAlpha = (0.5 - s) * 0.22; l.fillStyle = "#3c2418"; l.fillRect(X - T * sx / 2, Y - T * sy / 2, T * sx + 0.5, T * sy + 0.5); }
      /* Tuschkante am Übergang */
      if (s > 0.03 && s < 0.85) {
        const k = 1 - Math.abs(s - 0.42) / 0.45, r = (15 + hash(tx, ty) * 10) * sx * (1 + 0.04 * Math.sin(t * 0.7 + tx));
        const pick = (hash(ty, tx) * 4) | 0;
        if (s < 0.45) { l.globalAlpha = Math.min(1, Math.max(0, 1 - Math.abs(s - 0.2) / 0.2)) * 0.32; l.drawImage(B[4 + pick], X - r * 0.8, Y - r * 0.8, r * 1.6, r * 1.6); }
        else { l.globalAlpha = Math.min(1, Math.max(0, k) * 0.6); l.drawImage(B[pick], X - r, Y - r, r * 2, r * 2); }
      }
    }
    l.restore();
  }
  /* erst nach allen Modulen eintragen, damit die Kante über dem Sichtnebel liegt */
  const reg = () => { if (G.lightOver && !G.lightOver.includes(edge)) G.lightOver.push(edge); };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", reg); else setTimeout(reg, 0);
})();

/* Ezekiel – The Destroyer · Lager und Durchgänge (ab Stufe 1)
   Durchgang: Zwischen Händler und Altar hängt ein großes Wandbild, das das nächste Gebiet zeigt – Himmel in dessen
   Farben, Türme, Gewölbe, Schiffe, Lava oder Spinnennetze, mit Namensschild; ein paar Lichter darin flackern.
   Dazu tanzender Goldstaub im Fackelschein. Lager: Himmelslaternen steigen langsam in den Nachthimmel, und über dem
   Gras schweben ein paar Glühwürmchen. */
(function () {
  "use strict";
  const Z = window.Z, G = Z.gfx, T = Z.TILE, TAU = Math.PI * 2, PI = Math.PI;
  const on = () => { const q = Z.gq; if (!q) return true; if (q.lean) return false; return q.level === -1 ? true : q.level >= 1; };
  const hash = (x, y) => { let h = (x * 374761393 + y * 668265263) ^ 0x5bd1e995; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
  let mural = null, mLv = null;
  function targetBiome(lv) { const to = lv.to, A = Z.ARENAS && Z.ARENAS[to]; return { id: to, B: (Z.BIOMES && (Z.BIOMES[to] || (A && Z.BIOMES[A.base]))) || null, arena: !!A }; }
  function buildMural(lv) {
    const tg = targetBiome(lv), B = tg.B; if (!B) return null;
    const W = 96, H = 64, S = 3, cv = document.createElement("canvas"); cv.width = W * S; cv.height = H * S; const c = cv.getContext("2d"); c.scale(S, S);
    const sky = B.sky || ["#120c1c", "#3a2234", "#5e3442"], g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, sky[0]); g.addColorStop(0.6, sky[1]); g.addColorStop(1, sky[2]); c.fillStyle = g; c.fillRect(0, 0, W, H);
    const dk = "#120a10", bg = B.bg, R = k => hash(k, 77);
    /* Sterne */
    c.fillStyle = "rgba(255,245,230,.7)"; for (let k = 0; k < 16; k++) c.fillRect(R(k) * W, R(k + 40) * H * 0.5, 0.6, 0.6);
    c.fillStyle = dk;
    if (bg === "castle" || bg === "ramparts" || bg === "spires" || bg === "storm") {
      c.fillStyle = "#2a1c26"; c.beginPath(); c.moveTo(0, H); c.quadraticCurveTo(30, 40, 60, 46); c.quadraticCurveTo(80, 50, W, 38); c.lineTo(W, H); c.fill(); c.fillStyle = dk;
      for (const [x, w, h] of [[14, 8, 30], [34, 10, 40], [58, 7, 24], [74, 9, 34]]) { c.fillRect(x, H - h, w, h); for (let k = 0; k < 3; k++) c.fillRect(x - 1 + k * (w / 2.5), H - h - 3, 2, 3); if (bg === "spires") { c.beginPath(); c.moveTo(x - 1, H - h); c.lineTo(x + w / 2, H - h - 14); c.lineTo(x + w + 1, H - h); c.fill(); } }
      c.fillRect(0, H - 10, W, 10);
    } else if (bg === "cellar" || bg === "dungeon" || bg === "passage") {
      c.fillStyle = "#1c1214"; c.fillRect(0, 0, W, H); for (let k = 0; k < 4; k++) { c.fillStyle = "#2c1e1a"; c.beginPath(); c.moveTo(k * 26, H); c.lineTo(k * 26, 26); c.arc(k * 26 + 12, 26, 12, PI, 0); c.lineTo(k * 26 + 24, H); c.fill(); }
      c.fillStyle = dk; if (bg === "dungeon") for (let x = 8; x < W; x += 6) c.fillRect(x, 20, 1.2, 36); else for (let k = 0; k < 5; k++) { c.beginPath(); c.ellipse(10 + k * 18, H - 8, 6, 7, 0, 0, TAU); c.fill(); }
    } else if (bg === "halls") {
      c.fillStyle = "#24141a"; c.fillRect(0, 0, W, H); c.fillStyle = "#3a2024"; for (let x = 6; x < W; x += 22) c.fillRect(x, 10, 6, H - 10); c.fillStyle = "#c89a40"; c.fillRect(40, 8, 16, 1); for (let k = 0; k < 4; k++) c.fillRect(41 + k * 4.5, 5, 1, 3);
    } else if (bg === "harbour") {
      c.fillStyle = "#1a1418"; c.fillRect(0, H - 14, W, 14); c.fillStyle = dk; c.beginPath(); c.moveTo(20, H - 16); c.lineTo(50, H - 16); c.lineTo(46, H - 10); c.lineTo(24, H - 10); c.fill(); c.fillRect(34, H - 40, 1.5, 24); c.beginPath(); c.moveTo(35.5, H - 40); c.lineTo(48, H - 22); c.lineTo(35.5, H - 22); c.fill(); c.fillRect(74, H - 44, 8, 30);
    } else if (bg === "belltower") {
      c.fillStyle = dk; c.fillRect(38, 14, 20, H - 14); c.beginPath(); c.moveTo(34, 14); c.lineTo(48, 0); c.lineTo(62, 14); c.fill(); c.fillStyle = "#8a6a30"; c.beginPath(); c.moveTo(45, 20); c.quadraticCurveTo(44, 28, 40, 32); c.lineTo(56, 32); c.quadraticCurveTo(52, 28, 51, 20); c.fill();
    } else if (bg === "chasm") {
      c.fillStyle = "#140c1a"; c.fillRect(0, 0, W, H); c.fillStyle = dk; for (let k = 0; k < 9; k++) { c.beginPath(); c.moveTo(k * 11, 0); c.lineTo(k * 11 + 5, 10 + R(k) * 16); c.lineTo(k * 11 + 10, 0); c.fill(); }
      c.strokeStyle = "rgba(230,220,240,.4)"; c.lineWidth = 0.4; for (let k = 0; k <= 6; k++) { c.beginPath(); c.moveTo(48, 34); c.lineTo(48 + Math.cos(k / 6 * PI) * 30, 34 - Math.sin(k / 6 * PI) * 22); c.stroke(); }
    } else if (bg === "lake") {
      c.fillStyle = "#0e1a16"; c.fillRect(0, H - 22, W, 22); c.fillStyle = dk; for (const x of [20, 30, 70]) c.fillRect(x, H - 40, 5, 20); c.fillStyle = "rgba(220,240,220,.6)"; c.beginPath(); c.arc(64, 16, 5, 0, TAU); c.fill(); c.fillStyle = "rgba(220,240,220,.25)"; for (let k = 0; k < 5; k++) c.fillRect(60 + R(k) * 6, H - 20 + k * 3, 8 - k, 0.6);
    } else {
      c.fillStyle = "#2a0c06"; c.fillRect(0, H - 18, W, 18); c.fillStyle = dk; for (const [x, h] of [[10, 34], [26, 24], [50, 40], [70, 28], [84, 36]]) c.fillRect(x, H - 18 - h, 8, h); const lg = c.createLinearGradient(0, H - 18, 0, H); lg.addColorStop(0, "rgba(255,110,30,.6)"); lg.addColorStop(1, "rgba(255,60,20,.2)"); c.fillStyle = lg; c.fillRect(0, H - 18, W, 18);
    }
    /* Innenräume: warmer Lichtschein in der Bildmitte (Fackel, Kerzen) */
    if (bg === "cellar" || bg === "dungeon" || bg === "halls" || bg === "chasm" || bg === "passage") { const wg = c.createRadialGradient(W * 0.5, H * 0.55, 2, W * 0.5, H * 0.55, W * 0.5); wg.addColorStop(0, bg === "chasm" ? "rgba(200,140,255,.35)" : "rgba(255,190,110,.4)"); wg.addColorStop(1, "rgba(255,190,110,0)"); c.fillStyle = wg; c.fillRect(0, 0, W, H); c.fillStyle = "#ffd080"; c.fillRect(W * 0.5 - 0.8, H * 0.45, 1.6, 3); }
    /* gemalter Firnis: leichte Vignette und Craquelé */
    const vg = c.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, W * 0.65); vg.addColorStop(0, "rgba(0,0,0,0)"); vg.addColorStop(1, "rgba(30,16,8,.55)"); c.fillStyle = vg; c.fillRect(0, 0, W, H);
    c.strokeStyle = "rgba(255,230,190,.06)"; c.lineWidth = 0.3; for (let k = 0; k < 14; k++) { c.beginPath(); c.moveTo(R(k + 90) * W, R(k + 120) * H); c.lineTo(R(k + 90) * W + (R(k) - 0.5) * 10, R(k + 120) * H + (R(k + 5) - 0.5) * 8); c.stroke(); }
    const lights = []; for (let k = 0; k < 6; k++) lights.push([6 + R(k + 200) * (W - 12), H * (0.45 + R(k + 220) * 0.45)]);
    return { cv, W, H, name: Z.areaName ? Z.areaName(tg.id) : tg.id, lights, warm: bg === "embercity" || bg === "forge" };
  }
  const mid0 = Z.drawMidLife;
  Z.drawMidLife = function (c, cam, t) {
    if (mid0) mid0.apply(this, arguments);
    const lv = Z.level; if (!lv || !on()) return;
    if (lv.passage) {
      if (mLv !== lv) { mLv = lv; mural = null; try { mural = buildMural(lv); } catch (e) { console.error(e); } }
      if (mural) {
        const m = mural, x = 21.6 * T, y = 3 * T + 2, w = m.W, h = m.H;
        if (x + w > cam.x - 20 && x < cam.x + cam.w + 20) {
          c.save();
          c.fillStyle = "rgba(0,0,0,.45)"; c.fillRect(x + 3, y + 3, w + 6, h + 6);
          c.fillStyle = "#6a4a1a"; c.fillRect(x - 4, y - 4, w + 8, h + 8); c.fillStyle = "#c8963c"; c.fillRect(x - 4, y - 4, w + 8, 1); c.fillRect(x - 4, y - 4, 1, h + 8); c.fillStyle = "#3a2410"; c.fillRect(x - 4, y + h + 3, w + 8, 1); c.fillRect(x + w + 3, y - 4, 1, h + 8);
          c.fillStyle = "#e0b050"; for (const [cx, cy] of [[x - 2, y - 2], [x + w + 2, y - 2], [x - 2, y + h + 2], [x + w + 2, y + h + 2]]) { c.beginPath(); c.arc(cx, cy, 2.2, 0, TAU); c.fill(); }
          c.drawImage(m.cv, x, y, w, h);
          c.globalCompositeOperation = "lighter";
          for (let k = 0; k < m.lights.length; k++) { const [lx, ly] = m.lights[k], f = 0.5 + 0.5 * Math.sin(t * (2 + k) + k * 3); c.globalAlpha = 0.5 * f; c.fillStyle = m.warm ? "#ff9a40" : "#ffd890"; c.fillRect(x + lx - 0.6, y + ly - 0.6, 1.2, 1.2); }
          c.globalCompositeOperation = "source-over"; c.globalAlpha = 1;
          /* Namensschild */
          const px = x + w / 2, py = y + h + 10; c.fillStyle = "#4a3418"; c.fillRect(px - 26, py - 5, 52, 10); c.fillStyle = "#c8963c"; c.fillRect(px - 26, py - 5, 52, 0.8);
          c.font = "600 6px 'Alegreya Sans',serif"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillStyle = "#f0dca8"; c.fillText(m.name, px, py + 0.5);
          c.restore();
        }
      }
      /* Goldstaub im Fackelschein */
      if (Math.random() < 0.25 * ((Z.gq && Z.gq.part) || 1)) Z.fx.p({ x: cam.x + Math.random() * cam.w, y: cam.y + cam.h * (0.3 + Math.random() * 0.5), vx: (Math.random() - 0.5) * 4, vy: -2 - Math.random() * 3, g: 0, life: 4, size: 1.1, col: "#ffd890", kind: "glow", add: true, a: 0.5 });
    }
  };
  /* Lager: Himmelslaternen und Glühwürmchen */
  const lan = []; let lanT = 0, lanLv = null;
  const back0 = Z.drawBackLife;
  Z.drawBackLife = function (c, cam, t, B, oy, LH) {
    if (back0) back0.apply(this, arguments);
    const lv = Z.level; if (!lv || !lv.hub || !on()) return;
    if (lanLv !== lv) { lanLv = lv; lan.length = 0; lanT = 0; }
    const dt = Math.min(0.05, Math.max(0, t - lanT)); lanT = t;
    if (lan.length < 7 && Math.random() < dt * 0.35) lan.push({ x: cam.x + Math.random() * cam.w, y: cam.y + cam.h * 0.9, ph: Math.random() * 9, s: 0.7 + Math.random() * 0.6, v: 4 + Math.random() * 4 });
    c.save();
    for (let i = lan.length - 1; i >= 0; i--) {
      const l = lan[i]; l.y -= l.v * dt; l.x += Math.sin(t * 0.4 + l.ph) * 2 * dt + (Z.windX || 0) * 0.02 * dt;
      const a = Math.min(1, (cam.y + cam.h * 0.9 - l.y) / 30) * Math.min(1, (l.y - cam.y + 20) / 60); if (a <= 0 && l.y < cam.y) { lan.splice(i, 1); continue; }
      const f = 0.8 + 0.2 * Math.sin(t * 5 + l.ph), w = 3 * l.s, h = 4 * l.s;
      c.globalCompositeOperation = "lighter"; c.globalAlpha = a * 0.5 * f; c.drawImage(Z.glowSprite("rgba(255,170,80,1)"), l.x - 9 * l.s, l.y - 9 * l.s, 18 * l.s, 18 * l.s);
      c.globalCompositeOperation = "source-over"; c.globalAlpha = a; c.fillStyle = "#e8904a"; c.beginPath(); c.moveTo(l.x - w / 2, l.y - h / 2); c.lineTo(l.x + w / 2, l.y - h / 2); c.lineTo(l.x + w * 0.4, l.y + h / 2); c.lineTo(l.x - w * 0.4, l.y + h / 2); c.fill(); c.fillStyle = "#ffe0a0"; c.fillRect(l.x - w * 0.2, l.y, w * 0.4, h * 0.4);
    }
    c.restore();
  };
  const al0 = Z.drawAfterLight;
  Z.drawAfterLight = function (c, cam, W, H, t) {
    if (al0) al0.apply(this, arguments);
    const lv = Z.level; if (!lv || !lv.hub || !on()) return;
    c.save(); c.globalCompositeOperation = "lighter";
    const gy = (lv.H - 3) * T;
    for (let i = 0; i < 9; i++) { const x = cam.x + ((hash(i, 3) * cam.w * 1.5 + t * (4 + i)) % (cam.w + 40)) - 20, y = Math.min(gy - 6, cam.y + cam.h * (0.55 + hash(i, 5) * 0.35)) + Math.sin(t * 1.3 + i) * 6, b = Math.max(0, Math.sin(t * 2 + i * 1.7)); c.globalAlpha = 0.5 * b; c.drawImage(Z.glowSprite("rgba(214,255,110,1)"), x - 5, y - 5, 10, 10); c.globalAlpha = b; c.fillStyle = "#f4ffc0"; c.fillRect(x - 0.4, y - 0.4, 0.8, 0.8); }
    c.restore();
  };
})();

/* Ezekiel – The Destroyer · Belebte Raumstücke (Grafik-Runde 7)
   Die Schaustücke der Räume (pracht.js, Steinmetz-Abschnitt) bekommen Leben: Küchen- und Kaminfeuer flackern mit
   Funken und werfen warmes Licht, Glasfenster legen farbige Lichtflecken in den Raum und Staub tanzt im Strahl,
   Altarkerzen brennen, frisch gegossene Barren glühen nach, Runensteine, Kristalle und Riesenpilze atmen Licht,
   Kupfertöpfe blitzen auf. Licht ab Stufe 1, Bewegung ab Stufe 2; Stufe 0 / Handheld unverändert. Kein Blau. */
(function () {
  "use strict";
  const Z = window.Z, G = Z.gfx, T = Z.TILE, TAU = Math.PI * 2;
  const lvl = () => { const q = Z.gq; if (!q) return 2; if (q.lean) return 0; return q.level === -1 ? 2 : q.level; };
  const off = () => G.off && (G.off.steinmetz || G.off.belebt);
  const hash = (x, y) => { let h = (x * 374761393 + y * 668265263) ^ 0x5bd1e995; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
  const LIVE = { kamin: 1, glasfenster: 1, altarbild: 1, gussform: 1, runenstein: 1, kristall: 1, riesenpilze: 1, kupfer: 1, chimney: 1 };
  const vis = (p, cam, m) => { const x = p.x * T, y = p.y * T; return x + p.w * T > cam.x - m && x < cam.x + cam.w + m && y + p.h * T > cam.y - m && y < cam.y + cam.h + m; };
  const fl = (t, ph) => 0.82 + 0.12 * Math.sin(t * 8.3 + ph) + 0.06 * Math.sin(t * 21 + ph * 3);
  if (G.lightGather) G.lightGather.push(function (add, cam, t) {
    if (lvl() < 1 || !Z.level || Z.darkness > 0 || off()) return;
    for (const p of Z.raumStuecke()) {
      if (!LIVE[p.kind] || !vis(p, cam, 140)) continue;
      const x = p.x * T, y = p.y * T, w = p.w * T, h = p.h * T, ph = hash(p.x, p.y) * 9;
      switch (p.kind) {
        case "kamin": add(x + w / 2, y + h - 6, 150, "#ff9a48", 0.62 * fl(t, ph), 12); break;
        case "glasfenster": { const b = y + h - 9; add(x + w / 2, y + h * 0.45, 70, "#ffc070", 0.32, 0); add(x + w / 2 + 10, b + 34, 54, "#ff7050", 0.22, 0); add(x + w / 2 + 24, b + 44, 50, "#e0b040", 0.2, 0); add(x + w / 2 + 16, b + 54, 42, "#c070d0", 0.16, 0); break; }
        case "altarbild": add(x + w / 2, y + h - 10, 80, "#ffd890", 0.4 * fl(t, ph), 6); break;
        case "gussform": add(x + w - 26, y + h - 17, 70, "#ff8a40", 0.4 + 0.08 * Math.sin(t * 1.3 + ph), 4); break;
        case "chimney": add(x + w / 2, y + h - 5, 90, "#ff7a30", 0.45 * fl(t, ph), 8); break;
        case "runenstein": add(x + w / 2, y + h * 0.45, 80, "#c890ff", 0.28 + 0.12 * Math.sin(t * 1.1 + ph), 0); break;
        case "kristall": add(x + w / 2, y + h * 0.5, 80, "#d090ff", 0.3 + 0.08 * Math.sin(t * 0.8 + ph), 0); break;
        case "riesenpilze": add(x + w / 2, y + h * 0.45, 80, ((p.x + p.y) & 1) ? "#e890b8" : "#a8e890", 0.28 + 0.1 * Math.sin(t * 0.9 + ph), 0); break;
      }
    }
  });
  function flame(c, x, y, s, t, ph) {
    const k = 1 + 0.18 * Math.sin(t * 13 + ph) + 0.1 * Math.sin(t * 29 + ph * 2), hh = 7 * s * k, sw = Math.sin(t * 6 + ph) * s;
    c.fillStyle = "rgba(255,120,40,.85)"; c.beginPath(); c.moveTo(x - 2.6 * s, y); c.quadraticCurveTo(x - 2.8 * s, y - hh * 0.5, x + sw, y - hh); c.quadraticCurveTo(x + 2.8 * s, y - hh * 0.5, x + 2.6 * s, y); c.fill();
    c.fillStyle = "rgba(255,214,120,.9)"; c.beginPath(); c.moveTo(x - 1.3 * s, y); c.quadraticCurveTo(x - 1.4 * s, y - hh * 0.35, x + sw * 0.6, y - hh * 0.62); c.quadraticCurveTo(x + 1.4 * s, y - hh * 0.35, x + 1.3 * s, y); c.fill();
  }
  const mid0 = Z.drawMidLife;
  Z.drawMidLife = function (c, cam, t) {
    if (mid0) mid0.apply(this, arguments);
    if (lvl() < 2 || !Z.level || off()) return;
    const list = Z.raumStuecke(); if (!list.length) return;
    c.save();
    for (const p of list) {
      if (!LIVE[p.kind] || !vis(p, cam, 30)) continue;
      const x = p.x * T, y = p.y * T, w = p.w * T, h = p.h * T, ph = hash(p.x, p.y) * 9, bot = y + h;
      switch (p.kind) {
        case "kamin": case "chimney": {
          const cx = x + w / 2; c.globalCompositeOperation = "lighter";
          for (let k = 0; k < 4; k++) flame(c, cx - 6 + k * 4, bot - 2.5, p.kind === "kamin" ? 0.9 + (k % 2) * 0.35 : 0.7, t, ph + k * 1.9);
          /* Funken steigen in den Abzug */
          c.fillStyle = "rgba(255,190,100,.9)";
          for (let k = 0; k < 5; k++) { const u = (t * (0.5 + hash(k, p.x) * 0.4) + hash(p.y, k)) % 1, sx = cx + (hash(k, p.y) - 0.5) * 12 + Math.sin(t * 3 + k) * 2, sy = bot - 6 - u * (p.kind === "kamin" ? 34 : 26); c.globalAlpha = (1 - u) * 0.9; c.fillRect(sx, sy, 0.9, 0.9); }
          c.globalAlpha = 1; c.globalCompositeOperation = "source-over"; break;
        }
        case "glasfenster": {
          /* Staub tanzt im farbigen Lichtstrahl */
          const fx = x + 8, fw = w - 16, b = y + h - 9; c.globalCompositeOperation = "lighter";
          for (let k = 0; k < 9; k++) { const u = (t * 0.03 * (1 + hash(k, 3)) + hash(k, p.x)) % 1, v = hash(p.y, k), sx = fx + v * fw + u * 18 + Math.sin(t * 0.7 + k) * 2, sy = b + 6 + u * 34; c.globalAlpha = 0.5 * Math.sin(u * Math.PI); c.fillStyle = k % 3 ? "#ffe0b0" : "#ffb090"; c.fillRect(sx, sy, 0.8, 0.8); }
          c.globalAlpha = 1; c.globalCompositeOperation = "source-over"; break;
        }
        case "altarbild": { c.globalCompositeOperation = "lighter"; for (const kx of [x + 7, x + w - 7]) flame(c, kx, bot - 10.5, 0.35, t, ph + kx); c.globalCompositeOperation = "source-over"; break; }
        case "runenstein": { /* ein Runenzeichen leuchtet auf, wandert langsam nach unten */ const k = Math.floor(t * 0.5 + ph) % 5, a = Math.sin(((t * 0.5 + ph) % 1) * Math.PI); c.globalCompositeOperation = "lighter"; c.globalAlpha = 0.5 * a; c.fillStyle = "#e8c8ff"; c.fillRect(x + w / 2 - 4, y + 14 + k * 9 - 4, 8, 9); c.globalAlpha = 1; c.globalCompositeOperation = "source-over"; break; }
        case "kupfer": { /* ab und zu blitzt ein Topf im Licht */ const u = (t * 0.25 + ph) % 1; if (u < 0.08) { const k = Math.floor(t * 0.25 + ph) % 5, sx = x + 8 + k * (w - 16) / 4 - 2, sy = y + 18 + (k % 2) * 3, a = Math.sin(u / 0.08 * Math.PI); c.globalCompositeOperation = "lighter"; c.strokeStyle = "rgba(255,230,180," + (0.9 * a).toFixed(2) + ")"; c.lineWidth = 0.6; c.beginPath(); c.moveTo(sx - 3 * a, sy); c.lineTo(sx + 3 * a, sy); c.moveTo(sx, sy - 3 * a); c.lineTo(sx, sy + 3 * a); c.stroke(); c.globalCompositeOperation = "source-over"; } break; }
        case "gussform": { /* Hitzeflimmern über dem Barren */ const mx = x + w - 26, tb = bot - 14; c.strokeStyle = "rgba(255,200,150,.12)"; c.lineWidth = 0.6; for (let k = 0; k < 3; k++) { c.beginPath(); for (let j = 0; j <= 6; j++) { const yy = tb - 4 - j * 3, xx = mx - 4 + k * 4 + Math.sin(t * 4 + j + k) * 1.2; j ? c.lineTo(xx, yy) : c.moveTo(xx, yy); } c.stroke(); } break; }
      }
    }
    c.restore();
  };
})();

/* Ezekiel – The Destroyer · Raumlicht (Grafik-Runde 8, ab Stufe 1)
   Dunkle Räume bekommen Licht, das zu ihnen passt und eine sichtbare Quelle hat: Wandfackeln im Zellenblock und in
   der Wärterstube, ein Kohlebecken mit glühenden Eisen in der Folterkammer, Kerzengruppen im Gebeinhaus, Laternen in
   Kellern und Lagern, Leuchtpilze in Brut- und Beutekammern, Glutrisse auf Schlackehalden. Dazu ein sanfter Schein
   an den Schlüsselstücken der Räume (ausstattung.js, Feld key), damit Kessel, Regal oder Käfig im Dunkel lesbar bleiben.
   Stufe 0 / Handheld unverändert. Kein Blau. */
(function () {
  "use strict";
  const Z = window.Z, G = Z.gfx, T = Z.TILE, TAU = Math.PI * 2;
  const lvl = () => { const q = Z.gq; if (!q) return 2; if (q.lean) return 0; return q.level === -1 ? 2 : q.level; };
  const off = () => G.off && (G.off.raumlicht || G.off.inseln);
  const hash = (x, y) => { let h = (x * 374761393 + y * 668265263) ^ 0x5bd1e995; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
  const RL = {
    zellenblock: ["fackel", "fackel"], folterkammer: ["kohlebecken", "fackel"], waerterstube: ["fackel"], gebeinhaus: ["kerzen", "kerzen"],
    weinkeller: ["laterne"], vorratskammer: ["laterne"], brunnenkammer: ["kerzen"], lagerhaus: ["laterne"], bootsschuppen: ["laterne"], seilkammer: ["laterne"],
    erzlager: ["laterne"], brutkammer: ["pilz", "pilz"], beutelager: ["pilz"], schlackehalde: ["glut"], kaserne: ["fackel"], geheim: ["kerzen"], grube: ["fackel"]
  };
  const COL = { fackel: "#ffa850", kohlebecken: "#ff7a30", kerzen: "#ffd890", laterne: "#ffc070", pilz: "#a8e890", glut: "#ff7a30" };
  const KEYCOL = { kessel: "#ff9a48", esse: "#ff8a40", schmelztiegel: "#ff8a40", kristall: "#d090ff", pilzring: "#a8e890", runensteine: "#c890ff", eiersack: "#e0d0c0", goetze: "#c8e0a0", opferschale: "#ffb060", greenfire: "#a8e060" };
  let L = null, Llv = null, Lp = null;
  function list() {
    const lv = Z.level; if (!lv || !lv.roomFns || lv.hub || lv.arena) return [];
    const pr = Z.ausstattung ? Z.ausstattung() : null;
    if (L && Llv === lv && Lp === pr) return L; Llv = lv; Lp = pr; L = [];
    const solid = v => v === 1 || v === 7, stand = v => v === 1 || v === 7 || v === 2 || v === 8, sky = G.sky;
    const src = (lv.lights || []).map(d => [d.x, d.y]).concat((Z.lichtinseln ? Z.lichtinseln() : []).map(l => [l.x, l.y]));
    const near = (x, y, r) => src.some(([a, b]) => Math.abs(a - x) <= r && Math.abs(b - y) <= r * 0.8);
    const free = (x, y) => lv.get(x, y) === 0 && !(sky && sky[y * lv.W + x]) && !(G.isOpen && G.isOpen(x, y));
    const busy = (x, y) => (pr || []).some(p => Math.abs(p.x - x) < 1.6 && Math.abs(p.y - y) < 2.5) || (lv.doors || []).some(d => Math.abs(d.x - x) < 3 && Math.abs(d.y - y) < 3);
    for (const k in lv.roomFns) {
      const kinds = RL[lv.roomFns[k]]; if (!kinds) continue;
      const [cx, cy] = k.split(",").map(Number), rx = cx * Z.CW, ry = cy * Z.CH;
      kinds.forEach((kind, i) => {
        const tx = rx + Math.round(Z.CW * (i + 1) / (kinds.length + 1));
        for (let d = 0; d < Z.CW / 2; d++) for (const sx of [tx + d, tx - d]) {
          if (sx <= rx || sx >= rx + Z.CW - 1) continue;
          for (let y = ry + Z.CH - 1; y > ry + 1; y--) {
            if (!stand(lv.get(sx, y + 1)) || !free(sx, y) || !free(sx, y - 1)) continue;
            const wall = kind === "fackel" || kind === "laterne", ly = wall ? y - 1 : y;
            if (near(sx, ly, 5) || busy(sx, y)) continue;
            L.push({ x: sx, y: ly, k: kind, wall, ph: hash(sx, y) * 9 }); src.push([sx, ly]); return;
          }
        }
      });
    }
    return L;
  }
  const pos = l => ({ x: l.x * T + 8, y: l.wall ? l.y * T + 4 : (l.y + 1) * T });
  if (G.lightGather) G.lightGather.push(function (add, cam, t) {
    if (lvl() < 1 || !Z.level || Z.darkness > 0 || off()) return;
    for (const l of list()) { const p = pos(l); if (p.x < cam.x - 140 || p.x > cam.x + cam.w + 140 || p.y < cam.y - 120 || p.y > cam.y + cam.h + 120) continue;
      const f = l.k === "pilz" ? 0.9 + 0.1 * Math.sin(t * 0.9 + l.ph) : 0.86 + 0.1 * Math.sin(t * 8 + l.ph) + 0.04 * Math.sin(t * 21 + l.ph);
      add(p.x, p.y - (l.wall ? 4 : 8), l.k === "kohlebecken" ? 150 : l.k === "kerzen" ? 95 : l.k === "pilz" ? 90 : 125, COL[l.k], (l.k === "kerzen" ? 0.5 : l.k === "pilz" ? 0.45 : 0.62) * f, l.k === "pilz" ? 4 : 10); }
    /* Schein an den Schlüsselstücken */
    for (const p of (Z.ausstattung ? Z.ausstattung() : [])) {
      if (!p.key || p.broken || p.gone) continue; const X = p.x * T + 8, Y = (p.y + 1) * T - 14;
      if (X < cam.x - 80 || X > cam.x + cam.w + 80 || Y < cam.y - 80 || Y > cam.y + cam.h + 80) continue;
      add(X, Y, 70, KEYCOL[p.kind] || "#ffe0b8", KEYCOL[p.kind] ? 0.34 : 0.2, 0);
    }
  });
  function flame(c, x, y, s, t, ph) {
    const k = 1 + 0.2 * Math.sin(t * 13 + ph) + 0.1 * Math.sin(t * 29 + ph * 2), hh = 7 * s * k, sw = Math.sin(t * 6 + ph) * s;
    c.fillStyle = "rgba(255,120,40,.9)"; c.beginPath(); c.moveTo(x - 2.4 * s, y); c.quadraticCurveTo(x - 2.6 * s, y - hh * 0.5, x + sw, y - hh); c.quadraticCurveTo(x + 2.6 * s, y - hh * 0.5, x + 2.4 * s, y); c.fill();
    c.fillStyle = "rgba(255,220,130,.95)"; c.beginPath(); c.moveTo(x - 1.2 * s, y); c.quadraticCurveTo(x - 1.3 * s, y - hh * 0.35, x + sw * 0.6, y - hh * 0.6); c.quadraticCurveTo(x + 1.3 * s, y - hh * 0.35, x + 1.2 * s, y); c.fill();
  }
  function draw(c, l, t) {
    const p = pos(l), x = p.x, y = p.y;
    switch (l.k) {
      case "fackel": {
        c.fillStyle = "#2a2420"; c.fillRect(x - 2.5, y - 1, 5, 3); c.fillRect(x - 0.7, y - 4, 1.4, 4); c.fillStyle = "#4a4440"; c.fillRect(x - 2.5, y - 1, 5, 0.7);
        c.fillStyle = "#4a2e1a"; c.save(); c.translate(x, y - 3); c.rotate(-0.15); c.fillRect(-1, -9, 2, 10); c.fillStyle = "#2a1a10"; c.fillRect(-1.6, -11, 3.2, 3); c.restore();
        c.globalCompositeOperation = "lighter"; flame(c, x - 1.4, y - 13.5, 1, t, l.ph); c.globalCompositeOperation = "source-over";
        if (lvl() >= 2) { c.fillStyle = "rgba(255,190,100,.85)"; for (let k = 0; k < 3; k++) { const u = (t * 0.8 + k / 3 + l.ph) % 1; c.globalAlpha = 1 - u; c.fillRect(x - 1.4 + Math.sin(t * 4 + k) * 2, y - 16 - u * 14, 0.8, 0.8); } c.globalAlpha = 1; }
        break;
      }
      case "kohlebecken": {
        c.fillStyle = "rgba(0,0,0,.35)"; c.beginPath(); c.ellipse(x, y, 8, 1.3, 0, 0, TAU); c.fill();
        c.strokeStyle = "#2a2422"; c.lineWidth = 1.1; c.beginPath(); c.moveTo(x - 6, y); c.lineTo(x - 3, y - 8); c.moveTo(x + 6, y); c.lineTo(x + 3, y - 8); c.moveTo(x, y); c.lineTo(x, y - 8); c.stroke();
        c.fillStyle = "#3a3230"; c.beginPath(); c.moveTo(x - 7, y - 11); c.lineTo(x + 7, y - 11); c.lineTo(x + 4.5, y - 7); c.lineTo(x - 4.5, y - 7); c.fill(); c.fillStyle = "#5a524a"; c.fillRect(x - 7, y - 11.4, 14, 0.8);
        c.globalCompositeOperation = "lighter"; const g = 0.75 + 0.25 * Math.sin(t * 3 + l.ph); c.fillStyle = "rgba(255," + (90 + g * 70 | 0) + ",30,.95)"; for (let k = 0; k < 6; k++) { c.beginPath(); c.arc(x - 5 + k * 2, y - 11.6 + (k % 2) * 0.5, 1.3, 0, TAU); c.fill(); }
        flame(c, x - 2, y - 11.5, 0.6, t, l.ph); flame(c, x + 2.5, y - 11.5, 0.5, t, l.ph + 2); c.globalCompositeOperation = "source-over";
        /* Brandeisen stecken in der Glut, die Spitzen glühen */
        for (const [dx, a] of [[-3, -0.5], [3, 0.45]]) { c.strokeStyle = "#2a2422"; c.lineWidth = 0.8; c.beginPath(); c.moveTo(x + dx, y - 11); c.lineTo(x + dx + Math.sin(a) * 12, y - 11 - Math.cos(a) * 12); c.stroke(); c.fillStyle = "rgba(255,140,60," + (0.6 + 0.3 * g).toFixed(2) + ")"; c.fillRect(x + dx - 0.6, y - 12, 1.2, 1.6); }
        if (lvl() >= 2) { c.fillStyle = "rgba(255,200,110,.9)"; for (let k = 0; k < 5; k++) { const u = (t * 0.6 + k / 5 + l.ph) % 1; c.globalAlpha = 1 - u; c.fillRect(x - 4 + hash(k, l.x) * 8 + Math.sin(t * 3 + k) * 2, y - 13 - u * 22, 0.9, 0.9); } c.globalAlpha = 1; }
        break;
      }
      case "kerzen": {
        c.fillStyle = "rgba(240,230,210,.75)"; c.beginPath(); c.ellipse(x, y - 0.5, 6, 1.2, 0, 0, TAU); c.fill();
        const hs = [6, 9, 4.5, 7]; for (let k = 0; k < 4; k++) { const kx = x - 4.5 + k * 3, h = hs[(k + (l.ph | 0)) % 4]; c.fillStyle = "#e8dcc0"; c.fillRect(kx - 0.8, y - h, 1.6, h); c.fillStyle = "rgba(255,250,240,.5)"; c.fillRect(kx - 0.8, y - h, 0.5, h); c.globalCompositeOperation = "lighter"; flame(c, kx, y - h - 0.2, 0.32, t, l.ph + k); c.globalCompositeOperation = "source-over"; }
        break;
      }
      case "laterne": {
        c.fillStyle = "#2a2420"; c.fillRect(x - 0.6, y - 8, 1.2, 3); c.fillRect(x - 0.6, y - 8, 6, 1.1);
        const lx = x + 5; c.fillStyle = "#3a3028"; c.fillRect(lx - 2.6, y - 5.6, 5.2, 1.2); c.fillRect(lx - 2.6, y + 2.6, 5.2, 1.2);
        c.fillStyle = "#ffcf7a"; c.globalAlpha = 0.9; c.fillRect(lx - 2, y - 4.4, 4, 7); c.globalAlpha = 1; const f = 0.85 + 0.15 * Math.sin(t * 9 + l.ph);
        c.fillStyle = "#fff0c0"; c.fillRect(lx - 0.6, y - 2 + (1 - f), 1.2, 2.4 * f); c.fillStyle = "#2a2420"; c.fillRect(lx - 2.6, y - 4.4, 0.7, 7); c.fillRect(lx + 1.9, y - 4.4, 0.7, 7); break;
      }
      case "pilz": {
        for (let k = 0; k < 3; k++) { const mx = x - 4 + k * 4, h = 4 + ((k * 7 + l.x) % 4), r = 2 + (k % 2); c.fillStyle = "#c8c0a8"; c.fillRect(mx - 0.5, y - h, 1, h); c.fillStyle = "#4a7a3a"; c.beginPath(); c.ellipse(mx, y - h, r, r * 0.6, 0, Math.PI, 0); c.fill(); c.globalCompositeOperation = "lighter"; c.fillStyle = "rgba(168,232,144," + (0.5 + 0.2 * Math.sin(t * 0.9 + l.ph + k)).toFixed(2) + ")"; c.fillRect(mx - r * 0.8, y - h - 0.2, r * 1.6, 0.8); c.globalCompositeOperation = "source-over"; }
        break;
      }
      case "glut": {
        c.globalCompositeOperation = "lighter"; const g = 0.6 + 0.4 * Math.sin(t * 1.5 + l.ph); c.strokeStyle = "rgba(255,120,40," + g.toFixed(2) + ")"; c.lineWidth = 1; c.beginPath(); c.moveTo(x - 8, y - 0.5); c.lineTo(x - 3, y - 1.4); c.lineTo(x + 1, y - 0.6); c.lineTo(x + 6, y - 1.6); c.stroke(); c.globalCompositeOperation = "source-over"; break;
      }
    }
  }
  const mid0 = Z.drawMidLife;
  Z.drawMidLife = function (c, cam, t) {
    if (mid0) mid0.apply(this, arguments);
    if (lvl() < 1 || !Z.level || off()) return;
    c.save();
    for (const l of list()) { const p = pos(l); if (p.x < cam.x - 30 || p.x > cam.x + cam.w + 30 || p.y < cam.y - 40 || p.y > cam.y + cam.h + 40) continue; draw(c, l, t); }
    c.restore();
  };
  Z.raumlichter = () => list();
})();

/* Ezekiel – The Destroyer · Randlicht auf Figuren (Grafik-Runde 8, ab Stufe 2; Runde 9 günstiger)
   Ezekiel und die nächsten Gegner bekommen an der Seite, die einer starken Lichtquelle zugewandt ist, eine feine
   Lichtkante in deren Farbe (Fackel orange, Kristall violett, Mond silbrig …). Technik: die Figur wird zusätzlich in
   eine kleine Maske (halbe Auflösung) gezeichnet, eingefärbt und um ein Stück vom Licht weg verschoben wieder
   ausgestanzt – übrig bleibt der beleuchtete Rand, der nach dem Lichtdurchgang additiv aufgelegt wird. Lichter aus dem
   letzten Bild (G.lightQ). Die Maske wird nur jedes zweite Bild neu gezeichnet (dazwischen mit der Figur verschoben).
   Stufe 2: Ezekiel + 1 nächster Gegner, Stufe 3: + 3. Bosse ausgenommen. Stufe 0/1 und Handheld unverändert. */
(function () {
  "use strict";
  const Z = window.Z, G = Z.gfx;
  const lvl = () => { const q = Z.gq; if (q && q.lean) return 0; if (G.off && G.off.rim) return 0; return G.lq ? G.lq() : 2; };
  const CACHE = new WeakMap(), pend = []; let frame = -1, depth = 0, pick = null;
  function best(cx, cy) {
    if (!G.lightQ) return null; const Q = G.lightQ(), n = G.lightQn(); let b = null, bs = 0.06, bd = 0, bdx = 0, bdy = 0;
    for (let i = 0; i < n; i++) { const q = Q[i], dx = q.x - cx, dy = q.y - cy, d = Math.sqrt(dx * dx + dy * dy); const reach = q.r * 1.5; if (d < 18 || d > reach) continue; const s = q.a * (1 - d / reach); if (s > bs) { bs = s; b = q; bd = d; bdx = dx; bdy = dy; } }
    return b ? { c: b.c, d: bd, dx: bdx, dy: bdy, s: bs } : null;
  }
  function newFrame() {
    if (frame === G.frame) return; frame = G.frame; pend.length = 0;
    /* die nächsten Gegner um Ezekiel (Stufe 2: einer, Stufe 3: drei) */
    const P = Z.player, n = lvl() >= 3 ? 3 : 1; pick = new Set();
    if (!P) return;
    const arr = []; for (const e of Z.enemies || []) { if (e.dead || (e.def && e.def.boss) || e.disguise) continue; const d = Math.abs(e.x - P.x) + Math.abs(e.y - P.y); if (d < 420) arr.push([d, e]); }
    arr.sort((a, b) => a[0] - b[0]); for (let i = 0; i < Math.min(n, arr.length); i++) pick.add(arr[i][1]);
  }
  function rimMask(orig, c, ent, time, x0, y0, w, h) {
    const m = c.getTransform(); if (Math.abs(m.b) > 1e-6 || Math.abs(m.c) > 1e-6) return null;
    let E = CACHE.get(ent);
    /* jedes zweite Bild: alte Maske mit der Figur mitschieben, nicht neu zeichnen */
    if (E && E.ok && G.frame - E.f === 1 && Math.abs(E.s - m.a) < 1e-6) { E.sx = Math.floor(m.a * x0 + m.e); E.sy = Math.floor(m.d * y0 + m.f); return E; }
    const L = best(x0 + w / 2, y0 + h / 2);
    if (!E) { E = { mc: document.createElement("canvas") }; CACHE.set(ent, E); }
    E.f = G.frame; E.ok = false; E.s = m.a; if (!L) return null;
    const RQ = 0.5, s = m.a * RQ, sx = Math.floor(m.a * x0 + m.e), sy = Math.floor(m.d * y0 + m.f), W = Math.ceil(w * s) + 2, H = Math.ceil(h * m.d * RQ) + 2;
    if (W < 4 || H < 4 || W > 600 || H > 600) return null;
    const mc = E.mc, mx = mc.getContext("2d");
    if (mc.width < W || mc.height < H) { mc.width = Math.max(mc.width, W); mc.height = Math.max(mc.height, H); }
    mx.setTransform(1, 0, 0, 1, 0, 0); mx.globalCompositeOperation = "source-over"; mx.globalAlpha = 1; mx.clearRect(0, 0, mc.width, mc.height);
    mx.save(); mx.beginPath(); mx.rect(0, 0, W, H); mx.clip(); mx.setTransform(m.a * RQ, 0, 0, m.d * RQ, (m.e - sx) * RQ, (m.f - sy) * RQ);
    try { orig.call(Z, mx, ent, time); } catch (e) { mx.restore(); return null; }
    mx.restore(); mx.setTransform(1, 0, 0, 1, 0, 0);
    const k = L.c, col = "rgb(" + Math.min(255, k[0] * 0.7 + 90 | 0) + "," + Math.min(255, k[1] * 0.7 + 80 | 0) + "," + Math.min(255, k[2] * 0.7 + 60 | 0) + ")";
    mx.globalCompositeOperation = "source-in"; mx.fillStyle = col; mx.fillRect(0, 0, W, H);
    const off = 1.4 * s, ox = -L.dx / L.d * off, oy = -L.dy / L.d * off * 0.8;
    mx.globalCompositeOperation = "destination-out"; mx.drawImage(mc, 0, 0, W, H, ox, oy, W, H);
    mx.globalCompositeOperation = "source-over";
    Object.assign(E, { ok: true, sx, sy, W, H, q: RQ, a: Math.min(0.8, 0.35 + L.s * 1.8) }); return E;
  }
  function reg() {
    const dE = Z.drawEnemy, dP = Z.drawPlayer; if (!dE || !dP || dE._rim) return;
    const aft0 = Z.drawAfterLight;
    Z.drawAfterLight = function (c, cam, W, H, t) {
      if (aft0) aft0.apply(this, arguments);
      if (!pend.length || frame !== G.frame) return;
      c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.globalCompositeOperation = "lighter";
      for (const r of pend) { c.globalAlpha = r.a; c.drawImage(r.mc, 0, 0, r.W, r.H, r.sx, r.sy, r.W / r.q, r.H / r.q); }
      c.restore(); G._rimN = pend.length; pend.length = 0;
    };
    Z.drawEnemy = function (c, e, time) {
      if (depth || lvl() < 2 || !e || e.dead) return dE.apply(this, arguments);
      newFrame(); if (!pick || !pick.has(e)) return dE.apply(this, arguments);
      let m = null; depth++;
      try {
        try { m = rimMask(dE, c, e, time, e.x - 14, e.y - 6, e.w + 28, e.h + 10); } catch (err) { m = null; }
        const r = dE.apply(this, arguments); if (m) pend.push(m); return r;
      } finally { depth--; }
    };
    Z.drawEnemy._rim = true;
    Z.drawPlayer = function (c, P, time) {
      if (depth || lvl() < 2 || !P || P.dead || P.invis > 0) return dP.apply(this, arguments);
      newFrame(); let m = null; depth++;
      try {
        try { m = rimMask(dP, c, P, time, P.x - 16, P.y - 10, P.w + 32, P.h + 14); } catch (err) { m = null; }
        const r = dP.apply(this, arguments); if (m) pend.push(m); return r;
      } finally { depth--; }
    };
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", reg); else setTimeout(reg, 0);
})();

/* Ezekiel – The Destroyer · Arena-Kulissen II (Grafik-Runde 8): Labor, Tempelsteg, Hort, Herz des Sees, Herz der Fäden
   Wie Wachturm/Turmspitze: Leben im Hintergrund (ab Stufe 1), Requisiten mit Licht auf der Kampffläche, Vordergrund-
   Schattenrisse an den Rändern ab Stufe 2 (blenden über fgAlpha aus, wenn Kampf oder Ezekiel dahinter ist).
   Labor: brodelnde Destillierkolben, schwebende Glasscherben, Runenkreis. Tempelsteg: Laternen auf Pollern, Gischt an
   den Pfählen, Möwen. Hort: Goldglitzern über dem Schatzberg, rieselnde Münzen. Herz des Sees: grüne Lichtbahnen von
   oben, Schwebeteilchen, wiegender Tang. Herz der Fäden: leuchtende Seidenfäden, Tauperlen, eingesponnene Kokons. Kein Blau. */
(function () {
  "use strict";
  const Z = window.Z, G = Z.gfx, T = Z.TILE, TAU = Math.PI * 2, PI = Math.PI;
  const on = () => { const q = Z.gq; if (!q) return true; if (q.lean) return false; return q.level === -1 ? true : q.level >= 1; };
  const rich = () => { const q = Z.gq; if (q && q.lean) return false; return !q || (q.level === -1 ? q.layers !== false : q.level >= 2); };
  const hash = i => { let h = Math.imul((i | 0) ^ 0x9e3779b9, 0x85ebca6b); h ^= h >>> 13; h = Math.imul(h, 0xc2b2ae35); h ^= h >>> 16; return (h >>> 0) / 4294967296; };
  const which = () => { const lv = Z.level; if (!lv || !lv.arena) return null; if (lv.arena === "herz") return "faeden"; const A = Z.ARENAS && Z.ARENAS[lv.arena]; const k = A && A.kind; return k === "lab" ? "labor" : k === "pier" ? "steg" : k === "hoard" ? "hort" : k === "lakeboss" ? "seeherz" : null; };
  function floorY() { const lv = Z.level, x = Math.floor(lv.W / 2); for (let y = 3; y < lv.H; y++) if (lv.get(x, y) === 1) return y * T; return (lv.H - 2) * T; }
  const par = (cam, wx, p) => cam.x * (1 - p) + wx * p;
  function glowAt(c, x, y, r, col, a) { const g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, col.replace("A", a.toFixed(3))); g.addColorStop(1, col.replace("A", "0")); c.fillStyle = g; c.fillRect(x - r, y - r, r * 2, r * 2); }
  /* Requisiten auf der Kampffläche (Anteile der Breite) */
  const PROPS = { labor: [[0.18, "kolben"], [0.82, "kolben"]], steg: [[0.15, "poller"], [0.5, "poller"], [0.85, "poller"]], hort: [[0.22, "kelch"], [0.78, "kelch"]], seeherz: [[0.2, "muschel"], [0.8, "muschel"]], faeden: [[0.2, "kokon"], [0.8, "kokon"]] };
  const LCOL = { kolben: "#b8f060", poller: "#ffc070", kelch: "#ffd27a", muschel: "#c8f0b0", kokon: "#e8d8f0" };
  const propPos = (fx) => { const lv = Z.level; return { x: Math.round(lv.W * fx) * T + 8, y: floorY() }; };
  /* ---------- Hintergrund ---------- */
  function back(c, cam, t, w) {
    const lv = Z.level, W = lv.W * T, fy = floorY();
    c.save(); c.globalCompositeOperation = "lighter";
    if (w === "labor" || w === "faeden") {
      /* schwebende Glasscherben bzw. Tauperlen, die im Licht blitzen */
      for (let i = 0; i < 18; i++) { const x = par(cam, W * hash(i), 0.6), y = cam.y + cam.h * (0.1 + hash(i + 50) * 0.6) + Math.sin(t * 0.6 + i) * 6, a = 0.3 + 0.3 * Math.max(0, Math.sin(t * 1.7 + i * 2.3));
        if (w === "labor") { c.save(); c.translate(x, y); c.rotate(t * 0.3 + i); c.fillStyle = "rgba(200,240,190," + (a * 0.5).toFixed(2) + ")"; c.beginPath(); c.moveTo(0, -3); c.lineTo(2, 1); c.lineTo(-1.5, 2); c.fill(); c.restore(); }
        else { c.fillStyle = "rgba(240,230,255," + a.toFixed(2) + ")"; c.beginPath(); c.arc(x, y, 1, 0, TAU); c.fill(); } }
      if (w === "faeden") { /* Seidenfäden quer durch die Höhle, an denen Licht entlangläuft */
        c.lineWidth = 0.6; for (let i = 0; i < 7; i++) { const x0 = par(cam, W * hash(i + 9) - 200, 0.7), y0 = fy - 260 + hash(i + 3) * 200, x1 = x0 + 400 + hash(i) * 300, y1 = y0 + (hash(i + 7) - 0.5) * 160, sag = 30 + hash(i + 11) * 40;
          c.strokeStyle = "rgba(220,200,240,.16)"; c.beginPath(); c.moveTo(x0, y0); c.quadraticCurveTo((x0 + x1) / 2, (y0 + y1) / 2 + sag, x1, y1); c.stroke();
          const u = (t * 0.12 + hash(i + 20)) % 1, px = (1 - u) * (1 - u) * x0 + 2 * u * (1 - u) * (x0 + x1) / 2 + u * u * x1, py = (1 - u) * (1 - u) * y0 + 2 * u * (1 - u) * ((y0 + y1) / 2 + sag) + u * u * y1; glowAt(c, px, py, 10, "rgba(230,200,255,A)", 0.5); } }
      else { /* Runenkreis am Boden hinter der Kampffläche */
        const rx = par(cam, W / 2, 0.85), ry = fy - 4, R = 120, a = 0.12 + 0.06 * Math.sin(t * 1.2); c.strokeStyle = "rgba(190,240,110," + a.toFixed(2) + ")"; c.lineWidth = 1.2; c.beginPath(); c.ellipse(rx, ry, R, R * 0.18, 0, 0, TAU); c.stroke(); c.beginPath(); c.ellipse(rx, ry, R * 0.8, R * 0.14, 0, 0, TAU); c.stroke();
        for (let k = 0; k < 12; k++) { const an = k / 12 * TAU + t * 0.1; c.fillStyle = "rgba(200,240,120," + (a * 1.6).toFixed(2) + ")"; c.fillRect(rx + Math.cos(an) * R * 0.9 - 1, ry + Math.sin(an) * R * 0.16 - 1.5, 2, 3); } }
    } else if (w === "hort") {
      /* Goldglitzern auf dem Schatzberg und rieselnde Münzen */
      for (let i = 0; i < 40; i++) { const x = par(cam, W * hash(i), 0.5), y = fy - 20 - hash(i + 100) * 160, a = Math.max(0, Math.sin(t * (1.5 + hash(i + 7) * 2) + i * 3)); if (a < 0.6) continue; const s = (a - 0.6) * 9;
        c.strokeStyle = "rgba(255,240,180," + ((a - 0.6) * 2).toFixed(2) + ")"; c.lineWidth = 0.6; c.beginPath(); c.moveTo(x - s, y); c.lineTo(x + s, y); c.moveTo(x, y - s); c.lineTo(x, y + s); c.stroke(); }
      for (let i = 0; i < 8; i++) { const u = (t * 0.25 + hash(i + 40)) % 1, x = par(cam, W * hash(i + 60), 0.5) + Math.sin(u * 8 + i) * 3, y = fy - 200 + u * 190; c.fillStyle = "rgba(255,214,110," + (0.8 * (1 - u)).toFixed(2) + ")"; c.fillRect(x, y, 1.6, 1 + Math.abs(Math.sin(t * 9 + i)) * 1.2); }
    } else if (w === "seeherz") {
      /* grüne Lichtbahnen von oben und Schwebeteilchen */
      for (let i = 0; i < 5; i++) { const x = par(cam, W * (0.1 + i * 0.2), 0.4) + Math.sin(t * 0.2 + i) * 30, a = 0.05 + 0.03 * Math.sin(t * 0.5 + i * 1.7); const g = c.createLinearGradient(0, cam.y, 0, fy); g.addColorStop(0, "rgba(170,240,190," + a.toFixed(3) + ")"); g.addColorStop(1, "rgba(170,240,190,0)"); c.fillStyle = g; c.beginPath(); c.moveTo(x - 14, cam.y); c.lineTo(x + 14, cam.y); c.lineTo(x + 60, fy); c.lineTo(x + 10, fy); c.fill(); }
      for (let i = 0; i < 24; i++) { const u = (t * 0.03 * (1 + hash(i)) + hash(i + 5)) % 1, x = cam.x + cam.w * hash(i + 30) + Math.sin(t * 0.4 + i) * 10, y = cam.y + cam.h * (1 - u); c.fillStyle = "rgba(200,240,210," + (0.35 * Math.sin(u * PI)).toFixed(2) + ")"; c.fillRect(x, y, 1, 1); }
    } else if (w === "steg") {
      /* Gischt an den Pfählen des Stegs */
      for (let i = 0; i < 7; i++) { const x = par(cam, W * (0.07 + i * 0.145), 1), y = fy + 22; for (let k = 0; k < 4; k++) { const u = (t * 0.7 + k / 4 + hash(i)) % 1; c.fillStyle = "rgba(220,236,220," + (0.5 * (1 - u)).toFixed(2) + ")"; c.beginPath(); c.arc(x + (k - 1.5) * 4 * (1 + u), y - u * 14 + u * u * 12, 1 + u, 0, TAU); c.fill(); } }
    }
    c.restore();
  }
  const back0 = Z.drawBackLife;
  Z.drawBackLife = function (c, cam, t, B, oy, LH) {
    if (back0) back0.apply(this, arguments);
    const w = which(); if (!w || !on() || (G.off && G.off.arena2)) return;
    c.save(); try { back(c, cam, t, w); } catch (e) { console.error(e); } c.restore();
  };
  /* ---------- Requisiten mit Licht ---------- */
  function prop(c, k, x, y, t, i) {
    switch (k) {
      case "kolben": {
        c.fillStyle = "#3a2a1c"; c.fillRect(x - 10, y - 10, 20, 2); c.fillRect(x - 9, y - 8, 2, 8); c.fillRect(x + 7, y - 8, 2, 8);
        const fl = ["#a8e040", "#c060c0"][i % 2]; c.fillStyle = "rgba(220,240,220,.35)"; c.beginPath(); c.arc(x - 3, y - 15, 5, 0, TAU); c.fill(); c.fillRect(x - 4, y - 24, 2, 6);
        c.fillStyle = fl; c.globalAlpha = 0.8; c.beginPath(); c.arc(x - 3, y - 15, 4, 0.2, PI - 0.2); c.fill(); c.globalAlpha = 1;
        c.strokeStyle = "rgba(220,240,220,.5)"; c.lineWidth = 0.8; c.beginPath(); c.moveTo(x - 2, y - 23); c.quadraticCurveTo(x + 6, y - 28, x + 7, y - 16); c.stroke();
        c.fillStyle = "rgba(220,240,220,.35)"; c.fillRect(x + 5, y - 16, 4, 6); c.fillStyle = fl; c.fillRect(x + 5.5, y - 13, 3, 2.6);
        for (let b = 0; b < 3; b++) { const u = (t * 1.4 + b / 3 + i) % 1; c.fillStyle = "rgba(240,255,220," + (0.8 * (1 - u)).toFixed(2) + ")"; c.beginPath(); c.arc(x - 4 + b * 1.5, y - 14 - u * 5, 0.6 + u * 0.4, 0, TAU); c.fill(); }
        c.globalCompositeOperation = "lighter"; c.fillStyle = "rgba(255,150,60,.8)"; c.beginPath(); c.ellipse(x - 3, y - 9.5, 2, 1, 0, 0, TAU); c.fill(); c.globalCompositeOperation = "source-over"; break;
      }
      case "poller": {
        c.fillStyle = "#3a2a1c"; c.fillRect(x - 3, y - 12, 6, 12); c.fillStyle = "#5a4028"; c.fillRect(x - 3.6, y - 13, 7.2, 1.6); c.strokeStyle = "#8a7048"; c.lineWidth = 1; c.beginPath(); c.moveTo(x - 3, y - 8); c.lineTo(x + 3, y - 6); c.moveTo(x - 3, y - 6); c.lineTo(x + 3, y - 8); c.stroke();
        c.fillStyle = "#2a2420"; c.fillRect(x - 0.6, y - 24, 1.2, 11); c.fillStyle = "#3a3028"; c.fillRect(x - 3, y - 30, 6, 1.2); c.fillRect(x - 3, y - 22.5, 6, 1); const f = 0.85 + 0.15 * Math.sin(t * 9 + i);
        c.fillStyle = "#ffcf7a"; c.globalAlpha = 0.9; c.fillRect(x - 2.4, y - 29, 4.8, 6.5); c.globalAlpha = 1; c.fillStyle = "#fff0c0"; c.fillRect(x - 0.6, y - 27 + (1 - f), 1.2, 2.4 * f); break;
      }
      case "kelch": {
        for (let k = 0; k < 9; k++) { c.fillStyle = k % 2 ? "#e0b040" : "#b88a20"; c.beginPath(); c.ellipse(x - 8 + hash(k + i * 9) * 16, y - 1 - hash(k + 30) * 2, 2, 1, 0, 0, TAU); c.fill(); }
        c.fillStyle = "#c89a30"; c.beginPath(); c.moveTo(x - 4, y - 14); c.lineTo(x + 4, y - 14); c.quadraticCurveTo(x + 3.5, y - 8, x, y - 7); c.quadraticCurveTo(x - 3.5, y - 8, x - 4, y - 14); c.fill(); c.fillRect(x - 0.6, y - 7, 1.2, 5); c.fillRect(x - 3, y - 2.4, 6, 1.4);
        c.fillStyle = "#a01a2a"; c.beginPath(); c.arc(x, y - 11, 1.1, 0, TAU); c.fill(); c.fillStyle = "rgba(255,250,220,.7)"; c.fillRect(x - 3, y - 13.4, 1, 4);
        const a = Math.max(0, Math.sin(t * 2 + i * 3)); if (a > 0.7) { c.globalCompositeOperation = "lighter"; c.strokeStyle = "rgba(255,240,200," + ((a - 0.7) * 3).toFixed(2) + ")"; c.lineWidth = 0.5; c.beginPath(); c.moveTo(x - 6, y - 13); c.lineTo(x + 0, y - 13); c.moveTo(x - 3, y - 16); c.lineTo(x - 3, y - 10); c.stroke(); c.globalCompositeOperation = "source-over"; } break;
      }
      case "muschel": {
        c.fillStyle = "#c8b0a0"; c.beginPath(); c.moveTo(x - 9, y); c.quadraticCurveTo(x - 9, y - 12, x, y - 13); c.quadraticCurveTo(x + 9, y - 12, x + 9, y); c.fill(); c.strokeStyle = "rgba(90,60,50,.45)"; c.lineWidth = 0.5; c.beginPath(); for (let k = -3; k <= 3; k++) { c.moveTo(x, y); c.lineTo(x + k * 2.8, y - 12 + Math.abs(k) * 0.8); } c.stroke();
        const a = 0.6 + 0.3 * Math.sin(t * 1.3 + i); c.globalCompositeOperation = "lighter"; c.fillStyle = "rgba(220,255,220," + a.toFixed(2) + ")"; c.beginPath(); c.arc(x, y - 3, 2.6, 0, TAU); c.fill(); c.globalCompositeOperation = "source-over"; break;
      }
      case "kokon": {
        c.strokeStyle = "rgba(230,220,240,.4)"; c.lineWidth = 0.4; c.beginPath(); c.moveTo(x, y - 60); c.lineTo(x, y - 30); c.stroke();
        const sw = Math.sin(t * 0.8 + i) * 0.08; c.save(); c.translate(x, y - 30); c.rotate(sw); c.fillStyle = "#c8c0cc"; c.beginPath(); c.ellipse(0, 10, 6, 11, 0, 0, TAU); c.fill(); c.strokeStyle = "rgba(90,70,100,.45)"; c.lineWidth = 0.5; c.beginPath(); for (let j = 0; j < 7; j++) { c.moveTo(-5.5, 2 + j * 2.6); c.quadraticCurveTo(0, 4 + j * 2.6, 5.5, 1 + j * 2.6); } c.stroke();
        c.globalCompositeOperation = "lighter"; c.fillStyle = "rgba(230,200,255," + (0.25 + 0.15 * Math.sin(t * 2 + i)).toFixed(2) + ")"; c.beginPath(); c.ellipse(0, 10, 3, 6, 0, 0, TAU); c.fill(); c.restore(); break;
      }
    }
  }
  const mid0 = Z.drawMidLife;
  Z.drawMidLife = function (c, cam, t) {
    if (mid0) mid0.apply(this, arguments);
    const w = which(); if (!w || !on() || (G.off && G.off.arena2)) return;
    c.save(); PROPS[w].forEach(([fx, k], i) => { const p = propPos(fx); if (p.x > cam.x - 40 && p.x < cam.x + cam.w + 40) prop(c, k, p.x, p.y, t, i); }); c.restore();
  };
  if (G.lightGather) G.lightGather.push(function (add, cam, t) {
    const w = which(); if (!w || !on() || (G.off && G.off.arena2)) return;
    PROPS[w].forEach(([fx, k], i) => { const p = propPos(fx); add(p.x, p.y - (k === "poller" ? 26 : k === "kokon" ? 20 : 12), k === "poller" ? 120 : 95, LCOL[k], (k === "poller" ? 0.55 : 0.4) * (0.9 + 0.1 * Math.sin(t * 7 + i)), k === "poller" ? 10 : 4); });
  });
  /* ---------- Vordergrund-Schattenrisse an den unteren Rändern ---------- */
  const al0 = Z.drawAfterLight;
  Z.drawAfterLight = function (c, cam, Wd, Hd, t) {
    if (al0) al0.apply(this, arguments);
    const w = which(); if (!w || !rich() || (G.off && (G.off.arenaFg || G.off.arena2))) return;
    const S = G.scale; c.save(); c.setTransform(S, 0, 0, S, 0, 0);
    const sx = cam.x * 1.3, h = cam.h;
    /* nur unterhalb der Kampffläche: wo der Boden tief im Bild liegt, ist kein Platz – dann bleibt der Rand frei */
    const IH = { labor: 46, steg: 46, hort: 40, seeherz: 90, faeden: 70 }[w] || 60, room = h - (floorY() - cam.y) - 10;
    if (room < IH * 0.6) { c.restore(); return; }
    for (let i = Math.floor(sx / 300) - 1; i <= Math.floor((sx + cam.w * 1.3) / 300) + 1; i++) {
      const x = i * 300 - sx + hash(i) * 60, key = "a2" + w + i, a = G.fgAlpha ? G.fgAlpha(key, x - 10, h - 70, 90, 70, 0.9) : 0.9; if (a < 0.02) continue;
      if (room < IH) { c.save(); c.translate(0, IH - room); }
      c.globalAlpha = a; c.fillStyle = "#0a0608"; c.strokeStyle = "#0a0608";
      if (w === "labor") { c.fillRect(x, h - 18, 70, 18); for (let k = 0; k < 4; k++) { const bx = x + 8 + k * 16, bh = 10 + hash(i * 4 + k) * 14; c.fillRect(bx - 2, h - 18 - bh, 4, bh); c.beginPath(); c.arc(bx, h - 18 - bh - 4, 5, 0, TAU); c.fill(); }
        c.globalCompositeOperation = "lighter"; c.fillStyle = "rgba(180,240,110,.25)"; c.beginPath(); c.arc(x + 24, h - 18 - 14, 2.5, 0, TAU); c.fill(); c.globalCompositeOperation = "source-over"; }
      else if (w === "steg") { c.fillRect(x, h - 14, 80, 14); c.fillRect(x + 6, h - 44, 7, 30); c.lineWidth = 2; c.beginPath(); c.moveTo(x + 10, h - 38); c.quadraticCurveTo(x + 40, h - 20 + Math.sin(t) * 2, x + 74, h - 34); c.stroke(); }
      else if (w === "hort") { c.beginPath(); c.moveTo(x - 10, h); c.quadraticCurveTo(x + 30, h - 40, x + 80, h); c.fill(); c.fillStyle = "rgba(255,200,100,.18)"; for (let k = 0; k < 6; k++) c.fillRect(x + 10 + k * 10, h - 18 + Math.abs(k - 2.5) * 5, 4, 1); }
      else if (w === "seeherz") { c.lineWidth = 3; for (let k = 0; k < 4; k++) { const bx = x + k * 14, sw = Math.sin(t * 0.9 + k + i) * 8; c.beginPath(); c.moveTo(bx, h); c.quadraticCurveTo(bx + sw, h - 40, bx + sw * 1.6, h - 70 - hash(i + k) * 20); c.stroke(); } }
      else if (w === "faeden") { c.lineWidth = 0.8; c.strokeStyle = "rgba(10,6,8,.9)"; for (let k = 0; k < 5; k++) { c.beginPath(); c.moveTo(x - 20, h - 10 - k * 12); c.quadraticCurveTo(x + 40, h + 10 - k * 14, x + 100, h - 30 - k * 10); c.stroke(); } c.fillStyle = "rgba(240,230,255,.35)"; for (let k = 0; k < 5; k++) { c.beginPath(); c.arc(x + 20 + k * 15, h - 12 - k * 6, 0.9, 0, TAU); c.fill(); } }
      if (room < IH) c.restore();
    }
    c.restore();
  };
})();

/* Ezekiel – The Destroyer · Lagerleben (Grafik-Runde 8, ab Stufe 1)
   Im Lager vor der Burg: hinter dem Lager sitzt eine Runde um ein fernes Feuer und erzählt (eine Gestalt gestikuliert,
   eine hebt den Becher, Funken steigen), Rauchsäulen ferner Feuer ziehen in den Himmel und neigen sich im Wind,
   Banner an Stangen wehen. Am Abend warmes Gegenlicht, nachts rötliche Glut. Stufe 0 / Handheld unverändert. Kein Blau. */
(function () {
  "use strict";
  const Z = window.Z, G = Z.gfx, T = Z.TILE, TAU = Math.PI * 2;
  const on = () => { const q = Z.gq; if (!q) return true; if (q.lean) return false; return q.level === -1 ? true : q.level >= 1; };
  const rich = () => { const q = Z.gq; if (q && q.lean) return false; return !q || (q.level === -1 ? q.layers !== false : q.level >= 2); };
  const hash = i => { let h = Math.imul((i | 0) ^ 0x9e3779b9, 0x85ebca6b); h ^= h >>> 13; h = Math.imul(h, 0xc2b2ae35); h ^= h >>> 16; return (h >>> 0) / 4294967296; };
  const isCamp = () => { const lv = Z.level; return lv && lv.hub && !(G.off && G.off.lagerleben); };
  let fyC = null, fyLv = null;
  function floorY() { const lv = Z.level; if (fyLv === lv) return fyC; fyLv = lv; const x = lv.start ? lv.start.x : Math.floor(lv.W / 2); fyC = (lv.H - 2) * T; for (let y = (lv.start ? lv.start.y : 3); y < lv.H; y++) if (lv.get(x, y) === 1) { fyC = y * T; break; } return fyC; }
  const par = (cam, wx, p) => cam.x * (1 - p) + wx * p;
  function smoke(c, x, y, t, k, scale) {
    for (let i = 0; i < 14; i++) { const u = ((t * 0.05 + i / 14 + hash(k) ) % 1), r = (4 + u * 26) * scale, dx = Math.sin(u * 3 + t * 0.2 + k) * 6 * scale + u * u * 70 * scale, a = 0.16 * Math.sin(u * Math.PI);
      c.fillStyle = "rgba(70,56,60," + a.toFixed(3) + ")"; c.beginPath(); c.arc(x + dx, y - u * 220 * scale, r, 0, TAU); c.fill(); }
  }
  function storyGroup(c, x, y, t, zt) {
    const night = !zt || zt.k === "nacht" || zt.k === "blut", f = 0.85 + 0.1 * Math.sin(t * 8) + 0.05 * Math.sin(t * 19);
    c.save(); c.globalCompositeOperation = "lighter"; const g = c.createRadialGradient(x, y - 6, 0, x, y - 6, 70); g.addColorStop(0, "rgba(255,150,60," + (0.35 * f).toFixed(3) + ")"); g.addColorStop(1, "rgba(255,150,60,0)"); c.fillStyle = g; c.fillRect(x - 70, y - 76, 140, 140); c.restore();
    c.fillStyle = "rgba(255,150,60,.9)"; c.beginPath(); c.moveTo(x - 4, y); c.quadraticCurveTo(x - 3, y - 9 * f, x, y - 13 * f); c.quadraticCurveTo(x + 3, y - 8 * f, x + 4, y); c.fill(); c.fillStyle = "rgba(255,230,150,.9)"; c.beginPath(); c.ellipse(x, y - 4, 1.6, 3.4 * f, 0, 0, TAU); c.fill();
    const sil = night ? "#140c10" : "#22141a";
    /* fünf Gestalten im Kreis; eine erzählt mit großen Gesten, eine hebt den Becher */
    const P = [[-26, 0, 0], [-15, 2, 1], [14, 2, 2], [26, 0, 3], [36, -1, 4]];
    for (const [dx, dy, k] of P) {
      const px = x + dx, py = y + dy, face = dx < 0 ? 1 : -1;
      c.fillStyle = sil; c.beginPath(); c.moveTo(px - 4, py); c.quadraticCurveTo(px - 4.5, py - 9, px, py - 11); c.quadraticCurveTo(px + 4.5, py - 9, px + 4, py); c.fill(); c.beginPath(); c.arc(px + face * 0.5, py - 13.5, 2.6, 0, TAU); c.fill();
      if (k === 2) { const a = -0.8 + Math.sin(t * 2.3) * 0.7, b = -1.6 + Math.sin(t * 1.7 + 1) * 0.5; c.strokeStyle = sil; c.lineWidth = 1.6; c.beginPath(); c.moveTo(px, py - 9); c.lineTo(px + face * Math.cos(a) * 7, py - 9 + Math.sin(a) * 7); c.moveTo(px, py - 9); c.lineTo(px + face * Math.cos(b) * 6, py - 9 + Math.sin(b) * 6); c.stroke(); }
      if (k === 0) { const up = Math.max(0, Math.sin(t * 0.4)) ; c.strokeStyle = sil; c.lineWidth = 1.5; c.beginPath(); c.moveTo(px, py - 9); c.lineTo(px + 5, py - 9 - up * 7); c.stroke(); c.fillStyle = sil; c.fillRect(px + 4, py - 12 - up * 7, 2.4, 3); }
      if (k === 4) { c.fillStyle = sil; c.beginPath(); c.ellipse(px - 2, py - 3, 7, 4, 0, Math.PI, 0); c.fill(); }
      c.fillStyle = "rgba(255,170,90,.45)"; c.fillRect(px - face * 3.6, py - 9, 0.8, 8);
    }
    c.fillStyle = "rgba(255,200,110,.9)"; for (let k = 0; k < 6; k++) { const u = (t * 0.5 + k / 6) % 1; c.globalAlpha = 1 - u; c.fillRect(x + Math.sin(t * 2 + k * 3) * 4 + u * 6, y - 12 - u * 40, 1, 1); } c.globalAlpha = 1;
  }
  const back0 = Z.drawBackLife;
  Z.drawBackLife = function (c, cam, t, B, oy, LH) {
    if (back0) back0.apply(this, arguments);
    if (!isCamp() || !on()) return;
    const lv = Z.level, W = lv.W * T, fy = floorY();
    c.save();
    try {
      for (let k = 0; k < 3; k++) smoke(c, par(cam, W * (0.15 + k * 0.33), 0.25), fy - 50 - k * 6, t, k, 0.6 + k * 0.1);
    } catch (e) { console.error(e); }
    c.restore();
  };
  /* Platz für die Erzählrunde: weit weg von Übungspuppe, Händlern, Stationen und Bannern */
  let sxLv = null, sxV = 0;
  function storyX(lv) {
    if (sxLv === lv) return sxV; sxLv = lv;
    const busy = [];
    for (const e of Z.enemies || []) if (e.dummy) busy.push(e.x);
    for (const p of lv.props || []) if (p.kind === "npc" || p.kind === "station" || p.id === "Y") busy.push(p.x * T);
    for (const d of lv.doors || []) busy.push(d.x * T);
    for (const f of BAN) busy.push(lv.W * T * f);
    let best = lv.W * T * 0.36, bs = -1;
    for (let k = 0; k <= 40; k++) { const x = lv.W * T * (0.12 + k * 0.019), d = busy.reduce((m, b) => Math.min(m, Math.abs(b - x)), 1e9); if (d > bs) { bs = d; best = x; } }
    sxV = best; return best;
  }
  /* Banner an Stangen auf der Lagerfläche (ab Stufe 2 mit wehendem Tuch, sonst ruhig) */
  const BAN = [0.08, 0.62, 0.93];
  const mid0 = Z.drawMidLife;
  Z.drawMidLife = function (c, cam, t) {
    if (mid0) mid0.apply(this, arguments);
    if (!isCamp() || !on()) return;
    const lv = Z.level, fy = floorY(), mv = rich();
    c.save();
    /* Erzählrunde etwas hinter der Lagerfläche (leicht versetzt mitlaufend), am Rand der Weide */
    try { const gx = par(cam, storyX(lv), 0.9); if (gx > cam.x - 80 && gx < cam.x + cam.w + 80) { c.globalAlpha = 0.92; storyGroup(c, gx, fy - 1, t, Z.zeit ? Z.zeit() : null); c.globalAlpha = 1; } } catch (e) { console.error(e); }
    BAN.forEach((fx, i) => {
      const x = Math.round(lv.W * fx) * T + 8; if (x < cam.x - 40 || x > cam.x + cam.w + 40) return;
      const top = fy - 70; c.fillStyle = "#3a2a1c"; c.fillRect(x - 1, top, 2, 70); c.fillStyle = "#b8923a"; c.beginPath(); c.arc(x, top - 1.5, 2, 0, TAU); c.fill();
      const col = ["#8a1a1a", "#3a5a2a", "#6a2a5a"][i % 3], N = 8, L = 26, H = 16;
      c.fillStyle = col; c.beginPath(); c.moveTo(x + 1, top + 2);
      for (let k = 0; k <= N; k++) { const u = k / N, wv = mv ? Math.sin(t * 3 - u * 4 + i) * 2.5 * u : 0; c.lineTo(x + 1 + u * L, top + 2 + wv); }
      for (let k = N; k >= 0; k--) { const u = k / N, wv = mv ? Math.sin(t * 3 - u * 4 + i + 0.4) * 2.5 * u : 0; c.lineTo(x + 1 + u * L - (k === N ? 4 : 0), top + 2 + H + wv + (k === N ? -H / 2 : 0)); }
      c.closePath(); c.fill();
      c.fillStyle = "rgba(255,230,190,.12)"; c.fillRect(x + 1, top + 2, L * 0.4, 2);
      c.fillStyle = "#c8a050"; c.beginPath(); c.arc(x + 11, top + 10 + (mv ? Math.sin(t * 3 - 1.7 + i) * 1.1 : 0), 3, 0, TAU); c.fill();
    });
    c.restore();
  };
})();

/* Ezekiel – The Destroyer · Übergangslicht (Grafik-Runde 9, ab Stufe 1)
   Aus jedem Durchgang zwischen zwei Räumen fällt ein warmer Schein – stärker, wenn auf der anderen Seite ein bewohnter
   Raum (mit Funktion) liegt –, damit sich die Räume wie Teile eines zusammenhängenden Schlosses anfühlen. */
(function () {
  "use strict";
  const Z = window.Z, G = Z.gfx, T = Z.TILE;
  const on = () => { const q = Z.gq; if (!q) return true; if (q.lean) return false; return (q.level === -1 ? 2 : q.level) >= 1 && !(G.off && (G.off.textur || G.off.steinmetz)); };
  const COLS = { kueche: "#ffa860", giesserei: "#ff8a40", essenhalle: "#ff8a40", kapelle: "#ffd890", bibliothek: "#ffd8a0", taverne: "#ffb060", folterkammer: "#ff7a40", kristallhoehle: "#d090ff", pilzgrotte: "#a8e890", runenkammer: "#c890ff" };
  if (G.lightGather) G.lightGather.push(function (add, cam, t) {
    if (!on() || !Z.level || Z.darkness > 0 || !Z.durchgaenge) return;
    for (const d of Z.durchgaenge()) {
      const x = d.x * T, y = (d.bot + 1) * T - 14; if (x < cam.x - 100 || x > cam.x + cam.w + 100 || y < cam.y - 100 || y > cam.y + cam.h + 100) continue;
      const fn = d.b || d.a, col = (fn && COLS[fn]) || "#ffd8a8", f = 0.92 + 0.08 * Math.sin(t * 2 + d.x);
      add(x, y, fn ? 80 : 60, col, (fn ? 0.22 : 0.12) * f, 0);
    }
  });
})();

/* Ezekiel – The Destroyer · Tiefe Fernsicht (Grafik-Runde 9, ab Stufe 1)
   Hinter den Öffnungen der Innenräume liegt eine weitere, ganz ferne Ebene mit langsamer Parallaxe: in den Hallen
   ferne Gewölbe mit Kronleuchtern, im Keller Fässergänge im Dunst, im Verlies Zellengänge mit Fackeln, am See die
   Höhlendecke mit Spiegelungen im Wasser, im Schlund Seidenfäden, im Glockenturm Gebälk mit Glocken, in der Schmiede
   ferne Essen. Einmal je Gebiet gemalt; gezeichnet wird nur in den sichtbaren Öffnungen. Kein Blau. */
(function () {
  "use strict";
  const Z = window.Z, G = Z.gfx, T = Z.TILE, TAU = Math.PI * 2;
  const on = () => { const q = Z.gq; if (!q) return true; if (q.lean) return false; return (q.level === -1 ? 2 : q.level) >= 1 && !(G.off && G.off.fernsicht); };
  const TW = 512, TH = 288, RS = 2, SPR = new Map();
  const rnd = s => () => (s = (s * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
  const glowDot = (g, x, y, r, col, a) => { const q = g.createRadialGradient(x, y, 0, x, y, r); q.addColorStop(0, col.replace("A", a)); q.addColorStop(1, col.replace("A", 0)); g.fillStyle = q; g.fillRect(x - r, y - r, r * 2, r * 2); };
  const PAINT = {
    halls(g, R) { g.fillStyle = "#1e1410"; g.fillRect(0, 0, TW, TH);
      for (let d = 0; d < 3; d++) { const s = 1 - d * 0.28, a = 0.9 - d * 0.25, col = ["#3a2a22", "#2e2220", "#26201e"][d], n = 4 + d * 2, w = TW / n;
        for (let k = 0; k < n; k++) { const x = k * w + (d % 2) * w / 2, top = TH * (0.2 + d * 0.1); g.globalAlpha = a; g.fillStyle = col; g.fillRect(x, top, 6 * s, TH - top); g.beginPath(); g.moveTo(x + 6 * s, top + w * 0.45); g.quadraticCurveTo(x + w / 2, top - w * 0.1, x + w, top + w * 0.45); g.lineTo(x + w, top + w * 0.45 + 6 * s); g.quadraticCurveTo(x + w / 2, top + 6 * s - w * 0.1, x + 6 * s, top + w * 0.45 + 6 * s); g.fill();
          g.globalAlpha = 1; glowDot(g, x + w / 2, top + w * 0.5, 14 * s, "rgba(255,200,120,A)", 0.35 * a); g.fillStyle = "rgba(255,220,150," + (0.7 * a) + ")"; for (let j = -2; j <= 2; j++) g.fillRect(x + w / 2 + j * 3 * s, top + w * 0.5, 1, 1.4); } }
      const hz = g.createLinearGradient(0, 0, 0, TH); hz.addColorStop(0, "rgba(30,20,16,.6)"); hz.addColorStop(0.6, "rgba(60,40,30,.15)"); hz.addColorStop(1, "rgba(30,20,16,.5)"); g.fillStyle = hz; g.fillRect(0, 0, TW, TH); },
    cellar(g, R) { g.fillStyle = "#1a120c"; g.fillRect(0, 0, TW, TH);
      for (let d = 0; d < 4; d++) { const s = 1 - d * 0.22, cy = TH * 0.55, ar = TH * 0.42 * s, cx = TW / 2, col = ["#3a281a", "#30221a", "#281c16", "#201812"][d];
        for (const ox of [-TW / 2, 0, TW / 2]) { g.strokeStyle = col; g.lineWidth = 6 * s; g.beginPath(); g.arc(cx + ox, cy, ar, Math.PI, 0); g.stroke();
          for (const sd of [-1, 1]) for (let k = 0; k < 3; k++) { const bx = cx + ox + sd * ar * (0.55 + k * 0.12), by = cy + ar * 0.55 - k * ar * 0.28; g.fillStyle = col; g.beginPath(); g.arc(bx, by, 9 * s, 0, TAU); g.fill(); g.strokeStyle = "rgba(0,0,0,.4)"; g.lineWidth = 1; g.beginPath(); g.arc(bx, by, 7 * s, 0, TAU); g.stroke(); } } }
      for (let k = 0; k < 5; k++) glowDot(g, R() * TW, TH * (0.3 + R() * 0.3), 18, "rgba(255,180,100,A)", 0.25);
      const hz = g.createLinearGradient(0, 0, 0, TH); hz.addColorStop(0, "rgba(40,28,20,.5)"); hz.addColorStop(0.5, "rgba(90,70,50,.18)"); hz.addColorStop(1, "rgba(20,14,10,.6)"); g.fillStyle = hz; g.fillRect(0, 0, TW, TH); },
    dungeon(g, R) { g.fillStyle = "#121410"; g.fillRect(0, 0, TW, TH);
      for (let d = 0; d < 3; d++) { const s = 1 - d * 0.3, col = ["#262a22", "#20241c", "#1a1e18"][d], n = 5 + d * 2, w = TW / n, top = TH * (0.3 + d * 0.06), bot = TH * (0.85 - d * 0.05);
        for (let k = 0; k < n; k++) { const x = k * w + (d % 2) * w / 2; g.fillStyle = col; g.fillRect(x, top, w * 0.12, bot - top); g.fillStyle = "rgba(0,0,0,.5)"; g.fillRect(x + w * 0.3, top + (bot - top) * 0.3, w * 0.4, (bot - top) * 0.7); g.fillStyle = col; for (let j = 0; j < 4; j++) g.fillRect(x + w * 0.3 + j * w * 0.12, top + (bot - top) * 0.3, 1.5 * s, (bot - top) * 0.7);
          if (k % 2 === 0) glowDot(g, x + w * 0.06, top + (bot - top) * 0.25, 16 * s, "rgba(255,160,70,A)", 0.4 * s); } }
      const hz = g.createLinearGradient(0, 0, 0, TH); hz.addColorStop(0, "rgba(10,14,10,.6)"); hz.addColorStop(0.6, "rgba(50,60,40,.15)"); hz.addColorStop(1, "rgba(10,12,8,.6)"); g.fillStyle = hz; g.fillRect(0, 0, TW, TH); },
    lake(g, R) { const gr = g.createLinearGradient(0, 0, 0, TH); gr.addColorStop(0, "#0a1410"); gr.addColorStop(0.6, "#12241c"); gr.addColorStop(1, "#0c1a14"); g.fillStyle = gr; g.fillRect(0, 0, TW, TH);
      g.fillStyle = "#081008"; g.beginPath(); g.moveTo(0, 0); for (let x = 0; x <= TW; x += 8) g.lineTo(x, 14 + (x % 24 === 0 ? 30 + R() * 30 : R() * 10)); g.lineTo(TW, 0); g.fill();
      const lights = []; for (let k = 0; k < 9; k++) { const x = R() * TW, y = TH * (0.25 + R() * 0.3); lights.push([x, y]); glowDot(g, x, y, 10 + R() * 10, "rgba(150,240,180,A)", 0.3); }
      g.fillStyle = "#0e1e18"; g.fillRect(0, TH * 0.72, TW, TH * 0.28);
      for (const [x, y] of lights) { const ry = TH * 0.72 + (TH * 0.72 - y) * 0.25; for (let k = 0; k < 5; k++) { g.fillStyle = "rgba(170,240,190," + (0.25 - k * 0.04) + ")"; g.fillRect(x - 6 + R() * 4, ry + k * 4, 6 + R() * 8, 1); } } },
    chasm(g, R) { g.fillStyle = "#140e18"; g.fillRect(0, 0, TW, TH);
      g.lineWidth = 0.7; for (let k = 0; k < 26; k++) { const x0 = R() * TW, y0 = R() * TH * 0.4, x1 = x0 + (R() - 0.5) * 300, y1 = TH * (0.4 + R() * 0.6); g.strokeStyle = "rgba(220,200,240," + (0.06 + R() * 0.1).toFixed(2) + ")"; g.beginPath(); g.moveTo(x0, y0); g.quadraticCurveTo((x0 + x1) / 2 + 30, (y0 + y1) / 2 + 30, x1, y1); g.stroke(); }
      for (let k = 0; k < 8; k++) glowDot(g, R() * TW, R() * TH, 14, "rgba(210,150,255,A)", 0.25); for (let k = 0; k < 6; k++) { g.fillStyle = "rgba(180,170,190,.25)"; g.beginPath(); g.ellipse(R() * TW, TH * (0.3 + R() * 0.5), 4, 9, 0, 0, TAU); g.fill(); } },
    belltower(g, R) { g.fillStyle = "#1a1410"; g.fillRect(0, 0, TW, TH);
      g.fillStyle = "#2a2018"; for (let k = 0; k < 6; k++) { const y = TH * (0.15 + k * 0.15); g.fillRect(0, y, TW, 5); for (let x = R() * 60; x < TW; x += 90 + R() * 40) { g.save(); g.translate(x, y); g.rotate(0.7); g.fillRect(0, 0, 60, 4); g.restore(); } }
      for (let k = 0; k < 4; k++) { const x = 60 + k * 120 + R() * 30, y = TH * (0.3 + R() * 0.3), s = 0.6 + R() * 0.5; g.strokeStyle = "#2a2018"; g.lineWidth = 1; g.beginPath(); g.moveTo(x, 0); g.lineTo(x, y); g.stroke(); g.fillStyle = "#3a2a18"; g.beginPath(); g.moveTo(x - 6 * s, y); g.quadraticCurveTo(x - 8 * s, y + 14 * s, x - 18 * s, y + 24 * s); g.lineTo(x + 18 * s, y + 24 * s); g.quadraticCurveTo(x + 8 * s, y + 14 * s, x + 6 * s, y); g.fill(); g.fillStyle = "rgba(255,210,140,.15)"; g.fillRect(x - 10 * s, y + 6 * s, 3 * s, 16 * s); }
      const hz = g.createLinearGradient(0, 0, 0, TH); hz.addColorStop(0, "rgba(255,200,140,.08)"); hz.addColorStop(1, "rgba(20,14,10,.5)"); g.fillStyle = hz; g.fillRect(0, 0, TW, TH); },
    forge(g, R) { g.fillStyle = "#1a0e0a"; g.fillRect(0, 0, TW, TH);
      for (let k = 0; k < 5; k++) { const x = 40 + k * 100 + R() * 30, w = 30 + R() * 20, top = TH * (0.1 + R() * 0.2); g.fillStyle = "#2a1a14"; g.fillRect(x, top, w, TH - top); g.fillRect(x - 10, TH * 0.6, w + 20, TH * 0.4); glowDot(g, x + w / 2, TH * 0.72, 40, "rgba(255,110,40,A)", 0.45); g.fillStyle = "rgba(255,160,70,.7)"; g.fillRect(x, TH * 0.7, w, 4); }
      const hz = g.createLinearGradient(0, 0, 0, TH); hz.addColorStop(0, "rgba(20,10,8,.6)"); hz.addColorStop(1, "rgba(80,30,10,.25)"); g.fillStyle = hz; g.fillRect(0, 0, TW, TH); }
  };
  PAINT.embercity = PAINT.forge; PAINT.spires = null;
  function spr(bg) { let cv = SPR.get(bg); if (cv !== undefined) return cv; const P = PAINT[bg]; if (!P) { SPR.set(bg, null); return null; } cv = document.createElement("canvas"); cv.width = TW * RS; cv.height = TH * RS; const g = cv.getContext("2d"); g.scale(RS, RS); try { P(g, rnd(bg.length * 977 + 5)); } catch (e) { console.error(e); } SPR.set(bg, cv); return cv; }
  /* gezeichnet vor dem übrigen Mittelgrund-Leben, nur in Gewölbe- und Höhlenöffnungen (dort malt der Chunk sonst ein
     dunkles Inneres), halbtransparent und mit eigener, langsamer Parallaxe */
  const mid0 = Z.drawMidLife;
  Z.drawMidLife = function (c, cam, t) {
    const lv = Z.level, B = Z.biome;
    if (lv && !lv.hub && !lv.arena && !lv.out && on() && B) try {
      const cv = spr(B.bg);
      if (cv) {
        const ops = G.openings || []; let any = false;
        c.save(); c.beginPath();
        /* große Öffnungen und Schächte zeigen die Ferne kräftiger (bis 0,85), kleine nur angedeutet */
        let area = 0;
        for (const o of ops) { if (o.blind || (o.mode !== "vault" && o.mode !== "cave")) continue; const x0 = o.x0 * T + 2, y0 = o.y0 * T + 2, x1 = (o.x1 + 1) * T - 2, y1 = (o.y1 + 1) * T - 1; if (x1 < cam.x || x0 > cam.x + cam.w || y1 < cam.y || y0 > cam.y + cam.h) continue; c.rect(x0, y0, x1 - x0, y1 - y0); any = true; area = Math.max(area, (o.x1 - o.x0 + 1) * (o.y1 - o.y0 + 1)); }
        if (any) {
          c.clip();
          const sc = Math.max(1, (cam.h * 0.9) / TH), w = TW * sc, h = TH * sc, ox = cam.x - ((cam.x * 0.15) % w + w) % w, y = cam.y + (cam.h - h) * 0.5 - cam.y * 0.03 % 30;
          c.globalAlpha = Math.min(0.85, 0.55 + area / 160); for (let x = ox; x < cam.x + cam.w; x += w) c.drawImage(cv, x, y, w + 0.5, h);
        }
        c.restore();
      }
    } catch (e) { console.error(e); }
    if (mid0) mid0.apply(this, arguments);
  };
})();

/* Ezekiel – The Destroyer · Licht der Verbindungen (Grafik-Runde 10, ab Stufe 1; Bewegung ab Stufe 2)
   Schachtöffnungen bekommen einen Lichtschein von unten bzw. oben (warm, wenn dort ein bewohnter Raum liegt),
   Gebietsausgänge leuchten in der Farbe des Zielgebiets, Sackgassen-Nischen haben einen sanften Lichtstrahl mit
   tanzendem Staub und einem Kerzenlicht am Schrein. */
(function () {
  "use strict";
  const Z = window.Z, G = Z.gfx, T = Z.TILE, TAU = Math.PI * 2;
  const lvl = () => { const q = Z.gq; if (!q) return 2; if (q.lean) return 0; return q.level === -1 ? 2 : q.level; };
  const off = () => G.off && (G.off.r10 || G.off.steinmetz);
  const inCam = (cam, x, y, m) => x > cam.x - m && x < cam.x + cam.w + m && y > cam.y - m && y < cam.y + cam.h + m;
  function targetOf(d) { const to = d.to, A = Z.ARENAS && Z.ARENAS[to]; return (Z.BIOMES && (Z.BIOMES[to] || (A && Z.BIOMES[A.base]))) || null; }
  if (G.lightGather) G.lightGather.push(function (add, cam, t) {
    const lv = Z.level; if (lvl() < 1 || !lv || Z.darkness > 0 || off()) return;
    if (Z.schaechte) for (const s of Z.schaechte()) { const x = (s.x0 + s.x1 + 1) / 2 * T, y = s.by * T; if (!inCam(cam, x, y, 100)) continue; add(x, y + 10, 70 + (s.x1 - s.x0) * 6, s.dn || s.up ? "#ffcc90" : "#e8d8c0", s.dn || s.up ? 0.2 : 0.11, 0); }
    for (const d of lv.doors || []) { if (d.kind !== "exit") continue; const x = d.x * T + 8, y = d.y * T; if (!inCam(cam, x, y, 120)) continue; const TB = targetOf(d); add(x, y - 10, 110, (TB && TB.ambCol) ? TB.ambCol : "#ffc890", 0.3 * (0.92 + 0.08 * Math.sin(t * 1.3 + d.x)), 0); }
    if (Z.nischen) for (const n of Z.nischen()) { const x = n.x * T + 8, y = (n.y + 1) * T; if (!inCam(cam, x, y, 100)) continue; add(x, y - 24, 75, "#ffd890", 0.35 * (0.9 + 0.1 * Math.sin(t * 8 + n.x)), 6); }
  });
  const mid0 = Z.drawMidLife;
  Z.drawMidLife = function (c, cam, t) {
    if (mid0) mid0.apply(this, arguments);
    const lv = Z.level; if (lvl() < 1 || !lv || off() || !Z.nischen) return;
    c.save();
    for (const n of Z.nischen()) {
      const px = n.x * T + 8, bot = (n.y + 1) * T; if (!inCam(cam, px, bot, 60)) continue;
      /* Kerze auf der Opferschale */
      const f = 1 + 0.2 * Math.sin(t * 13 + n.x) + 0.1 * Math.sin(t * 29 + n.y);
      c.fillStyle = "#e8dcc0"; c.fillRect(px + 3.5, bot - 21, 1.6, 4.5);
      c.globalCompositeOperation = "lighter"; c.fillStyle = "rgba(255,150,60,.85)"; c.beginPath(); c.moveTo(px + 3.3, bot - 21); c.quadraticCurveTo(px + 3.6, bot - 24 * 1, px + 4.3, bot - 21 - 4.5 * f); c.quadraticCurveTo(px + 5, bot - 23, px + 5.3, bot - 21); c.fill();
      if (lvl() >= 2) { /* Staub im Strahl */ for (let k = 0; k < 8; k++) { const u = (t * 0.04 * (1 + (k % 3) * 0.3) + k / 8) % 1, sx = px - 8 + ((k * 37) % 22) + u * 10 + Math.sin(t * 0.6 + k) * 2, sy = bot - 110 + u * 100; c.globalAlpha = 0.55 * Math.sin(u * Math.PI); c.fillStyle = "#ffe8c0"; c.fillRect(sx, sy, 0.8, 0.8); } c.globalAlpha = 1; }
      c.globalCompositeOperation = "source-over";
    }
    c.restore();
  };
})();
