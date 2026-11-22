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
      if (d.kind !== "window") continue;
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

  /* ---------- Vordergrund-Silhouetten (Bildschirmkoordinaten, schneller als die Welt: Tiefe) ---------- */
  const FG = { castle: "pillar", cellar: "chain", halls: "pillar", ramparts: "pillar", dungeon: "chain", harbour: "rope", belltower: "chain", chasm: "stalactite", forge: "chain", spires: "pillar", lake: "stalactite", embercity: "stalactite", storm: "pillar" };
  function foreground(c, cam, W, H, S) {
    const B = Z.biome || {}, lv = Z.level; if (!lv || lv.hub || lv.arena || lv.passage) return;
    const kind = FG[B.bg] || "pillar", f = 1.35, span = 330;
    const sx = cam.x * f, i0 = Math.floor(sx / span) - 1, i1 = Math.floor((sx + cam.w * 1.1) / span) + 1;
    c.save(); c.setTransform(S, 0, 0, S, 0, 0);
    const col = "rgba(8,5,7,.92)";
    for (let i = i0; i <= i1; i++) {
      const r = hash(i, lv.seed || 3); if (r < 0.45) continue;
      const x = i * span + r * 120 - sx, w = 18 + r * 26;
      c.fillStyle = col;
      if (kind === "pillar") {
        const top = r > 0.75; /* von oben hängend oder von unten aufragend */
        const g = c.createLinearGradient(x - w, 0, x + w, 0); g.addColorStop(0, "rgba(8,5,7,0)"); g.addColorStop(0.25, col); g.addColorStop(0.75, col); g.addColorStop(1, "rgba(8,5,7,0)"); c.fillStyle = g;
        if (top) c.fillRect(x - w, 0, w * 2, cam.h * (0.18 + r * 0.1)); else c.fillRect(x - w, cam.h * (0.82 - r * 0.08), w * 2, cam.h);
      } else if (kind === "chain" || kind === "rope") {
        const len = cam.h * (0.3 + r * 0.35), sway = Math.sin(Z.gfx.time * 0.6 + i) * 4;
        c.strokeStyle = col; c.lineWidth = kind === "rope" ? 3 : 4; c.beginPath(); c.moveTo(x, -4); c.quadraticCurveTo(x + sway, len * 0.5, x + sway * 1.5, len); c.stroke();
        if (kind === "chain") { c.fillStyle = col; c.beginPath(); c.ellipse(x + sway * 1.5, len + 6, 7, 9, 0, 0, 6.283); c.fill(); }
      } else if (kind === "stalactite") {
        c.beginPath(); c.moveTo(x - w, -2); c.lineTo(x + w, -2); c.lineTo(x + w * 0.2, cam.h * (0.18 + r * 0.16)); c.closePath(); c.fill();
        if (r > 0.7) { c.beginPath(); c.moveTo(x + 60 - w, cam.h + 2); c.lineTo(x + 60 + w, cam.h + 2); c.lineTo(x + 60, cam.h * (0.86 - r * 0.08)); c.closePath(); c.fill(); }
      }
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
    foreground(c, cam, W, H, Z.gfx.scale);
    colorGrade(c, W, H);
  };
})();
