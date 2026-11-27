/* Ezekiel – The Destroyer · W39 Sicherung: Spielstand sichern und übertragen
   Im Spielstand-Fenster (Titelbild → Spielstände) je belegtem Platz:
     „Sichern“            – Datei zerstoerer-spielstand-<n>-<Datum>.json (im PC-Programm über window.__zsPC.speichern)
     „Code kopieren“      – Übertragungscode (ZSS1z… = deflate-raw + Base64url, alte Browser ohne CompressionStream: ZSS1r… ungepackt)
   und unten „Spielstand laden“: Datei wählen oder Code einfügen → Ziel-Platz wählen → bei belegtem Platz Rückfrage.
   Import streng: nur JSON, höchstens 2 MB Text / 1 MB entpackt, Schlüssel __proto__/constructor/prototype werden verworfen,
   Tiefe ≤ 40 und ≤ 200 000 Werte, Kennung + Format + meta.v === 1 (oder ein nackter Meta-Stand v1 aus älteren Versionen),
   danach durch die Migration/Prüfung von spiel.js (Z.slots.parse). Der überschriebene Platz wird vorher gesichert
   (…-weg wie beim Löschen, zusätzlich …-vorImport). Optional: Erinnerung alle 10 Läufe im Lager (abschaltbar im Fenster). */
(function () {
  "use strict";
  const Z = window.Z; if (!Z || !Z.ui || !Z.slots || Z.sicherung) return;
  const ui = Z.ui, L = v => Z.L(v);
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const SPIEL = "ezekiel-zerstoerer", FORMAT = 1, MAXTXT = 2000000, MAXRAW = 1000000, MAXN = 200000, MAXTIEFE = 40;
  const slotName = n => L(["Spielstand ", "Save "]) + n;
  const ls = {
    get: k => { try { return localStorage.getItem(k); } catch (_) { return null; } },
    set: (k, v) => { try { localStorage.setItem(k, v); return localStorage.getItem(k) === v; } catch (_) { return false; } }
  };
  const VERSION = () => Z.VERSION || "?";

  /* ---------- Paket bauen ---------- */
  function paket(n) {
    const S = Z.slots;
    if (n === S.active() && Z.level && Z.meta) { try { Z.saveMeta(); } catch (_) {} }
    const raw = S.raw(n); if (!raw) return null;
    let meta; try { meta = JSON.parse(raw); } catch (_) { return null; }
    return { spiel: SPIEL, format: FORMAT, version: VERSION(), erstellt: new Date().toISOString(), platz: n, meta };
  }
  const b64u = u8 => { let s = ""; for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000)); return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""); };
  const unb64u = s => { const b = atob(s.replace(/-/g, "+").replace(/_/g, "/")); const u = new Uint8Array(b.length); for (let i = 0; i < b.length; i++) u[i] = b.charCodeAt(i); return u; };
  async function pipe(u8, Ctor, fmt, max) {
    const st = new Blob([u8]).stream().pipeThrough(new Ctor(fmt)), rd = st.getReader(), parts = []; let n = 0;
    for (;;) { const r = await rd.read(); if (r.done) break; n += r.value.length; if (n > max) { try { rd.cancel(); } catch (_) {} throw new Error("gross"); } parts.push(r.value); }
    const out = new Uint8Array(n); let o = 0; for (const p of parts) { out.set(p, o); o += p.length; } return out;
  }
  async function code(obj) {
    const raw = new TextEncoder().encode(JSON.stringify(obj));
    if (typeof CompressionStream === "function" && typeof Blob === "function" && Blob.prototype.stream) try { return "ZSS1z" + b64u(await pipe(raw, CompressionStream, "deflate-raw", MAXRAW * 2)); } catch (_) {}
    return "ZSS1r" + b64u(raw);
  }

  /* ---------- Einlesen und prüfen ---------- */
  const BOES = new Set(["__proto__", "constructor", "prototype"]); /* (als Objektliteral würde „__proto__“ kein eigener Schlüssel) */
  function sicherParse(txt) {
    let n = 0;
    const o = JSON.parse(txt, function (k, v) { if (BOES.has(k)) return undefined; if (++n > MAXN) throw new Error("gross"); return v; });
    const tiefe = (v, d) => { if (d > MAXTIEFE) throw new Error("tief"); if (v && typeof v === "object") for (const k in v) tiefe(v[k], d + 1); };
    tiefe(o, 0);
    return o;
  }
  async function lesen(text) {
    let s = String(text == null ? "" : text);
    if (s.length > MAXTXT) throw new Error("gross");
    s = s.trim();
    let json;
    if (/^ZSS1[zr][A-Za-z0-9_\-\s]+$/.test(s)) {
      const c = s.replace(/\s+/g, ""); let u;
      try { u = unb64u(c.slice(5)); } catch (_) { throw new Error("fmt"); }
      if (c[4] === "z") {
        if (typeof DecompressionStream !== "function" || !(typeof Blob === "function" && Blob.prototype.stream)) throw new Error("alt");
        try { u = await pipe(u, DecompressionStream, "deflate-raw", MAXRAW); } catch (e) { throw new Error(e && e.message === "gross" ? "gross" : "fmt"); }
      } else if (u.length > MAXRAW) throw new Error("gross");
      json = new TextDecoder().decode(u);
    } else if (s[0] === "{") json = s;
    else throw new Error("fmt");
    let o; try { o = sicherParse(json); } catch (e) { throw new Error(e && (e.message === "gross" || e.message === "tief") ? "gross" : "fmt"); }
    if (!o || typeof o !== "object" || Array.isArray(o)) throw new Error("fmt");
    let meta = null;
    if (o.spiel !== undefined || o.format !== undefined) {
      if (o.spiel !== SPIEL) throw new Error("fremd");
      if (o.format !== FORMAT) throw new Error("neu");
      meta = o.meta;
    } else meta = o; /* nackter Meta-Stand (z. B. aus einem alten Browser-Speicher kopiert) */
    if (!meta || typeof meta !== "object" || Array.isArray(meta) || meta.v !== 1) throw new Error("fremd");
    const hatFeld = ["runs", "shards", "wins"].some(k => typeof meta[k] === "number");
    if (!hatFeld) throw new Error("fremd");
    /* durch die Prüfung/Migration von spiel.js – danach legen die Module beim Laden (onSwap) ihre Felder selbst an */
    const m = Z.slots.parse(JSON.stringify(meta));
    return { meta: m, info: { platz: +o.platz || 0, version: o.version || "", erstellt: o.erstellt || "" } };
  }
  const FEHLER = {
    fmt: ["Das ist keine lesbare Spielstand-Datei bzw. kein gültiger Code.", "This is not a readable save file or a valid code."],
    gross: ["Die Datei ist zu groß oder zu verschachtelt (Schutz vor kaputten Dateien).", "The file is too large or too deeply nested (protection against broken files)."],
    fremd: ["Das ist kein Spielstand von Ezekiel – The Destroyer.", "This is not an Ezekiel – The Destroyer save."],
    neu: ["Dieser Spielstand stammt aus einer neueren Spielversion – bitte das Spiel aktualisieren.", "This save comes from a newer game version – please update the game."],
    alt: ["Dieser Browser kann gepackte Codes nicht entpacken – bitte stattdessen die Datei verwenden.", "This browser cannot unpack compressed codes – please use the file instead."]
  };
  const fehlerText = e => L(FEHLER[e && e.message] || FEHLER.fmt);

  /* ---------- Schreiben (mit Sicherung des alten Stands) ---------- */
  function schreiben(n, meta) {
    const S = Z.slots, key = S.key(n), alt = ls.get(key);
    if (alt) { ls.set("imres-zerstoerer-s" + n + "-weg", alt); ls.set("imres-zerstoerer-s" + n + "-vorImport", alt); }
    const ok = ls.set(key, JSON.stringify(meta));
    if (!ok) return false;
    if (n === S.active()) S.use(n);
    return true;
  }

  /* ---------- Ausgabe: Datei / Code ---------- */
  function dateiname(n) { const d = new Date(), p = x => String(x).padStart(2, "0"); return "zerstoerer-spielstand-" + n + "-" + d.getFullYear() + p(d.getMonth() + 1) + p(d.getDate()) + "-" + p(d.getHours()) + p(d.getMinutes()) + ".json"; }
  async function sichern(n) {
    const pk = paket(n); if (!pk) { ui.toast(L(["Dieser Platz ist leer.", "This slot is empty."])); return false; }
    const txt = JSON.stringify(pk, null, 1), name = dateiname(n), PC = window.__zsPC;
    if (PC && typeof PC.speichern === "function") {
      try { const r = await PC.speichern(name, txt); if (r && r.ok) { ui.toast(L(["Gesichert: ", "Saved: "]) + esc(r.pfad || name), 3600); merk(); return true; } if (r && r.abbruch) return false; } catch (e) { console.error(e); }
    }
    try {
      const blob = new Blob([txt], { type: "application/json" }), url = URL.createObjectURL(blob), a = document.createElement("a");
      a.href = url; a.download = name; a.style.display = "none"; document.body.appendChild(a); a.click();
      setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 1500);
      ui.toast(L(["Spielstand heruntergeladen: ", "Save downloaded: "]) + esc(name), 3400); merk();
      return true;
    } catch (e) { console.error(e); ui.toast(L(["Herunterladen nicht möglich – bitte „Code kopieren“ verwenden.", "Download not possible – please use “Copy code”."])); return false; }
  }
  async function kopierCode(n) {
    const pk = paket(n); if (!pk) return false;
    const c = await code(pk);
    let ok = false;
    try { if (navigator.clipboard && navigator.clipboard.writeText) { await navigator.clipboard.writeText(c); ok = true; } } catch (_) {}
    if (ok) { ui.toast(L(["Übertragungscode kopiert (", "Transfer code copied ("]) + Math.round(c.length / 1024) + " KB). " + L(["Auf dem anderen Gerät: Spielstände → Spielstand laden → einfügen.", "On the other device: Saves → Load save → paste."]), 4200); merk(); return true; }
    /* ohne Zwischenablage: Code im Fenster zum Markieren */
    ui.open("<h2>" + esc(L(["Übertragungscode", "Transfer code"])) + "</h2><p class=\"hinweis\">" + esc(L(["Alles markieren und kopieren, dann auf dem anderen Gerät unter Spielstände → Spielstand laden einfügen.", "Select all and copy, then paste it on the other device under Saves → Load save."])) +
      '</p><textarea class="zss-code" readonly rows="6">' + esc(c) + '</textarea><div class="knoepfe"><button data-act="zssZurueck" data-arg="' + n + '" autofocus>' + esc(L(["Zurück", "Back"])) + "</button></div>", { cls: "schmal", onClose: () => { if (!Z.level) ui.slots(n); } });
    const ta = document.querySelector("#modal .zss-code"); if (ta) { ta.focus(); ta.select(); }
    merk(); return true;
  }
  function merk() { try { Z.meta.gesichertBei = Z.meta.runs | 0; } catch (_) {} }

  /* ---------- Laden: Datei oder Code → Ziel-Platz → Rückfrage ---------- */
  let geladen = null;
  function ladenFenster() {
    geladen = null;
    ui.open("<h2>" + esc(L(["Spielstand laden", "Load save"])) + '</h2><p class="hinweis">' + esc(L(["Eine gesicherte Datei wählen oder einen Übertragungscode einfügen.", "Choose a saved file or paste a transfer code."])) + "</p>" +
      '<div class="knoepfe senk"><button data-act="zssDatei" autofocus>📂 ' + esc(L(["Datei wählen …", "Choose file …"])) + "</button>" +
      (navigator.clipboard && navigator.clipboard.readText ? '<button data-act="zssAblage">📋 ' + esc(L(["Code aus der Zwischenablage", "Code from clipboard"])) + "</button>" : "") + "</div>" +
      '<label class="zss-lab">' + esc(L(["oder Code hier einfügen:", "or paste the code here:"])) + '<textarea class="zss-ein" rows="4" spellcheck="false" aria-label="' + esc(L(["Übertragungscode", "Transfer code"])) + '"></textarea></label>' +
      '<input type="file" class="zss-file" accept=".json,application/json,text/plain" hidden>' +
      '<p class="zss-fehler" role="alert" hidden></p>' +
      '<div class="knoepfe"><button data-act="zssCode">' + esc(L(["Code prüfen", "Check code"])) + '</button><button data-act="zssZurueck">' + esc(L(["Zurück", "Back"])) + "</button></div>",
      { cls: "schmal", onClose: () => { if (!Z.level) ui.slots(); } });
    const f = document.querySelector("#modal .zss-file");
    if (f) f.onchange = () => { const d = f.files && f.files[0]; if (!d) return; if (d.size > MAXTXT) return zeigFehler({ message: "gross" }); const r = new FileReader(); r.onload = () => pruefen(String(r.result || "")); r.onerror = () => zeigFehler({ message: "fmt" }); r.readAsText(d); };
  }
  function zeigFehler(e) { const p = document.querySelector("#modal .zss-fehler"); if (p) { p.hidden = false; p.textContent = "⚠ " + fehlerText(e); } else ui.toast("⚠ " + fehlerText(e)); }
  async function pruefen(text) {
    try { geladen = await lesen(text); } catch (e) { geladen = null; return zeigFehler(e); }
    zielFenster();
  }
  function kurz(m) { const S = Z.slots, i = { runs: m.runs | 0, wins: m.wins | 0 }; const g = S.areaOf ? S.areaOf(m) : null; return L(["Läufe ", "Runs "]) + i.runs + " · " + L(["Siege ", "Wins "]) + i.wins + (g ? " · " + L(g.name) : ""); }
  function zielFenster() {
    const S = Z.slots, g = geladen; if (!g) return;
    let h = "<h2>" + esc(L(["Auf welchen Platz laden?", "Load into which slot?"])) + '</h2><p class="hinweis">' + esc(L(["Geladen: ", "Loaded: "]) + kurz(g.meta)) + (g.info.erstellt ? " · " + esc(String(g.info.erstellt).slice(0, 10)) : "") + '</p><div class="knoepfe senk">';
    for (let n = 1; n <= S.N; n++) { const i = S.info(n); h += '<button data-act="zssZiel" data-arg="' + n + '"' + (n === 1 ? " autofocus" : "") + ">" + esc(slotName(n)) + " <small>· " + esc(i.leer ? L(["leer", "empty"]) : kurz(S.meta(n))) + "</small></button>"; }
    h += '<button data-act="zssZurueck">' + esc(L(["Abbrechen", "Cancel"])) + "</button></div>";
    ui.open(h, { cls: "schmal", onClose: () => { if (!Z.level) ui.slots(); } });
  }
  function zielWahl(n) {
    const S = Z.slots, g = geladen; if (!g) return;
    const go = () => { const ok = schreiben(n, g.meta); geladen = null; ui.onClose = null; ui.slots(n); ui.toast(ok ? slotName(n) + L([" geladen.", " loaded."]) : L(["Laden fehlgeschlagen (Speicher voll oder gesperrt).", "Loading failed (storage full or blocked)."]), 3400); };
    const roh = S.parse(S.raw(n)), belegt = (roh.runs | 0) > 0 || (roh.shards | 0) > 0 || (roh.wins | 0) > 0 || !!roh.intro; /* aus dem Speicher, nicht aus Z.meta */
    if (!belegt && S.info(n).leer) return go();
    ui._zssFn = go;
    ui.open("<h2>" + esc(slotName(n) + L([" überschreiben?", ": overwrite?"])) + "</h2><p>" + esc(L(["Bisher: ", "Current: "]) + kurz(roh)) + "<br>" + esc(L(["Neu: ", "New: "]) + kurz(g.meta)) + '</p><p class="hinweis">' + esc(L(["Der bisherige Stand wird vorher automatisch gesichert.", "The current progress is backed up automatically first."])) +
      '</p><div class="knoepfe"><button data-act="zssJa" class="gefahr">' + esc(L(["Überschreiben", "Overwrite"])) + '</button><button data-act="zssZurueck" autofocus>' + esc(L(["Abbrechen", "Cancel"])) + "</button></div>", { cls: "schmal", onClose: () => { if (!Z.level) ui.slots(n); } });
  }

  /* ---------- Aktionen ---------- */
  const act = ui.actions;
  act.zssSichern = n => { sichern(+n); };
  act.zssCodeKopie = n => { kopierCode(+n); };
  act.zssLaden = () => { ui.onClose = null; ladenFenster(); };
  act.zssDatei = () => { const f = document.querySelector("#modal .zss-file"); if (f) f.click(); };
  act.zssAblage = async () => { try { const t = await navigator.clipboard.readText(); const ta = document.querySelector("#modal .zss-ein"); if (ta) ta.value = t; pruefen(t); } catch (_) { zeigFehler({ message: "fmt" }); } };
  act.zssCode = () => { const ta = document.querySelector("#modal .zss-ein"); pruefen(ta ? ta.value : ""); };
  act.zssZiel = n => zielWahl(+n);
  act.zssJa = () => { const fn = ui._zssFn; ui._zssFn = null; ui.onClose = null; if (fn) fn(); };
  act.zssZurueck = n => { ui.onClose = null; geladen = null; ui.slots(+n || undefined); };
  act.zssErinnern = (_, b) => { Z.settings.sicherHinweis = Z.settings.sicherHinweis === false; Z.saveSettings && Z.saveSettings(); if (b) b.textContent = erinnLab(); };
  const erinnLab = () => "🔔 " + L(["Erinnerung ans Sichern (alle 10 Läufe): ", "Backup reminder (every 10 runs): "]) + (Z.settings.sicherHinweis === false ? L(["aus", "off"]) : L(["an", "on"]));

  /* ---------- Spielstand-Fenster ergänzen ---------- */
  const s0 = ui.slots;
  ui.slots = function () {
    const r = s0.apply(this, arguments);
    try {
      const m = document.getElementById("modal"), S = Z.slots;
      m.querySelectorAll(".sl-karte").forEach((k, i) => {
        const n = i + 1; if (n > S.N || S.info(n).leer) return;
        const kn = k.querySelector(".sl-knoepfe"); if (!kn || kn.querySelector('[data-act="zssSichern"]')) return;
        kn.insertAdjacentHTML("beforeend", '<button data-act="zssSichern" data-arg="' + n + '">💾 ' + esc(L(["Sichern", "Back up"])) + '</button><button data-act="zssCodeKopie" data-arg="' + n + '">🔗 ' + esc(L(["Code kopieren", "Copy code"])) + "</button>");
      });
      const kb = m.querySelector(".spielstaende .knoepfe:last-child, .mbox > .knoepfe:last-child");
      if (kb && !kb.querySelector('[data-act="zssLaden"]')) kb.insertAdjacentHTML("afterbegin", '<button data-act="zssLaden">📂 ' + esc(L(["Spielstand laden", "Load save"])) + '</button><button data-act="zssErinnern">' + esc(erinnLab()) + "</button>");
    } catch (e) { console.error("W39 Sicherung", e); }
    return r;
  };

  /* ---------- Erinnerung alle 10 Läufe (im Lager, einmal je Zehner) ---------- */
  const la0 = Z.loadArea;
  if (la0) Z.loadArea = function () {
    const r = la0.apply(this, arguments);
    try {
      const M = Z.meta, runs = M ? M.runs | 0 : 0;
      if (Z.level && Z.level.hub && runs >= 10 && Z.settings.sicherHinweis !== false && !window.__zsPCAuto) {
        const zehner = Math.floor(runs / 10) * 10;
        if ((M.sicherHinweisBei | 0) < zehner && (M.gesichertBei | 0) < zehner) {
          M.sicherHinweisBei = zehner;
          setTimeout(() => { if (ui.notify) ui.notify("💾 <b>" + esc(L(["Spielstand sichern?", "Back up your save?"])) + "</b><br><small>" + esc(L(["Titelbild → Spielstände → Sichern. Browser-Daten löschen entfernt sonst den Fortschritt.", "Title → Saves → Back up. Clearing browser data would otherwise remove your progress."])) + "</small>", { prio: 1, key: "w39sicher" }); }, 2500);
        }
      }
    } catch (e) { console.error("W39 Sicherung", e); }
    return r;
  };

  Z.sicherung = { paket, code, lesen, schreiben, sichern, kopierCode, MAXTXT };
})();
