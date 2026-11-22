/* Ezekiel – The Destroyer · Grafikstufen, Fehlersammlung, Diagnose und Grafiktest
   Z.gq: aktuelle Qualitätswerte (aus Voreinstellung oder eigenen Werten).
   Z.diag: Fehlerliste, 10-s-Diagnose im laufenden Spiel und automatischer Grafiktest – Ergebnis als kopierbarer Text. */
(function () {
  "use strict";
  const Z = window.Z, L = v => Z.L(v);
  const VERSION = "zerstoerer v4 · 2026-11-22";
  Z.VERSION = VERSION;

  /* ======================= QUALITÄTSSTUFEN ======================= */
  const PRESETS = [
    { n: ["Niedrig", "Low"], res: 0.6, part: 0.35, light: 8, weather: false, fog: false, layers: false, critters: false, vignette: false, maxPix: 1100 * 640 },
    { n: ["Mittel", "Medium"], res: 0.8, part: 0.65, light: 6, weather: true, fog: true, layers: true, critters: false, vignette: true, maxPix: 1400 * 820 },
    { n: ["Hoch", "High"], res: 1, part: 1, light: 4, weather: true, fog: true, layers: true, critters: true, vignette: true, maxPix: 1600 * 940 },
    { n: ["Ultra", "Ultra"], res: 1, part: 1, light: 3, weather: true, fog: true, layers: true, critters: true, vignette: true, maxPix: 2560 * 1440 }
  ];
  Z.GFX_PRESETS = PRESETS;
  const KEYS = ["res", "part", "light", "weather", "fog", "layers", "critters", "vignette", "maxPix"];
  const S = Z.settings;
  if (!S.gfx || typeof S.gfx !== "object") S.gfx = { preset: "auto", fpsCap: 0 };
  const touchDev = matchMedia && matchMedia("(pointer: coarse)").matches;
  let autoLvl = touchDev || (navigator.hardwareConcurrency || 8) <= 4 ? 1 : 2;
  try { const a = +sessionStorage.getItem("imres-zerstoerer-autolvl"); if (a >= 0 && a <= 3 && sessionStorage.getItem("imres-zerstoerer-autolvl") != null) autoLvl = a; } catch (_) {}
  Z.gq = {};
  Z.applyGfx = function (noResize) {
    const g = S.gfx;
    const base = g.preset === "auto" ? PRESETS[autoLvl] : g.preset === "custom" ? PRESETS[2] : PRESETS[+g.preset] || PRESETS[2];
    const q = {};
    for (const k of KEYS) q[k] = g.preset === "custom" && g.c && g.c[k] != null ? g.c[k] : base[k];
    q.fpsCap = g.fpsCap || 0;
    q.level = g.preset === "auto" ? autoLvl : g.preset === "custom" ? -1 : +g.preset;
    Z.gq = q;
    if (!noResize && Z.resize) Z.resize();
  };
  Z.gfxName = function () {
    const g = S.gfx;
    if (g.preset === "auto") return L(["Automatisch", "Automatic"]) + " (" + L(PRESETS[autoLvl].n) + ")";
    if (g.preset === "custom") return L(["Eigene", "Custom"]);
    return L(PRESETS[+g.preset].n);
  };
  /* eigene Werte: von der aktuellen Stufe ausgehend */
  Z.setGfx = function (k, v) {
    const g = S.gfx;
    if (k === "preset") { g.preset = v; }
    else if (k === "fpsCap") g.fpsCap = +v;
    else { if (g.preset !== "custom") { g.c = {}; for (const kk of KEYS) g.c[kk] = Z.gq[kk]; g.preset = "custom"; } g.c[k] = v; }
    Z.saveSettings(); Z.applyGfx();
  };
  Z.applyGfx(true);

  /* Automatik: läuft das Spiel dauerhaft zu langsam, eine Stufe herunter (nur nach unten, kein Hin und Her) */
  let autoAcc = 0, autoN = 0, autoT = 0, autoGrace = 6;
  Z.gfxAutoTick = function (dt, playing) {
    if (S.gfx.preset !== "auto" || !playing || document.hidden || Z.diag.busy) { autoAcc = 0; autoN = 0; autoT = 0; return; }
    if (autoGrace > 0) { autoGrace -= dt; return; }
    autoAcc += dt; autoN++; autoT += dt;
    if (autoT >= 5) {
      const fps = autoN / autoAcc; autoAcc = 0; autoN = 0; autoT = 0;
      const cap = Z.gq.fpsCap || 60;
      if (fps < Math.min(48, cap * 0.8) && autoLvl > 0) {
        autoLvl--; try { sessionStorage.setItem("imres-zerstoerer-autolvl", autoLvl); } catch (_) {}
        Z.applyGfx(); autoGrace = 4;
        Z.toast && Z.toast(L(["Grafik automatisch angepasst: ", "Graphics adjusted automatically: "]) + "<b>" + L(PRESETS[autoLvl].n) + "</b>", 2600);
        Z.diag.note("Auto-Grafik → " + PRESETS[autoLvl].n[0] + " (" + fps.toFixed(0) + " fps)");
      }
    }
  };

  /* ======================= FEHLER SAMMELN ======================= */
  const D = (Z.diag = { errors: [], notes: [], busy: false, last: "" });
  const ERRKEY = "imres-zerstoerer-fehler";
  try { const old = JSON.parse(localStorage.getItem(ERRKEY) || "[]"); if (Array.isArray(old)) D.old = old.slice(-15); } catch (_) { D.old = []; }
  const short = f => String(f || "").replace(/^.*\//, "").replace(/\?.*$/, "");
  const scene = () => { try { return (Z.run ? Z.run.area : "-") + (Z.boss && !Z.bossDefeated ? " · Boss" : ""); } catch (_) { return "?"; } };
  function addErr(msg, src, line, col, stack) {
    const t = new Date();
    const e = { t: t.toTimeString().slice(0, 8), d: t.toISOString().slice(0, 10), m: String(msg).slice(0, 220), at: short(src) + (line ? ":" + line + (col ? ":" + col : "") : ""), s: scene(), st: stack ? String(stack).split("\n").slice(1, 4).map(l => l.trim().replace(/\(?(https?:\/\/[^)]*\/)/, "(")).join(" | ").slice(0, 300) : "" };
    const prev = D.errors[D.errors.length - 1];
    if (prev && prev.m === e.m && prev.at === e.at) { prev.n = (prev.n || 1) + 1; return; }
    D.errors.push(e); if (D.errors.length > 40) D.errors.shift();
    try { const all = (D.old || []).concat(D.errors).slice(-20); localStorage.setItem(ERRKEY, JSON.stringify(all)); } catch (_) {}
    if (D.onError) D.onError(e);
  }
  addEventListener("error", ev => { if (ev && ev.message) addErr(ev.message, ev.filename, ev.lineno, ev.colno, ev.error && ev.error.stack); else if (ev && ev.target && ev.target.src) addErr("Laden fehlgeschlagen: " + short(ev.target.src), "", 0); }, true);
  addEventListener("unhandledrejection", ev => { const r = ev && ev.reason; addErr("Promise: " + (r && r.message || r), r && r.fileName, r && r.lineNumber, 0, r && r.stack); });
  const ce = console.error; console.error = function () { try { addErr("console.error: " + [...arguments].map(a => a && a.message || String(a)).join(" "), "", 0); } catch (_) {} return ce.apply(console, arguments); };
  D.note = s => { D.notes.push(new Date().toTimeString().slice(0, 8) + " " + s); if (D.notes.length > 20) D.notes.shift(); };
  D.clearOld = () => { D.old = []; D.errors.length = 0; try { localStorage.removeItem(ERRKEY); } catch (_) {} };

  /* ======================= MESSUNG ======================= */
  const now = () => performance.now();
  const WRAP = ["updatePlayer", "updateEnemies", "updateProjs", "updateHazards", "updateAllies", "updateGadgets", "updatePickups"];
  let M = null;
  function wrapAll() {
    M.orig = {};
    for (const k of WRAP) { const o = Z[k]; if (typeof o !== "function") continue; M.orig[k] = o; Z[k] = function () { const a = now(); try { return o.apply(this, arguments); } finally { M.logic += now() - a; } }; }
    const r = Z.gfx.render; M.orig.render = r; Z.gfx.render = function () { const a = now(); try { return r.apply(this, arguments); } finally { M.draw += now() - a; } };
    const uf = Z.ui && Z.ui.frame; if (uf) { M.orig.uiframe = uf; Z.ui.frame = function () { const a = now(); try { return uf.apply(this, arguments); } finally { M.uiT += now() - a; } }; }
    try { if (window.PerformanceObserver) { M.obs = new PerformanceObserver(l => { for (const e of l.getEntries()) if (M && M.longs.length < 300) M.longs.push(e.duration); }); M.obs.observe({ entryTypes: ["longtask"] }); } } catch (_) { M.obs = null; }
  }
  function unwrapAll() {
    if (!M || !M.orig) return;
    for (const k of WRAP) if (M.orig[k]) Z[k] = M.orig[k];
    if (M.orig.render) Z.gfx.render = M.orig.render;
    if (M.orig.uiframe) Z.ui.frame = M.orig.uiframe;
    try { if (M.obs) M.obs.disconnect(); } catch (_) {}
    Z.prof = null;
  }
  const playing = () => !!(Z.level && !Z.paused && !(Z.ui && Z.ui.modalOpen) && !document.hidden);
  function newM(kind) { return { kind, iv: [], active: 0, logic: 0, draw: 0, uiT: 0, frames: 0, longs: [], lt: 0, prof: null, t0: now(), parts: 0, partsN: 0 }; }
  function stats(iv) {
    const n = iv.length; if (!n) return { n: 0, fps: 0, low: 0, max: 0, miss: 0 };
    const sum = iv.reduce((a, b) => a + b, 0), s = iv.slice().sort((a, b) => a - b), w = Math.max(1, Math.ceil(n * 0.01));
    const worst = s.slice(n - w), hz = Math.round(1000 / Math.max(4, s[Math.floor(n * 0.1)]));
    const per = 1000 / Math.min(hz, Z.gq.fpsCap || 999);
    return { n, fps: 1000 * n / sum, low: 1000 * w / worst.reduce((a, b) => a + b, 0), max: s[n - 1], miss: iv.filter(x => x > per * 1.5).length / n * 100, hz };
  }

  /* ---------- Hinweis-Leiste während der Messung ---------- */
  let hintEl = null;
  function hint(txt) {
    if (!hintEl) { hintEl = document.createElement("div"); hintEl.id = "diagHint"; document.body.appendChild(hintEl); }
    hintEl.textContent = txt || ""; hintEl.hidden = !txt;
  }

  /* ---------- 10-Sekunden-Diagnose im laufenden Spiel ---------- */
  D.startDiag = function (ms) {
    if (D.busy) return false;
    if (!Z.level) { Z.toast(L(["Die Diagnose misst im laufenden Spiel – erst ein Gebiet betreten.", "The diagnosis measures live gameplay – enter an area first."]), 3000); return false; }
    D.busy = "diag"; M = newM("diag"); M.goal = ms || 10000; wrapAll();
    if (Z.ui && Z.ui.modalOpen) Z.ui.close();
    const loop = t => {
      if (!M || M.kind !== "diag") return;
      const ok = playing();
      if (ok && M.lt && M.prevOk) { const d = t - M.lt; if (d > 0 && d < 1000) { M.iv.push(d); M.active += d; M.parts += Z.fx.parts.length; M.partsN++; } }
      M.prevOk = ok; M.lt = t;
      /* letzte 25 %: Zeichenbereiche mit Grafikkarten-Abgleich messen */
      if (M.active > M.goal * 0.75 && !M.prof) { M.prof = {}; M.profStart = M.iv.length; Z.prof = M.prof; }
      const rest = Math.max(0, Math.ceil((M.goal - M.active) / 1000));
      hint(ok ? L(["Diagnose läuft – bitte normal weiterspielen · noch ", "Diagnosis running – please keep playing normally · "]) + rest + L([" s", " s left"]) : L(["Diagnose wartet, bis das Spiel weiterläuft …", "Diagnosis waiting for the game to resume…"]));
      if (M.active >= M.goal) { finishDiag(); return; }
      if (now() - M.t0 > 180000) { D.cancel(); Z.toast(L(["Diagnose abgebrochen – es lief zu wenig Spiel.", "Diagnosis cancelled – not enough gameplay."]), 3000); return; }
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
    return true;
  };
  D.cancel = function () { unwrapAll(); M = null; D.busy = false; hint(""); };
  function finishDiag() {
    const m = M; unwrapAll(); M = null; D.busy = false; hint("");
    const main = m.iv.slice(0, m.profStart || m.iv.length), st = stats(main), n = Math.max(1, m.iv.length);
    const r = { st, logic: m.logic / n, draw: m.draw / n, ui: m.uiT / n, longs: m.longs, prof: m.prof, profN: Math.max(1, m.iv.length - (m.profStart || 0)), parts: m.partsN ? m.parts / m.partsN : 0, sec: m.active / 1000 };
    D.last = report("diag", r);
    Z.ui && Z.ui.showReport && Z.ui.showReport(D.last, L(["Diagnosebericht", "Diagnosis report"]));
  }

  /* ---------- Grafiktest: alle Stufen nacheinander, mit Effekt-Last ---------- */
  D.startBench = function () {
    if (D.busy) return false;
    if (!Z.level) { Z.toast(L(["Der Grafiktest braucht eine Szene – erst ins Lager oder ein Gebiet gehen.", "The graphics test needs a scene – enter the camp or an area first."]), 3000); return false; }
    if (Z.ui && Z.ui.modalOpen) Z.ui.close();
    const saved = JSON.parse(JSON.stringify(S.gfx)), god = Z.godMode;
    Z.godMode = true; D.busy = "bench";
    const phases = [3, 2, 1, 0], res = []; let pi = -1, ph = null;
    const next = () => {
      pi++;
      if (pi >= phases.length) {
        S.gfx = saved; Z.applyGfx(); Z.godMode = god; D.busy = false; hint("");
        D.bench = res; D.last = report("bench", { res });
        Z.ui && Z.ui.showReport && Z.ui.showReport(D.last, L(["Grafiktest", "Graphics test"]), benchPick(res));
        return;
      }
      S.gfx = { preset: phases[pi], fpsCap: 0 }; Z.applyGfx();
      ph = { lvl: phases[pi], iv: [], lt: 0, t0: now(), warm: 700, dur: 3600 };
    };
    next();
    const loop = t => {
      if (D.busy !== "bench") return;
      if (Z.paused && Z.ui && Z.ui.modalOpen) Z.ui.close();
      const el = now() - ph.t0;
      if (el > ph.warm && ph.lt) { const d = t - ph.lt; if (d > 0 && d < 1000) ph.iv.push(d); }
      ph.lt = t;
      /* Last wie im Kampf: Funken, Rauch, Ringe am Spieler */
      const P = Z.player;
      if (P && Math.random() < 0.6) { Z.fx.burst(P.x + P.w / 2 + (Math.random() - 0.5) * 120, P.y + (Math.random() - 0.5) * 60, 14, { col: ["#ffd27a", "#ff6a2a", "#fff"], sp: 160, life: 0.6, size: 2, kind: "spark", add: true }); Z.fx.burst(P.x + P.w / 2, P.y, 3, { col: ["#4a4040", "#6a5a50"], sp: 50, life: 1, size: 6, kind: "smoke" }); }
      hint(L(["Grafiktest · Stufe ", "Graphics test · level "]) + L(PRESETS[ph.lvl].n) + " (" + (pi + 1) + "/" + phases.length + ")" + L([" – bitte nichts drücken", " – please don't touch anything"]));
      if (el > ph.warm + ph.dur) { res.push({ lvl: ph.lvl, s: stats(ph.iv), px: (Z.canvasPx || "") }); next(); }
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
    return true;
  };
  function benchPick(res) {
    const ok = res.filter(r => r.s.fps >= 55 && r.s.low >= 38).sort((a, b) => b.lvl - a.lvl)[0];
    return ok ? ok.lvl : 0;
  }

  /* ======================= BERICHT ======================= */
  function browser() {
    const u = navigator.userAgent || ""; let m, b = "";
    if ((m = u.match(/Edg\/([\d.]+)/))) b = "Edge " + m[1]; else if ((m = u.match(/OPR\/([\d.]+)/))) b = "Opera " + m[1]; else if ((m = u.match(/Firefox\/([\d.]+)/))) b = "Firefox " + m[1];
    else if ((m = u.match(/SamsungBrowser\/([\d.]+)/))) b = "Samsung Internet " + m[1]; else if ((m = u.match(/(?:Chrome|CriOS)\/([\d.]+)/))) b = "Chrome " + m[1]; else if ((m = u.match(/Version\/([\d.]+).*Safari/))) b = "Safari " + m[1]; else b = u.slice(0, 60);
    let os = ""; if ((m = u.match(/Windows NT ([\d.]+)/))) os = "Windows " + ({ "10.0": "10/11", "6.3": "8.1", "6.1": "7" }[m[1]] || m[1]); else if ((m = u.match(/Android ([\d.]+)/))) os = "Android " + m[1];
    else if (/iPhone|iPad/.test(u)) os = "iOS"; else if (/Mac OS X/.test(u)) os = "macOS"; else if (/CrOS/.test(u)) os = "ChromeOS"; else if (/Linux/.test(u)) os = "Linux";
    return [b, os].filter(Boolean).join(" · ");
  }
  function gpu() {
    try { const c = document.createElement("canvas"), g = c.getContext("webgl") || c.getContext("experimental-webgl"); if (!g) return "kein WebGL"; const e = g.getExtension("WEBGL_debug_renderer_info"); const r = String(e ? g.getParameter(e.UNMASKED_RENDERER_WEBGL) : g.getParameter(g.RENDERER)); const l = g.getExtension("WEBGL_lose_context"); if (l) l.loseContext(); return r.slice(0, 90); } catch (e) { return "?"; }
  }
  const f1 = x => (isFinite(x) ? x : 0).toFixed(1), f0 = x => Math.round(isFinite(x) ? x : 0);
  const onoff = v => (v ? "an" : "aus");
  const PROFN = { layers: "Hintergrund", tiles: "Kacheln", decor: "Deko", misc: "Objekte/Böden", enemies: "Figuren", fx: "Effekte", light: "Licht", post: "Nachbearb." };
  function report(kind, r) {
    const q = Z.gq, P = Z.player, cv = document.getElementById("cv"), out = [];
    out.push("Ezekiel – The Destroyer · " + (kind === "bench" ? "Grafiktest" : "Diagnosebericht"));
    out.push(VERSION + " · " + new Date().toLocaleString("de-DE"));
    out.push("Gerät: " + browser() + " · " + (navigator.hardwareConcurrency || "?") + " Kerne" + (navigator.deviceMemory ? " · " + navigator.deviceMemory + " GB" : "") + " · " + gpu());
    out.push("Bildschirm: " + innerWidth + "×" + innerHeight + " @" + (devicePixelRatio || 1).toFixed(2) + " · Zeichenfläche " + (cv ? cv.width + "×" + cv.height : "?") + (document.fullscreenElement ? " · Vollbild" : ""));
    const pad = Z.input.lastPad ? Z.input.padName || "Controller" : "";
    out.push("Eingabe: " + (Z.input.device === "pad" ? "Controller" : Z.input.device === "touch" ? "Touch" : "Tastatur/Maus") + (pad ? " · " + pad.replace(/\s*\(.*?\)/g, "").slice(0, 50) : ""));
    out.push("Grafik: " + Z.gfxName() + " · Auflösung " + f0(q.res * 100) + " % · Partikel " + f0(q.part * 100) + " % · Licht 1/" + q.light + " · Wetter " + onoff(q.weather) + " · Nebel " + onoff(q.fog) + " · Ebenen " + onoff(q.layers) + " · Tiere " + onoff(q.critters) + " · Vignette " + onoff(q.vignette) + " · FPS-Grenze " + (q.fpsCap || "aus"));
    if (kind === "diag") {
      const s = r.st;
      let vis = 0, alive = 0; const cam = Z.cam;
      for (const e of Z.enemies) if (!e.dead) { alive++; if (e.x > cam.x - 40 && e.x < cam.x + cam.w + 40 && e.y > cam.y - 40 && e.y < cam.y + cam.h + 40) vis++; }
      out.push("Szene: " + (Z.run ? Z.run.area : "-") + (Z.level && Z.level.id ? " (" + Z.level.id + ")" : "") + (Z.boss && !Z.bossDefeated ? " · Bosskampf" : "") + " · Gegner " + alive + " (sichtbar " + vis + ") · Partikel Ø " + f0(r.parts) + " · Geschosse " + Z.projs.length + " · Objekte " + (Z.gadgets ? Z.gadgets.length : 0));
      out.push("Bildrate: Ø " + f1(s.fps) + " fps · schlechteste 1 %: " + f1(s.low) + " fps · längstes Bild " + f0(s.max) + " ms · Ruckler " + f1(s.miss) + " % · Bildschirm ~" + (s.hz || "?") + " Hz · " + f1(r.sec) + " s gemessen");
      const all = 1000 / Math.max(1, s.fps);
      out.push("Zeit je Bild: Spiel-Logik " + f1(r.logic) + " ms · Zeichnen " + f1(r.draw) + " ms · Oberfläche " + f1(r.ui) + " ms · Browser/Grafikkarte/Warten " + f1(Math.max(0, all - r.logic - r.draw - r.ui)) + " ms");
      if (r.prof) out.push("Zeichenbereiche (mit Abgleich): " + Object.entries(r.prof).map(([k, v]) => (PROFN[k] || k) + " " + f1(v / r.profN)).join(" · ") + " ms");
      out.push("Lange Aufgaben (>50 ms): " + r.longs.length + (r.longs.length ? " (max " + f0(Math.max.apply(null, r.longs)) + " ms)" : "") + (window.PerformanceObserver ? "" : " (nicht messbar)"));
      try { const m = performance.memory; if (m) out.push("Speicher: " + Math.round(m.usedJSHeapSize / 1048576) + " / " + Math.round(m.jsHeapSizeLimit / 1048576) + " MB"); } catch (_) {}
    } else {
      out.push("Ergebnis je Stufe (Ø fps / schlechteste 1 % / längstes Bild):");
      for (const x of r.res) out.push("  " + PRESETS[x.lvl].n[0].padEnd(8) + f1(x.s.fps).padStart(6) + " fps  " + f1(x.s.low).padStart(6) + " fps  " + f0(x.s.max).toString().padStart(4) + " ms");
      out.push("Empfehlung: " + PRESETS[benchPick(r.res)].n[0]);
    }
    if (P) out.push("Spieler: Leben " + f0(P.hp) + "/" + f0(P.hpMax) + " · Waffen " + ["a1", "a2", "s1", "s2"].map(s => P.slots[s] ? P.slots[s].id : "–").join(", "));
    const errs = (D.old || []).concat(D.errors);
    out.push("Fehler: " + (errs.length ? errs.length : "keine"));
    for (const e of errs.slice(-12)) out.push("  " + e.d + " " + e.t + " · " + e.m + (e.n > 1 ? " (×" + e.n + ")" : "") + (e.at ? " @ " + e.at : "") + " · " + e.s + (e.st ? "\n      " + e.st : ""));
    if (D.notes.length) out.push("Hinweise: " + D.notes.slice(-6).join(" | "));
    out.push("Einstellungen: Wackeln " + f0(S.shake * 100) + " % · Blitze " + onoff(S.flashes) + " · Zahlen " + onoff(S.showDmg) + " · Sprache " + S.lang + " · Touch " + f0(S.touchSize * 100) + " %");
    return out.join("\n");
  }
  /* Kurzbericht nur mit Fehlern und Technik (ohne Messung) */
  D.quick = () => report("quick", {});

  /* ======================= Bildratengrenze & Automatik einhängen ======================= */
  Z.frameGate = function (t) {
    const cap = Z.gq.fpsCap; if (!cap) return true;
    const per = 1000 / cap;
    if (Z._lastDraw && t - Z._lastDraw < per - 1.5) return false;
    Z._lastDraw = Z._lastDraw && t - Z._lastDraw < per * 2 ? Z._lastDraw + per : t;
    return true;
  };
})();
