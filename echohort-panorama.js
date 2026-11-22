/* =====================================================================
   ECHOS HORT – PANORAMA (nur auf breiten Bildschirmen)
   Links und rechts geht Echos Welt weiter: im Raubzug der Querschnitt
   durch die Erde (Wurzeln, Würmer, ein Maulwurf, vergrabene Schätze),
   in der Abwehr der Garten von oben (Tiere, Blüten, Pilzringe).
   Je Gebiet passendes Wetter und kleine Geheimnisse: Rex buddelt einen
   Knochen aus, ein Eichhörnchen klaut eine Eichel, eine Kuo-Toa-Gräte,
   eine Drachenmünze, die über den Boden rollt …
   Wird von echohort.js benutzt (window.ECHOHORT_PANO).
   ===================================================================== */
(function () {
  "use strict";
  const PI2 = Math.PI * 2;
  const zuf = seed => { let s = Math.max(1, Math.floor(seed) % 2147483646); return () => (s = (s * 16807) % 2147483647) / 2147483647; };
  const takt = (t, periode, dauer, versatz) => { const z = (t + (versatz || 0)) % periode; return z < dauer ? z / dauer : -1; };
  const sx = (info, s, f) => (s < 0 ? -info.L * f : info.W + info.R * f);
  function glow(x, px, py, rad, farbe) {
    const g = x.createRadialGradient(px, py, 0, px, py, rad); g.addColorStop(0, farbe); g.addColorStop(1, farbe.replace(/[\d.]+\)$/, "0)"));
    x.fillStyle = g; x.fillRect(px - rad, py - rad, rad * 2, rad * 2);
  }
  /* Teilchen je Jahreszeit: Blüten, Pollen, Laub, Regen, Schnee, Glimmer, Asche, Glut */
  const WETTER = { wald: "pollen", phandalin: "laub", wachturm: "nebel", schmiede: "glut", donnerbaum: "asche", unterreich: "glimmer", see: "blase", gracklstugh: "glut", hort: "glut" };
  function wetter(x, info, art, seed) {
    const r = zuf(seed), t = info.t, n = art === "nebel" ? 6 : 34;
    for (let i = 0; i < n; i++) {
      const s = i % 2 ? -1 : 1, f = 0.04 + r() * 0.92, bx = sx(info, s, f), ph = r() * 6.3, sp = 0.3 + r() * 0.6, hh = info.unten - info.oben;
      if (art === "nebel") { glow(x, bx + Math.sin(t * 0.1 + ph) * 40, info.oben + hh * (0.2 + r() * 0.7), 80, "rgba(170,170,190,.08)"); continue; }
      let yy, farbe, gr = 1.2 + r() * 1.4;
      if (art === "glut" || art === "asche" || art === "blase") yy = info.unten - ((t * (12 + r() * 20) + r() * 900) % hh);
      else if (art === "laub") yy = info.oben + ((t * (14 + r() * 14) + r() * 900) % hh);
      else yy = info.oben + hh * r() + Math.sin(t * sp + ph) * 10;
      const xx = bx + Math.sin(t * sp + ph) * 14;
      farbe = { pollen: "rgba(240,230,150,.8)", laub: "rgba(214,120,44,.85)", glut: "rgba(255,150,60,.9)", asche: "rgba(170,165,160,.7)", glimmer: "rgba(196,154,224,.85)", blase: "rgba(170,220,230,.5)" }[art] || "rgba(240,230,150,.8)";
      const a = art === "glimmer" || art === "pollen" ? 0.3 + 0.7 * Math.max(0, Math.sin(t * (1 + r()) + ph)) : 1;
      x.globalAlpha = a;
      if (art === "laub") { x.fillStyle = farbe; x.save(); x.translate(xx, yy); x.rotate(t * 2 + ph); x.beginPath(); x.ellipse(0, 0, 3, 1.6, 0, 0, PI2); x.fill(); x.restore(); }
      else if (art === "blase") { x.strokeStyle = farbe; x.lineWidth = 0.8; x.beginPath(); x.arc(xx, yy, gr + 1, 0, PI2); x.stroke(); }
      else { x.fillStyle = farbe; x.beginPath(); x.arc(xx, yy, gr, 0, PI2); x.fill(); if (art !== "asche") { x.globalAlpha = a * 0.2; x.beginPath(); x.arc(xx, yy, gr * 4, 0, PI2); x.fill(); } }
    }
    x.globalAlpha = 1;
  }

  /* ---------- Raubzug: Querschnitt durch die Erde ---------- */
  function raub(x, info, k, t) {
    const himmelUnten = 120;
    // Würmer schlängeln sich durch die Erde
    for (let i = 0; i < 6; i++) {
      const s = i % 2 ? -1 : 1, f = 0.15 + (i * 0.13) % 0.8, px = sx(info, s, f), py = 200 + (i * 53) % 260;
      x.strokeStyle = "rgba(190,120,110,.55)"; x.lineWidth = 2.2; x.lineCap = "round"; x.beginPath();
      for (let j = 0; j < 8; j++) { const xx = px + j * 2.4 + Math.sin(t * 2 + i) * 3, yy = py + Math.sin(t * 3 + j * 0.8 + i) * 2.4; j ? x.lineTo(xx, yy) : x.moveTo(xx, yy); }
      x.stroke(); x.lineCap = "butt";
    }
    // Maulwurf gräbt einen Gang (links), Erdbrocken fliegen
    const m = takt(t, 17, 6, 2);
    if (m >= 0) {
      const px = sx(info, -1, 0.9 - m * 0.7), py = 300 + Math.sin(m * 9) * 6;
      x.fillStyle = "#2a2220"; x.beginPath(); x.ellipse(px, py, 11, 7, 0, 0, PI2); x.fill();
      x.fillStyle = "#e0a0a0"; x.beginPath(); x.arc(px + 11, py, 2.4, 0, PI2); x.fill();
      x.fillStyle = "#1a1412"; for (let i = 0; i < 3; i++) x.fillRect(px - 14 - i * 6 + Math.sin(t * 20 + i) * 2, py - 3 + Math.cos(t * 17 + i) * 3, 3, 3);
    }
    // Rex buddelt von oben einen Knochen aus (rechts, selten)
    const rx = takt(t, 29, 8, 9);
    if (rx >= 0) {
      const px = sx(info, 1, 0.55), py = himmelUnten - 6, hop = Math.abs(Math.sin(t * 9)) * 2;
      x.fillStyle = "#5a3a22"; x.beginPath(); x.ellipse(px, py - 10 - hop, 14, 8, 0, 0, PI2); x.fill(); x.beginPath(); x.arc(px - 14, py - 6 - hop, 6, 0, PI2); x.fill();
      x.fillStyle = "#e8e0d0"; x.beginPath(); x.ellipse(px - 15, py - 10 - hop, 3, 2, 0, 0, PI2); x.fill();
      x.strokeStyle = "#5a3a22"; x.lineWidth = 2.5; x.beginPath(); x.moveTo(px + 13, py - 14 - hop); x.lineTo(px + 18, py - 22 + Math.sin(t * 14) * 4); x.stroke();
      for (let i = 0; i < 4; i++) { const k2 = (t * 3 + i * 0.25) % 1; x.fillStyle = "rgba(60,40,26," + (1 - k2).toFixed(2) + ")"; x.fillRect(px - 20 - k2 * 20, py - 6 - Math.sin(k2 * Math.PI) * 18, 3, 3); }
      if (rx > 0.6) { x.fillStyle = "#e8e0d0"; x.save(); x.translate(px - 24, py - 22); x.rotate(0.4); x.fillRect(-7, -1.5, 14, 3); x.beginPath(); x.arc(-7, -2, 2.2, 0, PI2); x.arc(-7, 2, 2.2, 0, PI2); x.arc(7, -2, 2.2, 0, PI2); x.arc(7, 2, 2.2, 0, PI2); x.fill(); x.restore(); }
    }
    // vergrabene Schätze funkeln in der Tiefe
    const r = zuf(k.length * 77);
    for (let i = 0; i < 10; i++) {
      const s = i % 2 ? -1 : 1, px = sx(info, s, 0.1 + r() * 0.85), py = 180 + r() * 300, g = Math.max(0, Math.sin(t * 2 + i * 1.7));
      x.fillStyle = "rgba(255,220,130," + (0.25 + 0.75 * g).toFixed(2) + ")"; x.fillRect(px - g, py, 1 + g * 2, 1); x.fillRect(px, py - g, 1, 1 + g * 2);
    }
    // Eichhörnchen klaut eine Eichel (Wald und Donnerbaum)
    if (k === "wald" || k === "donnerbaum" || k === "phandalin") {
      const e = takt(t, 21, 5, 13);
      if (e >= 0) { const px = sx(info, -1, 0.2 + e * 0.6), py = himmelUnten - 4 - Math.abs(Math.sin(e * 20)) * 8; x.fillStyle = "#8a4a22"; x.beginPath(); x.ellipse(px, py, 5, 4, 0, 0, PI2); x.fill(); x.beginPath(); x.arc(px + 5, py - 3, 3, 0, PI2); x.fill(); x.beginPath(); x.ellipse(px - 6, py - 5, 3, 6, -0.5, 0, PI2); x.fill(); x.fillStyle = "#a8783e"; x.beginPath(); x.arc(px + 8, py - 1, 1.8, 0, PI2); x.fill(); }
    }
  }

  /* ---------- Abwehr: der Garten von oben ---------- */
  function abwehr(x, info, k, t) {
    const r = zuf(k.length * 13 + 5), hh = info.unten - info.oben;
    // Blüten und Pilzringe (statisch nach Saat, sanft leuchtend)
    for (let i = 0; i < 26; i++) {
      const s = i % 2 ? -1 : 1, px = sx(info, s, 0.06 + r() * 0.9), py = info.oben + hh * r(), art = r();
      if (k === "unterreich" || k === "schmiede" || k === "gracklstugh" || k === "hort") { const a = 0.5 + 0.5 * Math.sin(t * 1.2 + i); glow(x, px, py, 12, (k === "unterreich" ? "rgba(196,154,224," : "rgba(255,150,70,") + (0.25 * a).toFixed(3) + ")"); x.fillStyle = k === "unterreich" ? "rgba(196,154,224,.7)" : "rgba(255,170,90,.6)"; x.beginPath(); x.arc(px, py, 2.2, 0, PI2); x.fill(); continue; }
      if (art < 0.5) { const f = ["#e8b0c8", "#f0e0a0", "#c8a0e0", "#f0f0e8"][i % 4]; for (let j = 0; j < 5; j++) { const w = j / 5 * PI2 + t * 0.1; x.fillStyle = f; x.beginPath(); x.ellipse(px + Math.cos(w) * 2.6, py + Math.sin(w) * 2.6, 2, 1.2, w, 0, PI2); x.fill(); } x.fillStyle = "#e0a046"; x.beginPath(); x.arc(px, py, 1.2, 0, PI2); x.fill(); }
      else { for (let j = 0; j < 7; j++) { const w = j / 7 * PI2; x.fillStyle = "#cfc3a8"; x.beginPath(); x.arc(px + Math.cos(w) * 10, py + Math.sin(w) * 8, 2.4, 0, PI2); x.fill(); x.fillStyle = "#8a3a2a"; x.beginPath(); x.arc(px + Math.cos(w) * 10, py + Math.sin(w) * 8 - 0.6, 1.6, 0, PI2); x.fill(); } }
    }
    // ein Hase hoppelt quer durch (oder eine Fledermaus, unter der Erde)
    const h = takt(t, 19, 7, 4);
    if (h >= 0) {
      const s = Math.floor(t / 19) % 2 ? 1 : -1, px = sx(info, s, 0.95 - h * 0.9), py = info.oben + hh * (0.3 + 0.4 * Math.sin(h * 3)) - Math.abs(Math.sin(h * 26)) * 6;
      if (k === "unterreich" || k === "schmiede" || k === "gracklstugh" || k === "hort") { const fl = Math.sin(t * 18); x.fillStyle = "#0a090c"; x.beginPath(); x.moveTo(px, py); x.quadraticCurveTo(px - 6, py - 6 * fl, px - 12, py - 2 * fl); x.lineTo(px, py + 3); x.lineTo(px + 12, py - 2 * fl); x.quadraticCurveTo(px + 6, py - 6 * fl, px, py); x.fill(); }
      else { x.fillStyle = "#8a7a66"; x.beginPath(); x.ellipse(px, py, 6, 4.5, 0, 0, PI2); x.fill(); x.beginPath(); x.arc(px - 5 * s * -1, py - 2, 3, 0, PI2); x.fill(); x.beginPath(); x.ellipse(px + 5 * s, py - 6, 1.4, 4, 0.3 * s, 0, PI2); x.fill(); x.fillStyle = "#f0ece4"; x.beginPath(); x.arc(px - 6 * s, py + 1, 1.6, 0, PI2); x.fill(); }
    }
    // Schmetterlinge oder Glutfalter
    for (let i = 0; i < 4; i++) { const s = i % 2 ? -1 : 1, px = sx(info, s, 0.5) + Math.sin(t * 0.5 + i * 2) * info.L * 0.35, py = info.oben + hh * (0.2 + i * 0.18) + Math.cos(t * 0.7 + i) * 30, fl = Math.abs(Math.sin(t * 12 + i)); x.fillStyle = k === "hort" || k === "gracklstugh" ? "rgba(255,150,60,.8)" : ["rgba(240,200,120,.85)", "rgba(220,170,230,.85)"][i % 2]; x.beginPath(); x.ellipse(px - 2.5 * fl, py, 2.6 * fl + 0.3, 1.8, 0.3, 0, PI2); x.ellipse(px + 2.5 * fl, py, 2.6 * fl + 0.3, 1.8, -0.3, 0, PI2); x.fill(); }
    // Drachenmünze rollt über den Boden (Hort)
    if (k === "hort") { const m = takt(t, 11, 3, 1); if (m >= 0) { const px = sx(info, 1, 0.1 + m * 0.8), py = info.oben + hh * 0.8; x.fillStyle = "#e0b24a"; x.beginPath(); x.ellipse(px, py, 3.2, 3.2 * Math.abs(Math.cos(m * 30)) + 0.5, 0, 0, PI2); x.fill(); } }
    // Kuo-Toa-Gräte am Ufer (See)
    if (k === "see") { const px = sx(info, -1, 0.3), py = info.oben + hh * 0.7; x.strokeStyle = "#cfc8b8"; x.lineWidth = 1; x.beginPath(); x.moveTo(px - 12, py); x.lineTo(px + 12, py); for (let j = -8; j <= 8; j += 4) { x.moveTo(px + j, py - 4); x.lineTo(px + j, py + 4); } x.stroke(); x.beginPath(); x.moveTo(px + 12, py); x.lineTo(px + 18, py - 4); x.lineTo(px + 18, py + 4); x.closePath(); x.stroke(); }
  }

  window.ECHOHORT_PANO = function (x, info, k, phase) {
    const t = info.t;
    if (phase === "abwehr") abwehr(x, info, k || "wald", t); else raub(x, info, k || "wald", t);
    wetter(x, info, WETTER[k] || "pollen", (k || "wald").length * 31);
    // Barradins verlorener Hut liegt auch hier irgendwo herum
    const hx = sx(info, (k || "").length % 2 ? 1 : -1, 0.18), hy = phase === "abwehr" ? info.unten - 60 : 112;
    x.fillStyle = "#3a1e2c"; x.beginPath(); x.ellipse(hx, hy, 9, 3, -0.15, 0, PI2); x.fill(); x.beginPath(); x.moveTo(hx - 5, hy - 1); x.quadraticCurveTo(hx - 2, hy - 11, hx + 4, hy - 2); x.fill();
    x.strokeStyle = "rgba(224,160,70,.8)"; x.lineWidth = 1; x.beginPath(); x.moveTo(hx + 2, hy - 5); x.quadraticCurveTo(hx + 11, hy - 14 + Math.sin(t * 2) * 1.5, hx + 16, hy - 11); x.stroke();
  };
})();
