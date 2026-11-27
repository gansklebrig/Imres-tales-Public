/* Ezekiel – The Destroyer · W27 Koop: zu zweit an einem Gerät
   Spieler 2 (zweiter Controller oder zweite Tastaturhälfte) steigt jederzeit im Lager oder im Lauf ein und aus und spielt
   Friedrich (Bogen, Jagdmesser, Rex, Pfeilhagel) oder Echo (Dornenpeitsche, Bärengestalt, Rankengriff, Heilblüte).

   Aufbau (Einzelspieler bleibt unverändert – ohne Spieler 2 ist jede Hülle hier ein reiner Durchreicher):
   - Z.player bleibt Ezekiel. Spieler 2 ist ein eigenes Objekt (K.p2, Grundlage Z.newPlayer()) mit eigener Physik.
   - Gegner-Ziele: die Z.updateEnemies-Hülle teilt Z.enemies in zwei Gruppen. Gruppe „Ziel Spieler 2“ läuft durch den
     Gegner-Kern (Z._ueKern, gegner.js) mit vorübergehend vertauschtem Z.player / Z.hurtPlayer – so greifen alle Angriffe,
     Griffe und Bossmuster unverändert, treffen aber Spieler 2.
   - Kamera: Mitte zwischen beiden, sanfter Zoom (bis 0,78), Nachzügler wird nach kurzer Zeit herangezogen.
   - Tod: Gefallene knien … liegen am Boden und werden vom anderen in einigen Sekunden aufgehoben; sonst kehren sie im
     nächsten Gebiet mit halbem Leben zurück. Der Lauf endet erst, wenn beide fallen.
   Speichern: Gold/Splitter/Tränke sind gemeinsam (Ezekiels Beutel → aktiver Spielstand Z.meta); Tasten/Figur global. */
(function () {
  "use strict";
  const Z = window.Z; if (!Z || Z.koop) return;
  const U = Z.U, T = Z.TILE, FX = Z.fx, A = Z.audio, W = Z.world, L = v => Z.L(v), inp = Z.input, D = Z.draw, C = Z.PC;
  const PI = Math.PI, TAU = PI * 2;
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

  /* ======================= EINSTELLUNGEN (global) ======================= */
  const ACT = ["left", "right", "up", "down", "jump", "roll", "a1", "a2", "s1", "s2", "use", "potion", "pause"];
  const KEYS_NUM = { left: "Numpad4", right: "Numpad6", up: "Numpad8", down: "Numpad5", jump: "Numpad0", roll: "NumpadDecimal", a1: "Numpad7", a2: "Numpad9", s1: "Numpad1", s2: "Numpad3", use: "NumpadEnter", potion: "NumpadAdd", pause: "NumpadSubtract" };
  const KEYS_PFEIL = { left: "ArrowLeft", right: "ArrowRight", up: "ArrowUp", down: "ArrowDown", jump: "ControlRight", roll: "ShiftRight", a1: "Comma", a2: "Period", s1: "Semicolon", s2: "Quote", use: "Backslash", potion: "BracketRight", pause: "Backspace" };
  const SKEY = "imres-zerstoerer-koop";
  const okCode = c => (typeof c === "string" && /^[A-Za-z][A-Za-z0-9]{1,30}$/.test(c) ? c : null);
  const store = (() => { try { const v = JSON.parse(localStorage.getItem(SKEY) || "null"); return v && typeof v === "object" ? v : {}; } catch (_) { return {}; } })();
  const keys2 = Object.assign({}, KEYS_NUM);
  if (store.keys && typeof store.keys === "object") for (const a of ACT) if (a in store.keys) keys2[a] = okCode(store.keys[a]);
  const saveStore = () => { try { localStorage.setItem(SKEY, JSON.stringify({ keys: keys2, figur: K.lastChar })); } catch (_) {} };

  /* ======================= ZUSTAND ======================= */
  const K = (Z.koop = {
    p2: null,            /* Spieler 2 (null = allein) */
    src: null,           /* { kind: "pad", index } | { kind: "keys" } */
    lastChar: store.figur === "E" ? "E" : "G",
    held: {}, pressed: {}, kHeld: {}, kTap: {}, prev: {},
    keys: keys2, lv: null, farT: 0, zoom: 1, baseS: 0, lastS: 0,
    choose: null,        /* Figurenwahl läuft: { src, sel, t } */
    fx: [],              /* Ranken, Blüten */
    capture: null,       /* Tastenbelegung P2: wartet auf Taste für Aktion */
    leaveT: 0, rufT: 0, rufAus: 0, stats: null,
    DMG: { G: { arrow: 13, power: 38, stab: 16, rex: 12, rain: 12 }, E: { whip: 13, whip3: 21, claw: 30, vine: 10 } },
    HP_K: 0.9,           /* Lebenspunkte von Spieler 2 im Verhältnis zu Ezekiel */
    SCALE: { foe: 1.5, boss: 1.9 },
    extInput: null       /* W32 Online: Eingabequelle für Spieler 2 ersetzen (siehe K.setInputSource) */
  });
  /* Gegner-Skalierung für n Spieler – EINE Stelle für Koop am Gerät und Online (W32). n ≤ 1 → alles 1 (Einzelspieler unverändert). */
  K.skal = n => { n = Math.max(1, n | 0); if (n <= 1) return { foe: 1, boss: 1, elite: 0 }; const k = n - 1; return { foe: 1 + 0.5 * k, boss: 1 + 0.8 * k, elite: 0.05 * k }; };
  K.players = () => (K.p2 ? 2 : 1);
  for (const a of ACT) { K.held[a] = false; K.pressed[a] = false; K.kHeld[a] = false; K.kTap[a] = false; K.prev[a] = false; }
  const CH = {
    G: { n: "Friedrich", sub: ["Waldläufer · Bogen & Rex", "Ranger · bow & Rex"], col: "#7ab050", bar: "linear-gradient(#a8d070,#4a7a2a 55%,#2a4a18)",
      ab: { a1: ["Bogen (halten = Kraftschuss)", "Bow (hold = power shot)"], a2: ["Jagdmesser", "Hunting knife"], s1: ["Rex, fass!", "Rex, sic 'em!"], s2: ["Pfeilhagel", "Arrow hail"] },
      ico: { a1: "🏹", a2: "🗡", s1: "🐕", s2: "☄" } },
    E: { n: "Echo", sub: ["Druide · Ranken, Bärengestalt, Heilblüte", "Druid · vines, bear form, healing bloom"], col: "#e8c060", bar: "linear-gradient(#f0d890,#b08a30 55%,#6a4a18)",
      ab: { a1: ["Dornenpeitsche", "Thorn whip"], a2: ["Bärengestalt", "Bear form"], s1: ["Rankengriff", "Vine grasp"], s2: ["Heilblüte", "Healing bloom"] },
      ico: { a1: "🌿", a2: "🐻", s1: "🌱", s2: "🌸" } }
  };
  K.CH = CH;
  const P1 = () => Z.player;
  const alive2 = () => !!(K.p2 && !K.p2.down);
  /* während der Spieler-2-Gegnergruppe ist Z.player vorübergehend Spieler 2 – realP1() liefert immer Ezekiel */
  const realP1 = () => K._swapP1 || Z.player;
  const alive1 = () => { const P = realP1(); return !!(P && !P.dead && !P.koopDown); };
  K.active = () => !!K.p2;

  /* ======================= EINGABE SPIELER 2 ======================= */
  const p1Codes = () => { const s = new Set(); for (const a in inp.keys) for (const c of inp.keys[a] || []) if (c) s.add(c); s.add("Escape"); return s; };
  const codeAct = code => { for (const a of ACT) if (keys2[a] === code) return a; return null; };
  addEventListener("keydown", e => {
    if (K.capture) { /* Belegung für Spieler 2 */
      e.preventDefault(); e.stopImmediatePropagation(); if (e.repeat) return;
      const a = K.capture; K.capture = null;
      if (e.code === "Escape") return ctrlRedraw(L(["Abgebrochen.", "Cancelled."]));
      if (e.code === "Delete") { keys2[a] = null; saveStore(); return ctrlRedraw(L(["Feld geleert.", "Field cleared."])); }
      if (p1Codes().has(e.code)) return ctrlRedraw(L(["„", "“"])[0] + inp.keyName(e.code) + L(["“ gehört schon Spieler 1 – erst dort freigeben.", "” already belongs to player 1 – free it there first."]));
      for (const b of ACT) if (b !== a && keys2[b] === e.code) keys2[b] = keys2[a] || null;
      keys2[a] = e.code; saveStore(); A.play("uiOk", { vol: 0.4 }); return ctrlRedraw();
    }
    const a = codeAct(e.code); if (!a) return;
    if (p1Codes().has(e.code)) return; /* Spieler 1 hat Vorrang */
    if (e.target && /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
    if (Z.ui && Z.ui.modalOpen && !(K.p2 && K.src && K.src.kind === "keys")) { /* im Menü: nur „Beitreten“-Wahl (Fenster vom Pausemenü) */ return; }
    e.preventDefault(); e.stopImmediatePropagation();
    if (e.repeat) return;
    if (K.choose && K.choose.src.kind === "keys") return chooseInput(a);
    if (!K.p2) { if ((a === "use" || a === "jump" || a === "pause") && Z.level) startChoose({ kind: "keys" }); return; }
    if (K.src && K.src.kind === "keys") { K.kHeld[a] = true; K.kTap[a] = true; }
  }, true);
  addEventListener("keyup", e => { const a = codeAct(e.code); if (a) K.kHeld[a] = false; }, true);
  addEventListener("blur", () => { for (const a of ACT) K.kHeld[a] = false; });

  /* Controller: Spieler 1 nimmt den ersten verbundenen Controller, der nicht Spieler 2 gehört (kern.js fragt hier nach) */
  Z.koopSkipPad = g => !!(g && K.src && K.src.kind === "pad" && g.index === K.src.index);
  let padPrev2 = [], anyPrev = {};
  const PADS = () => { try { return navigator.getGamepads ? Array.from(navigator.getGamepads()) : []; } catch (_) { return []; } };
  function pollP2Pad() {
    const pads = PADS();
    /* Spieler-1-Controller = erster verbundener, der nicht Spieler 2 gehört */
    let p1i = -1; for (const g of pads) if (g && g.connected && !Z.koopSkipPad(g)) { p1i = g.index; break; }
    K._p1Pad = p1i;
    /* Beitreten: ein weiterer Controller drückt Start/A (oder irgendeiner, wenn das Pausemenü darauf wartet) */
    let freePad = null;
    for (const g of pads) {
      if (!g || !g.connected) continue;
      const pr = anyPrev[g.index] || [], now = g.buttons.map(b => !!b && (b.pressed || b.value > 0.45));
      anyPrev[g.index] = now;
      if (K.src && K.src.kind === "pad" && g.index === K.src.index) continue;
      const other = g.index !== p1i || K.wartePad;
      if (other) freePad = g;
      if (!K.p2 && !K.choose && Z.level && other && ((now[9] && !pr[9]) || (now[0] && !pr[0]))) {
        if (K.wartePad && Z.ui && Z.ui.modalOpen) Z.ui.close && Z.ui.close();
        K.wartePad = false; startChoose({ kind: "pad", index: g.index }); padPrev2 = now; /* derselbe Druck bestätigt nicht gleich */
      }
    }
    K._freePad = freePad;
    const src = (K.choose && K.choose.src.kind === "pad") ? K.choose.src : K.src;
    const padH = {}; for (const a of ACT) padH[a] = false;
    if (src && src.kind === "pad") {
      const g = pads.find(x => x && x.index === src.index && x.connected);
      if (!g) { if (K.p2 && K.src === src) leave(L(["Controller von Spieler 2 getrennt.", "Player 2's controller disconnected."])); if (K.choose && K.choose.src === src) K.choose = null, chooseHide(); }
      else {
        const now = g.buttons.map(b => !!b && (b.pressed || b.value > 0.45));
        const dz = (Z.settings && Z.settings.dead) || 0.35;
        let ax = g.axes[0] || 0, ay = g.axes[1] || 0; if (Math.hypot(ax, ay) < dz * 0.8) { ax = 0; ay = 0; }
        padH.left = (Math.abs(ax) > dz && ax < 0 && Math.abs(ax) > Math.abs(ay) * 0.36) || !!now[14];
        padH.right = (Math.abs(ax) > dz && ax > 0 && Math.abs(ax) > Math.abs(ay) * 0.36) || !!now[15];
        padH.up = (ay < -0.5 && -ay > Math.abs(ax) * 0.84) || !!now[12];
        padH.down = (ay > 0.5 && ay > Math.abs(ax) * 0.84) || !!now[13];
        for (const a in inp.pad) if (ACT.includes(a) && inp.pad[a] != null && now[inp.pad[a]]) padH[a] = true;
        for (const a in inp.pad2) if (ACT.includes(a) && inp.pad2[a] != null && now[inp.pad2[a]]) padH[a] = true;
        if (now[9]) padH.pause = true;
        if (K.choose && K.choose.src === src) {
          const pe = i => now[i] && !padPrev2[i];
          if (pe(14) || (ax < -0.6 && !K.choose.ax)) chooseInput("left");
          if (pe(15) || (ax > 0.6 && !K.choose.ax)) chooseInput("right");
          K.choose && (K.choose.ax = Math.abs(ax) > 0.6);
          if (pe(0) || pe(9)) chooseInput("use"); else if (pe(1)) chooseInput("back");
        }
        K.padObj = g; padPrev2 = now;
      }
    }
    if (K.choose) { for (const a of ACT) { K.held[a] = false; K.pressed[a] = false; } return; }
    if (K.extInput && K.src && K.src.kind === "net") { let h = null; try { h = K.extInput(); } catch (e) { console.error("koop net", e); } h = h || {}; for (const a of ACT) { const v = !!h[a]; K.pressed[a] = K.pressed[a] || (v && !K.prev[a]); K.held[a] = v; K.prev[a] = v; } return; }
    for (const a of ACT) {
      const h = !!(padH[a] || (K.src && K.src.kind === "keys" && (K.kHeld[a] || K.kTap[a])));
      K.pressed[a] = K.pressed[a] || (h && !K.prev[a]) || !!(K.kTap[a] && K.src && K.src.kind === "keys" && !K.prev[a]);
      K.held[a] = h; K.prev[a] = h; K.kTap[a] = false;
    }
  }
  K.poll = pollP2Pad;
  /* ===== Schnittstelle für W32 Online =====
     K.setInputSource(fn): fn() liefert je Bild { left, right, up, down, jump, roll, a1, a2, s1, s2, use, potion, pause } (bool, „gehalten“).
       Kanten (pressed) bildet koop.js selbst. fn = null → wieder lokal (Controller/Tastatur).
     K.joinRemote(figur) : Spieler 2 als Netz-Spieler beitreten lassen (src.kind = "net"; lokale Pads/Tasten steuern ihn dann nicht).
     K.input2            : { held, pressed } – aktueller Eingabezustand von Spieler 2 (lesen).
     K.serialize()/K.apply(s): Zustand von Spieler 2 (+ Rex, Effekte) als reines JSON-Objekt / einspielen (Gast-Darstellung).
     K.skal(n)           : Gegner-Faktoren für n Spieler { foe, boss, elite }. */
  K.input2 = { held: K.held, pressed: K.pressed };
  K.setInputSource = fn => { K.extInput = typeof fn === "function" ? fn : null; };
  K.joinRemote = id => { if (K.p2) leave(); join(id === "E" ? "E" : "G", { kind: "net" }); };
  const SER = ["x", "y", "vx", "vy", "face", "hp", "hpMax", "down", "revive", "ch", "rollT", "bear", "iframe", "hurtT", "climbing", "onGround", "chargeT", "comboN", "drinkT"];
  K.serialize = () => {
    const P = K.p2; if (!P) return null;
    const o = {}; for (const k of SER) o[k] = P[k];
    o.anim = { run: P.anim.run, climb: P.anim.climb || 0 }; o.cd = Object.assign({}, P.cd); o.cdMax = Object.assign({}, P.cdMax);
    o.act = P.act ? { type: P.act.type, t: P.act.t, dur: P.act.dur, n: P.act.n || 0, charge: P.act.charge || 0 } : null;
    o.waffe = P.waffe ? { id: P.waffe.id, tier: P.waffe.tier, rar: P.waffe.rar, aff: P.waffe.aff.slice(), uid: P.waffe.uid } : null;
    o.rex = K.rex ? { x: K.rex.x, y: K.rex.y, face: K.rex.face, run: K.rex.run, vx: K.rex.vx, state: K.rex.state } : null;
    o.fx = K.fx.map(f => ({ kind: f.kind, x: f.x, y: f.y, t: f.t, life: f.life, h: f.h || 0 }));
    o.p1down = !!(Z.player && Z.player.koopDown); o.p1revive = Z.player ? Z.player.revive || 0 : 0;
    return o;
  };
  K.apply = s => {
    if (!s) return; if (!K.p2 || K.p2.ch !== s.ch) { if (K.p2) { K.p2 = null; K.rex = null; } join(s.ch, { kind: "net" }); }
    const P = K.p2; if (!P) return;
    for (const k of SER) if (k in s) P[k] = s[k];
    if (s.anim) Object.assign(P.anim, s.anim); if (s.cd) Object.assign(P.cd, s.cd); if (s.cdMax) Object.assign(P.cdMax, s.cdMax);
    P.act = s.act ? Object.assign({ hits: new Set() }, s.act) : null; P.waffe = s.waffe || null;
    if (s.rex && K.rex) Object.assign(K.rex, s.rex);
    if (Array.isArray(s.fx)) K.fx = s.fx.map(f => Object.assign({}, f, { tick: 9 }));
  };
  /* Testzugang: Tasten von Spieler 2 direkt setzen (für __z.step-Läufe ohne Bildschleife) */
  K.set = (a, v) => { if (v && !K.held[a]) K.pressed[a] = true; K.held[a] = !!v; K.prev[a] = !!v; };

  const pp0 = inp.pollPad;
  inp.pollPad = function () {
    const r = pp0.apply(this, arguments);
    try {
      pollP2Pad();
      /* Ezekiel am Boden: keine Spielaktionen (Menü, Karte, Pause bleiben) */
      const P = Z.player; if (P && P.koopDown) for (const a of ["left", "right", "up", "down", "jump", "roll", "a1", "a2", "s1", "s2", "use", "potion"]) { inp.held[a] = false; inp.pressed[a] = false; }
      /* Spieler 2 drückt Pause: Pausemenü für beide; lange halten = Gruppe verlassen */
      if (K.p2) {
        const nowT = performance.now(), fdt = Math.min(0.1, Math.max(0, (nowT - (K._pt || nowT)) / 1000)); K._pt = nowT;
        if (K.held.pause) { K.leaveT += fdt; if (K.leaveT > 1.25) { K.leaveT = 0; K.held.pause = false; K.prev.pause = true; leave(); } }
        else { if (K.leaveT > 0 && K.leaveT < 0.4 && Z.level && Z.ui && !Z.ui.modalOpen && Z.ui.pause) Z.ui.pause(); K.leaveT = 0; }
      }
    } catch (e) { console.error("koop", e); }
    return r;
  };

  /* ======================= BEITRETEN / FIGURENWAHL / VERLASSEN ======================= */
  let wahlEl = null;
  function startChoose(src) {
    if (K.p2 || !Z.level) return;
    K.choose = { src, sel: K.lastChar === "E" ? 1 : 0, t: 0 };
    A.play("uiOk", { vol: 0.4 });
    chooseShow();
  }
  function chooseInput(a) {
    const ch = K.choose; if (!ch) return;
    if (a === "left" || a === "right") { ch.sel = 1 - ch.sel; A.play("ui", { vol: 0.35 }); chooseShow(); }
    else if (a === "use" || a === "jump" || a === "a1") { const id = ch.sel ? "E" : "G"; const s = ch.src; K.choose = null; chooseHide(); join(id, s); }
    else if (a === "back" || a === "roll" || a === "pause") { K.choose = null; chooseHide(); A.play("ui", { vol: 0.3, rate: 0.8 }); }
  }
  function chooseShow() {
    if (!wahlEl) { wahlEl = document.createElement("div"); wahlEl.id = "koop-wahl"; document.body.appendChild(wahlEl); }
    const ch = K.choose; if (!ch) return chooseHide();
    const pad = ch.src.kind === "pad";
    const k = a => (pad ? inp.padButtonName(a === "use" ? 0 : a === "back" ? 1 : null) : inp.keyName(keys2[a]));
    wahlEl.innerHTML = '<div class="kw-kopf">' + L(["Spieler 2 – wähle deine Figur", "Player 2 – choose your hero"]) + '</div><div class="kw-karten">' +
      ["G", "E"].map((id, i) => '<div class="kw-karte' + (ch.sel === i ? " an" : "") + '"><canvas width="120" height="120" data-f="' + id + '"></canvas><b>' + CH[id].n + "</b><small>" + esc(L(CH[id].sub)) + "</small></div>").join("") +
      '</div><div class="kw-fuss">' + (pad ? L(["◀ ▶ wählen · <b>A</b> bestätigen · <b>B</b> abbrechen", "◀ ▶ choose · <b>A</b> confirm · <b>B</b> cancel"]) : L(["", ""]) + esc(k("left")) + " / " + esc(k("right")) + L([" wählen · ", " choose · "]) + "<b>" + esc(k("use")) + "</b>" + L([" bestätigen · ", " confirm · "]) + "<b>" + esc(k("roll")) + "</b>" + L([" abbrechen", " cancel"])) + "</div>";
    wahlEl.hidden = false;
    for (const cv of wahlEl.querySelectorAll("canvas")) portrait(cv, cv.dataset.f);
  }
  function chooseHide() { if (wahlEl) wahlEl.hidden = true; }
  function portrait(cv, id) {
    const c = cv.getContext("2d"); c.clearRect(0, 0, cv.width, cv.height);
    const fake = mkP2(id); fake.x = 0; fake.y = 0; fake.onGround = true; fake.face = 1;
    c.save(); c.translate(60, 104); c.scale(3.2, 3.2); drawBody(c, fake, performance.now() / 1000, id); c.restore();
  }
  function mkP2(id) {
    const P = Z.newPlayer();
    Object.assign(P, { koop: true, ch: id, w: 12, h: 28, down: false, revive: 0, waffe: null, bear: 0, mash: 0, cdMax: { s1: 1, s2: 1, a2: 1 }, cd: { s1: 0, s2: 0, a2: 0 }, chargeT: 0, comboN: 0, comboT: 0, hurtT: 0, drinkT: 0, anim: { t: 0, run: 0, land: 0, blink: 0, swing: 0 } });
    return P;
  }
  function join(id, src) {
    if (K.p2 || !Z.level || !Z.player) return;
    const P = mkP2(id);
    K.p2 = P; K.src = src; K.lastChar = id; saveStore();
    for (const a of ACT) { K.held[a] = false; K.pressed[a] = false; K.prev[a] = true; K.kHeld[a] = false; }
    P.hpMax = Math.max(60, Math.round(Z.player.hpMax * K.HP_K)); P.hp = P.hpMax;
    placeNear(P, true);
    K.rex = id === "G" ? { x: P.x - 14, y: P.y + P.h - 13, w: 16, h: 13, vx: 0, vy: 0, face: 1, run: 0, state: "follow", tgt: null, bites: 0, biteT: 0, t: 0, nipT: 0 } : null;
    K.stats = K.stats || { dmg: 0, kills: 0, revives: 0, downs: 0, hits: 0 }; K.stats.ch = id;
    rescaleEnemies();
    hudBuild();
    const name = CH[id].n;
    Z.toast && Z.toast(L(["Spieler 2 ist dabei: ", "Player 2 joined: "]) + name + L([" – Start lange halten zum Verlassen.", " – hold Start to leave."]), 3200);
    FX.ring(P.x + P.w / 2, P.y + 14, 26, CH[id].col, 0.5, 3); FX.burst(P.x + P.w / 2, P.y + 14, 22, { col: [CH[id].col, "#fff0c0"], sp: 110, life: 0.6, size: 2, kind: "spark", add: true });
    A.play(id === "G" ? "bark" : "magic", { vol: 0.6 });
    if (Z.meta) { Z.meta.koop = Z.meta.koop || { joins: 0, revives: 0, runs: 0 }; Z.meta.koop.joins = (Z.meta.koop.joins | 0) + 1; }
  }
  function leave(msg) {
    const P = K.p2; if (!P) return;
    const name = CH[P.ch].n;
    FX.burst(P.x + P.w / 2, P.y + 14, 18, { col: ["#a99a8b", "#5a4a40"], sp: 70, life: 0.6, size: 3, kind: "smoke" });
    K.p2 = null; K.src = null; K.rex = null; K.fx.length = 0;
    for (const e of Z.enemies) if (e._kz) e._kz = null;
    rescaleEnemies();
    /* Ezekiel lag am Boden, nur Spieler 2 stand noch: jetzt ist der Lauf vorbei */
    const Pl = Z.player; if (Pl && Pl.koopDown) { Pl.koopDown = false; Pl.hp = 0; death0.call(Z, K.lastDeathO || {}); }
    hudBuild();
    Z.toast && Z.toast(msg || (name + L([" verlässt die Gruppe.", " leaves the party."])), 2600);
  }
  K.join = join; K.leave = leave; K.startChoose = startChoose;

  function placeNear(P, fx) {
    const Q = Z.player; if (!Q) return;
    P.x = Q.x + Q.w / 2 - Q.face * 18 - P.w / 2; P.y = Q.y + Q.h - P.h; P.vx = 0; P.vy = 0; P.climbing = false; P.act = null; P.rollT = 0; P.grabbed = null;
    Z.unstick && Z.unstick(P);
    if (Z.level && W.solidAt && (W.solidAt(P.x + P.w / 2, P.y + P.h / 2))) { P.x = Q.x; P.y = Q.y; }
    if (K.rex) { K.rex.x = P.x - 12; K.rex.y = P.y + P.h - K.rex.h; K.rex.vx = 0; K.rex.vy = 0; K.rex.state = "follow"; }
    if (fx) { FX.burst(P.x + P.w / 2, P.y + 14, 14, { col: [CH[P.ch].col, "#fff0c0"], sp: 90, life: 0.45, size: 2, kind: "spark", add: true }); FX.ring(P.x + P.w / 2, P.y + 14, 20, CH[P.ch].col, 0.35, 2); }
  }

  /* ======================= GEGNER: KOOP-LEBEN, ZIELE ======================= */
  function rescaleEnemies() {
    const sk = K.skal(K.players());
    for (const e of Z.enemies) {
      if (e.dummy || !e.def) continue;
      /* etwas mehr Eliten im Koop: neue gewöhnliche Gegner werden selten zur Elite (einmal je Gegner gewürfelt) */
      if (sk.elite > 0 && !e._koopEl && !e.def.boss && !e.master && e.def.ai !== "turret") { e._koopEl = 1; if (!e.elite && Math.random() < sk.elite) { e.elite = true; e.hpMax *= 1.35; e.hp *= 1.35; } }
      const want = e.def.boss ? sk.boss : sk.foe, have = e._koopK || 1;
      if (Math.abs(want - have) < 1e-6) continue;
      const f = want / have; e.hpMax = e.hpMax * f; e.hp = e.dead ? e.hp : e.hp * f; e._koopK = want;
    }
  }
  K.rescale = rescaleEnemies;
  function pickTargets(dt) {
    const P = Z.player, Q = K.p2;
    const ok1 = alive1(), ok2 = alive2();
    for (const e of Z.enemies) {
      if (e.dead || e.dummy) { e._kz = null; continue; }
      if (!ok2) { e._kz = null; continue; }
      if (!ok1) { e._kz = Q; continue; }
      if (e._kzAgg > 0) e._kzAgg -= dt;
      e._kzT = (e._kzT || 0) - dt;
      if (e.act || e._kzT > 0) continue;
      const cx = e.x + e.w / 2, cy = e.y + e.h / 2;
      const d1 = Math.hypot(P.x + P.w / 2 - cx, (P.y + P.h / 2 - cy) * 1.4), d2 = Math.hypot(Q.x + Q.w / 2 - cx, (Q.y + Q.h / 2 - cy) * 1.4);
      const cur2 = e._kz === Q;
      if (e.def.boss) {
        e._kzT = 3.5 + Math.random() * 3.5;
        /* Bosse wechseln das Ziel: meist der Nähere, ab und zu bewusst der andere */
        const near2 = d2 < d1 * 0.9;
        e._kz = Math.random() < 0.3 ? (cur2 ? null : Q) : (near2 ? Q : null);
      } else {
        e._kzT = 0.5 + Math.random() * 0.6;
        if (e._kzAgg > 0) e._kz = e._kzBy === 2 ? Q : null;
        else e._kz = cur2 ? (d1 < d2 * 0.7 ? null : Q) : (d2 < d1 * 0.7 ? Q : null);
      }
      if (!cur2 && e._kz === Q && e.def.boss) FX.text(cx, e.y - 14, "⚠ " + CH[Q.ch].n, CH[Q.ch].col);
    }
  }
  /* Treffer von Ezekiel ziehen den Zorn auf ihn, Treffer von Spieler 2 auf Spieler 2 */
  let p2Hitting = 0;
  const hit0 = Z.hitEnemy;
  Z.hitEnemy = function (e, dmg, o) {
    if (!K.p2) return hit0.apply(this, arguments);
    const hp0 = e ? e.hp : 0, dead0 = e ? e.dead : true;
    const r = hit0.apply(this, arguments);
    try {
      if (e && !(o && o.dot)) { e._kzAgg = 2.5; e._kzBy = p2Hitting ? 2 : 1; e._kzT = Math.min(e._kzT || 0, 0.05); }
      if (p2Hitting && e && K.stats) { K.stats.dmg += Math.max(0, hp0 - Math.max(0, e.hp)); K.stats.hits++; if (!dead0 && (e.dead || e.hp <= 0)) K.stats.kills++; }
    } catch (_) {}
    return r;
  };
  const hitP2 = (e, dmg, o) => { p2Hitting++; try { return Z.hitEnemy(e, dmg, Object.assign({ src: "koop" }, o || {})); } finally { p2Hitting--; } };

  /* ======================= SCHADEN AN SPIELER 2 ======================= */
  function hurtP2(dmg, o) {
    const P = K.p2; if (!P || P.down) return false;
    o = o || {};
    if (Z.godMode) return false;
    if (typeof dmg !== "number" || !isFinite(dmg)) dmg = dmg === Infinity ? P.hpMax : 1;
    if ((P.iframe > 0 || P.rollT > 0) && !o.force) return false;
    let m = 1;
    if (P.bear > 0) m *= 0.6;
    if (o.attacker && o.attacker.st && o.attacker.st.weak > 0) m *= 0.6;
    if (Z.mercy && Z.mercy()) m *= 0.6;
    if (Z.haerteInFluch && Z.haerteInFluch(P.x + P.w / 2, P.y + P.h / 2)) m *= 1.25; /* Härte V: Fluchzonen */
    dmg = Math.max(1, Math.round(dmg * m));
    P.hp -= dmg; P.iframe = o.spike ? 0.8 : 0.75; P.hurtT = 0.2; P.act = null; P.chargeT = 0; P.climbing = false; P.drinkT = 0;
    const fromX = o.x != null ? o.x : P.x + P.w / 2 + P.face;
    if (o.kb !== 0) { P.vx = (P.x + P.w / 2 < fromX ? -1 : 1) * (o.kb || 170); P.vy = Math.min(P.vy, -(o.kbUp || 150)); P.onGround = false; }
    FX.text(P.x + P.w / 2, P.y - 6, "-" + dmg, "#ff8a6a", dmg > P.hpMax * 0.15);
    FX.burst(P.x + P.w / 2, P.y + 12, 10, { col: ["#ff4a3a", "#8a1414", "#ffb070"], sp: 110, life: 0.35, size: 2, kind: "spark", add: true });
    FX.addShake(Math.min(5, 2 + dmg / P.hpMax * 18));
    A.play("hurt", { vol: 0.55, rate: P.ch === "E" ? 1.15 : 0.92 });
    padRumble(0.45, 0.5, 120);
    if (o.eff) for (const k in o.eff) try { Z.addStatus(P, k, o.eff[k], true); } catch (_) {}
    if (o.proj && o.proj.k && (o.proj.k.lob || o.proj.k.fuse)) {} /* Bomben: platzen beim Aufprall (wie bei Ezekiel) */
    if (P.hp <= 0) downP2();
    return true;
  }
  K.hurt = hurtP2;
  function padRumble(s, w, ms) {
    try {
      const k = Z.settings && typeof Z.settings.vibK === "number" ? Z.settings.vibK : 0.8; if (k <= 0) return;
      const g = K.padObj, va = g && g.vibrationActuator; if (va && va.playEffect && K.src && K.src.kind === "pad") va.playEffect("dual-rumble", { duration: ms, strongMagnitude: Math.min(1, s * k), weakMagnitude: Math.min(1, w * k) }).catch(() => {});
    } catch (_) {}
  }
  function downP2() {
    const P = K.p2; if (!P || P.down) return;
    P.down = true; P.hp = 0; P.act = null; P.revive = 0; P.bear = 0; P.vx *= 0.3; P.downT = 0;
    if (K.stats) K.stats.downs++;
    FX.burst(P.x + P.w / 2, P.y + 14, 20, { col: ["#5a1a14", "#a02a20", "#3a2a2a"], sp: 90, life: 0.7, size: 3, kind: "smoke" });
    A.play("die", { vol: 0.4 }); padRumble(1, 0.8, 300);
    for (const e of Z.enemies) if (e._kz === P) e._kz = null;
    if (!alive1()) return bothDown();
    note(L([CH[P.ch].n + " ist gefallen! Ezekiel: halte „Benutzen“ bei ihr/ihm zum Aufhelfen.", CH[P.ch].n + " is down! Ezekiel: hold “Use” next to them to revive."]).replace("ihr/ihm", P.ch === "E" ? "ihr" : "ihm"));
  }
  /* Ezekiel fällt, Spieler 2 steht noch: am Boden statt Tod */
  const death0 = Z.onPlayerDeath;
  Z.onPlayerDeath = function (o) {
    const P = Z.player;
    if (K.p2 && P && !P.dead && !P.koopDown && alive2()) {
      K.lastDeathO = o || {};
      P.koopDown = true; P.hp = 1; P.act = null; P.climbing = false; P.grabbed = null; P.revive = 0; P.deadAt = Z.gfx.time; P.drinkT = 0;
      FX.flashScreen && FX.flashScreen("#400000", 0.35); A.play("die", { vol: 0.5 });
      for (const e of Z.enemies) if (!e.dead) e._kz = K.p2;
      note(L(["Ezekiel ist gefallen! " + CH[K.p2.ch].n + ": halte „Benutzen“ bei ihm zum Aufhelfen.", "Ezekiel is down! " + CH[K.p2.ch].n + ": hold “Use” next to him to revive."]));
      return;
    }
    return death0.apply(this, arguments);
  };
  function bothDown() {
    if (K._swapP1) { K.pendingBoth = true; return; } /* erst nach der Gegner-Rechnung (Z.player wieder Ezekiel) */
    const P = Z.player;
    if (P && P.koopDown) { P.koopDown = false; P.hp = 0; death0.call(Z, K.lastDeathO || {}); }
  }
  const hurt0 = Z.hurtPlayer;
  Z.hurtPlayer = function () { const P = Z.player; if (P && P.koopDown) return false; return hurt0.apply(this, arguments); };
  const heal0 = Z.healPlayer;
  Z.healPlayer = function () { const P = Z.player; if (P && P.koopDown) return; return heal0.apply(this, arguments); };
  const up0 = Z.updatePlayer;
  Z.updatePlayer = function (P, dt) {
    if (P && P.koopDown && P === Z.player) {
      P.vx *= Math.pow(0.02, dt); P.vy = Math.min(P.vy + C.GRAV * dt, C.MAXFALL); Z.moveBody(P, dt); P.iframe = Math.max(P.iframe, 0.5); P.act = null;
      return;
    }
    const r = up0.apply(this, arguments);
    if (K.p2 && P === Z.player && K.reviving1) { P.lookDown = true; }
    return r;
  };
  function reviveP1() {
    const P = Z.player; if (!P || !P.koopDown) return;
    P.koopDown = false; P.dead = false; P.hp = Math.max(1, Math.round(P.hpMax * 0.35)); P.iframe = 2; P.hurtT = 0;
    FX.burst(P.x + P.w / 2, P.y + 12, 24, { col: ["#ffe08a", "#fff6d0"], sp: 120, up: 60, life: 0.7, size: 2, kind: "spark", add: true }); FX.ring(P.x + P.w / 2, P.y + 14, 28, "#ffe08a", 0.5, 3);
    A.play("heal", { vol: 0.7 }); FX.text(P.x + P.w / 2, P.y - 16, L(["Wieder auf den Beinen!", "Back on his feet!"]), "#ffe08a", true);
    if (K.stats) K.stats.revives++; if (Z.meta && Z.meta.koop) Z.meta.koop.revives = (Z.meta.koop.revives | 0) + 1;
  }
  function reviveP2(q) {
    const P = K.p2; if (!P || !P.down) return;
    P.down = false; P.hp = Math.max(1, Math.round(P.hpMax * (q || 0.35))); P.iframe = 2; P.hurtT = 0; P.revive = 0;
    FX.burst(P.x + P.w / 2, P.y + 12, 24, { col: ["#ffe08a", "#fff6d0", CH[P.ch].col], sp: 120, up: 60, life: 0.7, size: 2, kind: "spark", add: true }); FX.ring(P.x + P.w / 2, P.y + 14, 28, CH[P.ch].col, 0.5, 3);
    A.play("heal", { vol: 0.7 }); FX.text(P.x + P.w / 2, P.y - 16, L(["Weiter geht's!", "Back in it!"]), CH[P.ch].col, true);
    if (K.stats) K.stats.revives++; if (Z.meta && Z.meta.koop) Z.meta.koop.revives = (Z.meta.koop.revives | 0) + 1;
  }
  K.reviveP1 = reviveP1; K.reviveP2 = reviveP2;

  /* ======================= BEWEGUNG SPIELER 2 ======================= */
  const solidAtPx = (x, y) => W.solidT(W.tile(Math.floor(x / T), Math.floor(y / T)));
  function nearestFoe(P, range, front) {
    let best = null, bd = range;
    const cx = P.x + P.w / 2, cy = P.y + P.h / 2;
    for (const e of Z.enemies) {
      if (e.dead || e.dummy && !Z.level.hub || e.hidden > 0 || e.intro > 0 || (e.disguise && !e.revealed)) continue;
      const dx = e.x + e.w / 2 - cx, dy = e.y + e.h / 2 - cy;
      if (front && Math.sign(dx) !== P.face && Math.abs(dx) > 8) continue;
      const d = Math.hypot(dx, dy * 1.3); if (d < bd) { bd = d; best = e; }
    }
    return best;
  }
  function p2Move(P, dt) {
    const I = K.held, Pr = K.pressed;
    let h = (I.right ? 1 : 0) - (I.left ? 1 : 0);
    P.time += dt; P.anim.t += dt;
    P.iframe = Math.max(0, P.iframe - dt); P.rollCd = Math.max(0, (P.rollCd || 0) - dt); if (P.dropT > 0) P.dropT = Math.max(0, P.dropT - dt);
    for (const k in P.cd) P.cd[k] = Math.max(0, P.cd[k] - dt);
    if (P.bear > 0) { P.bear -= dt; if (P.bear <= 0) { P.bear = 0; FX.burst(P.x + P.w / 2, P.y + 14, 16, { col: ["#7ab060", "#c8e090", "#6a4a30"], sp: 80, life: 0.6, size: 2, kind: "leaf" }); A.play("magic", { vol: 0.4, rate: 1.3 }); } }
    if (P.comboT > 0) { P.comboT -= dt; if (P.comboT <= 0) P.comboN = 0; }
    try { Z.statusTick(P, dt, true); } catch (_) {}
    if (Pr.jump) P.jumpBuf = 0.13; else P.jumpBuf = (P.jumpBuf || 0) - dt;
    const st = P.st || {};
    const ctl = !(st.stun > 0) && !(st.web > 0);
    /* gepackt (Gegnergriff): rütteln befreit */
    if (P.grabbed) {
      const g = P.grabbed;
      if (g.dead || !g.act) P.grabbed = null;
      else { for (const a of ["jump", "roll", "a1", "a2", "left", "right"]) if (Pr[a]) P.mash = (P.mash || 0) + 1; if (P.mash > 7) { P.grabbed = null; P.mash = 0; P.vy = -200; P.iframe = 0.6; if (Z.cancelEnemyAct) Z.cancelEnemyAct(g); } return; }
    }
    if (P.hurtT > 0) { P.hurtT -= dt; P.vy = Math.min(P.vy + C.GRAV * dt, C.MAXFALL); P.vx *= Math.pow(0.05, dt); Z.moveBody(P, dt); return; }
    if (!ctl) { P.vx *= Math.pow(0.01, dt); h = 0; }
    /* Trank aus dem gemeinsamen Beutel */
    if (P.drinkT > 0) { P.drinkT -= dt; if (P.drinkT <= 0) { const n = Math.round(P.hpMax * 0.55); P.hp = Math.min(P.hpMax, P.hp + n); FX.text(P.x + P.w / 2, P.y - 10, "+" + n, "#8fe08a"); FX.burst(P.x + P.w / 2, P.y + 8, 14, { col: ["#ff6a6a", "#ffb0a0"], sp: 50, up: 40, life: 0.7, size: 2, kind: "glow", add: true }); A.play("heal", { vol: 0.6 }); } }
    if (Pr.potion && ctl && P.drinkT <= 0) {
      const Q = Z.player;
      if (Q && Q.potions > 0 && P.hp < P.hpMax) { Q.potions--; P.drinkT = 0.42; A.play("potion", { vol: 0.6 }); FX.text(P.x + P.w / 2, P.y - 6, L(["Trank (gemeinsam)", "Potion (shared)"]), "#ffb0a0"); }
      else if (Q && Q.potions <= 0) { FX.text(P.x + P.w / 2, P.y - 6, L(["Kein Trank mehr", "No potions left"]), "#a99a8b"); A.play("ui", { vol: 0.3 }); }
    }
    /* Leiter */
    const cx = P.x + P.w / 2, tx = Math.floor(cx / T);
    const onLad = W.isLadder(tx, Math.floor((P.y + P.h - 2) / T)) || W.isLadder(tx, Math.floor((P.y + 4) / T));
    const below = W.isLadder(tx, Math.floor((P.y + P.h + 2) / T));
    if (P.ladNo > 0) P.ladNo -= dt;
    if (!P.climbing && ctl && !(P.ladNo > 0) && !P.act && P.rollT <= 0 && ((I.up && onLad) || (I.down && P.onGround && below && !onLad))) {
      const nx = tx * T + T / 2 - P.w / 2;
      if (!solidAtPx(nx + 1, P.y + 2) && !solidAtPx(nx + P.w - 1, P.y + 2)) { P.climbing = true; P.x = nx; P.vx = 0; P.vy = 0; P.airJumps = 1; if (I.down && below && !onLad) P.y += 6; }
    }
    if (P.climbing) {
      const v = (I.down ? 1 : 0) - (I.up ? 1 : 0);
      const ny = P.y + v * C.CLIMB * dt;
      const still = W.isLadder(tx, Math.floor((ny + P.h - 2) / T)) || W.isLadder(tx, Math.floor((ny + P.h * 0.5) / T));
      P.anim.climb = (P.anim.climb || 0) + Math.abs(v) * dt * 8; P.vx = 0; P.vy = v * C.CLIMB;
      if (!still && v < 0) { const top = Math.floor((P.y + P.h - 2) / T); P.y = top * T - P.h; P.climbing = false; P.onGround = true; P.vy = 0; }
      else if (!still) P.climbing = false;
      else { P.y = ny; if (v > 0) { const fb = Math.floor((P.y + P.h) / T); if (W.solidT(W.tile(tx, fb))) { P.y = fb * T - P.h; P.climbing = false; P.onGround = true; P.vy = 0; } } }
      if (h) P.face = h;
      if (P.climbing && P.jumpBuf > 0) { P.jumpBuf = 0; P.climbing = false; P.ladNo = 0.3; if (I.down) P.vy = 60; else { P.vy = -C.JUMP * (h ? 0.85 : 0.75); P.vx = h * C.RUN; A.play("jump", { vol: 0.3, rate: 1.1 }); } }
      if (P.climbing && (Pr.a1 || Pr.a2 || Pr.s1 || Pr.s2 || Pr.roll)) { P.climbing = false; P.ladNo = 0.3; }
      if (P.climbing) return;
    }
    /* Rolle / Fuchssprung */
    if (P.rollT > 0) {
      P.rollT -= dt; P.vx = P.rollDir * (P.ch === "E" ? 300 : 285);
      P.vy = Math.min(P.vy + C.GRAV * dt, C.MAXFALL); Z.moveBody(P, dt);
      if (P.rollT <= 0) { P.rollCd = 0.3; P.vx *= 0.5; }
      return;
    }
    if (Pr.roll && ctl && P.rollCd <= 0 && !P.act && P.bear <= 0) {
      P.rollT = 0.3; P.rollDir = h || P.face; P.face = P.rollDir; P.iframe = Math.max(P.iframe, 0.26); P.act = null; P.chargeT = 0;
      A.play("roll", { vol: 0.4, rate: P.ch === "E" ? 1.25 : 1 });
      if (P.ch === "E") FX.burst(P.x + P.w / 2, P.y + 18, 8, { col: ["#e08a3a", "#ffd0a0"], sp: 60, life: 0.35, size: 2, kind: "spark", add: true });
      return;
    }
    /* Laufen */
    const charging = P.act && P.act.type === "bow";
    let max = C.RUN * (P.bear > 0 ? 0.88 : 1) * (st.slow > 0 ? 0.6 : 1) * (charging ? 0.42 : 1);
    if (st.root > 0) max = 0;
    if (P.act && P.act.lock && P.onGround) max *= 0.25;
    const want = h * max;
    const acc = P.onGround ? (h && Math.sign(h) !== Math.sign(P.vx) ? C.TURN_G : h ? C.ACC_G : C.DEC_G) : (h ? C.ACC_A : C.DEC_A);
    P.vx = U.approach(P.vx, want, acc * dt);
    if (h && !(P.act && P.act.lock) && !charging) P.face = h; else if (h && charging) P.face = h;
    /* Springen (Kojote, Puffer, Doppelsprung, Durchfallen) */
    if (P.onGround) { P.coyote = C.COYOTE; P.airJumps = 1; } else P.coyote = Math.max(0, (P.coyote || 0) - dt);
    if (P.jumpBuf > 0 && ctl && !(st.root > 0)) {
      if (I.down && P.onPlat && P.onGround) { P.dropT = 0.25; P.jumpBuf = 0; P.onGround = false; P.y += 1; }
      else if (P.onGround || P.coyote > 0) { P.vy = -C.JUMP * (P.bear > 0 ? 0.9 : 1); P.jumpHeld = true; P.jumpBuf = 0; P.coyote = 0; A.play("jump", { vol: 0.35, rate: P.ch === "E" ? 1.15 : 0.95 }); }
      else if (P.airJumps > 0 && P.bear <= 0) { P.vy = -C.DJUMP; P.airJumps--; P.jumpHeld = true; P.jumpBuf = 0; A.play("jump", { vol: 0.3, rate: 1.3 }); FX.burst(P.x + P.w / 2, P.y + P.h, 8, { col: P.ch === "E" ? ["#8fd36b", "#e8f0c0"] : ["#d8c8a0", "#fff"], sp: 50, life: 0.3, size: 1.6, kind: "spark" }); }
    }
    if (P.jumpHeld && !I.jump && P.vy < 0) { P.vy *= C.CUT + 0.05; P.jumpHeld = false; }
    if (P.vy >= 0) P.jumpHeld = false;
    let g = C.GRAV * (P.vy > 0 ? C.FALL : 1);
    if (Math.abs(P.vy) < C.HANGV && I.jump && !P.onGround) g *= 0.55;
    P.vy = Math.min(P.vy + g * dt, C.MAXFALL);
    const wasAir = !P.onGround, vy0 = P.vy;
    Z.moveBody(P, dt);
    if (P.onGround && wasAir && vy0 > 200) { A.play("land", { vol: 0.25 }); FX.burst(P.x + P.w / 2, P.y + P.h, 5, { col: "#a99a8b", sp: 40, life: 0.3, size: 2, kind: "smoke" }); P.anim.land = 0.15; }
    if (P.anim.land > 0) P.anim.land -= dt;
    P.anim.run += Math.abs(P.vx) * dt / 9;
    if (P.onGround && !P.onPlat) { P.safeT = (P.safeT || 0) + dt; if (P.safeT > 0.4) { P.lastSafe = { x: P.x, y: P.y }; P.safeT = 0; } }
  }

  /* ======================= FÄHIGKEITEN ======================= */
  function wmul(P) {
    const it = P.waffe, tier = Math.max(0, (Z.run && Z.run.tier) || 0);
    if (!it) return Z.BAL.itemMul(tier) * 0.95;
    return Z.BAL.itemMul(Math.max(it.tier | 0, tier - 1)) * (1 + 0.08 * (it.rar | 0)) * (1 + 0.08 * Z.metaLvl(it.id));
  }
  K.wmul = wmul;
  function meleeHit(P, act, dmg, o) {
    const rw = o.w || 26, rh = o.h || 18;
    const r = { x: P.face > 0 ? P.x + P.w - 2 : P.x - rw + 2, y: P.y + (o.y != null ? o.y : 5), w: rw, h: rh };
    let any = false;
    for (const e of Z.enemies) {
      if (e.dead || act.hits.has(e) || e.intro > 0 || !U.overlap(r, e)) continue;
      act.hits.add(e); any = true;
      const crit = (e.st && e.st.root > 0 && P.ch === "E") || (e.st && e.st.mark > 0 && P.ch === "G" && act.type === "stab");
      hitP2(e, dmg * (crit ? 1.5 : 1), { src: "melee", kb: o.kb || 120, kbUp: o.kbUp || 40, dir: P.face, crit, eff: o.eff || null, melee: true });
    }
    for (const p of Z.propsLive || []) if (p.kind === "breakable" && p.hp > 0 && U.overlap(r, p)) { p.hp = 0; p.broke = true; }
    if (any) { FX.stop && FX.stop(0.03); padRumble(0.1, 0.3, 40); }
    return any;
  }
  function aimAt(P, power) {
    let ang = 0;
    if (K.held.up) ang = -PI / 4;
    else if (K.held.down && !P.onGround) ang = PI / 5;
    else if (!Z.settings || Z.settings.autoAim !== false) {
      const e = nearestFoe(P, 330, true);
      if (e) { const dx = e.x + e.w / 2 - (P.x + P.w / 2), dy = e.y + e.h * 0.4 - (P.y + 9); const a = Math.atan2(dy, Math.abs(dx)); if (Math.abs(a) < 0.55) ang = a; }
    }
    return ang;
  }
  function shoot(P, k) {
    const D2 = K.DMG.G, m = wmul(P), ang = aimAt(P, k);
    const sp = k >= 1 ? 680 : 540, x = P.x + P.w / 2 + P.face * 8, y = P.y + 9;
    const dmg = (k < 0.2 ? D2.arrow : D2.arrow + (D2.power - D2.arrow) * k) * m;
    const p = Z.spawnProj(k >= 1 ? "bolzen" : "pfeil", x, y, P.face, { vx: Math.cos(ang) * sp * P.face, vy: Math.sin(ang) * sp - 20, dmg, pierce: k >= 1, koop: 2 });
    if (p) { p.onHitE = (q, e) => { if (e) { e._kzAgg = 2.5; e._kzBy = 2; } }; p._koopDmg = dmg; }
    A.play("bow", { vol: 0.45, rate: k >= 1 ? 0.85 : 1.05 });
    if (k >= 1) { FX.burst(x, y, 10, { col: ["#ffe08a", "#fff"], sp: 90, life: 0.3, size: 1.6, kind: "spark", add: true }); padRumble(0.2, 0.4, 60); }
  }
  /* Pfeil-Treffer zählen für Spieler 2 (Geschosse laufen über Z.hitEnemy mit src „ranged“) */
  const upP0 = Z.updateProjs;
  Z.updateProjs = function (dt) {
    if (!K.p2) return upP0.apply(this, arguments);
    /* Pfeile von Spieler 2 getrennt rechnen, damit ihre Treffer Spieler 2 zählen (Ziel-Zorn, Rückblick) */
    if (!Z.projs.some(p => p.koop === 2)) return upP0.apply(this, arguments);
    const all = Z.projs.slice(), own = all.filter(p => p.koop === 2), rest = all.filter(p => p.koop !== 2);
    Z.projs.length = 0; Z.projs.push(...rest);
    let r; try { r = upP0.apply(this, arguments); } finally {
      const afterRest = Z.projs.slice();
      Z.projs.length = 0; Z.projs.push(...own);
      p2Hitting++;
      try { upP0.call(this, dt); } catch (e) { console.error("koop proj", e); } finally { p2Hitting--; }
      const afterOwn = Z.projs.slice();
      Z.projs.length = 0; Z.projs.push(...afterRest, ...afterOwn);
    }
    return r;
  };
  function startAct(P, type, dur, o) { P.act = Object.assign({ type, t: 0, dur, hits: new Set() }, o || {}); }
  function p2Abilities(P, dt) {
    const Pr = K.pressed, I = K.held, st = P.st || {};
    if (P.down || P.rollT > 0 || P.climbing || P.hurtT > 0 || P.grabbed || st.stun > 0 || P.drinkT > 0) { if (P.act && P.act.type === "bow" && !(P.rollT > 0)) {} if (P.rollT > 0 || P.hurtT > 0) P.act = null; return; }
    const silenced = st.silence > 0;
    const m = wmul(P);
    /* laufende Aktion */
    if (P.act) {
      const a = P.act; a.t += dt;
      if (a.type === "bow") {
        if (I.a1) { a.charge = Math.min(0.75, a.charge + dt); if (a.charge >= 0.75 && !a.full) { a.full = true; FX.ring(P.x + P.w / 2 + P.face * 6, P.y + 10, 8, "#ffe08a", 0.25, 1.5); A.play("ui", { vol: 0.25, rate: 1.6 }); } }
        else { shoot(P, a.charge < 0.14 ? 0 : a.charge / 0.75); P.act = { type: "shot", t: 0, dur: 0.16, hits: new Set() }; }
        return;
      }
      if (a.type === "stab" && a.t >= 0.06 && a.t <= 0.16) meleeHit(P, a, K.DMG.G.stab * m, { w: 26, h: 16, y: 7, kb: 140 });
      if (a.type === "whip" && a.t >= 0.09 && a.t <= 0.2) meleeHit(P, a, (a.n === 3 ? K.DMG.E.whip3 : K.DMG.E.whip) * m, { w: 40, h: 22, y: 3, kb: a.n === 3 ? 180 : 90, eff: a.n === 3 ? { root: 0.9, poison: 1 } : null });
      if (a.type === "claw" && a.t >= 0.12 && a.t <= 0.24) { if (meleeHit(P, a, K.DMG.E.claw * m, { w: 32, h: 26, y: 0, kb: 240, kbUp: 120 })) FX.addShake(2); }
      if (a.t >= a.dur) P.act = null;
      else return;
    }
    if (P.ch === "G") {
      if (Pr.a1) { startAct(P, "bow", 99, { charge: 0, lock: false }); return; }
      if (Pr.a2) { startAct(P, "stab", 0.3, { lock: true }); A.play("swing", { vol: 0.4, rate: 1.3 }); return; }
      if (Pr.s1 && !silenced && P.cd.s1 <= 0) { if (rexSic(P)) { P.cd.s1 = P.cdMax.s1 = 7; } else P.cd.s1 = 0.6; return; }
      if (Pr.s2 && !silenced && P.cd.s2 <= 0) { arrowHail(P, m); P.cd.s2 = P.cdMax.s2 = 11; return; }
    } else {
      if (Pr.a1) {
        if (P.bear > 0) { startAct(P, "claw", 0.42, { lock: true }); A.play("swingHeavy", { vol: 0.5, rate: 0.85 }); if (Math.random() < 0.3) A.play("roar", { vol: 0.25, rate: 1.4 }); }
        else { P.comboN = P.comboT > 0 ? (P.comboN % 3) + 1 : 1; P.comboT = 0.7; startAct(P, "whip", P.comboN === 3 ? 0.4 : 0.3, { n: P.comboN, lock: true }); A.play("swing", { vol: 0.35, rate: P.comboN === 3 ? 0.8 : 1.2 }); }
        return;
      }
      if (Pr.a2 && P.cd.a2 <= 0 && P.bear <= 0) { P.bear = 7; P.cd.a2 = P.cdMax.a2 = 15; A.play("roar", { vol: 0.5, rate: 1.1 }); FX.burst(P.x + P.w / 2, P.y + 14, 22, { col: ["#7ab060", "#c8e090", "#6a4a30"], sp: 110, life: 0.7, size: 2.4, kind: "leaf" }); FX.ring(P.x + P.w / 2, P.y + 14, 22, "#8fd36b", 0.4, 2); FX.text(P.x + P.w / 2, P.y - 14, L(["Bärengestalt!", "Bear form!"]), "#c8e090"); return; }
      if (Pr.s1 && !silenced && P.cd.s1 <= 0) { vineGrasp(P, m); P.cd.s1 = P.cdMax.s1 = 9; return; }
      if (Pr.s2 && !silenced && P.cd.s2 <= 0) { bloom(P); P.cd.s2 = P.cdMax.s2 = 16; return; }
    }
  }
  function arrowHail(P, m) {
    const e = nearestFoe(P, 320, true), tx = e ? e.x + e.w / 2 : P.x + P.w / 2 + P.face * 110;
    let ty = (e ? e.y : P.y) - 10, top = ty;
    for (let i = 0; i < 10; i++) { if (solidAtPx(tx, top - 14)) break; top -= 14; }
    A.play("bow", { vol: 0.5, rate: 0.8 }); FX.text(P.x + P.w / 2, P.y - 14, L(["Pfeilhagel!", "Arrow hail!"]), "#ffe08a");
    for (let i = 0; i < 9; i++) later(0.08 * i, () => { if (!K.p2) return; const q = Z.spawnProj("regenpfeil", tx + (Math.random() - 0.5) * 70, top, 1, { dmg: K.DMG.G.rain * m, koop: 2 }); if (q) q.onHitE = (p, en) => { if (en) { en._kzAgg = 2; en._kzBy = 2; } }; });
  }
  function rexSic(P) {
    const R = K.rex; if (!R) return false;
    const e = nearestFoe(P, 280, false);
    if (!e) { A.play("bark", { vol: 0.4 }); FX.text(R.x + 8, R.y - 8, "?", "#e8d0a0"); return false; }
    R.state = "attack"; R.tgt = e; R.bites = 3; R.biteT = 0; R.t = 0;
    A.play("bark", { vol: 0.6 }); FX.text(P.x + P.w / 2, P.y - 14, L(["Rex, fass!", "Rex, sic 'em!"]), "#e8d0a0");
    return true;
  }
  function rexUpdate(dt) {
    const R = K.rex, P = K.p2; if (!R || !P) return;
    R.t += dt; R.biteT -= dt; R.nipT -= dt;
    let tx;
    if (R.state === "attack") {
      const e = R.tgt;
      if (!e || e.dead || R.t > 5 || R.bites <= 0) { R.state = "follow"; R.tgt = null; }
      else {
        tx = e.x + e.w / 2;
        if (R.biteT <= 0 && U.overlap({ x: R.x - 5, y: R.y - 6, w: R.w + 10, h: R.h + 12 }, e)) {
          R.biteT = 0.32; R.bites--; hitP2(e, K.DMG.G.rex * wmul(P), { kb: 40, eff: { mark: 6 }, src: "skill" });
          A.play("bite", { x: R.x, vol: 0.5 }); FX.burst(R.x + R.w / 2 + R.face * 8, R.y + 4, 6, { col: ["#fff", "#e04040"], sp: 60, life: 0.25, size: 1.5, kind: "spark" });
        }
      }
    }
    if (R.state !== "attack") {
      tx = P.x + P.w / 2 - P.face * 18;
      /* Rex hilft nebenbei: zwickt Gegner direkt neben Friedrich (schwach, markiert kurz) */
      if (R.nipT <= 0) { const e = nearestFoe(P, 46, false); if (e && !P.down) { R.nipT = 1.6; R.state = "attack"; R.tgt = e; R.bites = 1; R.t = 0; } }
      if (P.down) tx = P.x + P.w / 2 + 10;
    }
    const dx = tx - (R.x + R.w / 2), far = Math.abs(dx) > 260 || Math.abs(R.y - P.y) > 180;
    if (far && R.state !== "attack") { R.x = P.x - P.face * 14; R.y = P.y + P.h - R.h; R.vx = R.vy = 0; Z.unstick && Z.unstick(R); return; }
    R.face = Math.abs(dx) > 4 ? Math.sign(dx) : R.face;
    const sp = R.state === "attack" ? 250 : Math.abs(dx) > 30 ? Math.min(210, Math.abs(P.vx) + 60) : 0;
    R.vx = U.approach(R.vx, Math.sign(dx) * sp, 1600 * dt);
    R.vy = Math.min(R.vy + 1400 * dt, 500);
    if (R.onGround && (R.hitWall || (R.tgt && R.tgt.y + R.tgt.h < R.y - 10 && Math.abs(dx) < 60) || (R.state !== "attack" && P.y + P.h < R.y - 20 && Math.abs(dx) < 50))) R.vy = -380;
    Z.moveBody(R, dt);
    R.run += Math.abs(R.vx) * dt / 12;
  }
  function vineGrasp(P, m) {
    const cx = P.x + P.w / 2 + P.face * 46, cy = P.y + P.h;
    let n = 0;
    for (const e of Z.enemies) {
      if (e.dead || e.dummy && !Z.level.hub) continue;
      const ex = e.x + e.w / 2, ey = e.y + e.h;
      if (Math.abs(ex - cx) < 76 && Math.abs(ey - cy) < 60) {
        n++; try { Z.addStatus(e, "root", 2.6); } catch (_) {}
        hitP2(e, K.DMG.E.vine * m, { kb: 0, src: "skill" });
        K.fx.push({ kind: "vine", e, x: ex, y: ey, t: 0, life: 2.6, h: Math.min(40, e.h) });
      }
    }
    K.fx.push({ kind: "vinegrow", x: cx, y: cy, t: 0, life: 0.6 });
    A.play("roots", { vol: 0.6 }); FX.text(P.x + P.w / 2, P.y - 14, n ? L(["Rankengriff!", "Vine grasp!"]) : L(["Ranken …", "Vines…"]), "#8fd36b");
    FX.burst(cx, cy - 4, 14, { col: ["#5a8a3a", "#8fd36b", "#c8e090"], sp: 80, up: 60, life: 0.5, size: 2, kind: "leaf" });
  }
  function bloom(P) {
    const y = P.onGround ? P.y + P.h : (W.groundBelow ? W.groundBelow(P.x + P.w / 2, P.y + P.h, 120) : null) || P.y + P.h;
    K.fx.push({ kind: "bloom", x: P.x + P.w / 2, y, t: 0, life: 7, tick: 0 });
    A.play("magic", { vol: 0.55, rate: 1.2 }); FX.text(P.x + P.w / 2, P.y - 14, L(["Heilblüte", "Healing bloom"]), "#ffb0d0");
  }
  function fxUpdate(dt) {
    const Q = Z.player, P = K.p2;
    for (let i = K.fx.length - 1; i >= 0; i--) {
      const f = K.fx[i]; f.t += dt;
      if (f.t > f.life) { K.fx.splice(i, 1); continue; }
      if (f.kind === "vine" && f.e) { f.x = f.e.x + f.e.w / 2; if (f.e.dead) f.life = Math.min(f.life, f.t + 0.3); }
      if (f.kind === "bloom") {
        f.tick -= dt; if (f.tick > 0) continue; f.tick = 0.5;
        const near = (B) => B && Math.abs(B.x + B.w / 2 - f.x) < 50 && Math.abs(B.y + B.h - f.y) < 40;
        if (Q && near(Q) && !Q.dead && !Q.koopDown && Q.hp < Q.hpMax) { const n = Math.max(1, Math.round(Q.hpMax * 0.025)); Z.healPlayer(n); FX.text(Q.x + Q.w / 2, Q.y - 4, "+" + n, "#8fe08a"); }
        if (P && near(P) && !P.down && P.hp < P.hpMax) { const n = Math.max(1, Math.round(P.hpMax * 0.025)); P.hp = Math.min(P.hpMax, P.hp + n); FX.text(P.x + P.w / 2, P.y - 4, "+" + n, "#8fe08a"); }
        FX.burst(f.x, f.y - 6, 4, { col: ["#ffb0d0", "#fff0a0", "#c8e090"], sp: 30, up: 40, life: 0.7, size: 1.6, kind: "glow", add: true });
      }
    }
  }
  const LATER = [];
  function later(t, fn) { LATER.push({ t, fn }); }
  function laterTick(dt) { for (let i = LATER.length - 1; i >= 0; i--) { const l = LATER[i]; l.t -= dt; if (l.t <= 0) { LATER.splice(i, 1); try { l.fn(); } catch (e) { console.error("koop", e); } } } }

  /* ======================= BENUTZEN, BEUTE, WIEDERBELEBEN ======================= */
  function p2Use(P, dt) {
    const Q = Z.player;
    /* Wiederbeleben: neben dem Gefallenen „Benutzen“ halten */
    const near = (a, b) => Math.abs(a.x + a.w / 2 - (b.x + b.w / 2)) < 30 && Math.abs(a.y + a.h - (b.y + b.h)) < 26;
    const bloomNear = B => K.fx.some(f => f.kind === "bloom" && Math.abs(f.x - (B.x + B.w / 2)) < 50 && Math.abs(f.y - (B.y + B.h)) < 40);
    K.reviving1 = false; K.reviving2 = false;
    if (Q && Q.koopDown && !P.down && near(P, Q) && K.held.use) {
      K.reviving2 = true; P.vx *= 0.5;
      Q.revive = (Q.revive || 0) + dt / (bloomNear(Q) ? 1.6 : 2.6);
      if (Q.revive >= 1) { Q.revive = 0; reviveP1(); }
      return;
    } else if (Q && Q.koopDown) Q.revive = Math.max(0, (Q.revive || 0) - dt * 0.5);
    if (P.down && Q && alive1() && near(Q, P) && inp.held.use) {
      K.reviving1 = true;
      P.revive = (P.revive || 0) + dt / (bloomNear(P) ? 1.6 : 2.6);
      if (P.revive >= 1) reviveP2();
    } else if (P.down) P.revive = Math.max(0, (P.revive || 0) - dt * 0.5);
    if (P.down || !K.pressed.use) return;
    /* Gegenstände: wer „Benutzen“ drückt, nimmt */
    const px = P.x + P.w / 2, py = P.y + P.h;
    let best = null, bd = 26;
    for (const p of Z.pickups) {
      if (p.open || !["item", "food"].includes(p.kind) || p.rack) continue;
      const d = Math.abs(p.x - px) + Math.abs(p.y - py) * 0.6; if (d < bd) { bd = d; best = p; }
    }
    if (best && best.kind === "food") {
      Z.pickups.splice(Z.pickups.indexOf(best), 1); const f = best.food || Z.FOOD[0]; const n = Math.round(P.hpMax * f.heal); P.hp = Math.min(P.hpMax, P.hp + n);
      A.play("potion", { vol: 0.5 }); FX.text(P.x + P.w / 2, P.y - 14, L(f.n) + " +" + n, "#e8c890"); return;
    }
    if (best && best.kind === "item") return takeItem(P, best);
    /* sonst: Tür, Truhe, Tor, Händler … über die normale Benutzen-Logik (spiel.js) */
    if (Z._koopFind && Z._koopInteract && !(Z.ui && (Z.ui.modalOpen || Z.ui.choiceActive))) {
      const sv = Z.player; let tg = null;
      Z.player = P; try { tg = Z._koopFind(); } catch (e) { console.error("koop", e); } finally { Z.player = sv; }
      if (tg && tg.type === "obj" && tg.o && tg.o.mutSchrein && Z.mut && Z.mut.oeffne) { /* W27 Koop: Wandlungsschrein (W29) – Spieler 2 wählt für sich */
        try { Z.mut.oeffne(P); } catch (e) { console.error("koop mut", e); }
      } else if (tg && !(tg.type === "pickup" && tg.p && tg.p.kind === "item")) {
        try { Z._koopInteract(tg); } catch (e) { console.error("koop", e); }
      }
    }
  }
  function takeItem(P, p) {
    const it = p.it, d = Z.itemDef(it);
    if (!d) return;
    if (it.type === "skill" || d.kind === "shield") { FX.text(P.x + P.w / 2, P.y - 14, L(["Das trägt nur Ezekiel.", "Only Ezekiel can carry that."]), "#c8b8a8"); A.play("ui", { vol: 0.3, rate: 0.8 }); return; }
    const old = P.waffe; P.waffe = it;
    Z.pickups.splice(Z.pickups.indexOf(p), 1);
    if (old) Z.spawnPickup("item", p.x, p.y - 4, { it: old, drop: true, vy: -140, vx: -P.face * 60 });
    if (Z.meta && Z.meta.found) { Z.meta.found[it.id] = true; }
    A.play("pickup", { vol: 0.6 });
    FX.text(P.x + P.w / 2, P.y - 14, CH[P.ch].n + L([" nimmt: ", " takes: "]) + L(d.n), Z.RARITY[it.rar].col, true);
    FX.burst(P.x + P.w / 2, P.y + 10, 14, { col: [Z.RARITY[it.rar].col, "#fff"], sp: 80, up: 40, life: 0.5, size: 2, kind: "spark", add: true });
    hudT = 0;
  }
  /* gemeinsames Gold, Splitter, Glut, Schlüssel: Spieler 2 sammelt in Ezekiels Beutel */
  function p2Collect(P, dt) {
    if (P.down) return;
    const Q = Z.player; if (!Q) return;
    const cx = P.x + P.w / 2, cy = P.y + P.h / 2;
    for (let i = Z.pickups.length - 1; i >= 0; i--) {
      const p = Z.pickups[i];
      if (!(p.kind === "gold" || p.kind === "shard" || p.kind === "glut" || p.kind === "key") || p.t < 0.45) continue;
      const dx = cx - p.x, dy = cy - p.y, d = Math.hypot(dx, dy);
      if (d > 70) continue;
      const dq = Math.hypot(Q.x + Q.w / 2 - p.x, Q.y + Q.h / 2 - p.y); if (dq < d && !Q.dead && !Q.koopDown) continue; /* Ezekiel ist näher: sein Magnet */
      if (d > 10) { const sp = Math.min(500, 140 + p.t * 260); p.x += dx / d * sp * dt; p.y += dy / d * sp * dt; p.vx = 0; p.vy = 0; p.t = Math.max(p.t, 0.46); continue; }
      Z.pickups.splice(i, 1);
      if (p.kind === "gold") { Q.gold += p.n; Z.stats.gold = (Z.stats.gold || 0) + p.n; A.play("coin", { vol: 0.3, gap: 0.04 }); }
      else if (p.kind === "shard") { Q.shards += p.n; A.play("gem", { vol: 0.35, gap: 0.05, rate: 1.4 }); }
      else if (p.kind === "glut") { Q.glut = (Q.glut || 0) + (p.n || 1); Z.stats.glut = (Z.stats.glut || 0) + (p.n || 1); A.play("fire", { vol: 0.3, rate: 1.5 }); }
      else if (p.kind === "key") { Q.keys = (Q.keys || 0) + 1; A.play("chain", { vol: 0.4, rate: 1.6 }); FX.text(P.x + P.w / 2, P.y - 10, L(["Schlüssel", "Key"]), "#ffd27a", true); }
    }
  }

  /* ======================= GEFAHREN FÜR SPIELER 2 ======================= */
  function hazardRect(h, at) {
    switch (h.kind) {
      case "fire": case "poisonpool": case "lava": return { x: h.x - h.w / 2, y: h.y - 10, w: h.w, h: 12 };
      case "poisoncloud": return { x: h.x - h.w / 2, y: h.y - 50, w: h.w, h: 52 };
      case "rockspike": return at < 0.25 ? { x: h.x - h.w / 2, y: h.y - 26, w: h.w, h: 26 } : null;
      case "roots": return at < 0.4 ? { x: h.x - h.w / 2, y: h.y - 22, w: h.w, h: 22 } : null;
      case "breath": { const x0 = h.dir > 0 ? h.x : h.x - h.w; return { x: x0, y: h.y - 16, w: h.w, h: 30 }; }
      case "strike": return at < 0.18 ? { x: h.x - h.w / 2, y: h.y - (h.hgt || 400), w: h.w, h: h.hgt || 400 } : null;
      case "column": return { x: h.x - h.w / 2, y: h.y - (h.hgt || 200), w: h.w, h: h.hgt || 200 };
      case "zone": return at < (h.active || 0.2) ? { x: h.x - h.w / 2, y: h.y - (h.hgt || 30), w: h.w, h: h.hgt || 30 } : null;
      default: return null;
    }
  }
  function p2Dangers(P, dt) {
    if (P.down) return;
    const B = { x: P.x + 2, y: P.y + 3, w: P.w - 4, h: P.h - 4 };
    for (const p of Z.projs) {
      if (p.owner !== "e" || p.dead || p.hits.has(P)) continue;
      const r = p.r || 2;
      if (p.x + r > B.x && p.x - r < B.x + B.w && p.y + r > B.y && p.y - r < B.y + B.h) {
        p.hits.add(P);
        if (p.k && p.k.web) { if (P.iframe <= 0 && P.rollT <= 0) { Z.addStatus(P, "web", 2, true); FX.text(P.x + P.w / 2, P.y - 8, L(["Eingesponnen!", "Webbed!"]), "#eee8f0"); } p.dead = true; continue; }
        const hit = hurtP2(p.dmg, { x: p.x - p.vx * 0.05, kb: p.k && p.k.rock ? 220 : 120, eff: p.eff });
        if (hit && !(p.k && (p.k.wave || p.k.ground))) p.dead = true;
      }
    }
    for (const h of Z.hazards) {
      if (h.owner === "p" || (h.warn && h.t < h.warn)) continue;
      const at = h.t - (h.warn || 0), r = hazardRect(h, at); if (!r || !U.overlap(r, P)) continue;
      const once = h.once || h.kind === "strike" || h.kind === "zone";
      h._k2 = (h._k2 || 0) - dt;
      if (once) { if (h._hitP2) continue; h._hitP2 = true; }
      else { if (h._k2 > 0) continue; h._k2 = 0.35; }
      hurtP2(h.dmg, { x: h.x, kb: h.kb || 140, kbUp: h.kbUp, eff: h.eff });
      if (h.kind === "fire" || h.kind === "lava") try { Z.addStatus(P, "burn", 1, true); } catch (_) {}
    }
    /* Abgrund */
    const lv = Z.level;
    if (lv && P.y > lv.H * T + 40) { placeNear(P, true); hurtP2(Math.round(P.hpMax * 0.12), { force: true, kb: 0 }); }
    try { p2Tiles(P); } catch (e) { console.error("koop kacheln", e); }
  }
  /* Kachel-Gefahren wie bei Ezekiel (kampf.js hazards): Stacheln 14 %, Lava 15 %, Wasser 8 %, Abgrund 15 % – danach zurück an den letzten sicheren Platz */
  function p2Tiles(P) {
    if (P.down) return;
    const hb = { x: P.x + 2.5, y: P.y + 4, w: P.w - 5, h: P.h - 6 }, tx0 = Math.floor(hb.x / T), tx1 = Math.floor((hb.x + hb.w) / T), tyF = Math.floor((P.y + P.h - 3) / T), tyM = Math.floor((P.y + P.h * 0.5) / T);
    let spike = false, liquid = 0;
    for (let tx = tx0; tx <= tx1; tx++) { const a = W.tile(tx, tyF), b = W.tile(tx, tyM); if (a === 3) spike = true; if (a === 5 || b === 5) liquid = 5; if ((a === 6 || b === 6) && !liquid) liquid = 6; }
    const back = () => { if (P.lastSafe) { P.x = P.lastSafe.x; P.y = P.lastSafe.y; } else placeNear(P, false); P.vx = 0; P.vy = 0; P.rollT = 0; P.act = null; P.climbing = false; };
    if (W.tile(Math.floor((P.x + P.w / 2) / T), Math.floor((P.y + P.h * 0.35) / T)) === 9) { hurtP2(Math.round(P.hpMax * 0.15), { force: true, kb: 0 }); if (!P.down) { back(); P.iframe = Math.max(P.iframe, 1.1); FX.text(P.x + P.w / 2, P.y - 10, L(["Abgestürzt!", "Fell!"]), "#ff8a6a", true); } return; }
    if (spike && P.iframe <= 0) { hurtP2(Math.round(P.hpMax * 0.14), { kb: 0, spike: true }); if (!P.down) { back(); P.iframe = Math.max(P.iframe, 1.1); } }
    if (liquid && P.y + P.h > Math.floor((P.y + P.h - 3) / T) * T + 6) {
      const t = P.time || 0, skip = P._hzRT != null && t - P._hzRT >= 0 && t - P._hzRT < 1;
      if (!skip) { P._hzRT = t; hurtP2(Math.round(P.hpMax * (liquid === 5 ? 0.15 : 0.08)), { force: true, kb: 0, eff: liquid === 5 ? { burn: 1 } : null }); }
      if (liquid === 6) { A.play("splash", { x: P.x, y: P.y }); FX.burst(P.x + P.w / 2, P.y + P.h, 10, { col: ["#4a6a5a", "#8aa090"], sp: 90, ang: -Math.PI / 2, spread: 1.2, life: 0.5, g: 400, size: 2 }); }
      if (!P.down) { back(); P.iframe = Math.max(P.iframe, liquid === 6 ? 0.4 : 1); }
    }
  }
  /* ===== W27 Koop: Fallen-Haken (klar abgegrenzt) =====
     Z.koopTrapHit(rect, anteil, o): Fallen anderer Module melden ein Wirkrechteck; trifft es Spieler 2, bekommt er anteil × LP-Max Schaden.
     Rückgabe true = getroffen. Ohne Spieler 2 sofort false (Einzelspieler unverändert). */
  Z.koopTrapHit = (r, frac, o) => {
    const P = K.p2; if (!P || P.down || !r || !U.overlap(r, P) || P.iframe > 0) return false;
    return hurtP2(Math.round(P.hpMax * (frac || 0.1)), Object.assign({ kb: 160, kbUp: 180 }, o || {}));
  };
  /* Fallen aus parcours.js / fallen.js (Pendel, Säge, Flammendüse, Stachelfalle, Steinschlag, Ballisten, Gift-/Lavaflächen …):
     nach dem normalen Schritt ein Prüfdurchgang mit dt = 0 und Spieler 2 als Z.player – nichts bewegt sich, nur die Trefferprüfung läuft.
     Eigener Treffer-Abstand je Falle (_p2Hit statt _pHit), damit Ezekiels Schutzzeit nicht mitverbraucht wird. */
  let probing = false;
  const upc0 = Z.updateParcours;
  if (upc0) Z.updateParcours = function (dt) {
    const r = upc0.apply(this, arguments);
    const P = K.p2;
    if (!P || P.down || probing || !Z.level || !(dt > 0)) return r;
    const TR = Z.traps || [], sv = Z.player, svH = Z.hurtPlayer;
    probing = true; K._swapP1 = sv;
    for (const tr of TR) { tr._p1Hit = tr._pHit; tr._pHit = tr._p2Hit; }
    const MV = Z.parcoursMovers || [], dxs = MV.map(m => m.dx);
    Z.player = P; Z.hurtPlayer = hurtP2;
    try { upc0.call(this, 0); } catch (e) { console.error("koop fallen", e); }
    finally {
      Z.player = sv; Z.hurtPlayer = svH; K._swapP1 = null; probing = false;
      for (const tr of TR) { tr._p2Hit = tr._pHit; tr._pHit = tr._p1Hit; }
      MV.forEach((m, i) => { m.dx = dxs[i]; });
      if (K.pendingBoth) { K.pendingBoth = false; try { bothDown(); } catch (e) { console.error("koop", e); } }
    }
    return r;
  };

  /* ======================= FÄHREN (parcours.js nimmt nur Ezekiel mit) ======================= */
  function p2Movers(P, dt) {
    const MV = Z.parcoursMovers; if (!MV || !MV.length || P.climbing) { P.onMover = null; return; }
    for (const m of MV) {
      const over = P.x + P.w > m.x + 1 && P.x < m.x + m.w - 1;
      if (P.onMover === m) {
        if (over && P.vy >= 0 && Math.abs(P.y + P.h - m.y) < 4 && !(P.dropT > 0)) { P.x += m.dx || 0; P.y = m.y - P.h; P.vy = 0; P.onGround = true; P.airJumps = 1; }
        else P.onMover = null;
      } else if (over && P.vy >= 0 && P.y + P.h >= m.y - 1 && P.y + P.h - P.vy * dt <= m.y + 4 && !(P.dropT > 0)) { P.y = m.y - P.h; P.vy = 0; P.onGround = true; P.onMover = m; P.airJumps = 1; }
    }
  }

  /* ======================= BOSSE IM KOOP: Muster, die beide fordern (nur mit 2 Spielern) =======================
     Doppelschlag: Zonen unter BEIDEN Spielern zugleich – beide müssen gleichzeitig ausweichen.
     Fadenband: ein Schicksalsfaden verbindet beide; wer sich zu weit entfernt, lässt ihn reißen (Schaden für beide). */
  function koopBoss(dt) {
    const b = Z.boss, Q = realP1(), P = K.p2;
    const fight = b && !b.dead && !Z.bossDefeated && !(b.intro > 0) && b.hp > 0 && alive1() && alive2() && Z.level && !Z.level.hub;
    if (!fight) { K.bt = Math.max(K.bt == null ? 9 : K.bt, 7); K.band = null; return; }
    K.bt = (K.bt == null ? 9 : K.bt) - dt;
    if (K.bt <= 0) {
      K.bt = 13 + Math.random() * 6; K.bn = (K.bn || 0) + 1;
      const dmg = Math.round(Math.max(Q.hpMax, P.hpMax) * 0.13);
      if (K.bn % 2) {
        for (const B of [Q, P]) { const fy = B.onGround ? B.y + B.h : (W.groundBelow ? W.groundBelow(B.x + B.w / 2, B.y + B.h, 160) : null) || B.y + B.h; Z.spawnHazard({ kind: "zone", x: B.x + B.w / 2, y: fy, w: 56, hgt: 44, warn: 1.05, active: 0.2, life: 0.25, dmg, owner: "e", warnCol: "#e05a8a", col: "rgba(224,90,138,.55)" }); }
        note(L(["Doppelschlag – beide ausweichen!", "Twin strike – both of you dodge!"])); A.play("rune", { vol: 0.5 });
      } else {
        K.band = { t: 0, life: 5, warn: 1.2, tick: 0, dmg: Math.round(Math.max(Q.hpMax, P.hpMax) * 0.05) };
        note(L(["Fadenband – bleibt zusammen!", "Fate thread – stay together!"])); A.play("web", { vol: 0.6 });
      }
    }
    const F = K.band; if (!F) return;
    F.t += dt; if (F.t > F.life) { K.band = null; return; }
    if (F.t < F.warn) return;
    const ax = Q.x + Q.w / 2, ay = Q.y + Q.h / 2, bx = P.x + P.w / 2, by = P.y + P.h / 2, d = Math.hypot(ax - bx, ay - by);
    F.taut = d > 190;
    if (F.taut) {
      /* Faden zieht beide sanft zusammen */
      const ux = (bx - ax) / (d || 1); Q.vx += ux * 260 * dt; P.vx -= ux * 260 * dt;
      F.tick -= dt; if (F.tick <= 0) { F.tick = 0.5; Z.hurtPlayer(F.dmg, { kb: 0, unblockable: true, parryable: false, hazard: true }); hurtP2(F.dmg, { kb: 0 }); }
    } else F.tick = Math.min(F.tick, 0.15);
  }
  function drawBand(c, t) {
    const F = K.band, P = K.p2, Q = Z.player; if (!F || !P || !Q) return;
    const ax = Q.x + Q.w / 2, ay = Q.y + 12, bx = P.x + P.w / 2, by = P.y + 12;
    const k = F.t < F.warn ? F.t / F.warn : 1, fade = Math.min(1, (F.life - F.t) / 0.4);
    c.save(); c.globalAlpha *= fade * (F.t < F.warn ? 0.35 + 0.3 * Math.sin(t * 20) : 1);
    c.strokeStyle = F.taut ? "#ff5a6a" : "#e8a0c0"; c.lineWidth = F.taut ? 1.8 : 1;
    c.beginPath(); c.moveTo(ax, ay);
    const mx = (ax + bx) / 2, my = (ay + by) / 2 + (F.taut ? 0 : 14 * k) + Math.sin(t * 6) * 2;
    c.quadraticCurveTo(mx, my, bx, by); c.stroke();
    if (F.taut && Math.random() < 0.3) FX.burst(mx, my, 2, { col: ["#ff5a6a", "#ffd0e0"], sp: 40, life: 0.3, size: 1.4, kind: "spark", add: true });
    c.restore();
  }
  K.bossInfo = () => ({ bt: K.bt, bn: K.bn || 0, band: K.band ? { t: K.band.t, taut: !!K.band.taut } : null });

  /* ======================= HAUPTTAKT SPIELER 2 ======================= */
  function p2Tick(dt) {
    const P = K.p2, Q = Z.player; if (!P || !Q || !Z.level) return;
    laterTick(dt);
    /* neues Gebiet (auch nach Rückweg-Gnade, Bossrausch, Lager): neben Ezekiel absetzen */
    if (K.lv !== Z.level) {
      const neu = K.lv !== null; K.lv = Z.level; K.farT = 0; K.fx.length = 0;
      P.hpMax = Math.max(60, Math.round(Q.hpMax * K.HP_K));
      if (P.down) { P.down = false; P.hp = Math.round(P.hpMax * 0.5); FX.text(Q.x, Q.y - 20, CH[P.ch].n + L([" ist zurück (halbes Leben).", " is back (half health)."]), CH[P.ch].col); }
      if (Z.level.hub) P.hp = P.hpMax;
      P.hp = Math.min(P.hp, P.hpMax); P.bear = 0; P.act = null;
      placeNear(P, neu);
      rescaleEnemies();
    }
    /* Ezekiels Lebensleiste kann wachsen (Schriftrollen, Segen): Spieler 2 wächst mit */
    const want = Math.max(60, Math.round(Q.hpMax * K.HP_K)); if (want !== P.hpMax) { const r = P.hp / P.hpMax; P.hpMax = want; if (!P.down) P.hp = Math.max(1, Math.round(want * r)); }
    for (const e of Z.enemies) if (!e._koopK && !e.dummy && e.def) { rescaleEnemies(); break; }
    if (P.down) { P.downT = (P.downT || 0) + dt; P.vx *= Math.pow(0.02, dt); P.vy = Math.min(P.vy + C.GRAV * dt, C.MAXFALL); Z.moveBody(P, dt); }
    else if (!(Z.ui && Z.ui.choiceActive)) { p2Move(P, dt); p2Abilities(P, dt); }
    try { p2Movers(P, dt); } catch (e) { console.error("koop faehre", e); }
    try { koopBoss(dt); } catch (e) { console.error("koop boss", e); }
    p2Use(P, dt);
    p2Collect(P, dt);
    p2Dangers(P, dt);
    rexUpdate(dt);
    fxUpdate(dt);
    /* Leine: fällt einer zurück, wird er nach kurzer Zeit herangezogen (Ezekiel ist der Anker, solange er steht) */
    if (alive1() && !P.down) {
      const dx = Math.abs(P.x - Q.x), dy = Math.abs(P.y - Q.y);
      const far = dx > 430 || dy > 270;
      K.farT = far ? K.farT + dt : Math.max(0, K.farT - dt * 2);
      if (K.farT > 1.6) { K.farT = 0; FX.burst(P.x + P.w / 2, P.y + 14, 14, { col: ["#a99a8b", "#5a4a40"], sp: 70, life: 0.5, size: 3, kind: "smoke" }); placeNear(P, true); A.play("magic", { vol: 0.35, rate: 1.5 }); FX.text(P.x + P.w / 2, P.y - 12, "↯", CH[P.ch].col); }
    } else K.farT = 0;
    for (const a of ACT) K.pressed[a] = false;
  }
  K.tick = p2Tick;

  /* Gegner-Rechnung in zwei Gruppen (siehe Kopf) */
  const ue0 = Z.updateEnemies;
  Z.updateEnemies = function (dt) {
    if (!K.p2) return ue0.apply(this, arguments);
    try { p2Tick(dt); } catch (e) { console.error("koop", e); }
    if (!K.p2) return ue0.apply(this, arguments);
    try { pickTargets(dt); } catch (e) { console.error("koop", e); }
    const arr = Z.enemies, Q = K.p2, grpB = [], grpA = [];
    for (const e of arr) (e._kz === Q && !e.dead && alive2() ? grpB : grpA).push(e);
    if (!grpB.length || !Z._ueKern) return ue0.apply(this, arguments);
    arr.length = 0; for (const e of grpA) arr.push(e);
    let r, afterA;
    try { r = ue0.apply(this, arguments); } finally { afterA = Z.enemies.slice(); }
    const arr2 = Z.enemies; arr2.length = 0; for (const e of grpB) arr2.push(e);
    const sv = Z.player, svH = Z.hurtPlayer;
    K._swapP1 = sv; Z.player = Q; Z.hurtPlayer = hurtP2;
    try { Z._ueKern.call(this, dt); }
    catch (e) { console.error("koop gegner", e); }
    finally {
      Z.player = sv; Z.hurtPlayer = svH; K._swapP1 = null;
      const afterB = Z.enemies.slice(); Z.enemies.length = 0; for (const e of afterA) Z.enemies.push(e); for (const e of afterB) if (!afterA.includes(e)) Z.enemies.push(e);
      if (K.pendingBoth) { K.pendingBoth = false; try { bothDown(); } catch (e) { console.error("koop", e); } }
    }
    return r;
  };

  /* Gebietswechsel: Gefallene kommen mit halbem Leben zurück */
  const la0 = Z.loadArea;
  Z.loadArea = function (id) {
    const P = Z.player, wasDown = !!(P && P.koopDown);
    const r = la0.apply(this, arguments);
    try {
      if (K.p2) { K.lv = null; LATER.length = 0; }
      const Q = Z.player;
      if (Q && Q.koopDown) { Q.koopDown = false; Q.dead = false; Q.hp = Math.max(1, Math.round(Q.hpMax * 0.5)); }
      else if (wasDown && Q) { Q.hp = Math.max(1, Math.round(Q.hpMax * 0.5)); }
      if (Q && (wasDown || (Q && Q.koopDown === false && Q._koopBack))) setTimeout(() => { if (Z.player === Q && Z.toast) Z.toast(L(["Ezekiel ist zurück – mit halbem Leben.", "Ezekiel is back – with half health."]), 2200); }, 400);
      if (K.p2 && Z.level && Z.level.hub && Z.player) { K.p2.hp = K.p2.hpMax; K.p2.down = false; }
    } catch (e) { console.error("koop", e); }
    return r;
  };
  const nr0 = Z.newRun;
  Z.newRun = function () { const r = nr0.apply(this, arguments); try { K.stats = null; if (K.p2) { K.stats = { dmg: 0, kills: 0, revives: 0, downs: 0, hits: 0, ch: K.p2.ch }; K.p2.waffe = null; if (Z.meta) { Z.meta.koop = Z.meta.koop || { joins: 0, revives: 0, runs: 0 }; Z.meta.koop.runs = (Z.meta.koop.runs | 0) + 1; } if (Z.run) Z.run.koop = K.p2.ch; } } catch (_) {} return r; };
  const btc0 = Z.backToCamp;
  if (btc0) Z.backToCamp = function () { const r = btc0.apply(this, arguments); return r; };

  /* ======================= KAMERA ======================= */
  const cam = Z.cam, camUp0 = cam.update;
  function applyZoom(z) {
    const G = Z.gfx, cv = document.getElementById("cv"); if (!G || !cv) return;
    if (!K.baseS || (K.lastS && Math.abs(G.scale - K.lastS) > 1e-6)) K.baseS = G.scale; /* Fenstergröße geändert → neue Grundlage */
    const S = K.baseS * z;
    if (Math.abs(S - G.scale) < 1e-6) { K.lastS = S; return; }
    const cx = cam.x + cam.w / 2, cy = cam.y + cam.h / 2;
    G.scale = S; cam.w = cv.width / S; cam.h = cv.height / S; cam.x = cx - cam.w / 2; cam.y = cy - cam.h / 2; cam.clamp && cam.clamp();
    K.lastS = S;
  }
  cam.update = function (dt, p) {
    const Q = K.p2;
    if (!Q || p !== Z.player || !Z.level || !p) {
      if (K.zoom !== 1 && K.baseS) { K.zoom = Math.min(1, K.zoom + dt * 0.8); applyZoom(K.zoom); if (K.zoom >= 1) { K.zoom = 1; applyZoom(1); K.baseS = 0; K.lastS = 0; } }
      return camUp0.apply(this, arguments);
    }
    /* Mitte beider (Gefallene ziehen die Kamera nur halb), Zoom so, dass beide ins Bild passen */
    const w1 = p.koopDown ? 0.5 : 1, w2 = Q.down ? 0.5 : 1;
    const ax = p.x + p.w / 2, ay = p.y + p.h / 2, bx = Q.x + Q.w / 2, by = Q.y + Q.h / 2;
    const mx = (ax * w1 + bx * w2) / (w1 + w2), my = (ay * w1 + by * w2) / (w1 + w2);
    const S0 = K.baseS || Z.gfx.scale, cv = document.getElementById("cv");
    const baseW = cv ? cv.width / S0 : cam.w, baseH = cv ? cv.height / S0 : cam.h;
    const needW = Math.abs(ax - bx) + 150, needH = Math.abs(ay - by) + 110;
    const zT = U.clamp(Math.min(1, baseW / needW, baseH / needH), 0.78, 1);
    K.zoom += (zT - K.zoom) * (1 - Math.pow(0.12, dt));
    if (Math.abs(K.zoom - 1) < 0.002 && zT === 1) K.zoom = 1;
    applyZoom(K.zoom);
    const fake = { x: mx - p.w / 2, y: my - p.h / 2, w: p.w, h: p.h, vx: (p.vx + Q.vx) * 0.25, vy: Math.max(p.vy, Q.vy), face: p.face, onGround: p.onGround || Q.onGround, climbing: p.climbing || Q.climbing, lookDown: p.lookDown && !K.reviving1, lookUp: p.lookUp, stepOff: 0 };
    return camUp0.call(this, dt, fake);
  };

  /* ======================= ZEICHNEN ======================= */
  const lowGfx = () => !!(Z.gq && Z.gq.lean);
  function legsHuman(c, P, t, col, colB, boot) {
    const run = P.onGround && Math.abs(P.vx) > 12, ph = P.anim.run;
    let a1 = 0, a2 = 0;
    if (P.climbing) { a1 = Math.sin(P.anim.climb || 0) * 0.5; a2 = -a1; }
    else if (!P.onGround) { a1 = 0.55; a2 = -0.35; }
    else if (run) { a1 = Math.sin(ph) * 0.75; a2 = -a1; }
    const leg = (a, cc, bc, dx) => { const hx = dx, hy = -10, fx = hx + Math.sin(a) * 9.5, fy = Math.min(0, hy + Math.cos(a) * 10); D.limb(c, hx, hy, fx, fy, 3, cc); D.ell(c, fx + 0.8, fy - 0.2, 2, 0.9, bc); };
    leg(a2, colB, boot, -1.2); leg(a1, col, boot, 1.2);
  }
  function drawFriedrich(c, P, t) {
    const breathe = P.onGround && Math.abs(P.vx) < 10 ? Math.sin(t * 2) * 0.4 : 0;
    const a = P.act, bob = P.onGround && Math.abs(P.vx) > 12 ? Math.abs(Math.sin(P.anim.run)) * -1 : 0;
    c.save(); c.translate(0, bob);
    if (P.kneel) c.translate(0, 4);
    legsHuman(c, P, t, "#4a4028", "#3a3020", "#2a1e14");
    /* Köcher */
    c.save(); c.translate(-3.6, -16 - breathe); c.rotate(-0.3); D.poly(c, [-1.4, -4, 1.4, -4, 1.2, 4, -1.2, 4], "#5a3a22"); for (let i = 0; i < 3; i++) { D.limb(c, -0.8 + i * 0.8, -4, -1 + i, -7, 0.5, "#c8a070"); D.poly(c, [-1.6 + i, -7, -1 + i, -8.4, -0.4 + i, -7], "#e8e0d0"); } c.restore();
    /* Umhang hinten (weht beim Laufen) */
    const sway = Math.min(1, Math.abs(P.vx) / 150) * 3 + Math.sin(t * 3) * 0.4;
    D.poly(c, [-3.4, -20 - breathe, -6 - sway, -7, -2, -8], "#2a4220");
    /* Körper */
    D.poly(c, [-4.5, -9, 4.5, -9, 4, -20 - breathe, -4, -20 - breathe], "#3a5a2a");
    D.poly(c, [-4.5, -9, -1.4, -9, -1.6, -20 - breathe, -4, -20 - breathe], "#2a4220");
    D.poly(c, [-4.6, -9.4, 4.6, -9.4, 4.4, -6.4, -4.4, -6.4], "#3a5a2a");
    D.limb(c, -4, -13, 4, -13, 1, "#6a4a2a"); D.limb(c, -3.6, -20 - breathe, 3.6, -11, 0.8, "#6a4a2a");
    /* Kopf mit Kapuze */
    c.save(); c.translate(0.5, -23 - breathe);
    if (a && a.type === "stab") c.rotate(0.12);
    D.circ(c, 0, 0, 3.2, "#e0b890"); D.poly(c, [2.6, -0.4, 3.8, 0.4, 2.8, 0.9], "#e0b890");
    D.poly(c, [-3.5, 1, -3.5, -3, 3, -4, 4, -1, 0, -1.6], "#6a4a2a");
    D.poly(c, [0.6, 2, 3.6, 1.6, 3, 3.4, 1, 3.4], "#7a5a3a");
    c.fillStyle = "#2a2014"; c.fillRect(1.6, -0.6, 1, 0.9);
    D.poly(c, [-5, 3, -3.6, -4.6, 2, -5, 4.6, -1.6, 2.4, -3, -2, -2.4, -3, 3.4], "#2a4a20");
    c.restore();
    /* Arme + Bogen / Messer */
    const sh = -19 - breathe;
    if (a && (a.type === "bow" || a.type === "shot")) {
      const k = a.type === "bow" ? Math.min(1, a.charge / 0.75) : 0, ang = aimAtDraw(P);
      c.save(); c.translate(1, sh + 3); c.rotate(ang);
      /* vorderer Arm hält den Bogen, hinterer zieht die Sehne */
      D.limb(c, 0, 0, 7.5, 0, 1.8, "#3a5a2a"); D.circ(c, 7.6, 0, 1, "#e0b890");
      c.strokeStyle = "#7a5a30"; c.lineWidth = 1.3; c.beginPath(); c.arc(4, 0, 6.5, -1.15, 1.15); c.stroke();
      const sx = 4 + 6.5 * Math.cos(1.15), sy = 6.5 * Math.sin(1.15), pull = 7 - k * 6.5;
      c.strokeStyle = "rgba(240,230,210,.9)"; c.lineWidth = 0.4; c.beginPath(); c.moveTo(sx, -sy); c.lineTo(pull, 0); c.lineTo(sx, sy); c.stroke();
      D.limb(c, -1, 1, pull, 0, 1.8, "#2a4220"); D.circ(c, pull, 0, 1, "#e0b890");
      if (a.type === "bow") { D.limb(c, pull, 0, pull + 10, 0, 0.6, "#c8a070"); D.poly(c, [pull + 10, -1, pull + 12, 0, pull + 10, 1], k >= 1 ? "#ffe08a" : "#d8d0c8"); if (k >= 1) D.glow(c, pull + 11, 0, 4 + Math.sin(t * 20), "rgba(255,224,138,.6)"); }
      c.restore();
    } else if (a && a.type === "stab") {
      const k = Math.min(1, a.t / 0.12), reach = k < 1 ? k * 9 : 9 - (a.t - 0.12) * 20;
      D.limb(c, -2, sh, -4, sh + 5, 1.8, "#2a4220");
      D.limb(c, 1, sh, 3 + reach, sh + 4, 1.8, "#3a5a2a"); D.circ(c, 3.4 + reach, sh + 4, 1, "#e0b890");
      D.limb(c, 4 + reach, sh + 4, 11 + reach, sh + 3.4, 1.2, "#d8d0c8"); D.limb(c, 2.6 + reach, sh + 4.4, 4 + reach, sh + 4, 1.6, "#5a3a22");
      if (a.t < 0.18) { c.save(); c.globalAlpha *= 0.5; D.limb(c, 6, sh + 3.6, 20, sh + 3.4, 2.2, "rgba(255,240,210,.6)"); c.restore(); }
    } else {
      /* Bogen über der Schulter, Arme schwingen */
      const sw = P.onGround && Math.abs(P.vx) > 12 ? Math.sin(P.anim.run) * 3 : 0;
      c.save(); c.translate(-2, sh + 4); c.rotate(0.35); c.strokeStyle = "#7a5a30"; c.lineWidth = 1.2; c.beginPath(); c.arc(0, 0, 7, -1.3, 1.3); c.stroke(); c.strokeStyle = "rgba(240,230,210,.7)"; c.lineWidth = 0.4; c.beginPath(); c.moveTo(7 * Math.cos(1.3), -7 * Math.sin(1.3)); c.lineTo(7 * Math.cos(1.3), 7 * Math.sin(1.3)); c.stroke(); c.restore();
      D.limb(c, -1, sh, -2 - sw * 0.5, sh + 8, 1.8, "#2a4220");
      if (P.climbing) { D.limb(c, 1, sh, 2, sh - 5 + Math.sin(P.anim.climb || 0) * 2, 1.8, "#3a5a2a"); }
      else { D.limb(c, 1, sh, 2.5 + sw * 0.6, sh + 8, 1.8, "#3a5a2a"); D.circ(c, 2.6 + sw * 0.6, sh + 8.4, 1, "#e0b890"); }
    }
    c.restore();
  }
  let _aim = 0;
  function aimAtDraw(P) { if (P.act && P.act.type === "bow") _aim = aimAt(P, 0); return _aim; }
  function drawEcho(c, P, t) {
    const breathe = P.onGround && Math.abs(P.vx) < 10 ? Math.sin(t * 2) * 0.4 : 0;
    const run = P.onGround && Math.abs(P.vx) > 12, ph = P.anim.run, a = P.act;
    c.save(); if (P.kneel) c.translate(0, 4);
    /* Füße unter der Robe */
    const f1 = run ? Math.sin(ph) * 4 : !P.onGround ? 2 : 0;
    D.ell(c, -1.5 - f1 * 0.5, -0.3, 1.9, 0.9, "#4a3a22"); D.ell(c, 2 + f1 * 0.5, -0.3, 1.9, 0.9, "#5a4a2a");
    /* Robe (schwingt) */
    const sw = (run ? Math.sin(ph) * 1.4 : 0) + Math.min(1, Math.abs(P.vx) / 150) * -1.6;
    D.poly(c, [-5 + sw, -1, 5 + sw, -1, 4, -18 - breathe, -4, -18 - breathe], "#e8e0d0");
    D.poly(c, [-5 + sw, -1, -1.4 + sw, -1, -1.6, -18 - breathe, -4, -18 - breathe], "#c8c0b0");
    D.limb(c, -3.4, -10, 3.4, -10, 1.1, "#5a8a4a"); for (let i = 0; i < 3; i++) D.ell(c, -2 + i * 2, -10, 0.9, 0.6, "#7ab060", 0.5);
    /* Stab in der hinteren Hand, Kugel leuchtet */
    const sh = -16 - breathe;
    c.save(); c.translate(-4, sh + 5); c.rotate(-0.15 + (run ? Math.sin(ph) * 0.08 : 0));
    D.limb(c, 0, 8, 0, -14, 1.2, "#6a4a2a"); D.circ(c, 0, -15, 1.8, "#ffd27a"); if (!lowGfx()) D.glow(c, 0, -15, 5 + Math.sin(t * 3), "rgba(255,210,120,.45)");
    D.limb(c, 0, -13, -2.4, -16, 0.6, "#7ab060"); D.ell(c, -2.6, -16.4, 1, 0.6, "#8fd36b", -0.6);
    c.restore();
    D.limb(c, -2, sh, -4, sh + 5, 1.8, "#e8e0d0");
    /* Kopf mit Hörnern */
    c.save(); c.translate(0.5, -20.5 - breathe); c.rotate(Math.sin(t * 0.8) * 0.05);
    D.circ(c, 0, 0, 3.3, "#c8a888");
    c.strokeStyle = "#5a4a30"; c.lineWidth = 1.4; c.lineCap = "round"; c.beginPath(); c.moveTo(-2.5, -2); c.quadraticCurveTo(-6, -5, -7.4, -9); c.moveTo(2.5, -2); c.quadraticCurveTo(6, -5, 7.4, -9); c.stroke();
    c.lineWidth = 1; c.beginPath(); c.moveTo(-5.4, -6); c.lineTo(-8, -6.4); c.moveTo(5.4, -6); c.lineTo(8, -6.4); c.stroke();
    D.ell(c, 7.4, -9.4, 1, 0.6, "#7ab060", 0.4);
    c.fillStyle = "#3a6a2a"; c.fillRect(1.5, -1, 1.2, 1); D.limb(c, 1, 1.6, 2.6, 1.6, 0.5, "#8a5a4a");
    c.restore();
    /* vorderer Arm: Peitsche */
    if (a && a.type === "whip") {
      const k = Math.min(1, a.t / 0.14), len = 8 + k * 32, up = a.n === 2 ? -6 : a.n === 3 ? 4 : -2;
      D.limb(c, 1, sh, 5, sh + 2, 1.8, "#e8e0d0"); D.circ(c, 5.4, sh + 2, 1, "#c8a888");
      c.strokeStyle = "#5a8a3a"; c.lineWidth = 1.4; c.beginPath(); c.moveTo(5.4, sh + 2);
      const ex = 5.4 + len, ey = sh + 6 + up + Math.sin(a.t * 30) * 2;
      c.quadraticCurveTo(5.4 + len * 0.5, sh - 8 + up * 2 * (1 - k), ex, ey); c.stroke();
      c.fillStyle = "#c8e090"; for (let i = 1; i <= 4; i++) { const q = i / 5; const x = 5.4 + len * q, y = sh + 2 + (ey - sh - 2) * q - Math.sin(q * PI) * 4 * (1 - k); c.fillRect(x - 0.5, y - 1.2, 1, 1); }
      if (a.n === 3 && a.t > 0.08) D.glow(c, ex, ey, 6, "rgba(143,211,107,.55)");
    } else {
      const sw2 = run ? Math.sin(ph) * 2.6 : 0;
      D.limb(c, 1, sh, 3 + sw2 * 0.5, sh + 7, 1.8, "#e8e0d0"); D.circ(c, 3.2 + sw2 * 0.5, sh + 7.4, 1, "#c8a888");
    }
    c.restore();
  }
  function drawBear(c, P, t) {
    const run = P.onGround && Math.abs(P.vx) > 12, ph = P.anim.run, a = P.act;
    const l = run ? Math.sin(ph) * 3 : 0;
    /* Beine */
    D.limb(c, -7, -6, -7 - l, 0, 3.6, "#4a3020"); D.limb(c, 6, -6, 6 + l, 0, 3.6, "#4a3020");
    D.limb(c, -4, -6, -4 + l, 0, 3.6, "#5a3a24"); D.limb(c, 8.5, -6, 8.5 - l, 0, 3.6, "#5a3a24");
    /* Körper */
    D.ell(c, 0, -10, 11, 6.5, "#6a4a30"); D.ell(c, -2, -12, 8, 4, "#7a5a38");
    for (let i = 0; i < 4; i++) D.ell(c, -6 + i * 4, -15.5, 1.6, 0.8, "#8fd36b", 0.3); /* Moos/Blätter im Fell */
    /* Kopf mit Echos Hörnern */
    c.save(); c.translate(11, -13 + (run ? Math.sin(ph * 2) * 0.6 : 0)); if (a && a.type === "claw") c.rotate(-0.2 + Math.min(1, a.t / 0.15) * 0.3);
    D.circ(c, 0, 0, 4.6, "#6a4a30"); D.ell(c, 3.6, 1.2, 2.6, 1.8, "#8a6a48"); D.circ(c, 5.8, 0.8, 0.9, "#1a1010");
    D.circ(c, -2, -3.8, 1.3, "#5a3a24");
    c.fillStyle = "#ffd27a"; c.fillRect(1.6, -1.6, 1.1, 1);
    c.strokeStyle = "#5a4a30"; c.lineWidth = 1.3; c.lineCap = "round"; c.beginPath(); c.moveTo(-1, -3.6); c.quadraticCurveTo(-3, -8, -6, -10); c.moveTo(1.4, -3.8); c.quadraticCurveTo(2, -8, 0.5, -11); c.stroke();
    c.restore();
    if (a && a.type === "claw" && a.t > 0.08 && a.t < 0.3) { c.save(); c.globalAlpha *= 1 - (a.t - 0.08) / 0.22; for (let i = 0; i < 3; i++) { c.strokeStyle = "rgba(255,240,210,.8)"; c.lineWidth = 1; c.beginPath(); c.arc(14, -10, 10 + i * 3, -1.2, 0.9); c.stroke(); } c.restore(); }
  }
  function drawFox(c, P, t) {
    const k = 1 - Math.max(0, P.rollT) / 0.3;
    c.save(); c.rotate(Math.sin(k * PI) * -0.25);
    D.ell(c, 0, -5, 7, 3.4, "#d8782a"); D.ell(c, 0.5, -4, 5, 2, "#f0e0c8");
    D.poly(c, [-6, -6, -14, -9 + Math.sin(t * 20), -12, -4], "#d8782a"); D.poly(c, [-12.5, -8.6, -14.6, -9.4, -13.4, -6.4], "#fff0e0");
    D.circ(c, 7, -7, 2.8, "#d8782a"); D.poly(c, [8.5, -7.5, 12, -6.4, 8.6, -5.4], "#e89a4a"); D.poly(c, [5.6, -9, 6.6, -12.4, 7.8, -9.4], "#c06a20");
    c.fillStyle = "#1a1010"; c.fillRect(7.6, -8, 0.9, 0.9);
    D.limb(c, -3, -3, -5 - Math.sin(k * 9) * 2, 0, 1.4, "#a85a20"); D.limb(c, 3, -3, 5 + Math.sin(k * 9) * 2, 0, 1.4, "#a85a20");
    c.restore();
  }
  function drawBody(c, P, t, id) {
    if (P.down) {
      c.save(); c.translate(0, -2.5); c.rotate(-PI / 2); c.translate(-2, 0);
      if (id === "G") drawFriedrich(c, Object.assign({}, P, { act: null, vx: 0, onGround: true }), t); else drawEcho(c, Object.assign({}, P, { act: null, vx: 0, onGround: true }), t);
      c.restore(); return;
    }
    if (id === "E" && P.rollT > 0) return drawFox(c, P, t);
    if (id === "E" && P.bear > 0) return drawBear(c, P, t);
    if (P.rollT > 0) { /* Rolle: zusammengekauert, dreht sich */
      const k = 1 - P.rollT / 0.3; c.save(); c.translate(0, -7); c.rotate(k * TAU * 0.9);
      D.circ(c, 0, 0, 6.5, "#3a5a2a"); D.poly(c, [-6, -2, -2, -7, 3, -6, 6, -1, 2, -2], "#2a4a20"); D.circ(c, 2.4, -3, 2.4, "#e0b890"); D.limb(c, -4, 4, 4, 4, 2.2, "#4a4028");
      c.restore(); return;
    }
    if (id === "G") drawFriedrich(c, P, t); else drawEcho(c, P, t);
  }
  K.drawBody = drawBody;
  function drawP2(c, t) {
    const P = K.p2; if (!P) return;
    const cx = P.x + P.w / 2, fy = P.y + P.h;
    /* Heilblüten und Ranken unter den Figuren */
    for (const f of K.fx) drawFx(c, f, t);
    if (K.rex) { const R = K.rex; Z.drawRex && Z.drawRex(c, R.x + R.w / 2, R.y + R.h, R.face, t, R.run, R.state === "follow" && Math.abs(R.vx) < 5 && P.onGround && Math.abs(P.vx) < 5); }
    const flick = P.iframe > 0 && P.rollT <= 0 && !P.down && Math.floor(t * 20) % 2 === 0 && P.iframe < 0.7 && P.iframe > 0.05;
    c.save(); c.globalAlpha *= flick ? 0.45 : 1;
    D.ell(c, cx, fy + 0.4, P.bear > 0 ? 11 : 6, 1.3, "rgba(0,0,0,.25)");
    P.kneel = !!K.reviving2;
    c.translate(cx, fy); c.scale(P.face || 1, 1);
    drawBody(c, P, t, P.ch);
    c.restore();
    if (Z.addLight && !P.down) Z.addLight(cx, P.y + 10, P.ch === "E" ? 64 : 58, P.ch === "E" ? "#ffe0a0" : "#ffd8a0", 0.3);
    /* Status: Wurzel/Netz/Betäubung */
    const st = P.st || {};
    if (st.stun > 0) for (let i = 0; i < 3; i++) { const a = t * 6 + i * 2.1; D.circ(c, cx + Math.cos(a) * 6, P.y - 4 + Math.sin(a) * 1.6, 1, "#ffe08a"); }
  }
  function drawFx(c, f, t) {
    if (f.kind === "bloom") {
      const k = Math.min(1, f.t / 0.4), fade = Math.min(1, (f.life - f.t) / 0.6);
      c.save(); c.globalAlpha *= fade;
      if (!lowGfx()) { c.save(); c.globalAlpha *= 0.18 + 0.06 * Math.sin(t * 3); D.ell(c, f.x, f.y - 2, 50, 10, "#c8f0a0"); c.restore(); }
      D.limb(c, f.x, f.y, f.x + Math.sin(t * 1.5) * 0.6, f.y - 9 * k, 1, "#5a8a3a");
      D.ell(c, f.x - 3, f.y - 4 * k, 2.6, 1, "#7ab060", -0.5); D.ell(c, f.x + 3, f.y - 5 * k, 2.6, 1, "#7ab060", 0.5);
      const by = f.y - 10 * k;
      for (let i = 0; i < 6; i++) { const a = i * TAU / 6 + t * 0.6; D.ell(c, f.x + Math.cos(a) * 2.6 * k, by + Math.sin(a) * 2.6 * k, 2.2 * k, 1.2 * k, i % 2 ? "#ffb0d0" : "#ff90b8", a); }
      D.circ(c, f.x, by, 1.4 * k, "#fff0a0"); if (!lowGfx()) D.glow(c, f.x, by, 10, "rgba(255,190,220,.45)");
      if (Z.addLight) Z.addLight(f.x, by, 50, "#ffc8e0", 0.25 * fade);
      c.restore();
    } else if (f.kind === "vine") {
      const k = Math.min(1, f.t / 0.25), fade = Math.min(1, (f.life - f.t) / 0.4);
      c.save(); c.globalAlpha *= fade;
      for (let j = 0; j < 3; j++) {
        c.strokeStyle = j === 1 ? "#4a7a2a" : "#5a8a3a"; c.lineWidth = 1.4; c.beginPath();
        const x0 = f.x - 6 + j * 6; c.moveTo(x0, f.y);
        for (let i = 1; i <= 6; i++) { const q = i / 6; c.lineTo(x0 + Math.sin(q * 8 + j * 2 + t * 2) * 5, f.y - f.h * q * k); }
        c.stroke();
      }
      for (let i = 0; i < 4; i++) D.ell(c, f.x + Math.sin(i * 2.3) * 6, f.y - f.h * k * (0.2 + i * 0.2), 1.6, 0.8, "#8fd36b", i);
      c.restore();
    } else if (f.kind === "vinegrow") {
      const k = f.t / f.life; c.save(); c.globalAlpha *= 1 - k; c.strokeStyle = "#8fd36b"; c.lineWidth = 1.5; c.beginPath(); c.ellipse(f.x, f.y - 2, 20 + k * 60, 4 + k * 8, 0, 0, TAU); c.stroke(); c.restore();
    }
  }
  function ringProg(c, x, y, k, col, label) {
    c.save();
    c.strokeStyle = "rgba(10,6,8,.75)"; c.lineWidth = 3.4; c.beginPath(); c.arc(x, y, 9, 0, TAU); c.stroke();
    c.strokeStyle = col; c.lineWidth = 2.2; c.beginPath(); c.arc(x, y, 9, -PI / 2, -PI / 2 + TAU * Math.max(0, Math.min(1, k))); c.stroke();
    c.fillStyle = col; c.font = "800 7px 'Alegreya Sans',sans-serif"; c.textAlign = "center"; c.fillText("✚", x, y + 2.5);
    if (label) { c.font = "700 6px 'Alegreya Sans',sans-serif"; c.lineWidth = 2; c.strokeStyle = "rgba(10,6,8,.85)"; c.strokeText(label, x, y - 13); c.fillStyle = "#f0e0c8"; c.fillText(label, x, y - 13); }
    c.restore();
  }
  const keyLab = (who, a) => {
    if (who === 1) return inp.label(a) || "✋";
    /* W27 Koop / W32 Online: Netz-Spieler 2 – beim Gast stehen dort seine eigenen Tasten/Pad-Knöpfe (lokale Belegung), beim Gastgeber ein Netz-Zeichen */
    if (K.src && K.src.kind === "net") { let guest = false; try { guest = !!(Z.online && Z.online.S && Z.online.S.role === "guest"); } catch (_) {} return guest ? inp.label(a) || (a === "use" ? "✋" : "") : "⇄"; } /* W35 Optik: Netz-Zeichen als Schriftzeichen in Leistenfarbe statt blauem 🌐-Emoji */
    if (K.src && K.src.kind === "pad") return inp.padButtonName(inp.padOf(a));
    return inp.keyName(keys2[a]);
  };
  function drawOverlay(c, t) {
    const P = K.p2, Q = Z.player; if (!P || !Q) return;
    /* Spielerkennung über dem Kopf (P2 immer, P1 nur im Koop) */
    const tag = (B, txt, col) => { const x = B.x + B.w / 2, y = B.y - (B.bear > 0 ? 2 : 8); c.save(); c.font = "800 6px 'Alegreya Sans',sans-serif"; c.textAlign = "center"; c.lineWidth = 2; c.strokeStyle = "rgba(10,6,8,.8)"; c.strokeText(txt, x, y); c.fillStyle = col; c.fillText(txt, x, y); D.poly(c, [x - 2, y + 1.5, x + 2, y + 1.5, x, y + 3.5], col); c.restore(); };
    if (!P.down) tag(P, "P2", CH[P.ch].col);
    if (!Q.koopDown && !Q.dead) tag(Q, "P1", "#e86a5a");
    /* Wiederbeleben */
    if (Q.koopDown) ringProg(c, Q.x + Q.w / 2, Q.y + 6, Q.revive || 0, "#ffe08a", K.reviving2 ? "" : CH[P.ch].n + ": " + L(["halte ", "hold "]) + keyLab(2, "use"));
    if (P.down) ringProg(c, P.x + P.w / 2, P.y + 14, P.revive || 0, CH[P.ch].col, K.reviving1 ? "" : Z.online && Z.online.S.role === "guest" ? L(["Warte auf Ezekiel …", "Waiting for Ezekiel …"]) /* W33 Online: Gast kann hier nichts tun */ : "Ezekiel: " + L(["halte ", "hold "]) + keyLab(1, "use"));
    /* Spieler 2 steht an einem Fund: wer nimmt? */
    if (!P.down) {
      const px = P.x + P.w / 2, py = P.y + P.h;
      for (const p of Z.pickups) if (p.kind === "item" && !p.rack && Math.abs(p.x - px) + Math.abs(p.y - py) * 0.6 < 26) {
        const d = Z.itemDef(p.it), ok = d && p.it.type !== "skill" && d.kind !== "shield";
        c.save(); c.font = "800 6px 'Alegreya Sans',sans-serif"; c.textAlign = "center"; c.lineWidth = 2; c.strokeStyle = "rgba(10,6,8,.85)";
        const s = ok ? keyLab(2, "use") + " · " + CH[P.ch].n + L([" nimmt", " takes"]) : L(["nur für Ezekiel", "Ezekiel only"]);
        c.strokeText(s, p.x, p.y - 30); c.fillStyle = ok ? CH[P.ch].col : "#a99a8b"; c.fillText(s, p.x, p.y - 30); c.restore();
        break;
      }
    }
  }
  const dp0 = Z.drawPlayer;
  Z.drawPlayer = function (c, P, t) {
    if (!K.p2 || P !== Z.player || !c || !c.canvas || c.canvas.id !== "cv") return dp0.apply(this, arguments);
    try { drawP2(c, t); } catch (e) { console.error("koop draw", e); }
    let r;
    if (P.koopDown) { const d = P.dead; P.dead = true; try { r = dp0.apply(this, arguments); } finally { P.dead = d; } }
    else r = dp0.apply(this, arguments);
    try { drawBand(c, t); drawOverlay(c, t); } catch (e) { console.error("koop draw", e); }
    return r;
  };

  /* ======================= HUD ======================= */
  let hudEl = null, hudT = 0, rufEl = null;
  const CSS = "#koop-hl{margin-top:8px;padding:5px 7px 6px;max-width:min(300px,42vw);pointer-events:none}" +
    "#koop-hl .kh-kopf{display:flex;align-items:center;gap:6px;font-weight:800;font-size:var(--fs-s);text-shadow:0 1px 2px #000}" +
    "#koop-hl .kh-p{font-size:var(--fs-xs);padding:0 4px;border-radius:3px;background:rgba(0,0,0,.45);border:1px solid currentColor}" +
    "#koop-hl .kh-bar{position:relative;height:11px;margin-top:4px;background:linear-gradient(#0c0708,#1a1012);border:1px solid #000;border-radius:3px;overflow:hidden;box-shadow:0 0 0 1px var(--eisen3,#3a2c26)}" +
    "#koop-hl .kh-fill{position:absolute;left:0;top:0;bottom:0;transition:width .08s}" +
    "#koop-hl .kh-txt{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:calc(var(--fs-xs) * .9);font-weight:800;text-shadow:0 1px 2px #000;font-variant-numeric:tabular-nums}" +
    "#koop-hl .kh-ab{display:flex;gap:4px;margin-top:4px}" +
    "#koop-hl .kh-ab span{position:relative;display:flex;flex-direction:column;align-items:center;min-width:30px;padding:1px 3px;border-radius:4px;background:rgba(20,12,15,.75);border:1px solid #3a2c26;font-size:calc(var(--fs-xs) * .85);line-height:1.1;overflow:hidden}" +
    "#koop-hl .kh-ab span i{font-style:normal;font-size:var(--fs-s)}#koop-hl .kh-ab span em{font-style:normal;color:#c8b8a8}" +
    "#koop-hl .kh-ab span b{position:absolute;left:0;right:0;bottom:0;background:rgba(0,0,0,.62)}" +
    "#koop-hl .kh-down{margin-top:3px;color:#ffb070;font-weight:800;font-size:var(--fs-xs)}#koop-hl .kh-w{color:#c8b8a8;font-size:var(--fs-xs);margin-top:2px}" +
    "#koop-ruf{position:fixed;left:50%;bottom:calc(env(safe-area-inset-bottom,0px) + 92px);transform:translateX(-50%) scale(var(--hud,1));transform-origin:50% 100%;z-index:11;padding:6px 12px;font-weight:700;font-size:var(--fs-s);color:#f0e0c8;pointer-events:none;white-space:nowrap}" +
    "#koop-ruf b{color:#ffd27a}" +
    "#koop-wahl{position:fixed;left:50%;top:64%;transform:translate(-50%,-50%) scale(var(--ui,1));z-index:40;padding:12px 16px 10px;text-align:center;color:#f0e0c8;min-width:300px}" +
    "#koop-wahl .kw-kopf{font-weight:800;font-size:var(--fs-l,1.15rem);margin-bottom:8px;color:#ffd27a}" +
    "#koop-wahl .kw-karten{display:flex;gap:12px;justify-content:center}" +
    "#koop-wahl .kw-karte{display:flex;flex-direction:column;align-items:center;width:150px;padding:6px;border-radius:8px;border:2px solid #3a2c26;background:rgba(20,12,15,.8);opacity:.7}" +
    "#koop-wahl .kw-karte.an{border-color:#ffd27a;opacity:1;box-shadow:0 0 14px rgba(255,210,122,.35)}" +
    "#koop-wahl .kw-karte b{font-size:var(--fs-m,1rem)}#koop-wahl .kw-karte small{color:#c8b8a8;font-size:var(--fs-xs)}" +
    "#koop-wahl .kw-fuss{margin-top:8px;font-size:var(--fs-xs);color:#c8b8a8}#koop-wahl .kw-fuss b{color:#ffd27a}" +
    ".koop-tab th{text-align:left;padding-right:10px}.koop-beleg{min-width:110px;background:#2a1c20;border:1px solid #4a3236;border-radius:6px;padding:5px 8px;font-weight:800;color:var(--gold)}.koop-beleg:hover,.koop-beleg:focus{border-color:var(--gold)}.koop-beleg.leer{color:var(--mute2);border-style:dashed}.koop-beleg.wartet{background:#5a2a1a;color:#fff}.koop-hinweis{color:#c8b8a8}";
  { const s = document.createElement("style"); s.id = "koop-css"; s.textContent = CSS; document.head.appendChild(s); }
  function hudBuild() {
    const hl = document.querySelector("#hud .hl");
    if (!K.p2) { if (hudEl) { hudEl.remove(); hudEl = null; } return; }
    if (!hudEl) { hudEl = document.createElement("div"); hudEl.id = "koop-hl"; hudEl.className = "eisen"; }
    if (hl && hudEl.parentNode !== hl) hl.appendChild(hudEl);
    hudEl.innerHTML = '<div class="kh-kopf"><span class="kh-p" style="color:' + CH[K.p2.ch].col + '">P2</span><span class="kh-n">' + CH[K.p2.ch].n + '</span></div><div class="kh-bar"><div class="kh-fill" style="background:' + CH[K.p2.ch].bar + '"></div><span class="kh-txt"></span></div><div class="kh-ab"></div><div class="kh-w"></div><div class="kh-down" hidden></div>';
    hudEl._v = {};
    hudT = 0;
  }
  function hudFrame(dt) {
    const P = K.p2;
    /* Beitreten-Hinweis: ein zweiter Controller ist da, Spieler 2 aber nicht */
    const showRuf = !P && !K.choose && Z.level && !(Z.ui && Z.ui.modalOpen) && K._freePad && K.rufAus < 3;
    if (showRuf) {
      if (!rufEl) { rufEl = document.createElement("div"); rufEl.id = "koop-ruf"; rufEl.className = "eisen"; document.body.appendChild(rufEl); }
      const txt = "🎮 " + L(["Spieler 2: Drücke <b>Start</b> oder <b>A</b> zum Beitreten", "Player 2: press <b>Start</b> or <b>A</b> to join"]);
      if (rufEl._t !== txt) { rufEl.innerHTML = txt; rufEl._t = txt; }
      K.rufT += dt; rufEl.hidden = K.rufT % 14 > 7; /* sanft: 7 s sichtbar, 7 s Pause */
      if (K.rufT > 42) { K.rufAus = 3; }
    } else if (rufEl) rufEl.hidden = true;
    if (!P || !hudEl) return;
    hudT -= dt; if (hudT > 0) return; hudT = 0.1;
    if (!hudEl.isConnected) hudBuild();
    const v = hudEl._v;
    const fill = hudEl.querySelector(".kh-fill"), txt = hudEl.querySelector(".kh-txt");
    const w = (P.down ? 0 : Math.max(0, P.hp / P.hpMax * 100)).toFixed(1) + "%";
    if (v.w !== w) { fill.style.width = w; v.w = w; }
    const tt = P.down ? L(["am Boden", "down"]) : Math.ceil(P.hp) + " / " + P.hpMax; if (v.t !== tt) { txt.textContent = tt; v.t = tt; }
    const ab = ["a1", "a2", "s1", "s2"].map(a => {
      const cd = a === "a1" ? 0 : (P.cd[a] || 0), mx = (P.cdMax && P.cdMax[a]) || 1, k = cd > 0 ? Math.min(1, cd / mx) : 0;
      const on = a === "a2" && P.ch === "E" && P.bear > 0;
      return '<span title="' + esc(L(CH[P.ch].ab[a])) + '"' + (on ? ' style="border-color:#8fd36b"' : "") + "><i>" + CH[P.ch].ico[a] + "</i><em>" + esc(keyLab(2, a)) + "</em>" + (k > 0 ? '<b style="height:' + (k * 100).toFixed(0) + '%"></b>' : "") + "</span>";
    }).join("");
    if (v.ab !== ab) { hudEl.querySelector(".kh-ab").innerHTML = ab; v.ab = ab; }
    const wt = P.waffe ? "⚔ " + L(Z.itemDef(P.waffe).n) + " · ×" + wmul(P).toFixed(2) : "⚔ ×" + wmul(P).toFixed(2) + L([" (ohne Waffe)", " (no weapon)"]);
    if (v.wt !== wt) { hudEl.querySelector(".kh-w").textContent = wt; v.wt = wt; }
    const dEl = hudEl.querySelector(".kh-down"), Q = Z.player;
    const ds = P.down ? (Z.online && Z.online.S.role === "guest" ? L(["Am Boden – warte, bis Ezekiel dir aufhilft", "Down – wait for Ezekiel to help you up"]) /* W33 Online */ : L(["Am Boden – Ezekiel: „Benutzen“ halten (" + keyLab(1, "use") + ")", "Down – Ezekiel: hold “Use” (" + keyLab(1, "use") + ")"])) : (Q && Q.koopDown ? L(["Ezekiel liegt am Boden – hilf ihm auf (" + keyLab(2, "use") + " halten)", "Ezekiel is down – help him up (hold " + keyLab(2, "use") + ")"]) : K.leaveT > 0.15 ? L(["Verlassen …", "Leaving…"]) + " " + Math.round(K.leaveT / 1.25 * 100) + "%" : "");
    if (v.ds !== ds) { dEl.textContent = ds; dEl.hidden = !ds; v.ds = ds; }
  }
  /* freundliche Meldung (oben Mitte; benutzt das vorhandene Meldungssystem, wenn da) */
  function note(txt) { try { if (Z.ui && Z.ui.notify) Z.ui.notify(esc(txt), { prio: 2, dauer: 3800 }); else Z.toast && Z.toast(txt, 3600); } catch (_) { Z.toast && Z.toast(txt, 3600); } }
  /* HUD-Takt: an Z.ui.frame hängen (läuft jedes Bild, auch in der Pause) */
  if (Z.ui && Z.ui.frame) { const f0 = Z.ui.frame; Z.ui.frame = function (dt) { const r = f0.apply(this, arguments); try { hudFrame(dt); } catch (e) { console.error("koop hud", e); } return r; }; }
  /* Titelbild: Spieler 2 bleibt dabei, HUD wird beim nächsten Gebiet neu angehängt */
  const oa0 = Z.ui && Z.ui.onArea;
  if (oa0) Z.ui.onArea = function () { const r = oa0.apply(this, arguments); try { if (K.p2) hudBuild(); } catch (_) {} return r; };

  /* ======================= MENÜS: PAUSE & STEUERUNG ======================= */
  const acts = Z.ui && Z.ui.actions;
  Z.koopPauseHTML = () => '<button data-act="koopMenu">' + (K.p2 ? L(["Koop: ", "Co-op: "]) + CH[K.p2.ch].n : L(["Koop: Spieler 2 …", "Co-op: player 2…"])) + "</button>";
  function koopMenu() {
    const P = K.p2;
    const padN = PADS().filter(g => g && g.connected).length;
    const keysHint = L(["Tastatur: ", "Keyboard: "]) + "<b>" + esc(inp.keyName(keys2.use)) + "</b>" + L([" (Ziffernblock-Enter) – Belegung unter Einstellungen › Steuerung.", " (numpad Enter) – bindings under Settings › Controls."]);
    let html = "<h2>" + L(["Koop – zu zweit spielen", "Co-op – play together"]) + "</h2>";
    if (!P) {
      K.wartePad = true;
      html += '<p class="hinweis">' + L(["Spieler 2 steigt jederzeit ein: auf dem <b>zweiten Controller</b> Start oder A drücken.", "Player 2 can join any time: press Start or A on the <b>second controller</b>."]) + "<br>" +
        (padN ? L(["Solange dieses Fenster offen ist, reicht auch A auf <b>irgendeinem</b> Controller – Ezekiel spielt dann mit der Tastatur.", "While this window is open, A on <b>any</b> controller works – Ezekiel then plays on the keyboard."]) : L(["Kein Controller erkannt.", "No controller detected."])) + "<br>" + keysHint + "</p>" +
        '<p class="koop-hinweis">' + L(["Friedrich: Bogen (halten = Kraftschuss), Jagdmesser, Rex fasst und markiert, Pfeilhagel.<br>Echo: Dornenpeitsche, Bärengestalt, Rankengriff hält fest, Heilblüte heilt beide.<br>Gold, Splitter und Tränke teilt ihr. Gefallene hebt der andere mit „Benutzen“ halten auf. Gegner halten im Koop mehr aus (+60 %, Bosse +75 %).", "Friedrich: bow (hold = power shot), hunting knife, Rex bites and marks, arrow hail.<br>Echo: thorn whip, bear form, vine grasp roots, healing bloom heals you both.<br>Gold, shards and potions are shared. Hold “Use” next to a fallen partner to revive. Enemies are tougher in co-op (+60%, bosses +75%)."]) + "</p>" +
        '<div class="knoepfe"><button data-act="koopJoinKeys" data-arg="G">' + L(["Friedrich (Tastatur)", "Friedrich (keyboard)"]) + '</button><button data-act="koopJoinKeys" data-arg="E">' + L(["Echo (Tastatur)", "Echo (keyboard)"]) + '</button><button data-act="koopBack">' + L(["Zurück", "Back"]) + "</button></div>";
    } else {
      html += '<p class="hinweis">' + L(["Spieler 2 spielt ", "Player 2 plays "]) + "<b>" + CH[P.ch].n + "</b> (" + (K.src.kind === "pad" ? "Controller" : L(["Tastatur", "keyboard"])) + "). " + L(["Verlassen geht auch mit Start/Pause lange halten.", "You can also leave by holding Start/Pause."]) + "</p>" +
        '<div class="knoepfe"><button data-act="koopSwap">' + L(["Figur wechseln → ", "Switch hero → "]) + CH[P.ch === "G" ? "E" : "G"].n + '</button><button data-act="koopLeave">' + L(["Spieler 2 verlässt die Gruppe", "Player 2 leaves the party"]) + '</button><button data-act="koopBack">' + L(["Zurück", "Back"]) + "</button></div>";
    }
    Z.ui.open(html, { onClose: () => { K.wartePad = false; } });
  }
  if (acts) {
    acts.koopMenu = () => { Z.ui.close && Z.ui.close(); setTimeout(koopMenu, 0); };
    acts.koopBack = () => { K.wartePad = false; Z.ui.close && Z.ui.close(); setTimeout(() => Z.ui.pause && Z.level && Z.ui.pause(), 0); };
    acts.koopJoinKeys = id => { K.wartePad = false; Z.ui.close && Z.ui.close(); join(id === "E" ? "E" : "G", { kind: "keys" }); };
    acts.koopLeave = () => { Z.ui.close && Z.ui.close(); leave(); };
    acts.koopSwap = () => { const P = K.p2; if (!P) return; const s = K.src, id = P.ch === "G" ? "E" : "G"; const hp = P.hp / P.hpMax, dn = P.down, x = P.x, y = P.y, wf = P.waffe; K.p2 = null; K.rex = null; join(id, s); const Q = K.p2; if (Q) { Q.x = x; Q.y = y; Q.hp = Math.max(1, Math.round(Q.hpMax * hp)); Q.down = dn; if (dn) Q.hp = 0; Q.waffe = wf; } Z.ui.close && Z.ui.close(); };
    acts.koopBind = a => { if (!ACT.includes(a)) return; K.capture = a; const b = document.querySelector('[data-act="koopBind"][data-arg="' + a + '"]'); if (b) { b.textContent = L(["Taste drücken …", "Press key…"]); b.classList.add("wartet"); } };
    acts.koopPreset = id => { const src = id === "pfeil" ? KEYS_PFEIL : KEYS_NUM; const used = p1Codes(); let freed = 0; for (const a of ACT) { const cde = src[a]; if (used.has(cde)) { for (const b in inp.keys) for (let s = 0; s < 2; s++) if (inp.keys[b][s] === cde && cde !== "Escape") { inp.keys[b][s] = null; freed++; if (!inp.keys[b][0] && !inp.keys[b][1]) { inp.keys[b][s] = cde; freed--; } } } } inp.save && inp.save(); for (const a of ACT) keys2[a] = p1Codes().has(src[a]) ? null : src[a]; saveStore(); ctrlRedraw(L(["Vorlage übernommen.", "Preset applied."]) + (freed ? L([" Spieler 1 hat dafür " + freed + " Zweittaste(n) abgegeben.", " Player 1 gave up " + freed + " secondary key(s)."]) : "")); };
  }
  const NAMES = { left: ["Links", "Left"], right: ["Rechts", "Right"], up: ["Hoch / Zielen", "Up / aim"], down: ["Runter", "Down"], jump: ["Springen", "Jump"], roll: ["Ausweichen", "Dodge"], a1: ["Angriff 1", "Attack 1"], a2: ["Angriff 2", "Attack 2"], s1: ["Fähigkeit 1", "Skill 1"], s2: ["Fähigkeit 2", "Skill 2"], use: ["Benutzen / Beitreten", "Use / join"], potion: ["Trank (gemeinsam)", "Potion (shared)"], pause: ["Pause (halten = verlassen)", "Pause (hold = leave)"] };
  let ctrlMsg = "";
  function ctrlRedraw(msg) { ctrlMsg = msg || ""; if (Z.ui && Z.ui.controls && Z.ui.modalOpen && document.querySelector(".mbox.steuerung")) { Z.ui.onClose = null; Z.ui.controls(); } }
  Z.koopCtrlHTML = () => {
    const rows = ACT.map(a => '<tr><th>' + esc(L(NAMES[a])) + '</th><td><button class="koop-beleg' + (keys2[a] ? "" : " leer") + '" data-act="koopBind" data-arg="' + a + '">' + esc(keys2[a] ? inp.keyName(keys2[a]) : "–") + "</button></td></tr>").join("");
    const m = ctrlMsg; ctrlMsg = "";
    return '<h3 id="koop-steuerung">' + L(["Spieler 2 (Koop)", "Player 2 (co-op)"]) + "</h3>" +
      '<p class="hinweis">' + L(["Am Controller nutzt Spieler 2 dieselbe Knopfbelegung wie oben. Für die Tastatur hat Spieler 2 eine eigene Hälfte:", "On a controller player 2 uses the same button layout as above. On the keyboard player 2 has their own half:"]) + "</p>" +
      '<div class="st-vorlagen"><span>' + L(["Vorlage:", "Preset:"]) + '</span><button class="k-seg" data-act="koopPreset" data-arg="num">' + L(["Ziffernblock", "Numpad"]) + '</button><button class="k-seg" data-act="koopPreset" data-arg="pfeil">' + L(["Pfeiltasten + , . Ö Ä", "Arrow keys + , . ; '"]) + "</button></div>" +
      (m ? '<p class="hinweis"><span class="st-msg">' + esc(m) + "</span></p>" : "") +
      '<table class="koop-tab"><tbody>' + rows + "</tbody></table>";
  };

  /* ======================= RÜCKBLICK / SPIELBERICHT ======================= */
  K.summary = () => K.stats ? { figur: K.stats.ch || (K.p2 && K.p2.ch), dmg: Math.round(K.stats.dmg), kills: K.stats.kills, revives: K.stats.revives, downs: K.stats.downs } : null;
  if (Z.ui && Z.ui.deathScreen) {
    const ds0 = Z.ui.deathScreen;
    Z.ui.deathScreen = function () {
      const r = ds0.apply(this, arguments);
      try { addSummary(); } catch (_) {}
      return r;
    };
  }
  /* Lauf-Rückblick (rueckblick.js, W21): Abschnitt für Spieler 2 vor den Knöpfen einfügen – zeigt beide */
  if (Z.ui && Z.ui.open) {
    const open0 = Z.ui.open;
    Z.ui.open = function (html, opts) {
      try {
        const s = K.summary();
        if (s && s.figur && CH[s.figur] && typeof html === "string" && opts && /rb21box/.test(opts.cls || "")) {
          const sec = '<div class="koop-rb21" style="margin:8px 0;padding:6px 10px;border-left:3px solid ' + CH[s.figur].col + ';background:rgba(20,12,15,.55)"><b style="color:' + CH[s.figur].col + '">P2 · ' + CH[s.figur].n + "</b> – " +
            Z.U.fmt(s.dmg) + L([" Schaden ausgeteilt · ", " damage dealt · "]) + s.kills + L([" besiegt · ", " defeated · "]) + s.revives + L([" × aufgeholfen · ", " × revived · "]) + s.downs + L([" × gefallen", " × fallen"]) + "</div>";
          const i = html.lastIndexOf('<div class="knoepfe');
          html = i > 0 ? html.slice(0, i) + sec + html.slice(i) : html + sec;
        }
      } catch (e) { console.error("koop rb", e); }
      return open0.apply(this, [html].concat([].slice.call(arguments, 1)));
    };
  }
  function addSummary() {
    const s = K.summary(); if (!s || !s.figur) return;
    setTimeout(() => {
      const box = document.querySelector("#modal .mbox"); if (!box || box.querySelector(".koop-rb")) return;
      const d = document.createElement("p"); d.className = "hinweis koop-rb";
      d.innerHTML = "<b>" + L(["Koop · ", "Co-op · "]) + CH[s.figur].n + "</b>: " + Z.U.fmt(s.dmg) + L([" Schaden, ", " damage, "]) + s.kills + L([" besiegt, ", " defeated, "]) + s.revives + L([" × aufgeholfen, ", " × revived, "]) + s.downs + L([" × gefallen", " × fallen"]);
      const k = box.querySelector(".knoepfe"); if (k) box.insertBefore(d, k); else box.appendChild(d);
    }, 60);
  }
})();
