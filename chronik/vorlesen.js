/* =====================================================================
   VORLESEN – die Chronik als Hörbuch (Sprecher: Helmut, ElevenLabs)
   ---------------------------------------------------------------------
   Die Aufnahmen entstehen per GitHub-Ablauf (tools/vertonung/vertonen.py)
   und liegen unter audio/chronik/<sprache>/ mit manifest.json:
   { kapitel: { "I": [{ i, datei, titel }], "vorab": [...] } }
   i = Index des Absatzes in inhalt.js → entspricht dem i-ten Kind von
   #kapitel-<nr> .prose. Bilder werden übersprungen.
   Knöpfe: am Kapitelanfang „Kapitel vorlesen“, an jeder Zwischenüberschrift
   ein kleines ▶ („ab hier“). Unten erscheint ein kleiner Spieler.
   Hörspiel (chronik/hoerspiel.js, Standard an): Geräuschkulisse, Effekte und
   Zwischenspiele; der Notenknopf im Spieler öffnet das kleine Mischpult
   (an/aus, Kulisse, Musik & Effekte, Tempo). Taste „h“ schaltet es um.
   ===================================================================== */
(function () {
  "use strict";
  const de = () => (document.documentElement.lang || "de").slice(0, 2) !== "en";
  const TX = {
    de: { kapitel: n => "Kapitel " + n + " vorlesen", kurz: "Vorlesen", abHier: "Ab hier vorlesen", spielen: "Weiter", pause: "Pause", zurueck: "Absatz zurück", vor: "Absatz vor", zu: "Vorlesen beenden", sprecher: "gelesen von Helmut", tempo: "Tempo", vorab: "Ein Wort vorab", hoerspiel: "Hörspiel", hsLang: "Hörspiel: Geräusche & Musik", hsKulisse: "Kulisse", hsMusik: "Musik & Effekte", hsAn: "an", hsAus: "aus", schlaf: "Schlummer-Timer", schlafAus: "Aus", schlafAbschnitt: "Abschnittsende", schlafKapitel: "Kapitelende", schlafNoch: "noch" },
    en: { kapitel: n => "Listen to chapter " + n, kurz: "Listen", abHier: "Listen from here", spielen: "Play", pause: "Pause", zurueck: "Previous paragraph", vor: "Next paragraph", zu: "Stop listening", sprecher: "read by Helmut", tempo: "Speed", vorab: "A word first", hoerspiel: "Radio play", hsLang: "Radio play: sounds & music", hsKulisse: "Ambience", hsMusik: "Music & effects", hsAn: "on", hsAus: "off", schlaf: "Sleep timer", schlafAus: "Off", schlafAbschnitt: "End of section", schlafKapitel: "End of chapter", schlafNoch: "" }
  };
  const t = () => TX[de() ? "de" : "en"];
  const lies = (k, d) => { try { const v = localStorage.getItem(k); return v == null ? d : v; } catch (_) { return d; } };
  const schreib = (k, v) => { try { localStorage.setItem(k, v); } catch (_) {} };

  let manifest = null, mSprache = null, liste = [], pos = -1, audio = null, spielt = false, tempo = parseFloat(lies("imres-vorlesen-tempo", "1")) || 1;
  let leiste = null, letztesScrollen = 0;

  const PLAY = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l11-6.5z" fill="currentColor"/></svg>';
  const PAUSE = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5h3.6v14H7zM13.4 5H17v14h-3.6z" fill="currentColor"/></svg>';
  const ZURUECK = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 5h2v14H6zM20 5.5v13L9.5 12z" fill="currentColor"/></svg>';
  const VOR = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16 5h2v14h-2zM4 5.5v13L14.5 12z" fill="currentColor"/></svg>';
  const OHR = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 13v-1a8 8 0 0 1 16 0v1" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><rect x="3.2" y="12.5" width="4.6" height="7" rx="1.6" fill="currentColor"/><rect x="16.2" y="12.5" width="4.6" height="7" rx="1.6" fill="currentColor"/></svg>';
  const HS = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 17.5V6l10-2v11.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><circle cx="6.6" cy="17.6" r="2.5" fill="currentColor"/><circle cx="16.6" cy="15.6" r="2.5" fill="currentColor"/><path d="M2.5 9.5c1.2-1 1.2-2.6 0-3.6M4.8 11.2c2.2-2 2.2-5 0-7" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>';
  const esc = s => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  /* ---------- Aussehen ---------- */
  const css = document.createElement("style");
  css.textContent = `
.vl-knopf { justify-self: start; width: max-content; max-width: 100%; display: inline-flex; align-items: center; gap: .55rem; margin: .2rem .6rem .2rem 0; padding: .55rem 1rem .55rem .7rem; border: 1px solid rgba(224,160,70,.55); background: rgba(16,14,21,.55); color: var(--vellum, #ebe2cc); font: inherit; font-size: .92rem; cursor: pointer; border-radius: 999px; transition: background .25s, border-color .25s, box-shadow .25s; }
.vl-knopf svg { width: 1.25rem; height: 1.25rem; color: var(--ember, #e0a046); flex: none; }
.vl-knopf small { color: var(--ash, #b8a998); font-size: .78em; margin-left: .2rem; }
.vl-knopf:hover, .vl-knopf:focus-visible { border-color: var(--ember, #e0a046); background: rgba(224,160,70,.14); box-shadow: 0 0 18px rgba(224,160,70,.18); }
.vl-pod { justify-self: start; display: inline-flex; align-items: center; gap: .35rem; margin: .1rem 0 .3rem; font-size: .88rem; color: var(--ash, #b8a998); text-decoration: none; border-bottom: 1px dotted rgba(224,160,70,.5); }
.vl-pod:hover, .vl-pod:focus-visible { color: var(--ember, #e0a046); }
.vl-pod small { font-size: .8em; opacity: .8; }
.vl-ab { display: inline-grid; place-items: center; width: 1.9rem; height: 1.9rem; margin-left: .5rem; padding: 0; vertical-align: middle; border: 1px solid rgba(224,160,70,.35); border-radius: 50%; background: none; color: var(--ember, #e0a046); cursor: pointer; opacity: .55; transition: opacity .2s, background .2s; }
.vl-ab svg { width: .95rem; height: .95rem; }
.sub:hover .vl-ab, .vl-ab:hover, .vl-ab:focus-visible { opacity: 1; background: rgba(224,160,70,.12); }
@media (pointer: coarse) { .vl-ab { width: 2.3rem; height: 2.3rem; opacity: .75; } }
/* gerade gelesener Absatz */
#chapters .prose > .vl-aktiv { position: relative; transition: color .4s; }
#chapters .prose > p.vl-aktiv::before, #chapters .prose > .sub.vl-aktiv::before { content: ""; position: absolute; left: -1rem; top: .2em; bottom: .2em; width: 3px; border-radius: 3px; background: linear-gradient(180deg, transparent, var(--ember, #e0a046) 20%, var(--ember, #e0a046) 80%, transparent); box-shadow: 0 0 12px rgba(224,160,70,.55); animation: vlAtem 2.4s ease-in-out infinite; }
#chapters .prose > p.vl-aktiv { color: #f3ead6; }
@keyframes vlAtem { 50% { opacity: .55; } }
@media (max-width: 600px) { #chapters .prose > p.vl-aktiv::before, #chapters .prose > .sub.vl-aktiv::before { left: -.6rem; } }
/* kleiner Spieler unten */
.vl-leiste { position: fixed; left: 50%; bottom: calc(var(--vl-unten, 16px) + env(safe-area-inset-bottom, 0px)); z-index: 60; display: flex; align-items: center; gap: .4rem; max-width: min(36rem, calc(100vw - 1.5rem)); width: max-content; padding: .45rem .55rem .45rem .5rem; border: 1px solid rgba(224,160,70,.45); border-radius: 999px;
  background: rgba(18,15,24,.92); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); box-shadow: 0 10px 30px rgba(0,0,0,.5), 0 0 22px rgba(224,160,70,.12); color: var(--vellum, #ebe2cc);
  transform: translate(-50%, 140%); opacity: 0; transition: transform .45s cubic-bezier(.2,.8,.3,1), opacity .35s; }
.vl-leiste.da { transform: translate(-50%, 0); opacity: 1; }
.vl-leiste button { display: grid; place-items: center; width: 2.4rem; height: 2.4rem; padding: 0; border: 0; border-radius: 50%; background: none; color: var(--vellum, #ebe2cc); cursor: pointer; flex: none; }
.vl-leiste button svg { width: 1.15rem; height: 1.15rem; }
.vl-leiste button:hover, .vl-leiste button:focus-visible { background: rgba(224,160,70,.16); color: var(--ember, #e0a046); }
.vl-leiste .vl-haupt { width: 2.8rem; height: 2.8rem; background: var(--ember, #e0a046); color: #1a1208; }
.vl-leiste .vl-haupt:hover, .vl-leiste .vl-haupt:focus-visible { background: #f0b85e; color: #1a1208; }
.vl-leiste .vl-haupt svg { width: 1.35rem; height: 1.35rem; }
.vl-info { min-width: 0; display: grid; gap: .1rem; padding: 0 .35rem; cursor: pointer; }
.vl-info b { font-family: var(--name, serif); font-weight: 400; font-size: .98rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 15rem; }
.vl-info small { font-size: .7rem; letter-spacing: .08em; color: var(--ash, #b8a998); white-space: nowrap; }
.vl-balken { height: 3px; border-radius: 3px; background: rgba(235,226,204,.15); overflow: hidden; margin-top: .15rem; }
.vl-balken i { display: block; height: 100%; width: 0; background: var(--ember, #e0a046); }
.vl-leiste .vl-tempo { width: auto; padding: 0 .55rem; font: inherit; font-size: .78rem; border-radius: 999px; color: var(--ash, #b8a998); }
.vl-leiste .vl-zu { width: 2rem; height: 2rem; color: var(--ash, #b8a998); font-size: 1rem; }
.vl-welle { display: inline-flex; gap: 2px; align-items: flex-end; height: .8rem; margin-left: .35rem; vertical-align: -1px; }
.vl-welle i { width: 2px; background: var(--ember, #e0a046); border-radius: 1px; height: 30%; }
.vl-leiste.spielt .vl-welle i { animation: vlWelle 1s ease-in-out infinite; } .vl-welle i:nth-child(2) { animation-delay: -.3s !important; } .vl-welle i:nth-child(3) { animation-delay: -.6s !important; }
@keyframes vlWelle { 50% { height: 100%; } }
@media (max-width: 520px) { .vl-info b { max-width: 7.5rem; } .vl-leiste .vl-tempo { display: none; } .vl-leiste { gap: .15rem; } .vl-leiste button { width: 2.25rem; height: 2.25rem; } .vl-leiste .vl-haupt { width: 2.6rem; height: 2.6rem; } }
.vl-mond { color: var(--ember, #e0a046); margin-left: .4rem; letter-spacing: 0; }
@media (max-width: 520px) { .vl-info small:has(.vl-mond) .vl-spr { display: none; } }
.vl-schlaf { display: flex; flex-wrap: wrap; gap: .3rem; align-items: center; }
/* Hörspiel-Schalter und kleines Mischpult */
.vl-leiste .vl-hs { position: relative; color: var(--ash, #b8a998); }
.vl-leiste .vl-hs[aria-pressed="true"] { color: var(--ember, #e0a046); }
.vl-leiste .vl-hs[aria-pressed="false"]::after { content: ""; position: absolute; left: 22%; right: 22%; top: 50%; height: 1.6px; background: currentColor; transform: rotate(-38deg); border-radius: 1px; }
.vl-pult { position: fixed; left: 50%; bottom: calc(var(--vl-unten, 16px) + env(safe-area-inset-bottom, 0px) + 4.1rem); z-index: 61; width: min(19rem, calc(100vw - 1.5rem)); transform: translateX(-50%); padding: .85rem .95rem .8rem; border: 1px solid rgba(224,160,70,.45); border-radius: 14px;
  background: rgba(18,15,24,.96); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); box-shadow: 0 12px 30px rgba(0,0,0,.55); color: var(--vellum, #ebe2cc); font-size: .86rem; display: grid; gap: .6rem; }
.vl-pult[hidden] { display: none; }
.vl-pult label { display: grid; grid-template-columns: 1fr auto; align-items: center; gap: .35rem .6rem; }
.vl-pult .vl-schalter { display: flex; align-items: center; justify-content: space-between; gap: .8rem; cursor: pointer; }
.vl-pult .vl-schalter b { font-family: var(--name, serif); font-weight: 400; font-size: 1rem; }
.vl-pult .vl-hs-an { width: 2.6rem; height: 1.45rem; padding: 0; border: 0; border-radius: 999px; background: rgba(235,226,204,.18); position: relative; cursor: pointer; flex: none; transition: background .2s; }
.vl-pult .vl-hs-an i { position: absolute; top: .17rem; left: .18rem; width: 1.1rem; height: 1.1rem; border-radius: 50%; background: #d8cdb6; transition: transform .2s, background .2s; }
.vl-pult .vl-hs-an[aria-checked="true"] { background: rgba(224,160,70,.75); }
.vl-pult .vl-hs-an[aria-checked="true"] i { transform: translateX(1.12rem); background: #1a1208; }
.vl-pult .vl-hs-an:focus-visible { outline: 2px solid var(--ember, #e0a046); outline-offset: 2px; }
@media (prefers-reduced-motion: reduce) { .vl-pult .vl-hs-an, .vl-pult .vl-hs-an i { transition: none; } }
.vl-pult input[type=range] { grid-column: 1 / -1; width: 100%; accent-color: var(--ember, #e0a046); margin: 0; }
.vl-pult small { color: var(--ash, #b8a998); font-size: .74rem; }
.vl-pult .vl-reihe { display: flex; gap: .3rem; flex-wrap: wrap; align-items: center; }
.vl-pult .vl-reihe button { padding: .25rem .6rem; border-radius: 999px; border: 1px solid rgba(224,160,70,.35); background: none; color: var(--vellum, #ebe2cc); font: inherit; font-size: .8rem; cursor: pointer; }
.vl-pult .vl-reihe button[aria-pressed="true"] { background: rgba(224,160,70,.8); color: #1a1208; border-color: transparent; }
.vl-pult.aus .vl-regler { opacity: .45; }
@media (prefers-reduced-motion: reduce) { .vl-welle i, #chapters .prose > .vl-aktiv::before { animation: none !important; } }
`;
  document.head.appendChild(css);

  /* ---------- Daten ---------- */
  function manifestLaden() {
    const sp = de() ? "de" : "en";
    if (mSprache === sp) return Promise.resolve(manifest);
    mSprache = sp; manifest = null;
    return fetch("audio/chronik/" + sp + "/manifest.json", { cache: "no-cache" }).then(r => r.ok ? r.json() : null).catch(() => null).then(m => { if (mSprache === sp) manifest = m; return manifest; });
  }
  const absatzEl = (kap, i) => { const art = document.getElementById("kapitel-" + kap); const pr = art && art.querySelector(".prose"); return pr ? pr.children[i] || null : null; };
  function listeBauen() {
    liste = [];
    const K = (manifest && manifest.kapitel) || {};
    /* Reihenfolge wie auf der Seite: Kapitel in Dokumentreihenfolge */
    const arts = Array.from(document.querySelectorAll("#chapters > .chapter"));
    arts.forEach(a => {
      const nr = a.id.replace(/^kapitel-/, ""); (K[nr] || []).forEach(e => liste.push({ kap: nr, i: e.i, datei: e.datei, titel: !!e.titel }));
    });
  }
  function abschnittVon(kap, i) {
    const art = document.getElementById("kapitel-" + kap); if (!art) return "";
    const kinder = art.querySelector(".prose").children;
    for (let j = Math.min(i, kinder.length - 1); j >= 0; j--) if (kinder[j].classList.contains("sub")) return kinder[j].textContent.replace(/Auf der Karte.*$|On the map.*$/, "").trim();
    const h = art.querySelector("h3"); return h ? h.textContent : "";
  }

  /* ---------- Abspielen ---------- */
  function markieren() {
    document.querySelectorAll("#chapters .vl-aktiv").forEach(e => e.classList.remove("vl-aktiv"));
    const x = liste[pos]; if (!x) return;
    const el = absatzEl(x.kap, x.i); if (!el) return;
    el.classList.add("vl-aktiv");
    /* mitscrollen – außer der Nutzer hat gerade selbst gescrollt */
    if (Date.now() - letztesScrollen > 6000) {
      const r = el.getBoundingClientRect();
      if (r.top < 90 || r.bottom > innerHeight - 140) { const y = scrollY + r.top - Math.max(100, innerHeight * .28); window.scrollTo({ top: y, behavior: "smooth" }); eigenesScrollen = Date.now(); }
    }
  }
  let eigenesScrollen = 0;
  window.addEventListener("scroll", () => { if (Date.now() - eigenesScrollen > 1200) letztesScrollen = Date.now(); }, { passive: true });

  /* ---------- Hörspiel (chronik/hoerspiel.js): Kulisse, Effekte, Zwischenspiele ---------- */
  const HSP = () => (window.ImresHoerspiel && window.ImresHoerspiel.verfuegbar() ? window.ImresHoerspiel : null);
  let wartUhr = 0, wartTok = 0, wartet = false;
  function warteAbbrechen() { clearTimeout(wartUhr); wartTok++; wartet = false; }
  /* art: "start" (Knopf in der Chronik), "weiter" (der vorige Absatz ist zu Ende), "sprung" (vor/zurück) */
  /* Vorrat: die nächsten Absätze werden vollständig heruntergeladen (Blob), bevor sie dran sind –
     so gibt es bei wackeligem Handy-Netz keine Hänger mitten im Satz oder zwischen den Absätzen */
  const vorrat = new Map();   /* datei → { p: Promise<url>, url } */
  function holen(datei) {
    if (!datei || vorrat.has(datei)) return;
    const e = { url: null };
    e.p = fetch(datei).then(r => r.ok ? r.blob() : Promise.reject(r.status)).then(b => (e.url = URL.createObjectURL(b))).catch(() => (e.url = null));
    vorrat.set(datei, e);
  }
  function vorratAufraeumen() {
    const behalten = new Set([pos - 1, pos, pos + 1, pos + 2, pos + 3].map(k => liste[k] && liste[k].datei).filter(Boolean));
    vorrat.forEach((e, d) => { if (!behalten.has(d)) { if (e.url) URL.revokeObjectURL(e.url); vorrat.delete(d); } });
  }
  let quelleBereit = Promise.resolve(), quelleSofort = true;
  function quelleSetzen(src, sofort) {
    const e = vorrat.get(src);
    quelleSofort = true;
    if (e && e.url) { audio.src = e.url; return Promise.resolve(); }
    if (sofort || !e) { audio.src = src; return Promise.resolve(); }   /* erster Klick: sofort (Autoplay-Regeln), sonst Netz */
    quelleSofort = false;
    /* noch nicht fertig geladen: bis zu 6 s warten, dann notfalls direkt streamen */
    return Promise.race([e.p, new Promise(r => setTimeout(r, 6000))]).then(() => { if (liste[pos] && liste[pos].datei === src) audio.src = e.url || src; });
  }
  function spielen(i, art) {
    art = art || "sprung";
    if (art === "weiter" && schlafGrenze(i)) { warteAbbrechen(); schlafAnhalten(); return; }
    warteAbbrechen();
    const H = HSP();
    if (i < 0 || i >= liste.length) {
      if (art === "weiter" && H && H.an() && pos >= 0) {
        const tok = wartTok; wartet = true; zeichnen();
        H.kapitelEnde().then(ms => { if (tok !== wartTok) return; wartUhr = setTimeout(() => { if (tok === wartTok) { wartet = false; stopp(true); } }, ms); });
        return;
      }
      stopp(true); return;
    }
    const vor = pos >= 0 ? liste[pos] : null;
    pos = i; const x = liste[pos];
    if (!audio) {
      audio = new Audio(); audio.preload = "auto";
      audio.addEventListener("ended", beiEnde);
      audio.addEventListener("timeupdate", fortschritt);
      audio.addEventListener("error", () => { if (pos >= 0) setTimeout(() => spielen(pos + 1, "weiter"), 300); });
      audio.addEventListener("playing", () => { const h = HSP(); if (h && pos >= 0) h.sprache(liste[pos], audio); medienStatus(); zeichnen(); });
      audio.addEventListener("pause", () => { const h = HSP(); if (h && !audio.ended && !wartet) h.pause(); medienStatus(); zeichnen(); });
      audio.addEventListener("ratechange", () => { const h = HSP(); if (h && !audio.paused && pos >= 0) h.sprache(liste[pos], audio); });
      audio.addEventListener("seeked", () => { const h = HSP(); if (h && !audio.paused && pos >= 0) h.sprache(liste[pos], audio); });
    }
    const src = x.datei;
    quelleBereit = quelleSetzen(src, art !== "weiter");
    audio.playbackRate = tempo;
    spielt = true;
    schreib("imres-vorlesen-pos", JSON.stringify({ sp: mSprache, kap: x.kap, i: x.i }));
    markieren(); zeichnen(); medienInfo();
    /* nächsten Absatz vorladen */
    const n = liste[pos + 1];
    [1, 2, 3].forEach(k => liste[pos + k] && holen(liste[pos + k].datei)); vorratAufraeumen();
    if (!H || !H.an()) { los(); return; }
    if (H.direkt() && art === "weiter") { H.ortNur(x); los(); return; }   /* Sperrbildschirm: ohne Zwischenspiel sofort weiter */
    /* Hörspiel: erst Ortswechsel und Zwischenspiel, dann die Stimme */
    const kapStart = liste.findIndex(y => y.kap === x.kap) === pos;
    const tok = wartTok; wartet = true; zeichnen(); medienStatus();
    H.uebergang(vor, x, { art, kapStart, naechster: n || null }).then(ms => {
      if (tok !== wartTok) return;
      if (!(ms > 0)) { wartet = false; los(); return; }
      wartUhr = setTimeout(() => { if (tok === wartTok) { wartet = false; los(); } }, ms);
    }, () => { if (tok === wartTok) { wartet = false; los(); } });
  }
  function los() {
    if (!audio || pos < 0) return;
    const jetzt = pos, tok = wartTok;
    const spiel = () => {
      if (pos !== jetzt || tok !== wartTok) return;
      audio.playbackRate = tempo;
      const p = audio.play(); if (p && p.catch) p.catch(() => { spielt = false; zeichnen(); });
      spielt = true; zeichnen();
    };
    /* Quelle schon gesetzt (erster Klick oder Absatz fertig geladen) → synchron, damit die Autoplay-Erlaubnis greift */
    if (quelleSofort) spiel(); else quelleBereit.then(spiel);
  }
  function beiEnde() {
    if (pos < 0) return;
    const H = HSP();
    const ms = H && H.an() ? H.absatzEnde(liste[pos]) : 0;
    if (!(ms > 0)) { spielen(pos + 1, "weiter"); return; }
    const tok = ++wartTok; wartet = true; zeichnen();
    wartUhr = setTimeout(() => { if (tok === wartTok) { wartet = false; spielen(pos + 1, "weiter"); } }, ms);
  }
  function umschalten() {
    if (!audio || pos < 0) return;
    const H = HSP();
    if (wartet) {               /* während Zwischenspiel oder Pause zwischen Absätzen */
      warteAbbrechen(); spielt = false; if (H) H.pause(); zeichnen(); medienStatus(); return;
    }
    if (audio.paused) {
      if (H) { H.ein(); H.weiter(); }
      if (audio.ended) { spielen(pos + 1, "weiter"); return; }
      los();
    } else { audio.pause(); spielt = false; }
    zeichnen();
  }
  function stopp(fertig) {
    warteAbbrechen();
    if (audio) audio.pause(); spielt = false;
    const H = HSP(); if (H) H.stopp();
    document.querySelectorAll("#chapters .vl-aktiv").forEach(e => e.classList.remove("vl-aktiv"));
    if (leiste) leiste.classList.remove("da", "spielt");
    pultZu();
    if (fertig) pos = -1;
    medienStatus();
  }
  function fortschritt() { if (!leiste || !audio) return; const b = leiste.querySelector(".vl-balken i"); const ges = liste.length || 1; b.style.width = (((pos + (audio.duration ? audio.currentTime / audio.duration : 0)) / ges) * 100).toFixed(2) + "%"; }

  /* ---------- Spieler-Leiste ---------- */
  function leisteBauen() {
    if (leiste) return;
    leiste = document.createElement("div"); leiste.className = "vl-leiste"; leiste.setAttribute("role", "region");
    leiste.innerHTML = '<button type="button" class="vl-zurueck">' + ZURUECK + '</button><button type="button" class="vl-haupt">' + PAUSE + '</button><button type="button" class="vl-vor">' + VOR + '</button>' +
      '<div class="vl-info"><b></b><small></small><div class="vl-balken"><i></i></div></div><button type="button" class="vl-tempo"></button><button type="button" class="vl-hs" aria-haspopup="true" aria-expanded="false">' + HS + '</button><button type="button" class="vl-zu">✕</button>';
    document.body.appendChild(leiste);
    leiste.addEventListener("click", e => {
      const b = e.target.closest("button, .vl-info"); if (!b) return;
      if (b.classList.contains("vl-haupt")) umschalten();
      else if (b.classList.contains("vl-vor")) { const h = HSP(); if (h) h.ein(); spielen(pos + 1, "sprung"); }
      else if (b.classList.contains("vl-zurueck")) { const h = HSP(); if (h) h.ein(); spielen(audio && audio.currentTime > 3 && !wartet ? pos : Math.max(0, pos - 1), "sprung"); }
      else if (b.classList.contains("vl-hs")) pultUmschalten();
      else if (b.classList.contains("vl-zu")) stopp(false);
      else if (b.classList.contains("vl-tempo")) { const st = [1, 1.15, 1.3, 0.9]; tempoSetzen(st[(st.indexOf(tempo) + 1) % st.length] || 1); }
      else if (b.classList.contains("vl-info")) { letztesScrollen = 0; markieren(); }
    });
  }
  function tempoSetzen(v) { tempo = v; schreib("imres-vorlesen-tempo", String(tempo)); if (audio) audio.playbackRate = tempo; zeichnen(); pultZeichnen(); }
  /* kleines Mischpult über der Leiste: Hörspiel an/aus, Kulisse, Musik & Effekte, Tempo */
  let pult = null;
  function pultBauen() {
    if (pult) return;
    pult = document.createElement("div"); pult.className = "vl-pult"; pult.hidden = true; pult.setAttribute("role", "dialog");
    pult.innerHTML = '<div class="vl-schalter"><b></b><button type="button" role="switch" class="vl-hs-an"><i></i></button></div>' +
      '<label class="vl-regler"><span class="vl-l-kul"></span><small class="vl-w-kul"></small><input type="range" min="0" max="150" step="5" class="vl-kul"></label>' +
      '<label class="vl-regler"><span class="vl-l-mus"></span><small class="vl-w-mus"></small><input type="range" min="0" max="150" step="5" class="vl-mus"></label>' +
      '<div class="vl-reihe"><small class="vl-l-tempo"></small></div>' +
      '<div class="vl-reihe vl-schlaf"><small class="vl-l-schlaf"></small></div>';
    document.body.appendChild(pult);
    const reihe = pult.querySelector(".vl-reihe");
    [0.9, 1, 1.15, 1.3].forEach(v => { const b = document.createElement("button"); b.type = "button"; b.dataset.tempo = v; reihe.appendChild(b); });
    const sr = pult.querySelector(".vl-schlaf");
    ["0", "15", "30", "45", "60", "abschnitt", "kapitel"].forEach(v => { const b = document.createElement("button"); b.type = "button"; b.dataset.schlaf = v; sr.appendChild(b); });
    pult.addEventListener("input", e => {
      const H = window.ImresHoerspiel; if (!H) return;
      if (e.target.classList.contains("vl-kul")) H.kulisse(e.target.value / 100);
      if (e.target.classList.contains("vl-mus")) H.musik(e.target.value / 100);
      pultZeichnen();
    });
    pult.addEventListener("click", e => {
      const b = e.target.closest("[data-tempo]"); if (b) tempoSetzen(+b.dataset.tempo);
      const sb = e.target.closest("[data-schlaf]"); if (sb) schlafSetzen(sb.dataset.schlaf);
      if (e.target.closest(".vl-schalter")) hsUmschalten();
    });
    document.addEventListener("click", e => { if (pult && !pult.hidden && !e.target.closest(".vl-pult, .vl-hs")) pultZu(); });
    document.addEventListener("keydown", e => { if (e.key === "Escape" && pult && !pult.hidden) { pultZu(); const k = leiste && leiste.querySelector(".vl-hs"); if (k) k.focus(); } });
  }
  /* Hörspiel an/aus – läuft gerade ein Zwischenspiel, geht es beim Ausschalten sofort mit der Stimme weiter */
  function hsUmschalten() {
    const H = window.ImresHoerspiel; if (!H) return;
    H.setAn(!H.an());
    if (!H.an() && wartet) { warteAbbrechen(); if (pos >= 0 && audio && !audio.ended) los(); else if (pos >= 0) spielen(pos + 1, "weiter"); }
    pultZeichnen(); zeichnen();
  }
  function pultZeichnen() {
    if (!pult) return;
    const T = t(), H = window.ImresHoerspiel, an = !!(H && H.an());
    pult.querySelector(".vl-schalter b").textContent = T.hsLang;
    const cb = pult.querySelector(".vl-hs-an"); cb.setAttribute("aria-checked", an ? "true" : "false"); cb.setAttribute("aria-label", T.hsLang);
    pult.classList.toggle("aus", !an);
    const k = Math.round((H ? H.kulisse() : 1) * 100), m = Math.round((H ? H.musik() : 1) * 100);
    pult.querySelector(".vl-l-kul").textContent = T.hsKulisse; pult.querySelector(".vl-w-kul").textContent = k + " %"; pult.querySelector(".vl-kul").value = k; pult.querySelector(".vl-kul").setAttribute("aria-label", T.hsKulisse);
    pult.querySelector(".vl-l-mus").textContent = T.hsMusik; pult.querySelector(".vl-w-mus").textContent = m + " %"; pult.querySelector(".vl-mus").value = m; pult.querySelector(".vl-mus").setAttribute("aria-label", T.hsMusik);
    pult.querySelectorAll(".vl-regler input").forEach(r => { r.disabled = !an; });
    pult.querySelector(".vl-l-tempo").textContent = T.tempo + ":";
    pult.querySelectorAll("[data-tempo]").forEach(b => { const v = +b.dataset.tempo; b.textContent = String(v).replace(".", de() ? "," : ".") + "×"; b.setAttribute("aria-pressed", v === tempo ? "true" : "false"); });
    pult.querySelector(".vl-l-schlaf").textContent = "☾ " + T.schlaf + ":";
    pult.querySelectorAll("[data-schlaf]").forEach(b => {
      const v = b.dataset.schlaf;
      b.textContent = v === "0" ? T.schlafAus : v === "abschnitt" ? T.schlafAbschnitt : v === "kapitel" ? T.schlafKapitel : v + " min";
      const an = v === "0" ? !schlafModus : schlafModus === v;
      b.setAttribute("aria-pressed", an ? "true" : "false");
    });
  }
  /* Schlummer-Timer: nach X Minuten sanft ausblenden und pausieren – oder am Ende des Abschnitts/Kapitels anhalten */
  let schlafModus = "", schlafEnde = 0, schlafUhr = 0;
  const AUSBLENDEN = 25;
  function schlafSetzen(v) {
    clearInterval(schlafUhr); schlafUhr = 0; schlafEnde = 0;
    if (audio) audio.volume = 1;
    schlafModus = v === "0" ? "" : v;
    if (/^\d+$/.test(schlafModus)) { schlafEnde = Date.now() + (+schlafModus) * 60000; schlafUhr = setInterval(schlafTick, 1000); }
    pultZeichnen(); zeichnen();
  }
  function schlafTick() {
    const rest = (schlafEnde - Date.now()) / 1000;
    if (audio && spielt) audio.volume = Math.max(0, Math.min(1, rest / AUSBLENDEN));
    if (rest <= 0) { schlafAnhalten(); return; }
    if (Math.round(rest) % 30 === 0) zeichnen();
  }
  function schlafAnhalten() {
    clearInterval(schlafUhr); schlafUhr = 0; schlafEnde = 0; schlafModus = "";
    const H = HSP();
    if (wartet) { warteAbbrechen(); if (H) H.pause(); }
    else if (audio && !audio.paused) audio.pause();
    else if (H) H.pause();
    spielt = false;
    setTimeout(() => { if (audio) audio.volume = 1; }, 300);
    pultZeichnen(); zeichnen(); medienStatus();
  }
  /* true = hier anhalten statt weiterzuspielen (Abschnitts-/Kapitelende) */
  function schlafGrenze(i) {
    if (!schlafModus || pos < 0) return false;
    const n = liste[i];
    if (schlafModus === "kapitel") return !n || n.kap !== liste[pos].kap;
    if (schlafModus === "abschnitt") return !n || n.titel || n.kap !== liste[pos].kap;
    return false;
  }
  function pultUmschalten() {
    pultBauen();
    if (!pult.hidden) { pultZu(); return; }
    pultZeichnen(); pult.hidden = false;
    const k = leiste && leiste.querySelector(".vl-hs"); if (k) k.setAttribute("aria-expanded", "true");
    const cb = pult.querySelector(".vl-hs-an"); if (cb) cb.focus({ preventScroll: true });
  }
  function pultZu() { if (!pult || pult.hidden) return; pult.hidden = true; const k = leiste && leiste.querySelector(".vl-hs"); if (k) k.setAttribute("aria-expanded", "false"); }
  function untenAbstand() {
    const nav = document.querySelector(".handyleiste");
    let u = 16;
    if (nav) { const cs = getComputedStyle(nav), r = nav.getBoundingClientRect(); if (cs.display !== "none" && r.height > 0 && r.top < innerHeight) u = innerHeight - r.top + 10; }
    document.documentElement.style.setProperty("--vl-unten", u + "px");
  }
  function zeichnen() {
    if (pos < 0) return; leisteBauen(); untenAbstand();
    const T = t(), x = liste[pos];
    const an = !!(spielt && audio && (!audio.paused || wartet));
    leiste.classList.add("da"); leiste.classList.toggle("spielt", an);
    const h = leiste.querySelector(".vl-haupt");
    h.innerHTML = an ? PAUSE : PLAY; h.setAttribute("aria-label", an ? T.pause : T.spielen);
    leiste.querySelector(".vl-zurueck").setAttribute("aria-label", T.zurueck); leiste.querySelector(".vl-vor").setAttribute("aria-label", T.vor); leiste.querySelector(".vl-zu").setAttribute("aria-label", T.zu);
    leiste.querySelector(".vl-info b").textContent = x ? (x.kap === "vorab" ? T.vorab : abschnittVon(x.kap, x.i)) : "";
    leiste.querySelector(".vl-info small").innerHTML = esc(x && x.kap !== "vorab" ? (de() ? "Kapitel " : "Chapter ") + x.kap + " · " : "") + '<span class="vl-spr">' + esc(T.sprecher) + '</span><span class="vl-welle"><i></i><i></i><i></i></span>' +
      (schlafModus ? '<span class="vl-mond" title="' + esc(T.schlaf) + '">☾ ' + esc(schlafEnde ? Math.max(1, Math.ceil((schlafEnde - Date.now()) / 60000)) + " min" : (schlafModus === "kapitel" ? T.schlafKapitel : T.schlafAbschnitt)) + '</span>' : "");
    const H = HSP(), hk = leiste.querySelector(".vl-hs");
    hk.hidden = !H; if (H) { hk.setAttribute("aria-pressed", H.an() ? "true" : "false"); hk.setAttribute("aria-label", T.hsLang + " – " + (H.an() ? T.hsAn : T.hsAus)); hk.title = T.hoerspiel + ": " + (H.an() ? T.hsAn : T.hsAus); }
    if (!H) pultZu();
    const tk = leiste.querySelector(".vl-tempo"); tk.textContent = (tempo === 1 ? "1" : String(tempo).replace(".", de() ? "," : ".")) + "×"; tk.setAttribute("aria-label", T.tempo);
  }
  function medienInfo() {
    if (!("mediaSession" in navigator) || pos < 0) return;
    const x = liste[pos];
    try {
      navigator.mediaSession.metadata = new MediaMetadata({ title: abschnittVon(x.kap, x.i), artist: "Barradin – " + t().sprecher, album: "Imres Tales · Chronik", artwork: [{ src: "barradin.jpg", sizes: "512x512", type: "image/jpeg" }] });
      navigator.mediaSession.setActionHandler("play", umschalten); navigator.mediaSession.setActionHandler("pause", umschalten);
      navigator.mediaSession.setActionHandler("nexttrack", () => spielen(pos + 1, "sprung")); navigator.mediaSession.setActionHandler("previoustrack", () => spielen(Math.max(0, pos - 1), "sprung"));
    } catch (_) {}
    medienStatus();
  }
  function medienStatus() {
    if (!("mediaSession" in navigator)) return;
    try { navigator.mediaSession.playbackState = pos < 0 ? "none" : (spielt && audio && (!audio.paused || wartet)) ? "playing" : "paused"; } catch (_) {}
  }

  /* ---------- Knöpfe in der Chronik ---------- */
  function knoepfe() {
    document.querySelectorAll(".vl-knopf, .vl-ab, .vl-pod").forEach(e => e.remove());
    if (!manifest) return;
    const T = t(), K = manifest.kapitel || {};
    document.querySelectorAll("#chapters > .chapter").forEach(art => {
      const nr = art.id.replace(/^kapitel-/, ""); if (!(K[nr] || []).length) return;
      const b = document.createElement("button"); b.type = "button"; b.className = "vl-knopf"; b.dataset.vlKap = nr;
      b.innerHTML = OHR + "<span>" + esc(T.kapitel(nr)) + "<small>· Helmut</small></span>";
      const rb = art.querySelector(".rb-kapitel, .rb-knopf");
      const h = art.querySelector("h3");
      if (rb && rb.parentNode === art) rb.insertAdjacentElement("afterend", b); else if (h) h.insertAdjacentElement("afterend", b); else art.prepend(b);
      /* Podcast-Hinweis (nur beim ersten Kapitel, nur Deutsch) */
      if (de() && !document.querySelector(".vl-pod")) {
        const pod = document.createElement("a"); pod.className = "vl-pod"; pod.href = "podcast.html";
        pod.innerHTML = "🎙 Als Podcast abonnieren <small>· in jeder App</small>";
        b.insertAdjacentElement("afterend", pod);
      }
      const vorhanden = new Set((K[nr] || []).map(e => e.i));
      Array.from(art.querySelectorAll(".prose > .sub")).forEach(sub => {
        const i = Array.prototype.indexOf.call(sub.parentNode.children, sub); if (!vorhanden.has(i)) return;
        const a = document.createElement("button"); a.type = "button"; a.className = "vl-ab"; a.dataset.vlKap = nr; a.dataset.vlI = i;
        a.setAttribute("aria-label", T.abHier); a.title = T.abHier; a.innerHTML = PLAY;
        const h4 = sub.querySelector("h4"); (h4 || sub).insertAdjacentElement("afterend", a);
      });
    });
  }
  document.addEventListener("click", e => {
    const b = e.target.closest && e.target.closest("[data-vl-kap]"); if (!b) return;
    e.preventDefault(); listeBauen();
    const H = HSP(); if (H) H.ein();   /* im Klick: Audio darf jetzt starten (iOS/Android) */
    const kap = b.dataset.vlKap, i = b.dataset.vlI != null ? +b.dataset.vlI : -1;
    let start = liste.findIndex(x => x.kap === kap && (i < 0 || x.i >= i));
    if (start < 0) start = 0;
    letztesScrollen = 0; pos = -1; spielen(start, "start");
  });
  document.addEventListener("keydown", e => {
    if (pos < 0 || !leiste || !leiste.classList.contains("da")) return;
    if (e.target.closest && e.target.closest("input, textarea, select, [contenteditable]")) return;
    if (e.key === "k" || e.key === "K") { e.preventDefault(); umschalten(); }
    if ((e.key === "h" || e.key === "H") && HSP()) { e.preventDefault(); hsUmschalten(); }
  });

  /* ---------- Start und Sprachwechsel ---------- */
  function aufbauen() {
    if (!document.querySelector("#chapters > .chapter")) return;
    manifestLaden().then(() => { knoepfe(); if (pos >= 0) { listeBauen(); zeichnen(); } });
    const H = HSP(); if (H) (window.requestIdleCallback || (f => setTimeout(f, 1500)))(() => H.vorbereiten());
  }
  let uhr = 0;
  const beob = new MutationObserver(() => { clearTimeout(uhr); uhr = setTimeout(() => { if (!document.querySelector(".vl-knopf") || mSprache !== (de() ? "de" : "en")) { if (mSprache !== (de() ? "de" : "en")) stopp(true); aufbauen(); } }, 300); });
  const ch = document.getElementById("chapters"); if (ch) beob.observe(ch, { childList: true });
  new MutationObserver(() => { clearTimeout(uhr); uhr = setTimeout(aufbauen, 300); }).observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });
  window.addEventListener("resize", () => { if (pos >= 0) untenAbstand(); });
  aufbauen();
  window.ImresVorlesen = { spielen: (kap, i) => { listeBauen(); const H = HSP(); if (H) H.ein(); const s = liste.findIndex(x => x.kap === String(kap) && x.i >= (i || 0)); pos = -1; spielen(s < 0 ? 0 : s, "start"); }, stopp: () => stopp(true),
    zustand: () => ({ pos, laenge: liste.length, spielt: !!(audio && !audio.paused), wartet, absatz: pos >= 0 && liste[pos] ? liste[pos].kap + ":" + liste[pos].i : null, zeit: audio ? audio.currentTime : 0 }), audio: () => audio };
})();
