/* =====================================================================
   FRIEDRICHS JAGD – GEMALTE FIGUREN
   Alle Gegner, für die es auf der Seite kein freigestelltes Bild gibt,
   werden hier mit Canvas gemalt. Jede Figur schaut nach LINKS.
   Wird von waldlauf.js benutzt (window.WALDLAUF_FIGUREN).
   ===================================================================== */
(function () {
  "use strict";

  function grund(bw, bh) {
    const c = document.createElement("canvas"); c.width = bw * 2; c.height = bh * 2;
    const x = c.getContext("2d"); x.scale(2, 2); x.lineJoin = "round"; x.lineCap = "round";
    return [c, x];
  }
  function oval(x, cx, cy, rx, ry, rot) { x.beginPath(); x.ellipse(cx, cy, rx, ry, rot || 0, 0, Math.PI * 2); x.fill(); }
  function poly(x, pkt) { x.beginPath(); pkt.forEach(([px, py], i) => i ? x.lineTo(px, py) : x.moveTo(px, py)); x.closePath(); x.fill(); }
  function linie(x, farbe, breite, pkt) { x.strokeStyle = farbe; x.lineWidth = breite; x.beginPath(); pkt.forEach(([px, py], i) => i ? x.lineTo(px, py) : x.moveTo(px, py)); x.stroke(); }
  function verlauf(x, x0, y0, x1, y1, stopps) { const g = x.createLinearGradient(x0, y0, x1, y1); stopps.forEach(([o, f]) => g.addColorStop(o, f)); return g; }
  function leuchtAuge(x, cx, cy, rx, ry, farbe, blur) {
    x.save(); x.shadowColor = farbe; x.shadowBlur = blur || 8; x.fillStyle = farbe; oval(x, cx, cy, rx, ry); x.restore();
  }
  function klinge(x, x1, y1, x2, y2, breite) {
    x.strokeStyle = verlauf(x, x2, y2, x1, y1, [[0, "#e2ded2"], [1, "#8a8577"]]); x.lineWidth = breite || 4; x.beginPath(); x.moveTo(x1, y1); x.lineTo(x2, y2); x.stroke();
  }

  const F = {
    goblin() {
      const [c, x] = grund(150, 150);
      x.lineWidth = 9;
      x.strokeStyle = "#2b2219"; x.beginPath(); x.moveTo(84, 108); x.lineTo(94, 127); x.lineTo(90, 144); x.stroke();
      x.strokeStyle = "#3a2d20"; x.beginPath(); x.moveTo(70, 108); x.lineTo(60, 126); x.lineTo(62, 144); x.stroke();
      x.fillStyle = "#4d5c2a"; oval(x, 86, 146, 9, 4); oval(x, 57, 146, 9, 4);
      linie(x, "#4d5c2a", 6, [[92, 74], [104, 92], [100, 104]]);
      x.fillStyle = verlauf(x, 52, 62, 100, 116, [[0, "#7a5a37"], [1, "#3b2a1b"]]);
      x.beginPath(); x.moveTo(56, 72); x.quadraticCurveTo(46, 96, 56, 112);
      x.lineTo(62, 118); x.lineTo(68, 111); x.lineTo(75, 119); x.lineTo(82, 111); x.lineTo(89, 118); x.lineTo(97, 110);
      x.quadraticCurveTo(105, 86, 92, 66); x.quadraticCurveTo(74, 56, 56, 72); x.fill();
      x.strokeStyle = "#1e1712"; x.lineWidth = 3; x.beginPath(); x.moveTo(52, 98); x.quadraticCurveTo(76, 104, 100, 96); x.stroke();
      x.fillStyle = "#a8783e"; x.fillRect(70, 97, 6, 5);
      x.fillStyle = "#6b7d3e"; poly(x, [[62, 44], [104, 22], [68, 58]]);
      x.fillStyle = "#3f4b22"; poly(x, [[68, 46], [96, 28], [70, 54]]);
      x.fillStyle = "#5d6e35"; poly(x, [[50, 36], [66, 10], [60, 40]]);
      const g = x.createRadialGradient(46, 44, 4, 52, 52, 26); g.addColorStop(0, "#9aac56"); g.addColorStop(1, "#4d5c2a");
      x.fillStyle = g; oval(x, 52, 52, 22, 19);
      x.fillStyle = "#7d8f43"; poly(x, [[34, 49], [16, 61], [36, 61]]);
      linie(x, "#2a3115", 3, [[33, 41], [50, 45]]);
      leuchtAuge(x, 42, 49, 5, 3.2, "#ffd34d");
      x.fillStyle = "#1a1408"; oval(x, 41, 49, 1.2, 2.6);
      x.strokeStyle = "#2a1c12"; x.lineWidth = 2.5; x.beginPath(); x.moveTo(30, 66); x.quadraticCurveTo(40, 70, 50, 66); x.stroke();
      x.fillStyle = "#efe6cf"; poly(x, [[34, 66], [36, 61], [38, 67]]); poly(x, [[44, 67], [46, 62], [48, 66]]);
      linie(x, "#5d6e35", 7, [[62, 74], [46, 88], [34, 78]]);
      linie(x, "#5a4430", 4, [[36, 82], [30, 72]]);
      linie(x, "#3a2d20", 3, [[25, 77], [39, 69]]);
      x.fillStyle = verlauf(x, 10, 20, 32, 70, [[0, "#d6d2c4"], [1, "#7f7a6c"]]);
      x.beginPath(); x.moveTo(29, 72); x.quadraticCurveTo(10, 56, 8, 22); x.quadraticCurveTo(24, 44, 34, 70); x.closePath(); x.fill();
      return c;
    },

    /* Bandit bzw. Söldner (grau, mit Helm statt Kapuze) */
    bandit(art) {
      const soeldner = art === "soeldner";
      const [c, x] = grund(120, 200);
      x.fillStyle = soeldner ? "#2b2d30" : "#24211d";
      x.beginPath(); x.moveTo(60, 56); x.quadraticCurveTo(104, 110, 100, 176); x.lineTo(90, 170); x.lineTo(82, 178); x.lineTo(72, 140); x.closePath(); x.fill();
      x.lineWidth = 11;
      x.strokeStyle = "#2c2826"; x.beginPath(); x.moveTo(70, 126); x.lineTo(78, 158); x.lineTo(78, 180); x.stroke();
      x.strokeStyle = "#35302d"; x.beginPath(); x.moveTo(56, 126); x.lineTo(48, 158); x.lineTo(46, 180); x.stroke();
      x.strokeStyle = "#1c1611"; x.lineWidth = 12;
      x.beginPath(); x.moveTo(78, 176); x.lineTo(78, 194); x.lineTo(68, 196); x.stroke();
      x.beginPath(); x.moveTo(46, 176); x.lineTo(46, 194); x.lineTo(36, 196); x.stroke();
      x.fillStyle = soeldner ? verlauf(x, 40, 60, 84, 132, [[0, "#8d9096"], [1, "#43464c"]]) : verlauf(x, 40, 60, 84, 132, [[0, "#7a5638"], [1, "#3e2a1b"]]);
      x.beginPath(); x.moveTo(44, 62); x.lineTo(78, 62); x.quadraticCurveTo(86, 96, 84, 134); x.lineTo(40, 134); x.quadraticCurveTo(38, 96, 44, 62); x.fill();
      if (soeldner) { x.strokeStyle = "rgba(20,20,24,.6)"; x.lineWidth = 1.5; for (let yy = 72; yy < 132; yy += 8) { x.beginPath(); x.moveTo(42, yy); x.lineTo(84, yy); x.stroke(); } }
      else linie(x, "#2a1c12", 4, [[46, 66], [80, 108]]);
      x.fillStyle = "#1e1712"; x.fillRect(40, 110, 45, 7);
      x.fillStyle = "#c9a35a"; x.fillRect(58, 110, 7, 7);
      linie(x, soeldner ? "#5a5d63" : "#4a3424", 8, [[76, 70], [86, 96], [84, 116]]);
      linie(x, "#bdb9ad", 2.5, [[84, 118], [90, 134]]);
      if (soeldner) {
        x.fillStyle = "#7d5d47"; oval(x, 56, 44, 11, 13);
        x.fillStyle = verlauf(x, 40, 16, 74, 40, [[0, "#b9bcc2"], [1, "#55585e"]]);
        x.beginPath(); x.moveTo(40, 40); x.quadraticCurveTo(40, 16, 58, 15); x.quadraticCurveTo(76, 16, 74, 40); x.closePath(); x.fill();
        x.fillRect(36, 38, 42, 5);
        linie(x, "#3a3d42", 3, [[54, 42], [54, 56]]);
        x.fillStyle = "#ebe2cc"; oval(x, 47, 47, 1.8, 1.3);
        x.fillStyle = "#4a3426"; poly(x, [[44, 54], [66, 54], [62, 64], [50, 64]]);
      } else {
        x.fillStyle = "#2a2622";
        x.beginPath(); x.moveTo(38, 66); x.quadraticCurveTo(34, 22, 60, 16); x.quadraticCurveTo(84, 18, 82, 50); x.quadraticCurveTo(82, 62, 78, 68); x.closePath(); x.fill();
        x.fillStyle = "#7d5d47"; oval(x, 54, 44, 10, 12);
        x.fillStyle = "rgba(20,16,14,.55)"; oval(x, 56, 36, 12, 6);
        x.fillStyle = "#ebe2cc"; oval(x, 48, 42, 2, 1.4);
        linie(x, "#1e1712", 2, [[44, 38], [53, 40]]);
        x.fillStyle = "#7a2f26"; poly(x, [[42, 46], [66, 46], [64, 60], [56, 66], [44, 58]]);
        x.fillStyle = "#9b3a2f"; poly(x, [[64, 50], [74, 58], [66, 60]]);
        x.strokeStyle = "rgba(224,160,70,.25)"; x.lineWidth = 1.5; x.beginPath(); x.moveTo(60, 16); x.quadraticCurveTo(84, 18, 82, 50); x.stroke();
      }
      linie(x, soeldner ? "#5a5d63" : "#5e4230", 9, [[48, 70], [34, 94], [24, 98]]);
      x.fillStyle = "#7d5d47"; oval(x, 22, 98, 4.5, 4.5);
      linie(x, "#3a2d20", 3, [[14, 94], [28, 102]]);
      klinge(x, 21, 97, 5, 54, 4.5);
      return c;
    },

    /* Anhänger der Roten Roben */
    robe() {
      const [c, x] = grund(120, 200);
      x.fillStyle = verlauf(x, 30, 50, 96, 196, [[0, "#b8432f"], [0.6, "#7a2a20"], [1, "#4a1712"]]);
      x.beginPath(); x.moveTo(46, 54); x.quadraticCurveTo(30, 120, 22, 192);
      x.lineTo(34, 186); x.lineTo(44, 194); x.lineTo(56, 186); x.lineTo(68, 195); x.lineTo(80, 186); x.lineTo(92, 192);
      x.quadraticCurveTo(90, 120, 76, 54); x.closePath(); x.fill();
      x.strokeStyle = "rgba(40,10,8,.5)"; x.lineWidth = 2;
      [[50, 80, 40, 186], [62, 80, 62, 190], [72, 80, 82, 186]].forEach(([a, b, d, e]) => { x.beginPath(); x.moveTo(a, b); x.lineTo(d, e); x.stroke(); });
      linie(x, "#c9a35a", 3, [[38, 112], [84, 110]]);
      linie(x, "#c9a35a", 2, [[52, 112], [48, 132]]);
      // Kapuze
      x.fillStyle = verlauf(x, 36, 10, 84, 70, [[0, "#c24a35"], [1, "#6e241b"]]);
      x.beginPath(); x.moveTo(36, 70); x.quadraticCurveTo(32, 18, 60, 10); x.quadraticCurveTo(88, 16, 84, 70); x.closePath(); x.fill();
      x.fillStyle = "#140c0a"; oval(x, 52, 44, 15, 19);
      leuchtAuge(x, 45, 42, 2.6, 1.6, "#ffcf7a", 6); leuchtAuge(x, 56, 42, 2.6, 1.6, "#ffcf7a", 6);
      x.strokeStyle = "rgba(224,160,70,.35)"; x.lineWidth = 1.5; x.beginPath(); x.moveTo(60, 10); x.quadraticCurveTo(88, 16, 84, 70); x.stroke();
      // Arm mit Dolch
      linie(x, "#8a3022", 10, [[46, 76], [30, 98], [22, 96]]);
      x.fillStyle = "#c8a080"; oval(x, 20, 96, 4.5, 4.5);
      linie(x, "#3a2d20", 3, [[15, 92], [25, 100]]);
      klinge(x, 19, 95, 9, 72, 3.5);
      return c;
    },

    /* Glasstab, Anführer der Roten Roben, mit gläsernem Stab */
    glasstab() {
      const [c, x] = grund(140, 220);
      x.fillStyle = verlauf(x, 30, 60, 110, 216, [[0, "#c4523a"], [0.6, "#82291e"], [1, "#4a1510"]]);
      x.beginPath(); x.moveTo(52, 62); x.quadraticCurveTo(28, 140, 18, 214); x.lineTo(118, 214); x.quadraticCurveTo(104, 140, 90, 62); x.closePath(); x.fill();
      x.fillStyle = "#c9a35a";
      x.fillRect(18, 206, 100, 5);
      poly(x, [[66, 62], [76, 62], [74, 214], [68, 214]]);
      x.fillStyle = "#e0a046"; [90, 120, 150, 180].forEach(yy => oval(x, 71, yy, 2.5, 2.5));
      // Kopf: kahl, spitzer Bart
      x.fillStyle = "#c79c7c"; oval(x, 70, 40, 15, 18);
      x.fillStyle = "#a57b5d"; oval(x, 62, 46, 6, 8);
      x.fillStyle = "#e9e1d0"; poly(x, [[58, 50], [80, 50], [70, 76]]);
      linie(x, "#2a1c12", 2.5, [[56, 34], [66, 37]]);
      leuchtAuge(x, 61, 39, 2.4, 1.6, "#9be7ff", 6);
      x.fillStyle = "rgba(255,255,255,.25)"; oval(x, 74, 28, 6, 4);
      // Kragen
      x.fillStyle = "#5e1a12"; poly(x, [[46, 62], [94, 62], [100, 76], [40, 76]]);
      // Arm mit Glasstab
      linie(x, "#8f3324", 11, [[56, 78], [36, 104], [28, 102]]);
      x.fillStyle = "#c79c7c"; oval(x, 26, 102, 5, 5);
      x.strokeStyle = "rgba(190,240,255,.75)"; x.lineWidth = 4; x.beginPath(); x.moveTo(28, 210); x.lineTo(24, 30); x.stroke();
      x.strokeStyle = "rgba(255,255,255,.6)"; x.lineWidth = 1.2; x.beginPath(); x.moveTo(26, 200); x.lineTo(22.5, 40); x.stroke();
      x.save(); x.shadowColor = "#9be7ff"; x.shadowBlur = 16; x.fillStyle = "rgba(190,240,255,.9)";
      poly(x, [[24, 4], [34, 20], [24, 34], [14, 20]]); x.restore();
      x.fillStyle = "#ffffff"; poly(x, [[24, 10], [28, 20], [24, 26], [21, 20]]);
      return c;
    },

    /* Drow – Nezna bzw. Drow-Wache */
    drow(art) {
      const wache = art === "wache";
      const [c, x] = grund(120, 200);
      // Haar hinten
      if (!wache) { x.fillStyle = "#e8e6f0"; x.beginPath(); x.moveTo(58, 20); x.quadraticCurveTo(92, 40, 86, 112); x.quadraticCurveTo(74, 80, 64, 60); x.closePath(); x.fill(); }
      // Beine
      x.lineWidth = 9;
      x.strokeStyle = "#17141d"; x.beginPath(); x.moveTo(66, 122); x.lineTo(74, 160); x.lineTo(76, 192); x.stroke();
      x.strokeStyle = "#1e1a26"; x.beginPath(); x.moveTo(54, 122); x.lineTo(44, 158); x.lineTo(42, 192); x.stroke();
      x.fillStyle = "#0f0d14"; oval(x, 72, 194, 9, 4); oval(x, 38, 194, 9, 4);
      // Umhang
      x.fillStyle = "#1b1726"; x.beginPath(); x.moveTo(62, 56); x.quadraticCurveTo(100, 100, 98, 170); x.lineTo(82, 160); x.lineTo(70, 100); x.closePath(); x.fill();
      // Rüstung
      x.fillStyle = verlauf(x, 42, 56, 82, 126, [[0, "#3a3448"], [1, "#151220"]]);
      x.beginPath(); x.moveTo(46, 58); x.lineTo(76, 58); x.quadraticCurveTo(82, 92, 78, 126); x.lineTo(44, 126); x.quadraticCurveTo(40, 92, 46, 58); x.fill();
      x.strokeStyle = "rgba(160,140,220,.35)"; x.lineWidth = 1.5;
      [[48, 76, 76, 76], [46, 96, 78, 96]].forEach(([a, b, d, e]) => { x.beginPath(); x.moveTo(a, b); x.lineTo(d, e); x.stroke(); });
      x.fillStyle = "#6b5ca8"; x.fillRect(44, 108, 36, 5);
      // Kopf
      x.fillStyle = "#4a4060"; oval(x, 58, 38, 12, 15);
      x.fillStyle = "#3a3250"; poly(x, [[66, 34], [84, 24], [70, 42]]);
      if (wache) {
        x.fillStyle = verlauf(x, 44, 18, 72, 36, [[0, "#4d4566"], [1, "#1e1a2a"]]);
        x.beginPath(); x.moveTo(44, 38); x.quadraticCurveTo(44, 18, 60, 18); x.quadraticCurveTo(74, 20, 72, 38); x.closePath(); x.fill();
      } else {
        x.fillStyle = "#f2f0f8"; x.beginPath(); x.moveTo(46, 36); x.quadraticCurveTo(48, 18, 62, 20); x.quadraticCurveTo(72, 22, 70, 34); x.quadraticCurveTo(60, 26, 46, 36); x.fill();
      }
      leuchtAuge(x, 51, 39, 2.8, 1.6, "#ff5a4a", 7);
      linie(x, "#2a2238", 2, [[47, 35], [55, 37]]);
      // Arm & Waffe
      linie(x, "#2a2438", 8, [[50, 66], [36, 90], [26, 94]]);
      x.fillStyle = "#4a4060"; oval(x, 24, 94, 4, 4);
      if (wache) {
        x.fillStyle = "#3a2a1e"; x.fillRect(2, 88, 28, 5);
        linie(x, "#6a5a48", 3, [[8, 76], [6, 90], [8, 104]]);
        linie(x, "#c9c4b8", 1, [[8, 77], [16, 90], [8, 103]]);
      } else {
        x.strokeStyle = verlauf(x, 4, 50, 26, 96, [[0, "#d8d4ee"], [1, "#6a6488"]]); x.lineWidth = 4;
        x.beginPath(); x.moveTo(24, 94); x.quadraticCurveTo(4, 80, 8, 50); x.stroke();
      }
      return c;
    },

    /* Fledermaus (Neznas Tiergestalt) bzw. Stirge mit Saugrüssel */
    fledermaus(art) {
      const stirge = art === "stirge";
      const [c, x] = grund(150, 90);
      const koerper = stirge ? "#5a3a2a" : "#2a2238", fluegel = stirge ? "#3e2a20" : "#1d1828", ader = stirge ? "rgba(155,58,47,.5)" : "rgba(140,120,200,.4)";
      x.fillStyle = fluegel;
      const fl = s => { x.beginPath(); x.moveTo(75, 44); x.lineTo(75 + s * 30, 8); x.lineTo(75 + s * 58, 18); x.lineTo(75 + s * 72, 46); x.lineTo(75 + s * 58, 40); x.lineTo(75 + s * 48, 56); x.lineTo(75 + s * 36, 46); x.lineTo(75 + s * 24, 60); x.closePath(); x.fill(); };
      fl(1); fl(-1);
      x.strokeStyle = ader; x.lineWidth = 1.2;
      [-1, 1].forEach(s => { [[30, 8], [58, 18], [72, 46]].forEach(([dx, dy]) => { x.beginPath(); x.moveTo(75, 44); x.lineTo(75 + s * dx, dy); x.stroke(); }); });
      x.fillStyle = koerper; oval(x, 75, 50, 13, 17);
      x.fillStyle = koerper; oval(x, 66, 36, 10, 9);
      poly(x, [[62, 30], [58, 16], [68, 28]]); poly(x, [[70, 29], [74, 16], [74, 30]]);
      leuchtAuge(x, 62, 35, 2.2, 1.8, stirge ? "#ffd34d" : "#ff5a4a", 6);
      if (stirge) { linie(x, "#2a1610", 3, [[58, 40], [30, 54]]); linie(x, "#9b3a2f", 1.2, [[44, 47], [30, 54]]); }
      else { x.fillStyle = "#efe6cf"; poly(x, [[60, 42], [61, 46], [63, 42]]); }
      return c;
    },

    /* klappriges Skelett */
    skelett() {
      const [c, x] = grund(110, 190);
      const knochen = "#d9d1bc", schatten = "#8a8270";
      x.lineWidth = 5;
      linie(x, knochen, 5, [[60, 112], [70, 146], [70, 184]]);
      linie(x, schatten, 5, [[50, 112], [42, 148], [38, 184]]);
      x.fillStyle = knochen; oval(x, 66, 186, 8, 3); oval(x, 34, 186, 8, 3);
      // Becken
      x.fillStyle = knochen; poly(x, [[42, 104], [68, 104], [64, 116], [46, 116]]);
      // Wirbelsäule & Rippen
      linie(x, knochen, 4, [[56, 104], [58, 56]]);
      x.strokeStyle = knochen; x.lineWidth = 3;
      for (let i = 0; i < 5; i++) { const yy = 62 + i * 8, br = 16 - i * 1.5; x.beginPath(); x.ellipse(57, yy, br, 4, 0, Math.PI * 0.05, Math.PI * 0.95); x.stroke(); }
      // Schultern
      linie(x, knochen, 4, [[40, 58], [74, 58]]);
      // hinterer Arm
      linie(x, schatten, 4, [[72, 58], [80, 84], [76, 104]]);
      // Totenkopf
      x.fillStyle = knochen; oval(x, 54, 34, 15, 16);
      x.fillStyle = knochen; x.fillRect(44, 40, 18, 12);
      x.fillStyle = "#1a1612"; oval(x, 47, 32, 4.5, 5); oval(x, 59, 32, 4, 5);
      leuchtAuge(x, 47, 33, 1.5, 1.5, "#9be7ff", 6);
      x.fillStyle = "#1a1612"; poly(x, [[52, 38], [50, 44], [54, 44]]);
      x.strokeStyle = "#1a1612"; x.lineWidth = 1; for (let i = 0; i < 4; i++) { x.beginPath(); x.moveTo(46 + i * 4, 48); x.lineTo(46 + i * 4, 52); x.stroke(); }
      // vorderer Arm mit rostigem Schwert
      linie(x, knochen, 4, [[42, 58], [32, 82], [22, 88]]);
      linie(x, "#4a3a2a", 3, [[16, 84], [28, 92]]);
      x.strokeStyle = verlauf(x, 4, 40, 22, 88, [[0, "#9a8a70"], [1, "#6a4a30"]]); x.lineWidth = 4.5; x.beginPath(); x.moveTo(22, 88); x.lineTo(8, 46); x.stroke();
      return c;
    },

    /* ächzender Zombie, Arme nach vorn */
    zombie() {
      const [c, x] = grund(130, 190);
      const haut = "#7d8a6a", haut2 = "#5a6650";
      linie(x, "#3a3630", 10, [[70, 118], [80, 152], [82, 184]]);
      linie(x, "#2e2a26", 10, [[58, 118], [52, 152], [44, 184]]);
      x.fillStyle = "#2a2622"; oval(x, 82, 186, 9, 4); oval(x, 42, 186, 9, 4);
      linie(x, haut2, 8, [[78, 66], [52, 84], [24, 82]]);
      x.fillStyle = verlauf(x, 50, 56, 94, 128, [[0, "#6b6a5a"], [1, "#3a3a30"]]);
      x.beginPath(); x.moveTo(54, 60); x.lineTo(88, 58); x.quadraticCurveTo(96, 92, 90, 126);
      x.lineTo(82, 120); x.lineTo(76, 128); x.lineTo(68, 120); x.lineTo(60, 128); x.lineTo(54, 120); x.quadraticCurveTo(48, 92, 54, 60); x.fill();
      x.fillStyle = "rgba(155,58,47,.45)"; oval(x, 70, 92, 6, 4);
      x.fillStyle = haut; oval(x, 62, 40, 14, 16, -0.25);
      x.fillStyle = haut2; oval(x, 54, 50, 9, 6);
      x.fillStyle = "#2a2a22"; oval(x, 56, 52, 5, 3);
      leuchtAuge(x, 54, 37, 2.6, 2, "#d8e86a", 5); leuchtAuge(x, 64, 36, 2.2, 1.8, "#d8e86a", 5);
      x.fillStyle = "#3a3a30"; x.beginPath(); x.moveTo(52, 30); x.quadraticCurveTo(64, 18, 76, 34); x.quadraticCurveTo(66, 26, 52, 30); x.fill();
      linie(x, haut, 8, [[70, 66], [44, 78], [18, 74]]);
      x.fillStyle = haut; oval(x, 16, 74, 5, 4); oval(x, 22, 82, 5, 4);
      return c;
    },

    /* Riesenspinne, seitlich */
    spinne() {
      const [c, x] = grund(170, 110);
      const bein = (pkt, f) => linie(x, f || "#1a1614", 4, pkt);
      [[[96, 52], [124, 18], [150, 96]], [[92, 54], [114, 24], [132, 100]], [[78, 56], [70, 22], [96, 104]], [[70, 56], [52, 26], [60, 104]]].forEach(p => bein(p, "#120f0e"));
      x.fillStyle = verlauf(x, 90, 30, 160, 90, [[0, "#3a2a26"], [1, "#140f0e"]]); oval(x, 122, 56, 36, 28);
      x.fillStyle = "rgba(155,58,47,.7)"; poly(x, [[118, 40], [128, 52], [118, 64], [108, 52]]);
      x.strokeStyle = "rgba(235,226,204,.12)"; x.lineWidth = 1.5; x.beginPath(); x.arc(122, 56, 30, Math.PI * 1.1, Math.PI * 1.6); x.stroke();
      x.fillStyle = "#241c1a"; oval(x, 70, 62, 22, 17);
      [[[74, 60], [50, 22], [30, 100]], [[66, 62], [36, 30], [12, 98]], [[84, 62], [92, 30], [112, 104]], [[60, 66], [24, 50], [4, 96]]].forEach(p => bein(p, "#2a2220"));
      leuchtAuge(x, 54, 56, 2.6, 2.6, "#ff4a3a", 6); leuchtAuge(x, 60, 52, 2, 2, "#ff4a3a", 5); leuchtAuge(x, 52, 63, 1.6, 1.6, "#ff4a3a", 4);
      x.fillStyle = "#0e0b0a"; poly(x, [[50, 68], [44, 80], [54, 72]]); poly(x, [[58, 70], [56, 82], [62, 72]]);
      return c;
    },

    /* Ettercap: gebückter Spinnenmensch */
    ettercap() {
      const [c, x] = grund(140, 180);
      linie(x, "#2a2a3a", 8, [[82, 120], [100, 150], [96, 178]]);
      linie(x, "#22222e", 8, [[66, 122], [54, 150], [56, 178]]);
      x.fillStyle = "#1a1a24"; oval(x, 96, 178, 8, 3); oval(x, 54, 178, 8, 3);
      linie(x, "#3a3a52", 6, [[96, 72], [118, 96], [112, 124]]);
      x.fillStyle = verlauf(x, 56, 50, 110, 130, [[0, "#5a5a7a"], [1, "#2a2a3a"]]);
      x.beginPath(); x.moveTo(60, 70); x.quadraticCurveTo(70, 46, 100, 54); x.quadraticCurveTo(118, 70, 104, 122); x.quadraticCurveTo(80, 132, 62, 120); x.quadraticCurveTo(50, 96, 60, 70); x.fill();
      x.fillStyle = "rgba(111,138,90,.55)"; oval(x, 88, 92, 12, 18);
      x.strokeStyle = "rgba(235,226,204,.25)"; x.lineWidth = 1; x.beginPath(); x.moveTo(108, 60); x.lineTo(132, 40); x.moveTo(110, 70); x.lineTo(136, 66); x.stroke();
      x.fillStyle = "#4a4a68"; oval(x, 50, 62, 16, 14);
      x.fillStyle = "#3a3a52"; poly(x, [[38, 66], [30, 84], [42, 72]]); poly(x, [[46, 70], [44, 88], [50, 72]]);
      leuchtAuge(x, 44, 56, 3, 2.6, "#b4ff6a", 7); leuchtAuge(x, 54, 54, 2.4, 2.2, "#b4ff6a", 6);
      linie(x, "#4a4a68", 6, [[60, 76], [40, 96], [24, 92]]);
      x.fillStyle = "#2a2a3a"; poly(x, [[24, 92], [12, 84], [16, 96]]); poly(x, [[26, 94], [14, 104], [24, 98]]);
      return c;
    },

    /* Wraith aus dem Grab der Magierin */
    wraith() {
      const [c, x] = grund(160, 210);
      x.save(); x.shadowColor = "rgba(120,220,255,.6)"; x.shadowBlur = 18;
      x.fillStyle = verlauf(x, 80, 20, 80, 206, [[0, "rgba(30,34,52,.98)"], [0.7, "rgba(22,26,40,.85)"], [1, "rgba(22,26,40,0)"]]);
      x.beginPath(); x.moveTo(58, 40); x.quadraticCurveTo(40, 120, 30, 200); x.lineTo(46, 176); x.lineTo(60, 204); x.lineTo(74, 174); x.lineTo(90, 206); x.lineTo(102, 172); x.lineTo(118, 198);
      x.quadraticCurveTo(116, 120, 104, 40); x.closePath(); x.fill(); x.restore();
      x.fillStyle = "#141826"; x.beginPath(); x.moveTo(52, 70); x.quadraticCurveTo(46, 16, 80, 8); x.quadraticCurveTo(112, 16, 108, 70); x.closePath(); x.fill();
      x.fillStyle = "#04060a"; oval(x, 76, 44, 18, 22);
      leuchtAuge(x, 68, 42, 3.4, 2.2, "#9be7ff", 12); leuchtAuge(x, 82, 42, 3.4, 2.2, "#9be7ff", 12);
      x.strokeStyle = "rgba(155,231,255,.35)"; x.lineWidth = 1.5; x.beginPath(); x.moveTo(80, 8); x.quadraticCurveTo(112, 16, 108, 70); x.stroke();
      x.strokeStyle = "rgba(30,34,52,.95)"; x.lineWidth = 9;
      x.beginPath(); x.moveTo(56, 80); x.quadraticCurveTo(30, 96, 18, 86); x.stroke();
      x.strokeStyle = "rgba(200,230,255,.7)"; x.lineWidth = 2;
      [[18, 86, 4, 76], [18, 86, 6, 92], [18, 86, 12, 100]].forEach(([a, b, d, e]) => { x.beginPath(); x.moveTo(a, b); x.lineTo(d, e); x.stroke(); });
      return c;
    },

    /* Kuo-Toa: Fischmensch mit Speer */
    kuotoa() {
      const [c, x] = grund(130, 200);
      linie(x, "#2e4a4a", 9, [[72, 124], [80, 160], [84, 192]]);
      linie(x, "#263e3e", 9, [[58, 124], [52, 160], [46, 192]]);
      x.fillStyle = "#3a5a52"; poly(x, [[84, 188], [98, 196], [74, 196]]); poly(x, [[46, 188], [32, 196], [56, 196]]);
      linie(x, "#3a5a5a", 7, [[82, 72], [96, 98], [92, 116]]);
      x.fillStyle = verlauf(x, 46, 56, 96, 132, [[0, "#5a8a82"], [1, "#2a4442"]]);
      x.beginPath(); x.moveTo(52, 62); x.quadraticCurveTo(84, 50, 92, 74); x.quadraticCurveTo(98, 108, 86, 130); x.lineTo(50, 130); x.quadraticCurveTo(40, 96, 52, 62); x.fill();
      x.strokeStyle = "rgba(200,240,230,.18)"; x.lineWidth = 1;
      for (let yy = 72; yy < 126; yy += 7) for (let xx = 54 + (yy % 2) * 4; xx < 88; xx += 8) { x.beginPath(); x.arc(xx, yy, 3.5, 0, Math.PI); x.stroke(); }
      x.fillStyle = "#c9b48a"; oval(x, 62, 100, 10, 18);
      x.fillStyle = "#3a2a1e"; x.fillRect(46, 118, 44, 6);
      // Fischkopf
      x.fillStyle = verlauf(x, 30, 14, 80, 64, [[0, "#7ab0a2"], [1, "#3a5e58"]]);
      x.beginPath(); x.moveTo(78, 60); x.quadraticCurveTo(84, 22, 56, 16); x.quadraticCurveTo(26, 18, 24, 44); x.quadraticCurveTo(28, 62, 50, 64); x.closePath(); x.fill();
      x.fillStyle = "#c4564a"; poly(x, [[56, 16], [70, 2], [74, 18], [84, 10], [80, 28]]);
      x.fillStyle = "#f1e7cf"; oval(x, 40, 30, 8, 8);
      x.fillStyle = "#1a1210"; oval(x, 38, 30, 4, 5);
      x.fillStyle = "#f1e7cf"; oval(x, 37, 28, 1.2, 1.2);
      x.strokeStyle = "#1e2e2c"; x.lineWidth = 2.5; x.beginPath(); x.moveTo(24, 46); x.quadraticCurveTo(36, 52, 50, 50); x.stroke();
      linie(x, "rgba(30,46,44,.6)", 1.5, [[60, 40], [64, 54]]);
      // Arm mit Speer
      linie(x, "#4a7a70", 7, [[54, 74], [36, 96], [28, 92]]);
      linie(x, "#5a4430", 3.5, [[34, 150], [22, 20]]);
      x.fillStyle = "#bdb9ad"; poly(x, [[22, 4], [28, 24], [17, 22]]);
      return c;
    },

    /* Duergar, von den Stimmen besessen */
    duergar() {
      const [c, x] = grund(130, 160);
      linie(x, "#3a3a3e", 12, [[76, 112], [82, 140], [82, 156]]);
      linie(x, "#2e2e32", 12, [[56, 112], [50, 140], [48, 156]]);
      x.fillStyle = "#1e1a16"; oval(x, 84, 156, 11, 5); oval(x, 44, 156, 11, 5);
      linie(x, "#5a5a62", 10, [[88, 62], [100, 88], [96, 104]]);
      x.fillStyle = verlauf(x, 40, 50, 100, 120, [[0, "#7a7c84"], [1, "#34363c"]]);
      x.beginPath(); x.moveTo(44, 58); x.lineTo(94, 56); x.quadraticCurveTo(104, 88, 96, 118); x.lineTo(40, 118); x.quadraticCurveTo(34, 88, 44, 58); x.fill();
      x.fillStyle = "#2a2622"; x.fillRect(38, 98, 60, 8);
      x.fillStyle = "#9b7a3a"; x.fillRect(62, 98, 10, 8);
      // Kopf mit Glatze und langem Bart
      x.fillStyle = "#8a8682"; oval(x, 62, 36, 18, 18);
      x.fillStyle = "rgba(255,255,255,.18)"; oval(x, 68, 26, 7, 4);
      x.fillStyle = "#4a4642"; x.beginPath(); x.moveTo(44, 46); x.quadraticCurveTo(44, 90, 62, 98); x.quadraticCurveTo(80, 88, 78, 48); x.quadraticCurveTo(62, 56, 44, 46); x.fill();
      x.strokeStyle = "rgba(30,28,26,.6)"; x.lineWidth = 1.2; [52, 60, 68].forEach(xx => { x.beginPath(); x.moveTo(xx, 58); x.lineTo(xx + 2, 90); x.stroke(); });
      linie(x, "#2a2622", 3, [[44, 30], [58, 34]]);
      leuchtAuge(x, 50, 36, 3, 2, "#c88aff", 9); leuchtAuge(x, 62, 36, 2.6, 1.8, "#c88aff", 9);
      x.fillStyle = "#8a8682"; poly(x, [[44, 36], [30, 30], [46, 42]]);
      // Arm mit Kriegshacke
      linie(x, "#6a6a72", 10, [[48, 64], [32, 86], [24, 86]]);
      x.fillStyle = "#8a8682"; oval(x, 22, 86, 5.5, 5.5);
      linie(x, "#4a3424", 4, [[22, 112], [22, 30]]);
      x.fillStyle = verlauf(x, 4, 24, 40, 40, [[0, "#c9c4b8"], [1, "#6a6660"]]);
      poly(x, [[22, 26], [42, 34], [22, 40], [2, 46], [8, 34]]);
      return c;
    },

    /* Venomfang: junger grüner Drache im Flug */
    venomfang() {
      const [c, x] = grund(280, 180);
      // hinterer Flügel
      x.fillStyle = "#1e3a22";
      poly(x, [[150, 74], [196, 6], [214, 24], [232, 14], [238, 40], [256, 38], [244, 70], [200, 86]]);
      // Schwanz
      x.strokeStyle = verlauf(x, 170, 90, 276, 150, [[0, "#3e7a3a"], [1, "#1e3a1e"]]); x.lineWidth = 16;
      x.beginPath(); x.moveTo(176, 98); x.quadraticCurveTo(230, 120, 270, 150); x.stroke();
      x.lineWidth = 6; x.beginPath(); x.moveTo(250, 136); x.lineTo(276, 156); x.stroke();
      x.fillStyle = "#6fae4a"; poly(x, [[266, 146], [278, 140], [276, 160]]);
      // Körper
      x.fillStyle = verlauf(x, 90, 60, 190, 130, [[0, "#5a9a4a"], [1, "#24482a"]]);
      x.beginPath(); x.ellipse(140, 96, 52, 26, 0.12, 0, Math.PI * 2); x.fill();
      x.fillStyle = "#c9c08a"; x.beginPath(); x.ellipse(132, 110, 40, 12, 0.12, 0, Math.PI); x.fill();
      x.strokeStyle = "rgba(60,40,20,.4)"; x.lineWidth = 1.2; for (let xx = 100; xx < 166; xx += 9) { x.beginPath(); x.moveTo(xx, 104); x.lineTo(xx + 2, 118); x.stroke(); }
      // Beine
      linie(x, "#2e5a30", 8, [[120, 114], [112, 138], [100, 146]]);
      linie(x, "#2e5a30", 8, [[164, 112], [170, 136], [160, 148]]);
      x.fillStyle = "#e8e0c8"; poly(x, [[100, 146], [92, 150], [100, 150]]); poly(x, [[160, 148], [152, 152], [160, 152]]);
      // Hals & Kopf
      x.strokeStyle = verlauf(x, 50, 50, 110, 90, [[0, "#4a8a40"], [1, "#2e5a30"]]); x.lineWidth = 18;
      x.beginPath(); x.moveTo(100, 88); x.quadraticCurveTo(76, 70, 56, 66); x.stroke();
      x.fillStyle = "#4a8a40";
      x.beginPath(); x.moveTo(64, 56); x.quadraticCurveTo(40, 52, 14, 64); x.lineTo(16, 72); x.quadraticCurveTo(40, 80, 64, 78); x.closePath(); x.fill();
      x.fillStyle = "#2e5a30"; poly(x, [[60, 58], [80, 36], [70, 60]]); poly(x, [[52, 58], [64, 40], [58, 60]]);
      x.fillStyle = "#24482a"; poly(x, [[16, 72], [40, 80], [62, 80], [40, 86]]);
      x.fillStyle = "#efe6cf"; poly(x, [[22, 72], [24, 77], [26, 72]]); poly(x, [[32, 74], [34, 79], [36, 74]]);
      leuchtAuge(x, 44, 62, 4, 2.4, "#e8ff5a", 10);
      x.fillStyle = "#1a1408"; oval(x, 44, 62, 1, 2.2);
      // Rückenzacken
      x.fillStyle = "#6fae4a";
      [[104, 74], [122, 70], [140, 70], [158, 72], [176, 78]].forEach(([px, py]) => poly(x, [[px - 6, py + 4], [px, py - 10], [px + 6, py + 4]]));
      // vorderer Flügel
      x.fillStyle = verlauf(x, 110, 0, 190, 90, [[0, "#4a8a40"], [1, "#24482a"]]);
      poly(x, [[118, 84], [140, 4], [160, 26], [178, 14], [186, 44], [204, 40], [188, 74], [158, 92]]);
      x.strokeStyle = "rgba(20,40,20,.6)"; x.lineWidth = 2;
      [[140, 4], [178, 14], [204, 40]].forEach(([px, py]) => { x.beginPath(); x.moveTo(126, 84); x.lineTo(px, py); x.stroke(); });
      return c;
    },

    /* Wolf mit zerrissenem Strick (Freund, nicht schießen!) */
    wolf() {
      const [c, x] = grund(160, 100);
      linie(x, "#4a4a4e", 7, [[112, 64], [120, 92]]); linie(x, "#4a4a4e", 7, [[58, 66], [50, 92]]);
      x.strokeStyle = "#6a6a70"; x.lineWidth = 10; x.beginPath(); x.moveTo(128, 50); x.quadraticCurveTo(152, 46, 156, 30); x.stroke();
      x.fillStyle = verlauf(x, 40, 30, 140, 80, [[0, "#9a9aa2"], [1, "#55555c"]]);
      x.beginPath(); x.ellipse(92, 54, 44, 18, 0, 0, Math.PI * 2); x.fill();
      x.fillStyle = "#c9c9cc"; x.beginPath(); x.ellipse(84, 64, 30, 8, 0, 0, Math.PI); x.fill();
      linie(x, "#7a7a82", 7, [[104, 66], [110, 94]]); linie(x, "#7a7a82", 7, [[66, 66], [62, 94]]);
      x.fillStyle = "#3a3a3e"; [[110, 95], [62, 95], [120, 93], [50, 93]].forEach(([px, py]) => oval(x, px, py, 5, 2.5));
      x.fillStyle = "#8a8a92";
      x.beginPath(); x.moveTo(56, 40); x.quadraticCurveTo(36, 26, 22, 38); x.lineTo(6, 44); x.lineTo(10, 50); x.lineTo(26, 52); x.quadraticCurveTo(44, 60, 58, 56); x.closePath(); x.fill();
      x.fillStyle = "#6a6a70"; poly(x, [[36, 30], [40, 12], [48, 32]]); poly(x, [[44, 32], [52, 16], [54, 36]]);
      x.fillStyle = "#1a1a1e"; oval(x, 8, 46, 3, 2.5);
      leuchtAuge(x, 30, 38, 2.2, 1.6, "#ffd34d", 5);
      linie(x, "#8a6a44", 3, [[52, 44], [60, 58]]);
      linie(x, "#8a6a44", 2, [[56, 54], [64, 72], [58, 82]]);
      return c;
    },

    /* violette Stimme, die aus besessenen Duergar fährt */
    stimme() {
      const [c, x] = grund(60, 60);
      const g = x.createRadialGradient(30, 30, 2, 30, 30, 28); g.addColorStop(0, "rgba(255,240,255,1)"); g.addColorStop(0.3, "rgba(200,138,255,.9)"); g.addColorStop(1, "rgba(120,60,200,0)");
      x.fillStyle = g; oval(x, 30, 30, 28, 28);
      return c;
    },

    hase() {
      const [c, x] = grund(130, 90);
      x.fillStyle = "#6b4f35";
      x.beginPath(); x.moveTo(84, 54); x.quadraticCurveTo(118, 62, 126, 80); x.lineTo(112, 80); x.quadraticCurveTo(98, 70, 80, 66); x.closePath(); x.fill();
      x.fillStyle = verlauf(x, 40, 30, 100, 80, [[0, "#a8835c"], [1, "#5e4530"]]); oval(x, 70, 54, 34, 20, -0.12);
      x.fillStyle = "#d8cbb0"; oval(x, 64, 66, 20, 7, -0.1);
      x.fillStyle = "#f1e7cf"; oval(x, 104, 46, 7, 6.5);
      linie(x, "#7a5b3e", 5, [[44, 62], [24, 74]]); linie(x, "#7a5b3e", 5, [[50, 66], [34, 82]]);
      x.fillStyle = "#9a7650"; oval(x, 34, 40, 15, 12);
      x.fillStyle = "#b08c64"; oval(x, 24, 44, 7, 6);
      x.fillStyle = "#8a6a4a"; oval(x, 52, 18, 5.5, 20, 1.15);
      x.fillStyle = "#6b4f35"; oval(x, 48, 22, 5, 18, 0.95);
      x.fillStyle = "#2a1c12"; oval(x, 60, 12, 3, 5, 1.15);
      x.fillStyle = "#1a1210"; oval(x, 30, 37, 2.6, 2.6);
      x.fillStyle = "#ebe2cc"; oval(x, 29.2, 36.2, 0.8, 0.8);
      x.fillStyle = "#3a2420"; oval(x, 18, 44, 2, 1.6);
      return c;
    },

    blatt() {
      const [c, x] = grund(80, 80);
      x.translate(40, 42);
      x.save(); x.shadowColor = "rgba(224,160,70,.9)"; x.shadowBlur = 10;
      x.fillStyle = verlauf(x, -30, -30, 30, 30, [[0, "#ffcf7a"], [0.55, "#e0a046"], [1, "#b5502f"]]);
      poly(x, [[0, -32], [7, -16], [24, -22], [18, -6], [32, 2], [14, 8], [18, 24], [3, 14], [0, 26], [-3, 14], [-18, 24], [-14, 8], [-32, 2], [-18, -6], [-24, -22], [-7, -16]]);
      x.restore();
      x.strokeStyle = "rgba(122,47,38,.65)"; x.lineWidth = 1.2;
      x.beginPath(); x.moveTo(0, 34); x.lineTo(0, -26); x.moveTo(0, 6); x.lineTo(26, -2); x.moveTo(0, 6); x.lineTo(-26, -2); x.moveTo(0, 0); x.lineTo(18, -18); x.moveTo(0, 0); x.lineTo(-18, -18); x.stroke();
      return c;
    },

    /* kleiner Illusions-Demogorgon aus Barradins Flöte */
    illusion() {
      const [c, x] = grund(80, 90);
      x.globalAlpha = 0.85;
      x.fillStyle = "#c98a3a";
      oval(x, 40, 54, 16, 22);
      oval(x, 30, 26, 8, 8); oval(x, 50, 26, 8, 8);
      linie(x, "#c98a3a", 4, [[26, 46], [8, 40], [4, 54]]); linie(x, "#c98a3a", 4, [[54, 46], [72, 40], [76, 54]]);
      linie(x, "#c98a3a", 5, [[34, 74], [30, 88]]); linie(x, "#c98a3a", 5, [[46, 74], [50, 88]]);
      leuchtAuge(x, 28, 25, 1.8, 1.8, "#ff5a4a", 5); leuchtAuge(x, 52, 25, 1.8, 1.8, "#ff5a4a", 5);
      return c;
    }
  };

  /* Bild von der Seite mit dunklem Hintergrund: dunkle Pixel durchsichtig machen */
  function freistellen(img, schwelle) {
    const c = document.createElement("canvas"); c.width = img.naturalWidth; c.height = img.naturalHeight;
    const x = c.getContext("2d"); x.drawImage(img, 0, 0);
    try {
      const d = x.getImageData(0, 0, c.width, c.height), p = d.data;
      for (let i = 0; i < p.length; i += 4) {
        const l = Math.max(p[i], p[i + 1], p[i + 2]);
        if (l < schwelle) p[i + 3] = 0; else if (l < schwelle + 30) p[i + 3] = Math.min(p[i + 3], (l - schwelle) / 30 * 255);
      }
      x.putImageData(d, 0, 0);
    } catch (_) {}
    return c;
  }

  window.WALDLAUF_FIGUREN = { malen: (name, art) => F[name](art), freistellen };
})();
