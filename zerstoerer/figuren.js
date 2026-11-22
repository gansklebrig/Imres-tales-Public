/* Ezekiel – The Destroyer · Figuren
   Alles wird mit Vektoren gezeichnet: Ezekiel (mit Umhangphysik), Gegner, Bosse, Gefährten, Waffen und Symbole.
   Koordinaten lokal: Ursprung zwischen den Füßen, Blick nach rechts. */
(function () {
  "use strict";
  const Z = window.Z, U = Z.U, PI = Math.PI;

  /* ---------- Zeichenhilfen ---------- */
  function limb(c, x1, y1, x2, y2, w, col) { c.strokeStyle = col; c.lineWidth = w; c.lineCap = "round"; c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.stroke(); }
  function circ(c, x, y, r, col) { c.fillStyle = col; c.beginPath(); c.arc(x, y, r, 0, PI * 2); c.fill(); }
  function poly(c, pts, col) { c.fillStyle = col; c.beginPath(); c.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 2) c.lineTo(pts[i], pts[i + 1]); c.closePath(); c.fill(); }
  function ell(c, x, y, rx, ry, col, rot) { c.fillStyle = col; c.beginPath(); c.ellipse(x, y, rx, ry, rot || 0, 0, PI * 2); c.fill(); }
  /* Leuchten: vorgerenderte Verläufe je Farbe (deutlich schneller als jedes Mal einen Verlauf zu bauen) */
  const GLOW = new Map();
  function glowSprite(col) {
    let cv = GLOW.get(col); if (cv) return cv;
    cv = document.createElement("canvas"); cv.width = cv.height = 64; const g = cv.getContext("2d");
    const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, col); gr.addColorStop(1, "rgba(0,0,0,0)"); g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
    if (GLOW.size > 300) GLOW.clear(); GLOW.set(col, cv); return cv;
  }
  function glow(c, x, y, r, col, a) {
    if (r <= 0) return;
    const pa = c.globalAlpha, po = c.globalCompositeOperation;
    c.globalCompositeOperation = "lighter"; c.globalAlpha = pa * (a == null ? 1 : a);
    c.drawImage(glowSprite(col), x - r, y - r, r * 2, r * 2);
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

  /* ======================= WAFFEN IN DER HAND ======================= */
  /* zeichnet die Waffe am Ursprung, Griff am Ursprung, Klinge entlang +x */
  function weapon(c, icon, col, t, ext) {
    switch (icon) {
      case "sickles": case "sickle":
        limb(c, -2, 0, 3, 0, 2, "#2a1e1a");
        c.strokeStyle = "#c8c0b8"; c.lineWidth = 2; c.beginPath(); c.arc(6, -5, 7, 0.6, 2.6); c.stroke();
        c.strokeStyle = col; c.lineWidth = 1; c.beginPath(); c.arc(6, -5, 6, 0.7, 2.5); c.stroke(); break;
      case "dagger": limb(c, -2, 0, 2, 0, 2, "#2a1e2a"); poly(c, [2, -1.5, 12, 0, 2, 1.5], "#d8d0e8"); limb(c, 2, -3, 2, 3, 1.2, col); break;
      case "dawn": {
        limb(c, -4, 0, 3, 0, 2.4, "#5a3a1a"); limb(c, 3, -4, 3, 4, 2, "#e5b454");
        poly(c, [3, -2, 26, -1, 29, 0, 26, 1, 3, 2], "#fff4d8");
        glow(c, 16, 0, 18, "rgba(255,220,140,.55)"); limb(c, 4, 0, 26, 0, 0.8, "#ffd27a"); break;
      }
      case "hammer": limb(c, -4, 0, 18, 0, 2.4, "#5a4030"); poly(c, [14, -7, 24, -7, 24, 7, 14, 7], "#6a6a72"); poly(c, [14, -7, 24, -7, 24, -4, 14, -4], "#9a9aa4"); limb(c, 19, -6, 19, 6, 1, col); break;
      case "scythe": limb(c, -6, 0, 26, 0, 2, "#4a3020"); c.fillStyle = "#c8c0c8"; c.beginPath(); c.moveTo(26, 0); c.quadraticCurveTo(28, -18, 8, -22); c.quadraticCurveTo(22, -14, 24, 0); c.fill(); c.strokeStyle = col; c.lineWidth = 0.8; c.beginPath(); c.moveTo(25, -2); c.quadraticCurveTo(26, -15, 10, -20); c.stroke(); break;
      case "whip": limb(c, -2, 0, 4, 0, 2.2, "#3a2a20"); if (!ext) { c.strokeStyle = "#8a7a6a"; c.lineWidth = 1.2; c.beginPath(); c.moveTo(4, 0); c.quadraticCurveTo(10, 8, 6, 12); c.stroke(); } break;
      case "spear": limb(c, -12, 0, 30, 0, 1.8, "#6a4a30"); poly(c, [30, -4, 38, -1, 38, 1, 30, 4, 32, 0], "#d8706a"); limb(c, 30, -4, 34, -6, 1.2, "#e08a80"); break;
      case "axe": limb(c, -4, 0, 16, 0, 2.2, "#5a3a20"); c.fillStyle = "#7a6a62"; c.beginPath(); c.moveTo(12, -1); c.quadraticCurveTo(22, -10, 20, -11); c.lineTo(18, 7); c.quadraticCurveTo(22, 4, 12, 2); c.fill(); glow(c, 18, -2, 9, "rgba(255,120,40,.6)"); limb(c, 19, -8, 18, 5, 1, "#ff7a2a"); break;
      case "club": limb(c, -4, 0, 8, 0, 3, "#5a4030"); poly(c, [8, -4, 26, -8, 30, -2, 28, 6, 8, 4], "#7a6050"); circ(c, 16, -3, 1.5, "#5a4a3a"); circ(c, 24, 2, 1.5, "#5a4a3a"); break;
      case "rapier": limb(c, -2, 0, 2, 0, 2, "#3a3020"); c.strokeStyle = col; c.lineWidth = 1.2; c.beginPath(); c.arc(1, 0, 3, -1.5, 1.5); c.stroke(); limb(c, 2, 0, 26, 0, 1.2, "#e8f0d0"); limb(c, 20, 0, 26, 0, 1.4, col); break;
      case "scimitar": limb(c, -2, 0, 2, 0, 2, "#2a1e2a"); c.fillStyle = "#d8d0e8"; c.beginPath(); c.moveTo(2, -1); c.quadraticCurveTo(12, -4, 18, -1); c.quadraticCurveTo(12, 1, 2, 1.5); c.fill(); limb(c, 2, 0, 14, -2, 0.6, col); break;
      case "claw": circ(c, 0, 0, 3, "#3a3a30"); poly(c, [2, -2, 14, -1, 2, 1], "#d8c040"); poly(c, [1, 1, 10, 4, 1, 3], "#b8a030"); break;
      case "anchor": limb(c, -2, 0, 20, 0, 2.4, "#6a5a4a"); c.strokeStyle = "#8a7a6a"; c.lineWidth = 3; c.beginPath(); c.arc(20, 0, 7, -PI / 2 - 1, -PI / 2 + 1, true); c.stroke(); limb(c, 4, -4, 4, 4, 2, "#8a7a6a"); break;
      case "stonefist": circ(c, 2, 0, 5, "#7a6a5a"); circ(c, 3, -1, 3, "#9a8a78"); glow(c, 2, 0, 7, "rgba(255,150,60,.5)"); break;
      case "fist": circ(c, 1, 0, 3.2, "#3a2e2a"); circ(c, 1.5, -0.5, 1.8, "#4a3a34"); break;
      case "bow": c.strokeStyle = "#7a5a30"; c.lineWidth = 2; c.beginPath(); c.arc(-6, 0, 12, -1.1, 1.1); c.stroke(); limb(c, -6 + Math.cos(-1.1) * 12, Math.sin(-1.1) * 12, -6 - (ext || 0) * 8, 0, 0.6, "#e8e0d0"); limb(c, -6 - (ext || 0) * 8, 0, -6 + Math.cos(1.1) * 12, Math.sin(1.1) * 12, 0.6, "#e8e0d0"); break;
      case "xbow": limb(c, -4, 0, 14, 0, 2.6, "#5a4030"); c.strokeStyle = "#6a5a4a"; c.lineWidth = 1.8; c.beginPath(); c.arc(10, 0, 8, -1.3, 1.3); c.stroke(); limb(c, 4, 0, 14, 0, 0.8, "#e8e0d0"); break;
      case "knives": poly(c, [0, -1, 8, 0, 0, 1], "#e0d8d0"); poly(c, [-1, 2, 6, 3, -1, 4], "#c0b8b0"); break;
      case "vial": circ(c, 3, 0, 3.2, col); limb(c, 3, -3, 3, -5, 1.6, "#e0d8c0"); glow(c, 3, 0, 6, "rgba(130,210,110,.5)"); break;
      case "staff": limb(c, -10, 0, 22, 0, 1.8, "#5a4a30"); circ(c, 23, 0, 3, "#e8e070"); glow(c, 23, 0, 9, "rgba(240,230,110,.6)"); break;
      case "web": ell(c, 3, 0, 5, 3.5, "#d8d0dc"); circ(c, 7, 0, 1.6, "#a8a0b0"); break;
      case "shield": c.fillStyle = "#6a5a4a"; c.fillRect(-2, -12, 7, 24); c.fillStyle = "#8a7a62"; c.fillRect(-1, -11, 5, 22); limb(c, 1.5, -11, 1.5, 11, 1, "#c8a060"); break;
      case "goldshield": ell(c, 1, 0, 5, 11, "#c8902a"); ell(c, 1.5, 0, 3.5, 9, "#ffd27a"); circ(c, 1.5, 0, 2, "#e0a040"); break;
      case "thornshield": ell(c, 1, 0, 5, 10, "#5a4a2a"); for (let i = -8; i <= 8; i += 4) poly(c, [5, i - 1, 9, i, 5, i + 1], "#8a6a3a"); break;
      default: if (Z.WICON && Z.WICON[icon]) Z.WICON[icon](c, col, t);
    }
  }
  Z.drawWeapon = weapon;

  /* ======================= EZEKIEL ======================= */
  const CAPE_N = 7, CAPE_L = 3.6;
  function capeInit(P) { P.cape = []; for (let i = 0; i < CAPE_N; i++) P.cape.push({ x: P.x + P.w / 2, y: P.y + 6 + i * CAPE_L, ox: P.x + P.w / 2, oy: P.y + 6 + i * CAPE_L }); }
  Z.capeUpdate = function (P, dt) {
    if (!P.cape) capeInit(P);
    const pts = P.cape;
    const roll = P.rollT > 0;
    const ax = P.x + P.w / 2 - P.face * 3, ay = P.y + (roll ? 14 : 7);
    pts[0].x = ax; pts[0].y = ay;
    const wind = (Z.windX || 0) + Math.sin(P.time * 2.3) * 8;
    for (let i = 1; i < CAPE_N; i++) {
      const p = pts[i]; const vx = (p.x - p.ox) * 0.9, vy = (p.y - p.oy) * 0.9;
      p.ox = p.x; p.oy = p.y;
      p.x += vx + (wind - P.face * 12) * dt * dt * 60; p.y += vy + 420 * dt * dt;
    }
    for (let k = 0; k < 3; k++) for (let i = 1; i < CAPE_N; i++) {
      const a = pts[i - 1], b = pts[i], dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 1, diff = (d - CAPE_L) / d;
      b.x -= dx * diff; b.y -= dy * diff;
      /* nicht vor den Körper schwingen */
      if (P.face > 0 && b.x > P.x + P.w / 2 + 2) b.x = U.lerp(b.x, P.x + P.w / 2 + 2, 0.3);
      if (P.face < 0 && b.x < P.x + P.w / 2 - 2) b.x = U.lerp(b.x, P.x + P.w / 2 - 2, 0.3);
      if (Z.world.solidAt(b.x, b.y)) { b.y -= 1; }
    }
  };
  function drawCape(c, P, alpha) {
    const pts = P.cape; if (!pts) return;
    const w0 = 6.5;
    c.save(); c.globalAlpha = alpha;
    const g = c.createLinearGradient(0, pts[0].y, 0, pts[CAPE_N - 1].y + 4); g.addColorStop(0, "#8a1414"); g.addColorStop(1, "#4a0a0c");
    c.fillStyle = g; c.beginPath();
    const left = [], right = [];
    for (let i = 0; i < CAPE_N; i++) {
      const p = pts[i], q = pts[Math.min(CAPE_N - 1, i + 1)], r0 = pts[Math.max(0, i - 1)];
      const dx = q.x - r0.x, dy = q.y - r0.y, d = Math.hypot(dx, dy) || 1, nx = -dy / d, ny = dx / d;
      const w = w0 * (0.55 + i / CAPE_N * 0.7);
      left.push([p.x + nx * w * 0.5, p.y + ny * w * 0.5]); right.push([p.x - nx * w * 0.5, p.y - ny * w * 0.5]);
    }
    c.moveTo(left[0][0], left[0][1]);
    for (const p of left) c.lineTo(p[0], p[1]);
    /* ausgefranster Saum */
    const L0 = left[CAPE_N - 1], R0 = right[CAPE_N - 1];
    for (let k = 0; k <= 4; k++) { const t = k / 4; c.lineTo(U.lerp(L0[0], R0[0], t) + Math.sin(P.time * 9 + k) * 0.6, U.lerp(L0[1], R0[1], t) + (k % 2 ? 2.8 : -0.5)); }
    for (let i = CAPE_N - 1; i >= 0; i--) c.lineTo(right[i][0], right[i][1]);
    c.closePath(); c.fill();
    c.restore();
  }

  Z.drawPlayer = function (c, P, time) {
    if (!P.cape) capeInit(P);
    const flick = P.iframe > 0 && P.hurtT <= 0 && P.rollT <= 0 && !P.ledge && Math.floor(time * 20) % 2 === 0 && P.iframe < 0.7 && P.iframe > 0.05 && !(P.act && P.act.dash);
    const alpha = P.invis > 0 ? 0.28 : flick ? 0.45 : 1;
    const cx = P.x + P.w / 2, fy = P.y + P.h;
    /* Glut-Aura bei Darkin-Zorn */
    if (P.wrath > 0) { glow(c, cx, P.y + 14, 30 + Math.sin(time * 10) * 4, "rgba(255,40,40,.45)"); if (Math.random() < 0.5) Z.fx.p({ x: cx + (Math.random() - 0.5) * 14, y: P.y + Math.random() * P.h, vx: 0, vy: -40, life: 0.5, size: 2, col: "#ff3a2a", kind: "glow", add: true }); }
    /* Umhang (in Weltkoordinaten) */
    if (P.rollT <= 0 && !P.dead) drawCape(c, P, alpha);
    c.save(); c.translate(cx, fy); c.scale(P.face, 1); c.globalAlpha = alpha;
    /* Streckung im Sprung, Stauchung bei der Landung (Squash & Stretch) */
    if (!P.onGround && P.rollT <= 0 && !P.climbing && !P.ledge) { const k = Math.max(-1, Math.min(1, -P.vy / 420)); if (k > 0.15) c.scale(1 - k * 0.07, 1 + k * 0.1); else if (k < -0.6) c.scale(1 + 0.03, 1 - 0.03); }
    const A = P.anim, act = P.act;
    const run = P.onGround && Math.abs(P.vx) > 30 && !act;
    const ph = A.run;
    let lean = 0, bob = 0, squash = A.land * 0.18;
    /* Rolle: Ball mit Hörnern */
    if (P.rollT > 0) {
      const k = 1 - P.rollT / Z.PC.ROLL;
      c.translate(0, -9); c.rotate(k * PI * 2);
      ell(c, 0, 0, 9, 8, "#2a1e22"); ell(c, 0, 0, 7, 6, "#3a2628");
      poly(c, [-3, -8, 0, -14, 2, -8], "#1a1214"); poly(c, [3, -7, 7, -12, 6, -6], "#1a1214");
      ell(c, 0, 1, 9.5, 5, "#7a1414");
      circ(c, 4, -2, 1, "#ffb040");
      c.restore(); return;
    }
    if (P.dead) {
      c.rotate(-PI / 2 * Math.min(1, (time - (P.deadAt || time)) * 3)); c.translate(-2, 0);
    }
    /* Grundhaltung */
    let legA1 = 0, legA2 = 0, kneeA1 = 0, kneeA2 = 0;
    let armF = 0.5, armB = 0.6, foreF = 0.3, foreB = 0.4;
    if (run) {
      lean = 0.18; bob = Math.abs(Math.sin(ph * PI)) * 1.5;
      legA1 = Math.sin(ph * PI) * 0.85; legA2 = -Math.sin(ph * PI) * 0.85;
      kneeA1 = Math.max(0, -Math.cos(ph * PI)) * 1.1; kneeA2 = Math.max(0, Math.cos(ph * PI)) * 1.1;
      armF = -Math.sin(ph * PI) * 0.8 + 0.4; armB = Math.sin(ph * PI) * 0.8 + 0.4;
    } else if (P.climbing) {
      const cl = Math.sin((P.anim.climb || 0) * PI * 2);
      legA1 = 0.4 + cl * 0.5; legA2 = 0.4 - cl * 0.5; kneeA1 = 0.9; kneeA2 = 0.9;
      armF = -1.9 + cl * 0.4; armB = -1.9 - cl * 0.4; foreF = -0.2; foreB = -0.2; lean = -0.05;
    } else if (P.ledge) {
      legA1 = 0.6; legA2 = 0.2; kneeA1 = 1.2; kneeA2 = 0.6; armF = -1.4; armB = -1.3; lean = 0.25;
    } else if (!P.onGround) {
      if (P.vy < 0) { legA1 = 0.7; legA2 = -0.2; kneeA1 = 1.3; kneeA2 = 0.4; armF = -0.6; armB = 0.9; }
      else { legA1 = 0.25; legA2 = -0.15; kneeA1 = 0.5; kneeA2 = 0.3; armF = -0.9; armB = -0.5; }
      if (P.plunge) { legA1 = 0.9; legA2 = 0.7; kneeA1 = 1.5; kneeA2 = 1.4; armF = 1.4; armB = 1.2; lean = 0.3; }
    } else {
      bob = Math.sin(A.t * 2.2) * 0.6;
      legA1 = 0.12; legA2 = -0.12; kneeA1 = 0.08; kneeA2 = 0.1;
      if (P.lookDown) { squash += 0.2; kneeA1 = 0.7; kneeA2 = 0.7; }
    }
    if (P.hurtT > 0) { lean = -0.35; armF = -0.4; armB = 0.2; }
    if (P.drinkT > 0) { armF = -2.3; foreF = -0.9; }
    /* Waffenhaltung */
    let wAng = null, wIcon = null, wCol = "#fff", wIcon2 = null, wExt = 0, wA2 = null;
    const slotItem = s => P.slots[s];
    const curW = act && (act.type === "melee" || act.type === "shot" || act.type === "charge" || act.type === "shield" || act.type === "shieldDown") ? act.d : null;
    if (curW) {
      wIcon = curW.icon; wCol = curW.col;
      if (act.type === "melee") {
        const sm = act.def.smear || { a0: -1, a1: 1 };
        const preK = act.phase === "pre" ? act.t / Math.max(0.01, act.def.pre) : 1;
        const actK = act.phase === "act" ? Math.min(1, act.t / Math.max(0.01, act.def.act)) : act.phase === "post" ? 1 : 0;
        let a;
        if (sm.stab) { a = 0; wExt = act.phase === "pre" ? -4 * preK : act.phase === "act" ? 6 * (1 - Math.abs(actK - 0.5) * 2) + 4 : 2; }
        else if (act.phase === "pre") a = U.lerp(sm.a0 + 0.3 * U.sign(sm.a0 - sm.a1), sm.a0 - 0.5 * U.sign(sm.a1 - sm.a0), U.easeOut(preK));
        else a = U.lerp(sm.a0, sm.a1, U.easeOut(actK));
        if (act.def.spin) a = act.phase === "act" ? -PI + actK * PI * 2 : a;
        wAng = a; lean = act.phase === "pre" ? -0.08 : 0.22;
        armF = wAng; foreF = 0;
        if (curW.icon === "sickles" || curW.icon === "scimitar") { wIcon2 = curW.icon; wA2 = wAng + (act.step % 2 ? 0.8 : -0.9); }
        if (curW.icon === "whip" && act.phase !== "pre") wExt = 1;
        if (act.phase === "act" || (act.phase === "post" && act.t < 0.05)) { legA1 = 0.45; legA2 = -0.5; kneeA1 = 0.4; kneeA2 = 0.2; }
      } else if (act.type === "shot") { wAng = -0.05; armF = -0.05; armB = -0.3; foreB = -0.4; lean = -0.05; }
      else if (act.type === "charge") { wAng = 0; armF = 0; armB = -0.1; foreB = PI - 0.3; wExt = act.charge || 0; lean = -0.08; legA1 = 0.3; legA2 = -0.3; }
      else if (act.type === "shield" || act.type === "shieldDown") { wAng = -0.1; armF = -0.2; foreF = -1.2; lean = 0.08; legA1 = 0.35; legA2 = -0.35; kneeA1 = 0.4; }
    } else if (!P.climbing && !P.ledge && !P.dead) {
      /* Waffe in Ruhe: erste Waffe in der vorderen Hand */
      const it = slotItem("a1") || slotItem("a2"); const d = it ? Z.WEAPONS[it.id] : null;
      if (d && d.kind !== "shield") {
        wIcon = d.icon; wCol = d.col;
        const big = ["dawn", "hammer", "scythe", "spear", "club", "anchor", "axe", "staff"].includes(d.icon);
        if (big) { armF = -0.4 + Math.sin(A.t * 2) * 0.04; foreF = -1.6; wAng = -2.5; }
        else wAng = armF + 0.9 + (run ? 0.3 : 0);
        if (d.icon === "sickles" || d.icon === "scimitar") { wIcon2 = d.icon; wA2 = armB + 1.0; }
      }
    }
    const hipY = -13 + bob * 0.4 + squash * 6;
    c.translate(0, 0);
    /* Beine */
    const legCol = "#1e1618", legCol2 = "#2a1e20";
    const drawLeg = (a, k, back) => { const hx = back ? -2 : 2; const [fx, fy2] = seg2(c, hx, hipY, PI / 2 + a, 7, PI / 2 + a - k * 0.0 + k, 7.2, 4.2, back ? "#160f11" : legCol, back ? "#1c1416" : legCol2); ell(c, fx + 1.5, fy2 + 0.3, 3.2, 1.6, back ? "#120c0e" : "#1a1214"); };
    drawLeg(legA2, kneeA2, true);
    /* hinterer Arm */
    const shY = hipY - 11 - squash * 2, shX = 1 + lean * 6;
    const backArm = () => { const [hx, hy] = seg2(c, shX - 3, shY + 1, PI / 2 + armB, 6, PI / 2 + armB + foreB, 6, 3.6, "#1a1214", "#221a1c"); if (wIcon2 && wA2 != null) { c.save(); c.translate(hx, hy); c.rotate(wA2); weapon(c, wIcon2, wCol, time); c.restore(); } else if (act && act.type === "charge") { circ(c, hx, hy, 1.6, "#2a1e20"); } };
    backArm();
    /* Rumpf */
    c.save(); c.translate(0, hipY); c.rotate(lean);
    poly(c, [-5, 0, 5, 0, 7, -12, 5, -14, -5, -14, -6, -11], "#241a1d");
    poly(c, [-4, -2, 4, -2, 5.5, -11, -4.5, -11], "#2e2124");
    /* glühende Nähte */
    const pulse = 0.6 + 0.4 * Math.sin(time * 3 + 1);
    c.strokeStyle = "rgba(255," + (90 + pulse * 60 | 0) + ",40," + (0.55 + pulse * 0.35) + ")"; c.lineWidth = 0.7;
    c.beginPath(); c.moveTo(-3, -3); c.lineTo(0, -7); c.lineTo(3, -4); c.moveTo(0, -7); c.lineTo(0, -11); c.stroke();
    circ(c, 0.5, -8, 1.1, "#ff7a2a"); glow(c, 0.5, -8, 5, "rgba(255,110,40,.45)", alpha);
    /* Gürtel mit kleinen Schädeln */
    limb(c, -5, -1, 5, -1, 1.6, "#3a2a22");
    circ(c, -3, 0.5, 1.2, "#d8ccb0"); circ(c, 1, 0.8, 1.2, "#d8ccb0"); circ(c, 4, 0.3, 1.1, "#d8ccb0");
    /* Schulterpanzer mit Dornen */
    poly(c, [-6, -13, -2, -16, 3, -15, 7, -12, 3, -11, -4, -11], "#1a1214");
    poly(c, [4, -14, 9, -18, 6, -12], "#140e10"); poly(c, [-3, -15, -5, -19, -1, -15], "#140e10");
    /* Kopf: Kapuze, Hörner, Schädelmaske */
    c.translate(1.5, -15);
    poly(c, [-6, 2, -5, -6, -1, -9, 4, -8, 6, -3, 6, 2], "#8a1616");
    poly(c, [-6, 2, -5, -6, -3, -7, -3, 2], "#6a1010");
    /* Hörner (schwarz, nach hinten oben gebogen) */
    c.fillStyle = "#120c0e";
    c.beginPath(); c.moveTo(-2, -7); c.quadraticCurveTo(-9, -10, -7, -17); c.quadraticCurveTo(-6, -12, 0, -8.5); c.fill();
    c.beginPath(); c.moveTo(2, -8); c.quadraticCurveTo(3, -14, 7, -17); c.quadraticCurveTo(4, -12, 4.5, -7.5); c.fill();
    /* Maske im Schatten */
    poly(c, [0, -5, 5.5, -4, 6, 0, 3.5, 2, 0.5, 1], "#100a0c");
    poly(c, [2, -4.2, 5.2, -3.6, 5.4, -0.5, 3.4, 1.2, 2, 0.5], "#cfc3ad");
    const eye = P.anim.blink > 0 ? 0.2 : 1;
    c.fillStyle = "#ff6a1a"; c.fillRect(3, -3, 1.6, 1.2 * eye); c.fillRect(5, -2.8, 0.9, 1.0 * eye);
    glow(c, 4, -2.4, 6, "rgba(255,90,30,.75)", alpha);
    c.restore();
    /* vorderes Bein */
    drawLeg(legA1, kneeA1, false);
    /* vorderer Arm + Waffe */
    const [hx, hy] = seg2(c, shX + 2, shY + 1, PI / 2 + armF - (wAng != null && curW && act.type === "melee" ? PI / 2 : 0), 6, PI / 2 + armF + foreF - (wAng != null && curW && act.type === "melee" ? PI / 2 : 0), 6, 3.8, "#241a1d", "#2c2023");
    if (wIcon) { c.save(); c.translate(hx, hy); c.rotate(wAng != null ? wAng : armF + 1.2); if (wExt && act && act.type === "melee") c.translate(wExt, 0); weapon(c, wIcon, wCol, time, act && act.type === "charge" ? wExt : act && act.type === "melee" ? wExt : 0); c.restore(); }
    else circ(c, hx, hy, 1.8, "#2a1e20");
    if (P.drinkT > 0) { c.save(); c.translate(hx, hy - 2); poly(c, [-1.5, 0, 1.5, 0, 2, -5, -2, -5], "#c03a3a"); c.restore(); }
    c.restore();
  };

  /* ======================= GEGNER ======================= */
  /* k(col) liefert die Farbe oder Weiß beim Aufblitzen */
  Z.drawEnemy = function (c, e, time) {
    const d = e.def;
    if (e.ceil && !e.aware) { /* Spinne an der Decke: Faden */ limb(c, e.x + e.w / 2, e.y - 60, e.x + e.w / 2, e.y + 2, 0.5, "rgba(230,230,240,.5)"); }
    const flash = e.flash > 0;
    const k = col => (flash ? "#fff6ea" : col);
    const cx = e.x + e.w / 2, fy = e.y + e.h;
    const act = e.act, pre = act && act.phase === "pre";
    let alpha = e.hidden > 0 ? 0.12 : 1;
    if (e.spawnT > 0) alpha *= 1 - e.spawnT / 0.4;
    if (e.dead) { alpha = Math.max(0, 1 - e.deadT / 0.4); }
    /* Elite-Aura */
    if (e.elite && !e.dead) { glow(c, cx, e.y + e.h * 0.5, e.h * 1.1, "rgba(255,120,40,.35)"); if (Math.random() < 0.3) Z.fx.p({ x: cx + (Math.random() - 0.5) * e.w, y: fy - Math.random() * e.h, vx: 0, vy: -30, life: 0.6, size: 2, col: "#ff8a3a", kind: "glow", add: true }); }
    if (e.armorUp > 0) { c.save(); c.globalAlpha = 0.5; c.strokeStyle = "#ffd27a"; c.lineWidth = 1; c.beginPath(); c.ellipse(cx, e.y + e.h / 2, e.w * 0.9, e.h * 0.7, 0, 0, PI * 2); c.stroke(); c.restore(); }
    /* Vorwarnung: rotes Glühen, das kurz vor dem Schlag hell aufblitzt */
    if (pre && !d.boss) {
      const k2 = act.t / act.a.pre, red = act.a.glyph === "!!" || act.a.unblockable;
      glow(c, cx, e.y + e.h * 0.45, e.h * (0.7 + k2 * 0.5), red ? "rgba(255,40,30,.55)" : "rgba(255,170,60,.45)");
      if (k2 > 0.75) glow(c, cx, e.y + e.h * 0.45, e.h * 0.6, "rgba(255,255,230,.6)");
    }
    if (d.boss && e.tele > 0) glow(c, cx, e.y + e.h * 0.45, e.h * 0.8, "rgba(255,90,40," + (0.3 + 0.3 * Math.sin(time * 30)) + ")");
    c.save(); c.globalAlpha = alpha; c.translate(cx, fy);
    const s = e.size || 1;
    if (e.pile > 0 && e.st.stun > 0) { /* Knochenhaufen */ for (let i = 0; i < 6; i++) limb(c, -6 + i * 2.4, -1 - (i % 2), -3 + i * 2.4, -2.5, 1.5, k("#d8d0c0")); circ(c, 3, -4, 3, k("#e8e2d0")); c.restore(); return; }
    const dead = e.dead;
    if (dead) c.translate(0, e.deadT * 10);
    c.scale(e.face * s, s);
    const t = e.anim, moving = Math.abs(e.vx) > 15 && e.onGround, ph = t * (Math.abs(e.vx) / 18 + 2);
    const atkK = act ? (act.phase === "pre" ? -act.t / act.a.pre : act.phase === "act" ? 1 : 0.5) : 0;
    (SHAPES[d.shape] || SHAPES.human)(c, e, d, k, t, moving, ph, atkK, time);
    c.restore();
    /* Glyphe über dem Kopf */
    if (pre && !d.boss && act.t > 0.05) {
      const red = act.a.glyph === "!!" || act.a.unblockable;
      c.save(); c.font = "900 " + (red ? 13 : 11) + "px 'Alegreya Sans',sans-serif"; c.textAlign = "center";
      c.fillStyle = red ? "#ff3a2a" : "#ffd27a"; c.strokeStyle = "rgba(0,0,0,.8)"; c.lineWidth = 2.5;
      const yy = e.y - 6 - Math.sin(act.t * 20) * 1.5;
      c.strokeText(red ? "!!" : "!", cx, yy); c.fillText(red ? "!!" : "!", cx, yy); c.restore();
      /* Ziellinie für Schützen */
      if (act.a.aimLine && act.aim) { c.save(); c.globalAlpha = 0.15 + 0.35 * (act.t / act.a.pre); c.strokeStyle = "#ff4a3a"; c.lineWidth = 0.6; c.setLineDash([3, 3]); c.beginPath(); c.moveTo(cx, e.y + e.h * 0.35); c.lineTo(act.aim.x, act.aim.y); c.stroke(); c.restore(); }
    }
    /* Zug-Seil (Ettercap, Folterknecht) */
    if (act && act.tether && Z.player) { const P = Z.player; c.strokeStyle = act.a.web ? "rgba(240,236,244,.8)" : "#7a6a5a"; c.lineWidth = 1; c.beginPath(); c.moveTo(cx, e.y + e.h * 0.4); c.lineTo(P.x + P.w / 2, P.y + 12); c.stroke(); }
    /* Lebensbalken */
    if (!d.boss && !dead && (e.hp < e.hpMax || e.elite)) {
      const w = Math.max(16, e.w + 4), x = cx - w / 2, y = e.y - (e.elite ? 10 : 5);
      c.fillStyle = "rgba(0,0,0,.6)"; c.fillRect(x - 0.5, y - 0.5, w + 1, 3);
      c.fillStyle = e.elite ? "#ff8a3a" : "#e0545a"; c.fillRect(x, y, w * Math.max(0, e.hp / e.hpMax), 2);
      if (e.elite) { c.font = "700 6px 'Alegreya Sans',sans-serif"; c.textAlign = "center"; c.fillStyle = "#ffb070"; c.fillText(Z.L(Z.ELITE[e.elite]) + " · " + Z.L(d.n), cx, y - 2); }
    }
    /* Statussymbole */
    const icons = [];
    if (e.st.stun > 0) icons.push(["✦", "#ffd27a"]); if (e.st.root > 0) icons.push(["⌇", "#9ad04a"]); if (e.st.weak > 0) icons.push(["♪", "#ffc24a"]); if (e.st.mark > 0) icons.push(["◎", "#c88a4a"]); if (e.st.fear > 0) icons.push(["?", "#ffc24a"]);
    if (icons.length && !dead) { c.font = "700 7px sans-serif"; c.textAlign = "center"; icons.forEach((ic, i) => { c.fillStyle = ic[1]; c.fillText(ic[0], cx - (icons.length - 1) * 4 + i * 8 + (ic[0] === "✦" ? Math.sin(time * 8) * 2 : 0), e.y - 12); }); }
  };

  /* Gestalten (lokal, Füße bei 0, Blick +x) */
  const SHAPES = {
    goblin(c, e, d, k, t, mv, ph, ak) {
      const bob = mv ? Math.abs(Math.sin(ph)) * 1.2 : Math.sin(t * 3) * 0.4;
      const l1 = mv ? Math.sin(ph) * 3 : 0;
      limb(c, -2, -6, -2 - l1, 0, 2.4, k("#3a2a1a")); limb(c, 2, -6, 2 + l1, 0, 2.4, k("#3a2a1a"));
      ell(c, 0, -9 - bob, 4.5, 4.5, k(d.t)); /* Kleidung */
      ell(c, 0.5, -14.5 - bob, 4.2, 3.6, k(d.c)); /* Kopf */
      poly(c, [3, -15 - bob, 9, -17 - bob, 4, -13.5 - bob], k(d.c)); poly(c, [-3, -15 - bob, -8, -18 - bob, -3.5, -13 - bob], k(d.c)); /* Ohren */
      c.fillStyle = k("#ffe04a"); c.fillRect(2, -15.5 - bob, 1.5, 1.2);
      const aa = ak < 0 ? -1.8 + ak * 0.6 : ak > 0 ? 0.6 : 0.3;
      if (d.bow) { c.save(); c.translate(3, -10 - bob); c.rotate(-0.1); weapon(c, "bow", "#c9b38a", t, ak < 0 ? -ak : 0); c.restore(); }
      else if (d.club) { c.save(); c.translate(3, -10 - bob); c.rotate(aa - 0.6); weapon(c, "club", "#7a6050", t); c.restore(); }
      else if (d.bomb) { limb(c, 2, -10 - bob, 5, -13 - bob + ak * 4, 1.8, k(d.c)); circ(c, 5.5, -14 - bob + ak * 4, 2.5, k("#2a2a2a")); if (Math.random() < 0.5) circ(c, 6, -17 - bob, 0.8, "#ffd27a"); }
      else { c.save(); c.translate(3, -10 - bob); c.rotate(aa); weapon(c, "dagger", "#c9b38a", t); c.restore(); }
    },
    human(c, e, d, k, t, mv, ph, ak) {
      const bob = mv ? Math.abs(Math.sin(ph)) * 1.3 : Math.sin(t * 2) * 0.4;
      const l1 = mv ? Math.sin(ph) * 3.5 : 0;
      const drunk = d.bottle ? Math.sin(t * 2.1) * 0.15 : 0;
      c.rotate(drunk);
      limb(c, -2, -10, -2 - l1, 0, 3, k("#2a2020")); limb(c, 2, -10, 2 + l1, 0, 3, k("#2a2020"));
      /* Robe / Rumpf */
      poly(c, [-4.5, -9, 4.5, -9, 4, -19 - bob, -4, -19 - bob], k(d.c));
      if (d.hood || d.c === "#9a2424") poly(c, [-5, -3, 5, -3, 4.5, -10, -4.5, -10], k(d.c));
      limb(c, -4, -11, 4, -11, 1.2, k(d.t));
      /* Kopf */
      const hy = -22 - bob;
      circ(c, 0.5, hy, 3.2, k(d.skin || "#d9b08c"));
      if (d.hood) poly(c, [-3.5, hy + 2, -3.8, hy - 2, -1, hy - 4.2, 3, hy - 3.8, 4, hy - 1, 2, hy - 1.5, -1, hy + 2.5], k(d.c));
      if (d.helm) poly(c, [-3.5, hy, -3, hy - 3.8, 3.5, hy - 3.8, 4, hy], k("#6a6a72"));
      if (d.hat) { poly(c, [-5, hy - 2, 5, hy - 2, 0, hy - 10], k(d.c)); limb(c, -5, hy - 2, 5, hy - 2, 1.2, k(d.t)); }
      if (d.hair) poly(c, [-3.5, hy - 1, -3, hy - 4, 2, hy - 4, 1, hy - 2, -2, hy + 4], k(d.hair));
      if (d.crown) poly(c, [-3, hy - 3, -2, hy - 6, 0, hy - 4, 2, hy - 6, 3, hy - 3], k("#e5b454"));
      c.fillStyle = k(d.skin === "#4a3e5e" ? "#ff4a4a" : "#1a1010"); c.fillRect(2, hy - 1, 1.2, 1);
      /* Arme und Waffe */
      const aa = ak < 0 ? -2 + ak * 0.5 : ak > 0 ? 0.7 : 0.4;
      const sx = 1, sy = -18 - bob;
      const hx = sx + Math.cos(aa) * 7, hy2 = sy + Math.sin(aa) * 7;
      limb(c, -1, sy, -2, sy + 7, 2.4, k(d.t)); limb(c, sx, sy, hx, hy2, 2.4, k(d.c));
      c.save(); c.translate(hx, hy2);
      if (d.bow) { c.rotate(-0.1); weapon(c, "bow", d.t, t, ak < 0 ? -ak : 0); }
      else if (d.xbow) { c.rotate(0); weapon(c, "xbow", d.t, t); }
      else if (d.staff) { c.rotate(-1.3); weapon(c, "staff", d.glowStaff || "#e8e070", t); }
      else if (d.spear) { c.rotate(ak > 0 ? 0 : aa * 0.3); c.translate(ak > 0 ? 4 : 0, 0); weapon(c, "spear", "#d8706a", t); }
      else if (d.mace) { c.rotate(aa - 0.8); weapon(c, "hammer", "#a08060", t); }
      else if (d.chain) { c.rotate(aa); limb(c, 0, 0, 12, 0, 1, k("#7a6a5a")); circ(c, 13, 0, 3, k("#5a5a5a")); }
      else if (d.scim) { c.rotate(aa - 0.6); weapon(c, "scimitar", "#b080ff", t); }
      else if (d.bottle) { c.rotate(aa - 1); poly(c, [0, -1.5, 6, -1.5, 8, -1, 8, 1, 6, 1.5, 0, 1.5], k("#5a8a5a")); }
      else if (d.sword) { c.rotate(aa - 0.8); limb(c, 0, 0, 3, 0, 1.6, k("#3a2a1a")); poly(c, [3, -1.2, 15, 0, 3, 1.2], k("#c8c0b8")); }
      c.restore();
      if (d.shield) { const up = e.st.stun > 0 || e.broken > 0 ? 6 : 0; poly(c, [4, -20 + up, 8, -19 + up, 8, -6 + up, 4, -5 + up], k(e.broken > 0 ? "#5a4a3a" : "#7a6a52")); limb(c, 6, -19 + up, 6, -6 + up, 1, k("#c8a060")); }
      if (d.bald) { circ(c, 3, -22 - bob, 1.2, k("#ff8a3a")); }
    },
    rat(c, e, d, k, t, mv, ph) {
      const b = mv ? Math.sin(ph * 1.5) * 1 : 0;
      ell(c, 0, -4 + b * 0.3, 6, 3.5, k(d.c)); ell(c, 5.5, -4.5, 3, 2.4, k(d.c));
      circ(c, 7.5, -5.5, 0.7, k("#ff4a4a")); circ(c, 4, -7, 1.3, k(d.t));
      c.strokeStyle = k(d.t); c.lineWidth = 0.8; c.beginPath(); c.moveTo(-6, -4); c.quadraticCurveTo(-11, -7 + b * 2, -14, -3); c.stroke();
      limb(c, 3, -2, 3 + b, 0, 1.2, k(d.t)); limb(c, -3, -2, -3 - b, 0, 1.2, k(d.t));
    },
    wolf(c, e, d, k, t, mv, ph, ak) {
      const b = mv ? Math.sin(ph) : 0;
      const leap = !e.onGround ? -0.2 : 0;
      c.rotate(leap);
      ell(c, -1, -8, 9, 4.2, k(d.c));
      poly(c, [6, -10, 13, -9, 14, -7, 9, -5, 6, -6], k(d.c)); poly(c, [7, -11, 8, -14, 10, -10], k(d.t));
      c.fillStyle = k(d.glow ? "#ffd27a" : "#ffe04a"); c.fillRect(10.5, -9.2, 1.3, 1);
      if (d.glow) glow(c, 0, -8, 12, "rgba(255,100,30,.4)");
      poly(c, [-9, -9, -16, -11 + b, -10, -7], k(d.t));
      for (const [x, p] of [[5, b], [3, -b], [-5, -b], [-7, b]]) limb(c, x, -5, x + p * 2.5, 0, 1.8, k(d.t));
      if (ak < 0) { poly(c, [12, -7, 15, -6, 12, -6], k("#fff")); }
    },
    wolfrider(c, e, d, k, t, mv, ph, ak) {
      SHAPES.wolf(c, e, { c: "#5a5048", t: "#34302c" }, k, t, mv, ph, 0);
      c.save(); c.translate(-1, -11); SHAPES.goblin(c, e, { c: d.c, t: "#5a3a22" }, k, t, false, 0, ak); c.restore();
    },
    blob(c, e, d, k, t, mv, ph, ak) {
      const sq = 1 + Math.sin(t * 6) * 0.08 + (ak < 0 ? -ak * 0.3 : 0);
      if (d.glow) glow(c, 0, -5, 14, "rgba(255,110,30,.6)");
      ell(c, 0, -5 * sq, 6.5 / Math.sqrt(sq), 5 * sq, k(d.c));
      ell(c, -1, -6 * sq, 3, 2, k(d.t));
      if (d.shape === "blob" && !d.glow) { poly(c, [-1, -10 * sq, 1, -10 * sq, 1.5, -13 * sq, -1.5, -13 * sq], k("#e0d8c0")); }
      circ(c, 2.5, -6 * sq, 0.9, k("#1a1a1a")); circ(c, -0.5, -6 * sq, 0.9, k("#1a1a1a"));
      if (ak < 0) circ(c, 0, -5, 7 * -ak, "rgba(255,255,255," + (-ak * 0.3) + ")");
    },
    skel(c, e, d, k, t, mv, ph, ak) {
      const bob = mv ? Math.abs(Math.sin(ph)) : 0, l1 = mv ? Math.sin(ph) * 3 : 0;
      limb(c, -2, -10, -2 - l1, 0, 1.4, k(d.c)); limb(c, 2, -10, 2 + l1, 0, 1.4, k(d.c));
      limb(c, 0, -10, 0, -19 - bob, 1.4, k(d.c));
      for (let i = 0; i < 3; i++) limb(c, -3, -17 + i * 2.2 - bob, 3, -17 + i * 2.2 - bob, 1, k(d.c));
      circ(c, 0.5, -22 - bob, 3.2, k(d.c)); c.fillStyle = k("#1a1010"); c.fillRect(1.2, -23 - bob, 1.4, 1.4); c.fillRect(-1.2, -23 - bob, 1.2, 1.2);
      if (!e.dead) glow(c, 2, -22.5 - bob, 3, "rgba(160,255,140,.5)");
      const aa = ak < 0 ? -2 + ak * 0.4 : ak > 0 ? 0.7 : 0.4;
      const hx = 1 + Math.cos(aa) * 7, hy = -18 - bob + Math.sin(aa) * 7;
      limb(c, 1, -18 - bob, hx, hy, 1.2, k(d.c));
      c.save(); c.translate(hx, hy);
      if (d.bow) { weapon(c, "bow", "#6b5040", t, ak < 0 ? -ak : 0); } else { c.rotate(aa - 0.8); limb(c, 0, 0, 3, 0, 1.4, k("#5a4a3a")); poly(c, [3, -1, 14, 0, 3, 1], k("#a8a090")); }
      c.restore();
    },
    zombie(c, e, d, k, t, mv, ph, ak) {
      const l1 = mv ? Math.sin(ph * 0.7) * 2.5 : 0;
      c.rotate(0.12);
      limb(c, -2, -10, -2 - l1, 0, 3, k("#2a2a20")); limb(c, 2, -10, 2 + l1 * 0.5, 0, 3, k("#2a2a20"));
      poly(c, [-4.5, -9, 4.5, -9, 4, -19, -4, -19], k(d.c));
      circ(c, 1.5, -21.5, 3.2, k(d.skin)); c.fillStyle = k("#ffe04a"); c.fillRect(3, -22.5, 1, 1);
      const reach = ak < 0 ? 0.2 : ak > 0 ? -0.2 : 0.15;
      limb(c, 1, -18, 9, -18 + reach * 20, 2.2, k(d.skin)); limb(c, -1, -17, 7, -16 + reach * 20, 2.2, k(d.skin));
      if (d.wet && Math.random() < 0.05) Z.fx.p({ x: e.x + e.w / 2, y: e.y + 8, vx: 0, vy: 20, g: 300, life: 0.4, size: 1.2, col: "#7a9a8a", kind: "drop" });
    },
    bloat(c, e, d, k, t, mv, ph, ak) {
      const sw = 1 + (ak < 0 ? -ak * 0.25 : 0) + Math.sin(t * 4) * 0.03;
      limb(c, -3, -6, -3, 0, 3, k("#3a3a2a")); limb(c, 3, -6, 3, 0, 3, k("#3a3a2a"));
      ell(c, 0, -12, 9 * sw, 8 * sw, k(d.c)); ell(c, 2, -11, 5 * sw, 4 * sw, k("#9aaa6a"));
      circ(c, 3, -21, 3, k("#8a9a7a")); c.fillStyle = k("#ffe04a"); c.fillRect(4.5, -22, 1, 1);
      if (ak < 0) glow(c, 0, -12, 14, "rgba(160,220,60," + (-ak * 0.5) + ")");
    },
    armor(c, e, d, k, t, mv, ph, ak) {
      const l1 = mv ? Math.sin(ph) * 3 : 0;
      limb(c, -2.5, -11, -2.5 - l1, 0, 3.4, k("#5a5e68")); limb(c, 2.5, -11, 2.5 + l1, 0, 3.4, k("#5a5e68"));
      poly(c, [-5, -10, 5, -10, 6, -21, -6, -21], k(d.c)); poly(c, [-4, -12, 4, -12, 4.5, -19, -4.5, -19], k("#9a9ea8"));
      poly(c, [-3.5, -22, 3.5, -22, 4, -28, -3.5, -28], k(d.c)); c.fillStyle = k(d.t); c.fillRect(1, -26, 3, 1);
      glow(c, 2.5, -25.5, 4, "rgba(255,170,60,.7)");
      const aa = ak < 0 ? -2.2 + ak * 0.4 : ak > 0 ? 0.6 : 0.3;
      c.save(); c.translate(4, -19); c.rotate(aa - 0.7); limb(c, 0, 0, 4, 0, 2, k("#5a4a3a")); poly(c, [4, -1.8, 22, 0, 4, 1.8], k("#c8c0b8")); c.restore();
    },
    golem(c, e, d, k, t, mv, ph, ak) {
      const l1 = mv ? Math.sin(ph * 0.7) * 2.5 : 0;
      limb(c, -4, -9, -4 - l1, 0, 5, k("#3a3e48")); limb(c, 4, -9, 4 + l1, 0, 5, k("#3a3e48"));
      poly(c, [-8, -8, 8, -8, 10, -22, -10, -22], k(d.c)); poly(c, [-5, -22, 5, -22, 4, -29, -4, -29], k(d.c));
      c.strokeStyle = k(d.t); c.lineWidth = 1.1; c.beginPath(); c.arc(0, -15, 4, 0, PI * 2); c.stroke(); c.beginPath(); c.moveTo(-2, -13); c.lineTo(0, -18); c.lineTo(2, -13); c.moveTo(-1.2, -15); c.lineTo(1.2, -15); c.stroke(); glow(c, 0, -15, 10, "rgba(255,170,60,.55)");
      c.fillStyle = k(d.t);
      c.fillRect(1, -27, 3, 1.4); glow(c, 2.5, -26.5, 5, "rgba(255,170,60,.8)");
      const aa = ak < 0 ? -1.6 + ak * 0.6 : ak > 0 ? 0.5 : 0.2;
      for (const sx of [-9, 9]) { c.save(); c.translate(sx, -20); c.rotate(PI / 2 + (sx > 0 ? -aa : aa * 0.3)); limb(c, 0, 0, 10, 0, 4.5, k("#4a4e58")); circ(c, 11, 0, 4, k("#5a5e68")); c.restore(); }
    },
    stirge(c, e, d, k, t) {
      const fl = Math.sin(t * 30) * 5;
      poly(c, [0, -6, -10, -10 + fl, -5, -4], k(d.c)); poly(c, [0, -6, 9, -11 - fl, 5, -4], k(d.c));
      ell(c, 0, -5, 4, 3, k(d.c)); poly(c, [3, -5, 10, -4, 3, -4], k(d.t)); circ(c, 2, -6, 0.8, k("#ffe04a"));
    },
    harpy(c, e, d, k, t, mv, ph, ak) {
      const fl = Math.sin(t * 16) * 6;
      poly(c, [-1, -12, -14, -18 + fl, -10, -8, -3, -9], k(d.c)); poly(c, [1, -12, 12, -20 - fl, 9, -8, 3, -9], k(d.t));
      ell(c, 0, -8, 3.5, 5, k(d.c)); circ(c, 1, -14, 2.8, k(d.skin)); poly(c, [-2, -16, 1, -18, 4, -15, 1, -14], k("#3a2a20"));
      limb(c, -1, -3, -2, 1, 1.2, k("#a08060")); limb(c, 1, -3, 2, 1, 1.2, k("#a08060"));
    },
    mane(c, e, d, k, t, mv, ph, ak) {
      const b = mv ? Math.abs(Math.sin(ph)) : 0;
      limb(c, -2, -4, -3, 0, 2, k(d.c)); limb(c, 2, -4, 3, 0, 2, k(d.c));
      ell(c, 0, -7 - b, 5, 4.5, k(d.c)); circ(c, 1, -11 - b, 3.4, k(d.c));
      c.fillStyle = k(d.t); c.fillRect(2, -12 - b, 1.2, 1.2); c.fillRect(-0.4, -12 - b, 1, 1);
      poly(c, [-1, -14 - b, 0, -17 - b, 1, -14 - b], k("#3a1a20"));
      limb(c, 2, -8 - b, 7, -6 - b + (ak < 0 ? -4 : 0), 1.4, k(d.c));
    },
    kuotoa(c, e, d, k, t, mv, ph, ak) {
      const bob = mv ? Math.abs(Math.sin(ph)) : Math.sin(t * 2) * 0.4, l1 = mv ? Math.sin(ph) * 3 : 0;
      limb(c, -2, -9, -3 - l1, 0, 2.6, k(d.c)); limb(c, 2, -9, 3 + l1, 0, 2.6, k(d.c));
      ell(c, 0, -13 - bob, 5, 6, k(d.c)); ell(c, 1, -12 - bob, 3, 4, k("#4a8a7a"));
      ell(c, 2, -21 - bob, 4.2, 3.5, k(d.c)); circ(c, 3.5, -22 - bob, 1.8, k("#f0f0e0")); circ(c, 3.8, -22 - bob, 0.8, k("#101010"));
      poly(c, [-2, -24 - bob, 0, -28 - bob, 2, -24 - bob, 4, -26 - bob, 3, -23 - bob], k(d.t));
      limb(c, 4, -19 - bob, 7, -18 - bob, 0.8, k("#f0e0d0"));
      if (d.crown) poly(c, [-2, -24 - bob, -1, -28 - bob, 1, -25 - bob, 3, -29 - bob, 4, -24 - bob], k("#e8e0c0"));
      const aa = ak < 0 ? -1.8 + ak * 0.4 : ak > 0 ? 0 : 0.3;
      c.save(); c.translate(3, -14 - bob); c.rotate(aa);
      if (d.staff) weapon(c, "staff", "#e5b454", t); else { limb(c, -10, 0, 24, 0, 1.4, k("#6a4a30")); poly(c, [24, -3, 30, -4, 28, 0, 30, 4, 24, 3], k("#d8706a")); }
      c.restore();
    },
    ray(c, e, d, k, t) {
      const fl = Math.sin(t * 6) * 4;
      c.save(); c.globalAlpha *= 0.95;
      poly(c, [10, -5, 2, -10 - fl, -10, -6, -2, -5, -10, -4, 2, 0 + fl, 10, -5], k(d.c));
      limb(c, -9, -5, -20, -4 + Math.sin(t * 5) * 3, 0.8, k(d.t)); poly(c, [9, -6, 12, -9, 11, -5], k(d.t)); poly(c, [9, -4, 12, -1, 11, -5], k(d.t));
      glow(c, 0, -5, 14, "rgba(220,220,200,.25)"); c.restore();
    },
    crab(c, e, d, k, t, mv, ph, ak) {
      const b = mv ? Math.sin(ph * 2) : 0;
      for (let i = -1; i <= 1; i++) { limb(c, i * 4, -5, i * 6 - 2 + b, 0, 1.2, k(d.c)); }
      ell(c, 0, -6, 9, 4.5, k(d.c)); ell(c, 0, -7, 6, 2.6, k(d.t));
      circ(c, 3, -11, 1, k("#101010")); circ(c, 6, -11, 1, k("#101010"));
      const op = ak < 0 ? 0.6 : 0.2;
      for (const sx of [9]) { poly(c, [sx, -7, sx + 6, -10 - op * 4, sx + 9, -7, sx + 6, -6], k(d.c)); poly(c, [sx, -6, sx + 6, -4 + op * 4, sx + 9, -6], k(d.t)); }
    },
    spider(c, e, d, k, t, mv, ph, ak) {
      const b = mv ? ph : 0;
      for (let i = 0; i < 4; i++) {
        const o = Math.sin(b * 1.5 + i * 1.6) * 2;
        c.strokeStyle = k(d.t); c.lineWidth = 1.2; c.beginPath(); c.moveTo(-1 + i * 1.5, -6); c.quadraticCurveTo(4 + i * 3, -14 + o, 7 + i * 2.5, 0); c.stroke();
        c.beginPath(); c.moveTo(-1 - i * 1.5, -6); c.quadraticCurveTo(-5 - i * 3, -14 - o, -8 - i * 2.5, 0); c.stroke();
      }
      ell(c, -4, -7, 6, 4.5, k(d.c)); ell(c, 3, -6, 3.5, 3, k(d.c));
      for (let i = 0; i < 3; i++) circ(c, 4.5 + (i % 2), -7 + i * 0.8, 0.7, k("#ff3030"));
      limb(c, -7, -9, -3, -9, 0.6, k("#8a6a40"));
    },
    ettercap(c, e, d, k, t, mv, ph, ak) {
      const l1 = mv ? Math.sin(ph) * 3 : 0;
      limb(c, -2, -9, -3 - l1, 0, 2.2, k(d.c)); limb(c, 2, -9, 3 + l1, 0, 2.2, k(d.c));
      ell(c, -1, -13, 5, 6, k(d.c)); ell(c, -2, -12, 3, 4, k("#6a5a6a"));
      circ(c, 2, -21, 3.5, k(d.c)); for (let i = 0; i < 3; i++) circ(c, 3 + i * 0.6, -22 + i * 0.8, 0.6, k("#ff3030"));
      poly(c, [4, -19, 7, -17, 5, -18], k(d.t));
      const aa = ak < 0 ? -1.5 : 0.2;
      limb(c, 2, -17, 9, -17 + aa * 4, 1.6, k(d.c)); limb(c, -1, -16, 7, -13 + aa * 3, 1.6, k(d.c));
      poly(c, [9, -17 + aa * 4, 13, -19 + aa * 4, 11, -16 + aa * 4], k(d.t));
    },
    wraith(c, e, d, k, t, mv, ph, ak) {
      c.save(); c.globalAlpha *= 0.85;
      const fl = Math.sin(t * 4) * 2;
      glow(c, 0, -14, 20, d.t === "#ff8a2a" ? "rgba(255,120,40,.35)" : "rgba(140,90,255,.35)");
      c.fillStyle = k(d.c); c.beginPath(); c.moveTo(-5, -20); c.quadraticCurveTo(-8, -6, -6 + fl, 2); c.lineTo(-2, -2); c.lineTo(0, 3); c.lineTo(3, -1); c.lineTo(6 - fl, 2); c.quadraticCurveTo(8, -8, 5, -20); c.closePath(); c.fill();
      ell(c, 0.5, -22, 4.5, 4.8, k(d.c));
      c.fillStyle = k(d.t); c.fillRect(1.5, -23, 1.5, 1.2); c.fillRect(-1, -23, 1.3, 1.2);
      glow(c, 1.5, -22.5, 4, d.t === "#ff8a2a" ? "rgba(255,140,40,.8)" : "rgba(170,120,255,.8)");
      const aa = ak < 0 ? -1.5 : ak > 0 ? 0.3 : -0.2;
      for (const s of [1, -0.6]) { c.strokeStyle = k(d.c); c.lineWidth = 2; c.beginPath(); c.moveTo(s * 3, -17); c.quadraticCurveTo(s * 7, -15 + aa * 3, s * 10, -12 + aa * 5); c.stroke(); for (let f = -1; f <= 1; f++) limb(c, s * 10, -12 + aa * 5, s * 13, -12 + aa * 5 + f * 2, 0.7, k(d.t)); }
      c.restore();
    },
    sac(c, e, d, k, t) {
      const p = 1 + Math.sin(t * 3) * 0.06;
      limb(c, 0, -18, 0, -40, 0.6, "rgba(230,230,240,.5)");
      ell(c, 0, -9, 7 * p, 9 * p, k(d.c)); ell(c, 1, -8, 4 * p, 6 * p, k(d.t));
      for (let i = 0; i < 3; i++) circ(c, -2 + i * 2, -10 + Math.sin(t * 4 + i) * 2, 1, k("#3a2a20"));
    },
    wisp(c, e, d, k, t) {
      const r = 4 + Math.sin(t * 8) * 0.8;
      glow(c, 0, -6, 14, "rgba(255,170,60,.7)");
      circ(c, 0, -6, r, k(d.c)); circ(c, 0, -6, r * 0.5, k(d.t));
      for (let i = 0; i < 3; i++) { const a = t * 3 + i * 2.1; circ(c, Math.cos(a) * 7, -6 + Math.sin(a) * 7, 1, k(d.t)); }
    },
    duergar(c, e, d, k, t, mv, ph, ak) {
      const bob = mv ? Math.abs(Math.sin(ph)) : 0, l1 = mv ? Math.sin(ph) * 2.5 : 0;
      limb(c, -2.5, -7, -2.5 - l1, 0, 3.4, k("#2a2428")); limb(c, 2.5, -7, 2.5 + l1, 0, 3.4, k("#2a2428"));
      poly(c, [-5.5, -6, 5.5, -6, 6, -15 - bob, -6, -15 - bob], k(d.c)); limb(c, -5, -9, 5, -9, 1.2, k(d.t));
      circ(c, 0.5, -17.5 - bob, 3.6, k(d.skin));
      poly(c, [-2, -16 - bob, 4, -16 - bob, 3, -9 - bob, 0, -11 - bob], k("#e8e8ee"));
      poly(c, [-3.8, -18 - bob, -3, -22 - bob, 4, -22 - bob, 4.5, -18 - bob], k("#5a5a62"));
      c.fillStyle = k("#ff4a2a"); c.fillRect(2, -19 - bob, 1.2, 1);
      const aa = ak < 0 ? -2.1 + ak * 0.3 : ak > 0 ? 0.6 : 0.3;
      c.save(); c.translate(4, -13 - bob); c.rotate(d.xbow ? 0 : aa - 0.6); weapon(c, d.xbow ? "xbow" : "axe", d.t, t); c.restore();
    },
    blight(c, e, d, k, t, mv, ph, ak) {
      const l1 = mv ? Math.sin(ph) * 3 : 0;
      c.strokeStyle = k(d.c); c.lineCap = "round";
      limb(c, -1, -9, -3 - l1, 0, 1.8, k(d.c)); limb(c, 1, -9, 3 + l1, 0, 1.8, k(d.c));
      limb(c, 0, -9, 0.5, -19, 2.6, k(d.c));
      for (let i = 0; i < 5; i++) { const a = -PI / 2 + (i - 2) * 0.5; limb(c, 0.5, -19, 0.5 + Math.cos(a) * 5, -19 + Math.sin(a) * 5, 1, k(d.c)); }
      c.fillStyle = k(d.t); c.fillRect(1.5, -18, 1.2, 1.2); glow(c, 2, -17.5, 3, "rgba(255,50,40,.6)");
      const aa = ak < 0 ? -1.8 : ak > 0 ? 0.4 : 0;
      limb(c, 0.5, -15, 7, -15 + aa * 4, 1.2, k(d.c)); limb(c, 7, -15 + aa * 4, 10, -17 + aa * 4, 0.8, k(d.c));
      if (d.vine) for (let i = 0; i < 4; i++) { c.strokeStyle = k("#4a7a2a"); c.lineWidth = 1; c.beginPath(); c.moveTo(0, -12 - i * 3); c.quadraticCurveTo(6 + Math.sin(t * 2 + i) * 3, -14 - i * 3, 9, -10 - i * 3); c.stroke(); }
    },
    /* ---------- Bosse ---------- */
    bugbear(c, e, d, k, t, mv, ph, ak) {
      const bob = mv ? Math.abs(Math.sin(ph)) * 1.5 : Math.sin(t * 2) * 0.5, l1 = mv ? Math.sin(ph) * 4 : 0;
      limb(c, -3, -11, -3 - l1, 0, 4.5, k("#4a3020")); limb(c, 3, -11, 3 + l1, 0, 4.5, k("#4a3020"));
      ell(c, 0, -17 - bob, 8, 9, k(d.c)); ell(c, 1, -15 - bob, 5, 6, k("#c8a060"));
      circ(c, 3, -28 - bob, 5, k(d.c)); poly(c, [-1, -32 - bob, -3, -36 - bob, 1, -32 - bob], k(d.t)); poly(c, [5, -32 - bob, 7, -36 - bob, 7, -31 - bob], k(d.t));
      c.fillStyle = k("#ffe04a"); c.fillRect(5, -29 - bob, 1.5, 1.2);
      poly(c, [5, -26 - bob, 9, -25 - bob, 6, -24 - bob], k("#f0f0e0"));
      const aa = ak < 0 ? -2.4 + ak * 0.4 : ak > 0 ? 0.8 : 0.4;
      c.save(); c.translate(5, -23 - bob); c.rotate(aa - 0.6);
      limb(c, 0, 0, 22, 0, 2.2, k("#5a4030")); circ(c, 24, 0, 5, k("#5a5a62")); for (let i = 0; i < 6; i++) { const a = i / 6 * PI * 2; poly(c, [24 + Math.cos(a) * 4, Math.sin(a) * 4, 24 + Math.cos(a) * 8, Math.sin(a) * 8, 24 + Math.cos(a + 0.4) * 4, Math.sin(a + 0.4) * 4], k("#7a7a82")); }
      c.restore();
    },
    druidin(c, e, d, k, t, mv, ph, ak) {
      if (e.revealed) { SHAPES.human(c, e, { c: "#1a1420", t: "#3a2a4a", skin: "#3a2e4e", hair: "#f0f0ff", scim: 1 }, k, t, mv, ph, ak); c.save(); c.translate(-2, -16); c.rotate(0.6); weapon(c, "scimitar", "#b080ff", t); c.restore(); return; }
      const bob = Math.sin(t * 2) * 0.4;
      poly(c, [-5, 0, 5, 0, 4, -18 - bob, -4, -18 - bob], k(d.c));
      poly(c, [-4.5, -10, 4.5, -10, 4, -18, -4, -18], k("#4a7a3a"));
      circ(c, 0.5, -21 - bob, 3.2, k(d.skin)); poly(c, [-4, -20, -3, -25, 3, -25, 4, -21, 0, -23], k("#c8c0c0"));
      limb(c, -4, -24, -7, -28, 0.8, k("#6a4a2a")); limb(c, 4, -24, 7, -28, 0.8, k("#6a4a2a"));
      c.save(); c.translate(3, -16); c.rotate(-1.3 + (ak < 0 ? -0.4 : 0)); weapon(c, "staff", "#9ad04a", t); c.restore();
    },
    giant(c, e, d, k, t, mv, ph, ak) {
      const bob = mv ? Math.abs(Math.sin(ph * 0.5)) * 1.5 : Math.sin(t * 1.5) * 0.6, l1 = mv ? Math.sin(ph * 0.5) * 4 : 0;
      limb(c, -4, -12, -4 - l1, 0, 6, k("#5a4a44")); limb(c, 4, -12, 4 + l1, 0, 6, k("#5a4a44"));
      poly(c, [-8, -11, 8, -11, 9, -15, -9, -15], k("#6a4a2a"));
      ell(c, 0, -21 - bob, 9, 8, k(d.c)); ell(c, 2, -19 - bob, 5, 5, k("#9a8a80"));
      for (let i = -2; i <= 2; i++) circ(c, i * 2.4 + 1, -27 - bob + Math.abs(i) * 0.6, 1.4, k("#6a5a50"));
      circ(c, 1.5, -32 - bob, 5.5, k(d.c)); c.fillStyle = k("#f0f0e0"); c.fillRect(3, -33 - bob, 2.2, 2); c.fillStyle = k("#2a1010"); c.fillRect(4, -32.5 - bob, 1, 1);
      circ(c, -3.5, -31 - bob, 1.4, k("#e5b454"));
      const aa = ak < 0 ? -2.2 + ak * 0.5 : ak > 0 ? 0.2 : 0.6;
      limb(c, 6, -25 - bob, 6 + Math.cos(aa) * 10, -25 - bob + Math.sin(aa) * 10, 5, k(d.c)); circ(c, 6 + Math.cos(aa) * 12, -25 - bob + Math.sin(aa) * 12, 4.5, k("#7a6a62"));
      limb(c, -6, -25 - bob, -8, -15 - bob, 5, k("#7a6a62"));
      if (e.sleep) { c.font = "700 8px sans-serif"; c.fillStyle = "#e8e0d0"; c.fillText("z", 6, -42 + Math.sin(t * 2) * 3); c.fillText("Z", 10, -48 + Math.sin(t * 2 + 1) * 3); }
    },
    wasp(c, e, d, k, t, mv, ph, ak) {
      const fl = Math.sin(t * 40) * 6;
      c.save(); c.globalAlpha *= 0.55; ell(c, -2, -14 - fl * 0.3, 9, 3, k("#e8e0d0"), -0.5); ell(c, 2, -14 + fl * 0.3, 9, 3, k("#e8e0d0"), 0.5); c.restore();
      ell(c, -7, -6, 7, 4.5, k(d.c)); for (let i = 0; i < 3; i++) limb(c, -11 + i * 3, -9, -11 + i * 3, -3, 0.8, k(d.t));
      poly(c, [-13, -6, -19, -5 + (ak < 0 ? 2 : 0), -13, -4], k("#e0d0a0"));
      ell(c, 2, -7, 4, 3.5, k(d.c)); circ(c, 7, -8, 3.5, k(d.c));
      ell(c, 8.5, -9, 2.2, 2.6, k(d.t)); glow(c, 8.5, -9, 6, "rgba(255,60,40,.6)");
      limb(c, 9, -7, 17, -5 + (ak < 0 ? -3 : 0), 1.2, k("#1a1a1a"));
      for (let i = 0; i < 3; i++) limb(c, 1 + i * 2, -5, 0 + i * 3, 1, 0.8, k(d.c));
    },
    vulture(c, e, d, k, t, mv, ph, ak) {
      const fl = Math.sin(t * 9) * 8;
      poly(c, [-2, -16, -20, -24 + fl, -24, -12 + fl, -14, -10, -4, -10], k(d.c)); poly(c, [2, -16, 18, -26 - fl, 22, -14 - fl, 12, -10, 4, -10], k("#2a2a24"));
      ell(c, 0, -10, 6, 8, k(d.c)); limb(c, 2, -16, 6, -24, 2.2, k("#c09070"));
      circ(c, 7, -26, 3.5, k("#c09070")); poly(c, [9, -27, 14, -25, 9, -24], k("#e0d0a0")); c.fillStyle = k("#ff3030"); c.fillRect(8, -27.5, 1.2, 1.2);
      limb(c, -2, -3, -3, 2, 1.6, k("#8a7a60")); limb(c, 2, -3, 3, 2, 1.6, k("#8a7a60"));
    },
    dragon(c, e, d, k, t, mv, ph, ak) {
      const fly = !e.grounded;
      const fl = fly ? Math.sin(t * 7) * 10 : Math.sin(t * 1.5) * 2;
      const breath = e.mv && (e.mv.id === "odem" || e.mv.id === "giftatem");
      /* Flügel hinten */
      poly(c, [-2, -14, -14, -34 + fl, -30, -28 + fl, -22, -18, -12, -12], k(d.c));
      /* Schwanz */
      c.strokeStyle = k(d.c); c.lineWidth = 4; c.lineCap = "round"; c.beginPath(); c.moveTo(-12, -9); c.quadraticCurveTo(-24, -6 + Math.sin(t * 2) * 3, -32, -12 + Math.sin(t * 2.3) * 4); c.stroke();
      poly(c, [-32, -15 + Math.sin(t * 2.3) * 4, -36, -12 + Math.sin(t * 2.3) * 4, -31, -9 + Math.sin(t * 2.3) * 4], k(d.t));
      /* Beine */
      if (!fly) { limb(c, -7, -8, -9, 0, 3.4, k(d.c)); limb(c, 6, -8, 7, 0, 3.4, k(d.c)); }
      else { limb(c, -7, -8, -11, -2, 3, k(d.c)); limb(c, 6, -8, 3, -2, 3, k(d.c)); }
      /* Körper */
      ell(c, 0, -11, 14, 7, k(d.c)); ell(c, 2, -8, 10, 3.5, k(d.belly || d.t));
      for (let i = 0; i < 6; i++) poly(c, [-10 + i * 4, -17, -8 + i * 4, -21, -6 + i * 4, -17], k(d.t));
      /* Hals und Kopf */
      const hx = 16, hy = -19 + (ak < 0 ? -2 : 0) + (breath ? 2 : 0);
      limb(c, 9, -14, hx - 2, hy + 2, 5, k(d.c));
      poly(c, [hx - 4, hy - 3, hx + 6, hy - 3, hx + 12, hy, hx + 6, hy + 3, hx - 3, hy + 3], k(d.c));
      poly(c, [hx - 2, hy - 3, hx - 9, hy - 9, hx - 1, hy - 4], k("#1a1a1a")); poly(c, [hx + 1, hy - 3, hx - 4, hy - 10, hx + 3, hy - 4], k("#1a1a1a"));
      c.fillStyle = k("#ffe04a"); c.fillRect(hx + 3, hy - 1.8, 1.8, 1.2); glow(c, hx + 4, hy - 1.2, 4, "rgba(255,220,80,.7)");
      if (breath || (e.mv && e.mv.stage === "pre" && breath === false && e.tele > 0)) glow(c, hx + 12, hy, 14, d.t === "#a8e050" ? "rgba(170,230,80,.7)" : "rgba(255,150,40,.8)");
      for (let i = 0; i < 3; i++) poly(c, [hx + 3 + i * 2.5, hy + 3, hx + 4 + i * 2.5, hy + 5.5, hx + 5 + i * 2.5, hy + 3], k("#f0f0e0"));
      /* Flügel vorne */
      poly(c, [2, -15, 8, -36 - fl, 20, -32 - fl, 12, -18], k(d.t === "#a8e050" ? "#3a7a3a" : "#c03a20"));
    },
    demogorgon(c, e, d, k, t, mv, ph, ak) {
      const sw = Math.sin(t * 1.2) * 2;
      glow(c, 0, -60, 90, "rgba(255,200,90,.18)");
      /* Leib */
      ell(c, 0, -40, 26, 34, k("#4a3020"));
      for (let i = 0; i < 9; i++) { const yy = -70 + i * 7, xx = Math.sin(i * 1.7) * 14; c.save(); c.globalCompositeOperation = "lighter"; c.strokeStyle = "rgba(255,200,90," + (0.35 + 0.25 * Math.sin(t * 2 + i)) + ")"; c.lineWidth = 1.2; c.beginPath(); c.moveTo(xx - 6, yy); c.quadraticCurveTo(xx, yy + 3, xx + 7, yy - 1); c.stroke(); c.restore(); }
      /* Beine */
      limb(c, -12, -12, -18, 10, 8, k("#3a4a30")); limb(c, 12, -12, 18, 10, 8, k("#3a4a30"));
      /* Tentakel-Arme */
      const tent = (side, ph2) => { c.strokeStyle = k("#6a7a4a"); c.lineWidth = 6; c.lineCap = "round"; c.beginPath(); c.moveTo(side * 20, -58); c.bezierCurveTo(side * 40, -70 + Math.sin(t * 2 + ph2) * 10, side * 52, -40 + Math.cos(t * 1.7 + ph2) * 14, side * 46 + Math.sin(t * 2.4 + ph2) * 6, -20); c.stroke(); c.lineWidth = 3; c.beginPath(); c.moveTo(side * 46 + Math.sin(t * 2.4 + ph2) * 6, -20); c.lineTo(side * 52, -12); c.moveTo(side * 46 + Math.sin(t * 2.4 + ph2) * 6, -20); c.lineTo(side * 40, -10); c.stroke(); };
      tent(-1, 0); tent(1, 1.5);
      /* zwei Pavianköpfe */
      const head = (hx, hy, ph2) => {
        hy += Math.sin(t * 2 + ph2) * 2;
        limb(c, hx * 0.4, -70, hx, hy + 6, 8, k("#4a3020"));
        ell(c, hx, hy, 11, 9, k("#5a3a24")); ell(c, hx + 4 * U.sign(hx || 1), hy + 3, 6, 4.5, k("#8a3a3a"));
        c.fillStyle = k("#ffe04a"); c.fillRect(hx - 5, hy - 3, 3, 2); c.fillRect(hx + 1, hy - 3, 3, 2); glow(c, hx - 1, hy - 2, 10, "rgba(255,230,80,.6)");
        for (let i = 0; i < 4; i++) poly(c, [hx - 3 + i * 2.5, hy + 5, hx - 2 + i * 2.5, hy + 9, hx - 1 + i * 2.5, hy + 5], k("#f0f0d0"));
      };
      head(-16, -90 + sw, 0); head(16, -92 - sw, 2);
    }
  };
  SHAPES.golemBig = SHAPES.golem;
  /* Trainingspuppe im Lager */
  SHAPES.dummy = function (c, e, d, k, t) {
    const wob = Math.sin(t * 9) * (e.flash > 0 || e.wob > 0 ? 0.25 : 0.02);
    c.rotate(wob);
    limb(c, 0, 0, 0, -26, 2.6, k("#6a4a2a")); limb(c, -9, -18, 9, -18, 2.4, k("#6a4a2a"));
    ell(c, 0, -15, 6, 8, k("#b09a6a")); circ(c, 0, -27, 4.5, k("#c8b080"));
    c.strokeStyle = k("#7a6a4a"); c.lineWidth = 0.6; for (let i = -4; i <= 4; i += 2) { c.beginPath(); c.moveTo(i, -21); c.lineTo(i * 1.2, -9); c.stroke(); }
    c.fillStyle = k("#8a1a1a"); c.fillRect(-2.5, -28, 5, 1.2); c.fillRect(-0.6, -30, 1.2, 5);
  };
  Z.SHAPES = SHAPES;

  /* ======================= GEFÄHRTEN ======================= */
  Z.drawRex = function (c, x, y, face, t, run, sit) {
    c.save(); c.translate(x, y); c.scale(face, 1);
    const b = run ? Math.sin(run * PI) : 0;
    ell(c, -1, -8 + (sit ? 1 : 0), 7, 4, "#8a5a2a"); ell(c, 0, -7, 5, 2.4, "#c89a6a");
    circ(c, 6, -12 + (sit ? 0 : b * 0.5), 3.6, "#8a5a2a"); ell(c, 9, -11, 2.6, 1.8, "#a07040"); circ(c, 11, -11.5, 0.8, "#1a1010");
    poly(c, [4, -15, 5, -11, 3, -12], "#5a3a1a"); c.fillStyle = "#1a1010"; c.fillRect(6.5, -13.5, 1, 1);
    c.strokeStyle = "#8a5a2a"; c.lineWidth = 1.6; c.lineCap = "round"; c.beginPath(); c.moveTo(-7, -9); c.lineTo(-11, -13 + Math.sin(t * 14) * 2); c.stroke();
    if (sit) { limb(c, 3, -5, 3, 0, 1.6, "#6a4a2a"); limb(c, -4, -5, -6, 0, 2.2, "#6a4a2a"); }
    else for (const [xx, p] of [[3, b], [1, -b], [-4, -b], [-6, b]]) limb(c, xx, -5, xx + p * 2.5, 0, 1.6, "#6a4a2a");
    limb(c, 3, -11, 5, -10, 1, "#c03a3a");
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
    if (id === "B") { /* Barradin: Elf, Barde mit Laute */
      limb(c, -2, -10, -2, 0, 2.6, "#3a2a40"); limb(c, 2, -10, 2.5, 0, 2.6, "#3a2a40");
      poly(c, [-4.5, -9, 4.5, -9, 4, -20 - breathe, -4, -20 - breathe], "#6a2a6a"); limb(c, -4, -12, 4, -12, 1, "#e5b454");
      circ(c, 0.5, -23 - breathe, 3.2, "#e8c8a8"); poly(c, [-3.5, -23, -3, -27, 3, -27, 3.5, -24, 0, -25], "#e8d090"); poly(c, [3, -24, 6, -26, 3.5, -23], "#e8c8a8");
      poly(c, [-4, -26, 4, -26, 2, -30, -3, -29], "#4a2a5a"); limb(c, 3, -29, 7, -32, 0.8, "#e04a4a");
      c.save(); c.translate(2, -15); c.rotate(-0.5); ell(c, 0, 0, 4.5, 3.5, "#a06a30"); limb(c, 3, -1, 11, -5, 1.4, "#6a4a2a"); c.restore();
      limb(c, 1, -18, 4, -13 + Math.sin(t * 6) * 1.5, 1.8, "#6a2a6a");
    } else if (id === "G") { /* Friedrich: Waldläufer mit Bogen */
      limb(c, -2, -10, -2, 0, 3, "#3a3020"); limb(c, 2, -10, 2, 0, 3, "#3a3020");
      poly(c, [-4.5, -9, 4.5, -9, 4, -20 - breathe, -4, -20 - breathe], "#3a5a2a"); limb(c, -4, -13, 4, -13, 1, "#6a4a2a");
      circ(c, 0.5, -23 - breathe, 3.2, "#e0b890"); poly(c, [-3.5, -22, -3.5, -26, 3, -27, 4, -24, 0, -24.5], "#6a4a2a");
      poly(c, [-4.5, -20, -3, -28, 4, -27, 4.5, -22], "#2a4a20");
      c.save(); c.translate(-4, -16); weapon(c, "bow", "#7a5a30", t, 0); c.restore();
    } else if (id === "E") { /* Echo: gehörnter Druide, sitzt auf Goldsack */
      ell(c, 0, -3, 7, 4, "#6a5a3a"); circ(c, -4, -6, 2.4, "#e5b454"); circ(c, 3, -6.5, 2, "#e5b454");
      poly(c, [-4, -6, 4, -6, 3.5, -17 - breathe, -3.5, -17 - breathe], "#e8e0d0"); limb(c, -3, -10, 3, -10, 1, "#5a8a4a");
      circ(c, 0.5, -20 - breathe, 3.3, "#c8a888"); limb(c, -2, -22, -7, -29, 1.4, "#5a4a30"); limb(c, -5, -26, -8, -26, 1, "#5a4a30"); limb(c, 2, -22, 7, -29, 1.4, "#5a4a30"); limb(c, 5, -26, 8, -26, 1, "#5a4a30");
      c.fillStyle = "#3a6a2a"; c.fillRect(1.5, -21, 1.2, 1);
      c.save(); c.translate(4, -12); c.rotate(-0.6 + Math.sin(t * 1.3) * 0.1); circ(c, 4, 0, 1.6, "#ffd27a"); glow(c, 4, 0, 5, "rgba(255,210,120,.5)"); c.restore();
    } else if (id === "A") { /* Nundro an der Schmiede */
      limb(c, -2.5, -7, -2.5, 0, 3.6, "#3a2a20"); limb(c, 2.5, -7, 2.5, 0, 3.6, "#3a2a20");
      poly(c, [-5.5, -6, 5.5, -6, 6, -15 - breathe, -6, -15 - breathe], "#5a4030"); poly(c, [-4, -7, 4, -7, 4, -14, -4, -14], "#8a6a4a");
      circ(c, 0.5, -17.5 - breathe, 3.6, "#d8a888"); poly(c, [-2, -16, 4, -16, 3, -8, 0, -10], "#2a2020");
      const ham = Math.sin(t * 4); c.save(); c.translate(4, -13); c.rotate(-1.6 + Math.max(0, ham) * 1.3); weapon(c, "hammer", "#e5a43a", t); c.restore();
    }
    c.restore();
  };

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
