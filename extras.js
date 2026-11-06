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
    if (stufe === "patzer") return zufall(S.eigentor.concat(S.eigentorReime || []));
    const key = schluessel(name);
    const finde = obj => { const k = obj && Object.keys(obj).find(x => key === x || key.indexOf(x) > -1); return k ? obj[k] : null; };
    const eigen = finde(S.kreaturen), eigenReim = finde(S.kreaturReime);
    const allg = S.allgemein[stufe] || S.allgemein.gut;
    const gereimt = (S.reime && S.reime[stufe]) || [];
    const r = Math.random();
    let text;
    if (stufe === "schwach") text = gereimt.length && r < .5 ? zufall(gereimt) : zufall(allg);
    else if (stufe === "legende" || stufe === "krit") {
      const vorne = eigenReim && r < .3 ? zufall(eigenReim) : eigen && r < .45 ? zufall(eigen) : "";
      text = (vorne ? vorne + "\n\n" : "") + zufall(allg.concat(gereimt));
    } else if (eigenReim && r < .3) text = zufall(eigenReim);
    else if (eigen && r < .45) text = zufall(eigen) + (stufe === "stark" ? " " + zufall(allg) : "");
    else if (gereimt.length && r < .8) text = zufall(gereimt);
    else text = zufall(allg);
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
.kerze.im-spiel { opacity: 0; visibility: hidden; pointer-events: none; transition: opacity .3s, visibility 0s .3s; }
.mem-karte, .memory-fuss button, .tav-knopf { touch-action: manipulation; }
.kerze svg { width: 100%; height: 100%; display: block; overflow: visible; }
.kerze .schein { fill: rgba(224,160,70,.18); filter: blur(4px); transition: opacity 1s; animation: kerzenatem 3.4s ease-in-out infinite; }
@media (pointer: coarse) { .kerze .schein { filter: none; opacity: .75; } }
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

#tinten-ebene { position: absolute; top: 0; left: 0; width: 100%; height: 0; z-index: 9; pointer-events: none; overflow: clip; }
.mondlicht #tinten-ebene { overflow: visible; }
html, body { overflow-x: clip; }
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
    const handyFunken = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent || "") || matchMedia("(pointer: coarse)").matches;
    function groesse() {
      /* Handy: die Funken sind weiche Lichtpunkte – in einfacher Auflösung sieht man keinen Unterschied, spart aber drei Viertel der Pixel */
      dpr = Math.min(window.devicePixelRatio || 1, handyFunken ? 1 : 2);
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
      /* Handy: 30 statt 60 Bilder pro Sekunde – die Funken steigen langsam, das Auge merkt es nicht, der Akku schon */
      if (handyFunken && !ruhig && jetzt - zuletzt < 30) { if (laeuft) { if (verdeckt()) laeuft = false; else requestAnimationFrame(bild); } return; }
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
      if (!ruhig && laeuft) { if (verdeckt()) laeuft = false; else requestAnimationFrame(bild); }
    }
    /* Ein Spiel im Vollbild verdeckt den Hintergrund ganz – dann keine Bilder rechnen */
    const verdeckt = () => !!(document.fullscreenElement || document.webkitFullscreenElement) || document.documentElement.classList.contains("tav-voll-offen") || document.documentElement.classList.contains("zyn-pult"); /* Zynthian-Pult deckt die Seite ab */
    const weiter = () => {
      if (ruhig || laeuft || document.hidden || verdeckt()) return;
      laeuft = true; zuletzt = performance.now(); requestAnimationFrame(bild);
    };

    groesse();
    let rt; window.addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(() => { groesse(); if (ruhig) bild(performance.now()); }, 150); });
    document.addEventListener("visibilitychange", () => {
      if (ruhig) return;
      if (document.hidden) laeuft = false;
      else weiter();
    });
    document.addEventListener("fullscreenchange", weiter);
    document.addEventListener("webkitfullscreenchange", weiter);
    new MutationObserver(weiter).observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
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
    b.innerHTML = '<img src="rex-guckt.webp" alt="" width="88" height="88" loading="eager" decoding="sync">';
    document.body.appendChild(b);
    const bild = b.querySelector("img");
    /* Rex erst zeigen, wenn sein Bild wirklich geladen und dekodiert ist –
       sonst schiebt sich nur ein leerer, durchsichtiger Rahmen ins Bild */
    let bereit = false;
    const laden = () => {
      const tmp = new Image();
      tmp.onload = () => { bild.src = tmp.src; (bild.decode ? bild.decode() : Promise.resolve()).then(() => { bereit = true; }, () => { bereit = true; }); };
      tmp.onerror = () => { bereit = false; };
      tmp.src = "rex-guckt.webp" + (laden.n++ ? "?v=" + laden.n : "");
    };
    laden.n = 0; laden();
    let wegTimer, gefunden = parseInt(lies("imres-rex", "0"), 10) || 0;

    function weg() {
      b.classList.remove("da");
      setTimeout(() => { b.hidden = true; plane(); }, 1000);
    }
    function gucken() {
      if (document.hidden || dialogOffen()) { plane(); return; }
      if (!bereit || !bild.complete || !bild.naturalWidth) { bereit = false; laden(); setTimeout(gucken, 8000); return; }
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
    "skizze-ketten.webp": /lag in fesseln|\blay bound\b/i, /* das Erwachen im Kerker der Drow */
    "skizze-themberchaud.webp": /themberchaud/i,
    "skizze-laute.webp": "#barradin"
  };
  const skizzenListe = () => {
    const q = sprache() === "en" ? (window.INHALT_EN || window.INHALT) : window.INHALT;
    return ((q && q.kunst) || []).filter(k => k.bild);
  };
  const gefundeneSkizzen = () => { try { const g = JSON.parse(lies("imres-skizzen", "[]")); return Array.isArray(g) ? g.filter(x => typeof x === "string") : []; } catch (_) { return []; } };
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
      /* Bild erst laden, wenn die Kerze brennt (sonst lädt die Startseite alle Skizzen vorab) */
      b.innerHTML = mondAn ? '<img src="' + esc(k.bild) + '" alt="" loading="lazy">' : '<img data-src="' + esc(k.bild) + '" alt="">';
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
      const x = Math.min(breit && rand ? r.right + 40 : r.right - w + 12, document.documentElement.clientWidth - w - 4);
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
    if (an) document.querySelectorAll("#tinten-ebene img[data-src]").forEach(i => { i.src = i.dataset.src; i.removeAttribute("data-src"); });
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
    /* Während ein Spiel offen ist (Taverne in der Einzelansicht), schwebt die Kerze nicht über der Spielfläche –
       auf dem Handy würde man sie sonst versehentlich antippen. */
    const spielOffen = () => {
      const tv = document.getElementById("taverne");
      if (!tv || !tv.classList.contains("saal-einzeln") || tv.hidden) return false;
      return tv.getClientRects().length > 0 && getComputedStyle(tv).visibility !== "hidden";
    };
    let kerzeRaf = 0;
    const kerzePruefen = () => { kerzeRaf = 0; const an = spielOffen(); if (kerze.classList.contains("im-spiel") !== an) { kerze.classList.toggle("im-spiel", an); kerze.tabIndex = an ? -1 : 0; kerze.setAttribute("aria-hidden", String(an)); } };
    const kerzeBald = () => { if (!kerzeRaf) kerzeRaf = requestAnimationFrame(kerzePruefen); };
    const tvBeobachten = () => {
      const tv = document.getElementById("taverne"); if (!tv) return false;
      new MutationObserver(kerzeBald).observe(tv, { attributes: true, attributeFilter: ["class", "hidden", "style"] });
      return true;
    };
    if (!tvBeobachten()) setTimeout(tvBeobachten, 1500);
    new MutationObserver(kerzeBald).observe(document.body, { attributes: true, attributeFilter: ["class", "hidden"] });
    window.addEventListener("hashchange", () => setTimeout(kerzeBald, 50));
    window.addEventListener("popstate", () => setTimeout(kerzeBald, 50));
    kerzeBald(); setTimeout(kerzeBald, 1500);
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

  /* --- Bestiarium-Memory ---
     Allein: drei Tischgrößen (4×3, 4×4, 6×4) mit getrennten Rekorden, wahlweise auf Zeit (eigene Bestzeit).
     Jede Partie würfelt Kartenrückseite (Farbe + Siegel), Tischtuch und Kerzenlicht neu aus.
     Die Kartengröße wird gemessen (mmMessen): Raster, Kopf und „Neu mischen“ passen immer ohne Scrollen
     ins Fenster; im Querformat steht die Steuerung rechts neben dem Tisch (UWQHD: breitbild.css).
     Tastatur: Pfeiltasten wandern über die Karten, Enter/Leertaste deckt auf.
     Für controller.js: #memory-karte._memory = { karten(), spalten(), aufdecken(i), neu(), aktiv(), … } (siehe memoryStarten) */
  Object.assign(TX.de, {
    memStufen: { "4x3": "Lehrling – 6 Paare", "4x4": "Abenteurer – 8 Paare", "6x4": "Held – 12 Paare" },
    memStufeGruppe: "Tischgröße",
    memZeitKnopf: "⏱ Auf Zeit", memZeitTitel: "Die Uhr läuft ab der ersten Karte – mit eigener Bestzeit",
    memZeit: s => "⏱ " + s, memBestzeit: s => "Bestzeit: " + s,
    memSiegZeit: (s, n) => "Alle Kreaturen gebannt – in " + s + " (" + n + " Züge)!",
    memWertZuege: n => "in " + n + (n === 1 ? " Zug" : " Zügen"), memWertZeit: (s, n) => s + " · " + n + (n === 1 ? " Zug" : " Züge"),
    memSiegTitel: ["Alle Kreaturen gebannt!", "Das Bestiarium ist gezähmt!", "Kein Monster bleibt verdeckt!", "Ein Gedächtnis wie ein Drache!"],
    memSiegSprueche: [
      "Barradin dichtet schon die Ballade dazu. Alle elf Strophen.",
      "Friedrich behauptet, er hätte es in der Hälfte geschafft. Mit verbundenen Augen.",
      "Rex hat jede Karte beschnuppert. Gefressen hat er keine. Fast keine.",
      "Ezekiel nickt anerkennend. Bei ihm ist das ein Gefühlsausbruch.",
      "Echo hat heimlich mitgezählt – und sich gründlich verzählt.",
      "Selbst der Demogorgon wäre beeindruckt. Mit beiden Köpfen."
    ],
    memRekordNeu: "Neuer Rekord!", memNochmal: "Nochmal mischen"
  });
  Object.assign(TX.en, {
    memStufen: { "4x3": "Apprentice – 6 pairs", "4x4": "Adventurer – 8 pairs", "6x4": "Hero – 12 pairs" },
    memStufeGruppe: "Table size",
    memZeitKnopf: "⏱ Timed", memZeitTitel: "The clock starts with the first card – with its own best time",
    memZeit: s => "⏱ " + s, memBestzeit: s => "Best time: " + s,
    memSiegZeit: (s, n) => "Every creature banished – in " + s + " (" + n + " moves)!",
    memWertZuege: n => "in " + n + (n === 1 ? " move" : " moves"), memWertZeit: (s, n) => s + " · " + n + (n === 1 ? " move" : " moves"),
    memSiegTitel: ["Every creature banished!", "The bestiary is tamed!", "No monster stays hidden!", "A memory like a dragon!"],
    memSiegSprueche: [
      "Barradin is already writing the ballad. All eleven verses.",
      "Friedrich claims he would have done it in half the moves. Blindfolded.",
      "Rex sniffed every single card. He ate none of them. Almost none.",
      "Ezekiel nods approvingly. For him, that is an emotional outburst.",
      "Echo secretly kept count – and lost it completely.",
      "Even the Demogorgon would be impressed. Both heads."
    ],
    memRekordNeu: "New record!", memNochmal: "Shuffle again"
  });

  /* Weitere Kreaturen aus Chronik und Skizzenbuch – so reicht es auch für 6×4 (12 Paare) */
  const MEM_ZUSATZ = [
    { bild: "ploopploopeen.jpg", de: "Ploopploopeen", en: "Ploopploopeen", pos: "50% 30%" },
    { bild: "themberchaud.webp", de: "Themberchaud", en: "Themberchaud", pos: "50% 16%", frei: true },
    { bild: "riese.webp", de: "Der rasende Riese", en: "The Raging Giant", pos: "50% 20%" },
    { bild: "ilvara-wahr.webp", de: "Ilvara", en: "Ilvara", pos: "50% 5%", frei: true },
    { bild: "skizze-ettercap.webp", de: "Ettercap", en: "Ettercap", pos: "50% 50%", skizze: true }
  ];
  const MEM_STUFEN = { "4x3": [4, 3], "4x4": [4, 4], "6x4": [6, 4] };
  function memPool() {
    const en = sprache() === "en";
    const pool = bestien().map(b => ({ bild: b.bild, name: b.name, pos: "50% 30%", frei: /\.(webp|png)$/i.test(b.bild) }));
    MEM_ZUSATZ.forEach(z => { if (!pool.some(p => p.bild === z.bild)) pool.push({ bild: z.bild, name: en ? z.en : z.de, pos: z.pos, frei: !!z.frei, skizze: !!z.skizze }); });
    return pool;
  }
  const mischen = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

  /* Rekorde: Züge je Tischgröße (4×3 behält den alten Schlüssel – den liest auch der Spielesaal), Bestzeit je Tischgröße */
  const rekordSchluessel = (st, zeit) => zeit ? "imres-memory-zeit-" + st : st === "4x3" ? "imres-memory-rekord" : "imres-memory-rekord-" + st;
  const rekordLesen = (st, zeit) => parseInt(lies(rekordSchluessel(st, zeit), "0"), 10) || 0;
  function zeitText(ms) {
    const z = Math.max(0, Math.floor(ms / 100)), min = Math.floor(z / 600), sek = Math.floor(z / 10) % 60;
    return min + ":" + String(sek).padStart(2, "0") + (sprache() === "en" ? "." : ",") + (z % 10);
  }

  /* --- Ausstattung: jede Partie sieht ein bisschen anders aus --- */
  const MEM_FARBEN = [
    { a: "#4a2d10", b: "#1d1108", g: "#e0a046" },              /* Bernstein */
    { a: "#561a22", b: "#21080b", g: "#ebb75e" },              /* Ochsenblut */
    { a: "#1b412d", b: "#0a1912", g: "#dcb660" },              /* Smaragd */
    { a: "#44193d", b: "#180916", g: "#e6b25f" },              /* Pflaume */
    { a: "#2e2a22", b: "#0e0d0b", g: "#d9a441" },              /* Kohle und Gold */
    { a: "#efe0b9", b: "#c4a872", g: "#70391a", hell: true }   /* Pergament mit Tinte */
  ];
  const MEM_SIEGEL = {
    it: '<path d="M50 66V94M45 66H55M45 94H55M62 66H78M70 66V94M66 94H74"/>',
    auge: '<path d="M40 80Q60 62 80 80Q60 98 40 80Z"/><circle cx="60" cy="80" r="6"/><path d="M60 57V61M60 99V103M45 63L47 66M75 63L73 66" stroke-width="2"/>',
    algiz: '<path d="M60 59V101M60 80L45 63M60 80L75 63"/>',
    w20: '<path stroke-width="2.2" d="M60 58L79 69V91L60 102L41 91V69ZM60 67L71.5 87H48.5ZM60 58V67M79 69L71.5 87M41 69L48.5 87M79 91L71.5 87M41 91L48.5 87M60 102L71.5 87M60 102L48.5 87"/>',
    mond: '<path d="M67 61A20 20 0 1 0 67 99A15.5 15.5 0 1 1 67 61Z"/><path stroke-width="1.6" d="M74 68l1.3 2.8 3 .4-2.2 2 .6 3-2.7-1.5-2.7 1.5.6-3-2.2-2 3-.4Z"/>',
    klaue: '<path d="M47 61Q56 80 48 100M59 59Q68 80 60 101M71 61Q80 80 72 100"/>',
    othala: '<path d="M60 58L72 72L50 101M60 58L48 72L70 101"/>'
  };
  const MEM_TUECHER = ["filz", "samt", "holz", "leder", "karte"];
  const MEM_KERZEN = [["14%", "10%"], ["86%", "8%"], ["50%", "-8%"], ["8%", "90%"], ["92%", "88%"], ["30%", "-4%"]];
  let memLook = null;
  function rueckSvg(f, siegel) {
    const g = f.g, ecke = ([x, y, sx, sy]) => '<path d="M' + x + " " + (y + sy * 15) + " Q" + (x + sx * 2) + " " + (y + sy * 2) + " " + (x + sx * 15) + " " + y + '" stroke-width="1"/>' +
      '<circle cx="' + (x + sx * 5.5) + '" cy="' + (y + sy * 5.5) + '" r="1.7" fill="' + g + '" stroke="none"/>';
    const punkte = Array.from({ length: 8 }, (_, i) => { const w = i * Math.PI / 4 + Math.PI / 8; return '<circle cx="' + (60 + Math.cos(w) * 38.5).toFixed(1) + '" cy="' + (80 + Math.sin(w) * 38.5).toFixed(1) + '" r="1.4" fill="' + g + '" stroke="none"/>'; }).join("");
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 160" preserveAspectRatio="none">' +
      '<defs><radialGradient id="h" cx="50%" cy="42%" r="78%"><stop offset="0" stop-color="' + f.a + '"/><stop offset="1" stop-color="' + f.b + '"/></radialGradient>' +
      '<radialGradient id="s" cx="45%" cy="38%" r="70%"><stop offset="0" stop-color="' + f.a + '"/><stop offset="1" stop-color="' + f.b + '"/></radialGradient>' +
      '<pattern id="m" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><path d="M0 0H10M0 0V10" stroke="' + g + '" stroke-opacity="' + (f.hell ? ".16" : ".11") + '" stroke-width=".8" fill="none"/></pattern></defs>' +
      '<rect width="120" height="160" fill="url(#h)"/><rect width="120" height="160" fill="url(#m)"/>' +
      '<g fill="none" stroke="' + g + '"><rect x="6" y="6" width="108" height="148" rx="4" stroke-width="1.7"/>' +
      '<rect x="10.5" y="10.5" width="99" height="139" rx="2" stroke-width=".6" stroke-opacity=".75"/>' +
      [[10.5, 10.5, 1, 1], [109.5, 10.5, -1, 1], [10.5, 149.5, 1, -1], [109.5, 149.5, -1, -1]].map(ecke).join("") +
      '<path d="M60 19L64 25L60 31L56 25ZM60 129L64 135L60 141L56 135Z" fill="' + g + '" fill-opacity=".55" stroke-width=".6"/>' +
      '<path d="M60 31V40M60 120V129" stroke-width=".8" stroke-opacity=".7"/>' +
      '<circle cx="60" cy="80" r="33" fill="url(#s)" stroke-width="2"/><circle cx="60" cy="80" r="28" stroke-width=".7" stroke-dasharray="2 2.6"/>' + punkte +
      '<g stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round">' + MEM_SIEGEL[siegel] + "</g></g></svg>";
    return 'url("data:image/svg+xml,' + encodeURIComponent(svg) + '")';
  }
  /* Neue Ausstattung auswürfeln – nie genau dieselbe Farbe, dasselbe Siegel oder Tuch wie zuletzt */
  function memLookNeu() {
    const grid = $("memory"); if (!grid) return;
    const anders = (liste, alt) => { const l = liste.filter(x => x !== alt); return zufall(l.length ? l : liste); };
    const alt = memLook || {};
    const farbe = anders(MEM_FARBEN, alt.farbe), siegel = anders(Object.keys(MEM_SIEGEL), alt.siegel);
    let tuch = anders(MEM_TUECHER, alt.tuch); const kerze = anders(MEM_KERZEN, alt.kerze);
    if (tuch === "filz" && farbe === MEM_FARBEN[2]) tuch = "samt"; /* grüne Karten nicht auf grünem Filz */
    memLook = { farbe, siegel, tuch, kerze };
    grid.dataset.tuch = tuch;
    grid.style.setProperty("--mem-rueck", rueckSvg(farbe, siegel));
    grid.style.setProperty("--kx", kerze[0]); grid.style.setProperty("--ky", kerze[1]);
    grid.style.setProperty("--flacker", (2.2 + Math.random() * 1.6).toFixed(2) + "s");
  }

  function kartenHtml(bild, i) {
    const p = memPool().find(x => x.bild === bild) || { bild, pos: "50% 30%" };
    return '<button type="button" class="mem-karte" data-i="' + i + '" style="--i:' + i + '" aria-label="' + esc(t().memKarte) + '"><span class="innen">' +
      '<span class="seite rueck"><i></i></span>' +
      '<span class="seite vorne' + (p.skizze ? " skizze" : p.frei ? " frei" : "") + '"><img src="' + esc(p.bild) + '" alt="" draggable="false" decoding="async" style="object-position:' + esc(p.pos) + '"><em></em></span></span></button>';
  }

  let mem = { karten: [], offen: [], zuege: 0, paare: 0, sperre: false, gesamt: 0 };
  let memStufe = MEM_STUFEN[lies("imres-memory-stufe", "")] ? lies("imres-memory-stufe", "4x3") : "4x3";
  let memAufZeit = lies("imres-memory-aufzeit", "0") === "1";
  let memUhr = 0;
  function bestien() {
    const q = sprache() === "en" ? (window.INHALT_EN || window.INHALT) : window.INHALT;
    return ((q && q.bestiarium) || []).filter(b => b.bild);
  }
  function memoryNeu() {
    if (md) return;
    const grid = $("memory"); if (!grid) return;
    const [sp, zl] = MEM_STUFEN[memStufe];
    const wahl = mischen(memPool()).slice(0, Math.floor(sp * zl / 2));
    const karten = [];
    wahl.forEach((b, i) => { karten.push({ id: i, bild: b.bild }); karten.push({ id: i, bild: b.bild }); });
    mischen(karten);
    zeitStopp();
    mem = { karten, offen: [], zuege: 0, paare: 0, sperre: false, gesamt: wahl.length, stufe: memStufe, aufZeit: memAufZeit, laeuft: false, start: 0, dauer: 0 };
    wahl.forEach(b => { const im = new Image(); im.decoding = "async"; im.src = b.bild; }); /* vorladen: beim Umdrehen ist das Bild schon da */
    memLookNeu();
    grid.classList.remove("sieg");
    grid.innerHTML = karten.map((k, i) => kartenHtml(k.bild, i)).join("");
    if (!ruhig) { grid.classList.remove("austeilen"); void grid.offsetWidth; grid.classList.add("austeilen"); const s = mem; setTimeout(() => { if (mem === s) grid.classList.remove("austeilen"); }, 1300); }
    namenSetzen();
    $("memory-sieg").textContent = "";
    memoryStatus(); wahlZeichnen();
    mmMessen();
  }
  function namenSetzen() {
    const pool = memPool();
    document.querySelectorAll("#memory .mem-karte").forEach(el => {
      const k = mem.karten[+el.dataset.i]; if (!k) return;
      const b = pool.find(x => x.bild === k.bild);
      el.querySelector("em").textContent = b ? b.name : "";
      if (el.classList.contains("offen") || el.classList.contains("weg")) el.setAttribute("aria-label", b ? b.name : "");
      else el.setAttribute("aria-label", t().memKarte);
    });
  }
  function memoryStatus() {
    const T = t(), zeit = mem.aufZeit, rekord = rekordLesen(mem.stufe || memStufe, zeit);
    $("memory-zuege").textContent = T.memZuege(mem.zuege);
    $("memory-paare").textContent = T.memPaare(mem.paare, mem.gesamt || 0);
    $("memory-rekord").textContent = rekord ? (zeit ? T.memBestzeit(zeitText(rekord)) : T.memRekord(rekord)) : "";
    $("memory-neu").textContent = T.memNeu;
    const z = $("memory-zeit"); if (z) { z.hidden = !zeit; uhrTick(); }
  }

  /* Uhr für den Zeit-Modus: läuft ab der ersten Karte, hält an, solange der Tab im Hintergrund ist */
  const zeitJetzt = () => mem.laeuft ? performance.now() - mem.start : (mem.dauer || 0);
  function uhrTick() { const z = $("memory-zeit"); if (z && mem.aufZeit) z.textContent = t().memZeit(zeitText(zeitJetzt())); }
  function zeitStart() { mem.start = performance.now(); mem.laeuft = true; clearInterval(memUhr); memUhr = setInterval(uhrTick, 100); uhrTick(); }
  function zeitStopp() { clearInterval(memUhr); memUhr = 0; if (mem.laeuft) { mem.dauer = performance.now() - mem.start; mem.laeuft = false; } }
  let memVersteckt = 0;
  document.addEventListener("visibilitychange", () => {
    if (!mem.laeuft) return;
    if (document.hidden) memVersteckt = performance.now();
    else if (memVersteckt) { mem.start += performance.now() - memVersteckt; memVersteckt = 0; }
  });

  function memoryKlick(e) {
    if (md) { mdKlick(e); return; } /* Online-Duell: eigene Regeln, siehe unten */
    karteAufdecken(e.target.closest(".mem-karte"), true);
  }
  function karteAufdecken(el, nutzer) {
    if (!el || mem.sperre || el.classList.contains("offen") || el.classList.contains("weg") || !mem.gesamt || mem.paare === mem.gesamt) return false;
    /* „Start“ ist die erste Karte einer Partie: auf kleinen Bildschirmen dann ins Vollbild */
    if (nutzer && mem.zuege === 0 && !mem.offen.length && window.tavVollAuto) window.tavVollAuto("memory-karte");
    if (mem.aufZeit && !mem.laeuft && !mem.dauer) zeitStart();
    el.classList.add("offen");
    mem.offen.push(el);
    namenSetzen();
    if (mem.offen.length < 2) return true;
    mem.zuege++;
    const [a, b] = mem.offen;
    /* Jedes Spiel ist ein eigenes mem-Objekt: Zeitgeber eines alten Spiels (nach „Neues Spiel“) tun nichts mehr */
    const spiel = mem;
    if (mem.karten[+a.dataset.i].id === mem.karten[+b.dataset.i].id) {
      mem.offen = [];
      mem.paare++;
      const fertig = mem.paare === mem.gesamt;
      if (fertig) zeitStopp();
      setTimeout(() => {
        if (mem !== spiel) return;
        a.classList.replace("offen", "weg"); b.classList.replace("offen", "weg");
        treffer(a); treffer(b);
        namenSetzen();
      }, 380);
      if (fertig) {
        const st = mem.stufe, rz = rekordLesen(st, false), neuZ = !rz || mem.zuege < rz;
        if (neuZ) schreib(rekordSchluessel(st, false), String(mem.zuege));
        let neu = !mem.aufZeit && neuZ && !!rz, alt = rz;
        if (mem.aufZeit) {
          const ms = Math.round(mem.dauer), rt = rekordLesen(st, true);
          alt = rt; neu = !!rt && ms < rt;
          if (!rt || ms < rt) schreib(rekordSchluessel(st, true), String(ms));
        }
        mem.neuerRekord = neu;
        setTimeout(() => { if (mem === spiel) siegZeigen(spiel, neu || !alt); }, 820);
      }
    } else {
      mem.sperre = true;
      setTimeout(() => { if (mem !== spiel) return; a.classList.add("falsch"); b.classList.add("falsch"); }, 450);
      setTimeout(() => {
        if (mem !== spiel) return;
        a.classList.remove("offen", "falsch"); b.classList.remove("offen", "falsch");
        mem.offen = []; mem.sperre = false; namenSetzen();
      }, 1100);
    }
    memoryStatus();
    return true;
  }

  /* Treffer: die Karte glüht auf und sprüht Funken (auch im Duell) */
  function treffer(el) {
    el.classList.remove("treffer"); void el.offsetWidth; el.classList.add("treffer");
    setTimeout(() => el.classList.remove("treffer"), 1000);
    funken(el, 12);
  }
  function funken(el, anzahl) {
    if (ruhig) return;
    const grid = $("memory"); if (!grid || !el.isConnected) return;
    const gr = grid.getBoundingClientRect(), r = el.getBoundingClientRect();
    const cx = r.left - gr.left + r.width / 2, cy = r.top - gr.top + r.height / 2;
    for (let i = 0; i < anzahl; i++) {
      const s = document.createElement("span");
      s.className = "mem-funke" + (i % 3 ? "" : " gross");
      s.style.left = cx + "px"; s.style.top = cy + "px";
      grid.appendChild(s);
      const w = Math.random() * Math.PI * 2, v = r.width * (.45 + Math.random() * .7);
      s.animate([
        { transform: "translate(-50%,-50%) scale(1)", opacity: 1 },
        { transform: "translate(calc(-50% + " + (Math.cos(w) * v).toFixed(1) + "px), calc(-50% + " + (Math.sin(w) * v - r.height * .15).toFixed(1) + "px)) scale(.15)", opacity: 0 }
      ], { duration: 550 + Math.random() * 550, easing: "cubic-bezier(.15,.7,.35,1)" }).onfinish = () => s.remove();
    }
  }

  /* Sieg: Welle über den Tisch, dann eine Pergamenttafel mit Wachssiegel */
  function siegZeigen(spiel, rekordJubel) {
    const grid = $("memory"), T = t(); if (!grid) return;
    const zeit = spiel.aufZeit, s = zeitText(spiel.dauer || 0);
    $("memory-sieg").textContent = zeit ? T.memSiegZeit(s, spiel.zuege) : T.memSieg(spiel.zuege) + (spiel.neuerRekord ? T.memNeuerRekord : "");
    grid.classList.add("sieg");
    const tafel = document.createElement("div");
    tafel.className = "mem-siegtafel";
    tafel.innerHTML = '<div class="mst-innen"><span class="mst-siegel" aria-hidden="true">IT</span>' +
      '<p class="mst-titel">' + esc(zufall(T.memSiegTitel)) + "</p>" +
      '<p class="mst-wert">' + esc(zeit ? T.memWertZeit(s, spiel.zuege) : T.memWertZuege(spiel.zuege)) + "</p>" +
      (spiel.neuerRekord ? '<p class="mst-rekord">' + esc(T.memRekordNeu) + "</p>" : "") +
      '<p class="mst-spruch">' + esc(zufall(T.memSiegSprueche)) + "</p>" +
      '<button type="button" class="tav-knopf mst-nochmal">' + esc(T.memNochmal) + "</button></div>";
    tafel.addEventListener("click", e => {
      e.stopPropagation();
      if (e.target.closest(".mst-nochmal")) { memoryNeu(); const k = grid.querySelector(".mem-karte"); if (k) k.focus({ preventScroll: true }); return; }
      tafel.classList.add("zu"); /* antippen: Blick frei auf den Tisch */
    });
    grid.appendChild(tafel);
    const fokusWar = document.activeElement && grid.contains(document.activeElement);
    setTimeout(() => {
      if (mem !== spiel || !tafel.isConnected) return;
      if (fokusWar) { const b = tafel.querySelector(".mst-nochmal"); if (b) b.focus({ preventScroll: true }); }
      const r = tafel.querySelector(".mst-innen").getBoundingClientRect();
      konfetti(r.left + r.width / 2, r.top + r.height / 3, ["✦", "⚔", "★", "♪"], rekordJubel ? 46 : 30);
      grid.querySelectorAll(".mem-karte").forEach((k, i) => { if (i % 3 === 0) setTimeout(() => funken(k, 5), i * 30); });
    }, ruhig ? 0 : 650);
  }

  /* Auswahl: Tischgröße und Zeit-Modus (stehen im Fuß neben „Neu mischen“) */
  function wahlBauen() {
    const fuss = document.querySelector("#memory-karte .memory-fuss");
    if (!fuss || $("memory-wahl")) return;
    const w = document.createElement("div");
    w.className = "memory-wahl"; w.id = "memory-wahl";
    w.innerHTML = '<span class="mw-stufen" role="group">' + Object.keys(MEM_STUFEN).map(s => '<button type="button" data-stufe="' + s + '">' + s.replace("x", "×") + "</button>").join("") + "</span>" +
      '<button type="button" class="mw-zeit"></button>';
    fuss.insertBefore(w, fuss.querySelector(".memory-knoepfe") || $("memory-neu"));
    w.addEventListener("click", e => {
      const b = e.target.closest("button"); if (!b || md) return;
      if (b.dataset.stufe) { memStufe = b.dataset.stufe; schreib("imres-memory-stufe", memStufe); }
      else { memAufZeit = !memAufZeit; schreib("imres-memory-aufzeit", memAufZeit ? "1" : "0"); }
      if (window.tavVollAuto) window.tavVollAuto("memory-karte");
      memoryNeu();
    });
    const kopf = document.querySelector("#memory-karte .memory-kopf");
    if (kopf && !$("memory-zeit")) { const z = document.createElement("span"); z.id = "memory-zeit"; z.className = "memory-zeit"; z.hidden = true; kopf.appendChild(z); }
  }
  function wahlZeichnen() {
    const w = $("memory-wahl"); if (!w) return;
    const T = t();
    w.querySelector(".mw-stufen").setAttribute("aria-label", T.memStufeGruppe);
    w.querySelectorAll("[data-stufe]").forEach(b => { const an = b.dataset.stufe === memStufe; b.setAttribute("aria-pressed", an ? "true" : "false"); b.title = T.memStufen[b.dataset.stufe]; b.setAttribute("aria-label", T.memStufen[b.dataset.stufe]); });
    const z = w.querySelector(".mw-zeit");
    z.textContent = T.memZeitKnopf; z.title = T.memZeitTitel; z.setAttribute("aria-pressed", memAufZeit ? "true" : "false");
  }

  /* --- Kartengröße: alles passt ohne Scrollen ins Fenster ---
     Gemessen werden zwei Anordnungen – „hoch“ (Kopf, Tisch, Fuß untereinander) und „quer“ (Tisch links,
     alles andere rechts daneben) – jeweils auch mit gedrehtem Raster (z. B. 3×4 statt 4×3 auf dem Handy).
     Gewählt wird die mit den größten Karten. Auf UWQHD ordnet breitbild.css an, hier wird nur die Größe gesetzt. */
  const BREIT_MQ = window.matchMedia ? window.matchMedia("(min-width: 2200px) and (min-height: 1200px) and (min-aspect-ratio: 19/10)") : { matches: false };
  let memSpalten = 4, messPlan = 0;
  function mmPlanen() { if (messPlan) return; messPlan = requestAnimationFrame(() => { messPlan = 0; mmMessen(); }); }
  function ordnung(n) {
    if (n === 12) return [4, 3]; if (n === 16) return [4, 4]; if (n === 24) return [6, 4];
    const c = Math.max(2, Math.round(Math.sqrt(n * 1.33))); return [c, Math.ceil(n / c)];
  }
  const memAbstand = kw => Math.min(14, Math.max(4, kw * .07));
  const memRand = kw => Math.min(22, Math.max(6, kw * .1));
  function kwFuer(W, H, c, r) {
    let kw = 100;
    for (let k = 0; k < 4; k++) {
      const g = memAbstand(kw), rd = memRand(kw);
      kw = Math.min((W - 2 * rd - 2 - (c - 1) * g) / c, (H - 2 * rd - 2 - (r - 1) * g) / r * .75);
    }
    return Math.floor(Math.max(0, kw));
  }
  function seitenHoehe(karte) {
    let oben = Infinity, unten = -Infinity;
    Array.from(karte.children).forEach(el => {
      if (el.id === "memory" || el.classList.contains("tav-voll-knopf") || el.classList.contains("memory-sieg")) return;
      const cs = getComputedStyle(el); if (cs.position === "absolute" || cs.position === "fixed" || !el.getClientRects().length) return;
      const r = el.getBoundingClientRect(); oben = Math.min(oben, r.top); unten = Math.max(unten, r.bottom);
    });
    return unten > oben ? unten - oben : 0;
  }
  function mmMessen() {
    const karte = $("memory-karte"), grid = $("memory");
    if (!karte || !grid || karte.hidden) return;
    const voll = karte.classList.contains("tav-voll");
    if (!karte.getClientRects().length) return; /* gerade nicht zu sehen */
    const n = grid.querySelectorAll(".mem-karte").length; if (!n) return;
    const [c, r] = ordnung(n);
    const ih = window.innerHeight, rem = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
    let obenRes = 0, untenRes = 0;
    if (!voll) {
      const top = document.querySelector(".top"); if (top && top.getClientRects().length) obenRes = Math.max(0, top.getBoundingClientRect().height);
      const hl = document.querySelector(".handyleiste");
      if (hl) { const cs = getComputedStyle(hl), rr = hl.getBoundingClientRect(); if (cs.display !== "none" && cs.position === "fixed" && rr.height > 0 && rr.top < ih) untenRes = ih - rr.top; }
    }
    const breit = BREIT_MQ.matches;
    const seite = Math.round(Math.min(21 * rem, Math.max(14 * rem, window.innerWidth * .22)));
    karte.style.setProperty("--mem-seite", seite + "px");
    const kandidaten = [];
    (breit ? ["breit"] : ["hoch", "quer"]).forEach(m => {
      karte.classList.toggle("mem-quer", m === "quer"); karte.classList.remove("mem-knapp");
      const cs = getComputedStyle(karte), pl = parseFloat(cs.paddingLeft), pr = parseFloat(cs.paddingRight), pt = parseFloat(cs.paddingTop), pb = parseFloat(cs.paddingBottom);
      const kr = karte.getBoundingClientRect(), kTop = voll ? Math.max(0, kr.top) : kr.top + window.scrollY;
      const innenB = karte.clientWidth - pl - pr, unten = ih - untenRes - 4;
      const beide = (W, H, extra) => [[c, r], [r, c]].forEach(([cc, rr]) => kandidaten.push(Object.assign({ m, c: cc, r: rr, kw: kwFuer(W, H, cc, rr) }, extra)));
      if (m === "hoch") {
        const gr = grid.getBoundingClientRect(), ueber = gr.top - kr.top;
        /* unter dem Tisch: nur was wirklich folgt (im Vollbild ist die Karte höher als ihr Inhalt) */
        let fussUnten = gr.bottom;
        Array.from(karte.children).forEach(el => {
          if (el === grid || el.classList.contains("tav-voll-knopf") || !el.getClientRects().length) return;
          const ecs = getComputedStyle(el); if (ecs.position === "absolute" || ecs.position === "fixed") return;
          fussUnten = Math.max(fussUnten, el.getBoundingClientRect().bottom);
        });
        const unter = fussUnten - gr.bottom + pb;
        const H = unten - kTop - ueber - unter;
        /* Handy hochkant, noch nicht im Vollbild: Startet die Karte weit unten, darf der Titel wegscrollen –
           Kopf bis Fuß passen dann unter die Leiste (mit der ersten Karte geht es ohnehin ins Vollbild) */
        const handyHoch = !voll && window.innerWidth <= 760 && ih > window.innerWidth;
        const erstes = Array.from(karte.children).find(el => el.id !== "memory" && /memory-kopf|duell-leiste|mem-duell/.test(el.className) && el.getClientRects().length) || grid;
        const H2 = unten - obenRes - 6 - (gr.top - erstes.getBoundingClientRect().top) - unter;
        [[c, r], [r, c]].forEach(([cc, rr]) => {
          const k1 = kwFuer(innenB, H, cc, rr), k2 = handyHoch ? kwFuer(innenB, H2, cc, rr) : k1;
          kandidaten.push({ m, c: cc, r: rr, kw: k1 >= k2 * .8 ? k1 : k2 });
        });
      } else if (m === "quer") {
        const W = innenB - seite - (parseFloat(cs.columnGap) || 16), H = unten - kTop - pt - pb;
        let knapp = false;
        if (seitenHoehe(karte) > H) { karte.classList.add("mem-knapp"); knapp = true; }
        if (W > 100) beide(W, H, { knapp });
      } else {
        const H = unten - kTop - pt - pb, W = innenB - 2 * (parseFloat(cs.columnGap) || 32) - 2 * 17 * rem;
        beide(Math.max(W, innenB * .4), H, {});
      }
    });
    const best = kandidaten.reduce((a, b) => (b.kw > a.kw + .5 ? b : a), kandidaten[0]);
    karte.classList.toggle("mem-quer", best.m === "quer");
    karte.classList.toggle("mem-knapp", !!best.knapp);
    const kw = Math.max(34, Math.min(330, best.kw)), g = memAbstand(kw), rd = memRand(kw);
    grid.style.setProperty("--mem-sp", best.c);
    grid.style.setProperty("--mem-kw", kw + "px");
    grid.style.setProperty("--mem-gap", g.toFixed(1) + "px");
    grid.style.setProperty("--mem-rand", rd.toFixed(1) + "px");
    grid.style.width = Math.ceil(best.c * kw + (best.c - 1) * g + 2 * rd + 2) + "px";
    grid.classList.toggle("mem-klein", kw < 74);
    memSpalten = best.c;
  }

  /* Tastatur: Pfeiltasten wandern über die Karten (Enter/Leertaste deckt auf – es sind Knöpfe) */
  function memTaste(e) {
    const grid = $("memory"); if (!grid) return;
    const pfeil = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -memSpalten, ArrowDown: memSpalten }[e.key];
    if (pfeil === undefined && e.key !== "Home" && e.key !== "End") return;
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    const karten = Array.from(grid.querySelectorAll(".mem-karte")); if (!karten.length) return;
    const hier = e.target.closest && e.target.closest(".mem-karte");
    let j;
    if (!hier) {
      /* Im Vollbild greifen die Pfeile auch, wenn noch keine Karte den Fokus hat */
      const karte = $("memory-karte");
      if (!karte.classList.contains("tav-voll") || (e.target.closest && e.target.closest("input, textarea, select, .memory-wahl, .memory-fuss, .mem-siegtafel"))) return;
      j = 0;
    } else {
      const i = karten.indexOf(hier);
      if (e.key === "Home") j = 0; else if (e.key === "End") j = karten.length - 1;
      else { j = i + pfeil; if (j < 0 || j >= karten.length) return; }
    }
    e.preventDefault();
    karten[j].focus({ preventScroll: false });
  }

  function memoryStarten() {
    if (!$("memory")) return;
    if (!bestien().length) { const k = $("memory-karte"); if (k) k.hidden = true; return; }
    const grid = $("memory"), karte = $("memory-karte");
    grid.addEventListener("click", memoryKlick);
    $("memory-neu").addEventListener("click", () => { if (window.tavVollAuto) window.tavVollAuto("memory-karte"); memoryNeu(); });
    karte.addEventListener("keydown", memTaste);
    memCssEinbauen();
    mdKnopf();
    wahlBauen();
    memoryNeu();
    /* neu messen, wenn sich Fenster, Vollbild oder Sichtbarkeit der Karte ändern */
    window.addEventListener("resize", mmPlanen);
    document.addEventListener("fullscreenchange", mmPlanen);
    document.addEventListener("webkitfullscreenchange", mmPlanen);
    if (BREIT_MQ.addEventListener) BREIT_MQ.addEventListener("change", mmPlanen);
    if (window.ResizeObserver) {
      let alteBreite = -1;
      new ResizeObserver(() => { const b = karte.clientWidth; if (Math.abs(b - alteBreite) > 1) { alteBreite = b; mmPlanen(); } }).observe(karte);
    }
    new MutationObserver(mmPlanen).observe(karte, { attributes: true, attributeFilter: ["class"] });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(mmPlanen);
    window.addEventListener("load", mmPlanen);

    /* Schnittstelle für controller.js (Gamepad) und Tests */
    const kartenListe = () => Array.from(grid.querySelectorAll(".mem-karte"));
    karte._memory = {
      karten: kartenListe,
      spalten: () => memSpalten,
      aufdecken(i) {
        const el = kartenListe()[i]; if (!el) return false;
        if (md) { mdKlick({ target: el }); return true; }
        const ok = karteAufdecken(el, true);
        if (ok) el.focus({ preventScroll: true });
        return ok;
      },
      fokus(i) { const el = kartenListe()[i]; if (el) el.focus(); return el || null; },
      gewaehlt() { return kartenListe().indexOf(document.activeElement); },
      neu() { if (md) return false; memoryNeu(); return true; },
      stufe(s) { if (md) return memStufe; if (MEM_STUFEN[s] && s !== memStufe) { memStufe = s; schreib("imres-memory-stufe", s); memoryNeu(); } return memStufe; },
      aufZeit(an) { if (!md && typeof an === "boolean" && an !== memAufZeit) { memAufZeit = an; schreib("imres-memory-aufzeit", an ? "1" : "0"); memoryNeu(); } return memAufZeit; },
      aktiv() {
        if (karte.hidden || !karte.getClientRects().length || !kartenListe().length) return false;
        const r = grid.getBoundingClientRect(); return r.bottom > 0 && r.top < window.innerHeight;
      },
      imDuell: () => !!md,
      fertig: () => !md && !!mem.gesamt && mem.paare === mem.gesamt,
      offen: () => kartenListe().map(el => el.classList.contains("weg") ? 2 : el.classList.contains("offen") ? 1 : 0)
    };
  }
  function memSprache() {
    mdSprache();
    if (!$("memory") || md) return;
    wahlZeichnen();
    if (mem.karten.length) {
      namenSetzen(); memoryStatus();
      if (mem.paare === mem.gesamt && mem.gesamt) $("memory-sieg").textContent = mem.aufZeit ? t().memSiegZeit(zeitText(mem.dauer || 0), mem.zuege) : t().memSieg(mem.zuege);
    }
    mmPlanen();
  }

  function memCssEinbauen() {
    if ($("mem-css")) return;
    const css = document.createElement("style"); css.id = "mem-css";
    css.textContent = `
#memory-karte { --mem-seite: 16rem; }
.memory-kopf { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: baseline; gap: .3rem 1rem; font-size: .9rem; color: var(--ash); }
.memory-kopf strong { color: var(--vellum); font-weight: 600; }
.memory-zeit { font-variant-numeric: tabular-nums; color: var(--ember); font-weight: 600; min-width: 5.2em; }
.memory-kopf > span:empty { display: none; }

/* Der Spieltisch */
.memory {
  position: relative; isolation: isolate; box-sizing: border-box; justify-self: center; max-width: 100%;
  display: grid; grid-template-columns: repeat(var(--mem-sp, 4), var(--mem-kw, 100px)); grid-auto-rows: calc(var(--mem-kw, 100px) * 4 / 3);
  gap: var(--mem-gap, 8px); padding: var(--mem-rand, 12px); justify-content: center; align-content: center;
  border: 1px solid rgba(224,160,70,.38); border-radius: 12px;
  box-shadow: inset 0 0 calc(var(--mem-kw, 100px) * .55) rgba(0,0,0,.7), inset 0 0 0 1px rgba(0,0,0,.5), 0 14px 34px rgba(0,0,0,.5);
  background: radial-gradient(ellipse at 50% 45%, #21452d, #0f2216 70%, #0a170f);
}
.memory[data-tuch="samt"] {
  border-color: rgba(232,179,90,.6);
  background: repeating-linear-gradient(100deg, rgba(255,255,255,.02) 0 3px, transparent 3px 9px), radial-gradient(ellipse at 50% 40%, #5a1824, #2a0910 70%, #1a060a);
}
.memory[data-tuch="holz"] {
  border-color: rgba(120,78,40,.9);
  background: repeating-linear-gradient(90deg, rgba(0,0,0,.38) 0 2px, transparent 2px calc(var(--mem-kw, 100px) * 1.3)),
    repeating-linear-gradient(90deg, rgba(255,220,170,.035) 0 1px, transparent 1px 6px),
    repeating-linear-gradient(0deg, rgba(0,0,0,.07) 0 9px, transparent 9px 23px),
    linear-gradient(90deg, #3a2514, #4d321b 30%, #3b2614 55%, #4a301a 80%, #3a2514);
}
.memory[data-tuch="leder"] {
  background: radial-gradient(ellipse at 50% 40%, #5c3a21, #2a180c 75%);
  outline: 1px dashed rgba(240,200,140,.4); outline-offset: calc(var(--mem-rand, 12px) * -.45);
}
.memory[data-tuch="karte"] { background: linear-gradient(rgba(22,14,8,.76), rgba(22,14,8,.86)), url("weltkarte.jpg") center / cover; }
/* Kerzenlicht: warmer Schein aus wechselnder Richtung, darüber eine leichte Vignette */
.memory::before, .memory::after { content: ""; position: absolute; inset: 0; border-radius: inherit; pointer-events: none; }
.memory::before {
  z-index: 0; background: radial-gradient(circle at var(--kx, 15%) var(--ky, 10%), rgba(255,196,110,.32), rgba(255,160,70,.09) 38%, transparent 68%);
  animation: memFlackern var(--flacker, 2.8s) ease-in-out infinite alternate;
}
.memory::after { z-index: 3; background: radial-gradient(ellipse at var(--kx, 15%) var(--ky, 10%), transparent 45%, rgba(0,0,0,.26) 100%); }
@keyframes memFlackern { 0% { opacity: .78; } 30% { opacity: .95; } 55% { opacity: .82; } 80% { opacity: 1; } 100% { opacity: .88; } }

/* Karten */
.mem-karte {
  position: relative; z-index: 1; width: var(--mem-kw, 100px); height: calc(var(--mem-kw, 100px) * 4 / 3); padding: 0; border: 0; background: none;
  cursor: pointer; perspective: calc(var(--mem-kw, 100px) * 6); border-radius: calc(var(--mem-kw, 100px) * .06); -webkit-tap-highlight-color: transparent; touch-action: manipulation;
}
.mem-karte:focus-visible { outline: 2px solid var(--ember); outline-offset: 3px; z-index: 2; }
.mem-karte .innen { position: relative; display: block; width: 100%; height: 100%; transform-style: preserve-3d; transition: transform .6s cubic-bezier(.3,.75,.35,1.18); }
.mem-karte.offen .innen, .mem-karte.weg .innen { transform: rotateY(180deg); }
@media (hover: hover) { .mem-karte:not(.offen):not(.weg):hover .innen { transform: rotateY(-9deg) translateZ(4px); } }
.mem-karte .seite {
  position: absolute; inset: 0; backface-visibility: hidden; -webkit-backface-visibility: hidden; overflow: hidden; border-radius: inherit;
  box-shadow: 0 calc(var(--mem-kw, 100px) * .03) calc(var(--mem-kw, 100px) * .09) rgba(0,0,0,.6);
}
.mem-karte .innen, .mem-karte .seite { border-radius: calc(var(--mem-kw, 100px) * .06); }
.mem-karte .rueck { background: var(--mem-rueck) center / 100% 100% no-repeat, #2a1a10; }
.mem-karte .rueck i {
  position: absolute; inset: 0; background: linear-gradient(115deg, transparent 38%, rgba(255,236,190,.24) 50%, transparent 62%);
  background-size: 260% 100%; background-position: 115% 0; transition: background-position .8s ease;
}
.mem-karte:hover .rueck i, .mem-karte:focus-visible .rueck i { background-position: -15% 0; }
.mem-karte .vorne { transform: rotateY(180deg); background: radial-gradient(ellipse at 50% 35%, #3d2c1c, #120d0a 75%); outline: 1px solid rgba(224,160,70,.45); outline-offset: -1px; }
.mem-karte .vorne.skizze { background: radial-gradient(ellipse at 50% 40%, #f4e9cd, #d6c193); }
.mem-karte .vorne img { width: 100%; height: 100%; object-fit: cover; display: block; pointer-events: none; -webkit-user-drag: none; }
.mem-karte .vorne.skizze img { object-fit: contain; padding: 6% 6% 20%; box-sizing: border-box; mix-blend-mode: multiply; }
.mem-karte .vorne em {
  position: absolute; left: 0; right: 0; bottom: 0; padding: 1.1em .25em .3em; text-align: center; font-style: normal;
  font-family: var(--name); font-size: clamp(11px, calc(var(--mem-kw, 100px) * .115), 17px); line-height: 1.05; color: var(--vellum); overflow-wrap: break-word;
  background: linear-gradient(transparent, rgba(16,14,21,.92));
}
.memory.mem-klein .mem-karte .vorne em { padding: .6em 2px .25em; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; letter-spacing: -.02em; }
.mem-karte.weg .vorne { outline: 2px solid var(--ember); box-shadow: 0 0 calc(var(--mem-kw, 100px) * .16) rgba(224,160,70,.45); }
.mem-karte.falsch .vorne { outline: 2px solid var(--blood); box-shadow: 0 0 12px rgba(155,58,47,.65); }

/* Bewegung: Austeilen, Anheben beim Umdrehen, Treffer, Fehlgriff, Sieg */
.memory.austeilen .mem-karte { animation: memAusteilen .5s cubic-bezier(.2,.8,.3,1.15) backwards; animation-delay: calc(var(--i, 0) * 24ms); }
@keyframes memAusteilen { from { opacity: 0; transform: translateY(-40%) rotate(-10deg) scale(.8); } }
.mem-karte.offen { animation: memHeben .6s ease-out; z-index: 2; }
@keyframes memHeben { 45% { transform: translateY(-5%) scale(1.07); } }
.mem-karte.treffer { animation: memTreffer .95s ease-out; z-index: 2; }
.mem-karte.treffer .vorne { animation: memGluehen .95s ease-out; }
@keyframes memTreffer { 30% { transform: scale(1.1); } 60% { transform: scale(.98); } }
@keyframes memGluehen { 0% { box-shadow: 0 0 0 rgba(255,210,120,0); } 30% { box-shadow: 0 0 calc(var(--mem-kw, 100px) * .45) rgba(255,205,120,.95), inset 0 0 calc(var(--mem-kw, 100px) * .3) rgba(255,225,160,.6); } }
.mem-karte.falsch { animation: memWackeln .4s ease-in-out; }
@keyframes memWackeln { 20% { transform: translateX(-5%) rotate(-2deg); } 45% { transform: translateX(4%) rotate(1.5deg); } 70% { transform: translateX(-2%); } }
.mem-funke {
  position: absolute; z-index: 4; width: 5px; height: 5px; border-radius: 50%; pointer-events: none;
  background: #fff1c9; box-shadow: 0 0 6px 2px rgba(255,190,90,.85); will-change: transform, opacity;
}
.mem-funke.gross { width: 7px; height: 7px; background: #ffd27a; }
.memory.sieg .mem-karte { animation: memWelle 1.1s ease-in-out backwards; animation-delay: calc(var(--i, 0) * 45ms); }
.memory.sieg .mem-karte .vorne { box-shadow: 0 0 calc(var(--mem-kw, 100px) * .22) rgba(255,205,120,.55); }
@keyframes memWelle { 0%, 100% { transform: none; } 40% { transform: translateY(-9%) scale(1.06) rotate(-1.5deg); } }

/* Siegestafel */
.mem-siegtafel {
  position: absolute; inset: 0; z-index: 5; display: grid; place-items: center; padding: 5%; border-radius: inherit; cursor: pointer;
  background: radial-gradient(ellipse at center, rgba(16,11,8,.45), rgba(16,11,8,.8)); animation: memTafelHinter .6s ease-out .55s backwards;
}
.mem-siegtafel.zu { display: none; }
.mst-innen {
  display: grid; justify-items: center; gap: .3em; max-width: 28em; max-height: 100%; overflow: hidden; padding: 1em 1.4em 1.1em; text-align: center; cursor: default;
  font-size: clamp(11px, calc(var(--mem-kw, 100px) * .13), 18px);
  background: linear-gradient(172deg, #f3e9d1, #d9c69c); color: #2a2118; transform: rotate(-1.2deg);
  box-shadow: 0 16px 40px rgba(0,0,0,.65), 0 0 0 1px rgba(224,160,70,.65), 0 0 40px rgba(255,190,100,.25);
  animation: memTafel .7s cubic-bezier(.2,.9,.3,1.25) .6s backwards;
}
@keyframes memTafelHinter { from { opacity: 0; } }
@keyframes memTafel { from { opacity: 0; transform: translateY(18%) rotate(4deg) scale(.7); } }
.mst-siegel {
  display: grid; place-items: center; width: 3em; height: 3em; border-radius: 50%; margin-top: -.2em;
  font-family: var(--display); font-size: 1.05em; color: #f3d9a0; letter-spacing: .02em;
  background: radial-gradient(circle at 35% 30%, #cf4d3e, #7a1c16 68%, #5a120e);
  box-shadow: 0 2px 6px rgba(0,0,0,.45), inset 0 0 0 .22em rgba(0,0,0,.16), inset 0 0 0 .36em rgba(255,200,150,.12);
}
.mst-titel { font-family: var(--name); font-size: 1.65em; line-height: 1.05; color: #1d1610; }
.mst-wert { font-size: 1.05em; color: #5a4a36; font-variant-numeric: tabular-nums; }
.mst-rekord { font-family: var(--hand); font-size: 1.6em; line-height: 1; color: #9b3a2f; animation: memRekord .9s ease-in-out infinite alternate; }
@keyframes memRekord { to { transform: scale(1.1) rotate(-2deg); text-shadow: 0 0 10px rgba(224,160,70,.6); } }
.mst-spruch { font-family: var(--hand); font-size: 1.3em; line-height: 1.1; color: #4a3a28; max-width: 20em; }
.mst-nochmal { margin-top: .35em; min-height: 36px; color: #7a4a14; border-color: #7a4a14; font-size: max(11px, .95em); }
.mst-nochmal:hover, .mst-nochmal:focus-visible { background: #7a4a14; color: #f3e9d1; }
.memory.mem-klein .mst-spruch, .memory.mem-klein .mst-siegel { display: none; }

/* Fuß: Auswahl links, Knöpfe rechts; die Siegesmeldung liest allein nur der Screenreader vor (sichtbar ist die Tafel) */
.memory-fuss { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: .5rem .6rem; }
.memory-sieg { font-family: var(--hand); font-size: 1.45rem; color: var(--ember); line-height: 1.15; }
.memory-sieg:empty { display: none; }
#memory-karte:not(.mem-im-duell) .memory-sieg { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
.memory-wahl { display: flex; flex-wrap: wrap; align-items: center; gap: .4rem; }
.mw-stufen { display: inline-flex; border: 1px solid var(--line); }
.mw-stufen button, .mw-zeit {
  min-height: 36px; min-width: 42px; padding: .3rem .6rem; border: 0; background: none; color: var(--ash);
  font: inherit; font-size: .88rem; font-variant-numeric: tabular-nums; cursor: pointer; touch-action: manipulation; -webkit-tap-highlight-color: transparent;
}
.mw-stufen button + button { border-left: 1px solid var(--line); }
.mw-stufen button[aria-pressed="true"] { background: var(--ember); color: var(--night); }
.mw-zeit { border: 1px solid var(--line); }
.mw-zeit[aria-pressed="true"] { border-color: var(--ember); color: var(--ember); background: rgba(224,160,70,.13); }
.mw-stufen button:hover:not([aria-pressed="true"]), .mw-zeit:hover { color: var(--vellum); }
.mem-im-duell .memory-wahl, .mem-im-duell .memory-zeit { display: none; }

/* Querformat: Tisch links, Titel/Kopf/Fuß rechts daneben */
#taverne.saal-einzeln #memory-karte.mem-quer { max-width: min(100%, 92rem); }
#memory-karte.mem-quer {
  grid-template-columns: max-content var(--mem-seite); grid-template-rows: repeat(8, max-content) 1fr;
  column-gap: clamp(1rem, 2.4vw, 2.2rem); row-gap: .7rem; justify-content: center; align-content: start; align-items: start;
}
#memory-karte.mem-quer > * { grid-column: 2; min-width: 0; }
#memory-karte.mem-quer > .memory { grid-column: 1; grid-row: 1 / -1; justify-self: start; }
#memory-karte.mem-quer .memory-kopf { flex-direction: column; align-items: flex-start; gap: .25rem; font-size: .95rem; }
#memory-karte.mem-quer .memory-fuss { flex-direction: column; align-items: stretch; }
#memory-karte.mem-quer .memory-knoepfe { justify-content: flex-start; margin-left: 0; }
#memory-karte.mem-quer > .tav-info { font-size: .92rem; line-height: 1.45; }
#memory-karte.mem-quer.mem-knapp > .tav-info, #memory-karte.mem-quer.mem-knapp > .label { display: none; }
#memory-karte.mem-quer .mem-duell { grid-template-columns: 1fr; }
#memory-karte.mem-quer .md-spieler.gegner { text-align: left; }
#memory-karte.mem-quer .md-mitte { max-width: none; text-align: left; }
.tav-karte.tav-voll#memory-karte { gap: .55rem; }
.tav-karte.tav-voll#memory-karte.mem-quer { padding: .8rem 3.6rem .8rem .8rem; align-content: center; }
.tav-karte.tav-voll#memory-karte .memory { justify-self: center; }

@media (prefers-reduced-motion: reduce) {
  .mem-karte .innen { transition-duration: .01s; }
  .mem-karte.offen, .mem-karte.treffer, .mem-karte.treffer .vorne, .mem-karte.falsch, .memory.sieg .mem-karte, .memory.austeilen .mem-karte,
  .memory::before, .mem-siegtafel, .mst-innen, .mst-rekord { animation: none; }
  .mem-karte .rueck i { transition: none; }
}
`;
    document.head.appendChild(css);
  }

  /* --- Bestiarium-Memory: Online-Duell zu zweit (Verbindung und Lobby in duell.js) ---
     Klassische Regeln: abwechselnd zwei Karten aufdecken, wer ein Paar findet, ist noch einmal dran;
     mehr Paare gewinnen. Der Gastgeber mischt und entscheidet: Der Gast schickt nur Zugwünsche,
     der Gastgeber prüft sie und schickt den ganzen Stand (mit fortlaufender Nummer) an beide –
     so liegen auf beiden Geräten immer dieselben Karten. */
  Object.assign(TX.de, { mdTitel: "Bestiarium-Memory", mdHinweis: "Klassische Regeln: Wer ein Paar findet, ist gleich noch einmal dran. Wer am Ende mehr Paare hat, gewinnt.",
    mdDran: "Du bist dran", mdGegnerDran: n => n + " ist dran", mdWarten: "Warte auf Gegner …", mdDu: "Du", mdPaare: n => n + (n === 1 ? " Paar" : " Paare"),
    mdSieg: (a, b) => "Gewonnen – " + a + " : " + b + "!", mdNiederlage: (n, a, b) => n + " gewinnt – " + a + " : " + b, mdRemis: (a, b) => "Unentschieden – " + a + " : " + b,
    mdSiegKurz: "Sieg!", mdNiederlageKurz: "Verloren", mdRemisKurz: "Remis", mdRevanche: "⚔ Revanche", mdRevancheWarte: n => "Warte auf " + n + " …", mdRevancheWill: n => n + " will eine Revanche!" });
  Object.assign(TX.en, { mdTitel: "Bestiary Memory", mdHinweis: "Classic rules: find a pair and you go again. Whoever has more pairs at the end wins.",
    mdDran: "Your turn", mdGegnerDran: n => n + "'s turn", mdWarten: "Waiting for an opponent …", mdDu: "You", mdPaare: n => n + (n === 1 ? " pair" : " pairs"),
    mdSieg: (a, b) => "You win – " + a + " : " + b + "!", mdNiederlage: (n, a, b) => n + " wins – " + a + " : " + b, mdRemis: (a, b) => "Draw – " + a + " : " + b,
    mdSiegKurz: "Victory!", mdNiederlageKurz: "Defeat", mdRemisKurz: "Draw", mdRevanche: "⚔ Rematch", mdRevancheWarte: n => "Waiting for " + n + " …", mdRevancheWill: n => n + " wants a rematch!" });
  let md = null, mdAngemeldet = false;
  const MD_MAX = 24;
  const mdInt = (x, a, b) => Number.isInteger(x) && x >= a && x <= b;
  function mdKnopf() {
    const fuss = document.querySelector("#memory-karte .memory-fuss");
    if (!fuss || $("memory-duell-knopf")) return;
    /* „Neu mischen“ und „Online-Duell“ rechts zusammen – wie bisher steht links die Siegesmeldung */
    const gruppe = document.createElement("span"); gruppe.className = "memory-knoepfe";
    $("memory-neu").before(gruppe); gruppe.appendChild($("memory-neu"));
    const b = document.createElement("button");
    b.type = "button"; b.className = "tav-knopf duell-knopf"; b.id = "memory-duell-knopf";
    b.textContent = sprache() === "en" ? "⚔ Online duel" : "⚔ Online-Duell";
    b.addEventListener("click", () => {
      if (window.ImresDuell) { mdAnmelden(); window.ImresDuell.oeffnen("memory"); }
      else if (window.ImresNachladen) window.ImresNachladen("taverne").then(() => { mdAnmelden(); if (window.ImresDuell) window.ImresDuell.oeffnen("memory"); });
    });
    gruppe.appendChild(b);
    mdAnmelden();
  }
  function mdAnmelden() {
    if (mdAngemeldet || !window.ImresDuell || !$("memory")) return;
    mdAngemeldet = true;
    window.ImresDuell.registrieren("memory", { kartenId: "memory-karte", titel: () => t().mdTitel, hinweis: () => t().mdHinweis, beginnen: mdBeginnen, beenden: mdBeenden });
  }
  document.addEventListener("imres:duell-bereit", mdAnmelden);
  function mdBeginnen(s) {
    const karte = $("memory-karte"), kopf = karte && karte.querySelector(".memory-kopf");
    if (!kopf) return;
    md = { s, st: null, ich: s.host ? 0 : 1, rev: [false, false], gebaut: 0, gewertet: 0, warte: null, falschUhr: null, angefragt: "" };
    karte.classList.add("mem-im-duell");
    kopf.before(s.leiste());
    let dk = $("mem-duell");
    if (!dk) { dk = document.createElement("div"); dk.id = "mem-duell"; dk.className = "mem-duell"; kopf.after(dk); }
    let rv = $("memory-revanche");
    if (!rv) { rv = document.createElement("button"); rv.type = "button"; rv.id = "memory-revanche"; rv.className = "tav-knopf duell-knopf"; rv.hidden = true; rv.addEventListener("click", mdRevanche); $("memory-neu").after(rv); }
    zeitStopp(); $("memory").classList.remove("sieg", "austeilen");
    $("memory").innerHTML = ""; $("memory-sieg").textContent = "";
    s.on("stand", mdStandBekommen);
    s.on("zug", d => { if (!md || md.s !== s || !s.host || !md.st || d.nr !== md.st.nr) return; if (!mdZug(1, d.i)) mdSenden(); });
    s.on("stand?", d => { if (!md || md.s !== s || !s.host) return; if (d.rev === true && md.st && md.st.aus && d.nr === md.st.nr) mdRevancheBekommen(d); if (md && md.st) mdSenden(); });
    s.on("revanche", mdRevancheBekommen);
    s.status((art, d) => {
      if (!md || md.s !== s) return;
      if (art === "partner") {
        if (s.host) { if (d.neu || !md.st) mdNeuesSpiel(); else mdSenden(); }
        else { if (d.neu) { md.st = null; md.gebaut = 0; mdMalen(); } s.senden("stand?", mdNachfrage()); }
      } else if (art === "verbindung" && d.ok && d.wieder) {
        if (s.host) mdSenden(); else s.senden("stand?", mdNachfrage());
      }
      mdKopf();
    });
    mdKopf();
  }
  const mdNachfrage = () => ({ nr: md && md.st ? md.st.nr : 0, rev: !!(md && md.rev[md.ich]) });
  function mdBeenden(s) {
    if (!md || md.s !== s) return;
    clearTimeout(md.warte); clearTimeout(md.falschUhr);
    md = null;
    const karte = $("memory-karte"); if (karte) karte.classList.remove("mem-im-duell");
    ["mem-duell", "memory-revanche"].forEach(id => { const el = $(id); if (el) el.remove(); });
    memoryNeu();
  }
  function mdSenden() { if (md && md.s.host && md.st) md.s.senden("stand", { st: md.st }); }
  /* Gastgeber: neues Spiel mischen; wer anfängt, wechselt von Spiel zu Spiel */
  function mdNeuesSpiel() {
    const alle = bestien().slice().sort(() => Math.random() - .5), wahl = alle.slice(0, Math.min(6, alle.length));
    const k = []; wahl.forEach(b => { k.push(b.bild); k.push(b.bild); });
    for (let i = k.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [k[i], k[j]] = [k[j], k[i]]; }
    const alt = md.st, anfang = alt ? 1 - alt.anfang : 0;
    md.st = { nr: alt ? alt.nr + 1 : 1, seq: (alt ? alt.seq : 0) + 1, k, w: k.map(() => -1), o: [], d: anfang, anfang, p: [0, 0], aus: false };
    md.rev = [false, false];
    mdSenden(); mdMalen();
  }
  /* Gastgeber: einen Zug prüfen und ausführen (wer: 0 = Gastgeber, 1 = Gast) */
  function mdZug(wer, i) {
    const st = md && md.st;
    if (!st || st.aus || st.d !== wer || st.o.length >= 2 || !mdInt(i, 0, st.k.length - 1) || st.w[i] >= 0 || st.o.includes(i) || !md.s.da()) return false;
    st.o = st.o.concat([i]); st.seq++;
    mdSenden(); mdMalen();
    if (st.o.length === 2) {
      const [a, b] = st.o, seq = st.seq, passt = st.k[a] === st.k[b];
      setTimeout(() => {
        if (!md || md.st !== st || st.seq !== seq) return;
        if (passt) { st.w[a] = wer; st.w[b] = wer; st.p[wer]++; if (st.w.every(x => x >= 0)) st.aus = true; }
        else st.d = 1 - st.d;
        st.o = []; st.seq++;
        mdSenden(); mdMalen();
      }, passt ? 350 : 1100);
    }
    return true;
  }
  /* Gast: Stand vom Gastgeber prüfen – nur Karten aus dem eigenen Bestiarium, alte Nummern verwerfen */
  function mdStandBekommen(d) {
    if (!md || md.s.host) return;
    const st = d && d.st;
    if (!st || typeof st !== "object") return;
    const n = Array.isArray(st.k) ? st.k.length : 0, erlaubt = new Set(bestien().map(b => b.bild));
    if (!mdInt(st.nr, 1, 1e6) || !mdInt(st.seq, 0, 1e9) || n < 2 || n > MD_MAX || n % 2) return;
    if (!st.k.every(b => typeof b === "string" && erlaubt.has(b))) return;
    if (!Array.isArray(st.w) || st.w.length !== n || !st.w.every(x => mdInt(x, -1, 1))) return;
    if (!Array.isArray(st.o) || st.o.length > 2 || !st.o.every(x => mdInt(x, 0, n - 1) && st.w[x] < 0) || (st.o.length === 2 && st.o[0] === st.o[1])) return;
    if (!mdInt(st.d, 0, 1) || !mdInt(st.anfang, 0, 1) || !Array.isArray(st.p) || st.p.length !== 2 || !st.p.every(x => mdInt(x, 0, n / 2))) return;
    if (md.st && (st.nr < md.st.nr || st.seq <= md.st.seq)) return;
    const neu = !md.st || md.st.nr !== st.nr;
    md.st = { nr: st.nr, seq: st.seq, k: st.k.slice(), w: st.w.slice(), o: st.o.slice(), d: st.d, anfang: st.anfang, p: st.p.slice(), aus: st.aus === true };
    if (neu) md.rev = [false, false];
    clearTimeout(md.warte);
    mdMalen();
  }
  function mdKlick(e) {
    const el = e.target.closest(".mem-karte"), st = md && md.st;
    if (!el || !st) return;
    const i = +el.dataset.i;
    if (st.aus || st.d !== md.ich || st.o.length >= 2 || st.w[i] >= 0 || st.o.includes(i) || !md.s.da()) return;
    if (md.s.host) { mdZug(0, i); return; }
    const schl = st.seq + ":" + i; if (md.angefragt === schl) return; /* doppelt getippt */
    md.angefragt = schl;
    md.s.senden("zug", { i, nr: st.nr, seq: st.seq });
    el.classList.add("md-wartet");
    clearTimeout(md.warte);
    md.warte = setTimeout(() => { if (md) md.s.senden("stand?", mdNachfrage()); }, 2000);
  }
  function mdRevanche() {
    if (!md || !md.st || !md.st.aus) return;
    md.rev[md.ich] = true;
    md.s.senden("revanche", { nr: md.st.nr });
    if (md.s.host && md.rev[1]) { mdNeuesSpiel(); return; }
    mdKopf();
  }
  function mdRevancheBekommen(d) {
    if (!md || !md.st || !md.st.aus || !d || d.nr !== md.st.nr) return;
    md.rev[1 - md.ich] = true;
    if (md.s.host && md.rev[0]) { mdNeuesSpiel(); return; }
    mdKopf();
  }
  function mdMalen() {
    const grid = $("memory"); if (!grid || !md) return;
    const st = md.st;
    if (!st) { grid.innerHTML = ""; md.gebaut = 0; mdKopf(); return; }
    let frisch = false;
    if (md.gebaut !== st.nr || grid.querySelectorAll(".mem-karte").length !== st.k.length) {
      if (md.gebaut !== st.nr) memLookNeu(); /* neue Partie, neuer Tisch */
      md.gebaut = st.nr; frisch = true;
      grid.classList.remove("sieg");
      grid.innerHTML = st.k.map((b, i) => kartenHtml(b, i)).join("");
      mmPlanen();
    }
    const liste = memPool();
    grid.querySelectorAll(".mem-karte").forEach(el => {
      const i = +el.dataset.i, weg = st.w[i] >= 0, offen = !weg && st.o.includes(i), b = liste.find(x => x.bild === st.k[i]);
      if (weg && !frisch && !el.classList.contains("weg")) treffer(el);
      el.classList.toggle("weg", weg); el.classList.toggle("offen", offen);
      el.classList.toggle("von-mir", weg && st.w[i] === md.ich); el.classList.toggle("von-gegner", weg && st.w[i] !== md.ich);
      if (!offen) el.classList.remove("falsch");
      el.classList.remove("md-wartet");
      el.querySelector("em").textContent = b ? b.name : "";
      el.setAttribute("aria-label", offen || weg ? (b ? b.name : "") : t().memKarte);
    });
    clearTimeout(md.falschUhr);
    if (st.o.length === 2 && st.k[st.o[0]] !== st.k[st.o[1]]) {
      const seq = st.seq;
      md.falschUhr = setTimeout(() => { if (!md || !md.st || md.st.seq !== seq) return; st.o.forEach(i => { const el = grid.querySelector('[data-i="' + i + '"]'); if (el) el.classList.add("falsch"); }); }, 450);
    }
    mdKopf();
    if (st.aus && md.gewertet !== st.nr) {
      md.gewertet = st.nr;
      const ich = st.p[md.ich], er = st.p[1 - md.ich], art = ich > er ? "sieg" : ich < er ? "niederlage" : "remis";
      if (window.ImresDuell) window.ImresDuell.bilanz("memory", art);
      if (art === "sieg") setTimeout(() => { const r = grid.getBoundingClientRect(); konfetti(r.left + r.width / 2, r.top + r.height / 2, ["✦", "⚔", "★", "♪"], 34); }, 300);
    }
  }
  function mdKopf() {
    const dk = $("mem-duell"); if (!dk || !md) return;
    const T = t(), st = md.st, s = md.s, gegner = s.gegnerName();
    const p = st ? st.p : [0, 0], dran = st && !st.aus && s.da() ? st.d : -1;
    const chip = (wer, name, klasse) => '<div class="md-spieler ' + klasse + (dran === wer ? " dran" : "") + '"><b>' + esc(name) + "</b><span>" + esc(T.mdPaare(p[wer])) + "</span></div>";
    let mitte;
    if (!st || !s.partner) mitte = T.mdWarten;
    else if (st.aus) { const a = p[md.ich], b = p[1 - md.ich]; mitte = a > b ? T.mdSiegKurz : a < b ? T.mdNiederlageKurz : T.mdRemisKurz; }
    else if (!s.da()) mitte = "…";
    else mitte = st.d === md.ich ? T.mdDran : T.mdGegnerDran(gegner);
    dk.innerHTML = chip(md.ich, T.mdDu + " · " + s.name, "ich") + '<p class="md-mitte" aria-live="polite">' + esc(mitte) + "</p>" + chip(1 - md.ich, gegner, "gegner");
    dk.classList.toggle("ende", !!(st && st.aus));
    const sieg = $("memory-sieg"), rv = $("memory-revanche");
    if (st && st.aus) {
      const a = p[md.ich], b = p[1 - md.ich];
      sieg.textContent = a > b ? T.mdSieg(a, b) : a < b ? T.mdNiederlage(gegner, b, a) : T.mdRemis(a, b);
      if (md.rev[md.ich]) sieg.textContent += " · " + T.mdRevancheWarte(gegner);
      else if (md.rev[1 - md.ich]) sieg.textContent += " · " + T.mdRevancheWill(gegner);
      if (rv) { rv.hidden = false; rv.textContent = T.mdRevanche; rv.disabled = md.rev[md.ich] || !s.da(); rv.classList.toggle("lockt", md.rev[1 - md.ich] && !md.rev[md.ich]); }
    } else { sieg.textContent = ""; if (rv) rv.hidden = true; }
    const siegDa = !!sieg.textContent; if (siegDa !== !!md.siegDa) { md.siegDa = siegDa; mmPlanen(); }
  }
  function mdSprache() {
    const b = $("memory-duell-knopf"); if (b) b.textContent = sprache() === "en" ? "⚔ Online duel" : "⚔ Online-Duell";
    if (md) mdMalen();
  }
  const mdCss = document.createElement("style");
  mdCss.textContent = `
.memory-knoepfe { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: .5rem; margin-left: auto; }
.mem-im-duell .memory-kopf, .mem-im-duell #memory-neu, .mem-im-duell #memory-duell-knopf { display: none; }
.mem-duell { display: grid; grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr); align-items: center; gap: .5rem; }
.md-spieler { display: grid; min-width: 0; padding: .35rem .6rem; border: 1px solid var(--line); background: rgba(0,0,0,.2); transition: border-color .3s, box-shadow .3s, background .3s; }
.md-spieler b { font-family: var(--name); font-weight: 400; font-size: 1.02rem; color: var(--vellum); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.md-spieler span { font-size: .8rem; color: var(--ash); }
.md-spieler.gegner { text-align: right; }
.md-spieler.dran { border-color: var(--ember); background: rgba(224,160,70,.13); box-shadow: 0 0 14px rgba(224,160,70,.35); }
.md-spieler.gegner.dran { border-color: #5fc39a; background: rgba(95,195,154,.1); box-shadow: 0 0 14px rgba(95,195,154,.35); }
.md-mitte { margin: 0; text-align: center; font-family: var(--hand); font-size: 1.35rem; line-height: 1.05; color: var(--ember); max-width: 10rem; }
.mem-duell.ende .md-mitte { font-size: 1.6rem; color: #ffd27a; }
.mem-karte.weg.von-gegner .vorne { outline-color: #5fc39a; box-shadow: 0 0 calc(var(--mem-kw, 100px) * .16) rgba(95,195,154,.45); }
.mem-karte.md-wartet { animation: mdPuls .6s ease-in-out infinite alternate; }
@keyframes mdPuls { to { transform: scale(1.05); } }
#memory-revanche.lockt { background: var(--ember); color: var(--night); animation: mdGlut .8s ease-in-out infinite alternate; }
@keyframes mdGlut { from { box-shadow: 0 0 0 rgba(224,160,70,0); } to { box-shadow: 0 0 18px rgba(224,160,70,.75); } }
#memory-revanche:disabled { opacity: .55; cursor: default; }
@media (max-width: 440px) { .mem-duell { grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); } .md-mitte { grid-column: 1 / -1; grid-row: 2; max-width: none; } }
`;
  document.head.appendChild(mdCss);
  if (location.search.indexOf("duell-test") >= 0) window.__mdTest = () => md && { st: md.st, ich: md.ich, host: md.s.host, rev: md.rev.slice() }; /* für automatische Tests */

  /* ---------- Sprachwechsel ---------- */
  function sprachwechsel() {
    if ($("probe-modus")) modusZeichnen();
    if (modus === "spott" && ziel !== "*" && !spottZiele().includes(ziel)) ziel = spottZiele()[0];
    zieleZeichnen();
    if ($("w20-los")) $("w20-los").textContent = letzterWurf ? t().probeNochmal : t().probeWuerfeln;
    liedZeigen(false);
    inspirationZeigen();
    memSprache();
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
