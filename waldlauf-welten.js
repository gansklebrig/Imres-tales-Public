/* =====================================================================
   FRIEDRICHS JAGD – SCHAUPLÄTZE
   Jedes Kapitel der Kampagne bekommt seine eigene Kulisse:
   Hintergrund (einmal gemalt), drei Bodenstreifen (vor/zwischen den
   Gegnern) und kleine bewegte Dinge (Feuer, Fackeln, Runen, Pilze …).
   Wird von waldlauf.js benutzt (window.WALDLAUF_WELTEN).
   ===================================================================== */
(function () {
  "use strict";

  const W = 400, H = 500;
  const BAHNEN = [{ y: 300, s: 0.58 }, { y: 352, s: 0.78 }, { y: 410, s: 0.98 }];

  function lcg(seed) { let s = seed; return () => (s = (s * 16807) % 2147483647) / 2147483647; }
  function leinwand() { const f = 2, c = document.createElement("canvas"); c.width = W * f; c.height = H * f; const x = c.getContext("2d"); x.scale(f, f); return [c, x]; }
  function himmel(x, stopps) { const g = x.createLinearGradient(0, 0, 0, H); stopps.forEach(([o, f]) => g.addColorStop(o, f)); x.fillStyle = g; x.fillRect(0, 0, W, H); }
  function sterne(x, r, n, maxY) { for (let i = 0; i < n; i++) { x.fillStyle = "rgba(235,226,204," + (0.15 + r() * 0.55) + ")"; const g = r() < 0.15 ? 1.6 : 1; x.fillRect(r() * W, r() * maxY, g, g); } }
  function mond(x, mx, my, rad, schein) {
    const g = x.createRadialGradient(mx, my, rad / 2, mx, my, rad * schein); g.addColorStop(0, "rgba(235,226,204,.22)"); g.addColorStop(1, "rgba(235,226,204,0)");
    x.fillStyle = g; x.fillRect(mx - rad * schein, my - rad * schein, rad * schein * 2, rad * schein * 2);
    x.fillStyle = "#ebe2cc"; x.beginPath(); x.arc(mx, my, rad, 0, Math.PI * 2); x.fill();
    x.fillStyle = "rgba(168,159,143,.35)"; x.beginPath(); x.arc(mx - rad * 0.33, my - rad * 0.28, rad * 0.24, 0, 7); x.arc(mx + rad * 0.33, my + rad * 0.33, rad * 0.17, 0, 7); x.fill();
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
        blobs.forEach(([bx, by, br]) => { x.beginPath(); x.arc(bx, by, br, 0, Math.PI * 2); x.fill(); });
        x.strokeStyle = rand; x.lineWidth = 1.2;
        blobs.forEach(([bx, by, br]) => { x.beginPath(); x.arc(bx, by, br, Math.PI * 1.15, Math.PI * 1.85); x.stroke(); });
        if (stil.form === "gras") {
          x.strokeStyle = rand; x.lineWidth = 1;
          for (let xx = 0; xx < W; xx += 4 + r() * 6) { const hh = (6 + r() * 8) * b.s; x.beginPath(); x.moveTo(xx, b.y + 4 * b.s); x.lineTo(xx + (r() - 0.5) * 4, b.y - hh); x.stroke(); }
        }
      } else {
        x.beginPath(); x.moveTo(-10, b.y + 12 * b.s);
        for (let xx = -10; xx < W + 20; xx += (14 + r() * 22) * b.s) x.lineTo(xx, b.y + (r() * 12 - 4) * b.s);
        x.lineTo(W + 20, b.y + 14 * b.s); x.closePath(); x.fill();
        x.strokeStyle = rand; x.lineWidth = 1.2; x.beginPath();
        for (let xx = -10, first = true; xx < W + 20; xx += (14 + r() * 22) * b.s) { const yy = b.y + (r() * 10 - 3) * b.s; if (first) { x.moveTo(xx, yy); first = false; } else x.lineTo(xx, yy); }
        x.stroke();
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

  /* ---------- Die Schauplätze ---------- */
  const THEMEN = {
    /* I · Der Weg nach Phandalin: Abenddämmerung, brennender Wagen */
    strasse: {
      partikel: "glut", unten: false,
      malen(x, r) {
        himmel(x, [[0, "#1c1430"], [0.35, "#3a2442"], [0.55, "#8a4a3a"], [0.62, "#c4703a"], [0.66, "#2a2a26"], [1, "#12160f"]]);
        sterne(x, r, 25, 120);
        glow(x, 120, 300, 160, "rgba(224,140,70,.35)");
        x.fillStyle = "#2a2232"; x.beginPath(); x.moveTo(0, 290);
        for (let px = 0; px <= W; px += 40) x.lineTo(px, 262 - Math.sin(px / 70) * 18 - r() * 10);
        x.lineTo(W, 300); x.lineTo(0, 300); x.fill();
        wald(x, r, "#1a1f18", "#111611", 298);
        x.fillStyle = "#3a3022"; x.beginPath(); x.moveTo(0, 296); x.quadraticCurveTo(200, 286, W, 298); x.lineTo(W, 306); x.lineTo(0, 306); x.fill();
        // umgestürzter, halb verbrannter Wagen
        x.fillStyle = "#14100c";
        x.save(); x.translate(92, 292); x.rotate(-0.12);
        x.fillRect(-34, -16, 60, 14); x.fillRect(-30, -30, 4, 16); x.fillRect(14, -26, 4, 12);
        x.lineWidth = 3; x.strokeStyle = "#14100c"; x.beginPath(); x.arc(-20, 0, 9, 0, 7); x.stroke(); x.beginPath(); x.arc(14, -2, 9, 0, 7); x.stroke();
        x.restore();
      },
      deko(x, t) { feuer(x, 96, 282, 1, t); feuer(x, 80, 286, 0.7, t + 1.3); },
      lagen: { form: "busch", rand: "rgba(160,120,70,.25)", farben: ["#1a2116", "#141a12", "#0f140e"] }
    },
    /* II · Die Goblinhöhle */
    hoehle: {
      partikel: "gluehwurm",
      malen(x, r) {
        himmel(x, [[0, "#09080f"], [0.45, "#141320"], [0.62, "#1b2220"], [1, "#0d110d"]]);
        sterne(x, r, 60, 200); mond(x, 90, 70, 16, 5);
        wald(x, r, "#182019", "#111611", 296);
        x.fillStyle = "#2a2826";
        x.beginPath(); x.moveTo(190, 300); x.lineTo(214, 220); x.lineTo(252, 176); x.lineTo(300, 160); x.lineTo(352, 184); x.lineTo(392, 150); x.lineTo(410, 160); x.lineTo(410, 300); x.closePath(); x.fill();
        x.fillStyle = "rgba(235,226,204,.07)"; x.beginPath(); x.moveTo(252, 176); x.lineTo(300, 160); x.lineTo(296, 182); x.lineTo(258, 196); x.closePath(); x.fill();
        x.fillStyle = "#050405"; x.beginPath(); x.moveTo(262, 300); x.quadraticCurveTo(262, 232, 300, 228); x.quadraticCurveTo(338, 232, 340, 300); x.closePath(); x.fill();
        x.fillStyle = "#3a2a1c"; x.fillRect(252, 254, 4, 46); x.fillRect(346, 254, 4, 46);
        // Pflöcke mit Stricken (für die Wölfe)
        x.strokeStyle = "#5a4430"; x.lineWidth = 3; [[220, 296], [234, 298]].forEach(([px, py]) => { x.beginPath(); x.moveTo(px, py); x.lineTo(px, py - 14); x.stroke(); });
      },
      deko(x, t) { fackel(x, 254, 252, t); fackel(x, 348, 252, t + 0.7); },
      lagen: { form: "busch", rand: "rgba(111,138,90,.22)", farben: ["#172117", "#121a12", "#0e140e"] }
    },
    /* III · Schloss Crackmore */
    schloss: {
      partikel: "gluehwurm",
      malen(x, r) {
        himmel(x, [[0, "#0a0a14"], [0.45, "#161828"], [0.62, "#1e2422"], [1, "#0d110d"]]);
        sterne(x, r, 70, 200); mond(x, 310, 64, 22, 5);
        x.fillStyle = "#1a1c22";
        x.fillRect(70, 160, 46, 140); x.fillRect(250, 140, 52, 160); x.fillRect(110, 214, 150, 86);
        for (let px = 70; px < 116; px += 12) x.fillRect(px, 150, 8, 12);
        for (let px = 250; px < 302; px += 13) x.fillRect(px, 130, 8, 12);
        x.beginPath(); x.moveTo(110, 214); x.lineTo(150, 204); x.lineTo(170, 220); x.lineTo(196, 196); x.lineTo(224, 218); x.lineTo(260, 210); x.lineTo(260, 216); x.lineTo(110, 216); x.fill();
        x.fillStyle = "#0a0b0e"; x.fillRect(160, 250, 26, 50);
        x.beginPath(); x.arc(173, 250, 13, Math.PI, 0); x.fill();
        [[86, 196], [270, 176], [282, 220], [130, 240]].forEach(([px, py], i) => { x.fillStyle = i < 2 ? "rgba(224,160,70,.85)" : "#0a0b0e"; x.fillRect(px, py, 7, 12); });
        // Ranken
        x.strokeStyle = "#1e3a22"; x.lineWidth = 3;
        for (let i = 0; i < 14; i++) { const px = 70 + r() * 230, py = 140 + r() * 60; x.beginPath(); x.moveTo(px, py); x.bezierCurveTo(px + 10, py + 30, px - 10, py + 60, px + 4, py + 100); x.stroke(); }
        randwald(x, r, "#121812", "#0d120d", 300);
        nebel(x, 250, 70, 0.14);
      },
      deko(x, t) { fenster(x, 86, 196, t); fenster(x, 270, 176, t + 2); },
      lagen: { form: "busch", rand: "rgba(111,138,90,.2)", farben: ["#161e16", "#111811", "#0d130d"] }
    },
    /* IV · Der Wachturm: sternklare Nacht, kleiner Mond */
    wachturm: {
      partikel: "gluehwurm",
      malen(x, r) {
        himmel(x, [[0, "#06060e"], [0.5, "#121626"], [0.62, "#1a2420"], [1, "#0d110d"]]);
        sterne(x, r, 150, 260); mond(x, 120, 54, 9, 7);
        x.fillStyle = "#1c1e22";
        x.fillRect(150, 214, 120, 86);
        x.beginPath(); x.moveTo(144, 216); x.lineTo(210, 184); x.lineTo(276, 216); x.closePath(); x.fill();
        x.fillRect(266, 140, 50, 160);
        for (let px = 264; px < 318; px += 12) x.fillRect(px, 130, 8, 12);
        x.fillStyle = "#0b0c0e"; x.fillRect(196, 258, 18, 42);
        x.fillStyle = "rgba(235,226,204,.06)"; x.fillRect(266, 140, 12, 160);
        randwald(x, r, "#151d16", "#0f150f", 300);
      },
      deko(x, t) {
        const a = 0.55 + 0.35 * Math.sin(t * 7) * Math.sin(t * 3.1);
        glow(x, 292, 200, 26, "rgba(224,160,70," + (a * 0.5).toFixed(2) + ")");
        x.fillStyle = "rgba(255,200,120," + a.toFixed(2) + ")"; x.fillRect(290, 186, 3, 26);
      },
      lagen: { form: "gras", rand: "rgba(150,170,110,.22)", farben: ["#172117", "#121a12", "#0e140e"] }
    },
    /* V · Die alte Mine und die magische Schmiede */
    mine: {
      partikel: "staub", unten: true,
      malen(x, r) {
        himmel(x, [[0, "#0b0a0e"], [0.5, "#1a1820"], [1, "#0e0c10"]]);
        glow(x, 200, 220, 170, "rgba(90,160,255,.12)");
        felswand(x, r, 310, "#14121a", 20);
        x.strokeStyle = "rgba(235,226,204,.05)"; x.lineWidth = 1;
        for (let i = 0; i < 30; i++) { const px = r() * W, py = 40 + r() * 240; x.beginPath(); x.moveTo(px, py); x.lineTo(px + 20 + r() * 30, py + r() * 10); x.stroke(); }
        // Stützbalken
        [[60, 120], [330, 120]].forEach(([px]) => { x.fillStyle = "#3a2a1c"; x.fillRect(px, 110, 10, 190); x.fillRect(px + 2, 110, 10, 190); });
        x.fillStyle = "#3a2a1c"; x.fillRect(50, 104, 300, 12);
        x.fillStyle = "rgba(0,0,0,.35)"; x.fillRect(50, 114, 300, 4);
        // Runenbogen der Schmiede
        x.strokeStyle = "#2a2834"; x.lineWidth = 18; x.beginPath(); x.arc(200, 300, 90, Math.PI, 0); x.stroke();
        x.fillStyle = "#08070c"; x.beginPath(); x.arc(200, 300, 80, Math.PI, 0); x.fill();
        hoehlenDecke(x, r, "#0a090d", 40);
      },
      deko(x, t) {
        for (let i = 0; i < 9; i++) {
          const ang = Math.PI + (i + 0.5) / 9 * Math.PI, px = 200 + Math.cos(ang) * 90, py = 300 + Math.sin(ang) * 90;
          const a = 0.45 + 0.45 * Math.sin(t * 2 + i * 0.8);
          glow(x, px, py, 12, "rgba(110,190,255," + (a * 0.6).toFixed(2) + ")");
          x.fillStyle = "rgba(170,225,255," + a.toFixed(2) + ")"; x.fillRect(px - 1.5, py - 4, 3, 8); x.fillRect(px - 4, py - 1, 8, 2);
        }
        glow(x, 200, 290, 50, "rgba(255,170,80," + (0.18 + 0.06 * Math.sin(t * 5)).toFixed(2) + ")");
      },
      lagen: { form: "stein", rand: "rgba(170,160,190,.18)", farben: ["#1c1a22", "#16141b", "#100f14"] }
    },
    /* VI · Donnerbaum: verlassenes Dorf, verfallener Turm */
    donnerbaum: {
      partikel: "asche",
      malen(x, r) {
        himmel(x, [[0, "#0c0e10"], [0.45, "#1c2222"], [0.62, "#242a26"], [1, "#0e120e"]]);
        sterne(x, r, 30, 160); mond(x, 70, 80, 14, 4);
        x.fillStyle = "#181b1c";
        x.fillRect(176, 120, 40, 180); x.beginPath(); x.moveTo(176, 120); x.lineTo(186, 100); x.lineTo(196, 116); x.lineTo(206, 92); x.lineTo(216, 120); x.fill();
        x.fillStyle = "#0b0c0d"; x.fillRect(190, 150, 8, 14); x.fillRect(196, 210, 8, 14);
        [[40, 250, 60], [110, 262, 46], [250, 256, 56], [320, 246, 64]].forEach(([px, py, w]) => {
          x.fillStyle = "#16191a"; x.fillRect(px, py, w, 300 - py);
          x.beginPath(); x.moveTo(px - 6, py); x.lineTo(px + w * 0.45, py - 30); x.lineTo(px + w + 6, py); x.fill();
          x.fillStyle = "#0b0c0d"; x.fillRect(px + w * 0.3, py + 14, 8, 10);
          if (r() < 0.6) { x.fillStyle = "#0e1011"; x.beginPath(); x.moveTo(px + w * 0.5, py - 24); x.lineTo(px + w * 0.8, py - 8); x.lineTo(px + w * 0.6, py + 4); x.fill(); }
        });
        x.strokeStyle = "#141716"; x.lineWidth = 4;
        [[14, 300], [370, 300]].forEach(([px, py]) => { x.beginPath(); x.moveTo(px, py); x.lineTo(px + 4, py - 90); x.moveTo(px + 3, py - 50); x.lineTo(px + 26, py - 80); x.moveTo(px + 4, py - 70); x.lineTo(px - 18, py - 96); x.stroke(); });
        nebel(x, 240, 80, 0.22);
      },
      deko() {},
      lagen: { form: "gras", rand: "rgba(130,140,110,.18)", farben: ["#1a1e18", "#141814", "#0f120f"] }
    },
    /* VII · Gefängnis im Unterreich: Ilvaras Festung */
    gefaengnis: {
      partikel: "glut", unten: true,
      malen(x, r) {
        himmel(x, [[0, "#08070b"], [0.5, "#16131a"], [1, "#0c0a0d"]]);
        felswand(x, r, 150, "#120f14", 40);
        x.fillStyle = "#211c22"; x.fillRect(40, 170, 320, 130);
        for (let px = 40; px < 360; px += 18) x.fillRect(px, 160, 11, 12);
        x.strokeStyle = "rgba(0,0,0,.35)"; x.lineWidth = 1;
        for (let yy = 182; yy < 300; yy += 12) for (let px = 40 + (yy % 24 ? 0 : 12); px < 360; px += 24) x.strokeRect(px, yy, 24, 12);
        // Gitterfenster
        [[90, 208], [290, 208]].forEach(([px, py]) => { x.fillStyle = "#07060a"; x.fillRect(px, py, 30, 36); x.fillStyle = "#3a3640"; for (let i = 0; i < 4; i++) x.fillRect(px + 4 + i * 7, py, 2.5, 36); });
        x.fillStyle = "#0a090c"; x.fillRect(180, 236, 40, 64); x.beginPath(); x.arc(200, 236, 20, Math.PI, 0); x.fill();
        hoehlenDecke(x, r, "#08070a", 60);
      },
      deko(x, t) { fackel(x, 160, 222, t); fackel(x, 240, 222, t + 0.9); fackel(x, 30, 250, t + 1.7); },
      lagen: { form: "stein", rand: "rgba(200,150,110,.15)", farben: ["#1e1a1e", "#171418", "#111013"] }
    },
    /* VIII · Durch die Spinnweben: leuchtende Pilze */
    spinnweben: {
      partikel: "sporen", unten: true,
      malen(x, r) {
        himmel(x, [[0, "#06080c"], [0.5, "#0f1820"], [1, "#0a0c10"]]);
        glow(x, 120, 230, 140, "rgba(80,220,220,.10)"); glow(x, 300, 200, 130, "rgba(170,110,255,.10)");
        felswand(x, r, 260, "#0e1218", 50);
        for (let i = 0; i < 12; i++) {
          const px = r() * W, py = 200 + r() * 90, s = 6 + r() * 10, f = r() < 0.5 ? "rgba(110,230,230," : "rgba(190,130,255,";
          glow(x, px, py - s, s * 3, f + ".25)");
          x.fillStyle = "#1e2028"; x.fillRect(px - 1.5, py - s, 3, s);
          x.fillStyle = f + ".85)"; x.beginPath(); x.ellipse(px, py - s, s * 0.9, s * 0.5, 0, Math.PI, 0); x.fill();
        }
        hoehlenDecke(x, r, "#05060a", 50);
        // Spinnennetze in den Ecken
        const netz = (cx, cy, rad, a0, a1) => {
          x.strokeStyle = "rgba(220,230,240,.22)"; x.lineWidth = 0.8;
          for (let i = 0; i <= 6; i++) { const a = a0 + (a1 - a0) * i / 6; x.beginPath(); x.moveTo(cx, cy); x.lineTo(cx + Math.cos(a) * rad, cy + Math.sin(a) * rad); x.stroke(); }
          for (let k = 1; k <= 5; k++) { x.beginPath(); for (let i = 0; i <= 6; i++) { const a = a0 + (a1 - a0) * i / 6, rr = rad * k / 5.5; const px = cx + Math.cos(a) * rr, py = cy + Math.sin(a) * rr; i ? x.lineTo(px, py) : x.moveTo(px, py); } x.stroke(); }
        };
        netz(0, 30, 130, 0, Math.PI / 2); netz(W, 30, 130, Math.PI / 2, Math.PI); netz(200, 0, 90, 0.4, Math.PI - 0.4);
      },
      deko() {},
      lagen: { form: "stein", rand: "rgba(110,230,230,.18)", pilze: true, farben: ["#121822", "#0e131b", "#0a0e14"] }
    },
    /* IX · Der unterirdische See und die Stadt der Kuo-Toa */
    see: {
      partikel: "sporen", unten: true,
      malen(x, r) {
        himmel(x, [[0, "#05070a"], [0.4, "#0e1820"], [0.55, "#14262c"], [1, "#0a0e10"]]);
        hoehlenDecke(x, r, "#04060a", 70);
        // Stadt der Kuo-Toa am anderen Ufer
        x.fillStyle = "#14201e";
        [[30, 40, 26], [80, 30, 20], [130, 46, 34], [196, 60, 30], [262, 34, 24], [312, 44, 28], [362, 30, 22]].forEach(([px, h, w]) => {
          x.fillRect(px, 236 - h, w, h); x.beginPath(); x.ellipse(px + w / 2, 236 - h, w / 2, w / 3, 0, Math.PI, 0); x.fill();
        });
        x.fillStyle = "#182826"; x.beginPath(); x.moveTo(176, 236); x.lineTo(186, 180); x.lineTo(220, 168); x.lineTo(254, 180); x.lineTo(264, 236); x.fill();
        x.fillStyle = "#0b1212"; x.fillRect(212, 206, 16, 30);
        // Wasser
        const g = x.createLinearGradient(0, 236, 0, 300); g.addColorStop(0, "#1a3a40"); g.addColorStop(1, "#0a1a1e");
        x.fillStyle = g; x.fillRect(0, 236, W, 64);
        x.fillStyle = "rgba(20,32,30,.6)"; x.fillRect(0, 236, W, 6);
      },
      deko(x, t) {
        x.strokeStyle = "rgba(150,230,230,.22)"; x.lineWidth = 1;
        for (let i = 0; i < 14; i++) {
          const yy = 244 + (i % 7) * 8, px = ((i * 53 + t * (10 + i % 3 * 6)) % (W + 60)) - 30;
          x.beginPath(); x.moveTo(px, yy); x.lineTo(px + 18 + (i % 4) * 6, yy); x.stroke();
        }
        glow(x, 220, 196, 30, "rgba(110,230,200," + (0.12 + 0.08 * Math.sin(t * 1.6)).toFixed(2) + ")");
      },
      lagen: { form: "stein", rand: "rgba(150,230,230,.15)", farben: ["#132020", "#0f1919", "#0b1313"] }
    },
    /* X · Gracklstugh: Stadt der Schmieden */
    gracklstugh: {
      partikel: "glut", unten: true,
      malen(x, r) {
        himmel(x, [[0, "#0a0606"], [0.5, "#24140e"], [0.65, "#3a1e12"], [1, "#0e0a08"]]);
        glow(x, 200, 290, 220, "rgba(255,120,40,.18)");
        hoehlenDecke(x, r, "#080505", 60);
        // Festung im Fels
        x.fillStyle = "#1e1612";
        x.beginPath(); x.moveTo(110, 300); x.lineTo(130, 150); x.lineTo(170, 110); x.lineTo(230, 110); x.lineTo(270, 150); x.lineTo(290, 300); x.fill();
        x.fillStyle = "#2a1e18"; for (let i = 0; i < 5; i++) x.fillRect(150 + i * 22, 140, 12, 160);
        [[160, 170], [200, 160], [240, 170], [180, 220], [222, 220]].forEach(([px, py]) => { x.fillStyle = "rgba(255,150,60,.8)"; x.fillRect(px, py, 6, 10); });
        // Stadtmauer und Schornsteine
        x.fillStyle = "#16100d"; x.fillRect(0, 256, W, 44);
        for (let px = 0; px < W; px += 16) x.fillRect(px, 248, 10, 10);
        [[30, 200], [80, 214], [320, 204], [366, 190]].forEach(([px, py]) => { x.fillStyle = "#130d0b"; x.fillRect(px, py, 14, 60); });
      },
      deko(x, t) {
        [[37, 196], [87, 210], [327, 200], [373, 186]].forEach(([px, py], i) => {
          for (let k = 0; k < 3; k++) {
            const ph = (t * 0.4 + k / 3 + i * 0.27) % 1;
            x.fillStyle = "rgba(60,50,46," + (0.35 * (1 - ph)).toFixed(2) + ")";
            x.beginPath(); x.arc(px + Math.sin(ph * 6 + i) * 6, py - ph * 70, 6 + ph * 14, 0, 7); x.fill();
          }
          glow(x, px, py + 4, 16, "rgba(255,140,50," + (0.25 + 0.12 * Math.sin(t * 6 + i)).toFixed(2) + ")");
        });
      },
      lagen: { form: "stein", rand: "rgba(255,150,80,.15)", farben: ["#1e1612", "#18110e", "#110c0a"] }
    }
  };

  /* ---------- kleine bewegte Dinge ---------- */
  function feuer(x, px, py, s, t) {
    glow(x, px, py, 40 * s, "rgba(255,140,50," + (0.35 + 0.1 * Math.sin(t * 9)).toFixed(2) + ")");
    for (let i = 0; i < 5; i++) {
      const h = (14 + 8 * Math.sin(t * 7 + i * 1.7)) * s, w = (5 + i % 2 * 2) * s, ox = (i - 2) * 4 * s;
      x.fillStyle = i % 2 ? "rgba(255,200,90,.85)" : "rgba(240,110,40,.8)";
      x.beginPath(); x.moveTo(px + ox - w, py); x.quadraticCurveTo(px + ox + Math.sin(t * 5 + i) * 3, py - h * 1.2, px + ox + w, py); x.fill();
    }
  }
  function fackel(x, px, py, t) {
    x.fillStyle = "#3a2a1c"; x.fillRect(px - 1.5, py, 3, 16);
    glow(x, px, py - 4, 34, "rgba(255,150,60," + (0.3 + 0.1 * Math.sin(t * 11)).toFixed(2) + ")");
    const h = 9 + 3 * Math.sin(t * 13);
    x.fillStyle = "rgba(255,190,90,.9)"; x.beginPath(); x.moveTo(px - 3, py); x.quadraticCurveTo(px + Math.sin(t * 8) * 2, py - h * 1.4, px + 3, py); x.fill();
  }
  function fenster(x, px, py, t) {
    const a = 0.25 + 0.2 * Math.sin(t * 4) * Math.sin(t * 1.7);
    glow(x, px + 3, py + 6, 22, "rgba(224,160,70," + a.toFixed(2) + ")");
  }

  const cache = {};
  function bauen(name) {
    if (cache[name]) return cache[name];
    const th = THEMEN[name] || THEMEN.hoehle, r = lcg(name.length * 977 + 7);
    const [hg, x] = leinwand();
    th.malen(x, r);
    const lagen = lagenBauen(th.lagen, th.lagen.farben, r);
    return (cache[name] = { hg, lagen, deko: th.deko, partikel: th.partikel, unten: !!th.unten });
  }

  window.WALDLAUF_WELTEN = { bauen, namen: Object.keys(THEMEN) };
})();
