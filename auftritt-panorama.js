/* =====================================================================
   AUFTRITT-PANORAMA – links und rechts der Bühne geht das Theater weiter
   Logen in drei Rängen, Kronleuchter, Orchestergraben und ein paar
   bekannte Gesichter, die nur zusehen, wer genau hinschaut:
   Ezekiel im Schatten, Friedrich mit Armbrust, Echo als Rabe auf dem
   Leuchter, Rex im Körbchen, Buppido mit Schild, ein Duergar, der
   immer wieder unsichtbar wird – und der Arm. Mit Ring. Der klatscht.
   Aufruf: AUFTRITT_PANO(ctx, info, z)
     z = { st, jubel, schlag, vorhang, licht, k, feuer, ende, serie }
   ===================================================================== */
(function () {
  "use strict";
  const TAU = Math.PI * 2;
  const zuf = seed => { let s = Math.max(1, Math.floor(seed) % 2147483646); return () => (s = (s * 16807) % 2147483647) / 2147483647; };
  const kl = (v, a, b) => Math.max(a, Math.min(b, v));
  function hex(c, a) {
    if (!c || c[0] !== "#") return "rgba(120,30,30," + a + ")";
    const n = parseInt(c.length === 4 ? c[1] + c[1] + c[2] + c[2] + c[3] + c[3] : c.slice(1, 7), 16);
    return "rgba(" + (n >> 16 & 255) + "," + (n >> 8 & 255) + "," + (n & 255) + "," + a + ")";
  }
  function leucht(x, px, py, r, farbe, a) {
    const g = x.createRadialGradient(px, py, 0, px, py, r);
    g.addColorStop(0, hex(farbe, a)); g.addColorStop(1, hex(farbe, 0));
    x.fillStyle = g; x.fillRect(px - r, py - r, r * 2, r * 2);
  }

  /* Zuschauer-Silhouette in einer Loge */
  function gast(x, px, py, u, bob, arm, farbe, typ, t, ph) {
    const r = u * 1.3;
    x.fillStyle = farbe;
    if (typ === "dame") { /* hoher Hut mit Feder */
      x.beginPath(); x.ellipse(px, py - r * 1.05 + bob, r * 1.25, r * .28, 0, 0, TAU); x.fill();
      x.fillRect(px - r * .55, py - r * 1.9 + bob, r * 1.1, r * .9);
      x.strokeStyle = farbe; x.lineWidth = u * .25; x.beginPath(); x.moveTo(px + r * .4, py - r * 1.8 + bob); x.quadraticCurveTo(px + r * 1.4, py - r * 2.8 + bob + Math.sin(t * 3 + ph) * u * .3, px + r * 1.8, py - r * 2.1 + bob); x.stroke();
    }
    if (typ === "zwerg") { x.beginPath(); x.moveTo(px - r * .7, py - r * .2 + bob); x.quadraticCurveTo(px, py + r * 1.4 + bob, px + r * .7, py - r * .2 + bob); x.fill(); }
    x.beginPath(); x.arc(px, py - r * .6 + bob, r * .62, 0, TAU); x.fill();
    x.strokeStyle = "rgba(255,200,120,.22)"; x.lineWidth = u * .18; x.beginPath(); x.arc(px, py - r * .6 + bob, r * .62, -2.6, -.6); x.stroke();
    x.beginPath(); x.moveTo(px - r * 1.1, py + r * 1.6); x.quadraticCurveTo(px - r * 1.1, py + bob, px, py + bob); x.quadraticCurveTo(px + r * 1.1, py + bob, px + r * 1.1, py + r * 1.6); x.fill();
    if (arm > .05) {
      x.strokeStyle = farbe; x.lineWidth = u * .5; x.lineCap = "round";
      const w = Math.sin(t * 9 + ph) * u * .5;
      x.beginPath(); x.moveTo(px - r * .8, py + r * .3 + bob); x.lineTo(px - r * 1.2 + w, py - r * (.2 + 1.6 * arm) + bob); x.stroke();
      x.beginPath(); x.moveTo(px + r * .8, py + r * .3 + bob); x.lineTo(px + r * 1.2 - w, py - r * (.2 + 1.6 * arm) + bob); x.stroke();
    }
    if (typ === "fernglas") { /* Operngucker, blitzt */
      x.fillStyle = "#2a2018"; x.fillRect(px - r * .6, py - r * .75 + bob, r * 1.2, r * .35);
      const gl = Math.max(0, Math.sin(t * 1.3 + ph)) ** 8;
      if (gl > .05) leucht(x, px - r * .3, py - r * .6 + bob, u * 2.4, "#fff0c0", .8 * gl);
    }
  }

  /* eine Loge: Rahmen, Vorhangschabracke, Brüstung, Lampe – und Inhalt */
  function loge(x, lx, ly, bw, bh, u, s, z, t, inhalt) {
    const vor = z.vorhang || "#7a1e1e";
    /* Innenraum */
    const gi = x.createLinearGradient(0, ly, 0, ly + bh);
    gi.addColorStop(0, "#120a0c"); gi.addColorStop(1, "#1e1214");
    x.fillStyle = gi; x.fillRect(lx, ly, bw, bh);
    /* Lämpchen innen */
    const fl = .75 + .25 * Math.sin(t * 7 + lx * .13) * Math.sin(t * 3.1 + ly);
    leucht(x, lx + bw * .5, ly + bh * .25, bw * .55, z.licht || "#ffd890", .34 * fl);
    if (inhalt) inhalt(lx, ly, bw, bh);
    /* Schabracke mit Fransen */
    x.fillStyle = hex(vor, .95); x.beginPath(); x.moveTo(lx - u * .4, ly);
    for (let i = 0; i <= 4; i++) { const xx = lx + bw * i / 4; x.quadraticCurveTo(xx - bw / 8, ly + bh * .2, xx, ly + bh * .1); }
    x.lineTo(lx + bw + u * .4, ly - u); x.lineTo(lx - u * .4, ly - u); x.fill();
    x.fillStyle = "#c9a040"; for (let i = 0; i < 9; i++) x.fillRect(lx + bw * (i + .5) / 9, ly + bh * .12 + Math.sin(i * 1.7) * u * .4, u * .2, u * .8);
    /* seitliche Vorhänge */
    x.fillStyle = hex(vor, .85);
    x.beginPath(); x.moveTo(lx, ly); x.quadraticCurveTo(lx + bw * .2, ly + bh * .5, lx + bw * .06, ly + bh); x.lineTo(lx, ly + bh); x.fill();
    x.beginPath(); x.moveTo(lx + bw, ly); x.quadraticCurveTo(lx + bw * .8, ly + bh * .5, lx + bw * .94, ly + bh); x.lineTo(lx + bw, ly + bh); x.fill();
    /* goldene Brüstung mit Balustern */
    const by = ly + bh * .68;
    const gb = x.createLinearGradient(0, by, 0, ly + bh + u * 2);
    gb.addColorStop(0, "#5a3a18"); gb.addColorStop(.12, "#d8b060"); gb.addColorStop(.25, "#6a4420"); gb.addColorStop(1, "#2a1a0c");
    x.fillStyle = gb; x.beginPath();
    x.moveTo(lx - u * .8, by); x.lineTo(lx + bw + u * .8, by); x.quadraticCurveTo(lx + bw + u * 1.5, ly + bh + u, lx + bw, ly + bh + u * 2.2);
    x.lineTo(lx, ly + bh + u * 2.2); x.quadraticCurveTo(lx - u * 1.5, ly + bh + u, lx - u * .8, by); x.fill();
    x.fillStyle = "rgba(255,225,150,.35)"; for (let i = 1; i < 8; i++) { const bx = lx + bw * i / 8; x.beginPath(); x.ellipse(bx, by + bh * .2, u * .35, bh * .1, 0, 0, TAU); x.fill(); }
    /* Wappen-Kartusche */
    x.fillStyle = "#c9a040"; x.beginPath(); x.ellipse(lx + bw / 2, ly + bh + u * .7, u * 1.2, u * .9, 0, 0, TAU); x.fill();
    x.fillStyle = hex(vor, 1); x.beginPath(); x.ellipse(lx + bw / 2, ly + bh + u * .7, u * .7, u * .5, 0, 0, TAU); x.fill();
  }

  function kronleuchter(x, px, py, u, t, z, s) {
    const sw = Math.sin(t * .6 + px * .01) * .04 * (1 + z.jubel);
    x.save(); x.translate(px, py); x.rotate(sw);
    x.strokeStyle = "#3a2a14"; x.lineWidth = u * .2; x.beginPath(); x.moveTo(0, -py - 50); x.lineTo(0, 0); x.stroke();
    x.fillStyle = "#b08a3a"; x.beginPath(); x.ellipse(0, u * 2, u * 6, u * 1.2, 0, 0, TAU); x.fill();
    x.beginPath(); x.ellipse(0, u * 5, u * 3.6, u * .9, 0, 0, TAU); x.fill();
    x.fillRect(-u * .3, 0, u * .6, u * 6);
    /* Kristallgehänge */
    x.fillStyle = "rgba(255,240,210,.55)";
    for (let i = 0; i < 11; i++) { const a = i / 11 * TAU, xx = Math.cos(a) * u * 5.6, yy = u * 2.4 + Math.sin(a) * u * .8; x.beginPath(); x.moveTo(xx, yy); x.lineTo(xx - u * .25, yy + u * 1.3); x.lineTo(xx + u * .25, yy + u * 1.3); x.fill(); }
    /* Kerzen */
    for (let i = 0; i < 7; i++) {
      const xx = (i - 3) * u * 1.8, yy = u * 1.2 - Math.abs(i - 3) * u * .1;
      x.fillStyle = "#efe4cc"; x.fillRect(xx - u * .2, yy - u * 1.4, u * .4, u * 1.4);
      const f = .8 + .2 * Math.sin(t * 13 + i * 2.1);
      x.fillStyle = "#ffcf70"; x.beginPath(); x.ellipse(xx, yy - u * 1.8, u * .25 * f, u * .55 * f, 0, 0, TAU); x.fill();
      leucht(x, xx, yy - u * 1.8, u * 4, "#ffc060", .28 * f);
    }
    x.restore();
    leucht(x, px, py + u * 3, u * 22, z.licht || "#ffd890", .1 + .05 * z.st);
  }

  /* die Besetzung der Logen pro Seite (fest, damit nichts springt) */
  const GAESTE = ["dame", "herr", "fernglas", "herr", "dame", "zwerg", "herr", "fernglas"];

  window.AUFTRITT_PANO = function (x, info, z) {
    const { W, H, L, R, oben, unten, t } = info;
    const u = H / 70, ruhig = info.ruhig, tt = ruhig ? 0 : t;
    const e = .25 + z.st * .9 + z.jubel;
    for (const seite of [-1, 1]) {
      const a = seite < 0 ? -L : W, b = seite < 0 ? 0 : W + R, br = b - a, r = zuf(seite < 0 ? 311 : 977);
      /* Wand: Samttapete mit Rautenmuster */
      const gw = x.createLinearGradient(0, oben, 0, unten);
      gw.addColorStop(0, "#160a0c"); gw.addColorStop(.5, hex(z.vorhang, .32)); gw.addColorStop(1, "#0c0608");
      x.fillStyle = gw; x.fillRect(a, oben, br, unten - oben);
      x.strokeStyle = "rgba(201,160,64,.07)"; x.lineWidth = 1;
      for (let i = -20; i < 40; i++) { const xx = a + i * u * 6; x.beginPath(); x.moveTo(xx, oben); x.lineTo(xx + (unten - oben) * .6, unten); x.moveTo(xx, oben); x.lineTo(xx - (unten - oben) * .6, unten); x.stroke(); }
      /* Säulen zwischen den Logen */
      const spalten = Math.max(1, Math.floor(br / (u * 19)));
      const sb = br / spalten;
      for (let i = 0; i <= spalten; i++) {
        const sx = a + i * sb;
        const gs = x.createLinearGradient(sx - u * 1.6, 0, sx + u * 1.6, 0);
        gs.addColorStop(0, "#1a1008"); gs.addColorStop(.45, "#8a6a30"); gs.addColorStop(1, "#140c06");
        x.fillStyle = gs; x.fillRect(sx - u * 1.6, oben, u * 3.2, unten - oben);
      }
      /* drei Ränge */
      const raenge = [H * .17, H * .405, H * .64];
      let n = 0;
      raenge.forEach((ry, ri) => {
        for (let i = 0; i < spalten; i++, n++) {
          const lx = a + i * sb + u * 2.4, bw = sb - u * 4.8, bh = H * .155;
          if (bw < u * 6) continue;
          /* nach außen weiter weg = etwas dunkler */
          const ab = seite < 0 ? (spalten - 1 - i) : i;
          const nah = ab === 0;
          const id = (seite < 0 ? "L" : "R") + ri + "_" + ab;
          loge(x, lx, ry, bw, bh, u, null, z, tt, (lx, ly, bw, bh) => {
            const basis = ly + bh * .6;
            const sonder = SONDER[id];
            if (sonder) { sonder(x, lx, ly, bw, bh, u * (id === "R2_0" ? 1 : 1.35), tt, z, basis); return; }
            const k = 2 + ((n * 7 + ri) % 3);
            for (let j = 0; j < k; j++) {
              const ph = n * 1.7 + j * 2.3, px = lx + bw * (j + .7) / (k + .4);
              const bob = ruhig ? 0 : -Math.abs(Math.sin((z.schlag + j * .13 + n * .07) * Math.PI)) * u * .45 * e;
              const arm = z.jubel > .6 || z.st > .72 + ((j * 13 + n * 7) % 10) / 40 ? 1 : 0;
              gast(x, px, basis, u * (nah ? 1.8 : 1.7), bob, arm, nah ? "#3a242a" : "#2e1d22", GAESTE[(n + j) % GAESTE.length], tt, ph);
              /* schlechte Stimmung: jemand schläft */
              if (z.st < .3 && (j + n) % 4 === 0) { const q = (tt * .5 + j) % 1; x.fillStyle = "rgba(235,226,204," + (1 - q) * .6 + ")"; x.font = "italic " + (u * (1.2 + q)) + "px Georgia,serif"; x.textAlign = "center"; x.fillText("z", px + u * 1.5 + q * u * 2, basis - u * 3 - q * u * 3); }
            }
          });
          if (!nah) { x.fillStyle = "rgba(6,4,8," + Math.min(.35, ab * .1) + ")"; x.fillRect(lx - u, ry - u, bw + u * 2, bh + u * 4); }
        }
      });
      /* Kronleuchter */
      const kx = seite < 0 ? -Math.min(L * .45, u * 34) : W + Math.min(R * .45, u * 34);
      if (Math.abs(kx - (seite < 0 ? 0 : W)) > u * 10) kronleuchter(x, kx, H * .055, u, tt, z, seite);
      /* Orchestergraben: Köpfe, Notenpulte mit Lämpchen, ein Kontrabass-Hals */
      const gy = H * .86;
      x.fillStyle = "#0a0608"; x.fillRect(a, gy, br, unten - gy);
      x.fillStyle = "#c9a040"; x.fillRect(a, gy, br, u * .4);
      for (let i = 0; i < br / (u * 7); i++) {
        const px = a + (i + .5) * u * 7, ph = i * 1.9 + seite;
        x.fillStyle = "#1a1214"; x.fillRect(px - u * 1.4, gy + u * 2.2, u * 2.8, u * .5);
        leucht(x, px, gy + u * 2.4, u * 3, "#ffd890", .18);
        x.fillStyle = "#050304"; x.beginPath(); x.arc(px + u * .5, gy + u * 4.6 + Math.sin(tt * 4 + ph) * u * .2 * e, u * 1.4, 0, TAU); x.fill();
        if (i % 5 === 2) { x.fillStyle = "#2a1408"; x.save(); x.translate(px + u * 2.2, gy + u * 6); x.rotate(-.2 + Math.sin(tt * 2 + ph) * .04); x.fillRect(-u * .25, -u * 9, u * .5, u * 9); x.beginPath(); x.ellipse(0, -u * 9.5, u * .5, u * .9, 0, 0, TAU); x.fill(); x.restore(); }
        if (i % 4 === 1 && !ruhig) { const q = (tt * .7 + i * .37) % 1; x.fillStyle = "rgba(255,226,160," + (1 - q) * .5 * kl(z.st, .2, 1) + ")"; x.font = (u * 1.6) + "px serif"; x.textAlign = "center"; x.fillText(i % 2 ? "♪" : "♫", px + Math.sin(q * 6) * u, gy - q * u * 9); }
      }
      /* Jubel: Rosen und Papierschnipsel aus den Logen */
      if (!ruhig && (z.jubel > .3 || z.ende === 1)) {
        const rr = zuf(Math.floor(tt * 2) + (seite < 0 ? 5 : 9));
        for (let i = 0; i < 26; i++) {
          const px = a + rr() * br, f = (tt * (.25 + rr() * .3) + rr()) % 1, py = oben + H * .1 + f * H * .9;
          x.save(); x.translate(px + Math.sin(tt * 2 + i) * u * 2, py); x.rotate(tt * 3 + i);
          x.globalAlpha = kl(z.jubel, 0, 1) * (1 - f * .4);
          x.fillStyle = ["#e0a046", "#c84a3a", "#f0d48a", "#e8e0d0"][i % 4]; x.fillRect(-u * .5, -u * .25, u, u * .5);
          x.restore();
        }
        x.globalAlpha = 1;
      }
      /* Feuer in der Serie: Wandfackeln lodern heller */
      if (z.feuer > 0) {
        const fx = seite < 0 ? -u * 6 : W + u * 6;
        for (let i = 0; i < 3; i++) leucht(x, fx, H * (.24 + i * .24), u * (8 + z.feuer * 3), "#ff8a30", .12 * z.feuer * (.8 + .2 * Math.sin(tt * 11 + i)));
      }
    }
  };

  /* ---------- besondere Logen (Easter Eggs) ---------- */
  const SONDER = {
    /* Ezekiel: nur Kapuze, Augen und ein Dolch, der sich dreht */
    L1_0(x, lx, ly, bw, bh, u, t, z, basis) {
      const px = lx + bw * .5;
      x.fillStyle = "#050304"; x.beginPath(); x.moveTo(px - u * 3.2, basis + u * 3); x.quadraticCurveTo(px - u * 3, basis - u * 4.5, px, basis - u * 5.6); x.quadraticCurveTo(px + u * 3, basis - u * 4.5, px + u * 3.2, basis + u * 3); x.fill();
      const z0 = (t * .5) % 6, offen = z0 < 5.8 ? 1 : .15;
      x.fillStyle = "rgba(230,200,120,.9)"; [-1, 1].forEach(s => { x.beginPath(); x.ellipse(px + s * u * .7, basis - u * 3.2, u * .3, u * .3 * offen, 0, 0, TAU); x.fill(); });
      x.save(); x.translate(px + u * 3.6, basis - u * 1 + Math.sin(t * 2) * u * .6); x.rotate(t * 5);
      x.fillStyle = "#d8d0c0"; x.beginPath(); x.moveTo(0, -u * 1.6); x.lineTo(u * .25, 0); x.lineTo(-u * .25, 0); x.fill(); x.fillStyle = "#4a2a14"; x.fillRect(-u * .5, 0, u, u * .25); x.fillRect(-u * .15, 0, u * .3, u * .9);
      x.restore();
    },
    /* Friedrich: Armbrust auf der Brüstung, zielt auf die Bühne (Kopfschuss-Experte) */
    R1_0(x, lx, ly, bw, bh, u, t, z, basis) {
      const px = lx + bw * .55;
      gast(x, px, basis, u * 1.3, 0, 0, "#2a1a20", "herr", t, 0);
      x.fillStyle = "#2a1a10"; x.save(); x.translate(px - u * 1.6, basis - u * .6); x.rotate(-.08 + Math.sin(t * .7) * .05);
      x.fillRect(-u * 5, -u * .3, u * 5, u * .6); x.strokeStyle = "#3a2818"; x.lineWidth = u * .35; x.beginPath(); x.moveTo(-u * 4.4, -u * 1.8); x.quadraticCurveTo(-u * 3.6, 0, -u * 4.4, u * 1.8); x.stroke();
      x.restore();
      /* Ziellicht blitzt kurz */
      const q = (t * .25) % 1; if (q < .06) leucht(x, px - u * 6.6, basis - u * 1, u * 2.6, "#ffe0a0", .9 * (1 - q / .06));
      x.fillStyle = "#3a2a1a"; x.fillRect(px + u * .6, basis - u * 2.8, u * 1.8, u * .5); /* Hut */
    },
    /* Rex im Körbchen, schläft, außer die Stimmung kocht */
    L2_0(x, lx, ly, bw, bh, u, t, z, basis) {
      const px = lx + bw * .5, wach = z.st > .75 || z.jubel > .6;
      if (z.rexWeg) { x.fillStyle = "#4a3018"; x.beginPath(); x.ellipse(px, basis + u * .6, u * 5, u * 1.6, 0, 0, Math.PI); x.fill(); x.fillStyle = "rgba(235,226,204,.6)"; x.font = (u * 2) + "px Georgia,serif"; x.textAlign = "center"; x.fillText("?", px, basis - u * 2); return; }
      x.fillStyle = "#4a3018"; x.beginPath(); x.ellipse(px, basis + u * .6, u * 5, u * 1.6, 0, 0, Math.PI); x.fill();
      x.fillStyle = "#6a4a2a"; x.beginPath(); x.ellipse(px, basis - u * .6, u * 3.8, u * 1.8, 0, 0, TAU); x.fill();
      const kopfY = wach ? basis - u * 3.2 + Math.abs(Math.sin(t * 8)) * -u * .6 : basis - u * 1;
      x.beginPath(); x.arc(px - u * 2.6, kopfY, u * 1.6, 0, TAU); x.fill();
      x.beginPath(); x.ellipse(px - u * 4.2, kopfY + u * .4, u * 1.1, u * .7, 0, 0, TAU); x.fill();
      x.fillStyle = "#4a3018"; x.beginPath(); x.ellipse(px - u * 1.8, kopfY - u * 1, u * .5, u * 1.2, .6 + (wach ? Math.sin(t * 10) * .3 : 0), 0, TAU); x.fill();
      x.fillStyle = "#1a0e08"; x.beginPath(); x.arc(px - u * 5.1, kopfY + u * .2, u * .35, 0, TAU); x.fill();
      if (wach) { x.fillStyle = "#d06a6a"; x.beginPath(); x.ellipse(px - u * 4.4, kopfY + u * 1.3, u * .4, u * .7, 0, 0, TAU); x.fill(); x.strokeStyle = "#6a4a2a"; x.lineWidth = u * .5; x.beginPath(); x.moveTo(px + u * 3.4, basis - u * 1); x.lineTo(px + u * 4.6 + Math.sin(t * 16) * u, basis - u * 2.6); x.stroke(); }
      else { const q = (t * .6) % 1; x.fillStyle = "rgba(235,226,204," + (1 - q) * .7 + ")"; x.font = "italic " + (u * (1.2 + q * .8)) + "px Georgia,serif"; x.textAlign = "center"; x.fillText("z", px - u * 2 + q * u * 2, kopfY - u * 2 - q * u * 3); }
      /* die verschwundene Kelle liegt daneben */
      x.strokeStyle = "#9a9a8a"; x.lineWidth = u * .3; x.beginPath(); x.moveTo(px + u * 2, basis + u * .2); x.lineTo(px + u * 4.4, basis - u * 1.4); x.stroke();
      x.fillStyle = "#9a9a8a"; x.beginPath(); x.ellipse(px + u * 1.6, basis + u * .4, u * .8, u * .5, .4, 0, TAU); x.fill();
    },
    /* Der Arm (Kapitel III) – mit Ring, klatscht im Takt */
    R2_0(x, lx, ly, bw, bh, u, t, z, basis) {
      const px = lx + bw * .5, k = Math.abs(Math.sin(z.schlag * Math.PI)) * (z.st > .45 ? 1 : .2);
      x.save(); x.translate(px, basis + u * 3.2); x.scale(.8, .8); x.rotate(-.15 + k * .25);
      x.fillStyle = "#c8b8a0"; x.fillRect(-u * .7, -u * 7, u * 1.4, u * 7);
      x.beginPath(); x.ellipse(0, -u * 7.6, u * 1.1, u * 1.3, 0, 0, TAU); x.fill();
      for (let i = 0; i < 4; i++) x.fillRect(-u * .9 + i * u * .55, -u * 9.6 - (i === 1 || i === 2 ? u * .3 : 0), u * .38, u * 1.8);
      x.fillRect(u * .9, -u * 8.4, u * .9, u * .38);
      /* der Ring */
      x.fillStyle = "#e0b040"; x.fillRect(-u * .38, -u * 8.5, u * .5, u * .3);
      x.restore();
      const gl = Math.max(0, Math.sin(t * 1.1)) ** 12; if (gl > .05) leucht(x, px - u * .4, basis - u * 3.6, u * 2.2, "#ffe080", gl);
      x.fillStyle = "#3a2a20"; x.fillRect(px - u * 2.6, basis + u * 1.2, u * 5.2, u * 1); /* Sockel */
      if (k > .85) { x.fillStyle = "rgba(255,240,200,.7)"; x.font = (u * 1.2) + "px Georgia,serif"; x.textAlign = "center"; x.fillText(document.documentElement.lang === "en" ? "clap" : "klatsch", px + u * 3.6, basis - u * 4); }
    },
    /* Echo als Rabe auf der obersten Brüstung, guckt mal links, mal rechts */
    L0_0(x, lx, ly, bw, bh, u, t, z, basis) {
      gast(x, lx + bw * .28, basis, u, 0, z.st > .7 ? 1 : 0, "#0d080a", "dame", t, 1);
      const px = lx + bw * .72, py = ly + bh * .66, blick = Math.sin(t * .9) > 0 ? 1 : -1, hop = Math.max(0, Math.sin(t * 2.3)) ** 20 * u;
      x.fillStyle = "#050406"; x.beginPath(); x.ellipse(px, py - u * 1.6 - hop, u * 1.4, u * 1.8, 0, 0, TAU); x.fill();
      x.beginPath(); x.arc(px + blick * u * .9, py - u * 3.4 - hop, u * .9, 0, TAU); x.fill();
      x.fillStyle = "#2a2a2a"; x.beginPath(); x.moveTo(px + blick * u * 1.6, py - u * 3.6 - hop); x.lineTo(px + blick * u * 2.8, py - u * 3.2 - hop); x.lineTo(px + blick * u * 1.6, py - u * 3.0 - hop); x.fill();
      x.fillStyle = "#e0c060"; x.beginPath(); x.arc(px + blick * u * 1.1, py - u * 3.6 - hop, u * .18, 0, TAU); x.fill();
      x.fillStyle = "#050406"; x.beginPath(); x.moveTo(px - blick * u * 1, py - u * .6 - hop); x.lineTo(px - blick * u * 2.6, py + u * .4 - hop); x.lineTo(px - blick * u * .6, py - hop); x.fill();
    },
    /* Buppido mit Schild „Altar?“ */
    R0_0(x, lx, ly, bw, bh, u, t, z, basis) {
      const px = lx + bw * .3, hb = Math.sin(t * 3) * u * .4;
      gast(x, px, basis, u * .8, hb, 0, "#0d080a", "herr", t, 2);
      x.strokeStyle = "#3a2818"; x.lineWidth = u * .3; x.beginPath(); x.moveTo(px + u * 1.4, basis + u); x.lineTo(px + u * 2.6, basis - u * 2.6 + hb); x.stroke();
      x.save(); x.translate(px + u * 3.4, basis - u * 3.2 + hb); x.rotate(Math.sin(t * 3) * .08);
      x.fillStyle = "#d8c8a0"; x.fillRect(-u * 2.2, -u * 1.1, u * 4.4, u * 1.9);
      x.fillStyle = "#3a1a10"; x.font = "bold " + (u * 1.3) + "px Georgia,serif"; x.textAlign = "center"; x.textBaseline = "middle";
      x.fillText("Altar?", 0, -u * .2); x.textBaseline = "alphabetic";
      x.restore();
    },
    /* ein Duergar, der immer wieder unsichtbar wird */
    L0_1(x, lx, ly, bw, bh, u, t, z, basis) {
      gast(x, lx + bw * .3, basis, u, 0, z.st > .75 ? 1 : 0, "#140c0e", "herr", t, 3);
      const sicht = kl(Math.sin(t * .45) * 2 + .5, 0, 1);
      if (sicht <= 0) { x.fillStyle = "rgba(255,255,255,.12)"; x.beginPath(); x.arc(lx + bw * .7 + Math.sin(t * 7) * u * .3, basis - u * 1.6, u * .4, 0, TAU); x.fill(); return; }
      x.globalAlpha = sicht;
      gast(x, lx + bw * .7, basis, u * .95, 0, 0, "#2a2428", "zwerg", t, 4);
      x.fillStyle = "rgba(255,80,40,.85)"; [-1, 1].forEach(s => { x.beginPath(); x.arc(lx + bw * .7 + s * u * .45, basis - u * 2.3, u * .2, 0, TAU); x.fill(); });
      x.globalAlpha = 1;
    }
  };
})();
