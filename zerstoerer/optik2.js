/* Ezekiel – The Destroyer · W35 Optik (optik2.js)
   1) Titelbild-Szene: gemalte, lebende Kulisse hinter dem Titelmenü – Dämmerhimmel, Mond mit Hof und ziehenden
      Wolken, ferne Berge, die Feste der Fäden auf ihrem Felssporn (alle Türme stehen auf Fels, nichts schwebt),
      flackernde Fenster, rote Fäden zwischen den Turmspitzen, Nebelbänke, aufsteigende Glut und Ezekiel als
      Silhouette auf der Klippe (Umhang weht). Warme Töne, kein Blau.
      Läuft nur, solange das Titelbild sichtbar ist (MutationObserver auf #title) – im Spiel kostet sie nichts.
      Grafikstufe 0 / „Bewegung reduzieren“: einmal gemalt, keine Animation.
   Schalter Z.gfx.off.titelszene. Prüfhilfe Z.titelSzene.{draw,stat}. */
(function () {
  "use strict";
  const Z = window.Z; if (!Z) return;
  const TAU = Math.PI * 2;
  const off = () => !!(Z.gfx && Z.gfx.off && Z.gfx.off.titelszene);
  const still = () => !!((Z.gq && (Z.gq.level === 0 || Z.gq.mini)) || (window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches));
  let lastStill = null, cv = null, ctx = null, W = 0, H = 0, dpr = 1, raf = 0, t0 = 0, lastT = 0, layers = null, embers = [], fogs = [], wins = [], threads = [], st = { frames: 0, ms: 0 };
  /* gesäter Zufall: die Szene sieht bei jedem Aufbau gleich aus */
  let seed = 7; const rnd = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
  const mk = (w, h) => { const c = document.createElement("canvas"); c.width = Math.max(1, w | 0); c.height = Math.max(1, h | 0); return c; };

  const css = document.createElement("style");
  css.textContent = "#title>canvas.w35-titel{position:absolute;inset:0;width:100%;height:100%;z-index:0;pointer-events:none;opacity:0;transition:opacity 1.2s ease}" +
    "#title>canvas.w35-titel.an{opacity:1}#title>.tbox{position:relative;z-index:1}" +
    "#title .ttl{text-shadow:0 2px 0 #1a0606,0 0 26px rgba(255,90,40,.42),0 4px 30px rgba(0,0,0,.9)}"; /* W35 Optik */
  document.head.appendChild(css);

  /* ---------- Aufbau der Ebenen (bei Größenänderung) ---------- */
  function geo() {
    const port = H > W * 1.05;
    /* Feste: quer rechts neben dem Menü, hochkant unten mittig unter dem Menü */
    const s = port ? Math.min(W / 420, H / 900) * 1.05 : Math.min(W / 1500, H / 850) * 1.15;
    const fx = port ? W * 0.62 : W * 0.79, fy = port ? H * 0.89 : H * 0.70; /* Fuß des Felssporns (Oberkante) */
    const mx = port ? W * 0.8 : W * 0.86, my = port ? H * 0.1 : H * 0.16, mr = (port ? W * 0.06 : H * 0.045);
    const ezx = port ? W * 0.2 : W * 0.15, ezy = port ? H * 0.935 : H * 0.865, ezs = port ? s * 1.9 : s * 2.1;
    const hz = port ? H * 0.80 : H * 0.66; /* Horizont */
    return { port, s, fx, fy, mx, my, mr, ezx, ezy, ezs, hz };
  }
  function build() {
    seed = 7; const g = geo(); const w = W * dpr, h = H * dpr;
    /* Himmel */
    const sky = mk(w, h), c = sky.getContext("2d"); c.scale(dpr, dpr);
    let gr = c.createLinearGradient(0, 0, 0, H);
    gr.addColorStop(0, "#0d070b"); gr.addColorStop(0.42, "#1e0c12"); gr.addColorStop(g.hz / H * 0.92, "#4a1a18"); gr.addColorStop(Math.min(1, g.hz / H + 0.04), "#7a3420"); gr.addColorStop(1, "#2a0e0e");
    c.fillStyle = gr; c.fillRect(0, 0, W, H);
    gr = c.createRadialGradient(g.fx, g.hz, 0, g.fx, g.hz, W * 0.7); gr.addColorStop(0, "rgba(255,120,50,.28)"); gr.addColorStop(0.5, "rgba(160,50,30,.10)"); gr.addColorStop(1, "rgba(0,0,0,0)");
    c.fillStyle = gr; c.fillRect(0, 0, W, H);
    for (let i = 0; i < 140; i++) { const x = rnd() * W, y = rnd() * g.hz * 0.75, a = 0.15 + rnd() * 0.5 * (1 - y / g.hz); c.fillStyle = "rgba(255,236,210," + a.toFixed(2) + ")"; c.fillRect(x, y, rnd() < 0.1 ? 1.6 : 1, rnd() < 0.1 ? 1.6 : 1); }
    /* ferne Berge (zwei Lagen) */
    const far = mk(w, h), f = far.getContext("2d"); f.scale(dpr, dpr);
    ridge(f, g.hz - H * 0.09, H * 0.07, "#2c1218", 0.0025, 3); ridge(f, g.hz - H * 0.035, H * 0.05, "#22100f", 0.004, 5);
    /* Feste auf dem Felssporn */
    const fort = mk(w, h), k = fort.getContext("2d"); k.scale(dpr, dpr); wins = []; threads = [];
    fortress(k, g);
    /* Vordergrund: Hügelkamm + Klippe mit Ezekiel-Platz */
    const fg = mk(w, h), q = fg.getContext("2d"); q.scale(dpr, dpr);
    foreground(q, g);
    layers = { sky, far, fort, fg, g };
    /* Glut & Nebel */
    embers = []; const n = still() ? 0 : Math.round(Math.min(70, 22 + W * H / 26000));
    for (let i = 0; i < n; i++) embers.push(newEmber(true));
    fogs = []; for (let i = 0; i < 7; i++) fogs.push({ x: rnd() * W * 1.4 - W * 0.2, y: g.hz - H * 0.02 + rnd() * H * 0.16, r: W * (0.18 + rnd() * 0.18), v: 6 + rnd() * 10, a: 0.10 + rnd() * 0.10 });
    fogSpr = null;
  }
  function ridge(c, base, amp, col, fr, oct) {
    c.fillStyle = col; c.beginPath(); c.moveTo(0, H);
    for (let x = 0; x <= W + 8; x += 8) { let y = 0, a = 1, fq = fr; const ph = seed % 97; for (let o = 0; o < oct; o++) { y += Math.sin(x * fq + ph * (o + 1)) * a; a *= 0.5; fq *= 2.1; } c.lineTo(x, base - Math.abs(y) * amp); }
    c.lineTo(W, H); c.closePath(); c.fill(); rnd();
  }
  function fortress(c, g) {
    const s = g.s, X = g.fx, Y = g.fy;
    /* Felssporn bis zum Bildrand unten – trägt alle Türme */
    c.fillStyle = "#170a0c"; c.beginPath(); c.moveTo(X - 300 * s, H + 4); c.lineTo(X - 250 * s, Y + 40 * s); c.lineTo(X - 200 * s, Y + 8 * s); c.lineTo(X - 150 * s, Y); c.lineTo(X + 170 * s, Y - 4 * s);
    c.lineTo(X + 215 * s, Y + 22 * s); c.lineTo(X + 260 * s, Y + 70 * s); c.lineTo(X + 340 * s, H + 4); c.closePath(); c.fill();
    /* Felskanten mit warmem Streiflicht von der Horizontglut */
    c.strokeStyle = "rgba(200,80,40,.22)"; c.lineWidth = 1.2 * s + 0.4; c.beginPath(); c.moveTo(X - 250 * s, Y + 40 * s); c.lineTo(X - 200 * s, Y + 8 * s); c.lineTo(X - 150 * s, Y); c.lineTo(X + 170 * s, Y - 4 * s); c.stroke();
    for (let i = 0; i < 9; i++) { const x0 = X + (-180 + rnd() * 380) * s, y0 = Y + (20 + rnd() * 120) * s; c.strokeStyle = "rgba(0,0,0,.35)"; c.lineWidth = 1; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x0 + (rnd() - 0.5) * 30 * s, y0 + (20 + rnd() * 40) * s); c.stroke(); }
    const wall = "#1d0d10", wall2 = "#241014";
    /* Mauer mit Zinnen */
    c.fillStyle = wall; c.fillRect(X - 160 * s, Y - 46 * s, 330 * s, 48 * s);
    for (let x = X - 160 * s; x < X + 170 * s; x += 12 * s) c.fillRect(x, Y - 53 * s, 7 * s, 8 * s);
    /* Türme: [dx, Breite, Höhe, Dachform] – alle mit Fuß auf der Mauer/dem Fels */
    const T = [[-140, 30, 120, "spitz"], [-95, 22, 80, "zinne"], [-40, 40, 210, "spitz"], [10, 26, 150, "spitz"], [55, 34, 120, "zinne"], [105, 24, 175, "spitz"], [145, 28, 95, "spitz"]];
    const tops = [];
    for (const [dx, bw, bh, roof] of T) {
      const x = X + dx * s, w = bw * s, h = bh * s, top = Y - h;
      c.fillStyle = dx % 2 ? wall2 : wall; c.fillRect(x - w / 2, top, w, h + 2);
      c.fillStyle = "rgba(255,140,70,.07)"; c.fillRect(x + w * 0.18, top, w * 0.32, h); /* Lichtkante */
      if (roof === "spitz") { c.fillStyle = "#140709"; c.beginPath(); c.moveTo(x - w * 0.62, top + 2); c.lineTo(x, top - w * 1.5); c.lineTo(x + w * 0.62, top + 2); c.closePath(); c.fill(); tops.push([x, top - w * 1.5]); }
      else { for (let i = -2; i <= 2; i++) c.fillRect(x + i * w * 0.22 - w * 0.07, top - 6 * s, w * 0.14, 6 * s); tops.push([x, top - 6 * s]); }
      /* Fenster (Spitzbogen), später flackernd beleuchtet */
      const rows = Math.max(1, Math.floor(h / (34 * s)));
      for (let r = 0; r < rows; r++) { if (rnd() < 0.35) continue; const wy = top + (18 + r * 34) * s; if (wy > Y - 60 * s) break; wins.push({ x, y: wy, w: Math.max(2, 4 * s), h: Math.max(3, 8 * s), ph: rnd() * TAU, f: 0.6 + rnd() * 1.6 }); }
    }
    /* Tor */
    c.fillStyle = "#0a0405"; c.beginPath(); c.moveTo(X - 14 * s, Y + 2); c.lineTo(X - 14 * s, Y - 20 * s); c.arc(X, Y - 20 * s, 14 * s, Math.PI, 0); c.lineTo(X + 14 * s, Y + 2); c.closePath(); c.fill();
    wins.push({ x: X, y: Y - 14 * s, w: 18 * s, h: 14 * s, ph: 0, f: 0.4, tor: true });
    /* Fäden: von Turmspitze zu Turmspitze durchhängend (Feste der Fäden) */
    tops.sort((a, b) => a[0] - b[0]);
    for (let i = 0; i < tops.length - 1; i++) threads.push([tops[i], tops[i + 1], 14 * s + rnd() * 18 * s]);
    threads.push([tops[2], tops[5], 34 * s]);
  }
  function foreground(c, g) {
    /* naher Hügelkamm mit kahlen Bäumen (steht auf dem Boden) */
    c.fillStyle = "#120708"; c.beginPath(); c.moveTo(0, H);
    const base = g.port ? H * 0.9 : H * 0.84;
    for (let x = 0; x <= W + 10; x += 10) c.lineTo(x, base + Math.sin(x * 0.006 + 1.3) * H * 0.018 + Math.sin(x * 0.017) * H * 0.008);
    c.lineTo(W, H); c.closePath(); c.fill();
    for (let i = 0; i < 6; i++) { const x = W * (0.3 + rnd() * 0.65); if (Math.abs(x - g.fx) < 260 * g.s) continue; tree(c, x, base + Math.sin(x * 0.006 + 1.3) * H * 0.018 + Math.sin(x * 0.017) * H * 0.008 + 2, (24 + rnd() * 30) * g.s * 1.4); }
    /* Klippe links, auf der Ezekiel steht */
    const ex = g.ezx, ey = g.ezy, sc = g.ezs;
    c.fillStyle = "#0b0405"; c.beginPath(); c.moveTo(-10, H); c.lineTo(-10, ey - 30 * sc); c.lineTo(ex - 70 * sc, ey - 6 * sc); c.lineTo(ex - 20 * sc, ey - 2 * sc); c.lineTo(ex + 40 * sc, ey); c.lineTo(ex + 90 * sc, ey + 14 * sc); c.lineTo(ex + 120 * sc, ey + 60 * sc); c.lineTo(ex + 150 * sc, H); c.closePath(); c.fill();
    c.strokeStyle = "rgba(220,90,50,.25)"; c.lineWidth = 1.4; c.beginPath(); c.moveTo(ex - 70 * sc, ey - 6 * sc); c.lineTo(ex - 20 * sc, ey - 2 * sc); c.lineTo(ex + 40 * sc, ey); c.lineTo(ex + 90 * sc, ey + 14 * sc); c.stroke();
    /* Grasbüschel an der Kante */
    c.strokeStyle = "#0b0405"; c.lineWidth = 1;
    for (let i = 0; i < 26; i++) { const x = ex - 70 * sc + rnd() * 150 * sc, y = ey - 6 * sc + (x - ex + 70 * sc) / (160 * sc) * 18 * sc; c.beginPath(); c.moveTo(x, y + 2); c.lineTo(x + (rnd() - 0.5) * 5, y - 4 - rnd() * 6 * sc); c.stroke(); }
  }
  function tree(c, x, y, h) {
    c.strokeStyle = "#120708"; c.lineCap = "round";
    const br = (x0, y0, a, l, w, d) => { const x1 = x0 + Math.cos(a) * l, y1 = y0 + Math.sin(a) * l; c.lineWidth = w; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke(); if (d > 0) { br(x1, y1, a - 0.4 - rnd() * 0.3, l * 0.7, w * 0.65, d - 1); br(x1, y1, a + 0.35 + rnd() * 0.3, l * 0.68, w * 0.65, d - 1); } };
    br(x, y, -Math.PI / 2 + (rnd() - 0.5) * 0.2, h * 0.45, Math.max(1.2, h * 0.07), 3);
  }
  /* Ezekiel-Silhouette: Hörnerhelm, weiter Umhang (weht), Schwert aufgestützt */
  function ezekiel(c, g, t) {
    const s = g.ezs, x = g.ezx, y = g.ezy - 1 * s; const wv = still() ? 0.4 : Math.sin(t * 1.7) * 0.5 + Math.sin(t * 3.1) * 0.25;
    c.save(); c.translate(x, y); c.scale(s, s);
    c.fillStyle = "#2a0709";
    /* Umhang: weht nach links (Wind von rechts) */
    c.beginPath(); c.moveTo(-3, -30); c.bezierCurveTo(-14, -26, -20 - wv * 4, -14, -30 - wv * 7, -4 + wv * 2); c.lineTo(-26 - wv * 5, 0 + wv); c.lineTo(-18 - wv * 3, -3); c.lineTo(-12, 0); c.lineTo(-4, -2); c.lineTo(2, -28); c.closePath(); c.fill();
    c.fillStyle = "#070203";
    /* Beine, Rumpf, Kopf */
    c.fillRect(-4, -12, 3, 12); c.fillRect(1, -12, 3, 12);
    c.beginPath(); c.moveTo(-6, -12); c.lineTo(-5, -28); c.lineTo(5, -28); c.lineTo(6, -12); c.closePath(); c.fill();
    c.beginPath(); c.arc(0, -32, 4.2, 0, TAU); c.fill();
    /* Hörner */
    c.lineWidth = 1.6; c.strokeStyle = "#070203"; c.lineCap = "round";
    for (const d of [-1, 1]) { c.beginPath(); c.moveTo(d * 1.2, -35.6); c.quadraticCurveTo(d * 7.5, -36.5, d * 6.2, -42.5); c.quadraticCurveTo(d * 3.6, -38.6, d * 3.4, -33.8); c.closePath(); c.fill(); } /* W35 Optik */
    /* Arm + aufgestütztes Schwert */
    c.lineWidth = 2.2; c.beginPath(); c.moveTo(4, -26); c.lineTo(9, -17); c.stroke();
    c.lineWidth = 1.4; c.beginPath(); c.moveTo(10, -20); c.lineTo(11, 1); c.stroke(); c.lineWidth = 1.2; c.beginPath(); c.moveTo(7, -17); c.lineTo(13, -17.4); c.stroke();
    /* Randlicht von der Feste / dem Mond (warm) */
    c.globalCompositeOperation = "lighter"; c.strokeStyle = "rgba(255,110,60,.55)"; c.lineWidth = 0.7;
    c.beginPath(); c.arc(0, -32, 4.2, -1.3, 0.6); c.stroke(); c.beginPath(); c.moveTo(3.6, -34.6); c.quadraticCurveTo(5.8, -38.4, 6.2, -42.5); c.stroke(); c.beginPath(); c.moveTo(5, -28); c.lineTo(6, -12); c.stroke(); c.beginPath(); c.moveTo(11.4, -16); c.lineTo(11.8, 0); c.stroke();
    c.restore();
  }
  let fogSpr = null;
  function fogSprite() {
    if (fogSpr) return fogSpr; const S = 128, cv2 = mk(S, S / 2), c = cv2.getContext("2d");
    const gr = c.createRadialGradient(S / 2, S / 4, 0, S / 2, S / 4, S / 2); gr.addColorStop(0, "rgba(120,60,50,1)"); gr.addColorStop(0.55, "rgba(90,40,36,.45)"); gr.addColorStop(1, "rgba(60,24,24,0)");
    c.fillStyle = gr; c.fillRect(0, 0, S, S / 2); return (fogSpr = cv2);
  }
  function newEmber(any) {
    return { x: rnd() * W, y: any ? H * (0.4 + rnd() * 0.65) : H + 10, v: 14 + rnd() * 30, sw: rnd() * TAU, a: 0.4 + rnd() * 0.6, r: 0.7 + rnd() * 1.6, life: 0 };
  }

  /* ---------- Bild ---------- */
  function draw(t) {
    if (!ctx || !layers) return;
    const g = layers.g, c = ctx, mov = !still();
    c.setTransform(1, 0, 0, 1, 0, 0);
    /* sanftes Parallax-Atmen */
    const px = mov ? Math.sin(t * 0.07) * 6 : 0;
    c.drawImage(layers.sky, 0, 0);
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    /* Mond mit Hof */
    const mr = g.mr; let gr = c.createRadialGradient(g.mx, g.my, mr * 0.6, g.mx, g.my, mr * 4.2);
    gr.addColorStop(0, "rgba(255,220,170,.30)"); gr.addColorStop(0.35, "rgba(240,140,90,.10)"); gr.addColorStop(1, "rgba(0,0,0,0)"); c.fillStyle = gr; c.fillRect(g.mx - mr * 4.2, g.my - mr * 4.2, mr * 8.4, mr * 8.4);
    c.fillStyle = "#f3e3c6"; c.beginPath(); c.arc(g.mx, g.my, mr, 0, TAU); c.fill();
    c.fillStyle = "rgba(196,160,128,.28)"; for (const [ox, oy, rr] of [[-0.3, -0.15, 0.22], [0.25, 0.3, 0.15], [0.35, -0.35, 0.1], [-0.1, 0.45, 0.12]]) { c.beginPath(); c.arc(g.mx + mr * ox, g.my + mr * oy, mr * rr, 0, TAU); c.fill(); }
    gr = c.createRadialGradient(g.mx - mr * 0.35, g.my - mr * 0.35, mr * 0.2, g.mx, g.my, mr); gr.addColorStop(0, "rgba(255,250,235,0)"); gr.addColorStop(1, "rgba(150,70,50,.35)"); c.fillStyle = gr; c.beginPath(); c.arc(g.mx, g.my, mr, 0, TAU); c.fill();
    /* Wolkenschleier vor dem Mond */
    const fs = fogSprite();
    for (let i = 0; i < 3; i++) { const span = mr * 16, cx = g.mx - span / 2 + ((i * span * 0.37 + t * (4 + i * 1.5)) % span), cy = g.my + (i - 1) * mr * 0.7, e = Math.min(1, Math.min(cx - (g.mx - span / 2), g.mx + span / 2 - cx) / (mr * 3)); c.globalAlpha = 0.5 * e; c.drawImage(fs, cx - mr * 3, cy - mr * 0.35, mr * 6, mr * 0.7); }
    c.globalAlpha = 1;
    c.setTransform(1, 0, 0, 1, px * 0.3 * dpr, 0); c.drawImage(layers.far, 0, 0);
    /* Feste */
    c.setTransform(1, 0, 0, 1, px * 0.6 * dpr, 0); c.drawImage(layers.fort, 0, 0);
    c.setTransform(dpr, 0, 0, dpr, px * 0.6 * dpr, 0);
    /* Fäden (glimmen rot, ein Lichtpunkt läuft entlang) */
    c.lineWidth = Math.max(0.6, g.s * 1.1);
    for (let i = 0; i < threads.length; i++) {
      const [a, b, sag] = threads[i], mx2 = (a[0] + b[0]) / 2, my2 = Math.max(a[1], b[1]) + sag + (mov ? Math.sin(t * 0.8 + i) * 2 * g.s : 0);
      c.strokeStyle = "rgba(220,50,40," + (0.32 + (mov ? Math.sin(t * 1.3 + i * 1.7) * 0.1 : 0)).toFixed(3) + ")";
      c.beginPath(); c.moveTo(a[0], a[1]); c.quadraticCurveTo(mx2, my2, b[0], b[1]); c.stroke();
      if (mov) { const u = ((t * 0.18 + i * 0.37) % 1), x = (1 - u) * (1 - u) * a[0] + 2 * u * (1 - u) * mx2 + u * u * b[0], y = (1 - u) * (1 - u) * a[1] + 2 * u * (1 - u) * my2 + u * u * b[1];
        c.globalCompositeOperation = "lighter"; c.fillStyle = "rgba(255,120,80,.55)"; c.beginPath(); c.arc(x, y, 1.6 * g.s + 0.6, 0, TAU); c.fill(); c.globalCompositeOperation = "source-over"; }
    }
    /* Fenster flackern */
    c.globalCompositeOperation = "lighter";
    for (const w of wins) {
      const fl = mov ? 0.75 + Math.sin(t * w.f * 3 + w.ph) * 0.12 + Math.sin(t * w.f * 7.3 + w.ph * 2) * 0.08 : 0.8;
      c.fillStyle = "rgba(255," + (w.tor ? 120 : 160) + ",70," + (0.7 * fl).toFixed(3) + ")";
      if (w.tor) { c.globalAlpha = 0.35 * fl; c.fillRect(w.x - w.w / 2, w.y - w.h / 2, w.w, w.h); c.globalAlpha = 1; continue; }
      c.beginPath(); c.moveTo(w.x - w.w / 2, w.y + w.h / 2); c.lineTo(w.x - w.w / 2, w.y - w.h * 0.15); c.quadraticCurveTo(w.x, w.y - w.h * 0.75, w.x + w.w / 2, w.y - w.h * 0.15); c.lineTo(w.x + w.w / 2, w.y + w.h / 2); c.closePath(); c.fill();
      c.globalAlpha = 0.09 * fl; c.beginPath(); c.arc(w.x, w.y, w.w * 1.6, 0, TAU); c.fill(); c.globalAlpha = 1;
    }
    c.globalCompositeOperation = "source-over";
    /* Nebelbänke um den Fuß der Feste */
    c.setTransform(dpr, 0, 0, dpr, px * 0.8 * dpr, 0);
    for (const f of fogs) { const x = ((f.x + (mov ? t * f.v : 0)) % (W * 1.4 + f.r * 2)) - f.r; c.globalAlpha = f.a; c.drawImage(fs, x - f.r, f.y - f.r * 0.22, f.r * 2, f.r * 0.44); }
    c.globalAlpha = 1;
    /* Vordergrund + Ezekiel */
    c.setTransform(1, 0, 0, 1, px * 1.2 * dpr, 0); c.drawImage(layers.fg, 0, 0);
    c.setTransform(dpr, 0, 0, dpr, px * 1.2 * dpr, 0); ezekiel(c, g, t);
    /* Glut steigt auf */
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (embers.length) {
      const dt = Math.min(0.05, Math.max(0, t - lastT)); c.globalCompositeOperation = "lighter";
      for (let i = 0; i < embers.length; i++) {
        const e = embers[i]; e.y -= e.v * dt; e.sw += dt * 1.3; e.life += dt; const x = e.x + Math.sin(e.sw) * 14;
        if (e.y < H * 0.18) { embers[i] = newEmber(false); continue; }
        const fade = Math.min(1, e.life / 0.8) * Math.min(1, (e.y - H * 0.18) / (H * 0.25));
        c.fillStyle = "rgba(255," + (110 + (i % 5) * 18) + ",50," + (e.a * fade * (0.7 + Math.sin(t * 9 + i) * 0.3)).toFixed(3) + ")";
        c.fillRect(x - e.r / 2, e.y - e.r / 2, e.r, e.r);
        if (e.r > 1.6) { c.globalAlpha = 0.25 * fade; c.beginPath(); c.arc(x, e.y, e.r * 2.2, 0, TAU); c.fill(); c.globalAlpha = 1; }
      }
      c.globalCompositeOperation = "source-over";
    }
    /* Leselicht: Mitte (Menü) leicht abdunkeln, Ränder als Vignette */
    gr = c.createRadialGradient(W / 2, H * (g.port ? 0.42 : 0.5), 0, W / 2, H * (g.port ? 0.42 : 0.5), Math.max(W, H) * 0.42);
    gr.addColorStop(0, "rgba(8,3,5,.55)"); gr.addColorStop(0.55, "rgba(8,3,5,.22)"); gr.addColorStop(1, "rgba(8,3,5,0)"); c.fillStyle = gr; c.fillRect(0, 0, W, H);
    gr = c.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.45, W / 2, H / 2, Math.max(W, H) * 0.78); gr.addColorStop(0, "rgba(0,0,0,0)"); gr.addColorStop(1, "rgba(0,0,0,.55)"); c.fillStyle = gr; c.fillRect(0, 0, W, H);
    lastT = t;
  }

  /* ---------- Lebenszyklus ---------- */
  function size() {
    const r = cv.parentNode ? cv.parentNode.getBoundingClientRect() : { width: innerWidth, height: innerHeight };
    const nd = Math.min(still() ? 1 : 1.5, window.devicePixelRatio || 1), nw = Math.max(1, Math.round(r.width)), nh = Math.max(1, Math.round(r.height));
    const sl = still(); /* W35 Optik: Stufenwechsel (z. B. Automatik 0 → 2) baut neu – sonst fehlte die Glut */
    if (nw === W && nh === H && nd === dpr && layers && sl === lastStill) return false;
    W = nw; H = nh; dpr = nd; lastStill = sl; cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); build(); return true;
  }
  function frame(now) {
    raf = 0; const title = document.getElementById("title");
    if (!cv || !title || title.hidden || off() || document.hidden) return;
    const t = (now - t0) / 1000, a = performance.now();
    const re = size();
    if (still()) { if (re || !st.frames) { draw(8); st.frames++; } }
    else { draw(t); st.frames++; }
    st.ms = st.ms * 0.95 + (performance.now() - a) * 0.05;
    if (!still()) raf = requestAnimationFrame(frame);
    else setTimeout(() => { if (!raf) raf = requestAnimationFrame(frame); }, 500); /* nur Größenwechsel nachziehen */
  }
  function ensure() {
    const title = document.getElementById("title"); if (!title) return;
    if (off()) { if (cv && cv.parentNode) cv.parentNode.removeChild(cv); return; }
    if (!cv) { cv = document.createElement("canvas"); cv.className = "w35-titel"; ctx = cv.getContext("2d"); t0 = performance.now(); }
    if (cv.parentNode !== title || title.firstChild !== cv) title.insertBefore(cv, title.firstChild);
    if (!title.hidden && !raf) { raf = requestAnimationFrame(frame); requestAnimationFrame(() => cv.classList.add("an")); }
  }
  function init() {
    const title = document.getElementById("title"); if (!title) return;
    new MutationObserver(ensure).observe(title, { attributes: true, attributeFilter: ["hidden"], childList: true });
    document.addEventListener("visibilitychange", ensure);
    ensure();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();

  /* 2) W35 Optik: Meldungen weichen Ezekiel. Steht Ezekiel (oder Spieler 2) hinter einer Meldung / Fundkarte /
     dem Herausforderungs-Kasten, wird genau dieses Element durchscheinend (filter: opacity 0,3) – man sieht sich selbst wieder.
     Prüfung alle 150 ms über höchstens ~8 Rechtecke (kein Zeichnen, auch auf Stufe 0 vernachlässigbar). Schalter Z.gfx.off.meldweich. */
  const css2 = document.createElement("style");
  css2.textContent = ".w35-weich{filter:opacity(.3)}"; /* filter multipliziert mit der eigenen Deckkraft: Verstecktes bleibt versteckt */
  document.head.appendChild(css2);
  const weich = new Set();
  function meldTick() {
    const P = Z.player, cam = Z.cam, cvs = document.getElementById("cv"), hud = document.getElementById("hud");
    const clear = () => { for (const e of weich) e.classList.remove("w35-weich"); weich.clear(); };
    if (!P || !Z.level || !cam || !cvs || (Z.gfx && Z.gfx.off && Z.gfx.off.meldweich) || (hud && hud.hidden) || (Z.ui && Z.ui.modalOpen)) return clear();
    const r = cvs.getBoundingClientRect(); if (!r.width || !cam.w) return clear();
    const sx = r.width / cam.w, sy = r.height / cam.h, boxes = [];
    for (const q of [P, Z.koop && Z.koop.p2].filter(Boolean)) { if (q.dead || q.x == null) continue;
      boxes.push([r.left + (q.x - cam.x) * sx - 6, r.top + (q.y - cam.y) * sy - 8 * sy, r.left + (q.x + q.w - cam.x) * sx + 6, r.top + (q.y + q.h - cam.y) * sy + 4]); }
    const els = Array.from(document.querySelectorAll("#meldungen>*, #card, #hfzeile"));
    const now = new Set();
    for (const el of els) {
      if (el.hidden || !el.offsetParent && el.id !== "hfzeile") continue;
      const a = el.getBoundingClientRect(); if (!a.width) continue;
      if (boxes.some(b => a.left < b[2] && a.right > b[0] && a.top < b[3] && a.bottom > b[1])) now.add(el);
    }
    for (const e of weich) if (!now.has(e)) e.classList.remove("w35-weich");
    for (const e of now) e.classList.add("w35-weich");
    weich.clear(); for (const e of now) weich.add(e);
  }
  /* W35 Optik: Koop auf kleinen Schirmen – die Leiste von Spieler 2 (#koop-hl, links oben) lag über den Meldungen.
     Überlappen sie, rücken die Meldungen in den freien Streifen zwischen Koop-Leiste und Karte/Gebietsname. Schalter off.koopmeld. */
  let koopMeldOn = false;
  function koopMeld() {
    const m = document.getElementById("meldungen"), k = document.getElementById("koop-hl");
    const reset = () => { if (koopMeldOn && m) { m.style.left = m.style.width = m.style.transform = ""; } koopMeldOn = false; };
    if (!m || !k || (Z.gfx && Z.gfx.off && Z.gfx.off.koopmeld) || !document.body.classList.contains("w31-koop2") || k.hidden || !k.offsetParent || document.body.classList.contains("bossplatte")) return reset();
    const kr = k.getBoundingClientRect(); if (!kr.width) return reset();
    if (!koopMeldOn) { const mr = m.getBoundingClientRect(); if (!(mr.left < kr.right && mr.right > kr.left && mr.top < kr.bottom && mr.bottom > kr.top)) return; }
    const z = parseFloat(getComputedStyle(m).zoom) || 1, mm = document.getElementById("minimap");
    const rightEdge = Math.min(innerWidth - 12, ...[mm].filter(e => e && e.offsetParent && e.getBoundingClientRect().width).map(e => e.getBoundingClientRect().left - 8));
    const x0 = kr.right + 10, w = rightEdge - x0;
    if (w < 180) return reset(); /* zu eng: lieber wie bisher */
    m.style.transform = "none"; m.style.left = (x0 / z) + "px"; m.style.width = (w / z) + "px"; koopMeldOn = true;
  }
  setInterval(() => { try { if (!document.hidden) { meldTick(); koopMeld(); } } catch (e) { console.error(e); } }, 150);
  Z.meldWeich = { tick: meldTick, n: () => weich.size };

  /* W35 Optik: Ezekiel im Getümmel lesbar halten. Rote Roben, Feuer und Funken verschwimmen sonst mit seinem roten Umhang.
     Steht ein Gegner direkt an/in ihm, blendet weich eine warme Standmarke unter den Füßen und ein schwacher Rückenschein ein
     (2 gecachte Sprites, nur Stufe ≥ 1, aus nach ~0,3 s ohne Gedränge). Schalter off.getuemmel. */
  const sprG = {}; const spriteG = (k, rgb) => { if (sprG[k]) return sprG[k]; const S = 64, cv2 = mk(S, S), g = cv2.getContext("2d"), q = g.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2); q.addColorStop(0, "rgba(" + rgb + ",1)"); q.addColorStop(0.45, "rgba(" + rgb + ",.45)"); q.addColorStop(1, "rgba(" + rgb + ",0)"); g.fillStyle = q; g.fillRect(0, 0, S, S); return (sprG[k] = cv2); };
  let gK = 0, gT = 0;
  const dp0 = Z.drawPlayer;
  if (dp0) Z.drawPlayer = function (c, P, t) {
    try {
      if (P && P === Z.player && c && c.canvas && c.canvas.id === "cv" && Z.level && !(Z.gfx && Z.gfx.off && Z.gfx.off.getuemmel) && Z.gq && !Z.gq.lean && !Z.gq.mini && Z.gq.level !== 0 && !P.dead) {
        const now = performance.now() / 1000, dt = Math.min(0.1, gT ? now - gT : 0.016); gT = now;
        let near = false; const cx = P.x + P.w / 2;
        for (const e of Z.enemies || []) { if (e.dead || (e.def && e.def.boss && e.w > 60)) continue; if (Math.abs(e.x + e.w / 2 - cx) < (e.w + P.w) / 2 + 10 && e.y < P.y + P.h + 4 && e.y + e.h > P.y - 4) { near = true; break; } }
        gK += ((near ? 1 : 0) - gK) * Math.min(1, dt * (near ? 9 : 3.5));
        if (gK > 0.02) {
          const fy = P.y + P.h; c.save(); c.globalCompositeOperation = "lighter";
          c.globalAlpha = 0.75 * gK; c.drawImage(spriteG("fuss", "255,205,120"), cx - 22, fy - 5, 44, 10);
          c.globalAlpha = 0.24 * gK; c.drawImage(spriteG("ruecken", "255,215,170"), cx - 24, P.y + P.h * 0.45 - 24, 48, 48);
          c.restore();
        }
      }
    } catch (e) { }
    return dp0.apply(this, arguments);
  };
  Z.getuemmelK = () => gK;

  /* 3) W35 Optik: Ferne hinter Fensterbögen auf Stufe 0. Dort wird der Gebietshintergrund einmal je Gebiet in
     Weltgröße (≤ Viertelauflösung) gebacken und in die leeren Flächen der Kachel-Chunks gemalt (bild.js lvBackFor/skyBack)
     – bisher nur Himmelsverlauf + Sterne, durch jedes Fenster eine flache Farbfläche. Jetzt malt dieselbe Backstufe
     je Gebietsart eine ferne Kulisse in Bändern (je ~18 Kacheln Höhe, damit jedes Fenster etwas zeigt): Hügel mit
     Türmen (Türme stehen auf dem Kamm), Säulengänge mit Bögen und warmem Licht, Tropfsteine/Seen/Glutwände in Höhlen.
     Kosten je Bild: 0 (es bleibt dieselbe gebackene Fläche), nur das Backen beim Gebietswechsel wird etwas länger.
     Kein Blau. Schalter Z.gfx.off.w35fern. */
  const hx = h => { h = (h || "#000").replace("#", ""); if (h.length === 3) h = h.replace(/./g, "$&$&"); const n = parseInt(h, 16) || 0; return [n >> 16 & 255, n >> 8 & 255, n & 255]; };
  const mixC = (a, b, t, al) => { const A = hx(a), Bc = hx(b); return "rgba(" + A.map((v, i) => Math.round(v + (Bc[i] - v) * t)).join(",") + "," + (al == null ? 1 : al) + ")"; };
  /* 4) W35 Optik: Parallaxe-Ferne (Stufe ≥1) für die schwächsten Innen-/Höhlengebiete anreichern – einmal je Gebiet in
     die ferne Ebene gebacken (bild.js G.buildLayers, eine Hakenzeile), Kosten je Bild 0.
     Keller: Weinregale, Laternen an Ketten, Lichtpfützen. Verlies: Fackeln an den Pfeilern, Fesseln an Ketten, Moos am Grund.
     Glockenturm: Glocken an Seilen in den Nischen, schräge Staub-Lichtbahnen. See: Nebelband über dem Wasser,
     leuchtende Flechten an den Felssäulen, Lichtfäden aus Deckenrissen, Glanz auf dem Wasser. Schalter Z.gfx.off.w35ferne. */
  Z.w35LayerBake = function (kind, f, m, LW, H, B, R0) {
    if (Z.gfx && Z.gfx.off && Z.gfx.off.w35ferne) return;
    let sd = 4711 + (kind || "").length * 131; const R = () => { sd = (sd * 16807) % 2147483647; return (sd - 1) / 2147483646; };
    const rep = fn => { for (const o of [-LW, 0, LW]) { f.save(); f.translate(o, 0); fn(); f.restore(); } };
    const glow = (c, x, y, r, rgb, a) => { const gg = c.createRadialGradient(x, y, 0, x, y, r); gg.addColorStop(0, "rgba(" + rgb + "," + a + ")"); gg.addColorStop(1, "rgba(" + rgb + ",0)"); c.fillStyle = gg; c.fillRect(x - r, y - r, r * 2, r * 2); };
    const dark = "rgba(14,10,8,.9)";
    const chain = (c, x, y0, y1) => { c.strokeStyle = "rgba(20,16,14,.9)"; c.lineWidth = 0.9; for (let y = y0; y < y1; y += 3) { c.beginPath(); if (((y - y0) / 3) & 1) { c.moveTo(x, y); c.lineTo(x, y + 3); } else { c.moveTo(x - 0.9, y + 1.5); c.lineTo(x + 0.9, y + 1.5); } c.stroke(); } };
    const lantern = (c, x, y) => { glow(c, x, y + 4, 26, "255,170,80", 0.32); c.fillStyle = dark; c.fillRect(x - 3.5, y - 1, 7, 2); c.fillRect(x - 3, y + 8, 6, 1.6); c.fillStyle = "rgba(255,200,120,.9)"; c.fillRect(x - 2.4, y + 1, 4.8, 7); c.fillStyle = dark; c.fillRect(x - 0.4, y + 1, 0.8, 7); };
    const torch = (c, x, y) => { glow(c, x, y - 4, 34, "255,150,60", 0.3); c.fillStyle = dark; c.fillRect(x - 1.2, y - 2, 2.4, 9); c.fillRect(x - 3, y - 2, 6, 1.6); c.fillStyle = "rgba(255,190,90,.95)"; c.beginPath(); c.moveTo(x - 2.4, y - 2); c.quadraticCurveTo(x, y - 11, x + 2.4, y - 2); c.fill(); c.fillStyle = "rgba(255,240,190,.9)"; c.beginPath(); c.moveTo(x - 1, y - 2); c.quadraticCurveTo(x, y - 6, x + 1, y - 2); c.fill(); };
    if (kind === "cellar" || kind === "dungeon" || kind === "belltower") {
      rep(() => {
        for (let i = 0; i < 5; i++) {
          const x = i * 128, cx = x + 64, fl = H * 0.9;
          /* Lichtpfütze am Nischengrund – die Nische bekommt Tiefe */
          if (kind !== "dungeon" || i % 2 === 0) glow(f, cx, fl, 54, kind === "dungeon" ? "120,170,90" : "255,160,80", kind === "dungeon" ? 0.1 : 0.13);
          if (kind === "cellar") {
            if (i % 2 === 1) { /* Weinregal: Raster mit Flaschenböden */
              const rx = cx - 30, ry = H * 0.52; f.fillStyle = "rgba(30,20,14,.95)"; f.fillRect(rx - 2, ry - 2, 64, 54);
              for (let a = 0; a < 5; a++) for (let b = 0; b < 4; b++) { const bx = rx + 6 + a * 12.5, by = ry + 6 + b * 12.5; f.fillStyle = "rgba(10,6,4,.95)"; f.beginPath(); f.arc(bx, by, 4.4, 0, TAU); f.fill(); if (R() < 0.72) { f.fillStyle = R() < 0.5 ? "rgba(70,90,40,.9)" : "rgba(90,30,30,.9)"; f.beginPath(); f.arc(bx, by, 3.2, 0, TAU); f.fill(); f.fillStyle = "rgba(255,220,180,.25)"; f.fillRect(bx - 1.6, by - 1.8, 1.2, 1.2); } }
            } else { chain(f, cx, H * 0.14, H * 0.42); lantern(f, cx, H * 0.42); }
          } else if (kind === "dungeon") {
            torch(f, x, H * 0.46);
            if (i % 2 === 1) { for (const dx of [-14, 14]) { chain(f, cx + dx, H * 0.3, H * 0.52); f.strokeStyle = "rgba(20,16,14,.9)"; f.lineWidth = 1.1; f.beginPath(); f.arc(cx + dx, H * 0.52 + 3, 3, 0, TAU); f.stroke(); } }
            const mg = f.createLinearGradient(0, H * 0.82, 0, H); mg.addColorStop(0, "rgba(60,90,40,0)"); mg.addColorStop(1, "rgba(60,90,40,.28)"); f.fillStyle = mg; f.fillRect(x + 18, H * 0.82, 92, H * 0.18);
          } else { /* Glockenturm */
            if (i % 2 === 0) { const by = H * (0.36 + (i % 3) * 0.04); f.strokeStyle = "rgba(30,22,16,.9)"; f.lineWidth = 1; f.beginPath(); f.moveTo(cx, H * 0.1); f.lineTo(cx, by - 14); f.stroke();
              const s = 0.8 + (i % 3) * 0.15; f.fillStyle = "rgba(58,40,24,.95)"; f.beginPath(); f.moveTo(cx - 15 * s, by + 8 * s); f.quadraticCurveTo(cx - 13 * s, by - 14 * s, cx, by - 14 * s); f.quadraticCurveTo(cx + 13 * s, by - 14 * s, cx + 15 * s, by + 8 * s); f.closePath(); f.fill();
              f.fillStyle = "rgba(40,28,16,.95)"; f.fillRect(cx - 16 * s, by + 6 * s, 32 * s, 3 * s); f.fillStyle = "rgba(255,200,130,.22)"; f.fillRect(cx - 9 * s, by - 10 * s, 2.2 * s, 16 * s); }
            f.save(); f.globalCompositeOperation = "lighter"; const lg = f.createLinearGradient(cx, H * 0.15, cx + 40, H); lg.addColorStop(0, "rgba(255,190,120,.10)"); lg.addColorStop(1, "rgba(255,190,120,0)"); f.fillStyle = lg;
            f.beginPath(); f.moveTo(cx - 24, H * 0.18); f.lineTo(cx - 12, H * 0.18); f.lineTo(cx + 46, H); f.lineTo(cx + 22, H); f.closePath(); f.fill(); f.restore();
          }
        }
      });
    } else if (kind === "lake") {
      rep(() => {
        const wy = H * 0.68;
        /* Nebelband über dem Wasser */
        const ng = f.createLinearGradient(0, wy - 40, 0, wy + 10); ng.addColorStop(0, "rgba(110,160,130,0)"); ng.addColorStop(0.75, "rgba(110,160,130,.14)"); ng.addColorStop(1, "rgba(110,160,130,0)"); f.fillStyle = ng; f.fillRect(0, wy - 40, LW, 50);
        /* Lichtfäden aus Deckenrissen */
        f.save(); f.globalCompositeOperation = "lighter";
        for (let i = 0; i < 4; i++) { const x = 60 + i * 160 + R() * 40, lg = f.createLinearGradient(0, 0, 0, wy); lg.addColorStop(0, "rgba(190,230,190,.12)"); lg.addColorStop(1, "rgba(190,230,190,0)"); f.fillStyle = lg; f.beginPath(); f.moveTo(x - 3, 0); f.lineTo(x + 3, 0); f.lineTo(x + 18, wy); f.lineTo(x - 6, wy); f.closePath(); f.fill();
          glow(f, x + 6, wy + 2, 22, "170,230,180", 0.16); }
        /* leuchtende Flechten an den Säulen (Säulen bei 90 + i*210) */
        for (let i = 0; i < 3; i++) { const x = 90 + i * 210 + R() * 40; for (let k = 0; k < 7; k++) { const px = x + (R() - 0.5) * 30, py = H * (0.2 + R() * 0.45); glow(f, px, py, 5 + R() * 5, R() < 0.25 ? "220,200,120" : "130,230,160", 0.5); } }
        /* Glanz auf dem Wasser */
        for (let i = 0; i < 26; i++) { f.fillStyle = "rgba(170,230,190," + (0.08 + R() * 0.16).toFixed(2) + ")"; f.fillRect(R() * LW, wy + 3 + R() * (H - wy) * 0.7, 6 + R() * 22, 1); }
        f.fillStyle = "rgba(170,230,190,.16)"; f.fillRect(0, wy, LW, 1);
        f.restore();
      });
    }
  };
  /* W35 Optik: Fernbild der Öffnungen (pracht.js PAINT, 512×288, einmal gebacken) für Keller/Verlies/Glockenturm/See
     mit Blickfängen versehen: Lichtpfützen, Laternen, Fackeln, Lichtbahnen, Glocken, Flechten, Glanz auf dem Wasser.
     Vorher kaum Kontrast – in den Öffnungen sah man nur Dunst. Schalter off.w35fernbild (wirkt beim nächsten Backen). */
  Z.w35MidPaint = function (bg, g, TW, TH) {
    if (Z.gfx && Z.gfx.off && Z.gfx.off.w35fernbild) return;
    if (!{ cellar: 1, dungeon: 1, belltower: 1, lake: 1 }[bg]) return;
    let sd = 911 + bg.length * 37; const R = () => { sd = (sd * 16807) % 2147483647; return (sd - 1) / 2147483646; };
    const glow = (x, y, r, rgb, a) => { const q = g.createRadialGradient(x, y, 0, x, y, r); q.addColorStop(0, "rgba(" + rgb + "," + a + ")"); q.addColorStop(1, "rgba(" + rgb + ",0)"); g.fillStyle = q; g.fillRect(x - r, y - r, r * 2, r * 2); };
    const shaft = (x, w, len, rgb, a, lean) => { g.save(); g.globalCompositeOperation = "lighter"; const q = g.createLinearGradient(0, 0, 0, len); q.addColorStop(0, "rgba(" + rgb + "," + a + ")"); q.addColorStop(1, "rgba(" + rgb + ",0)"); g.fillStyle = q; g.beginPath(); g.moveTo(x - w / 2, 0); g.lineTo(x + w / 2, 0); g.lineTo(x + w / 2 + lean + w, len); g.lineTo(x - w / 2 + lean - w, len); g.closePath(); g.fill(); g.restore(); };
    const dark = "rgba(12,8,6,.92)";
    if (bg === "cellar") {
      for (let i = 0; i < 4; i++) { const x = 40 + i * 128 + R() * 40, y = TH * (0.3 + R() * 0.12);
        g.strokeStyle = dark; g.lineWidth = 1; g.beginPath(); g.moveTo(x, 0); g.lineTo(x, y); g.stroke();
        glow(x, y + 6, 46, "255,170,80", 0.42); glow(x, TH * 0.9, 70, "255,150,70", 0.18);
        g.fillStyle = dark; g.fillRect(x - 4, y - 1, 8, 2); g.fillStyle = "rgba(255,205,130,.95)"; g.fillRect(x - 3, y + 1, 6, 8); g.fillStyle = dark; g.fillRect(x - 0.5, y + 1, 1, 8); g.fillRect(x - 3.5, y + 9, 7, 1.5); }
      shaft(TW * 0.62, 10, TH, "255,210,150", 0.12, 30);
    } else if (bg === "dungeon") {
      shaft(TW * 0.3, 14, TH * 0.95, "230,220,180", 0.13, 24); shaft(TW * 0.78, 10, TH * 0.9, "230,220,180", 0.1, 18);
      for (const x of [TW * 0.3 + 30, TW * 0.78 + 22]) { g.fillStyle = "rgba(230,220,180,.06)"; g.beginPath(); g.ellipse(x, TH * 0.9, 34, 6, 0, 0, TAU); g.fill(); }
      for (let i = 0; i < 3; i++) { const x = 90 + i * 160 + R() * 30, y = TH * 0.45; glow(x, y - 4, 40, "255,150,60", 0.42); g.fillStyle = "rgba(255,200,100,.95)"; g.beginPath(); g.moveTo(x - 3, y); g.quadraticCurveTo(x, y - 12, x + 3, y); g.fill(); g.fillStyle = dark; g.fillRect(x - 1.2, y, 2.4, 9); }
      /* Käfig an einer Kette */
      const cx = TW * 0.55, cy = TH * 0.42; g.strokeStyle = dark; g.lineWidth = 1.2; g.beginPath(); g.moveTo(cx, 0); g.lineTo(cx, cy - 14); g.stroke();
      g.beginPath(); g.ellipse(cx, cy - 10, 12, 4, 0, Math.PI, 0); g.stroke(); for (let k = -2; k <= 2; k++) { g.beginPath(); g.moveTo(cx + k * 5, cy - 11); g.lineTo(cx + k * 5, cy + 16); g.stroke(); } g.beginPath(); g.moveTo(cx - 12, cy + 16); g.lineTo(cx + 12, cy + 16); g.stroke();
    } else if (bg === "belltower") {
      /* Rosenfenster mit Abendlicht und schräger Staubbahn */
      const rx = TW * 0.7, ry = TH * 0.24; glow(rx, ry, 70, "255,170,90", 0.35); g.fillStyle = "rgba(255,190,120,.55)"; g.beginPath(); g.arc(rx, ry, 22, 0, TAU); g.fill();
      g.strokeStyle = dark; g.lineWidth = 2; g.beginPath(); g.arc(rx, ry, 22, 0, TAU); g.stroke(); for (let k = 0; k < 8; k++) { const a = k / 8 * TAU; g.beginPath(); g.moveTo(rx, ry); g.lineTo(rx + Math.cos(a) * 22, ry + Math.sin(a) * 22); g.stroke(); } g.beginPath(); g.arc(rx, ry, 8, 0, TAU); g.stroke();
      g.save(); g.globalCompositeOperation = "lighter"; const q = g.createLinearGradient(rx, ry, rx - 140, TH); q.addColorStop(0, "rgba(255,190,120,.2)"); q.addColorStop(1, "rgba(255,190,120,0)"); g.fillStyle = q; g.beginPath(); g.moveTo(rx - 16, ry + 8); g.lineTo(rx + 16, ry + 12); g.lineTo(rx - 80, TH); g.lineTo(rx - 190, TH); g.closePath(); g.fill(); g.restore();
      /* Glockenränder fangen Licht */
      g.fillStyle = "rgba(255,200,130,.25)"; for (let k = 0; k < 4; k++) { const x = 60 + k * 120 + 15; g.fillRect(x - 12, TH * 0.6, 24, 1.5); }
    } else if (bg === "lake") {
      for (let i = 0; i < 3; i++) shaft(80 + i * 170 + R() * 40, 8, TH * 0.72, "190,235,195", 0.16, 14);
      for (let i = 0; i < 26; i++) { const x = R() * TW, y = TH * (0.12 + R() * 0.5); glow(x, y, 4 + R() * 7, R() < 0.25 ? "230,210,130" : "130,235,165", 0.55); }
      /* ferne Ruine mit Licht am Ufer */
      const rx = TW * 0.36, base = TH * 0.72; g.fillStyle = "#08120c"; g.fillRect(rx - 26, base - 40, 52, 40); g.beginPath(); g.moveTo(rx - 30, base - 40); g.lineTo(rx, base - 62); g.lineTo(rx + 30, base - 40); g.fill();
      glow(rx, base - 22, 30, "255,190,110", 0.35); g.fillStyle = "rgba(255,210,140,.9)"; g.fillRect(rx - 3, base - 28, 6, 9);
      for (let k = 0; k < 6; k++) { g.fillStyle = "rgba(255,200,130," + (0.3 - k * 0.045) + ")"; g.fillRect(rx - 5 + R() * 4, base + 3 + k * 4, 8 + R() * 6, 1); }
      g.fillStyle = "rgba(170,235,190,.22)"; g.fillRect(0, base, TW, 1);
    }
  };

  /* W35 Optik: Öffnungen in diesen Gebieten zeigen das pracht.js-Fernbild nur noch zu ~60 % – die angereicherte Parallaxe
     (Laternen, Fackeln, Glocken, Flechten) scheint durch. Nur ein Faktor auf globalAlpha, keine Bildkosten. */
  const MIDK = { cellar: 0.85, dungeon: 0.85, belltower: 0.85, lake: 0.8 }; /* Runde 3: Fernbild selbst angereichert → wieder deckender */
  Z.w35MidK = bg => (Z.gfx && Z.gfx.off && Z.gfx.off.w35ferne) || !Z.gq || Z.gq.layers === false ? 1 : (MIDK[bg] || 1);

  /* W35 Optik: Laufbilanz (Tod/Umkehr/Sieg) – Kacheln ausgewogen verteilen statt einer einzelnen Kachel in der letzten
     Zeile: Spaltenzahl so wählen, dass alle Zeilen fast gleich voll sind, letzte Zeile mittig. Schalter off.bilanzraster. */
  const css3 = document.createElement("style");
  css3.textContent = ".bilanz.w35-raster{display:flex;flex-wrap:wrap;justify-content:center}.bilanz.w35-raster>.bk{flex:0 0 calc((100% - (var(--w35c) - 1) * 6px) / var(--w35c));box-sizing:border-box;min-width:0}";
  document.head.appendChild(css3);
  function raster() {
    if (Z.gfx && Z.gfx.off && Z.gfx.off.bilanzraster) return;
    document.querySelectorAll("#modal .bilanz").forEach(bl => {
      const n = bl.querySelectorAll(":scope > .bk").length; if (!n) return;
      bl.classList.remove("w35-raster"); /* Spaltenzahl des ursprünglichen Rasters (auto-fill) übernehmen */
      const fit = Math.max(1, (getComputedStyle(bl).gridTemplateColumns || "").split(" ").filter(Boolean).length), rows = Math.ceil(n / fit), cols = Math.ceil(n / rows);
      bl.style.setProperty("--w35c", cols); bl.classList.add("w35-raster");
    });
  }
  { const md = document.getElementById("modal"); if (md) new MutationObserver(() => { try { raster(); } catch (e) { console.error(e); } }).observe(md, { childList: true, subtree: true }); window.addEventListener("resize", () => { try { raster(); } catch (e) { } }); }
  Z.w35Raster = raster;

  /* W35 Optik: Ausrüstungskarten (Pause → Ausrüstung) zeigen das Symbol der Waffe/Fähigkeit im Kopf – vorher nur Text.
     Gemalt mit Z.drawIcon (wie Fundbuch/HUD), Rahmen in Seltenheitsfarbe (--rar). Schalter off.agicon. */
  const css4 = document.createElement("style");
  css4.textContent = ".ag-karte .w35-ico{float:left;width:42px;height:42px;margin:1px 10px 2px 0;border-radius:7px;border:1px solid color-mix(in srgb,var(--rar,#a0968a) 55%,#2a1c18);background:radial-gradient(circle at 50% 58%,color-mix(in srgb,var(--rar,#a0968a) 26%,transparent),rgba(0,0,0,0) 72%),rgba(10,6,8,.35);box-shadow:inset 0 1px 0 rgba(255,230,190,.08)}.ag-karte .ag-innen{clear:both}@media (max-height:520px){.ag-karte .w35-ico{width:32px;height:32px;margin-right:7px}}";
  document.head.appendChild(css4);
  /* W35 Optik: Auftragsfenster – Belohnung als goldene Marke statt Spiegelstrich-Liste, „Annehmen“ als Hauptknopf hervorgehoben */
  const css5 = document.createElement("style");
  css5.textContent = ".mbox.auftr .au-lohn{list-style:none;margin:4px 0 8px;padding:0;display:flex;flex-wrap:wrap;gap:6px}.mbox.auftr .au-lohn li{margin:0;padding:3px 10px;border:1px solid rgba(229,180,84,.45);border-radius:999px;background:linear-gradient(rgba(229,180,84,.12),rgba(229,180,84,.04));box-shadow:inset 0 1px 0 rgba(255,230,170,.12)}" +
    ".mbox.auftr .au-wahl button[data-act='aufAn']{color:var(--gold2,#ffd27a)}";
  document.head.appendChild(css5);
  function agIcons() {
    if ((Z.gfx && Z.gfx.off && Z.gfx.off.agicon) || !Z.drawIcon || !Z.itemDef) return;
    const P = Z.player; if (!P || !P.slots) return;
    const items = ["a1", "a2", "s1", "s2"].map(k => P.slots[k]).filter(Boolean);
    document.querySelectorAll("#modal .ag-karte").forEach(card => {
      if (card.querySelector(".w35-ico")) return;
      const kopf = card.querySelector(".ic-kopf"), nm = kopf && kopf.querySelector("b"); if (!nm) return;
      const name = nm.textContent.trim();
      const it = items.find(x => { try { const d = Z.itemDef(x); return (Z.itemTitle ? Z.itemTitle(x) : "") === name || Z.L(d.n) === name; } catch (e) { return false; } });
      if (!it) return; const d = Z.itemDef(it); if (!d || !d.icon) return;
      const cv = document.createElement("canvas"); cv.className = "w35-ico"; cv.width = 84; cv.height = 84;
      const c = cv.getContext("2d"); c.scale(84 / 32, 84 / 32); Z.drawIcon(c, d.icon, 16, 17, 22, d.col || (Z.RARITY[it.rar] || {}).col);
      kopf.parentNode.insertBefore(cv, kopf);
    });
  }
  { const md = document.getElementById("modal"); if (md) new MutationObserver(() => { try { agIcons(); } catch (e) { console.error(e); } }).observe(md, { childList: true, subtree: true }); }

  Z.w35SkyBake = function (g, w, h, B, R, world) {
    if (!B || !B.sky || (Z.gfx && Z.gfx.off && Z.gfx.off.w35fern)) return;
    const lv = Z.level, k = world && lv ? w / (lv.W * 16) : h / 270; /* Bildpunkte je Welt-Pixel */
    const bh = world ? 208 * k : h, sky = B.sky, wall = B.wall || "#2a2224", kind = B.bg || "castle";
    const dk = mixC(sky[0], "#000000", 0.35), mid = mixC(sky[1], wall, 0.5);
    const SKY = { castle: 1, ramparts: 1, harbour: 1, spires: 1, storm: 1 }, CAVE = { chasm: 1, lake: 1, embercity: 1 };
    const glow = (x, y, r, rgb, a) => { const gg = g.createRadialGradient(x, y, 0, x, y, r); gg.addColorStop(0, "rgba(" + rgb + "," + a + ")"); gg.addColorStop(1, "rgba(" + rgb + ",0)"); g.fillStyle = gg; g.fillRect(x - r, y - r, r * 2, r * 2); };
    const warm = kind === "dungeon" ? "150,210,120" : kind === "forge" || kind === "embercity" ? "255,140,50" : kind === "chasm" ? "200,140,255" : kind === "lake" ? "130,220,160" : "255,180,100";
    for (let by = 0, bi = 0; by < h; by += bh, bi++) {
      const hz = by + bh * 0.66, sh = (bi * 0.37) % 1;
      if (SKY[kind]) {
        /* Mond nur im obersten Band, ferner Kamm mit Türmen, die auf ihm stehen */
        const ridgeY = x => hz - (Math.sin(x / (90 * k) + bi * 1.7) * 10 + Math.sin(x / (37 * k) + bi) * 4) * k;
        const fade = g.createLinearGradient(0, hz - 30 * k, 0, by + bh); fade.addColorStop(0, mixC(sky[1], "#000000", 0.45)); fade.addColorStop(0.75, mixC(sky[0], "#000000", 0.5, 0.85)); fade.addColorStop(1, mixC(sky[0], "#000000", 0.5, 0));
        if (kind === "harbour") { /* grünliches Meer mit Glanzstrichen, Leuchtturm auf Fels */
          g.fillStyle = "rgba(26,50,34,.85)"; g.fillRect(0, hz, w, bh * 0.3);
          for (let i = 0; i < w / (18 * k); i++) { g.fillStyle = "rgba(170,220,180," + (0.06 + R() * 0.1).toFixed(2) + ")"; g.fillRect(R() * w, hz + R() * bh * 0.28, (6 + R() * 16) * k, Math.max(1, 0.8 * k)); }
          for (let x = (120 + sh * 300) * k; x < w; x += 520 * k) { g.fillStyle = dk; g.beginPath(); g.moveTo(x - 26 * k, hz + 2 * k); g.lineTo(x - 10 * k, hz - 14 * k); g.lineTo(x + 12 * k, hz - 12 * k); g.lineTo(x + 28 * k, hz + 2 * k); g.fill();
            g.fillRect(x - 5 * k, hz - 62 * k, 10 * k, 50 * k); g.fillRect(x - 7 * k, hz - 68 * k, 14 * k, 6 * k); glow(x, hz - 72 * k, 22 * k, "255,200,120", 0.5); g.fillStyle = "rgba(255,220,150,.9)"; g.fillRect(x - 2 * k, hz - 74 * k, 4 * k, 5 * k); }
          for (let x = (300 + sh * 200) * k; x < w; x += 340 * k) { g.strokeStyle = dk; g.lineWidth = Math.max(1, 1.4 * k); g.beginPath(); g.moveTo(x, hz); g.lineTo(x, hz - 46 * k); g.moveTo(x - 14 * k, hz - 34 * k); g.lineTo(x + 14 * k, hz - 34 * k); g.stroke(); g.fillStyle = dk; g.fillRect(x - 22 * k, hz - 4 * k, 44 * k, 6 * k); }
          continue;
        }
        { const hg = g.createLinearGradient(0, hz - 60 * k, 0, hz); hg.addColorStop(0, mixC(sky[2], "#ffa868", 0.3, 0)); hg.addColorStop(1, mixC(sky[2], "#ffa868", 0.42, 0.9)); g.fillStyle = hg; g.fillRect(0, hz - 60 * k, w, 60 * k); }
        /* zweiter, fernerer Kamm mit kleinen Dächern (Stadt am Fuß) */
        g.fillStyle = mixC(sky[2], "#000000", 0.45, 0.8); g.beginPath(); g.moveTo(0, hz + 4 * k); for (let x = 0; x <= w + 4; x += 4) g.lineTo(x, hz - 14 * k - Math.sin(x / (60 * k) + bi * 3) * 6 * k); g.lineTo(w, hz + 4 * k); g.closePath(); g.fill();
        g.fillStyle = fade; g.beginPath(); g.moveTo(0, by + bh); for (let x = 0; x <= w + 4; x += 4) g.lineTo(x, ridgeY(x)); g.lineTo(w, by + bh); g.closePath(); g.fill();
        const tw = kind === "spires" ? 15 : 12, step = (kind === "ramparts" ? 110 : 130) * k;
        for (let cx0 = (70 + sh * 260) * k; cx0 < w + 120 * k; cx0 += (kind === "ramparts" ? 280 : 380) * k * (0.85 + R() * 0.5)) {
          /* Burggruppe: Mauer mit Zinnen auf dem Kamm, darauf 3–5 Türme, der mittlere am höchsten */
          const nT = 3 + ((R() * 3) | 0), cw = (70 + R() * 90) * k, wb = ridgeY(cx0) + 4 * k, colT = mixC(sky[0], "#000000", 0.4);
          if (kind !== "spires") { const wh = (kind === "storm" ? 14 : 24) * k; g.fillStyle = colT; g.fillRect(cx0 - cw / 2, wb - wh, cw, wh + 8 * k); for (let z = cx0 - cw / 2; z < cx0 + cw / 2 - 2 * k; z += 6 * k) if (kind !== "storm" || R() < 0.6) g.fillRect(z, wb - wh - 3 * k, 3 * k, 3 * k);
            for (let q = 0; q < cw / (16 * k); q++) if (R() < 0.35) { g.fillStyle = "rgba(255,190,110,.7)"; g.fillRect(cx0 - cw / 2 + (q + 0.5) * 16 * k, wb - wh * 0.6, 2 * k, 3 * k); } }
          for (let j = 0; j < nT; j++) {
          const x = cx0 - cw / 2 + cw * (j / (nT - 1)) + (R() - 0.5) * 6 * k, big = j === (nT >> 1) ? 1.35 : 0.65 + R() * 0.35;
          const base = Math.max(ridgeY(x), wb - 2 * k) + 3 * k, th = (kind === "spires" ? 110 : kind === "storm" ? 50 : 80) * k * big, tW = tw * k * (0.75 + big * 0.35);
          g.fillStyle = mixC(sky[0], "#000000", 0.4);
          if (kind === "spires") { g.beginPath(); g.moveTo(x - tW * 1.6, base + 6 * k); g.lineTo(x - tW * 0.5, base - th * 0.55); g.lineTo(x + tW * 0.5, base - th * 0.55); g.lineTo(x + tW * 1.6, base + 6 * k); g.fill(); }
          g.fillRect(x - tW / 2, base - th, tW, th + 2 * k);
          if (kind === "storm") { g.beginPath(); g.moveTo(x - tW / 2, base - th); g.lineTo(x - tW * 0.1, base - th - 5 * k); g.lineTo(x + tW * 0.2, base - th + 2 * k); g.lineTo(x + tW / 2, base - th - 3 * k); g.lineTo(x + tW / 2, base - th + 4 * k); g.fill(); }
          else { g.beginPath(); g.moveTo(x - tW * 0.7, base - th + 1); g.lineTo(x, base - th - tW * 1.6); g.lineTo(x + tW * 0.7, base - th + 1); g.fill(); }
                    for (let q = 0; q < 2; q++) if (R() < 0.7) { const wy = base - th * (0.35 + q * 0.3 + R() * 0.1); glow(x, wy, 7 * k, "255,170,90", 0.25); g.fillStyle = "rgba(255,200,120,.85)"; g.fillRect(x - 1.4 * k, wy - 2 * k, 2.8 * k, 4 * k); }
          }
        }
        if (kind === "storm") for (let i = 0; i < w * bh / (900 * k * k); i++) { const x = R() * w, y = by + R() * bh * 0.8; g.strokeStyle = "rgba(200,220,190,.07)"; g.lineWidth = Math.max(1, 0.6 * k); g.beginPath(); g.moveTo(x, y); g.lineTo(x - 4 * k, y + 16 * k); g.stroke(); }
      } else if (CAVE[kind]) {
        /* Tropfsteine von der Banddecke, Stalagmiten am Grund, Glimmen; See mit Glanz; Glutwand */
        const col = mixC(wall, "#000000", 0.45, 0.9), rim = "rgba(" + warm + ",.14)";
        for (let x = sh * 40 * k; x < w; x += (18 + R() * 26) * k) { const ln = (10 + R() * 34) * k, sw = (4 + R() * 6) * k; g.fillStyle = col; g.beginPath(); g.moveTo(x - sw, by); g.lineTo(x, by + ln); g.lineTo(x + sw, by); g.fill(); g.fillStyle = rim; g.beginPath(); g.moveTo(x + sw, by); g.lineTo(x, by + ln); g.lineTo(x + sw * 0.4, by); g.fill(); }
        if (kind === "lake") { const wy = hz + 6 * k; g.fillStyle = "rgba(8,22,16,.9)"; g.fillRect(0, wy, w, by + bh - wy); for (let i = 0; i < w / (14 * k); i++) { g.fillStyle = "rgba(140,220,170," + (0.05 + R() * 0.12).toFixed(2) + ")"; g.fillRect(R() * w, wy + 2 * k + R() * (bh * 0.28), (8 + R() * 20) * k, Math.max(1, 0.8 * k)); } }
        for (let x = sh * 60 * k; x < w; x += (40 + R() * 70) * k) { const hh = (8 + R() * 26) * k, sw = (5 + R() * 6) * k, yb = kind === "lake" ? hz + 7 * k : by + bh; g.fillStyle = col; g.beginPath(); g.moveTo(x - sw, yb); g.lineTo(x, yb - hh); g.lineTo(x + sw, yb); g.fill(); }
        const n = Math.round(w * bh / (2600 * k * k) * (kind === "embercity" ? 2 : 1));
        for (let i = 0; i < n; i++) { const x = R() * w, y = by + bh * (0.25 + R() * 0.45); const rgb = kind === "embercity" && R() < 0.22 ? "120,255,140" : kind === "chasm" && R() < 0.5 ? "130,230,120" : warm; glow(x, y, (4 + R() * 6) * k, rgb, 0.6); }
        if (kind === "embercity") { const gg = g.createLinearGradient(0, by + bh * 0.6, 0, by + bh); gg.addColorStop(0, "rgba(255,110,40,0)"); gg.addColorStop(1, "rgba(255,110,40,.16)"); g.fillStyle = gg; g.fillRect(0, by + bh * 0.6, w, bh * 0.4); }
      } else {
        /* Innenräume (Keller, Hallen, Verlies, Schmiede, Glockenturm): ferner Säulengang mit Bögen, dahinter warmes Licht */
        const pw = (kind === "halls" ? 120 : 96) * k, top = by + bh * 0.22, bot = by + bh, colC = mixC(wall, "#000000", 0.5, 0.92), rimC = mixC(wall, "#ffffff", 0.08, 0.5);
        for (let x = -sh * pw; x < w + pw; x += pw) {
          const cx = x + pw / 2;
          if (R() < (kind === "dungeon" ? 0.45 : 0.7)) glow(cx, top + (bh * 0.42), pw * 0.5, warm, kind === "halls" ? 0.42 : 0.32);
          if (kind === "halls" && R() < 0.7) { g.fillStyle = "rgba(255,190,110,.18)"; g.fillRect(cx - 8 * k, top + 14 * k, 16 * k, 46 * k); g.fillStyle = colC; g.fillRect(cx - 0.6 * k, top + 14 * k, 1.2 * k, 46 * k); g.fillRect(cx - 8 * k, top + 36 * k, 16 * k, 1.2 * k); }
        }
        g.fillStyle = colC; g.beginPath();
        for (let x = -sh * pw; x < w + pw; x += pw) { const r = pw / 2 - 8 * k; g.moveTo(x - 8 * k, bot); g.lineTo(x - 8 * k, top - 40 * k); g.lineTo(x + pw + 8 * k, top - 40 * k); g.lineTo(x + pw + 8 * k, bot); g.lineTo(x + pw - 8 * k, bot); g.lineTo(x + pw - 8 * k, top + r * 0.3); g.arc(x + pw / 2, top + r * 0.3, r, 0, Math.PI, true); g.lineTo(x + 8 * k, bot); g.closePath(); }
        g.fill();
        g.strokeStyle = rimC; g.lineWidth = Math.max(1, 0.9 * k);
        for (let x = -sh * pw; x < w + pw; x += pw) { const r = pw / 2 - 8 * k; g.beginPath(); g.arc(x + pw / 2, top + r * 0.3, r, Math.PI, 0); g.stroke(); }
        if (kind === "belltower") for (let x = (40 + sh * 90) * k; x < w; x += 260 * k) { g.strokeStyle = colC; g.lineWidth = Math.max(1, k); g.beginPath(); g.moveTo(x, top - 40 * k); g.lineTo(x, top + 6 * k); g.stroke(); g.fillStyle = colC; g.beginPath(); g.moveTo(x - 11 * k, top + 26 * k); g.quadraticCurveTo(x - 9 * k, top + 6 * k, x, top + 6 * k); g.quadraticCurveTo(x + 9 * k, top + 6 * k, x + 11 * k, top + 26 * k); g.closePath(); g.fill(); }
        /* Boden des Säulengangs */
        g.fillStyle = colC; g.fillRect(0, bot - 6 * k, w, 6 * k);
      }
    }
  };
  Z.titelSzene = { draw: t => { size(); draw(t || 0); }, stat: () => ({ frames: st.frames, ms: +st.ms.toFixed(2), W, H, dpr, still: still(), embers: embers.length }) };
})();
