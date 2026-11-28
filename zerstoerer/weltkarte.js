/* Ezekiel – The Destroyer · Weltkarte im Lager (W21)
   Ein Kartentisch im Lager (neben dem Gedenkstein) öffnet Eddas Karte der Feste: alle Gebiete als verbundener Graph nach Stufen
   (links → rechts) und Wegen (oben „höher“, Mitte „hindurch“, unten „tiefer“). Besuchte Gebiete farbig mit Symbol,
   gesehene (als Ausgang bekannt) als Umriss, unbekannte als „?“. Wege zwischen den Gebieten, besiegte Bosse/Wächter, gefundene Enden,
   Statistik je Gebiet (Besuche, Tode, Kills, schnellste Ankunft, schnellste Durchquerung) und die Route des letzten Laufs als rote Linie.
   Bedienung: Maus (Knoten anklicken/überfahren), Tastatur und Controller (Richtungen springen von Knoten zu Knoten, B/Esc schließt) –
   die Knoten sind Knöpfe im Fenster, die räumliche Menü-Navigation (ui.js moveDir) greift also von selbst.
   Speicher: Z.meta.weltkarte (je Spielstand, W19) = { g:{ id:{ b:Besuche, t:Tode, k:Kills, an:schnellste Ankunft s, du:schnellste Durchquerung s, s:gesehen } },
   w:{ "a>b":Anzahl }, last:{ r:[Route], e:"tod"|"sieg"|"abbruch", k:Ende, t:Dauer s, area }, runs, gesehen }. Nichts direkt in localStorage.
   Für ältere Stände liest die Karte zusätzlich vorhandene Daten: Erfolgszähler achZ.bio (betretene Gebiete), meta.bosses (Wächter/Bosse
   gesehen/besiegt), meta.endings, meta.gebiet (höchstes Gebiet), Bestiarium meta.seen (Gegner, die nur in einem Gebiet leben).
   Schnittstelle: Z.weltkarte = { open(), draw(canvas, opts), state(), meta(), ort(), fmt(s), ROW, IDS }.
   Farbregel: Pergament, Tinte, Rost, Gold, Rot, Grün, Violett – kein Blau. Grafikstufe 0 (Handheld): ohne Papierkorn und Kompassrose. */
(function () {
  "use strict";
  const Z = window.Z, T = Z.TILE, A = Z.audio, L = v => Z.L(v), inp = Z.input;
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const lo = () => !!(Z.gq && Z.gq.level === 0);
  const TAU = Math.PI * 2;
  const rausch = () => !!(Z.run && Z.run.w21rausch); /* Bossrausch (bossrausch.js) schreibt nichts in die Karte */

  /* ======================= Gebiete, Wege, Stufen ======================= */
  /* Zeile: 0 höher, 1 hindurch, 2 tiefer */
  const ROW = { lager: 1, torhof: 1, keller: 2, hallen: 1, wehrgang: 0, verlies: 2, hafen: 1, glocken: 0, labor: 2, erzpriesterin: 1, wachturm: 0,
    schlund: 2, schmiede: 1, zinnen: 0, see: 2, glut: 1, sturm: 0, demogorgon: 2, themberchaud: 1, venomfang: 0, herz: 1, stollen: 1.5 /* W49 Kapitel: zwischen Glutgassen und See */ };
  const IDS = Object.keys(ROW).filter(id => id === "lager" || Z.BIOMES[id] || Z.ARENAS[id]);
  const AREAS = IDS.filter(id => id !== "lager");
  const def = id => Z.BIOMES[id] || Z.ARENAS[id] || null;
  const tierOf = id => (id === "lager" ? -1 : (def(id) || {}).tier || 0);
  const bossOf = id => (Z.BIOMES[id] && Z.BIOMES[id].warden) || (Z.ARENAS[id] && Z.ARENAS[id].boss) || null;
  const finalOf = id => (Z.ARENAS[id] && Z.ARENAS[id].final) || null;
  const FINALS = AREAS.filter(id => finalOf(id) && id !== "herz");
  function exitsOf(id) {
    if (id === "lager") return ["torhof"];
    const d = def(id); const ex = (d && d.exits ? d.exits : []).filter(x => ROW[x] != null);
    if (FINALS.includes(id) && ROW.herz != null && Z.ARENAS.herz) ex.push("herz"); /* der Riss im Netz nach einem Endboss */
    return ex;
  }
  const nameOf = id => (id === "lager" ? L(["Das Lager", "The Camp"]) : Z.areaName(id));
  const shortName = id => nameOf(id).replace(/^(Der|Die|Das|The)\s+/, "");
  const bossName = b => { const d = Z.BOSSDEF && Z.BOSSDEF[b]; return d && d.n ? L(d.n) : b; };
  const ENDN = { tiefe: ["Ende der Tiefe", "Ending of the Depths"], glut: ["Ende der Glut", "Ending of the Embers"], himmel: ["Ende des Himmels", "Ending of the Sky"], wahr: ["Das wahre Ende", "The True Ending"] };
  const WEG = [["Höher", "Higher"], ["Hindurch", "Through"], ["Tiefer", "Deeper"]];
  const ROMAN = ["0", "I", "II", "III", "IV", "V", "VI", "VII"];
  /* Farbe je Gebiet (Erd-, Rost-, Glut-, Moos- und Violetttöne) */
  const COL = { lager: "#8a5a2a", torhof: "#6b4a3a", keller: "#6a5032", hallen: "#7a3a2a", wehrgang: "#6a5e3a", verlies: "#4e3a46", hafen: "#4a5a34", glocken: "#8a6a24",
    labor: "#5a3a6a", erzpriesterin: "#7a2a3a", wachturm: "#5e4a2a", schlund: "#3e2a2a", schmiede: "#a0441a", zinnen: "#7a6a44", see: "#2e4a34", glut: "#b0381a",
    sturm: "#5a5a50", demogorgon: "#4a1a3a", themberchaud: "#8a2a10", venomfang: "#3e5a1a", herz: "#3a1a2e", stollen: "#4a3a52" /* W49 Kapitel */ };

  /* ======================= Speicher ======================= */
  function WK() {
    const m = Z.meta || (Z.meta = {});
    let w = m.weltkarte; if (!w || typeof w !== "object" || Array.isArray(w)) w = m.weltkarte = {};
    if (!w.g || typeof w.g !== "object") w.g = {};
    if (!w.w || typeof w.w !== "object") w.w = {};
    return w;
  }
  const G = id => { const g = WK().g; let r = g[id]; if (!r || typeof r !== "object") r = g[id] = { b: 0, t: 0, k: 0 }; return r; };
  const save = () => { try { Z.saveMeta && Z.saveMeta(); } catch (_) {} };
  const kills = () => (Z.stats && Z.stats.kills) || 0;

  /* ---------- mitschreiben ---------- */
  function RK(run) { return run._wk || (run._wk = { cur: null, t0: 0, k0: 0, last: null, vis: {}, edges: {}, neu: [], done: false, known0: Object.assign({}, state(true).vis) }); }
  function leave(run, ohneZeit) {
    const w = RK(run); if (!w.cur) return;
    const g = G(w.cur), du = Math.max(0, (run.time || 0) - w.t0);
    g.k = (g.k | 0) + Math.max(0, kills() - w.k0);
    if (!ohneZeit && !run.gnade && du > 1 && (!g.du || du < g.du)) g.du = Math.round(du * 10) / 10;
    w.cur = null;
  }
  function onArea(id, opts) {
    const run = Z.run; if (!run || rausch() || id === "lager") return;
    const w = RK(run);
    if (id === "passage") { leave(run); if (opts && opts.to && ROW[opts.to] != null) G(opts.to).s = 1; return; }
    if (ROW[id] == null) return;
    if (w.cur && w.cur !== id) leave(run);
    const from = w.last || "lager";
    if (from !== id && !w.edges[from + ">" + id]) { w.edges[from + ">" + id] = 1; const k = from + ">" + id; WK().w[k] = (WK().w[k] | 0) + 1; }
    const g = G(id);
    if (!w.vis[id]) {
      w.vis[id] = 1;
      if (!(g.b > 0) && !w.known0[id]) w.neu.push(id); /* vor diesem Lauf noch nie betreten */
      g.b = (g.b | 0) + 1;
      const t = run.time || 0;
      if (!run.gnade && (g.an == null || t < g.an)) g.an = Math.round(t * 10) / 10;
    }
    for (const x of exitsOf(id)) if (x !== "herz") G(x).s = 1;
    w.cur = id; w.last = id; w.t0 = run.time || 0; w.k0 = kills();
    save();
  }
  /* war das Gebiet schon vor der Karte bekannt (alte Stände)? */
  function finish(kind, key) {
    const run = Z.run; if (!run || rausch()) return;
    const w = RK(run); if (w.done) return; w.done = true;
    const area = w.cur || w.last || (run.route || [])[run.route.length - 1] || "torhof";
    if (kind === "tod" && ROW[area] != null) G(area).t = (G(area).t | 0) + 1;
    leave(run, kind !== "sieg"); /* gestorben/umgekehrt: keine Durchquerung */
    const m = WK();
    m.last = { r: (run.route || []).filter(x => ROW[x] != null), e: kind, k: key || null, t: Math.round(run.time || 0), area, neu: w.neu.slice(0, 12) };
    m.runs = (m.runs | 0) + 1;
    save();
  }

  /* Laufstart: bekannte Gebiete merken (streng: ohne meta.gebiet/letzte Route) – daran misst sich „neu entdeckt“ */
  const nr0 = Z.newRun;
  Z.newRun = function () { const r = nr0.apply(this, arguments); try { if (Z.run) { Z.run._wk = null; RK(Z.run); } } catch (e) { console.error("weltkarte", e); } return r; };
  const load0 = Z.loadArea;
  Z.loadArea = function (id, opts) {
    const r = load0.apply(this, arguments);
    try { const lv = Z.level; if (lv && lv.hub) placeCamp(lv); else { camp = null; onArea(id, opts); } } catch (e) { console.error("weltkarte", e); }
    return r;
  };
  const death0 = Z.onPlayerDeath;
  Z.onPlayerDeath = function () {
    const P = Z.player, was = !P || P.dead;
    const r = death0.apply(this, arguments);
    try { if (!was && Z.player && Z.player.dead) finish("tod"); } catch (e) { console.error("weltkarte", e); }
    return r;
  };
  function wireUI() {
    if (!Z.ui || !Z.ui.ending || !Z.ui.deathScreen) return setTimeout(wireUI, 50);
    const end0 = Z.ui.ending;
    Z.ui.ending = function (key) { try { if (!rausch()) finish("sieg", key); } catch (e) { console.error(e); } return end0.apply(this, arguments); };
    const ds0 = Z.ui.deathScreen;
    Z.ui.deathScreen = function (o) { try { if (o && o.abort && !rausch()) finish("abbruch"); } catch (e) { console.error(e); } return ds0.apply(this, arguments); };
    const back0 = Z.backToCamp;
    Z.backToCamp = function () { try { if (Z.run && !rausch() && Z.level && !Z.level.hub) finish(Z.player && Z.player.dead ? "tod" : "abbruch"); } catch (e) { console.error(e); } return back0.apply(this, arguments); };
  }
  wireUI();

  /* ======================= Zustand (eigene Daten + vorhandene Fortschrittsdaten) ======================= */
  let solo = null; /* Gegner → einziges Gebiet, in dem sie leben (Bestiarium als Hinweis auf Besuche) */
  function soloMap() {
    if (solo) return solo; solo = {};
    const where = {};
    for (const id in Z.BIOMES) for (const e in Z.BIOMES[id].foes || {}) (where[e] = where[e] || []).push(id);
    for (const e in where) if (where[e].length === 1) solo[e] = where[e][0];
    return solo;
  }
  function state(streng) {
    const M = Z.meta || {}, w = WK(), bio = (M.achZ && M.achZ.bio) || {}, B = M.bosses || {}, E = M.endings || {}, seenE = M.seen || {};
    const vis = {}, seen = {}, won = {}, bseen = {};
    for (const id of AREAS) {
      const g = w.g[id], b = bossOf(id), f = finalOf(id), br = b && B[b];
      if (br && br.won > 0) won[id] = br.won | 0;
      if (br && (br.seen > 0 || br.won > 0)) bseen[id] = 1;
      vis[id] = !!((g && g.b > 0) || bio[id] || bseen[id] || (f && E[f]));
    }
    vis.lager = true;
    if (!streng) {
      if ((M.runs | 0) > 0 && vis.torhof === false) vis.torhof = true;
      if (M.gebiet && ROW[M.gebiet.id] != null) vis[M.gebiet.id] = true;
      if (w.last && Array.isArray(w.last.r)) for (const id of w.last.r) if (ROW[id] != null) vis[id] = true;
    }
    const sm = soloMap(); for (const e in sm) if (seenE[e] && ROW[sm[e]] != null) vis[sm[e]] = true;
    const herzOk = !!(E.wahr || (M.bonus && M.bonus.riss) || vis.herz);
    for (const id of IDS) if (vis[id]) for (const x of exitsOf(id)) if (x !== "herz" || herzOk) seen[x] = true;
    for (const id of AREAS) if (w.g[id] && w.g[id].s && (id !== "herz" || herzOk)) seen[id] = true;
    for (const id of IDS) if (vis[id]) seen[id] = false;
    return { vis, seen, won, bseen, E, w, M };
  }

  /* ======================= Zeichnen ======================= */
  function layout(W, H, mini) {
    const padL = W * (mini ? 0.05 : 0.075), padR = W * (mini ? 0.05 : 0.035), top = H * (mini ? 0.16 : 0.22), bot = H * (mini ? 0.16 : 0.22);
    const cw = (W - padL - padR) / 8, rh = (H - top - bot) / 2;
    const R = Math.max(4, Math.min(cw * (mini ? 0.27 : 0.25), rh * (mini ? 0.3 : 0.27)));
    const pos = {};
    for (const id of IDS) pos[id] = { x: padL + (tierOf(id) + 1) * cw, y: top + ROW[id] * rh };
    return { pos, R, padL, padR, top, bot, cw, rh, W, H };
  }
  function rnd(seed) { let s = seed >>> 0 || 1; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
  const parchCache = new Map();
  function parchment(W, H, cheap) {
    const key = W + "x" + H + (cheap ? "c" : ""); let cv = parchCache.get(key); if (cv) return cv;
    if (parchCache.size > 6) parchCache.clear();
    cv = document.createElement("canvas"); cv.width = W; cv.height = H; const c = cv.getContext("2d"), R = rnd(W * 7 + H * 13);
    /* angesengter Rand: unregelmäßiges Vieleck */
    const pts = [], n = 44, m = Math.min(W, H) * 0.022;
    for (let i = 0; i < n; i++) { const t = i / n; let x, y; if (t < 0.25) { x = t * 4 * W; y = 0; } else if (t < 0.5) { x = W; y = (t - 0.25) * 4 * H; } else if (t < 0.75) { x = W - (t - 0.5) * 4 * W; y = H; } else { x = 0; y = H - (t - 0.75) * 4 * H; }
      const ix = x < W / 2 ? 1 : -1, iy = y < H / 2 ? 1 : -1; pts.push([x + ix * (m * 0.6 + R() * m), y + iy * (m * 0.6 + R() * m)]); }
    c.beginPath(); pts.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.closePath();
    const g = c.createRadialGradient(W * 0.5, H * 0.45, Math.min(W, H) * 0.1, W * 0.5, H * 0.5, Math.max(W, H) * 0.62);
    g.addColorStop(0, "#ecdcb4"); g.addColorStop(0.6, "#dcc596"); g.addColorStop(1, "#b38a54"); c.fillStyle = g; c.fill();
    c.save(); c.clip();
    /* Ränder dunkler, Flecken, Faltlinien */
    c.lineWidth = m * 2.2; c.strokeStyle = "rgba(90,52,20,.35)"; c.stroke();
    for (let i = 0; i < (cheap ? 3 : 9); i++) { const x = R() * W, y = R() * H, r = (0.04 + R() * 0.09) * Math.min(W, H); const sg = c.createRadialGradient(x, y, 0, x, y, r); sg.addColorStop(0, "rgba(120,80,30,.10)"); sg.addColorStop(1, "rgba(120,80,30,0)"); c.fillStyle = sg; c.fillRect(x - r, y - r, r * 2, r * 2); }
    c.strokeStyle = "rgba(110,76,40,.18)"; c.lineWidth = Math.max(1, W / 900);
    for (const fx of [W / 3, (W * 2) / 3]) { c.beginPath(); c.moveTo(fx, 0); c.lineTo(fx + (R() - 0.5) * 6, H); c.stroke(); }
    c.beginPath(); c.moveTo(0, H / 2); c.lineTo(W, H / 2 + (R() - 0.5) * 6); c.stroke();
    if (!cheap) { for (let i = 0; i < (W * H) / 900; i++) { c.fillStyle = R() < 0.5 ? "rgba(90,60,30,.10)" : "rgba(255,245,220,.10)"; c.fillRect(R() * W, R() * H, 1 + R() * 1.5, 1 + R() * 1.5); } }
    c.restore();
    c.beginPath(); pts.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.closePath();
    c.strokeStyle = "rgba(60,30,10,.75)"; c.lineWidth = Math.max(1.5, m * 0.35); c.stroke();
    parchCache.set(key, cv); return cv;
  }
  /* Symbol je Gebiet, Mittelpunkt (0,0), Radius r; mode "fill" (besucht) oder "line" (nur gesehen) */
  function glyph(c, id, r, mode) {
    const fillIt = () => (mode === "fill" ? c.fill() : c.stroke());
    const lw = Math.max(1, r * 0.13); c.lineWidth = lw; c.lineCap = "round"; c.lineJoin = "round";
    const P = (arr, close) => { c.beginPath(); for (let i = 0; i < arr.length; i += 2) (i ? c.lineTo(arr[i] * r, arr[i + 1] * r) : c.moveTo(arr[i] * r, arr[i + 1] * r)); if (close !== false) c.closePath(); };
    switch (id) {
      case "lager": P([-0.7, 0.5, 0, -0.65, 0.7, 0.5]); fillIt(); c.beginPath(); c.moveTo(0, -0.65 * r); c.lineTo(0, 0.5 * r); c.stroke(); break;
      case "torhof": P([-0.6, 0.6, -0.6, -0.2, 0, -0.65, 0.6, -0.2, 0.6, 0.6]); fillIt(); if (mode === "fill") { c.save(); c.globalCompositeOperation = "destination-out"; P([-0.25, 0.6, -0.25, 0.05, 0, -0.2, 0.25, 0.05, 0.25, 0.6]); c.fill(); c.restore(); } break;
      case "keller": c.beginPath(); c.ellipse(0, 0, 0.45 * r, 0.62 * r, 0, 0, TAU); fillIt(); c.beginPath(); c.moveTo(-0.45 * r, -0.2 * r); c.lineTo(0.45 * r, -0.2 * r); c.moveTo(-0.45 * r, 0.2 * r); c.lineTo(0.45 * r, 0.2 * r); c.save(); if (mode === "fill") c.strokeStyle = "rgba(40,24,12,.55)"; c.stroke(); c.restore(); break;
      case "hallen": P([-0.5, -0.6, 0.5, -0.6, 0.5, -0.45, 0.3, -0.45, 0.3, 0.45, 0.5, 0.45, 0.5, 0.6, -0.5, 0.6, -0.5, 0.45, -0.3, 0.45, -0.3, -0.45, -0.5, -0.45]); fillIt(); break;
      case "wehrgang": P([-0.7, 0.5, -0.7, -0.4, -0.45, -0.4, -0.45, -0.15, -0.15, -0.15, -0.15, -0.4, 0.15, -0.4, 0.15, -0.15, 0.45, -0.15, 0.45, -0.4, 0.7, -0.4, 0.7, 0.5]); fillIt(); break;
      case "zinnen": P([-0.6, 0.6, -0.6, 0, -0.35, 0, -0.35, 0.2, -0.1, 0.2, -0.1, 0, 0.15, 0, 0.15, 0.2, 0.4, 0.2, 0.4, 0, 0.6, 0, 0.6, 0.6]); fillIt(); c.beginPath(); c.moveTo(0.4, 0); c.lineTo(0.4, -0.7 * 1); c.stroke(); P([0.4, -0.7, -0.05, -0.55, 0.4, -0.4]); fillIt(); break;
      case "verlies": c.beginPath(); c.rect(-0.55 * r, -0.6 * r, 1.1 * r, 1.2 * r); c.stroke(); c.beginPath(); for (const x of [-0.27, 0, 0.27]) { c.moveTo(x * r, -0.6 * r); c.lineTo(x * r, 0.6 * r); } c.stroke(); break;
      case "hafen": c.beginPath(); c.moveTo(0, -0.6 * r); c.lineTo(0, 0.6 * r); c.moveTo(-0.3 * r, -0.35 * r); c.lineTo(0.3 * r, -0.35 * r); c.moveTo(-0.6 * r, 0.15 * r); c.quadraticCurveTo(-0.5 * r, 0.65 * r, 0, 0.62 * r); c.quadraticCurveTo(0.5 * r, 0.65 * r, 0.6 * r, 0.15 * r); c.stroke(); c.beginPath(); c.arc(0, -0.68 * r, 0.12 * r, 0, TAU); c.stroke(); break;
      case "glocken": c.beginPath(); c.moveTo(-0.55 * r, 0.4 * r); c.quadraticCurveTo(-0.4 * r, 0.3 * r, -0.38 * r, -0.1 * r); c.quadraticCurveTo(-0.35 * r, -0.6 * r, 0, -0.6 * r); c.quadraticCurveTo(0.35 * r, -0.6 * r, 0.38 * r, -0.1 * r); c.quadraticCurveTo(0.4 * r, 0.3 * r, 0.55 * r, 0.4 * r); c.closePath(); fillIt(); c.beginPath(); c.arc(0, 0.5 * r, 0.12 * r, 0, TAU); fillIt(); break;
      case "labor": P([-0.15, -0.65, 0.15, -0.65, 0.15, -0.2, 0.55, 0.55, -0.55, 0.55, -0.15, -0.2]); fillIt(); break;
      case "erzpriesterin": P([-0.7, -0.25, 0, -0.7, 0.7, -0.25]); fillIt(); c.beginPath(); for (const x of [-0.5, -0.17, 0.17, 0.5]) { c.moveTo(x * r, -0.15 * r); c.lineTo(x * r, 0.45 * r); } c.moveTo(-0.65 * r, 0.58 * r); c.lineTo(0.65 * r, 0.58 * r); c.stroke(); break;
      case "wachturm": P([-0.35, 0.65, -0.35, -0.4, -0.45, -0.4, -0.45, -0.65, -0.22, -0.65, -0.22, -0.5, 0, -0.5, 0, -0.65, 0.22, -0.65, 0.22, -0.5, 0.45, -0.5, 0.45, -0.4, 0.35, -0.4, 0.35, 0.65]); fillIt(); break;
      case "schlund": c.beginPath(); c.arc(0, 0, 0.58 * r, 0, TAU); fillIt(); c.save(); c.strokeStyle = mode === "fill" ? "rgba(40,20,10,.8)" : c.strokeStyle; c.beginPath(); for (let i = 0; i < 6; i++) { const a = -Math.PI * 0.85 + i * 0.34; c.moveTo(Math.cos(a) * 0.58 * r, Math.sin(a) * 0.58 * r); c.lineTo(Math.cos(a + 0.17) * 0.25 * r, Math.sin(a + 0.17) * 0.25 * r); } c.stroke(); c.restore(); break;
      case "schmiede": P([-0.7, -0.35, 0.5, -0.35, 0.7, -0.15, 0.2, -0.05, 0.2, 0.25, 0.45, 0.55, -0.45, 0.55, -0.2, 0.25, -0.2, -0.05, -0.55, -0.15]); fillIt(); break;
      case "see": c.beginPath(); for (const y of [-0.35, 0, 0.35]) { c.moveTo(-0.65 * r, y * r); for (let i = 0; i < 4; i++) c.quadraticCurveTo((-0.65 + 0.1625 + i * 0.325) * r, (y - (i % 2 ? -0.18 : 0.18)) * r, (-0.65 + (i + 1) * 0.325) * r, y * r); } c.stroke(); break;
      case "glut": c.beginPath(); c.moveTo(0, -0.7 * r); c.quadraticCurveTo(0.6 * r, -0.1 * r, 0.45 * r, 0.3 * r); c.quadraticCurveTo(0.3 * r, 0.65 * r, 0, 0.65 * r); c.quadraticCurveTo(-0.3 * r, 0.65 * r, -0.45 * r, 0.3 * r); c.quadraticCurveTo(-0.55 * r, -0.05 * r, -0.15 * r, -0.25 * r); c.quadraticCurveTo(-0.05 * r, -0.45 * r, 0, -0.7 * r); fillIt(); break;
      case "sturm": P([0.15, -0.7, -0.4, 0.05, 0, 0.05, -0.2, 0.7, 0.45, -0.15, 0.05, -0.15, 0.3, -0.7]); fillIt(); break;
      case "demogorgon": c.beginPath(); c.moveTo(-0.7 * r, 0); c.quadraticCurveTo(0, -0.6 * r, 0.7 * r, 0); c.quadraticCurveTo(0, 0.6 * r, -0.7 * r, 0); c.closePath(); fillIt(); c.save(); if (mode === "fill") { c.fillStyle = "#2a0a1a"; c.beginPath(); c.ellipse(0, 0, 0.12 * r, 0.28 * r, 0, 0, TAU); c.fill(); } c.restore(); break;
      case "themberchaud": P([-0.7, 0.55, -0.45, 0.2, -0.2, 0.35, 0, 0.05, 0.2, 0.35, 0.45, 0.2, 0.7, 0.55]); fillIt(); P([-0.35, -0.05, -0.35, -0.55, -0.15, -0.3, 0, -0.65, 0.15, -0.3, 0.35, -0.55, 0.35, -0.05]); fillIt(); break;
      case "venomfang": c.beginPath(); c.moveTo(-0.4 * r, -0.6 * r); c.quadraticCurveTo(0.35 * r, -0.55 * r, 0.15 * r, 0.3 * r); c.lineTo(0.05 * r, 0.7 * r); c.quadraticCurveTo(-0.15 * r, 0.1 * r, -0.4 * r, -0.6 * r); fillIt(); break;
      case "herz": c.beginPath(); for (let i = 0; i < 8; i++) { const a = (i / 8) * TAU; c.moveTo(0, 0); c.lineTo(Math.cos(a) * 0.65 * r, Math.sin(a) * 0.65 * r); } c.stroke(); for (const rr of [0.25, 0.45, 0.65]) { c.beginPath(); for (let i = 0; i <= 8; i++) { const a = (i / 8) * TAU; (i ? c.lineTo : c.moveTo).call(c, Math.cos(a) * rr * r, Math.sin(a) * rr * r); } c.stroke(); } break;
      default: c.beginPath(); c.arc(0, 0, 0.4 * r, 0, TAU); fillIt();
    }
  }
  function seal(c, x, y, r, kind) {
    c.save(); c.translate(x, y);
    if (kind === "won") {
      c.fillStyle = "#8a1414"; c.beginPath(); c.arc(0, 0, r, 0, TAU); c.fill(); c.strokeStyle = "#3a0806"; c.lineWidth = Math.max(1, r * 0.18); c.stroke();
      c.strokeStyle = "#f3e2c0"; c.lineWidth = Math.max(1, r * 0.22); c.lineCap = "round"; c.beginPath(); c.moveTo(-r * 0.5, -r * 0.5); c.lineTo(r * 0.5, r * 0.5); c.moveTo(r * 0.5, -r * 0.5); c.lineTo(-r * 0.5, r * 0.5); c.stroke();
    } else if (kind === "seen") {
      c.strokeStyle = "#8a1414"; c.lineWidth = Math.max(1, r * 0.22); c.setLineDash([r * 0.5, r * 0.35]); c.beginPath(); c.arc(0, 0, r * 0.85, 0, TAU); c.stroke(); c.setLineDash([]);
      c.fillStyle = "#8a1414"; c.font = "bold " + Math.round(r * 1.3) + "px Georgia,serif"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText("!", 0, r * 0.08);
    } else if (kind === "end") {
      c.fillStyle = "#d8a02a"; c.strokeStyle = "#5a3a08"; c.lineWidth = Math.max(1, r * 0.15); c.beginPath();
      for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 5, rr = i % 2 ? r * 0.45 : r; c.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); } c.closePath(); c.fill(); c.stroke();
    }
    c.restore();
  }
  function compass(c, x, y, r) {
    c.save(); c.translate(x, y); c.globalAlpha = 0.55; c.strokeStyle = "#4a2c14"; c.fillStyle = "#4a2c14"; c.lineWidth = Math.max(1, r * 0.04);
    c.beginPath(); c.arc(0, 0, r * 0.8, 0, TAU); c.stroke();
    for (let i = 0; i < 4; i++) { c.save(); c.rotate((i * Math.PI) / 2); c.beginPath(); c.moveTo(0, -r); c.lineTo(r * 0.16, 0); c.lineTo(-r * 0.16, 0); c.closePath(); i === 0 ? c.fill() : c.stroke(); c.restore(); }
    c.font = "italic " + Math.round(r * 0.36) + "px Georgia,serif"; c.textAlign = "center"; c.fillText(L(["N", "N"]), 0, -r * 1.08);
    c.restore();
  }
  function wrap(c, txt, max) {
    if (c.measureText(txt).width <= max) return [txt];
    const w = txt.split(" "); let best = [txt];
    for (let i = 1; i < w.length; i++) { const a = w.slice(0, i).join(" "), b = w.slice(i).join(" "); const m = Math.max(c.measureText(a).width, c.measureText(b).width); if (best.length === 1 || m < best.m) { best = [a, b]; best.m = m; } }
    return best.length === 2 ? [best[0], best[1]] : best;
  }
  function edge(c, a, b, curve) {
    const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2, dx = b.x - a.x, dy = b.y - a.y;
    c.beginPath(); c.moveTo(a.x, a.y); c.quadraticCurveTo(mx - dy * curve, my + dx * curve, b.x, b.y);
  }
  /* Karte in eine Leinwand zeichnen. opts: { sel, mini, route:[ids], end:"tod"|"sieg"|"abbruch", dpr } */
  function draw(cv, opts) {
    opts = opts || {};
    const c = cv.getContext("2d"), W = cv.width, H = cv.height, mini = !!opts.mini, cheap = lo();
    const st = state(), Lt = layout(W, H, mini), pos = Lt.pos, R = Lt.R, ink = "#3b2414", faint = "rgba(70,44,22,.45)";
    c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, W, H);
    c.drawImage(parchment(W, H, cheap || mini), 0, 0);
    const fs = k => Math.max(8, Math.round(R * k));
    const FD = "'IM Fell English SC','Palatino Linotype',Palatino,Georgia,serif";
    /* Kopf, Zeilen und Stufen */
    if (!mini) {
      c.fillStyle = ink; c.textAlign = "left"; c.textBaseline = "alphabetic"; c.font = fs(0.95) + "px " + FD;
      c.fillText(L(["Die Feste der Fäden", "The Keep of Threads"]), Lt.padL * 0.5, H * 0.09);
      c.font = "italic " + fs(0.5) + "px Georgia,serif"; c.fillStyle = faint; c.fillText(L(["nach Eddas Aufzeichnungen", "after Edda's notes"]), Lt.padL * 0.5, H * 0.09 + fs(0.7));
      c.save(); c.font = "italic " + fs(0.5) + "px Georgia,serif"; c.fillStyle = faint; c.textAlign = "center";
      for (let r = 0; r < 3; r++) { const y = Lt.top + r * Lt.rh; c.save(); c.translate(Lt.padL * 0.38, y); c.rotate(-Math.PI / 2); c.fillText((r === 0 ? "↑ " : r === 2 ? "↓ " : "→ ") + L(WEG[r]), 0, 0); c.restore(); }
      for (let t = 0; t <= 7; t++) c.fillText(L(["Stufe ", "Tier "]) + ROMAN[t], Lt.padL + (t + 1) * Lt.cw, H - Lt.bot * 0.16);
      c.restore();
      if (!cheap) compass(c, W - Lt.padR - R * 1.3, Lt.top * 0.55, R * 1.05);
    }
    /* Wege */
    c.lineCap = "round";
    for (const a of IDS) {
      for (const b of exitsOf(a)) {
        if (!pos[b]) continue;
        const va = st.vis[a], vb = st.vis[b], kn = va && (vb || st.seen[b]);
        if (!kn) continue;
        const used = (st.w.w[a + ">" + b] | 0) > 0 || (a === "lager" && st.vis.torhof);
        const rift = b === "herz";
        c.strokeStyle = rift ? "rgba(110,30,70,.65)" : used ? "rgba(59,36,20,.85)" : faint;
        c.lineWidth = Math.max(1, R * (used ? 0.13 : 0.08));
        c.setLineDash(rift ? [R * 0.15, R * 0.3] : used ? [] : [R * 0.35, R * 0.25]);
        edge(c, pos[a], pos[b], ROW[a] === ROW[b] ? 0 : 0.08 * (ROW[b] > ROW[a] ? 1 : -1)); c.stroke();
      }
    }
    c.setLineDash([]);
    /* Route des letzten Laufs (oder die übergebene) */
    const route = opts.route || (st.w.last && st.w.last.r) || null, endK = opts.end || (st.w.last && st.w.last.e) || null;
    if (route && route.length) {
      const pts = ["lager"].concat(route.filter(x => pos[x])).filter((x, i, a) => i === 0 || a[i - 1] !== x).map(x => pos[x]);
      c.save(); c.strokeStyle = "rgba(158,27,20,.88)"; c.lineWidth = Math.max(1.5, R * 0.2); c.lineJoin = "round"; if (!cheap) { c.shadowColor = "rgba(90,10,6,.35)"; c.shadowBlur = R * 0.25; }
      for (let i = 1; i < pts.length; i++) { const a = pts[i - 1], b = pts[i], k = (i % 2 ? 1 : -1) * 0.05; edge(c, a, b, k); c.stroke(); }
      c.restore();
      c.fillStyle = "#9e1b14"; for (const p of pts) { c.beginPath(); c.arc(p.x, p.y, Math.max(1.5, R * 0.16), 0, TAU); c.fill(); }
      const e = pts[pts.length - 1];
      if (e && pts.length > 1) {
        c.save(); c.translate(e.x, e.y - R * 1.45); c.fillStyle = "#9e1b14"; c.strokeStyle = "#f3e2c0"; c.lineWidth = Math.max(1, R * 0.06);
        c.font = "bold " + fs(0.9) + "px Georgia,serif"; c.textAlign = "center"; c.textBaseline = "middle";
        const sym = endK === "sieg" ? "★" : endK === "tod" ? "☠" : endK === "abbruch" ? "⚑" : "•";
        c.strokeText(sym, 0, 0); c.fillText(sym, 0, 0); c.restore();
      }
    }
    /* Knoten */
    for (const id of IDS) {
      const p = pos[id], v = st.vis[id], s = st.seen[id];
      c.save(); c.translate(p.x, p.y);
      if (v) {
        if (!cheap) { c.shadowColor = "rgba(40,20,8,.45)"; c.shadowBlur = R * 0.35; c.shadowOffsetY = R * 0.08; }
        c.fillStyle = COL[id] || "#6a4a2a"; c.beginPath(); c.arc(0, 0, R, 0, TAU); c.fill();
        c.shadowColor = "transparent"; c.shadowBlur = 0; c.shadowOffsetY = 0;
        c.strokeStyle = ink; c.lineWidth = Math.max(1, R * 0.12); c.stroke();
        c.strokeStyle = "rgba(243,226,192,.35)"; c.lineWidth = Math.max(1, R * 0.05); c.beginPath(); c.arc(0, 0, R * 0.82, 0, TAU); c.stroke();
        c.fillStyle = "#f3e6c4"; c.strokeStyle = "#f3e6c4"; glyph(c, id, R * 0.78, "fill");
      } else if (s) {
        c.fillStyle = "rgba(236,220,180,.55)"; c.beginPath(); c.arc(0, 0, R, 0, TAU); c.fill();
        c.strokeStyle = "rgba(59,36,20,.75)"; c.lineWidth = Math.max(1, R * 0.08); c.setLineDash([R * 0.3, R * 0.2]); c.stroke(); c.setLineDash([]);
        c.strokeStyle = "rgba(59,36,20,.55)"; glyph(c, id, R * 0.7, "line");
      } else {
        c.fillStyle = "rgba(120,90,50,.12)"; c.beginPath(); c.arc(0, 0, R * 0.7, 0, TAU); c.fill();
        c.strokeStyle = "rgba(70,44,22,.3)"; c.lineWidth = Math.max(1, R * 0.06); c.setLineDash([R * 0.15, R * 0.2]); c.stroke(); c.setLineDash([]);
        c.fillStyle = "rgba(70,44,22,.55)"; c.font = "bold " + fs(0.9) + "px Georgia,serif"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText("?", 0, R * 0.05);
      }
      c.restore();
      if (v && st.won[id]) seal(c, p.x + R * 0.78, p.y + R * 0.72, R * 0.36, "won");
      else if (v && st.bseen[id]) seal(c, p.x + R * 0.78, p.y + R * 0.72, R * 0.36, "seen");
      const f = finalOf(id); if (f && st.E[f]) seal(c, p.x + R * 0.8, p.y - R * 0.78, R * 0.42, "end");
      if (!mini && (v || s)) {
        c.font = (v ? "" : "italic ") + fs(0.5) + "px " + FD; c.textAlign = "center"; c.textBaseline = "top"; c.fillStyle = v ? ink : faint;
        const lines = wrap(c, shortName(id), Lt.cw * 0.96);
        lines.forEach((ln, i) => c.fillText(ln, p.x, p.y + R * 1.16 + i * fs(0.56)));
      }
      if (opts.sel === id) {
        c.save(); c.strokeStyle = "#c8902a"; c.lineWidth = Math.max(2, R * 0.16); if (!cheap) { c.shadowColor = "rgba(255,200,90,.9)"; c.shadowBlur = R * 0.6; }
        c.beginPath(); c.arc(p.x, p.y, R * 1.28, 0, TAU); c.stroke(); c.restore();
      }
    }
    return Lt;
  }

  /* ======================= Fenster ======================= */
  const fmt = s => { s = Math.max(0, Math.round(s || 0)); const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), x = s % 60; return (h ? h + ":" + String(m).padStart(2, "0") : m) + ":" + String(x).padStart(2, "0"); };
  let openState = null;
  function infoHTML(id) {
    const st = state(), M = st.M, w = st.w;
    if (id === "lager") {
      const nv = AREAS.filter(a => st.vis[a] && a !== "herz").length, nAll = AREAS.filter(a => a !== "herz").length;
      const bAll = AREAS.map(bossOf).filter(Boolean), bWon = bAll.filter(b => M.bosses && M.bosses[b] && M.bosses[b].won > 0).length;
      const ends = ["tiefe", "glut", "himmel"].filter(k => st.E[k]).length;
      const last = w.last;
      return "<h3>" + esc(nameOf("lager")) + "</h3><p class='wk21-unter'>" + esc(L(["Hier beginnt jeder Lauf.", "Every run starts here."])) + "</p>" +
        row(L(["Läufe", "Runs"]), M.runs | 0) + row(L(["Siege", "Wins"]), M.wins | 0) + row(L(["Gebiete betreten", "Areas entered"]), nv + "/" + nAll) +
        row(L(["Bosse & Wächter besiegt", "Bosses & wardens beaten"]), bWon + "/" + bAll.length) + row(L(["Enden", "Endings"]), ends + "/3" + (st.E.wahr ? " + " + L(["wahres Ende", "true ending"]) : "")) +
        (last ? "<p class='wk21-route'><b>" + esc(L(["Letzter Lauf", "Last run"])) + "</b> · " + esc(L(last.e === "sieg" ? ["Sieg", "victory"] : last.e === "tod" ? ["gefallen", "fallen"] : ["umgekehrt", "turned back"])) + " · " + fmt(last.t) + "<br>" +
          last.r.map(x => esc(shortName(x))).join(" → ") + "</p>" : "<p class='wk21-route'>" + esc(L(["Noch kein Lauf eingezeichnet.", "No run drawn in yet."])) + "</p>");
    }
    const d = def(id), v = st.vis[id], s = st.seen[id], g = w.g[id] || {}, b = bossOf(id), f = finalOf(id);
    if (!v && !s) return "<h3>???</h3><p class='wk21-unter'>" + esc(L(["Noch unerforscht. Edda zeichnet nur ein, was du gesehen hast.", "Still unexplored. Edda only draws what you have seen."])) + "</p>" +
      row(L(["Stufe", "Tier"]), ROMAN[tierOf(id)]) + row(L(["Weg", "Path"]), L(WEG[ROW[id]]));
    let h = "<h3>" + esc(nameOf(id)) + "</h3><p class='wk21-unter'>" + esc((d && d.sub ? L(d.sub) : L(["Stufe ", "Tier "]) + ROMAN[tierOf(id)])) + "</p>";
    h += row(L(["Stufe · Weg", "Tier · path"]), ROMAN[tierOf(id)] + " · " + L(WEG[ROW[id]]));
    if (!v) h += "<p class='wk21-hin'>" + esc(L(["Als Ausgang gesehen – noch nicht betreten.", "Seen as an exit – not entered yet."])) + "</p>";
    else {
      h += row(L(["Besuche", "Visits"]), g.b | 0) + row(L(["Tode hier", "Deaths here"]), g.t | 0) + row(L(["Kills hier", "Kills here"]), g.k | 0);
      h += row(L(["Schnellste Ankunft", "Fastest arrival"]), g.an != null ? fmt(g.an) : "–") + row(L(["Schnellste Durchquerung", "Fastest crossing"]), g.du ? fmt(g.du) : "–");
    }
    if (b) {
      const br = (M.bosses || {})[b], lab = Z.ARENAS[id] ? L(["Boss", "Boss"]) : L(["Wächter", "Warden"]);
      const val = br && br.won > 0 ? "✕ " + bossName(b) + " · " + L(["besiegt ×", "beaten ×"]) + br.won : br && br.seen > 0 ? "! " + bossName(b) + " · " + L(["noch nicht besiegt", "not beaten yet"]) : "?";
      h += row(lab, esc(val), true);
    }
    if (f) h += row(L(["Ende", "Ending"]), st.E[f] ? "★ " + esc(L(ENDN[f] || ["Ende", "Ending"])) + " ×" + st.E[f] : "–", true);
    const ex = exitsOf(id);
    if (ex.length && v) h += "<p class='wk21-route'><b>" + esc(L(["Wege", "Ways"])) + ":</b> " + ex.map(x => (st.vis[x] || st.seen[x] ? esc(shortName(x)) : "?") + ((st.w.w[id + ">" + x] | 0) > 0 ? " ✓" : "")).join(" · ") + "</p>";
    return h;
  }
  function row(k, v, raw) { return "<div class='wk21-z'><span>" + esc(k) + "</span><b>" + (raw ? v : esc(String(v))) + "</b></div>"; }

  function open() {
    if (!Z.ui || !Z.ui.open) return;
    const st = state(), w = st.w;
    w.gesehen = w.runs | 0; save();
    const last = w.last, def0 = last && last.area && ROW[last.area] != null && st.vis[last.area] ? last.area : "lager";
    let knoten = "";
    for (const id of IDS) {
      const lab = st.vis[id] || st.seen[id] ? nameOf(id) : "???";
      knoten += '<button class="wk21-k" data-act="wk21Sel" data-arg="' + id + '" data-id="' + id + '" aria-label="' + esc(lab) + '" title="' + esc(lab) + '"' + (id === def0 ? " autofocus" : "") + "></button>";
    }
    const R = Z.bossrausch;
    const rb = Z.settings && Z.settings.rueckblick === false;
    const html = "<h2>" + esc(L(["Weltkarte", "World Map"])) + "<small>" + esc(L(["Eddas Karte der Feste", "Edda's map of the keep"])) + "</small></h2>" +
      '<div class="wk21"><div class="wk21-karte"><canvas></canvas><div class="wk21-kn">' + knoten + '</div></div><div class="wk21-info" aria-live="polite"></div></div>' +
      '<p class="wk21-leg"><span><i class="wk21-l1"></i>' + esc(L(["besucht", "visited"])) + '</span><span><i class="wk21-l2"></i>' + esc(L(["gesehen", "seen"])) + "</span><span><b>?</b> " + esc(L(["unbekannt", "unknown"])) +
      '</span><span><i class="wk21-l3"></i>' + esc(L(["Boss besiegt", "boss beaten"])) + "</span><span><b class='wk21-st'>★</b> " + esc(L(["Ende", "ending"])) + '</span><span><i class="wk21-l4"></i>' + esc(L(["letzter Lauf", "last run"])) + "</span></p>" +
      '<div class="knoepfe">' + (R && R.knopf ? R.knopf() : "") + '<button data-act="wk21Rb">' + esc(L(["Lauf-Rückblick: ", "Run recap: "]) + (rb ? L(["aus", "off"]) : L(["an", "on"]))) + '</button><button data-act="close">' + esc(L(["Zurück", "Back"])) + "</button></div>";
    Z.ui.open(html, { cls: "wk21box", onClose: () => { openState = null; removeEventListener("resize", onRes); } });
    openState = { sel: def0 };
    const box = document.querySelector("#modal .wk21");
    if (!box) return;
    box.addEventListener("focusin", e => { const b = e.target.closest && e.target.closest(".wk21-k"); if (b) select(b.dataset.id); });
    box.addEventListener("mouseover", e => { const b = e.target.closest && e.target.closest(".wk21-k"); if (b && openState && openState.sel !== b.dataset.id) { try { b.focus({ preventScroll: true }); } catch (_) {} select(b.dataset.id); } });
    addEventListener("resize", onRes);
    requestAnimationFrame(() => { render(); select(def0, true); });
    setTimeout(render, 120);
  }
  function onRes() { if (openState) setTimeout(render, 30); }
  function render() {
    const wrap = document.querySelector("#modal .wk21-karte"); if (!wrap || !openState) return;
    const cv = wrap.querySelector("canvas"), w = Math.max(200, wrap.clientWidth), h = Math.round(w * 0.52);
    const zoom = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--ui")) || 1;
    const dpr = (lo() ? 1 : Math.min(2, window.devicePixelRatio || 1)) * zoom;
    wrap.style.height = h + "px";
    if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); }
    cv.style.width = w + "px"; cv.style.height = h + "px";
    const Lt = draw(cv, { sel: openState.sel });
    const d = Lt.R * 2.3 / dpr;
    wrap.querySelectorAll(".wk21-k").forEach(b => { const p = Lt.pos[b.dataset.id]; if (!p) return; b.style.left = (p.x / dpr) + "px"; b.style.top = (p.y / dpr) + "px"; b.style.width = b.style.height = d + "px"; });
  }
  function select(id, quiet) {
    if (!openState || !IDS.includes(id)) return;
    const ch = openState.sel !== id; openState.sel = id;
    const info = document.querySelector("#modal .wk21-info"); if (info) info.innerHTML = infoHTML(id);
    if (ch || quiet) render();
  }
  function wireActions() {
    if (!Z.ui || !Z.ui.actions) return setTimeout(wireActions, 50);
    Z.ui.actions.wk21Sel = id => { select(id); A && A.play && A.play("scroll", { vol: 0.2 }); };
    Z.ui.actions.wk21Rb = (_, b) => { Z.settings.rueckblick = Z.settings.rueckblick === false; try { Z.saveSettings && Z.saveSettings(); } catch (_) {} if (b) b.textContent = L(["Lauf-Rückblick: ", "Run recap: "]) + (Z.settings.rueckblick === false ? L(["aus", "off"]) : L(["an", "on"])); };
  }
  wireActions();

  /* ======================= Kartentisch im Lager ======================= */
  let camp = null;
  function placeCamp(lv) {
    const base = lv.lcore && Number.isFinite(lv.lcore.stone) ? lv.lcore.stone : (lv.start ? lv.start.x - 12 : 40);
    const x = (base + 2.6) * T + 8, y = 12 * T;
    camp = { lv, x, y };
    (Z.interacts = Z.interacts || []).push({ x, y, r: 16, h: 32, w21: "karte", label: () => L(["Kartentisch · Weltkarte", "Map table · world map"]), use: () => open() });
  }
  const wp0 = Z.drawWorldProps;
  Z.drawWorldProps = function (c, t) {
    if (wp0) wp0.apply(this, arguments);
    try { const lv = Z.level; if (camp && lv && lv.hub && camp.lv === lv) drawTable(c, camp.x, camp.y, t); } catch (e) { if (!drawErr) { drawErr = 1; console.error(e); } }
  };
  let drawErr = 0;
  function drawTable(c, x, y, t) {
    const cam = Z.cam; if (cam && (x < cam.x - 40 || x > cam.x + cam.w + 40)) return;
    c.save();
    c.globalAlpha = 0.25; c.fillStyle = "#000"; c.beginPath(); c.ellipse(x, y + 0.5, 15, 1.8, 0, 0, TAU); c.fill(); c.globalAlpha = 1;
    c.fillStyle = "#3e2816"; c.fillRect(x - 12, y - 10, 2, 10); c.fillRect(x + 10, y - 10, 2, 10); c.fillRect(x - 1, y - 10, 2, 10);
    c.fillStyle = "#2a1a0e"; c.fillRect(x - 12, y - 4, 24, 1.2);
    c.fillStyle = "#6e4a2a"; c.fillRect(x - 14, y - 12, 28, 3); c.fillStyle = "#8a6038"; c.fillRect(x - 14, y - 12, 28, 1); c.fillStyle = "#3a2414"; c.fillRect(x - 14, y - 9.4, 28, 0.8);
    /* Karte hängt über die Tischkante */
    c.fillStyle = "#dcc596"; c.beginPath(); c.moveTo(x - 9, y - 12.2); c.lineTo(x + 8, y - 12.2); c.lineTo(x + 8.5, y - 6.5); c.quadraticCurveTo(x, y - 5.2, x - 9.5, y - 6.8); c.closePath(); c.fill();
    c.strokeStyle = "#8a6a3a"; c.lineWidth = 0.4; c.stroke();
    c.strokeStyle = "#9e1b14"; c.lineWidth = 0.6; c.beginPath(); c.moveTo(x - 7, y - 8); c.lineTo(x - 3, y - 10); c.lineTo(x + 1, y - 8.4); c.lineTo(x + 5.5, y - 10.4); c.stroke();
    c.fillStyle = "#3b2414"; for (const [px, py] of [[-7, -8], [-3, -10], [1, -8.4], [5.5, -10.4]]) c.fillRect(x + px - 0.6, y + py - 0.6, 1.2, 1.2);
    /* Tintenfass mit Feder, Kerze */
    c.fillStyle = "#1e1410"; c.fillRect(x + 9, y - 14.5, 3, 2.5); c.strokeStyle = "#e8dcc8"; c.lineWidth = 0.6; c.beginPath(); c.moveTo(x + 10.5, y - 14.5); c.quadraticCurveTo(x + 12, y - 18, x + 14.5, y - 20); c.stroke();
    c.fillStyle = "#e8dcc0"; c.fillRect(x - 12.5, y - 16, 2, 4);
    if (Z.flame) Z.flame(c, x - 11.5, y - 16, 0.55, "#ffb040");
    /* neue Einträge seit dem letzten Blick: goldener Schimmer */
    const w = WK();
    if ((w.runs | 0) !== (w.gesehen | 0) && !lo()) { c.globalCompositeOperation = "lighter"; Z.draw && Z.draw.glow && Z.draw.glow(c, x, y - 12, 10 + Math.sin(t * 3) * 2, "rgba(255,190,90,.35)"); }
    c.restore();
  }

  /* ======================= Stil ======================= */
  const css = document.createElement("style");
  css.textContent = [
    ".mbox.wk21box{width:min(1240px,calc(97vw / var(--ui,1)))!important}",
    ".wk21{display:flex;gap:14px;align-items:flex-start}",
    ".wk21-karte{position:relative;flex:1 1 72%;min-width:0;border-radius:6px;box-shadow:0 6px 22px rgba(0,0,0,.55)}",
    ".wk21-karte canvas{display:block;border-radius:6px}",
    ".wk21-kn{position:absolute;inset:0}",
    ".wk21-k{position:absolute;transform:translate(-50%,-50%);border-radius:50%;border:0;padding:0;margin:0;background:transparent;cursor:pointer;min-width:0;min-height:0}",
    ".wk21-k:focus,.wk21-k:hover{outline:2px solid #e5b454!important;outline-offset:3px;background:rgba(229,180,84,.10)}",
    ".wk21-info{flex:0 0 23%;min-width:150px;max-width:300px;background:rgba(20,12,8,.55);border:1px solid #4a3426;border-radius:6px;padding:8px 12px;align-self:stretch;overflow:auto}",
    ".wk21-info h3{margin:0 0 2px}.wk21-unter{margin:0 0 8px!important;color:#c8b090;font-style:italic;font-size:var(--fs-s,13px)}",
    ".wk21-z{display:flex;justify-content:space-between;gap:10px;padding:2px 0;border-bottom:1px dashed rgba(229,180,84,.14)}.wk21-z span{color:#c8b090}.wk21-z b{color:#f0e0c0;text-align:right}",
    ".wk21-hin{color:#d8a860;font-style:italic}.wk21-route{font-size:var(--fs-s,13px);color:#d8c8a8;margin-top:8px!important}",
    ".wk21-leg{display:flex;flex-wrap:wrap;gap:6px 16px;justify-content:center;font-size:var(--fs-s,13px);color:#c8b090;margin:10px 0 0!important}",
    ".wk21-leg span{display:inline-flex;align-items:center;gap:5px}.wk21-leg i{display:inline-block;width:12px;height:12px;border-radius:50%}",
    ".wk21-l1{background:#7a3a2a;border:2px solid #3b2414}.wk21-l2{border:2px dashed #b0905a}.wk21-l3{background:#8a1414;width:10px!important;height:10px!important}.wk21-l4{height:3px!important;width:18px!important;border-radius:2px!important;background:#9e1b14}.wk21-st{color:#d8a02a}",
    ".handheld .wk21{gap:6px}.handheld .wk21-info{min-width:120px;padding:4px 7px;font-size:12px}.handheld .wk21-info h3{font-size:15px}.handheld .wk21-z{padding:0}",
    ".handheld .wk21-leg{gap:2px 10px;font-size:11px;margin-top:4px!important}.handheld .mbox.wk21box{padding:10px 12px}",
    "@media (max-aspect-ratio:1/1){.wk21{flex-direction:column}.wk21-karte{flex:none;width:100%}.wk21-info{max-width:none;width:100%;box-sizing:border-box}}"
  ].join("\n");
  document.head.appendChild(css);

  Z.weltkarte = { open, draw, state, meta: WK, ort: () => camp, fmt, ROW, IDS, AREAS, nameOf, shortName, exitsOf, bossOf, finalOf, COL };
})();
