/* =====================================================================
   IMRES TALES – „WAS BISHER GESCHAH“ IN 60 SEKUNDEN
   ---------------------------------------------------------------------
   Pro Kapitel eine kurze, bebilderte Zusammenfassung zum Durchblättern,
   ideal zum Start einer Sitzung. Die Karten stehen in inhalt.js bzw.
   inhalt-en.js:
     kapitel[i].rueckblick = [{ abschnitt, bild, titel, text }, …]
   Fehlt die Liste bei einem neuen Kapitel, baut die Seite selbst eine
   aus den Zwischenüberschriften, dem ersten Satz und dem ersten Bild.

   Bedienung: Knopf oben in der Chronik (und schwebend, sobald er aus dem
   Bild scrollt), Knopf am Anfang jedes Kapitels. Im Fenster: Pfeiltasten,
   Wischen, Leertaste = Pause. Läuft von selbst weiter (außer bei
   „Bewegung reduzieren“).
   ===================================================================== */
(function () {
  "use strict";
  if (window.ImresRueckblick) return;
  const $ = id => document.getElementById(id);
  const chronik = $("chronik"), kapitelBox = $("chapters");
  if (!chronik || !kapitelBox) return;
  const ruhig = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const sprache = () => (document.documentElement.lang === "en" ? "en" : "de");
  const daten = () => (sprache() === "en" ? (window.INHALT_EN || window.INHALT) : window.INHALT) || {};
  const esc = s => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const slug = t => String(t).toLowerCase().replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const abschnittId = (nr, titel) => "kapitel-" + slug(nr) + "-" + slug(titel);
  const KLEIN = new Set(["audienz-horga", "aufbruch-neverwinter", "blight-frei", "blight", "buergermeister-streit", "bugbear-frei", "bugbear", "chasme-frei", "chasme", "demogorgon-karte", "demogorgon", "flucht-see", "gefangen-kerker", "glasstab-besiegt", "gracklstugh", "gundren-treffen", "hinterhalt-sieg", "ilvara-druidin", "ilvara-wahr", "koenig-horga", "kuo-toa-frei", "kuo-toa-stadt", "kuo-toa", "magische-schmiede", "ploopploopeen", "riese-frei", "riese", "siegesfeier", "skizze-chasme", "skizze-demogorgon", "skizze-ettercap", "skizze-ilvara", "skizze-riese", "unterreich-spinnweben", "venomfang-besiegt", "venomfang", "vrock-frei", "vrock", "woelfe-befreit"]);
  const EIGENE = new Set(["themberchaud-halle", "themberchaud", "gundren-frei", "buergermeister-frei", "portrait-koenig", "portrait-riese"]);
  const bildKlein = f => { const n = String(f || "").split("/").pop().replace(/\.(jpe?g|png|webp)$/i, ""); return EIGENE.has(n) ? "chronik/klein/" + n + ".webp" : KLEIN.has(n) ? "vorschau/klein/" + n + ".webp" : f; };

  const TX = {
    de: {
      knopf: "Was bisher geschah", knopfKlein: "in 60 Sekunden", kapitelKnopf: nr => "Kapitel " + nr + " in 60 Sekunden",
      label: "Was bisher geschah", kapitel: "Kapitel", schliessen: "Schließen", zurueck: "Zurück", weiter: "Weiter",
      pause: "Anhalten", spielen: "Weiterlaufen lassen", zurStelle: "Zur Stelle →", fertig: "Zur Chronik", naechstes: nr => "Kapitel " + nr + " →",
      schritt: (i, n) => i + " von " + n, kapitelWahl: "Kapitel wählen", sek: "Sek."
    },
    en: {
      knopf: "Previously on Imres Tales", knopfKlein: "in 60 seconds", kapitelKnopf: nr => "Chapter " + nr + " in 60 seconds",
      label: "Previously", kapitel: "Chapter", schliessen: "Close", zurueck: "Back", weiter: "Next",
      pause: "Pause", spielen: "Play", zurStelle: "Go there →", fertig: "Back to the chronicle", naechstes: nr => "Chapter " + nr + " →",
      schritt: (i, n) => i + " of " + n, kapitelWahl: "Choose a chapter", sek: "sec"
    }
  };
  const T = () => TX[sprache()];

  /* ---------- Karten eines Kapitels (aus inhalt.js oder selbst gebaut) ---------- */
  function karten(ki) {
    const k = (daten().kapitel || [])[ki];
    if (!k) return [];
    if (Array.isArray(k.rueckblick) && k.rueckblick.length) return k.rueckblick.filter(x => x && (x.titel || x.text));
    /* Ersatz: jede Zwischenüberschrift mit erstem Satz und erstem Bild */
    const liste = [];
    let akt = null;
    (k.absaetze || []).forEach(p => {
      if (typeof p !== "string") return;
      if (p.indexOf("## ") === 0) { akt = { abschnitt: p.slice(3).trim(), titel: p.slice(3).trim(), text: "", bild: "" }; liste.push(akt); return; }
      if (!akt) return;
      if (p.charAt(0) === "!") { if (!akt.bild) akt.bild = p.slice(1).split("|")[0].trim(); return; }
      if (!akt.text) { const t = p.replace(/<[^>]+>/g, "").trim(); const m = t.match(/^.{20,220}?[.!?…](\s|$)/); akt.text = (m ? m[0] : t.slice(0, 200)).trim(); }
    });
    let letztesBild = k.bild || "";
    liste.forEach(x => { if (x.bild) letztesBild = x.bild; else x.bild = letztesBild; });
    /* höchstens 9 Karten: gleichmäßig auswählen */
    if (liste.length <= 9) return liste;
    return Array.from({ length: 9 }, (_, i) => liste[Math.round(i * (liste.length - 1) / 8)]);
  }
  const dauer = k => Math.max(6, Math.min(13, 1.5 + String(k.text || "").split(/\s+/).length / 5));

  /* ---------- Aussehen ---------- */
  const css = document.createElement("style");
  css.textContent = `
.rb-start { margin: -.4rem 0 clamp(1.6rem, 4vw, 2.4rem); max-width: 44rem; }
.rb-knopf { display: inline-flex; align-items: center; gap: .85rem; padding: .7rem 1.2rem .7rem .8rem; border: 1px solid var(--ember); background: linear-gradient(100deg, rgba(224,160,70,.18), rgba(224,160,70,.04) 75%); color: var(--vellum);
  font: inherit; cursor: pointer; text-align: left; position: relative; overflow: hidden; transition: background .3s, box-shadow .3s; }
.rb-knopf:hover, .rb-knopf:focus-visible { background: linear-gradient(100deg, rgba(224,160,70,.3), rgba(224,160,70,.07) 75%); box-shadow: 0 0 24px rgba(224,160,70,.18); }
.rb-knopf::after { content: ""; position: absolute; inset: 0; background: linear-gradient(100deg, transparent 30%, rgba(255,230,180,.12) 50%, transparent 70%); transform: translateX(-100%); animation: rbGlanz 6s 2s ease-in-out infinite; pointer-events: none; }
@keyframes rbGlanz { 30%, 100% { transform: translateX(100%); } }
.rb-knopf .rb-uhr { flex: none; width: 2.5rem; height: 2.5rem; border-radius: 50%; display: grid; place-items: center; border: 1px solid rgba(224,160,70,.6); background: rgba(16,14,21,.6); color: var(--ember); }
.rb-knopf .rb-uhr svg { width: 1.35rem; height: 1.35rem; }
.rb-knopf b { display: block; font-family: var(--name); font-weight: 400; font-size: clamp(1.15rem, 2.8vw, 1.4rem); line-height: 1.1; }
.rb-knopf small { display: block; margin-top: .15rem; font-size: .68rem; font-weight: 600; letter-spacing: .18em; text-transform: uppercase; color: var(--ember); }
.rb-kap { display: inline-flex; align-items: center; gap: .5rem; justify-self: start; margin-top: -.3rem; padding: .32rem .8rem .32rem .55rem; border: 1px solid var(--line); border-radius: 99px; background: rgba(25,22,31,.55);
  color: var(--ash); font: inherit; font-size: .84rem; cursor: pointer; transition: color .3s, border-color .3s, background .3s; }
.rb-kap svg { width: 1rem; height: 1rem; color: var(--ember); }
.rb-kap:hover, .rb-kap:focus-visible { color: var(--vellum); border-color: var(--ember); background: rgba(224,160,70,.1); }
.rb-schwebe { position: fixed; left: max(16px, env(safe-area-inset-left, 0px)); bottom: calc(var(--rb-unten, 16px) + env(safe-area-inset-bottom, 0px)); z-index: 45; display: inline-flex; align-items: center; gap: .5rem;
  padding: .5rem .95rem .5rem .55rem; border: 1px solid rgba(224,160,70,.65); border-radius: 99px; background: rgba(20,17,26,.88); -webkit-backdrop-filter: blur(6px); backdrop-filter: blur(6px);
  color: var(--vellum); font: inherit; font-size: .88rem; cursor: pointer; box-shadow: 0 10px 28px rgba(0,0,0,.45);
  opacity: 0; transform: translateY(14px); pointer-events: none; transition: opacity .6s ease, transform .6s cubic-bezier(.2,.8,.3,1), border-color .3s, background .3s; }
.rb-schwebe.da { opacity: 1; transform: none; pointer-events: auto; }
.rb-schwebe.rund { left: 12px; padding: 0; width: 2.9rem; height: 2.9rem; justify-content: center; background: rgba(20,17,26,.78); }
.rb-schwebe.rund span { display: none; }
.rb-schwebe.rund svg { width: 1.3rem; height: 1.3rem; }
.rb-schwebe:hover, .rb-schwebe:focus-visible { border-color: var(--ember); background: rgba(36,30,40,.95); }
.rb-schwebe svg { width: 1.15rem; height: 1.15rem; color: var(--ember); flex: none; }
.mondlicht .rb-schwebe { opacity: 0 !important; pointer-events: none !important; }

/* Das Fenster */
.rb-dialog { padding: 0; border: 0; background: transparent; color: var(--vellum); max-width: none; max-height: none; width: 100vw; height: 100vh; height: 100dvh; margin: 0; overflow: hidden; }
.rb-dialog::backdrop { background: rgba(8,7,11,.8); -webkit-backdrop-filter: blur(5px); backdrop-filter: blur(5px); }
.rb-dialog[open] { display: grid; place-items: center; animation: rbAuf .5s ease; }
@keyframes rbAuf { from { opacity: 0; } to { opacity: 1; } }
.rb-rahmen { position: relative; display: grid; grid-template-columns: minmax(0, 1fr); grid-template-rows: auto auto minmax(0, 1fr) auto; width: min(66rem, calc(100vw - 24px)); height: min(44rem, calc(100dvh - 24px)); padding: clamp(.8rem, 2vw, 1.4rem) clamp(.8rem, 2.4vw, 1.6rem);
  background: radial-gradient(ellipse 80% 60% at 70% 0%, rgba(224,160,70,.07), transparent 70%), linear-gradient(180deg, #1c1822, #141119); border: 1px solid rgba(224,160,70,.38);
  box-shadow: 0 30px 80px rgba(0,0,0,.65), inset 0 0 0 4px rgba(16,14,21,.6), inset 0 0 0 5px rgba(224,160,70,.14); animation: rbRahmen .6s cubic-bezier(.2,.8,.3,1); }
@keyframes rbRahmen { from { transform: translateY(18px) scale(.985); opacity: 0; } }
.rb-kopf { display: flex; align-items: center; gap: .6rem 1rem; min-width: 0; padding-right: 2.6rem; flex-wrap: wrap; }
.rb-kopf .label { margin: 0; white-space: nowrap; }
.rb-tabs { display: flex; gap: .35rem; flex-wrap: wrap; min-width: 0; }
.rb-tab { border: 1px solid var(--line); background: rgba(16,14,21,.5); color: var(--ash); font: inherit; font-size: .82rem; padding: .22rem .7rem; border-radius: 99px; cursor: pointer; white-space: nowrap; max-width: 100%; overflow: hidden; text-overflow: ellipsis; transition: color .3s, border-color .3s, background .3s; }
.rb-tab[aria-selected="true"] { color: var(--night); background: var(--ember); border-color: var(--ember); }
.rb-tab:not([aria-selected="true"]):hover { color: var(--vellum); border-color: var(--ember); }
.rb-tab .rb-tt { margin-left: .35rem; }
.rb-zu { position: absolute; top: .55rem; right: .55rem; width: 2.5rem; height: 2.5rem; border: 0; background: none; color: var(--ash); font-size: 1.7rem; line-height: 1; cursor: pointer; border-radius: 50%; }
.rb-zu:hover, .rb-zu:focus-visible { color: var(--ember); background: rgba(224,160,70,.1); }
.rb-balken { display: flex; gap: 4px; margin: .8rem 0 .9rem; }
.rb-balken i { flex: 1; height: 3px; background: rgba(235,226,204,.14); border-radius: 2px; overflow: hidden; cursor: pointer; position: relative; }
.rb-balken i::before { content: ""; position: absolute; inset: -8px 0; }
.rb-balken i b { display: block; height: 100%; width: calc(var(--p, 0) * 100%); background: linear-gradient(90deg, #c98a3a, var(--ember)); box-shadow: 0 0 8px rgba(224,160,70,.6); }
.rb-buehne { position: relative; min-height: 0; display: grid; }
.rb-karte { grid-area: 1 / 1; display: grid; grid-template-columns: minmax(0, 1.12fr) minmax(0, 1fr); gap: clamp(1rem, 2.6vw, 2rem); min-height: 0; align-items: center;
  opacity: 0; transform: translateX(calc(var(--r, 1) * 22px)); transition: opacity .75s ease, transform .9s cubic-bezier(.2,.8,.3,1); }
.rb-karte.da { opacity: 1; transform: none; }
.rb-karte.weg { opacity: 0; transform: translateX(calc(var(--r, 1) * -22px)); pointer-events: none; }
.rb-bild { position: relative; height: 100%; min-height: 0; overflow: hidden; border: 1px solid rgba(224,160,70,.3); background: #0f0d13; box-shadow: 0 14px 34px rgba(0,0,0,.5); }
.rb-bild img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; object-position: 50% 30%; transform: scale(1.03); animation: rbZoom var(--d, 10s) linear forwards; filter: saturate(.92); }
.rb-bild.frei img { object-fit: contain; padding: 6%; filter: drop-shadow(0 10px 20px rgba(0,0,0,.6)); background: radial-gradient(ellipse at 50% 60%, rgba(224,160,70,.14), transparent 70%); }
.rb-dialog.pausiert .rb-bild img { animation-play-state: paused; }
@keyframes rbZoom { to { transform: scale(1.12) translate(-1.5%, -1%); } }
.rb-bild::after { content: ""; position: absolute; inset: 0; box-shadow: inset 0 0 60px rgba(0,0,0,.55); pointer-events: none; }
.rb-text { display: grid; gap: .55rem; align-content: center; min-height: 0; overflow: hidden; }
.rb-text small { font-size: .68rem; font-weight: 600; letter-spacing: .2em; text-transform: uppercase; color: var(--ember); }
.rb-text h3 { margin: 0; font-family: var(--name); font-weight: 400; font-size: clamp(1.5rem, 3.4vw, 2.3rem); line-height: 1.1; text-wrap: balance; }
.rb-text p { font-size: clamp(1rem, 1.6vw, 1.14rem); line-height: 1.62; color: rgba(235,226,204,.92); }
.rb-hin { justify-self: start; margin-top: .3rem; font-size: .9rem; color: var(--ember); text-decoration: none; border-bottom: 1px solid rgba(224,160,70,.4); }
.rb-hin:hover, .rb-hin:focus-visible { border-bottom-color: var(--ember); }
.rb-fuss { display: flex; align-items: center; justify-content: space-between; gap: .8rem; margin-top: .9rem; }
.rb-fuss .rb-zahl { font-size: .82rem; color: var(--ash); min-width: 4.5rem; font-variant-numeric: tabular-nums; }
.rb-steuer { display: flex; align-items: center; gap: .5rem; }
.rb-steuer button { display: grid; place-items: center; height: 2.75rem; min-width: 2.75rem; padding: 0 .8rem; border: 1px solid rgba(224,160,70,.45); background: rgba(16,14,21,.6); color: var(--vellum); font: inherit; font-size: .92rem; cursor: pointer; border-radius: 99px; transition: border-color .3s, background .3s, color .3s; }
.rb-steuer button:hover, .rb-steuer button:focus-visible { border-color: var(--ember); background: rgba(224,160,70,.12); }
.rb-steuer button:disabled { opacity: .35; cursor: default; }
.rb-steuer button svg { width: 1.1rem; height: 1.1rem; }
.rb-steuer .rb-weiter.ende { background: var(--ember); color: var(--night); border-color: var(--ember); }
.rb-fuss .rb-platz { min-width: 4.5rem; }
/* Hochformat / Handy: Bild oben, Text darunter */
@media (max-aspect-ratio: 1/1), (max-width: 720px) {
  .rb-karte { grid-template-columns: 1fr; grid-template-rows: minmax(0, 1fr) auto; gap: .9rem; align-items: stretch; }
  .rb-bild { min-height: 9rem; }
  .rb-text { align-content: start; gap: .4rem; }
  .rb-text h3 { font-size: clamp(1.35rem, 6vw, 1.8rem); }
  .rb-text p { font-size: clamp(.95rem, 2.2vh, 1.05rem); line-height: 1.55; }
  .rb-tab .rb-tt { display: none; }
  .rb-fuss .rb-platz { display: none; }
  .rb-fuss .rb-zahl { min-width: 0; }
  .rb-tab[aria-selected="true"] .rb-tt { display: inline; }
}
@media (max-height: 520px) and (min-aspect-ratio: 1/1) {
  .rb-rahmen { height: calc(100dvh - 12px); padding: .6rem 1rem; }
  .rb-balken { margin: .5rem 0; }
  .rb-text p { font-size: .92rem; line-height: 1.45; }
  .rb-text h3 { font-size: 1.3rem; }
  .rb-fuss { margin-top: .5rem; }
  .rb-steuer button { height: 2.3rem; min-width: 2.3rem; }
}
@media (prefers-reduced-motion: reduce) {
  .rb-knopf::after, .rb-bild img, .rb-dialog[open], .rb-rahmen { animation: none !important; }
  .rb-karte, .rb-karte.weg { transform: none !important; }
}
`;
  document.head.appendChild(css);

  const UHR = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 3h12M6 21h12M7 3c0 5 5 6 5 9s-5 4-5 9M17 3c0 5-5 6-5 9s5 4 5 9"/><path d="M9.5 19h5" stroke-width="2.4"/></svg>';
  const PFEIL_L = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>';
  const PFEIL_R = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg>';
  const PAUSE = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="6.5" y="5" width="3.6" height="14" rx="1"/><rect x="13.9" y="5" width="3.6" height="14" rx="1"/></svg>';
  const PLAY = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5.5v13l10.5-6.5z"/></svg>';

  /* ---------- Knöpfe in der Chronik ---------- */
  const start = document.createElement("div");
  start.className = "rb-start";
  const kopf = chronik.querySelector(".part-head");
  if (kopf) kopf.insertAdjacentElement("afterend", start);
  const schwebe = document.createElement("button");
  schwebe.type = "button"; schwebe.className = "rb-schwebe";
  document.body.appendChild(schwebe);
  function knoepfe() {
    const t = T();
    start.innerHTML = '<button type="button" class="rb-knopf" data-rb="neu"><span class="rb-uhr">' + UHR + "</span><span><b>" + esc(t.knopf) + "</b><small>" + esc(t.knopfKlein) + "</small></span></button>";
    schwebe.innerHTML = UHR + "<span>" + esc(t.knopf) + "</span>";
    schwebe.setAttribute("aria-label", t.knopf + " – " + t.knopfKlein); schwebe.title = t.knopf;
    kapitelBox.querySelectorAll(".chapter").forEach((ch, ki) => {
      if (ch.querySelector(":scope > .rb-kap")) return;
      if (!karten(ki).length) return;
      const h = ch.querySelector(":scope > h3");
      const b = document.createElement("button");
      b.type = "button"; b.className = "rb-kap"; b.dataset.rb = ki;
      b.innerHTML = UHR + "<span>" + esc(t.kapitelKnopf(((daten().kapitel || [])[ki] || {}).nummer || ki + 1)) + "</span>";
      if (h) h.insertAdjacentElement("afterend", b); else ch.prepend(b);
    });
  }
  knoepfe();
  new MutationObserver(() => { clearTimeout(knoepfe.t); knoepfe.t = setTimeout(knoepfe, 30); }).observe(kapitelBox, { childList: true });
  new MutationObserver(() => { if (dlg.open) zeichnen(0); }).observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });

  /* Der schwebende Knopf erscheint, sobald der große Knopf aus dem Bild ist – nur in der Chronik */
  let startSichtbar = true;
  function schwebeAktualisieren() {
    const offen = chronik.classList.contains("aktiv") && document.body.classList.contains("ansicht-bereich") && !chronik.hidden;
    const leiste = document.querySelector(".handyleiste");
    const lh = leiste && getComputedStyle(leiste).display !== "none" ? leiste.getBoundingClientRect().height : 0;
    schwebe.style.setProperty("--rb-unten", (lh ? lh + 12 : 16) + "px");
    /* Platz suchen: linker Rand, sonst rechter Rand, sonst nur als kleines rundes Zeichen */
    const k = kapitelBox.querySelector(".chapter"), r = k && k.getBoundingClientRect();
    if (offen && r && r.width) {
      const vw = document.documentElement.clientWidth, breite = 13 * (parseFloat(getComputedStyle(document.documentElement).fontSize) || 16);
      let links = null, rund = false;
      if (r.left >= breite + 32) links = 16;
      else if (vw - r.right >= breite + 90) links = r.right + 24;
      else rund = true;
      schwebe.classList.toggle("rund", rund);
      schwebe.style.left = links == null ? "" : links + "px";
    }
    const da = offen && !startSichtbar && !(dlg && dlg.open);
    schwebe.classList.toggle("da", da);
    schwebe.tabIndex = da ? 0 : -1;
  }
  if (window.IntersectionObserver) new IntersectionObserver(e => { startSichtbar = e[0].isIntersecting || e[0].boundingClientRect.top > 0; schwebeAktualisieren(); }).observe(start);
  new MutationObserver(schwebeAktualisieren).observe(chronik, { attributes: true, attributeFilter: ["class", "hidden"] });
  new MutationObserver(schwebeAktualisieren).observe(document.body, { attributes: true, attributeFilter: ["class"] });
  window.addEventListener("resize", schwebeAktualisieren);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(schwebeAktualisieren);

  /* ---------- Das Fenster ---------- */
  const dlg = document.createElement("dialog");
  dlg.className = "rb-dialog";
  dlg.setAttribute("aria-labelledby", "rb-label");
  dlg.innerHTML = '<div class="rb-rahmen"><div class="rb-kopf"><p class="label" id="rb-label"></p><div class="rb-tabs" role="tablist"></div><button type="button" class="rb-zu">×</button></div>' +
    '<div class="rb-balken"></div><div class="rb-buehne" aria-live="polite"></div>' +
    '<div class="rb-fuss"><span class="rb-zahl"></span><div class="rb-steuer"><button type="button" class="rb-zurueck">' + PFEIL_L + '</button><button type="button" class="rb-pause"></button><button type="button" class="rb-weiter">' + PFEIL_R + '</button></div><span class="rb-platz"></span></div></div>';
  document.body.appendChild(dlg);
  const Q = s => dlg.querySelector(s);
  const buehne = Q(".rb-buehne"), balken = Q(".rb-balken");
  let ki = 0, i = 0, laeuft = !ruhig, fort = 0, zuletzt = 0, raf = 0;

  function zeichnen(richtung) {
    const t = T(), D = daten(), kap = (D.kapitel || []);
    const liste = karten(ki);
    Q("#rb-label").textContent = t.label;
    Q(".rb-zu").setAttribute("aria-label", t.schliessen); Q(".rb-zu").title = t.schliessen;
    Q(".rb-tabs").setAttribute("aria-label", t.kapitelWahl);
    Q(".rb-tabs").innerHTML = kap.map((k, j) => karten(j).length ? '<button type="button" class="rb-tab" role="tab" data-k="' + j + '" aria-selected="' + (j === ki) + '" title="' + esc(t.kapitel + " " + k.nummer + " · " + k.titel) + '">' + esc(k.nummer) + '<span class="rb-tt">· ' + esc(k.titel) + "</span></button>" : "").join("");
    balken.innerHTML = liste.map((_, j) => '<i data-i="' + j + '" style="--p:' + (j < i ? 1 : 0) + '"><b></b></i>').join("");
    karteZeigen(richtung == null ? 1 : richtung);
  }
  function karteZeigen(richtung) {
    const t = T(), liste = karten(ki), k = liste[i];
    if (!k) return;
    const kap = (daten().kapitel || [])[ki] || {};
    buehne.querySelectorAll(".rb-karte").forEach(alt => { alt.style.setProperty("--r", richtung || 1); alt.classList.remove("da"); alt.classList.add("weg"); setTimeout(() => alt.remove(), 900); });
    const el = document.createElement("article");
    el.className = "rb-karte";
    el.style.setProperty("--r", richtung || 1);
    el.style.setProperty("--d", (dauer(k) + 1) + "s");
    const frei = /(-frei\.|ilvara-|koenig-horga|themberchaud\.webp|riese\.webp|demogorgon\.webp|skizze-)/i.test(k.bild || "");
    const ziel = k.abschnitt ? abschnittId(kap.nummer, k.abschnitt) : "kapitel-" + kap.nummer;
    el.innerHTML = (k.bild ? '<div class="rb-bild' + (frei ? " frei" : "") + '"><img src="' + esc(bildKlein(k.bild)) + '" data-gross="' + esc(k.bild) + '" alt="" decoding="async" onerror="if(this.src.indexOf(this.dataset.gross)<0)this.src=this.dataset.gross"></div>' : '<div class="rb-bild"></div>') +
      '<div class="rb-text"><small>' + esc(t.kapitel + " " + kap.nummer + " · " + t.schritt(i + 1, liste.length)) + "</small><h3>" + esc(k.titel || k.abschnitt || "") + "</h3><p>" + esc(k.text || "") + "</p>" +
      '<a class="rb-hin" href="#' + esc(ziel) + '">' + esc(t.zurStelle) + "</a></div>";
    buehne.appendChild(el);
    requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add("da")));
    /* nächstes Bild schon vorladen */
    const n = liste[i + 1]; if (n && n.bild) { const im = new Image(); im.src = bildKlein(n.bild); }
    fort = 0;
    balkenSetzen();
    fussSetzen();
  }
  function balkenSetzen() {
    balken.querySelectorAll("i").forEach((b, j) => b.style.setProperty("--p", j < i ? 1 : j === i ? Math.min(1, fort) : 0));
  }
  function fussSetzen() {
    const t = T(), liste = karten(ki), kap = daten().kapitel || [];
    Q(".rb-zahl").textContent = t.schritt(i + 1, liste.length);
    const zur = Q(".rb-zurueck"), wei = Q(".rb-weiter"), pa = Q(".rb-pause");
    zur.disabled = i === 0 && ki === 0; zur.setAttribute("aria-label", t.zurueck); zur.title = t.zurueck;
    const ende = i === liste.length - 1;
    const naechstes = ende && kap[ki + 1] && karten(ki + 1).length ? kap[ki + 1] : null;
    wei.classList.toggle("ende", ende);
    wei.innerHTML = ende ? "<span>" + esc(naechstes ? t.naechstes(naechstes.nummer) : t.fertig) + "</span>" : PFEIL_R;
    wei.setAttribute("aria-label", ende ? (naechstes ? t.naechstes(naechstes.nummer) : t.fertig) : t.weiter); wei.title = wei.getAttribute("aria-label");
    pa.innerHTML = laeuft ? PAUSE : PLAY; pa.setAttribute("aria-label", laeuft ? t.pause : t.spielen); pa.title = pa.getAttribute("aria-label");
    dlg.classList.toggle("pausiert", !laeuft);
  }
  function gehe(neu, richtung) {
    const liste = karten(ki);
    if (neu < 0) {
      if (ki > 0) { ki--; i = karten(ki).length - 1; zeichnen(-1); }
      return;
    }
    if (neu >= liste.length) {
      const kap = daten().kapitel || [];
      if (kap[ki + 1] && karten(ki + 1).length) { ki++; i = 0; zeichnen(1); }
      else { laeuft = false; fussSetzen(); }
      return;
    }
    i = neu; karteZeigen(richtung);
  }
  function tick(t) {
    raf = requestAnimationFrame(tick);
    const dt = zuletzt ? Math.min(.1, (t - zuletzt) / 1000) : 0; zuletzt = t;
    if (!laeuft || document.hidden) return;
    const k = karten(ki)[i]; if (!k) return;
    fort += dt / dauer(k);
    if (fort >= 1) {
      fort = 1; balkenSetzen();
      if (i < karten(ki).length - 1) gehe(i + 1, 1);
      else { laeuft = false; fussSetzen(); }
      return;
    }
    balkenSetzen();
  }
  function oeffnen(kapIdx) {
    const kap = daten().kapitel || [];
    ki = Math.max(0, Math.min(kap.length - 1, kapIdx));
    if (!karten(ki).length) return;
    i = 0; fort = 0; laeuft = !ruhig;
    zeichnen(0);
    if (dlg.showModal) dlg.showModal(); else dlg.setAttribute("open", "");
    document.documentElement.classList.add("rb-offen");
    zuletzt = 0; cancelAnimationFrame(raf); raf = requestAnimationFrame(tick);
    schwebeAktualisieren();
    setTimeout(() => { const w = Q(".rb-weiter"); if (w) w.focus({ preventScroll: true }); }, 60);
  }
  function schliessen() { if (dlg.open) dlg.close(); }
  dlg.addEventListener("close", () => { cancelAnimationFrame(raf); document.documentElement.classList.remove("rb-offen"); schwebeAktualisieren(); });

  /* ---------- Bedienung ---------- */
  document.addEventListener("click", e => {
    const b = e.target.closest && e.target.closest("[data-rb], .rb-schwebe");
    if (!b) return;
    e.preventDefault();
    const kap = daten().kapitel || [];
    const nr = b.dataset.rb;
    oeffnen(nr == null || nr === "neu" ? kap.length - 1 : +nr);
  });
  Q(".rb-zu").addEventListener("click", schliessen);
  dlg.addEventListener("click", e => {
    if (e.target === dlg) { schliessen(); return; }
    const tab = e.target.closest(".rb-tab");
    if (tab) { const n = +tab.dataset.k; if (n !== ki) { const r = n > ki ? 1 : -1; ki = n; i = 0; fort = 0; laeuft = !ruhig; zeichnen(r); } return; }
    const seg = e.target.closest(".rb-balken i");
    if (seg) { const n = +seg.dataset.i; if (n !== i) gehe(n, n > i ? 1 : -1); return; }
    if (e.target.closest(".rb-hin")) { schliessen(); return; } /* seiten.js springt zur Stelle */
  });
  Q(".rb-zurueck").addEventListener("click", () => { fort = 0; gehe(i - 1, -1); });
  Q(".rb-weiter").addEventListener("click", () => {
    const liste = karten(ki), kap = daten().kapitel || [];
    if (i === liste.length - 1 && !(kap[ki + 1] && karten(ki + 1).length)) { schliessen(); return; }
    gehe(i + 1, 1);
  });
  Q(".rb-pause").addEventListener("click", () => {
    laeuft = !laeuft;
    if (laeuft && fort >= 1) { if (i < karten(ki).length - 1) gehe(i + 1, 1); else { i = 0; karteZeigen(-1); } }
    fussSetzen();
  });
  dlg.addEventListener("keydown", e => {
    if (e.key === "ArrowRight") { e.preventDefault(); Q(".rb-weiter").click(); }
    else if (e.key === "ArrowLeft") { e.preventDefault(); if (!Q(".rb-zurueck").disabled) Q(".rb-zurueck").click(); }
    else if (e.key === " " && !(e.target.closest && e.target.closest("button, a"))) { e.preventDefault(); Q(".rb-pause").click(); }
  });
  /* Wischen */
  let wx = null, wy = 0;
  buehne.addEventListener("pointerdown", e => { wx = e.clientX; wy = e.clientY; });
  buehne.addEventListener("pointerup", e => {
    if (wx == null) return;
    const dx = e.clientX - wx, dy = e.clientY - wy; wx = null;
    if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.3) { if (dx < 0) Q(".rb-weiter").click(); else if (!Q(".rb-zurueck").disabled) Q(".rb-zurueck").click(); }
  });
  buehne.addEventListener("pointercancel", () => { wx = null; });

  window.ImresRueckblick = { oeffnen, schliessen };
})();
