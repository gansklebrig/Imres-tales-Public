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
          if (hash(n, 21) > 0.45 && k < 0.25) { c.save(); c.globalCompositeOperation = "lighter"; c.globalAlpha = (0.25 - k) * (kind === "storm" ? 1.6 : 0.8); c.fillStyle = kind === "storm" ? "#e8f0d8" : "#ffb070"; c.fillRect(cam.x, oy, cam.w, LH * 0.6); c.restore();
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
  const TAU = Math.PI * 2;
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
  function wall(H) {
    const { c, x0, y0, x1, y1, T, B, st, PAL, lit, mixH, rgba, h3, isWall, floorBelow } = H, bg = B.bg, wl = st.wall;
    patina(H, false);
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
  /* ---------- Fels: Patina, Kanten, Einschlüsse, Laufflächen ---------- */
  const DEBRIS = { castle: "leaf", ramparts: "leaf", storm: "leaf", camp: "leaf", cellar: "straw", harbour: "shell", dungeon: "bone", chasm: "bone", lake: "shroom", forge: "ash", embercity: "ash", spires: "ash", halls: "petal", belltower: "feather" };
  function rock(H) {
    const { c, x0, y0, x1, y1, T, B, st, lv, PR, lit, mixH, rgba, h3, sol } = H, tl = B.tile, bg = B.bg, W = lv.W;
    patina(H, true);
    const black = (x, y) => lv.get(x, y - 1) === 9;
    for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) {
      if (!sol(x, y) || black(x, y) || (y === 0 && lv.out)) continue;
      const d = PR.dep[y * W + x], px = x * T, py = y * T, r = h3(x, y, 611), r2 = h3(x, y, 612), r3 = h3(x, y, 613);
      const aU = !sol(x, y - 1), aD = !sol(x, y + 1), aL = !sol(x - 1, y), aR = !sol(x + 1, y);
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
        if (mossy && h3(x, y, 813) < 0.25) { for (let k = 0; k < 6; k++) { c.fillStyle = k % 2 ? "rgba(70,100,44,.7)" : "rgba(110,140,60,.6)"; c.fillRect(px + h3(x, y, 820 + k) * 15, py - 0.6 + h3(x, y, 830 + k) * 0.6, 1.2 + h3(x, y, 840 + k), 0.9); } }
      } else if (v === 8 && r < 0.4) {
        /* Steinstufe: Abnutzung und abgeschlagene Kante */
        c.fillStyle = "rgba(255,240,220,.06)"; c.fillRect(px + 3, py + 0.4, T - 6, 0.8); c.fillStyle = "rgba(0,0,0,.4)"; c.beginPath(); c.moveTo(px + 6 + r * 10, py); c.lineTo(px + 8 + r * 10, py); c.lineTo(px + 7 + r * 10, py + 1.6); c.fill();
      }
    }
  }
  G.tileHooks.push(function (k, H) {
    if (Z.gfx.off && Z.gfx.off.steinmetz) return;
    const P = Z.gfx.stProf, t0 = P ? performance.now() : 0;
    if (k === "wall") wall(H); else if (k === "rock") rock(H); else if (k === "fix") { floorBits(H); fix(H); }
    if (P) { H.c.getImageData(0, 0, 1, 1); P[k] = (P[k] || 0) + performance.now() - t0; }
  });
})();
