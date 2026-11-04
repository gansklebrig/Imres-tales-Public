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
  let aktiv = false; try { aktiv = sessionStorage.getItem("imres-zyn") === "1"; } catch (_) {}
  if (!aktiv && !Q.has("zyn")) return;
  if (window.__imresZyn) return; window.__imresZyn = true;

  const EN = (() => { try { return localStorage.getItem("imres-lang") === "en"; } catch (_) { return false; } })();
  const W = (de, en) => EN ? en : de;
  const SEITE = /ambient\.html$/.test(location.pathname) ? "welten" : "buehne";
  const lies = (k, d) => { try { const v = localStorage.getItem(k); return v == null ? d : v; } catch (_) { return d; } };
  const schreib = (k, v) => { try { localStorage.setItem(k, v); } catch (_) {} };

  /* ---------- Modi ---------- */
  const MODI = {
    welten: { sym: "🌿", name: W("Klangwelten", "Soundscapes"), sub: W("Reine Geräuschkulissen – ohne Musik", "Pure ambience – no music"), seite: "welten", farbe: "#3fbf6a" },
    buehne: { sym: "🎻", name: W("Bühne", "Stage"), sub: W("Musik und Kulisse zusammen", "Music and backdrop together"), seite: "buehne", farbe: "#e0a046" },
    klang: { sym: "🌲", name: W("Bühne: nur Kulisse", "Stage: backdrop only"), sub: W("Orte, Geräusche, Momente – keine Musik", "Places, sounds, moments – no music"), seite: "buehne", farbe: "#3fb0b0" },
    musik: { sym: "🎵", name: W("Bühne: nur Musik", "Stage: music only"), sub: W("Stimmungen und Band – keine Kulisse", "Moods and band – no backdrop"), seite: "buehne", farbe: "#d05a8a" }
  };
  const MODUS_REIHE = ["welten", "buehne", "klang", "musik"];
  let modus = lies("imres-zyn-modus", SEITE === "welten" ? "welten" : "buehne");
  if (!MODI[modus]) modus = SEITE === "welten" ? "welten" : "buehne";
  const ADRESSE = { welten: "/ambient.html?zyn=1", buehne: "/index.html?zyn=1#buehne" };
  if (MODI[modus].seite !== SEITE) { location.replace(ADRESSE[MODI[modus].seite]); return; }
  document.documentElement.classList.add("zyn", "zyn-" + SEITE, "zyn-m-" + modus);

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
  let bank = 0, alt = false, tempoMidi = null, folgtTakt = lies("imres-zyn-takt", "1") === "1";
  function leisteZeichnen() {
    leiste.innerHTML = "<span>" + MODI[modus].sym + " " + MODI[modus].name + "</span>" + '<span class="bank" title="MIXER">⟲ ' + (bank ? "B" : "A") + "</span>" +
      (tempoMidi ? "<span>⏱ " + Math.round(tempoMidi) + (folgtTakt && SEITE === "buehne" ? " ⇄" : "") + "</span>" : "") + (alt ? "<span>ALT</span>" : "");
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
  const REGLER = () => (SEITE === "welten" ? W_REGLER : B_REGLER)[bank];
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
    a.system = systemMenue; a.hilfe = hilfe;
    menue("<h3>" + W("Was soll klingen?", "What should play?") + '</h3><div class="reihe">' + MODUS_REIHE.map(knopf).join("") + "</div>" +
      '<div class="reihe drei"><button type="button" data-zm="hilfe">❔ ' + W("Tastenbelegung", "Button map") + '</button><button type="button" data-zm="system">⚙ ' + W("System", "System") + "<small>" + W("Zynthian, Neustart, Aus", "Zynthian, restart, off") + '</small></button><button type="button" data-zm="zu">✕ ' + W("Schließen", "Close") + "</button></div>" +
      '<p class="hinweis">' + W("F1–F4 wählen direkt · Pfeile + SEL · BACK schließt · MENU lang: System", "F1–F4 pick directly · arrows + SEL · BACK closes · hold MENU: system") + "</p>", Object.assign(a, { zu: menueZu }));
    menueArt = "modus";
  }
  let menueArt = null;
  function systemMenue() {
    const post = aktion => fetch("/zyn/system", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ aktion }) }).catch(() => {});
    menue("<h3>⚙ " + W("System", "System") + '</h3><div class="reihe">' +
      '<button type="button" data-zm="zyn">🎛 ' + W("Zurück zum Zynthian", "Back to Zynthian") + "<small>" + W("Die normale Zynthian-Oberfläche startet", "Starts the normal Zynthian interface") + "</small></button>" +
      '<button type="button" data-zm="takt">⏱ ' + W("MIDI-Takt folgen: ", "Follow MIDI clock: ") + (folgtTakt ? W("an", "on") : W("aus", "off")) + "<small>" + W("Tempo der Bühne folgt z. B. der TR-8S", "Stage tempo follows e.g. a TR-8S") + "</small></button>" +
      '<button type="button" data-zm="neu">🔄 ' + W("Seite neu laden", "Reload page") + "</button>" +
      '<button type="button" data-zm="neustart">↻ ' + W("Zynthian neu starten", "Restart Zynthian") + "</button>" +
      '<button type="button" data-zm="aus">⏻ ' + W("Ausschalten", "Shut down") + "<small>" + W("Danach den Strom trennen", "Then unplug power") + "</small></button>" +
      '<button type="button" data-zm="zu">✕ ' + W("Schließen", "Close") + "</button></div>", {
      zyn: () => { zeige("🎛 " + W("Zynthian startet …", "Zynthian is starting …")); post("zynthian"); },
      takt: () => { folgtTakt = !folgtTakt; schreib("imres-zyn-takt", folgtTakt ? "1" : "0"); leisteZeichnen(); systemMenue(); },
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
      ["PAD", W("Etwas passiert", "Something happens")], ["REC", W("Stille (alle halten den Atem an)", "Silence")], ["TEMPO", W("🎲 Neu besetzen", "🎲 Re-cast")]
    ];
    const allg = [["MENU", W("Modus wählen (lang: System)", "Choose mode (hold: system)")], ["MIXER", W("Reglerbank A ↔ B", "Knob bank A ↔ B")], ["ALT", W("gedrückt halten = zweite Belegung", "hold = second layer")],
      ["◀ ▲ ▼ ▶", W("Fokus über den Bildschirm", "Move focus on screen")], ["SEL", W("Antippen", "Tap")], ["BACK", W("Zurück / schließen", "Back / close")],
      [W("Regler 1–4", "Knobs 1–4"), REGLER().map(r => r.name).join(" · ")], [W("Regler drücken", "Push knob"), W("1: stumm/an · 2: Kulisse/Szenen · 3/4: Mitte", "1: mute · 2: backdrop · 3/4: centre")],
      ["MIDI", W("Clock → Tempo · Start/Stop → Musik · Noten 36–39 → F1–F4 · CC 20–23 → Regler", "Clock → tempo · Start/Stop → music · notes 36–39 → F1–F4 · CC 20–23 → knobs")]];
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
    if (name === "ALT") { if (art === "druck") alt = true; else if (art === "los") alt = false; leisteZeichnen(); ledsMelden(); return; }
    if (art === "druck" || art === "los") return;
    const lang = art === "lang";
    const m = $(".zyn-menue");
    if (m) {
      if (name === "BACK" || (name === "MENU" && !lang)) { menueZu(); return; }
      if (/^F[1-4]$/.test(name) && menueArt === "modus") { modusSetzen(MODUS_REIHE[+name[1] - 1]); return; }
      if (["UP", "DOWN", "LEFT", "RIGHT"].includes(name)) { bewegen(name); return; }
      if (name === "SEL") { auswaehlen(); return; }
    }
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
    if (fokusRegler && nr === 3 && document.contains(fokusRegler)) {
      const el = fokusRegler, st = +(el.step || 1) || 1, lo = +el.min || 0, hi = +(el.max || 100);
      el.value = String(Math.max(lo, Math.min(hi, +el.value + d * st))); el.dispatchEvent(new Event("input", { bubbles: true })); el.dispatchEvent(new Event("change", { bubbles: true }));
      zeige(kurzName(el.closest("label") || el) + " · " + el.value, proz(+el.value, lo, hi)); return;
    }
    if ($(".zyn-menue")) { bewegen(d > 0 ? "DOWN" : "UP"); return; }
    const r = REGLER()[nr]; if (r) stellRegler(r, d);
  }

  /* ---------- MIDI ---------- */
  function midi(e) {
    if (e.art === "tempo") {
      tempoMidi = e.bpm; leisteZeichnen();
      if (folgtTakt && SEITE === "buehne" && window.ImresPult && window.ImresPult.tempo) {
        const b = Math.round(e.bpm), z = pz(); if (z && Math.abs(b - z.tempo) >= 1) window.ImresPult.tempo(b);
      }
      return;
    }
    if (e.art === "start") { const z = pz(); if (SEITE === "buehne" && z && !z.laeuft && modus !== "klang") musikSpielen(); else if (SEITE === "welten") { const s = $("#spielen"); if (s && !/❚|⏸/.test(s.textContent)) klick(s); } return; }
    if (e.art === "stop") { const z = pz(); if (SEITE === "buehne" && z && z.laeuft) musikSpielen(); return; }
    if (e.art === "note" && e.note >= 36 && e.note <= 43) { taste("F" + (((e.note - 36) % 4) + 1), "kurz"); return; }
    if (e.art === "cc" && e.cc >= 20 && e.cc <= 23) { const r = REGLER()[e.cc - 20]; if (r) { const v = r.lo + Math.round((e.wert / 127) * (r.hi - r.lo) / r.schritt) * r.schritt; r.setz(v); stellRegler(r, 0); } return; }
    if (e.art === "programm") { if (SEITE === "buehne") { const l = (pz() && pz().stimmungen) || []; const k = l[e.programm % Math.max(1, l.length)]; if (k) { pultKlick("data-vorlage", k); zeige("🎵 " + stimmName(k)); } } else { const l = $$("[data-welt]"); const el = l[e.programm % Math.max(1, l.length)]; if (el) klick(el); } }
  }

  /* ---------- LEDs ---------- */
  let ledMerk = "";
  function ledsMelden() {
    const f = {}, aus = "#000000", schwach = "#2a1a06", gold = "#c88a20", hell = "#ffcf50";
    ["MENU", "MIXER", "CTRL", "ZS3", "ALT", "TEMPO", "PAD", "F1", "F2", "F3", "F4", "REC", "STOP", "PLAY", "BACK", "SEL", "UP", "DOWN", "LEFT", "RIGHT"].forEach(n => { f[n] = aus; });
    f.MENU = MODI[modus].farbe; f.MIXER = bank ? "#8a40c0" : "#2050c0"; f.ALT = alt ? "#c040c0" : "#301030";
    ["UP", "DOWN", "LEFT", "RIGHT", "SEL", "BACK"].forEach(n => { f[n] = "#303030"; });
    const z = pz();
    if ($(".zyn-menue")) { ["F1", "F2", "F3", "F4"].forEach((n, i) => { f[n] = MODI[MODUS_REIHE[i]].farbe; }); f.BACK = "#a04030"; f.SEL = "#40a040"; }
    else if (SEITE === "welten") {
      const l = $$("[data-welt]"); ["F1", "F2", "F3", "F4"].forEach((n, i) => { const el = alt ? $$("[data-aus]")[i] : l[i]; f[n] = el ? (el.classList.contains("an") ? hell : alt ? "#6a2a10" : schwach) : aus; });
      const spielt = !!$(".welt.an"); f.PLAY = spielt ? "#30d050" : "#0c3010"; f.STOP = "#501010"; f.PAD = "#603010"; f.REC = "#301040"; f.ZS3 = schwach; f.CTRL = schwach; f.TEMPO = "#204040";
    } else {
      ["F1", "F2", "F3", "F4"].forEach((n, i) => {
        let k, an = false;
        if (modus === "klang" || (alt && modus === "buehne")) { k = modus === "klang" && alt ? null : platz("kulisse", i); an = !!(k && z && (z.kulisse === k || (k === "wald" && z.kulisse === "waldnacht"))); f[n] = k ? (an ? "#40e0c0" : "#0a3030") : (modus === "klang" && alt ? "#402010" : aus); }
        else { k = platz("stimmung", modus === "musik" && alt ? i + 4 : i); an = !!(k && z && z.stimmung === k); f[n] = k ? (an ? hell : schwach) : aus; }
      });
      f.PLAY = z && (modus === "klang" ? z.kulLaeuft : z.laeuft) ? "#30d050" : "#0c3010"; f.STOP = "#501010"; f.PAD = "#c06010"; f.REC = "#303060"; f.TEMPO = z && z.neuBesetzen ? hell : gold; f.ZS3 = gold; f.CTRL = "#107070";
    }
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
      } catch (err) { console.warn("zyn", err); }
      ledsMelden();
    };
    es.onerror = () => { /* EventSource verbindet sich selbst neu */ };
  }
  verbinden();

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
  leisteZeichnen(); ledsMelden();
  window.ImresZyn = { taste, dreh, midi, modusSetzen, get modus() { return modus; } };
})();
