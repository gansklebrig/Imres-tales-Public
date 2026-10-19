/* Großansicht für die Tavernenspiele – ohne Vollbild.
   Das aktive Spiel bekommt die ganze Breite der Taverne, die Spielfläche
   wächst bis fast auf Fensterhöhe, das andere Spiel rutscht eine Zeile tiefer.
   Startet man ein Spiel, wird es von selbst groß; der Knopf oben rechts
   schaltet zwischen groß und normal hin und her. Nur auf breiten Bildschirmen –
   am Handy ist die Spielfläche ohnehin schon so breit wie möglich. */
(function () {
  "use strict";
  const KARTEN = [
    { id: "waldlauf", buehne: ".wl-buehne" },
    { id: "diebesnacht", buehne: ".dn-buehne" }
  ];
  const BREIT = window.matchMedia("(min-width: 900px)");
  const TEXT = {
    de: { gross: "Größer", klein: "Kleiner", grossLang: "Spiel größer anzeigen", kleinLang: "Spiel wieder kleiner anzeigen" },
    en: { gross: "Larger", klein: "Smaller", grossLang: "Show the game larger", kleinLang: "Show the game smaller again" }
  };
  const sprache = () => (document.documentElement.lang || "de").slice(0, 2) === "en" ? "en" : "de";

  const css = document.createElement("style");
  css.textContent = `
.tav-karte.hat-gross { position: relative; }
.tav-gross-knopf {
  position: absolute; top: .7rem; right: .7rem; z-index: 3; display: none; align-items: center; gap: .4rem;
  padding: .35rem .75rem; border: 1px solid var(--line); background: rgba(9,8,15,.55); color: var(--ember);
  font: inherit; font-size: .85rem; cursor: pointer; -webkit-tap-highlight-color: transparent;
}
.tav-gross-knopf:hover, .tav-gross-knopf:focus-visible { border-color: var(--ember); background: var(--ember); color: var(--night); }
.tav-gross-knopf .sym { font-size: 1.05rem; line-height: 1; }
@media (min-width: 900px) {
  .tav-gross-knopf { display: inline-flex; }
  .tav-karte.tav-gross { grid-column: 1 / -1; }
  .waldlauf.tav-gross { --gross-b: min(100%, calc((100vh - 6rem) * .8)); }
  .diebesnacht.tav-gross { --gross-b: min(100%, calc((100vh - 6rem) * ${400 / 560})); }
  .tav-gross .wl-buehne, .tav-gross .wl-liste, .tav-gross .dn-buehne, .tav-gross .dn-liste { max-width: var(--gross-b); }
  .tav-gross .wl-fuss, .tav-gross .dn-fuss { width: 100%; max-width: var(--gross-b); justify-self: center; }
  .tav-gross > .tav-info, .tav-gross .wl-steuerung, .tav-gross .dn-steuerung { max-width: 46rem; }
}
`;
  document.head.appendChild(css);

  function beschriften(k) {
    const knopf = k.querySelector(":scope > .tav-gross-knopf"); if (!knopf) return;
    const tx = TEXT[sprache()], gross = k.classList.contains("tav-gross");
    knopf.innerHTML = '<span class="sym" aria-hidden="true">' + (gross ? "⤡" : "⤢") + '</span>' + (gross ? tx.klein : tx.gross);
    knopf.setAttribute("aria-label", gross ? tx.kleinLang : tx.grossLang);
    knopf.setAttribute("aria-pressed", gross ? "true" : "false");
  }

  /* Spielfläche ganz ins Bild holen, falls sie nach dem Umbau aus dem Fenster ragt */
  function insBild(k, sel) {
    requestAnimationFrame(() => requestAnimationFrame(() => {
      const b = k.querySelector(sel); if (!b) return;
      const r = b.getBoundingClientRect(), kopf = 64;
      if (r.top < kopf || r.bottom > window.innerHeight) {
        const ziel = window.scrollY + r.top - Math.max(kopf, (window.innerHeight - r.height) / 2);
        window.scrollTo({ top: ziel, behavior: "smooth" });
      }
    }));
  }

  function setzen(eintrag, gross) {
    const k = document.getElementById(eintrag.id); if (!k) return;
    if (gross) KARTEN.forEach(e => { if (e !== eintrag) setzen(e, false); });
    if (k.classList.contains("tav-gross") === gross) return;
    k.classList.toggle("tav-gross", gross);
    beschriften(k);
    if (gross) insBild(k, eintrag.buehne);
  }

  KARTEN.forEach(eintrag => {
    const k = document.getElementById(eintrag.id); if (!k || k.hidden) return;
    k.classList.add("hat-gross");
    const knopf = document.createElement("button");
    knopf.type = "button"; knopf.className = "tav-gross-knopf";
    /* Wer per Knopf verkleinert, bekommt das Spiel nicht mehr ungefragt groß */
    let selbstKlein = false;
    knopf.addEventListener("click", () => { const g = !k.classList.contains("tav-gross"); selbstKlein = !g; setzen(eintrag, g); });
    k.appendChild(knopf);
    beschriften(k);

    /* Sobald ein Spiel startet, wird es von selbst groß */
    let lief = false, beobachtet = null;
    const startWache = new MutationObserver(() => {
      const b = k.querySelector(eintrag.buehne); if (!b) return;
      const laeuft = b.classList.contains("laeuft");
      if (laeuft && !lief && !selbstKlein && BREIT.matches) setzen(eintrag, true);
      lief = laeuft;
    });
    function beobachten() {
      const b = k.querySelector(eintrag.buehne);
      if (!b || b === beobachtet) return;
      startWache.disconnect(); beobachtet = b; lief = b.classList.contains("laeuft");
      startWache.observe(b, { attributes: true, attributeFilter: ["class"] });
    }
    beobachten();

    /* Falls das Spiel seine Karte neu aufbaut, kommt der Knopf zurück */
    new MutationObserver(() => {
      if (!k.querySelector(":scope > .tav-gross-knopf")) { k.appendChild(knopf); beschriften(k); }
      beobachten();
    }).observe(k, { childList: true });
  });

  new MutationObserver(() => KARTEN.forEach(e => { const k = document.getElementById(e.id); if (k) beschriften(k); }))
    .observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });
})();
