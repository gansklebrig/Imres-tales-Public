/* Ezekiel – The Destroyer · Spielbericht (W31)
   Lokales, kompaktes Protokoll je Lauf – NUR auf dem Gerät, keine automatische Übertragung. Wer testet, kann den Bericht
   über Einstellungen → „Spielbericht exportieren“ (oder im Lauf-Rückblick) als Datei speichern oder in die Zwischenablage
   kopieren und selbst weitergeben. Auswertung mehrerer Dateien: tools/zerstoerer/bericht_auswerten.py.
   Speicher: localStorage „imres-zerstoerer-bericht-<Spielstand>“ (je Spielstand, rollierend die letzten 200 Läufe,
   höchstens ~350 KB). Neues Spiel / Löschen eines Spielstands leert auch dessen Bericht.
   Je Lauf: Datum, Version, Gerät grob, Held, Härte/Schädel/Pakte, Dauer, Route mit Zeiten, Ende (Tod/Sieg/Abbruch),
   Todesort + Ursache, Schaden ausgeteilt/eingesteckt je Quelle, Waffen + Schmiedestufen + Runen, Runengürtel, Segen,
   Tränke, Gold/Splitter/Glut, Paraden/Ausweichen/Rollen/Abstürze, Kills je Gegnerart, Bosskämpfe mit Dauer.
   Schnittstelle: Z.bericht.{laeufe(), export(), datei(), kopieren(), leeren(), fenster(), aktuell(), SCHLUESSEL}.
   Lerntipps (lerntipps.js) lesen hier die letzten Läufe. Farbregel: kein Blau. */
(function () {
  "use strict";
  const Z = window.Z, L = v => Z.L(v);
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const MAX = 200, MAXBYTES = 350000, FORMAT = "zerstoerer-bericht/1";
  const VERSION = (() => { try { const s = document.querySelector('script[src*="zerstoerer/kern.js"]'); const m = s && /[?&]v=([^&]+)/.exec(s.getAttribute("src")); return m ? m[1] : "?"; } catch (_) { return "?"; } })();
  const KEY = n => "imres-zerstoerer-bericht-" + (n || (Z.slots && Z.slots.active ? Z.slots.active() : 1));
  const rnd = (v, k) => { const f = Math.pow(10, k || 0); return Math.round((+v || 0) * f) / f; };
  const isArea = id => !!((Z.BIOMES && Z.BIOMES[id]) || (Z.ARENAS && Z.ARENAS[id]));
  const rausch = () => !!(Z.run && Z.run.w21rausch);

  /* ---------- Speicher ---------- */
  function lesen(n) {
    try { const v = JSON.parse(localStorage.getItem(KEY(n)) || "[]"); return Array.isArray(v) ? v.filter(x => x && typeof x === "object") : []; } catch (_) { return []; }
  }
  function schreiben(list, n) {
    let l = list.slice(-MAX), s = JSON.stringify(l);
    while (s.length > MAXBYTES && l.length > 10) { l = l.slice(Math.ceil(l.length * 0.1)); s = JSON.stringify(l); }
    try { localStorage.setItem(KEY(n), s); return true; } catch (_) {
      try { l = l.slice(-Math.max(10, Math.floor(l.length / 2))); localStorage.setItem(KEY(n), JSON.stringify(l)); return true; } catch (__) { return false; }
    }
  }
  /* Spielstand neu/gelöscht → dessen Bericht auch */
  function slotHooks() {
    const S = Z.slots; if (!S || S._w31) return; S._w31 = true;
    for (const k of ["neu", "loeschen"]) { const f0 = S[k]; if (typeof f0 !== "function") continue; S[k] = function (n) { try { localStorage.removeItem(KEY(n)); } catch (_) {} return f0.apply(this, arguments); }; }
  }

  /* ---------- Gerät grob ---------- */
  function geraet() {
    const coarse = matchMedia && matchMedia("(pointer: coarse)").matches, W = screen.width || innerWidth, H = screen.height || innerHeight;
    const ua = navigator.userAgent || "", pad = Z.input && Z.input.device === "pad";
    if (/Steam ?Deck|SteamOS/i.test(ua) || (pad && Math.max(W, H) <= 1280 && Math.min(W, H) <= 800 && !coarse)) return "handheld";
    if (coarse || /Android|iPhone|iPad/i.test(ua)) return Math.min(W, H) >= 700 ? "tablet" : "handy";
    return "desktop";
  }
  function eingabe() { const d = Z.input && Z.input.device; return d === "pad" ? "controller" : d === "touch" || (Z.ui && Z.ui.touchOn) ? "touch" : "tastatur"; }

  /* ---------- Mitschrift je Lauf (Z.run._w31, kein Speicher bis zum Ende) ---------- */
  function frisch() {
    return { t0: Date.now(), zeit: 0, route: [], kills: {}, bosse: [], boss: null, tr: 0, trL: null, ende: null, gespeichert: false, eingabe: {} };
  }
  const W = () => { const r = Z.run; if (!r) return null; return r._w31 || (r._w31 = frisch()); };
  /* eigene Spielzeit (Z.run.time springt beim Tod auf die Wanduhr seit Laufbeginn) */
  const runT = () => (Z.run && Z.run._w31 ? Z.run._w31.zeit : 0);

  const nr0 = Z.newRun;
  Z.newRun = function () { const r = nr0.apply(this, arguments); try { if (Z.run) Z.run._w31 = frisch(); } catch (e) { console.error("bericht", e); } return r; };

  const la0 = Z.loadArea;
  Z.loadArea = function (id) {
    const r = la0.apply(this, arguments);
    try {
      const w = Z.run && !rausch() ? W() : null, lv = Z.level;
      if (w && lv && !lv.hub && !w.ende) {
        const g = isArea(lv.id) ? lv.id : isArea(id) ? id : null, t = runT(), last = w.route[w.route.length - 1];
        if (last && last.ende == null) last.ende = t;
        if (g) w.route.push({ g, t0: rnd(t, 1), ende: null, stufe: ((Z.BIOMES[g] || Z.ARENAS[g] || {}).tier) | 0 });
      }
    } catch (e) { console.error("bericht", e); }
    return r;
  };

  const kill0 = Z.killEnemy;
  Z.killEnemy = function (e, o) {
    const dead0 = e && e.dead;
    const r = kill0.apply(this, arguments);
    try {
      if (e && !dead0 && !e.dummy && Z.run && !rausch()) {
        const w = W(), id = e.id || "?";
        if (!(Z.BOSSDEF && Z.BOSSDEF[id])) w.kills[id] = (w.kills[id] | 0) + 1;
      }
    } catch (_) {}
    return r;
  };

  /* pro Schritt: Tränke, Bosskampf-Beginn/-Ende, Eingabegerät */
  const bt0 = Z.bilanzTick;
  Z.bilanzTick = function (dt) {
    if (bt0) bt0.apply(this, arguments);
    try {
      if (!Z.run || rausch()) return;
      const w = W(), P = Z.player; if (!P || w.ende) return;
      if (!P.dead && !Z.paused) w.zeit += dt || 0;
      const pt = P.potions | 0; if (w.trL != null && pt < w.trL) w.tr += w.trL - pt; w.trL = pt;
      const B = Z.boss, t = runT();
      if (B && !B.dummy && (!w.boss || w.boss.e !== B)) {
        if (w.boss && w.boss.e) bossEnde(w, false);
        w.boss = { e: B, id: B.id || "?", g: Z.level ? Z.level.id : "?", t0: t, hp0: rnd(B.hpMax || B.hp || 0) };
      }
      if (w.boss && (Z.bossDefeated || (w.boss.e && w.boss.e.dead) || !Z.boss)) bossEnde(w, !!(Z.bossDefeated || (w.boss.e && w.boss.e.dead)));
      const ein = eingabe(); w.eingabe[ein] = (w.eingabe[ein] || 0) + (dt || 0);
    } catch (_) {}
  };
  function bossEnde(w, sieg, tod) {
    const b = w.boss; if (!b) return; w.boss = null;
    const rest = b.e && !sieg ? Math.max(0, +b.e.hp || 0) : 0;
    w.bosse.push({ id: b.id, gebiet: b.g, dauer: rnd(runT() - b.t0, 1), ergebnis: sieg ? "sieg" : tod ? "tod" : "abbruch", restLeben: b.hp0 ? rnd(rest / b.hp0, 2) : 0 });
  }

  /* ---------- Lauf abschließen und speichern ---------- */
  function waffen(P) {
    const out = [];
    for (const s of ["a1", "a2", "s1", "s2"]) {
      const it = P && P.slots ? P.slots[s] : null; if (!it || !it.id) continue;
      const o = { slot: s, id: it.id, stufe: Z.metaLvl ? Z.metaLvl(it.id) : 0 };
      if (Array.isArray(it.runes) && it.runes.length) o.runen = it.runes.map(r => (typeof r === "string" ? r : r && r.id) || "?");
      if (Array.isArray(it.aff) && it.aff.length) o.affixe = it.aff.slice(0, 4);
      if (it.q != null) o.q = it.q;
      out.push(o);
    }
    return out;
  }
  function abschluss(kind, key) {
    const run = Z.run; if (!run || rausch()) return null;
    const w = W(); if (w.gespeichert) return null;
    w.gespeichert = true; w.ende = kind;
    const P = Z.player || {}, rb = run._rb || {}, S = Z.stats || {}, t = runT(), M = Z.meta || {};
    if (w.boss) bossEnde(w, false, kind === "tod");
    const last = w.route[w.route.length - 1]; if (last && last.ende == null) last.ende = rnd(t, 1);
    const route = w.route.map(r => ({ g: r.g, stufe: r.stufe, ab: r.t0, dauer: rnd((r.ende != null ? r.ende : t) - r.t0, 1) }));
    const area = Z.level && isArea(Z.level.id) ? Z.level.id : last ? last.g : "torhof";
    const T = Z.TILE || 16;
    const ursache = kind === "tod" ? (rb.last && rb.last.key) || rb.cause || "x:unbekannt" : null;
    const rund = o => { const r = {}; for (const k in o || {}) r[k] = Math.round(o[k]); return r; };
    const eintrag = {
      nr: (lesen().reduce((m, x) => Math.max(m, x.nr | 0), 0) + 1),
      datum: new Date(w.t0).toISOString(), version: VERSION, pc: !!window.__zsPC, geraet: geraet(), eingabe: Object.fromEntries(Object.entries(w.eingabe).map(([k, v]) => [k, Math.round(v)])),
      sprache: Z.settings.lang, held: run.hero || "Z", haerte: run.haerte ? run.haerte.stufe | 0 : 0, schaedel: run.skulls | 0,
      pakte: (run.pacts || []).slice(), gnade: !!run.gnade, laufNr: M.runs | 0,
      ende: kind, endeArt: key || null, dauer: rnd(t, 1), dauerUhr: rnd(run.time, 1), erreicht: area, stufe: ((Z.BIOMES[area] || Z.ARENAS[area] || {}).tier) | 0,
      route,
      tod: kind === "tod" ? { gebiet: area, x: P.x != null ? Math.round(P.x / T) : null, y: P.y != null ? Math.round(P.y / T) : null, ursache, typ: (ursache || "x").split(":")[0] === "b" ? "boss" : (ursache || "").startsWith("e:") ? "gegner" : (ursache || "x:").split(":")[1] } : null,
      schaden: { aus: Math.round(rb.out || 0), ein: Math.round(rb.inn || 0), ausJe: rund(rb.outBy), einJe: rund(rb.src) },
      waffen: waffen(P), runen: (P.runeBelt || []).slice(), segen: (P.bless || []).slice(), werte: P.stats ? Object.assign({}, P.stats) : {},
      leben: { max: P.hpMax | 0, rest: Math.max(0, Math.round(P.hp || 0)) },
      traenke: { getrunken: w.tr, uebrig: P.potions | 0, max: P.potMax | 0 },
      gold: Math.max(rb.gold | 0, S.gold | 0), splitter: rb.spl | 0, glut: rb.glut | 0,
      paraden: S.parries | 0, ausweichen: S.dodges | 0, rollen: P.rolls | 0, abstuerze: S.falls | 0, kills: S.kills | 0,
      killsJe: w.kills, bosse: w.bosse
    };
    const list = lesen(); list.push(eintrag); schreiben(list);
    try { for (const fn of hooks) fn(eintrag); } catch (e) { console.error("bericht", e); }
    return eintrag;
  }
  const hooks = [];

  const death0 = Z.onPlayerDeath;
  Z.onPlayerDeath = function () {
    const P = Z.player, was = !P || P.dead;
    const r = death0.apply(this, arguments);
    try { if (!was && Z.player && Z.player.dead) setTimeout(() => { try { abschluss("tod"); } catch (e) { console.error("bericht", e); } }, 0); } catch (e) { console.error("bericht", e); } /* einen Takt später: rueckblick.js trägt die Ursache erst nach dem tödlichen Treffer ein */
    return r;
  };
  const back0 = Z.backToCamp;
  Z.backToCamp = function () { try { if (Z.run && !(Z.run._w31 && Z.run._w31.gespeichert)) abschluss(Z.player && Z.player.dead ? "tod" : "abbruch"); } catch (e) { console.error("bericht", e); } return back0.apply(this, arguments); };
  function wireUI() {
    const ui = Z.ui; if (!ui || !ui.ending || !ui.deathScreen || !ui.actions || !ui.settings || !ui.open) return setTimeout(wireUI, 50);
    const end0 = ui.ending;
    ui.ending = function (key) { const res = end0.apply(this, arguments); try { abschluss("sieg", key); } catch (e) { console.error(e); } return res; };
    const ds0 = ui.deathScreen;
    ui.deathScreen = function (o) { try { if (o && o.abort) abschluss("abbruch"); } catch (e) { console.error(e); } return ds0.apply(this, arguments); };
    const A = ui.actions;
    A.w31Bericht = () => { ui.onClose = null; ui.close(); fenster(); };
    A.w31BerDatei = () => datei();
    A.w31BerKopie = () => kopieren();
    A.w31BerLeer = (arg, btn) => {
      if (btn && !btn.dataset.sicher) { btn.dataset.sicher = "1"; btn.textContent = L(["Wirklich leeren? Nochmal drücken", "Really clear? Press again"]); return; }
      try { localStorage.removeItem(KEY()); } catch (_) {} ui.toast(L(["Spielbericht geleert.", "Play report cleared."]), 1800); ui.onClose = null; ui.close(); fenster();
    };
    A.w31BerZurueck = () => { const z = zurueck; zurueck = null; ui.onClose = null; ui.close(); if (z) z(); else ui.settings(); };
    /* Knopf in den Einstellungen (unter „Grafik …“) */
    const s0 = ui.settings;
    ui.settings = function () {
      const r = s0.apply(this, arguments);
      try {
        const box = document.querySelector("#modal .einst"), g = box && box.querySelector('[data-act="graphics"]');
        if (box && !box.querySelector('[data-act="w31Bericht"]')) {
          const b = document.createElement("button"); b.className = "steuerknopf"; b.dataset.act = "w31Bericht";
          b.innerHTML = esc(L(["Spielbericht exportieren", "Export play report"])) + " <small>· " + lesen().length + L([" Läufe", " runs"]) + "</small>";
          if (g) g.after(b); else box.appendChild(b);
        }
      } catch (e) { console.error("bericht", e); }
      return r;
    };
    /* Knopf im Lauf-Rückblick */
    const o0 = ui.open;
    ui.open = function (html, opts) {
      const r = o0.apply(this, arguments);
      try {
        if (opts && opts.cls === "rb21box") {
          const k = document.querySelector("#modal .rb21box .knoepfe");
          if (k && !k.querySelector('[data-act="w31RbBericht"]')) { const b = document.createElement("button"); b.dataset.act = "w31RbBericht"; b.textContent = L(["Spielbericht …", "Play report …"]); k.appendChild(b); }
        }
      } catch (e) { console.error("bericht", e); }
      return r;
    };
    /* aus dem Rückblick: Fenster zeigen, danach weiter ins Lager (der Rückblick-Abschluss bleibt erhalten) */
    A.w31RbBericht = () => { const weiter = ui.onClose; ui.onClose = null; ui.close(); fenster(() => { if (weiter) weiter(); }); };
  }
  let zurueck = null;

  /* ---------- Export ---------- */
  function zusammenfassung(list) {
    const n = list.length, tod = list.filter(x => x.ende === "tod"), sieg = list.filter(x => x.ende === "sieg");
    const ur = {}; for (const x of tod) { const k = (x.tod && x.tod.ursache) || "?"; ur[k] = (ur[k] | 0) + 1; }
    const top = Object.entries(ur).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([k, v]) => k + " ×" + v);
    return { laeufe: n, siege: sieg.length, tode: tod.length, abbrueche: n - sieg.length - tod.length, spielzeitMin: rnd(list.reduce((s, x) => s + (+x.dauer || 0), 0) / 60, 1), haeufigsteTodesursachen: top };
  }
  function exportText() {
    const list = lesen(), z = zusammenfassung(list), slot = Z.slots && Z.slots.active ? Z.slots.active() : 1, jetzt = new Date();
    const kopf = {
      format: FORMAT,
      titel: "Glut und Asche · Spielbericht",
      hinweis: [
        "Diese Datei wurde von Hand aus dem Spiel exportiert. Sie bleibt auf deinem Gerät, bis du sie selbst weitergibst.",
        "Inhalt: nur Spielwerte je Lauf (Gebiete, Zeiten, Todesursachen, Schaden, Waffen, Kills). Keine Namen, keine Kennungen, keine Gerätedaten außer grob Desktop/Handy/Handheld.",
        "Auswertung: python3 tools/zerstoerer/bericht_auswerten.py <datei1.json> [<datei2.json> …] --html bericht.html",
        "Kürzel bei Ursachen: e:<gegner> · b:<boss> · x:sturz (Absturz) · x:falle · x:umgebung · x:unbekannt"
      ],
      erstellt: jetzt.toISOString(), version: VERSION, spielstand: slot, geraet: geraet(), pc: !!window.__zsPC,
      zusammenfassung: z
    };
    /* Kopf hübsch, Läufe je eine Zeile (bleibt lesbar und klein) */
    const head = JSON.stringify(kopf, null, 2).replace(/\n}$/, "");
    return head + ',\n  "laeufe": [\n' + list.map(x => "    " + JSON.stringify(x)).join(",\n") + "\n  ]\n}\n";
  }
  function dateiname() { const d = new Date(), p = n => String(n).padStart(2, "0"); return "zerstoerer-bericht-" + d.getFullYear() + p(d.getMonth() + 1) + p(d.getDate()) + "-" + p(d.getHours()) + p(d.getMinutes()) + ".json"; }
  async function datei() {
    const txt = exportText(), name = dateiname(), PC = window.__zsPC;
    if (PC) {
      if (typeof PC.speichern === "function") {
        try { const r = await PC.speichern(name, txt); if (r && r.ok) { Z.ui.toast(L(["Gespeichert: ", "Saved: "]) + esc(r.pfad || name), 3600); return true; } if (r && r.abbruch) return false; } catch (e) { console.error(e); }
      }
      /* ältere Programmversion ohne Speichern-Dialog: Zwischenablage */
      const ok = await kopieren(true);
      if (ok) Z.ui.toast(L(["Dieses Programm kann noch keine Dateien speichern – der Bericht liegt in der Zwischenablage (in eine Textdatei einfügen).", "This app version cannot save files yet – the report is on the clipboard (paste it into a text file)."]), 4200);
      return ok;
    }
    try {
      const blob = new Blob([txt], { type: "application/json" }), url = URL.createObjectURL(blob), a = document.createElement("a");
      a.href = url; a.download = name; a.dataset.ok = "1"; a.style.display = "none"; document.body.appendChild(a); a.click();
      setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 1500);
      Z.ui.toast(L(["Bericht heruntergeladen: ", "Report downloaded: "]) + esc(name), 3000);
      return true;
    } catch (e) { console.error(e); return kopieren(); }
  }
  async function kopieren(still) {
    const txt = exportText();
    let ok = false;
    try { if (navigator.clipboard && navigator.clipboard.writeText) { await navigator.clipboard.writeText(txt); ok = true; } } catch (_) {}
    if (!ok) try { const ta = document.createElement("textarea"); ta.value = txt; ta.style.cssText = "position:fixed;left:-9999px;top:0"; document.body.appendChild(ta); ta.select(); ok = document.execCommand("copy"); ta.remove(); } catch (_) {}
    if (!still) Z.ui.toast(ok ? L(["Bericht in der Zwischenablage (", "Report copied to the clipboard ("]) + Math.round(txt.length / 1024) + " KB)" : L(["Kopieren nicht möglich – bitte „Datei“ wählen.", "Copying failed – please use 'File'."]), 2800);
    return ok;
  }

  /* ---------- Fenster ---------- */
  function fenster(danach) {
    zurueck = danach || null;
    const list = lesen(), z = zusammenfassung(list), n = list.length;
    const slot = Z.slots && Z.slots.active ? Z.slots.active() : 1;
    const letzte = list.slice(-4).reverse().map(x => "<li><b>" + esc(x.ende === "tod" ? "☠" : x.ende === "sieg" ? "★" : "⚑") + "</b> " + esc(Z.areaName ? Z.areaName(x.erreicht) : x.erreicht) + " · " + Math.floor((x.dauer || 0) / 60) + ":" + String(Math.round(x.dauer || 0) % 60).padStart(2, "0") + (x.tod && x.tod.ursache && Z.rueckblick ? " · " + esc(Z.rueckblick.srcName(x.tod.ursache)) : "") + "</li>").join("");
    const pc = !!window.__zsPC, kannDatei = !pc || typeof window.__zsPC.speichern === "function";
    Z.ui.open("<h2>" + esc(L(["Spielbericht", "Play report"])) + " <small>" + esc(L(["Spielstand ", "Save "]) + slot) + "</small></h2>" +
      '<div class="w31b">' +
      '<p class="w31b-schutz"><b>🔒 ' + esc(L(["Bleibt auf diesem Gerät.", "Stays on this device."])) + "</b> " + esc(L(["Das Spiel sendet nichts. Der Bericht enthält nur Spielwerte je Lauf (Gebiete, Zeiten, Todesursachen, Schaden, Waffen, Kills) – keine Namen oder Kennungen. Teilen nur, wenn du die Datei selbst weitergibst.", "The game sends nothing. The report only contains game values per run (areas, times, causes of death, damage, weapons, kills) – no names or identifiers. It is only shared if you pass the file on yourself."])) + "</p>" +
      '<div class="w31b-zahlen"><span><b>' + n + "</b>" + esc(L(["Läufe", "runs"])) + "</span><span><b>" + z.siege + "</b>" + esc(L(["Siege", "wins"])) + "</span><span><b>" + z.tode + "</b>" + esc(L(["Tode", "deaths"])) + "</span><span><b>" + z.spielzeitMin + "</b>" + esc(L(["Minuten", "minutes"])) + "</span></div>" +
      (n ? '<ul class="w31b-letzte">' + letzte + "</ul>" : '<p class="hinweis">' + esc(L(["Noch keine Läufe aufgezeichnet – nach dem nächsten Lauf steht hier etwas.", "No runs recorded yet – after your next run something will appear here."])) + "</p>") +
      '<p class="hinweis">' + esc(L(["Gespeichert werden die letzten " + MAX + " Läufe dieses Spielstands.", "The last " + MAX + " runs of this save are kept."])) + "</p>" +
      '</div><div class="knoepfe">' +
      '<button data-act="w31BerDatei"' + (n ? " autofocus" : " disabled") + ">" + esc(kannDatei ? (pc ? L(["Als Datei speichern …", "Save as file …"]) : L(["Datei herunterladen", "Download file"])) : L(["Datei (über Zwischenablage)", "File (via clipboard)"])) + "</button>" +
      '<button data-act="w31BerKopie"' + (n ? "" : " disabled") + ">" + esc(L(["In Zwischenablage", "Copy to clipboard"])) + "</button>" +
      '<button data-act="w31BerLeer"' + (n ? "" : " disabled") + ">" + esc(L(["Bericht leeren", "Clear report"])) + "</button>" +
      '<button data-act="w31BerZurueck"' + (n ? "" : " autofocus") + ">" + esc(L(["Zurück", "Back"])) + "</button></div>",
      { cls: "schmal w31bbox", onClose: () => { const z = zurueck; zurueck = null; if (z) setTimeout(z, 0); else if (!Z.level) setTimeout(() => { if (!Z.ui.modalOpen && Z.ui.settings) Z.ui.settings(); }, 0); } });
  }
  const css = document.createElement("style");
  css.textContent = [
    ".w31b-schutz{margin:0 0 8px;padding:7px 10px;border-left:3px solid var(--gold,#e5b454);background:rgba(229,180,84,.08);font-size:var(--fs-s,13px);line-height:1.35;color:#e8d8b8}",
    ".w31b-zahlen{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin:6px 0}.w31b-zahlen span{display:flex;flex-direction:column;align-items:center;padding:4px;border:1px solid #3a2a22;border-radius:6px;background:rgba(255,235,200,.04);font-size:var(--fs-s,13px);color:#c8b090}",
    ".w31b-zahlen b{font-size:var(--fs-l,19px);color:#f0e0c0}.w31b-letzte{margin:6px 0;padding-left:18px;font-size:var(--fs-s,13px);color:#e8d8b8}.w31b-letzte b{color:var(--gold,#e5b454)}",
    ".w31bbox .knoepfe{flex-wrap:wrap}"
  ].join("\n");
  document.head.appendChild(css);

  Z.bericht = { SCHLUESSEL: KEY, MAX, laeufe: n => lesen(n), export: exportText, datei, kopieren, leeren: () => { try { localStorage.removeItem(KEY()); } catch (_) {} }, fenster, aktuell: () => (Z.run ? W() : null), abschluss, nachLauf: fn => { if (typeof fn === "function") hooks.push(fn); }, geraet, version: VERSION };
  setTimeout(() => { slotHooks(); wireUI(); }, 0);
})();
