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

  /* ---------- Einhängen in das Bild ---------- */
  Z.drawBeforePlayer = function (c) { drawGhosts(c); };
  Z.drawAfterLight = function (c, cam, W, H, t) {
    if (!rich()) return;
    shafts(c, cam, t);
    foreground(c, cam, W, H, Z.gfx.scale);
    colorGrade(c, W, H);
  };
})();
