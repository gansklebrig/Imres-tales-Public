/* =====================================================================
   IMRES TALES – EXTRAS
   ---------------------------------------------------------------------
   Alles Verspielte der Seite steckt in dieser Datei:
   1. Hintergrund: aufsteigende Funken, Kerzenschein, nachts Sterne + Mond
   2. Easter Eggs:
      · Rex schaut ab und zu vom Bildschirmrand herein (antippen!)
      · Barradins Laute neben seinem Beinamen bei den Gefährten – die richtige Melodie hat Folgen
      · „destroyer“ tippen (oder in die Suche schreiben) weckt Ezekiel
      · 7× schnell auf „Imres Tales“ oben links tippen, oder der Konami-Code
        (↑ ↑ ↓ ↓ ← → ← → B A), öffnet das Geheimarchiv (Barradins Notizbuch)
      · Wer lange bleibt, dem wachsen Echos Ranken an den Seitenrand
      · Die Kerze unten rechts auspusten (antippen): Die Seite wird nachtdunkel,
        und Barradins Skizzen glühen im Mondlicht neben den passenden
        Absätzen der Chronik. Antippen sammelt sie im geheimen Skizzenbuch.
   3. Die Taverne: Barradins Loblied bzw. Spott (W20-Probe) und Bestiarium-Memory
      Reime stehen in reime.js, Beleidigungen in spott.js

   LÖSUNG der Lauten-Melodie: C – A – F – E  (Barradins Lieblingsort)
   ===================================================================== */
(function () {
  "use strict";

  const ruhig = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const sprache = () => (document.documentElement.lang === "en" ? "en" : "de");
  const $ = id => document.getElementById(id);
  const zufall = liste => liste[Math.floor(Math.random() * liste.length)];
  const esc = s => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const lies = (k, d) => { try { const v = localStorage.getItem(k); return v == null ? d : v; } catch (_) { return d; } };
  const schreib = (k, v) => { try { localStorage.setItem(k, v); } catch (_) {} };
  const dialogOffen = () => !!document.querySelector("dialog[open]");

  /* ---------- Texte ---------- */
  const TX = {
    de: {
      rexGefunden: n => n === 1 ? "Wuff! Du hast Rex gefunden." : "Wuff! Rex gefunden: " + n + "×",
      rexMeilenstein: { 3: "Rex wedelt. Er mag dich.", 5: "Rex legt dir seine Pfote aufs Knie.", 10: "Rex bringt dir einen Stock. Er ist sehr stolz darauf.", 20: "Friedrich wird langsam eifersüchtig.", 50: "Rex hat dich zum Ehrenmitglied der Gruppe ernannt." },
      rexLabel: "Rex schaut vorbei",
      ezekiel: "Ezekiel the Destroyer ist erwacht.",
      archivLabel: "Streng vertraulich", archivTitel: "Das Geheimarchiv",
      archivText: "Hinter einem losen Stein in der Tavernenwand liegt ein abgegriffenes Notizbuch. Barradins Handschrift. Die Originalseiten, so wie er sie am Spieltisch vollgekritzelt hat – mit allen Fehlern, Flecken und Kritzeleien.",
      archivKnopf: "Notizbuch aufschlagen", schliessen: "Schließen",
      lauteLabel: "Barradins Laute", lauteTitel: "Spiel etwas!",
      lauteText: "Zupf an den Saiten. Barradin stimmt seine Laute immer mit derselben Melodie.",
      lauteFluester: "Barradin flüstert: „Ich stimme sie immer mit meinem Lieblingsort … ein Ort mit Kuchen, Pfeife und vier Buchstaben.“",
      lauteErfolg: "Die Laute erklingt wie von selbst! Barradin schenkt dir eine <strong>Bardische Inspiration</strong>: Deine nächste Loblied-Probe bekommt +1W6.",
      lauteKnopf: "Barradins Laute",
      geheimHinweis: "Manche Geheimnisse dieser Seite verraten sich nur den Neugierigen.",
      kerzeAuspusten: "Kerze auspusten", kerzeAnzuenden: "Kerze wieder anzünden",
      mondAn: "Die Kerze ist aus. Im Mondlicht schimmert Barradins unsichtbare Tinte …",
      kerzeWiederAn: "Die Kerze brennt wieder.",
      skizzeGefunden: (titel, n, g) => "Skizze gefunden: " + titel + "<br><small>" + n + " von " + g + " im geheimen Skizzenbuch</small>",
      skizzenbuchLabel: "Unsichtbare Tinte", skizzenbuchTitel: "Barradins geheimes Skizzenbuch",
      skizzenbuchText: (n, g) => n === g ? "Alle Skizzen gefunden! Barradin ist beeindruckt – und ein kleines bisschen beunruhigt, wie gründlich du in seinen Sachen stöberst." : n + " von " + g + " Skizzen gefunden. Der Rest ist noch irgendwo zwischen den Zeilen versteckt.",
      skizzeUnbekannt: "Noch nicht gefunden",
      skizzenbuchKnopf: (n, g) => "📖 " + n + "/" + g,
      alleSkizzen: "Alle Skizzen gefunden! Das geheime Skizzenbuch ist vollständig.",
      noten: ["C", "D", "E", "F", "G", "A", "H"],
      probeWuerfeln: "W20 werfen", probeNochmal: "Nochmal würfeln", probeTipp: "Wirf den Würfel!",
      modusLob: "♪ Loblied", modusSpott: "⚔ Spott",
      lobLabel: "Auftreten-Probe", lobTitel: "Barradins Loblied", lobZiel: "Wen besingen?",
      lobText: "Wähle, wen Barradin besingen soll, und wirf den W20. Je höher der Wurf, desto prächtiger der Reim und desto dicker die Schmeichelei.",
      spottLabel: "Gehässiger Spott", spottTitel: "Barradins Spott", spottZiel: "Wen verspotten?",
      spottText: "Wähle einen Gegner und wirf den W20. Je höher der Wurf, desto vernichtender die Beleidigung. Aber Vorsicht bei einer 1 …",
      spottGegen: n => "Gehässiger Spott gegen " + n, spottEigentor: "Eigentor!",
      schaden: x => "⚔ " + x + " psychischer Schaden", schadenKrit: x => "⚔ " + x + " psychischer Schaden (kritisch!)",
      schadenKein: "Rettungswurf geschafft – kein Schaden", schadenSelbst: x => "⚔ " + x + " psychischer Schaden – an Barradin selbst",
      probeAuftreten: "Auftreten", probeInspiration: "Inspiration",
      probeAndere: "Jemand anderes …", probeNamePlatz: "Name eintragen",
      probeAuf: n => "Ein Loblied auf " + n,
      inspirationBereit: "✦ Bardische Inspiration bereit: +1W6 auf den nächsten Wurf",
      stufen: {
        patzer: "Kritischer Patzer", schwach: "Mau", maessig: "Ganz ordentlich", gut: "Gelungen", stark: "Grandios", legende: "Legendär", krit: "Kritischer Erfolg!"
      },
      buehne: {
        patzer: "Barradin stolpert über die eigenen Füße. Die Laute macht ein trauriges Plonk.",
        schwach: "Ein paar Gäste husten verlegen.",
        maessig: "Höflicher Applaus aus der Ecke.",
        gut: "Die Taverne klatscht, jemand wirft eine Münze.",
        stark: "Die Gäste springen auf und jubeln!",
        legende: "Stehende Ovationen. Der Wirt gibt eine Runde aus.",
        krit: "Barradin springt auf den Tisch. Die Taverne tobt, irgendwo weint ein Zwerg vor Rührung."
      },
      memNeu: "Neu mischen", memZuege: n => n + (n === 1 ? " Zug" : " Züge"),
      memPaare: (a, b) => a + " von " + b + " Paaren",
      memRekord: n => "Bestleistung: " + n + " Züge",
      memSieg: n => "Alle Kreaturen gebannt – in " + n + " Zügen!",
      memNeuerRekord: " Neuer Rekord!",
      memKarte: "Verdeckte Karte"
    },
    en: {
      rexGefunden: n => n === 1 ? "Woof! You found Rex." : "Woof! Rex found: " + n + "×",
      rexMeilenstein: { 3: "Rex wags his tail. He likes you.", 5: "Rex puts his paw on your knee.", 10: "Rex brings you a stick. He is very proud of it.", 20: "Friedrich is getting a little jealous.", 50: "Rex has made you an honorary member of the party." },
      rexLabel: "Rex is peeking in",
      ezekiel: "Ezekiel the Destroyer has awakened.",
      archivLabel: "Strictly confidential", archivTitel: "The Secret Archive",
      archivText: "Behind a loose stone in the tavern wall lies a well-thumbed notebook. Barradin's handwriting. The original pages, just as he scribbled them at the table – with every mistake, stain and doodle.",
      archivKnopf: "Open the notebook", schliessen: "Close",
      lauteLabel: "Barradin's lute", lauteTitel: "Play something!",
      lauteText: "Pluck the strings. Barradin always tunes his lute with the same melody.",
      lauteFluester: "Barradin whispers: \"I always tune it with my favourite place … somewhere with cake, a pipe and four letters.\"",
      lauteErfolg: "The lute starts playing all by itself! Barradin grants you <strong>Bardic Inspiration</strong>: your next song check gets +1d6.",
      lauteKnopf: "Barradin's lute",
      geheimHinweis: "Some secrets of this page only reveal themselves to the curious.",
      kerzeAuspusten: "Blow out the candle", kerzeAnzuenden: "Light the candle again",
      mondAn: "The candle is out. In the moonlight, Barradin's invisible ink begins to shimmer …",
      kerzeWiederAn: "The candle is burning again.",
      skizzeGefunden: (titel, n, g) => "Sketch found: " + titel + "<br><small>" + n + " of " + g + " in the secret sketchbook</small>",
      skizzenbuchLabel: "Invisible ink", skizzenbuchTitel: "Barradin's Secret Sketchbook",
      skizzenbuchText: (n, g) => n === g ? "Every sketch found! Barradin is impressed – and a little worried at how thoroughly you rummage through his things." : n + " of " + g + " sketches found. The rest are still hidden somewhere between the lines.",
      skizzeUnbekannt: "Not found yet",
      skizzenbuchKnopf: (n, g) => "📖 " + n + "/" + g,
      alleSkizzen: "Every sketch found! The secret sketchbook is complete.",
      noten: ["C", "D", "E", "F", "G", "A", "B"],
      probeWuerfeln: "Roll the d20", probeNochmal: "Roll again", probeTipp: "Roll the die!",
      modusLob: "♪ Praise", modusSpott: "⚔ Mockery",
      lobLabel: "Performance check", lobTitel: "Barradin's Song of Praise", lobZiel: "Who should he praise?",
      lobText: "Pick who Barradin should sing about and roll the d20. The higher the roll, the grander the rhyme and the thicker the flattery.",
      spottLabel: "Vicious Mockery", spottTitel: "Barradin's Mockery", spottZiel: "Who should he mock?",
      spottText: "Pick a foe and roll the d20. The higher the roll, the more devastating the insult. But beware of a 1 …",
      spottGegen: n => "Vicious mockery against " + n, spottEigentor: "Own goal!",
      schaden: x => "⚔ " + x + " psychic damage", schadenKrit: x => "⚔ " + x + " psychic damage (critical!)",
      schadenKein: "Saving throw succeeded – no damage", schadenSelbst: x => "⚔ " + x + " psychic damage – to Barradin himself",
      probeAuftreten: "Performance", probeInspiration: "Inspiration",
      probeAndere: "Someone else …", probeNamePlatz: "Enter a name",
      probeAuf: n => "A song in praise of " + n,
      inspirationBereit: "✦ Bardic Inspiration ready: +1d6 on your next roll",
      stufen: {
        patzer: "Critical fumble", schwach: "Meh", maessig: "Not bad", gut: "Well done", stark: "Magnificent", legende: "Legendary", krit: "Critical success!"
      },
      buehne: {
        patzer: "Barradin trips over his own feet. The lute goes a sad little plonk.",
        schwach: "A few guests cough awkwardly.",
        maessig: "Polite applause from the corner.",
        gut: "The tavern claps, someone tosses a coin.",
        stark: "The guests leap to their feet and cheer!",
        legende: "A standing ovation. The innkeeper buys a round.",
        krit: "Barradin jumps onto the table. The tavern goes wild, somewhere a dwarf weeps with emotion."
      },
      memNeu: "Shuffle again", memZuege: n => n + (n === 1 ? " move" : " moves"),
      memPaare: (a, b) => a + " of " + b + " pairs",
      memRekord: n => "Best: " + n + " moves",
      memSieg: n => "Every creature banished – in " + n + " moves!",
      memNeuerRekord: " New record!",
      memKarte: "Face-down card"
    }
  };
  const t = () => TX[sprache()];

  /* ---------- Barradins Reime: stehen in reime.js, hier werden sie zusammengesetzt ---------- */
  const letzteLieder = [];
  function dichte(stufe, name) {
    const R = (window.BARRADIN_REIME || {})[sprache()];
    if (!R) return name + "!";
    const hoch = !(stufe === "patzer" || stufe === "schwach");
    const lage = hoch ? "hoch" : "tief";
    const pool = stufe === "krit" ? "legende" : stufe;
    const key = String(name).toLowerCase().replace(/[^a-zäöüßéèêáàâíìóòúùñ]/g, "");
    const eigenePaare = R.namen[key] && R.namen[key].paare && R.namen[key].paare[lage];
    let reime = R.namen[key] && R.namen[key][lage];
    if (!reime) {
      const e = R.endungen.find(([m]) => new RegExp("(" + m + ")$").test(key));
      reime = e && e[1][lage];
    }
    const namensTeil = () => eigenePaare && eigenePaare.length && Math.random() < .6
      ? zufall(eigenePaare)
      : reime && reime.length && Math.random() < .85
      ? zufall(R.namensZeilen[lage]) + "\n" + zufall(reime)
      : zufall(R.namensPaare[lage]);
    const paare = (n) => {
      const liste = (R.paare[pool] || []).slice().sort(() => Math.random() - .5);
      return liste.slice(0, n);
    };
    let teile;
    if (Math.random() < .2 && R.ganz[stufe] && R.ganz[stufe].length) {
      teile = [zufall(R.ganz[stufe])];
    } else if (stufe === "legende" || stufe === "krit") {
      const [p1, p2] = paare(2);
      teile = [p1, p2, namensTeil(), zufall(R.schluss)];
    } else if (stufe === "stark") {
      const [p1, p2] = paare(2);
      teile = [p1, namensTeil(), p2];
    } else {
      const [p1] = paare(1);
      teile = Math.random() < .5 ? [p1, namensTeil()] : [namensTeil(), p1];
    }
    const text = teile.filter(Boolean).join("\n").split("{n}").join(name);
    return text.charAt(0).toUpperCase() + text.slice(1);
  }
  function neuesLied(stufe, name) {
    let text = dichte(stufe, name);
    for (let i = 0; i < 6 && letzteLieder.includes(text); i++) text = dichte(stufe, name);
    letzteLieder.push(text); if (letzteLieder.length > 8) letzteLieder.shift();
    return text;
  }
  const SPOTT_ZIELE_EXTRA = { de: ["Ilvara", "Glasstab"], en: ["Ilvara", "Glasstaff"] };
  const schluessel = n => String(n).toLowerCase().replace(/[^a-zäöüßéèêáàâíìóòúùñ]/g, "");
  function spotte(stufe, name) {
    const S = (window.BARRADIN_SPOTT || {})[sprache()];
    if (!S) return name + "!";
    if (stufe === "patzer") return zufall(S.eigentor);
    const key = schluessel(name);
    const k = Object.keys(S.kreaturen).find(x => key === x || key.indexOf(x) > -1);
    const eigen = k ? S.kreaturen[k] : null;
    const allg = S.allgemein[stufe] || S.allgemein.gut;
    let text;
    if (stufe === "schwach") text = zufall(allg);
    else if (stufe === "maessig" || stufe === "gut") text = eigen && Math.random() < .5 ? zufall(eigen) : zufall(allg);
    else if (stufe === "stark") text = eigen && Math.random() < .5 ? zufall(eigen) + " " + zufall(allg) : zufall(allg);
    else text = (eigen && Math.random() < .5 ? zufall(eigen) + "\n\n" : "") + zufall(allg);
    return text.split("{n}").join(name);
  }
  function neuerSpott(stufe, name) {
    let text = spotte(stufe, name);
    for (let i = 0; i < 6 && letzteLieder.includes(text); i++) text = spotte(stufe, name);
    letzteLieder.push(text); if (letzteLieder.length > 8) letzteLieder.shift();
    return text;
  }
  const w4 = n => { let x = 0; for (let i = 0; i < n; i++) x += 1 + Math.floor(Math.random() * 4); return x; };

  const BONUS = 7; /* Barradins Auftreten-Bonus */
  const ZIELE = ["Friedrich", "Echo", "Ezekiel", "Rex", "Imre", "Barradin"];

  /* ---------- Gemeinsame Bausteine ---------- */
  const css = document.createElement("style");
  css.textContent = `
#hintergrund, #kerzenschein, #ranken { position: fixed; inset: 0; z-index: -1; pointer-events: none; }
#kerzenschein {
  background: radial-gradient(ellipse 70% 45% at 92% 100%, rgba(224,160,70,.10), transparent 70%),
              radial-gradient(ellipse 55% 35% at 8% 0%, rgba(224,160,70,.06), transparent 70%);
  animation: flackern 7s infinite;
}
@keyframes flackern {
  0%,100% { opacity: .85 } 11% { opacity: .95 } 13% { opacity: .78 } 27% { opacity: 1 } 42% { opacity: .88 }
  47% { opacity: .96 } 63% { opacity: .8 } 71% { opacity: .93 } 86% { opacity: .84 } 90% { opacity: .98 }
}
#ranken svg { position: absolute; bottom: 0; width: min(34vw, 260px); height: auto; opacity: .55; }
#ranken .links { left: 0; } #ranken .rechts { right: 0; transform: scaleX(-1); }
#ranken path.ranke { fill: none; stroke: var(--moss); stroke-width: 2.2; stroke-linecap: round; stroke-dasharray: 1; stroke-dashoffset: 1; transition: stroke-dashoffset 70s ease-out; }
#ranken .blatt { fill: var(--moss); opacity: 0; transition: opacity 6s ease; }
#ranken.wachsen path.ranke { stroke-dashoffset: 0; }
#ranken.wachsen .blatt { opacity: .9; }

.ex-toast {
  position: fixed; left: 50%; bottom: calc(1.2rem + env(safe-area-inset-bottom, 0px)); z-index: 60;
  transform: translate(-50%, 20px); opacity: 0; transition: opacity .35s, transform .35s;
  max-width: min(26rem, calc(100vw - 32px)); padding: .65rem 1.1rem; text-align: center;
  background: var(--hall); border: 1px solid var(--ember); color: var(--vellum);
  font-family: var(--hand); font-size: 1.35rem; line-height: 1.2; box-shadow: 0 12px 30px rgba(0,0,0,.55); pointer-events: none;
}
.ex-toast.da { opacity: 1; transform: translate(-50%, 0); }

/* Rex */
.rex-guckt {
  position: fixed; z-index: 40; width: 88px; height: 88px; padding: 0; border: 0; background: none; cursor: pointer;
  transition: transform .9s cubic-bezier(.3,1.4,.5,1); -webkit-tap-highlight-color: transparent;
}
.rex-guckt img { width: 100%; height: 100%; display: block; filter: drop-shadow(0 6px 14px rgba(0,0,0,.6)); }
.rex-guckt.unten { bottom: 0; transform: translateY(100%); }
.rex-guckt.unten.da { transform: translateY(42%); }
.rex-guckt.links { left: 0; transform: translateX(-100%) rotate(25deg); }
.rex-guckt.links.da { transform: translateX(-38%) rotate(25deg); }
.rex-guckt.rechts { right: 0; transform: translateX(100%) rotate(-25deg); }
.rex-guckt.rechts.da { transform: translateX(38%) rotate(-25deg); }
.rex-guckt.hops img { animation: hops .45s ease; }
@keyframes hops { 40% { transform: translateY(-14px) } }

/* Ezekiel */
.ezekiel-zorn {
  position: fixed; inset: 0; z-index: 55; pointer-events: none; opacity: 0;
  background: radial-gradient(ellipse at center, transparent 35%, rgba(155,30,25,.55) 100%);
  animation: zorn 2.2s ease forwards;
}
@keyframes zorn { 15% { opacity: 1 } 60% { opacity: .85 } 100% { opacity: 0 } }
main.beben { animation: beben .7s linear; }
@keyframes beben {
  10%,90% { transform: translate(-2px, 1px) } 20%,80% { transform: translate(4px, -2px) }
  30%,50%,70% { transform: translate(-6px, 2px) } 40%,60% { transform: translate(6px, -1px) }
}

/* Laute im Fuß */
.laute-knopf {
  display: inline-block; vertical-align: middle; margin-left: .45rem; background: none; border: 0; padding: .2rem; cursor: pointer;
  opacity: .75; transition: opacity .3s, transform .3s; line-height: 0; -webkit-tap-highlight-color: transparent;
  animation: lautewippen 6s ease-in-out infinite;
}
.laute-knopf:hover, .laute-knopf:focus-visible { opacity: 1; transform: rotate(-10deg) scale(1.1); animation: none; }
.laute-knopf img { width: 32px; height: 32px; filter: invert(1) sepia(1) saturate(3) hue-rotate(-5deg) brightness(1.6); }
@keyframes lautewippen { 0%, 88%, 100% { transform: none; } 92% { transform: rotate(-12deg); } 96% { transform: rotate(8deg); } }
.ex-geheim { flex-basis: 100%; display: flex; align-items: center; gap: .7rem; font-style: italic; font-size: .82rem; color: var(--ash); opacity: .75; }
.laute-dialog .laute-bild { width: min(9rem, 40%); justify-self: center; mix-blend-mode: multiply; transform: rotate(-12deg); }
.saiten { display: grid; gap: .25rem; margin-top: .3rem; }
.saite {
  display: grid; grid-template-columns: 1.6rem 1fr; align-items: center; gap: .6rem;
  background: none; border: 0; padding: .35rem 0; cursor: pointer; font: inherit; color: #6b5a44; -webkit-tap-highlight-color: transparent;
}
.saite b { font-family: var(--name); font-size: 1.15rem; font-weight: 400; color: #2a2118; }
.saite i { display: block; height: 2px; background: linear-gradient(90deg, #7a6247, #b39a72); border-radius: 1px; }
.saite.zupf i { animation: zupf .5s ease-out; }
@keyframes zupf { 0%,40%,80% { transform: scaleY(1) translateY(-2px) } 20%,60% { transform: translateY(2px) } 100% { transform: none } }
.laute-melodie { min-height: 1.6rem; font-family: var(--hand); font-size: 1.5rem; letter-spacing: .3em; color: #6b3a24; }
.laute-hinweis { font-style: italic; color: #4a3d2e; }

/* Geheimarchiv */
.archiv-siegel {
  justify-self: center; width: 5.4rem; height: 5.4rem; border-radius: 50%; display: grid; place-items: center;
  background: radial-gradient(circle at 35% 30%, #c4483a, #7a1d16 70%); color: #f3d9c4;
  font-family: var(--display); font-size: 1.6rem; box-shadow: 0 6px 16px rgba(60,10,8,.45), inset 0 0 0 5px rgba(0,0,0,.12);
  animation: siegel .7s cubic-bezier(.3,1.6,.5,1);
}
@keyframes siegel { from { transform: scale(2.2) rotate(-25deg); opacity: 0 } }
.archiv-knopf, .tav-knopf {
  justify-self: start; display: inline-flex; align-items: center; gap: .5rem; padding: .6rem 1.1rem; cursor: pointer;
  border: 1px solid #7a1d16; background: #7a1d16; color: #f3e6cf; font: inherit; text-decoration: none;
}
.archiv-knopf:hover { background: #9b3a2f; }

/* Taverne */
.taverne { display: grid; gap: clamp(1.5rem, 4vw, 2.5rem); grid-template-columns: minmax(0, 1fr); align-items: start; }
@media (min-width: 900px) { .taverne { grid-template-columns: minmax(0, 5fr) minmax(0, 6fr); } }
.tav-karte { border: 1px solid var(--line); background: color-mix(in srgb, var(--hall) 80%, transparent); padding: clamp(1.2rem, 4vw, 2rem); display: grid; gap: .8rem; }
.tav-karte h3 { font-family: var(--name); font-size: clamp(1.7rem, 5vw, 2.2rem); line-height: 1.05; }
.tav-info { color: var(--ash); }
.probe-modus { display: inline-flex; justify-self: start; border: 1px solid var(--line); margin-bottom: .3rem; }
.probe-modus button { border: 0; background: none; color: var(--ash); font: inherit; font-size: .88rem; padding: .4rem .9rem; cursor: pointer; }
.probe-modus button[aria-selected="true"] { background: var(--ember); color: var(--night); }
#barden-probe.spott .probe-modus button[aria-selected="true"] { background: var(--blood); color: var(--vellum); }
#barden-probe.spott .ziel-wahl button[aria-checked="true"] { background: var(--blood); border-color: var(--blood); color: var(--vellum); }
#barden-probe.spott .w20 .flaeche { stroke: #c4564a; }
.lied.spott { background: linear-gradient(172deg, #efe3cf, #d8c3a3); }
.lied.spott p.vers { font-size: 1.35rem; }
.lied p.schaden { margin-top: .5rem; font-family: var(--display); font-size: 1rem; letter-spacing: .04em; color: #7a1d16; }
.ziel-wahl { display: flex; flex-wrap: wrap; gap: .4rem; }
.ziel-wahl button {
  border: 1px solid var(--line); background: none; color: var(--ash); font: inherit; font-size: .88rem;
  padding: .3rem .75rem; cursor: pointer; border-radius: 999px;
}
.ziel-wahl button[aria-checked="true"] { border-color: var(--ember); color: var(--night); background: var(--ember); }
.ziel-name {
  font: inherit; background: transparent; color: var(--vellum); border: 0; border-bottom: 1px solid var(--line); padding: .4rem .1rem; max-width: 16rem;
}
.ziel-name:focus { outline: none; border-bottom-color: var(--ember); }
.w20-zeile { display: flex; align-items: center; gap: 1.1rem; margin-top: .4rem; }
.w20 { width: 6.2rem; height: 6.2rem; padding: 0; border: 0; background: none; cursor: pointer; position: relative; flex: none; -webkit-tap-highlight-color: transparent; }
.w20 svg { width: 100%; height: 100%; display: block; overflow: visible; }
.w20 .flaeche { fill: color-mix(in srgb, var(--ember) 16%, var(--night)); stroke: var(--ember); stroke-width: 2; stroke-linejoin: round; }
.w20 .kante { fill: none; stroke: var(--ember); stroke-width: 1.2; opacity: .6; stroke-linejoin: round; }
.w20 .zahl { font-family: var(--display); font-size: 21px; fill: var(--vellum); text-anchor: middle; }
.w20:hover svg, .w20:focus-visible svg { filter: drop-shadow(0 0 8px rgba(224,160,70,.5)); }
.w20.rollt svg { animation: rollen .9s cubic-bezier(.2,.7,.3,1); }
.w20.krit svg { filter: drop-shadow(0 0 14px rgba(224,160,70,.9)); }
.w20.patzer .flaeche { fill: color-mix(in srgb, var(--blood) 40%, var(--night)); stroke: var(--blood); }
@keyframes rollen { 0% { transform: rotate(0) scale(1) } 50% { transform: rotate(400deg) scale(.82) } 100% { transform: rotate(720deg) scale(1) } }
.w20-text { display: grid; gap: .15rem; }
.w20-text .gross { font-family: var(--display); font-size: 1.35rem; line-height: 1.1; }
.w20-text small { color: var(--ash); font-size: .85rem; }
.inspiration { font-size: .85rem; color: var(--ember); }
.lied {
  position: relative; margin: .3rem 0 0; padding: 1.3rem 1.3rem 1.1rem;
  background: linear-gradient(172deg, #f1e7cf, #ddcca8); color: #2a2118; box-shadow: 0 14px 30px rgba(0,0,0,.45);
  transform: rotate(-.6deg);
}
.lied .label { color: var(--blood); }
.lied h4 { font-family: var(--name); font-weight: 400; font-size: 1.25rem; margin: .2rem 0 .6rem; color: #1d1610; }
.lied p.vers { font-family: var(--hand); font-size: 1.45rem; line-height: 1.22; white-space: pre-line; color: #2a2118; }
.lied p.buehne { margin-top: .8rem; font-style: italic; font-size: .92rem; color: #5a4a36; }
.lied.neu { animation: entrollen .55s ease-out; }
@keyframes entrollen { from { opacity: 0; transform: translateY(10px) rotate(-.6deg) } }

.memory-kopf { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: baseline; gap: .4rem 1rem; font-size: .9rem; color: var(--ash); }
.memory-kopf strong { color: var(--vellum); font-weight: 600; }
.memory { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: .55rem; }
@media (min-width: 560px) { .memory { grid-template-columns: repeat(4, minmax(0, 1fr)); } }
.mem-karte { aspect-ratio: 3 / 4; padding: 0; border: 0; background: none; cursor: pointer; perspective: 800px; -webkit-tap-highlight-color: transparent; }
.mem-karte .innen { position: relative; display: block; width: 100%; height: 100%; transform-style: preserve-3d; transition: transform .5s cubic-bezier(.3,.8,.4,1); }
.mem-karte.offen .innen, .mem-karte.weg .innen { transform: rotateY(180deg); }
.mem-karte .seite { position: absolute; inset: 0; backface-visibility: hidden; -webkit-backface-visibility: hidden; border: 1px solid var(--line); overflow: hidden; }
.mem-karte .rueck {
  display: grid; place-items: center;
  background: repeating-linear-gradient(45deg, rgba(224,160,70,.07) 0 6px, transparent 6px 12px), var(--hall);
}
.mem-karte .rueck span { font-family: var(--display); color: var(--ember); font-size: clamp(1.1rem, 4vw, 1.6rem); opacity: .7; border: 1px solid var(--line); border-radius: 50%; width: 2.4em; height: 2.4em; display: grid; place-items: center; }
.mem-karte:hover .rueck span, .mem-karte:focus-visible .rueck span { opacity: 1; }
.mem-karte .vorne { transform: rotateY(180deg); background: var(--night); }
.mem-karte .vorne img { width: 100%; height: 100%; object-fit: cover; display: block; }
.mem-karte .vorne em {
  position: absolute; left: 0; right: 0; bottom: 0; padding: 1.2rem .3rem .3rem; text-align: center; font-style: normal;
  font-family: var(--name); font-size: clamp(.72rem, 2.6vw, .95rem); line-height: 1.1; color: var(--vellum);
  background: linear-gradient(transparent, rgba(16,14,21,.92));
}
.mem-karte.weg .vorne { border-color: var(--ember); box-shadow: 0 0 0 1px var(--ember), 0 0 18px rgba(224,160,70,.35); }
.mem-karte.falsch .vorne { border-color: var(--blood); }
.memory-fuss { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: .6rem; }
.memory-sieg { font-family: var(--hand); font-size: 1.45rem; color: var(--ember); line-height: 1.15; }
.tav-knopf { border-color: var(--ember); background: none; color: var(--ember); font-size: .92rem; padding: .45rem 1rem; }
.tav-knopf:hover { background: var(--ember); color: var(--night); }

/* Kerze & Mondlicht: Barradins Skizzen glühen in unsichtbarer Tinte */
#kerzenschein { transition: opacity 1.5s; }
.mondlicht #kerzenschein { opacity: 0 !important; animation: none; }
.kerze {
  position: fixed; right: 4px; bottom: calc(4px + env(safe-area-inset-bottom, 0px)); z-index: 40;
  width: 24px; height: 44px; padding: 0; border: 0; background: none; cursor: pointer; opacity: .62;
  transition: opacity .4s; -webkit-tap-highlight-color: transparent;
}
.kerze:hover, .kerze:focus-visible { opacity: .95; }
.kerze svg { width: 100%; height: 100%; display: block; overflow: visible; }
.kerze .schein { fill: rgba(224,160,70,.18); filter: blur(4px); transition: opacity 1s; animation: kerzenatem 3.4s ease-in-out infinite; }
.kerze .flamme { fill: #e0a046; transform-origin: 20px 22px; animation: flamme 1.7s ease-in-out infinite; transition: opacity .25s, transform .25s; }
.kerze .flamme-kern { fill: #fff1c9; transform-origin: 20px 21px; animation: flamme 1.3s ease-in-out infinite reverse; transition: opacity .2s; }
.kerze .docht { stroke: #2a2118; stroke-width: 1.4; stroke-linecap: round; }
.kerze .wachs { fill: #e9dfc8; stroke: #b9a988; stroke-width: 1; }
.kerze .tropfen { fill: none; stroke: #cbbd9f; stroke-width: 1.2; stroke-linecap: round; }
.kerze .teller { stroke: #8a7556; stroke-width: 2; stroke-linecap: round; }
@keyframes flamme { 50% { transform: scale(.88, 1.08) rotate(3deg); } }
@keyframes kerzenatem { 50% { opacity: .6; } }
.mondlicht .kerze .flamme, .mondlicht .kerze .flamme-kern, .mondlicht .kerze .schein { opacity: 0; animation: none; }
.mondlicht .kerze .docht { stroke: #6b5a44; }
.kerze .rauch {
  position: absolute; left: 50%; top: 14px; width: 10px; height: 26px; margin-left: -5px; border-radius: 50%;
  background: radial-gradient(ellipse, rgba(200,200,215,.55), transparent 70%); filter: blur(2px); pointer-events: none;
  animation: rauch 2.5s ease-out forwards;
}
@keyframes rauch { to { transform: translate(8px, -70px) scale(2.6, 3); opacity: 0; } }

.mondnacht {
  position: fixed; inset: 0; z-index: 8; pointer-events: none; opacity: 0; transition: opacity 1.6s ease;
  background:
    radial-gradient(circle at calc(100% - 34px) 128px, rgba(236,240,255,.5) 0 11px, rgba(190,205,245,.2) 13px, rgba(150,170,230,.08) 45px, rgba(120,140,210,.04) 150px, transparent 300px),
    linear-gradient(rgba(6,9,22,.52), rgba(6,9,22,.58));
}
@media (min-width: 900px) { .mondnacht { background:
    radial-gradient(circle at calc(100% - 120px) 130px, rgba(236,240,255,.92) 0 26px, rgba(190,205,245,.35) 28px, rgba(150,170,230,.12) 80px, rgba(120,140,210,.05) 240px, transparent 480px),
    linear-gradient(rgba(6,9,22,.52), rgba(6,9,22,.58)); } }
.mondnacht.an { opacity: 1; }

#tinten-ebene { position: absolute; top: 0; left: 0; width: 100%; height: 0; z-index: 9; pointer-events: none; }
.tinte {
  position: absolute; padding: 0; border: 0; background: none; cursor: pointer; aspect-ratio: 1;
  opacity: 0; visibility: hidden; pointer-events: none; transition: opacity 1.8s ease, visibility 0s 1.8s, transform .4s;
  -webkit-tap-highlight-color: transparent;
}
.tinte img {
  width: 100%; height: 100%; object-fit: contain; display: block; transform: rotate(var(--dreh, -6deg));
  filter: invert(1) grayscale(1) brightness(1.35) sepia(.25) hue-rotate(180deg) drop-shadow(0 0 5px rgba(170,195,255,.75)) drop-shadow(0 0 14px rgba(140,170,255,.35));
}
.mondlicht .tinte { opacity: .9; visibility: visible; pointer-events: auto; transition: opacity 2.2s ease .6s, visibility 0s, transform .4s; animation: mondglanz 5s ease-in-out infinite; }
.mondlicht .tinte.gefunden { opacity: .38; animation: none; }
.tinte.weg { transform: scale(1.5); opacity: 0 !important; }
@keyframes mondglanz { 50% { filter: brightness(1.25); } }

.mond-buch {
  position: fixed; right: 38px; bottom: calc(10px + env(safe-area-inset-bottom, 0px)); z-index: 40;
  border: 1px solid rgba(190,205,245,.7); background: rgba(16,18,32,.9); color: #dfe6ff; font: inherit; font-size: .9rem;
  padding: .45rem .85rem; cursor: pointer; box-shadow: 0 8px 20px rgba(0,0,0,.5);
  opacity: 0; transform: translateY(10px); pointer-events: none; transition: opacity .6s, transform .6s;
}
.mond-buch.an { opacity: 1; transform: none; pointer-events: auto; }
.mondlicht .ex-toast { border-color: rgba(190,205,245,.7); }
.skizzenbuch { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: .6rem; }
.skizzenbuch button {
  display: grid; gap: .2rem; justify-items: center; align-content: start; padding: .3rem; border: 1px dashed rgba(107,90,68,.35);
  background: none; cursor: pointer; font: inherit; color: #2a2118;
}
.skizzenbuch img { width: 100%; aspect-ratio: 1; object-fit: contain; mix-blend-mode: multiply; }
.skizzenbuch span { font-family: var(--hand); font-size: 1.05rem; line-height: 1.05; text-align: center; max-width: 100%; overflow-wrap: anywhere; hyphens: auto; }
.skizzenbuch .leer { display: grid; place-items: center; width: 100%; aspect-ratio: 1; font-family: var(--display); font-size: 1.6rem; color: rgba(107,90,68,.4); }
.skizze-gross { display: grid; gap: .4rem; justify-items: center; text-align: center; }
.skizze-gross img { width: min(100%, 22rem); mix-blend-mode: multiply; }
.skizze-gross h4 { font-family: var(--hand); font-weight: 600; font-size: 1.9rem; line-height: 1; color: #1d1610; margin: 0; }
.skizze-gross p { color: #4a3d2e; }

.konfetti { position: fixed; z-index: 58; pointer-events: none; font-size: 1.4rem; color: var(--ember); will-change: transform, opacity; }

@media (prefers-reduced-motion: reduce) {
  #kerzenschein, .kerze .flamme, .kerze .flamme-kern, .kerze .schein, .mondlicht .tinte { animation: none; }
  .rex-guckt { transition: none; }
  .laute-knopf, main.beben, .w20.rollt svg, .lied.neu, .archiv-siegel, .saite.zupf i { animation: none; }
  .mem-karte .innen { transition: none; }
}`;
  document.head.appendChild(css);

  let toastTimer;
  function toast(text, dauer) {
    let el = document.querySelector(".ex-toast");
    if (!el) { el = document.createElement("div"); el.className = "ex-toast"; el.setAttribute("role", "status"); document.body.appendChild(el); }
    el.innerHTML = text;
    requestAnimationFrame(() => el.classList.add("da"));
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove("da"), dauer || 3200);
  }

  function konfetti(x, y, zeichen, anzahl) {
    if (ruhig) return;
    const z = zeichen || ["♪", "♫", "✦", "♪", "★"];
    for (let i = 0; i < (anzahl || 26); i++) {
      const s = document.createElement("span");
      s.className = "konfetti";
      s.textContent = zufall(z);
      s.style.left = x + "px"; s.style.top = y + "px";
      s.style.color = zufall(["#e0a046", "#ebe2cc", "#f0c27a", "#c98a3a"]);
      document.body.appendChild(s);
      const w = Math.random() * Math.PI * 2, v = 90 + Math.random() * 200;
      const dx = Math.cos(w) * v, dy = Math.sin(w) * v - 120;
      s.animate([
        { transform: "translate(0,0) rotate(0)", opacity: 1 },
        { transform: `translate(${dx}px, ${dy + 260}px) rotate(${(Math.random() - .5) * 540}deg)`, opacity: 0 }
      ], { duration: 1400 + Math.random() * 900, easing: "cubic-bezier(.2,.6,.4,1)" }).onfinish = () => s.remove();
    }
  }

  /* Einfacher Pergament-Dialog im Stil der Questtafel */
  function pergament(klasse, inhalt) {
    const d = document.createElement("dialog");
    d.className = "quest-dialog " + klasse;
    d.innerHTML = '<form method="dialog"><button class="qd-close" aria-label="' + esc(t().schliessen) + '">×</button></form><div class="qd-inner">' + inhalt + "</div>";
    document.body.appendChild(d);
    d.addEventListener("close", () => d.remove());
    d.addEventListener("click", e => { if (e.target === d) d.close(); });
    if (d.showModal) d.showModal(); else d.setAttribute("open", "");
    return d;
  }

  /* =====================================================================
     1. HINTERGRUND
     ===================================================================== */
  function hintergrund() {
    const schein = document.createElement("div");
    schein.id = "kerzenschein";
    document.body.prepend(schein);

    const cv = document.createElement("canvas");
    cv.id = "hintergrund";
    cv.setAttribute("aria-hidden", "true");
    document.body.prepend(cv);
    const ctx = cv.getContext("2d");
    if (!ctx) return;

    const std = new Date().getHours();
    const nacht = std >= 20 || std < 6;
    let B = 0, H = 0, dpr = 1, sterne = [], funken = [];

    function neueFunke(start) {
      return {
        x: Math.random() * B,
        y: start ? Math.random() * H : H + 10,
        r: .6 + Math.random() * 1.5,
        vy: 10 + Math.random() * 22,
        phase: Math.random() * 6.3,
        schwank: 6 + Math.random() * 14,
        leben: 0,
        dauer: 9 + Math.random() * 12,
        hell: .15 + Math.random() * .3
      };
    }
    function groesse() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      B = window.innerWidth; H = window.innerHeight;
      cv.width = Math.round(B * dpr); cv.height = Math.round(H * dpr);
      cv.style.width = B + "px"; cv.style.height = H + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const flaeche = B * H;
      sterne = nacht ? Array.from({ length: Math.round(Math.min(140, flaeche / 9000)) }, () => ({
        x: Math.random() * B, y: Math.random() * H * .75, r: Math.random() * 1.1 + .25, p: Math.random() * 6.3, s: .4 + Math.random() * 1.2
      })) : [];
      const anzahl = Math.round(Math.min(34, Math.max(14, flaeche / 40000)));
      funken = Array.from({ length: anzahl }, () => neueFunke(true));
    }

    function mond() {
      const mx = B - Math.min(110, B * .18), my = Math.min(95, H * .14), r = 22;
      const g = ctx.createRadialGradient(mx, my, r * .5, mx, my, r * 4);
      g.addColorStop(0, "rgba(235,226,204,.07)"); g.addColorStop(1, "rgba(235,226,204,0)");
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(mx, my, r * 4, 0, 7); ctx.fill();
      ctx.save();
      ctx.beginPath(); ctx.arc(mx, my, r, 0, 7); ctx.clip();
      ctx.fillStyle = "rgba(235,226,204,.20)"; ctx.fillRect(mx - r, my - r, r * 2, r * 2);
      ctx.globalCompositeOperation = "destination-out";
      ctx.fillStyle = "#000"; ctx.beginPath(); ctx.arc(mx - r * .45, my - r * .2, r * .95, 0, 7); ctx.fill();
      ctx.restore();
    }

    let zuletzt = performance.now(), laeuft = true;
    function bild(jetzt) {
      const dt = Math.min(.05, (jetzt - zuletzt) / 1000); zuletzt = jetzt;
      const zeit = jetzt / 1000;
      ctx.clearRect(0, 0, B, H);
      if (nacht) {
        for (const s of sterne) {
          const a = ruhig ? .35 : .18 + .3 * (.5 + .5 * Math.sin(zeit * s.s + s.p));
          ctx.fillStyle = "rgba(235,226,204," + a.toFixed(3) + ")";
          ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, 7); ctx.fill();
        }
        mond();
      }
      for (const f of funken) {
        if (!ruhig) {
          f.leben += dt; f.y -= f.vy * dt;
          if (f.leben > f.dauer || f.y < -10) Object.assign(f, neueFunke(false));
        }
        const x = f.x + Math.sin(zeit * .7 + f.phase) * f.schwank;
        const ein = Math.min(1, f.leben / 1.5), aus = Math.max(0, 1 - f.leben / f.dauer);
        const a = ruhig ? f.hell * .6 : f.hell * ein * aus * (.75 + .25 * Math.sin(zeit * 9 + f.phase));
        const g = ctx.createRadialGradient(x, f.y, 0, x, f.y, f.r * 4);
        g.addColorStop(0, "rgba(255,200,120," + a.toFixed(3) + ")");
        g.addColorStop(.35, "rgba(224,160,70," + (a * .6).toFixed(3) + ")");
        g.addColorStop(1, "rgba(224,120,40,0)");
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, f.y, f.r * 4, 0, 7); ctx.fill();
      }
      if (!ruhig && laeuft) requestAnimationFrame(bild);
    }

    groesse();
    let rt; window.addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(() => { groesse(); if (ruhig) bild(performance.now()); }, 150); });
    document.addEventListener("visibilitychange", () => {
      if (ruhig) return;
      if (document.hidden) laeuft = false;
      else if (!laeuft) { laeuft = true; zuletzt = performance.now(); requestAnimationFrame(bild); }
    });
    requestAnimationFrame(bild);
  }

  /* Echos Ranken: wachsen nach ein paar Minuten auf der Seite */
  function ranken() {
    const zweig = (d) => '<path class="ranke" pathLength="1" d="' + d + '"/>';
    const blatt = (x, y, w) => '<path class="blatt" transform="translate(' + x + " " + y + ") rotate(" + w + ')" d="M0 0 C6 -7 16 -7 20 0 C16 7 6 7 0 0Z"/>';
    const svg = (seite) => '<svg class="' + seite + '" viewBox="0 0 260 420" aria-hidden="true">' +
      zweig("M6 420 C10 360 40 330 30 280 C20 230 60 210 52 160 C46 120 80 100 70 60 C64 36 84 20 96 8") +
      zweig("M30 300 C60 296 80 280 92 258") + zweig("M52 175 C26 160 18 140 22 118") + zweig("M68 82 C92 84 110 72 118 54") +
      blatt(30, 280, -60) + blatt(92, 258, -40) + blatt(22, 118, -110) + blatt(118, 54, -50) + blatt(52, 160, 20) + blatt(96, 8, -60) + blatt(14, 370, -20) +
      "</svg>";
    const el = document.createElement("div");
    el.id = "ranken"; el.setAttribute("aria-hidden", "true");
    el.innerHTML = svg("links") + svg("rechts");
    document.body.prepend(el);
    let sichtbar = 0;
    const iv = setInterval(() => {
      if (document.hidden) return;
      sichtbar += 5;
      if (sichtbar >= 180) { clearInterval(iv); el.classList.add("wachsen"); }
    }, 5000);
  }

  /* =====================================================================
     2. EASTER EGGS
     ===================================================================== */

  /* --- Rex schaut herein --- */
  function rex() {
    const b = document.createElement("button");
    b.type = "button"; b.className = "rex-guckt unten"; b.hidden = true;
    b.setAttribute("aria-label", t().rexLabel);
    b.innerHTML = '<img src="rex-guckt.webp" alt="" width="88" height="88">';
    document.body.appendChild(b);
    let wegTimer, gefunden = parseInt(lies("imres-rex", "0"), 10) || 0;

    function weg() {
      b.classList.remove("da");
      setTimeout(() => { b.hidden = true; plane(); }, 1000);
    }
    function gucken() {
      if (document.hidden || dialogOffen()) { plane(); return; }
      b.className = "rex-guckt " + zufall(["unten", "unten", "links", "rechts"]);
      b.style.left = b.style.right = b.style.top = b.style.bottom = "";
      if (b.classList.contains("unten")) b.style.left = Math.round(10 + Math.random() * (window.innerWidth - 120)) + "px";
      else b.style.top = Math.round(window.innerHeight * (.35 + Math.random() * .4)) + "px";
      b.hidden = false;
      void b.offsetWidth;
      requestAnimationFrame(() => b.classList.add("da"));
      wegTimer = setTimeout(weg, 5200);
    }
    function plane() { setTimeout(gucken, (40 + Math.random() * 70) * 1000); }

    b.addEventListener("click", () => {
      gefunden++; schreib("imres-rex", String(gefunden));
      b.classList.add("hops");
      setTimeout(() => b.classList.remove("hops"), 500);
      const extra = t().rexMeilenstein[gefunden];
      toast(t().rexGefunden(gefunden) + (extra ? "<br><small>" + extra + "</small>" : ""), extra ? 4500 : 2600);
      const r = b.getBoundingClientRect();
      konfetti(r.left + r.width / 2, r.top + 20, ["🐾", "♥", "🦴"], 10);
      clearTimeout(wegTimer); wegTimer = setTimeout(weg, 1500);
    });
    setTimeout(gucken, (20 + Math.random() * 25) * 1000);
  }

  /* --- Ezekiel the Destroyer --- */
  let zornAktiv = false;
  function ezekielErwacht() {
    if (zornAktiv) return;
    zornAktiv = true;
    const z = document.createElement("div");
    z.className = "ezekiel-zorn";
    document.body.appendChild(z);
    const m = document.querySelector("main");
    if (m && !ruhig) m.classList.add("beben");
    if (navigator.vibrate) try { navigator.vibrate([80, 40, 140]); } catch (_) {}
    toast(t().ezekiel, 2800);
    setTimeout(() => { z.remove(); if (m) m.classList.remove("beben"); zornAktiv = false; }, 2300);
  }

  /* --- Geheimarchiv --- */
  function geheimarchiv() {
    if (dialogOffen()) return;
    schreib("imres-archiv", "1");
    const T = t();
    pergament("archiv-dialog",
      '<div class="archiv-siegel" aria-hidden="true">IT</div>' +
      '<p class="label">' + esc(T.archivLabel) + "</p><h3>" + esc(T.archivTitel) + "</h3>" +
      "<p>" + esc(T.archivText) + "</p>" +
      '<a class="archiv-knopf" href="notizbuch.html">📖 ' + esc(T.archivKnopf) + "</a>");
  }

  /* --- Tastatur: „destroyer“ und Konami-Code --- */
  function tastatur() {
    const KONAMI = ["arrowup", "arrowup", "arrowdown", "arrowdown", "arrowleft", "arrowright", "arrowleft", "arrowright", "b", "a"];
    let k = [], wort = "";
    document.addEventListener("keydown", e => {
      const taste = (e.key || "").toLowerCase();
      k.push(taste); if (k.length > KONAMI.length) k.shift();
      if (k.join() === KONAMI.join()) { k = []; geheimarchiv(); }
      if (taste.length === 1 && /[a-z]/.test(taste)) {
        wort = (wort + taste).slice(-9);
        if (wort === "destroyer") { wort = ""; ezekielErwacht(); }
      }
    });
    /* Auf dem Handy: einfach „destroyer“ in die Suche schreiben */
    const such = $("such-feld");
    if (such) such.addEventListener("input", () => { if (/destroyer/i.test(such.value)) ezekielErwacht(); });

    /* 7× schnell auf den Schriftzug oben links */
    const marke = document.querySelector(".top .brand");
    let tipps = [];
    if (marke) marke.addEventListener("click", () => {
      const jetzt = Date.now();
      tipps = tipps.filter(z => jetzt - z < 3500); tipps.push(jetzt);
      if (tipps.length >= 7) { tipps = []; geheimarchiv(); }
    });
  }

  /* --- Barradins Laute --- */
  let audio = null;
  const FREQ = [261.63, 293.66, 329.63, 349.23, 392.0, 440.0, 493.88];
  function zupfen(i, wann, oktave) {
    try {
      audio = audio || new (window.AudioContext || window.webkitAudioContext)();
      if (audio.state === "suspended") audio.resume();
      const f = FREQ[i] * (oktave || 1), sr = audio.sampleRate, n = Math.round(sr * 1.6);
      const buf = audio.createBuffer(1, n, sr), d = buf.getChannelData(0);
      const p = Math.round(sr / f), ring = new Float32Array(p);
      for (let j = 0; j < p; j++) ring[j] = Math.random() * 2 - 1;
      let idx = 0;
      for (let j = 0; j < n; j++) {
        const a = ring[idx], b = ring[(idx + 1) % p];
        d[j] = a;
        ring[idx] = (a + b) * .497;
        idx = (idx + 1) % p;
      }
      const src = audio.createBufferSource(), g = audio.createGain(), lp = audio.createBiquadFilter();
      lp.type = "lowpass"; lp.frequency.value = 2800;
      g.gain.value = .5;
      src.buffer = buf; src.connect(lp); lp.connect(g); g.connect(audio.destination);
      src.start(audio.currentTime + (wann || 0));
    } catch (_) {}
  }
  function laute() {
    /* Die Laute hängt unauffällig an Barradins Beinamen bei den Gefährten */
    const einbauen = () => {
      const zeile = document.querySelector("#barradin .epithet");
      if (!zeile || zeile.querySelector(".laute-knopf")) return;
      const b = document.createElement("button");
      b.type = "button"; b.className = "laute-knopf";
      b.setAttribute("aria-label", t().lauteKnopf);
      b.innerHTML = '<img src="skizze-laute.webp" alt="">';
      zeile.appendChild(b);
    };
    einbauen();
    const helden = $("heroes");
    if (helden) new MutationObserver(einbauen).observe(helden, { childList: true });
    document.addEventListener("click", e => {
      if (!e.target.closest(".laute-knopf")) return;
      const T = t();
      const d = pergament("laute-dialog",
        '<img class="laute-bild" src="skizze-laute.webp" alt="">' +
        '<p class="label">' + esc(T.lauteLabel) + "</p><h3>" + esc(T.lauteTitel) + "</h3>" +
        '<p class="laute-hinweis">' + esc(T.lauteText) + "</p>" +
        '<div class="saiten">' + T.noten.map((nt, i) => '<button type="button" class="saite" data-n="' + i + '"><b>' + nt + "</b><i></i></button>").join("") + "</div>" +
        '<p class="laute-melodie" aria-live="polite"></p><p class="laute-hinweis laute-ergebnis" aria-live="polite"></p>');
      const anzeige = d.querySelector(".laute-melodie"), ergebnis = d.querySelector(".laute-ergebnis");
      let gespielt = [], gesamt = 0, geloest = false;
      d.querySelector(".saiten").addEventListener("click", e => {
        const s = e.target.closest(".saite");
        if (!s || geloest) return;
        const i = +s.dataset.n;
        zupfen(i);
        s.classList.remove("zupf"); void s.offsetWidth; s.classList.add("zupf");
        gespielt.push(i); if (gespielt.length > 4) gespielt.shift();
        gesamt++;
        anzeige.textContent = gespielt.map(x => T.noten[x]).join(" ");
        if (gespielt.join() === "0,5,3,2") { /* C A F E */
          geloest = true;
          [0, 2, 4, 0, 2, 4, 0].forEach((nt, j) => zupfen(nt, .35 + j * .16, j === 6 ? 2 : (j > 2 ? 2 : 1)));
          schreib("imres-inspiration", "1");
          ergebnis.innerHTML = T.lauteErfolg;
          const r = anzeige.getBoundingClientRect();
          konfetti(r.left + r.width / 2, r.top, null, 30);
          inspirationZeigen();
        } else if (gesamt === 10 || (gesamt > 10 && gesamt % 12 === 0)) {
          ergebnis.textContent = T.lauteFluester;
        }
      });
    });
  }

  /* --- Unsichtbare Tinte: Barradins Skizzen sind in der Chronik versteckt --- */
  const SKIZZEN_ORTE = {
    "skizze-demogorgon.webp": /demogorgon/i,
    "skizze-ilvara.webp": /ilvara/i,
    "skizze-ploopploopeen.webp": /ploopploopeen/i,
    "skizze-ettercap.webp": /ettercap/i,
    "skizze-riese.webp": /\briesen?\b|\bgiant/i,
    "skizze-chasme.webp": /chasme/i,
    "skizze-turm.webp": /venomfang/i,
    "skizze-ketten.webp": /\bketten\b|\bchains\b/i,
    "skizze-laute.webp": "#barradin"
  };
  const skizzenListe = () => {
    const q = sprache() === "en" ? (window.INHALT_EN || window.INHALT) : window.INHALT;
    return ((q && q.kunst) || []).filter(k => k.bild);
  };
  const gefundeneSkizzen = () => { try { return JSON.parse(lies("imres-skizzen", "[]")) || []; } catch (_) { return []; } };
  let mondAn = false;
  const anker = new Map(); /* Skizze → Absatz, an dem sie hängt */

  function skizzenVerstecken() {
    let ebene = $("tinten-ebene");
    if (!ebene) { ebene = document.createElement("div"); ebene.id = "tinten-ebene"; ebene.setAttribute("aria-hidden", mondAn ? "false" : "true"); document.body.appendChild(ebene); }
    ebene.innerHTML = ""; anker.clear();
    const absaetze = Array.from(document.querySelectorAll("#chapters .prose > p"));
    const benutzt = new Set(), gefunden = gefundeneSkizzen();
    skizzenListe().forEach((k, i) => {
      const ort = SKIZZEN_ORTE[k.bild];
      let p = null, rand = true;
      if (typeof ort === "string") {
        const box = document.querySelector(ort);
        const ps = box ? box.querySelectorAll(".prose p") : [];
        p = ps[1] || ps[0] || null; rand = false;
      } else if (ort) {
        const frei = a => !benutzt.has(a) && !benutzt.has(a.previousElementSibling) && !benutzt.has(a.nextElementSibling);
        const treffer = absaetze.filter(a => !benutzt.has(a) && ort.test(a.textContent));
        const ueberschrift = a => { let e = a; while ((e = e.previousElementSibling)) { if (e.matches(".sub, h3, h4")) return e.textContent; } const c = a.closest(".chapter"); const h = c && c.querySelector("h3"); return h ? h.textContent : ""; };
        p = treffer.find(a => frei(a) && ort.test(ueberschrift(a))) || treffer.find(frei) || treffer[0] || null;
      }
      if (!p) return;
      benutzt.add(p);
      const b = document.createElement("button");
      b.type = "button";
      b.className = "tinte" + (gefunden.includes(k.bild) ? " gefunden" : "");
      b.dataset.bild = k.bild;
      b.tabIndex = mondAn ? 0 : -1;
      b.style.setProperty("--dreh", ((i % 2 ? 1 : -1) * (4 + (i * 3) % 7)) + "deg");
      b.style.animationDelay = (-i * .7) + "s";
      b.setAttribute("aria-label", k.titel || "");
      b.innerHTML = '<img src="' + esc(k.bild) + '" alt="" loading="lazy">';
      ebene.appendChild(b);
      anker.set(b, { p, rand });
    });
    if (mondAn) skizzenPlatzieren();
  }

  function skizzenPlatzieren() {
    const breit = window.innerWidth >= 1100, sx = window.scrollX, sy = window.scrollY;
    const bilder = Array.from(document.querySelectorAll("#chapters figure, #heroes figure")).map(f => f.getBoundingClientRect()).filter(r => r.width);
    anker.forEach(({ p, rand }, b) => {
      const r = p.getBoundingClientRect();
      if (!r.width) { b.hidden = true; return; }
      b.hidden = false;
      const w = breit && rand ? 150 : Math.min(110, window.innerWidth * .28);
      const x = breit && rand ? r.right + 40 : r.right - w + 12;
      let y = r.top + (breit && rand ? 0 : -8);
      for (let n = 0; n < 4; n++) { /* nicht über Bilder legen */
        const f = bilder.find(f => x < f.right && x + w > f.left && y < f.bottom && y + w > f.top);
        if (!f) break;
        y = f.bottom + 6;
      }
      b.style.width = w + "px";
      b.style.left = Math.round(x + sx) + "px";
      b.style.top = Math.round(y + sy) + "px";
    });
  }

  function skizzeFinden(el) {
    const bild = el.dataset.bild, liste = skizzenListe(), gefunden = gefundeneSkizzen();
    const k = liste.find(x => x.bild === bild);
    if (!k) return;
    if (gefunden.includes(bild)) { skizzenbuch(bild); return; }
    gefunden.push(bild); schreib("imres-skizzen", JSON.stringify(gefunden));
    const r = el.getBoundingClientRect();
    konfetti(r.left + r.width / 2, r.top + r.height / 2, ["✦", "✧", "☾"], 16);
    el.classList.add("weg");
    setTimeout(() => { el.classList.remove("weg"); el.classList.add("gefunden"); }, 700);
    const g = liste.length, n = gefunden.filter(b => liste.some(x => x.bild === b)).length;
    toast(n === g ? t().alleSkizzen : t().skizzeGefunden(esc(k.titel), n, g), 4200);
    buchKnopfAktualisieren();
    if (n === g) setTimeout(() => skizzenbuch(), 1200);
  }

  function buchKnopfAktualisieren() {
    const b = document.querySelector(".mond-buch");
    if (b) {
      const liste = skizzenListe(), n = gefundeneSkizzen().filter(x => liste.some(k => k.bild === x)).length;
      b.textContent = t().skizzenbuchKnopf(n, liste.length);
    }
    const k = document.querySelector(".kerze");
    if (k) k.setAttribute("aria-label", mondAn ? t().kerzeAnzuenden : t().kerzeAuspusten);
  }

  function puff() {
    if (ruhig) return;
    try {
      audio = audio || new (window.AudioContext || window.webkitAudioContext)();
      if (audio.state === "suspended") audio.resume();
      const n = Math.round(audio.sampleRate * .35), buf = audio.createBuffer(1, n, audio.sampleRate), d = buf.getChannelData(0);
      for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 2);
      const src = audio.createBufferSource(), f = audio.createBiquadFilter(), g = audio.createGain();
      f.type = "lowpass"; f.frequency.value = 900; g.gain.value = .35;
      src.buffer = buf; src.connect(f); f.connect(g); g.connect(audio.destination); src.start();
    } catch (_) {}
  }

  function mondlicht(an) {
    mondAn = an;
    const html = document.documentElement, kerze = document.querySelector(".kerze");
    let nacht = document.querySelector(".mondnacht"), buch = document.querySelector(".mond-buch");
    if (an) {
      if (!nacht) { nacht = document.createElement("div"); nacht.className = "mondnacht"; nacht.setAttribute("aria-hidden", "true"); document.body.appendChild(nacht); }
      if (!buch) {
        buch = document.createElement("button"); buch.type = "button"; buch.className = "mond-buch";
        buch.addEventListener("click", () => skizzenbuch());
        document.body.appendChild(buch);
      }
      if (kerze) {
        const r = document.createElement("span"); r.className = "rauch"; kerze.appendChild(r);
        setTimeout(() => r.remove(), 2600);
      }
      puff();
      html.classList.add("mondlicht");
      skizzenPlatzieren();
      requestAnimationFrame(() => { nacht.classList.add("an"); buch.classList.add("an"); });
      toast(t().mondAn, 4800);
    } else {
      html.classList.remove("mondlicht");
      if (nacht) nacht.classList.remove("an");
      if (buch) buch.classList.remove("an");
      toast(t().kerzeWiederAn, 2200);
    }
    const ebene = $("tinten-ebene");
    if (ebene) { ebene.setAttribute("aria-hidden", an ? "false" : "true"); ebene.querySelectorAll(".tinte").forEach(b => b.tabIndex = an ? 0 : -1); }
    buchKnopfAktualisieren();
  }

  function skizzenbuch(offen) {
    if (dialogOffen()) return;
    const T = t(), liste = skizzenListe(), gefunden = gefundeneSkizzen();
    const n = liste.filter(k => gefunden.includes(k.bild)).length;
    const d = pergament("skizzenbuch-dialog",
      '<p class="label">' + esc(T.skizzenbuchLabel) + "</p><h3>" + esc(T.skizzenbuchTitel) + "</h3>" +
      "<p>" + esc(T.skizzenbuchText(n, liste.length)) + '</p><div class="skizze-gross" hidden></div><div class="skizzenbuch">' +
      liste.map(k => gefunden.includes(k.bild)
        ? '<button type="button" data-bild="' + esc(k.bild) + '"><img src="' + esc(k.bild) + '" alt=""><span>' + esc(k.titel) + "</span></button>"
        : '<button type="button" disabled aria-label="' + esc(T.skizzeUnbekannt) + '"><span class="leer">?</span></button>').join("") + "</div>");
    const gross = d.querySelector(".skizze-gross");
    const zeige = bild => {
      const k = liste.find(x => x.bild === bild);
      if (!k) return;
      gross.hidden = false;
      gross.innerHTML = '<img src="' + esc(k.bild) + '" alt=""><h4>' + esc(k.titel) + "</h4>" + (k.text ? "<p>" + esc(k.text) + "</p>" : "");
      gross.scrollIntoView({ block: "nearest" });
    };
    d.querySelector(".skizzenbuch").addEventListener("click", e => { const b = e.target.closest("[data-bild]"); if (b) zeige(b.dataset.bild); });
    if (offen) zeige(offen);
  }

  function tinteStarten() {
    const kerze = document.createElement("button");
    kerze.type = "button"; kerze.className = "kerze";
    kerze.innerHTML = '<svg viewBox="0 0 40 74" aria-hidden="true">' +
      '<ellipse class="schein" cx="20" cy="18" rx="18" ry="18"/>' +
      '<path class="flamme" d="M20 6C24 13 25.5 17 20 23 14.5 17 16 13 20 6Z"/>' +
      '<path class="flamme-kern" d="M20 13C21.6 16 22 18 20 21 18 18 18.4 16 20 13Z"/>' +
      '<path class="docht" d="M20 22v4" />' +
      '<path class="wachs" d="M12 27h16v36H12z"/><path class="tropfen" d="M24 27c0 6 2 7 2 10s-3 3-3 0"/>' +
      '<path class="teller" d="M4 66h32M7 63h26"/></svg>';
    document.body.appendChild(kerze);
    kerze.addEventListener("click", () => mondlicht(!mondAn));
    buchKnopfAktualisieren();

    skizzenVerstecken();
    document.addEventListener("click", e => { const el = e.target.closest(".tinte"); if (el) { e.preventDefault(); skizzeFinden(el); } });
    let rt;
    const neuPlatzieren = () => { if (!mondAn) return; clearTimeout(rt); rt = setTimeout(skizzenPlatzieren, 60); };
    window.addEventListener("resize", neuPlatzieren);
    if (window.ResizeObserver) new ResizeObserver(neuPlatzieren).observe(document.body);
    const kap = $("chapters");
    if (kap) {
      let wt;
      new MutationObserver(() => { clearTimeout(wt); wt = setTimeout(skizzenVerstecken, 50); }).observe(kap, { childList: true });
    }
  }


  /* =====================================================================
     3. DIE TAVERNE
     ===================================================================== */

  /* --- Barradins Loblied --- */
  let modus = "lob";
  const zielWahl = { lob: ZIELE[0], spott: null };
  let eigenerName = "";
  let letzterWurf = null;
  let ziel = ZIELE[0];
  function spottZiele() {
    const namen = bestien().map(b => b.name);
    (SPOTT_ZIELE_EXTRA[sprache()] || []).forEach(n => { if (!namen.includes(n)) namen.push(n); });
    return namen;
  }
  function modusZeichnen() {
    const T = t(), box = $("probe-modus");
    if (!box) return;
    box.innerHTML = ["lob", "spott"].map(m => '<button type="button" role="tab" data-modus="' + m + '" aria-selected="' + (modus === m) + '">' + esc(m === "lob" ? T.modusLob : T.modusSpott) + "</button>").join("");
    const lob = modus === "lob";
    $("probe-label").textContent = lob ? T.lobLabel : T.spottLabel;
    $("probe-titel").textContent = lob ? T.lobTitel : T.spottTitel;
    $("probe-text").textContent = lob ? T.lobText : T.spottText;
    $("ziel-wahl").setAttribute("aria-label", lob ? T.lobZiel : T.spottZiel);
    $("barden-probe").classList.toggle("spott", !lob);
  }
  function inspirationZeigen() {
    const el = $("inspiration");
    if (el) { el.hidden = lies("imres-inspiration", "0") !== "1"; el.textContent = t().inspirationBereit; }
  }
  function zielName() { return ziel === "*" ? (eigenerName.trim() || (sprache() === "en" ? "you" : "dich")) : ziel; }
  function zieleZeichnen() {
    const box = $("ziel-wahl");
    if (!box) return;
    const liste = modus === "lob" ? ZIELE : spottZiele();
    if (ziel !== "*" && !liste.includes(ziel)) ziel = liste[0];
    box.innerHTML = liste.map(n => '<button type="button" role="radio" data-ziel="' + esc(n) + '" aria-checked="' + (ziel === n) + '">' + esc(n) + "</button>").join("") +
      '<button type="button" role="radio" data-ziel="*" aria-checked="' + (ziel === "*") + '">' + esc(t().probeAndere) + "</button>";
    $("ziel-name").placeholder = t().probeNamePlatz;
    $("ziel-name").hidden = ziel !== "*";
  }
  function stufe(wurf, summe) {
    if (wurf === 1) return "patzer";
    if (wurf === 20) return "krit";
    if (summe <= 11) return "schwach";
    if (summe <= 16) return "maessig";
    if (summe <= 21) return "gut";
    if (summe <= 25) return "stark";
    return "legende";
  }
  function liedZeigen(neu) {
    if (!letzterWurf) {
      if ($("w20-gross")) { $("w20-gross").textContent = t().probeTipp; $("w20-klein").textContent = "+" + BONUS + " " + t().probeAuftreten; }
      return;
    }
    const T = t(), w = letzterWurf, s = w.stufe, spott = w.modus === "spott";
    if (neu || w.sprache !== sprache()) { w.text = spott ? neuerSpott(s, w.name) : neuesLied(s, w.name); w.sprache = sprache(); }
    const vers = esc(w.text);
    const titel = spott && s === "patzer" ? T.spottEigentor : T.stufen[s];
    $("w20-gross").textContent = titel;
    $("w20-klein").textContent = w.wurf + " + " + BONUS + " " + T.probeAuftreten + (w.insp ? " + " + w.insp + " " + T.probeInspiration : "") + " = " + w.summe;
    const box = $("lied");
    box.hidden = false;
    box.classList.toggle("spott", spott);
    let unten;
    if (spott) {
      const S = (window.BARRADIN_SPOTT || {})[sprache()];
      const reaktion = S ? S.reaktion[s].split("{n}").join(w.name) : "";
      const schaden = s === "patzer" ? T.schadenSelbst(w.schaden) : s === "schwach" ? T.schadenKein : s === "krit" ? T.schadenKrit(w.schaden) : T.schaden(w.schaden);
      unten = '<p class="buehne">' + esc(reaktion) + '</p><p class="schaden">' + esc(schaden) + "</p>";
    } else unten = '<p class="buehne">' + esc(T.buehne[s]) + "</p>";
    box.innerHTML = '<p class="label">' + esc(titel) + "</p><h4>" + esc(spott ? T.spottGegen(w.name) : T.probeAuf(w.name)) + '</h4><p class="vers">' + vers + "</p>" + unten;
    if (neu) { box.classList.remove("neu"); void box.offsetWidth; box.classList.add("neu"); }
    $("w20-los").textContent = T.probeNochmal;
  }
  function wuerfeln() {
    const btn = $("w20"), zahl = $("w20-zahl");
    if (btn.classList.contains("rollt")) return;
    const wurf = 1 + Math.floor(Math.random() * 20);
    let insp = 0;
    if (lies("imres-inspiration", "0") === "1") { insp = 1 + Math.floor(Math.random() * 6); schreib("imres-inspiration", "0"); }
    const summe = wurf + BONUS + insp;
    btn.classList.remove("krit", "patzer");
    const fertig = () => {
      btn.classList.remove("rollt");
      zahl.textContent = wurf;
      if (wurf === 20) btn.classList.add("krit");
      if (wurf === 1) btn.classList.add("patzer");
      const st = stufe(wurf, summe);
      letzterWurf = { wurf, insp, summe, stufe: st, name: zielName(), modus, schaden: st === "patzer" ? w4(1) : st === "krit" ? w4(4) : w4(2) };
      liedZeigen(true);
      inspirationZeigen();
      const r = btn.getBoundingClientRect();
      if (wurf === 20 || letzterWurf.stufe === "legende") konfetti(r.left + r.width / 2, r.top + r.height / 2, modus === "spott" ? ["💥", "⚡", "✦", "☠"] : null, wurf === 20 ? 44 : 24);
      if (wurf === 1 && !ruhig) btn.animate([{ transform: "translateX(0)" }, { transform: "translateX(-6px)" }, { transform: "translateX(6px)" }, { transform: "translateX(0)" }], { duration: 300, iterations: 2 });
    };
    if (ruhig) { fertig(); return; }
    btn.classList.add("rollt");
    let n = 0;
    const iv = setInterval(() => {
      zahl.textContent = 1 + Math.floor(Math.random() * 20);
      if (++n > 12) { clearInterval(iv); fertig(); }
    }, 65);
  }
  function lobliedStarten() {
    if (!$("w20")) return;
    modusZeichnen();
    zieleZeichnen();
    $("probe-modus").addEventListener("click", e => {
      const b = e.target.closest("[data-modus]");
      if (!b || b.dataset.modus === modus) return;
      zielWahl[modus] = ziel;
      modus = b.dataset.modus;
      ziel = zielWahl[modus] || (modus === "lob" ? ZIELE[0] : spottZiele()[0]);
      modusZeichnen(); zieleZeichnen();
    });
    $("ziel-wahl").addEventListener("click", e => {
      const b = e.target.closest("[data-ziel]");
      if (!b) return;
      ziel = b.dataset.ziel;
      zieleZeichnen();
      if (ziel === "*") $("ziel-name").focus();
    });
    $("ziel-name").addEventListener("input", e => { eigenerName = e.target.value.slice(0, 30); });
    $("ziel-name").addEventListener("keydown", e => { if (e.key === "Enter") wuerfeln(); });
    $("w20").addEventListener("click", wuerfeln);
    $("w20-los").addEventListener("click", wuerfeln);
    $("w20-los").textContent = t().probeWuerfeln;
    liedZeigen(false);
    inspirationZeigen();
  }

  /* --- Bestiarium-Memory --- */
  let mem = { karten: [], offen: [], zuege: 0, paare: 0, sperre: false };
  function bestien() {
    const q = sprache() === "en" ? (window.INHALT_EN || window.INHALT) : window.INHALT;
    return ((q && q.bestiarium) || []).filter(b => b.bild);
  }
  function memoryNeu() {
    const alle = bestien().slice().sort(() => Math.random() - .5);
    const wahl = alle.slice(0, Math.min(6, alle.length));
    const karten = [];
    wahl.forEach((b, i) => { karten.push({ id: i, bild: b.bild }); karten.push({ id: i, bild: b.bild }); });
    for (let i = karten.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [karten[i], karten[j]] = [karten[j], karten[i]]; }
    mem = { karten, offen: [], zuege: 0, paare: 0, sperre: false, gesamt: wahl.length };
    const grid = $("memory");
    grid.innerHTML = karten.map((k, i) =>
      '<button type="button" class="mem-karte" data-i="' + i + '" aria-label="' + esc(t().memKarte) + '"><span class="innen">' +
      '<span class="seite rueck"><span>IT</span></span>' +
      '<span class="seite vorne"><img src="' + esc(k.bild) + '" alt="" loading="lazy"><em></em></span></span></button>').join("");
    namenSetzen();
    $("memory-sieg").textContent = "";
    memoryStatus();
  }
  function namenSetzen() {
    const liste = bestien();
    document.querySelectorAll("#memory .mem-karte").forEach(el => {
      const k = mem.karten[+el.dataset.i];
      const b = liste.find(x => x.bild === k.bild);
      el.querySelector("em").textContent = b ? b.name : "";
      if (el.classList.contains("offen") || el.classList.contains("weg")) el.setAttribute("aria-label", b ? b.name : "");
      else el.setAttribute("aria-label", t().memKarte);
    });
  }
  function memoryStatus() {
    const T = t(), rekord = parseInt(lies("imres-memory-rekord", "0"), 10);
    $("memory-zuege").textContent = T.memZuege(mem.zuege);
    $("memory-paare").textContent = T.memPaare(mem.paare, mem.gesamt || 0);
    $("memory-rekord").textContent = rekord ? T.memRekord(rekord) : "";
    $("memory-neu").textContent = T.memNeu;
  }
  function memoryKlick(e) {
    const el = e.target.closest(".mem-karte");
    if (!el || mem.sperre || el.classList.contains("offen") || el.classList.contains("weg")) return;
    el.classList.add("offen");
    mem.offen.push(el);
    namenSetzen();
    if (mem.offen.length < 2) return;
    mem.zuege++;
    const [a, b] = mem.offen;
    if (mem.karten[+a.dataset.i].id === mem.karten[+b.dataset.i].id) {
      mem.offen = [];
      setTimeout(() => { a.classList.replace("offen", "weg"); b.classList.replace("offen", "weg"); namenSetzen(); }, 350);
      mem.paare++;
      if (mem.paare === mem.gesamt) {
        const rekord = parseInt(lies("imres-memory-rekord", "0"), 10);
        const neu = !rekord || mem.zuege < rekord;
        if (neu) schreib("imres-memory-rekord", String(mem.zuege));
        setTimeout(() => {
          $("memory-sieg").textContent = t().memSieg(mem.zuege) + (neu && rekord ? t().memNeuerRekord : "");
          const r = $("memory").getBoundingClientRect();
          konfetti(r.left + r.width / 2, r.top + r.height / 2, ["✦", "⚔", "★", "♪"], 34);
        }, 500);
      }
    } else {
      mem.sperre = true;
      setTimeout(() => { a.classList.add("falsch"); b.classList.add("falsch"); }, 450);
      setTimeout(() => {
        a.classList.remove("offen", "falsch"); b.classList.remove("offen", "falsch");
        mem.offen = []; mem.sperre = false; namenSetzen();
      }, 1100);
    }
    memoryStatus();
  }
  function memoryStarten() {
    if (!$("memory")) return;
    if (!bestien().length) { const k = $("memory-karte"); if (k) k.hidden = true; return; }
    $("memory").addEventListener("click", memoryKlick);
    $("memory-neu").addEventListener("click", memoryNeu);
    memoryNeu();
  }

  /* ---------- Sprachwechsel ---------- */
  function sprachwechsel() {
    if ($("probe-modus")) modusZeichnen();
    if (modus === "spott" && ziel !== "*" && !spottZiele().includes(ziel)) ziel = spottZiele()[0];
    zieleZeichnen();
    if ($("w20-los")) $("w20-los").textContent = letzterWurf ? t().probeNochmal : t().probeWuerfeln;
    liedZeigen(false);
    inspirationZeigen();
    if ($("memory") && mem.karten.length) { namenSetzen(); memoryStatus(); if (mem.paare === mem.gesamt && mem.gesamt) $("memory-sieg").textContent = t().memSieg(mem.zuege); }
    const r = document.querySelector(".rex-guckt"); if (r) r.setAttribute("aria-label", t().rexLabel);
    const l = document.querySelector(".laute-knopf"); if (l) l.setAttribute("aria-label", t().lauteKnopf);
    skizzenVerstecken(); buchKnopfAktualisieren();
  }

  /* ---------- Start ---------- */
  function start() {
    hintergrund();
    ranken();
    rex();
    tastatur();
    laute();
    tinteStarten();
    lobliedStarten();
    memoryStarten();
    new MutationObserver(sprachwechsel).observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
})();
