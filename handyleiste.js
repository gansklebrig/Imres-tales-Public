/* =====================================================================
   HANDYLEISTE – feste Navigation unten auf dem Handy (bis 760 px Breite)
   ---------------------------------------------------------------------
   Sechs Ziele wie in einer App: Start, Chronik, Gefährten, Taverne, Bühne, Mehr.
   „Mehr“ öffnet ein Blatt mit den übrigen Bereichen, den Kapiteln,
   der Suche und der Sprachwahl. Oben bleibt nur die schmale Kopfzeile
   (Name, Suche, Sprache) – die lange, abgeschnittene Menüzeile entfällt.
   Beschriftungen kommen aus dem Menü oben (also auch auf Englisch).
   Im Vollbild der Spiele und in Dialogen verschwindet die Leiste.
   ===================================================================== */
(function () {
  "use strict";
  const topNav = document.querySelector(".top nav");
  if (!topNav) return;
  const sprache = () => (document.documentElement.lang === "en" ? "en" : "de");
  const esc = s => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const TX = {
    de: { start: "Start", mehr: "Mehr", bereiche: "Bereiche", kapitel: "Kapitel", suche: "Suchen", sprache: "Sprache", zu: "Schließen", leiste: "Schnellnavigation" },
    en: { start: "Home", mehr: "More", bereiche: "Sections", kapitel: "Chapters", suche: "Search", sprache: "Language", zu: "Close", leiste: "Quick navigation" }
  };
  const t = () => TX[sprache()];
  const ICON = {
    start: '<path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10v9.5h4.8v-5.6h3.4v5.6h4.8V10"/>',
    chronik: '<path d="M6 3.5h10.5a2 2 0 0 1 2 2v13a2 2 0 0 0 2 2H8a2 2 0 0 1-2-2v-15Z"/><path d="M6 6.5H4.5a1.5 1.5 0 0 1 0-3H6M9.5 8h6M9.5 11.5h6M9.5 15h4"/>',
    gefaehrten: '<path d="M12 3.5 19 6v5.5c0 4.4-3 7.6-7 9-4-1.4-7-4.6-7-9V6l7-2.5Z"/><path d="M12 7.5v9M8.5 11h7"/>',
    taverne: '<path d="M6 8.5h9v10a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2v-10Z"/><path d="M15 10.5h1.8a2.2 2.2 0 0 1 0 4.4H15"/><path d="M6.3 8.5c-.8-2.6.9-4.6 3-4.2 1-1.6 3.6-1.5 4.3.4 1.6-.2 2.2 2 1.4 3.8"/>',
    buehne: '<path d="M9 18.5V5.5l10-2v12.5"/><circle cx="6.6" cy="18.5" r="2.4"/><circle cx="16.6" cy="16" r="2.4"/><path d="M9 9.2l10-2"/>',
    mehr: '<circle cx="5.5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="18.5" cy="12" r="1.6"/>'
  };
  const ZIELE = ["start", "chronik", "gefaehrten", "taverne", "buehne"];
  const linkText = id => { const a = topNav.querySelector('a[href="#' + id + '"]'); return a ? a.textContent.trim() : id; };

  /* ---------- Leiste ---------- */
  const leiste = document.createElement("nav"); leiste.className = "handyleiste";
  const blatt = document.createElement("div"); blatt.className = "hl-blatt"; blatt.hidden = true;
  const hinter = document.createElement("div"); hinter.className = "hl-hinter"; hinter.hidden = true;
  document.body.append(hinter, blatt, leiste);

  function leisteBauen() {
    const T = t();
    leiste.setAttribute("aria-label", T.leiste);
    leiste.innerHTML = ZIELE.map(id =>
      '<a href="#' + id + '" data-ziel="' + id + '"><svg viewBox="0 0 24 24" aria-hidden="true">' + ICON[id] + "</svg><span>" + esc(id === "start" ? T.start : linkText(id)) + "</span></a>").join("") +
      '<button type="button" class="hl-mehr" aria-expanded="false" aria-haspopup="true"><svg viewBox="0 0 24 24" aria-hidden="true">' + ICON.mehr + "</svg><span>" + esc(T.mehr) + "</span></button>";
    markieren();
  }

  /* ---------- „Mehr“-Blatt ---------- */
  function kapitelListe() {
    const D = (sprache() === "en" ? (window.INHALT_EN || window.INHALT) : window.INHALT) || {};
    return (D.kapitel || []).map(k => ({ href: "#kapitel-" + String(k.nummer).toLowerCase(), text: k.nummer + " · " + k.titel }));
  }
  function blattBauen() {
    const T = t();
    const uebrige = [...topNav.querySelectorAll('a[href^="#"]')].map(a => a.getAttribute("href").slice(1)).filter(id => !ZIELE.includes(id));
    const kap = kapitelListe();
    blatt.innerHTML =
      '<div class="hl-griff" aria-hidden="true"></div>' +
      '<button type="button" class="hl-zu" aria-label="' + esc(T.zu) + '">×</button>' +
      '<p class="hl-titel">' + esc(T.bereiche) + "</p>" +
      '<div class="hl-raster">' + uebrige.map(id => '<a href="#' + id + '" data-ziel="' + id + '">' + esc(linkText(id)) + "</a>").join("") + "</div>" +
      (kap.length ? '<p class="hl-titel">' + esc(T.kapitel) + '</p><div class="hl-kapitel">' + kap.map(k => '<a href="' + esc(k.href) + '">' + esc(k.text) + "</a>").join("") + "</div>" : "") +
      '<div class="hl-fuss"><button type="button" class="hl-suche">🔍 ' + esc(T.suche) + '</button>' +
        '<span class="hl-sprache" role="group" aria-label="' + esc(T.sprache) + '"><button type="button" data-lang="de" aria-pressed="' + (sprache() === "de") + '">Deutsch</button><button type="button" data-lang="en" aria-pressed="' + (sprache() === "en") + '">English</button></span></div>';
  }
  function blattAuf() { blattBauen(); blatt.hidden = false; hinter.hidden = false; requestAnimationFrame(() => { blatt.classList.add("offen"); hinter.classList.add("offen"); }); leiste.querySelector(".hl-mehr").setAttribute("aria-expanded", "true"); }
  function blattZu() {
    if (blatt.hidden) return;
    blatt.classList.remove("offen"); hinter.classList.remove("offen");
    const m = leiste.querySelector(".hl-mehr"); if (m) m.setAttribute("aria-expanded", "false");
    setTimeout(() => { if (!blatt.classList.contains("offen")) { blatt.hidden = true; hinter.hidden = true; } }, 260);
  }
  leiste.addEventListener("click", e => { if (e.target.closest(".hl-mehr")) { blatt.hidden ? blattAuf() : blattZu(); } else if (e.target.closest("a")) blattZu(); });
  hinter.addEventListener("click", blattZu);
  document.addEventListener("keydown", e => { if (e.key === "Escape") blattZu(); });
  blatt.addEventListener("click", e => {
    if (e.target.closest(".hl-zu")) { blattZu(); return; }
    if (e.target.closest("a")) { blattZu(); return; }
    if (e.target.closest(".hl-suche")) { blattZu(); const s = document.querySelector(".such-btn"); if (s) setTimeout(() => s.click(), 280); return; }
    const l = e.target.closest("[data-lang]");
    /* Sprachwahl: denselben Knopf wie oben auslösen, damit alles gleich bleibt */
    if (l) { const oben = document.querySelector('.lang [data-lang="' + l.dataset.lang + '"]'); if (oben) oben.click(); blattBauen(); }
  });

  /* ---------- Aktiven Bereich markieren ---------- */
  function aktiverBereich() {
    if (document.body.classList.contains("ansicht-start")) return "start";
    const s = document.querySelector("section.part.aktiv"); return s ? s.id : "start";
  }
  function markieren() {
    const id = aktiverBereich(), unten = ZIELE.includes(id) ? id : "mehr";
    leiste.querySelectorAll("[data-ziel]").forEach(a => a.toggleAttribute("aria-current", a.dataset.ziel === unten));
    const m = leiste.querySelector(".hl-mehr"); if (m) m.classList.toggle("aktiv", unten === "mehr");
  }
  new MutationObserver(markieren).observe(document.body, { attributes: true, attributeFilter: ["class"] });
  document.querySelectorAll("section.part").forEach(s => new MutationObserver(markieren).observe(s, { attributes: true, attributeFilter: ["class"] }));
  /* „Start“ führt ganz nach oben, auch wenn man schon auf der Startseite ist */
  leiste.addEventListener("click", e => { const a = e.target.closest('a[data-ziel="start"]'); if (a && document.body.classList.contains("ansicht-start")) { e.preventDefault(); window.scrollTo({ top: 0, behavior: "smooth" }); } });

  /* ---------- Aussehen ---------- */
  const css = document.createElement("style");
  css.textContent = `
.handyleiste, .hl-blatt, .hl-hinter { display: none; }
@media (max-width: 760px) {
  /* oben nur noch die schmale Kopfzeile */
  .top nav { display: none !important; }
  .top .wrap { flex-wrap: nowrap; }
  body { padding-bottom: calc(62px + env(safe-area-inset-bottom, 0px)); }
  .kerze { bottom: calc(68px + env(safe-area-inset-bottom, 0px)) !important; }

  .handyleiste { display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); position: fixed; left: 0; right: 0; bottom: 0; z-index: 900;
    padding: 4px 4px env(safe-area-inset-bottom, 0px); background: rgba(14,11,17,.94); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px);
    border-top: 1px solid rgba(224,160,70,.28); box-shadow: 0 -8px 24px rgba(0,0,0,.45); }
  .handyleiste a, .handyleiste button { display: grid; justify-items: center; gap: 2px; padding: 6px 2px 5px; min-height: 52px; border: 0; background: none; color: var(--ash, #b9ab95);
    font: inherit; font-size: .64rem; letter-spacing: 0; text-decoration: none; cursor: pointer; -webkit-tap-highlight-color: transparent; position: relative; }
  .handyleiste svg { width: 24px; height: 24px; fill: none; stroke: currentColor; stroke-width: 1.6; stroke-linecap: round; stroke-linejoin: round; }
  .handyleiste .hl-mehr svg { fill: currentColor; stroke: none; }
  .handyleiste span { max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .handyleiste [aria-current], .handyleiste .hl-mehr.aktiv, .handyleiste .hl-mehr[aria-expanded="true"] { color: var(--ember, #e0a046); }
  .handyleiste [aria-current]::before, .handyleiste .hl-mehr.aktiv::before { content: ""; position: absolute; top: 0; left: 28%; right: 28%; height: 2px; border-radius: 2px; background: var(--ember, #e0a046); }

  .hl-hinter:not([hidden]) { display: block; position: fixed; inset: 0; z-index: 901; background: rgba(6,5,10,.55); opacity: 0; transition: opacity .25s; }
  .hl-hinter.offen { opacity: 1; }
  .hl-blatt:not([hidden]) { display: grid; gap: .55rem; position: fixed; left: 0; right: 0; bottom: 0; z-index: 902; max-height: 78vh; overflow-y: auto;
    padding: .6rem 1rem calc(76px + env(safe-area-inset-bottom, 0px)); background: #17121c; border-top: 1px solid rgba(224,160,70,.4); border-radius: 16px 16px 0 0;
    box-shadow: 0 -18px 40px rgba(0,0,0,.6); transform: translateY(100%); transition: transform .26s cubic-bezier(.2,.8,.3,1); }
  .hl-blatt.offen { transform: none; }
  .hl-griff { justify-self: center; width: 2.6rem; height: 4px; border-radius: 4px; background: rgba(235,226,204,.25); }
  .hl-zu { position: absolute; top: .45rem; right: .6rem; width: 2.2rem; height: 2.2rem; border: 0; background: none; color: var(--ash); font-size: 1.5rem; cursor: pointer; }
  .hl-titel { margin: .3rem 0 0; font-size: .66rem; letter-spacing: .2em; text-transform: uppercase; color: var(--ember, #e0a046); }
  .hl-raster { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: .45rem; }
  .hl-raster a { padding: .75rem .8rem; border: 1px solid var(--line); background: rgba(255,255,255,.03); color: var(--vellum); text-decoration: none; font-size: .95rem; }
  .hl-kapitel { display: grid; gap: .3rem; }
  .hl-kapitel a { padding: .5rem .2rem; border-bottom: 1px dashed var(--line); color: var(--vellum); text-decoration: none; font-size: .92rem; }
  .hl-fuss { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: .6rem; margin-top: .4rem; }
  .hl-fuss button { border: 1px solid var(--line); background: none; color: var(--vellum); font: inherit; font-size: .88rem; padding: .5rem .8rem; cursor: pointer; }
  .hl-sprache { display: inline-flex; }
  .hl-sprache button[aria-pressed="true"] { border-color: var(--ember); color: var(--ember); }

  /* Nicht stören: im Vollbild der Spiele und bei offenen Fenstern */
  html.tav-voll-offen .handyleiste, html.saal-dialog-offen .handyleiste, html.wl-ohne-scroll .handyleiste, :fullscreen ~ .handyleiste { display: none; }
}
@media (max-width: 760px) and (prefers-reduced-motion: reduce) { .hl-blatt, .hl-hinter { transition: none; } }
`;
  document.head.appendChild(css);

  /* Im echten Vollbild (Spiele) ausblenden */
  const vollWechsel = () => leiste.classList.toggle("versteckt", !!(document.fullscreenElement || document.webkitFullscreenElement));
  document.addEventListener("fullscreenchange", vollWechsel); document.addEventListener("webkitfullscreenchange", vollWechsel);
  const css2 = document.createElement("style"); css2.textContent = ".handyleiste.versteckt { display: none !important; }"; document.head.appendChild(css2);

  /* ---------- Start ---------- */
  leisteBauen();
  new MutationObserver(() => { leisteBauen(); if (!blatt.hidden) blattBauen(); }).observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });
  /* Menütexte werden nach dem Laden der Inhalte gesetzt – einmal nachziehen */
  setTimeout(leisteBauen, 1200);
})();
