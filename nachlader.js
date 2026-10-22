/* =====================================================================
   NACHLADER – große Teile erst laden, wenn man sie braucht
   ---------------------------------------------------------------------
   Die Spiele der Taverne und das Lautenwerk der Bühne stehen in
   index.html als <script type="text/plain" data-nachladen="…">. So lädt
   der Browser sie nicht beim ersten Besuch, die Versionsnummern bleiben
   aber wie gewohnt dort gepflegt. Dieser Nachlader holt sie, sobald
   - der Bereich (Taverne bzw. Bühne) geöffnet wird,
   - ein Link mit ?lauschen= oder ?lied= direkt ins Lautenwerk führt,
   - oder – nur am großen Bildschirm mit schnellem Netz – im Leerlauf.
   Reihenfolge bleibt erhalten (z. B. Figuren und Welten vor der Jagd).
   ===================================================================== */
(function () {
  "use strict";
  const gruppen = {};
  document.querySelectorAll('script[type="text/plain"][data-nachladen]').forEach(s => {
    const g = s.dataset.nachladen; (gruppen[g] = gruppen[g] || []).push(s);
  });
  const status = {}; /* Gruppe → Promise */

  function laden(gruppe) {
    if (status[gruppe]) return status[gruppe];
    const tags = gruppen[gruppe] || [];
    const karten = gruppe === "taverne" ? document.querySelectorAll("#taverne .taverne > .tav-karte") : document.querySelectorAll("#buehne .tav-karte");
    karten.forEach(k => k.classList.add("nachladen"));
    status[gruppe] = tags.reduce((kette, tag) => kette.then(() => new Promise(fertig => {
      const s = document.createElement("script");
      s.src = tag.getAttribute("src");
      s.onload = s.onerror = () => fertig();
      tag.after(s); tag.remove();
    })), Promise.resolve()).then(() => {
      karten.forEach(k => k.classList.remove("nachladen"));
      /* Spiele und Bühne neu vermessen lassen */
      requestAnimationFrame(() => window.dispatchEvent(new Event("resize")));
      document.dispatchEvent(new CustomEvent("imres:nachgeladen", { detail: gruppe }));
    });
    return status[gruppe];
  }
  window.ImresNachladen = laden;

  /* Bereich offen? (seiten.js setzt die Klasse „aktiv“ am sichtbaren Bereich) */
  const BEREICH = { taverne: "taverne", buehne: "buehne" };
  function pruefen() {
    Object.keys(BEREICH).forEach(g => { const s = document.getElementById(BEREICH[g]); if (s && s.classList.contains("aktiv")) laden(g); });
  }
  Object.keys(BEREICH).forEach(g => { const s = document.getElementById(BEREICH[g]); if (s) new MutationObserver(pruefen).observe(s, { attributes: true, attributeFilter: ["class"] }); });
  pruefen();
  /* Direkte Links ins Lautenwerk (Zuhören, geteiltes Lied) */
  if (/[?&](lauschen|lied)=/.test(location.search)) laden("buehne");
  /* Wer auf einen Link zu einem Spiel klickt, bekommt es schon beim Klick angestoßen */
  document.addEventListener("pointerdown", e => {
    const a = e.target.closest && e.target.closest('a[href^="#"]'); if (!a) return;
    const h = a.getAttribute("href");
    if (/^#(taverne|waldlauf|diebesnacht|echohort|auftritt|barden-probe|memory-karte)$/.test(h)) laden("taverne");
    if (h === "#buehne" || h === "#lautenwerk") laden("buehne");
  }, { passive: true, capture: true });

  /* Großer Bildschirm, schnelles Netz, kein Datensparmodus: im Leerlauf vorladen */
  const netz = navigator.connection || {};
  const schnell = !netz.saveData && (!netz.effectiveType || netz.effectiveType === "4g");
  const gross = window.matchMedia && window.matchMedia("(min-width: 1000px) and (hover: hover)").matches;
  if (schnell && gross) {
    const spaeter = cb => (window.requestIdleCallback ? requestIdleCallback(cb, { timeout: 4000 }) : setTimeout(cb, 1500));
    window.addEventListener("load", () => setTimeout(() => spaeter(() => laden("taverne").then(() => spaeter(() => laden("buehne")))), 6000));
  }

  const css = document.createElement("style");
  css.textContent = `
.tav-karte.nachladen { position: relative; min-height: 14rem; }
.tav-karte.nachladen::after { content: ""; position: absolute; left: 50%; top: 50%; width: 2.2rem; height: 2.2rem; margin: -1.1rem; border-radius: 50%;
  border: 3px solid rgba(224,160,70,.25); border-top-color: var(--ember, #e0a046); animation: nachladenDreh .9s linear infinite; }
@keyframes nachladenDreh { to { transform: rotate(360deg); } }
`;
  document.head.appendChild(css);
})();
