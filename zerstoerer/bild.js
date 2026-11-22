/* Ezekiel – The Destroyer · Bild
   Hintergründe mit Parallaxe (je Gebiet eigene Szenerie), Kacheln (zwischengespeichert pro Raum), Requisiten, Licht und Wetter. */
(function () {
  "use strict";
  const Z = window.Z, U = Z.U, T = Z.TILE, FX = Z.fx, D = Z.draw;
  const G = (Z.gfx = { scale: 2, bs: 2, chunks: new Map(), layers: null, light: null, time: 0 });
  let lv = null, B = null;

  /* Farbe aufhellen/abdunkeln (#rrggbb) */
  function shade(hex, f) { const n = parseInt(hex.slice(1), 16); let r = n >> 16, g = (n >> 8) & 255, b = n & 255; if (f > 0) { r += (255 - r) * f; g += (255 - g) * f; b += (255 - b) * f; } else { r *= 1 + f; g *= 1 + f; b *= 1 + f; } return "rgb(" + (r | 0) + "," + (g | 0) + "," + (b | 0) + ")"; }
  function mix(a, b, t) { const A = parseInt(a.slice(1), 16), Bb = parseInt(b.slice(1), 16); const r = ((A >> 16) * (1 - t) + (Bb >> 16) * t) | 0, g = (((A >> 8) & 255) * (1 - t) + ((Bb >> 8) & 255) * t) | 0, bl = ((A & 255) * (1 - t) + (Bb & 255) * t) | 0; return "rgb(" + r + "," + g + "," + bl + ")"; }
  Z.shade = shade;
  /* Pseudozufall aus Koordinaten (stabil) */
  const hash = (x, y) => { let h = (x * 374761393 + y * 668265263) ^ 0x5bd1e995; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };

  G.setLevel = function (level, biome) {
    lv = level; B = biome; G.chunks.clear(); G.layers = null;
    Z.dustCol = shade(B.tile.light, -0.15); Z.tileCol = B.tile.base;
    /* Innen/Außen: Spalten ohne Decke zeigen den Himmel */
    G.sky = new Uint8Array(lv.W * lv.H);
    if (lv.out) for (let x = 0; x < lv.W; x++) for (let y = 0; y < lv.H; y++) { if (y > 0 && (lv.get(x, y) === 1 || lv.get(x, y) === 7)) break; G.sky[y * lv.W + x] = 1; }
    if (lv.hub || (lv.arena && lv.out)) for (let x = 0; x < lv.W; x++) for (let y = 0; y < lv.H - 3; y++) if (lv.get(x, y) !== 1 || lv.hub) G.sky[y * lv.W + x] = lv.get(x, y) === 1 && !lv.hub ? 0 : 1;
    G.buildLayers();
  };
  Z.dirtyTiles = (tx, ty) => { for (const k of [...G.chunks.keys()]) G.chunks.delete(k); };

  /* ======================= PARALLAXE ======================= */
  const LW = 640; /* Breite einer Kachel des Hintergrunds (wiederholt sich) */
  G.buildLayers = function () {
    if (!B) return;
    const H = Math.ceil((Z.cam.h + 120));
    const mk = s => { const cv = document.createElement("canvas"); cv.width = Math.ceil(LW * s); cv.height = Math.ceil(H * s); const c = cv.getContext("2d"); c.scale(s, s); return { cv, c, s, H }; };
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
  function paintBg(kind, f, m, H, R) {
    const sky = B.sky;
    switch (kind) {
      case "castle": case "ramparts": case "harbour": case "spires": case "storm": case "camp": {
        /* Sterne, Mond, Wolken */
        if (kind !== "spires" && kind !== "storm") for (let i = 0; i < 90; i++) { f.fillStyle = "rgba(255,240,230," + (0.2 + R() * 0.6) + ")"; const sz = R() < 0.1 ? 1.4 : 0.8; f.fillRect(R() * LW, R() * H * 0.6, sz, sz); }
        if (kind === "castle" || kind === "harbour" || kind === "camp" || kind === "ramparts") { const mx = 380, my = 50; D.glow(f, mx, my, 60, "rgba(255,230,200,.25)"); D.circ(f, mx, my, 14, "#f0e6d4"); D.circ(f, mx - 4, my - 3, 3, "#d8ccb8"); D.circ(f, mx + 5, my + 4, 2, "#d8ccb8"); }
        if (kind === "spires") { for (let i = 0; i < 14; i++) { const x = R() * LW, y = 30 + R() * 120; repeatDraw(f, () => D.ell(f, x, y, 40 + R() * 60, 6 + R() * 8, "rgba(255,120,60," + (0.08 + R() * 0.1) + ")")); } }
        if (kind === "storm") { for (let i = 0; i < 10; i++) { const x = R() * LW, y = 20 + R() * 100; repeatDraw(f, () => D.ell(f, x, y, 60 + R() * 70, 12 + R() * 14, "rgba(30,44,30," + (0.4 + R() * 0.3) + ")")); } }
        /* ferne Berge/Türme */
        f.fillStyle = shade(sky[1], -0.35);
        repeatDraw(f, () => { f.beginPath(); f.moveTo(0, H); for (let x = 0; x <= LW; x += 20) f.lineTo(x, H * 0.62 - Math.sin(x * 0.012) * 26 - Math.sin(x * 0.031 + 2) * 14); f.lineTo(LW, H); f.fill(); });
        const towerCol = shade(sky[1], -0.5);
        for (let i = 0; i < 6; i++) { const x = i * 110 + R() * 40, w = 14 + R() * 14, h = 50 + R() * 80; repeatDraw(f, () => silTower(f, x, H * 0.66, w, h, towerCol, kind === "spires" ? null : "rgba(255,190,110,.7)", R)); }
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
          const col = shade(B.wall, -0.25);
          repeatDraw(m, () => {
            m.fillStyle = col; const top = H * 0.72;
            m.fillRect(0, top, LW, H - top);
            for (let x = 0; x < LW; x += 14) m.fillRect(x, top - 7, 8, 7);
            for (let i = 0; i < 4; i++) { const x = 40 + i * 160; m.fillRect(x, top - 60, 34, 60); for (let k = 0; k < 34; k += 9) m.fillRect(x + k, top - 66, 5, 6); m.fillStyle = "rgba(255,180,90,.55)"; m.fillRect(x + 14, top - 44, 5, 9); m.fillStyle = col; }
          });
        }
        if (kind === "camp") {
          /* Die Feste der Fäden auf dem Hügel, mit Netzfäden */
          repeatDraw(m, () => { m.fillStyle = "#1a1018"; m.beginPath(); m.moveTo(200, H * 0.75); m.quadraticCurveTo(320, H * 0.5, 460, H * 0.75); m.fill(); for (const [x, h, w] of [[290, 90, 16], [318, 120, 20], [350, 80, 14], [372, 60, 12]]) { m.fillRect(x, H * 0.58 - h, w, h); m.beginPath(); m.moveTo(x - 2, H * 0.58 - h); m.lineTo(x + w / 2, H * 0.58 - h - w * 1.4); m.lineTo(x + w + 2, H * 0.58 - h); m.fill(); }
            m.strokeStyle = "rgba(220,210,230,.25)"; m.lineWidth = 0.5; for (let i = 0; i < 9; i++) { m.beginPath(); m.moveTo(328, H * 0.58 - 140); m.lineTo(220 + i * 28, H * 0.75); m.stroke(); }
            for (let r = 20; r < 120; r += 22) { m.beginPath(); for (let i = 0; i <= 9; i++) { const x = U.lerp(328, 220 + i * 28, r / 140), y = U.lerp(H * 0.58 - 140, H * 0.75, r / 140); i ? m.lineTo(x, y) : m.moveTo(x, y); } m.stroke(); }
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
            f.fillStyle = col2; f.beginPath(); f.moveTo(x + 18, H); f.lineTo(x + 18, H * 0.4); f.quadraticCurveTo(x + w / 2, H * 0.08, x + w - 18, H * 0.4); f.lineTo(x + w - 18, H); f.fill();
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
            m.fillStyle = shade(B.wall, -0.15); m.fillRect(x, 0, 20, H); m.fillStyle = shade(B.wall, 0.05); m.fillRect(x, 0, 4, H);
            m.fillStyle = shade(B.wall, -0.2); m.fillRect(x - 4, H * 0.7, 28, 8);
            if (kind === "cellar") for (let k = 0; k < 3; k++) { D.ell(m, x + 60 + k * 20, H * 0.86, 9, 11, "#2a1e16"); m.fillStyle = "#3a2a1c"; m.fillRect(x + 51 + k * 20, H * 0.84, 18, 1.5); }
            if (kind === "halls") { m.fillStyle = "rgba(120,24,30,.8)"; m.fillRect(x + 50, H * 0.12, 22, 70); m.beginPath(); m.moveTo(x + 50, H * 0.12 + 70); m.lineTo(x + 61, H * 0.12 + 80); m.lineTo(x + 72, H * 0.12 + 70); m.fill(); m.fillStyle = "rgba(229,180,84,.7)"; m.fillRect(x + 58, H * 0.12 + 20, 6, 6); }
            if (kind === "dungeon" || kind === "cellar") { m.strokeStyle = "rgba(20,18,16,.9)"; m.lineWidth = 1.2; m.setLineDash([2, 1.5]); m.beginPath(); m.moveTo(x + 70, 0); m.lineTo(x + 70, H * 0.3 + R() * 40); m.stroke(); m.setLineDash([]); }
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
        /* Stalaktiten */
        f.fillStyle = shade(B.wall, -0.4);
        repeatDraw(f, () => { for (let x = 0; x < LW; x += 14) { const h = 20 + hash(x, 3) * 60; f.beginPath(); f.moveTo(x, 0); f.lineTo(x + 7, h); f.lineTo(x + 14, 0); f.fill(); } });
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
  function drawLayers(c, cam) {
    const L = G.layers; if (!L) return;
    c.fillStyle = B.sky[2]; c.fillRect(cam.x - 2, cam.y - 2, cam.w + 4, cam.h + 4);
    const lvH = lv.H * T;
    for (const [layer, px, py] of [[L.far, 0.12, 0.08], [L.mid, 0.32, 0.2]]) {
      const ox = cam.x * (1 - px), oy = cam.y - (cam.y - (lvH - cam.h) * 0.5) * py - 40;
      let x = Math.floor((cam.x - ox) / LW) * LW + ox;
      const y0 = Math.max(oy, cam.y - 2), y1 = Math.min(oy + L.H, cam.y + cam.h + 2);
      if (y1 <= y0) continue;
      for (; x < cam.x + cam.w; x += LW) {
        /* nur den sichtbaren Ausschnitt kopieren */
        const vx0 = Math.max(x, cam.x - 2), vx1 = Math.min(x + LW, cam.x + cam.w + 2); if (vx1 <= vx0) continue;
        const k = layer.s; c.drawImage(layer.cv, (vx0 - x) * k, (y0 - oy) * k, (vx1 - vx0) * k, (y1 - y0) * k, vx0, y0, vx1 - vx0, y1 - y0);
      }
      /* lebendige Ferne zwischen den Ebenen: Wolken, Vögel, Sternschnuppen, Fledermäuse … */
      if (layer === L.far && Z.drawBackLife) Z.drawBackLife(c, cam, G.time, B, oy, L.H);
    }
  }

  /* ======================= KACHELN ======================= */
  const CH_W = 24, CH_H = 14;
  function chunkCanvas(cx, cy) {
    const key = cx + "," + cy;
    let ch = G.chunks.get(key);
    if (ch) return ch;
    if (G.chunks.size > 14) G.chunks.delete(G.chunks.keys().next().value);
    const s = G.bs, cv = document.createElement("canvas");
    cv.width = Math.ceil(CH_W * T * s); cv.height = Math.ceil(CH_H * T * s);
    const c = cv.getContext("2d"); c.scale(s, s); c.translate(-cx * CH_W * T, -cy * CH_H * T);
    paintTiles(c, cx * CH_W, cy * CH_H, CH_W, CH_H);
    ch = { cv }; G.chunks.set(key, ch); return ch;
  }
  /* Öffnungen in der Rückwand: Bogenfenster (draußen), Gewölbe (Keller) oder Höhlenlöcher (Unterreich) */
  function vnoise(x, y) { const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi; const s = t => t * t * (3 - 2 * t); const a = hash(xi, yi), b = hash(xi + 1, yi), c2 = hash(xi, yi + 1), d = hash(xi + 1, yi + 1); return U.lerp(U.lerp(a, b, s(xf)), U.lerp(c2, d, s(xf)), s(yf)); }
  function isWin(x, y) {
    const mode = lv.arena ? "arena" : B.open; if (!mode) return false;
    if (mode === "arena") { if (y > lv.H - 5 || y < 1) return false; return lv.get(x, y) !== 1; }
    if (mode === "arch") { const lx = x % 12, ly = y % 7; if (lx < 2 || lx > 9 || ly < 1 || ly > 5) return false; }
    else if (mode === "vault") { const lx = x % 18, ly = y % 9; if (lx < 4 || lx > 13 || ly < 1 || ly > 7) return false; }
    else if (mode === "cave") { if (vnoise(x / 5.5, y / 4.5) * 0.7 + vnoise(x / 2.2 + 30, y / 2.2) * 0.3 < 0.56) return false; }
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const v = lv.get(x + dx, y + dy); if (v === 1 || v === 7) return false; }
    return true;
  }
  function paintTiles(c, x0, y0, w, h) {
    const tl = B.tile, get = lv.get;
    const solid = v => v === 1 || v === 7;
    const air = (x, y) => !solid(get(x, y));
    /* Rückwand */
    for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) {
      if (solid(get(x, y))) continue;
      if (get(x, y) === 9) { /* Abgrund: Rückwand verliert sich in Schwärze */
        const px = x * T, py = y * T, top = get(x, y - 1) !== 9;
        if (top) { const g = c.createLinearGradient(0, py, 0, py + T); g.addColorStop(0, B.wall); g.addColorStop(1, "#060405"); c.fillStyle = g; c.fillRect(px, py, T, T); c.fillStyle = "rgba(0,0,0,.35)"; c.fillRect(px, py, T, 2); }
        else { c.fillStyle = "#060405"; c.fillRect(px, py, T, T); }
        continue;
      }
      if (G.sky[y * lv.W + x]) continue;
      const px = x * T, py = y * T;
      /* Außengebiete: große Bogenfenster in der Rückwand zeigen den Himmel */
      if (!lv.hub && !lv.passage && isWin(x, y)) {
        if (lv.arena) continue;
        if (B.open === "arch") { const lx = x % 12; if (y % 7 === 1 && (lx === 2 || lx === 9)) { c.fillStyle = B.wall; c.fillRect(px, py, T, T); } else continue; }
        else if (B.open === "vault") { const lx = x % 18; if (y % 9 === 1 && (lx === 4 || lx === 13)) { c.fillStyle = B.wall; c.fillRect(px, py, T, T); } else continue; }
        else continue;
      }
      c.fillStyle = B.wall; c.fillRect(px, py, T, T);
      /* Ziegelmuster */
      c.fillStyle = B.brick;
      const off = (y % 2) * 8;
      c.fillRect(px, py + 7, T, 1); c.fillRect(px + ((off + 0) % 16), py, 1, 7); c.fillRect(px + ((off + 8) % 16), py + 8, 1, 8);
      const r = hash(x, y);
      if (r < 0.12) { c.fillStyle = shade(B.wall, 0.06); c.fillRect(px + 2, py + 1, 5, 5); }
      if (r > 0.94) { c.fillStyle = shade(B.wall, -0.25); c.fillRect(px + 9, py + 9, 4, 4); }
      /* Schatten unter Decken */
      if (solid(get(x, y - 1))) { const g = c.createLinearGradient(0, py, 0, py + 10); g.addColorStop(0, "rgba(0,0,0,.45)"); g.addColorStop(1, "rgba(0,0,0,0)"); c.fillStyle = g; c.fillRect(px, py, T, 10); }
      if (solid(get(x - 1, y))) { c.fillStyle = "rgba(0,0,0,.25)"; c.fillRect(px, py, 4, T); }
      if (solid(get(x + 1, y))) { c.fillStyle = "rgba(0,0,0,.25)"; c.fillRect(px + T - 4, py, 4, T); }
    }
    /* Fels */
    for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) {
      const v = get(x, y); if (!solid(v)) continue;
      if (y === 0 && lv.out) continue;
      /* Fels unter einem Abgrund verschwindet in der Tiefe */
      if (get(x, y - 1) === 9 || (get(x, y - 2) === 9 && solid(get(x, y - 1))) || (get(x, y - 3) === 9 && solid(get(x, y - 1)) && solid(get(x, y - 2)))) { c.fillStyle = "#060405"; c.fillRect(x * T, y * T, T, T); continue; }
      const px = x * T, py = y * T, r = hash(x, y);
      const exposed = air(x, y - 1) || air(x, y + 1) || air(x - 1, y) || air(x + 1, y);
      const deep = !exposed && !air(x - 1, y - 1) && !air(x + 1, y + 1) && !air(x + 1, y - 1) && !air(x - 1, y + 1);
      c.fillStyle = deep ? shade(tl.dark, 0.05) : mix(tl.base, tl.dark, 0.15 + r * 0.25); c.fillRect(px, py, T, T);
      if (deep) { c.fillStyle = shade(tl.dark, -0.18); const o2 = (y % 2) * 8; c.fillRect(px, py + 7.5, T, 0.8); c.fillRect(px + ((o2 + 4) % 16), py, 0.8, 8); c.fillRect(px + ((o2 + 12) % 16), py + 8, 0.8, 8); if (r < 0.15) { c.fillStyle = shade(tl.dark, 0.12); c.fillRect(px + 3, py + 3, 3, 2); } }
      if (!deep) {
        /* Steinblöcke */
        c.fillStyle = shade(tl.base, -0.25); const off = (y % 2) * 8;
        c.fillRect(px, py + 7.5, T, 1); c.fillRect(px + ((off + 4) % 16), py, 1, 8); c.fillRect(px + ((off + 12) % 16), py + 8, 1, 8);
        c.fillStyle = shade(tl.base, 0.08); c.fillRect(px + 1, py + 1, 6, 1); c.fillRect(px + 9, py + 9, 6, 1);
        if (r < 0.2) { c.fillStyle = tl.det; c.globalAlpha = 0.5; c.fillRect(px + 3 + r * 40, py + 3, 2, 2); c.globalAlpha = 1; }
      }
      /* Kanten */
      if (air(x, y - 1)) {
        c.fillStyle = tl.light; c.fillRect(px, py, T, 2); c.fillStyle = shade(tl.light, -0.2); c.fillRect(px, py + 2, T, 1);
        topper(c, tl, px, py, x, y);
      }
      if (air(x, y + 1)) { c.fillStyle = shade(tl.dark, -0.2); c.fillRect(px, py + T - 2, T, 2); }
      if (air(x - 1, y)) { c.fillStyle = shade(tl.light, -0.3); c.fillRect(px, py, 1.5, T); }
      if (air(x + 1, y)) { c.fillStyle = shade(tl.dark, -0.1); c.fillRect(px + T - 1.5, py, 1.5, T); }
      if (v === 7) { /* Risse */ c.strokeStyle = "rgba(10,8,8,.85)"; c.lineWidth = 1; c.beginPath(); c.moveTo(px + 3, py + 2); c.lineTo(px + 7, py + 7); c.lineTo(px + 5, py + 11); c.lineTo(px + 10, py + 15); c.moveTo(px + 7, py + 7); c.lineTo(px + 13, py + 5); c.stroke(); c.strokeStyle = "rgba(255,220,160,.12)"; c.beginPath(); c.moveTo(px + 4, py + 3); c.lineTo(px + 8, py + 8); c.stroke(); }
    }
    /* Stege, Leitern, Stacheln */
    for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) {
      const v = get(x, y), px = x * T, py = y * T;
      if (v === 2 || v === 8) {
        if (B.webPlat) { c.strokeStyle = "rgba(230,224,236,.8)"; c.lineWidth = 1.2; c.beginPath(); c.moveTo(px, py + 1); c.quadraticCurveTo(px + 8, py + 3, px + 16, py + 1); c.stroke(); c.lineWidth = 0.5; c.beginPath(); c.moveTo(px + 2, py + 1); c.lineTo(px + 6, py + 6); c.moveTo(px + 12, py + 1); c.lineTo(px + 9, py + 7); c.stroke(); }
        else {
          c.fillStyle = shade(B.plat, -0.25); c.fillRect(px, py, T, 5); c.fillStyle = B.plat; c.fillRect(px, py, T, 3); c.fillStyle = shade(B.plat, 0.2); c.fillRect(px, py, T, 1);
          c.fillStyle = shade(B.plat, -0.45); c.fillRect(px + 7, py, 1, 3);
          if (!(get(x - 1, y) === 2 || get(x - 1, y) === 8)) { c.fillStyle = shade(B.plat, -0.3); c.fillRect(px + 1, py + 5, 2, 5); c.beginPath(); c.moveTo(px + 2, py + 9); c.lineTo(px + 8, py + 4); c.lineTo(px + 6, py + 4); c.fill(); }
          if (!(get(x + 1, y) === 2 || get(x + 1, y) === 8)) { c.fillStyle = shade(B.plat, -0.3); c.fillRect(px + 13, py + 5, 2, 5); }
        }
      }
      if (v === 4) {
        c.fillStyle = shade(B.plat, -0.2); c.fillRect(px + 3, py, 2, T); c.fillRect(px + 11, py, 2, T);
        c.fillStyle = B.plat; for (let k = 2; k < T; k += 5) c.fillRect(px + 3, py + k, 10, 1.6);
      }
      if (v === 3) {
        c.fillStyle = "#4a4448"; c.fillRect(px, py + 12, T, 4);
        for (let k = 0; k < 4; k++) { c.fillStyle = "#8a8288"; c.beginPath(); c.moveTo(px + k * 4, py + 13); c.lineTo(px + k * 4 + 2, py + 3); c.lineTo(px + k * 4 + 4, py + 13); c.fill(); c.fillStyle = "#c8c0c4"; c.fillRect(px + k * 4 + 1.6, py + 4, 0.8, 4); }
      }
    }
  }
  function topper(c, tl, px, py, x, y) {
    const r = hash(x, y + 7);
    switch (tl.top) {
      case "moss": c.fillStyle = tl.topCol; c.fillRect(px, py - 1, T, 3); for (let k = 0; k < 4; k++) if (hash(x * 4 + k, y) < 0.6) c.fillRect(px + k * 4 + 1, py - 2 - hash(x + k, y) * 3, 1.4, 3); if (r < 0.25) { c.fillStyle = shade(tl.topCol, -0.2); c.fillRect(px + 5, py + 2, 4, 3 + r * 10); } break;
      case "carpet": if (r < 0.75) { c.fillStyle = tl.topCol; c.fillRect(px, py - 1, T, 3); c.fillStyle = "#e5b454"; c.fillRect(px, py + 1.5, T, 0.6); } break;
      case "web": if (r < 0.35) { c.strokeStyle = "rgba(220,214,230,.55)"; c.lineWidth = 0.5; c.beginPath(); c.moveTo(px, py); c.quadraticCurveTo(px + 8, py - 6, px + 16, py); c.stroke(); } break;
      case "snow": c.fillStyle = "#e8e4ec"; c.fillRect(px, py - 2, T, 3); break;
      case "soot": c.fillStyle = tl.topCol; c.fillRect(px, py, T, 2); if (r < 0.2) { c.fillStyle = "rgba(255,120,40,.6)"; c.fillRect(px + r * 60, py, 2, 1); } break;
      case "algae": c.fillStyle = tl.topCol; c.fillRect(px, py - 1, T, 2); if (r < 0.5) { c.fillRect(px + 3, py + 1, 1.5, 4 + r * 8); c.fillRect(px + 10, py + 1, 1.5, 3 + r * 6); } break;
      case "rune": if (r < 0.18) { c.fillStyle = tl.topCol; c.globalAlpha = 0.8; c.fillRect(px + 4, py + 4, 1.2, 6); c.fillRect(px + 4, py + 4, 5, 1.2); c.fillRect(px + 8, py + 4, 1.2, 4); c.globalAlpha = 1; } break;
      case "ash": c.fillStyle = tl.topCol; c.fillRect(px, py - 1, T, 2); break;
      case "wood": c.fillStyle = tl.topCol; c.fillRect(px, py - 1, T, 3); c.fillStyle = shade(tl.topCol, -0.3); c.fillRect(px + 7, py - 1, 1, 3); c.fillRect(px, py + 1.5, T, 0.5); break;
      case "slime": if (r < 0.4) { c.fillStyle = tl.topCol; c.fillRect(px, py, T, 1.5); c.fillRect(px + 4 + r * 10, py, 1.5, 3 + r * 8); } break;
      case "drip": if (r < 0.15) { c.fillStyle = tl.topCol; c.fillRect(px, py, T, 1.5); } break;
    }
  }
  function drawTiles(c, cam) {
    const cx0 = Math.floor(cam.x / (CH_W * T)), cx1 = Math.floor((cam.x + cam.w) / (CH_W * T));
    const cy0 = Math.floor(cam.y / (CH_H * T)), cy1 = Math.floor((cam.y + cam.h) / (CH_H * T));
    for (let cy = cy0; cy <= cy1; cy++) for (let cx = cx0; cx <= cx1; cx++) {
      if (cx < 0 || cy < 0 || cx * CH_W >= lv.W || cy * CH_H >= lv.H) continue;
      const ch = chunkCanvas(cx, cy);
      c.drawImage(ch.cv, cx * CH_W * T, cy * CH_H * T, CH_W * T, CH_H * T);
    }
  }
  /* Flüssigkeiten leben: jedes Bild neu */
  function drawLiquids(c, cam, t) {
    const x0 = Math.max(0, Math.floor(cam.x / T)), x1 = Math.min(lv.W - 1, Math.ceil((cam.x + cam.w) / T));
    const y0 = Math.max(0, Math.floor(cam.y / T)), y1 = Math.min(lv.H - 1, Math.ceil((cam.y + cam.h) / T));
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const v = lv.get(x, y); if (v !== 5 && v !== 6) continue;
      const px = x * T, py = y * T, top = lv.get(x, y - 1) !== v;
      if (v === 5) {
        const g = c.createLinearGradient(0, py, 0, py + T); g.addColorStop(0, "#ffb040"); g.addColorStop(0.3, "#ff6a1a"); g.addColorStop(1, "#8a1a08");
        c.fillStyle = g; c.fillRect(px, py + (top ? 4 + Math.sin(t * 3 + x) * 1.2 : 0), T, T);
        if (top) { c.fillStyle = "#ffe0a0"; c.fillRect(px, py + 4 + Math.sin(t * 3 + x) * 1.2, T, 1); if (Math.random() < 0.02) FX.p({ x: px + Math.random() * T, y: py + 4, vx: 0, vy: -60 - Math.random() * 40, g: 200, life: 0.6, size: 1.6, col: "#ffb040", kind: "spark", add: true }); }
      } else {
        c.fillStyle = B.hazard === "water" && B.bg === "lake" ? "rgba(20,50,40,.85)" : "rgba(30,40,50,.8)"; const ty = top ? 5 + Math.sin(t * 2 + x * 0.7) * 1.2 : 0;
        c.fillRect(px, py + ty, T, T - ty);
        if (top) { c.fillStyle = "rgba(200,230,210,.35)"; c.fillRect(px, py + ty, T, 1); if (Math.random() < 0.01) FX.p({ x: px + Math.random() * T, y: py + ty, vx: 0, vy: -10, life: 0.8, size: 1.5, col: "#c0e0d0", kind: "bubble" }); }
      }
    }
  }

  /* ======================= REQUISITEN ======================= */
  function drawDecor(c, cam, t, front) {
    for (const d of lv.decor) {
      const px = d.x * T + 8, py = d.y * T + 16;
      if (px < cam.x - 60 || px > cam.x + cam.w + 60 || py < cam.y - 60 || py > cam.y + cam.h + 80) continue;
      const fl = Math.sin(t * 9 + d.x) * 0.5 + Math.sin(t * 13 + d.y) * 0.5;
      switch (d.kind) {
        case "torch": {
          const y = py - 22;
          c.fillStyle = "#3a2a1a"; c.fillRect(px - 1, y, 2, 7); c.fillStyle = "#5a4a3a"; c.fillRect(px - 2.5, y - 1, 5, 2);
          flame(c, px, y - 1, 1 + fl * 0.15, "#ff9a3a");
          if (Math.random() < 0.08) FX.p({ x: px, y: y - 6, vx: (Math.random() - 0.5) * 10 + (Z.windX || 0) * 0.3, vy: -30, life: 0.8, size: 1.2, col: "#ffb060", kind: "spark", add: true });
          break;
        }
        case "brazier": c.fillStyle = "#3a3434"; c.beginPath(); c.moveTo(px - 7, py - 10); c.lineTo(px + 7, py - 10); c.lineTo(px + 4, py - 4); c.lineTo(px - 4, py - 4); c.fill(); c.fillRect(px - 1, py - 4, 2, 4); c.fillRect(px - 4, py - 1, 8, 1); flame(c, px, py - 10, 1.4 + fl * 0.2, "#ff8a2a"); flame(c, px - 3, py - 10, 0.9, "#ff6a1a"); break;
        case "greenfire": c.fillStyle = "#2a2a2a"; c.fillRect(px - 5, py - 6, 10, 6); flame(c, px, py - 6, 1.3 + fl * 0.2, "#6aff7a"); break;
        case "candle": c.fillStyle = "#e8dcc0"; c.fillRect(px - 1, py - 6, 2, 6); flame(c, px, py - 6, 0.5, "#ffc060"); break;
        case "candelabra": c.fillStyle = "#8a6a2a"; c.fillRect(px - 0.8, py - 18, 1.6, 18); c.fillRect(px - 6, py - 18, 12, 1.4); c.fillRect(px - 4, py - 1, 8, 1.5); for (const o of [-6, 0, 6]) { c.fillStyle = "#e8dcc0"; c.fillRect(px + o - 0.8, py - 22, 1.6, 4); flame(c, px + o, py - 22, 0.45, "#ffc060"); } break;
        case "chandelier": { const sw = Math.sin(t * 0.8 + d.x) * 1.5; c.strokeStyle = "#3a3020"; c.lineWidth = 0.6; c.beginPath(); c.moveTo(px, py - 16); c.lineTo(px + sw, py + 8); c.stroke(); c.fillStyle = "#6a5020"; c.fillRect(px - 10 + sw, py + 8, 20, 2); for (let k = -2; k <= 2; k++) { c.fillStyle = "#e8dcc0"; c.fillRect(px + k * 4.5 + sw - 0.6, py + 4, 1.2, 4); flame(c, px + k * 4.5 + sw, py + 4, 0.4, "#ffc060"); } break; }
        case "lantern": { const sw = Math.sin(t * 1.4 + d.x) * 2; c.strokeStyle = "#2a2420"; c.lineWidth = 0.6; c.beginPath(); c.moveTo(px, py - 16); c.lineTo(px + sw, py - 2); c.stroke(); c.fillStyle = "#3a2e24"; c.fillRect(px - 3 + sw, py - 2, 6, 8); c.fillStyle = "rgba(255,200,110,.9)"; c.fillRect(px - 2 + sw, py, 4, 4); D.glow(c, px + sw, py + 2, 16, "rgba(255,180,90,.35)"); break; }
        case "banner": { const w = 10, h = 22, y = py - 30; c.fillStyle = "#3a2a1a"; c.fillRect(px - 7, y - 1, 14, 1.5); c.fillStyle = B.bg === "spires" ? "#3a1a1a" : B.bg === "storm" ? "#2a3a2a" : "#7a1a20"; c.beginPath(); c.moveTo(px - w / 2, y); c.lineTo(px + w / 2, y); for (let k = 0; k <= 4; k++) c.lineTo(px + w / 2 + Math.sin(t * 2 + k * 0.8 + d.x) * (k / 4) * 2 * ((Z.windX || 0) / 20 + 1), y + (k / 4) * h); c.lineTo(px, y + h - 4); c.lineTo(px - w / 2 + Math.sin(t * 2 + d.x) * 2, y + h); c.fill(); c.fillStyle = "#e5b454"; c.beginPath(); c.arc(px, y + 8, 2.5, 0, 6.283); c.fill(); c.strokeStyle = "#e5b454"; c.lineWidth = 0.5; for (let k = 0; k < 8; k++) { const a = k / 8 * 6.283; c.beginPath(); c.moveTo(px, y + 8); c.lineTo(px + Math.cos(a) * 4, y + 8 + Math.sin(a) * 4); c.stroke(); } break; }
        case "chain": { const sw = Math.sin(t * 1.1 + d.x) * 2; c.strokeStyle = "#3a3430"; c.lineWidth = 1; c.setLineDash([2, 1]); c.beginPath(); c.moveTo(px, py - 16); c.quadraticCurveTo(px + sw, py + 4, px + sw * 1.4, py + 16 + d.s * 20); c.stroke(); c.setLineDash([]); if (d.s > 0.6) { c.strokeStyle = "#4a4440"; c.lineWidth = 1.5; c.beginPath(); c.arc(px + sw * 1.4, py + 20 + d.s * 20, 3, 0, 5); c.stroke(); } break; }
        case "cage": { const sw = Math.sin(t * 0.9 + d.x) * 0.08; c.save(); c.translate(px, py - 16); c.rotate(sw); c.strokeStyle = "#3a3430"; c.lineWidth = 0.8; c.beginPath(); c.moveTo(0, 0); c.lineTo(0, 14); c.stroke(); c.lineWidth = 1; for (let k = -6; k <= 6; k += 3) { c.beginPath(); c.moveTo(k, 14); c.lineTo(k, 32); c.stroke(); } c.beginPath(); c.ellipse(0, 14, 7, 2, 0, 0, 6.283); c.stroke(); c.fillStyle = "#2a2420"; c.fillRect(-7, 31, 14, 2); if (d.s > 0.5) { D.circ(c, -1, 27, 2.4, "#c8c0b0"); c.fillStyle = "#c8c0b0"; c.fillRect(-1, 28, 1, 4); } c.restore(); break; }
        case "web": { c.strokeStyle = "rgba(230,224,240,.35)"; c.lineWidth = 0.5; const r = 14 + d.s * 10; const ox = px + (d.s < 0.5 ? -8 : 8), oy = py - 16; for (let k = 0; k < 5; k++) { const a = (d.s < 0.5 ? 0 : Math.PI / 2) + k / 4 * Math.PI / 2; c.beginPath(); c.moveTo(ox, oy); c.lineTo(ox + Math.cos(a) * r, oy + Math.sin(a) * r); c.stroke(); } for (let rr = 4; rr < r; rr += 4) { c.beginPath(); for (let k = 0; k <= 4; k++) { const a = (d.s < 0.5 ? 0 : Math.PI / 2) + k / 4 * Math.PI / 2; k ? c.lineTo(ox + Math.cos(a) * rr, oy + Math.sin(a) * rr) : c.moveTo(ox + Math.cos(a) * rr, oy + Math.sin(a) * rr); } c.stroke(); } break; }
        case "cocoon": { const sw = Math.sin(t * 0.7 + d.x) * 0.1; c.save(); c.translate(px, py - 16); c.rotate(sw); c.strokeStyle = "rgba(230,224,240,.6)"; c.lineWidth = 0.6; c.beginPath(); c.moveTo(0, 0); c.lineTo(0, 8); c.stroke(); D.ell(c, 0, 18, 5, 10, "#d8d0dc"); c.strokeStyle = "rgba(160,150,170,.6)"; for (let k = 0; k < 4; k++) { c.beginPath(); c.moveTo(-5, 12 + k * 4); c.lineTo(5, 14 + k * 4); c.stroke(); } c.restore(); break; }
        case "mushroom": { const g = 0.6 + 0.4 * Math.sin(t * 2 + d.x); const col = d.s < 0.5 ? "190,110,255" : "130,230,120"; c.fillStyle = "#3a3040"; c.fillRect(px - 1, py - 6, 2, 6); D.ell(c, px, py - 7, 5, 3, "rgb(" + col + ")"); D.glow(c, px, py - 7, 14, "rgba(" + col + "," + 0.45 * g + ")"); if (d.s > 0.3) { c.fillStyle = "#3a3040"; c.fillRect(px + 5, py - 4, 1.4, 4); D.ell(c, px + 5.5, py - 4.5, 3, 2, "rgb(" + col + ")"); } break; }
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
        case "painting": c.fillStyle = "#6a4a1a"; c.fillRect(px - 9, py - 30, 18, 14); c.fillStyle = shade(B.wall, -0.4); c.fillRect(px - 7.5, py - 28.5, 15, 11); D.circ(c, px, py - 24, 3, "#3a2a2a"); c.fillStyle = "#7a1a1a"; c.fillRect(px - 3, py - 21, 6, 3); break;
        case "window": { const y = py - 30; c.fillStyle = shade(B.wall, -0.5); c.beginPath(); c.moveTo(px - 6, y + 18); c.lineTo(px - 6, y + 4); c.quadraticCurveTo(px, y - 4, px + 6, y + 4); c.lineTo(px + 6, y + 18); c.fill(); c.fillStyle = B.out ? "rgba(180,150,190,.35)" : "rgba(200,180,220,.22)"; c.beginPath(); c.moveTo(px - 5, y + 17); c.lineTo(px - 5, y + 5); c.quadraticCurveTo(px, y - 2, px + 5, y + 5); c.lineTo(px + 5, y + 17); c.fill(); c.fillStyle = shade(B.wall, -0.5); c.fillRect(px - 0.5, y, 1, 18); c.fillRect(px - 5, y + 9, 10, 1); /* Lichtstrahl */ c.save(); c.globalCompositeOperation = "lighter"; c.globalAlpha = 0.06; c.fillStyle = "#e8d8f0"; c.beginPath(); c.moveTo(px - 5, y + 4); c.lineTo(px + 5, y + 4); c.lineTo(px + 30, y + 60); c.lineTo(px + 14, y + 60); c.fill(); c.restore(); break; }
        case "rune": { const g = 0.5 + 0.5 * Math.sin(t * 1.5 + d.x); c.save(); c.globalCompositeOperation = "lighter"; c.globalAlpha = 0.5 + g * 0.5; c.strokeStyle = "#ffb040"; c.lineWidth = 1; const y = py - 26; c.beginPath(); c.arc(px, y, 6, 0, 6.283); c.stroke(); c.beginPath(); c.moveTo(px - 3, y + 3); c.lineTo(px, y - 4); c.lineTo(px + 3, y + 3); c.moveTo(px - 2, y); c.lineTo(px + 2, y); c.stroke(); D.glow(c, px, y, 14, "rgba(255,170,60," + 0.3 * g + ")"); c.restore(); break; }
        case "pipe": c.fillStyle = "#3a3434"; c.fillRect(px - 2, py - 40, 4, 40); c.fillRect(px - 4, py - 20, 8, 3); if (Math.random() < 0.03) FX.p({ x: px, y: py - 40, vx: 0, vy: -20, life: 1.5, size: 4, col: "rgba(90,80,80,.6)", kind: "smoke" }); break;
        case "column": c.fillStyle = shade(B.wall, 0.08); c.fillRect(px - 5, py - 48, 10, 48); c.fillStyle = shade(B.wall, 0.2); c.fillRect(px - 5, py - 48, 2, 48); c.fillStyle = shade(B.wall, -0.1); c.fillRect(px - 7, py - 50, 14, 3); c.fillRect(px - 7, py - 3, 14, 3); break;
        case "bars": c.fillStyle = "rgba(10,10,10,.7)"; for (let k = -10; k <= 10; k += 4) c.fillRect(px + k, py - 34, 1.6, 34); c.fillRect(px - 11, py - 34, 23, 1.6); break;
        case "crenel": c.fillStyle = shade(B.wall, -0.15); for (let k = -16; k < 16; k += 8) c.fillRect(px + k, py - 10, 5, 10); break;
        case "shelf": c.fillStyle = "#5a3a22"; c.fillRect(px - 10, py - 22, 20, 1.6); c.fillRect(px - 10, py - 12, 20, 1.6); for (let k = 0; k < 5; k++) { c.fillStyle = ["#7a2a2a", "#2a5a3a", "#6a5a2a", "#4a3a5a", "#7a6a5a"][k]; c.fillRect(px - 9 + k * 4, py - 29 + (k % 2), 3, 7); } D.ell(c, px - 4, py - 15, 2.4, 2.8, "#5a8a5a"); D.ell(c, px + 3, py - 15, 2.4, 2.8, "#8a5a7a"); break;
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
  function flame(c, x, y, s, col) {
    c.save(); c.globalCompositeOperation = "lighter";
    const h = (7 + Math.sin(G.time * 17 + x) * 1.6) * s, w = 3 * s;
    D.glow(c, x, y - h * 0.4, 14 * s + 4, "rgba(255,150,60,.35)");
    c.fillStyle = col; c.beginPath(); c.moveTo(x - w, y); c.quadraticCurveTo(x - w * 0.6, y - h * 0.6, x + Math.sin(G.time * 11 + y) * w * 0.4, y - h); c.quadraticCurveTo(x + w * 0.6, y - h * 0.5, x + w, y); c.fill();
    c.fillStyle = "#fff0c0"; c.beginPath(); c.moveTo(x - w * 0.4, y); c.quadraticCurveTo(x, y - h * 0.55, x + w * 0.4, y); c.fill();
    c.restore();
  }
  Z.flame = flame;

  /* Türen und Stationen */
  function drawDoors(c, t) {
    for (const d of lv.doors) {
      const px = d.x * T + 8, py = d.y * T + 16;
      if (d.kind === "entry") { c.fillStyle = shade(B.wall, -0.5); c.fillRect(px - 10, py - 32, 20, 32); c.beginPath(); c.arc(px, py - 32, 10, Math.PI, 0); c.fill(); c.fillStyle = "#3a2a1a"; c.fillRect(px - 8, py - 30, 16, 30); continue; }
      if (d.kind === "gate") { c.fillStyle = "#1a1418"; c.fillRect(px - 16, py - 44, 32, 44); c.beginPath(); c.arc(px, py - 44, 16, Math.PI, 0); c.fill(); c.fillStyle = "rgba(255,80,60,.25)"; c.fillRect(px - 12, py - 40, 24, 40); c.strokeStyle = "rgba(220,210,230,.5)"; c.lineWidth = 0.6; for (let k = 0; k < 6; k++) { c.beginPath(); c.moveTo(px, py - 52); c.lineTo(px - 16 + k * 6.4, py); c.stroke(); } D.glow(c, px, py - 24, 30, "rgba(255,90,60,.25)"); continue; }
      const dir = Z.exitDir(null, d.to), locked = d.locked && !Z.run.doorsOpen;
      const col = dir === "down" ? "#b080ff" : dir === "up" ? "#ffd27a" : dir === "boss" ? "#ff5a4e" : "#e8a070";
      c.fillStyle = "#1a1214"; c.fillRect(px - 12, py - 36, 24, 36); c.beginPath(); c.arc(px, py - 36, 12, Math.PI, 0); c.fill();
      const g = c.createLinearGradient(0, py - 44, 0, py); g.addColorStop(0, "rgba(0,0,0,0)"); g.addColorStop(1, col); c.save(); c.globalAlpha = locked ? 0.15 : 0.35 + 0.1 * Math.sin(t * 3 + d.x); c.globalCompositeOperation = "lighter"; c.fillStyle = g; c.fillRect(px - 10, py - 44, 20, 44); c.restore();
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
  function lightPass(c, cam, W, H) {
    const dark = Z.darkness > 0 ? 0.93 : B.dark * 0.82 + (Z.run && Z.run.skulls ? Z.run.skulls * 0.02 : 0);
    if (dark < 0.05) return;
    const LD = (Z.gq && Z.gq.light) || 4; if (!G.light || G.light.width !== Math.ceil(W / LD) || G.light.height !== Math.ceil(H / LD)) { G.light = document.createElement("canvas"); G.light.width = Math.ceil(W / LD); G.light.height = Math.ceil(H / LD); G.lc = G.light.getContext("2d"); }
    const l = G.lc, sx = G.light.width / cam.w, sy = G.light.height / cam.h;
    l.globalCompositeOperation = "source-over"; l.clearRect(0, 0, G.light.width, G.light.height);
    if (G.darkCol !== B.ambCol) { G.darkCol = B.ambCol; const n = parseInt((B.ambCol || "#202020").slice(1), 16); G.darkRGB = [((n >> 16) * 0.12) | 0, (((n >> 8) & 255) * 0.12) | 0, ((n & 255) * 0.12) | 0].join(","); }
    l.fillStyle = "rgba(" + G.darkRGB + "," + dark + ")"; l.fillRect(0, 0, G.light.width, G.light.height);
    l.globalCompositeOperation = "destination-out";
    if (!G.holeSpr) { G.holeSpr = document.createElement("canvas"); G.holeSpr.width = G.holeSpr.height = 64; const h = G.holeSpr.getContext("2d"); const g = h.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, "rgba(0,0,0,1)"); g.addColorStop(0.55, "rgba(0,0,0,.55)"); g.addColorStop(1, "rgba(0,0,0,0)"); h.fillStyle = g; h.fillRect(0, 0, 64, 64); }
    const hole = (x, y, r, a) => { const X = (x - cam.x) * sx, Y = (y - cam.y) * sy, Rr = r * sx; if (X < -Rr || Y < -Rr || X > G.light.width + Rr || Y > G.light.height + Rr) return; l.globalAlpha = a; l.drawImage(G.holeSpr, X - Rr, Y - Rr, Rr * 2, Rr * 2); };
    const P = Z.player, t = G.time;
    if (P) {
      let r = Z.darkness > 0 ? 70 : 150;
      if (["a1", "a2"].some(s => P.slots[s] && P.slots[s].id === "dawnbringer")) r += 70;
      hole(P.x + P.w / 2, P.y + 10, r, 0.95);
    }
    if (Z.darkness <= 0) {
      for (const d of lv.lights) { const f = 1 + Math.sin(t * 9 + d.x) * 0.06 + Math.sin(t * 23 + d.y) * 0.04; const big = { forge: 90, brazier: 80, chandelier: 90, campfire: 120, greenfire: 70, fountain: 60, altar: 60 }[d.kind] || (d.kind === "mushroom" ? 40 : d.kind === "window" ? 60 : d.kind === "candle" ? 34 : 70); hole(d.x * T + 8, d.y * T + (d.kind === "torch" ? -6 : 6), big * f, d.kind === "window" ? 0.6 : 0.9); }
      for (const h of Z.hazards) if (h.kind === "fire" || h.kind === "column" || h.kind === "strike" || (h.kind === "breath")) hole(h.x, h.y - 10, 60, 0.8);
      for (const p of Z.projs) if (p.k.glow || p.kind === "lichtwelle" || p.kind === "e_feuerball") hole(p.x, p.y, 40, 0.8);
      for (const e of Z.enemies) if (!e.dead && !(e.hidden > 0)) { const big = e.def.glow || e.def.shape === "wisp" || e.def.boss || e.elite; hole(e.x + e.w / 2, e.y + e.h / 2, e.def.boss ? 150 : big ? 50 : 30 + e.h * 0.4, big ? 0.75 : 0.5); }
      for (const p of Z.pickups) if (p.kind === "item" || p.kind === "chest" || p.kind === "scroll") hole(p.x, p.y - 8, 40, 0.6);
      for (const d of lv.doors) if (d.kind === "exit" || d.kind === "gate") hole(d.x * T + 8, d.y * T, 50, 0.7);
      for (const s of lv.props) if (s.kind === "npc" || s.kind === "station") hole(s.x * T + 8, s.y * T, 60, 0.6);
      if (Z.lightExtra) Z.lightExtra(hole);
      if (Z.flashLight > 0) { l.fillStyle = "rgba(0,0,0," + Z.flashLight + ")"; l.fillRect(0, 0, G.light.width, G.light.height); }
    }
    l.globalAlpha = 1;
    c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.imageSmoothingEnabled = true; c.drawImage(G.light, 0, 0, W, H); c.restore();
  }

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
    c.save(); c.globalAlpha = 0.18;
    for (let i = 0; i < 4; i++) { const y = cam.y + cam.h * (0.55 + i * 0.12), x = cam.x - ((G.time * (6 + i * 3)) % 200); const g = c.createLinearGradient(0, y - 20, 0, y + 20); g.addColorStop(0, "rgba(180,190,180,0)"); g.addColorStop(0.5, "rgba(180,190,180,.7)"); g.addColorStop(1, "rgba(180,190,180,0)"); c.fillStyle = g; c.fillRect(x, y - 20, cam.w + 220, 40); }
    c.restore();
  }

  /* ======================= GESAMTBILD ======================= */
  G.render = function (c, W, H, dt) {
    G.time += dt;
    const cam = Z.cam, t = G.time;
    if (!lv || !B) return;
    const S = G.scale;
    const ox = Math.round((-cam.x + FX.shakeX) * S) / S, oy = Math.round((-cam.y + FX.shakeY) * S) / S;
    c.setTransform(S, 0, 0, S, ox * S, oy * S);
    const pf = Z.prof, tm = pf ? () => performance.now() : null; let t0 = pf ? tm() : 0;
    const mark = k => { if (pf) { c.getImageData(0, 0, 1, 1); const n = tm(); pf[k] = (pf[k] || 0) + n - t0; t0 = n; } };
    const lay = !Z.gq || Z.gq.layers !== false;
    if (Z.noLayers) {} else if (lay && (B.open || lv.out || lv.hub || lv.arena)) { drawLayers(c, cam); if (!Z.gq || Z.gq.critters !== false) { updCritters(dt, cam); drawCritters(c, cam); } } else { c.fillStyle = B.wall; c.fillRect(cam.x - 2, cam.y - 2, cam.w + 4, cam.h + 4); } mark("layers");
    drawTiles(c, cam); mark("tiles");
    drawLiquids(c, cam, t);
    drawDecor(c, cam, t);
    Z.drawMidLife && Z.drawMidLife(c, cam, t); mark("decor");
    drawDoors(c, t);
    Z.drawWorldProps && Z.drawWorldProps(c, t);
    Z.drawPickups(c, t);
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
    lightPass(c, cam, W, H); mark("light");
    Z.drawAfterLight && Z.drawAfterLight(c, cam, W, H, t);
    /* Bildschirmblitz und Vignette */
    c.setTransform(1, 0, 0, 1, 0, 0);
    if (FX.flash > 0 && Z.settings.flashes) { c.globalAlpha = FX.flash * 0.6; c.fillStyle = FX.flashCol; c.fillRect(0, 0, W, H); c.globalAlpha = 1; }
    const P = Z.player;
    if (P && P.hp < P.hpMax * 0.3 && !P.dead) { if (!G.vigR) { G.vigR = document.createElement("canvas"); G.vigR.width = 160; G.vigR.height = 90; const v = G.vigR.getContext("2d"); const g = v.createRadialGradient(80, 45, 26, 80, 45, 84); g.addColorStop(0, "rgba(140,0,0,0)"); g.addColorStop(1, "rgba(140,0,0,1)"); v.fillStyle = g; v.fillRect(0, 0, 160, 90); } c.globalAlpha = (0.3 - P.hp / P.hpMax) / 0.3 * (0.6 + 0.2 * Math.sin(t * 5)); c.drawImage(G.vigR, 0, 0, W, H); c.globalAlpha = 1; }
    if (!G.vig) { G.vig = document.createElement("canvas"); G.vig.width = 160; G.vig.height = 90; const v = G.vig.getContext("2d"); const vg = v.createRadialGradient(80, 45, 40, 80, 45, 92); vg.addColorStop(0, "rgba(0,0,0,0)"); vg.addColorStop(1, "rgba(0,0,0,.5)"); v.fillStyle = vg; v.fillRect(0, 0, 160, 90); }
    if (!Z.gq || Z.gq.vignette !== false) c.drawImage(G.vig, 0, 0, W, H);
    if (pf) { const n = performance.now(); pf.post = (pf.post || 0) + n - t0; }
  };
})();
