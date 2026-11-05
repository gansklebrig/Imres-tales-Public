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
  function stellRegler(def, d) {
    const v0 = def.lies(), v = Math.max(def.lo, Math.min(def.hi, v0 + d * def.schritt));
    if (v !== v0) def.setz(v);
    zeige(def.name + " · " + (def.text ? def.text(v) : Math.round(proz(v, def.lo, def.hi) * 100) + " %"), proz(v, def.lo, def.hi), def.unter);
  }
  const zahl = (x, d) => (typeof x === "number" && isFinite(x) ? x : d);
  /* Bühne */
  const B_REGLER = [[
    { name: W("🎵 Musik", "🎵 Music"), lo: 0, hi: 10, schritt: 1, lies: () => zahl(pz() && pz().master, 8), setz: v => pultRegler("data-feld", "master", v) },
    { name: W("🌲 Hintergrund", "🌲 Backdrop"), lo: 0, hi: 10, schritt: 1, lies: () => zahl(pz() && pz().kulisseVol, 5), setz: v => pultRegler("data-feld", "kulvol", v) },
    { name: W("🔥 Wie viel los", "🔥 How busy"), lo: 0, hi: 10, schritt: 1, lies: () => zahl(pz() && pz().intensitaet, 5), setz: v => pultRegler("data-feld", "intensitaet", v) },
    { name: W("😨 Spannung", "😨 Tension"), lo: 0, hi: 100, schritt: 5, lies: () => Math.round(zahl(pz() && pz().spannung, 0) * 100), setz: v => pultRegler("data-leben", "spannung", v) }
  ], [
    { name: W("⏱ Tempo", "⏱ Tempo"), lo: 50, hi: 180, schritt: 2, lies: () => zahl(pz() && pz().tempo, 100), setz: v => { if (window.ImresPult && window.ImresPult.tempo) window.ImresPult.tempo(v); else pultRegler("data-feld", "tempo", v); }, text: v => v + " BPM" },
    { name: W("🏛 Hall", "🏛 Reverb"), lo: 0, hi: 10, schritt: 1, lies: () => zahl(pz() && pz().hall, 5), setz: v => pultRegler("data-feld", "hall", v) },
    { name: W("💥 Effekte", "💥 Effects"), lo: 0, hi: 10, schritt: 1, lies: () => zahl(pz() && pz().fxVol, 7), setz: v => pultRegler("data-feld", "fxvol", v) },
    { name: W("🎐 Echos Hall", "🎐 Echo reverb"), lo: 0, hi: 10, schritt: 1, lies: () => zahl(pz() && pz().echoHall, 5), setz: v => pultRegler("data-feld", "echohall", v) }
  ]];
  /* Klangwelten */
  const wRegler = (sel, name, lo, hi, schritt) => ({ name, lo, hi, schritt,
    lies: () => { const el = $(sel); return el ? +el.value : lo; },
    setz: v => { const el = $(sel); if (!el) return; el.value = String(v); el.dispatchEvent(new Event("input", { bubbles: true })); el.dispatchEvent(new Event("change", { bubbles: true })); } });
  const W_REGLER = [[
    wRegler("#gesamt", W("🔊 Lautstärke", "🔊 Volume"), 0, 100, 2),
    wRegler('[data-regler="spannung"]', W("😨 Spannung", "😨 Tension"), 0, 100, 5),
    wRegler("#ger-laut", W("🎭 Geräusche", "🎭 Sounds"), 0, 150, 5),
    wRegler("#sz-laut", W("⏳ Szenen", "⏳ Scenes"), 0, 150, 5)
  ], [
    wRegler('[data-regler="leben"]', W("🐾 Lebendigkeit", "🐾 Liveliness"), 0, 200, 5),
    wRegler('[data-regler="raum"], [data-regler="ehall"]', W("🏛 Raumhall", "🏛 Room echo"), 0, 100, 5),
    wRegler('[data-regler="wlaut"]', W("🌦 Wetter", "🌦 Weather"), 0, 150, 5),
    wRegler('[data-regler="b0"]', W("🎚 Grundschicht", "🎚 Base layer"), 0, 150, 5)
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
    if (art === "kulisse") { const k = platz(art, i); if (k) { pultKlick("data-kulisse", k); zeige("🌲 " + kulName(k)); } return; }
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
  function menue(html, aktionen) {
    menueZu();
    const m = document.createElement("div"); m.className = "zyn-menue"; m.innerHTML = html; document.body.appendChild(m);
    m.addEventListener("click", e => { const b = e.target.closest("[data-zm]"); if (!b) { if (e.target === m) menueZu(); return; } const f = aktionen[b.dataset.zm]; if (f) f(); });
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
  function systemMenue() {
    const post = aktion => fetch("/zyn/system", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ aktion }) }).catch(() => {});
    menue("<h3>⚙ " + W("System", "System") + '</h3><div class="reihe">' +
      '<button type="button" data-zm="zyn">🎛 ' + W("Zurück zum Zynthian", "Back to Zynthian") + "<small>" + W("Die normale Zynthian-Oberfläche startet", "Starts the normal Zynthian interface") + "</small></button>" +
      '<button type="button" data-zm="upd">⬇ ' + W("Imres aktualisieren", "Update Imres") + "<small>" + W("holt die neueste Version (Internet nötig) und startet neu", "fetches the latest version (needs internet) and restarts") + "</small></button>" +
      '<button type="button" data-zm="hinter">🎛+🎻 ' + W("Zusammen mit Zynthian", "Together with Zynthian") + "<small>" + W("Zynthian-Oberfläche, Imres spielt im Hintergrund weiter (Handy/MIDI)", "Zynthian UI, Imres keeps playing in the background") + "</small></button>" +
      '<button type="button" data-zm="auf">' + (aufnahmeAn ? "⏹ " + W("Aufnahme beenden", "Stop recording") : "⏺ " + W("Aufnahme starten", "Start recording")) + "<small>" + W("alles, was rauskommt – im Zynthian-Ordner „capture“", "everything you hear – Zynthian capture folder") + "</small></button>" +
      '<button type="button" data-zm="start">🔌 ' + W("Beim Einschalten: ", "At power-on: ") + "<b>" + W("Imres-Bühne", "Imres stage") + "</b><small>" + W("so startet das Gerät ab jetzt", "the device starts like this from now on") + "</small></button>" +
      '<button type="button" data-zm="startz">🔌 ' + W("Beim Einschalten: ", "At power-on: ") + "<b>Zynthian</b></button>" +
      '<button type="button" data-zm="neu">🔄 ' + W("Seite neu laden", "Reload page") + "</button>" +
      '<button type="button" data-zm="neustart">↻ ' + W("Zynthian neu starten", "Restart Zynthian") + "</button>" +
      '<button type="button" data-zm="aus">⏻ ' + W("Ausschalten", "Shut down") + "<small>" + W("Danach den Strom trennen", "Then unplug power") + "</small></button>" +
      '<button type="button" data-zm="zu">✕ ' + W("Schließen", "Close") + "</button></div>", {
      zyn: () => { zeige("🎛 " + W("Zynthian startet …", "Zynthian is starting …")); post("zynthian"); },
      upd: () => { menueZu(); zeige("⬇ " + W("Imres wird aktualisiert …", "Updating Imres …"), null, W("dauert bis zu einer Minute, danach startet die Bühne neu", "takes up to a minute, then the stage restarts")); post("aktualisieren"); },
      hinter: () => { zeige("🎛 " + W("Zynthian startet, Imres läuft weiter …", "Zynthian starts, Imres keeps playing …")); post("hintergrund"); },
      auf: () => { menueZu(); aufnahme(); },
      start: () => { post("start-imres"); zeige("🔌 " + W("Startet künftig mit der Imres-Bühne", "Will start with the Imres stage")); menueZu(); },
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
      zeile("umschaltCC", "🔀 " + W("Umschalten per CC 119", "Switch via CC 119"), an(OPT.umschaltCC), W("0–42 Zynthian · 43–85 zusammen · 86–127 Imres", "0–42 Zynthian · 43–85 together · 86–127 Imres")) +
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
  async function tonartErkennen() {
    let strom, c;
    try { strom = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } }); }
    catch (_) { zeige("🎤 " + W("Kein Mikrofon gefunden", "No microphone found")); return; }
    const AC = window.AudioContext || window.webkitAudioContext; c = new AC();
    const an = c.createAnalyser(); an.fftSize = 16384; an.smoothingTimeConstant = 0; c.createMediaStreamSource(strom).connect(an);
    const puf = new Float32Array(an.frequencyBinCount), chroma = new Array(12).fill(0), hz = c.sampleRate / an.fftSize;
    const ende = performance.now() + 8000;
    await new Promise(fertig => {
      const t = setInterval(() => {
        an.getFloatFrequencyData(puf); let max = -200; for (let i = 0; i < puf.length; i++) if (puf[i] > max) max = puf[i];
        if (max > -75) for (let i = Math.ceil(70 / hz); i < Math.min(puf.length, 1800 / hz); i++) {
          const d = puf[i]; if (d < max - 30 || d < puf[i - 1] || d < puf[i + 1]) continue; /* nur Spitzen */
          const midi = 69 + 12 * Math.log2(i * hz / 440); chroma[((Math.round(midi) % 12) + 12) % 12] += Math.pow(10, (d - max) / 20);
        }
        const rest = Math.ceil((ende - performance.now()) / 1000); zeige("👂 " + W("Ich höre zu … ", "Listening … ") + Math.max(0, rest) + " s", 1 - Math.max(0, ende - performance.now()) / 8000, W("Spiel ein paar Töne quer über die Handpan", "Play a few notes across the handpan"));
        if (performance.now() >= ende) { clearInterval(t); fertig(); }
      }, 100);
    });
    try { strom.getTracks().forEach(x => x.stop()); c.close(); } catch (_) {}
    const summe = chroma.reduce((a, b) => a + b, 0); if (summe <= 0) { zeige("👂 " + W("Nichts gehört", "Heard nothing")); return; }
    let best = null;
    Object.keys(SKALEN).forEach(k => { const st = SKALEN[k][2]; if (!st) return;
      for (let g = 0; g < 12; g++) { let drin = 0; st.forEach(i => { drin += chroma[(g + i) % 12]; }); const wert = drin / summe - (summe - drin) / summe * 1.5 + chroma[g] / summe * .6 - st.length * .005;
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
    if (name === "ALT") { if (art === "druck") alt = true; else if (art === "los") alt = false; leisteZeichnen(); ledsMelden(); return; }
    if (art === "druck" || art === "los") { if (PULT && !$(".zyn-menue")) zpDruckLos(name, art); return; }
    const lang = art === "lang";
    const m = $(".zyn-menue");
    if (m) {
      if (name === "BACK" || (name === "MENU" && !lang)) { menueZu(); return; }
      if (/^F[1-4]$/.test(name) && menueArt === "modus") { modusSetzen(MODUS_REIHE[+name[1] - 1]); return; }
      if (/^F[1-3]$/.test(name) && menueArt === "zpmodus") { zpModus(["buehne", "welten", "beat"][+name[1] - 1]); return; }
      if (/^F[1-4]$/.test(name) && menueArt === "zp") { if (name === "F2" && !m.querySelector('[data-zm="abend"]')) return; const b = m.querySelector('[data-zm="' + ZP_MENUE_F[+name[1] - 1] + '"]'); if (b) klick(b); return; }
      if ((name === "LEFT" || name === "RIGHT") && menueArt === "beleg" && fokus && fokus.dataset && /^b:/.test(fokus.dataset.zm || "")) { belegZyklus(fokus.dataset.zm.slice(2), name === "LEFT" ? -1 : 1); return; }
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
      case "MIXER": bankWechsel(); return;
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
    if ($(".zyn-menue")) { bewegen(d > 0 ? "DOWN" : "UP"); return; }
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
  const leistung = () => lies("imres-lw-spar", "0") === "1" ? "spar" : lies("imres-lw-leicht", "0") === "1" ? "leicht" : "voll";
  const LEISTUNG_NAME = { voll: W("voll (beste Klangqualität)", "full (best sound)"), leicht: W("leicht (ein Hall, 32 kHz)", "light (one reverb, 32 kHz)"), spar: W("sparsam (24 kHz, weniger Ebenen)", "saver (24 kHz, fewer layers)") };
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
  /* was gerade läuft – für die Fernbedienung am Handy */
  setInterval(() => {
    const z = pz(); let text = "";
    if (SEITE === "welten") { const a = $(".welt.an"); text = a ? "🌿 " + kurzName(a) : W("still", "silent"); }
    else if (z) text = (z.laeuft ? "🎵 " + stimmName(z.stimmung) : "🎵 –") + " · " + (z.kulLaeuft ? "🌲 " + kulName(z.kulisse) : "🌲 –");
    fetch("/zyn/zustand", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ seite: SEITE, modus, text }) }).catch(() => {});
  }, 3000);

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
  function zpInhalt() {
    const g = [], P = window.ImresPult, z = pz() || {};
    if (SEITE === "welten") {
      /* nach den Überschriften der Seite gruppiert (z. B. „Türen & Truhen“, „Wesen & Tiere“) – jede Gruppe beginnt auf einem neuen Blatt */
      const gruppiert = (sel, sym, attr, standard) => { const m = new Map();
        $$(sel).forEach(el => { const gr = el.closest(".gruppe, .weltgruppe, section, details"); const h = gr && gr.querySelector("h3, h2, summary"); let t = standard; if (h) { const hh = h.cloneNode(true); hh.querySelectorAll("small, button, .knopf").forEach(x => x.remove()); t = hh.textContent.trim().replace(/\s+/g, " ") || standard; }
          let sy, nm; const s1 = el.querySelector(".sym"), n1 = el.querySelector(".nm");
          if (s1 && n1) { sy = s1.textContent.trim(); nm = n1.textContent.trim(); } else [sy, nm] = teil((el.innerText || el.textContent || el.title || "").split("⏳")[0].replace(/\s+/g, " "), sym);
          if (!m.has(t)) m.set(t, []);
          m.get(t).push({ key: attr + ":" + el.getAttribute("data-" + attr), sym: sy, name: nm, an: el.getAttribute("aria-pressed") === "true" || el.classList.contains("an"), los: () => { klick(el); zeige(sy + " " + nm); } }); });
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
        return { key: "kul:" + k, sym: sy, name: nm, an, los: () => { if (an) { pultKlick("data-kulisse", "keine"); zeige("🔇 " + W("Hintergrund aus", "Backdrop off")); } else { pultKlick("data-kulisse", k); zeige("🌲 " + nm); } } };
      }) });
      const zus = [], gesehen = new Set();
      ["regen", "starkregen", "gewitter", "sturm", "wind", "schnee", "feuer", "voegel", "grillen", "eule", "wolf", "bach", "wellen", "glocke", "uhr", "katze"].forEach(id => {
        const el = $('#lautenwerk [data-zusatz="' + id + '"]'); if (!el || gesehen.has(id)) return; gesehen.add(id);
        const nm = (el.getAttribute("title") || el.getAttribute("aria-label") || id).split(" – ")[0].trim();
        const [sy, n2] = teil(nm, { regen: "🌧", starkregen: "⛈", gewitter: "🌩", sturm: "🌪", wind: "💨", schnee: "❄", feuer: "🔥", voegel: "🐦", grillen: "🦗", eule: "🦉", wolf: "🐺", bach: "🏞", wellen: "🌊", glocke: "🔔", uhr: "🕰", katze: "🐈" }[id] || "✨");
        zus.push({ key: "zus:" + id, sym: sy, name: n2, an: el.getAttribute("aria-pressed") === "true" || el.classList.contains("an"), los: () => { const e2 = $('#lautenwerk [data-zusatz="' + id + '"]'); if (e2) klick(e2); else pultKlick("data-zusatz", id); } });
      });
      if (zus.length) g.push({ titel: W("Wetter & Zusätze", "Weather & extras"), l: zus });
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
  const BANKEN = ["A", "B", "FX"];
  const FX_PARAMS = ["filter", "reso", "delay", "rueck", "zeit", "drive", "crush", "rate", "gate", "ring", "flanger", "wobble"];
  const NORMAL_PARAMS = ["musik", "hg", "los", "spannung", "tempo", "hall", "fxlaut", "echohall"];
  const BANK_FARBE = { A: "#ffc830", B: "#f0dca0", FX: "#ff7a20", GLITCH: "#ff2a5a", MOD: "#fff8ec" };
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
    tap: [W("⏱ Tap-Tempo", "⏱ Tap tempo"), "Tap"], autopilot: [W("🤖 Autopilot umschalten", "🤖 Toggle autopilot"), "🤖"],
    set_weiter: [W("🎬 nächster Song im Set", "🎬 next song in set"), W("Song ▶", "song ▶")], set_zurueck: [W("🎬 voriger Song im Set", "🎬 previous song in set"), W("◀ Song", "◀ song")],
    nichts: ["– " + W("nichts", "nothing") + " –", ""]
  };
  const HALTEN = { filterzu: 1, filterhoch: 1, echowurf: 1, stotter: 1, rueckwaerts: 1, bandstop: 1, crushhalt: 1 };
  const ZP_TASTEN = ["PLAY", "STOP", "PAD", "REC", "TEMPO", "ZS3", "CTRL", "ALT+PLAY", "ALT+STOP", "ALT+PAD", "ALT+REC", "ALT+TEMPO", "ALT+ZS3", "ALT+CTRL"];
  const ZP_STANDARD = {
    regler: { "A:stimmung": ["musik", "spannung", "hg", "los"], "A:ort": ["hg", "los", "spannung", "hall"], "A:momente": ["fxlaut", "spannung", "hall", "tempo"],
      B: ["tempo", "hall", "fxlaut", "echohall"], FX: ["filter", "delay", "crush", "gate"] },
    tasten: { PLAY: "play", STOP: "stop", PAD: "passiert", REC: "stille", TEMPO: "tap", ZS3: "seite_zurueck", CTRL: "seite_vor",
      "ALT+PLAY": "fx_aus", "ALT+STOP": "filterzu", "ALT+PAD": "sprechen", "ALT+REC": "aufnahme", "ALT+TEMPO": "neubesetzen", "ALT+ZS3": "echowurf", "ALT+CTRL": "stotter" }
  };
  let ZB = JSON.parse(JSON.stringify(ZP_STANDARD));
  try { const g = JSON.parse(lies("imres-zyn-beleg", "null")); if (g && g.regler && g.tasten) { Object.assign(ZB.regler, g.regler); Object.assign(ZB.tasten, g.tasten); } } catch (_) {}
  const belegMerken = () => schreib("imres-zyn-beleg", JSON.stringify(ZB));
  const bankName = () => BANKEN[bank] || "A";
  function zpRegler() {
    if (SEITE === "welten") return W_REGLER[bank % 2].map((r, i) => Object.assign({ druck: i === 0 ? "stumm" : i === 1 ? "friedlich" : "mitte" }, r));
    if (zpSeite === "beats" && !bank) return beatsRegler();
    if (zpSeite === "beats" && bank === 1) return beatsHuelleRegler();
    const l = bank ? ZB.regler[bankName()] : ZB.regler["A:" + (zpSeite === "set" ? "stimmung" : zpSeite)];
    return (l || []).slice(0, 4).map(k => ZP_PARAM[k] || ZP_PARAM.nichts);
  }
  const DRUCK_TEXT = { stumm: W("drücken: stumm", "push: mute"), hg: W("drücken: an/aus", "push: on/off"), friedlich: W("drücken: friedlich", "push: peaceful"), mitte: W("drücken: Mitte", "push: centre"), null: W("drücken: neutral", "push: reset") };
  function zpWert(r) { const v = r.lies(); return { v, anteil: Math.max(0, Math.min(1, proz(v, r.lo, r.hi))), text: r.text ? r.text(v) : r.wort ? r.wort(v) : Math.round(proz(v, r.lo, r.hi) * 100) + " %" }; }
  /* Regler gedrückt halten und drehen: anderen Effekt (bzw. Wert) auf diesen Regler legen */
  const drehGedrueckt = {}, drehGedreht = {};
  function zpParamZyklus(nr, d) {
    if (SEITE === "welten") return;
    const slot = bank ? bankName() : "A:" + (zpSeite === "set" ? "stimmung" : zpSeite), liste = bankName() === "FX" ? FX_PARAMS : NORMAL_PARAMS.concat(FX_PARAMS);
    const l = (ZB.regler[slot] || ["nichts", "nichts", "nichts", "nichts"]).slice(), jetzt = l[nr], i = liste.indexOf(jetzt);
    l[nr] = liste[((i < 0 ? 0 : i + (d > 0 ? 1 : -1)) + liste.length) % liste.length]; ZB.regler[slot] = l; belegMerken();
    zeige("⇄ " + W("Regler ", "Knob ") + (nr + 1) + ": " + (ZP_PARAM[l[nr]] || ZP_PARAM.nichts).name, null, W("loslassen zum Behalten", "release to keep")); zpZeichnen(true);
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
    if (drehGedrueckt[nr] && !(zpSeite === "beats" && bank < 2)) { drehGedreht[nr] = true; zpParamZyklus(nr, d); return; }
    const r = zpRegler()[nr]; if (!r || !r.schritt) return; const v0 = r.lies(), v = Math.max(r.lo, Math.min(r.hi, v0 + d * r.schritt)); if (v !== v0) r.setz(v); loopMitschreiben(r, v);
    if (zpSeite === "beats" && bank < 2) zpZeichnen(true); else zpReglerAnzeige();
  }
  let reglerRaf = 0;
  function zpReglerAnzeige() {
    if (reglerRaf) return;
    reglerRaf = requestAnimationFrame(() => { reglerRaf = 0; const rs = zpRegler();
      $$(".zp-r", zpEl).forEach((el, i) => { const r = rs[i]; if (!r) return; const w = zpWert(r), b = el.querySelector("i b"), t = el.querySelector(".zp-rv > span"); if (b) b.style.width = Math.round(w.anteil * 100) + "%"; if (t) t.textContent = w.text; }); });
  }
  function zpDruck(nr) {
    const r = zpRegler()[nr]; if (r && r.aktion) { r.aktion(); zpZeichnen(true); return; } if (!r || !r.schritt) return; const k = bank + "-" + zpSeite + "-" + nr;
    if (r.druck === "stumm") { const v = r.lies(); if (v > r.lo) { merkStumm[k] = v; r.setz(r.lo); zeige("🔇 " + r.name); } else { r.setz(merkStumm[k] != null ? merkStumm[k] : Math.round((r.lo + r.hi) * .7)); zeige("🔊 " + r.name); } }
    else if (r.druck === "hg") { pultKlick("data-aktion", "kulumschalt"); zeige("🌲 " + W("Hintergrund an / aus", "Backdrop on / off")); }
    else if (r.druck === "friedlich") r.setz(r.lo);
    else if (r.druck === "null") { r.setz(r.neutral); zeige(r.name + " · " + W("neutral", "reset")); }
    else r.setz(Math.round(((r.lo + r.hi) / 2) / r.schritt) * r.schritt);
    zpZeichnen(true);
  }
  function bankWeiter() { const n = SEITE === "welten" ? 2 : BANKEN.length; bank = (bank + 1) % n; weltenMischBereit(); zeige("⟲ " + W("Reglerbank ", "Knob bank ") + (SEITE === "welten" ? (bank ? "B" : "A") : bankName()), null, zpRegler().map(r => r.name).join(" · ")); zpZeichnen(true); ledsMelden(); }
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
      case "hg": if (SEITE === "welten") return false; pultKlick("data-aktion", "kulumschalt"); zeige("🌲 " + W("Hintergrund an / aus", "Backdrop on / off")); return true;
      case "fx_aus": if (SEITE === "welten") return false; ["filter", "echo", "drive", "crush", "rate", "ring", "flanger", "gate", "wobble"].forEach(k => fxSetz(k, 0)); zeige("✨ " + W("Effekte zurückgesetzt", "Effects reset")); zpZeichnen(true); return true;
      case "tap": if (SEITE === "welten") return false; tapTempo(); return true;
      case "autopilot": autoSetzen(AUTO_STUFEN[(AUTO_STUFEN.indexOf(autoModus) + 1) % AUTO_STUFEN.length]); return true;
      case "set_weiter": if (SEITE === "welten" || !SET.length) return true; setLaden(Math.min(SET.length - 1, setIndex + 1)); return true;
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
      case "MIXER": bankWeiter(); return true;
      case "LEFT": case "RIGHT": if (alt) { zpSeiteSchritt(name === "LEFT" ? -1 : 1); return true; } zpCursorBewegen(name); return true;
      case "UP": case "DOWN": if (alt) { zpGruppeSchritt(name === "UP" ? -1 : 1); return true; } zpCursorBewegen(name); return true;
      case "SEL": if (zpCursor < 0) zpCursorBewegen("RIGHT"); else zpAusloesen(zpCursor); return true;
      case "BACK":
        if (lang) { zeige("🎛 " + W("Zynthian startet …", "Zynthian is starting …")); fetch("/zyn/system", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ aktion: "zynthian" }) }).catch(() => {}); return true; }
        if (zpCursor >= 0) { zpCursor = -1; zpZeichnen(true); } else if (zpBlatt[zpSeite]) { zpBlatt[zpSeite] = 0; zpZeichnen(true); } else zeige("↩ " + W("BACK 2 s halten: zurück zum Zynthian", "Hold BACK 2 s: back to Zynthian"));
        return true;
    }
    const id = ZB.tasten[(alt ? "ALT+" : "") + name];
    if (!id) return false;
    if (HALTEN[id]) return true; /* läuft über Drücken/Loslassen */
    return zpAktion(id);
  }
  /* Drücken / Loslassen für „solange gedrückt“-Aktionen */
  const gehalten = {}, favTimer = {}, favVerbraucht = {};
  function zpDruckLos(name, art) {
    if (zpSeite === "beats" && name === "PAD") { if (art === "druck") beatPad(); return; }
    if (zpSeite === "beats" && (name === "CTRL" || name === "ZS3")) { if (art === "druck") { BC.mod = name; BC.modBenutzt = false; } else BC.mod = null; ledsMelden(); return; }
    if (zpSeite === "beats" && /^F[1-4]$/.test(name)) return; /* keine Favoriten auf der Beats-Seite */
    const dm = /^DREH([1-4])$/.exec(name);
    if (dm) { const nr = +dm[1] - 1; if (art === "druck") { drehGedrueckt[nr] = true; drehGedreht[nr] = false; } else { drehGedrueckt[nr] = false; setTimeout(() => { drehGedreht[nr] = false; }, 400); } return; }
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
      (SEITE === "buehne" ? zz("begl", "🎹 " + W("Synth-Begleitung: ", "Synth accompaniment: ") + "<b>" + (BEGL.an ? W("an", "on") : W("aus", "off")) + "</b>", W("Akkorde als MIDI an Zynthian-Synths", "chords as MIDI to Zynthian synths")) : "") +
      zz("einst", "🛠 " + W("Einstellungen", "Settings"), W("Leistung, Licht, Bühnenbild, Belegung …", "performance, light, stage view, mapping …")) +
      '<button type="button" data-zm="zu">✕ ' + W("Schließen", "Close") + "</button></div>" +
      '<p class="hinweis">' + W("F1–F4 wählen · Pfeile/Drehregler + SEL · BACK schließt", "F1–F4 pick · arrows/knob + SEL · BACK closes") + "</p>",
      { modus: zpModusMenue, abend: zpAbendMenue, optionen: () => optionenMenue(), system: systemMenue, zu: menueZu, einst: () => zpEinstellungen(), begl: () => beglMenue(),
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
    const [art, a, b] = id.split("|"), l = art === "r" ? Object.keys(ZP_PARAM) : Object.keys(ZP_AKT), v = belegWert(id);
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
      ["MIXER", W("Reglerbank A → B → FX", "Knob bank A → B → FX")], [W("Regler drücken + drehen", "Push + turn knob"), W("anderen Effekt / Wert auf diesen Regler legen", "put another effect on this knob")], ["ALT + " + W("Regler drücken", "push knob"), W("⟳ Reglerbewegung aufnehmen und im Takt loopen · nochmal: Loop aus", "⟳ record knob moves and loop in time · again: off")], ["MENU", W("Menü (lang: System)", "Menu (hold: system)")], ["ALT + MENU", W("🎚 Optionen", "🎚 Options")], ["BACK", W("zurück · 2 s halten: zum Zynthian", "back · hold 2 s: to Zynthian")], ["🥁 Beats", W("◀▶ Schritt · ▲▼ Spur · SEL/F1–F4 setzen · Regler 3 Tonhöhe · PAD live spielen · REC live aufnehmen · ALT+◀▶ verschieben · ALT+▲/▼ Spur kopieren/einfügen · ALT+SEL leeren · ALT+F1–F4 Variation 1–4 · CTRL halten+F1–F4 Pattern in Variation kopieren · ZS3 halten+F1–F4 nur die Spur kopieren", "◀▶ step · ▲▼ track · SEL/F1–F4 set · knob 3 pitch · PAD play live · REC live record · ALT+◀▶ shift · ALT+▲/▼ copy/paste · ALT+SEL clear")], ["🎬 Set", W("Kachel = Song laden · ➕ speichert den jetzigen Klang · 1,5 s halten: ändern/verschieben/löschen", "tile = load song · ➕ saves · hold 1.5 s: edit")]]
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
  function autoSetzen(m) { autoModus = m; schreib("imres-zp-auto", m); autoSt = 0; if (m !== "aus") autoPlanen(); zeige("🤖 Autopilot: " + AUTO_NAME[m]); zpZeichnen(true); }
  setInterval(() => {
    if (autoModus === "aus") return; const j = Date.now(); if (!autoSt) autoPlanen();
    if (SEITE === "buehne") {
      const z = pz() || {}, P = window.ImresPult; if (!z.laeuft || !P || !P.listen) return;
      if (j >= autoSt) { autoPlanen("st"); const L = P.listen(); const fav = (FAV.stimmung || []).map(k => k.replace(/^st:/, "")).filter(k => L.st.includes(k));
        const pool = (fav.length >= 2 ? fav : L.st.slice(0, 8)).filter(k => k !== z.stimmung), k = pool[Math.floor(Math.random() * pool.length)];
        if (k) { pultKlick("data-vorlage", k); zeige("🤖 " + teil(L.namen.st[k] || k, "")[1], null, "Autopilot"); } }
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
      z("an", "🎹 " + W("Begleitung", "Accompaniment"), an(BEGL.an), W("Imres spielt seine Akkorde als MIDI mit – in eurer Tonart, im Takt", "Imres plays its chords as MIDI – in key, in time")) +
      z("pad", "· " + W("Fläche (Kanal 1)", "Pad (channel 1)"), an(BEGL.pad), W("gehaltene Akkorde", "held chords")) +
      z("bass", "· " + W("Bass (Kanal 2)", "Bass (channel 2)"), an(BEGL.bass), W("Grundton eine Oktave tiefer", "root an octave down")) +
      z("glocken", "· " + W("Glocken/Arpeggio (Kanal 3)", "Bells/arpeggio (channel 3)"), an(BEGL.glocken), W("Akkordtöne auf den Schlägen – je mehr los ist, desto mehr", "chord tones on beats – busier when busy")) +
      z("drone", "· " + W("Bordun (Kanal 4)", "Drone (channel 4)"), an(BEGL.drone), W("Grundton + Quinte der Handpan-Tonart", "root + fifth of the handpan key")) +
      z("gm", "🎼 " + W("Klänge je Stimmung wechseln", "Switch sounds per mood"), an(BEGL.gm), W("sendet General-MIDI-Programme (FluidSynth mit GM-Soundfont)", "sends General MIDI programs (FluidSynth GM soundfont)")) +
      '<button type="button" data-zm="b:ideen">🎻 ' + W("Ensembles & Klangideen", "Ensembles & sound ideas") + "<small>" + W("welche Synths zu welcher Stimmung passen", "which synths fit which mood") + "</small></button>" +
      '<button type="button" data-zm="b:test">🔔 ' + W("Testakkord senden", "Send test chord") + '</button><button type="button" data-zm="b:aus">🔇 ' + W("Alle Noten aus", "All notes off") + "</button>" +
      '<button type="button" data-zm="zu">✕ ' + W("Fertig", "Done") + "</button></div>" +
      '<p class="hinweis">' + W("Im Zynthian: „Zusammen mit Zynthian“ starten, Ketten auf MIDI-Kanal 1–4 anlegen, „Imres Begleitung“ als MIDI-Eingang aktivieren. Externe Synths am USB bekommen die Noten automatisch.", "In Zynthian: start “Together with Zynthian”, create chains on MIDI ch. 1–4, enable “Imres Begleitung” as MIDI input. USB synths get the notes automatically.") + "</p>";
    const m = menue(h, a); menueArt = "begl"; if (fokusK) { const b = m.querySelector('[data-zm="b:' + fokusK + '"]'); if (b) fokusSetzen(b); }
  }
  function beglIdeen() {
    const zeile = E => "<div style=\"grid-column:1/-1\"><b style=\"min-width:0\">" + E.name + "</b></div>" +
      [["pad", "1 " + W("Fläche", "Pad")], ["bass", "2 Bass"], ["glocken", "3 " + W("Glocken", "Bells")], ["drone", "4 " + W("Bordun", "Drone")]].map(([r, t]) => "<div><b>" + t + "</b><span>" + E[r][1] + " (GM " + (E[r][0] + 1) + ")</span></div>").join("") +
      "<div style=\"grid-column:1/-1;color:#a89f8f\">" + E.ideen + "</div>";
    menue("<h3>🎻 " + W("Ensembles", "Ensembles") + '</h3><div class="zyn-hilfe">' + Object.values(ENSEMBLES).map(zeile).join("") + '</div><div class="reihe drei"><button type="button" data-zm="zu">✕ ' + W("Schließen", "Close") + "</button></div>", { zu: () => beglMenue() });
    menueArt = "hilfe";
  }

  /* Einstellungen (selten gebraucht) */
  function zpEinstellungen(fokusK) {
    const zz = (id, t, w, u) => '<button type="button" data-zm="' + id + '">' + t + (w != null ? "<b>" + w + "</b>" : "") + (u ? "<small>" + u + "</small>" : "") + "</button>";
    const neu = id => () => { zpEinstellungen(id); };
    const a = { zu: menueZu, hilfe: zpHilfe, beleg: () => belegMenue(),
      leistung: () => { const l = ["voll", "leicht", "spar"], n = l[(l.indexOf(leistung()) + 1) % 3]; schreib("imres-lw-leicht", n === "voll" ? "0" : "1"); schreib("imres-lw-spar", n === "spar" ? "1" : "0"); schreib("imres-zp-leistung-gewaehlt", "1"); zeige("⚡ " + LEISTUNG_NAME[n], null, W("lädt neu …", "reloading …")); setTimeout(() => location.reload(), 500); },
      hell: () => { const v = LED_STUFEN[(LED_STUFEN.indexOf(ledHell()) + 1) % LED_STUFEN.length]; schreib("imres-zp-hell", String(v)); ledMerk = ""; ledsMelden(); neu("hell")(); },
      looplen: () => { const l = [1, 2, 4, 8], v = l[(l.indexOf(loopTakte()) + 1) % l.length]; schreib("imres-zp-looplen", String(v)); neu("looplen")(); },
      ruhe: () => { const v = RUHE_STUFEN[(RUHE_STUFEN.indexOf(ruheSek()) + 1) % RUHE_STUFEN.length]; schreib("imres-zp-ruhe", String(v)); neu("ruhe")(); },
      bild: () => { schreib("imres-zp-bild", bildHinten() ? "0" : "1"); document.documentElement.classList.toggle("zyn-bb", bildHinten() && SEITE === "buehne"); neu("bild")(); } };
    const m = menue("<h3>🛠 " + W("Einstellungen", "Settings") + '</h3><div class="reihe zyn-opt">' +
      zz("leistung", "⚡ " + W("Leistung: ", "Performance: "), LEISTUNG_NAME[leistung()], W("bei Rucklern sparsamer stellen – lädt neu", "go lighter if it stutters – reloads")) +
      zz("hell", "💡 " + W("Tastenlicht: ", "Button light: "), Math.round(ledHell() * 100) + " %") +
      zz("ruhe", "💤 " + W("Bühnenbild nach: ", "Stage view after: "), ruheSek() ? ruheSek() + " s" : W("nie", "never"), W("ohne Eingabe spielt die Band im Bild", "with no input the band plays on screen")) +
      zz("bild", "🖼 " + W("Bühnenbild hinter dem Pult: ", "Stage behind the console: "), bildHinten() ? W("an", "on") : W("aus", "off"), W("kostet Rechenzeit", "costs processing time")) +
      zz("looplen", "⟳ " + W("Regler-Loop: ", "Knob loop: "), loopTakte() + W(" Takte", " bars"), W("ALT + Regler drücken: aufnehmen / Loop aus", "ALT + push knob: record / loop off")) +
      zz("beleg", "🎛 " + W("Belegung ändern", "Change mapping"), null, W("Drehregler, Effekte und Tasten selbst belegen", "assign knobs, effects and buttons")) +
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
  function beatPad() {
    const P = BP(), info = beatsInfo(); if (!P || !info) return; const sp = beatSpur(info), wert = sp.art === "an" ? 0 : (BC.ton[sp.id] || 0);
    const hit = P.beatsAnschlag(sp.id, wert);
    if (BC.liveRec && hit && info.laeuft) { const d = P.beatsDaten(hit.teil); if (d && d[sp.id] && d[sp.id][hit.schritt] < 0) P.beatsSetzen(hit.teil, sp.id, hit.schritt, wert); }
  }
  /* Tasten auf der Beats-Seite (true = erledigt) */
  function beatsTaste(name) {
    if (zpSeite !== "beats") return false;
    const info = beatsInfo(); if (!info) return false; const n = info.takt;
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
      case "PAD": return true; /* läuft über „Drücken“ – ohne Verzögerung */
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
      (BC.liveRec ? '<span style="color:#ff4a3a">⏺ LIVE</span>' : "") + "</div>";
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
  function beatsHTML() {
    const P = BP(), info = beatsInfo(); if (!P || !info) return '<div class="zb-leer">⏳ ' + W("Bühne lädt …", "Stage loading …") + "</div>";
    const t = beatsTeil(info), dat = P.beatsDaten(t) || {}, n = info.takt;
    let h = '<div class="zb" style="--n:' + n + '">';
    BEAT_REIHE.forEach((id, r) => {
      const sp = info.spuren.find(x => x.id === id); if (!sp) return; const d = dat[id] || [];
      const hk = (P.huelle && P.huelle()[id]) || {};
      h += '<button type="button" class="zb-name' + (r === BC.r ? " cur" : "") + (sp.stumm ? " stumm" : "") + '" data-zb-r="' + r + '">' + BEAT_SYM[id] + " " + BEAT_NAME[id] + (hk.a || hk.d ? '<i class="zb-h">◢</i>' : "") + "</button>";
      for (let i = 0; i < n; i++) {
        const v = d[i], an = v >= 0, txt = an && sp.art !== "an" ? v + 1 : "";
        h += '<button type="button" class="zb-z' + (an ? " an" : "") + (i % 4 === 0 ? " eins" : "") + (r === BC.r && i === BC.s ? " cur" : "") + (sp.stumm ? " stumm" : "") + '" data-zb-r="' + r + '" data-zb-s="' + i + '" style="' + (an && sp.art !== "an" ? "--h:" + (.35 + .65 * v / Math.max(1, sp.zeilen - 1)) : "") + '">' + txt + "</button>";
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
  }, 90);
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
      return '<button type="button" class="zp-k' + (it.an ? " an" : "") + (it.vor ? " vor" : "") + (it.fav ? " fav" : "") + (i === zpCursor ? " cur" : "") + '" data-zp-k="' + i + '">' + f + (it.fav ? '<span class="zp-stern">★</span>' : "") + (it.still ? '<span class="zp-still" title="' + W("mit Stille", "brings a hush") + '">🤫</span>' : "") + '<span class="zp-s">' + esc2(it.sym || d.sym) + '</span><span class="zp-n">' + esc2(it.name) + "</span>" + (it.vor ? '<span class="zp-v">' + W("am Taktende", "at bar end") + "</span>" : "") + "</button>"; }).join("");
    const gr = blatt[0] ? blatt[0].gruppe : (SEITE === "buehne" && !(window.ImresPult && window.ImresPult.listen) ? "⏳ " + W("Bühne lädt …", "Stage loading …") + " " + Math.round(performance.now() / 1000) + " s" : "");
    const kopf = '<div class="zp-gruppe"><span data-zp-gruppe="1">' + esc2(gr || d.name) + (zpGruppen.length > 1 ? ' <small>▸ ' + W("ALT + ▲ ▼: andere Gruppe", "ALT + ▲ ▼: other group") + "</small>" : "") + "</span>" + (n > 1 ? '<span class="zp-blatt"><button type="button" data-zp-blatt="-1">◀</button>' + (n <= 9 ? Array.from({ length: n }, (_, i) => "<i" + (i === bi ? ' class="an"' : "") + "></i>").join("") : "<em>" + (bi + 1) + " / " + n + "</em>") + '<button type="button" data-zp-blatt="1">▶</button></span>' : "") + "</div>";
    const bk = SEITE === "welten" ? (bank ? "B" : "A") : bankName(), bf = BANK_FARBE[bk] || BANK_FARBE.A;
    const regler = zpRegler().map((r, i) => { const w = zpWert(r);
      const L = LOOPS[loopSchluessel(r)], lz = L ? (L.phase === "spielt" ? ' <em class="lp">⟳</em>' : ' <em class="rec">●</em>') : "";
      return '<div class="zp-r" data-zp-r="' + i + '"><span class="zp-rn">' + esc2(r.name) + lz + '</span><i><b style="width:' + Math.round(w.anteil * 100) + '%"></b></i><span class="zp-rv"><span>' + esc2(w.text) + "</span><small>" + (r.drucktext || DRUCK_TEXT[r.druck] || "") + "</small></span></div>"; }).join("");
    const t = (k, txt, farbe) => '<button type="button" data-zp-taste="' + k + '" style="--c:' + (farbe || "#e0a046") + '"><i></i><b>' + k + "</b> " + txt + "</button>";
    const kurz = k => { const id = ZB.tasten[k]; if (!id || id === "nichts") return ""; if (SEITE === "welten" && { play: "▶/❚❚", passiert: "🎭", stille: "⏳" }[id]) return t(k, { play: "▶/❚❚", passiert: "🎭", stille: "⏳" }[id], aktFarbe(id)); return t(k, (ZP_AKT[id] || ZP_AKT.nichts)[1], aktFarbe(id)); };
    const fuss = ["PLAY", "STOP", "PAD", "REC", "TEMPO", "CTRL"].map(k => zpSeite === "beats" && k === "PAD" ? t("PAD", "live", "#ff9a40") : zpSeite === "beats" && k === "REC" ? t("REC", BC.liveRec ? "⏺ LIVE" : "⏺", "#ff1a30") : kurz(k)).join("") + t("MIXER", bk, bf) + t("MENU", "☰", "#ffcf50");
    const html = '<div class="zp-kopf">' + tabs + '<span class="zp-status">' + status + "</span></div>" +
      (zpSeite === "beats" ? '<div class="zp-mitte" style="--f:' + d.farbe + '">' + beatsKopf() + beatsHTML() + "</div>" : '<div class="zp-mitte" style="--f:' + d.farbe + '">' + kopf + '<div class="zp-kacheln">' + kach + "</div></div>") +
      '<div class="zp-regler" style="--b:' + bf + '"><div class="zp-bank">⟲ ' + W("Bank ", "Bank ") + bk + (SEITE !== "welten" && !(zpSeite === "beats" && bank < 2) ? '<small>' + W("drücken+drehen ⇄", "push+turn ⇄") + "</small>" : "") + "</div>" + regler + "</div>" + '<div class="zp-fuss">' + fuss + "</div>";
    if (html === zpMerk || (zpZeiger && !sofort)) return;
    zpMerk = html; zpEl.innerHTML = html;
  }
  const dimm = (h, f) => { const n = parseInt(String(h).slice(1, 7), 16) || 0, c = x => Math.round(x * f).toString(16).padStart(2, "0"); return "#" + c((n >> 16) & 255) + c((n >> 8) & 255) + c(n & 255); };
  const ALT_FARBE = "#c040ff";
  /* Farbe einer Tasten-Aktion – dieselbe wie auf dem Bildschirm */
  function aktFarbe(id) {
    const i = ZP_SEITEN.findIndex(x => x.id === zpSeite);
    if (id === "seite_vor") return ZP_SEITEN[(i + 1) % ZP_SEITEN.length].led;
    if (id === "seite_zurueck") return ZP_SEITEN[(i + ZP_SEITEN.length - 1) % ZP_SEITEN.length].led;
    if (id === "bank") return BANK_FARBE[BANKEN[(bank + 1) % BANKEN.length]];
    return { play: "#30ff70", stop: "#ff1a30", passiert: "#ff6a10", stille: "#fff4e0", neubesetzen: "#ffc830", sprechen: "#f0dca0", aufnahme: "#ff1a30", takt: "#d8d0c0", hg: "#80ffb0", fx_aus: "#fff8ec",
      filterzu: BANK_FARBE.FX, filterhoch: BANK_FARBE.FX, echowurf: BANK_FARBE.FX, stotter: BANK_FARBE.GLITCH, rueckwaerts: BANK_FARBE.GLITCH, bandstop: BANK_FARBE.GLITCH, crushhalt: BANK_FARBE.GLITCH, tap: "#ffc830", autopilot: "#c040ff", set_weiter: "#ffe0a0", set_zurueck: "#ffe0a0" }[id] || "#000000";
  }
  function aktAktiv(id) {
    const z = pz() || {};
    if (id === "play") return SEITE === "welten" ? !!$(".welt.an") : !!z.laeuft;
    if (id === "aufnahme") return aufnahmeAn;
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
  function zpRuheAn() {
    if (zpRuhe || $(".zyn-menue")) return; zpRuhe = true; document.documentElement.classList.add("zyn-ruhe"); zpRuheZeichnen(); ledsMelden();
  }
  function zpRuheAus() { zpRuhe = false; document.documentElement.classList.remove("zyn-ruhe"); if (zpRuheEl) zpRuheEl.innerHTML = ""; zpZeichnen(true); ledsMelden(); }
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
html.zyn-pult body > *:not(.zp, .zp-ruhe, .zyn-osd, .zyn-menue, script, style) { content-visibility: hidden; }
html.zyn-pult.zyn-bb body > *:has(.lw-buehne), html.zyn-pult.zyn-ruhe body > *:has(.lw-buehne) { content-visibility: visible; }
html.zyn-pult .zyn-leiste { display: none !important; }
/* Bühnenbild: hinter dem Pult (gedimmt) und als Ruhebild */
/* alles andere der Webseite unsichtbar machen – nur die Bühne (und Pult/Ruhebild) malen */
html.zyn-pult.zyn-bb body *, html.zyn-pult.zyn-ruhe body * { visibility: hidden !important; }
html.zyn-pult.zyn-pult body .lw-buehne, html.zyn-pult.zyn-pult body .lw-buehne *,
html.zyn-pult.zyn-pult body .zp, html.zyn-pult.zyn-pult body .zp *, html.zyn-pult.zyn-pult body .zp-ruhe, html.zyn-pult.zyn-pult body .zp-ruhe *,
html.zyn-pult.zyn-pult body .zyn-osd, html.zyn-pult.zyn-pult body .zyn-osd *, html.zyn-pult.zyn-pult body .zyn-menue, html.zyn-pult.zyn-pult body .zyn-menue * { visibility: visible !important; }
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
.zb-z.cur { outline: 2px solid #f4c45a; outline-offset: 1px; }
.zb-vars { display: flex; align-items: center; gap: 4px; color: #a99d8c; font-size: 11px; }
.zb-var { width: 26px; height: 22px; border-radius: 5px; border: 1px solid #5a4a6a !important; color: #c8bba6 !important; font-size: 13px !important; }
.zb-var.voll { border-color: #c040ff !important; } .zb-var.an { background: #c040ff !important; color: #140e06 !important; } .zb-var.vor { animation: zpblink .6s steps(2) infinite; }
.zb-leer { display: flex; align-items: center; justify-content: center; color: #c8bba6; }
.zp-blatt em { font-style: normal; font-size: 12px; color: #c8bba6; min-width: 46px; text-align: center; }
.zp-gruppe small { text-transform: none; letter-spacing: 0; color: #776d60; font-size: 10.5px; margin-left: 6px; }
.zp-blatt i { width: 7px; height: 7px; border-radius: 50%; background: #3a2f48; } .zp-blatt i.an { background: var(--f); }
.zp-kacheln { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); grid-template-rows: repeat(2, minmax(0, 1fr)); gap: 7px; min-height: 0; }
.zp-k { position: relative; display: flex !important; flex-direction: column; justify-content: flex-end; align-items: flex-start; gap: 2px; padding: 8px 9px !important; border-radius: 12px; border: 2px solid #3a2f48 !important; background: #1d1726 !important; text-align: left; min-width: 0; overflow: hidden; }
.zp-k.leer { border-style: dashed !important; opacity: .35; }
.zp-k .zp-f { position: absolute; top: 5px; right: 7px; font-size: 11.5px; font-weight: 700; color: #a99d8c; border: 1px solid #5a5060; border-radius: 4px; padding: 1px 5px; }
.zp-k .zp-f.alt { color: #e0a0ff; border-color: #8040b0; }
.zp-k .zp-stern { position: absolute; top: 3px; right: 40px; font-size: 16px; color: #ffd75a; }
.zp-k .zp-still { position: absolute; left: 52px; top: 10px; font-size: 17px; opacity: .9; }
.zp-k.fav { border-color: color-mix(in srgb, var(--f) 55%, #3a2f48) !important; }
.zp-k .zp-s { font-size: 34px; line-height: 1; margin-bottom: auto; padding-top: 4px; }
.zp-k .zp-n { font-size: 18px; line-height: 1.15; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.zp-k .zp-v { font-size: 10px; color: var(--f); }
.zp-k.an { border-color: var(--f) !important; background: color-mix(in srgb, var(--f) 22%, #1d1726) !important; box-shadow: 0 0 14px color-mix(in srgb, var(--f) 40%, transparent); }
.zp-k.vor { border-style: dashed !important; border-color: var(--f) !important; animation: zpblink 1s steps(2) infinite; }
.zp-k.cur { outline: 3px solid #f4c45a; outline-offset: 1px; }
.zp-k:active { transform: scale(.97); }
@keyframes zpblink { 50% { border-color: #3a2f48 !important; } }
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
    zpEl.addEventListener("pointerdown", e => { zpLetzte = Date.now(); zpZeiger = true; const k = e.target.closest("[data-zp-k]"); if (!k) return; const i = +k.dataset.zpK; clearTimeout(favT); favT = setTimeout(() => { favUnterdrueck = true; zpFavUmschalten(i); }, 1500); });
    const zeigerLos = () => { zpZeiger = false; clearTimeout(favT); };
    zpEl.addEventListener("pointerup", zeigerLos); zpEl.addEventListener("pointercancel", zeigerLos); zpEl.addEventListener("pointerleave", zeigerLos);
    zpEl.addEventListener("contextmenu", e => e.preventDefault());
    zpEl.addEventListener("click", e => {
      if (favUnterdrueck) { favUnterdrueck = false; return; }
      const tb = e.target.closest("[data-zp-tab]"); if (tb) { zpSeiteSetzen(tb.dataset.zpTab); return; }
      const zv = e.target.closest("[data-zb-var]"); if (zv) { varWechseln(+zv.dataset.zbVar); return; }
      const zb = e.target.closest("[data-zb-r]");
      if (zb) { BC.r = +zb.dataset.zbR; if (zb.dataset.zbS != null) { BC.s = +zb.dataset.zbS; beatUmschalten(BC.s); } else { const info = beatsInfo(), sp = info && beatSpur(info); if (sp) BP().beatsAnschlag(sp.id, sp.art === "an" ? 0 : (BC.ton[sp.id] || 0)); zpZeichnen(true); } return; }
      const k = e.target.closest("[data-zp-k]"); if (k) { zpCursor = -1; zpAusloesen(+k.dataset.zpK); return; }
      if (e.target.closest("[data-zp-gruppe]")) { zpGruppeSchritt(1); return; }
      const bl = e.target.closest("[data-zp-blatt]"); if (bl) { zpBlaettern(+bl.dataset.zpBlatt); return; }
      const ta = e.target.closest("[data-zp-taste]"); if (ta) { taste(ta.dataset.zpTaste, "kurz"); ledsMelden(); return; }
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
  window.ImresZyn = { messer: MESSER, taste, dreh, midi, modusSetzen, optSetzen, get modus() { return modus; }, get opt() { return Object.assign({}, OPT); } };
})();
