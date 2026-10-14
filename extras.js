/* =====================================================================
   IMRES TALES – EXTRAS
   ---------------------------------------------------------------------
   Alles Verspielte der Seite steckt in dieser Datei:
   1. Hintergrund: aufsteigende Funken, Kerzenschein, nachts Sterne + Mond
   2. Easter Eggs:
      · Rex schaut ab und zu vom Bildschirmrand herein (antippen!)
      · Barradins Laute im Fuß der Seite – die richtige Melodie hat Folgen
      · „destroyer“ tippen (oder in die Suche schreiben) weckt Ezekiel
      · 7× schnell auf „Imres Tales“ oben links tippen, oder der Konami-Code
        (↑ ↑ ↓ ↓ ← → ← → B A), öffnet das Geheimarchiv (Barradins Notizbuch)
      · Wer lange bleibt, dem wachsen Echos Ranken an den Seitenrand
   3. Die Taverne: Barradins Loblied (W20-Auftreten-Probe) und Bestiarium-Memory

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
      noten: ["C", "D", "E", "F", "G", "A", "H"],
      probeWuerfeln: "W20 werfen", probeNochmal: "Nochmal würfeln", probeTipp: "Wirf den Würfel!",
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
      noten: ["C", "D", "E", "F", "G", "A", "B"],
      probeWuerfeln: "Roll the d20", probeNochmal: "Roll again", probeTipp: "Roll the die!",
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

  /* ---------- Barradins Reime ({n} = Name) ---------- */
  const REIME = {
    de: {
      patzer: [
        "Oh {n}, du bist so … äh … groß?\nUnd deine Schuhe … sind famos?\nDie Saite reißt, der Ton zerbricht –\nich glaube, das war kein Gedicht.",
        "Ein Hoch auf {n}! Ein Hoch auf … Moment,\nwie ging der Reim? Wer hat das Lied verbrennt?\nIch fang nochmal an … nein, lieber nicht.\nDer Barde verbeugt sich. Und fällt aufs Gesicht."
      ],
      schwach: [
        "{n}, {n}, du bist da,\nund das ist … wirklich wunderbar.\nMehr fällt mir gerade nicht ein,\ndoch es soll ein Loblied sein.",
        "Wer ist toll? {n} ist toll!\nDas Lied ist kurz, das Herz ist voll.\nDer Reim ist schief, die Laute auch,\nso ist das eben Bardenbrauch."
      ],
      maessig: [
        "Hört, ihr Leut', beim Kerzenschein:\nHeut soll {n} gepriesen sein!\nIn Schenke, Schlacht und Kerkerloch\nwar auf {n} Verlass – und ist es noch.",
        "Ein Krug, ein Lied, ein lauter Toast\nauf {n}, den Stolz der ganzen … Kost?\nÄh, Truppe! Ja! Und hört gut zu:\nSo treu wie {n} ist keiner – nicht mal du."
      ],
      gut: [
        "Die Barden singen's in jedem Land,\nvon Neverwinter bis zum Unterreich-Rand:\nKein Herz so kühn, so treu, so rein –\nwie {n} wird keiner jemals sein!",
        "Wenn Dunkelheit die Welt umhüllt\nund Furcht die tiefsten Hallen füllt,\ndann tritt hervor, der Feinde Schreck:\n{n}! Und alles Böse rennt weg."
      ],
      stark: [
        "Die Sterne neigen sich vor dir,\no {n}, des Abenteuers Zier!\nSelbst Drachen flüstern voller Neid:\nSo viel Glanz in einer einz'gen Zeit?",
        "Selbst Demogorgon zog mit Grauen\nsich zurück, um {n} nicht anzuschauen.\nZwei Köpfe hat er, doch kein Mut –\ndenn {n} kämpft mit Herz und Glut!"
      ],
      legende: [
        "Gebt mir die Laute, gebt mir Licht!\nEin solches Lied vergisst man nicht:\nVon Phandalin bis tief hinab\nerzählt man's bis ans letzte Grab.\nDie Berge beben, Meere schweigen,\ndie Götter sich vor {n} verneigen.\nUnd fragt man einst in ferner Zeit,\nwer war der Größte weit und breit,\nso ruft ein jedes Kind ganz laut:\n„Es war {n}!“ – Wer hätt's nicht geglaubt?",
        "Im Feuerschein, beim Lautenklang,\nerhebt sich heut mein schönster Sang:\nWo {n} geht, da blüht das Land,\nda weicht die Nacht, da fällt die Wand,\nda lacht das Glück, da ruht das Schwert,\nda wird der schlimmste Feind bekehrt.\nIhr Götter, hört's und schreibt es ein:\nKein Held wird je wie {n} sein!"
      ],
      krit: [
        "Ihr Sterne, schweigt! Ihr Winde, ruht!\nHier singt der Barde voller Glut!\nVon {n} will ich heute künden,\nkein größ'rer Held ist je zu finden.\nDie Drachen weinen, Dämonen fliehn,\ndie Götter knien vor {n} hin.\nUnd jedes Bier im ganzen Land\nträgt {n}s Namen fortan am Rand!"
      ]
    },
    en: {
      patzer: [
        "Oh {n}, you are so … um … tall?\nAnd your boots are … nice … and that is all?\nA string goes snap, the chord falls flat –\nI don't think that was a song. That's that.",
        "Hail to {n}! Hail to … wait,\nhow did it go? Is it too late?\nI'll start again … no, better not.\nThe bard takes a bow. And trips on the spot."
      ],
      schwach: [
        "{n}, {n}, you are here,\nand that is … great, it's very clear.\nI can't think of anything more,\nbut it's a hymn, of that I'm sure.",
        "Who is great? {n} is great!\nThe song is short, the heart is straight.\nThe rhyme is bent, the lute is too –\nthat's just what we bards tend to do."
      ],
      maessig: [
        "Hear ye, hear ye, by candle's glow:\ntonight to {n} our praise shall go!\nIn tavern, battle, dungeon pit,\n{n} has never failed one bit.",
        "A mug, a song, a hearty toast\nto {n}, pride of all the … roast?\nThe party! Yes! And hear it true:\nnone's as loyal as {n} – not even you."
      ],
      gut: [
        "The bards all sing it far and wide,\nfrom Neverwinter to the Underdark's side:\nno heart so bold, so true, so bright –\n{n} outshines the stars at night!",
        "When darkness falls upon the land\nand fear creeps in on every hand,\nthen forth there steps the foe's worst dread:\n{n}! And evil runs ahead."
      ],
      stark: [
        "The stars themselves bow down to you,\no {n}, so brave, so wise, so true!\nEven dragons whisper, green with spite:\nhow can one shine so very bright?",
        "Even Demogorgon turned in fright\nand fled from {n}'s dazzling sight.\nTwo heads he has, but not one spark\nof {n}'s courage in the dark!"
      ],
      legende: [
        "Give me my lute, give me the light!\nA song like this will last the night:\nfrom Phandalin to depths below\nthey'll sing it wherever bards may go.\nThe mountains quake, the oceans hush,\nthe gods themselves before {n} blush.\nAnd when they ask in years to be\nwho was the greatest, all agree –\neach child will shout it, loud and proud:\n\"It was {n}!\" across the crowd.",
        "By firelight and lute's sweet ring\nthe finest song I'll ever sing:\nwhere {n} walks, the meadows bloom,\nthe night gives way, there lifts the gloom,\nthe luck comes smiling, swords lie still,\nthe fiercest foe bends to that will.\nYe gods, take note and write it down:\nno hero matches {n}'s renown!"
      ],
      krit: [
        "Hush, ye stars, and rest, ye breeze!\nThe bard now sings with fire and ease!\nOf {n} I shall tell today –\nno greater hero comes our way.\nThe dragons weep, the demons flee,\nthe gods kneel down on bended knee,\nand every ale in every land\nshall bear {n}'s name upon the stand!"
      ]
    }
  };
  const BONUS = 7; /* Barradins Auftreten-Bonus */
  const ZIELE = ["Friedrich", "Echo", "Ezekiel", "Rex", "Imre", "Barradin"];

  /* ---------- Gemeinsame Bausteine ---------- */
  const css = document.createElement("style");
  css.textContent = `
#hintergrund, #kerzenschein, #ranken { position: fixed; inset: 0; z-index: -1; pointer-events: none; }
#kerzenschein {
  background: radial-gradient(ellipse 70% 45% at 12% 100%, rgba(224,160,70,.10), transparent 70%),
              radial-gradient(ellipse 55% 35% at 92% 0%, rgba(224,160,70,.06), transparent 70%);
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
.laute-knopf { background: none; border: 0; padding: 0; cursor: pointer; opacity: .35; transition: opacity .3s, transform .3s; line-height: 0; }
.laute-knopf:hover, .laute-knopf:focus-visible { opacity: .8; transform: rotate(-8deg); }
.laute-knopf img { width: 30px; height: 30px; filter: invert(1) sepia(1) saturate(2) hue-rotate(5deg); }
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

.konfetti { position: fixed; z-index: 58; pointer-events: none; font-size: 1.4rem; color: var(--ember); will-change: transform, opacity; }

@media (prefers-reduced-motion: reduce) {
  #kerzenschein { animation: none; }
  .rex-guckt { transition: none; }
  main.beben, .w20.rollt svg, .lied.neu, .archiv-siegel, .saite.zupf i { animation: none; }
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
    const fuss = document.querySelector("footer .wrap");
    if (!fuss) return;
    const zeile = document.createElement("div");
    zeile.className = "ex-geheim";
    zeile.innerHTML = '<button type="button" class="laute-knopf" aria-label="' + esc(t().lauteKnopf) + '"><img src="skizze-laute.webp" alt=""></button><span class="geheim-text">' + esc(t().geheimHinweis) + '</span>';
    fuss.appendChild(zeile);
    const knopf = zeile.querySelector("button");
    knopf.addEventListener("click", () => {
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

  /* =====================================================================
     3. DIE TAVERNE
     ===================================================================== */

  /* --- Barradins Loblied --- */
  let ziel = ZIELE[0], eigenerName = "";
  let letzterWurf = null;
  function inspirationZeigen() {
    const el = $("inspiration");
    if (el) { el.hidden = lies("imres-inspiration", "0") !== "1"; el.textContent = t().inspirationBereit; }
  }
  function zielName() { return ziel === "*" ? (eigenerName.trim() || (sprache() === "en" ? "you" : "dich")) : ziel; }
  function zieleZeichnen() {
    const box = $("ziel-wahl");
    if (!box) return;
    box.innerHTML = ZIELE.map(n => '<button type="button" role="radio" data-ziel="' + n + '" aria-checked="' + (ziel === n) + '">' + n + "</button>").join("") +
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
    const T = t(), w = letzterWurf, s = w.stufe;
    const verse = REIME[sprache()][s];
    const vers = verse[w.vers % verse.length].split("{n}").join(esc(w.name));
    $("w20-gross").textContent = T.stufen[s];
    $("w20-klein").textContent = w.wurf + " + " + BONUS + " " + T.probeAuftreten + (w.insp ? " + " + w.insp + " " + T.probeInspiration : "") + " = " + w.summe;
    const box = $("lied");
    box.hidden = false;
    box.innerHTML = '<p class="label">' + esc(T.stufen[s]) + "</p><h4>" + esc(T.probeAuf(w.name)) + '</h4><p class="vers">' + vers + '</p><p class="buehne">' + esc(T.buehne[s]) + "</p>";
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
      letzterWurf = { wurf, insp, summe, stufe: stufe(wurf, summe), vers: Math.floor(Math.random() * 10), name: zielName() };
      liedZeigen(true);
      inspirationZeigen();
      const r = btn.getBoundingClientRect();
      if (wurf === 20 || letzterWurf.stufe === "legende") konfetti(r.left + r.width / 2, r.top + r.height / 2, null, wurf === 20 ? 44 : 24);
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
    zieleZeichnen();
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
    zieleZeichnen();
    if ($("w20-los")) $("w20-los").textContent = letzterWurf ? t().probeNochmal : t().probeWuerfeln;
    liedZeigen(false);
    inspirationZeigen();
    if ($("memory") && mem.karten.length) { namenSetzen(); memoryStatus(); if (mem.paare === mem.gesamt && mem.gesamt) $("memory-sieg").textContent = t().memSieg(mem.zuege); }
    const r = document.querySelector(".rex-guckt"); if (r) r.setAttribute("aria-label", t().rexLabel);
    const l = document.querySelector(".laute-knopf"); if (l) l.setAttribute("aria-label", t().lauteKnopf);
    const g = document.querySelector(".geheim-text"); if (g) g.textContent = t().geheimHinweis;
  }

  /* ---------- Start ---------- */
  function start() {
    hintergrund();
    ranken();
    rex();
    tastatur();
    laute();
    lobliedStarten();
    memoryStarten();
    new MutationObserver(sprachwechsel).observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
})();
