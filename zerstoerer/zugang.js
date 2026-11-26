/* Ezekiel – The Destroyer · Barrierefreiheit (W31)
   Ergänzt die Seite „Komfort & Barrierefreiheit“ (ui.js) um:
   · Farbenblind-Modi Protanopie / Deuteranopie / Tritanopie (Z.settings.farbsicht: "aus"|"prot"|"deut"|"trit").
     Echte Farbpaletten-Abbildung: Jede Farbe, die auf eine Leinwand gesetzt wird (fillStyle, strokeStyle, shadowColor,
     Verläufe), läuft durch eine Abbildung, die die verwechselbaren Gruppen auseinanderzieht – Gift-Grün → Magenta,
     Gefahren-Rot heller/zinnober, Warn-Gelb → kräftiges Orange (Tritanopie), Violett → Magenta-Rosa (Tritanopie).
     Kein Vollbildfilter, kein Blau. Die Abbildung ist nur installiert, wenn ein Modus an ist (sonst null Kosten).
     Dazu Symbole/Muster: Gift (Tropfen) und Feuer (Flamme) über Gefahrenflächen und vergifteten/brennenden Gegnern.
   · Schriftgröße / Oberfläche 90–150 % (Z.settings.uiSkala, ersetzt die alte Stufe „Textgröße“, fitText in ui.js).
   · „Blitzen & Flackern stark reduzieren“ (Z.settings.blitzArm): Vollbildblitze aus, Lichtblitze (Gewitter, Explosion,
     Treffer) auf 10 %, kein weißes Treffer-Aufleuchten der Gegner. Neue Module fragen Z.blitzArm() bzw. Z.flashK().
   · Angriffswarnungen als Symbol (Z.settings.warnSymbol): „!“ über ausholenden Gegnern, Pfeil am Bildrand für
     ausholende Gegner, Geschosse und Boss-Großangriffe außerhalb des Bildes.
   · Untertitel für wichtige Klänge (Z.settings.untertitel): Boss-Großangriff, Falle, Einsturz/Beben, Gegner hinter dir,
     Explosion, Donner, Brüllen – mit Richtungspfeil.
   · Halten statt Tippen (Z.settings.dauerAngriff: gehaltene Angriffstaste schlägt weiter;
     Z.settings.umschalten: Schild und Bogenspannen per Tippen an/aus statt Halten – zweimal schnell = Schildstoß).
   · Lerntipps an/aus (Z.settings.lerntipps, lerntipps.js).
   Alles Gamepad-bedienbar (↑↓ Zeile, ←→ Wahl/Regler), DE/EN, mit Vorschau (Farbmuster vorher/nachher, Symbole).
   Schnittstelle: Z.zugang.{abbild(farbe), modus(), roh, vorschau(canvas), untertitel(text, icon, richtung)}. */
(function () {
  "use strict";
  const Z = window.Z, L = v => Z.L(v), inp = Z.input;
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const S = () => Z.settings;

  /* ======================= Einstellungen prüfen ======================= */
  {
    const s = S();
    if (!["aus", "prot", "deut", "trit"].includes(s.farbsicht)) s.farbsicht = "aus";
    if (s.uiSkala != null) { const v = +s.uiSkala; s.uiSkala = isFinite(v) ? Math.max(90, Math.min(150, Math.round(v / 5) * 5)) : null; }
    for (const k of ["blitzArm", "warnSymbol", "untertitel", "dauerAngriff", "umschalten"]) if (typeof s[k] !== "boolean") s[k] = false;
    if (typeof s.lerntipps !== "boolean") s.lerntipps = true;
    if (s.blitzArm) s.blitze = "aus";
  }

  /* ======================= Blitzen & Flackern stark reduzieren ======================= */
  Z.blitzArm = () => !!(Z.settings && Z.settings.blitzArm);
  {
    const fk0 = Z.flashK;
    Z.flashK = function (kind) { if (Z.blitzArm()) return kind === "licht" ? 0.1 : 0; return fk0.apply(this, arguments); };
    const hit0 = Z.hitEnemy;
    Z.hitEnemy = function (e) { const r = hit0.apply(this, arguments); if (e && Z.blitzArm()) e.flash = 0; return r; };
  }

  /* ======================= Farbpaletten-Abbildung ======================= */
  const MODI = { aus: ["aus", "off"], prot: ["Protanopie", "Protanopia"], deut: ["Deuteranopie", "Deuteranopia"], trit: ["Tritanopie", "Tritanopia"] };
  const MODI_KURZ = { aus: ["aus", "off"], prot: ["Prot.", "Prot."], deut: ["Deut.", "Deut."], trit: ["Trit.", "Trit."] };
  function parse(c) {
    let m;
    if (c.charCodeAt(0) === 35) { /* # */
      const h = c.slice(1);
      if (h.length === 3 || h.length === 4) return [parseInt(h[0] + h[0], 16), parseInt(h[1] + h[1], 16), parseInt(h[2] + h[2], 16), h.length === 4 ? parseInt(h[3] + h[3], 16) / 255 : 1];
      if (h.length === 6 || h.length === 8) return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16), h.length === 8 ? parseInt(h.slice(6, 8), 16) / 255 : 1];
      return null;
    }
    if ((m = /^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)(?:[\s,/]+([\d.]+%?))?\s*\)$/i.exec(c))) return [+m[1], +m[2], +m[3], m[4] == null ? 1 : /%$/.test(m[4]) ? parseFloat(m[4]) / 100 : +m[4]];
    if ((m = /^hsla?\(\s*(-?[\d.]+)(?:deg)?[\s,]+([\d.]+)%[\s,]+([\d.]+)%(?:[\s,/]+([\d.]+%?))?\s*\)$/i.exec(c))) { const rgb = hsl2rgb(((+m[1] % 360) + 360) % 360, +m[2] / 100, +m[3] / 100); rgb.push(m[4] == null ? 1 : /%$/.test(m[4]) ? parseFloat(m[4]) / 100 : +m[4]); return rgb; }
    return null;
  }
  function rgb2hsl(r, g, b) {
    r /= 255; g /= 255; b /= 255; const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2; let h = 0, s = 0;
    if (mx !== mn) { const d = mx - mn; s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn); h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h *= 60; }
    return [h, s, l];
  }
  function hsl2rgb(h, s, l) {
    const k = n => (n + h / 30) % 12, a = s * Math.min(l, 1 - l), f = n => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
    return [Math.round(f(0) * 255), Math.round(f(8) * 255), Math.round(f(4) * 255)];
  }
  const clamp01 = v => (v < 0 ? 0 : v > 1 ? 1 : v);
  /* die eigentliche Abbildung (HSL): nur gesättigte Farben der Problemgruppen, Erdtöne/Grau bleiben */
  /* abgestimmt per Simulation (Machado 2009) – siehe /home/claude/test/w31_zugang/STAND.md: Gift↔Gefahr, Gift↔Feuer, Gift↔Heilung,
     Feuer↔Warnung, Gefahr↔Heilung werden deutlich besser unterscheidbar; Heil-Grün (h ≥ 112) und dunkles Laub bleiben unverändert. */
  function mapHSL(mode, h, s, l) {
    if (s < 0.28 || l < 0.08 || l > 0.96) return null;
    const gift = h >= 65 && h < 112 && s >= 0.5 && l >= 0.42;
    if (mode === "prot") {
      if (gift) return [315, Math.max(s, 0.6), clamp01(0.62 + (l - 0.5) * 0.6)]; /* Gift/Säure-Lindgrün → helles Magenta */
      if ((h >= 342 || h < 14) && s >= 0.45) return [12, s, clamp01(l + 0.12)]; /* Rot heller (Protanopie sieht Rot dunkel) */
      if (h >= 18 && h < 40 && s >= 0.6 && l >= 0.4) return [18, s, clamp01(l * 0.78)]; /* Feuer-Orange tiefer → weg vom Warn-Gelb */
      if (h >= 170 && h < 200 && s >= 0.35) return [52, s, l];
      return null;
    }
    if (mode === "deut") {
      if (gift) return [320, Math.max(s, 0.6), clamp01(0.62 + (l - 0.5) * 0.6)];
      if ((h >= 342 || h < 14) && s >= 0.45) return [0, s, clamp01(l - 0.1)]; /* Rot dunkler → weg vom Heil-Grün */
      if (h >= 170 && h < 200 && s >= 0.35) return [52, s, l];
      return null;
    }
    if (mode === "trit") {
      if (h >= 240 && h < 300 && s >= 0.3) return [322, s, clamp01(l + 0.04)]; /* Violett → Magenta-Rosa */
      if (h >= 170 && h < 240 && s >= 0.3) return [28, s, l]; /* Türkis/Blau (falls vorhanden) → Ocker */
      return null;
    }
    return null;
  }
  let MODE = "aus", cache = new Map();
  function abbild(c) {
    if (MODE === "aus" || typeof c !== "string") return c;
    let v = cache.get(c); if (v !== undefined) return v;
    v = c;
    const p = parse(c.trim());
    if (p) {
      const [h, s, l] = rgb2hsl(p[0], p[1], p[2]), m = mapHSL(MODE, h, s, l);
      if (m) { const r = hsl2rgb(m[0], m[1], m[2]); v = p[3] < 1 ? "rgba(" + r[0] + "," + r[1] + "," + r[2] + "," + +p[3].toFixed(3) + ")" : "#" + r.map(x => x.toString(16).padStart(2, "0")).join(""); }
    }
    if (cache.size > 6000) cache.clear();
    cache.set(c, v); return v;
  }
  /* Leinwand-Setter umhüllen – nur solange ein Modus an ist */
  const C2 = window.CanvasRenderingContext2D && CanvasRenderingContext2D.prototype, CG = window.CanvasGradient && CanvasGradient.prototype;
  const ORIG = {}, PROPS = ["fillStyle", "strokeStyle", "shadowColor"];
  if (C2) for (const k of PROPS) ORIG[k] = Object.getOwnPropertyDescriptor(C2, k);
  const ORIG_STOP = CG ? CG.addColorStop : null;
  let installiert = false;
  function installieren(an) {
    if (!C2 || an === installiert) return;
    try {
      if (an) {
        for (const k of PROPS) { const d = ORIG[k]; if (!d || !d.set) continue; Object.defineProperty(C2, k, { configurable: true, enumerable: d.enumerable, get: d.get, set(v) { d.set.call(this, typeof v === "string" ? abbild(v) : v); } }); }
        if (CG && ORIG_STOP) CG.addColorStop = function (o, col) { return ORIG_STOP.call(this, o, abbild(col)); };
      } else {
        for (const k of PROPS) if (ORIG[k]) Object.defineProperty(C2, k, ORIG[k]);
        if (CG && ORIG_STOP) CG.addColorStop = ORIG_STOP;
      }
      installiert = an;
    } catch (e) { console.error("zugang", e); }
  }
  /* roh zeichnen (Vorschau „vorher“) */
  const roh = (c, k, v) => { const d = ORIG[k]; if (d && d.set) d.set.call(c, v); else c[k] = v; };
  function farbModus(m, still) {
    m = MODI[m] ? m : "aus";
    const neu = m !== MODE; MODE = m; cache = new Map(); installieren(m !== "aus");
    document.documentElement.dataset.farbsicht = m;
    if (neu && !still) { try { Z.cachesNeu && Z.cachesNeu("farbsicht"); } catch (_) {} try { const mm = document.getElementById("minimap"); if (mm && Z.ui && Z.ui.drawMinimap) Z.ui.drawMinimap(); } catch (_) {} }
  }
  farbModus(S().farbsicht, true);

  /* ======================= Schriftgröße 90–150 % ======================= */
  function wireText() {
    const ui = Z.ui; if (!ui || !ui.textFactor || !ui.applyText) return setTimeout(wireText, 40);
    const tf0 = ui.textFactor;
    ui.textFactor = function () { const v = Z.settings.uiSkala; return typeof v === "number" && isFinite(v) ? v / 100 : tf0.apply(this, arguments); };
    /* alte Auswahl „Textgröße“ in den Einstellungen hat Vorrang, sobald sie benutzt wird */
    document.addEventListener("change", e => { if (e.target && e.target.matches && e.target.matches("[data-textsize]")) { Z.settings.uiSkala = null; } }, true);
    ui.applyText();
  }
  const skala = () => { const v = Z.settings.uiSkala; if (typeof v === "number") return v; const t = { klein: 86, normal: 100, gross: 117, riesig: 134 }[Z.settings.textSize] || 100; return Math.max(90, Math.round(t / 5) * 5); };

  /* ======================= Welt-Overlay: Symbole, Muster, Randpfeile ======================= */
  const INK = "#120a06", WARN = "#ffd84a", HELL = "#fff6e0";
  const istVor = e => (e.act && e.act.phase === "pre") || e.tele > 0 || (e.mv && e.mv.stage === "pre");
  function bang(c, x, y, s) {
    c.fillStyle = INK; c.beginPath(); c.arc(x, y, s + 1.4, 0, 6.283); c.fill();
    c.fillStyle = WARN; c.beginPath(); c.arc(x, y, s, 0, 6.283); c.fill();
    c.fillStyle = INK; c.fillRect(x - s * 0.17, y - s * 0.68, s * 0.34, s * 0.9); c.fillRect(x - s * 0.17, y + s * 0.38, s * 0.34, s * 0.3);
  }
  function tropfen(c, x, y, s) { /* Gift */
    c.beginPath(); c.moveTo(x, y - s); c.quadraticCurveTo(x + s * 0.9, y + s * 0.1, x, y + s * 0.75); c.quadraticCurveTo(x - s * 0.9, y + s * 0.1, x, y - s); c.closePath();
    c.fillStyle = INK; c.lineWidth = s * 0.45; c.strokeStyle = INK; c.stroke(); c.fillStyle = HELL; c.fill();
    c.fillStyle = INK; c.beginPath(); c.arc(x - s * 0.22, y + s * 0.2, s * 0.14, 0, 6.283); c.arc(x + s * 0.22, y + s * 0.2, s * 0.14, 0, 6.283); c.fill();
  }
  function flamme(c, x, y, s) { /* Feuer */
    c.beginPath(); c.moveTo(x, y - s); c.quadraticCurveTo(x + s * 0.95, y, x + s * 0.4, y + s * 0.7); c.lineTo(x - s * 0.4, y + s * 0.7); c.quadraticCurveTo(x - s * 0.95, y, x, y - s); c.closePath();
    c.lineWidth = s * 0.45; c.strokeStyle = INK; c.stroke(); c.fillStyle = WARN; c.fill();
    c.fillStyle = INK; c.beginPath(); c.moveTo(x, y - s * 0.2); c.lineTo(x + s * 0.22, y + s * 0.5); c.lineTo(x - s * 0.22, y + s * 0.5); c.closePath(); c.fill();
  }
  const istGift = h => /poison|gift|acid|saeure/i.test(h.kind || "") || h.poison || h.elem === "gift" || h.elem === "poison";
  const istFeuer = h => /fire|flame|breath|ember|feuer|lava/i.test(h.kind || "") || h.burn || h.elem === "feuer" || h.elem === "fire";
  function overlay(c, cam, t) {
    const s = S(), cvd = MODE !== "aus", warn = s.warnSymbol;
    if ((!cvd && !warn) || !Z.level || !cam || Z.level.hub) return;
    const FX = Z.fx, Sc = Z.gfx.scale || 1, ox = Math.round((-cam.x + (FX.shakeX || 0)) * Sc) / Sc, oy = Math.round((-cam.y + (FX.shakeY || 0)) * Sc) / Sc;
    const x0 = cam.x, x1 = cam.x + cam.w, y0 = cam.y, y1 = cam.y + cam.h;
    const inV = (x, y, m) => x > x0 - m && x < x1 + m && y > y0 - m && y < y1 + m;
    c.save(); c.setTransform(Sc, 0, 0, Sc, ox * Sc, oy * Sc); c.globalAlpha = 1; c.globalCompositeOperation = "source-over"; c.setLineDash([]);
    const pulse = 0.85 + 0.15 * Math.sin(t * 12);
    if (cvd) {
      /* Muster/Symbole: Gift und Feuer auch ohne Farbe erkennbar */
      for (const h of Z.hazards || []) {
        if (h.owner === "p" || !inV(h.x, h.y, 20)) continue;
        const g = istGift(h), f = !g && istFeuer(h); if (!g && !f) continue;
        const w = h.w || 24, n = Math.max(1, Math.min(4, Math.round(w / 40)));
        for (let i = 0; i < n; i++) { const x = h.x - w / 2 + (i + 0.5) * (w / n), y = h.y - Math.min(18, (h.hgt || 14)) - 4 + Math.sin(t * 3 + i) * 1.5; (g ? tropfen : flamme)(c, x, y, 4.2); }
      }
      for (const e of Z.enemies || []) {
        if (e.dead || e.hidden || !e.st || !inV(e.x, e.y, 10)) continue;
        const x = e.x + e.w + 3, y = e.y + 4;
        if (e.st.poison > 0) tropfen(c, x, y, 3.4);
        if (e.st.burn > 0) flamme(c, x, y + (e.st.poison > 0 ? 9 : 0), 3.4);
      }
    }
    const P = Z.player, rand = [];
    if (warn) {
      for (const e of Z.enemies || []) {
        if (e.dead || e.hidden || e.dummy || !istVor(e)) continue;
        const cx = e.x + e.w / 2;
        if (inV(cx, e.y, 0)) { if (!Z.dangerHi()) bang(c, cx, e.y - 11 - 2 * pulse, 5.5); }
        else if (P && Math.hypot(cx - P.x, e.y - P.y) < 420) rand.push([cx, e.y + e.h / 2, 1]);
      }
      for (const p of Z.projs || []) if (p.owner === "e" && !p.dead && !inV(p.x, p.y, 0) && P && Math.hypot(p.x - P.x, p.y - P.y) < 380 && ((p.vx || 0) * (P.x - p.x) + (p.vy || 0) * (P.y - p.y)) > 0) rand.push([p.x, p.y, 0]);
      for (const tl of Z.bossTeleList || []) { const x = tl.x != null ? tl.x : tl.x0 != null ? (tl.x0 + tl.x1) / 2 : null, y = tl.y; if (x != null && y != null && !inV(x, y, 0)) rand.push([x, y, 2]); }
    }
    c.restore();
    if (rand.length) {
      /* Bildschirmraum: Pfeile am Rand, Richtung zur Quelle */
      const cv = c.canvas, W = cv.width, H = cv.height, m = Math.max(18, Math.min(W, H) * 0.045);
      c.save(); c.setTransform(1, 0, 0, 1, 0, 0);
      for (const [wx, wy, art] of rand.slice(0, 8)) {
        const sx = (wx - cam.x) * Sc, sy = (wy - cam.y) * Sc, cx = W / 2, cy = H / 2, a = Math.atan2(sy - cy, sx - cx);
        const k = Math.min((W / 2 - m) / Math.max(1e-3, Math.abs(Math.cos(a))), (H / 2 - m) / Math.max(1e-3, Math.abs(Math.sin(a))));
        const px = cx + Math.cos(a) * k, py = cy + Math.sin(a) * k, s = m * (art === 2 ? 0.9 : 0.7) * pulse;
        c.save(); c.translate(px, py); c.rotate(a);
        c.beginPath(); c.moveTo(s, 0); c.lineTo(-s * 0.7, -s * 0.75); c.lineTo(-s * 0.35, 0); c.lineTo(-s * 0.7, s * 0.75); c.closePath();
        c.lineJoin = "round"; c.lineWidth = s * 0.32; c.strokeStyle = INK; c.stroke(); c.fillStyle = art === 2 ? "#ff5a3a" : art === 1 ? WARN : HELL; c.fill();
        c.restore();
        if (art) { c.save(); c.translate(px - Math.cos(a) * s * 1.6, py - Math.sin(a) * s * 1.6); bang(c, 0, 0, s * 0.42); c.restore(); }
      }
      c.restore();
    }
  }
  {
    const al0 = Z.drawAfterLight;
    Z.drawAfterLight = function (c, cam, W, H, t) { if (al0) al0.apply(this, arguments); try { overlay(c, cam, t || (Z.gfx && Z.gfx.time) || 0); } catch (e) { if (!overlay.err) { overlay.err = 1; console.error(e); } } };
  }

  /* ======================= Untertitel für wichtige Klänge ======================= */
  let capBox = null; const caps = new Map();
  function capEl() {
    if (capBox && capBox.isConnected) return capBox;
    capBox = document.createElement("div"); capBox.id = "w31-untertitel"; capBox.setAttribute("aria-live", "polite"); document.body.appendChild(capBox); return capBox;
  }
  function richtung(wx) { const P = Z.player; if (!P || wx == null || !isFinite(wx)) return 0; const d = wx - (P.x + P.w / 2); return Math.abs(d) < 40 ? 0 : d < 0 ? -1 : 1; }
  function untertitel(key, icon, txt, dir, ms) {
    if (!S().untertitel || !Z.level || Z.level.hub) return;
    const now = performance.now(), o = caps.get(key);
    if (o && now - o.t < 1400) { o.t = now; o.bis = now + (ms || 2400); if (o.dir !== dir) { o.dir = dir; o.el.innerHTML = html(icon, txt, dir); } return; }
    const el = o && o.el && o.el.isConnected ? o.el : document.createElement("div");
    el.className = "w31-cap"; el.innerHTML = html(icon, txt, dir); capEl().appendChild(el);
    caps.set(key, { el, t: now, bis: now + (ms || 2400), dir });
    while (capEl().children.length > 3) { const f = capEl().firstChild; for (const [k, v] of caps) if (v.el === f) caps.delete(k); f.remove(); }
  }
  const html = (icon, txt, dir) => (dir < 0 ? '<b class="w31-pf">◀</b>' : "") + '<i>' + icon + "</i> " + esc(txt) + (dir > 0 ? ' <b class="w31-pf">▶</b>' : "");
  function capTick() {
    const now = performance.now();
    for (const [k, v] of caps) if (now > v.bis) { v.el.classList.add("weg"); if (now > v.bis + 400) { v.el.remove(); caps.delete(k); } }
    if (capBox) capBox.hidden = !S().untertitel || !Z.level || Z.level.hub || (Z.ui && Z.ui.modalOpen);
  }
  const KLANG = {
    quake: ["⤓", ["Beben – etwas stürzt ein", "Rumbling – something collapses"]], rock: ["⤓", ["Steinschlag", "Falling rocks"]],
    roar: ["☠", ["Brüllen", "Roar"]], thunder: ["ϟ", ["Donner", "Thunder"]], explode: ["✸", ["Explosion", "Explosion"]],
    fireBig: ["♨", ["Feuerstoß", "Fire blast"]], gong: ["◉", ["Gong – Bosskampf", "Gong – boss fight"]], horn: ["♪", ["Horn – Verstärkung", "Horn – reinforcements"]],
    bell: ["◉", ["Glocke", "Bell"]], web: ["✱", ["Netz", "Web"]]
  };
  function wireKlang() {
    const A = Z.audio; if (!A || !A.play || A._w31) return; A._w31 = true;
    const p0 = A.play;
    A.play = function (name, o) {
      const r = p0.apply(this, arguments);
      try { const k = KLANG[name]; if (k && S().untertitel && Z.level && !Z.level.hub && Z.run) untertitel("k:" + name, k[0], L(k[1]), richtung(o && o.x)); } catch (_) {}
      return r;
    };
  }
  const gesehen = new WeakSet(); const hinten = new WeakMap();
  function ereignisTick() {
    if (!S().untertitel || !Z.level || Z.level.hub || !Z.player) return;
    const P = Z.player, px = P.x + P.w / 2, now = performance.now();
    for (const tl of Z.bossTeleList || []) {
      if (gesehen.has(tl)) continue; gesehen.add(tl);
      const x = tl.x != null ? tl.x : tl.x0 != null ? (tl.x0 + tl.x1) / 2 : null;
      if (tl.k !== "safe") untertitel("boss", "⚠", L(["Boss-Großangriff!", "Boss heavy attack!"]), richtung(x), 2600);
    }
    for (const tr of Z.fallen || []) {
      const x = tr.wx != null ? tr.wx : tr.x != null ? tr.x : tr.tx, y = tr.y != null ? tr.y : tr.fy;
      const w = tr.w === true || /^(warn|zittert|knarr|pocht|zeichen|reisst)$/.test(tr.st || "");
      if (!w || x == null || Math.abs(x - px) > 220 || Math.abs((y || 0) - P.y) > 160) continue;
      untertitel("falle", "⚙", L(["Falle klickt", "Trap clicks"]), richtung(x), 2000);
    }
    for (const e of Z.enemies || []) {
      if (e.dead || e.hidden || e.dummy || !e.aware || !istVor(e)) continue;
      const ex = e.x + e.w / 2, d = ex - px;
      if (Math.abs(d) > 130 || Math.abs(e.y - P.y) > 60 || Math.sign(d) === (P.face || 1)) continue;
      if (now - (hinten.get(e) || 0) < 3000) continue; hinten.set(e, now);
      untertitel("hinten", "⟲", L(["Gegner hinter dir!", "Enemy behind you!"]), d < 0 ? -1 : 1, 1800);
    }
  }

  /* ======================= Halten statt Tippen ======================= */
  const latch = { a1: false, a2: false };
  let wdh = { a1: 0, a2: 0 };
  function wireHalten() {
    const up0 = Z.updatePlayer; if (!up0 || up0._w31) return;
    const up = function (P, dt) {
      const s = S(), tauschen = [];
      try {
        if (P && !P.dead && Z.level && !(Z.ui && Z.ui.modalOpen)) {
          for (const sl of ["a1", "a2"]) {
            const it = P.slots[sl], d = it ? Z.WEAPONS[it.id] : sl === "a1" ? Z.WEAPONS.faeuste : null; if (!d) { latch[sl] = false; continue; }
            const halteArt = d.kind === "shield" || (d.kind === "ranged" && d.shoot && d.shoot.charge);
            if (s.umschalten && halteArt) {
              if (inp.pressed[sl]) latch[sl] = !latch[sl];
              tauschen.push([sl, inp.held[sl]]); inp.held[sl] = latch[sl];
            } else latch[sl] = false;
            if (s.dauerAngriff && !halteArt && inp.held[sl] && !inp.pressed[sl]) {
              wdh[sl] -= dt || 0;
              const frei = !P.act || (P.act.phase === "post" && P.act.slot === sl);
              if (wdh[sl] <= 0 && frei) { inp.pressed[sl] = true; wdh[sl] = 0.12; }
            } else if (!inp.held[sl]) wdh[sl] = 0.28;
          }
        } else { latch.a1 = latch.a2 = false; }
      } catch (e) { console.error("zugang", e); }
      try { return up0.apply(this, arguments); }
      finally { for (const [sl, h] of tauschen) inp.held[sl] = h; }
    };
    up._w31 = true; Z.updatePlayer = up;
  }

  /* ======================= Menü (Komfort & Barrierefreiheit) ======================= */
  const OPT = {
    farbsicht: Object.keys(MODI).map(k => [k, MODI_KURZ[k]]),
    blitzArm: "bool", warnSymbol: "bool", untertitel: "bool", dauerAngriff: "bool", umschalten: "bool", lerntipps: "bool"
  };
  const onOff = [["true", ["an", "on"]], ["false", ["aus", "off"]]];
  function seg(key, opts, cur) { return '<div class="k-wahl" role="radiogroup">' + opts.map(([v, n]) => '<button class="k-seg' + (v === cur ? " an" : "") + '" role="radio" aria-checked="' + (v === cur) + '" data-act="w31set" data-arg="' + key + "|" + v + '">' + esc(L(n)) + "</button>").join("") + "</div>"; }
  const row = (key, lab, hint, ctl, cls) => '<div class="k-zeile' + (cls ? " " + cls : "") + '" data-k="' + key + '"><div class="k-text"><b>' + lab + "</b>" + (hint ? "<small>" + hint + "</small>" : "") + "</div>" + ctl + "</div>";
  const b = key => seg(key, onOff, String(!!S()[key]));
  function rowsBlitz() {
    return row("blitzArm", L(["Blitzen & Flackern stark reduzieren", "Strongly reduce flashing & flicker"]), L(["Keine Vollbildblitze, Gewitter- und Explosionslicht nur noch schwach, kein weißes Aufleuchten getroffener Gegner. Gilt auch für Boss-Effekte.", "No full-screen flashes, lightning and explosion light only faint, no white flash on hit enemies. Also applies to boss effects."]), b("blitzArm"));
  }
  function rowsNeu() {
    const s = S(), sk = skala();
    return "<h3>" + L(["Farben", "Colours"]) + "</h3>" +
      row("farbsicht", L(["Farbenblind-Modus", "Colour-blind mode"]), L(["Echte Farbabbildung für Gefahren, Gift, Feuer, Warnungen, Gegner-Ausholen, Karte und Anzeigen – dazu Symbole für Gift ◆ und Feuer ▲.", "True palette mapping for hazards, poison, fire, warnings, enemy wind-ups, map and HUD – plus symbols for poison and fire."]), seg("farbsicht", OPT.farbsicht, s.farbsicht)) +
      '<div class="w31-vorschau"><canvas width="560" height="96" aria-label="' + esc(L(["Vorschau der Farben", "Colour preview"])) + '"></canvas></div>' +
      "<h3>" + L(["Schrift & Oberfläche", "Text & interface"]) + "</h3>" +
      row("uiSkala", L(["Schriftgröße / Oberfläche", "Text size / interface"]) + ' <em data-out="uiSkala">' + sk + " %</em>", L(["Alle Fenster, Meldungen und die Anzeige wachsen mit (90–150 %). Passt sich an kleine Bildschirme an.", "All windows, messages and the HUD scale (90–150 %). Adapts to small screens."]),
        '<div class="k-regler"><input type="range" min="90" max="150" step="5" value="' + sk + '" data-w31skala="1" aria-label="' + esc(L(["Schriftgröße", "Text size"])) + '"></div>') +
      "<h3>" + L(["Warnungen & Untertitel", "Warnings & captions"]) + "</h3>" +
      row("warnSymbol", L(["Angriffswarnung als Symbol", "Attack warning as a symbol"]), L(["„!“ über jedem Gegner, der ausholt; Pfeil am Bildrand für Angriffe, Geschosse und Boss-Großangriffe von außerhalb.", "'!' above every enemy winding up; an arrow at the screen edge for attacks, projectiles and boss attacks from off-screen."]), b("warnSymbol")) +
      row("untertitel", L(["Untertitel für wichtige Klänge", "Captions for important sounds"]), L(["Boss-Großangriff, Falle, Einsturz, Gegner hinter dir, Explosion, Donner – mit Richtung.", "Boss heavy attack, trap, collapse, enemy behind you, explosion, thunder – with direction."]), b("untertitel")) +
      "<h3>" + L(["Bedienung", "Controls"]) + "</h3>" +
      row("dauerAngriff", L(["Halten statt Hämmern", "Hold instead of mashing"]), L(["Angriffstaste gedrückt halten schlägt immer weiter.", "Holding the attack button keeps attacking."]), b("dauerAngriff")) +
      row("umschalten", L(["Tippen statt Halten", "Tap instead of hold"]), L(["Schild heben und Bogen spannen per Tippen an/aus. Zweimal schnell tippen = Schildstoß.", "Raise the shield and draw the bow with a tap on/off. Tap twice quickly = shield bash."]), b("umschalten")) +
      "<h3>" + L(["Lernen", "Learning"]) + "</h3>" +
      row("lerntipps", L(["Lerntipps im Lager", "Tips at camp"]), L(["Wenn du wiederholt an derselben Sache scheiterst, gibt dir eine Lagerfigur einmal einen Tipp – ab und zu mit Übung an der Puppe.", "If you keep failing at the same thing, someone at camp gives you a tip once – sometimes with practice at the dummy."]), b("lerntipps"));
  }
  /* Vorschau: oben „ohne Modus“ (roh), unten mit Abbildung + Symbolen */
  const PROBEN = [["#e8322a", ["Gefahr", "Danger"]], ["#7fdc3a", ["Gift", "Poison"]], ["#ff8a1e", ["Feuer", "Fire"]], ["#ffd84a", ["Warnung", "Warning"]], ["#a050e8", ["Magie", "Magic"]], ["#4fbf4a", ["Heilung", "Heal"]], ["#f6efe0", ["Licht", "Light"]]];
  function vorschau(cv) {
    if (!cv) return; const c = cv.getContext("2d"), W = cv.width, H = cv.height, n = PROBEN.length, bw = (W - 70) / n;
    roh(c, "fillStyle", "#1a1210"); c.fillRect(0, 0, W, H);
    c.font = "bold 11px sans-serif"; c.textBaseline = "middle";
    roh(c, "fillStyle", "#c8b090"); c.fillText(L(["normal", "normal"]), 6, 24); c.fillText(MODE === "aus" ? L(["(aus)", "(off)"]) : L(MODI_KURZ[MODE]), 6, 66);
    PROBEN.forEach(([col, lab], i) => {
      const x = 66 + i * bw;
      roh(c, "fillStyle", col); c.fillRect(x + 3, 8, bw - 6, 30);
      c.fillStyle = col; c.fillRect(x + 3, 50, bw - 6, 30); /* läuft durch die Abbildung */
      if (MODE !== "aus" && i === 1) tropfen(c, x + bw / 2, 65, 7); if (MODE !== "aus" && i === 2) flamme(c, x + bw / 2, 65, 7);
      if (S().warnSymbol && i === 3) bang(c, x + bw / 2, 65, 7);
      roh(c, "fillStyle", "#f0e0c0"); c.textAlign = "center"; c.fillText(L(lab), x + bw / 2, 90); c.textAlign = "left";
    });
  }
  function wireMenu() {
    const ui = Z.ui; if (!ui || !ui.komfort || !ui.actions) return setTimeout(wireMenu, 40);
    const k0 = ui.komfort;
    ui.komfort = function (focusKey) {
      const r = k0.apply(this, arguments);
      try {
        const box = document.querySelector("#modal .komfort"); if (!box) return r;
        const bl = box.querySelector('[data-k="blitze"]'); if (bl) bl.insertAdjacentHTML("afterend", rowsBlitz());
        const anker = box.querySelector(".k-schnell"), h = rowsNeu();
        if (anker) anker.insertAdjacentHTML("beforebegin", h); else box.insertAdjacentHTML("beforeend", h);
        const rg = box.querySelector("[data-w31skala]");
        rg.oninput = () => { Z.settings.uiSkala = +rg.value; box.querySelector('[data-out="uiSkala"]').textContent = rg.value + " %"; };
        rg.onchange = () => { Z.settings.uiSkala = +rg.value; Z.saveSettings(); ui.applyText(); rg.focus({ preventScroll: true }); };
        vorschau(box.querySelector(".w31-vorschau canvas"));
        if (focusKey && /^w31:/.test(focusKey)) setTimeout(() => { const el = box.querySelector('[data-k="' + focusKey.slice(4) + '"] .an, [data-k="' + focusKey.slice(4) + '"] input'); if (el) el.focus({ preventScroll: true }); }, 50);
      } catch (e) { console.error("zugang", e); }
      return r;
    };
    ui.actions.w31set = (arg, btn) => {
      const [key, v] = String(arg).split("|"), o = OPT[key]; if (!o) return;
      const val = o === "bool" ? v === "true" : v;
      Z.settings[key] = val;
      if (key === "blitzArm") { if (val) Z.settings.blitze = "aus"; else if (Z.settings.blitze === "aus") Z.settings.blitze = "sanft"; syncSeg("blitze", Z.settings.blitze, "kset"); }
      if (key === "farbsicht") farbModus(val);
      Z.saveSettings();
      const wrap = btn && btn.closest(".k-wahl");
      if (wrap) wrap.querySelectorAll(".k-seg").forEach(x => { const on = x === btn; x.classList.toggle("an", on); x.setAttribute("aria-checked", on); });
      vorschau(document.querySelector("#modal .w31-vorschau canvas"));
      if (key === "untertitel" && val && Z.level && !Z.level.hub) untertitel("probe", "♪", L(["Untertitel an", "Captions on"]), 0, 1600);
    };
    function syncSeg(key, v, act) { const w = document.querySelector('#modal [data-k="' + key + '"] .k-wahl'); if (!w) return; w.querySelectorAll(".k-seg").forEach(x => { const on = x.dataset.arg === key + "|" + v; x.classList.toggle("an", on); x.setAttribute("aria-checked", on); }); }
    /* alte Blitz-Wahl: „voll/gedämpft“ schaltet die starke Reduktion ab */
    const ks0 = ui.actions.kset;
    ui.actions.kset = function (arg) { const [key, v] = String(arg).split("|"); if (key === "blitze" && v !== "aus" && Z.settings.blitzArm) { Z.settings.blitzArm = false; syncSeg("blitzArm", "false"); } return ks0.apply(this, arguments); };
    const kp0 = ui.actions.kpreset;
    ui.actions.kpreset = function (arg) {
      const s = Z.settings;
      if (arg === "ruhig") s.blitzArm = true;
      else if (arg === "std") { Object.assign(s, { blitzArm: false, farbsicht: "aus", warnSymbol: false, untertitel: false, dauerAngriff: false, umschalten: false, lerntipps: true, uiSkala: null }); farbModus("aus"); ui.applyText(); }
      return kp0.apply(this, arguments);
    };
  }

  /* ======================= Takt ======================= */
  function tick() {
    try { capTick(); ereignisTick(); } catch (e) { if (!tick.err) { tick.err = 1; console.error(e); } }
    requestAnimationFrame(tick);
  }

  const css = document.createElement("style");
  css.textContent = [
    "#w31-untertitel{position:fixed;left:50%;bottom:calc(92px * var(--hud,1));transform:translateX(-50%);display:flex;flex-direction:column;align-items:center;gap:4px;pointer-events:none;z-index:40;zoom:var(--hud,1)}",
    ".w31-cap{background:rgba(18,10,6,.86);border:1px solid #6e5530;border-radius:6px;padding:3px 12px;color:#f6e9c8;font:600 15px/1.3 var(--fb,sans-serif);text-shadow:0 1px 0 #000;transition:opacity .35s;white-space:nowrap}",
    ".w31-cap i{font-style:normal;color:#ffd84a;margin-right:2px}.w31-cap .w31-pf{color:#ffd84a;margin:0 4px}.w31-cap.weg{opacity:0}",
    ".w31-vorschau{padding:2px 10px}.w31-vorschau canvas{width:100%;max-width:560px;height:auto;display:block;border-radius:5px;border:1px solid #3a2a22}",
    ".handheld .w31-cap{font-size:12px;padding:2px 8px}"
  ].join("\n");
  document.head.appendChild(css);

  Z.zugang = { abbild, modus: () => MODE, setModus: farbModus, roh, vorschau, untertitel: (txt, icon, dir) => untertitel("x:" + txt, icon || "♪", txt, dir || 0), parse, mapHSL };
  setTimeout(() => { wireText(); wireKlang(); wireHalten(); wireMenu(); requestAnimationFrame(tick); }, 0);
})();
