/* =====================================================================
   WEGWEISER – Spiele außerhalb der Taverne sichtbar machen
   ---------------------------------------------------------------------
   1. Startseite: „Wohin des Weges?“ – zwei Tore direkt unter der Halle:
      Die Geschichte (letztes Kapitel, Weiterlesen) und Die Taverne
      (Clip vom Spiel des Tages, Jetzt spielen, Alle Spiele).
      Das Tor zur Geschichte übernimmt die Angaben der Weiterlesen-Karte
      aus seiten.js; die Karte selbst wird dafür ausgeblendet.
   2. Heldenbögen: unter jedem Helden ein kleiner, ruhiger Hinweis auf
      sein Spiel (Barradin zwei, Rex eine Zeile bei Friedrichs Hund),
      dazu „… oder spiel X im Heldensturm“.
   3. Menü: „Taverne“ bekommt ein kleines 🎲.
   Daten (Farben, Bilder, Clips, Fortschritt) kommen aus spielesaal.js.
   ===================================================================== */
(function () {
  "use strict";
  const S = window.ImresSpielesaal;
  if (!S) return;
  const sprache = () => (document.documentElement.lang === "en" ? "en" : "de");
  const esc = s => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const ruhig = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const TX = {
    de: {
      wohin: "Wohin des Weges?",
      geschichte: { label: "📜 Die Geschichte", titel: "Lies, was geschah", satz: "Das ganze Abenteuer, Kapitel für Kapitel nacherzählt.", weiter: "Weiterlesen →", anfang: "Von Anfang an", zuletzt: "Zuletzt" },
      taverne: { label: "🍺 Die Taverne", titel: n => n + " Spiele aus unserer Kampagne", heute: "Heute", jetzt: "▶ Jetzt spielen", alle: "Alle Spiele" },
      held: {
        barradin: { auftritt: "Ein Barde ohne Bühne? Undenkbar.", probe: "Oder soll ich ein Lied über dich singen?" },
        friedrich: { jagd: "Genug gelesen? Spann den Bogen." },
        echo: { hort: "Was glänzt, gehört mir. Hilf mir, es zu verteidigen." },
        ezekiel: { nacht: "Du hast nichts gesehen. Und gleich hast du auch nichts mehr in der Tasche." },
        rex: { jagd: "Wuff!" }
      },
      sturm: n => "… oder spiel " + n + " im Heldensturm"
    },
    en: {
      wohin: "Where to, traveller?",
      geschichte: { label: "📜 The Story", titel: "Read what happened", satz: "The whole adventure, retold chapter by chapter.", weiter: "Continue reading →", anfang: "From the beginning", zuletzt: "Latest" },
      taverne: { label: "🍺 The Tavern", titel: n => n + " games from our campaign", heute: "Today", jetzt: "▶ Play now", alle: "All games" },
      held: {
        barradin: { auftritt: "A bard without a stage? Unthinkable.", probe: "Or shall I sing a song about you?" },
        friedrich: { jagd: "Done reading? Draw your bow." },
        echo: { hort: "What shines is mine. Help me defend it." },
        ezekiel: { nacht: "You saw nothing. And soon there'll be nothing in your pockets either." },
        rex: { jagd: "Woof!" }
      },
      sturm: n => "… or play " + n + " in Heldensturm"
    }
  };
  const t = () => TX[sprache()];
  const klein = f => "vorschau/klein/" + String(f).split("/").pop().replace(/\.(jpe?g|png|webp)$/i, ".webp");
  const NAMEN = { barradin: "Barradin", friedrich: "Friedrich", echo: "Echo", ezekiel: "Ezekiel" };

  /* ---------- 1. Startseite: zwei Tore ---------- */
  const uebersicht = document.getElementById("uebersicht");
  const weiterlesen = document.getElementById("weiterlesen");
  let tore = null;
  function toreBauen() {
    if (!uebersicht) return;
    if (!tore) { tore = document.createElement("section"); tore.className = "wege"; uebersicht.insertBefore(tore, uebersicht.firstChild); }
    const T = t(), alle = S.SPIELE.filter(S.vorhanden), sp = S.heutigesSpiel(), M = S.mehr(), s = S.texte().spiele[sp.key];
    /* Angaben der Weiterlesen-Karte übernehmen */
    const wl = weiterlesen && !weiterlesen.hidden ? weiterlesen : null;
    const wlBild = wl && wl.querySelector(".zl-bild img"), wlKlein = wl && wl.querySelector(".zl-text small"), wlTitel = wl && wl.querySelector(".zl-titel");
    const bild = wlBild ? wlBild.getAttribute("src") : "aufbruch-neverwinter.jpg";
    const zuletzt = wlKlein ? wlKlein.textContent.split(" · ").slice(1).join(" · ") : "";
    const f = S.fortschritt(sp.key);
    tore.innerHTML =
      '<p class="wege-frage">' + esc(T.wohin) + "</p>" +
      '<div class="wege-tore">' +
        '<a class="tor tor-geschichte" href="' + esc(wl ? wl.getAttribute("href") : "#chronik") + '">' +
          '<span class="tor-bild"><img src="' + esc(klein(bild)) + '" data-gross="' + esc(bild) + '" alt="" loading="lazy" decoding="async" onerror="if(this.dataset.gross&&this.src.indexOf(this.dataset.gross)<0)this.src=this.dataset.gross"></span>' +
          '<span class="tor-text"><span class="tor-label">' + esc(T.geschichte.label) + "</span>" +
            "<b>" + esc(T.geschichte.titel) + "</b><span class=\"tor-satz\">" + esc(T.geschichte.satz) + "</span>" +
            (wlTitel ? '<span class="tor-info">' + esc(T.geschichte.zuletzt) + ": " + esc(zuletzt ? zuletzt + " – " : "") + esc(wlTitel.textContent) + "</span>" : "") +
            '<span class="tor-knopf">' + esc(T.geschichte.weiter) + "</span></span></a>" +
        '<div class="tor tor-taverne" style="--farbe:' + sp.farbe + '">' +
          '<a class="tor-flaeche" href="#taverne" aria-label="' + esc(T.taverne.alle) + '"></a>' +
          '<span class="tor-bild">' + (ruhig ? '<img src="' + sp.bilder[0] + '" alt="">' : '<video muted loop playsinline autoplay preload="metadata" poster="' + sp.bilder[0] + '">' + S.quellen(sp.clip) + "</video>") + "</span>" +
          '<span class="tor-text"><span class="tor-label">' + esc(T.taverne.label) + "</span>" +
            "<b>" + esc(T.taverne.titel(alle.length)) + "</b>" +
            '<span class="tor-satz">' + esc(T.taverne.heute) + ": <strong>" + esc(s.titel) + "</strong> – " + esc(M.spruch[sp.key]) + "</span>" +
            (f.gespielt && f.zeilen.length && sp.key !== "probe" ? '<span class="tor-info">' + esc(f.zeilen.join(" · ")) + "</span>" : "") +
            '<span class="tor-knoepfe"><a class="tor-knopf voll" href="' + S.losHref(sp) + '" data-gesehen="' + sp.key + '">' + esc(f.weiter ? M.weiter : T.taverne.jetzt) + (sp.extern ? " ↗" : "") + "</a>" +
              '<a class="tor-knopf" href="#taverne">' + esc(T.taverne.alle) + "</a></span></span></div>" +
      "</div>";
    const v = tore.querySelector("video"); if (v) { v.muted = true; const pr = v.play(); if (pr && pr.catch) pr.catch(() => {}); }
  }
  if (weiterlesen) new MutationObserver(() => toreBauen()).observe(weiterlesen, { childList: true, attributes: true, attributeFilter: ["hidden", "href"] });
  /* Clip nur abspielen, wenn das Tor zu sehen ist */
  function clipWache() {
    if (!("IntersectionObserver" in window) || !uebersicht) return;
    new IntersectionObserver(es => { const v = tore && tore.querySelector("video"); if (!v) return; if (es[0].isIntersecting) { const pr = v.play(); if (pr && pr.catch) pr.catch(() => {}); } else v.pause(); }, { threshold: .1 }).observe(uebersicht);
  }

  /* ---------- 2. Heldenbögen: kleine Spielhinweise ---------- */
  const ZU = { barradin: ["auftritt", "probe"], friedrich: ["jagd"], echo: ["hort"], ezekiel: ["nacht"] };
  function zeile(sp, satz) {
    const s = S.texte().spiele[sp.key];
    return '<a class="hsp-zeile" href="' + S.losHref(sp) + '" data-gesehen="' + sp.key + '" style="--farbe:' + sp.farbe + '">' +
      '<img src="' + sp.bilder[0] + '" alt="" loading="lazy" decoding="async">' +
      '<span><i>„' + esc(satz) + "“</i><b>▶ " + esc(s.titel) + "</b></span></a>";
  }
  function heldenHinweise() {
    const T = t(), sturm = S.nachKey("heldensturm");
    Object.keys(ZU).forEach(id => {
      const art = document.getElementById(id);
      if (!art || !art.classList.contains("hero-entry")) return;
      const text = art.querySelector(".entry-text"); if (!text || text.querySelector(":scope > .held-spiel")) return;
      const box = document.createElement("aside"); box.className = "held-spiel";
      box.innerHTML = ZU[id].map(k => { const sp = S.nachKey(k); return sp && S.vorhanden(sp) ? zeile(sp, T.held[id][k]) : ""; }).join("") +
        (sturm ? '<a class="hsp-sturm" href="' + sturm.extern + '" style="--farbe:' + sturm.farbe + '">' + esc(T.sturm(NAMEN[id])) + " ↗</a>" : "");
      const begleiter = text.querySelector(":scope > .companion");
      text.insertBefore(box, begleiter || null);
    });
    /* Rex: eine einzige Zeile bei Friedrichs Hund */
    const rex = document.getElementById("rex");
    if (rex && rex.classList.contains("companion")) {
      const inner = rex.querySelector(":scope > div");
      if (inner && !inner.querySelector(".hsp-rex")) {
        const sp = S.nachKey("jagd");
        const a = document.createElement("a"); a.className = "hsp-rex"; a.href = S.losHref(sp); a.dataset.gesehen = sp.key; a.style.setProperty("--farbe", sp.farbe);
        a.innerHTML = "„" + esc(T.held.rex.jagd) + "“ <b>▶ " + esc(S.texte().spiele.jagd.titel) + "</b>";
        inner.appendChild(a);
      }
    }
  }
  const gefaehrten = document.getElementById("gefaehrten");
  if (gefaehrten) new MutationObserver(() => heldenHinweise()).observe(gefaehrten, { childList: true, subtree: true });

  /* ---------- Aussehen ---------- */
  const css = document.createElement("style");
  css.textContent = `
/* Menü */
.top nav a[href="#taverne"]::after { content: "🎲"; margin-left: .3em; font-size: .82em; filter: saturate(.8); }

/* Startseite: zwei Tore */
#startseite #weiterlesen { display: none; }
.wege { margin: clamp(1.2rem, 4vw, 2.2rem) 0 clamp(2rem, 6vw, 3.5rem); }
.wege-frage { margin: 0 0 1rem; text-align: center; font-family: var(--display); font-size: clamp(1.3rem, 3.4vw, 1.9rem); color: var(--vellum); letter-spacing: .02em; }
.wege-frage::before, .wege-frage::after { content: "✦"; color: var(--ember); font-size: .6em; vertical-align: middle; margin: 0 .8em; }
.wege-tore { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: clamp(.8rem, 2.4vw, 1.4rem); }
@media (max-width: 760px) { .wege-tore { grid-template-columns: minmax(0, 1fr); } }
.tor { --farbe: var(--ember); position: relative; display: block; min-height: clamp(300px, 34vw, 380px); overflow: hidden; isolation: isolate; text-decoration: none; color: inherit;
  border: 1px solid color-mix(in srgb, var(--farbe) 45%, var(--line)); background: #120e14; box-shadow: 0 14px 36px rgba(0,0,0,.45); transition: border-color .3s, box-shadow .35s, transform .35s cubic-bezier(.2,.8,.3,1); }
.tor:hover, .tor:focus-within { border-color: var(--farbe); transform: translateY(-4px); box-shadow: 0 0 0 1px var(--farbe), 0 22px 48px rgba(0,0,0,.55), 0 0 40px color-mix(in srgb, var(--farbe) 30%, transparent); }
.tor-bild { position: absolute; inset: 0; z-index: -1; }
.tor-bild img, .tor-bild video { width: 100%; height: 100%; object-fit: cover; display: block; filter: brightness(.7) saturate(1.05); transition: transform 1.1s cubic-bezier(.2,.8,.3,1), filter .5s; }
.tor:hover .tor-bild img, .tor:hover .tor-bild video { transform: scale(1.05); filter: brightness(.82) saturate(1.15); }
.tor-bild::after { content: ""; position: absolute; inset: 0; background: linear-gradient(180deg, rgba(12,9,14,.05) 20%, rgba(12,9,14,.75) 58%, rgba(12,9,14,.97)); }
.tor-flaeche { position: absolute; inset: 0; z-index: 1; }
.tor-text { position: absolute; z-index: 2; left: 0; right: 0; bottom: 0; padding: clamp(1rem, 3vw, 1.6rem); display: grid; gap: .35rem; justify-items: start; pointer-events: none; }
.tor-label { font-size: .7rem; letter-spacing: .22em; text-transform: uppercase; color: var(--farbe); }
.tor-text b { font-family: var(--display); font-weight: 400; font-size: clamp(1.6rem, 3.6vw, 2.3rem); line-height: 1.02; color: #fff4de; text-shadow: 0 2px 12px rgba(0,0,0,.8); }
.tor-satz { font-size: .95rem; line-height: 1.45; color: #e6d8bf; max-width: 32rem; }
.tor-satz strong { color: #fff4de; font-weight: 600; }
.tor-info { font-size: .8rem; color: var(--farbe); }
.tor-knoepfe { display: flex; flex-wrap: wrap; gap: .5rem; margin-top: .35rem; }
.tor-knopf { pointer-events: auto; position: relative; z-index: 3; display: inline-flex; align-items: center; padding: .5rem 1rem; border: 1px solid var(--farbe); color: var(--farbe); background: rgba(12,9,14,.55); font-size: .9rem; text-decoration: none; transition: background .2s, color .2s, transform .15s; }
.tor-geschichte .tor-knopf { margin-top: .35rem; }
.tor-knopf.voll { background: var(--farbe); color: #120e14; font-weight: 700; }
.tor-knopf:hover, .tor-knopf:focus-visible { transform: translateY(-2px); background: var(--farbe); color: #120e14; outline: none; }
@media (prefers-reduced-motion: reduce) { .tor, .tor-bild img, .tor-bild video { transition: none; } }

/* Heldenbögen: kleiner, ruhiger Hinweis */
.held-spiel { margin-top: 1.6rem; padding-top: .9rem; border-top: 1px dashed var(--line); display: grid; gap: .55rem; }
.hsp-zeile { display: flex; align-items: center; gap: .75rem; text-decoration: none; color: var(--ash); max-width: 30rem; }
.hsp-zeile img { flex: none; width: 2.9rem; height: 2.9rem; object-fit: cover; object-position: center 30%; border-radius: 6px; border: 1px solid color-mix(in srgb, var(--farbe) 50%, var(--line)); opacity: .85; transition: opacity .2s, border-color .2s; }
.hsp-zeile span { display: grid; gap: .05rem; font-size: .86rem; line-height: 1.35; }
.hsp-zeile i { color: var(--ash); }
.hsp-zeile b { font-weight: 600; color: color-mix(in srgb, var(--farbe) 70%, var(--vellum)); font-size: .84rem; }
.hsp-zeile:hover img, .hsp-zeile:focus-visible img { opacity: 1; border-color: var(--farbe); }
.hsp-zeile:hover b, .hsp-zeile:focus-visible b { color: var(--farbe); }
.hsp-zeile:focus-visible { outline: 1px solid var(--farbe); outline-offset: 3px; }
.hsp-sturm { font-size: .78rem; color: var(--ash); text-decoration: none; opacity: .8; justify-self: start; }
.hsp-sturm:hover { color: var(--farbe); opacity: 1; }
.hsp-rex { display: inline-block; margin-top: .4rem; font-size: .84rem; color: var(--ash); text-decoration: none; }
.hsp-rex b { font-weight: 600; color: color-mix(in srgb, var(--farbe) 70%, var(--vellum)); }
.hsp-rex:hover b { color: var(--farbe); }
`;
  document.head.appendChild(css);

  /* ---------- Start ---------- */
  toreBauen(); clipWache(); heldenHinweise();
  let letzteSprache = sprache();
  new MutationObserver(() => {
    if (sprache() === letzteSprache) return; letzteSprache = sprache();
    toreBauen();
    document.querySelectorAll(".held-spiel, .hsp-rex").forEach(e => e.remove()); heldenHinweise();
  }).observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });
  /* Inhalte kommen teils später (inhalt.js) – einmal nachziehen */
  setTimeout(() => { toreBauen(); heldenHinweise(); }, 1200);
})();
