/* =====================================================================
   IMRES TALES – STARTSEITE & ANSICHTEN
   ---------------------------------------------------------------------
   Die Startseite zeigt die Halle der Gefährten (die ganze Gruppe als
   animierte Bildwand) und eine Übersicht mit Kacheln zu allen Bereichen.
   Jeder Bereich (Chronik, Questtafel, Reise, …) wird einzeln angezeigt,
   statt dass alles untereinander auf einer langen Seite steht.
   Links wie „#chronik“ oder „#kapitel-…“ funktionieren weiterhin.
   ===================================================================== */
(function () {
  "use strict";
  const $ = id => document.getElementById(id);
  const start = $("startseite");
  if (!start) return;

  const ruhig = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const sprache = () => (document.documentElement.lang === "en" ? "en" : "de");
  const esc = s => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const daten = () => (sprache() === "en" ? (window.INHALT_EN || window.INHALT) : window.INHALT) || {};

  const BEREICHE = ["chronik", "questtafel", "reise", "gefaehrten", "nsc", "bestiarium", "taverne", "buehne"];
  const TX = {
    de: {
      uebersicht: "← Übersicht", zurueck: "Zurück", weiter: "Weiter",
      weiterlesen: (nr, titel) => "<small>Zuletzt geschehen</small>Kapitel " + nr + " · " + titel + "<b>Weiterlesen →</b>",
      zuletzt: "Zuletzt geschehen", kapitelWort: "Kapitel", weiterWort: "Weiterlesen →",
      runter: "Zur Übersicht",
      weg: "Diese Stelle gibt es nicht mehr – ", wegLink: "hier geht's zur Übersicht",
      namen: { chronik: "Die Chronik", questtafel: "Die Questtafel", reise: "Die Reise", gefaehrten: "Die Gefährten", nsc: "Bekanntschaften", bestiarium: "Das Bestiarium", taverne: "Die Taverne", buehne: "Barden Beats" },
      texte: {
        chronik: "Das ganze Abenteuer, Kapitel für Kapitel nacherzählt.",
        questtafel: "Offene Fragen, Hinweise und rote Fäden.",
        reise: "Jede Station der Gruppe auf der Karte.",
        gefaehrten: "Vier Helden und ein Hund – wer sie sind.",
        nsc: "Freund, Feind und Fragezeichen.",
        bestiarium: "Alles, was uns fressen wollte.",
        taverne: "Heldensturm, Friedrichs Jagd, Ezekiels lange Nacht, Echos Hort, Barradins Auftritt, Loblied & Spott und Bestiarium-Memory.",
        /* schmale Kacheln (Handy): kurze Fassung, sonst passt der Text nicht hinein */
        taverneKurz: "Würfeln, kämpfen, stehlen, singen – zieh dir einen Hocker ran.",
        buehne: "Lautenwerk und Spielleiter-Pult für eure Sessions."
      },
      zahl: { chronik: n => n + (n === 1 ? " Kapitel" : " Kapitel"), questtafel: n => n + " Zettel", reise: n => n + " Stationen", gefaehrten: () => "5 Gefährten", nsc: n => n + " Gesichter", bestiarium: n => n + " Kreaturen", taverne: () => "8 Spiele", buehne: () => "♪ Musik" }
    },
    en: {
      uebersicht: "← Overview", zurueck: "Back", weiter: "Next",
      weiterlesen: (nr, titel) => "<small>Most recently</small>Chapter " + nr + " · " + titel + "<b>Read on →</b>",
      zuletzt: "Most recently", kapitelWort: "Chapter", weiterWort: "Read on →",
      runter: "To the overview",
      weg: "This spot doesn't exist any more – ", wegLink: "here's the overview",
      namen: { chronik: "The Chronicle", questtafel: "The Quest Board", reise: "The Journey", gefaehrten: "The Companions", nsc: "Acquaintances", bestiarium: "The Bestiary", taverne: "The Tavern", buehne: "Barden Beats" },
      texte: {
        chronik: "The whole adventure, retold chapter by chapter.",
        questtafel: "Open questions, clues and red threads.",
        reise: "Every stop of the party on the map.",
        gefaehrten: "Four heroes and a dog – who they are.",
        nsc: "Friend, foe and question mark.",
        bestiarium: "Everything that wanted to eat us.",
        taverne: "Heldensturm, Friedrich's Hunt, Ezekiel's Long Night, Echo's Hoard, Barradin's Performance, Praise & Mockery and Bestiary Memory.",
        taverneKurz: "Roll, fight, steal, sing – pull up a stool.",
        buehne: "Lautenwerk and Dungeon Master's console for your sessions."
      },
      zahl: { chronik: n => n + (n === 1 ? " chapter" : " chapters"), questtafel: n => n + " notes", reise: n => n + " stops", gefaehrten: () => "5 companions", nsc: n => n + " faces", bestiarium: n => n + " creatures", taverne: () => "8 games", buehne: () => "♪ Music" }
    }
  };
  const t = () => TX[sprache()];
  const BILDER = {
    questtafel: "questtafel-wand.jpg", reise: "unterreich-karte.jpg", gefaehrten: "gundren-treffen.jpg",
    nsc: "buergermeister-streit.jpg", bestiarium: "demogorgon-karte.webp", taverne: "vorschau/taverne-kopf.webp", buehne: "kuo-toa-stadt.jpg"
  };

  /* ---------- Kacheln als Collagen: freigestellte Figuren, Fotos, Skizzen und Zettel in Ebenen – jede Kachel mit eigenem Look ---------- */
  const kImg = (src, cls, d, stil) => '<img class="k-l ' + cls + '" src="' + src + '" alt="" loading="lazy" decoding="async" style="--d:' + d + (stil ? ";" + stil : "") + '">';
  const kKlein = f => "vorschau/klein/" + String(f).split("/").pop().replace(/\.(jpe?g|png|webp)$/i, ".webp");
  const kFoto = (src, cls, d, gross) => '<span class="k-l k-foto ' + cls + '" style="--d:' + d + '"><img src="' + kKlein(src) + '" data-gross="' + src + '" alt="" loading="lazy" decoding="async" onerror="if(this.src.indexOf(this.dataset.gross)<0)this.src=this.dataset.gross"></span>';
  /* Bestiarium-Kachel: Georgs Collage aus seinem Format-Projekt, Ebene für Ebene (Name, x %, y %, Breite %, Drehung, Tiefe, Filter) */
  const BEST_EBENEN = [
    ["drache2",82.73,78.32,53.51,0.0,0.35,""],
    ["drache",66.83,40.38,77.35,0.0,0.4,"drop-shadow(0 0 1.3px rgba(222,178,90,0.89)) drop-shadow(0 3px 6px rgba(0,0,0,0.64))"],
    ["demogorgon",72.67,64.30,79.76,13.8,0.8,"drop-shadow(0 0 1.0px rgba(222,178,90,0.71)) drop-shadow(0 3px 6px rgba(0,0,0,0.65))"],
    ["riese",36.71,85.83,38.98,0.0,1.4,"drop-shadow(0 0 0.9px rgba(222,178,90,0.65)) drop-shadow(0 3px 6px rgba(0,0,0,0.38))"],
    ["bugbear",15.80,77.92,56.26,0.0,2.2,"drop-shadow(0 0 0.9px rgba(222,178,90,0.65)) drop-shadow(0 3px 6px rgba(0,0,0,0.51))"],
    ["chasme",12.44,24.45,41.49,-33.7,1.8,"drop-shadow(0 0 1.1px rgba(222,178,90,0.77)) drop-shadow(0 3px 6px rgba(0,0,0,0.47))"],
    ["kuotoa2",59.56,84.92,28.39,0.0,2.4,"drop-shadow(0 0 0.9px rgba(222,178,90,0.65)) drop-shadow(0 3px 6px rgba(0,0,0,0.49))"],
    ["kuotoa",78.26,82.14,37.40,0.0,2.8,"drop-shadow(0 0 1.1px rgba(222,178,90,0.77)) drop-shadow(0 3px 6px rgba(0,0,0,0.70))"],
    ["blight",32.45,87.60,47.50,0.0,3,"drop-shadow(0 0 0.8px rgba(222,178,90,0.55)) drop-shadow(0 3px 6px rgba(0,0,0,0.73))"]
  ];
  const COLLAGE = {
    /* aufgeschlagene Geschichte: Fotos der Kapitel wie in ein Tagebuch geklebt, davor der Erzähler */
    chronik: b => kImg(kKlein(b), "k-grund k-sepia", 0) +
      kFoto("hinterhalt-sieg.jpg", "k-c1", 1) + kFoto("gracklstugh.jpg", "k-c2", 1.4) + kFoto(b, "k-c3", 2) +
      '<span class="k-l k-tinte" style="--d:.6"></span>' + kImg("barradin-frei.webp", "k-held k-c-barradin", 3),
    /* das Brett: Zettel, Nadeln und rote Fäden */
    questtafel: () => kImg(kKlein("questtafel-wand.jpg"), "k-grund k-holz", 0) +
      '<svg class="k-l k-faeden" viewBox="0 0 100 100" preserveAspectRatio="none" style="--d:1"><path d="M22 24 L70 18 L58 58 L22 24 M58 58 L84 70"/></svg>' +
      '<span class="k-l k-zettel k-z1" style="--d:1.2"><i>?</i></span><span class="k-l k-zettel k-z2" style="--d:1.6"><i>!</i></span><span class="k-l k-zettel k-z3" style="--d:1.3"></span>' +
      '<span class="k-l k-nadel" style="--d:1.2;left:22%;top:24%"></span><span class="k-l k-nadel" style="--d:1.6;left:70%;top:18%"></span><span class="k-l k-nadel" style="--d:1.3;left:58%;top:58%"></span><span class="k-l k-nadel" style="--d:1;left:84%;top:70%"></span>',
    /* alte Karte mit Reiseroute, Siegel und Windrose */
    reise: () => kImg(kKlein("weltkarte.jpg"), "k-grund k-karte", 0) +
      '<svg class="k-l k-route" viewBox="0 0 100 100" preserveAspectRatio="none" style="--d:1"><path d="M8 78 C 22 60, 30 70, 40 52 S 58 30, 70 38 S 86 20, 92 14"/>' +
      '<circle cx="8" cy="78" r="2.2"/><circle cx="40" cy="52" r="2.2"/><circle cx="70" cy="38" r="2.2"/><circle cx="92" cy="14" r="3"/></svg>' +
      '<span class="k-l k-rose" style="--d:1.6">✦</span><span class="k-l k-siegel" style="--d:2">I</span>',
    /* alle fünf als Gruppenbild am Feuer */
    gefaehrten: () => '<span class="k-l k-feuerglut" style="--d:0"></span>' +
      kImg("echo-frei.webp", "k-held k-g k-g-echo", 1.2) + kImg("ezekiel-frei.webp", "k-held k-g k-g-ezekiel", 1.4) + kImg("friedrich-frei.webp", "k-held k-g k-g-friedrich", 1.6) +
      kImg("rex-frei.webp", "k-held k-g k-g-rex", 2.8) + kImg("barradin-frei.webp", "k-held k-g k-g-barradin", 2.2) + '<span class="k-l k-funken" style="--d:3"></span>',
    /* Steckbriefe und Porträts an der Wand, davor wer gerade schimpft */
    nsc: () => '<span class="k-l k-wand" style="--d:0"></span>' + kFoto("portrait-koenig.jpg", "k-n1", 1) + kFoto("ploopploopeen.jpg", "k-n2", 1.3) + kFoto("portrait-riese.jpg", "k-n3", 1.1) +
      kImg("buergermeister-frei.webp", "k-held k-n-buerger", .8) + kImg("gundren-frei.webp", "k-held k-n-gundren", 2.4),
    /* Skizzenbuch: Tuschezeichnungen auf Pergament, eine Kreatur bricht heraus, Krallenspuren */
    bestiarium: () => '<span class="k-best-buehne"><img class="k-bl k-bl-grund" src="bestiarium-grund.webp?v=5" alt="" loading="lazy" style="--d:0">' +
      BEST_EBENEN.map(([n, x, y, w, r, d, f]) => '<img class="k-bl" src="bestiarium-' + n + '.webp?v=5" alt="" loading="lazy" decoding="async" style="--d:' + d + ";left:" + x + "%;top:" + y + "%;width:" + w + "%;rotate:" + r + "deg;filter:" + (f || "none") + '">').join("") +
      '</span><span class="k-l k-nebel k-nebel2" style="--d:1.4"></span>',
    /* die Spiele als aufgefächertes Blatt Karten */
    taverne: b => kImg(b.indexOf("vorschau/") === 0 ? b : kKlein(b), "k-grund k-dunkel", 0) +
      [["heldensturm", "38% 45%"], ["jagd", "50% 18%"], ["hort", "50% 22%"], ["nacht", "50% 14%"], ["kehle", "72% 20%"]].map(([n, fokus], i) => kImg("vorschau/plakat-" + n + ".webp", "k-plakat", 1 + i * .35, "--n:" + (i - 2) + ";object-position:" + fokus)).join(""),
    /* Bühne: Vorhang, Lichtkegel, eine leuchtende Laute und Noten */
    buehne: () => '<span class="k-l k-vorhang" style="--d:0"></span><span class="k-l k-licht" style="--d:.5"></span>' +
      kImg("skizze-laute.webp", "k-laute", 2) + '<span class="k-l k-noten" style="--d:2.6"><i>♪</i><i>♫</i><i>♩</i><i>♬</i></span>' +
      /* das Pult von Barden Beats als kleiner Bildschirm – läuft stumm in Schleife (bei „weniger Bewegung“ nur das Standbild) */
      '<span class="k-l k-pult" style="--d:.6"><video muted loop playsinline preload="none" poster="vorschau/pult-poster.webp?v=1"><source src="vorschau/pult-clip.webm?v=1" type="video/webm"><source src="vorschau/pult-clip.mp4?v=1" type="video/mp4"></video></span>'
  };

  /* ---------- Barden-Beats-Kachel: Pult-Video beim Drüberfahren bzw. am Handy, wenn die Kachel mittig im Bild ist ---------- */
  (function pultKachel() {
    const ruhig = () => window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
    const an = (k, ja) => {
      const v = k && k.querySelector(".k-pult video"); if (!v) return;
      if (ja && !ruhig()) { k.classList.add("pult-an"); const p = v.play(); if (p && p.catch) p.catch(() => k.classList.remove("pult-an")); }
      else { k.classList.remove("pult-an"); setTimeout(() => { if (!k.classList.contains("pult-an")) v.pause(); }, 500); }
    };
    document.addEventListener("pointerover", e => { if (e.pointerType !== "mouse") return; const k = e.target.closest && e.target.closest(".kachel"); if (k && k.querySelector(".k-pult") && !k.classList.contains("pult-an")) an(k, true); });
    document.addEventListener("pointerout", e => { if (e.pointerType !== "mouse") return; const k = e.target.closest && e.target.closest(".kachel"); if (k && k.classList.contains("pult-an") && !(e.relatedTarget && k.contains(e.relatedTarget))) an(k, false); });
    document.addEventListener("focusin", e => { const k = e.target.closest && e.target.closest(".kachel"); if (k && k.querySelector(".k-pult")) an(k, true); });
    document.addEventListener("focusout", e => { const k = e.target.closest && e.target.closest(".kachel"); if (k && k.classList.contains("pult-an")) an(k, false); });
    /* Touch: kein Hover – das Video läuft, solange die Kachel in der Bildmitte steht */
    if (window.matchMedia && matchMedia("(hover: none)").matches) {
      let uhr = 0;
      const pruefen = () => { uhr = 0; document.querySelectorAll(".kachel").forEach(k => { if (!k.querySelector(".k-pult")) return; const r = k.getBoundingClientRect(), mitte = innerHeight / 2; const drin = r.top < mitte + innerHeight * .2 && r.bottom > mitte - innerHeight * .2; if (drin !== k.classList.contains("pult-an")) an(k, drin); }); };
      window.addEventListener("scroll", () => { if (!uhr) uhr = setTimeout(pruefen, 150); }, { passive: true });
    }
  })();

  /* ---------- Chronik: lebende Seitenränder und „Was bisher geschah“ (chronik/) ----------
     Werden erst geladen, wenn die Chronik aufgeht (oder nach dem Laden in einer ruhigen Sekunde). */
  const CHRONIK_V = "20261108d";
  let chronikGeladen = false;
  function chronikLaden() {
    if (chronikGeladen) return;
    chronikGeladen = true;
    ["chronik/kulissen.js", "chronik/rueckblick.js", "chronik/hoerspiel.js", "chronik/vorlesen.js"].forEach(f => {
      const sc = document.createElement("script");
      sc.src = f + "?v=" + CHRONIK_V; sc.async = false;
      document.body.appendChild(sc);
    });
  }
  window.addEventListener("load", () => {
    const spaeter = window.requestIdleCallback || (f => setTimeout(f, 2500));
    spaeter(chronikLaden, { timeout: 6000 });
  }, { once: true });

  /* ---------- Ansichten ---------- */
  const sektion = id => { const s = $(id); return s && s.matches("section.part") ? s : null; };
  const vorhanden = id => { const s = sektion(id); return !!s && !s.hidden; };
  let ansicht = null;
  function ansichtVon(el) {
    if (!el) return "start";
    if (typeof el === "string") el = $(el) || null;
    if (!el) return "start";
    if (start.contains(el)) return "start";
    const s = el.closest && el.closest("section.part");
    /* Versteckte Bereiche (z. B. alter Link #kuenste, leere Questtafel) zeigen die Startseite statt einer leeren Seite */
    return s && !s.hidden ? s.id : "start";
  }
  function setze(neu) {
    if (neu === ansicht) return;
    ansicht = neu;
    document.body.classList.toggle("ansicht-start", neu === "start");
    document.body.classList.toggle("ansicht-bereich", neu !== "start");
    document.querySelectorAll("section.part").forEach(s => s.classList.toggle("aktiv", s.id === neu));
    const nav = document.querySelector(".top nav");
    document.querySelectorAll(".top nav a[href^='#']").forEach(a => {
      if (a.getAttribute("href") === "#" + neu) {
        a.setAttribute("aria-current", "page");
        if (nav && nav.scrollWidth > nav.clientWidth) nav.scrollTo({ left: Math.max(0, a.offsetLeft - 24), behavior: ruhig ? "auto" : "smooth" });
      } else a.removeAttribute("aria-current");
    });
    if (neu === "start") halleStarten(); else halleAnhalten();
    if (neu === "chronik") chronikLaden();
    /* Karten, Tafel usw. neu vermessen lassen, die vorher unsichtbar waren */
    requestAnimationFrame(() => window.dispatchEvent(new Event("resize")));
  }
  const kopfHoehe = () => { const k = document.querySelector(".top"); return k ? k.offsetHeight : 0; };
  function hinScrollen(el) {
    if (!el || el.matches("section.part") || el.id === "startseite") { window.scrollTo({ top: 0, behavior: "instant" }); return; }
    const y = el.getBoundingClientRect().top + window.pageYOffset - kopfHoehe() - 12;
    window.scrollTo({ top: Math.max(0, y), behavior: "instant" });
  }
  function ziel(hash) {
    let id = String(hash || "").replace(/^#/, "");
    try { id = decodeURIComponent(id); } catch (_) {}
    if (!id || id === "start") return null;
    /* index.html kennt auch die Anker der anderen Sprache (alte deutsche Links auf Englisch und umgekehrt) */
    try { return window.ImresAnker ? window.ImresAnker.finde(id) : document.getElementById(id); } catch (_) { return null; }
  }
  function route(hash, scrollen) {
    const el = ziel(hash);
    const neu = ansichtVon(el);
    setze(neu);
    if (scrollen !== false) requestAnimationFrame(() => hinScrollen(neu === "start" && el && !start.contains(el) ? null : el));
  }

  /* ---------- Verlauf: Zurück/Vor stellen Ansicht UND Scrollposition wieder her ----------
     Jeder Eintrag merkt sich seine Scrollposition (replaceState, nur nach dem Scrollen – erzeugt keine neuen Einträge).
     Neue Einträge entstehen nur bei Klicks bzw. Sprüngen, die der Besucher selbst auslöst. */
  try { if ("scrollRestoration" in history) history.scrollRestoration = "manual"; } catch (_) {}
  function merkeScroll() {
    try { const st = history.state && typeof history.state === "object" ? history.state : {}; history.replaceState(Object.assign({}, st, { y: Math.round(window.pageYOffset) }), "", location.href); } catch (_) {}
  }
  /* Gemerkt wird nur, wenn sich seit dem Scrollen die Adresse nicht geändert hat und gerade nichts wiederhergestellt wird */
  let scrollTimer = 0, stand = 0, stelltHer = false;
  window.addEventListener("scroll", () => {
    if (stelltHer) return;
    clearTimeout(scrollTimer);
    const bei = stand, url = location.href;
    /* nicht während ein Fenster offen ist (die Seite ist dann oft gesperrt und meldet falsche Positionen) */
    scrollTimer = setTimeout(() => { if (bei === stand && url === location.href && !stelltHer && !document.querySelector("dialog[open]") && getComputedStyle(document.documentElement).overflowY !== "hidden") merkeScroll(); }, 200);
  }, { passive: true });
  function neuerEintrag(adresse) {
    clearTimeout(scrollTimer); merkeScroll(); stand++;
    try { history.pushState(null, "", adresse); } catch (_) {}
  }
  let zuletztPop = "", popTimer = 0;
  function zurueckVor() {
    stand++; clearTimeout(scrollTimer); stelltHer = false;
    const st = history.state, y = st && typeof st.y === "number" ? st.y : null;
    zuletztPop = location.href; clearTimeout(popTimer); popTimer = setTimeout(() => { zuletztPop = ""; }, 120);
    if (y == null) { route(location.hash); return; }
    stelltHer = true;
    route(location.hash, false);
    window.scrollTo({ top: y, behavior: "instant" });
    /* und noch einmal nach den anderen Skripten (die Taverne baut ihre Kacheln in einem eigenen Schritt neu) */
    const bei = stand;
    setTimeout(() => requestAnimationFrame(() => requestAnimationFrame(() => {
      if (bei === stand) window.scrollTo({ top: y, behavior: "instant" });
      setTimeout(() => { if (bei === stand) stelltHer = false; }, 50);
    })), 60);
  }
  window.addEventListener("popstate", zurueckVor);
  /* hashchange kommt bei Zurück/Vor zusätzlich zu popstate – dann nicht doppelt; sonst (Adresse von Hand geändert) normal */
  window.addEventListener("hashchange", () => { if (location.href !== zuletztPop) { route(location.hash); pruefeAdresse(); } });

  /* Für Sprünge aus dem restlichen Code (Kapitelmenü, Suche, Karte …) */
  window.ImresAnsicht = { zeige: el => setze(ansichtVon(el)), merkeScroll: () => { clearTimeout(scrollTimer); merkeScroll(); stand++; stelltHer = false; } };

  document.addEventListener("click", e => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey) return;
    const a = e.target.closest && e.target.closest('a[href^="#"]');
    if (!a) return;
    const hash = a.getAttribute("href");
    if (hash === "#") return;
    const el = ziel(hash);
    if (hash !== "#start" && hash !== "#uebersicht" && !el) return;
    e.preventDefault();
    const adresse = hash === "#start" ? location.pathname + location.search : hash;
    const gleich = hash === "#start" ? !location.hash : location.hash === hash;
    if (!gleich) neuerEintrag(adresse);
    if (hash === "#uebersicht") { setze("start"); requestAnimationFrame(() => hinScrollen($("uebersicht"))); }
    else route(hash);
  });

  /* ---------- Unbekannte Adresse: Startseite und ein leiser Hinweis ---------- */
  function hinweis(html) {
    let t = document.querySelector(".ort-toast");
    if (!t) { t = document.createElement("div"); t.className = "ort-toast"; t.setAttribute("role", "status"); document.body.appendChild(t); }
    t.innerHTML = html;
    requestAnimationFrame(() => t.classList.add("an"));
    clearTimeout(hinweis.timer);
    hinweis.timer = setTimeout(() => { t.classList.remove("an"); }, 8000);
    t.onclick = e => { if (e.target.closest("a")) t.classList.remove("an"); };
  }
  /* Nur bei Adressen, die wie ein Anker aussehen und auch nach dem Laden aller Skripte nicht existieren */
  const BESONDERS = /^(start|uebersicht|en|de)$|test/i;
  function pruefeAdresse() {
    const hash = location.hash;
    let id = hash.replace(/^#/, ""); try { id = decodeURIComponent(id); } catch (_) {}
    if (!id || BESONDERS.test(id) || !/^[\w\u00c0-\u024f-]{2,120}$/.test(id)) return;
    const pruefen = () => {
      if (location.hash !== hash) return;
      const el = ziel(hash);
      if (el) {
        /* Erst später entstanden (z. B. #gaestebuch): jetzt richtig hinspringen */
        if (ansichtVon(el) !== ansicht) route(hash);
        else if (ansicht === "start" && start.contains(el)) hinScrollen(el);
        return;
      }
      try { history.replaceState(null, "", location.pathname + location.search); } catch (_) {}
      const T = t();
      hinweis(esc(T.weg) + '<a href="#uebersicht">' + esc(T.wegLink) + "</a>");
    };
    if (document.readyState === "complete") setTimeout(pruefen, 900);
    else window.addEventListener("load", () => setTimeout(pruefen, 900), { once: true });
  }

  /* ---------- Halle der Gefährten ---------- */
  let halleTimer = null, halleAktiv = 0, halleHover = false, halleHelden = [];
  /* Halle: gleiche Auflösung, aber als WebP (vorschau/halle/) – deutlich kleiner; sonst das Original */
  const halleBild = f => /\.jpe?g$/i.test(f) ? "vorschau/halle/" + String(f).split("/").pop().replace(/\.jpe?g$/i, ".webp") : f;
  function halleBauen() {
    const D = daten(), box = $("halle");
    const helden = [];
    const begleiter = [];
    (D.helden || []).forEach(h => { helden.push(h); if (h.begleiter) begleiter.push(h.begleiter); });
    helden.push(...begleiter); /* Rex läuft hinterher */
    box.innerHTML = helden.map((h, i) =>
      '<a class="halle-tafel" href="#' + esc(h.id) + '" style="--i:' + i + '">' +
        '<img src="' + esc(halleBild(h.bild)) + '" data-gross="' + esc(h.bild) + '" onerror="if(this.dataset.gross&&this.src.indexOf(this.dataset.gross)<0)this.src=this.dataset.gross" alt="' + esc(h.name) + '" style="object-position:' + esc(h.fries || "50% 30%") + '"' + (i ? ' fetchpriority="low"' : ' fetchpriority="high"') + '>' +
        "</a>").join("");
    halleHelden = helden;
    $("halle-namen").innerHTML = '<span class="hn-zeile">' + helden.map((h, i) =>
      '<a class="hn" href="#' + esc(h.id) + '" data-i="' + i + '">' + esc(h.name) + "</a>").join('<span class="hn-punkt"> · </span>') +
      '</span><span class="hn-rolle" id="halle-rolle" aria-live="polite"></span>';
    $("halle-namen").querySelectorAll(".hn").forEach(a => {
      a.addEventListener("mouseenter", () => { halleHover = true; halleAktiv = +a.dataset.i; halleMarkieren(); });
      a.addEventListener("mouseleave", () => { halleHover = false; });
      a.addEventListener("focus", () => { halleAktiv = +a.dataset.i; halleMarkieren(); });
    });
    halleAktiv = Math.min(halleAktiv, Math.max(0, helden.length - 1));
    halleMarkieren();
    box.onmouseenter = () => { halleHover = true; };
    box.onmouseleave = () => { halleHover = false; halleMarkieren(); };
    box.querySelectorAll(".halle-tafel").forEach((a, i) => {
      a.addEventListener("mouseenter", () => { halleAktiv = i; halleMarkieren(); });
      a.addEventListener("focus", () => { halleAktiv = i; halleMarkieren(); });
    });
    requestAnimationFrame(() => box.classList.add("geladen"));
  }
  function halleMarkieren() {
    document.querySelectorAll("#halle .halle-tafel").forEach((a, i) => a.classList.toggle("vorn", i === halleAktiv));
    document.querySelectorAll("#halle-namen .hn").forEach((a, i) => a.classList.toggle("an", i === halleAktiv));
    const r = $("halle-rolle"), h = halleHelden[halleAktiv];
    if (r && h && r.dataset.wer !== h.id + ":" + (h.rolle || "")) {
      r.dataset.wer = h.id + ":" + (h.rolle || "");
      r.classList.remove("rein"); void r.offsetWidth; r.textContent = h.rolle || ""; r.classList.add("rein");
    }
  }
  function halleStarten() {
    if (halleTimer || ruhig) return;
    halleTimer = setInterval(() => {
      if (halleHover || document.hidden) return;
      const n = document.querySelectorAll("#halle .halle-tafel").length;
      if (!n) return;
      halleAktiv = (halleAktiv + 1) % n; halleMarkieren();
    }, 3600);
  }
  function halleAnhalten() { clearInterval(halleTimer); halleTimer = null; }

  /* ---------- Zuletzt geschehen: der neueste Abschnitt der Chronik ---------- */
  const slug = x => String(x).toLowerCase().replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  function zuletztGeschehen(k) {
    const abs = k.absaetze || [];
    /* Wo ging die Geschichte zuletzt weiter? „neuAb“ im Kapitel nennt den ersten Abschnitt der neuesten Sitzung –
       so landet man dort, wo es brandneu weitergeht, und nicht am Ende (kein Spoiler). Sonst: letzter Abschnitt. */
    let start = -1;
    if (k.neuAb) start = abs.findIndex(p => p.indexOf("## ") === 0 && p.slice(3).trim() === String(k.neuAb).trim());
    if (start < 0) abs.forEach((p, i) => { if (p.indexOf("## ") === 0) start = i; });
    const titel = start > -1 ? abs[start].slice(3).trim() : "";
    let ende = abs.findIndex((p, i) => i > start && p.indexOf("## ") === 0);
    const teil = abs.slice(start + 1, ende < 0 ? abs.length : ende);
    const bildVon = p => p.slice(1).split("|")[0].trim();
    let bild = (teil.find(p => p.charAt(0) === "!") || "");
    if (!bild) for (let i = start; i >= 0; i--) if (abs[i].charAt(0) === "!") { bild = abs[i]; break; }
    const roh = teil.filter(p => p.charAt(0) !== "!").map(p => p.replace(/<[^>]+>/g, "")).join(" ").replace(/\s+/g, " ").trim();
    let text = roh;
    if (text.length > 260) {
      const cut = text.slice(0, 260), ende = Math.max(cut.lastIndexOf(". "), cut.lastIndexOf("! "), cut.lastIndexOf("? "));
      text = ende > 120 ? cut.slice(0, ende + 1) : cut.replace(/\s+\S*$/, "") + " …";
    }
    return { titel, text, bild: bild ? bildVon(bild) : "", id: titel ? "kapitel-" + slug(k.nummer) + "-" + slug(titel) : "" };
  }

  /* ---------- Übersicht ---------- */
  function anzahl(id) {
    const D = daten();
    if (id === "chronik") return (D.kapitel || []).length;
    if (id === "questtafel") return document.querySelectorAll("#quests .pin-note").length || ((D.questtafel && D.questtafel.karten) || []).length;
    if (id === "reise") return document.querySelectorAll("#stops > li").length;
    if (id === "nsc") return (D.nsc || []).length;
    if (id === "bestiarium") return (D.bestiarium || []).length;
    return 0;
  }
  function uebersichtBauen() {
    const T = t(), D = daten(), kap = D.kapitel || [];
    const letztes = kap[kap.length - 1];
    const wl = $("weiterlesen");
    if (letztes) {
      wl.hidden = false;
      const z = zuletztGeschehen(letztes);
      wl.href = z.id ? "#" + z.id : "#kapitel-" + letztes.nummer;
      wl.classList.toggle("mit-bild", !!z.bild);
      wl.innerHTML = (z.bild ? '<span class="zl-bild"><img src="' + esc(z.bild) + '" alt="" loading="lazy" decoding="async"></span>' : "") +
        '<span class="zl-text"><small>' + esc(T.zuletzt) + " · " + esc(T.kapitelWort) + " " + esc(letztes.nummer) + " · " + esc(letztes.titel) + "</small>" +
        '<span class="zl-titel">' + esc(z.titel || letztes.titel) + "</span>" +
        (z.text ? '<span class="zl-auszug">' + esc(z.text) + "</span>" : "") +
        "<b>" + esc(T.weiterWort) + "</b></span>";
    } else wl.hidden = true;
    const kacheln = BEREICHE.filter(vorhanden);
    /* Kacheln sind klein – kompakte Bildversion aus vorschau/klein/, sonst (onerror) das Original */
    const klein = f => "vorschau/klein/" + String(f).split("/").pop().replace(/\.(jpe?g|png|webp)$/i, ".webp");
    const bild = id => id === "chronik" ? ((letztes && letztes.bild) || "aufbruch-neverwinter.jpg") : BILDER[id];
    $("kacheln").innerHTML = kacheln.map((id, i) =>
      '<a class="kachel k-' + id + '" href="#' + id + '" style="--i:' + i + '">' +
        (COLLAGE[id] ? '<span class="k-collage" aria-hidden="true">' + COLLAGE[id](bild(id), klein) + "</span>" : '<img src="' + esc(klein(bild(id))) + '" data-gross="' + esc(bild(id)) + '" alt="" loading="lazy" onerror="if(this.dataset.gross&&this.src.indexOf(this.dataset.gross)<0)this.src=this.dataset.gross">') +
        '<span class="kachel-text"><span class="kachel-zahl">' + esc(T.zahl[id](anzahl(id))) + "</span>" +
        "<b>" + esc(T.namen[id]) + "</b><small>" + (T.texte[id + "Kurz"] ? '<span class="k-lang">' + esc(T.texte[id]) + '</span><span class="k-kurz">' + esc(T.texte[id + "Kurz"]) + "</span>" : esc(T.texte[id])) + "</small></span></a>").join("");
    if (!ruhig && matchMedia("(hover: hover)").matches) document.querySelectorAll("#kacheln .kachel").forEach(k => {
      const c = k.querySelector(".k-collage"); if (!c) return;
      k.addEventListener("pointermove", e => { const r = k.getBoundingClientRect(); c.style.setProperty("--mx", (((e.clientX - r.left) / r.width) * 2 - 1).toFixed(3)); c.style.setProperty("--my", (((e.clientY - r.top) / r.height) * 2 - 1).toFixed(3)); });
      k.addEventListener("pointerleave", () => { c.style.setProperty("--mx", 0); c.style.setProperty("--my", 0); });
    });
    if (window.IntersectionObserver && !ruhig) {
      const io = new IntersectionObserver(eintraege => eintraege.forEach(en => {
        if (en.isIntersecting) { en.target.classList.add("sichtbar"); io.unobserve(en.target); }
      }), { rootMargin: "0px 0px -8% 0px" });
      document.querySelectorAll("#kacheln .kachel").forEach(k => io.observe(k));
    } else document.querySelectorAll("#kacheln .kachel").forEach(k => k.classList.add("sichtbar"));
    const r = document.querySelector(".halle-runter"); if (r) r.setAttribute("aria-label", T.runter);
  }

  /* ---------- Navigation in den Bereichen ---------- */
  function bereichsNavigation() {
    const T = t(), liste = BEREICHE.filter(vorhanden);
    BEREICHE.forEach(id => {
      const s = sektion(id); if (!s) return;
      const wrap = s.querySelector(".wrap"); if (!wrap) return;
      let oben = wrap.querySelector(":scope > .bereich-zurueck");
      if (!oben) { oben = document.createElement("a"); oben.className = "bereich-zurueck"; oben.href = "#start"; wrap.prepend(oben); }
      oben.textContent = T.uebersicht;
      let unten = wrap.querySelector(":scope > .bereich-weiter");
      if (!unten) { unten = document.createElement("nav"); unten.className = "bereich-weiter"; wrap.appendChild(unten); }
      const i = liste.indexOf(id), vor = liste[i - 1], nach = liste[i + 1];
      unten.innerHTML =
        (vor ? '<a href="#' + vor + '" class="vor"><small>' + T.zurueck + "</small>← " + esc(T.namen[vor]) + "</a>" : '<a href="#start" class="vor"><small>' + T.zurueck + "</small>" + esc(T.uebersicht) + "</a>") +
        (nach ? '<a href="#' + nach + '" class="nach"><small>' + T.weiter + "</small>" + esc(T.namen[nach]) + " →</a>" : "");
    });
  }

  /* ---------- Aussehen ---------- */
  const css = document.createElement("style");
  css.textContent = `
body.ansicht-start main > section.part { display: none !important; }
body.ansicht-bereich #startseite { display: none; }
body.ansicht-bereich main > section.part:not(.aktiv) { display: none !important; }
body.ansicht-bereich main > section.part.aktiv { border-top: 0; padding-top: clamp(1.4rem, 4vw, 2.6rem); min-height: 70vh; }
.top nav a[aria-current="page"] { color: var(--ember); }

/* Halle der Gefährten */
.halle-start { position: relative; height: clamp(440px, calc(100svh - 5.5rem), 820px); overflow: hidden; }
.halle { position: absolute; inset: 0; display: flex; gap: 3px; }
.halle-tafel {
  position: relative; flex: 1 1 0; min-width: 0; overflow: hidden; display: block; text-decoration: none;
  transition: flex-grow .9s cubic-bezier(.3,.8,.3,1), filter .9s;
  filter: saturate(.55) brightness(.62);
  opacity: 0; transform: translateY(40px);
}
.halle.geladen .halle-tafel { animation: tafelauf 1s cubic-bezier(.2,.8,.3,1) forwards; animation-delay: calc(var(--i) * .13s + .1s); }
@keyframes tafelauf { to { opacity: 1; transform: none; } }
.halle-tafel.vorn { flex-grow: 2.3; filter: saturate(1.05) brightness(.95); }
.halle-tafel img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; animation: kenburns 18s ease-in-out infinite alternate; animation-delay: calc(var(--i) * -3.4s); }
@keyframes kenburns { from { transform: scale(1.02) translate(0, 0); } to { transform: scale(1.07) translate(-1%, -.5%); } }
.halle-tafel::after { content: ""; position: absolute; inset: 0; background: linear-gradient(180deg, rgba(16,14,21,.15) 35%, rgba(16,14,21,.92) 100%); }
.halle-name {
  position: absolute; z-index: 1; left: 0; right: 0; top: 4.2rem; text-align: center; padding: .5rem .9rem .55rem;
  width: fit-content; max-width: calc(100% - .8rem); margin: 0 auto; box-sizing: border-box;
  border: 1px solid rgba(224,160,70,.7); background: rgba(16,14,21,.6); -webkit-backdrop-filter: blur(3px); backdrop-filter: blur(3px);
  box-shadow: inset 0 0 0 3px rgba(16,14,21,.35), 0 4px 18px rgba(0,0,0,.45);
  font-family: var(--display); font-size: clamp(1rem, 2.4vw, 1.7rem); color: var(--vellum); line-height: 1.05;
  opacity: 0; transform: translateY(-8px); transition: opacity .6s .15s, transform .6s .15s; text-shadow: 0 2px 10px rgba(0,0,0,.8);
}
.halle-name small { display: block; margin-top: .3rem; font-family: var(--body); font-size: .55em; letter-spacing: .2em; text-transform: uppercase; color: var(--ember); }
.halle-tafel.vorn .halle-name { opacity: 1; transform: none; }
.halle-titel {
  position: absolute; z-index: 2; left: 0; right: 0; bottom: 0; padding: 3rem 16px clamp(2.6rem, 6vw, 4rem); text-align: center; pointer-events: none;
  background: linear-gradient(180deg, transparent, rgba(16,14,21,.75) 45%, var(--night));
}
.halle-titel .label { opacity: 0; animation: einblenden 1s .9s forwards; }
.halle-titel h1 {
  margin: .4rem 0 .2rem; font-size: clamp(3rem, 12vw, 8rem); line-height: .9; letter-spacing: .02em;
  background: linear-gradient(100deg, var(--vellum) 0%, var(--vellum) 38%, #fff3d0 48%, var(--ember) 56%, var(--vellum) 66%, var(--vellum) 100%);
  background-size: 250% 100%; background-position: 100% 0;
  -webkit-background-clip: text; background-clip: text; color: transparent;
  filter: drop-shadow(0 4px 18px rgba(0,0,0,.7));
  opacity: 0; animation: einblenden 1.2s .6s forwards, schimmer 7s 2s ease-in-out infinite;
}
@keyframes schimmer { 0% { background-position: 100% 0; } 45%, 100% { background-position: -50% 0; } }
@keyframes einblenden { to { opacity: 1; } }
.halle-namen { display: grid; justify-items: center; gap: .35rem; font-family: var(--name); font-style: italic; font-size: clamp(.95rem, 2.4vw, 1.3rem); color: var(--ash); opacity: 0; animation: einblenden 1s 1.2s forwards; }
.halle-namen .hn { pointer-events: auto; color: inherit; text-decoration: none; padding: .1rem .05rem; transition: color .5s, text-shadow .5s, opacity .5s; opacity: .75; }
.halle-namen .hn.an { color: var(--ember); opacity: 1; text-shadow: 0 0 14px rgba(224,160,70,.55); }
.halle-namen .hn:hover, .halle-namen .hn:focus-visible { color: var(--vellum); opacity: 1; }
.halle-namen .hn-punkt { opacity: .5; }
.hn-rolle { display: block; min-height: 1.2em; font-family: var(--body); font-style: normal; font-size: .62em; font-weight: 600; letter-spacing: .24em; text-transform: uppercase; color: var(--vellum); opacity: .85; }
.hn-rolle.rein { animation: rolleRein .6s ease both; }
@keyframes rolleRein { from { opacity: 0; transform: translateY(4px); } to { opacity: .85; transform: none; } }
.halle-name { display: none; }
.halle-runter {
  position: absolute; z-index: 3; left: 50%; bottom: .4rem; transform: translateX(-50%);
  font-size: 2rem; line-height: 1; color: var(--ember); text-decoration: none; animation: huepfen 2.2s ease-in-out infinite;
}
@keyframes huepfen { 50% { transform: translate(-50%, 6px); } }

.start-rest { padding-block: clamp(1.5rem, 4vw, 2.5rem) clamp(3rem, 8vw, 5rem); display: grid; gap: 1.6rem; }
.start-rest .gm { margin-top: 0; }
.start-rest .lede { max-width: 40rem; font-size: 1.15rem; color: var(--ash); font-style: italic; }
.weiterlesen {
  position: relative; display: grid; gap: .2rem; justify-items: start; padding: 1.1rem 1.3rem; text-decoration: none;
  border: 1px solid var(--ember); background: linear-gradient(100deg, rgba(224,160,70,.16), rgba(224,160,70,.03) 70%);
  font-family: var(--name); font-size: clamp(1.25rem, 3.4vw, 1.7rem); color: var(--vellum); overflow: hidden;
}
.weiterlesen small { font-family: var(--body); font-size: .72rem; font-weight: 600; letter-spacing: .18em; text-transform: uppercase; color: var(--ember); }
.weiterlesen b { font-family: var(--body); font-weight: 600; font-size: .9rem; color: var(--ember); margin-top: .2rem; }
.weiterlesen::after { content: ""; position: absolute; inset: 0; background: linear-gradient(100deg, transparent 30%, rgba(255,230,180,.12) 50%, transparent 70%); transform: translateX(-100%); animation: glanz 5s 1.5s ease-in-out infinite; }
@keyframes glanz { 30%, 100% { transform: translateX(100%); } }
.weiterlesen.mit-bild { grid-template-columns: minmax(8rem, 15rem) 1fr; gap: 0; padding: 0; justify-items: stretch; }
.zl-bild { position: relative; overflow: hidden; min-height: 9rem; }
.zl-bild img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; object-position: 50% 18%; transition: transform 1.2s ease; }
.weiterlesen:hover .zl-bild img { transform: scale(1.05); }
.zl-text { display: grid; gap: .3rem; justify-items: start; align-content: center; padding: 1.1rem 1.3rem; }
.weiterlesen.mit-bild .zl-text { padding: 1.1rem 1.4rem 1.2rem; }
.zl-titel { font-family: var(--name); font-size: clamp(1.3rem, 3.4vw, 1.8rem); line-height: 1.15; color: var(--vellum); }
.zl-auszug { font-family: var(--body); font-size: 1rem; line-height: 1.55; color: var(--ash); max-width: 38rem; }
@media (max-width: 560px) { .weiterlesen.mit-bild { grid-template-columns: 1fr; } .zl-bild { min-height: 10rem; } }
.weiterlesen:hover { background: linear-gradient(100deg, rgba(224,160,70,.28), rgba(224,160,70,.06) 70%); }

.kacheln { display: grid; gap: clamp(.7rem, 2vw, 1.1rem); grid-template-columns: repeat(2, minmax(0, 1fr)); }
@media (min-width: 760px) { .kacheln { grid-template-columns: repeat(4, minmax(0, 1fr)); } .kachel.k-chronik { grid-column: span 2; grid-row: span 2; } }
.kachel {
  position: relative; display: flex; flex-direction: column; justify-content: flex-end; overflow: hidden; min-height: clamp(150px, 26vw, 210px); text-decoration: none;
  border: 1px solid var(--line); background: var(--hall);
  opacity: 0; transform: translateY(24px); transition: opacity .7s ease, transform .7s ease, border-color .3s, box-shadow .3s;
  transition-delay: calc(var(--i) * 70ms);
}
.kachel.sichtbar { opacity: 1; transform: none; }
.kachel img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; filter: saturate(.75) brightness(.6); transition: transform .9s cubic-bezier(.2,.8,.3,1), filter .6s; }
.kachel::after { content: ""; position: absolute; inset: 0; background: linear-gradient(180deg, rgba(16,14,21,0) 30%, rgba(16,14,21,.92)); }
.kachel:hover, .kachel:focus-visible { border-color: var(--ember); box-shadow: 0 0 0 1px var(--ember), 0 12px 34px rgba(0,0,0,.55), 0 0 26px rgba(224,160,70,.18); }
.kachel:hover img, .kachel:focus-visible img { transform: scale(1.08); filter: saturate(1) brightness(.78); }
/* Text im Fluss statt absolut: wird er länger (schmales Handy, Englisch, „neu“-Zeichen), wächst die Kachel mit statt oben abzuschneiden */
.kachel-text { position: relative; z-index: 1; padding: .9rem; display: grid; gap: .15rem; }
.kachel-text b { font-family: var(--display); font-weight: 400; font-size: clamp(1.15rem, 2.8vw, 1.6rem); line-height: 1.05; color: var(--vellum); text-shadow: 0 2px 10px rgba(0,0,0,.95), 0 0 2px rgba(0,0,0,.8); }
.kachel-text small { text-shadow: 0 1px 6px rgba(0,0,0,.95); }
.kachel.k-chronik .kachel-text b { font-size: clamp(1.5rem, 4vw, 2.6rem); }
.kachel-text small { font-size: .82rem; line-height: 1.35; color: var(--ash); }
.kachel-zahl { justify-self: start; font-size: .66rem; font-weight: 600; letter-spacing: .14em; text-transform: uppercase; color: var(--night); background: var(--ember); padding: .1rem .45rem; margin-bottom: .25rem; }
.kachel.k-buehne .kachel-zahl { background: #7fd36b; }
.kachel .k-kurz { display: none; }
/* ---------- Collagen ---------- */
.k-collage { position: absolute; inset: 0; overflow: hidden; --mx: 0; --my: 0; }
.kachel .k-collage img { inset: auto; width: auto; height: auto; max-width: none; object-fit: contain; filter: none; transition: transform .7s cubic-bezier(.2,.8,.3,1), filter .6s; }
.kachel:hover .k-collage img, .kachel:focus-visible .k-collage img { transform: translate(calc(var(--mx) * var(--d, 1) * -7px), calc(var(--my) * var(--d, 1) * -5px)) var(--t, ); }
.kachel .k-collage .k-foto img { position: static; width: 100%; height: 100%; object-fit: cover; filter: sepia(.25) saturate(.85); transform: none; }
.k-l { position: absolute; display: block; transition: transform .7s cubic-bezier(.2,.8,.3,1), filter .6s; transform: translate(calc(var(--mx) * var(--d, 1) * -7px), calc(var(--my) * var(--d, 1) * -5px)) var(--t, ); }
.kachel:hover .k-l, .kachel:focus-visible .k-l { transition-duration: .25s; }
.kachel .k-collage .k-grund { inset: -6%; width: 112%; height: 112%; object-fit: cover; }
.kachel .k-collage .k-sepia { filter: sepia(.55) saturate(.7) brightness(.42) blur(1.5px); }
.kachel .k-collage .k-holz { filter: saturate(.85) brightness(.62); }
.kachel .k-collage .k-karte { filter: sepia(.8) saturate(.9) brightness(.55) contrast(1.1); }
.kachel .k-collage .k-dunkel { filter: saturate(.7) brightness(.32) blur(1px); }
.kachel:hover .k-collage .k-grund { filter: saturate(1) brightness(.6); }
.k-collage:has(.k-best-buehne) { container-type: size; }
.k-best-buehne { position: absolute; left: 50%; top: 50%; width: max(100cqw, calc(100cqh * 955 / 840)); aspect-ratio: 955 / 840; translate: -50% -50%; }
.kachel .k-collage .k-bl { position: absolute; height: auto; max-width: none; translate: -50% -50%; }
.kachel .k-collage .k-bl-grund { left: 50%; top: 50%; width: 102%; }
.kachel .k-collage .k-best-buehne { filter: brightness(.86); transition: filter .6s; }
.kachel:hover .k-collage .k-best-buehne, .kachel:focus-visible .k-collage .k-best-buehne { filter: brightness(1); }
/* Fotos: Pergamentrand, Klebestreifen */
.k-foto { padding: 3.5% 3.5% 9%; background: #e8dcc0; box-shadow: 0 6px 18px rgba(0,0,0,.6); }
.k-foto img { display: block; width: 100%; height: 100%; object-fit: cover; filter: sepia(.25) saturate(.85); }
.k-foto::before { content: ""; position: absolute; left: 50%; top: -6%; width: 34%; height: 11%; transform: translateX(-50%) rotate(-3deg); background: rgba(235,226,204,.55); box-shadow: 0 1px 2px rgba(0,0,0,.25); }
.k-c1 { left: 5%; top: 6%; width: 38%; height: 34%; --t: rotate(-7deg); }
.k-c2 { left: 40%; top: 4%; width: 32%; height: 30%; --t: rotate(5deg); }
.k-c3 { left: 14%; top: 34%; width: 44%; height: 36%; --t: rotate(-2deg); }
.k-tinte { inset: 0; background: radial-gradient(ellipse 60% 50% at 30% 30%, transparent 60%, rgba(16,14,21,.5)), repeating-linear-gradient(-8deg, transparent 0 22px, rgba(224,160,70,.03) 22px 23px); }
.kachel .k-collage .k-held { filter: drop-shadow(0 0 1px rgba(255,210,140,.6)) drop-shadow(0 10px 14px rgba(0,0,0,.7)); }
.kachel .k-collage .k-c-barradin { right: -3%; bottom: 0; height: 74%; }
.kachel:hover .k-collage .k-held { filter: drop-shadow(0 0 2px rgba(255,200,120,.9)) drop-shadow(0 0 16px rgba(224,160,70,.45)) drop-shadow(0 10px 14px rgba(0,0,0,.7)); }
/* Questtafel */
.k-faeden { inset: 0; width: 100%; height: 100%; } .k-faeden path { fill: none; stroke: #c0392b; stroke-width: .7; vector-effect: non-scaling-stroke; stroke-width: 1.6; opacity: .9; }
.k-zettel { width: 26%; height: 34%; background: linear-gradient(#efe4c6, #dccb9f); box-shadow: 0 4px 10px rgba(0,0,0,.55); background-image: linear-gradient(#efe4c6, #dccb9f), repeating-linear-gradient(transparent 0 7px, rgba(90,70,40,.25) 7px 8px); background-blend-mode: multiply; display: grid; place-items: center; }
.k-zettel i { font-style: normal; font-family: var(--display); font-size: clamp(1.4rem, 4vw, 2.4rem); color: #6a2a1a; opacity: .8; }
.k-z1 { left: 12%; top: 18%; --t: rotate(-6deg); } .k-z2 { left: 60%; top: 10%; --t: rotate(7deg); width: 22%; } .k-z3 { left: 48%; top: 50%; --t: rotate(-3deg); width: 20%; height: 22%; }
.k-nadel { width: 9px; height: 9px; margin: -4px; border-radius: 50%; background: radial-gradient(circle at 35% 35%, #ff8a7a, #a3201a 60%); box-shadow: 0 2px 3px rgba(0,0,0,.6); }
/* Reise */
.k-route { inset: 0; width: 100%; height: 100%; } .k-route path { fill: none; stroke: #e0a046; stroke-width: 2; stroke-dasharray: 6 5; vector-effect: non-scaling-stroke; filter: drop-shadow(0 0 3px rgba(224,160,70,.6)); }
.k-route circle { fill: #e0a046; stroke: #3a2414; stroke-width: .6; }
.kachel:hover .k-route path { animation: kRoute 2.5s linear infinite; } @keyframes kRoute { to { stroke-dashoffset: -44; } }
.k-rose { right: 7%; bottom: 30%; font-size: clamp(1.8rem, 5vw, 3rem); color: rgba(235,226,204,.55); text-shadow: 0 0 8px rgba(0,0,0,.6); --t: rotate(12deg); }
.k-siegel { left: 64%; top: 8%; width: 2.2rem; height: 2.2rem; border-radius: 50%; display: grid; place-items: center; background: radial-gradient(circle at 35% 35%, #c0392b, #7a1410 70%); color: #f3c9a0; font-family: var(--display); font-size: 1.1rem; box-shadow: 0 3px 8px rgba(0,0,0,.6), inset 0 0 0 3px rgba(0,0,0,.18); --t: rotate(-12deg); }
/* Gefährten */
.k-feuerglut { inset: 0; background: radial-gradient(ellipse 70% 55% at 50% 105%, rgba(224,120,40,.55), rgba(120,50,20,.25) 45%, transparent 70%), linear-gradient(#141019, #1d1420); }
/* Gruppenbild: Größen hängen an der Kachelhöhe (cqh), die Gesichter verteilen sich über die Breite (cqw) –
   so bleibt jeder Kopf sichtbar, egal wie breit die Kachel auf dem Bildschirm gerade ist. --x = Gesicht in % der Breite,
   --fx = wo im Bild das Gesicht liegt, --r = Seitenverhältnis des Bilds */
.k-collage:has(.k-g-echo), .k-collage:has(.k-n-gundren), .k-collage:has(.k-plakat) { container-type: size; }
.kachel .k-collage .k-g { left: calc(var(--x) * 1cqw - var(--fx) * var(--r) * var(--h) * 1cqh); top: calc(var(--y) * 1cqh); height: calc(var(--h) * 1cqh); }
.kachel .k-collage .k-g-echo { --x: 13; --fx: .46; --r: 1.002; --h: 100; --y: -18; filter: brightness(.72) drop-shadow(0 8px 12px rgba(0,0,0,.7)); }
.kachel .k-collage .k-g-ezekiel { --x: 77; --fx: .5; --r: .745; --h: 102; --y: -2; filter: brightness(.9) drop-shadow(0 0 1px rgba(255,120,90,.5)) drop-shadow(0 8px 12px rgba(0,0,0,.7)); }
.kachel .k-collage .k-g-friedrich { --x: 33; --fx: .47; --r: 1.029; --h: 108; --y: 4; }
.kachel .k-collage .k-g-rex { --x: 92; --fx: .4; --r: .95; --h: 60; --y: 22; }
.kachel .k-collage .k-g-barradin { --x: 55; --fx: .5; --r: .866; --h: 112; --y: 12; }
.k-funken { inset: 0; background: radial-gradient(1.5px 1.5px at 20% 70%, #ffcf80, transparent), radial-gradient(1.5px 1.5px at 60% 50%, #ffcf80, transparent), radial-gradient(1px 1px at 80% 65%, #ffcf80, transparent), radial-gradient(1px 1px at 40% 35%, #ffcf80, transparent); opacity: .7; }
/* Bekanntschaften */
.k-wand { inset: 0; background: repeating-linear-gradient(90deg, #2a2024 0 34px, #261d21 34px 36px), #2a2024; }
.k-n1 { left: 5%; top: 8%; width: 28%; height: 44%; --t: rotate(-6deg); } .k-n2 { left: 36%; top: 4%; width: 26%; height: 40%; --t: rotate(4deg); } .k-n3 { left: 64%; top: 10%; width: 27%; height: 42%; --t: rotate(-3deg); }
/* Gundren groß vorne rechts, der Stadthalter klein, gespiegelt und abgedunkelt im Hintergrund links */
.kachel .k-collage .k-n-gundren { right: calc(4cqw - 4cqh); bottom: -5cqh; height: 96cqh; }
.kachel .k-collage .k-n-buerger { left: calc(66cqw - 30cqh); top: 12cqh; height: 32cqh; scale: -1 1; filter: brightness(.55) saturate(.8) blur(.4px) drop-shadow(0 6px 10px rgba(0,0,0,.7)); }
.kachel:hover .k-collage .k-n-buerger { filter: brightness(.7) saturate(.9) drop-shadow(0 6px 10px rgba(0,0,0,.7)); }
/* Bestiarium: eine Horde greift an – vorne die Kleinen, hinten immer größer und epischer, im Dunst */
.k-hoehle { inset: 0; background: radial-gradient(ellipse 80% 60% at 60% 20%, rgba(150,40,30,.45), transparent 70%), radial-gradient(ellipse 70% 50% at 20% 35%, rgba(90,40,120,.35), transparent 70%), linear-gradient(#120c14, #1d1218 60%, #120d12); }
.k-nebel { left: -10%; right: -10%; height: 36%; top: 34%; background: radial-gradient(ellipse 60% 50% at 50% 50%, rgba(120,80,110,.35), transparent 70%); filter: blur(6px); }
.k-nebel2 { top: 48%; height: 30%; background: radial-gradient(ellipse 70% 50% at 50% 50%, rgba(70,40,60,.5), transparent 70%); }
.kachel .k-collage .k-mon { filter: drop-shadow(0 6px 10px rgba(0,0,0,.75)); }
.kachel .k-collage .k-m-drache { right: -10%; top: -20%; height: 118%; filter: brightness(.62) saturate(.9) drop-shadow(0 0 22px rgba(220,50,20,.55)); }
.kachel .k-collage .k-m-demo { left: -16%; top: -6%; height: 80%; filter: brightness(.5) saturate(.75) drop-shadow(0 0 14px rgba(120,40,140,.5)); }
.kachel .k-collage .k-m-riese { left: 22%; top: 6%; height: 56%; filter: brightness(.7) saturate(.85) drop-shadow(0 0 10px rgba(200,120,60,.35)) drop-shadow(0 6px 10px rgba(0,0,0,.7)); }
.kachel .k-collage .k-m-vrock { left: 0; top: -2%; height: 28%; filter: brightness(.8) drop-shadow(0 6px 10px rgba(0,0,0,.7)); --t: rotate(-10deg); }
.kachel .k-collage .k-m-chasme { right: 26%; top: 2%; height: 24%; filter: brightness(.85) drop-shadow(0 6px 10px rgba(0,0,0,.7)); --t: rotate(12deg); }
.kachel .k-collage .k-m-bugbear { left: -2%; top: 30%; height: 42%; filter: brightness(1) drop-shadow(0 0 2px rgba(255,200,140,.4)) drop-shadow(0 8px 12px rgba(0,0,0,.85)); }
.kachel .k-collage .k-m-kuotoa { left: 30%; top: 34%; height: 40%; filter: brightness(1.2) drop-shadow(0 0 2px rgba(180,220,255,.45)) drop-shadow(0 8px 12px rgba(0,0,0,.85)); }
.kachel .k-collage .k-m-blight { right: -10%; top: 40%; height: 30%; filter: brightness(1.2) drop-shadow(0 8px 12px rgba(0,0,0,.85)); }
.kachel:hover .k-collage .k-m-drache { filter: brightness(.6) saturate(.9) drop-shadow(0 0 24px rgba(230,60,20,.7)); }
/* Taverne: Spiele als aufgefächerte Karten */
/* Abstand wächst mit der Kachelbreite, damit sich die Karten auf breiten Bildschirmen nicht über die Gesichter schieben */
.kachel .k-collage .k-plakat { --s: min(9.5cqw, 36cqh); left: calc(100cqw - 2 * var(--s) - 60cqh + var(--n) * var(--s) - 29cqh); bottom: -10%; height: 87%; aspect-ratio: 2 / 3; object-fit: cover; border: 3px solid #e8dcc0; border-radius: 4px; box-shadow: 0 8px 20px rgba(0,0,0,.7); transform-origin: 50% 120%; --t: rotate(calc(var(--n) * 9deg)); }
.kachel:hover .k-plakat { --t: rotate(calc(var(--n) * 12deg)) translateY(-6%); }
/* Bühne */
.k-vorhang { inset: 0; background: linear-gradient(180deg, rgba(0,0,0,.2), rgba(0,0,0,.55)), repeating-linear-gradient(90deg, #5a1420 0 18px, #7a1d2a 18px 30px, #4a0f19 30px 40px); }
.k-licht { inset: -10% -10% 0; background: conic-gradient(from 160deg at 30% -5%, transparent 0deg, rgba(255,220,150,.22) 12deg, transparent 26deg), conic-gradient(from 175deg at 72% -5%, transparent 0deg, rgba(160,220,255,.18) 12deg, transparent 26deg); }
.kachel .k-collage .k-laute { left: 4%; top: 6%; height: 70%; filter: brightness(1.4) sepia(1) saturate(3) hue-rotate(-5deg) drop-shadow(0 0 6px rgba(255,190,90,.7)); --t: rotate(-18deg); }
.k-noten { inset: 0; } .k-noten i { position: absolute; font-style: normal; color: #ffd78a; text-shadow: 0 0 8px rgba(255,190,90,.8); font-size: clamp(1rem, 2.6vw, 1.6rem); }
.k-noten i:nth-child(1) { left: 30%; top: 8%; } .k-noten i:nth-child(2) { left: 38%; top: 30%; font-size: 1.4em; } .k-noten i:nth-child(3) { left: 92%; top: 66%; } .k-noten i:nth-child(4) { left: 26%; top: 44%; }
/* Barden Beats: beim Drüberfahren (am Handy, sobald die Kachel mittig im Bild ist) läuft das Pult als Video über die ganze Kachel */
.k-collage:has(.k-pult) { container-type: size; }
.k-pult { inset: 0; opacity: 0; transition: opacity .5s; pointer-events: none;
  -webkit-mask-image: linear-gradient(180deg, #000 30%, rgba(0,0,0,.28) 70%, rgba(0,0,0,.12)); mask-image: linear-gradient(180deg, #000 30%, rgba(0,0,0,.28) 70%, rgba(0,0,0,.12)); }
.k-pult video { width: 100%; height: 100%; object-fit: cover; object-position: 50% 0; display: block; }
.kachel.pult-an .k-pult { opacity: 1; }
.kachel.pult-an .k-laute, .kachel.pult-an .k-noten { opacity: 0; transition: opacity .4s; }
.kachel:hover .k-noten i { animation: kNote 2.2s ease-in-out infinite; } .kachel:hover .k-noten i:nth-child(2n) { animation-delay: -1.1s; }
@keyframes kNote { 50% { transform: translateY(-8px) rotate(8deg); } }
@media (prefers-reduced-motion: reduce) { .k-l { transition: none; transform: var(--t, none); } .kachel:hover .k-noten i, .kachel:hover .k-route path { animation: none; } }
@media (max-width: 759px) { .kachel .k-lang { display: none; } .kachel .k-kurz { display: inline; } }

.bereich-zurueck { display: inline-block; margin-bottom: 1.2rem; font-size: .88rem; color: var(--ash); text-decoration: none; }
.bereich-zurueck:hover { color: var(--ember); }
.bereich-weiter { display: flex; justify-content: space-between; gap: 1rem; margin-top: clamp(2.5rem, 6vw, 4rem); padding-top: 1.2rem; border-top: 1px solid var(--line); }
.bereich-weiter a { display: grid; gap: .1rem; text-decoration: none; font-family: var(--display); font-size: clamp(1.05rem, 2.6vw, 1.35rem); color: var(--vellum); }
.bereich-weiter a small { font-family: var(--body); font-size: .68rem; letter-spacing: .16em; text-transform: uppercase; color: var(--ash); }
.bereich-weiter a.nach { text-align: right; margin-left: auto; }
.bereich-weiter a:hover { color: var(--ember); }

@media (max-width: 560px) {
  .halle-namen { font-size: .95rem; }
  .halle-tafel.vorn { flex-grow: 3.2; }
}
/* Ganz schmale Handys: Namenszeile etwas kleiner, damit die Kerze unten rechts nicht über „Rex“ liegt */
@media (max-width: 380px) { .halle-titel { padding-inline: 34px; } .halle-namen { font-size: .86rem; } }
@media (prefers-reduced-motion: reduce) {
  .halle-tafel, .halle-tafel img, .halle-titel h1, .halle-titel .label, .halle-namen, .halle-runter, .weiterlesen::after { animation: none !important; opacity: 1 !important; transform: none !important; }
  .kachel { opacity: 1; transform: none; }
}
`;
  document.head.appendChild(css);

  /* ---------- Start ---------- */
  function allesBauen() { halleBauen(); uebersichtBauen(); bereichsNavigation(); }
  allesBauen();
  /* Neu laden bzw. Zurück aus einer anderen Seite: an die gemerkte Stelle; sonst zum Anker im Link */
  const navArt = (() => { try { const n = performance.getEntriesByType("navigation")[0]; return n ? n.type : ""; } catch (_) { return ""; } })();
  const gemerktY = history.state && typeof history.state.y === "number" && (navArt === "reload" || navArt === "back_forward") ? history.state.y : null;
  if (gemerktY != null) {
    route(location.hash, false); stelltHer = true;
    const hin = () => window.scrollTo({ top: gemerktY, behavior: "instant" });
    hin(); requestAnimationFrame(hin);
    window.addEventListener("load", () => { if (Math.abs(window.pageYOffset - gemerktY) > 2 && stand === 0) hin(); stelltHer = false; }, { once: true });
  } else route(location.hash, !!location.hash);
  pruefeAdresse();
  /* Wird ein Bereich erst später sichtbar (oder wieder versteckt), die Ansicht zum aktuellen Link nachziehen */
  new MutationObserver(ms => {
    if (!ms.some(m => m.target.matches && m.target.matches("section.part"))) return;
    const el = ziel(location.hash);
    if (el && ansichtVon(el) !== ansicht) route(location.hash);
    else if (ansicht !== "start" && !vorhanden(ansicht)) route("#start", false);
  }).observe(document.querySelector("main") || document.body, { attributes: true, attributeFilter: ["hidden"], subtree: true });
  let letzteSprache = sprache();
  new MutationObserver(() => {
    if (sprache() === letzteSprache) return;
    letzteSprache = sprache();
    allesBauen();
  }).observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });
})();
