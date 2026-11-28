/* W53 Grauen: Bosse, Wächter, Zwischenbosse und Elite-Gegner wirken bedrohlicher – nur Darstellung.
   Keine Werte, Trefferflächen oder Angriffszeiten werden verändert; alles hier zeichnet zusätzlich (Z.haken-Hülle um
   Z.drawEnemy und Hüllen um die Gestalt-Funktionen der Bosse in Z.SHAPES).

   Für alle Bosse, Wächter und Zwischenbosse (ab Grafikstufe 1, mehr ab Stufe 2; auf Stufe 0 bzw. „schlank“ nur die
   billigen Kennzeichen der Zwischenbosse und Elite):
     - Dunkler Hof hinter dem Körper (Silhouette hebt sich ab), breiter weicher Bodenschatten.
     - Phasen-Aura: ab halber Kraft züngeln Flammen in Bossfarbe hinter der Gestalt, unter 25 % lodernd und pulsierend.
     - Glut-, Asche- bzw. Giftteilchen steigen auf (mehr je Phase), sichtbarer Atem (Dampf/Rauch aus Maul oder Nüstern).
     - Glühende Augen mit Schein; beim Auftritt und beim Phasenwechsel flammen sie grell auf.
     - Bodenrisse beim Auftritt, beim schweren Aufsetzen und bei jedem Phasenwechsel (dunkle Risse, schwach glimmende
       Ränder – blass genug, dass sie nie mit Warnflächen verwechselt werden; sie liegen hinter allem und verblassen).
     - Treffer: kurzes Zucken (zeichnerisch), Splitter/Glut aus der Trefferstelle.
     - Tod: Aschesäule, Glutfunken, Risse am Boden, ein dunkler Ring.
   Je Gestalt Details: Drachen (Schuppenränder im Randlicht, Narben, Glutnähte bzw. Giftgeifer, zerrissene Flügelhaut,
   Rauch aus den Nüstern), Riese (Narben, Kriegsbemalung, Kette mit Schelle am Gürtel, Dampfatem), Golem (glühende
   Runenrisse, Schmelztropfen), Bugbear (Narbe übers Auge, Geifer, Knochenkette), Wraith (Geisterketten mit Fesseln,
   Seelenschleier), Chasme (Giftstachel, Geifer), Weberin (Borsten, Giftzähne), Erzpriesterin (Tentakelkrone, Schleim),
   Glasstab (glühende Augen unter der Kapuze, Phiole), Vrock (Knochenkette, rote Augen), Buppido (irres Augenglimmen,
   Blutstropfen), Demogorgon (Geifer aus beiden Mäulern, Dampf).
   Zwischenbosse: schwebende Dornenkrone über dem Kopf, kreisendes Siegel am Boden, dunkler Hof – deutlich anders als
   normale Gegner. Elite: kleine Eisenkrone mit Glutstein und Siegelring am Boden.
   Lesbarkeit: alle Zusätze liegen hinter dem Körper oder sind klein; Vorwarn-Glühen, Glyphen und Warnflächen werden
   nicht verdeckt (die Aura wird während eines Anlaufs gedämpft). Kein Blau.
   Abschalten (Tests/Messung): Z.gfx.off.grauen = true. Prüfhilfe: Z.grauen.stand(e). */
(function () {
  "use strict";
  const Z = window.Z; if (!Z || !Z.haken || Z.grauen) return;
  const PI = Math.PI, TAU = PI * 2;
  const G = (Z.grauen = { zaehler: { bild: 0, risse: 0, tod: 0, auftritt: 0 } });
  const D = () => Z.draw;

  /* Stufe: 0 = nur Kennzeichen (schlank/Stufe 0), 1 = Grundzusätze, 2 = alles */
  function stufe() {
    if (Z.gfx && Z.gfx.off && Z.gfx.off.grauen) return -1;
    if (Z.gq && (Z.gq.lean || Z.gq.mini)) return 0;
    const lq = Z.gfx && Z.gfx.lq ? Z.gfx.lq() : 2;
    return lq <= 0 ? 0 : lq === 1 ? 1 : 2;
  }
  G.stufe = stufe;

  /* ---------- Farben je Boss (kein Blau): Glut, Violett, Giftgrün, Blutrot, Gold, Knochenweiß ---------- */
  const GLUT = [255, 120, 40], VIOL = [190, 90, 255], GIFT = [150, 230, 60], BLUT = [225, 40, 35], GOLD = [255, 200, 90];
  const THEMA = { glasstab: GLUT, erzpriesterin: VIOL, bugbear: BLUT, nezna: VIOL, wraith: VIOL, schmiedewaechter: GLUT, chasme: BLUT,
    ilvaraW: GIFT, riese: BLUT, vrock: GIFT, demogorgon: VIOL, themberchaud: GLUT, venomfang: GIFT, weberin: BLUT, buppido: BLUT };
  const hexRgb = h => { const s = String(h || ""); if (!/^#[0-9a-f]{6}$/i.test(s)) return null; const n = parseInt(s.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
  /* Blau-Wächter: Farbtöne zwischen 175° und 250° werden zu Glut */
  function ohneBlau(rgb) {
    if (!rgb) return GLUT; const r = rgb[0] / 255, g = rgb[1] / 255, b = rgb[2] / 255, mx = Math.max(r, g, b), mn = Math.min(r, g, b);
    if (mx - mn < 0.12) return GOLD; let h;
    if (mx === r) h = ((g - b) / (mx - mn)) % 6; else if (mx === g) h = (b - r) / (mx - mn) + 2; else h = (r - g) / (mx - mn) + 4;
    h = (h * 60 + 360) % 360; if (h > 175 && h < 250) return GLUT; if (mx < 0.45) return GLUT; return rgb;
  }
  const rgba = (c, a) => "rgba(" + c[0] + "," + c[1] + "," + c[2] + "," + (a < 0 ? 0 : a > 1 ? 1 : a).toFixed(3) + ")";
  const rgbS = c => "rgb(" + c[0] + "," + c[1] + "," + c[2] + ")";
  const hell = (c, f) => [Math.min(255, c[0] + (255 - c[0]) * f) | 0, Math.min(255, c[1] + (255 - c[1]) * f) | 0, Math.min(255, c[2] + (255 - c[2]) * f) | 0];

  /* ---------- Art und Zustand ---------- */
  const BKEY = new WeakMap();
  function bossKey(d) {
    if (!d || !d.boss || !Z.BOSSDEF) return null; let k = BKEY.get(d); if (k !== undefined) return k; k = null;
    for (const id in Z.BOSSDEF) { const b = Z.BOSSDEF[id]; if (b === d || (b.shape === d.shape && b.c === d.c && b.t === d.t)) { k = id; break; } }
    BKEY.set(d, k); return k;
  }
  function art(e) {
    const d = e && e.def; if (!d || e.dummy || e.disguise) return "";
    if (d.boss) return e.warden ? "waechter" : "boss";
    if (e.nmMini) return "mini";
    if (e.elite) return "elite";
    return "";
  }
  function zustand(e) {
    let s = e._g53;
    if (!s) {
      const d = e.def, key = bossKey(d);
      const th = (key && THEMA[key]) || ohneBlau(hexRgb(d.t) || hexRgb(d.c));
      s = e._g53 = { key: key, th: th, hi: hell(th, 0.55), risse: [], ph: -1, flare: 0, fl: 0, tot: false, totT: 0, atem: Math.random() * 3, auf: false, mvSt: "", seed: Math.random() * 100, zuck: 0, luft: false };
    }
    return s;
  }
  function phaseOf(e) { const f = e.hpMax ? e.hp / e.hpMax : 1; return f < 0.25 ? 2 : f < 0.5 ? 1 : 0; }
  /* Angriffszustand wie in figuren.js (setQ), nur lesend */
  function qOf(e) {
    const d = e.def, q = { ph: "", pre: 0, mv: "" };
    const a = e.act;
    if (a && a.a) { q.ph = a.phase; if (a.phase === "pre") q.pre = Math.max(0, Math.min(1, a.t / Math.max(0.01, a.a.pre || 0.3))); }
    else if (d.boss && e.mv && d.moves && d.moves[e.mv.id]) {
      const m = e.mv, md = d.moves[m.id]; q.mv = m.id; q.ph = m.stage === "pre" ? "pre" : m.stage === "act" ? "act" : "post";
      if (q.ph === "pre") q.pre = Math.max(0, Math.min(1, m.t / Math.max(0.01, md.pre || 0.5)));
    }
    return q;
  }
  const eo = x => 1 - (1 - x) * (1 - x);

  /* ---------- dunkler Hof (Sprite, einmal gebaut) ---------- */
  let DUNKEL = null;
  function dunkelSprite() {
    if (DUNKEL) return DUNKEL;
    const cv = document.createElement("canvas"); cv.width = cv.height = 64; const g = cv.getContext("2d");
    const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, "rgba(4,2,6,1)"); gr.addColorStop(0.55, "rgba(4,2,6,.55)"); gr.addColorStop(1, "rgba(4,2,6,0)");
    g.fillStyle = gr; g.fillRect(0, 0, 64, 64); DUNKEL = cv; return cv;
  }
  function dunkel(c, x, y, rx, ry, a) {
    const pa = c.globalAlpha; c.globalAlpha = pa * a; c.drawImage(dunkelSprite(), x - rx, y - ry, rx * 2, ry * 2); c.globalAlpha = pa;
  }

  /* ---------- Bodenrisse ---------- */
  function risseAn(s, x, y, groesse, n) {
    if (s.risse.length > 5) s.risse.shift();
    const aeste = [];
    for (let i = 0; i < n; i++) {
      const dir = (i % 2 ? 1 : -1), len = groesse * (0.5 + Math.random() * 0.6); let px = x + (Math.random() - 0.5) * 4, py = y; const pts = [px, py];
      const seg = 4 + (Math.random() * 3 | 0);
      for (let j = 0; j < seg; j++) { px += dir * len / seg * (0.7 + Math.random() * 0.6); py += (Math.random() - 0.5) * 1.6; pts.push(px, py); }
      aeste.push(pts);
      if (Math.random() < 0.6) { const k = 2 * (1 + (Math.random() * (seg - 2) | 0)); aeste.push([pts[k], pts[k + 1], pts[k] + dir * len * 0.25, pts[k + 1] + (Math.random() - 0.5) * 3, pts[k] + dir * len * 0.4, pts[k + 1] + (Math.random() - 0.5) * 3]); }
    }
    s.risse.push({ x: x, y: y, aeste: aeste, t: 0, life: 4.5 }); G.zaehler.risse++;
  }
  function risseZeichnen(c, s, dt, lv) {
    for (let i = s.risse.length - 1; i >= 0; i--) {
      const r = s.risse[i]; r.t += dt; if (r.t > r.life) { s.risse.splice(i, 1); continue; }
      const wachs = Math.min(1, r.t / 0.25), a = Math.min(1, (r.life - r.t) / 1.2);
      c.lineCap = "round"; c.lineJoin = "round";
      for (let pass = 0; pass < (lv >= 2 ? 2 : 1); pass++) {
        c.strokeStyle = pass === 0 ? "rgba(8,4,4," + (0.75 * a).toFixed(3) + ")" : rgba(s.th, 0.32 * a * (0.6 + 0.4 * Math.sin(r.t * 5)));
        c.lineWidth = pass === 0 ? 1.3 : 0.5; c.beginPath();
        for (const p of r.aeste) { const m = Math.max(2, Math.round((p.length / 2) * wachs)); c.moveTo(p[0], p[1] - 0.2); for (let j = 1; j < m; j++) c.lineTo(p[j * 2], p[j * 2 + 1] - 0.2); }
        c.stroke();
      }
    }
  }

  /* ---------- Aura je Phase: Flammenzungen hinter der Gestalt ---------- */
  function aura(c, e, s, t, ph, lv, ged) {
    const cx = e.x + e.w / 2, cy = e.y + e.h * 0.5, R = Math.max(e.w, e.h) * 0.55;
    const k = ged ? 0.45 : 1;
    if (ph >= 1 && lv >= 1) {
      const n = lv >= 2 ? (ph === 2 ? 9 : 6) : 4, puls = ph === 2 ? 0.75 + 0.25 * Math.sin(t * 9) : 0.85;
      const po = c.globalCompositeOperation; c.globalCompositeOperation = "lighter";
      for (let i = 0; i < n; i++) {
        const u = ((t * (0.55 + ph * 0.25) + i / n + s.seed) % 1), x0 = e.x + e.w * (0.08 + 0.84 * ((i * 0.618 + s.seed) % 1));
        const y0 = e.y + e.h * (0.95 - 0.2 * ((i * 0.37) % 1)), hgt = e.h * (0.45 + 0.35 * ph) * (0.6 + 0.4 * Math.sin(i * 2.1 + t * 3));
        const sw = Math.sin(t * 4 + i * 1.7) * e.w * 0.08, top = y0 - hgt * (0.5 + 0.5 * u), wd = Math.max(2.5, e.w * 0.07);
        c.fillStyle = rgba(i % 3 === 0 ? s.hi : s.th, (0.10 + 0.07 * ph) * puls * k * (1 - u * 0.6));
        c.beginPath(); c.moveTo(x0 - wd, y0); c.quadraticCurveTo(x0 - wd * 0.6 + sw, (y0 + top) / 2, x0 + sw * 1.8, top); c.quadraticCurveTo(x0 + wd * 0.6 + sw, (y0 + top) / 2, x0 + wd, y0); c.fill();
      }
      c.globalCompositeOperation = po;
      D().glow(c, cx, cy, R * (1.25 + 0.2 * ph) * puls, rgba(s.th, (0.12 + 0.08 * ph) * k));
    } else if (lv >= 2) D().glow(c, cx, cy, R * 1.1, rgba(s.th, 0.06 * k));
  }

  /* ---------- Kennzeichen: Dornenkrone (Zwischenboss), Eisenkrone (Elite), Siegel am Boden ---------- */
  function krone(c, x, y, b, mini, t, s) {
    const n = mini ? 5 : 3, hw = b / 2, bob = mini ? Math.sin(t * 2.2) * 0.6 : 0; y += bob;
    if (stufe() >= 1) D().glow(c, x, y - b * 0.3, b * 1.2, rgba(s.th, mini ? 0.35 : 0.22));
    /* Reif mit Zacken: dunkler Umriss, Knochen (Zwischenboss) bzw. Eisen (Elite) */
    c.fillStyle = mini ? "#ece0c6" : "#5a4e48"; c.strokeStyle = "rgba(10,6,6,.95)"; c.lineWidth = 0.9; c.lineJoin = "miter";
    c.beginPath(); c.moveTo(x - hw, y + b * 0.2);
    for (let i = 0; i < n; i++) { const x0 = x - hw + (b * i) / n, x1 = x0 + b / n, mid = (x0 + x1) / 2, hoch = (i === (n - 1) / 2 ? 0.95 : 0.65) * b * (mini ? 1 : 0.7);
      c.lineTo(x0, y - b * 0.08); c.lineTo(mid, y - hoch); c.lineTo(x1, y - b * 0.08); }
    c.lineTo(x + hw, y + b * 0.2); c.closePath(); c.stroke(); c.fill();
    c.fillStyle = mini ? "#8a6a44" : "#2a2224"; c.fillRect(x - hw, y + b * 0.02, b, b * 0.18);
    c.fillStyle = mini ? "#3a2a22" : "#1a1416"; for (let i = 0; i < n; i++) c.fillRect(x - hw + (b * (i + 0.5)) / n - 0.3, y - b * 0.3, 0.6, b * 0.22);
    const gem = mini ? rgbS(s.hi) : "#ff7030"; c.fillStyle = gem; c.beginPath(); c.arc(x, y + b * 0.1, b * 0.12, 0, TAU); c.fill();
    D().glow(c, x, y + b * 0.1, b * 0.5, mini ? rgba(s.th, 0.85) : "rgba(255,110,40,.7)");
  }
  function siegel(c, x, y, r, t, s, mini) {
    c.save(); c.strokeStyle = rgba(s.th, mini ? 0.45 : 0.3); c.lineWidth = 0.7;
    c.beginPath(); c.ellipse(x, y, r, r * 0.22, 0, 0, TAU); c.stroke();
    if (mini) { c.beginPath(); c.ellipse(x, y, r * 0.78, r * 0.17, 0, 0, TAU); c.stroke(); }
    const n = mini ? 6 : 4; c.fillStyle = rgba(s.hi, mini ? 0.6 : 0.4);
    for (let i = 0; i < n; i++) { const a = t * (mini ? 0.9 : 0.6) + (i / n) * TAU, px = x + Math.cos(a) * r * 0.89, py = y + Math.sin(a) * r * 0.2; c.fillRect(px - 0.8, py - 0.5, 1.6, 1); }
    c.restore();
  }

  /* ---------- Teilchen ---------- */
  const R = Math.random;
  function teilchen(e, s, ph, lv, dt) {
    const FX = Z.fx; if (!FX || !FX.p) return;
    const rate = (lv >= 2 ? 6 : 2.5) * (1 + ph * 1.2) * dt;
    if (R() < rate) {
      const gift = s.th === GIFT, viol = s.th === VIOL;
      FX.p({ x: e.x + R() * e.w, y: e.y + e.h * (0.3 + R() * 0.7), vx: (R() - 0.5) * 14, vy: -18 - R() * 26, life: 1 + R() * 0.8, size: 0.9 + R() * 0.9,
        col: R() < 0.35 ? (gift ? "#d8f088" : viol ? "#e8c8ff" : "#ffd8a0") : rgbS(s.th), kind: "glow", g: -12, drag: 0.97, add: true });
    }
    if (lv >= 2 && R() < rate * 0.5) FX.p({ x: e.x + R() * e.w, y: e.y + e.h * (0.2 + R() * 0.6), vx: (R() - 0.5) * 10, vy: -10 - R() * 10, life: 1.6 + R(), size: 1.2, col: R() < 0.5 ? "#2a2422" : "#4a4440", kind: "dot", g: -6, drag: 0.96 });
  }

  /* ---------- Gestalt-Details (lokale Koordinaten, wie die Gestalt selbst) ---------- */
  const lim = (c, x1, y1, x2, y2, w, col) => D().limb(c, x1, y1, x2, y2, w, col);
  function auge(c, x, y, r, s, k, st, flare, ph, farbe) {
    const col = farbe || s.hi;
    if (k("#000") !== "#000") return; /* Treffer-Blitz: Gestalt ist weiß, keine Augen darüber */
    const pul = 0.75 + 0.25 * Math.sin(st.t * (ph === 2 ? 11 : 4) + st.seed);
    D().glow(c, x, y, r * (4 + flare * 5 + ph * 1.2) * pul, rgba(col, 0.6 + 0.3 * flare));
    c.fillStyle = rgbS(hell(col, 0.6)); c.beginPath(); c.arc(x, y, r * 0.55, 0, TAU); c.fill();
  }
  function narbe(c, pts, k) { c.strokeStyle = k("#c89a8a"); c.lineWidth = 0.45; c.beginPath(); c.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 2) c.lineTo(pts[i], pts[i + 1]); c.stroke();
    c.strokeStyle = k("rgba(60,20,20,.5)"); c.lineWidth = 0.25; c.beginPath(); for (let i = 0; i < pts.length - 2; i += 2) { const mx = (pts[i] + pts[i + 2]) / 2, my = (pts[i + 1] + pts[i + 3]) / 2; c.moveTo(mx - 0.4, my - 0.7); c.lineTo(mx + 0.4, my + 0.7); } c.stroke(); }
  function kette(c, x1, y1, x2, y2, durch, n, k, col, gr) {
    const g = gr || 1; c.strokeStyle = k(col || "#8a8078"); c.lineWidth = 0.5 * g;
    const ang = Math.atan2(y2 - y1, x2 - x1);
    for (let i = 0; i <= n; i++) { const u = i / n, x = x1 + (x2 - x1) * u, y = y1 + (y2 - y1) * u + Math.sin(u * PI) * durch; c.beginPath(); if (i % 2) c.ellipse(x, y, 0.35 * g, 0.75 * g, ang, 0, TAU); else c.ellipse(x, y, 0.9 * g, 0.5 * g, ang, 0, TAU); c.stroke(); }
  }
  /* Weltpunkt aus lokalem Punkt (ohne Körperneigung – reicht für Teilchen) */
  function welt(e, lx, ly) { const s = e.size || 1; return [e.x + e.w / 2 + (e.face || 1) * lx * s, e.y + e.h + ly * s]; }
  function atem(e, st, lx, ly, dt, lv, art) {
    if (lv < 1 || !Z.fx) return;
    st.atem -= dt; if (st.atem > 0) return; st.atem = 1.5 + R() * 0.9;
    const p = welt(e, lx, ly), f = e.face || 1, gift = art === "gift", glut = art === "glut";
    for (let i = 0; i < (lv >= 2 ? 5 : 2); i++) Z.fx.p({ x: p[0], y: p[1], vx: f * (14 + R() * 16), vy: -4 - R() * 8, life: 0.9 + R() * 0.6, size: 1.6 + R() * 1.4, col: gift ? "rgba(150,200,70,.45)" : glut ? "rgba(90,80,76,.55)" : "rgba(220,214,206,.35)", kind: "smoke", g: -10, drag: 0.94 });
    if (glut && lv >= 2) Z.fx.p({ x: p[0], y: p[1], vx: f * (20 + R() * 16), vy: -10 - R() * 10, life: 0.6, size: 1, col: "#ffb040", kind: "glow", add: true });
  }
  function tropfen(e, lx, ly, col, rate, dt) { if (Z.fx && R() < rate * dt) { const p = welt(e, lx, ly); Z.fx.p({ x: p[0], y: p[1], vx: 0, vy: 10, life: 0.8, size: 1.1, col: col, kind: "drop", g: 420 }); } }

  const DET = {
    dragon(c, e, d, k, t, mv, ph, st, q, P, lv, dt) {
      const green = d.t === "#a8e050", m = q.mv, breath = m === "odem" || m === "giftatem", cr = q.ph === "pre" ? eo(q.pre) : 0;
      const hx = 16 + (breath ? (q.ph === "pre" ? -3 * cr : 2) : m === "klauen" && q.ph === "act" ? 4 : 0);
      const hy = -19 + (breath ? (q.ph === "pre" ? -3 * cr : 3) : 0);
      const by = cr * (breath ? 1 : 0.5);
      if (lv >= 2) {
        /* Randlicht auf Rücken und Hals, Schuppenkanten */
        c.strokeStyle = k(rgba(st.hi, 0.35)); c.lineWidth = 0.6; c.beginPath(); c.ellipse(0, -11 + by, 14.2, 7.2, 0, PI * 1.08, PI * 1.9); c.stroke();
        /* Narben über der Flanke */
        narbe(c, [-7, -15 + by, -3, -11 + by, 0, -9.6 + by], k); narbe(c, [3, -16 + by, 5.4, -12.6 + by], k);
      }
      /* Glutnähte (rot) bzw. Giftadern (grün) am Bauch, je Phase heller */
      const pul = 0.45 + 0.3 * Math.sin(t * 3 + st.seed) + P * 0.15;
      c.strokeStyle = k(green ? rgba(GIFT, pul) : rgba([255, 150, 50], pul)); c.lineWidth = 0.55; c.beginPath();
      for (let i = 0; i < 4; i++) { const x = -5 + i * 3.6; c.moveTo(x, -9.6 + by); c.lineTo(x + 0.8, -7.4 + by); c.lineTo(x + 0.2, -5.6 + by); }
      c.stroke();
      if (lv >= 2 && k("#000") === "#000") D().glow(c, 2, -7.6 + by, 8 + P * 3, green ? rgba(GIFT, 0.14 + P * 0.08) : rgba(GLUT, 0.16 + P * 0.08));
      /* zerrissene Flügelhaut (vorderer Flügel) */
      if (lv >= 2) { const fl = !e.grounded ? Math.sin(t * 7) * 10 : Math.sin(t * 1.5) * 2; c.fillStyle = k("rgba(10,6,6,.75)"); c.beginPath(); c.moveTo(13.4, -27 - fl * 0.7); c.lineTo(15.6, -28.6 - fl * 0.75); c.lineTo(14.6, -25.4 - fl * 0.6); c.fill(); c.beginPath(); c.ellipse(10.4, -24 - fl * 0.6, 0.9, 0.6, 0.4, 0, TAU); c.fill(); }
      /* Augen und Hörner im Randlicht */
      auge(c, hx + 3.9, hy - 1.2, 0.9, st, k, { t: t, seed: st.seed }, st.flare, P, green ? GIFT : [255, 200, 60]);
      if (green) tropfen(e, hx + 9, hy + 2.6, "#a8e050", 1.2 + P, dt); else if (R() < (1 + P) * dt && Z.fx) { const p = welt(e, hx + 9, hy + 1.6); Z.fx.p({ x: p[0], y: p[1], vx: (e.face || 1) * 6, vy: 12, life: 0.7, size: 1, col: "#ffa030", kind: "glow", g: 120, add: true }); }
      atem(e, st, hx + 11.5, hy - 1.4, dt, lv, green ? "gift" : "glut");
    },
    giant(c, e, d, k, t, mv, ph, st, q, P, lv, dt) {
      const m = q.mv, cr = q.ph === "pre" ? eo(q.pre) : 0, bob = mv ? Math.abs(Math.sin(ph * 0.5)) * 1.5 : Math.sin(t * 1.5) * 0.6;
      const ty = -bob + ((m === "erdbeben" || m === "fausthieb") ? cr * 2 : 0);
      /* Kette mit Schelle am Gürtel */
      const sw = Math.sin(t * 2.4) * 1.6 + (mv ? Math.sin(ph) * 1.4 : 0);
      kette(c, -7.6, -15.4, -9 + sw, -6, 0.8, 7, k, "#7a706a"); c.strokeStyle = k("#5a524c"); c.lineWidth = 0.9; c.beginPath(); c.ellipse(-9 + sw, -4.8, 1.6, 1.1, 0.2, 0, TAU); c.stroke();
      /* Narben und Kriegsbemalung */
      narbe(c, [-5, -26 + ty, -1, -21 + ty, 2, -19 + ty], k); narbe(c, [3, -27 + ty, 6, -24 + ty], k);
      c.fillStyle = k("rgba(150,20,20,.75)"); c.fillRect(1.5 - 2, -32.6 + ty - 2.6, 5.4, 0.7); c.fillRect(1.5 - 1.6, -32.6 + ty + 0.4, 3.2, 0.6);
      auge(c, 1.5 + 4.3, -32.6 + ty - 0.9, 0.7, st, k, { t: t, seed: st.seed }, st.flare, P, [255, 70, 40]);
      atem(e, st, 1.5 + 5.6, -32.6 + ty + 2.6, dt, lv, "dampf");
    },
    golem(c, e, d, k, t, mv, ph, st, q, P, lv, dt) {
      const bob = mv ? Math.abs(Math.sin(ph * 0.7)) * 0.8 : Math.sin(t * 1.4) * 0.3, ty = -bob;
      const pul = 0.5 + 0.35 * Math.sin(t * 2.6 + st.seed) + P * 0.15;
      c.strokeStyle = k(rgba([255, 150, 50], pul)); c.lineWidth = 0.6; c.lineJoin = "round"; c.beginPath();
      c.moveTo(-4, -20 + ty); c.lineTo(-1.6, -17 + ty); c.lineTo(-2.4, -14 + ty); c.lineTo(0.4, -11 + ty);
      c.moveTo(3.6, -19 + ty); c.lineTo(2, -16.4 + ty); c.lineTo(3.4, -13.6 + ty);
      c.moveTo(-1.6, -17 + ty); c.lineTo(1, -16.6 + ty);
      c.stroke();
      if (lv >= 2 && k("#000") === "#000") D().glow(c, 0, -16 + ty, 9 + P * 3, rgba(GLUT, 0.18 + P * 0.08));
      auge(c, 2.6, -24 + ty - 3.6, 0.8, st, k, { t: t, seed: st.seed }, st.flare, P, [255, 180, 70]);
      tropfen(e, -2.4, -14 + ty, "#ff9a30", 0.6 + P, dt);
    },
    bugbear(c, e, d, k, t, mv, ph, st, q, P, lv, dt) {
      const cr = q.ph === "pre" ? eo(q.pre) : 0, bob = mv ? Math.abs(Math.sin(ph)) * 1.5 : Math.sin(t * 2) * 0.5, ty = -bob + cr * 1.2;
      if (q.mv === "sturm" && q.ph === "act") return;
      /* Knochenkette über der Brust */
      for (let i = 0; i < 5; i++) { const u = i / 4, x = -3 + u * 7, y = -24 + ty + Math.sin(u * PI) * 3; c.fillStyle = k(i % 2 ? "#e8dcc4" : "#d0c4a8"); c.beginPath(); c.moveTo(x - 0.5, y - 0.6); c.lineTo(x + 0.5, y - 0.6); c.lineTo(x, y + 1.6); c.fill(); }
      narbe(c, [3 + 1.4, -28 + ty - 3.2, 3 + 3.2, -28 + ty + 0.6], k);
      auge(c, 3 + 2.6, -28 + ty - 1.2, 0.6, st, k, { t: t, seed: st.seed }, st.flare, P, [255, 60, 40]);
      tropfen(e, 3 + 4.8, -28 + ty + 3.6, "rgba(230,230,210,.8)", 0.8, dt);
      atem(e, st, 3 + 7, -28 + ty + 1, dt, lv, "dampf");
    },
    wraith(c, e, d, k, t, mv, ph, st, q, P, lv, dt) {
      /* Geisterketten mit Fesseln, die unter dem Leib schwingen */
      c.globalAlpha *= 0.7;
      for (let i = 0; i < 2; i++) { const sw = Math.sin(t * 1.6 + i * 2) * 2.4; kette(c, -3 + i * 5, -10, -5 + i * 6 + sw, 1 + i * 2, 1.2, 12, k, "#8a8094", 0.6); c.strokeStyle = k("#a898b8"); c.lineWidth = 0.7; c.beginPath(); c.ellipse(-5 + i * 6 + sw, 2.2 + i * 2, 1.3, 0.8, 0, 0, TAU); c.stroke(); }
      c.globalAlpha /= 0.7;
      if (lv >= 2 && k("#000") === "#000") D().glow(c, 0, -4, 9, rgba(VIOL, 0.14 + P * 0.06));
      auge(c, 2.1, -22.9, 0.7, st, k, { t: t, seed: st.seed }, st.flare, P, [200, 140, 255]);
      if (lv >= 2 && Z.fx && R() < (2 + P * 2) * dt) { const p = welt(e, 2.1, -22.9); Z.fx.p({ x: p[0], y: p[1], vx: -(e.face || 1) * 18, vy: -4, life: 0.6, size: 1, col: "#d0a8ff", kind: "glow", add: true, drag: 0.92 }); }
    },
    wasp(c, e, d, k, t, mv, ph, st, q, P, lv, dt) {
      auge(c, 8.6, -9, 0.8, st, k, { t: t, seed: st.seed }, st.flare, P, [255, 60, 40]);
      tropfen(e, 10.5, -6.6, "rgba(200,40,30,.9)", 1 + P, dt);
      /* Gifttropfen am Stachel */
      if (k("#000") === "#000") { const gl = 0.6 + 0.3 * Math.sin(t * 5); c.fillStyle = rgba(GIFT, gl); c.beginPath(); c.ellipse(-15.5, -1.4, 0.7, 1, 0, 0, TAU); c.fill(); if (lv >= 2) D().glow(c, -15.5, -1.4, 3, rgba(GIFT, 0.5)); }
    },
    spider(c, e, d, k, t, mv, ph, st, q, P, lv, dt) {
      const cr = q.ph === "pre" ? eo(q.pre) : 0, by = -6.6 + cr * 1.6 + (mv ? Math.sin(ph * 3) * 0.3 : Math.sin(t * 2) * 0.2);
      if (lv >= 2) { c.strokeStyle = k("rgba(20,10,14,.9)"); c.lineWidth = 0.3; c.beginPath(); for (let i = 0; i < 9; i++) { const a = PI * (1.05 + i * 0.1), x = -6 + Math.cos(a) * 5.4, y = by - 1 + Math.sin(a) * 3.6; c.moveTo(x, y); c.lineTo(x + Math.cos(a) * 1.4, y + Math.sin(a) * 1.4 + Math.sin(t * 3 + i) * 0.2); } c.stroke(); }
      tropfen(e, 6.4, by + 3.4, "#a8e050", 0.9 + P, dt);
      if (k("#000") === "#000" && lv >= 1) D().glow(c, 4.4, by - 0.8, 4 + st.flare * 6 + P, rgba(BLUT, 0.35 + st.flare * 0.4));
    },
    kuotoa(c, e, d, k, t, mv, ph, st, q, P, lv, dt) {
      if (!d.boss) return;
      const bob = mv ? Math.abs(Math.sin(ph)) : Math.sin(t * 2) * 0.4, hY = -21 - bob;
      /* Tentakelbart unter dem Fischmaul, windet sich langsam */
      c.strokeStyle = k("#2e4a36"); c.lineWidth = 0.75; c.lineCap = "round";
      for (let i = 0; i < 4; i++) { const x0 = 1.6 + 0.6 + i * 0.9, sw = Math.sin(t * 2.2 + i * 1.3) * 1.2; c.beginPath(); c.moveTo(x0, hY + 2.2); c.quadraticCurveTo(x0 + 0.6 + sw, hY + 4.6, x0 - 0.4 + sw * 1.6, hY + 6.8 + (i % 2) * 1.4); c.stroke(); }
      c.fillStyle = k("#c07ab0"); for (let i = 0; i < 4; i++) { const sw = Math.sin(t * 2.2 + i * 1.3) * 1.2; c.fillRect(1.6 + 0.6 + i * 0.9 - 0.4 + sw * 1.6 - 0.3, hY + 6.8 + (i % 2) * 1.4 - 0.3, 0.6, 0.6); }
      auge(c, 1.6 + 2.3, hY - 1, 0.7, st, k, { t: t, seed: st.seed }, st.flare, P, [210, 140, 255]);
      tropfen(e, 4, hY + 3, "rgba(170,210,150,.8)", 0.9, dt);
    },
    human(c, e, d, k, t, mv, ph, st, q, P, lv, dt) {
      if (!d.boss) return;
      const s = e.size || 1, hl = e.h / s, bob = mv ? Math.abs(Math.sin(ph)) * 1.2 : Math.sin(t * 2) * 0.3, hy = -hl + 4.2 - bob;
      const col = d.scim ? [200, 140, 255] : [255, 90, 50];
      auge(c, 2, hy - 0.4, 0.5, st, k, { t: t, seed: st.seed }, st.flare, P, col);
      if (d.staff && k("#000") === "#000") { /* Phiole am Gürtel */ const gl = 0.6 + 0.35 * Math.sin(t * 3.4); c.fillStyle = "rgba(210,30,40," + gl.toFixed(2) + ")"; c.beginPath(); c.ellipse(-2.6, -hl * 0.42, 1, 1.4, 0, 0, TAU); c.fill(); if (lv >= 2) D().glow(c, -2.6, -hl * 0.42, 4, "rgba(255,40,40,.45)"); }
    },
    vulture(c, e, d, k, t, mv, ph, st, q, P, lv, dt) {
      for (let i = 0; i < 5; i++) { const u = i / 4, x = 2 + u * 6, y = -24 + Math.sin(u * PI) * 2.6; c.fillStyle = k(i % 2 ? "#e8dcc4" : "#c8b898"); c.beginPath(); c.ellipse(x, y, 0.7, 0.9, 0, 0, TAU); c.fill(); }
      if (Z.fx && lv >= 2 && R() < (1.5 + P) * dt) { const p = welt(e, (R() - 0.5) * 20, -14); Z.fx.p({ x: p[0], y: p[1], vx: (R() - 0.5) * 10, vy: -8, life: 1.4, size: 1.4, col: "rgba(150,200,70,.45)", kind: "smoke", g: -6 }); }
    },
    druidin(c, e, d, k, t, mv, ph, st, q, P, lv, dt) {
      if (!d.boss) return;
      const bob = mv ? Math.abs(Math.sin(ph)) * 1.2 : Math.sin(t * 2) * 0.3;
      auge(c, 2.2, -21 - bob - 0.4, 0.5, st, k, { t: t, seed: st.seed }, st.flare, P, GIFT);
    },
    w49buppido(c, e, d, k, t, mv, ph, st, q, P, lv, dt) {
      const bob = mv ? Math.abs(Math.sin(ph * 1.2)) * 1.4 : Math.sin(t * 3) * 0.4, pre = q.ph === "pre";
      const hy = -19.4 - bob + (pre ? 1.2 : 0);
      auge(c, 1.4 + 2.2, hy - 0.8, 0.5, st, k, { t: t, seed: st.seed }, st.flare, P, [255, 60, 40]);
      tropfen(e, 4 + R() * 3, -10, "rgba(160,20,20,.9)", 1.2, dt);
    },
    demogorgon(c, e, d, k, t, mv, ph, st, q, P, lv, dt) {
      /* Geifer und Dampf aus beiden Mäulern (Köpfe sitzen oben, je etwa ein Viertel der Breite seitlich) */
      const s = e.size || 1, hl = e.h / s, wl = e.w / s;
      tropfen(e, -wl * 0.12, -hl * 0.72, "rgba(190,230,120,.8)", 1 + P, dt); tropfen(e, wl * 0.2, -hl * 0.74, "rgba(230,120,90,.8)", 1 + P, dt);
      atem(e, st, wl * 0.24, -hl * 0.76, dt, lv, "dampf");
    }
  };

  /* ---------- Schattierung und Randlicht (ab Stufe 2): Gestalt in eine Zwischenleinwand zeichnen, unten abdunkeln,
     oben ein Randlicht in Bossfarbe, dann mit dunklem (ab Phase 2 farbigem) Umriss-Schein zurück auf das Bild ---------- */
  let OFF = null, OFF2 = null;
  function leinwand(w, h, zwei) {
    let o = zwei ? OFF2 : OFF;
    if (o && o.cpu !== !!G.cpu) o = null;
    if (!o) { const cv = document.createElement("canvas"); o = { cv: cv, g: cv.getContext("2d", G.cpu ? { willReadFrequently: true } : undefined), cpu: !!G.cpu }; if (zwei) OFF2 = o; else OFF = o; }
    if (o.cv.width < w || o.cv.height < h) { o.cv.width = Math.max(o.cv.width, Math.ceil(w / 64) * 64); o.cv.height = Math.max(o.cv.height, Math.ceil(h / 64) * 64); }
    return o;
  }
  function plastisch(c, e, d, st, f0, self, args, ph) {
    if (typeof c.getTransform !== "function" || st.flach > 0) return false;
    const m = c.getTransform(), s = e.size || 1, wl = e.w / s, hl = e.h / s;
    const x0 = -(wl * 0.8 + 18), x1 = wl * 0.8 + 18, y0 = -(hl * 1.3 + 20), y1 = 9;
    let bx = 1e9, by = 1e9, bx2 = -1e9, by2 = -1e9;
    const ecken = [x0, y0, x1, y0, x0, y1, x1, y1];
    for (let i = 0; i < 8; i += 2) { const X = m.a * ecken[i] + m.c * ecken[i + 1] + m.e, Y = m.b * ecken[i] + m.d * ecken[i + 1] + m.f; if (X < bx) bx = X; if (Y < by) by = Y; if (X > bx2) bx2 = X; if (Y > by2) by2 = Y; }
    bx = Math.floor(bx); by = Math.floor(by); const w = Math.ceil(bx2 - bx), h = Math.ceil(by2 - by);
    if (w < 8 || h < 8 || w * h > 1100 * 900) return false;
    const o = leinwand(w, h, false), g = o.g;
    g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = "source-over"; g.clearRect(0, 0, w + 2, h + 2);
    g.setTransform(m.a, m.b, m.c, m.d, m.e - bx, m.f - by);
    f0.apply(self, [g].concat(Array.prototype.slice.call(args, 1)));
    g.setTransform(1, 0, 0, 1, 0, 0);
    const sc = Math.hypot(m.a, m.b) || 1;
    /* Umriss: Silhouette einfärben (dunkel; ab halber Kraft in Bossfarbe, unter 25 % pulsierend) und versetzt hinter die
       Gestalt legen – vier billige Bildkopien statt Weichzeichner */
    const o2 = leinwand(w, h, true), g2 = o2.g, pu = ph === 2 ? 0.6 + 0.4 * Math.sin((st.t0 || 0) * 9) : 1;
    g2.setTransform(1, 0, 0, 1, 0, 0); g2.globalCompositeOperation = "source-over"; g2.globalAlpha = 1; g2.clearRect(0, 0, w + 2, h + 2);
    g2.drawImage(o.cv, 0, 0, w, h, 0, 0, w, h);
    g2.globalCompositeOperation = "source-in"; g2.fillStyle = ph >= 1 ? rgba(st.th, 1) : "rgb(6,2,6)"; g2.fillRect(0, 0, w, h);
    const ud = Math.max(1.2, sc * (ph >= 1 ? 0.9 : 0.6)), ua = ph >= 1 ? (ph === 2 ? 0.55 : 0.4) * pu : 0.5;
    c.save(); c.setTransform(1, 0, 0, 1, 0, 0);
    if (ph >= 1) c.globalCompositeOperation = "lighter";
    c.globalAlpha *= ua;
    c.drawImage(o2.cv, 0, 0, w, h, bx - ud, by, w, h); c.drawImage(o2.cv, 0, 0, w, h, bx + ud, by, w, h);
    c.drawImage(o2.cv, 0, 0, w, h, bx, by - ud, w, h); c.drawImage(o2.cv, 0, 0, w, h, bx, by + ud * 0.6, w, h);
    c.restore();
    /* Randlicht: dieselbe Silhouette hell, um ein Stück nach unten versetzt wieder abziehen → nur die Oberkante bleibt */
    const r = Math.max(1, sc * 0.5);
    g2.globalCompositeOperation = "source-in"; g2.fillStyle = rgba(st.hi, 0.32 + ph * 0.1); g2.fillRect(0, 0, w, h);
    g2.globalCompositeOperation = "destination-out"; g2.drawImage(o.cv, 0, 0, w, h, -r * 0.6 * (e.face || 1), r, w, h);
    g2.globalCompositeOperation = "source-over";
    /* Schattierung: von oben nach unten dunkler, an der Unterseite fast schwarz-violett */
    g.globalCompositeOperation = "source-atop";
    const fy = m.f - by, top = Math.max(0, fy - hl * sc * 1.15);
    const gr = g.createLinearGradient(0, top, 0, fy + 2); gr.addColorStop(0, "rgba(0,0,0,0)"); gr.addColorStop(0.55, "rgba(12,4,10,.16)"); gr.addColorStop(1, "rgba(12,4,10,.5)");
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.globalCompositeOperation = "lighter"; g.drawImage(o2.cv, 0, 0, w, h, 0, 0, w, h);
    /* Sterben: der Körper verglüht von unten (Bossfarbe), dann fressen sich Aschelöcher hinein */
    if (e.dead) {
      const u = Math.max(0, Math.min(1, ((e.deadT || 0) - 0.15) / 1.2));
      if (u > 0) {
        g.globalCompositeOperation = "source-atop";
        const gg = g.createLinearGradient(0, fy + 2, 0, top); gg.addColorStop(0, rgba(st.hi, 0.85 * u)); gg.addColorStop(Math.min(1, 0.3 + u * 0.7), rgba(st.th, 0.55 * u)); gg.addColorStop(1, "rgba(20,8,8," + (0.3 * u).toFixed(3) + ")");
        g.fillStyle = gg; g.fillRect(0, 0, w, h);
        g.globalCompositeOperation = "destination-out"; g.fillStyle = "#000";
        const n = Math.floor(70 * u), lb = Math.max(2, sc * 1.4);
        for (let i = 0; i < n; i++) { const hx = ((i * 7919 + st.seed * 131) % 997) / 997, hy = ((i * 104729 + st.seed * 17) % 991) / 991, rr = lb * (0.4 + u * 1.6) * (0.5 + ((i * 31) % 7) / 7); g.beginPath(); g.arc(hx * w, top + hy * (fy - top + 4), rr, 0, TAU); g.fill(); }
      }
    }
    g.globalCompositeOperation = "source-over";
    /* zurück aufs Bild */
    c.save(); c.setTransform(1, 0, 0, 1, 0, 0);
    c.drawImage(o.cv, 0, 0, w, h, bx, by, w, h);
    c.restore();
    G.zaehler.plastisch = (G.zaehler.plastisch || 0) + 1;
    return true;
  }

  /* Leistungswächter: kostet die Schattierung im Mittel mehr als 2,5 ms je Bild (Software-Zeichnen, schwache Geräte),
     wird sie für diese Sitzung abgeschaltet – der Rest der Zusätze bleibt. */
  G.plastikMs = 0; G.plastikN = 0; G.plastikAus = false;
  function wache(ms) {
    if (!(ms >= 0) || ms > 500) return;
    G.plastikN++; G.plastikMs = G.plastikN < 5 ? ms : G.plastikMs * 0.92 + ms * 0.08;
    if (G.plastikN > 40 && G.plastikMs > 2.5) { G.plastikAus = true; G.plastikGrund = "zu teuer: " + G.plastikMs.toFixed(1) + " ms"; }
  }

  /* Gestalten umhüllen: Zucken bei Treffern, Schattierung, danach Details */
  const SH = Z.SHAPES || {};
  const OHNE_PLASTIK = { demogorgon: 1, nm_spiegel: 1 };
  const NAMEN = Object.keys(DET).concat(Object.keys(SH).filter(n => /^nm_/.test(n) && n !== "nm_spiegel"));
  for (const name of NAMEN) {
    const f0 = SH[name]; if (typeof f0 !== "function") continue;
    const det = DET[name] || null, plast = !OHNE_PLASTIK[name];
    SH[name] = function (c, e, d, k, t, mv, ph) {
      const a = e && art(e), lv = a ? stufe() : -1;
      if (lv < 1 || !e || !(d && (d.boss || e.nmMini))) return f0.apply(this, arguments);
      const st = zustand(e);
      if (st.zuck > 0) c.translate((R() - 0.5) * 1.2 * st.zuck, (R() - 0.5) * 0.6 * st.zuck);
      let r;
      const P = phaseOf(e);
      let ok = false;
      if (lv >= 2 && plast && !G.plastikAus && k("#000") === "#000" && !(Z.gfx && Z.gfx.off && Z.gfx.off.grauenPlastik)) {
        const t0 = performance.now();
        ok = plastisch(c, e, d, st, f0, this, arguments, P);
        if (ok) wache(performance.now() - t0);
      }
      if (!ok) r = f0.apply(this, arguments);
      if (det && !e.dead) { c.save(); try { det(c, e, d, k, t, mv, ph, st, qOf(e), P, lv, st.dt || 0.016); } catch (err) { if (!G.fehler) G.fehler = String(err); } c.restore(); }
      return r;
    };
  }

  /* ---------- Hülle um Z.drawEnemy ---------- */
  function vorher(c, e, time, s, a, lv) {
    const d = e.def, ph = phaseOf(e), q = qOf(e), ged = q.ph === "pre";
    const cx = e.x + e.w / 2, fy = e.y + e.h, boden = !d.fly && e.onGround !== false && !e.ceil;
    if (lv >= 1) {
      /* dunkler Hof für die Silhouette, breiter Bodenschatten */
      const gr = a === "boss" || a === "waechter" ? 1 : 0.8;
      dunkel(c, cx, e.y + e.h * 0.5, Math.max(e.w, e.h) * 0.85 * gr + 6, e.h * 0.75 * gr + 6, (ged ? 0.18 : 0.28) * (0.8 + 0.2 * ph));
      if (boden) dunkel(c, cx, fy, e.w * 0.95 + 8, 3.4 + e.w * 0.05, 0.55);
      risseZeichnen(c, s, s.dt, lv);
      if (a !== "elite") aura(c, e, s, time, ph, lv, ged);
    }
    if ((a === "mini" || a === "elite") && boden) siegel(c, cx, fy - 0.5, Math.max(e.w * 0.9, 14) + (a === "mini" ? 6 : 0), time, s, a === "mini");
  }
  function nachher(c, e, time, s, a, lv) {
    const d = e.def, cx = e.x + e.w / 2;
    if (a === "mini" || a === "elite") {
      /* Krone sitzt auf dem Kopf (nicht über Lebensbalken und Namen) */
      const b = a === "mini" ? Math.max(8, Math.min(13, e.w * 0.5)) : 6, y = e.y + (a === "mini" ? 2.5 : -1);
      krone(c, cx + (e.face || 1) * 1, y, b, a === "mini", time, s);
    }
  }
  function ereignisse(e, s, a, lv, dt) {
    const d = e.def, FX = Z.fx, cx = e.x + e.w / 2, fy = e.y + e.h, ph = phaseOf(e);
    s.flare = Math.max(0, s.flare - dt * 0.9); s.zuck = Math.max(0, s.zuck - dt * 6);
    /* Auftritt */
    if (!s.auf) { s.auf = true; if ((e.intro > 0 || e.spawnT > 0 || a === "mini") && a !== "elite") { s.flare = 1.4; G.zaehler.auftritt++;
      if (!d.fly) risseAn(s, cx, fy, Math.max(30, e.w * 1.3), 6);
      if (FX && lv >= 1) { FX.burst(cx, fy - 2, 14, { col: ["#3a3230", "#5a5048", rgbS(s.th)], sp: 110, ang: -PI / 2, spread: 2.4, life: 0.9, size: 2.4, kind: "smoke", g: -10, drag: 0.93 }); if (FX.ring) FX.ring(cx, e.y + e.h * 0.5, 40 + e.w, rgba(s.th, 0.7), 0.6, 2); } } }
    if (s.ph < 0) s.ph = ph;
    /* Phasenwechsel: Augen flammen, Risse, Dampfstoß */
    if (ph > s.ph) { s.ph = ph; s.flare = 1.2; if (!d.fly) risseAn(s, cx, fy, Math.max(26, e.w * 1.1), 5);
      if (FX && lv >= 1) FX.burst(cx, e.y + e.h * 0.4, 12, { col: ["#2a2422", rgbS(s.th), rgbS(s.hi)], sp: 120, life: 0.8, size: 2, kind: "smoke", g: -20, drag: 0.92 }); }
    /* schweres Aufsetzen und Schläge in den Boden */
    const q = qOf(e), st = q.ph + ":" + q.mv;
    if (st !== s.mvSt) { if (q.ph === "act" && !d.fly && e.onGround !== false && /stampf|beben|slam|faust|schlag|sturz|hammer|amboss|stomp|quake|ramm/i.test(q.mv || (e.act && e.act.a && e.act.a.k) || "")) risseAn(s, cx + (e.face || 1) * e.w * 0.3, fy, Math.max(20, e.w), 4); s.mvSt = st; }
    const luft = !d.fly && e.onGround === false; if (s.luft && !luft && (d.boss || d.heavy)) risseAn(s, cx, fy, Math.max(18, e.w * 0.8), 3); s.luft = luft;
    /* Treffer */
    if (e.flash > 0 && s.fl <= 0) { s.zuck = 1; if (FX && lv >= 1) FX.burst(cx - (e.face || 1) * 2, e.y + e.h * 0.45, lv >= 2 ? 6 : 3, { col: ["#1a1210", rgbS(s.th), "#e8dcc4"], sp: 120, life: 0.45, size: 1.6, kind: "shard", g: 400, drag: 0.95 }); }
    s.fl = e.flash || 0;
    if (lv >= 1) teilchen(e, s, ph, lv, dt);
  }
  function tod(c, e, s, a, lv, dt) {
    const FX = Z.fx, cx = e.x + e.w / 2, fy = e.y + e.h;
    if (!s.tot) { s.tot = true; s.totT = 0; G.zaehler.tod++; if (!e.def.fly) risseAn(s, cx, fy, Math.max(34, e.w * 1.5), 7);
      if (FX) { if (FX.ring) FX.ring(cx, e.y + e.h * 0.5, 60 + e.w, "rgba(20,10,10,.8)", 0.8, 4); FX.burst(cx, e.y + e.h * 0.5, lv >= 2 ? 26 : 12, { col: [rgbS(s.th), rgbS(s.hi), "#2a2422"], sp: 160, life: 1.1, size: 2.2, kind: "glow", add: true, g: -30, drag: 0.94 }); } }
    s.totT += dt;
    if (s.totT < 1.8 && FX && lv >= 1) {
      const n = (lv >= 2 ? 22 : 10) * dt * (a === "elite" ? 0.4 : 1);
      for (let i = 0; i < Math.floor(n) + (R() < n % 1 ? 1 : 0); i++) {
        FX.p({ x: e.x + R() * e.w, y: e.y + e.h * (0.15 + R() * 0.8), vx: (R() - 0.5) * 16, vy: -20 - R() * 30, life: 1.2 + R(), size: 1.2 + R() * 1.4, col: R() < 0.55 ? (R() < 0.5 ? "#3a3230" : "#5a504a") : rgbS(s.th), kind: R() < 0.55 ? "dot" : "glow", add: R() >= 0.55, g: -14, drag: 0.96 });
      }
    }
    if (lv >= 1) risseZeichnen(c, s, dt, lv);
  }

  Z.haken.aussen("drawEnemy", "w53grauen", function (a, weiter) {
    const c = a[0], e = a[1], time = a[2];
    const ar = e && e.def ? art(e) : "";
    if (!ar) return weiter(a);
    const lv = stufe();
    if (lv < 0) return weiter(a);
    const s = zustand(e);
    const now = typeof time === "number" ? time : 0; s.dt = s.t0 != null ? Math.max(0, Math.min(0.1, now - s.t0)) : 0.016; s.t0 = now;
    if (s.dt === 0 && now === 0) s.dt = 0.016;
    if (e.dead) {
      if (ar !== "elite" || lv >= 1) { c.save(); try { tod(c, e, s, ar, lv, s.dt); } catch (err) { if (!G.fehler) G.fehler = String(err); } c.restore(); }
      return weiter(a);
    }
    if (e.hidden > 0 && ar !== "boss") return weiter(a);
    c.save(); try { if (lv >= 1 || ar === "mini" || ar === "elite") ereignisse(e, s, ar, lv, s.dt); vorher(c, e, now, s, ar, lv); } catch (err) { if (!G.fehler) G.fehler = String(err); } c.restore();
    const r = weiter(a);
    c.save(); try { nachher(c, e, now, s, ar, lv); } catch (err) { if (!G.fehler) G.fehler = String(err); } c.restore();
    G.zaehler.bild++;
    return r;
  });
  G.stand = e => { const s = e && e._g53; return s ? { art: art(e), key: s.key, risse: s.risse.length, phase: s.ph, flare: +s.flare.toFixed(2), stufe: stufe() } : null; };
})();
