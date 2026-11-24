/* Ezekiel – The Destroyer · Bild
   Hintergründe mit Parallaxe (je Gebiet eigene Szenerie), Kacheln (zwischengespeichert pro Raum), Requisiten, Licht und Wetter. */
(function () {
  "use strict";
  const Z = window.Z, U = Z.U, T = Z.TILE, FX = Z.fx, D = Z.draw;
  const G = (Z.gfx = { scale: 2, bs: 2, chunks: new Map(), layers: null, light: null, time: 0, tileHooks: [] });
  let lv = null, B = null;

  /* Farbe aufhellen/abdunkeln (#rrggbb) */
  function shade(hex, f) { const n = parseInt(hex.slice(1), 16); let r = n >> 16, g = (n >> 8) & 255, b = n & 255; if (f > 0) { r += (255 - r) * f; g += (255 - g) * f; b += (255 - b) * f; } else { r *= 1 + f; g *= 1 + f; b *= 1 + f; } return "rgb(" + (r | 0) + "," + (g | 0) + "," + (b | 0) + ")"; }
  function rgbaS(hex, a) { const n = parseInt(hex.slice(1), 16); return "rgba(" + (n >> 16) + "," + ((n >> 8) & 255) + "," + (n & 255) + "," + a + ")"; }
  function mix(a, b, t) { const A = parseInt(a.slice(1), 16), Bb = parseInt(b.slice(1), 16); const r = ((A >> 16) * (1 - t) + (Bb >> 16) * t) | 0, g = (((A >> 8) & 255) * (1 - t) + ((Bb >> 8) & 255) * t) | 0, bl = ((A & 255) * (1 - t) + (Bb & 255) * t) | 0; return "rgb(" + r + "," + g + "," + bl + ")"; }
  Z.shade = shade;
  /* Pseudozufall aus Koordinaten (stabil) */
  const hash = (x, y) => { let h = (x * 374761393 + y * 668265263) ^ 0x5bd1e995; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };

  G.setLevel = function (level, biome) {
    lv = level; B = biome; G.chunks.clear(); G.layers = null; fgState.clear(); G.dropCaches();
    Z.dustCol = shade(B.tile.light, -0.15); Z.tileCol = B.tile.base;
    /* Innen/Außen: Spalten ohne Decke zeigen den Himmel */
    G.sky = new Uint8Array(lv.W * lv.H);
    if (lv.out) for (let x = 0; x < lv.W; x++) for (let y = 0; y < lv.H; y++) { if (y > 0 && (lv.get(x, y) === 1 || lv.get(x, y) === 7)) break; G.sky[y * lv.W + x] = 1; }
    if (lv.hub || (lv.arena && lv.out)) for (let x = 0; x < lv.W; x++) for (let y = 0; y < lv.H - 3; y++) if (lv.get(x, y) !== 1 || lv.hub) G.sky[y * lv.W + x] = lv.get(x, y) === 1 && !lv.hub ? 0 : 1;
    PR = null; G.openings = [];
    G.buildLayers();
  };
  /* Kacheln geändert (z. B. Wand zerstört): Vorberechnung erneuern, nur betroffene Chunks verwerfen */
  Z.dirtyTiles = (tx, ty) => {
    if (lv && B) prep();
    if (tx == null || ty == null) { G.chunks.clear(); return; }
    for (const k of [...G.chunks.keys()]) { const [cx, cy] = k.split(",").map(Number); if (tx >= cx * CH_W - 4 && tx < (cx + 1) * CH_W + 4 && ty >= cy * CH_H - 4 && ty < (cy + 1) * CH_H + 4) G.chunks.delete(k); }
  };

  /* ======================= PARALLAXE ======================= */
  const LW = 640; /* Breite einer Kachel des Hintergrunds (wiederholt sich) */
  G.buildLayers = function () {
    if (!B) return;
    if (G.layers && G.dropLayer) { G.dropLayer(G.layers.far.cv); G.dropLayer(G.layers.mid.cv); }
    const H = Math.ceil((Z.cam.h + 120));
    const mk = s => { const cv = document.createElement("canvas"); cv.width = Math.ceil(LW * s); cv.height = Math.ceil(H * s); const c = cv.getContext("2d"); const sx = cv.width / LW, sy = cv.height / H; c.scale(sx, sy); return { cv, c, s, sx, sy, H }; };
    const far = mk(Math.min(G.scale, 1.15)), mid = mk(Math.min(G.scale, 1.7));
    /* Himmel direkt in die ferne Ebene backen (spart eine Vollbildfüllung pro Bild) */
    const g = far.c.createLinearGradient(0, 40, 0, H - 80); g.addColorStop(0, B.sky[0]); g.addColorStop(0.6, B.sky[1]); g.addColorStop(1, B.sky[2]); far.c.fillStyle = g; far.c.fillRect(0, 0, LW, H);
    const R = Z.Rng((B.name[0].length * 9973 + 17) >>> 0);
    const ak = lv && lv.arena ? Z.ARENAS[lv.arena].kind : null;
    const kind = ak === "hoard" ? "hoardbg" : ak === "lab" ? "labbg" : ak === "lakeboss" ? "lake" : ak === "towertop" ? "storm" : ak === "pier" ? "harbour" : ak === "tower" ? "ramparts" : B.bg;
    paintBg(kind, far.c, mid.c, H, R);
    G.layers = { far, mid, H };
  };
  function repeatDraw(c, fn) { for (const o of [-LW, 0, LW]) { c.save(); c.translate(o, 0); fn(); c.restore(); } }
  function silTower(c, x, base, w, h, col, win, R) {
    c.fillStyle = col; c.fillRect(x, base - h, w, h);
    for (let i = 0; i < w; i += 6) c.fillRect(x + i, base - h - 4, 3, 4);
    if (R.chance(0.5)) { c.beginPath(); c.moveTo(x - 3, base - h); c.lineTo(x + w / 2, base - h - w * 1.2); c.lineTo(x + w + 3, base - h); c.fill(); }
    if (win) for (let k = 0; k < 3; k++) if (R.chance(0.6)) { c.fillStyle = win; c.fillRect(x + w / 2 - 1.5, base - h + 10 + k * 14, 3, 5); c.fillStyle = col; }
  }
  /* Mauerfugen in Silhouetten: deutet Steinlagen an, ohne die Ferne unruhig zu machen */
  function bgCourses(c, x, y, w, h, a, rh) {
    rh = rh || 6; c.fillStyle = "rgba(0,0,0," + a + ")";
    for (let yy = y + rh; yy < y + h; yy += rh) { c.fillRect(x, yy, w, 0.6); const off = ((yy / rh) & 1) * rh; for (let xx = x + off; xx < x + w; xx += rh * 2.2) c.fillRect(xx, yy - rh, 0.6, rh); }
  }
  /* Turm mit Zinnen oder Kegeldach, erleuchteten Fenstern und Mondkante */
  function bgTower(c, x, base, w, h, col, R, winCol, rim) {
    c.fillStyle = col; c.fillRect(x, base - h, w, h);
    bgCourses(c, x, base - h, w, h, 0.18, 5);
    if (rim) { c.fillStyle = rim; c.fillRect(x + w - 1.2, base - h, 1.2, h); }
    const roof = R.chance(0.55);
    if (roof) { c.fillStyle = lit(col, -0.12); c.beginPath(); c.moveTo(x - 3, base - h); c.lineTo(x + w / 2, base - h - w * 1.4); c.lineTo(x + w + 3, base - h); c.fill(); if (rim) { c.strokeStyle = rim; c.lineWidth = 0.8; c.beginPath(); c.moveTo(x + w / 2, base - h - w * 1.4); c.lineTo(x + w + 3, base - h); c.stroke(); }
      if (R.chance(0.5)) { c.fillStyle = col; c.fillRect(x + w / 2 - 0.4, base - h - w * 1.4 - 8, 0.8, 8); c.fillStyle = "rgba(150,40,40,.8)"; c.beginPath(); c.moveTo(x + w / 2 + 0.4, base - h - w * 1.4 - 8); c.lineTo(x + w / 2 + 6, base - h - w * 1.4 - 6.5); c.lineTo(x + w / 2 + 0.4, base - h - w * 1.4 - 5); c.fill(); } }
    else { c.fillStyle = col; c.fillRect(x - 2, base - h - 2, w + 4, 3); for (let i = -2; i < w + 2; i += 5) c.fillRect(x + i, base - h - 6, 3, 4); }
    if (winCol) for (let k = 0; k < 4; k++) if (R.chance(0.55)) { const wy = base - h + 8 + k * 13; if (wy > base - 6) break; D.glow(c, x + w / 2, wy + 2.5, 6, "rgba(255,170,90,.35)"); c.fillStyle = winCol; c.beginPath(); c.moveTo(x + w / 2 - 1.6, wy + 5); c.lineTo(x + w / 2 - 1.6, wy + 1.4); c.quadraticCurveTo(x + w / 2, wy - 0.6, x + w / 2 + 1.6, wy + 1.4); c.lineTo(x + w / 2 + 1.6, wy + 5); c.fill(); }
  }
  function paintBg(kind, f, m, H, R) {
    const sky = B.sky;
    switch (kind) {
      case "castle": case "ramparts": case "harbour": case "spires": case "storm": case "camp": {
        /* Sterne, Mond, Wolken */
        if (kind !== "spires" && kind !== "storm") for (let i = 0; i < 90; i++) { f.fillStyle = "rgba(255,240,230," + (0.2 + R() * 0.6) + ")"; const sz = R() < 0.1 ? 1.4 : 0.8; f.fillRect(R() * LW, R() * H * 0.6, sz, sz); }
        if (kind === "castle" || kind === "harbour" || kind === "camp" || kind === "ramparts") { const mx = 380, my = 50; D.glow(f, mx, my, 60, "rgba(255,230,200,.25)"); D.circ(f, mx, my, 14, "#f0e6d4"); D.circ(f, mx - 4, my - 3, 3, "#d8ccb8"); D.circ(f, mx + 5, my + 4, 2, "#d8ccb8"); }
        if (kind === "spires") { for (let i = 0; i < 14; i++) { const x = R() * LW, y = 30 + R() * 120; repeatDraw(f, () => D.ell(f, x, y, 40 + R() * 60, 6 + R() * 8, "rgba(255,120,60," + (0.08 + R() * 0.1) + ")")); } }
        if (kind === "storm") { for (let i = 0; i < 10; i++) { const x = R() * LW, y = 20 + R() * 100; repeatDraw(f, () => D.ell(f, x, y, 60 + R() * 70, 12 + R() * 14, "rgba(30,44,30," + (0.4 + R() * 0.3) + ")")); } }
        /* zwei Bergketten: die hintere im Dunst, die vordere mit Mondkante (nahtlos über LW) */
        const ridge = (yb, a1, a2, p1, p2, col, rim) => { const yf = x => yb - Math.sin(x * Math.PI * 2 / LW * p1) * a1 - Math.sin(x * Math.PI * 2 / LW * p2 + 2) * a2;
          const g = f.createLinearGradient(0, yb - a1 - a2, 0, H); g.addColorStop(0, col); g.addColorStop(1, shade(col.slice(0, 7), -0.4)); f.fillStyle = g;
          f.beginPath(); f.moveTo(0, H); for (let x = 0; x <= LW; x += 8) f.lineTo(x, yf(x)); f.lineTo(LW, H); f.fill();
          if (rim) { f.strokeStyle = rim; f.lineWidth = 0.8; f.beginPath(); for (let x = 0; x <= LW; x += 8) x ? f.lineTo(x, yf(x)) : f.moveTo(x, yf(x)); f.stroke(); } };
        ridge(H * 0.56, 22, 10, 3, 7, mixH(sky[1], sky[2], 0.3), null);
        ridge(H * 0.63, 26, 14, 2, 5, lit(sky[1], -0.35), kind === "storm" ? null : "rgba(255,230,210,.14)");
        /* Dunst über dem Tal */
        const hz = f.createLinearGradient(0, H * 0.5, 0, H * 0.72); hz.addColorStop(0, "rgba(255,220,210,0)"); hz.addColorStop(0.6, rgbaS(sky[2], 0.22)); hz.addColorStop(1, "rgba(255,220,210,0)"); f.fillStyle = hz; f.fillRect(0, H * 0.5, LW, H * 0.22);
        const towerCol = lit(sky[1], -0.5);
        for (let i = 0; i < 6; i++) { const x = i * 110 + R() * 40, w = 14 + R() * 14, h = 50 + R() * 80; repeatDraw(f, () => bgTower(f, x, H * 0.66, w, h, towerCol, R, kind === "spires" ? null : "rgba(255,190,110,.75)", kind === "storm" ? null : "rgba(255,230,210,.12)")); }
        if (kind === "harbour") {
          /* Wasser mit Mondspiegelung */
          const wy = H * 0.7; f.fillStyle = shade(sky[0], -0.2); f.fillRect(0, wy, LW, H - wy);
          for (let i = 0; i < 40; i++) { f.fillStyle = "rgba(240,220,200," + (0.1 + R() * 0.25) + ")"; f.fillRect(380 - 20 + R() * 40 + (R() - 0.5) * i, wy + 4 + i * 3, 6 + R() * 10, 1); }
          /* Schiffe */
          for (let i = 0; i < 3; i++) { const x = 60 + i * 210 + R() * 40; repeatDraw(m, () => { m.fillStyle = "#1a1418"; m.beginPath(); m.moveTo(x - 30, H * 0.72); m.lineTo(x + 34, H * 0.72); m.lineTo(x + 24, H * 0.8); m.lineTo(x - 22, H * 0.8); m.fill(); m.fillRect(x - 1, H * 0.72 - 70, 2, 70); m.fillRect(x + 14, H * 0.72 - 50, 1.5, 50); m.fillStyle = "rgba(60,40,40,.9)"; m.beginPath(); m.moveTo(x + 1, H * 0.72 - 64); m.lineTo(x + 22, H * 0.72 - 30); m.lineTo(x + 1, H * 0.72 - 22); m.fill(); m.strokeStyle = "rgba(20,14,18,.9)"; m.lineWidth = 0.6; m.beginPath(); m.moveTo(x, H * 0.72 - 70); m.lineTo(x - 30, H * 0.72); m.moveTo(x, H * 0.72 - 70); m.lineTo(x + 34, H * 0.72); m.stroke(); m.fillStyle = "rgba(255,200,120,.8)"; m.fillRect(x - 10, H * 0.74, 2, 2); }); }
          /* Leuchtturm */
          repeatDraw(f, () => { f.fillStyle = towerCol; f.fillRect(560, H * 0.38, 12, H * 0.3); f.fillStyle = "rgba(255,210,120,.9)"; f.fillRect(560, H * 0.38 - 6, 12, 6); D.glow(f, 566, H * 0.38 - 3, 40, "rgba(255,200,120,.35)"); });
        }
        /* mittlere Ebene: Mauern mit Zinnen */
        if (kind !== "harbour") {
          const col = shade(B.wall, -0.25), rim = kind === "storm" ? "rgba(220,230,200,.12)" : "rgba(255,226,200,.16)";
          repeatDraw(m, () => {
            const top = H * 0.72;
            /* Wehrmauer mit Steinlagen, Zinnen mit Mondkante, Schießscharten */
            m.fillStyle = col; m.fillRect(0, top, LW, H - top);
            bgCourses(m, 0, top, LW, H - top, 0.22, 7);
            for (let x = 0; x < LW; x += 14) { m.fillStyle = col; m.fillRect(x, top - 7, 8, 7); m.fillStyle = rim; m.fillRect(x, top - 7, 8, 0.8); }
            m.fillStyle = "rgba(0,0,0,.35)"; m.fillRect(0, top, LW, 2);
            for (let x = 30; x < LW; x += 46) { m.fillStyle = "#0a0608"; m.fillRect(x, top + 12, 1.6, 9); m.fillRect(x - 1.5, top + 15.5, 4.6, 1.4); }
            for (let i = 0; i < 4; i++) {
              const x = 40 + i * 160, tw = 34, th = 60;
              m.fillStyle = col; m.fillRect(x, top - th, tw, th); bgCourses(m, x, top - th, tw, th, 0.2, 6);
              /* Pechnasen (Maschikulis) und Zinnenkranz */
              m.fillStyle = col; m.fillRect(x - 3, top - th - 4, tw + 6, 5); m.fillStyle = "rgba(0,0,0,.4)"; for (let k = 0; k < tw + 6; k += 5) m.fillRect(x - 3 + k + 1, top - th + 1, 2, 2);
              for (let k = -2; k < tw + 2; k += 9) { m.fillStyle = col; m.fillRect(x + k, top - th - 10, 5, 6); m.fillStyle = rim; m.fillRect(x + k, top - th - 10, 5, 0.8); }
              m.fillStyle = rim; m.fillRect(x + tw - 1, top - th, 1, th);
              /* erleuchtetes Bogenfenster mit Kreuzsprosse */
              D.glow(m, x + 16.5, top - 39, 12, "rgba(255,170,80,.35)");
              m.fillStyle = "rgba(255,180,90,.75)"; m.beginPath(); m.moveTo(x + 14, top - 34); m.lineTo(x + 14, top - 42); m.quadraticCurveTo(x + 16.5, top - 46, x + 19, top - 42); m.lineTo(x + 19, top - 34); m.fill();
              m.fillStyle = col; m.fillRect(x + 16.1, top - 45, 0.8, 11); m.fillRect(x + 14, top - 39.5, 5, 0.8);
              if (R.chance(0.6)) { m.fillStyle = "rgba(120,24,30,.85)"; m.fillRect(x + 4, top - th + 6, 6, 14); m.beginPath(); m.moveTo(x + 4, top - th + 20); m.lineTo(x + 7, top - th + 24); m.lineTo(x + 10, top - th + 20); m.fill(); m.fillStyle = "rgba(229,180,84,.7)"; m.fillRect(x + 6.4, top - th + 10, 1.4, 1.4); }
            }
            /* Bodennebel vor der Mauer */
            const g = m.createLinearGradient(0, H * 0.86, 0, H); g.addColorStop(0, "rgba(0,0,0,0)"); g.addColorStop(1, "rgba(0,0,0,.35)"); m.fillStyle = g; m.fillRect(0, H * 0.86, LW, H * 0.14);
          });
        }
        if (kind === "camp") {
          /* Die Feste der Fäden auf dem Hügel, mit Netzfäden */
          repeatDraw(m, () => { m.fillStyle = "#1a1018"; m.beginPath(); m.moveTo(200, H * 0.75); m.quadraticCurveTo(320, H * 0.5, 460, H * 0.75); m.fill(); for (const [x, h, w] of [[290, 90, 16], [318, 120, 20], [350, 80, 14], [372, 60, 12]]) { m.fillRect(x, H * 0.58 - h, w, h); m.beginPath(); m.moveTo(x - 2, H * 0.58 - h); m.lineTo(x + w / 2, H * 0.58 - h - w * 1.4); m.lineTo(x + w + 2, H * 0.58 - h); m.fill(); }
            /* R19: Spinnfäden statt Drahtgitter – leicht durchhängende Speichen, Fangfäden als Bögen zwischen den Speichen,
               nach außen dünner; vereinzelt Tautropfen */
            const ax = 328, ay = H * 0.58 - 140, sp = [];
            for (let i = 0; i < 9; i++) sp.push([220 + i * 28 + (i % 3 - 1) * 6, H * 0.75 - (i % 2) * 6]);
            m.strokeStyle = "rgba(220,210,230,.16)"; m.lineWidth = 0.45;
            for (const [ex, ey] of sp) { m.beginPath(); m.moveTo(ax, ay); m.quadraticCurveTo((ax + ex) / 2 + (ex - ax) * 0.06, (ay + ey) / 2 + 6, ex, ey); m.stroke(); }
            const at = (k, r) => { const [ex, ey] = sp[k], u = r / 140, mx = (ax + ex) / 2 + (ex - ax) * 0.06, my = (ay + ey) / 2 + 6; return [(1 - u) * (1 - u) * ax + 2 * (1 - u) * u * mx + u * u * ex, (1 - u) * (1 - u) * ay + 2 * (1 - u) * u * my + u * u * ey]; };
            for (let r = 18, n = 0; r < 128; r += 15 + n * 1.5, n++) {
              m.strokeStyle = "rgba(220,210,230," + (0.2 - n * 0.018).toFixed(3) + ")"; m.beginPath();
              for (let k = 0; k < sp.length; k++) { const [x, y] = at(k, r); if (!k) m.moveTo(x, y); else { const [px2, py2] = at(k - 1, r); m.quadraticCurveTo((px2 + x) / 2, (py2 + y) / 2 + 3 + r * 0.03, x, y); } }
              m.stroke();
            }
            m.fillStyle = "rgba(240,236,250,.4)"; for (let k = 0; k < 7; k++) { const [x, y] = at((k * 4) % 9, 30 + k * 13); m.fillRect(x - 0.6, y - 0.6, 1.2, 1.2); }
            m.fillStyle = "rgba(255,90,60,.8)"; m.fillRect(326, H * 0.58 - 100, 3, 5); });
        }
        break;
      }
      case "cellar": case "dungeon": case "halls": case "belltower": case "forge": case "passage": {
        f.fillStyle = shade(B.wall, -0.45); f.fillRect(0, 0, LW, H);
        /* Gewölbebögen */
        const col = shade(B.wall, -0.3), col2 = shade(B.wall, -0.6);
        repeatDraw(f, () => {
          for (let i = 0; i < 5; i++) {
            const x = i * 128, w = 128;
            f.fillStyle = col; f.fillRect(x, 0, 18, H); f.fillRect(x + w - 18, 0, 18, H);
            bgCourses(f, x, 0, 18, H, 0.2, 7); bgCourses(f, x + w - 18, 0, 18, H, 0.2, 7);
            f.fillStyle = "rgba(255,230,200,.05)"; f.fillRect(x, 0, 2, H); f.fillRect(x + w - 18, 0, 2, H);
            /* Gewölbenische mit Tiefenverlauf */
            const vg = f.createLinearGradient(0, H * 0.1, 0, H); vg.addColorStop(0, shade(B.wall, -0.72)); vg.addColorStop(0.6, col2); vg.addColorStop(1, shade(B.wall, -0.5));
            f.fillStyle = vg; f.beginPath(); f.moveTo(x + 18, H); f.lineTo(x + 18, H * 0.4); f.quadraticCurveTo(x + w / 2, H * 0.08, x + w - 18, H * 0.4); f.lineTo(x + w - 18, H); f.fill();
            /* Bogenring aus Keilsteinen */
            f.strokeStyle = shade(B.wall, -0.18); f.lineWidth = 5; f.beginPath(); f.moveTo(x + 15.5, H * 0.4); f.quadraticCurveTo(x + w / 2, H * 0.06, x + w - 15.5, H * 0.4); f.stroke();
            f.strokeStyle = "rgba(0,0,0,.35)"; f.lineWidth = 0.6; for (let k = 1; k < 12; k++) { const u = k / 12, bx = (1 - u) * (1 - u) * (x + 15.5) + 2 * (1 - u) * u * (x + w / 2) + u * u * (x + w - 15.5), by = (1 - u) * (1 - u) * H * 0.4 + 2 * (1 - u) * u * H * 0.06 + u * u * H * 0.4; f.beginPath(); f.moveTo(bx, by - 2.5); f.lineTo(bx, by + 2.5); f.stroke(); }
            /* Kämpferplatten und Sockel */
            f.fillStyle = shade(B.wall, -0.15); f.fillRect(x - 2, H * 0.4 - 3, 22, 4); f.fillRect(x + w - 20, H * 0.4 - 3, 22, 4); f.fillRect(x - 3, H * 0.9, 24, 6); f.fillRect(x + w - 21, H * 0.9, 24, 6);
            if (kind === "halls" || kind === "passage") { /* hohe Fenster mit Mondlicht */ f.fillStyle = "rgba(200,190,220,.16)"; f.beginPath(); f.moveTo(x + 50, H * 0.55); f.lineTo(x + 50, H * 0.3); f.quadraticCurveTo(x + 64, H * 0.2, x + 78, H * 0.3); f.lineTo(x + 78, H * 0.55); f.fill(); f.strokeStyle = "rgba(20,10,10,.6)"; f.lineWidth = 1.5; f.beginPath(); f.moveTo(x + 64, H * 0.22); f.lineTo(x + 64, H * 0.55); f.moveTo(x + 50, H * 0.42); f.lineTo(x + 78, H * 0.42); f.stroke(); }
            if (kind === "dungeon") { f.strokeStyle = "rgba(10,12,10,.8)"; f.lineWidth = 2; for (let k = 0; k < 6; k++) { f.beginPath(); f.moveTo(x + 34 + k * 12, H * 0.5); f.lineTo(x + 34 + k * 12, H); f.stroke(); } }
            if (kind === "forge") { D.glow(f, x + 64, H * 0.6, 60, "rgba(255,120,30,.18)"); f.strokeStyle = "rgba(255,170,60,.35)"; f.lineWidth = 1; f.beginPath(); f.arc(x + 64, H * 0.35, 18, 0, 6.283); f.stroke(); for (let k = 0; k < 6; k++) { const a = k / 6 * 6.283; f.fillStyle = "rgba(255,180,70,.4)"; f.fillRect(x + 64 + Math.cos(a) * 24 - 2, H * 0.35 + Math.sin(a) * 24 - 2, 4, 4); } }
            if (kind === "belltower") { f.strokeStyle = "rgba(20,14,10,.8)"; f.lineWidth = 3; f.beginPath(); f.arc(x + 64, H * 0.45, 26, 0, 6.283); f.stroke(); for (let k = 0; k < 10; k++) { const a = k / 10 * 6.283; f.fillStyle = "rgba(20,14,10,.8)"; f.fillRect(x + 64 + Math.cos(a) * 28 - 3, H * 0.45 + Math.sin(a) * 28 - 3, 6, 6); } }
          }
        });
        /* Mitte: Säulen, Fässer, Ketten */
        repeatDraw(m, () => {
          for (let i = 0; i < 4; i++) {
            const x = 30 + i * 160 + R() * 30;
            m.fillStyle = shade(B.wall, -0.15); m.fillRect(x, 0, 20, H); bgCourses(m, x, 0, 20, H, 0.18, 8); m.fillStyle = shade(B.wall, 0.05); m.fillRect(x, 0, 4, H); m.fillStyle = "rgba(0,0,0,.3)"; m.fillRect(x + 17, 0, 3, H);
            m.fillStyle = shade(B.wall, -0.2); m.fillRect(x - 4, H * 0.7, 28, 8); m.fillStyle = shade(B.wall, -0.05); m.fillRect(x - 4, H * 0.7, 28, 1.2); m.fillStyle = "rgba(0,0,0,.35)"; m.fillRect(x - 4, H * 0.7 + 8, 28, 3);
            if (kind === "cellar") { m.fillStyle = "#24180f"; m.fillRect(x + 48, H * 0.86 + 9, 66, 4); for (let k = 0; k < 3; k++) { const bx = x + 60 + k * 20; D.ell(m, bx, H * 0.86, 9, 11, "#2a1e16"); m.fillStyle = "rgba(255,220,180,.07)"; m.fillRect(bx - 6, H * 0.86 - 9, 2, 18); m.fillStyle = "#14100c"; m.fillRect(bx - 9, H * 0.86 - 6, 18, 1.5); m.fillRect(bx - 9, H * 0.86 + 4.5, 18, 1.5); D.circ(m, bx, H * 0.86, 1.6, "#3a2a1c"); } }
            if (kind === "halls") { m.fillStyle = "rgba(120,24,30,.8)"; m.fillRect(x + 50, H * 0.12, 22, 70); m.beginPath(); m.moveTo(x + 50, H * 0.12 + 70); m.lineTo(x + 61, H * 0.12 + 80); m.lineTo(x + 72, H * 0.12 + 70); m.fill(); m.fillStyle = "rgba(229,180,84,.7)"; m.fillRect(x + 58, H * 0.12 + 20, 6, 6); }
            if (kind === "dungeon" || kind === "cellar") { const ln = H * 0.3 + R() * 40; m.strokeStyle = "rgba(20,18,16,.9)"; m.lineWidth = 0.9; for (let yy = 0; yy < ln; yy += 3) { m.beginPath(); if ((yy / 3) & 1) { m.moveTo(x + 70, yy); m.lineTo(x + 70, yy + 3); } else m.ellipse(x + 70, yy + 1.5, 1, 1.8, 0, 0, 6.283); m.stroke(); } m.lineWidth = 1.4; m.beginPath(); m.arc(x + 68, ln + 3, 3, -0.3, 3.4); m.stroke(); }
          }
        });
        break;
      }
      case "hoardbg": {
        /* Themberchauds Goldberg im Glutlicht */
        const grd = f.createLinearGradient(0, 0, 0, H); grd.addColorStop(0, "#1a0806"); grd.addColorStop(0.7, "#4a1408"); grd.addColorStop(1, "#8a2a0a"); f.fillStyle = grd; f.fillRect(0, 0, LW, H);
        repeatDraw(f, () => { for (let x = 0; x < LW; x += 14) { const h = 20 + hash(x, 5) * 50; f.fillStyle = "#120604"; f.beginPath(); f.moveTo(x, 0); f.lineTo(x + 7, h); f.lineTo(x + 14, 0); f.fill(); } });
        repeatDraw(f, () => { for (let i = 0; i < 4; i++) { const x = 40 + i * 160; D.glow(f, x, H * 0.95, 90, "rgba(255,90,20,.35)"); } });
        repeatDraw(m, () => {
          for (let k = 0; k < 2; k++) { const cx = 160 + k * 320, top = H * (0.42 + k * 0.08);
            const g2 = m.createLinearGradient(0, top, 0, H); g2.addColorStop(0, "#c8902a"); g2.addColorStop(0.5, "#8a5a1a"); g2.addColorStop(1, "#3a200a"); m.fillStyle = g2;
            m.beginPath(); m.moveTo(cx - 200, H); m.quadraticCurveTo(cx - 60, top - 10, cx, top); m.quadraticCurveTo(cx + 60, top - 10, cx + 200, H); m.fill();
            for (let i = 0; i < 160; i++) { const x = cx + (hash(i, k) - 0.5) * 300, y = top + 10 + hash(i, k + 9) * (H - top); if (Math.abs(x - cx) > (y - top) * 1.6 + 20) continue; m.fillStyle = hash(i, k + 3) < 0.5 ? "#ffd27a" : "#e5a43a"; m.beginPath(); m.ellipse(x, y, 2.2, 1.2, 0, 0, 6.283); m.fill(); }
            for (let i = 0; i < 6; i++) { const x = cx + (hash(i, 40 + k) - 0.5) * 160, y = top + 30 + hash(i, 50 + k) * 40; m.fillStyle = "#6a4a2a"; m.fillRect(x - 6, y - 4, 12, 7); m.fillStyle = "#ffd27a"; m.fillRect(x - 6, y - 5, 12, 1.5); }
            D.glow(m, cx, top + 20, 70, "rgba(255,200,90,.25)"); }
        });
        break;
      }
      case "labbg": {
        f.fillStyle = "#0e140e"; f.fillRect(0, 0, LW, H);
        repeatDraw(f, () => { for (let i = 0; i < 5; i++) { const x = i * 128; f.fillStyle = "#18221a"; f.fillRect(x + 10, 0, 16, H); f.fillStyle = "#101810"; f.beginPath(); f.moveTo(x + 26, H); f.lineTo(x + 26, H * 0.35); f.quadraticCurveTo(x + 64, H * 0.12, x + 102, H * 0.35); f.lineTo(x + 102, H); f.fill(); } });
        repeatDraw(m, () => { for (let i = 0; i < 4; i++) { const x = 20 + i * 160; for (let r = 0; r < 3; r++) { const y = H * (0.3 + r * 0.18); m.fillStyle = "#2a2018"; m.fillRect(x, y, 90, 3); for (let k = 0; k < 7; k++) { const col = ["#7fd36a", "#c05050", "#e0c050", "#9a6ad0", "#60c0a0"][(i + r + k) % 5]; const bx = x + 6 + k * 12, bh = 6 + hash(i * 7 + k, r) * 8; m.fillStyle = "rgba(200,230,210,.25)"; m.fillRect(bx - 3, y - bh, 6, bh); m.fillStyle = col; m.fillRect(bx - 3, y - bh * 0.55, 6, bh * 0.55); D.glow(m, bx, y - bh * 0.3, 8, col + "66"); } } } });
        break;
      }
      case "chasm": case "lake": case "embercity": {
        const deep = kind === "chasm" ? "#0a0612" : kind === "lake" ? "#050c09" : "#120604";
        const grd = f.createLinearGradient(0, 0, 0, H); grd.addColorStop(0, sky[0]); grd.addColorStop(1, deep); f.fillStyle = grd; f.fillRect(0, 0, LW, H);
        /* ferne Felssäulen zwischen Decke und Grund, mit schwachem Randlicht */
        const colC = lit(B.wall, -0.55), rimC = kind === "lake" ? "rgba(170,230,190,.1)" : kind === "chasm" ? "rgba(210,170,255,.1)" : "rgba(255,150,80,.12)";
        repeatDraw(f, () => { for (let i = 0; i < 3; i++) { const x = 90 + i * 210 + hash(i, 41) * 60, w = 16 + hash(i, 42) * 18; f.fillStyle = colC; f.beginPath(); f.moveTo(x - w * 1.6, 0); f.quadraticCurveTo(x - w * 0.4, H * 0.35, x - w * 0.5, H * 0.5); f.quadraticCurveTo(x - w * 0.6, H * 0.7, x - w * 1.8, H); f.lineTo(x + w * 1.8, H); f.quadraticCurveTo(x + w * 0.6, H * 0.7, x + w * 0.5, H * 0.5); f.quadraticCurveTo(x + w * 0.4, H * 0.35, x + w * 1.6, 0); f.fill(); f.strokeStyle = rimC; f.lineWidth = 1; f.beginPath(); f.moveTo(x + w * 1.6, 0); f.quadraticCurveTo(x + w * 0.4, H * 0.35, x + w * 0.5, H * 0.5); f.quadraticCurveTo(x + w * 0.6, H * 0.7, x + w * 1.8, H); f.stroke(); } });
        /* Stalaktiten mit Randlicht und Tropfen */
        repeatDraw(f, () => { for (let x = 0; x < LW; x += 14) { const h = 20 + hash(x, 3) * 60, w = 6 + hash(x, 9) * 4; f.fillStyle = shade(B.wall, -0.4); f.beginPath(); f.moveTo(x, 0); f.lineTo(x + 7, h); f.lineTo(x + 7 + w, 0); f.fill(); f.fillStyle = rimC; f.beginPath(); f.moveTo(x + 7 + w, 0); f.lineTo(x + 7, h); f.lineTo(x + 5 + w, 0); f.fill(); if (hash(x, 5) < 0.3) { f.fillStyle = rimC; f.fillRect(x + 6.6, h + 3 + hash(x, 6) * 8, 0.8, 1.4); } } });
        /* Stalagmiten am Grund */
        repeatDraw(f, () => { for (let x = 4; x < LW; x += 22) { const h = 12 + hash(x, 13) * 34, w = 5 + hash(x, 14) * 5; f.fillStyle = shade(B.wall, -0.5); f.beginPath(); f.moveTo(x - w, H); f.lineTo(x, H - h); f.lineTo(x + w, H); f.fill(); f.fillStyle = rimC; f.beginPath(); f.moveTo(x, H - h); f.lineTo(x + w, H); f.lineTo(x + w - 1.5, H); f.fill(); } });
        if (kind === "chasm") {
          /* Häuser auf Felsnadeln, von Netzen gehalten */
          repeatDraw(f, () => { for (let i = 0; i < 4; i++) { const x = 40 + i * 160, top = H * (0.35 + hash(i, 7) * 0.2); f.fillStyle = "#140c1a"; f.beginPath(); f.moveTo(x - 8, H); f.lineTo(x - 2, top + 20); f.lineTo(x + 22, top + 20); f.lineTo(x + 30, H); f.fill(); f.fillRect(x - 4, top, 28, 22); f.beginPath(); f.moveTo(x - 6, top); f.lineTo(x + 10, top - 14); f.lineTo(x + 26, top); f.fill(); f.fillStyle = "rgba(255,170,90,.5)"; f.fillRect(x + 6, top + 6, 3, 4); f.strokeStyle = "rgba(220,210,230,.18)"; f.lineWidth = 0.6; for (let k = 0; k < 5; k++) { f.beginPath(); f.moveTo(x + 10, top); f.quadraticCurveTo(x + 60 + k * 10, top - 30, x + 150, top + 20 - k * 15); f.stroke(); } } });
          for (let i = 0; i < 70; i++) { const x = R() * LW, y = H * 0.3 + R() * H * 0.7; const col = R() < 0.5 ? "rgba(190,110,255," : "rgba(130,230,120,"; repeatDraw(m, () => { D.glow(m, x, y, 6, col + "0.5)"); m.fillStyle = col + "0.9)"; m.fillRect(x - 0.6, y - 0.6, 1.2, 1.2); }); }
          /* große Netze im Vordergrund der Mittelebene */
          repeatDraw(m, () => { for (let i = 0; i < 2; i++) { const cx = 120 + i * 320, cy = H * 0.35; m.strokeStyle = "rgba(220,210,235,.16)"; m.lineWidth = 0.7; for (let k = 0; k < 10; k++) { const a = k / 10 * 6.283; m.beginPath(); m.moveTo(cx, cy); m.lineTo(cx + Math.cos(a) * 110, cy + Math.sin(a) * 110); m.stroke(); } for (let r = 14; r < 110; r += 14) { m.beginPath(); for (let k = 0; k <= 10; k++) { const a = k / 10 * 6.283; const rr = r + Math.sin(k * 3) * 2; k ? m.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr) : m.moveTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr); } m.stroke(); } } });
        }
        if (kind === "lake") {
          const wy = H * 0.68; f.fillStyle = "#040a08"; f.fillRect(0, wy, LW, H - wy);
          for (let i = 0; i < 50; i++) { f.fillStyle = "rgba(120,200,150," + (0.05 + R() * 0.12) + ")"; f.fillRect(R() * LW, wy + R() * (H - wy), 10 + R() * 30, 1); }
          /* Ruinen der Kuo-Toa-Stadt */
          repeatDraw(m, () => { for (let i = 0; i < 5; i++) { const x = 20 + i * 130, h = 30 + hash(i, 2) * 50; m.fillStyle = "#0c1612"; m.fillRect(x, H * 0.68 - h, 30, h); m.beginPath(); m.moveTo(x - 3, H * 0.68 - h); m.lineTo(x + 15, H * 0.68 - h - 14); m.lineTo(x + 33, H * 0.68 - h); m.fill(); m.fillStyle = "rgba(220,140,150,.35)"; m.fillRect(x + 12, H * 0.68 - h + 8, 4, 4); } });
          for (let i = 0; i < 40; i++) { const x = R() * LW, y = R() * H * 0.6; repeatDraw(m, () => D.glow(m, x, y, 5, "rgba(130,230,170,.4)")); }
        }
        if (kind === "embercity") {
          /* Felswand mit hunderten Feuern, manche grün (Gracklstugh) */
          repeatDraw(f, () => { for (let i = 0; i < 120; i++) { const x = hash(i, 11) * LW, y = H * 0.15 + hash(i, 12) * H * 0.6; const green = hash(i, 13) < 0.22; D.glow(f, x, y, 5, green ? "rgba(120,255,140,.55)" : "rgba(255,150,60,.55)"); f.fillStyle = green ? "#b0ffb0" : "#ffd090"; f.fillRect(x - 0.5, y - 0.5, 1, 1.2); } });
          repeatDraw(m, () => { for (let i = 0; i < 4; i++) { const x = 30 + i * 160; m.fillStyle = "#1a0c08"; m.fillRect(x, H * 0.4, 50, H * 0.6); for (let k = 0; k < 50; k += 10) m.fillRect(x + k, H * 0.4 - 6, 6, 6); m.fillStyle = "rgba(255,140,50,.7)"; m.fillRect(x + 12, H * 0.5, 5, 7); m.fillRect(x + 32, H * 0.6, 5, 7); D.glow(m, x + 25, H * 0.9, 50, "rgba(255,90,20,.25)"); } });
        }
        break;
      }
    }
  }
  /* Hintergrund-Leben: Fledermäuse, Krähen, Möwen, Rochen, Funkenvögel – in der Parallaxe */
  const CRIT = { cellar: "bat", dungeon: "bat", chasm: "bat", belltower: "bat", castle: "crow", ramparts: "crow", spires: "crow", storm: "crow", harbour: "gull", lake: "ray", embercity: "ember", forge: "ember", halls: "moth", camp: "crow" };
  G.critters = [];
  function updCritters(dt, cam) {
    const kind = CRIT[B.bg]; if (!kind) return;
    if (G.critters.length < 5 && Math.random() < dt * 0.35) {
      const dir = Math.random() < 0.5 ? 1 : -1, n = kind === "bat" ? 3 + (Math.random() * 4 | 0) : kind === "crow" ? 1 + (Math.random() * 3 | 0) : 1;
      const y = cam.y + cam.h * (0.12 + Math.random() * 0.45);
      for (let i = 0; i < n; i++) G.critters.push({ kind, x: cam.x + (dir > 0 ? -30 - i * 14 : cam.w + 30 + i * 14), y: y + (Math.random() - 0.5) * 30, vx: dir * (kind === "bat" ? 70 : kind === "ray" ? 25 : 45) * (0.8 + Math.random() * 0.4), ph: Math.random() * 6, par: 0.55 + Math.random() * 0.2, t: 0 });
    }
    for (let i = G.critters.length - 1; i >= 0; i--) { const k = G.critters[i]; k.t += dt; k.x += k.vx * dt; k.y += Math.sin(k.t * 3 + k.ph) * (k.kind === "bat" ? 30 : 8) * dt; if (k.t > 20) G.critters.splice(i, 1); }
  }
  function drawCritters(c, cam) {
    for (const k of G.critters) {
      const x = k.x, y = k.y, f = Math.sin(G.time * (k.kind === "bat" ? 22 : 9) + k.ph), d = U.sign(k.vx);
      c.save(); c.globalAlpha = 0.55; c.translate(x, y); c.scale(d, 1);
      c.fillStyle = k.kind === "gull" ? "#c8c0c0" : k.kind === "ray" ? "rgba(200,220,210,.6)" : k.kind === "ember" ? "#ff9a4a" : k.kind === "moth" ? "#d8c8a0" : "#120c10";
      if (k.kind === "ember") { D.glow(c, 0, 0, 6, "rgba(255,140,60,.6)"); c.fillRect(-1, -1, 2, 2); }
      else if (k.kind === "ray") { c.beginPath(); c.moveTo(6, 0); c.lineTo(0, -5 - f * 2); c.lineTo(-6, 0); c.lineTo(0, 5 + f * 2); c.fill(); c.fillRect(-12, -0.4, 6, 0.8); }
      else { const w = k.kind === "bat" ? 4 : 5; c.beginPath(); c.moveTo(0, 0); c.lineTo(-w, -f * w * 0.8); c.lineTo(-w * 0.4, 0.5); c.lineTo(w * 0.4, 0.5); c.lineTo(w, -f * w * 0.8); c.closePath(); c.fill(); c.fillRect(-1, -0.6, 2.4, 1.4); }
      c.restore();
    }
  }
  /* ---------- Ebenen in Bildschirmauflösung zwischenspeichern ----------
     Ferne und mittlere Ebene sowie die Bilderbuchseite sind kleiner gemalt (1,15×, 1,7×, 1,6×) und mussten bisher
     jedes Bild beim Vergrößern neu gefiltert werden – in Software-Darstellung rund 5 ms je Ebene. Jetzt wird jede
     Ebene einmal (in Streifen von 1024 px, höchstens einer je Bild) mit derselben bilinearen Vergrößerung auf
     Bildschirmgröße gebracht und danach nur noch pixelgenau kopiert: gleiches Aussehen, etwa ein Drittel der Kosten.
     Fehlt ein Streifen noch oder ist das Speicherbudget erschöpft, wird wie bisher direkt vergrößert gezeichnet. */
  const LCACHE = new Map(), LC_TW = 1024, LC_MAX = 28e6; let lcPix = 0, lcFrame = -1, lcMade = 0;
  function lcEvict(minAge) {
    for (const [k, e] of LCACHE) if (G.frame - e.used > minAge) { for (const t of e.tiles) if (t) lcPix -= t.width * t.height; LCACHE.delete(k); }
  }
  /* src (beliebig groß gemalt) deckt das Weltrechteck Ww × Hw ab, liegt bei (wx, wy); sichtbar: vx0…vx1, vy0…vy1 */
  G.blitLayer = function (c, src, Ww, Hw, wx, wy, vx0, vy0, vx1, vy1) {
    const m = c.getTransform(), a = m.a;
    if (m.b || m.c || Math.abs(m.d - a) > 1e-6 || Z.gq && Z.gq.level === 0) { c.drawImage(src, (vx0 - wx) * src.width / Ww, (vy0 - wy) * src.height / Hw, (vx1 - vx0) * src.width / Ww, (vy1 - vy0) * src.height / Hw, vx0, vy0, vx1 - vx0, vy1 - vy0); return; }
    let e = LCACHE.get(src);
    const CW = Math.round(Ww * a), CH = Math.round(Hw * a);
    if (e && (e.CW !== CW || e.CH !== CH || e.sw !== src.width)) { for (const t of e.tiles) if (t) lcPix -= t.width * t.height; LCACHE.delete(src); e = null; }
    if (!e) { lcEvict(90); e = { CW, CH, sw: src.width, tiles: [], used: G.frame }; LCACHE.set(src, e); }
    e.used = G.frame;
    if (lcFrame !== G.frame) { lcFrame = G.frame; lcMade = 0; }
    const DX = Math.round(a * wx + m.e), DY = Math.round(a * wy + m.f), cw = c.canvas.width, chh = c.canvas.height;
    const X0 = Math.max(DX, 0, Math.floor(a * vx0 + m.e)), X1 = Math.min(DX + CW, cw, Math.ceil(a * vx1 + m.e));
    const Y0 = Math.max(DY, 0, Math.floor(a * vy0 + m.f)), Y1 = Math.min(DY + CH, chh, Math.ceil(a * vy1 + m.f));
    if (X1 <= X0 || Y1 <= Y0) return;
    const kx = src.width / CW, ky = src.height / CH;
    c.setTransform(1, 0, 0, 1, 0, 0);
    for (let k = Math.floor((X0 - DX) / LC_TW), k1 = Math.floor((X1 - 1 - DX) / LC_TW); k <= k1; k++) {
      const t0 = k * LC_TW, lx0 = Math.max(X0 - DX, t0), lx1 = Math.min(X1 - DX, t0 + LC_TW, CW), ly0 = Y0 - DY, h = Y1 - Y0, w = lx1 - lx0;
      if (w <= 0) continue;
      let t = e.tiles[k];
      if (!t && lcMade < 1) {
        const tw = Math.min(LC_TW, CW - t0);
        if (lcPix + tw * CH > LC_MAX) lcEvict(2);
        if (lcPix + tw * CH <= LC_MAX) {
          t = document.createElement("canvas"); t.width = tw; t.height = CH; const g = t.getContext("2d");
          g.imageSmoothingEnabled = true; g.setTransform(1 / kx, 0, 0, 1 / ky, -t0, 0); g.drawImage(src, 0, 0);
          e.tiles[k] = t; lcPix += tw * CH; lcMade++;
        }
      }
      if (t) c.drawImage(t, lx0 - t0, ly0, w, h, DX + lx0, DY + ly0, w, h);
      else c.drawImage(src, lx0 * kx, ly0 * ky, w * kx, h * ky, DX + lx0, DY + ly0, w, h);
    }
    c.setTransform(m);
  };
  /* neues Gebiet: vergrößerte Ebenen und Sprites des alten freigeben */
  G.dropLayer = src => { const e = LCACHE.get(src); if (!e) return; for (const t of e.tiles) if (t) lcPix -= t.width * t.height; LCACHE.delete(src); };
  G.dropCaches = () => { LCACHE.clear(); lcPix = 0; SCACHE.clear(); scPix = 0; };
  G.layerCacheInfo = () => ({ entries: LCACHE.size, mpix: +(lcPix / 1e6).toFixed(2), sprites: SCACHE.size, spix: +(scPix / 1e6).toFixed(2) });
  /* ---------- weiche Sprites (Leuchten, Wolken, Schatten) in Bildschirmgröße ----------
     Ein 64-px-Leuchtfleck, der jedes Bild auf 300 px vergrößert wird, kostet in Software-Darstellung das Drei- bis
     Vierfache einer pixelgenauen Kopie. G.drawScaled(c, spr, x, y, w, h) zeichnet wie c.drawImage(spr, x, y, w, h),
     legt aber je Sprite und Bildschirmgröße (in 4-%-Stufen) einmal eine vergrößerte Fassung an und kopiert diese
     ganzzahlig (Mittelpunkt bleibt, Größe weicht höchstens 2 % ab – bei weichen Flecken unsichtbar). Gedreht,
     gespiegelt, winzig oder riesig: wie bisher. Höchstens 8 neue Fassungen je Bild, Speicher begrenzt. */
  const SCACHE = new Map(), SC_MAX = 14e6; let scPix = 0, scFrame = -1, scMade = 0, sprIds = 0;
  G.drawScaled = function (c, spr, x, y, w, h, m) {
    if (!(w > 0 && h > 0)) return;
    m = m || c.getTransform();
    const dw = w * m.a, dh = h * m.d;
    if (m.b || m.c || !(dw >= 20 && dh >= 6) || dw > 2600 || dh > 1400 || (Z.gq && Z.gq.level === 0)) { c.drawImage(spr, x, y, w, h); return; }
    const kw = Math.round(Math.log(dw) * 25), kh = Math.round(Math.log(dh) * 25);
    const id = spr._sid || (spr._sid = ++sprIds), key = id * 1048576 + kw * 1024 + kh;
    let s = SCACHE.get(key);
    if (!s) {
      if (scFrame !== G.frame) { scFrame = G.frame; scMade = 0; }
      if (scMade >= 8) { c.drawImage(spr, x, y, w, h); return; }
      const W = Math.max(1, Math.round(Math.exp(kw / 25))), H2 = Math.max(1, Math.round(Math.exp(kh / 25)));
      if (scPix + W * H2 > SC_MAX) { SCACHE.clear(); scPix = 0; }
      s = document.createElement("canvas"); s.width = W; s.height = H2; const g = s.getContext("2d"); g.imageSmoothingEnabled = true; g.drawImage(spr, 0, 0, W, H2);
      SCACHE.set(key, s); scPix += W * H2; scMade++;
    }
    const X = Math.round(m.a * x + m.e + (dw - s.width) / 2), Y = Math.round(m.d * y + m.f + (dh - s.height) / 2);
    c.setTransform(1, 0, 0, 1, 0, 0); c.drawImage(s, X, Y); c.setTransform(m);
  };
  function drawLayers(c, cam) {
    const L = G.layers; if (!L) return;
    /* deckt die Bilderbuchseite alles, sind Himmel und ferne Ebene unsichtbar: zwei Vollbild-Durchgänge gespart */
    const cover = Z.bilderbuchCovers && Z.bilderbuchCovers();
    if (!cover) { c.fillStyle = B.sky[2]; c.fillRect(cam.x - 2, cam.y - 2, cam.w + 4, cam.h + 4); }
    const lvH = lv.H * T;
    for (const [layer, px, py] of [[L.far, 0.12, 0.08], [L.mid, 0.32, 0.2]]) {
      const ox = cam.x * (1 - px), oy = cam.y - (cam.y - (lvH - cam.h) * 0.5) * py - 40;
      if (cover && layer === L.far) { if (Z.drawBackLife) Z.drawBackLife(c, cam, G.time, B, oy, L.H); continue; }
      let x = Math.floor((cam.x - ox) / LW) * LW + ox;
      const y0 = Math.max(oy, cam.y - 2), y1 = Math.min(oy + L.H, cam.y + cam.h + 2);
      if (y1 <= y0) continue;
      for (; x < cam.x + cam.w; x += LW) {
        /* nur den sichtbaren Ausschnitt kopieren */
        const vx0 = Math.max(x, cam.x - 2), vx1 = Math.min(x + LW, cam.x + cam.w + 2); if (vx1 <= vx0) continue;
        G.blitLayer(c, layer.cv, LW, L.H, x, oy, vx0, y0, vx1, y1);
      }
      /* lebendige Ferne zwischen den Ebenen: Wolken, Vögel, Sternschnuppen, Fledermäuse … */
      if (layer === L.far && Z.drawBackLife) Z.drawBackLife(c, cam, G.time, B, oy, L.H);
    }
  }

  /* ======================= KACHELN ======================= */
  /* Alles hier wird einmal je Chunk (24×14 Kacheln) in eine Leinwand gemalt und zwischengespeichert –
     darum darf es aufwendig sein. Muster liegen in Weltkoordinaten, damit Kacheln und Chunks nahtlos passen. */
  const CH_W = 24, CH_H = 14, TAU = Math.PI * 2;
  const solidV = v => v === 1 || v === 7;
  /* Detailstufe der Kacheln (0 schlicht … 3 prächtig); „eigene Werte“ zählen als Hoch */
  const detail = () => { const q = Z.gq; if (!q || !Number.isFinite(q.level)) return 2; return q.level < 0 ? (q.layers === false ? 1 : 2) : q.level; };
  /* Mauerwerk und Fels je Szenerie */
  const STY = {
    castle: { wall: "ashlar", rock: "block", ivy: 1, moss: 1, pil: 1, cor: 1, niche: 1 },
    ramparts: { wall: "ashlar", rock: "block", ivy: 1, moss: 1, pil: 1, cor: 1 },
    storm: { wall: "ashlar", rock: "block", ivy: 1, moss: 1, wet: 1, pil: 1, cor: 1 },
    spires: { wall: "ashlar", rock: "block", soot: 1, pil: 1, cor: 1, niche: 1 },
    camp: { wall: "ashlar", rock: "block", ivy: 1, moss: 1 },
    passage: { wall: "panel", rock: "block", pil: 1 },
    cellar: { wall: "brick", rock: "block", wet: 1, salt: 1, pil: 1, niche: 1 },
    halls: { wall: "panel", rock: "block", pil: 1, cor: 1, dentil: 1 },
    dungeon: { wall: "rubble", rock: "rubble", wet: 1, slime: 1, moss: 1, niche: 1 },
    harbour: { wall: "plank", rock: "block", wet: 1, salt: 1 },
    belltower: { wall: "timber", rock: "block", niche: 1 },
    chasm: { wall: "cave", rock: "cave", web: 1 },
    lake: { wall: "cave", rock: "cave", wet: 1, lichen: 1 },
    embercity: { wall: "slab", rock: "cave", soot: 1, ember: 1 },
    forge: { wall: "slab", rock: "block", soot: 1, rune: 1, pil: 1, cor: 1 }
  };
  const styleOf = () => STY[B.bg] || STY.castle;

  /* Farbhilfen mit Hex-Ergebnis (verkettbar) */
  const cl8 = v => (v < 0 ? 0 : v > 255 ? 255 : v | 0);
  const rgbOf = h => { const n = parseInt(h.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; };
  const hexOf = (r, g, b) => "#" + ((1 << 24) | (cl8(r) << 16) | (cl8(g) << 8) | cl8(b)).toString(16).slice(1);
  function lit(h, f) { const [r, g, b] = rgbOf(h); return f > 0 ? hexOf(r + (255 - r) * f, g + (255 - g) * f, b + (255 - b) * f) : hexOf(r * (1 + f), g * (1 + f), b * (1 + f)); }
  function mixH(a, b, t) { const A = rgbOf(a), C = rgbOf(b); return hexOf(A[0] + (C[0] - A[0]) * t, A[1] + (C[1] - A[1]) * t, A[2] + (C[2] - A[2]) * t); }
  function rgba(h, a) { const [r, g, b] = rgbOf(h); return "rgba(" + r + "," + g + "," + b + "," + a + ")"; }
  const h3 = (x, y, k) => hash(x * 7 + k * 131, y * 13 - k * 71);

  /* Rechteck-Zuschnitt ohne Canvas-Clip: fr() füllt nur innerhalb des aktuellen Rahmens */
  let C0x = 0, C0y = 0, C1x = 0, C1y = 0;
  function setCR(x, y, w, h) { C0x = x; C0y = y; C1x = x + w; C1y = y + h; }
  function fr(c, x, y, w, h) { const a = x < C0x ? C0x : x, b = y < C0y ? C0y : y, e = x + w > C1x ? C1x : x + w, f = y + h > C1y ? C1y : y + h; if (e > a && f > b) c.fillRect(a, b, e - a, f - b); }

  /* Quaderreihen mit Fasen; o: rowH, bw, off, jit, gap, seed, cols, hi, hi2, lo, extra */
  /* WRAP: beim Malen einer Mustervorlage wiederholt sich der Zufall nach w×h Pixeln (nahtlose Kachelung) */
  let WRAP = null;
  const wk = (k, per) => (WRAP ? ((k % per) + per) % per : k);
  function masonry(c, o) {
    const rh = o.rowH, bw = o.bw, gap = o.gap, KX = WRAP ? Math.round(WRAP.w / bw) : 0, KY = WRAP ? Math.round(WRAP.h / rh) : 0;
    for (let r = Math.floor(C0y / rh); r * rh < C1y; r++) {
      const by = r * rh, off = (r & 1) * o.off, rr = wk(r, KY);
      const bnd = k => k * bw + off + (o.jit ? Math.round((hash(wk(k, KX) * 7 + o.seed, rr * 3 + 1) - 0.5) * o.jit) : 0);
      let k = Math.floor((C0x - off) / bw) - 1, xa = bnd(k);
      while (xa < C1x) {
        const xb = bnd(k + 1);
        if (xb > C0x) {
          const v = hash(wk(k, KX) * 13 + o.seed, rr * 7 + 3), w2 = xb - xa - gap, h2 = rh - gap;
          c.fillStyle = o.cols[(v * o.cols.length) | 0]; fr(c, xa, by, w2, h2);
          c.fillStyle = o.hi; fr(c, xa, by, w2, 1);
          c.fillStyle = o.hi2; fr(c, xa, by + 1, 1, h2 - 1);
          c.fillStyle = o.lo; fr(c, xa + 1, by + h2 - 1, w2 - 1, 1); fr(c, xa + w2 - 1, by + 1, 1, h2 - 2);
          if (o.extra) o.extra(c, xa, by, w2, h2, v, k, r, o);
        }
        xa = xb; k++;
      }
    }
  }
  /* Abnutzung auf Quadern: Poren, abgeschlagene Ecken, Flecken */
  function chips(c, x, y, w, h, v, k, r, o) {
    if (v < 0.2) { c.fillStyle = "rgba(0,0,0,.25)"; fr(c, x + 2 + ((v * 97) % 1) * (w - 5), y + 2 + ((v * 13) % 1) * Math.max(0, h - 5), 2, 1); }
    if (v > 0.88) { c.fillStyle = o.hi; fr(c, x + 1, y + 1, 2, 1); fr(c, x + 1, y + 2, 1, 1); }
    if (v > 0.42 && v < 0.47) { c.fillStyle = "rgba(0,0,0,.18)"; fr(c, x + w * 0.3, y + h * 0.5, 1, 1); fr(c, x + w * 0.62, y + h * 0.35, 1, 1); fr(c, x + w * 0.5, y + h * 0.7, 1, 1); }
    if (v > 0.6 && v < 0.64 && w > 8) { c.fillStyle = "rgba(0,0,0,.3)"; fr(c, x + w * 0.4, y + 1, 1, h * 0.4); fr(c, x + w * 0.4 + 1, y + h * 0.4, 1, h * 0.35); }
  }
  /* Runen auf Steinplatten (Schmiede) und Hitzerisse (Glutgassen) */
  function slabExtra(c, x, y, w, h, v, k, r, o) {
    chips(c, x, y, w, h, v, k, r, o);
    c.fillStyle = o.hi; fr(c, x + 1, y + 1, w - 2, 1);
    if (o.rune && v < 0.22 && w > 14 && h > 14) {
      const cx = x + w / 2, cy = y + h / 2, s = h * 0.28, g = (v * 977) % 1;
      c.save(); c.beginPath(); c.rect(C0x, C0y, C1x - C0x, C1y - C0y); c.clip();
      c.strokeStyle = "rgba(0,0,0,.55)"; c.lineWidth = 1.2; runeGlyph(c, cx, cy, s, g); c.stroke();
      c.strokeStyle = "rgba(255,150,60,.35)"; c.lineWidth = 0.5; runeGlyph(c, cx, cy, s, g); c.stroke();
      c.restore();
    }
    if (o.ember && v > 0.9) {
      c.save(); c.beginPath(); c.rect(C0x, C0y, C1x - C0x, C1y - C0y); c.clip();
      c.strokeStyle = "rgba(255,110,30,.4)"; c.lineWidth = 0.6; c.beginPath(); let xx = x + 3, yy = y + h * 0.3; c.moveTo(xx, yy); for (let i = 0; i < 4; i++) { xx += w / 5; yy += (hash(k + i, r) - 0.4) * 5; c.lineTo(xx, yy); } c.stroke();
      c.restore();
    }
  }
  function runeGlyph(c, cx, cy, s, g) {
    c.beginPath();
    const n = (g * 5) | 0;
    c.moveTo(cx, cy - s); c.lineTo(cx, cy + s);
    if (n === 0) { c.moveTo(cx, cy - s * 0.6); c.lineTo(cx + s * 0.6, cy - s * 0.1); c.moveTo(cx, cy); c.lineTo(cx - s * 0.6, cy + s * 0.5); }
    else if (n === 1) { c.moveTo(cx - s * 0.6, cy - s * 0.5); c.lineTo(cx + s * 0.6, cy + s * 0.5); c.moveTo(cx + s * 0.6, cy - s * 0.5); c.lineTo(cx - s * 0.6, cy + s * 0.5); }
    else if (n === 2) { c.moveTo(cx, cy - s); c.lineTo(cx + s * 0.6, cy - s * 0.4); c.lineTo(cx, cy + s * 0.1); }
    else if (n === 3) { c.moveTo(cx - s * 0.6, cy - s); c.lineTo(cx, cy - s * 0.4); c.lineTo(cx + s * 0.6, cy - s); c.moveTo(cx - s * 0.5, cy + s * 0.4); c.lineTo(cx + s * 0.5, cy + s * 0.4); }
    else { c.moveTo(cx - s * 0.5, cy - s * 0.3); c.lineTo(cx + s * 0.5, cy - s * 0.3); c.moveTo(cx - s * 0.5, cy + s * 0.3); c.lineTo(cx + s * 0.5, cy + s * 0.3); }
  }

  /* ---------- Vorberechnung je Level: Felstiefe, Öffnungen ---------- */
  let PR = null, PAL = null;
  function vnoise(x, y) { const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi; const s = t => t * t * (3 - 2 * t); const a = hash(xi, yi), b = hash(xi + 1, yi), c2 = hash(xi, yi + 1), d = hash(xi + 1, yi + 1); return U.lerp(U.lerp(a, b, s(xf)), U.lerp(c2, d, s(xf)), s(yf)); }
  /* Öffnungen in der Rückwand: Bogenfenster (draußen), Gewölbe (Keller) oder Höhlenlöcher (Unterreich) */
  function isWin(x, y) {
    const mode = lv.arena ? "arena" : B.open; if (!mode) return false;
    if (mode === "arena") { if (y > lv.H - 5 || y < 1) return false; return lv.get(x, y) !== 1; }
    if (mode === "arch") { const lx = x % 12, ly = y % 7; if (lx < 2 || lx > 9 || ly < 1 || ly > 5) return false; }
    else if (mode === "vault") { const lx = x % 18, ly = y % 9; if (lx < 4 || lx > 13 || ly < 1 || ly > 7) return false; }
    else if (mode === "cave") { if (vnoise(x / 5.5, y / 4.5) * 0.7 + vnoise(x / 2.2 + 30, y / 2.2) * 0.3 < 0.56) return false; }
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const v = lv.get(x + dx, y + dy); if (v === 1 || v === 7) return false; }
    return true;
  }
  function prep() {
    const W = lv.W, H = lv.H, N = W * H, get = lv.get;
    const sol = new Uint8Array(N), dep = new Uint8Array(N), q = new Int32Array(N);
    let qh = 0, qt = 0;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const i = y * W + x; if (solidV(get(x, y))) { sol[i] = 1; dep[i] = 99; } else q[qt++] = i; }
    /* Felstiefe: Schritte bis zur nächsten freien Kachel (8er-Nachbarschaft) */
    while (qh < qt) {
      const i = q[qh++], x = i % W, y = (i / W) | 0, d = dep[i] + 1; if (d > 8) continue;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const xx = x + dx, yy = y + dy; if (xx < 0 || yy < 0 || xx >= W || yy >= H) continue; const j = yy * W + xx; if (dep[j] > d) { dep[j] = d; q[qt++] = j; } }
    }
    /* Öffnungen: Maske und zusammenhängende Gruppen */
    const clear = new Uint8Array(N), win = new Uint8Array(N), comps = [];
    for (let i = 0; i < N; i++) if (G.sky[i] && !sol[i]) clear[i] = 1;
    if (!lv.hub && !lv.passage && (B.open || lv.arena)) {
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const i = y * W + x; if (sol[i] || G.sky[i] || get(x, y) === 9) continue; if (isWin(x, y)) { if (lv.arena) clear[i] = 1; else win[i] = 1; } }
      if (!lv.arena) {
        const seen = new Uint8Array(N), wallDec = new Set();
        /* Gemälde und Regale machen eine Öffnung zum Blendbogen (wie eine Galerie) */
        const BLOCK = { painting: 1, shelf: 1 };
        for (const d of lv.decor || []) if (BLOCK[d.kind]) { wallDec.add(d.y * W + d.x); wallDec.add((d.y - 1) * W + d.x); }
        for (let i = 0; i < N; i++) {
          if (!win[i] || seen[i]) continue;
          const o = { x0: 1e9, y0: 1e9, x1: -1, y1: -1, tiles: [], mode: B.open }; const st = [i]; seen[i] = 1;
          while (st.length) { const j = st.pop(), x = j % W, y = (j / W) | 0; o.tiles.push(x, y); if (x < o.x0) o.x0 = x; if (x > o.x1) o.x1 = x; if (y < o.y0) o.y0 = y; if (y > o.y1) o.y1 = y;
            for (const k of [j - 1, j + 1, j - W, j + W]) if (k >= 0 && k < N && win[k] && !seen[k] && Math.abs((k % W) - x) <= 1) { seen[k] = 1; st.push(k); } }
          const n = o.tiles.length / 2;
          if (n < 3) { for (let t = 0; t < o.tiles.length; t += 2) win[o.tiles[t + 1] * W + o.tiles[t]] = 0; continue; }
          o.full = n === (o.x1 - o.x0 + 1) * (o.y1 - o.y0 + 1);
          /* hängt Wandschmuck (Fackel, Gemälde, Regal …) in der Öffnung, wird sie zum Blendbogen bzw. bleibt Wand */
          let hit = false; for (let t = 0; t < o.tiles.length && !hit; t += 2) if (wallDec.has(o.tiles[t + 1] * W + o.tiles[t])) hit = true;
          if (hit) { for (let t = 0; t < o.tiles.length; t += 2) win[o.tiles[t + 1] * W + o.tiles[t]] = 0; if (o.mode === "cave") continue; o.blind = true; }
          comps.push(o);
        }
      }
    }
    /* Fackeln, die in einer Öffnung hängen würden, wandern an den nächsten Mauerpfeiler daneben */
    for (const d of lv.decor || []) {
      if (d.kind !== "torch" || !(win[d.y * W + d.x] || (d.y > 0 && win[(d.y - 1) * W + d.x]))) continue;
      for (let k = 1; k < 8; k++) { let moved = false; for (const xx of [d.x - k, d.x + k]) { if (xx < 1 || xx >= W - 1) continue; const i0 = d.y * W + xx, i1 = (d.y - 1) * W + xx; if (!sol[i0] && !win[i0] && !win[i1] && !sol[i1] && !clear[i0]) { d.x = xx; moved = true; break; } } if (moved) break; }
    }
    PR = { sol, dep, win, clear, comps, W, H };
    G.openings = comps;
    /* Farben */
    const wall = B.wall, tl = B.tile;
    const core = mixH(tl.dark, "#000000", 0.42), cr = rgbOf(core);
    PAL = {
      core, coreRGB: cr.join(","),
      wallCols: [lit(wall, -0.12), lit(wall, -0.05), wall, lit(wall, 0.04), lit(wall, 0.09)],
      wHi: rgba(lit(wall, 0.32), 0.55), wHi2: rgba(lit(wall, 0.22), 0.35), wLo: "rgba(0,0,0,.32)",
      rockCols: [mixH(tl.base, tl.dark, 0.26), mixH(tl.base, tl.dark, 0.16), mixH(tl.base, tl.dark, 0.06), mixH(tl.base, tl.light, 0.07), mixH(tl.base, tl.light, 0.15)],
      rHi: rgba(lit(tl.light, 0.05), 0.5), rHi2: rgba(tl.light, 0.3), rLo: "rgba(0,0,0,.38)",
      stone: lit(wall, 0.1), stoneHi: lit(wall, 0.28), stoneLo: lit(wall, -0.3)
    };
    /* Tiefenkarte des Felsens (1 Pixel je 4 Weltpixel): je weiter von freier Luft, desto dunkler und ruhiger */
    const dm = document.createElement("canvas"); dm.width = W * 4; dm.height = H * 4;
    const dmc = dm.getContext("2d"), dd = dmc.createImageData(W * 4, H * 4), [cr0, cr1, cr2] = cr;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const d = dep[y * W + x]; if (!d) continue;
      let near = null;
      if (d < 4) { near = []; for (let dy = -3; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) { const xx = x + dx, yy = y + dy; if (xx >= 0 && yy >= 0 && xx < W && yy < H && !sol[yy * W + xx]) near.push(xx * T, yy * T); } }
      for (let sy = 0; sy < 4; sy++) for (let sx = 0; sx < 4; sx++) {
        let a = 1;
        if (near) { const qx = x * T + sx * 4 + 2, qy = y * T + sy * 4 + 2; let best = 1e9; for (let i = 0; i < near.length; i += 2) { const ddx = Math.max(near[i] - qx, 0, qx - near[i] - T), ddy = Math.max(near[i + 1] - qy, 0, qy - near[i + 1] - T), q2 = ddx * ddx + ddy * ddy; if (q2 < best) best = q2; } a = Math.min(1, Math.max(0, (Math.sqrt(best) - 5) / 17)); a = a < 0.12 ? 0 : a < 0.45 ? 0.3 : a < 0.8 ? 0.6 : 0.8; }
        if (!near) a = 0.88;
        const o = ((y * 4 + sy) * W * 4 + x * 4 + sx) * 4; dd.data[o] = cr0; dd.data[o + 1] = cr1; dd.data[o + 2] = cr2; dd.data[o + 3] = a * 255;
      }
    }
    dmc.putImageData(dd, 0, 0);
    PR.depth = dm;
  }
  /* Wertrauschen, das sich nach px×py Gitterzellen wiederholt (für nahtlose Vorlagen) */
  function vnoiseP(x, y, px, py) { const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi, s = t => t * t * (3 - 2 * t), X = k => ((k % px) + px) % px, Y = k => ((k % py) + py) % py;
    const a = hash(X(xi), Y(yi)), b = hash(X(xi + 1), Y(yi)), c2 = hash(X(xi), Y(yi + 1)), d = hash(X(xi + 1), Y(yi + 1)); return U.lerp(U.lerp(a, b, s(xf)), U.lerp(c2, d, s(xf)), s(yf)); }
  /* großflächige Alterung der Wand: dunkle Wasserränder und ausgeblichene Stellen */
  function wallBlotches(g, w, h) {
    for (let y = 0; y < h; y += 4) for (let x = 0; x < w; x += 4) {
      const n = vnoiseP((x + 2) / 72, (y + 2) / 56, w / 72, h / 56) * 0.75 + vnoiseP((x + 2) / 24 + 7, (y + 2) / 21, w / 24, h / 21) * 0.25;
      if (n > 0.52) { g.fillStyle = "rgba(0,0,0," + ((n - 0.52) * 0.75).toFixed(3) + ")"; g.fillRect(x, y, 4, 4); }
      else if (n < 0.34) { g.fillStyle = "rgba(255,236,210," + ((0.34 - n) * 0.18).toFixed(3) + ")"; g.fillRect(x, y, 4, 4); }
    }
  }
  /* Mustervorlagen je Gebiet: einmal aufwendig gemalt, danach nur noch als Füllmuster benutzt */
  const PWW = 576, PWH = 336, PRW = 384, PRH = 192;
  let TEX = null;
  const canPatT = typeof DOMMatrix !== "undefined" && typeof CanvasPattern !== "undefined" && !!CanvasPattern.prototype.setTransform;
  /* Auflösung der Chunks auf Viertel gerundet: Muster passen dann pixelgenau (ohne Filterung) */
  const chunkScale = () => Math.max(1, Math.round((G.bs || 1) * 4) / 4);
  function textures(st, det) {
    const s = canPatT ? chunkScale() : 1, key = s + "|" + det + "|" + B.bg + "|" + B.wall + "|" + B.brick + "|" + B.tile.base + "|" + B.tile.dark;
    if (TEX && TEX.key === key) return TEX;
    const mk = (w, h, fn) => { const cv = document.createElement("canvas"); cv.width = Math.round(w * s); cv.height = Math.round(h * s); const g = cv.getContext("2d"); g.scale(cv.width / w, cv.height / h); WRAP = { w, h }; try { fn(g); } catch (e) { console.error(e); } WRAP = null; return { cv, w, h }; };
    /* der leichte Schleier, der die Rückwand hinter den Fels treten lässt, ist gleich mit eingebacken */
    TEX = { key, wall: mk(PWW, PWH, g => { wallBase(g, st, 0, 0, PWW, PWH, det); if (det >= 1) wallBlotches(g, PWW, PWH); g.fillStyle = "rgba(" + PAL.coreRGB + ",.2)"; g.fillRect(0, 0, PWW, PWH); }), rock: mk(PRW, PRH, g => rockBase(g, st, 0, 0, PRW, PRH, det)) };
    return TEX;
  }
  /* Vorlage wiederholt in ein Rechteck kopieren (Ursprung bei Welt 0,0 – nahtlos zwischen Chunks) */
  function tileTex(c, t, X, Y, w, h) { for (let ty = Math.floor(Y / t.h) * t.h; ty < Y + h; ty += t.h) for (let tx = Math.floor(X / t.w) * t.w; tx < X + w; tx += t.w) c.drawImage(t.cv, tx, ty, t.w, t.h); }
  function patternOf(c, t) { const p = c.createPattern(t.cv, "repeat"); if (canPatT) p.setTransform(new DOMMatrix().scale(t.w / t.cv.width, t.h / t.cv.height)); return p; }
  /* Ausschnitt einer Karte weich vergrößert zeichnen (eine Zelle Rand, damit Chunks nahtlos sind) */
  function drawMap(c, map, k, x0, y0, w, h) {
    const sx = Math.max(0, x0 * k - 1), sy = Math.max(0, y0 * k - 1), ex = Math.min(map.width, (x0 + w) * k + 1), ey = Math.min(map.height, (y0 + h) * k + 1);
    if (ex <= sx || ey <= sy) return;
    const f = T / k; c.drawImage(map, sx, sy, ex - sx, ey - sy, sx * f, sy * f, (ex - sx) * f, (ey - sy) * f);
  }
  G.prepTiles = function () { if (lv && B) prep(); };
  const sol = (x, y) => x < 0 || y < 0 || x >= PR.W || y >= PR.H ? 1 : PR.sol[y * PR.W + x];
  const inLv = (x, y) => x >= 0 && y >= 0 && x < PR.W && y < PR.H;
  /* begehbare Rückwand: frei, kein Himmel, kein Fenster, kein Abgrund */
  const isWall = (x, y) => inLv(x, y) && !PR.sol[y * PR.W + x] && !PR.clear[y * PR.W + x] && !PR.win[y * PR.W + x] && lv.get(x, y) !== 9;
  const isPlatV = v => v === 2 || v === 8 || v === 10;
  /* Abstand (in Kacheln) zum nächsten Boden unter einer Wandkachel, 0 = keiner in Reichweite */
  function floorBelow(x, y, max) { for (let k = 1; k <= max; k++) { const v = lv.get(x, y + k); if (solidV(v) || isPlatV(v)) return k; if (v === 9) return 0; } return 0; }

  /* ---------- Rückwand: Grundmuster je Mauerart ---------- */
  function wallBase(c, st, X, Y, w, h, det) {
    const wall = B.wall;
    setCR(X, Y, w, h);
    c.fillStyle = B.brick; c.fillRect(X, Y, w, h);
    switch (st.wall) {
      case "brick": {
        const warm = mixH(wall, "#6a3020", 0.32);
        masonry(c, { rowH: 6, bw: 12, off: 6, jit: 0, gap: 1, seed: 5, cols: [lit(warm, -0.15), lit(warm, -0.06), warm, mixH(wall, "#5a3a28", 0.2), lit(warm, 0.07), lit(wall, 0.02)], hi: rgba(lit(warm, 0.3), 0.45), hi2: rgba(lit(warm, 0.2), 0.2), lo: "rgba(0,0,0,.3)", extra: det >= 1 ? chips : null });
        break;
      }
      case "rubble": {
        /* Bruchstein: unregelmäßige Steine in versetzten Reihen */
        const cols = PAL.wallCols;
        const KX = WRAP ? WRAP.w / 12 : 0, KY = WRAP ? WRAP.h / 8 : 0;
        for (let j = Math.floor(Y / 8) - 1; j * 8 < Y + h + 8; j++) {
          const off = (j & 1) * 6, jj = wk(j, KY);
          for (let i = Math.floor((X - off) / 12) - 1; i * 12 + off < X + w + 12; i++) {
            const bx = k => k * 12 + off + (hash(wk(k, KX) * 3 + 1, jj * 5 + 2) - 0.5) * 5;
            const x0 = bx(i) + 1, x1 = bx(i + 1) - 1, v = hash(wk(i, KX) * 11 + 3, jj * 7 + 5);
            const y0 = j * 8 + 0.8 + (v * 1.4), y1 = (j + 1) * 8 - 0.4 - ((v * 7) % 1) * 1.4, ch = 2.2;
            c.fillStyle = cols[(v * cols.length) | 0];
            c.beginPath(); c.moveTo(x0 + ch, y0); c.lineTo(x1 - ch, y0); c.lineTo(x1, y0 + ch); c.lineTo(x1, y1 - ch); c.lineTo(x1 - ch, y1); c.lineTo(x0 + ch, y1); c.lineTo(x0, y1 - ch); c.lineTo(x0, y0 + ch); c.fill();
            c.fillStyle = PAL.wHi; c.fillRect(x0 + ch, y0, x1 - x0 - ch * 2, 1); c.fillRect(x0, y0 + ch, 1, y1 - y0 - ch * 2);
            c.fillStyle = PAL.wLo; c.fillRect(x0 + ch, y1 - 1, x1 - x0 - ch * 2, 1); c.fillRect(x1 - 1, y0 + ch, 1, y1 - y0 - ch * 2);
            if (v > 0.86) { c.fillStyle = "rgba(0,0,0,.25)"; c.fillRect(x0 + (x1 - x0) * 0.4, y0 + 2, 1.5, 1); }
          }
        }
        break;
      }
      case "plank": {
        /* senkrechte Bretter mit Stößen, Maserung und Querlatten */
        const wood = mixH(wall, "#5a4028", 0.45), cols = [lit(wood, -0.12), lit(wood, -0.05), wood, lit(wood, 0.06)];
        const KX = WRAP ? WRAP.w / 8 : 0, KY = WRAP ? WRAP.h / 56 : 0;
        for (let b = Math.floor(X / 8) - 1; b * 8 < X + w; b++) {
          const bx = b * 8, bb = wk(b, KX);
          for (let j = Math.floor(Y / 56) - 1; j * 56 < Y + h + 56; j++) {
            const s0 = j * 56 + ((hash(bb, wk(j, KY)) * 40) | 0), s1 = (j + 1) * 56 + ((hash(bb, wk(j + 1, KY)) * 40) | 0), v = hash(bb * 3 + 1, wk(j, KY));
            if (s1 < Y || s0 > Y + h) continue;
            c.fillStyle = cols[(v * cols.length) | 0]; c.fillRect(bx, s0, 7, s1 - s0 - 1);
            c.fillStyle = rgba(lit(wood, 0.25), 0.35); c.fillRect(bx, s0, 1, s1 - s0 - 1);
            c.fillStyle = "rgba(0,0,0,.18)"; c.fillRect(bx + 2 + ((v * 9) | 0) % 3, s0 + 2, 0.6, s1 - s0 - 4); c.fillRect(bx + 6, s0, 1, s1 - s0 - 1);
            if (det >= 1 && v > 0.9) { c.fillStyle = "rgba(0,0,0,.35)"; c.beginPath(); c.ellipse(bx + 3, s0 + 14 + v * 20, 1.4, 2.2, 0, 0, TAU); c.fill(); }
            c.fillStyle = "#1a120c"; c.fillRect(bx + 1.5, s0 + 2, 0.9, 0.9); c.fillRect(bx + 4, s0 + 2, 0.9, 0.9);
          }
        }
        for (let n = Math.floor(Y / 112) - 1; n * 112 < Y + h; n++) {
          const by = n * 112 + 70, wd = mixH(wall, "#4a3020", 0.55);
          c.fillStyle = "rgba(0,0,0,.3)"; c.fillRect(X, by + 5, w, 2);
          c.fillStyle = wd; c.fillRect(X, by, w, 5); c.fillStyle = rgba(lit(wd, 0.3), 0.5); c.fillRect(X, by, w, 1);
          c.fillStyle = "#16100a"; for (let xx = Math.floor(X / 8) * 8 + 3; xx < X + w; xx += 8) c.fillRect(xx, by + 2, 1, 1);
        }
        break;
      }
      case "panel": {
        /* Hallen: Stoffbespannung mit Rautenmuster (Damast) */
        c.fillStyle = wall; c.fillRect(X, Y, w, h);
        c.fillStyle = lit(wall, -0.06); for (let xx = Math.floor(X / 24) * 24; xx < X + w; xx += 24) c.fillRect(xx, Y, 12, h);
        c.save(); c.beginPath(); c.rect(X, Y, w, h); c.clip();
        c.strokeStyle = rgba(lit(wall, 0.2), 0.22); c.lineWidth = 0.6; c.beginPath();
        for (let d = Math.floor((X - Y - h) / 12) * 12; d < X + w - Y; d += 12) { c.moveTo(d + Y, Y); c.lineTo(d + Y + h, Y + h); }
        for (let d = Math.floor((X + Y) / 12) * 12; d < X + w + Y + h; d += 12) { c.moveTo(d - Y, Y); c.lineTo(d - Y - h, Y + h); }
        c.stroke();
        c.fillStyle = "rgba(229,180,84,.16)";
        for (let yy = Math.floor(Y / 12) * 12; yy < Y + h; yy += 12) for (let xx = Math.floor(X / 12) * 12 + ((yy / 12) & 1 ? 6 : 0); xx < X + w; xx += 12) { c.fillRect(xx - 0.5, yy + 6 - 2, 1, 4); c.fillRect(xx - 2, yy + 6 - 0.5, 4, 1); }
        c.restore();
        break;
      }
      case "cave": {
        /* Höhlenfels: verzogenes Facettennetz mit Lichtkanten */
        const cols = [lit(wall, -0.16), lit(wall, -0.08), wall, lit(wall, 0.05), lit(wall, 0.1)], gw = 16, gh = 12, KX = WRAP ? WRAP.w / gw : 0, KY = WRAP ? WRAP.h / gh : 0;
        const P = (i, j) => { const a = wk(i, KX), b = wk(j, KY); return [i * gw + (hash(a, b * 3 + 1) - 0.5) * 9, j * gh + (hash(b * 5 + 31, a) - 0.5) * 7]; };
        const hiS = rgba(lit(wall, 0.3), 0.3);
        for (let j = Math.floor(Y / gh) - 1; j * gh < Y + h + gh; j++) for (let i = Math.floor(X / gw) - 1; i * gw < X + w + gw; i++) {
          const a = P(i, j), b = P(i + 1, j), d = P(i + 1, j + 1), e = P(i, j + 1), v = hash(wk(i, KX) * 17 + 5, wk(j, KY) * 23 + 9);
          const band = hash(wk(j, KY), 77) * 0.6;
          c.fillStyle = cols[Math.min(4, (v * 3 + band * 2.2) | 0)];
          c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.lineTo(d[0], d[1]); c.lineTo(e[0], e[1]); c.closePath(); c.fill();
          c.strokeStyle = hiS; c.lineWidth = 0.7; c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke();
          c.strokeStyle = "rgba(0,0,0,.28)"; c.beginPath(); c.moveTo(b[0], b[1]); c.lineTo(d[0], d[1]); c.lineTo(e[0], e[1]); c.stroke();
        }
        break;
      }
      case "slab": {
        masonry(c, { rowH: 24, bw: 32, off: 16, jit: 4, gap: 1, seed: 9, cols: PAL.wallCols, hi: PAL.wHi, hi2: PAL.wHi2, lo: PAL.wLo, extra: det >= 1 ? slabExtra : null, rune: st.rune, ember: st.ember });
        break;
      }
      case "timber": {
        masonry(c, { rowH: 8, bw: 18, off: 9, jit: 6, gap: 1, seed: 3, cols: PAL.wallCols, hi: PAL.wHi, hi2: PAL.wHi2, lo: PAL.wLo, extra: det >= 1 ? chips : null });
        /* Fachwerk: Ständer, Riegel und Kopfbänder */
        const wood = mixH(wall, "#3e2818", 0.6), wHi = rgba(lit(wood, 0.3), 0.5);
        const beamH = (bx, by, bw2, bh2) => { c.fillStyle = "rgba(0,0,0,.28)"; c.fillRect(bx + 1, by + bh2, bw2, 2); c.fillStyle = wood; c.fillRect(bx, by, bw2, bh2); c.fillStyle = wHi; c.fillRect(bx, by, bw2, 1); c.fillStyle = "rgba(0,0,0,.2)"; c.fillRect(bx, by + bh2 * 0.6, bw2, 0.6); };
        for (let j = Math.floor(Y / (7 * T)) - 1; j * 7 * T < Y + h; j++) beamH(X, j * 7 * T, w, 7);
        for (let k = Math.floor(X / (12 * T)) - 1; k * 12 * T < X + w + 12 * T; k++) {
          const px0 = k * 12 * T - 4;
          c.fillStyle = "rgba(0,0,0,.3)"; c.fillRect(px0 + 8, Y, 2, h);
          c.fillStyle = wood; c.fillRect(px0, Y, 8, h); c.fillStyle = wHi; c.fillRect(px0, Y, 1, h); c.fillStyle = "rgba(0,0,0,.18)"; c.fillRect(px0 + 3, Y, 0.6, h);
          for (let j = Math.floor(Y / (7 * T)) - 1; j * 7 * T < Y + h + 7 * T; j++) {
            const by = j * 7 * T + 7;
            for (const s of [-1, 1]) { c.fillStyle = wood; c.beginPath(); const ex = s < 0 ? px0 : px0 + 8; c.moveTo(ex, by + 22); c.lineTo(ex, by + 28); c.lineTo(ex + s * 26, by); c.lineTo(ex + s * 20, by); c.fill(); }
            c.fillStyle = "#1a120a"; c.fillRect(px0 + 3, by - 4, 2, 2);
          }
        }
        break;
      }
      default: /* ashlar */
        masonry(c, { rowH: 8, bw: 18, off: 9, jit: 6, gap: 1, seed: 3, cols: PAL.wallCols, hi: PAL.wHi, hi2: PAL.wHi2, lo: PAL.wLo, extra: det >= 1 ? chips : null });
    }
  }

  /* ---------- Rückwand: Schmuck je Kachel ---------- */
  function wallFeatures(c, st, x0, y0, x1, y1, det, GR) {
    const M = B.open === "arch" ? 12 : B.open === "vault" ? 18 : st.wall === "panel" ? 10 : 0, MV = B.open === "arch" ? 7 : B.open === "vault" ? 9 : 0;
    const wall = B.wall;
    for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) {
      if (!isWall(x, y)) continue;
      const px = x * T, py = y * T; setCR(px, py, T, T);
      /* Gesims zwischen den Fensterreihen */
      if (MV && st.cor && y % MV === 0 && !sol(x, y - 1)) {
        c.fillStyle = "rgba(0,0,0,.22)"; fr(c, px, py + 5, T, 3);
        c.fillStyle = PAL.stone; fr(c, px, py, T, 5); c.fillStyle = PAL.stoneHi; fr(c, px, py, T, 1); c.fillStyle = PAL.stoneLo; fr(c, px, py + 4, T, 1);
        if (st.dentil) { c.fillStyle = PAL.stoneLo; for (let k = 0; k < T; k += 4) fr(c, px + k + 1, py + 5, 2, 2); }
        else { c.fillStyle = "rgba(0,0,0,.18)"; fr(c, px + ((x * 5) % 16), py + 1, 1, 3); }
      }
      /* Pfeiler */
      if (M && st.pil) {
        const lx = ((x % M) + M) % M;
        if (lx === 0 || lx === M - 1) {
          const cx = lx === 0 ? px : px + T, pw = st.wall === "panel" ? 6 : 7;
          const pc = st.wall === "panel" ? mixH(wall, "#6a4a30", 0.45) : PAL.stone;
          c.fillStyle = "rgba(0,0,0,.25)"; fr(c, cx + pw, py, 3, T);
          c.fillStyle = pc; fr(c, cx - pw, py, pw * 2, T);
          c.fillStyle = rgba(lit(pc, 0.3), 0.6); fr(c, cx - pw, py, 1.5, T);
          c.fillStyle = "rgba(0,0,0,.22)"; fr(c, cx + pw - 2, py, 2, T); fr(c, cx - 2.5, py, 0.7, T); fr(c, cx + 2, py, 0.7, T);
          if (st.wall !== "panel") { c.fillStyle = "rgba(0,0,0,.2)"; fr(c, cx - pw, py + ((y & 1) ? 9 : 1), pw * 2, 0.7); }
          if (sol(x, y - 1)) { c.fillStyle = "rgba(0,0,0,.3)"; fr(c, cx - pw - 2, py + 6, pw * 2 + 4, 2); c.fillStyle = lit(pc, 0.08); fr(c, cx - pw - 3, py, pw * 2 + 6, 3); fr(c, cx - pw - 1.5, py + 3, pw * 2 + 3, 3); c.fillStyle = rgba(lit(pc, 0.35), 0.7); fr(c, cx - pw - 3, py + 3, pw * 2 + 6, 0.7); }
          const fb = lv.get(x, y + 1);
          if (solidV(fb) || isPlatV(fb)) { c.fillStyle = lit(pc, -0.08); fr(c, cx - pw - 2, py + T - 6, pw * 2 + 4, 6); c.fillStyle = rgba(lit(pc, 0.3), 0.6); fr(c, cx - pw - 2, py + T - 6, pw * 2 + 4, 1); fr(c, cx - pw - 1, py + T - 3.5, pw * 2 + 2, 0.7); }
        }
      }
      /* Sockel, Vertäfelung, Steinsockel */
      const fb = floorBelow(x, y, 2);
      if (fb) {
        const fy = (y + fb) * T;
        if (st.wall === "panel") {
          /* Holzvertäfelung mit Füllungen und Handlauf */
          const top = fy - 26, wood = mixH(wall, "#4a2a18", 0.55);
          c.fillStyle = lit(wood, -0.15); fr(c, px, top, T, 26);
          const pw2 = 24, pi = Math.floor(px / pw2);
          for (let k = pi - 1; k <= pi + 1; k++) {
            const qx = k * pw2 + 3, qy = top + 5, qw = pw2 - 6, qh = 17;
            c.fillStyle = wood; fr(c, qx, qy, qw, qh);
            c.fillStyle = rgba(lit(wood, 0.3), 0.55); fr(c, qx, qy, qw, 1); fr(c, qx, qy, 1, qh);
            c.fillStyle = "rgba(0,0,0,.35)"; fr(c, qx, qy + qh - 1, qw, 1); fr(c, qx + qw - 1, qy, 1, qh);
            c.fillStyle = rgba(lit(wood, 0.12), 0.6); fr(c, qx + 3, qy + 3, qw - 6, qh - 6);
            c.fillStyle = "rgba(0,0,0,.2)"; fr(c, qx + 3, qy + qh - 4, qw - 6, 1);
          }
          c.fillStyle = "rgba(0,0,0,.3)"; fr(c, px, top + 3, T, 2);
          c.fillStyle = lit(wood, 0.12); fr(c, px, top, T, 3); c.fillStyle = rgba("#e5b454", 0.45); fr(c, px, top, T, 0.7);
        } else if (st.wall === "plank") {
          setCR(px, Math.max(py, fy - 12), T, Math.min(py + T, fy) - Math.max(py, fy - 12));
          if (C1y > C0y) { c.fillStyle = B.brick; fr(c, C0x, C0y, T, 12); masonry(c, { rowH: 6, bw: 12, off: 6, jit: 3, gap: 1, seed: 7, cols: [lit(B.tile.base, -0.25), lit(B.tile.base, -0.15), lit(B.tile.base, -0.32)], hi: PAL.rHi, hi2: PAL.rHi2, lo: PAL.rLo, extra: null }); }
          setCR(px, py, T, T); c.fillStyle = "rgba(0,0,0,.35)"; fr(c, px, fy - 13, T, 1);
        } else if (st.wall !== "cave") {
          c.fillStyle = lit(wall, -0.14); fr(c, px, fy - 6, T, 6);
          c.fillStyle = PAL.wHi; fr(c, px, fy - 6, T, 1);
          c.fillStyle = "rgba(0,0,0,.3)"; fr(c, px + ((x * 7) & 15), fy - 5, 1, 5);
        }
      }
    }
  }

  /* ---------- Rückwand: Flecken, Risse, Nischen, Efeu, Ruß (dürfen über Kachelgrenzen reichen) ---------- */
  function wallDirt(c, st, x0, y0, x1, y1, det) {
    if (det < 1) return;
    const tl = B.tile, wall = B.wall;
    for (let y = y0 - 4; y < y1 + 4; y++) for (let x = x0 - 3; x < x1 + 3; x++) {
      if (!isWall(x, y)) continue;
      const px = x * T, py = y * T, r = h3(x, y, 1), r2 = h3(x, y, 2), r3 = h3(x, y, 3);
      /* Wasserflecken und Schlieren unter Decken */
      if (sol(x, y - 1) && r < (st.wet ? 0.4 : st.soot ? 0.3 : 0.2)) {
        const sx = px + 2 + r2 * 10, sw = 3 + r3 * 5, sl = 14 + r2 * 34;
        const col = st.soot ? "14,10,10" : st.slime ? "40,60,20" : st.moss ? "20,30,16" : "10,8,6";
        const g = c.createLinearGradient(0, py, 0, py + sl); g.addColorStop(0, "rgba(" + col + ",.45)"); g.addColorStop(1, "rgba(" + col + ",0)");
        c.fillStyle = g; c.beginPath(); c.moveTo(sx - 1, py); c.lineTo(sx + sw + 1, py); c.quadraticCurveTo(sx + sw, py + sl * 0.6, sx + sw * 0.55, py + sl); c.quadraticCurveTo(sx, py + sl * 0.5, sx - 1, py); c.fill();
        if (st.slime || st.wet) { c.fillStyle = st.slime ? "rgba(110,150,40,.45)" : "rgba(170,190,170,.18)"; c.fillRect(sx + sw * 0.4, py, 0.8, sl * 0.8); if (st.slime) { c.beginPath(); c.arc(sx + sw * 0.4 + 0.4, py + sl * 0.8, 1, 0, TAU); c.fill(); } }
        if (st.salt) { c.fillStyle = "rgba(230,224,206,.16)"; c.beginPath(); c.moveTo(sx - 2, py + sl * 0.55); c.quadraticCurveTo(sx + sw / 2, py + sl * 0.45, sx + sw + 2, py + sl * 0.55); c.lineTo(sx + sw + 2, py + sl * 0.62); c.quadraticCurveTo(sx + sw / 2, py + sl * 0.5, sx - 2, py + sl * 0.62); c.fill(); }
      }
      /* Ruß unter der Decke in Schmiede und Zinnen */
      if (st.soot && sol(x, y - 1)) { const g = c.createLinearGradient(0, py, 0, py + 22); g.addColorStop(0, "rgba(8,5,4,.4)"); g.addColorStop(1, "rgba(8,5,4,0)"); c.fillStyle = g; c.fillRect(px, py, T, 22); }
      /* Moos an feuchten Stellen */
      if (st.moss && r3 < 0.16 && (sol(x, y + 1) || sol(x, y - 1) || sol(x - 1, y) || sol(x + 1, y))) {
        const mx = px + 8, my = sol(x, y + 1) ? py + 14 : sol(x, y - 1) ? py + 2 : py + 8;
        for (let k = 0; k < 14; k++) { const a = h3(x, y, 20 + k) * TAU, d = h3(x, y, 40 + k) * 7; c.fillStyle = k % 3 ? "rgba(70,96,42,.5)" : "rgba(100,128,56,.45)"; c.fillRect(mx + Math.cos(a) * d * 1.4, my + Math.sin(a) * d * 0.7, 1.6, 1.3); }
      }
      /* Flechten am Seeufer */
      if (st.lichen && r3 > 0.9) { for (let k = 0; k < 7; k++) { c.fillStyle = k % 2 ? "rgba(150,170,110,.2)" : "rgba(190,180,120,.16)"; c.beginPath(); c.ellipse(px + h3(x, y, 50 + k) * 16, py + h3(x, y, 60 + k) * 16, 0.6 + h3(x, y, 70 + k) * 1.6, 0.4 + h3(x, y, 71 + k) * 0.8, 0, 0, TAU); c.fill(); } }
      /* Risse */
      if (r2 > 0.93) {
        let xx = px + r * 16, yy = py + r3 * 6; c.strokeStyle = "rgba(0,0,0,.5)"; c.lineWidth = 0.8; c.beginPath(); c.moveTo(xx, yy);
        const pts = []; for (let k = 0; k < 5; k++) { xx += (h3(x, y, 80 + k) - 0.5) * 9; yy += 3 + h3(x, y, 90 + k) * 4; c.lineTo(xx, yy); pts.push(xx, yy); }
        c.moveTo(pts[2], pts[3]); c.lineTo(pts[2] + 5, pts[3] + 2); c.stroke();
        c.strokeStyle = rgba(lit(wall, 0.35), 0.3); c.lineWidth = 0.5; c.beginPath(); c.moveTo(px + r * 16 + 0.8, py + r3 * 6 + 0.6); for (let k = 0; k < 4; k += 2) c.lineTo(pts[k] + 0.8, pts[k + 1] + 0.6); c.stroke();
      }
      /* Spinnweben in Ecken (Schlund) */
      if (st.web && sol(x, y - 1) && (sol(x - 1, y) || sol(x + 1, y)) && r < 0.7) {
        const left = sol(x - 1, y), ox = left ? px : px + T, oy = py, s = left ? 1 : -1, R0 = 10 + r2 * 10;
        c.strokeStyle = "rgba(225,218,235,.32)"; c.lineWidth = 0.5;
        for (let k = 0; k <= 4; k++) { const a = k / 4 * Math.PI / 2; c.beginPath(); c.moveTo(ox, oy); c.lineTo(ox + s * Math.cos(a) * R0, oy + Math.sin(a) * R0); c.stroke(); }
        for (let rr = 3; rr < R0; rr += 3) { c.beginPath(); for (let k = 0; k <= 4; k++) { const a = k / 4 * Math.PI / 2, q = rr - (k % 2) * 0.8; k ? c.lineTo(ox + s * Math.cos(a) * q, oy + Math.sin(a) * q) : c.moveTo(ox + s * Math.cos(a) * q, oy + Math.sin(a) * q); } c.stroke(); }
      }
      /* Nischen mit Kleinkram */
      if (det >= 2 && st.niche && r > 0.955 && isWall(x, y - 1) && isWall(x - 1, y) && isWall(x + 1, y) && !sol(x, y + 1) && floorBelow(x, y, 3) >= 2) niche(c, px, py, r2, st);
      /* Efeu klettert vom Boden die Wand hinauf */
      if (st.ivy && r2 < 0.13 && floorBelow(x, y, 1) === 1) ivy(c, x, y, r3);
      /* Glut-Adern in der Glutstadt */
      if (st.ember && det >= 2 && r3 > 0.95) { c.save(); c.globalCompositeOperation = "lighter"; c.strokeStyle = "rgba(255,100,30,.35)"; c.lineWidth = 1.2; c.beginPath(); let xx = px + r * 16, yy = py; c.moveTo(xx, yy); for (let k = 0; k < 6; k++) { xx += (h3(x, y, 100 + k) - 0.5) * 8; yy += 4; c.lineTo(xx, yy); } c.stroke(); c.restore(); }
    }
    /* Ruß über Fackeln und Feuerbecken */
    if (!G.sootSpr) { const s = G.sootSpr = document.createElement("canvas"); s.width = 32; s.height = 64; const g = s.getContext("2d"), gr = g.createRadialGradient(16, 40, 2, 16, 34, 30); gr.addColorStop(0, "rgba(6,4,3,.6)"); gr.addColorStop(0.5, "rgba(6,4,3,.25)"); gr.addColorStop(1, "rgba(6,4,3,0)"); g.fillStyle = gr; g.fillRect(0, 0, 32, 64); }
    for (const d of lv.decor) {
      if (d.x < x0 - 3 || d.x > x1 + 3 || d.y < y0 - 4 || d.y > y1 + 4) continue;
      if (d.kind === "torch") c.drawImage(G.sootSpr, d.x * T - 8, d.y * T - 48, 32, 52);
      else if (d.kind === "brazier" || d.kind === "forge") c.drawImage(G.sootSpr, d.x * T - 12, d.y * T - 50, 40, 60);
    }
  }
  function niche(c, px, py, r, st) {
    const x0 = px + 3, x1 = px + 13, top = py - 4, bot = py + 12;
    c.fillStyle = "rgba(0,0,0,.5)"; c.beginPath(); c.moveTo(x0, bot); c.lineTo(x0, top + 5); c.arc(px + 8, top + 5, 5, Math.PI, 0); c.lineTo(x1, bot); c.fill();
    const g = c.createLinearGradient(0, top, 0, top + 10); g.addColorStop(0, "rgba(0,0,0,.45)"); g.addColorStop(1, "rgba(0,0,0,0)"); c.fillStyle = g; c.fillRect(x0, top, 10, 10);
    c.fillStyle = rgba(lit(B.wall, 0.3), 0.18); c.fillRect(x1 - 1.5, top + 4, 1.5, bot - top - 4);
    c.strokeStyle = PAL.stoneHi; c.lineWidth = 0.8; c.beginPath(); c.moveTo(x0 - 1, bot); c.lineTo(x0 - 1, top + 5); c.arc(px + 8, top + 5, 6, Math.PI, 0); c.lineTo(x1 + 1, bot); c.stroke();
    c.fillStyle = PAL.stone; c.fillRect(x0 - 2, bot, 14, 2); c.fillStyle = PAL.stoneHi; c.fillRect(x0 - 2, bot, 14, 0.7);
    /* Inhalt */
    const k = (r * 1000 | 0) % 5;
    if (k === 0) { D.circ(c, px + 8, bot - 3, 2.8, "#cfc6b4"); c.fillStyle = "#1a1210"; c.fillRect(px + 6.6, bot - 4, 1.1, 1.2); c.fillRect(px + 8.4, bot - 4, 1.1, 1.2); c.fillStyle = "#bfb6a4"; c.fillRect(px + 6.8, bot - 1.2, 2.6, 1.2); }
    else if (k === 1) { D.ell(c, px + 8, bot - 3.5, 3, 3.5, "#7a4a2e"); c.fillStyle = "#5a3420"; c.fillRect(px + 6.5, bot - 8.5, 3, 2); c.fillStyle = "rgba(255,220,180,.25)"; c.fillRect(px + 6, bot - 5.5, 1, 3); }
    else if (k === 2) { c.fillStyle = "#e0d4b8"; c.fillRect(px + 5, bot - 5, 2, 5); c.fillRect(px + 9, bot - 3.5, 2, 3.5); c.fillStyle = "rgba(240,230,210,.6)"; c.fillRect(px + 4.6, bot - 0.8, 7, 0.8); c.fillStyle = "#2a1a10"; c.fillRect(px + 5.8, bot - 6, 0.5, 1); c.fillRect(px + 9.8, bot - 4.5, 0.5, 1); }
    else if (k === 3) { c.fillStyle = "#3a2a4a"; c.fillRect(px + 5, bot - 6, 2, 6); c.fillStyle = "#6a3a2a"; c.fillRect(px + 7.2, bot - 7, 2.2, 7); c.fillStyle = "#4a5a2a"; c.save(); c.translate(px + 10.5, bot); c.rotate(0.25); c.fillRect(-1, -6, 2, 6); c.restore(); }
    else { c.fillStyle = "#3a4a2a"; c.fillRect(px + 6, bot - 6, 3, 6); c.fillRect(px + 6.8, bot - 8, 1.4, 2); c.fillStyle = "rgba(220,255,200,.3)"; c.fillRect(px + 6.4, bot - 5.5, 0.7, 4); }
  }
  function ivy(c, x, y, r) {
    const px = x * T + 3 + r * 10; let yy = (y + 1) * T, xx = px;
    let n = 0; while (n < 6 && isWall(x, y - n)) n++;
    const len = Math.min(n, 2 + ((r * 7) | 0) % 4) * T - 4; if (len < 12) return;
    c.strokeStyle = "#2a3a1c"; c.lineWidth = 1; c.beginPath(); c.moveTo(xx, yy);
    const pts = [];
    for (let s = 0; s < len; s += 3) { const ny = yy - s, nx = px + Math.sin(s * 0.11 + r * 9) * 4 + Math.sin(s * 0.31) * 1.2; c.lineTo(nx, ny); pts.push(nx, ny); }
    c.stroke();
    for (let i = 0; i < pts.length; i += 2) {
      const lx = pts[i], ly = pts[i + 1], side = (i / 2) % 2 ? 1 : -1, hh = h3(x, i, 7);
      if (hh < 0.15) continue;
      c.fillStyle = hh < 0.45 ? "#2e4a22" : hh < 0.8 ? "#3e5e2a" : "#567a34";
      c.beginPath(); c.ellipse(lx + side * 2.2, ly - 0.5, 2.1, 1.3, side * 0.5, 0, TAU); c.fill();
      if (hh > 0.9) { c.fillStyle = "rgba(255,255,220,.25)"; c.fillRect(lx + side * 2.2 - 0.5, ly - 1.2, 1, 0.6); }
    }
  }
  /* Kontaktschatten an Decken, Seitenwänden und Böden */
  function wallAO(c, x0, y0, x1, y1, GR) {
    for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) {
      if (!isWall(x, y)) continue;
      const px = x * T, py = y * T, u = sol(x, y - 1), l = sol(x - 1, y), r = sol(x + 1, y), d = sol(x, y + 1);
      if (!(u || l || r || d || sol(x - 1, y - 1) || sol(x + 1, y - 1))) continue;
      c.save(); c.translate(px, py);
      if (u) { c.fillStyle = GR.top; c.fillRect(0, 0, T, 16); }
      if (l) { c.fillStyle = GR.left; c.fillRect(0, 0, 8, T); }
      if (r) { c.fillStyle = GR.right; c.fillRect(T - 8, 0, 8, T); }
      if (d) { c.fillStyle = GR.bot; c.fillRect(0, T - 6, T, 6); }
      if (!u && !l && sol(x - 1, y - 1)) { c.fillStyle = GR.corner; c.fillRect(0, 0, 8, 8); }
      if (!u && !r && sol(x + 1, y - 1)) { c.save(); c.translate(T, 0); c.scale(-1, 1); c.fillStyle = GR.corner; c.fillRect(0, 0, 8, 8); c.restore(); }
      c.restore();
    }
  }

  /* ---------- Öffnungen mit Laibung, Bogensteinen, Fensterbank und Sprossen ---------- */
  function openings(c, st, x0, y0, x1, y1, det) {
    for (const o of PR.comps) {
      if (o.x1 < x0 - 3 || o.x0 > x1 + 3 || o.y1 < y0 - 3 || o.y0 > y1 + 3) continue;
      if (o.mode === "cave") caveHole(c, o, det); else archOpening(c, o, st, det);
    }
  }
  function maskPath(c, o) { c.beginPath(); for (let t = 0; t < o.tiles.length; t += 2) c.rect(o.tiles[t] * T, o.tiles[t + 1] * T, T, T); }
  function archOpening(c, o, st, det) {
    const L = o.x0 * T, R = (o.x1 + 1) * T, Tp = o.y0 * T, Bt = (o.y1 + 1) * T, w = R - L, hh = Bt - Tp, cx = (L + R) / 2, rx = w / 2;
    const s = Math.max(6, Math.min(rx * (o.mode === "vault" ? 0.75 : 0.62), hh * 0.42)), sp = Tp + s, rad = (rx * rx + s * s) / (2 * s), cy = sp + rad - s;
    const aL = Math.atan2(sp - cy, L - cx), aR = Math.atan2(sp - cy, R - cx);
    const shape = g => { c.beginPath(); c.moveTo(L - g, Bt); c.lineTo(L - g, sp); c.arc(cx, cy, rad + g, aL, aR); c.lineTo(R + g, sp); c.lineTo(R + g, Bt); c.closePath(); };
    const brick = st.wall === "brick", wall = B.wall;
    const sC = brick ? mixH(wall, "#7a3a26", 0.35) : PAL.stone, sHi = lit(sC, 0.22), sLo = lit(sC, -0.35);
    const sillOK = !sol(o.x0, o.y1 + 1) || !sol(o.x1, o.y1 + 1);
    /* 1) ausstanzen – oder beim Blendbogen eine vertiefte Wandfläche */
    c.save(); if (!o.full) { maskPath(c, o); c.clip(); }
    if (o.blind) { c.fillStyle = "rgba(0,0,0,.28)"; shape(0); c.fill(); const g = c.createLinearGradient(0, Tp, 0, sp + 18); g.addColorStop(0, "rgba(0,0,0,.35)"); g.addColorStop(1, "rgba(0,0,0,0)"); c.fillStyle = g; shape(0); c.fill(); }
    else { c.globalCompositeOperation = "destination-out"; shape(0); c.fill(); c.globalCompositeOperation = "source-over"; }
    /* 2) Laibung: die Mauerdicke im Inneren der Öffnung */
    c.save(); shape(0); c.clip();
    c.strokeStyle = lit(wall, -0.38); c.lineWidth = 9; shape(0); c.stroke();
    c.strokeStyle = lit(wall, -0.2); c.lineWidth = 3; shape(-3.5); c.stroke();
    c.fillStyle = rgba(lit(wall, 0.15), 0.5); c.fillRect(L, sp, 4.5, Bt - sp);
    c.strokeStyle = "rgba(0,0,0,.45)"; c.lineWidth = 1; shape(-4.5); c.stroke();
    /* Sprossen und Maßwerk */
    if (o.mode === "arch" && w >= 5 * T && det >= 1 && !o.blind) {
      const mw = 4, glass = st.wall === "panel" || st.wall === "timber";
      if (glass && det >= 2) {
        /* Bleiglas mit Rautenmuster (warm, nie blau) */
        /* Rautenmuster als vorgezeichnete Kachel: eine einzige Füllung statt vieler Linien */
        if (!G.glassTile || G.glassTile.s !== chunkScale()) { const sc = chunkScale(), gt = document.createElement("canvas"); gt.width = gt.height = Math.round(14 * sc); const gg = gt.getContext("2d"); gg.scale(gt.width / 14, gt.height / 14);
          gg.fillStyle = "rgba(255,190,110,.07)"; gg.fillRect(0, 0, 14, 14); gg.strokeStyle = "rgba(20,12,8,.35)"; gg.lineWidth = 0.6; gg.beginPath(); gg.moveTo(0, 0); gg.lineTo(14, 14); gg.moveTo(14, 0); gg.lineTo(0, 14); gg.moveTo(7, -7); gg.lineTo(21, 7); gg.moveTo(-7, 7); gg.lineTo(7, 21); gg.moveTo(7, 21); gg.lineTo(21, 7); gg.moveTo(-7, 7); gg.lineTo(7, -7); gg.stroke(); G.glassTile = { cv: gt, w: 14, h: 14, s: sc }; }
        c.fillStyle = patternOf(c, G.glassTile); shape(-4.5); c.fill();
        for (let k = 0; k < 6; k++) { const gx = L + 8 + h3(o.x0, o.y0, k) * (w - 16), gy = sp + h3(o.y0, o.x0, k) * (Bt - sp - 8); c.fillStyle = ["rgba(170,40,40,.18)", "rgba(220,170,60,.18)", "rgba(90,130,60,.16)"][k % 3]; c.fillRect(gx, gy, 5, 5); }
      }
      const sub = (a, b, sag, yS) => { const r2 = ((b - a) / 2) ** 2 / (2 * sag) + sag / 2, ccx = (a + b) / 2, ccy = yS + r2 - sag; c.beginPath(); c.arc(ccx, ccy, r2, Math.atan2(yS - ccy, a - ccx), Math.atan2(yS - ccy, b - ccx)); };
      const ySub = sp + (Bt - sp) * 0.18, sag = Math.min(rx / 2 - 3, (ySub - Tp) * 0.75);
      c.lineCap = "butt";
      const oc = Math.min(sag * 0.55, rx * 0.2);
      for (const [col, lw] of [[sLo, 4], [sC, 2.6], [sHi, 0.6]]) {
        c.strokeStyle = col; c.lineWidth = lw;
        sub(L + 4, cx - mw / 2, sag, ySub); c.stroke(); sub(cx + mw / 2, R - 4, sag, ySub); c.stroke();
        if (oc > 4) { c.beginPath(); c.arc(cx, (Tp + ySub - sag) / 2 + 1, oc, 0, TAU); c.stroke(); }
      }
      c.fillStyle = sLo; c.fillRect(cx - mw / 2 - 0.5, Tp, mw + 1.5, hh);
      c.fillStyle = sC; c.fillRect(cx - mw / 2, Tp, mw, hh);
      c.fillStyle = sHi; c.fillRect(cx - mw / 2, Tp, 1, hh);
      c.fillStyle = sC; c.fillRect(cx - mw / 2 - 1.5, ySub - 3, mw + 3, 3); c.fillStyle = sHi; c.fillRect(cx - mw / 2 - 1.5, ySub - 3, mw + 3, 0.7);
      /* eiserne Quersprossen */
      c.fillStyle = "rgba(24,18,16,.85)"; for (let yb = ySub + 16; yb < Bt - 6; yb += 18) { c.fillRect(L + 3, yb, cx - L - 5, 1.2); c.fillRect(cx + 2, yb, R - cx - 5, 1.2); }
    }
    if (o.mode === "vault" && B.bg === "dungeon" && !o.blind) {
      /* Gitterstäbe, einer verbogen */
      const bent = (h3(o.x0, o.y0, 5) * 8) | 0;
      c.fillStyle = "rgba(14,14,12,.95)";
      for (let k = 0, xb = L + 7; xb < R - 4; xb += 10, k++) {
        if (k === bent) { c.strokeStyle = "rgba(14,14,12,.95)"; c.lineWidth = 2; c.beginPath(); c.moveTo(xb + 1, Tp); c.quadraticCurveTo(xb + 9, (Tp + Bt) / 2, xb + 1, Bt); c.stroke(); continue; }
        c.fillRect(xb, Tp, 2, hh); c.fillStyle = "rgba(160,150,130,.35)"; c.fillRect(xb, Tp, 0.6, hh); c.fillStyle = "rgba(14,14,12,.95)";
      }
      for (const yb of [sp + 6, Bt - 20]) { c.fillRect(L, yb, w, 2.4); c.fillStyle = "rgba(160,150,130,.3)"; c.fillRect(L, yb, w, 0.6); c.fillStyle = "rgba(14,14,12,.95)"; }
    }
    c.restore();
    /* innere Fensterbank */
    if (sillOK) { c.fillStyle = lit(sC, -0.1); c.fillRect(L, Bt - 4, w, 4); c.fillStyle = sHi; c.fillRect(L, Bt - 4, w, 1); }
    c.restore();
    /* 3) Bogensteine mit Schlussstein */
    const arcLen = rad * (aR - aL), N = Math.max(5, (Math.round(arcLen / (brick ? 5 : 8)) | 1));
    for (let i = 0; i < N; i++) {
      const a0 = aL + (aR - aL) * i / N, a1 = aL + (aR - aL) * (i + 1) / N, key = i === (N - 1) / 2, g = key ? 10 : brick ? 6 : 7;
      c.fillStyle = key ? lit(sC, 0.1) : i % 2 ? sC : lit(sC, -0.08);
      c.beginPath(); c.arc(cx, cy, rad - 0.5, a0, a1); c.arc(cx, cy, rad + g, a1, a0, true); c.closePath(); c.fill();
      c.strokeStyle = "rgba(0,0,0,.45)"; c.lineWidth = 0.6; c.stroke();
      c.strokeStyle = sHi; c.lineWidth = 0.6; c.beginPath(); c.arc(cx, cy, rad + g - 0.4, a0 + 0.01, a1 - 0.01); c.stroke();
      if (key && st.rune) { c.save(); c.globalCompositeOperation = "lighter"; const am = (a0 + a1) / 2, kx = cx + Math.cos(am) * (rad + 5), ky = cy + Math.sin(am) * (rad + 5); c.strokeStyle = "rgba(255,160,60,.6)"; c.lineWidth = 0.7; runeGlyph(c, kx, ky, 3, 0.5); c.stroke(); D.glow(c, kx, ky, 8, "rgba(255,140,50,.35)"); c.restore(); }
    }
    if (brick && det >= 1) { c.strokeStyle = rgba(sLo, 0.8); c.lineWidth = 1; c.beginPath(); c.arc(cx, cy, rad + 7, aL, aR); c.stroke(); }
    /* 4) Eckquader an den Gewänden */
    for (const side of [-1, 1]) {
      let y = sp, k = 0; const ex = side < 0 ? L : R;
      while (y < Bt - 0.5) {
        const bh = Math.min(k % 2 ? 7 : 9, Bt - y), bw = k % 2 ? 5 : 9, bx = side < 0 ? ex - bw : ex;
        c.fillStyle = k % 2 ? lit(sC, -0.06) : sC; c.fillRect(bx, y, bw, bh - 0.8);
        c.fillStyle = sHi; c.fillRect(bx, y, bw, 0.8); if (side < 0) c.fillRect(bx, y, 0.8, bh - 0.8);
        c.fillStyle = "rgba(0,0,0,.4)"; c.fillRect(bx, y + bh - 0.8, bw, 0.8); if (side > 0) c.fillRect(bx + bw - 0.8, y, 0.8, bh - 0.8);
        y += bh; k++;
      }
    }
    /* 5) Fensterbank mit Schatten */
    if (sillOK) {
      const g = c.createLinearGradient(0, Bt + 4, 0, Bt + 10); g.addColorStop(0, "rgba(0,0,0,.4)"); g.addColorStop(1, "rgba(0,0,0,0)"); c.fillStyle = g; c.fillRect(L - 6, Bt + 4, w + 12, 6);
      c.fillStyle = sC; c.fillRect(L - 6, Bt, w + 12, 4); c.fillStyle = sHi; c.fillRect(L - 6, Bt, w + 12, 1); c.fillStyle = sLo; c.fillRect(L - 6, Bt + 3.2, w + 12, 0.8);
      c.fillStyle = sC; c.fillRect(L - 4, Bt + 4, 4, 3); c.fillRect(R, Bt + 4, 4, 3);
    }
  }
  function caveHole(c, o, det) {
    const W = PR.W, wall = B.wall, tl = o.tiles;
    /* Mittelpunkte leicht verwackelt, Nachbarn mit runden Kapseln verbunden: glatte, organische Ränder ohne Blasen */
    const cxOf = (x, y) => x * T + 8 + (hash(x, y) - 0.5) * 5, cyOf = (x, y) => y * T + 8 + (hash(y, x) - 0.5) * 5;
    const inM = (x, y) => inLv(x, y) && PR.win[y * W + x] === 1;
    const path = (dx, dy) => {
      c.beginPath();
      for (let t = 0; t < tl.length; t += 2) {
        const x = tl[t], y = tl[t + 1], ax = cxOf(x, y) + dx, ay = cyOf(x, y) + dy;
        c.moveTo(ax, ay); c.lineTo(ax + 0.01, ay);
        if (inM(x + 1, y)) { c.moveTo(ax, ay); c.lineTo(cxOf(x + 1, y) + dx, cyOf(x + 1, y) + dy); }
        if (inM(x, y + 1)) { c.moveTo(ax, ay); c.lineTo(cxOf(x, y + 1) + dx, cyOf(x, y + 1) + dy); }
        if (inM(x + 1, y + 1) && inM(x + 1, y) && inM(x, y + 1)) { c.moveTo(ax, ay); c.lineTo(cxOf(x + 1, y + 1) + dx, cyOf(x + 1, y + 1) + dy); c.moveTo(cxOf(x + 1, y) + dx, cyOf(x + 1, y) + dy); c.lineTo(cxOf(x, y + 1) + dx, cyOf(x, y + 1) + dy); }
      }
    };
    const R = 11.5;
    c.save(); c.lineCap = "round"; c.lineJoin = "round";
    c.strokeStyle = rgba(lit(wall, -0.55), 0.7); c.lineWidth = (R + 5) * 2; path(0, 1.5); c.stroke();
    c.strokeStyle = lit(wall, 0.14); c.lineWidth = (R + 2.2) * 2; path(-0.6, -1.4); c.stroke();
    c.strokeStyle = lit(wall, -0.22); c.lineWidth = (R + 1.2) * 2; path(0.4, 0.6); c.stroke();
    c.globalCompositeOperation = "destination-out"; c.strokeStyle = "#000"; c.lineWidth = R * 2; path(0, 0); c.stroke();
    c.restore();
    /* Tropfsteine an der Oberkante, Geröllhäufchen an der Unterkante */
    if (det < 1) return;
    for (let t = 0; t < tl.length; t += 2) {
      const x = tl[t], y = tl[t + 1];
      if (!inM(x, y - 1)) {
        const n = 1 + ((hash(x, y + 3) * 3) | 0), ey = cyOf(x, y) - R;
        for (let k = 0; k < n; k++) { const sx = x * T + 3 + h3(x, y, k) * 10, ln = 4 + h3(x, y, k + 5) * 9, sw = 1.8 + h3(x, y, k + 9) * 2;
          c.fillStyle = lit(wall, -0.18); c.beginPath(); c.moveTo(sx - sw, ey - 2); c.lineTo(sx + sw, ey - 2); c.lineTo(sx, ey + ln); c.fill(); c.fillStyle = rgba(lit(wall, 0.3), 0.45); c.beginPath(); c.moveTo(sx - sw, ey - 2); c.lineTo(sx - sw * 0.4, ey - 2); c.lineTo(sx, ey + ln); c.fill(); }
      }
      if (!inM(x, y + 1) && hash(x * 5, y) < 0.6) {
        const ey = cyOf(x, y) + R + 1;
        for (let k = 0; k < 2; k++) { const sx = x * T + 3 + h3(x, y, k + 20) * 10, rw = 2.5 + h3(x, y, k) * 3, rh = 1.6 + h3(x, y, k + 1) * 2; c.fillStyle = lit(wall, -0.25); c.beginPath(); c.ellipse(sx, ey, rw, rh, 0, Math.PI, 0); c.fill(); c.fillStyle = rgba(lit(wall, 0.25), 0.5); c.fillRect(sx - rw * 0.6, ey - rh + 0.2, rw * 0.8, 0.6); }
      }
    }
  }

  /* ---------- Fels ---------- */
  const alphaStr = []; for (let i = 0; i <= 20; i++) alphaStr.push((i / 20).toFixed(2));
  /* Felsmuster als nahtlose Vorlage (Quader, Bruchstein oder Höhlenfacetten) */
  function rockBase(c, st, X, Y, w, h, det) {
    const tl = B.tile;
    setCR(X, Y, w, h);
    c.fillStyle = lit(tl.dark, -0.05); c.fillRect(X, Y, w, h);
    if (st.rock === "cave") {
      const cols = PAL.rockCols, gw = 12, gh = 8, KX = WRAP ? WRAP.w / gw : 0, KY = WRAP ? WRAP.h / gh : 0;
      const P = (i, j) => { const a = wk(i, KX), b = wk(j, KY); return [i * gw + (hash(a + 77, b * 3 + 1) - 0.5) * 7, j * gh + (hash(b * 5 + 3, a + 77) - 0.5) * 5]; };
      for (let j = Math.floor(Y / gh) - 1; j * gh < Y + h + gh; j++) for (let i = Math.floor(X / gw) - 1; i * gw < X + w + gw; i++) {
        const a = P(i, j), b = P(i + 1, j), e = P(i + 1, j + 1), f = P(i, j + 1), vv = hash(wk(i, KX) * 19 + 3, wk(j, KY) * 29 + 7);
        c.fillStyle = cols[(vv * cols.length) | 0]; c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.lineTo(e[0], e[1]); c.lineTo(f[0], f[1]); c.closePath(); c.fill();
        c.strokeStyle = PAL.rHi; c.lineWidth = 0.7; c.beginPath(); c.moveTo(f[0], f[1]); c.lineTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke();
        c.strokeStyle = PAL.rLo; c.lineWidth = 0.8; c.beginPath(); c.moveTo(b[0], b[1]); c.lineTo(e[0], e[1]); c.lineTo(f[0], f[1]); c.stroke();
        if (det >= 1 && vv > 0.9) { c.fillStyle = "rgba(0,0,0,.3)"; c.fillRect(a[0] + 3, a[1] + 3, 1.5, 1); }
      }
    } else if (st.rock === "rubble") {
      const KX = WRAP ? WRAP.w / 12 : 0, KY = WRAP ? WRAP.h / 8 : 0;
      for (let j = Math.floor(Y / 8) - 1; j * 8 < Y + h + 8; j++) { const off = (j & 1) * 6, jj = wk(j, KY); for (let i = Math.floor((X - off) / 12) - 1; i * 12 + off < X + w + 12; i++) {
        const bx = k => k * 12 + off + (hash(wk(k, KX) * 5 + 2, jj * 3 + 9) - 0.5) * 4, x0 = bx(i) + 0.6, x1 = bx(i + 1) - 0.6, vv = hash(wk(i, KX) * 7 + 1, jj * 11 + 4), y0 = j * 8 + 0.5 + vv * 0.8, y1 = j * 8 + 8 - 0.5 - ((vv * 5) % 1) * 0.8, ch = 2.2;
        c.fillStyle = PAL.rockCols[(vv * 5) | 0]; c.beginPath(); c.moveTo(x0 + ch, y0); c.lineTo(x1 - ch, y0); c.lineTo(x1, y0 + ch); c.lineTo(x1, y1 - ch); c.lineTo(x1 - ch, y1); c.lineTo(x0 + ch, y1); c.lineTo(x0, y1 - ch); c.lineTo(x0, y0 + ch); c.fill();
        c.fillStyle = PAL.rHi; c.fillRect(x0 + ch, y0, x1 - x0 - 2 * ch, 1.2); c.fillRect(x0, y0 + ch, 1, y1 - y0 - 2 * ch);
        c.fillStyle = PAL.rLo; c.fillRect(x0 + ch, y1 - 1.2, x1 - x0 - 2 * ch, 1.2); c.fillRect(x1 - 1, y0 + ch, 1, y1 - y0 - 2 * ch);
      } }
    } else {
      /* gehauene Quader mit kräftiger Fase: wirken plastischer als die flache Rückwand */
      masonry(c, { rowH: 8, bw: 16, off: 8, jit: 4, gap: 1, seed: 11, cols: PAL.rockCols, hi: PAL.rHi, hi2: PAL.rHi2, lo: PAL.rLo, extra: (g, x, y, ww, hh, v, k, r, o) => { g.fillStyle = PAL.rHi; fr(g, x, y + 1, ww - 1, 0.7); g.fillStyle = "rgba(0,0,0,.22)"; fr(g, x + 1, y + hh - 2, ww - 2, 1); if (det >= 1) chips(g, x, y, ww, hh, v, k, r, o); } });
    }
  }
  /* Kanten eines freiliegenden Felsens: helle Lauffläche, dunkle Unterseite, Seitenlicht, Kontur */
  function rockEdges(c, st, x, y, v, det) {
    const tl = B.tile, px = x * T, py = y * T;
    const aU = !sol(x, y - 1), aD = !sol(x, y + 1), aL = !sol(x - 1, y), aR = !sol(x + 1, y);
    setCR(px, py, T, T);
    if (aL) { c.fillStyle = "rgba(0,0,0,.55)"; c.fillRect(px, py, 1, T); c.fillStyle = rgba(lit(tl.light, -0.1), 0.9); c.fillRect(px + 1, py, 1.2, T); c.fillStyle = rgba(tl.light, 0.2); c.fillRect(px + 2.2, py, 2.5, T); }
    if (aR) { c.fillStyle = "rgba(0,0,0,.6)"; c.fillRect(px + T - 1, py, 1, T); c.fillStyle = rgba(lit(tl.dark, -0.2), 0.8); c.fillRect(px + T - 3, py, 2, T); }
    if (aD) { c.fillStyle = rgba(lit(tl.dark, -0.3), 0.95); c.fillRect(px, py + T - 3, T, 3); c.fillStyle = "rgba(0,0,0,.6)"; c.fillRect(px, py + T - 1, T, 1); c.fillStyle = "rgba(0,0,0,.2)"; c.fillRect(px, py + T - 6, T, 3); }
    if (aU) {
      c.fillStyle = G.topGrad; c.save(); c.translate(px, py); c.fillRect(0, 2, T, 8); c.restore();
      c.fillStyle = lit(tl.light, 0.14); c.fillRect(px, py, T, 1.2); c.fillStyle = tl.light; c.fillRect(px, py + 1.2, T, 1.4); c.fillStyle = lit(tl.light, -0.3); c.fillRect(px, py + 2.6, T, 1);
      if (aL) { c.fillStyle = lit(tl.light, 0.28); c.fillRect(px, py, 2.2, 1.2); c.fillStyle = "rgba(0,0,0,.5)"; c.fillRect(px, py, 0.8, 0.8); }
      if (aR) { c.fillStyle = rgba(lit(tl.light, -0.3), 0.9); c.fillRect(px + T - 2, py, 2, 3); }
    }
    if (!aU && !aL && !sol(x - 1, y - 1)) { c.fillStyle = rgba(tl.light, 0.5); c.fillRect(px, py, 1.5, 1.5); }
  }
  /* dunkle Kontur außen um den Fels (auch für Nachbarkacheln außerhalb des Chunks) */
  function rockContour(c, x, y) {
    const px = x * T, py = y * T;
    c.fillStyle = "rgba(0,0,0,.5)";
    if (!sol(x - 1, y)) c.fillRect(px - 2, py, 2, T);
    if (!sol(x + 1, y)) c.fillRect(px + T, py, 2, T);
    if (!sol(x, y + 1)) c.fillRect(px, py + T, T, 2);
    if (!sol(x, y - 1)) { c.fillStyle = "rgba(0,0,0,.4)"; c.fillRect(px, py - 1, T, 1); }
  }
  /* bröckelnde Wand (zerstörbar): auffällige Risse, helle Bruchkanten, loser Schutt */
  function crackedWall(c, x, y, px, py) {
    if (lv && lv.wuchtSet && lv.wuchtSet.has(y * lv.W + x)) return wuchtWall(c, x, y, px, py);
    c.fillStyle = "rgba(255,226,180,.06)"; c.fillRect(px, py, T, T);
    const r = hash(x * 3, y * 7);
    c.strokeStyle = "rgba(8,6,6,.9)"; c.lineWidth = 1.2; c.beginPath();
    c.moveTo(px + 2 + r * 3, py); c.lineTo(px + 6, py + 5 + r * 2); c.lineTo(px + 4, py + 10); c.lineTo(px + 8, py + T);
    c.moveTo(px + 6, py + 5 + r * 2); c.lineTo(px + 12, py + 4); c.lineTo(px + T, py + 6 + r * 3);
    c.moveTo(px + 4, py + 10); c.lineTo(px, py + 12);
    c.moveTo(px + 9, py + 12); c.lineTo(px + 13, py + 10); c.lineTo(px + 15, py + 14);
    c.stroke();
    c.strokeStyle = "rgba(255,226,180,.3)"; c.lineWidth = 0.5; c.beginPath(); c.moveTo(px + 3 + r * 3, py + 0.5); c.lineTo(px + 7, py + 5.5 + r * 2); c.lineTo(px + 13, py + 4.6); c.stroke();
    c.fillStyle = "rgba(0,0,0,.35)"; c.fillRect(px + 10, py + 7, 3, 2); c.fillRect(px + 3, py + 13, 2, 2);
  }
  /* R19: Wucht-Wand (welt.js cracks, lv.wuchtSet): abplatzender Putz, tiefes Rissnetz von einem Schlagpunkt aus,
     ausgebrochene Löcher, Bröckel am Fuß – klar „hier hilft nur ein schwerer Schlag“, anders als geheime rissige Wände */
  function wuchtWall(c, x, y, px, py) {
    const W = lv.W, has = (a, b) => lv.wuchtSet.has(b * W + a), r = hash(x * 7, y * 11);
    /* Putzflecken (hell, mit dunkler Abbruchkante) */
    for (let k = 0; k < 3; k++) { const fx = px + 1 + hash(x + k, y * 3) * 10, fy = py + 1 + hash(x * 5, y + k) * 10, fw = 3 + hash(k, x + y) * 4, fh = 2 + hash(y, k + x) * 3;
      c.fillStyle = "rgba(200,184,160,.22)"; c.fillRect(fx, fy, fw, fh); c.fillStyle = "rgba(0,0,0,.35)"; c.fillRect(fx, fy + fh, fw, 0.8); c.fillRect(fx + fw, fy, 0.8, fh); }
    /* Rissnetz: vom Mittelpunkt der Wucht-Gruppe aus strahlend, über Kachelgrenzen fortgesetzt */
    c.strokeStyle = "rgba(6,4,4,.95)"; c.lineWidth = 1.3; c.beginPath();
    const cx = px + 8 + (r - 0.5) * 4, cy = py + 8 + (hash(y, x) - 0.5) * 4;
    for (let k = 0; k < 5; k++) { const a = k * 1.256 + r * 2; let ax = cx, ay = cy; c.moveTo(ax, ay); for (let s2 = 0; s2 < 3; s2++) { ax += Math.cos(a + (hash(k, s2 + x) - 0.5) * 0.9) * 3.5; ay += Math.sin(a + (hash(s2, k + y) - 0.5) * 0.9) * 3.5; c.lineTo(ax, ay); } }
    c.stroke();
    c.strokeStyle = "rgba(255,230,190,.28)"; c.lineWidth = 0.5; c.beginPath(); c.arc(cx, cy, 4.5, r * 6, r * 6 + 2.2); c.stroke();
    /* Ausbruch: dunkles Loch mit hellen Kanten */
    c.fillStyle = "#0c0808"; c.beginPath(); c.moveTo(cx - 2.4, cy - 1); c.lineTo(cx, cy - 2.6); c.lineTo(cx + 2.6, cy - 0.4); c.lineTo(cx + 1, cy + 2.4); c.lineTo(cx - 2, cy + 1.6); c.fill();
    c.fillStyle = "rgba(255,230,190,.25)"; c.fillRect(cx - 2.4, cy - 1.4, 2, 0.6);
    /* Bröckel am Fuß, wenn darunter Boden ist */
    if (!solidV(lv.get(x, y + 1)) && solidV(lv.get(x, y + 2))) { c.fillStyle = "#4a4240"; for (let k = 0; k < 4; k++) { const bx = px + 2 + hash(x + k * 3, y) * 12, bs = 1.4 + hash(k, x) * 1.6; c.beginPath(); c.ellipse(bx, py + T + T - bs * 0.6, bs, bs * 0.7, 0, 0, 6.283); c.fill(); } }
    if (!has(x, y - 1) && !solidV(lv.get(x, y - 1))) { c.fillStyle = "rgba(0,0,0,.4)"; c.fillRect(px, py, T, 1.5); }
  }
  /* Lauflächen je Gebiet */
  const FLOW = ["#d8607a", "#e8c050", "#ece4d6", "#e08a3a", "#b0507a", "#f0d8a0"];
  const surf = (x, y) => sol(x, y) && !sol(x, y - 1);
  function topper(c, x, y, det) {
    const tl = B.tile, px = x * T, py = y * T, r = hash(x, y + 7), col = tl.topCol;
    switch (tl.top) {
      case "moss": {
        const dk = lit(col, -0.32), lt = lit(col, 0.22);
        c.fillStyle = dk; c.fillRect(px, py, T, 4);
        c.fillStyle = col; c.fillRect(px, py - 1, T, 3);
        for (let k = 0; k < 4; k++) { const hh = hash(x * 4 + k, y) * 2.4; c.fillRect(px + k * 4, py - 1 - hh, 4, hh + 1); }
        c.fillStyle = lt; for (let k = 0; k < 4; k++) if (hash(x * 4 + k, y + 3) < 0.55) c.fillRect(px + k * 4 + 1, py - 1 - hash(x * 4 + k, y) * 2.4, 2, 0.8);
        for (let k = 0; k < 6; k++) { const hb = hash(x * 6 + k, y + 1); if (hb < 0.5) { const bh = 2 + hb * 8; c.fillStyle = hb < 0.18 ? lt : hb < 0.36 ? col : dk; c.fillRect(px + k * 2.6 + 0.5, py - 1 - bh, 1, bh); } }
        c.fillStyle = dk; for (let k = 0; k < 3; k++) { const hm = hash(x * 3 + k, y + 9); if (hm < 0.45) c.fillRect(px + 2 + k * 5, py + 3, 1.4, 2 + hm * 8); }
        if (det >= 2) {
          if (r < 0.24) for (let f = 0; f < 1 + ((r * 13) | 0) % 2; f++) { const fx = px + 3 + h3(x, y, f) * 10, fh = 3 + h3(x, y, f + 3) * 4, fc = FLOW[(h3(x, y, f + 6) * FLOW.length) | 0]; c.fillStyle = dk; c.fillRect(fx, py - 1 - fh, 0.8, fh); c.fillStyle = fc; c.fillRect(fx - 1, py - 2 - fh, 0.9, 0.9); c.fillRect(fx + 0.9, py - 2 - fh, 0.9, 0.9); c.fillRect(fx - 0.05, py - 3 - fh, 0.9, 0.9); c.fillRect(fx - 0.05, py - 1.1 - fh, 0.9, 0.9); c.fillStyle = "#f8e080"; c.fillRect(fx, py - 2 - fh, 0.8, 0.8); }
          if (r > 0.95) { c.fillStyle = "#d8ccb0"; c.fillRect(px + 9, py - 4, 1, 3); D.ell(c, px + 9.5, py - 4.2, 2.4, 1.4, "#a0482a"); c.fillStyle = "#f0e0c0"; c.fillRect(px + 8.4, py - 4.8, 0.8, 0.6); }
        }
        break;
      }
      case "carpet": {
        const cL = surf(x - 1, y), cR = surf(x + 1, y);
        let run = 1; for (let k = 1; k <= 2; k++) { if (surf(x - k, y)) run++; else break; } for (let k = 1; k <= 2; k++) { if (surf(x + k, y)) run++; else break; }
        if (run < 3) { if (r < 0.3) { c.fillStyle = "rgba(0,0,0,.2)"; c.fillRect(px + 4, py + 0.5, 6, 1); } break; }
        const a = cL ? px : px + 3, b = cR ? px + T : px + T - 3;
        c.fillStyle = lit(col, -0.45); c.fillRect(a, py - 1, b - a, 3.5);
        c.fillStyle = col; c.fillRect(a, py - 2, b - a, 3);
        c.fillStyle = lit(col, 0.2); c.fillRect(a, py - 2, b - a, 0.7);
        c.fillStyle = "#c89a3c"; c.fillRect(a, py - 0.6, b - a, 0.6);
        c.fillStyle = "rgba(229,180,84,.7)"; for (let k = (x & 1) * 4; k < T; k += 8) if (px + k >= a && px + k + 2 <= b) { c.fillRect(px + k + 1, py - 1.6, 2, 0.7); c.fillRect(px + k + 1.6, py - 2, 0.8, 1.4); }
        c.fillStyle = "#d8c090";
        if (!cL) for (let k = 0; k < 3; k++) c.fillRect(a - 2.4, py - 1.8 + k * 1.1, 2.4, 0.5);
        if (!cR) for (let k = 0; k < 3; k++) c.fillRect(b, py - 1.8 + k * 1.1, 2.4, 0.5);
        break;
      }
      case "web": {
        c.fillStyle = "rgba(216,208,224,.16)"; c.fillRect(px, py - 0.5, T, 1.2);
        if (r < 0.45) { c.strokeStyle = "rgba(230,224,236,.45)"; c.lineWidth = 0.5; c.beginPath(); c.moveTo(px, py); c.quadraticCurveTo(px + 8, py - 5 - r * 6, px + 16, py); c.stroke(); c.beginPath(); c.moveTo(px + 4, py); c.lineTo(px + 7, py - 3 - r * 3); c.stroke(); }
        if (r > 0.9 && det >= 2) { D.ell(c, px + 8, py - 2.5, 3, 2.4, "#ddd6e2"); c.strokeStyle = "rgba(160,150,170,.6)"; c.lineWidth = 0.4; c.beginPath(); c.moveTo(px + 5.5, py - 3); c.lineTo(px + 10.5, py - 2); c.stroke(); }
        /* Eckweben, wo der Boden auf eine Wand trifft */
        if (det >= 1 && (sol(x - 1, y - 1) || sol(x + 1, y - 1)) && r > 0.3) { const left = sol(x - 1, y - 1), ox = left ? px : px + T, s = left ? 1 : -1; c.strokeStyle = "rgba(230,224,236,.35)"; c.lineWidth = 0.45; for (let k = 0; k <= 3; k++) { const an = k / 3 * Math.PI / 2; c.beginPath(); c.moveTo(ox, py); c.lineTo(ox + s * Math.cos(an) * 10, py - Math.sin(an) * 10); c.stroke(); } for (let rr = 3; rr < 10; rr += 3) { c.beginPath(); c.moveTo(ox + s * rr, py); c.quadraticCurveTo(ox + s * rr * 0.8, py - rr * 0.8, ox, py - rr); c.stroke(); } }
        break;
      }
      case "snow": {
        c.fillStyle = "#c8c0cc"; c.fillRect(px, py - 1, T, 4);
        c.fillStyle = "#eae6ee"; c.fillRect(px, py - 2, T, 3); for (let k = 0; k < 4; k++) { const hh = hash(x * 4 + k, y) * 2; c.fillRect(px + k * 4, py - 2 - hh, 4, hh + 1); }
        break;
      }
      case "soot": {
        c.fillStyle = col; c.fillRect(px, py - 1, T, 3.5);
        for (let k = 0; k < 4; k++) { const hh = hash(x * 4 + k, y) * 1.6; c.fillRect(px + k * 4, py - 1 - hh, 4, hh + 1); }
        if (det >= 1) {
          c.save(); c.globalCompositeOperation = "lighter";
          for (let k = 0; k < 3; k++) if (h3(x, y, k) < 0.4) { const ex = px + 2 + h3(x, y, k + 4) * 12; c.fillStyle = "rgba(255,110,30,.25)"; c.fillRect(ex - 1, py - 1.5, 3, 2); c.fillStyle = "rgba(255,180,90,.85)"; c.fillRect(ex, py - 1, 1, 1); }
          if (r < 0.25) { c.strokeStyle = "rgba(255,100,30,.35)"; c.lineWidth = 0.6; c.beginPath(); c.moveTo(px + 3 + r * 20, py + 3); c.lineTo(px + 6 + r * 20, py + 7); c.lineTo(px + 4 + r * 20, py + 11); c.stroke(); }
          c.restore();
        }
        break;
      }
      case "algae": {
        const dk = lit(col, -0.35);
        c.fillStyle = dk; c.fillRect(px, py, T, 3); c.fillStyle = col; c.fillRect(px, py - 1, T, 2);
        for (let k = 0; k < 4; k++) { const hm = hash(x * 4 + k, y + 5); if (hm < 0.6) { c.fillStyle = k % 2 ? dk : col; c.fillRect(px + 1 + k * 4, py + 1, 1.3, 3 + hm * 10); c.fillRect(px + 1.4 + k * 4, py + 3 + hm * 10, 0.8, 1.5); } }
        c.fillStyle = "rgba(200,255,210,.25)"; c.fillRect(px, py - 1, T, 0.6);
        if (det >= 2 && r < 0.2) { c.fillStyle = "#c87a8a"; c.fillRect(px + 5 + r * 30, py - 4, 1, 3); c.fillRect(px + 4 + r * 30, py - 4, 3, 1); }
        break;
      }
      case "rune": {
        c.fillStyle = "#6a5030"; c.fillRect(px, py, T, 1.4); c.fillStyle = "rgba(255,210,140,.35)"; c.fillRect(px, py, T, 0.5);
        if (r < 0.28) {
          c.save(); c.globalCompositeOperation = "lighter"; c.strokeStyle = rgba(col, 0.25); c.lineWidth = 2.4; runeGlyph(c, px + 8, py + 8, 3.5, r * 3.7 % 1); c.stroke();
          c.strokeStyle = rgba(col, 0.9); c.lineWidth = 0.8; runeGlyph(c, px + 8, py + 8, 3.5, r * 3.7 % 1); c.stroke(); c.restore();
        }
        break;
      }
      case "ash": {
        c.fillStyle = lit(col, -0.25); c.fillRect(px, py, T, 3); c.fillStyle = col; c.fillRect(px, py - 1, T, 2);
        for (let k = 0; k < 3; k++) { const hh = hash(x * 3 + k, y) * 2.2; c.fillStyle = k % 2 ? col : lit(col, 0.12); c.beginPath(); c.ellipse(px + 3 + k * 5, py - 0.5, 3, hh + 0.5, 0, Math.PI, 0); c.fill(); }
        if (det >= 2 && r < 0.15) { c.fillStyle = "#d8d0c0"; c.fillRect(px + 4, py - 1.6, 4, 0.9); c.fillRect(px + 3.6, py - 2, 0.9, 1.7); }
        break;
      }
      case "wood": {
        c.fillStyle = lit(col, -0.3); c.fillRect(px, py - 1, T, 4); c.fillStyle = col; c.fillRect(px, py - 1, T, 3);
        c.fillStyle = rgba(lit(col, 0.3), 0.7); c.fillRect(px, py - 1, T, 0.7);
        const sx = px + ((x * 5 + y * 3) % 2 ? 4 : 11); c.fillStyle = lit(col, -0.45); c.fillRect(sx, py - 1, 0.8, 3); c.fillStyle = "#1a120a"; c.fillRect(sx - 1.6, py, 0.8, 0.8); c.fillRect(sx + 1.6, py, 0.8, 0.8);
        c.fillStyle = "rgba(0,0,0,.18)"; c.fillRect(px, py + 0.6, T, 0.5);
        break;
      }
      case "slime": {
        if (r < 0.55) { c.fillStyle = col; c.fillRect(px, py - 0.5, T, 2); c.fillRect(px + 3 + r * 12, py, 1.6, 3 + r * 9); D.circ(c, px + 3.8 + r * 12, py + 3 + r * 9, 1.1, col); c.fillStyle = "rgba(220,255,160,.3)"; c.fillRect(px + 2, py - 0.5, 5, 0.5); }
        break;
      }
      case "drip": {
        c.fillStyle = "rgba(200,220,200,.16)"; c.fillRect(px, py, T, 0.8);
        if (r < 0.22) { D.ell(c, px + 8, py + 0.5, 5, 1, "rgba(10,14,12,.55)"); c.fillStyle = "rgba(220,235,225,.35)"; c.fillRect(px + 5, py, 3, 0.5); }
        if (r > 0.6 && r < 0.75) { c.fillStyle = col; c.fillRect(px + r * 16, py - 0.5, 4, 1.5); }
        break;
      }
      default: {
        if (r < 0.35) { c.fillStyle = rgba(lit(tl.light, 0.1), 0.7); c.fillRect(px + r * 40 % 13, py - 0.8, 1.6, 1); c.fillRect(px + (r * 90 % 12) + 2, py - 0.6, 1, 0.8); }
      }
    }
  }
  /* Unterseiten: Tropfsteine, Wurzeln, Tropfen, Zahnschnitt */
  function hanger(c, st, x, y, det) {
    const tl = B.tile, px = x * T, by = (y + 1) * T, r = h3(x, y, 9);
    if (st.rock === "cave") {
      if (r < 0.5) { const n = 1 + ((r * 7) | 0) % 2; for (let k = 0; k < n; k++) { const sx = px + 3 + h3(x, y, k + 1) * 10, ln = 4 + h3(x, y, k + 2) * 11, sw = 2 + h3(x, y, k + 3) * 2.5;
        c.fillStyle = mixH(tl.base, tl.dark, 0.45); c.beginPath(); c.moveTo(sx - sw, by - 1); c.lineTo(sx + sw, by - 1); c.lineTo(sx, by + ln); c.fill();
        c.fillStyle = rgba(tl.light, 0.45); c.beginPath(); c.moveTo(sx - sw, by - 1); c.lineTo(sx - sw * 0.3, by - 1); c.lineTo(sx, by + ln); c.fill();
        if (st.wet && det >= 2) { c.fillStyle = "rgba(200,240,220,.7)"; c.fillRect(sx - 0.4, by + ln, 0.9, 1.2); } } }
      return;
    }
    if (st.dentil && isWall(x, y + 1)) { c.fillStyle = "rgba(0,0,0,.35)"; c.fillRect(px, by + 4, T, 2); c.fillStyle = PAL.stone; c.fillRect(px, by, T, 2.4); c.fillStyle = PAL.stoneLo; for (let k = 0; k < T; k += 4) c.fillRect(px + k + 0.5, by + 2.4, 2.4, 2.2); c.fillStyle = PAL.stoneHi; c.fillRect(px, by + 2, T, 0.5); return; }
    if (tl.top === "moss" || st.moss) {
      if (r < 0.45) { c.strokeStyle = r < 0.2 ? "#3a4a24" : "#4a3a26"; c.lineWidth = 0.7; c.beginPath(); for (let k = 0; k < 3; k++) { const sx = px + 2 + h3(x, y, k + 4) * 12, ln = 3 + h3(x, y, k + 7) * 9; c.moveTo(sx, by - 1); c.quadraticCurveTo(sx + 1.5, by + ln * 0.5, sx + (k - 1), by + ln); } c.stroke(); }
      return;
    }
    if (st.slime || tl.top === "slime" || tl.top === "drip" || st.wet) {
      if (r < 0.35) { const sx = px + 3 + r * 28; c.fillStyle = st.slime ? rgba(tl.topCol, 0.85) : "rgba(150,170,160,.5)"; c.fillRect(sx, by - 1, 1.2, 2 + r * 8); c.beginPath(); c.arc(sx + 0.6, by + 1 + r * 8, 1, 0, TAU); c.fill(); }
      return;
    }
    if (det >= 2 && r < 0.08) { c.fillStyle = "rgba(0,0,0,.45)"; c.fillRect(px + 6, by - 1, 4, 2); }
  }

  /* ---------- Stege, Treppen, Leitern, Stacheln ---------- */
  function fixtures(c, x0, y0, x1, y1, det) {
    const get = lv.get, pl = B.plat;
    const plD = lit(pl, -0.35), plL = lit(pl, 0.22), plS = lit(pl, -0.5);
    for (let y = y0; y <= y1; y++) for (let x = x0; x < x1; x++) {
      const v = get(x, y), px = x * T, py = y * T;
      if (v === 2 || v === 8) {
        const L = !(get(x - 1, y) === 2 || get(x - 1, y) === 8), R = !(get(x + 1, y) === 2 || get(x + 1, y) === 8);
        if (B.webPlat) {
          c.strokeStyle = "rgba(0,0,0,.3)"; c.lineWidth = 1.6; c.beginPath(); c.moveTo(px, py + 2.5); c.quadraticCurveTo(px + 8, py + 4.5, px + 16, py + 2.5); c.stroke();
          c.strokeStyle = "rgba(236,230,242,.9)"; c.lineWidth = 1.3; c.beginPath(); c.moveTo(px, py + 1); c.quadraticCurveTo(px + 8, py + 3, px + 16, py + 1); c.stroke();
          c.strokeStyle = "rgba(230,224,236,.55)"; c.lineWidth = 0.5; c.beginPath(); c.moveTo(px, py + 2.6); c.quadraticCurveTo(px + 8, py + 4.6, px + 16, py + 2.6); c.moveTo(px + 2, py + 1); c.lineTo(px + 6, py + 7); c.moveTo(px + 12, py + 1); c.lineTo(px + 9, py + 7); c.moveTo(px + 6, py + 7); c.lineTo(px + 9, py + 7); c.stroke();
          if (det >= 2) { c.fillStyle = "rgba(255,250,255,.8)"; c.fillRect(px + 4 + hash(x, y) * 8, py + 1.6, 0.8, 0.8); }
          continue;
        }
        if (v === 8) {
          /* Steinstufe */
          c.fillStyle = "rgba(0,0,0,.3)"; c.fillRect(px, py + 6, T, 2);
          c.fillStyle = mixH(B.tile.base, B.tile.dark, 0.2); c.fillRect(px, py, T, 6);
          c.fillStyle = B.tile.light; c.fillRect(px, py, T, 1.2); c.fillStyle = "rgba(0,0,0,.4)"; c.fillRect(px, py + 5, T, 1); if (L) c.fillRect(px, py, 1, 6); c.fillRect(px + 8 + ((x & 1) ? -4 : 3), py + 1.2, 0.8, 4);
          continue;
        }
        /* Holzsteg: zwei Bohlen, Maserung, Nägel, Konsolen */
        c.fillStyle = "rgba(0,0,0,.28)"; c.fillRect(px, py + 5, T, 2.5);
        c.fillStyle = plD; c.fillRect(px, py, T, 5);
        c.fillStyle = pl; c.fillRect(px, py, T, 3.6);
        c.fillStyle = plL; c.fillRect(px, py, T, 0.9);
        c.fillStyle = rgba(plS, 0.5); c.fillRect(px, py + 2, T, 0.5);
        if (det >= 1) { c.fillStyle = rgba(plS, 0.35); const g1 = hash(x * 3, y) * 8; c.fillRect(px + g1, py + 1.3, 5, 0.4); c.fillRect(px + 16 - g1 - 4, py + 3, 4, 0.4); }
        const sx = px + 4 + ((hash(x, y * 3) * 8) | 0);
        c.fillStyle = plS; c.fillRect(sx, py, 0.9, 5);
        c.fillStyle = "#1a1410"; c.fillRect(sx - 1.8, py + 1.4, 0.9, 0.9); c.fillRect(sx + 1.8, py + 1.4, 0.9, 0.9);
        for (const s of [1, -1]) {
          if (s > 0 ? !L : !R) continue;
          const ex = s > 0 ? px : px + T;
          c.fillStyle = plS; c.fillRect(s > 0 ? px : px + T - 1.2, py, 1.2, 5);
          const wallSide = sol(x - s, y) || sol(x - s, y + 1);
          if (wallSide) {
            /* eiserne Winkelkonsole an der Wand */
            c.fillStyle = "#2a2624"; c.fillRect(s > 0 ? px : px + T - 1.6, py + 5, 1.6, 8);
            c.strokeStyle = "#2a2624"; c.lineWidth = 1.3; c.beginPath(); c.moveTo(ex + s * 0.8, py + 12); c.lineTo(ex + s * 8, py + 5); c.stroke();
            c.fillStyle = "#5a5450"; c.fillRect(s > 0 ? px + 0.3 : px + T - 1.3, py + 7, 1, 1); c.fillRect(s > 0 ? px + 0.3 : px + T - 1.3, py + 11, 1, 1);
          } else {
            /* hölzernes Kopfband */
            c.fillStyle = plD; c.beginPath(); c.moveTo(ex + s * 1, py + 5); c.lineTo(ex + s * 3, py + 5); c.lineTo(ex + s * 3, py + 11); c.lineTo(ex + s * 1, py + 11); c.fill();
            c.beginPath(); c.moveTo(ex + s * 3, py + 9); c.lineTo(ex + s * 9, py + 5); c.lineTo(ex + s * 7, py + 5); c.lineTo(ex + s * 3, py + 7.5); c.fill();
            if (B.bg === "harbour") { c.fillStyle = "#a08860"; c.fillRect(ex + s * 1 - (s < 0 ? 2.6 : 0), py + 0.6, 2.6, 0.7); c.fillRect(ex + s * 1 - (s < 0 ? 2.6 : 0), py + 2.2, 2.6, 0.7); c.fillRect(ex + s * 1 - (s < 0 ? 2.6 : 0), py + 3.8, 2.6, 0.7); }
          }
        }
      }
      if (v === 4) {
        const top = get(x, y - 1) !== 4;
        c.fillStyle = "rgba(0,0,0,.3)"; c.fillRect(px + 4.5, py, 1, T); c.fillRect(px + 13.5, py, 1, T);
        c.fillStyle = plD; c.fillRect(px + 2.5, py - (top ? 4 : 0), 2, T + (top ? 4 : 0)); c.fillRect(px + 11.5, py - (top ? 4 : 0), 2, T + (top ? 4 : 0));
        c.fillStyle = plL; c.fillRect(px + 2.5, py - (top ? 4 : 0), 0.6, T + (top ? 4 : 0)); c.fillRect(px + 11.5, py - (top ? 4 : 0), 0.6, T + (top ? 4 : 0));
        for (let k = 3; k < T; k += 5) {
          c.fillStyle = "rgba(0,0,0,.35)"; c.fillRect(px + 4.5, py + k + 1.6, 7, 0.8);
          c.fillStyle = pl; c.fillRect(px + 3.5, py + k, 9, 1.8); c.fillStyle = plL; c.fillRect(px + 3.5, py + k, 9, 0.5);
          if (det >= 1) { c.fillStyle = "#3a2a1a"; c.fillRect(px + 2.2, py + k - 0.4, 2.6, 0.7); c.fillRect(px + 11.2, py + k - 0.4, 2.6, 0.7); c.fillRect(px + 2.2, py + k + 1.5, 2.6, 0.7); c.fillRect(px + 11.2, py + k + 1.5, 2.6, 0.7); }
        }
      }
      if (v === 3) {
        c.fillStyle = "#2a2628"; c.fillRect(px, py + 12, T, 4); c.fillStyle = "#4a4448"; c.fillRect(px, py + 12, T, 1); c.fillStyle = "#6a6266"; c.fillRect(px + 2, py + 14, 1, 1); c.fillRect(px + 13, py + 14, 1, 1);
        for (let k = 0; k < 4; k++) {
          const sx = px + k * 4, hh = 9 + hash(x * 4 + k, y) * 2;
          c.fillStyle = "#5a5458"; c.beginPath(); c.moveTo(sx, py + 13); c.lineTo(sx + 2, py + 13 - hh); c.lineTo(sx + 4, py + 13); c.fill();
          c.fillStyle = "#9a9296"; c.beginPath(); c.moveTo(sx + 0.4, py + 13); c.lineTo(sx + 2, py + 13 - hh); c.lineTo(sx + 2, py + 13); c.fill();
          c.fillStyle = "#e0d8dc"; c.fillRect(sx + 1.6, py + 13 - hh, 0.8, 1.6);
          if (det >= 1 && hash(x * 4 + k, y + 2) < 0.18) { c.fillStyle = "rgba(110,40,20,.7)"; c.fillRect(sx + 1, py + 10, 2, 3); }
          if (det >= 2 && hash(x * 4 + k, y + 5) < 0.08) { c.fillStyle = "rgba(120,10,10,.7)"; c.fillRect(sx + 1.6, py + 13 - hh + 1.6, 0.8, 3); }
        }
      }
    }
  }

  /* ---------- Gesamter Chunk ---------- */
  let PT = null; G.profTiles = on => { if (!on) { PT = null; return; } const acc = G.tileProf = {}; let t0 = performance.now(); PT = k => { if (G._pc) G._pc.getImageData(0, 0, 1, 1); const n = performance.now(); acc[k] = (acc[k] || 0) + n - t0; t0 = n; }; };
  function paintTiles(c, x0, y0, w, h) {
    if (!PR || PR.W !== lv.W || PR.H !== lv.H) prep();
    const det = detail(), st = styleOf(), get = lv.get, W = lv.W;
    const x1 = Math.min(lv.W, x0 + w), y1 = Math.min(lv.H, y0 + h);
    G._pc = PT ? c : null;
    const tex = textures(st, det);
    PT && PT("tex");
    const lg = (ax, ay, bx, by, a0, a1) => { const g = c.createLinearGradient(ax, ay, bx, by); g.addColorStop(0, "rgba(0,0,0," + a0 + ")"); if (a1) g.addColorStop(0.4, "rgba(0,0,0," + a1 + ")"); g.addColorStop(1, "rgba(0,0,0,0)"); return g; };
    const GR = { top: lg(0, 0, 0, 16, 0.6, 0.25), left: lg(0, 0, 8, 0, 0.45), right: lg(T, 0, T - 8, 0, 0.45), bot: lg(0, T, 0, T - 6, 0.35),
      corner: (() => { const g = c.createRadialGradient(0, 0, 0, 0, 0, 8); g.addColorStop(0, "rgba(0,0,0,.4)"); g.addColorStop(1, "rgba(0,0,0,0)"); return g; })() };
    G.topGrad = (() => { const g = c.createLinearGradient(0, 2, 0, 10); g.addColorStop(0, rgba(B.tile.light, 0.38)); g.addColorStop(1, rgba(B.tile.light, 0)); return g; })();
    c.imageSmoothingEnabled = true;
    /* 1) Rückwand: Muster, Gesteinsschichten, Großflecken */
    tileTex(c, tex.wall, x0 * T, y0 * T, w * T, h * T);
    if (st.wall === "cave" && det >= 1) {
      const X = x0 * T, Y = y0 * T, ww = w * T, hh = h * T;
      c.strokeStyle = "rgba(0,0,0,.16)"; c.lineWidth = 2;
      for (let n = Math.floor(Y / 46); n * 46 < Y + hh + 46; n++) { c.beginPath(); for (let xx = X - 10; xx <= X + ww + 10; xx += 10) { const yy = n * 46 + (vnoise(xx / 60, n * 3.1) - 0.5) * 18; xx === X - 10 ? c.moveTo(xx, yy) : c.lineTo(xx, yy); } c.stroke(); }
    }
    PT && PT("base");
    /* 2) Wandschmuck, Schmutz, Kontaktschatten, Schleier */
    if (det >= 1) wallFeatures(c, st, x0, y0, x1, y1, det, GR); /* Handheld: schlichte Wände ohne Pfeiler/Nischen */
    PT && PT("feat");
    wallDirt(c, st, x0, y0, x1, y1, det);
    /* Zusatzschmuck aus pracht.js (nur ab Stufe 2, einmal je Chunk): Flickwerk, Patina, Ritzungen … */
    const HK = det >= 2 && G.tileHooks.length ? { c, x0, y0, x1, y1, det, st, lv, B, PR, PAL, sol, isWall, inLv, floorBelow, solidV, isPlatV, lit, mixH, rgba, hash, h3, vnoise, fr, setCR, masonry, chips, runeGlyph, T, D } : null;
    const hook = k => { if (HK) for (const f of G.tileHooks) try { f(k, HK); } catch (e) { console.error(e); } };
    hook("wall");
    PT && PT("dirt");
    wallAO(c, x0, y0, x1, y1, GR);
    /* 3) Himmel und Arenafenster freistellen */
    c.save(); c.globalCompositeOperation = "destination-out"; c.fillStyle = "#000";
    for (let y = y0; y < y1; y++) { let s = -1; for (let x = x0; x <= x1; x++) { const on = x < x1 && PR.clear[y * W + x]; if (on && s < 0) s = x; else if (!on && s >= 0) { c.fillRect(s * T, y * T, (x - s) * T, T); s = -1; } } }
    c.restore();
    PT && PT("ao");
    /* 4) Fenster und Gewölbeöffnungen mit Rahmen */
    openings(c, st, x0, y0, x1, y1, det);
    PT && PT("open");
    /* 5) Abgrund: Rückwand verliert sich in Schwärze */
    for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) {
      if (get(x, y) !== 9) continue;
      const px = x * T, py = y * T, top = get(x, y - 1) !== 9;
      if (top) { const g = c.createLinearGradient(0, py, 0, py + T); g.addColorStop(0, B.wall); g.addColorStop(1, "#060405"); c.fillStyle = g; c.fillRect(px, py, T, T); c.fillStyle = "rgba(0,0,0,.35)"; c.fillRect(px, py, T, 2); }
      else { c.fillStyle = "#060405"; c.fillRect(px, py, T, T); }
    }
    /* 6) Fels: Kontur (mit Rand), Muster in Läufen, Tiefenkarte, Kanten */
    const black = (x, y) => get(x, y - 1) === 9 || (get(x, y - 2) === 9 && solidV(get(x, y - 1))) || (get(x, y - 3) === 9 && solidV(get(x, y - 1)) && solidV(get(x, y - 2)));
    for (let y = y0 - 1; y <= y1; y++) for (let x = x0 - 1; x <= x1; x++) if (inLv(x, y) && sol(x, y) && PR.dep[y * W + x] === 1 && !(y === 0 && lv.out)) rockContour(c, x, y);
    /* Felsmuster: Läufe als Rechteck-Maske, dann die Vorlage pixelgenau hineinkopieren */
    c.save(); c.beginPath(); let anyRock = false;
    for (let y = y0; y < y1; y++) {
      let s = -1;
      for (let x = x0; x <= x1; x++) {
        const on = x < x1 && sol(x, y) && !(y === 0 && lv.out) && !black(x, y);
        if (on && s < 0) s = x; else if (!on && s >= 0) { c.rect(s * T, y * T, (x - s) * T, T); anyRock = true; s = -1; }
      }
    }
    if (anyRock) { c.clip(); tileTex(c, tex.rock, x0 * T, y0 * T, w * T, h * T); }
    c.restore();
    if (lv.out && y0 === 0) for (let x = x0; x < x1; x++) if (sol(x, 0)) c.clearRect(x * T, 0, T, T);
    c.imageSmoothingEnabled = false; drawMap(c, PR.depth, 4, x0, y0, w, h); c.imageSmoothingEnabled = true;
    for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) {
      if (!sol(x, y) || (y === 0 && lv.out)) continue;
      if (black(x, y)) { c.fillStyle = "#060405"; c.fillRect(x * T, y * T, T, T); continue; }
      const v = get(x, y), d = PR.dep[y * W + x];
      if (d === 1) rockEdges(c, st, x, y, v, det);
      else if (d >= 4 && det >= 1) { const r = hash(x, y); if (r < 0.12) { c.fillStyle = "rgba(255,240,220,.03)"; c.fillRect(x * T + (r * 80) % 10, y * T + 3, 6, 4); } else if (r > 0.93) { c.fillStyle = "rgba(0,0,0,.14)"; c.fillRect(x * T + 2, y * T + (r * 100) % 12, 9, 1); c.fillRect(x * T + 10, y * T + (r * 100) % 12, 1, 4); } }
      if (v === 7) crackedWall(c, x, y, x * T, y * T);
    }
    PT && PT("rock");
    hook("rock");
    /* Laufflächen (auch eine Reihe unterhalb, damit Gras über die Chunkgrenze ragt) und Unterseiten */
    for (let y = y0; y <= y1; y++) for (let x = x0 - 1; x <= x1; x++) if (inLv(x, y) && sol(x, y) && !sol(x, y - 1) && !(y === 0 && lv.out) && get(x, y - 1) !== 9) topper(c, x, y, det);
    if (det >= 1) for (let y = y0 - 1; y < y1; y++) for (let x = x0; x < x1; x++) if (inLv(x, y) && sol(x, y) && !sol(x, y + 1) && lv.get(x, y + 1) !== 9 && !PR.clear[(y + 1) * W + x]) hanger(c, st, x, y, det);
    PT && PT("top");
    /* 7) Stege, Leitern, Stacheln */
    fixtures(c, x0, y0, x1, y1, det);
    hook("fix");
    PT && PT("fix");
    if (PT) { c.getImageData(0, 0, 1, 1); PT("raster"); }
  }
  function chunkCanvas(cx, cy) {
    const key = cx + "," + cy;
    let ch = G.chunks.get(key);
    if (ch) { G.chunks.delete(key); G.chunks.set(key, ch); return ch; }
    const s = chunkScale(), cw = Math.ceil(CH_W * T * s), chh = Math.ceil(CH_H * T * s);
    let cv = null;
    if (G.chunks.size > (chunkDevOK() ? 16 : 20)) { const k0 = G.chunks.keys().next().value, old = G.chunks.get(k0); G.chunks.delete(k0); if (old && !old.dev && old.cv.width === cw && old.cv.height === chh) cv = old.cv; }
    if (!cv) { cv = document.createElement("canvas"); cv.width = cw; cv.height = chh; }
    const c = cv.getContext("2d"); c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1; c.globalCompositeOperation = "source-over"; c.clearRect(0, 0, cw, chh); c.scale(s, s); c.translate(-cx * CH_W * T, -cy * CH_H * T);
    try { paintTiles(c, cx * CH_W, cy * CH_H, CH_W, CH_H); } catch (e) { console.error(e); }
    ch = { cv }; G.chunks.set(key, ch); return ch;
  }
  /* Chunks in Bildschirmauflösung (ab Stufe „Hoch“): Ein Chunk wird mit 3× gemalt und bisher jedes Bild auf den
     Bildmaßstab (z. B. 3,6×) vergrößert – das kostet in Software-Darstellung rund 5 ms je Vollbild. Jetzt wird er
     einmal (höchstens einer je Bild) genau auf das Bildschirmpixelraster vergrößert – dieselbe bilineare
     Vergrößerung, ausgerichtet auf die ganzzahligen Bildschirmpixel der Welt – und danach pixelgenau kopiert.
     Danach braucht es nur noch die vergrößerte Fassung (die kleine wird freigegeben). */
  const chunkDevOK = () => lq() >= 2 && G.scale > chunkScale() + 0.01 && G.scale <= 4.6;
  let chDevFrame = -1, chDevMade = 0;
  function chunkDev(ch, cx, cy, S) {
    if (chDevFrame !== G.frame) { chDevFrame = G.frame; chDevMade = 0; }
    if (chDevMade >= 1) return null;
    chDevMade++;
    const s = chunkScale();
    const wx = cx * CH_W * T * S, wy = cy * CH_H * T * S, gx = Math.round(wx), gy = Math.round(wy);
    const w = Math.round((cx + 1) * CH_W * T * S) - gx, h = Math.round((cy + 1) * CH_H * T * S) - gy;
    const d = document.createElement("canvas"); d.width = w; d.height = h; const g = d.getContext("2d");
    g.imageSmoothingEnabled = true; g.setTransform(S / s, 0, 0, S / s, wx - gx, wy - gy); g.drawImage(ch.cv, 0, 0);
    ch.cv = d; ch.dev = { S, gx, gy };
    return ch.dev;
  }
  function drawTiles(c, cam) {
    const det = detail(); if (G.det !== det) { G.det = det; G.chunks.clear(); }
    const S = G.scale, m = c.getTransform(), ex = Math.round(m.e), ey = Math.round(m.f);
    /* pixelgenau nur bei reiner, ganzzahlig verschobener Skalierung mit dem Bildmaßstab (sonst wie bisher) */
    const aligned = !m.b && !m.c && Math.abs(m.a - S) < 1e-6 && Math.abs(m.d - S) < 1e-6 && Math.abs(m.e - ex) < 0.01 && Math.abs(m.f - ey) < 0.01, devOK = aligned && chunkDevOK();
    const cx0 = Math.floor(cam.x / (CH_W * T)), cx1 = Math.floor((cam.x + cam.w) / (CH_W * T));
    const cy0 = Math.floor(cam.y / (CH_H * T)), cy1 = Math.floor((cam.y + cam.h) / (CH_H * T));
    let built = 0;
    for (let cy = cy0; cy <= cy1; cy++) for (let cx = cx0; cx <= cx1; cx++) {
      if (cx < 0 || cy < 0 || cx * CH_W >= lv.W || cy * CH_H >= lv.H) continue;
      if (!G.chunks.has(cx + "," + cy)) built++;
      const ch = chunkCanvas(cx, cy), dv = ch.dev || (devOK ? chunkDev(ch, cx, cy, S) : null);
      if (dv && aligned && dv.S === S) { c.setTransform(1, 0, 0, 1, 0, 0); c.drawImage(ch.cv, dv.gx + ex, dv.gy + ey); c.setTransform(m); }
      else if (dv) c.drawImage(ch.cv, dv.gx / dv.S, dv.gy / dv.S, ch.cv.width / dv.S, ch.cv.height / dv.S);
      else c.drawImage(ch.cv, cx * CH_W * T, cy * CH_H * T, CH_W * T, CH_H * T);
    }
    /* vorausschauend: höchstens einen Nachbar-Chunk pro Bild vorbereiten (in Blickrichtung zuerst) */
    if (!built) {
      const dx = Z.player ? Math.sign(Z.player.vx || 0) : 0, dy = Z.player ? Math.sign(Z.player.vy || 0) : 0;
      const cand = [];
      const ccx = Math.floor((cam.x + cam.w / 2) / (CH_W * T)), ccy = Math.floor((cam.y + cam.h / 2) / (CH_H * T));
      for (let yy = cy0 - 1; yy <= cy1 + 1; yy++) for (let xx = cx0 - 1; xx <= cx1 + 1; xx++) {
        if (xx < 0 || yy < 0 || xx * CH_W >= lv.W || yy * CH_H >= lv.H || G.chunks.has(xx + "," + yy)) continue;
        cand.push([Math.abs(xx - ccx - dx) + Math.abs(yy - ccy - dy), xx, yy]);
      }
      if (cand.length) { cand.sort((a, b) => a[0] - b[0]); chunkCanvas(cand[0][1], cand[0][2]); }
    }
  }
  /* Flüssigkeiten leben: jedes Bild neu */
  /* sichtbare Lava-Oberflächen als waagerechte Läufe [x0, x1, y] (für das farbige Licht dieses Bildes) */
  G.lava = []; G.lavaN = 0;
  function drawLiquids(c, cam, t) {
    const x0 = Math.max(0, Math.floor(cam.x / T) - 3), x1 = Math.min(lv.W - 1, Math.ceil((cam.x + cam.w) / T) + 3);
    const y0 = Math.max(0, Math.floor(cam.y / T) - 3), y1 = Math.min(lv.H - 1, Math.ceil((cam.y + cam.h) / T) + 3);
    const LA = G.lava; let ln = 0, run = -1;
    const wRich = lq() >= 2 && !(Z.gq && Z.gq.lean) && !(G.off && G.off.wasser);
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const v = lv.get(x, y); if (v !== 5 && v !== 6) { run = -1; continue; }
      const px = x * T, py = y * T, top = lv.get(x, y - 1) !== v;
      if (v === 5 && top) { if (run >= 0 && LA[run + 1] === x - 1 && LA[run + 2] === y) LA[run + 1] = x; else { run = ln; LA[ln++] = x; LA[ln++] = x; LA[ln++] = y; } } else run = -1;
      /* Rand (außerhalb des Bildes) nur fürs Licht zählen, nicht zeichnen */
      if (px + T < cam.x || px > cam.x + cam.w || py + T < cam.y || py > cam.y + cam.h) continue;
      if (v === 5) {
        if (!G.lavaG) { G.lavaG = c.createLinearGradient(0, 0, 0, T); G.lavaG.addColorStop(0, "#ffb040"); G.lavaG.addColorStop(0.3, "#ff6a1a"); G.lavaG.addColorStop(1, "#8a1a08"); }
        /* Verlauf einmal anlegen und verschieben statt je Kachel und Bild neu */
        /* R19: oben heller Verlauf mit durchgehender Welle; darunter dunkle, glühende Masse mit treibenden Krusten statt
           Kachel für Kachel neu beginnendem Verlauf (sah gestreift und flach aus) */
        const lw = xw => 4 + Math.sin(t * 2.4 + xw * 0.07) * 1.1 + Math.sin(t * 1.3 - xw * 0.13) * 0.5;
        if (top) { c.save(); c.translate(0, py); c.fillStyle = G.lavaG; c.beginPath(); c.moveTo(px, lw(px)); c.lineTo(px + 8, lw(px + 8)); c.lineTo(px + T, lw(px + T)); c.lineTo(px + T, T); c.lineTo(px, T); c.closePath(); c.fill(); c.restore(); }
        else { c.fillStyle = "#8a1a08"; c.fillRect(px, py, T, T); }
        if (wRich || (Z.gq && Z.gq.level >= 1)) {
          const u = (t * 0.06 + hash(x, y) * 3) % 1, cx = px + ((hash(x * 3, y) * T + t * 2.5) % T);
          c.fillStyle = top ? "rgba(90,20,8,.55)" : "rgba(50,10,6,.5)"; c.beginPath(); c.ellipse(cx, py + (top ? 9 : 7) + Math.sin(t + x) * 1.2, 4 + 2 * Math.sin(u * 6.28), 1.6, 0, 0, 6.283); c.fill();
          c.fillStyle = "rgba(255,150,40," + (0.25 + 0.2 * Math.sin(t * 3 + x * 1.7 + y)).toFixed(3) + ")"; c.fillRect(px + ((hash(x, y * 5) * 12) | 0), py + (top ? 11 : 4 + ((hash(y, x) * 8) | 0)), 3, 1);
        }
        if (top) { c.fillStyle = "#ffe0a0"; c.beginPath(); c.moveTo(px, py + lw(px)); c.lineTo(px + 8, py + lw(px + 8)); c.lineTo(px + T, py + lw(px + T)); c.lineTo(px + T, py + lw(px + T) + 1); c.lineTo(px, py + lw(px) + 1); c.fill(); if (Math.random() < 0.02) FX.p({ x: px + Math.random() * T, y: py + 4, vx: 0, vy: -60 - Math.random() * 40, g: 200, life: 0.6, size: 1.6, col: "#ffb040", kind: "spark", add: true }); }
      } else if (wRich) {
        /* Wasser (ab Stufe 2): durchgehende sanfte Wellen über Kachelgrenzen, Tiefe dunkelt ab, Lichtflirren und
           Spiegelungen auf der Oberfläche, Lichtbänder darunter. Farbe grün-türkis, nie Blau. */
        const lake = B.bg === "lake";
        if (top) {
          const wy = xw => py + 5 + Math.sin(t * 1.9 + xw * 0.045) * 1.1 + Math.sin(t * 1.3 - xw * 0.11) * 0.55;
          const y0w = wy(px), y1w = wy(px + 4), y2w = wy(px + 8), y3w = wy(px + 12), y4w = wy(px + T);
          c.fillStyle = lake ? "rgba(18,48,38,.86)" : "rgba(26,44,40,.82)";
          c.beginPath(); c.moveTo(px, y0w); c.lineTo(px + 4, y1w); c.lineTo(px + 8, y2w); c.lineTo(px + 12, y3w); c.lineTo(px + T, y4w); c.lineTo(px + T, py + T); c.lineTo(px, py + T); c.closePath(); c.fill();
          /* Lichtband knapp unter der Oberfläche */
          c.fillStyle = lake ? "rgba(150,220,180,.08)" : "rgba(220,220,180,.07)"; c.fillRect(px, y2w + 3 + Math.sin(t * 1.1 + x) * 1.2, T, 2.2);
          /* Schaumkante */
          c.strokeStyle = lake ? "rgba(200,236,214,.42)" : "rgba(226,232,214,.4)"; c.lineWidth = 0.9; c.beginPath(); c.moveTo(px, y0w); c.lineTo(px + 4, y1w); c.lineTo(px + 8, y2w); c.lineTo(px + 12, y3w); c.lineTo(px + T, y4w); c.stroke();
          /* Glitzer: kurze helle Striche, die auf den Wellen kommen und gehen */
          for (let k = 0; k < 2; k++) { const h0 = hash(x * 3 + k, y), a = Math.sin(t * (2.2 + h0) + h0 * 40); if (a < 0.35) continue; const gx = px + ((h0 * 13 + t * (k ? 3 : -2)) % 14 + 14) % 14, gyy = wy(gx) + 1.5 + k * 2.2; c.fillStyle = lake ? "rgba(214,250,226," + ((a - 0.35) * 0.9).toFixed(2) + ")" : "rgba(255,238,200," + ((a - 0.35) * 0.9).toFixed(2) + ")"; c.fillRect(gx, gyy, 2 + h0 * 3, 0.7); }
          if (Math.random() < 0.01) FX.p({ x: px + Math.random() * T, y: y2w, vx: 0, vy: -10, life: 0.8, size: 1.5, col: "#c0e0d0", kind: "bubble" });
        } else {
          let d = 1; while (d < 4 && lv.get(x, y - d) === v) d++;
          c.fillStyle = lake ? "rgba(18,48,38,.86)" : "rgba(26,44,40,.82)"; c.fillRect(px, py, T, T);
          c.fillStyle = "rgba(0,0,0," + (0.08 * d).toFixed(2) + ")"; c.fillRect(px, py, T, T);
          /* schwache Lichtbänder (Kaustik) in der Tiefe */
          if (d < 3) { const cy = py + 6 + Math.sin(t * 0.9 + x * 0.6 + y) * 4; c.fillStyle = lake ? "rgba(150,220,180,.05)" : "rgba(220,220,180,.045)"; c.fillRect(px, cy, T, 1.4); }
        }
      } else {
        c.fillStyle = B.hazard === "water" && B.bg === "lake" ? "rgba(20,50,40,.85)" : "rgba(26,44,40,.8)"; const ty = top ? 5 + Math.sin(t * 2 + x * 0.7) * 1.2 : 0;
        c.fillRect(px, py + ty, T, T - ty);
        if (top) { c.fillStyle = "rgba(200,230,210,.35)"; c.fillRect(px, py + ty, T, 1); if (Math.random() < 0.01) FX.p({ x: px + Math.random() * T, y: py + ty, vx: 0, vy: -10, life: 0.8, size: 1.5, col: "#c0e0d0", kind: "bubble" }); }
      }
    }
    G.lavaN = ln;
  }

  /* ======================= REQUISITEN ======================= */
  const DASH_KETTE = [1.6, 0.9], DASH_NONE = [];
  function drawDecor(c, cam, t, front) {
    const miniD = !!(Z.gq && Z.gq.mini);
    for (const d of lv.decor) {
      const px = d.x * T + 8, py = d.y * T + 16;
      if (px < cam.x - 60 || px > cam.x + cam.w + 60 || py < cam.y - 60 || py > cam.y + cam.h + 80) continue;
      const fl = Math.sin(t * 9 + d.x) * 0.5 + Math.sin(t * 13 + d.y) * 0.5;
      if (FANCY[d.kind] && fancyOn()) { drawFancy(c, d, px, py, t); continue; }
      /* Handheld minimal (Runde 15): Ketten und Banner als schlichte Formen statt Glied für Glied */
      if (miniD && (d.kind === "chain" || d.kind === "banner")) {
        if (d.kind === "chain") { const len = 32 + (d.s || 0) * 20, sw = Math.sin(t * 1.1 + d.x) * 2; c.strokeStyle = "#3a3430"; c.lineWidth = 1.4; c.beginPath(); c.moveTo(px, py - 16); c.lineTo(px + sw, py - 16 + len); c.stroke(); }
        else { const y = py - 31; c.fillStyle = "#3a2a1a"; c.fillRect(px - 7, y - 1, 14, 1.6); c.fillStyle = B.bg === "storm" ? "#2e3a24" : "#7a1a20"; c.beginPath(); c.moveTo(px - 5.5, y); c.lineTo(px + 5.5, y); c.lineTo(px + 5.5, y + 22); c.lineTo(px, y + 18); c.lineTo(px - 5.5, y + 22); c.fill(); }
        continue;
      }
      switch (d.kind) {
        case "torch": {
          /* Wandfackel: genietete Halterung, geschwungener Arm, umwickelter Schaft, Pechkopf */
          const y = py - 22;
          if (G.isOpen(d.x, d.y)) {
            /* ohne Wand dahinter (Himmel, Fenster, Arena): auf einer Stange, wenn Boden nah ist – sonst an einer Kette von der Decke */
            if (!d._mt || d._mt.pr !== PR) {
              const hard = yy => { const v = lv.get(d.x, yy); return v === 1 || v === 2 || v === 7; };
              let gy = d.y + 1; while (gy < lv.H && gy <= d.y + 3 && !hard(gy)) gy++;
              let cy = d.y - 1; while (cy > 0 && cy >= d.y - 10 && !hard(cy)) cy--;
              d._mt = { pr: PR, pole: gy <= d.y + 3 && hard(gy) ? gy * T : 0, chain: hard(cy) ? (cy + 1) * T : 0 };
            }
            const mt = d._mt;
            if (mt.pole) { c.fillStyle = "#2a1c12"; c.fillRect(px - 0.9, y + 2, 1.8, mt.pole - y - 2); c.fillStyle = "#4a3220"; c.fillRect(px - 0.9, y + 2, 0.6, mt.pole - y - 2); c.fillStyle = "#3a3430"; c.fillRect(px - 2.4, mt.pole - 3, 4.8, 3); c.fillRect(px - 1.6, y + 1, 3.2, 2); }
            else {
              const top = mt.chain || y - 40; c.strokeStyle = "#2a2522"; c.lineWidth = 0.8; c.setLineDash(DASH_KETTE); c.beginPath(); c.moveTo(px - 3, y + 3); c.lineTo(px, top); c.lineTo(px + 3, y + 3); c.stroke(); c.setLineDash(DASH_NONE);
              c.fillStyle = "#2a2420"; c.beginPath(); c.moveTo(px - 4, y + 1); c.lineTo(px + 4, y + 1); c.lineTo(px + 2.4, y + 4.5); c.lineTo(px - 2.4, y + 4.5); c.fill(); c.fillStyle = "#6a5a4a"; c.fillRect(px - 4, y + 1, 8, 0.6);
            }
            flame(c, px, y - 3, 1.05 + fl * 0.15, "#ff9a3a");
            if (Math.random() < 0.08) FX.p({ x: px, y: y - 8, vx: (Math.random() - 0.5) * 10 + (Z.windX || 0) * 0.3, vy: -30, life: 0.8, size: 1.2, col: "#ffb060", kind: "spark", add: true });
            break;
          }
          c.fillStyle = "#16120f"; c.fillRect(px - 2.8, y + 3, 5.6, 8.5); c.fillStyle = "#3a3430"; c.fillRect(px - 2.2, y + 3.5, 4.4, 7.5);
          c.fillStyle = "#6a625a"; c.fillRect(px - 1.4, y + 4.3, 0.9, 0.9); c.fillRect(px + 0.5, y + 9.3, 0.9, 0.9); c.fillStyle = "rgba(255,220,170,.25)"; c.fillRect(px - 2.2, y + 3.5, 4.4, 0.6);
          c.strokeStyle = "#221d1a"; c.lineWidth = 1.3; c.beginPath(); c.moveTo(px, y + 8); c.quadraticCurveTo(px + 3.5, y + 5, px + 0.6, y + 1.5); c.stroke();
          c.save(); c.translate(px, y + 3); c.rotate(-0.1);
          c.fillStyle = "#4a3220"; c.fillRect(-1.1, -4, 2.2, 8); c.fillStyle = "#6a4a2e"; c.fillRect(-1.1, -4, 0.7, 8);
          c.fillStyle = "#2a1c12"; c.fillRect(-1.3, -3.2, 2.6, 0.8); c.fillRect(-1.3, -1.2, 2.6, 0.8);
          c.fillStyle = "#5a4a3a"; c.fillRect(-2.3, -5.2, 4.6, 1.6); c.fillStyle = "#8a7a62"; c.fillRect(-2.3, -5.2, 4.6, 0.5);
          c.fillStyle = "#24160c"; c.beginPath(); c.ellipse(0, -5.6, 2, 1.5, 0, 0, 6.283); c.fill();
          c.restore();
          flame(c, px, y - 3, 1.05 + fl * 0.15, "#ff9a3a");
          if (Math.random() < 0.08) FX.p({ x: px, y: y - 8, vx: (Math.random() - 0.5) * 10 + (Z.windX || 0) * 0.3, vy: -30, life: 0.8, size: 1.2, col: "#ffb060", kind: "spark", add: true });
          break;
        }
        case "brazier": c.fillStyle = "#3a3434"; c.beginPath(); c.moveTo(px - 7, py - 10); c.lineTo(px + 7, py - 10); c.lineTo(px + 4, py - 4); c.lineTo(px - 4, py - 4); c.fill(); c.fillRect(px - 1, py - 4, 2, 4); c.fillRect(px - 4, py - 1, 8, 1); flame(c, px, py - 10, 1.4 + fl * 0.2, "#ff8a2a"); flame(c, px - 3, py - 10, 0.9, "#ff6a1a"); break;
        case "greenfire": c.fillStyle = "#2a2a2a"; c.fillRect(px - 5, py - 6, 10, 6); flame(c, px, py - 6, 1.3 + fl * 0.2, "#6aff7a"); break;
        case "candle": { /* Kerze im Messingschälchen mit Wachstropfen */
          FG = +d.gust || 0;
          D.ell(c, px, py - 0.8, 3.4, 1.1, "#6a4a1e"); c.fillStyle = "#a07a34"; c.fillRect(px - 3.4, py - 1.6, 6.8, 0.7);
          const hh = 6 + (d.s || 0.5) * 3; c.fillStyle = "#e8dcc0"; c.fillRect(px - 1.2, py - 1 - hh, 2.4, hh); c.fillStyle = "#fff4dc"; c.fillRect(px - 1.2, py - 1 - hh, 0.7, hh);
          c.fillStyle = "#d8ccb0"; c.fillRect(px + 0.6, py - hh + 0.5, 0.8, 2.5); c.fillRect(px - 1.6, py - 1 - hh * 0.4, 0.8, 1.6);
          c.fillStyle = "#2a1a10"; c.fillRect(px - 0.2, py - 2 - hh, 0.5, 1.2);
          flame(c, px, py - 1.8 - hh, 0.55, "#ffc060"); FG = 0; break; }
        case "candelabra": { /* dreiarmiger Leuchter mit Füßen, Knauf und Tropfschalen */
          FG = +d.gust || 0;
          const g1 = "#8a6a2a", g2 = "#c8a050";
          c.fillStyle = g1; c.beginPath(); c.moveTo(px - 5, py); c.lineTo(px + 5, py); c.lineTo(px + 1.2, py - 3); c.lineTo(px - 1.2, py - 3); c.fill();
          c.fillRect(px - 0.8, py - 18, 1.6, 16); D.ell(c, px, py - 8, 1.8, 1.2, g1); D.ell(c, px, py - 13, 1.4, 1, g1);
          c.strokeStyle = g1; c.lineWidth = 1.2; c.beginPath(); c.moveTo(px - 6, py - 22); c.quadraticCurveTo(px - 6, py - 16, px, py - 17); c.quadraticCurveTo(px + 6, py - 16, px + 6, py - 22); c.stroke();
          c.fillStyle = g2; c.fillRect(px - 0.8, py - 18, 0.5, 15);
          for (const o of [-6, 0, 6]) { const top = o ? py - 22 : py - 24; c.fillStyle = g1; c.fillRect(px + o - 2, top, 4, 1.2); c.fillStyle = "#e8dcc0"; c.fillRect(px + o - 0.9, top - 4, 1.8, 4); c.fillStyle = "#fff4dc"; c.fillRect(px + o - 0.9, top - 4, 0.5, 4); flame(c, px + o, top - 4, 0.45, "#ffc060"); }
          FG = 0; break; }
        case "chandelier": { /* eiserner Radleuchter an drei Ketten */
          const sw = Math.sin(t * 0.8 + d.x) * 1.5 + Math.sin(+d.swing || 0) * 12, cy = py + 8 - Math.abs(+d.swing || 0) * 3; FG = +d.gust || 0;
          c.strokeStyle = "#2a2218"; c.lineWidth = 0.6; c.setLineDash([1.4, 0.8]); c.beginPath(); c.moveTo(px, py - 16); c.lineTo(px + sw, cy - 8); c.moveTo(px + sw, cy - 8); c.lineTo(px + sw - 10, cy); c.moveTo(px + sw, cy - 8); c.lineTo(px + sw + 10, cy); c.moveTo(px + sw, cy - 8); c.lineTo(px + sw, cy); c.stroke(); c.setLineDash(DASH_NONE);
          D.circ(c, px + sw, cy - 8, 1.2, "#5a4a2a");
          c.fillStyle = "#3a2a14"; c.beginPath(); c.ellipse(px + sw, cy + 1, 11, 2.2, 0, 0, 6.283); c.fill(); c.fillStyle = "#6a5020"; c.beginPath(); c.ellipse(px + sw, cy, 11, 1.8, 0, 0, 6.283); c.fill(); c.fillStyle = "#2a1c0e"; c.beginPath(); c.ellipse(px + sw, cy, 8.5, 1, 0, 0, 6.283); c.fill();
          c.fillStyle = "#6a5020"; for (const k of [-1, 1]) { c.beginPath(); c.moveTo(px + sw + k * 9, cy + 1.5); c.quadraticCurveTo(px + sw + k * 10, cy + 5, px + sw + k * 7, cy + 5.5); c.lineTo(px + sw + k * 7.5, cy + 4.5); c.quadraticCurveTo(px + sw + k * 9, cy + 4, px + sw + k * 8, cy + 1.5); c.fill(); }
          for (let k = -2; k <= 2; k++) { const kx = px + k * 4.5 + sw; c.fillStyle = "#e8dcc0"; c.fillRect(kx - 0.7, cy - 4, 1.4, 4); flame(c, kx, cy - 4, 0.42, "#ffc060"); }
          FG = 0; break; }
        case "lantern": { /* Laterne mit Dach, Gitterstäben und glimmendem Docht */
          const sw = Math.sin(t * 1.4 + d.x) * 2 + Math.sin(+d.swing || 0) * 14, lx = px + sw, ly = py - 2 - Math.abs(+d.swing || 0) * 3, fl2 = 0.85 + 0.15 * Math.sin(t * 11 + d.x);
          c.strokeStyle = "#2a2420"; c.lineWidth = 0.6; c.beginPath(); c.moveTo(px, py - 16); c.lineTo(lx, ly - 2.5); c.stroke();
          c.strokeStyle = "#3a302a"; c.lineWidth = 0.8; c.beginPath(); c.arc(lx, ly - 3.2, 1.2, 0, 6.283); c.stroke();
          c.fillStyle = "rgba(255,190,100," + (0.85 * fl2).toFixed(2) + ")"; c.fillRect(lx - 2.6, ly + 0.5, 5.2, 6);
          c.fillStyle = "#fff0c0"; c.fillRect(lx - 0.7, ly + 2.5, 1.4, 2.4);
          c.fillStyle = "#2a221c"; c.beginPath(); c.moveTo(lx - 4, ly + 0.6); c.lineTo(lx, ly - 2.2); c.lineTo(lx + 4, ly + 0.6); c.fill();
          c.fillRect(lx - 3.4, ly + 0.4, 6.8, 1); c.fillRect(lx - 3.4, ly + 6.4, 6.8, 1.4); c.fillRect(lx - 3.4, ly + 0.4, 0.9, 7); c.fillRect(lx + 2.5, ly + 0.4, 0.9, 7); c.fillRect(lx - 0.35, ly + 0.4, 0.7, 7);
          c.fillStyle = "rgba(255,230,180,.35)"; c.fillRect(lx - 3.4, ly + 0.4, 6.8, 0.4);
          D.glow(c, lx, ly + 3.5, 18, "rgba(255,180,90,.4)"); break; }
        case "banner": { /* Wappenbanner: Stange mit Knäufen, Borte, Stickerei, Schwalbenschwanz und Quasten */
          /* d.swing (optional, Bogenmaß, etwa −0,6 … 0,6): Auslenkung durch einen Stoß – siehe Kopfkommentar „Schwingen“ */
          const w = 11, h = 24, y = py - 31, wind = (Z.windX || 0) / 20 + 1, a = +d.swing || 0;
          const col = B.bg === "spires" ? "#4a1a1a" : B.bg === "storm" ? "#2e3a24" : B.bg === "halls" ? "#8a1a22" : "#7a1a20";
          const sw = a ? k => a * 16 * (k / 4) * (k / 4) + Math.sin(t * 9 + k) * a * 2 * (k / 4) : () => 0;
          const lift = a ? k => -Math.abs(a) * 5 * (k / 4) * (k / 4) : () => 0;
          const sway = k => Math.sin(t * 2 + k * 0.8 + d.x) * (k / 4) * 2 * wind + sw(k);
          const pts = []; for (let k = 0; k <= 4; k++) pts.push([px + w / 2 + sway(k), y + (k / 4) * h + lift(k)]);
          const tipL = [px - w / 2 + Math.sin(t * 2 + d.x) * 2 * wind + sw(4), y + h + lift(4)], mid = [px + sway(3) * 0.5 + sw(3) * 0.5, y + h - 5 + lift(3)];
          const shape = () => { c.beginPath(); c.moveTo(px - w / 2, y); for (const q of pts) c.lineTo(q[0], q[1]); c.lineTo(mid[0], mid[1]); c.lineTo(tipL[0], tipL[1]); c.closePath(); };
          c.fillStyle = col; shape(); c.fill();
          /* Faltenschatten */
          c.save(); shape(); c.clip();
          c.fillStyle = "rgba(0,0,0,.22)"; for (let k = 0; k < 3; k++) { const fx = px - w / 2 + 2 + k * 3.6 + Math.sin(t * 2 + d.x + k) * 0.8 + sw(2) * 0.5; c.fillRect(fx, y, 1.3, h); }
          c.fillStyle = "rgba(255,220,200,.12)"; c.fillRect(px - w / 2, y, w, 1.2);
          /* Borte */
          c.strokeStyle = "#d8a84a"; c.lineWidth = 0.8; c.beginPath(); c.moveTo(px - w / 2 + 1.2, y + 1); c.lineTo(tipL[0] + 1.2, tipL[1] - 2); c.moveTo(pts[0][0] - 1.2, y + 1); for (let k = 1; k <= 3; k++) c.lineTo(pts[k][0] - 1.2, pts[k][1]); c.stroke();
          c.restore();
          /* Stickerei: Sonne mit Strahlen */
          const ex = px + sway(2) * 0.4 + sw(2) * 0.4, ey = y + 9.5 + lift(2);
          c.strokeStyle = "#e5b454"; c.lineWidth = 0.55; for (let k = 0; k < 12; k++) { const an = k / 12 * 6.283 + t * 0.05; c.beginPath(); c.moveTo(ex + Math.cos(an) * 2.6, ey + Math.sin(an) * 2.6); c.lineTo(ex + Math.cos(an) * (k % 2 ? 4 : 4.8), ey + Math.sin(an) * (k % 2 ? 4 : 4.8)); c.stroke(); }
          D.circ(c, ex, ey, 2.4, "#e5b454"); D.circ(c, ex - 0.5, ey - 0.5, 1, "#ffe0a0");
          c.fillStyle = "#d8a84a"; for (let k = 0; k < 3; k++) c.fillRect(ex - 2 + k * 2 - 0.4 + sw(3) * 0.3, y + 17 + lift(3), 0.8, 0.8);
          /* Stange mit Knäufen und Kordel */
          c.fillStyle = "#2a1c10"; c.fillRect(px - 8, y - 1.6, 16, 1.8); c.fillStyle = "#6a4a26"; c.fillRect(px - 8, y - 1.6, 16, 0.5);
          D.circ(c, px - 8.5, y - 0.7, 1.4, "#c8a050"); D.circ(c, px + 8.5, y - 0.7, 1.4, "#c8a050");
          c.strokeStyle = "#a07a34"; c.lineWidth = 0.5; c.beginPath(); c.moveTo(px - 7, y - 1); c.lineTo(px, y - 6); c.lineTo(px + 7, y - 1); c.stroke(); D.circ(c, px, y - 6.3, 0.8, "#3a2a1a");
          /* Quasten (pendeln bei Auslenkung mit) */
          for (const q of [tipL, pts[4]]) { c.fillStyle = "#d8a84a"; if (a) { c.save(); c.translate(q[0], q[1]); c.rotate(-a * 0.8); c.fillRect(-0.5, 0, 1, 1.6); c.beginPath(); c.moveTo(-1.2, 1.4); c.lineTo(1.2, 1.4); c.lineTo(0, 4); c.fill(); c.restore(); } else { c.fillRect(q[0] - 0.5, q[1], 1, 1.6); c.beginPath(); c.moveTo(q[0] - 1.2, q[1] + 1.4); c.lineTo(q[0] + 1.2, q[1] + 1.4); c.lineTo(q[0], q[1] + 4); c.fill(); } }
          break; }
        case "chain": { /* Kette aus einzelnen Gliedern, mit Deckenring und Haken; d.swing = Auslenkung (Bogenmaß) */
          const a = +d.swing || 0, sw = Math.sin(t * 1.1 + d.x) * 2, len = 32 + (d.s || 0) * 20, ox = Math.sin(a) * len, ex = px + sw * 1.4 + ox, ey = py - 16 + len * Math.cos(a);
          c.fillStyle = "#2a2522"; c.fillRect(px - 2.5, py - 16, 5, 1.6); c.strokeStyle = "#3a3430"; c.lineWidth = 0.9; c.beginPath(); c.arc(px, py - 13.6, 1.4, 0, 6.283); c.stroke();
          const n = Math.floor(len / 2.6), qx = px + sw + ox * 0.45, qy = py + 4 - (len - len * Math.cos(a)) * 0.5;
          for (let i = 1; i <= n; i++) {
            const u = i / n, ix = (1 - u) * (1 - u) * px + 2 * (1 - u) * u * qx + u * u * ex, iy = (1 - u) * (1 - u) * (py - 12) + 2 * (1 - u) * u * qy + u * u * ey;
            if (i % 2) { c.strokeStyle = "#4a4440"; c.lineWidth = 0.75; c.beginPath(); c.ellipse(ix, iy, 0.9, 1.6, sw * 0.04 - a * u, 0, 6.283); c.stroke(); c.fillStyle = "rgba(220,200,180,.35)"; c.fillRect(ix - 0.9, iy - 1, 0.4, 0.8); }
            else if (a) { c.save(); c.translate(ix, iy); c.rotate(-a * u); c.fillStyle = "#2e2a26"; c.fillRect(-0.35, -1.5, 0.7, 3); c.restore(); }
            else { c.fillStyle = "#2e2a26"; c.fillRect(ix - 0.35, iy - 1.5, 0.7, 3); }
          }
          if (a) { c.save(); c.translate(ex, ey); c.rotate(-a); }
          const hx = a ? 0 : ex, hy = a ? 0 : ey;
          if (d.s > 0.6) { c.strokeStyle = "#4a4440"; c.lineWidth = 1.5; c.beginPath(); c.arc(hx, hy + 4, 3, -0.4, 3.6); c.stroke(); c.strokeStyle = "rgba(220,200,180,.3)"; c.lineWidth = 0.5; c.beginPath(); c.arc(hx, hy + 4, 3, 2.4, 3.4); c.stroke(); }
          else if (d.s > 0.3) { c.strokeStyle = "#4a4440"; c.lineWidth = 1.3; c.beginPath(); c.moveTo(hx, hy); c.lineTo(hx, hy + 3); c.arc(hx - 2, hy + 3, 2, 0, Math.PI); c.stroke(); }
          if (a) c.restore();
          break; }
        case "cage": { const sw = Math.sin(t * 0.9 + d.x) * 0.08 + (+d.swing || 0); c.save(); c.translate(px, py - 16); c.rotate(sw); c.strokeStyle = "#3a3430"; c.lineWidth = 0.8; c.beginPath(); c.moveTo(0, 0); c.lineTo(0, 14); c.stroke(); c.lineWidth = 1; for (let k = -6; k <= 6; k += 3) { c.beginPath(); c.moveTo(k, 14); c.lineTo(k, 32); c.stroke(); } c.beginPath(); c.ellipse(0, 14, 7, 2, 0, 0, 6.283); c.stroke(); c.fillStyle = "#2a2420"; c.fillRect(-7, 31, 14, 2); if (d.s > 0.5) { D.circ(c, -1, 27, 2.4, "#c8c0b0"); c.fillStyle = "#c8c0b0"; c.fillRect(-1, 28, 1, 4); } c.restore(); break; }
        case "web": { c.strokeStyle = "rgba(230,224,240,.35)"; c.lineWidth = 0.5; const r = 14 + d.s * 10; const ox = px + (d.s < 0.5 ? -8 : 8), oy = py - 16; for (let k = 0; k < 5; k++) { const a = (d.s < 0.5 ? 0 : Math.PI / 2) + k / 4 * Math.PI / 2; c.beginPath(); c.moveTo(ox, oy); c.lineTo(ox + Math.cos(a) * r, oy + Math.sin(a) * r); c.stroke(); } for (let rr = 4; rr < r; rr += 4) { c.beginPath(); for (let k = 0; k <= 4; k++) { const a = (d.s < 0.5 ? 0 : Math.PI / 2) + k / 4 * Math.PI / 2; k ? c.lineTo(ox + Math.cos(a) * rr, oy + Math.sin(a) * rr) : c.moveTo(ox + Math.cos(a) * rr, oy + Math.sin(a) * rr); } c.stroke(); } break; }
        case "cocoon": { const sw = Math.sin(t * 0.7 + d.x) * 0.1; c.save(); c.translate(px, py - 16); c.rotate(sw); c.strokeStyle = "rgba(230,224,240,.6)"; c.lineWidth = 0.6; c.beginPath(); c.moveTo(0, 0); c.lineTo(0, 8); c.stroke(); D.ell(c, 0, 18, 5, 10, "#d8d0dc"); c.strokeStyle = "rgba(160,150,170,.6)"; for (let k = 0; k < 4; k++) { c.beginPath(); c.moveTo(-5, 12 + k * 4); c.lineTo(5, 14 + k * 4); c.stroke(); } c.restore(); break; }
        case "mushroom": { const g = 0.6 + 0.4 * Math.sin(t * 2 + d.x); const col = d.s < 0.5 ? "190,110,255" : "236,120,220"; /* lila und rosalila Leuchtpilze */ c.fillStyle = "#3a3040"; c.fillRect(px - 1, py - 6, 2, 6); D.ell(c, px, py - 7, 5, 3, "rgb(" + col + ")"); D.glow(c, px, py - 7, 14, "rgba(" + col + "," + 0.45 * g + ")"); if (d.s > 0.3) { c.fillStyle = "#3a3040"; c.fillRect(px + 5, py - 4, 1.4, 4); D.ell(c, px + 5.5, py - 4.5, 3, 2, "rgb(" + col + ")"); } break; }
        case "barrel": D.ell(c, px, py - 7, 6, 7.5, "#5a3a22"); c.fillStyle = "#3a2a1a"; c.fillRect(px - 6, py - 11, 12, 1.4); c.fillRect(px - 6, py - 4, 12, 1.4); c.fillStyle = "#7a5432"; c.fillRect(px - 2, py - 14, 4, 13); break;
        case "crate": c.fillStyle = "#6a4a2a"; c.fillRect(px - 7, py - 13, 14, 13); c.strokeStyle = "#4a3018"; c.lineWidth = 1; c.strokeRect(px - 6.5, py - 12.5, 13, 12); c.beginPath(); c.moveTo(px - 6, py - 12); c.lineTo(px + 6, py - 1); c.stroke(); break;
        case "pot": D.ell(c, px, py - 5, 4.5, 5, "#8a5a3a"); c.fillStyle = "#6a4028"; c.fillRect(px - 2.5, py - 11, 5, 2); break;
        case "sack": D.ell(c, px, py - 5, 6, 5, "#8a7a5a"); c.fillStyle = "#6a5a3a"; c.fillRect(px - 1.5, py - 11, 3, 3); break;
        case "bones": c.fillStyle = "#c8c0b0"; c.fillRect(px - 6, py - 2, 10, 1.6); c.fillRect(px - 2, py - 4, 1.6, 4); D.circ(c, px + 5, py - 3, 2.6, "#d8d0c0"); c.fillStyle = "#1a1010"; c.fillRect(px + 5, py - 4, 1, 1); break;
        case "skull": D.circ(c, px, py - 4, 3.5, "#d8d0c0"); c.fillStyle = "#1a1010"; c.fillRect(px - 1.8, py - 5, 1.4, 1.4); c.fillRect(px + 0.6, py - 5, 1.4, 1.4); break;
        case "statue": c.fillStyle = shade(B.tile.base, -0.1); c.fillRect(px - 7, py - 4, 14, 4); c.fillRect(px - 3, py - 26, 6, 22); D.circ(c, px, py - 29, 3.5, shade(B.tile.base, -0.1)); c.fillRect(px - 7, py - 22, 14, 3); break;
        case "statueKuo": c.fillStyle = "#2a3a34"; c.fillRect(px - 7, py - 4, 14, 4); D.ell(c, px, py - 14, 5, 9, "#2a3a34"); D.ell(c, px + 1, py - 25, 4, 3.5, "#2a3a34"); c.fillRect(px + 4, py - 38, 1.5, 30); break;
        case "statueDuergar": c.fillStyle = "#3a3438"; c.fillRect(px - 7, py - 4, 14, 4); c.fillRect(px - 5, py - 20, 10, 16); D.circ(c, px, py - 23, 4, "#3a3438"); c.fillRect(px - 3, py - 21, 6, 8); break;
        case "armor": c.fillStyle = "#4a4e58"; c.fillRect(px - 1, py - 26, 2, 26); c.fillRect(px - 5, py - 22, 10, 10); D.circ(c, px, py - 25, 3.4, "#5a5e68"); c.fillStyle = "#2a2a30"; c.fillRect(px - 0.5, py - 26, 2.5, 1); c.fillStyle = "#3a3e48"; c.fillRect(px - 4, py - 12, 3, 12); c.fillRect(px + 1, py - 12, 3, 12); break;
        case "table": c.fillStyle = "#5a3a22"; c.fillRect(px - 10, py - 9, 20, 2); c.fillRect(px - 9, py - 7, 2, 7); c.fillRect(px + 7, py - 7, 2, 7); c.fillStyle = "#c8a060"; c.fillRect(px - 5, py - 11, 3, 2); D.ell(c, px + 3, py - 10, 3, 1, "#a0a0a0"); break;
        case "painting": if (G.isOpen(d.x, d.y)) break; c.fillStyle = "#6a4a1a"; c.fillRect(px - 9, py - 30, 18, 14); c.fillStyle = shade(B.wall, -0.4); c.fillRect(px - 7.5, py - 28.5, 15, 11); D.circ(c, px, py - 24, 3, "#3a2a2a"); c.fillStyle = "#7a1a1a"; c.fillRect(px - 3, py - 21, 6, 3); break;
        case "window": { /* kleines Spitzbogenfenster mit Steinrahmen, Sprossen und Fensterbank */
          if (G.isOpen(d.x, d.y)) break;
          if (vistaOn()) { drawVistaWindow(c, d, px, py, t); break; }
          const y = py - 30, st0 = PAL ? PAL.stone : shade(B.wall, 0.1), sth = PAL ? PAL.stoneHi : shade(B.wall, 0.3);
          c.fillStyle = st0; c.beginPath(); c.moveTo(px - 7.5, y + 19); c.lineTo(px - 7.5, y + 4); c.quadraticCurveTo(px, y - 5.5, px + 7.5, y + 4); c.lineTo(px + 7.5, y + 19); c.fill();
          c.fillStyle = shade(B.wall, -0.55); c.beginPath(); c.moveTo(px - 5.5, y + 18); c.lineTo(px - 5.5, y + 4.5); c.quadraticCurveTo(px, y - 2.5, px + 5.5, y + 4.5); c.lineTo(px + 5.5, y + 18); c.fill();
          c.fillStyle = B.out ? "rgba(190,160,190,.32)" : "rgba(220,190,170,.2)"; c.beginPath(); c.moveTo(px - 4.6, y + 17.5); c.lineTo(px - 4.6, y + 5); c.quadraticCurveTo(px, y - 1.2, px + 4.6, y + 5); c.lineTo(px + 4.6, y + 17.5); c.fill();
          c.fillStyle = "rgba(255,240,220,.18)"; c.fillRect(px - 4.6, y + 5, 1.2, 12.5);
          c.fillStyle = shade(B.wall, -0.6); c.fillRect(px - 0.5, y - 1, 1, 19); c.fillRect(px - 4.6, y + 10, 9.2, 1);
          c.fillStyle = sth; c.fillRect(px - 7.5, y + 4, 0.8, 15);
          c.fillStyle = "rgba(0,0,0,.35)"; c.fillRect(px - 9, y + 21, 18, 2); c.fillStyle = st0; c.fillRect(px - 9, y + 18.5, 18, 2.6); c.fillStyle = sth; c.fillRect(px - 9, y + 18.5, 18, 0.7);
          c.save(); c.globalCompositeOperation = "lighter"; c.globalAlpha = 0.06; c.fillStyle = "#f0dcc8"; c.beginPath(); c.moveTo(px - 5, y + 4); c.lineTo(px + 5, y + 4); c.lineTo(px + 30, y + 60); c.lineTo(px + 14, y + 60); c.fill(); c.restore(); break; }
        case "rune": { /* violett glimmende Rune: Ring, Zeichen und ein langsam atmender Hof */
          if (G.isOpen(d.x, Math.floor((py - 26) / T))) break; /* R19: nie frei vor Fenster/Himmel */
          const g = 0.5 + 0.5 * Math.sin(t * 1.5 + d.x); c.save(); c.globalCompositeOperation = "lighter"; c.globalAlpha = 0.5 + g * 0.5; const y = py - 26;
          D.glow(c, px, y, 13, "rgba(170,90,255," + (0.24 * g).toFixed(3) + ")");
          /* R19: in eine Steintafel gehauen (vorher freischwebender Ring mit „A“), Zeichen je Ort verschieden */
          c.restore(); c.save();
          c.fillStyle = "#2a2226"; c.beginPath(); c.moveTo(px - 7, y + 8); c.lineTo(px - 7, y - 6); c.quadraticCurveTo(px, y - 11, px + 7, y - 6); c.lineTo(px + 7, y + 8); c.closePath(); c.fill();
          c.fillStyle = "rgba(255,230,210,.12)"; c.fillRect(px - 7, y - 6, 1, 14); c.fillStyle = "rgba(0,0,0,.4)"; c.fillRect(px + 6, y - 6, 1, 14); c.fillRect(px - 7, y + 7, 14, 1);
          c.globalCompositeOperation = "lighter"; c.globalAlpha = 0.55 + g * 0.45; c.strokeStyle = "#b47aff"; c.lineWidth = 1; c.lineCap = "round";
          const gv = (hash(d.x * 5, d.y * 3) * 5) | 0; c.beginPath();
          if (gv === 0) { c.moveTo(px, y + 5); c.lineTo(px, y - 5); c.moveTo(px, y - 4); c.lineTo(px + 3.5, y - 1.5); c.moveTo(px, y - 1); c.lineTo(px + 3.5, y + 1.5); }
          else if (gv === 1) { c.moveTo(px - 3, y + 5); c.lineTo(px - 3, y - 5); c.lineTo(px + 2, y - 2); c.lineTo(px - 3, y + 0.5); c.lineTo(px + 3, y + 5); }
          else if (gv === 2) { c.moveTo(px, y + 5); c.lineTo(px, y - 5); c.moveTo(px - 3.5, y - 4); c.lineTo(px, y - 0.5); c.lineTo(px + 3.5, y - 4); }
          else if (gv === 3) { c.moveTo(px - 3, y + 5); c.lineTo(px, y + 1.5); c.lineTo(px + 3, y + 5); c.moveTo(px, y + 1.5); c.lineTo(px - 3, y - 2); c.lineTo(px, y - 5); c.lineTo(px + 3, y - 2); c.lineTo(px, y + 1.5); }
          else { c.moveTo(px - 3, y - 5); c.lineTo(px + 3, y + 5); c.moveTo(px + 3, y - 5); c.lineTo(px - 3, y + 5); c.moveTo(px, y - 5); c.lineTo(px, y + 5); }
          c.stroke(); c.strokeStyle = "rgba(240,220,255,.6)"; c.lineWidth = 0.4; c.stroke();
          c.restore(); break; }
        case "pipe": if (G.isOpen(d.x, d.y)) break; c.fillStyle = "#3a3434"; c.fillRect(px - 2, py - 40, 4, 40); c.fillRect(px - 4, py - 20, 8, 3); if (Math.random() < 0.03) FX.p({ x: px, y: py - 40, vx: 0, vy: -20, life: 1.5, size: 4, col: "rgba(90,80,80,.6)", kind: "smoke" }); break;
        case "column": c.fillStyle = shade(B.wall, 0.08); c.fillRect(px - 5, py - 48, 10, 48); c.fillStyle = shade(B.wall, 0.2); c.fillRect(px - 5, py - 48, 2, 48); c.fillStyle = shade(B.wall, -0.1); c.fillRect(px - 7, py - 50, 14, 3); c.fillRect(px - 7, py - 3, 14, 3); break;
        case "bars": c.fillStyle = "rgba(10,10,10,.7)"; for (let k = -10; k <= 10; k += 4) c.fillRect(px + k, py - 34, 1.6, 34); c.fillRect(px - 11, py - 34, 23, 1.6); break;
        case "crenel": if (G.isOpen(d.x, d.y)) break; c.fillStyle = shade(B.wall, -0.15); for (let k = -16; k < 16; k += 8) c.fillRect(px + k, py - 10, 5, 10); break;
        case "shelf": if (G.isOpen(d.x, d.y)) break; c.fillStyle = "#5a3a22"; c.fillRect(px - 10, py - 22, 20, 1.6); c.fillRect(px - 10, py - 12, 20, 1.6); for (let k = 0; k < 5; k++) { c.fillStyle = ["#7a2a2a", "#2a5a3a", "#6a5a2a", "#4a3a5a", "#7a6a5a"][k]; c.fillRect(px - 9 + k * 4, py - 29 + (k % 2), 3, 7); } D.ell(c, px - 4, py - 15, 2.4, 2.8, "#5a8a5a"); D.ell(c, px + 3, py - 15, 2.4, 2.8, "#8a5a7a"); break;
        case "rack": c.fillStyle = "#4a3020"; c.fillRect(px - 10, py - 20, 2, 20); c.fillRect(px + 8, py - 20, 2, 20); c.fillRect(px - 10, py - 20, 20, 2); c.fillStyle = "#8a8288"; for (let k = -6; k <= 6; k += 4) c.fillRect(px + k, py - 18, 1, 10); break;
        case "weapons": c.fillStyle = "#4a3020"; c.fillRect(px - 9, py - 3, 18, 3); c.save(); c.translate(px - 4, py - 3); c.rotate(-1.7); Z.drawWeapon(c, "spear", "#a0a0a0", t); c.restore(); c.save(); c.translate(px + 2, py - 3); c.rotate(-1.4); Z.drawWeapon(c, "axe", "#a0a0a0", t); c.restore(); break;
        case "anvil": c.fillStyle = "#3a3a40"; c.fillRect(px - 3, py - 7, 6, 7); c.fillRect(px - 8, py - 11, 16, 4); c.beginPath(); c.moveTo(px + 8, py - 11); c.lineTo(px + 13, py - 10); c.lineTo(px + 8, py - 8); c.fill(); c.fillStyle = "#5a5a62"; c.fillRect(px - 8, py - 11, 16, 1); break;
        case "forge": c.fillStyle = "#2e2622"; c.fillRect(px - 12, py - 16, 24, 16); c.fillStyle = "#1a1210"; c.fillRect(px - 8, py - 12, 16, 7); { const g = 0.7 + 0.3 * Math.sin(t * 4 + d.x); c.fillStyle = "rgba(255," + (110 + g * 60 | 0) + ",30,1)"; c.fillRect(px - 7, py - 10, 14, 4); D.glow(c, px, py - 8, 28, "rgba(255,120,30," + 0.4 * g + ")"); } if (Math.random() < 0.15) FX.p({ x: px + (Math.random() - 0.5) * 12, y: py - 12, vx: (Math.random() - 0.5) * 30, vy: -60, life: 0.7, size: 1.4, col: "#ffb040", kind: "spark", add: true }); break;
        case "coral": c.strokeStyle = "#c87a8a"; c.lineWidth = 1.6; c.lineCap = "round"; c.beginPath(); c.moveTo(px, py); c.lineTo(px, py - 8); c.lineTo(px - 4, py - 13); c.moveTo(px, py - 8); c.lineTo(px + 4, py - 14); c.moveTo(px - 2, py - 10); c.lineTo(px - 5, py - 9); c.stroke(); break;
        case "shell": D.ell(c, px, py - 2.5, 4, 2.8, "#d8c8c0"); c.strokeStyle = "#a89890"; c.lineWidth = 0.5; for (let k = -2; k <= 2; k++) { c.beginPath(); c.moveTo(px, py); c.lineTo(px + k * 1.6, py - 5); c.stroke(); } break;
        case "net": c.strokeStyle = "rgba(160,140,110,.7)"; c.lineWidth = 0.5; for (let k = 0; k < 6; k++) { c.beginPath(); c.moveTo(px - 12 + k * 5, py - 16); c.quadraticCurveTo(px - 10 + k * 5, py, px - 14 + k * 5, py + 12); c.stroke(); c.beginPath(); c.moveTo(px - 13, py - 12 + k * 4); c.lineTo(px + 13, py - 13 + k * 4); c.stroke(); } break;
        case "rope": { const sw = Math.sin(t * 1.2 + d.x) * 2; c.strokeStyle = "#7a5a3a"; c.lineWidth = 1; c.beginPath(); c.moveTo(px, py - 16); c.quadraticCurveTo(px + sw, py + 10, px + sw * 1.5, py + 26); c.stroke(); break; }
        case "anchor": c.save(); c.translate(px, py - 2); c.strokeStyle = "#4a4440"; c.lineWidth = 2.2; c.beginPath(); c.moveTo(0, -18); c.lineTo(0, 0); c.moveTo(-5, -14); c.lineTo(5, -14); c.stroke(); c.beginPath(); c.arc(0, -6, 7, 0.3, Math.PI - 0.3); c.stroke(); c.restore(); break;
        case "mast": c.fillStyle = "#4a3422"; c.fillRect(px - 1.5, py - 60, 3, 60); c.fillRect(px - 14, py - 50, 28, 2); break;
        case "gear": { c.save(); c.translate(px, py - 4); c.rotate(t * (d.s < 0.5 ? 0.6 : -0.4)); c.fillStyle = "#3a3028"; const r = 8 + d.s * 6; c.beginPath(); c.arc(0, 0, r, 0, 6.283); c.fill(); c.fillStyle = shade(B.wall, -0.2); c.beginPath(); c.arc(0, 0, r * 0.4, 0, 6.283); c.fill(); c.fillStyle = "#3a3028"; for (let k = 0; k < 10; k++) { const a = k / 10 * 6.283; c.save(); c.rotate(a); c.fillRect(r - 1, -2, 4, 4); c.restore(); } c.restore(); break; }
        case "bell": { const sw = Math.sin(t * 1.5 + d.x) * 0.12; c.save(); c.translate(px, py - 16); c.rotate(sw); c.fillStyle = "#3a2a1a"; c.fillRect(-1, 0, 2, 6); c.fillStyle = "#8a6a2a"; c.beginPath(); c.moveTo(-4, 6); c.quadraticCurveTo(-4, 16, -9, 20); c.lineTo(9, 20); c.quadraticCurveTo(4, 16, 4, 6); c.fill(); c.fillStyle = "#c8a050"; c.fillRect(-9, 19, 18, 1.4); c.restore(); break; }
        case "beam": c.fillStyle = "#4a3422"; c.fillRect(px - 20, py - 16, 40, 4); c.fillRect(px - 2, py - 16, 4, 10); break;
        case "vine": { c.strokeStyle = "#3a5a2a"; c.lineWidth = 1.2; for (let k = 0; k < 3; k++) { c.beginPath(); c.moveTo(px - 6 + k * 6, py - 16); c.quadraticCurveTo(px - 6 + k * 6 + Math.sin(t + k) * 3, py, px - 4 + k * 6, py + 10 + k * 6); c.stroke(); } c.fillStyle = "#4a7a2a"; for (let k = 0; k < 5; k++) D.ell(c, px - 6 + k * 3, py - 6 + k * 3, 2, 1, "#4a7a2a", 0.6); break; }
        case "gargoyle": c.fillStyle = shade(B.tile.base, -0.2); c.fillRect(px - 6, py - 5, 12, 5); D.ell(c, px, py - 10, 5, 5, shade(B.tile.base, -0.2)); c.beginPath(); c.moveTo(px - 5, py - 13); c.lineTo(px - 9, py - 20); c.lineTo(px - 2, py - 14); c.moveTo(px + 5, py - 13); c.lineTo(px + 9, py - 20); c.lineTo(px + 2, py - 14); c.fill(); c.fillStyle = "rgba(255,80,40,.7)"; c.fillRect(px - 2, py - 11, 1.2, 1.2); c.fillRect(px + 1, py - 11, 1.2, 1.2); break;
        case "crystal": c.fillStyle = "#c86a3a"; c.beginPath(); c.moveTo(px - 4, py); c.lineTo(px - 2, py - 12); c.lineTo(px + 1, py); c.fill(); c.beginPath(); c.moveTo(px, py); c.lineTo(px + 3, py - 9); c.lineTo(px + 5, py); c.fill(); D.glow(c, px, py - 6, 14, "rgba(255,150,70,.35)"); break;
        case "hay": D.ell(c, px, py - 5, 9, 5, "#a08a40"); c.strokeStyle = "#c8b060"; c.lineWidth = 0.5; for (let k = 0; k < 6; k++) { c.beginPath(); c.moveTo(px - 8 + k * 3, py - 6); c.lineTo(px - 9 + k * 3, py - 11); c.stroke(); } break;
        case "cart": c.fillStyle = "#5a3a22"; c.fillRect(px - 14, py - 14, 26, 7); c.strokeStyle = "#3a2a1a"; c.lineWidth = 1.5; c.beginPath(); c.arc(px - 8, py - 5, 5, 0, 6.283); c.stroke(); c.beginPath(); c.arc(px + 6, py - 5, 5, 0, 6.283); c.stroke(); c.fillRect(px + 12, py - 12, 10, 1.5); break;
        case "tent": { const s = d.s || 1; c.fillStyle = "#5a4a3a"; c.beginPath(); c.moveTo(px - 28 * s, py); c.lineTo(px, py - 30 * s); c.lineTo(px + 28 * s, py); c.fill(); c.fillStyle = "#3a2e24"; c.beginPath(); c.moveTo(px - 6 * s, py); c.lineTo(px, py - 20 * s); c.lineTo(px + 6 * s, py); c.fill(); c.strokeStyle = "#7a6a5a"; c.lineWidth = 0.6; c.beginPath(); c.moveTo(px, py - 30 * s); c.lineTo(px, py - 36 * s); c.stroke(); break; }
      }
    }
  }
  /* ---------- Fensterausblick (Grafik-Runde 6, ab Stufe 2) ----------
     Die kleinen Wandfenster werden größer und zeigen einen echten Ausblick: Himmel in den Farben der Stunde, ferne
     Burgteile mit erleuchteten Fenstern, Hügel im Dunst, Mond oder Sterne, unter Tage eine Höhle mit fernen Lichtern.
     Davor ziehen Wolkenfetzen, ab und zu kreuzt ein Vogel. Das Bild ist je Gebiet/Stunde/Variante zwischengespeichert,
     je Bild kommt nur Wolke/Vogel dazu. Kein Blau. */
  const vistaOn = () => { const q = Z.gq; if (q && q.lean) return false; if (G.off && G.off.ausblick) return false; return lq() >= 2; };
  const VISTA = new Map(), VW = 18, VH = 27, VS = 4;
  const UNDER = { chasm: "#d090ff", lake: "#8af0b0", embercity: "#ff8a40" };
  const hx3 = h => { if (h.length === 4) h = "#" + h[1] + h[1] + h[2] + h[2] + h[3] + h[3]; const n = parseInt(h.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; };
  const mixC = (a, b, k) => { const A = hx3(a), Bc = hx3(b), h2 = i => ("0" + Math.round(A[i] + (Bc[i] - A[i]) * k).toString(16)).slice(-2); return "#" + h2(0) + h2(1) + h2(2); };
  function vistaSprite(bg, zt, v) {
    const key = bg + "|" + (zt ? zt.k : "-") + "|" + v; let cv = VISTA.get(key); if (cv) return cv;
    cv = document.createElement("canvas"); cv.width = VW * VS; cv.height = VH * VS; const g = cv.getContext("2d"), W = cv.width, H = cv.height;
    let s = (v * 7919 + bg.length * 131) | 0; const R = () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; };
    const under = UNDER[bg];
    const sky = under ? ["#0a0608", "#1a1014", "#2c1c1c"] : zt ? zt.H.sky : ["#1c1226", "#3e2c44", "#8a5a5a"];
    const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, sky[0]); gr.addColorStop(0.55, sky[1]); gr.addColorStop(1, sky[2]); g.fillStyle = gr; g.fillRect(0, 0, W, H);
    if (under) {
      /* Höhle: ferne Felsbögen, Leuchtpunkte, beim See ein heller Wasserfall */
      for (let k = 0; k < 3; k++) { g.fillStyle = mixC("#2c1c1c", "#000000", 0.3 + k * 0.22); g.beginPath(); const yb = H * (0.45 + k * 0.18); g.moveTo(0, H); g.lineTo(0, yb); for (let x = 0; x <= W; x += W / 6) g.lineTo(x, yb - R() * H * 0.12); g.lineTo(W, H); g.fill(); }
      g.globalCompositeOperation = "lighter"; for (let k = 0; k < 7; k++) { const x = R() * W, y = H * (0.4 + R() * 0.5), r = 2 + R() * 5; const rg = g.createRadialGradient(x, y, 0, x, y, r * 3); rg.addColorStop(0, under); rg.addColorStop(1, "rgba(0,0,0,0)"); g.globalAlpha = 0.5; g.fillStyle = rg; g.fillRect(x - r * 3, y - r * 3, r * 6, r * 6); } g.globalAlpha = 1;
      if (bg === "lake") { g.fillStyle = "rgba(200,236,214,.35)"; g.fillRect(W * (0.3 + v * 0.15), 0, W * 0.07, H * 0.8); }
      g.globalCompositeOperation = "source-over"; return VISTA.set(key, cv), cv;
    }
    /* Sterne */
    const night = !zt || zt.k === "nacht" || zt.k === "blut"; if (night) { g.fillStyle = "rgba(255,246,236,.8)"; for (let k = 0; k < 22; k++) { const r = R() < 0.15 ? 1.6 : 0.9; g.fillRect(R() * W, R() * H * 0.55, r, r); } }
    /* Mond bzw. tiefe Sonne */
    if (v === 0 || v === 2) { const mx = W * (0.25 + R() * 0.5), my = H * (0.12 + R() * 0.15), mr = W * 0.11, mc = zt ? zt.light : "#e8e0ec"; const rg = g.createRadialGradient(mx, my, 0, mx, my, mr * 4); rg.addColorStop(0, mc); rg.addColorStop(0.25, "rgba(255,240,220,.25)"); rg.addColorStop(1, "rgba(0,0,0,0)"); g.fillStyle = rg; g.fillRect(0, 0, W, H); g.fillStyle = mc; g.beginPath(); g.arc(mx, my, mr, 0, Math.PI * 2); g.fill(); }
    /* Hügel und ferne Burg, nach hinten heller (Luftperspektive) */
    const far = mixC(sky[2], sky[0], 0.45), mid = mixC(sky[1], "#000000", 0.55), near = mixC(sky[0], "#000000", 0.5), win = zt ? zt.win : "#ffb468";
    g.fillStyle = far; g.beginPath(); g.moveTo(0, H); g.lineTo(0, H * 0.62); for (let x = 0; x <= W; x += W / 5) g.lineTo(x, H * (0.56 + R() * 0.1)); g.lineTo(W, H); g.fill();
    if (bg === "harbour") { /* Meer mit Lichtpfad und einem Segel */ g.fillStyle = mixC("#1a2a24", sky[0], 0.4); g.fillRect(0, H * 0.7, W, H * 0.3); g.fillStyle = "rgba(255,230,190,.35)"; for (let k = 0; k < 8; k++) g.fillRect(W * 0.4 + (R() - 0.5) * W * 0.3, H * (0.72 + k * 0.035), 2 + R() * 6, 1); g.fillStyle = mid; g.beginPath(); g.moveTo(W * 0.15, H * 0.7); g.lineTo(W * 0.3, H * 0.52); g.lineTo(W * 0.32, H * 0.7); g.fill(); return VISTA.set(key, cv), cv; }
    g.fillStyle = mid;
    const bx = W * (0.15 + R() * 0.3);
    for (let k = 0; k < 4; k++) { const tw = W * (0.1 + R() * 0.1), tx = bx + k * W * 0.17 + (R() - 0.5) * 4, th = H * (0.18 + R() * 0.2), ty = H * 0.64 - th; g.fillRect(tx, ty, tw, th + H * 0.1); g.beginPath(); if (R() < 0.6) { g.moveTo(tx - 1, ty); g.lineTo(tx + tw / 2, ty - tw * 1.2); g.lineTo(tx + tw + 1, ty); } else { for (let j = 0; j < 3; j++) g.rect(tx + j * tw / 2.5, ty - 2.5, tw / 5, 2.5); } g.fill();
      g.fillStyle = win; for (let j = 0; j < 3; j++) if (R() < (zt ? zt.lit + 0.2 : 0.5)) g.fillRect(tx + tw * (0.3 + R() * 0.3), ty + th * (0.2 + j * 0.25), 1.6, 2.4); g.fillStyle = mid; }
    g.fillRect(bx - 4, H * 0.62, W * 0.7, H * 0.06);
    const hz = g.createLinearGradient(0, H * 0.5, 0, H * 0.8); hz.addColorStop(0, "rgba(0,0,0,0)"); hz.addColorStop(1, sky[2]); g.globalAlpha = 0.35; g.fillStyle = hz; g.fillRect(0, H * 0.5, W, H * 0.3); g.globalAlpha = 1;
    g.fillStyle = near; g.beginPath(); g.moveTo(0, H); g.lineTo(0, H * 0.8); for (let x = 0; x <= W; x += W / 4) g.lineTo(x, H * (0.76 + R() * 0.08)); g.lineTo(W, H); g.fill();
    if (bg === "castle" || bg === "ramparts" || bg === "camp" || bg === "storm") { g.fillStyle = mixC(sky[0], "#0a140a", 0.6); for (let k = 0; k < 5; k++) { const x = R() * W, y = H * (0.8 + R() * 0.05), r = W * (0.06 + R() * 0.05); g.beginPath(); g.arc(x, y, r, Math.PI, 0); g.fill(); } }
    VISTA.set(key, cv); return cv;
  }
  const archPath = (c, x0, x1, yTop, yArc, yB) => { c.beginPath(); c.moveTo(x0, yB); c.lineTo(x0, yArc); c.quadraticCurveTo((x0 + x1) / 2, yTop, x1, yArc); c.lineTo(x1, yB); c.closePath(); };
  function drawVistaWindow(c, d, px, py, t) {
    const y = py - 30, st0 = PAL ? PAL.stone : shade(B.wall, 0.1), sth = PAL ? PAL.stoneHi : shade(B.wall, 0.3), zt = Z.zeit ? Z.zeit() : null, v = (hash(d.x, d.y) * 3) | 0;
    /* Laibung (Schatten), Rahmen */
    c.fillStyle = "rgba(0,0,0,.35)"; archPath(c, px - 10.5, px + 12.5, y - 13, y + 1.5, y + 21); c.fill();
    c.fillStyle = st0; archPath(c, px - 11, px + 11, y - 14, y + 1, y + 19); c.fill();
    /* Ausblick */
    const gx0 = px - 8.6, gx1 = px + 8.6, gT = y - 8.5, gB = y + 17.6;
    c.save(); archPath(c, gx0, gx1, gT - 2.6, y + 2.2, gB); c.clip();
    c.drawImage(vistaSprite(B.bg, zt, v), gx0, gT - 1.4, gx1 - gx0, gB - gT + 1.4);
    const under = UNDER[B.bg], hv = hash(d.y, d.x);
    if (!under) {
      /* Wolkenfetzen ziehen vorbei */
      const cc = zt ? zt.H.sky[2] : "#c8a8a0";
      for (let k = 0; k < 2; k++) { const u = ((t * (1.1 + k * 0.6) + hv * 40 + k * 13) % 34) - 8; c.globalAlpha = 0.22; c.fillStyle = cc; c.beginPath(); c.ellipse(gx0 + u, gT + 4 + k * 5 + hv * 3, 4 + k * 2, 1.1, 0, 0, Math.PI * 2); c.ellipse(gx0 + u + 3, gT + 3.4 + k * 5 + hv * 3, 2.6, 1, 0, 0, Math.PI * 2); c.fill(); }
      c.globalAlpha = 1;
      /* ab und zu ein Vogel */
      const per = 9 + hv * 8, u = ((t + hv * 50) % per) / per;
      if (u < 0.3) { const bx = gx0 - 2 + (u / 0.3) * 22, by = gT + 7 + Math.sin(u * 30) * 0.8 + hv * 4, fl = Math.sin(t * 14) * 0.9; c.strokeStyle = "rgba(20,12,10,.8)"; c.lineWidth = 0.5; c.beginPath(); c.moveTo(bx - 1.6, by - fl); c.lineTo(bx, by); c.lineTo(bx + 1.6, by - fl); c.stroke(); }
    } else { /* unter Tage: ein ferner Funke steigt */ const u = ((t * 0.2 + hv) % 1); c.fillStyle = under; c.globalAlpha = 0.6 * Math.sin(u * Math.PI); c.fillRect(gx0 + 4 + hv * 9, gB - u * (gB - gT), 0.8, 0.8); c.globalAlpha = 1; }
    /* Rautenblei im Bogenfeld */
    c.strokeStyle = shade(B.wall, -0.6); c.lineWidth = 0.4; c.beginPath(); for (let k = -3; k <= 3; k++) { c.moveTo(px + k * 3.4, gT - 3); c.lineTo(px + k * 3.4 + 5, y + 2); c.moveTo(px + k * 3.4, gT - 3); c.lineTo(px + k * 3.4 - 5, y + 2); } c.stroke();
    /* Glas: leichter Schimmer und Spiegelung */
    c.fillStyle = "rgba(255,240,220,.07)"; c.fillRect(gx0, gT - 3, 3, gB - gT + 3);
    c.restore();
    /* Sprossen: Mittelpfosten, Querriegel, Rautenblei im Bogen */
    const mull = shade(B.wall, -0.6);
    c.fillStyle = mull; c.fillRect(px - 0.6, gT - 2, 1.2, gB - gT + 2); c.fillRect(gx0, y + 7, gx1 - gx0, 1.1);
    c.fillStyle = sth; c.fillRect(px - 11, y + 1, 0.8, 18);
    /* Bogensteine */
    c.strokeStyle = "rgba(0,0,0,.3)"; c.lineWidth = 0.5; c.beginPath(); for (let k = 1; k < 6; k++) { const a = Math.PI + k / 6 * Math.PI, rx = 11, ry = 15; c.moveTo(px + Math.cos(a) * rx * 0.78, y + 1 + Math.sin(a) * ry * 0.62); c.lineTo(px + Math.cos(a) * rx, y + 1 + Math.sin(a) * ry * 0.95); } c.stroke();
    /* Fensterbank */
    c.fillStyle = "rgba(0,0,0,.35)"; c.fillRect(px - 13, y + 21, 26, 2); c.fillStyle = st0; c.fillRect(px - 13, y + 18.5, 26, 2.8); c.fillStyle = sth; c.fillRect(px - 13, y + 18.5, 26, 0.7);
    if (hv < 0.3 && !UNDER[B.bg]) { /* Blumentopf oder Kerze auf der Bank */ if (hv < 0.15) { c.fillStyle = "#8a4a2a"; c.fillRect(px + 6, y + 15, 4, 3.5); c.fillStyle = "#4a6a2a"; c.beginPath(); c.arc(px + 8, y + 14, 2.4, 0, Math.PI * 2); c.fill(); c.fillStyle = "#d8607a"; c.fillRect(px + 7, y + 12.5, 1.2, 1.2); } else { c.fillStyle = "#e8dcc0"; c.fillRect(px - 9, y + 13.5, 1.6, 5); } }
    /* Lichtbahn in den Raum, in der Farbe der Stunde */
    c.save(); c.globalCompositeOperation = "lighter"; c.globalAlpha = 0.07; c.fillStyle = zt && !UNDER[B.bg] ? zt.win : "#f0dcc8"; c.beginPath(); c.moveTo(px - 8, y); c.lineTo(px + 8, y); c.lineTo(px + 40, y + 70); c.lineTo(px + 16, y + 70); c.fill(); c.restore();
  }
  /* ---------- Requisiten-Pracht (Grafik-Runde 8, ab Stufe 1) ----------
     Die alten Platzhalter-Requisiten (flache Rüstung, Statuen als Rechtecke, Tisch, Amboss, Waffenständer) werden als
     ausführlich gemalte Sprites (4-fach aufgelöst, einmal je Art/Variante/Gebiet) gezeichnet. Stufe 0 bleibt beim alten,
     billigen Bild. Kein Blau. */
  const fancyOn = () => { const q = Z.gq; if (q && q.lean) return false; if (G.off && G.off.requisiten) return false; return lq() >= 1; };
  const FSPR = new Map(), FS = 4;
  const lgr = (g, x0, y0, x1, y1, cols) => { const q = g.createLinearGradient(x0, y0, x1, y1); cols.forEach((cc, i) => q.addColorStop(i / (cols.length - 1), cc)); return q; };
  const poly2 = (g, col, pts) => { g.fillStyle = col; g.beginPath(); g.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 2) g.lineTo(pts[i], pts[i + 1]); g.closePath(); g.fill(); };
  const ell2 = (g, x, y, rx, ry, col) => { g.fillStyle = col; g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); g.fill(); };
  const ln2 = (g, col, w, pts) => { g.strokeStyle = col; g.lineWidth = w; g.beginPath(); g.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 2) g.lineTo(pts[i], pts[i + 1]); g.stroke(); };
  const STEEL = ["#c8c4bc", "#8e8a84", "#5a5650", "#2e2a28"];
  const FANCY = {
    /* Ritterrüstung auf dem Ständer: Schuhe, Beinschienen mit Kniebuckeln, Bauchreifen, gewölbter Brustpanzer mit Grat,
       geschobene Schulterstücke, hängende Arme mit Panzerhandschuhen, Helm mit Visier und Federbusch, Hellebarde */
    armor: { w: 30, h: 46, draw(g, v, B) {
      ln2(g, "#3a2a1a", 1.4, [0, -3, 0, -38]);
      g.fillStyle = "rgba(0,0,0,.35)"; g.beginPath(); g.ellipse(0, 0, 9, 1.4, 0, 0, Math.PI * 2); g.fill();
      poly2(g, "#4a3020", [-8, 0, 8, 0, 7, -3, -7, -3]); g.fillStyle = "#6a4a30"; g.fillRect(-7, -3, 14, 0.7);
      /* Hellebarde */
      const hx = 10.5; ln2(g, "#5a3a22", 1.1, [hx, -1, hx, -44]); poly2(g, lgr(g, hx, -42, hx + 6, -34, STEEL.slice(0, 3)), [hx + 0.4, -40.5, hx + 5.5, -42.5, hx + 6, -35.5, hx + 0.4, -35.5]); poly2(g, STEEL[1], [hx, -46, hx - 0.8, -40, hx + 0.8, -40]); poly2(g, STEEL[2], [hx - 0.4, -40, hx - 3.5, -38.5, hx - 0.4, -37.4]);
      for (const sd of [-1, 1]) {
        const lx = sd * 2.6;
        poly2(g, STEEL[2], [lx - 2.2, -0.5, lx + 2.4 + sd * 1.2, -0.5, lx + 1.6, -2.4, lx - 1.6, -2.6]);
        poly2(g, lgr(g, lx - 1.8, 0, lx + 1.8, 0, [STEEL[0], STEEL[1], STEEL[3]]), [lx - 1.7, -2.4, lx + 1.7, -2.4, lx + 1.9, -11.5, lx - 1.9, -11.5]);
        ell2(g, lx, -12.6, 2.2, 1.8, STEEL[1]); ell2(g, lx - 0.6, -13.1, 0.9, 0.6, "rgba(255,250,240,.6)");
        poly2(g, lgr(g, lx - 2, 0, lx + 2, 0, [STEEL[0], STEEL[1], STEEL[3]]), [lx - 2, -14, lx + 2, -14, lx + 2.2, -19, lx - 2.2, -19]);
      }
      for (let k = 0; k < 3; k++) poly2(g, k % 2 ? STEEL[2] : STEEL[1], [-6 + k * 0.3, -18.5 - k * 1.5, 6 - k * 0.3, -18.5 - k * 1.5, 5.6 - k * 0.3, -20.4 - k * 1.5, -5.6 + k * 0.3, -20.4 - k * 1.5]);
      g.fillStyle = v === 1 ? "#3a5a2a" : "#8a1f24"; g.fillRect(-6, -23.6, 12, 1.4);
      poly2(g, lgr(g, -6.5, 0, 6.5, 0, [STEEL[0], STEEL[1], STEEL[2], STEEL[3]]), [-6, -23.8, 6, -23.8, 6.8, -30, 4, -32, -4, -32, -6.8, -30]);
      ln2(g, "rgba(255,250,240,.55)", 0.5, [-0.4, -24, -0.4, -31.5]); ln2(g, "rgba(0,0,0,.35)", 0.4, [0.5, -24, 0.5, -31.5]); ln2(g, "rgba(255,250,240,.35)", 0.6, [-4.6, -25, -5.4, -30]);
      for (const sd of [-1, 1]) {
        for (let k = 0; k < 3; k++) { g.fillStyle = k === 0 ? STEEL[1] : k === 1 ? STEEL[2] : STEEL[1]; g.beginPath(); g.ellipse(sd * (7 - k * 0.3), -30.6 + k * 1.8, 3.6 - k * 0.5, 2.2, sd * 0.2, Math.PI, 0); g.fill(); }
        ell2(g, sd * 6.4 - 0.8, -31.6, 1.2, 0.5, "rgba(255,250,240,.6)");
        poly2(g, lgr(g, sd * 7.6 - 1.3, 0, sd * 7.6 + 1.3, 0, [STEEL[0], STEEL[2]]), [sd * 7.4 - 1.3, -27.8, sd * 7.4 + 1.3, -27.8, sd * 7.8 + 1.2, -19, sd * 7.8 - 1.2, -19]);
        ell2(g, sd * 7.8, -23.4, 1.6, 1.2, STEEL[1]); poly2(g, STEEL[2], [sd * 7.8 - 1.6, -19, sd * 7.8 + 1.6, -19, sd * 7.8 + 1.4, -16, sd * 7.8 - 1.2, -15.6]);
      }
      /* Helm */
      poly2(g, STEEL[2], [-3.6, -32, 3.6, -32, 3.2, -33.2, -3.2, -33.2]);
      g.fillStyle = lgr(g, -4, 0, 4, 0, [STEEL[0], STEEL[1], STEEL[3]]); g.beginPath(); g.moveTo(-3.8, -33); g.lineTo(-3.8, -38); g.quadraticCurveTo(-3.6, -42, 0, -42.4); g.quadraticCurveTo(3.6, -42, 3.8, -38); g.lineTo(3.8, -33); g.closePath(); g.fill();
      g.fillStyle = "#120c0c"; g.fillRect(-3.4, -38.4, 6.8, 0.9); for (let k = -2; k <= 2; k++) g.fillRect(k * 1.2 - 0.2, -36.2, 0.45, 1.4);
      ln2(g, "rgba(0,0,0,.4)", 0.4, [0, -42.2, 0, -33.2]); ln2(g, "rgba(255,250,240,.5)", 0.45, [-2.6, -41, -3, -35]);
      const pl = v === 1 ? "#d8c8a0" : v === 2 ? "#5a2a50" : "#8a1a20";
      g.fillStyle = pl; g.beginPath(); g.moveTo(0, -42.2); g.bezierCurveTo(2, -46.5, 6, -46.5, 8.5, -42.5); g.bezierCurveTo(6, -44, 3, -43.6, 0.8, -41.4); g.fill(); g.fillStyle = "rgba(255,255,255,.18)"; g.beginPath(); g.moveTo(1, -42.6); g.bezierCurveTo(3, -45.4, 5.4, -45.6, 7, -43.6); g.lineTo(1.6, -42.2); g.fill();
      g.fillStyle = "#b8923a"; g.fillRect(-0.5, -43.2, 1, 1.2);
    } },
    /* Steinstatue auf gestuftem Sockel: Ritter mit Schwert, Heilige mit Buch oder Engel mit Flügeln */
    statue: { w: 30, h: 48, draw(g, v, B) {
      const m = mixC(B.tile.base || "#6a6460", "#8a8478", 0.5), hi = mixC(m, "#ffffff", 0.28), lo = mixC(m, "#000000", 0.45), lo2 = mixC(m, "#000000", 0.25);
      g.fillStyle = "rgba(0,0,0,.35)"; g.beginPath(); g.ellipse(0, 0, 10, 1.5, 0, 0, Math.PI * 2); g.fill();
      poly2(g, lo2, [-9, 0, 9, 0, 9, -3, -9, -3]); poly2(g, m, [-8, -3, 8, -3, 7, -7, -7, -7]); poly2(g, hi, [-8.6, -7, 8.6, -7, 8.6, -8.2, -8.6, -8.2]); g.fillStyle = lo; g.fillRect(-8, -3.6, 16, 0.6);
      g.strokeStyle = lo; g.lineWidth = 0.4; g.strokeRect(-4, -6.4, 8, 2.6);
      if (v === 2) { for (const sd of [-1, 1]) { g.fillStyle = lgr(g, 0, -40, sd * 12, -20, [hi, m, lo2]); g.beginPath(); g.moveTo(sd * 2, -32); g.bezierCurveTo(sd * 10, -44, sd * 14, -36, sd * 12, -22); g.bezierCurveTo(sd * 9, -26, sd * 6, -22, sd * 3, -24); g.fill(); g.strokeStyle = lo; g.lineWidth = 0.3; for (let k = 0; k < 4; k++) { g.beginPath(); g.moveTo(sd * (4 + k * 2), -30 + k); g.lineTo(sd * (6 + k * 1.8), -23 - k * 0.5); g.stroke(); } } }
      /* Gewand */
      g.fillStyle = lgr(g, -6, 0, 6, 0, [hi, m, lo]); g.beginPath(); g.moveTo(-6, -8.2); g.quadraticCurveTo(-5.4, -20, -4.4, -30); g.lineTo(4.4, -30); g.quadraticCurveTo(5.4, -20, 6, -8.2); g.fill();
      g.strokeStyle = "rgba(0,0,0,.22)"; g.lineWidth = 0.4; for (let k = 0; k < 5; k++) { g.beginPath(); g.moveTo(-3.6 + k * 1.8, -28); g.quadraticCurveTo(-3.8 + k * 2 + (k % 2 ? 0.8 : -0.8), -18, -4.4 + k * 2.2, -8.4); g.stroke(); }
      for (const sd of [-1, 1]) ell2(g, sd * 4.6, -29, 2.2, 1.6, sd < 0 ? hi : lo2);
      /* Kopf */
      ell2(g, 0, -33.2, 2.9, 3.3, m); ell2(g, -0.9, -34, 1, 1.3, "rgba(255,255,255,.18)"); ell2(g, 0.8, -32.6, 1.6, 2.2, "rgba(0,0,0,.15)");
      if (v === 0) { /* Ritter: Helmkamm, Schwert vor sich, Hände auf dem Knauf */ poly2(g, lo2, [-3, -35.4, 3, -35.4, 2.4, -37, -2.4, -37]); g.fillStyle = lo; g.fillRect(-2, -33.6, 4, 0.6);
        g.fillStyle = lgr(g, -0.8, 0, 0.8, 0, [hi, lo]); g.fillRect(-0.8, -24, 1.6, 15); g.fillStyle = m; g.fillRect(-3.6, -24.6, 7.2, 1.4); ell2(g, 0, -26.2, 1.2, 1.2, hi); ell2(g, -1.6, -24.8, 1.8, 1.4, m); ell2(g, 1.6, -24.8, 1.8, 1.4, lo2); }
      else if (v === 1) { /* Heilige mit offenem Buch und Kapuze */ g.fillStyle = lo2; g.beginPath(); g.arc(0, -33.4, 3.6, Math.PI, 0); g.lineTo(3.8, -30); g.lineTo(-3.8, -30); g.fill(); ell2(g, 0, -32.6, 2, 2.4, m);
        poly2(g, hi, [-4, -22, 0, -21, 0, -17, -4.4, -18]); poly2(g, m, [4, -22, 0, -21, 0, -17, 4.4, -18]); ln2(g, lo, 0.3, [-3, -20.4, -0.8, -20, -3, -19.2, -0.8, -18.8]); }
      else { /* Engel: gefaltete Hände, Haar */ ell2(g, 0, -35.6, 3.2, 1.6, lo2); ell2(g, 0, -22, 1.6, 2.4, hi); }
      /* Alter: Moos, Riss, Flechten */
      const R = Z.Rng(77 + v); for (let k = 0; k < 10; k++) ell2(g, -6 + R() * 12, -2 - R() * 26, 0.8 + R() * 0.8, 0.5, k % 3 ? "rgba(70,96,44,.6)" : "rgba(200,170,80,.45)");
      ln2(g, "rgba(20,16,18,.55)", 0.35, [1.4, -29, 2.4, -22, 1.2, -16, 2, -12]);
    } },
    /* Fischgötze des Sees: schuppiger Leib, Glotzaugen, Flossenkamm, Dreizack; grünlicher Stein mit Algen */
    statueKuo: { w: 28, h: 48, draw(g, v, B) {
      const m = "#3e5246", hi = "#6a8270", lo = "#1e2a24";
      poly2(g, lo, [-8, 0, 8, 0, 7, -4, -7, -4]); poly2(g, m, [-7.6, -4, 7.6, -4, 7.6, -5, -7.6, -5]);
      g.fillStyle = lgr(g, -6, 0, 6, 0, [hi, m, lo]); g.beginPath(); g.moveTo(-5, -5); g.quadraticCurveTo(-7, -16, -4, -26); g.quadraticCurveTo(0, -30, 4, -26); g.quadraticCurveTo(7, -16, 5, -5); g.fill();
      g.strokeStyle = "rgba(0,0,0,.25)"; g.lineWidth = 0.4; for (let r = 0; r < 6; r++) for (let k = 0; k < 4; k++) { g.beginPath(); g.arc(-3.6 + k * 2.4 + (r % 2) * 1.2, -8 - r * 3, 1.2, 0, Math.PI); g.stroke(); }
      g.fillStyle = lgr(g, -5, 0, 5, 0, [hi, m, lo]); g.beginPath(); g.ellipse(0.6, -30, 5, 4.2, 0.1, 0, Math.PI * 2); g.fill();
      poly2(g, m, [-2, -33, 0, -38, 2, -34, 3, -37, 4, -33]); ell2(g, -1.6, -31, 1.4, 1.4, "#c8d0a0"); ell2(g, 2.6, -31, 1.4, 1.4, "#c8d0a0"); ell2(g, -1.4, -31, 0.6, 0.6, "#1a1a10"); ell2(g, 2.8, -31, 0.6, 0.6, "#1a1a10");
      ln2(g, lo, 0.6, [-2, -27.6, 0.6, -26.4, 3.4, -27.6]);
      ln2(g, "#5a4a30", 1, [7, -2, 7, -42]); for (const dx of [-2.4, 0, 2.4]) ln2(g, "#8a7a50", 0.8, [7 + dx, -40, 7 + dx, -45]); ln2(g, "#8a7a50", 0.8, [4.6, -40, 9.4, -40]);
      for (let k = 0; k < 6; k++) ln2(g, "rgba(90,140,60,.55)", 0.6, [-5 + k * 2, -5 - k % 3, -5.6 + k * 2, -12 - (k % 2) * 4]);
    } },
    /* Duergar-Ahnenstatue: breiter Zwerg mit geflochtenem Bart, Kriegsaxt, glimmende Augen */
    statueDuergar: { w: 28, h: 40, draw(g, v, B) {
      const m = "#4a4448", hi = "#76707a", lo = "#221e22";
      poly2(g, lo, [-9, 0, 9, 0, 8, -4, -8, -4]); poly2(g, hi, [-8.6, -4, 8.6, -4, 8.6, -5, -8.6, -5]);
      g.fillStyle = lgr(g, -7, 0, 7, 0, [hi, m, lo]); g.beginPath(); g.moveTo(-7, -5); g.lineTo(-7.4, -18); g.quadraticCurveTo(-7, -23, 0, -23.4); g.quadraticCurveTo(7, -23, 7.4, -18); g.lineTo(7, -5); g.fill();
      g.fillStyle = lo; g.fillRect(-7, -12, 14, 1.4); g.fillStyle = "#8a6a2a"; g.fillRect(-1.2, -12.2, 2.4, 1.8);
      g.fillStyle = lgr(g, -4, 0, 4, 0, [hi, m]); g.beginPath(); g.ellipse(0, -26, 4, 4.4, 0, 0, Math.PI * 2); g.fill();
      poly2(g, lo, [-4.4, -27.4, 4.4, -27.4, 3.6, -31, -3.6, -31]); poly2(g, hi, [-4.6, -27.4, 4.6, -27.4, 4.6, -26.6, -4.6, -26.6]);
      g.fillStyle = mixC(m, "#000000", 0.1); g.beginPath(); g.moveTo(-3.8, -25); g.quadraticCurveTo(-4.4, -16, 0, -11); g.quadraticCurveTo(4.4, -16, 3.8, -25); g.fill();
      g.strokeStyle = "rgba(0,0,0,.35)"; g.lineWidth = 0.35; for (let k = 0; k < 6; k++) { g.beginPath(); g.moveTo(-2.5 + k, -24); g.quadraticCurveTo(-2 + k * 0.8, -18, -0.6 + k * 0.3, -13); g.stroke(); }
      g.fillStyle = "rgba(255,140,60,.9)"; g.fillRect(-2.4, -26.4, 1.3, 0.7); g.fillRect(1.1, -26.4, 1.3, 0.7);
      ln2(g, "#3a2a1a", 1.2, [-9.5, -2, -9.5, -30]); g.fillStyle = lgr(g, -14, -30, -9, -24, ["#9a9690", "#4a4642"]); g.beginPath(); g.moveTo(-9.5, -31); g.quadraticCurveTo(-15, -30, -14.4, -24); g.quadraticCurveTo(-12, -26, -9.5, -25); g.fill();
    } },
    /* Tisch: Platte mit Maserung und Kante, gedrechselte Beine, Querstrebe; darauf Krug, Brot und Kerze */
    table: { w: 26, h: 18, draw(g, v, B) {
      g.fillStyle = "rgba(0,0,0,.3)"; g.beginPath(); g.ellipse(0, 0, 11, 1.2, 0, 0, Math.PI * 2); g.fill();
      for (const sd of [-1, 1]) { g.fillStyle = "#4a2e1a"; g.fillRect(sd * 8.5 - 1, -7, 2, 7); ell2(g, sd * 8.5, -4, 1.3, 0.8, "#5a3a22"); }
      g.fillStyle = "#3a2414"; g.fillRect(-8, -3.4, 16, 1);
      g.fillStyle = lgr(g, 0, -9.6, 0, -7, ["#7a5434", "#4a2e1a"]); g.fillRect(-11, -9.6, 22, 2.6); g.fillStyle = "rgba(255,220,170,.3)"; g.fillRect(-11, -9.6, 22, 0.5);
      g.strokeStyle = "rgba(0,0,0,.25)"; g.lineWidth = 0.25; g.beginPath(); g.moveTo(-10, -8.4); g.quadraticCurveTo(0, -8, 10, -8.6); g.stroke();
      if (v !== 1) { g.fillStyle = "#8a8478"; g.fillRect(-7, -13, 3, 3.4); g.fillStyle = "#b0aaa0"; g.fillRect(-7, -13, 0.8, 3.4); g.strokeStyle = "#6a645a"; g.lineWidth = 0.5; g.beginPath(); g.arc(-3.6, -11.4, 1, -Math.PI / 2, Math.PI / 2); g.stroke(); }
      ell2(g, 2, -10.2, 3.4, 0.9, "#c8c0b0"); g.fillStyle = "#b07a3a"; g.beginPath(); g.ellipse(2, -11, 2.4, 1.3, 0, Math.PI, 0); g.fill();
      if (v !== 2) { g.fillStyle = "#e8dcc0"; g.fillRect(7, -14, 1.2, 4.4); g.fillStyle = "rgba(255,210,120,.9)"; g.beginPath(); g.ellipse(7.6, -15, 0.6, 1.1, 0, 0, Math.PI * 2); g.fill(); }
    } },
    /* Amboss auf dem Holzklotz: Horn, Bahn, Hardyloch, Hammer daneben */
    anvil: { w: 30, h: 16, draw(g, v, B) {
      g.fillStyle = "rgba(0,0,0,.35)"; g.beginPath(); g.ellipse(0, 0, 10, 1.3, 0, 0, Math.PI * 2); g.fill();
      g.fillStyle = lgr(g, -4, 0, 4, 0, ["#6a4a2a", "#3a2414"]); g.fillRect(-4.4, -6, 8.8, 6); g.strokeStyle = "rgba(0,0,0,.3)"; g.lineWidth = 0.3; for (let k = 0; k < 3; k++) { g.beginPath(); g.moveTo(-4 + k * 3, -6); g.lineTo(-4.2 + k * 3, 0); g.stroke(); }
      poly2(g, "#2a2628", [-3, -6, 3, -6, 2.2, -8.4, -2.2, -8.4]);
      g.fillStyle = lgr(g, 0, -12, 0, -8, ["#7a7678", "#2e2a2c"]); g.beginPath(); g.moveTo(-7, -12); g.lineTo(6, -12); g.quadraticCurveTo(12, -12, 14, -10.6); g.quadraticCurveTo(10, -9.4, 5, -9.2); g.lineTo(3, -8.4); g.lineTo(-3, -8.4); g.lineTo(-5, -9.6); g.lineTo(-7, -9.6); g.closePath(); g.fill();
      g.fillStyle = "rgba(255,250,240,.45)"; g.fillRect(-7, -12, 12, 0.5); g.fillStyle = "#141012"; g.fillRect(-5, -11.6, 0.9, 0.9);
      ln2(g, "#5a3a22", 1, [-12, -0.4, -8, -6]); poly2(g, "#4a4648", [-9.6, -6.6, -6.4, -5, -7.2, -3.8, -10.4, -5.4]);
    } },
    /* Waffenständer: Gestell mit Speeren, Axt und Schwert, Rundschild an der Seite */
    rack: { w: 26, h: 26, draw(g, v, B) {
      g.fillStyle = "rgba(0,0,0,.3)"; g.beginPath(); g.ellipse(0, 0, 11, 1.2, 0, 0, Math.PI * 2); g.fill();
      for (const sd of [-1, 1]) { g.fillStyle = "#4a3020"; g.fillRect(sd * 9 - 1, -20, 2, 20); g.fillRect(sd * 9 - 2, -1.4, 4, 1.4); }
      g.fillStyle = "#5a3a24"; g.fillRect(-10, -20, 20, 1.8); g.fillRect(-10, -6, 20, 1.6); g.fillStyle = "rgba(255,220,170,.25)"; g.fillRect(-10, -20, 20, 0.5);
      for (let k = 0; k < 4; k++) { const sx = -6 + k * 4; ln2(g, "#5a3a22", 0.8, [sx, -5, sx + (k - 1.5) * 0.4, -23]); if (k === 2) { poly2(g, STEEL[1], [sx + 0.6, -21, sx + 4, -22.5, sx + 4, -17.5, sx + 0.6, -18.5]); } else poly2(g, lgr(g, sx - 1, 0, sx + 1, 0, [STEEL[0], STEEL[2]]), [sx + (k - 1.5) * 0.4, -26.5, sx + 1.1 + (k - 1.5) * 0.4, -22.5, sx - 1.1 + (k - 1.5) * 0.4, -22.5]); }
      ell2(g, 9.6, -11, 4, 5, "#6a2a1a"); ell2(g, 9.6, -11, 3, 4, "#8a3a22"); ell2(g, 9.6, -11, 1.1, 1.1, "#b8923a"); g.strokeStyle = "#b8923a"; g.lineWidth = 0.4; g.beginPath(); g.ellipse(9.6, -11, 4, 5, 0, 0, Math.PI * 2); g.stroke();
    } }
  };
  function drawFancy(c, d, px, py, t) {
    const F = FANCY[d.kind], v = (hash(d.x * 7, d.y * 3) * 3) | 0, key = d.kind + "|" + v + "|" + (B.bg || "") + "|" + (B.tile && B.tile.base);
    let cv = FSPR.get(key);
    if (!cv) { cv = document.createElement("canvas"); cv.width = F.w * FS; cv.height = F.h * FS; const g = cv.getContext("2d"); g.setTransform(FS, 0, 0, FS, F.w * FS / 2, F.h * FS); try { F.draw(g, v, B); } catch (e) { console.error(e); } FSPR.set(key, cv); }
    const flip = hash(d.y, d.x * 5) < 0.5 && d.kind !== "armor" && d.kind !== "statueDuergar";
    if (flip) { c.save(); c.translate(px, 0); c.scale(-1, 1); c.drawImage(cv, -F.w / 2, py - F.h, F.w, F.h); c.restore(); }
    else c.drawImage(cv, px - F.w / 2, py - F.h, F.w, F.h);
    if (d.kind === "table" && v !== 2) { c.save(); c.globalCompositeOperation = "lighter"; const f = 0.8 + 0.2 * Math.sin(t * 9 + d.x); c.globalAlpha = 0.5 * f; c.fillStyle = "#ffc070"; c.beginPath(); c.arc(px + (flip ? -7.6 : 7.6), py - 15, 2.4, 0, Math.PI * 2); c.fill(); c.restore(); }
  }
  /* Flamme: Hof, äußere Zunge, Kern und weißer Docht – alles additiv */
  /* frei sichtbarer Hintergrund (Himmel, Fenster, Arena): dort gibt es keine Wand für Wandschmuck */
  G.isOpen = (x, y) => { if (!lv || x < 0 || y < 0 || x >= lv.W || y >= lv.H) return false; const i = y * lv.W + x; return !!((G.sky && G.sky[i]) || (PR && (PR.win[i] || PR.clear[i]))); };
  /* ======================= BEUTE (W11 R17) =======================
     Vor den Fundstücken (geschosse.js): Bodenschein in Seltenheitsfarbe, bei Legendärem langsam kreisende Strahlen.
     Danach: Gold glitzert (Sternfunkeln), Funde ab „Selten“ und Schriftrollen/Splitter steigen Lichtfunken auf,
     Schriftrollen bekommen eine weiche, hellere Lichtsäule. Aufgehobenes fliegt als kleines Licht zum HUD
     (Gold → Goldanzeige, Splitter/Glut → Splitter, Waffe → Waffenfeld, Rolle → Segen, Essen → Lebensbalken).
     Lean: nur Bodenschein und Gold-Funkeln, kein Flug. Schalter Z.gfx.off.beute. */
  const PK_SEEN = new Map(); let pkFly = [], pkLv = null;
  const PK_TARGET = { gold: "gold", shard: "shards", glut: "shards", item: "slot-a1", scroll: "bless", food: "hpbar", key: "area" };
  function pkCol(p) { return p.kind === "item" && p.it && Z.RARITY[p.it.rar] ? Z.RARITY[p.it.rar].col : p.kind === "gold" ? "#ffd27a" : p.kind === "shard" ? "#ff6a9a" : p.kind === "glut" ? "#ffa040" : p.kind === "scroll" ? "#ffd27a" : p.kind === "key" ? "#ffd27a" : "#e8c890"; }
  function pickupBack(c, t) {
    if (G.off && G.off.beute) return; const cam = Z.cam, lo = Z.gq && (Z.gq.lean || Z.gq.mini);
    for (const p of Z.pickups) {
      if (p.rack || p.x < cam.x - 40 || p.x > cam.x + cam.w + 40 || p.y < cam.y - 20 || p.y > cam.y + cam.h + 40) continue;
      if (p.kind !== "item" && p.kind !== "scroll" && p.kind !== "shard") continue;
      const col = pkCol(p), rar = p.kind === "item" && p.it ? p.it.rar | 0 : 1;
      c.save(); c.globalCompositeOperation = "lighter"; c.globalAlpha = 0.24 + 0.05 * rar + 0.06 * Math.sin(t * 2.5 + p.x);
      c.translate(p.x, p.y); c.scale(1, 0.32); Z.draw.glow(c, 0, -2, 14 + rar * 3, col); c.restore();
      if (rar >= 3 && !lo) {
        c.save(); c.globalCompositeOperation = "lighter"; c.translate(p.x, p.y - 10 + Math.sin(t * 3 + p.x) * 2 - 4);
        for (let i = 0; i < 4; i++) { c.rotate(t * 0.6 + i * Math.PI / 4); c.globalAlpha = 0.16; c.fillStyle = col; c.fillRect(-0.8, -15, 1.6, 30); }
        c.restore();
      }
    }
  }
  function hudPoint(id) {
    const el = document.getElementById(id), cv = document.getElementById("cv"); if (!el || !cv) return null;
    const r = el.getBoundingClientRect(), q = cv.getBoundingClientRect(); if (!r.width || !q.width) return null;
    const cam = Z.cam; return [cam.x + (r.left + r.width / 2 - q.left) / q.width * cam.w, cam.y + (r.top + r.height / 2 - q.top) / q.height * cam.h];
  }
  function pickupFront(c, t) {
    if (G.off && G.off.beute) return; const cam = Z.cam, lo = Z.gq && (Z.gq.lean || Z.gq.mini), P = Z.player;
    if (pkLv !== Z.level) { pkLv = Z.level; PK_SEEN.clear(); pkFly = []; }
    const now = new Set();
    for (const p of Z.pickups) {
      now.add(p);
      if (p.x < cam.x - 40 || p.x > cam.x + cam.w + 40 || p.y < cam.y - 20 || p.y > cam.y + cam.h + 40) continue;
      if (P && !lo) PK_SEEN.set(p, { x: p.x, y: p.y - 6, kind: p.kind, col: pkCol(p), near: Math.abs(p.x - (P.x + P.w / 2)) < 44 && Math.abs(p.y - (P.y + P.h)) < 52 });
      if (p.kind === "gold") { /* Glitzern: kurzer Vierstrahlstern je Münze, versetzt */
        const ph = (t * 0.8 + (p.x * 0.137 % 1)) % 1; if (ph < 0.09) { const k = Math.sin(ph / 0.09 * Math.PI), L = 1 + 3 * k;
          c.save(); c.globalCompositeOperation = "lighter"; c.globalAlpha = 0.9 * k; c.fillStyle = "#fff4d0"; c.fillRect(p.x - L + 0.5, p.y - 3.2, L * 2, 0.6); c.fillRect(p.x + 0.2, p.y - 2.9 - L, 0.6, L * 2); c.restore(); }
        continue;
      }
      if (lo || p.rack) continue;
      const rar = p.kind === "item" && p.it ? p.it.rar | 0 : p.kind === "scroll" || p.kind === "shard" ? 2 : 0;
      if (rar >= 1 && Math.random() < 0.05 * rar) Z.fx.p({ x: p.x + (Math.random() - 0.5) * 10, y: p.y - 2, vx: 0, vy: -18 - Math.random() * 14, life: 0.9, size: 1.1, col: pkCol(p), kind: "glow", add: true });
      if (p.kind === "scroll") { /* Segen-Rolle: zweite, weichere und hellere Lichtsäule */
        c.save(); c.globalCompositeOperation = "lighter"; c.globalAlpha = 0.12 + 0.06 * Math.sin(t * 2 + p.x);
        const g = c.createLinearGradient(0, p.y - 90, 0, p.y); g.addColorStop(0, "rgba(255,210,122,0)"); g.addColorStop(0.7, "rgba(255,220,150,.6)"); g.addColorStop(1, "rgba(255,240,200,.9)");
        c.fillStyle = g; c.fillRect(p.x - 3, p.y - 90, 6, 90); c.globalAlpha *= 0.5; c.fillRect(p.x - 9, p.y - 70, 18, 70); c.restore();
      }
    }
    /* verschwundene Funde in Spielernähe: Flug zum HUD */
    for (const [p, o] of PK_SEEN) if (!now.has(p)) { PK_SEEN.delete(p); if (o.near && pkFly.length < 24) { const tg = hudPoint(PK_TARGET[o.kind] || "gold"); if (tg) pkFly.push({ x0: o.x, y0: o.y, tx: tg[0] - cam.x, ty: tg[1] - cam.y, t: 0, dur: 0.45 + Math.random() * 0.15, col: o.col, big: o.kind === "item" || o.kind === "scroll" }); } }
    if (PK_SEEN.size > 400) PK_SEEN.clear();
  }
  let pkT = 0;
  function pkFlyDraw(c) {
    const cam = Z.cam; const dt = Math.max(0, Math.min(0.05, G.time - pkT)); pkT = G.time;
    if (pkFly.length) {
      c.save(); c.globalCompositeOperation = "lighter";
      for (let i = pkFly.length - 1; i >= 0; i--) {
        const f = pkFly[i]; f.t += dt; const u = Math.min(1, f.t / f.dur), e = u * u * (3 - 2 * u);
        /* Ziel folgt der Kamera (HUD ist fest am Bildschirm) */
        const tx = cam.x + f.tx, ty = cam.y + f.ty, mx = (f.x0 + tx) / 2, my = Math.min(f.y0, ty) - 30;
        const x = (1 - e) * (1 - e) * f.x0 + 2 * (1 - e) * e * mx + e * e * tx, y = (1 - e) * (1 - e) * f.y0 + 2 * (1 - e) * e * my + e * e * ty;
        c.globalAlpha = 0.9 * (1 - u * 0.4); Z.draw.glow(c, x, y, f.big ? 9 : 5, f.col); c.globalAlpha = 1; c.fillStyle = "#fff6e0"; c.fillRect(x - 0.8, y - 0.8, 1.6, 1.6);
        if (u >= 1) pkFly.splice(i, 1);
      }
      c.restore();
    }
  }
  let FG = 0; /* Zugluft der gerade gezeichneten Kerze */
  function flame(c, x, y, s, col) {
    if (Z.gq && Z.gq.level === 0) { /* Handheld: eine einfache Flamme ohne Schein */
      const h = (7 + Math.sin(G.time * 17 + x) * 1.6) * s, w = 2.6 * s;
      c.fillStyle = col; c.beginPath(); c.moveTo(x - w, y); c.lineTo(x, y - h); c.lineTo(x + w, y); c.fill();
      c.fillStyle = "#ffd890"; c.fillRect(x - w * 0.35, y - h * 0.4, w * 0.7, h * 0.4); return;
    }
    c.save(); c.globalCompositeOperation = "lighter";
    /* W11 R16: Zugluft (FG 0…1, gesetzt vom Kerzen-Fall in drawDecor): Flamme legt sich flach und wird kleiner */
    const tm = G.time, h = (7 + Math.sin(tm * 17 + x) * 1.6 + Math.sin(tm * 29 + x * 3) * 0.7) * s * (1 - FG * 0.5), w = 3 * s, lean = Math.sin(tm * 11 + y) * w * 0.45 + (Z.windX || 0) * 0.02 * s + FG * w * (1.4 + 0.5 * Math.sin(tm * 23 + x));
    D.glow(c, x, y - h * 0.4, 14 * s + 5, "rgba(255,150,60,.32)");
    c.fillStyle = col; c.globalAlpha = 0.85; c.beginPath(); c.moveTo(x - w, y); c.quadraticCurveTo(x - w * 0.8, y - h * 0.6, x + lean, y - h); c.quadraticCurveTo(x + w * 0.8, y - h * 0.5, x + w, y); c.quadraticCurveTo(x, y + w * 0.5, x - w, y); c.fill();
    if (s > 0.6) { c.globalAlpha = 0.6; c.beginPath(); c.moveTo(x + w * 0.2, y - h * 0.3); c.quadraticCurveTo(x + w * 0.9, y - h * 0.7, x + lean * 1.6 + w * 0.6, y - h * 0.95 - Math.sin(tm * 23 + x) * s); c.quadraticCurveTo(x + w * 0.5, y - h * 0.45, x + w * 0.2, y - h * 0.3); c.fill(); }
    c.globalAlpha = 1; c.fillStyle = "#ffd890"; c.beginPath(); c.moveTo(x - w * 0.55, y); c.quadraticCurveTo(x - w * 0.3, y - h * 0.5, x + lean * 0.6, y - h * 0.72); c.quadraticCurveTo(x + w * 0.35, y - h * 0.4, x + w * 0.55, y); c.fill();
    c.fillStyle = "#fff6dc"; c.beginPath(); c.moveTo(x - w * 0.3, y); c.quadraticCurveTo(x, y - h * 0.42, x + w * 0.3, y); c.fill();
    c.restore();
  }
  Z.flame = flame;
  G._drawTiles = drawTiles; G._light = (c, W, H) => { G.frame++; return lightPass(c, Z.cam, W, H); }; /* für Tests */

  /* Türen und Stationen */
  const DOORG = new WeakMap();
  function drawDoors(c, t) {
    const cam = Z.cam;
    for (const d of lv.doors) {
      const px = d.x * T + 8, py = d.y * T + 16;
      /* außerhalb des Bildes nichts zeichnen (große Karten haben viele Türen) */
      if (px < cam.x - 60 || px > cam.x + cam.w + 60 || py < cam.y - 10 || py > cam.y + cam.h + 80) continue;
      if (d.kind === "entry") { c.fillStyle = shade(B.wall, -0.5); c.fillRect(px - 10, py - 32, 20, 32); c.beginPath(); c.arc(px, py - 32, 10, Math.PI, 0); c.fill(); c.fillStyle = "#3a2a1a"; c.fillRect(px - 8, py - 30, 16, 30); continue; }
      if (d.kind === "gate") { c.fillStyle = "#1a1418"; c.fillRect(px - 16, py - 44, 32, 44); c.beginPath(); c.arc(px, py - 44, 16, Math.PI, 0); c.fill(); c.fillStyle = "rgba(255,80,60,.25)"; c.fillRect(px - 12, py - 40, 24, 40); c.strokeStyle = "rgba(220,210,230,.5)"; c.lineWidth = 0.6; for (let k = 0; k < 6; k++) { c.beginPath(); c.moveTo(px, py - 52); c.lineTo(px - 16 + k * 6.4, py); c.stroke(); } D.glow(c, px, py - 24, 30, "rgba(255,90,60,.25)"); continue; }
      const dir = Z.exitDir(null, d.to), locked = d.locked && !Z.run.doorsOpen;
      const col = dir === "down" ? "#b080ff" : dir === "up" ? "#ffd27a" : dir === "boss" ? "#ff5a4e" : "#e8a070";
      c.fillStyle = "#1a1214"; c.fillRect(px - 12, py - 36, 24, 36); c.beginPath(); c.arc(px, py - 36, 12, Math.PI, 0); c.fill();
      /* Verlauf je Tür einmal anlegen (Weltkoordinaten, hängt nur an Lage und Farbe) */
      let dg = DOORG.get(d); if (!dg || dg.col !== col || dg.c !== c) { const g0 = c.createLinearGradient(0, py - 44, 0, py); g0.addColorStop(0, "rgba(0,0,0,0)"); g0.addColorStop(1, col); dg = { g: g0, col, c }; DOORG.set(d, dg); } const g = dg.g; c.save(); c.globalAlpha = locked ? 0.15 : 0.35 + 0.1 * Math.sin(t * 3 + d.x); c.globalCompositeOperation = "lighter"; c.fillStyle = g; c.fillRect(px - 10, py - 44, 20, 44); c.restore();
      c.strokeStyle = shade(B.tile.light, -0.1); c.lineWidth = 2; c.beginPath(); c.moveTo(px - 12, py); c.lineTo(px - 12, py - 36); c.arc(px, py - 36, 12, Math.PI, 0); c.lineTo(px + 12, py); c.stroke();
      /* Richtungssymbol */
      c.fillStyle = col; c.save(); c.translate(px, py - 52);
      if (dir === "down") { c.beginPath(); c.moveTo(-5, -3); c.lineTo(5, -3); c.lineTo(0, 4); c.fill(); }
      else if (dir === "up") { c.beginPath(); c.moveTo(-5, 3); c.lineTo(5, 3); c.lineTo(0, -4); c.fill(); }
      else if (dir === "boss") { D.circ(c, 0, 0, 4, col); c.fillStyle = "#1a1214"; c.fillRect(-2, -1, 1.5, 1.5); c.fillRect(0.5, -1, 1.5, 1.5); }
      else { c.beginPath(); c.moveTo(-4, -4); c.lineTo(4, 0); c.lineTo(-4, 4); c.fill(); }
      c.restore();
      if (locked) { c.fillStyle = "#3a3434"; for (let k = -9; k <= 9; k += 4.5) c.fillRect(px + k - 0.8, py - 40, 1.6, 40); }
      c.font = "700 7px 'Alegreya Sans',sans-serif"; c.textAlign = "center"; c.fillStyle = "rgba(0,0,0,.7)"; c.fillText(Z.areaName(d.to), px + 0.5, py - 60.5); c.fillStyle = col; c.fillText(Z.areaName(d.to), px, py - 61);
    }
  }

  /* ======================= LICHT ======================= */
  /* Bildschirm-Überlagerungen (Sichtnebel, Farbstimmung, Vignette …) werden – wenn möglich – in die kleine
     Lichtkarte gemalt statt als eigene Vollbild-Durchgänge: gleiches Ergebnis (alles „source-over“ über der Szene),
     aber nur noch ein Vollbild-Blit. Module melden sich mit G.lightOver.push(fn(l, X0, Y0, sx, sy, LW, LH)) an.

     FARBIGES LICHT (ab Stufe „Mittel“):
     Jede Lichtquelle hat eine Farbe (Fackel orange, Kerze gelblich, Grünfeuer, violette Runen, rote Lava, lila Pilze,
     Mond/Fenster je Tageszeit silbrig, golden-rosa oder blutrot – nie Blau). Alle Lichter eines Bildes landen in einer
     Warteschlange (Weltkoordinaten). Ab Stufe 1 gibt es nur EINE kleine Lichtkarte, die mit „multiply“ über der Szene
     liegt (siehe mulPass): Umgebungslicht × Farbstimmung, weiße Aufhellung wie die alten Löcher, farbige Lichter
     additiv, dazu eine „multiply“-Tönung, damit auch hell erleuchtete Stellen ihre Lichtfarbe zeigen. So färbt das
     Licht Wände, Boden und Figuren, Lichter mischen sich – ohne zusätzlichen Vollbild-Durchgang.
       Stufe 2/3: zusätzlich Schein um helle Quellen (Bloom-Andeutung), nasse Spiegelungen, Runen-Lichtwellen, Lichter
       von Glutteilchen · Stufe 1: nur die Lichtkarte · Stufe 0 (Handheld): alte Dunkelheitskarte, unverändert.

     SCHNITTSTELLE für andere Module (alle Farben als "#rrggbb", "rgb(a)(…)", "r,g,b" oder [r,g,b]; Blau wird zu Violett):
       Z.lightExtra(hole)                 – bestehend: hole(x, y, r, a) schneidet ein Loch in die Dunkelheit;
                                            NEU optional hole(x, y, r, a, farbe): färbt das Licht zusätzlich.
       Z.addLight(x, y, r, farbe, a)      – farbiges Licht nur für das aktuelle Bild (z. B. in einer Zeichenfunktion).
       Z.lightFlash(x, y, r, farbe, a, s) – kurzes Aufleuchten, klingt in s Sekunden ab (Explosion, Zauber).
       Z.gfx.lightGather.push(fn(add, cam, t, stufe)) – eigene Quellen je Bild melden; add(x, y, r, farbe, a, bloom).
       Z.gfx.colorOver.push(fn(l, X0, Y0, sx, sy, LW, LH, t)) – direkt in die Lichtkarte malen (additiv = aufhellen).
       Z.gfx.colorBase = () => canvas     – Tönung des Umgebungslichts (weiß = neutral; Farbstimmung je Gebiet, pracht.js).
     FX-Ringe (Z.fx.rings) leuchten automatisch kurz in ihrer Farbe auf (Explosionen, Treffer, Zauber). */
  G.lightOver = []; G.frame = 0; G.lightFrame = -1;
  G.lightGather = []; G.colorOver = []; G.colorBase = null;
  /* zum Messen/Vergleichen einzeln abschaltbar: Z.gfx.off.color / .bloom / .moon / .shafts / .grain = true */
  G.off = {};
  /* Lichtstufe 0 … 3 („eigene Werte“: mit Ebenen wie Hoch, sonst wie Mittel) */
  const lq = G.lq = () => { const q = Z.gq; if (!q || !Number.isFinite(q.level)) return 2; return q.level < 0 ? (q.layers === false ? 1 : 2) : q.level; };

  /* --- Farben: alles wird zu [r, g, b]; blaue Töne werden violett (kein Blau im Spiel) --- */
  const COLC = new Map();
  function deblue(r, g, b) { if (b > r) { r = b * 0.9 + r * 0.1; if (g > r) g = r * 0.92; } return [r | 0, g | 0, b | 0]; }
  function colRGB(c) {
    if (!c) return null; if (typeof c !== "string") return c.length === 3 ? c : null;
    let v = COLC.get(c); if (v) return v;
    let r = 255, g = 200, b = 140;
    if (c[0] === "#") { let h = c.slice(1); if (h.length < 6) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2]; const n = parseInt(h.slice(0, 6), 16); r = n >> 16; g = (n >> 8) & 255; b = n & 255; }
    else { const m = c.match(/-?[\d.]+/g); if (m && m.length >= 3) { r = +m[0]; g = +m[1]; b = +m[2]; } }
    v = deblue(r, g, b); if (COLC.size > 400) COLC.clear(); COLC.set(c, v); return v;
  }
  G.lightRGB = colRGB;
  /* Lichtfleck je Farbe (auf 8er-Stufen gerundet, zwischengespeichert): heller Kern, weicher, fast quadratischer Abfall */
  const LSPR = new Map();
  function lightSpr(rgb) {
    const r = rgb[0] & 0xf8, g = rgb[1] & 0xf8, b = rgb[2] & 0xf8, key = (r << 16) | (g << 8) | b;
    let s = LSPR.get(key); if (s) return s;
    if (LSPR.size > 160) LSPR.clear();
    s = document.createElement("canvas"); s.width = s.height = 64; const x = s.getContext("2d"), gr = x.createRadialGradient(32, 32, 0, 32, 32, 32);
    for (const [o, a] of [[0, 1], [0.07, 0.86], [0.2, 0.58], [0.38, 0.32], [0.58, 0.14], [0.8, 0.04], [1, 0]]) gr.addColorStop(o, "rgba(" + r + "," + g + "," + b + "," + a + ")");
    x.fillStyle = gr; x.fillRect(0, 0, 64, 64); LSPR.set(key, s); return s;
  }
  G.lightSprite = lightSpr;

  /* Lichtarten: [Farbe, Reichweite, Stärke, Flackern, Höhe über Kachel-Oberkante, Schein (Bloom-Radius)]
     Flackern: 0 ruhig · 1 Feuer · 2 Kerze · 3 langsames Pulsieren · 4 Atmen · 5 Lava-Wogen */
  const MOON = [226, 212, 240], MUSH2 = [236, 124, 220];
  const LK = {
    torch: [[255, 136, 46], 96, 0.58, 1, -9, 22], brazier: [[255, 118, 38], 118, 0.62, 1, 4, 26], campfire: [[255, 128, 44], 160, 0.66, 1, 8, 34],
    forge: [[255, 100, 28], 126, 0.66, 1, 8, 28], candle: [[255, 208, 122], 50, 0.5, 2, 7, 10], candelabra: [[255, 200, 112], 70, 0.52, 2, -10, 16],
    chandelier: [[255, 196, 106], 104, 0.52, 2, 19, 22], lantern: [[255, 180, 90], 76, 0.52, 2, 17, 14], greenfire: [[96, 255, 116], 104, 0.62, 1, 9, 24],
    rune: [[186, 100, 255], 78, 0.6, 3, -10, 18], crystal: [[255, 136, 100], 60, 0.48, 3, 10, 14], mushroom: [[186, 108, 255], 56, 0.52, 4, 9, 12],
    window: [MOON, 74, 0.3, 0, -4, 0], fountain: [[214, 236, 222], 84, 0.36, 4, 6, 0], altar: [[255, 214, 140], 84, 0.46, 3, 6, 16]
  };
  G.LIGHTKINDS = LK; G.lightQueue = () => LQ.slice(0, LQn); /* für Tests */
  function flick(type, t, s) {
    switch (type) {
      case 1: return 0.86 + 0.08 * Math.sin(t * 9.1 + s) + 0.05 * Math.sin(t * 23.7 + s * 1.7) + 0.035 * Math.sin(t * 41.3 + s * 3.1);
      case 2: return 0.93 + 0.045 * Math.sin(t * 6.3 + s) + 0.03 * Math.sin(t * 17.1 + s * 2.3);
      case 3: return 0.62 + 0.38 * (0.5 + 0.5 * Math.sin(t * 1.5 + s));
      case 4: return 0.72 + 0.28 * (0.5 + 0.5 * Math.sin(t * 2 + s));
      case 5: return 0.82 + 0.12 * Math.sin(t * 1.3 + s * 0.7) + 0.06 * Math.sin(t * 3.7 + s * 1.9);
    }
    return 1;
  }
  /* Lichtwarteschlange dieses Bildes (wiederverwendete Objekte – kein Müll je Bild) */
  const LQ = []; let LQn = 0;
  function pushL(x, y, r, rgb, a, bloom) {
    if (!(a > 0.01) || !(r > 1) || !rgb) return;
    const q = LQ[LQn] || (LQ[LQn] = { x: 0, y: 0, r: 0, c: null, a: 0, b: 0 }); LQn++;
    q.x = x; q.y = y; q.r = r; q.c = rgb; q.a = a; q.b = bloom || 0;
  }
  const addC = (x, y, r, col, a, bloom) => pushL(x, y, r, colRGB(col), a == null ? 0.5 : a, bloom);
  /* Lichter des letzten Bildes (für Randlicht auf Figuren, pracht.js) – nur lesen */
  G.lightQ = () => LQ; G.lightQn = () => LQn;
  const EXT = [];
  G.addLight = Z.addLight = (x, y, r, col, a) => { if (EXT.length < 400) EXT.push(x, y, r, colRGB(col), a == null ? 0.5 : a); };
  const FLASH = [];
  G.lightFlash = Z.lightFlash = (x, y, r, col, a, life) => { if (FLASH.length < 48 && lq() >= 1) FLASH.push({ x, y, r, c: colRGB(col), a: a == null ? 0.7 : a, t: 0, life: life || 0.3 }); };
  /* glühende Waffen: Feuer-Effekt, Legenden des Lichts, Affix „Brennend“ */
  const WGLOW = { dawnbringer: "#ffd27a", demonenklaue: "#ff4a2a" }, WGC = {};
  function weaponGlow(it) {
    if (!it || !it.id) return null;
    let v = WGC[it.id];
    if (v === undefined) { const wd = Z.WEAPONS && Z.WEAPONS[it.id]; v = null; if (wd) { if (WGLOW[it.id]) v = colRGB(WGLOW[it.id]); else if ((wd.combo || []).some(k => k.eff && k.eff.burn)) v = colRGB("#ff7a32"); } WGC[it.id] = v; }
    if (!v && it.aff && it.aff.includes("brennend")) v = colRGB("#ff7a32");
    return v;
  }
  const DOORC = { down: colRGB("#b080ff"), up: colRGB("#ffd27a"), boss: colRGB("#ff5a4e"), side: colRGB("#e8a070") };
  const C_DARKIN = [255, 78, 36], C_WRATH = [255, 40, 30], C_LAVA = [255, 92, 30], C_GOLD = [255, 210, 120], C_FIRE = [255, 128, 44], C_STRIKE = [255, 228, 170];
  /* alle Lichter dieses Bildes einsammeln (Weltkoordinaten) */
  function gather(cam, t, lvl, dt) {
    LQn = 0;
    const m = 140, vx0 = cam.x - m, vx1 = cam.x + cam.w + m, vy0 = cam.y - m, vy1 = cam.y + cam.h + m;
    const vis = (x, y) => x > vx0 && x < vx1 && y > vy0 && y < vy1;
    const dark = Z.darkness > 0, P = Z.player, zt = Z.zeit ? Z.zeit() : null, winRGB = zt ? colRGB(zt.win) : MOON;
    if (!dark && lv.lights) for (const d of lv.lights) {
      const k = LK[d.kind]; if (!k) continue;
      const x = d.x * T + 8, y = d.y * T + k[4]; if (!vis(x, y)) continue;
      const f = flick(k[3], t, d.x * 1.0 + (k[3] === 3 || k[3] === 4 ? 0 : d.y * 0.37));
      pushL(x, y, k[1] * (0.95 + 0.05 * f), d.kind === "mushroom" && d.s >= 0.5 ? MUSH2 : d.kind === "window" ? winRGB : k[0], k[2] * f, k[5]);
    }
    /* Lava: entlang jeder sichtbaren Oberfläche alle zwei Kacheln ein rot-oranger Schein */
    if (!dark) for (let i = 0; i < G.lavaN; i += 3) {
      const a0 = G.lava[i], a1 = G.lava[i + 1], y = G.lava[i + 2] * T + 2;
      for (let x = a0; x <= a1; x += 2) { const wx = x * T + (a1 - a0 >= 1 ? T : T / 2); pushL(wx, y, 78, C_LAVA, 0.5 * flick(5, t, x), 0); }
    }
    if (!dark && lv.doors) for (const d of lv.doors) {
      if (d.kind === "entry") continue; const x = d.x * T + 8, y = d.y * T - 4; if (!vis(x, y)) continue;
      if (d.kind === "gate") { pushL(x, y - 10, 96, C_WRATH, 0.32 * flick(4, t, d.x), 0); continue; }
      const dir = Z.exitDir ? Z.exitDir(null, d.to) : "side", locked = d.locked && !(Z.run && Z.run.doorsOpen);
      pushL(x, y - 8, 84, DOORC[dir] || DOORC.side, (locked ? 0.12 : 0.34) * flick(4, t, d.x), 0);
    }
    if (P && !P.dead) {
      /* Ezekiels Darkin-Glutadern: schwacher, pulsierender roter Schein; im Zorn lodernd */
      const cx = P.x + P.w / 2, wr = P.wrath > 0, pu = 0.5 + 0.5 * Math.sin(t * 3);
      pushL(cx, P.y + 13, wr ? 120 : 58, wr ? C_WRATH : C_DARKIN, (wr ? 0.55 + 0.1 * Math.sin(t * 10) : 0.2) * (0.82 + 0.18 * pu), 0);
      const it = P.act && P.act.it ? P.act.it : P.slots && P.slots.a1, wg = weaponGlow(it);
      if (wg) { const atk = P.act && P.act.phase === "act" ? 1.7 : P.act ? 1.25 : 1; pushL(cx + (P.face || 1) * 12, P.y + 14, 64 * Math.min(1.4, atk), wg, 0.26 * atk * flick(1, t, 3), atk > 1.5 ? 16 : 0); }
    }
    for (const p of Z.projs) {
      const k = p.k; if (!k || !vis(p.x, p.y)) continue;
      if (k.glow || k.fire || k.wave || k.ground) pushL(p.x, p.y, k.wave ? 78 : 62, colRGB(k.glow || k.col), k.wave ? 0.5 : 0.55, k.glow || k.fire ? 12 : 0);
      else if (p.kind === "bombe" || p.kind === "e_bombe") pushL(p.x, p.y - 3, 26, C_FIRE, 0.4 * flick(1, t, p.x), 5);
    }
    for (const e of Z.enemies) {
      if (e.dead || e.hidden > 0 || !e.def) continue; const df = e.def;
      if (!(df.glow || df.shape === "wisp")) continue;
      const x = e.x + e.w / 2, y = e.y + e.h / 2; if (!vis(x, y)) continue;
      pushL(x, y, 70 + e.w, colRGB(typeof df.glow === "string" ? df.glow : df.c || "#ffb040"), 0.42 * flick(4, t, e.x * 0.1), 10);
    }
    for (const h of Z.hazards) {
      const k = h.kind; if (k !== "fire" && k !== "column" && k !== "strike" && k !== "breath" && k !== "lava") continue; if (!vis(h.x, h.y)) continue;
      const rgb = h.col ? colRGB(h.col) : k === "strike" ? C_STRIKE : C_FIRE;
      pushL(h.x, h.y - 12, k === "column" || k === "strike" ? 96 : 76, rgb, 0.55 * flick(1, t, h.x), 0);
    }
    for (const p of Z.pickups) if ((p.kind === "chest" || p.kind === "item" || p.kind === "scroll") && vis(p.x, p.y)) pushL(p.x, p.y - 8, 44, C_GOLD, 0.2 * flick(4, t, p.x), 0);
    /* Ringe der Effekte (Explosionen, Zauber, schwere Treffer) leuchten kurz in ihrer Farbe */
    const rings = FX.rings || [];
    for (let i = 0; i < rings.length; i++) { const g = rings[i]; if (g.r < 14 || !vis(g.x, g.y)) continue; const k = 1 - g.t / (g.life || 0.35); if (k <= 0) continue; pushL(g.x, g.y, Math.max(56, g.r * 2.4), colRGB(g.col), 0.6 * k * k, g.r > 28 ? 20 * k : 0); }
    for (let i = FLASH.length - 1; i >= 0; i--) { const f = FLASH[i]; f.t += dt; const k = 1 - f.t / f.life; if (k <= 0) { FLASH.splice(i, 1); continue; } pushL(f.x, f.y, f.r * (0.8 + 0.2 * k), f.c, f.a * k, 0); }
    for (let i = 0; i < EXT.length; i += 5) pushL(EXT[i], EXT[i + 1], EXT[i + 2], EXT[i + 3], EXT[i + 4], 0);
    EXT.length = 0;
    for (const f of G.lightGather) { try { f(addC, cam, t, lvl); } catch (e) { console.error(e); } }
  }

  /* --- Mondlicht: je Level eine Karte (1 Pixel je Kachel), wie viel Himmel/Fensterlicht eine Stelle erreicht.
     Fällt unter offenem Himmel und hinter Bogenfenstern schräg nach unten ein und wird weich verwischt. --- */
  let MOONM = null;
  /* Farbe und Stärke des Himmelslichts nach Tageszeit (tageszeit.js: Z.zeit) – nachts silbrig, Blutmond rot,
     Dämmerung gold/rosa; ohne Tageszeit silbrig-violett */
  function skyLight() {
    const z = Z.zeit ? Z.zeit() : null;
    if (!z) return { rgb: MOON, k: 1, key: "m" };
    const rgb = colRGB(z.light), k = z.k === "nacht" ? 0.45 + 0.55 * (z.moonBright || 0) : z.k === "blut" ? 1.05 : 1.1;
    return { rgb, k, key: z.k + rgb.join(",") };
  }
  G.skyLight = skyLight;
  function moonMap() {
    const sl = skyLight();
    if (MOONM && MOONM.pr === PR && MOONM.key === sl.key) return MOONM.cv;
    MOONM = { pr: PR, cv: null, key: sl.key };
    if (!PR || !lv || !(lv.out || B.open === "arch" || lv.hub) || B.bg === "spires" || B.bg === "embercity") return null;
    const W = PR.W, H = PR.H, v = new Float32Array(W * H);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const i = y * W + x; if (PR.sol[i]) continue; v[i] = G.sky[i] ? 1 : PR.clear[i] ? 0.9 : PR.win[i] ? 0.75 : 0; }
    /* einfallendes Licht: nach unten und schräg nach rechts unten, an Fels gebremst */
    for (let y = 1; y < H; y++) for (let x = 0; x < W; x++) { const i = y * W + x; if (PR.sol[i]) continue; const up = v[i - W] * 0.8, dg = x > 0 ? v[i - W - 1] * 0.74 : 0; const m2 = up > dg ? up : dg; if (m2 > v[i]) v[i] = m2; }
    /* Felsoberflächen am Rand der Luft bekommen ihr Licht ab (Kanten-Glanz) */
    const o = new Float32Array(W * H);
    for (let pass = 0; pass < 2; pass++) {
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { let s = 0, n = 0; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const xx = x + dx, yy = y + dy; if (xx < 0 || yy < 0 || xx >= W || yy >= H) continue; s += v[yy * W + xx] * (dx || dy ? 1 : 2); n += dx || dy ? 1 : 2; } o[y * W + x] = s / n; }
      v.set(o);
    }
    const cv = document.createElement("canvas"); cv.width = W; cv.height = H; const g = cv.getContext("2d"), id = g.createImageData(W, H);
    const mc = sl.rgb; for (let i = 0; i < W * H; i++) { const k = i * 4; id.data[k] = mc[0]; id.data[k + 1] = mc[1]; id.data[k + 2] = mc[2]; id.data[k + 3] = Math.min(255, v[i] * 255) | 0; }
    g.putImageData(id, 0, 0); MOONM.cv = cv; return cv;
  }

  /* Löcher in die Dunkelheit: für beide Lichtwege dieselbe Liste (Spieler, Lichtquellen, Gefahren, Geschosse …) */
  /* ck < 1: im Farblicht-Weg übernimmt das farbige Licht einen Teil der Aufhellung (sonst wäre alles schon weiß) */
  const HOLE_BIG = { forge: 90, brazier: 80, chandelier: 90, campfire: 120, greenfire: 70, fountain: 60, altar: 60 }; /* einmal angelegt statt je Licht und Bild (GC-Spitzen auf Handhelds) */
  function cutHoles(hole0, cone0, holeC0, t, ck) {
    const P = Z.player;
    if (P) {
      let r = Z.darkness > 0 ? 70 : 150;
      if ((P.slots.a1 && P.slots.a1.id === "dawnbringer") || (P.slots.a2 && P.slots.a2.id === "dawnbringer")) r += 70;
      hole0(P.x + P.w / 2, P.y + 10, r, 0.95);
    }
    if (Z.darkness > 0) return;
    const k = ck || 1, hole = k < 1 ? (x, y, r, a) => hole0(x, y, r, a * k) : hole0, cone = k < 1 ? (x, y, w, h, a) => cone0(x, y, w, h, a * k) : cone0, holeC = k < 1 ? (x, y, r, a, col) => holeC0(x, y, r, a * (col ? k : 1), col) : holeC0;
    for (const d of lv.lights) { const f = 1 + Math.sin(t * 9 + d.x) * 0.06 + Math.sin(t * 23 + d.y) * 0.04; const big = HOLE_BIG[d.kind] || (d.kind === "mushroom" ? 40 : d.kind === "window" ? 60 : d.kind === "candle" ? 34 : 70); hole(d.x * T + 8, d.y * T + (d.kind === "torch" ? -6 : 6), big * f, d.kind === "window" ? 0.6 : 0.9);
      if (d.kind === "chandelier" || d.kind === "lantern") cone(d.x * T + 8, d.y * T + 10, 90 * f, 130, 0.45); }
    for (const h of Z.hazards) if (h.kind === "fire" || h.kind === "column" || h.kind === "strike" || (h.kind === "breath")) hole(h.x, h.y - 10, 60, 0.8);
    for (const p of Z.projs) if (p.k.glow || p.kind === "lichtwelle" || p.kind === "e_feuerball") hole(p.x, p.y, 40, 0.8);
    for (const e of Z.enemies) if (!e.dead && !(e.hidden > 0)) { const big = e.def.glow || e.def.shape === "wisp" || e.def.boss || e.elite; hole(e.x + e.w / 2, e.y + e.h / 2, e.def.boss ? 150 : big ? 50 : 30 + e.h * 0.4, big ? 0.75 : 0.5); }
    for (const p of Z.pickups) if (p.kind === "item" || p.kind === "chest" || p.kind === "scroll") hole(p.x, p.y - 8, 40, 0.6);
    for (const d of lv.doors) if (d.kind === "exit" || d.kind === "gate") hole(d.x * T + 8, d.y * T, 50, 0.7);
    for (const s of lv.props) if (s.kind === "npc" || s.kind === "station") hole(s.x * T + 8, s.y * T, 60, 0.6);
    /* Lava leuchtet selbst: ihre Oberfläche reißt die Dunkelheit auf */
    for (let i = 0; i < G.lavaN; i += 3) { const a0 = G.lava[i], a1 = G.lava[i + 1], y = G.lava[i + 2] * T + 4; for (let x = a0; x <= a1; x += 2) hole(x * T + T, y, 58, 0.55); }
    for (const f of FLASH) hole(f.x, f.y, f.r * 0.8, Math.min(0.9, f.a * (1 - f.t / f.life)));
    if (Z.lightExtra) Z.lightExtra(holeC);
  }
  function lightSprites() {
    if (G.holeSpr) return;
    /* weicher Lichtkreis (fast quadratischer Abfall, kein harter Rand) – schwarz zum Ausschneiden, weiß zum Aufhellen */
    const mkHole = col => { const s = document.createElement("canvas"); s.width = s.height = 64; const h = s.getContext("2d"), g = h.createRadialGradient(32, 32, 0, 32, 32, 32);
      for (const [o, a] of [[0, 1], [0.2, 0.93], [0.4, 0.72], [0.6, 0.42], [0.8, 0.15], [1, 0]]) g.addColorStop(o, "rgba(" + col + "," + a + ")"); h.fillStyle = g; h.fillRect(0, 0, 64, 64); return s; };
    /* Lichtkegel nach unten (Laternen, Kronleuchter) */
    const mkCone = col => { const s = document.createElement("canvas"); s.width = 64; s.height = 96; const k = s.getContext("2d"), kg = k.createRadialGradient(32, 0, 0, 32, 0, 96);
      kg.addColorStop(0, "rgba(" + col + ",.9)"); kg.addColorStop(0.5, "rgba(" + col + ",.4)"); kg.addColorStop(1, "rgba(" + col + ",0)"); k.fillStyle = kg; k.beginPath(); k.moveTo(26, 0); k.lineTo(38, 0); k.lineTo(64, 96); k.lineTo(0, 96); k.closePath(); k.fill(); return s; };
    G.holeSpr = mkHole("0,0,0"); G.coneSpr = mkCone("0,0,0"); G.holeW = mkHole("255,255,255"); G.coneW = mkCone("255,255,255");
  }
  function lightPass(c, cam, W, H, camX, camY) {
    const dark = Z.darkness > 0 ? 0.93 : B.dark * 0.82 + (Z.run && Z.run.skulls ? Z.run.skulls * 0.02 : 0);
    const lvl = lq(), t = G.time, dt = Math.min(0.1, Math.max(0, t - (G.lightT == null ? t : G.lightT))); G.lightT = t;
    /* gleiche Kameralage wie die Welt (inkl. Wackeln), damit Lichtkreise und Sichtnebel nicht verrutschen */
    if (camX != null) cam = { x: camX, y: camY, w: cam.w, h: cam.h };
    if (lvl >= 1 && !G.off.color) { gather(cam, t, lvl, dt); return mulPass(c, cam, W, H, dark, lvl); }
    LQn = 0; EXT.length = 0; for (let i = FLASH.length - 1; i >= 0; i--) { FLASH[i].t += dt; if (FLASH[i].t >= FLASH[i].life) FLASH.splice(i, 1); }
    return darkPass(c, cam, W, H, dark);
  }
  function lightCanvas(W, H) {
    const LD = (Z.gq && Z.gq.light) || 4; if (!G.light || G.light.width !== Math.ceil(W / LD) || G.light.height !== Math.ceil(H / LD)) { G.light = document.createElement("canvas"); G.light.width = Math.ceil(W / LD); G.light.height = Math.ceil(H / LD); G.lc = G.light.getContext("2d"); }
    return G.lc;
  }
  function overlays(l, cam, sx, sy) {
    l.globalAlpha = 1; l.globalCompositeOperation = "source-over";
    for (const f of G.lightOver) { try { f(l, cam.x, cam.y, sx, sy, G.light.width, G.light.height); } catch (e) { console.error(e); } l.globalAlpha = 1; l.globalCompositeOperation = "source-over"; }
    if (!Z.gq || Z.gq.vignette !== false) { vigSprite(); l.drawImage(G.vig, 0, 0, G.light.width, G.light.height); }
    G.lightFrame = G.frame;
  }
  /* Stufe 0 (Handheld): klassische Dunkelheitskarte – Löcher ausgeschnitten, „source-over“ über die Szene (unverändert) */
  /* Handheld (lean, Runde 15): Dunkelheit und Lichtlöcher nur jedes 2. Bild neu in eine Grundkarte; dazwischen wird
     die Grundkarte um die Kamerabewegung verschoben übernommen. Überlagerungen (Sichtnebel) laufen weiter je Bild. */
  let dpBase = null, dpCam = null, dpFrame = -9, dpKey = "";
  function darkPass(c, cam, W, H, dark) {
    if (dark < 0.05) return false;
    const l = lightCanvas(W, H), sx = G.light.width / cam.w, sy = G.light.height / cam.h, t = G.time;
    const lean = Z.gq && Z.gq.lean && !(G.off && G.off.lichtVoll), key = G.light.width + "x" + G.light.height + "|" + (lv && lv.seed) + "|" + dark.toFixed(3);
    if (lean && dpBase && dpKey === key && G.frame - dpFrame === 1 && !(Z.flashLight > 0) && !FLASH.length) {
      l.globalCompositeOperation = "copy"; l.globalAlpha = 1; l.drawImage(dpBase, (dpCam.x - cam.x) * sx, (dpCam.y - cam.y) * sy); l.globalCompositeOperation = "source-over";
      /* Ränder, die durch die Verschiebung frei werden, mit Dunkelheit füllen */
      l.globalCompositeOperation = "destination-over"; l.fillStyle = "rgba(" + G.darkRGB + "," + dark + ")"; l.fillRect(0, 0, G.light.width, G.light.height); l.globalCompositeOperation = "source-over";
      overlays(l, cam, sx, sy);
      c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.imageSmoothingEnabled = true; c.drawImage(G.light, 0, 0, W, H); c.restore();
      return true;
    }
    l.globalCompositeOperation = "source-over"; l.clearRect(0, 0, G.light.width, G.light.height);
    if (G.darkCol !== B.ambCol) { G.darkCol = B.ambCol; const n = parseInt((B.ambCol || "#202020").slice(1), 16); const r0 = (n >> 16) & 255, g0 = (n >> 8) & 255, b0 = Math.min(n & 255, Math.max(r0 * 1.15, g0)); /* R19: kein Blaustich im Dunkel (Hafen #2a2a3a) */ G.darkRGB = [(r0 * 0.12) | 0, (g0 * 0.12) | 0, (b0 * 0.12) | 0].join(","); }
    l.fillStyle = "rgba(" + G.darkRGB + "," + dark + ")"; l.fillRect(0, 0, G.light.width, G.light.height);
    l.globalCompositeOperation = "destination-out"; lightSprites();
    const hole = (x, y, r, a) => { const X = (x - cam.x) * sx, Y = (y - cam.y) * sy, Rr = r * sx; if (X < -Rr || Y < -Rr || X > G.light.width + Rr || Y > G.light.height + Rr) return; l.globalAlpha = a; l.drawImage(G.holeSpr, X - Rr, Y - Rr, Rr * 2, Rr * 2); };
    const cone = (x, y, w, hh, a) => { const X = (x - cam.x) * sx, Y = (y - cam.y) * sy, Ww = w * sx, Hh = hh * sy; if (X < -Ww || X > G.light.width + Ww || Y > G.light.height || Y < -Hh) return; l.globalAlpha = a; l.drawImage(G.coneSpr, X - Ww / 2, Y, Ww, Hh); };
    cutHoles(hole, cone, hole, t);
    if (Z.darkness <= 0 && Z.flashLight > 0) { l.globalAlpha = 1; l.fillStyle = "rgba(0,0,0," + Z.flashLight + ")"; l.fillRect(0, 0, G.light.width, G.light.height); }
    if (lean) { if (!dpBase || dpBase.width !== G.light.width || dpBase.height !== G.light.height) { dpBase = document.createElement("canvas"); dpBase.width = G.light.width; dpBase.height = G.light.height; } const bc = dpBase.getContext("2d"); bc.globalCompositeOperation = "copy"; bc.globalAlpha = 1; bc.drawImage(G.light, 0, 0); dpCam = dpCam || {}; dpCam.x = cam.x; dpCam.y = cam.y; dpFrame = G.frame; dpKey = key; }
    overlays(l, cam, sx, sy);
    c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.imageSmoothingEnabled = true; c.drawImage(G.light, 0, 0, W, H); c.restore();
    return true;
  }
  /* Stufe 1–3: EINE Lichtkarte, die mit „multiply“ über der Szene liegt. Sie beginnt mit dem Umgebungslicht
     (1 − Dunkelheit, getönt mit der Farbstimmung des Gebiets: Schatten kühl-violett, oben wärmer …), Lichtquellen
     hellen sie weiß auf (wie die alten Löcher), farbige Lichter addieren ihre Farbe, Mondlicht legt sich silbrig
     darüber. So werden Wände, Boden und Figuren in der Lichtfarbe beleuchtet, Lichter mischen sich – und es kostet
     nicht mehr als die alte Dunkelheitskarte. Überlagerungen anderer Module (Sichtnebel, Regen, Vignette) malen
     weiterhin dunkel mit „source-over“ hinein und wirken damit genauso abdunkelnd wie zuvor. */
  const HOLE_K = 0.86, HOLE_C = 0.42, COL_K = 1.1, TINT_K = 0.5;
  /* Hilfskarten in halber Auflösung der Lichtkarte: A sammelt alles Additive (Aufhellung, Mond, Runenwellen,
     farbige Lichter), T alle Farbtönungen (Produkt, weiß = neutral). Lichtflecken sind weich – in halber Auflösung
     sehen sie gleich aus, kosten aber nur ein Viertel der Pixel. Mathematisch dasselbe wie vorher direkt in der
     Karte: „lighter“ ist eine Summe, „multiply“ ein Produkt; beide werden je mit EINER Kopie aufgetragen. */
  function subCanvas(k, LW, LH) {
    const w = Math.max(8, Math.ceil(LW / 2)), h = Math.max(6, Math.ceil(LH / 2));
    let cv = G[k];
    if (!cv || cv.width !== w || cv.height !== h) { cv = G[k] = document.createElement("canvas"); cv.width = w; cv.height = h; }
    return cv;
  }
  function mulPass(c, cam, W, H, dark, lvl) {
    const l = lightCanvas(W, H), LW = G.light.width, LH = G.light.height, t = G.time;
    lightSprites();
    const A = subCanvas("lightA", LW, LH), a2 = A.getContext("2d"), AW = A.width, AH = A.height, sx = AW / cam.w, sy = AH / cam.h;
    /* Umgebungslicht: Farbstimmung (weiß = neutral) × (1 − Dunkelheit) */
    l.globalCompositeOperation = "source-over"; l.globalAlpha = 1;
    const base = G.colorBase ? G.colorBase() : null;
    if (base) l.drawImage(base, 0, 0, LW, LH); else { l.fillStyle = "#fff"; l.fillRect(0, 0, LW, LH); }
    const amb = Math.max(0, Math.min(1, (1 - dark) * 1.16)), av = (amb * 255) | 0; /* ×1,16 gleicht die Tönung aus */
    l.globalCompositeOperation = "multiply"; l.fillStyle = "rgb(" + av + "," + av + "," + av + ")"; l.fillRect(0, 0, LW, LH);
    /* Aufhellen (wie die alten Löcher, nur additiv weiß): je dunkler das Gebiet, desto mehr holt ein Licht heraus */
    a2.globalCompositeOperation = "source-over"; a2.globalAlpha = 1; a2.clearRect(0, 0, AW, AH);
    a2.globalCompositeOperation = "lighter";
    const hk = Math.max(0.05, dark) * HOLE_K;
    const hole = (x, y, r, a) => { const X = (x - cam.x) * sx, Y = (y - cam.y) * sy, Rr = r * sx; if (X < -Rr || Y < -Rr || X > AW + Rr || Y > AH + Rr) return; a2.globalAlpha = Math.min(1, a * hk); a2.drawImage(G.holeW, X - Rr, Y - Rr, Rr * 2, Rr * 2); };
    const cone = (x, y, w, hh, a) => { const X = (x - cam.x) * sx, Y = (y - cam.y) * sy, Ww = w * sx, Hh = hh * sy; if (X < -Ww || X > AW + Ww || Y > AH || Y < -Hh) return; a2.globalAlpha = Math.min(1, a * hk); a2.drawImage(G.coneW, X - Ww / 2, Y, Ww, Hh); };
    /* hole mit optionaler Farbe (5. Wert) – rückwärtsverträglich für Z.lightExtra */
    const holeC = (x, y, r, a, col) => { hole(x, y, r, a); if (col) pushL(x, y, r * 0.9, colRGB(col), (a == null ? 0.6 : a) * 0.9, 0); };
    cutHoles(hole, cone, holeC, t, HOLE_C);
    /* Mondlicht aus der Levelkarte (silbrig-violett, nie blau) */
    const mm = Z.darkness > 0 || G.off.moon ? null : moonMap();
    if (mm) {
      const x0 = Math.max(0, Math.floor(cam.x / T) - 2), y0 = Math.max(0, Math.floor(cam.y / T) - 2), x1 = Math.min(mm.width, Math.ceil((cam.x + cam.w) / T) + 2), y1 = Math.min(mm.height, Math.ceil((cam.y + cam.h) / T) + 2);
      if (x1 > x0 && y1 > y0) { a2.globalAlpha = Math.min(1, (0.2 + 0.03 * Math.sin(t * 0.21)) * (0.4 + dark) * skyLight().k); a2.imageSmoothingEnabled = true; a2.drawImage(mm, x0, y0, x1 - x0, y1 - y0, (x0 * T - cam.x) * sx, (y0 * T - cam.y) * sy, (x1 - x0) * T * sx, (y1 - y0) * T * sy); }
    }
    /* Blitz: silbrig-violettes Aufleuchten */
    if (Z.darkness <= 0 && Z.flashLight > 0) { a2.globalAlpha = Math.min(1, Z.flashLight); a2.fillStyle = "rgb(" + MOON.join(",") + ")"; a2.fillRect(0, 0, AW, AH); }
    if (lvl >= 2) for (const f of G.colorOver) { a2.globalAlpha = 1; try { f(a2, cam.x, cam.y, sx, sy, AW, AH, t); } catch (e) { console.error(e); } a2.globalCompositeOperation = "lighter"; }
    /* farbige Lichter */
    const ck = COL_K * (0.6 + 0.4 * Math.min(1, dark * 1.6));
    let nT = 0;
    for (let i = 0; i < LQn; i++) {
      const q = LQ[i], X = (q.x - cam.x) * sx, Y = (q.y - cam.y) * sy, R = q.r * sx;
      if (X < -R || Y < -R || X > AW + R || Y > AH + R) continue;
      const a = q.a * ck; a2.globalAlpha = a > 1 ? 1 : a; a2.drawImage(lightSpr(q.c), X - R, Y - R, R * 2, R * 2); nT++;
    }
    a2.globalAlpha = 1;
    l.globalCompositeOperation = "lighter"; l.globalAlpha = 1; l.imageSmoothingEnabled = true; l.drawImage(A, 0, 0, LW, LH);
    /* Tönen: wo die Karte schon (fast) weiß ist, kann Addieren keine Farbe mehr zeigen – darum zusätzlich
       „multiply“ mit dem Farbfleck: Ergebnis = Karte × mix(weiß, Lichtfarbe, Deckkraft). So färbt eine Fackel auch
       die hell erleuchtete Umgebung des Spielers warm, eine Rune violett, ohne sie dunkel zu machen. */
    if (nT && !G.off.tint) {
      const Tn = subCanvas("lightT", LW, LH), t2 = Tn.getContext("2d");
      t2.globalCompositeOperation = "source-over"; t2.globalAlpha = 1; t2.fillStyle = "#fff"; t2.fillRect(0, 0, AW, AH);
      t2.globalCompositeOperation = "multiply";
      for (let i = 0; i < LQn; i++) {
        const q = LQ[i], X = (q.x - cam.x) * sx, Y = (q.y - cam.y) * sy, R = q.r * sx * 0.9;
        if (X < -R || Y < -R || X > AW + R || Y > AH + R) continue;
        const a = q.a * TINT_K; t2.globalAlpha = a > 1 ? 1 : a; t2.drawImage(lightSpr(q.c), X - R, Y - R, R * 2, R * 2);
      }
      t2.globalAlpha = 1;
      l.globalCompositeOperation = "multiply"; l.drawImage(Tn, 0, 0, LW, LH);
    }
    overlays(l, cam, LW / cam.w, LH / cam.h);
    c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.imageSmoothingEnabled = true;
    c.globalCompositeOperation = "multiply"; c.drawImage(G.light, 0, 0, W, H);
    if (lvl >= 2 && !G.off.bloom) bloom(c, cam, W, H, t);
    c.restore();
    return true;
  }
  /* Schein um helle Quellen (Bloom-Andeutung) und nasse Spiegelungen – additiv, klein, nur wo sichtbar */
  const IDM = new DOMMatrix();
  function bloom(c, cam, W, H, t) {
    c.globalCompositeOperation = "lighter";
    const k = W / cam.w, wet = wetness(), sight = Z.sightAt;
    for (let i = 0; i < LQn; i++) {
      const q = LQ[i]; if (!q.b) continue;
      const X = (q.x - cam.x) * k, Y = (q.y - cam.y) * k, R = q.b * k * (0.85 + 0.15 * Math.min(1, q.a * 2));
      if (X < -R * 3 || Y < -R * 3 || X > W + R * 3 || Y > H + R * 3) continue;
      const sv = sight ? Math.min(1, sight(q.x, q.y) * 1.5) : 1; if (sv < 0.05) continue;
      c.globalAlpha = Math.min(1, q.a * 0.34 * sv); G.drawScaled(c, lightSpr(q.c), X - R, Y - R, R * 2, R * 2, IDM);
      if (wet > 0) {
        const fy = floorUnder(q.x, q.y); if (fy == null) continue;
        const Fy = (fy - cam.y) * k, d = (fy - q.y) / 90, ww = (6 + q.b * 0.3) * k, hh = (16 + q.b * 0.9) * k * (1 - d * 0.4);
        if (d > 1) continue;
        c.globalAlpha = Math.min(1, q.a * 0.5 * wet * (1 - d) * sv * (0.85 + 0.15 * Math.sin(t * 3.1 + q.x)));
        G.drawScaled(c, lightSpr(q.c), X - ww / 2, Fy - hh * 0.12, ww, hh, IDM);
      }
    }
    c.globalAlpha = 1;
  }
  /* Nässe: Regen/Nieselregen, nasses Mauerwerk (Keller, Verlies, Hafen, See) oder Regenstimmung aus wetter.js */
  function wetness() {
    const w = B.weather || [], wt = Z.wetter ? Z.wetter() : null;
    if (w.includes("rain") || (wt && (wt.mood === "regen" || wt.mood === "gewitter"))) return 1;
    if (w.includes("drizzle")) return 0.75;
    return styleOf().wet ? 0.45 : 0;
  }
  /* Bodenhöhe unter einem Punkt (höchstens 6 Kacheln tief), je Kachelspalte zwischengespeichert */
  const FLOORC = new Map(); let floorPR = null;
  function floorUnder(x, y) {
    if (floorPR !== PR) { FLOORC.clear(); floorPR = PR; }
    const tx = Math.floor(x / T), ty = Math.floor(y / T), key = tx * 4096 + ty;
    let v = FLOORC.get(key);
    if (v === undefined) { v = null; for (let k = 0; k <= 6; k++) { const g = lv.get(tx, ty + k); if (solidV(g) || isPlatV(g) || g === 6) { v = (ty + k) * T + (g === 6 ? 5 : 0); break; } } if (FLOORC.size > 4000) FLOORC.clear(); FLOORC.set(key, v); }
    return v;
  }
  /* Vignette im Ton des Gebiets (tiefes Violett/Braun statt reinem Schwarz) */
  function vigSprite() {
    const key = (B && B.ambCol) || "";
    if (!G.vig || G.vigKey !== key) {
      G.vigKey = key; G.vig = G.vig || document.createElement("canvas"); G.vig.width = 160; G.vig.height = 90; const v = G.vig.getContext("2d"); v.clearRect(0, 0, 160, 90);
      const n = parseInt((key || "#202020").slice(1), 16), r = ((n >> 16) * 0.25) | 0, g = (((n >> 8) & 255) * 0.18) | 0, b = ((n & 255) * 0.25) | 0;
      const vg = v.createRadialGradient(80, 45, 36, 80, 45, 94); vg.addColorStop(0, "rgba(" + r + "," + g + "," + b + ",0)"); vg.addColorStop(0.55, "rgba(" + r + "," + g + "," + b + ",.12)"); vg.addColorStop(1, "rgba(" + r + "," + g + "," + b + ",.48)"); v.fillStyle = vg; v.fillRect(0, 0, 160, 90);
    }
    return G.vig;
  }
  /* true, wenn die Lichtkarte dieses Bildes schon die Überlagerungen enthält */
  G.lightMerged = () => G.lightFrame === G.frame;

  /* ======================= WETTER & STIMMUNG ======================= */
  G.weather = function (dt) {
    if (!B || !Z.player) return;
    const cam = Z.cam, w = (B.weather || []).filter(k => !Z.gq || Z.gq.weather !== false || k === "lightning");
    Z.windX = w.includes("wind") ? 30 + Math.sin(G.time * 0.4) * 20 : w.includes("rain") ? 15 : 0;
    const spawn = (n, fn) => { let k = n * dt; while (k > 0) { if (Math.random() < k) fn(); k -= 1; } };
    for (const kind of w) {
      switch (kind) {
        case "dust": spawn(4, () => FX.p({ x: cam.x + Math.random() * cam.w, y: cam.y + Math.random() * cam.h, vx: (Math.random() - 0.5) * 6 + (Z.windX || 0) * 0.3, vy: (Math.random() - 0.5) * 4, life: 4, size: 0.8, col: "rgba(255,240,220,.35)", drag: 1, shrink: false })); break;
        case "drip": spawn(3, () => { const x = cam.x + Math.random() * cam.w, y = cam.y + Math.random() * cam.h * 0.5; if (Z.world.solidAt(x, y - 4)) FX.p({ x, y, vx: 0, vy: 0, g: 600, life: 1.5, size: 2, col: "rgba(170,200,190,.7)", kind: "drop", collide: true, drag: 1 }); }); break;
        case "embers": case "sparks": spawn(kind === "sparks" ? 4 : 6, () => FX.p({ x: cam.x + Math.random() * cam.w, y: cam.y + cam.h + 4, vx: (Math.random() - 0.5) * 20 + (Z.windX || 0) * 0.4, vy: -20 - Math.random() * 40, life: 3 + Math.random() * 2, size: 1.2, col: Math.random() < 0.3 ? "#ffd27a" : "#ff7a2a", kind: "glow", add: true, drag: 1 })); break;
        case "ash": spawn(8, () => FX.p({ x: cam.x + Math.random() * (cam.w + 60) - 30, y: cam.y - 4, vx: (Z.windX || 0) * 0.6 + (Math.random() - 0.5) * 10, vy: 15 + Math.random() * 15, life: 6, size: 1.2, col: "rgba(150,140,140,.6)", drag: 1, shrink: false })); break;
        case "rain": case "drizzle": spawn(kind === "rain" ? 140 : 35, () => FX.p({ x: cam.x + Math.random() * (cam.w + 80) - 40, y: cam.y - 6, vx: -40 - (Z.windX || 0), vy: 420 + Math.random() * 80, life: 0.9, size: 1, col: "rgba(200,220,210,.35)", kind: "rain", drag: 1, collide: true })); break;
        case "leaves": spawn(1.2, () => FX.p({ x: cam.x - 4, y: cam.y + Math.random() * cam.h * 0.6, vx: 30 + Math.random() * 30 + (Z.windX || 0), vy: 10, life: 8, size: 2, col: Math.random() < 0.5 ? "#8a5a2a" : "#6a4a20", kind: "leaf", drag: 0.995, vr: 3 })); break;
        case "feathers": spawn(0.6, () => FX.p({ x: cam.x + Math.random() * cam.w, y: cam.y - 4, vx: (Math.random() - 0.5) * 20, vy: 12, life: 9, size: 2, col: "#e8e0d0", kind: "leaf", drag: 0.99, vr: 2 })); break;
        case "spores": spawn(4, () => FX.p({ x: cam.x + Math.random() * cam.w, y: cam.y + cam.h, vx: (Math.random() - 0.5) * 8, vy: -10 - Math.random() * 10, life: 7, size: 1.2, col: Math.random() < 0.5 ? "rgba(190,110,255,.8)" : "rgba(130,230,120,.8)", kind: "glow", add: true, drag: 1 })); break;
        case "fireflies": spawn(0.8, () => FX.p({ x: cam.x + Math.random() * cam.w, y: cam.y + cam.h * (0.4 + Math.random() * 0.5), vx: (Math.random() - 0.5) * 10, vy: (Math.random() - 0.5) * 10, life: 5, size: 2.4, col: "rgba(230,255,140,.8)", kind: "glow", add: true, drag: 1 })); break;
        case "bubbles": spawn(3, () => FX.p({ x: cam.x + Math.random() * cam.w, y: cam.y + cam.h, vx: (Math.random() - 0.5) * 6, vy: -18 - Math.random() * 14, life: 6, size: 1.6, col: "rgba(180,230,210,.6)", kind: "bubble", drag: 1 })); break;
        case "fog": break;
        case "smoke": spawn(1.5, () => FX.p({ x: cam.x + Math.random() * cam.w, y: cam.y + cam.h + 10, vx: (Math.random() - 0.5) * 6, vy: -8, life: 8, size: 14, col: "rgba(60,40,36,.25)", kind: "smoke", drag: 1 })); break;
        case "gulls": break;
        case "lightning":
          G.lt = (G.lt || 4) - dt;
          if (G.lt <= 0) { G.lt = 5 + Math.random() * 9; Z.flashLight = 0.9; Z.audio.play("thunder", { vol: 0.4, delay: 0.3 + Math.random() * 0.5 }); }
          break;
      }
    }
    if (Z.flashLight > 0) Z.flashLight = Math.max(0, Z.flashLight - dt * 2.5);
  };
  function fog(c, cam) {
    if (!(B.weather || []).includes("fog") || (Z.gq && Z.gq.fog === false)) return;
    if (!G.fogStrip) { const f = G.fogStrip = document.createElement("canvas"); f.width = 4; f.height = 40; const g = f.getContext("2d"), gr = g.createLinearGradient(0, 0, 0, 40); gr.addColorStop(0, "rgba(180,190,180,0)"); gr.addColorStop(0.5, "rgba(180,190,180,.7)"); gr.addColorStop(1, "rgba(180,190,180,0)"); g.fillStyle = gr; g.fillRect(0, 0, 4, 40); }
    /* die Bahnen sind waagerecht gleichförmig: nur der sichtbare Teil, ohne Verlauf je Bild */
    c.save(); c.globalAlpha = 0.18;
    for (let i = 0; i < 4; i++) { const y = cam.y + cam.h * (0.55 + i * 0.12); c.drawImage(G.fogStrip, cam.x - 2, y - 20, cam.w + 4, 40); }
    c.restore();
  }

  /* ======================= VORDERGRUND DARF NIE STÖREN =======================
     Spielrelevante Rechtecke (Spieler, Gegner, Geschosse, Gefahren, Truhen/Gegenstände, Türen, Stationen) in
     Kamerakoordinaten (Welt − Kamera; der Vordergrund zeichnet mit setTransform(S,0,0,S,0,0)). Für jedes
     Vordergrundelement liefert G.fgAlpha(key, x, y, w, h, base) die Deckkraft: liegt etwas Wichtiges darunter
     oder in der Nähe (~40 Bildpunkte Rand), blendet es in ~0,25 s auf höchstens 0,12 aus. */
  let fgBoxes = null, fgBoxFrame = -1, fgT = 0, fgDt = 0;
  const fgState = new Map();
  function fgCollect() {
    if (fgBoxFrame === G.frame) return fgBoxes;
    fgBoxFrame = G.frame; const now = performance.now(); fgDt = fgT ? Math.min(0.1, (now - fgT) / 1000) : 0.016; fgT = now;
    const cam = Z.cam, cx = cam.x, cy = cam.y, out = [], vis = (x, y, w, h) => x + w > -60 && x < cam.w + 60 && y + h > -60 && y < cam.h + 60;
    const add = (x, y, w, h) => { x -= cx; y -= cy; if (vis(x, y, w, h)) out.push(x, y, w, h); };
    const P = Z.player; if (P && !P.dead) add(P.x - 6, P.y - 10, P.w + 12, P.h + 14);
    for (const e of Z.enemies) if (!e.dead && !(e.hidden > 0)) add(e.x, e.y, e.w, e.h);
    for (const p of Z.projs) if (p.owner === "e") add(p.x - 6, p.y - 6, 12, 12);
    for (const h of Z.hazards) { const w = h.w || 24, hh = h.h || 20; add(h.x - w / 2, h.y - hh, w, hh); }
    for (const p of Z.pickups) add(p.x - 9, p.y - 16, 18, 18);
    if (Z.gadgets) for (const g of Z.gadgets) if (g && g.x != null) add(g.x - 8, g.y - 8, (g.w || 16), (g.h || 16));
    if (lv) {
      if (lv.doors) for (const d of lv.doors) if (d.kind !== "entry") add(d.x * T - 8, d.y * T - 40, 32, 56);
      if (lv.props) for (const s2 of lv.props) if (s2.kind === "npc" || s2.kind === "station") add(s2.x * T - 12, s2.y * T - 24, 40, 40);
    }
    return (fgBoxes = out);
  }
  G.fgAlpha = function (key, x, y, w, h, base) {
    const b = fgCollect(), m = 40 / (G.scale || 2);
    let hit = false;
    for (let i = 0; i < b.length; i += 4) if (b[i] < x + w + m && b[i] + b[i + 2] > x - m && b[i + 1] < y + h + m && b[i + 1] + b[i + 3] > y - m) { hit = true; break; }
    let st = fgState.get(key); if (st == null) st = hit ? 1 : 0;
    st += ((hit ? 1 : 0) - st) * Math.min(1, fgDt / 0.08); /* ~0,25 s bis fast ganz übergeblendet */
    if (Math.abs(st - (hit ? 1 : 0)) < 0.01) st = hit ? 1 : 0;
    if (fgState.size > 400) fgState.clear(); fgState.set(key, st);
    return base + (Math.min(base, 0.12) - base) * st;
  };

  /* ======================= GESAMTBILD ======================= */
  G.render = function (c, W, H, dt) {
    G.time += dt; G.frame++;
    const cam = Z.cam, t = G.time;
    if (!lv || !B) return;
    const S = G.scale;
    const ox = Math.round((-cam.x + FX.shakeX) * S) / S, oy = Math.round((-cam.y + FX.shakeY) * S) / S;
    c.setTransform(S, 0, 0, S, ox * S, oy * S);
    const pf = Z.prof, tm = pf ? () => performance.now() : null; let t0 = pf ? tm() : 0;
    const mark = k => { if (pf) { c.getImageData(0, 0, 1, 1); const n = tm(); pf[k] = (pf[k] || 0) + n - t0; t0 = n; } };
    const lay = !Z.gq || Z.gq.layers !== false;
    if (Z.noLayers) {} else if (lay && (B.open || lv.out || lv.hub || lv.arena)) { drawLayers(c, cam); if (!Z.gq || Z.gq.critters !== false) { updCritters(dt, cam); drawCritters(c, cam); } } else { c.fillStyle = B.wall; c.fillRect(cam.x - 2, cam.y - 2, cam.w + 4, cam.h + 4); } mark("layers");
    /* Riesen im Hintergrund (Demogorgon im Herz des Sees): hinter Boden und Plattformen */
    Z.drawBehindTiles && Z.drawBehindTiles(c, cam, t);
    drawTiles(c, cam); mark("tiles");
    drawLiquids(c, cam, t);
    drawDecor(c, cam, t);
    Z.drawMidLife && Z.drawMidLife(c, cam, t); mark("decor");
    drawDoors(c, t);
    Z.drawWorldProps && Z.drawWorldProps(c, t);
    pickupBack(c, t); Z.drawPickups(c, t); pickupFront(c, t);
    Z.drawHazards(c, t);
    Z.drawParcours && Z.drawParcours(c, t); mark("misc");
    for (const e of Z.enemies) if (e.def.boss && e.def.shape === "demogorgon") Z.drawEnemy(c, e, t);
    FX.draw(c, false);
    for (const a of Z.allies) Z.drawAlly(c, a, t);
    for (const e of Z.enemies) if (!(e.def.boss && e.def.shape === "demogorgon")) { if (e.x > cam.x - 80 && e.x < cam.x + cam.w + 80 && e.y > cam.y - 120 && e.y < cam.y + cam.h + 80) Z.drawEnemy(c, e, t); }
    mark("enemies");
    Z.drawBeforePlayer && Z.drawBeforePlayer(c);
    if (Z.player) Z.drawPlayer(c, Z.player, t);
    Z.drawProjs(c);
    Z.drawGadgets && Z.drawGadgets(c, t);
    FX.drawSmears(c);
    FX.draw(c, true); mark("fx");
    fog(c, cam);
    const merged = lightPass(c, cam, W, H, -ox, -oy); mark("light");
    Z.drawAfterLight && Z.drawAfterLight(c, cam, W, H, t);
    if (pkFly.length) pkFlyDraw(c); else pkT = G.time;
    /* Bildschirmblitz und Vignette */
    c.setTransform(1, 0, 0, 1, 0, 0);
    if (FX.flash > 0 && Z.settings.flashes) { c.globalAlpha = FX.flash * 0.6; c.fillStyle = FX.flashCol; c.fillRect(0, 0, W, H); c.globalAlpha = 1; }
    const P = Z.player;
    if (P && P.hp < P.hpMax * 0.3 && !P.dead) { if (!G.vigR) { G.vigR = document.createElement("canvas"); G.vigR.width = 160; G.vigR.height = 90; const v = G.vigR.getContext("2d"); const g = v.createRadialGradient(80, 45, 26, 80, 45, 84); g.addColorStop(0, "rgba(140,0,0,0)"); g.addColorStop(1, "rgba(140,0,0,1)"); v.fillStyle = g; v.fillRect(0, 0, 160, 90); } c.globalAlpha = (0.3 - P.hp / P.hpMax) / 0.3 * (0.6 + 0.2 * Math.sin(t * 5)); c.drawImage(G.vigR, 0, 0, W, H); c.globalAlpha = 1; }
    if (!merged && (!Z.gq || Z.gq.vignette !== false)) c.drawImage(vigSprite(), 0, 0, W, H);
    if (pf) { c.getImageData(0, 0, 1, 1); const n = performance.now(); pf.post = (pf.post || 0) + n - t0; }
  };
})();
