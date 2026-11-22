/* =====================================================================
   EZEKIELS LANGE NACHT – PANORAMA (nur auf breiten Bildschirmen)
   Von oben gesehen: was rund um das Haus der Nacht liegt. Gassen mit
   Pfützen, Dächer, Wachen mit Laternen, Katzen, Ratten … je Nacht
   passend: Phandalin, die Schlossruine, der Wald um Donnerbaum,
   Gracklstughs Schmiedegassen, das Unterreich, die Lava des Drachen.
   Dazu kleine Geheimnisse: der Rote-Mantel auf der Wäscheleine, ein
   schlafender Zwerg mit „Zzz“, Venomfangs Schatten, eine Schöpfkelle …
   Wird von diebesnacht.js benutzt (window.DIEBESNACHT_PANO).
   ===================================================================== */
(function () {
  "use strict";
  const PI2 = Math.PI * 2;
  const zuf = seed => { let s = Math.max(1, Math.floor(seed) % 2147483646); return () => (s = (s * 16807) % 2147483647) / 2147483647; };
  const takt = (t, periode, dauer, versatz) => { const z = (t + (versatz || 0)) % periode; return z < dauer ? z / dauer : -1; };

  /* ---------- statische Ebene einmal malen und zwischenspeichern ---------- */
  const cache = { key: "", c: null };
  function statisch(x, info, art, maler) {
    const key = art + ":" + Math.round(info.L) + ":" + Math.round(info.R) + ":" + Math.round(info.oben) + ":" + Math.round(info.unten) + ":" + info.k.toFixed(2);
    const fx = Math.min(1.5, window.devicePixelRatio || 1) * info.k;
    if (cache.key !== key) {
      const bw = info.L + info.W + info.R, bh = info.unten - info.oben;
      const c = document.createElement("canvas"); c.width = Math.max(1, Math.round(bw * fx)); c.height = Math.max(1, Math.round(bh * fx));
      const y = c.getContext("2d"); y.setTransform(fx, 0, 0, fx, info.L * fx, -info.oben * fx);
      maler(y, info, zuf(art.length * 131 + 7));
      cache.key = key; cache.c = c;
    }
    x.drawImage(cache.c, -info.L, info.oben, info.L + info.W + info.R, info.unten - info.oben);
  }
  function seiten(info, f) { f(-1, -info.L, 0); f(1, info.W, info.W + info.R); }

  /* ---------- Bausteine (von oben) ---------- */
  function pflaster(y, a, b, o, u, r, farben, gr) {
    for (let yy = o; yy < u; yy += gr * 0.8) for (let xx = a + ((yy / gr) % 2) * gr * 0.5; xx < b; xx += gr) {
      y.fillStyle = farben[Math.floor(r() * farben.length)];
      y.beginPath(); y.ellipse(xx + r() * 2, yy + r() * 2, gr * 0.44, gr * 0.36, r(), 0, PI2); y.fill();
    }
  }
  function dach(y, x0, y0, w, h, farbe, first) {
    y.fillStyle = farbe; y.fillRect(x0, y0, w, h);
    y.strokeStyle = "rgba(0,0,0,.35)"; y.lineWidth = 1;
    for (let k = 4; k < h; k += 6) { y.beginPath(); y.moveTo(x0, y0 + k); y.lineTo(x0 + w, y0 + k); y.stroke(); }
    for (let k = 0; k < h; k += 6) for (let j = (k / 6 % 2) * 5; j < w; j += 10) { y.beginPath(); y.moveTo(x0 + j, y0 + k); y.lineTo(x0 + j, y0 + k + 6); y.stroke(); }
    y.fillStyle = first || "rgba(255,255,255,.05)"; y.fillRect(x0, y0 + h / 2 - 1.5, w, 3);
    y.fillStyle = "rgba(0,0,0,.35)"; y.fillRect(x0, y0 + h / 2 + 1.5, w, h / 2 - 1.5);
  }
  function fass(y, px, py, rr) { y.fillStyle = "#3a2616"; y.beginPath(); y.arc(px, py, rr, 0, PI2); y.fill(); y.strokeStyle = "#1c120a"; y.lineWidth = 1.4; y.beginPath(); y.arc(px, py, rr * 0.75, 0, PI2); y.stroke(); y.beginPath(); y.arc(px, py, rr * 0.35, 0, PI2); y.stroke(); }
  function baumkrone(y, px, py, rr, farbe, r) {
    for (let k = 0; k < 9; k++) { const a = k / 9 * PI2, d = rr * 0.45; y.fillStyle = farbe[k % farbe.length]; y.beginPath(); y.arc(px + Math.cos(a) * d * (0.7 + r() * 0.5), py + Math.sin(a) * d * (0.7 + r() * 0.5), rr * (0.45 + r() * 0.2), 0, PI2); y.fill(); }
    y.fillStyle = "rgba(200,220,180,.05)"; y.beginPath(); y.arc(px - rr * 0.25, py - rr * 0.25, rr * 0.5, 0, PI2); y.fill();
  }
  function glow(x, px, py, rad, farbe) {
    const g = x.createRadialGradient(px, py, 0, px, py, rad); g.addColorStop(0, farbe); g.addColorStop(1, farbe.replace(/[\d.]+\)$/, "0)"));
    x.fillStyle = g; x.fillRect(px - rad, py - rad, rad * 2, rad * 2);
  }
  /* Wache mit Laterne von oben, läuft eine Strecke ab, Lichtkegel nach vorn */
  function wache(x, ax, ay, bx, by, t, periode, farbe, licht) {
    const k = (t % periode) / periode, hin = k < 0.5, f = hin ? k * 2 : 2 - k * 2, px = ax + (bx - ax) * f, py = ay + (by - ay) * f;
    const dir = Math.atan2((by - ay) * (hin ? 1 : -1), (bx - ax) * (hin ? 1 : -1));
    const g = x.createRadialGradient(px, py, 2, px, py, 70); g.addColorStop(0, licht || "rgba(255,190,100,.32)"); g.addColorStop(1, "rgba(255,190,100,0)");
    x.fillStyle = g; x.beginPath(); x.moveTo(px, py); x.arc(px, py, 70, dir - 0.5, dir + 0.5); x.closePath(); x.fill();
    x.fillStyle = farbe || "#1a1720"; x.beginPath(); x.ellipse(px, py, 7, 9, dir, 0, PI2); x.fill();
    x.fillStyle = "#2a2630"; x.beginPath(); x.arc(px, py, 4.5, 0, PI2); x.fill();
    x.fillStyle = "rgba(255,210,130,.9)"; x.beginPath(); x.arc(px + Math.cos(dir) * 8, py + Math.sin(dir) * 8, 1.8, 0, PI2); x.fill();
  }
  function katze(x, px, py, t, farbe) {
    x.fillStyle = farbe || "#0c0b0e"; x.beginPath(); x.ellipse(px, py, 7, 5, 0.3, 0, PI2); x.fill(); x.beginPath(); x.arc(px + 6, py - 3, 3.5, 0, PI2); x.fill();
    x.strokeStyle = x.fillStyle; x.lineWidth = 1.6; x.beginPath(); x.moveTo(px - 6, py + 2); x.quadraticCurveTo(px - 14, py + 4 + Math.sin(t * 2) * 3, px - 12, py - 4 + Math.sin(t * 2.4) * 4); x.stroke();
    const z = (t * 0.5) % 5; if (z < 4.85) { x.fillStyle = "rgba(200,240,120,.9)"; x.fillRect(px + 6, py - 4, 1.2, 1.2); x.fillRect(px + 8, py - 3, 1.2, 1.2); }
  }
  function ratte(x, info, t, periode, versatz, a0, b0, y0) {
    const k = takt(t, periode, 2.4, versatz); if (k < 0) return;
    const px = a0 + (b0 - a0) * k, py = y0 + Math.sin(k * 30) * 1.5;
    x.fillStyle = "#16120f"; x.beginPath(); x.ellipse(px, py, 5, 2.8, 0, 0, PI2); x.fill();
    x.strokeStyle = "#16120f"; x.lineWidth = 0.8; x.beginPath(); x.moveTo(px - 5 * Math.sign(b0 - a0), py); x.quadraticCurveTo(px - 10 * Math.sign(b0 - a0), py + 3, px - 14 * Math.sign(b0 - a0), py); x.stroke();
  }
  function rauchVonOben(x, px, py, t, farbe) {
    for (let i = 0; i < 6; i++) { const k = ((t * 0.25 + i / 6) % 1), rr = 4 + k * 22; x.fillStyle = "rgba(" + farbe + "," + (0.16 * (1 - k)).toFixed(3) + ")"; x.beginPath(); x.arc(px + k * 30 + Math.sin(t + i) * 3, py - k * 8, rr, 0, PI2); x.fill(); }
  }
  function funken(x, info, n, farbe, seed) {
    const r = zuf(seed), t = info.t;
    for (let i = 0; i < n; i++) {
      const s = i % 2 ? -1 : 1, bx = s < 0 ? -info.L * (0.05 + r() * 0.9) : info.W + info.R * (0.05 + r() * 0.9), by = info.oben + (info.unten - info.oben) * r(), ph = r() * 6.3;
      const a = 0.2 + 0.8 * Math.max(0, Math.sin(t * (1 + r()) + ph));
      x.globalAlpha = a; x.fillStyle = farbe; x.beginPath(); x.arc(bx + Math.sin(t * 0.4 + ph) * 10, by + Math.cos(t * 0.3 + ph) * 8, 1.3, 0, PI2); x.fill();
    }
    x.globalAlpha = 1;
  }

  /* ---------- Nächte ---------- */
  const NACHT = {
    /* Phandalin: Gassen mit Kopfsteinpflaster, Dächer, Brunnen, Stall */
    holz: {
      fest(y, info, r) {
        seiten(info, (s, a, b) => {
          y.fillStyle = "#17140f"; y.fillRect(a, info.oben, b - a, info.unten - info.oben);
          pflaster(y, a, b, info.oben, info.unten, r, ["#1d1914", "#211c16", "#191511", "#241f18"], 13);
          // Pfützen
          for (let i = 0; i < 4; i++) { const px = a + (b - a) * r(), py = info.oben + (info.unten - info.oben) * r(); y.fillStyle = "rgba(40,48,60,.55)"; y.beginPath(); y.ellipse(px, py, 14 + r() * 16, 6 + r() * 6, r(), 0, PI2); y.fill(); y.fillStyle = "rgba(220,230,240,.08)"; y.beginPath(); y.ellipse(px - 4, py - 2, 5, 2, 0, 0, PI2); y.fill(); }
          // Häuserdächer am äußeren Rand
          const aus = s < 0 ? a : b - 130;
          for (let yy = info.oben + 10; yy < info.unten - 60; yy += 150) dach(y, aus + (s < 0 ? 0 : 10), yy, 120, 120, ["#3a2418", "#2e2a24", "#40291b"][Math.floor(r() * 3)], "rgba(255,220,180,.05)");
        });
        // Brunnen (links), Stall mit Heu (rechts)
        const bx = -info.L * 0.45, by = info.oben + (info.unten - info.oben) * 0.6;
        y.fillStyle = "#3a3632"; y.beginPath(); y.arc(bx, by, 20, 0, PI2); y.fill(); y.fillStyle = "#0a0c10"; y.beginPath(); y.arc(bx, by, 13, 0, PI2); y.fill(); y.fillStyle = "#2a1a0e"; y.fillRect(bx - 24, by - 2, 48, 4);
        const sx = info.W + info.R * 0.4, sy = info.oben + (info.unten - info.oben) * 0.3;
        y.fillStyle = "#3a2a16"; y.fillRect(sx - 30, sy - 22, 60, 44); y.fillStyle = "#8a7038"; for (let i = 0; i < 40; i++) { y.fillRect(sx - 26 + r() * 52, sy - 18 + r() * 36, 4 + r() * 4, 1); }
        // Karren mit Fässern
        const kx = -info.L * 0.3, ky = info.oben + (info.unten - info.oben) * 0.25;
        y.fillStyle = "#3a2616"; y.fillRect(kx - 16, ky - 26, 32, 50); y.fillStyle = "#1c120a"; y.fillRect(kx - 20, ky - 14, 4, 12); y.fillRect(kx + 16, ky - 14, 4, 12); y.fillRect(kx - 20, ky + 8, 4, 12); y.fillRect(kx + 16, ky + 8, 4, 12);
        fass(y, kx - 6, ky - 12, 7); fass(y, kx + 6, ky + 4, 7); fass(y, kx - 4, ky + 14, 6);
        // Wäscheleine mit rotem Mantel (Rotmäntel!)
        const wx = info.W + info.R * 0.25, wy = info.oben + (info.unten - info.oben) * 0.72;
        y.strokeStyle = "#5a4a38"; y.lineWidth = 0.8; y.beginPath(); y.moveTo(wx - 40, wy); y.lineTo(wx + 40, wy + 6); y.stroke();
        y.fillStyle = "#7a2420"; y.fillRect(wx - 10, wy - 2, 16, 20); y.fillStyle = "#c8c0a8"; y.fillRect(wx + 14, wy, 10, 12);
      },
      bewegt(x, info) {
        const t = info.t, H = info.unten - info.oben;
        // Mondlicht und Laternen
        [[-info.L * 0.2, 0.42], [info.W + info.R * 0.15, 0.55], [-info.L * 0.7, 0.85]].forEach(([px, f], i) => { const fl = 0.75 + 0.25 * Math.sin(t * 6 + i * 2) * Math.sin(t * 2.7); glow(x, px, info.oben + H * f, 55, "rgba(255,180,90," + (0.28 * fl).toFixed(3) + ")"); x.fillStyle = "rgba(255,210,140,.95)"; x.beginPath(); x.arc(px, info.oben + H * f, 2.4, 0, PI2); x.fill(); });
        wache(x, -info.L * 0.85, info.oben + H * 0.15, -info.L * 0.15, info.oben + H * 0.5, t, 24);
        wache(x, info.W + info.R * 0.7, info.oben + H * 0.9, info.W + info.R * 0.6, info.oben + H * 0.1, t + 7, 30);
        katze(x, info.W + info.R * 0.82, info.oben + 40, t);
        ratte(x, info, t, 11, 3, -info.L * 0.05, -info.L * 0.6, info.oben + H * 0.95);
        rauchVonOben(x, -info.L * 0.85, info.oben + 70, t, "120,110,110");
        // Zwerg schläft am Fass – „Zzz“
        const zx = -info.L * 0.3, zy = info.oben + H * 0.25 + 40;
        x.fillStyle = "#2a2a30"; x.beginPath(); x.ellipse(zx + 24, zy, 8, 10, 0.4, 0, PI2); x.fill(); x.fillStyle = "#5a4030"; x.beginPath(); x.arc(zx + 24, zy - 6, 5, 0, PI2); x.fill();
        x.fillStyle = "rgba(235,226,204,.7)"; x.font = "italic 8px serif"; const z = (t * 0.7) % 3; x.globalAlpha = Math.max(0, 1 - z / 3); x.fillText("Zzz", zx + 32 + z * 4, zy - 10 - z * 8); x.globalAlpha = 1;
        // Glühwürmchen / Mondstaub
        funken(x, info, 18, "rgba(255,230,170,1)", 3);
      }
    },
    /* Schlossruine (Tresendar): moosige Steinplatten, Säulenstümpfe, Efeu */
    stein: {
      fest(y, info, r) {
        seiten(info, (s, a, b) => {
          y.fillStyle = "#16161a"; y.fillRect(a, info.oben, b - a, info.unten - info.oben);
          for (let yy = info.oben; yy < info.unten; yy += 26) for (let xx = a + ((yy / 26) % 2) * 18; xx < b; xx += 36) { y.fillStyle = ["#23232a", "#1f1f25", "#28272c"][Math.floor(r() * 3)]; y.fillRect(xx + 1, yy + 1, 34, 24); if (r() < 0.3) { y.fillStyle = "rgba(70,100,60,.35)"; y.beginPath(); y.arc(xx + r() * 34, yy + r() * 24, 4 + r() * 8, 0, PI2); y.fill(); } }
          // Säulenstümpfe
          for (let i = 0; i < 3; i++) { const px = a + (b - a) * (0.2 + i * 0.3), py = info.oben + (info.unten - info.oben) * (0.15 + r() * 0.7); y.fillStyle = "#2e2d33"; y.beginPath(); y.arc(px, py, 14, 0, PI2); y.fill(); y.fillStyle = "#3a3940"; y.beginPath(); y.arc(px - 3, py - 3, 9, 0, PI2); y.fill(); }
          // Efeu
          y.strokeStyle = "#1e2e1a"; y.lineWidth = 2; for (let i = 0; i < 6; i++) { y.beginPath(); let px = a + (b - a) * r(), py = info.oben; y.moveTo(px, py); for (let k = 0; k < 8; k++) { px += (r() - 0.5) * 20; py += 20 + r() * 20; y.lineTo(px, py); } y.stroke(); }
        });
      },
      bewegt(x, info) {
        const t = info.t, H = info.unten - info.oben;
        [[-info.L * 0.5, 0.3], [info.W + info.R * 0.5, 0.7]].forEach(([px, f], i) => { const fl = 0.7 + 0.3 * Math.sin(t * 7 + i) * Math.sin(t * 3.3); glow(x, px, info.oben + H * f, 70, "rgba(255,150,70," + (0.3 * fl).toFixed(3) + ")"); x.fillStyle = "#2a1a10"; x.fillRect(px - 2, info.oben + H * f - 2, 4, 4); x.fillStyle = "rgba(255,190,90,.9)"; x.beginPath(); x.arc(px, info.oben + H * f - 3, 2.5 + Math.sin(t * 9) * 0.5, 0, PI2); x.fill(); });
        wache(x, info.W + info.R * 0.2, info.oben + H * 0.2, info.W + info.R * 0.8, info.oben + H * 0.25, t, 20, "#3a1414", "rgba(255,170,90,.28)");
        ratte(x, info, t, 9, 1, -info.L * 0.9, -info.L * 0.1, info.oben + H * 0.8);
        ratte(x, info, t, 13, 6, info.W + info.R * 0.1, info.W + info.R * 0.9, info.oben + H * 0.55);
        // Glassplitter von Glasstabs Stab glitzern
        for (let i = 0; i < 5; i++) { const g = Math.max(0, Math.sin(t * 2.5 + i * 1.3)); x.fillStyle = "rgba(220,250,255," + (0.2 + 0.8 * g).toFixed(2) + ")"; x.fillRect(-info.L * 0.25 + i * 6, info.oben + H * 0.62 + (i % 2) * 4, 1.6, 1.6); }
        funken(x, info, 14, "rgba(200,240,140,1)", 5);
      }
    },
    /* Donnerbaum: Waldkronen von oben, Nebel, Venomfangs Schatten */
    fels: {
      fest(y, info, r) {
        seiten(info, (s, a, b) => {
          y.fillStyle = "#101510"; y.fillRect(a, info.oben, b - a, info.unten - info.oben);
          for (let i = 0; i < 60; i++) { const px = a + (b - a) * r(), py = info.oben + (info.unten - info.oben) * r(); y.fillStyle = "rgba(20,28,18,.7)"; y.beginPath(); y.arc(px, py, 6 + r() * 10, 0, PI2); y.fill(); }
          for (let i = 0; i < 9; i++) baumkrone(y, a + (b - a) * r(), info.oben + (info.unten - info.oben) * r(), 26 + r() * 22, ["#16241a", "#1a2a1c", "#122016", "#1d2e1e"], r);
          // Felsbrocken
          for (let i = 0; i < 4; i++) { const px = a + (b - a) * r(), py = info.oben + (info.unten - info.oben) * r(); y.fillStyle = "#2a2a28"; y.beginPath(); y.ellipse(px, py, 12 + r() * 10, 9 + r() * 6, r(), 0, PI2); y.fill(); }
        });
      },
      bewegt(x, info) {
        const t = info.t, H = info.unten - info.oben;
        // Nebelschwaden ziehen
        for (let i = 0; i < 5; i++) { const s = i % 2 ? -1 : 1, px = (s < 0 ? -info.L : info.W) + (((t * 8 + i * 90) % (s < 0 ? info.L : info.R)) || 0), py = info.oben + H * (0.15 + i * 0.17); glow(x, px, py, 70, "rgba(160,170,160,.10)"); }
        // Venomfangs Schatten gleitet über den Wald (selten)
        const vf = takt(t, 29, 6, 5);
        if (vf >= 0) {
          const s = Math.floor(t / 29) % 2 ? 1 : -1, px = s < 0 ? -info.L * (1 - vf) : info.W + info.R * vf, py = info.oben + H * (0.2 + vf * 0.6);
          x.save(); x.translate(px, py); x.rotate(0.9 * s); x.fillStyle = "rgba(0,0,0,.45)";
          x.beginPath(); x.moveTo(0, -40); x.quadraticCurveTo(6, -10, 4, 30); x.lineTo(0, 50); x.lineTo(-4, 30); x.quadraticCurveTo(-6, -10, 0, -40); x.fill();
          const fl = Math.sin(t * 5) * 0.2; x.beginPath(); x.moveTo(0, -6); x.quadraticCurveTo(40, -24 + fl * 30, 70, 6); x.lineTo(4, 10); x.moveTo(0, -6); x.quadraticCurveTo(-40, -24 + fl * 30, -70, 6); x.lineTo(-4, 10); x.fill(); x.restore();
        }
        // Eule kreist
        const ea = t * 0.3; x.fillStyle = "rgba(0,0,0,.4)"; x.beginPath(); x.ellipse(-info.L * 0.5 + Math.cos(ea) * 60, info.oben + H * 0.5 + Math.sin(ea) * 40, 9, 4, ea, 0, PI2); x.fill();
        funken(x, info, 22, "rgba(200,240,140,1)", 8);
      }
    },
    /* Gracklstugh: Gitterroste, Lavarinnen, Schmiedeglut, Duergar-Streife */
    schmiede: {
      fest(y, info, r) {
        seiten(info, (s, a, b) => {
          y.fillStyle = "#141214"; y.fillRect(a, info.oben, b - a, info.unten - info.oben);
          for (let yy = info.oben; yy < info.unten; yy += 30) for (let xx = a; xx < b; xx += 30) { y.fillStyle = ["#1e1b1e", "#211e20", "#1a181a"][Math.floor(r() * 3)]; y.fillRect(xx + 1, yy + 1, 28, 28); }
          // Lavarinne
          const lx = s < 0 ? a + (b - a) * 0.6 : a + (b - a) * 0.4;
          const g = y.createLinearGradient(lx - 10, 0, lx + 10, 0); g.addColorStop(0, "#2a0c04"); g.addColorStop(0.5, "#c84a14"); g.addColorStop(1, "#2a0c04"); y.fillStyle = g; y.fillRect(lx - 10, info.oben, 20, info.unten - info.oben);
          // Gitterroste
          for (let i = 0; i < 3; i++) { const px = a + (b - a) * (0.15 + r() * 0.7), py = info.oben + (info.unten - info.oben) * r(); y.fillStyle = "#0a0808"; y.fillRect(px - 16, py - 16, 32, 32); y.strokeStyle = "#3a3230"; y.lineWidth = 2; for (let k = -12; k <= 12; k += 6) { y.beginPath(); y.moveTo(px + k, py - 16); y.lineTo(px + k, py + 16); y.stroke(); } }
          // Amboss und Werkbank
          const ax = a + (b - a) * (s < 0 ? 0.25 : 0.75), ay = info.oben + (info.unten - info.oben) * 0.45; y.fillStyle = "#2e2c30"; y.fillRect(ax - 12, ay - 6, 24, 12); y.fillRect(ax + 12, ay - 3, 8, 6);
        });
        // Marktstand mit Schöpfkellen – eine fehlt
        const mx = info.W + info.R * 0.25, my = info.oben + (info.unten - info.oben) * 0.82;
        y.fillStyle = "#3a1e18"; y.fillRect(mx - 30, my - 18, 60, 36); y.strokeStyle = "#8a8478"; y.lineWidth = 1.5; [-18, -6, 18].forEach(d => { y.beginPath(); y.moveTo(mx + d, my - 10); y.lineTo(mx + d, my + 4); y.stroke(); y.beginPath(); y.arc(mx + d, my + 7, 3.5, 0, PI2); y.stroke(); });
      },
      bewegt(x, info) {
        const t = info.t, H = info.unten - info.oben;
        // Lava pulsiert in den Rinnen
        seiten(info, (s, a, b) => { const lx = s < 0 ? a + (b - a) * 0.6 : a + (b - a) * 0.4; for (let i = 0; i < 6; i++) { const yy = info.oben + ((t * 22 + i * H / 6) % H); glow(x, lx, yy, 26, "rgba(255,140,50,.25)"); } });
        // Schmiedeglut und Funken
        seiten(info, (s, a, b) => { const ax = a + (b - a) * (s < 0 ? 0.25 : 0.75), ay = info.oben + H * 0.45; const h = takt(t + s, 1.8, 0.35, 0); glow(x, ax, ay, 60, "rgba(255,150,60," + (0.18 + (h >= 0 ? 0.25 * (1 - h) : 0)).toFixed(3) + ")"); if (h >= 0) for (let i = 0; i < 10; i++) { const w = i / 10 * PI2; x.fillStyle = "rgba(255,210,120," + (1 - h).toFixed(2) + ")"; x.fillRect(ax + Math.cos(w) * h * 26, ay + Math.sin(w) * h * 26, 1.5, 1.5); } });
        wache(x, -info.L * 0.9, info.oben + H * 0.8, -info.L * 0.2, info.oben + H * 0.1, t, 26, "#2a2a30", "rgba(255,150,70,.3)");
        wache(x, info.W + info.R * 0.85, info.oben + H * 0.1, info.W + info.R * 0.6, info.oben + H * 0.6, t + 9, 22, "#2a2a30", "rgba(255,150,70,.3)");
        funken(x, info, 26, "rgba(255,160,70,1)", 13);
      }
    },
    /* Unterreich: Pilze, Netze, Abgrund, Feenfeuer */
    unterreich: {
      fest(y, info, r) {
        seiten(info, (s, a, b) => {
          y.fillStyle = "#0f0e14"; y.fillRect(a, info.oben, b - a, info.unten - info.oben);
          for (let i = 0; i < 50; i++) { y.fillStyle = "rgba(26,24,34,.8)"; y.beginPath(); y.ellipse(a + (b - a) * r(), info.oben + (info.unten - info.oben) * r(), 10 + r() * 18, 6 + r() * 12, r() * 3, 0, PI2); y.fill(); }
          // Abgrund
          const ax = s < 0 ? a + (b - a) * 0.3 : a + (b - a) * 0.7, ay = info.oben + (info.unten - info.oben) * 0.5; const g = y.createRadialGradient(ax, ay, 5, ax, ay, 80); g.addColorStop(0, "#000"); g.addColorStop(1, "rgba(0,0,0,0)"); y.fillStyle = g; y.beginPath(); y.ellipse(ax, ay, 80, 50, 0.3, 0, PI2); y.fill();
          // Netze
          y.strokeStyle = "rgba(210,210,230,.14)"; y.lineWidth = 0.8; const nx = a + (b - a) * 0.5, ny = info.oben + 60; for (let k = 0; k < 10; k++) { const w = k / 10 * PI2; y.beginPath(); y.moveTo(nx, ny); y.lineTo(nx + Math.cos(w) * 70, ny + Math.sin(w) * 70); y.stroke(); } for (let ring = 1; ring < 6; ring++) { y.beginPath(); y.arc(nx, ny, ring * 12, 0, PI2); y.stroke(); }
        });
      },
      bewegt(x, info) {
        const t = info.t, H = info.unten - info.oben, r = zuf(5);
        for (let i = 0; i < 16; i++) { const s = i % 2 ? -1 : 1, px = s < 0 ? -info.L * (0.05 + r() * 0.9) : info.W + info.R * (0.05 + r() * 0.9), py = info.oben + H * r(), a = 0.5 + 0.5 * Math.sin(t * 1.3 + i); glow(x, px, py, 18, "rgba(150,255,200," + (0.2 * a).toFixed(3) + ")"); x.fillStyle = "rgba(170,255,210," + (0.5 + 0.4 * a).toFixed(2) + ")"; x.beginPath(); x.arc(px, py, 3.5, 0, PI2); x.fill(); }
        // Feenfeuer der Drow – lila Lichter treiben
        for (let i = 0; i < 6; i++) { const px = -info.L * 0.6 + Math.sin(t * 0.3 + i) * 60, py = info.oben + H * (0.1 + i * 0.15) + Math.cos(t * 0.4 + i) * 10; glow(x, px, py, 20, "rgba(200,120,255,.3)"); }
        // Spinne krabbelt über das Netz
        const a = t * 0.5; x.fillStyle = "#0a090c"; x.beginPath(); x.ellipse(-info.L * 0.5 + Math.cos(a) * 40, info.oben + 60 + Math.sin(a) * 40, 4, 5, 0, 0, PI2); x.fill();
        funken(x, info, 18, "rgba(200,160,255,1)", 21);
      }
    },
    /* Themberchauds Halle: Lavaströme mit Kruste, glänzendes Gold, ein Schwanz zuckt */
    lava: {
      fest(y, info, r) {
        seiten(info, (s, a, b) => {
          y.fillStyle = "#1a0e0a"; y.fillRect(a, info.oben, b - a, info.unten - info.oben);
          for (let i = 0; i < 3; i++) { y.strokeStyle = "#7a2a0e"; y.lineWidth = 16; y.beginPath(); let px = a + (b - a) * r(), py = info.oben; y.moveTo(px, py); for (let k = 0; k < 10; k++) { px += (r() - 0.5) * 40; py += (info.unten - info.oben) / 10; y.lineTo(px, py); } y.stroke(); y.strokeStyle = "#e05a18"; y.lineWidth = 6; y.stroke(); }
          for (let i = 0; i < 4; i++) { const px = a + (b - a) * r(), py = info.oben + (info.unten - info.oben) * r(); y.fillStyle = "#6a4a16"; y.beginPath(); y.ellipse(px, py, 30, 20, r(), 0, PI2); y.fill(); y.fillStyle = "#8a6620"; y.beginPath(); y.ellipse(px - 4, py - 3, 20, 12, r(), 0, PI2); y.fill(); }
        });
      },
      bewegt(x, info) {
        const t = info.t, H = info.unten - info.oben, r = zuf(9);
        for (let i = 0; i < 30; i++) { const s = i % 2 ? -1 : 1, px = s < 0 ? -info.L * r() : info.W + info.R * r(), py = info.oben + H * r(), g = Math.max(0, Math.sin(t * 2.2 + i * 1.7)); x.fillStyle = "rgba(255,230,150," + (g * 0.9).toFixed(2) + ")"; x.fillRect(px - g, py, 1 + g * 2, 1); x.fillRect(px, py - g, 1, 1 + g * 2); }
        // der Schwanz des Drachen zuckt durchs Bild
        const sw = takt(t, 23, 4, 6);
        if (sw >= 0) { const px = info.W + info.R * (1.05 - Math.sin(sw * Math.PI) * 0.4), py = info.oben + H * 0.35; x.strokeStyle = "rgba(90,20,10,.95)"; x.lineWidth = 16; x.lineCap = "round"; x.beginPath(); x.moveTo(info.W + info.R + 20, py); x.quadraticCurveTo(px + 40, py - 40 * Math.sin(t * 3), px, py + 20); x.stroke(); x.lineCap = "butt"; }
        seiten(info, (s, a, b) => { for (let i = 0; i < 4; i++) glow(x, a + (b - a) * (0.2 + i * 0.2), info.oben + H * ((i * 0.27 + t * 0.03) % 1), 40, "rgba(255,120,40,.18)"); });
        funken(x, info, 30, "rgba(255,170,80,1)", 31);
      }
    }
  };

  window.DIEBESNACHT_PANO = function (x, info, boden) {
    const n = NACHT[boden] || NACHT.holz;
    statisch(x, info, boden || "holz", n.fest);
    n.bewegt(x, info);
    // Mondlicht-Schleier von oben links
    const g = x.createLinearGradient(-info.L, info.oben, 0, info.unten); g.addColorStop(0, "rgba(200,190,230,.05)"); g.addColorStop(1, "rgba(0,0,0,0)");
    x.fillStyle = g; x.fillRect(-info.L, info.oben, info.L, info.unten - info.oben);
  };
})();
