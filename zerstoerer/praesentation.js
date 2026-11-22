/* Ezekiel – The Destroyer · Fundvorstellung
   1) Verfluchte Truhen und verfluchte Funde öffnen ein Fenster mit allen Werten, Effekten und dem Preis.
      Das Spiel steht still, bis man sich entschieden hat.
   2) Jede neu angelegte Waffe oder Fähigkeit wird kurz vorgeführt – jede Waffengattung auf ihre Art:
      Schwere Waffen werden in die Höhe gestemmt, Klingen gewirbelt, Stangen gedreht und aufgepflanzt,
      Bögen gespannt, Messer jongliert, Zauberzeug schwebt im Runenkreis, Schilde spannen eine Barriere.
      Seltenere Stücke leuchten stärker, Legenden holen einen Lichtstrahl vom Himmel,
      und Verfluchtes reißt Blitze, Ketten und Dunkelheit mit sich. */
(function () {
  "use strict";
  const Z = window.Z, FX = Z.fx, A = Z.audio, L = v => Z.L(v), inp = Z.input, ui = Z.ui;
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const TAU = Math.PI * 2;
  const ease = u => (u <= 0 ? 0 : u >= 1 ? 1 : 1 - Math.pow(1 - u, 3));
  const easeIO = u => (u <= 0 ? 0 : u >= 1 ? 1 : u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const span = (u, a, b) => clamp((u - a) / (b - a), 0, 1);

  /* ---------- Gattungen ---------- */
  const STYLE = {};
  const set = (st, list) => list.split(" ").forEach(k => (STYLE[k] = st));
  set("stemmen", "hammer club axe zweihaender anchor flegel scythe stonefist fist");
  set("wirbel", "sickles dagger scimitar rapier dawn krallen claw whip");
  set("stange", "spear hellebarde kampfstab staff");
  set("bogen", "bow xbow schleuder");
  set("jongl", "knives");
  set("zauber", "vial feuerkugel eiszapfen web");
  set("schild", "shield goldshield thornshield");
  const styleOf = it => (it.type === "skill" ? "gabe" : STYLE[Z.itemDef(it).icon] || "wirbel");

  /* ---------- eigene Funken (laufen in Echtzeit, auch wenn die Welt stillsteht) ---------- */
  let ps = [];
  const spark = (x, y, vx, vy, life, size, col, g) => { if (ps.length < 420) ps.push({ x, y, vx, vy, life, max: life, size, col, g: g == null ? 0 : g }); };
  function burst(x, y, n, col, sp, life, size, g) {
    const q = Z.gq && Z.gq.level === 0 ? 0.4 : 1;
    for (let i = 0; i < n * q; i++) { const a = Math.random() * TAU, v = sp * (0.35 + Math.random() * 0.65); spark(x, y, Math.cos(a) * v, Math.sin(a) * v, life * (0.6 + Math.random() * 0.6), size * (0.6 + Math.random() * 0.7), Array.isArray(col) ? col[i % col.length] : col, g); }
  }
  function stepSparks(dt) {
    for (const p of ps) { p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 1 - 2.2 * dt; p.vy = p.vy * (1 - 2.2 * dt) + p.g * dt; }
    ps = ps.filter(p => p.life > 0);
  }
  function drawSparks(c) {
    c.save(); c.globalCompositeOperation = "lighter";
    for (const p of ps) { const a = clamp(p.life / p.max, 0, 1); c.globalAlpha = a; c.fillStyle = p.col; c.beginPath(); c.arc(p.x, p.y, p.size * (0.5 + a * 0.5), 0, TAU); c.fill(); }
    c.restore();
  }
  function halo(c, x, y, r, col, a) {
    const g = c.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, col); g.addColorStop(1, "rgba(0,0,0,0)");
    c.globalAlpha = a; c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); c.globalAlpha = 1;
  }
  const rgba = (hex, a) => { const h = hex.replace("#", ""); const n = parseInt(h.length === 3 ? h.split("").map(x => x + x).join("") : h, 16); return "rgba(" + (n >> 16 & 255) + "," + (n >> 8 & 255) + "," + (n & 255) + "," + a + ")"; };

  /* Waffe zeichnen: ang = 0 heißt „Spitze nach oben" */
  function drawItem(c, it, x, y, size, ang, alpha) {
    const d = Z.itemDef(it);
    c.save(); c.globalAlpha = alpha == null ? 1 : alpha; c.translate(x, y); c.rotate(ang || 0);
    if (it.type !== "skill") c.rotate(-0.79);
    Z.drawIcon(c, d.icon, 0, 0, size, d.col);
    c.restore();
  }
  function star(c, x, y, r, col, a) {
    c.save(); c.globalCompositeOperation = "lighter"; c.globalAlpha = a; c.fillStyle = col; c.translate(x, y);
    for (let k = 0; k < 2; k++) { c.rotate(Math.PI / 4 * k); c.beginPath(); c.moveTo(0, -r); c.lineTo(r * 0.16, 0); c.lineTo(0, r); c.lineTo(-r * 0.16, 0); c.closePath(); c.fill(); c.beginPath(); c.moveTo(-r, 0); c.lineTo(0, r * 0.16); c.lineTo(r, 0); c.lineTo(0, -r * 0.16); c.closePath(); c.fill(); }
    c.restore();
  }
  function runeRing(c, x, y, r, rot, col, a, flat) {
    c.save(); c.translate(x, y); if (flat) c.scale(1, 0.32); c.rotate(rot);
    c.globalCompositeOperation = "lighter"; c.globalAlpha = a; c.strokeStyle = col; c.fillStyle = col; c.lineWidth = 1.2;
    c.beginPath(); c.arc(0, 0, r, 0, TAU); c.stroke();
    c.beginPath(); c.arc(0, 0, r * 0.78, 0, TAU); c.stroke();
    for (let i = 0; i < 12; i++) {
      const q = i / 12 * TAU; c.save(); c.rotate(q); c.translate(0, -r * 0.89);
      const g = i % 4; c.beginPath();
      if (g === 0) { c.moveTo(-2, 2); c.lineTo(0, -2); c.lineTo(2, 2); }
      else if (g === 1) { c.moveTo(-2, -2); c.lineTo(2, 2); c.moveTo(2, -2); c.lineTo(-2, 2); }
      else if (g === 2) { c.arc(0, 0, 1.6, 0, TAU); }
      else { c.moveTo(0, -2.4); c.lineTo(0, 2.4); c.moveTo(-1.8, -0.6); c.lineTo(1.8, -0.6); }
      c.stroke(); c.restore();
    }
    for (let i = 0; i < 3; i++) { const q = i / 3 * TAU; c.beginPath(); c.moveTo(Math.cos(q) * r * 0.78, Math.sin(q) * r * 0.78); c.lineTo(Math.cos(q + TAU / 3) * r * 0.78, Math.sin(q + TAU / 3) * r * 0.78); c.stroke(); }
    c.restore();
  }
  function bolt(x0, y0, x1, y1) {
    const pts = [[x0, y0]], n = 9;
    for (let i = 1; i < n; i++) { const u = i / n; pts.push([x0 + (x1 - x0) * u + (Math.random() - 0.5) * 18, y0 + (y1 - y0) * u + (Math.random() - 0.5) * 6]); }
    pts.push([x1, y1]); return pts;
  }
  function drawBolt(c, pts, col, a) {
    c.save(); c.globalCompositeOperation = "lighter"; c.lineJoin = "round";
    for (const [w, al, cc] of [[5, 0.25, col], [2.2, 0.8, col], [0.9, 1, "#fff"]]) {
      c.globalAlpha = a * al; c.strokeStyle = cc; c.lineWidth = w; c.beginPath(); c.moveTo(pts[0][0], pts[0][1]);
      for (let i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]); c.stroke();
    }
    c.restore();
  }

  /* ---------- Vorführung ---------- */
  let pres = null, pend = null, lastNow = 0;
  Z.presentItem = function (it) {
    if (!it || !Z.player || (Z.settings && Z.settings.presentOff)) return;
    const st = styleOf(it), cursed = !!it.cursed, rar = it.rar || 0;
    pres = { it, st, t: 0, dur: cursed ? 2.7 : rar >= 3 ? 1.8 : rar >= 2 ? 1.45 : 1.2, cursed, rar, bolts: [], boltT: 0.25, flags: {}, chainsOn: cursed };
    ps = [];
    A.play(cursed ? "dark" : rar >= 3 ? "holy" : "pickup", { vol: 0.6 });
    if (cursed) { A.play("chain", { vol: 0.5 }); inp.rumble && inp.rumble(0.35, 260); }
  };
  Z.presenting = () => !!pres;

  function stepPresent(dt) {
    const p = pres, P = Z.player;
    if (!P || P.dead || !Z.level) { pres = null; return; }
    p.t += dt;
    const u = p.t / p.dur;
    const anyKey = inp.pressed.jump || inp.pressed.a1 || inp.pressed.a2 || inp.pressed.use || inp.pressed.roll;
    for (const k in inp.pressed) inp.pressed[k] = false;
    if (anyKey && p.t > 0.45 && u < 0.86) p.t = p.dur * 0.86;
    if (p.t >= p.dur) { pres = null; return; }
    FX.hitstop = Math.max(FX.hitstop || 0, 0.06);
    const d = Z.itemDef(p.it), col = p.cursed ? "#c040ff" : d.col || "#fff";
    const rc = p.cursed ? "#c040ff" : Z.RARITY[p.rar].col;
    const hx = P.x + P.w / 2, top = P.y - 13;
    const peak = p.cursed ? 0.42 : 0.4;
    /* einmalige Momente */
    const once = (k, at, fn) => { if (!p.flags[k] && u >= at) { p.flags[k] = true; fn(); } };
    once("peak", peak, () => {
      burst(hx, top - 4, p.rar >= 2 ? 22 : 14, [rc, rc, col, "#fff"], 150, 0.55, 1.1, 0);
      FX.addShake && FX.addShake(p.st === "stemmen" ? 5 : p.cursed ? 6 : 2, 8);
      if (p.st === "stemmen") { A.play("quake", { vol: 0.5 }); for (let i = 0; i < 18; i++) spark(hx + (Math.random() - 0.5) * 18, P.y + P.h, (Math.random() - 0.5) * 160, -30 - Math.random() * 60, 0.7, 2.2, "#b8a080", 220); }
      if (p.st === "wirbel") A.play("slash", { vol: 0.5 });
      if (p.st === "stange") A.play("hitMetal", { vol: 0.45 });
      if (p.st === "schild") A.play("block", { vol: 0.55 });
      if (p.st === "zauber" || p.st === "gabe") A.play("magic", { vol: 0.5 });
      if (p.rar >= 3) A.play("holy", { vol: 0.4 });
    });
    if (p.st === "bogen") once("shot", 0.56, () => { A.play("bow", { vol: 0.6 }); p.arrow = { y: top - 14, vy: -420 }; });
    if (p.arrow) { p.arrow.y += p.arrow.vy * dt; spark(hx + (Math.random() - 0.5) * 2, p.arrow.y + 6, 0, 20, 0.35, 1.4, col, 0); if (p.arrow.y < top - 78 && !p.arrow.done) { p.arrow.done = true; burst(hx, p.arrow.y, 40, [col, "#fff", rc], 150, 0.9, 1.7, 60); A.play("zap", { vol: 0.4 }); } }
    if (p.cursed) {
      p.boltT -= dt;
      if (u > 0.12 && u < 0.78 && p.boltT <= 0) {
        p.boltT = 0.16 + Math.random() * 0.22;
        const cam = Z.cam; p.bolts.push({ pts: bolt(hx + (Math.random() - 0.5) * 120, cam.y - 10, hx + (Math.random() - 0.5) * 4, top - 6), life: 0.18 });
        A.play("thunder", { vol: 0.25 }); burst(hx, top - 6, 8, ["#c040ff", "#ff9af0"], 90, 0.4, 1.5, 0);
      }
      for (const b of p.bolts) b.life -= dt; p.bolts = p.bolts.filter(b => b.life > 0);
      once("chains", 0.58, () => { p.chainsOn = false; A.play("break", { vol: 0.6 }); A.play("roar", { vol: 0.3 }); for (let i = 0; i < 26; i++) spark(hx, top + 4, (Math.random() - 0.5) * 260, -40 - Math.random() * 140, 1, 2, i % 2 ? "#8a7a90" : "#c040ff", 320); inp.rumble && inp.rumble(0.6, 320); });
      if (Math.random() < 0.6) spark(hx + (Math.random() - 0.5) * 50, P.y + P.h, 0, -30 - Math.random() * 40, 1.1, 1.6, "#9a30e0", -10);
    } else if (u > 0.2 && u < 0.85 && Math.random() < 0.25 + p.rar * 0.15) spark(hx + (Math.random() - 0.5) * 16, top + (Math.random() - 0.5) * 14, (Math.random() - 0.5) * 20, -25, 0.8, 1.4, rc, -10);
    stepSparks(dt);
  }

  function drawPresent(c, cam, W, H) {
    const p = pres, P = Z.player, it = p.it, d = Z.itemDef(it);
    const u = p.t / p.dur, col = p.cursed ? "#c040ff" : d.col || "#fff", rc = p.cursed ? "#c040ff" : Z.RARITY[p.rar].col;
    const hx = P.x + P.w / 2, hand = P.y + P.h * 0.45, top = P.y - 13;
    const peak = p.cursed ? 0.42 : 0.4;
    const rise = easeIO(span(u, 0.04, peak)), out = span(u, 0.86, 1);
    let x = hx, y = hand + (top - hand) * rise, ang = 0, size = 15 + rise * 5 + (p.cursed ? 3 : 0), alpha = 1 - out;
    y += out * (hand - top) * 0.7; size *= 1 - out * 0.4;
    const t = p.t, after = span(u, peak, peak + 0.1);
    /* Untergrund: Dunkelheit (Fluch), Lichtsäule (Legende), Strahlen (Episch) */
    if (p.cursed) {
      const S = Z.gfx.scale || 1, sx = (hx - cam.x) * S, sy = (top - cam.y) * S;
      const a = 0.72 * span(u, 0, 0.15) * (1 - out);
      c.save(); c.setTransform(1, 0, 0, 1, 0, 0);
      const g = c.createRadialGradient(sx, sy, 30 * S, sx, sy, Math.max(W, H) * 0.7);
      g.addColorStop(0, "rgba(20,0,30,0)"); g.addColorStop(0.35, "rgba(16,0,24," + a * 0.7 + ")"); g.addColorStop(1, "rgba(6,0,10," + a + ")");
      c.fillStyle = g; c.fillRect(0, 0, W, H); c.restore();
      runeRing(c, hx, P.y + P.h + 1, 30 + rise * 8, t * 1.4, "#c040ff", 0.8 * span(u, 0.05, 0.25) * (1 - out), true);
      runeRing(c, hx, P.y + P.h + 1, 20, -t * 2.2, "#ff6ae0", 0.5 * span(u, 0.1, 0.3) * (1 - out), true);
      for (const b of p.bolts) drawBolt(c, b.pts, "#c040ff", b.life / 0.18);
    }
    c.save(); c.globalCompositeOperation = "lighter";
    if (p.rar >= 3 || p.cursed) {
      const a = (p.cursed ? 0.5 : 0.42) * span(u, 0.15, peak) * (1 - out), w = 14 + Math.sin(t * 9) * 2;
      const g = c.createLinearGradient(0, cam.y, 0, top); g.addColorStop(0, rgba(p.cursed ? "#5a10a0" : "#ffd27a", 0)); g.addColorStop(1, rgba(p.cursed ? "#c040ff" : "#fff0b0", a));
      c.fillStyle = g; c.fillRect(hx - w / 2, cam.y, w, top - cam.y + 4);
    }
    if (p.rar >= 2 || p.cursed) {
      const a = 0.32 * after * (1 - out);
      c.globalAlpha = a; c.fillStyle = rc;
      for (let i = 0; i < 10; i++) { const q = t * 0.8 + i / 10 * TAU; c.beginPath(); c.moveTo(hx, top); c.lineTo(hx + Math.cos(q - 0.07) * 46, top + Math.sin(q - 0.07) * 46); c.lineTo(hx + Math.cos(q + 0.07) * 46, top + Math.sin(q + 0.07) * 46); c.closePath(); c.fill(); }
      c.globalAlpha = 1;
    }
    halo(c, x, y, 16 + p.rar * 5 + (p.cursed ? 10 : 0) + Math.sin(t * 7) * 2, rgba(rc, 0.6), alpha * (0.5 + 0.5 * rise));
    c.restore();

    /* Gattung */
    const st = p.st;
    if (st === "stemmen") {
      ang = Math.PI * (1 - rise) * 0.9;
      if (u >= peak) {
        const s = span(u, peak, peak + 0.3);
        c.save(); c.globalCompositeOperation = "lighter"; c.globalAlpha = (1 - s) * 0.8; c.strokeStyle = rc; c.lineWidth = 2;
        c.beginPath(); c.ellipse(hx, P.y + P.h, 8 + s * 60, 2 + s * 12, 0, 0, TAU); c.stroke();
        c.beginPath(); c.arc(x, y, 6 + s * 34, 0, TAU); c.stroke(); c.restore();
      }
    } else if (st === "wirbel") {
      ang = (1 - rise) * TAU * 2;
      if (u > peak) { const g = span(u, peak, peak + 0.25); star(c, x + Math.sin(g * Math.PI) * 2, y - 8 + g * 10, 7 * Math.sin(g * Math.PI) + 1, "#fff", (1 - g) * alpha); }
      if (u > 0.05 && u < peak) { c.save(); c.globalCompositeOperation = "lighter"; c.globalAlpha = 0.35; c.strokeStyle = rc; c.lineWidth = 2; c.beginPath(); c.arc(x, y, 11, -ang - 1.2, -ang + 0.4); c.stroke(); c.restore(); }
    } else if (st === "stange") {
      const tw = 1 - rise;
      ang = Math.sin(tw * Math.PI * 3) * 1.6 * tw;
      if (u > peak) {
        const s = span(u, peak, peak + 0.35);
        c.save(); c.globalCompositeOperation = "lighter";
        c.globalAlpha = (1 - s) * 0.55; const g = c.createLinearGradient(0, y, 0, P.y + P.h); g.addColorStop(0, rgba(rc, 0)); g.addColorStop(1, rgba(rc, 0.9)); c.fillStyle = g; c.fillRect(x - 3, y, 6, P.y + P.h - y);
        c.globalAlpha = (1 - s) * 0.9; c.strokeStyle = rc; c.lineWidth = 1.5; c.beginPath();
        for (const k of [-1, 1]) { c.moveTo(hx, P.y + P.h); c.lineTo(hx + k * (10 + s * 26), P.y + P.h - 1); c.lineTo(hx + k * (16 + s * 34), P.y + P.h + 1); }
        c.stroke(); c.restore();
      }
    } else if (st === "bogen") {
      ang = 0;
      const pull = easeIO(span(u, peak - 0.05, 0.55)) * 7 * (p.flags.shot ? 0 : 1);
      if (!p.flags.shot && u > 0.12) {
        c.save(); c.globalCompositeOperation = "lighter"; c.globalAlpha = alpha; c.strokeStyle = col; c.lineWidth = 1.4;
        c.beginPath(); c.moveTo(x, y - 12 + pull); c.lineTo(x, y + 6 + pull); c.stroke();
        c.fillStyle = "#fff"; c.beginPath(); c.moveTo(x, y - 16 + pull); c.lineTo(x - 2.5, y - 11 + pull); c.lineTo(x + 2.5, y - 11 + pull); c.closePath(); c.fill();
        halo(c, x, y - 14 + pull, 6 + pull, rgba(col, 0.8), 0.8); c.restore();
      }
      if (p.arrow && !p.arrow.done) { c.save(); c.globalCompositeOperation = "lighter"; c.strokeStyle = "#fff"; c.lineWidth = 1.6; c.beginPath(); c.moveTo(hx, p.arrow.y); c.lineTo(hx, p.arrow.y + 14); c.stroke(); halo(c, hx, p.arrow.y, 8, rgba(col, 0.9), 1); c.restore(); }
    } else if (st === "jongl") {
      const n = 3;
      for (let i = 0; i < n; i++) {
        const ph = t * 5.5 + i / n * TAU, fan = after;
        const jx = Math.cos(ph) * 9 * (1 - fan) + (i - 1) * 7 * fan, jy = -Math.abs(Math.sin(ph)) * 14 * (1 - fan) - 2 * fan;
        drawItem(c, it, x + jx, y + jy, size * 0.75, (1 - fan) * ph * 2 + (i - 1) * 0.35 * fan, alpha);
      }
      drawFront(c, p, x, y);
      return banner(c, p, W, H);
    } else if (st === "zauber" || st === "gabe") {
      ang = st === "zauber" ? Math.sin(t * 3) * 0.12 : 0;
      y += Math.sin(t * 4) * 1.5;
      runeRing(c, x, y, 13 + rise * 4, t * (st === "zauber" ? 1.6 : -1), rc, 0.75 * rise * alpha, false);
      if (Math.random() < 0.5) { const q = Math.random() * TAU; spark(x + Math.cos(q) * 16, y + Math.sin(q) * 16, -Math.cos(q) * 30, -Math.sin(q) * 30, 0.5, 1.3, col, 0); }
    } else if (st === "schild") {
      ang = 0; x = hx + (P.face || 1) * 5 * rise;
      if (u > peak) {
        const s = span(u, peak, peak + 0.4);
        c.save(); c.globalCompositeOperation = "lighter"; c.globalAlpha = (1 - s) * 0.85; c.strokeStyle = rc; c.lineWidth = 1.6;
        const r = 10 + s * 30; c.beginPath();
        for (let i = 0; i <= 6; i++) { const q = i / 6 * TAU + Math.PI / 6; const px = x + Math.cos(q) * r, py = y + Math.sin(q) * r; i ? c.lineTo(px, py) : c.moveTo(px, py); }
        c.stroke(); c.globalAlpha = (1 - s) * 0.25; c.fillStyle = rc; c.fill(); c.restore();
      }
    }
    drawItem(c, it, x, y, size, ang, alpha);
    /* Glanzlicht über die Waffe */
    if (u > peak && u < peak + 0.2) { const s = span(u, peak, peak + 0.2); c.save(); c.globalCompositeOperation = "lighter"; c.globalAlpha = (1 - Math.abs(s - 0.5) * 2) * 0.8; halo(c, x, y + 10 - s * 20, 7, "rgba(255,255,255,.9)", 1); c.restore(); }
    drawFront(c, p, x, y);
    banner(c, p, W, H);
  }
  function drawFront(c, p, x, y) {
    if (p.cursed && p.chainsOn) {
      const P = Z.player, u = p.t / p.dur, a = span(u, 0.05, 0.2);
      c.save(); c.globalAlpha = a; c.strokeStyle = "#8a7a90"; c.lineWidth = 1.3;
      for (const [ex, ey] of [[-26, P.y + P.h], [26, P.y + P.h], [-34, P.y - 30], [34, P.y - 30]]) {
        const tx = P.x + P.w / 2 + ex, n = 9, sag = Math.sin(p.t * 10 + ex) * 1.5;
        for (let i = 0; i < n; i++) { const k = (i + 0.5) / n; const cx = x + (tx - x) * k, cy = y + (ey - y) * k + Math.sin(k * Math.PI) * 4 + sag; c.beginPath(); c.ellipse(cx, cy, 1.8, 1.1, Math.atan2(ey - y, tx - x) + (i % 2 ? Math.PI / 2 : 0), 0, TAU); c.stroke(); }
      }
      c.restore();
    }
    drawSparks(c);
  }
  function banner(c, p, W, H) {
    const u = p.t / p.dur, a = span(u, 0.12, 0.3) * (1 - span(u, 0.84, 1));
    if (a <= 0) return;
    const it = p.it, d = Z.itemDef(it), r = Z.RARITY[it.rar];
    const fs = clamp(Math.min(W, H) * 0.055, 15, 46), fd = getComputedStyle(document.documentElement).getPropertyValue("--fd") || "serif";
    c.save(); c.setTransform(1, 0, 0, 1, 0, 0);
    const Pp = Z.player, psy = Pp ? (Pp.y - Z.cam.y) * (Z.gfx.scale || 1) : H; const cy = (psy < H * 0.5 ? H * 0.72 : H * 0.24) + (1 - span(u, 0.12, 0.3)) * 10;
    const shake = p.cursed && u < 0.62 ? (Math.random() - 0.5) * 2.5 : 0;
    c.globalAlpha = a * 0.6; const g = c.createLinearGradient(0, cy - fs * 1.4, 0, cy + fs * 1.6); g.addColorStop(0, "rgba(8,4,8,0)"); g.addColorStop(0.5, "rgba(8,4,8,.85)"); g.addColorStop(1, "rgba(8,4,8,0)"); c.fillStyle = g; c.fillRect(0, cy - fs * 1.4, W, fs * 3);
    c.globalAlpha = a; c.textAlign = "center"; c.textBaseline = "middle";
    if (p.cursed) { c.font = "700 " + Math.round(fs * 0.48) + "px " + fd; c.fillStyle = "#ff9af0"; c.fillText("☠ " + L(Z.CURSE[it.cursed].name).toUpperCase() + " ☠", W / 2 + shake, cy - fs * 0.95); }
    c.font = Math.round(fs) + "px " + fd; c.shadowColor = p.cursed ? "#c040ff" : r.col; c.shadowBlur = fs * 0.5;
    c.fillStyle = p.cursed ? "#f0d0ff" : r.col; c.fillText(L(d.n), W / 2 + shake, cy);
    c.shadowBlur = 0; c.font = "600 " + Math.round(fs * 0.42) + "px " + (getComputedStyle(document.documentElement).getPropertyValue("--fb") || "sans-serif");
    const pw = it.power && Z.CPOWER && Z.CPOWER[it.power];
    c.fillStyle = pw ? "#ff9af0" : "#d8c8b8";
    c.fillText(pw ? "✦ " + L(pw.n) + " ✦" : L(r.n) + (it.aff && it.aff.length ? " · " + it.aff.map(k => L(Z.AFFIX[k].n)).join(" · ") : ""), W / 2, cy + fs * 0.85);
    c.restore();
  }

  /* in jedes Bild einhängen */
  const after0 = Z.drawAfterLight;
  Z.drawAfterLight = function (c, cam, W, H, t) {
    if (after0) after0.apply(this, arguments);
    const now = performance.now(), dt = Math.min(0.05, (now - (lastNow || now)) / 1000); lastNow = now;
    const P = Z.player;
    if (pend && P) {
      if (Object.values(P.slots).includes(pend)) { const it = pend; pend = null; Z.presentItem(it); }
      else if (!ui.choiceActive && !ui.modalOpen) pend = null;
    }
    if (!pres) return;
    const cardEl = document.getElementById("card"); if (cardEl) cardEl.hidden = true;
    if (!ui.modalOpen) stepPresent(dt);
    if (pres) drawPresent(c, cam, W, H);
  };

  /* ---------- Aufheben: Vorführung anstoßen, Verfluchtes erst ansehen ---------- */
  const offer0 = ui.offerItem;
  function takeInto(p, slot) {
    const P = Z.player, isSkill = p.it.type === "skill", sA = isSkill ? "s1" : "a1", sB = isSkill ? "s2" : "a2";
    pend = p.it;
    if (slot && P.slots[sA] && P.slots[sB]) {
      offer0(p);
      const c = ui.choiceActive;
      if (c && c.p === p) { ui.choiceActive = null; ui.choiceEl().hidden = true; c.place(slot); }
    } else offer0(p);
  }
  ui.offerItem = function (p) {
    if (p.it && p.it.cursed && !p.seenCurse) return cursedOffer(p, null);
    pend = p.it;
    return offer0(p);
  };

  /* ---------- Fenster für Verfluchtes ---------- */
  let prevRAF = 0;
  function preview(it) {
    cancelAnimationFrame(prevRAF);
    const cv = document.querySelector("#modal .fv-bild canvas"); if (!cv) return;
    const c = cv.getContext("2d"), t0 = performance.now();
    const loop = now => {
      if (!cv.isConnected) return;
      const t = (now - t0) / 1000; c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, cv.width, cv.height);
      c.setTransform(2, 0, 0, 2, 0, 0);
      const W = cv.width / 2, H = cv.height / 2;
      c.save(); c.globalCompositeOperation = "lighter"; halo(c, W / 2, H / 2, 34 + Math.sin(t * 3) * 3, "rgba(192,64,255,.55)", 1); c.restore();
      runeRing(c, W / 2, H / 2, 32, t * 0.9, "#c040ff", 0.7, false);
      runeRing(c, W / 2, H / 2 + 26, 26, -t * 1.4, "#ff6ae0", 0.5, true);
      if (Math.random() < 0.06) { const b = bolt(W / 2 + (Math.random() - 0.5) * 60, 0, W / 2, H / 2 - 8); drawBolt(c, b, "#c040ff", 0.9); }
      drawItem(c, it, W / 2, H / 2 + Math.sin(t * 2) * 2, it.type === "skill" ? 40 : 46, Math.sin(t * 1.3) * 0.1, 1);
      prevRAF = requestAnimationFrame(loop);
    };
    prevRAF = requestAnimationFrame(loop);
  }
  function slotLabel(s) { const P = Z.player, o = P.slots[s]; return o ? '<span style="color:' + (o.cursed ? "#c040ff" : Z.RARITY[o.rar].col) + '">' + esc(L(Z.itemDef(o).n)) + "</span>" : L(["leerer Platz", "empty slot"]); }
  let ctx = null;
  function cursedOffer(p, chestOpen) {
    const P = Z.player, it = p.it || p.preIt, isSkill = it.type === "skill", sA = isSkill ? "s1" : "a1", sB = isSkill ? "s2" : "a2";
    const cu = Z.CURSE[it.cursed], pw = it.power && Z.CPOWER && Z.CPOWER[it.power];
    const both = P.slots[sA] && P.slots[sB];
    const verb = chestOpen ? L(["Öffnen & ", "Open & "]) : "";
    const btn = (arg, txt, af) => '<button data-act="fvTake" data-arg="' + arg + '"' + (af ? " autofocus" : "") + ">" + txt + "</button>";
    let take = "";
    if (both) take = [sA, sB].map(s => btn(s, verb + L(["anlegen statt ", "equip instead of "]) + slotLabel(s) + ' <kbd>' + esc(inp.device === "pad" ? inp.label(s) : "") + "</kbd>")).join("");
    else take = btn("auto", verb + L(["anlegen", "equip"]));
    if (chestOpen) take += btn("leave", L(["Nur öffnen – liegen lassen", "Just open – leave it"]));
    const rules = "<ul class=\"fv-regeln\">" +
      (chestOpen ? "<li>" + L(["Öffnen und Anschauen kostet nichts – nur das Anlegen bringt den Fluch.", "Opening and looking costs nothing – only equipping brings the curse."]) + "</li>" : "") +
      "<li>" + L(["Legst du sie an: ", "If you equip it: "]) + "<b>" + cu.n + "</b>" + L([" Kills ohne Treffer. Jeder Treffer bis dahin tötet dich.", " kills without a hit. Any hit until then kills you."]) + "</li>" +
      "<li>" + L(["Danach bleibt sie für immer so stark: Schaden ×", "Afterwards it stays this strong for good: damage ×"]) + cu.mul.toFixed(1) + (pw ? L([" und ", " and "]) + "<b>" + esc(L(pw.n)) + "</b>" : "") + ".</li>" +
      (P.curse > 0 ? "<li class=\"warn\">" + L(["Du trägst schon einen Fluch: noch ", "You already carry a curse: "]) + P.curse + L([" Kills.", " kills left."]) + "</li>" : "") +
      "</ul>";
    ctx = { p, chestOpen };
    ui.open('<div class="fluchfund">' +
      "<h2>" + (chestOpen ? L(["Verfluchte Truhe", "Cursed Chest"]) : L(["Verfluchter Fund", "Cursed Find"])) + "</h2>" +
      '<p class="hinweis">' + (chestOpen ? L(["Durch die Ritzen siehst du, was darin liegt …", "Through the cracks you can see what lies within…"]) : L(["Die Waffe flüstert. Nimm dir Zeit.", "The weapon whispers. Take your time."])) + "</p>" +
      '<div class="fv-reihe"><div class="fv-bild"><canvas width="240" height="200"></canvas></div><div class="fv-karte">' + ui.itemCardHTML(it, true) + "</div></div>" + rules +
      '<div class="knoepfe">' + take + '<button data-act="fvNo" autofocus>' + (chestOpen ? L(["Zu lassen", "Keep it shut"]) : L(["Liegen lassen", "Leave it"])) + "</button></div></div>", { cls: "breit" });
    A.play("dark", { vol: 0.4 });
    setTimeout(() => preview(it), 20);
  }
  ui.cursedChest = function (chest, open) {
    if (!chest.preIt) chest.preIt = Z.rollItem({ rar: [35, 45, 16, 4], chest: true, cursedChest: true }) || Z.rollItem({ rar: [35, 45, 16, 4], chest: true });
    if (chest.preIt && !chest.preIt.cursed) Z.curseItem(chest.preIt, 1);
    if (!chest.preIt) return open(null);
    ctx = null; cursedOffer(chest, open); ctx.chest = chest;
  };
  ui.actions.fvNo = () => { cancelAnimationFrame(prevRAF); ctx = null; ui.close(); };
  ui.actions.fvTake = arg => {
    cancelAnimationFrame(prevRAF);
    const c = ctx; ctx = null; ui.close(); if (!c) return;
    let p = c.p;
    if (c.chestOpen) { p = c.chestOpen(c.chest.preIt); c.chest.preIt = null; if (!p) return; p.vy = 0; p.vx = 0; p.x = Z.player.x + Z.player.w / 2; }
    if (arg === "leave") return;
    p.seenCurse = true;
    takeInto(p, arg === "auto" ? null : arg);
  };
  /* Controller: X/Y direkt auf den passenden Platz */
  const frame0 = ui.frame;
  ui.frame = function (dt) {
    if (ctx && ui.modalOpen && document.querySelector("#modal .fluchfund")) {
      for (const s of ["a1", "a2", "s1", "s2"]) if (inp.pressed[s]) { const b = document.querySelector('#modal [data-act="fvTake"][data-arg="' + s + '"]'); if (b) { inp.consume(s); b.click(); return; } }
    }
    return frame0.apply(this, arguments);
  };
})();
