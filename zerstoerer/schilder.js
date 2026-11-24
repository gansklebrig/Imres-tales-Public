/* Ezekiel – The Destroyer · Hinweisschilder in der Welt
   Lern- und Ortshinweise stehen als gemalte Schilder direkt an der Stelle, an der man sie braucht – kein Fenster,
   keine Meldung oben. Sie gehören zur Kulisse: hinter Figuren, Gegnern und Fallen, ohne Kollision, und
   leuchten beim Näherkommen sanft auf (Ranken wiegen sich, das Bild wird heller und schärfer).

   Arten
     lern  – Steuerung (Lager & Torhof): laufen, springen, Doppelsprung, Stege, Leiter, Rolle, Hände, Fähigkeiten,
             Parade, Trank/Karte, Sturzangriff. Lernfortschritt in Z.meta.schilder.l (Zähler je Fertigkeit):
             gelernt → „alle“: nur noch dezent · „wenige“: ausgeblendet · „keine“: gar keine Lernschilder.
     ort   – Ortswissen: Waffenständer, Glutamboss, Runensperre, verschlossene Kammer, Prüfungsaltar, Hebel,
             erste Falle einer Art. Bei „keine“ sehr dezent.
   Stil je Gebiet: Lager Holztafel mit Schnitzrand, Seil, Laterne, Moos · Torhof Steinstele mit Efeu · Keller
   Fassboden mit Kreide · Hallen Messingplakette mit Dornenrosen · Wehrgang/Zinnen Pergament auf Brett · Verlies
   in Stein geritzt mit Kette · Hafen Treibholz mit Algen und Seepocken · Glocken Messing mit Efeu · Schlund Stein
   mit Spinnweben · Runenschmiede/Glutgassen Eisen mit glühenden Runen · See Stein mit Algen · Sturm Stein mit Dornen.
   Text 1–2 Zeilen (deutsch/englisch) mit gemalten Tasten für das aktuelle Gerät (Tastatur, Controller, Touch).
   Farben: Pergament & Schmiedeeisen – Gold, Darkin-Rot, Violett; kein Blau.

   Leistung: jedes Schild wird einmal in zwei kleine Bilder gemalt (gedämpft/hell) und nur bei Gerät-, Sprach-,
   Tasten-, Zoom- oder Zustandswechsel neu gebaut (höchstens zwei pro Bild). Im Bild: 2× drawImage + ein paar Ranken.

   SCHNITTSTELLE
     Z.schilder.hat(id)          → true, wenn im aktuellen Gebiet ein sichtbares Schild mit dieser Kennung steht
                                   (z. B. "falle:pendel", "rune:3,1", "schloss", "pruefung", "staender")
     Z.schilder.lerne(k, n)      → Lernfortschritt melden (z. B. aus anderen Modulen)
     Z.schilder.liste()          → Schilder des aktuellen Gebiets (Tests)
     Z.schilder.aktiv()          → true, solange Lernschilder gezeigt werden (Hinweise ≠ „keine“) */
(function () {
  "use strict";
  const Z = window.Z, T = Z.TILE, CW = Z.CW, CH = Z.CH, L = v => Z.L(v), inp = Z.input, FX = Z.fx;
  const TAU = Math.PI * 2, PI = Math.PI;
  const lo = () => !!(Z.gq && Z.gq.level === 0);
  const FB = "'Alegreya Sans','Trebuchet MS',sans-serif", FD = "'IM Fell English SC','Palatino Linotype',Georgia,serif";
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);

  /* ======================= LERNFORTSCHRITT ======================= */
  const NEED = { lauf: 2, sprung: 3, doppel: 2, steg: 1, leiter: 1, rolle: 2, h1: 2, h2: 2, faeh: 1, trank: 1, karte: 1, sturz: 1, aufwaerts: 1, parade: 1, aufheben: 1, amboss: 1, schloss: 1, pruefung: 1, hebel: 1 };
  const SM = () => { const m = Z.meta || (Z.meta = {}); if (!m.schilder || typeof m.schilder !== "object") m.schilder = {}; const s = m.schilder; if (!s.l || typeof s.l !== "object") s.l = {}; return s; };
  const known = k => (SM().l[k] | 0) >= (NEED[k] || 1);
  const allKnown = ks => !ks || !ks.length || ks.every(known);
  function learn(k, n) { const s = SM(), was = known(k); s.l[k] = Math.min(99, (s.l[k] | 0) + (n || 1)); if (!was && known(k) && Z.saveMeta) Z.saveMeta(); }
  const hl = () => (Z.ui && Z.ui.hinweise ? Z.ui.hinweise() : 0); /* 0 alle · 2 wenige · 3 keine */

  /* ======================= TASTEN ======================= */
  const touchy = () => inp.device === "touch" || (Z.ui && Z.ui.touchOn && inp.device !== "pad");
  const devNow = () => (touchy() ? "touch" : inp.device === "pad" ? "pad" : "keys");
  const TOUCH = { a1: ["Waffe 1", "Weapon 1"], a2: ["Waffe 2", "Weapon 2"], jump: ["Sprung", "Jump"], roll: ["Rolle", "Roll"], s1: ["F1", "F1"], s2: ["F2", "F2"], potion: ["Trank", "Potion"], use: ["✋", "✋"], map: ["▦", "▦"], pause: ["II", "II"], up: ["▲", "▲"], down: ["▼", "▼"], left: ["◐", "◐"], right: ["◐", "◐"] };
  const PADK = ["A", "B", "X", "Y", "LB", "RB", "LT", "RT", "View", "Menu", "LS", "RS", "↑", "↓", "←", "→"];
  function keyName(a, dev) {
    if (dev === "touch") return { kind: "touch", s: L(TOUCH[a] || [a, a]) };
    if (dev === "pad") {
      const i = inp.pad ? (a === "gear" && inp.pad.gear == null ? inp.pad.map : inp.pad[a]) : null;
      if (i != null) return { kind: "pad", s: inp.padButtonName ? inp.padButtonName(i) : PADK[i] || "?" };
      return { kind: "stick", s: a === "up" ? "▲" : a === "down" ? "▼" : "◐" };
    }
    const c = inp.keys && inp.keys[a] && (inp.keys[a][0] || inp.keys[a][1]);
    return { kind: "keys", s: c && inp.keyName ? inp.keyName(c) : "?" };
  }
  /* Schreibweise in Inhalten: { k: "jump" } eine Taste · { k: ["down", "jump"] } Kombination · { mv: 1 } laufen */
  function resolve(tok, dev) {
    if (typeof tok === "string") return [{ t: "txt", s: tok }];
    if (tok.ico) return [{ t: "ico", i: tok.ico }];
    if (tok.mv) {
      if (dev === "keys") { const a = keyName("left", dev), b = keyName("right", dev); return [{ t: "key", k: a }, { t: "key", k: b, gap: 0.8 }]; }
      return [{ t: "key", k: dev === "pad" ? { kind: "stick", s: "◐" } : { kind: "touch", s: "◀ ▶" } }];
    }
    const ks = Array.isArray(tok.k) ? tok.k : [tok.k], out = [];
    ks.forEach((a, i) => { if (i) out.push({ t: "plus" }); out.push({ t: "key", k: keyName(a, dev) }); });
    return out;
  }

  /* ======================= MESSEN & SETZEN ======================= */
  const scratch = document.createElement("canvas").getContext("2d");
  const F_SM = "700 5.9px " + FB, ROWSM = 8.6;
  const F_TXT = "700 6.6px " + FB, F_TTL = "7.4px " + FD, F_KEY = "800 5.6px " + FB, F_PAD = "800 5px " + FB, F_TCH = "700 4.9px " + FB;
  const KH = 8.4, ROWH = 10.2, TTLH = 9.2;
  function keyW(k) {
    if (k.kind === "keys") { scratch.font = F_KEY; return Math.max(KH, scratch.measureText(k.s).width + 4.4); }
    if (k.kind === "pad") { if (/^[ABXY]$/.test(k.s)) return KH + 0.4; scratch.font = F_PAD; return Math.max(KH + 1, scratch.measureText(k.s).width + 5); }
    if (k.kind === "stick") return KH + 0.4;
    scratch.font = F_TCH; return Math.max(KH, scratch.measureText(k.s).width + 5);
  }
  function atomW(a) {
    if (a.t === "txt") { scratch.font = a.sm ? F_SM : F_TXT; return scratch.measureText(a.s).width; }
    if (a.t === "plus") return 5;
    if (a.t === "ico") return 11;
    return keyW(a.k) + 1.2 + (a.gap || 0);
  }
  /* Zeile in Wörter und Tastengruppen zerlegen, dann bis maxW umbrechen */
  function wrapRow(row, dev, maxW) {
    const atoms = [];
    for (const tok of row) {
      const parts = resolve(tok, dev);
      if (parts.length === 1 && parts[0].t === "txt") {
        const words = parts[0].s.split(/(\s+)/);
        for (const w of words) if (w) atoms.push({ t: "txt", s: w, sp: /^\s+$/.test(w), sm: !!row.sm });
      } else atoms.push({ t: "grp", parts });
    }
    const lines = []; let cur = [], cw = 0;
    const wOf = a => (a.t === "grp" ? a.parts.reduce((s, p) => s + atomW(p), 0) : atomW(a));
    for (const a of atoms) {
      const w = wOf(a);
      if (cw + w > maxW && cur.length && !a.sp) { while (cur.length && cur[cur.length - 1].sp) cw -= wOf(cur.pop()); lines.push({ atoms: cur, w: cw }); cur = []; cw = 0; }
      if (!cur.length && a.sp) continue;
      cur.push(a); cw += w;
    }
    while (cur.length && cur[cur.length - 1].sp) cw -= wOf(cur.pop());
    if (cur.length) lines.push({ atoms: cur, w: cw });
    return lines.map(l => ({ w: l.w, atoms: l.atoms, sm: !!row.sm }));
  }
  function layout(s, dev) {
    const ct = s.content(), maxW = s.maxW || 132;
    const lines = []; for (const r of ct.rows || []) for (const l of wrapRow(r, dev, maxW)) lines.push(l);
    scratch.font = F_TTL; const tw = ct.title ? scratch.measureText(ct.title).width + (ct.icon ? 11 : 0) : 0;
    const inner = Math.max(tw, ...lines.map(l => l.w), 30);
    const st = STYLE[s.style], px = st.padX || 6;
    let py = st.padY || 4.6;
    /* runder Fassboden: nicht zu flach */
    if (st.round) { const w0 = inner + px * 2, h0 = py * 2 + (ct.title ? TTLH : 0) + lines.reduce((a, l) => a + (l.sm ? ROWSM : ROWH), 0) - 1.2; if (h0 < w0 * 0.33) py += (w0 * 0.33 - h0) / 2; }
    return { ct, lines, w: Math.ceil(inner + px * 2), h: Math.ceil(py * 2 + (ct.title ? TTLH : 0) + lines.reduce((a, l) => a + (l.sm ? ROWSM : ROWH), 0) - (lines.length ? 1.2 : 0)), px, py };
  }

  /* ======================= MALEN: TASTEN ======================= */
  function rr(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.lineTo(x + w - r, y); c.quadraticCurveTo(x + w, y, x + w, y + r); c.lineTo(x + w, y + h - r); c.quadraticCurveTo(x + w, y + h, x + w - r, y + h); c.lineTo(x + r, y + h); c.quadraticCurveTo(x, y + h, x, y + h - r); c.lineTo(x, y + r); c.quadraticCurveTo(x, y, x + r, y); c.closePath(); }
  const PADCOL = { A: "#ffd27a", B: "#ff7a62", X: "#f2e2c0", Y: "#d6a2ff" };
  function drawKey(c, k, x, cy) {
    const w = keyW(k), y = cy - KH / 2;
    c.save(); c.textAlign = "center"; c.textBaseline = "middle";
    if (k.kind === "keys" || k.kind === "touch") {
      c.fillStyle = "rgba(10,4,2,.55)"; rr(c, x + 0.2, y + 0.9, w, KH, 1.8); c.fill();
      const g = c.createLinearGradient(0, y, 0, y + KH); g.addColorStop(0, "#f8ecce"); g.addColorStop(1, "#c9aa72");
      c.fillStyle = g; rr(c, x, y, w, KH, 1.8); c.fill();
      c.fillStyle = "rgba(110,80,40,.75)"; c.fillRect(x + 1, y + KH - 1.5, w - 2, 1.1);
      c.strokeStyle = "#5e4524"; c.lineWidth = 0.5; rr(c, x, y, w, KH, 1.8); c.stroke();
      c.fillStyle = "rgba(255,255,255,.45)"; c.fillRect(x + 1.6, y + 0.45, w - 3.2, 0.35);
      if (k.kind === "touch") { c.strokeStyle = "rgba(122,30,30,.55)"; c.lineWidth = 0.4; rr(c, x + 0.9, y + 0.9, w - 1.8, KH - 1.8, 1.4); c.stroke(); }
      c.fillStyle = "#2a1810"; c.font = k.kind === "touch" ? F_TCH : F_KEY; c.fillText(k.s, x + w / 2, cy + 0.1);
    } else if (k.kind === "pad" && /^[ABXY]$/.test(k.s)) {
      const r = (KH + 0.4) / 2, mx = x + r;
      c.fillStyle = "rgba(10,4,2,.55)"; c.beginPath(); c.arc(mx + 0.2, cy + 0.8, r, 0, TAU); c.fill();
      const g = c.createRadialGradient(mx - 1.2, cy - 1.4, 0.5, mx, cy, r); g.addColorStop(0, "#4a3c40"); g.addColorStop(1, "#1c1418");
      c.fillStyle = g; c.beginPath(); c.arc(mx, cy, r, 0, TAU); c.fill();
      c.strokeStyle = "#c8a050"; c.lineWidth = 0.6; c.beginPath(); c.arc(mx, cy, r - 0.3, 0, TAU); c.stroke();
      c.fillStyle = PADCOL[k.s]; c.font = "800 5.6px " + FB; c.fillText(k.s, mx, cy + 0.1);
    } else if (k.kind === "stick") {
      const r = (KH + 0.4) / 2, mx = x + r;
      c.fillStyle = "rgba(10,4,2,.55)"; c.beginPath(); c.arc(mx + 0.2, cy + 0.8, r, 0, TAU); c.fill();
      c.fillStyle = "#241a1e"; c.beginPath(); c.arc(mx, cy, r, 0, TAU); c.fill();
      c.strokeStyle = "#c8a050"; c.lineWidth = 0.5; c.beginPath(); c.arc(mx, cy, r - 0.3, 0, TAU); c.stroke();
      c.fillStyle = "#4a3c40"; c.beginPath(); c.arc(mx, cy, r * 0.42, 0, TAU); c.fill();
      c.fillStyle = "#ffd27a";
      const tri = (ax, ay, dx, dy) => { c.beginPath(); c.moveTo(ax + dx * 1.9, ay + dy * 1.9); c.lineTo(ax - dy * 1.5, ay + dx * 1.5); c.lineTo(ax + dy * 1.5, ay - dx * 1.5); c.closePath(); c.fill(); };
      if (k.s === "▲") tri(mx, cy - 1.6, 0, -1); else if (k.s === "▼") tri(mx, cy + 1.6, 0, 1); else { tri(mx - 2, cy, -1, 0); tri(mx + 2, cy, 1, 0); }
    } else {
      c.fillStyle = "rgba(10,4,2,.55)"; rr(c, x + 0.2, y + 0.9, w, KH, 2.6); c.fill();
      const g = c.createLinearGradient(0, y, 0, y + KH); g.addColorStop(0, "#40343a"); g.addColorStop(1, "#1e161a");
      c.fillStyle = g; rr(c, x, y, w, KH, 2.6); c.fill();
      c.strokeStyle = "#c8a050"; c.lineWidth = 0.55; rr(c, x + 0.3, y + 0.3, w - 0.6, KH - 0.6, 2.3); c.stroke();
      c.fillStyle = "#ffd27a"; c.font = F_PAD; c.fillText(k.s, x + w / 2, cy + 0.1);
    }
    c.restore();
    return w;
  }

  /* ======================= MALEN: SINNBILDER ======================= */
  function icon(c, kind, x, y, st) {
    c.save(); c.translate(x, y); c.lineJoin = "round"; c.lineCap = "round";
    const ink = st.light ? "#3a2010" : "#f0dcae";
    if (kind === "gefahr") { c.fillStyle = "#8a1a1a"; c.beginPath(); c.moveTo(0, -4.4); c.lineTo(4.4, 3.4); c.lineTo(-4.4, 3.4); c.closePath(); c.fill(); c.strokeStyle = "#ffb070"; c.lineWidth = 0.6; c.stroke(); c.fillStyle = "#ffe0a0"; c.fillRect(-0.45, -1.8, 0.9, 3); c.fillRect(-0.45, 1.8, 0.9, 0.9); }
    else if (kind === "rune") { c.fillStyle = "rgba(60,20,80,.85)"; c.beginPath(); c.arc(0, 0, 4.2, 0, TAU); c.fill(); c.strokeStyle = "#c890ff"; c.lineWidth = 0.6; c.stroke(); c.strokeStyle = "#ead2ff"; c.lineWidth = 0.7; c.beginPath(); c.moveTo(0, -2.8); c.lineTo(2, -0.6); c.lineTo(0, 1.4); c.lineTo(-2, -0.6); c.closePath(); c.moveTo(0, 1.4); c.lineTo(-2, 3); c.moveTo(0, 1.4); c.lineTo(2, 3); c.stroke(); }
    else if (kind === "schloss") { c.strokeStyle = "#c8a050"; c.lineWidth = 1.1; c.beginPath(); c.arc(0, -1.2, 2.2, PI, 0); c.stroke(); c.fillStyle = "#e5b454"; rr(c, -3.2, -1.4, 6.4, 5, 0.8); c.fill(); c.fillStyle = "#3a2410"; c.beginPath(); c.arc(0, 0.6, 0.8, 0, TAU); c.fill(); c.fillRect(-0.35, 0.8, 0.7, 1.8); }
    else if (kind === "altar") { c.fillStyle = "#6a5a54"; c.fillRect(-3.4, 1, 6.8, 3); c.fillRect(-4.2, 0, 8.4, 1.2); c.fillStyle = "#ff9a3a"; c.beginPath(); c.moveTo(0, -4.6); c.quadraticCurveTo(2.6, -1.4, 1.4, 0); c.lineTo(-1.4, 0); c.quadraticCurveTo(-2.6, -1.6, 0, -4.6); c.fill(); c.fillStyle = "#ffe0a0"; c.beginPath(); c.moveTo(0, -2.6); c.quadraticCurveTo(1.2, -1, 0.6, 0); c.lineTo(-0.6, 0); c.quadraticCurveTo(-1.2, -1, 0, -2.6); c.fill(); }
    else if (kind === "hebel") { c.fillStyle = "#4a4044"; rr(c, -3.6, 1.4, 7.2, 2.8, 0.8); c.fill(); c.strokeStyle = "#8a7a70"; c.lineWidth = 1; c.beginPath(); c.moveTo(0, 2); c.lineTo(2.8, -3.2); c.stroke(); c.fillStyle = "#c83a2a"; c.beginPath(); c.arc(2.9, -3.4, 1.3, 0, TAU); c.fill(); }
    else if (kind === "amboss") { c.fillStyle = "#4a4246"; c.beginPath(); c.moveTo(-4.4, -2); c.lineTo(3.4, -2); c.lineTo(3.4, -0.4); c.lineTo(1.2, 0.6); c.lineTo(1.6, 3); c.lineTo(-2, 3); c.lineTo(-1.6, 0.6); c.quadraticCurveTo(-3.6, 0, -4.4, -2); c.fill(); c.fillStyle = "#ffb040"; c.fillRect(-1.8, -2.6, 3.6, 0.7); }
    else if (kind === "waffen") { c.strokeStyle = "#d8d0c8"; c.lineWidth = 0.9; c.beginPath(); c.moveTo(-3.6, 3.6); c.lineTo(3.4, -3.4); c.moveTo(3.6, 3.6); c.lineTo(-3.4, -3.4); c.stroke(); c.strokeStyle = "#c8a050"; c.lineWidth = 1.1; c.beginPath(); c.moveTo(-3.8, 1.6); c.lineTo(-1.6, 3.8); c.moveTo(3.8, 1.6); c.lineTo(1.6, 3.8); c.stroke(); }
    else if (kind === "schritt") { c.fillStyle = ink; for (const [dx, dy, r] of [[-1.8, 1.2, -0.2], [1.8, -1.6, 0.2]]) { c.save(); c.translate(dx, dy); c.rotate(r); c.beginPath(); c.ellipse(0, 0, 1.2, 2, 0, 0, TAU); c.fill(); c.beginPath(); c.arc(0, 2.9, 0.9, 0, TAU); c.fill(); c.restore(); } }
    else if (kind === "puppe") { c.strokeStyle = "#c83a2a"; c.lineWidth = 0.8; c.beginPath(); c.arc(0, 0, 3.8, 0, TAU); c.stroke(); c.beginPath(); c.arc(0, 0, 2, 0, TAU); c.stroke(); c.fillStyle = "#e5b454"; c.beginPath(); c.arc(0, 0, 0.8, 0, TAU); c.fill(); }
    else if (kind === "trank") { c.fillStyle = "#c8303a"; c.beginPath(); c.arc(0, 1.2, 3, 0, TAU); c.fill(); c.fillStyle = "#e8d8c0"; c.fillRect(-1, -3.8, 2, 2.6); c.fillStyle = "#8a5a30"; c.fillRect(-1.2, -4.6, 2.4, 1); c.fillStyle = "rgba(255,255,255,.5)"; c.beginPath(); c.arc(-1, 0.4, 0.8, 0, TAU); c.fill(); }
    else if (kind === "schild") { c.fillStyle = "#8a1a1a"; c.beginPath(); c.moveTo(-3.4, -3.6); c.lineTo(3.4, -3.6); c.lineTo(3.2, 0.4); c.quadraticCurveTo(2, 3.2, 0, 4.2); c.quadraticCurveTo(-2, 3.2, -3.2, 0.4); c.closePath(); c.fill(); c.strokeStyle = "#e5b454"; c.lineWidth = 0.6; c.stroke(); c.beginPath(); c.moveTo(0, -3.2); c.lineTo(0, 3.6); c.stroke(); }
    c.restore();
  }

  /* ======================= MALEN: TAFELN JE STIL ======================= */
  /* Jede Tafel: board(c, w, h, R, s) malt bei (0,0); light = heller Grund (dunkle Schrift) */
  function plankGrain(c, x, y, w, h, R, col, n) {
    c.strokeStyle = col; c.lineWidth = 0.35;
    for (let i = 0; i < n; i++) { const yy = y + 0.8 + R() * (h - 1.6), a = R() * 0.8; c.beginPath(); c.moveTo(x + 1, yy); for (let xx = x + 4; xx < x + w - 1; xx += 4) c.lineTo(xx, yy + Math.sin(xx * 0.21 + a * 9) * 0.35 + (R() - 0.5) * 0.15); c.stroke(); }
  }
  function knot(c, x, y, r, col) { c.strokeStyle = col; c.lineWidth = 0.35; for (let i = 0; i < 3; i++) { c.beginPath(); c.ellipse(x, y, r + i * 0.9, r * 0.55 + i * 0.5, 0, 0, TAU); c.stroke(); } c.fillStyle = col; c.beginPath(); c.ellipse(x, y, r * 0.7, r * 0.4, 0, 0, TAU); c.fill(); }
  function nail(c, x, y) { c.fillStyle = "rgba(0,0,0,.45)"; c.beginPath(); c.arc(x + 0.3, y + 0.4, 1, 0, TAU); c.fill(); c.fillStyle = "#5a5056"; c.beginPath(); c.arc(x, y, 0.95, 0, TAU); c.fill(); c.fillStyle = "#9a9096"; c.beginPath(); c.arc(x - 0.3, y - 0.3, 0.4, 0, TAU); c.fill(); }
  function boardHolz(c, w, h, R) {
    /* Bretter mit Maserung, Fugen, Astlöchern, Schnitzrand */
    const n = h > 28 ? 3 : 2, ph = h / n;
    for (let i = 0; i < n; i++) {
      const y = i * ph, off = (R() - 0.5) * 1.2, g = c.createLinearGradient(0, y, 0, y + ph);
      const base = ["#7a5434", "#6e4a2c", "#76512f"][i % 3]; g.addColorStop(0, "#8a6440"); g.addColorStop(0.25, base); g.addColorStop(1, "#5a3a22");
      c.fillStyle = g; c.beginPath(); c.moveTo(off, y); c.lineTo(w + off * 0.6, y + 0.3); c.lineTo(w - off * 0.4, y + ph); c.lineTo(-off * 0.3, y + ph); c.closePath(); c.fill();
      plankGrain(c, 0, y, w, ph, R, "rgba(46,26,12,.55)", 4);
      if (R() < 0.8) knot(c, 6 + R() * (w - 12), y + ph * (0.3 + R() * 0.4), 0.9 + R() * 0.7, "rgba(50,28,14,.7)");
      c.fillStyle = "rgba(30,16,8,.8)"; c.fillRect(0, y + ph - 0.5, w, 0.7);
      c.fillStyle = "rgba(255,220,160,.12)"; c.fillRect(0.5, y + 0.4, w - 1, 0.5);
    }
    /* Schnitzrand: eingekerbte Linie mit hellem Gegengrat, kleine Kerben in den Ecken */
    c.strokeStyle = "rgba(34,18,8,.85)"; c.lineWidth = 0.7; c.strokeRect(2.2, 2.2, w - 4.4, h - 4.4);
    c.strokeStyle = "rgba(255,214,150,.22)"; c.lineWidth = 0.4; c.strokeRect(2.8, 2.8, w - 4.4, h - 4.4);
    c.fillStyle = "rgba(34,18,8,.85)"; for (const [x, y] of [[2.2, 2.2], [w - 2.2, 2.2], [2.2, h - 2.2], [w - 2.2, h - 2.2]]) { c.beginPath(); c.moveTo(x, y - 1.6); c.lineTo(x + 1.6, y); c.lineTo(x, y + 1.6); c.lineTo(x - 1.6, y); c.closePath(); c.fill(); }
    for (let x = 8; x < w - 6; x += 7) { c.fillStyle = "rgba(34,18,8,.55)"; c.fillRect(x, 0.9, 0.5, 0.9); c.fillRect(x + 2, h - 1.8, 0.5, 0.9); }
    c.strokeStyle = "#2a160a"; c.lineWidth = 0.8; c.strokeRect(0.4, 0.4, w - 0.8, h - 0.8);
  }
  function stoneTex(c, w, h, R, base, dk, lt) {
    for (let i = 0; i < w * h / 26; i++) { c.fillStyle = R() < 0.5 ? dk : lt; c.globalAlpha = 0.25 + R() * 0.3; c.fillRect(R() * w, R() * h, 0.5 + R() * 1.1, 0.4 + R() * 0.7); }
    c.globalAlpha = 1;
    c.strokeStyle = dk; c.lineWidth = 0.4;
    for (let i = 0; i < 2; i++) { let x = R() * w, y = R() < 0.5 ? 0 : h; c.beginPath(); c.moveTo(x, y); for (let k = 0; k < 4; k++) { x += (R() - 0.5) * 6; y += (y > h / 2 ? -1 : 1) * (2 + R() * 3); c.lineTo(x, y); } c.stroke(); }
  }
  function stelePath(c, w, h, R, top) {
    c.beginPath(); c.moveTo(0.6, h);
    c.lineTo(0, top + 2); c.quadraticCurveTo(0.4, 0.4, w * 0.18, 0.3);
    for (let x = w * 0.18; x < w * 0.82; x += 5) c.lineTo(x, (R() - 0.5) * 0.6);
    c.quadraticCurveTo(w - 0.4, 0.4, w, top + 2); c.lineTo(w - 0.6, h); c.closePath();
  }
  function boardStein(c, w, h, R, s) {
    const g = c.createLinearGradient(0, 0, w * 0.3, h); g.addColorStop(0, "#6e6466"); g.addColorStop(0.5, "#5a5254"); g.addColorStop(1, "#423b3e");
    stelePath(c, w, h, R, 4); c.fillStyle = g; c.fill();
    c.save(); stelePath(c, w, h, R, 4); c.clip(); stoneTex(c, w, h, R, "#5a5254", "#2e282c", "#8a8084");
    /* Absplitterungen an den Kanten */
    c.fillStyle = "#3a3236"; for (let i = 0; i < 4; i++) { const x = R() < 0.5 ? R() * 2 : w - R() * 2, y = 4 + R() * (h - 8); c.beginPath(); c.moveTo(x, y); c.lineTo(x + (x < w / 2 ? 2 : -2), y + 1); c.lineTo(x, y + 2.4); c.fill(); }
    c.fillStyle = "rgba(255,240,220,.1)"; c.fillRect(1.4, 1.6, w - 2.8, 0.7);
    if (s && s.grow === "algen") { const ga = c.createLinearGradient(0, h * 0.55, 0, h); ga.addColorStop(0, "rgba(40,44,24,0)"); ga.addColorStop(1, "rgba(40,44,24,.7)"); c.fillStyle = ga; c.fillRect(0, 0, w, h); }
    c.restore();
    /* eingemeißelter Rahmen */
    c.strokeStyle = "rgba(20,14,18,.75)"; c.lineWidth = 0.6; c.strokeRect(3, 5, w - 6, h - 8);
    c.strokeStyle = "rgba(200,190,190,.18)"; c.lineWidth = 0.4; c.strokeRect(3.6, 5.6, w - 6, h - 8);
    stelePath(c, w, h, R, 4); c.strokeStyle = "#241e22"; c.lineWidth = 0.8; c.stroke();
  }
  function boardFass(c, w, h, R) {
    /* Fassboden: ovale Dauben, Eisenreif, Spundloch */
    const cx = w / 2, cy = h / 2, rx = w / 2, ry = h / 2;
    c.save(); c.beginPath(); c.ellipse(cx, cy, rx, ry, 0, 0, TAU); c.clip();
    const g = c.createRadialGradient(cx - rx * 0.3, cy - ry * 0.4, 2, cx, cy, rx); g.addColorStop(0, "#4a3424"); g.addColorStop(1, "#2a1c12");
    c.fillStyle = g; c.fillRect(0, 0, w, h);
    const n = Math.max(4, Math.round(w / 12));
    for (let i = 1; i < n; i++) { const x = i * w / n + (R() - 0.5); c.fillStyle = "rgba(10,6,2,.8)"; c.fillRect(x - 0.35, 0, 0.7, h); c.fillStyle = "rgba(160,120,80,.12)"; c.fillRect(x + 0.4, 0, 0.5, h); }
    plankGrain(c, 0, 0, w, h, R, "rgba(14,8,4,.45)", 9);
    /* Weinflecken und Kreidereste */
    for (let i = 0; i < 3; i++) { c.fillStyle = "rgba(90,20,30,.25)"; c.beginPath(); c.ellipse(R() * w, R() * h, 2 + R() * 4, 1.5 + R() * 2, R() * 3, 0, TAU); c.fill(); }
    for (let i = 0; i < 12; i++) { c.fillStyle = "rgba(240,236,226,.12)"; c.fillRect(R() * w, R() * h, 1 + R() * 3, 0.3); }
    c.restore();
    c.strokeStyle = "#1a1412"; c.lineWidth = 2.2; c.beginPath(); c.ellipse(cx, cy, rx - 1, ry - 1, 0, 0, TAU); c.stroke();
    c.strokeStyle = "#5a5052"; c.lineWidth = 0.6; c.beginPath(); c.ellipse(cx, cy, rx - 1.4, ry - 1.4, 0, PI * 1.05, PI * 1.7); c.stroke();
    for (let i = 0; i < 8; i++) { const a = i / 8 * TAU + 0.2; nail(c, cx + Math.cos(a) * (rx - 1.1), cy + Math.sin(a) * (ry - 1.1)); }
    c.fillStyle = "#140c08"; c.beginPath(); c.arc(cx + rx * 0.62, cy + ry * 0.45, 1.3, 0, TAU); c.fill();
  }
  function boardMessing(c, w, h, R) {
    const ch = 3, path = () => { c.beginPath(); c.moveTo(ch, 0); c.lineTo(w - ch, 0); c.lineTo(w, ch); c.lineTo(w, h - ch); c.lineTo(w - ch, h); c.lineTo(ch, h); c.lineTo(0, h - ch); c.lineTo(0, ch); c.closePath(); };
    c.fillStyle = "#2a1c10"; c.save(); c.translate(0.6, 0.9); path(); c.fill(); c.restore();
    const g = c.createLinearGradient(0, 0, w * 0.4, h); g.addColorStop(0, "#e8cc7a"); g.addColorStop(0.35, "#c8a050"); g.addColorStop(0.7, "#a8823a"); g.addColorStop(1, "#8a6a2a");
    path(); c.fillStyle = g; c.fill();
    c.save(); path(); c.clip();
    /* Patina und gebürstete Linien */
    for (let i = 0; i < h; i += 1.2) { c.fillStyle = "rgba(255,240,200," + (0.04 + R() * 0.06) + ")"; c.fillRect(0, i, w, 0.4); }
    for (let i = 0; i < 6; i++) { c.fillStyle = "rgba(70,50,30,.25)"; c.beginPath(); c.ellipse(R() * w, R() < 0.5 ? h - R() * 4 : R() * 4, 2 + R() * 5, 1 + R() * 2, 0, 0, TAU); c.fill(); }
    c.restore();
    c.strokeStyle = "#5a4018"; c.lineWidth = 0.7; path(); c.stroke();
    c.strokeStyle = "rgba(255,240,200,.55)"; c.lineWidth = 0.4; c.beginPath(); c.moveTo(ch + 0.6, 0.8); c.lineTo(w - ch - 0.6, 0.8); c.stroke();
    c.strokeStyle = "rgba(60,40,16,.55)"; c.lineWidth = 0.45; c.strokeRect(2.6, 2.6, w - 5.2, h - 5.2);
    for (const [x, y] of [[2.4, 2.4], [w - 2.4, 2.4], [2.4, h - 2.4], [w - 2.4, h - 2.4]]) { c.fillStyle = "#6a5020"; c.beginPath(); c.arc(x, y, 1.1, 0, TAU); c.fill(); c.strokeStyle = "#f0dc98"; c.lineWidth = 0.35; c.beginPath(); c.moveTo(x - 0.7, y - 0.4); c.lineTo(x + 0.7, y + 0.4); c.stroke(); }
  }
  function tornRect(c, w, h, R, j) {
    c.beginPath(); c.moveTo(0, 0);
    for (let x = 0; x <= w; x += 3) c.lineTo(x, (R() - 0.3) * j);
    for (let y = 0; y <= h; y += 3) c.lineTo(w + (R() - 0.5) * j, y);
    for (let x = w; x >= 0; x -= 2.5) c.lineTo(x, h + (R() - 0.6) * j * 1.3);
    for (let y = h; y >= 0; y -= 3) c.lineTo((R() - 0.5) * j, y);
    c.closePath();
  }
  function boardPergament(c, w, h, R, s) {
    if (s && s.mount === "pfosten") { /* Brett dahinter */ c.fillStyle = "#4a3020"; c.fillRect(-3, -2.5, w + 6, h + 5); plankGrain(c, -3, -2.5, w + 6, h + 5, R, "rgba(20,10,4,.5)", 5); c.strokeStyle = "#24140a"; c.lineWidth = 0.7; c.strokeRect(-3, -2.5, w + 6, h + 5); }
    c.save(); c.translate(0.7, 1); tornRect(c, w, h, R, 1.6); c.fillStyle = "rgba(0,0,0,.45)"; c.fill(); c.restore();
    const g = c.createLinearGradient(0, 0, w, h); g.addColorStop(0, "#f0e2bc"); g.addColorStop(0.6, "#e2cc98"); g.addColorStop(1, "#c8aa72");
    tornRect(c, w, h, R, 1.6); c.fillStyle = g; c.fill();
    c.save(); tornRect(c, w, h, R, 1.6); c.clip();
    for (let i = 0; i < 5; i++) { const gr = c.createRadialGradient(0, 0, 0, 0, 0, 1); void gr; c.fillStyle = "rgba(140,96,40," + (0.08 + R() * 0.1) + ")"; c.beginPath(); c.ellipse(R() * w, R() * h, 3 + R() * 6, 2 + R() * 4, R() * 3, 0, TAU); c.fill(); }
    const ed = c.createLinearGradient(0, 0, 0, h); ed.addColorStop(0, "rgba(120,80,30,.25)"); ed.addColorStop(0.15, "rgba(120,80,30,0)"); ed.addColorStop(0.85, "rgba(120,80,30,0)"); ed.addColorStop(1, "rgba(120,80,30,.35)"); c.fillStyle = ed; c.fillRect(0, 0, w, h);
    c.restore();
    /* eingerollte Ecke unten rechts */
    c.fillStyle = "#b8945a"; c.beginPath(); c.moveTo(w - 6, h + 0.5); c.quadraticCurveTo(w - 1, h - 1, w + 0.5, h - 6); c.lineTo(w - 3, h - 3); c.closePath(); c.fill();
    nail(c, 3, 2.6); nail(c, w - 3, 2.6);
    /* Siegel mit Bändchen, halb über der unteren Kante */
    c.strokeStyle = "#7a1418"; c.lineWidth = 0.8; c.beginPath(); c.moveTo(w - 9, h - 1); c.lineTo(w - 10.5, h + 4); c.moveTo(w - 8, h - 1); c.lineTo(w - 7, h + 4.4); c.stroke();
    c.fillStyle = "#7a1418"; c.beginPath(); for (let i = 0; i < 10; i++) { const a = i / 10 * TAU, r = i % 2 ? 2.2 : 2.7; c.lineTo(w - 8.5 + Math.cos(a) * r, h + 0.2 + Math.sin(a) * r); } c.closePath(); c.fill();
    c.fillStyle = "#a82a2a"; c.beginPath(); c.arc(w - 8.8, h - 0.1, 1.3, 0, TAU); c.fill();
  }
  function boardGeritzt(c, w, h, R) {
    c.beginPath(); c.moveTo(1, 2); c.lineTo(w * 0.3, 0); c.lineTo(w * 0.7, 1); c.lineTo(w - 1, 0.4); c.lineTo(w, h * 0.5); c.lineTo(w - 0.5, h); c.lineTo(w * 0.4, h - 0.4); c.lineTo(0, h); c.lineTo(0.5, h * 0.5); c.closePath();
    const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, "#4e4646"); g.addColorStop(1, "#2e2828"); c.fillStyle = g; c.fill();
    c.strokeStyle = "#181214"; c.lineWidth = 0.8; c.stroke();
    c.save(); c.clip(); stoneTex(c, w, h, R, "#4a4242", "#1e1a1a", "#7a7070");
    /* Strichlisten der Gefangenen */
    c.strokeStyle = "rgba(220,210,196,.35)"; c.lineWidth = 0.4;
    const tl = (x, y) => { for (let i = 0; i < 4; i++) { c.beginPath(); c.moveTo(x + i * 1.2, y); c.lineTo(x + i * 1.2 + 0.2, y + 3.2); c.stroke(); } c.beginPath(); c.moveTo(x - 0.6, y + 2.6); c.lineTo(x + 4.4, y + 0.6); c.stroke(); };
    tl(w - 10, h - 5.2); if (w > 70) tl(3, h - 5);
    c.restore();
  }
  function boardTreibholz(c, w, h, R) {
    const top = [], bot = []; for (let x = 0; x <= w; x += 4) { top.push([x, (R() - 0.5) * 1.4 + Math.sin(x * 0.12) * 0.8]); bot.push([x, h + (R() - 0.5) * 1.6 + Math.sin(x * 0.1 + 2) * 0.9]); }
    const outline = () => { c.beginPath(); c.moveTo(-1, 2); for (const [x, y] of top) c.lineTo(x, y); c.lineTo(w + 2, h * 0.35); c.lineTo(w + 0.5, h * 0.7); for (let i = bot.length - 1; i >= 0; i--) c.lineTo(bot[i][0], bot[i][1]); c.lineTo(-2, h * 0.6); c.closePath(); };
    outline();
    const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, "#b0a28c"); g.addColorStop(0.5, "#9a8a74"); g.addColorStop(1, "#7a6a58"); c.fillStyle = g; c.fill();
    c.save(); c.clip();
    plankGrain(c, 0, 0, w, h, R, "rgba(70,56,44,.55)", 9);
    for (let i = 0; i < 6; i++) { c.fillStyle = "rgba(240,236,226,.18)"; c.beginPath(); c.ellipse(R() * w, R() * h, 2 + R() * 4, 0.8 + R(), 0, 0, TAU); c.fill(); }
    c.restore();
    outline(); c.strokeStyle = "#4a3c30"; c.lineWidth = 0.6; c.stroke();
    /* Seepocken und eine Muschel */
    for (let i = 0; i < 7; i++) { const x = R() < 0.5 ? 2 + R() * 6 : w - 2 - R() * 6, y = h - 1 - R() * 5; c.fillStyle = "#d8d0c4"; c.beginPath(); c.arc(x, y, 0.6 + R() * 0.5, 0, TAU); c.fill(); c.fillStyle = "#6a5e54"; c.beginPath(); c.arc(x, y, 0.25, 0, TAU); c.fill(); }
    c.save(); c.translate(w - 5, 3.2); c.fillStyle = "#e8c8b0"; c.beginPath(); c.moveTo(0, 2); for (let i = 0; i <= 6; i++) { const a = PI + i / 6 * PI; c.lineTo(Math.cos(a) * 2.4, 1.6 + Math.sin(a) * 2.6); } c.closePath(); c.fill(); c.strokeStyle = "#a07a64"; c.lineWidth = 0.25; for (let i = 1; i < 6; i++) { const a = PI + i / 6 * PI; c.beginPath(); c.moveTo(0, 2); c.lineTo(Math.cos(a) * 2.3, 1.6 + Math.sin(a) * 2.5); c.stroke(); } c.restore();
  }
  function boardEisen(c, w, h, R) {
    c.fillStyle = "rgba(0,0,0,.5)"; rr(c, 0.6, 1, w, h, 2); c.fill();
    const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, "#4a4246"); g.addColorStop(0.5, "#322a2e"); g.addColorStop(1, "#241e22"); c.fillStyle = g; rr(c, 0, 0, w, h, 2); c.fill();
    c.save(); rr(c, 0, 0, w, h, 2); c.clip();
    for (let i = 0; i < w * h / 30; i++) { c.fillStyle = R() < 0.5 ? "rgba(110,60,30,.35)" : "rgba(0,0,0,.3)"; c.fillRect(R() * w, R() * h, 0.6 + R(), 0.5); }
    /* Glut an den Rändern */
    const ge = c.createLinearGradient(0, h - 4, 0, h); ge.addColorStop(0, "rgba(255,110,30,0)"); ge.addColorStop(1, "rgba(255,110,30,.4)"); c.fillStyle = ge; c.fillRect(0, h - 4, w, 4);
    c.restore();
    c.strokeStyle = "#7a6a6e"; c.lineWidth = 0.5; rr(c, 0.4, 0.4, w - 0.8, h - 0.8, 1.8); c.stroke();
    c.strokeStyle = "#140e10"; c.lineWidth = 0.6; rr(c, 2.4, 2.4, w - 4.8, h - 4.8, 1.2); c.stroke();
    for (let x = 4; x <= w - 4; x += Math.max(8, (w - 8) / Math.round((w - 8) / 12))) for (const y of [1.3, h - 1.3]) { c.fillStyle = "#5a5054"; c.beginPath(); c.arc(x, y, 0.75, 0, TAU); c.fill(); c.fillStyle = "#8a8084"; c.beginPath(); c.arc(x - 0.2, y - 0.25, 0.3, 0, TAU); c.fill(); }
    /* Runenband an den Seiten */
    c.save(); c.font = "5px serif"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillStyle = "rgba(255,150,60,.7)";
    const RU = "ᚠᚢᚦᚨᚱᚲᚷᚹᚺᚾᛁᛃ"; for (let y = 6; y < h - 4; y += 5.4) { c.fillText(RU[(R() * RU.length) | 0], 1.6, y); c.fillText(RU[(R() * RU.length) | 0], w - 1.6, y); }
    c.restore();
  }
  const STYLE = {
    holz: { board: boardHolz, light: false, ink: "#f6e6c2", sh: "rgba(24,12,4,.95)", title: "#ffd78a", padX: 7, padY: 5 },
    stein: { board: boardStein, light: false, ink: "#f2e0b6", sh: "rgba(12,8,12,.95)", title: "#eac464", padX: 7, padY: 5.4, top: 2.4 },
    fass: { board: boardFass, light: false, ink: "#f2eee4", sh: "rgba(10,6,4,.9)", title: "#fff6dc", padX: 11, padY: 6.4, chalk: true, round: true },
    plakette: { board: boardMessing, light: true, ink: "#2a1608", sh: "rgba(255,244,210,.55)", title: "#5a1010", padX: 7, padY: 5 },
    pergament: { board: boardPergament, light: true, ink: "#36200e", sh: "rgba(255,250,232,.35)", title: "#7a1a14", padX: 7, padY: 5.2 },
    geritzt: { board: boardGeritzt, light: false, ink: "#e6dccb", sh: "rgba(0,0,0,.9)", title: "#ecd2a4", padX: 7, padY: 5 },
    treibholz: { board: boardTreibholz, light: true, ink: "#2a1a12", sh: "rgba(236,226,206,.4)", title: "#6a1a14", padX: 7, padY: 5 },
    eisen: { board: boardEisen, light: false, ink: "#ffd8a0", sh: "rgba(0,0,0,.95)", title: "#ffb050", padX: 8, padY: 5 }
  };
  /* Gebiet → [Tafel, Bewuchs] */
  const BIOME = { lager: ["holz", "moos"], torhof: ["stein", "efeu"], keller: ["fass", "netz"], hallen: ["plakette", "dornen"], wehrgang: ["pergament", "efeu"], verlies: ["geritzt", "kette"], hafen: ["treibholz", "algen"], glocken: ["plakette", "efeu"], schlund: ["stein", "netz"], schmiede: ["eisen", "glut"], zinnen: ["pergament", "efeu"], see: ["stein", "algen"], glut: ["eisen", "glut"], sturm: ["stein", "dornen"] };
  const TONE = { gefahr: ["#ff8a6a", "#8a1a14"], rune: ["#dcaaff", "#5a2a7a"], gold: ["#ffd27a", "#6a4410"] };

  /* ======================= BEWUCHS ======================= */
  const IVY = ["#4e5a2c", "#5e6a34", "#3e4a24", "#6a7038"];
  function ivyLeaf(c, x, y, r, a, col) {
    c.save(); c.translate(x, y); c.rotate(a); c.fillStyle = col; c.beginPath();
    c.moveTo(0, 0); c.quadraticCurveTo(-r * 1.1, -r * 0.3, -r * 0.7, -r * 1.1); c.quadraticCurveTo(-r * 0.2, -r * 0.9, 0, -r * 1.6); c.quadraticCurveTo(r * 0.2, -r * 0.9, r * 0.7, -r * 1.1); c.quadraticCurveTo(r * 1.1, -r * 0.3, 0, 0); c.fill();
    c.strokeStyle = "rgba(20,24,8,.5)"; c.lineWidth = 0.2; c.beginPath(); c.moveTo(0, 0); c.lineTo(0, -r * 1.2); c.stroke(); c.restore();
  }
  function vine(c, pts, R, o) {
    o = o || {};
    c.strokeStyle = o.stem || "#3a3a1c"; c.lineWidth = o.lw || 0.6; c.beginPath(); c.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) { const [x0, y0] = pts[i - 1], [x1, y1] = pts[i]; c.quadraticCurveTo(x0 + (R() - 0.5) * 3, (y0 + y1) / 2 + (R() - 0.5) * 3, x1, y1); }
    c.stroke();
    for (let i = 1; i < pts.length; i++) {
      const [x0, y0] = pts[i - 1], [x1, y1] = pts[i];
      for (let u = 0; u < 1; u += 0.34) { const x = x0 + (x1 - x0) * u, y = y0 + (y1 - y0) * u; if (o.leaf) o.leaf(x, y, R); else ivyLeaf(c, x + (R() - 0.5) * 1.5, y + (R() - 0.5) * 1.5, 1.1 + R() * 0.8, (R() - 0.5) * 2.6, IVY[(R() * IVY.length) | 0]); }
    }
  }
  function moss(c, x0, x1, y, R, col) {
    for (let x = x0; x < x1; x += 1.4 + R() * 2.2) { if (R() < 0.35) continue; c.fillStyle = col || ["#4a5a2a", "#5a6a30", "#3a4a22"][(R() * 3) | 0]; c.beginPath(); c.ellipse(x, y + 0.2, 1.2 + R() * 1.8, 0.8 + R() * 1.1, 0, PI, TAU); c.fill(); }
  }
  function web(c, x, y, r, dx, dy) {
    c.strokeStyle = "rgba(230,224,216,.42)"; c.lineWidth = 0.28;
    const n = 5; for (let i = 0; i <= n; i++) { const a = i / n * PI / 2; c.beginPath(); c.moveTo(x, y); c.lineTo(x + dx * Math.cos(a) * r, y + dy * Math.sin(a) * r); c.stroke(); }
    for (let k = 1; k <= 4; k++) { const rr2 = r * k / 4.4; c.beginPath(); for (let i = 0; i <= n; i++) { const a = i / n * PI / 2, sag = i % 2 ? 0.86 : 1; const px = x + dx * Math.cos(a) * rr2 * sag, py = y + dy * Math.sin(a) * rr2 * sag; if (i) c.lineTo(px, py); else c.moveTo(px, py); } c.stroke(); }
  }
  function rose(c, x, y, r) { c.fillStyle = "#6a0e18"; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); c.strokeStyle = "#a82a30"; c.lineWidth = 0.35; c.beginPath(); c.arc(x, y, r * 0.6, 0.4, 5.6); c.stroke(); c.beginPath(); c.arc(x + 0.2, y - 0.1, r * 0.3, 1, 6); c.stroke(); }
  function thorns(c, pts, R) {
    vine(c, pts, R, { stem: "#3a2420", lw: 0.7, leaf: (x, y, R2) => { c.strokeStyle = "#2a1a16"; c.lineWidth = 0.4; const a = R2() * TAU; c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.cos(a) * 1.4, y + Math.sin(a) * 1.4); c.stroke(); if (R2() < 0.25) rose(c, x, y, 1.2); else if (R2() < 0.5) ivyLeaf(c, x, y, 0.9, R2() * 6, "#3e3a22"); } });
  }
  /* statischer Bewuchs (in das Bild gemalt) + bewegliche Ranken (live) */
  function growStatic(c, s, w, h, R) {
    const g = s.grow, top = STYLE[s.style].top || 0;
    if (g === "efeu") {
      const side = R() < 0.5 ? 0 : w;
      vine(c, [[side + (side ? 1 : -1), h + 2], [side + (side ? -1 : 1) * 1.5, h * 0.55], [side + (side ? -3 : 3), top + 1], [side + (side ? -1 : 1) * (8 + R() * 10), top - 0.5], [side + (side ? -1 : 1) * (16 + R() * 14), top + 0.6]], R);
      moss(c, 3, w - 3, top + 0.2, R);
      if (R() < 0.7) vine(c, [[w - side + (side ? 2 : -2), top + 1], [w - side + (side ? 3 : -3), top + 6]], R);
    } else if (g === "moos") {
      moss(c, 1, w - 1, 0.3, R); moss(c, 2, w * 0.4, h - 0.2, R);
      for (let i = 0; i < 3; i++) { const x = 3 + R() * (w - 6); c.fillStyle = "#c8a878"; c.fillRect(x - 0.25, -1.4, 0.5, 1.4); c.fillStyle = "#8a3a2a"; c.beginPath(); c.ellipse(x, -1.5, 1.1, 0.6, 0, PI, TAU); c.fill(); }
    } else if (g === "dornen") {
      thorns(c, [[-2, h + 1], [1, h * 0.5], [4, -0.5], [w * 0.35, 0.6]], R);
      thorns(c, [[w + 2, h * 0.7], [w - 1, h * 0.25], [w - 8, -0.6]], R);
    } else if (g === "netz") {
      web(c, 0.6, 0.6, Math.min(16, h * 0.9), 1, 1); web(c, w - 0.6, 0.6, Math.min(12, h * 0.7), -1, 1);
      c.fillStyle = "#1a1014"; c.beginPath(); c.ellipse(w - 6, 6, 0.9, 1.1, 0, 0, TAU); c.fill();
    } else if (g === "algen") {
      for (let x = 2; x < w - 2; x += 2 + R() * 3) { const len = 1 + R() * 3; c.fillStyle = ["#3a3a20", "#2e3018", "#4a4426"][(R() * 3) | 0]; c.beginPath(); c.ellipse(x, h - 0.3, 0.9, len, 0, 0, PI); c.fill(); }
      moss(c, 2, w - 2, 0.2, R, "#3a3a20");
    } else if (g === "glut") {
      /* Rußfahne nach oben */
      const gr = c.createLinearGradient(0, -6, 0, 4); gr.addColorStop(0, "rgba(20,14,14,0)"); gr.addColorStop(1, "rgba(20,14,14,.5)"); c.fillStyle = gr; c.fillRect(2, -6, w - 4, 10);
    } else if (g === "kette") {
      /* Fußfessel an einer Ecke */
      c.strokeStyle = "#5a5254"; c.lineWidth = 0.8; c.beginPath(); c.arc(w - 4, h + 3.4, 2.2, 0, TAU); c.stroke();
    }
  }
  function makeTendrils(s, w, h, R) {
    const out = [], g = s.grow, top = STYLE[s.style].top || 0;
    const add = (x, y, len, kind) => out.push({ x, y, len, kind, ph: R() * 9, sp: 0.8 + R() * 0.6 });
    if (g === "efeu") { add(3 + R() * 6, h - 0.5, 6 + R() * 6, "efeu"); add(w * (0.55 + R() * 0.35), h - 0.5, 4 + R() * 7, "efeu"); if (R() < 0.6) add(w * (0.2 + R() * 0.3), top + 0.5, 3 + R() * 3, "efeu"); }
    else if (g === "moos" && s.mount === "pfosten") add(w * (0.2 + R() * 0.6), h, 3 + R() * 3, "moosfaden");
    else if (g === "dornen") add(w * (0.3 + R() * 0.5), h - 0.5, 5 + R() * 5, "dornen");
    else if (g === "netz") { add(w * (0.3 + R() * 0.4), h, 6 + R() * 8, "faden"); }
    else if (g === "algen") { for (let i = 0; i < 3; i++) add(4 + R() * (w - 8), h, 4 + R() * 7, "algen"); }
    else if (g === "kette") add(w - 4, -1, 9 + R() * 4, "kette");
    return out;
  }
  function drawTendril(c, d, bx, by, t, n, still) {
    const x = bx + d.x, y = by + d.y, amp = still ? 0 : (0.9 + n * 0.8), sw = Math.sin(t * d.sp + d.ph) * amp, sw2 = Math.sin(t * d.sp * 1.7 + d.ph * 2) * amp * 0.5;
    const ex = x + sw, ey = y + d.len, mx = x + sw2 * 0.6, my = y + d.len * 0.55;
    if (d.kind === "kette") {
      const up = y - d.len; /* hängt von oben an einer Öse */
      c.strokeStyle = "#5a5254"; c.lineWidth = 0.7;
      for (let i = 0; i < 6; i++) { const u = i / 6, cx = x + sw * 0.3 * Math.sin(u * PI), cy = up + d.len * u; c.beginPath(); c.ellipse(cx, cy + 1, i % 2 ? 0.5 : 0.9, 1.1, 0, 0, TAU); c.stroke(); }
      return;
    }
    if (d.kind === "faden") { c.strokeStyle = "rgba(230,224,216,.5)"; c.lineWidth = 0.25; c.beginPath(); c.moveTo(x, y); c.lineTo(ex, ey); c.stroke(); c.fillStyle = "#1a1014"; c.beginPath(); c.ellipse(ex, ey + 0.8, 0.9, 1.1, 0, 0, TAU); c.fill(); c.strokeStyle = "#1a1014"; c.lineWidth = 0.25; for (const sd of [-1, 1]) for (let i = 0; i < 3; i++) { c.beginPath(); c.moveTo(ex, ey + 0.8); c.lineTo(ex + sd * 1.8, ey + i * 0.7); c.stroke(); } return; }
    const col = d.kind === "algen" ? "#3a3a20" : d.kind === "dornen" ? "#3a2420" : d.kind === "moosfaden" ? "#4a5a2a" : "#3a3a1c";
    c.strokeStyle = col; c.lineWidth = d.kind === "algen" ? 0.9 : 0.5; c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(mx, my, ex, ey); c.stroke();
    if (d.kind === "efeu") for (let u = 0.3; u <= 1; u += 0.33) { const px = x + (ex - x) * u + (mx - (x + ex) / 2) * 2 * u * (1 - u), py = y + d.len * u; ivyLeaf(c, px, py + 0.6, 1.1, PI + Math.sin(u * 7 + d.ph) * 0.9 + sw * 0.1, IVY[((u * 9) | 0) % IVY.length]); }
    else if (d.kind === "dornen") { rose(c, ex, ey, 1.1); }
    else if (d.kind === "algen") { c.fillStyle = "rgba(200,190,150,.35)"; c.beginPath(); c.arc(ex, ey + 0.6, 0.5, 0, TAU); c.fill(); }
  }

  /* ======================= HALTERUNG ======================= */
  function mountBehind(c, s, w, h, R) {
    const post = s.gy - s.by;
    if (s.mount === "pfosten") {
      if (s.style === "stein") {
        /* Sockel unter der Stele, halb im Gras */
        const pw = Math.min(w * 0.8, w - 6), x0 = (w - pw) / 2;
        const g = c.createLinearGradient(0, h, 0, h + post); g.addColorStop(0, "#4a4244"); g.addColorStop(1, "#2a2426");
        c.fillStyle = g; c.fillRect(x0, h - 1, pw, post + 1);
        c.fillStyle = "#5e5658"; c.fillRect(x0 - 2, h + post - 3, pw + 4, 3);
        c.strokeStyle = "#1e1a1c"; c.lineWidth = 0.6; c.strokeRect(x0, h - 1, pw, post + 1);
        c.save(); c.beginPath(); c.rect(x0, h, pw, post); c.clip(); stoneTex(c, w, h + post, R, "", "#1e1a1c", "#6a6264"); c.restore();
      } else {
        const xs = w > 60 ? [w * 0.2, w * 0.8] : [w / 2];
        for (const x of xs) {
          const g = c.createLinearGradient(x - 1.6, 0, x + 1.6, 0); g.addColorStop(0, "#3a2414"); g.addColorStop(0.5, "#5a3a22"); g.addColorStop(1, "#2a180c");
          c.fillStyle = g; c.fillRect(x - 1.6, -2, 3.2, h + post + 2);
          c.fillStyle = "rgba(20,10,4,.5)"; for (let y = h; y < h + post; y += 3) c.fillRect(x - 1.2, y + R() * 2, 0.4, 1.5);
          c.beginPath(); c.moveTo(x - 1.6, -2); c.lineTo(x, -3.6); c.lineTo(x + 1.6, -2); c.fillStyle = "#4a3020"; c.fill();
        }
      }
    } else if (s.mount === "gestell") {
      for (const x of [w * 0.14, w * 0.86]) { c.fillStyle = "#4a3020"; c.fillRect(x - 1.2, h - 1, 2.4, post + 1); }
    } else if (s.mount === "wand") {
      /* Schatten auf der Wand */
      c.save(); c.globalAlpha = 0.35; c.fillStyle = "#000"; c.filter && (c.filter = "none"); rr(c, 1.5, 2.5, w, h, 2); c.fill(); c.restore();
      if (s.grow === "kette" || s.style === "fass") { c.strokeStyle = "#3a3234"; c.lineWidth = 0.5; c.beginPath(); c.moveTo(w * 0.3, 1); c.lineTo(w / 2, -5); c.lineTo(w * 0.7, 1); c.stroke(); nail(c, w / 2, -5); }
    }
  }
  function mountFront(c, s, w, h, R) {
    const post = s.gy - s.by;
    if (s.mount === "pfosten" && s.style !== "stein") {
      const xs = w > 60 ? [w * 0.2, w * 0.8] : [w / 2];
      /* Seilwicklungen an den Pfosten */
      for (const x of xs) {
        for (const y of [-0.6, h + 1.4]) { c.strokeStyle = "#b89a68"; c.lineWidth = 0.7; for (let i = -1; i <= 1; i++) { c.beginPath(); c.moveTo(x - 2.1, y + i * 1.1 - 0.6); c.lineTo(x + 2.1, y + i * 1.1 + 0.6); c.stroke(); } c.strokeStyle = "rgba(60,40,20,.6)"; c.lineWidth = 0.3; c.beginPath(); c.moveTo(x - 2.1, y + 1.8); c.lineTo(x + 2.1, y + 2.9); c.stroke(); }
      }
    }
    /* Gras an der Basis */
    if (s.mount === "pfosten" || s.mount === "gestell") {
      const y = h + post;
      for (let x = -4; x < w + 4; x += 1.2) { if (R() < 0.45) continue; const hh = 1.5 + R() * 3; c.strokeStyle = ["#4a5a2a", "#5e6a30", "#6a5a30"][(R() * 3) | 0]; c.lineWidth = 0.45; c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + (R() - 0.5) * 2, y - hh * 0.6, x + (R() - 0.5) * 2.4, y - hh); c.stroke(); }
    }
  }

  /* ======================= SCHILD-BILD BAUEN ======================= */
  let kScale = 2, gsig = "", buildBudget = 0;
  const hasFilter = "filter" in scratch;
  function build(s) {
    const dev = devNow(), lay = layout(s, dev), st = STYLE[s.style], R = Z.Rng ? Z.Rng(s.seed >>> 0) : Math.random;
    const w = lay.w, h = lay.h, post = Math.max(0, s.gy - s.by);
    s.w = w; s.h = h;
    const mL = 22, mR = 22, mT = 12, mB = post + 6 + (s.grow === "algen" || s.grow === "efeu" || s.grow === "netz" ? 0 : 0);
    const W = w + mL + mR, H = h + mT + mB, k = kScale;
    const cv = document.createElement("canvas"); cv.width = Math.ceil(W * k); cv.height = Math.ceil(H * k);
    const c = cv.getContext("2d"); c.scale(k, k); c.translate(mL, mT);
    mountBehind(c, s, w, h, R);
    st.board(c, w, h, R, s);
    /* Schrift */
    const ink = st.ink, light = st.light;
    let y = lay.py;
    const cxText = w / 2;
    const tone = s.tone && TONE[s.tone] ? TONE[s.tone][light ? 1 : 0] : st.title;
    if (lay.ct.title) {
      c.font = F_TTL; c.textBaseline = "middle"; c.textAlign = "left";
      const tw = c.measureText(lay.ct.title).width, iw = lay.ct.icon ? 11 : 0, x0 = cxText - (tw + iw) / 2, ty = y + TTLH / 2 - 0.4;
      if (lay.ct.icon) icon(c, lay.ct.icon, x0 + 4, ty, st);
      c.fillStyle = st.sh; c.fillText(lay.ct.title, x0 + iw + 0.35, ty + 0.5);
      if (st.chalk) { c.globalAlpha = 0.92; }
      c.fillStyle = tone; c.fillText(lay.ct.title, x0 + iw, ty); c.globalAlpha = 1;
      /* Zierstrich unter dem Titel */
      c.strokeStyle = light ? "rgba(90,40,20,.35)" : "rgba(255,214,150,.28)"; c.lineWidth = 0.4; c.beginPath(); c.moveTo(cxText - Math.min(tw / 2 + 6, w / 2 - 4), y + TTLH - 0.6); c.lineTo(cxText + Math.min(tw / 2 + 6, w / 2 - 4), y + TTLH - 0.6); c.stroke();
      y += TTLH;
    }
    for (const line of lay.lines) {
      const rh = line.sm ? ROWSM : ROWH;
      let x = cxText - line.w / 2; const cy = y + rh / 2 - 0.2;
      for (const a of line.atoms) {
        const parts = a.t === "grp" ? a.parts : [a];
        for (const p of parts) {
          if (p.t === "txt") { c.font = p.sm ? F_SM : F_TXT; c.textBaseline = "middle"; c.textAlign = "left"; c.fillStyle = st.sh; c.fillText(p.s, x + 0.3, cy + 0.45); c.fillStyle = ink; if (st.chalk) c.globalAlpha = 0.9; c.fillText(p.s, x, cy); c.globalAlpha = 1; x += atomW(p); }
          else if (p.t === "ico") { icon(c, p.i, x + 4.6, cy, st); x += 11; }
          else if (p.t === "plus") { c.font = "800 6px " + FB; c.textAlign = "center"; c.textBaseline = "middle"; c.fillStyle = st.sh; c.fillText("+", x + 2.5 + 0.3, cy + 0.4); c.fillStyle = ink; c.fillText("+", x + 2.5, cy); x += 5; }
          else { x += (p.gap || 0); drawKey(c, p.k, x + 0.6, cy); x += atomW(p) - (p.gap || 0); }
        }
      }
      y += rh;
    }
    /* Kreide: körnig */
    if (st.chalk) { c.save(); c.globalCompositeOperation = "destination-out"; for (let i = 0; i < w * h / 6; i++) { c.fillStyle = "rgba(0,0,0,.25)"; c.fillRect(lay.px + R() * (w - 2 * lay.px), lay.py + R() * (h - 2 * lay.py), 0.4, 0.4); } c.restore(); }
    growStatic(c, s, w, h, R);
    mountFront(c, s, w, h, R);
    if (s.lantern) drawLanternBody(c, s.lantern === 1 ? w + 3 : -3, 2);
    s.tend = makeTendrils(s, w, h, R);
    /* gedämpfte Fassung: dunkler, leicht weich */
    const dim = document.createElement("canvas"); dim.width = cv.width; dim.height = cv.height;
    const d = dim.getContext("2d");
    if (hasFilter && !lo()) { d.filter = "blur(" + (0.45 * k).toFixed(2) + "px) brightness(0.74) saturate(0.78)"; d.drawImage(cv, 0, 0); d.filter = "none"; }
    else { d.drawImage(cv, 0, 0); d.globalCompositeOperation = "source-atop"; d.fillStyle = "rgba(18,10,16,.36)"; d.fillRect(0, 0, dim.width, dim.height); }
    s.spr = { hell: cv, dim, ox: -mL, oy: -mT, W, H };
    s.sig = sigOf(s);
  }
  function drawLanternBody(c, x, y) {
    c.strokeStyle = "#2a1a10"; c.lineWidth = 0.7; c.beginPath(); c.moveTo(x - (x > 0 ? 3 : -3), y); c.lineTo(x, y); c.lineTo(x, y + 2); c.stroke();
    c.fillStyle = "#2a2024"; c.fillRect(x - 2.2, y + 2, 4.4, 1); c.fillRect(x - 2.4, y + 8.6, 4.8, 1.2);
    c.fillStyle = "rgba(255,200,120,.35)"; c.fillRect(x - 1.9, y + 3, 3.8, 5.6);
    c.strokeStyle = "#2a2024"; c.lineWidth = 0.5; c.strokeRect(x - 1.9, y + 3, 3.8, 5.6); c.beginPath(); c.moveTo(x, y + 3); c.lineTo(x, y + 8.6); c.stroke();
  }
  const sigOf = s => gsig + "|" + (s.dyn ? s.dyn() : "");

  /* ======================= INHALTE ======================= */
  const K = k => ({ k }), MV = { mv: 1 }, sm = r => { r.sm = true; return r; };
  const TX = {
    lauf: () => ({ title: L(["Erste Schritte", "First steps"]), icon: "schritt", rows: [[MV, L([" laufen   ", " move   "]), K("jump"), L([" springen", " jump"])], [K("roll"), L([" Rolle: unverwundbar", " roll: invulnerable"])]] }),
    doppel: () => ({ title: L(["Hoch hinaus", "Up high"]), icon: "schritt", rows: [[K("jump"), L([" in der Luft noch einmal: ", " again in mid-air: "]), L(["Doppelsprung", "double jump"])]] }),
    steg: () => ({ title: L(["Steg", "Ledge"]), rows: [[K(["down", "jump"]), L([" durchfallen", " drop through"])]] }),
    stegHub: () => ({ title: L(["Holzsteg", "Wooden ledge"]), rows: [[K("jump"), K("jump"), L([" Doppelsprung hinauf", " double jump up"])], [K(["down", "jump"]), L([" durchfallen", " drop through"])]] }),
    leiter: () => ({ title: L(["Leiter", "Ladder"]), rows: [[K("up"), L([" hinauf   ", " climb   "]), K("down"), L([" hinab", " down"])]] }),
    sturz: () => ({ title: L(["Sturzangriff", "Plunge attack"]), icon: "waffen", rows: [[L(["In der Luft ", "In mid-air "]), K(["down", "a1"]), L([" – trifft hart beim Aufprall", " – hits hard on landing"])]] }),
    aufwaerts: () => ({ title: L(["Aufwärtsangriff", "Upward attack"]), icon: "waffen", rows: [[K(["up", "a1"]), L([" – mit jeder Waffe nach oben", " – any weapon, aimed up"])], [L(["in der Luft: einmal je Sprung Schwung nach oben", "in mid-air: one rising swing per jump"])]] }),
    vorrat: () => ({ title: L(["Vor dem Tor", "Before the gate"]), icon: "trank", rows: [[K("potion"), L([" Heiltrank   ", " potion   "]), K("map"), L([" Karte   ", " map   "]), K("use"), L([" Türen & Truhen", " doors & chests"])]].concat(devNow() === "touch" ? [] : [[K("gear"), L([" halten: Ausrüstung ansehen", " hold: view gear"])]]) }),
    staender: () => { const P = Z.player, full = !!(P && P.slots && P.slots.a1 && P.slots.a2); return { title: L(["Waffenständer", "Weapon rack"]), icon: "waffen", rows: full ? [[K("a1"), L([" Hand 1   ", " hand 1   "]), K("a2"), L([" Hand 2", " hand 2"])], [L(["Hände voll? ", "Hands full? "]), K("use"), L([", dann ", ", then "]), K("a1"), "/", K("a2"), L([" tauscht", " swaps"])]] : [[K("use"), L([" aufheben", " pick up"])], [K("a1"), L([" Hand 1   ", " hand 1   "]), K("a2"), L([" Hand 2", " hand 2"])]] }; },
    puppe: () => ({ title: L(["Übungspuppe", "Training dummy"]), icon: "puppe", rows: [[K("a1"), K("a2"), L([" Waffen   ", " weapons   "]), K("s1"), K("s2"), L([" Fähigkeiten", " skills"])], [L(["Schild heben, kurz vor dem Treffer: ", "Raise a shield just before the hit: "]), L(["Parade", "parry"])]] }),
    parade: () => ({ title: L(["Parade", "Parry"]), icon: "schild", rows: [[L(["Schild heben, kurz vor dem Treffer", "Raise a shield just before the hit"])], [L(["Rotes ‼ nie blocken: ", "Red ‼ can't be blocked: "]), K("roll")]] })
  };
  /* knappe Fassungen ohne Titel für enge Burggänge (Torhof) */
  const IC = i => ({ ico: i });
  const TXK = {
    lauf: () => ({ rows: [[IC("schritt"), MV, L([" laufen", " move"])], [K("jump"), L([" springen", " jump"])]] }),
    rolle: () => ({ rows: [[K("roll"), L([" Rolle", " roll"])], [L(["kurz unverwundbar", "briefly invulnerable"])]] }),
    vorrat: () => ({ rows: [[K("potion"), L([" Heiltrank", " potion"])], [K("map"), L([" Karte", " map"])]].concat(devNow() === "touch" ? [] : [[K("gear"), L([" Ausrüstung", " gear"])]]) }),
    leiter: () => ({ rows: [[K("up"), L([" hinauf  ", " climb  "]), K("down"), L([" hinab", " down"])]] }),
    steg: () => ({ rows: [[K(["down", "jump"]), L([" durchfallen", " drop through"])]] }),
    doppel: () => ({ rows: [[K("jump"), K("jump"), L([" Doppelsprung", " double jump"])]] }),
    sturz: () => ({ rows: [[L(["in der Luft ", "in mid-air "]), K(["down", "a1"]), L([" Sturzangriff", " plunge"])]] }),
    aufwaerts: () => ({ rows: [[K(["up", "a1"]), L([" nach oben schlagen", " strike upward"])], [L(["auch Fliegendes", "hits flyers too"])]] })
  };
  const RUNE_HOW = {
    kralle: () => [L(["an die Wand drücken, ", "press into a wall, "]), K("jump"), L([" abstoßen", " kick off"])],
    schatten: () => [K("roll"), L([" Schattensprint – flach durch Spalten", " shadow sprint – flat through slits"])],
    schwingen: () => [L(["dritter Sprung, ", "third jump, "]), K("jump"), L([" halten: gleiten", " hold: glide"])],
    erde: () => [L(["in der Luft ", "in mid-air "]), K(["down", "a1"]), L([" Bodenstampfer", " ground pound"])],
    kette: () => [L(["in der Luft ", "in mid-air "]), K("jump"), L([" oder ", " or "]), K("use"), L([" zur Öse", " to the ring"])],
    nebel: () => [K("roll"), L([" als Nebel durch das Gitter", " as mist through the grate"])]
  };
  const GATE_T = { kralle: ["Kratzspuren im Schacht", "Claw marks in the shaft"], kette: ["Ösen unter der Decke", "Rings under the ceiling"], schwingen: ["Warmer Aufwind", "Warm updraft"], erde: ["Rissiger, hohler Boden", "Cracked, hollow floor"], nebel: ["Nebelgitter", "Mist grate"], schatten: ["Ein schmaler Spalt", "A narrow slit"] };

  /* ======================= PLATZSUCHE ======================= */
  const S = { lv: null, list: [], obst: [], t: 0 };
  const tileAt = (lv, x, y) => lv.get(x, y);
  function rectAir(lv, x0, y0, x1, y1) {
    for (let ty = Math.floor(y0 / T); ty <= Math.floor((y1 - 0.01) / T); ty++) for (let tx = Math.floor(x0 / T); tx <= Math.floor((x1 - 0.01) / T); tx++) { const v = tileAt(lv, tx, ty); if (v !== 0) return false; }
    return true;
  }
  const solidFloor = v => v === 1 || v === 2 || v === 8 || v === 12 || v === 10;
  /* weich = Figuren und Bedienstellen: dahinter darf ein Pfosten hochgehen, aber keine Tafel hängen */
  function addObst(x0, y0, x1, y1, soft) { if ([x0, y0, x1, y1].every(Number.isFinite)) { const o = [Math.min(x0, x1), Math.min(y0, y1), Math.max(x0, x1), Math.max(y0, y1)]; o.soft = !!soft; S.obst.push(o); } }
  function gatherObstacles(lv) {
    S.obst = [];
    const P = (x, y, r, hh) => addObst(x - r, y - (hh || r * 2), x + r, y + 2);
    for (const d of lv.doors || []) addObst(d.x * T - 26, (d.y - 3) * T, d.x * T + 42, (d.y + 1) * T);
    /* Requisiten mit ihrer gemalten Ausdehnung (Anker: Kachelmitte unten, wie in bild.js drawDecor) */
    const DEC = { torch: [6, 34, 6], banner: [9, 35, 1], window: [11, 36, 0], chain: [5, 70, 0], web: [26, 42, -6], candle: [4, 12, 0], candelabra: [7, 20, 0], chandelier: [12, 40, -10], lantern: [6, 28, 0], statue: [8, 34, 0], shelf: [11, 30, 0], tent: [44, 44, 0], cart: [26, 22, 0], hay: [16, 18, 0], weapons: [18, 24, 0], barrel: [8, 18, 0], crate: [8, 16, 0], pot: [6, 10, 0], sack: [7, 10, 0], bones: [8, 6, 0], brazier: [8, 14, 0], greenfire: [6, 14, 0] };
    for (const d of lv.decor || []) { const px = d.x * T + 8, py = d.y * T + 16, q = DEC[d.kind] || [10, 24, 0]; addObst(px - q[0], py - q[1], px + q[0], py - q[2] + 2); }
    for (const d of lv.lights || []) addObst(d.x * T, d.y * T - 14, d.x * T + 16, d.y * T + 16, true);
    for (const o of Z.interacts || []) if (o && Number.isFinite(o.x)) addObst(o.x - (o.r || 20), o.y - (o.h || 34), o.x + (o.r || 20), o.y + 2, true);
    for (const a of Z.anvils || []) P(a.x, a.y, 26, 34);
    for (const p of lv.props || []) addObst(p.x * T + 8 - 22, (p.y + 1) * T - 40, p.x * T + 8 + 22, (p.y + 1) * T, p.kind === "npc" || p.kind === "station");
    /* Raumausstattung (ausstattung.js): Möbel, Wandschmuck, Hängendes */
    try { for (const p of (Z.ausstattung ? Z.ausstattung() : [])) { if (!p || p.gone) continue; const x = p.x * T + 8, hw = (p.w || 1) * 8 + 8; if (p.L === 2 || p.L === 4) addObst(x - hw, p.y * T, x + hw, p.y * T + 52); else addObst(x - hw, (p.y + 1) * T - 40, x + hw, (p.y + 1) * T + 2); } } catch (_) {}
    for (const l of lv.loot || []) P(l.x * T + 8, (l.y + 1) * T, 14, 24);
    for (const tr of Z.fallen || []) { const x = tr.x != null ? tr.x : tr.tx * T + 8, y = tr.y != null ? tr.y : tr.fy; addObst((tr.x0 != null ? tr.x0 : x - 28), (tr.ay != null ? tr.ay : y - 44), (tr.x1 != null ? tr.x1 : x + 28), y + 2); }
    for (const tr of Z.traps || []) { const x = tr.x != null ? tr.x : tr.ax != null ? tr.ax : ((tr.x0 || 0) + (tr.x1 || 0)) / 2, y = tr.y != null ? tr.y : tr.fy != null ? tr.fy : tr.ay; if (Number.isFinite(x) && Number.isFinite(y)) addObst((tr.x0 != null ? tr.x0 : x - 24), (tr.ay != null ? tr.ay : y - 40), (tr.x1 != null ? tr.x1 : x + 24), y + 4); }
    for (const ev of Z.abEvents || []) if (Number.isFinite(ev.x)) P(ev.x, ev.y, 28, 40);
    for (const p of Z.pickups || []) if (!p.rack && Number.isFinite(p.x)) P(p.x, p.y, 10, 20);
    try { const tb = Z.tagebuch; if (tb) { for (const s of tb.signs()) addObst(s.x * T - 30, (s.y - 1) * T, s.x * T + 46, (s.y + 1) * T); for (const s of tb.scouts()) P(s.x * T + 8, (s.y + 1) * T, 20, 30); const pg = tb.page(); if (pg) P(pg.x * T + 8, (pg.y + 1) * T, 14, 28); } } catch (_) {}
    try { for (const s of (Z.spuren ? Z.spuren() : [])) if (Number.isFinite(s.x)) { const px = s.x > lv.W ? s.x : s.x * T + 8, py = s.y > lv.H ? s.y : (s.y + 1) * T; P(px, py, 18, 30); } } catch (_) {}
    const E = Z.erkundung && Z.erkundung();
    if (E && E.lv === lv) {
      for (const r of E.rewards) P(r.x, r.y, 14, 26);
      for (const k of E.keys) P(k.x, k.y, 12, 30);
      for (const o of E.locks) addObst(o.x - 26, o.y - 56, o.x + 26, o.y + 2);
      for (const o of E.levers) P(o.x, o.y, 14, 30);
      for (const o of E.shrines) P(o.x, o.y, 20, 40);
      if (E.trial) P(E.trial.x, E.trial.y, 22, 40);
      for (const g of lv.gates || []) if (g.x != null) addObst(g.x * T - 8, (g.y0 || g.y || 0) * T - 8, g.x * T + 24, ((g.y1 != null ? g.y1 : (g.y0 || 0) + 3) + 1) * T);
    }
    try { const rg = Z.runen && Z.runen.gates ? Z.runen.gates() : []; for (const g of rg) if (g.tiles) for (const [x, y] of g.tiles) addObst(x * T - 2, y * T - 2, x * T + 18, y * T + 18); } catch (_) {}
    if (lv.rack) addObst(lv.rack.x0 - 18, lv.rack.y - 36, lv.rack.x1 + 24, lv.rack.y + 2);
    if (lv.lcore) {
      /* Gedenkstein steht immer; Steckbrief-Brett und Wegweiser bringen ihre Interaktion mit; der Trophäenbalken nur mit Siegen */
      const lc = lv.lcore, bs = (Z.meta && Z.meta.bosses) || {}, won = Object.keys(bs).some(k => bs[k] && bs[k].won > 0);
      addObst(lc.stone * T - 16, 11 * T - 34, lc.stone * T + 32, 12 * T);
      if (lc.beam && won) { addObst(lc.beam[0] * T - 2, 12 * T - 112, lc.beam[1] * T + 2, 12 * T - 80); addObst(lc.beam[0] * T - 2, 0, lc.beam[0] * T + 8, 12 * T); addObst(lc.beam[1] * T - 8, 0, lc.beam[1] * T + 2, 12 * T); }
    }
    for (const p of lv.plots || []) addObst(p.x0 * T, (p.gy + 1) * T - 90, (p.x0 + p.w) * T, (p.gy + 1) * T);
    if (lv.terrace && lv.terrace.ladders) for (const lx of lv.terrace.ladders) addObst(lx * T - 6, lv.terrace.y * T - 12, lx * T + 22, 12 * T);
  }
  const hit = (a, b) => a[0] < b[2] && a[2] > b[0] && a[1] < b[3] && a[3] > b[1];
  function signRect(x, by, gy, w, h, mount) { return [x - w / 2 - 6, by - h - (mount === "wand" ? 4 : 6), x + w / 2 + 6, mount === "wand" ? by + 3 : gy]; }
  /* Tafel und Pfosten getrennt prüfen: Pfosten dürfen hinter Figuren hochgehen, die Tafel nicht */
  function parts(x, by, gy, w, h, mount, stele) {
    const out = [[x - w / 2 - 3, by - h - 4, x + w / 2 + 3, by + 2]];
    if (mount === "pfosten") { if (stele) out.push([x - w * 0.4, by, x + w * 0.4, gy]); else for (const px of w > 60 ? [x - w * 0.3, x + w * 0.3] : [x]) out.push([px - 3, by, px + 3, gy]); }
    return out;
  }
  let why = null;
  function fits(lv, x, by, gy, w, h, mount, opt) {
    const r = signRect(x, by, gy, w, h, mount), stele = STYLE_OF(lv)[0] === "stein" && !lv.hub;
    if (why) why.push([Math.round(x / T * 10) / 10, by, w, h]);
    if (r[0] < T || r[2] > (lv.W - 1) * T || r[1] < T) { if (why) why[why.length - 1].splice(2, 0, "rand"); return false; }
    /* Tafel selbst vor freier Luft (Wand/Himmel dahinter), keine Fenster, Türen, Figuren, Fallen */
    if (!rectAir(lv, x - w / 2 - 1, by - h - 2, x + w / 2 + 1, by)) { if (why) why[why.length - 1].splice(2, 0, "air"); return false; }
    if (mount === "pfosten") {
      const xs = stele ? [x - w * 0.35, x, x + w * 0.35] : w > 60 ? [x - w * 0.3, x + w * 0.3] : [x];
      for (const px of xs) { const tx = Math.floor(px / T), ty = Math.floor((gy + 1) / T); if (!solidFloor(tileAt(lv, tx, ty))) { if (why) why[why.length - 1].splice(2, 0, "boden"); return false; } if (!rectAir(lv, px - 1.6, by, px + 1.6, gy)) { if (why) why[why.length - 1].splice(2, 0, "pfosten"); return false; } }
    }
    const pr = parts(x, by, gy, w, h, mount, stele);
    for (const o of S.obst) for (let i = 0; i < pr.length; i++) if ((i === 0 || !o.soft) && hit(pr[i], o)) { if (why) why[why.length - 1].splice(2, 0, "obst", i, o.map(v => Math.round(v / T * 10) / 10)); return false; }
    for (const s of S.list) if (s.rect && hit(r, [s.rect[0] - 14, s.rect[1] - 8, s.rect[2] + 14, s.rect[3] + 8])) { if (why) why[why.length - 1].splice(2, 0, "sign", s.id); return false; }
    if (opt && opt.ok && !opt.ok(r)) { if (why) why[why.length - 1].splice(2, 0, "ok"); return false; }
    return true;
  }
  const STYLE_OF = lv => (lv.hub ? BIOME.lager : BIOME[lv.biome] || BIOME[(Z.BIOMES[lv.biome] || {}).base] || ["stein", "efeu"]);
  const outdoor = lv => !!(lv.hub || lv.out || (Z.BIOMES[lv.biome] || {}).out);
  /* Schild anlegen: nahe (ax, ay) auf einem Standplatz; dir bevorzugt eine Seite, rmin hält Abstand */
  function place(lv, def, ax, ay, o) {
    o = o || {};
    const [style, grow] = o.style || STYLE_OF(lv);
    const mount = o.mount || (outdoor(lv) ? "pfosten" : "wand");
    const s = Object.assign({ style, grow, mount, seed: ((ax * 73856093) ^ (ay * 19349663) ^ (S.list.length * 83492791)) >>> 0, n: 0, a: 0, vis: 0 }, def);
    /* Maße für alle Geräte schätzen und das größte nehmen */
    let w = 0, h = 0; for (const dv of ["keys", "pad", "touch"]) { const l = layout(s, dv); w = Math.max(w, l.w); h = Math.max(h, l.h); }
    const lifts = o.lift != null ? [o.lift] : mount === "wand" ? [26, 36, 18, 46] : style === "stein" ? [9, 16, 24] : lv.hub ? [17, 36, 56] : [17, 32, 46];
    const R = o.r || 9, dyM = o.dy != null ? o.dy : 3, cand = [];
    for (let dy = -dyM; dy <= dyM; dy++) for (let dx = -R; dx <= R; dx++) {
      const x = ax + dx, y = ay + dy;
      if (!Z.standable(lv, x, y, 2)) continue;
      if (o.rmin && Math.abs(dx) < o.rmin) continue;
      let cost = Math.abs(dx) + Math.abs(dy) * 2.5 + (o.dir && dx && Math.sign(dx) !== o.dir ? 6 : 0);
      if (o.floor && !o.floor(tileAt(lv, x, y + 1))) continue;
      cand.push([cost, x, y]);
    }
    cand.sort((a, b) => a[0] - b[0]);
    for (const lift of lifts) for (const [, x, y] of cand) for (const sh of [0, 0.5, -0.5]) {
      const px = (x + 0.5 + sh) * T, gy = (y + 1) * T, by = gy - lift;
      if (!fits(lv, px, by, gy, w, h, mount, o)) continue;
      s.x = px; s.gy = gy; s.by = by; s.wMax = w; s.hMax = h; s.rect = signRect(px, by, gy, w, h, mount);
      S.list.push(s); return s;
    }
    /* draußen kein Platz für einen Pfosten: dann als Tafel an die Mauer */
    if (!o.mount && mount === "pfosten" && !lv.hub) return place(lv, def, ax, ay, Object.assign({}, o, { mount: "wand", lift: undefined }));
    return null;
  }
  /* fester Platz (Waffenständer) */
  function placeAt(def, x, by, gy, o) { const s = Object.assign({ style: o.style[0], grow: o.style[1], mount: o.mount, seed: (x * 7919) >>> 0, n: 0, a: 0, vis: 0, x, by, gy }, def); let w = 0, h = 0; for (const dv of ["keys", "pad", "touch"]) { const l = layout(s, dv); w = Math.max(w, l.w); h = Math.max(h, l.h); } s.rect = signRect(x, by, gy, w, h, o.mount); S.list.push(s); return s; }

  /* ======================= AUFBAU JE GEBIET ======================= */
  const lernOK = ks => { const h0 = hl(); if (h0 >= 3) return false; if (h0 >= 2 && allKnown(ks)) return false; return true; };
  function setup(lv) {
    S.lv = lv; S.list = []; S.t = 0;
    if (!lv || lv.arena || lv.passage || !lv.get || !Z.standable) return;
    try { gatherObstacles(lv); } catch (e) { console.error(e); S.obst = []; }
    try { if (lv.hub) setupHub(lv); else { if (lv.biome === "torhof") setupTorhof(lv); setupOrte(lv); } } catch (e) { console.error(e); }
  }
  function lern(id, keys, content) { return { id, kind: "lern", learn: keys, content }; }
  function setupHub(lv) {
    const gy = 12, st = lv.start || { x: 60, y: 11 };
    /* Waffenständer: Kopfbrett auf dem Querbalken */
    if (lv.rack) { const x = (lv.rack.x0 + lv.rack.x1) / 2; placeAt({ id: "staender", kind: "lern", learn: ["aufheben", "h1", "h2"], content: TX.staender, dyn: () => { const P = Z.player; return P && P.slots && P.slots.a1 && P.slots.a2 ? "2" : "1"; } }, x, lv.rack.y - 33, lv.rack.y - 30, { style: BIOME.lager, mount: "gestell" }); }
    const y0 = gy - 1;
    /* Holzsteg im Kern: Schild darauf (Doppelsprung hinauf, Durchfallen hinab), „Erste Schritte“ links daneben */
    let px0 = -1, px1 = -1; for (let x = 0; x < lv.W; x++) if (tileAt(lv, x, 8) === 2 && !(lv.terrace && x >= lv.terrace.x0 && x <= lv.terrace.x1)) { if (px0 < 0) px0 = x; px1 = x; }
    if (px0 >= 0 && lernOK(["doppel", "steg"])) place(lv, lern("steg", ["doppel", "steg"], TX.stegHub), Math.round((px0 + px1) / 2), 7, { r: 3, dy: 0, floor: v => v === 2, lift: 13 });
    if (lernOK(["lauf", "sprung", "rolle"])) place(lv, lern("lauf", ["lauf", "sprung", "rolle"], TX.lauf), px0 >= 0 ? px0 - 5 : st.x - 4, y0, { dir: -1, r: 16, dy: 0 });
    const Y = (lv.props || []).find(p => p.id === "Y");
    if (Y) {
      if (lernOK(["h1", "h2", "faeh", "parade"])) place(lv, lern("puppe", ["h1", "h2", "faeh", "parade"], TX.puppe), Y.x - 3, y0, { dir: -1, r: 10, dy: 0 });
    }
    for (const s of S.list) if (s.id === "lauf") s.lantern = 1;
  }
  /* Torhof: Lernschilder an den ersten passenden Stellen vom Start aus */
  function setupTorhof(lv) {
    const st = lv.start; if (!st) return;
    const lern = (id, keys, content) => ({ id, kind: "lern", learn: keys, content, maxW: 92 });
    const dist = (x, y) => Math.abs(x - st.x) + Math.abs(y - st.y) * 1.6;
    const near = { r: 22, dy: 3 };
    if (lernOK(["lauf", "sprung"])) place(lv, lern("lauf", ["lauf", "sprung"], TXK.lauf), st.x + 2, st.y, Object.assign({ dir: 1 }, near));
    if (lernOK(["trank", "karte"])) place(lv, lern("vorrat", ["trank", "karte"], TXK.vorrat), st.x - 2, st.y, Object.assign({ dir: -1 }, near));
    if (lernOK(["rolle"])) place(lv, lern("rolle", ["rolle"], TXK.rolle), st.x + 10, st.y, Object.assign({ dir: 1 }, near));
    /* Merkmale sammeln (nur erreichbare Standplätze) */
    const lad = [], steg = [], step = [], edge = [], up = [];
    /* W7 Aufwärtsangriff: unter Flugstellen der Gegner bzw. unter einem Steg 4–7 Kacheln über dem Kopf */
    const flyAt = new Set((lv.spawns || []).filter(sp => sp.fly).map(sp => sp.x + "," + sp.y));
    const MAXD = 90;
    for (let y = 1; y < lv.H - 1; y++) for (let x = 1; x < lv.W - 1; x++) {
      if (!Z.standable(lv, x, y, 2)) continue;
      const d = dist(x, y); if (d > MAXD) continue;
      const below = tileAt(lv, x, y + 1);
      if (tileAt(lv, x + 1, y) === 4 || tileAt(lv, x - 1, y) === 4) if (tileAt(lv, x + 1, y - 2) === 4 || tileAt(lv, x - 1, y - 2) === 4) lad.push([d, x, y, tileAt(lv, x + 1, y) === 4 ? -1 : 1]);
      if (below === 2 && tileAt(lv, x - 1, y + 1) === 2 && tileAt(lv, x + 1, y + 1) === 2) steg.push([d, x, y]);
      if (d > 14 && tileAt(lv, x, y - 1) === 0 && tileAt(lv, x, y - 2) === 0) { let fly = false; for (let k = 2; k <= 6 && !fly; k++) for (let q = -2; q <= 2; q++) if (flyAt.has((x + q) + "," + (y - k))) { fly = true; break; } let plat = false; for (let k = 4; k <= 7; k++) if (tileAt(lv, x, y - k) === 2) plat = true; if (fly || plat) up.push([d - (fly ? 20 : 0), x, y, 0]); }
      for (const dd of [-1, 1]) {
        /* Wandstufe von 5–7 Kacheln: Doppelsprung */
        if (tileAt(lv, x + dd, y) === 1) for (let hh = 5; hh <= 7; hh++) { let ok = true; for (let k = 0; k < hh; k++) if (tileAt(lv, x + dd, y - k) !== 1) { ok = false; break; } if (ok && Z.standable(lv, x + dd, y - hh, 2)) { step.push([d, x, y, -dd]); break; } }
        /* Kante mit tiefem Fall: Sturzangriff */
        if (below !== 2 && tileAt(lv, x + dd, y) === 0 && tileAt(lv, x + dd, y + 1) === 0) { let dep = 0; for (let k = 1; k < 12; k++) { const v = tileAt(lv, x + dd, y + k); if (v === 0 || v === 4) dep++; else break; } if (dep >= 6 && solidFloor(tileAt(lv, x + dd, y + dep + 1))) edge.push([d, x, y, -dd]); }
      }
    }
    const by = a => a.sort((p, q) => p[0] - q[0]);
    const tryList = (arr, id, keys, content, opt) => { if (!lernOK(keys)) return; for (const [, x, y, dir] of by(arr).slice(0, 12)) if (place(lv, lern(id, keys, content), x + (dir || 0) * 2, y, Object.assign({ dir: dir || 0, r: 4, dy: 1 }, opt || {}))) return; };
    tryList(lad, "leiter", ["leiter"], TXK.leiter);
    tryList(up, "aufwaerts", ["aufwaerts"], TXK.aufwaerts, { r: 8, dy: 2 });
    tryList(steg, "steg", ["steg"], TXK.steg, { floor: v => v === 2, dy: 0, r: 3, lift: 13 });
    tryList(step, "doppel", ["doppel"], TXK.doppel);
    tryList(edge, "sturz", ["sturz"], TXK.sturz);
  }
  /* Ortsschilder in allen Gebieten */
  function setupOrte(lv) {
    const h0 = hl();
    const ort = (id, content, dyn, learnK) => ({ id, kind: "ort", content, dyn, learn: learnK || null });
    /* Runensperren */
    let gates = []; try { gates = Z.runen && Z.runen.gates ? Z.runen.gates() : []; } catch (_) {}
    for (const gt of gates) {
      if (!GATE_T[gt.kind] || gt.hx == null) continue;
      const k = gt.kind, d2 = (Z.MOVE_RUNES || {})[k] || { n: [k, k] };
      const content = () => {
        const owned = Z.hasMoveRune ? (Z.runeAll || Z.hasMoveRune(k)) : false, seen = Z.meta && Z.meta.runen && Z.meta.runen.gesehen && Z.meta.runen.gesehen[k];
        const rows = owned ? [sm([L(["Deine ", "Your "]) + L(d2.n) + L([" hilft hier:", " helps here:"])]), RUNE_HOW[k]()] : seen ? [sm([L(d2.n) + L([" nötig – im Lager dauerhaft freischalten.", " needed – unlock it for good at camp."])])] : [sm([L(["Eine Rune könnte hier weiterhelfen.", "A rune might help here."])])];
        return { title: L(GATE_T[k]), icon: "rune", rows };
      };
      const dyn = () => (Z.hasMoveRune && (Z.runeAll || Z.hasMoveRune(k)) ? "1" : "0") + (Z.meta && Z.meta.runen && Z.meta.runen.gesehen && Z.meta.runen.gesehen[k] ? "s" : "");
      const ax = Math.floor(gt.hx / T), ay = Math.floor(gt.hy / T) - 1;
      const s = place(lv, Object.assign(ort("rune:" + gt.cell, content, dyn), { tone: "rune", maxW: 108 }), ax, ay, { r: 12, dy: 5 });
      if (s) s.gate = gt;
    }
    /* Erkundung: Schloss, Prüfung, Hebel */
    const E = Z.erkundung && Z.erkundung();
    if (E && E.lv === lv) {
      for (const o of E.locks) {
        const side = o.f.side === "L" ? -1 : 1, ax = Math.floor((o.x + side * 18) / T), ay = Math.floor(o.y / T) - 1;
        const hasK = () => (Z.hasKey ? Z.hasKey() : false);
        const s = place(lv, Object.assign(ort("schloss", () => ({ title: L(["Verschlossene Kammer", "Locked chamber"]), icon: "schloss", rows: hasK() ? [[K("use"), L([" aufschließen – du hast einen Schlüssel", " unlock – you have a key"])]] : [sm([L(["Der Schlüssel liegt in einem anderen Zweig.", "The key lies in another branch."])])] }), () => (hasK() ? "k" : "-") + (o.open ? "o" : "")), { tone: "gold", done: () => o.open }), ax, ay, { dir: side, r: 10, dy: 3 });
        void s;
      }
      if (E.trial) {
        const o = E.trial;
        place(lv, Object.assign(ort("pruefung", () => ({ title: L(["Prüfung", "Trial"]), icon: "altar", rows: [[K("use"), L([" am Altar beginnen", " at the altar to begin"])], sm([L(["Die Ausgänge schließen sich. Besiege alle Wellen – dann gehört der Schatz dir.", "The exits seal. Defeat every wave – then the treasure is yours."])])] })), { tone: "gefahr", maxW: 112, done: () => o.state !== "idle" }), Math.floor(o.x / T), Math.floor(o.y / T) - 1, { r: 10, dy: 3, rmin: 2 });
      }
      for (const o of E.levers) {
        place(lv, Object.assign(ort("hebel", () => ({ title: L(["Hebel", "Lever"]), icon: "hebel", rows: [[K("use"), L([" ziehen – das Gitter öffnet eine Abkürzung", " pull – the grate opens a shortcut"])]] })), { done: () => o.pulled }), Math.floor(o.x / T), Math.floor(o.y / T) - 1, { r: 9, dy: 3, rmin: 2 });
      }
    }
    /* Glutamboss */
    for (const a of Z.anvils || []) {
      if (!Number.isFinite(a.x)) continue;
      place(lv, Object.assign(ort("amboss", () => ({ title: L(["Glutamboss", "Ember anvil"]), icon: "amboss", rows: [sm([L(["Schmiedeglut: Waffen bis +5", "Forge embers: weapons up to +5"])]), [K("use"), L([" schmieden", " forge"])]] })), { tone: "gold", maxW: 112, done: () => a.used >= a.charges }), Math.floor(a.x / T), Math.floor(a.y / T) - 1, { r: 11, dy: 3, rmin: 2 });
    }
    /* Erste Falle jeder noch unbekannten Art: Warnschild davor (auf der Seite des Eingangs) */
    let neu = []; try { neu = Z.fallenNeu ? Z.fallenNeu() : []; } catch (_) {}
    const st = lv.start || { x: 0, y: 0 }, seenKind = new Set();
    neu.sort((a, b) => (Math.abs(a.x / T - st.x) + Math.abs(a.y / T - st.y) * 1.6) - (Math.abs(b.x / T - st.x) + Math.abs(b.y / T - st.y) * 1.6));
    for (const f of neu) {
      if (seenKind.has(f.key)) continue;
      const tx = Math.floor(f.x / T), ty = Math.floor(f.y / T) - 1, dir = Math.sign(st.x - tx) || -1;
      const s = place(lv, Object.assign(ort("falle:" + f.key, () => ({ title: L(f.n), icon: "gefahr", rows: [sm([L(f.d)])] })), { tone: "gefahr", maxW: 104, trap: f }), tx + dir * 4, ty, { dir, r: 12, dy: 4, rmin: 0, ok: r => !(r[0] < f.x + 20 && r[2] > f.x - 20) });
      if (s) seenKind.add(f.key);
    }
    void h0;
  }

  /* ======================= SICHTBARKEIT ======================= */
  /* Ziel-Deckkraft: 0 = weg · klein = dezent · 1 = voll */
  function target(s) {
    const h0 = hl();
    if (s.kind === "lern") {
      if (h0 >= 3) return 0;
      const done = allKnown(s.learn);
      if (done) return h0 >= 2 ? 0 : 0.42;
      return 1;
    }
    const done = !!(s.done && s.done());
    if (h0 >= 3) return done ? 0 : 0.42;
    if (done) return h0 >= 2 ? 0.3 : 0.45;
    return 1;
  }

  /* ======================= LERNEN BEOBACHTEN ======================= */
  const prev = { g: true, aj: 1 };
  let runT = 0;
  function watch(P, dt) {
    if (!P || P.dead || (Z.ui && (Z.ui.modalOpen || Z.ui.choiceActive))) return;
    if (P.onGround && Math.abs(P.vx) > 60) { runT += dt; if (runT > 1.4) { runT = 0; learn("lauf"); } }
    if (prev.g && !P.onGround && P.vy < -200 && !P.climbing) learn("sprung");
    if (prev.aj > 0 && P.airJumps === 0 && !P.onGround && !P.climbing && P.vy < -100) learn("doppel");
    if (P.dropT > 0.15 && !(prev.drop > 0.15)) learn("steg");
    if (P.climbing && !prev.cl) learn("leiter");
    if (P.rollT > 0 && !(prev.roll > 0)) learn("rolle");
    if (P.drinkT > 0 && !(prev.drink > 0)) learn("trank");
    if (P.plunge && !prev.pl) learn("sturz");
    if (P.act && P.act.up && !prev.up) learn("aufwaerts");
    const H = inp.held;
    if (H.a1 && !prev.a1 && P.slots && P.slots.a1) learn("h1");
    if (H.a2 && !prev.a2 && P.slots && P.slots.a2) learn("h2");
    if ((H.s1 && !prev.s1 && P.slots && P.slots.s1) || (H.s2 && !prev.s2 && P.slots && P.slots.s2)) learn("faeh");
    if (H.map && !prev.map) learn("karte");
    prev.g = P.onGround; prev.aj = P.airJumps; prev.drop = P.dropT; prev.cl = P.climbing; prev.roll = P.rollT; prev.drink = P.drinkT; prev.pl = P.plunge; prev.up = !!(P.act && P.act.up);
    prev.a1 = H.a1; prev.a2 = H.a2; prev.s1 = H.s1; prev.s2 = H.s2; prev.map = H.map;
  }
  const sh0 = Z.shieldHook;
  Z.shieldHook = function (ev, P, o, dmg) { if (ev === "parry") learn("parade"); return sh0 ? sh0(ev, P, o, dmg) : undefined; };
  const op0 = Z.onPlaced;
  Z.onPlaced = function (it, slot, p) { try { if (p && p.rack) learn("aufheben"); } catch (_) {} return op0 ? op0.apply(this, arguments) : undefined; };

  /* ======================= ZEICHNEN ======================= */
  function globalSig() {
    const dev = devNow();
    const labs = dev === "touch" ? "" : ["left", "right", "up", "down", "jump", "roll", "a1", "a2", "s1", "s2", "use", "potion", "map", "gear"].map(a => keyName(a, dev).s).join(",");
    const fontsOK = document.fonts && document.fonts.check ? (document.fonts.check(F_TXT) && document.fonts.check(F_TTL) ? 1 : 0) : 1;
    return (Z.settings && Z.settings.lang) + "|" + dev + "|" + labs + "|" + fontsOK + "|" + kScale + "|" + (lo() ? 0 : 1);
  }
  let sigT = 0;
  function frame(dt) {
    sigT -= dt;
    if (sigT <= 0) {
      sigT = lo() ? 1 : 0.4; /* Handheld: Tasten-/Schrift-Kennung seltener prüfen (Schriftwechsel melden sich ohnehin über document.fonts) */
      const S0 = (Z.gfx && Z.gfx.scale) || 2, k = clamp(Math.ceil(S0 * 2) / 2, 1.5, 4);
      kScale = k; gsig = globalSig();
    }
    buildBudget = 2;
  }
  function drawAll(c, t) {
    const lv = Z.level; if (!lv) return;
    if (S.lv !== lv) setup(lv);
    if (!S.list.length) return;
    const now = performance.now() / 1000, dt = Math.min(0.1, Math.max(0, now - (S.tPrev || now))); S.tPrev = now;
    frame(dt);
    const cam = Z.cam, P = Z.player, low = lo();
    const px = P ? P.x + P.w / 2 : -1e9, py = P ? P.y + P.h : -1e9;
    for (const s of S.list) {
      const tg = target(s);
      s.a += (tg - s.a) * Math.min(1, dt * 2.2); if (Math.abs(tg - s.a) < 0.004) s.a = tg;
      if (s.a < 0.01) continue;
      const r = s.rect; if (!r || r[2] < cam.x - 40 || r[0] > cam.x + cam.w + 40 || r[3] < cam.y - 40 || r[1] > cam.y + cam.h + 60) continue;
      /* Nähe: 0 … 1 (sanftes Aufleuchten) */
      const dx = Math.abs(px - s.x), dy = Math.abs(py - s.gy);
      const nt = dy > 90 ? 0 : clamp(1 - (dx - 46) / 110, 0, 1) * clamp(1 - (dy - 40) / 60, 0, 1);
      s.n += (nt - s.n) * Math.min(1, dt * 3); s.vis = 1;
      if (!s.spr || s.sig !== sigOf(s)) { if (buildBudget > 0 || !s.spr) { buildBudget--; try { build(s); } catch (e) { console.error(e); s.a = 0; continue; } } }
      const sp = s.spr, x0 = s.x - s.w / 2 + sp.ox, y0 = s.by - s.h + sp.oy;
      /* warmer Schein auf der Wand, wenn man nah ist */
      if (!low && s.n > 0.04 && s.a > 0.3) { c.save(); c.globalCompositeOperation = "lighter"; c.globalAlpha = s.n * 0.22 * s.a; Z.draw.glow(c, s.x, s.by - s.h / 2, Math.max(s.w, s.h) * 0.75, s.tone === "gefahr" ? "rgba(255,90,60,.5)" : s.tone === "rune" ? "rgba(200,140,255,.5)" : "rgba(255,190,110,.5)"); c.restore(); }
      const base = s.a * (0.86 + 0.14 * s.n);
      c.globalAlpha = base; c.drawImage(sp.dim, x0, y0, sp.W, sp.H);
      if (s.n > 0.01) { c.globalAlpha = base * s.n; c.drawImage(sp.hell, x0, y0, sp.W, sp.H); }
      c.globalAlpha = s.a * (0.75 + 0.25 * s.n);
      const bx = s.x - s.w / 2, by = s.by - s.h;
      for (const d of s.tend || []) drawTendril(c, d, bx, by, t, s.n, low);
      if (s.lantern) { const lx = s.lantern === 1 ? bx + s.w + 3 : bx - 3, ly = by + 2; const fl = 0.8 + Math.sin(t * 9 + s.x) * 0.1 + Math.sin(t * 23) * 0.06; c.globalAlpha = s.a; Z.flame ? Z.flame(c, lx, ly + 7.6, 0.32, "#ffb060") : null; if (!low) { c.save(); c.globalCompositeOperation = "lighter"; c.globalAlpha = 0.35 * fl * s.a; Z.draw.glow(c, lx, ly + 5.6, 12, "rgba(255,180,90,.8)"); c.restore(); } }
      if (s.grow === "glut" && !low && s.n > 0.3 && Math.random() < 0.05 * s.n && FX && FX.p) FX.p({ x: bx + Math.random() * s.w, y: by + s.h, vx: (Math.random() - 0.5) * 10, vy: -18 - Math.random() * 14, life: 0.9, size: 1, col: "#ffb050", kind: "spark", add: true });
      c.globalAlpha = 1;
    }
  }
  /* hinter allem anderen in der Welt-Requisitenebene: zuerst die Schilder, dann die übrigen Requisiten */
  const dwp0 = Z.drawWorldProps;
  Z.drawWorldProps = function (c, t) { try { drawAll(c, t); } catch (e) { console.error(e); } if (dwp0) return dwp0.apply(this, arguments); };
  /* Licht: nahe Schilder bekommen ein kleines Leselicht, Laternen leuchten immer */
  const le0 = Z.lightExtra;
  Z.lightExtra = function (hole) {
    if (le0) le0(hole);
    if (Z.level !== S.lv) return;
    for (const s of S.list) { if (s.a < 0.05) continue; if (s.n > 0.08) hole(s.x, s.by - s.h / 2, 34 + 26 * s.n, 0.42 * s.n * s.a, s.tone === "rune" ? "#c890ff" : "#ffcf8a"); if (s.lantern) hole(s.lantern === 1 ? s.x + s.w / 2 + 3 : s.x - s.w / 2 - 3, s.by - s.h + 8, 36, 0.55 * s.a, "#ffb060"); }
  };
  /* Lernen im Spielablauf */
  const tick0 = Z.ebenenTick;
  /* Lernen beobachten: auf Handheld einmal pro Bild (Eingaben ändern sich ohnehin nur je Bild) */
  const wTakt = Z.bildTakt ? Z.bildTakt() : (d => d);
  Z.ebenenTick = function (dt) { if (tick0) tick0(dt); const d = wTakt(dt); if (!d) return; try { watch(Z.player, d); } catch (e) { console.error(e); } };
  /* Gebietswechsel: neu aufbauen (nach allen anderen Modulen) */
  const load0 = Z.loadArea;
  /* Plätze erst beim ersten Bild suchen: dann haben alle Module (auch die später geladenen) ihr Gebiet aufgebaut */
  Z.loadArea = function () { const r = load0.apply(this, arguments); S.lv = null; S.list = []; return r; };
  /* Hinweis-Stufe geändert: Lernschilder neu aufbauen (z. B. „keine“ → „alle“) */
  /* … und bei Sprachwechsel (andere Textbreiten) die Plätze neu suchen */
  let hlPrev = null;
  setInterval(() => { const h0 = hl() + "|" + (Z.settings && Z.settings.lang); if (hlPrev != null && h0 !== hlPrev && Z.level) { S.lv = null; } hlPrev = h0; }, 500);
  /* Schriften nachgeladen: Maße ändern sich – Plätze neu suchen und Bilder neu malen */
  if (document.fonts && document.fonts.addEventListener) document.fonts.addEventListener("loadingdone", () => { sigT = 0; S.lv = null; });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { sigT = 0; S.lv = null; });

  Z.schilder = {
    hat: id => S.lv === Z.level && S.list.some(s => (s.id === id || (id.endsWith(":") && s.id.startsWith(id))) && target(s) > 0.2),
    lerne: learn, gelernt: known,
    aktiv: () => hl() < 3,
    liste: () => S.list,
    neu: () => { S.lv = null; },
    /* Musterbild für Tests: Stil, Bewuchs, Halterung, Inhalt (Kennung aus TX/TXK oder Funktion) */
    _muster: (style, grow, mount, inhalt, extra) => { const s = Object.assign({ id: "muster", kind: "ort", style, grow, mount, seed: 12345, x: 0, by: 0, gy: mount === "pfosten" ? 16 : mount === "gestell" ? 3 : 0, content: typeof inhalt === "function" ? inhalt : TX[inhalt] || TXK[inhalt] }, extra || {}); kScale = 3; gsig = globalSig(); build(s); return s.spr.hell; },
    _setup: lv => setup(lv || Z.level), _obst: () => S.obst, _why: fn => { why = []; try { fn(); } finally { const w = why; why = null; return w; } }
  };
})();
