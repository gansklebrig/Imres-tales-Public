/* =====================================================================
   PANORAMA – Breitbild für die Hochkant-Spiele (Jagd, Nacht, Hort)
   Auf breiten Bildschirmen (PC, Tablet quer, Vollbild) bleibt das
   Spielfeld, wie es ist, aber links und rechts davon geht die Welt
   weiter: Die Kulisse des Spiels wird an den Bühnenrändern gespiegelt
   (dadurch nahtlos), nach außen abgedunkelt und mit eigenen Dingen
   bevölkert, die nur dort zu sehen sind – Rahmenbäume, Felsen, Tiere,
   Lichter und kleine Geheimnisse für alle, die genau hinsehen.
   Benutzung:
     const p = Panorama.an({ karte, buehne, W, H, hinten(ctx, t), seiten(ctx, info) });
     p.zeichnen(t, dt)  – am Ende jedes Bildes aufrufen
   ===================================================================== */
(function () {
  "use strict";
  if (window.Panorama) return;

  const css = document.createElement("style");
  css.textContent = `
.pano-flaeche { position: absolute; left: 0; top: 0; pointer-events: none; z-index: 0; display: block; }
.mit-panorama { position: relative; }
.mit-panorama .pano-ueber { position: relative; z-index: 1; }
@media (min-width: 1100px) and (min-height: 600px) {
  .saal-einzeln .tav-karte.mit-panorama.saal-aktiv { width: min(96vw, 1680px); max-width: none; justify-self: start; margin-left: calc(50% - min(48vw, 840px)); }
}
.mit-panorama.pano-an .pano-buehne { border-color: rgba(224,160,70,.16) !important; box-shadow: 0 0 0 1px rgba(0,0,0,.35), 0 0 46px rgba(0,0,0,.55) !important; }
`;
  document.head.appendChild(css);

  const reduziert = window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)") : { matches: false };

  function an(o) {
    const karte = o.karte, buehne = o.buehne, W = o.W, H = o.H;
    karte.querySelectorAll(":scope > .pano-flaeche").forEach(e => e.remove());
    karte.classList.add("mit-panorama");
    buehne.classList.add("pano-buehne");
    // alle direkten Kinder über die Fläche heben
    Array.from(karte.children).forEach(k => k.classList.add("pano-ueber"));
    const c = document.createElement("canvas");
    c.className = "pano-flaeche"; c.setAttribute("aria-hidden", "true");
    karte.insertBefore(c, karte.firstChild);
    const x = c.getContext("2d");
    const hilfe = document.createElement("canvas"), hx = hilfe.getContext("2d");
    let aktiv = false, letzteMessung = 0, geo = null, rahmenVoll = null;

    function messen(jetzt) {
      if (geo && jetzt - letzteMessung < 400) return geo;
      letzteMessung = jetzt;
      // im Vollbild liegt die Bühne in einem festen Rahmen: dann den Rahmen bemalen
      const voll = o.vollRahmen && o.vollRahmen();
      if (voll !== rahmenVoll) {
        rahmenVoll = voll;
        const ziel = voll || karte;
        if (c.parentNode !== ziel) { ziel.insertBefore(c, ziel.firstChild); }
        c.style.position = voll ? "fixed" : "absolute";
      }
      const kr = (rahmenVoll || karte).getBoundingClientRect(), br = buehne.getBoundingClientRect();
      if (!br.width || !kr.width) return (geo = null);
      const links = br.left - kr.left, rechts = kr.right - br.right;
      const breit = window.innerWidth >= 900 && Math.min(links, rechts) > 70;
      if (!breit) return (geo = { aus: true });
      // die Fläche deckt die ganze Kartenbreite in Höhe der Bühne
      const top = rahmenVoll ? 0 : br.top - kr.top, hoehe = rahmenVoll ? kr.height : br.height;
      const dpr = Math.min(1.5, window.devicePixelRatio || 1);
      const bw = Math.round(kr.width * dpr), bh = Math.round(hoehe * dpr);
      if (c.width !== bw || c.height !== bh) { c.width = bw; c.height = bh; }
      c.style.width = kr.width + "px"; c.style.height = hoehe + "px";
      c.style.left = (rahmenVoll ? kr.left : 0) + "px"; c.style.top = (rahmenVoll ? kr.top : top) + "px";
      return (geo = { dpr, links, rechts, bx: links, by: rahmenVoll ? br.top - kr.top : 0, bw: br.width, bh: br.height, kw: kr.width, kh: hoehe });
    }

    function zeichnen(t, dt) {
      const jetzt = performance.now(), g = messen(jetzt);
      if (!g || g.aus) { if (aktiv) { aktiv = false; c.style.display = "none"; karte.classList.remove("pano-an"); } return; }
      if (!aktiv) { aktiv = true; c.style.display = "block"; karte.classList.add("pano-an"); }
      const k = g.bw / W, d = g.dpr;
      x.setTransform(1, 0, 0, 1, 0, 0);
      x.fillStyle = o.grund || "#07060b"; x.fillRect(0, 0, c.width, c.height);
      // Kulisse des Spiels einmal in eine Hilfsfläche malen (Weltmaße), dann gespiegelt an beide Ränder setzen
      const hw = Math.round(W * k * d), hh = Math.round(H * k * d);
      if (hilfe.width !== hw || hilfe.height !== hh) { hilfe.width = hw; hilfe.height = hh; }
      hx.setTransform(k * d, 0, 0, k * d, 0, 0);
      hx.clearRect(0, 0, W, H);
      try { o.hinten(hx, t, dt); } catch (e) { /* Kulisse darf nie das Spiel stören */ }
      const ox = g.bx * d, oy = g.by * d, bwD = g.bw * d;
      // links: gespiegelt, dann (falls breiter) wieder ungespiegelt usw.
      for (let i = 0, xx = ox; xx > -bwD; i++) {
        x.save(); x.translate(xx, oy);
        if (i % 2 === 0) { x.scale(-1, 1); x.drawImage(hilfe, 0, 0); } else { x.drawImage(hilfe, -bwD, 0); }
        x.restore(); xx -= bwD;
      }
      for (let i = 0, xx = ox + bwD; xx < c.width + bwD; i++) {
        x.save(); x.translate(xx, oy);
        if (i % 2 === 0) { x.translate(bwD, 0); x.scale(-1, 1); x.drawImage(hilfe, 0, 0); } else { x.drawImage(hilfe, 0, 0); }
        x.restore(); xx += bwD;
      }
      // Weltkoordinaten: x = 0 am linken Bühnenrand
      x.setTransform(k * d, 0, 0, k * d, ox, oy);
      const L = g.bx / k, R = (g.kw - g.bx - g.bw) / k, oben = -g.by / k, unten = (g.kh - g.by) / k;
      const info = { W, H, L, R, oben, unten, k, t, dt, ruhig: reduziert.matches };
      // Luftperspektive: nach außen dunkler und kühler, an der Bühne fast unverändert
      [[-L, 0, -1], [W, W + R, 1]].forEach(([a, b, s]) => {
        const gr = x.createLinearGradient(s < 0 ? 0 : W, 0, s < 0 ? -L : W + R, 0);
        gr.addColorStop(0, "rgba(6,5,10,.06)"); gr.addColorStop(.4, "rgba(6,5,10,.22)"); gr.addColorStop(1, "rgba(4,3,8,.62)");
        x.fillStyle = gr; x.fillRect(a, oben, b - a, unten - oben);
      });
      try { if (o.seiten) o.seiten(x, info); } catch (e) { if (!an.fehlerGemeldet) { an.fehlerGemeldet = true; console.warn("Panorama:", e); } }
      // weiche Lichtkante an der Bühne, damit das Spielfeld als Mittelpunkt wirkt
      [[0, -1], [W, 1]].forEach(([ex, s]) => {
        const gr = x.createLinearGradient(ex, 0, ex + s * 26, 0);
        gr.addColorStop(0, "rgba(0,0,0,.42)"); gr.addColorStop(1, "rgba(0,0,0,0)");
        x.fillStyle = gr; x.fillRect(Math.min(ex, ex + s * 26), oben, 26, unten - oben);
      });
      // oben/unten weich ausblenden (die Karte ist höher als die Kulisse)
      if (!rahmenVoll) {
        const gr1 = x.createLinearGradient(0, 0, 0, 30); gr1.addColorStop(0, "rgba(7,6,11,.85)"); gr1.addColorStop(1, "rgba(7,6,11,0)");
        x.fillStyle = gr1; x.fillRect(-L, 0, L + W + R, 30);
      }
    }
    return { zeichnen, aktiv: () => aktiv, flaeche: c };
  }

  /* ---------- gemeinsame Bausteine für die Seitenbilder ---------- */
  const H = {};
  /* Zufall mit fester Saat – gleiche Seite sieht bei jedem Bild gleich aus */
  H.zufall = function (seed) { let s = Math.max(1, Math.floor(seed) % 2147483646); return () => (s = (s * 16807) % 2147483647) / 2147483647; };
  /* Silhouetten-Tanne */
  H.tanne = function (x, px, basis, h, farbe, breite) {
    const b = (breite || 0.42) * h;
    x.fillStyle = farbe; x.beginPath(); x.moveTo(px, basis - h);
    for (let i = 1; i <= 5; i++) { const yy = basis - h + h * i / 5.4, ww = b * i / 5; x.lineTo(px + ww, yy); x.lineTo(px + ww * 0.45, yy - h * 0.04); }
    x.lineTo(px + b * 0.12, basis); x.lineTo(px - b * 0.12, basis);
    for (let i = 5; i >= 1; i--) { const yy = basis - h + h * i / 5.4, ww = b * i / 5; x.lineTo(px - ww * 0.45, yy - h * 0.04); x.lineTo(px - ww, yy); }
    x.closePath(); x.fill();
  };
  /* knorriger Laubbaum als Rahmen (Stamm + Äste + Blattballen) */
  H.rahmenBaum = function (x, px, basis, h, farbe, laub, seite, r, t, wind) {
    const sw = Math.sin(t * 0.7 + px * 0.01) * (1 + Math.abs(wind || 0) / 60);
    x.fillStyle = farbe; x.beginPath();
    x.moveTo(px - 16, basis); x.bezierCurveTo(px - 10, basis - h * 0.4, px - 14, basis - h * 0.7, px - 4 + sw, basis - h);
    x.lineTo(px + 8 + sw, basis - h); x.bezierCurveTo(px + 2, basis - h * 0.7, px + 8, basis - h * 0.4, px + 18, basis); x.closePath(); x.fill();
    // Wurzeln
    for (let i = 0; i < 4; i++) { const wx = px + (i - 1.5) * 14; x.beginPath(); x.moveTo(wx - 4, basis); x.quadraticCurveTo(wx + (i - 1.5) * 8, basis - 10, wx + 2, basis - 26); x.lineTo(wx + 6, basis - 24); x.quadraticCurveTo(wx + (i - 1.5) * 10 + 6, basis - 6, wx + 10, basis); x.fill(); }
    // Äste zur Bühne hin
    for (let i = 0; i < 4; i++) {
      const ay = basis - h * (0.45 + i * 0.13), al = 50 + r() * 70, ar = -seite;
      x.strokeStyle = farbe; x.lineWidth = 7 - i * 1.3; x.lineCap = "round";
      x.beginPath(); x.moveTo(px, ay); x.quadraticCurveTo(px + ar * al * 0.5, ay - 18 - r() * 16 + sw * 2, px + ar * al + sw * 3, ay - 26 - r() * 20); x.stroke();
    }
    // Laub
    if (laub) {
      for (let i = 0; i < 14; i++) {
        const lx = px + (r() - 0.5 - seite * 0.25) * 150 + sw * 4, ly = basis - h * (0.62 + r() * 0.45), lr = 18 + r() * 30;
        x.fillStyle = laub[i % laub.length]; x.beginPath(); x.ellipse(lx, ly, lr * 1.25, lr, r() * 3, 0, Math.PI * 2); x.fill();
      }
    }
  };
  /* Glühwürmchen / schwebende Funken */
  H.funken = function (x, n, L, R, W, oben, unten, t, farbe, seed) {
    const r = H.zufall(seed || 77);
    for (let i = 0; i < n; i++) {
      const s = r() < 0.5 ? -1 : 1, bx = s < 0 ? -L * (0.05 + r() * 0.9) : W + R * (0.05 + r() * 0.9);
      const by = oben + (unten - oben) * (0.25 + r() * 0.7), ph = r() * 6.28, sp = 0.3 + r() * 0.6;
      const xx = bx + Math.sin(t * sp + ph) * 14, yy = by + Math.cos(t * sp * 0.8 + ph) * 10;
      const a = 0.25 + 0.75 * Math.max(0, Math.sin(t * (1.3 + r()) + ph));
      x.globalAlpha = a; x.fillStyle = farbe;
      x.beginPath(); x.arc(xx, yy, 1.4, 0, 6.3); x.fill();
      x.globalAlpha = a * 0.25; x.beginPath(); x.arc(xx, yy, 5, 0, 6.3); x.fill();
    }
    x.globalAlpha = 1;
  };
  /* zwei Augen, die im Dunkeln blinzeln */
  H.augen = function (x, px, py, t, farbe, abstand, ph) {
    const z = (t * 0.6 + (ph || 0)) % 7, offen = z < 6.82 ? 1 : 0.15;
    x.fillStyle = farbe || "rgba(255,210,90,.85)"; x.shadowColor = x.fillStyle; x.shadowBlur = 6;
    [-1, 1].forEach(s => { x.beginPath(); x.ellipse(px + s * (abstand || 5), py, 2.2, 2.2 * offen, 0, 0, 6.3); x.fill(); });
    x.shadowBlur = 0;
  };
  /* Lichtkegel von oben (Mondlicht, Lichtschacht) */
  H.strahl = function (x, px, oben, unten, breite, farbe, t, ph) {
    const a = 0.55 + 0.45 * Math.sin(t * 0.4 + (ph || 0));
    const g = x.createLinearGradient(0, oben, 0, unten); g.addColorStop(0, farbe.replace("A", (0.16 * a).toFixed(3))); g.addColorStop(1, farbe.replace("A", "0"));
    x.fillStyle = g; x.beginPath(); x.moveTo(px - breite * 0.3, oben); x.lineTo(px + breite * 0.3, oben); x.lineTo(px + breite * 0.7 + 40, unten); x.lineTo(px - breite * 0.7 + 40, unten); x.closePath(); x.fill();
  };
  window.Panorama = { an, H };
})();
