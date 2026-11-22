/* Ezekiel – The Destroyer · Bildpracht
   Lichtstrahlen aus Fenstern mit tanzendem Staub, unscharfe Vordergrund-Silhouetten (Tiefe), Farbstimmung je Gebiet,
   Nachbilder bei Rolle und Sprint. Alles abschaltbar über die Grafikstufen (ab „Hoch“ bzw. Ebenen an). */
(function () {
  "use strict";
  const Z = window.Z, T = Z.TILE;
  const hash = (x, y) => { let h = (x * 374761393 + y * 668265263) ^ 0x5bd1e995; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
  const rich = () => !Z.gq || Z.gq.level === -1 ? (Z.gq ? Z.gq.layers !== false : true) : Z.gq.level >= 2;

  /* ---------- Lichtstrahlen (Weltkoordinaten, nach dem Licht – leuchten über die Dunkelheit) ---------- */
  function shafts(c, cam, t) {
    const lv = Z.level; if (!lv || !lv.decor) return;
    c.save(); c.globalCompositeOperation = "lighter";
    for (const d of lv.decor) {
      if (d.kind !== "window" || (Z.gfx.sky && Z.gfx.sky[d.y * lv.W + d.x])) continue;
      const x = d.x * T + 8, y = d.y * T + 6;
      if (x < cam.x - 160 || x > cam.x + cam.w + 60 || y < cam.y - 40 || y > cam.y + cam.h) continue;
      const len = 150, slant = 0.42, w0 = 10, w1 = 44, a = 0.09 + 0.025 * Math.sin(t * 0.7 + d.x);
      const g = c.createLinearGradient(x, y, x + len * slant, y + len); g.addColorStop(0, "rgba(255,226,170," + a + ")"); g.addColorStop(1, "rgba(255,210,150,0)");
      c.fillStyle = g; c.beginPath(); c.moveTo(x - w0 / 2, y); c.lineTo(x + w0 / 2, y); c.lineTo(x + len * slant + w1 / 2, y + len); c.lineTo(x + len * slant - w1 / 2, y + len); c.closePath(); c.fill();
      /* Staub im Strahl */
      for (let i = 0; i < 7; i++) {
        const k = (hash(d.x * 7 + i, d.y) + t * (0.02 + hash(i, d.x) * 0.03)) % 1, yy = y + k * len * 0.9, xx = x + k * len * 0.9 * slant + (hash(i, d.y) - 0.5) * (w0 + (w1 - w0) * k) + Math.sin(t * 0.8 + i) * 2;
        c.globalAlpha = 0.5 * Math.sin(k * Math.PI); c.fillStyle = "#fff0d0"; c.fillRect(xx, yy, 0.9, 0.9);
      }
      c.globalAlpha = 1;
    }
    c.restore();
  }

  /* ---------- Mondlicht durch große Bogenfenster: breite, sehr schwache Bahnen schräg in den Raum ---------- */
  function archShafts(c, cam, t) {
    const B = Z.biome || {}, ops = Z.gfx && Z.gfx.openings; if (!ops || !ops.length || B.open !== "arch") return;
    c.save(); c.globalCompositeOperation = "lighter";
    for (const o of ops) {
      if (o.blind) continue;
      const L = o.x0 * T, R = (o.x1 + 1) * T, Tp = o.y0 * T, Bt = (o.y1 + 1) * T;
      if (R + 200 < cam.x || L > cam.x + cam.w || Bt + 200 < cam.y || Tp > cam.y + cam.h) continue;
      const len = 170, sl = 0.5, a = 0.035 + 0.01 * Math.sin(t * 0.4 + o.x0);
      const g = c.createLinearGradient(L, Tp, L + len * sl, Tp + len); g.addColorStop(0, "rgba(240,222,205," + a + ")"); g.addColorStop(1, "rgba(240,222,205,0)");
      c.fillStyle = g; c.beginPath(); c.moveTo(L + 6, Tp + 10); c.lineTo(R - 6, Tp + 10); c.lineTo(R - 6 + len * sl, Bt + len * 0.6); c.lineTo(L + 6 + len * sl, Bt + len * 0.6); c.closePath(); c.fill();
    }
    c.restore();
  }

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
      c.globalAlpha = Math.max(0.35, Math.min(0.95, (mid - 0.1) / 0.5));
      if (kind === "chain" || kind === "rope") { const sway = Math.sin(Z.gfx.time * 0.6 + i) * 0.03; c.save(); c.translate(x + w / 2, y); c.rotate(sway); c.drawImage(spr, -w / 2, 0, w, h); c.restore(); }
      else c.drawImage(spr, x, y, w, h);
    }
    c.restore();
  }

  /* ---------- Farbstimmung: warmes Oben, schweres Unten ---------- */
  let grade = null, gradeKey = "";
  function colorGrade(c, W, H) {
    const B = Z.biome || {}, key = (B.ambCol || "") + W + "x" + H;
    if (key !== gradeKey) {
      gradeKey = key; grade = document.createElement("canvas"); grade.width = 8; grade.height = 64;
      const g = grade.getContext("2d"), n = parseInt((B.ambCol || "#3a2a2a").slice(1), 16), rgb = [Math.min(255, (n >> 16) + 60), Math.min(255, ((n >> 8) & 255) + 40), Math.min(255, (n & 255) + 20)].join(",");
      const lg = g.createLinearGradient(0, 0, 0, 64); lg.addColorStop(0, "rgba(" + rgb + ",.10)"); lg.addColorStop(0.45, "rgba(" + rgb + ",0)"); lg.addColorStop(0.7, "rgba(0,0,0,0)"); lg.addColorStop(1, "rgba(0,0,0,.22)");
      g.fillStyle = lg; g.fillRect(0, 0, 8, 64);
    }
    c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.globalCompositeOperation = "source-over"; c.drawImage(grade, 0, 0, W, H); c.restore();
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
      const r = h * (0.25 + hash(i, seed) * 0.3), x = w * (0.18 + hash(seed, i) * 0.64), y = h * (0.45 + (hash(i * 3, seed) - 0.5) * 0.4);
      const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, col.replace("A", "0.55")); gr.addColorStop(0.6, col.replace("A", "0.25")); gr.addColorStop(1, col.replace("A", "0"));
      g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2);
    }
    /* heller Rand oben (Mondlicht) */
    g.globalCompositeOperation = "source-atop"; const lg = g.createLinearGradient(0, 0, 0, h); lg.addColorStop(0, "rgba(255,236,210,.35)"); lg.addColorStop(0.5, "rgba(255,236,210,0)"); g.fillStyle = lg; g.fillRect(0, 0, w, h);
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
        const spr = cloudSprite("c" + pf, rgba(B.sky[2], 1.25), 220, 70, pf * 100);
        const span = 900;
        for (let i = 0; i < n; i++) {
          const bx = ((hash(i, pf * 7) * span + t * sp) % span) - 200, by = LH * (0.12 + hash(pf * 9, i) * 0.32);
          const wx = bx + Math.floor((cam.x - px(pf) - bx) / span) * span + px(pf);
          for (const o of [0, span]) { const x = wx + o; if (x > cam.x + cam.w || x + 220 * sc < cam.x) continue; c.globalAlpha = a * (0.6 + hash(i, 3) * 0.4); c.drawImage(spr, x, oy + by, 220 * sc, 70 * sc); }
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
        if (kind === "castle" || kind === "camp" || kind === "harbour" || kind === "ramparts") {
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
        const hy = oy + LH * 0.6; c.save(); c.globalAlpha = 0.22;
        for (let i = 0; i < 3; i++) { const x = cam.x - ((t * (4 + i * 2) + i * 140) % 300), g = c.createLinearGradient(0, hy - 14, 0, hy + 14); g.addColorStop(0, "rgba(220,200,200,0)"); g.addColorStop(0.5, "rgba(220,200,200,.6)"); g.addColorStop(1, "rgba(220,200,200,0)"); c.fillStyle = g; c.fillRect(x, hy - 14 + i * 9, cam.w + 320, 28); }
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
    shafts(c, cam, t);
    archShafts(c, cam, t);
    foreground(c, cam, W, H, Z.gfx.scale);
    colorGrade(c, W, H);
  };
})();
