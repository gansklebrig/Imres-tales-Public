/* =====================================================================
   Imres Tales auf dem Zynthian (V5 / V5.1)
   ---------------------------------------------------------------------
   Wird von der Imres-Brücke an jede Seite angehängt. Aktiv nur im Kiosk
   (Adresse mit ?zyn=1 – danach für die ganze Sitzung).
   • Modi: 🌿 Klangwelten · 🎻 Bühne (Musik + Kulisse) · 🌲 nur Kulisse · 🎵 nur Musik
   • 20 Tasten, 4 Drehregler (mit Druck), RGB-LEDs, MIDI (Takt, Start/Stop, Noten, Regler)
   • Pfeile + SEL bedienen alles auf dem Bildschirm, BACK geht zurück
   ===================================================================== */
(() => {
  "use strict";
  const Q = new URLSearchParams(location.search);
  if (Q.has("zyn")) { try { sessionStorage.setItem("imres-zyn", "1"); } catch (_) {} }
  if (Q.has("hinter")) { try { sessionStorage.setItem("imres-zyn-hinter", "1"); } catch (_) {} }
  let aktiv = false; try { aktiv = sessionStorage.getItem("imres-zyn") === "1"; } catch (_) {}
  if (!aktiv && !Q.has("zyn")) return;
  if (window.__imresZyn) return; window.__imresZyn = true;
  const MESSER = [];
  try {
    const orig = AudioNode.prototype.connect, schon = new WeakMap();
    AudioNode.prototype.connect = function (ziel, ...rest) {
      const r = orig.call(this, ziel, ...rest);
      try {
        if (typeof AudioDestinationNode !== "undefined" && ziel instanceof AudioDestinationNode && !(typeof OfflineAudioContext !== "undefined" && this.context instanceof OfflineAudioContext)) {
          let a = schon.get(this.context);
          if (!a) { a = this.context.createAnalyser(); a.fftSize = 1024; a.smoothingTimeConstant = .55; schon.set(this.context, a); MESSER.push(a);
            const still = this.context.createGain(); still.gain.value = 0; orig.call(a, still); orig.call(still, this.context.destination); }
          orig.call(this, a);
        }
      } catch (_) {}
      return r;
    };
  } catch (_) {}

  const EN = (() => { try { return localStorage.getItem("imres-lang") === "en"; } catch (_) { return false; } })();
  const W = (de, en) => EN ? en : de;
  /* im Hintergrund (zusammen mit dem Zynthian): kein Bildschirm, keine Tasten – Steuerung über MIDI und Handy */
  const HINTER = (() => { try { return sessionStorage.getItem("imres-zyn-hinter") === "1"; } catch (_) { return false; } })();
  const SEITE = /ambient\.html$/.test(location.pathname) ? "welten" : "buehne";
  /* Start-Logo: TheAlmightyGoose aus dem Heldensturm – einmal nach dem Einschalten, Antippen überspringt.
     Die Brücke legt schon beim ersten Byte einen schwarzen Vorhang und das Logo über die Seite (vorhang_html),
     damit die Startseite der Homepage nicht kurz aufblitzt. Hier wird beides wieder abgenommen. */
  (() => {
    const h = document.documentElement;
    let geladen = document.readyState === "complete", logoAus = false;
    const vorhangAuf = () => { if (geladen && logoAus) setTimeout(() => h.classList.remove("imres-vorhang"), 350); };
    window.addEventListener("load", () => { geladen = true; vorhangAuf(); });
    let zeigenLogo = false;
    try { zeigenLogo = !HINTER && sessionStorage.getItem("imres-logo") !== "1"; } catch (_) {}
    if (HINTER) h.classList.remove("imres-vorhang");
    if (!zeigenLogo) { logoAus = true; vorhangAuf(); const e = document.getElementById("imres-logo"); if (e) e.remove(); return; }
    let el = document.getElementById("imres-logo");
    if (!el) {   /* Seite ohne Vorhang (älterer Weg): Logo selbst bauen */
      el = document.createElement("div"); el.id = "imres-logo";
      el.innerHTML = "<i></i><i></i><i></i><img src='/zyn/gans.png' alt=''><b>" + (SEITE === "welten" ? "Barden Beats · Klangwelten" : "Barden Beats") + "</b><small>TheAlmightyGoose</small>";
      (document.body || h).appendChild(el);
    }
    h.classList.add("imres-logo-frueh");
    /* das Pult baut <body> beim Start um – Logo bleibt obenauf */
    let fertig = false;
    const halten = setInterval(() => { if (fertig) return clearInterval(halten); if (!el.isConnected) (document.body || h).appendChild(el); }, 150);
    const weg = () => {
      if (fertig) return; fertig = true;
      try { sessionStorage.setItem("imres-logo", "1"); } catch (_) {}
      logoAus = true; vorhangAuf();
      const aus = () => { el.style.opacity = "0"; setTimeout(() => { el.remove(); h.classList.remove("imres-logo-frueh"); }, 550); };
      geladen ? setTimeout(aus, 300) : window.addEventListener("load", () => setTimeout(aus, 300), { once: true });
    };
    el.addEventListener("click", weg);
    el.addEventListener("touchstart", weg, { passive: true });
    setTimeout(weg, 3200);
  })();
  const lies = (k, d) => { try { const v = localStorage.getItem(k); return v == null ? d : v; } catch (_) { return d; } };
  const schreib = (k, v) => { try { localStorage.setItem(k, v); } catch (_) {} };

  /* ---------- Modi ---------- */
  const MODI = {
    welten: { sym: "🌿", name: W("Klangwelten", "Soundscapes"), sub: W("Reine Geräuschkulissen – ohne Musik", "Pure ambience – no music"), seite: "welten", farbe: "#3fbf6a" },
    buehne: { sym: "🎻", name: W("Bühne", "Stage"), sub: W("Musik und Kulisse zusammen", "Music and backdrop together"), seite: "buehne", farbe: "#e0a046" },
    klang: { sym: "🌲", name: W("Bühne: nur Kulisse", "Stage: backdrop only"), sub: W("Orte, Geräusche, Momente – keine Musik", "Places, sounds, moments – no music"), seite: "buehne", farbe: "#3fbf6a" },
    musik: { sym: "🎵", name: W("Bühne: nur Musik", "Stage: music only"), sub: W("Stimmungen und Band – keine Kulisse", "Moods and band – no backdrop"), seite: "buehne", farbe: "#d05a8a" }
  };
  const MODUS_REIHE = ["welten", "buehne", "klang", "musik"];
  let modus = lies("imres-zyn-modus", SEITE === "welten" ? "welten" : "buehne");
  if (!MODI[modus]) modus = SEITE === "welten" ? "welten" : "buehne";
  const ADRESSE = { welten: "/ambient.html?zyn=1", buehne: "/index.html?zyn=1#buehne" };
  /* gleiche Seite: wirklich neu laden (nur den Anker zu ändern lädt nichts) */
  const seiteLaden = ziel => { if (ziel === (/ambient\.html$/.test(location.pathname) ? "welten" : "buehne")) location.reload(); else location.replace(ADRESSE[ziel]); };
  if (MODI[modus].seite !== SEITE) { location.replace(ADRESSE[MODI[modus].seite]); return; }
  document.documentElement.classList.add("zyn", "zyn-" + SEITE, "zyn-m-" + modus); if (lies("imres-zyn-band", "0") === "1") document.documentElement.classList.add("zyn-band"); if (HINTER) document.documentElement.classList.add("zyn-hinter");

  /* ---------- Aussehen: nur das Pult, passend für 800 × 480 ---------- */
  const css = document.createElement("style");
  css.textContent = `
html.zyn { scroll-behavior: auto !important; }
html.zyn body { overscroll-behavior: none; }
html.zyn ::-webkit-scrollbar { width: 6px; height: 6px; } html.zyn ::-webkit-scrollbar-thumb { background: rgba(224,160,70,.35); border-radius: 3px; }
/* Bühne: Kopf, Fuß und alle anderen Seiten weg */
html.zyn-buehne body > header, html.zyn-buehne body > footer, html.zyn-buehne .handyleiste, html.zyn-buehne .hl-leiste, html.zyn-buehne #kerze, html.zyn-buehne .kerze,
html.zyn-buehne main > section:not(#buehne), html.zyn-buehne #buehne .part-head, html.zyn-buehne .bereich-zurueck, html.zyn-buehne .part-back, html.zyn-buehne .zurueck-uebersicht, html.zyn-buehne .lw-rundgang-knopf { display: none !important; }
html.zyn-buehne #buehne { display: block !important; padding: 0 !important; margin: 0 !important; min-height: 0 !important; }
html.zyn-buehne #buehne > .wrap { max-width: none !important; padding: 0 6px !important; margin: 0 !important; }
html.zyn-buehne #buehne .taverne, html.zyn-buehne #lautenwerk { margin: 0 !important; padding: 4px 0 !important; border: 0 !important; box-shadow: none !important; background: none !important; }
html.zyn-buehne main { padding: 0 !important; margin: 0 !important; }
html.zyn-buehne canvas.funken, html.zyn-buehne .funken { display: none !important; }
/* Bühnenbild mit der Band ausblenden → ganze Breite fürs Pult (wieder an: localStorage imres-zyn-band = 1) */
html.zyn-buehne:not(.zyn-band) #lautenwerk.lw-pultmodus { grid-template-columns: minmax(0, 1fr) !important; }
html.zyn-buehne:not(.zyn-band) #lautenwerk.lw-pultmodus > .lw-buehne { display: none !important; }
html.zyn-buehne:not(.zyn-band) #lautenwerk.lw-pultmodus > * { grid-column: 1 !important; }
/* nur Kulisse / nur Musik: den anderen Teil ausblenden */
html.zyn-m-klang [data-etab="musik"], html.zyn-m-klang .lw-emusik, html.zyn-m-klang .lw-play, html.zyn-m-klang .lw-kleinregler:has([data-feld="master"]),
html.zyn-m-klang .lw-neubesetzen { display: none !important; }
html.zyn-m-musik [data-etab="ort"], html.zyn-m-musik .lw-ehg, html.zyn-m-musik .lw-momente, html.zyn-m-musik .lw-esteuer-hg, html.zyn-m-musik .lw-ehgaus { display: none !important; }
html.zyn-welten .zyn-osd { bottom: 92px; }
/* Klangwelten: Kopf schmal */
html.zyn-welten .kopf .unter, html.zyn-welten .kopf h1, html.zyn-welten .zurueck, html.zyn-welten #funk, html.zyn-welten .sprung, html.zyn-welten #dank, html.zyn-welten #rundgang, html.zyn-welten #offline { display: none !important; }
html.zyn-welten .wrap { padding-top: 6px !important; }
html.zyn-welten .kopf { margin: 0 !important; padding: 0 !important; min-height: 0 !important; }
html.zyn-welten .welten { grid-template-columns: repeat(4, minmax(0, 1fr)) !important; gap: 6px !important; }
html.zyn-welten .welt { min-height: 0 !important; padding: .45rem .55rem !important; flex-direction: row !important; align-items: center; gap: .45rem !important; }
html.zyn-welten .welt .tx { display: none !important; }
html.zyn-welten .welt .sym { font-size: 1.2rem !important; }
html.zyn-welten .welt .nm { font-size: .98rem !important; margin: 0 !important; }
html.zyn-welten h2.abschnitt small { display: none !important; }
html.zyn-welten body { padding-bottom: 90px; }
/* im Hintergrund: nichts bewegen, spart Rechenzeit für den Ton */
html.zyn-hinter *, html.zyn-hinter *::before, html.zyn-hinter *::after { animation: none !important; transition: none !important; }
html.zyn-hinter .lw-buehne, html.zyn-hinter .lw-karte, html.zyn-hinter svg { visibility: hidden !important; }
.zyn-menue .zyn-opt { max-height: 74vh; overflow: auto; padding-right: 4px; }
.zyn-menue .zyn-opt button { padding: 8px 12px; font-size: 15px; }
.zyn-menue .zyn-opt button b { color: #f2cf6a; font-weight: 700; }
.zyn-leiste .rec { background: #8a1010; border-color: #ff5050; animation: zynblink 1s steps(2) infinite; }
@keyframes zynblink { 50% { opacity: .45; } }
/* Fokus der Pfeiltasten */
.zyn-fokus { outline: 3px solid #f4c45a !important; outline-offset: 2px !important; box-shadow: 0 0 0 6px rgba(244,196,90,.25) !important; border-radius: 6px; }
/* Anzeige der Drehregler und Tasten */
.zyn-osd { position: fixed; left: 50%; bottom: 14px; transform: translateX(-50%); z-index: 2147483000; min-width: 260px; max-width: 92vw; padding: 10px 16px; border-radius: 12px;
  background: rgba(18,14,24,.94); border: 1px solid rgba(224,160,70,.6); color: #ebe2cc; font: 600 17px/1.3 system-ui, sans-serif; text-align: center; pointer-events: none;
  opacity: 0; transition: opacity .18s; box-shadow: 0 10px 30px rgba(0,0,0,.6); }
.zyn-osd.an { opacity: 1; }
.zyn-osd i { display: block; height: 8px; margin-top: 7px; border-radius: 4px; background: rgba(235,226,204,.15); overflow: hidden; }
.zyn-osd i b { display: block; height: 100%; background: linear-gradient(90deg, #a8701e, #f2cf6a); }
.zyn-osd small { display: block; font-weight: 400; font-size: 13px; color: #a89f8f; margin-top: 3px; }
/* Leiste oben rechts: Modus, Reglerbank, Takt */
.zyn-leiste { position: fixed; right: 6px; top: 6px; z-index: 2147482000; display: flex; gap: 6px; align-items: center; font: 600 12px/1 system-ui, sans-serif; pointer-events: none; }
.zyn-leiste span { padding: 4px 8px; border-radius: 8px; background: rgba(18,14,24,.88); border: 1px solid rgba(224,160,70,.4); color: #ebe2cc; }
.zyn-leiste .bank { cursor: pointer; pointer-events: auto; }
/* Menüs (Modus, System, Belegung) */
.zyn-menue { position: fixed; inset: 0; z-index: 2147483100; background: rgba(8,6,12,.9); display: flex; flex-direction: column; justify-content: center; align-items: center; gap: 12px; padding: 16px;
  font: 16px/1.3 system-ui, sans-serif; color: #ebe2cc; }
.zyn-menue h3 { margin: 0 0 4px; font-size: 19px; color: #e0a046; letter-spacing: .04em; }
.zyn-menue .reihe { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; width: min(760px, 100%); }
.zyn-menue .reihe.drei { grid-template-columns: repeat(3, minmax(0, 1fr)); }
.zyn-menue button { display: flex; flex-direction: column; align-items: flex-start; gap: 4px; padding: 12px 14px; border-radius: 12px; border: 1px solid rgba(224,160,70,.35); background: rgba(235,226,204,.05);
  color: inherit; font: 600 17px/1.2 system-ui, sans-serif; text-align: left; cursor: pointer; }
.zyn-menue button small { font-weight: 400; font-size: 13px; color: #a89f8f; }
.zyn-menue button.an { border-color: var(--f, #e0a046); background: rgba(224,160,70,.14); }
.zyn-menue button .kbd { font: 700 11px/1 system-ui; color: #18141e; background: #e0a046; border-radius: 4px; padding: 2px 5px; margin-right: 6px; }
.zyn-menue .hinweis { font-size: 13px; color: #a89f8f; text-align: center; max-width: 720px; }
.zyn-hilfe { width: min(760px, 100%); display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 3px 18px; font-size: 13.5px; max-height: 66vh; overflow: auto; }
.zyn-hilfe div { display: flex; gap: 8px; } .zyn-hilfe b { min-width: 78px; color: #f2cf6a; }
`;
  document.head.appendChild(css);

  /* ---------- Hilfen ---------- */
  const $ = (s, r) => (r || document).querySelector(s), $$ = (s, r) => [...(r || document).querySelectorAll(s)];
  const sichtbar = el => !!el && el.getClientRects().length > 0 && getComputedStyle(el).visibility !== "hidden";
  const klick = el => { if (!el) return false; try { el.click(); } catch (_) { return false; } return true; };
  /* einen Knopf des Pults auslösen, auch wenn er gerade nicht im Bild ist: ein kurzer Stellvertreter im Pult */
  /* Ort wählen: ein einzelner Druck wirkt sofort; wer schnell weiterschaltet, bekommt erst den Ort, bei dem er stehen bleibt */
  let ortLetzt = 0, ortT = 0;
  function ortWaehlen(k) {
    const j = performance.now(), schnell = j - ortLetzt < 900; ortLetzt = j; clearTimeout(ortT);
    if (!schnell) { pultKlick("data-kulisse", k); return; }
    ortT = setTimeout(() => pultKlick("data-kulisse", k), 350);
  }
  function pultKlick(attr, wert) {
    const root = $("#lautenwerk"); if (!root) return false;
    const echt = $$("[" + attr + '="' + wert + '"]', root).find(sichtbar) || $("[" + attr + '="' + wert + '"]', root);
    if (echt) return klick(echt);
    const b = document.createElement("button"); b.type = "button"; b.setAttribute(attr, wert); b.hidden = true; root.appendChild(b); b.click(); b.remove(); return true;
  }
  function pultRegler(attr, wert, v) {
    const root = $("#lautenwerk"); if (!root) return;
    let el = $$("[" + attr + '="' + wert + '"]', root).find(x => x.tagName === "INPUT");
    let temp = false;
    if (!el) { el = document.createElement("input"); el.type = "range"; el.setAttribute(attr, wert); el.hidden = true; root.appendChild(el); temp = true; }
    el.value = String(v); el.dispatchEvent(new Event("input", { bubbles: true })); el.dispatchEvent(new Event("change", { bubbles: true }));
    if (temp) el.remove();
  }
  const pz = () => (window.ImresPult && window.ImresPult.zustand) || null;

  /* ---------- Anzeige ---------- */
  const osd = document.createElement("div"); osd.className = "zyn-osd"; document.body.appendChild(osd);
  let osdT = 0;
  function zeige(text, anteil, unter) {
    osd.innerHTML = '<div>' + text + "</div>" + (anteil != null ? '<i><b style="width:' + Math.round(Math.max(0, Math.min(1, anteil)) * 100) + '%"></b></i>' : "") + (unter ? "<small>" + unter + "</small>" : "");
    osd.classList.add("an"); clearTimeout(osdT); osdT = setTimeout(() => osd.classList.remove("an"), 1400);
  }
  const leiste = document.createElement("div"); leiste.className = "zyn-leiste"; document.body.appendChild(leiste);
  let bank = 0, alt = false, tempoMidi = null;
  function leisteZeichnen() {
    leiste.innerHTML = "<span>" + MODI[modus].sym + " " + MODI[modus].name + "</span>" + '<span class="bank" title="MIXER">⟲ ' + (bank ? "B" : "A") + "</span>" +
      (OPT.takt === "master" ? "<span>⏱ Master" + (pz() ? " " + Math.round(pz().tempoJetzt || pz().tempo) : "") + "</span>" : tempoMidi || OPT.takt === "slave" ? "<span>⏱ " + (tempoMidi ? Math.round(tempoMidi) : "–") + (OPT.takt === "slave" ? " ⇄" : "") + "</span>" : "") +
      (OPT.tonartAn ? "<span>🎼 " + NOTEN[OPT.grund] + "</span>" : "") + (mik && !mik.laedt ? "<span>🎤</span>" : "") + (aufnahmeAn ? '<span class="rec">⏺ REC</span>' : "") + (alt ? "<span>ALT</span>" : "");
  }
  leiste.addEventListener("click", e => { if (e.target.closest(".bank")) bankWechsel(); });

  /* ---------- Drehregler: zwei Bänke je Seite ---------- */
  const proz = (v, lo, hi) => (v - lo) / (hi - lo);
  const DREH_T = {};
  function drehFaktor(key, d, fein) {
    const jetzt = performance.now(), l = DREH_T[key] || { t: 0, n: 0, d: 0 };
    l.n = (jetzt - l.t < 120 && Math.sign(d) === Math.sign(l.d)) ? Math.min(l.n + 1, 40) : 0; l.t = jetzt; l.d = d; DREH_T[key] = l;
    if (!fein || !d) return 1;
    let f = l.n < 3 ? 1 : l.n < 7 ? 2 : l.n < 12 ? 4 : l.n < 20 ? 6 : 8;
    if (d < 0 && f > 1) f = Math.round(f * 1.5);
    return f;
  }
  const rasten = (v, def) => { const x = def.lo + Math.round((v - def.lo) / def.schritt) * def.schritt; return Math.max(def.lo, Math.min(def.hi, Math.round(x * 1000) / 1000)); };
  function stellRegler(def, d) {
    const f = drehFaktor(def.name, d, def.schritt && (def.hi - def.lo) / def.schritt >= 40);
    const v0 = def.lies(), v = d ? rasten(v0 + d * def.schritt * f, def) : Math.max(def.lo, Math.min(def.hi, v0));
    if (v !== v0) def.setz(v);
    zeige(def.name + " · " + (def.text ? def.text(v) : Math.round(proz(v, def.lo, def.hi) * 100) + " %"), proz(v, def.lo, def.hi), def.unter);
  }
  const zahl = (x, d) => (typeof x === "number" && isFinite(x) ? x : d);
  /* Bühne */
  const B_REGLER = [[
    { name: W("🎵 Musik", "🎵 Music"), lo: 0, hi: 10, schritt: 0.2, lies: () => zahl(pz() && pz().master, 8), setz: v => pultRegler("data-feld", "master", v) },
    { name: W("🌲 Hintergrund", "🌲 Backdrop"), lo: 0, hi: 10, schritt: 0.2, lies: () => zahl(pz() && pz().kulisseVol, 5), setz: v => pultRegler("data-feld", "kulvol", v) },
    { name: W("🔥 Wie viel los", "🔥 How busy"), lo: 0, hi: 10, schritt: 1, lies: () => zahl(pz() && pz().intensitaet, 5), setz: v => pultRegler("data-feld", "intensitaet", v) },
    { name: W("😨 Spannung", "😨 Tension"), lo: 0, hi: 100, schritt: 5, lies: () => Math.round(zahl(pz() && pz().spannung, 0) * 100), setz: v => pultRegler("data-leben", "spannung", v) }
  ], [
    { name: W("⏱ Tempo", "⏱ Tempo"), lo: 50, hi: 180, schritt: 2, lies: () => zahl(pz() && pz().tempo, 100), setz: v => { if (window.ImresPult && window.ImresPult.tempo) window.ImresPult.tempo(v); else pultRegler("data-feld", "tempo", v); }, text: v => v + " BPM" },
    { name: W("🏛 Hall", "🏛 Reverb"), lo: 0, hi: 10, schritt: 1, lies: () => zahl(pz() && pz().hall, 5), setz: v => pultRegler("data-feld", "hall", v) },
    { name: W("💥 Effekte", "💥 Effects"), lo: 0, hi: 10, schritt: 0.2, lies: () => zahl(pz() && pz().fxVol, 7), setz: v => pultRegler("data-feld", "fxvol", v) },
    { name: W("🎐 Echos Hall", "🎐 Echo reverb"), lo: 0, hi: 10, schritt: 1, lies: () => zahl(pz() && pz().echoHall, 5), setz: v => pultRegler("data-feld", "echohall", v) }
  ]];
  /* Klangwelten */
  const wRegler = (sel, name, lo, hi, schritt) => ({ name, lo, hi, schritt,
    lies: () => { const el = $(sel); return el ? +el.value : lo; },
    setz: v => { const el = $(sel); if (!el) return; el.value = String(v); el.dispatchEvent(new Event("input", { bubbles: true })); el.dispatchEvent(new Event("change", { bubbles: true })); } });
  const W_REGLER = [[
    wRegler("#gesamt", W("🔊 Lautstärke", "🔊 Volume"), 0, 100, 2),
    wRegler('[data-regler="spannung"]', W("😨 Spannung", "😨 Tension"), 0, 100, 5),
    wRegler("#ger-laut", W("🎭 Geräusche", "🎭 Sounds"), 0, 150, 2),
    wRegler("#sz-laut", W("⏳ Szenen", "⏳ Scenes"), 0, 150, 2)
  ], [
    wRegler('[data-regler="leben"]', W("🐾 Lebendigkeit", "🐾 Liveliness"), 0, 200, 5),
    wRegler('[data-regler="raum"], [data-regler="ehall"]', W("🏛 Raumhall", "🏛 Room echo"), 0, 100, 5),
    wRegler('[data-regler="wlaut"]', W("🌦 Wetter", "🌦 Weather"), 0, 150, 2),
    wRegler('[data-regler="b0"]', W("🎚 Grundschicht", "🎚 Base layer"), 0, 150, 2)
  ]];
  /* die Schieberegler im Mischpult der Klangwelten gibt es erst, wenn es offen war – einmal kurz öffnen */
  function weltenMischBereit() {
    if (SEITE !== "welten" || $("[data-regler]")) return;
    const k = $("#misch-knopf"), m = $("#misch"); if (!k || !m) return;
    const war = !m.hidden; klick(k); if (!war) setTimeout(() => { if (!m.hidden) klick(k); }, 60);
  }
  const REGLER = () => PULT ? zpRegler() : (SEITE === "welten" ? W_REGLER : B_REGLER)[bank] || B_REGLER[0];
  function bankWechsel() { bank = bank ? 0 : 1; leisteZeichnen(); weltenMischBereit(); zeige("⟲ " + W("Reglerbank ", "Knob bank ") + (bank ? "B" : "A"), null, REGLER().map(r => r.name).join(" · ")); ledsMelden(); }

  /* ---------- Plätze F1–F4: was dort liegt ---------- */
  const sichtbare = (sel, root) => $$(sel, root).filter(sichtbar);
  function platz(art, i) {
    if (art === "stimmung") { const l = sichtbare("[data-vorlage]", $("#lautenwerk")).map(e => e.dataset.vorlage).filter((x, j, a) => a.indexOf(x) === j && x !== "leer" && x !== "zufall"); return l[i] || (pz() && pz().stimmungen && pz().stimmungen[i]); }
    if (art === "kulisse") { const l = sichtbare("[data-kulisse]", $("#lautenwerk")).map(e => e.dataset.kulisse).filter((x, j, a) => a.indexOf(x) === j && x !== "keine"); return l[i] || (pz() && pz().kulissen && pz().kulissen.filter(k => k !== "keine")[i]); }
    if (art === "moment") { const l = sichtbare("[data-moment]", $("#lautenwerk")); return l[i] || null; }
    if (art === "welt") return sichtbare("[data-welt]")[i] || $$("[data-welt]")[i] || null;
    if (art === "einschlag") return sichtbare("[data-aus]")[i] || $$("[data-aus]")[i] || null;
    return null;
  }
  const kurzName = el => (el && (el.getAttribute("title") || el.innerText || el.textContent || "").trim().replace(/\s+/g, " ").slice(0, 40)) || "";
  function waehle(art, i) {
    if (art === "stimmung") { const k = platz(art, i); if (k) { pultKlick("data-vorlage", k); zeige("🎵 " + stimmName(k)); } return; }
    if (art === "kulisse") { const k = platz(art, i); if (k) { ortWaehlen(k); zeige("🌲 " + kulName(k)); } return; }
    const el = platz(art, i); if (el) { klick(el); zeige((art === "welt" ? "🌿 " : art === "einschlag" ? "⚡ " : "✨ ") + kurzName(el)); }
  }
  const stimmName = k => { const el = $('[data-vorlage="' + k + '"]'); return el ? kurzName(el) : k; };
  const kulName = k => { const el = $('[data-kulisse="' + k + '"]'); return el ? kurzName(el) : k; };
  function weiter(art, schritt) {
    const z = pz();
    if (art === "stimmung") { const l = (z && z.stimmungen) || []; if (!l.length) return; const i = l.indexOf(z.stimmung); const k = l[(i + schritt + l.length) % l.length]; pultKlick("data-vorlage", k); zeige("🎵 " + stimmName(k), null, (l.indexOf(k) + 1) + " / " + l.length); return; }
    if (art === "kulisse") { const l = ((z && z.kulissen) || []).filter(k => k !== "keine"); if (!l.length) return; const jetzt = z.kulisse === "waldnacht" ? "wald" : z.kulisse; const i = l.indexOf(jetzt); const k = l[(i + schritt + l.length) % l.length]; pultKlick("data-kulisse", k); zeige("🌲 " + kulName(k), null, (l.indexOf(k) + 1) + " / " + l.length); return; }
    if (art === "welt") { const l = $$("[data-welt]"); if (!l.length) return; const i = l.findIndex(x => x.classList.contains("an")); const el = l[(i + schritt + l.length) % l.length]; klick(el); zeige("🌿 " + kurzName(el)); }
  }

  /* ---------- Pfeiltasten: Fokus über alles, was man antippen kann ---------- */
  let fokus = null;
  const BEDIENBAR = "button, [role=button], input[type=range], select, a[href], summary, .welt, [data-vorlage], [data-kulisse], [data-zusatz], [data-sfx]";
  function kandidaten() {
    const offen = $(".zyn-menue"); const r = offen || document;
    return $$(BEDIENBAR, r).filter(el => sichtbar(el) && !el.disabled && !el.closest(".zyn-osd, .zyn-leiste") && (offen || !el.closest(".zyn-menue"))).filter(el => { const b = el.getBoundingClientRect(); return b.width > 4 && b.height > 4; });
  }
  function fokusSetzen(el) {
    if (fokus) fokus.classList.remove("zyn-fokus");
    fokus = el; if (!el) return;
    el.classList.add("zyn-fokus");
    try { el.scrollIntoView({ block: "nearest", inline: "nearest" }); } catch (_) {}
    const n = kurzName(el); if (n) zeige("➤ " + n);
  }
  function bewegen(richtung) {
    const l = kandidaten(); if (!l.length) return;
    if (!fokus || !l.includes(fokus)) { const imBild = l.find(el => { const b = el.getBoundingClientRect(); return b.top >= 0 && b.bottom <= innerHeight; }); fokusSetzen(imBild || l[0]); return; }
    const a = fokus.getBoundingClientRect(), ax = a.left + a.width / 2, ay = a.top + a.height / 2;
    let best = null, bw = Infinity;
    l.forEach(el => {
      if (el === fokus) return;
      const b = el.getBoundingClientRect(), bx = b.left + b.width / 2, by = b.top + b.height / 2, dx = bx - ax, dy = by - ay;
      const haupt = richtung === "LEFT" ? -dx : richtung === "RIGHT" ? dx : richtung === "UP" ? -dy : dy, quer = richtung === "LEFT" || richtung === "RIGHT" ? Math.abs(dy) : Math.abs(dx);
      if (haupt <= 2) return;
      const w = haupt + quer * 2.2;
      if (w < bw) { bw = w; best = el; }
    });
    if (best) fokusSetzen(best);
  }
  function auswaehlen() {
    if (!fokus || !document.contains(fokus)) { bewegen("DOWN"); return; }
    if (fokus.tagName === "INPUT" && fokus.type === "range") { zeige("⇆ " + W("Mit Drehregler 4 einstellen", "Adjust with knob 4")); fokusRegler = fokus; return; }
    if (fokus.tagName === "SELECT") { const s = fokus; s.selectedIndex = (s.selectedIndex + 1) % s.options.length; s.dispatchEvent(new Event("change", { bubbles: true })); zeige(s.options[s.selectedIndex].text); return; }
    klick(fokus);
  }
  let fokusRegler = null;
  function zurueck() {
    const m = $(".zyn-menue"); if (m) { menueZu(); return; }
    const d = $("dialog[open]"); if (d) { try { d.close(); } catch (_) {} return; }
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    if (fokusRegler) { fokusRegler = null; return; }
    if (fokus) { fokus.classList.remove("zyn-fokus"); fokus = null; }
    scrollTo({ top: 0 });
  }

  /* ---------- Menüs ---------- */
  function menueZu() { $$(".zyn-menue").forEach(m => m.remove()); ledsMelden(); }
  let menueAkt = {};
  /* Wert der markierten Zeile ändern (◀ ▶ oder Regler 4) – true, wenn die Zeile einen einstellbaren Wert hat */
  function menueStufe(st) { const f = fokus && fokus.dataset && fokus.dataset.zm && menueAkt[fokus.dataset.zm + ":stufe"]; if (!f) return false; f(st); return true; }
  function menue(html, aktionen) {
    menueZu(); menueAkt = aktionen || {};
    const m = document.createElement("div"); m.className = "zyn-menue"; m.innerHTML = html; document.body.appendChild(m);
    m.addEventListener("click", e => { const b = e.target.closest("[data-zm]"); if (!b) { if (e.target === m) menueZu(); return; }
      /* angetippt: Auswahl springt dorthin – Werte mit ◀ ▶ (oder Regler) ändern */
      if (b.tagName === "BUTTON") fokusSetzen(b);
      const f = aktionen[b.dataset.zm]; if (f) { f(); return; }
      if (aktionen[b.dataset.zm + ":stufe"] || (typeof audioAktionen !== "undefined" && audioAktionen && audioAktionen[b.dataset.zm + ":stufe"])) zeige("◀ ▶ " + W("zum Ändern", "to change"), null, (b.querySelector("span") || b).textContent.trim().slice(0, 60)); });
    const erster = m.querySelector("button.an") || m.querySelector("button"); fokusSetzen(erster);
    ledsMelden();
    return m;
  }
  function modusMenue() {
    const knopf = (k, i) => '<button type="button" data-zm="' + k + '" class="' + (k === modus ? "an" : "") + '" style="--f:' + MODI[k].farbe + '"><span><span class="kbd">F' + (i + 1) + "</span>" + MODI[k].sym + " " + MODI[k].name + "</span><small>" + MODI[k].sub + "</small></button>";
    const a = {}; MODUS_REIHE.forEach(k => { a[k] = () => modusSetzen(k); });
    a.system = systemMenue; a.hilfe = hilfe; a.optionen = () => optionenMenue(); a.pult = () => { schreib("imres-zyn-pult", "1"); schreib("imres-lw-modus", "einfach"); schreib("imres-zyn-modus", "buehne"); seiteLaden("buehne"); };
    menue("<h3>" + W("Was soll klingen?", "What should play?") + '</h3><div class="reihe">' + MODUS_REIHE.map(knopf).join("") + "</div>" +
      '<div class="reihe drei"><button type="button" data-zm="optionen">🎚 ' + W("Optionen", "Options") + "<small>" + W("MIDI-Takt, Tonart, Mikrofon …", "MIDI clock, key, mic …") + '</small></button><button type="button" data-zm="hilfe">❔ ' + W("Tastenbelegung", "Button map") + '</button><button type="button" data-zm="system">⚙ ' + W("System", "System") + "<small>" + W("Zynthian, Neustart, Aus", "Zynthian, restart, off") + '</small></button><button type="button" data-zm="pult">🎻 ' + W("Zurück zum Pult", "Back to console") + '</button><button type="button" data-zm="zu">✕ ' + W("Schließen", "Close") + "</button></div>" +
      '<p class="hinweis">' + W("F1–F4 wählen direkt · Pfeile + SEL · BACK schließt · MENU lang: System", "F1–F4 pick directly · arrows + SEL · BACK closes · hold MENU: system") + "</p>", Object.assign(a, { zu: menueZu }));
    menueArt = "modus";
  }
  let menueArt = null;
  /* Fortschritt des Updates: eigenes Feld mit Balken, Schritt und Zeit – bleibt stehen, bis Imres neu startet oder eine Meldung kommt */
  function updateVerfolgen() {
    $$(".zyn-update").forEach(x => x.remove());
    if (!document.getElementById("zyn-update-css")) { const st = document.createElement("style"); st.id = "zyn-update-css"; st.textContent = '.zyn-update { position: fixed; left: 50%; top: 50%; transform: translate(-50%, -50%); z-index: 2147483000; width: 520px; max-width: 92vw; padding: 18px 22px 14px; border-radius: 16px; background: #1b1422; border: 2px solid #ffc830; box-shadow: 0 10px 40px #000c; color: #f4e6cc; font-family: system-ui, sans-serif; text-align: center; visibility: visible !important; } .zyn-update * { visibility: visible !important; }\n.zyn-update h3 { margin: 0 0 12px; font-size: 20px; color: #ffc830; }\n.zu-balken { height: 18px; border-radius: 9px; background: #2c2436; overflow: hidden; }\n.zu-balken b { display: block; height: 100%; width: 2%; border-radius: 9px; background: linear-gradient(90deg, #c08020, #ffc830, #fff0c0, #ffc830); background-size: 200% 100%; animation: zuLauf 1.2s linear infinite; transition: width .2s; }\n@keyframes zuLauf { from { background-position: 200% 0; } to { background-position: 0 0; } }\n.zu-text { margin: 12px 0 2px; font-size: 16px; } .zu-klein { margin: 0; font-size: 12px; opacity: .6; }\n.zyn-update.fehler { border-color: #ff6a3a; } .zyn-update.fehler .zu-balken b { background: #ff6a3a; animation: none; }'; document.head.appendChild(st); }
    const el = document.createElement("div"); el.className = "zyn-update";
    el.innerHTML = '<h3>⬇ ' + W("Barden Beats wird aktualisiert", "Updating Barden Beats") + '</h3><div class="zu-balken"><b></b></div><p class="zu-text">' + W("Starte …", "Starting …") + '</p><p class="zu-klein"></p>';
    document.body.appendChild(el);
    const balken = el.querySelector("b"), text = el.querySelector(".zu-text"), klein = el.querySelector(".zu-klein"), t0 = performance.now();
    let weg = 0, fertig = false, ziel = 2, jetzt = 2;
    const schliessen = (ms) => setTimeout(() => el.remove(), ms);
    const zeichnen = () => { jetzt += (ziel - jetzt) * .25; balken.style.width = Math.max(2, Math.min(100, jetzt)) + "%"; klein.textContent = Math.round((performance.now() - t0) / 1000) + " s"; };
    const anim = setInterval(zeichnen, 120);
    const t = setInterval(() => {
      if (fertig) return;
      if (performance.now() - t0 > 240000) { clearInterval(t); clearInterval(anim); text.textContent = "⚠ " + W("Das Update dauert ungewöhnlich lange – Internet prüfen und später noch einmal versuchen.", "The update takes unusually long."); schliessen(15000); return; }
      fetch("/zyn/update", { cache: "no-store" }).then(r => r.json()).then(j => {
        weg = 0;
        if (j.ende) { fertig = true; clearInterval(t); ziel = /neuesten|wiederhergestellt/.test(j.ende) ? 100 : jetzt; text.textContent = (/neuesten|wiederhergestellt/.test(j.ende) ? "✅ " : "⚠ ") + j.ende; el.classList.toggle("fehler", !/neuesten|wiederhergestellt/.test(j.ende)); setTimeout(() => clearInterval(anim), 1500); schliessen(9000); return; }
        if (j.schritt) { ziel = Math.max(ziel, j.prozent || 0, 3); text.textContent = W("Schritt ", "Step ") + j.schritt + "/" + j.von + ": " + j.titel; }
        if (j.schritt === j.von) text.textContent = "🔄 " + W("Fast fertig – die Bühne startet gleich neu …", "Almost done – the stage restarts …");
      }).catch(() => { /* Brücke startet neu: das gehört am Ende dazu */ if (++weg > 1) { ziel = Math.max(ziel, 92); text.textContent = "🔄 " + W("Die Bühne startet neu …", "The stage is restarting …"); } });
    }, 1000);
  }
  function systemMenue() {
    const post = aktion => fetch("/zyn/system", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ aktion }) }).catch(() => {});
    menue("<h3>⚙ " + W("System", "System") + '</h3><div class="reihe">' +
      '<button type="button" data-zm="zyn">🎛 ' + W("Zurück zum Zynthian", "Back to Zynthian") + "<small>" + W("Die normale Zynthian-Oberfläche startet", "Starts the normal Zynthian interface") + "</small></button>" +
      '<button type="button" data-zm="upd">⬇ ' + W("Bühne aktualisieren", "Update the stage") + "<small>" + W("holt die neueste Version (Internet nötig) und startet neu", "fetches the latest version (needs internet) and restarts") + "</small></button>" +
      '<button type="button" data-zm="hinter">🎛+🎻 ' + W("Zusammen mit Zynthian", "Together with Zynthian") + "<small>" + W("Zynthian-Oberfläche, Barden Beats spielt im Hintergrund weiter (Handy/MIDI)", "Zynthian UI, the stage keeps playing in the background") + "</small></button>" +
      '<button type="button" data-zm="auf">' + (aufnahmeAn ? "⏹ " + W("Aufnahme beenden", "Stop recording") : "⏺ " + W("Aufnahme starten", "Start recording")) + "<small>" + W("alles, was rauskommt – im Zynthian-Ordner „capture“", "everything you hear – Zynthian capture folder") + "</small></button>" +
      '<button type="button" data-zm="start">🔌 ' + W("Beim Einschalten: ", "At power-on: ") + "<b>" + W("Barden Beats", "Barden Beats") + "</b><small>" + W("so startet das Gerät ab jetzt", "the device starts like this from now on") + "</small></button>" +
      '<button type="button" data-zm="startz">🔌 ' + W("Beim Einschalten: ", "At power-on: ") + "<b>Zynthian</b></button>" +
      '<button type="button" data-zm="neu">🔄 ' + W("Seite neu laden", "Reload page") + "</button>" +
      '<button type="button" data-zm="diag">🩺 ' + W("Diagnose anzeigen", "Show diagnostics") + "<small>" + W("♫-Knopf, Touch, Ton, Update – zum Abfotografieren", "♫ button, touch, sound, update – to take a photo") + "</small></button>" +
      '<button type="button" data-zm="zurueck">↺ ' + W("Vorige Version zurückholen", "Restore previous version") + "<small>" + W("falls nach einem Update etwas nicht stimmt (die letzten 5 werden aufgehoben)", "if an update broke something (last 5 are kept)") + "</small></button>" +
      '<button type="button" data-zm="neustart">↻ ' + W("Zynthian neu starten", "Restart Zynthian") + "</button>" +
      '<button type="button" data-zm="aus">⏻ ' + W("Ausschalten", "Shut down") + "<small>" + W("Danach den Strom trennen", "Then unplug power") + "</small></button>" +
      '<button type="button" data-zm="zu">✕ ' + W("Schließen", "Close") + "</button></div>", {
      zyn: () => { zeige("🎛 " + W("Zynthian startet …", "Zynthian is starting …")); post("zynthian"); },
      upd: () => { menueZu(); zeige("⬇ " + W("Barden Beats wird aktualisiert …", "Updating Barden Beats …"), null, W("dauert bis zu einer Minute, danach startet die Bühne neu", "takes up to a minute, then the stage restarts")); post("aktualisieren"); updateVerfolgen(); },
      diag: () => { menue('<h3>🩺 Diagnose</h3><pre style="font-size:11px;line-height:1.25;white-space:pre-wrap;max-height:330px;overflow:auto;margin:0">⏳</pre><div class="reihe"><button type="button" data-zm="zu">✕ ' + W("Schließen", "Close") + "</button></div>", { zu: menueZu });
        fetch("/zyn/diagnose").then(r => r.json()).then(j => { const pre = $(".zyn-menue pre"); if (pre) pre.textContent = j.text || "–"; }).catch(() => { const pre = $(".zyn-menue pre"); if (pre) pre.textContent = W("Brücke nicht erreichbar", "bridge unreachable"); }); },
      zurueck: () => { menueZu(); zeige("↺ " + W("Vorige Version wird geholt …", "Restoring previous version …")); post("zurueck"); updateVerfolgen(); },
      hinter: () => { zeige("🎛 " + W("Zynthian startet, die Bühne läuft weiter …", "Zynthian starts, the stage keeps playing …")); post("hintergrund"); },
      auf: () => { menueZu(); aufnahme(); },
      start: () => { post("start-imres"); zeige("🔌 " + W("Startet künftig mit Barden Beats", "Will start with Barden Beats")); menueZu(); },
      startz: () => { post("start-zynthian"); zeige("🔌 " + W("Startet künftig mit dem Zynthian", "Will start with Zynthian")); menueZu(); },
      neu: () => location.reload(), neustart: () => post("neustart"), aus: () => { zeige("⏻ " + W("Fährt herunter …", "Shutting down …")); post("aus"); }, zu: menueZu });
    menueArt = "system";
  }
  function hilfe() {
    const z = (k, t) => "<div><b>" + k + "</b><span>" + t + "</span></div>";
    const b = SEITE === "welten" ? [
      ["F1–F4", W("Klangwelt 1–4", "Soundscape 1–4")], ["ALT + F1–F4", W("Einschlag 1–4", "Impact 1–4")], ["ZS3 / CTRL", W("nächste / vorige Klangwelt", "next / previous soundscape")],
      ["PLAY", W("Abspielen / Pause", "Play / pause")], ["STOP", W("Alles aus", "Everything off")], ["PAD", W("zufälliges Geräusch", "random sound")], ["REC", W("zufällige Szene", "random scene")], ["TEMPO", W("Ruhig ↔ Episch", "Calm ↔ Epic")]
    ] : [
      ["F1–F4", modus === "klang" ? W("Ort 1–4", "Place 1–4") : W("Stimmung 1–4", "Mood 1–4")], ["ALT + F1–F4", modus === "klang" ? W("Moment 1–4", "Moment 1–4") : modus === "musik" ? W("Stimmung 5–8", "Mood 5–8") : W("Ort 1–4", "Place 1–4")],
      ["ZS3", W("nächste Stimmung (ALT: vorige)", "next mood (ALT: previous)")], ["CTRL", W("nächster Ort (ALT: voriger)", "next place (ALT: previous)")],
      ["PLAY", modus === "klang" ? W("Kulisse an / aus", "Backdrop on / off") : W("Musik ▶ / ■", "Music ▶ / ■")], ["STOP", W("Alles anhalten", "Stop everything")],
      ["PAD", W("Etwas passiert (ALT: 🎙 Sprechen)", "Something happens (ALT: 🎙 speak)")], ["REC", W("Stille (alle halten den Atem an)", "Silence")], ["TEMPO", W("🎲 Neu besetzen", "🎲 Re-cast")]
    ];
    const allg = [["MENU", W("Modus wählen (lang: System)", "Choose mode (hold: system)")], ["MIXER", W("Reglerbank A ↔ B", "Knob bank A ↔ B")], ["ALT", W("gedrückt halten = zweite Belegung", "hold = second layer")],
      ["◀ ▲ ▼ ▶", W("Fokus über den Bildschirm", "Move focus on screen")], ["SEL", W("Antippen", "Tap")], ["BACK", W("Zurück / schließen", "Back / close")],
      [W("Regler 1–4", "Knobs 1–4"), REGLER().map(r => r.name).join(" · ")], [W("Regler drücken", "Push knob"), W("1: stumm/an · 2: Kulisse/Szenen · 3/4: Mitte", "1: mute · 2: backdrop · 3/4: centre")],
      ["ALT + REC", W("⏺ Aufnahme an / aus", "⏺ Record on / off")], ["ALT + TEMPO", W("MIDI-Takt: aus → Slave → Master", "MIDI clock: off → slave → master")], ["ALT + MENU", W("🎚 Optionen", "🎚 Options")],
      ["MIDI", W("Clock → Tempo und Schlag · Start/Stop · Noten 36–43 → F1–F4 (40–43 mit ALT) · CC 20–23 → Regler · Program Change → Stimmung · CC 119 → umschalten", "Clock → tempo and beat · Start/Stop · notes 36–43 → F1–F4 · CC 20–23 → knobs · Program Change → mood · CC 119 → switch")]];
    menue("<h3>❔ " + W("Tastenbelegung", "Button map") + " – " + MODI[modus].sym + " " + MODI[modus].name + '</h3><div class="zyn-hilfe">' + b.concat(allg).map(([k, t]) => z(k, t)).join("") + '</div><div class="reihe drei"><button type="button" data-zm="zu">✕ ' + W("Schließen", "Close") + "</button></div>", { zu: menueZu });
    menueArt = "hilfe";
  }
  function modusSetzen(k) {
    menueZu(); if (!MODI[k]) return;
    const alt2 = modus; modus = k; schreib("imres-zyn-modus", k);
    if (MODI[k].seite !== SEITE) { zeige(MODI[k].sym + " " + MODI[k].name, null, W("wird geladen …", "loading …")); setTimeout(() => location.replace(ADRESSE[MODI[k].seite]), 150); return; }
    document.documentElement.classList.remove("zyn-m-" + alt2); document.documentElement.classList.add("zyn-m-" + k);
    const z = pz();
    if (k === "klang" && z && z.laeuft) musikSpielen(); /* Musik aus */
    if (k === "musik" && z && z.kulLaeuft) pultKlick("data-kulisse", "keine");
    tabPassend();
    leisteZeichnen(); ledsMelden(); zeige(MODI[k].sym + " " + MODI[k].name, null, MODI[k].sub);
  }
  /* einfache Ansicht: den passenden Reiter (Musik / Ort) zeigen */
  function tabPassend() {
    if (SEITE !== "buehne") return;
    const soll = modus === "klang" ? "ort" : modus === "musik" ? "musik" : null; if (!soll) return;
    const b = $('#lautenwerk [data-etab="' + soll + '"]'); if (b && !b.classList.contains("an") && b.getAttribute("aria-selected") !== "true") klick(b);
  }

  /* ---------- Optionen (liegen in der Brücke – gelten für Gerät, Hintergrund und Handy) ---------- */
  const SKALEN = {
    kurd: [W("Kurd (Moll)", "Kurd (minor)"), "aeolisch", [0, 2, 3, 5, 7, 8, 10]],
    celtic: ["Celtic Minor", "dorisch", [0, 2, 3, 5, 7, 10]],
    integral: ["Integral", "aeolisch", [0, 2, 3, 5, 7, 8]],
    amara: ["Amara", "dorisch", [0, 2, 3, 7, 10]],
    pygmy: ["Pygmy", "aeolisch", [0, 2, 3, 7, 8]],
    hijaz: ["Hijaz", "aeolisch", [0, 2, 3, 5, 7, 8, 11]],
    sabye: [W("Sabye (Dur)", "Sabye (major)"), "ionisch", [0, 2, 4, 5, 7, 9, 11]],
    mixo: [W("Mixolydisch", "Mixolydian"), "mixolydisch", [0, 2, 4, 5, 7, 9, 10]],
    grundton: [W("nur Grundton", "root only"), null, null]
  };
  const NOTEN = ["C", "C♯", "D", "E♭", "E", "F", "F♯", "G", "G♯", "A", "B♭", "H"];
  /* „D Kurd“ und die Töne der Skala ab dem Grundton, z. B. „D · E · F · G · A · B♭ · C“ */
  const tonartName = () => { const sk = SKALEN[OPT.skala] || SKALEN.kurd; return OPT.skala === "grundton" ? NOTEN[OPT.grund] + " (" + W("nur Grundton", "root only") + ")" : NOTEN[OPT.grund] + " " + String(sk[0]).replace(/\s*\(.*\)$/, ""); };
  const skalaToene = () => { const sk = SKALEN[OPT.skala] || SKALEN.kurd; return sk[2] ? W("Töne: ", "Notes: ") + sk[2].map(i => NOTEN[(OPT.grund + i) % 12]).join(" · ") : W("nur der Grundton ", "root only ") + NOTEN[OPT.grund]; };
  let OPT = { takt: "slave", kulisseImTakt: true, versatzMs: 15, tonartAn: false, grund: 2, skala: "kurd", mikro: false, mikroSpannung: true, mikroAusweichen: true, mikroEmpf: 50,
    kickDucken: false, kickKanal: 10, kickNote: 36, duckTiefe: 40, steuerKanal: 16, programmWechsel: true, umschaltCC: true, noten: true, regler: true };
  try { Object.assign(OPT, JSON.parse(sessionStorage.getItem("imres-zyn-opt") || "{}")); } catch (_) {}
  function optSetzen(neu, still) {
    Object.assign(OPT, neu); try { sessionStorage.setItem("imres-zyn-opt", JSON.stringify(OPT)); } catch (_) {}
    if (!still) fetch("/zyn/optionen", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(neu) }).catch(() => {});
    optAnwenden();
  }
  let optWarte = 0;
  function optAnwenden() {
    const P = window.ImresPult;
    if (!P || !P.raster) { if (SEITE === "buehne" && optWarte++ < 60) setTimeout(optAnwenden, 500); }
    else {
      P.raster(OPT.kulisseImTakt && OPT.takt !== "aus");
      P.tonart(OPT.tonartAn ? { grund: OPT.grund, modus: SKALEN[OPT.skala] ? SKALEN[OPT.skala][1] : null } : null);
      if (OPT.takt !== "slave") P.taktFest(0); else if (tempoMidi) P.taktFest(tempoMidi);
    }
    mikroPruefen(); leisteZeichnen();
  }
  fetch("/zyn/optionen").then(r => r.json()).then(o => optSetzen(o, true)).catch(() => optAnwenden());
  const TAKT_NAME = { aus: W("aus", "off"), slave: W("Slave – folgt der Clock", "Slave – follows clock"), master: W("Master – gibt den Takt vor", "Master – sends clock") };
  function optionenMenue(fokusK) {
    const an = v => v ? "✅ " + W("an", "on") : "⬜ " + W("aus", "off");
    const zeile = (k, titel, wert, unter) => '<button type="button" data-zm="o:' + k + '"><span>' + titel + ": <b>" + wert + "</b></span>" + (unter ? "<small>" + unter + "</small>" : "") + "</button>";
    const sk = SKALEN[OPT.skala] || SKALEN.kurd;
    const h = "<h3>🎚 " + W("Optionen", "Options") + '</h3><div class="reihe zyn-opt">' +
      zeile("takt", "⏱ MIDI-Takt", TAKT_NAME[OPT.takt], W("Slave: Band und Kulisse folgen der TR-8S · Master: die Bühne gibt Clock aus · ALT+TEMPO schaltet um", "Slave: band and backdrop follow the clock · Master: the stage sends clock")) +
      zeile("kulisseImTakt", "🎯 " + W("Kulisse im Takt", "Backdrop on the beat"), an(OPT.kulisseImTakt), W("Einzelgeräusche fallen auf den Schlag", "Single sounds land on the beat")) +
      zeile("versatzMs", "⌛ " + W("Versatz", "Offset"), OPT.versatzMs + " ms", W("Ausgleich, falls Band und Drum-Machine leicht auseinander liegen", "Compensates small timing gaps")) +
      zeile("tonartAn", "🎼 " + W("Tonart der Handpan", "Handpan key"), an(OPT.tonartAn) + " – " + tonartName(), W("Alle Stimmungen spielen in dieser Tonart", "Every mood plays in this key")) +
      zeile("grund", "· " + W("Grundton", "Root"), NOTEN[OPT.grund], W("von hier aus läuft die Skala", "the scale starts here")) +
      zeile("skala", "· " + W("Skala", "Scale"), NOTEN[OPT.grund] + " " + sk[0], skalaToene()) +
      zeile("erkennen", "👂 " + W("Tonart erkennen", "Detect key"), W("8 s zuhören", "listen 8 s"), W("Handpan anspielen – braucht das Mikrofon", "Play the handpan – needs the microphone")) +
      zeile("mikro", "🎤 " + W("Mikrofon-Eingang", "Microphone input"), an(OPT.mikro), W("Eingang des Zynthian hört der Band zu", "Zynthian input listens to the band")) +
      zeile("mikroSpannung", "· " + W("Spannung folgt Lautstärke", "Tension follows loudness"), an(OPT.mikroSpannung)) +
      zeile("mikroAusweichen", "· " + W("Kulisse weicht aus", "Backdrop makes room"), an(OPT.mikroAusweichen), W("leiser, solange ihr spielt", "quieter while you play")) +
      zeile("mikroEmpf", "· " + W("Empfindlichkeit", "Sensitivity"), OPT.mikroEmpf + " %") +
      zeile("kickDucken", "🥁 " + W("Pumpen auf die Bassdrum", "Duck on the kick"), an(OPT.kickDucken), W("MIDI-Note der Drum-Machine", "Drum machine MIDI note") + ": " + W("Kanal ", "channel ") + OPT.kickKanal + ", Note " + OPT.kickNote) +
      zeile("kickKanal", "· " + W("Kick-Kanal", "Kick channel"), OPT.kickKanal) + zeile("duckTiefe", "· " + W("Pump-Tiefe", "Duck depth"), OPT.duckTiefe + " %") +
      zeile("steuerKanal", "🎛 " + W("Steuer-Kanal", "Control channel"), OPT.steuerKanal ? OPT.steuerKanal : W("alle", "all"), W("für Noten 36–43, CC 20–23 und CC 119", "for notes 36–43, CC 20–23 and CC 119")) +
      zeile("noten", "· " + W("Noten → F1–F4", "Notes → F1–F4"), an(OPT.noten)) + zeile("regler", "· " + W("CC 20–23 → Drehregler", "CC 20–23 → knobs"), an(OPT.regler)) +
      zeile("programmWechsel", "🔢 Program Change", an(OPT.programmWechsel), W("wählt Stimmung (im Abend-Set: dessen Stimmungen) bzw. Klangwelt", "picks mood / soundscape")) +
      zeile("umschaltCC", "🔀 " + W("Umschalten per CC 119", "Switch via CC 119"), an(OPT.umschaltCC), W("0–42 Zynthian · 43–85 zusammen · 86–127 Bühne", "0–42 Zynthian · 43–85 together · 86–127 the stage")) +
      '<button type="button" data-zm="zu">✕ ' + W("Fertig", "Done") + "</button></div>";
    const zyklus = (k, l) => { const i = l.indexOf(OPT[k]); return l[(i + 1) % l.length]; };
    const a = { zu: menueZu };
    const neu = {
      takt: () => ({ takt: zyklus("takt", ["aus", "slave", "master"]) }), versatzMs: () => ({ versatzMs: zyklus("versatzMs", [0, 5, 10, 15, 20, 30, 40, 60, 80]) }),
      grund: () => ({ grund: (OPT.grund + 1) % 12, tonartAn: true }), skala: () => ({ skala: zyklus("skala", Object.keys(SKALEN)), tonartAn: true }),
      mikroEmpf: () => ({ mikroEmpf: zyklus("mikroEmpf", [10, 20, 30, 40, 50, 60, 70, 80, 90, 100]) }), kickKanal: () => ({ kickKanal: OPT.kickKanal % 16 + 1 }),
      duckTiefe: () => ({ duckTiefe: zyklus("duckTiefe", [20, 30, 40, 50, 60, 70, 80]) }), steuerKanal: () => ({ steuerKanal: (OPT.steuerKanal + 1) % 17 })
    };
    ["takt", "kulisseImTakt", "versatzMs", "tonartAn", "grund", "skala", "mikro", "mikroSpannung", "mikroAusweichen", "mikroEmpf", "kickDucken", "kickKanal", "duckTiefe", "steuerKanal", "noten", "regler", "programmWechsel", "umschaltCC"].forEach(k => {
      a["o:" + k] = () => { optSetzen(neu[k] ? neu[k]() : { [k]: !OPT[k] }); optionenMenue(k); };
    });
    a["o:erkennen"] = () => { menueZu(); tonartErkennen(); };
    const m = menue(h, a); menueArt = "optionen";
    if (fokusK) { const b = m.querySelector('[data-zm="o:' + fokusK + '"]'); if (b) fokusSetzen(b); }
  }

  /* ---------- Mikrofon: hört der Band zu ---------- */
  let mik = null, mikPegel = 0, mikSpannungZuletzt = -1, mikSpannungZeit = 0;
  async function mikroPruefen() {
    const soll = !!OPT.mikro;
    if (soll && !mik) {
      mik = { laedt: true };
      try {
        const strom = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } });
        const AC = window.AudioContext || window.webkitAudioContext, c = new AC(), q = c.createMediaStreamSource(strom), an = c.createAnalyser();
        an.fftSize = 2048; q.connect(an);
        mik = { strom, c, an, puf: new Float32Array(an.fftSize), timer: setInterval(mikroTakt, 100) }; leisteZeichnen(); zeige("🎤 " + W("Mikrofon hört zu", "Microphone listening"));
        if (!OPT.mikro) mikroAus();
      } catch (err) { mik = null; zeige("🎤 " + W("Kein Mikrofon gefunden", "No microphone found"), null, String(err && err.name || "")); }
    } else if (!soll && mik && !mik.laedt) mikroAus();
  }
  function mikroAus() {
    if (!mik) return; clearInterval(mik.timer); try { mik.strom.getTracks().forEach(t => t.stop()); mik.c.close(); } catch (_) {}
    mik = null; mikPegel = 0; kulFaktor(1); leisteZeichnen();
  }
  const kulFaktor = f => { try { if (SEITE === "buehne" && window.ImresPult) window.ImresPult.kulFaktor(f); else if (window.ImresWelten) window.ImresWelten.faktor(f); } catch (_) {} };
  function mikroTakt() {
    if (!mik || !mik.an) return;
    mik.an.getFloatTimeDomainData(mik.puf); let s = 0; for (let i = 0; i < mik.puf.length; i++) s += mik.puf[i] * mik.puf[i];
    const db = 10 * Math.log10(s / mik.puf.length + 1e-12), lo = -62 + (100 - OPT.mikroEmpf) * .3, p = Math.max(0, Math.min(1, (db - lo) / 30));
    mikPegel += (p - mikPegel) * (p > mikPegel ? .3 : .04);
    if (OPT.mikroAusweichen) kulFaktor(1 - .65 * mikPegel);
    if (OPT.mikroSpannung && performance.now() - mikSpannungZeit > 1500) {
      const v = Math.round(mikPegel * 70 / 5) * 5;
      if (v !== mikSpannungZuletzt) {
        mikSpannungZuletzt = v; mikSpannungZeit = performance.now();
        if (SEITE === "buehne") pultRegler("data-leben", "spannung", v);
        else { const el = $('[data-regler="spannung"]'); if (el) { el.value = String(v); el.dispatchEvent(new Event("input", { bubbles: true })); } }
      }
    }
  }
  /* Tonart der Handpan erkennen: 8 s lang Tonhöhen sammeln und mit den Skalen vergleichen */
  async function tonartErkennen(dauer) {
    let strom, c, an, sr;
    dauer = dauer || 8000;
    /* ist ein Eingang an (Handpan, Didgeridoo …), hören wir direkt dort zu – sonst übers Mikrofon */
    const P = window.ImresPult, ein = P && P.kanalAnalyse ? [0, 1].find(i => (P.kanal(i) || {}).an) : undefined;
    if (ein != null) { an = P.kanalAnalyse(ein, 16384); sr = P.abtastrate(); }
    else {
      try { strom = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } }); }
      catch (_) { zeige("🎤 " + W("Kein Mikrofon gefunden", "No microphone found")); return; }
      const AC = window.AudioContext || window.webkitAudioContext; c = new AC(); sr = c.sampleRate;
      an = c.createAnalyser(); an.fftSize = 16384; an.smoothingTimeConstant = 0; c.createMediaStreamSource(strom).connect(an);
    }
    const puf = new Float32Array(an.frequencyBinCount), chroma = new Array(12).fill(0), bass = new Array(12).fill(0), hz = sr / an.fftSize;
    const ende = performance.now() + dauer;
    await new Promise(fertig => {
      const t = setInterval(() => {
        an.getFloatFrequencyData(puf); let max = -200; for (let i = 0; i < puf.length; i++) if (puf[i] > max) max = puf[i];
        if (max > -75) {
          const spitzen = [];
          for (let i = Math.ceil(45 / hz); i < Math.min(puf.length - 1, 1800 / hz); i++) {
            const d = puf[i]; if (d < max - 30 || d < puf[i - 1] || d < puf[i + 1]) continue; /* nur Spitzen */
            /* Spitze genauer: Parabel durch die drei Werte (in dB) */
            const nn = puf[i - 1] + puf[i + 1] - 2 * d, fein = nn < 0 ? i + (puf[i - 1] - puf[i + 1]) / (2 * nn) : i;
            spitzen.push([fein * hz, Math.pow(10, (d - max) / 20)]);
          }
          /* Obertöne (Oktave, Duodezime …) eines tieferen Tons nicht als eigene Töne zählen – sonst „hört“ man Quinten, die gar nicht gespielt werden */
          const grund = spitzen.filter(([f, a]) => !spitzen.some(([g, b]) => g < f * .9 && b >= a * .35 && [2, 3, 4, 5, 6].some(h => Math.abs(f / g - h) < h * .012)));
          grund.forEach(([f, a]) => { chroma[((Math.round(69 + 12 * Math.log2(f / 440)) % 12) + 12) % 12] += a; });
          /* der tiefste deutliche Ton (bei der Handpan das „Ding“) – meist der Grundton */
          const tief = grund.filter(([, a]) => a > .25).sort((x, y) => x[0] - y[0])[0]; if (tief) bass[((Math.round(69 + 12 * Math.log2(tief[0] / 440)) % 12) + 12) % 12] += tief[1];
        }
        const rest = Math.ceil((ende - performance.now()) / 1000); zeige("👂 " + (ein != null ? W("Eingang ", "Input ") + (ein + 1) + ": " : "") + W("Ich höre zu … ", "Listening … ") + Math.max(0, rest) + " s", 1 - Math.max(0, ende - performance.now()) / dauer, W("Spiel ein paar Töne quer über die Handpan", "Play a few notes across the handpan"));
        if (performance.now() >= ende) { clearInterval(t); fertig(); }
      }, 100);
    });
    try { if (strom) strom.getTracks().forEach(x => x.stop()); if (c) c.close(); } catch (_) {}
    const summe = chroma.reduce((a, b) => a + b, 0); if (summe <= 0) { zeige("👂 " + W("Nichts gehört", "Heard nothing")); return; }
    let best = null; const cmax = Math.max(...chroma), bsum = bass.reduce((a, b) => a + b, 0) || 1;
    Object.keys(SKALEN).forEach(k => { const st = SKALEN[k][2]; if (!st) return;
      for (let g = 0; g < 12; g++) { let drin = 0, leer = 0; st.forEach(i => { const v = chroma[(g + i) % 12]; drin += v; if (v < cmax * .08) leer++; });
        /* passt alles hinein, fehlt kein Skalenton, und ist der Grundton laut und tief? */
        const wert = drin / summe - (summe - drin) / summe * 1.5 - leer * .15 + chroma[g] / summe * .6 + bass[g] / bsum * .5 - st.length * .005;
        if (!best || wert > best.wert) best = { k, g, wert }; } });
    optSetzen({ tonartAn: true, grund: best.g, skala: best.k });
    zeige("🎼 " + tonartName(), null, skalaToene());
  }

  /* ---------- Aufnahme (in der Brücke: alles, was aus den Ausgängen kommt) ---------- */
  let aufnahmeAn = false;
  function aufnahme() {
    fetch("/zyn/aufnahme", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ an: !aufnahmeAn }) }).then(r => r.json()).then(j => {
      aufnahmeAn = !!j.an; leisteZeichnen(); ledsMelden();
      zeige(aufnahmeAn ? "⏺ " + W("Aufnahme läuft", "Recording") : j.fehler ? "⚠ " + j.fehler : "⏹ " + W("Aufnahme gespeichert", "Recording saved"), null, j.datei ? j.datei.split("/").pop() : "");
    }).catch(() => zeige("⚠ " + W("Aufnahme geht nicht", "Recording failed")));
  }

  /* ---------- MIDI-Master: Tempo und Schlag an die Brücke ---------- */
  let masterLief = false, masterZeit = 0;
  setInterval(() => {
    if (OPT.takt !== "master" || SEITE !== "buehne" || !window.ImresPult || !window.ImresPult.takt) { masterLief = false; return; }
    const t = window.ImresPult.takt(), jetzt = performance.now();
    if (t.laeuft && t.bisSchlag == null) return; /* gerade Überleitung: kein Abgleich */
    if (t.laeuft === masterLief && jetzt - masterZeit < 1000) return;
    masterLief = t.laeuft; masterZeit = jetzt;
    fetch("/zyn/takt", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(t) }).catch(() => {});
  }, 50);

  /* ---------- Tasten ---------- */
  function musikSpielen() { const p = $$(".lw-play", $("#lautenwerk")).find(sichtbar) || $(".lw-play"); if (p) klick(p); }
  function allesStopp() {
    if (SEITE === "welten") { klick($("#aus-alles")); zeige("✕ " + W("Alles aus", "Everything off")); return; }
    const z = pz();
    if (z && z.laeuft) musikSpielen();
    if (z && z.kulLaeuft) pultKlick("data-aktion", "kulumschalt");
    zeige("■ " + W("Alles angehalten", "Everything stopped"));
  }
  function taste(name, art) {
    if (PULT && name !== "ALT") {
      if (zpWeck === name) { if (art === "los") zpWeck = null; return; }   /* die Taste, die geweckt hat, bewirkt sonst nichts */
      if (zpAktiv()) { if (art === "druck") zpWeck = name; return; }
    }
    if (name === "ERKENNEN") { tonartErkennen(); return; }
    if (name === "ALT") { if (art === "druck") alt = true; else if (art === "los") alt = false; leisteZeichnen(); ledsMelden(); if (PULT && typeof panelAktiv === "function" && panelAktiv()) zpZeichnen(true); return; }
    if (art === "druck" || art === "los") { if (PULT && (!$(".zyn-menue") || art === "los")) zpDruckLos(name, art); return; }
    const lang = art === "lang";
    const m = $(".zyn-menue");
    if (m) {
      if (name === "BACK" || (name === "MENU" && !lang)) { menueZu(); return; }
      if (/^F[1-4]$/.test(name) && menueArt === "modus") { modusSetzen(MODUS_REIHE[+name[1] - 1]); return; }
      if (/^F[1-3]$/.test(name) && menueArt === "zpmodus") { zpModus(["buehne", "welten", "beat"][+name[1] - 1]); return; }
      if (/^F[1-4]$/.test(name) && menueArt === "zp") { if (name === "F2" && !m.querySelector('[data-zm="abend"]')) return; const b = m.querySelector('[data-zm="' + ZP_MENUE_F[+name[1] - 1] + '"]'); if (b) klick(b); return; }
      if ((name === "LEFT" || name === "RIGHT") && menueArt === "beleg" && fokus && fokus.dataset && /^b:/.test(fokus.dataset.zm || "")) { belegZyklus(fokus.dataset.zm.slice(2), name === "LEFT" ? -1 : 1); return; }
      if ((name === "LEFT" || name === "RIGHT") && menueStufe(name === "LEFT" ? -1 : 1)) { return; }
      if ((name === "LEFT" || name === "RIGHT") && (menueArt === "audio" || menueArt === "eingang") && fokus && fokus.dataset && audioAktionen && audioAktionen[fokus.dataset.zm + ":stufe"]) { audioAktionen[fokus.dataset.zm + ":stufe"](name === "LEFT" ? -1 : 1); return; }
      if (["UP", "DOWN", "LEFT", "RIGHT"].includes(name)) { bewegen(name); return; }
      if (name === "SEL") { auswaehlen(); return; }
      if (name !== "MENU" && name !== "MIXER") return;
    }
    if (PULT && zpTaste(name, lang)) { ledsMelden(); return; }
    if (alt && name === "REC") { aufnahme(); return; }
    if (alt && name === "TEMPO") { const l = ["aus", "slave", "master"], n = l[(l.indexOf(OPT.takt) + 1) % 3]; optSetzen({ takt: n }); zeige("⏱ MIDI-Takt: " + TAKT_NAME[n]); return; }
    if (alt && name === "MENU") { optionenMenue(); return; }
    if (alt && name === "PAD" && SEITE === "buehne") { pultKlick("data-aktion", "sprechen"); zeige("🎙 " + W("Sprich jetzt …", "Speak now …")); return; }
    switch (name) {
      case "MENU": lang ? systemMenue() : modusMenue(); return;
      case "MIXER": bankWechsel(); return; /* zwei Bänke: vor = zurück */
      case "UP": case "DOWN": case "LEFT": case "RIGHT": bewegen(name); return;
      case "SEL": auswaehlen(); return;
      case "BACK": zurueck(); return;
    }
    if (SEITE === "welten") {
      if (/^F[1-4]$/.test(name)) { waehle(alt ? "einschlag" : "welt", +name[1] - 1); return; }
      if (name === "PLAY") { klick($("#spielen")); return; }
      if (name === "STOP") { allesStopp(); return; }
      if (name === "ZS3") { weiter("welt", alt ? -1 : 1); return; }
      if (name === "CTRL") { weiter("welt", -1); return; }
      if (name === "PAD") { const l = sichtbare("[data-ger]").concat(sichtbare("[data-moment]")); const el = l[Math.floor(Math.random() * l.length)] || $$("[data-ger]")[0]; if (el) { klick(el); zeige("🎭 " + kurzName(el)); } return; }
      if (name === "REC") { const l = $$("[data-szene]"); const el = l[Math.floor(Math.random() * l.length)]; if (el) { klick(el); zeige("⏳ " + kurzName(el)); } return; }
      if (name === "TEMPO") { const b = $$('#modus button, [data-modus], .modus button').find(x => !x.classList.contains("an")); if (b) { klick(b); zeige(kurzName(b)); } return; }
      return;
    }
    /* Bühne */
    if (/^F[1-4]$/.test(name)) {
      const i = +name[1] - 1;
      if (modus === "klang") { alt ? waehle("moment", i) : waehle("kulisse", i); return; }
      if (modus === "musik") { waehle("stimmung", alt ? i + 4 : i); return; }
      alt ? waehle("kulisse", i) : waehle("stimmung", i); return;
    }
    switch (name) {
      case "PLAY": if (modus === "klang") { pultKlick("data-aktion", "kulumschalt"); zeige("🌲 " + W("Kulisse", "Backdrop")); } else { musikSpielen(); } return;
      case "STOP": allesStopp(); return;
      case "PAD": pultKlick("data-aktion", "passiert"); zeige("⚡ " + W("Etwas passiert", "Something happens")); return;
      case "REC": pultKlick("data-aktion", "stille"); zeige("🤫 " + W("Stille", "Silence")); return;
      case "TEMPO": if (modus === "klang") { weiter("kulisse", 1); return; } pultKlick("data-aktion", "neubesetzen"); zeige("🎲 " + W("Neu besetzen – beim nächsten Teil", "Re-cast – at the next part")); return;
      case "ZS3": if (modus === "klang") { weiter("kulisse", alt ? -1 : 1); return; } weiter("stimmung", alt ? -1 : 1); return;
      case "CTRL": if (modus === "musik") { weiter("stimmung", -1); return; } weiter("kulisse", alt ? -1 : 1); return;
    }
    const dm = /^DREH([1-4])$/.exec(name);
    if (dm) reglerDruck(+dm[1] - 1, lang);
  }
  const merkStumm = {};
  function reglerDruck(i, lang) {
    const r = REGLER()[i]; if (!r) return;
    if (i === 0) { const v = r.lies(); if (v > r.lo) { merkStumm[bank + "-" + i] = v; r.setz(r.lo); } else r.setz(merkStumm[bank + "-" + i] != null ? merkStumm[bank + "-" + i] : Math.round((r.lo + r.hi) * .7)); stellRegler(r, 0); return; }
    if (i === 1 && !lang) { if (SEITE === "buehne" && bank === 0) { pultKlick("data-aktion", "kulumschalt"); zeige("🌲 " + W("Kulisse an / aus", "Backdrop on / off")); return; } }
    const mitte = Math.round(((r.lo + r.hi) / 2) / r.schritt) * r.schritt; r.setz(i === 3 && bank === 0 && SEITE === "buehne" ? r.lo : mitte); stellRegler(r, 0);
  }
  function dreh(nr, d) {
    if (PULT && zpAktiv()) return;
    if (fokusRegler && nr === 3 && document.contains(fokusRegler)) {
      const el = fokusRegler, st = +(el.step || 1) || 1, lo = +el.min || 0, hi = +(el.max || 100);
      el.value = String(Math.max(lo, Math.min(hi, +el.value + d * st))); el.dispatchEvent(new Event("input", { bubbles: true })); el.dispatchEvent(new Event("change", { bubbles: true }));
      zeige(kurzName(el.closest("label") || el) + " · " + el.value, proz(+el.value, lo, hi)); return;
    }
    if ($(".zyn-menue")) { if (nr === 3 && menueStufe(d > 0 ? 1 : -1)) return; bewegen(d > 0 ? "DOWN" : "UP"); return; }
    if (PULT) { zpDreh(nr, d); return; }
    const r = REGLER()[nr]; if (r) stellRegler(r, d);
  }

  /* ---------- MIDI ---------- */
  const steuerOk = e => !OPT.steuerKanal || e.kanal === OPT.steuerKanal;
  function midi(e) {
    const P = window.ImresPult, slave = OPT.takt === "slave";
    if (e.art === "tempo") {
      tempoMidi = e.bpm; leisteZeichnen();
      if (slave && SEITE === "buehne" && P && P.taktFest) { const z = pz(); if (z && Math.abs(Math.round(e.bpm) - z.tempo) >= 1) P.taktFest(e.bpm); else if (z) P.taktFest(z.tempo); }
      return;
    }
    if (e.art === "puls") { if (slave && SEITE === "buehne" && P && P.puls) P.puls(performance.now(), e.n, e.bpm || tempoMidi, OPT.versatzMs); return; }
    if (e.art === "start" || e.art === "weiter") {
      if (!slave) return;
      const z = pz(); if (SEITE === "buehne" && z && !z.laeuft && modus !== "klang") musikSpielen();
      else if (SEITE === "welten" && window.ImresWelten && !window.ImresWelten.laeuft) { const s = $("#spielen"); if (s) klick(s); }
      return;
    }
    if (e.art === "stop") { if (!slave) return; const z = pz(); if (SEITE === "buehne" && z && z.laeuft) musikSpielen(); return; }
    if (e.art === "note") {
      if (OPT.kickDucken && e.kanal === OPT.kickKanal && e.note === OPT.kickNote) {
        const t = (OPT.duckTiefe || 40) / 100 * Math.min(1, .5 + e.wert / 254);
        try { if (SEITE === "buehne" && P) P.ducken(t); else if (window.ImresWelten) window.ImresWelten.ducken(t); } catch (_) {}
        if (OPT.steuerKanal === OPT.kickKanal || !OPT.steuerKanal) return;
      }
      if (OPT.noten && steuerOk(e) && e.note >= 36 && e.note <= 43) { const altWar = alt; alt = e.note >= 40; taste("F" + (((e.note - 36) % 4) + 1), "kurz"); alt = altWar; }
      return;
    }
    if (e.art === "cc") {
      if (OPT.regler && steuerOk(e) && e.cc >= 20 && e.cc <= 23) { const r = REGLER()[e.cc - 20]; if (r && r.schritt) { const v = r.lo + Math.round((e.wert / 127) * (r.hi - r.lo) / r.schritt) * r.schritt; r.setz(v); stellRegler(r, 0); } }
      return;
    }
    if (e.art === "programm" && OPT.programmWechsel) {
      if (SEITE === "buehne") { const z = pz() || {}, l = z.setStimmungen || z.stimmungen || []; const k = l[e.programm % Math.max(1, l.length)]; if (k) { pultKlick("data-vorlage", k); zeige("🎵 " + stimmName(k), null, "Program " + (e.programm + 1)); } }
      else { const l = $$("[data-welt]"); const el = l[e.programm % Math.max(1, l.length)]; if (el) { klick(el); zeige("🌿 " + kurzName(el)); } }
    }
  }

  /* ---------- LEDs ---------- */
  let ledMerk = "";
  const LED_STUFEN = [.15, .3, .5, .75, 1];
  const leistung = () => lies("imres-lw-spar", "0") === "1" ? "spar" : lies("imres-lw-leicht", "0") === "1" ? "leicht" : lies("imres-lw-mittel", "0") === "1" ? "mittel" : "voll";
  const LEISTUNG_NAME = { voll: W("voll (beste Klangqualität)", "full (best sound)"), mittel: W("mittel (voller Klang, 32 kHz – gut die Hälfte der Last)", "medium (full sound, 32 kHz)"), leicht: W("leicht (ein Hall, 32 kHz)", "light (one reverb, 32 kHz)"), spar: W("sparsam (24 kHz, weniger Ebenen)", "saver (24 kHz, fewer layers)") };
  const ledHell = () => { const v = +lies("imres-zp-hell", "1"); return LED_STUFEN.includes(v) ? v : 1; };
  const dimmHex = (h, fk) => { const n = parseInt(String(h).slice(1, 7), 16) || 0, c = x => Math.round(x * fk).toString(16).padStart(2, "0"); return "#" + c((n >> 16) & 255) + c((n >> 8) & 255) + c(n & 255); };
  function ledsMelden() {
    if (PULT && zpRuhe && !HINTER) { /* Ruhebild: nur die Flammen-Balken, schnell */
      const f = {}; zpLeds(f); const hl = ledHell(); if (hl < .999) Object.keys(f).forEach(k => { f[k] = dimmHex(f[k], hl); });
      const s = JSON.stringify(f); if (s === ledMerk) return; ledMerk = s;
      fetch("/zyn/leds", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ farben: f }) }).catch(() => {}); return;
    }
    const f = {}, aus = "#000000", schwach = "#2a1a06", gold = "#c88a20", hell = "#ffcf50";
    ["MENU", "MIXER", "CTRL", "ZS3", "ALT", "TEMPO", "PAD", "F1", "F2", "F3", "F4", "REC", "STOP", "PLAY", "BACK", "SEL", "UP", "DOWN", "LEFT", "RIGHT"].forEach(n => { f[n] = aus; });
    f.MENU = MODI[modus].farbe; f.MIXER = bank ? "#f0dca0" : "#c88a20"; f.ALT = alt ? "#c040c0" : "#301030";
    ["UP", "DOWN", "LEFT", "RIGHT", "SEL", "BACK"].forEach(n => { f[n] = "#303030"; });
    const z = pz();
    if ($(".zyn-menue")) {
      /* Menü: Gold für die Wahltasten, Kupfer für zurück, warmes Weiß für die Pfeile, Glut für den Rest */
      const m = $(".zyn-menue"), fs = new Set($$(".kbd", m).map(e => e.textContent.trim()));
      ["F1", "F2", "F3", "F4"].forEach(n => { f[n] = fs.has(n) || menueArt === "modus" ? "#ffc830" : "#2a1606"; });
      f.SEL = "#fff0c0"; f.BACK = "#ff5a18"; f.MENU = "#c88a20"; ["UP", "DOWN", "LEFT", "RIGHT"].forEach(n => { f[n] = "#6a5030"; });
      if (menueArt === "beleg") { f.LEFT = f.RIGHT = "#ffc830"; }
      ["MIXER", "CTRL", "ZS3", "ALT", "TEMPO", "PAD", "REC", "STOP", "PLAY"].forEach(n => { f[n] = "#1e0f04"; });
    }
    else if (PULT) { /* Pult: zpLeds setzt alles */ }
    else if (SEITE === "welten") {
      const l = $$("[data-welt]"); ["F1", "F2", "F3", "F4"].forEach((n, i) => { const el = alt ? $$("[data-aus]")[i] : l[i]; f[n] = el ? (el.classList.contains("an") ? hell : alt ? "#6a2a10" : schwach) : aus; });
      const spielt = !!$(".welt.an"); f.PLAY = spielt ? "#30d050" : "#0c3010"; f.STOP = "#501010"; f.PAD = "#603010"; f.REC = "#504030"; f.ZS3 = schwach; f.CTRL = schwach; f.TEMPO = "#403010";
    } else {
      ["F1", "F2", "F3", "F4"].forEach((n, i) => {
        let k, an = false;
        if (modus === "klang" || (alt && modus === "buehne")) { k = modus === "klang" && alt ? null : platz("kulisse", i); an = !!(k && z && (z.kulisse === k || (k === "wald" && z.kulisse === "waldnacht"))); f[n] = k ? (an ? "#30ff70" : "#0a3014") : (modus === "klang" && alt ? "#402010" : aus); }
        else { k = platz("stimmung", modus === "musik" && alt ? i + 4 : i); an = !!(k && z && z.stimmung === k); f[n] = k ? (an ? hell : schwach) : aus; }
      });
      f.PLAY = z && (modus === "klang" ? z.kulLaeuft : z.laeuft) ? "#30d050" : "#0c3010"; f.STOP = "#501010"; f.PAD = "#c06010"; f.REC = "#504030"; f.TEMPO = z && z.neuBesetzen ? hell : gold; f.ZS3 = gold; f.CTRL = "#106030";
    }
    if (PULT && !$(".zyn-menue")) zpLeds(f);
    if (aufnahmeAn && !(PULT && zpRuhe)) f.REC = "#ff2020";
    /* nichts bleibt ganz dunkel (außer leeren Kacheln im Pult und den Balken im Ruhebild): warme Glut */
    if (!(PULT && !$(".zyn-menue"))) Object.keys(f).forEach(k => { if (f[k] === "#000000") f[k] = "#1a0c03"; });
    const hl = ledHell(); if (hl < .999) Object.keys(f).forEach(k => { f[k] = dimmHex(f[k], hl); });
    if (HINTER) return;
    const s = JSON.stringify(f); if (s === ledMerk) return; ledMerk = s;
    fetch("/zyn/leds", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ farben: f }) }).catch(() => {});
  }
  setInterval(() => { try { ledsMelden(); } catch (_) {} }, 700);
  /* was gerade läuft – für die Fernbedienung am Handy (mit allen Reglern, Kacheln und Tasten) */
  function fernBericht() {
    const f = {};
    const nimm = (k, fn) => { try { f[k] = fn(); } catch (_) {} };
    const z = pz() || {};
    nimm("tempo", () => Math.round(z.tempoJetzt || z.tempo || 0) || null);
    nimm("laeuft", () => SEITE === "welten" ? !!$(".welt.an") : !!z.laeuft);
    nimm("hg", () => !!z.kulLaeuft);
    nimm("auto", () => ({ id: autoModus, name: AUTO_NAME[autoModus] }));
    nimm("set", () => ({ n: SET.length, i: setIndex }));
    nimm("mix", () => [...new Set(MIX_LISTE.concat(["boost"]))].filter(k => ZP_PARAM[k] && ZP_PARAM[k].schritt).map(k => { const d = ZP_PARAM[k], v = d.lies();
      return { k, name: d.name, lo: d.lo, hi: d.hi, schritt: d.schritt, v, text: d.text ? d.text(v) : d.wort ? d.wort(v) : Math.round(proz(v, d.lo, d.hi) * 100) + " %" }; }));
    if (PULT) {
      nimm("seiten", () => ZP_SEITEN.map(x => ({ id: x.id, sym: x.sym, name: x.name })));
      nimm("seite", () => zpSeite);
      nimm("blatt", () => ({ i: zpBlatt[zpSeite] || 0, n: zpListe.length }));
      nimm("kacheln", () => { const d = zpDef(zpSeite); return zpBlattJetzt().slice(0, 8).map(it => it ? { name: String(it.name || ""), sym: String(it.sym || d.sym || ""), an: !!it.an, vor: !!it.vor } : null); });
      nimm("regler", () => zpRegler().map(r => { const w = zpWert(r); return { name: r.name, text: w.text, anteil: Math.round(w.anteil * 100) / 100 }; }));
      nimm("tasten", () => { const o = {}; ["PLAY", "STOP", "PAD", "REC", "TEMPO", "ZS3", "CTRL"].forEach(k => { [k, "ALT+" + k].forEach(kk => { const id = ZB.tasten[kk]; o[kk] = id && id !== "nichts" ? { id, name: (ZP_AKT[id] || ZP_AKT.nichts)[0] } : null; }); }); return o; });
    }
    return f;
  }
  function fernMelden() {
    const z = pz(); let text = "";
    if (SEITE === "welten") { const a = $(".welt.an"); text = a ? "🌿 " + kurzName(a) : W("still", "silent"); }
    else if (z) text = (z.laeuft ? "🎵 " + stimmName(z.stimmung) : "🎵 –") + " · " + (z.kulLaeuft ? "🌲 " + kulName(z.kulisse) : "🌲 –");
    let fern = null; try { fern = fernBericht(); } catch (_) {}
    fetch("/zyn/zustand", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ seite: SEITE, modus, text, fern }) }).catch(() => {});
  }
  setInterval(fernMelden, 1500);
  /* Befehle der Fernbedienung */
  function fernBefehl(e) {
    if (e.typ === "wert") { const d = ZP_PARAM[e.k]; if (!d || !d.schritt) return; d.setz(rasten(+e.v, d)); }
    else if (e.typ === "aktion") {
      const id = e.id;
      if (HALTEN[id]) { if (SEITE === "buehne") zpHalten(id, e.art !== "los"); }
      else if (id === "stimmung_vor" || id === "stimmung_zurueck") weiter("stimmung", id === "stimmung_vor" ? 1 : -1);
      else if (id === "ort_vor" || id === "ort_zurueck") weiter("kulisse", id === "ort_vor" ? 1 : -1);
      else zpAktion(id);
    }
    else if (e.typ === "kachel") { if (PULT) zpAusloesen(+e.i); }
    else if (e.typ === "blatt") { if (PULT) zpBlaettern(+e.i); }
    else if (e.typ === "seite") { if (PULT) zpSeiteSetzen(e.id); }
    try { zpZeichnen(true); ledsMelden(); } catch (_) {}
    setTimeout(fernMelden, 250);
  }

  /* =====================================================================
     Imres-Pult: eigene Oberfläche für 800 × 480 – nichts scrollt, alles liegt auf Tasten und Reglern.
     Seiten: 🎵 Stimmung · 🌲 Ort · ⚡ Momente · 🌿 Klangwelt. Je Seite 8 Kacheln (F1–F4, ALT + F1–F4),
     rechts die vier Drehregler mit ihrer aktuellen Belegung. Alte Ansicht: Menü → „Alte Ansicht“.
     ===================================================================== */
  const PULT = !HINTER && lies("imres-zyn-pult", "1") !== "0";
  /* Jeder Modus hat seine eigenen Seiten: Bühnen-Pult und Klangwelten sind getrennt (Wechsel nur über MENU → Modus) */
  const ZP_SEITEN = SEITE === "welten" ? [
    { id: "welt", sym: "🌿", name: W("Klangwelten", "Soundscapes"), seite: "welten", farbe: "#e8a49a", led: "#ff9a80" },
    { id: "szenen", sym: "⏳", name: W("Szenen", "Scenes"), seite: "welten", farbe: "#d8c088", led: "#ffe0a0" },
    { id: "raum", sym: "🧭", name: W("Raum", "Space"), seite: "welten", farbe: "#c8a0e0", led: "#e0c0ff" },
    { id: "geraeusche", sym: "🎭", name: W("Geräusche", "Sounds"), seite: "welten", farbe: "#e0703a", led: "#ff6a10" },
    { id: "einschlaege", sym: "💥", name: W("Einschläge", "Impacts"), seite: "welten", farbe: "#e04060", led: "#ff2a5a" }
  ] : [
    { id: "stimmung", sym: "🎵", name: W("Stimmung", "Mood"), seite: "buehne", farbe: "#e0a046", led: "#ffcf50" },
    { id: "ort", sym: "🌲", name: W("Ort", "Place"), seite: "buehne", farbe: "#3fbf6a", led: "#30ff70" },
    { id: "momente", sym: "⚡", name: W("Momente", "Moments"), seite: "buehne", farbe: "#e0703a", led: "#ff6a10" },
    { id: "set", sym: "🎬", name: "Set", seite: "buehne", farbe: "#d8c088", led: "#ffe0a0" },
    { id: "beats", sym: "🥁", name: "Beats", seite: "buehne", farbe: "#e0884a", led: "#ff9a40" }
  ];
  const zpDef = id => ZP_SEITEN.find(x => x.id === id) || ZP_SEITEN[0];
  let zpSeite = lies("imres-zp-seite-" + SEITE, ZP_SEITEN[0].id);
  if (!ZP_SEITEN.some(x => x.id === zpSeite)) zpSeite = ZP_SEITEN[0].id;
  const zpBlatt = {}; let zpZeiger = false, zpCursor = -1, zpListe = [], zpGruppen = [], zpMerk = "", zpWeltWarn = 0;
  const zpEl = PULT ? document.createElement("div") : null;
  const EMO = /^((?:\p{Extended_Pictographic}|\p{Regional_Indicator})(?:[️‍⃣]|\p{Extended_Pictographic}|\p{Emoji_Modifier})*)\s*(.*)$/u;
  const teil = (txt, sym) => { txt = String(txt || "").trim(); const m = EMO.exec(txt); return m ? [m[1], m[2] || txt] : [sym, txt]; };
  const esc2 = x => String(x).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

  /* ----- was auf einer Seite liegt: Gruppen, jede beginnt auf einem neuen Blatt (8 Kacheln) ----- */
  const ZUS_GR_SYM = { wetter: "🌦", wasser: "💧", haus: "🏠", wild: "🦌", hof: "🐄", menschen: "👥", handwerk: "🔨", grusel: "👻", wesen: "🐉", duester: "🌑", behaglich: "🕯", weitere: "✨" };
  const ZUS_SYM = { regen: "🌧", starkregen: "⛈", gewitter: "🌩", sturm: "🌪", wind: "💨", laub: "🍃", schnee: "❄", bach: "🏞", wellen: "🌊", wasserfall: "💦", tropfen: "💧", blubbern: "🫧", feuer: "🔥", kessel: "🍲", uhr: "🕰", katze: "🐈", glocke: "🔔", muehle: "⚙",
    voegel: "🐦", grillen: "🦗", eule: "🦉", frosch: "🐸", wolf: "🐺", kraehe: "🐦‍⬛", moewe: "🕊", specht: "🪵", bienen: "🐝", fledermaus: "🦇", wal: "🐋", ente: "🦆", hirsch: "🦌", keiler: "🐗", greif: "🦅", schlange: "🐍",
    hund: "🐕", pferd: "🐎", kuh: "🐄", schaf: "🐑", huhn: "🐔", schwein: "🐖", esel: "🫏", ziege: "🐐", kinder: "🧒", stimmen: "🗣", markt: "🛒", hafen: "⚓", segel: "⛵", gesang: "🎶", schmiede: "⚒", axt: "🪓", hacke: "⛏",
    geist: "👻", untot: "🧟", ketten: "⛓", monster: "👹", yeti: "🦍", kriegstrommeln: "🥁", hexe: "🧙", goblin: "👺", oger: "👹", drachenbruellen: "🐉", fluegelschlag: "🪽", lindwurm: "🐲", spinne: "🕷", skelett: "💀", ghul: "🧟",
    geisterfluestern: "🌫", spuk: "🏚", geisterheulen: "👻", daemon: "😈", baer: "🐻", hyaene: "🐺", baumhirte: "🌳", golem: "🗿", feuerwesen: "🔥", seeungeheuer: "🦑", hoehlengesang: "🕳", sirene: "🧜", raubkatze: "🐆",
    fernschrei: "😱", tuerknarren: "🚪", ritualtrommel: "🪘", fluestern: "🤫", grabesdroehnen: "⚰", geisterhauch: "🌬", herzschlag: "💓", friedhof: "🪦", ruinenwind: "🏛", geisterchor: "👥", fliegenschwarm: "🪰" };
  function zpInhalt() {
    const g = [], P = window.ImresPult, z = pz() || {};
    if (SEITE === "welten" && zpSeite === "raum") return [];
    if (SEITE === "welten") {
      /* nach den Überschriften der Seite gruppiert (z. B. „Türen & Truhen“, „Wesen & Tiere“) – jede Gruppe beginnt auf einem neuen Blatt */
      const gruppiert = (sel, sym, attr, standard) => { const m = new Map();
        $$(sel).forEach(el => { const gr = el.closest(".gruppe, .weltgruppe, section, details"); const h = gr && gr.querySelector("h3, h2, summary"); let t = standard; if (h) { const hh = h.cloneNode(true); hh.querySelectorAll("small, button, .knopf").forEach(x => x.remove()); t = hh.textContent.trim().replace(/\s+/g, " ") || standard; }
          let sy, nm; const s1 = el.querySelector(".sym"), n1 = el.querySelector(".nm");
          if (s1 && n1) { sy = s1.textContent.trim(); nm = n1.textContent.trim(); } else [sy, nm] = teil((el.innerText || el.textContent || el.title || "").split("⏳")[0].replace(/\s+/g, " "), sym);
          if (!m.has(t)) m.set(t, []);
          const an = el.getAttribute("aria-pressed") === "true" || el.classList.contains("an"), tx = attr === "szene" ? el.querySelector(".tx") : null;
          /* Szenen: Dauer bzw. Restzeit und Fortschritt (die Kachel füllt sich, bis die Szene zu Ende ist) */
          const info = tx ? tx.textContent.replace(/^[■⏳]\s*/, "").trim() : "", pr = an && attr === "szene" ? parseFloat(el.style.getPropertyValue("--p")) : NaN;
          m.get(t).push({ key: attr + ":" + el.getAttribute("data-" + attr), sym: sy, name: nm, an, info, p: isFinite(pr) ? Math.round(pr * 2) / 2 : null, los: () => { klick(el); zeige(sy + " " + nm); } }); });
        [...m.entries()].forEach(([titel, l]) => g.push({ titel, l })); };
      if (zpSeite === "welt") gruppiert("[data-welt]", "🌿", "welt", W("Klangwelten", "Soundscapes"));
      else if (zpSeite === "szenen") gruppiert("[data-szene]", "⏳", "szene", W("Szenen", "Scenes"));
      else if (zpSeite === "geraeusche") gruppiert("[data-ger]", "🎭", "ger", W("Geräusche", "Sounds"));
      else gruppiert("[data-aus]", "💥", "aus", W("Einschläge", "Impacts"));
      return g.filter(x => x.l.length);
    }
    if (zpSeite === "beats") return g;
    if (zpSeite === "set") {
      g.push({ titel: W("Set – deine Songs", "Set – your songs"), l: SET.map((sn, i) => ({ key: "set:" + i, sym: sn.sym || "🎬", name: (i + 1) + ". " + sn.name, an: i === setIndex, los: () => setLaden(i) }))
        .concat([{ sym: "➕", name: W("Jetzt speichern", "Save current"), los: setSpeichern }]) });
      return g;
    }
    if (!P || !P.listen) return g;
    const L = P.listen();
    if (zpSeite === "stimmung") {
      g.push({ titel: z.abendSet ? W("Spielabend", "Game night") + ": " + ((P.abendSets().find(s => s.k === z.abendSet) || {}).name || "") : W("Stimmungen", "Moods"), l: L.st.map(k => {
        const [sy, nm] = teil(L.namen.st[k] || k, "🎵");
        return { key: "st:" + k, sym: sy, name: nm, an: !!(z.laeuft && z.stimmung === k), vor: !!(z.naechste === k && z.stimmung !== k), los: () => { pultKlick("data-vorlage", k); zeige("🎵 " + nm, null, z.laeuft ? W("wechselt am Taktende", "changes at the bar end") : ""); } };
      }) });
    } else if (zpSeite === "ort") {
      g.push({ titel: W("Orte", "Places"), l: L.kul.map(k => {
        const [sy, nm] = teil(L.namen.kul[k] || k, "🌲");
        const an = !!(z.kulLaeuft && (z.kulisse === k || (k === "wald" && z.kulisse === "waldnacht")));
        return { key: "kul:" + k, sym: sy, name: nm, an, los: () => { if (an) { pultKlick("data-kulisse", "keine"); zeige("🔇 " + W("Hintergrund aus", "Backdrop off")); } else { ortWaehlen(k); zeige("🌲 " + nm); } } };
      }) });
      /* Geräusche direkt über die Bühne schalten: erst was gerade läuft, dann was zum Ort passt, dann nach Art sortiert */
      const P = window.ImresPult, K = P && P.zusKatalog ? P.zusKatalog() : null;
      if (K) {
        const kachel = id => ({ key: "zus:" + id, sym: ZUS_SYM[id] || "✨", name: K.namen[id] || id, an: !!K.an[id],
          los: () => { const P2 = window.ImresPult, ist = !!P2.zusKatalog().an[id];
            if (!P2.zusSetzen(id, ist ? 0 : 1)) zeige("⚠ " + W("Höchstens ", "At most ") + K.max + W(" Geräusche gleichzeitig – erst eines ausschalten", " sounds at once – switch one off first"));
            else zeige((ist ? "🔇 " : (ZUS_SYM[id] || "✨") + " ") + (K.namen[id] || id), null, ist ? W("aus", "off") : W("an · Lautstärke: ZS3 auf der Ort-Seite", "on · level: ZS3 on the place page")); zpZeichnen(true); } });
        const laufen = Object.keys(K.an).filter(id => K.namen[id]);
        if (laufen.length) g.push({ titel: "🔊 " + W("Läuft gerade – antippen schaltet aus", "Playing – tap to switch off"), l: laufen.map(kachel) });
        /* Kacheln bleiben an ihrem Platz (leuchten, wenn an) – so springt nichts unter dem Finger weg */
        const pass = K.passend.slice(0, 16);
        if (pass.length) g.push({ titel: "✨ " + W("Passt zu diesem Ort", "Fits this place"), l: pass.map(kachel) });
        K.gruppen.forEach(([gid, nm, ids]) => { const l = ids.filter(id => !pass.includes(id)); if (l.length) g.push({ titel: (ZUS_GR_SYM[gid] || "") + " " + nm, l: l.map(kachel) }); });
      }
    } else {
      const mo = P.momente();
      if (mo.length) g.push({ titel: W("Momente", "Moments") + (z.kulisse && z.kulisse !== "keine" ? " · " + teil(L.namen.kul[z.kulisse] || "", "")[1] : ""), l: mo.map(m => ({ key: "mom:" + z.kulisse + ":" + m.i, sym: m.sym, name: m.name, still: !!m.still, los: () => { pultKlick("data-moment", m.i); zeige(m.sym + " " + m.name); } })) });
      g.push({ titel: W("Effekte", "Effects"), l: L.fx.map(f => { const [sy, nm] = teil(L.namen.fx[f] || f, "💥"); return { key: "fx:" + f, sym: sy, name: nm, los: () => { pultKlick("data-sfx", f); zeige(sy + " " + nm); } }; }) });
    }
    return g.filter(x => x.l.length);
  }
  /* Gruppen zu Blättern à 8 */
  let FAV = {}; try { FAV = JSON.parse(lies("imres-zp-fav", "{}")) || {}; } catch (_) { FAV = {}; }
  const favListe = () => FAV[zpSeite] || [];
  function zpAufbauen() {
    zpGruppen = zpInhalt(); zpListe = [];
    const fl = zpSeite === "set" ? [] : favListe();
    if (fl.length) {
      const alle = {}; zpGruppen.forEach(gr => gr.l.forEach(it => { if (it.key) alle[it.key] = it; }));
      const favs = fl.map(k => alle[k]).filter(Boolean).map(it => Object.assign({}, it, { fav: true }));
      if (favs.length) { zpGruppen.forEach(gr => { gr.l = gr.l.filter(it => !it.key || !fl.includes(it.key)); }); if (zpGruppen[0]) { zpGruppen[0].l = favs.concat(zpGruppen[0].l); zpGruppen[0].titel = "★ " + zpGruppen[0].titel; } zpGruppen = zpGruppen.filter(gr => gr.l.length); }
    }
    zpGruppen.forEach(gr => { gr.ab = zpListe.length; for (let i = 0; i < gr.l.length; i += 8) zpListe.push(gr.l.slice(i, i + 8).map(x => Object.assign({ gruppe: gr.titel }, x))); });
    const n = Math.max(1, zpListe.length); zpBlatt[zpSeite] = Math.max(0, Math.min(n - 1, zpBlatt[zpSeite] || 0));
    return zpListe[zpBlatt[zpSeite]] || [];
  }
  const zpBlattJetzt = () => zpListe[zpBlatt[zpSeite] || 0] || [];

  /* ----- Drehregler und Tasten: frei belegbar (Menü → Belegung) ----- */
  const B0 = B_REGLER[0], B1 = B_REGLER[1];
  const SP_TEXT = v => v < 15 ? W("friedlich", "peaceful") : v < 40 ? W("ruhig", "calm") : v < 70 ? W("angespannt", "tense") : W("bedrohlich", "menacing");
  const LOS_TEXT = v => v <= 2 ? W("kaum etwas", "barely") : v <= 4 ? W("ruhig", "calm") : v <= 6 ? W("normal", "normal") : v <= 8 ? W("lebhaft", "lively") : W("wild", "wild");
  const PFX = () => window.ImresPult && window.ImresPult.fxWerte ? window.ImresPult.fxWerte() : null;
  const fxDef = (k, name, lo, hi, schritt, neutral, text) => ({ name, lo, hi, schritt, neutral, text,
    lies: () => { const w = PFX(); return w && typeof w[k] === "number" ? w[k] : neutral; },
    setz: v => { if (window.ImresPult && window.ImresPult.fx) window.ImresPult.fx(k, v); } });
  /* Bühnen-Regler gedrosselt: höchstens alle paar Hundertstel ein Wert – die Bühne plant bei manchen Reglern neu */
  const gedrosselt = (def, ms) => { let wart = null, t = 0; return Object.assign({}, def, { lies: () => wart != null ? wart : def.lies(), setz: v => { wart = v; if (!t) t = setTimeout(() => { t = 0; const x = wart; wart = null; if (x != null) def.setz(x); }, ms); } }); };
  const ZP_PARAM = {
    musik: Object.assign({ druck: "stumm" }, gedrosselt(B0[0], 90)), hg: Object.assign({ druck: "hg" }, gedrosselt(B0[1], 90)), los: Object.assign({ druck: "mitte", wort: LOS_TEXT }, gedrosselt(B0[2], 350)),
    spannung: Object.assign({ druck: "friedlich", wort: SP_TEXT }, gedrosselt(B0[3], 150)), tempo: Object.assign({ druck: "mitte" }, gedrosselt(B1[0], 250)), hall: Object.assign({ druck: "mitte" }, gedrosselt(B1[1], 150)),
    fxlaut: Object.assign({ druck: "stumm" }, gedrosselt(B1[2], 90), { name: W("💥 Effekt-Lautstärke", "💥 Effect volume") }), echohall: Object.assign({ druck: "mitte" }, gedrosselt(B1[3], 150)),
    filter: Object.assign({ druck: "null" }, fxDef("filter", W("🎛 Filter", "🎛 Filter"), -100, 100, 4, 0, v => v === 0 ? W("offen", "open") : v < 0 ? W("Tiefpass ", "Low-pass ") + (-v) + " %" : W("Hochpass ", "High-pass ") + v + " %")),
    reso: Object.assign({ druck: "null" }, fxDef("reso", W("〰 Resonanz", "〰 Resonance"), 0, 100, 5, 15)),
    delay: Object.assign({ druck: "null" }, fxDef("echo", W("🔁 Delay", "🔁 Delay"), 0, 100, 4, 0)),
    rueck: Object.assign({ druck: "null" }, fxDef("rueck", W("↻ Rückkopplung", "↻ Feedback"), 0, 90, 5, 35)),
    zeit: Object.assign({ druck: "null" }, fxDef("zeit", W("⏱ Delay-Länge", "⏱ Delay time"), 0, 4, 1, 2, v => ["1/8", "1/8·", "1/4", "1/4·", "1/2"][v] || "")),
    drive: Object.assign({ druck: "null" }, fxDef("drive", W("🔥 Drive", "🔥 Drive"), 0, 100, 4, 0)),
    crush: Object.assign({ druck: "null" }, fxDef("crush", W("👾 Bitcrusher", "👾 Bitcrusher"), 0, 100, 4, 0)),
    rate: Object.assign({ druck: "null" }, fxDef("rate", W("📉 Sample-Rate", "📉 Sample rate"), 0, 100, 4, 0)),
    ring: Object.assign({ druck: "null" }, fxDef("ring", W("🔔 Ringmodulator", "🔔 Ring mod"), 0, 100, 4, 0)),
    flanger: Object.assign({ druck: "null" }, fxDef("flanger", W("🌀 Flanger", "🌀 Flanger"), 0, 100, 4, 0)),
    gate: Object.assign({ druck: "null" }, fxDef("gate", W("✂ Trance-Gate", "✂ Trance gate"), 0, 100, 4, 0)),
    wobble: Object.assign({ druck: "null" }, fxDef("wobble", W("〽 Wobble", "〽 Wobble"), 0, 100, 4, 0)),
    nichts: { name: "–", lo: 0, hi: 1, schritt: 0, lies: () => 0, setz: () => {}, druck: "", text: () => "" }
  };
  const BANKEN = ["A", "B", "FX"]; /* + IN1 / IN2, wenn Eingänge an sind (bankenNeu) */
  const FX_PARAMS = ["filter", "reso", "delay", "rueck", "zeit", "drive", "crush", "rate", "gate", "ring", "flanger", "wobble"];
  const NORMAL_PARAMS = ["musik", "hg", "los", "spannung", "tempo", "hall", "fxlaut", "echohall"];
  const BANK_FARBE = { MIX: "#ffe8b0", SPUR: "#ff9a80", A: "#ffc830", B: "#f0dca0", FX: "#ff7a20", GLITCH: "#ff2a5a", MOD: "#fff8ec" };
  const ZP_AKT = {
    play: [W("▶ Musik an/aus", "▶ Music on/off"), W("Musik", "music")], stop: [W("■ Alles aus", "■ All off"), W("aus", "off")],
    passiert: [W("⚡ Etwas passiert", "⚡ Something happens"), "⚡"], stille: [W("🤫 Stille", "🤫 Silence"), "🤫"], neubesetzen: [W("🎲 Neu besetzen", "🎲 Re-cast"), "🎲"],
    sprechen: [W("🎙 Sprechen", "🎙 Speak"), "🎙"], aufnahme: [W("⏺ Aufnahme an/aus", "⏺ Record on/off"), "⏺"], takt: [W("⏱ MIDI-Takt umschalten", "⏱ Switch MIDI clock"), "⏱"],
    seite_vor: [W("➡ nächste Seite", "➡ next page"), W("Seite", "page")], seite_zurueck: [W("⬅ vorige Seite", "⬅ previous page"), W("◀ Seite", "◀ page")],
    bank: [W("⟲ Reglerbank wechseln", "⟲ Next knob bank"), W("Bank", "bank")], hg: [W("🌲 Hintergrund an/aus", "🌲 Backdrop on/off"), "🌲"],
    fx_aus: [W("✨ Effekte zurücksetzen", "✨ Reset effects"), W("FX aus", "FX off")],
    filterzu: [W("🎛 Filter zu – solange gedrückt", "🎛 Filter close – while held"), W("Filter", "filter")],
    filterhoch: [W("🎛 Hochpass – solange gedrückt", "🎛 High-pass – while held"), W("Hochpass", "high-pass")],
    echowurf: [W("🔁 Echo-Wurf – solange gedrückt", "🔁 Echo throw – while held"), W("Echo-Wurf", "echo throw")],
    stotter: [W("🔂 Stotter 1/16 – solange gedrückt", "🔂 Stutter 1/16 – while held"), W("Stotter", "stutter")],
    rueckwaerts: [W("⏪ Rückwärts – solange gedrückt", "⏪ Reverse – while held"), W("Rückwärts", "reverse")],
    bandstop: [W("⏏ Tape-Stop – solange gedrückt", "⏏ Tape stop – while held"), W("Tape-Stop", "tape stop")],
    crushhalt: [W("👾 Bitcrush voll – solange gedrückt", "👾 Full crush – while held"), W("Crush", "crush")],
    tap: [W("⏱ Tap-Tempo", "⏱ Tap tempo"), "Tap"], mischer: [W("🎚 Mischpult ein/aus", "🎚 Mixer on/off"), W("Mischer", "mixer")], beats: [W("🥁 Drumpad (Beats) auf/zu", "🥁 Drum pad (beats) open/close"), W("Drums", "drums")], spurmix: [W("🎛 Spuren der Stimmung (Lautstärken)", "🎛 Mood tracks (levels)"), W("Spuren", "tracks")], autopilot: [W("🤖 Autopilot umschalten", "🤖 Toggle autopilot"), "🤖"],
    set_weiter: [W("🎬 nächster Song im Set", "🎬 next song in set"), W("Song ▶", "song ▶")], set_zurueck: [W("🎬 voriger Song im Set", "🎬 previous song in set"), W("◀ Song", "◀ song")],
    nichts: ["– " + W("nichts", "nothing") + " –", ""]
  };
  ZP_AKT.mixab = [W("🎚 Mischung A/B umschalten", "🎚 Switch mix A/B"), W("Mix A/B", "mix A/B")];
  const HALTEN = { filterzu: 1, filterhoch: 1, echowurf: 1, stotter: 1, rueckwaerts: 1, bandstop: 1, crushhalt: 1 };
  const ZP_TASTEN = ["PLAY", "STOP", "PAD", "REC", "TEMPO", "ZS3", "CTRL", "ALT+PLAY", "ALT+STOP", "ALT+PAD", "ALT+REC", "ALT+TEMPO", "ALT+ZS3", "ALT+CTRL"];
  const ZP_STANDARD = {
    regler: { "A:stimmung": ["musik", "spannung", "hg", "los"], "A:ort": ["hg", "wetter", "los", "hall"], "A:momente": ["fxlaut", "spannung", "hall", "tempo"],
      B: ["tempo", "hall", "fxlaut", "echohall"], FX: ["filter", "delay", "crush", "gate"] },
    tasten: { PLAY: "play", STOP: "stop", PAD: "passiert", REC: "stille", TEMPO: "tap", ZS3: "spurmix", CTRL: "mischer",
      "ALT+PLAY": "fx_aus", "ALT+STOP": "filterzu", "ALT+PAD": "beats", "ALT+REC": "aufnahme", "ALT+TEMPO": "neubesetzen", "ALT+ZS3": "echowurf", "ALT+CTRL": "stotter" }
  };
  let ZB = JSON.parse(JSON.stringify(ZP_STANDARD));
  try { const g = JSON.parse(lies("imres-zyn-beleg", "null")); if (g && g.regler && g.tasten) { Object.assign(ZB.regler, g.regler); Object.assign(ZB.tasten, g.tasten); } } catch (_) {}
  const belegMerken = () => schreib("imres-zyn-beleg", JSON.stringify(ZB));
  /* einmalig: CTRL wird zum Mischpult-Knopf (vorher: nächste Seite – geht auch mit ALT + ▶) */
  if (lies("imres-zyn-misch1", "") !== "1") { if (ZB.tasten.CTRL === "seite_vor") ZB.tasten.CTRL = "mischer"; schreib("imres-zyn-misch1", "1"); belegMerken(); }
  if (lies("imres-zyn-beats1", "") !== "1") { if (ZB.tasten["ALT+PAD"] === "sprechen") ZB.tasten["ALT+PAD"] = "beats"; schreib("imres-zyn-beats1", "1"); belegMerken(); }
  if (lies("imres-zyn-spur1", "") !== "1") { if (ZB.tasten.ZS3 === "seite_zurueck") ZB.tasten.ZS3 = "spurmix"; schreib("imres-zyn-spur1", "1"); belegMerken(); }
  if (lies("imres-zyn-wetter1", "") !== "1") { const o = ZB.regler["A:ort"]; if (!o || o.join() === "hg,los,spannung,hall") { ZB.regler["A:ort"] = ["hg", "wetter", "los", "hall"]; belegMerken(); } schreib("imres-zyn-wetter1", "1"); }
  let vorBeats = "stimmung";
  const bankName = () => BANKEN[bank] || "A";
  /* Mischpult (CTRL): vier Regler für die Lautstärken – drücken+drehen legt etwas anderes auf den Regler */
  let mischAn = false, spurAn = false, spurSeite = 0, reiheTipp = null;
  const MIX_STD = ["musik", "hg", "in1_laut", "fxlaut", "balance", "in2_laut", "hall", "karte_haupt"];
  const MIX_LISTE = ["musik", "hg", "fxlaut", "karte_haupt", "karte_kh", "in1_laut", "in2_laut", "in1_pegel", "in2_pegel", "hall", "echohall", "in1_hall", "in2_hall", "in1_pan", "in2_pan", "balance"];
  /* Balance statt Boost in der zweiten Reihe (Boost bleibt wählbar) */
  if (lies("imres-zyn-misch2", "") !== "1") { if (ZB.regler.MIX && ZB.regler.MIX[4] === "boost") { ZB.regler.MIX[4] = "balance"; belegMerken(); } schreib("imres-zyn-misch2", "1"); }
  /* Klangwelten haben ein eigenes Mischpult (eigene Belegung) */
  const MIXW_STD = ["w_gesamt", "w_ger", "w_sz", "w_wetter", "w_spannung", "w_leben", "w_raum", "karte_haupt"];
  const MIXW_LISTE = ["w_gesamt", "w_ger", "w_sz", "w_wetter", "w_spannung", "w_leben", "w_raum", "w_weite", "karte_haupt", "karte_kh"];
  const mixSlot = () => SEITE === "welten" ? "MIXW" : "MIX", mixStd = () => SEITE === "welten" ? MIXW_STD : MIX_STD, mixListe = () => SEITE === "welten" ? MIXW_LISTE : MIX_LISTE;
  const mixKeys = () => { const l = (ZB.regler[mixSlot()] || []).slice(), st = mixStd(); for (let i = 0; i < 8; i++) if (!l[i]) l[i] = st[i]; return l.slice(0, 8); };
  /* Regler der Klangwelten – über die Schnittstelle der Seite (window.ImresWelten) */
  const WA = () => SEITE === "welten" && window.ImresWelten && window.ImresWelten.mix ? window.ImresWelten : null;
  const wMix = () => { const a = WA(); try { return a ? a.mix() : null; } catch (_) { return null; } };
  const wPar = (name, feld, k, lo, hi, schritt, neutral) => gedrosselt({ name, lo, hi, schritt, neutral, druck: "mitte", text: v => Math.round(v) + " %",
    lies: () => { const m = wMix(); if (!m) return neutral; const f = typeof feld === "function" ? feld(m) : feld; return m[f] != null ? +m[f] : neutral; },
    setz: v => { const a = WA(), m = wMix(); if (a) a.regler(typeof k === "function" ? k(m || {}) : k, v); } }, 80);
  const wEpisch = m => !!(m && m.welt && m.welt.episch);
  Object.assign(ZP_PARAM, {
    w_gesamt: wPar(W("🔊 Lautstärke", "🔊 Volume"), "gesamt", "gesamt", 0, 100, 2, 70),
    w_ger: wPar(W("🎭 Geräusche", "🎭 Sounds"), "ger", "ger-laut", 0, 150, 2, 100),
    w_sz: wPar(W("⏳ Szenen", "⏳ Scenes"), "sz", "sz-laut", 0, 150, 2, 100),
    w_wetter: wPar(W("🌦 Wetter", "🌦 Weather"), "wlaut", "wlaut", 0, 150, 2, 100),
    w_spannung: Object.assign(wPar(W("😨 Spannung", "😨 Tension"), "spannung", "spannung", 0, 100, 5, 0), { druck: "null" }),
    w_leben: wPar(W("🐾 Lebendigkeit", "🐾 Liveliness"), "leben", "leben", 0, 200, 5, 100),
    w_raum: wPar(W("🏛 Raumhall", "🏛 Room reverb"), m => wEpisch(m) ? "ehall" : "raum", m => wEpisch(m) ? "ehall" : "raum", 0, 100, 5, 50),
    w_weite: wPar(W("🌌 Weite (episch)", "🌌 Width (epic)"), "eweite", "eweite", 0, 100, 5, 45)
  });
  ZP_PARAM.w_wetter.text = v => { const m = wMix(); return (m && !m.wetter ? W("(kein Wetter) ", "(no weather) ") : "") + Math.round(v) + " %"; };
  /* ZS3 in den Klangwelten: jede Schicht der Welt einzeln, dazu Lebendigkeit und Raum */
  const weltMerk = {};
  function weltKanaele() {
    const a = WA(), m = wMix(); if (!a || !m || !m.welt) return [];
    const l = m.betten.map((x, i) => ({ name: "🌿 " + (x.name || W("Schicht ", "Layer ") + (i + 1)), lo: 0, hi: 150, schritt: 5, neutral: 100, wBett: i,
      lies: () => { const y = wMix(); return y && y.betten[i] ? y.betten[i].v : 100; }, setz: v => a.regler("b" + i, v),
      text: v => { const y = wMix(), b = y && y.betten[i]; return (v ? Math.round(v) + " %" : W("🔇 aus", "🔇 off")) + (b && b.ruht ? W(" · ruht", " · resting") : ""); },
      aktion: () => { const y = wMix(), v = y && y.betten[i] ? y.betten[i].v : 100, k = (m.welt.id) + ":" + i; if (v > 0) { weltMerk[k] = v; a.regler("b" + i, 0); zeige("🔇 " + x.name); } else { a.regler("b" + i, weltMerk[k] || 100); zeige("🔊 " + x.name); } },
      drucktext: W("drücken: aus/an", "push: off/on") }));
    l.push(Object.assign({}, ZP_PARAM.w_leben, { aktion: () => { a.regler("leben", 100); zeige("🐾 " + W("Lebendigkeit normal", "Liveliness normal")); }, drucktext: W("drücken: normal", "push: normal") }));
    l.push(Object.assign({}, ZP_PARAM.w_raum, { aktion: () => { a.regler(wEpisch(wMix()) ? "ehall" : "raum", wEpisch(wMix()) ? 75 : 50); }, drucktext: W("drücken: normal", "push: normal") }));
    if (m.welt.episch) l.push(Object.assign({}, ZP_PARAM.w_weite, { aktion: () => a.regler("eweite", 45), drucktext: W("drücken: normal", "push: normal") }));
    l.push(Object.assign({}, ZP_PARAM.w_wetter, { aktion: () => { const y = wMix(); a.regler("wlaut", y && y.wlaut > 0 ? 0 : 100); }, drucktext: W("drücken: aus/an", "push: off/on") }));
    return l;
  }

  /* ===================== 🎚 Mischer: Pegel, Stumm, Solo, sanftes Blenden, Mischungen A/B, Balance, Obergrenzen ===================== */
  const MX = (() => { let m = {}; try { m = JSON.parse(lies("imres-zp-mx", "{}")) || {}; } catch (_) { m = {}; }
    return Object.assign({ bal: 0, stumm: {}, grenze: {}, ab: "A", A: null, B: null, blend: 2.5, db: true, solo: null, soloStumm: [] }, m); })();
  const mxMerken = () => schreib("imres-zp-mx", JSON.stringify(MX));
  const MX_FARBE = { w_gesamt: "#ffc830", w_ger: "#ff7a20", w_sz: "#e0b070", w_wetter: "#80d8c0", w_spannung: "#e04060", w_leben: "#5ad08a", w_raum: "#d090ff", w_weite: "#b890e0", musik: "#ffc830", hg: "#5ad08a", fxlaut: "#ff7a20", in1: "#ff9a80", in2: "#d090ff", mit: "#ffd890", karte: "#f0dca0", boost: "#ff5a3a", hall: "#e0b070", echohall: "#f0c890", balance: "#fff0c8" };
  const mxGruppe = k => /^in1_/.test(k) ? "in1" : /^in2_/.test(k) ? "in2" : /^mit_/.test(k) ? "mit" : /^karte_/.test(k) ? "karte" : k;
  const mxFarbe = k => MX_FARBE[mxGruppe(k)] || "#e0c890";
  /* welcher Messpunkt zu welchem Regler gehört (Hall hat keinen eigenen) */
  const MX_MESS = { w_gesamt: "gesamt", w_ger: "ger", w_sz: "sz", w_wetter: "wetter", w_spannung: "gesamt", w_leben: "gesamt", w_raum: "gesamt", w_weite: "gesamt", musik: "musik", hg: "hg", fxlaut: "fx", in1: "in1", in2: "in2", mit: "mit", karte: "gesamt", boost: "gesamt", balance: "gesamt" };
  const MX_STUMMBAR = ["w_gesamt", "w_ger", "w_sz", "w_wetter", "w_raum", "w_weite", "musik", "hg", "fxlaut", "in1_laut", "in2_laut", "mit_laut", "hall", "echohall", "in1_hall", "in2_hall", "karte_haupt", "karte_kh"];
  const MX_QUELLEN = ["w_ger", "w_sz", "w_wetter", "musik", "hg", "fxlaut", "in1_laut", "in2_laut", "mit_laut"];
  const MX_GRENZBAR = MX_STUMMBAR.concat(["boost", "w_leben", "w_spannung"]);
  /* dB je Regler – dieselben Kurven wie in der Bühne; 0 dB = Regler ganz oben */
  const db10 = v => 30 * Math.log10(v / 10);
  const db100 = (e, v) => e * 20 * Math.log10(v / 100);
  const MX_DB = { w_gesamt: v => db100(1.6, v), w_ger: v => db100(1.3, v), w_sz: v => db100(1.3, v), w_wetter: v => db100(1.3, v), musik: db10, hg: db10, fxlaut: db10, in1_laut: v => 32 * Math.log10(v / 100), in2_laut: v => 32 * Math.log10(v / 100), mit_laut: v => 30 * Math.log10(v / 100) };
  /* „Normal“-Stellung je Regler (Strich am Fader) */
  const MX_NORMAL = { w_gesamt: 70, w_ger: 100, w_sz: 100, w_wetter: 100, w_spannung: 0, w_leben: 100, w_raum: 50, w_weite: 45, musik: 8, hg: 5, fxlaut: 8, in1_laut: 80, in2_laut: 80, mit_laut: 70, hall: 5, echohall: 5, balance: 0, boost: 0, in1_pan: 0, in2_pan: 0, in1_pegel: 100, in2_pegel: 100 };
  const dbText = d => !isFinite(d) ? "−∞\u00a0dB" : Math.abs(d) < .05 ? "0\u00a0dB" : d > 0 ? "+" + d.toFixed(1).replace(".", W(",", ".")) + "\u00a0dB" : "−" + (d <= -10 ? Math.round(-d) : (-d).toFixed(1).replace(".", W(",", "."))) + "\u00a0dB";
  let mxRev = null, mxRevN = 0;
  const mxKey = r => { const n = Object.keys(ZP_PARAM).length; if (!mxRev || mxRevN !== n) { mxRev = new Map(); mxRevN = n; Object.keys(ZP_PARAM).forEach(k => mxRev.set(ZP_PARAM[k], k)); } return mxRev.get(r); };
  const mxKlemmen = (k, v) => { const g = MX.grenze[k]; return g != null ? Math.min(v, g) : v; };
  const mxEingangAus = k => /^in[12]_/.test(k) && !(kanalHol(+k[2] - 1) || {}).an;
  ZP_PARAM.balance = { name: W("⚖ Balance", "⚖ Balance"), lo: -10, hi: 10, schritt: 1, neutral: 0, druck: "null", lies: () => MX.bal, setz: v => balanceSetz(v),
    text: v => v === 0 ? W("ausgewogen", "balanced") : v < 0 ? W("mehr Musik ", "more music ") + (-v) : W("mehr Instrument ", "more instrument ") + v };
  /* Balance: dreht Musik und angesteckte Instrumente (samt Mitspielern) gegeneinander */
  function balanceSetz(v) {
    v = Math.max(-10, Math.min(10, Math.round(v))); const d = v - MX.bal; if (!d) return; MX.bal = v; mxMerken();
    const schieb = (k, f) => { const r = ZP_PARAM[k]; if (!r || MX.stumm[k] != null) return; r.setz(mxKlemmen(k, rasten(r.lies() + f * (r.hi - r.lo) / 25, r))); };
    schieb("musik", -d);
    ["in1_laut", "in2_laut", "mit_laut"].forEach(k => { if (k === "mit_laut" ? (typeof MS !== "undefined" && MS.an) : !mxEingangAus(k)) schieb(k, d); });
  }
  /* sanft auf einen Wert fahren */
  const mxBlend = {};
  function mxBlenden(k, ziel, sek, fertig) {
    const r = ZP_PARAM[k]; if (!r) return; if (mxBlend[k]) clearInterval(mxBlend[k].t); delete mxBlend[k];
    const v0 = r.lies(), schritte = Math.max(1, Math.round(sek * 1000 / 50)); let n = 0;
    if (!(sek > 0) || v0 === ziel) { r.setz(ziel); if (fertig) fertig(); zpReglerAnzeige(); return; }
    mxBlend[k] = { ziel, t: setInterval(() => { n++;
      if (n >= schritte) { clearInterval(mxBlend[k].t); delete mxBlend[k]; r.setz(ziel); if (fertig) fertig(); zpZeichnen(true); }
      else r.setz(rasten(v0 + (ziel - v0) * n / schritte, r));
      zpReglerAnzeige(); }, 50) };
  }
  const mxZiel = (k, r) => mxBlend[k] ? mxBlend[k].ziel : r.lies();
  /* stumm / wieder an – sanft (Tippen) oder sofort (Regler drücken); der Wert davor bleibt erhalten */
  function mxStumm(k, sanft) {
    const r = ZP_PARAM[k]; if (!r) return; const sek = sanft ? MX.blend : 0;
    if (MX.stumm[k] != null) {
      const ziel = mxKlemmen(k, MX.stumm[k] > r.lo ? MX.stumm[k] : MX_NORMAL[k] != null ? MX_NORMAL[k] : Math.round((r.lo + r.hi) * .7));
      delete MX.stumm[k]; MX.soloStumm = (MX.soloStumm || []).filter(x => x !== k); mxMerken(); mxBlenden(k, ziel, sek);
      zeige((sanft ? "↗ " : "🔊 ") + r.name, null, sanft ? W("blendet ein …", "fading in …") : W("wieder an", "back on"));
    } else {
      const v = mxZiel(k, r);
      if (v <= r.lo) { const ziel = mxKlemmen(k, MX_NORMAL[k] != null ? MX_NORMAL[k] : Math.round((r.lo + r.hi) * .7)); mxBlenden(k, ziel, sek); zeige((sanft ? "↗ " : "🔊 ") + r.name); }
      else { MX.stumm[k] = v; mxMerken(); mxBlenden(k, r.lo, sek); zeige((sanft ? "↘ " : "🔇 ") + r.name, null, sanft ? W("blendet aus …", "fading out …") : W("stumm", "muted")); }
    }
    zpZeichnen(true);
  }
  /* Solo: nur diesen Weg hören – die anderen Quellen werden kurz stumm, nochmal halten holt sie zurück */
  function mxSoloAus() {
    (MX.soloStumm || []).forEach(q => { if (MX.stumm[q] != null) { const z = mxKlemmen(q, MX.stumm[q]); delete MX.stumm[q]; mxBlenden(q, z, .3); } });
    MX.solo = null; MX.soloStumm = []; mxMerken();
  }
  function mxSolo(k) {
    if (!MX_QUELLEN.includes(k)) { zeige("🎧 Solo", null, SEITE === "welten" ? W("geht für Geräusche, Szenen und Wetter", "works for sounds, scenes and weather") : W("geht für Musik, Hintergrund, Effekte, IN1, IN2 und Mitspieler", "works for music, backdrop, effects, IN1, IN2 and ensemble")); return; }
    const war = MX.solo; if (war) mxSoloAus();
    if (war === k) { zeige("🎧 " + W("Solo aus", "Solo off")); zpZeichnen(true); return; }
    MX.solo = k; MX.soloStumm = [];
    MX_QUELLEN.forEach(q => { const r = ZP_PARAM[q]; if (q === k || !r || (SEITE === "welten") !== /^w_/.test(q) || MX.stumm[q] != null || mxEingangAus(q) || (q === "mit_laut" && !(typeof MS !== "undefined" && MS.an))) return; const v = mxZiel(q, r); if (v <= r.lo) return; MX.stumm[q] = v; MX.soloStumm.push(q); mxBlenden(q, r.lo, .3); });
    mxMerken(); if (MX.stumm[k] != null) mxStumm(k, false);
    zeige("🎧 Solo: " + ZP_PARAM[k].name, null, W("nochmal halten: Solo aus", "hold again: solo off")); zpZeichnen(true);
  }
  /* zwei Mischungen (A · Probe / B · Auftritt): die jetzige wird beim Umschalten gemerkt */
  /* Bühne und Klangwelten haben je ihre eigenen Mischungen A/B */
  const mxAbAkt = () => (SEITE === "welten" ? MX.wab : MX.ab) || "A", mxAbSetz = x => { if (SEITE === "welten") MX.wab = x; else MX.ab = x; }, mxAbSlot = x => (SEITE === "welten" ? "w" : "") + x;
  const MX_AB_NAME = { A: W("A · Probe", "A · rehearsal"), B: W("B · Auftritt", "B · gig") };
  const mxAbKeys = () => [...new Set(mixListe())].filter(k => ZP_PARAM[k] && ZP_PARAM[k].schritt && !/^karte_|_pegel$/.test(k) && k !== "balance" && k !== "w_spannung");
  function mxSchnapp() { const w = {}; mxAbKeys().forEach(k => { w[k] = MX.stumm[k] != null ? MX.stumm[k] : mxZiel(k, ZP_PARAM[k]); }); return { w, stumm: Object.keys(MX.stumm).filter(k => w[k] != null), bal: MX.bal }; }
  function mxAB(ziel) {
    ziel = ziel || (mxAbAkt() === "A" ? "B" : "A"); if (ziel === mxAbAkt()) { zeige("🎚 " + MX_AB_NAME[ziel], null, W("ist schon aktiv", "already active")); return; }
    if (MX.solo) mxSoloAus();
    MX[mxAbSlot(mxAbAkt())] = mxSchnapp(); const s = MX[mxAbSlot(ziel)]; mxAbSetz(ziel);
    if (s && s.w) {
      Object.keys(s.w).forEach(k => { const r = ZP_PARAM[k]; if (!r) return; const st = (s.stumm || []).includes(k); if (st) MX.stumm[k] = s.w[k]; else delete MX.stumm[k]; mxBlenden(k, st ? r.lo : mxKlemmen(k, s.w[k]), 1); });
      MX.bal = s.bal || 0; zeige("🎚 " + MX_AB_NAME[ziel], null, W("Mischung geladen", "mix loaded"));
    } else { MX[mxAbSlot(ziel)] = mxSchnapp(); zeige("🎚 " + MX_AB_NAME[ziel] + W(" angelegt", " created"), null, W("übernimmt die jetzige Mischung – ab jetzt merkt sie sich deine Änderungen", "starts from the current mix – remembers your changes from now on")); }
    mxMerken(); zpZeichnen(true); ledsMelden();
  }
  /* Pegelanzeige im Mischer */
  const mxSpitze = {}, mxClip = {};
  setInterval(() => {
    if (!panelAktiv() || zpRuhe || document.hidden || !zpEl) return; const P = SEITE === "welten" ? WA() : window.ImresPult; if (!P || !P.pegel) return;
    let p; try { p = P.pegel(); } catch (_) { return; } if (!p) return; const mi = mischAktiv(), ks = mi ? mixKeys() : [], pl = mi ? null : panelListe(), jetzt = Date.now();
    $$(".zp-mf", zpEl).forEach((el, i) => { const b = el.querySelector(".pm b"); if (!b) return; const k = ks[i], q = mi ? MX_MESS[mxGruppe(k)] : null, wb = pl && pl[i] ? pl[i].wBett : null;
      const s = q ? p[q] || 0 : wb != null ? (p.betten || [])[wb] || 0 : 0, neu = Math.max(s, (mxSpitze[i] || 0) * .8); mxSpitze[i] = neu;
      const d = neu > 1e-5 ? 20 * Math.log10(neu) : -99; b.style.height = (100 - Math.max(0, Math.min(100, (d + 48) / 48 * 100))) + "%";
      if ((q || wb != null) && (q === "gesamt" ? p.begrenzt > 4 : s >= .99)) mxClip[i] = jetzt; el.classList.toggle("clip", jetzt - (mxClip[i] || 0) < 1200); });
  }, 60);
  /* Einstellungen des Mischers: Anzeige, Blendzeit, Mischungen, Obergrenzen */
  function mxMenue(fokusK) {
    const zz = (id, t, w, u) => '<button type="button" data-zm="' + id + '">' + t + (w != null ? "<b>" + w + "</b>" : "") + (u ? "<small>" + u + "</small>" : "") + "</button>";
    const neu = id => () => mxMenue(id), BL = [1, 2.5, 5];
    const gText = k => { const r = ZP_PARAM[k], g = MX.grenze[k]; if (g == null) return W("frei", "free"); return "🔒 " + W("bis ", "max ") + (MX.db && MX_DB[k] ? (g <= r.lo ? "−∞ dB" : dbText(MX_DB[k](g))) : r.text ? r.text(g) : Math.round(proz(g, r.lo, r.hi) * 100) + " %"); };
    const a = { zu: menueZu,
      db: () => { MX.db = !MX.db; mxMerken(); zpZeichnen(true); neu("db")(); },
      blend: () => { MX.blend = BL[(BL.indexOf(MX.blend) + 1) % BL.length]; mxMerken(); neu("blend")(); },
      ab: () => { mxAB(); neu("ab")(); },
      alle: () => { MX_QUELLEN.concat(["w_gesamt", "karte_haupt", "karte_kh", "boost"]).filter(k => (SEITE === "welten") === /^w_|^karte_/.test(k)).forEach(k => { const r = ZP_PARAM[k]; if (r && !mxEingangAus(k) && !(k === "mit_laut" && !(typeof MS !== "undefined" && MS.an))) MX.grenze[k] = MX.stumm[k] != null ? MX.stumm[k] : mxZiel(k, r); }); mxMerken(); zeige("🔒 " + W("Grenzen = jetzige Stellung", "Limits = current position")); neu("alle")(); },
      frei: () => { MX.grenze = {}; mxMerken(); zeige("🔓 " + W("Alle Grenzen aufgehoben", "All limits cleared")); neu("frei")(); } };
    let h = zz("db", "📏 " + W("Anzeige: ", "Display: "), MX.db ? "dB" : "%", W("dB: 0 = Regler ganz oben, −6 dB = halb so laut", "dB: 0 = knob at top, −6 dB = half as loud")) +
      zz("blend", "↘ " + W("Sanft blenden: ", "Fade time: "), String(MX.blend).replace(".", W(",", ".")) + " s", W("Tippen auf einen Kanal blendet so lange aus / ein", "tapping a channel fades out / in this long")) +
      zz("ab", "🎚 " + W("Mischung: ", "Mix: "), MX_AB_NAME[mxAbAkt()], W("umschalten (im Mischer auch mit ◀ ▶)", "switch (in the mixer also ◀ ▶)")) +
      '<p class="hinweis">🔒 ' + W("Obergrenzen – höher lässt sich der Regler nicht drehen. Antippen: jetzige Stellung / frei · ◀ ▶ verschieben", "Upper limits – the knob won't go higher. Tap: current position / free · ◀ ▶ move") + "</p>";
    MX_GRENZBAR.forEach(k => { const r = ZP_PARAM[k]; if (!r || (SEITE === "welten") !== /^w_|^karte_/.test(k) || (/^in[12]_/.test(k) && mxEingangAus(k) && MX.grenze[k] == null) || (k === "mit_laut" && !(typeof MS !== "undefined" && MS.an) && MX.grenze[k] == null)) return;
      h += zz("g:" + k, r.name + ": ", gText(k));
      a["g:" + k] = () => { if (MX.grenze[k] != null) delete MX.grenze[k]; else MX.grenze[k] = MX.stumm[k] != null ? MX.stumm[k] : mxZiel(k, r); mxMerken(); neu("g:" + k)(); };
      a["g:" + k + ":stufe"] = st => { const g = MX.grenze[k] != null ? MX.grenze[k] : r.hi; const ng = rasten(g + st * Math.max(r.schritt, (r.hi - r.lo) / 20), r); MX.grenze[k] = ng;
        const v = mxZiel(k, r); if (MX.stumm[k] == null && v > ng) mxBlenden(k, ng, .3); if (MX.stumm[k] != null && MX.stumm[k] > ng) MX.stumm[k] = ng; mxMerken(); neu("g:" + k)(); }; });
    h += zz("alle", "🔒 " + W("Alle Lautstärken: jetzige Stellung als Grenze", "All levels: current position as limit"), null, W("Musik, Hintergrund, Effekte, Instrumente, Gesamt, Boost", "music, backdrop, effects, instruments, master, boost")) + zz("frei", "🔓 " + W("Alle Grenzen aufheben", "Clear all limits"));
    const m = menue("<h3>🎚 " + W("Mischer", "Mixer") + '</h3><div class="reihe zyn-opt">' + h + '<button type="button" data-zm="zu">✕ ' + W("Fertig", "Done") + "</button></div>", a);
    menueArt = "mischer"; if (fokusK) { const b = m.querySelector('[data-zm="' + fokusK + '"]'); if (b) fokusSetzen(b); }
  }
  const mischAktiv = () => mischAn && (SEITE === "buehne" || SEITE === "welten");
  const spurAktiv = () => spurAn && (SEITE === "buehne" ? !!(window.ImresPult && window.ImresPult.spurMix) : !!WA());
  const panelAktiv = () => mischAktiv() || spurAktiv();
  const panelReihe = () => (reiheTipp != null ? reiheTipp : alt) ? 1 : 0;
  function mischer(an) {
    mischAn = an == null ? !mischAn : an; if (mischAn) spurAn = false; if (mischAn && typeof karteLaden === "function") karteLaden(true);
    if (mischAn) zeige("🎚 " + W("Mischpult", "Mixer") + " · " + MX_AB_NAME[mxAbAkt()], null, W("Tippen: sanft aus/an · halten: Solo · ziehen: Lautstärke · ◀ ▶: Mischung A/B", "tap: fade out/in · hold: solo · drag: level · ◀ ▶: mix A/B"));
    zpZeichnen(true); ledsMelden();
  }
  /* Spur-Fenster (ZS3): jede Spur der jetzigen Stimmung einzeln, dazu Kulisse und Begleit-Schichten */
  function spurFenster(an) {
    if (SEITE === "buehne" ? !(window.ImresPult && window.ImresPult.spurMix) : !WA()) { zeige(W("Spuren gibt es hier nicht", "No tracks here")); return; }
    spurAn = an == null ? !spurAn : an; if (spurAn) { mischAn = false; spurSeite = 0; if (SEITE === "welten") { const m = wMix(); zeige("🎛 " + (m && m.welt ? m.welt.sym + " " + m.welt.name : W("Schichten", "Layers")), null, m && m.welt ? W("Regler 1–4 · mit ALT die zweite Reihe · ◀ ▶ weitere · drücken: aus/an", "knobs 1–4 · ALT: second row · ◀ ▶ more · push: off/on") : W("erst eine Klangwelt wählen", "choose a soundscape first")); } else zeige("🎛 " + (ortFenster() ? W("Spuren des Ortes", "Place layers") : W("Spuren der Stimmung", "Mood tracks")), null, W("Regler 1–4 · mit ALT die zweite Reihe · ◀ ▶ weitere · drücken: stumm", "knobs 1–4 · ALT: second row · ◀ ▶ more · push: mute")); }
    zpZeichnen(true); ledsMelden();
  }
  const SPUR_SYM = { klopf: "✊", schelle: "🔔", bass: "🎸", melodie: "🎵", trommel: "🥁", floete: "🪈", ketten: "⛓", rex: "🐕", orch: "🎻", kap: "🎺", gast: "🎭" };
  const spurMerk = () => { try { return JSON.parse(lies("imres-zp-spurmix", "{}")) || {}; } catch (_) { return {}; } };
  /* Grundwert je Spur (vor der ersten Änderung im Spur-Fenster) – Stimmungen ohne eigene Einstellung bekommen ihn zurück */
  const spurGrund = () => { try { return JSON.parse(lies("imres-zp-spurgrund", "{}")) || {}; } catch (_) { return {}; } };
  function spurMerken(k, v, stumm) {
    const P = window.ImresPult, st = (P && P.spurMix().stimmung) || "_"; const m = spurMerk(); m[st] = m[st] || {};
    const g = spurGrund(); if (!g[k] && !m[st][k]) { const y = P.spurMix().spuren.find(z => z.id === k); if (y) { g[k] = { v: spurVorher[k] != null ? spurVorher[k] : y.vol, s: false }; schreib("imres-zp-spurgrund", JSON.stringify(g)); } }
    m[st][k] = { v, s: !!stumm }; schreib("imres-zp-spurmix", JSON.stringify(m));
  }
  const spurVorher = {};
  const ortFenster = () => zpSeite === "ort";
  const ortMerk = {};
  function ortKanaele() {
    const P = window.ImresPult; if (!P || !P.ortMix) return [];
    const m = P.ortMix(), l = [Object.assign({}, ZP_PARAM.hg, { name: "🌲 " + W("Kulisse gesamt", "Backdrop total") })];
    const prozent = v => Math.round(v * 100) + " %";
    m.schichten.forEach(x => l.push({ name: (x.i === "ev" ? "✨ " : "🌿 ") + x.name, lo: 0, hi: 20, schritt: 1,
      lies: () => Math.round(P.ortSpur(x.i) * 10), setz: v => P.ortSpur(x.i, v / 10), text: v => v ? prozent(v / 10) : W("🔇 aus", "🔇 off"),
      aktion: () => { const k = "s" + x.i, v = P.ortSpur(x.i); if (v > 0) { ortMerk[k] = v; P.ortSpur(x.i, 0); zeige("🔇 " + x.name); } else { P.ortSpur(x.i, ortMerk[k] || 1); zeige("🔊 " + x.name); } }, drucktext: W("drücken: aus/an", "push: off/on") }));
    m.zus.forEach(x => l.push({ name: "🌦 " + x.name, lo: 0, hi: 20, schritt: 1,
      lies: () => Math.round(P.zusVol(x.id) * 10), setz: v => P.zusVol(x.id, v / 10), text: v => v ? prozent(v / 10) : W("🔇 aus", "🔇 off"),
      aktion: () => { const k = "z" + x.id, v = P.zusVol(x.id); if (v > 0) { ortMerk[k] = v; P.zusVol(x.id, 0); } else P.zusVol(x.id, ortMerk[k] || 1); }, drucktext: W("drücken: aus/an", "push: off/on") }));
    return l;
  }
  function spurKanaele() {
    if (SEITE === "welten") return weltKanaele();
    if (ortFenster()) return ortKanaele();
    const P = window.ImresPult; if (!P || !P.spurMix) return [];
    const m = P.spurMix(), l = [Object.assign({}, ZP_PARAM.hg, { name: "🌲 " + W("Kulisse", "Backdrop") })];
    m.spuren.forEach(x => l.push({ name: (SPUR_SYM[x.id] || "") + " " + x.name, lo: 0, hi: 9, schritt: 1,
      lies: () => { const y = P.spurMix().spuren.find(z => z.id === x.id) || {}; return y.stumm ? 0 : y.vol; },
      setz: v => { if (spurVorher[x.id] == null) spurVorher[x.id] = P.spurVol(x.id); P.spurVol(x.id, v); spurMerken(x.id, v, false); },
      text: v => { const y = P.spurMix().spuren.find(z => z.id === x.id) || {}; return y.stumm ? W("🔇 stumm", "🔇 muted") : Math.round(v / 9 * 100) + " %"; },
      aktion: () => { const st = P.spurStumm(x.id); spurMerken(x.id, P.spurVol(x.id), st); zeige((st ? "🔇 " : "🔊 ") + x.name); }, drucktext: W("drücken: stumm", "push: mute") }));
    m.schichten.forEach(x => l.push({ name: SPUR_SYM[x.id] + " " + x.name, lo: 0, hi: 10, schritt: 1,
      lies: () => P.schicht(x.id), setz: v => P.schicht(x.id, v),
      text: v => (x.an ? "" : W("(gerade aus) ", "(off now) ")) + v * 20 + " %", aktion: () => { P.schicht(x.id, 5); }, drucktext: W("drücken: normal", "push: normal") }));
    return l;
  }
  function panelListe() {
    if (mischAktiv()) return mixKeys().map(k => ZP_PARAM[k] || ZP_PARAM.nichts);
    const k = spurKanaele(), seiten = Math.max(1, Math.ceil(k.length / 8)); spurSeite = Math.min(spurSeite, seiten - 1);
    return Array.from({ length: 8 }, (_, i) => k[spurSeite * 8 + i] || ZP_PARAM.nichts);
  }
  const spurSeiten = () => Math.max(1, Math.ceil(spurKanaele().length / 8));
  /* gespeicherte Spur-Lautstärken wieder anwenden, sobald eine Stimmung geladen wird */
  let spurLetzteSt = null;
  setInterval(() => { const P = window.ImresPult; if (!P || !P.spurMix || SEITE !== "buehne") return; const st = P.spurMix().stimmung || "_"; if (st === spurLetzteSt) return; spurLetzteSt = st;
    const m = spurMerk()[st] || {}, g = spurGrund();
    setTimeout(() => { Object.keys(g).forEach(k => { if (!m[k]) { P.spurVol(k, g[k].v); P.spurStumm(k, false); } });
      Object.keys(m).forEach(k => { P.spurVol(k, m[k].v); P.spurStumm(k, !!m[k].s); }); }, 700); }, 1000);
  function zpRegler() {
    if (panelAktiv()) { const r = panelReihe(); return panelListe().slice(r * 4, r * 4 + 4); }
    if (SEITE === "welten" && zpSeite === "raum") return RAUM_REGLER;
    if (SEITE === "welten") return W_REGLER[bank % 2].map((r, i) => Object.assign({ druck: i === 0 ? "stumm" : i === 1 ? "friedlich" : "mitte" }, r));
    if (zpSeite === "beats" && !bank) return beatsRegler();
    if (zpSeite === "beats" && bank === 1) return beatsHuelleRegler();
    const l = bank ? ZB.regler[bankName()] : ZB.regler["A:" + (zpSeite === "set" ? "stimmung" : zpSeite)];
    return (l || []).slice(0, 4).map(k => ZP_PARAM[k] || ZP_PARAM.nichts);
  }
  const DRUCK_TEXT = { stumm: W("drücken: stumm", "push: mute"), hg: W("drücken: an/aus", "push: on/off"), friedlich: W("drücken: friedlich", "push: peaceful"), mitte: W("drücken: Mitte", "push: centre"), null: W("drücken: neutral", "push: reset") };
  function zpWert(r) { const v = r.lies(), k = mxKey(r); let text = r.text ? r.text(v) : r.wort ? r.wort(v) : Math.round(proz(v, r.lo, r.hi) * 100) + " %";
    if (k && MX.stumm[k] != null) text = "🔇 " + W("stumm", "muted");
    else if (k === "w_wetter" && SEITE === "welten" && !(wMix() || {}).wetter) text = "☀ " + W("kein Wetter", "no weather");
    else if (k && MX.db && MX_DB[k] && !mxEingangAus(k)) text = v <= r.lo ? "−∞ dB" : dbText(MX_DB[k](v));
    return { v, anteil: Math.max(0, Math.min(1, proz(v, r.lo, r.hi))), text }; }
  /* Regler gedrückt halten und drehen: anderen Effekt (bzw. Wert) auf diesen Regler legen */
  const drehGedrueckt = {}, drehGedreht = {};
  function zpParamZyklus(nr, d) {
    if ((SEITE === "welten" && !mischAktiv()) || spurAktiv()) return;
    const slot = mischAktiv() ? mixSlot() : bank ? bankName() : "A:" + (zpSeite === "set" ? "stimmung" : zpSeite), bn = bankName(), liste = mischAktiv() ? mixListe() : bn === "MIT" ? ["mit_stufe", "mit_laut", "mit_hall", "mit_empf", "mit_okt"] : /^IN[12]$/.test(bn) ? KANAL_FELDER.map(x => bn.toLowerCase() + "_" + x[0]) : bn === "FX" ? FX_PARAMS : NORMAL_PARAMS.concat(FX_PARAMS);
    const l = (ZB.regler[slot] || (mischAktiv() ? mixStd() : ["nichts", "nichts", "nichts", "nichts"])).slice();
    if (mischAktiv()) { for (let x = 0; x < 8; x++) if (!l[x]) l[x] = mixStd()[x]; nr += panelReihe() * 4; }
    const jetzt = l[nr], i = liste.indexOf(jetzt);
    l[nr] = liste[((i < 0 ? 0 : i + (d > 0 ? 1 : -1)) + liste.length) % liste.length]; ZB.regler[slot] = l; belegMerken();
    zeige("⇄ " + W("Regler ", "Knob ") + (nr % 4 + 1) + (nr > 3 ? " (ALT)" : "") + ": " + (ZP_PARAM[l[nr]] || ZP_PARAM.nichts).name, null, W("loslassen zum Behalten", "release to keep")); zpZeichnen(true);
  }
  /* Regler-Loops: Bewegungen aufnehmen und im Takt wiederholen */
  const loopTakte = () => { const v = +lies("imres-zp-looplen", "2"); return [1, 2, 4, 8].includes(v) ? v : 2; };
  const LOOPS = {};
  const loopSchluessel = r => r.name;
  function loopUmschalten(nr) {
    const r = zpRegler()[nr]; if (!r || !r.schritt) return; const k = loopSchluessel(r);
    if (LOOPS[k]) { delete LOOPS[k]; zeige("⟳ " + r.name, null, W("Loop aus", "loop off")); }
    else { LOOPS[k] = { r, phase: "wartet", ev: [] }; zeige("⏺ " + r.name, null, W("jetzt drehen – ", "turn now – ") + loopTakte() + W(" Takte werden aufgenommen", " bars get recorded")); }
    zpZeichnen(true);
  }
  function loopMitschreiben(r, v) {
    const L = LOOPS[loopSchluessel(r)]; if (!L) return; const jetzt = performance.now();
    if (L.phase === "wartet" || L.phase === "spielt") { const z = pz() || {}, bpm = z.tempoJetzt || z.tempo || 100; L.phase = "nimmt"; L.start = jetzt; L.len = loopTakte() * 4 * 60000 / bpm; L.ev = [{ t: 0, v }]; L.letzt = v; return; }
    if (L.phase === "nimmt") L.ev.push({ t: jetzt - L.start, v });
  }
  setInterval(() => {
    const jetzt = performance.now();
    Object.keys(LOOPS).forEach(k => { const L = LOOPS[k];
      if (L.phase === "nimmt" && jetzt - L.start >= L.len) { L.phase = "spielt"; zeige("⟳ " + L.r.name, null, W("läuft im Loop – ALT + Regler drücken stoppt", "looping – ALT + push knob stops")); }
      if (L.phase !== "spielt" || !L.ev.length) return;
      const ph = (jetzt - L.start) % L.len; let v = L.ev[L.ev.length - 1].v; for (const e of L.ev) { if (e.t <= ph) v = e.v; else break; }
      if (v !== L.letzt) { L.letzt = v; try { L.r.setz(v); } catch (_) {} } });
  }, 25);
  function zpDreh(nr, d) {
    const beatsRg = zpSeite === "beats" && bank < 2 && !panelAktiv();
    if (drehGedrueckt[nr] && !beatsRg) { drehGedreht[nr] = true; zpParamZyklus(nr, d); return; }
    const r = zpRegler()[nr]; if (!r || !r.schritt) return; const f = drehFaktor("zp" + nr + ":" + r.name, d, (r.hi - r.lo) / r.schritt >= 40);
    const mk = mxKey(r); if (mk && (MX.stumm[mk] != null || mxBlend[mk])) { if (mxBlend[mk]) { clearInterval(mxBlend[mk].t); delete mxBlend[mk]; } if (MX.stumm[mk] != null) { delete MX.stumm[mk]; MX.soloStumm = (MX.soloStumm || []).filter(x => x !== mk); mxMerken(); zpZeichnen(true); } }
    const v0 = r.lies(); let v = rasten(v0 + d * r.schritt * f, r);
    if (mk && MX.grenze[mk] != null && d > 0 && v > Math.max(MX.grenze[mk], v0)) { v = Math.max(MX.grenze[mk], v0); if (v === v0) zeige("🔒 " + r.name, null, W("Obergrenze erreicht (MENU → Einstellungen → Mischer)", "upper limit reached (MENU → settings → mixer)")); }
    if (v !== v0) r.setz(v); loopMitschreiben(r, v);
    if (beatsRg) zpZeichnen(true); else zpReglerAnzeige();
  }
  let reglerRaf = 0;
  function zpReglerAnzeige() {
    if (reglerRaf) return;
    reglerRaf = requestAnimationFrame(() => { reglerRaf = 0; const rs = zpRegler();
      $$(".zp-r", zpEl).forEach((el, i) => { const r = rs[i]; if (!r) return; const w = zpWert(r), b = el.querySelector("i b"), t = el.querySelector(".zp-rv > span"); if (b) b.style.width = Math.round(w.anteil * 100) + "%"; if (t) t.textContent = w.text; });
        const pl = panelAktiv() ? panelListe() : []; $$(".zp-mf", zpEl).forEach((el, i) => { const r = pl[i]; if (!r || r === ZP_PARAM.nichts) return; const w = zpWert(r), b = el.querySelector("i b"), t = el.querySelector("em"); if (b) b.style.height = Math.round(w.anteil * 100) + "%"; if (t) t.textContent = w.text; }); });
  }
  function zpDruck(nr) {
    if (mischAktiv()) { const k = mixKeys()[panelReihe() * 4 + nr]; if (MX_STUMMBAR.includes(k)) { mxStumm(k, false); return; } }
    const r = zpRegler()[nr]; if (r && r.aktion) { r.aktion(); zpZeichnen(true); return; } if (!r || !r.schritt) return; const k = bank + "-" + zpSeite + "-" + nr;
    if (r.druck === "stumm") { const v = r.lies(); if (v > r.lo) { merkStumm[k] = v; r.setz(r.lo); zeige("🔇 " + r.name); } else { r.setz(merkStumm[k] != null ? merkStumm[k] : Math.round((r.lo + r.hi) * .7)); zeige("🔊 " + r.name); } }
    else if (r.druck === "hg") { pultKlick("data-aktion", "kulumschalt"); zeige("🌲 " + W("Hintergrund an / aus", "Backdrop on / off")); }
    else if (r.druck === "friedlich") r.setz(r.lo);
    else if (r.druck === "null") { r.setz(r.neutral); zeige(r.name + " · " + W("neutral", "reset")); }
    else r.setz(Math.round(((r.lo + r.hi) / 2) / r.schritt) * r.schritt);
    zpZeichnen(true);
  }
  function bankWeiter(s) { const n = SEITE === "welten" ? 2 : BANKEN.length; bank = (bank + (s || 1) + n) % n; weltenMischBereit(); zeige("⟲ " + W("Reglerbank ", "Knob bank ") + (SEITE === "welten" ? (bank ? "B" : "A") : bankName()), null, zpRegler().map(r => r.name).join(" · ")); zpZeichnen(true); ledsMelden(); }
  /* Aktionen auf Tasten */
  const fxSetz = (k, v) => { if (window.ImresPult && window.ImresPult.fx) window.ImresPult.fx(k, v); };
  const haltenMerk = {};
  function zpHalten(id, an) {
    const w = PFX(); if (!w) return;
    if (an) {
      haltenMerk[id] = { filter: w.filter, reso: w.reso, echo: w.echo, rueck: w.rueck, crush: w.crush, rate: w.rate };
      if (id === "stotter" || id === "rueckwaerts" || id === "bandstop") fxSetz(id, 1);
      if (id === "crushhalt") { fxSetz("crush", 85); fxSetz("rate", 45); }
      if (id === "filterzu") { fxSetz("filter", -88); fxSetz("reso", Math.max(w.reso, 40)); }
      if (id === "filterhoch") { fxSetz("filter", 80); fxSetz("reso", Math.max(w.reso, 35)); }
      if (id === "echowurf") { fxSetz("echo", 90); fxSetz("rueck", 72); }
      zeige(ZP_AKT[id][0]);
    } else {
      const m = haltenMerk[id]; if (!m) return; delete haltenMerk[id];
      if (id === "echowurf") { fxSetz("echo", m.echo); setTimeout(() => fxSetz("rueck", m.rueck), 1500); }
      else if (id === "stotter" || id === "rueckwaerts" || id === "bandstop") fxSetz(id, 0);
      else if (id === "crushhalt") { fxSetz("crush", m.crush); fxSetz("rate", m.rate); }
      else { fxSetz("filter", m.filter); fxSetz("reso", m.reso); }
    }
    zpZeichnen(true);
  }
  function zpAktion(id) {
    const z = pz();
    switch (id) {
      case "play": if (SEITE === "welten") klick($("#spielen")); else musikSpielen(); setTimeout(() => zpZeichnen(true), 150); return true;
      case "stop": allesStopp(); return true;
      case "passiert": if (SEITE === "welten") { const l = sichtbare("[data-ger]"); const el = l[Math.floor(Math.random() * l.length)] || $$("[data-ger]")[0]; if (el) { klick(el); zeige("🎭 " + kurzName(el)); } } else { pultKlick("data-aktion", "passiert"); zeige("⚡ " + W("Etwas passiert", "Something happens")); } return true;
      case "stille": if (SEITE === "welten") { const l = $$("[data-szene]"); const el = l[Math.floor(Math.random() * l.length)]; if (el) { klick(el); zeige("⏳ " + kurzName(el)); } } else { pultKlick("data-aktion", "stille"); zeige("🤫 " + W("Stille", "Silence")); } return true;
      case "neubesetzen": if (SEITE === "welten") return false; pultKlick("data-aktion", "neubesetzen"); zeige("🎲 " + W("Neu besetzen – beim nächsten Teil", "Re-cast – at the next part")); return true;
      case "sprechen": if (SEITE === "welten") return false; pultKlick("data-aktion", "sprechen"); zeige("🎙 " + W("Sprich jetzt …", "Speak now …")); return true;
      case "aufnahme": aufnahme(); return true;
      case "takt": { const l = ["aus", "slave", "master"], n = l[(l.indexOf(OPT.takt) + 1) % 3]; optSetzen({ takt: n }); zeige("⏱ MIDI-Takt: " + TAKT_NAME[n]); return true; }
      case "seite_vor": zpSeiteSchritt(1); return true;
      case "seite_zurueck": zpSeiteSchritt(-1); return true;
      case "bank": bankWeiter(); return true;
      case "mischer": mischer(); return true;
      case "spurmix": spurFenster(); return true;
      case "beats": if (SEITE !== "buehne") return false; mischAn = false; if (zpSeite === "beats") zpSeiteSetzen(vorBeats); else { vorBeats = zpSeite; zpSeiteSetzen("beats"); zeige("🥁 Drumpad", null, W("◀▶ Schritt · ▲▼ Spur · SEL/F1–F4 setzen · PAD spielt · ALT+PAD: zurück", "◀▶ step · ▲▼ track · SEL/F1–F4 set · PAD plays · ALT+PAD: back")); } return true;
      case "hg": if (SEITE === "welten") return false; pultKlick("data-aktion", "kulumschalt"); zeige("🌲 " + W("Hintergrund an / aus", "Backdrop on / off")); return true;
      case "fx_aus": if (SEITE === "welten") return false; ["filter", "echo", "drive", "crush", "rate", "ring", "flanger", "gate", "wobble"].forEach(k => fxSetz(k, 0)); zeige("✨ " + W("Effekte zurückgesetzt", "Effects reset")); zpZeichnen(true); return true;
      case "tap": if (SEITE === "welten") return false; tapTempo(); return true;
      case "autopilot": autoSetzen(AUTO_STUFEN[(AUTO_STUFEN.indexOf(autoModus) + 1) % AUTO_STUFEN.length]); return true;
      case "set_weiter": if (SEITE === "welten" || !SET.length) return true; setLaden(Math.min(SET.length - 1, setIndex + 1)); return true;
      case "mixab": mxAB(); return true;
      case "set_zurueck": if (SEITE === "welten" || !SET.length) return true; setLaden(Math.max(0, setIndex - 1)); return true;
      case "nichts": return true;
    }
    return false;
  }

  /* ----- Seiten wechseln ----- */
  function zpSeiteSetzen(id) {
    if (!ZP_SEITEN.some(x => x.id === id)) return;
    zpSeite = id; schreib("imres-zp-seite-" + SEITE, id); zpCursor = -1; zpZeichnen(true); ledsMelden();
  }
  /* Modus wechseln: Bühnen-Pult · Klangwelten · Beat-Builder (alle Regler der Webseite) */
  function zpModus(m) {
    menueZu();
    if (m === "beat") { schreib("imres-zyn-pult", "0"); schreib("imres-lw-modus", "alles"); schreib("imres-zyn-modus", "buehne"); zeige("🥁 Beat-Builder", null, W("wird geladen …", "loading …")); setTimeout(() => seiteLaden("buehne"), 120); return; }
    schreib("imres-zyn-pult", "1"); schreib("imres-lw-modus", "einfach");
    const ziel = m === "welten" ? "welten" : "buehne"; schreib("imres-zyn-modus", ziel);
    if (ziel === SEITE) return;
    zeige(ziel === "welten" ? "🌿 " + W("Klangwelten", "Soundscapes") : "🎻 " + W("Bühnen-Pult", "Stage console"), null, W("wird geladen …", "loading …")); setTimeout(() => seiteLaden(ziel), 120);
  }
  function zpModusMenue() {
    const k = (f, t, u, id, an) => '<button type="button" data-zm="' + id + '" class="' + (an ? "an" : "") + '"><span><span class="kbd">' + f + "</span>" + t + "</span><small>" + u + "</small></button>";
    menue("<h3>🎭 " + W("Modus", "Mode") + '</h3><div class="reihe">' +
      k("F1", "🎻 " + W("Bühnen-Pult", "Stage console"), W("Stimmungen, Orte, Momente, Effekte – für den Spielabend", "moods, places, moments, effects"), "buehne", SEITE === "buehne") +
      k("F2", "🌿 " + W("Klangwelten", "Soundscapes"), W("reine Geräuschkulissen, Szenen, Geräusche nach Ort", "pure ambience, scenes, sounds by place"), "welten", SEITE === "welten") +
      k("F3", "🥁 Beat-Builder", W("alle Regler und Spuren (Webseite, mit Pfeilen + SEL)", "all controls and tracks (web page)"), "beat", false) +
      '<button type="button" data-zm="zu">✕ ' + W("Schließen", "Close") + "</button></div>" +
      '<p class="hinweis">' + W("Ein Wechsel beendet, was gerade im anderen Modus spielt.", "Switching stops what plays in the other mode.") + "</p>",
      { buehne: () => zpModus("buehne"), welten: () => zpModus("welten"), beat: () => zpModus("beat"), zu: menueZu });
    menueArt = "zpmodus";
  }
  function zpSeiteSchritt(s) { const i = ZP_SEITEN.findIndex(x => x.id === zpSeite); zpSeiteSetzen(ZP_SEITEN[(i + s + ZP_SEITEN.length) % ZP_SEITEN.length].id); }
  function zpBlaettern(s) { const n = zpListe.length; if (n < 2) return false; zpBlatt[zpSeite] = ((zpBlatt[zpSeite] || 0) + s + n) % n; zpZeichnen(true); const b = zpBlattJetzt(); zeige((b[0] && b[0].gruppe) || "", null, (zpBlatt[zpSeite] + 1) + " / " + n); return true; }
  function zpGruppeSchritt(s) {
    if (zpGruppen.length < 2) return; const bi = zpBlatt[zpSeite] || 0;
    let gi = 0; zpGruppen.forEach((g, i) => { if (g.ab <= bi) gi = i; });
    const ziel = zpGruppen[(gi + s + zpGruppen.length) % zpGruppen.length]; zpBlatt[zpSeite] = ziel.ab; zpCursor = -1; zpZeichnen(true); zeige(ziel.titel);
  }
  function zpFavUmschalten(i) {
    const it = zpBlattJetzt()[i]; if (!it || !it.key) return;
    if (zpSeite === "set") { const nr = +String(it.key).slice(4); if (SET[nr]) setMenue(nr); return; }
    const l = favListe().slice(), j = l.indexOf(it.key);
    if (j >= 0) { l.splice(j, 1); zeige("☆ " + it.name, null, W("kein Favorit mehr", "no longer a favourite")); } else { l.push(it.key); zeige("★ " + it.name, null, W("Favorit – steht jetzt vorne", "favourite – now shown first")); }
    FAV[zpSeite] = l; schreib("imres-zp-fav", JSON.stringify(FAV)); zpBlatt[zpSeite] = 0; zpCursor = -1; zpZeichnen(true); ledsMelden();
  }
  function zpAusloesen(i) { const it = zpBlattJetzt()[i]; if (!it) return; if (autoModus !== "aus" && (zpSeite === "stimmung" || zpSeite === "set")) autoPlanen("st"); try { it.los(); } catch (e) { console.warn(e); } setTimeout(() => { zpZeichnen(true); ledsMelden(); }, 120); }
  function zpCursorBewegen(r) {
    if (zpCursor < 0) { zpCursor = 0; zpZeichnen(true); return; }
    let c = zpCursor % 4, z = zpCursor >= 4 ? 1 : 0;
    if (r === "UP" || r === "DOWN") z = 1 - z;
    else if (r === "LEFT") { if (c > 0) c--; else if (zpBlaettern(-1)) c = 3; }
    else if (r === "RIGHT") { if (c < 3) c++; else if (zpBlaettern(1)) c = 0; }
    zpCursor = z * 4 + c; zpZeichnen(true);
  }

  /* ----- Tasten im Pult (true = erledigt) ----- */
  function zpTaste(name, lang) {
    if (beatsTaste(name)) return true;
    if (/^F[1-4]$/.test(name)) { if (favVerbraucht[name]) { delete favVerbraucht[name]; return true; } zpAusloesen((alt ? 4 : 0) + +name[1] - 1); return true; }
    const dm = /^DREH([1-4])$/.exec(name);
    if (dm) { const nr = +dm[1] - 1; if (drehGedreht[nr]) { drehGedreht[nr] = false; return true; } if (alt) loopUmschalten(nr); else zpDruck(nr); return true; }
    switch (name) {
      case "MENU": if (alt) return false; lang ? systemMenue() : zpMenue(); return true;
      case "MIXER": if (mischAktiv()) { mischer(false); return true; } if (spurAktiv()) { spurFenster(false); return true; } lang ? bankWeiter(-1) : bankWeiter(); return true;
      case "LEFT": case "RIGHT": if (mischAktiv() && !alt) { mxAB(name === "LEFT" ? "A" : "B"); return true; } if (spurAktiv() && !alt) { const n = spurSeiten(); spurSeite = (spurSeite + (name === "LEFT" ? -1 : 1) + n) % n; zpZeichnen(true); zeige("🎛 " + W("Spuren ", "Tracks ") + (spurSeite + 1) + " / " + n); return true; } if (alt) { zpSeiteSchritt(name === "LEFT" ? -1 : 1); return true; } zpCursorBewegen(name); return true;
      case "UP": case "DOWN": if (alt) { zpGruppeSchritt(name === "UP" ? -1 : 1); return true; } zpCursorBewegen(name); return true;
      case "SEL": if (zpCursor < 0) zpCursorBewegen("RIGHT"); else zpAusloesen(zpCursor); return true;
      case "BACK":
        if (!lang && mischAktiv()) { mischer(false); return true; }
        if (!lang && spurAktiv()) { spurFenster(false); return true; }
        if (lang) { zeige("🎛 " + W("Zynthian startet …", "Zynthian is starting …")); fetch("/zyn/system", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ aktion: "zynthian" }) }).catch(() => {}); return true; }
        if (zpCursor >= 0) { zpCursor = -1; zpZeichnen(true); } else if (zpBlatt[zpSeite]) { zpBlatt[zpSeite] = 0; zpZeichnen(true); } else zeige("↩ " + W("BACK 2 s halten: zurück zum Zynthian", "Hold BACK 2 s: back to Zynthian"));
        return true;
    }
    if (name === "STOP" && lang && !alt) { panik(); return true; }
    const id = ZB.tasten[(alt ? "ALT+" : "") + name];
    if (!id) return false;
    if (HALTEN[id]) return true; /* läuft über Drücken/Loslassen */
    return zpAktion(id);
  }
  /* 🚨 Panik (STOP lang): alles still und alle Effekte, Loops und gehaltenen Effekte zurück auf Anfang */
  function panik() {
    Object.keys(gehalten).forEach(k => { try { zpHalten(gehalten[k], false); } catch (_) {} delete gehalten[k]; });
    Object.keys(LOOPS).forEach(k => delete LOOPS[k]);
    if (SEITE === "buehne") { ["filter", "echo", "drive", "crush", "rate", "ring", "flanger", "gate", "wobble", "stotter", "rueckwaerts", "bandstop"].forEach(k => { try { fxSetz(k, 0); } catch (_) {} });
      if (BEGL.an) beglSenden([], true); else fetch("/zyn/noten", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ alleAus: true }) }).catch(() => {});
      BC.liveRec = false; }
    if (autoModus !== "aus") autoSetzen("aus");
    const z = pz() || {}; if (SEITE === "welten" || z.laeuft || z.kulLaeuft) allesStopp();
    mischAn = false; spurAn = false; menueZu();
    zeige("🚨 " + W("Panik: alles aus", "Panic: everything off"), null, W("Musik, Kulisse, Effekte, Loops, Autopilot, MIDI-Noten", "music, backdrop, effects, loops, autopilot, MIDI notes")); zpZeichnen(true); ledsMelden();
  }
  /* Drücken / Loslassen für „solange gedrückt“-Aktionen */
  const gehalten = {}, favTimer = {}, favVerbraucht = {}, mxHalt = {};
  function zpDruckLos(name, art) {
    if (zpSeite === "beats" && name === "PAD" && !alt) { if (art === "druck") beatPad(); return; }
    if (zpSeite === "beats" && (name === "CTRL" || name === "ZS3")) { if (art === "druck") { BC.mod = name; BC.modBenutzt = false; } else BC.mod = null; ledsMelden(); return; }
    if (zpSeite === "beats" && /^F[1-4]$/.test(name)) { if (BC.pads && art === "druck" && !BC.mod && !alt) beatPad(+name[1] - 1); return; } /* keine Favoriten auf der Beats-Seite */
    const dm = /^DREH([1-4])$/.exec(name);
    if (dm) { const nr = +dm[1] - 1; clearTimeout(mxHalt[nr]);
      if (art === "druck") { drehGedrueckt[nr] = true; drehGedreht[nr] = false;
        /* im Mischer: Regler 1 s gedrückt halten (ohne Drehen) = Solo */
        if (mischAktiv()) { const k = mixKeys()[panelReihe() * 4 + nr]; mxHalt[nr] = setTimeout(() => { if (drehGedrueckt[nr] && !drehGedreht[nr]) { drehGedreht[nr] = true; mxSolo(k); } }, 1000); } }
      else { drehGedrueckt[nr] = false; setTimeout(() => { drehGedreht[nr] = false; }, 400); } return; }
    if (/^F[1-4]$/.test(name)) {
      if (art === "druck") { const i = (alt ? 4 : 0) + +name[1] - 1; clearTimeout(favTimer[name]); favTimer[name] = setTimeout(() => { favVerbraucht[name] = true; zpFavUmschalten(i); }, 1500); }
      else clearTimeout(favTimer[name]);
      return;
    }
    if (art === "druck") { const id = ZB.tasten[(alt ? "ALT+" : "") + name]; if (id && HALTEN[id] && SEITE === "buehne") { gehalten[name] = id; zpHalten(id, true); } }
    else if (gehalten[name]) { zpHalten(gehalten[name], false); delete gehalten[name]; }
  }

  /* ----- Menü ----- */
  function zpMenue() {
    const P = window.ImresPult, z = pz() || {};
    const sets = SEITE === "buehne" && P && P.abendSets ? P.abendSets() : [];
    const akt = sets.find(s => s.k === z.abendSet);
    const k = (f, t, u, id) => '<button type="button" data-zm="' + id + '"><span><span class="kbd">' + f + "</span>" + t + "</span>" + (u ? "<small>" + u + "</small>" : "") + "</button>";
    const zz = (id, t, u) => '<button type="button" data-zm="' + id + '">' + t + (u ? "<small>" + u + "</small>" : "") + "</button>";
    menue("<h3>☰ " + W("Menü", "Menu") + '</h3><div class="reihe zyn-opt">' +
      k("F1", "🎭 " + W("Modus", "Mode"), (SEITE === "welten" ? "🌿 " + W("Klangwelten", "Soundscapes") : "🎻 " + W("Bühnen-Pult", "Stage console")) + " · " + W("wechseln", "switch"), "modus") +
      (sets.length ? k("F2", "🌙 " + W("Spielabend", "Game night"), akt ? akt.sym + " " + akt.name : W("keiner – alle Stimmungen", "none – all moods"), "abend") : "") +
      k("F3", "🎚 " + W("Optionen", "Options"), W("MIDI-Takt, Handpan-Tonart, Mikrofon …", "MIDI clock, key, mic …"), "optionen") +
      k("F4", "⚙ " + W("System", "System"), W("Aktualisieren, Zynthian, Aufnahme, Aus", "Update, Zynthian, record, off"), "system") +
      zz("auto", "🤖 Autopilot: <b>" + AUTO_NAME[autoModus] + "</b>", W("wechselt selbst Stimmungen und setzt Momente", "changes moods and triggers moments by itself")) +
      zz("autowahl", "🤖 " + W("Autopilot wählt: ", "Autopilot picks: ") + "<b>" + AUTO_WAHL_NAME[autoWahl()] + "</b>", autoWahl() === "set" && !SET.length ? W("⚠ noch kein Set gespeichert – Seite „Set“: ➕", "⚠ no set saved yet") : W("ähnlich: ruhig bleibt ruhig, dunkel bleibt dunkel", "similar: calm stays calm, dark stays dark")) +
      zz("autoueb", "🤖 " + W("Autopilot-Wechsel: ", "Autopilot change: ") + "<b>" + AUTO_UEB_NAME[autoUeb()] + "</b>", W("gilt nur, wenn der Autopilot wechselt", "only for autopilot changes")) +
      (SEITE === "buehne" ? zz("begl", "🎹 " + W("Synth-Begleitung: ", "Synth accompaniment: ") + "<b>" + (BEGL.an ? W("an", "on") : W("aus", "off")) + "</b>", W("Akkorde als MIDI an Zynthian-Synths", "chords as MIDI to Zynthian synths")) : "") +
      (SEITE === "buehne" ? zz("beats", "🥁 " + W("Drumpad / Beats", "Drum pad / beats"), W("Step-Sequencer wie eine kleine TR-8S · auch: ALT + PAD oder oben der Reiter „Beats“", "step sequencer · also ALT + PAD or the Beats tab")) : "") +
      (SEITE === "buehne" ? zz("eingang", "🎤 " + W("Eingänge (Handpan, Didgeridoo …)", "Inputs (handpan, didgeridoo …)"), W("Instrumente anstecken, Gain, Lautstärke, eigene Effekte", "plug in instruments, gain, level, own effects")) : "") +
      zz("audio", "🎚 " + W("Audio: Ausgänge & Pegel", "Audio: outputs & levels"), W("welche Buchsen, Lautstärke der Soundkarte", "which jacks, sound-card levels")) +
      zz("einst", "🛠 " + W("Einstellungen", "Settings"), W("Leistung, Licht, Bühnenbild, Belegung …", "performance, light, stage view, mapping …")) +
      '<button type="button" data-zm="zu">✕ ' + W("Schließen", "Close") + "</button></div>" +
      '<p class="hinweis">' + W("F1–F4 wählen · Pfeile/Drehregler + SEL · BACK schließt", "F1–F4 pick · arrows/knob + SEL · BACK closes") + "</p>",
      { modus: zpModusMenue, abend: zpAbendMenue, optionen: () => optionenMenue(), system: systemMenue, zu: menueZu, einst: () => zpEinstellungen(), begl: () => beglMenue(), eingang: () => eingangMenue(), audio: () => audioMenue(), beats: () => { menueZu(); zpAktion("beats"); },
        autoueb: () => { schreib("imres-zp-autoueb", AUTO_UEB[(AUTO_UEB.indexOf(autoUeb()) + 1) % AUTO_UEB.length]); zpMenue(); const b = $('.zyn-menue [data-zm="autoueb"]'); if (b) fokusSetzen(b); },
        autowahl: () => { schreib("imres-zp-autowahl", AUTO_WAHL[(AUTO_WAHL.indexOf(autoWahl()) + 1) % AUTO_WAHL.length]); zpMenue(); const b = $('.zyn-menue [data-zm="autowahl"]'); if (b) fokusSetzen(b); },
        auto: () => { autoSetzen(AUTO_STUFEN[(AUTO_STUFEN.indexOf(autoModus) + 1) % AUTO_STUFEN.length]); zpMenue(); const b = $('.zyn-menue [data-zm="auto"]'); if (b) fokusSetzen(b); } });
    menueArt = "zp";
  }
  const ZP_MENUE_F = ["modus", "abend", "optionen", "system"];
  /* Belegung ändern: Regler und Tasten */
  const SEITEN_NAME = { stimmung: "🎵 " + W("Stimmung", "Mood"), ort: "🌲 " + W("Ort", "Place"), momente: "⚡ " + W("Momente", "Moments") };
  function belegSlots() {
    const l = [];
    ["stimmung", "ort", "momente"].forEach(sid => [0, 1, 2, 3].forEach(i => l.push({ id: "r|A:" + sid + "|" + i, titel: SEITEN_NAME[sid] + " · " + W("Regler ", "Knob ") + (i + 1), gruppe: W("Drehregler – Bank A (je Seite)", "Knobs – bank A (per page)") })));
    BANKEN.slice(1).forEach(bk => [0, 1, 2, 3].forEach(i => l.push({ id: "r|" + bk + "|" + i, titel: W("Bank ", "Bank ") + bk + " · " + W("Regler ", "Knob ") + (i + 1), gruppe: W("Drehregler – Bank B und FX (MIXER schaltet weiter)", "Knobs – banks B and FX (MIXER cycles)") })));
    ZP_TASTEN.forEach(t => l.push({ id: "t|" + t, titel: t.replace("ALT+", "ALT + "), gruppe: W("Tasten", "Buttons") }));
    return l;
  }
  function belegWert(id) { const [art, a, b] = id.split("|"); return art === "r" ? (ZB.regler[a] || [])[+b] || "nichts" : ZB.tasten[a] || "nichts"; }
  function belegName(id) { const v = belegWert(id); return id[0] === "r" ? (ZP_PARAM[v] || ZP_PARAM.nichts).name : (ZP_AKT[v] || ZP_AKT.nichts)[0]; }
  function belegZyklus(id, s) {
    const [art, a, b] = id.split("|"), l = art === "r" ? Object.keys(ZP_PARAM).filter(k => !/^w_/.test(k)) : Object.keys(ZP_AKT), v = belegWert(id);
    const n = l[(l.indexOf(v) + s + l.length) % l.length];
    if (art === "r") { ZB.regler[a] = (ZB.regler[a] || ["nichts", "nichts", "nichts", "nichts"]).slice(); ZB.regler[a][+b] = n; } else ZB.tasten[a] = n;
    belegMerken(); belegMenue(id); zpZeichnen(true);
  }
  function belegMenue(fokusId) {
    let h = "<h3>🎛 " + W("Belegung ändern", "Change mapping") + '</h3><div class="reihe zyn-opt">', gr = "";
    const a = { zu: menueZu, std: () => { ZB = JSON.parse(JSON.stringify(ZP_STANDARD)); belegMerken(); belegMenue(); zpZeichnen(true); zeige("↺ " + W("Standard-Belegung", "Default mapping")); } };
    belegSlots().forEach(sl => {
      if (sl.gruppe !== gr) { gr = sl.gruppe; h += '<p class="hinweis" style="grid-column:1/-1;margin:6px 0 0;text-align:left">' + gr + "</p>"; }
      h += '<button type="button" data-zm="b:' + sl.id + '"><span>' + sl.titel + ": <b>" + esc2(belegName(sl.id)) + "</b></span></button>";
      a["b:" + sl.id] = () => belegZyklus(sl.id, 1);
    });
    h += '<button type="button" data-zm="std">↺ ' + W("Standard wiederherstellen", "Restore defaults") + '</button><button type="button" data-zm="zu">✕ ' + W("Fertig", "Done") + "</button></div>" +
      '<p class="hinweis">' + W("▲ ▼ / Drehregler: Zeile wählen · ◀ ▶ oder SEL: ändern · BACK: fertig", "▲ ▼ / knob: pick row · ◀ ▶ or SEL: change · BACK: done") + "</p>";
    const m = menue(h, a); menueArt = "beleg";
    if (fokusId) { const b = m.querySelector('[data-zm="b:' + fokusId + '"]'); if (b) fokusSetzen(b); }
  }
  function zpAbendMenue() {
    const P = window.ImresPult; if (!P || !P.abendSets) return;
    const z = pz() || {}, sets = P.abendSets(), a = { zu: menueZu };
    const b = (id, t, an) => '<button type="button" data-zm="s:' + id + '" class="' + (an ? "an" : "") + '">' + t + "</button>";
    a["s:"] = () => { P.abend(""); menueZu(); zpBlatt.stimmung = 0; zpSeiteSetzen("stimmung"); zeige("🌙 " + W("Kein Spielabend", "No game night")); };
    sets.forEach(s => { a["s:" + s.k] = () => { P.abend(s.k); menueZu(); zpBlatt.stimmung = 0; zpSeiteSetzen("stimmung"); zeige("🌙 " + s.sym + " " + s.name, null, W("passende Stimmungen und Effekte stehen vorne", "matching moods and effects come first")); }; });
    menue("<h3>🌙 " + W("Spielabend", "Game night") + '</h3><div class="reihe drei">' + b("", "— " + W("ohne", "none"), !z.abendSet) + sets.map(s => b(s.k, s.sym + " " + s.name, z.abendSet === s.k)).join("") + "</div>" +
      '<p class="hinweis">' + W("Stimmungen und Effekte des Abends liegen dann auf F1–F4 und ALT + F1–F4", "The night's moods and effects then sit on F1–F4 and ALT + F1–F4") + "</p>", a);
    menueArt = "abend";
  }
  function zpHilfe() {
    const z = (kk, t) => "<div><b>" + kk + "</b><span>" + t + "</span></div>";
    const l = [["F1–F4", W("obere Kachelreihe", "top row of tiles")], ["ALT + F1–F4", W("untere Kachelreihe", "bottom row")], ["◀ ▶", W("Kachel wählen, am Rand weiterblättern", "move, page at the edge")],
      ["ALT + ◀ ▶", W("vorige / nächste Seite", "previous / next page")], ["ALT + ▲ ▼", W("andere Gruppe (Favoriten, Wetter, Effekte …)", "other group")], ["▲ ▼ / SEL", W("Reihe wechseln / auslösen", "switch row / trigger")], ["F 1,5 s halten", W("★ Favorit an/aus – Favoriten stehen vorne", "★ favourite on/off")],
      ["ALT + PAD", W("🥁 Drumpad (Beats) auf/zu – oder oben der Reiter „Beats“", "🥁 drum pad open/close")], ["🎻 " + W("Mitspieler", "Ensemble"), W("MENU → Eingänge → Mitspieler: Bühneninstrumente spielen die Töne deiner Handpan mit · MIXER → Bank MIT: Ensemble (0 = niemand … 8 = Harfe, Gitarre, Streicher, Celli, Chor, Flöte, Glockenspiel, Kontrabass), Lautstärke, Hall, Oktave", "MENU → inputs → ensemble")], ["ZS3", W("🎛 Spuren der Stimmung: jedes Instrument einzeln, Kulisse, Orchester/Kapelle/Gäste · ALT + drehen: untere Reihe · ◀ ▶ weitere · wird je Stimmung gemerkt", "🎛 tracks of the mood")], ["STOP " + W("lang", "hold"), W("🚨 Panik: Musik, Kulisse, alle Effekte, Loops, Autopilot und MIDI-Noten aus", "🚨 panic: everything off")], ["CTRL", W("🎚 Mischpult: 4 Regler für Musik, Hintergrund, Instrument, Effekte (drücken+drehen: andere Spur)", "🎚 Mixer: 4 knobs for music, backdrop, instrument, effects")], ["MIXER", W("Reglerbank A → B → FX (→ IN1/IN2) · lang: eine Bank zurück", "Knob bank A → B → FX (→ IN1/IN2) · hold: one bank back")], [W("Regler drücken + drehen", "Push + turn knob"), W("anderen Effekt / Wert auf diesen Regler legen", "put another effect on this knob")], ["ALT + " + W("Regler drücken", "push knob"), W("⟳ Reglerbewegung aufnehmen und im Takt loopen · nochmal: Loop aus", "⟳ record knob moves and loop in time · again: off")], ["MENU", W("Menü (lang: System)", "Menu (hold: system)")], ["ALT + MENU", W("🎚 Optionen", "🎚 Options")], ["BACK", W("zurück · 2 s halten: zum Zynthian", "back · hold 2 s: to Zynthian")], ["🎤 " + W("Eingänge", "Inputs"), W("MENU → Eingänge: Eingang 1/2 an, Gain, Lautstärke · dann MIXER → Bank IN1/IN2: Lautstärke, Filter, Delay, Hall (drücken+drehen: Gain, Rückkopplung, Drive, Panorama)", "MENU → inputs · then MIXER → bank IN1/IN2")], ["🥁 Beats", W("◀▶ Schritt · ▲▼ Spur · SEL/F1–F4 setzen · Regler 3 Tonhöhe · PAD live spielen · REC live aufnehmen · ALT+◀▶ verschieben · ALT+▲/▼ Spur kopieren/einfügen · ALT+SEL leeren · ALT+F1–F4 Variation 1–4 · CTRL halten+F1–F4 Pattern in Variation kopieren · ZS3 halten+F1–F4 nur die Spur kopieren", "◀▶ step · ▲▼ track · SEL/F1–F4 set · knob 3 pitch · PAD play live · REC live record · ALT+◀▶ shift · ALT+▲/▼ copy/paste · ALT+SEL clear")], ["🎬 Set", W("Kachel = Song laden · ➕ speichert den jetzigen Klang · 1,5 s halten: ändern/verschieben/löschen", "tile = load song · ➕ saves · hold 1.5 s: edit")]]
      .concat(ZP_TASTEN.map(t => [t.replace("ALT+", "ALT + "), (ZP_AKT[ZB.tasten[t]] || ZP_AKT.nichts)[0]]));
    menue("<h3>❔ " + W("Tastenbelegung", "Button map") + '</h3><div class="zyn-hilfe">' + l.map(([x, y]) => z(x, y)).join("") + '</div><div class="reihe drei"><button type="button" data-zm="beleg">🎛 ' + W("Ändern", "Change") + '</button><button type="button" data-zm="zu">✕ ' + W("Schließen", "Close") + "</button></div>", { zu: menueZu, beleg: () => belegMenue() });
    menueArt = "hilfe";
  }

  /* ===================== Auslastung des Pi ===================== */
  let lastInfo = null, lagMax = 0, lagT = performance.now();
  setInterval(() => { const j = performance.now(), d = j - lagT - 100; lagT = j; if (d > lagMax) lagMax = d; }, 100);
  setInterval(() => {
    if (document.hidden) return;
    fetch("/zyn/last").then(r => r.json()).then(j => { lastInfo = Object.assign(j || {}, { lag: Math.round(lagMax) }); lagMax = 0; })
      .catch(() => { lastInfo = { lag: Math.round(lagMax) }; lagMax = 0; });
  }, 2000);
  function lastAnzeige() {
    if (!lastInfo) return "";
    const c = lastInfo.kern != null ? Math.max(lastInfo.cpu || 0, lastInfo.kern) : null, farbe = c == null ? "#c8bba6" : c < 60 ? "#7fe08a" : c < 85 ? "#ffc830" : "#ff4a3a";
    let h = c != null ? '<span style="color:' + farbe + '">⚙ ' + c + " %</span>" : "";
    if (lastInfo.temp >= 70) h += ' <span style="color:' + (lastInfo.temp >= 80 ? "#ff4a3a" : "#ffc830") + '">🌡 ' + lastInfo.temp + "°</span>";
    if (lastInfo.lag > 200) h += ' <span style="color:#ff4a3a">⚠ ' + W("Ruckler", "stutter") + "</span>";
    return h ? h + " · " : "";
  }

  /* ===================== Tap-Tempo ===================== */
  let taps = [];
  function tapTempo() {
    const j = performance.now(); if (taps.length && j - taps[taps.length - 1] > 2000) taps = [];
    taps.push(j); if (taps.length > 8) taps.shift();
    if (taps.length < 4) { zeige("⏱ Tap " + taps.length + " / 4", null, W("weiter im Takt tippen", "keep tapping")); return; }
    const iv = taps.slice(1).map((t, i) => t - taps[i]), bpm = Math.round(60000 / (iv.reduce((a, b) => a + b, 0) / iv.length));
    if (bpm < 40 || bpm > 220) return;
    if (OPT.takt === "slave" && tempoMidi) { zeige("⏱ " + W("Das Tempo kommt von der TR-8S", "Tempo comes from the clock"), null, W("MIDI-Takt auf „aus“ stellen, um selbst zu tippen", "set MIDI clock to off to tap")); return; }
    const b = Math.max(50, Math.min(180, bpm)); if (window.ImresPult && window.ImresPult.tempo) window.ImresPult.tempo(b);
    zeige("⏱ " + b + " BPM", null, W("Tap-Tempo · ", "tap tempo · ") + taps.length + "×"); zpReglerAnzeige();
  }

  /* ===================== Autopilot ===================== */
  const AUTO_STUFEN = ["aus", "ruhig", "lebendig"];
  const AUTO_NAME = { aus: W("aus", "off"), ruhig: W("ruhig (Stimmung alle 4–7 min)", "calm (mood every 4–7 min)"), lebendig: W("lebendig (alle 2–4 min)", "lively (every 2–4 min)") };
  const AUTO_ZEIT = { ruhig: { st: [240, 420], mom: [100, 200] }, lebendig: { st: [120, 240], mom: [45, 100] } };
  let autoModus = AUTO_STUFEN.includes(lies("imres-zp-auto", "aus")) ? lies("imres-zp-auto", "aus") : "aus", autoSt = 0, autoMom = 0, autoSp = 0;
  function autoPlanen(art) {
    const z = AUTO_ZEIT[autoModus]; if (!z) return; const r = ([a, b]) => (a + Math.random() * (b - a)) * 1000, j = Date.now();
    if (!art || art === "st") autoSt = j + r(z.st); if (!art || art === "mom") autoMom = j + r(z.mom); if (!art || art === "sp") autoSp = j + 30000;
  }
  /* Welche Stimmung als Nächstes? „ähnlich“: eine, die thematisch, im Tempo und in der Farbe zur jetzigen passt */
  const AUTO_WAHL = ["aehnlich", "fav", "set", "frei"];
  const AUTO_WAHL_NAME = { aehnlich: W("ähnliche Stimmungen", "similar moods"), fav: W("nur Favoriten (★), passend sortiert", "favourites only (★), best match first"), set: W("das Set der Reihe nach", "the set in order"), frei: W("alle, zufällig", "all, random") };
  /* Wie der Autopilot wechselt (gilt nur für seine Wechsel) */
  const AUTO_UEB = ["normal", "sanft", "episch", "passend"];
  const AUTO_UEB_NAME = { normal: W("wie eingestellt", "as set"), sanft: W("unauffällig (lange, leise Überleitung)", "subtle (long, quiet bridge)"), episch: W("episch (Paukenwirbel und Becken)", "epic (timpani roll and cymbal)"), passend: W("passend: episch, wenn es dramatischer wird", "matching: epic when it gets more dramatic") };
  const autoUeb = () => AUTO_UEB.includes(lies("imres-zp-autoueb", "normal")) ? lies("imres-zp-autoueb", "normal") : "normal";
  const autoWahl = () => AUTO_WAHL.includes(lies("imres-zp-autowahl", "aehnlich")) ? lies("imres-zp-autowahl", "aehnlich") : "aehnlich";
  const autoZuletzt = [];
  function autoUebergang(P, von, nach) {
    if (!P.naechsterWechsel) return; let art = autoUeb();
    if (art === "passend") art = nach && P.aehnlich && P.dramatik ? (P.dramatik(nach) > P.dramatik(von) ? "episch" : "sanft") : "sanft";
    P.naechsterWechsel(art === "normal" ? null : art);
  }
  function autoNaechste(jetzt, P) {
    const L = P.listen(), wahl = autoWahl(), fav = (FAV.stimmung || []).map(k => k.replace(/^st:/, "")).filter(k => L.st.includes(k));
    let pool = (wahl === "fav" && fav.length >= 2 ? fav : L.st).filter(k => k !== jetzt);
    if (wahl === "frei" || !jetzt || !P.aehnlich) return pool[Math.floor(Math.random() * pool.length)];
    const frisch = pool.filter(k => !autoZuletzt.includes(k)); if (frisch.length >= 2) pool = frisch;
    const sortiert = pool.map(k => [k, P.aehnlich(jetzt, k) + Math.random() * .8]).sort((a, b) => b[1] - a[1]);
    const top = sortiert.slice(0, wahl === "fav" ? 2 : 3); return (top[Math.floor(Math.random() * top.length)] || [])[0];
  }
  function autoSetzen(m) { autoModus = m; schreib("imres-zp-auto", m); autoSt = 0; if (m !== "aus") autoPlanen(); zeige("🤖 Autopilot: " + AUTO_NAME[m]); zpZeichnen(true); }
  setInterval(() => {
    if (autoModus === "aus") return; const j = Date.now(); if (!autoSt) autoPlanen();
    if (SEITE === "buehne") {
      const z = pz() || {}, P = window.ImresPult; if (!z.laeuft || !P || !P.listen) return;
      if (j >= autoSt && autoWahl() === "set" && SET.length) { autoPlanen("st"); autoUebergang(P, z.stimmung, null); const ni = (setIndex + 1) % SET.length; setLaden(ni); zeige("🤖 🎬 " + (SET[ni] && SET[ni].name || W("Song ", "Song ") + (ni + 1)), null, "Autopilot"); }
      else if (j >= autoSt) { autoPlanen("st"); const k = autoNaechste(z.stimmung, P);
        if (k) { autoUebergang(P, z.stimmung, k); autoZuletzt.unshift(k); autoZuletzt.length = Math.min(autoZuletzt.length, 3); pultKlick("data-vorlage", k); zeige("🤖 " + teil(P.listen().namen.st[k] || k, "")[1], null, "Autopilot"); } }
      if (j >= autoMom && z.kulLaeuft) { autoPlanen("mom"); pultKlick("data-aktion", "passiert"); zeige("🤖 ⚡ " + W("Etwas passiert", "Something happens"), null, "Autopilot"); }
      if (j >= autoSp) { autoPlanen("sp"); const r = ZP_PARAM.spannung, v = r.lies(); r.setz(Math.max(0, Math.min(65, Math.round((v + (Math.random() - .5) * 20) / 5) * 5))); }
    } else if ($(".welt.an")) {
      if (j >= autoSt) { autoPlanen("st"); const l = $$("[data-szene]"), el = l[Math.floor(Math.random() * l.length)]; if (el) { klick(el); zeige("🤖 ⏳ " + kurzName(el), null, "Autopilot"); } }
      if (j >= autoMom) { autoPlanen("mom"); const l = $$("[data-ger]"), el = l[Math.floor(Math.random() * l.length)]; if (el) klick(el); }
    }
  }, 3000);

  /* ===================== Set: Schnappschüsse ===================== */
  let SET = []; try { SET = JSON.parse(lies("imres-zp-set", "[]")) || []; } catch (_) { SET = []; }
  let setIndex = -1;
  const setMerken = () => schreib("imres-zp-set", JSON.stringify(SET));
  const FX_SCHLUESSEL = ["filter", "reso", "echo", "rueck", "zeit", "drive", "crush", "rate", "ring", "flanger", "gate", "wobble"];
  function schnappschuss() {
    const z = pz() || {}, P = window.ImresPult, L = P && P.listen ? P.listen() : { namen: { st: {}, kul: {} } }, w = PFX() || {};
    const werte = {}; ["musik", "hg", "los", "spannung", "tempo", "hall", "fxlaut", "echohall"].forEach(k => { try { werte[k] = ZP_PARAM[k].lies(); } catch (_) {} });
    const fx = {}; FX_SCHLUESSEL.forEach(k => { if (typeof w[k] === "number") fx[k] = w[k]; });
    const zus = [...new Set($$('#lautenwerk [data-zusatz][aria-pressed="true"]').map(e => e.dataset.zusatz))];
    const [sy, nm] = teil(L.namen.st[z.stimmung] || "", "🎬"), kn = z.kulLaeuft && z.kulisse && z.kulisse !== "keine" ? teil(L.namen.kul[z.kulisse] || "", "")[1] : "";
    return { name: (nm || W("Stille", "Silence")) + (kn ? " · " + kn : ""), sym: sy, st: z.stimmung, laeuft: !!z.laeuft, kul: z.kulLaeuft ? z.kulisse : "keine", werte, fx, zus, abend: z.abendSet || "" };
  }
  function setLaden(i) {
    const s = SET[i]; if (!s) return; setIndex = i; const P = window.ImresPult, z = pz() || {};
    if ((s.abend || "") !== (z.abendSet || "") && P && P.abend) P.abend(s.abend);
    if (s.laeuft && s.st && (z.stimmung !== s.st || !z.laeuft)) pultKlick("data-vorlage", s.st); else if (!s.laeuft && z.laeuft) musikSpielen();
    const ort = () => { const z2 = pz() || {}; if (s.kul === "keine") { if (z2.kulLaeuft) pultKlick("data-kulisse", "keine"); } else if (s.kul && (z2.kulisse !== s.kul || !z2.kulLaeuft)) pultKlick("data-kulisse", s.kul); };
    setTimeout(() => {
      ort();
      Object.keys(s.werte || {}).forEach(k => { if (k === "tempo" && OPT.takt === "slave" && tempoMidi) return; const r = ZP_PARAM[k]; if (r && typeof s.werte[k] === "number") r.setz(s.werte[k]); });
      Object.keys(s.fx || {}).forEach(k => fxSetz(k, s.fx[k]));
      const soll = new Set(s.zus || []), erste = new Map(); $$("#lautenwerk [data-zusatz]").forEach(el => { if (!erste.has(el.dataset.zusatz)) erste.set(el.dataset.zusatz, el); });
      erste.forEach((el, id) => { const an = el.getAttribute("aria-pressed") === "true"; if (an !== soll.has(id)) klick(el); });
    }, 600);
    setTimeout(ort, 4500); /* nach dem Stimmungswechsel am Taktende den Ort noch einmal festigen */
    zeige("🎬 " + s.name, null, (i + 1) + " / " + SET.length); zpZeichnen(true);
  }
  function setSpeichern() { SET.push(schnappschuss()); setMerken(); setIndex = SET.length - 1; zeige("🎬 " + W("Gespeichert: ", "Saved: ") + SET[setIndex].name, null, W("1,5 s halten: ändern, verschieben, löschen", "hold 1.5 s: edit, move, delete")); zpZeichnen(true); }
  function setMenue(i) {
    const s = SET[i]; if (!s) return; const a = { zu: menueZu };
    a.neu = () => { SET[i] = Object.assign(schnappschuss(), {}); setMerken(); menueZu(); zeige("↻ " + SET[i].name); zpZeichnen(true); };
    a.vor = () => { if (i > 0) { [SET[i - 1], SET[i]] = [SET[i], SET[i - 1]]; setMerken(); } menueZu(); zpZeichnen(true); };
    a.nach = () => { if (i < SET.length - 1) { [SET[i + 1], SET[i]] = [SET[i], SET[i + 1]]; setMerken(); } menueZu(); zpZeichnen(true); };
    a.weg = () => { SET.splice(i, 1); setMerken(); if (setIndex >= SET.length) setIndex = SET.length - 1; menueZu(); zeige("✕ " + s.name, null, W("gelöscht", "deleted")); zpZeichnen(true); };
    const b = (id, t) => '<button type="button" data-zm="' + id + '">' + t + "</button>";
    menue("<h3>🎬 " + esc2(s.sym + " " + s.name) + '</h3><div class="reihe">' + b("neu", "↻ " + W("Mit dem jetzigen Klang überschreiben", "Overwrite with current sound")) + b("vor", "◀ " + W("Nach vorne", "Move earlier")) +
      b("nach", "▶ " + W("Nach hinten", "Move later")) + b("weg", "✕ " + W("Löschen", "Delete")) + b("zu", W("Schließen", "Close")) + "</div>", a);
    menueArt = "set";
  }

  /* ===================== Synth-Begleitung (MIDI an Zynthian-Ketten / externe Synths) ===================== */
  const BEGL_STD = { an: false, pad: true, bass: true, glocken: true, drone: false, gm: false };
  let BEGL = Object.assign({}, BEGL_STD); try { Object.assign(BEGL, JSON.parse(lies("imres-zp-begl", "{}")) || {}); } catch (_) {}
  const beglMerken = () => schreib("imres-zp-begl", JSON.stringify(BEGL));
  const KAN = { pad: 0, bass: 1, glocken: 2, drone: 3 };
  /* Ensembles: zu jeder Stimmungsfamilie eine passende Besetzung (General-MIDI-Programme für FluidSynth, dazu Ideen für andere Synths) */
  const ENSEMBLES = {
    taverne: { name: W("🍺 Tavernen-Kapelle", "🍺 Tavern band"), st: ["trinklied", "dorffest", "marktplatz", "kamin", "shanty", "hof"],
      pad: [21, W("Akkordeon", "Accordion")], bass: [32, W("Kontrabass gezupft", "Acoustic bass")], glocken: [15, W("Hackbrett", "Dulcimer")], drone: [109, W("Dudelsack", "Bagpipe")],
      ideen: W("setBfree: weiche Orgel als Pad · ZynAddSubFX: gezupfter Bass · Dexed: „Clavinet“ für die Glocken-Stimme", "setBfree soft organ pad · ZynAddSubFX plucked bass · Dexed clavinet") },
    abenteuer: { name: W("🗺 Abenteuer-Orchester", "🗺 Adventure orchestra"), st: ["reise", "reiter", "heldenlied", "sieg", "auenland", "pilger", "zwerge"],
      pad: [48, W("Streicher-Ensemble", "String ensemble")], bass: [43, W("Kontrabass", "Contrabass")], glocken: [46, W("Harfe", "Harp")], drone: [60, W("Waldhorn", "French horn")],
      ideen: W("Surge XT: breite Streicher-Fläche · Dexed: Harfe/Glocken · ZynAddSubFX: Horn-Pad im Grundton", "Surge XT strings · Dexed harp · ZynAddSubFX horn pad") },
    schlacht: { name: W("⚔ Schlacht-Blech", "⚔ Battle brass"), st: ["kampf", "boss", "verfolgung"],
      pad: [61, W("Blechbläser", "Brass section")], bass: [38, W("Synth-Bass", "Synth bass")], glocken: [14, W("Röhrenglocken", "Tubular bells")], drone: [47, W("Pauke", "Timpani")],
      ideen: W("OB-Xd oder Surge XT: harter Synth-Brass · ZynAddSubFX: Sub-Bass · Glocken über Dexed „Tubular Bells“", "OB-Xd/Surge brass · ZynAddSubFX sub bass · Dexed bells") },
    mystik: { name: W("👁 Mystik-Chor", "👁 Mystic choir"), st: ["spannung", "grusel", "unterreich", "ruinen"],
      pad: [52, W("Chor „Aah“", "Choir aahs")], bass: [35, W("Bundloser Bass", "Fretless bass")], glocken: [8, W("Celesta", "Celesta")], drone: [95, W("Sweep-Fläche", "Sweep pad")],
      ideen: W("Surge XT: dunkle, langsam atmende Fläche · ZynAddSubFX: tiefer Drone mit Rauschen · Dexed: Celesta", "Surge dark pad · ZynAddSubFX drone · Dexed celesta") },
    lager: { name: W("🔥 Lagerfeuer & Elben", "🔥 Campfire & elves"), st: ["rast", "klage", "elben", "fey"],
      pad: [89, W("Warme Fläche", "Warm pad")], bass: [35, W("Bundloser Bass", "Fretless bass")], glocken: [108, W("Kalimba", "Kalimba")], drone: [104, W("Sitar-Bordun", "Sitar drone")],
      ideen: W("Surge XT: warme, weiche Fläche · Kalimba/Spieluhr aus dem Soundfont · Sitar oder Tanpura-artiger Bordun – passt zur Handpan", "Surge warm pad · kalimba · sitar drone – fits the handpan") }
  };
  const ensembleVon = st => Object.keys(ENSEMBLES).find(k => ENSEMBLES[k].st.includes(st)) || "abenteuer";
  let beglPad = [], beglBass = null, beglDrone = [], beglArp = 0, beglLief = false, beglEns = "", beglPuffer = [], beglT = 0;
  function beglSenden(liste, alleAus) {
    beglPuffer.push(...liste);
    if (alleAus) { fetch("/zyn/noten", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ alleAus: true }) }).catch(() => {}); }
    if (beglT) return;
    beglT = setTimeout(() => { beglT = 0; const j = performance.now(), l = beglPuffer.map(x => Object.assign({}, x, { in: Math.max(0, Math.round(x.t - j)) })); beglPuffer = [];
      l.forEach(x => delete x.t); if (l.length) fetch("/zyn/noten", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ev: l }) }).catch(() => {}); }, 10);
  }
  const beglStaerke = () => { const sp = (pz() || {}).spannung || 0, los = (pz() || {}).intensitaet || 5; return Math.max(30, Math.min(120, Math.round(52 + sp * 38 + los * 2.5))); };
  function beglEreignis(e) {
    if (!BEGL.an) return; const t = performance.now() + e.bisMs, a = e.akkord, v = beglStaerke(), ev = [], z = pz() || {};
    beglLief = true;
    if (BEGL.gm && z.stimmung) { const en = ensembleVon(z.stimmung); if (en !== beglEns) { beglEns = en; const E = ENSEMBLES[en]; ["pad", "bass", "glocken", "drone"].forEach(r => ev.push({ k: KAN[r], pc: E[r][0], t: t - 30 })); } }
    if (e.art === "akkord") {
      if (BEGL.pad) { beglPad.forEach(n => ev.push({ k: KAN.pad, n, v: 0, t })); beglPad = [a.grund, a.terz, a.quinte]; beglPad.forEach(n => ev.push({ k: KAN.pad, n, v: Math.round(v * .8), t: t + 2 })); }
      if (BEGL.bass) { if (beglBass != null) ev.push({ k: KAN.bass, n: beglBass, v: 0, t }); beglBass = a.grund - 12; ev.push({ k: KAN.bass, n: beglBass, v: Math.min(127, v + 8), t: t + 2 }); }
      if (BEGL.drone) { const g = OPT.tonartAn ? 36 + OPT.grund : 36 + ((a.grund % 12) + 12) % 12, soll = [g, g + 7];
        if (beglDrone[0] !== g) { beglDrone.forEach(n => ev.push({ k: KAN.drone, n, v: 0, t })); beglDrone = soll; soll.forEach(n => ev.push({ k: KAN.drone, n, v: 60, t: t + 2 })); } }
    } else if (e.art === "schlag" && BEGL.glocken) {
      const los = z.intensitaet || 5; if (Math.random() < .25 + los * .065) {
        const toene = [a.quinte + 12, a.terz + 12, a.grund + 24, a.terz + 24], n = toene[beglArp++ % toene.length];
        ev.push({ k: KAN.glocken, n, v: Math.round(v * .75), t }, { k: KAN.glocken, n, v: 0, t: t + e.sd * 3000 }); }
    }
    if (ev.length) beglSenden(ev);
  }
  function beglAus() { beglPad = []; beglBass = null; beglDrone = []; beglLief = false; beglEns = ""; beglSenden([], true); }
  setInterval(() => {
    const P = window.ImresPult; if (!P || !P.midiHoerer) return;
    P.midiHoerer(BEGL.an ? beglEreignis : null);
    const z = pz() || {}; if (beglLief && (!BEGL.an || !z.laeuft)) beglAus();
  }, 700);
  function beglMenue(fokusK) {
    const an = x => x ? "✅ " + W("an", "on") : "⬜ " + W("aus", "off"), a = { zu: menueZu };
    const z = (k, t, w, u) => '<button type="button" data-zm="b:' + k + '"><span>' + t + ": <b>" + w + "</b></span>" + (u ? "<small>" + u + "</small>" : "") + "</button>";
    ["an", "pad", "bass", "glocken", "drone", "gm"].forEach(k => { a["b:" + k] = () => { BEGL[k] = !BEGL[k]; beglMerken(); if (k === "an" && !BEGL.an) beglAus(); if (k === "gm") beglEns = ""; beglMenue(k); }; });
    a["b:test"] = () => { const t = performance.now() + 50; beglSenden([[60, 64, 67].map(n => ({ k: KAN.pad, n, v: 90, t })), [60, 64, 67].map(n => ({ k: KAN.pad, n, v: 0, t: t + 900 })), [{ k: KAN.bass, n: 36, v: 100, t }, { k: KAN.bass, n: 36, v: 0, t: t + 900 }], [{ k: KAN.glocken, n: 79, v: 90, t: t + 300 }, { k: KAN.glocken, n: 79, v: 0, t: t + 800 }]].flat()); zeige("🎹 " + W("Testakkord auf Kanal 1–3", "Test chord on channels 1–3")); };
    a["b:aus"] = () => { beglAus(); zeige("🔇 " + W("Alle Noten aus", "All notes off")); };
    a["b:ideen"] = beglIdeen;
    const h = "<h3>🎹 " + W("Synth-Begleitung", "Synth accompaniment") + '</h3><div class="reihe zyn-opt">' +
      z("an", "🎹 " + W("Begleitung", "Accompaniment"), an(BEGL.an), W("Die Bühne spielt ihre Akkorde als MIDI mit – in eurer Tonart, im Takt", "The stage plays its chords as MIDI – in key, in time")) +
      z("pad", "· " + W("Fläche (Kanal 1)", "Pad (channel 1)"), an(BEGL.pad), W("gehaltene Akkorde", "held chords")) +
      z("bass", "· " + W("Bass (Kanal 2)", "Bass (channel 2)"), an(BEGL.bass), W("Grundton eine Oktave tiefer", "root an octave down")) +
      z("glocken", "· " + W("Glocken/Arpeggio (Kanal 3)", "Bells/arpeggio (channel 3)"), an(BEGL.glocken), W("Akkordtöne auf den Schlägen – je mehr los ist, desto mehr", "chord tones on beats – busier when busy")) +
      z("drone", "· " + W("Bordun (Kanal 4)", "Drone (channel 4)"), an(BEGL.drone), W("Grundton + Quinte der Handpan-Tonart", "root + fifth of the handpan key")) +
      z("gm", "🎼 " + W("Klänge je Stimmung wechseln", "Switch sounds per mood"), an(BEGL.gm), W("sendet General-MIDI-Programme (FluidSynth mit GM-Soundfont)", "sends General MIDI programs (FluidSynth GM soundfont)")) +
      '<button type="button" data-zm="b:ideen">🎻 ' + W("Ensembles & Klangideen", "Ensembles & sound ideas") + "<small>" + W("welche Synths zu welcher Stimmung passen", "which synths fit which mood") + "</small></button>" +
      '<button type="button" data-zm="b:test">🔔 ' + W("Testakkord senden", "Send test chord") + '</button><button type="button" data-zm="b:aus">🔇 ' + W("Alle Noten aus", "All notes off") + "</button>" +
      '<button type="button" data-zm="zu">✕ ' + W("Fertig", "Done") + "</button></div>" +
      '<p class="hinweis">' + W("Im Zynthian: „Zusammen mit Zynthian“ starten, Ketten auf MIDI-Kanal 1–4 anlegen, „Barden Beats“ als MIDI-Eingang aktivieren. Externe Synths am USB bekommen die Noten automatisch.", "In Zynthian: start “Together with Zynthian”, create chains on MIDI ch. 1–4, enable “the stage Begleitung” as MIDI input. USB synths get the notes automatically.") + "</p>";
    const m = menue(h, a); menueArt = "begl"; if (fokusK) { const b = m.querySelector('[data-zm="b:' + fokusK + '"]'); if (b) fokusSetzen(b); }
  }
  function beglIdeen() {
    const zeile = E => "<div style=\"grid-column:1/-1\"><b style=\"min-width:0\">" + E.name + "</b></div>" +
      [["pad", "1 " + W("Fläche", "Pad")], ["bass", "2 Bass"], ["glocken", "3 " + W("Glocken", "Bells")], ["drone", "4 " + W("Bordun", "Drone")]].map(([r, t]) => "<div><b>" + t + "</b><span>" + E[r][1] + " (GM " + (E[r][0] + 1) + ")</span></div>").join("") +
      "<div style=\"grid-column:1/-1;color:#a89f8f\">" + E.ideen + "</div>";
    menue("<h3>🎻 " + W("Ensembles", "Ensembles") + '</h3><div class="zyn-hilfe">' + Object.values(ENSEMBLES).map(zeile).join("") + '</div><div class="reihe drei"><button type="button" data-zm="zu">✕ ' + W("Schließen", "Close") + "</button></div>", { zu: () => beglMenue() });
    menueArt = "hilfe";
  }

  /* ===================== Audio: Ausgänge, Pegel der Soundkarte, Eingänge ===================== */
  const audioPost = d => fetch("/zyn/audio", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(d) }).then(r => r.json()).catch(() => ({ ok: false, fehler: W("Brücke nicht erreichbar", "bridge unreachable") }));
  function audioMenue(fokusId, daten) {
    const weiter = r => {
      if (!r || !r.ok) { zeige("⚠ " + ((r && r.fehler) || W("Audio-Info fehlt", "no audio info"))); return; }
      const a = { zu: menueZu }, paare = new Set(r.paare || ["1,2"]);
      let h = '<p class="hinweis" style="font-size:13px">' + W("Soundkarte: ", "Sound card: ") + esc2(r.karte || "?") + " · " + (r.ausgaenge || 0) + W(" Ausgangskanäle", " output channels") + '</p><div class="reihe zyn-opt">';
      for (let i = 1; i + 1 <= (r.ausgaenge || 2); i += 2) {
        const p = i + "," + (i + 1), an = paare.has(p);
        h += '<button type="button" data-zm="o:' + p + '"><span>' + (an ? "✅ " : "⬜ ") + W("Ausgang ", "Output ") + i + "/" + (i + 1) + "</span><small>" + (i === 1 ? W("Hauptausgang (bei manchen Karten auch der Kopfhörer)", "main output (on some cards also headphones)") : W("weiteres Ausgangspaar", "further output pair")) + "</small></button>";
        a["o:" + p] = () => { if (an && paare.size === 1) { zeige(W("Mindestens ein Ausgang bleibt an", "At least one output stays on")); return; } if (an) paare.delete(p); else paare.add(p); audioPost({ aktion: "ausgaenge", paare: [...paare] }).then(x => audioMenue("o:" + p, x)); };
      }
      h += '<button type="button" data-zm="mono"><span>' + (r.mono ? "✅ " : "⬜ ") + W("Mono: beide Buchsen gleich", "Mono: both jacks the same") + "</span><small>" + (r.mono ? W("an – eine Box an 1 oder 2 bekommt alles", "on – one box on 1 or 2 gets everything") : W("aus = Stereo: 1 links, 2 rechts", "off = stereo: 1 left, 2 right")) + W(" · Bild lädt kurz neu", " · screen reloads briefly") + "</small></button>";
      a.mono = () => { zeige("⏳ " + W("Ton wird umgestellt – die Bühne lädt kurz neu …", "Switching sound – the stage reloads …")); audioPost({ aktion: "mono", an: !r.mono }).then(x => audioMenue("mono", x)); };
      const P = window.ImresPult, bst = P && P.boost ? P.boost() : null;
      if (bst != null) {
        h += '<button type="button" data-zm="boost"><span>📢 ' + W("Ausgangs-Boost: ", "Output boost: ") + "<b>+" + bst + " dB</b></span><small>" + W("◀ ▶ lauter/leiser · ein Limiter schützt vor Übersteuern", "◀ ▶ louder/softer · a limiter prevents clipping") + "</small></button>";
        a["boost:stufe"] = st => { P.boost(P.boost() + st * 2); audioMenue("boost", r); };
      }
      (r.regler || []).forEach((g, i) => {
        const teile = []; if (g.p != null) teile.push("🔊 " + g.p + " %"); if (g.c != null) teile.push("🎤 " + g.c + " %"); if (g.an != null) teile.push(g.an ? W("an", "on") : W("🔇 stumm", "🔇 muted")); if (g.aufnahme != null) teile.push(g.aufnahme ? W("Aufnahme an", "capture on") : W("Aufnahme aus", "capture off"));
        h += '<button type="button" data-zm="r:' + i + '"><span>🎚 ' + esc2(g.name) + ": <b>" + teile.join(" · ") + "</b></span><small>" + (g.p != null || g.c != null ? W("◀ ▶ leiser/lauter", "◀ ▶ down/up") : "") + (g.an != null || g.aufnahme != null ? W(" · SEL: an/aus", " · SEL: on/off") : "") + "</small></button>";
        a["r:" + i] = () => { if (g.an != null || g.aufnahme != null) audioPost({ aktion: "regler", name: g.name, art: g.an == null ? "c" : "p", schalten: true }).then(x => audioMenue("r:" + i, x)); };
        a["r:" + i + ":stufe"] = s => { const art = g.p != null ? "p" : "c", v = Math.max(0, Math.min(100, (art === "p" ? g.p : g.c) + s * 5)); if (art === "p") g.p = v; else g.c = v; audioPost({ aktion: "regler", name: g.name, art, wert: v }).then(x => audioMenue("r:" + i, x)); };
      });
      [["l", -1, W("links (1)", "left (1)")], ["r", 1, W("rechts (2)", "right (2)")]].forEach(([id, pan, nm]) => {
        h += '<button type="button" data-zm="t:' + id + '"><span>🔊 ' + W("Testton ", "Test tone ") + nm + "</span><small>" + W("2 s Piepton nur auf dieser Seite", "2 s beep on this side only") + "</small></button>";
        a["t:" + id] = () => testton(pan);
      });
      h += '<button type="button" data-zm="zu">✕ ' + W("Fertig", "Done") + "</button></div>" +
        '<p class="hinweis">' + W("Kommt aus den großen Buchsen nichts: hier den Pegel der Soundkarte prüfen (z. B. „Digital“, „Line“, „Master“) und Stummschaltung lösen.", "Nothing from the line outs? Check the card levels here and unmute.") + "</p>";
      const m = menue("<h3>🎚 " + W("Audio: Ausgänge & Pegel", "Audio: outputs & levels") + "</h3>" + h, a); menueArt = "audio"; audioAktionen = a;
      if (fokusId) { const b = m.querySelector('[data-zm="' + fokusId + '"]'); if (b) fokusSetzen(b); }
    };
    if (daten) weiter(daten); else { menue('<h3>🎚 Audio</h3><p class="hinweis">⏳ ' + W("Lese die Soundkarte …", "Reading the sound card …") + "</p>", { zu: menueZu }); audioPost({ aktion: "info" }).then(weiter); }
  }
  let audioAktionen = null;
  function testton(pan) {
    try { const c = new (window.AudioContext || window.webkitAudioContext)(), o = c.createOscillator(), g = c.createGain(), p = c.createStereoPanner();
      o.frequency.value = pan < 0 ? 440 : 660; g.gain.setValueAtTime(0, c.currentTime); g.gain.linearRampToValueAtTime(.7, c.currentTime + .05); g.gain.setValueAtTime(.7, c.currentTime + 1.9); g.gain.linearRampToValueAtTime(0, c.currentTime + 2);
      p.pan.value = pan; o.connect(g); g.connect(p); p.connect(c.destination); o.start(); o.stop(c.currentTime + 2.05); setTimeout(() => c.close(), 2600);
      zeige("🔊 " + W("Testton ", "Test tone ") + (pan < 0 ? W("links", "left") : W("rechts", "right"))); } catch (e) { zeige("⚠ " + e.message); }
  }
  /* @@TONHOEHE-ANFANG – Tonhöhe eines Instruments (YIN, mit Feinabgleich zwischen den Abtastwerten).
     Gibt { hz, klar } zurück (klar: 0 … 1, wie eindeutig der Ton ist) oder null, wenn nichts Tonhaftes da ist. */
  /* schnelle Fourier-Transformation (in place, Länge = Zweierpotenz); inv = true rechnet zurück (ohne 1/N) */
  function fft(re, im, inv) {
    const N = re.length;
    for (let i = 1, j = 0; i < N; i++) { let bit = N >> 1; for (; j & bit; bit >>= 1) j ^= bit; j ^= bit; if (i < j) { let t = re[i]; re[i] = re[j]; re[j] = t; t = im[i]; im[i] = im[j]; im[j] = t; } }
    for (let len = 2; len <= N; len <<= 1) {
      const ang = 2 * Math.PI / len * (inv ? 1 : -1), wr = Math.cos(ang), wi = Math.sin(ang), h = len >> 1;
      for (let i = 0; i < N; i += len) { let cr = 1, ci = 0;
        for (let j = 0; j < h; j++) { const a = i + j, b = a + h, xr = re[b] * cr - im[b] * ci, xi = re[b] * ci + im[b] * cr;
          re[b] = re[a] - xr; im[b] = im[a] - xi; re[a] += xr; im[a] += xi; const t = cr * wr - ci * wi; ci = cr * wi + ci * wr; cr = t; } }
    }
  }
  function tonhoehe(buf, sr, minHz, maxHz) {
    minHz = minHz || 40; maxHz = maxHz || 1600;
    const n = buf.length, tauMax = Math.min(Math.floor(sr / minHz), Math.floor(n / 2) - 2), tauMin = Math.max(2, Math.floor(sr / maxHz));
    if (tauMax <= tauMin) return null;
    let rms = 0; for (let i = 0; i < n; i++) rms += buf[i] * buf[i]; rms = Math.sqrt(rms / n); if (rms < 1e-4) return null;
    const W = n - tauMax - 1, d = new Float64Array(tauMax + 2);
    /* Differenzfunktion über ein festes Fenster: d(τ) = Σx² + Σx(+τ)² − 2·Σx·x(+τ); die Kreuzkorrelation schnell per FFT */
    let N = 1; while (N < n + W) N <<= 1;
    const re1 = new Float64Array(N), im1 = new Float64Array(N), re2 = new Float64Array(N), im2 = new Float64Array(N);
    for (let i = 0; i < W; i++) re1[i] = buf[i]; for (let i = 0; i < n; i++) re2[i] = buf[i];
    fft(re1, im1, false); fft(re2, im2, false);
    for (let i = 0; i < N; i++) { const a = re1[i], b = -im1[i], c = re2[i], e = im2[i]; re1[i] = a * c - b * e; im1[i] = a * e + b * c; }
    fft(re1, im1, true);
    const quad = new Float64Array(n + 1); for (let i = 0; i < n; i++) quad[i + 1] = quad[i] + buf[i] * buf[i];
    const e0 = quad[W];
    for (let tau = 1; tau <= tauMax + 1; tau++) d[tau] = Math.max(0, e0 + (quad[tau + W] - quad[tau]) - 2 * re1[tau] / N);
    /* kumulativ normiert */
    const dn = new Float32Array(tauMax + 2); dn[0] = 1; let sum = 0;
    for (let tau = 1; tau <= tauMax + 1; tau++) { sum += d[tau]; dn[tau] = sum > 0 ? d[tau] * tau / sum : 1; }
    /* erstes Tal unter der Schwelle; sonst das tiefste */
    let tau = -1; let gmin = 1; for (let t = tauMin; t <= tauMax; t++) if (dn[t] < gmin) gmin = t > 0 ? dn[t] : gmin;
    /* Schwelle: fest .12 – klingen mehrere Töne, liegt das gemeinsame (zu tiefe) Tal ganz unten; dann zählt schon ein deutliches früheres Tal */
    const SCHWELLE = Math.max(.12, Math.min(.3, gmin + .2));
    /* erstes Tal unter der Schwelle: dort das tiefste Minimum, solange die Kurve unter der Schwelle bleibt (kleine Rausch-Dellen überspringen) */
    for (let t = tauMin; t <= tauMax; t++) { if (dn[t] < SCHWELLE) { let m = t; while (t + 1 <= tauMax && dn[t + 1] < SCHWELLE) { t++; if (dn[t] < dn[m]) m = t; } tau = m; break; } }
    if (tau < 0) { let best = tauMin; for (let t = tauMin; t <= tauMax; t++) if (dn[t] < dn[best]) best = t; if (dn[best] > .35) return null; tau = best; }
    /* Feinabgleich 1: Parabel durch die drei Werte um das Tal */
    let t = tau; if (tau > 1 && tau < tauMax + 1) { const a = dn[tau - 1], b = dn[tau], c = dn[tau + 1], nn = a + c - 2 * b; if (nn > 0) t = tau + (a - c) / (2 * nn); }
    /* Feinabgleich 2: über mehrere Schwingungen hinweg vergleichen (normierte Korrelation – unempfindlich gegen
       Ausklingen und Rauschen); der Fehler teilt sich durch die Zahl der Schwingungen */
    const k = Math.max(1, Math.min(12, Math.floor((n * .5) / t))), W2 = n - Math.ceil(k * t) - Math.ceil(t * .07) - Math.ceil(k * Math.max(.6, t * .025)) - 6;
    if (W2 > 64) {
      const ncc = L => { let s = 0, e1 = 0, e2 = 0; for (let i = 0; i < W2; i++) { const a = buf[i], b = buf[i + L]; s += a * b; e1 += a * a; e2 += b * b; } return e1 > 0 && e2 > 0 ? s / Math.sqrt(e1 * e2) : 0; };
      const mitte = Math.round(k * t), weite = Math.ceil(k * Math.max(.6, t * .025)) + 1; let best = mitte, bw = -2; const werte = {};
      for (let L = Math.max(2, mitte - weite); L <= mitte + weite && L + W2 < n; L++) { const w = werte[L] = ncc(L); if (w > bw) { bw = w; best = L; } }
      if (best > mitte - weite && best < mitte + weite) {
        /* Ausgleichsparabel über eine breitere Umgebung des Gipfels – mittelt das Rauschen heraus */
        const wert = L => (werte[L] != null ? werte[L] : (werte[L] = ncc(L)));
        let m = 2; const mMax = Math.max(2, Math.round(t * .06));
        while (m < mMax && best - m - 1 >= 2 && best + m + 1 + W2 < n && wert(best - m - 1) > bw - .08 && wert(best + m + 1) > bw - .08) m++;
        let s0 = 0, s1 = 0, s2 = 0, s3 = 0, s4 = 0, y0 = 0, y1 = 0, y2 = 0;
        for (let L = best - m; L <= best + m; L++) { if (L < 2 || L + W2 >= n) continue; const y = werte[L] != null ? werte[L] : ncc(L), x = L - best;
          s0++; s1 += x; s2 += x * x; s3 += x * x * x; s4 += x * x * x * x; y0 += y; y1 += x * y; y2 += x * x * y; }
        /* Normalgleichungen lösen (Cramer) */
        const det = s4 * (s2 * s0 - s1 * s1) - s3 * (s3 * s0 - s1 * s2) + s2 * (s3 * s1 - s2 * s2);
        if (Math.abs(det) > 1e-12) {
          const A = (y2 * (s2 * s0 - s1 * s1) - s3 * (y1 * s0 - s1 * y0) + s2 * (y1 * s1 - s2 * y0)) / det;
          const B = (s4 * (y1 * s0 - y0 * s1) - y2 * (s3 * s0 - s1 * s2) + s2 * (s3 * y0 - y1 * s2)) / det;
          if (A < 0) { const Lf = best - B / (2 * A); if (Math.abs(Lf / k - t) < Math.max(1, t * .026)) t = Lf / k; }
        }
      }
    }
    return { hz: sr / t, klar: Math.max(0, Math.min(1, 1 - dn[tau])) };
  }
  /* @@TONHOEHE-ENDE */

  /* 🎯 Stimmgerät für Eingang 1/2 */
  let stimmT = 0;
  function stimmgeraet(nr) {
    const P = window.ImresPult; if (!P || !P.kanalAnalyse) { zeige(W("Stimmgerät gibt es im Bühnen-Pult", "Tuner is in the stage console")); return; }
    const an = [0, 1].filter(i => (P.kanal(i) || {}).an);
    if (!an.length) { zeige("🎯 " + W("Erst einen Eingang einschalten", "Switch an input on first"), null, W("MENU → Eingänge", "MENU → inputs")); eingangMenue(); return; }
    let i = nr != null && an.includes(nr) ? nr : an[0];
    const verlauf = [], buf = new Float32Array(4096);
    const a = { zu: () => { clearInterval(stimmT); menueZu(); }, wechsel: () => { if (an.length > 1) { i = an[(an.indexOf(i) + 1) % an.length]; verlauf.length = 0; zeichnen(); } } };
    const zeichnen = () => menue('<h3>🎯 ' + W("Stimmgerät", "Tuner") + '</h3><div class="zst"><div class="zst-note">–</div><div class="zst-skala"><i></i><b></b></div><div class="zst-info">' + W("Einen Ton anspielen und klingen lassen …", "Play one note and let it ring …") + "</div></div>" +
      '<div class="reihe zyn-opt">' + (an.length > 1 ? '<button type="button" data-zm="wechsel"><span>🎤 ' + W("Eingang ", "Input ") + (i + 1) + "</span><small>" + W("antippen: anderer Eingang", "tap: other input") + "</small></button>" : "") +
      '<button type="button" data-zm="zu">✕ ' + W("Fertig", "Done") + "</button></div>", a);
    zeichnen(); menueArt = "stimm";
    clearInterval(stimmT); stimmT = setInterval(() => {
      if (!$(".zyn-menue .zst")) { clearInterval(stimmT); return; }
      const ana = P.kanalAnalyse(i, 4096); if (!ana) return; ana.getFloatTimeDomainData(buf);
      let q = 0; for (let x = 0; x < buf.length; x++) q += buf[x] * buf[x]; const db = 10 * Math.log10(q / buf.length + 1e-12);
      const r = db > -55 ? tonhoehe(buf, P.abtastrate(), 40, 1600) : null;
      const noteEl = $(".zyn-menue .zst-note"), info = $(".zyn-menue .zst-info"), zeiger = $(".zyn-menue .zst-skala b"); if (!noteEl) return;
      if (!r || r.klar < .8) { if (verlauf.length && performance.now() - verlauf[verlauf.length - 1].t > 1500) verlauf.length = 0; if (!verlauf.length) { info.textContent = db > -55 ? W("kein klarer Ton – einen Ton einzeln anspielen", "no clear pitch – play a single note") : W("zu leise – lauter spielen oder Gain höher", "too quiet – play louder or raise gain"); } return; }
      verlauf.push({ hz: r.hz, t: performance.now() }); while (verlauf.length > 5) verlauf.shift();
      /* gleitender Median: einzelne Ausreißer springen nicht durch */
      const hz = verlauf.map(x => x.hz).sort((x, y) => x - y)[verlauf.length >> 1];
      const midi = 69 + 12 * Math.log2(hz / 440), nah = Math.round(midi), ct = Math.round((midi - nah) * 100), ton = ((nah % 12) + 12) % 12, okt = Math.floor(nah / 12) - 1;
      const inSkala = OPT.tonartAn && SKALEN[OPT.skala] && SKALEN[OPT.skala][2] ? SKALEN[OPT.skala][2].includes(((ton - OPT.grund) % 12 + 12) % 12) : null;
      noteEl.textContent = NOTEN[ton] + okt; noteEl.style.color = Math.abs(ct) <= 3 ? "#30ff70" : Math.abs(ct) <= 12 ? "#ffc830" : "#ff6a3a";
      zeiger.style.left = (50 + Math.max(-50, Math.min(50, ct))) + "%";
      info.textContent = (ct > 0 ? "+" : "") + ct + " ct · " + hz.toFixed(1) + " Hz" + (inSkala == null ? "" : inSkala ? " · ✓ " + W("in ", "in ") + tonartName() : " · ✗ " + W("nicht in ", "not in ") + tonartName());
    }, 110);
  }
  /* Eingänge 1 und 2 */
  const kanalHol = i => { const P = window.ImresPult; return P && P.kanal ? P.kanal(i) : null; };
  const kanalSetz = (i, w) => { const P = window.ImresPult; return Promise.resolve(P && P.kanal ? P.kanal(i, w) : null); };
  let pegelT = 0;
  function eingangMenue(fokusId) {
    const P = window.ImresPult; if (!P || !P.kanal) { zeige(W("Eingänge gibt es nur im Bühnen-Pult", "Inputs only in the stage console")); return; }
    if (!eingangMenue.karte) { eingangMenue.karte = []; audioPost({ aktion: "info" }).then(r => { if (r && r.ok) { eingangMenue.karte = (r.regler || []).filter(x => x.c != null); eingangMenue.geladen = true; if (menueArt === "eingang") eingangMenue(fokusId); } }); }
    const a = { zu: () => { clearInterval(pegelT); menueZu(); } };
    let h = '<div class="reihe zyn-opt">';
    [0, 1].forEach(i => {
      const k = kanalHol(i) || {};
      h += '<button type="button" data-zm="e:' + i + '"><span>' + (k.an ? "✅ " : "⬜ ") + W("Eingang ", "Input ") + (i + 1) + ' <i data-pegel="' + i + '" style="font-style:normal;font-family:monospace;color:#7fe08a"></i></span><small>' + (k.an ? W("an – Effekte: MIXER → Bank IN", "on – effects: MIXER → bank IN") + (i + 1) : W("aus – antippen zum Einschalten", "off – tap to switch on")) + (k.fehler ? " · ⚠ " + esc2(k.fehler) : "") + "</small></button>";
      a["e:" + i] = () => { kanalSetz(i, { an: !k.an }).then(x => { bankenNeu(); if (x && x.fehler) zeige("⚠ " + x.fehler); eingangMenue("e:" + i); }); };
      ["pegel", "laut", "duck"].forEach(f => {
        const nm = "IN" + (i + 1) + " " + (f === "pegel" ? W("Gain", "gain") : f === "duck" ? W("Musik weicht aus", "music ducks") : W("Lautstärke", "level"));
        const wv = k[f] != null ? k[f] : 0, dbT = f === "pegel" && wv > 0 ? " (" + (wv >= 100 ? "+" : "") + (20 * Math.log10(wv / 100)).toFixed(0) + " dB)" : "";
        h += '<button type="button" data-zm="e:' + i + ":" + f + '"><span>· ' + nm + ": <b>" + wv + " %" + dbT + "</b></span><small>" + W("◀ ▶ ändern", "◀ ▶ change") + (f === "pegel" ? W(" · bis +24 dB", " · up to +24 dB") : "") + "</small></button>";
        a["e:" + i + ":" + f + ":stufe"] = s => { const alt = ((kanalHol(i) || k)[f] || 0); const v = f === "pegel" ? (() => { let x = alt * Math.pow(10, s * 1.5 / 20); x = x >= 100 ? Math.round(x / 5) * 5 : Math.round(x); if (x === alt) x = alt + s; return Math.max(5, Math.min(1600, x)); })() : Math.max(0, Math.min(f === "duck" ? 80 : 100, alt + s * 5)); kanalSetz(i, { [f]: v }).then(() => eingangMenue("e:" + i + ":" + f)); };
      });
    });
    /* Eingangspegel der Soundkarte (vor Imres): übersteuert es schon dort, hilft der Gain in Imres nicht */
    (eingangMenue.karte || []).forEach((g, gi) => {
      h += '<button type="button" data-zm="kc:' + gi + '"><span>🎚 ' + W("Soundkarte ", "Sound card ") + esc2(g.name) + ": <b>" + g.c + " %</b></span><small>" + W("Eingangspegel vor der Bühne · ◀ ▶", "input level before the stage · ◀ ▶") + "</small></button>";
      a["kc:" + gi + ":stufe"] = st => { g.c = Math.max(0, Math.min(100, g.c + st * 5)); return audioPost({ aktion: "regler", name: g.name, art: "c", wert: g.c }).then(r => { if (r && r.ok) eingangMenue.karte = (r.regler || []).filter(x => x.c != null); eingangMenue("kc:" + gi); }); };
    });
    if (eingangMenue.karte && !eingangMenue.karte.length && eingangMenue.geladen) h += '<p class="hinweis" style="margin:4px 0">' + W("Die Soundkarte hat keinen eigenen Eingangsregler – übersteuert es an der Buchse, muss das Signal schon am Instrument, Tonabnehmer oder Vorverstärker leiser werden (oder über eine DI-Box mit Pad, z. B. −20 dB).", "The sound card has no input level control – lower the signal at the instrument, pickup or preamp (or use a DI box pad).") + "</p>";
    h += '<button type="button" data-zm="mit"><span>' + (MS.an ? "✅ " : "⬜ ") + "🎻 " + W("Mitspieler", "Ensemble follows") + (MS.an ? " – " + W("folgt Eingang ", "follows input ") + (MS.quelle + 1) : "") + "</span><small>" + W("Bühneninstrumente spielen deine Töne mit · Regler: MIXER → Bank MIT (Ensemble wie beim Streichfett)", "stage instruments play your notes · knobs: MIXER → bank MIT") + "</small></button>";
    a.mit = () => { if (!MS.an) { const an = [0, 1].filter(x => (kanalHol(x) || {}).an); if (!an.length) { zeige(W("Erst einen Eingang einschalten", "Switch an input on first")); return; } if (!an.includes(MS.quelle)) MS.quelle = an[0]; } msSchalten(); eingangMenue("mit"); };
    if (MS.an) { const anE = [0, 1].filter(x => (kanalHol(x) || {}).an);
      h += '<button type="button" data-zm="mitq"><span>· ' + W("hört auf Eingang ", "listens to input ") + (MS.quelle + 1) + "</span><small>" + W("antippen: anderer Eingang", "tap: other input") + "</small></button>";
      a.mitq = () => { if (anE.length > 1) { MS.quelle = anE[(anE.indexOf(MS.quelle) + 1) % anE.length]; msMerken(); } eingangMenue("mitq"); };
      h += '<button type="button" data-zm="mitmidi"><span>· ' + W("auch als MIDI an den Zynthian: ", "also as MIDI to Zynthian: ") + "<b>" + (MS.midi ? W("an, Kanal ", "on, channel ") + (MS.kanal + 1) : W("aus", "off")) + "</b></span><small>" + W("SEL: an/aus · ◀ ▶ Kanal", "SEL: on/off · ◀ ▶ channel") + "</small></button>";
      a.mitmidi = () => { MS.midi = !MS.midi; msMerken(); eingangMenue("mitmidi"); };
      a["mitmidi:stufe"] = st => { MS.kanal = (MS.kanal + st + 16) % 16; msMerken(); eingangMenue("mitmidi"); }; }
    h += '<button type="button" data-zm="trocken"><span>🧽 ' + W("Effekte der Eingänge aus", "Inputs: effects off") + "</span><small>" + W("Hall, Echo, Filter, Drive auf 0 – trockener Klang", "reverb, echo, filter, drive to 0 – dry sound") + "</small></button>";
    a.trocken = () => { [0, 1].forEach(x => kanalSetz(x, { hall: 0, echo: 0, filter: 0, drive: 0 })); if (MS.an && window.ImresPult.mitspieler) window.ImresPult.mitspieler({ hall: 0 }); zeige("🧽 " + W("Eingänge trocken", "Inputs dry"), null, W("Hall, Echo, Filter, Drive aus" + (MS.an ? " · Mitspieler ohne Hall" : ""), "effects off")); eingangMenue("trocken"); };
    h += '<button type="button" data-zm="stimm"><span>🎯 ' + W("Stimmgerät", "Tuner") + "</span><small>" + W("Ton, Abweichung in Cent, passt er zur Tonart?", "note, cents, fits the key?") + "</small></button>";
    h += '<button type="button" data-zm="tonart"><span>🎼 ' + W("Tonart aus dem Instrument erkennen", "Detect key from the instrument") + "</span><small>" + W("8 s quer über die Töne spielen – die Bühne spielt danach in dieser Tonart", "play across the notes for 8 s – the stage follows that key") + "</small></button>";
    a.stimm = () => { clearInterval(pegelT); stimmgeraet(); }; a.tonart = () => { clearInterval(pegelT); menueZu(); tonartErkennen(); };
    h += '<button type="button" data-zm="zu">✕ ' + W("Fertig", "Done") + "</button></div>" +
      '<p class="hinweis ein-tipp" style="display:none;color:#ffb070">' + W("⚠ Das Signal ist schon an der Buchse zu laut – der Gain der Bühne kann das nicht mehr retten. Den Eingangspegel der Soundkarte (oben, 🎚) deutlich senken oder am Instrument/Tonabnehmer leiser stellen.", "⚠ Clipping at the jack – lower the sound card input level above or the instrument output.") + "</p>" +
      '<p class="hinweis">' + W("Instrument an Eingang 1 oder 2 anstecken. Der Ton läuft durch die Bühne (mit eigenen Effekten) – dadurch etwas Verzögerung; zum Hören über die Anlage gedacht, nicht über Kopfhörer am Instrument.", "Plug into input 1 or 2. The sound runs through the stage (own effects) – a little latency; meant for the PA, not for monitoring at the instrument.") + "</p>";
    const m = menue("<h3>🎤 " + W("Eingänge – Handpan, Didgeridoo …", "Inputs – handpan, didgeridoo …") + "</h3>" + h, a); menueArt = "eingang"; audioAktionen = a;
    if (fokusId) { const b = m.querySelector('[data-zm="' + fokusId + '"]'); if (b) fokusSetzen(b); }
    clearInterval(pegelT); pegelT = setInterval(() => {
      if (!$(".zyn-menue") || menueArt !== "eingang") { clearInterval(pegelT); return; }
      [0, 1].forEach(i => { const el = $('[data-pegel="' + i + '"]'); if (!el) return; const v = P.kanalPegel ? P.kanalPegel(i) : 0, n = Math.round(Math.min(1, v) * 12), roh = P.kanalRoh ? P.kanalRoh(i) : null;
        el.textContent = (kanalHol(i) || {}).an ? "▕" + "█".repeat(n) + "·".repeat(12 - n) + "▏" + (roh && roh.clip ? W(" ⚠ übersteuert schon an der Buchse!", " ⚠ clipping at the jack!") : v > .95 ? " ⚠" : "") : "";
        el.style.color = (roh && roh.clip) || v > .95 ? "#ff4a3a" : v > .6 ? "#ffc830" : "#7fe08a";
        const tip = $(".zyn-menue .ein-tipp"); if (tip && roh && roh.clip) tip.style.display = "block"; });
    }, 150);
  }
  /* Reglerbänke für die Eingänge */
  const KANAL_FELDER = [["laut", W("🔊 Lautstärke", "🔊 Level"), 0, 100, 2, 80], ["pegel", W("🎤 Gain", "🎤 Gain"), 0, 1600, 20, 100], ["filter", W("🎛 Filter", "🎛 Filter"), -100, 100, 4, 0], ["echo", W("🔁 Delay", "🔁 Delay"), 0, 100, 4, 0],
    ["rueck", W("↻ Rückkopplung", "↻ Feedback"), 0, 90, 5, 35], ["hall", W("🏛 Hall", "🏛 Reverb"), 0, 100, 4, 0], ["drive", W("🔥 Drive", "🔥 Drive"), 0, 100, 4, 0], ["pan", W("↔ Panorama", "↔ Pan"), -100, 100, 5, 0], ["duck", W("⤵ Musik weicht aus", "⤵ Music ducks"), 0, 80, 5, 0]];
  [0, 1].forEach(i => KANAL_FELDER.forEach(([f, nm, lo, hi, st, neutral]) => {
    ZP_PARAM["in" + (i + 1) + "_" + f] = { name: "IN" + (i + 1) + " " + nm, lo, hi, schritt: st, neutral, druck: "null", lies: () => (kanalHol(i) || {})[f] || 0, setz: v => { kanalSetz(i, { [f]: v }); },
      text: f === "laut" || f === "pegel" ? (v => (kanalHol(i) || {}).an ? v + " %" + (f === "pegel" ? " (" + (v > 0 ? (20 * Math.log10(v / 100) >= 0 ? "+" : "") + (20 * Math.log10(v / 100)).toFixed(0) + " dB" : "−∞") + ")" : "") : W("aus (MENU)", "off (MENU)")) : f === "filter" ? (v => v === 0 ? W("offen", "open") : v < 0 ? W("Tiefpass ", "Low-pass ") + (-v) + " %" : W("Hochpass ", "High-pass ") + v + " %") : f === "pan" ? (v => v === 0 ? W("Mitte", "centre") : v < 0 ? W("links ", "left ") + (-v) : W("rechts ", "right ") + v) : null };
  }));
  /* Lautstärke-Regler der Soundkarte (dieselben wie im Zynthian unter Admin → Audio-Pegel) als Drehregler */
  const KARTE = { regler: [], geladen: 0 };
  function karteLaden(neu) { if (!neu && Date.now() - KARTE.geladen < 20000) return; KARTE.geladen = Date.now(); audioPost({ aktion: "info" }).then(r => { if (r && r.ok) { KARTE.regler = r.regler || []; zpReglerAnzeige(); } }); }
  const KH = /head|hp|kopf|phone/i;
  const karteRegler = kh => { const l = KARTE.regler.filter(g => g.p != null); return kh ? l.find(g => KH.test(g.name)) : (l.find(g => !KH.test(g.name) && /master|digital|dac|pcm|line|out|main/i.test(g.name)) || l.find(g => !KH.test(g.name)) || l[0]); };
  [["karte_haupt", false, W("🔈 Gesamt", "🔈 Master")], ["karte_kh", true, W("🎧 Kopfhörer", "🎧 Headphones")]].forEach(([id, kh, nm]) => {
    let t = 0, wart = null;
    ZP_PARAM[id] = { name: nm, lo: 0, hi: 100, schritt: 2, neutral: 70, druck: "", lies: () => { karteLaden(); const g = karteRegler(kh); return wart != null ? wart : g ? g.p : 0; },
      setz: v => { const g = karteRegler(kh); if (!g) { zeige(nm, null, W("Regler nicht gefunden – MENU → Audio", "control not found – MENU → audio")); return; } wart = v; g.p = v;
        if (!t) t = setTimeout(() => { t = 0; const x = wart; audioPost({ aktion: "regler", name: g.name, art: "p", wert: x }).then(() => { if (wart === x) wart = null; }); }, 120); },
      text: v => { const g = karteRegler(kh); return g ? v + " % · " + g.name : W("– (keiner)", "– (none)"); } };
  });
  ZP_PARAM.boost = { name: W("📢 Boost", "📢 Boost"), lo: 0, hi: 12, schritt: 1, neutral: 0, druck: "null", lies: () => { const P = window.ImresPult; return P && P.boost ? P.boost() : 0; }, setz: v => { const P = window.ImresPult; if (P && P.boost) P.boost(v); }, text: v => "+" + v + " dB" };

  /* 🎻 Mitspieler: Töne des angesteckten Instruments erkennen und von Bühneninstrumenten (und auf Wunsch per MIDI) mitspielen lassen */
  const MS = Object.assign({ an: false, quelle: 0, midi: false, kanal: 0 }, (() => { try { return JSON.parse(lies("imres-zp-mit", "{}")) || {}; } catch (_) { return {}; } })());
  /* Mitspieler und Eingänge: wie beim letzten Mal (Eingänge standardmäßig an) – nach dem Laden der Bühne wieder öffnen */
  (function eingaengeWieder(n) {
    const P = window.ImresPult; if (SEITE !== "buehne") return;
    if (!P || !P.kanal || !P.listen) { if (n < 60) setTimeout(() => eingaengeWieder(n + 1), 500); return; }
    const an = [0, 1].filter(i => (P.kanal(i) || {}).an); if (!an.length) { if (MS.an) { MS.an = false; msMerken(); } return; }
    Promise.all(an.map(i => P.kanal(i, { an: true }))).then(() => { bankenNeu(); if (MS.an) { MS.an = false; msSchalten(true); } });
  })(0);
  const msMerken = () => schreib("imres-zp-mit", JSON.stringify(MS));
  let msT = 0, msLetzt = 0, msWartet = false; const msZustand = {};
  const msPuf = new Float32Array(2048), msTon = new Float32Array(8192);
  function msZiel(midi) {
    /* in die Tonart einrasten (falls eine gewählt ist) – ein schräger Ton wird zum nächsten passenden */
    const sk = OPT.tonartAn && SKALEN[OPT.skala] && SKALEN[OPT.skala][2]; let n = Math.round(midi);
    if (sk) { let best = n, bd = 99; for (let d = -2; d <= 2; d++) { const c = n + d; if (sk.includes(((c - OPT.grund) % 12 + 12) % 12) && Math.abs(c - midi) < bd) { bd = Math.abs(c - midi); best = c; } } n = best; }
    return n;
  }
  function msSchalten(an) {
    const P = window.ImresPult; MS.an = an == null ? !MS.an : !!an; msMerken(); clearInterval(msT); msT = 0;
    if (!MS.an || !P || !P.mitspieler) { bankenNeu(); return; }
    P.mitspieler({}); /* Klänge vorladen */
    msT = setInterval(() => {
      const ana = P.kanalAnalyse(MS.quelle, 2048); if (!ana || msWartet) return;
      ana.getFloatTimeDomainData(msPuf); const sr = P.abtastrate() || 44100, jetzt = performance.now();
      msZustand.schwelle = 2.9 - (MS.empf == null ? 50 : MS.empf) / 100 * 1.2; /* Empfindlichkeit 0 … 100 → Schwelle 2,9 … 1,7 */
      const an = anschlagSuchen(msPuf, sr, msZustand); const wann = an ? jetzt - an.abstand / sr * 1000 : -1, db = an ? an.db : -99;
      if (wann < 0 || wann - msLetzt < 90) return;
      msLetzt = wann; msWartet = true;
      /* kurz warten, bis der neue Ton klar steht, dann die Tonhöhe bestimmen */
      setTimeout(() => {
        msWartet = false; const a2 = P.kanalAnalyse(MS.quelle, 8192); if (!a2) return; a2.getFloatTimeDomainData(msTon);
        const sr2 = P.abtastrate(), idx = Math.round(msTon.length - (performance.now() - wann) / 1000 * sr2);
        const hz = neuerTon(msTon, idx, sr2); if (!hz) return;
        const n = msZiel(69 + 12 * Math.log2(hz / 440)), st = Math.max(.3, Math.min(1, (db + 48) / 40));
        P.mitspielen(n, st); msZuletzt = n;
        if (MS.midi) { const t = performance.now(), v = Math.round(40 + st * 80); beglSenden([{ k: MS.kanal, n, v, t }, { k: MS.kanal, n, v: 0, t: t + 1600 }]); }
      }, 75);
    }, 12);
    bankenNeu();
  }
  let msZuletzt = null;
  /* @@MIT-ANFANG Anschlag erkennen über „spektralen Zuwachs“: wie viel NEUER Klang (neue Frequenzen) im jüngsten Stück
     gegenüber dem davor auftaucht – so fällt ein neuer Ton auch dann auf, wenn die vorigen noch laut nachklingen.
     zustand merkt sich den gleitenden Durchschnitt; Rückgabe { abstand: Werte vom Pufferende bis zum Anschlag, db } oder null */
  function anschlagSuchen(buf, sr, zustand) {
    const n = buf.length, F = 1024, N = 1024; if (n < 2 * F) return null;
    const mag = start => { const re = new Float64Array(N), im = new Float64Array(N); for (let i = 0; i < F; i++) re[i] = buf[start + i] * (.5 - .5 * Math.cos(2 * Math.PI * i / (F - 1))); fft(re, im, false);
      const m = new Float64Array(N / 2); for (let i = 0; i < N / 2; i++) m[i] = Math.log(1 + 10 * Math.hypot(re[i], im[i])); return m; };
    const A = mag(n - 2 * F), B = mag(n - F), lo = Math.floor(60 / (sr / N)), hi = Math.min(N / 2, Math.ceil(5000 / (sr / N)));
    /* nur was deutlich über dem Grundrauschen liegt, zählt */
    const sortiert = Array.from(B.subarray(lo, hi)).sort((x, y) => x - y), boden = sortiert[sortiert.length >> 1] + .7;
    let flux = 0; for (let i = lo; i < hi; i++) { if (B[i] < boden) continue; const d = B[i] - Math.max(A[i], boden - .7); if (d > 0) flux += d; }
    let q = 0; for (let i = n - F; i < n; i++) q += buf[i] * buf[i]; const db = 10 * Math.log10(q / F + 1e-12);
    const z = zustand || {}; const mittel = z.mittel == null ? flux : z.mittel; z.mittel = mittel * .9 + flux * .1;
    if (db < -50 || flux < Math.max(4, mittel * (z.schwelle || 2.2))) return null;
    /* wo genau? der erste 64er-Block, dessen „Kanten“-Energie (Anschläge sind breitbandig) deutlich über den 8 Blöcken davor liegt */
    const B64 = 64, e = [], ab = n - F - 8 * B64;
    for (let s0 = ab; s0 + B64 <= n; s0 += B64) { let x = 0; for (let i = Math.max(1, s0); i < s0 + B64; i++) { const d = buf[i] - buf[i - 1]; x += d * d; } e.push(x); }
    let best = n - F, staerkste = 0;
    for (let k = 8; k < e.length; k++) { const vor = e.slice(k - 8, k).sort((x, y) => x - y)[4] + 1e-12, r = e[k] / vor; if (r > 4) { best = ab + k * B64; break; } if (r > staerkste) { staerkste = r; best = ab + k * B64; } }
    return { abstand: n - best, db };
  }
  /* Welcher Ton ist NEU dazugekommen? Spektrum nach dem Anschlag minus Spektrum davor – so stört der noch klingende vorige Ton nicht.
     Dann den Grundton dieses neuen Teils suchen und mit der genauen Tonhöhen-Messung in einem engen Bereich nachschärfen. */
  function neuerTon(buf, idx, sr) {
    const L = 2048, N = 16384; if (idx - L < 0 || idx + 64 + L > buf.length) return null;
    const spek = start => { const re = new Float64Array(N), im = new Float64Array(N); for (let i = 0; i < L; i++) re[i] = buf[start + i] * (.5 - .5 * Math.cos(2 * Math.PI * i / (L - 1))); fft(re, im, false); const m = new Float64Array(N / 2); for (let i = 0; i < N / 2; i++) m[i] = Math.hypot(re[i], im[i]); return m; };
    const vor = spek(idx - L), nach = spek(idx + 64), bin = sr / N, diff = new Float64Array(N / 2);
    for (let i = 0; i < N / 2; i++) diff[i] = Math.max(0, nach[i] - vor[i] * 1.15);
    const lo = Math.floor(65 / bin), hi = Math.min(N / 2 - 2, Math.ceil(1700 / bin)); let pk = lo, pmax = 0;
    for (let i = lo; i <= hi; i++) if (diff[i] > pmax) { pmax = diff[i]; pk = i; }
    if (pmax <= 0) return null;
    /* kaum Neues im Spektrum: derselbe Ton wurde noch einmal angeschlagen – dann zählt der lauteste Ton danach */
    let nmax = 0, npk = lo; for (let i = lo; i <= hi; i++) if (nach[i] > nmax) { nmax = nach[i]; npk = i; }
    if (pmax < nmax * .1) { const f0 = npk * bin, r = tonhoehe(buf.subarray(idx + 64, Math.min(buf.length, idx + 64 + 4096)), sr, f0 * .95, f0 * 1.05); return r ? r.hz : f0; }
    const wert = f => { const x = f / bin, i = Math.round(x); let m = 0; for (let k = i - 2; k <= i + 2; k++) if (k > 0 && k < diff.length) m = Math.max(m, diff[k]); return m; };
    /* genaue Lage einer Spitze: Parabel durch die Nachbarn (logarithmisch) */
    const genau = i => { let k = i; for (let j = i - 2; j <= i + 2; j++) if (j > 0 && j < diff.length - 1 && diff[j] > diff[k]) k = j; const a = Math.log(diff[k - 1] + 1e-9), b = Math.log(diff[k] + 1e-9), c = Math.log(diff[k + 1] + 1e-9), nn = a + c - 2 * b; return (nn < 0 ? k + (a - c) / (2 * nn) : k) * bin; };
    let f = genau(pk);
    /* liegt unter der stärksten Spitze ein Grundton (1/2, 1/3), der selbst deutlich da ist, ist das der eigentliche Ton */
    /* … auch wenn er von einem noch klingenden Ton (dessen Oberton) teilweise verdeckt ist: dann ist er dort wenigstens deutlich lauter geworden */
    const spitzeIn = (arr, fq) => { const i = Math.round(fq / bin); let m = 0; for (let k = i - 2; k <= i + 2; k++) if (k > 0 && k < arr.length) m = Math.max(m, arr[k]); return m; };
    let nmax2 = 0; for (let i = lo; i <= hi; i++) if (nach[i] > nmax2) nmax2 = nach[i];
    for (const t of [3, 2]) { const g = f / t; if (g < 65) continue; const zu = spitzeIn(nach, g) / (spitzeIn(vor, g) + 1e-9);
      if (wert(g) > pmax * .2 || (zu > 1.35 && spitzeIn(nach, g) > nmax2 * .2)) { const i = Math.round(g / bin); f = wert(g) > 0 ? genau(i) : g; break; } }
    /* nachschärfen über die Obertöne: bei 2f und 3f liegen die Nachbartöne weiter auseinander – gewichteter Mittelwert */
    let sw = wert(f), sf = f * sw;
    for (const h of [2, 3]) { const fh = h * f; if (fh / bin >= diff.length - 3) break; const w = wert(fh); if (w > pmax * .15) { const g = genau(Math.round(fh / bin)) / h; if (Math.abs(1200 * Math.log2(g / f)) < 60) { sf += g * w * h; sw += w * h; } } }
    return sf / sw;
  }
  /* @@MIT-ENDE */
  const MS_NAMEN = () => { const P = window.ImresPult; return P && P.mitspieler ? P.mitspieler().lagen : []; };
  ZP_PARAM.mit_stufe = { name: W("🎻 Mitspieler-Ensemble", "🎻 Ensemble"), lo: 0, hi: 8, schritt: 1, neutral: 3, druck: "null",
    lies: () => { const P = window.ImresPult; return P && P.mitspieler ? P.mitspieler().stufe : 0; }, setz: v => { const P = window.ImresPult; if (P && P.mitspieler) P.mitspieler({ stufe: v }); },
    text: v => v ? v + " · " + (v === 1 ? "" : W("bis ", "up to ")) + (MS_NAMEN()[v - 1] || "") : W("niemand", "nobody") };
  ZP_PARAM.mit_laut = { name: W("🎻 Mitspieler laut", "🎻 Ensemble level"), lo: 0, hi: 100, schritt: 2, neutral: 70, druck: "stumm",
    lies: () => { const P = window.ImresPult; return P && P.mitspieler ? P.mitspieler().laut : 0; }, setz: v => { const P = window.ImresPult; if (P && P.mitspieler) P.mitspieler({ laut: v }); } };
  ZP_PARAM.mit_hall = { name: W("🎻 Mitspieler Hall", "🎻 Ensemble reverb"), lo: 0, hi: 100, schritt: 5, neutral: 35, druck: "null",
    lies: () => { const P = window.ImresPult; return P && P.mitspieler ? P.mitspieler().hall : 0; }, setz: v => { const P = window.ImresPult; if (P && P.mitspieler) P.mitspieler({ hall: v }); } };
  ZP_PARAM.mit_empf = { name: W("🎻 Mitspieler Empfindlichkeit", "🎻 Ensemble sensitivity"), lo: 0, hi: 100, schritt: 5, neutral: 50, druck: "null",
    lies: () => MS.empf == null ? 50 : MS.empf, setz: v => { MS.empf = v; msMerken(); }, text: v => v + " % – " + (v < 35 ? W("nur deutliche Anschläge", "only clear strokes") : v > 70 ? W("auch leise Töne (mehr Fehlgriffe)", "soft notes too (more errors)") : W("ausgewogen", "balanced")) };
  ZP_PARAM.mit_okt = { name: W("🎻 Mitspieler Oktave", "🎻 Ensemble octave"), lo: -2, hi: 2, schritt: 1, neutral: 0, druck: "null",
    lies: () => { const P = window.ImresPult; return P && P.mitspieler ? P.mitspieler().oktave || 0 : 0; }, setz: v => { const P = window.ImresPult; if (P && P.mitspieler) P.mitspieler({ oktave: v }); },
    text: v => v ? (v > 0 ? "+" : "") + v + W(" Oktave", " octave") : W("wie gespielt", "as played") };
  BANK_FARBE.MIT = "#ffd890";
  ZB.regler.MIT = ZB.regler.MIT || ["mit_stufe", "mit_laut", "mit_empf", "mit_okt"];
  MIX_LISTE.push("mit_stufe", "mit_laut");
  const WETTER_NAME = [W("☀ klar", "☀ clear"), W("💨 Wind", "💨 wind"), W("🌧 Regen", "🌧 rain"), W("⛈ Starkregen", "⛈ downpour"), W("🌩 Gewitter", "🌩 thunderstorm"), W("🌪 Unwetter", "🌪 tempest")];
  ZP_PARAM.wetter = { name: W("🌦 Wetter", "🌦 Weather"), lo: 0, hi: 5, schritt: 1, neutral: 0, druck: "null",
    lies: () => { const P = window.ImresPult; return P && P.wetter ? P.wetter() : 0; }, setz: v => { const P = window.ImresPult; if (P && P.wetter) P.wetter(v); }, text: v => WETTER_NAME[v] || "" };
  NORMAL_PARAMS.push("wetter");
  NORMAL_PARAMS.push("karte_haupt", "karte_kh", "boost"); MIX_LISTE.splice(5, 0, "boost");
  BANK_FARBE.IN1 = "#ff9a80"; BANK_FARBE.IN2 = "#d090ff";
  ZB.regler.IN1 = ZB.regler.IN1 || ["in1_laut", "in1_filter", "in1_echo", "in1_hall"];
  ZB.regler.IN2 = ZB.regler.IN2 || ["in2_laut", "in2_filter", "in2_echo", "in2_hall"];
  function bankenNeu() {
    const l = ["A", "B", "FX"]; [0, 1].forEach(i => { if ((kanalHol(i) || {}).an) l.push("IN" + (i + 1)); }); if (MS.an) l.push("MIT");
    BANKEN.length = 0; l.forEach(x => BANKEN.push(x)); if (bank >= BANKEN.length) bank = 0; zpZeichnen(true);
  }
  /* ===================== 💾 Sicherung der Einstellungen auf der SD-Karte ===================== */
  const sicherPost = d => fetch("/zyn/sicherung", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(d) }).then(r => r.json()).catch(() => ({ ok: false, fehler: W("Brücke nicht erreichbar", "bridge unreachable") }));
  function sicherDaten() { const d = {}; try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (/^imres-/.test(k) && !/^imres-zp-sicher/.test(k)) d[k] = localStorage.getItem(k); } } catch (_) {} return d; }
  let sicherLetzt = "";
  function sichern(auto) {
    const d = sicherDaten(), j = JSON.stringify(d); if (auto && j === sicherLetzt) return Promise.resolve({ ok: true, gleich: true });
    return sicherPost({ aktion: "speichern", daten: d, auto: !!auto }).then(r => { if (r.ok) { sicherLetzt = j; schreib("imres-zp-sicher-stand", String(Date.now())); } return r; });
  }
  function wiederherstellen(name) {
    return sicherPost({ aktion: "laden", name }).then(r => {
      if (!r.ok || !r.daten) { zeige("⚠ " + W("Sicherung nicht lesbar", "backup unreadable")); return false; }
      try { Object.keys(r.daten).forEach(k => { if (/^imres-/.test(k)) localStorage.setItem(k, r.daten[k]); }); localStorage.setItem("imres-zp-sicher-stand", String(Date.now())); } catch (_) {}
      zeige("💾 " + W("Einstellungen wiederhergestellt", "Settings restored"), null, W("lädt neu …", "reloading …")); setTimeout(() => location.reload(), 700); return true;
    });
  }
  /* alle 2 Minuten still sichern, wenn sich etwas geändert hat */
  setInterval(() => { if (!document.hidden) sichern(true); }, 120000);
  /* frisches Browserprofil (z. B. nach Neuinstallation): die letzte automatische Sicherung zurückholen */
  if (!lies("imres-zp-sicher-stand", "") && !sessionStorage.getItem("imres-zp-sicher-versucht")) {
    try { sessionStorage.setItem("imres-zp-sicher-versucht", "1"); } catch (_) {}
    sicherPost({ aktion: "laden", name: "auto.json" }).then(r => { if (r.ok && r.daten && Object.keys(r.daten).length > 3) wiederherstellen("auto.json"); else setTimeout(() => sichern(true), 5000); });
  } else setTimeout(() => sichern(true), 20000);
  function sicherMenue(fokusId) {
    menue('<h3>💾 ' + W("Sicherung", "Backup") + '</h3><p class="hinweis">⏳</p>', { zu: menueZu });
    sicherPost({ aktion: "liste" }).then(r => {
      const a = { zu: menueZu, jetzt: () => { sichern(false).then(x => { zeige(x.ok ? "💾 " + W("Gesichert", "Saved") : "⚠ " + (x.fehler || "")); sicherMenue("jetzt"); }); } };
      const zeit = t => new Date(t * 1000).toLocaleString(W("de-DE", "en-GB"), { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
      let h = '<div class="reihe zyn-opt"><button type="button" data-zm="jetzt"><span>💾 ' + W("Jetzt sichern", "Save now") + "</span><small>" + W("Belegung, Favoriten, Sets, Mischungen, Optionen", "mapping, favourites, sets, mixes, options") + "</small></button>";
      (r.liste || []).slice(0, 9).forEach((x, i) => { h += '<button type="button" data-zm="w:' + i + '"><span>↺ ' + (x.name === "auto.json" ? W("automatisch", "automatic") : W("von Hand", "manual")) + " · " + zeit(x.zeit) + "</span><small>" + W("wiederherstellen", "restore") + " · " + x.kb + " kB</small></button>"; a["w:" + i] = () => wiederherstellen(x.name); });
      h += '<button type="button" data-zm="zu">✕ ' + W("Fertig", "Done") + '</button></div><p class="hinweis">' + W("Die Bühne sichert alle 2 Minuten automatisch auf die SD-Karte. Nach einer Neuinstallation holt sie die letzte Sicherung von selbst zurück.", "The stage saves to the SD card every 2 minutes and restores it after a reinstall.") + "</p>";
      const m = menue("<h3>💾 " + W("Sicherung", "Backup") + "</h3>" + h, a); menueArt = "sicher"; if (fokusId) { const b = m.querySelector('[data-zm="' + fokusId + '"]'); if (b) fokusSetzen(b); }
    });
  }
  /* ===================== WLAN & Bluetooth ===================== */
  const netzPost = d => fetch("/zyn/netz", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(d) }).then(r => r.json()).catch(() => ({ ok: false, fehler: W("Brücke nicht erreichbar", "bridge unreachable") }));
  const warteMenue = (titel, text) => { menue("<h3>" + titel + '</h3><p class="hinweis" style="font-size:16px">⏳ ' + text + '</p><div class="reihe drei"><button type="button" data-zm="zu">✕ ' + W("Abbrechen", "Cancel") + "</button></div>", { zu: menueZu }); menueArt = "warte"; };
  function wlanMenue(suchen) {
    warteMenue("📶 WLAN", suchen ? W("Suche Netze … (bis 20 s)", "Scanning … (up to 20 s)") : W("Lese Status …", "Reading status …"));
    Promise.all([netzPost({ aktion: "wlan_status" }), netzPost({ aktion: "wlan_liste" })]).then(([st, li]) => {
      if (!$(".zyn-menue")) return;
      const a = { zu: menueZu, neu: () => wlanMenue(true) };
      const wl = (st.wlan || [])[0], kopf = wl ? (wl.status === "connected" ? "✅ " + W("verbunden mit ", "connected to ") + "<b>" + esc2(wl.netz) + "</b>" : "⬜ " + W("nicht verbunden", "not connected")) : W("kein WLAN-Gerät gefunden", "no Wi-Fi device found");
      let h = '<p class="hinweis" style="font-size:14px">' + kopf + (st.ip ? " · IP " + esc2(st.ip) : "") + '</p><div class="reihe zyn-opt">';
      (li.netze || []).forEach((n, i) => {
        const balken = n.signal > 70 ? "▂▄▆█" : n.signal > 45 ? "▂▄▆_" : n.signal > 20 ? "▂▄__" : "▂___";
        h += '<button type="button" data-zm="n:' + i + '"><span>' + (n.an ? "✅ " : "") + esc2(n.ssid) + " " + balken + "</span><small>" + (n.schutz ? "🔒 " + esc2(n.schutz) : W("offen", "open")) + "</small></button>";
        a["n:" + i] = () => { if (n.an) return; if (n.schutz) tastatur("🔒 " + n.ssid, "", pw => wlanVerbinden(n.ssid, pw), true); else wlanVerbinden(n.ssid, ""); };
      });
      if (!(li.netze || []).length) h += '<p class="hinweis">' + esc2(li.fehler || W("keine Netze gefunden", "no networks found")) + "</p>";
      h += '<button type="button" data-zm="gesp"><span>💾 ' + W("Gespeicherte Netze", "Saved networks") + "</span><small>" + W("ansehen, einzelne vergessen", "view, forget single ones") + '</small></button><button type="button" data-zm="neu">🔄 ' + W("Neu suchen", "Scan again") + '</button><button type="button" data-zm="zu">✕ ' + W("Fertig", "Done") + "</button></div>";
      a.gesp = () => wlanGespeichert();
      menue("<h3>📶 WLAN</h3>" + h, a); menueArt = "wlan";
    });
  }
  /* gespeicherte WLANs: der Zynthian verbindet sich mit jedem davon von selbst, sobald es in Reichweite ist */
  function wlanGespeichert(fokusId) {
    warteMenue("💾 WLAN", W("Lese gespeicherte Netze …", "Reading saved networks …"));
    netzPost({ aktion: "wlan_gespeichert" }).then(r => {
      if (!$(".zyn-menue")) return;
      const a = { zu: menueZu, zurueck: () => wlanMenue() }; let h = '<p class="hinweis">' + W("🔐 = Passwort zusätzlich im eigenen Speicher gesichert – geht es dem Zynthian verloren, trägt die Bühne es von selbst wieder ein und verbindet sich. Antippen → noch einmal antippen zum Vergessen.", "🔐 = password also kept in our own store – if the Zynthian loses it, it is restored and reconnected automatically. Tap → tap again to forget.") + '</p><div class="reihe zyn-opt">';
      let wahl = null;
      (r.netze || []).forEach((n, i) => {
        h += '<button type="button" data-zm="g:' + i + '"><span>' + (n.gesichert ? "🔐 " : "📶 ") + esc2(n.name) + "</span><small>" + (n.nurSpeicher ? W("wird gleich wiederhergestellt", "being restored") : n.zuletzt && !/never|nie/i.test(n.zuletzt) ? W("zuletzt: ", "last: ") + esc2(n.zuletzt) : W("gespeichert", "saved")) + "</small></button>";
        a["g:" + i] = () => { const b = $('.zyn-menue [data-zm="g:' + i + '"] small');
          if (wahl !== i) { wahl = i; $$(".zyn-menue [data-zm^='g:'] small").forEach((x, j) => { x.textContent = j === i ? W("⚠ nochmal antippen = vergessen", "⚠ tap again = forget") : W("gespeichert", "saved"); }); return; }
          netzPost({ aktion: "wlan_vergessen", name: n.name }).then(x => { zeige(x.ok ? "🗑 " + W("Vergessen: ", "Forgotten: ") + n.name : "⚠ " + (x.meldung || x.fehler || "")); wlanGespeichert(); }); };
      });
      if (!(r.netze || []).length) h += '<p class="hinweis">' + W("Noch keine Netze gespeichert.", "No saved networks yet.") + "</p>";
      h += '<button type="button" data-zm="zurueck">◀ ' + W("Zurück zur Suche", "Back to scan") + '</button><button type="button" data-zm="zu">✕ ' + W("Fertig", "Done") + "</button></div>";
      const m = menue("<h3>💾 " + W("Gespeicherte WLANs", "Saved Wi-Fi") + "</h3>" + h, a); menueArt = "wlan";
      if (fokusId) { const b = m.querySelector('[data-zm="' + fokusId + '"]'); if (b) fokusSetzen(b); }
    });
  }
  function wlanVerbinden(ssid, pw) {
    warteMenue("📶 " + esc2(ssid), W("Verbinde … (bis 45 s)", "Connecting … (up to 45 s)"));
    netzPost({ aktion: "wlan_verbinden", ssid, pw }).then(r => { zeige(r.ok ? "📶 " + W("Verbunden: ", "Connected: ") + ssid : "⚠ " + W("WLAN: ", "Wi-Fi: ") + (r.meldung || r.fehler || W("hat nicht geklappt", "failed")), null, r.ok ? "" : W("Passwort prüfen", "check password")); if ($(".zyn-menue")) wlanMenue(false); });
  }
  function btMenue(suchen) {
    warteMenue("🔊 Bluetooth", suchen ? W("Suche Geräte … (10 s) – Lautsprecher in den Kopplungsmodus schalten", "Scanning (10 s) – put the speaker in pairing mode") : W("Lese Geräte …", "Reading devices …"));
    netzPost({ aktion: "bt_liste", suchen: !!suchen }).then(r => {
      if (!$(".zyn-menue")) return;
      const a = { zu: menueZu, suchen: () => btMenue(true), aus: () => { warteMenue("🔊 Bluetooth", W("Schalte zurück …", "Switching back …")); netzPost({ aktion: "bt_trennen" }).then(x => { zeige("🔊 " + (x.meldung || "")); menueZu(); }); } };
      const bt = String(r.ausgang || "").startsWith("bt:");
      let h = '<p class="hinweis" style="font-size:14px">' + W("Ton kommt jetzt aus: ", "Sound now plays through: ") + "<b>" + (bt ? "🔊 Bluetooth" : "🎛 " + W("Zynthian-Ausgänge", "Zynthian outputs")) + "</b>" + (r.install && r.install.meldung ? " · " + esc2(r.install.meldung) : "") + '</p><div class="reihe zyn-opt">';
      (r.geraete || []).forEach((g, i) => {
        h += '<button type="button" data-zm="g:' + i + '"><span>' + (g.verbunden ? "✅ " : g.audio ? "🔊 " : "📱 ") + esc2(g.name) + "</span><small>" + (g.verbunden ? W("verbunden", "connected") : g.gekoppelt ? W("gekoppelt – antippen zum Verbinden", "paired – tap to connect") : W("antippen zum Koppeln", "tap to pair")) + "</small></button>";
        a["g:" + i] = () => { warteMenue("🔊 " + esc2(g.name), W("Koppeln und verbinden … (bis 60 s)", "Pairing and connecting … (up to 60 s)")); netzPost({ aktion: "bt_verbinden", mac: g.mac }).then(x => { zeige((x.ok ? "🔊 " : "⚠ ") + (x.meldung || ""), null, x.ok ? W("die Seite lädt kurz neu", "the page reloads briefly") : ""); if (!x.ok && $(".zyn-menue")) btMenue(false); }); };
      });
      if (!(r.geraete || []).length) h += '<p class="hinweis">' + esc2(r.fehler || W("noch keine Geräte – „Suchen“ drücken", "no devices yet – press “Scan”")) + "</p>";
      h += '<button type="button" data-zm="suchen">🔍 ' + W("Geräte suchen", "Scan for devices") + "</button>" + (bt ? '<button type="button" data-zm="aus">🎛 ' + W("Zurück zu den Zynthian-Ausgängen", "Back to Zynthian outputs") + "</button>" : "") + '<button type="button" data-zm="zu">✕ ' + W("Fertig", "Done") + "</button></div>" +
        '<p class="hinweis">' + W("Über Bluetooth kommt der Ton etwa 0,2 s später – für den Takt mit der TR-8S lieber die Kabel-Ausgänge nehmen.", "Bluetooth adds ~0.2 s delay – use the cable outputs to stay in time with the TR-8S.") + "</p>";
      menue("<h3>🔊 " + W("Bluetooth-Lautsprecher", "Bluetooth speaker") + "</h3>" + h, a); menueArt = "bt";
    });
  }
  /* Bildschirm-Tastatur (Pfeile/Drehregler + SEL oder Finger) */
  function tastatur(titel, start, fertig, geheim) {
    let txt = start || "", gross = false, sicht = !geheim;
    const REIHEN = ["1234567890", "qwertzuiop", "asdfghjklü", "yxcvbnmöä", "-_.@!?#&*+"];
    const zeichnen = fokusId => {
      const a = { zu: menueZu, ok: () => { menueZu(); fertig(txt); }, del: () => { txt = txt.slice(0, -1); zeichnen("del"); }, gr: () => { gross = !gross; zeichnen("gr"); }, sp: () => { txt += " "; zeichnen("sp"); }, eye: () => { sicht = !sicht; zeichnen("eye"); } };
      let h = '<h3>' + esc2(titel) + '</h3><div style="text-align:center;font:600 20px monospace;margin:4px 0 8px;padding:6px;border:1px solid #6a5030;border-radius:8px;min-height:30px">' + esc2(sicht ? txt : "•".repeat(txt.length)) + '<span style="opacity:.5">▏</span></div><div class="zyn-tast">';
      REIHEN.forEach((r, ri) => { h += '<div class="zt-reihe">'; [...r].forEach((c, ci) => { const z = gross ? c.toUpperCase() : c, id = "t" + ri + "_" + ci; h += '<button type="button" data-zm="' + id + '">' + esc2(z) + "</button>"; a[id] = () => { txt += z; zeichnen(id); }; }); h += "</div>"; });
      h += '<div class="zt-reihe"><button type="button" data-zm="gr">⇧</button><button type="button" data-zm="sp" class="zt-breit">␣</button><button type="button" data-zm="del">⌫</button>' + (geheim ? '<button type="button" data-zm="eye">👁</button>' : "") + '<button type="button" data-zm="ok" class="zt-ok">OK</button><button type="button" data-zm="zu">✕</button></div></div>';
      const m = menue(h, a); menueArt = "tastatur"; m.classList.add("zyn-tastatur"); m.style.width = "96vw"; m.style.maxWidth = "780px";
      const b = fokusId && m.querySelector('[data-zm="' + fokusId + '"]'); if (b) fokusSetzen(b);
    };
    zeichnen("t1_0");
  }
  /* Einstellungen (selten gebraucht) */
  const uebName = n => n <= 1 ? W("sofort (auf den nächsten Takt)", "instant (next bar)") : n <= 3 ? W("weich, 1 Takt Überleitung", "smooth, 1-bar bridge") : n <= 6 ? W("weich, 2 Takte Überleitung", "smooth, 2-bar bridge") : W("sehr weich, 3 Takte Überleitung", "very smooth, 3-bar bridge");
  function zpEinstellungen(fokusK) {
    const zz = (id, t, w, u) => '<button type="button" data-zm="' + id + '">' + t + (w != null ? "<b>" + w + "</b>" : "") + (u ? "<small>" + u + "</small>" : "") + "</button>";
    const neu = id => () => { zpEinstellungen(id); };
    const a = { zu: menueZu, hilfe: zpHilfe, sicher: () => sicherMenue(), mischer: () => mxMenue(), ueb: () => { const P = window.ImresPult, l = [1, 2, 4, 6, 8], v = P.uebergang(); P.uebergang(l[(l.findIndex(x => x >= v) + 1) % l.length] || 1); neu("ueb")(); }, beleg: () => belegMenue(), wlan: () => wlanMenue(true), bt: () => btMenue(false),
      leistung: () => { const l = ["voll", "mittel", "leicht", "spar"], n = l[(l.indexOf(leistung()) + 1) % l.length]; schreib("imres-lw-mittel", n === "mittel" ? "1" : "0"); schreib("imres-lw-leicht", n === "leicht" || n === "spar" ? "1" : "0"); schreib("imres-lw-spar", n === "spar" ? "1" : "0"); schreib("imres-zp-leistung-gewaehlt", "1"); zeige("⚡ " + LEISTUNG_NAME[n], null, W("lädt neu …", "reloading …")); setTimeout(() => location.reload(), 500); },
      hell: () => { const v = LED_STUFEN[(LED_STUFEN.indexOf(ledHell()) + 1) % LED_STUFEN.length]; schreib("imres-zp-hell", String(v)); ledMerk = ""; ledsMelden(); neu("hell")(); },
      looplen: () => { const l = [1, 2, 4, 8], v = l[(l.indexOf(loopTakte()) + 1) % l.length]; schreib("imres-zp-looplen", String(v)); neu("looplen")(); },
      ruhe: () => { const v = RUHE_STUFEN[(RUHE_STUFEN.indexOf(ruheSek()) + 1) % RUHE_STUFEN.length]; schreib("imres-zp-ruhe", String(v)); neu("ruhe")(); },
      bild: () => { schreib("imres-zp-bild", bildHinten() ? "0" : "1"); document.documentElement.classList.toggle("zyn-bb", bildHinten() && SEITE === "buehne"); neu("bild")(); } };
    const m = menue("<h3>🛠 " + W("Einstellungen", "Settings") + '</h3><div class="reihe zyn-opt">' +
      zz("bt", "🔊 " + W("Bluetooth-Lautsprecher", "Bluetooth speaker"), null, W("Ton an eine Anlage per Bluetooth schicken", "send the sound to a speaker")) +
      zz("wlan", "📶 WLAN", null, W("Netz wählen und verbinden (für Updates und die Handy-Fernbedienung)", "pick and join a network (updates, phone remote)")) +
      zz("leistung", "⚡ " + W("Leistung: ", "Performance: "), LEISTUNG_NAME[leistung()], W("bei Rucklern sparsamer stellen – lädt neu", "go lighter if it stutters – reloads")) +
      (SEITE === "buehne" && window.ImresPult && window.ImresPult.uebergang ? zz("ueb", "🌊 " + W("Stimmungswechsel: ", "Mood change: "), uebName(window.ImresPult.uebergang()), W("wie lange eine neue Stimmung hinüberblendet", "how long a new mood takes to blend in")) : "") +
      zz("hell", "💡 " + W("Tastenlicht: ", "Button light: "), Math.round(ledHell() * 100) + " %") +
      zz("ruhe", "💤 " + W("Bühnenbild nach: ", "Stage view after: "), ruheSek() ? ruheSek() + " s" : W("nie", "never"), W("ohne Eingabe spielt die Band im Bild", "with no input the band plays on screen")) +
      zz("bild", "🖼 " + W("Bühnenbild hinter dem Pult: ", "Stage behind the console: "), bildHinten() ? W("an", "on") : W("aus", "off"), W("kostet Rechenzeit", "costs processing time")) +
      zz("looplen", "⟳ " + W("Regler-Loop: ", "Knob loop: "), loopTakte() + W(" Takte", " bars"), W("ALT + Regler drücken: aufnehmen / Loop aus", "ALT + push knob: record / loop off")) +
      zz("mischer", "🎚 " + W("Mischer", "Mixer"), null, W("dB/%, Blendzeit, Mischungen A/B, Obergrenzen", "dB/%, fade time, mixes A/B, upper limits")) +
      zz("beleg", "🎛 " + W("Belegung ändern", "Change mapping"), null, W("Drehregler, Effekte und Tasten selbst belegen", "assign knobs, effects and buttons")) +
      zz("sicher", "💾 " + W("Sicherung", "Backup"), null, W("Einstellungen auf der SD-Karte sichern / zurückholen", "save / restore settings on the SD card")) +
      zz("hilfe", "❔ " + W("Tastenbelegung", "Button map"), null) +
      '<button type="button" data-zm="zu">✕ ' + W("Fertig", "Done") + "</button></div>", a);
    menueArt = "einst"; if (fokusK) { const b = m.querySelector('[data-zm="' + fokusK + '"]'); if (b) fokusSetzen(b); }
  }

  /* ===================== 🥁 Beats: Step-Sequencer der Bühne (Mini-TR-8S) ===================== */
  const BEAT_REIHE = ["trommel", "ketten", "klopf", "schelle", "bass", "melodie", "floete", "rex"];
  const BEAT_NAME = { trommel: W("Trommel", "Drum"), ketten: W("Ketten", "Chains"), klopf: W("Klopfen", "Knock"), schelle: W("Schelle", "Bell"), bass: "Bass", melodie: W("Melodie", "Melody"), floete: W("Flöte", "Flute"), rex: "Rex" };
  const BEAT_SYM = { trommel: "🥁", ketten: "⛓", klopf: "✊", schelle: "🔔", bass: "🎸", melodie: "🎵", floete: "🪈", rex: "🐕" };
  const VAR = ["A", "B", "C", "D"]; /* Variationen 1–4 = Teile A–D */
  const BC = { mod: null, modBenutzt: false, s: 0, r: 0, folgen: true, teil: "A", ton: { bass: 0, melodie: 4, floete: 3, rex: 0 }, ablage: null, liveRec: false, padSchritt: null };
  const BP = () => window.ImresPult && window.ImresPult.beatsInfo ? window.ImresPult : null;
  function beatsInfo() { const P = BP(); return P ? P.beatsInfo() : null; }
  function beatsTeil(info) { info = info || beatsInfo(); if (!info) return "A"; if (BC.folgen) BC.teil = info.teil; if (!info.ablauf.includes(BC.teil) && !BC.folgen) BC.teil = info.ablauf[0] || "A"; return BC.teil; }
  function beatsFesthalten(info) {
    if (!BC.folgen) return; BC.folgen = false; BC.teil = info.teil; const P = BP();
    if (P.beatsLoop && !info.loop) { P.beatsLoop(BC.teil); zeige("🔁 " + W("Teil ", "Part ") + BC.teil + W(" läuft jetzt als Loop", " now loops"), null, W("Regler 4 drücken: Loop aus", "push knob 4: loop off")); }
  }
  const beatSpur = info => (info.spuren.find(x => x.id === BEAT_REIHE[BC.r]) || info.spuren[0]);
  function beatUmschalten(i, spurId) {
    const P = BP(), info = beatsInfo(); if (!P || !info) return; beatsFesthalten(info); const t = beatsTeil(info), sp = info.spuren.find(x => x.id === (spurId || BEAT_REIHE[BC.r])), d = P.beatsDaten(t); if (!sp || !d) return;
    const alt = d[sp.id][i], neu = alt >= 0 ? -1 : (sp.art === "an" ? 0 : Math.min(sp.zeilen - 1, BC.ton[sp.id] || 0));
    P.beatsSetzen(t, sp.id, i, neu); if (neu >= 0 && !info.laeuft) P.beatsAnschlag(sp.id, neu); zpZeichnen(true); ledsMelden();
  }
  function beatTon(d) {
    const P = BP(), info = beatsInfo(); if (!P || !info) return; const sp = beatSpur(info); if (sp.art === "an") return; beatsFesthalten(info);
    const t = beatsTeil(info), dat = P.beatsDaten(t), alt = dat[sp.id][BC.s], basis = alt >= 0 ? alt : (BC.ton[sp.id] || 0), neu = Math.max(0, Math.min(sp.zeilen - 1, basis + d));
    BC.ton[sp.id] = neu; P.beatsSetzen(t, sp.id, BC.s, neu); if (!info.laeuft) P.beatsAnschlag(sp.id, neu); zpZeichnen(true);
  }
  function beatSpurAendern(fn, meldung) {
    const P = BP(), info = beatsInfo(); if (!P || !info) return; beatsFesthalten(info); const t = beatsTeil(info), sp = beatSpur(info), d = P.beatsDaten(t)[sp.id];
    const neu = fn(d.slice(), sp); if (neu) { P.beatsSpur(t, sp.id, neu); zeige(BEAT_SYM[sp.id] + " " + BEAT_NAME[sp.id], null, meldung); zpZeichnen(true); ledsMelden(); }
  }
  function varWechseln(n) {
    const P = BP(), info = beatsInfo(); if (!P || !info) return; const t = VAR[n];
    BC.folgen = false; BC.teil = t; P.beatsLoop(t, true);
    zeige("🔁 Variation " + (n + 1) + " (" + W("Teil ", "part ") + t + ")", null, info.laeuft ? W("wechselt auf der nächsten Eins", "switches on the next downbeat") : ""); zpZeichnen(true); ledsMelden();
  }
  function varKopieren(n, nurSpur) {
    const P = BP(), info = beatsInfo(); if (!P || !info) return; const von = beatsTeil(info), nach = VAR[n]; if (von === nach) return;
    const d = P.beatsDaten(von), sp = beatSpur(info);
    (nurSpur ? [sp.id] : Object.keys(d)).forEach(k => P.beatsSpur(nach, k, d[k]));
    zeige("📋 " + (nurSpur ? BEAT_SYM[sp.id] + " " + BEAT_NAME[sp.id] : W("Ganzes Pattern", "Whole pattern")) + " → Variation " + (n + 1), null, W("von Teil ", "from part ") + von + W(" nach ", " to ") + nach); zpZeichnen(true); ledsMelden();
  }
  function beatPad(r) {
    const P = BP(), info = beatsInfo(); if (!P || !info) return; if (r != null) BC.r = r;
    const sp = r != null ? (info.spuren.find(x => x.id === BEAT_REIHE[r]) || beatSpur(info)) : beatSpur(info), wert = sp.art === "an" ? 0 : (BC.ton[sp.id] || 0);
    const hit = P.beatsAnschlag(sp.id, wert); padBlitz(BEAT_REIHE.indexOf(sp.id));
    if (BC.liveRec && hit && info.laeuft) { const d = P.beatsDaten(hit.teil); if (d && d[sp.id] && d[sp.id][hit.schritt] < 0) { P.beatsSetzen(hit.teil, sp.id, hit.schritt, wert); if (BC.pads) setTimeout(() => zpZeichnen(true), 30); } }
  }
  /* Pad-Ansicht: 8 Pads zum Einspielen, darunter das Raster klein – was wann spielt, antippen nimmt es raus */
  BC.pads = lies("imres-zb-pads", "1") === "1";
  const PAD_FARBE = { trommel: "#ffc830", ketten: "#f0dca0", klopf: "#ff7a20", schelle: "#fff8ec", bass: "#ff2a5a", melodie: "#30ff70", floete: "#ff9a80", rex: "#c040ff" };
  function padBlitz(r) { const el = zpEl && zpEl.querySelector('[data-zb-pad="' + r + '"]'); if (!el) return; el.classList.remove("blitz"); void el.offsetWidth; el.classList.add("blitz"); }
  function padsUmschalten() { BC.pads = !BC.pads; schreib("imres-zb-pads", BC.pads ? "1" : "0"); zpZeichnen(true); ledsMelden(); }
  function beatsPadsHTML() {
    const info = beatsInfo(); if (!info) return "";
    const pads = BEAT_REIHE.map((id, r) => { const sp = info.spuren.find(x => x.id === id); if (!sp) return "";
      return '<div class="zb-pad' + (r === BC.r ? " cur" : "") + (sp.stumm ? " stumm" : "") + '" data-zb-pad="' + r + '" style="--p:' + PAD_FARBE[id] + '"><span>' + BEAT_SYM[id] + "</span><b>" + BEAT_NAME[id] + "</b><small>" + (r < 4 ? "F" + (r + 1) : "") + "</small></div>"; }).join("");
    return '<div class="zb-padsbox"><div class="zb-pads">' + pads + "</div>" + beatsHTML(true) + "</div>";
  }
  /* Tasten auf der Beats-Seite (true = erledigt) */
  function beatsTaste(name) {
    if (zpSeite !== "beats") return false;
    const info = beatsInfo(); if (!info) return false; const n = info.takt;
    if (/^F[1-4]$/.test(name) && BC.pads && !BC.mod && !alt) return true; /* Pads: läuft über „Drücken“ */
    if (/^F[1-4]$/.test(name)) { const f = +name[1] - 1;
      if (BC.mod) { BC.modBenutzt = true; varKopieren(f, BC.mod === "ZS3"); }
      else if (alt) varWechseln(f); else beatUmschalten(Math.floor(BC.s / 4) * 4 + f);
      return true; }
    switch (name) {
      case "CTRL": case "ZS3": if (BC.modBenutzt) { BC.modBenutzt = false; return true; } return false;
      case "LEFT": case "RIGHT":
        if (alt) { const r = name === "LEFT" ? -1 : 1; beatSpurAendern(d => d.map((_, i) => d[(i - r + d.length) % d.length]), r < 0 ? W("nach links verschoben", "shifted left") : W("nach rechts verschoben", "shifted right")); return true; }
        BC.s = (BC.s + (name === "LEFT" ? -1 : 1) + n) % n; zpZeichnen(true); ledsMelden(); return true;
      case "UP": case "DOWN":
        if (alt) {
          if (name === "UP") { const P = BP(), t = beatsTeil(info), sp = beatSpur(info); BC.ablage = P.beatsDaten(t)[sp.id].slice(); zeige("📋 " + BEAT_NAME[sp.id], null, W("kopiert – ALT + ▼ fügt ein", "copied – ALT + ▼ pastes")); }
          else if (BC.ablage) beatSpurAendern(d => d.map((_, i) => { const v = BC.ablage[i]; return v == null ? -1 : v; }), W("eingefügt", "pasted"));
          return true;
        }
        BC.r = (BC.r + (name === "UP" ? -1 : 1) + BEAT_REIHE.length) % BEAT_REIHE.length; zpZeichnen(true); ledsMelden(); return true;
      case "SEL": if (alt) beatSpurAendern(d => d.map(() => -1), W("geleert", "cleared")); else beatUmschalten(BC.s); return true;
      case "PAD": return !alt; /* läuft über „Drücken“ – ohne Verzögerung; ALT+PAD: zurück */
      case "REC": BC.liveRec = !BC.liveRec; zeige(BC.liveRec ? "⏺ " + W("Live-Aufnahme an", "Live record on") : "⏹ " + W("Live-Aufnahme aus", "Live record off"), null, BC.liveRec ? W("PAD spielt die Spur und setzt den Schritt", "PAD plays the track and sets the step") : ""); zpZeichnen(true); ledsMelden(); return true;
    }
    return false;
  }
  /* Regler auf der Beats-Seite (Bank A) */
  function beatsRegler() {
    const info = beatsInfo(); if (!info) return [];
    const sp = beatSpur(info), t = beatsTeil(info), ab = [...new Set(info.ablauf)], dat = BP().beatsDaten(t) || {};
    const wert = (dat[sp.id] || [])[BC.s];
    return [
      { name: W("↔ Schritt", "↔ Step"), lo: 0, hi: info.takt - 1, schritt: 1, lies: () => BC.s, setz: v => { BC.s = v; ledsMelden(); }, text: v => (v + 1) + " / " + info.takt, druck: "", aktion: () => beatUmschalten(BC.s), drucktext: W("drücken: setzen", "push: set") },
      { name: W("↕ Spur", "↕ Track"), lo: 0, hi: BEAT_REIHE.length - 1, schritt: 1, lies: () => BC.r, setz: v => { BC.r = v; ledsMelden(); }, text: v => BEAT_SYM[BEAT_REIHE[v]] + " " + BEAT_NAME[BEAT_REIHE[v]], aktion: () => { BP().beatsStumm(BEAT_REIHE[BC.r]); zpZeichnen(true); }, drucktext: W("drücken: stumm", "push: mute") },
      sp.art === "an" ? { name: W("🎵 Tonhöhe", "🎵 Pitch"), lo: 0, hi: 1, schritt: 0, lies: () => 0, setz: () => {}, text: () => "–", drucktext: "" }
        : { name: W("🎵 Tonhöhe", "🎵 Pitch"), lo: 0, hi: sp.zeilen - 1, schritt: 1, lies: () => wert >= 0 ? wert : (BC.ton[sp.id] || 0), setz: v => beatTon(v - (wert >= 0 ? wert : (BC.ton[sp.id] || 0))), text: v => (wert >= 0 ? "" : "(") + W("Stufe ", "step ") + (v + 1) + (wert >= 0 ? "" : ")"), aktion: () => { BP().beatsSetzen(t, sp.id, BC.s, -1); zpZeichnen(true); }, drucktext: W("drücken: löschen", "push: clear") },
      { name: W("📄 Teil", "📄 Part"), lo: 0, hi: ab.length, schritt: 1, lies: () => BC.folgen ? 0 : Math.max(0, ab.indexOf(BC.teil)) + 1,
        setz: v => { if (v === 0) BC.folgen = true; else { BC.folgen = false; BC.teil = ab[v - 1]; if (info.loop) BP().beatsLoop(BC.teil); } },
        text: v => v === 0 ? W("folgt (", "follows (") + t + ")" : W("Teil ", "part ") + ab[v - 1] + (info.loop ? " 🔁" : ""),
        aktion: () => { const P = BP(); if (info.loop) { P.beatsLoop(null); BC.folgen = true; zeige("▶ " + W("Ablauf wie vorher", "Original order")); } else { BC.folgen = false; BC.teil = t; P.beatsLoop(t); zeige("🔁 " + W("Teil ", "Part ") + t + " Loop"); } zpZeichnen(true); },
        drucktext: info.loop ? W("drücken: Loop aus", "push: loop off") : W("drücken: als Loop", "push: loop it") }
    ];
  }
  function beatsKopf() {
    const info = beatsInfo(); if (!info) return '<div class="zp-gruppe"><span>🥁 Beats</span></div>';
    const t = beatsTeil(info);
    const vars = VAR.map((p, i) => '<button type="button" class="zb-var' + (p === t ? " an" : "") + (info.naechsterLoop === p ? " vor" : "") + (info.belegt && info.belegt[p] ? " voll" : "") + '" data-zb-var="' + i + '">' + (i + 1) + "</button>").join("");
    return '<div class="zp-gruppe"><span>🥁 ' + W("Teil ", "Part ") + t + (info.loop ? " 🔁" : BC.folgen ? " · " + W("folgt", "follows") : "") + (info.stimmung ? " · " + W("Stimmung", "mood") : "") + '</span><span class="zb-vars">Var ' + vars + "</span>" +
      '<span class="zb-knoepfe"><button type="button" data-zb-rec="1" class="' + (BC.liveRec ? "an" : "") + '">⏺ ' + W("Aufnahme", "Record") + '</button><button type="button" data-zb-ansicht="1">' + (BC.pads ? "▦ " + W("Raster", "Grid") : "🥁 Pads") + "</button>" + (BC.pads && BP() && BP().padLaut ? '<button type="button" data-zb-padlaut="1">🔊 ' + Math.round(BP().padLaut() * 100) + " %</button>" : "") + "</span></div>";
  }
  /* Bank B auf der Beats-Seite: Hüllkurve und Lautstärke der gewählten Spur */
  function beatsHuelleRegler() {
    const P = BP(), info = beatsInfo(); if (!P || !info || !P.huelle) return [];
    const sp = beatSpur(info), h = () => P.huelle()[sp.id] || {}, nm = BEAT_SYM[sp.id] + " ";
    const ms = v => v >= 1000 ? (v / 1000).toFixed(1).replace(".", ",") + " s" : v + " ms";
    return [
      { name: nm + "Attack", lo: 0, hi: 800, schritt: 10, lies: () => h().a || 0, setz: v => P.huelle(sp.id, v, null), text: v => v ? ms(v) : W("sofort", "instant"), aktion: () => P.huelle(sp.id, 0, null), drucktext: W("drücken: sofort", "push: instant") },
      { name: nm + "Decay", lo: 0, hi: 3000, schritt: 25, lies: () => h().d || 0, setz: v => P.huelle(sp.id, null, v), text: v => v ? ms(v) : W("natürlich", "natural"), aktion: () => P.huelle(sp.id, null, 0), drucktext: W("drücken: natürlich", "push: natural") },
      { name: nm + W("Lautstärke", "Volume"), lo: 0, hi: 9, schritt: 1, lies: () => P.beatsVol(sp.id) || 0, setz: v => P.beatsVol(sp.id, v), text: v => Math.round(v / 9 * 100) + " %", aktion: () => { P.beatsStumm(sp.id); zpZeichnen(true); }, drucktext: W("drücken: stumm", "push: mute") },
      { name: W("🎲 Variation", "🎲 Variation"), lo: 0, hi: 10, schritt: 1, lies: () => P.beatsVariation() || 0, setz: v => P.beatsVariation(v), text: v => v ? v * 10 + " %" : W("genau", "exact"), aktion: () => P.beatsVariation(0), drucktext: W("drücken: genau", "push: exact") }
    ];
  }
  function beatsHTML(klein) {
    const P = BP(), info = beatsInfo(); if (!P || !info) return '<div class="zb-leer">⏳ ' + W("Bühne lädt …", "Stage loading …") + "</div>";
    if (BC.pads && !klein) return beatsPadsHTML();
    const t = beatsTeil(info), dat = P.beatsDaten(t) || {}, n = info.takt;
    let h = '<div class="zb' + (klein ? " klein" : "") + '" style="--n:' + n + '">';
    BEAT_REIHE.forEach((id, r) => {
      const sp = info.spuren.find(x => x.id === id); if (!sp) return; const d = dat[id] || [];
      const hk = (P.huelle && P.huelle()[id]) || {};
      h += '<button type="button" class="zb-name' + (r === BC.r ? " cur" : "") + (sp.stumm ? " stumm" : "") + '" data-zb-r="' + r + '">' + BEAT_SYM[id] + (klein ? "" : " " + BEAT_NAME[id]) + (hk.a || hk.d ? '<i class="zb-h">◢</i>' : "") + "</button>";
      for (let i = 0; i < n; i++) {
        const v = d[i], an = v >= 0, txt = an && sp.art !== "an" ? v + 1 : "";
        h += '<button type="button" class="zb-z' + (an ? " an" : "") + (i % 4 === 0 ? " eins" : "") + (r === BC.r && i === BC.s ? " cur" : "") + (sp.stumm ? " stumm" : "") + '" data-zb-r="' + r + '" data-zb-s="' + i + '" style="' + (klein ? "--f:" + PAD_FARBE[id] + ";" : "") + (an && sp.art !== "an" ? "--h:" + (.35 + .65 * v / Math.max(1, sp.zeilen - 1)) : "") + '">' + txt + "</button>";
      }
    });
    h += "</div>";
    return h;
  }
  /* Lauflicht ohne alles neu zu zeichnen */
  setInterval(() => {
    if (zpSeite !== "beats" || zpRuhe || !zpEl) return; const info = beatsInfo(); if (!info) return;
    const s = info.laeuft && beatsTeil(info) === info.teil ? info.schritt : -1;
    $$(".zb-z", zpEl).forEach(z => z.classList.toggle("kopf", +z.dataset.zbS === s));
    if (BC.pads && s >= 0 && s !== BC.letzterS) { const dat = BP().beatsDaten(info.teil) || {}; BEAT_REIHE.forEach((id, r) => { const d = dat[id]; const sp = info.spuren.find(x => x.id === id); if (d && d[s] >= 0 && sp && !sp.stumm) padBlitz(r); }); }
    BC.letzterS = s;
  }, 30);
  /* ----- Zeichnen ----- */
  function zpZeichnen(sofort) {
    if (!zpEl) return;
    const blatt = zpAufbauen(), z = pz() || {}, d = zpDef(zpSeite), n = zpListe.length, bi = zpBlatt[zpSeite] || 0;
    const L = window.ImresPult && window.ImresPult.listen ? window.ImresPult.listen() : null;
    let status;
    if (SEITE === "welten") { const a = $(".welt.an"); status = (a ? "▶ <b>" + esc2(kurzName(a.querySelector(".nm") || a)) + "</b>" : "■ " + W("still", "silent")); }
    else { const sn = z.stimmung && L ? teil(L.namen.st[z.stimmung] || z.stimmung, "")[1] : "–", kn = z.kulLaeuft && L && z.kulisse !== "keine" ? teil(L.namen.kul[z.kulisse] || z.kulisse, "")[1] : W("kein Hintergrund", "no backdrop");
      status = (z.laeuft ? "▶ <b>" + esc2(sn) + "</b>" : "■ " + esc2(sn)) + " · 🌲 " + esc2(kn) + " · ♩ " + Math.round(z.tempoJetzt || z.tempo || 0) + (OPT.takt === "slave" && tempoMidi ? " ⇄" : OPT.takt === "master" ? " ⇉" : ""); }
    status = lastAnzeige() + status + (autoModus !== "aus" ? " · 🤖" : "") + (BEGL.an && SEITE === "buehne" ? " · 🎹" : "");
    status += (OPT.tonartAn ? " · 🎼 " + esc2(tonartName()) : "") + (aufnahmeAn ? ' · <span class="rec">⏺ REC</span>' : "") + (alt ? ' · <span class="alt">ALT</span>' : "");
    const tabs = ZP_SEITEN.map(s => '<button type="button" class="zp-tab' + (s.id === zpSeite ? " an" : "") + '" data-zp-tab="' + s.id + '" style="--f:' + s.farbe + '"><span class="zp-sym">' + s.sym + "</span> " + s.name + "</button>").join("");
    const kach = Array.from({ length: 8 }, (_, i) => { const it = blatt[i];
      const f = '<span class="zp-f' + (i < 4 ? "" : " alt") + '">' + (i < 4 ? "" : "ALT ") + "F" + (i % 4 + 1) + "</span>";
      if (!it) return '<div class="zp-k leer">' + f + "</div>";
      return '<button type="button" class="zp-k' + (it.an ? " an" : "") + (it.vor ? " vor" : "") + (it.fav ? " fav" : "") + (i === zpCursor ? " cur" : "") + (it.p != null ? " lauf" : "") + '" data-zp-k="' + i + '"' + (it.p != null ? ' style="--p:' + it.p + '%"' : "") + '>' + f + (it.fav ? '<span class="zp-stern">★</span>' : "") + (it.still ? '<span class="zp-still" title="' + W("mit Stille", "brings a hush") + '">🤫</span>' : "") + '<span class="zp-s">' + esc2(it.sym || d.sym) + '</span><span class="zp-n">' + esc2(it.name) + "</span>" + (it.vor ? '<span class="zp-v">' + W("am Taktende", "at bar end") + "</span>" : "") + (it.info ? '<span class="zp-v zp-dauer">' + esc2(it.info) + "</span>" : "") + "</button>"; }).join("");
    const gr = blatt[0] ? blatt[0].gruppe : (SEITE === "buehne" && !(window.ImresPult && window.ImresPult.listen) ? "⏳ " + W("Bühne lädt …", "Stage loading …") + " " + Math.round(performance.now() / 1000) + " s" : "");
    const kopf = '<div class="zp-gruppe"><span data-zp-gruppe="1">' + esc2(gr || d.name) + (zpGruppen.length > 1 ? ' <small>▸ ' + W("ALT + ▲ ▼: andere Gruppe", "ALT + ▲ ▼: other group") + "</small>" : "") + "</span>" + (n > 1 ? '<span class="zp-blatt"><button type="button" data-zp-blatt="-1">◀</button>' + (n <= 9 ? Array.from({ length: n }, (_, i) => "<i" + (i === bi ? ' class="an"' : "") + "></i>").join("") : "<em>" + (bi + 1) + " / " + n + "</em>") + '<button type="button" data-zp-blatt="1">▶</button></span>' : "") + "</div>";
    const bk = mischAktiv() ? "MIX" : spurAktiv() ? "SPUR" : SEITE === "welten" ? (bank ? "B" : "A") : bankName(), bf = BANK_FARBE[bk] || BANK_FARBE.A;
    const regler = zpRegler().map((r, i) => { const w = zpWert(r);
      const L = LOOPS[loopSchluessel(r)], lz = L ? (L.phase === "spielt" ? ' <em class="lp">⟳</em>' : ' <em class="rec">●</em>') : "";
      return '<div class="zp-r" data-zp-r="' + i + '"><span class="zp-rn">' + esc2(r.name) + lz + '</span><i><b style="width:' + Math.round(w.anteil * 100) + '%"></b></i><span class="zp-rv"><span>' + esc2(w.text) + "</span><small>" + mxDruckText(i, r) + "</small></span></div>"; }).join("");
    const t = (k, txt, farbe) => '<button type="button" data-zp-taste="' + k + '" style="--c:' + (farbe || "#e0a046") + '"><i></i><b>' + k + "</b> " + txt + "</button>";
    const kurz = k => { const id = ZB.tasten[k]; if (!id || id === "nichts") return ""; if (SEITE === "welten" && { play: "▶/❚❚", passiert: "🎭", stille: "⏳" }[id]) return t(k, { play: "▶/❚❚", passiert: "🎭", stille: "⏳" }[id], aktFarbe(id)); return t(k, (ZP_AKT[id] || ZP_AKT.nichts)[1], aktFarbe(id)); };
    const fuss = ["PLAY", "STOP", "PAD", "REC", "TEMPO", "CTRL"].map(k => zpSeite === "beats" && k === "PAD" ? t("PAD", "live", "#ff9a40") : zpSeite === "beats" && k === "REC" ? t("REC", BC.liveRec ? "⏺ LIVE" : "⏺", "#ff1a30") : zpSeite === "beats" && k === "CTRL" ? t("CTRL", W("halten: kopieren", "hold: copy"), "#ffe0a0") : kurz(k)).join("") + t("MIXER", bk, bf) + t("MENU", "☰", "#ffcf50");
    const html = '<div class="zp-kopf">' + tabs + '<span class="zp-status">' + status + "</span></div>" +
      (panelAktiv() ? '<div class="zp-mitte" style="--f:' + bf + '">' + mischHTML() + "</div>" : zpSeite === "beats" ? '<div class="zp-mitte" style="--f:' + d.farbe + '">' + beatsKopf() + beatsHTML() + "</div>" : zpSeite === "raum" && SEITE === "welten" ? '<div class="zp-mitte zr-m" style="--f:' + d.farbe + '">' + raumHTML() + "</div>" : '<div class="zp-mitte" style="--f:' + d.farbe + '">' + kopf + '<div class="zp-kacheln">' + kach + "</div></div>") +
      '<div class="zp-regler" style="--b:' + bf + '"><div class="zp-bank">⟲ ' + W("Bank ", "Bank ") + bk + (SEITE !== "welten" && !spurAktiv() && (mischAktiv() || !(zpSeite === "beats" && bank < 2)) ? '<small>' + W("drücken+drehen ⇄", "push+turn ⇄") + "</small>" : "") + "</div>" + regler + "</div>" + '<div class="zp-fuss">' + fuss + "</div>";
    if (html === zpMerk || (zpZeiger && !sofort)) return;
    zpMerk = html; zpEl.innerHTML = html;
  }
  function mxDruckText(i, r) {
    if (mischAktiv()) { const k = mixKeys()[panelReihe() * 4 + i]; if (MX_QUELLEN.includes(k)) return W("drücken: stumm · lang: Solo", "push: mute · hold: solo"); if (MX_STUMMBAR.includes(k)) return W("drücken: stumm", "push: mute"); }
    return r.drucktext || DRUCK_TEXT[r.druck] || "";
  }
  function mischHTML() {
    const rs = panelListe(), farben = ["#ffc830", "#80ffb0", "#ff9a80", "#ff7a20"], reihe = panelReihe(), sp = spurAktiv(), ks = sp ? [] : mixKeys();
    const om = sp && ortFenster() && window.ImresPult.ortMix ? window.ImresPult.ortMix() : null;
    const wm = sp && SEITE === "welten" ? wMix() : null;
    const titel = wm ? "🎛 " + (wm.welt ? wm.welt.sym + " " + wm.welt.name + (wm.laeuft ? "" : W(" (still)", " (silent)")) : W("Klangwelt – erst eine wählen", "Soundscape – choose one first")) + (spurSeiten() > 1 ? " " + (spurSeite + 1) + "/" + spurSeiten() : "") : sp ? "🎛 " + (om ? W("Ort: ", "Place: ") + teil(om.name || "", "")[1] + (om.schichten.length ? "" : W(" – kein Ort gewählt", " – no place")) : W("Stimmung", "Mood")) + (spurSeiten() > 1 ? " " + (spurSeite + 1) + "/" + spurSeiten() : "") : "🎚 " + W("Mischpult", "Mixer");
    const tipp = sp ? W("ALT + drehen: untere Reihe · ◀ ▶ mehr · drücken: stumm · ZS3: zu", "ALT + turn: lower row · ◀ ▶ more · push: mute · ZS3: close")
      : MX.solo && ZP_PARAM[MX.solo] ? "🎧 Solo: " + ZP_PARAM[MX.solo].name + " · " + W("halten: Solo aus", "hold: solo off")
      : W("tippen: sanft aus/an · halten: Solo · ziehen: Pegel · ◀ ▶ A/B", "tap: fade · hold: solo · drag: level · ◀ ▶ A/B");
    const ab = sp ? "" : '<span class="zp-ab">' + ["A", "B"].map(x => '<button type="button" data-mx-ab="' + x + '"' + (mxAbAkt() === x ? ' class="an"' : "") + ">" + MX_AB_NAME[x] + "</button>").join("") + '<button type="button" data-mx-menue="1" title="' + W("Mischer-Einstellungen", "Mixer settings") + '">⚙</button></span>';
    return '<div class="zp-gruppe"><span>' + titel + ' <small>▸ ' + tipp + '</small></span>' + ab + '</div><div class="zp-mfs zwei' + (sp ? "" : " mx") + '">' +
      rs.map((r, i) => { const w = zpWert(r), leer = r === ZP_PARAM.nichts, k = ks[i], f = k ? mxFarbe(k) : farben[i % 4];
        const st = k && MX.stumm[k] != null, so = k && MX.solo === k, g = k && MX.grenze[k] != null ? MX.grenze[k] : null, nm = k && MX_NORMAL[k] != null ? MX_NORMAL[k] : null;
        const marke = (v, kl) => v == null || leer ? "" : '<' + kl + ' style="bottom:' + (Math.max(0, Math.min(1, proz(v, r.lo, r.hi))) * 100).toFixed(1) + '%"></' + kl + ">";
        const bl = k && mxBlend[k] ? (mxBlend[k].ziel > r.lies() ? " ↗" : " ↘") : "";
        return '<div class="zp-mf' + ((i >> 2) === reihe ? " aktiv" : "") + (leer ? " leer" : "") + (st ? " stumm" : "") + (so ? " solo" : "") + '" data-zp-mf="' + i + '" style="--m:' + f + '"><span>' + (i > 3 ? "ALT " : "") + (i % 4 + 1) + (so ? " 🎧" : "") + (g != null ? " 🔒" : "") + bl + "</span>" +
          '<div class="mfb"><i class="fd"><b style="height:' + (leer ? 0 : Math.round(w.anteil * 100)) + '%"></b>' + marke(nm, "u") + marke(g, "s") + "</i>" + ((sp ? r.wBett == null : !MX_MESS[mxGruppe(k)]) || leer ? "" : '<i class="pm"><b></b></i>') + "</div>" +
          "<strong>" + esc2(leer ? "–" : r.name) + "</strong><em>" + esc2(leer ? "" : w.text) + "</em></div>"; }).join("") + "</div>";
  }
  const dimm = (h, f) => { const n = parseInt(String(h).slice(1, 7), 16) || 0, c = x => Math.round(x * f).toString(16).padStart(2, "0"); return "#" + c((n >> 16) & 255) + c((n >> 8) & 255) + c(n & 255); };
  const ALT_FARBE = "#c040ff";
  /* Farbe einer Tasten-Aktion – dieselbe wie auf dem Bildschirm */
  function aktFarbe(id) {
    const i = ZP_SEITEN.findIndex(x => x.id === zpSeite);
    if (id === "seite_vor") return ZP_SEITEN[(i + 1) % ZP_SEITEN.length].led;
    if (id === "seite_zurueck") return ZP_SEITEN[(i + ZP_SEITEN.length - 1) % ZP_SEITEN.length].led;
    if (id === "bank") return BANK_FARBE[BANKEN[(bank + 1) % BANKEN.length]];
    if (id === "mischer") return BANK_FARBE.MIX;
    if (id === "mixab") return mxAbAkt() === "B" ? "#d090ff" : "#ffc830";
    if (id === "beats") return "#ff9a40";
    if (id === "spurmix") return "#ff9a80";
    return { play: "#30ff70", stop: "#ff1a30", passiert: "#ff6a10", stille: "#fff4e0", neubesetzen: "#ffc830", sprechen: "#f0dca0", aufnahme: "#ff1a30", takt: "#d8d0c0", hg: "#80ffb0", fx_aus: "#fff8ec",
      filterzu: BANK_FARBE.FX, filterhoch: BANK_FARBE.FX, echowurf: BANK_FARBE.FX, stotter: BANK_FARBE.GLITCH, rueckwaerts: BANK_FARBE.GLITCH, bandstop: BANK_FARBE.GLITCH, crushhalt: BANK_FARBE.GLITCH, tap: "#ffc830", autopilot: "#c040ff", set_weiter: "#ffe0a0", set_zurueck: "#ffe0a0" }[id] || "#000000";
  }
  function aktAktiv(id) {
    const z = pz() || {};
    if (id === "play") return SEITE === "welten" ? !!$(".welt.an") : !!z.laeuft;
    if (id === "aufnahme") return aufnahmeAn;
    if (id === "mischer") return mischAktiv();
    if (id === "beats") return zpSeite === "beats";
    if (id === "spurmix") return spurAktiv();
    if (id === "neubesetzen") return !!z.neuBesetzen;
    if (id === "hg") return !!z.kulLaeuft;
    if (id === "autopilot") return autoModus !== "aus";
    if (HALTEN[id]) return Object.values(gehalten).includes(id);
    return false;
  }
  /* ----- Bühnenbild: als Hintergrund des Pults und als Ruhebild nach ein paar Sekunden ohne Eingabe ----- */
  let zpLetzte = Date.now(), zpRuhe = false, zpRuheEl = null, zpWeck = null;
  const RUHE_STUFEN = [10, 30, 60, 0];
  const ruheSek = () => { const v = +lies("imres-zp-ruhe", "10"); return RUHE_STUFEN.includes(v) ? v : 10; };
  const bildHinten = () => lies("imres-zp-bild", "0") === "1";
  function zpAktiv() { zpLetzte = Date.now(); if (zpRuhe) { zpRuheAus(); return true; } return false; }
  /* ===================== 🧭 Raum (Klangwelten): wo steht welches Geräusch? =====================
     Draufsicht: du in der Mitte, vorn ist oben. Jede Schicht (Teppich) und jede Geräuschart der Welt steht an ihrem Platz –
     ziehen verschiebt sie, nah = lauter und klarer, fern = leiser, dumpfer und halliger. Erklingt ein Geräusch, zieht ein Ring. */
  const RM = { wahl: 0, raf: 0, zieh: null, cache: null, cacheT: 0, pegel: [], letzt: 0, schreib: 0 };
  const rmDaten = () => { const a = WA(); if (!a || !a.raum) return null; const j = performance.now(); if (j - RM.cacheT > 150) { try { RM.cache = a.raum(); } catch (_) { RM.cache = null; } RM.cacheT = j; } return RM.cache; };
  const rmListe = d => d ? d.betten.map(b => Object.assign({ typ: "b", key: b.i, farbe: WB_BAND[b.i % WB_BAND.length] }, b)).concat(d.arten.map(e => Object.assign({ typ: "e", key: e.art, farbe: "#f0c060" }, e))) : [];
  const rmAkt = () => { const l = rmListe(rmDaten()); if (!l.length) return null; RM.wahl = Math.max(0, Math.min(l.length - 1, RM.wahl)); return l[RM.wahl]; };
  function rmSetzen(it, w) { const a = WA(); if (!a || !it) return; a.raumSetzen(it.typ, it.key, w); RM.cacheT = 0; }
  const rmAz = az => { az = ((az % 360) + 360) % 360; return az > 180 ? az - 360 : az; };
  function rmRichtung(az) {
    const a = rmAz(az), n = Math.abs(a), seite = a < 0 ? W("links", "left") : W("rechts", "right");
    const t = n < 15 ? W("vorn", "front") : n > 165 ? W("hinten", "behind") : n < 60 ? seite + W(" vorn", " front") : n <= 120 ? seite : seite + W(" hinten", " behind");
    return t + " " + Math.round(Math.abs(a)) + "°";
  }
  const rmFerne = d => (d < .15 ? W("ganz nah", "very close") : d < .33 ? W("nah", "close") : d < .55 ? W("mittel", "medium") : d < .78 ? W("fern", "far") : W("weit weg", "far away")) + " · " + Math.round(1 + d * 29) + " m";
  const RAUM_REGLER = [
    { name: W("👆 Auswahl", "👆 Select"), lo: 0, get hi() { return Math.max(0, rmListe(rmDaten()).length - 1); }, schritt: 1, lies: () => RM.wahl, setz: v => { RM.wahl = Math.round(v); },
      text: () => { const it = rmAkt(); return it ? (it.typ === "e" ? it.sym + " " : "🌿 ") + it.name : W("erst eine Welt starten", "start a soundscape"); },
      aktion: () => { const it = rmAkt(); if (it) { rmSetzen(it, null); zeige("↺ " + it.name, null, W("Platz zurück auf Standard", "position back to default")); } }, drucktext: W("drücken: Standard", "push: default") },
    { name: W("🧭 Richtung", "🧭 Direction"), lo: -360, hi: 360, schritt: 5, lies: () => { const it = rmAkt(); return it ? rmAz(it.az) : 0; }, setz: v => { const it = rmAkt(); if (it) rmSetzen(it, { az: v }); },
      text: v => rmRichtung(v), aktion: () => { const it = rmAkt(), a = WA(); if (it && it.typ === "e" && a && a.raumProbe) { a.raumProbe(it.art); zeige("🔉 " + it.name, null, W("Probe von dort", "sample from there")); } else if (it) zeige("🌿 " + it.name, null, rmRichtung(it.az)); },
      drucktext: W("drücken: Probe hören", "push: listen") },
    { name: W("📏 Entfernung", "📏 Distance"), lo: 0, hi: 100, schritt: 2, lies: () => { const it = rmAkt(); return it ? Math.round(it.d * 100) : 40; }, setz: v => { const it = rmAkt(); if (it) rmSetzen(it, { d: v / 100 }); },
      text: v => rmFerne(v / 100), aktion: () => { const it = rmAkt(); if (it) rmSetzen(it, { d: .4 }); }, drucktext: W("drücken: mittel", "push: medium") },
    { get name() { const it = rmAkt(); return it && it.typ === "e" ? W("🎭 Geräusche (alle)", "🎭 Sounds (all)") : W("🔊 Lautstärke", "🔊 Volume"); }, lo: 0, hi: 150, schritt: 5,
      lies: () => { const it = rmAkt(); return it && it.typ === "b" ? it.v : ZP_PARAM.w_ger.lies(); },
      setz: v => { const it = rmAkt(), a = WA(); if (it && it.typ === "b" && a) { a.regler("b" + it.key, v); RM.cacheT = 0; } else ZP_PARAM.w_ger.setz(v); },
      text: v => Math.round(v) + " %", aktion: () => { const it = rmAkt(), a = WA(); if (it && it.typ === "b" && a) { a.regler("b" + it.key, it.v > 0 ? 0 : 100); RM.cacheT = 0; } }, drucktext: W("drücken: aus/an", "push: off/on") }
  ];
  function raumHTML() {
    return '<div class="zr-raum"><canvas id="zr-c"></canvas><div class="zr-info" id="zr-info"></div><div class="zr-tipp">' +
      W("ziehen: verschieben · tippen auf ◆: Probe · ① wählen ② Richtung ③ Entfernung ④ Lautstärke", "drag: move · tap ◆: listen · ① select ② direction ③ distance ④ volume") + "</div></div>";
  }
  function rmGeo(c) { const w = c.width, h = c.height, R = Math.min(w, h) / 2 - 18; return { cx: w / 2, cy: h / 2 + 2, R }; }
  const rmPunkt = (g, az, d) => { const rr = g.R * (.13 + .87 * d), a = az * Math.PI / 180; return [g.cx + Math.sin(a) * rr, g.cy - Math.cos(a) * rr]; };
  function rmBild(jetzt) {
    RM.raf = 0; const c = document.getElementById("zr-c");
    if (!c || SEITE !== "welten" || zpSeite !== "raum" || zpRuhe || panelAktiv() || document.hidden) return;
    RM.raf = requestAnimationFrame(rmBild); if (jetzt - RM.letzt < 40) return; RM.letzt = jetzt;
    const box = c.parentElement.getBoundingClientRect(), dpr = Math.min(2, window.devicePixelRatio || 1), cw = Math.max(50, Math.round(box.width * dpr)), ch = Math.max(50, Math.round(box.height * dpr));
    if (c.width !== cw || c.height !== ch) { c.width = cw; c.height = ch; }
    const x = c.getContext("2d"), g = rmGeo(c), d = rmDaten(), l = rmListe(d), akt = l[Math.max(0, Math.min(l.length - 1, RM.wahl))], t = jetzt / 1000;
    x.setTransform(1, 0, 0, 1, 0, 0); x.clearRect(0, 0, cw, ch); x.save(); x.scale(1, 1);
    const bg = x.createRadialGradient(g.cx, g.cy, 0, g.cx, g.cy, g.R * 1.1); bg.addColorStop(0, "#2a1f30"); bg.addColorStop(1, "#120d18"); x.fillStyle = bg; x.beginPath(); x.arc(g.cx, g.cy, g.R + 8, 0, 7); x.fill();
    /* Ringe: nah – mittel – fern */
    x.font = Math.round(11 * dpr) + "px system-ui, sans-serif"; x.textAlign = "center"; x.textBaseline = "middle";
    [[.15, W("nah", "close")], [.4, W("mittel", "medium")], [.7, W("fern", "far")], [1, ""]].forEach(([dd, nm]) => { const rr = g.R * (.13 + .87 * dd); x.strokeStyle = dd === .4 ? "rgba(240,220,160,.28)" : "rgba(240,220,160,.13)"; x.setLineDash(dd === 1 ? [] : [3 * dpr, 5 * dpr]); x.lineWidth = dpr; x.beginPath(); x.arc(g.cx, g.cy, rr, 0, 7); x.stroke();
      if (nm) { x.fillStyle = "rgba(240,220,160,.38)"; x.fillText(nm, g.cx + rr * .72, g.cy + rr * .72); } });
    x.setLineDash([]); x.fillStyle = "rgba(240,220,160,.55)"; x.font = "600 " + Math.round(11 * dpr) + "px system-ui, sans-serif";
    x.fillText(W("vorn", "front"), g.cx, g.cy - g.R - 2 * dpr); x.fillText(W("hinten", "back"), g.cx, g.cy + g.R + 4 * dpr);
    x.textAlign = "left"; x.fillText(W("rechts", "right"), g.cx + g.R + 4 * dpr, g.cy); x.textAlign = "right"; x.fillText(W("links", "left"), g.cx - g.R - 4 * dpr, g.cy); x.textAlign = "center";
    /* du in der Mitte (Blick nach vorn) */
    x.fillStyle = "#f0dca0"; x.beginPath(); x.arc(g.cx, g.cy, 9 * dpr, 0, 7); x.fill(); x.beginPath(); x.moveTo(g.cx - 4 * dpr, g.cy - 8 * dpr); x.lineTo(g.cx, g.cy - 15 * dpr); x.lineTo(g.cx + 4 * dpr, g.cy - 8 * dpr); x.fill();
    x.fillRect(g.cx - 11 * dpr, g.cy - 3 * dpr, 3 * dpr, 6 * dpr); x.fillRect(g.cx + 8 * dpr, g.cy - 3 * dpr, 3 * dpr, 6 * dpr);
    if (!d) { x.fillStyle = "rgba(240,220,160,.75)"; x.font = Math.round(14 * dpr) + "px system-ui, sans-serif"; const wm0 = wMix(); x.fillText(wm0 && wm0.laeuft && wm0.welt && wm0.welt.episch ? W("Epische Welten umhüllen dich von überall – hier gibt es keine einzelnen Plätze", "Epic soundscapes surround you – no single positions here") : W("Starte eine Klangwelt – dann stehen hier ihre Geräusche", "Start a soundscape – its sounds appear here"), g.cx, g.cy + 40 * dpr); x.restore(); rmInfo(null); return; }
    /* Pegel der Schichten */
    let p = null; try { const a = WA(); p = a && a.pegel ? a.pegel() : null; } catch (_) {}
    d.betten.forEach((b, i) => { const v = p && p.betten ? p.betten[i] || 0 : 0, z = Math.max(0, Math.min(1, ((v > 1e-5 ? 20 * Math.log10(v) : -90) + 54) / 48)); RM.pegel[i] = (RM.pegel[i] || 0) + (z > (RM.pegel[i] || 0) ? .4 : .08) * (z - (RM.pegel[i] || 0)); });
    /* Linie zur Auswahl */
    if (akt) { const [ax, ay] = rmPunkt(g, akt.az, akt.d); x.strokeStyle = "rgba(255,240,200,.35)"; x.setLineDash([4 * dpr, 4 * dpr]); x.beginPath(); x.moveTo(g.cx, g.cy); x.lineTo(ax, ay); x.stroke(); x.setLineDash([]); }
    /* Ringe, wenn ein Geräusch erklingt */
    (d.zuletzt || []).forEach(e => { if (e.az == null || e.alter > 3) return; const [ex, ey] = rmPunkt(g, e.az, e.d), a = 1 - e.alter / 3; x.strokeStyle = "rgba(240,192,96," + (a * .8).toFixed(2) + ")"; x.lineWidth = 2 * dpr; x.beginPath(); x.arc(ex, ey, (8 + e.alter * 26) * dpr, 0, 7); x.stroke(); });
    x.lineWidth = dpr;
    /* Geräuscharten (◆) */
    l.forEach((it, i) => { if (it.typ !== "e") return; const [ex, ey] = rmPunkt(g, it.az, it.d), sel = it === akt, k = (sel ? 9 : 7) * dpr, frisch = (d.zuletzt || []).some(z => z.art === it.art && z.alter < .6);
      x.fillStyle = frisch ? "#fff0c0" : it.gesetzt ? "#f0c060" : "rgba(240,192,96,.45)"; const kk = sel || it.gesetzt || frisch ? k : k * .75; x.beginPath(); x.moveTo(ex, ey - kk); x.lineTo(ex + kk, ey); x.lineTo(ex, ey + kk); x.lineTo(ex - kk, ey); x.closePath(); x.fill();
      if (sel) { x.strokeStyle = "#fff4dc"; x.lineWidth = 2 * dpr; x.stroke(); x.lineWidth = dpr; }
      if (sel || frisch || it.gesetzt) { x.font = Math.round(13 * dpr) + "px system-ui, sans-serif"; x.fillStyle = "#fff"; x.fillText(it.sym, ex, ey - k - 8 * dpr); } });
    /* Schichten (●) – atmen mit ihrem Pegel */
    l.forEach((it, i) => { if (it.typ !== "b") return; const [bx, by] = rmPunkt(g, it.az, it.d), L = RM.pegel[it.key] || 0, sel = it === akt, rr = (7 + L * 11 + (sel ? 2 : 0)) * dpr, aus = it.ruht || !it.v;
      const gl = x.createRadialGradient(bx, by, 0, bx, by, rr * 2.4); gl.addColorStop(0, it.farbe + (aus ? "22" : "88")); gl.addColorStop(1, it.farbe + "00"); x.fillStyle = gl; x.beginPath(); x.arc(bx, by, rr * 2.4, 0, 7); x.fill();
      x.fillStyle = aus ? "rgba(80,70,90,.8)" : it.farbe; x.globalAlpha = aus ? .6 : .95; x.beginPath(); x.arc(bx, by, rr, 0, 7); x.fill(); x.globalAlpha = 1;
      if (sel) { x.strokeStyle = "#fff4dc"; x.lineWidth = 2.5 * dpr; x.beginPath(); x.arc(bx, by, rr + 4 * dpr, 0, 7); x.stroke(); x.lineWidth = dpr; }
      x.font = (sel ? "700 " : "500 ") + Math.round(11.5 * dpr) + "px system-ui, sans-serif"; x.fillStyle = aus ? "rgba(220,205,180,.5)" : "#f4ead4"; x.fillText(it.name + (aus ? " ⏸" : ""), bx, by + rr + 10 * dpr); });
    if (d.gehen) { x.textAlign = "left"; x.fillStyle = "rgba(240,220,160,.7)"; x.font = Math.round(11 * dpr) + "px system-ui, sans-serif"; x.fillText("🚶 " + W("Wandern an – die Schichten ziehen vorbei", "walking on – layers drift past"), 8 * dpr, ch - 10 * dpr); }
    x.restore(); rmInfo(akt);
  }
  function rmInfo(it) {
    const el = document.getElementById("zr-info"); if (!el) return;
    const h = it ? '<b>' + esc2((it.typ === "e" ? it.sym + " " : "🌿 ") + it.name) + "</b><span>" + esc2(rmRichtung(it.az)) + "</span><span>" + esc2(rmFerne(it.d)) + "</span>" + (it.gesetzt ? "" : "<small>" + (it.typ === "e" ? W("noch frei – jedes Mal ungefähr dort", "not set – roughly there each time") : W("Standardplatz", "default position")) + "</small>") : "";
    if (el.innerHTML !== h) el.innerHTML = h;
  }
  setInterval(() => { if (!RM.raf && SEITE === "welten" && zpSeite === "raum" && !zpRuhe && !panelAktiv() && document.getElementById("zr-c")) RM.raf = requestAnimationFrame(rmBild); }, 250);
  /* ziehen und tippen */
  function rmTreffer(e) {
    const c = document.getElementById("zr-c"); if (!c) return null; const r = c.getBoundingClientRect(), dpr = c.width / Math.max(1, r.width), px = (e.clientX - r.left) * dpr, py = (e.clientY - r.top) * dpr, g = rmGeo(c), l = rmListe(rmDaten());
    let best = -1, bd = 30 * dpr; l.forEach((it, i) => { const [ix, iy] = rmPunkt(g, it.az, it.d), dd = Math.hypot(ix - px, iy - py); if (dd < bd) { bd = dd; best = i; } });
    return { i: best, px, py, g };
  }
  document.addEventListener("pointerdown", e => { if (!e.target || e.target.id !== "zr-c") return; const tr = rmTreffer(e); if (!tr || tr.i < 0) return;
    RM.wahl = tr.i; RM.zieh = { i: tr.i, x: e.clientX, y: e.clientY, zieht: false }; try { e.target.setPointerCapture(e.pointerId); } catch (_) {} zpReglerAnzeige(); e.preventDefault(); }, true);
  document.addEventListener("pointermove", e => { const z = RM.zieh; if (!z) return; if (!z.zieht && Math.hypot(e.clientX - z.x, e.clientY - z.y) < 6) return; z.zieht = true;
    const tr = rmTreffer(e); if (!tr) return; const dx = tr.px - tr.g.cx, dy = tr.py - tr.g.cy, rr = Math.hypot(dx, dy) / tr.g.R, it = rmListe(rmDaten())[z.i]; if (!it) return;
    const az = Math.atan2(dx, -dy) * 180 / Math.PI, dd = Math.max(0, Math.min(1, (rr - .13) / .87));
    it.az = az; it.d = dd; if (RM.cache) { const q = it.typ === "b" ? RM.cache.betten[it.key] : RM.cache.arten.find(a => a.art === it.key); if (q) { q.az = az; q.d = dd; q.gesetzt = true; } RM.cacheT = performance.now(); }
    const j = performance.now(); if (j - RM.schreib > 60) { RM.schreib = j; const a = WA(); if (a) a.raumSetzen(it.typ, it.key, { az, d: dd }); } }, true);
  const rmLos = e => { const z = RM.zieh; if (!z) return; RM.zieh = null; const it = rmListe(rmDaten())[z.i], a = WA();
    if (z.zieht && it && a) { a.raumSetzen(it.typ, it.key, { az: it.az, d: it.d }); RM.cacheT = 0; zeige((it.typ === "e" ? it.sym : "🌿") + " " + it.name, null, rmRichtung(it.az) + " · " + rmFerne(it.d)); }
    else if (!z.zieht && it && it.typ === "e" && a && a.raumProbe) a.raumProbe(it.art);
    zpReglerAnzeige(); };
  document.addEventListener("pointerup", rmLos, true); document.addEventListener("pointercancel", () => { RM.zieh = null; }, true);
  /* ===================== 🌄 Ruhebild der Klangwelten: eine kleine lebende Landschaft je Welt =====================
     Jede Schicht der Welt ist ein Lichtband, das mit ihrem Pegel atmet; dazu Glut, Glühwürmchen, Funken, Blasen … je nach Welt
     und das Wetter darüber. Läuft nur, solange das Ruhebild zu sehen ist (30 Bilder/s, alles Statische vorgezeichnet). */
  const WB_TH = {
    innen: { h: ["#140a06", "#2a160a", "#3a2010"], land: "innen", lf: "#0b0604", licht: "#ffa040", lp: [.5, .6], teil: "staub", tf: "#ffd890" },
    feuer: { h: ["#0c0612", "#1e0e1e", "#3a1a10"], land: "wald", lf: "#070305", licht: "#ff6a10", lp: [.5, .9], teil: "glut", tf: "#ffb040", sterne: 1 },
    waldtag: { h: ["#3a3412", "#7a6224", "#c8923a"], land: "wald", lf: "#121c0a", licht: "#ffe080", lp: [.74, .2], teil: "pollen", tf: "#fff0b0" },
    waldnacht: { h: ["#0a0614", "#170b20", "#22132a"], land: "wald", lf: "#05030a", licht: "#f0e0b0", lp: [.78, .2], mond: 1, sterne: 1, teil: "gluehw", tf: "#d8ff60" },
    hoehle: { h: ["#060404", "#120c0a", "#1c130c"], land: "hoehle", lf: "#030202", licht: "#e0a050", lp: [.5, .55], teil: "tropfen", tf: "#d8e0b0" },
    unterreich: { h: ["#08040c", "#160a1e", "#1e0e24"], land: "hoehle", lf: "#040206", licht: "#b060e0", lp: [.5, .6], teil: "sporen", tf: "#d090ff" },
    kerker: { h: ["#080504", "#160c08", "#20120a"], land: "kerker", lf: "#040202", licht: "#ff8030", lp: [.22, .45], teil: "staub", tf: "#ffc890" },
    wasser: { h: ["#140a1a", "#3a1a26", "#8a4a28"], land: "wasser", lf: "#0a120c", licht: "#ffb050", lp: [.5, .56], teil: "nebel", tf: "#f0dca0", sterne: 1 },
    sumpf: { h: ["#0a0c08", "#161e0e", "#24301a"], land: "sumpf", lf: "#050704", licht: "#c8e070", lp: [.3, .3], mond: 1, teil: "gluehw", tf: "#b0ff70" },
    tiefe: { h: ["#0e2a1c", "#06180e", "#020a06"], land: "tiefe", lf: "#020604", licht: "#e0ffb0", lp: [.5, -.05], teil: "blase", tf: "#d0ffe0" },
    schmiede: { h: ["#120604", "#2a0e06", "#401a08"], land: "innen", lf: "#080302", licht: "#ff5010", lp: [.5, .78], teil: "funken", tf: "#ffd060" },
    magie: { h: ["#0e0616", "#200c2e", "#2e1236"], land: "innen", lf: "#06030a", licht: "#c070ff", lp: [.5, .6], teil: "sporen", tf: "#f0c0ff" },
    sakral: { h: ["#100a06", "#22160c", "#3a2614"], land: "boegen", lf: "#080503", licht: "#ffd070", lp: [.5, .35], teil: "staub", tf: "#ffe8b0" },
    dorf: { h: ["#1a0c18", "#4a2020", "#a05a28"], land: "daecher", lf: "#0e0806", licht: "#ffb050", lp: [.24, .72], teil: "pollen", tf: "#ffe0a0" },
    burg: { h: ["#0e0816", "#22122a", "#4a2620"], land: "burg", lf: "#060408", licht: "#ffe0a0", lp: [.8, .18], mond: 1, sterne: 1, teil: "staub", tf: "#f0dca0" },
    berge: { h: ["#100a18", "#2c1a2a", "#6a3a30"], land: "berge", lf: "#0a0608", licht: "#ffc080", lp: [.66, .5], sterne: 1, teil: "nebel", tf: "#f0e4d0" },
    kampf: { h: ["#120404", "#2a0a06", "#4a1408"], land: "huegel", lf: "#070202", licht: "#ff3010", lp: [.5, .82], teil: "glut", tf: "#ff8040" }
  };
  const WB_WELT = { taverne: "innen", schlaegerei: "innen", lagerfeuer: "feuer", zelt: "feuer", waldtag: "waldtag", waldnacht: "waldnacht", hoehle: "hoehle", mine: "hoehle", einsturz: "hoehle",
    unterreich: "unterreich", kerker: "kerker", kueste: "wasser", ufer: "wasser", fluss: "wasser", hafen: "wasser", schiff: "wasser", sumpf: "sumpf", unterwasser: "tiefe", schmiede: "schmiede",
    labor: "magie", zauber: "magie", schrei: "magie", bibliothek: "sakral", tempel: "sakral", chor: "sakral", glocke: "sakral", gong: "sakral", horn: "sakral", dorf: "dorf", markt: "dorf", strasse: "dorf",
    burg: "burg", gebirge: "berge", kriegsschauplatz: "kampf", duell: "kampf", einschlag: "kampf", bruellen: "kampf", donner: "kampf", wirbel: "kampf" };
  const WB_BAND = ["#ffc830", "#ff7a20", "#5ad08a", "#d090ff", "#ff9a80", "#e0b070", "#c8e070", "#f0dca0"];
  const WB = { c: null, x: null, raf: 0, letzt: 0, bg: null, bgKey: "", teile: [], wetter: [], pegel: [], gesamt: 0, blitz: 0, naechsterBlitz: 0, bolzen: null, sprites: {} };
  /* feste Zufallszahlen je Welt – die Landschaft sieht jedes Mal gleich aus */
  const wbRnd = seed => () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  function wbSprite(farbe) {
    if (WB.sprites[farbe]) return WB.sprites[farbe];
    const c = document.createElement("canvas"); c.width = c.height = 32; const x = c.getContext("2d"), g = x.createRadialGradient(16, 16, 0, 16, 16, 16);
    g.addColorStop(0, farbe); g.addColorStop(.25, farbe + "cc"); g.addColorStop(1, farbe + "00"); x.fillStyle = g; x.fillRect(0, 0, 32, 32); return (WB.sprites[farbe] = c);
  }
  function wbHintergrund(th, id, w, h) {
    const c = document.createElement("canvas"); c.width = w; c.height = h; const x = c.getContext("2d"), r = wbRnd([...id].reduce((a, ch) => a * 31 + ch.charCodeAt(0), 7) % 2147483646 + 1);
    const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, th.h[0]); g.addColorStop(.55, th.h[1]); g.addColorStop(1, th.h[2]); x.fillStyle = g; x.fillRect(0, 0, w, h);
    if (th.sterne) for (let i = 0; i < 90; i++) { x.fillStyle = "rgba(255,240,210," + (.15 + r() * .5).toFixed(2) + ")"; const sx = r() * w, sy = r() * h * .55, sz = r() < .1 ? 1.6 : .9; x.fillRect(sx, sy, sz, sz); }
    if (th.mond) { const mx = th.lp[0] * w, my = th.lp[1] * h; const mg = x.createRadialGradient(mx, my, 0, mx, my, 70); mg.addColorStop(0, "rgba(255,240,200,.35)"); mg.addColorStop(1, "rgba(255,240,200,0)"); x.fillStyle = mg; x.fillRect(mx - 70, my - 70, 140, 140);
      x.fillStyle = "#f4e6c0"; x.beginPath(); x.arc(mx, my, 15, 0, 7); x.fill(); x.fillStyle = "rgba(160,140,110,.35)"; [[-5, -3, 4], [4, 5, 3], [5, -6, 2], [-3, 7, 2]].forEach(([a, b, rr]) => { x.beginPath(); x.arc(mx + a, my + b, rr, 0, 7); x.fill(); }); }
    const dunkler = (hex, f) => { const n = parseInt(hex.slice(1), 16); const k = v => Math.round(v * f).toString(16).padStart(2, "0"); return "#" + k(n >> 16) + k((n >> 8) & 255) + k(n & 255); };
    const lf = th.lf, mitte = dunkler(th.h[2], .5);
    const huegel = (y0, amp, farbe, glatt) => { x.fillStyle = farbe; x.beginPath(); x.moveTo(0, h); let y = y0; for (let px = 0; px <= w; px += 8) { y += (r() - .5) * amp; y = y0 + (y - y0) * glatt; x.lineTo(px, y); } x.lineTo(w, h); x.fill(); };
    const baum = (bx, by, bh, farbe) => { x.fillStyle = farbe; x.beginPath(); x.moveTo(bx, by - bh); for (let k = 0; k < 4; k++) { const yy = by - bh + (k + 1) * bh / 4, br = bh * (.12 + k * .08); x.lineTo(bx + br, yy); x.lineTo(bx + br * .35, yy); } x.lineTo(bx + bh * .03, by); x.lineTo(bx - bh * .03, by); for (let k = 3; k >= 0; k--) { const yy = by - bh + (k + 1) * bh / 4, br = bh * (.12 + k * .08); x.lineTo(bx - br * .35, yy); x.lineTo(bx - br, yy); } x.closePath(); x.fill(); };
    switch (th.land) {
      case "wald": case "sumpf":
        huegel(h * .72, 10, mitte, .9); for (let i = 0; i < 26; i++) baum(r() * w, h * (.74 + r() * .04), 40 + r() * 50, mitte);
        huegel(h * .86, 8, lf, .85); for (let i = 0; i < 14; i++) baum(r() * w, h * (.9 + r() * .05), 70 + r() * 90, lf);
        if (th.land === "sumpf") { x.strokeStyle = lf; x.lineWidth = 2; for (let i = 0; i < 40; i++) { const sx = r() * w, sh = 20 + r() * 40; x.beginPath(); x.moveTo(sx, h); x.quadraticCurveTo(sx + 4, h - sh * .6, sx + (r() - .5) * 14, h - sh); x.stroke(); } }
        break;
      case "berge": { const berg = (y0, hoch, farbe) => { x.fillStyle = farbe; x.beginPath(); x.moveTo(0, h); let px = 0; x.lineTo(0, y0); while (px < w) { const b = 60 + r() * 120; x.lineTo(px + b / 2, y0 - hoch * (.4 + r() * .6)); px += b; x.lineTo(px, y0 - r() * 20); } x.lineTo(w, h); x.fill(); };
        berg(h * .7, h * .32, dunkler(th.h[2], .62)); berg(h * .82, h * .22, mitte); huegel(h * .92, 6, lf, .8); break; }
      case "huegel": huegel(h * .74, 14, mitte, .9); huegel(h * .88, 10, lf, .85);
        x.strokeStyle = lf; x.lineWidth = 2; for (let i = 0; i < 9; i++) { const sx = r() * w, sy = h * (.86 + r() * .06), l = 40 + r() * 40, a = -1.2 - r() * .6; x.beginPath(); x.moveTo(sx, sy); x.lineTo(sx + Math.cos(a) * l, sy + Math.sin(a) * l); x.stroke(); } break;
      case "wasser": huegel(h * .58, 8, mitte, .9); x.fillStyle = dunkler(th.h[2], .35); x.fillRect(0, h * .62, w, h * .38);
        if (r() < 2) { x.fillStyle = lf; x.beginPath(); x.moveTo(w * .08, h * .62); x.lineTo(w * .28, h * .62); x.lineTo(w * .25, h * .66); x.lineTo(w * .11, h * .66); x.fill(); x.fillRect(w * .175, h * .46, 2, h * .16); x.beginPath(); x.moveTo(w * .18, h * .47); x.lineTo(w * .25, h * .6); x.lineTo(w * .18, h * .6); x.fill(); } break;
      case "tiefe": for (let i = 0; i < 7; i++) { const sx = r() * w; x.fillStyle = "rgba(230,255,200,.05)"; x.beginPath(); x.moveTo(sx, 0); x.lineTo(sx + 40 + r() * 60, 0); x.lineTo(sx - 60 + r() * 200, h); x.lineTo(sx - 120 + r() * 100, h); x.fill(); }
        huegel(h * .86, 14, lf, .85); x.strokeStyle = lf; x.lineWidth = 3; for (let i = 0; i < 22; i++) { const sx = r() * w, sh = 40 + r() * 90; x.beginPath(); x.moveTo(sx, h); x.bezierCurveTo(sx + 14, h - sh * .3, sx - 14, h - sh * .6, sx + (r() - .5) * 20, h - sh); x.stroke(); } break;
      case "hoehle": case "kerker":
        x.fillStyle = lf; x.beginPath(); x.moveTo(0, 0); for (let px = 0; px <= w; px += 14) x.lineTo(px, 10 + r() * 30 + (r() < .2 ? 40 + r() * 70 : 0)); x.lineTo(w, 0); x.fill();
        x.beginPath(); x.moveTo(0, h); for (let px = 0; px <= w; px += 16) x.lineTo(px, h - 14 - r() * 26 - (r() < .15 ? 30 + r() * 50 : 0)); x.lineTo(w, h); x.fill();
        if (th.land === "kerker") { x.fillStyle = lf; for (let i = 0; i < 9; i++) x.fillRect(w * .58 + i * 26, h * .1, 6, h * .8); x.fillRect(w * .56, h * .1, 26 * 9 + 6, 8); x.fillRect(w * .56, h * .88, 26 * 9 + 6, 8);
          x.fillStyle = dunkler(th.h[2], .3); x.fillRect(w * .16, h * .32, w * .12, h * .2); }
        break;
      case "innen": case "boegen": {
        x.fillStyle = lf; x.fillRect(0, h * .9, w, h * .1);
        if (th.land === "innen") { for (let i = 0; i < 4; i++) x.fillRect(w * (.04 + i * .31), 0, 16, h); x.fillRect(0, h * .08, w, 14); x.fillRect(0, h * .3, w, 8);
          x.fillStyle = dunkler(th.h[2], .22); x.beginPath(); x.moveTo(w * .4, h * .9); x.lineTo(w * .4, h * .55); x.quadraticCurveTo(w * .5, h * .42, w * .6, h * .55); x.lineTo(w * .6, h * .9); x.fill(); }
        else { for (let i = 0; i < 5; i++) { const bx = w * (i / 4), bw = w * .1; x.fillRect(bx - bw / 2, h * .25, bw, h * .7); }
          x.beginPath(); x.moveTo(0, 0); x.lineTo(w, 0); x.lineTo(w, h * .3); for (let i = 4; i >= 1; i--) { const a = w * (i / 4), b = w * ((i - 1) / 4); x.lineTo(a - w * .05, h * .3); x.quadraticCurveTo((a + b) / 2, h * .02, b + w * .05, h * .3); } x.lineTo(0, h * .3); x.fill(); }
        break; }
      case "daecher": case "burg":
        huegel(h * .8, 6, mitte, .9); x.fillStyle = lf;
        if (th.land === "burg") { const bx = w * .3, by = h * .82; x.fillRect(bx, by - h * .3, w * .4, h * .3); for (let i = 0; i < 4; i++) { const tx = bx - 20 + i * (w * .4 / 3); x.fillRect(tx, by - h * .46, 40, h * .46); for (let z = 0; z < 4; z++) x.fillRect(tx + z * 11, by - h * .5, 7, 8); }
          for (let z = 0; z < 16; z++) x.fillRect(bx + z * (w * .4 / 16), by - h * .33, 10, 8); }
        else { let px = 0; while (px < w) { const b = 50 + r() * 70, hh = 40 + r() * 60, by = h * .9; x.fillRect(px, by - hh, b - 6, hh + 20); x.beginPath(); x.moveTo(px - 6, by - hh); x.lineTo(px + (b - 6) / 2, by - hh - 30 - r() * 20); x.lineTo(px + b, by - hh); x.fill();
            if (r() < .6) { x.fillStyle = "rgba(255,190,90,.55)"; x.fillRect(px + b * .3, by - hh * .6, 9, 11); x.fillStyle = lf; } px += b + 8; } }
        x.fillRect(0, h * .92, w, h * .08); break;
    }
    return c;
  }
  function wbTeilchen(th, w, h, neu) {
    const p = neu || {}, a = th.teil, R = Math.random;
    p.l = 0; p.max = 3 + R() * 6; p.g = 2 + R() * 3;
    if (a === "glut") { p.x = w * (th.lp[0] + (R() - .5) * .5); p.y = h * (th.lp[1] + R() * .05); p.vx = (R() - .5) * 12; p.vy = -20 - R() * 40; }
    else if (a === "funken") { p.x = w * th.lp[0] + (R() - .5) * 40; p.y = h * th.lp[1]; const ang = -Math.PI / 2 + (R() - .5) * 1.6, v = 80 + R() * 160; p.vx = Math.cos(ang) * v; p.vy = Math.sin(ang) * v; p.max = .8 + R() * 1.2; p.g = 1.5 + R() * 1.5; }
    else if (a === "tropfen") { p.x = R() * w; p.y = 30 + R() * 30; p.vx = 0; p.vy = 0; p.max = 4; p.g = 1.6; }
    else if (a === "blase") { p.x = R() * w; p.y = h + 10; p.vx = 0; p.vy = -25 - R() * 40; p.g = 2 + R() * 5; p.max = 14; }
    else if (a === "nebel") { p.x = R() * w; p.y = h * (.55 + R() * .4); p.vx = 6 + R() * 10; p.vy = 0; p.g = 50 + R() * 70; p.max = 12 + R() * 10; }
    else if (a === "pollen") { p.x = R() * w; p.y = R() * h; p.vx = 6 + R() * 10; p.vy = 3 + R() * 6; p.g = 1.5 + R() * 2; p.max = 6 + R() * 6; }
    else if (a === "sporen") { p.x = R() * w; p.y = h * (.5 + R() * .5); p.vx = (R() - .5) * 6; p.vy = -6 - R() * 10; p.g = 2 + R() * 3; p.max = 6 + R() * 6; }
    else { p.x = R() * w; p.y = R() * h; p.vx = (R() - .5) * 8; p.vy = (R() - .5) * 8; p.g = a === "gluehw" ? 2.5 + R() * 2 : 1 + R() * 1.5; p.max = 4 + R() * 6; }
    p.ph = R() * 6.3; return p;
  }
  function wbStart() {
    if (SEITE !== "welten") return;
    if (!WB.c) { WB.c = document.createElement("canvas"); WB.c.className = "zp-weltbild"; document.body.appendChild(WB.c); WB.x = WB.c.getContext("2d"); }
    WB.c.style.display = "block"; WB.letzt = 0; if (!WB.raf) WB.raf = requestAnimationFrame(wbBild);
  }
  function wbStop() { if (WB.raf) cancelAnimationFrame(WB.raf); WB.raf = 0; if (WB.c) WB.c.style.display = "none"; }
  function wbBild(jetzt) {
    WB.raf = 0; if (!zpRuhe || SEITE !== "welten") { wbStop(); return; }
    WB.raf = requestAnimationFrame(wbBild);
    if (jetzt - WB.letzt < 32) return; const dt = Math.min(.1, WB.letzt ? (jetzt - WB.letzt) / 1000 : .033); WB.letzt = jetzt;
    const c = WB.c, x = WB.x, w = window.innerWidth, h = window.innerHeight; if (c.width !== w || c.height !== h) { c.width = w; c.height = h; WB.bgKey = ""; }
    const m = wMix() || {}, id = m.welt ? m.welt.id : "_still", th = WB_TH[WB_WELT[id]] || (m.welt && m.welt.episch ? WB_TH.kampf : WB_TH.berge), t = jetzt / 1000;
    if (WB.bgKey !== id + w + "x" + h) { WB.bg = wbHintergrund(th, id, w, h); WB.bgKey = id + w + "x" + h; WB.teile = []; WB.th = th; }
    let p = null; try { const a = WA(); p = a && a.pegel ? a.pegel() : null; } catch (_) {}
    const lv = v => Math.max(0, Math.min(1, ((v > 1e-5 ? 20 * Math.log10(v) : -90) + 54) / 48));
    const g = p ? lv(p.gesamt) : 0; WB.gesamt += ((g > WB.gesamt ? .5 : .08)) * (g - WB.gesamt);
    const bet = (m.betten || []), n = Math.min(8, bet.length);
    for (let i = 0; i < n; i++) { const z = p && p.betten ? lv(p.betten[i] || 0) : 0; WB.pegel[i] = (WB.pegel[i] || 0) + (z > (WB.pegel[i] || 0) ? .35 : .06) * (z - (WB.pegel[i] || 0)); }
    x.globalCompositeOperation = "source-over"; x.globalAlpha = 1; x.drawImage(WB.bg, 0, 0);
    /* Lichtquelle (Feuer, Mond, Kerzen …) atmet mit dem Gesamtpegel */
    const lx = th.lp[0] * w, ly = th.lp[1] * h, rad = Math.max(w, h) * (.28 + WB.gesamt * .22 + Math.sin(t * 1.7) * .015);
    x.globalCompositeOperation = "lighter"; const lg = x.createRadialGradient(lx, ly, 0, lx, ly, rad);
    lg.addColorStop(0, th.licht + "66"); lg.addColorStop(.35, th.licht + "22"); lg.addColorStop(1, th.licht + "00"); x.fillStyle = lg; x.globalAlpha = .45 + WB.gesamt * .55; x.fillRect(0, 0, w, h);
    /* die Schichten als Lichtbänder */
    for (let i = 0; i < n; i++) {
      const L = WB.pegel[i] || 0, ruht = bet[i].ruht || !bet[i].v, base = h * (.3 + i * (.4 / Math.max(1, n))), A = 3 + L * 34, k1 = .006 + i * .0013, s1 = .5 + i * .17;
      x.globalAlpha = ruht ? .06 : .1 + L * .55; x.strokeStyle = WB_BAND[i % WB_BAND.length]; x.lineWidth = 1 + L * 3.5; x.beginPath();
      for (let px = -10; px <= w + 10; px += 14) { const y = base + Math.sin(px * k1 + t * s1 + i * 1.3) * A + Math.sin(px * k1 * 2.3 - t * .8 + i) * A * .45; px < 0 ? x.moveTo(px, y) : x.lineTo(px, y); }
      x.stroke(); x.globalAlpha *= .35; x.lineWidth *= 4; x.stroke();
    }
    /* Teilchen */
    const ziel = { glut: 60, funken: 50, staub: 50, gluehw: 26, pollen: 40, tropfen: 6, blase: 26, sporen: 40, nebel: 10 }[th.teil] || 30;
    while (WB.teile.length < ziel) WB.teile.push(wbTeilchen(th, w, h));
    const spr = wbSprite(th.tf), schub = 1 + WB.gesamt * 1.5;
    for (const q of WB.teile) {
      q.l += dt; if (q.l > q.max || q.y < -60 || q.y > h + 60 || q.x < -120 || q.x > w + 120) { wbTeilchen(th, w, h, q); continue; }
      if (th.teil === "funken" || th.teil === "tropfen") q.vy += (th.teil === "funken" ? 120 : 260) * dt;
      if (th.teil === "glut" || th.teil === "sporen" || th.teil === "blase") q.vx += Math.sin(t * 2 + q.ph) * 8 * dt;
      if (th.teil === "gluehw" || th.teil === "staub") { q.vx += (Math.random() - .5) * 20 * dt; q.vy += (Math.random() - .5) * 20 * dt; q.vx *= .99; q.vy *= .99; }
      q.x += q.vx * dt * schub; q.y += q.vy * dt * schub;
      const leben = Math.min(1, q.l / .4, (q.max - q.l) / .8);
      let al = leben * (th.teil === "gluehw" ? Math.max(0, Math.sin(t * 2.2 + q.ph)) : th.teil === "nebel" ? .14 : .75);
      if (th.teil === "tropfen") { x.globalAlpha = .7 * leben; x.strokeStyle = th.tf; x.lineWidth = 1.4; x.beginPath(); x.moveTo(q.x, q.y); x.lineTo(q.x, q.y - 6 - q.vy * .03); x.stroke(); continue; }
      if (th.teil === "blase") { x.globalAlpha = .45 * leben; x.strokeStyle = th.tf; x.lineWidth = 1; x.beginPath(); x.arc(q.x, q.y, q.g, 0, 7); x.stroke(); continue; }
      x.globalAlpha = al; const d = q.g * 4; x.drawImage(spr, q.x - d / 2, q.y - d / 2, d, d);
    }
    /* Wetter */
    const wt = m.wetter, regen = { niesel: 40, regen: 110, gewitter: 160, sturm: 140 }[wt] || 0, schnee = wt === "schnee" ? 90 : 0, wind = wt === "wind" ? 18 : wt === "sturm" ? 10 : 0;
    const wz = regen || schnee || wind; while (WB.wetter.length < wz) WB.wetter.push({ x: Math.random() * w, y: Math.random() * h, v: .6 + Math.random() * .6 }); if (WB.wetter.length > wz) WB.wetter.length = wz;
    if (wz) {
      const schraeg = wt === "sturm" ? .55 : wt === "wind" ? 1 : .12; x.lineWidth = schnee ? 0 : 1;
      x.strokeStyle = "rgba(235,225,205,1)"; x.fillStyle = "rgba(250,245,235,1)"; x.beginPath();
      for (const q of WB.wetter) {
        if (wind && !regen) { q.x += 420 * q.v * dt; q.y += 10 * dt; if (q.x > w + 80) { q.x = -80; q.y = Math.random() * h; } x.moveTo(q.x, q.y); x.lineTo(q.x - 60 * q.v, q.y - 2); continue; }
        if (schnee) { q.y += 40 * q.v * dt; q.x += Math.sin(t + q.v * 9) * 14 * dt; if (q.y > h) { q.y = -4; q.x = Math.random() * w; } x.moveTo(q.x + 1.6 * q.v, q.y); x.arc(q.x, q.y, 1.6 * q.v, 0, 7); continue; }
        q.y += 620 * q.v * dt; q.x += 620 * q.v * schraeg * dt; if (q.y > h) { q.y = -20; q.x = Math.random() * w * 1.2 - w * .2; }
        x.moveTo(q.x, q.y); x.lineTo(q.x - 14 * schraeg, q.y - 14);
      }
      x.globalAlpha = schnee ? .75 : wind && !regen ? .12 : .28; schnee ? x.fill() : x.stroke();
    }
    /* Gewitter: ab und zu ein Blitz */
    if (wt === "gewitter" || wt === "sturm") {
      if (!WB.naechsterBlitz) WB.naechsterBlitz = t + 4 + Math.random() * 8;
      if (t > WB.naechsterBlitz) { WB.blitz = 1; WB.naechsterBlitz = t + 5 + Math.random() * 10; let bx = w * (.15 + Math.random() * .7), by = 0; WB.bolzen = [[bx, by]]; while (by < h * .6) { by += 20 + Math.random() * 30; bx += (Math.random() - .5) * 50; WB.bolzen.push([bx, by]); } }
    } else WB.naechsterBlitz = 0;
    if (WB.blitz > .02) {
      x.globalAlpha = WB.blitz * .35; x.fillStyle = "#f6ecff"; x.fillRect(0, 0, w, h);
      if (WB.bolzen && WB.blitz > .5) { x.globalAlpha = WB.blitz; x.strokeStyle = "#fff8ff"; x.lineWidth = 2.5; x.beginPath(); WB.bolzen.forEach(([a, b], i) => i ? x.lineTo(a, b) : x.moveTo(a, b)); x.stroke(); }
      WB.blitz *= Math.pow(.02, dt);
    }
    x.globalAlpha = 1; x.globalCompositeOperation = "source-over";
    /* weicher Rand unten, damit Schrift lesbar bleibt */
    const vg = x.createLinearGradient(0, h * .7, 0, h); vg.addColorStop(0, "rgba(0,0,0,0)"); vg.addColorStop(1, "rgba(0,0,0,.55)"); x.fillStyle = vg; x.fillRect(0, h * .7, w, h * .3);
  }
  function zpRuheAn() {
    if (zpRuhe || $(".zyn-menue")) return; zpRuhe = true; document.documentElement.classList.add("zyn-ruhe"); zpRuheZeichnen(); ledsMelden(); if (SEITE === "welten") wbStart();
  }
  function zpRuheAus() { zpRuhe = false; wbStop(); document.documentElement.classList.remove("zyn-ruhe"); if (zpRuheEl) zpRuheEl.innerHTML = ""; zpZeichnen(true); ledsMelden(); }
  function zpRuheZeichnen() {
    if (!zpRuheEl || !zpRuhe) return;
    const z = pz() || {}, L = window.ImresPult && window.ImresPult.listen ? window.ImresPult.listen() : null;
    let titel = "", unter = "", quellen = "";
    if (SEITE === "welten") {
      const a = $(".welt.an"); titel = a ? kurzName(a.querySelector(".nm") || a) : W("Stille", "Silence"); const sy = a && a.querySelector(".sym");
      unter = (sy ? sy.textContent : "🌿") + " " + W("Klangwelt", "Soundscape");
      quellen = $$("[data-szene][aria-pressed=true], [data-ger].an").slice(0, 8).map(el => '<span class="q"><b>' + esc2(teil((el.innerText || el.textContent || "").split("⏳")[0].replace(/\s+/g, " "), "")[0] || "✦") + "</b>" + esc2(teil((el.innerText || el.textContent || "").split("⏳")[0].replace(/\s+/g, " "), "")[1]) + "</span>").join("");
    } else {
      titel = z.laeuft && L ? teil(L.namen.st[z.stimmung] || "", "")[1] : W("Die Bühne wartet", "The stage is waiting");
      unter = z.kulLaeuft && L && z.kulisse && z.kulisse !== "keine" ? L.namen.kul[z.kulisse] || "" : W("kein Hintergrund", "no backdrop");
      const gesehen = new Set();
      quellen = $$("#lautenwerk .lw-karte .lw-kquelle").map(el => { const n = (el.getAttribute("title") || "").split(" – ")[0].trim(); if (!n || gesehen.has(n)) return ""; gesehen.add(n); const sv = el.querySelector("svg"); return '<span class="q">' + (sv ? sv.outerHTML : "") + esc2(n) + "</span>"; }).join("");
    }
    zpRuheEl.innerHTML = '<div class="zr-kopf"><div class="zr-titel">' + esc2(titel) + '</div><div class="zr-unter">' + esc2(unter) + (z.laeuft ? " · ♩ " + Math.round(z.tempoJetzt || z.tempo || 0) : "") + "</div></div>" +
      (quellen ? '<div class="zr-quellen">' + quellen + "</div>" : "") + '<div class="zr-tipp">' + W("Taste, Regler oder Bildschirm – weiter geht’s", "Any button, knob or touch to continue") + "</div>";
  }
  /* Tasten als 4 Spalten à 5 (unten → oben), so wie sie auf dem V5 liegen */
  const SPALTEN = [["LEFT", "BACK", "REC", "ALT", "MENU"], ["DOWN", "UP", "STOP", "TEMPO", "MIXER"], ["RIGHT", "SEL", "PLAY", "PAD", "CTRL"], ["F4", "F3", "F2", "F1", "ZS3"]];
  const FLAMME = ["#ff2a00", "#ff5a00", "#ff9000", "#ffc830", "#fff0c0"];
  const balkenSpitze = [0, 0, 0, 0], balkenWert = [0, 0, 0, 0], balkenMax = [.3, .3, .3, .3];
  let balkenDaten = null;
  function zpBalken() {
    const a = MESSER.filter(x => x.context.state === "running").pop(), t = Date.now() / 1000;
    if (!a) return [0, 1, 2, 3].map(i => .12 + .1 * Math.sin(t * 1.3 + i));
    if (!balkenDaten || balkenDaten.length !== a.frequencyBinCount) balkenDaten = new Uint8Array(a.frequencyBinCount);
    a.getByteFrequencyData(balkenDaten);
    const hz = a.context.sampleRate / a.fftSize, mittel = (lo, hi) => { let s = 0, n = 0; for (let i = Math.max(1, Math.floor(lo / hz)); i <= Math.min(balkenDaten.length - 1, Math.ceil(hi / hz)); i++) { s += balkenDaten[i]; n++; } return n ? s / n / 255 : 0; };
    const roh = [mittel(30, 160), mittel(160, 700), mittel(700, 3000), mittel(3000, 11000)];
    return roh.map((v, i) => { balkenMax[i] = Math.max(v, balkenMax[i] * .997, .08); const x = Math.max(0, Math.min(1, Math.pow(v / balkenMax[i], 1.6) * 1.05)); balkenWert[i] = x > balkenWert[i] ? x : balkenWert[i] * .82 + x * .18; balkenSpitze[i] = Math.max(balkenWert[i], balkenSpitze[i] - .035); return balkenWert[i]; });
  }
  function flammeFarbe(h, w) {
    const stufe = w * 5 - h; /* > 1: ganz an, 0..1: anglühen */
    if (stufe >= 1) return FLAMME[h];
    if (stufe > 0) return dimm(FLAMME[h], .15 + .85 * stufe);
    return h === 0 ? "#200800" : "#000000";
  }
  function zpLeds(f) {
    if (zpSeite === "beats" && !zpRuhe) {
      const P = BP(), info = beatsInfo(), d0 = zpDef("beats");
      if (P && info) { const dat = P.beatsDaten(beatsTeil(info)) || {}, sp = beatSpur(info), g = Math.floor(BC.s / 4) * 4, kopf = info.laeuft ? info.schritt : -1;
        const tj = beatsTeil(info), blink = Math.floor(Date.now() / 300) % 2 === 0;
        if (BC.mod) ["F1", "F2", "F3", "F4"].forEach((nm, k) => { f[nm] = VAR[k] === tj ? "#000000" : blink ? (BC.mod === "ZS3" ? "#fff0c0" : "#ff9a40") : "#000000"; });
        else if (alt) ["F1", "F2", "F3", "F4"].forEach((nm, k) => { const p = VAR[k]; f[nm] = p === tj ? ALT_FARBE : info.naechsterLoop === p ? (blink ? ALT_FARBE : "#000000") : info.belegt && info.belegt[p] ? dimm(ALT_FARBE, .35) : dimm(ALT_FARBE, .06); });
        else ["F1", "F2", "F3", "F4"].forEach((nm, k) => { const i = g + k, an = (dat[sp.id] || [])[i] >= 0; f[nm] = i === kopf ? "#fff4e0" : an ? d0.led : (i === BC.s ? dimm("#f4c45a", .5) : dimm(d0.led, .12)); }); }
      ["PLAY", "STOP", "TEMPO", "ZS3", "CTRL"].forEach(k => { const id = ZB.tasten[(alt ? "ALT+" : "") + k]; const c = aktFarbe(id); f[k] = aktAktiv(id) ? c : dimm(c, .38); });
      f.PAD = "#ff9a40"; f.REC = BC.liveRec ? "#ff1a30" : dimm("#ff1a30", .3); f.SEL = "#f4c45a"; f.LEFT = f.RIGHT = f.UP = f.DOWN = dimm("#fff0c0", .35);
      f.MIXER = BANK_FARBE[bankName()] || "#ffc830"; f.ALT = alt ? ALT_FARBE : dimm(ALT_FARBE, .18); f.MENU = dimm("#ffcf50", .5); f.BACK = dimm("#ff4020", .45); return;
    }
    if (zpRuhe) { const b = zpBalken(); SPALTEN.forEach((sp, c) => sp.forEach((k, h) => { f[k] = flammeFarbe(h, b[c]); })); return; }
    const d = zpDef(zpSeite), b = zpBlattJetzt(), blink = Math.floor(Date.now() / 450) % 2 === 0, i = ZP_SEITEN.findIndex(x => x.id === zpSeite);
    ["F1", "F2", "F3", "F4"].forEach((nm, k) => { const it = b[(alt ? 4 : 0) + k]; f[nm] = !it ? "#000000" : it.an ? d.led : it.vor ? (blink ? d.led : "#000000") : it.fav ? dimm(d.led, .6) : dimm(d.led, .3); });
    ["PLAY", "STOP", "PAD", "REC", "TEMPO", "ZS3", "CTRL"].forEach(k => { const id = ZB.tasten[(alt ? "ALT+" : "") + k]; if (!id || id === "nichts") { f[k] = "#000000"; return; } const c = aktFarbe(id); f[k] = aktAktiv(id) ? c : dimm(c, .38); });
    f.MIXER = BANK_FARBE[bankName()] || "#ffc830"; f.ALT = alt ? ALT_FARBE : dimm(ALT_FARBE, .18); f.MENU = dimm("#ffcf50", .5); f.BACK = dimm("#ff4020", .45);
    f.SEL = zpCursor >= 0 ? "#f4c45a" : dimm("#f4c45a", .15);
    if (alt) { f.LEFT = dimm(ZP_SEITEN[(i + ZP_SEITEN.length - 1) % ZP_SEITEN.length].led, .6); f.RIGHT = dimm(ZP_SEITEN[(i + 1) % ZP_SEITEN.length].led, .6); f.UP = f.DOWN = zpGruppen.length > 1 ? dimm("#ffffff", .3) : "#000000"; }
    else { f.LEFT = f.RIGHT = zpListe.length > 1 ? dimm("#ffffff", .3) : dimm("#ffffff", .08); f.UP = f.DOWN = dimm("#ffffff", .12); }
  }
  if (PULT) {
    if (modus === "klang" || modus === "musik") { document.documentElement.classList.remove("zyn-m-" + modus); modus = "buehne"; schreib("imres-zyn-modus", "buehne"); document.documentElement.classList.add("zyn-m-buehne"); }
    document.documentElement.classList.add("zyn-pult");
    const st = document.createElement("style");
    st.textContent = `
html.zyn-pult, html.zyn-pult body { overflow: hidden !important; }
/* Rechenzeit sparen: alles, was unter dem Pult liegt, bewegt sich nicht und wird nicht gemalt */
html.zyn-pult body *:not(.lw-buehne, .lw-buehne *, .zp, .zp *, .zp-ruhe, .zp-ruhe *, .zyn-osd, .zyn-osd *, .zyn-menue, .zyn-menue *) { animation: none !important; transition: none !important; }
html.zyn-pult body canvas:not(.lw-buehne canvas), html.zyn-pult body video { display: none !important; }
html.zyn-pult body .zr-raum canvas#zr-c { display: block !important; }
html.zyn-pult body > *:not(.zp, .zp-ruhe, .zp-weltbild, .zyn-osd, .zyn-menue, .zyn-update, #imres-logo, script, style) { content-visibility: hidden; }
html.zyn-pult.zyn-bb body > *:has(.lw-buehne), html.zyn-pult.zyn-ruhe body > *:has(.lw-buehne) { content-visibility: visible !important; } /* !important: die Regel darüber ist durch #imres-logo in :not() spezifischer */
html.zyn-pult .zyn-leiste { display: none !important; }
/* Bühnenbild: hinter dem Pult (gedimmt) und als Ruhebild */
/* alles andere der Webseite unsichtbar machen – nur die Bühne (und Pult/Ruhebild) malen */
html.zyn-pult.zyn-bb body *, html.zyn-pult.zyn-ruhe body * { visibility: hidden !important; }
html.zyn-pult.zyn-pult body .lw-buehne, html.zyn-pult.zyn-pult body .lw-buehne *,
html.zyn-pult.zyn-pult body .zp, html.zyn-pult.zyn-pult body .zp *, html.zyn-pult.zyn-pult body .zp-ruhe, html.zyn-pult.zyn-pult body .zp-ruhe *,
html.zyn-pult.zyn-pult body .zp-weltbild, html.zyn-pult.zyn-pult body .zyn-osd, html.zyn-pult.zyn-pult body .zyn-osd *, html.zyn-pult.zyn-pult body .zyn-menue, html.zyn-pult.zyn-pult body .zyn-menue * { visibility: visible !important; }
html.zyn-pult.zyn-bb body::before, html.zyn-pult.zyn-bb body::after, html.zyn-pult.zyn-ruhe body::before, html.zyn-pult.zyn-ruhe body::after { display: none !important; }
html.zyn-pult.zyn-ruhe body, html.zyn-pult.zyn-bb body { background: #0d0a10 !important; }
html.zyn-pult.zyn-pult.zyn-bb #lautenwerk .lw-buehne.lw-buehne, html.zyn-pult.zyn-pult.zyn-ruhe #lautenwerk .lw-buehne.lw-buehne {
  display: block !important; position: fixed !important; left: 0 !important; top: 0 !important; right: 0 !important; bottom: 0 !important; width: auto !important; height: auto !important;
  z-index: 2147480000 !important; margin: 0 !important; border-radius: 0 !important; border: 0 !important; grid-column: auto !important; }
html.zyn-pult.zyn-bb .zp { background: rgba(14, 10, 18, .74); }
html.zyn-pult.zyn-bb .zp-kopf, html.zyn-pult.zyn-bb .zp-fuss { background: rgba(28, 22, 36, .88); }
html.zyn-pult.zyn-bb .zp-regler { background: rgba(22, 17, 29, .86); }
html.zyn-pult.zyn-bb .zp-k { background: rgba(29, 23, 38, .78) !important; }
html.zyn-ruhe .zp { opacity: 0; pointer-events: none; transition: opacity .8s; }
.zp { transition: opacity .25s; }
.zp-weltbild { position: fixed; inset: 0; width: 100vw; height: 100vh; z-index: 2147482490; display: none; pointer-events: none; }
html:not(.zyn-ruhe) .zp-weltbild { display: none !important; }
html.zyn-pult.zyn-ruhe.zyn-welten body canvas.zp-weltbild { display: block !important; visibility: visible !important; opacity: 1 !important; }
.zp-ruhe { position: fixed; inset: 0; z-index: 2147482500; display: none; pointer-events: auto; color: #ebe2cc; font: 600 16px/1.2 system-ui, sans-serif; }
html.zyn-ruhe .zp-ruhe { display: block; }
.zp-ruhe .zr-kopf { position: absolute; left: 14px; top: 12px; padding: 8px 14px; border-radius: 12px; background: rgba(14, 10, 18, .55); border: 1px solid rgba(255, 200, 48, .35); }
.zp-ruhe .zr-titel { font-size: 26px; color: #ffd75a; text-shadow: 0 0 12px rgba(255, 200, 48, .45); }
.zp-ruhe .zr-unter { font-size: 15px; color: #e8dcc4; margin-top: 3px; }
.zp-ruhe .zr-quellen { position: absolute; left: 10px; right: 10px; bottom: 34px; display: flex; flex-wrap: wrap; gap: 6px; justify-content: center; }
.zp-ruhe .q { display: flex; align-items: center; gap: 6px; padding: 5px 10px; border-radius: 999px; background: rgba(14, 10, 18, .62); border: 1px solid rgba(240, 220, 160, .35); font-size: 14px; color: #f0e4c8; }
.zp-ruhe .q svg { width: 20px; height: 20px; color: #ffd75a; flex: none; } .zp-ruhe .q b { font-size: 18px; }
.zp-ruhe .zr-tipp { position: absolute; left: 0; right: 0; bottom: 8px; text-align: center; font-size: 12px; color: rgba(235, 226, 204, .55); }
.zp { position: fixed; inset: 0; z-index: 2147481000; background: #120e18; color: #ebe2cc; font: 600 15px/1.2 system-ui, sans-serif; display: grid; grid-template-columns: minmax(0, 1fr) 176px; grid-template-rows: 50px minmax(0, 1fr) 42px; user-select: none; -webkit-tap-highlight-color: transparent; }
.zp button { font: inherit; color: inherit; background: none; border: 0; padding: 0; cursor: pointer; }
.zp-kopf { grid-column: 1 / 3; display: flex; align-items: center; gap: 4px; padding: 0 8px; background: #1c1624; border-bottom: 1px solid #3a2f48; min-width: 0; }
.zp-tab { padding: 8px 9px !important; border-radius: 9px; color: #b8a998 !important; white-space: nowrap; font-size: 15.5px !important; border: 2px solid color-mix(in srgb, var(--f) 45%, transparent) !important; }
.zp-tab .zp-sym { font-size: 18px; }
.zp-tab.an { background: linear-gradient(160deg, color-mix(in srgb, var(--f) 70%, #fff8e0) 0%, var(--f) 45%, color-mix(in srgb, var(--f) 75%, #000) 100%) !important; color: #140e06 !important; box-shadow: 0 0 10px color-mix(in srgb, var(--f) 45%, transparent); }
.zp-status { margin-left: auto; font-size: 13px; color: #c8bba6; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; min-width: 0; padding-left: 8px; }
.zp-status b { color: #f2cf6a; } .zp-status .rec { color: #ff5050; } .zp-status .alt { color: #e080e0; }
.zp-mitte { display: grid; grid-template-rows: 30px minmax(0, 1fr); padding: 4px 8px 8px; min-width: 0; min-height: 0; }
.zp-gruppe { display: flex; align-items: center; justify-content: space-between; font-size: 13px; letter-spacing: .06em; text-transform: uppercase; color: var(--f); }
.zp-blatt { display: flex; align-items: center; gap: 6px; } .zp-blatt button { padding: 0 12px !important; font-size: 20px; color: #e0d3be !important; }
.zb { display: grid; grid-template-columns: 92px repeat(var(--n), minmax(0, 1fr)); grid-auto-rows: minmax(0, 1fr); gap: 3px; min-height: 0; }
.zb-name { font-size: 12.5px !important; text-align: left !important; padding: 0 4px !important; border-radius: 6px; color: #d8cbb6 !important; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; border: 1px solid transparent !important; }
.zb-name .zb-h { font-style: normal; font-size: 9px; color: #ffc830; }
.zb-name.cur { border-color: #f4c45a !important; color: #fff0c0 !important; } .zb-name.stumm { opacity: .4; text-decoration: line-through; }
.zb-z { border-radius: 5px; background: #221b2c !important; border: 1px solid #3a2f48 !important; font-size: 10px !important; color: #140e06 !important; font-weight: 800; padding: 0 !important; }
.zb-z.eins { background: #2c2338 !important; }
.zb-z.an { background: color-mix(in srgb, var(--f) calc(var(--h, 1) * 100%), #3a2a1a) !important; border-color: var(--f) !important; }
.zb-z.stumm.an { opacity: .45; }
.zb-z.kopf { box-shadow: inset 0 0 0 2px #fff4e0; }
.zb-vars { margin-left: 10px; } .zb-knoepfe { display: flex; gap: 6px; margin-left: auto; } .zb-knoepfe button { font-size: 12px !important; padding: 2px 9px !important; border-radius: 7px; border: 1px solid #5a4a3a !important; background: #241c2c !important; color: #f0dca0 !important; }
.zb-knoepfe button.an { background: #ff1a30 !important; color: #fff !important; border-color: #ff6a70 !important; animation: zpblink 1s steps(2) infinite; }
.zb-padsbox { display: grid; grid-template-rows: minmax(0, 1.25fr) minmax(0, 1fr); gap: 6px; min-height: 0; }
.zb-pads { display: grid; grid-template-columns: repeat(4, 1fr); grid-template-rows: repeat(2, minmax(0, 1fr)); gap: 6px; min-height: 0; }
.zb-pad { touch-action: none; user-select: none; border-radius: 12px; border: 2px solid color-mix(in srgb, var(--p) 55%, #2a2234); background: linear-gradient(160deg, color-mix(in srgb, var(--p) 22%, #1d1726), #17111e); display: grid; grid-template-columns: auto 1fr; grid-template-rows: 1fr auto; align-items: center; padding: 4px 8px; gap: 0 6px; min-height: 0; overflow: hidden; }
.zb-pad span { font-size: 26px; grid-row: 1 / 3; } .zb-pad b { font-size: 15px; color: #f4e6cc; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; } .zb-pad small { font-size: 10px; color: var(--p); font-weight: 700; }
.zb-pad.cur { border-color: var(--p); box-shadow: 0 0 0 2px color-mix(in srgb, var(--p) 40%, transparent); }
.zb-pad.stumm { opacity: .4; }
.zb-pad.blitz { animation: zbblitz .22s ease-out; }
@keyframes zbblitz { 0% { background: var(--p); box-shadow: 0 0 22px var(--p); } 100% { } }
.zb.klein { grid-template-columns: 26px repeat(var(--n), minmax(0, 1fr)); gap: 2px; }
.zb.klein .zb-name { font-size: 12px !important; padding: 0 !important; text-align: center !important; }
.zb.klein .zb-z { font-size: 0 !important; border-radius: 3px; }
.zb-z.cur { outline: 2px solid #f4c45a; outline-offset: 1px; }
.zyn-menue.zyn-tastatur { width: 96vw !important; max-width: 780px !important; }
.zyn-tast { display: flex; flex-direction: column; gap: 5px; width: 100%; }
.zt-reihe { display: flex; gap: 5px; justify-content: center; width: 100%; }
.zyn-menue .zt-reihe button { min-width: 0 !important; width: auto !important; flex: 1 1 0 !important; height: 42px; padding: 0 !important; font-size: 19px !important; text-align: center !important; justify-content: center !important; display: flex !important; align-items: center; }
.zyn-menue .zt-reihe .zt-breit { flex: 4 1 0 !important; } .zyn-menue .zt-reihe .zt-ok { flex: 2 1 0 !important; background: #3a5a20 !important; }
.zb-vars { display: flex; align-items: center; gap: 4px; color: #a99d8c; font-size: 11px; }
.zb-var { width: 26px; height: 22px; border-radius: 5px; border: 1px solid #5a4a6a !important; color: #c8bba6 !important; font-size: 13px !important; }
.zb-var.voll { border-color: #c040ff !important; } .zb-var.an { background: #c040ff !important; color: #140e06 !important; } .zb-var.vor { animation: zpblink .6s steps(2) infinite; }
.zb-leer { display: flex; align-items: center; justify-content: center; color: #c8bba6; }
.zp-blatt em { font-style: normal; font-size: 12px; color: #c8bba6; min-width: 46px; text-align: center; }
.zp-gruppe small { text-transform: none; letter-spacing: 0; color: #776d60; font-size: 10.5px; margin-left: 6px; }
.zp-blatt i { width: 7px; height: 7px; border-radius: 50%; background: #3a2f48; } .zp-blatt i.an { background: var(--f); }
.zp-kacheln { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); grid-template-rows: repeat(2, minmax(0, 1fr)); gap: 7px; min-height: 0; }
.zp-k { position: relative; display: flex !important; flex-direction: column; justify-content: center; align-items: center; gap: 1px; padding: 6px 6px 7px !important; border-radius: 14px; border: 2px solid #3a2f48 !important; background: radial-gradient(120% 90% at 50% 18%, #2a2134, #1a1422 70%) !important; text-align: center; min-width: 0; overflow: hidden; container-type: size; }
.zp-k.leer { border-style: dashed !important; opacity: .35; }
.zp-k .zp-f { position: absolute; top: 5px; right: 7px; font-size: 11.5px; font-weight: 700; color: #a99d8c; border: 1px solid #5a5060; border-radius: 4px; padding: 1px 5px; }
.zp-k .zp-f.alt { color: #e0a0ff; border-color: #8040b0; }
.zp-k .zp-stern { position: absolute; top: 3px; right: 40px; font-size: 16px; color: #ffd75a; }
.zp-k .zp-still { position: absolute; left: 7px; top: 5px; font-size: 15px; opacity: .9; }
.zp-k.fav { border-color: color-mix(in srgb, var(--f) 55%, #3a2f48) !important; }
.zp-k .zp-s { font-size: clamp(30px, 42cqh, 72px); line-height: 1; margin: 0; padding: 0; filter: drop-shadow(0 2px 6px rgba(0,0,0,.55)); }
.zp-k .zp-n { font-size: clamp(13px, 14cqh, 18px); font-weight: 700; line-height: 1.12; max-width: 100%; hyphens: auto; overflow-wrap: anywhere; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.zp-k .zp-v { font-size: clamp(10px, 9cqh, 13px); color: var(--f); }
.zp-k.an { border-color: var(--f) !important; background: color-mix(in srgb, var(--f) 22%, #1d1726) !important; box-shadow: 0 0 14px color-mix(in srgb, var(--f) 40%, transparent); }
.zp-k.vor { border-style: dashed !important; border-color: var(--f) !important; animation: zpblink 1s steps(2) infinite; }
.zp-k.cur { outline: 3px solid #f4c45a; outline-offset: 1px; }
.zp-k.lauf { overflow: hidden; }
.zp-mitte.zr-m { grid-template-rows: minmax(0, 1fr); }
.zr-raum { position: relative; height: 100%; min-height: 0; border-radius: 14px; overflow: hidden; background: #0e0a14; touch-action: none; }
.zr-raum canvas { position: absolute; inset: 0; width: 100%; height: 100%; display: block; touch-action: none; }
.zr-info { position: absolute; left: 8px; top: 6px; display: flex; flex-direction: column; gap: 1px; max-width: 42%; pointer-events: none; font-size: 12.5px; color: #e8dcc4; background: rgba(20, 14, 26, .72); border-radius: 9px; padding: 5px 9px; }
.zr-info:empty { display: none; } .zr-info b { font-size: 14.5px; color: #fff4dc; } .zr-info small { color: #b8a8c8; font-size: 11px; }
.zr-tipp { position: absolute; right: 8px; bottom: 5px; max-width: 46%; text-align: right; font-size: 10.5px; color: #a898b8; pointer-events: none; line-height: 1.25; }
.zp-k.lauf::before { content: ""; position: absolute; left: 0; top: 0; bottom: 0; width: var(--p, 0%); background: linear-gradient(90deg, color-mix(in srgb, var(--f) 22%, transparent), color-mix(in srgb, var(--f) 48%, transparent)); border-right: 2px solid var(--f); pointer-events: none; }
.zp-k.lauf .zp-s, .zp-k.lauf .zp-n, .zp-k.lauf .zp-v { position: relative; }
.zp-k .zp-dauer { color: #d8ccb4; font-weight: 600; } .zp-k.an .zp-dauer { color: #fff4dc; }
.zp-k:active { transform: scale(.97); }
@keyframes zpblink { 50% { border-color: #3a2f48 !important; } }
.zst { text-align: center; padding: 4px 0 8px; } .zst-note { font-size: 64px; font-weight: 800; line-height: 1.05; color: #f0dca0; }
.zst-skala { position: relative; height: 22px; margin: 6px 40px; border-radius: 11px; background: linear-gradient(90deg, #ff6a3a, #ffc830 38%, #30ff70 47%, #30ff70 53%, #ffc830 62%, #ff6a3a); opacity: .9; }
.zst-skala i { position: absolute; left: 50%; top: -4px; bottom: -4px; width: 2px; background: #fff8ec; } .zst-skala b { position: absolute; left: 50%; top: -6px; width: 6px; height: 34px; margin-left: -3px; border-radius: 3px; background: #fff; box-shadow: 0 0 8px #fff; transition: left .1s; }
.zst-info { font-size: 16px; color: #e8dcc0; margin-top: 6px; }
.zp-misch { display: flex; flex-direction: column; height: 100%; min-height: 0; }
.zp-mfs { flex: 1; display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; padding: 8px 10px 10px; min-height: 0; }
.zp-mfs.zwei { grid-template-rows: repeat(2, minmax(0, 1fr)); gap: 6px 10px; padding: 4px 10px 6px; }
.zp-mfs.zwei .zp-mf { opacity: .55; padding: 3px 4px; gap: 2px; } .zp-mfs.zwei .zp-mf.aktiv { opacity: 1; border-color: var(--m); }
.zp-mfs.zwei .zp-mf.leer { opacity: .2; } .zp-mfs.zwei .zp-mf strong { font-size: 13px; } .zp-mfs.zwei .zp-mf em { font-size: 11.5px; } .zp-mfs.zwei .zp-mf i { min-height: 20px; }
.zp-mf { display: flex; flex-direction: column; align-items: center; gap: 5px; background: #1d1726; border: 2px solid color-mix(in srgb, var(--m) 45%, #2a2234); border-radius: 12px; padding: 6px 4px; min-height: 0; min-width: 0; }
.zp-mf > span { font-size: 12px; font-weight: 800; color: var(--m); }
.zp-mf i { flex: 1; width: 34px; border-radius: 8px; background: #2c2436; display: flex; align-items: flex-end; overflow: hidden; min-height: 40px; }
.zp-mf i b { display: block; width: 100%; background: linear-gradient(0deg, color-mix(in srgb, var(--m) 60%, #000), var(--m)); border-radius: 6px; }
.zp-mf .mfb { flex: 1; display: flex; gap: 4px; min-height: 0; justify-content: center; touch-action: none; }
.zp-mf .mfb i.fd { position: relative; width: 30px; }
.zp-mf .mfb i.fd u, .zp-mf .mfb i.fd s { position: absolute; left: 0; right: 0; height: 2px; margin-bottom: -1px; text-decoration: none; pointer-events: none; }
.zp-mf .mfb i.fd u { background: rgba(255, 244, 220, .55); } .zp-mf .mfb i.fd s { background: #ff4a2a; height: 3px; box-shadow: 0 0 4px #ff4a2a; }
.zp-mf .mfb i.pm { position: relative; flex: none; width: 7px; min-height: 40px; border-radius: 3px; background: linear-gradient(0deg, #3fa86a 0%, #a8c040 55%, #ffc830 78%, #ff3a2a 96%); display: block; }
.zp-mf .mfb i.pm b { position: absolute; top: 0; left: 0; right: 0; height: 100%; background: #241d2e; border-radius: 0; transition: height .06s linear; }
.zp-mfs.mx .zp-mf { touch-action: none; user-select: none; }
.zp-mfs.mx .zp-mf em { font-size: 13.5px; font-weight: 700; color: #fff4dc; }
.zp-mf.stumm { filter: grayscale(.85) brightness(.75); border-style: dashed; } .zp-mf.stumm em { color: #c8b8a0; }
.zp-mfs.zwei .zp-mf.solo, .zp-mf.solo { opacity: 1; border-color: var(--m); box-shadow: 0 0 12px color-mix(in srgb, var(--m) 70%, transparent), inset 0 0 8px color-mix(in srgb, var(--m) 35%, transparent); }
.zp-mf.clip { border-color: #ff3a2a !important; } .zp-mf.clip i.pm { box-shadow: 0 0 8px #ff3a2a; }
.zp-ab { display: flex; gap: 4px; flex: none; text-transform: none; letter-spacing: 0; }
.zp-ab button { padding: 2px 8px !important; font-size: 12px; border-radius: 6px; border: 1px solid #4a3e58 !important; background: #1d1726 !important; color: #b8ac98 !important; }
.zp-ab button.an { border-color: var(--f) !important; color: #140e06 !important; background: var(--f) !important; font-weight: 800; }
.zp-mf strong { font-size: 14px; text-align: center; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%; }
.zp-mf em { font-style: normal; font-size: 12.5px; color: #e8dcc0; text-align: center; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%; }
.zp-regler { border-left: 4px solid var(--b); display: grid; grid-template-rows: 22px repeat(4, minmax(0, 1fr)); background: #16111d; min-height: 0; }
.zp-bank small { font-weight: 600; font-size: 9.5px; letter-spacing: 0; margin-left: 6px; opacity: .75; }
.zp-rn em { font-style: normal; } .zp-rn em.lp { color: #ffd75a; } .zp-rn em.rec { color: #ff3040; animation: zpblink 1s steps(2) infinite; }
.zp-bank { white-space: nowrap; overflow: hidden; font-size: 12px; font-weight: 700; letter-spacing: .06em; color: #140e06; background: linear-gradient(160deg, color-mix(in srgb, var(--b) 65%, #fff) 0%, var(--b) 50%, color-mix(in srgb, var(--b) 75%, #000) 100%); padding: 3px 10px; }
.zp-r { padding: 6px 10px; border-bottom: 1px solid #2a2234; display: flex; flex-direction: column; justify-content: center; gap: 5px; min-width: 0; }
.zp-rn { font-size: 15px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; } .zp-rn small { color: #f0dca0; }
.zp-r i { display: block; height: 9px; border-radius: 4px; background: #2c2436; overflow: hidden; } .zp-r i b { display: block; height: 100%; background: var(--b); }
.zp-rv { display: flex; justify-content: space-between; gap: 4px; font-size: 13.5px; color: #d8cbb6; } .zp-rv small { font-size: 9.5px; color: #807666; align-self: end; white-space: nowrap; }
.zp-fuss { grid-column: 1 / 3; display: flex; gap: 4px; align-items: center; padding: 0 8px; background: #1c1624; border-top: 1px solid #3a2f48; overflow: hidden; }
.zp-fuss button { display: flex; align-items: center; gap: 5px; padding: 5px 7px !important; border: 1px solid color-mix(in srgb, var(--c) 55%, #3a2f48) !important; border-radius: 7px; font-size: 12.5px; white-space: nowrap; flex: 0 1 auto; min-width: 0; overflow: hidden; }
.zp-fuss button i { width: 9px; height: 9px; border-radius: 50%; background: var(--c); box-shadow: 0 0 6px var(--c); flex: none; }
.zp-fuss button b { color: #ebe2cc; }
`;
    document.head.appendChild(st);
    zpEl.className = "zp"; document.body.appendChild(zpEl);
    zpRuheEl = document.createElement("div"); zpRuheEl.className = "zp-ruhe"; document.body.appendChild(zpRuheEl);
    zpRuheEl.addEventListener("pointerdown", e => { e.preventDefault(); e.stopPropagation(); zpAktiv(); });
    document.documentElement.classList.toggle("zyn-bb", bildHinten() && SEITE === "buehne");
    setInterval(() => { const s = ruheSek(); if (!zpRuhe && s && Date.now() - zpLetzte > s * 1000 && !$(".zyn-menue")) zpRuheAn(); if (zpRuhe) zpRuheZeichnen(); }, 1000);
    setInterval(() => { if (zpRuhe) { try { ledsMelden(); } catch (_) {} } }, 110);
    let favT = 0, favUnterdrueck = false;
    zpEl.addEventListener("pointerdown", e => { const pd = e.target.closest("[data-zb-pad]"); if (pd) { e.preventDefault(); beatPad(+pd.dataset.zbPad); $$(".zb-pad.cur", zpEl).forEach(x => x.classList.remove("cur")); pd.classList.add("cur"); } });
    zpEl.addEventListener("pointerdown", e => { zpLetzte = Date.now(); zpZeiger = true; const k = e.target.closest("[data-zp-k]"); if (!k) return; const i = +k.dataset.zpK; clearTimeout(favT); favT = setTimeout(() => { favUnterdrueck = true; zpFavUmschalten(i); }, 1500); });
    const zeigerLos = () => { zpZeiger = false; clearTimeout(favT); };
    zpEl.addEventListener("pointerup", zeigerLos); zpEl.addEventListener("pointercancel", zeigerLos); zpEl.addEventListener("pointerleave", zeigerLos);
    zpEl.addEventListener("contextmenu", e => e.preventDefault());
    /* Mischer per Touch: Fader ziehen (hoch/runter), lange halten = Solo */
    let mfZug = null, mfUnterdrueck = false;
    zpEl.addEventListener("pointerdown", e => { const mf = e.target.closest("[data-zp-mf]"); if (!mf || !panelAktiv() || e.target.closest("button")) return;
      const i = +mf.dataset.zpMf, r = panelListe()[i], fd = mf.querySelector(".fd"); if (!r || r === ZP_PARAM.nichts) return;
      mfUnterdrueck = false; mfZug = { i, r, y: e.clientY, v0: r.lies(), h: fd ? fd.getBoundingClientRect().height : 100, zieht: false, k: mischAktiv() ? mixKeys()[i] : null };
      try { mf.setPointerCapture(e.pointerId); } catch (_) {}
      if (mfZug.k) mfZug.t = setTimeout(() => { if (mfZug && !mfZug.zieht) { mfUnterdrueck = true; mxSolo(mfZug.k); mfZug = null; } }, 650); });
    zpEl.addEventListener("pointermove", e => { const z = mfZug; if (!z) return; const dy = z.y - e.clientY;
      if (!z.zieht) { if (Math.abs(dy) < 8) return; z.zieht = true; clearTimeout(z.t); mfUnterdrueck = true;
        if (z.k && (MX.stumm[z.k] != null || mxBlend[z.k])) { if (mxBlend[z.k]) { clearInterval(mxBlend[z.k].t); delete mxBlend[z.k]; } delete MX.stumm[z.k]; mxMerken(); z.v0 = z.r.lies(); } }
      let v = rasten(z.v0 + dy / Math.max(40, z.h) * (z.r.hi - z.r.lo), z.r); if (z.k) v = Math.min(v, Math.max(z.v0, mxKlemmen(z.k, v)));
      if (v !== z.r.lies()) { z.r.setz(v); zpReglerAnzeige(); } });
    const mfLos = () => { if (mfZug) { clearTimeout(mfZug.t); const war = mfZug.zieht; mfZug = null; if (war) zpZeichnen(true); } };
    zpEl.addEventListener("pointerup", mfLos); zpEl.addEventListener("pointercancel", () => { mfLos(); mfUnterdrueck = false; });
    zpEl.addEventListener("click", e => {
      if (favUnterdrueck) { favUnterdrueck = false; return; }
      const tb = e.target.closest("[data-zp-tab]"); if (tb) { zpSeiteSetzen(tb.dataset.zpTab); return; }
      if (e.target.closest("[data-zb-pad]")) return;
      if (e.target.closest("[data-zb-ansicht]")) { padsUmschalten(); return; }
      if (e.target.closest("[data-zb-padlaut]")) { const P = BP(), l = [1, 1.6, 2.2, 3, .6], v = P.padLaut(); P.padLaut(l[(l.findIndex(x => x > v + .01) + l.length) % l.length] || 1); zeige("🔊 " + W("Pads ", "Pads ") + Math.round(P.padLaut() * 100) + " %", null, W("wie laut die Pads beim Einspielen klingen", "how loud the pads play")); zpZeichnen(true); return; }
      if (e.target.closest("[data-zb-rec]")) { taste("REC", "kurz"); return; }
      const zv = e.target.closest("[data-zb-var]"); if (zv) { varWechseln(+zv.dataset.zbVar); return; }
      const zb = e.target.closest("[data-zb-r]");
      if (zb) { BC.r = +zb.dataset.zbR; if (zb.dataset.zbS != null) { BC.s = +zb.dataset.zbS; beatUmschalten(BC.s); } else { const info = beatsInfo(), sp = info && beatSpur(info); if (sp) BP().beatsAnschlag(sp.id, sp.art === "an" ? 0 : (BC.ton[sp.id] || 0)); zpZeichnen(true); } return; }
      const k = e.target.closest("[data-zp-k]"); if (k) { zpCursor = -1; zpAusloesen(+k.dataset.zpK); return; }
      if (e.target.closest("[data-zp-gruppe]")) { zpGruppeSchritt(1); return; }
      const bl = e.target.closest("[data-zp-blatt]"); if (bl) { zpBlaettern(+bl.dataset.zpBlatt); return; }
      const ta = e.target.closest("[data-zp-taste]"); if (ta && ta.dataset.zpTaste === "PAD" && zpSeite === "beats" && !alt) { beatPad(); return; }
      if (ta) { taste(ta.dataset.zpTaste, "kurz"); ledsMelden(); return; }
      const mxab = e.target.closest("[data-mx-ab]"); if (mxab) { mxAB(mxab.dataset.mxAb); return; }
      if (e.target.closest("[data-mx-menue]")) { mxMenue(); return; }
      const mf = e.target.closest("[data-zp-mf]"); if (mf) { if (mfUnterdrueck) { mfUnterdrueck = false; return; } const i = +mf.dataset.zpMf;
        if (mischAktiv()) { const k = mixKeys()[i]; if (MX_STUMMBAR.includes(k)) { mxStumm(k, true); return; } }
        reiheTipp = i > 3; try { zpDruck(i % 4); } finally { reiheTipp = null; } zpZeichnen(true); return; }
      const r = e.target.closest("[data-zp-r]"); if (r) { zpDruck(+r.dataset.zpR); }
    });
    if (SEITE === "buehne") { let versuche = 0; const einfachSicher = () => {
      const fertig = window.ImresPult && $("#lautenwerk .lw-pult"); if (!fertig) { if (versuche++ < 60) setTimeout(einfachSicher, 500); return; }
      if (!$('#lautenwerk [data-etab]') && lies("imres-lw-modus", "einfach") === "alles") { schreib("imres-lw-modus", "einfach"); pultKlick("data-aktion", "modus"); }
      else if (!$('#lautenwerk [data-etab]')) { schreib("imres-lw-modus", "einfach"); if (versuche++ < 60) { setTimeout(einfachSicher, 500); return; } }
      setTimeout(() => { const b = $('#lautenwerk [data-etab="ort"]'); if (b) klick(b); }, 400);
    }; setTimeout(einfachSicher, 800); } /* Zusätze (Wetter) sind nur im Reiter „Ort“ im Pult */
    let zpFehlerEl = null;
    const zpFehler = e => { if (!zpFehlerEl) { zpFehlerEl = document.createElement("div"); zpFehlerEl.style.cssText = "position:fixed;left:8px;bottom:46px;z-index:2147482600;max-width:784px;padding:4px 8px;border-radius:6px;background:#5a0a10;color:#fff;font:12px system-ui;visibility:visible"; document.body.appendChild(zpFehlerEl); }
      zpFehlerEl.textContent = "⚠ " + (e && e.message ? e.message : e) + (e && e.stack ? " · " + String(e.stack).split("\n")[1] : ""); };
    try { zpZeichnen(true); } catch (e) { zpFehler(e); }
    setTimeout(() => { try { bankenNeu(); } catch (_) {} }, 3000);
    setInterval(() => { if (zpRuhe || document.hidden) return; try { zpZeichnen(); if (zpFehlerEl) { zpFehlerEl.remove(); zpFehlerEl = null; } } catch (e) { console.warn("zp", e); zpFehler(e); } }, 700);
    /* Musik weiter vorausplanen, damit kurze Ruckler der Oberfläche nicht hörbar werden */
    const vorlaufSetzen = () => { if (window.ImresPult && window.ImresPult.vorlauf) window.ImresPult.vorlauf(.7); else setTimeout(vorlaufSetzen, 500); }; if (SEITE === "buehne") vorlaufSetzen();
  }

  /* ---------- Verbindung zur Brücke ---------- */
  function verbinden() {
    let es; try { es = new EventSource("/zyn/ereignisse"); } catch (_) { return; }
    es.onmessage = m => {
      let e; try { e = JSON.parse(m.data); } catch (_) { return; }
      try {
        if (e.typ === "taste") taste(e.name, e.art);
        else if (e.typ === "dreh") dreh(e.nr, e.d);
        else if (e.typ === "midi") midi(e);
        else if (e.typ === "neu-laden") location.reload();
        else if (e.typ === "optionen") optSetzen(e.optionen || {}, true);
        else if (e.typ === "aufnahme") { aufnahmeAn = !!e.an; leisteZeichnen(); }
        else if (e.typ === "wert" || e.typ === "aktion" || e.typ === "kachel" || e.typ === "blatt" || e.typ === "seite") fernBefehl(e);
      } catch (err) { console.warn("zyn", err); }
      if (e.typ !== "dreh") ledsMelden();
    };
    es.onerror = () => { /* EventSource verbindet sich selbst neu */ };
  }
  verbinden();

  /* Beat-Builder (Komplettansicht): der Knopf „🧭 Einfach“ führt zurück ins Pult */
  if (!PULT && SEITE === "buehne") document.addEventListener("click", e => {
    const b = e.target && e.target.closest && e.target.closest('#lautenwerk [data-aktion="modus"]'); if (!b) return;
    if (lies("imres-lw-modus", "einfach") !== "alles") return;
    e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
    schreib("imres-zyn-pult", "1"); schreib("imres-lw-modus", "einfach"); schreib("imres-zyn-modus", "buehne");
    zeige("🎻 " + W("Bühnen-Pult", "Stage console"), null, W("wird geladen …", "loading …")); setTimeout(() => location.reload(), 120);
  }, true);

  /* zum Ausprobieren am Rechner: Tastatur wie die Tasten (F1–F4, Pfeile, Enter = SEL, Backspace = BACK, M = MENU, X = MIXER, Leertaste = PLAY) */
  addEventListener("keydown", e => {
    if (e.target && /INPUT|TEXTAREA|SELECT/.test(e.target.tagName) && e.target.type !== "range") return;
    const k = { F1: "F1", F2: "F2", F3: "F3", F4: "F4", ArrowUp: "UP", ArrowDown: "DOWN", ArrowLeft: "LEFT", ArrowRight: "RIGHT", Enter: "SEL", Backspace: "BACK", m: "MENU", x: "MIXER", " ": "PLAY", p: "PAD" }[e.key];
    if (!k || e.isTrusted === false) return;
    e.preventDefault(); taste(k, "kurz"); ledsMelden();
  }, true);

  /* Klangwelten: Mischpult-Regler bereitstellen; Bühne: einfache Ansicht, keine Einführung */
  setTimeout(weltenMischBereit, 1500);
  setTimeout(tabPassend, 1200);
  if (SEITE === "buehne") setTimeout(() => { const r = $("#lautenwerk"); if (r) r.scrollIntoView({ block: "start" }); }, 600);
  fetch("/zyn/status").then(r => r.json()).then(j => { aufnahmeAn = !!j.aufnahme; leisteZeichnen(); }).catch(() => {});
  leisteZeichnen(); ledsMelden();
  window.ImresZyn = { _test: { ruhe: () => zpRuheAn(), tonhoehe, tonartErkennen, stimmgeraet, get opt() { return OPT; }, autoSofort(art) { if (art === "mom") autoMom = 1; else if (art === "sp") autoSp = 1; else autoSt = 1; }, autoSetzen: m => autoSetzen(m) }, messer: MESSER, taste, dreh, midi, modusSetzen, optSetzen, get modus() { return modus; }, get opt() { return Object.assign({}, OPT); } };
})();
