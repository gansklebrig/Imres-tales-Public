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

  const BEREICHE = ["chronik", "questtafel", "reise", "gefaehrten", "nsc", "bestiarium", "taverne"];
  const TX = {
    de: {
      uebersicht: "← Übersicht", zurueck: "Zurück", weiter: "Weiter",
      weiterlesen: (nr, titel) => "<small>Zuletzt geschehen</small>Kapitel " + nr + " · " + titel + "<b>Weiterlesen →</b>",
      runter: "Zur Übersicht",
      namen: { chronik: "Die Chronik", questtafel: "Die Questtafel", reise: "Die Reise", gefaehrten: "Die Gefährten", nsc: "Bekanntschaften", bestiarium: "Das Bestiarium", taverne: "Die Taverne", lautenwerk: "Barradins Lautenwerk" },
      texte: {
        chronik: "Das ganze Abenteuer, Kapitel für Kapitel nacherzählt.",
        questtafel: "Offene Fragen, Hinweise und rote Fäden.",
        reise: "Jede Station der Gruppe auf der Karte.",
        gefaehrten: "Vier Helden und ein Hund – wer sie sind.",
        nsc: "Freund, Feind und Fragezeichen.",
        bestiarium: "Alles, was uns fressen wollte.",
        taverne: "Würfeln, Spotten, Loblieder und Memory.",
        lautenwerk: "Baue Bardenbeats mit der ganzen Band."
      },
      zahl: { chronik: n => n + (n === 1 ? " Kapitel" : " Kapitel"), questtafel: n => n + " Zettel", reise: n => n + " Stationen", gefaehrten: () => "5 Gefährten", nsc: n => n + " Gesichter", bestiarium: n => n + " Kreaturen", taverne: () => "3 Spiele", lautenwerk: () => "♪ Neu" }
    },
    en: {
      uebersicht: "← Overview", zurueck: "Back", weiter: "Next",
      weiterlesen: (nr, titel) => "<small>Most recently</small>Chapter " + nr + " · " + titel + "<b>Read on →</b>",
      runter: "To the overview",
      namen: { chronik: "The Chronicle", questtafel: "The Quest Board", reise: "The Journey", gefaehrten: "The Companions", nsc: "Acquaintances", bestiarium: "The Bestiary", taverne: "The Tavern", lautenwerk: "Barradin's Lute Machine" },
      texte: {
        chronik: "The whole adventure, retold chapter by chapter.",
        questtafel: "Open questions, clues and red threads.",
        reise: "Every stop of the party on the map.",
        gefaehrten: "Four heroes and a dog – who they are.",
        nsc: "Friend, foe and question mark.",
        bestiarium: "Everything that wanted to eat us.",
        taverne: "Dice, mockery, songs of praise and memory.",
        lautenwerk: "Build bardic beats with the whole band."
      },
      zahl: { chronik: n => n + (n === 1 ? " chapter" : " chapters"), questtafel: n => n + " notes", reise: n => n + " stops", gefaehrten: () => "5 companions", nsc: n => n + " faces", bestiarium: n => n + " creatures", taverne: () => "3 games", lautenwerk: () => "♪ New" }
    }
  };
  const t = () => TX[sprache()];
  const BILDER = {
    questtafel: "questtafel-wand.jpg", reise: "unterreich-karte.jpg", gefaehrten: "gundren-treffen.jpg",
    nsc: "buergermeister-streit.jpg", bestiarium: "demogorgon-karte.webp", taverne: "siegesfeier.jpg", lautenwerk: "kuo-toa-stadt.jpg"
  };

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
    return s ? s.id : "start";
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
    const id = decodeURIComponent(String(hash || "").replace(/^#/, ""));
    if (!id || id === "start") return null;
    try { return document.getElementById(id); } catch (_) { return null; }
  }
  function route(hash, scrollen) {
    const el = ziel(hash);
    setze(ansichtVon(el));
    if (scrollen !== false) requestAnimationFrame(() => hinScrollen(el));
  }
  /* Für Sprünge aus dem restlichen Code (Kapitelmenü, Suche, Karte …) */
  window.ImresAnsicht = { zeige: el => setze(ansichtVon(el)) };

  document.addEventListener("click", e => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey) return;
    const a = e.target.closest && e.target.closest('a[href^="#"]');
    if (!a) return;
    const hash = a.getAttribute("href");
    if (hash === "#") return;
    const el = ziel(hash);
    if (hash !== "#start" && hash !== "#uebersicht" && !el) return;
    e.preventDefault();
    if (hash === "#uebersicht") { setze("start"); requestAnimationFrame(() => hinScrollen($("uebersicht"))); }
    else route(hash);
    try { history.pushState(null, "", hash === "#start" ? location.pathname + location.search : hash); } catch (_) {}
  });
  window.addEventListener("popstate", () => route(location.hash));
  window.addEventListener("hashchange", () => route(location.hash));

  /* ---------- Halle der Gefährten ---------- */
  let halleTimer = null, halleAktiv = 0, halleHover = false;
  function halleBauen() {
    const D = daten(), box = $("halle");
    const helden = [];
    const begleiter = [];
    (D.helden || []).forEach(h => { helden.push(h); if (h.begleiter) begleiter.push(h.begleiter); });
    helden.push(...begleiter); /* Rex läuft hinterher */
    box.innerHTML = helden.map((h, i) =>
      '<a class="halle-tafel" href="#' + esc(h.id) + '" style="--i:' + i + '">' +
        '<img src="' + esc(h.bild) + '" alt="' + esc(h.name) + '" style="object-position:' + esc(h.fries || "50% 30%") + '">' +
        '<span class="halle-name">' + esc(h.name) + "<small>" + esc(h.rolle || "") + "</small></span></a>").join("");
    $("halle-namen").textContent = helden.map(h => h.name).join(" · ");
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
      wl.href = "#kapitel-" + letztes.nummer;
      wl.innerHTML = T.weiterlesen(esc(letztes.nummer), esc(letztes.titel));
    } else wl.hidden = true;
    const kacheln = BEREICHE.filter(vorhanden).concat($("lautenwerk") ? ["lautenwerk"] : []);
    const bild = id => id === "chronik" ? ((letztes && letztes.bild) || "aufbruch-neverwinter.jpg") : BILDER[id];
    $("kacheln").innerHTML = kacheln.map((id, i) =>
      '<a class="kachel k-' + id + '" href="#' + id + '" style="--i:' + i + '">' +
        '<img src="' + esc(bild(id)) + '" alt="" loading="lazy">' +
        '<span class="kachel-text"><span class="kachel-zahl">' + esc(T.zahl[id](anzahl(id))) + "</span>" +
        "<b>" + esc(T.namen[id]) + "</b><small>" + esc(T.texte[id]) + "</small></span></a>").join("");
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
@keyframes kenburns { from { transform: scale(1.04) translate(0, 0); } to { transform: scale(1.14) translate(-2%, -1.5%); } }
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
.halle-namen { font-family: var(--name); font-style: italic; font-size: clamp(.95rem, 2.4vw, 1.3rem); color: var(--ash); opacity: 0; animation: einblenden 1s 1.2s forwards; }
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
.weiterlesen:hover { background: linear-gradient(100deg, rgba(224,160,70,.28), rgba(224,160,70,.06) 70%); }

.kacheln { display: grid; gap: clamp(.7rem, 2vw, 1.1rem); grid-template-columns: repeat(2, minmax(0, 1fr)); }
@media (min-width: 760px) { .kacheln { grid-template-columns: repeat(4, minmax(0, 1fr)); } .kachel.k-chronik { grid-column: span 2; grid-row: span 2; } }
.kachel {
  position: relative; display: block; overflow: hidden; min-height: clamp(150px, 26vw, 210px); text-decoration: none;
  border: 1px solid var(--line); background: var(--hall);
  opacity: 0; transform: translateY(24px); transition: opacity .7s ease, transform .7s ease, border-color .3s, box-shadow .3s;
  transition-delay: calc(var(--i) * 70ms);
}
.kachel.sichtbar { opacity: 1; transform: none; }
.kachel img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; filter: saturate(.75) brightness(.6); transition: transform .9s cubic-bezier(.2,.8,.3,1), filter .6s; }
.kachel::after { content: ""; position: absolute; inset: 0; background: linear-gradient(180deg, rgba(16,14,21,0) 30%, rgba(16,14,21,.92)); }
.kachel:hover, .kachel:focus-visible { border-color: var(--ember); box-shadow: 0 0 0 1px var(--ember), 0 12px 34px rgba(0,0,0,.55), 0 0 26px rgba(224,160,70,.18); }
.kachel:hover img, .kachel:focus-visible img { transform: scale(1.08); filter: saturate(1) brightness(.78); }
.kachel-text { position: absolute; z-index: 1; left: 0; right: 0; bottom: 0; padding: .9rem; display: grid; gap: .15rem; }
.kachel-text b { font-family: var(--display); font-weight: 400; font-size: clamp(1.15rem, 2.8vw, 1.6rem); line-height: 1.05; color: var(--vellum); }
.kachel.k-chronik .kachel-text b { font-size: clamp(1.5rem, 4vw, 2.6rem); }
.kachel-text small { font-size: .82rem; line-height: 1.35; color: var(--ash); }
.kachel-zahl { justify-self: start; font-size: .66rem; font-weight: 600; letter-spacing: .14em; text-transform: uppercase; color: var(--night); background: var(--ember); padding: .1rem .45rem; margin-bottom: .25rem; }
.kachel.k-lautenwerk .kachel-zahl { background: #7fd36b; }

.bereich-zurueck { display: inline-block; margin-bottom: 1.2rem; font-size: .88rem; color: var(--ash); text-decoration: none; }
.bereich-zurueck:hover { color: var(--ember); }
.bereich-weiter { display: flex; justify-content: space-between; gap: 1rem; margin-top: clamp(2.5rem, 6vw, 4rem); padding-top: 1.2rem; border-top: 1px solid var(--line); }
.bereich-weiter a { display: grid; gap: .1rem; text-decoration: none; font-family: var(--display); font-size: clamp(1.05rem, 2.6vw, 1.35rem); color: var(--vellum); }
.bereich-weiter a small { font-family: var(--body); font-size: .68rem; letter-spacing: .16em; text-transform: uppercase; color: var(--ash); }
.bereich-weiter a.nach { text-align: right; margin-left: auto; }
.bereich-weiter a:hover { color: var(--ember); }

@media (max-width: 560px) {
  .halle-name { top: 3.2rem; font-size: .95rem; }
  .halle-tafel.vorn { flex-grow: 3.2; }
}
@media (prefers-reduced-motion: reduce) {
  .halle-tafel, .halle-tafel img, .halle-titel h1, .halle-titel .label, .halle-namen, .halle-runter, .weiterlesen::after { animation: none !important; opacity: 1 !important; transform: none !important; }
  .kachel { opacity: 1; transform: none; }
}
`;
  document.head.appendChild(css);

  /* ---------- Start ---------- */
  function allesBauen() { halleBauen(); uebersichtBauen(); bereichsNavigation(); }
  allesBauen();
  route(location.hash, !!location.hash && location.hash !== "#start");
  let letzteSprache = sprache();
  new MutationObserver(() => {
    if (sprache() === letzteSprache) return;
    letzteSprache = sprache();
    allesBauen();
  }).observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });
})();
