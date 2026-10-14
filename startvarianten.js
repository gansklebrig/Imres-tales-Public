/* =====================================================================
   STARTSEITE – DREI ALTERNATIVE LAYOUTS ZUM AUSPROBIEREN
   ---------------------------------------------------------------------
   Nur sichtbar mit ?layout=1, ?layout=2 oder ?layout=3 in der Adresse:
     1  Das Lagerfeuer   – die Gruppe sitzt um ein flackerndes Feuer
     2  Das Buch         – ein aufgeschlagenes Buch mit Inhaltsverzeichnis
     3  Die Karte        – alle Bereiche als Wegmarken auf der Karte
   Normale Besucher sehen weiterhin die Halle der Gefährten.
   Sobald ein Layout ausgewählt ist, wird diese Datei wieder entfernt.
   ===================================================================== */
(function () {
  "use strict";
  const $ = id => document.getElementById(id);
  const start = $("startseite");
  if (!start) return;

  let wahl = null;
  try {
    const p = new URLSearchParams(location.search).get("layout");
    if (p === "0") localStorage.removeItem("imres-layout-vorschau");
    else if (/^[123]$/.test(p || "")) localStorage.setItem("imres-layout-vorschau", p);
    wahl = localStorage.getItem("imres-layout-vorschau");
  } catch (_) {}
  if (!/^[123]$/.test(wahl || "")) return;

  const sprache = () => (document.documentElement.lang === "en" ? "en" : "de");
  const esc = s => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const daten = () => (sprache() === "en" ? (window.INHALT_EN || window.INHALT) : window.INHALT) || {};
  const BEREICHE = ["chronik", "questtafel", "reise", "gefaehrten", "nsc", "bestiarium", "taverne", "lautenwerk"];
  const vorhanden = id => { const s = $(id); return !!s && !s.hidden && !(s.closest("section.part") || s).hidden; };
  const SYMBOL = { chronik: "📜", questtafel: "📌", reise: "🗺", gefaehrten: "⚔", nsc: "👥", bestiarium: "💀", taverne: "🍺", lautenwerk: "🎵" };

  const TX = {
    de: {
      namen: { chronik: "Die Chronik", questtafel: "Die Questtafel", reise: "Die Reise", gefaehrten: "Die Gefährten", nsc: "Bekanntschaften", bestiarium: "Das Bestiarium", taverne: "Die Taverne", lautenwerk: "Barradins Lautenwerk" },
      kurz: { chronik: "Das Abenteuer, Kapitel für Kapitel", questtafel: "Offene Fragen und rote Fäden", reise: "Jede Station auf der Karte", gefaehrten: "Vier Helden und ein Hund", nsc: "Freund, Feind und Fragezeichen", bestiarium: "Alles, was uns fressen wollte", taverne: "Würfeln, Spotten, Memory", lautenwerk: "Bardenbeats mit der ganzen Band" },
      zahl: { chronik: n => n + " Kapitel", questtafel: n => n + " Zettel", reise: n => n + " Stationen", gefaehrten: () => "5 Gefährten", nsc: n => n + " Gesichter", bestiarium: n => n + " Kreaturen", taverne: () => "3 Spiele", lautenwerk: () => "neu" },
      feuer: "Setz dich ans Feuer, Wanderer. Die Gefährten haben einiges zu erzählen.",
      geschichten: "Geschichten am Feuer",
      weiter: (nr, titel) => "Kapitel " + nr + " · " + titel,
      zuletzt: "Zuletzt geschehen", lesen: "Weiterlesen",
      inhalt: "Inhalt", lesezeichen: "Lesezeichen",
      hier: "Hier sind wir", kartenTitel: "Die Wege der Gefährten",
      vorschau: "Layout-Vorschau", original: "Original"
    },
    en: {
      namen: { chronik: "The Chronicle", questtafel: "The Quest Board", reise: "The Journey", gefaehrten: "The Companions", nsc: "Acquaintances", bestiarium: "The Bestiary", taverne: "The Tavern", lautenwerk: "Barradin's Lute Machine" },
      kurz: { chronik: "The adventure, chapter by chapter", questtafel: "Open questions and red threads", reise: "Every stop on the map", gefaehrten: "Four heroes and a dog", nsc: "Friend, foe and question mark", bestiarium: "Everything that wanted to eat us", taverne: "Dice, mockery, memory", lautenwerk: "Bardic beats with the whole band" },
      zahl: { chronik: n => n + " chapters", questtafel: n => n + " notes", reise: n => n + " stops", gefaehrten: () => "5 companions", nsc: n => n + " faces", bestiarium: n => n + " creatures", taverne: () => "3 games", lautenwerk: () => "new" },
      feuer: "Sit by the fire, wanderer. The companions have quite a tale to tell.",
      geschichten: "Tales by the fire",
      weiter: (nr, titel) => "Chapter " + nr + " · " + titel,
      zuletzt: "Most recently", lesen: "Read on",
      inhalt: "Contents", lesezeichen: "Bookmark",
      hier: "We are here", kartenTitel: "The paths of the companions",
      vorschau: "Layout preview", original: "Original"
    }
  };
  const t = () => TX[sprache()];

  function helden() {
    const D = daten(), h = [], b = [];
    (D.helden || []).forEach(x => { h.push(x); if (x.begleiter) b.push(x.begleiter); });
    return h.concat(b);
  }
  function anzahl(id) {
    const D = daten();
    if (id === "chronik") return (D.kapitel || []).length;
    if (id === "questtafel") return document.querySelectorAll("#quests .pin-note").length;
    if (id === "reise") return document.querySelectorAll("#stops > li").length;
    if (id === "nsc") return (D.nsc || []).length;
    if (id === "bestiarium") return (D.bestiarium || []).length;
    return 0;
  }
  const bereiche = () => BEREICHE.filter(vorhanden);
  function letztes() { const k = daten().kapitel || []; return k[k.length - 1]; }
  const portraet = (h, klasse, extra) =>
    '<a class="' + klasse + '" href="#' + esc(h.id) + '"' + (extra || "") + '><span class="sv-rund"><img src="' + esc(h.bild) + '" alt="" style="object-position:' + esc(h.fries || "50% 30%") + '"></span><span class="sv-name">' + esc(h.name) + "</span></a>";

  /* ---------- 1: Das Lagerfeuer ---------- */
  function lagerfeuer() {
    const T = t(), hs = helden(), n = hs.length, l = letztes();
    const sitze = hs.map((h, i) => {
      const w = Math.PI * (.94 - (i / Math.max(1, n - 1)) * .88); /* Bogen um das Feuer */
      const x = 50 + Math.cos(w) * 38, y = 70 - Math.sin(w) * 48;
      return portraet(h, "sv-sitz", ' style="left:' + x.toFixed(1) + "%;top:" + y.toFixed(1) + "%;--i:" + i + '"');
    }).join("");
    return '<section class="sv-feuer">' +
      '<div class="sv-titel"><p class="label">' + esc(document.querySelector('[data-i18n="heroLabel"]') ? document.querySelector('[data-i18n="heroLabel"]').textContent : "") + "</p><h1>Imres Tales</h1><p>" + esc(T.feuer) + "</p></div>" +
      '<div class="sv-szene">' + sitze +
        '<div class="sv-lager"><div class="sv-glut"></div>' +
          '<div class="sv-flamme f1"></div><div class="sv-flamme f2"></div><div class="sv-flamme f3"></div>' +
          '<svg class="sv-holz" viewBox="0 0 120 40" aria-hidden="true"><path d="M8 32 L112 14" stroke="#4a2e18" stroke-width="10" stroke-linecap="round"/><path d="M10 14 L110 32" stroke="#3a2412" stroke-width="10" stroke-linecap="round"/><circle cx="60" cy="24" r="6" fill="#ff8a2e" opacity=".8"/></svg>' +
          Array.from({ length: 8 }, (_, i) => '<i class="sv-funke" style="--i:' + i + '"></i>').join("") +
        "</div></div>" +
      "</section>" +
      '<div class="wrap sv-unter">' +
        (l ? '<a class="sv-weiter" href="#kapitel-' + esc(l.nummer) + '"><small>' + esc(T.zuletzt) + "</small>" + esc(T.weiter(l.nummer, l.titel)) + " <b>" + esc(T.lesen) + " →</b></a>" : "") +
        '<h2 class="sv-h2">' + esc(T.geschichten) + "</h2>" +
        '<div class="sv-glutknoepfe">' + bereiche().map((id, i) =>
          '<a href="#' + id + '" style="--i:' + i + '"><span class="sv-sym">' + SYMBOL[id] + "</span><span><b>" + esc(T.namen[id]) + "</b><small>" + esc(T.kurz[id]) + "</small></span></a>").join("") + "</div>" +
      "</div>";
  }

  /* ---------- 2: Das Buch ---------- */
  function buch() {
    const T = t(), D = daten(), l = letztes();
    const roemisch = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];
    const intro = D.intro && D.intro.text ? D.intro.text : "";
    return '<section class="sv-buchbuehne"><div class="sv-buch">' +
      '<div class="sv-seite links">' +
        '<p class="sv-klein">' + esc(document.querySelector('[data-i18n="heroLabel"]') ? document.querySelector('[data-i18n="heroLabel"]').textContent : "") + "</p>" +
        '<h1><span class="sv-initiale">I</span>mres Tales</h1>' +
        '<figure class="sv-bild"><img src="siegesfeier.jpg" alt=""></figure>' +
        (intro ? '<p class="sv-intro">' + intro + "</p>" : "") +
        '<div class="sv-runde">' + helden().map(h => portraet(h, "sv-kopf")).join("") + "</div>" +
      "</div>" +
      '<div class="sv-seite rechts">' +
        (l ? '<a class="sv-band" href="#kapitel-' + esc(l.nummer) + '"><small>' + esc(T.lesezeichen) + "</small>" + esc(T.weiter(l.nummer, "")).replace(/ · $/, "") + "<b>" + esc(T.lesen) + "</b></a>" : "") +
        "<h2>" + esc(T.inhalt) + '</h2><ol class="sv-inhalt">' +
        bereiche().map((id, i) => '<li style="--i:' + i + '"><a href="#' + id + '"><span class="nr">' + roemisch[i] + '.</span><span class="ti">' + esc(T.namen[id]) + "<small>" + esc(T.kurz[id]) + '</small></span><span class="pkt"></span><span class="za">' + esc(T.zahl[id](anzahl(id))) + "</span></a></li>").join("") +
        "</ol>" +
        '<p class="sv-schluss">❦</p>' +
      "</div>" +
    "</div></section>";
  }

  /* ---------- 3: Die Karte ---------- */
  const ORTE = { chronik: [15, 30], questtafel: [35, 16], reise: [62, 28], gefaehrten: [82, 15], nsc: [81, 52], bestiarium: [62, 66], taverne: [36, 66], lautenwerk: [17, 84] };
  function karte() {
    const T = t(), l = letztes(), liste = bereiche();
    const punkte = liste.map(id => ORTE[id]);
    const pt = p => [p[0] * 10, p[1] * 7.5];
    const pfad = punkte.map((p, i) => {
      const [x, y] = pt(p);
      if (!i) return "M" + x + " " + y;
      const [vx, vy] = pt(punkte[i - 1]);
      return "Q" + ((vx + x) / 2 + (i % 2 ? 40 : -40)) + " " + ((vy + y) / 2 + (i % 2 ? -50 : 50)) + " " + x + " " + y;
    }).join(" ");
    return '<section class="sv-kartenbuehne">' +
      '<div class="sv-kartenkopf"><p class="label">' + esc(T.kartenTitel) + '</p><h1>Imres Tales</h1></div>' +
      '<div class="sv-karte">' +
        '<img class="sv-kartenbild" src="unterreich-karte.jpg" alt="">' +
        '<svg class="sv-route" viewBox="0 0 1000 750" preserveAspectRatio="none" aria-hidden="true"><path d="' + pfad + '" pathLength="1"/></svg>' +
        '<svg class="sv-rose" viewBox="0 0 100 100" aria-hidden="true"><g><path d="M50 4 L58 50 L50 96 L42 50 Z" fill="#7a1d16"/><path d="M4 50 L50 42 L96 50 L50 58 Z" fill="#3a2a1c"/><circle cx="50" cy="50" r="6" fill="#e0a046"/></g><text x="50" y="16" text-anchor="middle" font-size="12" fill="#2a1a10">N</text></svg>' +
        liste.map((id, i) => '<a class="sv-ort" href="#' + id + '" style="left:' + ORTE[id][0] + "%;top:" + ORTE[id][1] + "%;--i:" + i + '"><span class="sv-siegel">' + SYMBOL[id] + '</span><span class="sv-schild">' + esc(T.namen[id]) + "<small>" + esc(T.zahl[id](anzahl(id))) + "</small></span></a>").join("") +
        (l ? '<a class="sv-hier" href="#kapitel-' + esc(l.nummer) + '" style="left:42%;top:45%"><span class="sv-figuren">' + helden().map((h, i) => '<img src="' + esc(h.bild) + '" alt="" style="--i:' + i + ";object-position:" + esc(h.fries || "50% 30%") + '">').join("") + '</span><span class="sv-schild hier">' + esc(T.hier) + "<small>" + esc(T.weiter(l.nummer, l.titel)) + "</small></span></a>" : "") +
      "</div>" +
      '<div class="wrap sv-kartenliste">' + liste.map(id => '<a href="#' + id + '">' + SYMBOL[id] + " " + esc(T.namen[id]) + "</a>").join("") + "</div>" +
    "</section>";
  }

  /* ---------- Einbauen ---------- */
  let box = null;
  function bauen() {
    if (!box) { box = document.createElement("div"); box.className = "sv-box"; start.prepend(box); }
    box.innerHTML = wahl === "1" ? lagerfeuer() : wahl === "2" ? buch() : karte();
    leiste();
  }
  function leiste() {
    let l = document.querySelector(".sv-leiste");
    if (!l) { l = document.createElement("div"); l.className = "sv-leiste"; document.body.appendChild(l); }
    const T = t(), namen = ["", "Lagerfeuer", sprache() === "en" ? "Book" : "Buch", sprache() === "en" ? "Map" : "Karte"];
    l.innerHTML = "<span>" + esc(T.vorschau) + ":</span>" +
      '<a href="?layout=0">' + esc(T.original) + "</a>" +
      [1, 2, 3].map(n => '<a href="?layout=' + n + '"' + (String(n) === wahl ? ' aria-current="true"' : "") + ">" + n + " · " + namen[n] + "</a>").join("");
  }
  document.body.classList.add("sv-layout", "sv-layout-" + wahl);

  const css = document.createElement("style");
  css.textContent = `
.sv-layout .halle-start, .sv-layout .start-rest { display: none !important; }
.sv-leiste { position: fixed; z-index: 70; left: 50%; bottom: calc(8px + env(safe-area-inset-bottom, 0px)); transform: translateX(-50%);
  display: flex; gap: .35rem; align-items: center; max-width: calc(100vw - 60px); overflow-x: auto; white-space: nowrap;
  padding: .35rem .5rem; font-size: .72rem !important; background: rgba(16,14,21,.94); border: 1px solid var(--ember); font-size: .8rem; color: var(--ash); box-shadow: 0 10px 28px rgba(0,0,0,.6); }
.sv-leiste a { color: var(--vellum); text-decoration: none; padding: .15rem .45rem; border: 1px solid var(--line); white-space: nowrap; }
.sv-leiste a[aria-current] { background: var(--ember); color: var(--night); border-color: var(--ember); }
.sv-rund { display: block; border-radius: 50%; overflow: hidden; }
.sv-rund img { width: 100%; height: 100%; object-fit: cover; display: block; }
.sv-name { display: block; text-align: center; font-family: var(--display); color: var(--vellum); }
@keyframes svein { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: none; } }

/* ===== 1 · Lagerfeuer ===== */
.sv-feuer { position: relative; display: flex; flex-direction: column; min-height: clamp(520px, calc(100svh - 5.5rem), 860px); overflow: hidden;
  background: radial-gradient(ellipse 60% 45% at 50% 82%, rgba(255,140,50,.28), transparent 70%), linear-gradient(#0b0a12, #14101a 55%, #1b120e); }
.sv-feuer::after { content: ""; position: absolute; left: -5%; right: -5%; bottom: 0; height: 22%; background: radial-gradient(ellipse 70% 100% at 50% 100%, #24170f, #120c0a 70%); border-top-left-radius: 50% 40%; border-top-right-radius: 50% 40%; }
.sv-titel { position: relative; z-index: 2; text-align: center; padding: clamp(1.6rem, 5vw, 3rem) 16px 0; animation: svein 1.2s both; }
.sv-titel h1 { font-size: clamp(2.8rem, 11vw, 6.5rem); line-height: .95; margin: .3rem 0 .5rem; background: linear-gradient(180deg, #fff1cf, var(--ember) 120%); -webkit-background-clip: text; background-clip: text; color: transparent; filter: drop-shadow(0 0 22px rgba(255,150,60,.35)); }
.sv-titel p:last-child { font-family: var(--name); font-style: italic; color: var(--ash); font-size: clamp(1rem, 2.6vw, 1.25rem); max-width: 34rem; margin: 0 auto; }
.sv-szene { position: relative; z-index: 1; flex: 1 0 auto; align-self: center; width: min(900px, 100%); height: clamp(300px, 52vw, 500px); margin-top: auto; }
.sv-sitz { position: absolute; translate: -50% -50%; width: clamp(58px, 14vw, 124px); text-decoration: none; animation: svein .9s both, wippen 4s ease-in-out infinite; animation-delay: calc(var(--i) * .15s + .4s), calc(var(--i) * -.8s); }
.sv-sitz .sv-rund { aspect-ratio: 1; border: 2px solid rgba(255,170,80,.7); animation: feuerschein 2.3s ease-in-out infinite; animation-delay: calc(var(--i) * -.37s); }
.sv-sitz .sv-name { margin-top: .35rem; font-size: clamp(.75rem, 2vw, 1.05rem); text-shadow: 0 2px 6px #000; }
.sv-sitz:hover .sv-rund, .sv-sitz:focus-visible .sv-rund { transform: scale(1.08); border-color: #ffd27a; }
@keyframes wippen { 50% { margin-top: -5px; } }
@keyframes feuerschein { 0%, 100% { box-shadow: 0 0 18px rgba(255,140,40,.45), inset 0 -12px 20px rgba(255,120,30,.35); } 37% { box-shadow: 0 0 28px rgba(255,160,60,.65), inset 0 -16px 24px rgba(255,140,40,.45); } 61% { box-shadow: 0 0 14px rgba(255,120,30,.35), inset 0 -10px 16px rgba(255,110,30,.3); } }
.sv-lager { position: absolute; left: 50%; bottom: 10%; transform: translateX(-50%); width: clamp(90px, 18vw, 150px); height: clamp(110px, 22vw, 180px); z-index: 3; }
.sv-holz { position: absolute; left: 0; right: 0; bottom: 0; width: 100%; }
.sv-glut { position: absolute; left: 50%; bottom: 0; width: 280%; aspect-ratio: 1; transform: translate(-50%, 45%); background: radial-gradient(circle, rgba(255,150,50,.35), transparent 60%); animation: atmen 2.6s ease-in-out infinite; pointer-events: none; }
@keyframes atmen { 50% { opacity: .65; transform: translate(-50%, 45%) scale(.94); } }
.sv-flamme { position: absolute; left: 50%; bottom: 18%; border-radius: 50% 50% 20% 20% / 60% 60% 40% 40%; transform-origin: 50% 100%; mix-blend-mode: screen; filter: blur(1px); }
.sv-flamme.f1 { width: 62%; height: 78%; margin-left: -31%; background: radial-gradient(ellipse at 50% 80%, #ff9a2e, #e0461a 55%, transparent 72%); animation: flackern1 .9s ease-in-out infinite alternate; }
.sv-flamme.f2 { width: 44%; height: 62%; margin-left: -22%; background: radial-gradient(ellipse at 50% 80%, #ffd27a, #ff8a2e 55%, transparent 72%); animation: flackern2 .7s ease-in-out infinite alternate; }
.sv-flamme.f3 { width: 24%; height: 38%; margin-left: -12%; background: radial-gradient(ellipse at 50% 80%, #fff6d8, #ffd27a 60%, transparent 75%); animation: flackern1 .5s ease-in-out infinite alternate; }
@keyframes flackern1 { from { transform: scale(1, 1) skewX(-3deg); } to { transform: scale(.92, 1.1) skewX(4deg); } }
@keyframes flackern2 { from { transform: scale(.95, 1.05) skewX(5deg); } to { transform: scale(1.05, .92) skewX(-4deg); } }
.sv-funke { position: absolute; left: 50%; bottom: 40%; width: 3px; height: 3px; border-radius: 50%; background: #ffd27a; box-shadow: 0 0 6px #ff9a2e; opacity: 0;
  animation: funkenflug 2.6s ease-out infinite; animation-delay: calc(var(--i) * .33s); --dx: calc((var(--i) - 3.5) * 9px); }
@keyframes funkenflug { 0% { opacity: 0; transform: translate(0, 0); } 15% { opacity: 1; } 100% { opacity: 0; transform: translate(var(--dx), -150px); } }
.sv-unter { display: grid; gap: 1.4rem; padding-block: 2rem 5.5rem; }
.sv-weiter { display: grid; gap: .2rem; padding: 1rem 1.2rem; border: 1px solid var(--ember); background: linear-gradient(100deg, rgba(255,140,50,.18), transparent 70%); text-decoration: none; color: var(--vellum); font-family: var(--name); font-size: clamp(1.2rem, 3.2vw, 1.6rem); }
.sv-weiter small { font-family: var(--body); font-size: .7rem; letter-spacing: .18em; text-transform: uppercase; color: var(--ember); }
.sv-weiter b { font-family: var(--body); font-size: .9rem; color: var(--ember); }
.sv-h2 { font-family: var(--display); font-weight: 400; font-size: clamp(1.6rem, 4.5vw, 2.4rem); }
.sv-glutknoepfe { display: grid; gap: .6rem; grid-template-columns: repeat(auto-fill, minmax(min(100%, 15rem), 1fr)); }
.sv-glutknoepfe a { display: flex; gap: .8rem; align-items: center; padding: .8rem .9rem; text-decoration: none; border: 1px solid var(--line); background: rgba(255,140,50,.04); color: var(--vellum); animation: svein .7s both; animation-delay: calc(var(--i) * 60ms); transition: background .3s, border-color .3s, box-shadow .3s; }
.sv-glutknoepfe a:hover, .sv-glutknoepfe a:focus-visible { border-color: var(--ember); background: rgba(255,140,50,.12); box-shadow: 0 0 22px rgba(255,140,50,.18); }
.sv-sym { flex: none; width: 2.6rem; height: 2.6rem; display: grid; place-items: center; font-size: 1.3rem; border-radius: 50%; background: radial-gradient(circle, rgba(255,150,50,.35), rgba(255,150,50,.05)); }
.sv-glutknoepfe b { display: block; font-family: var(--display); font-weight: 400; font-size: 1.15rem; }
.sv-glutknoepfe small { color: var(--ash); font-size: .82rem; }

/* ===== 2 · Buch ===== */
.sv-buchbuehne { padding: clamp(1.2rem, 4vw, 3rem) clamp(10px, 3vw, 2rem) 6rem; perspective: 2200px; }
.sv-buch { position: relative; max-width: 1120px; margin: 0 auto; display: grid; grid-template-columns: 1fr; padding: clamp(8px, 1.4vw, 16px);
  background: linear-gradient(135deg, #4a1e14, #2a100b); border-radius: 6px; box-shadow: 0 30px 70px rgba(0,0,0,.7), inset 0 0 0 2px #8a5a2a; }
@media (min-width: 900px) { .sv-buch { grid-template-columns: 1fr 1fr; } }
.sv-buch::before { content: ""; position: absolute; inset: 4px; border: 1px solid rgba(224,160,70,.45); border-radius: 4px; pointer-events: none; }
.sv-seite { position: relative; padding: clamp(1.3rem, 4vw, 2.8rem); color: #2a2118; background: linear-gradient(90deg, #e8dcc0, #f3ead4 12%, #efe4c9 88%, #dccdab); }
.sv-seite.links { box-shadow: inset -26px 0 30px -18px rgba(70,45,20,.45); }
.sv-seite.rechts { box-shadow: inset 26px 0 30px -18px rgba(70,45,20,.45); transform-origin: 0 50%; animation: umblaettern 1.2s .2s cubic-bezier(.3,.7,.3,1) both; }
@media (max-width: 899px) { .sv-seite.rechts { animation: svein .9s .2s both; border-top: 1px dashed rgba(70,45,20,.3); } }
@keyframes umblaettern { from { transform: rotateY(-100deg); opacity: .4; } to { transform: none; opacity: 1; } }
.sv-klein { font-size: .7rem; font-weight: 600; letter-spacing: .2em; text-transform: uppercase; color: #7a1d16; }
.sv-seite h1 { font-family: var(--display); font-weight: 400; font-size: clamp(2.4rem, 7vw, 4.2rem); line-height: 1; margin: .3rem 0 1rem; color: #1d1610; }
.sv-initiale { display: inline-block; font-size: 1.5em; line-height: .8; color: #7a1d16; text-shadow: 2px 2px 0 #e0a046; margin-right: .03em; }
.sv-bild { margin: 0 0 1rem; border: 6px solid #fff8e8; box-shadow: 0 6px 16px rgba(60,40,20,.35); transform: rotate(-1.2deg); }
.sv-bild img { width: 100%; aspect-ratio: 4/3; object-fit: cover; display: block; }
.sv-intro { font-family: var(--name); font-style: italic; font-size: clamp(1rem, 2.4vw, 1.15rem); line-height: 1.55; color: #3a2f22; }
.sv-intro strong { color: #7a1d16; font-weight: 400; }
.sv-runde { display: flex; flex-wrap: wrap; gap: .6rem; margin-top: 1.2rem; justify-content: center; }
.sv-kopf { width: clamp(52px, 12vw, 70px); text-decoration: none; }
.sv-kopf .sv-rund { aspect-ratio: 1; border: 2px solid #8a5a2a; transition: transform .3s; }
.sv-kopf .sv-name { font-size: .78rem; color: #2a2118; margin-top: .2rem; }
.sv-kopf:hover .sv-rund { transform: scale(1.1) rotate(-3deg); }
.sv-seite h2 { font-family: var(--display); font-weight: 400; font-size: clamp(1.8rem, 4.5vw, 2.6rem); color: #1d1610; margin: 0 0 1rem; text-align: center; }
.sv-inhalt { list-style: none; margin: 0; padding: 0; display: grid; gap: .3rem; }
.sv-inhalt li { animation: svein .6s both; animation-delay: calc(var(--i) * 90ms + 1s); }
.sv-inhalt a { display: grid; grid-template-columns: 2.4rem auto 1fr auto; align-items: end; gap: .4rem; padding: .45rem .2rem; text-decoration: none; color: #2a2118; border-radius: 3px; transition: background .25s; }
.sv-inhalt a:hover, .sv-inhalt a:focus-visible { background: rgba(122,29,22,.08); }
.sv-inhalt .nr { font-family: var(--display); color: #7a1d16; }
.sv-inhalt .ti { font-family: var(--name); font-size: clamp(1.1rem, 2.8vw, 1.3rem); line-height: 1.15; }
.sv-inhalt .ti small { display: block; font-family: var(--body); font-size: .76rem; color: #6b5a44; font-style: italic; }
.sv-inhalt .pkt { border-bottom: 2px dotted rgba(70,45,20,.4); margin-bottom: .45rem; }
.sv-inhalt .za { font-size: .78rem; color: #6b5a44; white-space: nowrap; }
.sv-band { position: absolute; top: -8px; right: clamp(14px, 4vw, 34px); width: 5.6rem; padding: .8rem .5rem 1.6rem; text-align: center; text-decoration: none;
  background: linear-gradient(#9b2a1f, #7a1d16); color: #f3e6cf; font-family: var(--display); font-size: .95rem; line-height: 1.1;
  clip-path: polygon(0 0, 100% 0, 100% 100%, 50% 86%, 0 100%); box-shadow: 0 6px 12px rgba(0,0,0,.3); animation: pendeln 5s ease-in-out infinite; transform-origin: 50% 0; z-index: 2; }
.sv-band small { display: block; font-family: var(--body); font-size: .55rem; letter-spacing: .14em; text-transform: uppercase; opacity: .8; margin-bottom: .2rem; }
.sv-band b { display: block; font-family: var(--body); font-size: .65rem; margin-top: .3rem; }
@keyframes pendeln { 50% { transform: rotate(2deg); } }
.sv-seite.rechts h2 { padding-right: 4rem; }
.sv-schluss { text-align: center; font-size: 1.6rem; color: #7a1d16; margin-top: 1rem; }

/* ===== 3 · Karte ===== */
.sv-kartenbuehne { padding: clamp(1rem, 3vw, 2rem) 0 5.5rem; }
.sv-kartenkopf { text-align: center; padding: 0 16px; animation: svein 1s both; }
.sv-kartenkopf h1 { font-size: clamp(2.6rem, 10vw, 5.5rem); line-height: .95; margin: .2rem 0 1rem; color: var(--vellum); }
.sv-karte { position: relative; width: min(1180px, calc(100% - 16px)); margin: 0 auto; aspect-ratio: 2200 / 1766; border: 6px solid #3a2412; box-shadow: 0 20px 60px rgba(0,0,0,.7), inset 0 0 60px rgba(60,30,10,.6); overflow: hidden; }
.sv-kartenbild { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; filter: sepia(.25) saturate(.9) brightness(.92); animation: kartenzoom 30s ease-in-out infinite alternate; }
@keyframes kartenzoom { to { transform: scale(1.06); } }
.sv-route { position: absolute; inset: 0; width: 100%; height: 100%; }
.sv-route path { fill: none; stroke: #9b1d12; stroke-width: 4; stroke-linecap: round; opacity: .8; stroke-dasharray: 1; stroke-dashoffset: 1; animation: route 4s .6s ease-in-out forwards; }
@keyframes route { to { stroke-dashoffset: 0; } }
.sv-rose { position: absolute; right: 3%; bottom: 4%; width: clamp(44px, 9vw, 90px); opacity: .85; }
.sv-rose g { transform-origin: 50px 50px; animation: drehen 40s linear infinite; }
@keyframes drehen { to { transform: rotate(360deg); } }
.sv-ort { position: absolute; translate: -50% -50%; display: grid; justify-items: center; gap: .2rem; text-decoration: none; z-index: 2; animation: svein .6s both; animation-delay: calc(var(--i) * .35s + .8s); }
.sv-siegel { width: clamp(30px, 6vw, 50px); aspect-ratio: 1; border-radius: 50%; display: grid; place-items: center; font-size: clamp(.9rem, 2.4vw, 1.5rem);
  background: radial-gradient(circle at 35% 30%, #c4483a, #7a1d16 70%); box-shadow: 0 3px 8px rgba(40,10,5,.6), inset 0 0 0 3px rgba(0,0,0,.15); animation: pochen 3s ease-in-out infinite; animation-delay: calc(var(--i) * .4s); }
@keyframes pochen { 50% { transform: scale(1.08); box-shadow: 0 3px 8px rgba(40,10,5,.6), 0 0 0 6px rgba(196,72,58,.18); } }
.sv-schild { padding: .1rem .45rem; background: #f3ead4; color: #2a2118; font-family: var(--display); font-size: clamp(.62rem, 1.6vw, .95rem); line-height: 1.1; text-align: center; white-space: nowrap; box-shadow: 0 2px 6px rgba(40,20,5,.4); }
.sv-schild small { display: block; font-family: var(--body); font-size: .75em; color: #6b5a44; }
.sv-ort:hover .sv-siegel, .sv-ort:focus-visible .sv-siegel { transform: scale(1.18); }
.sv-hier { position: absolute; translate: -50% -50%; display: grid; justify-items: center; gap: .25rem; text-decoration: none; z-index: 3; }
.sv-figuren { display: flex; }
.sv-figuren img { width: clamp(22px, 5vw, 40px); aspect-ratio: 1; border-radius: 50%; object-fit: cover; border: 2px solid #e0a046; margin-left: -7px; animation: wippen 2.4s ease-in-out infinite; animation-delay: calc(var(--i) * -.45s); box-shadow: 0 3px 6px rgba(0,0,0,.5); }
.sv-schild.hier { background: #7a1d16; color: #f3e6cf; }
.sv-schild.hier small { color: #f3d9c4; }
.sv-kartenliste { display: flex; flex-wrap: wrap; gap: .4rem; justify-content: center; margin-top: 1.2rem; }
.sv-kartenliste a { padding: .3rem .7rem; border: 1px solid var(--line); color: var(--vellum); text-decoration: none; font-size: .88rem; }
.sv-kartenliste a:hover { border-color: var(--ember); color: var(--ember); }
@media (max-width: 560px) {
  .sv-schild { font-size: .56rem; padding: .05rem .3rem; }
  .sv-schild small { display: none; }
  .sv-schild.hier small { display: block; }
  .sv-figuren img { margin-left: -9px; }
}

@media (prefers-reduced-motion: reduce) {
  .sv-box *, .sv-box *::before, .sv-box *::after { animation: none !important; }
  .sv-route path { stroke-dashoffset: 0; }
}
`;
  document.head.appendChild(css);

  bauen();
  let letzte = sprache();
  new MutationObserver(() => { if (sprache() !== letzte) { letzte = sprache(); bauen(); } }).observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });
  /* Zählungen (Questtafel, Stationen) stehen erst nach dem Aufbau der Seite fest */
  setTimeout(bauen, 600);
})();
