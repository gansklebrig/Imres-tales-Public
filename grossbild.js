/* Großansicht für die Tavernenspiele: ein Knopf oben rechts an der Spielkarte
   holt das Spiel in den Vollbildmodus (oder, wo der Browser das nicht kann,
   in eine bildschirmfüllende Ansicht). Die Spielfläche wächst dann so weit,
   wie die Fensterhöhe es erlaubt. */
(function () {
  "use strict";
  const KARTEN = ["waldlauf", "diebesnacht"];
  const TEXT = {
    de: { gross: "Groß", klein: "Verkleinern", grossLang: "Spiel groß anzeigen", kleinLang: "Großansicht verlassen" },
    en: { gross: "Enlarge", klein: "Shrink", grossLang: "Show the game large", kleinLang: "Leave large view" }
  };
  const sprache = () => (document.documentElement.lang || "de").slice(0, 2) === "en" ? "en" : "de";

  const css = document.createElement("style");
  css.textContent = `
.tav-karte.hat-gross { position: relative; }
.tav-gross-knopf {
  position: absolute; top: .7rem; right: .7rem; z-index: 3; display: inline-flex; align-items: center; gap: .4rem;
  padding: .35rem .75rem; border: 1px solid var(--line); background: rgba(9,8,15,.55); color: var(--ember);
  font: inherit; font-size: .85rem; cursor: pointer; -webkit-tap-highlight-color: transparent;
}
.tav-gross-knopf:hover, .tav-gross-knopf:focus-visible { border-color: var(--ember); background: var(--ember); color: var(--night); }
.tav-gross-knopf .sym { font-size: 1.05rem; line-height: 1; }
.tav-karte.tav-gross {
  position: fixed; inset: 0; z-index: 1000; margin: 0; max-width: none; width: 100%; height: 100%;
  overflow-y: auto; overscroll-behavior: contain; display: flex; flex-direction: column; align-items: center;
  padding: .8rem clamp(.6rem, 2vw, 1.2rem) 1.5rem; gap: .6rem;
  background: radial-gradient(ellipse at 50% 0%, rgba(224,160,70,.08), transparent 60%), var(--night, #0b0a12);
}
.tav-karte.tav-gross:fullscreen { background: radial-gradient(ellipse at 50% 0%, rgba(224,160,70,.08), transparent 60%), var(--night, #0b0a12); }
.tav-karte.tav-gross::backdrop { background: #0b0a12; }
.tav-gross > .label, .tav-gross > h3, .tav-gross > .tav-info { display: none; }
.tav-gross > * { flex-shrink: 0; }
.tav-gross > :not(.tav-gross-knopf):not(.wl-buehne):not(.dn-buehne) { width: 100%; }
.tav-gross .wl-buehne, .tav-gross .dn-buehne { width: var(--gross-b); max-width: none; height: auto; }
.tav-gross .tav-gross-knopf { width: auto; }
.tav-gross .tav-gross-knopf { position: fixed; top: .6rem; right: .8rem; }
.tav-gross .wl-steuerung, .tav-gross .dn-steuerung { text-align: center; margin: 0; padding-right: 7.5rem; padding-left: 7.5rem; min-height: 2rem; }
.waldlauf.tav-gross { --gross-b: min(100%, calc((100vh - 4.2rem) * .8)); }
.diebesnacht.tav-gross { --gross-b: min(100%, calc((100vh - 4.2rem) * ${400 / 560})); }
.tav-gross .wl-liste, .tav-gross .wl-fuss, .tav-gross .dn-liste, .tav-gross .dn-fuss { max-width: var(--gross-b); justify-self: center; }
@media (max-width: 600px) {
  .tav-gross .wl-steuerung, .tav-gross .dn-steuerung { padding: 2.4rem 0 0; }
  .waldlauf.tav-gross { --gross-b: min(100%, calc((100vh - 6.5rem) * .8)); }
  .diebesnacht.tav-gross { --gross-b: min(100%, calc((100vh - 6.5rem) * ${400 / 560})); }
}
html.tav-gross-offen, html.tav-gross-offen body { overflow: hidden; }
`;
  document.head.appendChild(css);

  let offen = null;
  const vollbildEl = () => document.fullscreenElement || document.webkitFullscreenElement || null;

  function beschriften(k) {
    const knopf = k.querySelector(":scope > .tav-gross-knopf"); if (!knopf) return;
    const tx = TEXT[sprache()], gross = k.classList.contains("tav-gross");
    knopf.innerHTML = '<span class="sym" aria-hidden="true">' + (gross ? "⤡" : "⤢") + '</span>' + (gross ? tx.klein : tx.gross);
    knopf.setAttribute("aria-label", gross ? tx.kleinLang : tx.grossLang);
    knopf.setAttribute("aria-pressed", gross ? "true" : "false");
  }

  function oeffnen(k) {
    if (offen) schliessen(offen);
    offen = k;
    k.classList.add("tav-gross");
    document.documentElement.classList.add("tav-gross-offen");
    beschriften(k);
    const anfrage = k.requestFullscreen || k.webkitRequestFullscreen;
    if (anfrage) { try { const p = anfrage.call(k); if (p && p.catch) p.catch(() => {}); } catch (e) { /* bleibt in der Fensteransicht */ } }
    k.scrollTop = 0;
  }

  function schliessen(k) {
    if (!k || !k.classList.contains("tav-gross")) return;
    k.classList.remove("tav-gross");
    document.documentElement.classList.remove("tav-gross-offen");
    if (offen === k) offen = null;
    beschriften(k);
    if (vollbildEl() === k) {
      const raus = document.exitFullscreen || document.webkitExitFullscreen;
      if (raus) { try { const p = raus.call(document); if (p && p.catch) p.catch(() => {}); } catch (e) { /* egal */ } }
    }
    k.scrollIntoView({ block: "start" });
  }

  /* Verlässt jemand das Vollbild mit Esc, geht auch die Großansicht zu */
  function vollbildWechsel() { if (offen && vollbildEl() !== offen) schliessen(offen); }
  document.addEventListener("fullscreenchange", vollbildWechsel);
  document.addEventListener("webkitfullscreenchange", vollbildWechsel);

  KARTEN.forEach(id => {
    const k = document.getElementById(id); if (!k || k.hidden) return;
    k.classList.add("hat-gross");
    const knopf = document.createElement("button");
    knopf.type = "button"; knopf.className = "tav-gross-knopf";
    knopf.addEventListener("click", () => { if (k.classList.contains("tav-gross")) schliessen(k); else oeffnen(k); });
    k.appendChild(knopf);
    beschriften(k);
    /* Falls das Spiel seine Karte neu aufbaut, kommt der Knopf zurück */
    new MutationObserver(() => {
      if (!k.querySelector(":scope > .tav-gross-knopf")) { k.appendChild(knopf); beschriften(k); }
    }).observe(k, { childList: true });
  });

  new MutationObserver(() => KARTEN.forEach(id => { const k = document.getElementById(id); if (k) beschriften(k); }))
    .observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });
})();
