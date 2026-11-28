/* Ezekiel – The Destroyer · Spielhilfen (W39 Zugang)
   Ergänzt „Komfort & Barrierefreiheit“ um Hilfen, alle abschaltbar, Standard aus:
   · Spieltempo 100 / 90 / 80 % (Z.settings.tempo) – die ganze Spielwelt läuft langsamer (spiel.js fragt Z.tempoK()).
   · Ausweichhilfe (Z.settings.ausweichHilfe): „Richtung“ – die Rolle ohne Richtungstaste führt weg vom nächsten ausholenden
     Gegner; „automatisch“ – kurz bevor ein Nahkampfangriff trifft, rollt Ezekiel von selbst weg (höchstens alle 1,2 s).
   · Zielhilfe Fernkampf (Z.settings.zielhilfe): gerade Schüsse rasten leicht (≤ 12°) auf den nächsten Gegner vor dir ein.
   · Große Treffer-Vorwarnung (Z.settings.warnGross): „!“ über ausholenden Gegnern deutlich größer (zugang.js), auch ohne Symbol-Einstellung.
   Faire Kennzeichnung statt Sperre: Läufe mit Hilfen tragen Z.run.hilfen; Todes-/Endfenster, Ergebniskarte und Vergleichscode
   zeigen „mit Hilfen“. Bestwerte und Erfolge bleiben möglich. Online-Gast: Tempo gilt nur beim Gastgeber.
   DE/EN, Pad/Touch (Zeilen wie die übrigen Komfort-Einstellungen). Prüfhilfe: Z.hilfen. */
(function () {
  "use strict";
  const Z = window.Z; if (!Z) return;
  const L = v => (Z.L ? Z.L(v) : v[0]);
  const S = () => Z.settings || {};
  {
    const s = S();
    if (![100, 90, 80].includes(+s.tempo)) s.tempo = 100; else s.tempo = +s.tempo;
    if (!["aus", "richtung", "auto"].includes(s.ausweichHilfe)) s.ausweichHilfe = "aus";
    for (const k of ["zielhilfe", "warnGross"]) if (typeof s[k] !== "boolean") s[k] = false;
  }
  const gast = () => !!(Z.online && Z.online.S && Z.online.S.role === "guest" && Z.online.S.playing);
  Z.tempoK = () => (gast() ? 1 : Math.max(0.8, Math.min(1, (+S().tempo || 100) / 100)));
  function aktiv() {
    const s = S(), a = [];
    if (+s.tempo < 100) a.push("tempo" + s.tempo);
    if (s.ausweichHilfe !== "aus") a.push("ausweichen-" + s.ausweichHilfe);
    if (s.zielhilfe) a.push("ziel");
    return a; /* große Vorwarnung ist reine Darstellung – keine Kennzeichnung */
  }
  const NAMEN = { tempo90: ["Tempo 90 %", "Speed 90%"], tempo80: ["Tempo 80 %", "Speed 80%"], "ausweichen-richtung": ["Ausweichrichtung", "Dodge direction"], "ausweichen-auto": ["Auto-Ausweichen", "Auto-dodge"], ziel: ["Zielhilfe", "Aim assist"] };
  const hilfeText = list => (list || []).filter(k => NAMEN[k]).map(k => L(NAMEN[k])).join(" · ");
  function merken() { const r = Z.run; if (!r || gast()) return; const a = aktiv(); if (!a.length) return; const h = r.hilfen || (r.hilfen = []); for (const k of a) if (!h.includes(k)) h.push(k); }

  /* ---------- Ausweichhilfe ---------- */
  let autoCd = 0;
  function droht(P, nurBald) {
    let best = null, bd = 1e9;
    for (const e of Z.enemies || []) {
      if (e.dead || e.dummy || e.hidden || !e.act || e.act.phase !== "pre" || !e.act.a) continue;
      const a = e.act.a; if (nurBald && !a.box) continue; /* automatisch nur bei Nahkampf mit Trefferfläche */
      const dx = e.x + e.w / 2 - (P.x + P.w / 2), dy = e.y + e.h / 2 - (P.y + P.h / 2); const d = Math.abs(dx);
      if (Math.abs(dy) > 48 || d > (nurBald ? 74 : 220)) continue;
      if (nurBald) { const rest = ((a.pre || 0.3) - e.act.t) * (e.act.pf || 1); if (rest > 0.16 || rest < 0) continue; }
      if (d < bd) { bd = d; best = { e, dx }; }
    }
    return best;
  }
  function vorSpieler(P, dt) {
    const s = S(); if (P !== Z.player || !Z.level || Z.level.hub || P.dead || gast()) return;
    merken();
    autoCd = Math.max(0, autoCd - (dt || 0));
    if (s.ausweichHilfe === "aus") return;
    const inp = Z.input, h = inp && inp.held ? (inp.held.right ? 1 : 0) - (inp.held.left ? 1 : 0) : 0;
    if (P.buf && P.buf.roll > 0 && !h) { const t = droht(P, false); if (t) P.face = t.dx > 0 ? -1 : 1; }
    if (s.ausweichHilfe === "auto" && autoCd <= 0 && P.rollT <= 0 && P.rollCd <= 0 && P.hurtT <= 0 && !P.climbing && P.buf) {
      const t = droht(P, true);
      if (t && !h) { P.face = t.dx > 0 ? -1 : 1; P.buf.roll = 0.1; autoCd = 1.2; }
    }
  }
  /* ---------- Zielhilfe ---------- */
  function zielen(p) {
    if (!S().zielhilfe || !p || p.owner !== "p" || gast()) return;
    const k = p.k || {}; if ((k.g || 0) > 150 || k.lob || k.ground || k.wave || k.homing || p.vy || !p.vx) return; /* gerade bzw. leicht fallende Schüsse (Pfeil, Bolzen, Messer) */
    const dir = Math.sign(p.vx), sp = Math.abs(p.vx); let best = null, bs = 1e9;
    for (const e of Z.enemies || []) {
      if (e.dead || e.dummy || e.hidden) continue;
      const tx = e.x + e.w / 2, ty = e.y + e.h / 2, dx = (tx - p.x) * dir, dy = ty - p.y;
      if (dx < 8 || dx > 340) continue;
      const ang = Math.abs(Math.atan2(dy, dx)); if (ang > 0.35) continue; /* nur Gegner grob vor dir */
      const sc = dx + Math.abs(dy) * 3; if (sc < bs) { bs = sc; best = { dx, dy }; }
    }
    if (!best) return;
    const a = Math.max(-0.21, Math.min(0.21, Math.atan2(best.dy, best.dx))); /* höchstens ~12° */
    p.vx = dir * Math.cos(a) * sp; p.vy = Math.sin(a) * sp; p.w39ziel = 1;
  }

  /* ---------- Einhängen ---------- */
  function wire() {
    if (typeof Z.updatePlayer !== "function" || typeof Z.spawnProj !== "function" || !Z.ui || !Z.ui.komfort || !Z.ui.actions) return setTimeout(wire, 60);
    const up0 = Z.updatePlayer;
    Z.updatePlayer = function (P, dt) { try { vorSpieler(P, dt); } catch (e) { console.error("hilfen", e); } return up0.apply(this, arguments); };
    const sp0 = Z.spawnProj;
    Z.spawnProj = function () { const p = sp0.apply(this, arguments); try { zielen(p); } catch (e) { console.error("hilfen", e); } return p; };
    const ui = Z.ui;
    /* Komfort-Seite: Zeilen unter „Hilfsmodus“ */
    const k0 = ui.komfort;
    ui.komfort = function () {
      const r = k0.apply(this, arguments);
      try {
        const box = document.querySelector("#modal .komfort"); if (box && !box.querySelector('[data-k="tempo"]')) {
          const g = box.querySelector('[data-k="gnade"]'), h = zeilen();
          if (g) g.insertAdjacentHTML("afterend", h); else { const a = box.querySelector(".k-schnell"); if (a) a.insertAdjacentHTML("beforebegin", h); else box.insertAdjacentHTML("beforeend", h); }
        }
      } catch (e) { console.error("hilfen", e); }
      return r;
    };
    ui.actions.w39hset = (arg, btn) => {
      const [key, v] = String(arg).split("|"), s = S();
      if (key === "tempo") s.tempo = [100, 90, 80].includes(+v) ? +v : 100;
      else if (key === "ausweichHilfe") s.ausweichHilfe = ["aus", "richtung", "auto"].includes(v) ? v : "aus";
      else if (key === "zielhilfe" || key === "warnGross") s[key] = v === "true";
      else return;
      Z.saveSettings && Z.saveSettings();
      const wrap = btn && btn.closest(".k-wahl");
      if (wrap) wrap.querySelectorAll(".k-seg").forEach(x => { const on = x === btn; x.classList.toggle("an", on); x.setAttribute("aria-checked", on); });
    };
    const kp0 = ui.actions.kpreset;
    if (kp0) ui.actions.kpreset = function (arg) { if (arg === "std") Object.assign(S(), { tempo: 100, ausweichHilfe: "aus", zielhilfe: false, warnGross: false }); return kp0.apply(this, arguments); };
    /* Todes-/Endfenster: faire Kennzeichnung */
    for (const k of ["deathScreen", "ending"]) {
      const f0 = ui[k]; if (!f0 || f0._w39h) continue;
      const w = function () { const hl = Z.run && Z.run.hilfen ? Z.run.hilfen.slice() : null; const r = f0.apply(this, arguments); try { if (hl && hl.length) setTimeout(() => marke(hl), 0); } catch (_) {} return r; };
      w._w39h = true; Object.keys(f0).forEach(x => { w[x] = f0[x]; }); ui[k] = w;
    }
  }
  function marke(hl) {
    const m = document.getElementById("modal"); if (!m || m.hidden || m.querySelector(".w39-hilfen")) return;
    const k = m.querySelector(".knoepfe"); if (!k) return;
    const p = document.createElement("p"); p.className = "hinweis w39-hilfen"; p.textContent = "✚ " + L(["Mit Hilfen gespielt: ", "Played with assists: "]) + hilfeText(hl);
    k.parentNode.insertBefore(p, k);
  }
  function zeilen() {
    const s = S();
    const seg = (key, opts, cur) => '<div class="k-wahl" role="radiogroup">' + opts.map(([v, n]) => '<button class="k-seg' + (String(v) === String(cur) ? " an" : "") + '" role="radio" aria-checked="' + (String(v) === String(cur)) + '" data-act="w39hset" data-arg="' + key + "|" + v + '">' + L(n) + "</button>").join("") + "</div>";
    const row = (key, lab, hint, ctl) => '<div class="k-zeile" data-k="' + key + '"><div class="k-text"><b>' + lab + ' <span class="k-marke">' + L(["Hilfe", "Assist"]) + "</span></b><small>" + hint + "</small></div>" + ctl + "</div>";
    const an = [[true, ["an", "on"]], [false, ["aus", "off"]]];
    return row("tempo", L(["Spieltempo", "Game speed"]), L(["Die ganze Spielwelt läuft langsamer – mehr Zeit zum Reagieren.", "The whole game world runs slower – more time to react."]), seg("tempo", [[100, ["100 %", "100%"]], [90, ["90 %", "90%"]], [80, ["80 %", "80%"]]], s.tempo)) +
      row("ausweichHilfe", L(["Ausweichhilfe", "Dodge assist"]), L(["„Richtung“: Die Rolle ohne Richtungstaste führt weg vom angreifenden Gegner. „Automatisch“: kurz vor einem Nahkampftreffer rollt Ezekiel von selbst (höchstens alle 1,2 s).", "'Direction': rolling without a direction moves away from the attacking enemy. 'Automatic': just before a melee hit Ezekiel rolls on his own (at most every 1.2 s)."]), seg("ausweichHilfe", [["aus", ["aus", "off"]], ["richtung", ["Richtung", "direction"]], ["auto", ["automatisch", "automatic"]]], s.ausweichHilfe)) +
      row("zielhilfe", L(["Zielhilfe Fernkampf", "Ranged aim assist"]), L(["Gerade Schüsse rasten leicht auf den nächsten Gegner vor dir ein (höchstens 12°).", "Straight shots snap gently towards the nearest enemy in front of you (at most 12°)."]), seg("zielhilfe", an, s.zielhilfe)) +
      row("warnGross", L(["Große Treffer-Vorwarnung", "Large attack warning"]), L(["Das „!“ über ausholenden Gegnern wird fast doppelt so groß – auch ohne „Angriffswarnung als Symbol“.", "The '!' above winding-up enemies becomes almost twice as large – even without 'attack warning as a symbol'."]), seg("warnGross", an, s.warnGross)) +
      '<p class="hinweis k-hilfen-fair">' + L(["Läufe mit Tempo-, Ausweich- oder Zielhilfe werden im Ergebnis mit ✚ gekennzeichnet – Bestwerte und Erfolge bleiben möglich.", "Runs with speed, dodge or aim assist are marked with ✚ in the results – records and achievements still count."]) + "</p>";
  }
  setTimeout(wire, 0);
  Z.hilfen = { aktiv, hilfeText, droht, zielen };
})();
