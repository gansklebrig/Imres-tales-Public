/* =====================================================================
   STARTBÜHNE – Würfel des Spielleiters und ein runder Abschluss
   ---------------------------------------------------------------------
   1. Das Spielleiter-Zitat und ein großer W20 stehen nebeneinander
      („Imre, Herr über Würfel“). Wer würfelt, bekommt einen Kommentar
      von einem der Helden – bei einer 20 sprühen Funken, bei einer 1
      lästert Ezekiel. Würfe und bester Wurf des Tages bleiben gespeichert.
   2. Die Taverne-Kachel ist doppelt breit (keine Lücke mehr im Raster).
   3. Ganz unten: Siegel „Fortsetzung folgt …“ statt eines abrupten Endes.
   Klänge nur, wenn die Tavernenklänge eingeschaltet sind.
   ===================================================================== */
(function () {
  "use strict";
  const uebersicht = document.getElementById("uebersicht");
  if (!uebersicht) return;
  const sprache = () => (document.documentElement.lang === "en" ? "en" : "de");
  const esc = s => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const ruhig = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const zufall = l => l[Math.floor(Math.random() * l.length)];
  const lies = k => { try { return localStorage.getItem(k); } catch (_) { return null; } };
  const schreib = (k, v) => { try { localStorage.setItem(k, v); } catch (_) {} };

  const HELDEN = {
    barradin: { name: "Barradin", bild: "barradin.jpg" }, friedrich: { name: "Friedrich", bild: "friedrich.jpg" },
    echo: { name: "Echo", bild: "echo.jpg" }, ezekiel: { name: "Ezekiel", bild: "ezekiel.jpg" }, rex: { name: "Rex", bild: "rex-guckt.webp" }
  };
  const TX = {
    de: {
      label: "Probe des Tages", titel: "Wirf für die Gruppe", werfen: "W20 werfen", nochmal: "Nochmal werfen",
      hinweis: "Ein Klick – und die Helden haben eine Meinung dazu.",
      heute: (n, b) => "Heute: " + n + (n === 1 ? " Wurf" : " Würfe") + " · bester Wurf: " + b,
      krit: "Natürliche 20!", patzer: "Patzer!",
      sprueche: {
        krit: { barradin: ["Eine natürliche 20! Ich schreibe sofort ein Lied darüber.", "Applaus! Applaus! Ach, ich applaudiere einfach selbst."],
          friedrich: ["Mitten ins Schwarze. Rex, hast du das gesehen?"], echo: ["Selbst die Bäume flüstern deinen Namen."],
          ezekiel: ["… Beeindruckend. Ich habe das nicht gesagt."], rex: ["WUFF! WUFF! WUFF!"] },
        hoch: { barradin: ["Das klingt nach einem Erfolg – und nach einer Ballade."], friedrich: ["Sauber. So würde ich auch zielen."],
          echo: ["Die Natur ist dir heute wohlgesonnen."], ezekiel: ["Nicht schlecht. Für einen Anfänger."], rex: ["Wuff! *wedelt mit dem ganzen Hund*"] },
        mittel: { barradin: ["Solide. Ich mache trotzdem ein Lied daraus."], friedrich: ["Reicht für einen Goblin. Vielleicht zwei."],
          echo: ["Hm. Der Hain ist unentschlossen."], ezekiel: ["Durchschnitt. Wie die meisten Geldbeutel."], rex: ["*schnüffelt misstrauisch am Würfel*"] },
        niedrig: { barradin: ["Das … übergehen wir in der Ballade."], friedrich: ["Daneben. Aber der Baum dahinter ist jetzt sehr tot."],
          echo: ["Selbst die Pilze schauen weg."], ezekiel: ["Ich hätte geschummelt. Nur so als Tipp."], rex: ["*legt sich mit einem tiefen Seufzer hin*"] },
        patzer: { ezekiel: ["Eine 1. Ich nehme deinen Geldbeutel – du brauchst ihn ohnehin nicht mehr.", "Glückwunsch. Imre lächelt. Das ist nie ein gutes Zeichen.",
          "Selbst Rex würfelt besser. Und Rex hat keine Daumen.", "Ich würde ja helfen. Aber ehrlich: Das hier ist lustiger."] }
      },
      ende: "Fortsetzung folgt …", endeKlein: "Die nächste Sitzung schreibt das nächste Kapitel.", hoch: "↑ Zurück zur Halle"
    },
    en: {
      label: "Check of the day", titel: "Roll for the party", werfen: "Roll d20", nochmal: "Roll again",
      hinweis: "One click – and the heroes will have opinions.",
      heute: (n, b) => "Today: " + n + (n === 1 ? " roll" : " rolls") + " · best roll: " + b,
      krit: "Natural 20!", patzer: "Fumble!",
      sprueche: {
        krit: { barradin: ["A natural 20! I'm writing a song about it right now.", "Applause! Applause! Oh, I'll just applaud myself."],
          friedrich: ["Bullseye. Rex, did you see that?"], echo: ["Even the trees whisper your name."],
          ezekiel: ["… Impressive. I never said that."], rex: ["WOOF! WOOF! WOOF!"] },
        hoch: { barradin: ["That sounds like a success – and a ballad."], friedrich: ["Clean. That's how I'd aim."],
          echo: ["Nature favours you today."], ezekiel: ["Not bad. For a beginner."], rex: ["Woof! *wags the entire dog*"] },
        mittel: { barradin: ["Solid. I'll make a song of it anyway."], friedrich: ["Enough for a goblin. Maybe two."],
          echo: ["Hm. The grove is undecided."], ezekiel: ["Average. Like most purses."], rex: ["*sniffs the die suspiciously*"] },
        niedrig: { barradin: ["We'll … skip that part in the ballad."], friedrich: ["Missed. But the tree behind is very dead now."],
          echo: ["Even the mushrooms look away."], ezekiel: ["I'd have cheated. Just a tip."], rex: ["*lies down with a deep sigh*"] },
        patzer: { ezekiel: ["A 1. I'll take your purse – you won't be needing it.", "Congratulations. Imre is smiling. That's never a good sign.",
          "Even Rex rolls better. And Rex has no thumbs.", "I'd help. But honestly, this is funnier."] }
      },
      ende: "To be continued …", endeKlein: "The next session writes the next chapter.", hoch: "↑ Back to the hall"
    }
  };
  const t = () => TX[sprache()];

  /* ---------- Würfel-Block neben dem Spielleiter ---------- */
  const intro = document.getElementById("intro");
  const runde = document.createElement("section"); runde.className = "runde";
  uebersicht.insertBefore(runde, intro || uebersicht.querySelector(".lede") || null);
  if (intro) runde.appendChild(intro);
  const karte = document.createElement("div"); karte.className = "wuerfel-karte"; runde.appendChild(karte);

  const W20 = '<svg viewBox="0 0 100 100" aria-hidden="true"><polygon class="w-flaeche" points="50,3 91,26.5 91,73.5 50,97 9,73.5 9,26.5"/>' +
    '<path class="w-kante" d="M50,22 L78,69 L22,69 Z M50,3 L50,22 M9,26.5 L50,22 L91,26.5 M9,26.5 L22,69 L9,73.5 M91,26.5 L78,69 L91,73.5 M22,69 L50,97 L78,69"/>' +
    '<text class="w-zahl" x="50" y="59">20</text></svg>';
  const tagHeute = () => { const d = new Date(); return d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate(); };
  function statistik() { try { const s = JSON.parse(lies("imres-wuerfel-tag") || "null"); if (s && s.tag === tagHeute()) return s; } catch (_) {} return { tag: tagHeute(), n: 0, best: 0 }; }
  let letzter = null;
  function karteBauen() {
    const T = t(), st = statistik();
    karte.innerHTML =
      '<p class="label">' + esc(T.label) + "</p>" +
      '<h3 class="wk-titel">' + esc(T.titel) + "</h3>" +
      '<button type="button" class="wk-wuerfel" aria-label="' + esc(T.werfen) + '">' + W20 + '<span class="wk-funken" aria-hidden="true"></span></button>' +
      '<div class="wk-ergebnis" aria-live="polite">' + (letzter ? ergebnisHtml(letzter) : '<p class="wk-hinweis">' + esc(T.hinweis) + "</p>") + "</div>" +
      '<p class="wk-statistik">' + (st.n ? esc(T.heute(st.n, st.best)) : "") + "</p>";
    if (letzter) karte.querySelector(".w-zahl").textContent = letzter.wurf;
  }
  function ergebnisHtml(e) {
    const T = t(), h = HELDEN[e.held];
    return (e.art === "krit" ? '<p class="wk-art krit">' + esc(T.krit) + "</p>" : e.art === "patzer" ? '<p class="wk-art patzer">' + esc(T.patzer) + "</p>" : "") +
      '<div class="wk-blase"><img src="' + h.bild + '" alt=""><p><b>' + esc(h.name) + "</b>" + esc(T.sprueche[e.art][e.held][e.nr % T.sprueche[e.art][e.held].length]) + "</p></div>";
  }
  /* Klänge nur mit eingeschalteten Tavernenklängen */
  const tonAn = () => lies("imres-saal-ton") === "1";
  function klang(datei, laut) { if (!tonAn()) return; try { const a = new Audio("klang/" + datei); a.volume = laut; const p = a.play(); if (p && p.catch) p.catch(() => {}); } catch (_) {} }

  let rollt = false;
  function werfen() {
    if (rollt) return;
    rollt = true;
    const wurf = 1 + Math.floor(Math.random() * 20);
    const knopf = karte.querySelector(".wk-wuerfel"), zahl = karte.querySelector(".w-zahl");
    knopf.classList.remove("krit", "patzer"); karte.classList.remove("krit", "patzer");
    knopf.classList.add("rollt");
    const dauer = ruhig ? 150 : 900, start = performance.now();
    klang("holz1.mp3", .35);
    const flimmern = setInterval(() => { zahl.textContent = 1 + Math.floor(Math.random() * 20); }, 60);
    setTimeout(() => klang("holz2.mp3", .3), dauer * .45);
    setTimeout(() => {
      clearInterval(flimmern); knopf.classList.remove("rollt"); rollt = false;
      const art = wurf === 20 ? "krit" : wurf === 1 ? "patzer" : wurf >= 15 ? "hoch" : wurf >= 8 ? "mittel" : "niedrig";
      const helden = Object.keys(t().sprueche[art]);
      letzter = { wurf, art, held: zufall(helden), nr: Math.floor(Math.random() * 10) };
      const st = statistik(); st.n++; st.best = Math.max(st.best, wurf); schreib("imres-wuerfel-tag", JSON.stringify(st));
      karteBauen();
      const k2 = karte.querySelector(".wk-wuerfel");
      if (art === "krit") { k2.classList.add("krit"); karte.classList.add("krit"); funken(); klang("gloeckchen.mp3", .4); }
      if (art === "patzer") { k2.classList.add("patzer"); karte.classList.add("patzer"); klang("timp1.mp3", .25); }
      k2.focus({ preventScroll: true });
    }, dauer);
    void start;
  }
  function funken() {
    if (ruhig) return;
    const f = karte.querySelector(".wk-funken"); if (!f) return;
    f.innerHTML = Array.from({ length: 22 }, () => {
      const w = Math.random() * Math.PI * 2, d = 60 + Math.random() * 90;
      return '<span style="--dx:' + Math.round(Math.cos(w) * d) + "px;--dy:" + Math.round(Math.sin(w) * d) + "px;--v:" + (Math.random() * .15).toFixed(2) + 's"></span>';
    }).join("");
  }
  karte.addEventListener("click", e => { if (e.target.closest(".wk-wuerfel")) werfen(); });

  /* ---------- Abschluss: Siegel ---------- */
  const ende = document.createElement("div"); ende.className = "start-ende";
  uebersicht.appendChild(ende);
  function endeBauen() {
    const T = t();
    ende.innerHTML = '<span class="siegel" aria-hidden="true"><span>IT</span></span>' +
      '<p class="ende-text">' + esc(T.ende) + "</p>" +
      '<p class="ende-klein">' + esc(T.endeKlein) + "</p>" +
      '<a class="ende-hoch" href="#start">' + esc(T.hoch) + "</a>";
  }
  /* „Zurück zur Halle“: ganz nach oben */
  ende.addEventListener("click", e => { if (e.target.closest(".ende-hoch")) { e.preventDefault(); window.scrollTo({ top: 0, behavior: ruhig ? "auto" : "smooth" }); } });

  /* ---------- Aussehen ---------- */
  const W20_ZEICHEN = "data:image/svg+xml," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><g fill="none" stroke="#e0a046" stroke-width="1.6"><polygon points="50,3 91,26.5 91,73.5 50,97 9,73.5 9,26.5"/><path d="M50,22 L78,69 L22,69 Z M50,3 L50,22 M9,26.5 L50,22 L91,26.5 M9,26.5 L22,69 L9,73.5 M91,26.5 L78,69 L91,73.5 M22,69 L50,97 L78,69"/></g></svg>');
  const css = document.createElement("style");
  css.textContent = `
/* Spielleiter und Würfel nebeneinander */
.runde { display: grid; grid-template-columns: minmax(0, 1.35fr) minmax(0, 1fr); gap: clamp(1rem, 3vw, 1.8rem); align-items: stretch; }
.runde:has(> #intro[hidden]) { grid-template-columns: minmax(0, 1fr); }
@media (max-width: 820px) { .runde { grid-template-columns: minmax(0, 1fr); } }
.start-rest .runde .gm { position: relative; overflow: hidden; margin: 0; padding: clamp(1.3rem, 3.5vw, 2.2rem) clamp(1.3rem, 3.5vw, 2.4rem);
  border: 1px solid rgba(224,160,70,.28); border-left: 3px solid var(--ember);
  background: radial-gradient(120% 90% at 0% 0%, rgba(224,160,70,.10), transparent 60%), linear-gradient(160deg, rgba(30,24,34,.92), rgba(16,13,20,.92));
  box-shadow: 0 14px 36px rgba(0,0,0,.4); display: grid; align-content: center; }
.start-rest .runde .gm::after { content: ""; position: absolute; right: -2.5rem; bottom: -2.5rem; width: 13rem; height: 13rem; opacity: .1; transform: rotate(14deg);
  background: url("${W20_ZEICHEN}") center / contain no-repeat; pointer-events: none; }

.wuerfel-karte { position: relative; display: grid; justify-items: center; align-content: start; gap: .5rem; text-align: center; padding: clamp(1.1rem, 3vw, 1.6rem);
  border: 1px solid rgba(224,160,70,.28); background: radial-gradient(90% 70% at 50% 30%, rgba(224,160,70,.12), transparent 70%), linear-gradient(160deg, rgba(30,24,34,.92), rgba(16,13,20,.92));
  box-shadow: 0 14px 36px rgba(0,0,0,.4); transition: border-color .4s, box-shadow .4s; }
.wuerfel-karte.krit { border-color: #ffd27a; box-shadow: 0 0 0 1px #ffd27a, 0 0 46px rgba(255,210,122,.35); }
.wuerfel-karte.patzer { border-color: #c4564a; box-shadow: 0 0 0 1px #c4564a, 0 0 36px rgba(196,86,74,.3); }
.wuerfel-karte .label { margin: 0; }
.wk-titel { margin: 0; font-family: var(--name); font-weight: 400; font-size: clamp(1.4rem, 3vw, 1.75rem); color: var(--vellum); }
.wk-wuerfel { position: relative; width: 7.5rem; height: 7.5rem; padding: 0; border: 0; background: none; cursor: pointer; -webkit-tap-highlight-color: transparent; transition: transform .2s; }
.wk-wuerfel:hover { transform: scale(1.06) rotate(-4deg); }
.wk-wuerfel:focus-visible { outline: 2px solid var(--ember); outline-offset: 6px; border-radius: 12px; }
.wk-wuerfel svg { width: 100%; height: 100%; overflow: visible; filter: drop-shadow(0 8px 18px rgba(0,0,0,.6)); }
.w-flaeche { fill: #2a1f2c; stroke: var(--ember); stroke-width: 2.2; }
.w-kante { fill: none; stroke: rgba(224,160,70,.55); stroke-width: 1.2; }
.w-zahl { fill: #fff2d8; font-family: var(--display); font-size: 25px; text-anchor: middle; }
.wk-wuerfel.rollt svg { animation: wRollen .9s cubic-bezier(.2,.7,.3,1); }
@keyframes wRollen { 0% { transform: rotate(0) scale(1); } 30% { transform: rotate(-260deg) scale(.82) translateY(-10px); } 70% { transform: rotate(-650deg) scale(1.08); } 100% { transform: rotate(-720deg) scale(1); } }
.wk-wuerfel.krit .w-flaeche { fill: #6b4a12; stroke: #ffd27a; }
.wk-wuerfel.krit svg { filter: drop-shadow(0 0 22px rgba(255,210,122,.8)); animation: wKrit 1.2s ease-out; }
@keyframes wKrit { 0% { transform: scale(1); } 25% { transform: scale(1.22); } 100% { transform: scale(1); } }
.wk-wuerfel.patzer .w-flaeche { fill: #3a1512; stroke: #c4564a; }
.wk-wuerfel.patzer svg { animation: wWackeln .5s ease-in-out; }
@keyframes wWackeln { 0%, 100% { transform: translateX(0); } 20% { transform: translateX(-7px) rotate(-4deg); } 40% { transform: translateX(6px) rotate(3deg); } 60% { transform: translateX(-4px); } 80% { transform: translateX(3px); } }
.wk-funken { position: absolute; left: 50%; top: 50%; pointer-events: none; }
.wk-funken span { position: absolute; width: 6px; height: 6px; margin: -3px; border-radius: 50%; background: #ffd27a; box-shadow: 0 0 10px 2px rgba(255,190,90,.9);
  animation: wFunke 1.1s ease-out forwards; animation-delay: var(--v); opacity: 0; }
@keyframes wFunke { 0% { opacity: 1; transform: translate(0, 0) scale(1); } 100% { opacity: 0; transform: translate(var(--dx), var(--dy)) scale(.3); } }
.wk-ergebnis { min-height: 4.6rem; display: grid; gap: .4rem; justify-items: center; width: 100%; }
.wk-hinweis { margin: 0; font-size: .9rem; font-style: italic; color: var(--ash); }
.wk-art { margin: 0; font-family: var(--display); font-size: 1.05rem; letter-spacing: .06em; }
.wk-art.krit { color: #ffd27a; text-shadow: 0 0 14px rgba(255,210,122,.6); }
.wk-art.patzer { color: #e0695c; }
.wk-blase { display: flex; align-items: flex-start; gap: .65rem; max-width: 24rem; text-align: left; animation: blaseEin .4s cubic-bezier(.2,.8,.3,1); }
@keyframes blaseEin { from { opacity: 0; transform: translateY(8px); } }
.wk-blase img { flex: none; width: 2.6rem; height: 2.6rem; border-radius: 50%; object-fit: cover; object-position: top; border: 1px solid var(--ember); }
.wk-blase p { margin: 0; position: relative; padding: .55rem .8rem; background: rgba(235,226,204,.08); border: 1px solid var(--line); border-radius: 4px 12px 12px 12px; font-size: .92rem; line-height: 1.45; color: var(--vellum); }
.wk-blase b { display: block; font-size: .68rem; letter-spacing: .16em; text-transform: uppercase; color: var(--ember); font-weight: 600; margin-bottom: .1rem; }
.wk-statistik { margin: 0; min-height: 1em; font-size: .78rem; color: var(--ash); }

/* Taverne-Kachel doppelt breit – keine Lücke mehr im Raster */
@media (min-width: 760px) { .kacheln .kachel.k-taverne { grid-column: span 2; } }

/* Abschluss mit Siegel */
.start-ende { display: grid; justify-items: center; gap: .35rem; text-align: center; margin-top: clamp(1.5rem, 5vw, 3rem); padding-top: clamp(1.5rem, 5vw, 2.5rem); position: relative; }
.start-ende::before { content: ""; position: absolute; top: 0; left: 50%; width: min(26rem, 80%); transform: translateX(-50%); height: 1px; background: linear-gradient(90deg, transparent, var(--line), transparent); }
.siegel { display: grid; place-items: center; width: 4.4rem; height: 4.4rem; border-radius: 47% 53% 50% 50% / 52% 48% 52% 48%;
  background: radial-gradient(circle at 35% 30%, #c0463c, #8a2119 55%, #5e140f); box-shadow: 0 6px 16px rgba(0,0,0,.55), inset 0 -4px 8px rgba(0,0,0,.35), inset 0 3px 6px rgba(255,150,130,.25); transform: rotate(-8deg); }
.siegel span { display: grid; place-items: center; width: 3.1rem; height: 3.1rem; border-radius: 50%; border: 1.5px solid rgba(255,190,170,.35); font-family: var(--display); font-size: 1.15rem; letter-spacing: .04em; color: rgba(255,215,200,.85); text-shadow: 0 -1px 0 rgba(0,0,0,.4); }
.ende-text { margin: .6rem 0 0; font-family: var(--hand); font-size: clamp(1.7rem, 4.5vw, 2.3rem); color: var(--ember); line-height: 1; }
.ende-klein { margin: 0; font-size: .92rem; color: var(--ash); font-style: italic; }
.ende-hoch { margin-top: .6rem; font-size: .85rem; color: var(--ash); text-decoration: none; border-bottom: 1px dotted var(--line); }
.ende-hoch:hover { color: var(--ember); border-color: var(--ember); }
@media (prefers-reduced-motion: reduce) { .wk-wuerfel.rollt svg, .wk-wuerfel.krit svg, .wk-wuerfel.patzer svg, .wk-blase { animation: none; } }
`;
  document.head.appendChild(css);

  /* ---------- Start ---------- */
  karteBauen(); endeBauen();
  let letzteSprache = sprache();
  new MutationObserver(() => { if (sprache() === letzteSprache) return; letzteSprache = sprache(); karteBauen(); endeBauen(); })
    .observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });
})();
