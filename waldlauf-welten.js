/* =====================================================================
   FRIEDRICHS JAGD – SCHAUPLÄTZE
   Jedes Kapitel der Kampagne bekommt seine eigene Kulisse, in Ebenen:
     fern  – Himmel/Höhlenwand, Mond, ferne Hügel (stärkste Parallaxe)
     mitte – Wald, Burgen, Hütten, Stege (leichte Parallaxe)
     lagen – drei Bodenstreifen vor/zwischen den Gegnern (fest)
   Dazu bewegte Dinge (Feuer, Fackeln, Wolken, Vögel, Rauch, Ketten …),
   Wetter (Regen, Nebel, Gewitter, Tropfen, Staub), Grashalme und
   fliegende Blätter, die zeigen, woher der Wind weht, und ein Licht,
   das sich von Welle zu Welle ändert (Abend → Dämmerung usw.).
   Jeder Durchlauf bekommt einen eigenen Zufallswert (seed): Wagen,
   Mond, Fenster, Wetter, Wolken … sehen jedes Mal etwas anders aus.
   Wird von waldlauf.js benutzt (window.WALDLAUF_WELTEN).
   ===================================================================== */
(function () {
  "use strict";

  const W = 400, H = 500;
  const BAHNEN = [{ y: 300, s: 0.58 }, { y: 352, s: 0.78 }, { y: 410, s: 0.98 }];
  const PI2 = Math.PI * 2;

  function lcg(seed) { let s = Math.max(1, Math.floor(seed) % 2147483646); return () => (s = (s * 16807) % 2147483647) / 2147483647; }
  function leinwand(bw, bh) { const f = 2, c = document.createElement("canvas"); c.width = (bw || W) * f; c.height = (bh || H) * f; const x = c.getContext("2d"); x.scale(f, f); return [c, x]; }
  function himmel(x, stopps) { const g = x.createLinearGradient(0, 0, 0, H); stopps.forEach(([o, f]) => g.addColorStop(o, f)); x.fillStyle = g; x.fillRect(0, 0, W, H); }
  function sterne(x, r, n, maxY) { for (let i = 0; i < n; i++) { x.fillStyle = "rgba(235,226,204," + (0.15 + r() * 0.55) + ")"; const g = r() < 0.15 ? 1.6 : 1; x.fillRect(r() * W, r() * maxY, g, g); } }
  /* Mond mit Phase (0 = voll, 1 = schmale Sichel) */
  function mond(x, mx, my, rad, schein, phase) {
    const g = x.createRadialGradient(mx, my, rad / 2, mx, my, rad * schein); g.addColorStop(0, "rgba(235,226,204,.22)"); g.addColorStop(1, "rgba(235,226,204,0)");
    x.fillStyle = g; x.fillRect(mx - rad * schein, my - rad * schein, rad * schein * 2, rad * schein * 2);
    x.fillStyle = "#ebe2cc"; x.beginPath(); x.arc(mx, my, rad, 0, PI2); x.fill();
    x.fillStyle = "rgba(168,159,143,.35)"; x.beginPath(); x.arc(mx - rad * 0.33, my - rad * 0.28, rad * 0.24, 0, 7); x.arc(mx + rad * 0.33, my + rad * 0.33, rad * 0.17, 0, 7); x.fill();
    if (phase > 0.05) {
      x.save(); x.beginPath(); x.arc(mx, my, rad + 0.5, 0, PI2); x.clip();
      x.fillStyle = "rgba(12,12,22,.9)"; x.beginPath(); x.arc(mx + rad * (2.1 - phase * 1.5), my - rad * 0.15, rad * 1.05, 0, PI2); x.fill();
      x.restore();
    }
  }
  function tanne(x, px, basis, h, farbe) {
    x.fillStyle = farbe; x.fillRect(px - h * 0.03, basis - h * 0.15, h * 0.06, h * 0.15);
    for (let i = 0; i < 4; i++) {
      const oben = basis - h + i * h * 0.2, unten = basis - h * 0.12 - (3 - i) * h * 0.17 + h * 0.05, br = h * (0.14 + i * 0.075);
      x.beginPath(); x.moveTo(px, oben); x.lineTo(px - br, unten); x.lineTo(px + br, unten); x.closePath(); x.fill();
    }
  }
  function wald(x, r, farbe1, farbe2, basis) {
    for (let i = 0; i < 26; i++) tanne(x, -10 + i * 17 + r() * 8, basis, 70 + r() * 70, farbe1);
    for (let i = 0; i < 7; i++) tanne(x, r() < 0.5 ? r() * 60 : W - r() * 60, basis + 6 + r() * 26, 140 + r() * 80, farbe2);
  }
  function randwald(x, r, farbe1, farbe2, basis) {
    for (let i = 0; i < 12; i++) { const px = i < 6 ? -10 + i * 14 + r() * 8 : W - 70 + (i - 6) * 14 + r() * 8; tanne(x, px, basis, 70 + r() * 60, farbe1); }
    for (let i = 0; i < 5; i++) tanne(x, r() < 0.5 ? r() * 50 : W - r() * 50, basis + 6 + r() * 26, 140 + r() * 80, farbe2);
    x.fillStyle = farbe1; x.beginPath(); x.moveTo(0, basis);
    for (let px = 0; px <= W; px += 12) x.lineTo(px, basis - 8 - r() * 14);
    x.lineTo(W, basis + 4); x.lineTo(0, basis + 4); x.fill();
  }
  function huegel(x, r, farbe, basis, hoehe, welle) {
    x.fillStyle = farbe; x.beginPath(); x.moveTo(0, basis + 10);
    const ph = r() * 6;
    for (let px = 0; px <= W; px += 20) x.lineTo(px, basis - hoehe * (0.5 + 0.5 * Math.sin(px / welle + ph)) - r() * 6);
    x.lineTo(W, basis + 10); x.closePath(); x.fill();
  }
  function nebel(x, y, h, a) {
    const g = x.createLinearGradient(0, y, 0, y + h);
    g.addColorStop(0, "rgba(168,159,143,0)"); g.addColorStop(0.55, "rgba(168,159,143," + a + ")"); g.addColorStop(1, "rgba(168,159,143,0)");
    x.fillStyle = g; x.fillRect(0, y, W, h);
  }
  function hoehlenDecke(x, r, farbe, tiefe) {
    x.fillStyle = farbe; x.beginPath(); x.moveTo(0, 0);
    for (let px = 0; px <= W; px += 10 + r() * 14) { x.lineTo(px, tiefe * (0.3 + r() * 0.5)); if (r() < 0.35) { x.lineTo(px + 4, tiefe + r() * 40); x.lineTo(px + 9, tiefe * 0.5); } }
    x.lineTo(W, 0); x.closePath(); x.fill();
  }
  function felswand(x, r, y0, farbe, zack) {
    x.fillStyle = farbe; x.beginPath(); x.moveTo(0, H);
    for (let px = 0; px <= W + 20; px += 18 + r() * 20) x.lineTo(px, y0 - r() * zack);
    x.lineTo(W, H); x.closePath(); x.fill();
  }
  function glow(x, px, py, rad, farbe) {
    const g = x.createRadialGradient(px, py, 0, px, py, rad); g.addColorStop(0, farbe); g.addColorStop(1, "rgba(0,0,0,0)");
    x.fillStyle = g; x.fillRect(px - rad, py - rad, rad * 2, rad * 2);
  }
  function toterBaum(x, px, basis, h, farbe, r) {
    x.strokeStyle = farbe; x.lineCap = "round";
    const ast = (ax, ay, w, l, d) => {
      if (d > 3 || l < 6) return;
      const ex = ax + Math.cos(w) * l, ey = ay + Math.sin(w) * l;
      x.lineWidth = Math.max(1, 6 - d * 1.6); x.beginPath(); x.moveTo(ax, ay); x.lineTo(ex, ey); x.stroke();
      ast(ex, ey, w - 0.35 - r() * 0.4, l * 0.68, d + 1); ast(ex, ey, w + 0.3 + r() * 0.4, l * 0.62, d + 1);
    };
    ast(px, basis, -Math.PI / 2 + (r() - 0.5) * 0.15, h * 0.45, 0);
    x.lineCap = "butt";
  }
  const zuf = (r, l) => l[Math.floor(r() * l.length) % l.length];

  /* ---------- Bodenstreifen ---------- */
  function lagenBauen(stil, farben, r) {
    return BAHNEN.map((b, i) => {
      const [k, x] = leinwand();
      const ende = i < 2 ? BAHNEN[i + 1].y - 18 * BAHNEN[i + 1].s : H;
      x.fillStyle = farben[i];
      x.fillRect(0, b.y + 2 * b.s, W, ende - b.y);
      const rand = stil.rand;
      if (stil.form === "busch" || stil.form === "gras") {
        const blobs = [];
        for (let xx = -14; xx < W + 20; xx += (16 + r() * 18) * b.s) blobs.push([xx, b.y + 6 * b.s, (11 + r() * 9) * b.s * (stil.form === "gras" ? 0.7 : 1)]);
        blobs.forEach(([bx, by, br]) => { x.beginPath(); x.arc(bx, by, br, 0, PI2); x.fill(); });
        x.strokeStyle = rand; x.lineWidth = 1.2;
        blobs.forEach(([bx, by, br]) => { x.beginPath(); x.arc(bx, by, br, Math.PI * 1.15, Math.PI * 1.85); x.stroke(); });
        if (stil.form === "gras") {
          x.strokeStyle = rand; x.lineWidth = 1;
          for (let xx = 0; xx < W; xx += 4 + r() * 6) { const hh = (6 + r() * 8) * b.s; x.beginPath(); x.moveTo(xx, b.y + 4 * b.s); x.lineTo(xx + (r() - 0.5) * 4, b.y - hh); x.stroke(); }
        }
        // kleine Blüten und Steine – jedes Mal anders verteilt
        for (let n = 0; n < 6; n++) {
          const px = r() * W, py = b.y + (8 + r() * 14) * b.s;
          if (r() < 0.5) { x.fillStyle = zuf(r, ["rgba(224,160,70,.55)", "rgba(235,226,204,.4)", "rgba(196,86,74,.45)"]); x.beginPath(); x.arc(px, py, 1.6 * b.s + 0.6, 0, PI2); x.fill(); }
          else { x.fillStyle = "rgba(0,0,0,.25)"; x.beginPath(); x.ellipse(px, py, 5 * b.s, 2.4 * b.s, 0, 0, PI2); x.fill(); }
        }
      } else {
        x.beginPath(); x.moveTo(-10, b.y + 12 * b.s);
        for (let xx = -10; xx < W + 20; xx += (14 + r() * 22) * b.s) x.lineTo(xx, b.y + (r() * 12 - 4) * b.s);
        x.lineTo(W + 20, b.y + 14 * b.s); x.closePath(); x.fill();
        x.strokeStyle = rand; x.lineWidth = 1.2; x.beginPath();
        for (let xx = -10, first = true; xx < W + 20; xx += (14 + r() * 22) * b.s) { const yy = b.y + (r() * 10 - 3) * b.s; if (first) { x.moveTo(xx, yy); first = false; } else x.lineTo(xx, yy); }
        x.stroke();
        // Geröll
        for (let n = 0; n < 7; n++) {
          const px = r() * W, py = b.y + (6 + r() * 16) * b.s, gr = (2 + r() * 4) * b.s;
          x.fillStyle = "rgba(0,0,0,.3)"; x.beginPath(); x.ellipse(px, py + gr * 0.4, gr * 1.3, gr * 0.5, 0, 0, PI2); x.fill();
          x.fillStyle = rand; x.beginPath(); x.ellipse(px, py, gr, gr * 0.7, 0, Math.PI, 0); x.fill();
        }
        if (stil.pilze) {
          for (let n = 0; n < 5; n++) {
            const px = r() * W, py = b.y + 4 * b.s, s = (0.6 + r() * 0.8) * b.s * 9, f = r() < 0.5 ? "rgba(110,230,230," : "rgba(190,130,255,";
            glow(x, px, py - s, s * 2.4, f + ".35)");
            x.fillStyle = "#2a2a34"; x.fillRect(px - s * 0.15, py - s, s * 0.3, s);
            x.fillStyle = f + ".95)"; x.beginPath(); x.ellipse(px, py - s, s * 0.7, s * 0.4, 0, Math.PI, 0); x.fill();
          }
        }
      }
      return k;
    });
  }

  /* ---------- kleine bewegte Dinge ---------- */
  function feuer(x, px, py, s, t, wind) {
    const neig = Math.max(-0.6, Math.min(0.6, (wind || 0) * 0.004));
    glow(x, px, py, 40 * s, "rgba(255,140,50," + (0.35 + 0.1 * Math.sin(t * 9)).toFixed(2) + ")");
    for (let i = 0; i < 5; i++) {
      const h = (14 + 8 * Math.sin(t * 7 + i * 1.7)) * s, w = (5 + i % 2 * 2) * s, ox = (i - 2) * 4 * s;
      x.fillStyle = i % 2 ? "rgba(255,200,90,.85)" : "rgba(240,110,40,.8)";
      x.beginPath(); x.moveTo(px + ox - w, py); x.quadraticCurveTo(px + ox + Math.sin(t * 5 + i) * 3 + neig * h, py - h * 1.2, px + ox + w, py); x.fill();
    }
  }
  function fackel(x, px, py, t, wind) {
    x.fillStyle = "#3a2a1c"; x.fillRect(px - 1.5, py, 3, 16);
    glow(x, px, py - 4, 34, "rgba(255,150,60," + (0.3 + 0.1 * Math.sin(t * 11)).toFixed(2) + ")");
    const h = 9 + 3 * Math.sin(t * 13), n = Math.max(-0.6, Math.min(0.6, (wind || 0) * 0.005));
    x.fillStyle = "rgba(255,190,90,.9)"; x.beginPath(); x.moveTo(px - 3, py); x.quadraticCurveTo(px + Math.sin(t * 8) * 2 + n * h, py - h * 1.4, px + 3, py); x.fill();
  }
  function fenster(x, px, py, t) {
    const a = 0.25 + 0.2 * Math.sin(t * 4) * Math.sin(t * 1.7);
    glow(x, px + 3, py + 6, 22, "rgba(224,160,70," + a.toFixed(2) + ")");
  }
  /* Rauchsäule, die der Wind mitnimmt */
  function rauch(x, px, py, t, wind, farbe, n, hoch) {
    for (let k = 0; k < n; k++) {
      const ph = (t * 0.35 + k / n) % 1;
      const dx = Math.sin(ph * 5 + k) * 5 + (wind || 0) * 0.35 * ph * ph * (hoch / 90);
      x.fillStyle = "rgba(" + farbe + "," + (0.32 * (1 - ph)).toFixed(3) + ")";
      x.beginPath(); x.arc(px + dx, py - ph * hoch, 5 + ph * 16, 0, PI2); x.fill();
    }
  }
  /* Fahne/Wimpel, der im Wind flattert */
  function fahne(x, px, py, laenge, hoehe, farbe, t, wind) {
    x.strokeStyle = "#2a2018"; x.lineWidth = 1.6; x.beginPath(); x.moveTo(px, py); x.lineTo(px, py - 34); x.stroke();
    const dir = wind < 0 ? -1 : 1, st = Math.min(1, Math.abs(wind) / 120) * 0.75 + 0.25;
    x.fillStyle = farbe; x.beginPath(); x.moveTo(px, py - 34);
    for (let i = 1; i <= 6; i++) { const k = i / 6; x.lineTo(px + dir * laenge * k * st, py - 34 + Math.sin(t * 7 - k * 4) * 3 * k + (1 - st) * k * laenge * 0.7); }
    for (let i = 6; i >= 0; i--) { const k = i / 6; x.lineTo(px + dir * laenge * k * st, py - 34 + hoehe * (1 - k * 0.6) + Math.sin(t * 7 - k * 4) * 3 * k + (1 - st) * k * laenge * 0.7); }
    x.closePath(); x.fill();
  }
  /* hängende Dinge (Ketten, Wurzeln, Fäden, Laternen) schwingen im Luftzug */
  function haenger(x, h, t, wind) {
    h.forEach(d => {
      const w = Math.max(-0.5, Math.min(0.5, wind * (d.art === "kette" ? 0.001 : 0.0028))) + Math.sin(t * d.f + d.ph) * (d.art === "kette" ? 0.03 : 0.06);
      const ex = d.x + Math.sin(w) * d.l, ey = d.y + Math.cos(w) * d.l;
      if (d.art === "kette") {
        x.strokeStyle = "#3a3640"; x.lineWidth = 1.4;
        for (let i = 0; i < d.l; i += 5) { const k = i / d.l; x.beginPath(); x.ellipse(d.x + (ex - d.x) * k, d.y + (ey - d.y) * k, 1.4, 2.6, w, 0, PI2); x.stroke(); }
      } else {
        x.strokeStyle = d.art === "faden" ? "rgba(220,230,240,.28)" : "#1a140f"; x.lineWidth = d.art === "faden" ? 0.7 : 2;
        x.beginPath(); x.moveTo(d.x, d.y); x.quadraticCurveTo(d.x + Math.sin(w) * d.l * 0.3, d.y + d.l * 0.6, ex, ey); x.stroke();
      }
      if (d.art === "laterne") {
        glow(x, ex, ey + 6, 26, "rgba(255,170,80," + (0.28 + 0.06 * Math.sin(t * 6 + d.ph)).toFixed(2) + ")");
        x.fillStyle = "#2a1e14"; x.fillRect(ex - 4, ey, 8, 11);
        x.fillStyle = "rgba(255,200,110,.9)"; x.fillRect(ex - 2.5, ey + 2, 5, 7);
      } else if (d.art === "spinne") {
        const bob = Math.sin(t * 0.7 + d.ph) * 10;
        x.strokeStyle = "rgba(220,230,240,.25)"; x.lineWidth = 0.6; x.beginPath(); x.moveTo(ex, ey); x.lineTo(ex, ey + 14 + bob); x.stroke();
        x.fillStyle = "#14100e"; x.beginPath(); x.ellipse(ex, ey + 16 + bob, 3, 3.6, 0, 0, PI2); x.fill();
        x.strokeStyle = "#14100e"; x.lineWidth = 0.8;
        for (let s = -1; s <= 1; s += 2) for (let k = 0; k < 3; k++) { x.beginPath(); x.moveTo(ex, ey + 15 + bob + k * 1.4); x.lineTo(ex + s * 6, ey + 12 + bob + k * 3); x.stroke(); }
        x.fillStyle = "rgba(196,86,74,.8)"; x.fillRect(ex - 1.2, ey + 14 + bob, 0.9, 0.9); x.fillRect(ex + 0.4, ey + 14 + bob, 0.9, 0.9);
      }
    });
  }
  /* Vogel/Fledermaus-Silhouetten */
  function vogel(x, px, py, s, t, art) {
    x.strokeStyle = "#0c0b0e"; x.fillStyle = "#0c0b0e"; x.lineWidth = 1.4 * s;
    const f = Math.sin(t * (art === "fledermaus" ? 22 : 11));
    if (art === "fledermaus") {
      x.beginPath(); x.moveTo(px - 7 * s, py - f * 3 * s); x.lineTo(px - 3 * s, py + 1 * s); x.lineTo(px, py - 1 * s); x.lineTo(px + 3 * s, py + 1 * s); x.lineTo(px + 7 * s, py - f * 3 * s); x.lineTo(px, py + 2.5 * s); x.closePath(); x.fill();
    } else {
      x.beginPath(); x.moveTo(px - 7 * s, py - f * 4 * s); x.quadraticCurveTo(px - 3 * s, py - 2 * s, px, py); x.quadraticCurveTo(px + 3 * s, py - 2 * s, px + 7 * s, py - f * 4 * s); x.stroke();
    }
  }
  /* lange, flache Wolkenbank: viele weiche Ellipsen, Licht fällt von oben (Mond) oder unten (Abendsonne) */
  function wolkeBauen(r, farbe, rand, randUnten) {
    const bw = 150 + r() * 110, bh = 40, [c, x] = leinwand(bw, bh);
    const n = 12 + Math.floor(r() * 6);
    for (let i = 0; i < n; i++) {
      const k = i / n, px = bw * (0.1 + k * 0.8 + (r() - 0.5) * 0.1), py = bh * (0.55 + (r() - 0.5) * 0.2) - Math.sin(k * Math.PI) * bh * 0.12, rad = (8 + r() * 12) * (0.6 + Math.sin(k * Math.PI) * 0.6);
      x.save(); x.translate(px, py); x.scale(1.9, 0.75);
      const g = x.createRadialGradient(0, 0, 0, 0, 0, rad); g.addColorStop(0, farbe); g.addColorStop(0.6, farbe.replace(/[\d.]+\)$/, m => (parseFloat(m) * 0.5).toFixed(2) + ")")); g.addColorStop(1, "rgba(0,0,0,0)");
      x.fillStyle = g; x.beginPath(); x.arc(0, 0, rad, 0, PI2); x.fill(); x.restore();
    }
    if (rand) {
      x.globalCompositeOperation = "source-atop";
      const g = x.createLinearGradient(0, 0, 0, bh);
      if (randUnten) { g.addColorStop(0.45, "rgba(0,0,0,0)"); g.addColorStop(0.8, rand); }
      else { g.addColorStop(0.15, rand); g.addColorStop(0.55, "rgba(0,0,0,0)"); }
      x.fillStyle = g; x.fillRect(0, 0, bw, bh);
    }
    return { c, w: bw, h: bh };
  }
  function nebelBand(r, a) {
    const bw = 520, bh = 120, [c, x] = leinwand(bw, bh);
    for (let i = 0; i < 16; i++) {
      const px = r() * bw, py = bh * (0.46 + r() * 0.08), rad = 28 + r() * 26;
      // nahtlos kachelbar: Ränder links/rechts mitmalen, oben/unten nie abgeschnitten
      [px - bw, px, px + bw].forEach(qx => {
        x.save(); x.translate(qx, py); x.scale(1.8, 1);
        const g = x.createRadialGradient(0, 0, 0, 0, 0, rad); g.addColorStop(0, "rgba(180,172,160," + a + ")"); g.addColorStop(1, "rgba(180,172,160,0)");
        x.fillStyle = g; x.fillRect(-rad, -rad, rad * 2, rad * 2); x.restore();
      });
    }
    return { c, w: bw, h: bh };
  }

  /* ---------- Die Schauplätze ----------
     fern/mitte(x, r, v) malen einmal, deko/dekoFern(x, t, u) jedes Bild (u.wind, u.welle, u.ruhig),
     varianten(r) würfelt pro Durchlauf die Kleinigkeiten aus, licht[welle] färbt die Szene. */
  const THEMEN = {
    /* I · Der Weg nach Phandalin: Sonnenuntergang, brennender Wagen */
    strasse: {
      partikel: "glut", draussen: true,
      varianten: r => ({ wagenX: r() < 0.5 ? 92 : 300, kraehenX: r() < 0.5 ? 340 : 46, sonneX: 70 + r() * 260, schild: r() < 0.6, kisten: Math.floor(r() * 3) }),
      fern(x, r, v) {
        himmel(x, [[0, "#1c1430"], [0.35, "#3a2442"], [0.55, "#8a4a3a"], [0.62, "#c4703a"], [0.66, "#2a2a26"], [1, "#12160f"]]);
        sterne(x, r, 25, 120);
        glow(x, v.sonneX, 300, 170, "rgba(224,140,70,.38)");
        glow(x, v.sonneX, 296, 22, "rgba(255,210,140,.6)");
        huegel(x, r, "#3a2638", 290, 30, 90);
        x.fillStyle = "#2a2232"; x.beginPath(); x.moveTo(0, 290);
        for (let px = 0; px <= W; px += 40) x.lineTo(px, 262 - Math.sin(px / 70) * 18 - r() * 10);
        x.lineTo(W, 300); x.lineTo(0, 300); x.fill();
      },
      mitte(x, r, v) {
        wald(x, r, "#1a1f18", "#111611", 298);
        x.fillStyle = "#3a3022"; x.beginPath(); x.moveTo(0, 296); x.quadraticCurveTo(200, 286, W, 298); x.lineTo(W, 306); x.lineTo(0, 306); x.fill();
        toterBaum(x, v.kraehenX, 300, 120, "#100d0b", r);
        // umgestürzter, halb verbrannter Wagen
        x.fillStyle = "#14100c";
        x.save(); x.translate(v.wagenX, 292); x.rotate(v.wagenX < 200 ? -0.12 : 0.12);
        x.fillRect(-34, -16, 60, 14); x.fillRect(-30, -30, 4, 16); x.fillRect(14, -26, 4, 12);
        x.lineWidth = 3; x.strokeStyle = "#14100c"; x.beginPath(); x.arc(-20, 0, 9, 0, 7); x.stroke(); x.beginPath(); x.arc(14, -2, 9, 0, 7); x.stroke();
        x.restore();
        for (let i = 0; i < v.kisten; i++) { x.fillStyle = "#1a140e"; x.fillRect(v.wagenX + 40 + i * 13 - (v.wagenX > 200 ? 100 : 0), 288 - (i % 2) * 6, 11, 10); }
        if (v.schild) { const sx = v.wagenX < 200 ? 250 : 140; x.fillStyle = "#1c150e"; x.fillRect(sx, 262, 3, 36); x.fillRect(sx - 14, 264, 30, 8); x.fillStyle = "rgba(224,160,70,.18)"; x.fillRect(sx - 12, 266, 26, 1); }
      },
      deko(x, t, u) {
        const v = u.v;
        rauch(x, v.wagenX + 4, 270, t, u.wind, "40,34,36", 6, 150);
        feuer(x, v.wagenX + 4, 282, 1, t, u.wind); feuer(x, v.wagenX - 12, 286, 0.7, t + 1.3, u.wind);
        // Krähen auf dem toten Baum – ab und zu fliegt eine auf
        for (let i = 0; i < 3; i++) {
          const auf = ((t + i * 3.1) % 14) > 12.4, k = auf ? ((t + i * 3.1) % 14 - 12.4) / 1.6 : 0;
          const bx = v.kraehenX - 14 + i * 13 + k * 60 * (i % 2 ? 1 : -1), by = 216 + i * 9 - k * 70;
          if (auf) vogel(x, bx, by, 0.9, t + i, "kraehe");
          else { x.fillStyle = "#0c0b0e"; x.beginPath(); x.ellipse(bx, by, 3.6, 2.6, 0, 0, PI2); x.fill(); x.beginPath(); x.arc(bx - 3, by - 2.4, 1.8, 0, PI2); x.fill(); }
        }
      },
      himmel: { wolken: [3, 5], wolkenFarbe: "rgba(96,52,74,.6)", wolkenRand: "rgba(255,160,100,.75)", randUnten: true, wolkenY: [60, 200], voegel: "kraehe" },
      wetter: ["klar", "klar", "nebel", "gluehwurm"],
      licht: [{ o: [255, 150, 70, 0.08], u: [255, 120, 50, 0.04] }, { o: [50, 24, 70, 0.26], u: [20, 14, 30, 0.2] }],
      lagen: { form: "busch", rand: "rgba(160,120,70,.25)", farben: ["#1a2116", "#141a12", "#0f140e"] }
    },
    /* II · Die Goblinhöhle */
    hoehle: {
      partikel: "gluehwurm", draussen: true,
      varianten: r => ({ mondX: 50 + r() * 120, mondY: 50 + r() * 50, phase: r(), knochen: r() < 0.7, pfloecke: 1 + Math.floor(r() * 3), fahne: r() < 0.75 }),
      fern(x, r, v) {
        himmel(x, [[0, "#09080f"], [0.45, "#141320"], [0.62, "#1b2220"], [1, "#0d110d"]]);
        sterne(x, r, 60, 200); mond(x, v.mondX, v.mondY, 16, 5, v.phase);
        huegel(x, r, "#151a17", 296, 40, 60);
      },
      mitte(x, r, v) {
        wald(x, r, "#182019", "#111611", 296);
        x.fillStyle = "#2a2826";
        x.beginPath(); x.moveTo(190, 300); x.lineTo(214, 220); x.lineTo(252, 176); x.lineTo(300, 160); x.lineTo(352, 184); x.lineTo(392, 150); x.lineTo(410, 160); x.lineTo(410, 300); x.closePath(); x.fill();
        x.fillStyle = "rgba(235,226,204,.07)"; x.beginPath(); x.moveTo(252, 176); x.lineTo(300, 160); x.lineTo(296, 182); x.lineTo(258, 196); x.closePath(); x.fill();
        x.fillStyle = "#050405"; x.beginPath(); x.moveTo(262, 300); x.quadraticCurveTo(262, 232, 300, 228); x.quadraticCurveTo(338, 232, 340, 300); x.closePath(); x.fill();
        x.fillStyle = "#3a2a1c"; x.fillRect(252, 254, 4, 46); x.fillRect(346, 254, 4, 46);
        // Pflöcke mit Stricken (für die Wölfe)
        x.strokeStyle = "#5a4430"; x.lineWidth = 3;
        for (let i = 0; i < v.pfloecke; i++) { const px = 214 + i * 13, py = 296 + i; x.beginPath(); x.moveTo(px, py); x.lineTo(px, py - 14); x.stroke(); }
        if (v.knochen) { x.fillStyle = "rgba(217,209,188,.4)"; [[356, 296], [366, 298], [372, 294]].forEach(([px, py]) => { x.fillRect(px - 5, py, 10, 2); x.beginPath(); x.arc(px - 5, py + 1, 1.6, 0, PI2); x.arc(px + 5, py + 1, 1.6, 0, PI2); x.fill(); }); }
      },
      deko(x, t, u) {
        fackel(x, 254, 252, t, u.wind); fackel(x, 348, 252, t + 0.7, u.wind);
        if (u.v.fahne) fahne(x, 384, 160, 22, 10, "#5a2a1e", t, u.wind);
        // zwei glühende Augen im Höhleneingang
        if ((t % 9) < 5 && (t % 3) < 2.8) { x.fillStyle = "rgba(255,200,90,.7)"; x.fillRect(292, 262, 2.5, 1.6); x.fillRect(300, 262, 2.5, 1.6); }
      },
      himmel: { wolken: [2, 4], wolkenFarbe: "rgba(40,40,52,.7)", wolkenRand: "rgba(235,226,204,.18)", wolkenY: [30, 170], voegel: "fledermaus", sternschnuppen: true },
      wetter: ["klar", "nebel", "klar", "regen"],
      licht: [{ o: [40, 40, 60, 0.1], u: [10, 20, 10, 0.08] }, { o: [20, 16, 30, 0.22], u: [10, 8, 12, 0.22] }],
      lagen: { form: "busch", rand: "rgba(111,138,90,.22)", farben: ["#172117", "#121a12", "#0e140e"] }
    },
    /* III · Schloss Crackmore */
    schloss: {
      partikel: "gluehwurm", draussen: true,
      varianten: r => ({ mondX: 220 + r() * 140, phase: r() * 0.8, licht: [r() < 0.7, r() < 0.6, r() < 0.4, r() < 0.3], fahne: zuf(r, ["#7a2f26", "#5a3a6a", "#6b4a30"]) }),
      fern(x, r, v) {
        himmel(x, [[0, "#0a0a14"], [0.45, "#161828"], [0.62, "#1e2422"], [1, "#0d110d"]]);
        sterne(x, r, 70, 200); mond(x, v.mondX, 64, 22, 5, v.phase);
        huegel(x, r, "#141a16", 296, 26, 50);
      },
      mitte(x, r, v) {
        x.fillStyle = "#1a1c22";
        x.fillRect(70, 160, 46, 140); x.fillRect(250, 140, 52, 160); x.fillRect(110, 214, 150, 86);
        for (let px = 70; px < 116; px += 12) x.fillRect(px, 150, 8, 12);
        for (let px = 250; px < 302; px += 13) x.fillRect(px, 130, 8, 12);
        x.beginPath(); x.moveTo(110, 214); x.lineTo(150, 204); x.lineTo(170, 220); x.lineTo(196, 196); x.lineTo(224, 218); x.lineTo(260, 210); x.lineTo(260, 216); x.lineTo(110, 216); x.fill();
        x.fillStyle = "#0a0b0e"; x.fillRect(160, 250, 26, 50);
        x.beginPath(); x.arc(173, 250, 13, Math.PI, 0); x.fill();
        [[86, 196], [270, 176], [282, 220], [130, 240]].forEach(([px, py], i) => { x.fillStyle = v.licht[i] ? "rgba(224,160,70,.85)" : "#0a0b0e"; x.fillRect(px, py, 7, 12); });
        x.fillStyle = "rgba(235,226,204,.05)"; x.fillRect(250, 140, 10, 160);
        x.strokeStyle = "#1e3a22"; x.lineWidth = 3;
        for (let i = 0; i < 14; i++) { const px = 70 + r() * 230, py = 140 + r() * 60; x.beginPath(); x.moveTo(px, py); x.bezierCurveTo(px + 10, py + 30, px - 10, py + 60, px + 4, py + 100); x.stroke(); }
        randwald(x, r, "#121812", "#0d120d", 300);
        nebel(x, 250, 70, 0.14);
      },
      deko(x, t, u) {
        const v = u.v;
        [[86, 196], [270, 176], [282, 220], [130, 240]].forEach(([px, py], i) => { if (v.licht[i]) fenster(x, px, py, t + i * 2); });
        fahne(x, 276, 130, 26, 12, v.fahne, t, u.wind);
      },
      himmel: { wolken: [3, 6], wolkenFarbe: "rgba(36,36,50,.8)", wolkenRand: "rgba(235,226,204,.2)", wolkenY: [20, 180], voegel: "fledermaus" },
      wetter: ["klar", "gewitter", "nebel", "gewitter", "regen"],
      licht: [{ o: [60, 50, 90, 0.08], u: [10, 20, 10, 0.06] }, { o: [80, 30, 60, 0.14], u: [20, 8, 16, 0.2] }],
      lagen: { form: "busch", rand: "rgba(111,138,90,.2)", farben: ["#161e16", "#111811", "#0d130d"] }
    },
    /* IV · Der Wachturm: sternklare Nacht, kleiner Mond, manchmal Polarlicht */
    wachturm: {
      partikel: "gluehwurm", draussen: true,
      varianten: r => ({ mondX: 60 + r() * 100, phase: r(), band: r() * 0.8 - 0.4, polar: r() < 0.45, wimpel: r() < 0.8 }),
      fern(x, r, v) {
        himmel(x, [[0, "#06060e"], [0.5, "#121626"], [0.62, "#1a2420"], [1, "#0d110d"]]);
        // Milchstraße
        x.save(); x.translate(200, 130); x.rotate(v.band);
        const g = x.createLinearGradient(0, -40, 0, 40); g.addColorStop(0, "rgba(235,226,204,0)"); g.addColorStop(0.5, "rgba(235,226,204,.07)"); g.addColorStop(1, "rgba(235,226,204,0)");
        x.fillStyle = g; x.fillRect(-300, -40, 600, 80);
        for (let i = 0; i < 160; i++) { x.fillStyle = "rgba(235,226,204," + (0.1 + r() * 0.4).toFixed(2) + ")"; x.fillRect(-260 + r() * 520, (r() + r() + r() - 1.5) * 30, 1, 1); }
        x.restore();
        sterne(x, r, 150, 260); mond(x, v.mondX, 54, 9, 7, v.phase);
        huegel(x, r, "#121a16", 298, 22, 70);
      },
      mitte(x, r) {
        x.fillStyle = "#1c1e22";
        x.fillRect(150, 214, 120, 86);
        x.beginPath(); x.moveTo(144, 216); x.lineTo(210, 184); x.lineTo(276, 216); x.closePath(); x.fill();
        x.fillRect(266, 140, 50, 160);
        for (let px = 264; px < 318; px += 12) x.fillRect(px, 130, 8, 12);
        x.fillStyle = "#0b0c0e"; x.fillRect(196, 258, 18, 42);
        x.fillStyle = "rgba(235,226,204,.06)"; x.fillRect(266, 140, 12, 160);
        randwald(x, r, "#151d16", "#0f150f", 300);
      },
      dekoFern(x, t, u) {
        if (!u.v.polar) return;
        // Polarlicht in Grün und Violett, langsam wogend
        for (let k = 0; k < 2; k++) {
          x.beginPath();
          for (let px = -10; px <= W + 10; px += 20) { const py = 70 + k * 26 + Math.sin(px / 60 + t * 0.4 + k) * 16 + Math.sin(px / 23 - t * 0.7) * 5; px < 0 ? x.moveTo(px, py) : x.lineTo(px, py); }
          for (let px = W + 10; px >= -10; px -= 20) { const py = 120 + k * 26 + Math.sin(px / 60 + t * 0.4 + k) * 16; x.lineTo(px, py); }
          x.closePath();
          x.fillStyle = k ? "rgba(170,110,220," + (0.05 + 0.025 * Math.sin(t * 0.8)).toFixed(3) + ")" : "rgba(110,220,140," + (0.06 + 0.03 * Math.sin(t * 0.6 + 1)).toFixed(3) + ")";
          x.fill();
        }
      },
      deko(x, t, u) {
        const a = 0.55 + 0.35 * Math.sin(t * 7) * Math.sin(t * 3.1);
        glow(x, 292, 200, 26, "rgba(224,160,70," + (a * 0.5).toFixed(2) + ")");
        x.fillStyle = "rgba(255,200,120," + a.toFixed(2) + ")"; x.fillRect(290, 186, 3, 26);
        if (u.v.wimpel) fahne(x, 312, 128, 20, 8, "#6b4a30", t, u.wind);
      },
      himmel: { wolken: [1, 3], wolkenFarbe: "rgba(30,34,44,.6)", wolkenRand: "rgba(235,226,204,.15)", wolkenY: [150, 230], voegel: "fledermaus", sternschnuppen: true, vieleSchnuppen: true },
      wetter: ["klar", "klar", "nebel"],
      licht: [{ o: [30, 30, 50, 0.06], u: [10, 20, 10, 0.06] }, { o: [14, 12, 24, 0.2], u: [6, 8, 6, 0.2] }],
      lagen: { form: "gras", rand: "rgba(150,170,110,.22)", farben: ["#172117", "#121a12", "#0e140e"] }
    },
    /* V · Die alte Mine und die magische Schmiede */
    mine: {
      partikel: "staub", unten: true,
      varianten: r => ({ rune: zuf(r, ["90,220,180", "120,230,140", "255,190,100"]), lore: r() < 0.5 ? 70 : 300, laternen: 1 + Math.floor(r() * 3) }),
      fern(x, r, v) {
        himmel(x, [[0, "#0b0a0e"], [0.5, "#1a1820"], [1, "#0e0c10"]]);
        glow(x, 200, 220, 170, "rgba(" + v.rune + ",.10)");
        felswand(x, r, 310, "#14121a", 20);
        x.strokeStyle = "rgba(235,226,204,.05)"; x.lineWidth = 1;
        for (let i = 0; i < 30; i++) { const px = r() * W, py = 40 + r() * 240; x.beginPath(); x.moveTo(px, py); x.lineTo(px + 20 + r() * 30, py + r() * 10); x.stroke(); }
        // Erzadern, die ein wenig glitzern
        for (let i = 0; i < 18; i++) { x.fillStyle = "rgba(224,190,120," + (0.1 + r() * 0.25).toFixed(2) + ")"; x.fillRect(r() * W, 60 + r() * 220, 2, 1); }
      },
      mitte(x, r, v) {
        [[60], [330]].forEach(([px]) => { x.fillStyle = "#3a2a1c"; x.fillRect(px, 110, 10, 190); x.fillRect(px + 2, 110, 10, 190); });
        x.fillStyle = "#3a2a1c"; x.fillRect(50, 104, 300, 12);
        x.fillStyle = "rgba(0,0,0,.35)"; x.fillRect(50, 114, 300, 4);
        x.strokeStyle = "#2a2834"; x.lineWidth = 18; x.beginPath(); x.arc(200, 300, 90, Math.PI, 0); x.stroke();
        x.fillStyle = "#08070c"; x.beginPath(); x.arc(200, 300, 80, Math.PI, 0); x.fill();
        // Lore auf Schienen
        x.strokeStyle = "#2a241e"; x.lineWidth = 1.5; x.beginPath(); x.moveTo(0, 298); x.lineTo(W, 298); x.stroke();
        x.fillStyle = "#1e1a16"; x.beginPath(); x.moveTo(v.lore - 18, 280); x.lineTo(v.lore + 18, 280); x.lineTo(v.lore + 14, 294); x.lineTo(v.lore - 14, 294); x.closePath(); x.fill();
        x.fillStyle = "rgba(224,190,120,.25)"; for (let i = 0; i < 5; i++) x.fillRect(v.lore - 12 + i * 5, 278 - (i % 2) * 2, 4, 3);
        x.fillStyle = "#0e0c0a"; x.beginPath(); x.arc(v.lore - 9, 295, 3.5, 0, PI2); x.arc(v.lore + 9, 295, 3.5, 0, PI2); x.fill();
        hoehlenDecke(x, r, "#0a090d", 40);
      },
      deko(x, t, u) {
        const v = u.v;
        for (let i = 0; i < 9; i++) {
          const ang = Math.PI + (i + 0.5) / 9 * Math.PI, px = 200 + Math.cos(ang) * 90, py = 300 + Math.sin(ang) * 90;
          const a = 0.45 + 0.45 * Math.sin(t * 2 + i * 0.8);
          glow(x, px, py, 12, "rgba(" + v.rune + "," + (a * 0.6).toFixed(2) + ")");
          x.fillStyle = "rgba(" + v.rune + "," + a.toFixed(2) + ")"; x.fillRect(px - 1.5, py - 4, 3, 8); x.fillRect(px - 4, py - 1, 8, 2);
        }
        glow(x, 200, 290, 50 + u.welle * 20, "rgba(255,170,80," + (0.18 + 0.1 * u.welle + 0.06 * Math.sin(t * 5)).toFixed(2) + ")");
        haenger(x, v.h, t, u.wind);
      },
      haenger: r => { const l = []; const n = 2 + Math.floor(r() * 3); for (let i = 0; i < n; i++) l.push({ x: 90 + i * (220 / n) + r() * 30, y: 116, l: 20 + r() * 26, art: i % 2 ? "kette" : "laterne", f: 1 + r(), ph: r() * 6 }); return l; },
      wetter: ["tropfen", "staubfall", "staubfall", "tropfen"],
      licht: [{ o: [20, 18, 30, 0.06], u: [10, 8, 12, 0.1] }, { o: [80, 40, 20, 0.08], u: [60, 24, 10, 0.12] }],
      lagen: { form: "stein", rand: "rgba(170,160,190,.18)", farben: ["#1c1a22", "#16141b", "#100f14"] }
    },
    /* VI · Donnerbaum: verlassenes Dorf im grauen Morgen */
    donnerbaum: {
      partikel: "asche", draussen: true,
      varianten: r => ({ morgenX: 60 + r() * 280, dachLoch: [r() < 0.6, r() < 0.6, r() < 0.6, r() < 0.6], rauchHaus: Math.floor(r() * 4), baumX: r() < 0.5 ? 26 : 374 }),
      fern(x, r, v) {
        himmel(x, [[0, "#14161a"], [0.35, "#262a2c"], [0.55, "#4a4a40"], [0.62, "#5a5444"], [0.66, "#2a2e28"], [1, "#0e120e"]]);
        glow(x, v.morgenX, 290, 180, "rgba(230,200,140,.14)");
        huegel(x, r, "#2a2e2c", 292, 34, 80);
        huegel(x, r, "#202422", 298, 20, 40);
      },
      mitte(x, r, v) {
        x.fillStyle = "#181b1c";
        x.fillRect(176, 120, 40, 180); x.beginPath(); x.moveTo(176, 120); x.lineTo(186, 100); x.lineTo(196, 116); x.lineTo(206, 92); x.lineTo(216, 120); x.fill();
        x.fillStyle = "#0b0c0d"; x.fillRect(190, 150, 8, 14); x.fillRect(196, 210, 8, 14);
        [[40, 250, 60], [110, 262, 46], [250, 256, 56], [320, 246, 64]].forEach(([px, py, w], i) => {
          x.fillStyle = "#16191a"; x.fillRect(px, py, w, 300 - py);
          x.beginPath(); x.moveTo(px - 6, py); x.lineTo(px + w * 0.45, py - 30); x.lineTo(px + w + 6, py); x.fill();
          x.fillStyle = "#0b0c0d"; x.fillRect(px + w * 0.3, py + 14, 8, 10);
          if (v.dachLoch[i]) { x.fillStyle = "#0e1011"; x.beginPath(); x.moveTo(px + w * 0.5, py - 24); x.lineTo(px + w * 0.8, py - 8); x.lineTo(px + w * 0.6, py + 4); x.fill(); }
        });
        // der Donnerbaum: riesig, kahl, vom Blitz gespalten
        toterBaum(x, v.baumX, 300, 230, "#121514", r);
        x.strokeStyle = "#141716"; x.lineWidth = 4;
        [[14, 300], [370, 300]].forEach(([px, py]) => { if (Math.abs(px - v.baumX) < 30) return; x.beginPath(); x.moveTo(px, py); x.lineTo(px + 4, py - 90); x.moveTo(px + 3, py - 50); x.lineTo(px + 26, py - 80); x.moveTo(px + 4, py - 70); x.lineTo(px - 18, py - 96); x.stroke(); });
        nebel(x, 240, 80, 0.22);
      },
      deko(x, t, u) {
        const hs = [[40, 250, 60], [110, 262, 46], [250, 256, 56], [320, 246, 64]][u.v.rauchHaus];
        rauch(x, hs[0] + hs[2] * 0.7, hs[1] - 16, t, u.wind, "120,120,110", 5, 90);
        // Venomfangs Turmfenster: ein grünes Glimmen
        const a = 0.25 + 0.15 * Math.sin(t * 1.3);
        glow(x, 194, 157, 18, "rgba(140,230,90," + a.toFixed(2) + ")");
      },
      himmel: { wolken: [4, 7], wolkenFarbe: "rgba(70,72,70,.7)", wolkenRand: "rgba(230,210,160,.25)", wolkenY: [20, 200], voegel: "kraehe" },
      wetter: ["nebel", "gewitter", "nebel", "regen"],
      licht: [{ o: [230, 200, 150, 0.06], u: [40, 50, 40, 0.06] }, { o: [90, 130, 60, 0.12], u: [30, 50, 20, 0.16] }],
      lagen: { form: "gras", rand: "rgba(130,140,110,.18)", farben: ["#1a1e18", "#141814", "#0f120f"] }
    },
    /* VII · Gefängnis im Unterreich: Ilvaras Festung */
    gefaengnis: {
      partikel: "glut", unten: true,
      varianten: r => ({ augen: [r() < 0.6, r() < 0.5], banner: zuf(r, ["#3a2448", "#4a1e1e", "#2a2a2a"]), kaefig: r() < 0.6 ? 110 + r() * 40 : -1 }),
      fern(x, r) {
        himmel(x, [[0, "#08070b"], [0.5, "#16131a"], [1, "#0c0a0d"]]);
        felswand(x, r, 150, "#120f14", 40);
        for (let i = 0; i < 20; i++) { x.fillStyle = "rgba(200,138,255," + (0.05 + r() * 0.12).toFixed(2) + ")"; x.fillRect(r() * W, 30 + r() * 110, 1.5, 1.5); }
      },
      mitte(x, r, v) {
        x.fillStyle = "#211c22"; x.fillRect(40, 170, 320, 130);
        for (let px = 40; px < 360; px += 18) x.fillRect(px, 160, 11, 12);
        x.strokeStyle = "rgba(0,0,0,.35)"; x.lineWidth = 1;
        for (let yy = 182; yy < 300; yy += 12) for (let px = 40 + (yy % 24 ? 0 : 12); px < 360; px += 24) x.strokeRect(px, yy, 24, 12);
        [[90, 208], [290, 208]].forEach(([px, py]) => { x.fillStyle = "#07060a"; x.fillRect(px, py, 30, 36); x.fillStyle = "#3a3640"; for (let i = 0; i < 4; i++) x.fillRect(px + 4 + i * 7, py, 2.5, 36); });
        x.fillStyle = "#0a090c"; x.fillRect(180, 236, 40, 64); x.beginPath(); x.arc(200, 236, 20, Math.PI, 0); x.fill();
        // Spinnenbanner der Drow
        [[136, 180], [252, 180]].forEach(([px, py]) => {
          x.fillStyle = v.banner; x.beginPath(); x.moveTo(px, py); x.lineTo(px + 14, py); x.lineTo(px + 14, py + 40); x.lineTo(px + 7, py + 34); x.lineTo(px, py + 40); x.closePath(); x.fill();
          x.strokeStyle = "rgba(200,190,170,.35)"; x.lineWidth = 0.8; x.beginPath(); x.arc(px + 7, py + 16, 3, 0, PI2);
          for (let k = 0; k < 4; k++) { x.moveTo(px + 7, py + 16); x.lineTo(px + 7 + (k < 2 ? -6 : 6), py + 11 + (k % 2) * 10); } x.stroke();
        });
        hoehlenDecke(x, r, "#08070a", 60);
      },
      deko(x, t, u) {
        const v = u.v;
        fackel(x, 160, 222, t, u.wind); fackel(x, 240, 222, t + 0.9, u.wind); fackel(x, 30, 250, t + 1.7, u.wind);
        [[90, 208], [290, 208]].forEach(([px, py], i) => {
          if (!v.augen[i] || (t + i * 4) % 7 > 4.5 || (t * 3 + i) % 5 < 0.15) return;
          x.fillStyle = "rgba(255,200,120,.65)"; x.fillRect(px + 10, py + 14, 2.5, 1.5); x.fillRect(px + 17, py + 14, 2.5, 1.5);
        });
        haenger(x, v.h, t, u.wind);
        if (u.welle) glow(x, 200, 200, 220, "rgba(196,60,40," + (0.08 + 0.05 * Math.sin(t * 2.2)).toFixed(3) + ")");
      },
      haenger: r => { const l = []; for (let i = 0; i < 4; i++) l.push({ x: 50 + i * 95 + r() * 30, y: 40 + r() * 20, l: 30 + r() * 50, art: "kette", f: 0.8 + r(), ph: r() * 6 }); return l; },
      wetter: ["tropfen", "klar", "tropfen"],
      licht: [{ o: [60, 40, 70, 0.06], u: [30, 14, 10, 0.1] }, { o: [120, 30, 30, 0.1], u: [60, 10, 10, 0.16] }],
      lagen: { form: "stein", rand: "rgba(200,150,110,.15)", farben: ["#1e1a1e", "#171418", "#111013"] }
    },
    /* VIII · Durch die Spinnweben: leuchtende Pilze */
    spinnweben: {
      partikel: "sporen", unten: true,
      varianten: r => ({ netzR: [110 + r() * 40, 110 + r() * 40], mitteNetz: r() < 0.7 }),
      fern(x, r) {
        himmel(x, [[0, "#06080c"], [0.5, "#0f1820"], [1, "#0a0c10"]]);
        glow(x, 40 + r() * 140, 230, 140, "rgba(80,220,220,.10)"); glow(x, 220 + r() * 140, 200, 130, "rgba(170,110,255,.10)");
        felswand(x, r, 260, "#0e1218", 50);
      },
      mitte(x, r, v) {
        for (let i = 0; i < 12; i++) {
          const px = r() * W, py = 200 + r() * 90, s = 6 + r() * 10, f = r() < 0.5 ? "rgba(110,230,230," : "rgba(190,130,255,";
          glow(x, px, py - s, s * 3, f + ".25)");
          x.fillStyle = "#1e2028"; x.fillRect(px - 1.5, py - s, 3, s);
          x.fillStyle = f + ".85)"; x.beginPath(); x.ellipse(px, py - s, s * 0.9, s * 0.5, 0, Math.PI, 0); x.fill();
        }
        hoehlenDecke(x, r, "#05060a", 50);
        const netz = (cx, cy, rad, a0, a1) => {
          x.strokeStyle = "rgba(220,230,240,.22)"; x.lineWidth = 0.8;
          for (let i = 0; i <= 6; i++) { const a = a0 + (a1 - a0) * i / 6; x.beginPath(); x.moveTo(cx, cy); x.lineTo(cx + Math.cos(a) * rad, cy + Math.sin(a) * rad); x.stroke(); }
          for (let k = 1; k <= 5; k++) { x.beginPath(); for (let i = 0; i <= 6; i++) { const a = a0 + (a1 - a0) * i / 6, rr = rad * k / 5.5; const px = cx + Math.cos(a) * rr, py = cy + Math.sin(a) * rr; i ? x.lineTo(px, py) : x.moveTo(px, py); } x.stroke(); }
        };
        netz(0, 30, v.netzR[0], 0, Math.PI / 2); netz(W, 30, v.netzR[1], Math.PI / 2, Math.PI);
        if (v.mitteNetz) netz(200, 0, 90, 0.4, Math.PI - 0.4);
      },
      deko(x, t, u) {
        const v = u.v;
        // Tautropfen in den Netzen glitzern
        v.tau.forEach((d, i) => { const a = Math.max(0, Math.sin(t * 1.5 + d.ph)) ** 6; if (a > 0.05) { x.fillStyle = "rgba(235,250,240," + (a * 0.9).toFixed(2) + ")"; x.beginPath(); x.arc(d.x, d.y, 1.2 + a, 0, PI2); x.fill(); } });
        // Pilze atmen
        glow(x, 200, 260, 180, "rgba(110,230,200," + (0.03 + 0.03 * Math.sin(t * 0.9)).toFixed(3) + ")");
        haenger(x, v.h, t, u.wind);
        if (u.welle) glow(x, 200, 220, 140, "rgba(140,230,120," + (0.05 + 0.03 * Math.sin(t * 1.7)).toFixed(3) + ")");
      },
      haenger: r => { const l = []; for (let i = 0; i < 5; i++) l.push({ x: 40 + i * 80 + r() * 30, y: 20 + r() * 20, l: 40 + r() * 90, art: r() < 0.6 ? "spinne" : "faden", f: 0.6 + r() * 0.8, ph: r() * 6 }); return l; },
      extra: (r, v) => { v.tau = []; for (let i = 0; i < 14; i++) { const ecke = i % 2, a = r() * Math.PI / 2 + (ecke ? Math.PI / 2 : 0), rr = 20 + r() * 100; v.tau.push({ x: (ecke ? W : 0) + Math.cos(a) * rr, y: 30 + Math.sin(a) * rr, ph: r() * 6 }); } },
      wetter: ["tropfen", "klar", "tropfen"],
      licht: [{ o: [20, 40, 40, 0.06], u: [10, 14, 20, 0.08] }, { o: [30, 60, 30, 0.12], u: [10, 20, 10, 0.18] }],
      lagen: { form: "stein", rand: "rgba(110,230,230,.18)", pilze: true, farben: ["#121822", "#0e131b", "#0a0e14"] }
    },
    /* IX · Der unterirdische See und die Stadt der Kuo-Toa */
    see: {
      partikel: "sporen", unten: true,
      varianten: r => ({ boote: 1 + Math.floor(r() * 3), bootPh: r() * 100, tempelLicht: zuf(r, ["110,230,200", "224,160,70"]) }),
      fern(x, r, v) {
        himmel(x, [[0, "#05070a"], [0.4, "#0e1820"], [0.55, "#14262c"], [1, "#0a0e10"]]);
        x.fillStyle = "#14201e";
        [[30, 40, 26], [80, 30, 20], [130, 46, 34], [196, 60, 30], [262, 34, 24], [312, 44, 28], [362, 30, 22]].forEach(([px, h, w]) => {
          const hh = h * (0.8 + r() * 0.4);
          x.fillRect(px, 236 - hh, w, hh); x.beginPath(); x.ellipse(px + w / 2, 236 - hh, w / 2, w / 3, 0, Math.PI, 0); x.fill();
          if (r() < 0.5) { x.fillStyle = "rgba(" + v.tempelLicht + ",.5)"; x.fillRect(px + w / 2 - 1.5, 236 - hh * 0.6, 3, 4); x.fillStyle = "#14201e"; }
        });
        x.fillStyle = "#182826"; x.beginPath(); x.moveTo(176, 236); x.lineTo(186, 180); x.lineTo(220, 168); x.lineTo(254, 180); x.lineTo(264, 236); x.fill();
        x.fillStyle = "#0b1212"; x.fillRect(212, 206, 16, 30);
        const g = x.createLinearGradient(0, 236, 0, 300); g.addColorStop(0, "#1a3a40"); g.addColorStop(1, "#0a1a1e");
        x.fillStyle = g; x.fillRect(0, 236, W, 64);
        x.fillStyle = "rgba(20,32,30,.6)"; x.fillRect(0, 236, W, 6);
      },
      mitte(x, r) {
        hoehlenDecke(x, r, "#04060a", 70);
        // Lichtschacht durch einen Riss in der Decke
        x.save(); x.globalCompositeOperation = "lighter";
        const lx = 80 + r() * 240, g = x.createLinearGradient(lx, 40, lx + 40, 300);
        g.addColorStop(0, "rgba(150,230,200,.08)"); g.addColorStop(1, "rgba(150,230,200,0)");
        x.fillStyle = g; x.beginPath(); x.moveTo(lx - 8, 40); x.lineTo(lx + 8, 40); x.lineTo(lx + 70, 300); x.lineTo(lx + 20, 300); x.closePath(); x.fill();
        x.restore();
      },
      dekoFern(x, t, u) {
        const v = u.v;
        x.strokeStyle = "rgba(150,230,230,.22)"; x.lineWidth = 1;
        const zug = u.wind * 0.08;
        for (let i = 0; i < 14; i++) {
          const yy = 244 + (i % 7) * 8, px = (((i * 53 + t * (10 + i % 3 * 6 + zug)) % (W + 60)) + W + 60) % (W + 60) - 30;
          x.beginPath(); x.moveTo(px, yy); x.lineTo(px + 18 + (i % 4) * 6, yy); x.stroke();
        }
        glow(x, 220, 196, 30, "rgba(" + v.tempelLicht + "," + (0.12 + 0.08 * Math.sin(t * 1.6)).toFixed(2) + ")");
        // kleine Laternenboote der Kuo-Toa treiben über den See
        for (let i = 0; i < v.boote; i++) {
          const px = ((v.bootPh + t * (6 + i * 3) + i * 150) % (W + 80)) - 40, py = 250 + i * 14 + Math.sin(t * 1.2 + i) * 1.5;
          x.fillStyle = "#0a1414"; x.beginPath(); x.moveTo(px - 10, py); x.lineTo(px + 10, py); x.lineTo(px + 7, py + 4); x.lineTo(px - 7, py + 4); x.closePath(); x.fill();
          glow(x, px, py - 4, 12, "rgba(224,160,70,.35)"); x.fillStyle = "rgba(255,200,110,.9)"; x.fillRect(px - 1, py - 6, 2, 3);
          x.fillStyle = "rgba(224,160,70,.18)"; x.fillRect(px - 1, py + 5, 2, 8 + Math.sin(t * 3 + i) * 2);
        }
        // Welle 2: Demogorgon erwacht – Blasen und rotes Glühen aus der Tiefe, Tentakel tauchen auf
        if (u.welle) {
          glow(x, 200, 290, 160, "rgba(196,60,40," + (0.1 + 0.06 * Math.sin(t * 1.3)).toFixed(3) + ")");
          for (let i = 0; i < 3; i++) {
            const ph = (t * 0.12 + i / 3) % 1, hoch = Math.sin(ph * Math.PI) * 46, px = 70 + i * 130 + Math.sin(i * 7) * 20;
            if (hoch < 2) continue;
            x.strokeStyle = "#0c1010"; x.lineWidth = 6; x.lineCap = "round";
            x.beginPath(); x.moveTo(px, 262); x.quadraticCurveTo(px + Math.sin(t * 1.5 + i) * 14, 262 - hoch * 0.6, px + Math.sin(t * 2 + i) * 10, 262 - hoch); x.stroke(); x.lineCap = "butt";
          }
        }
      },
      wetter: ["tropfen", "nebel", "tropfen"],
      licht: [{ o: [20, 50, 50, 0.06], u: [10, 30, 30, 0.08] }, { o: [80, 20, 20, 0.1], u: [40, 10, 10, 0.16] }],
      lagen: { form: "stein", rand: "rgba(150,230,230,.15)", farben: ["#132020", "#0f1919", "#0b1313"] }
    },
    /* X · Gracklstugh: Stadt der Schmieden */
    gracklstugh: {
      partikel: "glut", unten: true,
      varianten: r => ({ fenster: [0, 1, 2, 3, 4].map(() => r() < 0.75), kamine: [[30, 200], [80, 214], [320, 204], [366, 190]].filter(() => r() < 0.8), amboss: r() < 0.5 ? 150 : 260 }),
      fern(x, r) {
        himmel(x, [[0, "#0a0606"], [0.5, "#24140e"], [0.65, "#3a1e12"], [1, "#0e0a08"]]);
        glow(x, 200, 290, 220, "rgba(255,120,40,.18)");
        x.fillStyle = "#1e1612";
        x.beginPath(); x.moveTo(110, 300); x.lineTo(130, 150); x.lineTo(170, 110); x.lineTo(230, 110); x.lineTo(270, 150); x.lineTo(290, 300); x.fill();
        x.fillStyle = "#2a1e18"; for (let i = 0; i < 5; i++) x.fillRect(150 + i * 22, 140, 12, 160);
      },
      mitte(x, r, v) {
        hoehlenDecke(x, r, "#080505", 60);
        [[160, 170], [200, 160], [240, 170], [180, 220], [222, 220]].forEach(([px, py], i) => { x.fillStyle = v.fenster[i] ? "rgba(255,150,60,.8)" : "#120c0a"; x.fillRect(px, py, 6, 10); });
        x.fillStyle = "#16100d"; x.fillRect(0, 256, W, 44);
        for (let px = 0; px < W; px += 16) x.fillRect(px, 248, 10, 10);
        v.kamine.forEach(([px, py]) => { x.fillStyle = "#130d0b"; x.fillRect(px, py, 14, 60); });
        // Duergar-Banner an der Mauer
        for (let i = 0; i < 3; i++) { const px = 60 + i * 130 + r() * 20; x.fillStyle = "#3a1a14"; x.fillRect(px, 260, 12, 26); x.fillStyle = "rgba(224,160,70,.35)"; x.fillRect(px + 4, 266, 4, 4); }
      },
      deko(x, t, u) {
        const v = u.v;
        v.kamine.forEach(([px, py], i) => {
          rauch(x, px + 7, py - 4, t + i * 0.7, u.wind, "60,50,46", 3, 70);
          glow(x, px + 7, py + 4, 16, "rgba(255,140,50," + (0.25 + 0.12 * Math.sin(t * 6 + i)).toFixed(2) + ")");
        });
        // Schmiedehammer: alle paar Sekunden ein Funkenregen
        const ph = (t * 0.8) % 1;
        if (ph < 0.12) glow(x, v.amboss, 250, 30, "rgba(255,200,110," + (0.5 * (1 - ph / 0.12)).toFixed(2) + ")");
        if (u.welle) glow(x, 200, 160, 230, "rgba(255,60,30," + (0.06 + 0.06 * Math.max(0, Math.sin(t * 3))).toFixed(3) + ")");
      },
      wetter: ["klar", "staubfall", "klar"],
      licht: [{ o: [255, 120, 50, 0.05], u: [60, 20, 10, 0.08] }, { o: [200, 50, 30, 0.1], u: [80, 20, 10, 0.14] }],
      lagen: { form: "stein", rand: "rgba(255,150,80,.15)", farben: ["#1e1612", "#18110e", "#110c0a"] }
    },
    /* XI · Die Slums ganz unten in Gracklstugh: schiefe Hütten, Lavaschein aus der Tiefe */
    slums: {
      partikel: "glut", unten: true,
      varianten: r => ({ waesche: [0, 1, 2, 3].map(() => zuf(r, ["#3a2a26", "#2a2430", "#3a2a20", "#2a2a2a", "#4a2a1a"])), augenX: 150 + r() * 120, zeichen: r() < 0.5 ? 30 : 370 }),
      fern(x, r) {
        himmel(x, [[0, "#060405"], [0.35, "#140c0c"], [0.62, "#2a140c"], [0.75, "#3a1a0c"], [1, "#0c0806"]]);
        hoehlenDecke(x, r, "#040303", 40);
        for (let i = 0; i < 26; i++) { x.fillStyle = "rgba(255,170,80," + (0.15 + r() * 0.35).toFixed(2) + ")"; x.fillRect(r() * W, 50 + r() * 50, 2, 2); }
        x.fillStyle = "#0e0a0a";
        x.beginPath(); x.moveTo(0, 60); x.lineTo(58, 90); x.lineTo(46, 170); x.lineTo(70, 230); x.lineTo(54, 300); x.lineTo(0, 300); x.fill();
        x.beginPath(); x.moveTo(W, 60); x.lineTo(W - 52, 100); x.lineTo(W - 40, 180); x.lineTo(W - 66, 240); x.lineTo(W - 50, 300); x.lineTo(W, 300); x.fill();
        glow(x, 200, 300, 230, "rgba(255,110,40,.2)");
      },
      mitte(x, r, v) {
        const huette = (px, py, w, h, schief, dunkel) => {
          x.save(); x.translate(px, py); x.rotate(schief);
          x.fillStyle = dunkel; x.fillRect(-w / 2, -h, w, h);
          x.beginPath(); x.moveTo(-w / 2 - 5, -h); x.lineTo(-w * 0.1, -h - h * 0.45); x.lineTo(w / 2 + 5, -h); x.closePath(); x.fill();
          x.strokeStyle = "rgba(0,0,0,.45)"; x.lineWidth = 1;
          for (let yy = -h + 6; yy < 0; yy += 7) { x.beginPath(); x.moveTo(-w / 2, yy); x.lineTo(w / 2, yy + (r() - 0.5) * 2); x.stroke(); }
          x.restore();
        };
        [[90, 220, 42, 30, -0.06], [140, 214, 36, 26, 0.05], [262, 216, 44, 32, 0.07], [312, 224, 34, 26, -0.05], [200, 180, 40, 28, 0.03], [118, 176, 30, 22, -0.08], [286, 176, 32, 24, 0.06]]
          .forEach(([px, py, w, h, s]) => huette(px, py, w, h, s + (r() - 0.5) * 0.04, "#1c1210"));
        [[70, 290, 54, 46, 0.04], [150, 296, 46, 40, -0.05], [244, 294, 52, 44, 0.05], [330, 292, 56, 48, -0.04]]
          .forEach(([px, py, w, h, s]) => huette(px, py, w, h, s + (r() - 0.5) * 0.04, "#140d0b"));
        x.strokeStyle = "#2a1a12"; x.lineWidth = 3;
        x.beginPath(); x.moveTo(60, 222); x.lineTo(340, 226); x.stroke();
        x.beginPath(); x.moveTo(100, 178); x.lineTo(304, 180); x.stroke();
        x.lineWidth = 2;
        [[176, 182, 226], [232, 228, 292]].forEach(([px, y0, y1]) => { x.beginPath(); x.moveTo(px, y0); x.lineTo(px, y1); x.moveTo(px + 8, y0); x.lineTo(px + 8, y1); x.stroke(); for (let yy = y0 + 6; yy < y1; yy += 8) { x.beginPath(); x.moveTo(px, yy); x.lineTo(px + 8, yy); x.stroke(); } });
        x.strokeStyle = "rgba(90,70,60,.6)"; x.lineWidth = 0.8;
        x.beginPath(); x.moveTo(110, 196); x.quadraticCurveTo(200, 212, 290, 196); x.stroke();
        const lg = x.createLinearGradient(0, 286, 0, 300); lg.addColorStop(0, "#ffcf7a"); lg.addColorStop(0.4, "#ff7a2a"); lg.addColorStop(1, "#7a1e0c");
        x.fillStyle = lg; x.fillRect(0, 290, W, 10);
        x.fillStyle = "rgba(40,14,8,.7)"; for (let i = 0; i < 14; i++) x.fillRect(r() * W, 291 + r() * 5, 8 + r() * 14, 2);
        const zx = v.zeichen;
        x.strokeStyle = "rgba(168,159,143,.35)"; x.lineWidth = 1.5;
        x.beginPath(); x.arc(zx, 210, 10, 0, PI2); x.stroke();
        x.beginPath(); x.moveTo(zx + 6, 206); x.lineTo(zx - 2, 204); x.lineTo(zx - 8, 212); x.lineTo(zx, 214); x.lineTo(zx + 8, 202); x.stroke();
      },
      deko(x, t, u) {
        const v = u.v;
        // Wäsche auf der Leine flattert im Luftzug
        [[140, 201], [170, 205], [228, 205], [262, 200]].forEach(([px, py], i) => {
          const w = Math.max(-0.7, Math.min(0.7, u.wind * 0.004)) + Math.sin(t * 3 + i) * 0.08;
          x.fillStyle = v.waesche[i]; x.save(); x.translate(px, py); x.transform(1, 0, Math.sin(w), 1, 0, 0); x.fillRect(-5, 0, 10, 12); x.restore();
        });
        [[90, 204], [140, 200], [262, 200], [200, 166], [70, 266], [244, 270], [330, 266]].forEach(([px, py], i) => {
          const a = 0.35 + 0.3 * Math.sin(t * (3 + i % 3) + i * 1.7) * Math.sin(t * 1.3 + i);
          glow(x, px, py, 14, "rgba(255,150,60," + (Math.max(0.05, a) * 0.6).toFixed(2) + ")");
          x.fillStyle = "rgba(255,180,90," + Math.max(0.1, a).toFixed(2) + ")"; x.fillRect(px - 3, py - 4, 6, 8);
        });
        glow(x, 200, 294, 200, "rgba(255,120,40," + (0.1 + 0.05 * Math.sin(t * 1.4)).toFixed(2) + ")");
        for (let i = 0; i < 6; i++) {
          const ph = (t * 0.6 + i / 6) % 1, px = (i * 71 + 30) % W;
          x.fillStyle = "rgba(255,210,120," + (0.8 * (1 - ph)).toFixed(2) + ")";
          x.beginPath(); x.arc(px, 292 - ph * 10, 1.5 + ph * 2, 0, 7); x.fill();
        }
        const blinz = (t % 5) < 4.6 ? 1 : 0;
        if (blinz && (t % 11) < 6) { x.fillStyle = "rgba(235,226,204,.7)"; x.fillRect(v.augenX, 206, 2.5, 1.5); x.fillRect(v.augenX + 6, 206, 2.5, 1.5); }
        haenger(x, v.h, t, u.wind);
      },
      haenger: r => { const l = []; for (let i = 0; i < 3; i++) l.push({ x: 80 + i * 120 + r() * 40, y: 30 + r() * 20, l: 30 + r() * 40, art: "laterne", f: 0.9 + r(), ph: r() * 6 }); return l; },
      wetter: ["tropfen", "nebel", "klar"],
      licht: [{ o: [80, 30, 20, 0.06], u: [80, 30, 10, 0.08] }, { o: [30, 20, 30, 0.18], u: [60, 20, 10, 0.14] }],
      lagen: { form: "stein", rand: "rgba(255,140,60,.2)", farben: ["#1e1410", "#170f0c", "#100a08"] }
    }
  };

  /* ---------- Vignette (einmal gemalt, für alle Kulissen) ---------- */
  let vignette = null;
  function vignetteHolen() {
    if (vignette) return vignette;
    const [c, x] = leinwand(W / 2, H / 2);
    const g = x.createRadialGradient(W / 4, H / 4, W * 0.18, W / 4, H / 4, W * 0.42);
    g.addColorStop(0, "rgba(0,0,0,0)"); g.addColorStop(1, "rgba(0,0,0,.45)");
    x.fillStyle = g; x.fillRect(0, 0, W / 2, H / 2);
    return (vignette = c);
  }

  /* ---------- Eine Kulisse bauen ---------- */
  const cache = new Map();
  function bauen(name, seed) {
    seed = Math.floor(seed || 1);
    const key = name + ":" + seed;
    if (cache.has(key)) return cache.get(key);
    const th = THEMEN[name] || THEMEN.hoehle, r = lcg(seed * 31 + name.length * 977 + 7);
    const v = th.varianten ? th.varianten(r) : {};
    if (th.haenger) v.h = th.haenger(r);
    if (th.extra) th.extra(r, v);
    const [fern, xf] = leinwand(); th.fern(xf, r, v);
    const [hg, xm] = leinwand(); th.mitte(xm, r, v);
    const lagen = lagenBauen(th.lagen, th.lagen.farben, r);
    const wetter = zuf(r, th.wetter || ["klar"]);
    const hm = th.himmel || null;
    const welt = {
      name, fern, hg, lagen, partikel: th.partikel, unten: !!th.unten, draussen: !!th.draussen, wetter, v,
      wolken: [], schwarm: null, schwarmT: 4 + r() * 6, schnuppe: null, schnuppeT: 3 + r() * 5,
      blitzT: 6 + r() * 6, blitz: 0, bolzen: null, tropfen: [], regen: [], nebel: [], teile: [], lk: 0,
      halmListe: [], r
    };
    if (hm) {
      const n = hm.wolken[0] + Math.floor(r() * (hm.wolken[1] - hm.wolken[0] + 1));
      for (let i = 0; i < n; i++) { const b = wolkeBauen(r, hm.wolkenFarbe, hm.wolkenRand, hm.randUnten); welt.wolken.push({ b, x: r() * (W + 200) - 100, y: hm.wolkenY[0] + r() * (hm.wolkenY[1] - hm.wolkenY[0]), v: 0.6 + r() * 0.8, s: 0.7 + r() * 0.6 }); }
    }
    if (wetter === "nebel") for (let i = 0; i < 3; i++) welt.nebel.push({ b: nebelBand(r, 0.2), x: r() * 300 - 300, y: 190 + i * 46, v: 0.5 + r() * 0.5, a: i === 2 ? 0.4 : 0.65 });
    if (wetter === "gewitter" || wetter === "regen") for (let i = 0; i < 70; i++) welt.regen.push({ x: r() * W, y: r() * H, l: 8 + r() * 10, v: 420 + r() * 180 });
    if (wetter === "tropfen" || wetter === "staubfall") for (let i = 0; i < 6; i++) welt.tropfen.push({ x: 20 + r() * 360, y: 40 + r() * 30, t: r() * 3, p: 1.5 + r() * 2.5 });
    // Grashalme an den Bahnkanten (nur draußen)
    if (th.draussen) BAHNEN.forEach((b, i) => {
      const l = [];
      for (let xx = 6 + r() * 20; xx < W; xx += 22 + r() * 34) l.push({ x: xx, h: (9 + r() * 9) * b.s, n: 3 + Math.floor(r() * 3), ph: r() * 6 });
      welt.halmListe[i] = l;
    });
    welt.licht = th.licht || [{ o: [0, 0, 0, 0], u: [0, 0, 0, 0] }, { o: [0, 0, 0, 0], u: [0, 0, 0, 0] }];
    welt.deko = th.deko || null; welt.dekoFern = th.dekoFern || null; welt.himmel = hm;
    welt.hinten = (x, t, dt, u) => hintenZeichnen(welt, x, t, dt, u);
    welt.halme = (x, i, t, u) => halmeZeichnen(welt, x, i, t, u);
    welt.vorne = (x, t, dt, u) => vorneZeichnen(welt, x, t, dt, u);
    welt.standbild = x => { x.drawImage(fern, 0, 0, W, H); x.drawImage(hg, 0, 0, W, H); lagen.forEach(l => x.drawImage(l, 0, 0, W, H)); };
    cache.set(key, welt);
    if (cache.size > 3) cache.delete(cache.keys().next().value); // Speicher schonen
    return welt;
  }

  /* Parallaxe: ferne Ebene verschiebt sich stärker als die mittlere; die Bodenstreifen bleiben fest */
  function ebeneTrafo(x, u, s) {
    const pad = 12 * s, ox = (u.par ? u.par.x : 0) * 10 * s, oy = (u.par ? u.par.y : 0) * 3 * s;
    x.translate(-pad + ox, -4 * s + oy); x.scale((W + 2 * pad) / W, (H + 8 * s) / H);
  }

  function hintenZeichnen(w, x, t, dt, u) {
    u.v = w.v;
    const wind = u.wind || 0;
    // ferne Ebene
    x.save(); ebeneTrafo(x, u, 1);
    x.drawImage(w.fern, 0, 0, W, H);
    if (w.dekoFern) w.dekoFern(x, t, u);
    // Sternschnuppen
    if (w.himmel && w.himmel.sternschnuppen && !u.ruhig) {
      w.schnuppeT -= dt;
      if (w.schnuppeT <= 0 && !w.schnuppe) { w.schnuppe = { x: 40 + Math.random() * 320, y: 20 + Math.random() * 90, t: 0, dx: Math.random() < 0.5 ? -1 : 1 }; w.schnuppeT = (w.himmel.vieleSchnuppen ? 2.5 : 6) + Math.random() * 6; }
      const s = w.schnuppe;
      if (s) {
        s.t += dt; const k = s.t / 0.7;
        if (k >= 1) w.schnuppe = null;
        else {
          const hx = s.x + s.dx * k * 120, hy = s.y + k * 50;
          const g = x.createLinearGradient(hx, hy, hx - s.dx * 40, hy - 17); g.addColorStop(0, "rgba(255,240,210," + (0.9 * (1 - k)).toFixed(2) + ")"); g.addColorStop(1, "rgba(255,240,210,0)");
          x.strokeStyle = g; x.lineWidth = 1.4; x.beginPath(); x.moveTo(hx, hy); x.lineTo(hx - s.dx * 40, hy - 17); x.stroke();
        }
      }
    }
    // Wolken ziehen mit dem Wind
    w.wolken.forEach(c => {
      c.x += (wind * 0.1 + (wind >= 0 ? 3 : -3)) * c.v * dt;
      if (c.x > W + 40) c.x = -c.b.w * c.s - 40; else if (c.x < -c.b.w * c.s - 40) c.x = W + 40;
      x.drawImage(c.b.c, c.x, c.y, c.b.w * c.s, c.b.h * c.s);
    });
    // ferner Blitz
    if (w.wetter === "gewitter") {
      w.blitzT -= dt;
      if (w.blitzT <= 0) {
        w.blitzT = 5 + Math.random() * 8;
        if (!u.ruhig) { w.blitz = 1; const bx = 40 + Math.random() * 320, pk = [[bx, 0]]; let yy = 0, xx = bx; while (yy < 230) { yy += 18 + Math.random() * 22; xx += (Math.random() - 0.5) * 34; pk.push([xx, yy]); } w.bolzen = pk; }
      }
      if (w.bolzen && w.blitz > 0.55) {
        x.strokeStyle = "rgba(255,250,235," + ((w.blitz - 0.55) * 2).toFixed(2) + ")"; x.lineWidth = 1.6;
        x.beginPath(); w.bolzen.forEach(([px, py], i) => i ? x.lineTo(px, py) : x.moveTo(px, py)); x.stroke();
      }
    }
    x.restore();
    // Vogel- oder Fledermausschwarm zieht vorbei
    if (w.himmel && w.himmel.voegel) {
      w.schwarmT -= dt;
      if (w.schwarmT <= 0 && !w.schwarm) {
        const dir = wind > 20 ? 1 : wind < -20 ? -1 : (Math.random() < 0.5 ? 1 : -1), n = 3 + Math.floor(Math.random() * 4), y0 = 60 + Math.random() * 120;
        w.schwarm = { dir, t: 0, voegel: Array.from({ length: n }, (_, i) => ({ dx: -i * 14 - Math.random() * 10, dy: (i % 2 ? 1 : -1) * Math.ceil(i / 2) * 7 + Math.random() * 5, ph: Math.random() * 6 })), y0, v: 55 + Math.random() * 30 + Math.abs(wind) * 0.2 };
        w.schwarmT = 9 + Math.random() * 10;
      }
      const sw = w.schwarm;
      if (sw) {
        sw.t += dt;
        const kopf = sw.dir > 0 ? -30 + sw.t * sw.v : W + 30 - sw.t * sw.v;
        sw.voegel.forEach(b => vogel(x, kopf + sw.dir * b.dx, sw.y0 + b.dy + Math.sin(sw.t * 2 + b.ph) * 4, 0.8, t + b.ph, w.himmel.voegel));
        if (sw.t * sw.v > W + 160) w.schwarm = null;
      }
    }
    // mittlere Ebene
    x.save(); ebeneTrafo(x, u, 0.5);
    x.drawImage(w.hg, 0, 0, W, H);
    if (w.deko) w.deko(x, t, u);
    // Staub rieselt von der Decke
    if (w.wetter === "staubfall") w.tropfen.forEach(d => {
      d.t += dt; const k = (d.t % d.p) / d.p;
      if (k < 0.5) { x.fillStyle = "rgba(168,159,143," + (0.22 * (1 - k * 2)).toFixed(2) + ")"; for (let i = 0; i < 4; i++) x.fillRect(d.x + Math.sin(i * 3 + d.t) * 1.5 + wind * 0.02 * i, d.y + k * 120 + i * 9, 1, 3); }
    });
    x.restore();
    // Nebelbänder hinter den Bodenstreifen
    w.nebel.forEach((n, i) => {
      if (i === 2) return;
      n.x += (wind * 0.12 + 4) * n.v * dt; if (n.x > W) n.x -= n.b.w; if (n.x < -n.b.w) n.x += n.b.w;
      x.globalAlpha = n.a; x.drawImage(n.b.c, n.x, n.y, n.b.w, n.b.h); x.drawImage(n.b.c, n.x - n.b.w, n.y, n.b.w, n.b.h); x.drawImage(n.b.c, n.x + n.b.w, n.y, n.b.w, n.b.h); x.globalAlpha = 1;
    });
  }

  /* Grashalme an der Vorderkante einer Bahn, vom Wind gebogen */
  function halmeZeichnen(w, x, i, t, u) {
    const l = w.halmListe[i]; if (!l) return;
    const b = BAHNEN[i], wind = u.wind || 0, y = b.y + 3 * b.s;
    x.strokeStyle = ["#34442a", "#2b3923", "#222e1c"][i]; x.lineWidth = 1.2 * b.s + 0.3;
    x.beginPath();
    l.forEach(h => {
      const beug = Math.max(-1, Math.min(1, wind / 140)) * h.h * 0.55 + Math.sin(t * 2.2 + h.ph + h.x * 0.02) * (1.2 + Math.abs(wind) / 70) * b.s;
      for (let k = 0; k < h.n; k++) {
        const bx = h.x + (k - h.n / 2) * 2.4 * b.s, hh = h.h * (0.7 + 0.3 * ((k * 7) % 3) / 2);
        x.moveTo(bx, y); x.quadraticCurveTo(bx + beug * 0.3, y - hh * 0.6, bx + beug + (k - 1) * b.s, y - hh);
      }
    });
    x.stroke();
  }

  function vorneZeichnen(w, x, t, dt, u) {
    const wind = u.wind || 0;
    // vorderes Nebelband (dünn)
    const n = w.nebel[2];
    if (n) { n.x += (wind * 0.16 + 6) * n.v * dt; if (n.x > W) n.x -= n.b.w; if (n.x < -n.b.w) n.x += n.b.w; x.globalAlpha = n.a * 0.6; x.drawImage(n.b.c, n.x, 310, n.b.w, n.b.h); x.drawImage(n.b.c, n.x - n.b.w, 310, n.b.w, n.b.h); x.drawImage(n.b.c, n.x + n.b.w, 310, n.b.w, n.b.h); x.globalAlpha = 1; }
    // Blätter, Halme, Staubflusen im Wind
    windTeile(w, x, dt, u);
    // Regen
    if (w.regen.length) {
      const anz = u.ruhig ? 25 : w.regen.length, schraeg = wind * 0.9;
      x.strokeStyle = "rgba(200,196,190,.28)"; x.lineWidth = 1; x.beginPath();
      for (let i = 0; i < anz; i++) {
        const d = w.regen[i]; d.y += d.v * dt; d.x += schraeg * dt;
        if (d.y > H) { d.y = -10; d.x = Math.random() * (W + 80) - 40; }
        if (d.x > W + 40) d.x -= W + 80; if (d.x < -40) d.x += W + 80;
        const k = d.l / d.v; x.moveTo(d.x, d.y); x.lineTo(d.x - schraeg * k, d.y - d.l);
      }
      x.stroke();
    }
    // Tropfen von der Höhlendecke
    if (w.wetter === "tropfen") w.tropfen.forEach(d => {
      d.t += dt; const k = (d.t % d.p) / d.p;
      if (k < 0.15) { x.fillStyle = "rgba(200,220,210," + (k / 0.15 * 0.6).toFixed(2) + ")"; x.beginPath(); x.ellipse(d.x, d.y, 1.4, 1.4 + k * 8, 0, 0, PI2); x.fill(); }
      else if (k < 0.55) { const f = (k - 0.15) / 0.4, yy = d.y + f * f * 260; x.fillStyle = "rgba(200,220,210,.55)"; x.fillRect(d.x - 0.7, yy, 1.4, 4); }
      else if (k < 0.7) { const f = (k - 0.55) / 0.15; x.strokeStyle = "rgba(200,220,210," + (0.4 * (1 - f)).toFixed(2) + ")"; x.lineWidth = 0.8; x.beginPath(); x.ellipse(d.x, d.y + 262, 3 + f * 8, 1 + f * 2, 0, 0, PI2); x.stroke(); }
    });
    // Licht der Tageszeit: sanfter Übergang zwischen den Wellen
    const ziel = u.welle ? 1 : 0; w.lk += (ziel - w.lk) * Math.min(1, dt * 0.8);
    const a = w.licht[0], b = w.licht[1], m = (p, q) => p + (q - p) * w.lk;
    const farbe = (p, q) => "rgba(" + Math.round(m(p[0], q[0])) + "," + Math.round(m(p[1], q[1])) + "," + Math.round(m(p[2], q[2])) + "," + m(p[3], q[3]).toFixed(3) + ")";
    const g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, farbe(a.o, b.o)); g.addColorStop(1, farbe(a.u, b.u));
    x.fillStyle = g; x.fillRect(0, 0, W, H);
    // Blitz erhellt kurz die Szene
    if (w.blitz > 0) { x.fillStyle = "rgba(235,232,225," + (w.blitz * 0.22).toFixed(3) + ")"; x.fillRect(0, 0, W, H); w.blitz = Math.max(0, w.blitz - dt * 3.2); }
    x.drawImage(vignetteHolen(), 0, 0, W, H);
  }

  /* fliegende Blätter (draußen) oder Staubflusen (unter der Erde) zeigen Stärke und Richtung des Windes */
  function windTeile(w, x, dt, u) {
    const wind = u.wind || 0, st = Math.abs(wind), soll = Math.round((u.ruhig ? 0.4 : 1) * Math.min(18, 2 + st / 9));
    const teile = w.teile;
    while (teile.length < soll) {
      const art = w.draussen ? (Math.random() < 0.65 ? "blatt" : "halm") : (Math.random() < 0.7 ? "staub" : "flocke");
      teile.push({ art, x: wind >= 0 ? -10 - Math.random() * 60 : W + 10 + Math.random() * 60, y: 80 + Math.random() * 380, r: Math.random() * 6, vr: (Math.random() - 0.5) * 6, ph: Math.random() * 6, v: 0.7 + Math.random() * 0.6,
        farbe: art === "blatt" ? ["#7a5a2a", "#8a6a2e", "#5a6a2a", "#9b3a2f", "#6b4a20"][Math.floor(Math.random() * 5)] : art === "halm" ? "#5a6a3a" : "rgba(200,190,170,.5)", gr: 2 + Math.random() * 2.2 });
    }
    for (let i = teile.length - 1; i >= 0; i--) {
      const p = teile[i];
      p.ph += dt; p.r += p.vr * dt * (0.5 + st / 120);
      p.x += (wind * 1.1 + Math.sign(wind || 1) * 14) * p.v * dt;
      p.y += (Math.sin(p.ph * 2.3) * 16 + (p.art === "staub" ? -2 : 8)) * dt;
      if (p.x < -80 || p.x > W + 80 || p.y > H + 10 || p.y < -10) { if (teile.length > soll) { teile.splice(i, 1); continue; } p.x = wind >= 0 ? -10 : W + 10; p.y = 80 + Math.random() * 380; }
      x.save(); x.translate(p.x, p.y); x.rotate(p.r);
      if (p.art === "blatt") { x.fillStyle = p.farbe; x.beginPath(); x.ellipse(0, 0, p.gr * 1.3, p.gr * 0.55 * Math.abs(Math.cos(p.ph * 3)) + 0.4, 0, 0, PI2); x.fill(); }
      else if (p.art === "halm") { x.strokeStyle = p.farbe; x.lineWidth = 0.9; x.beginPath(); x.moveTo(-p.gr * 2, 0); x.quadraticCurveTo(0, -1.5, p.gr * 2, 0.5); x.stroke(); }
      else { x.fillStyle = p.farbe; x.beginPath(); x.arc(0, 0, p.art === "flocke" ? 1.6 : 0.9, 0, PI2); x.fill(); }
      x.restore();
    }
  }

  window.WALDLAUF_WELTEN = { bauen, namen: Object.keys(THEMEN) };
})();
