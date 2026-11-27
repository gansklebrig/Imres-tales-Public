/* Ezekiel – The Destroyer · Kern
   Grundlagen: Zufall, Eingabe (Tastatur, Gamepad, Touch), Ton (echte Aufnahmen aus klang/ und amb/),
   Partikel, Kamera, Bildschirmwackeln, Trefferstopp. Alles hängt am globalen Objekt Z. */
(function () {
  "use strict";
  const Z = (window.Z = window.Z || {});
  Z.TILE = 16;

  /* ---------------- Hilfen ---------------- */
  const U = (Z.U = {
    clamp: (v, a, b) => (v < a ? a : v > b ? b : v),
    lerp: (a, b, t) => a + (b - a) * t,
    sign: v => (v > 0 ? 1 : v < 0 ? -1 : 0),
    dist: (ax, ay, bx, by) => Math.hypot(bx - ax, by - ay),
    approach: (v, t, d) => (v < t ? Math.min(v + d, t) : Math.max(v - d, t)),
    ease: t => t * t * (3 - 2 * t),
    easeOut: t => 1 - (1 - t) * (1 - t),
    overlap: (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y,
    angDiff: (a, b) => { let d = b - a; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2; return d; },
    fmt: n => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, Z.settings && Z.settings.lang === "en" ? "," : "."), /* W26 Erstspieler: im EN-Modus 1,000 statt 1.000 */
    esc: s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c])
  });
  /* Saatbasierter Zufall (mulberry32), damit Welten reproduzierbar sind */
  Z.Rng = function (seed) {
    let s = seed >>> 0 || 1;
    const r = () => { s |= 0; s = (s + 0x6d2b79f5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    r.int = (a, b) => a + Math.floor(r() * (b - a + 1));
    r.range = (a, b) => a + r() * (b - a);
    r.pick = l => l[Math.floor(r() * l.length)];
    r.chance = p => r() < p;
    r.shuffle = l => { for (let i = l.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [l[i], l[j]] = [l[j], l[i]]; } return l; };
    r.weighted = obj => { let sum = 0; for (const k in obj) sum += obj[k]; let x = r() * sum; for (const k in obj) { x -= obj[k]; if (x <= 0) return k; } return Object.keys(obj)[0]; };
    return r;
  };
  Z.R = Z.Rng((Date.now() ^ (Math.random() * 1e9)) >>> 0); /* Laufzeit-Zufall für Effekte und Kampf */

  /* ---------------- Eingabe ---------------- */
  const ACTIONS = ["left", "right", "up", "down", "jump", "roll", "a1", "a2", "s1", "s2", "use", "potion", "pause", "map", "gear"];
  /* Standardbelegung: je Aktion bis zu zwei Tasten */
  const KEYS0 = {
    left: ["KeyA", "ArrowLeft"], right: ["KeyD", "ArrowRight"], up: ["KeyW", "ArrowUp"], down: ["KeyS", "ArrowDown"],
    jump: ["Space", "KeyK"], roll: ["ShiftLeft", "KeyL"], a1: ["KeyJ", null], a2: ["KeyU", null], s1: ["KeyQ", "KeyI"], s2: ["KeyO", null],
    use: ["KeyE", "Enter"], potion: ["KeyR", "KeyH"], pause: ["Escape", "KeyP"], map: ["KeyM", null],
    gear: ["Tab", "KeyC"] /* Ausrüstung: halten = Schnellansicht (ui.js) */
  };
  /* Xbox-Layout (Standard-Gamepad): 0 A, 1 B, 2 X, 3 Y, 4 LB, 5 RB, 6 LT, 7 RT, 8 Ansicht, 9 Menü, 10 LS, 11 RS, 12–15 Steuerkreuz */
  /* Ausrüstung: rechter Stick drücken (halten); zusätzlich „Ansicht“ halten statt antippen (ui.js) */
  const PAD0 = { jump: 0, roll: 1, a1: 2, a2: 3, s1: 4, s2: 5, potion: 6, use: 7, map: 8, pause: 9, gear: 11 };
  const PADNAMES = ["A", "B", "X", "Y", "LB", "RB", "LT", "RT", "View", "Menu", "LS", "RS", "↑", "↓", "←", "→", "Xbox"];
  /* W20 Steuerung: zweiter Controller-Knopf je Aktion (inp.pad2) und Vorlagen. Richtungen bleiben Stick + Steuerkreuz;
     ein Kreuz-Knopf, der einer Aktion gegeben wird, lenkt im Spiel nicht mehr (in Menüs schon). */
  const PAD2_0 = {};
  const PRESETS = {
    standard: { n: ["Standard", "Default"], keys: KEYS0, pad: PAD0, pad2: PAD2_0 },
    deadcells: { n: ["Dead Cells", "Dead Cells"],
      keys: { left: ["KeyA", "ArrowLeft"], right: ["KeyD", "ArrowRight"], up: ["KeyW", "ArrowUp"], down: ["KeyS", "ArrowDown"], jump: ["Space", null], roll: ["ShiftLeft", "ControlLeft"],
        a1: ["KeyJ", null], a2: ["KeyK", null], s1: ["KeyQ", null], s2: ["KeyE", null], use: ["KeyR", "Enter"], potion: ["KeyF", null], pause: ["Escape", "KeyP"], map: ["Tab", null], gear: ["KeyC", null] },
      pad: { jump: 0, roll: 1, a1: 2, a2: 3, potion: 4, use: 5, s1: 6, s2: 7, map: 8, pause: 9, gear: 11 }, pad2: {} },
    links: { n: ["Linkshänder (IJKL/Ziffernblock)", "Left-handed (IJKL/numpad)"],
      keys: { left: ["KeyJ", "Numpad4"], right: ["KeyL", "Numpad6"], up: ["KeyI", "Numpad8"], down: ["KeyK", "Numpad5"], jump: ["Space", "Numpad0"], roll: ["ShiftRight", "NumpadDecimal"],
        a1: ["KeyU", "Numpad7"], a2: ["KeyO", "Numpad9"], s1: ["KeyY", "Numpad1"], s2: ["KeyP", "Numpad3"], use: ["KeyH", "NumpadEnter"], potion: ["KeyN", "NumpadAdd"], pause: ["Escape", "Backspace"], map: ["KeyM", "NumpadSubtract"], gear: ["KeyB", "NumpadMultiply"] },
      pad: PAD0, pad2: PAD2_0 }
  };
  const inp = (Z.input = { held: {}, pressed: {}, released: {}, mouse: false, device: "keys", touch: false, vib: true, lastPad: null, axis: 0, padName: "", capture: null });
  ACTIONS.forEach(a => { inp.held[a] = false; inp.pressed[a] = false; inp.released[a] = false; });
  const src = { key: {}, pad: {}, touch: {}, mouse: {} };
  function recompute() {
    for (const a of ACTIONS) {
      const h = !!(src.key[a] || src.pad[a] || src.touch[a] || src.mouse[a]);
      if (h && !inp.held[a]) inp.pressed[a] = true;
      if (!h && inp.held[a]) inp.released[a] = true;
      inp.held[a] = h;
    }
  }
  inp.endFrame = () => { for (const a of ACTIONS) { inp.pressed[a] = false; inp.released[a] = false; } if (inp.menu) for (const m in inp.menu) inp.menu[m] = false; /* W20 Steuerung */ };
  inp.consume = a => { inp.pressed[a] = false; };
  /* gespeicherte Belegung */
  const clone = o => JSON.parse(JSON.stringify(o));
  inp.keys = clone(KEYS0); inp.pad = clone(PAD0); inp.pad2 = {}; /* W20 Steuerung */
  /* gespeicherte Belegung nur übernehmen, wenn sie gültig ist (kaputter Speicher darf nichts zerstören) */
  const okCode = c => (typeof c === "string" && /^[A-Za-z][A-Za-z0-9]{1,30}$/.test(c) ? c : null);
  try { const k = JSON.parse(localStorage.getItem("imres-zerstoerer-tasten2") || "null"); if (k && typeof k === "object") for (const a of ACTIONS) if (Array.isArray(k[a])) { const v = [okCode(k[a][0]), okCode(k[a][1])]; if (v[0] || v[1]) inp.keys[a] = v; } } catch (_) {}
  /* F ist jetzt Vollbild: alte Belegung von F auf „Benutzen“ entfernen */
  try { if (!localStorage.getItem("imres-zerstoerer-fmig")) { inp.keys.use = inp.keys.use.map(c => (c === "KeyF" ? "Enter" : c)); localStorage.setItem("imres-zerstoerer-fmig", "1"); } } catch (_) {}
  /* W20 Steuerung: Knöpfe 0–15 (auch Steuerkreuz), null = frei */
  const okBtn = v => Number.isInteger(v) && v >= 0 && v < 16;
  try { const p = JSON.parse(localStorage.getItem("imres-zerstoerer-pad") || "null"); if (p && typeof p === "object") { for (const a in PAD0) if (okBtn(p[a]) || p[a] === null) inp.pad[a] = p[a];
    /* ältere Belegung ohne „Ausrüstung“: liegt der rechte Stick schon auf etwas anderem, bleibt Ausrüstung frei (Ansicht halten geht immer) */
    if (!("gear" in p) && Object.keys(inp.pad).some(a => a !== "gear" && inp.pad[a] === PAD0.gear)) inp.pad.gear = null; } } catch (_) {}
  try { const p = JSON.parse(localStorage.getItem("imres-zerstoerer-pad2") || "null"); if (p && typeof p === "object") for (const a of ACTIONS) if (okBtn(p[a])) inp.pad2[a] = p[a]; } catch (_) {} /* W20 Steuerung */
  /* doppelte Knöpfe aus altem/kaputtem Speicher: dann lieber Standard */
  { const v = [...Object.values(inp.pad), ...Object.values(inp.pad2)].filter(x => x != null); if (new Set(v).size !== v.length) { inp.pad = clone(PAD0); inp.pad2 = {}; } }
  /* Pause muss am Controller erreichbar bleiben */
  if (inp.pad.pause == null && inp.pad2.pause == null) inp.pad.pause = Object.keys(inp.pad).some(a => inp.pad[a] === 9) || Object.values(inp.pad2).includes(9) ? null : 9;
  /* jede Aktion braucht mindestens eine Taste */
  for (const a of ACTIONS) { if (!Array.isArray(inp.keys[a]) || inp.keys[a].length < 2) inp.keys[a] = [(inp.keys[a] || [])[0] || null, (inp.keys[a] || [])[1] || null]; if (!inp.keys[a][0] && !inp.keys[a][1]) inp.keys[a] = KEYS0[a].slice(); }
  /* Tab gehörte früher zur Karte und ist jetzt „Ausrüstung halten“: alte Speicherstände umstellen; Standardtasten der
     Ausrüstung, die der Spieler schon anders vergeben hat, bleiben frei (keine Doppelbelegung) */
  try { if (!localStorage.getItem("imres-zerstoerer-gearmig")) { inp.keys.map = inp.keys.map.map(c => (c === "Tab" ? null : c)); if (!inp.keys.map[0] && !inp.keys.map[1]) inp.keys.map = ["KeyM", null]; localStorage.setItem("imres-zerstoerer-gearmig", "1"); } } catch (_) {}
  inp.keys.gear = inp.keys.gear.map(c => (c && ACTIONS.some(a => a !== "gear" && inp.keys[a].includes(c)) ? null : c));
  let codeMap = {};
  inp.rebuild = () => { codeMap = {}; for (const a of ACTIONS) for (const c of inp.keys[a] || []) if (c) codeMap[c] = a; if (!codeMap.Escape) codeMap.Escape = "pause"; if (!codeMap.ShiftRight && inp.keys.roll.includes("ShiftLeft")) codeMap.ShiftRight = "roll"; };
  inp.rebuild();
  inp.save = () => { try { localStorage.setItem("imres-zerstoerer-tasten2", JSON.stringify(inp.keys)); localStorage.setItem("imres-zerstoerer-pad", JSON.stringify(inp.pad)); localStorage.setItem("imres-zerstoerer-pad2", JSON.stringify(inp.pad2)); } catch (_) {} inp.rebuild(); padBound = null; };
  inp.reset = () => inp.applyPreset("standard");
  /* W20 Steuerung: Vorlagen, Konflikte, Tauschen.
     Plätze: Tastatur slot 0/1 (inp.keys[a][slot]), Controller slot 0 (inp.pad[a]) und 1 (inp.pad2[a]). */
  inp.ACTIONS = ACTIONS; inp.PRESETS = PRESETS;
  inp.applyPreset = (id, part) => { const p = PRESETS[id]; if (!p) return false;
    if (part !== "pad") { inp.keys = clone(p.keys); for (const a of ACTIONS) if (!Array.isArray(inp.keys[a])) inp.keys[a] = KEYS0[a].slice(); }
    if (part !== "keys") { inp.pad = clone(PAD0); for (const a in PAD0) inp.pad[a] = a in p.pad ? p.pad[a] : null; inp.pad2 = clone(p.pad2 || {}); }
    inp.save(); return true; };
  /* welche Vorlage entspricht der aktuellen Belegung? (für die Anzeige) */
  inp.presetOf = part => { for (const id in PRESETS) { const p = PRESETS[id];
      const kOk = ACTIONS.every(a => JSON.stringify(inp.keys[a]) === JSON.stringify(p.keys[a]));
      const nn = v => (v == null ? null : v); /* Koordinator: ohne ?? – alte Engines (Chromium 77/Handheld) */ const pOk = Object.keys(PAD0).every(a => nn(inp.pad[a]) === (a in p.pad ? p.pad[a] : null)) && ACTIONS.every(a => nn(inp.pad2[a]) === nn((p.pad2 || {})[a]));
      if (part === "keys" ? kOk : part === "pad" ? pOk : kOk && pOk) return id; } return null; };
  const getSlot = (kind, a, slot) => (kind === "key" ? (inp.keys[a] || [])[slot] || null : (function (v) { return v == null ? null : v; })(slot ? inp.pad2[a] : inp.pad[a]));
  const putSlot = (kind, a, slot, v) => { if (kind === "key") inp.keys[a][slot] = v; else if (slot) { if (v == null) delete inp.pad2[a]; else inp.pad2[a] = v; } else inp.pad[a] = v; };
  inp.getSlot = getSlot;
  /* wo liegt dieser Wert schon? → { action, slot } (außer am Platz selbst) */
  inp.findBinding = (kind, v, exA, exS) => { if (v == null) return null;
    for (const a of ACTIONS) for (const s of [0, 1]) { if (a === exA && s === exS) continue; if (kind === "pad" && !s && !(a in PAD0)) continue; if (getSlot(kind, a, s) === v) return { action: a, slot: s }; }
    return null; };
  /* belegen: mode "swap" = der andere Platz bekommt die alte Belegung dieses Platzes, sonst wird er frei */
  inp.assign = (kind, action, slot, v, mode) => {
    const old = getSlot(kind, action, slot), c = inp.findBinding(kind, v, action, slot);
    if (c) putSlot(kind, c.action, c.slot, mode === "swap" ? old : null);
    putSlot(kind, action, slot, v);
    /* doppelt in derselben Aktion (Platz 1 = Platz 2) vermeiden */
    if (getSlot(kind, action, 1 - slot) === v && (kind === "key" || action in PAD0)) putSlot(kind, action, 1 - slot, null);
    inp.save(); return c;
  };
  inp.clearSlot = (kind, action, slot) => { putSlot(kind, action, slot, null); inp.save(); };
  /* alte Schnittstelle (andere Module/Tests) */
  inp.setKey = (action, slot, code) => inp.assign("key", action, slot, code, "steal");
  inp.setPad = (action, btn) => inp.assign("pad", action, 0, btn, "swap");
  /* erster belegter Controller-Knopf einer Aktion */
  inp.padOf = a => (inp.pad[a] != null ? inp.pad[a] : inp.pad2[a] != null ? inp.pad2[a] : null);
  let padBound = null; /* Menge der Knöpfe, die Aktionen tragen (Steuerkreuz-Ausnahme) */
  inp.keyName = code => {
    if (!code) return "–";
    const sp = { Space: Z.settings && Z.settings.lang === "en" ? "Space" : "Leertaste", ShiftLeft: "Shift", ShiftRight: "Shift ⇧", ControlLeft: "Strg", ControlRight: "Strg ⇧", AltLeft: "Alt", Escape: "Esc", Enter: "Enter", Tab: "Tab", Backspace: "⌫", ArrowLeft: "←", ArrowRight: "→", ArrowUp: "↑", ArrowDown: "↓", CapsLock: "Caps" };
    if (sp[code]) return sp[code];
    if (code.startsWith("Key")) return code.slice(3);
    if (code.startsWith("Digit")) return code.slice(5);
    if (code.startsWith("Numpad")) return "Num " + code.slice(6);
    return code;
  };
  inp.padButtonName = i => (i == null ? "–" : PADNAMES[i] || "#" + i);
  /* Beschriftung einer Aktion für das aktuelle Gerät */
  inp.label = a => {
    if (inp.device === "pad") return inp.padOf(a) != null ? inp.padButtonName(inp.padOf(a)) : a === "left" || a === "right" ? "◐" : ""; /* W20 Steuerung: auch zweiter Knopf */
    if (inp.device === "touch") return "";
    const k = inp.keys[a] && (inp.keys[a][0] || inp.keys[a][1]);
    return inp.keyName(k);
  };
  addEventListener("keydown", e => {
    if (inp.capture && inp.capture.kind === "key") {
      e.preventDefault();
      if (e.repeat) return;
      /* System- und Browsertasten nicht belegen (Windows-Taste, F5, F11 …) */
      if (/^(Meta|OS|ContextMenu|F5|F11|F12|PrintScreen)/.test(e.code) || !e.code) return;
      const c = inp.capture; inp.capture = null;
      /* W20 Steuerung: Esc bricht ab (außer beim Belegen von Pause); c.onValue entscheidet über Konflikte, sonst direkt belegen */
      const val = e.code !== "Escape" || c.action === "pause" ? e.code : null;
      if (c.onValue) { c.onValue(val); return; }
      if (val) inp.setKey(c.action, c.slot, val);
      c.done && c.done(); return;
    }
    /* Controller-Knopf wird erwartet, aber eine Taste gedrückt: Belegen abbrechen statt Menü zu schließen */
    if (inp.capture && inp.capture.kind === "pad") {
      e.preventDefault(); if (e.repeat) return;
      const c = inp.capture; inp.capture = null; captureArmed = false;
      if (c.onValue) { c.onValue(null); return; } /* W20 Steuerung */
      c.done && c.done(); return;
    }
    if (Z.ui && Z.ui.onKey && Z.ui.onKey(e)) { e.preventDefault(); return; }
    const a = codeMap[e.code]; if (!a) return;
    if (e.target && /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
    e.preventDefault(); if (e.repeat) return;
    src.key[a] = true; inp.device = "keys"; recompute();
  });
  addEventListener("keyup", e => { const a = codeMap[e.code]; if (!a) return; src.key[a] = false; recompute(); });
  /* Fenster verliert den Fokus / Tab wird gewechselt: nichts darf „kleben“ bleiben */
  inp.releaseAll = () => { for (const k in src.key) src.key[k] = false; for (const k in src.mouse) src.mouse[k] = false; for (const k in src.touch) src.touch[k] = false; recompute(); };
  addEventListener("blur", inp.releaseAll);
  document.addEventListener("visibilitychange", () => { if (document.hidden) inp.releaseAll(); });
  /* Maus: links = Waffe 1, rechts = Waffe 2 (nur auf dem Spielfeld) */
  addEventListener("mousedown", e => { if (e.target && e.target.id === "cv") { if (e.button === 0) src.mouse.a1 = true; if (e.button === 2) src.mouse.a2 = true; inp.device = "keys"; recompute(); } });
  addEventListener("mouseup", e => { if (e.button === 0) src.mouse.a1 = false; if (e.button === 2) src.mouse.a2 = false; recompute(); });
  addEventListener("contextmenu", e => { if (e.target && e.target.id === "cv") e.preventDefault(); });
  addEventListener("gamepadconnected", e => { inp.padName = e.gamepad.id || ""; inp.device = "pad"; Z.toast && Z.toast((Z.settings.lang === "en" ? "Controller connected" : "Controller verbunden") + (/xbox|xinput/i.test(inp.padName) ? " (Xbox)" : ""), 2200); });
  addEventListener("gamepaddisconnected", () => { inp.padName = ""; inp.lastPad = null; for (const a of ACTIONS) src.pad[a] = false; recompute(); Z.toast && Z.toast(Z.settings.lang === "en" ? "Controller disconnected" : "Controller getrennt", 2200); });

  /* Gamepad abfragen. Richtungen: linker Stick und Steuerkreuz. Trigger zählen ab halbem Druck. */
  let padPrev = [], captureArmed = false;
  const swallow = new Set(); /* W20 Steuerung */
  /* W20 Steuerung: feste Menüknöpfe (A bestätigt, B zurück, Menü/Start, LB/RB Reiter, RS Ausrüstung) – unabhängig von der
     Spielbelegung, damit ein umbelegter Controller in Menüs nie „verloren“ geht. inp.menu.* = in diesem Bild gedrückt. */
  inp.menu = { ok: false, back: false, start: false, lb: false, rb: false, rs: false, x: false };
  const MENU_BTN = { ok: 0, back: 1, start: 9, lb: 4, rb: 5, rs: 11, x: 2 };
  const padV = { up: false, down: false }; /* Hysterese-Zustand der Stick-Senkrechten */
  inp.pollPad = () => {
    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    let p = null; for (const g of pads) if (g && g.connected && !(Z.koopSkipPad && Z.koopSkipPad(g))) { p = g; break; } /* W27 Koop: Controller von Spieler 2 überspringen */
    for (const a of ACTIONS) src.pad[a] = false;
    if (p) {
      const down = i => { const bt = p.buttons[i]; return !!bt && (bt.pressed || bt.value > 0.45); };
      const now = p.buttons.map((_, i) => down(i));
      /* Belegung einfangen: erst wenn alle Knöpfe losgelassen wurden, dann der nächste Druck */
      /* W20 Steuerung: Knopf wird beim LOSLASSEN übernommen; Menü/Start lange halten (0,8 s) bricht ab, ebenso 10 s nichts.
         Knöpfe, die eine Erfassung beendet haben, zählen bis zum Loslassen nicht (kein „Durchrutschen“ ins Menü). */
      for (const k of [...swallow]) if (!now[k]) swallow.delete(k);
      const tNow = performance.now();
      if (inp.capture && inp.capture.kind === "pad") {
        const c = inp.capture; c.t0 = c.t0 || tNow;
        const finish = v => { inp.capture = null; captureArmed = false; now.forEach((d, k) => d && swallow.add(k)); if (c.onValue) c.onValue(v); else { if (v != null) inp.setPad(c.action, v); c.done && c.done(); } };
        if (!now.some(Boolean)) captureArmed = true;
        if (c.btn == null) { if (captureArmed) { const i = now.findIndex((v, k) => v && !padPrev[k] && k < 16); if (i >= 0) { c.btn = i; c.tb = tNow; } } }
        else if (!now[c.btn]) { const v = c.btn; c.btn = null; finish(v); }
        else if (c.btn === 9 && tNow - c.tb > 800) { c.btn = null; finish(null); }
        if (inp.capture === c && c.btn == null && tNow - c.t0 > 10000) finish(null);
        c.holdK = c.btn === 9 ? Math.min(1, (tNow - c.tb) / 800) : 0;
        padPrev = now; inp.lastPad = p; recompute(); return;
      }
      if (inp.capture && inp.capture.kind === "key") {
        if (now.some((v, k) => v && !padPrev[k])) { const c = inp.capture; inp.capture = null; now.forEach((d, k) => d && swallow.add(k)); for (const a of ACTIONS) src.pad[a] = false; padPrev = now; inp.lastPad = p; recompute(); inp.endFrame(); if (c.onValue) c.onValue(null); else c.done && c.done(); return; }
      }
      for (const k of swallow) now[k] = false;
      captureArmed = false;
      const dz = (Z.settings && Z.settings.dead) || 0.35;
      let ax = p.axes[0] || 0, ay = p.axes[1] || 0;
      /* runde Totzone (kein Eckenzittern) */
      if (Math.hypot(ax, ay) < dz * 0.8) { ax = 0; ay = 0; }
      /* waagrecht: ab Totzone, außer der Stick zeigt fast senkrecht (Leiter klettern ohne seitliches Abrutschen) */
      const horiz = Math.abs(ax) > dz && Math.abs(ax) > Math.abs(ay) * 0.36;
      /* W20 Steuerung: Kreuz-Knopf mit eigener Aktion lenkt nur noch in Menüs */
      if (!padBound) { padBound = new Set(); for (const a in inp.pad) if (inp.pad[a] != null) padBound.add(inp.pad[a]); for (const a in inp.pad2) if (inp.pad2[a] != null && !["left", "right", "up", "down"].includes(a)) padBound.add(inp.pad2[a]); }
      const inMenu = !!(Z.ui && Z.ui.modalOpen), dp = i => now[i] && (inMenu || !padBound.has(i));
      for (const m in MENU_BTN) inp.menu[m] = !!now[MENU_BTN[m]] && !padPrev[MENU_BTN[m]];
      src.pad.left = (horiz && ax < 0) || dp(14); src.pad.right = (horiz && ax > 0) || dp(15);
      /* hoch/runter: Kegel um die Senkrechte (±50°) mit Hysterese – ein leicht nach unten geneigter Laufstick
         löst kein Ducken/Kriechen, Durchfallen oder Schnellfallen mehr aus */
      const vOn = Math.max(0.5, dz), vk = padV;
      const dn = vk.down ? ay > 0.4 && ay > Math.abs(ax) * 0.6 : ay > vOn && ay > Math.abs(ax) * 0.84;
      const upv = vk.up ? ay < -0.4 && -ay > Math.abs(ax) * 0.6 : ay < -vOn && -ay > Math.abs(ax) * 0.84;
      vk.down = dn; vk.up = upv; inp.axis = horiz ? ax : 0;
      src.pad.up = upv || dp(12); src.pad.down = dn || dp(13);
      for (const a in inp.pad) if (now[inp.pad[a]]) src.pad[a] = true;
      for (const a in inp.pad2) if (now[inp.pad2[a]]) src.pad[a] = true; /* W20 Steuerung */
      if (now[9] && inp.padOf("pause") == null) src.pad.pause = true; /* W20 Steuerung: Pause bleibt am Controller immer erreichbar */
      if (now.some(Boolean) || Math.abs(ax) > dz || Math.abs(ay) > 0.5) inp.device = "pad";
      if (!inp.padName) inp.padName = p.id || "";
      inp.lastPad = p; padPrev = now;
    }
    recompute();
  };
  /* ---------- W20 Steuerung: Vibration ----------
     Muster je Ereignis (stark/schwach = die zwei Motoren, ms, Vorrang, Mindestabstand). Alles läuft über Z.vib(art);
     die Stärke kommt aus Z.settings.vibK (0–1, Regler „Vibration“, 0 = aus → kein einziger Aufruf).
     Drossel: je Art ein Mindestabstand, ein laufendes stärkeres Muster wird nicht von schwächeren überschrieben,
     und höchstens ~0,7 s Vibration je Sekunde (kein Dauerbrummen). Gamepad.vibrationActuator (Chrome/Electron),
     sonst hapticActuators[0].pulse (Firefox); Handy-Vibration (navigator.vibrate) wie bisher nur bei Touch. */
  const VIB = {
    tick: { s: 0.05, w: 0.12, ms: 30, p: 0, gap: 0.5 },      /* Fluch, Kleinkram */
    land: { s: 0.1, w: 0.2, ms: 40, p: 0, gap: 0.09 },
    hit: { s: 0.05, w: 0.28, ms: 40, p: 1, gap: 0.07 },      /* Treffer austeilen: leicht */
    hitHeavy: { s: 0.22, w: 0.4, ms: 60, p: 1, gap: 0.08 },
    block: { s: 0.3, w: 0.35, ms: 60, p: 2, gap: 0.1 },
    hurt: { s: 0.5, w: 0.55, ms: 130, p: 3, gap: 0.18 },     /* Treffer einstecken: mittel */
    parry: { s: 0.85, w: 0.25, ms: 45, p: 3, gap: 0.12 },    /* perfekte Parade: kurz, knackig */
    dodge: { s: 0.55, w: 0.15, ms: 35, p: 3, gap: 0.2 },     /* perfektes Ausweichen */
    chest: { seq: [[0.05, 0.3, 70], 60, [0.1, 0.4, 90]], p: 2, gap: 0.4 },  /* Truhe: sanft */
    rune: { seq: [[0.08, 0.3, 90], 50, [0.15, 0.45, 140], 60, [0.08, 0.3, 90]], p: 2, gap: 0.6 },
    reward: { s: 0.15, w: 0.35, ms: 140, p: 2, gap: 0.4 },
    boss: { s: 1, w: 0.7, ms: 240, p: 4, gap: 0.35 },        /* Boss-Großangriff-Einschlag: stark */
    phase: { seq: [[0.9, 1, 260], 90, [0.6, 0.8, 320]], p: 5, gap: 1 },
    death: { seq: [[1, 0.9, 200], 110, [0.55, 0.6, 380]], p: 6, gap: 1.5 },
    test: { seq: [[0.15, 0.4, 90], 140, [0.5, 0.5, 110], 160, [0.95, 0.8, 200]], p: 7, gap: 0.3 }
  };
  inp.VIB = VIB;
  const vibK = () => { const v = Z.settings && Z.settings.vibK; return typeof v === "number" && isFinite(v) ? Math.max(0, Math.min(1, v)) : 0.8; };
  const vs = { last: {}, busyT: 0, busyP: -1, win: [] };
  const freshPad = () => { const p = inp.lastPad; if (!p) return null; try { const g = navigator.getGamepads && navigator.getGamepads()[p.index]; return g && g.connected ? g : p; } catch (_) { return p; } };
  function motor(s, w, ms) {
    const k = vibK(); if (k <= 0) return false;
    const st = Math.min(1, s * k), wk = Math.min(1, w * k); ms = Math.round(ms);
    let ok = false;
    if (inp.device === "pad" || inp.lastPad) {
      const p = freshPad();
      try { const va = p && p.vibrationActuator; if (va && va.playEffect) { const r = va.playEffect("dual-rumble", { startDelay: 0, duration: ms, strongMagnitude: st, weakMagnitude: wk }); if (r && r.catch) r.catch(() => {}); ok = true; } } catch (_) {}
      if (!ok) try { const ha = p && p.hapticActuators && p.hapticActuators[0]; if (ha && ha.pulse) { const r = ha.pulse(Math.max(st, wk), ms); if (r && r.catch) r.catch(() => {}); ok = true; } } catch (_) {}
    }
    if (inp.device === "touch" && navigator.vibrate) try { const d = Math.round(Math.min(80, ms) * (0.4 + 0.6 * k) * Math.max(0.35, Math.max(s, w))); if (d >= 8) { navigator.vibrate(d); ok = true; } } catch (_) {}
    return ok;
  }
  Z.vib = (kind, o) => {
    const d = typeof kind === "string" ? VIB[kind] : kind; if (!d || vibK() <= 0 || (!inp.lastPad && inp.device !== "touch")) return false;
    const t = performance.now() / 1000, id = typeof kind === "string" ? kind : "raw";
    if (vs.last[id] != null && t - vs.last[id] < (d.gap || 0.06)) return false;
    const pr = d.p || 0;
    if (t < vs.busyT && pr < vs.busyP) return false;              /* stärkeres Muster läuft noch */
    const total = d.seq ? d.seq.reduce((n, x) => n + (Array.isArray(x) ? x[2] : x), 0) : d.ms;
    vs.win = vs.win.filter(x => t - x[0] < 1);
    const used = vs.win.reduce((n, x) => n + x[1], 0);
    if (pr < 4 && used + total > 700) return false;                /* Budget je Sekunde (Großes geht immer) */
    vs.last[id] = t; vs.busyT = t + total / 1000; vs.busyP = pr; vs.win.push([t, total]);
    const sc = (o && o.k) || 1;
    if (!d.seq) return motor(d.s * sc, d.w * sc, d.ms);
    let at = 0; for (const x of d.seq) { if (!Array.isArray(x)) { at += x; continue; } const [s, w, ms] = x; if (at === 0) motor(s * sc, w * sc, ms); else setTimeout(() => motor(s * sc, w * sc, ms), at); at += ms; }
    return true;
  };
  /* alte Schnittstelle: rohe Stärke/Dauer, läuft jetzt auch über Regler und Drossel */
  inp.rumble = (s, ms) => Z.vib({ s, w: s * 0.6, ms: ms || 80, p: 1, gap: 0.06 });

  /* Touch: linke Hälfte = schwebender Stick, rechts Knöpfe (werden in spiel.js als DOM gebaut) */
  inp.setTouch = (a, v) => { src.touch[a] = v; inp.device = "touch"; recompute(); };
  inp.clearTouch = () => { for (const k in src.touch) src.touch[k] = false; recompute(); };

  /* ---------------- Ton ---------------- */
  const A = (Z.audio = { ctx: null, buf: {}, loading: {}, vol: { master: 0.9, music: 0.55, sfx: 0.9, amb: 0.7 }, ok: false, loops: {}, lastPlay: {} });
  /* W39 Klang/Leistung: A.live = Effekte, deren Endzeit noch nicht erreicht ist (Lesen wie bisher; Schreiben wird ignoriert) */
  const liveEnd = []; let liveCtx = null;
  function liveAdd(end) { if (liveCtx !== A.ctx) { liveEnd.length = 0; liveCtx = A.ctx; } if (isFinite(end)) liveEnd.push(end); }
  Object.defineProperty(A, "live", { configurable: true, enumerable: true, set(_) {}, get() {
    if (!A.ctx || liveCtx !== A.ctx) return 0;
    const now = A.ctx.currentTime; let j = 0; for (let i = 0; i < liveEnd.length; i++) if (liveEnd[i] > now) liveEnd[j++] = liveEnd[i];
    liveEnd.length = j; return j; } });
  try { const v = JSON.parse(localStorage.getItem("imres-zerstoerer-ton") || "null"); if (v && typeof v === "object") for (const k in A.vol) if (typeof v[k] === "number" && isFinite(v[k])) A.vol[k] = Math.max(0, Math.min(1, v[k])); } catch (_) {}
  /* Ton-Schalter (tonregler.js): Musik bzw. Effekte (samt Kulisse) schnell stumm, die Regler bleiben wie eingestellt */
  A.musAn = () => !window.TonRegler || TonRegler.musik("zerstoerer");
  A.fxAn = () => !window.TonRegler || TonRegler.effekte("zerstoerer");
  if (window.TonRegler) TonRegler.anmelden("zerstoerer", { aendern: () => A.applyVol() });
  A.saveVol = () => { try { localStorage.setItem("imres-zerstoerer-ton", JSON.stringify(A.vol)); } catch (_) {} };
  A.init = () => {
    if (A.ctx) { if (A.ctx.state === "suspended") A.ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    const c = (A.ctx = new AC());
    A.out = c.createDynamicsCompressor(); A.out.threshold.value = -14; A.out.ratio.value = 4; A.out.connect(c.destination);
    A.master = c.createGain(); A.master.gain.value = A.vol.master; A.master.connect(A.out);
    A.sfx = c.createGain(); A.sfx.gain.value = A.fxAn() ? A.vol.sfx : 0;
    /* R9 Gesamtmischung: Effekte-Dichte ausgleichen („Fader-Reiten“, klang.js stellt es ~10× je Sekunde nach der Zahl
       gleichzeitiger Effekte): dichte Kampfphasen bis −4 dB, damit Kampfbeginn/-ende keine Sprünge > 4 dB machen */
    A.ride = c.createGain(); A.ride.gain.value = 1; A.sfx.connect(A.ride); A.ride.connect(A.master);
    A.mus = c.createGain(); A.mus.gain.value = A.musAn() ? A.vol.music : 0; A.mus.connect(A.master);
    A.amb = c.createGain(); A.amb.gain.value = A.fxAn() ? A.vol.amb : 0; A.amb.connect(A.master);
    /* Hall für Höhlen und Hallen: synthetische Impulsantwort */
    A.verb = c.createConvolver(); A.verbGain = c.createGain(); A.verbGain.gain.value = 0.22;
    /* Handheld: kürzere Impulsantwort (die Faltung kostet auf schwachen Kernen spürbar Audio-Rechenzeit) */
    const len = Math.floor(c.sampleRate * (Z.gq && Z.gq.lean ? (Z.gq.mini ? 0.8 : 1.3) : 2.4)), ir = c.createBuffer(2, len, c.sampleRate);
    for (let ch = 0; ch < 2; ch++) { const d = ir.getChannelData(ch); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3.2); }
    A.verb.buffer = ir; A.verb.connect(A.verbGain); A.verbGain.connect(A.master);
    /* R19: Hall-Sendewege hinter den Lautstärkereglern – vorher liefen Effekt- und Musik-Hall an Musik-/Effekte-Regler vorbei
       (bei „alles aus“ blieb ein Rest von −44 dB) */
    A.verbS = c.createGain(); A.verbM = c.createGain(); A.verbA = c.createGain(); for (const n of [A.verbS, A.verbM, A.verbA]) n.connect(A.verb);
    /* Dämpfung bei wenig Leben / Pause: Tiefpass über allem */
    A.lp = c.createBiquadFilter(); A.lp.type = "lowpass"; A.lp.frequency.value = 20000;
    A.master.disconnect(); A.master.connect(A.lp); A.lp.connect(A.out);
    /* Begrenzer am Ende der Kette (hart, −1,5 dBFS): der Kompressor davor (−14 dB, 4:1, weiches Knie) greift im Spiel kaum
       (gemessen ≤ 0,3 dB); gegen seltene Spitzen aus vielen gleichzeitigen Treffern/Stingern schützt erst dieser */
    A.lim = c.createDynamicsCompressor(); A.lim.threshold.value = -1.5; A.lim.knee.value = 0; A.lim.ratio.value = 20; A.lim.attack.value = 0.002; A.lim.release.value = 0.12;
    A.out.disconnect(); A.out.connect(A.lim); A.lim.connect(c.destination);
    A.verbVol(); A.ok = true;
  };
  A.applyVol = () => { if (!A.ctx) return; A.master.gain.value = A.vol.master; A.sfx.gain.value = A.fxAn() ? A.vol.sfx : 0; A.mus.gain.value = A.musAn() ? A.vol.music : 0; A.amb.gain.value = A.fxAn() ? A.vol.amb : 0; A.verbVol(); };
  /* Hall-Sendewege folgen den Reglern (Effekte relativ zu 0,9, Musik zu 0,55, Kulisse zu 0,7 – den Vorgaben, auf die der Hall abgestimmt ist) */
  A.verbVol = () => { if (!A.verbS) return; A.verbS.gain.value = A.fxAn() ? A.vol.sfx / 0.9 : 0; A.verbM.gain.value = A.musAn() ? A.vol.music / 0.55 : 0; A.verbA.gain.value = A.fxAn() ? A.vol.amb / 0.7 : 0; };
  A.setVerb = v => { if (A.ctx) A.verbGain.gain.setTargetAtTime(v, A.ctx.currentTime, 0.4); };
  A.muffle = f => { if (A.ctx) A.lp.frequency.setTargetAtTime(f, A.ctx.currentTime, 0.12); };
  A.load = path => {
    if (A.buf[path] || A.loading[path]) return A.loading[path] || Promise.resolve(A.buf[path]);
    if (!A.ctx) return Promise.resolve(null);
    const p = fetch(path).then(r => (r.ok ? r.arrayBuffer() : Promise.reject(r.status))).then(ab => new Promise((res, rej) => A.ctx.decodeAudioData(ab, res, rej)))
      .then(b => { A.buf[path] = b; return b; }).catch(() => { A.buf[path] = null; return null; });
    A.loading[path] = p; return p;
  };
  A.loadAll = list => Promise.all(list.map(A.load));
  /* Benannte Geräusche: jede Rolle hat mehrere echte Aufnahmen; ausgewählt wird zufällig. */
  const K = n => "klang/" + n + ".mp3", M = n => "amb/" + n + ".mp3";
  const rng = (base, a, b) => { const o = []; for (let i = a; i <= b; i++) o.push(M(base + i)); return o; };
  A.SFX = {
    swing: [K("fx_rp_swing"), K("fx_rp_swing2"), K("fx_ba_swish_2"), K("fx_ba_swish_3"), K("fx_ba_swish_4")].filter(Boolean),
    swingHeavy: [K("fx_wn_keule_fehl"), K("fx_wn_kolben_fehl")],
    slash: [K("fx_wn_schwert"), K("fx_ka_knifeslice"), K("fx_rd_blade_01"), K("fx_rd_blade_02"), K("fx_rd_blade_03")],
    stab: [K("fx_0_fleisch_stich_1"), K("fx_0_fleisch_stich_2"), K("fx_0_fleisch_stich_3"), K("fx_wn_messer"), K("fx_wn_stossz")],
    hitFlesh: [K("fx_0_fleisch_1"), K("fx_0_fleisch_2"), K("fx_0_fleisch_3"), K("fx_0_fleisch_stich_1"), K("fx_0_fleisch_stich_2"), K("fx_0_fleisch_stich_3"), K("fx_hp_hit05"), K("fx_hp_hit08"), K("fx_im_impactsoft_heavy_000"), K("fx_im_impactsoft_heavy_001"), K("fx_im_impactsoft_heavy_003")],
    hitMetal: [K("fx_0_swordhit_10a"), K("fx_0_swordhit_11a"), K("fx_0_swordhit_12b"), K("fx_im_impactmetal_heavy_000"), K("fx_im_impactmetal_heavy_003")],
    hitHeavy: [K("fx_wn_keule"), K("fx_wn_streitkolben"), K("fx_im_impactpunch_heavy_000"), K("fx_im_impactpunch_heavy_001"), K("fx_im_impactpunch_heavy_002"), K("fx_im_impactpunch_heavy_003"), K("fx_wn_flegel")],
    hitBone: rng("n_knochen_", 1, 1).concat(rng("g_untot_", 1, 6)),
    punch: rng("g_faust_", 1, 4).concat([K("fx_wn_faust")]),
    axe: [K("fx_wn_axt"), K("fx_wn_beil")],
    spear: [K("fx_wn_speer"), K("fx_0_speer_1"), K("fx_0_speer_2"), K("fx_0_speer_3"), K("fx_0_speer_4"), K("fx_0_speer_5"), K("fx_0_speer_6"), K("fx_0_pike_1"), K("fx_0_pike_2"), K("fx_0_pike_3"), K("fx_0_pike_4")],
    whip: rng("n_peitsche_", 1, 1),
    bow: [K("fx_wn_bogen"), K("fx_ba_bow"), K("fx_0_bogen_1"), K("fx_0_bogen_2"), K("fx_0_bogen_3"), K("fx_0_bogen_4"), K("fx_0_bogen_5"), K("fx_0_bogen_6")],
    xbow: [K("fx_wn_armbrust"), K("fx_wn_armbrust_feuer")],
    arrowHit: [K("fx_0_pfeil_holz_1"), K("fx_0_pfeil_holz_2"), K("fx_0_pfeil_holz_3"), K("fx_0_pfeil_holz_4"), K("fx_0_pfeil_holz_5"), K("fx_0_pfeil_holz_6"), K("fx_0_pfeil_metall_1"), K("fx_0_pfeil_metall_2"), K("fx_0_pfeil_metall_3"), K("fx_0_pfeil_metall_4"), K("fx_0_arrow_dirt_1"), K("fx_0_arrow_dirt_2"), K("fx_0_arrow_dirt_3"), K("fx_0_arrow_dirt_4")],
    throwK: [K("fx_wn_wurfmesser")],
    block: rng("g_schild_", 1, 5).concat([K("fx_0_schild_metall_1"), K("fx_0_schild_metall_2"), K("fx_0_schild_metall_3"), K("fx_0_schild_metall_4"), K("fx_0_schild_metall_5"), K("fx_0_schild_metall_6")]),
    parry: [K("fx_rp_metal_ringing"), K("fx_0_schild_metall_1"), K("fx_0_schild_metall_2"), K("fx_0_schild_metall_3"), K("fx_0_schild_metall_4"), K("fx_0_schild_metall_5"), K("fx_0_schild_metall_6")],
    jump: rng("g_leder_", 1, 6),
    land: rng("n_steinschritte_", 1, 8),
    step: rng("n_steinschritte_", 1, 8),
    stepWood: rng("n_holzschritte_", 1, 8),
    roll: rng("g_kettenhemd_", 1, 5),
    hurt: [K("fx_wn_mensch_aua_1"), K("fx_wn_mensch_aua_2"), K("fx_wn_mensch_aua_3"), K("fx_wn_mensch_aua_4"), K("fx_wn_mensch_aua_5"), K("fx_cr_hurt_01"), K("fx_cr_hurt_02"), K("fx_cr_hurt_05")],
    potion: [K("fx_wn_trank"), K("fx_rp_bottle")],
    heal: [K("fx_wn_heilung")],
    coin: [K("fx_rp_coin2"), K("fx_rd_item_coins_04")].concat(rng("n_muenzen_", 1, 4)),
    gem: rng("g_edelstein_", 1, 3).concat([K("fx_rd_item_gem_04")]),
    chest: rng("g_truhe_", 1, 3).concat([K("fx_wn_truhe")]),
    door: rng("g_tuerauf_", 1, 3),
    doorClose: rng("g_tuerzu_", 1, 6),
    pickup: [K("fx_rp_sword_unsheathe"), K("fx_rp_sword_unsheathe2"), K("fx_rp_sword_unsheathe3")],
    scroll: rng("g_buch_", 1, 1).concat(rng("e_papier_", 1, 3)),
    magic: rng("g_zauber_", 1, 4).concat([K("fx_rp_magic1"), K("fx_rd_spell_01"), K("fx_rd_spell_02"), K("fx_rd_spell_fire_01"), K("fx_rd_spell_fire_03"), K("fx_rd_spell_fire_04")]),
    fire: [K("fx_wn_feuer"), K("fx_rd_spell_fire_01"), K("fx_rd_spell_fire_03"), K("fx_rd_spell_fire_04"), K("fx_wn_flammen")],
    fireBig: [K("fx_wn_flamme_gross")].concat(rng("n_feuerstoss_", 1, 4)),
    explode: [K("fx_wn_explosion"), K("fx_fo_explosion")],
    poison: [K("fx_wn_gift")],
    holy: [K("fx_wn_heilig_1"), K("fx_wn_heilig_2"), K("fx_wn_heilig_3"), K("fx_wn_heilig_4")],
    dark: [K("fx_wn_dunkel"), K("fx_wn_dunkel_gross")],
    shadow: rng("g_schatten_", 1, 9),
    zap: [K("fx_wn_blitz")],
    thunder: rng("n_donner_", 1, 8),
    rock: rng("g_steinschlag_", 1, 4).concat([K("fx_br_bfh1_rock_breaking_01"), K("fx_br_bfh1_rock_breaking_02"), K("fx_0_stein_treffer_1"), K("fx_0_stein_treffer_2"), K("fx_0_stein_treffer_3"), K("fx_0_stein_treffer_4")]),
    quake: [K("fx_wn_einsturz"), K("fx_0_building_collapse_large_01"), K("fx_0_building_collapse_large_02")],
    glass: rng("g_glasbruch_", 1, 4).concat([K("fx_fo_glass_02"), K("fx_fo_glass_03")]),
    slime: rng("g_schleim_", 1, 4),
    web: [K("fx_wn_verlangsamt")],
    roots: [K("fx_wn_ranken"), K("fx_wn_dornen_1"), K("fx_wn_dornen_2")],
    splash: rng("n_platsch_", 1, 8),
    bite: [K("fx_wn_biss")],
    claw: [K("fx_wn_klauen")],
    roar: [K("fx_cr2_roar_04"), K("fx_cr2_roar_05"), K("fx_cr2_roar_06"), K("fx_rd_creature_roar_02"), K("fx_rd_creature_roar_03"), K("fx_cr_scream_01"), K("fx_cr_scream_02")],
    dragon: [K("fx_wn_drache_1"), K("fx_wn_drache_2"), K("fx_wn_drache_3"), K("fx_wn_drache_tod")].concat(rng("n_drache_", 1, 5)),
    goblin: rng("e_goblin_", 1, 4),
    monster: rng("n_monster_", 1, 8),
    undead: rng("g_untot_", 7, 23),
    die: [K("fx_wn_mensch_tod_1"), K("fx_wn_mensch_tod_2"), K("fx_wn_mensch_tod_3"), K("fx_cr2_die_02"), K("fx_cr2_die_03"), K("fx_cr2_die_04")],
    rat: rng("n_ratte_", 1, 6),
    wolf: rng("n_wolf_", 1, 6),
    bat: rng("n_fledermaus_", 1, 8),
    bark: rng("e_bellen_", 1, 5),
    insect: rng("e_insekt_", 1, 6),
    laugh: rng("n_lachen_boese_", 1, 3),
    bell: rng("n_glocke_", 1, 4),
    gong: [K("gong")],
    anvil: [K("amboss")],
    horn: [K("fx_wn_horn_1"), K("fx_wn_horn_2"), K("fx_wn_horn_3"), K("fx_wn_horn_4"), K("fx_wn_horn_5"), K("fx_wn_horn_6")],
    chain: rng("g_kette_", 1, 2).concat(rng("n_kette_", 1, 4)),
    break: rng("g_holzbruch_", 1, 7),
    crate: rng("g_holzbruch_", 1, 7),
    rune: [K("fx_rp_magic1"), K("fx_rd_spell_01"), K("fx_rd_spell_02"), K("fx_rd_spell_fire_01"), K("fx_rd_spell_fire_03"), K("fx_rd_spell_fire_04")],
    unsheathe: [K("fx_rp_sword_unsheathe4"), K("fx_rp_sword_unsheathe5")],
    ui: [K("clave1"), K("clave2")],
    uiOk: [K("glock_91")],
    crit: [K("fx_0_swordhit_13a"), K("fx_0_swordhit_13b")]
  };
  /* W39 Leistung: Rollen in A.lazy (z. B. Wunder-Ereignisse, die ihre Klänge beim Start selbst vorladen) nicht beim Spielstart dekodieren –
     sparte ~40 MB dekodiertes PCM (von 182 MB) und ~90 gleichzeitige Dekodierungen in der ersten Sekunde */
  A.lazy = A.lazy || {};
  A.allSfxPaths = () => { const s = new Set(); for (const k in A.SFX) if (!A.lazy[k]) A.SFX[k].forEach(p => s.add(p)); return [...s]; };
  /* spielt ein benanntes Geräusch: vol, rate (Tonhöhe), pan, verb (Hallanteil), wo (Weltposition für Stereo/Lautstärke) */
  A.play = (name, o) => {
    if (!A.ok || Z.quiet) return;
    o = o || {};
    /* Umleitung für Untergrund-Schritte u. a. (klang.js setzt A.hook[name]; true = dort erklungen) */
    if (A.hook && A.hook[name] && !o.noHook) { try { if (A.hook[name](o)) return; } catch (_) {} }
    const list = A.SFX[name] || [name];
    const now = A.ctx.currentTime;
    const key = name + (o.tag || "");
    if (A.lastPlay[key] && now - A.lastPlay[key] < (o.gap != null ? o.gap : 0.035)) return; /* nicht zu oft dasselbe */
    A.lastPlay[key] = now;
    /* R13: Häufung desselben Geräuschs (z. B. 16 Splitter einer Nova, Glas im Sekundentakt): ab dem 4. Mal binnen 0,4 s
       leiser, ab dem 9. still – der erste Schlag bleibt voll, die Kaskade wird zum Rieseln statt zum Dauerfeuer */
    /* R19 Warnklänge (Telegrafie: Gegner-Ausholen, Boss-Großangriff im Ansatz, Fallen, Einsturz) kommen immer durch: keine Häufungs-/
       Gedränge-Dämpfung, keine Handheld-Grenze; beim Boss-Ansatz weicht die Musik kurz */
    const bmv = Z.boss && Z.boss.mv, warn = !!(o.warn || (bmv && bmv.stage === "pre" && (bmv.t || 0) < 0.05 && !o.tag));
    if (warn && bmv && bmv.stage === "pre" && Z.music && Z.music.duck && !(A.warnDuck > now - 0.5)) { A.warnDuck = now; Z.music.duck(0.35, 0.5); }
    if (warn) o = Object.assign({}, o, { must: true });
    const hd = A.dense || (A.dense = {}), h = hd[key] && now - hd[key].t < 0.4 ? hd[key] : (hd[key] = { t: now, n: 0 });
    h.n++; let dense = h.n <= 3 ? 1 : h.n <= 8 ? 0.55 : 0;
    /* R19 Dauerfeuer über längere Zeit (Botlauf: „monster“ bis 60×/s, Netz 6×/s): mehr als 10 Aufrufe in einer Sekunde → für den Rest
       der Sekunde höchstens alle 0,25 s und leiser; die ersten bleiben voll, Warnklänge ausgenommen */
    const hs = A.denseS || (A.denseS = {}), w1 = hs[key] && now - hs[key].t < 1 ? hs[key] : (hs[key] = { t: now, n: 0, last: -9 });
    w1.n++; if (w1.n > 10 && !o.must) { if (now - w1.last < 0.25) return; dense = Math.min(dense || 0.55, 0.55); }
    w1.last = now;
    if (!dense && !o.must) return;
    const path = list[Math.floor(Math.random() * list.length)];
    const b = A.buf[path];
    if (!b) { if (b === undefined) A.load(path); return; }
    /* Handheld: höchstens 10 (minimal 7) Effekte gleichzeitig – der Audio-Thread der kleinen ARM-Kerne kommt sonst nicht nach */
    const q = Z.gq || {};
    if (q.lean && A.live >= (q.mini ? 7 : 10) && !o.must) return;
    /* R15: Gedränge – klingen schon mehr als 12 Effekte (Desktop ohne Stimmengrenze, späte Läufe mit Bogen/Wurfmessern/Krits:
       bis 32 gleichzeitig, Bugbear-Kampf -11 LUFS/0 dBFS), wird jeder neue Effekt um √(12/live) leiser; Handheld (Grenze 10/7) unberührt */
    const crowd = A.live > 12 && !o.must ? Math.sqrt(12 / A.live) : 1;
    let vol = (o.vol == null ? 1 : o.vol) * (o.must ? 1 : dense) * crowd, pan = o.pan || 0;
    if (o.x != null && Z.cam) {
      const dx = o.x - (Z.cam.x + Z.cam.w / 2), dy = (o.y || 0) - (Z.cam.y + Z.cam.h / 2);
      pan = U.clamp(dx / (Z.cam.w * 0.6), -0.9, 0.9);
      vol *= U.clamp(1.25 - Math.hypot(dx, dy) / (Z.cam.w * 0.85), 0, 1);
      if (vol < 0.02) return;
    }
    /* ungültige Werte (z. B. NaN-Position eines Gegners) würden AudioParam-Fehler werfen */
    if (!isFinite(vol)) return;
    if (!isFinite(pan)) pan = 0;
    let rate = (o.rate || 1) * (1 + (Math.random() - 0.5) * (o.vary == null ? 0.12 : o.vary));
    if (!isFinite(rate) || rate <= 0) rate = 1;
    const s = A.ctx.createBufferSource(); s.buffer = b;
    s.playbackRate.value = rate;
    const g = A.ctx.createGain(); g.gain.value = vol;
    const p = A.ctx.createStereoPanner ? A.ctx.createStereoPanner() : null;
    s.connect(g); if (p) { p.pan.value = pan; g.connect(p); p.connect(o.bus || A.sfx); } else g.connect(o.bus || A.sfx);
    if (o.verb !== 0) {
      const vv = isFinite(o.verb) && o.verb ? o.verb : 0.6;
      /* „Handheld minimal“: Hall über wenige gemeinsame Sende-Wege (gestuft) statt eines eigenen Gain-Knotens je Geräusch
         (A.bundleVerb: Prüfschalter für Vorher/Nachher-Messungen, sonst nicht gesetzt) */
      if (A.bundleVerb != null ? A.bundleVerb : q.mini) g.connect(verbSend(vv));
      else { const vg = A.ctx.createGain(); vg.gain.value = vv; g.connect(vg); vg.connect((o.bus === A.amb ? A.verbA : o.bus === A.mus ? A.verbM : A.verbS) || A.verb); }
    }
    const t0 = now + (isFinite(o.delay) ? Math.max(0, o.delay) : 0), off0 = isFinite(o.offset) ? Math.max(0, o.offset) : 0;
    /* W39 Klang/Leistung: Zahl klingender Effekte aus den Endzeiten statt aus onended – im 22-min-Lauf (mit erzwungener Speicherbereinigung)
       gingen Ende-Ereignisse verloren und A.live kroch auf 16 (Ruhe!): Handheld-Grenze 10 hätte alle normalen Effekte gesperrt, Fader −4 dB */
    liveAdd(o.dur && isFinite(o.dur) ? t0 + o.dur + 0.02 : t0 + Math.max(0, b.duration - off0) / rate);
    s.start(t0, off0);
    /* Länge begrenzen (ausblenden) – erst nach start(), sonst wirft stop() einen Fehler; relativ zum Einsatz */
    if (o.dur && isFinite(o.dur)) { g.gain.setValueAtTime(vol, t0 + o.dur * 0.7); g.gain.linearRampToValueAtTime(0, t0 + o.dur); s.stop(t0 + o.dur + 0.02); }
    return s;
  };
  /* gemeinsame Hall-Sende-Wege (Stufen 0,3 / 0,45 / 0,6 / 0,8 / 1): einmal angelegt, von allen Geräuschen geteilt */
  const VSTEP = [0.3, 0.45, 0.6, 0.8, 1];
  function verbSend(v) {
    let k = 0; for (let i = 1; i < VSTEP.length; i++) if (Math.abs(VSTEP[i] - v) < Math.abs(VSTEP[k] - v)) k = i;
    if (A.vsendCtx !== A.ctx) { A.vsend = []; A.vsendCtx = A.ctx; } /* neuer Kontext (z. B. Prüfstand mit OfflineAudioContext): Sende-Wege neu anlegen */
    const S = A.vsend;
    if (!S[k]) { S[k] = A.ctx.createGain(); S[k].gain.value = VSTEP[k]; S[k].connect(A.verbS || A.verb); }
    return S[k];
  }
  /* Endlosschleifen (Geräuschkulisse der Bühne): mit Überblendung */
  A.loop = (id, path, vol, bus) => {
    if (!A.ok) return;
    const cur = A.loops[id];
    if (cur && cur.path === path) { cur.g.gain.setTargetAtTime(vol, A.ctx.currentTime, 0.8); cur.vol = vol; return; }
    if (cur) A.stopLoop(id);
    const rec = (A.loops[id] = { path, vol, g: A.ctx.createGain(), s: null });
    rec.g.gain.value = 0; rec.g.connect(bus || A.amb);
    A.load(path).then(b => {
      if (!b || A.loops[id] !== rec) return;
      const s = A.ctx.createBufferSource(); s.buffer = b; s.loop = true; s.connect(rec.g);
      s.start(0, Math.random() * Math.max(0, b.duration - 1)); rec.s = s;
      rec.g.gain.setTargetAtTime(rec.vol, A.ctx.currentTime, 1.2);
    });
  };
  A.loopVol = (id, vol, t) => { const r = A.loops[id]; if (r && A.ctx) { r.vol = vol; r.g.gain.setTargetAtTime(vol, A.ctx.currentTime, t || 0.6); } };
  A.stopLoop = (id, t) => {
    const r = A.loops[id]; if (!r) return; delete A.loops[id];
    r.g.gain.setTargetAtTime(0, A.ctx.currentTime, t || 0.6);
    setTimeout(() => { try { r.s && r.s.stop(); r.g.disconnect(); } catch (_) {} }, 4000);
  };
  A.stopAllLoops = t => { for (const id in A.loops) A.stopLoop(id, t); };

  /* ---------------- Partikel und Effekte ---------------- */
  const FX = (Z.fx = { parts: [], texts: [], shake: 0, shakeX: 0, shakeY: 0, hitstop: 0, flash: 0, flashCol: "#fff", slow: 0, slowT: 0, zoom: 1, zoomT: 1, rings: [], smears: [] });
  const MAXP = 1400;
  /* p: x,y,vx,vy,life,size,col,g(gravity),drag,kind ('dot','spark','smoke','ember','shard','glow','ring','bubble','leaf','drop'),add(blend) */
  FX.p = o => {
    const q = Z.gq && Z.gq.part != null ? Z.gq.part : 1;
    if (q < 1 && !o.keep && Math.random() > q) return o;
    if (FX.parts.length > MAXP * Math.max(0.3, q)) FX.parts.splice(0, 80);
    o.t = 0; o.life = o.life || 0.5; o.size = o.size || 2; o.g = o.g || 0; o.drag = o.drag == null ? 0.9 : o.drag; o.kind = o.kind || "dot"; o.a = o.a == null ? 1 : o.a;
    o.rot = o.rot || 0; o.vr = o.vr || 0; FX.parts.push(o); return o;
  };
  FX.burst = (x, y, n, o) => {
    for (let i = 0; i < n; i++) {
      const ang = o.ang != null ? o.ang + (Math.random() - 0.5) * (o.spread == null ? Math.PI * 2 : o.spread) : Math.random() * Math.PI * 2;
      const sp = (o.sp || 80) * (0.35 + Math.random() * 0.9);
      FX.p({ x: x + (Math.random() - 0.5) * (o.jit || 0), y: y + (Math.random() - 0.5) * (o.jit || 0), vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp - (o.up || 0),
        life: (o.life || 0.5) * (0.6 + Math.random() * 0.7), size: (o.size || 2) * (0.6 + Math.random() * 0.8), col: Array.isArray(o.col) ? o.col[(Math.random() * o.col.length) | 0] : o.col,
        g: o.g || 0, drag: o.drag, kind: o.kind, add: o.add, vr: (Math.random() - 0.5) * 12 });
    }
  };
  FX.text = (x, y, txt, col, big) => {
    FX.texts.push({ x: x + (Math.random() - 0.5) * 14, y: y - Math.random() * 8, txt: String(txt), col: col || "#fff", t: 0, life: big ? 1.1 : 0.8, big: !!big, vy: big ? -46 : -34 });
    if (FX.texts.length > 60) FX.texts.shift();
  };
  FX.ring = (x, y, r, col, life, w) => FX.rings.push({ x, y, r0: 2, r, col, t: 0, life: life || 0.35, w: w || 2 });
  FX.smear = o => { o.t = 0; FX.smears.push(o); }; /* Sichelförmige Schlagspur */
  /* Bildschirmwackeln: Rohwert sammeln, die Stärke-Einstellung (Z.shakeK) wirkt zentral in FX.update */
  FX.addShake = (v, cap) => { FX.shake = Math.min(Math.max(FX.shake, v), cap || 10); };
  /* Trefferstopp, Bildschirmblitz und Zeitlupe laufen durch die Komfort-Faktoren (Einstellungen → Komfort & Barrierefreiheit) */
  FX.stop = (t) => { t = (+t || 0) * Z.slowK(); if (t > 0.004) FX.hitstop = Math.max(FX.hitstop, t); };
  FX.flashScreen = (col, a) => { a = (+a || 0) * Z.flashK(); if (a < 0.01) return; FX.flashCol = col; FX.flash = Math.max(FX.flash, a); };
  FX.slowmo = (f, t) => {
    const k = Z.slowK(); if (k <= 0) return;
    if (k < 1) { f = 1 - (1 - f) * k; t = t * (0.5 + 0.5 * k); }
    FX.slow = f; FX.slowT = t;
  };
  FX.update = dt => {
    for (let i = FX.parts.length - 1; i >= 0; i--) {
      const p = FX.parts[i]; p.t += dt;
      if (p.t >= p.life) { FX.parts.splice(i, 1); continue; }
      p.vy += p.g * dt; const dr = Math.pow(p.drag, dt * 60); p.vx *= dr; p.vy *= dr;
      p.x += p.vx * dt; p.y += p.vy * dt; p.rot += p.vr * dt;
      if (p.collide && Z.world && Z.world.solidAt(p.x, p.y)) { p.y -= p.vy * dt; p.vy *= -0.3; p.vx *= 0.6; if (p.kind === "drop") { p.t = p.life; FX.burst(p.x, p.y - 1, 2, { sp: 30, col: p.col, life: 0.25, size: 1, g: 300 }); } }
    }
    for (let i = FX.texts.length - 1; i >= 0; i--) { const t = FX.texts[i]; t.t += dt; t.y += t.vy * dt; t.vy *= Math.pow(0.9, dt * 60); if (t.t > t.life) FX.texts.splice(i, 1); }
    for (let i = FX.rings.length - 1; i >= 0; i--) { const r = FX.rings[i]; r.t += dt; if (r.t > r.life) FX.rings.splice(i, 1); }
    for (let i = FX.smears.length - 1; i >= 0; i--) { const s = FX.smears[i]; s.t += dt; if (s.t > s.life) FX.smears.splice(i, 1); }
    FX.shake = Math.max(0, FX.shake - dt * 38);
    const sh = FX.shake * Z.shakeK();
    FX.shakeX = (Math.random() - 0.5) * sh; FX.shakeY = (Math.random() - 0.5) * sh;
    FX.flash = Math.max(0, FX.flash - dt * 3);
    if (FX.slowT > 0) { FX.slowT -= dt; if (FX.slowT <= 0) FX.slow = 0; }
  };
  FX.draw = (c, front) => {
    for (const p of FX.parts) {
      if (!!p.front !== !!front) continue;
      const k = 1 - p.t / p.life, a = p.a * (p.fade === false ? 1 : k);
      c.globalAlpha = a;
      if (p.add) c.globalCompositeOperation = "lighter";
      c.fillStyle = p.col;
      switch (p.kind) {
        case "spark": {
          c.strokeStyle = p.col; c.lineWidth = p.size * 0.6; c.beginPath(); c.moveTo(p.x, p.y); c.lineTo(p.x - p.vx * 0.03, p.y - p.vy * 0.03); c.stroke(); break;
        }
        case "smoke": { const r = p.size * (1 + (1 - k) * 1.8); c.globalAlpha = a * 0.45; c.beginPath(); c.arc(p.x, p.y, r, 0, 6.283); c.fill(); break; }
        case "glow": { const r = p.size * (0.6 + k * 0.6); if (Z.glowSprite) c.drawImage(Z.glowSprite(p.col), p.x - r, p.y - r, r * 2, r * 2); break; }
        case "shard": { c.save(); c.translate(p.x, p.y); c.rotate(p.rot); c.fillRect(-p.size, -p.size * 0.35, p.size * 2, p.size * 0.7); c.restore(); break; }
        case "leaf": { c.save(); c.translate(p.x, p.y); c.rotate(p.rot); c.beginPath(); c.ellipse(0, 0, p.size, p.size * 0.45, 0, 0, 6.283); c.fill(); c.restore(); break; }
        case "bubble": { c.strokeStyle = p.col; c.lineWidth = 0.8; c.beginPath(); c.arc(p.x, p.y, p.size, 0, 6.283); c.stroke(); break; }
        case "drop": { c.fillRect(p.x - 0.5, p.y - p.size, 1, p.size * 1.6); break; }
        case "rain": { c.strokeStyle = p.col; c.lineWidth = 0.7; c.beginPath(); c.moveTo(p.x, p.y); c.lineTo(p.x - p.vx * 0.02, p.y - p.vy * 0.02); c.stroke(); break; }
        default: { const s = p.size * (p.shrink === false ? 1 : 0.4 + k * 0.6); c.fillRect(p.x - s / 2, p.y - s / 2, s, s); }
      }
      if (p.add) c.globalCompositeOperation = "source-over";
    }
    c.globalAlpha = 1;
    if (!front) return;
    for (const r of FX.rings) {
      const k = r.t / r.life; c.globalAlpha = 1 - k; c.strokeStyle = r.col; c.lineWidth = r.w * (1 - k) + 0.5;
      c.beginPath(); c.arc(r.x, r.y, U.lerp(r.r0, r.r, U.easeOut(k)), 0, 6.283); c.stroke();
    }
    c.globalAlpha = 1;
  };
  FX.drawSmears = c => {
    c.globalCompositeOperation = "lighter";
    for (const s of FX.smears) {
      const k = s.t / s.life, a = (1 - k) * (s.a || 0.9);
      c.save(); c.translate(s.x, s.y); c.scale(s.dir, 1); c.rotate(s.rot || 0);
      const r = s.r, th = s.th || 6;
      const a0 = s.a0, a1 = U.lerp(s.a0, s.a1, Math.min(1, k * 3.5 + 0.35));
      c.globalAlpha = a;
      c.fillStyle = s.col;
      c.beginPath(); c.arc(0, 0, r, a0, a1, s.a1 < s.a0); c.arc(0, 0, Math.max(1, r - th * (1 - k * 0.5)), a1, a0, !(s.a1 < s.a0)); c.closePath(); c.fill();
      if (s.core) { c.globalAlpha = a * 0.9; c.fillStyle = s.core; c.beginPath(); c.arc(0, 0, r - 0.5, a0, a1, s.a1 < s.a0); c.arc(0, 0, r - th * 0.35, a1, a0, !(s.a1 < s.a0)); c.closePath(); c.fill(); }
      c.restore();
    }
    c.globalAlpha = 1; c.globalCompositeOperation = "source-over";
    for (const t of FX.texts) {
      const k = t.t / t.life; c.globalAlpha = k > 0.7 ? (1 - k) / 0.3 : 1;
      const sz = t.big ? 11 : 8; const pop = t.t < 0.08 ? 1 + (0.08 - t.t) * 8 : 1;
      c.font = "800 " + (sz * pop).toFixed(1) + "px 'Alegreya Sans',sans-serif"; c.textAlign = "center";
      c.lineWidth = 2.5; c.strokeStyle = "rgba(0,0,0,.85)"; c.strokeText(t.txt, t.x, t.y); c.fillStyle = t.col; c.fillText(t.txt, t.x, t.y);
    }
    c.globalAlpha = 1;
  };

  /* ---------------- Kamera ---------------- */
  const cam = (Z.cam = { x: 0, y: 0, w: 480, h: 270, tx: 0, ty: 0, look: 0, lookY: 0, bounds: null, lock: null });
  cam.snap = (x, y) => { cam.x = x - cam.w / 2; cam.y = y - cam.h / 2; cam.clamp(); };
  cam.clamp = () => {
    const b = cam.bounds; if (!b) return;
    if (b.w <= cam.w) cam.x = b.x + (b.w - cam.w) / 2; else cam.x = U.clamp(cam.x, b.x, b.x + b.w - cam.w);
    if (b.h <= cam.h) cam.y = b.y + (b.h - cam.h) / 2; else cam.y = U.clamp(cam.y, b.y, b.y + b.h - cam.h);
  };
  cam.update = (dt, p) => {
    if (!p) return;
    /* Blick voraus in Laufrichtung, vertikal mit Totzone, beim Fallen weiter nach unten schauen */
    /* stetig statt sprunghaft: Vorlauf wächst mit der Laufgeschwindigkeit, kurzes Antippen/Wenden reißt die Kamera nicht herum */
    const run = Math.min(1, Math.abs(p.vx) / 156);
    const wantLook = p.face * (26 + 26 * run * run);
    cam.look = U.approach(cam.look, wantLook, dt * (Math.sign(wantLook) !== Math.sign(cam.look) ? 70 : 90));
    /* beim Fallen stufenlos nach unten vorausblicken (ab ~200 px/s, voll bei Endgeschwindigkeit) */
    const fall = U.clamp((p.vy - 200) / 230, 0, 1);
    let wantY = fall > 0 && !p.onGround && !p.climbing ? -10 + 62 * fall : p.lookDown ? 60 : p.lookUp ? -50 : -10;
    cam.lookY = U.approach(cam.lookY, wantY, dt * (fall > 0 ? 220 : 120));
    let tx = p.x + p.w / 2 + cam.look - cam.w / 2, ty = p.y + (p.stepOff || 0) + p.h / 2 + cam.lookY - cam.h / 2; /* stepOff: Treppenstufen weich (kampf.js) */
    if (cam.lock) { tx = U.lerp(tx, cam.lock.x - cam.w / 2, cam.lock.k); ty = U.lerp(ty, cam.lock.y - cam.h / 2, cam.lock.k); }
    const kx = 1 - Math.pow(0.0009, dt), ky = 1 - Math.pow(p.onGround || p.climbing ? 0.0006 : 0.004, dt);
    cam.x += (tx - cam.x) * kx; cam.y += (ty - cam.y) * ky;
    cam.clamp();
  };

  /* ---------------- Einstellungen ---------------- */
  Z.settings = { shake: 1, lang: "de", touchSize: 1, showDmg: true, flashes: true, autoAim: true, fps: false,
    blitze: "voll", zeitlupe: "voll", kontrast: false, gnade: false, schnellstart: false };
  const hadStore = (() => { try { const v = JSON.parse(localStorage.getItem("imres-zerstoerer-einst") || "{}"); return v && typeof v === "object" ? v : {}; } catch (_) { return {}; } })();
  try { const v = JSON.parse(localStorage.getItem("imres-zerstoerer-einst") || "{}"); if (v && typeof v === "object" && !Array.isArray(v)) Object.assign(Z.settings, v); } catch (_) {}
  /* Werte prüfen: kaputter oder alter Speicher darf das Spiel nicht lahmlegen */
  {
    const S = Z.settings, num = (k, a, b, d) => { S[k] = typeof S[k] === "number" && isFinite(S[k]) ? Math.max(a, Math.min(b, S[k])) : d; };
    num("shake", 0, 1, 1); num("touchSize", 0.7, 1.4, 1); if (S.dead != null) num("dead", 0.15, 0.6, 0.35);
    if (S.lang !== "de" && S.lang !== "en") S.lang = "de";
    for (const k of ["showDmg", "flashes", "autoAim"]) if (typeof S[k] !== "boolean") S[k] = true;
    if (typeof S.fps !== "boolean") S.fps = false;
    /* Komfort & Barrierefreiheit: alte Speicherstände (nur „flashes“ an/aus) übernehmen */
    if (hadStore.blitze === undefined && hadStore.flashes === false) S.blitze = "aus";
    if (!["voll", "sanft", "aus"].includes(S.blitze)) S.blitze = "voll";
    if (!["voll", "sanft", "aus"].includes(S.zeitlupe)) S.zeitlupe = "voll";
    for (const k of ["kontrast", "gnade", "schnellstart"]) if (typeof S[k] !== "boolean") S[k] = false;
    S.flashes = S.blitze !== "aus";
  }
  try { const s = localStorage.getItem("imres-lang"); if (!localStorage.getItem("imres-zerstoerer-einst") && (s === "de" || s === "en")) Z.settings.lang = s; } catch (_) {}
  Z.saveSettings = () => { try { Z.settings.flashes = Z.settings.blitze !== "aus"; localStorage.setItem("imres-zerstoerer-einst", JSON.stringify(Z.settings)); } catch (_) {} };

  /* ---------------- Komfort & Barrierefreiheit: zentrale Faktoren ----------------
     Jede Stelle, die wackelt, blitzt oder die Zeit anhält, fragt hier nach – nie die Einstellung direkt.
     Z.shakeK()        Bildschirmwackeln 0…1 (Regler 0–100 %)
     Z.flashK()        Vollbild-/Trefferblitze: voll 1 · gedämpft 0,3 · aus 0
     Z.flashK("licht") örtliche Lichtblitze (Treffer, Gewitter, Explosionen): voll 1 · gedämpft 0,5 · aus 0,2 (Licht bleibt lesbar, blitzt nicht)
     Z.slowK()         Zeitlupe & Trefferstopp: voll 1 · sanft 0,5 · aus 0
     Z.dangerHi()      Kontrastmodus für Gefahren (kräftige Umrisse + Warnschraffur)
     Z.mercy()         Hilfsmodus „Barmherzigkeit“ aktiv */
  Z.shakeK = () => { const v = Z.settings && Z.settings.shake; return typeof v === "number" && isFinite(v) ? Math.max(0, Math.min(1, v)) : 1; };
  Z.flashK = kind => { const m = Z.settings ? Z.settings.blitze || (Z.settings.flashes === false ? "aus" : "voll") : "voll"; if (kind === "licht") return m === "aus" ? 0.2 : m === "sanft" ? 0.5 : 1; return m === "aus" ? 0 : m === "sanft" ? 0.3 : 1; };
  Z.slowK = () => { const m = Z.settings && Z.settings.zeitlupe; return m === "aus" ? 0 : m === "sanft" ? 0.5 : 1; };
  Z.dangerHi = () => !!(Z.settings && Z.settings.kontrast);
  Z.mercy = () => !!(Z.settings && Z.settings.gnade);
  /* Lichtblitze (bild.js setzt Z.flashLight beim Gewitter, Z.lightFlash für Treffer-/Explosionslicht) werden beim Setzen gedämpft –
     so braucht keine Zeichenstelle eigene Abfragen. Abklingen (kleinere Werte) geht unverändert durch. */
  {
    let fl = 0, lf = null, lfRaw = null;
    Object.defineProperty(Z, "flashLight", { configurable: true, enumerable: true, get: () => fl, set: v => { v = +v || 0; fl = v > fl ? fl + (v - fl) * Z.flashK("licht") : v; } });
    Object.defineProperty(Z, "lightFlash", { configurable: true, enumerable: true, get: () => lf,
      set: fn => { lfRaw = fn; lf = typeof fn === "function" ? function (x, y, r, col, a, life) { return lfRaw.call(this, x, y, r, col, (a == null ? 0.7 : a) * Z.flashK("licht"), life); } : fn; } });
  }
  /* W20 Steuerung: Vibrationsstärke 0–1 (alter Schalter „vib: false“ → 0); inp.vib bleibt als „an?“ für ältere Stellen */
  { const S = Z.settings; if (!(typeof S.vibK === "number" && isFinite(S.vibK))) S.vibK = S.vib === false ? 0 : 0.8; S.vibK = Math.max(0, Math.min(1, S.vibK)); S.vib = S.vibK > 0; }
  inp.vib = Z.settings.vibK > 0;
  Z.setVibK = v => { Z.settings.vibK = Math.max(0, Math.min(1, +v || 0)); Z.settings.vib = Z.settings.vibK > 0; inp.vib = Z.settings.vib; };

  /* ---------- W22 Geist: Leinwand-Lesetest und zentrale Cache-Erneuerung ----------
     Brave (Shields „Fingerprinting blockieren“), Firefox resistFingerprinting, Tor u. a. verfälschen getImageData
     (leere, verrauschte oder weiße Daten). Die Sprite-Zwischenspeicher (Stufe 0: Ezekiel, Figuren, Gegner) suchen den
     benutzten Bereich per Rücklesen – liefert das Nullen, gelten die Teile als „leer“ und werden nie gezeichnet
     (unsichtbarer Spieler, unsichtbare Lagerfiguren). Z.canvasLesbar() prüft einmal mit einem bekannten Muster. */
  let lesbar = null;
  Z.canvasLesbar = function (neu) {
    if (lesbar !== null && !neu) return lesbar;
    try {
      const cv = document.createElement("canvas"); cv.width = 8; cv.height = 8;
      const g = cv.getContext("2d", { willReadFrequently: true });
      g.clearRect(0, 0, 8, 8); g.fillStyle = "#c81e32"; g.fillRect(2, 2, 3, 3);
      const d = g.getImageData(0, 0, 8, 8).data;
      let ok = true;
      for (let y = 0; y < 8 && ok; y++) for (let x = 0; x < 8; x++) {
        const i = (y * 8 + x) * 4, inn = x >= 2 && x < 5 && y >= 2 && y < 5;
        if (inn ? d[i + 3] < 250 || Math.abs(d[i] - 200) > 6 || d[i + 1] > 40 || Math.abs(d[i + 2] - 50) > 6 : d[i + 3] > 2) { ok = false; break; }
      }
      lesbar = ok;
    } catch (e) { lesbar = false; }
    if (!lesbar) try { Z.diag && Z.diag.note && Z.diag.note("Leinwand-Rücklesen verfälscht (Datenschutz-Schutz?) → Sprites ohne Rücklesen"); } catch (_) {}
    return lesbar;
  };
  Z.canvasUnlesbar = grund => { if (lesbar === false) return; lesbar = false; try { Z.diag && Z.diag.note && Z.diag.note("Rücklesen unzuverlässig (" + grund + ")"); } catch (_) {} if (Z.cachesNeu) Z.cachesNeu("lesen"); };
  /* W23 Browser: Bild-URLs aus Leinwänden (NSC-/Boss-Porträts, Siegel, Bestiarium, Nemesis). Ist das Rücklesen verfälscht
     (Firefox resistFingerprinting: LibreWolf, Mullvad, Tor; Brave „streng“), liefert toDataURL Rauschen → Streifenbild statt
     Porträt. Dann: Platzhalter-URL (durchsichtiges 1×1-GIF mit Kennung); jedes <img> mit ihr bekommt eine Leinwand-Kopie als
     Zwilling dahinter (Leinwand→Leinwand ist nicht verfälscht). Das <img> bleibt versteckt im Dokument (Code sucht/ändert es),
     CSS-Regeln mit „img“ gelten per Kopie auch für die Zwillinge (canvas.w23img). Feature-Erkennung über Z.canvasLesbar(). */
  const W23 = { map: new Map(), n: 0, twin: new WeakMap(), obs: null, css: null, nSheets: -1 };
  const W23GIF = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7#w23-";
  const W23IMG = /(^|[\s>+~(,])img(?=$|[\s.#:[>+~),])/g;
  function w23Css() {
    if (document.styleSheets.length === W23.nSheets) return;
    let t = "";
    const rule = r => { if (!r.selectorText || !r.style) return ""; const p = r.selectorText.split(",").filter(s => s.replace(W23IMG, "") !== s); return p.length ? p.map(s => s.replace(W23IMG, "$1canvas.w23img")).join(",") + "{" + r.style.cssText + "}" : ""; };
    for (const sh of Array.from(document.styleSheets)) {
      if (W23.css && sh.ownerNode === W23.css) continue;
      let rs; try { rs = sh.cssRules; } catch (_) { continue; }
      for (const r of Array.from(rs || [])) {
        if (r.selectorText) t += rule(r);
        else if (r.cssRules && r.conditionText != null && r.media) { const inner = Array.from(r.cssRules).map(rule).join(""); if (inner) t += "@media " + r.conditionText + "{" + inner + "}"; }
      }
    }
    if (!W23.css) { W23.css = document.createElement("style"); W23.css.id = "w23-img-css"; document.head.appendChild(W23.css); }
    W23.css.textContent = t; W23.nSheets = document.styleSheets.length;
  }
  function w23Zwilling(im) {
    const cv = W23.map.get(im.getAttribute("src") || ""); let tw = W23.twin.get(im);
    if (!cv) { if (tw) { tw.remove(); W23.twin.delete(im); im.style.removeProperty("display"); } return; }
    if (!tw) { tw = document.createElement("canvas"); W23.twin.set(im, tw); }
    for (const a of Array.from(im.attributes)) if (!/^(src|alt|width|height|hidden)$/.test(a.name)) tw.setAttribute(a.name, a.value);
    tw.style.removeProperty("display"); tw.classList.add("w23img"); tw.setAttribute("role", "img");
    for (const k of ["width", "height"]) { const v = im.getAttribute(k); if (v && !tw.style[k]) tw.style[k] = v + "px"; }
    tw.width = cv.width; tw.height = cv.height; const g = tw.getContext("2d"); g.clearRect(0, 0, tw.width, tw.height); g.drawImage(cv, 0, 0);
    im.style.setProperty("display", "none", "important");
    if (im.nextSibling !== tw) im.after(tw);
  }
  const w23Scan = n => { if (n.nodeType !== 1) return; if (n.tagName === "IMG") w23Zwilling(n); else if (n.querySelectorAll) for (const im of Array.from(n.querySelectorAll('img[src^="data:image/gif;base64,R0lGODlhAQAB"]'))) w23Zwilling(im); };
  Z.leinwandURL = function (cv, typ, q) {
    if (Z.canvasLesbar()) return cv.toDataURL(typ, q);
    try {
      w23Css();
      if (!W23.obs && window.MutationObserver) {
        W23.obs = new MutationObserver(ms => { for (const m of ms) {
          if (m.type === "attributes") { if (m.target.tagName === "IMG") w23Zwilling(m.target); continue; }
          m.addedNodes.forEach(w23Scan);
          m.removedNodes.forEach(n => { if (n.tagName === "IMG" && !n.isConnected) { const tw = W23.twin.get(n); if (tw && tw.parentNode) tw.remove(); } });
        } });
        W23.obs.observe(document.documentElement, { subtree: true, childList: true, attributes: true, attributeFilter: ["src"] });
      }
      const u = W23GIF + (++W23.n); W23.map.set(u, cv); return u;
    } catch (_) { return cv.toDataURL(typ, q); }
  };
  /* Module melden hier ihre Zwischenspeicher an (Leeren = beim nächsten Bedarf neu malen). Z.cachesNeu(grund) leert alle,
     dazu Kachel-Blöcke und Ebenen (bild.js). Aufrufer: Kontextverlust, Wächter im Zeichenpfad, Lesetest. */
  const cacheFns = (Z._cachesNeu = Z._cachesNeu || []);
  let cnLast = 0;
  Z.cachesNeu = function (grund) {
    const now = performance.now(); if (now - cnLast < 250) return false; cnLast = now;
    for (const fn of cacheFns) { try { fn(grund); } catch (e) { console.warn("cachesNeu", e); } }
    const G = Z.gfx;
    try { if (G) { if (G.chunks) G.chunks.clear(); if (G.dropCaches) G.dropCaches(); if (Z.level && G.buildLayers) G.buildLayers(); } } catch (e) { console.warn("cachesNeu gfx", e); }
    try { Z.diag && Z.diag.note && Z.diag.note("Zwischenspeicher neu (" + (grund || "?") + ")"); } catch (_) {}
    return true;
  };
})();
