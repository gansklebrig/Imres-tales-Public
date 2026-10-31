/* Vollbild für die Tavernenspiele (Friedrichs Jagd hat einen eigenen Knopf auf der Spielfläche).
   Ein kleiner Knopf oben rechts an der Spielkarte holt die ganze Karte ins Vollbild:
   Überschrift und Beschreibung verschwinden, die Spielfläche wächst auf Bildschirmhöhe,
   alle Knöpfe des Spiels (Start, Ton, Bestenliste) bleiben erreichbar.
   Kann der Browser kein echtes Vollbild (z. B. iPhone), legt sich die Karte
   bildschirmfüllend über die Seite. Beenden: Knopf ✕ oder Esc. */
(function () {
  "use strict";
  const KARTEN = ["auftritt", "diebesnacht", "echohort", "charme-karte", "kehle"];
  const TEXT = {
    de: { an: "Vollbild", aus: "Vollbild beenden" },
    en: { an: "Fullscreen", aus: "Exit fullscreen" }
  };
  const sprache = () => (document.documentElement.lang || "de").slice(0, 2) === "en" ? "en" : "de";
  const vollEl = () => document.fullscreenElement || document.webkitFullscreenElement || null;

  const css = document.createElement("style");
  css.textContent = `
.tav-karte.hat-voll { position: relative; }
.tav-voll-knopf {
  position: absolute; top: .7rem; right: .7rem; z-index: 4; display: grid; place-items: center;
  width: 2.2rem; height: 2.2rem; padding: 0; border: 1px solid var(--line); background: rgba(9,8,15,.55);
  color: var(--ember); font: inherit; font-size: 1.05rem; line-height: 1; cursor: pointer; -webkit-tap-highlight-color: transparent;
}
.tav-voll-knopf:hover, .tav-voll-knopf:focus-visible { border-color: var(--ember); background: var(--ember); color: var(--night); }
.hat-voll > .tav-gross-knopf { right: 3.3rem; }

.tav-karte.tav-voll {
  margin: 0; max-width: none; width: 100%; height: 100%; overflow-y: auto; overscroll-behavior: contain;
  align-content: start; grid-auto-rows: max-content; gap: .6rem; padding: 3.2rem clamp(.6rem, 2vw, 1.4rem) 1.5rem;
  background: radial-gradient(ellipse at 50% 0%, rgba(224,160,70,.08), transparent 60%), var(--night, #0b0a12);
}
.tav-karte.tav-voll.ersatz { position: fixed; inset: 0; z-index: 10000; }
.tav-karte.tav-voll::backdrop { background: #0b0a12; }
.tav-karte.tav-voll > .label, .tav-karte.tav-voll > h3, .tav-karte.tav-voll > .tav-info, .tav-karte.tav-voll > .tav-gross-knopf { display: none; }
.tav-karte.tav-voll > .tav-voll-knopf { position: fixed; top: .6rem; right: .8rem; }
html.tav-voll-offen, html.tav-voll-offen body { overflow: hidden; }

.diebesnacht.tav-voll { --vb: min(100%, calc((100vh - 6rem) * ${400 / 560})); }
.echohort.tav-voll { --vb: min(100%, calc((100vh - 6rem) * .8)); }
@supports (height: 100dvh) {
  .diebesnacht.tav-voll { --vb: min(100%, calc((100dvh - 6rem) * ${400 / 560})); }
  .echohort.tav-voll { --vb: min(100%, calc((100dvh - 6rem) * .8)); }
}
.tav-karte.tav-voll .dn-buehne, .tav-karte.tav-voll .dn-liste,
.tav-karte.tav-voll .eh-buehne, .tav-karte.tav-voll .eh-liste { max-width: var(--vb); }
.tav-karte.tav-voll .dn-fuss, .tav-karte.tav-voll .eh-fuss { width: 100%; max-width: var(--vb); justify-self: center; }
.tav-karte.tav-voll .dn-steuerung, .tav-karte.tav-voll .eh-steuerung { text-align: center; margin: 0; }

.auftritt.tav-voll .at-buehne, .auftritt.tav-voll .at-liste { max-width: min(100%, 980px); }
.auftritt.tav-voll { padding-top: 1rem; }
.auftritt.tav-voll .at-canvas { height: max(280px, calc(100vh - 20rem)); }
.auftritt.tav-voll:has(.at-pfad) .at-canvas { height: max(280px, calc(100vh - 27rem)); }
@supports (height: 100dvh) {
  .auftritt.tav-voll .at-canvas { height: max(280px, calc(100dvh - 20rem)); }
  .auftritt.tav-voll:has(.at-pfad) .at-canvas { height: max(280px, calc(100dvh - 27rem)); }
}
@media (max-width: 600px) { .auftritt.tav-voll { padding-top: 3.2rem; } }
`;
  document.head.appendChild(css);

  let offen = null;

  function beschriften(k) {
    const knopf = k.querySelector(":scope > .tav-voll-knopf"); if (!knopf) return;
    const an = k.classList.contains("tav-voll"), tx = TEXT[sprache()];
    knopf.innerHTML = '<span aria-hidden="true">' + (an ? "✕" : "⛶") + "</span>";
    knopf.setAttribute("aria-label", an ? tx.aus : tx.an); knopf.title = an ? tx.aus : tx.an;
    knopf.setAttribute("aria-pressed", an ? "true" : "false");
  }

  function oeffnen(k) {
    if (offen) schliessen(offen);
    offen = k;
    k.classList.add("tav-voll");
    beschriften(k);
    const ersatz = () => { if (offen !== k) return; k.classList.add("ersatz"); document.documentElement.classList.add("tav-voll-offen"); };
    const an = k.requestFullscreen || k.webkitRequestFullscreen;
    if (an) { try { const p = an.call(k); if (p && p.catch) p.catch(ersatz); } catch (_) { ersatz(); } } else ersatz();
    k.scrollTop = 0;
    melden();
  }

  function schliessen(k) {
    if (!k || !k.classList.contains("tav-voll")) return;
    k.classList.remove("tav-voll", "ersatz");
    document.documentElement.classList.remove("tav-voll-offen");
    if (offen === k) offen = null;
    beschriften(k);
    if (vollEl() === k) { const raus = document.exitFullscreen || document.webkitExitFullscreen; try { const p = raus.call(document); if (p && p.catch) p.catch(() => {}); } catch (_) {} }
    requestAnimationFrame(() => k.scrollIntoView({ block: "start" }));
    melden();
  }

  /* Spiele, die ihre Größe nur beim Fensterwechsel neu messen, bekommen Bescheid */
  function melden() { setTimeout(() => window.dispatchEvent(new Event("resize")), 80); }

  /* Esc im echten Vollbild beendet es vom Browser aus – dann auch hier aufräumen */
  function wechsel() { if (offen && !offen.classList.contains("ersatz") && vollEl() !== offen) schliessen(offen); }
  document.addEventListener("fullscreenchange", wechsel);
  document.addEventListener("webkitfullscreenchange", wechsel);
  document.addEventListener("keydown", e => { if (e.key === "Escape" && offen && offen.classList.contains("ersatz")) schliessen(offen); });

  KARTEN.forEach(id => {
    const k = document.getElementById(id); if (!k) return;
    k.classList.add("hat-voll");
    const knopf = document.createElement("button");
    knopf.type = "button"; knopf.className = "tav-voll-knopf";
    knopf.addEventListener("click", e => { e.stopPropagation(); k.classList.contains("tav-voll") ? schliessen(k) : oeffnen(k); });
    k.appendChild(knopf);
    beschriften(k);
    /* Baut ein Spiel seine Karte neu auf, kommt der Knopf zurück */
    new MutationObserver(() => { if (!k.querySelector(":scope > .tav-voll-knopf")) { k.appendChild(knopf); beschriften(k); } })
      .observe(k, { childList: true });
  });

  new MutationObserver(() => KARTEN.forEach(id => { const k = document.getElementById(id); if (k) beschriften(k); }))
    .observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });
})();
