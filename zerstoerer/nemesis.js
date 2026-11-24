/* Ezekiel – The Destroyer · Nemesis, Kopfgeldjäger, seltene Ereignisse und Mini-Bosse
   1. NEMESIS: Wer Ezekiel tötet (oder schwer verwundet und davonkommt), steigt auf – mit Namen, Beinamen,
      Rang, Narben, Trophäe, Stärken, Schwächen und Gedächtnis. Nemeses kehren in späteren Läufen zurück,
      steigen bei weiteren Siegen auf, ringen untereinander um die Macht und hinterlassen besondere Beute.
   2. KOPFGELDJÄGER: Varn folgt Ezekiel über mehrere Gebiete (Steckbriefe, Bolzen in Wänden, Spuren),
      taucht plötzlich auf, flieht bei halber Kraft – und stellt sich später zum letzten Kampf.
   3. SELTENE EREIGNISSE: Finsternis, Schatzgoblin, Blutmond-Horde, Geisterprozession, Elite-Duell,
      Ritual, Gefangenentransport, Einsturz, Spiegelbild – jedes mit Vorwarnung, Inszenierung und Lohn.
   4. MINI-BOSSE: neun handgemachte Wächter mit eigener Gestalt, lesbaren Angriffen und Phasenwechsel.
   Prüfhilfen: Z.nemesis.force(typ), Z.nemesis.list(), Z.ereignis.force(id), Z.miniboss.force(id), Z.kopfgeld.force(), Z.nemesis.openBoard().
   Schnittstellen: Z.lager.wanted (Steckbrief-Brett), Z.lager.rescue (Gefangenentransport), Z.music.motiv/stinger/push, Z.ui.notify. */
(function () {
  "use strict";
  const Z = window.Z, U = Z.U, T = Z.TILE, FX = Z.fx, A = Z.audio, W = Z.world, L = v => Z.L(v);
  const CW = Z.CW, CH = Z.CH, PI = Math.PI, TAU = PI * 2;
  const { limb, circ, poly, ell, glow } = Z.draw;
  const esc = U.esc;
  const M = () => Z.meta;
  const lowG = () => !!(Z.lowGfx ? Z.lowGfx() : Z.gq && Z.gq.level === 0);
  const later = (fn, ms) => (Z.bossLater ? Z.bossLater(fn, ms) : setTimeout(fn, ms));
  const NM = (Z.nemesis = Z.nemesis || {});
  const EV = (Z.ereignis = Z.ereignis || {});
  const MB = (Z.miniboss = Z.miniboss || {});
  const KG = (Z.kopfgeld = Z.kopfgeld || {});
  const now = () => (Z.gfx && Z.gfx.time) || 0;
  const MODS = [];

  /* ======================= 1. GRUNDLAGEN ======================= */
  const cellsOf = lv => (lv && lv.cells ? Object.keys(lv.cells).map(k => lv.cells[k]) : []);
  const cellOfPx = (lv, x, y) => lv && lv.cells && lv.cells[Math.floor(x / T / CW) + "," + Math.floor(y / T / CH)];
  const normalLevel = lv => !!(lv && !lv.hub && !lv.arena && !lv.passage && lv.cells && Z.run);
  /* wie viele Gebiete dieser Lauf schon gesehen hat (Torhof = 1) */
  const routeN = () => (Z.run && Z.run.route ? Z.run.route.length : 0);
  const sx = s => s[0] * T + 8, sy = s => (s[1] + 1) * T;
  function spotsIn(lv, c, head) {
    const out = [], ox = c.x * CW, oy = c.y * CH;
    for (let y = oy + 1; y < oy + CH - 1; y++) for (let x = ox + 2; x < ox + CW - 2; x++)
      if (Z.standable(lv, x, y, head || 2) && (!lv.reach || lv.reach[y * lv.W + x])) out.push([x, y]);
    return out;
  }
  const nearDoor = (lv, s) => (lv.doors || []).some(d => Math.abs(d.x - s[0]) < 3 && Math.abs(d.y - s[1]) < 3);
  /* Platz weit weg vom Start (Kacheln), wahlweise mit Zellfilter; liefert { c, s, all } */
  function farSpot(lv, o) {
    o = o || {}; const R = o.R || Z.R, st = lv.start || { x: 0, y: 0 };
    const cells = R.shuffle(cellsOf(lv).filter(c => c !== lv.startCell && c.kind !== "secret" && (!o.filter || o.filter(c))));
    if (o.sort) cells.sort(o.sort);
    for (const c of cells) {
      const sp = spotsIn(lv, c, o.head || 3).filter(s => Math.abs(s[0] - st.x) + Math.abs(s[1] - st.y) > (o.min == null ? 30 : o.min) && !nearDoor(lv, s));
      if (sp.length >= (o.need || 3)) return { c, s: o.center ? sp.sort((a, b) => Math.abs(a[0] - (c.x * CW + CW / 2)) - Math.abs(b[0] - (c.x * CW + CW / 2)))[0] : R.pick(sp), all: sp };
    }
    return null;
  }
  /* Bodenplätze in der Nähe eines Punktes (Pixel), z. B. für Verstärkung und Fallen */
  function spotsNear(lv, x, y, r, head) {
    const out = [], tx = Math.floor(x / T), ty = Math.floor(y / T), rt = Math.ceil(r / T);
    for (let yy = ty - 4; yy <= ty + 3; yy++) for (let xx = tx - rt; xx <= tx + rt; xx++) if (Z.standable(lv, xx, yy, head || 2)) out.push([xx, yy]);
    return out;
  }
  const playerC = () => { const P = Z.player; return P ? [P.x + P.w / 2, P.y + P.h / 2] : [0, 0]; };
  const distP = (x, y) => { const [a, b] = playerC(); return Math.hypot(a - x, b - y); };
  function note(html, ms) {
    try { if (Z.ui && typeof Z.ui.notify === "function") { Z.ui.notify(html, ms || 3200); return; } } catch (_) {}
    if (Z.toast) Z.toast(html, ms || 3200);
  }
  let saveT = 0;
  const saveSoon = () => { saveT = 0.6; };

  /* ======================= 2. INSZENIERUNG ======================= */
  /* Sprechblasen (Pergament) über Figuren, Weltschrift, Banner im Bilderbuch-Stil, Kameraschwenk, Leitmotive */
  const SAY = [], WT = [];
  let BAN = null, pan = null;
  function say(ent, txt, o) {
    o = o || {};
    for (let i = SAY.length - 1; i >= 0; i--) if (ent && SAY[i].ent === ent) SAY.splice(i, 1);
    SAY.push({ ent, x: o.x || 0, y: o.y || 0, who: o.who || "", txt: String(txt), t: 0, life: o.life || Math.min(6, 2.4 + String(txt).length * 0.045), ink: o.ink || "#3a1a10", lines: null });
    if (SAY.length > 4) SAY.shift();
  }
  function wtext(x, y, txt, o) {
    o = o || {};
    WT.push({ x, y, txt: String(txt), t: 0, life: o.life || 2.6, col: o.col || "#ffd27a", size: o.size || 9, follow: o.follow || null, vy: o.vy == null ? -5 : o.vy });
    if (WT.length > 8) WT.shift();
  }
  /* Text über Ezekiels Kopf (für Vorwarnungen) */
  const overHead = (txt, col, life, size) => { const P = Z.player; if (P) wtext(P.x + P.w / 2, P.y - 22, txt, { col, life: life || 2.8, size: size || 8, follow: P }); };
  function banner(b) { b.t = 0; b.life = b.life || 4.4; b.cv = null; BAN = b; }
  function camPan(x, y, dur) {
    const cam = Z.cam; if (!cam) return;
    if (cam.lock && !(pan && cam.lock === pan.lock)) return; /* Bosse und Wächter haben Vorrang */
    pan = { lock: { x, y, k: 0 }, t: 0, dur: dur || 1.4 }; cam.lock = pan.lock;
  }
  function panTick(dt) {
    if (!pan) return;
    pan.t += dt; const t = pan.t, d = pan.dur;
    if (Z.cam.lock !== pan.lock) { pan = null; return; }
    pan.lock.k = t < 0.35 ? U.ease(t / 0.35) * 0.62 : t > d - 0.4 ? Math.max(0, (d - t) / 0.4) * 0.62 : 0.62;
    if (t >= d) { Z.cam.lock = null; pan = null; }
  }
  function wrap(c, s, w) {
    const words = String(s).split(" "), out = []; let cur = "";
    for (const wd of words) { const n = cur ? cur + " " + wd : wd; if (c.measureText(n).width > w && cur) { out.push(cur); cur = wd; } else cur = n; }
    if (cur) out.push(cur); return out;
  }
  function parchment(c, x, y, w, h, o) {
    o = o || {};
    c.fillStyle = o.edge || "#6a4a2a"; c.beginPath(); c.roundRect ? c.roundRect(x - 0.8, y - 0.8, w + 1.6, h + 1.6, 3) : c.rect(x - 0.8, y - 0.8, w + 1.6, h + 1.6); c.fill();
    c.fillStyle = o.fill || "#efe2c0"; c.beginPath(); c.roundRect ? c.roundRect(x, y, w, h, 2.5) : c.rect(x, y, w, h); c.fill();
    if (!lowG()) { c.fillStyle = "rgba(160,110,60,.16)"; c.fillRect(x + 1, y + h - 2.4, w - 2, 1.6); c.fillRect(x + w - 3, y + 1, 1.6, h - 2); }
  }
  function drawSay(c) {
    if (!SAY.length) return;
    c.save(); c.textAlign = "left"; c.textBaseline = "alphabetic";
    const cam = Z.cam;
    for (const s of SAY) {
      const e = s.ent; if (e && !e.gone) { s.x = e.x + e.w / 2; s.y = e.y - 4; }
      const a = Math.min(1, s.t / 0.15, (s.life - s.t) / 0.35); if (a <= 0) continue;
      c.font = "600 6.6px 'Alegreya Sans',sans-serif";
      if (!s.lines) { s.lines = wrap(c, s.txt, 118); s.wid = Math.max(...s.lines.map(l => c.measureText(l).width)); c.font = "800 6px 'Alegreya Sans',sans-serif"; s.wid = Math.max(s.wid, s.who ? c.measureText(s.who).width : 0); c.font = "600 6.6px 'Alegreya Sans',sans-serif"; }
      const lh = 7.4, w = s.wid + 10, h = s.lines.length * lh + (s.who ? 7 : 0) + 6;
      const bx = U.clamp(s.x - w / 2, cam.x + 3, cam.x + cam.w - w - 3), by = U.clamp(s.y - h - 9, cam.y + 3, cam.y + cam.h - h - 12);
      const pop = s.t < 0.12 ? 0.85 + s.t / 0.12 * 0.15 : 1;
      c.globalAlpha = a; c.save(); c.translate(bx + w / 2, by + h); c.scale(pop, pop); c.translate(-(bx + w / 2), -(by + h));
      const tx = U.clamp(s.x, bx + 6, bx + w - 6);
      poly(c, [tx - 3.4, by + h - 0.5, tx + 3.4, by + h - 0.5, tx + (s.x > tx ? 2 : -1), Math.min(s.y - 2, by + h + 7)], "#6a4a2a");
      parchment(c, bx, by, w, h);
      poly(c, [tx - 2.4, by + h - 1, tx + 2.4, by + h - 1, tx + (s.x > tx ? 1.4 : -0.6), Math.min(s.y - 3, by + h + 5.6)], "#efe2c0");
      let yy = by + 7.4;
      if (s.who) { c.font = "800 6px 'Alegreya Sans',sans-serif"; c.fillStyle = "#8a1a14"; c.fillText(s.who, bx + 5, yy - 0.6); yy += 7; c.font = "600 6.6px 'Alegreya Sans',sans-serif"; }
      c.fillStyle = s.ink; for (const l of s.lines) { c.fillText(l, bx + 5, yy); yy += lh; }
      c.restore();
    }
    c.restore(); c.globalAlpha = 1;
  }
  function drawWT(c) {
    if (!WT.length) return;
    c.save(); c.textAlign = "center";
    for (const w of WT) {
      const a = Math.min(1, w.t / 0.2, (w.life - w.t) / 0.5); if (a <= 0) continue;
      if (w.follow) { w.x = w.follow.x + w.follow.w / 2; w.y0 = w.follow.y - 16; }
      const y = (w.follow ? w.y0 : w.y) + w.vy * w.t;
      c.globalAlpha = a; c.font = "italic 800 " + w.size + "px 'Alegreya Sans',sans-serif";
      c.lineWidth = 2.6; c.strokeStyle = "rgba(14,6,8,.9)"; c.strokeText(w.txt, w.x, y); c.fillStyle = w.col; c.fillText(w.txt, w.x, y);
    }
    c.restore(); c.globalAlpha = 1;
  }
  /* Banner: Pergamentband mit gekerbten Enden, Siegel, Name, Beiname, Rang und Merkmale – als Bild zwischengespeichert */
  const KINDCOL = { nemesis: ["#8a1414", "#c8302a"], mini: ["#5a3a1a", "#b0702a"], event: ["#4a2a5a", "#8a4ab0"], hunter: ["#3a2a1a", "#9a6a2a"] };
  function buildBanner(b, S) {
    const pad = 10, cv = document.createElement("canvas"), g = cv.getContext("2d");
    const lines = b.lines || [];
    g.font = "900 14px 'Alegreya Sans',sans-serif"; const nw = g.measureText(b.name).width;
    g.font = "italic 700 8.5px 'Alegreya Sans',sans-serif"; const ew = b.sub ? g.measureText(b.sub).width : 0;
    g.font = "700 7px 'Alegreya Sans',sans-serif"; const lw = lines.length ? Math.max(...lines.map(l => g.measureText(l[0]).width)) : 0;
    const w = Math.max(150, nw + 60, ew + 40, lw + 40), h = 29 + (b.sub ? 10 : 0) + (b.pips ? 8 + (b.rankName ? 6 : 0) : 0) + 4 + lines.length * 8.6 + 8;
    const tail = 16;
    cv.width = Math.ceil((w + tail * 2 + 6) * S); cv.height = Math.ceil((h + 10) * S);
    g.scale(S, S); g.translate(tail + 3, 4);
    const [dark, mid] = KINDCOL[b.kind] || KINDCOL.event;
    /* Bandenden */
    for (const s of [-1, 1]) {
      const x0 = s < 0 ? 0 : w, xe = s < 0 ? -tail : w + tail;
      poly(g, [x0, 8, xe, 8, xe + s * -5, h / 2 + 4, xe, h, x0, h], "#6a4a2a");
      poly(g, [x0, 9.2, xe + s * -1, 9.2, xe + s * -6, h / 2 + 4, xe + s * -1, h - 1.2, x0, h - 1.2], "#d8c49a");
      poly(g, [x0, h - 1.2, x0 + s * 5, h + 3, x0 + s * 5, h - 1.2], "#a08458");
    }
    parchment(g, 0, 0, w, h);
    /* Zierlinien */
    g.strokeStyle = "rgba(106,74,42,.55)"; g.lineWidth = 0.6; g.strokeRect(3, 3, w - 6, h - 6);
    /* Siegel */
    const sxp = w / 2, syp = 1;
    circ(g, sxp, syp, 7.2, dark); circ(g, sxp, syp, 6, mid);
    g.fillStyle = "#f4e0c0"; g.font = "900 8px 'Alegreya Sans',sans-serif"; g.textAlign = "center"; g.fillText(b.seal || "☠", sxp, syp + 3);
    /* Kopfzeile */
    g.font = "800 6.4px 'Alegreya Sans',sans-serif"; g.fillStyle = mid; g.fillText(b.head.toUpperCase().split("").join(" "), w / 2, 15);
    g.font = "900 14px 'Alegreya Sans',sans-serif"; g.fillStyle = "#2a1208"; g.fillText(b.name, w / 2, 29);
    let y = 29;
    if (b.sub) { y += 10; g.font = "italic 700 8.5px 'Alegreya Sans',sans-serif"; g.fillStyle = dark; g.fillText(b.sub, w / 2, y); }
    if (b.pips) { y += 8; for (let i = 0; i < 5; i++) { const xx = w / 2 + (i - 2) * 8; g.fillStyle = i < b.pips ? dark : "rgba(106,74,42,.3)"; g.font = "900 7px 'Alegreya Sans',sans-serif"; g.fillText("◆", xx, y); } if (b.rankName) { g.font = "700 6px 'Alegreya Sans',sans-serif"; g.fillStyle = "#5a3a1a"; g.fillText(b.rankName, w / 2, y + 7); y += 6; } }
    y += 4;
    g.font = "700 7px 'Alegreya Sans',sans-serif";
    for (const [txt, col] of lines) { y += 8.6; g.fillStyle = col || "#3a2a1a"; g.fillText(txt, w / 2, y); }
    b.cv = cv; b.S = S; b.cw = w + tail * 2 + 6; b.ch = h + 10;
  }
  function drawBanner(c, Wd, Hd, dt) {
    const b = BAN; if (!b) return;
    const S = Z.gfx.scale || 2;
    if (!b.cv || b.S !== S) buildBanner(b, Math.min(4, S));
    const vw = Wd / S, vh = Hd / S;
    const u = b.t < 0.45 ? U.easeOut(b.t / 0.45) : 1, a = Math.max(0, Math.min(1, (b.life - b.t) / 0.6));
    c.save(); c.setTransform(S, 0, 0, S, 0, 0); c.globalAlpha = a * Math.min(1, b.t / 0.12);
    const k = Math.min(0.74, vw / (b.cw + 20)), x = vw / 2, y = vh * 0.66 + (1 - u) * 6;
    c.translate(x, y); c.scale((0.15 + 0.85 * u) * k, k);
    c.drawImage(b.cv, -b.cw / 2, 0, b.cw, b.ch);
    c.restore();
  }

  /* ---------- Leitmotive aus echten Instrumentaufnahmen (klang/) ---------- */
  const INST = {
    hornst: [33, 36, 39, 43, 46, 50, 53, 57, 60, 74, 77], pos: [34, 37, 39, 41, 46, 50, 53, 60, 61, 63, 65],
    blech: [46, 49, 52, 55, 58, 61, 64, 67, 70, 73, 76, 79, 82], timpt: [36, 39, 42, 45, 48, 51, 54, 57],
    kb: [28, 30, 31, 34, 36, 38, 40, 42, 44, 45, 49, 52, 56, 59], cel: [60, 63, 66, 69, 72, 75, 78, 81, 84, 87, 90, 93, 96],
    ooh: [48, 51, 54, 57, 60, 63, 66, 69, 72, 75, 78], harfe: [28, 31, 35, 38, 41, 45, 48, 52, 55, 59, 62, 65, 69, 72, 76, 79, 83, 86]
  };
  let preloaded = false;
  const MOTIF_OK = {};
  function preload() { if (preloaded || !A.ok) return; preloaded = true; for (const k of ["hornst", "pos", "timpt", "kb"]) for (const n of INST[k]) A.load("klang/" + k + "_" + n + ".mp3"); }
  function tone(inst, midi, when, vol, dur) {
    if (!A.ok || !A.ctx) return; const l = INST[inst]; if (!l) return;
    let n = l[0]; for (const v of l) if (Math.abs(v - midi) < Math.abs(n - midi)) n = v;
    const path = "klang/" + inst + "_" + n + ".mp3", b = A.buf[path];
    if (!b) { if (b === undefined) A.load(path); return; }
    const c = A.ctx; when = Math.max(c.currentTime + 0.01, when);
    const s = c.createBufferSource(); s.buffer = b; s.playbackRate.value = Math.pow(2, (midi - n) / 12);
    const g = c.createGain(); g.gain.setValueAtTime(0, when); g.gain.linearRampToValueAtTime(vol, when + 0.03); g.gain.setValueAtTime(vol, when + dur * 0.7); g.gain.linearRampToValueAtTime(0, when + dur);
    s.connect(g); g.connect((Z.music && Z.music.busSt) || A.mus || A.sfx); s.start(when); s.stop(when + dur + 0.05);
    s.onended = () => { try { g.disconnect(); } catch (_) {} };
  }
  /* jedes Motiv ist durch einen Samen festgelegt: dieselbe Gestalt klingt bei jeder Begegnung gleich */
  function motif(seed, o) {
    o = o || {};
    if (!A.ok || !A.ctx) return;
    const R = Z.Rng((seed >>> 0) || 7), prof = Z.music && Z.music.prof, root = (prof && prof.root) || 45;
    const sc = o.major ? [0, 2, 4, 5, 7, 9, 11] : [0, 1, 3, 5, 7, 8, 10];
    /* bevorzugt über die Musik-Schnittstelle: Motiv aus dem Samen ableiten, in Tonart und Takt des Gebiets einsetzen */
    const MU = Z.music;
    if (MU && typeof MU.motiv === "function") { try { MU.motiv(seed, o); } catch (err) { console.error(err); } return; }
    if (MU && typeof MU.defineMotif === "function" && typeof MU.motif === "function") {
      try {
        const name = "nm_" + (seed >>> 0) + (o.major ? "d" : "m");
        if (!MOTIF_OK[name]) {
          const R2 = Z.Rng((seed >>> 0) || 7), shp = o.shape || R2.pick([[0, 2, 4, 1], [0, 4, 3, 0], [4, 3, 1, 0], [0, 1, 0, -2], [0, 5, 4, 3], [0, 3, 1, -1]]);
          const rh = R2.pick([[3, 1, 1, 6], [2, 2, 3, 5], [4, 1, 1, 6]]);
          const semi = d => sc[((d % 7) + 7) % 7] + 12 * Math.floor(d / 7);
          let st = 0; const notes = shp.map((d, i) => { const n = [semi(d), st, rh[i]]; st += rh[i]; return n; });
          MU.defineMotif(name, { notes, inst: o.inst ? [o.inst] : R2() < 0.5 ? ["pos", "horn"] : ["horn"], oct: -12, vol: o.vol || 0.13, choir: !o.major, drum: true });
          MOTIF_OK[name] = true;
        }
        if (MU.motif(name, { quant: "schlag", leit: 7, push: 0.45 })) return;
      } catch (err) { console.error(err); }
    }
    preload();
    const deg = i => root + sc[((i % 7) + 7) % 7] + 12 * Math.floor(i / 7);
    const shapes = [[0, 2, 4, 1], [0, 4, 3, 0], [4, 3, 1, 0], [0, 1, 0, -2], [0, 5, 4, 3], [0, 3, 1, -1]];
    const sh = o.shape || R.pick(shapes), rh = R.pick([[0.42, 0.21, 0.21, 1.3], [0.32, 0.32, 0.5, 1.2], [0.6, 0.2, 0.2, 1.4]]);
    const inst = o.inst || R.pick(["hornst", "pos", "hornst"]);
    let t = A.ctx.currentTime + 0.06; const t0 = t;
    sh.forEach((d, i) => { tone(inst, deg(d) + 12, t, o.vol || 0.17, rh[i] * 1.15); if (i === 0 || i === 3) tone("timpt", root + (i ? 0 : 7), t, 0.28, 1.4); t += rh[i]; });
    tone("kb", root - 12, t0, 0.13, t - t0 + 0.8);
    if (Z.music) Z.music.heat = Math.max(Z.music.heat || 0, 0.8);
  }

  /* ======================= 3. NEMESIS ======================= */
  const FAM = {
    goblin: "goblin", goblinBogen: "goblin", goblinSchlaeger: "goblin", goblinBombe: "goblin", wolfsreiter: "goblin",
    wolf: "bestie", ratte: "bestie", magmaHund: "bestie",
    robe: "robe", robeArmbrust: "robe", robeTrunk: "robe", robeSchlaeger: "robe", adept: "robe", bewahrer: "robe", feuerschlucker: "robe",
    kerkerwache: "mensch", folterknecht: "mensch", soeldner: "mensch",
    drowWache: "drow", drowSchuetze: "drow",
    skelett: "untot", skelBogen: "untot", zombie: "untot", ertrunkener: "untot", schatten: "untot",
    ruestung: "konstrukt", runenwaechter: "konstrukt", runenfunke: "konstrukt",
    duergar: "duergar", duergarArmbrust: "duergar",
    kuotoa: "fisch", kuotoaSpeer: "fisch", peitscher: "fisch", krabbe: "fisch", rochen: "fisch",
    riesenspinne: "spinne", netzspinne: "spinne", ettercap: "spinne",
    zweigBlight: "blight", nadelBlight: "blight", rankenBlight: "blight",
    mane: "daemon", stirge: "daemon", harpyie: "daemon",
    glutling: "glut", schmiedegeist: "glut",
    /* W10: neue Arten */
    goblinTrommler: "goblin", goblinSchild: "goblin", laternentraeger: "kobold", gallertwuerfel: "schleim", saeureschnecke: "schleim", mimik: "mimik",
    kenku: "kenku", grimlock: "grimlock", ghul: "untot", glockengeist: "untot", schmuggler: "mensch", myconid: "pilz", drider: "drow",
    rostmonster: "bestie", quasit: "daemon", sturmMephit: "daemon", gargoyle: "stein", grindylow: "fisch", glutfledermaus: "glut", salamander: "glut"
  };
  /* wer kommt als Verstärkung, wenn ein Nemesis ruft */
  const MINION = { goblin: ["goblin", "goblinBogen"], bestie: ["wolf", "ratte"], robe: ["robe", "robeArmbrust"], mensch: ["kerkerwache", "soeldner"], drow: ["drowWache"], untot: ["skelett", "zombie"],
    konstrukt: ["runenfunke"], duergar: ["duergar"], fisch: ["kuotoa"], spinne: ["spinnchen", "riesenspinne"], blight: ["zweigBlight"], daemon: ["mane", "stirge"], glut: ["glutlingKlein", "glutling"],
    kobold: ["laternentraeger", "ratte"], schleim: ["phiole"], mimik: ["ratte", "ratte"], kenku: ["kenku"], grimlock: ["grimlock"], pilz: ["myconid", "spinnchen"], stein: ["mane"] };
  const SYL = {
    goblin: [["Gri", "Snag", "Rat", "Muz", "Gob", "Skar", "Nar", "Ugl", "Krik", "Zog", "Bol", "Gna", "Rik", "Mog"], ["shak", "nik", "gut", "zak", "rot", "grub", "mosh", "lik", "dak", "brak", "gash", "nob"]],
    untot: [["Mor", "Kra", "Vel", "Sab", "Gru", "Os", "Thr", "Nek", "Ul", "Dra"], ["thul", "gath", "rim", "ox", "ul", "ias", "nor", "mund", "geist"]],
    drow: [["Il", "Zes", "Nym", "Jhae", "Szor", "Qua", "Vel", "Xul", "Ryl", "Ali"], ["phrin", "stra", "'ryl", "l", "drin", "vein", "grin", "rae", "zza", "ndra"]],
    duergar: [["Grim", "Dur", "Thor", "Brak", "Hol", "Mor", "Skal", "Bal", "Ruk", "Gor"], ["bold", "gan", "grim", "ka", "dra", "nar", "rik", "dun", "mir"]],
    fisch: [["Glu", "Blo", "Ssk", "Kla", "Ur", "Mlo", "Gor", "Bub", "Ssa"], ["gl", "ubb", "ssa", "rrk", "oth", "mak", "lup", "gurr"]],
    spinne: [["Ix", "Sel", "Ach", "Thir", "Vess", "Ky", "Lol", "Sza", "Ny"], ["ith", "ara", "neth", "ix", "ys", "assa", "thra", "ira"]],
    daemon: [["Zza", "Kel", "Vrog", "Ash", "Mal", "Baz", "Gre", "Yth", "Nar"], ["goth", "zul", "mon", "rax", "eth", "gor", "zek", "ul"]],
    kobold: [["Kur", "Snik", "Mee", "Tak", "Yip", "Dek", "Rok", "Zik", "Pip"], ["tik", "pok", "snak", "rik", "mek", "yap", "zaz", "lik"]]
  };
  const NAMES = {
    bestie: [["Graufang", "Greyfang"], ["Aschepelz", "Ashpelt"], ["Schlitzohr", "Slit-Ear"], ["Rostbiss", "Rustbite"], ["Krummbein", "Crookleg"], ["Narbenmaul", "Scarmaw"], ["Rotzahn", "Redtooth"], ["Halbohr", "Half-Ear"], ["Schattenpfote", "Shadowpaw"]],
    konstrukt: [["Rostherz", "Rustheart"], ["Eisenwitwe", "Iron Widow"], ["Bolzenkopf", "Boltbrain"], ["Wacht VII", "Ward VII"], ["Kaltschmied", "Coldsmith"], ["Nietenfaust", "Rivetfist"], ["Der Hohle", "The Hollow"]],
    blight: [["Dornwurz", "Thornroot"], ["Moderzweig", "Rotbranch"], ["Krummast", "Crookbough"], ["Distelherz", "Thistleheart"], ["Wurzelgram", "Rootgrudge"], ["Splitterborke", "Splinterbark"]],
    schleim: [["Schleimkönig", "Slime King"], ["Ätzbauch", "Acidgut"], ["Der Klebrige", "The Sticky One"], ["Moderwabbel", "Mouldwobble"], ["Glibber", "Goo"], ["Säuresuppe", "Acid Soup"]],
    mimik: [["Kistenkiefer", "Chestjaw"], ["Schatzmaul", "Treasuremaw"], ["Der Deckel", "The Lid"], ["Falscher Freund", "False Friend"], ["Goldzunge", "Goldtongue"]],
    kenku: [["Klirrklang", "Clinkclang"], ["Türknarr", "Doorcreak"], ["Pfeifwind", "Whistlewind"], ["Schlurfschritt", "Shufflestep"], ["Hustenhall", "Coughecho"], ["Ezekiels Stimme", "Ezekiel's Voice"]],
    grimlock: [["Blindzahn", "Blindtooth"], ["Steinohr", "Stone-Ear"], ["Graukeule", "Greyclub"], ["Lauscher", "Listener"], ["Narbengesicht", "Scarface"]],
    pilz: [["Sporenvater", "Sporefather"], ["Moderhut", "Mouldcap"], ["Schimmelfürst", "Mildew Prince"], ["Stillspore", "Stillspore"], ["Lamellus", "Lamellus"]],
    stein: [["Grauflügel", "Greywing"], ["Moosrücken", "Mossback"], ["Regenspeier", "Rainspout"], ["Steingrimm", "Stonegrim"], ["Der Wächter der Rinne", "Warden of the Gutter"]],
    glut: [["Funkenzahn", "Sparktooth"], ["Rußherz", "Sootheart"], ["Schwelbrand", "Smoulder"], ["Kohlenkind", "Coalchild"], ["Zunder", "Tinder"], ["Aschwind", "Ashwind"]]
  };
  /* Titel passend zum Geschlecht des Vornamens */
  const TITLES = {
    robe: { m: [["Bruder", "Brother"], ["Akolyth", "Acolyte"], ["Diakon", "Deacon"]], f: [["Schwester", "Sister"], ["Akolythin", "Acolyte"], ["Diakonin", "Deaconess"]],
      n: [["Malachai", "m"], ["Velkor", "m"], ["Corvin", "m"], ["Ottmar", "m"], ["Severin", "m"], ["Brannoc", "m"], ["Mordred", "m"], ["Isbet", "f"], ["Ilsa", "f"], ["Agathe", "f"]] },
    mensch: { m: [["Hauptmann", "Captain"], ["Feldwebel", "Sergeant"], ["Kerkervogt", "Jailer"], ["Wachtmeister", "Watch-Sergeant"]], f: [["Hauptfrau", "Captain"], ["Feldwebelin", "Sergeant"], ["Kerkervögtin", "Jailer"], ["Wachtmeisterin", "Watch-Sergeant"]],
      n: [["Gerold", "m"], ["Hagen", "m"], ["Ulfric", "m"], ["Barnabas", "m"], ["Konrad", "m"], ["Wernhart", "m"], ["Roderich", "m"], ["Edda", "f"], ["Gisla", "f"]] }
  };
  function genName(fam, R) {
    if (NAMES[fam]) return R.pick(NAMES[fam]).slice();
    if (TITLES[fam]) { const T0 = TITLES[fam], [n, g] = R.pick(T0.n), t = R.pick(T0[g]); return [t[0] + " " + n, t[1] + " " + n]; }
    const s = SYL[fam] || SYL.goblin; const n = R.pick(s[0]) + R.pick(s[1]); return [n, n];
  }
  /* Beinamen: nach der Todesart (wie Ezekiel fiel) */
  const EPI = {
    klinge: [["der Narbenreißer", "the Scar-Ripper"], ["der Schlitzer", "the Slasher"], ["Ezekiels Henker", "Ezekiel's Headsman"], ["die Klinge der Feste", "the Blade of the Keep"], ["der Kehlenschneider", "the Throatcutter"]],
    schuss: [["das Adlerauge", "Eagle-Eye"], ["der Lautlose Schuss", "the Silent Shot"], ["Pfeil-im-Rücken", "Arrow-in-the-Back"], ["der Fernschütze", "the Far-Shooter"]],
    feuer: [["der Brandstifter", "the Firebrand"], ["der Aschemacher", "the Ashmaker"], ["der Röster", "the Roaster"], ["Rauchzunge", "Smoketongue"]],
    gift: [["der Giftmischer", "the Poisoner"], ["Faulzahn", "Rot-Tooth"], ["der Schleichende Tod", "the Creeping Death"]],
    wucht: [["der Knochenbrecher", "the Bonebreaker"], ["der Schädelspalter", "the Skullsplitter"], ["der Zermalmer", "the Crusher"], ["Eisenfaust", "Ironfist"]],
    griff: [["der Würger", "the Strangler"], ["Eisengriff", "Irongrip"], ["der Umklammerer", "the Clencher"]],
    knall: [["der Donnernde", "the Thundering"], ["Bumm", "the Boom"]],
    zauber: [["der Fluchwirker", "the Hexweaver"], ["Runenzunge", "Runetongue"], ["der Bannende", "the Binder"]],
    list: [["der Hinterlistige", "the Treacherous"], ["der Fallensteller", "the Trapper"], ["Schattenzahn", "Shadowtooth"]],
    wunde: [["der Entkommene", "the Escaped"], ["der Glückspilz", "the Lucky"], ["Der-Davonkam", "Who-Got-Away"], ["Halbtot", "Half-Dead"]],
    zurueck: [["der Unverwüstliche", "the Unbreakable"], ["der Wiedergekehrte", "the Returned"], ["Narbengesicht", "Scarface"]],
    verbrannt: [["der Verbrannte", "the Burnt"], ["Aschgesicht", "Ashface"]],
    hoch: [["Ezekiels Fluch", "Ezekiel's Bane"], ["Zerstörer-Töter", "Destroyer-Slayer"], ["der Zweimal-Siegreiche", "the Twice-Victorious"]],
    macht: [["der Thronräuber", "the Usurper"], ["Rivalenfresser", "Rival-Eater"]]
  };
  const RANK = [null, ["Herausforderer", "Challenger"], ["Hauptmann", "Captain"], ["Kriegsherr", "Warlord"], ["Schrecken der Feste", "Terror of the Keep"], ["Erzfeind", "Archnemesis"]];
  /* Stärken – jede mit echter Wirkung im Kampf */
  const TRAIT = {
    feuerfest: { n: ["Feuerfest", "Fireproof"], d: ["Brennt nicht, Feuer kaum wirksam", "Doesn't burn, fire barely works"] },
    giftfest: { n: ["Giftfest", "Poison-proof"], d: ["Gift wirkt kaum", "Poison barely works"] },
    gepanzert: { n: ["Gepanzert", "Armoured"], d: ["30 % weniger Schaden", "30% less damage"] },
    schild: { n: ["Schildträger", "Shield-bearer"], d: ["Blockt von vorn", "Blocks from the front"], ok: d => !d.fly && ["human", "goblin", "skel", "duergar", "armor", "kuotoa", "zombie"].includes(d.shape) },
    verstaerkung: { n: ["Ruft Verstärkung", "Calls reinforcements"], d: ["Holt Hilfe bei 70 % und 40 %", "Calls help at 70% and 40%"] },
    blutrausch: { n: ["Blutrausch", "Bloodlust"], d: ["Heilt sich, wenn er trifft", "Heals when it hits"] },
    flink: { n: ["Flink", "Swift"], d: ["Schneller, holt kürzer aus", "Faster, shorter wind-ups"] },
    unaufhaltsam: { n: ["Unaufhaltsam", "Unstoppable"], d: ["Lässt sich nicht unterbrechen", "Can't be interrupted"] },
    rachsuechtig: { n: ["Rachsüchtig", "Vengeful"], d: ["Rasend unter halber Kraft", "Enraged below half health"] },
    pfeilfest: { n: ["Pfeilfest", "Arrow-proof"], d: ["Fernkampf prallt ab", "Ranged attacks glance off"] },
    dornen: { n: ["Dornenhaut", "Thornhide"], d: ["Nahkampf schneidet zurück", "Melee cuts you back"] },
    zaeh: { n: ["Zäh", "Tough"], d: ["Viel mehr Leben", "Much more health"] },
    regeneration: { n: ["Regeneration", "Regeneration"], d: ["Heilt, wenn man ablässt", "Heals when left alone"] },
    ausweicher: { n: ["Ausweicher", "Evasive"], d: ["Weicht Hieben aus", "Dodges blows"] },
    brandklinge: { n: ["Brandklinge", "Burning blade"], d: ["Hiebe setzen in Brand", "Blows set you aflame"] },
    giftklinge: { n: ["Giftklinge", "Venom blade"], d: ["Hiebe vergiften", "Blows poison"] }
  };
  const WEAK = {
    fallenangst: { n: ["Fürchtet Fallen", "Fears traps"], d: ["Fallen und Abgründe: dreifacher Schaden", "Traps and chasms: triple damage"] },
    feuerscheu: { n: ["Feuerscheu", "Fire-shy"], d: ["Feuer: doppelter Schaden, flieht", "Fire: double damage, flees"], no: "feuerfest" },
    giftanfaellig: { n: ["Giftanfällig", "Poison-prone"], d: ["Gift: doppelter Schaden", "Poison: double damage"], no: "giftfest" },
    paradeschwach: { n: ["Bricht bei Paraden", "Breaks on parries"], d: ["Nach einer Parade lange benommen", "Long stun after a parry"] },
    ruecken: { n: ["Ungeschützter Rücken", "Exposed back"], d: ["Von hinten fast doppelter Schaden", "Almost double damage from behind"] },
    sturzschwach: { n: ["Fürchtet Sturzangriffe", "Fears plunges"], d: ["Sturzangriff: zweieinhalbfacher Schaden", "Plunge attack: 2.5× damage"] },
    zornangst: { n: ["Fürchtet Ezekiels Zorn", "Fears Ezekiel's wrath"], d: ["Flieht vor dem Darkin-Zorn", "Flees from the Darkin wrath"] },
    kopflos: { n: ["Jähzornig", "Hot-headed"], d: ["Nach schweren Hieben lange offen", "Long opening after heavy blows"] },
    fernschwach: { n: ["Schwach gegen Fernkampf", "Weak to ranged"], d: ["Fernkampf: fast doppelter Schaden", "Ranged: almost double damage"], no: "pfeilfest" },
    hochmut: { n: ["Hochmütig", "Arrogant"], d: ["Unverletzt besonders verwundbar", "Very vulnerable while unhurt"] }
  };
  const TRAIT_NO = { feuerfest: "feuerscheu", giftfest: "giftanfaellig", pfeilfest: "fernschwach" };
  const S0 = () => {
    const m = M(); let s = m.nemesis;
    if (!s || typeof s !== "object" || Array.isArray(s)) s = m.nemesis = {};
    if (!Array.isArray(s.list)) s.list = []; if (!Array.isArray(s.fallen)) s.fallen = []; if (!Array.isArray(s.news)) s.news = [];
    if (!Number.isFinite(s.seq)) s.seq = 1; if (!Number.isFinite(s.slain)) s.slain = 0;
    if (!s.hunter || typeof s.hunter !== "object") s.hunter = { lvl: 0, beaten: 0, kills: 0, scars: 0 };
    /* kaputte Einträge aussortieren (alte/fremde Speicherstände dürfen nichts zerstören) */
    s.list = s.list.filter(r => r && typeof r === "object" && Z.ENEMIES[r.type] && Array.isArray(r.name) && Array.isArray(r.traits) && Array.isArray(r.weak));
    for (const r of s.list) { r.rank = U.clamp(r.rank | 0, 1, 5); r.known = Array.isArray(r.known) ? r.known : []; r.hist = Array.isArray(r.hist) ? r.hist.slice(-12) : []; r.scars = r.scars | 0; r.kills = r.kills | 0; r.wins = r.wins | 0; r.meets = r.meets | 0; r.returns = r.returns | 0; if (!Array.isArray(r.ep)) r.ep = ["der Namenlose", "the Nameless"]; }
    return s;
  };
  S0();
  NM.store = S0;
  const active = () => S0().list.filter(r => r.status === "aktiv");
  const fullName = r => L(r.name) + " " + L(r.ep);
  const typeName = r => L((Z.ENEMIES[r.type] || { n: ["?", "?"] }).n);
  function news(de, en) { const s = S0(); s.news.unshift({ run: M().runs || 0, txt: [de, en] }); if (s.news.length > 10) s.news.length = 10; }
  function hist(rec, k, o) { rec.hist.push(Object.assign({ k, run: M().runs || 0, area: Z.level ? Z.level.id : "" }, o || {})); if (rec.hist.length > 12) rec.hist.shift(); }
  function rollTraits(rec, R, nT, nW) {
    const d = Z.ENEMIES[rec.type] || {};
    const okT = id => !rec.traits.includes(id) && !(TRAIT[id].ok && !TRAIT[id].ok(d)) && !rec.weak.includes(TRAIT_NO[id]) &&
      !(id === "feuerfest" && (d.immune || []).includes("burn")) && !(id === "giftfest" && (d.immune || []).includes("poison"));
    const okW = id => !rec.weak.includes(id) && !(WEAK[id].no && rec.traits.includes(WEAK[id].no)) && !(id === "feuerscheu" && (d.immune || []).includes("burn")) && !(id === "giftanfaellig" && (d.immune || []).includes("poison")) && !(id === "sturzschwach" && d.fly);
    for (let i = 0; i < nT; i++) { const l = Object.keys(TRAIT).filter(okT); if (l.length) rec.traits.push(R.pick(l)); }
    for (let i = 0; i < nW; i++) { const l = Object.keys(WEAK).filter(okW); if (l.length) rec.weak.push(R.pick(l)); }
  }
  /* aus der letzten Begegnung lernen: die Schadensart, mit der Ezekiel am meisten ausgeteilt hat, wird zur Stärke */
  function learn(rec) {
    const s = rec.taken; if (!s) return null;
    let best = null, bv = 0; for (const k in s) if (s[k] > bv) { bv = s[k]; best = k; }
    rec.taken = null;
    const map = { feuer: "feuerfest", gift: "giftfest", fern: "pfeilfest", nah: Z.R() < 0.5 ? "gepanzert" : "ausweicher", falle: null };
    const tr = map[best]; if (!tr || rec.traits.includes(tr)) return null;
    const wk = TRAIT_NO[tr]; if (wk) { rec.weak = rec.weak.filter(w => w !== wk); rec.known = rec.known.filter(w => w !== wk); }
    rec.traits.push(tr); rec.lesson = tr; return tr;
  }
  function makeTrophy() {
    const P = Z.player; if (!P || !P.slots) return null;
    const it = (P.act && P.act.it && P.act.it.type !== "skill" && P.act.it) || P.slots.a1 || P.slots.a2; if (!it) return null;
    const d = Z.WEAPONS[it.id]; if (!d) return null;
    return { id: it.id, icon: d.icon, col: d.col, n: d.n, rar: it.rar | 0 };
  }
  function create(e, kind, why) {
    const s = S0(), R = Z.Rng(((Date.now() & 0xffffff) ^ (s.seq * 7919) ^ ((Math.random() * 1e9) | 0)) >>> 0), fam = FAM[e.id] || "mensch";
    let name = genName(fam, R); for (let i = 0; i < 6 && s.list.some(r => r.name[0] === name[0]); i++) name = genName(fam, R);
    const rec = { id: s.seq++, type: e.id, fam, name, ep: R.pick(EPI[why === "wound" ? "wunde" : kind] || EPI.klinge).slice(), rank: 1, traits: [], weak: [], known: [], scars: why === "wound" ? 0 : 0, burnt: 0,
      trophy: why === "kill" ? makeTrophy() : null, kills: why === "kill" ? 1 : 0, wins: 0, meets: 1, returns: 0, born: M().runs || 0, seed: (R() * 1e9) | 0, hist: [], status: "aktiv", lastRun: M().runs || 0, home: Z.level ? Z.level.id : "torhof", taken: null };
    rollTraits(rec, R, 1, 2);
    hist(rec, why, { kind });
    s.list.push(rec);
    cap(rec);
    news(name[0] + " " + rec.ep[0] + " ist zum Nemesis aufgestiegen.", name[1] + " " + rec.ep[1] + " has risen as a nemesis.");
    saveSoon();
    return rec;
  }
  function rankUp(rec, why, o) {
    o = o || {};
    const R = Z.Rng((rec.seed + rec.rank * 977 + (rec.kills | 0) * 31) >>> 0);
    const before = rec.rank;
    rec.rank = Math.min(5, rec.rank + (o.n || 1));
    if (rec.rank > before) {
      rollTraits(rec, R, 1, 0);
      /* höhere Ränge legen eine Schwäche ab (sie lernen) – aber nie die letzte */
      if (rec.rank >= 3 && rec.weak.length > 1 && R() < 0.5) { const w = R.pick(rec.weak); rec.weak = rec.weak.filter(x => x !== w); rec.known = rec.known.filter(x => x !== w); }
    }
    if (why === "kill" && rec.kills >= 2 && R() < 0.6) rec.ep = R.pick(EPI.hoch).slice();
    if (why === "macht" && R() < 0.5) rec.ep = R.pick(EPI.macht).slice();
    hist(rec, why, o);
    saveSoon();
    return rec.rank > before;
  }
  function cap(keep) {
    const s = S0(); let act = active();
    while (act.length > 5) {
      const out = act.filter(r => r !== keep).sort((a, b) => a.rank - b.rank || a.lastRun - b.lastRun)[0]; if (!out) break;
      out.status = "verdraengt"; s.fallen.unshift(Object.assign({}, out, { end: ["verdrängt", "displaced"], endRun: M().runs || 0 }));
      s.list = s.list.filter(r => r !== out);
      news(out.name[0] + " wurde aus der Rangfolge verdrängt und verschwand in den Tiefen.", out.name[1] + " was pushed out of the ranks and vanished into the depths.");
      act = active();
    }
    if (s.fallen.length > 14) s.fallen.length = 14;
  }
  function bury(rec, why) {
    const s = S0(); rec.status = "tot";
    s.list = s.list.filter(r => r !== rec);
    s.fallen.unshift(Object.assign({}, rec, { end: why || ["von Ezekiel besiegt", "defeated by Ezekiel"], endRun: M().runs || 0 }));
    if (s.fallen.length > 14) s.fallen.length = 14;
  }
  /* Bei jedem neuen Lauf: Machtkämpfe und Aufstiege im Schatten */
  function shadowWar() {
    const s = S0(), act = active(), R = Z.R;
    for (const r of act) {
      if (r.lastRun < (M().runs || 0) - 1 && r.rank < 4 && R() < 0.08) { rankUp(r, "aufstieg"); news(r.name[0] + " ist im Schatten zum " + RANK[r.rank][0] + " aufgestiegen.", r.name[1] + " rose in the shadows to " + RANK[r.rank][1] + "."); }
    }
    if (act.length >= 2 && R() < 0.1) {
      const [a, b] = R.shuffle(act.slice()).slice(0, 2);
      const win = a.rank + R() * 2.2 > b.rank + R() * 2.2 ? a : b, lose = win === a ? b : a;
      rankUp(win, "macht", { rival: lose.name });
      bury(lose, ["im Machtkampf von " + win.name[0] + " getötet", "killed by " + win.name[1] + " in a power struggle"]);
      news(win.name[0] + " hat " + lose.name[0] + " im Machtkampf erschlagen und ist jetzt " + RANK[win.rank][0] + ".", win.name[1] + " slew " + lose.name[1] + " in a power struggle and is now " + RANK[win.rank][1] + ".");
    }
    Z.saveMeta();
  }

  /* ---------- Gedächtnis: Sprüche bei Wiederbegegnung ---------- */
  const lastHist = (rec, skip) => { for (let i = rec.hist.length - 1; i >= 0; i--) if (!(skip || []).includes(rec.hist[i].k)) return rec.hist[i]; return null; };
  const fmt = (s, o) => s.replace(/\{(\w+)\}/g, (_, k) => (o[k] != null ? o[k] : ""));
  /* „Letztes Mal im Torhof …“ – Ortsangaben mit passender Präposition */
  const AREA_IN = { torhof: ["im Torhof", "in the Gate Yard"], keller: ["in den Kellern", "in the Cellars"], hallen: ["in den Burghallen", "in the Great Halls"], wehrgang: ["auf dem Wehrgang", "on the Ramparts"],
    verlies: ["im Verlies", "in the Dungeon"], hafen: ["im Hafen", "in the Harbour"], glocken: ["im Glockenturm", "in the Bell Tower"], schlund: ["im Spinnenschlund", "in the Spider Chasm"], schmiede: ["in der Runenschmiede", "in the Rune Forge"],
    zinnen: ["auf den Zinnen", "on the Spires"], see: ["am schwarzen See", "at the Black Lake"], glut: ["in den Glutgassen", "in the Ember Alleys"], sturm: ["auf der Sturmspitze", "on the Storm Spire"] };
  const areaIn = id => (AREA_IN[id] ? L(AREA_IN[id]) : L(["in ", "in "]) + Z.areaName(id));
  const LINES = {
    kill: [["Du schon wieder? Letztes Mal {area} hast du nicht so tapfer geschaut.", "You again? Last time {area} you didn't look so brave."], ["Weißt du noch, {area}? Ich schon. Jede Nacht.", "Remember, {area}? I do. Every night."], ["Der Zerstörer! Zerstört – von mir.", "The Destroyer! Destroyed – by me."], ["Ich hab den anderen erzählt, wie du gefallen bist. Sie lachen immer noch.", "I told the others how you fell. They're still laughing."]],
    trophy: [["Erkennst du das hier? {weapon}. Willst du es zurück?", "Recognise this? {weapon}. Want it back?"], ["{weapon} – gehört jetzt mir. Wie dein Ruf.", "{weapon} – mine now. Like your reputation."]],
    kills: [["{n} Mal hab ich dich schon begraben. Was ist eins mehr?", "I've buried you {n} times already. What's one more?"]],
    ret: [["Du hast mich {area} liegen lassen. Fehler.", "You left me lying {area}. Mistake."], ["Sieh dir diese Narben an. Jede trägt deinen Namen.", "Look at these scars. Each one bears your name."], ["Tot? Ich? Nicht heute, Zerstörer.", "Dead? Me? Not today, Destroyer."]],
    burnt: [["Das Feuer hat mich nicht geholt. Du wirst es auch nicht.", "The fire didn't take me. Neither will you."]],
    wound: [["Ich bin dir {area} entkommen. Diesmal entkommst du mir nicht.", "I escaped you {area}. This time you won't escape me."], ["Mein Blut hast du gesehen. Jetzt sehe ich deins.", "You saw my blood. Now I'll see yours."]],
    macht: [["Ich habe {rival} zerrissen, um hier zu stehen.", "I tore {rival} apart to stand here."]],
    aufstieg: [["Während du schliefst, bin ich gewachsen.", "While you slept, I grew."]],
    first: [["Jetzt kennt die Feste meinen Namen.", "Now the keep knows my name."]],
    top: [["Die ganze Feste flüstert meinen Namen. Nicht deinen.", "The whole keep whispers my name. Not yours."]],
    lesson: [["Ich hab gelernt, Zerstörer. Das klappt nicht noch einmal.", "I learned, Destroyer. That won't work twice."]],
    hurt: [["Ha! Wie letztes Mal!", "Ha! Just like last time!"], ["Blute, Zerstörer!", "Bleed, Destroyer!"], ["Zu langsam!", "Too slow!"], ["Das wird ein schönes Lied.", "That'll make a fine song."]],
    rage: [["Jetzt wird es ernst!", "Now it gets serious!"], ["Du hast mich wütend gemacht!", "You've made me angry!"]],
    die: [["Das … war nicht … das Ende …", "This … isn't … the end …"], ["Unmöglich …", "Impossible…"], ["Die anderen … werden dich holen …", "The others … will come for you …"]],
    flee: [["Ein andermal, Zerstörer!", "Another time, Destroyer!"]]
  };
  const FAMLINE = {
    goblin: [["Hihi! Für deinen Kopf gibt's Extra-Pilze!", "Hehe! Your head's worth extra mushrooms!"]], untot: [["Der Tod hat mich nicht gewollt. Dich will er.", "Death didn't want me. It wants you."]],
    robe: [["Die Roben vergessen nicht.", "The Robes do not forget."]], mensch: [["Im Namen der Feste: steh still.", "In the keep's name: stand still."]], drow: [["Oberflächenwurm. Diesmal tanzt du für mich.", "Surface worm. This time you dance for me."]],
    duergar: [["Ich hab dein Grab schon geschmiedet.", "I've already forged your grave."]], spinne: [["Ssso viel Fleisch, ssso wenig Verstand.", "Ssso much meat, ssso little sense."]], fisch: [["Blubb. Die Tiefe ruft dich.", "Blub. The deep is calling you."]],
    bestie: [["*Ein tiefes, wiedererkennendes Knurren.*", "*A low, knowing growl.*"]], konstrukt: [["ZIEL ERKANNT. ZIEL WIEDERHOLT.", "TARGET RECOGNISED. TARGET REPEATED."]], blight: [["Die Wurzeln erinnern sich an dein Blut.", "The roots remember your blood."]],
    daemon: [["Dein Darkin-Blut schmeckt nach mehr.", "Your Darkin blood tastes like more."]],
    kobold: [["Ich hab Licht! Du hast Angst! Hihi!", "I've got light! You've got fear! Heehee!"]], schleim: [["*Blubbernd:* Du klebst noch an mir.", "*Bubbling:* You still stick to me."]],
    mimik: [["*Der Deckel klappert erwartungsvoll.*", "*The lid rattles expectantly.*"]], kenku: [["„Steh still“, sagst du. „Steh still“, sage ich.", "\"Stand still,\" you say. \"Stand still,\" I say."]],
    grimlock: [["*Schnüffelt.* Ich höre dein Herz. Es rennt.", "*Sniffs.* I hear your heart. It's running."]], pilz: [["Alle Sporen erinnern sich. Alle.", "All spores remember. All of them."]],
    stein: [["Ich habe von oben zugesehen. Jahrhundertelang.", "I've watched from above. For centuries."]], glut: [["Ich brenne heller seit deinem Tod.", "I burn brighter since your death."]]
  };
  function memoryLine(rec) {
    const R = Z.R, last = lastHist(rec, ["meet"]) || {}, o = { area: areaIn(last.area || rec.home), weapon: rec.trophy ? L(rec.trophy.n) : "", n: rec.kills, rival: last.rival ? L(last.rival) : "" };
    const pool = [];
    if (rec.lesson && rec.meets > 1) pool.push(...LINES.lesson);
    if (rec.rank >= 5) pool.push(...LINES.top);
    if (last.k === "kill") { pool.push(...LINES.kill); if (rec.trophy) pool.push(...LINES.trophy, ...LINES.trophy); if (rec.kills >= 2) pool.push(...LINES.kills); }
    if (last.k === "return") pool.push(...(rec.burnt ? LINES.burnt : []), ...LINES.ret);
    if (last.k === "wound") pool.push(...LINES.wound);
    if (last.k === "macht") pool.push(...LINES.macht);
    if (last.k === "aufstieg") pool.push(...LINES.aufstieg);
    if (FAMLINE[rec.fam] && R() < 0.3) pool.push(...FAMLINE[rec.fam]);
    if (!pool.length) pool.push(...LINES.first);
    return fmt(L(R.pick(pool)), o);
  }

  /* ---------- Wer hat Ezekiel getroffen? ---------- */
  /* Geschosse und Gefahrenzonen tragen ihren Urheber; ohne Angabe wird der Schütze geschätzt */
  function actingEnemy(x, y) {
    let best = null, bd = 1e9;
    for (const e of Z.enemies) {
      if (e.dead || !e.act) continue;
      if (e.act.phase !== "act" || e.act.t > 0.12) continue;
      const dx = e.x + e.w / 2 - x, dy = e.y + e.h / 2 - y; if (dx > bd || -dx > bd || dy > bd || -dy > bd) continue; /* W9: billige Vorauswahl (Handheld) */
      const d = Math.hypot(dx, dy); if (d < bd) { bd = d; best = e; }
    }
    if (best) return best;
    bd = 70;
    for (const e of Z.enemies) { if (e.dead) continue; const dx = e.x + e.w / 2 - x, dy = e.y + e.h / 2 - y; if (dx > bd || -dx > bd || dy > bd || -dy > bd) continue; const d = Math.hypot(dx, dy); if (d < bd) { bd = d; best = e; } }
    return best;
  }
  const sp0 = Z.spawnProj;
  Z.spawnProj = function (kind, x, y, dir, o) {
    const p = sp0.apply(this, arguments);
    if (p && typeof kind === "string" && kind.startsWith("e_") && !p.nmSrc) { try { p.nmSrc = actingEnemy(x, y); } catch (_) {} }
    return p;
  };
  const sh0 = Z.spawnHazard;
  Z.spawnHazard = function (o) {
    const h = sh0.apply(this, arguments);
    if (h && h.owner === "e" && !h.nmSrc) { try { h.nmSrc = actingEnemy(h.x, h.y); } catch (_) {} }
    return h;
  };
  function guessSrc(o) {
    if (!o || o.trap || o.fall) return null;
    if (o.attacker) return o.attacker;
    if (o.proj && o.proj.nmSrc) return o.proj.nmSrc;
    const [cx, cy] = playerC();
    for (const q of Z.projs) if (q.owner === "e" && q.nmSrc && Math.abs(q.x - cx) < 18 && Math.abs(q.y - cy) < 22) return q.nmSrc;
    if (o.x != null) for (const h of Z.hazards) if (h.owner === "e" && h.nmSrc && Math.abs(h.x - o.x) < 1) return h.nmSrc;
    let best = null, bd = 150;
    for (const e of Z.enemies) { if (e.dead || !e.aware) continue; const dx = e.x + e.w / 2 - cx, dy = e.y + e.h / 2 - cy; if (dx > bd || -dx > bd || dy > bd || -dy > bd) continue; const d = Math.hypot(dx, dy); if (d < bd) { bd = d; best = e; } }
    return best;
  }
  function hitKind(o, e) {
    if (o && o.eff && o.eff.burn) return "feuer";
    if (o && o.eff && o.eff.poison) return "gift";
    const a = e && e.act && e.act.a;
    if (a) {
      if (a.k === "grab") return "griff";
      if (a.k === "explode") return "knall";
      if (a.k === "slam" || a.k === "charge") return "wucht";
      if (a.k === "spray") return "feuer";
      if (["shoot", "volley", "web"].includes(a.k)) return "schuss";
      if (["mark", "beam", "lob"].includes(a.k)) return "zauber";
    }
    if (o && o.proj) return "schuss";
    if (o && o.melee) return e && e.def && (e.def.heavy || (e.size || 1) > 1.3) ? "wucht" : "klinge";
    return "list";
  }
  let lastHit = null;
  const hurt0 = Z.hurtPlayer;
  Z.hurtPlayer = function (dmg, o) {
    const P = Z.player, before = P ? P.hp : 0;
    let src = null; try { src = guessSrc(o); } catch (_) {}
    const prev = lastHit;
    if (src) lastHit = { e: src, kind: hitKind(o, src), at: now() };
    const r = hurt0.apply(this, arguments);
    if (P && P.hp < before) {
      if (src) {
        src.nmDealt = (src.nmDealt || 0) + (before - Math.max(0, P.hp));
        if (src.nm && !src.dead) onNemHurtPlayer(src, before - P.hp);
        if (src.nmHunter && !src.dead && KG.onHurt) KG.onHurt(src);
      }
    } else lastHit = prev;
    return r;
  };

  /* ---------- Ernennung beim Tod ---------- */
  const EXCL = new Set(["spinnchen", "glutlingKlein", "brutsack", "puppe", "phiole", "zombieBlaeh"]);
  const eligible = e => e && e.def && !e.def.boss && Z.ENEMIES[e.id] && FAM[e.id] && !EXCL.has(e.id) && !e.dummy && !e.master && !e.nmMini && !e.nmHunter && !e.nmEvent && e.def.ai !== "exploder";
  let deathNote = null, deathLv = null;
  function onDeath(o) {
    deathNote = null;
    const hit = lastHit && now() - lastHit.at < 3 ? lastHit : null;
    let e = (o && o.attacker) || (hit && hit.e);
    const kind = hit && hit.e === e ? hit.kind : hitKind(o, e);
    deathLv = Z.level;
    if (!e) return;
    e.nmKiller = true;
    if (e.nmHunter) { if (KG.onKill) KG.onKill(e); return; }
    if (e.nm) {
      const rec = e.nm; rec.kills++; if (!rec.trophy) rec.trophy = makeTrophy();
      const lesson = learn(rec);
      const up = rankUp(rec, "kill", { kind });
      deathNote = { rec, fresh: false, up, lesson };
      news(fullName(rec) + " hat Ezekiel erneut besiegt.", rec.name[1] + " " + rec.ep[1] + " defeated Ezekiel again.");
    } else if (eligible(e)) {
      const rec = create(e, kind, "kill");
      deathNote = { rec, fresh: true };
    }
    Z.saveMeta();
  }
  /* Wer Ezekiel schwer zugesetzt hat und lebend zurückbleibt, wenn er das Gebiet verlässt, merkt sich das */
  function woundCheck() {
    const P = Z.player, lv = Z.level; if (!P || P.dead || !normalLevel(lv) || lv === deathLv) return;
    let best = null; for (const e of Z.enemies) if (!e.dead && eligible(e) && !e.nm && !e.nmKiller && (e.nmDealt || 0) >= P.hpMax * 0.45 && (!best || e.nmDealt > best.nmDealt)) best = e;
    if (!best || Z.R() > 0.6) return;
    const rec = create(best, "wunde", "wound");
    later(() => note("☠ <b>" + esc(fullName(rec)) + "</b><br><small>" + esc(L(["hat dich schwer verwundet und lebend zurückgelassen. Er wird davon erzählen …", "wounded you badly and was left alive. He'll be telling tales…"])) + "</small>", 4200), 1800);
  }

  /* ---------- Auftritt im Gebiet ---------- */
  let live = [];
  function dress(e, rec) {
    const d = Object.assign({}, e.def); e.def = d; e.nm = rec; e.elite = false;
    const has = id => rec.traits.includes(id), weak = id => rec.weak.includes(id);
    d.immune = (d.immune || []).slice();
    let hpM = 2.4 + 0.55 * rec.rank, dmM = 1.1 + 0.07 * rec.rank;
    const k = 1.1 + 0.035 * rec.rank;
    if (routeN() <= 1) { hpM *= 0.6; dmM *= 0.85; }
    if (has("zaeh")) hpM *= 1.4;
    if (has("feuerfest")) d.immune.push("burn");
    if (has("giftfest")) d.immune.push("poison");
    if (has("schild")) d.front = true;
    if (has("unaufhaltsam")) { d.poise = Math.max(d.poise || 0.12, 0.7); d.heavy = true; }
    if (has("flink")) d.spd = (d.spd || 80) * 1.28;
    d.sight = (d.sight || 180) * 1.35;
    d.atks = (d.atks || []).map(a => {
      const b = Object.assign({}, a);
      if (has("flink")) { b.pre = (b.pre || 0.4) * 0.86; b.cd = (b.cd || 0.6) * 0.8; }
      if (has("unaufhaltsam") && b.box) b.armor = true;
      if (has("brandklinge") && b.box) b.eff = Object.assign({}, b.eff || {}, { burn: 1 });
      if (has("giftklinge") && b.box) b.eff = Object.assign({}, b.eff || {}, { poison: 1 });
      if (weak("kopflos") && (b.glyph === "!!" || b.armor)) b.post = (b.post || 0.4) * 2.2;
      return b;
    });
    e.hp = e.hpMax = Math.round(e.hpMax * hpM); e.dmgMul *= dmM;
    resize(e, k);
    e.nmPhase = 0; e.nmCall = 0; e.nmIdle = 0; e.nmTaunt = 0; e.nmTell = {};
  }
  function resize(e, k) {
    const cx = e.x + e.w / 2, fy = e.y + e.h;
    e.size = (e.size || 1) * k; e.w = Math.round(e.w * k); e.h = Math.round(e.h * k); e.x = cx - e.w / 2; e.y = fy - e.h;
    if (Z.unstick) Z.unstick(e);
  }
  function spawnRec(rec, lv, at) {
    let x, y;
    if (at) { x = at.x; y = at.y; }
    else {
      const sp = farSpot(lv, { min: routeN() <= 1 ? 40 : 30, head: 3, need: 4 }) || farSpot(lv, { min: 14, head: 2, need: 2 }); if (!sp) return null;
      x = sx(sp.s); y = sy(sp.s);
    }
    const e = Z.spawnEnemy(rec.type, x, y, { tier: Z.run ? Z.run.tier : 0 }); if (!e) return null;
    dress(e, rec); e.spawnT = 0; live.push(e);
    return e;
  }
  function setupArea(lv) {
    live = [];
    if (!normalLevel(lv)) return;
    const run = Z.run; run.nmBeaten = run.nmBeaten || {}; run.nmMet = run.nmMet || 0;
    const act = active().filter(r => !run.nmBeaten[r.id]); if (!act.length) return;
    let budget = Z.run.tier >= 4 && act.length >= 4 && Z.R() < 0.25 ? 2 : 1;
    const first = routeN() <= 1, busy = (EV.current && EV.current()) || (KG.active && KG.active()) ? 0.55 : 1;
    for (const rec of Z.R.shuffle(act.slice()).sort((a, b) => b.rank - a.rank)) {
      if (budget <= 0) break;
      let p = 0.16 + 0.05 * rec.rank;
      if (rec.home === lv.id) p *= 2.2;
      if (S0().target === rec.id) p *= 1.8;
      const lh = lastHist(rec, ["meet"]);
      if (lh && lh.k === "kill" && rec.lastRun >= (M().runs || 0) - 1) p += 0.2;
      if (first) p *= rec.home === lv.id ? 0.6 : 0.2;
      if (run.nmMet >= 3) p *= 0.5;
      p = Math.min(0.72, p * busy);
      if (NM.forceNext === rec.id || NM.forceNext === true || Z.R() < p) { if (spawnRec(rec, lv)) budget--; }
    }
    NM.forceNext = null;
  }
  function intro(e) {
    if (e.nmIntro || e.dead) return; e.nmIntro = true;
    const rec = e.nm; rec.meets++; rec.lastRun = M().runs || 0; Z.run.nmMet = (Z.run.nmMet || 0) + 1;
    /* bei jeder Wiederbegegnung wird eine Schwäche bekannt (Ezekiel erinnert sich auch) */
    if (rec.meets >= 2) { const unk = rec.weak.filter(w => !rec.known.includes(w)); if (unk.length) rec.known.push(Z.R.pick(unk)); }
    hist(rec, "meet");
    e.aware = true; e.act = null; e.cd = Math.max(e.cd, 1.6); e.invuln = Math.max(e.invuln || 0, 0.5); e.vx = 0;
    e.face = Math.sign(Z.player.x - e.x) || 1;
    say(e, memoryLine(rec), { who: L(rec.name), life: 4.4 });
    const lines = [];
    if (rec.traits.length) lines.push(["▲ " + rec.traits.map(t => L(TRAIT[t].n)).join(" · "), "#5a3a1a"]);
    if (rec.weak.length) lines.push(["▼ " + rec.weak.map(w => (rec.known.includes(w) ? L(WEAK[w].n) : "???")).join(" · "), "#8a1a14"]);
    if (rec.trophy) lines.push([L(["Trophäe: ", "Trophy: "]) + L(rec.trophy.n), "#6a4a2a"]);
    banner({ kind: "nemesis", head: L(["Nemesis", "Nemesis"]), name: L(rec.name), sub: L(rec.ep), pips: rec.rank, rankName: L(RANK[rec.rank]) + " · " + typeName(rec), lines, life: 4.6 });
    camPan(e.x + e.w / 2, e.y + e.h / 2, 1.6);
    FX.slowmo(0.45, 0.6); FX.addShake(3);
    A.play("gong", { vol: 0.4 }); A.play(e.def.snd || "roar", { x: e.x, vol: 0.55, rate: 0.85 });
    FX.burst(e.x + e.w / 2, e.y + e.h, 22, { col: ["#2a1014", "#6a1a1a", "#c8302a"], sp: 90, ang: -PI / 2, spread: 2.6, life: 0.8, size: 4, kind: "smoke", g: -20 });
    motif(rec.seed);
    saveSoon();
  }
  function onNemHurtPlayer(e, dmg) {
    const rec = e.nm;
    if (rec.traits.includes("blutrausch")) { e.hp = Math.min(e.hpMax, e.hp + e.hpMax * 0.08); FX.text(e.x + e.w / 2, e.y - 8, "+" + Math.round(e.hpMax * 0.08), "#c8302a"); }
    if (e.nmTaunt <= 0 && Z.R() < 0.45) { e.nmTaunt = 7; say(e, L(Z.R.pick(LINES.hurt)), { who: L(rec.name), life: 2.2 }); }
  }
  /* Schaden an einem Nemesis: Stärken und Schwächen wirken – und werden lesbar angezeigt */
  function tell(e, key, txt, col) { if ((e.nmTell[key] || 0) > now()) return; e.nmTell[key] = now() + 2.5; FX.text(e.x + e.w / 2, e.y - 14, txt, col, true); }
  function reveal(e, w) {
    const rec = e.nm; if (rec.known.includes(w)) { tell(e, w, L(WEAK[w].n) + "!", "#ff6a5a"); return; }
    rec.known.push(w); saveSoon();
    tell(e, w, L(["Schwäche: ", "Weakness: "]) + L(WEAK[w].n) + "!", "#ff6a5a");
    A.play("crit", { x: e.x, vol: 0.5 });
  }
  function modDamage(e, dmg, o) {
    const rec = e.nm, tr = id => rec.traits.includes(id), wk = id => rec.weak.includes(id), P = Z.player;
    const fire = !!((o.eff && o.eff.burn) || (o.dot && o.col === "#ff8a3a"));
    const poison = !!((o.eff && o.eff.poison) || (o.dot && o.col === "#9ad04a"));
    let m = 1;
    rec.taken = rec.taken || {};
    const k = fire ? "feuer" : poison ? "gift" : o.src === "ranged" ? "fern" : o.src === "trap" || o.src === "fall" ? "falle" : o.src === "melee" ? "nah" : null;
    if (k) rec.taken[k] = (rec.taken[k] || 0) + dmg;
    if (fire) { if (tr("feuerfest")) { m *= 0.35; tell(e, "ff", L(TRAIT.feuerfest.n), "#ffb070"); } if (wk("feuerscheu")) { m *= 2; reveal(e, "feuerscheu"); Z.addStatus(e, "fear", 1.4); } }
    if (poison) { if (tr("giftfest")) { m *= 0.3; tell(e, "gf", L(TRAIT.giftfest.n), "#c8e070"); } if (wk("giftanfaellig")) { m *= 2; reveal(e, "giftanfaellig"); } }
    if (o.src === "ranged") { if (tr("pfeilfest")) { m *= 0.4; tell(e, "pf", L(TRAIT.pfeilfest.n), "#e8e0d0"); FX.burst(e.x + e.w / 2, e.y + e.h * 0.4, 5, { col: "#fff0c0", sp: 90, life: 0.2, size: 1.4, kind: "spark", add: true }); } if (wk("fernschwach")) { m *= 1.7; reveal(e, "fernschwach"); } }
    if ((o.src === "trap" || o.src === "fall") && wk("fallenangst")) { m *= 3; reveal(e, "fallenangst"); Z.addStatus(e, "stun", 1.5); }
    if (o.src === "parry" && wk("paradeschwach")) { m *= 2; reveal(e, "paradeschwach"); Z.addStatus(e, "stun", 2.6); e.nmOpen = 2.6; }
    if (e.nmOpen > 0 && !o.dot) m *= 1.5;
    if (o.src === "melee" && P && !o.dot) {
      const behind = (P.x + P.w / 2 < e.x + e.w / 2) === (e.face > 0);
      if (behind && wk("ruecken")) { m *= 1.8; reveal(e, "ruecken"); }
      if (o.heavy && o.eff && o.eff.stun === 0.7 && wk("sturzschwach")) { m *= 2.5; reveal(e, "sturzschwach"); Z.addStatus(e, "stun", 1.2); }
      if (tr("ausweicher") && !e.act && !(e.nmDodge > now()) && !(e.st.stun > 0) && Z.R() < 0.3) {
        e.nmDodge = now() + 3; const dir = U.sign(e.x - P.x) || 1; e.vx = dir * 260; e.vy = e.def.fly ? 0 : -170; e.kbT = 0.2;
        FX.burst(e.x + e.w / 2, e.y + e.h * 0.5, 10, { col: ["#e8e0d0", "#a89a8a"], sp: 70, life: 0.35, size: 3, kind: "smoke" });
        tell(e, "aw", L(["Ausgewichen!", "Dodged!"]), "#e8e0d0"); A.play("roll", { x: e.x, vol: 0.5 });
        return null;
      }
    }
    if (wk("hochmut") && e.hp > e.hpMax * 0.8 && !o.dot) { m *= 1.5; if (e.hp - dmg * m < e.hpMax * 0.8) reveal(e, "hochmut"); }
    if (wk("zornangst") && P && P.wrath > 0) m *= 1.5;
    if (tr("gepanzert") && !o.dot) m *= 0.7;
    return dmg * m;
  }
  function afterHit(e, dmg, o) {
    const rec = e.nm; e.nmIdle = 0;
    if (!e.nmIntro) intro(e);
    if (rec.traits.includes("dornen") && o.src === "melee" && !o.dot && Z.player && !Z.player.dead && !(e.nmThorn > now())) {
      e.nmThorn = now() + 0.4; const P = Z.player;
      if (P.iframe <= 0) { P.hp = Math.max(1, P.hp - Math.max(1, Math.round(dmg * 0.15))); FX.text(P.x + P.w / 2, P.y - 4, "-" + Math.max(1, Math.round(dmg * 0.15)), "#c8302a"); tell(e, "dn", L(TRAIT.dornen.n), "#c8302a"); }
    }
  }
  function nemTick(dt) {
    const P = Z.player; if (!P) return;
    for (let i = live.length - 1; i >= 0; i--) {
      const e = live[i];
      if (e.dead || !inLv(e)) { live.splice(i, 1); continue; }
      const rec = e.nm, cx = e.x + e.w / 2, cy = e.y + e.h / 2, d = distP(cx, cy);
      if (e.nmTaunt > 0) e.nmTaunt -= dt;
      if (e.nmOpen > 0) e.nmOpen -= dt;
      if (!e.nmIntro) { if (!P.dead && d < 200 && (e.aware || W.los(cx, e.y + 6, P.x + P.w / 2, P.y + 8))) intro(e); continue; }
      /* ein Nemesis vergisst nicht: einmal gesehen, bleibt er hinter Ezekiel her */
      if (d < 420 && !P.dead) e.aware = true;
      const frac = e.hp / e.hpMax;
      if (rec.traits.includes("rachsuechtig") && !e.nmRage && frac < 0.5) {
        e.nmRage = true; e.dmgMul *= 1.3; e.def = Object.assign({}, e.def, { spd: (e.def.spd || 80) * 1.2, atks: e.def.atks.map(a => Object.assign({}, a, { cd: (a.cd || 0.6) * 0.7 })) });
        say(e, L(Z.R.pick(LINES.rage)), { who: L(rec.name), life: 2.4 }); A.play("roar", { x: e.x, vol: 0.6 }); FX.ring(cx, cy, 34, "#ff3a2a", 0.4, 3);
        if (Z.music && Z.music.stinger) Z.music.stinger("phase");
      }
      if (rec.traits.includes("verstaerkung") && ((e.nmCall === 0 && frac < 0.7) || (e.nmCall === 1 && frac < 0.4))) { e.nmCall++; callHelp(e); }
      if (rec.traits.includes("regeneration")) { e.nmIdle += dt; if (e.nmIdle > 4 && e.hp < e.hpMax) { e.hp = Math.min(e.hpMax, e.hp + e.hpMax * 0.025 * dt); if (Math.random() < dt * 6) FX.p({ x: cx + (Math.random() - 0.5) * e.w, y: e.y + e.h * Math.random(), vx: 0, vy: -20, life: 0.6, size: 1.6, col: "#9ad04a", kind: "glow", add: true }); } }
      if (rec.weak.includes("zornangst") && P.wrath > 0 && d < 160) { if (!(e.st.fear > 0)) reveal(e, "zornangst"); Z.addStatus(e, "fear", 0.4); }
    }
  }
  function callHelp(e) {
    const rec = e.nm, lv = Z.level, ids = MINION[rec.fam] || ["goblin"];
    say(e, L(["Zu mir! Alle zu mir!", "To me! All of you, to me!"]), { who: L(rec.name), life: 2.2 });
    A.play("horn", { x: e.x, vol: 0.6 });
    const spots = spotsNear(lv, e.x + e.w / 2, e.y + e.h - 4, 90, 2).filter(s => Math.abs(sx(s) - (Z.player.x + Z.player.w / 2)) > 40);
    for (let i = 0; i < 2; i++) {
      const s = spots.length ? Z.R.pick(spots) : [Math.floor((e.x + e.w / 2) / T), Math.floor((e.y + e.h - 2) / T)];
      later(() => {
        if (e.dead || Z.level !== lv) return;
        const id = Z.R.pick(ids), d0 = Z.ENEMIES[id]; if (!d0) return;
        const m = Z.spawnEnemy(id, sx(s), sy(s) - (d0.fly ? 24 : 0), { tier: Z.run ? Z.run.tier : 0 }); if (!m) return;
        m.aware = true; m.master = e; m.spawnT = 0.4;
        FX.burst(m.x + m.w / 2, m.y + m.h / 2, 12, { col: ["#2a1014", "#6a1a1a"], sp: 70, life: 0.6, size: 3, kind: "smoke" });
      }, 300 + i * 350);
    }
  }
  function onNemDeath(e, o) {
    const rec = e.nm, x = e.x + e.w / 2, y = e.y + e.h, P = Z.player;
    const finisher = !!(o.crit || o.heavy || (e.st && e.st.burn > 0) || o.src === "trap" || o.src === "fall" || (P && P.wrath > 0));
    const ret = !finisher && rec.returns < 2 && Z.R() < 0.42;
    rec.wins++; rec.lastRun = M().runs || 0;
    Z.run.nmBeaten = Z.run.nmBeaten || {}; Z.run.nmBeaten[rec.id] = true;
    const S = S0(); S.slain++;
    say({ x: e.x, y: e.y, w: e.w, h: e.h, gone: true }, L(Z.R.pick(LINES.die)), { x, y: e.y - 4, who: L(rec.name), life: 2.8 });
    loot(rec, x, y);
    FX.slowmo(0.3, 0.8); FX.flashScreen("#ffe0b0", 0.3); A.play("gong", { vol: 0.5, delay: 0.3 });
    if (Z.music && Z.music.stinger) Z.music.stinger("sieg");
    const bounty = bountyOf(rec);
    if (ret) {
      rec.returns++; rec.scars++; if (e.st && e.st.burn > 0) rec.burnt = 1;
      const R = Z.R; if (R() < 0.6) rec.ep = R.pick(rec.burnt ? EPI.verbrannt : EPI.zurueck).slice();
      learn(rec); hist(rec, "return");
      later(() => {
        FX.burst(x, y - 8, 26, { col: ["#3a3030", "#5a4a40", "#2a1014"], sp: 70, life: 1.1, size: 5, kind: "smoke", g: -20 });
        wtext(x, y - 30, L(["… die Leiche ist verschwunden.", "… the body is gone."]), { col: "#e8d8c0", life: 3, size: 8 });
        A.play("shadow", { x, vol: 0.5 });
      }, 1300);
      news(rec.name[0] + " fiel – doch seine Leiche wurde nie gefunden.", rec.name[1] + " fell – but the body was never found.");
    } else {
      bury(rec);
      if (S.target === rec.id) S.target = null;
      news(fullName(rec) + " wurde von Ezekiel erschlagen. Kopfgeld: " + bounty + " Seelensplitter.", rec.name[1] + " " + rec.ep[1] + " was slain by Ezekiel. Bounty: " + bounty + " soul shards.");
      /* Machtvakuum: ein anderer Nemesis rückt auf */
      const others = active(); if (others.length && Z.R() < 0.5) { const r2 = Z.R.pick(others); if (rankUp(r2, "vakuum")) news(r2.name[0] + " nutzt die Lücke und steigt zum " + RANK[r2.rank][0] + " auf.", r2.name[1] + " fills the gap and rises to " + RANK[r2.rank][1] + "."); }
    }
    banner({ kind: "nemesis", head: L(["Nemesis besiegt", "Nemesis defeated"]), seal: "✠", name: L(rec.name), sub: L(rec.ep), lines: [[L(["Kopfgeld: ", "Bounty: "]) + bounty + L([" Seelensplitter", " soul shards"]), "#5a3a1a"]].concat(rec.trophy ? [[L(["Zurückerobert: ", "Reclaimed: "]) + L(rec.trophy.n), "#8a1a14"]] : []), life: 4 });
    Z.saveMeta();
  }
  const bountyOf = rec => Math.round((14 + 11 * rec.rank + 6 * rec.kills) * (1 + 0.25 * ((Z.run && Z.run.skulls) || 0)) * (S0().target === rec.id ? 1.5 : 1));
  function loot(rec, x, y) {
    const run = Z.run || { tier: 0 }, n = rec.rank, trophy = rec.trophy;
    Z.dropGold(x, y - 8, (30 + 25 * n) * Z.BAL.goldMul(run.tier || 0));
    Z.dropShards(x, y - 8, bountyOf(rec));
    later(() => {
      if (Z.spawnReward) Z.spawnReward("glut", x, y, { n: 1 + Math.ceil(n / 2) });
      if (trophy && Z.WEAPONS[trophy.id] && Z.makeItem) {
        const it = Z.makeItem(trophy.id, Math.max(0, run.tier || 0), Math.min(3, (trophy.rar | 0) + 1));
        if (it) { it.plus = Math.min(3, (it.plus || 0) + 1); Z.spawnPickup("item", x + 12, y - 4, { it, drop: true, vy: -240, vx: 40 }); }
        rec.trophy = null;
      } else Z.dropItem(x, y - 4, { elite: true });
      runeDrop(x - 12, y, n);
    }, 600);
  }
  function runeDrop(x, y, n) {
    const R = Z.runen || Z.runes;
    try {
      if (R && typeof R.spawnStone === "function" && (n >= 2 || Z.R() < 0.5)) { R.spawnStone(x, y - 4); return; }
      if (R && typeof R.drop === "function") { R.drop(x, y, { src: "nemesis", rank: n, tier: Z.run ? Z.run.tier : 0 }); return; }
      if (R && typeof R.spawn === "function") { R.spawn(x, y, { src: "nemesis", rank: n }); return; }
      if (typeof Z.dropRune === "function") { Z.dropRune(x, y, { src: "nemesis", rank: n }); return; }
    } catch (err) { console.error(err); }
    if (!Z.spawnReward) return;
    if (n >= 3) Z.spawnReward("segen", x, y); else Z.spawnReward("rolle", x, y, { drop: true });
  }

  /* ---------- Narben, Trophäe, Rangbanner, Namensschild ---------- */
  /* Kopf- und Rückenpunkt je Gestalt (Anteile der Hitbox; x in Blickrichtung) */
  const ANCH = { human: [0.12, 0.13, -0.3, 0.32], goblin: [0.2, 0.18, -0.3, 0.38], skel: [0.12, 0.12, -0.3, 0.32], zombie: [0.2, 0.15, -0.28, 0.35], armor: [0.1, 0.1, -0.3, 0.3], golem: [0.05, 0.12, -0.32, 0.3],
    duergar: [0.12, 0.14, -0.3, 0.34], kuotoa: [0.15, 0.13, -0.28, 0.34], ettercap: [0.15, 0.12, -0.28, 0.32], mane: [0.15, 0.2, -0.3, 0.4], blight: [0.1, 0.12, -0.28, 0.32], wraith: [0.1, 0.12, -0.25, 0.3],
    wolf: [0.42, 0.25, -0.2, 0.2], rat: [0.42, 0.3, -0.2, 0.25], spider: [0.38, 0.3, -0.15, 0.2], crab: [0.3, 0.3, -0.2, 0.2], ray: [0.35, 0.4, -0.2, 0.3], stirge: [0.3, 0.3, -0.2, 0.3], harpy: [0.15, 0.15, -0.3, 0.35],
    wolfrider: [0.1, 0.05, -0.3, 0.25], blob: [0.15, 0.3, -0.2, 0.3], wisp: [0.1, 0.3, -0.2, 0.3],
    drummer: [0.2, 0.18, -0.3, 0.38], schildgoblin: [0.15, 0.18, -0.3, 0.38], kobold: [0.2, 0.18, -0.3, 0.38], cube: [0.1, 0.2, -0.3, 0.3], mimic: [0.3, 0.3, -0.3, 0.3], kenku: [0.12, 0.12, -0.3, 0.32],
    grimlock: [0.2, 0.12, -0.3, 0.32], ghoul: [0.2, 0.2, -0.3, 0.35], bellghost: [0.1, 0.12, -0.25, 0.3], myconid: [0.1, 0.1, -0.3, 0.4], drider: [0.15, 0.08, -0.35, 0.4], rustmonster: [0.4, 0.3, -0.2, 0.25],
    quasit: [0.2, 0.2, -0.2, 0.35], gargoyle: [0.15, 0.18, -0.3, 0.35], grindylow: [0.15, 0.2, -0.3, 0.4], firebat: [0.2, 0.3, -0.2, 0.3], salamander: [0.15, 0.12, -0.3, 0.35], slug: [0.4, 0.45, -0.15, 0.3], mephit: [0.15, 0.2, -0.2, 0.35] };
  const RANKCOL = [null, "#8a6a4a", "#a8401a", "#8a1414", "#5a0e2a", "#2a0a10"];
  function drawDeco(c, e, t) {
    const rec = e.nm; if (!rec || e.dead) return;
    const a = ANCH[e.def.shape] || ANCH.human, f = e.face || 1, s = e.size || 1;
    const cx = e.x + e.w / 2, hx = cx + f * a[0] * e.w, hy = e.y + a[1] * e.h, bx = cx + f * a[2] * e.w, by = e.y + a[3] * e.h;
    const alpha = e.hidden > 0 ? 0.15 : e.spawnT > 0 ? 1 - e.spawnT / 0.4 : 1;
    c.save(); c.globalAlpha = alpha;
    /* Aura: dunkles Rot, pulsierend – höherer Rang, dichter */
    if (!lowG()) glow(c, cx, e.y + e.h * 0.55, e.h * (0.9 + 0.1 * Math.sin(t * 3)), "rgba(150,20,30," + (0.18 + 0.05 * rec.rank) + ")");
    /* Rangbanner auf dem Rücken */
    if (rec.rank >= 2) {
      const top = by - e.h * 0.75 - 6 * s, sw = Math.sin(t * 3 + rec.seed) * 1.6 - (Math.abs(e.vx) > 20 ? 2 * f : 0);
      limb(c, bx, by + 2, bx - f * 1.5, top, 1, "#3a2a1a");
      poly(c, [bx - f * 1.5, top, bx - f * (1.5 + 10 * s) + sw, top + 2, bx - f * (1.5 + 8 * s) + sw, top + 5 * s, bx - f * (1.5 + 10 * s) + sw, top + 9 * s, bx - f * 1.5, top + 8 * s], RANKCOL[rec.rank]);
      c.fillStyle = "#e8d8c0"; c.fillRect(bx - f * (5.5 * s) - 1 + sw * 0.5, top + 3.2 * s, 2, 2); c.fillRect(bx - f * (5.5 * s) - 1.4 + sw * 0.5, top + 4.6 * s, 2.8, 0.8);
    }
    /* Trophäe: Ezekiels Waffe, zerbrochen, auf dem Rücken festgeschnürt */
    if (rec.trophy && Z.drawWeapon) {
      c.save(); c.translate(bx, by + 2); c.scale(f * 0.75 * s, 0.75 * s); c.rotate(-2.1);
      c.beginPath(); c.rect(-14, -8, 18, 16); c.clip();
      try { Z.drawWeapon(c, rec.trophy.icon, rec.trophy.col, t, 0); } catch (_) {}
      c.restore();
      limb(c, bx - 3, by - 1, bx + 3, by + 4, 0.8, "#5a3a22");
    }
    /* Narben (über dem Kopf), Brandmale, Augenklappe */
    if (rec.scars > 0 || rec.burnt) {
      c.strokeStyle = "#e8b8a0"; c.lineWidth = 0.6;
      for (let i = 0; i < Math.min(3, rec.scars); i++) { c.beginPath(); c.moveTo(hx - 2 + i * 1.5, hy - 2); c.lineTo(hx + 1 + i * 1.5, hy + 2.5); c.stroke(); for (let k2 = 0; k2 < 3; k2++) { c.beginPath(); c.moveTo(hx - 1.6 + i * 1.5 + k2 * 0.9, hy - 1 + k2 * 1.3); c.lineTo(hx - 0.4 + i * 1.5 + k2 * 0.9, hy - 1.6 + k2 * 1.3); c.stroke(); } }
      if (rec.scars >= 2) { c.fillStyle = "#1a1010"; c.fillRect(hx + f * 0.5 - 1.2, hy - 1, 2.4, 2); limb(c, hx - 3, hy - 2, hx + 3, hy - 0.4, 0.5, "#1a1010"); }
      if (rec.burnt) { c.globalAlpha = alpha * 0.55; ell(c, hx - f, hy + 1, 2.6, 2, "#2a1a14"); c.globalAlpha = alpha; }
    }
    /* Kriegsbemalung ab Rang 3, Dornenkrone für den Erzfeind */
    if (rec.rank >= 3) { limb(c, hx - 2.4, hy + 0.6, hx + 2.4, hy + 0.6, 0.9, "rgba(200,30,30,.8)"); }
    if (rec.rank >= 5) { for (let i = -2; i <= 2; i++) poly(c, [hx + i * 1.8 - 0.8, hy - 3.6, hx + i * 1.8, hy - 7 - (i % 2 ? 0 : 1.6), hx + i * 1.8 + 0.8, hy - 3.6], "#2a1a1a"); if (!lowG()) glow(c, hx, hy - 4, 8, "rgba(255,60,40,.35)"); }
    c.restore();
    plate(c, e, L(rec.name), L(RANK[rec.rank]), "#c8302a", rec.rank);
  }
  /* Namensschild mit Lebensbalken (zwischengespeichert) */
  function plate(c, e, name, sub, col, pips) {
    const key = name + "|" + sub + "|" + (Z.settings.lang || "de");
    let p = e.nmPlate;
    if (!p || p.key !== key) {
      const cv = document.createElement("canvas"), g = cv.getContext("2d"), S = 3;
      g.font = "800 7px 'Alegreya Sans',sans-serif"; const w1 = g.measureText(name).width; g.font = "italic 700 5.4px 'Alegreya Sans',sans-serif"; const w2 = g.measureText(sub).width;
      const w = Math.ceil(Math.max(w1, w2) + 8), h = 15; cv.width = w * S; cv.height = h * S; g.scale(S, S); g.textAlign = "center";
      g.font = "800 7px 'Alegreya Sans',sans-serif"; g.lineWidth = 2.4; g.strokeStyle = "rgba(10,4,6,.9)"; g.strokeText(name, w / 2, 7); g.fillStyle = "#f4e2c4"; g.fillText(name, w / 2, 7);
      g.font = "italic 700 5.4px 'Alegreya Sans',sans-serif"; g.lineWidth = 2; g.strokeText(sub, w / 2, 13.4); g.fillStyle = col; g.fillText(sub, w / 2, 13.4);
      p = e.nmPlate = { key, cv, w, h };
    }
    if (e.dead || e.hidden > 0 || e.portrait) return;
    const cx = e.x + e.w / 2, named = e.act && e.act.a && e.act.a.name && e.act.phase !== "post", top = e.y - 25 - (pips >= 2 ? 6 : 0) - (named ? 9 : 0);
    c.drawImage(p.cv, cx - p.w / 2, top, p.w, p.h);
    const bw = Math.max(30, e.w + 10), bx = cx - bw / 2, byy = top + p.h + 0.5;
    c.fillStyle = "rgba(10,4,6,.8)"; c.fillRect(bx - 1, byy - 1, bw + 2, 4);
    c.fillStyle = col; c.fillRect(bx, byy, bw * U.clamp(e.hp / e.hpMax, 0, 1), 2);
    if (e.nmOpen > 0) { c.fillStyle = "rgba(255,230,160,.8)"; c.fillRect(bx, byy + 2, bw * U.clamp(e.nmOpen / 2.6, 0, 1), 0.8); }
  }

  /* Porträt einer Gestalt (für Steckbriefe und Prüfbilder): zeichnet einen Schein-Gegner in eine eigene Leinwand */
  function portrait(type, o) {
    o = o || {}; const d0 = Z.ENEMIES[type]; if (!d0) return null;
    const S = o.S || 4, size = o.size || d0.size || 1, w = Math.round((d0.w || 12) * size), h = Math.round((d0.h || 20) * size);
    const W0 = o.w || 48, H0 = o.h || 48, cv = document.createElement("canvas"); cv.width = W0 * S; cv.height = H0 * S;
    const g = cv.getContext("2d"); g.scale(S, S);
    if (o.bg) { g.fillStyle = o.bg; g.fillRect(0, 0, W0, H0); }
    const e = { id: type, def: o.def || d0, x: W0 / 2 - w / 2, y: H0 - 4 - h, w, h, vx: 0, vy: 0, face: o.face || 1, size, hp: 1, hpMax: 1, st: {}, anim: o.t || 1, act: o.act || null, aware: true, onGround: true, spawnT: 0, flash: 0, alertT: 0, uses: {}, cd: 1, tier: 0, nm: o.nm || null, nmLook: o.look, nmHunter: !!o.look, portrait: true };
    try { Z.drawEnemy(g, e, o.t || 1); } catch (err) { console.error(err); }
    return cv;
  }
  NM.portrait = portrait;

  /* ======================= 4. GEMEINSAMES FÜR SONDERGEGNER ======================= */
  /* eigene Angriffsarten: Angriffe mit k: "nm" und nm: "<name>" laufen über die normale Gegner-KI
     (Ausholen mit Glühen und „!“, Name über dem Kopf, Erholung) – was im Schlag passiert, steht hier */
  const NMACT = {};
  /* W9 (Handheld): „lebt e noch in diesem Gebiet?“ – statt Z.enemies.includes (je Aufruf ein Durchlauf) einmal je Bild eine Menge */
  let lvSet = null, lvSetF = -1, lvFrame = 0;
  let lvSetN = -1, lvArr = null;
  function inLv(e) { if (lvSetF !== lvFrame || !lvSet || lvSetN !== Z.enemies.length || lvArr !== Z.enemies) { lvSet = new Set(Z.enemies); lvSetF = lvFrame; lvSetN = Z.enemies.length; lvArr = Z.enemies; } return lvSet.has(e); }
  NM._frame = () => { lvFrame++; };
  function specialTick(dt) {
    for (const e of Z.enemies) {
      if (e.dead || !e.act || !e.act.a || e.act.a.k !== "nm") continue;
      const ac = e.act, h = NMACT[ac.a.nm]; if (!h) continue;
      try {
        if (ac.phase === "pre") { if (!ac.nmAim && Z.player) ac.nmAim = { x: Z.player.x + Z.player.w / 2, y: Z.player.y + Z.player.h }; if (h.pre) h.pre(e, ac, dt); if (ac.a.track !== false && Z.player && ac.t < (ac.a.pre || 0.5) * 0.75) { ac.nmAim.x = U.lerp(ac.nmAim.x, Z.player.x + Z.player.w / 2, Math.min(1, dt * 6)); ac.nmAim.y = Z.player.y + Z.player.h; } }
        else if (ac.phase === "act") { if (!ac.nmGo) { ac.nmGo = true; if (h.start) h.start(e, ac); } else if (h.tick) h.tick(e, ac, dt); }
        else if (ac.phase === "post" && !ac.nmEnd) { ac.nmEnd = true; if (h.end) h.end(e, ac); }
      } catch (err) { console.error(err); }
    }
  }
  /* Phase einer Handlung für die Zeichnung: ph = pre/act/post, u = 0..1 */
  function phs(e) {
    const ac = e.act; if (!ac || !ac.a) return { ph: "", u: 0, k: "", nm: "" };
    const a = ac.a; let u = 0;
    if (ac.phase === "pre") u = U.clamp(ac.t / Math.max(0.01, a.pre || 0.4), 0, 1);
    else if (ac.phase === "act") u = U.clamp(ac.t / Math.max(0.05, (a.act || 0.1) + (a.n && a.gap ? (a.n - 1) * a.gap : 0)), 0, 1);
    else u = U.clamp(ac.t / Math.max(0.01, a.post || 0.3), 0, 1);
    return { ph: ac.phase, u, k: a.k, nm: a.nm || "", a };
  }
  const eo = x => 1 - (1 - x) * (1 - x);
  const swingV = (p, rest, back, fwd) => p.ph === "pre" ? U.lerp(rest, back, eo(p.u)) : p.ph === "act" ? U.lerp(back, fwd, eo(Math.min(1, p.u * 2))) : p.ph === "post" ? U.lerp(fwd, rest, p.u) : rest;
  const SHADE = new Map();
  function shade(col, f) {
    f = f == null ? 0.72 : f; const key = col + f; let r = SHADE.get(key); if (r) return r;
    if (typeof col !== "string" || col[0] !== "#") return col;
    let h = col.slice(1); if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    const n = parseInt(h, 16); const ch = v => Math.max(0, Math.min(255, Math.round(f > 1 ? v + (255 - v) * (f - 1) : v * f)));
    r = "#" + [(n >> 16) & 255, (n >> 8) & 255, n & 255].map(v => ch(v).toString(16).padStart(2, "0")).join(""); SHADE.set(key, r); return r;
  }
  /* einfache Beine mit Knie, Stiefeln */
  function legs2(c, k, hy, mv, ph, o) {
    const len = -hy, st = o.stride || 3, w = o.w || 2.4;
    for (let i = 0; i < 2; i++) {
      let fx = i ? (o.spread || 2) : -(o.spread || 2), fy = 0;
      if (mv) { const a = ph + (i ? PI : 0); fx = Math.sin(a) * st; fy = -Math.max(0, Math.cos(a)) * (o.lift || 2); }
      if (o.crouch) fx *= 1.4;
      const hx = i ? 0.8 : -0.8, kx = (hx + fx) / 2 + (o.knee || 1.4), ky = hy + len * 0.5 + fy * 0.3 - (o.crouch || 0) * 0.5;
      const col = k(i ? o.colF : o.colB);
      limb(c, hx, hy, kx, ky, w, col); limb(c, kx, ky, fx, fy - 0.8, w * 0.9, col);
      poly(c, [fx - 1.2, fy - 1.6, fx + 1, fy - 1.8, fx + 2.6, fy + 0.2, fx - 1.4, fy + 0.2], k(i ? o.boot || "#2a1a12" : shade(o.boot || "#2a1a12")));
    }
  }
  /* Gegner-Fallen (Fangeisen, Käfigmarken …): eigene kleine Liste, zeichnet sich selbst */
  const TRAPS = [];
  function addTrap(o) { o.t = 0; o.armed = false; TRAPS.push(o); if (TRAPS.length > 24) TRAPS.shift(); return o; }
  function trapTick(dt) {
    const P = Z.player;
    for (let i = TRAPS.length - 1; i >= 0; i--) {
      const q = TRAPS[i]; q.t += dt;
      if (q.t > q.life) { TRAPS.splice(i, 1); continue; }
      if (q.kind === "fangeisen") {
        if (!q.armed && q.t > 0.55) q.armed = true;
        if (q.snap) { q.snapT += dt; if (q.snapT > 0.8) TRAPS.splice(i, 1); continue; }
        if (q.armed && P && !P.dead && Math.abs(P.x + P.w / 2 - q.x) < 8 && Math.abs(P.y + P.h - q.y) < 5 && P.onGround && !(P.rollT > 0)) {
          q.snap = true; q.snapT = 0; A.play("chain", { x: q.x, vol: 0.8 }); A.play("hitMetal", { x: q.x, vol: 0.6 });
          Z.hurtPlayer(q.dmg, { attacker: q.owner && !q.owner.dead ? q.owner : null, x: q.x, kb: 0, unblockable: true, parryable: false });
          Z.addStatus(P, "root", 1.1, true);
          FX.burst(q.x, q.y - 3, 10, { col: ["#c8c0b8", "#ffe0a0"], sp: 90, life: 0.3, size: 1.6, kind: "spark", add: true });
        }
        /* Ezekiel kann Fangeisen zerschlagen */
        if (!q.snap && P && P.act && P.act.phase === "act" && P.act.type === "melee" && Math.abs(P.x + P.w / 2 + P.face * 14 - q.x) < 20 && Math.abs(P.y + P.h - q.y) < 20) {
          TRAPS.splice(i, 1); A.play("hitMetal", { x: q.x, vol: 0.5 }); FX.burst(q.x, q.y - 3, 8, { col: ["#8a8a90", "#5a5a60"], sp: 100, life: 0.4, size: 2, kind: "shard", g: 500 });
        }
      }
    }
  }
  function drawTraps(c, t) {
    for (const q of TRAPS) {
      if (q.kind !== "fangeisen") continue;
      const x = q.x, y = q.y, a = Math.min(1, q.t / 0.2, (q.life - q.t) / 0.5);
      c.save(); c.globalAlpha = a;
      if (!q.armed && !lowG()) glow(c, x, y - 2, 10, "rgba(255,200,120,.4)");
      ell(c, x, y - 0.8, 7, 1.6, "#3a3632");
      const cl = q.snap ? 1 : 0, ang = cl ? 0.1 : 1.1;
      for (const s of [-1, 1]) {
        c.save(); c.translate(x + s * 1.2, y - 1); c.scale(s, 1); c.rotate(-ang);
        c.strokeStyle = "#8a8a90"; c.lineWidth = 1; c.beginPath(); c.arc(0, 0, 5.5, -PI / 2, 0); c.stroke();
        for (let k2 = 0; k2 < 4; k2++) { const aa = -PI / 2 + k2 * 0.4 + 0.15; poly(c, [Math.cos(aa) * 5.5, Math.sin(aa) * 5.5, Math.cos(aa + 0.12) * 3.8, Math.sin(aa + 0.12) * 3.8, Math.cos(aa + 0.25) * 5.5, Math.sin(aa + 0.25) * 5.5], "#c8c0b8"); }
        c.restore();
      }
      circ(c, x, y - 1.4, 1.2, "#5a5a60");
      if (q.armed && !q.snap && Math.sin(t * 6 + x) > 0.6) { c.globalAlpha = a * 0.6; limb(c, x - 2, y - 4, x + 2, y - 4, 0.5, "#ffe0a0"); }
      c.restore();
    }
  }
  /* Raum versiegeln (Runenbarriere wie beim Hinterhalt) */
  const solidV = v => v === 1 || v === 7 || v === 12;
  function sealCell(cell) {
    const lv = Z.level, P = Z.player, ox = cell.x * CW, oy = cell.y * CH, border = [], out = [];
    for (let y = oy; y < oy + CH; y++) { border.push([ox, y]); border.push([ox + CW - 1, y]); }
    for (let x = ox + 1; x < ox + CW - 1; x++) { border.push([x, oy]); border.push([x, oy + CH - 1]); }
    const ptx = Math.floor((P.x + P.w / 2) / T), pty = Math.floor((P.y + P.h / 2) / T);
    for (const [x, y] of border) { const v = lv.get(x, y); if (solidV(v) || v === 9) continue; if (Math.abs(x - ptx) < 3 && Math.abs(y - pty) < 3) return null; }
    for (const [x, y] of border) { const v = lv.get(x, y); if (solidV(v) || v === 9) continue; out.push([x, y, v]); lv.set(x, y, 1); }
    Z.dirtyTiles && Z.dirtyTiles();
    return out;
  }
  function unsealTiles(list) {
    const lv = Z.level; if (!list || !list.length) return;
    for (const [x, y, v] of list) lv.set(x, y, v);
    A.play("door", { vol: 0.7 });
    for (const [x, y] of list) FX.burst(x * T + 8, y * T + 8, 3, { col: ["#ff4a3a", "#ffb060"], sp: 60, life: 0.5, size: 2, kind: "spark", add: true });
    list.length = 0; Z.dirtyTiles && Z.dirtyTiles();
  }
  function drawSeal(c, list, t, col) {
    if (!list || !list.length) return;
    c.save(); c.globalCompositeOperation = "lighter";
    for (const [x, y] of list) {
      const px = x * T, py = y * T, f = 0.6 + 0.4 * Math.sin(t * 6 + x + y);
      c.fillStyle = "rgba(" + (col || "200,30,60") + "," + 0.35 * f + ")"; c.fillRect(px, py, T, T);
      c.strokeStyle = "rgba(255,140,100," + 0.8 * f + ")"; c.lineWidth = 1; c.beginPath(); c.moveTo(px + 4, py + 3); c.lineTo(px + 8, py + 13); c.lineTo(px + 12, py + 3); c.moveTo(px + 5, py + 8); c.lineTo(px + 11, py + 8); c.stroke();
    }
    c.restore();
  }
  /* Namensschild für Sondergegner */
  function decoGeneric(c, e) {
    if (e.dead) return;
    if (e.nmMini) plate(c, e, L(e.def.n), L(e.def.title || ["Mini-Boss", "Mini-Boss"]), "#e0a040", 0);
    else if (e.nmHunter) plate(c, e, L(e.nmLook.n), L(e.nmLook.ep), "#e8b060", 0);
    else if (e.nmEvent && e.nmPlateTxt) plate(c, e, L(e.nmPlateTxt[0]), L(e.nmPlateTxt[1]), e.nmPlateCol || "#c890ff", 0);
  }
  /* Mini-Boss / Sondergegner auftreten lassen */
  function showUp(e, head, name, sub, lines, seed, o) {
    o = o || {};
    banner({ kind: o.kind || "mini", head, name, sub, lines: lines || [], seal: o.seal || "⚔", life: o.life || 3.8 });
    if (o.pan !== false) camPan(e.x + e.w / 2, e.y + e.h / 2, o.pan || 1.3);
    if (seed != null) motif(seed, o.motif);
    FX.addShake(3); A.play(o.sfx || "roar", { x: e.x, vol: 0.6 });
  }

  /* ======================= 5. DER KOPFGELDJÄGER ======================= */
  const HUNTERS = [
    { n: ["Varn", "Varn"], ep: ["der Spurenleser", "the Tracker"], coat: "#7a5436", hat: "#4a3022", scarf: "#b02a22", skin: "#d8a882", seed: 4711, sum: 300 },
    { n: ["Isolde", "Isolde"], ep: ["Eisenkralle", "Ironclaw"], coat: "#6a6458", hat: "#3a3630", scarf: "#d8a840", skin: "#e0b898", seed: 1312, sum: 450 },
    { n: ["Der Graue Kassierer", "The Grey Collector"], ep: ["der niemals verhandelt", "who never haggles"], coat: "#8a867e", hat: "#4a4844", scarf: "#8a3a6a", skin: "#c8aa96", seed: 909, sum: 600 }
  ];
  const HS = () => S0().hunter;
  const hunterNow = () => HUNTERS[(HS().beaten | 0) % HUNTERS.length];
  Z.ENEMIES.nmJaeger = {
    n: ["Kopfgeldjäger", "Bounty Hunter"], shape: "nm_jaeger", c: "#4a3426", t: "#8a1a1a", w: 12, h: 26, hp: 9, dmg: 1.15, spd: 112, ai: "ranged", keep: [80, 190], sight: 340, gold: 0, heavy: true, poise: 0.4, kkDone: true, sigDone: true,
    atks: [
      { k: "shoot", proj: "e_bolzen", n: 3, gap: 0.14, r: [50, 290], pre: 0.8, act: 0.1, post: 0.45, cd: 2.2, sfx: "xbow", aimLine: true, lockAim: 0.25, name: ["Armbrustsalve", "Crossbow Salvo"] },
      { k: "web", proj: "e_netz", r: [40, 200], pre: 0.6, act: 0.05, post: 0.4, cd: 5.5, sfx: "swing", w: 0.6, name: ["Fangnetz", "Snare Net"] },
      { k: "nm", nm: "fangeisen", r: [0, 240], pre: 0.65, act: 0.3, post: 0.35, cd: 6, w: 0.8, sfx: "chain", name: ["Fangeisen", "Bear Traps"] },
      { k: "nm", nm: "haken", r: [70, 230], pre: 0.75, act: 0.5, post: 0.5, cd: 5, w: 0.9, glyph: "!!", sfx: "chain", name: ["Enterhaken", "Grappling Hook"] },
      { k: "combo", n: 2, gap: 0.2, r: [0, 34], pre: 0.42, act: 0.08, post: 0.45, cd: 1.2, box: [0, -24, 30, 22], sfx: "slash", name: ["Säbelhiebe", "Sabre Cuts"] },
      { k: "teleport", r: [0, 55], pre: 0.3, act: 0.05, post: 0.2, cd: 6, sfx: "shadow", w: 0.7, name: ["Rauchbombe", "Smoke Bomb"] }
    ]
  };
  const KG_P2 = [{ k: "volley", proj: "e_bolzen", n: 6, r: [70, 260], pre: 0.85, act: 0.1, post: 0.5, cd: 4.5, sfx: "xbow", w: 0.8, name: ["Bolzenhagel", "Bolt Hail"] }];
  NMACT.fangeisen = {
    start(e, ac) {
      const lv = Z.level, P = Z.player; if (!P) return;
      const base = ac.nmAim ? ac.nmAim.x : P.x + P.w / 2;
      for (const off of [-34, 34, Z.run && Z.run.tier >= 4 ? 0 : null]) {
        if (off == null) continue;
        const x = base + off + (Math.random() - 0.5) * 10, gy = W.groundBelow(x, P.y - 10, 120); if (gy == null) continue;
        addTrap({ kind: "fangeisen", x, y: gy, life: 12, dmg: e.dmgMul * 0.8, owner: e });
        FX.burst(x, gy - 4, 6, { col: ["#c8c0b8", "#8a8a90"], sp: 60, ang: -PI / 2, spread: 1.6, life: 0.3, size: 1.4, kind: "spark" });
      }
      A.play("chain", { x: e.x, vol: 0.6 });
    }
  };
  NMACT.haken = {
    start(e, ac) {
      const P = Z.player; if (!P) return;
      const tx = ac.nmAim ? ac.nmAim.x : P.x + P.w / 2, dx = tx - (e.x + e.w / 2);
      e.face = U.sign(dx) || e.face; ac.hook = { x: tx - e.face * 16, y: e.y + e.h };
      e.vx = U.clamp(dx * 2.1, -420, 420); e.vy = -230; e.onGround = false; ac.hitP = false;
      A.play("chain", { x: e.x, vol: 0.7, rate: 1.3 });
    },
    tick(e, ac) {
      const P = Z.player; if (!P || ac.hitP) return;
      if (Math.abs(P.x + P.w / 2 - (e.x + e.w / 2)) < 18 && Math.abs(P.y + P.h / 2 - (e.y + e.h / 2)) < 22) {
        ac.hitP = true; Z.hurtPlayer(e.dmgMul * 1.15, { attacker: e, x: e.x + e.w / 2, kb: 230, melee: true, parryable: true });
      }
      if (e.onGround && ac.t > 0.15) { e.vx *= 0.4; ac.t = Math.max(ac.t, (ac.a.act || 0.5)); FX.burst(e.x + e.w / 2, e.y + e.h, 8, { col: Z.dustCol || "#8a7a70", sp: 70, ang: -PI / 2, spread: 2.4, life: 0.4, size: 3, kind: "smoke" }); }
    }
  };
  /* Gestalt: langer Mantel, breiter Hut mit Feder, Tuch vor dem Gesicht, Armbrust, Bolzengurt */
  Z.SHAPES.nm_jaeger = function (c, e, d, k, t, mv, ph) {
    const lk = e.nmLook || HUNTERS[0], p = phs(e);
    const crouch = p.nm === "fangeisen" && p.ph ? (p.ph === "pre" ? eo(p.u) : p.ph === "act" ? 1 : 1 - p.u) * 3 : 0;
    const bob = (mv ? Math.abs(Math.sin(ph)) * 1 : Math.sin(t * 2) * 0.3) - crouch;
    const hy = -11 + crouch * 0.6, fl = Math.sin(t * 4) * 1 + (mv ? -2.6 : 0);
    /* Mantelschoß hinten */
    poly(c, [-3.6, -20 - bob, -9.5 + fl, -3.5 + Math.sin(t * 5) * 0.8, -6.5 + fl * 0.6, -2.2, -2, hy + 1], k(shade(lk.coat, 0.75)));
    legs2(c, k, hy, mv, ph, { w: 2.3, colB: "#2a2420", colF: "#3a322a", boot: "#3a2416", crouch, stride: 3.4 });
    /* Mantel vorn */
    poly(c, [-4.2, -21 - bob, 4, -21 - bob, 4.6, hy + 1, 5.8 + fl * 0.15, -3.6, 1, -4.6, -4.6, -4, -4.8, hy + 1], k(lk.coat));
    poly(c, [-4.2, -21 - bob, -1.2, -21 - bob, -1.6, -4.4, -4.6, -4, -4.8, hy + 1], k(shade(lk.coat)));
    /* Bolzengurt quer */
    limb(c, -3.6, -20.4 - bob, 3.8, hy + 1.5, 1.3, k("#2a1a10"));
    for (let i = 0; i < 4; i++) { const u = 0.15 + i * 0.2, x = U.lerp(-3.6, 3.8, u), y = U.lerp(-20.4 - bob, hy + 1.5, u); limb(c, x, y, x + 0.6, y - 2.2, 0.5, k("#c8c0b0")); }
    limb(c, -4.6, hy + 0.4, 4.6, hy + 0.2, 1.2, k("#1a120c")); circ(c, 2.4, hy + 0.3, 0.8, k("#c8a050"));
    /* Kopf */
    const hY = -24.2 - bob;
    c.save(); c.translate(0.6, hY);
    ell(c, 0, 0, 2.9, 3.1, k(lk.skin));
    poly(c, [-2.6, 0.6, 3.6, 0.2, 3.4, 2.8, 0.6, 3.6, -2.6, 2.6], k(lk.scarf)); /* Tuch */
    limb(c, -2.8, 1.6, -5 + fl * 0.4, 3.4 + Math.sin(t * 6) * 0.6, 1, k(lk.scarf));
    c.fillStyle = k("#1a1010"); c.fillRect(1.8, -1, 1.2, 0.9);
    if (!lowG() && !(e.flash > 0)) glow(c, 2.4, -0.6, 2.2, "rgba(255,220,160,.35)");
    /* Hut: breite Krempe, Band, Feder */
    ell(c, 0.6, -2.4, 6.4, 1.3, k(lk.hat));
    poly(c, [-3, -2.6, -2.4, -6.8, 2.8, -7, 3.6, -2.6], k(lk.hat));
    limb(c, -2.7, -3.4, 3.3, -3.4, 0.9, k(lk.scarf));
    const fw = Math.sin(t * 3) * 0.4;
    poly(c, [-2.2, -4, -7 + fw, -9.5, -5.4 + fw, -7.2, -1.8, -3.4], k("#e8e0d0"));
    limb(c, -2.2, -4, -6.4 + fw, -8.8, 0.3, k("#8a7a6a"));
    c.restore();
    /* Arme und Waffe */
    const shoot = p.k === "shoot" || p.k === "volley" || p.k === "web", hook = p.nm === "haken";
    const sy = -19.4 - bob;
    let a = 0.9, r = 6;
    if (shoot && p.ph) a = p.k === "volley" ? -0.9 : p.ph === "post" ? U.lerp(-0.12, 0.9, p.u) : -0.12;
    else if (p.k === "combo") a = swingV(p, 0.9, -2.2, 0.7);
    else if (hook) a = p.ph === "pre" ? -1.9 : p.ph === "act" ? -0.2 : 0.6;
    else if (!e.aware) a = 1.2;
    const hx = 1 + Math.cos(a) * r, hyy = sy + Math.sin(a) * r;
    limb(c, -1.2, sy, -2 + Math.cos(a) * 4, sy + Math.sin(a) * 4 + 1.6, 2, k(shade(lk.coat)));
    limb(c, 1, sy, hx, hyy, 2.2, k(lk.coat)); circ(c, hx, hyy, 1, k(lk.skin));
    c.save(); c.translate(hx, hyy);
    if (p.k === "combo") { c.rotate(a - 0.6); limb(c, -1.4, 0, 1.4, 0, 1.4, k("#3a2a1a")); poly(c, [1.4, -1, 11, -2.2, 13, -1, 2, 1], k("#d8d0c8")); }
    else if (hook) {
      if (p.ph === "pre") { const sp = t * 16; limb(c, 0, 0, Math.cos(sp) * 5, Math.sin(sp) * 2.5 - 1, 0.6, k("#8a7a6a")); poly(c, [Math.cos(sp) * 5 - 1.4, Math.sin(sp) * 2.5 - 2.4, Math.cos(sp) * 5 + 1.6, Math.sin(sp) * 2.5 - 1, Math.cos(sp) * 5 - 1.4, Math.sin(sp) * 2.5 + 0.4], k("#a8a8b0")); }
      else { c.rotate(-0.2); c.scale(0.62, 0.62); Z.drawWeapon && Z.drawWeapon(c, "xbow", "#c8a060", t, 1); }
    } else { c.rotate(shoot ? -0.05 : a - 0.2); c.scale(0.62, 0.62); if (Z.drawWeapon) Z.drawWeapon(c, "xbow", "#c8a060", t, shoot && p.ph === "act" ? 1 : 0); }
    c.restore();
    if (e.nmBandage) { limb(c, -3, -16 - bob, 3, -14.5 - bob, 1.1, k("#e8e0d0")); limb(c, -2.8, -15 - bob, 3.2, -13.4 - bob, 0.5, k("#c84a3a")); }
  };
  /* Zustand des Laufs: stage 1 Spur, 2 Hinterhalt, 3 kaltes Lager, 4 letzter Kampf, 5 erledigt */
  let KGS = null; /* Gebietszustand: Vorzeichen, Auslöser, Jäger */
  const POSTER = {};
  function posterSprite() {
    const key = Z.settings.lang || "de"; if (POSTER[key]) return POSTER[key];
    const S = 4, w = 16, h = 20, cv = document.createElement("canvas"); cv.width = w * S; cv.height = h * S;
    const g = cv.getContext("2d"); g.scale(S, S);
    poly(g, [0.4, 0.6, 15.4, 0, 15.8, 19.2, 7, 19.8, 0, 19.4], "#6a4a2a"); poly(g, [1, 1.1, 14.9, 0.6, 15.2, 18.6, 7, 19.2, 0.6, 18.8], "#e8d6b0");
    g.fillStyle = "#8a1414"; g.font = "900 3.4px 'Alegreya Sans',sans-serif"; g.textAlign = "center"; g.fillText(L(["GESUCHT", "WANTED"]), 8, 4.6);
    /* Ezekiel: Kapuze, Hörner, glühende Augen */
    ell(g, 8, 10.4, 3.6, 4, "#2a1a1a"); poly(g, [4.6, 9, 3.4, 5.6, 5.6, 8], "#3a2a2a"); poly(g, [11.4, 9, 12.6, 5.6, 10.4, 8], "#3a2a2a");
    g.fillStyle = "#ff4a2a"; g.fillRect(6.4, 10, 1.1, 0.8); g.fillRect(8.6, 10, 1.1, 0.8);
    poly(g, [4, 14.6, 12, 14.6, 13, 16, 3, 16], "#8a1414");
    g.fillStyle = "#3a1a10"; g.font = "800 2.6px 'Alegreya Sans',sans-serif"; g.fillText(hunterNow().sum + " ●", 8, 18.2);
    g.strokeStyle = "rgba(90,60,30,.4)"; g.lineWidth = 0.3; g.beginPath(); g.moveTo(1.4, 12); g.lineTo(3, 13.4); g.stroke();
    POSTER[key] = { cv, w, h }; return POSTER[key];
  }
  function wallBolts(lv, cell, n, R) {
    const out = [], ox = cell.x * CW, oy = cell.y * CH;
    for (let y = oy + 1; y < oy + CH - 1; y++) for (let x = ox + 1; x < ox + CW - 1; x++) {
      if (lv.get(x, y) !== 0) continue;
      const r = solidV(lv.get(x + 1, y)), l = solidV(lv.get(x - 1, y)); if (!r && !l) continue;
      let ground = false; for (let k = 1; k <= 3; k++) if (solidV(lv.get(x, y + k)) || lv.get(x, y + k) === 2) { ground = true; break; }
      if (!ground) continue;
      out.push({ x: r ? (x + 1) * T : x * T, y: y * T + 4 + R() * 8, dir: r ? 1 : -1 });
    }
    R.shuffle(out); return out.slice(0, n);
  }
  function kgOmens(lv, kind, R) {
    const path = cellsOf(lv).filter(c => c.kind === "path" && c !== lv.startCell).sort((a, b) => (a.idx || 0) - (b.idx || 0));
    const props = [];
    const nP = kind === "spur" ? 3 : kind === "nah" ? 2 : 1;
    for (let i = 0; i < nP && path.length; i++) {
      const c = path[Math.min(path.length - 1, Math.floor((i + 0.6) / (nP + 0.5) * path.length))];
      const sp = spotsIn(lv, c, 3); if (!sp.length) continue; const s = R.pick(sp);
      props.push({ k: "poster", x: sx(s), y: sy(s) - 20 - R() * 6, read: false });
      for (let j = 0; j < 7; j++) { const fx = sx(s) - 40 + j * 11; const gy = W.groundBelow(fx, sy(s) - 10, 40); if (gy != null && Math.abs(gy - sy(s)) < 10) props.push({ k: "spur", x: fx + (j % 2) * 2, y: gy, f: R() < 0.5 ? 1 : -1, j }); }
    }
    for (const c of R.shuffle(path.slice()).slice(0, kind === "nah" ? 3 : 2)) for (const b of wallBolts(lv, c, 2 + ((R() * 3) | 0), R)) props.push(Object.assign({ k: "bolzen" }, b));
    if (kind === "lager") {
      const sp = farSpot(lv, { min: 20, filter: c => c.kind === "side" || c.kind === "path", R }); if (sp) props.push({ k: "lager", x: sx(sp.s), y: sy(sp.s) });
    }
    for (const p of props) if (p.k === "poster" || p.k === "lager") {
      const o = { x: p.x, y: p.k === "poster" ? p.y + 26 : p.y, r: 24, h: p.k === "poster" ? 34 : 24, label: () => L(p.k === "poster" ? ["Steckbrief lesen", "Read the poster"] : ["Notizen lesen", "Read the notes"]),
        use: () => { p.read = true; const H = hunterNow(); const txt = p.k === "poster"
          ? L(["GESUCHT: Ezekiel, genannt „der Zerstörer“. Lebend oder tot – tot bevorzugt. " + H.sum + " Gold. Gez. " + L(H.n) + ".", "WANTED: Ezekiel, called \"the Destroyer\". Dead or alive – dead preferred. " + H.sum + " gold. Signed, " + L(H.n) + "."])
          : L(["„Er rollt durch alles hindurch. Fangeisen dorthin, wo er landet. Und nie zu nah ran.“ – Die Asche ist noch warm.", "\"He rolls through everything. Traps where he lands. And never get too close.\" – The ashes are still warm."]);
          say({ x: p.x - 4, y: p.y - 8, w: 8, h: 8, gone: true }, txt, { x: p.x, y: p.y - 6, who: p.k === "poster" ? L(["Steckbrief", "Poster"]) : L(["Notizbuch", "Notebook"]), life: 6 }); A.play("scroll", { vol: 0.6 }); } };
      Z.interacts.push(o);
    }
    return props;
  }
  function drawOmens(c, t) {
    if (!KGS || !KGS.props) return;
    const cam = Z.cam;
    for (const p of KGS.props) {
      if (p.x < cam.x - 40 || p.x > cam.x + cam.w + 40 || p.y < cam.y - 40 || p.y > cam.y + cam.h + 40) continue;
      if (p.k === "poster") { const sp = posterSprite(); c.save(); c.translate(p.x, p.y); c.rotate(Math.sin(p.x) * 0.08); c.drawImage(sp.cv, -sp.w / 2, -sp.h / 2, sp.w, sp.h); limb(c, -1, -sp.h / 2 + 1.5, 6, -sp.h / 2 - 0.5, 1, "#d8d0c0"); poly(c, [6, -sp.h / 2 - 1.6, 8.6, -sp.h / 2 - 0.4, 6, -sp.h / 2 + 0.6], "#a89a8a"); c.restore(); }
      else if (p.k === "bolzen") { c.save(); c.translate(p.x, p.y); c.scale(p.dir, 1); c.rotate(-0.12); c.fillStyle = "#6a5a4a"; c.fillRect(-9, -0.5, 9, 1); poly(c, [-9, -0.5, -11, -1.8, -10, 0, -11, 1.8, -9, 0.5], "#d8d0c0"); c.restore(); }
      else if (p.k === "spur") { c.save(); c.globalAlpha = 0.45; ell(c, p.x, p.y - 0.4, 2, 0.7, "#1a120c"); ell(c, p.x + p.f * 2.4, p.y - 0.4, 0.8, 0.5, "#1a120c"); c.restore(); }
      else if (p.k === "lager") {
        ell(c, p.x, p.y - 0.6, 7, 1.6, "#2a2420"); for (let i = 0; i < 3; i++) limb(c, p.x - 5 + i * 3, p.y - 1, p.x - 2 + i * 3, p.y - 2.6, 1.4, "#2a1a12");
        if (Math.random() < 0.05) FX.p({ x: p.x + (Math.random() - 0.5) * 4, y: p.y - 3, vx: 2, vy: -14, life: 2.4, size: 2.4, col: "#5a5250", kind: "smoke" });
        if (!lowG()) glow(c, p.x, p.y - 2, 5 + Math.sin(t * 2), "rgba(255,90,40,.25)");
        poly(c, [p.x + 9, p.y, p.x + 21, p.y, p.x + 20, p.y - 2.4, p.x + 10, p.y - 2.6], "#5a3a2a"); ell(c, p.x + 20, p.y - 2.2, 2, 1.6, "#4a2a1a");
      }
    }
  }
  function kgLoad(lv) {
    KGS = null;
    const run = Z.run; if (!run || !normalLevel(lv)) return;
    const H = HS(), n = routeN();
    if (!run.kg) {
      if (run.kgDone || (n < 2 && !KG.forceNext)) return;
      if (!(KG.forceNext || Z.R() < (H.active ? 0.55 : 0.26))) return;
      run.kg = { stage: 0, hp: 1, pending: false };
      H.active = true; saveSoon();
    }
    KG.forceNext = false;
    const kg = run.kg;
    if (kg.stage >= 5) return;
    if (!kg.pending) kg.stage++;
    const R = Z.Rng(((lv.seed || 7) * 31 + 977) >>> 0);
    KGS = { lv, props: kgOmens(lv, kg.stage === 1 ? "spur" : kg.stage === 3 ? "lager" : "nah", R), stage: kg.stage, e: null, state: "wait", sealed: [] };
    if (kg.stage === 2 || kg.stage === 4) {
      kg.pending = true;
      const path = cellsOf(lv).filter(c => c.kind === "path" && c !== lv.startCell && c !== lv.endCell).sort((a, b) => (a.idx || 0) - (b.idx || 0));
      const amb = Z.ambush && Z.ambush();
      const cand = path.filter((c, i) => i >= path.length * 0.35 && i <= path.length * 0.75 && !(amb && amb.c === c) && spotsIn(lv, c, 3).length >= 12);
      KGS.cell = cand.length ? R.pick(cand) : path[Math.floor(path.length / 2)];
    }
    if (kg.stage === 1) later(() => { if (KGS && Z.level === lv) overHead(L(["Jemand ist dir auf der Spur …", "Someone is on your trail…"]), "#e8c890", 3.4); }, 5200);
    if (kg.stage === 3) later(() => { if (KGS && Z.level === lv) overHead(L(["Die Spuren sind frisch.", "The tracks are fresh."]), "#e8c890", 3); }, 4200);
  }
  function kgSpawn(final) {
    const lv = Z.level, P = Z.player, H = hunterNow(), hs = HS();
    const cell = KGS.cell, sp = (cell ? spotsIn(lv, cell, 3) : []).filter(s => { const d = Math.abs(sx(s) - (P.x + P.w / 2)); return d > 80 && d < 190; });
    const s = sp.length ? Z.R.pick(sp) : null;
    const x = s ? sx(s) : P.x + P.w / 2 + (P.face || 1) * 120, y = s ? sy(s) : P.y + P.h;
    const e = Z.spawnEnemy("nmJaeger", x, y, { tier: Z.run.tier }); if (!e) return null;
    e.nmHunter = true; e.nmLook = H; e.def = Object.assign({}, e.def, { c: H.coat });
    const lvl = hs.lvl | 0;
    e.hp = e.hpMax = Math.round(e.hpMax * (1 + 0.18 * lvl) * (routeN() <= 2 ? 0.8 : 1)); e.dmgMul *= 1 + 0.08 * lvl;
    if (final) { e.hp = Math.round(e.hpMax * 0.78); e.nmBandage = true; }
    e.aware = true; e.spawnT = 0.3; e.cd = 1.2; e.face = U.sign(P.x - e.x) || 1;
    e.y -= 70; e.vy = 60; Z.unstick && Z.unstick(e);
    FX.burst(e.x + e.w / 2, y - 10, 20, { col: ["#3a3030", "#5a4a40"], sp: 80, life: 0.8, size: 4, kind: "smoke", g: -20 });
    KGS.e = e;
    return e;
  }
  function kgTick(dt) {
    if (!KGS || Z.level !== KGS.lv) return;
    const P = Z.player; if (!P || P.dead) return;
    const kg = Z.run && Z.run.kg; if (!kg) return;
    if ((KGS.stage === 2 || KGS.stage === 4) && KGS.state === "wait" && KGS.cell) {
      const c = KGS.cell, ox = c.x * CW * T, oy = c.y * CH * T;
      if (P.x > ox + 3 * T && P.x < ox + (CW - 3) * T && P.y > oy + T && P.y < oy + (CH - 1) * T && P.onGround) {
        if (KGS.stage === 4) { const s = sealCell(c); if (!s) return; KGS.sealed = s; }
        KGS.state = "warn"; KGS.t = 0;
        /* Warnschuss: ein Bolzen zischt knapp vorbei und bleibt in der Wand stecken */
        const dir = Z.R() < 0.5 ? -1 : 1, yy = P.y - 5, x0 = P.x + P.w / 2 - dir * 170;
        const pj = Z.spawnProj("e_bolzen", x0, yy, dir, { dmg: 0, vx: dir * 520, vy: 0 }); if (pj) { pj.g = 0; pj.dmg = 0; pj.nmWarn = true; pj.hits = new Set([P]); }
        A.play("xbow", { vol: 0.8 }); if (Z.music && Z.music.stinger) Z.music.stinger("hinterhalt");
        later(() => { if (KGS && KGS.state === "warn") overHead(L(["Fast.", "Close."]), "#ffd27a", 2, 10); }, 350);
        later(() => {
          if (!KGS || KGS.state !== "warn" || Z.level !== KGS.lv) return;
          const final = KGS.stage === 4, e = kgSpawn(final); if (!e) { KGS.state = "done"; return; }
          KGS.state = "fight"; e.nmIntroT = 0;
          const H = e.nmLook, hs = HS();
          const line = final ? L(["Diesmal kein Rauch, keine Flucht. Nur du und ich, Zerstörer.", "No smoke this time, no running. Just you and me, Destroyer."])
            : hs.kills ? L(["Ich habe dich schon einmal eingesackt. Halt still, dann tut's weniger weh.", "I've bagged you once already. Hold still, it hurts less."])
            : L(["Dein Kopf ist " + H.sum + " Gold wert, Zerstörer. Nichts Persönliches.", "Your head is worth " + H.sum + " gold, Destroyer. Nothing personal."]);
          later(() => { if (!e.dead) say(e, line, { who: L(H.n), life: 4 }); }, 500);
          showUp(e, L(final ? ["Letzte Jagd", "Final Hunt"] : ["Kopfgeldjäger", "Bounty Hunter"]), L(H.n), L(H.ep),
            [[L(["Flieht bei halber Kraft – und kommt wieder.", "Flees at half strength – and returns."]), "#5a3a1a"]].filter(() => !final).concat(final ? [[L(["Kopfgeld auf den Jäger: alles, was er bei sich trägt.", "Bounty on the hunter: everything he carries."]), "#8a1a14"]] : []),
            H.seed, { kind: "hunter", seal: "◎", sfx: "laugh", pan: 1.2 });
        }, 1100);
      }
    }
    const e = KGS.e;
    if (KGS.state === "fight" && e) {
      if (e.dead) { KGS.state = "done"; unsealTiles(KGS.sealed); return; }
      const frac = e.hp / e.hpMax;
      if (KGS.stage === 2 && frac <= 0.5 && !e.nmFlee) kgFlee(e);
      if (KGS.stage === 4 && frac <= 0.42 && !e.nmP2) {
        e.nmP2 = true; e.def = Object.assign({}, e.def, { atks: e.def.atks.map(a => Object.assign({}, a, { cd: (a.cd || 1) * 0.7 })).concat(KG_P2), spd: (e.def.spd || 100) * 1.15 });
        say(e, L(["Gut. Dann eben ohne Kopfgeld – nur noch für die Ehre.", "Fine. Forget the bounty – this is for pride now."]), { who: L(e.nmLook.n), life: 3 });
        Z.addStatus(e, "stun", 0); A.play("roar", { x: e.x, vol: 0.5 }); FX.ring(e.x + e.w / 2, e.y + e.h / 2, 30, "#ffb040", 0.4, 3);
        if (Z.music && Z.music.stinger) Z.music.stinger("phase");
      }
    }
    if (e && e.nmFlee) {
      e.nmFleeT += dt; e.act = null; e.vx = e.nmFleeDir * 160; e.vy = -360; e.ghost = true; e.noPlat = true; e.y += e.vy * dt; e.x += e.vx * dt;
      if (Math.random() < dt * 30) FX.p({ x: e.x + e.w / 2, y: e.y + e.h, vx: 0, vy: 30, life: 0.8, size: 4, col: "#4a4040", kind: "smoke" });
      if (e.nmFleeT > 1.1) { e.dead = true; e.deadT = 99; KGS.e = null; KGS.state = "done"; unsealTiles(KGS.sealed); }
    }
  }
  function kgFlee(e) {
    e.nmFlee = true; e.nmFleeT = 0; e.invuln = 99; e.act = null; e.nmFleeDir = U.sign(e.x - Z.player.x) || 1;
    say(e, L(["Ein andermal, Zerstörer! Die Jagd ist noch nicht vorbei.", "Another time, Destroyer! The hunt isn't over."]), { who: L(e.nmLook.n), life: 3 });
    FX.burst(e.x + e.w / 2, e.y + e.h / 2, 34, { col: ["#4a4040", "#6a5a50", "#2a2424"], sp: 120, life: 1.2, size: 6, kind: "smoke", g: -10 });
    A.play("explode", { x: e.x, vol: 0.4, rate: 1.4 }); A.play("chain", { x: e.x, vol: 0.6, rate: 1.4 });
    Z.run.kg.pending = false; Z.run.kg.hp = 0.5; Z.dropGold(e.x + e.w / 2, e.y + e.h - 6, 30 * Z.BAL.goldMul(Z.run.tier));
    note("◎ <b>" + esc(L(e.nmLook.n)) + "</b><br><small>" + esc(L(["ist entkommen – aber er kommt wieder.", "escaped – but he'll be back."])) + "</small>", 3000);
  }
  KG.onHurt = e => { if (!(e.nmTaunt > now()) && Z.R() < 0.35) { e.nmTaunt = now() + 7; say(e, L(Z.R.pick([["Stillhalten!", "Hold still!"], ["Das gibt einen Bonus.", "That's a bonus."], ["Gezeichnet und gezählt.", "Marked and counted."]])), { who: L(e.nmLook.n), life: 2 }); } };
  KG.onKill = e => {
    const hs = HS(); hs.kills = (hs.kills | 0) + 1; hs.lvl = (hs.lvl | 0) + 1; hs.active = true;
    deathNote = { hunter: true, look: e.nmLook };
    news(L(e.nmLook.n) + " hat das Kopfgeld auf Ezekiel kassiert.", L(e.nmLook.n) + " collected the bounty on Ezekiel.");
  };
  function kgKill(e) {
    if (!e.nmHunter) return;
    const hs = HS(), H = e.nmLook, x = e.x + e.w / 2, y = e.y + e.h, run = Z.run;
    hs.beaten = (hs.beaten | 0) + 1; hs.active = false; hs.lvl = Math.max(0, (hs.lvl | 0) - 1);
    if (run.kg) { run.kg.stage = 5; run.kg.pending = false; } run.kgDone = true;
    POSTER.de = POSTER.en = null;
    say({ x: e.x, y: e.y, w: e.w, h: e.h, gone: true }, L(["Hätte … mehr verlangen sollen …", "Should've … asked for more…"]), { x, y: e.y - 4, who: L(H.n), life: 3 });
    unsealTiles(KGS && KGS.sealed);
    FX.slowmo(0.3, 0.9); FX.flashScreen("#ffe0b0", 0.3); if (Z.music && Z.music.stinger) Z.music.stinger("sieg");
    Z.dropGold(x, y - 8, H.sum * 0.6 * Z.BAL.goldMul(run.tier));
    Z.dropShards(x, y - 8, 30 + 10 * (hs.lvl | 0));
    later(() => {
      if (Z.spawnReward) Z.spawnReward("glut", x, y, { n: 3 });
      const it = Z.WEAPONS.armbrust && Z.makeItem ? Z.makeItem("armbrust", Math.max(0, run.tier), 2) : null;
      if (it && Z.R() < 0.6) { it.plus = Math.min(3, (it.plus || 0) + 1); Z.spawnPickup("item", x + 14, y - 4, { it, drop: true, vy: -240, vx: 40 }); } else Z.dropItem(x + 14, y - 4, { boss: true });
      runeDrop(x - 14, y, 3);
    }, 600);
    banner({ kind: "hunter", head: L(["Jäger erlegt", "Hunter slain"]), seal: "◎", name: L(H.n), sub: L(H.ep), lines: [[L(["Sein Beutel gehört jetzt dir.", "His purse is yours now."]), "#5a3a1a"]], life: 4 });
    news(L(H.n) + " " + L(H.ep) + " wurde von seiner eigenen Beute erlegt.", L(H.n) + " " + L(H.ep) + " was slain by his own quarry.");
    Z.saveMeta();
  }
  MODS.push({
    load: kgLoad, leave: () => { if (KGS && KGS.sealed && KGS.sealed.length) unsealTiles(KGS.sealed); TRAPS.length = 0; KGS = null; },
    tick: dt => { specialTick(dt); trapTick(dt); kgTick(dt); },
    draw: (c, t) => { drawOmens(c, t); drawTraps(c, t); if (KGS) drawSeal(c, KGS.sealed, t); },
    kill: e => kgKill(e),
    deco: (c, e) => decoGeneric(c, e)
  });
  KG.active = () => !!(KGS && KGS.state === "fight");
  KG.state = () => ({ run: Z.run && Z.run.kg, area: KGS && { stage: KGS.stage, state: KGS.state, props: KGS.props.length, cell: KGS.cell && [KGS.cell.x, KGS.cell.y] }, meta: HS() });
  /* Z.kopfgeld.force() – Jäger sofort hier auftreten lassen; force(true) = letzter Kampf */
  KG.force = function (final) {
    const lv = Z.level; if (!normalLevel(lv)) return null;
    Z.run.kg = { stage: final ? 4 : 2, hp: 1, pending: true };
    const P = Z.player;
    KGS = { lv, props: kgOmens(lv, "nah", Z.R), stage: final ? 4 : 2, e: null, state: "fight", sealed: [], cell: cellOfPx(lv, P.x + P.w / 2, P.y + P.h / 2) };
    return kgSpawn(!!final);
  };

  /* ======================= 6. SELTENE EREIGNISSE ======================= */
  /* Ablauf je Gebiet: höchstens ein Ereignis. wait (Auslöser) → warn (Vorwarnung, Inszenierung) → run → done.
     Häufigkeit: etwa eines je 2–3 Gebiete; im ersten Gebiet nur sanfte (Schatzgoblin, Geisterzug) und selten. */
  const EVD = {};
  let EVS = null, EVFORCE = false;
  const tierN = () => (Z.run ? Z.run.tier | 0 : 0);
  const pathCells = lv => cellsOf(lv).filter(c => c.kind === "path" && c !== lv.startCell && c !== lv.endCell).sort((a, b) => (a.idx || 0) - (b.idx || 0));
  /* Raum für ein Ereignis: mittlerer Teil des Hauptweges, nicht der Hinterhalt, nicht der Wächter, nicht der Jäger */
  function pickCell(lv, R, need, o) {
    o = o || {};
    if (EVFORCE) { const P = Z.player; return cellOfPx(lv, P.x + P.w / 2, P.y + P.h - 2); }
    const amb = Z.ambush && Z.ambush(), wc = lv.warden && lv.warden.cell;
    let list = (o.side ? cellsOf(lv).filter(c => c.kind === "side" && c !== lv.startCell) : pathCells(lv));
    const n = list.length;
    list = list.filter((c, i) => (o.side || (i >= n * 0.2 && i <= n * 0.85)) && !(amb && amb.c === c) && c !== wc && !(KGS && KGS.cell === c) && !(MBS && MBS.cell === c));
    for (const c of R.shuffle(list)) if (spotsIn(lv, c, o.head || 3).length >= (need || 10)) return c;
    return null;
  }
  const cellCenter = c => [(c.x * CW + CW / 2) * T, (c.y * CH + CH / 2) * T];
  const inCell = (c, x, y) => c && x > c.x * CW * T && x < (c.x + 1) * CW * T && y > c.y * CH * T && y < (c.y + 1) * CH * T;
  const playerIn = (c, margin) => { const P = Z.player; if (!P || !c) return false; const m = (margin || 0) * T, x = P.x + P.w / 2, y = P.y + P.h - 2; return x > c.x * CW * T + m && x < (c.x + 1) * CW * T - m && y > c.y * CH * T && y < (c.y + 1) * CH * T; };
  /* Gegnerarten des Gebiets (am Boden, keine Selbstzerstörer, keine Türme) */
  function foesOf(lv, o) {
    o = o || {}; const B = Z.BIOMES[lv.biome] || {};
    let ids = Object.keys(B.foes || {}).filter(id => { const d = Z.ENEMIES[id]; return d && !d.boss && d.ai !== "exploder" && d.ai !== "turret" && (o.fly || !d.fly) && !(d.group && o.noGroup); });
    if (!ids.length) ids = ["goblin", "robe"];
    return ids;
  }
  function spawnFoe(id, s, o) {
    o = o || {}; const d0 = Z.ENEMIES[id]; if (!d0) return null;
    const e = Z.spawnEnemy(id, sx(s), sy(s) - (d0.fly ? 20 : 0), { tier: tierN(), elite: !!o.elite }); if (!e) return null;
    e.nmEvent = true; e.spawnT = o.spawnT != null ? o.spawnT : 0.4; if (o.aware !== false) e.aware = true;
    if (o.flag) e[o.flag] = true;
    if (o.smoke !== false) FX.burst(e.x + e.w / 2, e.y + e.h * 0.6, 12, { col: o.col || ["#2a1014", "#4a2a30"], sp: 70, life: 0.6, size: 3, kind: "smoke" });
    return e;
  }
  /* Ankündigungs-Marken am Boden: Kreise, aus denen gleich etwas kommt */
  const MARKS = [];
  function markThen(x, y, col, delay, fn) { MARKS.push({ x, y, col: col || "255,60,40", t: 0, life: delay || 1, fn }); }
  function marksTick(dt) { for (let i = MARKS.length - 1; i >= 0; i--) { const m = MARKS[i]; m.t += dt; if (m.t >= m.life) { MARKS.splice(i, 1); try { m.fn && m.fn(); } catch (err) { console.error(err); } } } }
  function drawMarks(c, t) {
    for (const m of MARKS) {
      const u = m.t / m.life, r = 6 + 8 * u;
      c.save(); c.globalCompositeOperation = "lighter"; c.globalAlpha = 0.35 + 0.5 * u;
      c.strokeStyle = "rgba(" + m.col + ",.9)"; c.lineWidth = 1.2; c.beginPath(); c.ellipse(m.x, m.y - 0.5, r, r * 0.3, 0, 0, TAU); c.stroke();
      c.fillStyle = "rgba(" + m.col + ",.25)"; c.beginPath(); c.ellipse(m.x, m.y - 0.5, r * (1 - u * 0.3), r * 0.26, 0, 0, TAU); c.fill();
      if (Math.sin(t * 20) > 0) { c.globalAlpha *= 0.6; c.beginPath(); c.moveTo(m.x, m.y - 2); c.lineTo(m.x, m.y - 6 - 10 * u); c.stroke(); }
      c.restore();
    }
  }
  /* Truhe auf einen Bodenplatz in der Nähe stellen */
  function chestNear(x, y, o) {
    o = o || {}; const lv = Z.level, sp = spotsNear(lv, x, y - 4, o.r || 70, 2).filter(s => Math.abs(sx(s) - x) > (o.min || 16));
    const s = sp.length ? sp.sort((a, b) => Math.abs(sx(a) - x) - Math.abs(sx(b) - x))[0] : null;
    const cx = s ? sx(s) : x, cy = s ? sy(s) : y;
    Z.spawnPickup("chest", cx, cy, { vx: 0, vy: 0 });
    FX.burst(cx, cy - 8, 26, { col: ["#ffd27a", "#fff0c0"], sp: 120, up: 60, life: 0.8, size: 2, kind: "spark", add: true });
    A.play("chest", { x: cx, vol: 0.5 });
    return [cx, cy];
  }
  function evBanner(name, sub, lines, o) { o = o || {}; banner({ kind: o.kind || "event", head: o.head || L(["Seltenes Ereignis", "Rare event"]), seal: o.seal || "✦", name: L(name), sub: sub ? L(sub) : "", lines: (lines || []).map(l => [L(l[0] || l), l[1] || "#4a2a5a"]), life: o.life || 4.2 }); }
  /* Gerücht über einen Nemesis: deckt eine noch unbekannte Schwäche auf (Belohnung für Geister und Gefangene) */
  function intel() {
    const cand = active().filter(r => r.weak.some(w => !r.known.includes(w)));
    if (!cand.length) return null;
    const r = Z.R.pick(cand), w = Z.R.pick(r.weak.filter(x => !r.known.includes(x))); r.known.push(w); saveSoon();
    return L(["Man sagt, " + r.name[0] + " " + r.ep[0] + " ist verwundbar: ", "They say " + r.name[1] + " " + r.ep[1] + " has a weakness: "]) + L(WEAK[w].n) + ".";
  }
  NM.intel = intel;
  function evMeta(id, k) { const m = M(); m.ereignis = m.ereignis && typeof m.ereignis === "object" ? m.ereignis : {}; const s = (m.ereignis[id] = m.ereignis[id] || { seen: 0, won: 0 }); s[k] = (s[k] | 0) + 1; saveSoon(); }

  /* ---------- 6.1 Finsternis: alle Lichter erlöschen ---------- */
  EVD.finsternis = {
    n: ["Finsternis", "Darkness"], w: 1,
    setup(lv, R) { const c = pickCell(lv, R, 10); return c ? { cell: c, foes: [], lights: [] } : null; },
    trig: s => playerIn(s.cell, 3),
    warn(s) { overHead(L(["Ein eisiger Luftzug …", "An icy draught…"]), "#e8d8c0", 2.4); A.play("dark", { vol: 0.5 }); A.play("shadow", { vol: 0.4, delay: 0.6 }); s.warnT = 1.8; },
    start(s) {
      const lv = Z.level, P = Z.player, [cx, cy] = [P.x + P.w / 2, P.y + P.h];
      /* einige Glutreste bleiben als schwache Lichtinseln */
      s.lights = (lv.lights || []).filter(d => Math.abs(d.x * T - cx) < 520 && Math.abs(d.y * T - cy) < 320).filter((_, i) => i % 3 === 0).slice(0, 6).map(d => [d.x * T + 8, d.y * T + 4]);
      const ids = foesOf(lv, { noGroup: true }), n = 2 + Math.min(3, tierN()) + (routeN() > 3 ? 1 : 0);
      const sp = spotsNear(lv, cx, cy - 6, 230, 2).filter(q => { const d = Math.abs(sx(q) - cx); return d > 70 && d < 230; });
      for (let i = 0; i < n && sp.length; i++) { const q = sp.splice(Math.floor(Z.R() * sp.length), 1)[0]; const e = spawnFoe(Z.R.pick(ids), q, { spawnT: 1.2, smoke: false, flag: "nmDark" }); if (e) { e.cd = 1.4 + i * 0.3; s.foes.push(e); } }
      evBanner(this.n, ["Die Lichter sind erloschen – nur deine Glut leuchtet noch.", "The lights have died – only your embers still glow."], [[["Achte auf glühende Augen.", "Watch for glowing eyes."], "#5a2a2a"]]);
      A.play("dark", { vol: 0.7 }); FX.addShake(2);
      if (Z.music && Z.music.push) Z.music.push(0.6, 8);
    },
    tick(s) {
      if (s.state === "run") Z.darkness = Math.max(Z.darkness || 0, 0.3);
      if (s.state !== "run") return;
      const alive = s.foes.filter(e => !e.dead && inLv(e)).length;
      if ((alive === 0 && s.t > 3) || s.t > 45) return "ok";
    },
    draw(s, c, t) {
      if (s.state !== "run" || !Z.addLight) return;
      for (const [x, y] of s.lights) Z.addLight(x, y, 46 + Math.sin(t * 7 + x) * 4, "#ff7a32", 0.3);
      const P = Z.player; if (P) Z.addLight(P.x + P.w / 2, P.y + 12, 96, "#ff5a2a", 0.28);
    },
    after(s, c, cam, t) {
      if (s.state !== "run") return;
      /* leuchtende Augen und lesbare Vorwarnungen auch im Dunkeln */
      c.save(); c.globalCompositeOperation = "lighter";
      for (const e of Z.enemies) {
        if (e.dead || e.hidden > 0 || e.x < cam.x - 30 || e.x > cam.x + cam.w + 30 || e.y < cam.y - 30 || e.y > cam.y + cam.h + 30) continue;
        const a = ANCH[e.def.shape] || ANCH.human, f = e.face || 1, hx = e.x + e.w / 2 + f * a[0] * e.w, hy = e.y + a[1] * e.h + 1;
        const blink = Math.sin(t * 0.9 + e.x) > 0.97 ? 0.2 : 1;
        c.globalAlpha = 0.9 * blink; c.fillStyle = "#ffb070"; c.fillRect(hx - 0.6, hy - 0.5, 1.3, 1); c.fillRect(hx + f * 2.2 - 0.6, hy - 0.5, 1.3, 1);
        if (!lowG()) glow(c, hx + f, hy, 5, "rgba(255,70,30,.45)");
        if (e.act && e.act.phase === "pre") {
          const red = e.act.a.glyph === "!!" || e.act.a.unblockable, k2 = Math.min(1, e.act.t / (e.act.a.pre || 0.4));
          glow(c, e.x + e.w / 2, e.y + e.h * 0.45, e.h * (0.6 + 0.5 * k2), red ? "rgba(255,40,30,.5)" : "rgba(255,170,60,.45)");
          c.globalAlpha = 1; c.font = "900 11px 'Alegreya Sans',sans-serif"; c.textAlign = "center"; c.fillStyle = red ? "#ff4a2a" : "#ffd27a"; c.fillText(red ? "!!" : "!", e.x + e.w / 2, e.y - 6);
        }
      }
      c.restore();
    },
    screen(s, c, Wd, Hd, t) {
      if (s.state !== "warn") return;
      /* Vorwarnung: die Lichter flackern */
      const f = Math.max(0, Math.sin(s.t * 23) * Math.sin(s.t * 7)) * Math.min(1, s.t / (s.warnT || 1.8));
      c.fillStyle = "rgba(6,2,4," + (0.25 + 0.4 * f) * Math.min(1, s.t) + ")"; c.fillRect(0, 0, Wd, Hd);
    },
    finish(s, ok) {
      Z.darkness = Math.min(Z.darkness || 0, 0.01);
      if (!ok) return;
      const P = Z.player; FX.flashScreen("#ffe0b0", 0.25); A.play("holy", { vol: 0.5 });
      chestNear(P.x + P.w / 2, P.y + P.h, { r: 90, min: 24 });
      Z.dropShards(P.x + P.w / 2, P.y, 12 + 4 * tierN());
      evBanner(["Das Licht kehrt zurück", "The light returns"], ["Die Schatten haben etwas zurückgelassen.", "The shadows left something behind."], [], { life: 3.2 });
    },
    leave() { Z.darkness = Math.min(Z.darkness || 0, 0.01); }
  };

  /* ---------- 6.2 Schatzgoblin: flieht mit seinem Sack ---------- */
  Z.ENEMIES.nmSchatzgoblin = { n: ["Schatzgoblin", "Treasure Goblin"], shape: "goblin", c: "#8aa23a", t: "#7a4a22", w: 10, h: 16, hp: 2.2, dmg: 0.3, spd: 158, ai: "skirmish", sight: 320, gold: 45, snd: "goblin", atks: [], kkDone: true, sigDone: true, noLoot: false };
  EVD.schatzgoblin = {
    n: ["Schatzgoblin", "Treasure Goblin"], w: 1.2, gentle: true,
    setup(lv, R) { const c = pickCell(lv, R, 8); return c ? { cell: c, e: null, coins: 0 } : null; },
    trig: s => playerIn(s.cell, 2),
    warn(s) { overHead(L(["Da klimpert etwas …", "Something is jingling…"]), "#ffd27a", 2); A.play("coin", { vol: 0.6 }); A.play("coin", { vol: 0.5, delay: 0.25 }); s.warnT = 0.9; },
    start(s) {
      const lv = Z.level, P = Z.player, f = P.face || 1, px = P.x + P.w / 2;
      let sp = spotsNear(lv, px + f * 110, P.y + P.h - 6, 70, 2).filter(q => Math.abs(sx(q) - px) > 60);
      if (!sp.length) sp = spotsNear(lv, px - f * 110, P.y + P.h - 6, 70, 2).filter(q => Math.abs(sx(q) - px) > 60);
      if (!sp.length) return "fail";
      const e = spawnFoe("nmSchatzgoblin", Z.R.pick(sp), { spawnT: 0.2, col: ["#ffd27a", "#c8a040"] }); if (!e) return "fail";
      s.e = e; e.nmPlateTxt = [["Schatzgoblin", "Treasure Goblin"], ["flieht!", "fleeing!"]]; e.nmPlateCol = "#ffd27a"; e.nmSack = true;
      s.limit = tierN() === 0 ? 24 : 19; e.face = U.sign(e.x - P.x) || 1;
      say(e, L(Z.R.pick([["Meins! Alles meins! Hihi!", "Mine! All mine! Hehe!"], ["Fang mich doch, Hörnchen!", "Catch me, little horns!"], ["Nicht die Beute! Nie die Beute!", "Not the loot! Never the loot!"]])), { who: L(this.n), life: 2.6 });
      evBanner(this.n, ["Er flieht mit seiner Beute – schnell!", "He's fleeing with his loot – quick!"], [[["Jeder Treffer lässt Münzen fallen.", "Every hit spills coins."], "#6a4a1a"]], { life: 3.4 });
      A.play("laugh", { x: e.x, vol: 0.6, rate: 1.5 });
    },
    tick(s, dt) {
      if (s.state !== "run") return;
      const e = s.e; if (!e) return "fail";
      if (e.dead) return "ok";
      const P = Z.player, dx = P.x + P.w / 2 - (e.x + e.w / 2), d = Math.abs(dx);
      e.aware = true; e.act = null;
      if (d < 260) Z.addStatus(e, "fear", 0.3);
      /* in die Ecke gedrängt: springt über Ezekiel hinweg */
      if (d < 46 && Math.abs(e.vx) < 30 && e.onGround) { s.stuck = (s.stuck || 0) + dt; if (s.stuck > 0.35) { s.stuck = 0; e.vy = -360; e.vx = U.sign(dx) * 260; e.st.fear = 0; e.kbT = 0.55; A.play("laugh", { x: e.x, vol: 0.4, rate: 1.7 }); } } else s.stuck = 0;
      if (Math.random() < dt * 5) FX.p({ x: e.x + e.w / 2 - e.face * 4, y: e.y + 4, vx: (Math.random() - 0.5) * 20, vy: -20, life: 0.5, size: 1.4, col: "#ffd27a", kind: "spark", add: true });
      if (s.t > s.limit) {
        FX.burst(e.x + e.w / 2, e.y + e.h / 2, 26, { col: ["#ffd27a", "#8a4ab0", "#4a2a5a"], sp: 90, life: 0.8, size: 3, kind: "smoke" });
        say({ x: e.x, y: e.y, w: e.w, h: e.h, gone: true }, L(["Bis zum nächsten Mal! Hihi!", "Till next time! Hehe!"]), { x: e.x + e.w / 2, y: e.y, who: L(this.n), life: 2.4 });
        A.play("magic", { x: e.x, vol: 0.6 }); e.dead = true; e.deadT = 99; return "fail";
      }
    },
    hit(s, e) { if (e !== s.e || s.coins > 8) return; s.coins++; Z.dropGold(e.x + e.w / 2, e.y + 4, 4 * Z.BAL.goldMul(tierN())); A.play("coin", { x: e.x, vol: 0.5 }); },
    after(s, c) {
      const e = s.e; if (!e || e.dead || s.state !== "run") return;
      const u = Math.max(0, 1 - s.t / s.limit), bw = 26, x = e.x + e.w / 2 - bw / 2, y = e.y + e.h + 4;
      c.fillStyle = "rgba(10,4,6,.7)"; c.fillRect(x - 1, y - 1, bw + 2, 3.4); c.fillStyle = u < 0.3 ? "#ff6a3a" : "#ffd27a"; c.fillRect(x, y, bw * u, 1.4);
    },
    finish(s, ok) {
      if (!ok || !s.e) return;
      const e = s.e, x = e.x + e.w / 2, y = e.y + e.h;
      Z.dropGold(x, y - 8, 110 * Z.BAL.goldMul(tierN()));
      later(() => { Z.spawnReward("waffe", x, y, { drop: true, rar: [0, 35, 45, 20] }); Z.spawnReward("glut", x, y, { n: 2 }); if (Z.R() < 0.35) Z.spawnReward("schluessel", x, y); }, 400);
      FX.burst(x, y - 8, 40, { col: ["#ffd27a", "#fff0c0", "#c8a040"], sp: 160, up: 80, life: 1, size: 2, kind: "spark", add: true, g: 300 });
      A.play("coin", { vol: 0.8 }); A.play("gem", { vol: 0.6, delay: 0.15 });
      evBanner(["Sack geplündert", "Sack plundered"], ["Der Schatzgoblin hat ausgeklimpert.", "The treasure goblin has jingled his last."], [], { life: 3 });
    }
  };

  /* ---------- 6.3 Blutmond-Horde ---------- */
  EVD.blutmond = {
    n: ["Blutmond", "Blood Moon"], w: 0.9,
    setup(lv, R) { const c = pickCell(lv, R, 14); return c ? { cell: c, wave: 0, waves: tierN() === 0 ? 2 : 3, foes: [], red: 0 } : null; },
    trig: s => playerIn(s.cell, 3),
    warn(s) { overHead(L(["Der Mond färbt sich blutrot …", "The moon turns blood red…"]), "#ff6a5a", 2.4); A.play("wolf", { vol: 0.6 }); A.play("dark", { vol: 0.4 }); s.warnT = 2; },
    start(s) {
      evBanner(this.n, ["Eine Horde bricht hervor – halte durch!", "A horde breaks loose – hold out!"], [[[(s.waves) + " Wellen · doppeltes Gold", (s.waves) + " waves · double gold"], "#8a1414"]], { seal: "☾" });
      if (Z.music && Z.music.stinger) Z.music.stinger("hinterhalt");
      this.next(s);
    },
    next(s) {
      s.wave++; s.pend = 0;
      const lv = Z.level, P = Z.player, ids = foesOf(lv), n = 3 + Math.min(2, tierN()) + (s.wave === s.waves ? 1 : 0);
      const sp = spotsIn(lv, s.cell, 2).concat(spotsNear(lv, P.x + P.w / 2, P.y + P.h - 6, 200, 2)).filter(q => { const d = Math.abs(sx(q) - (P.x + P.w / 2)); return d > 56 && d < 220; });
      for (let i = 0; i < n && sp.length; i++) {
        const q = sp.splice(Math.floor(Z.R() * sp.length), 1)[0]; s.pend++;
        const elite = s.wave === s.waves && i === 0 && tierN() >= 1;
        markThen(sx(q), sy(q), "255,50,40", 1 + i * 0.18, () => { s.pend--; if (Z.level !== lv || s.state !== "run") return; const e = spawnFoe(Z.R.pick(ids), q, { elite, flag: "nmBlood", col: ["#5a0a10", "#c8302a"] }); if (e) s.foes.push(e); A.play("roar", { x: sx(q), vol: 0.3, rate: 1.2 }); });
      }
      overHead(L(["Welle " + s.wave + " / " + s.waves, "Wave " + s.wave + " / " + s.waves]), "#ff8a6a", 1.8, 9);
    },
    tick(s, dt) {
      s.red = U.clamp(s.red + (s.state === "run" || s.state === "warn" ? dt : -dt) * 0.6, 0, 1);
      if (s.state !== "run") return;
      const alive = s.foes.filter(e => !e.dead && inLv(e)).length;
      if (s.pend <= 0 && alive <= (s.wave < s.waves ? 1 : 0)) { if (s.wave >= s.waves) { if (alive === 0) return "ok"; } else this.next(s); }
      if (s.t > 120) return "fail";
    },
    kill(s, e) { if (e.nmBlood) Z.dropGold(e.x + e.w / 2, e.y + e.h / 2, (e.def.gold || 4) * Z.BAL.goldMul(tierN())); },
    screen(s, c, Wd, Hd, t) {
      if (s.red <= 0.01) return;
      c.fillStyle = "rgba(120,0,10," + 0.13 * s.red + ")"; c.fillRect(0, 0, Wd, Hd);
      if (!lowG()) { if (!this.vig || this.vig.width !== 160) { const v = document.createElement("canvas"); v.width = 160; v.height = 90; const g = v.getContext("2d"), gr = g.createRadialGradient(80, 45, 30, 80, 45, 92); gr.addColorStop(0, "rgba(90,0,0,0)"); gr.addColorStop(1, "rgba(90,0,8,1)"); g.fillStyle = gr; g.fillRect(0, 0, 160, 90); this.vig = v; } c.globalAlpha = 0.45 * s.red; c.drawImage(this.vig, 0, 0, Wd, Hd); c.globalAlpha = 1; }
    },
    finish(s, ok) {
      if (!ok) return;
      const P = Z.player; chestNear(P.x + P.w / 2, P.y + P.h, { r: 80 });
      later(() => Z.spawnReward("segen", P.x + P.w / 2 + (P.face || 1) * 30, P.y + P.h), 500);
      A.play("holy", { vol: 0.6 }); FX.flashScreen("#ffd0b0", 0.2);
      evBanner(["Der Blutmond verblasst", "The blood moon fades"], ["Die Horde ist zerschlagen.", "The horde is broken."], [], { life: 3, seal: "☾" });
    }
  };

  /* ---------- 6.4 Geisterprozession: friedlich – wer nicht angreift, wird gesegnet ---------- */
  const GH = [];
  EVD.geisterzug = {
    n: ["Geisterprozession", "Ghostly Procession"], w: 1, gentle: true,
    setup(lv, R) {
      const c = pickCell(lv, R, 10); if (!c) return null;
      const sp = spotsIn(lv, c, 3); if (sp.length < 6) return null;
      sp.sort((a, b) => a[0] - b[0]);
      const dir = R() < 0.5 ? 1 : -1, a = dir > 0 ? sp[0] : sp[sp.length - 1], b = dir > 0 ? sp[sp.length - 1] : sp[0];
      if (Math.abs(a[0] - b[0]) < 8) return null;
      return { cell: c, dir, x0: sx(a), x1: sx(b), y0: sy(a), angry: false, done: false };
    },
    trig: s => { const P = Z.player; return playerIn(s.cell, 1) || Math.abs(P.x - s.x0) < 160 && Math.abs(P.y + P.h - s.y0) < 90; },
    warn(s) { overHead(L(["Leiser Gesang … halte inne.", "Soft chanting… be still."]), "#f0e0c8", 2.6); A.play("holy", { vol: 0.35, rate: 0.8 }); s.warnT = 1.2; },
    start(s) {
      GH.length = 0;
      const n = 5;
      for (let i = 0; i < n; i++) GH.push({ x: s.x0 - s.dir * i * 22, y: s.y0, t: -i * 0.6, a: 0, role: i === 0 ? "laterne" : i === n - 1 ? "ahnin" : "pilger", seed: i * 7 + 3, bob: Math.random() * 6 });
      evBanner(this.n, ["Greif nicht an – wer still bleibt, wird gesegnet.", "Don't attack – those who stay still are blessed."], [], { seal: "✧", life: 4.4 });
      if (Z.music && Z.music.duck) Z.music.duck(0.4, 6);
    },
    tick(s, dt) {
      if (s.state !== "run") return;
      const P = Z.player, lv = Z.level;
      for (const g of GH) {
        g.t += dt; if (g.t < 0) continue; g.a = Math.min(1, g.a + dt * 0.8);
        if (!g.stop) g.x += s.dir * 20 * dt;
        const gy = W.groundBelow(g.x, g.y - 20, 60); if (gy != null) g.y = U.lerp(g.y, gy, Math.min(1, dt * 4));
        /* Angriff in der Nähe der Toten? */
        if (!s.angry && P.act && P.act.phase === "act" && P.act.type !== "skill" && Math.abs(P.x + P.w / 2 + (P.face || 1) * 12 - g.x) < 30 && Math.abs(P.y + P.h - g.y) < 30) s.angry = g;
        if (!s.angry) for (const q of Z.projs) if (q.owner === "p" && Math.abs(q.x - g.x) < 9 && q.y > g.y - 26 && q.y < g.y) { s.angry = g; break; }
      }
      if (s.angry) return "fail";
      const last = GH[GH.length - 1], lead = GH[0];
      /* die Ahnin hält bei Ezekiel inne, wenn er in der Nähe still steht */
      if (last.t > 0 && !last.stop && Math.abs(last.x - (P.x + P.w / 2)) < 26 && Math.abs(last.y - (P.y + P.h)) < 30) { last.stop = true; s.blessAt = s.t + 1.8; say({ x: last.x - 5, y: last.y - 24, w: 10, h: 24, gone: true }, L(["Du hast die Toten ziehen lassen. Nimm dies, Gehörnter.", "You let the dead pass. Take this, horned one."]), { x: last.x, y: last.y - 24, who: L(["Die Ahnin", "The Elder"]), life: 3.4, ink: "#3a2a3a" }); }
      if (s.blessAt && s.t > s.blessAt) return "ok";
      if (s.dir * (lead.x - s.x1) > 30 && s.dir * (last.x - s.x1) > 0) return "ok";
      if (s.t > 40) return "ok";
    },
    draw(s, c, t) {
      if (!GH.length) return;
      for (const g of GH) {
        if (g.t < 0) continue;
        const a = g.a * (s.fade != null ? s.fade : 1); if (a <= 0.01) continue;
        const x = g.x, y = g.y - 2 - Math.sin(t * 1.6 + g.bob) * 1.6;
        c.save(); c.globalAlpha = a * 0.78; c.translate(x, y); c.scale(s.dir, 1);
        if (!lowG()) glow(c, 0, -12, 16, "rgba(255,240,220,.18)");
        /* weite Kutte, Kapuze, schleppender Saum */
        const sw = Math.sin(t * 2 + g.seed) * 1.2;
        poly(c, [-4, -18, 4, -18, 6 + sw, -1, 2, 1, -2, -1.5, -6 + sw, 0.5], g.role === "ahnin" ? "#d8c8d8" : "#c8bcc8");
        poly(c, [-4, -18, -1, -18, -2 + sw, 0, -6 + sw, 0.5], "#a898a8");
        ell(c, 0.6, -20, 3.4, 3.8, "#e8dce8"); poly(c, [-3.6, -19, -1, -24.6, 3.6, -22, 4, -18], "#b8a8b8");
        c.fillStyle = "#3a2a3a"; c.fillRect(1.6, -20.6, 1.2, 0.9);
        if (g.role === "laterne") { limb(c, 2, -14, 8, -18, 1, "#b8a8b8"); limb(c, 8, -18, 8, -15, 0.4, "#8a7a6a"); poly(c, [6.6, -15, 9.4, -15, 9, -11.6, 7, -11.6], "#e8c870"); }
        else if (g.role === "ahnin") { limb(c, 2.5, -14, 7, -10, 1, "#b8a8b8"); limb(c, 7, -22, 7, 0, 0.8, "#8a7a6a"); }
        else { limb(c, 1, -13, 5, -12, 1, "#b8a8b8"); circ(c, 5.4, -13.2, 0.9, "#f0e0b0"); }
        c.restore();
        if (Z.addLight) Z.addLight(x + s.dir * (g.role === "laterne" ? 8 : 5), y - 13, g.role === "laterne" ? 54 : 26, "#ffd8a0", 0.3 * a);
        if (!lowG() && Math.random() < 0.08) FX.p({ x: x + (Math.random() - 0.5) * 8, y: y - 6, vx: -s.dir * 6, vy: -8, life: 1, size: 1.6, col: "#f0e0f0", kind: "glow", add: true });
      }
    },
    finish(s, ok) {
      const P = Z.player;
      if (!ok) {
        const g = s.angry || GH[0];
        say({ x: g.x - 5, y: g.y - 24, w: 10, h: 24, gone: true }, L(["Ihr stört die Toten?! Dann leistet ihnen Gesellschaft!", "You disturb the dead?! Then join them!"]), { x: g.x, y: g.y - 24, who: L(["Die Prozession", "The procession"]), life: 3 });
        A.play("undead", { vol: 0.7 }); A.play("dark", { vol: 0.5 }); FX.flashScreen("#d8c8e8", 0.2);
        for (const q of GH) FX.burst(q.x, q.y - 12, 10, { col: ["#e8dce8", "#8a7a8a"], sp: 70, life: 0.7, size: 3, kind: "smoke" });
        const sp = spotsNear(Z.level, g.x, g.y - 4, 90, 2);
        for (let i = 0; i < 1 + Math.min(2, tierN()) && sp.length; i++) spawnFoe("schatten", sp.splice(Math.floor(Z.R() * sp.length), 1)[0], { col: ["#2a1830", "#6a4a7a"] });
        GH.length = 0; return;
      }
      s.fade = 1; s.fading = true;
      const x = P.x + P.w / 2, y = P.y + P.h;
      Z.spawnReward("segen", x + (P.face || 1) * 26, y);
      if (Z.healPlayer) Z.healPlayer(P.hpMax * 0.25);
      A.play("holy", { vol: 0.7 }); FX.burst(x, y - 12, 26, { col: ["#fff0d0", "#e8d0e8"], sp: 70, up: 40, life: 1, size: 2, kind: "glow", add: true });
      const tip = intel();
      evBanner(["Segen der Toten", "Blessing of the dead"], ["Die Prozession zieht weiter.", "The procession moves on."], tip ? [[tip, "#5a2a4a"]] : [], { seal: "✧", life: tip ? 5 : 3.4 });
    },
    after(s) { if (s.fading) { s.fade = Math.max(0, s.fade - 0.012); if (s.fade <= 0) { GH.length = 0; s.fading = false; } } },
    leave() { GH.length = 0; }
  };

  /* ---------- 6.5 Elite-Duell: ein Champion fordert Ezekiel heraus ---------- */
  EVD.duell = {
    n: ["Herausforderung", "Challenge"], w: 0.9,
    ok: lv => foesOf(lv).length > 0,
    setup(lv, R) {
      const c = pickCell(lv, R, 14); if (!c) return null;
      const ids = foesOf(lv).sort((a, b) => (Z.ENEMIES[b].hp || 1) - (Z.ENEMIES[a].hp || 1)), id = ids[0];
      const sp = spotsIn(lv, c, 3); if (!sp.length) return null;
      const [cx] = cellCenter(c); sp.sort((a, b) => Math.abs(sx(a) - cx) - Math.abs(sx(b) - cx));
      const P = Z.player, q = EVFORCE ? sp.filter(s => Math.abs(sx(s) - (P.x + P.w / 2)) > 90)[0] || sp[0] : sp[0];
      const e = Z.spawnEnemy(id, sx(q), sy(q), { tier: tierN(), elite: true }); if (!e) return null;
      e.nmEvent = true; e.nmDuel = true; e.hp = e.hpMax = Math.round(e.hpMax * (tierN() === 0 ? 1 : 1.35));
      const fam = FAM[id] || "mensch", nm = genName(fam, R);
      e.nmPlateTxt = [nm, ["Champion der Feste", "Champion of the Keep"]]; e.nmPlateCol = "#ffc070";
      return { cell: c, e, name: nm, poles: [sx(q) - 46, sx(q) + 46].map(x => [x, W.groundBelow(x, sy(q) - 30, 60) || sy(q)]), sealed: [] };
    },
    trig: s => !s.e.dead && (playerIn(s.cell, 3) || s.e.aware) && Math.abs(Z.player.x - s.e.x) < 200,
    warn(s) {
      const e = s.e; e.aware = false; e.act = null; e.face = U.sign(Z.player.x - e.x) || 1;
      say(e, L(["Halt, Gehörnter! Du und ich – allein und ehrenhaft.", "Halt, horned one! You and me – alone, with honour."]), { who: L(s.name), life: 3 });
      A.play("horn", { vol: 0.6 }); s.warnT = 1.4;
    },
    start(s) {
      const e = s.e; if (e.dead) return "fail";
      const tl = sealCell(s.cell); if (tl) s.sealed = tl;
      /* die anderen treten zurück */
      for (const o of Z.enemies) if (o !== e && !o.dead && !o.def.boss && inCell(s.cell, o.x + o.w / 2, o.y + o.h / 2)) { FX.burst(o.x + o.w / 2, o.y + o.h / 2, 10, { col: ["#2a2024", "#4a3a40"], sp: 60, life: 0.5, size: 3, kind: "smoke" }); o.dead = true; o.deadT = 99; }
      e.aware = true; e.cd = 0.8;
      showUp(e, L(["Zweikampf", "Duel"]), L(s.name), L(["Champion der Feste", "Champion of the Keep"]), [[L(["Besiege ihn – es lohnt sich.", "Defeat him – it'll be worth it."]), "#5a3a1a"]], (e.id.length * 977) + 13, { kind: "mini", seal: "⚔", pan: 1.1, sfx: "horn" });
    },
    tick(s) { if (s.state === "wait") { if (s.e.dead) s.state = "run"; else s.e.aware = s.e.aware && playerIn(s.cell, 0); } if (s.state !== "run") return; if (s.e.dead) return "ok"; if (s.t > 150) return "fail"; },
    draw(s, c, t) {
      for (const [x, y] of s.poles) {
        limb(c, x, y, x, y - 30, 1.4, "#3a2a1a");
        const sw = Math.sin(t * 2.4 + x) * 1.4;
        poly(c, [x + 0.6, y - 30, x + 10 + sw, y - 28, x + 8 + sw, y - 23, x + 10 + sw, y - 18, x + 0.6, y - 19], "#8a1414");
        c.fillStyle = "#ffd27a"; c.fillRect(x + 3.6 + sw * 0.5, y - 26, 2.4, 2.4);
        circ(c, x, y - 31, 1.4, "#c8a050");
      }
      if (s.state === "run") drawSeal(c, s.sealed, t, "200,120,40");
    },
    finish(s, ok) {
      unsealTiles(s.sealed);
      if (!ok) return;
      const e = s.e, x = e.x + e.w / 2, y = e.y + e.h;
      say({ x: e.x, y: e.y, w: e.w, h: e.h, gone: true }, L(["Ein … würdiger … Gegner.", "A … worthy … foe."]), { x, y: e.y, who: L(s.name), life: 2.6 });
      later(() => { Z.spawnReward("waffe", x, y, { drop: true, rar: [0, 15, 55, 30], plus: 1 }); Z.spawnReward("glut", x, y, { n: 2 }); }, 500);
      Z.dropShards(x, y - 8, 16 + 5 * tierN());
      evBanner(["Zweikampf gewonnen", "Duel won"], ["Die Feste hat es gesehen.", "The keep has seen it."], [], { kind: "mini", seal: "⚔", life: 3 });
    },
    leave(s) { if (s && s.sealed) unsealTiles(s.sealed); }
  };

  /* ---------- 6.6 Ritual unterbrechen (Zeitlimit) ---------- */
  EVD.ritual = {
    n: ["Das Ritual", "The Ritual"], w: 1,
    setup(lv, R) {
      const c = pickCell(lv, R, 12); if (!c) return null;
      const sp = spotsIn(lv, c, 3), [cx] = cellCenter(c); sp.sort((a, b) => Math.abs(sx(a) - cx) - Math.abs(sx(b) - cx));
      const P = Z.player, mid = EVFORCE ? sp.filter(s => Math.abs(sx(s) - (P.x + P.w / 2)) > 110)[0] || sp[0] : sp[0];
      const x = sx(mid), y = sy(mid), cult = [], ids = tierN() >= 3 ? ["adept", "bewahrer", "robe"] : ["adept", "robe", "robe"];
      const near = spotsNear(lv, x, y - 4, 60, 2).filter(q => Math.abs(sx(q) - x) > 18 && Math.abs(sy(q) - y) < 20);
      for (let i = 0; i < 3 && near.length; i++) {
        const q = near.splice(Math.floor(R() * near.length), 1)[0];
        const e = Z.spawnEnemy(ids[i], sx(q), sy(q), { tier: tierN() }); if (!e) continue;
        e.nmEvent = true; e.nmCult = true; e.face = U.sign(x - e.x) || 1; e.spawnT = 0; e.nmHx = e.x; cult.push(e);
      }
      if (cult.length < 2) { for (const e of cult) { e.dead = true; e.deadT = 99; } return null; }
      return { cell: c, x, y, cult, prog: 0, limit: tierN() === 0 ? 34 : 27 };
    },
    trig: s => { const P = Z.player; return Math.abs(P.x + P.w / 2 - s.x) < 240 && Math.abs(P.y + P.h - s.y) < 120 && W.los(s.x, s.y - 14, P.x + P.w / 2, P.y + 8); },
    warn(s) { A.play("magic", { x: s.x, vol: 0.5, rate: 0.7 }); s.warnT = 0.8; if (s.cult[0]) say(s.cult[0], L(["Ezekiel! Er stört die Beschwörung – haltet ihn auf!", "Ezekiel! He's disturbing the summoning – stop him!"]), { who: L(["Beschwörer", "Summoner"]), life: 2.6 }); },
    start(s) {
      camPan(s.x, s.y - 20, 1.3);
      evBanner(this.n, ["Töte die Beschwörer, bevor die Zeit abläuft!", "Kill the summoners before time runs out!"], [[["Wer kämpft, singt nicht – das verlangsamt das Ritual.", "Those who fight don't chant – that slows the ritual."], "#4a2a5a"]], { seal: "⛧" });
      if (Z.music && Z.music.push) Z.music.push(0.5, 6);
    },
    tick(s, dt) {
      const alive = s.cult.filter(e => !e.dead && inLv(e));
      const P = Z.player;
      for (const e of alive) {
        /* in Trance: hört erst auf zu singen, wenn er getroffen wird oder Ezekiel direkt vor ihm steht */
        if (!e.nmWoke && (Math.abs(P.x + P.w / 2 - (e.x + e.w / 2)) < 52 && Math.abs(P.y - e.y) < 40)) e.nmWoke = true;
        e.nmChant = !e.nmWoke;
        if (e.nmChant) { e.aware = false; e.act = null; e.x = e.nmHx; e.vx = 0; e.face = U.sign(s.x - e.x) || e.face; if (Math.random() < dt * 4) FX.p({ x: e.x + e.w / 2, y: e.y + 6, vx: (s.x - e.x) * 0.5, vy: -10, life: 0.9, size: 1.6, col: "#ff4a6a", kind: "glow", add: true }); } }
      if (s.state !== "run") return;
      if (!alive.length) return "ok";
      const rate = Math.max(0.4, alive.filter(e => e.nmChant).length / s.cult.length);
      s.prog += dt * rate / s.limit;
      if (s.prog >= 1) return "fail";
    },
    hit(s, e) { if (e.nmCult && !e.nmWoke) { e.nmWoke = true; e.aware = true; A.play("roar", { x: e.x, vol: 0.3, rate: 1.3 }); } },
    draw(s, c, t) {
      const k = U.clamp(s.prog, 0, 1), x = s.x, y = s.y - 0.5;
      c.save(); c.globalCompositeOperation = "lighter";
      c.globalAlpha = 0.35 + 0.5 * k; c.strokeStyle = "#c8304a"; c.lineWidth = 1;
      c.beginPath(); c.ellipse(x, y, 34, 7, 0, 0, TAU); c.stroke(); c.beginPath(); c.ellipse(x, y, 26, 5.4, 0, 0, TAU); c.stroke();
      for (let i = 0; i < 5; i++) { const a = i / 5 * TAU + t * 0.4, a2 = a + TAU * 2 / 5; c.beginPath(); c.moveTo(x + Math.cos(a) * 26, y + Math.sin(a) * 5.4); c.lineTo(x + Math.cos(a2) * 26, y + Math.sin(a2) * 5.4); c.stroke(); }
      for (let i = 0; i < 8; i++) { const a = i / 8 * TAU - t * 0.6; c.fillStyle = "#ff8a6a"; c.fillRect(x + Math.cos(a) * 30 - 0.8, y + Math.sin(a) * 6.2 - 1.6, 1.6, 2.4); }
      if (!lowG()) glow(c, x, y - 4, 20 + 30 * k, "rgba(200,40,70," + (0.2 + 0.35 * k) + ")");
      if (k > 0.5 && Math.random() < 0.3) FX.p({ x: x + (Math.random() - 0.5) * 50, y, vx: 0, vy: -40 - 60 * k, life: 0.8, size: 2, col: "#ff4a5a", kind: "glow", add: true });
      c.restore();
      if (Z.addLight) Z.addLight(x, y - 8, 60 + 60 * k, "#c8304a", 0.25 + 0.35 * k);
    },
    after(s, c, cam, t) {
      if (s.state !== "run") return;
      const k = U.clamp(s.prog, 0, 1), x = s.x, y = s.y - 52;
      c.save(); c.lineWidth = 3; c.strokeStyle = "rgba(10,4,6,.7)"; c.beginPath(); c.arc(x, y, 9, 0, TAU); c.stroke();
      c.strokeStyle = k > 0.75 ? (Math.sin(t * 14) > 0 ? "#ff4a3a" : "#ffb070") : "#c8304a"; c.lineWidth = 2; c.beginPath(); c.arc(x, y, 9, -PI / 2, -PI / 2 + TAU * k); c.stroke();
      c.font = "900 7px 'Alegreya Sans',sans-serif"; c.textAlign = "center"; c.fillStyle = "#f4e0c8"; c.fillText(Math.max(0, Math.ceil((1 - k) * s.limit)) + "", x, y + 2.4);
      c.restore();
    },
    finish(s, ok) {
      const x = s.x, y = s.y;
      if (ok) {
        A.play("glass", { x, vol: 0.7 }); A.play("holy", { vol: 0.5 }); FX.burst(x, y - 6, 34, { col: ["#ff8a6a", "#ffd27a", "#c8304a"], sp: 140, life: 0.8, size: 2, kind: "spark", add: true });
        later(() => { runeDrop(x, y, 3); Z.spawnReward("glut", x, y, { n: 2 }); Z.spawnReward("rolle", x + 14, y, { drop: true }); }, 400);
        evBanner(["Ritual vereitelt", "Ritual thwarted"], ["Der Kreis zerspringt.", "The circle shatters."], [], { seal: "⛧", life: 3 });
        return;
      }
      /* vollendet: etwas kommt durch den Kreis */
      FX.flashScreen("#ff3a3a", 0.35); FX.addShake(6); A.play("dark", { vol: 0.8 }); A.play("roar", { vol: 0.7 });
      evBanner(["Das Ritual ist vollendet!", "The ritual is complete!"], ["Etwas tritt durch den Kreis …", "Something steps through the circle…"], [], { seal: "⛧", life: 3 });
      const mb = MB.pickFor && MB.pickFor(Z.level.biome);
      if (mb && MB.spawn) { const e = MB.spawn(mb, x, y, { noSeal: true }); if (e) { e.aware = true; return; } }
      const e = spawnFoe("schatten", [Math.floor(x / T), Math.floor(y / T) - 1], { elite: true, col: ["#2a1830", "#c8304a"] });
      if (e) { e.hp = e.hpMax = Math.round(e.hpMax * 1.5); e.nmPlateTxt = [["Beschworener Schrecken", "Summoned Horror"], ["aus dem Kreis", "from the circle"]]; e.nmPlateCol = "#ff6a5a"; }
    }
  };

  /* ---------- 6.7 Gefangenentransport ---------- */
  EVD.gefangene = {
    n: ["Gefangenentransport", "Prisoner Convoy"], w: 0.9,
    setup(lv, R) {
      const c = pickCell(lv, R, 12); if (!c) return null;
      const sp = spotsIn(lv, c, 3), [cx] = cellCenter(c); sp.sort((a, b) => Math.abs(sx(a) - cx) - Math.abs(sx(b) - cx));
      const P = Z.player, q = EVFORCE ? sp.filter(s => Math.abs(sx(s) - (P.x + P.w / 2)) > 100)[0] || sp[0] : sp[0];
      const x = sx(q), y = sy(q), guards = [];
      const ids = ["kerkerwache", "soeldner", tierN() >= 2 ? "robeSchlaeger" : "kerkerwache"];
      const near = spotsNear(lv, x, y - 4, 80, 2).filter(s => Math.abs(sx(s) - x) > 26 && Math.abs(sy(s) - y) < 24);
      for (let i = 0; i < 2 + (tierN() >= 2 ? 1 : 0) && near.length; i++) {
        const s = near.splice(Math.floor(R() * near.length), 1)[0];
        const e = Z.spawnEnemy(ids[i], sx(s), sy(s), { tier: tierN(), elite: i === 0 && tierN() >= 3 }); if (!e) continue;
        e.nmEvent = true; e.nmGuard = true; e.spawnT = 0; e.face = U.sign(x - e.x) || 1; guards.push(e);
      }
      /* wer sitzt im Käfig? Ein künftiger Lagerbewohner, wenn die Lager-Schnittstelle einen anbietet */
      let res = null; const LG = Z.lager;
      try { if (LG && LG.RES && typeof LG.rescue === "function") { const st = typeof LG.stage === "function" ? LG.stage() : 0; const c2 = Object.keys(LG.RES).filter(id => { const r = LG.RES[id]; return r && r.where === "side" && (r.min | 0) <= st && !(LG.has && LG.has(id)); }); if (c2.length) res = R.pick(c2); } } catch (_) {}
      const st = { cell: c, x, y, guards, res, open: false, fire: [x + (R() < 0.5 ? -30 : 30), y] };
      st.ia = { x, y, r: 26, h: 30, ok: () => !st.open, label: () => L(["Käfig öffnen", "Open the cage"]), use: () => this.open(st) };
      (Z.interacts = Z.interacts || []).push(st.ia);
      return st;
    },
    trig: s => { const P = Z.player; return Math.abs(P.x + P.w / 2 - s.x) < 210 && Math.abs(P.y + P.h - s.y) < 100; },
    warn(s) { say({ x: s.x - 6, y: s.y - 22, w: 12, h: 20, gone: true }, L(["Hilfe! Hier drüben! Die bringen mich zur Spinne!", "Help! Over here! They're taking me to the Spider!"]), { x: s.x, y: s.y - 22, who: this.who(s), life: 3 }); A.play("chain", { x: s.x, vol: 0.6 }); s.warnT = 0.6; },
    who: s => (s.res && Z.lager.RES[s.res] ? Z.lager.RES[s.res].n : L(["Gefangener", "Prisoner"])),
    start(s) { evBanner(this.n, ["Besiege die Wachen und öffne den Käfig.", "Defeat the guards and open the cage."], [], { seal: "⛓", life: 3.4 }); },
    open(s) {
      if (s.open) return;
      const g = s.guards.find(e => !e.dead && inLv(e) && Math.abs(e.x - s.x) < 170);
      if (g) { g.aware = true; say({ x: s.x - 6, y: s.y - 22, w: 12, h: 20, gone: true }, L(["Die Wachen! Hinter dir!", "The guards! Behind you!"]), { x: s.x, y: s.y - 22, who: this.who(s), life: 2 }); A.play("chain", { vol: 0.4 }); return; }
      s.open = true; s.openT = 0; A.play("chain", { x: s.x, vol: 0.8 }); A.play("door", { x: s.x, vol: 0.5 });
      FX.burst(s.x, s.y - 12, 18, { col: ["#9a8a7a", "#ffd27a"], sp: 100, life: 0.6, size: 2, kind: "shard", g: 500 });
      if (s.state === "wait" || s.state === "warn") { s.state = "run"; s.t = 0; }
      s.freed = true;
    },
    tick(s) { if (s.state === "run" && s.freed) return "ok"; },
    draw(s, c, t) {
      const x = s.x, y = s.y, P = Z.player;
      /* Lagerfeuer der Wachen */
      const [fx, fy] = s.fire; for (let i = 0; i < 3; i++) limb(c, fx - 4 + i * 3, fy - 0.6, fx - 1 + i * 3, fy - 2.4, 1.3, "#3a2416");
      if (!s.done) { poly(c, [fx - 3, fy - 1, fx, fy - 7 - Math.sin(t * 9) * 1.4, fx + 3, fy - 1], "#ff8a3a"); poly(c, [fx - 1.4, fy - 1, fx, fy - 4.4, fx + 1.4, fy - 1], "#ffe0a0"); if (Z.addLight) Z.addLight(fx, fy - 4, 60, "#ff9a40", 0.4); }
      /* Käfigwagen: Räder, Boden, Gitter */
      for (const wx of [-10, 10]) { circ(c, x + wx, y - 4, 4, "#3a2a1a"); circ(c, x + wx, y - 4, 2.6, "#6a4a2a"); limb(c, x + wx - 3, y - 4, x + wx + 3, y - 4, 0.5, "#3a2a1a"); }
      c.fillStyle = "#5a3a22"; c.fillRect(x - 15, y - 9, 30, 3);
      /* Gefangener */
      const inside = !s.open || (s.openT || 0) < 0.6;
      if (inside) { const sh = Math.sin(t * 2) * 0.4; ell(c, x, y - 15 + sh, 3.2, 4.4, "#7a6a5a"); circ(c, x + 0.4, y - 21 + sh, 2.6, "#d8b090"); c.fillStyle = "#2a1a14"; c.fillRect(x + 1.2, y - 21.6 + sh, 0.9, 0.8); limb(c, x - 2.6, y - 16, x - 4, y - 21 + Math.sin(t * 6) * (s.state === "warn" ? 2 : 0.4), 1, "#d8b090"); }
      c.fillStyle = "#3a2a1a"; c.fillRect(x - 15, y - 29, 30, 2.4);
      const op = s.open ? Math.min(1, (s.openT = (s.openT || 0) + 1 / 60)) : 0;
      for (let i = 0; i < 7; i++) { const bx = x - 13.5 + i * 4.5; if (op > 0 && i >= 2 && i <= 4) continue; limb(c, bx, y - 9, bx, y - 27, 0.8, "#6a6a70"); }
      if (op > 0) { c.save(); c.translate(x - 4.5, y - 9); c.rotate(-op * 1.3); for (let i = 0; i < 3; i++) limb(c, i * 4.5, 0, i * 4.5, -18, 0.8, "#6a6a70"); c.restore(); }
      else circ(c, x + 4, y - 18, 1.4, "#c8a050");
      if (!s.open && P && Math.abs(P.x - x) < 60 && Math.sin(t * 4) > 0) { c.save(); c.globalAlpha = 0.5; glow(c, x, y - 16, 18, "rgba(255,210,120,.35)"); c.restore(); }
    },
    finish(s, ok) {
      s.done = true;
      if (!ok) return;
      const x = s.x, y = s.y, LG = Z.lager, who = this.who(s);
      let line;
      if (s.res && LG && LG.rescue(s.res)) line = L(["Danke, Gehörnter! Ich schlage mich ins Lager durch – wir sehen uns dort.", "Thank you, horned one! I'll make my way to camp – see you there."]);
      else { line = L(["Danke! Ich hab nicht viel – aber nimm das hier.", "Thank you! I don't have much – but take this."]); later(() => { Z.spawnReward("heil", x, y, { drop: true, big: true }); Z.spawnReward("gold", x, y, { n: 60 }); }, 300); }
      say({ x: x - 6, y: y - 22, w: 12, h: 20, gone: true }, line, { x, y: y - 22, who, life: 3.6 });
      A.play("holy", { vol: 0.5 });
      const tip = intel();
      evBanner(["Befreit", "Freed"], [who + L([" ist frei.", " is free."]), who + L([" is free.", " is free."])], tip ? [[tip, "#5a2a4a"]] : [], { seal: "⛓", life: tip ? 5 : 3 });
      if (Z.stats) Z.stats.nmBefreit = (Z.stats.nmBefreit || 0) + 1;
    }
  };

  /* ---------- 6.8 Einsturz: Gestein fällt, Schatten warnen ---------- */
  const ROCKS = [];
  function ceilAbove(x, y) { for (let yy = y - 8; yy > y - 200; yy -= 8) if (W.solidAt(x, yy)) return yy + 8; return y - 200; }
  function dropRock(x, o) {
    o = o || {}; const P = Z.player, gy = W.groundBelow(x, (o.y0 != null ? o.y0 : P.y) - 40, 160); if (gy == null) return null;
    const r = { x, gy, top: ceilAbove(x, gy - 20), t: 0, warn: o.warn || 0.95, fall: 0.28, dmg: o.dmg || 10, kind: o.kind || "rock", size: o.size || (3.5 + Math.random() * 2.5), owner: o.owner || null, hit: false };
    ROCKS.push(r); return r;
  }
  function rocksTick(dt) {
    const P = Z.player;
    for (let i = ROCKS.length - 1; i >= 0; i--) {
      const r = ROCKS[i]; r.t += dt;
      if (!r.hit && r.t >= r.warn + r.fall) {
        r.hit = true; r.landT = 0;
        const w = r.kind === "cage" ? 12 : r.size + 7;
        FX.burst(r.x, r.gy - 2, r.kind === "cage" ? 10 : 12, { col: r.kind === "cage" ? ["#8a8a90", "#5a4a3a"] : ["#7a6a5a", "#5a4a3a", Z.dustCol || "#8a7a70"], sp: 110, ang: -PI / 2, spread: 2.6, life: 0.5, size: 2.4, kind: "shard", g: 600 });
        A.play(r.kind === "cage" ? "hitMetal" : "rock", { x: r.x, vol: 0.6 }); FX.addShake(r.kind === "cage" ? 4 : 2);
        if (P && !P.dead && Math.abs(P.x + P.w / 2 - r.x) < w && P.y + P.h > r.gy - 30 && P.y < r.gy + 2) {
          Z.hurtPlayer(r.dmg, { attacker: r.owner && !r.owner.dead ? r.owner : null, x: r.x, kb: 120, unblockable: true, parryable: false, trap: !r.owner });
          if (r.kind === "cage") { Z.addStatus(P, "root", 1.3, true); FX.text(P.x + P.w / 2, P.y - 10, L(["Eingesperrt!", "Caged!"]), "#ffb070"); }
        }
        if (r.kind !== "cage") for (const e of Z.enemies) if (!e.dead && !e.def.boss && Math.abs(e.x + e.w / 2 - r.x) < w && e.y + e.h > r.gy - 30 && e.y < r.gy + 2) Z.hitEnemy(e, r.dmg * 1.4, { src: "trap", x: r.x, kb: 60 });
      }
      if (r.hit) { r.landT += dt; if (r.landT > (r.kind === "cage" ? 2.2 : 0.6)) ROCKS.splice(i, 1); }
    }
  }
  function drawRocks(c, t) {
    for (const r of ROCKS) {
      if (!r.hit) {
        const u = U.clamp(r.t / r.warn, 0, 1), w = (r.kind === "cage" ? 13 : r.size + 6) * (0.5 + 0.5 * u);
        c.save(); c.globalAlpha = 0.25 + 0.45 * u; ell(c, r.x, r.gy - 0.6, w, 1.6 + u, "#120808"); c.restore();
        if (u > 0.6 && Math.sin(t * 30) > 0) { c.save(); c.globalAlpha = 0.6; c.strokeStyle = "#ffb070"; c.lineWidth = 0.6; c.beginPath(); c.ellipse(r.x, r.gy - 0.6, w + 1, 2.4, 0, 0, TAU); c.stroke(); c.restore(); }
        if (Math.random() < 0.15) FX.p({ x: r.x + (Math.random() - 0.5) * 8, y: r.top + 2, vx: 0, vy: 60, life: 0.6, size: 1.2, col: Z.dustCol || "#8a7a70", kind: "smoke" });
        if (r.t > r.warn) { const k = (r.t - r.warn) / r.fall, yy = U.lerp(r.top, r.gy - (r.kind === "cage" ? 0 : r.size), k * k); drawDrop(c, r, yy, t); }
      } else drawDrop(c, r, r.gy - (r.kind === "cage" ? 0 : r.size * 0.7), t, Math.max(0, 1 - r.landT / (r.kind === "cage" ? 2.2 : 0.6)));
    }
  }
  function drawDrop(c, r, y, t, a) {
    c.save(); if (a != null) c.globalAlpha = a;
    if (r.kind === "cage") {
      limb(c, r.x, r.top, r.x, y - 22, 0.6, "#5a5a60");
      c.fillStyle = "#3a3a40"; c.fillRect(r.x - 11, y - 23, 22, 2); c.fillRect(r.x - 11, y - 1.6, 22, 1.6);
      for (let i = 0; i < 6; i++) limb(c, r.x - 10 + i * 4, y - 22, r.x - 10 + i * 4, y - 1, 0.7, "#7a7a80");
    } else {
      c.translate(r.x, y); c.rotate(r.x * 0.3 + (a == null ? t * 4 : 0));
      poly(c, [-r.size, -r.size * 0.3, -r.size * 0.4, -r.size, r.size * 0.7, -r.size * 0.6, r.size, r.size * 0.3, r.size * 0.2, r.size, -r.size * 0.8, r.size * 0.6], "#6a5a4a");
      poly(c, [-r.size * 0.6, -r.size * 0.3, -r.size * 0.2, -r.size * 0.7, r.size * 0.4, -r.size * 0.4, 0, 0], "#8a7a6a");
    }
    c.restore();
  }
  EVD.einsturz = {
    n: ["Einsturz", "Cave-in"], w: 0.9,
    setup(lv, R) { const c = pickCell(lv, R, 10); return c ? { cell: c, next: 0 } : null; },
    trig: s => playerIn(s.cell, 4),
    warn(s) { overHead(L(["Die Decke bebt!", "The ceiling shakes!"]), "#ffb070", 2.2, 9); A.play("quake", { vol: 0.8 }); FX.addShake(4); s.warnT = 1.5; },
    start(s) {
      s.dur = tierN() === 0 ? 7 : 9.5;
      evBanner(Z.level.out ? ["Erdbeben", "Earthquake"] : this.n, ["Achte auf die Schatten am Boden!", "Watch the shadows on the ground!"], [[["Fallendes Gestein trifft auch Gegner.", "Falling rock hits enemies too."], "#5a3a1a"]], { seal: "⚒", life: 3.2 });
    },
    tick(s, dt) {
      if (s.state === "warn" && Math.random() < dt * 20) { const cam = Z.cam; FX.p({ x: cam.x + Math.random() * cam.w, y: cam.y + 4, vx: 0, vy: 40 + Math.random() * 40, life: 1.2, size: 1.4, col: Z.dustCol || "#8a7a70", kind: "smoke" }); }
      if (s.state !== "run") return;
      if (Math.random() < dt * 8) FX.addShake(1);
      s.next -= dt;
      if (s.t < s.dur && s.next <= 0) {
        const P = Z.player, px = P.x + P.w / 2, aim = Z.R() < 0.38;
        s.next = tierN() === 0 ? 0.62 : 0.42;
        dropRock(aim ? px + (P.vx || 0) * 0.35 : px + (Z.R() - 0.5) * 260, { dmg: (Z.BAL.enemyDmg ? 10 * Z.BAL.enemyDmg(tierN()) : 10) * 0.9, warn: tierN() === 0 ? 1.15 : 0.95 });
      }
      if (s.t >= s.dur + 1.4) return "ok";
    },
    finish(s, ok) {
      if (!ok) return;
      const P = Z.player, f = P.face || 1;
      const [cx, cy] = chestNear(P.x + P.w / 2 + f * 60, P.y + P.h, { r: 110, min: 30 });
      FX.burst(cx, cy - 10, 20, { col: ["#7a6a5a", "#5a4a3a"], sp: 100, life: 0.7, size: 3, kind: "smoke" });
      Z.dropGold(cx, cy - 8, 40 * Z.BAL.goldMul(tierN()));
      evBanner(["Freigelegt", "Uncovered"], ["Der Einsturz hat eine Nische geöffnet.", "The cave-in opened a hidden niche."], [], { seal: "⚒", life: 3 });
    },
    leave() { ROCKS.length = 0; }
  };

  /* ---------- 6.9 Spiegelbild-Ezekiel ---------- */
  Z.ENEMIES.nmSpiegel = { n: ["Spiegelbild", "Reflection"], shape: "nm_spiegel", c: "#2a1020", t: "#c8304a", w: 12, h: 24, hp: 4.2, dmg: 1.1, spd: 125, ai: "duelist", sight: 420, gold: 0, heavy: true, poise: 0.35, kkDone: true, sigDone: true, immune: ["poison"],
    atks: [
      { k: "combo", n: 3, gap: 0.2, r: [0, 34], pre: 0.4, act: 0.08, post: 0.45, cd: 1.1, box: [0, -22, 30, 20], sfx: "slash", name: ["Darkin-Hiebe", "Darkin Cuts"] },
      { k: "lunge", r: [30, 120], pre: 0.48, act: 0.22, post: 0.5, cd: 2, lunge: 380, box: [0, -20, 26, 18], sfx: "stab", name: ["Glutstoß", "Ember Thrust"], w: 0.8 },
      { k: "teleport", behind: true, r: [40, 200], pre: 0.35, act: 0.05, post: 0.25, cd: 5, sfx: "roll", name: ["Schattenrolle", "Shadow Roll"], w: 0.5 },
      { k: "leap", r: [60, 170], pre: 0.55, act: 0.6, post: 0.55, cd: 4, jump: [280, -330], box: [-4, -22, 30, 22], landFire: true, glyph: "!!", sfx: "swingHeavy", name: ["Hornsturz", "Horn Dive"], w: 0.6 }
    ] };
  const MIRP2 = [{ k: "mark", hz: "column", n: 3, hw: 18, warn: 0.85, life: 0.7, r: [40, 220], pre: 0.6, act: 0.1, post: 0.5, cd: 4.5, col: "rgba(255,60,40,.85)", eff: { burn: 1 }, sfx: "fireBig", name: ["Darkin-Zorn", "Darkin Wrath"], w: 0.7 }];
  let mirC = null;
  Z.SHAPES.nm_spiegel = function () {}; /* gezeichnet wird in drawMirror (als dunkle Kopie von Ezekiel) */
  function drawMirror(c, e, t) {
    const P = Z.player; if (!P || e.dead && e.deadT > 0.5) return;
    let px = e.nmProxy;
    if (!px) { px = e.nmProxy = Object.assign({}, P); px.cape = null; px.capeA = null; px.act = null; px.grabbed = null; px.ledge = null; px.slots = Object.assign({}, P.slots); }
    Object.assign(px, { x: e.x + e.w / 2 - P.w / 2, y: e.y + e.h - P.h, face: e.face, vx: e.vx, vy: e.vy, onGround: e.onGround !== false, hp: P.hpMax, hpMax: P.hpMax, dead: false, iframe: 0, hurtT: e.flash > 0 ? 0.1 : 0, rollT: 0, invis: 0, wrath: e.nmWrath ? 1 : 0, act: null, ledge: null, grabbed: null, wallSlide: false });
    const Wc = 64, Hc = 52, S = Math.min(3, Z.gfx.scale || 2);
    if (!mirC || mirC.S !== S) { const cv = document.createElement("canvas"); cv.width = Wc * S; cv.height = Hc * S; mirC = { cv, g: cv.getContext("2d"), S }; }
    const g = mirC.g, cx = e.x + e.w / 2, fy = e.y + e.h;
    g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = "source-over"; g.globalAlpha = 1; g.clearRect(0, 0, mirC.cv.width, mirC.cv.height);
    g.setTransform(S, 0, 0, S, (-cx + Wc / 2) * S, (-fy + Hc - 6) * S);
    try { Z.drawPlayer(g, px, t); } catch (err) { if (!drawMirror.warned) { drawMirror.warned = 1; console.warn(err); } }
    /* Spiegelfarbe: Ezekiel in Tinte getaucht */
    g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = "source-atop"; g.globalAlpha = 0.78; g.fillStyle = "#1a0614"; g.fillRect(0, 0, mirC.cv.width, mirC.cv.height);
    g.globalAlpha = 1; g.globalCompositeOperation = "source-over";
    const al = e.spawnT > 0 ? 1 - e.spawnT / 0.4 : e.dead ? Math.max(0, 1 - e.deadT * 2) : 1;
    c.save(); c.globalAlpha = al * (e.hidden > 0 ? 0.2 : 1);
    if (!lowG()) glow(c, cx, e.y + e.h * 0.5, e.h * 0.9, e.nmWrath ? "rgba(255,40,30,.35)" : "rgba(200,40,80,.22)");
    c.drawImage(mirC.cv, cx - Wc / 2, fy - Hc + 6, Wc, Hc);
    if (e.flash > 0) { c.globalAlpha = 0.5; c.drawImage(mirC.cv, cx - Wc / 2, fy - Hc + 6, Wc, Hc); }
    const f = e.face || 1, ey = e.y + 7;
    c.globalCompositeOperation = "lighter"; c.globalAlpha = al; c.fillStyle = "#ff6a4a"; c.fillRect(cx + f * 3 - 0.6, ey, 1.4, 1); if (!lowG()) glow(c, cx + f * 3, ey, 5, "rgba(255,60,40,.6)");
    /* Vorwarnung der Spiegelangriffe: Klinge glimmt */
    if (e.act && e.act.phase === "pre") { const u = Math.min(1, e.act.t / (e.act.a.pre || 0.4)); glow(c, cx + f * 10, e.y + e.h * 0.45, 8 + 10 * u, "rgba(255,90,60," + (0.25 + 0.4 * u) + ")"); }
    c.restore();
  }
  EVD.spiegel = {
    n: ["Spiegelbild", "Reflection"], w: 0.8,
    setup(lv, R) {
      const c = pickCell(lv, R, 10); if (!c) return null;
      const sp = spotsIn(lv, c, 4), P = Z.player; if (!sp.length) return null;
      const q = EVFORCE ? sp.filter(s => Math.abs(sx(s) - (P.x + P.w / 2)) > 40 && Math.abs(sx(s) - (P.x + P.w / 2)) < 110)[0] || sp[0] : R.pick(sp);
      const st = { cell: c, x: sx(q), y: sy(q), used: false, e: null, crack: 0 };
      st.ia = { x: st.x, y: st.y, r: 22, h: 40, ok: () => !st.used, label: () => L(["In den Spiegel blicken", "Look into the mirror"]), use: () => { st.used = true; st.state = "warn"; st.t = 0; EVD.spiegel.warn(st); } };
      (Z.interacts = Z.interacts || []).push(st.ia);
      return st;
    },
    trig: () => false, /* nur, wenn Ezekiel hineinsieht */
    warn(s) { s.warnT = 1.3; A.play("glass", { x: s.x, vol: 0.5, rate: 0.7 }); overHead(L(["Das Spiegelbild … lächelt nicht zurück.", "The reflection… doesn't smile back."]), "#ffb0a0", 2.4); },
    start(s) {
      A.play("glass", { x: s.x, vol: 0.9 }); A.play("dark", { vol: 0.5 }); FX.addShake(3);
      FX.burst(s.x, s.y - 18, 30, { col: ["#f0e0e8", "#c8a0b0", "#ffffff"], sp: 150, life: 0.7, size: 2, kind: "shard", g: 500 });
      const P = Z.player, dir = U.sign(P.x + P.w / 2 - s.x) || 1;
      const e = Z.spawnEnemy("nmSpiegel", s.x + dir * 4, s.y, { tier: tierN() }); if (!e) return "fail";
      e.nmEvent = true; e.nmMirror = true; e.aware = true; e.cd = 1.1; e.face = dir; e.spawnT = 0.4;
      e.hp = e.hpMax = Math.round(e.hpMax * (tierN() === 0 ? 0.8 : 1));
      e.def = Object.assign({}, e.def); e.nmPlateTxt = [["Ezekiel?", "Ezekiel?"], ["dein Spiegelbild", "your reflection"]]; e.nmPlateCol = "#ff8a7a";
      s.e = e;
      later(() => { if (!e.dead) say(e, L(Z.R.pick([["Ich kenne jeden deiner Schritte. Ich BIN jeder deiner Schritte.", "I know every step you take. I AM every step you take."], ["Ohne Waffe hergekommen? Wie immer.", "Came without a weapon? As always."], ["Einer von uns bleibt im Spiegel.", "One of us stays in the mirror."]])), { who: "Ezekiel?", life: 3.2 }); }, 500);
      showUp(e, L(["Spiegelbild", "Reflection"]), "Ezekiel?", L(["Es kennt jeden deiner Schritte", "It knows every step you take"]), [[L(["Ab halber Kraft: Darkin-Zorn.", "Below half: Darkin wrath."]), "#8a1414"]], 666, { kind: "event", seal: "◐", pan: 1.1, sfx: "dark" });
    },
    tick(s) {
      if (s.state !== "run") return;
      const e = s.e; if (!e) return "fail";
      if (e.dead) return "ok";
      if (!e.nmWrath && e.hp < e.hpMax * 0.5) {
        e.nmWrath = true; e.dmgMul *= 1.2; e.def = Object.assign({}, e.def, { spd: e.def.spd * 1.15, atks: e.def.atks.map(a => Object.assign({}, a, { cd: (a.cd || 1) * 0.8 })).concat(MIRP2) });
        say(e, L(["Spürst du es? Der Zorn gehört auch mir.", "Feel that? The wrath is mine too."]), { who: "Ezekiel?", life: 2.6 });
        FX.ring(e.x + e.w / 2, e.y + e.h / 2, 34, "#ff3a2a", 0.45, 3); A.play("roar", { x: e.x, vol: 0.6 }); e.act = null; e.cd = 0.7;
        if (Z.music && Z.music.stinger) Z.music.stinger("phase");
      }
      if (s.t > 180) return "fail";
    },
    draw(s, c, t) {
      if (s.state === "done" && s.e) return;
      const x = s.x, y = s.y, cr = s.state === "warn" ? Math.min(1, s.t / 1.2) : s.state === "run" ? 1 : 0;
      if (s.state === "run" && s.t > 1.5) return;
      /* hoher Standspiegel mit Goldrahmen */
      c.save(); if (s.state === "run") c.globalAlpha = Math.max(0, 1 - s.t / 1.5);
      poly(c, [x - 9, y, x - 6, y - 4, x + 6, y - 4, x + 9, y], "#4a3020");
      ell(c, x, y - 20, 9, 16, "#8a6a2a"); ell(c, x, y - 20, 7.6, 14.6, "#c8a050"); ell(c, x, y - 20, 6.4, 13.2, cr >= 1 ? "#1a0a10" : "#3a2a38");
      if (cr < 1 && !lowG()) { c.globalAlpha *= 0.4; ell(c, x - 2, y - 24, 2, 7, "#e8d8e0"); c.globalAlpha /= 0.4; }
      /* das Spiegelbild darin: dunkle Gestalt mit glimmenden Augen, die Ezekiel ansieht */
      const P = Z.player, look = P ? U.sign(P.x + P.w / 2 - x) : 1;
      c.save(); c.beginPath(); c.ellipse(x, y - 20, 6.4, 13.2, 0, 0, TAU); c.clip();
      poly(c, [x - 3, y - 8, x + 3, y - 8, x + 2.4, y - 22, x - 2.4, y - 22], "#2a1020"); circ(c, x, y - 24.5, 2.6, "#2a1020");
      poly(c, [x - 2, y - 26, x - 3.4, y - 30.5, x - 0.8, y - 26.4], "#3a1a24"); poly(c, [x + 2, y - 26, x + 3.4, y - 30.5, x + 0.8, y - 26.4], "#3a1a24");
      c.fillStyle = "#ff5a3a"; c.fillRect(x + look * 0.8 - 0.5, y - 25, 1.1, 0.8);
      c.restore();
      if (cr > 0) { c.strokeStyle = "#f0e0e8"; c.lineWidth = 0.5; c.beginPath(); c.moveTo(x - 1, y - 30); c.lineTo(x + 1.6 * cr, y - 24); c.lineTo(x - 2 * cr, y - 16); c.lineTo(x + 2.5 * cr, y - 10); c.moveTo(x + 1.6 * cr, y - 24); c.lineTo(x + 4.6 * cr, y - 21); c.stroke(); }
      c.restore();
      if (s.state === "wait" && P && Math.abs(P.x - x) < 120 && !lowG()) glow(c, x, y - 20, 16 + Math.sin(t * 3) * 2, "rgba(200,60,100,.18)");
    },
    finish(s, ok) {
      if (!ok || !s.e) return;
      const e = s.e, x = e.x + e.w / 2, y = e.y + e.h, P = Z.player;
      say({ x: e.x, y: e.y, w: e.w, h: e.h, gone: true }, L(["Dann … bleibe ich … in dir.", "Then … I stay … inside you."]), { x, y: e.y, who: "Ezekiel?", life: 2.8 });
      FX.burst(x, y - 12, 34, { col: ["#f0e0e8", "#c8a0b0", "#2a1020"], sp: 150, life: 0.8, size: 2, kind: "shard", g: 400 }); A.play("glass", { x, vol: 0.9 });
      later(() => {
        const src = P && P.slots && (P.slots.a1 || P.slots.a2);
        const it = src && Z.WEAPONS[src.id] && Z.makeItem ? Z.makeItem(src.id, tierN(), Math.min(3, (src.rar | 0) + 1)) : null;
        if (it) Z.spawnPickup("item", x, y - 4, { it, drop: true, vy: -240, vx: 30 }); else Z.spawnReward("waffe", x, y, { drop: true, rar: [0, 20, 50, 30] });
        Z.spawnReward("glut", x, y, { n: 2 }); Z.spawnReward("segen", x - (P.face || 1) * 28, y);
      }, 500);
      evBanner(["Spiegel zerbrochen", "Mirror shattered"], ["Was bleibt, ist eine Scherbe von dir.", "What remains is a shard of you."], [], { seal: "◐", life: 3.2 });
    }
  };

  /* ---------- Ereignis-Steuerung ---------- */
  const EVLIST = Object.keys(EVD);
  function evLoad(lv) {
    EVS = null; MARKS.length = 0; ROCKS.length = 0; GH.length = 0;
    const run = Z.run; if (!run || !normalLevel(lv)) return;
    run.evSince = run.evSince == null ? 1 : run.evSince + 1; run.evSeen = run.evSeen || [];
    let id = EV.forceNext || null; EV.forceNext = null;
    if (!id) {
      const first = routeN() <= 1;
      /* W6-Balancing: gemessen ~1 Ereignis je 5 Gebiete (Ziel 1 je 2–3) – vorher 0,16 / 0,85 / 0,5 / 0,12, Mini-Boss-Abschlag ×0,7 */
      let p = first ? 0.2 : run.evSince >= 3 ? 0.95 : run.evSince >= 2 ? 0.75 : 0.4;
      if (live.length) p *= 0.6; if (KGS) p *= 0.5; if (MBS) p *= 0.8;
      if (Z.R() > p) return;
      const pool = EVLIST.filter(k => !run.evSeen.includes(k) && (!first || EVD[k].gentle) && (!EVD[k].ok || EVD[k].ok(lv)));
      if (!pool.length) return;
      let sum = 0; for (const k of pool) sum += EVD[k].w || 1; let r = Z.R() * sum; id = pool[0];
      for (const k of pool) { r -= EVD[k].w || 1; if (r <= 0) { id = k; break; } }
    }
    const R = Z.Rng((((lv.seed || 5) * 7919) ^ (id.length * 104729) ^ ((Math.random() * 1e6) | 0)) >>> 0);
    let st = null; try { st = EVD[id].setup(lv, R); } catch (err) { console.error(err); }
    if (!st) return;
    EVS = Object.assign(st, { id, lv, state: "wait", t: 0 });
    run.evSince = 0; run.evSeen.push(id); evMeta(id, "seen");
  }
  function evFinish(ok) {
    const s = EVS; if (!s || s.state === "done") return;
    s.state = "done"; s.ok = ok;
    try { EVD[s.id].finish && EVD[s.id].finish(s, ok); } catch (err) { console.error(err); }
    if (ok) evMeta(s.id, "won");
  }
  function evTick(dt) {
    marksTick(dt); rocksTick(dt);
    const s = EVS; if (!s || Z.level !== s.lv) return;
    const D = EVD[s.id], P = Z.player; if (!P) return;
    s.t += dt;
    if (s.state === "wait" && !P.dead) { let go = false; try { go = D.trig(s); } catch (_) {} if (go) { s.state = "warn"; s.t = 0; s.warnT = 1.4; try { D.warn && D.warn(s); } catch (err) { console.error(err); } } }
    else if (s.state === "warn" && s.t >= (s.warnT || 1.4)) { s.state = "run"; s.t = 0; let r = null; try { r = D.start(s); } catch (err) { console.error(err); r = "fail"; } if (r === "fail") { evFinish(false); return; } }
    let r = null; try { r = D.tick && D.tick(s, dt); } catch (err) { console.error(err); }
    if (s.state === "run" && (r === "ok" || r === "fail")) evFinish(r === "ok");
  }
  MODS.push({
    load: evLoad,
    leave: () => { if (EVS) { try { EVD[EVS.id].leave && EVD[EVS.id].leave(EVS); } catch (err) { console.error(err); } } EVS = null; MARKS.length = 0; ROCKS.length = 0; GH.length = 0; },
    tick: evTick,
    draw: (c, t) => { drawMarks(c, t); drawRocks(c, t); if (EVS && EVD[EVS.id].draw) EVD[EVS.id].draw(EVS, c, t); },
    after: (c, cam, t) => { if (EVS && EVD[EVS.id].after) EVD[EVS.id].after(EVS, c, cam, t); },
    screen: (c, Wd, Hd, t) => { if (EVS && EVD[EVS.id].screen) EVD[EVS.id].screen(EVS, c, Wd, Hd, t); },
    hitAfter: (e, res, o) => { if (EVS && EVD[EVS.id].hit) EVD[EVS.id].hit(EVS, e, res, o); },
    kill: (e, o) => { if (EVS && EVD[EVS.id].kill) EVD[EVS.id].kill(EVS, e, o); },
    deco: (c, e, t) => {
      if (e.nmMirror) drawMirror(c, e, t);
      if (e.nmSack && !e.dead) { const f = e.face || 1, x = e.x + e.w / 2 - f * 5, y = e.y + e.h * 0.45; ell(c, x, y, 5, 5.4, "#8a6a3a"); ell(c, x - f * 1, y - 1, 3, 3, "#a8844a"); limb(c, x - 1, y - 5, x + 2, y - 7, 1, "#5a3a1a"); c.fillStyle = "#ffd27a"; c.fillRect(x - 1.4, y - 6.6, 2.4, 1.4); }
    }
  });
  EV.current = () => (EVS && (EVS.state === "warn" || EVS.state === "run") ? EVS.id : null);
  EV.state = () => (EVS ? { id: EVS.id, state: EVS.state, t: +EVS.t.toFixed(1), cell: EVS.cell && [EVS.cell.x, EVS.cell.y] } : null);
  EV.list = () => EVLIST.slice();
  EV.dropRock = dropRock;
  /* Z.ereignis.force(id) – Ereignis sofort hier (im Raum des Spielers) aufbauen und auslösen */
  EV.force = function (id, o) {
    o = o || {}; const lv = Z.level; if (!normalLevel(lv) || !EVD[id]) return null;
    if (EVS) { try { EVD[EVS.id].leave && EVD[EVS.id].leave(EVS); } catch (_) {} }
    EVFORCE = true; let st = null;
    try { st = EVD[id].setup(lv, Z.R); } catch (err) { console.error(err); } finally { EVFORCE = false; }
    if (!st) return null;
    EVS = Object.assign(st, { id, lv, state: "wait", t: 0 });
    if (o.wait !== true && id !== "spiegel" && id !== "gefangene") { EVS.state = "warn"; EVS.t = 0; EVS.warnT = 1.4; try { EVD[id].warn && EVD[id].warn(EVS); } catch (err) { console.error(err); } }
    return EV.state();
  };
  EV.finish = ok => evFinish(ok !== false);
  /* ======================= 7. MINI-BOSSE ======================= */
  /* Neun handgemachte Wächter, je ein bis zwei Gebietsfamilien. Jeder hat eine eigene Gestalt, 3–4 lesbare Angriffe
     (Ausholen mit Glühen, Name über dem Kopf, „!!“ bei schweren Schlägen) und ab halber Kraft eine zweite Phase.
     Sie warten in Nebenzweigen oder Schatzkammern, tauchen bei vollendeten Ritualen auf oder per Z.miniboss.force(id). */
  const MBD = {};
  let MBS = null;
  const mbLive = [];
  function mbDef(id, o) {
    o.id = id;
    const d = Object.assign({ kkDone: true, sigDone: true, heavy: true, poise: 0.5, gold: 0, sight: 250 }, o.def);
    d.n = o.n; d.title = o.title; d.atks = d.atks.map(a => Object.assign({ w: 1 }, a));
    /* Wächter sind größer als ihr Gefolge: Zeichnung und Trefferflächen wachsen mit */
    if (o.size) { d.size = o.size; d.w = Math.round(d.w * o.size); d.h = Math.round(d.h * o.size); }
    Z.ENEMIES["mb_" + id] = d; MBD[id] = o;
  }
  const P2 = (e, f) => (e.nmP === 2 ? f : 1);
  /* ---------- eigene Angriffe ---------- */
  NMACT.wuehlen = {
    start(e, ac) { const P = Z.player; e.hidden = 2; e.invuln = 2; ac.mk = { x: P.x + P.w / 2, y: P.y + P.h, lock: false }; A.play("rock", { x: e.x, vol: 0.6 }); FX.burst(e.x + e.w / 2, e.y + e.h, 18, { col: [Z.dustCol || "#8a7a70", "#5a4a3a"], sp: 100, ang: -PI / 2, spread: 2, life: 0.6, size: 3, kind: "smoke" }); },
    tick(e, ac, dt) {
      const P = Z.player, mk = ac.mk; if (!mk) return;
      if (ac.t < 0.95) { mk.x = U.lerp(mk.x, P.x + P.w / 2, Math.min(1, dt * 5)); const gy = W.groundBelow(mk.x, P.y - 20, 160); if (gy != null) mk.y = gy; }
      else if (!mk.lock) { mk.lock = true; A.play("quake", { x: mk.x, vol: 0.4 }); }
      e.vx = 0; e.vy = 0;
      if (!ac.up) { e.hidden = Math.max(e.hidden, 0.3); e.x = mk.x - e.w / 2; e.y = mk.y - e.h; if (Math.random() < dt * 14) FX.p({ x: mk.x + (Math.random() - 0.5) * 18, y: mk.y - 1, vx: (Math.random() - 0.5) * 40, vy: -40 - Math.random() * 40, life: 0.5, size: 2, col: Z.dustCol || "#8a7a70", kind: "smoke" }); }
      if (ac.t >= 1.38 && !ac.up) {
        ac.up = true; e.hidden = 0; e.invuln = 0; e.vy = -280; e.onGround = false; Z.unstick && Z.unstick(e);
        FX.addShake(5); A.play("roar", { x: mk.x, vol: 0.6 }); FX.burst(mk.x, mk.y - 2, 26, { col: ["#7a6a5a", "#5a4a3a", Z.dustCol || "#8a7a70"], sp: 160, ang: -PI / 2, spread: 1.6, life: 0.7, size: 3, kind: "shard", g: 600 });
        if (!P.dead && Math.abs(P.x + P.w / 2 - mk.x) < 24 && P.y + P.h > mk.y - 40 && P.y < mk.y + 4) Z.hurtPlayer(e.dmgMul * 1.3, { attacker: e, x: mk.x, kb: 240, melee: true, parryable: false });
      }
    },
    end(e) { e.hidden = 0; e.invuln = 0; }
  };
  NMACT.kaefig = {
    start(e, ac) {
      const P = Z.player, x = ac.nmAim ? ac.nmAim.x : P.x + P.w / 2;
      dropRock(x, { kind: "cage", dmg: e.dmgMul * 0.9, warn: 0.8, owner: e, y0: P.y });
      if (e.nmP === 2) dropRock(x + (P.vx > 20 ? 50 : P.vx < -20 ? -50 : (Z.R() < 0.5 ? -46 : 46)), { kind: "cage", dmg: e.dmgMul * 0.9, warn: 1.05, owner: e, y0: P.y });
      A.play("chain", { x: e.x, vol: 0.7 });
    }
  };
  NMACT.faden = {
    start(e, ac) { const P = Z.player; e.hidden = 3; e.invuln = 3; ac.mk = { x: P.x + P.w / 2, y: P.y + P.h, lock: false }; ac.top = e.y; A.play("web", { x: e.x, vol: 0.7 }); FX.burst(e.x + e.w / 2, e.y + e.h / 2, 14, { col: ["#e8e0e8", "#8a7a8a"], sp: 80, ang: -PI / 2, spread: 1, life: 0.5, size: 2, kind: "spark" }); },
    tick(e, ac, dt) {
      const P = Z.player, mk = ac.mk; if (!mk) return;
      if (ac.t < 1.0) { mk.x = U.lerp(mk.x, P.x + P.w / 2, Math.min(1, dt * 4.5)); const gy = W.groundBelow(mk.x, P.y - 20, 160); if (gy != null) mk.y = gy; }
      else if (!mk.lock) { mk.lock = true; A.play("insect", { x: mk.x, vol: 0.5 }); }
      e.vx = 0; e.vy = 0;
      if (!ac.down) { e.hidden = Math.max(e.hidden, 0.3); e.x = mk.x - e.w / 2; e.y = mk.y - e.h; }
      if (ac.t >= 1.4 && !ac.down) {
        ac.down = true; e.hidden = 0; e.invuln = 0; FX.addShake(6); A.play("hitHeavy", { x: mk.x, vol: 0.7 });
        FX.burst(mk.x, mk.y - 2, 22, { col: ["#5a4a3a", "#9ad04a"], sp: 140, ang: -PI / 2, spread: 2.4, life: 0.6, size: 3, kind: "smoke" });
        Z.spawnHazard({ kind: "poisonpool", x: mk.x, y: mk.y, w: 46, life: 3.5, dmg: e.dmgMul * 0.12, owner: "e", eff: { poison: 1 } });
        if (!P.dead && Math.abs(P.x + P.w / 2 - mk.x) < 26 && P.y + P.h > mk.y - 40 && P.y < mk.y + 4) Z.hurtPlayer(e.dmgMul * 1.35, { attacker: e, x: mk.x, kb: 240, melee: true, parryable: false, eff: { poison: 1 } });
      }
    },
    end(e) { e.hidden = 0; e.invuln = 0; }
  };
  NMACT.anker = {
    start(e, ac) { const f = e.face || 1; ac.anc = { x: e.x + e.w / 2 + f * 8, y: e.y + e.h * 0.5, vx: f * 380, out: true, hitO: false, hitB: false, d: 0 }; A.play("chain", { x: e.x, vol: 0.8 }); },
    tick(e, ac, dt) {
      const a = ac.anc, P = Z.player; if (!a) return;
      const hx = e.x + e.w / 2, hy = e.y + e.h * 0.5;
      if (a.out) { a.x += a.vx * dt; a.d += Math.abs(a.vx) * dt; if (a.d > 175 || W.solidAt(a.x + Math.sign(a.vx) * 4, a.y)) { a.out = false; if (W.solidAt(a.x + Math.sign(a.vx) * 4, a.y)) { FX.burst(a.x, a.y, 8, { col: ["#ffe0a0", "#8a8a90"], sp: 90, life: 0.3, size: 1.6, kind: "spark", add: true }); A.play("hitMetal", { x: a.x, vol: 0.5 }); } } }
      else { const dx = hx - a.x; a.x += Math.sign(dx) * Math.min(Math.abs(dx), 420 * dt); a.y = U.lerp(a.y, hy, Math.min(1, dt * 8)); if (Math.abs(dx) < 10) { ac.anc = null; ac.t = Math.max(ac.t, ac.a.act); return; } }
      ac.t = Math.min(ac.t, ac.a.act - 0.02);
      const key = a.out ? "hitO" : "hitB";
      if (!a[key] && P && !P.dead && Math.abs(P.x + P.w / 2 - a.x) < 11 && Math.abs(P.y + P.h / 2 - a.y) < 15) { a[key] = true; Z.hurtPlayer(e.dmgMul * 1.05, { attacker: e, x: a.x, kb: a.out ? 200 : -160, melee: true, parryable: true }); }
    }
  };
  NMACT.glocke = {
    start(e) {
      const cx = e.x + e.w / 2, gy = W.groundBelow(cx, e.y + e.h, 300);
      A.play("bell", { x: cx, vol: 0.9 }); A.play("gong", { x: cx, vol: 0.5 }); FX.addShake(3);
      FX.ring(cx, e.y + e.h * 0.6, 44, "#ffd27a", 0.5, 3);
      if (gy != null) { for (const s of [-1, 1]) { const p = Z.spawnProj("e_welle", cx + s * 12, gy - 6, s, { dmg: e.dmgMul * 0.9 }); if (p) p.nmSrc = e; } FX.ring(cx, gy - 2, 30, "#ffe0a0", 0.4, 2); }
    }
  };

  /* ---------- Gestalten ---------- */
  Z.SHAPES.nm_ratten = function (c, e, d, k, t, mv, ph) {
    const p = phs(e), rear = p.k === "summon" && p.ph ? (p.ph === "pre" ? eo(p.u) : p.ph === "act" ? 1 : 1 - p.u) : 0;
    const dig = p.nm === "wuehlen" && p.ph === "pre" ? eo(p.u) : 0, bite = p.k === "hit" || p.k === "leap" ? (p.ph === "act" ? 1 : p.ph === "pre" ? -0.4 * p.u : 0) : 0;
    const bob = mv ? Math.abs(Math.sin(ph)) * 1.4 : Math.sin(t * 3) * 0.4;
    c.save(); c.strokeStyle = k("#b88a7a"); c.lineWidth = 1.8; c.lineCap = "round"; c.beginPath(); c.moveTo(-12, -6 - bob); c.quadraticCurveTo(-22, -3 + Math.sin(t * 4) * 2, -29, -9 + Math.sin(t * 3) * 3); c.stroke(); c.restore();
    for (const [lx, side] of [[-8, 0], [-4, 1], [7, 0], [10, 1]]) { const a = mv ? Math.sin(ph + side * PI + lx) * 2.4 : 0; limb(c, lx, -6 - bob, lx + a, -0.5, 2.2, k(side ? shade(d.c, 0.75) : d.c)); limb(c, lx + a, -0.6, lx + a + 1.6, -0.4, 1.2, k("#c89a8a")); }
    c.save(); c.translate(0, -8 - bob); c.rotate(-rear * 0.55 + dig * 0.3);
    ell(c, -2, -1, 14, 8.6, k(d.c)); ell(c, -1, 2.6, 10, 4, k(shade(d.c, 1.25)));
    for (let i = 0; i < 7; i++) { const x = -13 + i * 3.6; poly(c, [x, -6 + Math.abs(i - 3) * 0.6, x + 1.6, -11 + Math.abs(i - 3) * 0.7 + Math.sin(t * 5 + i) * 0.5, x + 3, -6 + Math.abs(i - 3) * 0.6], k(shade(d.c, 0.7))); }
    c.save(); c.translate(11, -1); c.rotate(bite * 0.25);
    ell(c, 0, 0, 6.4, 5, k(d.c)); poly(c, [3, -3, 10.5, 0, 3, 3.4], k(d.c)); circ(c, 10.6, 0, 1.3, k("#d87a7a"));
    c.fillStyle = k("#f0e0a0"); c.fillRect(8, 1.8, 1.2, 2.8 + bite); c.fillRect(9.3, 1.8, 1.2, 2.6 + bite);
    ell(c, -1.6, -4.4, 2.2, 3, k("#c89a8a")); ell(c, -1.6, -4.2, 1.2, 2, k("#e8b8b0"));
    circ(c, 3.4, -1.4, 1.2, k("#ff3a2a")); if (!lowG() && !(e.flash > 0)) glow(c, 3.4, -1.4, 4, "rgba(255,40,20,.5)");
    /* Krone aus Knochen und einem Kronkorken-Ring */
    for (let i = 0; i < 4; i++) poly(c, [-3 + i * 2, -4.4, -2.4 + i * 2, -8.6 - (i % 2) * 1.6, -1.6 + i * 2, -4.4], k(i % 2 ? "#e8e0c8" : "#c8a050"));
    c.restore(); c.restore();
  };
  Z.SHAPES.nm_keiler = function (c, e, d, k, t, mv, ph) {
    const p = phs(e), chg = p.k === "charge" && p.ph ? (p.ph === "pre" ? eo(p.u) : p.ph === "act" ? 1 : 1 - p.u) : 0;
    const horn = p.k === "summon" && p.ph && p.ph !== "post", throwA = p.k === "volley" ? swingV(p, 0.6, -2.6, 0.4) : 0.6;
    const gal = mv || chg > 0.5, bob = gal ? Math.abs(Math.sin(ph * 1.3)) * 2 : Math.sin(t * 2.5) * 0.5;
    /* Keiler */
    for (const [lx, side] of [[-8, 0], [-5, 1], [6, 0], [9, 1]]) { const a = gal ? Math.sin(ph * 1.3 + side * PI + lx) * 3.4 : 0; limb(c, lx, -8 - bob, lx + a, -0.6, 2.6, k(side ? shade(d.c, 0.7) : d.c)); poly(c, [lx + a - 1.2, -1.4, lx + a + 1.4, -1.4, lx + a + 1, 0.2, lx + a - 1, 0.2], k("#2a2020")); }
    c.save(); c.translate(0, -11 - bob); c.rotate(chg * 0.18);
    ell(c, -1, 0, 13, 7.4, k(d.c)); ell(c, 0, 2.4, 10, 3.6, k(shade(d.c, 1.2)));
    for (let i = 0; i < 9; i++) limb(c, -10 + i * 2.4, -5.6 + Math.abs(i - 4) * 0.3, -11 + i * 2.4, -9.4 + Math.abs(i - 4) * 0.4 + Math.sin(t * 7 + i) * 0.4, 1, k(shade(d.c, 0.6)));
    ell(c, 11, 1.4, 5.6, 4.6, k(d.c)); poly(c, [14, -0.6, 19, 1.4, 18.6, 4.6, 14, 4.4], k(shade(d.c, 1.1))); ell(c, 19, 3, 1.2, 1.8, k("#3a2a2a"));
    poly(c, [16, 4, 15, 0.4, 20.5, -2.6], k("#f0e8d0")); poly(c, [14, 4.4, 13.2, 1.2, 17, -1], k("#d8d0b8"));
    circ(c, 13.6, -0.4, 1, k("#ff4a2a")); ell(c, 9, -3.4, 1.6, 2.6, k(shade(d.c, 0.8)));
    c.fillStyle = k("#8a1414"); c.fillRect(-6, -7.4, 10, 3); c.fillStyle = k("#c8a050"); c.fillRect(-6, -5, 10, 0.8);
    c.restore();
    /* Goblin-Häuptling */
    c.save(); c.translate(-1, -18 - bob); c.rotate(-chg * 0.25);
    limb(c, -1, 0, -4, 5, 2, k(d.t)); limb(c, 1, 0, 4, 5, 2, k(shade(d.t, 0.8)));
    ell(c, 0, -5, 3.8, 5, k("#5a3a22")); limb(c, -3, -7, 3.4, -2, 1.2, k("#c8a050"));
    /* Fahnenstange auf dem Rücken */
    limb(c, -3, -4, -6, -22, 0.9, k("#4a3020")); const fw = Math.sin(t * 5) * 1.4 - (gal ? 2 : 0);
    poly(c, [-6, -22, -14 + fw, -21, -12 + fw, -18, -14 + fw, -15, -5.4, -16], k("#8a1414")); c.fillStyle = k("#e8e0c8"); c.fillRect(-10.6 + fw * 0.6, -20, 2, 2.4);
    ell(c, 1, -12.4, 4, 3.6, k(d.t)); poly(c, [3.6, -13, 8, -12, 4, -10.6], k(d.t)); poly(c, [-2, -14, -7, -17, -3, -11.6], k(d.t));
    c.fillStyle = k("#ffd27a"); c.fillRect(2.6, -13.4, 1.1, 1);
    /* Helm mit Hörnern */
    poly(c, [-3, -14, -2.4, -17.4, 3.2, -17.6, 4.6, -14], k("#5a5a60")); poly(c, [-2.6, -16.6, -6, -21, -1.4, -17.6], k("#e8e0c8")); poly(c, [3.6, -16.6, 7, -21, 2.4, -17.6], k("#e8e0c8"));
    if (horn) { limb(c, 2, -8, 6, -12, 1.4, k(d.t)); poly(c, [5, -13, 11, -15, 11.6, -11, 6, -11], k("#d8c8a0")); }
    else { const hx = 2 + Math.cos(throwA) * 6, hy = -8 + Math.sin(throwA) * 6; limb(c, 2, -8, hx, hy, 1.4, k(d.t)); if (p.k === "volley" && p.ph === "pre") { circ(c, hx, hy - 1, 2.2, k("#2a2a2a")); if (Math.sin(t * 30) > 0) circ(c, hx + 1, hy - 3.6, 0.8, k("#ffd27a")); } else { limb(c, hx, hy, hx + 5, hy - 6, 1, k("#6a4a2a")); poly(c, [hx + 4, hy - 7, hx + 8, hy - 9, hx + 6, hy - 4], k("#a8a8b0")); } }
    c.restore();
  };
  Z.SHAPES.nm_kerker = function (c, e, d, k, t, mv, ph) {
    const p = phs(e), bob = mv ? Math.abs(Math.sin(ph)) * 1 : Math.sin(t * 1.8) * 0.4;
    legs2(c, k, -12, mv, ph, { w: 3.4, colB: "#2a2020", colF: "#3a2a24", boot: "#1a1210", stride: 3, spread: 3 });
    const top = -30 - bob;
    /* Käfiglaterne auf dem Rücken */
    c.fillStyle = k("#3a3a40"); c.fillRect(-11, top + 2, 6, 10); for (let i = 0; i < 3; i++) limb(c, -10.4 + i * 2.4, top + 2, -10.4 + i * 2.4, top + 12, 0.5, k("#6a6a70"));
    if (!(e.flash > 0)) { circ(c, -8, top + 7, 1.6, "#ffb040"); if (!lowG()) glow(c, -8, top + 7, 6, "rgba(255,170,60,.45)"); }
    /* massiger Rumpf, Lederschürze */
    poly(c, [-7, top + 1, 7, top + 1, 8.6, -12, -8.6, -12], k(d.c)); poly(c, [-5, top + 7, 5, top + 7, 6.6, -6, -6.6, -6], k("#5a3a22"));
    for (let i = 0; i < 3; i++) limb(c, -5 + i * 2.6, top + 9, -5.4 + i * 2.6, -7, 0.4, k("#4a2e1a"));
    /* Schlüsselbund am Gürtel */
    limb(c, -8.6, -12.6, 8.6, -12.6, 1.6, k("#1a1210"));
    const kb = p.k === "combo" ? swingV(p, 0, -1.6, 1.6) : Math.sin(t * 3) * 0.2;
    c.save(); c.translate(5, -12); c.rotate(kb); circ(c, 0, 2.6, 2.4, "transparent"); c.strokeStyle = k("#a8a090"); c.lineWidth = 0.8; c.beginPath(); c.arc(0, 2.6, 2.4, 0, TAU); c.stroke();
    for (let i = 0; i < 4; i++) { c.save(); c.translate(0, 2.6); c.rotate(-0.6 + i * 0.4); limb(c, 0, 2.2, 0, 7, 0.8, k("#c8a050")); c.fillStyle = k("#c8a050"); c.fillRect(-1, 6, 2, 1.2); c.restore(); }
    c.restore();
    /* Kopf: Kapuze mit Eisenmaske */
    const hY = top - 3.4;
    ell(c, 0.6, hY, 5, 5.6, k("#2a1a14")); poly(c, [-1, hY - 3, 5.4, hY - 2.4, 5.4, hY + 3.4, -0.4, hY + 3.6], k("#6a6a70"));
    c.fillStyle = k("#1a1010"); c.fillRect(1.4, hY - 1, 3.4, 0.8); for (let i = 0; i < 3; i++) c.fillRect(1.4 + i * 1.3, hY + 1.2, 0.5, 1.6);
    if (!(e.flash > 0)) { c.fillStyle = "#ff8a3a"; c.fillRect(3.4, hY - 1, 1, 0.8); }
    /* Arme: Kette um den Unterarm */
    const pullA = p.k === "pull" ? (p.ph === "pre" ? -2.3 : p.ph === "act" ? -0.1 : 0.6) : p.nm === "kaefig" ? (p.ph === "pre" ? -2.6 : -1.6) : p.k === "summon" ? -2.4 : p.k === "hit" ? swingV(p, 0.8, -2, 0.6) : 0.9;
    limb(c, -6, top + 3, -8, top + 12, 3, k(shade(d.c)));
    const ax = 5 + Math.cos(pullA) * 9, ay = top + 3 + Math.sin(pullA) * 9;
    limb(c, 5, top + 3, ax, ay, 3.4, k(d.skin || "#b07a5a"));
    for (let i = 0; i < 4; i++) { const u = 0.3 + i * 0.16; circ(c, U.lerp(5, ax, u), U.lerp(top + 3, ay, u), 1.2, k("#6a6a70")); }
    circ(c, ax, ay, 1.8, k(d.skin || "#b07a5a"));
    if (p.k === "pull" && p.ph === "pre") { const sp = t * 14; for (let i = 0; i < 5; i++) circ(c, ax + Math.cos(sp + i * 0.4) * (3 + i * 1.6), ay + Math.sin(sp + i * 0.4) * (2 + i), 1, k("#8a8a90")); }
    if (p.nm === "kaefig" && p.ph === "pre") { c.strokeStyle = k("#ffd27a"); c.lineWidth = 0.6; c.beginPath(); c.arc(ax, ay - 3, 3 + p.u * 2, 0, TAU); c.stroke(); }
  };
  Z.SHAPES.nm_weberin = function (c, e, d, k, t, mv, ph) {
    const p = phs(e), rear = (p.k === "summon" || p.nm === "faden") && p.ph === "pre" ? eo(p.u) : p.k === "volley" && p.ph === "pre" ? eo(p.u) * 0.6 : 0;
    const bob = mv ? Math.abs(Math.sin(ph * 1.5)) * 0.8 : Math.sin(t * 2.2) * 0.4;
    /* acht Beine */
    for (let i = 0; i < 4; i++) for (const s of [-1, 1]) {
      const bx = 2 + i * 2.2 * s * 0 + (s > 0 ? 3 : -1), a0 = mv ? Math.sin(ph * 1.5 + i * 1.3 + (s > 0 ? PI : 0)) * 2.4 : Math.sin(t * 2 + i) * 0.4;
      const kx = bx + s * (6 + i * 2.6), ky = -16 - bob - (i === 0 && s > 0 ? rear * 8 : 0), fx = bx + s * (9 + i * 3.6) + a0, fy = i === 0 && s > 0 ? -2 - rear * 10 : 0;
      limb(c, bx, -9 - bob, kx, ky, 1.6, k(s > 0 ? shade(d.c, 1.15) : shade(d.c, 0.7))); limb(c, kx, ky, fx, fy, 1.2, k(s > 0 ? d.c : shade(d.c, 0.7)));
    }
    c.save(); c.translate(0, -9 - bob); c.rotate(-rear * 0.35);
    /* Hinterleib mit Totenkopfzeichnung, Spinndrüsen */
    ell(c, -10, -2, 11, 8.6, k(d.c)); ell(c, -10, -4, 8, 5, k(shade(d.c, 1.15)));
    poly(c, [-13, -6, -7, -6, -6.4, -1.6, -8, 0.4, -12, 0.4, -13.6, -1.6], k(d.t)); c.fillStyle = k("#1a0a0a"); c.fillRect(-12, -4.4, 1.8, 1.6); c.fillRect(-9, -4.4, 1.8, 1.6); c.fillRect(-10.6, -1.4, 1.6, 0.8);
    poly(c, [-20, 0, -22.6, 2, -19.6, 2.4], k("#e8e0e8"));
    /* Kopfbruststück, Augenhaufen, Kieferklauen */
    ell(c, 4, -1, 6, 5, k(shade(d.c, 0.9)));
    for (const [ex, ey, r] of [[7, -3, 1.2], [8.6, -1.6, 0.9], [5.6, -4.2, 0.8], [8.6, -4, 0.7], [6, -1.4, 0.6]]) circ(c, ex, ey, r, k("#ff3a2a"));
    if (!lowG() && !(e.flash > 0)) glow(c, 7.4, -2.6, 5, "rgba(255,40,20,.45)");
    const jaw = p.k === "hit" && p.ph === "act" ? 1 : p.ph === "pre" ? 0.5 : Math.sin(t * 4) * 0.2;
    poly(c, [8, 1, 11.6, 2 + jaw, 9.4, 4.4 + jaw], k("#3a1a1a")); poly(c, [7, 1.4, 9.6, 3.6 + jaw * 0.6, 7.2, 4.8], k("#2a1010"));
    /* Krone aus Gespinst */
    c.strokeStyle = k("#e8e0e8"); c.lineWidth = 0.4; c.beginPath(); for (let i = 0; i < 5; i++) { c.moveTo(1 + i * 1.6, -5.4); c.lineTo(0.4 + i * 1.8, -9 - (i % 2) * 1.6); } c.stroke();
    c.restore();
  };
  Z.SHAPES.nm_amboss = function (c, e, d, k, t, mv, ph) {
    const p = phs(e), bob = mv ? Math.abs(Math.sin(ph)) * 1.2 : 0, heat = e.nmP === 2 ? 1 : 0;
    legs2(c, k, -11, mv, ph, { w: 4.6, colB: "#2a2628", colF: "#3a3638", boot: "#1a1818", stride: 2.4, spread: 3.6, lift: 1.4 });
    const top = -32 - bob;
    /* Ambossrumpf */
    poly(c, [-10, top + 4, 12, top + 4, 8, top + 10, 8, -14, 10, -11, -9, -11, -7, -14, -7, top + 10], k(d.c));
    poly(c, [-10, top + 4, 12, top + 4, 13, top + 2, -11, top + 2], k(shade(d.c, 1.3)));
    /* glühende Risse */
    const gl = 0.6 + 0.4 * Math.sin(t * 4) + heat * 0.3;
    c.strokeStyle = e.flash > 0 ? "#fff6ea" : "rgba(255," + (120 + heat * 60) + ",40," + Math.min(1, gl) + ")"; c.lineWidth = 0.8;
    c.beginPath(); c.moveTo(-3, top + 6); c.lineTo(0, top + 12); c.lineTo(-2, -16); c.moveTo(0, top + 12); c.lineTo(4, top + 16); c.moveTo(5, top + 6); c.lineTo(3, top + 10); c.stroke();
    if (!lowG() && !(e.flash > 0)) glow(c, 0, top + 12, 10 + heat * 6, "rgba(255,120,30," + (0.25 + heat * 0.2) + ")");
    /* Esse als Kopf */
    poly(c, [-3, top + 2, 4, top + 2, 3.4, top - 6, -2.4, top - 6], k("#2a2628"));
    circ(c, 0.6, top - 2, 1.6, "#ffb040"); c.fillStyle = "#ff6a1a"; c.fillRect(1.6, top - 2.6, 1.4, 1);
    if (Math.random() < 0.35) FX.p({ x: e.x + e.w / 2 + 0.6 * (e.face || 1), y: e.y + 1, vx: (Math.random() - 0.5) * 10, vy: -30 - heat * 30, life: 0.7, size: 2 + heat, col: heat ? "#ff8a3a" : "#5a5250", kind: heat ? "glow" : "smoke", add: !!heat });
    /* Hammerarm */
    const a = p.k === "slam" ? swingV(p, 0.6, -2.4, 1.2) : p.k === "hit" ? swingV(p, 0.6, -1.4, 0.2) : p.k === "beam" ? -0.05 : 0.7 + Math.sin(t * 1.6) * 0.05;
    limb(c, -8, top + 6, -10, -10, 4, k(shade(d.c, 0.8)));
    const hx = 8 + Math.cos(a) * 11, hy = top + 6 + Math.sin(a) * 11;
    limb(c, 8, top + 6, hx, hy, 4.6, k(shade(d.c, 1.1)));
    c.save(); c.translate(hx, hy); c.rotate(a + PI / 2);
    limb(c, 0, 0, 0, -10, 1.6, k("#4a3020")); c.fillStyle = k("#4a4648"); c.fillRect(-5, -15, 10, 6); c.fillStyle = k("#6a6668"); c.fillRect(-5, -15, 10, 1.6);
    if (p.ph === "pre" && (p.k === "slam" || p.k === "beam")) { c.fillStyle = "rgba(255,160,60," + (0.4 + 0.5 * p.u) + ")"; c.fillRect(-5, -15, 10, 6); }
    c.restore();
    if (p.k === "beam" && p.ph) glow(c, hx + 4, hy, 8, "rgba(255,150,40,.7)");
  };
  Z.SHAPES.nm_kapitaen = function (c, e, d, k, t, mv, ph) {
    const p = phs(e), bob = mv ? Math.abs(Math.sin(ph)) * 1 : Math.sin(t * 1.6) * 0.5;
    const fl = Math.sin(t * 3) * 1 + (mv ? -2 : 0), hy = -12;
    poly(c, [-3.6, -22 - bob, -9 + fl, -3 + Math.sin(t * 4) * 0.8, -5 + fl * 0.6, -2, -2, hy + 1], k(shade(d.c, 0.75)));
    legs2(c, k, hy, mv, ph, { w: 2.4, colB: "#2a2a20", colF: "#3a3a2a", boot: "#2a1a10", stride: 3.2 });
    poly(c, [-4.4, -23 - bob, 4.2, -23 - bob, 5, hy + 1, 6.4 + fl * 0.15, -3.4, 0, -4, -5, -3.6, -5.2, hy + 1], k(d.c));
    for (let i = 0; i < 4; i++) circ(c, 1.6, -21 + i * 2.6 - bob, 0.5, k("#c8a050"));
    /* Seetang und Muscheln */
    limb(c, -4, -18 - bob, -5.6, -9 + Math.sin(t * 3) * 0.6, 0.8, k("#4a5a2a")); limb(c, 3.6, -14 - bob, 4.6, -7, 0.7, k("#5a6a2a"));
    circ(c, -2.6, -16 - bob, 0.8, k("#d8d0c0")); circ(c, 3, -19 - bob, 0.7, k("#d8d0c0"));
    /* Kopf: Bart aus Tang, Dreispitz */
    const hY = -26.4 - bob;
    ell(c, 0.6, hY, 3, 3.2, k(d.skin || "#9aa890"));
    poly(c, [-1.6, hY + 1, 3.8, hY + 0.6, 3, hY + 6 + Math.sin(t * 2) * 0.6, 0.6, hY + 7.6, -1.4, hY + 5], k("#3a4a2a"));
    c.fillStyle = k("#1a1010"); c.fillRect(1.8, hY - 1, 1.2, 0.9); if (!(e.flash > 0)) { c.fillStyle = "#ffe0a0"; c.fillRect(2.2, hY - 0.9, 0.5, 0.5); }
    poly(c, [-6, hY - 2, 7, hY - 2.4, 4, hY - 3.6, 1, hY - 7.4, -2.6, hY - 3.4], k("#1a1a14")); limb(c, -5, hY - 2.4, 6, hY - 2.6, 0.6, k("#c8a050"));
    /* Arme: Säbel vorn, Anker an Kette hinten */
    const cut = p.k === "combo" || p.k === "lunge" ? swingV(p, 0.9, -2.2, 0.6) : p.k === "shoot" && p.ph ? -0.15 : 0.9;
    limb(c, 1, -21 - bob, 1 + Math.cos(cut) * 6, -21 - bob + Math.sin(cut) * 6, 2.2, k(d.c));
    c.save(); c.translate(1 + Math.cos(cut) * 6, -21 - bob + Math.sin(cut) * 6);
    if (p.k === "shoot" && p.ph) { c.fillStyle = k("#4a3020"); c.fillRect(-0.6, -1, 3, 2); c.fillStyle = k("#6a6a70"); c.fillRect(2.4, -0.8, 5, 1.2); if (p.ph === "act") glow(c, 8, 0, 4, "rgba(255,200,120,.8)"); }
    else { c.rotate(cut - 0.5); limb(c, -1.4, 0, 1.4, 0, 1.4, k("#c8a050")); c.strokeStyle = k("#d8d0c8"); c.lineWidth = 1.4; c.beginPath(); c.moveTo(1.4, 0); c.quadraticCurveTo(7, -2.4, 12, 0.6); c.stroke(); }
    c.restore();
    const anchorOut = p.nm === "anker" && p.ph === "act" && e.act && e.act.anc;
    const ah = p.nm === "anker" && p.ph === "pre" ? -2.2 + Math.sin(t * 14) * 0.6 : 2.2;
    const bx = -2 + Math.cos(ah) * 6, by = -21 - bob + Math.sin(ah) * 6;
    limb(c, -2, -21 - bob, bx, by, 2.2, k(shade(d.c)));
    if (!anchorOut) drawAnchor(c, bx, by + 1, k, p.nm === "anker" && p.ph === "pre" ? t * 12 : 0.2);
  };
  function drawAnchor(c, x, y, k, rot) {
    c.save(); c.translate(x, y); c.rotate(rot || 0);
    limb(c, 0, -1, 0, 8, 1.4, k("#5a5a60")); limb(c, -3, 1.4, 3, 1.4, 1, k("#5a5a60")); circ(c, 0, -1.6, 1.2, k("#7a7a80"));
    c.strokeStyle = k("#5a5a60"); c.lineWidth = 1.4; c.beginPath(); c.arc(0, 4.4, 4.4, 0.25, PI - 0.25); c.stroke();
    poly(c, [3.6, 6, 6, 5, 4.6, 7.6], k("#7a7a80")); poly(c, [-3.6, 6, -6, 5, -4.6, 7.6], k("#7a7a80"));
    c.restore();
  }
  Z.SHAPES.nm_laeuter = function (c, e, d, k, t, mv, ph) {
    const p = phs(e), tilt = p.k === "dive" && p.ph ? (p.ph === "pre" ? -eo(p.u) * 0.5 : p.ph === "act" ? 0.6 : 0.3 * (1 - p.u)) : Math.sin(t * 1.4) * 0.08;
    const ring = p.nm === "glocke" ? (p.ph === "pre" ? Math.sin(t * 30) * 0.15 * p.u : p.ph === "act" ? Math.sin(t * 40) * 0.25 : 0) : 0;
    c.save(); c.translate(0, -16); c.rotate(tilt + ring);
    /* Seile, die nach unten wehen */
    for (let i = 0; i < 3; i++) { c.strokeStyle = k("#8a7a5a"); c.lineWidth = 0.6; c.beginPath(); c.moveTo(-6 + i * 6, 12); c.quadraticCurveTo(-7 + i * 6 + Math.sin(t * 2 + i) * 3, 20, -6 + i * 6 + Math.sin(t * 1.5 + i) * 4, 26); c.stroke(); }
    /* Klöppel */
    const cl = Math.sin(t * 2.4) * 2 + (p.nm === "glocke" && p.ph === "act" ? Math.sin(t * 40) * 4 : 0);
    limb(c, 0, 2, cl, 11, 1, k("#5a4a2a")); circ(c, cl, 12, 2.4, k("#6a5a3a"));
    /* Glocke aus Bronze mit Patina und Riss */
    poly(c, [-6, -10, 6, -10, 8, 2, 12, 9, 12, 11.4, -12, 11.4, -12, 9, -8, 2], k(d.c));
    poly(c, [-6, -10, -2, -10, -4, 2, -8, 9, -12, 9, -8, 2], k(shade(d.c, 1.3)));
    c.fillStyle = k("#5a4a2a"); c.fillRect(-12, 9, 24, 1); c.fillRect(-7, -4, 14, 0.8);
    c.fillStyle = k("#6a8a5a"); c.globalAlpha *= 0.5; c.fillRect(2, -6, 4, 6); c.globalAlpha /= 0.5;
    c.strokeStyle = k("#2a1a0a"); c.lineWidth = 0.5; c.beginPath(); c.moveTo(4, -9); c.lineTo(2.6, -4); c.lineTo(4.4, 0); c.stroke();
    /* geisterhafter Leib, der aus der Glocke steigt */
    c.save(); c.globalAlpha *= 0.85;
    poly(c, [-5, -9, 5, -9, 3.6, -17, -3.6, -17], k("#d8c8b0")); ell(c, 0.4, -20, 3.6, 4, k("#e8dcc8"));
    poly(c, [-4, -19, 0, -25, 4.4, -19, 4, -16, -3.6, -16], k("#b8a890"));
    c.fillStyle = k("#2a1a1a"); c.fillRect(0.6, -21, 3, 1.6);
    if (!(e.flash > 0)) { c.fillStyle = "#ffd27a"; c.fillRect(1.2, -20.6, 0.8, 0.8); c.fillRect(2.8, -20.6, 0.8, 0.8); if (!lowG()) glow(c, 2.2, -20.2, 5, "rgba(255,210,120,.5)"); }
    const arm = p.ph === "pre" ? -1.8 : 0.8;
    limb(c, 3, -15, 3 + Math.cos(arm) * 6, -15 + Math.sin(arm) * 6, 1.2, k("#d8c8b0")); limb(c, -3, -15, -6, -11, 1.2, k("#c8b8a0"));
    c.restore();
    c.restore();
  };
  Z.SHAPES.nm_dorn = function (c, e, d, k, t, mv, ph) {
    const p = phs(e), bob = mv ? Math.abs(Math.sin(ph * 0.7)) * 1.2 : Math.sin(t * 1.2) * 0.4;
    const stomp = p.k === "slam" ? (p.ph === "pre" ? eo(p.u) : p.ph === "act" ? 1 - p.u : 0) : 0;
    /* Wurzelbeine */
    for (const [s, ph0] of [[-1, 0], [1, PI]]) { const a = mv ? Math.sin(ph * 0.7 + ph0) * 3 : 0; const lift = s > 0 ? stomp * 6 : 0; limb(c, s * 3, -12 - bob, s * 5 + a, -lift, 4, k(s > 0 ? d.c : shade(d.c, 0.75))); for (let i = 0; i < 3; i++) limb(c, s * 5 + a, -lift, s * 5 + a + (i - 1) * 3.4, 0.4 - lift, 1.2, k(shade(d.c, 0.7))); }
    const top = -36 - bob;
    /* Stamm mit Rinde und rotglühendem Herzen */
    poly(c, [-7, -12 - bob, 7, -12 - bob, 6, top + 6, 2, top, -3, top + 1, -6, top + 6], k(d.c));
    c.strokeStyle = k(shade(d.c, 0.6)); c.lineWidth = 0.6; c.beginPath(); for (let i = 0; i < 4; i++) { c.moveTo(-5 + i * 3, -14 - bob); c.lineTo(-4.6 + i * 3 + Math.sin(i) * 1.4, top + 6); } c.stroke();
    ell(c, 0.6, -24 - bob, 3, 4, k("#2a1a10")); const hb = 0.6 + 0.4 * Math.sin(t * (e.nmP === 2 ? 7 : 3.4));
    circ(c, 0.6, -24 - bob, 1.8 + hb * 0.5, e.flash > 0 ? "#fff6ea" : "rgba(255," + (40 + hb * 40) + ",30,1)"); if (!lowG() && !(e.flash > 0)) glow(c, 0.6, -24 - bob, 7 + hb * 3, "rgba(255,40,30,.45)");
    /* Gesicht: Astloch-Augen */
    c.fillStyle = k("#1a0a06"); c.fillRect(1, top + 5, 2.4, 1.4); c.fillRect(4.4, top + 5.4, 1.6, 1.2);
    if (!(e.flash > 0)) { c.fillStyle = "#ff3030"; c.fillRect(1.6, top + 5.3, 0.9, 0.8); c.fillRect(4.8, top + 5.6, 0.7, 0.7); }
    /* Dornenkrone */
    for (let i = 0; i < 6; i++) { const bx = -6 + i * 2.6, by = top + 2 + Math.abs(i - 2.5) * 0.8, sw = Math.sin(t * 1.4 + i) * 0.8; limb(c, bx, by, bx + (i - 2.5) * 2 + sw, by - 7 - (i % 2) * 3, 1, k(shade(d.c, 0.85))); poly(c, [bx + (i - 2.5) * 1 + sw * 0.5, by - 3.6, bx + (i - 2.5) * 1 + 1.6 + sw * 0.5, by - 4.6, bx + (i - 2.5) * 1 + sw * 0.5, by - 4.2], k("#c8c0a0")); }
    /* Astarme */
    const a = p.k === "pull" ? (p.ph === "pre" ? -2 : p.ph === "act" ? -0.1 : 0.4) : p.k === "shoot" && p.ph ? -0.6 : p.k === "mark" && p.ph === "pre" ? 1.4 : p.k === "slam" ? swingV(p, 0.8, -2.4, 1.3) : 0.7 + Math.sin(t * 1.3) * 0.1;
    for (const [s, aa] of [[-1, 0.9], [1, a]]) {
      const sx0 = s * 5, sy0 = top + 8, ex = sx0 + Math.cos(aa) * 12 * (s > 0 ? 1 : -0.6), ey = sy0 + Math.sin(aa) * 12;
      limb(c, sx0, sy0, ex, ey, 2.6, k(s > 0 ? d.c : shade(d.c, 0.75)));
      for (let i = 0; i < 3; i++) { const u = 0.3 + i * 0.25, x = U.lerp(sx0, ex, u), y = U.lerp(sy0, ey, u); poly(c, [x - 0.6, y, x + 0.6, y, x, y - 2.6], k("#c8c0a0")); }
      for (let i = 0; i < 3; i++) limb(c, ex, ey, ex + Math.cos(aa + (i - 1) * 0.6) * 4 * (s > 0 ? 1 : -1), ey + Math.sin(aa + (i - 1) * 0.6) * 4, 0.9, k(shade(d.c, 0.85)));
    }
    if (p.k === "shoot" && p.ph === "pre") for (let i = 0; i < 5; i++) circ(c, 8 + Math.cos(i * 1.2 + t * 3) * 4, top + 6 + Math.sin(i * 1.2 + t * 3) * 4, 0.7, k("#c8e060"));
  };
  Z.SHAPES.nm_ilvara = function (c, e, d, k, t, mv, ph) {
    const p = phs(e), bob = mv ? Math.abs(Math.sin(ph)) * 1 : Math.sin(t * 2.2) * 0.3;
    const spinA = p.k === "combo" && p.ph === "act" ? t * 26 : 0, low = p.k === "lunge" && p.ph === "pre" ? eo(p.u) * 2.4 : 0;
    const hy = -11 + low * 0.5, fl = Math.sin(t * 4) * 1.4 - (mv ? 3 : 0);
    /* Schal im Wind */
    c.strokeStyle = k("#a8203a"); c.lineWidth = 1.6; c.lineCap = "round"; c.beginPath(); c.moveTo(-1, -20 - bob + low); c.quadraticCurveTo(-8 + fl, -21 + Math.sin(t * 5) * 2, -14 + fl * 1.5, -16 + Math.sin(t * 4) * 3); c.stroke();
    legs2(c, k, hy, mv, ph, { w: 2, colB: "#1a1420", colF: "#2a2232", boot: "#1a1018", stride: 3.6, crouch: low });
    poly(c, [-3.4, -21 - bob + low, 3.6, -21 - bob + low, 3, hy + 1, -3, hy + 1], k(d.c));
    poly(c, [-3, hy + 1, 3.4, hy + 1, 4.6, hy + 5, -4, hy + 5], k("#3a2a4a"));
    limb(c, -3.4, -18 - bob + low, 3.6, hy + 2, 0.9, k("#c8304a"));
    /* Kopf: dunkle Haut, langes weißes Haar */
    const hY = -24.4 - bob + low;
    ell(c, 0.6, hY, 2.8, 3, k(d.skin || "#4a3e5e"));
    c.fillStyle = k("#f0ece8"); c.beginPath(); c.moveTo(-2.4, hY - 2.4); c.quadraticCurveTo(0.6, hY - 4.4, 3, hY - 2); c.lineTo(-1, hY - 1); c.quadraticCurveTo(-6 + fl * 0.6, hY + 3, -9 + fl, hY + 8 + Math.sin(t * 3) * 1.4); c.lineTo(-6 + fl * 0.6, hY + 8); c.quadraticCurveTo(-3, hY + 2, -2.4, hY - 2.4); c.fill();
    if (!(e.flash > 0)) { c.fillStyle = "#ff5a6a"; c.fillRect(2, hY - 0.6, 1, 0.7); }
    /* zwei Krummsäbel */
    const a1 = p.k === "combo" ? swingV(p, 0.8, -2.4, 0.8) + spinA : p.k === "lunge" ? (p.ph === "act" ? -0.1 : p.ph === "pre" ? 2.6 : 0.6) : p.k === "shoot" && p.ph ? -0.3 : 0.8;
    const a2 = p.k === "combo" ? swingV(p, 1.4, 0.6, -1.6) + spinA + PI : 1.5;
    for (const [aa, sx0, col] of [[a2, -1.6, shade(d.c, 0.8)], [a1, 1.6, d.c]]) {
      const shx = sx0, shy = -20 - bob + low, hx = shx + Math.cos(aa) * 6, hy2 = shy + Math.sin(aa) * 6;
      limb(c, shx, shy, hx, hy2, 1.8, k(col)); circ(c, hx, hy2, 0.9, k(d.skin || "#4a3e5e"));
      c.save(); c.translate(hx, hy2); c.rotate(aa - 0.3);
      c.strokeStyle = k("#e8e0e8"); c.lineWidth = 1.2; c.beginPath(); c.moveTo(0.8, 0); c.quadraticCurveTo(6, -2.6, 11, 0.4); c.stroke(); limb(c, -1, 0, 0.8, 0, 1.2, k("#c8a050"));
      c.restore();
    }
    if (p.k === "shoot" && p.ph === "pre") for (let i = 0; i < 5; i++) { const aa = -0.6 + i * 0.3; limb(c, 4 + Math.cos(aa) * 3, -19 + Math.sin(aa) * 3, 4 + Math.cos(aa) * 7, -19 + Math.sin(aa) * 7, 0.6, k("#c890ff")); }
  };

  /* ---------- die neun Wächter ---------- */
  mbDef("ratten", { size: 1.25, n: ["Mutter Nagezahn", "Mother Gnawtooth"], title: ["Königin der Kanalratten", "Queen of the Sewer Rats"], areas: ["torhof", "keller"], seed: 3301,
    hint: ["Ab halber Kraft gräbt sie sich ein – achte auf den Boden.", "Below half she burrows – watch the ground."],
    def: { shape: "nm_ratten", c: "#5a4a40", t: "#c89a8a", w: 30, h: 18, hp: 8, dmg: 1.1, spd: 118, ai: "pack", snd: "rat", poise: 0.45,
      atks: [{ k: "leap", r: [30, 130], pre: 0.55, act: 0.5, post: 0.45, cd: 1.6, box: [0, -18, 30, 18], jump: [290, -250], sfx: "bite", open: 0.5, name: ["Sprungbiss", "Pounce Bite"] },
        { k: "mark", hz: "zone", n: 4, hw: 26, hh: 20, warn: 0.85, life: 0.4, r: [40, 240], pre: 0.6, act: 0.1, post: 0.5, cd: 5.5, col: "#9ad04a", eff: { poison: 1 }, sfx: "slime", w: 0.7, name: ["Seuchenpfützen", "Plague Puddles"] },
        { k: "hit", r: [0, 30], pre: 0.38, act: 0.1, post: 0.35, cd: 0.8, box: [0, -16, 28, 16], sfx: "bite", w: 0.8, name: ["Nagezahn", "Gnaw"] },
        { k: "summon", r: [0, 260], pre: 0.85, act: 0.1, post: 0.5, cd: 8, spawn: ["ratte", "ratte", "ratte"], max: 6, sfx: "rat", w: 0.6, name: ["Rattenflut", "Rat Flood"] },
        { k: "lob", proj: "e_gift", n: 3, r: [50, 200], pre: 0.7, act: 0.1, post: 0.5, cd: 4.5, sfx: "slime", w: 0.6, name: ["Seuchenspucke", "Plague Spit"] }] },
    p2: [{ k: "nm", nm: "wuehlen", r: [40, 280], pre: 0.55, act: 1.5, post: 0.55, cd: 5.5, glyph: "!!", sfx: "rock", w: 1.2, dy: 140, track: false, open: 1.1, name: ["Wühlangriff", "Burrow Strike"] },
      { k: "charge", r: [60, 280], pre: 0.7, act: 0.9, post: 0.6, cd: 6, box: [0, -18, 30, 18], spd: 320, armor: true, glyph: "!!", kb: 260, sfx: "rat", w: 0.8, open: 0.9, name: ["Rattenwalze", "Rat Stampede"] }],
    say: { intro: [["Meine Kinder haben Hunger, Gehörnter. Großen Hunger.", "My children are hungry, horned one. Very hungry."]], p2: [["Unter die Erde, meine Lieben!", "Underground, my darlings!"]], die: [["Meine … Kinder …", "My … children …"]] } });
  mbDef("haeuptling", { size: 1.25, n: ["Krumschnabel der Hauer", "Crookbeak the Tusker"], title: ["Goblin-Kriegshäuptling", "Goblin Warchief"], areas: ["torhof", "wehrgang"], seed: 5507,
    hint: ["Weich dem Ansturm aus – an Wänden prallt der Keiler ab.", "Dodge the charge – the boar stuns itself on walls."],
    def: { shape: "nm_keiler", c: "#5a4a3a", t: "#6f9a3a", w: 26, h: 28, hp: 9, dmg: 1.25, spd: 128, ai: "charger", snd: "goblin", poise: 0.6,
      atks: [{ k: "charge", r: [50, 280], pre: 0.75, act: 1.0, post: 0.7, cd: 2.6, box: [0, -24, 30, 24], spd: 340, armor: true, glyph: "!!", kb: 300, sfx: "roar", hitSfx: "hitHeavy", open: 1.0, name: ["Keileransturm", "Boar Charge"] },
        { k: "hit", r: [0, 34], pre: 0.42, act: 0.1, post: 0.4, cd: 0.8, box: [0, -22, 32, 20], sfx: "bite", w: 0.8, name: ["Hauerstoß", "Tusk Gore"] },
        { k: "volley", proj: "e_bombe", n: 4, r: [60, 240], pre: 0.85, act: 0.1, post: 0.5, cd: 4.5, sfx: "swing", w: 0.7, name: ["Bombenteppich", "Bomb Carpet"] },
        { k: "summon", r: [0, 260], pre: 0.9, act: 0.1, post: 0.5, cd: 9, spawn: ["goblin", "goblinBogen"], max: 4, sfx: "horn", w: 0.5, name: ["Kriegshorn", "War Horn"] }] },
    p2: [{ k: "volley", proj: "e_glut", n: 6, r: [60, 260], pre: 0.85, act: 0.1, post: 0.5, cd: 5, sfx: "fire", w: 0.8, name: ["Feuerbomben", "Fire Bombs"] },
      { k: "mark", hz: "zone", n: 5, hw: 24, hh: 34, warn: 0.95, life: 0.35, r: [30, 260], pre: 0.6, act: 0.1, post: 0.6, cd: 6, col: "rgba(255,140,50,.95)", eff: { burn: 1 }, sfx: "horn", w: 0.8, open: 0.8, name: ["Sprengfallen", "Blast Traps"] }],
    say: { intro: [["Hoho! Der Hornkopf! Der Keiler hat schon lange keinen Zerstörer mehr gefressen!", "Hoho! Hornhead! The boar hasn't eaten a destroyer in ages!"]], p2: [["Zündet die guten Bomben an!", "Light the good bombs!"]], die: [["Mein … Schwein …", "My … pig …"]] } });
  mbDef("kerker", { size: 1.2, n: ["Eisenschloss", "Ironlock"], title: ["Kerkermeister der Spinne", "The Spider's Jailer"], areas: ["keller", "verlies"], seed: 7121,
    hint: ["Wo ein Schatten fällt, fällt gleich ein Käfig.", "Where a shadow falls, a cage soon follows."],
    def: { shape: "nm_kerker", c: "#3a2a24", t: "#6a6a70", skin: "#b07a5a", w: 18, h: 32, hp: 10, dmg: 1.35, spd: 62, ai: "walker", metal: true, poise: 0.6,
      atks: [{ k: "pull", r: [50, 190], pre: 0.7, act: 0.35, post: 0.5, cd: 3.5, glyph: "!!", sfx: "chain", name: ["Kettenhaken", "Chain Hook"] },
        { k: "combo", n: 2, gap: 0.3, r: [0, 40], pre: 0.55, act: 0.12, post: 0.55, cd: 1.2, box: [-6, -32, 48, 32], armor: true, sfx: "swingHeavy", hitSfx: "hitHeavy", name: ["Schlüsselbund", "Key Ring"] },
        { k: "nm", nm: "kaefig", r: [30, 230], pre: 0.7, act: 0.2, post: 0.5, cd: 4.5, sfx: "chain", dy: 160, w: 0.9, name: ["Käfigsturz", "Cage Drop"] },
        { k: "hit", r: [0, 32], pre: 0.45, act: 0.1, post: 0.45, cd: 0.8, box: [0, -28, 32, 26], sfx: "punch", w: 0.7, name: ["Kerkerfaust", "Jailer's Fist"] }] },
    p2: [{ k: "summon", r: [0, 260], pre: 0.8, act: 0.1, post: 0.5, cd: 9, spawn: ["skelett", "zombie"], max: 3, sfx: "chain", w: 0.6, name: ["Zellen öffnen", "Open the Cells"] },
      { k: "combo", n: 4, gap: 0.2, r: [0, 44], pre: 0.75, act: 0.1, post: 0.6, cd: 4, box: [-30, -30, 60, 30], armor: true, glyph: "!!", sfx: "chain", hitSfx: "hitHeavy", w: 0.7, open: 1.0, name: ["Kettenwirbel", "Chain Whirl"] },
      { k: "slam", r: [0, 60], pre: 0.8, act: 0.12, post: 0.6, cd: 4.5, box: [-10, -30, 60, 30], wave: true, armor: true, glyph: "!!", sfx: "anvil", hitSfx: "hitHeavy", w: 0.7, name: ["Zellentür", "Cell Door"] }],
    say: { intro: [["Noch ein Gefangener. Deine Zelle ist schon gefegt.", "Another prisoner. Your cell's already swept."]], p2: [["Alle Zellen auf! Holt ihn euch!", "Open every cell! Get him!"]], die: [["Die Schlüssel … nimm sie … sie passen eh nirgends …", "The keys … take them … they fit nothing anyway …"]] } });
  mbDef("weberin", { size: 1.2, n: ["Die Weberin", "The Weaver"], title: ["Mutter des Schlunds", "Mother of the Chasm"], areas: ["schlund", "see"], seed: 8803,
    hint: ["Ab halber Kraft verschwindet sie nach oben – folge dem Faden.", "Below half she vanishes upward – follow the thread."],
    def: { shape: "nm_weberin", c: "#3a2a2a", t: "#c03a3a", w: 34, h: 20, hp: 9, dmg: 1.15, spd: 122, ai: "walker", snd: "insect", poise: 0.5, immune: ["poison"],
      atks: [{ k: "volley", proj: "e_netz", n: 3, r: [50, 220], pre: 0.7, act: 0.1, post: 0.5, cd: 4, sfx: "web", w: 0.8, name: ["Netzregen", "Web Rain"] },
        { k: "leap", r: [40, 150], pre: 0.5, act: 0.6, post: 0.45, cd: 2, jump: [300, -280], box: [0, -18, 32, 18], eff: { poison: 1 }, sfx: "bite", name: ["Giftsprung", "Venom Leap"] },
        { k: "summon", r: [0, 260], pre: 0.85, act: 0.1, post: 0.5, cd: 8, spawn: ["spinnchen", "spinnchen", "spinnchen"], max: 6, sfx: "slime", w: 0.6, name: ["Brut", "Brood"] },
        { k: "hit", r: [0, 34], pre: 0.36, act: 0.1, post: 0.4, cd: 0.8, box: [0, -18, 34, 18], eff: { poison: 1 }, sfx: "bite", w: 0.8, name: ["Klauenbiss", "Fang Bite"] }] },
    p2: [{ k: "nm", nm: "faden", r: [0, 300], pre: 0.5, act: 1.6, post: 0.6, cd: 6, glyph: "!!", sfx: "web", dy: 220, track: false, w: 1.2, open: 1.2, name: ["Fadensturz", "Thread Drop"] },
      { k: "mark", hz: "strike", n: 3, hw: 18, warn: 0.85, life: 0.3, r: [0, 280], pre: 0.6, act: 0.1, post: 0.5, cd: 5, col: "rgba(240,220,236,1)", sfx: "web", w: 0.9, name: ["Fadenfall", "Thread Fall"] }],
    say: { intro: [["Ein Faden mehr in meinem Netz. Ein roter.", "One more thread in my web. A red one."]], p2: [["Sieh nach oben, kleiner Faden.", "Look up, little thread."]], die: [["Die Spinne … wird … weiterweben …", "The Spider … will … keep weaving …"]] } });
  mbDef("amboss", { size: 1.2, n: ["Amboss", "Anvil"], title: ["Der Schmiedegolem", "The Forge Golem"], areas: ["schmiede", "glut"], seed: 6203,
    hint: ["Schwerfällig – aber wehe, der Hammer trifft. Feuer kümmert ihn nicht.", "Lumbering – but woe if the hammer lands. Fire doesn't faze it."],
    def: { shape: "nm_amboss", c: "#5e5658", t: "#ff7a2a", w: 26, h: 34, hp: 12, dmg: 1.5, spd: 48, ai: "walker", armor: 0.2, metal: true, poise: 0.75, immune: ["burn", "bleed", "poison"],
      atks: [{ k: "slam", r: [0, 50], pre: 0.85, act: 0.12, post: 0.7, cd: 1.6, box: [-8, -38, 58, 38], armor: true, wave: true, glyph: "!!", sfx: "quake", hitSfx: "hitHeavy", open: 0.7, name: ["Hammerschlag", "Hammer Blow"] },
        { k: "volley", proj: "e_glut", n: 5, r: [60, 240], pre: 0.8, act: 0.1, post: 0.5, cd: 4, sfx: "fire", w: 0.7, name: ["Funkenregen", "Spark Rain"] },
        { k: "beam", r: [50, 280], pre: 1.0, act: 0.6, post: 0.7, cd: 5, col: "rgba(255,140,40,.9)", glyph: "!!", sfx: "fireBig", w: 0.6, open: 1.0, name: ["Glutstrahl", "Ember Beam"] },
        { k: "charge", r: [60, 260], pre: 0.85, act: 1.0, post: 0.7, cd: 6, box: [0, -32, 30, 32], spd: 260, armor: true, glyph: "!!", kb: 300, sfx: "anvil", hitSfx: "hitHeavy", w: 0.6, name: ["Glutwalze", "Ember Roll"] },
        { k: "hit", r: [0, 36], pre: 0.5, act: 0.1, post: 0.5, cd: 0.9, box: [0, -30, 36, 26], sfx: "anvil", hitSfx: "hitHeavy", w: 0.8, name: ["Ambossfaust", "Anvil Fist"] }] },
    p2: [{ k: "mark", hz: "column", n: 3, hw: 22, warn: 0.9, life: 0.7, r: [40, 260], pre: 0.6, act: 0.1, post: 0.5, cd: 4.5, col: "rgba(255,120,40,.85)", eff: { burn: 1 }, sfx: "fireBig", w: 0.9, name: ["Esse", "Forge Vents"] }],
    say: { intro: [["*Ein Dröhnen wie ein Hammer auf hohlem Eisen.*", "*A booming like a hammer on hollow iron.*"]], p2: [["*Die Risse glühen weiß. Er läuft heiß.*", "*The cracks glow white. It's running hot.*"]], die: [["*Das Feuer in seiner Brust erlischt.*", "*The fire in its chest goes out.*"]] } });
  mbDef("salzbart", { size: 1.15, n: ["Kapitän Salzbart", "Captain Saltbeard"], title: ["Der Ertrunkene vom Pier", "The Drowned of the Pier"], areas: ["hafen", "see"], seed: 4409,
    hint: ["Der Anker kommt zurück – zweimal ausweichen.", "The anchor comes back – dodge twice."],
    def: { shape: "nm_kapitaen", c: "#3a3a2a", t: "#8a6a3a", skin: "#9aa890", w: 14, h: 28, hp: 9, dmg: 1.25, spd: 95, ai: "duelist", undead: true, poise: 0.45,
      atks: [{ k: "combo", n: 3, gap: 0.18, r: [0, 34], pre: 0.42, act: 0.08, post: 0.45, cd: 1.1, box: [0, -24, 32, 22], sfx: "slash", name: ["Säbelwirbel", "Cutlass Flurry"] },
        { k: "nm", nm: "anker", r: [40, 190], pre: 0.65, act: 0.9, post: 0.5, cd: 3.6, glyph: "!!", sfx: "chain", dy: 40, w: 1, open: 0.8, name: ["Ankerwurf", "Anchor Throw"] },
        { k: "volley", proj: "e_bombe", n: 3, r: [60, 240], pre: 0.8, act: 0.1, post: 0.5, cd: 5.5, sfx: "explode", w: 0.6, name: ["Pulverfass", "Powder Keg"] },
        { k: "shoot", proj: "e_bolzen", r: [60, 280], pre: 0.85, act: 0.05, post: 0.5, cd: 3, lockAim: 0.3, aimLine: true, sfx: "explode", w: 0.6, name: ["Steinschloss", "Flintlock"] },
        { k: "lunge", r: [30, 100], pre: 0.45, act: 0.2, post: 0.45, cd: 2, lunge: 330, box: [0, -22, 28, 20], sfx: "slash", w: 0.7, name: ["Entern!", "Board 'em!"] }] },
    p2: [{ k: "slam", r: [0, 260], pre: 0.85, act: 0.12, post: 0.6, cd: 4.5, box: [-10, -24, 20, 24], wave: true, armor: true, glyph: "!!", sfx: "splash", w: 0.9, dy: 60, name: ["Flutwelle", "Tidal Wave"] },
      { k: "summon", r: [0, 260], pre: 0.8, act: 0.1, post: 0.5, cd: 10, spawn: ["ertrunkener"], max: 2, sfx: "splash", w: 0.5, name: ["Alle Mann an Deck!", "All hands on deck!"] }],
    say: { intro: [["Arr. Noch einer für den Grund des Sees.", "Arr. Another one for the bottom of the lake."]], p2: [["Die See holt sich, was ihr gehört!", "The sea takes what's hers!"]], die: [["Endlich … trockenes Land …", "Finally … dry land …"]] } });
  mbDef("laeuter", { size: 1.15, n: ["Der Läuter", "The Tolling One"], title: ["Totenglocke der Feste", "Death Knell of the Keep"], areas: ["glocken", "sturm", "zinnen"], seed: 2909,
    hint: ["Spring über die Glockenwellen.", "Jump over the bell waves."],
    def: { shape: "nm_laeuter", c: "#8a6a3a", t: "#ffd27a", w: 22, h: 30, hp: 8, dmg: 1.2, spd: 72, ai: "flyer", fly: true, keep: [70, 140], undead: true, poise: 0.5, immune: ["poison", "bleed"],
      atks: [{ k: "nm", nm: "glocke", r: [0, 220], pre: 0.85, act: 0.2, post: 0.6, cd: 3.5, glyph: "!!", sfx: "bell", w: 1.1, name: ["Glockenschlag", "Bell Strike"] },
        { k: "dive", r: [0, 170], pre: 0.75, act: 0.7, post: 0.6, cd: 3, box: [-4, -26, 30, 26], spd: 300, glyph: "!!", sfx: "bell", w: 0.9, open: 1.0, name: ["Klöppelsturz", "Clapper Dive"] },
        { k: "shoot", proj: "e_schall", r: [40, 240], pre: 0.6, act: 0.05, post: 0.5, cd: 2.5, sfx: "roar", w: 0.8, name: ["Schallwelle", "Sound Wave"] }] },
    p2: [{ k: "mark", hz: "strike", n: 3, hw: 20, warn: 0.9, r: [0, 300], pre: 0.7, act: 0.1, post: 0.5, cd: 5, col: "rgba(255,220,150,1)", sfx: "thunder", w: 0.9, name: ["Totengeläut", "Death Toll"] },
      { k: "shoot", proj: "e_schall", n: 3, spread: 0.5, r: [40, 260], pre: 0.75, act: 0.05, post: 0.5, cd: 4.5, glyph: "!!", sfx: "bell", w: 0.8, name: ["Dreiklang", "Triad"] }],
    say: { intro: [["DONG. Wem schlägt die Stunde? DONG. Dir.", "DONG. For whom tolls the hour? DONG. For you."]], p2: [["DONG – DONG – DONG!", "DONG – DONG – DONG!"]], die: [["… dong …", "… dong …"]] } });
  mbDef("dornvater", { size: 1.2, n: ["Der Dornenvater", "The Thornfather"], title: ["Ältester der Blights", "Eldest of the Blights"], areas: ["zinnen", "sturm"], seed: 1717,
    hint: ["Wurzeln brechen dort hervor, wo der Boden grünt.", "Roots burst where the ground turns green."],
    def: { shape: "nm_dorn", c: "#4a3a22", t: "#ff3030", w: 26, h: 38, hp: 12, dmg: 1.4, spd: 42, ai: "walker", armor: 0.15, poise: 0.7,
      atks: [{ k: "mark", hz: "zone", n: 3, hw: 24, hh: 30, warn: 0.8, life: 0.5, r: [30, 260], pre: 0.7, act: 0.1, post: 0.5, cd: 3.5, col: "#5a8a30", eff: { root: 1.2 }, sfx: "roots", name: ["Wurzelfeld", "Root Field"] },
        { k: "pull", r: [50, 200], pre: 0.6, act: 0.45, post: 0.5, cd: 4.5, glyph: "!!", sfx: "roots", w: 0.7, name: ["Rankenzug", "Vine Pull"] },
        { k: "shoot", proj: "e_nadel", n: 7, spread: 0.9, r: [30, 220], pre: 0.7, act: 0.05, post: 0.5, cd: 3, sfx: "insect", w: 0.8, name: ["Dornensalve", "Thorn Volley"] },
        { k: "slam", r: [0, 50], pre: 0.85, act: 0.12, post: 0.7, cd: 2.2, box: [-10, -40, 60, 40], wave: true, armor: true, glyph: "!!", sfx: "quake", hitSfx: "hitHeavy", open: 0.7, name: ["Stampfen", "Stomp"] },
        { k: "volley", proj: "e_gift", n: 4, r: [60, 240], pre: 0.75, act: 0.1, post: 0.5, cd: 5, sfx: "slime", w: 0.6, name: ["Sporenkapseln", "Spore Pods"] }] },
    p2: [{ k: "summon", r: [0, 260], pre: 0.8, act: 0.1, post: 0.5, cd: 7, spawn: ["zweigBlight", "zweigBlight"], max: 4, sfx: "roots", w: 0.7, name: ["Blightbrut", "Blight Brood"] }],
    say: { intro: [["Knarrr … Ein roter Spross … reif zum Brechen …", "Creak … A red sprout … ripe for breaking …"]], p2: [["Wachst, meine Zweige! WACHST!", "Grow, my twigs! GROW!"]], die: [["… zurück … zur Erde …", "… back … to the earth …"]] } });
  mbDef("ilvara", { size: 1.12, n: ["Ilvara Nachtklinge", "Ilvara Nightblade"], title: ["Klingentänzerin der Drow", "Drow Blade Dancer"], areas: ["hallen", "wehrgang"], seed: 9091,
    hint: ["Verschwindet sie, steht sie gleich hinter dir.", "When she vanishes, she's right behind you."],
    def: { shape: "nm_ilvara", c: "#2a2236", t: "#c8304a", skin: "#4a3e5e", w: 12, h: 24, hp: 7.5, dmg: 1.25, spd: 148, ai: "duelist", poise: 0.4,
      atks: [{ k: "combo", n: 4, gap: 0.15, r: [0, 34], pre: 0.42, act: 0.08, post: 0.45, cd: 1.1, box: [-6, -22, 34, 20], sfx: "slash", name: ["Klingenwirbel", "Blade Whirl"] },
        { k: "teleport", behind: true, r: [40, 220], pre: 0.4, act: 0.05, post: 0.25, cd: 4.5, sfx: "shadow", w: 0.6, name: ["Schattenschritt", "Shadow Step"] },
        { k: "mark", hz: "strike", n: 4, hw: 16, warn: 0.8, life: 0.25, r: [30, 260], pre: 0.55, act: 0.1, post: 0.5, cd: 5.5, col: "rgba(200,48,74,.95)", sfx: "shadow", w: 0.6, name: ["Mondfall", "Moonfall"] },
        { k: "shoot", proj: "e_dolch", n: 5, spread: 0.6, r: [50, 220], pre: 0.6, act: 0.05, post: 0.45, cd: 3.5, sfx: "throwK", w: 0.7, name: ["Dolchfächer", "Dagger Fan"] },
        { k: "lunge", r: [30, 110], pre: 0.5, act: 0.22, post: 0.5, cd: 2.5, lunge: 380, box: [-4, -22, 30, 20], glyph: "!!", sfx: "stab", w: 0.8, open: 0.6, name: ["Mondsichel", "Crescent"] }] },
    p2: [{ k: "summon", r: [0, 260], pre: 0.7, act: 0.1, post: 0.4, cd: 10, spawn: ["drowWache"], max: 2, sfx: "shadow", w: 0.5, name: ["Schattenschwestern", "Shadow Sisters"] }],
    say: { intro: [["Tanz mit mir, Oberflächenteufel. Einen Tanz nur.", "Dance with me, surface devil. Just one dance."]], p2: [["Schwestern! Der Tanz wird schneller!", "Sisters! The dance quickens!"]], die: [["Ein … schöner … Tanz …", "A … lovely … dance …"]] } });

  /* ---------- Erzeugen, Auftritt, Phasen, Beute ---------- */
  MB.pickFor = biome => { const l = Object.keys(MBD).filter(k => MBD[k].areas.includes(biome)); return l.length ? Z.R.pick(l) : null; };
  MB.spawn = function (id, x, y, o) {
    o = o || {}; const D = MBD[id]; if (!D) return null;
    const e = Z.spawnEnemy("mb_" + id, x, y, { tier: tierN() }); if (!e) return null;
    e.nmMini = D; e.def = Object.assign({}, e.def); e.nmP = 1; e.nmRoom = o.cell || null; e.nmNoSeal = !!o.noSeal; e.nmSealed = [];
    /* W6-Balancing: Mini-Bosse fielen in 2–6 s (Bot) – Ziel 30–60 s für Spieler → Leben ×3,5 (vorher ×1) */
    /* W9: Schlüssel korrigiert (keiler/kapitaen/dorn griffen nie – Ids sind haeuptling/salzbart/dornvater; Krumschnabel fiel mit Speer +5 in 4 s).
       Grundfaktor 3,5 → 5,0 – sie fielen auch mit Standardausrüstung in 7–15 s (Bot), weil Dauer-Rückstoß sie lähmte; jetzt „Standhaft“,
       Angriffsfenster, ein Angriff mehr und Wut unter 25 % (Prüfstand w9_boss: starke Ausrüstung vorher 4–33 s) */
    /* W9 (3. Runde, Prüfstand kampf.py Standardausrüstung): Ratten 22 s, Keiler 24, Kerker 22, Weberin 19, Dornvater 18 s → ×1,5 (Ziel 30–60 s);
       Kapitän 37 s, Amboss 44 s bleiben. In Läufen mit guter Ausrüstung (K6) lagen Mini-Bosse bei 6–33 s. */
    const MBHP = { ratten: 4.3 /* 6. Runde: 21–50 s */, haeuptling: 3.4, kerker: 3.3, salzbart: 2.4, ilvara: 2.3, weberin: 3.0, amboss: 1, dornvater: 1.4, laeuter: 1.2 }; /* vorher 2,5/2,3/2,2/2,4/2,8/2,0/1/1,1/1,1; 6. Runde Fernkampf-Prüfstand: Läuter 154 s, Dornvater 78–90 s, Ilvara 334 s → etwas weniger */
    e.hp = e.hpMax = Math.round(e.hpMax * 5.75 /* W9 8. Runde: 24 Prüfstand-Kämpfe Median 36 s, 12 unter 30 s → +15 % */ * (MBHP[id] || 1));
    if (tierN() === 0) { e.hp = e.hpMax = Math.round(e.hpMax * 0.75); e.dmgMul *= 0.85; }
    if (o.aware) e.aware = true;
    mbLive.push(e);
    return e;
  };
  function mbIntro(e) {
    if (e.nmIntro) return; e.nmIntro = true;
    const D = e.nmMini, P = Z.player;
    e.aware = true; e.act = null; e.cd = Math.max(e.cd, 1.4); e.face = U.sign(P.x - e.x) || 1;
    if (e.nmRoom && !e.nmNoSeal && playerIn(e.nmRoom, 2)) { const s = sealCell(e.nmRoom); if (s) e.nmSealed = s; }
    say(e, L(Z.R.pick(D.say.intro)), { who: L(D.n), life: 3.6 });
    showUp(e, L(["Mini-Boss", "Mini-Boss"]), L(D.n), L(D.title), [[L(D.hint), "#5a3a1a"]], D.seed, { kind: "mini", seal: "♛", pan: 1.4, sfx: e.def.snd || "roar" });
    FX.slowmo(0.4, 0.5);
    const m = M(); m.miniboss = m.miniboss && typeof m.miniboss === "object" ? m.miniboss : {}; const r = (m.miniboss[D.id] = m.miniboss[D.id] || { met: 0, won: 0 }); r.met++; saveSoon();
  }
  function mbPhase2(e) {
    const D = e.nmMini; e.nmP = 2;
    e.def = Object.assign({}, e.def, { spd: (e.def.spd || 80) * 1.12, atks: e.def.atks.map(a => Object.assign({}, a, { cd: (a.cd || 1) * 0.85 })).concat(D.p2.map(a => Object.assign({ w: 1 }, a))) });
    e.act = null; e.cd = 0.9; e.invuln = Math.max(e.invuln || 0, 0.6); e.dmgMul *= 1.1;
    say(e, L(Z.R.pick(D.say.p2)), { who: L(D.n), life: 2.8 });
    FX.ring(e.x + e.w / 2, e.y + e.h / 2, 40, "#ffb040", 0.5, 3); FX.addShake(4); A.play("roar", { x: e.x, vol: 0.6 });
    wtext(e.x + e.w / 2, e.y - 28, L(["Zweite Phase!", "Second phase!"]), { col: "#ffb070", size: 9, life: 2 });
    if (Z.music && Z.music.stinger) Z.music.stinger("phase");
  }
  /* W9: Standhaft – Mini-Bosse ließen sich mit starken Waffen dauerhaft unterbrechen (Prüfstand: oft nur 1 Angriff je Kampf, 0 Schaden).
     Nach zwei Unterbrechungen binnen 3 s sind sie 3 s lang standhaft (orangefarbener Ring); Betäuben wirkt nur halb. */
  {
    const stag0 = Z.staggerEnemy, canc0 = Z.cancelEnemyAct, st0 = Z.addStatus;
    const guard = e => {
      if (!e || !e.nmMini || e.dead) return false;
      if (e.nmGuardT > 0) return true;
      const now = e.anim || 0; e.nmStag = (e.nmStag || []).filter(t => now - t < 3); e.nmStag.push(now);
      if (e.nmStag.length >= 3) { e.nmStag = []; e.nmGuardT = 3; wtext(e.x + e.w / 2, e.y - 20, L(["Standhaft!", "Steadfast!"]), { col: "#ffb070", size: 8, life: 1.2 }); FX.ring(e.x + e.w / 2, e.y + e.h / 2, 16 + e.w * 0.5, "#ffb070", 0.35, 2); A.play("block", { x: e.x, vol: 0.5 }); return true; }
      return false;
    };
    if (stag0) Z.staggerEnemy = function (e, t) { if (guard(e)) return; return stag0.apply(this, arguments); };
    if (canc0) Z.cancelEnemyAct = function (e) { if (e && e.nmMini && e.nmGuardT > 0) return; return canc0.apply(this, arguments); };
    if (st0) Z.addStatus = function (t, k, v, isPlayer) { if (!isPlayer && t && t.nmMini && (k === "stun" || k === "root")) { if (t.nmGuardT > 0) return; v *= 0.5; } return st0.call(this, t, k, v, isPlayer); };
  }
  /* W9: Schwachpunkt – kurz benommen, 1,5-facher Schaden (Z.hitEnemy-Hülle in bossphasen.js, Abschnitt 6) */
  function mbOpen(e, sec) {
    sec *= tierN() === 0 ? 1.3 : 1;
    e.st.stun = Math.max(e.st.stun || 0, sec); e.openT = sec; e.openMax = sec; e.act = null; e.cd = Math.max(e.cd || 0, 0.3);
    wtext(e.x + e.w / 2, e.y - 16, L(["Schwachpunkt!", "Weak spot!"]), { col: "#ffe08a", size: 8, life: 1.4 });
    FX.ring(e.x + e.w / 2, e.y + e.h * 0.4, 18 + e.w * 0.5, "#ffe08a", 0.4, 2); A.play("parry", { x: e.x, vol: 0.4 });
  }
  /* W9: Wut – schneller, kürzere Pausen */
  function mbWut(e) {
    e.wut = true;
    e.def = Object.assign({}, e.def, { spd: (e.def.spd || 80) * 1.1, atks: e.def.atks.map(a => Object.assign({}, a, { cd: (a.cd || 1) * (tierN() === 0 ? 0.9 : 0.78) })) });
    e.cd = Math.min(e.cd || 0, 0.4);
    wtext(e.x + e.w / 2, e.y - 28, L(["Wut!", "Fury!"]), { col: "#ff5a3a", size: 10, life: 1.8 });
    FX.ring(e.x + e.w / 2, e.y + e.h / 2, 50, "#ff3a2a", 0.5, 4); FX.addShake(5); A.play(e.def.snd || "roar", { x: e.x, vol: 0.7, rate: 0.85 });
  }
  function mbDeath(e) {
    const D = e.nmMini, x = e.x + e.w / 2, y = e.y + e.h;
    unsealTiles(e.nmSealed);
    say({ x: e.x, y: e.y, w: e.w, h: e.h, gone: true }, L(Z.R.pick(D.say.die)), { x, y: e.y, who: L(D.n), life: 2.8 });
    for (const m of Z.enemies) if (m.master === e && !m.dead) { FX.burst(m.x + m.w / 2, m.y + m.h / 2, 8, { col: ["#2a2024", "#4a3a40"], sp: 60, life: 0.5, size: 3, kind: "smoke" }); m.dead = true; m.deadT = 99; }
    FX.slowmo(0.3, 0.7); FX.flashScreen("#ffe0b0", 0.25); A.play("gong", { vol: 0.5, delay: 0.2 });
    if (Z.music && Z.music.stinger) Z.music.stinger("sieg");
    const tier = tierN();
    Z.dropGold(x, y - 8, 70 * Z.BAL.goldMul(tier)); Z.dropShards(x, y - 8, 20 + 6 * tier);
    later(() => { Z.spawnReward("waffe", x, y, { drop: true, rar: [0, 10, 55, 35] }); Z.spawnReward("glut", x, y, { n: 2 + Math.ceil(tier / 2) }); runeDrop(x - 14, y, 2); if (Z.R() < 0.5) Z.spawnReward("heil", x + 14, y, { drop: true }); }, 600);
    banner({ kind: "mini", head: L(["Mini-Boss besiegt", "Mini-boss defeated"]), seal: "♛", name: L(D.n), sub: L(D.title), lines: [], life: 3.4 });
    const m = M(); if (m.miniboss && m.miniboss[D.id]) { m.miniboss[D.id].won++; saveSoon(); }
    if (Z.stats) Z.stats.nmMini = (Z.stats.nmMini || 0) + 1;
  }
  function mbTick(dt) {
    const P = Z.player; if (!P) return;
    for (let i = mbLive.length - 1; i >= 0; i--) {
      const e = mbLive[i];
      if (e.dead || !inLv(e)) { mbLive.splice(i, 1); continue; }
      const cx = e.x + e.w / 2, cy = e.y + e.h / 2, d = distP(cx, cy);
      if (!e.nmIntro) {
        if (!e.nmOmen && d < 470 && !P.dead) { e.nmOmen = true; overHead(L(Z.R.pick([["Etwas Großes atmet in der Nähe …", "Something big is breathing nearby…"], ["Der Boden zittert unter schweren Schritten.", "The floor trembles under heavy steps."], ["Knochen. Viele Knochen. Hier wohnt jemand.", "Bones. Lots of bones. Someone lives here."]])), "#e8c890", 2.8); A.play(e.def.snd || "roar", { x: cx, vol: 0.25, rate: 0.7 }); }
        if (!P.dead && (e.aware || d < 210 && W.los(cx, e.y + 6, P.x + P.w / 2, P.y + 8))) mbIntro(e);
        continue;
      }
      if (d < 460) e.aware = true;
      if (e.nmP === 1 && e.hp < e.hpMax * 0.5) mbPhase2(e);
      /* W9: Angriffsfenster nach schweren Angriffen (a.open), Wut unter 25 % */
      if (e.openT > 0) { e.openT -= dt; if (e.openT <= 0 || !(e.st.stun > 0)) e.openT = 0; }
      /* Dauer-Rückstoß (jeder Treffer = 0,18 s Taumeln) sperrte die KI ganz – nach 1,4 s Sperre wird er standhaft */
      const locked = (e.kbT > 0 || e.stagger > 0 || e.st.stun > 0) && !(e.openT > 0);
      e.nmLock = Math.max(0, (e.nmLock || 0) + (locked ? dt : -dt * 0.6));
      if (e.nmLock > 1.4 && !(e.nmGuardT > 0)) { e.nmLock = 0; e.nmGuardT = 3; wtext(e.x + e.w / 2, e.y - 20, L(["Standhaft!", "Steadfast!"]), { col: "#ffb070", size: 8, life: 1.2 }); FX.ring(e.x + e.w / 2, e.y + e.h / 2, 16 + e.w * 0.5, "#ffb070", 0.35, 2); A.play("block", { x: e.x, vol: 0.5 }); e.cd = Math.min(e.cd || 0, 0.15); }
      if (e.nmGuardT > 0) { e.nmGuardT -= dt; if (!(e.openT > 0)) { e.st.stun = 0; e.stagger = 0; e.kbT = 0; } if (Math.random() < dt * 12) FX.p({ x: e.x + Math.random() * e.w, y: e.y + Math.random() * e.h, vx: 0, vy: -30, life: 0.35, size: 1.6, col: "#ffb070", kind: "glow", add: true }); }
      const pa = e._mbAct;
      if (pa && pa !== e.act && pa.phase === "post" && pa.a && pa.a.open && !e.dead) mbOpen(e, pa.a.open);
      /* W9: lange Abklingzeiten (Beschwören 8–10 s, Würfe 4–6 s) gelten nur für den Angriff selbst – e.cd ist die allgemeine Pause;
         vorher griffen Mini-Bosse danach 4–12 s gar nicht an. Der Angriff ruht für seine Abklingzeit, die Pause wird höchstens ~1,3 s. */
      if (pa && pa !== e.act && pa.a && (pa.a.cd || 0) > 2.5 && !e.dead) {
        const nm = pa.a.name, sa = e.def.atks.filter(x => x === pa.a || (nm && x.name === nm));
        e.cd = Math.min(e.cd, 0.8 + Math.random() * 0.5);
        if (sa.length) { (e.nmRest = e.nmRest || []).push({ t: pa.a.cd * (e.wut ? 0.8 : 1), atks: sa }); e.def = Object.assign({}, e.def, { atks: e.def.atks.filter(x => !sa.includes(x)) }); }
      }
      if (e.nmRest && e.nmRest.length) {
        for (const r of e.nmRest) r.t -= dt;
        const back = e.nmRest.filter(r => r.t <= 0); e.nmRest = e.nmRest.filter(r => r.t > 0);
        for (const r of back) { const add = r.atks.filter(x => !e.def.atks.some(y => y === x || (x.name && y.name === x.name))); if (add.length) e.def = Object.assign({}, e.def, { atks: e.def.atks.concat(add) }); }
      }
      e._mbAct = e.act;
      if (!e.wut && e.hp > 0 && e.hp < e.hpMax * 0.25) mbWut(e);
    }
  }
  function mbDraw(c, t) {
    for (const e of mbLive) {
      if (e.dead || !e.act || !e.act.a) continue;
      const ac = e.act, nm = ac.a.nm;
      if ((nm === "wuehlen" || nm === "faden") && ac.phase === "act" && ac.mk && !ac.up && !ac.down) {
        const mk = ac.mk, lock = mk.lock, r = nm === "faden" ? 26 : 22;
        c.save(); c.globalAlpha = lock ? 0.75 : 0.45; ell(c, mk.x, mk.y - 0.6, r * (lock ? 1 : 0.7), 2.2, "#120808"); c.restore();
        if (nm === "wuehlen") { c.strokeStyle = lock ? "#ffb070" : "#3a2a1a"; c.lineWidth = 0.8; c.beginPath(); for (let i = 0; i < 5; i++) { const a = i / 5 * PI; c.moveTo(mk.x, mk.y - 1); c.lineTo(mk.x + Math.cos(a) * r * 0.9 * (lock ? 1 : 0.6), mk.y - 1 - Math.sin(a) * 3); } c.stroke(); }
        else { const top = Z.cam.y - 10, sy0 = U.lerp(top, mk.y - 60, Math.min(1, ac.t / 1.4)); c.strokeStyle = "rgba(232,224,232,.8)"; c.lineWidth = 0.6; c.beginPath(); c.moveTo(mk.x, top); c.lineTo(mk.x, sy0); c.stroke(); ell(c, mk.x, sy0 + 4, 4, 5, "#2a1a1a"); for (let i = 0; i < 4; i++) for (const s of [-1, 1]) limb(c, mk.x, sy0 + 3, mk.x + s * (4 + i), sy0 + 1 + i * 2, 0.6, "#2a1a1a"); }
        if (lock && Math.sin(t * 24) > 0) { c.save(); c.globalCompositeOperation = "lighter"; c.strokeStyle = "rgba(255,80,40,.8)"; c.lineWidth = 1; c.beginPath(); c.ellipse(mk.x, mk.y - 0.6, r + 2, 3, 0, 0, TAU); c.stroke(); c.restore(); }
      }
      if (nm === "anker") {
        const hx = e.x + e.w / 2 + (e.face || 1) * 2, hy = e.y + e.h * 0.4;
        if (ac.phase === "pre") { c.save(); c.globalAlpha = 0.35 + 0.4 * Math.min(1, ac.t / (ac.a.pre || 0.6)); c.strokeStyle = "#ff6a3a"; c.setLineDash([3, 3]); c.lineWidth = 0.8; c.beginPath(); c.moveTo(hx, e.y + e.h * 0.5); c.lineTo(hx + (e.face || 1) * 175, e.y + e.h * 0.5); c.stroke(); c.restore(); }
        if (ac.phase === "act" && ac.anc) { const a = ac.anc; c.strokeStyle = "#6a6a70"; c.lineWidth = 0.8; c.beginPath(); c.moveTo(hx, hy); c.lineTo(a.x, a.y); c.stroke(); for (let i = 1; i < 6; i++) circ(c, U.lerp(hx, a.x, i / 6), U.lerp(hy, a.y, i / 6), 0.8, "#7a7a80"); drawAnchor(c, a.x, a.y - 4, x => x, t * 14 * (a.out ? 1 : -1)); }
      }
    }
  }
  function mbLoad(lv) {
    MBS = null;
    const run = Z.run; if (!run || !normalLevel(lv)) return;
    run.mbSince = run.mbSince == null ? 1 : run.mbSince + 1; run.mbSeen = run.mbSeen || [];
    let id = MB.forceNext || null; MB.forceNext = null;
    if (!id) {
      if (routeN() <= 1) return;
      /* W6-Balancing: gemessen ~1 Mini-Boss je 3–4 Gebiete (Ziel 1 je 2) – vorher 0,7 / 0,42 / 0,15, Ereignis-Abschlag ×0,5 */
      let p = run.mbSince >= 3 ? 0.9 : run.mbSince >= 2 ? 0.65 : 0.35;
      if (EVS) p *= 0.75; if (live.length) p *= 0.7;
      if (Z.R() > p) return;
      const l = Object.keys(MBD).filter(k => MBD[k].areas.includes(lv.biome) && !run.mbSeen.includes(k));
      if (!l.length) return; id = Z.R.pick(l);
    }
    const R = Z.Rng(((lv.seed || 3) * 6151 + id.length * 31) >>> 0);
    /* bevorzugt die Schatzkammer, sonst ein tiefer Nebenzweig, notfalls ein Raum am Hauptweg */
    let cell = null, vault = false;
    const vs = (lv.secretsList || []).find(s => s.k === "vault"), vc = vs && lv.cells[vs.cell];
    if (vc && R() < 0.55 && spotsIn(lv, vc, 3).length >= 8) { cell = vc; vault = true; }
    if (!cell) { const side = R.shuffle(cellsOf(lv).filter(c => c.kind === "side" && (c.depth || 0) >= 1 && !(EVS && EVS.cell === c) && spotsIn(lv, c, 3).length >= 10)); cell = side[0] || pickCell(lv, R, 12); }
    if (!cell) return;
    const sp = spotsIn(lv, cell, 3), [cx] = cellCenter(cell); sp.sort((a, b) => Math.abs(sx(a) - cx) - Math.abs(sx(b) - cx));
    const e = MB.spawn(id, sx(sp[0]), sy(sp[0]), { cell }); if (!e) return;
    e.spawnT = 0; e.nmVault = vault;
    MBS = { id, cell, e, vault };
    run.mbSince = 0; run.mbSeen.push(id);
  }
  MODS.push({
    load: mbLoad,
    leave: () => { for (const e of mbLive) if (e.nmSealed && e.nmSealed.length) unsealTiles(e.nmSealed); mbLive.length = 0; MBS = null; },
    tick: mbTick,
    draw: (c, t) => { mbDraw(c, t); for (const e of mbLive) if (e.nmSealed && e.nmSealed.length && !e.dead) drawSeal(c, e.nmSealed, t, "220,140,40"); },
    kill: e => { if (e.nmMini) mbDeath(e); }
  });
  MB.list = () => Object.keys(MBD).map(k => ({ id: k, n: L(MBD[k].n), areas: MBD[k].areas }));
  MB.state = () => (MBS ? { id: MBS.id, cell: [MBS.cell.x, MBS.cell.y], vault: MBS.vault, alive: !MBS.e.dead } : null);
  MB.live = () => mbLive;
  /* Z.miniboss.force(id) – Wächter vor Ezekiel erscheinen lassen (ohne Siegel) */
  MB.force = function (id, o) {
    o = o || {}; const lv = Z.level, P = Z.player; if (!normalLevel(lv) || !P) return null;
    id = MBD[id] ? id : MB.pickFor(lv.biome) || Object.keys(MBD)[0];
    const x = P.x + P.w / 2 + (P.face || 1) * (o.dist || 120), gy = W.groundBelow(x, P.y - 20, 200);
    const e = MB.spawn(id, x, gy != null ? gy : P.y + P.h, { noSeal: true }); if (!e) return null;
    e.spawnT = 0.3; if (o.intro !== false) mbIntro(e);
    if (o.p2) { e.hp = Math.round(e.hpMax * 0.49); mbPhase2(e); }
    return e;
  };
  /* ======================= 8. STECKBRIEF-BRETT ======================= */
  /* Im Lager über Z.lager.wanted(list, { open }) – sonst (und zusätzlich unterwegs) ein Knopf im Pausenmenü.
     Ein Nemesis kann zum Ziel erklärt werden („Jagd ansetzen“): er taucht eher auf, sein Kopfgeld steigt um die Hälfte. */
  const PORT = new Map();
  function portraitOf(rec) {
    const key = rec.type + "|" + rec.rank + "|" + (rec.trophy ? rec.trophy.id : "") + "|" + rec.scars + "|" + (rec.burnt ? 1 : 0);
    let p = PORT.get(key);
    if (!p) {
      const cv = portrait(rec.type, { nm: rec, w: 44, h: 46, S: 3, bg: "#2a1e1a" });
      p = { cv, url: null }; PORT.set(key, p); if (PORT.size > 40) PORT.delete(PORT.keys().next().value);
    }
    return p;
  }
  const portURL = rec => { const p = portraitOf(rec); if (!p.url && p.cv) { try { p.url = p.cv.toDataURL(); } catch (_) { p.url = ""; } } return p.url; };
  function wantedList() {
    const s = S0(), out = [];
    for (const r of active().sort((a, b) => b.rank - a.rank || b.kills - a.kills)) out.push({
      id: "nm" + r.id, n: [r.name[0] + " " + r.ep[0], r.name[1] + " " + r.ep[1]], level: r.rank, col: RANKCOL[r.rank],
      title: [RANK[r.rank][0] + (s.target === r.id ? " · Ziel" : ""), RANK[r.rank][1] + (s.target === r.id ? " · target" : "")],
      reward: bountyOf(r) + " ◆", defeated: false,
      draw: (c, x, y, w, h) => { const p = portraitOf(r); if (p.cv) c.drawImage(p.cv, x - w / 2, y - h / 2 - h * 0.15, w, h * 1.3); }
    });
    if (HS().active) { const H = hunterNow(); out.push({ id: "jaeger", n: H.n, title: H.ep, col: "#9a6a2a", reward: H.sum + " ●", level: (HS().lvl | 0) + 1, defeated: false }); }
    for (const f of s.fallen.slice(0, 2)) if (out.length < 6) out.push({ id: "nmx" + f.id, n: [f.name[0] + " " + f.ep[0], f.name[1] + " " + f.ep[1]], title: f.end || ["besiegt", "defeated"], col: "#5a4a4a", defeated: true, level: f.rank });
    return out.slice(0, 6);
  }
  function refreshWanted() { try { if (Z.lager && typeof Z.lager.wanted === "function") Z.lager.wanted(wantedList(), { open: openBoard }); } catch (err) { console.error(err); } }
  NM.refreshWanted = refreshWanted;
  const TXT = {
    meet: ["traf dich", "met you"], kill: ["tötete dich", "killed you"], wound: ["verwundete dich schwer", "wounded you badly"], "return": ["kehrte mit Narben zurück", "returned with scars"],
    macht: ["gewann einen Machtkampf", "won a power struggle"], aufstieg: ["stieg im Schatten auf", "rose in the shadows"], vakuum: ["füllte ein Machtvakuum", "filled a power vacuum"]
  };
  function recCard(r, s, first) {
    const tr = r.traits.map(t => '<span class="nm-st">▲ ' + esc(L(TRAIT[t].n)) + "</span>").join("");
    const wk = r.weak.map(w => r.known.includes(w) ? '<span class="nm-sw" title="' + esc(L(WEAK[w].d)) + '">▼ ' + esc(L(WEAK[w].n)) + "</span>" : '<span class="nm-sw unk">▼ ???</span>').join("");
    const h = r.hist.filter(x => x.k !== "meet").slice(-3).reverse().map(x => esc(L(TXT[x.k] || [x.k, x.k])) + (x.area ? " " + esc(areaIn(x.area)) : "")).join(" · ");
    const url = portURL(r), tgt = s.target === r.id;
    return '<div class="nm-karte' + (tgt ? " ziel" : "") + '" style="display:flex;gap:.7em;align-items:flex-start;margin:.45em 0;padding:.5em .6em;border:1px solid ' + RANKCOL[r.rank] + ';border-radius:6px;background:rgba(40,14,14,.5)">' +
      (url ? '<img src="' + url + '" alt="" style="width:66px;height:69px;image-rendering:auto;border:1px solid #6a4a2a;border-radius:3px;background:#2a1e1a;flex:none">' : "") +
      '<div style="flex:1;min-width:0"><b style="color:#ffc8a0">' + esc(L(r.name)) + '</b> <i style="color:#e8b090">' + esc(L(r.ep)) + "</i><br><small>" + "◆".repeat(r.rank) + "◇".repeat(5 - r.rank) + " " + esc(L(RANK[r.rank])) + " · " + esc(typeName(r)) +
      " · " + L(["Siege über dich: ", "Wins over you: "]) + r.kills + (r.returns ? " · " + L(["Rückkehr: ", "Returns: "]) + r.returns : "") + "</small>" +
      '<div style="margin:.25em 0;font-size:.85em;line-height:1.5">' + tr + " " + wk + "</div>" +
      (r.trophy ? '<small style="color:#e0a070">' + L(["Trägt deine Waffe: ", "Carries your weapon: "]) + esc(L(r.trophy.n)) + "</small><br>" : "") +
      (h ? '<small style="opacity:.8">' + h + "</small><br>" : "") +
      '<small style="color:#ffd27a">' + L(["Kopfgeld: ", "Bounty: "]) + bountyOf(r) + L([" Seelensplitter", " soul shards"]) + "</small></div>" +
      '<button data-act="nmZiel" data-arg="' + r.id + '" style="flex:none"' + (first ? " autofocus" : "") + ">" + (tgt ? L(["Ziel ✓", "Target ✓"]) : L(["Jagd ansetzen", "Mark for hunt"])) + "</button></div>";
  }
  function openBoard() {
    const ui = Z.ui; if (!ui || !ui.open) return;
    const s = S0(), act = active().sort((a, b) => b.rank - a.rank || b.kills - a.kills);
    let h = "<h2>" + L(["Steckbriefe · Nemesis", "Wanted · Nemeses"]) + "</h2>";
    if (!act.length) h += '<p class="hinweis">' + L(["Noch hat sich niemand in der Feste einen Namen bei dir gemacht. Wer dich tötet – oder dir schwer zusetzt und davonkommt –, steigt hier auf.", "Nobody in the keep has made a name for themselves with you yet. Whoever kills you – or hurts you badly and gets away – will rise here."]) + "</p>";
    else h += '<p class="hinweis">' + L(["Schwächen werden bekannt, wenn du sie im Kampf entdeckst, einem Nemesis wiederbegegnest oder Gerüchte hörst. Ein markiertes Ziel taucht eher auf und bringt anderthalbfaches Kopfgeld.", "Weaknesses become known when you discover them in battle, meet a nemesis again or hear rumours. A marked target turns up more often and pays one and a half times the bounty."]) + "</p>" + act.map((r, i) => recCard(r, s, i === 0)).join("");
    const H = HS();
    if (H.active || H.beaten || H.kills) { const hn = hunterNow(); h += "<h3>" + L(["Der Kopfgeldjäger", "The bounty hunter"]) + "</h3><p><b>" + esc(L(hn.n)) + "</b> <i>" + esc(L(hn.ep)) + "</i> – " + (H.active ? L(["ist dir auf der Spur. Dein Kopf: ", "is on your trail. Your head: "]) + hn.sum + " ●" : L(["wartet noch auf einen Auftrag.", "is still waiting for a contract."])) + "<br><small>" + L(["Erlegte Jäger: ", "Hunters slain: "]) + (H.beaten | 0) + " · " + L(["Er hat dich erwischt: ", "Caught you: "]) + (H.kills | 0) + "</small></p>"; }
    if (s.news.length) h += "<h3>" + L(["Gerüchte aus der Feste", "Rumours from the keep"]) + '</h3><ul style="margin:.2em 0 .6em 1.1em;padding:0;font-size:.9em">' + s.news.slice(0, 6).map(n => "<li>" + esc(L(n.txt)) + "</li>").join("") + "</ul>";
    if (s.fallen.length) h += "<h3>" + L(["Gefallene", "The fallen"]) + '</h3><p style="font-size:.85em;opacity:.85">' + s.fallen.slice(0, 6).map(f => "<s>" + esc(L(f.name)) + "</s> " + esc(L(f.ep)) + " – " + esc(L(f.end || ["besiegt", "defeated"]))).join("<br>") + "</p>";
    h += '<div class="knoepfe"><button data-act="close"' + (act.length ? "" : " autofocus") + ">" + L(["Zurück", "Back"]) + "</button></div>";
    ui.open(h, { cls: "breit" });
    try { const m = document.querySelector("#modal .mbox, #modal"); if (m) m.scrollTop = 0; const sc = document.querySelector("#modal .nm-karte"); if (sc && sc.parentElement) sc.parentElement.scrollTop = 0; } catch (_) {}
  }
  NM.openBoard = openBoard;
  NM.wireBoard = function () {
    const ui = Z.ui;
    if (ui.actions && !ui.actions.nmZiel) {
      ui.actions.nmZiel = arg => { const s = S0(), id = +arg; s.target = s.target === id ? null : id; Z.saveMeta(); refreshWanted(); openBoard(); };
      ui.actions.nmBoard = () => { if (ui.close) ui.close(); openBoard(); };
    }
    if (typeof ui.pause === "function" && !ui.pause._nm) {
      const p0 = ui.pause;
      ui.pause = function () {
        const r = p0.apply(this, arguments);
        try {
          const n = active().length;
          if (n || HS().active) { const box = document.querySelector("#modal .knoepfe.senk"); if (box && !box.querySelector('[data-act="nmBoard"]')) { const b = document.createElement("button"); b.dataset.act = "nmBoard"; b.textContent = L(["Steckbriefe", "Wanted"]) + (n ? " (" + n + ")" : ""); const ab = box.querySelector('[data-act="abort"]'); box.insertBefore(b, ab || null); } }
        } catch (err) { console.error(err); }
        return r;
      };
      ui.pause._nm = true;
    }
    refreshWanted();
  };

  /* ======================= 9. VERKABELUNG ======================= */
  /* Teilmodule melden sich hier an: { load(lv), leave(), tick(dt), draw(c,t), after(c,cam,t), screen(c,W,H), hit(e,dmg,o), hitAfter(e,res,o), kill(e,o) } */
  const load0 = Z.loadArea;
  Z.loadArea = function (id) {
    try { woundCheck(); } catch (err) { console.error(err); }
    for (const m of MODS) if (m.leave) { try { m.leave(); } catch (err) { console.error(err); } }
    SAY.length = 0; WT.length = 0; BAN = null; pan = null; lastHit = null;
    const r = load0.apply(this, arguments);
    const lv = Z.level;
    try { if (Z.run && !lv.hub) preload(); setupArea(lv); } catch (err) { console.error(err); }
    for (const m of MODS) if (m.load) { try { m.load(lv); } catch (err) { console.error(err); } }
    if (lv && lv.hub && NM.refreshWanted) NM.refreshWanted();
    return r;
  };
  (Z.rueckHooks = Z.rueckHooks || []).push({ id: "nemesis", save: () => ({ live, KGS, EVS, MBS, tr: TRAPS.slice(), mk: MARKS.slice(), ro: ROCKS.slice(), gh: GH.slice(), mb: mbLive.slice() }), load: s => { const put = (a, v) => { a.length = 0; for (const x of v) a.push(x); }; live = s.live; KGS = s.KGS; EVS = s.EVS; MBS = s.MBS; put(TRAPS, s.tr); put(MARKS, s.mk); put(ROCKS, s.ro); put(GH, s.gh); put(mbLive, s.mb); SAY.length = 0; WT.length = 0; BAN = null; pan = null; lastHit = null; } }); /* W14 Rückweg-Gnade (rueckweg.js): Gebietszustand merken/einsetzen */
  const newRun0 = Z.newRun;
  Z.newRun = function () {
    const r = newRun0.apply(this, arguments);
    try { shadowWar(); } catch (err) { console.error(err); }
    for (const m of MODS) if (m.run) { try { m.run(Z.run); } catch (err) { console.error(err); } }
    return r;
  };
  const tick0 = Z.ebenenTick;
  Z.ebenenTick = function (dt) {
    if (tick0) tick0(dt);
    NM._frame();
    if (!Z.level) return;
    for (const s of SAY) s.t += dt; for (let i = SAY.length - 1; i >= 0; i--) if (SAY[i].t > SAY[i].life) SAY.splice(i, 1);
    for (const w of WT) w.t += dt; for (let i = WT.length - 1; i >= 0; i--) if (WT[i].t > WT[i].life) WT.splice(i, 1);
    if (BAN) { BAN.t += dt; if (BAN.t > BAN.life) BAN = null; }
    panTick(dt);
    if (saveT > 0) { saveT -= dt; if (saveT <= 0) Z.saveMeta(); }
    try { nemTick(dt); } catch (err) { console.error(err); }
    for (const m of MODS) if (m.tick) { try { m.tick(dt); } catch (err) { console.error(err); } }
  };
  const hitE0 = Z.hitEnemy;
  Z.hitEnemy = function (e, dmg, o) {
    o = o || {};
    if (e && !e.dead) {
      if (e.nm) { const r = modDamage(e, dmg, o); if (r === null) return 0; dmg = r; }
      for (const m of MODS) if (m.hit) { const r = m.hit(e, dmg, o); if (r === null) return 0; if (typeof r === "number") dmg = r; }
    }
    const res = hitE0.call(this, e, dmg, o);
    if (e && res > 0) {
      if (e.nm) afterHit(e, res, o);
      for (const m of MODS) if (m.hitAfter) { try { m.hitAfter(e, res, o); } catch (err) { console.error(err); } }
    }
    return res;
  };
  const kill1 = Z.killEnemy;
  Z.killEnemy = function (e, o) {
    const was = !e || e.dead;
    for (const m of MODS) if (!was && m.preKill) { try { if (m.preKill(e, o || {}) === false) return; } catch (err) { console.error(err); } }
    const r = kill1.apply(this, arguments);
    if (!was && e.dead) {
      for (let i = SAY.length - 1; i >= 0; i--) if (SAY[i].ent === e) SAY.splice(i, 1);
      if (e.nm) { try { onNemDeath(e, o || {}); } catch (err) { console.error(err); } }
      for (const m of MODS) if (m.kill) { try { m.kill(e, o || {}); } catch (err) { console.error(err); } }
    }
    return r;
  };
  const death1 = Z.onPlayerDeath;
  Z.onPlayerDeath = function (o) {
    if (Z.player && !Z.player.dead) { try { onDeath(o); } catch (err) { console.error(err); } }
    return death1.apply(this, arguments);
  };
  const de0 = Z.drawEnemy;
  Z.drawEnemy = function (c, e, t) {
    de0.apply(this, arguments);
    if (e.nm) { try { drawDeco(c, e, t); } catch (err) { console.error(err); } }
    for (const m of MODS) if (m.deco && (e.nmMini || e.nmHunter || e.nmEvent)) { try { m.deco(c, e, t); } catch (err) { console.error(err); } }
  };
  const dwp0 = Z.drawWorldProps;
  Z.drawWorldProps = function (c, t) {
    if (dwp0) dwp0.apply(this, arguments);
    for (const m of MODS) if (m.draw) { try { m.draw(c, t); } catch (err) { console.error(err); } }
  };
  const al0 = Z.drawAfterLight;
  Z.drawAfterLight = function (c, cam, Wd, Hd, t) {
    if (al0) al0.apply(this, arguments);
    for (const m of MODS) if (m.after) { try { c.save(); m.after(c, cam, t); } catch (err) { console.error(err); } finally { c.restore(); } }
    try { drawWT(c); drawSay(c); } catch (err) { console.error(err); }
    for (const m of MODS) if (m.screen) { try { c.save(); c.setTransform(1, 0, 0, 1, 0, 0); m.screen(c, Wd, Hd, t); } catch (err) { console.error(err); } finally { c.restore(); } }
    try { drawBanner(c, Wd, Hd); } catch (err) { console.error(err); }
  };

  /* ---------- Todesbildschirm: wer ist aufgestiegen? ---------- */
  function deathBlock() {
    const n = deathNote; if (!n) return "";
    if (n.hunter) return '<div class="nemesis-tod" style="margin:.6em 0;padding:.5em .8em;border:1px solid #9a6a2a;background:rgba(50,30,10,.55);border-radius:6px;text-align:center"><b style="color:#ffc070">◎ ' + esc(L(n.look.n) + " " + L(n.look.ep)) + "</b><br>" + esc(L(["kassiert das Kopfgeld. Er wird wieder kommen – teurer.", "collects the bounty. He'll be back – pricier."])) + "</div>";
    const r = n.rec;
    const head = n.fresh ? L(["ist zum Nemesis aufgestiegen", "has risen as a nemesis"]) : n.up ? L(["steigt auf zum ", "rises to "]) + L(RANK[r.rank]) : L(["triumphiert erneut", "triumphs again"]);
    const extra = n.lesson ? "<br><small>" + esc(L(["Hat gelernt: ", "Learned: "]) + L(TRAIT[n.lesson].n)) + "</small>" : r.trophy && n.fresh ? "<br><small>" + esc(L(["Nimmt als Trophäe: ", "Takes as a trophy: "]) + L(r.trophy.n)) + "</small>" : "";
    return '<div class="nemesis-tod" style="margin:.6em 0;padding:.5em .8em;border:1px solid #8a1414;background:rgba(60,8,12,.55);border-radius:6px;text-align:center"><b style="color:#ff8a6a">☠ ' + esc(fullName(r)) + "</b><br>" + esc(head) + extra + "</div>";
  }
  function wireUI() {
    if (!Z.ui || !Z.ui.deathScreen || !Z.ui.actions) return setTimeout(wireUI, 60);
    const ds0 = Z.ui.deathScreen;
    Z.ui.deathScreen = function (o) {
      const r = ds0.apply(this, arguments);
      try { const h = deathBlock(); if (h && !(o && o.abort)) { const m = document.querySelector("#modal h2"); if (m) m.insertAdjacentHTML("afterend", h); } } catch (err) { console.error(err); }
      deathNote = null; return r;
    };
    if (NM.wireBoard) NM.wireBoard();
  }
  wireUI();

  /* ---------- Prüfhilfen ---------- */
  NM.list = () => active().map(r => ({ id: r.id, name: fullName(r), type: r.type, rank: r.rank, traits: r.traits, weak: r.weak, known: r.known, kills: r.kills, wins: r.wins, returns: r.returns, home: r.home }));
  /* Z.nemesis.force("goblin") – einen Nemesis dieser Art erschaffen und sofort hier auftreten lassen */
  NM.force = function (type, o) {
    o = o || {}; type = type && Z.ENEMIES[type] ? type : "goblin";
    const P = Z.player, lv = Z.level; if (!P || !normalLevel(lv)) return null;
    const fake = { id: type, def: Z.ENEMIES[type] };
    const rec = create(fake, o.kind || "klinge", o.why || "kill");
    if (o.rank) rec.rank = U.clamp(o.rank, 1, 5);
    if (o.traits) rec.traits = o.traits.slice(); if (o.weak) rec.weak = o.weak.slice();
    if (!o.trophy) rec.trophy = rec.trophy || makeTrophy();
    const x = P.x + P.w / 2 + P.face * (o.dist || 130), gy = W.groundBelow(x, P.y - 20, 200);
    const e = spawnRec(rec, lv, { x, y: gy != null ? gy : P.y + P.h });
    return e;
  };
  NM.forceArea = id => { NM.forceNext = true; };
  NM.intro = e => intro(e);
  NM.banner = banner; NM.say = say; NM.wtext = wtext; NM.motif = motif; NM.camPan = camPan;
  NM.wipe = () => { const m = M(); m.nemesis = null; S0(); Z.saveMeta(); };
  NM.live = () => live;
  NM.deathNote = () => deathNote;
  NM.lastHit = () => lastHit;
})();
