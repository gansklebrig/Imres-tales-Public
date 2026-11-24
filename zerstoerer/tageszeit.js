/* Ezekiel – The Destroyer · Tageszeit und Mond
   Jeder Lauf spielt zu einer eigenen Stunde: Abenddämmerung mit goldenem Gegenlicht und langen Wolkenbändern,
   tiefe Nacht mit Sternen, Milchstraße und Mond (Sichel bis Vollmond), Morgengrauen mit Nebel und rosa Licht –
   und bei Pakten oder Totenköpfen steigt der Blutmond auf.
   - Die Himmelsfarben des Gebiets werden sanft getönt (Z.biome.sky, das Original bleibt in B._sky0).
   - Der Himmel der fernen Ebene (bild.js) wird beim einmaligen Bau neu gemalt: Verlauf, Sonnenglut, Sterne,
     Milchstraße, Mond mit Phase, Wolkenbänder – alles HINTER den Silhouetten (eingehängt in den Bau, nicht pro Bild).
   - Tiefenunschärfe (Stufe 2/3): ferne und mittlere Ebene werden beim Bau einmal weich gezeichnet, der Himmel bleibt klar.
   - Lebendig (sparsam, nur über dem Horizont): funkelnde Sterne, Sternschnuppen, Polarlicht-Schleier in Gold/Grün/Violett,
     ziehende Wolkenbänder, Nebel im Tal, Blutmond-Korona.
   Stufe 0 (Handheld): nichts davon – Originalfarben, kein Mehraufwand.
   Farbregel: kein Blau. Nacht = violett/schwarz/silbrig, Dämmerung = gold/rosa/purpur. */
(function () {
  "use strict";
  const Z = window.Z, G = Z.gfx;
  const TAU = Math.PI * 2, PI = Math.PI;
  const LW = 640; /* Kachelbreite der fernen Ebene (bild.js) */
  const PFX = 0.12, PFY = 0.08, PMX = 0.32; /* Parallaxe der fernen Ebene wie in bild.js */
  const OUT = { castle: 1, camp: 1, ramparts: 1, spires: 1, storm: 1, harbour: 1 };

  /* ======================= FARBEN ======================= */
  const HX = new Map();
  function hex(h) {
    let v = HX.get(h); if (v) return v;
    let s = h.charAt(0) === "#" ? h.slice(1) : h; if (s.length === 3) s = s[0] + s[0] + s[1] + s[1] + s[2] + s[2];
    const n = parseInt(s, 16); v = [n >> 16 & 255, n >> 8 & 255, n & 255]; HX.set(h, v); return v;
  }
  const cl = v => v < 0 ? 0 : v > 255 ? 255 : Math.round(v);
  const toHex = (r, g, b) => "#" + ((1 << 24) | (cl(r) << 16) | (cl(g) << 8) | cl(b)).toString(16).slice(1);
  function mix(a, b, t) { const A = hex(a), B = hex(b); return toHex(A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t); }
  const shade = (h, k) => k >= 0 ? mix(h, "#ffffff", k) : mix(h, "#000000", -k);
  function rgba(h, a) { const v = hex(h); return "rgba(" + v[0] + "," + v[1] + "," + v[2] + "," + (a < 0 ? 0 : a > 1 ? 1 : a).toFixed(3) + ")"; }
  /* kein Blau: Blauanteil höchstens leicht über Rot (Lila bleibt erlaubt) */
  function nb(h) { const v = hex(h); const m = Math.max(v[0] * 1.2, v[1]); return v[2] > m ? toHex(v[0], v[1], m) : h; }
  const hsh = i => { let h = Math.imul((i | 0) ^ 0x9e3779b9, 0x85ebca6b); h ^= h >>> 13; h = Math.imul(h, 0xc2b2ae35); h ^= h >>> 16; return (h >>> 0) / 4294967296; };
  const frac = v => v - Math.floor(v);
  const smooth = (a, b, v) => { const t = Math.max(0, Math.min(1, (v - a) / (b - a))); return t * t * (3 - 2 * t); };

  /* weiche Leuchtflecken: einmal erzeugt, dann nur drawImage */
  const GL = new Map();
  function glowSpr(col, soft) {
    const key = col + (soft ? "s" : ""); let s = GL.get(key); if (s) return s;
    const cv = document.createElement("canvas"); cv.width = cv.height = 64; const c = cv.getContext("2d");
    const g = c.createRadialGradient(32, 32, 0, 32, 32, 32);
    if (soft) { g.addColorStop(0, rgba(col, 0.6)); g.addColorStop(0.45, rgba(col, 0.28)); g.addColorStop(1, rgba(col, 0)); }
    else { g.addColorStop(0, rgba(col, 1)); g.addColorStop(0.2, rgba(col, 0.5)); g.addColorStop(0.55, rgba(col, 0.14)); g.addColorStop(1, rgba(col, 0)); }
    c.fillStyle = g; c.fillRect(0, 0, 64, 64); GL.set(key, cv); return cv;
  }
  /* LIVE: beim Zeichnen je Bild über G.drawScaled (Leuchten in Bildschirmgröße zwischengespeichert, bild.js) */
  let LIVE = false;
  function glow(c, x, y, rx, ry, col, a, soft) { if (a <= 0.004) return; c.globalAlpha = a > 1 ? 1 : a; if (LIVE && G.drawScaled) G.drawScaled(c, glowSpr(col, soft), x - rx, y - ry, rx * 2, ry * 2); else c.drawImage(glowSpr(col, soft), x - rx, y - ry, rx * 2, ry * 2); }

  /* ======================= DIE STUNDEN ======================= */
  /* sky: Zenit, Mitte, Horizont · k: Tönungsstärke draußen · light: Kantenlicht (Mond/Sonne) · win: Licht durch Fenster
     lit: Anteil erleuchteter Fenster draußen · stars: Sternendichte · mist: Nebel im Tal */
  const HOURS = {
    abend: { n: ["Abenddämmerung", "Dusk"], sky: ["#2a1236", "#7a2c4e", "#e8904c"], k: 0.55, light: "#ffc274", win: "#ffb468", lit: 0.38, stars: 0.12, mist: 0.15, glow: "#ffd28a", glow2: "#ff8a4a", band: "#5a2440", bandLit: "#ffb860", amb: "#ff9a50", grade: "#6a2a3a" },
    nacht: { n: ["Tiefe Nacht", "Deep Night"], sky: ["#07050b", "#1c1226", "#3e2c44"], k: 0.62, light: "#e8e0ec", win: "#d8cce0", lit: 0.48, stars: 1, mist: 0.1, glow: "#c8b8d0", glow2: "#6a4a70", band: "#140c18", bandLit: "#c8bcc8", amb: "#8a7aa0", grade: "#140a1c" },
    morgen: { n: ["Morgengrauen", "Dawn"], sky: ["#24182e", "#8e4c6c", "#f4b89c"], k: 0.55, light: "#ffcab8", win: "#ffc4b0", lit: 0.15, stars: 0.18, mist: 0.75, glow: "#ffd0b8", glow2: "#ff8a8a", band: "#6a3a58", bandLit: "#ffc0a8", amb: "#ffa8a0", grade: "#5a3050" },
    blut: { n: ["Blutmond", "Blood Moon"], sky: ["#0c0306", "#3c0a12", "#7c1c1a"], k: 0.7, light: "#ff6a50", win: "#ff5a40", lit: 0.32, stars: 0.3, mist: 0.3, glow: "#ff5a3a", glow2: "#8a1010", band: "#1a0608", bandLit: "#ff6a4a", amb: "#c83020", grade: "#3a0608" }
  };
  Z.ZEITEN = HOURS;

  /* ======================= ZUSTAND JE LAUF ======================= */
  let camp = null, force = null;
  function roll(seed, skulls, pacts, fk) {
    const R = Z.Rng((seed ^ 0x7a3c19) >>> 0);
    const n = (skulls || 0) + (pacts || 0);
    let k;
    if (fk) { k = fk; R(); }
    else if (n >= 3 || (n > 0 && R() < Math.min(0.85, 0.3 + 0.18 * n))) k = "blut";
    else { const r = R(); k = r < 0.32 ? "abend" : r < 0.74 ? "nacht" : "morgen"; }
    const z = { k, seed: (seed * 2654435761) >>> 0 };
    /* Mondphase: 0 Neumond, 0.5 Vollmond (zunehmend < 0.5 < abnehmend) */
    z.p = k === "blut" ? 0.5 : k === "abend" ? 0.1 + R() * 0.2 : k === "morgen" ? 0.72 + R() * 0.18 : (R() < 0.12 ? 0.02 : 0.08 + R() * 0.84);
    z.mx = 70 + R() * 500; z.my = 0.09 + R() * 0.12;
    z.sx = 80 + R() * 480;
    z.aurora = k === "nacht" ? R() < 0.5 : k === "blut" ? R() < 0.45 : k === "abend" ? R() < 0.12 : false;
    z.shower = k === "nacht" && R() < 0.3;
    z.halo = k === "nacht" && z.p > 0.35 && z.p < 0.65 && R() < 0.45;
    z.mw = 40 + R() * 360; /* Milchstraße: Fußpunkt */
    return z;
  }
  function current() {
    if (force) return force;
    const run = Z.run;
    if (run) {
      if (!run.zeit) run.zeit = roll(run.seed || 1, run.skulls, run.pacts ? run.pacts.length : 0);
      return run.zeit;
    }
    if (!camp) { camp = roll((Math.random() * 4294967296) >>> 0, 0, 0); if (camp.k === "morgen") camp.k = "abend"; }
    return camp;
  }
  const qLevel = () => Z.gq && Number.isFinite(Z.gq.level) && Z.gq.level >= 0 ? Z.gq.level : 2;
  const active = () => qLevel() > 0;
  function kindNow() {
    const B = Z.biome, lv = Z.level; if (!B) return "";
    const ak = lv && lv.arena && Z.ARENAS && Z.ARENAS[lv.arena] ? Z.ARENAS[lv.arena].kind : null;
    return ak === "hoard" ? "hoardbg" : ak === "lab" ? "labbg" : ak === "lakeboss" ? "lake" : ak === "towertop" ? "storm" : ak === "pier" ? "harbour" : ak === "tower" ? "ramparts" : B.bg;
  }
  /* öffentlicher Zustand: Stunde, Mond, Farben (null auf Stufe 0) */
  function state() {
    if (!active()) return null;
    const z = current(), H = HOURS[z.k] || HOURS.nacht, kind = kindNow();
    const bright = z.k === "blut" ? 1 : (1 - Math.cos(z.p * TAU)) / 2;
    const out = !!OUT[kind];
    return {
      k: z.k, name: H.n, p: z.p, moonBright: bright, out, kind, storm: kind === "storm",
      light: z.k === "nacht" ? mix("#a898b0", H.light, 0.35 + 0.65 * bright) : H.light,
      win: H.win, lit: H.lit, mist: H.mist, amb: H.amb, grade: H.grade, glow: H.glow, band: H.band, bandLit: H.bandLit,
      aurora: z.aurora && kind !== "storm", shower: z.shower && kind !== "storm", z, H
    };
  }
  Z.zeit = state;
  Z.zeitName = () => { const s = state(); return s ? Z.L(s.name) : ""; };

  /* ======================= HIMMELSFARBEN TÖNEN ======================= */
  function applyTint(B) {
    if (!B || !B.sky) return;
    if (!B._sky0) B._sky0 = B.sky.slice();
    const s = state();
    if (!s || !OUT[kindNow()]) { B.sky = B._sky0.slice(); return; }
    const H = HOURS[s.k], k = H.k * (s.storm ? 0.75 : 1);
    B.sky = B._sky0.map((c, i) => nb(mix(c, H.sky[i], k)));
  }

  /* ======================= FERNE EBENE: HIMMEL MALEN ======================= */
  let sky = null; /* { H, line: Float32Array (Horizont je 4 Einheiten), path: Path2D, twinkle: [], moon: {x,y,r}, bands: [] } */
  const STAR_RE = /^rgba\(255,\s*240,\s*230/, REFL_RE = /^rgba\(240,\s*220,\s*200/;
  const STAR_COLS = ["#fff8f0", "#fff0d8", "#ffe8e0", "#f0e8f0", "#ffe0b8", "#f8e8ff"];

  /* Mond als eigenes Bild: Randverdunklung, Meere, Krater, Phase mit Erdschein */
  function moonSprite(r, s, z, kind) {
    const pad = 2, W = Math.ceil((r * 2 + pad * 2) * s), cv = document.createElement("canvas"); cv.width = cv.height = W;
    const c = cv.getContext("2d"); c.scale(s, s); c.translate(r + pad, r + pad);
    const blood = z.k === "blut";
    const base = blood ? "#e0603c" : z.k === "nacht" ? "#f4eee2" : z.k === "abend" ? "#f8e4d4" : "#f6e0dc";
    const dark = blood ? "#7a1610" : "#a89aa0";
    const R = Z.Rng((z.seed ^ 0x51ed) >>> 0);
    /* Scheibe mit Textur (einmal), daraus Hell- und Erdschein-Teil */
    const tex = document.createElement("canvas"); tex.width = tex.height = W; const t = tex.getContext("2d"); t.scale(s, s); t.translate(r + pad, r + pad);
    const g = t.createRadialGradient(-r * 0.25, -r * 0.25, r * 0.1, 0, 0, r);
    g.addColorStop(0, shade(base, 0.12)); g.addColorStop(0.7, base); g.addColorStop(1, mix(base, dark, 0.45));
    t.fillStyle = g; t.beginPath(); t.arc(0, 0, r, 0, TAU); t.fill();
    t.save(); t.beginPath(); t.arc(0, 0, r, 0, TAU); t.clip();
    /* Meere: weiche dunkle Flächen */
    for (const [mx, my, mr] of [[-0.3, -0.25, 0.34], [0.1, -0.35, 0.22], [0.25, 0.05, 0.28], [-0.1, 0.25, 0.2], [-0.45, 0.15, 0.16], [0.42, -0.2, 0.14]]) {
      const gg = t.createRadialGradient(mx * r, my * r, 0, mx * r, my * r, mr * r * 1.3);
      gg.addColorStop(0, rgba(mix(base, dark, 0.75), 0.55)); gg.addColorStop(0.7, rgba(mix(base, dark, 0.6), 0.35)); gg.addColorStop(1, rgba(dark, 0));
      t.fillStyle = gg; t.fillRect(-r, -r, r * 2, r * 2);
    }
    /* Krater: heller Rand unten rechts, Schatten oben links */
    for (let i = 0; i < 26; i++) {
      const a = R() * TAU, d = Math.sqrt(R()) * r * 0.9, cx = Math.cos(a) * d, cy = Math.sin(a) * d, cr = r * (0.03 + R() * R() * 0.13);
      t.fillStyle = rgba(mix(base, dark, 0.8), 0.45); t.beginPath(); t.arc(cx - cr * 0.15, cy - cr * 0.15, cr, 0, TAU); t.fill();
      t.strokeStyle = rgba(shade(base, 0.3), 0.55); t.lineWidth = Math.max(0.25, cr * 0.25); t.beginPath(); t.arc(cx, cy, cr, 0.1, 1.9); t.stroke();
    }
    /* Strahlenkrater (Tycho) */
    const tx = r * 0.05, ty = r * 0.62; t.strokeStyle = rgba(shade(base, 0.35), 0.18); t.lineWidth = 0.4;
    for (let i = 0; i < 9; i++) { const a = R() * TAU; t.beginPath(); t.moveTo(tx, ty); t.lineTo(tx + Math.cos(a) * r * 0.9, ty + Math.sin(a) * r * 0.9); t.stroke(); }
    t.restore();
    /* Erdschein: die dunkle Seite schimmert ganz leicht */
    if (blood || z.k === "nacht") { c.fillStyle = blood ? "#2a0806" : "#1a1220"; c.beginPath(); c.arc(0, 0, r, 0, TAU); c.fill(); c.globalAlpha = blood ? 0.85 : 0.13; c.drawImage(tex, -r - pad, -r - pad, W / s, W / s); c.globalAlpha = 1; }
    /* beleuchteter Teil */
    let p = z.p; const wax = p <= 0.5; if (!wax) p = 1 - p;
    const kx = Math.cos(p * TAU) * r; /* > 0 Sichel, < 0 Dreiviertel */
    if (p > 0.015) {
      c.save(); if (!wax) c.scale(-1, 1);
      c.beginPath(); c.arc(0, 0, r + 0.01, -PI / 2, PI / 2, false);
      if (kx >= 0) c.ellipse(0, 0, Math.max(0.01, kx), r, 0, PI / 2, -PI / 2, true); else c.ellipse(0, 0, -kx, r, 0, PI / 2, PI * 1.5, false);
      c.closePath(); c.clip(); if (!wax) c.scale(-1, 1);
      c.drawImage(tex, -r - pad, -r - pad, W / s, W / s);
      c.restore();
    }
    /* Blutmond: dunkler Kernschatten der Erde, Rand glimmt */
    if (blood) { const bg = c.createRadialGradient(-r * 0.2, r * 0.1, r * 0.2, 0, 0, r); bg.addColorStop(0, "rgba(40,4,4,.35)"); bg.addColorStop(0.75, "rgba(60,8,6,.15)"); bg.addColorStop(1, "rgba(255,120,60,.35)"); c.fillStyle = bg; c.beginPath(); c.arc(0, 0, r, 0, TAU); c.fill(); }
    return { cv, W: W / s, pad };
  }

  /* Sterne + Milchstraße + Mond + Sonne + Wolkenbänder, in Ebenenkoordinaten (LW × H), nahtlos */
  function paintSky(c, H, st) {
    const z = st.z, Hh = HOURS[z.k], R = Z.Rng((z.seed ^ 0x2b1d) >>> 0), B = Z.biome, s3 = B.sky;
    const hor = H * 0.6; /* Horizontlinie hinter den Bergen */
    const storm = st.storm;
    sky = { H, twinkle: [], moon: null, bands: [], hor, k: z.k };
    /* 1) reicherer Verlauf als die drei Gebietsfarben */
    const g = c.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, shade(s3[0], -0.25)); g.addColorStop(0.22, s3[0]); g.addColorStop(0.45, mix(s3[0], s3[1], 0.75)); g.addColorStop(0.56, s3[1]);
    g.addColorStop(0.64, mix(s3[1], s3[2], 0.85)); g.addColorStop(0.78, mix(s3[2], s3[1], 0.4)); g.addColorStop(1, shade(s3[1], -0.3));
    c.fillStyle = g; c.fillRect(0, 0, LW, H);
    const wrap = (x, w, fn) => { fn(x); if (x - w < 0) fn(x + LW); if (x + w > LW) fn(x - LW); };
    /* 2) Sonnenglut hinter dem Horizont (Abend/Morgen): goldenes Gegenlicht mit Strahlenfächer */
    if (z.k === "abend" || z.k === "morgen") {
      const sx = z.sx, sy = hor + 6, warm = Hh.glow, warm2 = Hh.glow2, dim = storm ? 0.45 : 1;
      c.globalCompositeOperation = "lighter";
      wrap(sx, H * 1.1, x => {
        const gg = c.createRadialGradient(x, sy, 0, x, sy, H * 1.05);
        gg.addColorStop(0, rgba(warm, 0.75 * dim)); gg.addColorStop(0.12, rgba(warm, 0.42 * dim)); gg.addColorStop(0.35, rgba(warm2, 0.2 * dim)); gg.addColorStop(0.7, rgba(warm2, 0.05 * dim)); gg.addColorStop(1, rgba(warm2, 0));
        c.fillStyle = gg; c.fillRect(Math.max(0, x - H * 1.05), 0, H * 2.1, H);
        if (!storm) { /* Strahlenfächer: weich auslaufend */
          const rg = c.createRadialGradient(x, sy, 10, x, sy, H * 0.8); rg.addColorStop(0, rgba(warm, 0.07)); rg.addColorStop(0.5, rgba(warm, 0.028)); rg.addColorStop(1, rgba(warm, 0));
          c.fillStyle = rg; c.beginPath();
          for (let i = 0; i < 13; i++) { const a = -PI / 2 + (i - 6) * 0.17 + (R() - 0.5) * 0.08, L = H * 0.8, w = 0.018 + R() * 0.03; c.moveTo(x, sy); c.lineTo(x + Math.cos(a - w) * L, sy + Math.sin(a - w) * L); c.lineTo(x + Math.cos(a + w) * L, sy + Math.sin(a + w) * L); c.closePath(); }
          c.fill();
        }
        /* Sonnenscheibe, halb hinter dem Horizont */
        if (!storm) { glow(c, x, sy - 2, 26, 22, warm, 0.8); c.globalAlpha = 1; c.fillStyle = rgba(shade(warm, 0.4), 0.9); c.beginPath(); c.arc(x, sy, 9, 0, TAU); c.fill(); }
      });
      /* Horizontband */
      const hb = c.createLinearGradient(0, hor - 40, 0, hor + 20); hb.addColorStop(0, rgba(warm, 0)); hb.addColorStop(0.7, rgba(warm, 0.22 * dim)); hb.addColorStop(1, rgba(warm2, 0));
      c.globalAlpha = 1; c.fillStyle = hb; c.fillRect(0, hor - 40, LW, 60);
      c.globalCompositeOperation = "source-over"; c.globalAlpha = 1;
    }
    /* Nachtleuchten am Horizont (silbrig-violett), Blutmond: rote Glut */
    if (z.k === "nacht" || z.k === "blut") {
      const hb = c.createLinearGradient(0, hor - 70, 0, hor + 10); hb.addColorStop(0, rgba(Hh.glow2, 0)); hb.addColorStop(0.8, rgba(Hh.glow2, z.k === "blut" ? 0.4 : 0.28)); hb.addColorStop(1, rgba(Hh.glow2, 0));
      c.fillStyle = hb; c.fillRect(0, hor - 70, LW, 80);
    }
    /* 3) Sterne */
    const nS = storm ? 0 : Math.round(300 * Hh.stars * (z.k === "nacht" ? 1.15 - 0.45 * st.moonBright : 1));
    const top = hor - 8;
    for (let i = 0; i < nS; i++) {
      const y = Math.pow(R(), z.k === "nacht" ? 1.25 : 2.2) * top, x = R() * LW, big = R();
      const fade = Math.pow(1 - y / top, 0.6);
      let a = (0.25 + R() * 0.7) * fade;
      if (z.k === "abend" || z.k === "morgen") a *= 0.15 + 0.85 * smooth(0.12, 0.5, Math.abs(frac((x - z.sx) / LW + 0.5) - 0.5));
      const col = z.k === "blut" ? (R() < 0.5 ? "#ffc8b0" : "#ff9a80") : STAR_COLS[(R() * STAR_COLS.length) | 0];
      const sz = big < 0.86 ? 0.55 + R() * 0.3 : big < 0.97 ? 1 : 1.4;
      c.fillStyle = rgba(col, a); c.fillRect(x - sz / 2, y - sz / 2, sz, sz);
      if (sz >= 1.4 && a > 0.4) { c.fillStyle = rgba(col, a * 0.35); c.fillRect(x - 2.4, y - 0.2, 4.8, 0.4); c.fillRect(x - 0.2, y - 2.4, 0.4, 4.8); }
      if (sz >= 1 && a > 0.35 && sky.twinkle.length < 70) sky.twinkle.push({ x, y, s: sz, col, a, ph: R() * TAU, f: 0.8 + R() * 2.2 });
    }
    /* Milchstraße: diagonales Band aus Sternstaub, Glanz und dunklen Staubbahnen (nur in klaren Nächten) */
    if (!storm && z.k === "nacht" && st.moonBright < 0.8) {
      const mwA = 1 - st.moonBright * 0.7;
      const x0 = z.mw, x1 = x0 + 300, y0 = -20, y1 = hor + 10, len = Math.hypot(x1 - x0, y1 - y0), nx = -(y1 - y0) / len, ny = (x1 - x0) / len;
      const at = u => [x0 + (x1 - x0) * u, y0 + (y1 - y0) * u];
      c.globalCompositeOperation = "lighter";
      for (let i = 0; i < 70; i++) {
        const u = R(), [px, py] = at(u), off = (R() - 0.5) * 30, w = 18 + R() * 34, fade = smooth(1, 0.55, u) * mwA;
        const col = R() < 0.45 ? "#e8dce8" : R() < 0.6 ? "#f0d8b4" : "#b88ccc";
        wrap(px + nx * off, w, xx => glow(c, xx, py + ny * off, w, w * 0.7, col, (0.05 + R() * 0.07) * fade, true));
      }
      c.globalAlpha = 1;
      for (let i = 0; i < 900; i++) {
        const u = R(), [px, py] = at(u), gs = (R() + R() + R() - 1.5) * 26, fade = smooth(1, 0.5, u) * mwA;
        const a = (0.15 + R() * 0.55) * fade, xx = ((px + nx * gs) % LW + LW) % LW;
        c.fillStyle = rgba(R() < 0.7 ? "#fff4ec" : "#f0d8c0", a); c.fillRect(xx, py + ny * gs, 0.5, 0.5);
      }
      c.globalCompositeOperation = "source-over";
      /* dunkle Staubbahnen */
      c.strokeStyle = rgba(shade(s3[0], -0.4), 0.38 * mwA); c.lineCap = "round";
      for (let k = 0; k < 3; k++) {
        const off = (k - 1) * 7 + (R() - 0.5) * 4; c.lineWidth = 2 + R() * 3.5;
        for (const dx of [0, -LW, LW]) { c.beginPath(); for (let u = 0.02; u < 0.75; u += 0.02) { const [px, py] = at(u), w = Math.sin(u * 23 + k * 2) * 3; const X = px + nx * (off + w) + dx, Y = py + ny * (off + w); u < 0.03 ? c.moveTo(X, Y) : c.lineTo(X, Y); } c.stroke(); }
      }
      c.lineCap = "butt";
    }
    /* Morgenstern / Abendstern */
    if ((z.k === "morgen" || z.k === "abend") && !storm) {
      const vx = ((z.sx + (z.k === "abend" ? 70 : -70)) % LW + LW) % LW, vy = hor * 0.42;
      c.globalCompositeOperation = "lighter"; glow(c, vx, vy, 9, 9, "#fff4e0", 0.6); c.globalAlpha = 1; c.globalCompositeOperation = "source-over";
      c.fillStyle = "#fffaf0"; c.fillRect(vx - 0.8, vy - 0.8, 1.6, 1.6); c.fillStyle = "rgba(255,248,235,.45)"; c.fillRect(vx - 4, vy - 0.25, 8, 0.5); c.fillRect(vx - 0.25, vy - 4, 0.5, 8);
      sky.twinkle.push({ x: vx, y: vy, s: 1.6, col: "#fffaf0", a: 1, ph: 0, f: 1.4 });
    }
    /* 4) Mond */
    const showMoon = z.p > 0.015 || z.k === "blut";
    if (showMoon) {
      const r = z.k === "blut" ? 21 : 14, mx = z.mx, my = H * z.my + (z.k === "abend" || z.k === "morgen" ? H * 0.12 : 0);
      sky.moon = { x: mx, y: my, r };
      const mb = z.k === "blut" ? 1 : st.moonBright, mcol = z.k === "blut" ? "#ff5030" : z.k === "nacht" ? "#f0e4e8" : "#ffe0d0";
      c.globalCompositeOperation = "lighter";
      wrap(mx, r * 9, x => {
        glow(c, x, my, r * 9, r * 9, z.k === "blut" ? "#a01810" : Hh.glow2, (storm ? 0.25 : 0.4) * (0.35 + mb * 0.65), true);
        glow(c, x, my, r * 3.6, r * 3.6, mcol, (storm ? 0.25 : 0.42) * (0.25 + mb * 0.75));
      });
      c.globalAlpha = 1;
      /* Mondhof: weicher, schwach schillernder Ring */
      if (z.halo && !storm) wrap(mx, r * 6, x => { const hg = c.createRadialGradient(x, my, r * 4.3, x, my, r * 5.8); hg.addColorStop(0, "rgba(216,184,216,0)"); hg.addColorStop(0.45, "rgba(232,212,232,.07)"); hg.addColorStop(0.6, "rgba(255,224,176,.06)"); hg.addColorStop(1, "rgba(255,224,176,0)"); c.fillStyle = hg; c.fillRect(x - r * 6, my - r * 6, r * 12, r * 12); });
      c.globalCompositeOperation = "source-over";
      if (!storm) {
        const sp = moonSprite(r, Math.max(2, (c.getTransform ? c.getTransform().a : 1.2) * 1.5), z);
        c.globalAlpha = z.k === "abend" || z.k === "morgen" ? 0.72 : 1;
        wrap(mx, r + 3, x => c.drawImage(sp.cv, x - r - sp.pad, my - r - sp.pad, sp.W, sp.W));
        c.globalAlpha = 1;
      }
    }
    /* 5) lange Wolkenbänder: dunkle Leiber, von unten (Sonne) bzw. vom Mond her angeleuchtet */
    const nb2 = storm ? 18 : z.k === "nacht" ? 5 : z.k === "blut" ? 8 : 13;
    for (let i = 0; i < nb2; i++) {
      const y = H * ((z.k === "nacht" ? 0.22 : 0.1) + R() * 0.36) + (storm ? -10 : 0), x = R() * LW, w = 90 + R() * 260, h = (z.k === "nacht" ? 4 : 2.2) + R() * 5 + (storm ? 6 : 0);
      const lx = sky.moon ? sky.moon.x : z.sx, dist = Math.abs(frac((x - lx) / LW + 0.5) - 0.5) * LW;
      const litK = z.k === "abend" || z.k === "morgen" ? 0.35 + 0.65 * Math.max(0, 1 - dist / 380) : (sky.moon ? Math.max(0, 1 - dist / 260) * st.moonBright : 0.1);
      const body = mix(Hh.band, s3[1], 0.25), litC = Hh.bandLit;
      const low = z.k === "abend" || z.k === "morgen", tilt = (R() - 0.5) * 0.04, np = 7 + (w / 30 | 0);
      const puffs = []; for (let k = 0; k < np; k++) { const u = k / (np - 1) - 0.5, taper = 1 - Math.abs(u) * 1.3; puffs.push([u * w + (R() - 0.5) * 14, u * w * tilt + (R() - 0.5) * h * 0.6, (14 + R() * 26) * (0.6 + taper * 0.6), h * (0.5 + R() * 0.7) * (0.45 + taper * 0.7), R()]); }
      wrap(x, w, xx => {
        /* weicher Schatten/Dunst um das Band */
        glow(c, xx, y, w * 0.6, h * 2.4, body, 0.35, true); c.globalAlpha = 1;
        /* R42: weiche Bäusche (elliptischer Verlauf) statt harter Ovale; Schalter off.wolkenweich = alte Fassung */
        const hart = !!(G.off && G.off.wolkenweich);
        const se = (x2, y2, rx, ry, col, al) => { if (hart) { c.fillStyle = rgba(col, al); c.beginPath(); c.ellipse(x2, y2, rx, ry, 0, 0, TAU); c.fill(); return; } c.save(); c.translate(x2, y2); c.scale(rx * 1.12, ry * 1.35); const g = c.createRadialGradient(0, 0, 0, 0, 0, 1); g.addColorStop(0, rgba(col, Math.min(1, al * 1.05))); g.addColorStop(0.7, rgba(col, al * 0.8)); g.addColorStop(1, rgba(col, 0)); c.fillStyle = g; c.fillRect(-1, -1, 2, 2); c.restore(); };
        for (const [ox, oy2, rx, ry, rr] of puffs) se(xx + ox, y + oy2, rx, Math.max(0.8, ry), rr < 0.5 ? body : shade(body, -0.15), 0.55 + rr * 0.3);
        if (litK > 0.05) {
          c.globalCompositeOperation = "lighter";
          for (const [ox, oy2, rx, ry, rr] of puffs) se(xx + ox + (rr - 0.5) * 4, y + oy2 + (low ? ry * 0.55 : -ry * 0.55), rx * 0.8, Math.max(0.5, ry * 0.32), litC, (0.12 + rr * 0.22) * litK * (hart ? 1 : 1.2));
          c.globalCompositeOperation = "source-over";
        }
      });
      if (sky.bands.length < 4 && !storm) sky.bands.push({ y, w, h, body, litC, litK, sp: 1.5 + R() * 3, x0: R() * LW });
    }
    /* Blutmond: ein dunkles Wolkenband zieht über die Scheibe */
    if (z.k === "blut" && sky.moon) { const m = sky.moon; wrap(m.x, 60, xx => { for (let k = 0; k < 4; k++) { c.fillStyle = rgba("#1a0406", 0.6); c.beginPath(); c.ellipse(xx - 30 + k * 22, m.y + m.r * 0.45 + (k & 1) * 2, 26, 2.6, 0, 0, TAU); c.fill(); c.fillStyle = rgba("#ff6a40", 0.35); c.beginPath(); c.ellipse(xx - 30 + k * 22, m.y + m.r * 0.45 + (k & 1) * 2 - 2, 20, 0.7, 0, 0, TAU); c.fill(); } }); }
  }

  /* Horizontlinie aus dem Vergleich vor/nach dem Malen der Silhouetten (verkleinert – billig) */
  const SMALL = 4;
  function smallCopy(cv) {
    const w = Math.ceil(LW / SMALL), h = Math.ceil(sky.H / SMALL), t = document.createElement("canvas"); t.width = w; t.height = h;
    const g = t.getContext("2d", { willReadFrequently: true }); g.drawImage(cv, 0, 0, w, h); return g.getImageData(0, 0, w, h).data;
  }
  function skyline(before, after) {
    const w = Math.ceil(LW / SMALL), h = Math.ceil(sky.H / SMALL), line = new Float32Array(w);
    for (let x = 0; x < w; x++) {
      let y = 0;
      for (; y < h; y++) { const i = (y * w + x) * 4; if (Math.abs(before[i] - after[i]) + Math.abs(before[i + 1] - after[i + 1]) + Math.abs(before[i + 2] - after[i + 2]) > 10) break; }
      line[x] = y * SMALL;
    }
    /* vorsichtig: Nachbarn mitnehmen (schmale Spitzen) */
    const out = new Float32Array(w);
    for (let x = 0; x < w; x++) out[x] = Math.min(line[(x + w - 1) % w], line[x], line[(x + 1) % w]) - 2;
    sky.line = out;
    const p = new Path2D(); p.moveTo(-1, -60); p.lineTo(LW + 1, -60);
    for (let x = w - 1; x >= 0; x--) p.lineTo(x * SMALL + SMALL / 2, Math.max(0, out[x]));
    p.lineTo(-1, Math.max(0, out[0])); p.closePath(); sky.path = p;
    sky.twinkle = sky.twinkle.filter(s => s.y < out[Math.floor(((s.x % LW) + LW) % LW / SMALL)] - 1);
    if (sky.moon) { const m = sky.moon; sky.moon.vis = m.y + m.r < out[Math.floor(m.x / SMALL) % w]; }
  }
  Z.zeitSkyline = () => sky;

  /* ======================= WEICHZEICHNEN (einmal je Bau) ======================= */
  const canFilter = (() => { try { const t = document.createElement("canvas").getContext("2d"); if (!("filter" in t)) return false; t.filter = "blur(2px)"; return t.filter === "blur(2px)"; } catch (e) { return false; } })();
  Z.zeitCanFilter = canFilter;
  /* Weichzeichnen mit nahtloser Wiederholung in x; px in Leinwandpixeln. Ohne ctx.filter: verkleinern + vergrößern */
  function blurCopy(cv, px, wrapX) {
    const w = cv.width, h = cv.height, out = document.createElement("canvas"); out.width = w; out.height = h; const o = out.getContext("2d");
    o.imageSmoothingEnabled = true; o.imageSmoothingQuality = "high";
    if (px <= 0.2) { o.drawImage(cv, 0, 0); return out; }
    /* günstig: verkleinert weichzeichnen und wieder vergrößern (das Vergrößern glättet zusätzlich) */
    const k = px < 1.2 ? 1 + px * 0.7 : Math.min(4, 1 + px * 0.6), sw = Math.max(1, Math.round(w / k)), sh = Math.max(1, Math.round(h / k));
    const t = document.createElement("canvas"); t.width = sw; t.height = sh; const tc = t.getContext("2d"); tc.imageSmoothingEnabled = true; tc.imageSmoothingQuality = "high";
    const rest = px / k;
    if (canFilter && rest > 0.35 && px >= 1.2) {
      tc.filter = "blur(" + rest.toFixed(2) + "px)";
      if (wrapX) { tc.drawImage(cv, -sw, 0, sw, sh); tc.drawImage(cv, sw, 0, sw, sh); }
      tc.drawImage(cv, 0, 0, sw, sh); tc.filter = "none";
    } else tc.drawImage(cv, 0, 0, sw, sh);
    o.drawImage(t, 0, 0, w, h);
    return out;
  }
  Z.zeitBlur = blurCopy;

  /* ======================= EINHÄNGEN IN DEN BAU DER FERNEN EBENE ======================= */
  const sl0 = G.setLevel;
  G.setLevel = function (level, biome) { sky = null; applyTint(biome); return sl0.apply(this, arguments); };
  const bl0 = G.buildLayers;
  G.buildLayers = function () {
    const B = Z.biome; applyTint(B); sky = null;
    const st = state(), kind = kindNow();
    const t0 = performance.now(), L0 = G.layers;
    if (!st || !OUT[kind]) { const r = bl0.apply(this, arguments); if (G.layers !== L0) midBlur(); Z.zeitMs = +(performance.now() - t0).toFixed(1); return r; }
    const H = Math.ceil(Z.cam.h + 120);
    const P = CanvasRenderingContext2D.prototype, fr0 = P.fillRect, D = Z.draw, circ0 = D.circ, glow0 = D.glow;
    let done = false, before = null, sharp = null;
    /* Nur während dieses einen Aufrufs: Himmel nach dem Verlauf neu malen, alten Mond/alte Sterne auslassen */
    P.fillRect = function (x, y, w, h) {
      if (!done && x === 0 && y === 0 && w === LW && h === H && typeof this.fillStyle === "object") {
        done = true; fr0.call(this, x, y, w, h);
        try { paintSky(this, H, st); before = smallCopy(this.canvas); sharp = document.createElement("canvas"); sharp.width = this.canvas.width; sharp.height = this.canvas.height; sharp.getContext("2d").drawImage(this.canvas, 0, 0); } catch (err) { console.error("tageszeit himmel", err); }
        return;
      }
      if (done && typeof this.fillStyle === "string" && (STAR_RE.test(this.fillStyle) || REFL_RE.test(this.fillStyle))) return;
      return fr0.call(this, x, y, w, h);
    };
    D.circ = function (c, x, y, r, col) { if (done && (col === "#f0e6d4" || col === "#d8ccb8") && Math.abs(x - 380) < 9 && Math.abs(y - 50) < 9) return; return circ0.apply(this, arguments); };
    D.glow = function (c, x, y, r, col) { if (done && r === 60 && x === 380 && y === 50) return; return glow0.apply(this, arguments); };
    let res;
    try { res = bl0.apply(this, arguments); } finally { P.fillRect = fr0; D.circ = circ0; D.glow = glow0; }
    if (G.layers === L0) return res;
    try { if (before) postFar(st, before, sharp, H); } catch (err) { console.error("tageszeit ferne", err); }
    midBlur();
    Z.zeitMs = +(performance.now() - t0).toFixed(1);
    return res;
  };
  function postFar(st, before, sharp, H) {
    const L = G.layers; if (!L || !L.far) return;
    const far = L.far, c = far.c, cv = far.cv;
    skyline(before, smallCopy(cv));
    const z = st.z, Hh = HOURS[z.k];
    /* Hafen: Mondspiegelung im Wasser neu, an der richtigen Stelle und in der Farbe der Stunde */
    if (kindNow() === "harbour") {
      const wy = H * 0.7, lx = sky.moon ? sky.moon.x : z.sx, col = z.k === "blut" ? "#ff6a40" : z.k === "nacht" ? "#f0e4e0" : Hh.glow;
      const R = Z.Rng(z.seed ^ 77), a0 = z.k === "nacht" ? 0.1 + 0.25 * st.moonBright : 0.3;
      for (let i = 0; i < 46; i++) { c.fillStyle = rgba(col, a0 * (0.4 + R() * 0.8)); const x = lx - 20 + R() * 40 + (R() - 0.5) * i * 1.2; for (const dx of [0, -LW, LW]) c.fillRect(x + dx, wy + 4 + i * 2.6, 6 + R() * 12, 0.9); }
    }
    /* Nebel und Dunst über den fernen Tälern (vor den Bergen) */
    const mist = Hh.mist * (st.storm ? 1.3 : 1);
    if (mist > 0.05) {
      const R = Z.Rng(z.seed ^ 191), col = z.k === "morgen" ? "#f8d8d0" : z.k === "abend" ? "#e8a888" : z.k === "blut" ? "#6a1a1a" : "#8a7890";
      for (let i = 0; i < 26 * mist + 4; i++) { const x = R() * LW, y = H * (0.56 + R() * 0.16), w = 50 + R() * 110; for (const dx of [0, -LW, LW]) { if (x + dx + w < 0 || x + dx - w > LW) continue; glow(c, x + dx, y, w, 6 + R() * 10, col, (0.18 + R() * 0.22) * mist, true); } }
      c.globalAlpha = 1;
    }
    /* Farbstimmung der Silhouetten: Gegenlicht macht sie dunkel und satt */
    const gy = H * 0.3; const gg = c.createLinearGradient(0, gy, 0, H); gg.addColorStop(0, rgba(Hh.grade, 0.05)); gg.addColorStop(1, rgba(Hh.grade, z.k === "nacht" ? 0.38 : 0.24));
    c.save(); c.setTransform(far.sx, 0, 0, far.sy, 0, 0);
    if (sky.path) { const land = new Path2D(); land.rect(-2, -80, LW + 4, H + 82); land.addPath(sky.path); c.clip(land, "evenodd"); }
    c.fillStyle = gg; c.fillRect(0, gy, LW, H - gy); c.restore();
    /* Tiefenunschärfe (Stufe 2/3): Silhouetten weich, Himmel scharf */
    if (qLevel() >= 2) {
      const bl = blurCopy(cv, 1.25 * far.sx, true);
      c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.drawImage(bl, 0, 0);
      /* klarer Himmel über der Horizontlinie */
      if (sharp && sky.path) { c.setTransform(far.sx, 0, 0, far.sy, 0, 0); c.clip(sky.path); c.setTransform(1, 0, 0, 1, 0, 0); c.drawImage(sharp, 0, 0); }
      c.restore();
      /* Luftperspektive: ganz zart aufgehellter Dunst über den fernen Silhouetten */
      c.save(); c.setTransform(far.sx, 0, 0, far.sy, 0, 0); const hz = c.createLinearGradient(0, H * 0.48, 0, H * 0.75); hz.addColorStop(0, rgba(Z.biome.sky[2], 0)); hz.addColorStop(0.5, rgba(Z.biome.sky[2], 0.14)); hz.addColorStop(1, rgba(Z.biome.sky[2], 0)); c.fillStyle = hz; c.fillRect(0, H * 0.48, LW, H * 0.27); c.restore();
    }
  }
  /* mittlere Ebene: etwas weniger weich als die ferne */
  function midBlur() {
    const L = G.layers; if (!L || !L.mid || qLevel() < 2) return;
    const m = L.mid, bl = blurCopy(m.cv, 0.6 * m.sx, true);
    m.c.save(); m.c.setTransform(1, 0, 0, 1, 0, 0); m.c.clearRect(0, 0, m.cv.width, m.cv.height); m.c.drawImage(bl, 0, 0); m.c.restore();
  }

  /* ======================= LEBENDIGER HIMMEL ======================= */
  /* Polarlicht-Streifen: senkrechter Verlauf, einmal je Farbe */
  const AUR = new Map();
  function auroraSpr(cols) {
    const key = cols.join(); let s = AUR.get(key); if (s) return s;
    const cv = document.createElement("canvas"); cv.width = 4; cv.height = 96; const c = cv.getContext("2d");
    const g = c.createLinearGradient(0, 96, 0, 0);
    g.addColorStop(0, rgba(cols[0], 0)); g.addColorStop(0.06, rgba(shade(cols[0], 0.35), 0.95)); g.addColorStop(0.16, rgba(cols[0], 0.6)); g.addColorStop(0.45, rgba(cols[1], 0.28)); g.addColorStop(0.8, rgba(cols[2], 0.12)); g.addColorStop(1, rgba(cols[2], 0));
    c.fillStyle = g; c.fillRect(0, 0, 4, 96);
    /* R16: seitlich weich auslaufend, damit sich die Streifen nahtlos überlagern (vorher harte senkrechte Kanten) */
    const g2 = c.createLinearGradient(0, 0, 4, 0); g2.addColorStop(0, "rgba(0,0,0,0)"); g2.addColorStop(0.5, "rgba(0,0,0,1)"); g2.addColorStop(1, "rgba(0,0,0,0)");
    c.globalCompositeOperation = "destination-in"; c.fillStyle = g2; c.fillRect(0, 0, 4, 96); c.globalCompositeOperation = "source-over";
    AUR.set(key, cv); return cv;
  }
  const AURORA = { nacht: [["#7ae07a", "#d8d070", "#b066d8"], ["#e8c860", "#c87ad0", "#8a4ab0"]], blut: [["#ff4a3a", "#c02040", "#6a1050"], ["#ff8a3a", "#a01a2a", "#4a0820"]], abend: [["#ffd070", "#ff9a6a", "#a050a0"], ["#e8e070", "#ff8a8a", "#8a4090"]] };
  /* Band-Sprite für ziehende Wolken */
  const BANDS = new Map();
  function bandSpr(b) {
    const key = b.body + b.litC + (b.litK * 10 | 0) + sky.k + (G.off && G.off.wolkenweich ? "h" : ""); let s = BANDS.get(key); if (s) return s;
    const cv = document.createElement("canvas"); cv.width = 256; cv.height = 32; const c = cv.getContext("2d");
    const R = Z.Rng(key.length * 97 + 13), lowLit = sky.k === "abend" || sky.k === "morgen";
    if (G.off && G.off.wolkenweich) { for (let k = 0; k < 9; k++) { const x = 20 + R() * 216, w = 30 + R() * 70, h = 4 + R() * 7; c.fillStyle = rgba(b.body, 0.35 + R() * 0.25); c.beginPath(); c.ellipse(x, 16 + (R() - 0.5) * 6, w / 2, h / 2, 0, 0, TAU); c.fill(); if (b.litK > 0.05) { c.fillStyle = rgba(b.litC, (0.2 + R() * 0.3) * b.litK); c.beginPath(); c.ellipse(x, 16 + (lowLit ? h * 0.35 : -h * 0.35), w / 2 * 0.8, 1, 0, 0, TAU); c.fill(); } } BANDS.set(key, cv); return cv; }
    /* R42: weiche Wolkenbänder statt harter Ovale – Leib aus weichen Bäuschen (elliptische Verläufe), Licht der Stunde nur
       innerhalb des Leibs (source-atop) an der Sonnen-/Mondseite, feine Schlieren; seitlich weich auslaufend */
    const soft = (x, y, rx, ry, col, a0) => { c.save(); c.translate(x, y); c.scale(rx, ry); const g = c.createRadialGradient(0, 0, 0, 0, 0, 1); g.addColorStop(0, rgba(col, a0)); g.addColorStop(0.55, rgba(col, a0 * 0.6)); g.addColorStop(1, rgba(col, 0)); c.fillStyle = g; c.fillRect(-1, -1, 2, 2); c.restore(); };
    const puffs = []; for (let k = 0; k < 11; k++) { const x = 18 + R() * 220, w = 34 + R() * 70, h = 5 + R() * 6, y = 16 + (R() - 0.5) * 5; puffs.push([x, y, w, h]); soft(x, y, w / 2, h / 2 + 1.5, b.body, 0.5 + R() * 0.25); }
    if (b.litK > 0.05) { c.globalCompositeOperation = "source-atop"; for (const [x, y, w, h] of puffs) soft(x + (R() - 0.5) * 8, y + (lowLit ? h * 0.45 : -h * 0.45), w * 0.42, h * 0.32 + 1, b.litC, (0.45 + R() * 0.35) * b.litK); c.globalCompositeOperation = "source-over"; }
    c.globalCompositeOperation = "source-atop"; for (let k = 0; k < 5; k++) { const y = 10 + R() * 12, x = R() * 200; const g = c.createLinearGradient(x, 0, x + 60, 0); g.addColorStop(0, rgba(b.body, 0)); g.addColorStop(0.5, rgba(shade(b.body, -0.25), 0.35)); g.addColorStop(1, rgba(b.body, 0)); c.fillStyle = g; c.fillRect(x, y, 60, 0.8); } c.globalCompositeOperation = "source-over";
    { const g = c.createLinearGradient(0, 0, 256, 0); g.addColorStop(0, "rgba(0,0,0,0)"); g.addColorStop(0.1, "rgba(0,0,0,1)"); g.addColorStop(0.9, "rgba(0,0,0,1)"); g.addColorStop(1, "rgba(0,0,0,0)"); c.globalCompositeOperation = "destination-in"; c.fillStyle = g; c.fillRect(0, 0, 256, 32); c.globalCompositeOperation = "source-over"; }
    BANDS.set(key, cv); return cv;
  }

  /* Polarlicht-Schleier: in eine kleine Leinwand (≈ 40 % der Bildschirmauflösung) gemalt, dort auf den Himmel über der
     Horizontlinie beschnitten und mit EINER Kopie additiv aufgetragen. Vorher: ~300 vergrößerte Streifen direkt im
     Bild unter einer Beschneidung mit dem Horizontpfad (in Software-Darstellung bis zu 10 ms) – der Schleier ist
     weich, in der kleineren Auflösung sieht er gleich aus. */
  let AU = null;
  function drawAurora(c, cam, t, oy, z) {
    const sets = AURORA[z.k] || AURORA.nacht, H = sky.H, ox = cam.x * (1 - PFX);
    /* Höhenbereich der Schleier (Ebenenkoordinaten), auf den sichtbaren Ausschnitt begrenzt */
    const yTop = H * 0.2 + 18 - 16 * 1.4 - 96, yBot = H * 0.28 + 18 + 22.4 + 10; /* W11 R16: ganze Schleierhöhe (vorher oben abgeschnitten → harte Kante) */
    const y0w = Math.max(yTop, cam.y - oy - 2), y1w = Math.min(H * 0.28 + 18 + 22.4 + 10, cam.y + cam.h - oy + 2);
    if (y1w <= y0w) return;
    const R = Math.min(1.2, G.scale || 1.2), AW = Math.ceil(cam.w * R) + 2, AH = Math.ceil((y1w - y0w) * R) + 2;
    if (!AU || AU.width !== AW || AU.height !== AH) { AU = document.createElement("canvas"); AU.width = AW; AU.height = AH; }
    const a = AU.getContext("2d");
    a.setTransform(1, 0, 0, 1, 0, 0); a.globalAlpha = 1; a.globalCompositeOperation = "source-over"; a.clearRect(0, 0, AW, AH);
    a.setTransform(R, 0, 0, R, -cam.x * R, -(oy + y0w) * R);
    const U = new Path2D();
    for (let x0 = Math.floor((cam.x - ox) / LW) * LW + ox; x0 < cam.x + cam.w; x0 += LW) U.addPath(sky.path, new DOMMatrix([1, 0, 0, 1, x0, oy]));
    a.save(); a.clip(U); a.globalCompositeOperation = "lighter";
    for (let x0 = Math.floor((cam.x - ox) / LW) * LW + ox; x0 < cam.x + cam.w; x0 += LW) {
      const X0 = cam.x - x0, X1 = X0 + cam.w;
      a.save(); a.translate(x0, oy);
      for (let k = 0; k < 2; k++) {
        const spr = auroraSpr(sets[k]), yb = H * (0.2 + k * 0.08) + 18, amp = 10 + k * 6, step = 3;
        const xs = Math.max(-4, Math.floor(X0 / step) * step - step), xe = Math.min(LW + 4, X1 + step);
        for (let x = xs; x <= xe; x += step) {
          const u = x / LW * TAU;
          const y = yb + Math.sin(u * 2 + t * 0.07 + k) * amp + Math.sin(u * 5 - t * 0.11 + k * 2) * amp * 0.4;
          const h = 34 + 30 * (0.5 + 0.5 * Math.sin(u * 3 + t * 0.13 + k * 3)) + 16 * Math.sin(u * 11 + t * 0.21);
          const ray = 0.86 + 0.14 * Math.sin(u * 13 + t * 0.5 + k * 5) * Math.sin(u * 7 - t * 0.3); /* R16: sanfte Strahlen statt harter Streifen */
          const al = (0.1 + 0.15 * Math.pow(0.5 + 0.5 * Math.sin(u * 4 - t * 0.35 + k * 1.7), 2)) * (0.55 + 0.45 * Math.sin(u * 1 + t * 0.05 + k)) * ray * (z.k === "abend" ? 0.5 : 1);
          if (al < 0.015) continue;
          a.globalAlpha = Math.min(1, al * 1.5); a.drawImage(spr, x - step, y - h * ray, step * 3, h * ray + 8);
        }
      }
      a.restore();
    }
    a.restore();
    /* R16: oben und unten weich ausblenden (in Ebenenkoordinaten, auch wenn der Ausschnitt beschnitten ist) */
    { const fy0 = oy + yTop, fy1 = oy + yBot, gm = a.createLinearGradient(0, fy0, 0, fy1);
      gm.addColorStop(0, "rgba(0,0,0,0)"); gm.addColorStop(0.35, "rgba(0,0,0,1)"); gm.addColorStop(0.86, "rgba(0,0,0,1)"); gm.addColorStop(1, "rgba(0,0,0,0)");
      a.globalCompositeOperation = "destination-in"; a.globalAlpha = 1; a.fillStyle = gm; a.fillRect(cam.x - 4, oy + y0w - 4, cam.w + 8, y1w - y0w + 8); a.globalCompositeOperation = "source-over"; }
    c.save(); c.globalCompositeOperation = "lighter"; c.globalAlpha = 1; c.imageSmoothingEnabled = true;
    c.drawImage(AU, 0, 0, AW, AH, cam.x, oy + y0w, AW / R, AH / R); c.restore();
  }
  function drawSkyLive(c, cam, t, oy) {
    const st = state(); if (!st || !sky || !sky.path || sky.H !== Math.ceil(Z.cam.h + 120)) return;
    const q = qLevel(), rich = q >= 2, z = st.z;
    const ox = cam.x * (1 - PFX);
    if (rich && st.aurora) drawAurora(c, cam, t, oy, z);
    let x0 = Math.floor((cam.x - ox) / LW) * LW + ox;
    for (; x0 < cam.x + cam.w; x0 += LW) {
      const X0 = cam.x - x0, X1 = X0 + cam.w; /* sichtbarer Bereich in Kachelkoordinaten */
      c.save(); c.translate(x0, oy); c.clip(sky.path);
      c.globalCompositeOperation = "lighter";
      /* funkelnde Sterne */
      for (const s of sky.twinkle) {
        if (s.x < X0 - 4 || s.x > X1 + 4) continue;
        const tw = 0.5 + 0.5 * Math.sin(t * s.f + s.ph) * Math.sin(t * s.f * 1.7 + s.ph * 2);
        const a = s.a * (0.25 + 0.75 * tw); if (a < 0.05) continue;
        c.globalAlpha = a; c.fillStyle = s.col; c.fillRect(s.x - s.s / 2, s.y - s.s / 2, s.s, s.s);
        if (rich && tw > 0.7 && s.s >= 1) { const L = 1.5 + 3 * (tw - 0.7) / 0.3 * s.s; c.globalAlpha = a * 0.5; c.fillRect(s.x - L, s.y - 0.2, L * 2, 0.4); c.fillRect(s.x - 0.2, s.y - L, 0.4, L * 2); }
      }
      c.globalAlpha = 1;
      /* Sternschnuppen (bei Sternschnuppenregen aus einem Punkt) */
      if (!st.storm && (z.k === "nacht" || z.k === "blut" || z.k === "morgen")) {
        const per = st.shower ? 1.3 : z.k === "nacht" ? 5.5 : 11, n = Math.floor(t / per), u = (t - n * per) / per;
        const go = hsh(n * 7 + 3) < (st.shower ? 0.9 : 0.6);
        if (go) {
          const dur = 0.55 + hsh(n * 3) * 0.5, life = u * per / dur;
          if (life < 1) {
            let sx, sy, ang;
            if (st.shower) { const rx = (z.mw + 150) % LW, ry = sky.H * 0.05, d0 = 15 + hsh(n * 11) * 70; ang = 0.3 + hsh(n * 5) * (PI - 0.6); sx = rx + Math.cos(ang) * d0; sy = ry + Math.sin(ang) * d0; }
            else { sx = X0 + hsh(n * 13) * (X1 - X0); sy = sky.H * (0.04 + hsh(n * 17) * 0.25); ang = (hsh(n * 19) < 0.5 ? 0.35 : PI - 0.35) + (hsh(n) - 0.5) * 0.3; }
            const L = 50 + hsh(n * 23) * 60, hx = sx + Math.cos(ang) * L * life, hy = sy + Math.sin(ang) * L * life, tl = Math.min(L * life, 28 + 20 * hsh(n * 29));
            const fire = hsh(n * 31) < 0.12, col = z.k === "blut" ? "#ff8a60" : fire ? "#ffc070" : "#fff6ea", fade = life < 0.15 ? life / 0.15 : 1 - Math.pow((life - 0.15) / 0.85, 2);
            const gr = c.createLinearGradient(hx, hy, hx - Math.cos(ang) * tl, hy - Math.sin(ang) * tl); gr.addColorStop(0, rgba(col, 0.9 * fade)); gr.addColorStop(1, rgba(col, 0));
            c.strokeStyle = gr; c.lineWidth = fire ? 1.3 : 0.8; c.beginPath(); c.moveTo(hx, hy); c.lineTo(hx - Math.cos(ang) * tl, hy - Math.sin(ang) * tl); c.stroke();
            glow(c, hx, hy, fire ? 8 : 4, fire ? 8 : 4, col, 0.7 * fade); c.globalAlpha = 1;
            if (fire && rich) for (let i = 0; i < 5; i++) { const k2 = i / 5, px = hx - Math.cos(ang) * tl * k2 + (hsh(i + n) - 0.5) * 3, py = hy - Math.sin(ang) * tl * k2 + hsh(i * 3 + n) * 3 * k2; c.globalAlpha = fade * (1 - k2) * 0.8; c.fillStyle = "#ffe0a0"; c.fillRect(px, py, 0.7, 0.7); }
            c.globalAlpha = 1;
          }
        }
      }
      /* Blutmond: pulsierende Korona */
      if (sky.moon && z.k === "blut" && !st.storm) { const m = sky.moon; for (const dx of [0, -LW, LW]) { const mx = m.x + dx; if (mx < X0 - 80 || mx > X1 + 80) continue; glow(c, mx, m.y, m.r * (2.2 + 0.15 * Math.sin(t * 0.8)), m.r * (2.2 + 0.15 * Math.sin(t * 0.8)), "#ff3a20", 0.18 + 0.06 * Math.sin(t * 1.3), true); } c.globalAlpha = 1; }
      c.globalCompositeOperation = "source-over";
      /* ziehende Wolkenbänder (hinter den Bergen) */
      if (rich) for (const b of sky.bands) {
        const spr = bandSpr(b), w = b.w * 1.4, h = Math.max(10, b.h * 4), x = ((b.x0 + t * b.sp) % (LW + w) + LW + w) % (LW + w) - w;
        for (const dx of [0, -LW - w]) { const xx = x + dx; if (xx + w < X0 || xx > X1) continue; c.globalAlpha = 0.85; if (G.drawScaled) G.drawScaled(c, spr, xx, b.y - h / 2, w, h); else c.drawImage(spr, xx, b.y - h / 2, w, h); }
        c.globalAlpha = 1;
      }
      /* W11 R15: ferne Wolkendecke (Haufenwolken, eigene Drift) – hinter den Bergen */
      if (rich && st.out && !(G.off && G.off.wolken)) deck(c, X0, X1, t, st, 0);
      /* Fledermäuse vor dem Blutmond bzw. Vollmond */
      if (rich && sky.moon && sky.moon.vis && (z.k === "blut" || st.moonBright > 0.85)) {
        const m = sky.moon, per = 14, n = Math.floor(t / per), u = (t - n * per) / per;
        if (hsh(n * 41) < 0.55 && u < 0.4) {
          const k2 = u / 0.4, dir = hsh(n) < 0.5 ? 1 : -1;
          c.fillStyle = "#0c0608";
          for (let i = 0; i < 3; i++) { const bx = m.x - dir * (m.r * 3) + dir * k2 * m.r * 6 - dir * i * 5, by = m.y + (hsh(n * 3) - 0.5) * m.r + Math.sin(t * 6 + i) * 2 + i * 2, f = Math.sin(t * 24 + i * 2) * 2; c.beginPath(); c.moveTo(bx - 3, by - f); c.lineTo(bx - 1, by + 0.3); c.lineTo(bx, by - 0.5); c.lineTo(bx + 1, by + 0.3); c.lineTo(bx + 3, by - f); c.lineTo(bx, by + 1.2); c.closePath(); c.fill(); }
        }
      }
      c.restore();
    }
    /* Morgennebel im fernen Tal: zieht langsam (nicht abgeschnitten, liegt vor den Bergen) */
    if (rich && st.mist > 0.4) {
      const col = z.k === "morgen" ? "#ffe0d8" : "#c8a8b0", y = oy + sky.H * 0.62;
      for (let i = 0; i < 4; i++) { const w = 260 + i * 60, sp = 3 + i * 1.6, span = cam.w + w * 2, x = cam.x - w + ((hsh(i * 9) * span + t * sp) % span); glow(c, x, y + i * 7, w * 0.5, 9 + i * 3, col, 0.13 * st.mist, true); }
      c.globalAlpha = 1;
    }
  }
  /* sichtbare Monde in Weltkoordinaten (für Spiegelungen in der Bilderbuch-Ebene) */
  Z.zeitMoons = function (cam) {
    const st = state(); if (!st || !sky || !sky.moon) return [];
    const lvH = Z.level.H * Z.TILE, ox = cam.x * (1 - PFX), oy = cam.y - (cam.y - (lvH - cam.h) * 0.5) * PFY - 40, out = [];
    for (let x0 = Math.floor((cam.x - 200 - ox) / LW) * LW + ox; x0 < cam.x + cam.w + 200; x0 += LW) out.push({ x: x0 + sky.moon.x, y: oy + sky.moon.y, r: sky.moon.r });
    return out;
  };

  /* ======================= WOLKENDECKS (W11 R15) =======================
     Außengebiete ab Stufe 1: Haufenwolken als fertige Sprites (einmal je Stunde/Gebiet gemalt, oben vom Licht der
     Stunde gestreift, flacher dunkler Boden), in zwei Schichten mit eigener Parallaxe und Drift:
     – ferne Decke (Stufe 2+) im Himmels-Clip hinter den Bergen, mit der fernen Ebene verschoben;
     – nahe Wolkenbank über dem Horizont, langsamer als die Mittelebene (0.22), VOR den Bergen, hinter der Kulisse.
     Bei Blitzen (Z.flashLight) leuchten die Wolken kurz auf. Stufe 0 (Handheld): aus. Schalter Z.gfx.off.wolken. */
  const CLOUD = new Map();
  function cloudSpr(st, v) {
    const key = st.k + st.kind + v; let cv = CLOUD.get(key); if (cv) return cv;
    cv = document.createElement("canvas"); cv.width = 256; cv.height = 84; const c = cv.getContext("2d");
    const R = Z.Rng(v * 131 + 17), storm = st.storm, H = st.H;
    const body = storm ? shade(mix(H.band, "#2e2a26", 0.6), -0.1) : H.band, lit = storm ? mix(H.bandLit, "#a8a088", 0.5) : H.bandLit;
    const base = 62;
    c.save(); c.beginPath(); c.rect(0, 0, 256, base); c.clip();
    /* erst ein weicher Leib, dann obenauf angeleuchtete, weich auslaufende Bäusche */
    for (let i = 0; i < 12; i++) { const u = (i + 0.5) / 12, x = 20 + u * 216, r = 14 + Math.sin(Math.PI * u) * 16; const g = c.createRadialGradient(x, base - 6, 0, x, base - 6, r * 1.3); g.addColorStop(0, rgba(body, 0.7)); g.addColorStop(1, rgba(body, 0)); c.fillStyle = g; c.fillRect(x - r * 1.3, base - 6 - r * 1.3, r * 2.6, r * 2.6); }
    for (let i = 0; i < 24; i++) {
      const u = (i + R() * 0.9) / 24, x = 26 + u * 204, hump = Math.sin(Math.PI * u), r = 7 + hump * (9 + R() * 10), y = base - 6 - hump * (12 + R() * 14) + r * 0.3;
      const g = c.createRadialGradient(x - r * 0.2, y - r * 0.5, r * 0.05, x, y, r);
      g.addColorStop(0, rgba(mix(lit, body, 0.35), 0.75)); g.addColorStop(0.5, rgba(mix(lit, body, 0.7), 0.55)); g.addColorStop(0.8, rgba(body, 0.35)); g.addColorStop(1, rgba(body, 0));
      c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill();
    }
    c.restore();
    /* dunkler, flacher Boden und weicher Rand */
    c.globalCompositeOperation = "source-atop";
    const g2 = c.createLinearGradient(0, base - 22, 0, base); g2.addColorStop(0, rgba(body, 0)); g2.addColorStop(1, rgba(shade(body, -0.35), 0.85));
    c.fillStyle = g2; c.fillRect(0, base - 22, 256, 22);
    c.globalCompositeOperation = "destination-in";
    const g3 = c.createLinearGradient(0, 0, 256, 0); g3.addColorStop(0, "rgba(0,0,0,0)"); g3.addColorStop(0.12, "rgba(0,0,0,1)"); g3.addColorStop(0.88, "rgba(0,0,0,1)"); g3.addColorStop(1, "rgba(0,0,0,0)");
    c.fillStyle = g3; c.fillRect(0, 0, 256, 84);
    c.globalCompositeOperation = "source-over";
    CLOUD.set(key, cv); return cv;
  }
  /* ferne Decke: in Kachelkoordinaten der fernen Ebene (0..LW), schon im Himmels-Clip */
  function deck(c, X0, X1, t, st, k) {
    const z = st.z, n = 5, sp = st.storm ? 5 : 1.4, aBase = z.k === "nacht" ? 0.5 : 0.7;
    for (let i = 0; i < n; i++) {
      const w = 110 + hsh(i * 7 + z.seed) * 90, h = w * 0.33, span = LW + w;
      const x = ((hsh(i * 3 + 1 + z.seed) * span + t * sp * (0.7 + 0.6 * hsh(i * 5))) % span + span) % span - w;
      const y = sky.H * (0.1 + 0.3 * hsh(i * 11 + 4)) ;
      if (x + w < X0 || x > X1) continue;
      c.globalAlpha = aBase; if (G.drawScaled) G.drawScaled(c, cloudSpr(st, i % 3), x, y - h, w, h); else c.drawImage(cloudSpr(st, i % 3), x, y - h, w, h);
    }
    c.globalAlpha = 1;
  }
  /* nahe Wolkenbank: eigene Parallaxe 0.22, liegt tief über dem Horizont, ohne Clip */
  const NPX = 0.22, NW = 960;
  function nearDeck(c, cam, t, oy) {
    const st = state(); if (!st || !st.out || !sky || (G.off && G.off.wolken)) return;
    const q = qLevel(); if (q < 1) return;
    const z = st.z, n = q >= 2 ? 4 : 2, sp = st.storm ? 9 : 2.6, ox = cam.x * (1 - NPX) + t * sp;
    const yb = oy + sky.H * (st.storm ? 0.42 : 0.5), aBase = (z.k === "nacht" ? 0.42 : 0.55) * (st.storm ? 1.2 : 1);
    const fl = Z.flashLight > 0 ? Math.min(1, Z.flashLight) : 0;
    for (let x0 = Math.floor((cam.x - ox) / NW) * NW + ox - NW; x0 < cam.x + cam.w; x0 += NW) {
      for (let i = 0; i < n; i++) {
        const w = 170 + hsh(i * 13 + 5) * 130, h = w * 0.33, x = x0 + (i + hsh(i * 17 + 2) * 0.6) * NW / n, y = yb + (hsh(i * 19 + 9) - 0.5) * 30;
        if (x + w < cam.x || x > cam.x + cam.w || y < cam.y || y - h > cam.y + cam.h) continue;
        const spr = cloudSpr(st, 3 + (i % 2));
        c.globalAlpha = aBase; if (G.drawScaled) G.drawScaled(c, spr, x, y - h, w, h); else c.drawImage(spr, x, y - h, w, h);
        if (fl > 0.05) { c.globalCompositeOperation = "lighter"; c.globalAlpha = fl * 0.35; c.drawImage(spr, x, y - h, w, h); c.globalCompositeOperation = "source-over"; }
      }
    }
    c.globalAlpha = 1;
  }

  /* zwischen ferner Ebene und Bilderbuch: lebendiger Himmel zuerst, dann Wolken/Kulisse */
  const life0 = Z.drawBackLife;
  Z.drawBackLife = function (c, cam, t, B, oy, LH) {
    if (Z.level && !(Z.bilderbuchCovers && Z.bilderbuchCovers())) { const tA = performance.now();
      /* über der fernen Ebene: Zenitfarbe statt der (getönten) Horizontfarbe, die bild.js als Grund füllt */
      if (sky && oy > cam.y - 1 && B && B.sky) { c.fillStyle = shade(B.sky[0], -0.25); c.fillRect(cam.x - 2, cam.y - 2, cam.w + 4, oy - cam.y + 3); }
      try { LIVE = true; drawSkyLive(c, cam, t, oy); nearDeck(c, cam, t, oy); } catch (err) { console.error("tageszeit live", err); sky = null; } finally { LIVE = false; } Z.zeitLiveMs = performance.now() - tA; }
    if (life0) return life0.apply(this, arguments);
  };

  /* „Klare Mondnacht“ (wetter.js) passend zur Stunde benennen */
  const PHASE = p => p < 0.03 || p > 0.97 ? ["Neumond", "new moon"] : p < 0.2 ? ["zunehmende Sichel", "waxing crescent"] : p < 0.3 ? ["zunehmender Halbmond", "first quarter"] : p < 0.47 ? ["zunehmender Mond", "waxing gibbous"] : p < 0.53 ? ["Vollmond", "full moon"] : p < 0.7 ? ["abnehmender Mond", "waning gibbous"] : p < 0.8 ? ["abnehmender Halbmond", "last quarter"] : ["abnehmende Sichel", "waning crescent"];
  function clearName() {
    const s = state(); if (!s) return null; const en = Z.settings && Z.settings.lang === "en", ph = PHASE(s.p)[en ? 1 : 0];
    if (s.k === "abend") return en ? "Clear dusk" : "Klare Abenddämmerung";
    if (s.k === "morgen") return en ? "Clear dawn" : "Klares Morgengrauen";
    if (s.k === "blut") return en ? "A blood moon rises" : "Der Blutmond steigt auf";
    return (en ? "Clear night · " : "Klare Nacht · ") + ph;
  }
  Z.zeitPhase = () => { const s = state(); return s ? Z.L(PHASE(s.p)) : ""; };
  let toastWrapped = false;
  function wrapToast() {
    if (toastWrapped || !Z.toast) return; toastWrapped = true;
    const t0 = Z.toast;
    Z.toast = function (html) { if (typeof html === "string" && /Klare Mondnacht|Clear moonlit night/.test(html)) { const n = clearName(); if (n) html = html.replace(/Klare Mondnacht|Clear moonlit night/, n); } return t0.apply(this, arguments); };
  }
  const la0 = Z.loadArea;
  if (la0) Z.loadArea = function () { wrapToast(); return la0.apply(this, arguments); };

  /* ======================= PRÜFHILFEN ======================= */
  /* Z.zeitSet("nacht", 0.3) – Stunde (und Mondphase) erzwingen; Z.zeitSet() – wieder zufällig */
  Z.zeitSet = function (k, p, extra) {
    if (!k) { force = null; }
    else { const base = roll((Math.random() * 4294967296) >>> 0, 0, 0, k); if (p != null) base.p = p; Object.assign(base, extra || {}); force = base; }
    if (Z.level && Z.biome) { G.buildLayers(); if (Z.bilderbuchBuild) Z.bilderbuchBuild(); }
    return force;
  };
  Z.zeitDump = function (sc) {
    const L = G.layers; if (!L) return null; sc = sc || 1; const cv = document.createElement("canvas"); cv.width = LW * sc; cv.height = L.H * sc; const c = cv.getContext("2d");
    c.drawImage(L.far.cv, 0, 0, cv.width, cv.height); return cv.toDataURL("image/jpeg", 0.9);
  };
})();

/* Ezekiel – The Destroyer · Tore, Falltüren und Hebel (W11 Runde 15)
   Die Karte (welt.js) legt Abkürzungen als Gittertore (waagrecht, 2×3 Kacheln) und Falltüren (senkrecht, 4×3 Kacheln
   mit Leiter in Spalte 2) an; erkundung.js zeichnet sie schlicht und lässt sie beim Öffnen einfach verschwinden.
   Hier: Unterlage (vor erkundung.js: Torrahmen, dunkler Durchgang, Lukendeckel, Hebel-Wandplatte, Gebiets-Leiter) und
   Auflage (Z.toreAuf, eingehängt in effekte.js: schweres Fallgitter mit Spitzen, Öffnungs-Animation – Gitter fährt
   hoch, Lukenflügel klappen nach unten –, danach sichtbar offen; Hebel mit pulsierendem Ring und Licht).
   Alle Stufen (spielrelevant), aber nur sichtbare Tore und eine Handvoll Rechtecke; Licht/Glanz erst ab Stufe 1.
   Schalter: Z.gfx.off.tore. */
(function () {
  const Z = window.Z; if (!Z || !Z.gfx) return;
  const G = Z.gfx, T = 16, TAU = Math.PI * 2;
  const off = () => G.off && G.off.tore;
  const ease = d => 1 - Math.pow(1 - d, 3);
  /* Werkstoffe je Gebiet: Eisen, Glanz, Holz, Lukenart, Leiterzier */
  const STIL = {
    castle: { fe: "#4a4450", hi: "#9a909a", wd: "#5e4028", wdH: "#8a6440", st: "#6a6268", lad: "klammer" },
    halls: { fe: "#4a4450", hi: "#a098a0", wd: "#5a3c26", wdH: "#86603e", st: "#6a6066", lad: "klammer" },
    ramparts: { fe: "#4a4650", hi: "#a09aa2", wd: "#5e4228", wdH: "#8a6844", st: "#727078", lad: "klammer" },
    belltower: { fe: "#4e4640", hi: "#a89a80", wd: "#5a3e28", wdH: "#866244", st: "#6a6260", lad: "klammer" },
    cellar: { fe: "#3e3836", hi: "#8a807a", wd: "#4a3422", wdH: "#6e5032", st: "#5a524e", lad: "kette" },
    dungeon: { fe: "#3a3436", hi: "#868084", wd: "#3e2c1e", wdH: "#5e4430", st: "#544c4e", lad: "kette" },
    lake: { fe: "#44504a", hi: "#8aa08e", wd: "#4e4230", wdH: "#76664a", st: "#58605a", lad: "seil" },
    harbour: { fe: "#454a46", hi: "#8e9a90", wd: "#5e4630", wdH: "#8a6c48", st: "#625e58", lad: "seil" },
    chasm: { fe: "#40383a", hi: "#8a7e80", wd: "#4a3828", wdH: "#6e5638", st: "#5a5052", lad: "seil" },
    storm: { fe: "#464450", hi: "#9a98a4", wd: "#544030", wdH: "#7e6448", st: "#66646c", lad: "seil" },
    forge: { fe: "#3a3234", hi: "#c08058", wd: "#3a3036", wdH: "#5a4a50", st: "#5a4c48", lad: "niet", plate: 1 },
    embercity: { fe: "#3a3032", hi: "#d08a58", wd: "#3a2e32", wdH: "#5c4648", st: "#5e4a44", lad: "niet", plate: 1 },
    spires: { fe: "#3e3438", hi: "#c89068", wd: "#3e3234", wdH: "#5e4a4a", st: "#62524c", lad: "niet", plate: 1 }
  };
  const stil = () => STIL[(Z.biome && Z.biome.bg) || ""] || STIL.castle;
  const state = new WeakMap(); /* Tor -> { t0: Öffnungszeit oder -1 (schon offen gesehen) } */
  function st(g, t) {
    let s = state.get(g);
    if (!s) { s = { t0: g.open ? -1 : null }; state.set(g, s); }
    if (g.open && s.t0 === null) s.t0 = t;
    return s;
  }
  const prog = (s, t, dur) => (s.t0 === null ? 0 : s.t0 < 0 ? 1 : Math.min(1, Math.max(0, (t - s.t0) / dur)));
  function visG(g, m) { const cam = Z.cam, x = g.x * T, y = g.y0 * T; return x > cam.x - 90 - m && x < cam.x + cam.w + 40 && y > cam.y - 80 && y < cam.y + cam.h + 60; }

  /* Leiter unter der Falltür: Spalte g.x+1 ab g.y0 abwärts (einmal je Tor ermittelt) */
  function ladderRows(g) {
    if (g._lr) return g._lr;
    const lv = Z.level, col = g.x + 1; let y = g.y0; const out = [];
    while (out.length < 30 && (lv.get(col, y) === 4 || y < g.y0 + 3)) { if (lv.get(col, y) === 4) out.push(y); y++; if (lv.get(col, y) !== 4 && y >= g.y0 + 3) break; }
    if (g.open) g._lr = out; return out;
  }
  function ladderDeco(c, g, S) {
    const x = (g.x + 1) * T, cam = Z.cam;
    for (const y of ladderRows(g)) {
      const py = y * T; if (py < cam.y - T || py > cam.y + cam.h) continue;
      if (S.lad === "klammer") { /* Eisenklammern in die Wand, Burgleiter aus Eiche */
        if (y % 2 === 0) { c.fillStyle = S.fe; c.fillRect(x + 1, py + 6, 4, 2.2); c.fillRect(x + 11, py + 6, 4, 2.2); c.fillStyle = S.hi; c.fillRect(x + 1, py + 6, 4, 0.6); c.fillRect(x + 11, py + 6, 4, 0.6); }
      } else if (S.lad === "kette") { /* Kerker: Eisensprossen, Kettenglieder an den Holmen */
        c.fillStyle = S.fe; for (let k = 3; k < T; k += 5) c.fillRect(x + 3.5, py + k + 0.3, 9, 1.2);
        c.strokeStyle = S.hi; c.lineWidth = 0.7; c.beginPath(); for (let k = 1; k < T; k += 4) { c.moveTo(x + 2.4, py + k); c.lineTo(x + 2.4, py + k + 2.4); c.moveTo(x + 13.6, py + k + 2); c.lineTo(x + 13.6, py + k + 4); } c.stroke();
      } else if (S.lad === "seil") { /* See/Hafen/Sturm: Seil-Bünde an den Sprossenenden */
        c.fillStyle = "#b09a70"; for (let k = 3; k < T; k += 5) { c.fillRect(x + 2.2, py + k - 0.6, 2.8, 0.7); c.fillRect(x + 2.2, py + k + 1.6, 2.8, 0.7); c.fillRect(x + 11, py + k - 0.6, 2.8, 0.7); c.fillRect(x + 11, py + k + 1.6, 2.8, 0.7); }
      } else { /* Schmiede/Glutstadt: genietete Eisenholme */
        c.fillStyle = S.fe; c.fillRect(x + 2.5, py, 2, T); c.fillRect(x + 11.5, py, 2, T);
        c.fillStyle = S.hi; c.fillRect(x + 3, py + 2, 1, 1); c.fillRect(x + 12, py + 2, 1, 1); c.fillRect(x + 3, py + 10, 1, 1); c.fillRect(x + 12, py + 10, 1, 1);
      }
    }
  }

  function unter(c, t) {
    const lv = Z.level; if (!lv || !lv.gates || !lv.gates.length || off()) return;
    const S = stil();
    for (const g of lv.gates) {
      if (!g.lever || g.flut || !visG(g, g.vert ? 40 : 0)) continue; /* Flutkammer-Abläufe zeichnet effekte.js */
      const s = st(g, t), x = g.x * T, y = g.y0 * T;
      if (!g.vert) {
        const w = 2 * T, h = 3 * T, d = prog(s, t, 0.8);
        /* geschlossen: dunkler Durchgang statt Felswand – man sieht, dass hier ein Weg ist */
        if (d < 1) { c.fillStyle = "rgba(14,9,10," + (0.9 * (1 - d)).toFixed(3) + ")"; c.fillRect(x, y, w, h); }
        /* Rahmen: Pfosten mit Führungsnut, Sturz mit Schlussstein */
        c.fillStyle = S.st; c.fillRect(x - 4, y - 2, 5, h + 2); c.fillRect(x + w - 1, y - 2, 5, h + 2);
        c.fillStyle = "rgba(0,0,0,.45)"; c.fillRect(x + 0.4, y, 1.2, h); c.fillRect(x + w - 1.6, y, 1.2, h);
        c.fillStyle = "rgba(255,240,220,.18)"; c.fillRect(x - 4, y - 2, 0.8, h + 2); c.fillRect(x + w - 1, y - 2, 0.8, h + 2);
        c.fillStyle = S.st; c.fillRect(x - 5, y - 6, w + 10, 5); c.fillStyle = "rgba(0,0,0,.35)"; c.fillRect(x - 5, y - 1.4, w + 10, 1.4);
        c.fillStyle = "rgba(255,240,220,.16)"; c.fillRect(x - 5, y - 6, w + 10, 0.8);
        c.fillStyle = S.st; c.beginPath(); c.moveTo(x + w / 2 - 4, y - 7); c.lineTo(x + w / 2 + 4, y - 7); c.lineTo(x + w / 2 + 2.6, y); c.lineTo(x + w / 2 - 2.6, y); c.fill();
      } else {
        const w = 4 * T, d = prog(s, t, 0.6);
        /* Lukenrahmen auf dem Boden des oberen Raums und an der Decke des unteren */
        c.fillStyle = S.fe; c.fillRect(x - 2, y - 1, 3, 3); c.fillRect(x + w - 1, y - 1, 3, 3);
        if (d < 1) {
          const yb = (g.y0 + 3) * T; /* Unterseite (Decke des unteren Raums) */
          for (const [yy, hh] of [[y - 1, 7], [yb - 5, 5]]) {
            c.fillStyle = "#0e0a0a"; c.fillRect(x, yy - 1, w, hh + 2);
            c.fillStyle = S.wd; c.fillRect(x + 1, yy, w - 2, hh);
            c.fillStyle = "rgba(0,0,0,.4)"; for (let k = 1; k < 8; k++) c.fillRect(x + k * 8, yy, 0.8, hh);
            c.fillStyle = S.wdH; c.fillRect(x + 1, yy, w - 2, 0.8);
            c.fillStyle = S.fe; c.fillRect(x + 9, yy, 3, hh); c.fillRect(x + w - 12, yy, 3, hh);
            if (S.plate) { c.fillStyle = S.hi; for (let k = 0; k < 7; k++) c.fillRect(x + 4 + k * 9, yy + 1.5, 0.9, 0.9); }
          }
          /* Zugring oben in der Mitte */
          c.strokeStyle = S.hi; c.lineWidth = 1; c.beginPath(); c.arc(x + w / 2, y + 1.5, 2.2, 0, Math.PI); c.stroke();
        }
        if (g.open) ladderDeco(c, g, S);
      }
    }
    /* Hebel: Wandplatte mit Bogenschlitz und Sockel – liegt hinter dem Hebel von erkundung.js */
    const E = Z.erkundung && Z.erkundung(); if (!E || !E.levers) return;
    const cam = Z.cam;
    for (const o of E.levers) {
      if (o.x < cam.x - 30 || o.x > cam.x + cam.w + 30 || o.y < cam.y - 30 || o.y > cam.y + cam.h + 40) continue;
      const x = o.x, y = o.y;
      c.fillStyle = S.fe; c.fillRect(x - 10, y - 24, 19, 20);
      c.fillStyle = "rgba(10,6,8,.55)"; c.fillRect(x - 9, y - 23, 17, 18);
      c.fillStyle = "rgba(255,240,220,.2)"; c.fillRect(x - 10, y - 24, 19, 0.8);
      c.fillStyle = S.fe; c.fillRect(x - 9, y - 23, 2, 2); c.fillRect(x + 6, y - 23, 2, 2); c.fillRect(x - 9, y - 8, 2, 2); c.fillRect(x + 6, y - 8, 2, 2);
      c.strokeStyle = "#140e0e"; c.lineWidth = 2; c.beginPath(); c.arc(x, y - 3, 12, -Math.PI * 0.78, -Math.PI * 0.22); c.stroke();
      /* Stellungsmarken: rot (zu) links, grün (auf) rechts */
      c.fillStyle = o.pulled ? "#3a2a24" : "#c0402a"; c.fillRect(x - 9.5, y - 15, 2.4, 2.4);
      c.fillStyle = o.pulled ? "#7fd36a" : "#2e3a2a"; c.fillRect(x + 6.1, y - 15, 2.4, 2.4);
    }
  }
  const dp0 = Z.drawParcours;
  Z.drawParcours = function (c, t) { if (dp0) dp0.apply(this, arguments); try { unter(c, t); } catch (e) { console.error(e); } };

  /* Auflage – nach erkundung.js (eingehängt in effekte.js) */
  function gitter(c, x, y, w, h, S) {
    c.fillStyle = "rgba(0,0,0,.4)"; for (let i = 0; i <= 4; i++) c.fillRect(x + 2.2 + i * 7.1, y + 1, 2.4, h);
    c.fillStyle = S.fe;
    for (let j = 0; j < 4; j++) c.fillRect(x, y + 4 + j * 12, w, 2.4);
    for (let i = 0; i <= 4; i++) { const bx = x + 1 + i * 7.1; c.fillRect(bx, y, 2.6, h - 3); c.beginPath(); c.moveTo(bx - 0.4, y + h - 3); c.lineTo(bx + 1.3, y + h + 0.5); c.lineTo(bx + 3, y + h - 3); c.fill(); }
    c.fillStyle = S.hi; for (let i = 0; i <= 4; i++) c.fillRect(x + 1 + i * 7.1, y, 0.7, h - 3);
    for (let j = 0; j < 4; j++) for (let i = 0; i <= 4; i++) c.fillRect(x + 1.6 + i * 7.1, y + 4.6 + j * 12, 1.2, 1.2);
  }
  function auf(c, t) {
    const lv = Z.level; if (!lv || !lv.gates || !lv.gates.length || off()) return;
    const S = stil();
    for (const g of lv.gates) {
      if (!g.lever || g.flut || !visG(g, g.vert ? 40 : 0)) continue; /* Flutkammer-Abläufe zeichnet effekte.js */
      const s = st(g, t), x = g.x * T, y = g.y0 * T;
      if (!g.vert) {
        const w = 2 * T, h = 3 * T, d = prog(s, t, 0.8);
        /* Gitter fährt hoch (ruckelnd am Anfang), offen bleiben nur die Spitzen unter dem Sturz sichtbar */
        const lift = (h - 6) * ease(d) + (d > 0 && d < 0.25 ? Math.sin(d * 80) * 0.8 : 0);
        c.save(); c.beginPath(); c.rect(x - 1, y - 1, w + 2, h + 2); c.clip();
        gitter(c, x, y - lift, w, h, S); c.restore();
        if (d > 0 && d < 1 && Math.random() < 0.5 && Z.fx && Z.fx.p) Z.fx.p({ x: x + Math.random() * w, y: y + 1, vx: 0, vy: 20, life: 0.6, size: 1.4, col: Z.dustCol || "#8a7a70", kind: "smoke" });
      } else {
        const w = 4 * T, d = prog(s, t, 0.6); if (d <= 0) continue;
        /* zwei Flügel klappen um die Außenkanten nach unten (mit kleinem Nachschwingen) */
        const a = Math.PI / 2 * Math.min(1, ease(d) * 1.08) - (d >= 1 ? 0 : Math.sin(d * Math.PI) * 0.05), len = w / 2 - 2;
        for (const sd of [-1, 1]) {
          c.save(); c.translate(sd < 0 ? x + 1 : x + w - 1, y + 2); c.rotate(sd < 0 ? a : -a);
          const lx = sd < 0 ? 0 : -len;
          c.fillStyle = S.wd; c.fillRect(lx, -2, len, 4.4); c.fillStyle = S.wdH; c.fillRect(lx, -2, len, 0.8);
          c.fillStyle = S.fe; c.fillRect(lx + (sd < 0 ? 7 : len - 10), -2, 3, 4.4);
          c.restore();
        }
      }
    }
    const E = Z.erkundung && Z.erkundung(); if (!E || !E.levers) return;
    const cam = Z.cam, lo = Z.gq && (Z.gq.lean || Z.gq.mini);
    for (const o of E.levers) {
      if (o.pulled || o.x < cam.x - 30 || o.x > cam.x + cam.w + 30 || o.y < cam.y - 30 || o.y > cam.y + cam.h + 40) continue;
      /* pulsierender Ring um den Griff: Hebel sind auch im Getümmel zu finden */
      const p = 0.5 + 0.5 * Math.sin(t * 4), kx = o.x - Math.sin(0.7) * 13, ky = o.y - 3 - Math.cos(0.7) * 13;
      c.strokeStyle = "rgba(255,214,140," + (0.35 + 0.4 * p).toFixed(3) + ")"; c.lineWidth = 1.1;
      c.beginPath(); c.arc(kx, ky, 4.5 + p * 1.5, 0, TAU); c.stroke();
      if (!lo) { c.strokeStyle = "rgba(255,180,90," + (0.18 * (1 - p)).toFixed(3) + ")"; c.beginPath(); c.arc(kx, ky, 8 + p * 3, 0, TAU); c.stroke(); }
    }
  }
  Z.toreAuf = function (c, t) { try { auf(c, t); } catch (e) { console.error(e); } };
  /* Licht: ungezogene Hebel glimmen warm, ein frisch geöffnetes Tor blitzt kurz auf */
  if (G.lightGather) G.lightGather.push(function (add, cam, t) {
    if (off()) return; const E = Z.erkundung && Z.erkundung(); if (!E || !E.levers) return;
    for (const o of E.levers) if (!o.pulled && o.x > cam.x - 60 && o.x < cam.x + cam.w + 60 && o.y > cam.y - 60 && o.y < cam.y + cam.h + 60) add(o.x - 8, o.y - 14, 40, "#ffb868", 0.32 + 0.08 * Math.sin(t * 4), 0);
  });
})();
