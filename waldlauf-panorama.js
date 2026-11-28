/* =====================================================================
   FRIEDRICHS JAGD – PANORAMA (nur auf breiten Bildschirmen)
   Was links und rechts der Bühne zu sehen ist: Rahmenbäume, Felsen,
   Gebäude, Tiere, Lichter – je Kapitel passend – und viele kleine
   Anspielungen auf die Kampagne für alle, die genau hinsehen:
   Gundrens Ochsenkarren, Klargs Wölfe, Glasstabs zersplitterter Stab,
   Nezna als Fledermaus, der Flammenschädel in der Schmiede, Venomfang
   über Donnerbaum, Fagas im Kokon, ein Tentakel im See, Rex' Schöpf-
   kelle auf dem Markt, Themberchauds Auge in der Glut …
   Wird von waldlauf.js benutzt (window.WALDLAUF_PANO).
   ===================================================================== */
(function () {
  "use strict";
  const PI2 = Math.PI * 2;
  const zuf = seed => { let s = Math.max(1, Math.floor(seed) % 2147483646); return () => (s = (s * 16807) % 2147483647) / 2147483647; };

  /* ---------- Bausteine ---------- */
  function seitenX(info, s, f) { return s < 0 ? -info.L * f : info.W + info.R * f; }
  function tanne(x, px, basis, h, farbe, b) {
    const br = (b || 0.4) * h;
    x.fillStyle = farbe; x.beginPath(); x.moveTo(px, basis - h);
    for (let i = 1; i <= 6; i++) { const yy = basis - h + h * i / 6.4, ww = br * i / 6; x.lineTo(px + ww, yy); x.lineTo(px + ww * 0.42, yy - h * 0.035); }
    x.lineTo(px + br * 0.1, basis); x.lineTo(px - br * 0.1, basis);
    for (let i = 6; i >= 1; i--) { const yy = basis - h + h * i / 6.4, ww = br * i / 6; x.lineTo(px - ww * 0.42, yy - h * 0.035); x.lineTo(px - ww, yy); }
    x.closePath(); x.fill();
  }
  function laubbaum(x, px, basis, h, stamm, laub, s, r, t, wind) {
    const sw = Math.sin(t * 0.6 + px * 0.013) * (1.2 + Math.abs(wind) / 50);
    x.fillStyle = stamm; x.beginPath();
    x.moveTo(px - 18, basis + 4); x.bezierCurveTo(px - 9, basis - h * 0.35, px - 15, basis - h * 0.65, px - 5 + sw * 0.4, basis - h * 0.92);
    x.lineTo(px + 7 + sw * 0.4, basis - h * 0.92); x.bezierCurveTo(px + 3, basis - h * 0.62, px + 9, basis - h * 0.35, px + 20, basis + 4); x.closePath(); x.fill();
    for (let i = 0; i < 5; i++) { const wx = px + (i - 2) * 11; x.beginPath(); x.moveTo(wx - 5, basis + 4); x.quadraticCurveTo(wx + (i - 2) * 9, basis - 6, wx, basis - 22); x.lineTo(wx + 5, basis - 20); x.quadraticCurveTo(wx + (i - 2) * 12 + 5, basis - 2, wx + 9, basis + 4); x.fill(); }
    x.strokeStyle = stamm; x.lineCap = "round";
    for (let i = 0; i < 5; i++) {
      const ay = basis - h * (0.42 + i * 0.11), al = 40 + r() * 80, ar = (i % 2 ? -1 : 1) * (i < 2 ? -s : s);
      x.lineWidth = 8 - i * 1.3; x.beginPath(); x.moveTo(px, ay);
      x.quadraticCurveTo(px + ar * al * 0.5, ay - 14 - r() * 14 + sw * 2, px + ar * al + sw * 3, ay - 22 - r() * 22); x.stroke();
    }
    // Laub in Büscheln: jedes Büschel aus vielen kleinen Blattwolken, oben ein Hauch Mondlicht
    for (let i = 0; i < 16; i++) {
      const lx = px + (r() - 0.5) * 180 + sw * (3 + i * 0.2), ly = basis - h * (0.6 + r() * 0.48), lr = 14 + r() * 24;
      x.fillStyle = laub[i % laub.length];
      for (let k = 0; k < 9; k++) { const a = k / 9 * PI2 + i, d = lr * (0.35 + 0.5 * ((k * 7 + i) % 5) / 5); x.beginPath(); x.ellipse(lx + Math.cos(a) * d, ly + Math.sin(a) * d * 0.7, lr * 0.55, lr * 0.42, a, 0, PI2); x.fill(); }
      x.fillStyle = "rgba(170,160,200,.05)"; x.beginPath(); x.ellipse(lx - lr * 0.3, ly - lr * 0.45, lr * 0.7, lr * 0.3, -0.3, 0, PI2); x.fill();
      // einzelne Blätter am Rand
      for (let k = 0; k < 5; k++) { const a = r() * PI2, d = lr * (0.9 + r() * 0.3); x.fillStyle = laub[(i + k) % laub.length]; x.beginPath(); x.ellipse(lx + Math.cos(a) * d, ly + Math.sin(a) * d * 0.7, 3.2, 1.6, a + Math.sin(t + k) * 0.3, 0, PI2); x.fill(); }
    }
  }
  function fels(x, px, basis, b, h, farbe, kante, r) {
    x.fillStyle = farbe; x.beginPath(); x.moveTo(px - b / 2, basis);
    const n = 7; for (let i = 0; i <= n; i++) { const k = i / n, yy = basis - h * Math.sin(k * Math.PI) * (0.75 + r() * 0.35); x.lineTo(px - b / 2 + b * k, yy); }
    x.lineTo(px + b / 2, basis); x.closePath(); x.fill();
    if (kante) { x.strokeStyle = kante; x.lineWidth = 1; x.beginPath(); x.moveTo(px - b * 0.3, basis - h * 0.7); x.lineTo(px + b * 0.1, basis - h * 0.92); x.stroke(); }
  }
  function stalaktiten(x, a, b, oben, farbe, r, n, laenge) {
    x.fillStyle = farbe;
    for (let i = 0; i < n; i++) { const px = a + (b - a) * r(), w = 6 + r() * 16, l = laenge * (0.3 + r()); x.beginPath(); x.moveTo(px - w, oben); x.lineTo(px + w, oben); x.lineTo(px + r() * 3, oben + l); x.closePath(); x.fill(); }
  }
  function stalagmiten(x, a, b, basis, farbe, r, n, hoehe) {
    x.fillStyle = farbe;
    for (let i = 0; i < n; i++) { const px = a + (b - a) * r(), w = 8 + r() * 18, h = hoehe * (0.3 + r()); x.beginPath(); x.moveTo(px - w, basis); x.lineTo(px + w, basis); x.lineTo(px + (r() - 0.5) * 4, basis - h); x.closePath(); x.fill(); }
  }
  function glow(x, px, py, rad, farbe) {
    const g = x.createRadialGradient(px, py, 0, px, py, rad); g.addColorStop(0, farbe); g.addColorStop(1, farbe.replace(/[\d.]+\)$/, "0)"));
    x.fillStyle = g; x.fillRect(px - rad, py - rad, rad * 2, rad * 2);
  }
  function flamme(x, px, py, s, t) {
    for (let i = 0; i < 3; i++) {
      const f = ["rgba(255,120,40,.85)", "rgba(255,180,60,.9)", "rgba(255,240,180,.95)"][i], hh = (16 - i * 4.5) * s * (1 + 0.15 * Math.sin(t * 13 + i * 2)), ww = (6 - i * 1.6) * s;
      x.fillStyle = f; x.beginPath(); x.moveTo(px - ww, py); x.quadraticCurveTo(px - ww * 0.8, py - hh * 0.6, px + Math.sin(t * 9 + i) * 2 * s, py - hh); x.quadraticCurveTo(px + ww * 0.8, py - hh * 0.6, px + ww, py); x.closePath(); x.fill();
    }
  }
  function augen(x, px, py, t, farbe, abst, ph, gr) {
    const z = (t * 0.55 + (ph || 0)) % 6, offen = z < 5.8 ? 1 : 0.12;
    x.fillStyle = farbe; x.shadowColor = farbe; x.shadowBlur = 8;
    [-1, 1].forEach(s => { x.beginPath(); x.ellipse(px + s * (abst || 5), py, (gr || 2.1), (gr || 2.1) * offen, 0, 0, PI2); x.fill(); });
    x.shadowBlur = 0;
  }
  function vogel(x, px, py, s, t, farbe) {
    const fl = Math.sin(t * 11) * 4 * s;
    x.strokeStyle = farbe || "#0b0a0e"; x.lineWidth = 1.6 * s; x.beginPath();
    x.moveTo(px - 7 * s, py - fl); x.quadraticCurveTo(px - 3 * s, py - 2 * s, px, py); x.quadraticCurveTo(px + 3 * s, py - 2 * s, px + 7 * s, py - fl); x.stroke();
  }
  function fledermaus(x, px, py, s, t) {
    const fl = Math.sin(t * 18) * 0.9;
    x.fillStyle = "#0a090d"; x.beginPath(); x.moveTo(px, py);
    x.quadraticCurveTo(px - 6 * s, py - 6 * s * fl, px - 12 * s, py - 2 * s * fl); x.lineTo(px - 8 * s, py + 2 * s); x.lineTo(px - 4 * s, py + 1 * s);
    x.lineTo(px, py + 3 * s); x.lineTo(px + 4 * s, py + 1 * s); x.lineTo(px + 8 * s, py + 2 * s); x.lineTo(px + 12 * s, py - 2 * s * fl);
    x.quadraticCurveTo(px + 6 * s, py - 6 * s * fl, px, py); x.fill();
  }
  function funken(x, info, n, farbe, seed, auf) {
    const r = zuf(seed), t = info.t;
    for (let i = 0; i < n; i++) {
      const s = i % 2 ? -1 : 1, f = 0.06 + r() * 0.9, bx = seitenX(info, s, f), sp = 0.25 + r() * 0.6, ph = r() * 6.3;
      let yy = info.oben + (info.unten - info.oben) * (0.2 + r() * 0.75);
      if (auf) { yy = info.unten - ((t * (14 + r() * 22) + r() * 500) % (info.unten - info.oben)); }
      const xx = bx + Math.sin(t * sp + ph) * 12, a = auf ? 0.9 * Math.min(1, (yy - info.oben) / 120) : 0.2 + 0.8 * Math.max(0, Math.sin(t * (1.2 + r()) + ph));
      x.globalAlpha = Math.max(0, a); x.fillStyle = farbe; x.beginPath(); x.arc(xx, yy + (auf ? 0 : Math.cos(t * sp + ph) * 9), auf ? 1.1 : 1.4, 0, PI2); x.fill();
      x.globalAlpha = Math.max(0, a) * 0.22; x.beginPath(); x.arc(xx, yy, 5, 0, PI2); x.fill();
    }
    x.globalAlpha = 1;
  }
  function strahl(x, px, oben, unten, b, rgb, t, ph, a0) {
    const a = (a0 || 0.12) * (0.6 + 0.4 * Math.sin(t * 0.35 + (ph || 0)));
    const g = x.createLinearGradient(0, oben, 0, unten); g.addColorStop(0, "rgba(" + rgb + "," + a.toFixed(3) + ")"); g.addColorStop(1, "rgba(" + rgb + ",0)");
    x.fillStyle = g; x.beginPath(); x.moveTo(px - b * 0.25, oben); x.lineTo(px + b * 0.25, oben); x.lineTo(px + b * 0.8 + 50, unten); x.lineTo(px - b * 0.6 + 50, unten); x.closePath(); x.fill();
  }
  /* zyklisches Ereignis: liefert 0..1 während des Ereignisses, sonst -1 */
  function takt(t, periode, dauer, versatz) { const z = (t + (versatz || 0)) % periode; return z < dauer ? z / dauer : -1; }
  /* Boden der Seiten: dunkler Vordergrund-Erdwall mit Gras/Steinen */
  function vordergrund(x, info, farbe, r, gras) {
    [-1, 1].forEach(s => {
      x.fillStyle = farbe; x.beginPath();
      const a = s < 0 ? -info.L - 10 : info.W, b = s < 0 ? 0 : info.W + info.R + 10;
      x.moveTo(a, info.unten + 5);
      for (let k = 0; k <= 12; k++) { const px = a + (b - a) * k / 12, f = s < 0 ? 1 - k / 12 : k / 12; x.lineTo(px, info.unten - 18 - f * 46 - Math.sin(k * 1.7 + s) * 7); }
      x.lineTo(b, info.unten + 5); x.closePath(); x.fill();
      if (gras) {
        x.strokeStyle = gras; x.lineWidth = 1.3;
        for (let k = 0; k < 40; k++) {
          const f = r(), px = a + (b - a) * f, ff = s < 0 ? 1 - f : f, yy = info.unten - 18 - ff * 46 + 4, h = 8 + r() * 14, sw = Math.sin(info.t * 2 + px * 0.05) * 2.5;
          x.beginPath(); x.moveTo(px, yy); x.quadraticCurveTo(px + sw * 0.4, yy - h * 0.6, px + sw, yy - h); x.stroke();
        }
      }
    });
  }

  /* ---------- Kapitel ---------- */
  const MALER = {
    /* I · Der Weg nach Phandalin */
    strasse(x, info, w, u) {
      const t = info.t, wind = u.wind || 0, r = zuf(11);
      // ferne Laternen eines Gehöfts
      [[-1, 0.62], [1, 0.7]].forEach(([s, f]) => { const px = seitenX(info, s, f); glow(x, px, 286, 26, "rgba(255,170,80,.25)"); x.fillStyle = "rgba(255,190,110,.8)"; x.fillRect(px - 1.5, 284, 3, 3); });
      // Wegweiser nach Phandalin (rechts)
      const wx = seitenX(info, 1, 0.3);
      x.fillStyle = "#17110b"; x.fillRect(wx, 330, 4, 70); x.save(); x.translate(wx + 2, 340); x.rotate(-0.08);
      x.fillRect(-2, -8, 52, 13); x.beginPath(); x.moveTo(50, -8); x.lineTo(58, -1.5); x.lineTo(50, 5); x.fill();
      x.fillStyle = "rgba(224,160,70,.55)"; x.font = "7px serif"; x.fillText("PHANDALIN", 4, 1); x.restore();
      // Gundrens Ochsenkarren (links), mit Fass, Rad ab
      const kx = seitenX(info, -1, 0.42);
      x.fillStyle = "#130f0b"; x.save(); x.translate(kx, 392); x.rotate(0.06);
      x.fillRect(-46, -20, 84, 16); x.fillRect(-46, -34, 5, 16); x.fillRect(33, -34, 5, 16); x.fillRect(38, -14, 34, 3);
      x.strokeStyle = "#130f0b"; x.lineWidth = 3.5; x.beginPath(); x.arc(-28, 0, 12, 0, PI2); x.stroke();
      x.beginPath(); for (let k = 0; k < 6; k++) { x.moveTo(-28, 0); x.lineTo(-28 + Math.cos(k) * 12, Math.sin(k) * 12); } x.stroke();
      x.save(); x.translate(26, 8); x.rotate(1.2); x.beginPath(); x.ellipse(0, 0, 12, 4, 0, 0, PI2); x.stroke(); x.restore();
      x.fillStyle = "#1b140d"; x.beginPath(); x.ellipse(-10, -28, 9, 10, 0, 0, PI2); x.fill();
      x.restore();
      // Rahmenbäume
      laubbaum(x, seitenX(info, -1, 0.86), info.unten - 40, 430, "#0c0a08", ["#0d120b", "#0a0e09", "#10160e"], -1, zuf(3), t, wind);
      laubbaum(x, seitenX(info, 1, 0.84), info.unten - 34, 460, "#0b0908", ["#0c110b", "#090d08", "#0f150d"], 1, zuf(5), t, wind);
      // Eule im rechten Baum blinzelt
      const ex = seitenX(info, 1, 0.84) - 30, ey = info.unten - 34 - 300;
      x.fillStyle = "#0b0908"; x.beginPath(); x.ellipse(ex, ey, 9, 12, 0, 0, PI2); x.fill(); x.beginPath(); x.moveTo(ex - 8, ey - 8); x.lineTo(ex - 5, ey - 16); x.lineTo(ex - 1, ey - 10); x.lineTo(ex + 1, ey - 10); x.lineTo(ex + 5, ey - 16); x.lineTo(ex + 8, ey - 8); x.fill();
      augen(x, ex, ey - 4, t, "rgba(255,200,80,.95)", 3.6, 1.7, 2.2);
      // Goblin lugt aus dem Busch (immer wieder, kurz)
      const g = takt(t, 23, 3.2, 4);
      const bx = seitenX(info, -1, 0.18), by = info.unten - 60;
      if (g >= 0) {
        const hoch = Math.sin(Math.min(1, g * 1.4) * Math.PI) * 14;
        x.fillStyle = "#2b3a22"; x.beginPath(); x.ellipse(bx, by - hoch + 6, 9, 8, 0, 0, PI2); x.fill();
        x.beginPath(); x.moveTo(bx - 8, by - hoch + 2); x.lineTo(bx - 19, by - hoch - 3); x.lineTo(bx - 7, by - hoch + 6); x.fill();
        x.beginPath(); x.moveTo(bx + 8, by - hoch + 2); x.lineTo(bx + 19, by - hoch - 3); x.lineTo(bx + 7, by - hoch + 6); x.fill();
        augen(x, bx, by - hoch + 4, t * 3, "rgba(255,230,120,.9)", 3.2, 0, 1.4);
      }
      x.fillStyle = "#0d120b"; for (let i = 0; i < 6; i++) { x.beginPath(); x.ellipse(bx + (i - 2.5) * 11, by + 8 - Math.abs(i - 2.5) * 2, 13, 11, 0, 0, PI2); x.fill(); }
      // Reh trabt über die Lichtung (selten)
      const rh = takt(t, 47, 9, 20);
      if (rh >= 0) {
        const s = Math.floor(t / 47) % 2 ? -1 : 1, px = s < 0 ? -info.L + rh * info.L * 0.9 : info.W + info.R - rh * info.R * 0.9, py = 312, sch = Math.sin(rh * 60) * 1.5;
        x.fillStyle = "#120e0b"; x.save(); x.translate(px, py); x.scale(s < 0 ? 1 : -1, 1);
        x.beginPath(); x.ellipse(0, 0, 13, 6, 0, 0, PI2); x.fill(); x.fillRect(9, -12, 4, 12); x.beginPath(); x.ellipse(14, -13, 5, 3, 0.4, 0, PI2); x.fill();
        x.lineWidth = 1.6; x.strokeStyle = "#120e0b"; x.beginPath(); x.moveTo(-9, 4); x.lineTo(-10 - sch, 14); x.moveTo(-5, 4); x.lineTo(-4 + sch, 14); x.moveTo(7, 4); x.lineTo(8 + sch, 14); x.moveTo(10, 4); x.lineTo(11 - sch, 14); x.stroke();
        x.beginPath(); x.moveTo(13, -16); x.lineTo(11, -24); x.moveTo(15, -16); x.lineTo(17, -24); x.stroke();
        x.restore();
      }
      vordergrund(x, info, "#0a0d08", r, "#1b2416");
      funken(x, info, 22, "rgba(255,170,90,1)", 5, true);
      funken(x, info, 18, "rgba(200,240,140,1)", 9);
    },
    /* II · Die Goblinhöhle (Klargs Höhle am Wasserfall) */
    hoehle(x, info, w, u) {
      const t = info.t, r = zuf(21);
      // Höhlenmaul als Rahmen
      [-1, 1].forEach(s => {
        x.fillStyle = "#0a0a0c"; x.beginPath();
        const a = seitenX(info, s, 1.05), b = seitenX(info, s, 0.45);
        x.moveTo(a, info.oben); x.lineTo(b, info.oben);
        for (let k = 0; k <= 10; k++) { const f = k / 10; x.lineTo(b + (a - b) * Math.pow(f, 2.2) * 0.6 + Math.sin(k * 2.1) * 8, info.oben + (info.unten - info.oben) * f); }
        x.lineTo(a, info.unten); x.closePath(); x.fill();
        stalaktiten(x, Math.min(a, b), Math.max(a, b), info.oben, "#0d0d10", zuf(s + 30), 9, 60);
      });
      // Wasserfall rechts (rauscht)
      const wx = seitenX(info, 1, 0.3);
      for (let i = 0; i < 9; i++) { const yy = ((t * 120 + i * 60) % 260); x.fillStyle = "rgba(170,200,210," + (0.12 + (i % 3) * 0.04) + ")"; x.fillRect(wx + (i % 4) * 5, 140 + yy, 3, 40); }
      x.fillStyle = "rgba(170,200,210,.08)"; x.fillRect(wx - 3, 140, 26, 260);
      glow(x, wx + 10, 400, 40, "rgba(200,220,230,.16)");
      // Klargs Wölfe: Augenpaare im Dunkel links
      augen(x, seitenX(info, -1, 0.62), 370, t, "rgba(255,190,70,.8)", 4.5, 0.3);
      augen(x, seitenX(info, -1, 0.75), 395, t, "rgba(255,190,70,.7)", 4.5, 2.6);
      // Lagerfeuer der Goblins mit Spieß
      const fx = seitenX(info, -1, 0.3), fy = info.unten - 52;
      glow(x, fx, fy - 8, 70, "rgba(255,140,60,.3)");
      x.fillStyle = "#1a120c"; x.fillRect(fx - 14, fy, 28, 4); flamme(x, fx, fy, 1.2, t);
      x.strokeStyle = "#140e0a"; x.lineWidth = 2; x.beginPath(); x.moveTo(fx - 20, fy - 26); x.lineTo(fx + 20, fy - 26); x.moveTo(fx - 18, fy - 26); x.lineTo(fx - 18, fy + 2); x.moveTo(fx + 18, fy - 26); x.lineTo(fx + 18, fy + 2); x.stroke();
      x.fillStyle = "#3a2116"; x.beginPath(); x.ellipse(fx + Math.sin(t) * 0.5, fy - 26, 8, 4, t * 0.6, 0, PI2); x.fill();
      // Truhe mit Glitzern
      const tx2 = seitenX(info, 1, 0.62), ty = info.unten - 62;
      x.fillStyle = "#2a1a0e"; x.fillRect(tx2 - 14, ty - 12, 28, 14); x.fillStyle = "#3a2414"; x.beginPath(); x.ellipse(tx2, ty - 12, 14, 5, 0, Math.PI, PI2); x.fill();
      const gl = Math.max(0, Math.sin(t * 2.3)) ; x.fillStyle = "rgba(255,220,120," + (0.4 + 0.6 * gl) + ")"; x.beginPath(); x.moveTo(tx2 + 5, ty - 20 - gl * 3); x.lineTo(tx2 + 6, ty - 17); x.lineTo(tx2 + 9, ty - 16); x.lineTo(tx2 + 6, ty - 15); x.lineTo(tx2 + 5, ty - 12); x.lineTo(tx2 + 4, ty - 15); x.lineTo(tx2 + 1, ty - 16); x.lineTo(tx2 + 4, ty - 17); x.fill();
      // Fledermausschwarm (ab und zu)
      const fl = takt(t, 19, 4, 3);
      if (fl >= 0) for (let i = 0; i < 7; i++) fledermaus(x, seitenX(info, -1, 0.1 + fl * 0.9) + i * 9 - 30, 80 + Math.sin(fl * 9 + i) * 18 + i * 6, 0.8, t + i);
      stalagmiten(x, -info.L, 0, info.unten, "#0b0b0d", zuf(4), 5, 50);
      stalagmiten(x, info.W, info.W + info.R, info.unten, "#0b0b0d", zuf(6), 5, 50);
      funken(x, info, 26, "rgba(190,240,130,1)", 22);
    },
    /* III · Tresendar-Anwesen, Versteck der Rotmäntel */
    schloss(x, info, w, u) {
      const t = info.t, wind = u.wind || 0, r = zuf(31);
      [-1, 1].forEach(s => {
        // verfallene Mauer mit Spitzbogenfenster
        const a = seitenX(info, s, 0.95), b = seitenX(info, s, 0.5), lo = Math.min(a, b), hi = Math.max(a, b);
        x.fillStyle = "#0e0d10"; x.fillRect(lo, 150, hi - lo, info.unten - 150);
        x.fillStyle = "#0e0d10"; for (let k = 0; k < 6; k++) x.fillRect(lo + k * (hi - lo) / 6, 138 + (k % 2) * 4 + Math.sin(k * 7 + s) * 6, (hi - lo) / 9, 14);
        const fx = (lo + hi) / 2, flk = 0.75 + 0.25 * Math.sin(t * 7 + s) * Math.sin(t * 3.1);
        glow(x, fx, 220, 50, "rgba(255,150,70," + (0.22 * flk).toFixed(3) + ")");
        x.fillStyle = "rgba(255,170,90," + (0.55 * flk).toFixed(3) + ")"; x.beginPath(); x.moveTo(fx - 10, 250); x.lineTo(fx - 10, 210); x.quadraticCurveTo(fx, 192, fx + 10, 210); x.lineTo(fx + 10, 250); x.fill();
        x.fillStyle = "#0e0d10"; x.fillRect(fx - 1, 192, 2, 58); x.fillRect(fx - 10, 226, 20, 2);
        // Efeu
        x.strokeStyle = "#141c12"; x.lineWidth = 2; x.beginPath(); for (let k = 0; k < 12; k++) { const px = lo + (hi - lo) * r(); x.moveTo(px, 150); x.quadraticCurveTo(px + 8, 200, px - 4 + Math.sin(t + k) * 1.5, 230 + r() * 90); } x.stroke();
      });
      // rote Mäntel an der Leine (Rotmäntel!)
      const lx0 = seitenX(info, -1, 0.42), lx1 = seitenX(info, -1, 0.15);
      x.strokeStyle = "#1a140f"; x.lineWidth = 1; x.beginPath(); x.moveTo(lx0, 300); x.quadraticCurveTo((lx0 + lx1) / 2, 314, lx1, 300); x.stroke();
      for (let i = 0; i < 3; i++) { const px = lx0 + (lx1 - lx0) * (0.2 + i * 0.3), sw = Math.sin(t * 1.6 + i) * (2 + Math.abs(wind) / 30); x.fillStyle = ["#5a1a18", "#4a1614", "#621e1a"][i]; x.beginPath(); x.moveTo(px - 6, 309); x.lineTo(px + 6, 309); x.lineTo(px + 8 + sw, 336); x.lineTo(px - 8 + sw, 336); x.closePath(); x.fill(); }
      // Glasstabs zersplitterter Stab (glitzert)
      const gx = seitenX(info, 1, 0.3), gy = info.unten - 66;
      x.strokeStyle = "rgba(190,230,240,.5)"; x.lineWidth = 2; x.beginPath(); x.moveTo(gx - 16, gy + 4); x.lineTo(gx + 4, gy - 2); x.moveTo(gx + 8, gy); x.lineTo(gx + 22, gy + 4); x.stroke();
      for (let i = 0; i < 4; i++) { const sp = Math.max(0, Math.sin(t * 3 + i * 1.7)); x.fillStyle = "rgba(220,250,255," + (sp * 0.9).toFixed(2) + ")"; x.fillRect(gx - 10 + i * 9, gy - 3 - sp * 2, 1.5, 1.5); }
      // Ratten huschen
      const ra = takt(t, 13, 2.2, 1);
      if (ra >= 0) { const px = seitenX(info, 1, 0.9 - ra * 0.8), py = info.unten - 52; x.fillStyle = "#0a0908"; x.beginPath(); x.ellipse(px, py, 6, 3, 0, 0, PI2); x.fill(); x.strokeStyle = "#0a0908"; x.lineWidth = 0.8; x.beginPath(); x.moveTo(px + 6, py); x.quadraticCurveTo(px + 12, py - 4, px + 16, py + 1); x.stroke(); }
      vordergrund(x, info, "#09090b", r, "#171d14");
      funken(x, info, 16, "rgba(200,240,140,1)", 33);
    },
    /* IV · Der Wachturm (Nezna) */
    wachturm(x, info, w, u) {
      const t = info.t, wind = u.wind || 0, r = zuf(41);
      // ein zweiter, verfallener Turm links
      const tx = seitenX(info, -1, 0.55);
      x.fillStyle = "#0d0c10"; x.beginPath(); x.moveTo(tx - 30, info.unten); x.lineTo(tx - 24, 120); x.lineTo(tx + 24, 120); x.lineTo(tx + 30, info.unten); x.fill();
      for (let k = 0; k < 5; k++) x.fillRect(tx - 28 + k * 12, 104 + (k === 3 ? 10 : 0), 8, 18);
      const fl = 0.7 + 0.3 * Math.sin(t * 6) * Math.sin(t * 2.3); glow(x, tx, 180, 34, "rgba(255,160,80," + (0.25 * fl).toFixed(3) + ")"); x.fillStyle = "rgba(255,180,100," + (0.7 * fl).toFixed(2) + ")"; x.fillRect(tx - 4, 172, 8, 14);
      // Banner flattert
      x.fillStyle = "#14100e"; x.fillRect(tx + 20, 70, 2, 54);
      x.fillStyle = "#4a1a1a"; x.beginPath(); x.moveTo(tx + 22, 72);
      for (let k = 0; k <= 8; k++) x.lineTo(tx + 22 + k * 5, 72 + Math.sin(t * 5 + k * 0.9) * (2 + Math.abs(wind) / 40));
      for (let k = 8; k >= 0; k--) x.lineTo(tx + 22 + k * 5, 90 + Math.sin(t * 5 + k * 0.9) * (2 + Math.abs(wind) / 40)); x.fill();
      // Raben auf der Zinne rechts / Nezna als Fledermaus flieht
      const nz = takt(t, 31, 5, 12);
      if (nz >= 0) fledermaus(x, seitenX(info, 1, 0.05 + nz * 0.95), 160 - nz * 120 + Math.sin(nz * 20) * 10, 1.4, t);
      tanne(x, seitenX(info, 1, 0.8), info.unten - 20, 420, "#0b0e0a"); tanne(x, seitenX(info, 1, 0.55), info.unten - 40, 300, "#0d110c");
      tanne(x, seitenX(info, -1, 0.92), info.unten - 18, 440, "#0a0d09");
      for (let i = 0; i < 4; i++) vogel(x, seitenX(info, 1, 0.3 + i * 0.12) + Math.sin(t * 0.3 + i) * 30, 90 + i * 12 + Math.sin(t + i) * 6, 0.9, t + i * 0.7);
      vordergrund(x, info, "#090c08", r, "#1a2315");
      funken(x, info, 20, "rgba(200,240,140,1)", 44);
    },
    /* V · Wave Echo – die magische Schmiede */
    mine(x, info, w, u) {
      const t = info.t, r = zuf(51);
      [-1, 1].forEach(s => { const a = seitenX(info, s, 1.05), b = seitenX(info, s, 0); stalaktiten(x, Math.min(a, b), Math.max(a, b), info.oben, "#0c0b0d", zuf(s + 52), 14, 70); });
      // Stützbalken eines Stollens
      [-1, 1].forEach(s => { const px = seitenX(info, s, 0.3); x.fillStyle = "#17110b"; x.fillRect(px - 26, 220, 6, info.unten - 220); x.fillRect(px + 20, 220, 6, info.unten - 220); x.fillRect(px - 32, 214, 64, 8); x.fillStyle = "rgba(255,200,120,.1)"; x.fillRect(px - 26, 214, 52, 2); });
      // die Schmiede mit grüner Flamme (rechts)
      const sx = seitenX(info, 1, 0.62), sy = info.unten - 70;
      glow(x, sx, sy - 20, 110, "rgba(90,255,150,.22)");
      x.fillStyle = "#121114"; x.beginPath(); x.moveTo(sx - 40, sy + 10); x.lineTo(sx - 30, sy - 30); x.lineTo(sx + 30, sy - 30); x.lineTo(sx + 40, sy + 10); x.fill();
      x.fillStyle = "#0e0d10"; x.fillRect(sx - 10, sy - 90, 20, 60);
      for (let i = 0; i < 3; i++) { const f = ["rgba(80,240,140,.75)", "rgba(150,255,190,.85)", "rgba(230,255,240,.9)"][i], hh = (22 - i * 6) * (1 + 0.18 * Math.sin(t * 11 + i)); x.fillStyle = f; x.beginPath(); x.moveTo(sx - 14 + i * 4, sy - 28); x.quadraticCurveTo(sx - 10 + i * 3, sy - 28 - hh * 0.6, sx + Math.sin(t * 8 + i) * 3, sy - 28 - hh); x.quadraticCurveTo(sx + 10 - i * 3, sy - 28 - hh * 0.6, sx + 14 - i * 4, sy - 28); x.fill(); }
      // Amboss und Hammer
      x.fillStyle = "#1a191d"; x.beginPath(); x.moveTo(sx - 70, sy + 12); x.lineTo(sx - 66, sy); x.lineTo(sx - 80, sy - 6); x.lineTo(sx - 40, sy - 6); x.lineTo(sx - 50, sy); x.lineTo(sx - 46, sy + 12); x.fill();
      // Lore auf Schienen (links), rollt manchmal
      const lr = takt(t, 17, 6, 2), lx = seitenX(info, -1, lr >= 0 ? 0.95 - lr * 0.8 : 0.95), ly = info.unten - 48;
      x.strokeStyle = "#1c1814"; x.lineWidth = 1.5; x.beginPath(); x.moveTo(-info.L, ly + 10); x.lineTo(0, ly + 10); x.stroke();
      x.fillStyle = "#18140f"; x.beginPath(); x.moveTo(lx - 18, ly - 14); x.lineTo(lx + 18, ly - 14); x.lineTo(lx + 14, ly + 6); x.lineTo(lx - 14, ly + 6); x.fill();
      x.fillStyle = "#2e2a26"; x.beginPath(); x.ellipse(lx - 4, ly - 15, 8, 4, 0, 0, PI2); x.ellipse(lx + 7, ly - 16, 7, 4, 0, 0, PI2); x.fill();
      x.fillStyle = "#0e0c0a"; x.beginPath(); x.arc(lx - 9, ly + 8, 4, 0, PI2); x.arc(lx + 9, ly + 8, 4, 0, PI2); x.fill();
      // leuchtende Kristalle
      for (let i = 0; i < 9; i++) { const s = i % 2 ? -1 : 1, px = seitenX(info, s, 0.1 + r() * 0.85), py = 120 + r() * 300, h = 8 + r() * 14, a = 0.5 + 0.5 * Math.sin(t * 1.5 + i * 2); glow(x, px, py - h / 2, 18, "rgba(150,220,255," + (0.18 * a).toFixed(3) + ")"); x.fillStyle = "rgba(170,230,255," + (0.5 + 0.4 * a).toFixed(2) + ")"; x.beginPath(); x.moveTo(px - 3, py); x.lineTo(px, py - h); x.lineTo(px + 3, py); x.fill(); }
      // Flammenschädel schwebt vorbei (selten)
      const fs = takt(t, 41, 7, 25);
      if (fs >= 0) {
        const px = seitenX(info, -1, 0.85 - fs * 0.7), py = 150 + Math.sin(fs * 9) * 16;
        glow(x, px, py, 30, "rgba(90,255,150,.35)");
        for (let i = 0; i < 3; i++) { x.fillStyle = ["rgba(80,240,140,.7)", "rgba(160,255,200,.8)", "rgba(230,255,240,.9)"][i]; x.beginPath(); x.ellipse(px + Math.sin(t * 9 + i) * 2, py - 8 - i * 3, 9 - i * 2.5, 12 - i * 3, 0, 0, PI2); x.fill(); }
        x.fillStyle = "#e8e2d2"; x.beginPath(); x.ellipse(px, py, 8, 7, 0, 0, PI2); x.fill(); x.fillRect(px - 5, py + 4, 10, 5);
        x.fillStyle = "#0a0a0a"; x.beginPath(); x.arc(px - 3, py - 1, 2, 0, PI2); x.arc(px + 3, py - 1, 2, 0, PI2); x.fill();
      }
      funken(x, info, 24, "rgba(150,255,190,1)", 55, true);
    },
    /* VI · Donnerbaum, Venomfangs Ruinen */
    donnerbaum(x, info, w, u) {
      const t = info.t, wind = u.wind || 0, r = zuf(61);
      // ausgebrannte Häuser
      [-1, 1].forEach(s => {
        const px = seitenX(info, s, 0.5), b = 90;
        x.fillStyle = "#0e0d0f"; x.beginPath(); x.moveTo(px - b / 2, info.unten - 40); x.lineTo(px - b / 2, 300); x.lineTo(px - 10, 250); x.lineTo(px + 12, 272); x.lineTo(px + 22, 258); x.lineTo(px + b / 2, 300); x.lineTo(px + b / 2, info.unten - 40); x.fill();
        x.fillStyle = "rgba(255,140,60," + (0.25 + 0.2 * Math.sin(t * 5 + s)).toFixed(2) + ")"; x.fillRect(px - 20, 330, 12, 16); x.fillRect(px + 10, 330, 12, 16);
        x.fillStyle = "#0e0d0f"; x.fillRect(px - 15, 330, 2, 16); x.fillRect(px + 15, 330, 2, 16);
      });
      // der tote Riesenbaum, nach dem das Dorf heißt (links außen)
      const dx = seitenX(info, -1, 0.88);
      x.fillStyle = "#0b0a0c"; x.beginPath(); x.moveTo(dx - 26, info.unten); x.lineTo(dx - 14, 120); x.lineTo(dx + 14, 120); x.lineTo(dx + 26, info.unten); x.fill();
      x.strokeStyle = "#0b0a0c"; x.lineCap = "round";
      [[-60, 60, 8], [50, 80, 7], [-40, 30, 5], [70, 150, 6], [-80, 170, 5]].forEach(([dx2, dy, lw]) => { x.lineWidth = lw; x.beginPath(); x.moveTo(dx, 120 + dy * 0.4); x.quadraticCurveTo(dx + dx2 * 0.5, 100 + dy * 0.2, dx + dx2, 70 + dy * 0.3); x.stroke(); });
      // Venomfang kreist über dem Turm (rechts oben, selten)
      const vf = takt(t, 37, 10, 8);
      if (vf >= 0) {
        const a = vf * PI2, px = seitenX(info, 1, 0.5) + Math.cos(a) * 70, py = 90 + Math.sin(a) * 22, fl = Math.sin(t * 6) * 10, sk = 0.9 + Math.sin(a) * 0.15;
        x.save(); x.translate(px, py); x.scale(Math.cos(a) > 0 ? sk : -sk, sk);
        x.fillStyle = "#1a2a16"; x.beginPath(); x.moveTo(-26, 0); x.quadraticCurveTo(0, -6, 22, -2); x.lineTo(30, -5); x.lineTo(24, 2); x.quadraticCurveTo(0, 6, -26, 0); x.fill();
        x.beginPath(); x.moveTo(-6, -2); x.lineTo(-18, -22 - fl); x.lineTo(2, -4); x.moveTo(-2, -2); x.lineTo(10, -24 - fl); x.lineTo(8, -2); x.fill();
        x.beginPath(); x.moveTo(-26, 0); x.quadraticCurveTo(-40, 6, -50, 0); x.lineTo(-26, -2); x.fill();
        x.restore();
      }
      // Zweigplagen (Twig Blights) staksen
      for (let i = 0; i < 2; i++) {
        const tb = takt(t, 27, 8, i * 13);
        if (tb < 0) continue;
        const s = i ? 1 : -1, px = seitenX(info, s, 0.95 - tb * 0.7), py = info.unten - 54, st = Math.sin(tb * 50) * 4;
        x.strokeStyle = "#141008"; x.lineWidth = 1.6; x.beginPath();
        x.moveTo(px, py - 22); x.lineTo(px, py - 6); x.moveTo(px, py - 6); x.lineTo(px - 5 + st, py + 6); x.moveTo(px, py - 6); x.lineTo(px + 5 - st, py + 6);
        x.moveTo(px, py - 18); x.lineTo(px - 9, py - 26); x.moveTo(px, py - 16); x.lineTo(px + 10, py - 22); x.moveTo(px, py - 22); x.lineTo(px - 3, py - 32); x.lineTo(px + 2, py - 36); x.stroke();
        augen(x, px, py - 24, t, "rgba(170,255,90,.6)", 2, i, 1);
      }
      vordergrund(x, info, "#0a0909", r, "#1b1d14");
      funken(x, info, 30, "rgba(200,190,180,1)", 66, true);
    },
    /* VII · Velkynvelve – Ilvaras Gefängnis */
    gefaengnis(x, info, w, u) {
      const t = info.t, r = zuf(71);
      [-1, 1].forEach(s => {
        const a = seitenX(info, s, 1.05), b = seitenX(info, s, 0);
        stalaktiten(x, Math.min(a, b), Math.max(a, b), info.oben, "#0c0a10", zuf(s + 72), 10, 120);
        // Stalaktitenturm mit lila Feenfeuer-Fenstern
        const px = seitenX(info, s, 0.55);
        x.fillStyle = "#0e0b12"; x.beginPath(); x.moveTo(px - 30, info.oben); x.lineTo(px + 30, info.oben); x.lineTo(px + 18, 260); x.lineTo(px, 320); x.lineTo(px - 18, 260); x.fill();
        for (let k = 0; k < 4; k++) { const a2 = 0.5 + 0.5 * Math.sin(t * 1.3 + k + s); glow(x, px - 6 + (k % 2) * 12, 90 + k * 40, 16, "rgba(190,90,255," + (0.25 * a2).toFixed(3) + ")"); x.fillStyle = "rgba(210,140,255," + (0.5 + 0.4 * a2).toFixed(2) + ")"; x.fillRect(px - 8 + (k % 2) * 12, 86 + k * 40, 4, 7); }
      });
      // Brücke aus Netz zwischen den Türmen (links)
      x.strokeStyle = "rgba(200,200,220,.2)"; x.lineWidth = 1; x.beginPath(); const b0 = seitenX(info, -1, 0.55), b1 = seitenX(info, -1, 0.05);
      for (let k = 0; k < 3; k++) { x.moveTo(b0, 200 + k * 6); x.quadraticCurveTo((b0 + b1) / 2, 236 + k * 6, b1, 210 + k * 6); } x.stroke();
      // Ketten hängen, schwingen leicht
      for (let i = 0; i < 4; i++) {
        const s = i % 2 ? 1 : -1, px = seitenX(info, s, 0.2 + i * 0.12), len = 140 + i * 30, sw = Math.sin(t * 0.9 + i) * 4;
        x.strokeStyle = "#24212a"; x.lineWidth = 1.4;
        for (let k = 0; k < len / 8; k++) { const yy = k * 8, xx = px + sw * (yy / len); x.beginPath(); x.ellipse(xx, yy, 2.2, 4, 0, 0, PI2); x.stroke(); }
      }
      // Spinne lässt sich am Faden herab
      const sp = takt(t, 21, 8, 5);
      if (sp >= 0) { const px = seitenX(info, 1, 0.82), py = 30 + Math.sin(sp * Math.PI) * 220; x.strokeStyle = "rgba(210,210,230,.4)"; x.beginPath(); x.moveTo(px, 0); x.lineTo(px, py); x.stroke(); x.fillStyle = "#0a090c"; x.beginPath(); x.ellipse(px, py + 6, 6, 8, 0, 0, PI2); x.fill(); x.strokeStyle = "#0a090c"; x.lineWidth = 1.2; for (let k = 0; k < 4; k++) { x.beginPath(); x.moveTo(px, py + 4 + k * 2); x.lineTo(px - 10, py + k * 4); x.lineTo(px - 12, py + 10 + k * 3); x.moveTo(px, py + 4 + k * 2); x.lineTo(px + 10, py + k * 4); x.lineTo(px + 12, py + 10 + k * 3); x.stroke(); } augen(x, px, py + 2, t, "rgba(255,60,60,.8)", 2, 0, 1); }
      stalagmiten(x, -info.L, 0, info.unten, "#0b0a0e", zuf(73), 6, 60); stalagmiten(x, info.W, info.W + info.R, info.unten, "#0b0a0e", zuf(74), 6, 60);
      funken(x, info, 24, "rgba(220,150,255,1)", 77);
    },
    /* VIII · Spinnweben im Unterreich (Fagas im Kokon) */
    spinnweben(x, info, w, u) {
      const t = info.t, r = zuf(81);
      // Riesennetze
      [-1, 1].forEach(s => {
        const cx = seitenX(info, s, 0.55), cy = 170, rad = Math.min(info.L, info.R) * 0.55 + 40;
        x.strokeStyle = "rgba(210,215,230,.18)"; x.lineWidth = 0.9;
        for (let k = 0; k < 12; k++) { const a = k / 12 * PI2; x.beginPath(); x.moveTo(cx, cy); x.lineTo(cx + Math.cos(a) * rad, cy + Math.sin(a) * rad); x.stroke(); }
        for (let ring = 1; ring < 8; ring++) { x.beginPath(); for (let k = 0; k <= 12; k++) { const a = k / 12 * PI2, rr = rad * ring / 8 * (0.95 + 0.05 * Math.sin(k * 3)); const px = cx + Math.cos(a) * rr, py = cy + Math.sin(a) * rr + Math.sin(t + ring) * 0.6; k ? x.lineTo(px, py) : x.moveTo(px, py); } x.stroke(); }
        // Tautropfen glitzern
        for (let k = 0; k < 10; k++) { const a = r() * PI2, rr = rad * r(), g = Math.max(0, Math.sin(t * 2 + k * 1.3)); x.fillStyle = "rgba(220,240,255," + (0.2 + 0.7 * g).toFixed(2) + ")"; x.fillRect(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr, 1.4, 1.4); }
      });
      // Kokon – Fagas zappelt und ruft
      const kx = seitenX(info, 1, 0.35), ky = 270, zap = Math.sin(t * 7) * (Math.sin(t * 0.8) > 0.6 ? 2.5 : 0.3);
      x.strokeStyle = "rgba(210,215,230,.35)"; x.beginPath(); x.moveTo(kx, 0); x.lineTo(kx + zap, ky - 30); x.stroke();
      x.save(); x.translate(kx + zap, ky); x.rotate(zap * 0.03);
      x.fillStyle = "#cfcabd"; x.beginPath(); x.ellipse(0, 0, 13, 30, 0, 0, PI2); x.fill();
      x.strokeStyle = "rgba(150,145,135,.6)"; x.lineWidth = 1; for (let k = -24; k < 26; k += 6) { x.beginPath(); x.moveTo(-12, k); x.quadraticCurveTo(0, k + 4, 12, k + 2); x.stroke(); }
      x.restore();
      if (Math.sin(t * 0.8) > 0.6) { x.fillStyle = "rgba(235,226,204,.85)"; x.font = "italic 10px serif"; x.textAlign = "center"; x.fillText("Hallo? Ist da wer?", kx, ky - 44); }
      // weitere Kokons, kleinere
      for (let i = 0; i < 4; i++) { const px = seitenX(info, i % 2 ? -1 : 1, 0.2 + i * 0.18), py = 80 + i * 40; x.fillStyle = "rgba(200,195,185,.6)"; x.beginPath(); x.ellipse(px, py, 5, 11, 0, 0, PI2); x.fill(); }
      // leuchtende Pilze am Boden
      for (let i = 0; i < 14; i++) { const s = i % 2 ? -1 : 1, px = seitenX(info, s, 0.05 + r() * 0.9), py = info.unten - 30 - r() * 40, h = 6 + r() * 10, a = 0.5 + 0.5 * Math.sin(t * 1.2 + i); glow(x, px, py - h, 16, "rgba(120,255,200," + (0.2 * a).toFixed(3) + ")"); x.fillStyle = "#1a2a26"; x.fillRect(px - 1, py - h, 2, h); x.fillStyle = "rgba(140,255,210," + (0.5 + 0.4 * a).toFixed(2) + ")"; x.beginPath(); x.ellipse(px, py - h, 6, 3.5, 0, Math.PI, PI2); x.fill(); }
      // Spinnen krabbeln über das Netz
      for (let i = 0; i < 2; i++) { const s = i ? -1 : 1, a = t * 0.3 + i * 3, px = seitenX(info, s, 0.55) + Math.cos(a) * 60, py = 170 + Math.sin(a * 1.3) * 60; x.fillStyle = "#0a090c"; x.beginPath(); x.ellipse(px, py, 4, 5, 0, 0, PI2); x.fill(); augen(x, px, py - 2, t, "rgba(255,70,70,.8)", 1.5, i, 0.8); }
      funken(x, info, 30, "rgba(160,255,220,1)", 88, true);
    },
    /* IX · Der See von Sloobludop (Demogorgon!) */
    see(x, info, w, u) {
      const t = info.t, r = zuf(91);
      [-1, 1].forEach(s => { const a = seitenX(info, s, 1.05), b = seitenX(info, s, 0); stalaktiten(x, Math.min(a, b), Math.max(a, b), info.oben, "#090b0f", zuf(s + 92), 12, 90); });
      // Wasserfläche mit Spiegelungen
      [-1, 1].forEach(s => {
        const a = s < 0 ? -info.L : info.W, b = s < 0 ? 0 : info.W + info.R;
        const g = x.createLinearGradient(0, 300, 0, info.unten); g.addColorStop(0, "rgba(30,60,70,.35)"); g.addColorStop(1, "rgba(8,14,18,.6)"); x.fillStyle = g; x.fillRect(a, 300, b - a, info.unten - 300);
        x.strokeStyle = "rgba(140,200,210,.14)"; x.lineWidth = 1;
        for (let k = 0; k < 14; k++) { const yy = 310 + k * 13, ph = t * 0.8 + k; x.beginPath(); for (let xx = a; xx <= b; xx += 12) x.lineTo(xx, yy + Math.sin(xx * 0.05 + ph) * 1.5); x.stroke(); }
      });
      // Pilzhütten der Kuo-Toa (Treibholz) mit Laternen
      [-1, 1].forEach(s => { const px = seitenX(info, s, 0.4); x.fillStyle = "#0f1214"; x.fillRect(px - 30, 290, 60, 30); x.beginPath(); x.moveTo(px - 36, 292); x.lineTo(px, 262); x.lineTo(px + 36, 292); x.fill(); for (let k = 0; k < 4; k++) x.fillRect(px - 28 + k * 18, 320, 3, 30); const a = 0.6 + 0.4 * Math.sin(t * 2 + s); glow(x, px + 20, 300, 30, "rgba(120,255,200," + (0.25 * a).toFixed(3) + ")"); x.fillStyle = "rgba(150,255,210," + a.toFixed(2) + ")"; x.beginPath(); x.arc(px + 20, 300, 3, 0, PI2); x.fill(); });
      // Kuo-Toa-Wachen (Fischköpfe)
      [-1, 1].forEach(s => { const px = seitenX(info, s, 0.68), py = 320; x.fillStyle = "#121a1a"; x.beginPath(); x.ellipse(px, py - 16, 7, 9, 0, 0, PI2); x.fill(); x.fillRect(px - 5, py - 8, 10, 22); x.strokeStyle = "#121a1a"; x.lineWidth = 1.5; x.beginPath(); x.moveTo(px + 8, py - 30); x.lineTo(px + 8, py + 14); x.stroke(); augen(x, px, py - 17, t, "rgba(220,255,140,.75)", 3.5, s, 1.4); });
      // Blasen steigen auf
      for (let i = 0; i < 12; i++) { const s = i % 2 ? -1 : 1, px = seitenX(info, s, 0.1 + (i * 0.083) % 0.9), yy = info.unten - ((t * 18 + i * 40) % 180); x.strokeStyle = "rgba(170,220,230,.35)"; x.beginPath(); x.arc(px + Math.sin(t * 2 + i) * 2, yy, 1.5 + (i % 3), 0, PI2); x.stroke(); }
      // Fisch springt
      const fi = takt(t, 11, 1.2, 3);
      if (fi >= 0) { const s = Math.floor(t / 11) % 2 ? 1 : -1, px = seitenX(info, s, 0.25 + fi * 0.15), py = 330 - Math.sin(fi * Math.PI) * 30; x.fillStyle = "#3a5a5e"; x.save(); x.translate(px, py); x.rotate((fi - 0.5) * 2); x.beginPath(); x.ellipse(0, 0, 6, 2.5, 0, 0, PI2); x.fill(); x.beginPath(); x.moveTo(-5, 0); x.lineTo(-10, -3); x.lineTo(-10, 3); x.fill(); x.restore(); }
      // Demogorgons Tentakel taucht auf (selten!)
      const de = takt(t, 53, 9, 30);
      if (de >= 0) {
        const hoch = Math.sin(de * Math.PI) * 220, px = seitenX(info, -1, 0.7);
        for (let k = 0; k < 2; k++) {
          const bx = px + k * 46, h2 = hoch * (1 - k * 0.25);
          x.fillStyle = "#2a1424"; x.beginPath(); x.moveTo(bx - 12, 340);
          for (let i = 0; i <= 10; i++) { const f = i / 10; x.lineTo(bx - 12 * (1 - f) + Math.sin(f * 4 + t * 2 + k) * 18 * f, 340 - h2 * f); }
          for (let i = 10; i >= 0; i--) { const f = i / 10; x.lineTo(bx + 12 * (1 - f) + Math.sin(f * 4 + t * 2 + k) * 18 * f + 2, 340 - h2 * f); }
          x.fill();
          x.fillStyle = "rgba(200,140,180,.35)"; for (let i = 1; i < 8; i++) { const f = i / 10; x.beginPath(); x.arc(bx + 4 + Math.sin(f * 4 + t * 2 + k) * 18 * f, 340 - h2 * f, 2.5 * (1 - f), 0, PI2); x.fill(); }
        }
        x.strokeStyle = "rgba(170,220,230,.4)"; x.beginPath(); x.ellipse(px + 23, 342, 50, 6, 0, 0, PI2); x.stroke();
      }
      funken(x, info, 22, "rgba(150,255,220,1)", 99);
    },
    /* X · Gracklstugh, Stadt der Duergar */
    gracklstugh(x, info, w, u) {
      const t = info.t, r = zuf(101);
      // Schmiedeschlote mit Rauch und Glut
      [-1, 1].forEach(s => {
        for (let k = 0; k < 3; k++) {
          const px = seitenX(info, s, 0.2 + k * 0.3), hh = 140 + k * 40 + (s > 0 ? 20 : 0);
          x.fillStyle = "#100e0e"; x.fillRect(px - 9, info.unten - hh - 80, 18, hh + 80); x.fillRect(px - 12, info.unten - hh - 86, 24, 8);
          glow(x, px, info.unten - hh - 90, 26, "rgba(255,110,40," + (0.25 + 0.15 * Math.sin(t * 3 + k)).toFixed(3) + ")");
          for (let i = 0; i < 6; i++) { const yy = (t * 14 + i * 22 + k * 7) % 130, a = 1 - yy / 130; x.fillStyle = "rgba(40,34,36," + (0.5 * a).toFixed(2) + ")"; x.beginPath(); x.arc(px + Math.sin(t * 0.7 + i) * 6 + yy * 0.2, info.unten - hh - 90 - yy, 6 + yy * 0.12, 0, PI2); x.fill(); }
        }
        // Häuserzeile mit Glutfenstern
        const a = seitenX(info, s, 1.02), b = seitenX(info, s, 0.02), lo = Math.min(a, b), hi = Math.max(a, b);
        for (let xx = lo; xx < hi; xx += 34) { const h2 = 60 + ((xx * 7) % 50); x.fillStyle = "#0d0c0d"; x.fillRect(xx, info.unten - 40 - h2, 30, h2 + 40); x.fillStyle = "rgba(255,130,50," + (0.35 + 0.25 * Math.sin(t * 2 + xx)).toFixed(2) + ")"; x.fillRect(xx + 8, info.unten - 30 - h2 * 0.6, 6, 8); x.fillRect(xx + 18, info.unten - 30 - h2 * 0.3, 6, 8); }
      });
      // Funkenregen eines Hammerschlags (rechts)
      const ha = takt(t, 2.4, 0.5, 0), hx = seitenX(info, 1, 0.45), hy = info.unten - 70;
      if (ha >= 0) for (let i = 0; i < 12; i++) { const a = -Math.PI / 2 + (i - 6) * 0.25, d = ha * 40; x.fillStyle = "rgba(255,210,120," + (1 - ha).toFixed(2) + ")"; x.fillRect(hx + Math.cos(a) * d, hy + Math.sin(a) * d + ha * ha * 30, 1.6, 1.6); }
      // Marktstand mit Schöpfkellen (eine fehlt – Rex hat sie)
      const mx = seitenX(info, -1, 0.35), my = info.unten - 60;
      x.fillStyle = "#1a120d"; x.fillRect(mx - 34, my - 4, 68, 8); x.fillRect(mx - 32, my - 50, 4, 56); x.fillRect(mx + 28, my - 50, 4, 56);
      x.fillStyle = "#3a1e18"; x.beginPath(); x.moveTo(mx - 40, my - 50); x.lineTo(mx + 40, my - 50); x.lineTo(mx + 34, my - 60); x.lineTo(mx - 34, my - 60); x.fill();
      x.strokeStyle = "#7a7468"; x.lineWidth = 1.3; for (let i = 0; i < 4; i++) { const px = mx - 20 + i * 12; if (i === 2) continue; x.beginPath(); x.moveTo(px, my - 46); x.lineTo(px, my - 30); x.stroke(); x.beginPath(); x.arc(px, my - 27, 3.5, 0, Math.PI); x.stroke(); }
      x.strokeStyle = "rgba(122,116,104,.35)"; x.setLineDash([2, 2]); x.beginPath(); x.moveTo(mx + 4, my - 46); x.lineTo(mx + 4, my - 30); x.stroke(); x.setLineDash([]);
      // ferner Steinriese wandert (selten)
      const ri = takt(t, 61, 16, 10);
      if (ri >= 0) { const px = seitenX(info, 1, 0.95 - ri * 0.8), py = 240, st = Math.sin(ri * 40) * 3; x.fillStyle = "rgba(20,18,20,.85)"; x.beginPath(); x.ellipse(px, py, 16, 26, 0, 0, PI2); x.fill(); x.beginPath(); x.arc(px, py - 32, 9, 0, PI2); x.fill(); x.fillRect(px - 10, py + 20, 7, 30 + st); x.fillRect(px + 3, py + 20, 7, 30 - st); }
      funken(x, info, 34, "rgba(255,150,70,1)", 111, true);
    },
    /* XI · Themberchauds Halle (Lava und Gold) */
    slums(x, info, w, u) {
      const t = info.t, r = zuf(121);
      // Lavaströme an den Wänden
      [-1, 1].forEach(s => {
        const px = seitenX(info, s, 0.75);
        for (let k = 0; k < 3; k++) { const g = x.createLinearGradient(0, info.oben, 0, info.unten); g.addColorStop(0, "rgba(255,90,30,0)"); g.addColorStop(0.5, "rgba(255,110,40,.5)"); g.addColorStop(1, "rgba(255,170,60,.7)"); x.fillStyle = g; x.beginPath(); x.moveTo(px - 4 + k * 22, info.oben); for (let yy = info.oben; yy <= info.unten; yy += 20) x.lineTo(px + k * 22 + Math.sin(yy * 0.05 + k + t * 0.6) * 6, yy); for (let yy = info.unten; yy >= info.oben; yy -= 20) x.lineTo(px + 6 + k * 22 + Math.sin(yy * 0.05 + k + t * 0.6) * 6, yy); x.fill(); }
        glow(x, px + 20, info.unten - 40, 120, "rgba(255,110,40,.2)");
      });
      // Goldberge glitzern
      [-1, 1].forEach(s => {
        const px = seitenX(info, s, 0.35), py = info.unten - 30;
        x.fillStyle = "#4a3410"; x.beginPath(); x.moveTo(px - 70, py); x.quadraticCurveTo(px, py - 90, px + 70, py); x.fill();
        x.fillStyle = "#6a4a16"; x.beginPath(); x.moveTo(px - 50, py); x.quadraticCurveTo(px, py - 66, px + 50, py); x.fill();
        for (let k = 0; k < 10; k++) { const a = Math.max(0, Math.sin(t * 2.5 + k * 1.9 + s)), qx = px - 40 + r() * 80, qy = py - r() * 50; x.fillStyle = "rgba(255,230,150," + (a * 0.95).toFixed(2) + ")"; x.fillRect(qx - a, qy, 1 + a * 2, 1); x.fillRect(qx, qy - a, 1, 1 + a * 2); }
      });
      // eine Münze rollt den Berg hinab
      const mz = takt(t, 9, 2.5, 1);
      if (mz >= 0) { const px = seitenX(info, 1, 0.35) + 10 + mz * 60, py = info.unten - 66 + mz * 36 + Math.abs(Math.sin(mz * 12)) * -4; x.fillStyle = "#e0b24a"; x.beginPath(); x.ellipse(px, py, 2.2 * Math.abs(Math.cos(mz * 20)) + 0.6, 3, 0, 0, PI2); x.fill(); }
      // Themberchauds Auge öffnet sich in der Dunkelheit (selten)
      const au = takt(t, 43, 6, 20);
      if (au >= 0) { const px = seitenX(info, -1, 0.55), py = 140, o = Math.sin(au * Math.PI); glow(x, px, py, 50, "rgba(255,160,40," + (0.3 * o).toFixed(3) + ")"); x.fillStyle = "rgba(255,190,60," + o.toFixed(2) + ")"; x.beginPath(); x.ellipse(px, py, 22, 10 * o, 0, 0, PI2); x.fill(); x.fillStyle = "rgba(20,8,4," + o.toFixed(2) + ")"; x.beginPath(); x.ellipse(px + Math.sin(t) * 4, py, 3, 9 * o, 0, 0, PI2); x.fill(); }
      // Gartokkars goldenes Zeichen an der Säule
      const gx = seitenX(info, 1, 0.75), gy = 200; x.fillStyle = "#120e0c"; x.fillRect(gx - 14, info.oben, 28, info.unten);
      x.strokeStyle = "rgba(230,180,80,.55)"; x.lineWidth = 1.5; x.beginPath(); x.arc(gx, gy, 8, 0, PI2); x.moveTo(gx, gy - 8); x.lineTo(gx, gy - 16); x.moveTo(gx - 6, gy - 13); x.lineTo(gx, gy - 18); x.lineTo(gx + 6, gy - 13); x.stroke();
      funken(x, info, 40, "rgba(255,160,70,1)", 122, true);
    },
    /* XII · Das Ei des Drachen: Erztunnel, Leichenhöhle, Pilzgang, Labor der Duergar */
    labor(x, info, w, u) {
      const t = info.t, r = zuf(131);
      stalaktiten(x, -info.L, 0, info.oben, "#08070a", r, 14, 70); stalaktiten(x, info.W, info.W + info.R, info.oben, "#08070a", r, 14, 70);
      // Erzadern (Teal und Gold) mit sanftem Pulsieren
      [-1, 1].forEach(s => {
        for (let k = 0; k < 7; k++) {
          const px = seitenX(info, s, 0.1 + r() * 0.85), py = info.oben + 60 + r() * 220, gold = r() < 0.4;
          x.strokeStyle = gold ? "rgba(224,160,70,.16)" : "rgba(90,200,170," + (0.08 + 0.06 * Math.sin(t * 0.8 + k)).toFixed(3) + ")"; x.lineWidth = 1.2;
          x.beginPath(); x.moveTo(px, py); let qx = px; for (let j = 1; j < 5; j++) { qx += (r() - 0.5) * 16; x.lineTo(qx, py + j * 9); } x.stroke();
        }
      });
      // links: Erztunnel mit Grubenwagen und Schienen
      const tx0 = seitenX(info, -1, 0.55), ty = info.unten - 40;
      x.fillStyle = "#050406"; x.beginPath(); x.moveTo(tx0 - 70, ty); x.lineTo(tx0 - 70, ty - 110); x.quadraticCurveTo(tx0, ty - 170, tx0 + 70, ty - 110); x.lineTo(tx0 + 70, ty); x.fill();
      x.strokeStyle = "#3a2a1a"; x.lineWidth = 9; x.beginPath(); x.moveTo(tx0 - 74, ty); x.lineTo(tx0 - 74, ty - 112); x.lineTo(tx0 + 74, ty - 112); x.lineTo(tx0 + 74, ty); x.stroke();
      x.strokeStyle = "#2a2420"; x.lineWidth = 2; x.beginPath(); x.moveTo(tx0 - 40, ty); x.lineTo(-4, ty + 6); x.moveTo(tx0 - 30, ty - 8); x.lineTo(-4, ty - 2); x.stroke();
      const wg = takt(t, 23, 7, 3), wx = wg >= 0 ? tx0 - 30 + wg * (info.L * 0.5) : tx0 + 10;
      x.fillStyle = "#2a2018"; x.fillRect(wx - 22, ty - 30, 44, 22); x.fillStyle = "#14100c"; x.beginPath(); x.arc(wx - 13, ty - 6, 6, 0, PI2); x.arc(wx + 13, ty - 6, 6, 0, PI2); x.fill();
      x.fillStyle = "#4a6a60"; for (let k = 0; k < 5; k++) { x.beginPath(); x.arc(wx - 14 + k * 7, ty - 32 - (k % 2) * 4, 5, 0, PI2); x.fill(); }
      // Knochenhaufen beidseits, ein Schädel blinzelt (?)
      [-1, 1].forEach(s => {
        const bx = seitenX(info, s, 0.3), by = info.unten - 28;
        for (let k = 0; k < 26; k++) { x.save(); x.translate(bx + (r() - 0.5) * 110, by - r() * 26); x.rotate(r() * 3); x.fillStyle = k % 3 ? "#3a352e" : "#4a443a"; x.fillRect(-10, -2, 20, 4); x.beginPath(); x.arc(-10, 0, 3, 0, PI2); x.arc(10, 0, 3, 0, PI2); x.fill(); x.restore(); }
        x.fillStyle = "#565046"; x.beginPath(); x.arc(bx + s * 18, by - 30, 11, Math.PI, 0); x.fill(); x.fillRect(bx + s * 18 - 7, by - 30, 14, 7);
        const bl = takt(t, 17, 0.4, s * 5) >= 0;
        x.fillStyle = bl ? "rgba(156,255,90,.9)" : "#0a0808"; x.fillRect(bx + s * 18 - 6, by - 36, 4, 4); x.fillRect(bx + s * 18 + 2, by - 36, 4, 4);
      });
      // Riesenpilze, die im Atemtakt glühen
      [[-1, 0.82, 70], [-1, 0.2, 46], [1, 0.25, 58], [1, 0.88, 80]].forEach(([s, f, h], i) => {
        const px = seitenX(info, s, f), py = info.unten - 30;
        x.fillStyle = "#241c2a"; x.fillRect(px - h * 0.08, py - h, h * 0.16, h);
        x.fillStyle = "#3a2a44"; x.beginPath(); x.ellipse(px, py - h, h * 0.62, h * 0.26, 0, Math.PI, 0); x.fill();
        glow(x, px, py - h - 4, h * 0.9, "rgba(200,138,255," + (0.12 + 0.07 * Math.sin(t * 1.1 + i)).toFixed(3) + ")");
        x.fillStyle = "rgba(220,180,255,.6)"; for (let k = 0; k < 5; k++) { x.beginPath(); x.arc(px + (k - 2) * h * 0.2, py - h - h * 0.12, 1.8, 0, PI2); x.fill(); }
      });
      // rechts: Alchemietisch der Duergar mit blubbernden Kolben
      const lx = seitenX(info, 1, 0.55), ly = info.unten - 70;
      x.fillStyle = "#1a1416"; x.fillRect(lx - 70, ly, 140, 10); x.fillRect(lx - 62, ly + 10, 8, 40); x.fillRect(lx + 54, ly + 10, 8, 40);
      [["156,255,90", -48], ["200,138,255", -14], ["255,207,122", 20], ["255,122,90", 50]].forEach(([c, dx], i) => {
        const px = lx + dx, py = ly - 12;
        x.fillStyle = "rgba(210,225,220,.22)"; x.beginPath(); x.arc(px, py, 12 - (i % 2) * 3, 0, PI2); x.fill(); x.fillRect(px - 3, py - 32, 6, 22);
        x.fillStyle = "rgba(" + c + ",.6)"; x.beginPath(); x.arc(px, py + 1, 10 - (i % 2) * 3, 0, Math.PI); x.fill();
        glow(x, px, py, 30, "rgba(" + c + ",.16)");
        for (let k = 0; k < 3; k++) { const ph = (t * (0.7 + i * 0.15) + k / 3) % 1; x.fillStyle = "rgba(240,255,230," + (0.7 * (1 - ph)).toFixed(2) + ")"; x.beginPath(); x.arc(px + Math.sin(ph * 9 + i) * 3, py - 8 - ph * 40, 1.4 + ph * 2, 0, PI2); x.fill(); }
      });
      // Rauch aus dem Destillierrohr
      for (let k = 0; k < 5; k++) { const ph = (t * 0.25 + k / 5) % 1; x.fillStyle = "rgba(140,200,120," + (0.12 * (1 - ph)).toFixed(3) + ")"; x.beginPath(); x.arc(lx - 14 + Math.sin(t + k) * 8 + ph * 20, ly - 50 - ph * 140, 8 + ph * 22, 0, PI2); x.fill(); }
      // Buppido lugt hinter dem Pilz hervor und hält sein Schild hoch
      const bu = takt(t, 37, 7, 12);
      if (bu >= 0) {
        const o = Math.sin(bu * Math.PI), px = seitenX(info, -1, 0.2) + 26 * o, py = info.unten - 40;
        x.fillStyle = "#1e1618"; x.beginPath(); x.arc(px, py - 26, 8, 0, PI2); x.fill(); x.fillRect(px - 8, py - 18, 16, 18);
        x.fillStyle = "rgba(255,230,160,.9)"; x.fillRect(px - 4, py - 28, 2, 2); x.fillRect(px + 2, py - 28, 2, 2);
        x.strokeStyle = "#3a2818"; x.lineWidth = 2; x.beginPath(); x.moveTo(px + 8, py - 10); x.lineTo(px + 14, py - 48); x.stroke();
        x.fillStyle = "#d8c8a0"; x.fillRect(px - 4, py - 64, 38, 17);
        x.fillStyle = "#3a1a10"; x.font = "bold 11px Georgia, serif"; x.textAlign = "center"; x.textBaseline = "middle"; x.fillText("Altar?", px + 15, py - 55); x.textBaseline = "alphabetic";
      }
      // ein namenloser Geist zieht vorbei und flüstert
      const gz = takt(t, 29, 9, 4);
      if (gz >= 0) {
        const px = seitenX(info, 1, 0.95 - gz * 0.85), py = info.oben + 150 + Math.sin(gz * 9) * 12, a = Math.sin(gz * Math.PI) * 0.3;
        glow(x, px, py, 40, "rgba(210,230,255," + a.toFixed(3) + ")");
        x.fillStyle = "rgba(220,235,255," + (a * 1.3).toFixed(3) + ")"; x.beginPath(); x.arc(px, py - 10, 9, 0, PI2); x.moveTo(px - 10, py - 6); x.quadraticCurveTo(px - 12, py + 20, px - 2, py + 26); x.quadraticCurveTo(px + 4, py + 18, px + 12, py + 24); x.quadraticCurveTo(px + 12, py, px + 10, py - 6); x.fill();
      }
      // eine Münze liegt im Dreck und blitzt
      const mx = seitenX(info, 1, 0.12), my = info.unten - 34, mg = Math.max(0, Math.sin(t * 1.7)) ** 10;
      x.fillStyle = "#b08a3a"; x.beginPath(); x.ellipse(mx, my, 4, 2, 0, 0, PI2); x.fill(); if (mg > 0.05) glow(x, mx, my, 12, "rgba(255,230,150," + (0.9 * mg).toFixed(2) + ")");
      funken(x, info, 26, "rgba(200,138,255,1)", 133, false);
      funken(x, info, 14, "rgba(156,255,90,1)", 134, true);
    }
  };

  /* XIII · Das Dorf der Riesen: Steinbruchwände, riesige Stiefel, ein Riese schiebt seinen Wagen, Hgraams Kristall */
  MALER.riesendorf = function (x, info) {
    const t = info.t, r = zuf(141);
    stalaktiten(x, -info.L, 0, info.oben, "#0a0806", r, 10, 60); stalaktiten(x, info.W, info.W + info.R, info.oben, "#0a0806", r, 10, 60);
    [-1, 1].forEach(s => {
      // Abbaustufen im Fels
      for (let k = 0; k < 5; k++) { const a = seitenX(info, s, 1.02), b = seitenX(info, s, 0.02), y0 = info.oben + 80 + k * 60; x.fillStyle = ["#17120e", "#1b1510", "#1f1812", "#231b14", "#271e16"][k]; x.fillRect(Math.min(a, b), y0, Math.abs(a - b), 64); x.strokeStyle = "rgba(255,190,120,.06)"; x.beginPath(); x.moveTo(Math.min(a, b), y0); x.lineTo(Math.max(a, b), y0 + 4); x.stroke(); }
      // gestapelte Riesenquader
      for (let k = 0; k < 4; k++) { const px = seitenX(info, s, 0.25 + k * 0.17), w = 46 + (k % 2) * 18, h = 30 + (k % 3) * 8, py = info.unten - 30 - (k % 2) * 34; x.fillStyle = "#2a2119"; x.fillRect(px - w / 2, py - h, w, h); x.fillStyle = "rgba(255,255,255,.05)"; x.fillRect(px - w / 2, py - h, w, 4); }
    });
    // ein riesiger Stiefel ragt ins Bild (links) – der Boden zittert, wenn er auftritt
    const st = takt(t, 7, 1.2, 0), hub = st >= 0 ? Math.sin(st * Math.PI) * 26 : 0, sx = seitenX(info, -1, 0.55), sy = info.unten - 20 - hub;
    x.fillStyle = "#1e1610"; x.beginPath(); x.moveTo(sx - 70, sy); x.lineTo(sx + 40, sy); x.quadraticCurveTo(sx + 60, sy - 10, sx + 46, sy - 40); x.lineTo(sx + 10, sy - 46); x.lineTo(sx + 6, sy - 170); x.lineTo(sx - 40, sy - 170); x.lineTo(sx - 46, sy - 50); x.quadraticCurveTo(sx - 74, sy - 30, sx - 70, sy); x.fill();
    x.strokeStyle = "rgba(120,90,60,.4)"; x.lineWidth = 3; x.beginPath(); x.moveTo(sx - 44, sy - 120); x.lineTo(sx + 8, sy - 118); x.stroke();
    if (st >= 0 && st > 0.85) for (let i = 0; i < 10; i++) { x.fillStyle = "rgba(168,150,130,.5)"; x.fillRect(sx - 60 + i * 12, info.unten - 14 - Math.random() * 10, 2, 2); }
    // rechts: Riese schiebt einen Erzwagen vorbei (Silhouette, selten)
    const wg = takt(t, 31, 12, 6);
    if (wg >= 0) { const px = seitenX(info, 1, 1 - wg), py = info.unten - 30; x.fillStyle = "rgba(14,11,9,.92)"; x.fillRect(px - 70, py - 40, 60, 30); x.beginPath(); x.arc(px - 58, py - 6, 9, 0, PI2); x.arc(px - 22, py - 6, 9, 0, PI2); x.fill(); x.beginPath(); x.ellipse(px + 14, py - 90, 22, 46, 0.25, 0, PI2); x.fill(); x.beginPath(); x.arc(px + 2, py - 146, 15, 0, PI2); x.fill(); x.fillRect(px + 4 + Math.sin(t * 4) * 5, py - 50, 12, 50); x.fillRect(px + 22 - Math.sin(t * 4) * 5, py - 50, 12, 50); x.fillStyle = "#7ae6c8"; for (let k = 0; k < 3; k++) { x.beginPath(); x.arc(px - 60 + k * 18, py - 44, 4, 0, PI2); x.fill(); } }
    // Hgraams Kristall in einer Nische (rechts oben)
    const kx = seitenX(info, 1, 0.3), ky = info.oben + 150;
    x.fillStyle = "#0a0807"; x.beginPath(); x.arc(kx, ky, 22, Math.PI, 0); x.lineTo(kx + 22, ky + 30); x.lineTo(kx - 22, ky + 30); x.fill();
    glow(x, kx, ky + 8, 50, "rgba(255,160,70," + (0.3 + 0.12 * Math.sin(t * 1.3)).toFixed(3) + ")");
    x.fillStyle = "#ffb060"; x.beginPath(); x.moveTo(kx, ky - 6); x.lineTo(kx + 8, ky + 8); x.lineTo(kx, ky + 24); x.lineTo(kx - 8, ky + 8); x.closePath(); x.fill();
    funken(x, info, 24, "rgba(200,180,150,1)", 142, false);
  };
  /* XIV · Gang der Bewahrer: Flammenbecken, rote Banner, Lavarinnen, ein Bewahrer wacht mit Glutschale */
  MALER.flammenweg = function (x, info) {
    const t = info.t, r = zuf(151);
    stalaktiten(x, -info.L, 0, info.oben, "#0a0402", r, 12, 70); stalaktiten(x, info.W, info.W + info.R, info.oben, "#0a0402", r, 12, 70);
    [-1, 1].forEach(s => {
      // Lavarinne an der Wand herab
      const lx = seitenX(info, s, 0.82), g = x.createLinearGradient(0, info.oben, 0, info.unten); g.addColorStop(0, "rgba(255,90,30,0)"); g.addColorStop(0.5, "rgba(255,120,40,.55)"); g.addColorStop(1, "rgba(255,190,80,.8)");
      x.fillStyle = g; x.fillRect(lx - 7, info.oben, 14, info.unten - info.oben);
      glow(x, lx, info.unten - 40, 90, "rgba(255,110,40,.22)");
      // Banner der Bewahrer
      const bx = seitenX(info, s, 0.5), by = info.oben + 90;
      x.fillStyle = "#7a1a10"; x.beginPath(); x.moveTo(bx - 20, by); x.lineTo(bx + 20, by); x.lineTo(bx + 20, by + 110); x.lineTo(bx, by + 96); x.lineTo(bx - 20, by + 110); x.closePath(); x.fill();
      x.strokeStyle = "rgba(224,178,74,.85)"; x.lineWidth = 1.8; x.beginPath(); x.arc(bx, by + 44, 10, 0, PI2); x.stroke(); x.beginPath(); x.moveTo(bx, by + 54); x.quadraticCurveTo(bx - 7, by + 44, bx, by + 34); x.quadraticCurveTo(bx + 7, by + 44, bx, by + 54); x.stroke();
      // Flammenbecken
      const fx = seitenX(info, s, 0.2), fy = info.unten - 70;
      x.fillStyle = "#1e100a"; x.fillRect(fx - 10, fy, 20, 70); x.fillStyle = "#3a2214"; x.beginPath(); x.moveTo(fx - 24, fy); x.lineTo(fx + 24, fy); x.lineTo(fx + 16, fy + 12); x.lineTo(fx - 16, fy + 12); x.closePath(); x.fill();
      flamme(x, fx, fy, 1.6, t + s); glow(x, fx, fy - 10, 60, "rgba(255,150,60,.3)");
    });
    // ein Bewahrer wacht links und hebt seine Glutschale (selten)
    const pw = takt(t, 23, 8, 4);
    if (pw >= 0) { const px = seitenX(info, -1, 0.36), py = info.unten - 30, o = Math.sin(pw * Math.PI); x.fillStyle = "rgba(40,8,4,.95)"; x.beginPath(); x.moveTo(px - 18, py); x.lineTo(px - 12, py - 70); x.quadraticCurveTo(px, py - 92, px + 12, py - 70); x.lineTo(px + 18, py); x.fill(); flamme(x, px - 20, py - 60 - o * 16, 0.8 * o + 0.3, t); }
    funken(x, info, 40, "rgba(255,160,70,1)", 152, true);
  };
  /* XV · Themberchauds Halle: Lavafälle, Goldberge, goldene Tiere, und manchmal öffnet sich ein Auge */
  MALER.drachenhort = function (x, info) {
    const t = info.t, r = zuf(161);
    stalaktiten(x, -info.L, 0, info.oben, "#0c0302", r, 10, 60); stalaktiten(x, info.W, info.W + info.R, info.oben, "#0c0302", r, 10, 60);
    [-1, 1].forEach(s => {
      for (let k = 0; k < 2; k++) {
        const lx = seitenX(info, s, 0.7 + k * 0.22), w = 18 + k * 8, g = x.createLinearGradient(0, info.oben, 0, info.unten); g.addColorStop(0, "rgba(255,110,40,.12)"); g.addColorStop(0.5, "rgba(255,140,50,.55)"); g.addColorStop(1, "rgba(255,210,110,.85)");
        x.fillStyle = g; x.fillRect(lx - w / 2, info.oben, w, info.unten - info.oben);
        for (let j = 0; j < 4; j++) { const ph = (t * 0.6 + j / 4 + k * 0.3) % 1; x.fillStyle = "rgba(255,235,160," + (0.55 * (1 - ph)).toFixed(2) + ")"; x.fillRect(lx - w * 0.3 + Math.sin(ph * 6) * 4, info.oben + ph * (info.unten - info.oben), 2, 8); }
      }
      const px = seitenX(info, s, 0.35), py = info.unten - 26;
      x.fillStyle = "#5a3a10"; x.beginPath(); x.moveTo(px - 90, py); x.quadraticCurveTo(px, py - 130, px + 90, py); x.fill();
      x.fillStyle = "#8a6020"; x.beginPath(); x.moveTo(px - 64, py); x.quadraticCurveTo(px, py - 96, px + 64, py); x.fill();
      for (let k = 0; k < 14; k++) { const a = Math.max(0, Math.sin(t * 2.4 + k * 1.7 + s)), qx = px - 55 + r() * 110, qy = py - r() * 70; x.fillStyle = "rgba(255,235,160," + (a * 0.95).toFixed(2) + ")"; x.fillRect(qx - a * 2, qy, 1 + a * 4, 1); x.fillRect(qx, qy - a * 2, 1, 1 + a * 4); }
    });
    // goldene Tiere: ein Hirsch links, eine Eule rechts (der goldene Hund liegt in der Mitte der Halle)
    const hx = seitenX(info, -1, 0.42), hy = info.unten - 92; x.fillStyle = "#d8a040";
    x.beginPath(); x.ellipse(hx, hy, 18, 9, 0, 0, PI2); x.fill(); x.fillRect(hx - 22, hy - 16, 6, 14); x.beginPath(); x.arc(hx - 20, hy - 18, 5, 0, PI2); x.fill();
    x.strokeStyle = "#d8a040"; x.lineWidth = 2; x.beginPath(); x.moveTo(hx - 20, hy - 22); x.lineTo(hx - 26, hy - 34); x.moveTo(hx - 24, hy - 28); x.lineTo(hx - 32, hy - 30); x.moveTo(hx - 18, hy - 22); x.lineTo(hx - 14, hy - 34); x.stroke();
    const ex = seitenX(info, 1, 0.4), ey = info.unten - 98; x.fillStyle = "#e0b050"; x.beginPath(); x.ellipse(ex, ey, 9, 13, 0, 0, PI2); x.fill(); x.fillStyle = "#3a2008"; x.beginPath(); x.arc(ex - 3.5, ey - 5, 2, 0, PI2); x.arc(ex + 3.5, ey - 5, 2, 0, PI2); x.fill();
    // ein riesiges Auge öffnet sich in der Dunkelheit (selten)
    const au = takt(t, 41, 6, 14);
    if (au >= 0) { const px = seitenX(info, 1, 0.75), py = info.oben + 120, o = Math.sin(au * Math.PI); glow(x, px, py, 60, "rgba(255,160,40," + (0.35 * o).toFixed(3) + ")"); x.fillStyle = "rgba(255,200,70," + o.toFixed(2) + ")"; x.beginPath(); x.ellipse(px, py, 26, 11 * o + 0.5, 0, 0, PI2); x.fill(); x.fillStyle = "rgba(20,6,2," + o.toFixed(2) + ")"; x.fillRect(px - 2, py - 10 * o, 4, 20 * o); }
    funken(x, info, 46, "rgba(255,180,80,1)", 162, true);
  };

  /* fremde oder unbekannte Kulissen: allgemeiner Wald bzw. allgemeine Höhle */
  function allgemein(x, info, w, u) { (w && w.unten ? MALER.mine : MALER.wachturm)(x, info, w, u); }

  window.WALDLAUF_PANO = function (x, info, w, u) {
    const m = (w && MALER[w.name]) || allgemein;
    m(x, info, w, u || {});
    // Kleinod für Aufmerksame: Barradins verlorener Hut liegt in jeder Kulisse irgendwo (nur mal links, mal rechts)
    const s = w && w.name && w.name.length % 2 ? 1 : -1, hx = seitenX(info, s, 0.12), hy = info.unten - 40;
    x.fillStyle = "#3a1e2c"; x.beginPath(); x.ellipse(hx, hy, 10, 3, -0.15, 0, PI2); x.fill();
    x.beginPath(); x.moveTo(hx - 6, hy - 1); x.quadraticCurveTo(hx - 2, hy - 12, hx + 5, hy - 2); x.fill();
    x.strokeStyle = "rgba(224,160,70,.8)"; x.lineWidth = 1; x.beginPath(); x.moveTo(hx + 2, hy - 6); x.quadraticCurveTo(hx + 12, hy - 16 + Math.sin(info.t * 2) * 1.5, hx + 18, hy - 12); x.stroke();
  };
})();
