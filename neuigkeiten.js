/* =====================================================================
   NEUIGKEITEN – dezenter Hinweis „Neu seit deinem letzten Besuch“
   ---------------------------------------------------------------------
   Merkt sich im Browser, welche Einträge man je Bereich schon gesehen
   hat (Kapitel und Abschnitte, Quest-Hinweise, Reisestationen, Helden,
   NSC samt Status, Kreaturen samt Status, Spiele samt Stand).
   Beim allerersten Besuch gilt alles als gesehen – dann erscheint nichts.
   Kommt später etwas dazu, gibt es nur:
   - einen kleinen Glutpunkt am Menüpunkt (oben und in der Handyleiste),
   - ein winziges „neu“ an der Kachel auf der Startseite,
   - eine schmale Zeile über den Kacheln, die man wegklicken kann.
   Sobald man den Bereich öffnet, gilt er als gesehen.
   Die Markierung läuft über <html data-neu="…">, damit sie auch nach
   einem Neuaufbau der Menüs (z. B. Sprachwechsel) erhalten bleibt.
   ===================================================================== */
(function () {
  "use strict";
  const SCHLUESSEL = "imres-neu-gesehen";
  const I = window.INHALT || {};
  const sprache = () => (document.documentElement.lang === "en" ? "en" : "de");
  const esc = s => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  /* Fingerabdrücke: je Bereich eine Liste kurzer Kennungen (immer aus den deutschen Inhalten) */
  function kennungen() {
    const k = {};
    k.chronik = [];
    (I.kapitel || []).forEach(kap => {
      k.chronik.push("K" + kap.nummer);
      (kap.absaetze || []).forEach(a => { if (typeof a === "string" && /^##\s/.test(a)) k.chronik.push(kap.nummer + ":" + a.replace(/^##\s*/, "").trim()); });
    });
    const q = I.questtafel || {};
    k.questtafel = (q.karten || []).map(c => "k:" + (c.id || c.titel)).concat((q.notizen || []).map(n => "n:" + String(n.text || "").replace(/<[^>]+>/g, "").slice(0, 40)));
    k.reise = [];
    ((I.reise || {}).karten || []).forEach(c => (c.stationen || []).forEach(s => k.reise.push(s.name)));
    k.gefaehrten = (I.helden || []).map(h => h.id || h.name);
    k.nsc = (I.nsc || []).map(n => n.name + "|" + (n.status || ""));
    k.bestiarium = (I.bestiarium || []).map(b => b.name + "|" + (b.status || ""));
    const S = window.ImresSpielesaal && window.ImresSpielesaal.SPIELE;
    if (S) k.taverne = (Array.isArray(S) ? S : Object.values(S)).map(s => (s.key || s.id || s.hash || s.titel) + "@" + (s.stand || ""));
    Object.keys(k).forEach(b => { if (!k[b].length) delete k[b]; });
    return k;
  }
  const lesen = () => { try { const v = JSON.parse(localStorage.getItem(SCHLUESSEL)); return v && typeof v === "object" && !Array.isArray(v) ? v : null; } catch (e) { return null; } };
  const schreiben = v => { try { localStorage.setItem(SCHLUESSEL, JSON.stringify(v)); } catch (e) {} };

  const jetzt = kennungen();
  let gesehen = lesen();
  if (!gesehen) { gesehen = {}; Object.keys(jetzt).forEach(b => gesehen[b] = jetzt[b]); schreiben(gesehen); }
  /* Bereich, den es beim letzten Besuch noch gar nicht gab, zählt nicht als neu, nur sein Inhalt später */
  Object.keys(jetzt).forEach(b => { if (!gesehen[b]) gesehen[b] = jetzt[b]; });

  function neueBereiche() {
    return Object.keys(jetzt).filter(b => { const alt = new Set(gesehen[b] || []); return jetzt[b].some(x => !alt.has(x)); });
  }
  function alsGesehen(b) {
    if (!jetzt[b]) return;
    gesehen[b] = jetzt[b]; schreiben(gesehen); anzeigen();
  }

  const UNTEN = ["chronik", "gefaehrten", "taverne"]; /* eigene Knöpfe in der Handyleiste, Rest liegt unter „Mehr“ */
  const TX = {
    de: { zeile: "Neu seit deinem letzten Besuch:", weg: "Hinweis ausblenden", neu: "neu" },
    en: { zeile: "New since your last visit:", weg: "Dismiss", neu: "new" }
  };
  let zeileWeg = false;

  function namen(b) {
    const a = document.querySelector('.top nav a[href="#' + b + '"]');
    return a ? a.textContent.replace("🎲", "").trim() : b;
  }
  function anzeigen() {
    const neu = neueBereiche();
    const marken = neu.slice();
    if (neu.some(b => !UNTEN.includes(b))) marken.push("mehr");
    if (marken.length) document.documentElement.setAttribute("data-neu", marken.join(" "));
    else document.documentElement.removeAttribute("data-neu");
    /* Zeile über den Kacheln */
    const kacheln = document.getElementById("kacheln");
    let z = document.querySelector(".neu-zeile");
    if (!neu.length || zeileWeg || !kacheln) { if (z) z.remove(); return; }
    if (!z) { z = document.createElement("p"); z.className = "neu-zeile"; kacheln.before(z); }
    const T = TX[sprache()];
    z.innerHTML = '<span class="neu-glut" aria-hidden="true"></span>' + esc(T.zeile) + " " +
      neu.map(b => '<a href="#' + b + '">' + esc(namen(b)) + "</a>").join('<span class="neu-trenn"> · </span>') +
      '<button type="button" class="neu-weg" aria-label="' + esc(T.weg) + '">×</button>';
  }
  document.addEventListener("click", e => {
    const w = e.target.closest(".neu-weg");
    if (w) { neueBereiche().forEach(b => gesehen[b] = jetzt[b]); schreiben(gesehen); zeileWeg = true; anzeigen(); }
  });

  /* Geöffneter Bereich gilt als gesehen */
  function pruefen() {
    const s = document.querySelector("section.part.aktiv");
    if (s && jetzt[s.id] && !document.body.classList.contains("ansicht-start")) alsGesehen(s.id);
    /* Spiele haben eigene Adressen (#waldlauf …), gehören aber zur Taverne */
  }
  document.querySelectorAll("section.part").forEach(s => new MutationObserver(pruefen).observe(s, { attributes: true, attributeFilter: ["class"] }));
  new MutationObserver(pruefen).observe(document.body, { attributes: true, attributeFilter: ["class"] });

  const css = document.createElement("style");
  css.textContent = `
/* kleiner Glutpunkt an Menüpunkten */
.top nav a { position: relative; }
.handyleiste a, .handyleiste button { position: relative; }
${["chronik", "questtafel", "reise", "gefaehrten", "nsc", "bestiarium", "taverne"].map(b =>
  `html[data-neu~="${b}"] .top nav a[href="#${b}"]::before, html[data-neu~="${b}"] .handyleiste [data-ziel="${b}"]::after, html[data-neu~="${b}"] .hl-raster a[data-ziel="${b}"]::after`).join(",\n")},
html[data-neu~="mehr"] .handyleiste .hl-mehr::after {
  content: ""; position: absolute; width: 6px; height: 6px; border-radius: 50%; background: var(--ember, #e0a046); box-shadow: 0 0 6px rgba(224,160,70,.8); pointer-events: none; }
.top nav a::before { top: -1px; right: -7px; }
.handyleiste a::after, .handyleiste button::after { top: 7px; left: calc(50% + 10px); }
.hl-raster a { position: relative; }
.hl-raster a::after { top: 50%; right: .8rem; margin-top: -3px; }
/* winziges „neu“ an der Kachel */
${["chronik", "questtafel", "reise", "gefaehrten", "nsc", "bestiarium", "taverne"].map(b => `html[data-neu~="${b}"] .kachel.k-${b} .kachel-text b::after`).join(",\n")} {
  content: "neu"; margin-left: .45em; vertical-align: .3em; font-family: inherit; font-size: .55rem; font-weight: 600; letter-spacing: .14em; text-transform: uppercase;
  color: var(--ember, #e0a046); border: 1px solid rgba(224,160,70,.55); padding: 0 .3em; border-radius: 2px; }
${["chronik", "questtafel", "reise", "gefaehrten", "nsc", "bestiarium", "taverne"].map(b => `html[lang="en"][data-neu~="${b}"] .kachel.k-${b} .kachel-text b::after`).join(",\n")} { content: "new"; }
/* schmale Zeile über den Kacheln */
.neu-zeile { display: flex; flex-wrap: wrap; align-items: center; gap: .15rem .35rem; margin: 0 0 .7rem; font-size: .8rem; color: var(--ash, #b9ab95); }
.neu-zeile a { color: var(--vellum); text-decoration: none; border-bottom: 1px dotted rgba(224,160,70,.6); }
.neu-zeile a:hover { color: var(--ember); }
.neu-trenn { color: rgba(185,171,149,.6); }
.neu-glut { width: 6px; height: 6px; border-radius: 50%; background: var(--ember, #e0a046); box-shadow: 0 0 6px rgba(224,160,70,.8); margin-right: .2rem; }
.neu-weg { margin-left: .2rem; border: 0; background: none; color: var(--ash); font-size: 1rem; line-height: 1; padding: .1rem .3rem; cursor: pointer; opacity: .7; }
.neu-weg:hover { opacity: 1; color: var(--ember); }
`;
  document.head.appendChild(css);

  anzeigen();
  pruefen();
  /* Kacheln und Menütexte werden von seiten.js gebaut bzw. bei Sprachwechsel neu gesetzt */
  new MutationObserver(anzeigen).observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });
  setTimeout(anzeigen, 800);
  window.ImresNeu = { neueBereiche, alsGesehen, zuruecksetzen: () => { try { localStorage.removeItem(SCHLUESSEL); } catch (e) {} } };
})();
