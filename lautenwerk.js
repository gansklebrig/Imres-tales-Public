/* =====================================================================
   BARRADINS LAUTENWERK – eine kleine mittelalterliche Beat-Maschine
   ---------------------------------------------------------------------
   Die ganze Gruppe spielt als Band, jede Spur hat 16 Schritte:
     Barradin   Klopfen (auf den Korpus), Schellen (am Stiefel),
                Bass (Daumen) und Melodie (Laute)
     Friedrich  Trommel
     Echo       Flöte
     Ezekiel    Ketten
     Rex        Wuff! und Heulen
   Jedes Lied hat zwei Teile (A = Strophe, B = Refrain) und einen Ablauf,
   z. B. A-A-B-A. Der Variations-Regler lässt die Band frei improvisieren:
   Noten wandern, Trommelwirbel kommen dazu – ideal als endlose
   Hintergrundmusik (siehe „Stimmungen“).
   Dazu: Tempo, Tonart, Kirchentonart, Tanzschritt (Swing), Bordun,
   Stumm und Lautstärke pro Spur. Lieder werden im Browser gemerkt und
   lassen sich als Link teilen.
   ===================================================================== */
(function () {
  "use strict";
  const root = document.getElementById("lautenwerk");
  if (!root) return;

  const ruhig = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const sprache = () => (document.documentElement.lang === "en" ? "en" : "de");
  const esc = s => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const zufall = l => l[Math.floor(Math.random() * l.length)];
  const SCHRITTE = 16;

  /* ---------- Spuren ---------- */
  /* art "an" = nur an/aus, art "ton" = eine Zeile pro Ton */
  const SPUREN = [
    { id: "klopf", wer: "barradin", art: "an", sym: "✊" },
    { id: "schelle", wer: "barradin", art: "an", sym: "🔔" },
    { id: "bass", wer: "barradin", art: "ton", zeilen: 5 },
    { id: "melodie", wer: "barradin", art: "ton", zeilen: 8 },
    { id: "trommel", wer: "friedrich", art: "an", sym: "🥁" },
    { id: "floete", wer: "echo", art: "ton", zeilen: 8 },
    { id: "ketten", wer: "ezekiel", art: "an", sym: "⛓" },
    { id: "rex", wer: "rex", art: "ton", zeilen: 3 }
  ];
  const IDS = SPUREN.map(s => s.id);
  const SPUR = Object.fromEntries(SPUREN.map(s => [s.id, s]));
  const TEILE = ["A", "B", "C", "D"];
  const ABLAEUFE = ["A", "AB", "AABB", "AABA", "ABAB", "AAAB", "ABC", "ABAC", "AABC", "ABCB", "AABACA", "AABBCC", "ABCD", "ABCABCD", "ABACABAD", "AABBCCDD"];
  /* Barradins Instrumente für die Melodie-Spur */
  const INSTRUMENTE = ["laute", "harfe", "mandoline", "fidel", "drehleier", "schalmei", "dudelsack", "glocken", "illusion"];
  const GEHALTEN = { fidel: 1, drehleier: 1, schalmei: 1, dudelsack: 1, illusion: 1 };
  /* Die Instrumente der übrigen Band */
  const BAND = {
    trommel: ["trommel", "pauke", "bodhran", "tamburin", "stoecke"],
    floete: ["floete", "panfloete", "okarina", "gesang", "horn"],
    ketten: ["ketten", "klatschen", "schnipsen", "rassel", "stampfen", "loeffel", "krug"]
  };
  const BAND_START = () => ({ trommel: "trommel", floete: "floete", ketten: "ketten" });
  const SYMBOL = {
    trommel: { trommel: "🥁", pauke: "🥁", bodhran: "🥁", tamburin: "🥁", stoecke: "🥢" },
    ketten: { ketten: "⛓", klatschen: "👏", schnipsen: "👌", rassel: "🥚", stampfen: "🦶", loeffel: "🥄", krug: "🍺" }
  };

  /* ---------- Texte ---------- */
  const TX = {
    de: {
      label: "Spielmannskunst", titel: "Barradins Lautenwerk",
      text: "Die Gefährten spielen auf, du bestimmst wie. Tippe in die Raster: Barradin klopft, klingelt, zupft den Bass und spielt die Melodie, Friedrich schlägt den Takt, Echo spielt die zweite Stimme, Ezekiel sorgt für den Rhythmus – und Rex gibt seinen Senf dazu. Bei jedem Gefährten kannst du das Instrument wählen.",
      spielen: "▶ Spielen", stopp: "■ Anhalten", tempo: "Tempo", tonart: "Tonart", modus: "Tonleiter",
      swing: "Tanzschritt", bordun: "Bordun", variation: "Variation",
      wer: { barradin: "Barradin", friedrich: "Friedrich", echo: "Echo", ezekiel: "Ezekiel", rex: "Rex" },
      spuren: { klopf: "Klopfen", schelle: "Schellen", bass: "Bass", melodie: "Laute", trommel: "Trommel", floete: "Flöte", ketten: "Ketten", rex: "Rex" },
      rexZeilen: ["Wuff", "Heulen", "Knurren"], rexLaut: ["Wuff!", "Auuuuu!", "Grrrr …"],
      instrument: "Instrument", instrumente: { laute: "Laute", harfe: "Harfe", mandoline: "Mandoline", fidel: "Fidel", drehleier: "Drehleier", schalmei: "Schalmei", dudelsack: "Dudelsack", glocken: "Glockenspiel", illusion: "Flöte der Illusionen" },
      band: {
        trommel: { trommel: "Landsknechttrommel", pauke: "Kesselpauke", bodhran: "Bodhrán", tamburin: "Schellentrommel", stoecke: "Holzstöcke" },
        floete: { floete: "Holzflöte", panfloete: "Panflöte", okarina: "Okarina", gesang: "Gesang", horn: "Hirtenhorn" },
        ketten: { ketten: "Ketten", klatschen: "Klatschen", schnipsen: "Schnipsen", rassel: "Rassel", stampfen: "Stampfen", loeffel: "Löffel", krug: "Krug auf den Tisch" }
      },
      teil: "Teil bearbeiten", ablauf: "Ablauf", kopieren: (a, b) => a + " → " + b + " kopieren", kopiert2: (a, b) => "Teil " + a + " wurde nach " + b + " kopiert.",
      lieder: "Lieder", stimmungen: "Stimmungen für Imre",
      vorlagen: { taverne: "Tavernentanz", saltarello: "Saltarello", ballade: "Ballade", trauer: "Trauerlied", schlacht: "Schlachtruf", wiegen: "Wiegenlied",
        kampf: "⚔ Kampf", unterreich: "🕯 Unterreich", reise: "🗺 Reise", spannung: "👁 Spannung", sieg: "🏆 Sieg" },
      zufall: "🎲 Improvisieren", leeren: "Leeren",
      stumm: "Stumm schalten", lautstaerke: "Lautstärke", zuklappen: "Ein- oder ausklappen",
      teilen: "🔗 Lied teilen", kopiert: "Link kopiert – schick ihn an die Gruppe!", geteilt: "Geteilt!",
      geladen: "Ein geteiltes Lied wurde geladen.",
      stimmungTipp: "Stimmungen laufen endlos und spielen mit Variation jedes Mal ein bisschen anders – perfekt als Hintergrund für eure Sessions.",
      modi: { dorisch: "Dorisch", mixolydisch: "Mixolydisch", aeolisch: "Äolisch", phrygisch: "Phrygisch" },
      noten: ["C", "C♯", "D", "E♭", "E", "F", "F♯", "G", "G♯", "A", "B", "H"],
      wischen: "← wischen →"
    },
    en: {
      label: "Minstrelsy", titel: "Barradin's Lute Machine",
      text: "The companions strike up, you decide how. Tap the grids: Barradin knocks, jingles, plucks the bass and plays the melody, Friedrich keeps the beat, Echo plays the second voice, Ezekiel adds the rhythm – and Rex adds his two cents. You can pick the instrument for every companion.",
      spielen: "▶ Play", stopp: "■ Stop", tempo: "Tempo", tonart: "Key", modus: "Mode",
      swing: "Dance step", bordun: "Drone", variation: "Variation",
      wer: { barradin: "Barradin", friedrich: "Friedrich", echo: "Echo", ezekiel: "Ezekiel", rex: "Rex" },
      spuren: { klopf: "Knock", schelle: "Bells", bass: "Bass", melodie: "Lute", trommel: "Drum", floete: "Flute", ketten: "Chains", rex: "Rex" },
      rexZeilen: ["Woof", "Howl", "Growl"], rexLaut: ["Woof!", "Awooooo!", "Grrrr …"],
      instrument: "Instrument", instrumente: { laute: "Lute", harfe: "Harp", mandoline: "Mandolin", fidel: "Fiddle", drehleier: "Hurdy-gurdy", schalmei: "Shawm", dudelsack: "Bagpipes", glocken: "Glockenspiel", illusion: "Flute of Illusions" },
      band: {
        trommel: { trommel: "Field drum", pauke: "Kettledrum", bodhran: "Bodhrán", tamburin: "Tambourine", stoecke: "Wooden sticks" },
        floete: { floete: "Wooden flute", panfloete: "Pan flute", okarina: "Ocarina", gesang: "Singing", horn: "Shepherd's horn" },
        ketten: { ketten: "Chains", klatschen: "Clapping", schnipsen: "Finger snaps", rassel: "Shaker", stampfen: "Stomping", loeffel: "Spoons", krug: "Tankard on the table" }
      },
      teil: "Edit part", ablauf: "Order", kopieren: (a, b) => "Copy " + a + " → " + b, kopiert2: (a, b) => "Part " + a + " was copied to " + b + ".",
      lieder: "Songs", stimmungen: "Moods for Imre",
      vorlagen: { taverne: "Tavern dance", saltarello: "Saltarello", ballade: "Ballad", trauer: "Lament", schlacht: "Battle cry", wiegen: "Lullaby",
        kampf: "⚔ Battle", unterreich: "🕯 Underdark", reise: "🗺 Journey", spannung: "👁 Suspense", sieg: "🏆 Victory" },
      zufall: "🎲 Improvise", leeren: "Clear",
      stumm: "Mute", lautstaerke: "Volume", zuklappen: "Expand or collapse",
      teilen: "🔗 Share song", kopiert: "Link copied – send it to the party!", geteilt: "Shared!",
      geladen: "A shared song has been loaded.",
      stimmungTipp: "Moods loop endlessly and, with variation, play a little differently every time – perfect as background music for your sessions.",
      modi: { dorisch: "Dorian", mixolydisch: "Mixolydian", aeolisch: "Aeolian", phrygisch: "Phrygian" },
      noten: ["C", "C♯", "D", "E♭", "E", "F", "F♯", "G", "G♯", "A", "B♭", "B"],
      wischen: "← swipe →"
    }
  };
  const t = () => TX[sprache()];

  /* ---------- Musik ---------- */
  const MODI = {
    dorisch: [0, 2, 3, 5, 7, 9, 10, 12],
    mixolydisch: [0, 2, 4, 5, 7, 9, 10, 12],
    aeolisch: [0, 2, 3, 5, 7, 8, 10, 12],
    phrygisch: [0, 1, 3, 5, 7, 8, 10, 12]
  };
  const MODUS_LISTE = Object.keys(MODI);
  const BASS_STUFEN = [0, 2, 3, 4, 6]; /* Grundton, Terz, Quarte, Quinte, Septime */
  const MEL_GRUND = 62, BASS_GRUND = 50, FLOETE_GRUND = 74; /* D4, D3, D5 */
  const midiHz = m => 440 * Math.pow(2, (m - 69) / 12);
  const tonMidi = (spur, zeile, s) => {
    const sk = MODI[s.modus];
    if (spur === "bass") return BASS_GRUND + s.transpose + sk[BASS_STUFEN[zeile]];
    if (spur === "floete") return FLOETE_GRUND + s.transpose + sk[zeile];
    return MEL_GRUND + s.transpose + sk[zeile];
  };
  const notenName = m => t().noten[((m % 12) + 12) % 12];

  /* ---------- Vorlagen ---------- */
  const leer = () => Array(SCHRITTE).fill(-1);
  const an = liste => { const a = leer(); liste.forEach(i => a[i] = 0); return a; };
  const folge = paare => { const a = leer(); Object.keys(paare).forEach(i => a[+i] = paare[i]); return a; };
  const teilLeer = () => Object.fromEntries(IDS.map(k => [k, leer()]));
  const teil = o => Object.assign(teilLeer(), o);
  /* Zeilen der Ton-Spuren sind Tonleiterstufen (0 = Grundton, 7 = Oktave).
     Bass-Zeilen: 0 = I, 1 = III, 2 = IV, 3 = V, 4 = VII.
     Die Melodien setzen auf den Zählzeiten Akkordtöne des jeweiligen Basstons,
     Echos zweite Stimme liegt meist eine Terz oder Sexte daneben. */
  const VORLAGEN = {
    taverne: { instrument: "laute", band: { trommel: "bodhran", floete: "floete", ketten: "klatschen" },
      tempo: 112, transpose: 0, modus: "dorisch", swing: 0, bordun: 1, variation: 2, ablauf: "AABACA",
      A: teil({ klopf: an([0, 6, 8, 12]), schelle: an([2, 6, 10, 14]), trommel: an([0, 3, 6, 8, 11, 14]), ketten: an([4, 12]),
        bass: folge({ 0: 0, 4: 0, 8: 4, 12: 3 }),
        melodie: folge({ 0: 4, 2: 2, 3: 3, 4: 4, 6: 7, 7: 6, 8: 6, 10: 3, 11: 4, 12: 4, 13: 3, 14: 1, 15: 2 }) }),
      B: teil({ klopf: an([0, 6, 8, 12]), schelle: an([2, 6, 10, 14]), trommel: an([0, 3, 6, 8, 11, 12, 14]), ketten: an([4, 12]),
        bass: folge({ 0: 0, 4: 2, 8: 0, 12: 3, 14: 3 }),
        melodie: folge({ 0: 7, 2: 4, 3: 5, 4: 5, 6: 3, 7: 4, 8: 2, 10: 0, 11: 2, 12: 1, 13: 2, 14: 4 }),
        floete: folge({ 0: 4, 4: 3, 8: 4, 12: 4 }), rex: folge({ 15: 0 }) }),
      C: teil({ klopf: an([0, 8]), schelle: an([4, 12]), trommel: an([0, 8]), ketten: an([4, 10, 12]),
        bass: folge({ 0: 4, 4: 4, 8: 2, 12: 3 }),
        melodie: folge({ 0: 1, 4: 3, 8: 0, 12: 1 }),
        floete: folge({ 0: 3, 2: 1, 4: 6, 6: 3, 8: 5, 10: 3, 12: 4, 14: 6 }) }) },
    saltarello: { instrument: "schalmei", band: { trommel: "tamburin", floete: "floete", ketten: "stampfen" },
      tempo: 126, transpose: 0, modus: "mixolydisch", swing: 0, bordun: 1, variation: 2, ablauf: "AABB",
      A: teil({ klopf: an([0, 6, 8, 14]), trommel: an([0, 3, 6, 8, 11, 14]), ketten: an([4, 12]),
        bass: folge({ 0: 0, 6: 0, 8: 4, 14: 4 }),
        melodie: folge({ 0: 4, 2: 2, 3: 3, 4: 4, 6: 2, 7: 1, 8: 1, 10: 3, 11: 5, 12: 6, 14: 3, 15: 5 }) }),
      B: teil({ klopf: an([0, 6, 8, 14]), schelle: an([3, 11]), trommel: an([0, 3, 6, 8, 11, 14]), ketten: an([4, 12]),
        bass: folge({ 0: 0, 4: 2, 8: 3, 12: 0 }),
        melodie: folge({ 0: 7, 2: 4, 3: 5, 4: 5, 6: 3, 7: 4, 8: 4, 10: 6, 11: 5, 12: 4, 14: 2, 15: 1 }),
        floete: folge({ 0: 4, 4: 7, 8: 6, 12: 4 }) }) },
    ballade: { instrument: "laute", band: { trommel: "bodhran", floete: "gesang", ketten: "schnipsen" },
      tempo: 96, transpose: 0, modus: "dorisch", swing: 1, bordun: 0, variation: 2, ablauf: "ABCABCD",
      A: teil({ klopf: an([0, 8]), ketten: an([4, 12]), bass: folge({ 0: 0, 8: 4 }),
        melodie: folge({ 0: 0, 2: 2, 4: 4, 6: 2, 8: 3, 10: 1, 12: 3, 14: 6 }) }),
      B: teil({ klopf: an([0, 8]), ketten: an([4, 12]), bass: folge({ 0: 2, 8: 3 }),
        melodie: folge({ 0: 3, 2: 5, 4: 7, 6: 5, 8: 4, 10: 6, 12: 4, 14: 1 }) }),
      C: teil({ klopf: an([0, 8]), schelle: an([4, 12]), trommel: an([0, 6, 8, 14]), ketten: an([4, 12]),
        bass: folge({ 0: 0, 4: 2, 8: 4, 12: 3 }),
        melodie: folge({ 0: 2, 4: 3, 8: 1, 12: 6 }),
        floete: folge({ 0: 4, 2: 4, 4: 5, 6: 3, 8: 6, 10: 3, 12: 4, 14: 1 }) }),
      D: teil({ klopf: an([0]), bass: folge({ 0: 4, 8: 0 }),
        melodie: folge({ 0: 6, 4: 3, 8: 2, 10: 4, 12: 0 }),
        floete: folge({ 0: 3, 8: 4 }), rex: folge({ 12: 1 }) }) },
    trauer: { instrument: "fidel", band: { trommel: "pauke", floete: "gesang", ketten: "ketten" },
      tempo: 70, transpose: -2, modus: "aeolisch", swing: 0, bordun: 1, variation: 1, ablauf: "AABB",
      A: teil({ klopf: an([0, 8]), bass: folge({ 0: 0, 8: 2, 12: 3 }),
        melodie: folge({ 0: 4, 4: 2, 6: 0, 8: 3, 10: 5, 12: 1 }) }),
      B: teil({ trommel: an([0]), bass: folge({ 0: 4, 4: 1, 8: 2, 12: 3 }),
        melodie: folge({ 0: 6, 3: 5, 4: 4, 6: 2, 8: 0, 10: 3, 12: 1, 14: 4 }),
        floete: folge({ 0: 3, 4: 6, 8: 5, 12: 4 }), rex: folge({ 14: 1 }) }) },
    schlacht: { instrument: "dudelsack", band: { trommel: "pauke", floete: "horn", ketten: "stampfen" },
      tempo: 138, transpose: 2, modus: "phrygisch", swing: 0, bordun: 1, variation: 3, ablauf: "AABC",
      A: teil({ klopf: an([0, 3, 6, 8, 11, 14]), schelle: an([2, 6, 10, 14]), trommel: an([0, 4, 8, 12]), ketten: an([0, 8]),
        bass: folge({ 0: 0, 2: 0, 4: 0, 6: 0, 8: 0, 10: 0, 12: 4, 14: 4 }),
        melodie: folge({ 0: 4, 2: 4, 3: 5, 4: 4, 6: 2, 7: 1, 8: 0, 10: 4, 11: 5, 12: 6, 14: 3, 15: 1 }) }),
      B: teil({ klopf: an([0, 4, 8, 12]), schelle: an([0, 2, 4, 6, 8, 10, 12, 14]), trommel: an([0, 4, 8, 10, 12, 14]), ketten: an([0, 4, 8, 12]),
        bass: folge({ 0: 0, 4: 2, 8: 3, 12: 4 }),
        melodie: folge({ 0: 7, 2: 4, 4: 5, 6: 3, 8: 4, 10: 6, 12: 6, 14: 1, 15: 0 }),
        floete: folge({ 0: 4, 4: 3, 8: 4, 12: 3 }), rex: folge({ 15: 0 }) }),
      C: teil({ klopf: an([0, 8]), trommel: an([0, 4, 8, 10, 12, 13, 14, 15]), ketten: an([0, 4, 8, 12]),
        bass: folge({ 0: 0, 8: 0 }), floete: folge({ 0: 4, 6: 4, 8: 7 }), rex: folge({ 12: 2 }) }) },
    wiegen: { instrument: "harfe", band: { trommel: "trommel", floete: "okarina", ketten: "rassel" },
      tempo: 84, transpose: 0, modus: "mixolydisch", swing: 1, bordun: 0, variation: 1, ablauf: "AABB",
      A: teil({ klopf: an([0, 8]), ketten: an([4, 12]), bass: folge({ 0: 0, 8: 2 }),
        melodie: folge({ 0: 4, 2: 2, 4: 4, 6: 2, 8: 3, 10: 5, 12: 3, 14: 0 }) }),
      B: teil({ klopf: an([0, 8]), schelle: an([12]), ketten: an([4, 12]), bass: folge({ 0: 4, 8: 0 }),
        melodie: folge({ 0: 6, 2: 3, 4: 1, 6: 3, 8: 2, 10: 4, 12: 0 }),
        floete: folge({ 0: 1, 4: 3, 8: 4, 12: 2 }) }) },
    /* Stimmungen für die Spielleitung: viel Variation, laufen endlos */
    kampf: { instrument: "fidel", band: { trommel: "pauke", floete: "horn", ketten: "ketten" },
      tempo: 150, transpose: 0, modus: "phrygisch", swing: 0, bordun: 1, variation: 6, ablauf: "AABACA",
      A: teil({ klopf: an([0, 4, 8, 12]), trommel: an([0, 3, 6, 8, 11, 14]), ketten: an([4, 12]), schelle: an([2, 6, 10, 14]),
        bass: folge({ 0: 0, 3: 0, 6: 0, 8: 0, 11: 0, 14: 0 }),
        melodie: folge({ 0: 0, 1: 1, 2: 0, 4: 4, 6: 2, 7: 1, 8: 0, 10: 4, 11: 5, 12: 4, 14: 2, 15: 1 }) }),
      B: teil({ klopf: an([0, 4, 8, 12]), trommel: an([0, 2, 4, 6, 8, 10, 12, 13, 14, 15]), ketten: an([0, 6, 8, 14]), schelle: an([0, 4, 8, 12]),
        bass: folge({ 0: 2, 4: 2, 8: 3, 12: 4 }),
        melodie: folge({ 0: 5, 2: 3, 4: 5, 6: 7, 8: 6, 10: 4, 12: 6, 14: 3 }),
        floete: folge({ 0: 3, 8: 4, 12: 3 }), rex: folge({ 14: 0 }) }),
      C: teil({ klopf: an([0, 4, 8, 12]), trommel: an([0, 2, 4, 6, 8, 9, 10, 11, 12, 13, 14, 15]), ketten: an([0, 8]),
        bass: folge({ 0: 0, 4: 0, 8: 0, 12: 0 }), floete: folge({ 0: 4, 4: 4, 6: 7, 8: 4 }), rex: folge({ 14: 2 }) }) },
    unterreich: { instrument: "drehleier", band: { trommel: "pauke", floete: "okarina", ketten: "ketten" },
      tempo: 64, transpose: -3, modus: "phrygisch", swing: 0, bordun: 1, variation: 5, ablauf: "AB",
      A: teil({ trommel: an([0]), ketten: an([7]), bass: folge({ 0: 0, 10: 1 }),
        melodie: folge({ 4: 1, 6: 0, 12: 2 }) }),
      B: teil({ trommel: an([0, 12]), ketten: an([5, 13]), bass: folge({ 0: 0, 8: 0 }),
        floete: folge({ 0: 4, 4: 2, 8: 1, 12: 0 }) }) },
    reise: { instrument: "mandoline", band: { trommel: "bodhran", floete: "panfloete", ketten: "rassel" },
      tempo: 100, transpose: 2, modus: "mixolydisch", swing: 1, bordun: 1, variation: 4, ablauf: "AABA",
      A: teil({ klopf: an([0, 8]), schelle: an([4, 12]), trommel: an([0, 6, 8, 14]), ketten: an([2, 6, 10, 14]),
        bass: folge({ 0: 0, 4: 4, 8: 2, 12: 0 }),
        melodie: folge({ 0: 2, 2: 4, 4: 6, 6: 3, 8: 3, 10: 5, 12: 4, 14: 2 }) }),
      B: teil({ klopf: an([0, 8]), schelle: an([4, 12]), trommel: an([0, 6, 8, 14]), ketten: an([2, 6, 10, 14]),
        bass: folge({ 0: 2, 4: 0, 8: 4, 12: 0 }),
        melodie: folge({ 0: 3, 4: 2, 8: 1, 12: 0 }),
        floete: folge({ 0: 5, 2: 7, 4: 4, 6: 2, 8: 6, 10: 3, 12: 4, 14: 7 }) }) },
    spannung: { instrument: "glocken", band: { trommel: "pauke", floete: "okarina", ketten: "schnipsen" },
      tempo: 90, transpose: 0, modus: "aeolisch", swing: 0, bordun: 0, variation: 5, ablauf: "AAAB",
      A: teil({ trommel: an([0, 2]), ketten: an([0, 4, 8, 12]),
        bass: folge({ 0: 0, 2: 0, 4: 0, 6: 0, 8: 0, 10: 0, 12: 0, 14: 1 }) }),
      B: teil({ trommel: an([0, 2, 8, 10, 12, 14, 15]), ketten: an([0, 2, 4, 6, 8, 10, 12, 14]),
        bass: folge({ 0: 0, 2: 0, 4: 0, 6: 0, 8: 1, 10: 1, 12: 1, 14: 2 }),
        melodie: folge({ 0: 5, 4: 4, 8: 5, 12: 7 }), floete: folge({ 8: 2, 12: 3 }) }) },
    sieg: { instrument: "laute", band: { trommel: "tamburin", floete: "horn", ketten: "klatschen" },
      tempo: 132, transpose: 0, modus: "mixolydisch", swing: 0, bordun: 1, variation: 4, ablauf: "AABB",
      A: teil({ klopf: an([0, 4, 8, 12]), schelle: an([2, 6, 10, 14]), trommel: an([0, 4, 6, 8, 12, 14]), ketten: an([4, 12]),
        bass: folge({ 0: 0, 4: 2, 8: 4, 12: 0 }),
        melodie: folge({ 0: 0, 1: 2, 2: 4, 4: 5, 6: 3, 8: 6, 9: 4, 10: 3, 12: 4, 14: 7 }),
        floete: folge({ 0: 4, 4: 7, 8: 6, 12: 7 }) }),
      B: teil({ klopf: an([0, 4, 8, 12]), schelle: an([0, 2, 4, 6, 8, 10, 12, 14]), trommel: an([0, 2, 4, 6, 8, 10, 12, 13, 14, 15]), ketten: an([4, 12]),
        bass: folge({ 0: 2, 4: 0, 8: 4, 12: 0 }),
        melodie: folge({ 0: 7, 2: 5, 4: 4, 6: 2, 8: 6, 10: 1, 12: 2, 14: 0 }),
        floete: folge({ 0: 5, 4: 4, 8: 3, 12: 4 }), rex: folge({ 14: 0 }) }) }
  };
  const LIEDER = ["taverne", "saltarello", "ballade", "trauer", "schlacht", "wiegen"];
  const STIMMUNGEN = ["kampf", "unterreich", "reise", "spannung", "sieg"];
  const kopie = o => JSON.parse(JSON.stringify(o));

  /* ---------- Zustand (gemerkt im Browser) ---------- */
  const MIX_START = () => ({
    vol: { klopf: 8, schelle: 6, bass: 8, melodie: 8, trommel: 7, floete: 6, ketten: 6, rex: 6 },
    mute: Object.fromEntries(IDS.map(k => [k, 0]))
  });
  const ausVorlage = (k, mix) => {
    const v = kopie(VORLAGEN[k]);
    return { tempo: v.tempo, transpose: v.transpose, modus: v.modus, swing: v.swing, bordun: v.bordun, variation: v.variation, instrument: v.instrument || "laute",
      band: Object.assign(BAND_START(), v.band || {}),
      ablauf: v.ablauf, teile: { A: v.A || teilLeer(), B: v.B || teilLeer(), C: v.C || teilLeer(), D: v.D || teilLeer() }, ...(mix || MIX_START()) };
  };
  function pruefen(s) {
    const m = MIX_START();
    s.vol = Object.assign(m.vol, s.vol || {}); s.mute = Object.assign(m.mute, s.mute || {});
    s.teile = s.teile || {};
    TEILE.forEach(p => { s.teile[p] = Object.assign(teilLeer(), s.teile[p] || {}); });
    if (!/^[ABCD]{1,8}$/.test(s.ablauf || "")) s.ablauf = "A";
    s.band = Object.assign(BAND_START(), s.band || {});
    Object.keys(BAND).forEach(k => { if (!BAND[k].includes(s.band[k])) s.band[k] = BAND[k][0]; });
    if (typeof s.variation !== "number") s.variation = 0;
    if (!INSTRUMENTE.includes(s.instrument)) s.instrument = "laute";
    return s;
  }
  let S = ausVorlage("taverne");
  try {
    const g = JSON.parse(localStorage.getItem("imres-lautenwerk2") || "null");
    if (g && g.teile) S = pruefen(g);
  } catch (_) {}
  let zugeklappt = {};
  try { zugeklappt = JSON.parse(localStorage.getItem("imres-lautenwerk-zu") || "{}") || {}; } catch (_) {}
  let bearbeite = "A";
  const merken = () => { try { localStorage.setItem("imres-lautenwerk2", JSON.stringify(S)); } catch (_) {} };

  /* ---------- Lied als kurzer Code für den Link ---------- */
  const hex = a => { let n = 0; a.forEach((v, i) => { if (v >= 0) n |= 1 << i; }); return n.toString(16).padStart(4, "0"); };
  const unhex = h => { const n = parseInt(h, 16) || 0; return Array.from({ length: SCHRITTE }, (_, i) => ((n >> i) & 1) ? 0 : -1); };
  const ziffern = a => a.map(v => v < 0 ? "." : v).join("");
  const unziffern = (str, max) => String(str || "").padEnd(SCHRITTE, ".").slice(0, SCHRITTE).split("").map(c => { const n = parseInt(c, 10); return isNaN(n) || n > max ? -1 : n; });
  const zahl = (x, min, max, d) => { const n = parseInt(x, 10); return isNaN(n) ? d : Math.max(min, Math.min(max, n)); };
  const kodieren = () => ["4", S.tempo, S.transpose, MODUS_LISTE.indexOf(S.modus), S.swing, S.bordun, S.variation, S.ablauf,
    IDS.map(k => (S.mute[k] ? "m" : "") + S.vol[k]).join("")]
    .concat(...TEILE.map(p => SPUREN.map(sp => sp.art === "an" ? hex(S.teile[p][sp.id]) : ziffern(S.teile[p][sp.id]))))
    .concat([INSTRUMENTE.indexOf(S.instrument) + ["trommel", "floete", "ketten"].map(k => BAND[k].indexOf(S.band[k])).join("")])
    .join("-");
  function dekodieren(code) {
    const p = String(code).split("-");
    if (p[0] === "4" && p.length === 10 + 4 * SPUREN.length) {
      const s = { tempo: zahl(p[1], 50, 180, 110), transpose: zahl(p[2], -5, 6, 0), modus: MODUS_LISTE[zahl(p[3], 0, 3, 0)],
        swing: zahl(p[4], 0, 1, 0), bordun: zahl(p[5], 0, 1, 1), variation: zahl(p[6], 0, 10, 0), ablauf: String(p[7]).toUpperCase(),
        ...MIX_START(), teile: {}, band: BAND_START() };
      const mix = p[8].match(/m?\d/g);
      if (mix && mix.length === IDS.length) IDS.forEach((k, i) => { s.mute[k] = mix[i][0] === "m" ? 1 : 0; s.vol[k] = +mix[i].slice(-1); });
      TEILE.forEach((teilName, ti) => {
        s.teile[teilName] = {};
        SPUREN.forEach((sp, si) => {
          const feld = p[9 + ti * SPUREN.length + si];
          s.teile[teilName][sp.id] = sp.art === "an" ? unhex(feld) : unziffern(feld, sp.zeilen - 1);
        });
      });
      const ins = String(p[9 + 4 * SPUREN.length] || "");
      s.instrument = INSTRUMENTE[zahl(ins[0], 0, INSTRUMENTE.length - 1, 0)];
      ["trommel", "floete", "ketten"].forEach((k, i) => { s.band[k] = BAND[k][zahl(ins[i + 1], 0, BAND[k].length - 1, 0)]; });
      return pruefen(s);
    }
    if ((p[0] === "2" && p.length === 9 + 2 * SPUREN.length) || (p[0] === "3" && p.length === 10 + 2 * SPUREN.length)) {
      const s = { tempo: zahl(p[1], 50, 180, 110), transpose: zahl(p[2], -5, 6, 0), modus: MODUS_LISTE[zahl(p[3], 0, 3, 0)],
        swing: zahl(p[4], 0, 1, 0), bordun: zahl(p[5], 0, 1, 1), variation: zahl(p[6], 0, 10, 0), ablauf: ABLAEUFE[zahl(p[7], 0, ABLAEUFE.length - 1, 0)],
        ...MIX_START(), teile: {} };
      const mix = p[8].match(/m?\d/g);
      if (mix && mix.length === IDS.length) IDS.forEach((k, i) => { s.mute[k] = mix[i][0] === "m" ? 1 : 0; s.vol[k] = +mix[i].slice(-1); });
      ["A", "B"].forEach((teilName, ti) => {
        s.teile[teilName] = {};
        SPUREN.forEach((sp, si) => {
          const feld = p[9 + ti * SPUREN.length + si];
          s.teile[teilName][sp.id] = sp.art === "an" ? unhex(feld) : unziffern(feld, sp.zeilen - 1);
        });
      });
      if (p[0] === "3") s.instrument = INSTRUMENTE[zahl(p[9 + 2 * SPUREN.length], 0, INSTRUMENTE.length - 1, 0)];
      return pruefen(s);
    }
    /* alte Links (nur Barradin, ein Teil) */
    if ((p.length === 9 || p.length === 10) && p[7].length === SCHRITTE && p[8].length === SCHRITTE) {
      const s = { tempo: zahl(p[0], 50, 180, 110), transpose: zahl(p[1], -5, 6, 0), modus: MODUS_LISTE[zahl(p[2], 0, 3, 0)],
        swing: zahl(p[3], 0, 1, 0), bordun: zahl(p[4], 0, 1, 1), variation: 0, ablauf: "A", ...MIX_START(),
        teile: { A: teil({ klopf: unhex(p[5]), schelle: unhex(p[6]), bass: unziffern(p[7], 4), melodie: unziffern(p[8], 7) }), B: teilLeer() } };
      return pruefen(s);
    }
    return null;
  }
  let ausLink = false;
  try {
    const code = new URLSearchParams(location.search).get("lied");
    const d = code && dekodieren(code);
    if (d) { S = d; ausLink = true; }
  } catch (_) {}

  /* ---------- Klang ---------- */
  let ctx = null, master = null, rauschen = null, illusionEcho = null;
  const spurGain = {};
  const spurPegel = k => S.mute[k] ? 0 : Math.pow(S.vol[k] / 9, 1.6);
  function mixAnwenden() {
    if (!ctx) return;
    IDS.forEach(k => spurGain[k] && spurGain[k].gain.setTargetAtTime(spurPegel(k), ctx.currentTime, .03));
  }
  const saitenCache = new Map();
  function audioStart() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      try { ctx = new AC({ latencyHint: "playback" }); } catch (_) { ctx = new AC(); } /* größerer Puffer = keine Aussetzer auf dem Handy */
      /* Signalkette: Spuren → Master → sanfter Kompressor → Ausgangspegel → Limiter.
         Hält die Lautstärke auch auf Kopfhörern unter der Übersteuerungsgrenze. */
      const komp = ctx.createDynamicsCompressor();
      komp.threshold.value = -20; komp.knee.value = 10; komp.ratio.value = 3; komp.attack.value = .005; komp.release.value = .2;
      const ausgang = ctx.createGain(); ausgang.gain.value = .6;
      const limiter = ctx.createDynamicsCompressor();
      limiter.threshold.value = -4; limiter.knee.value = 2; limiter.ratio.value = 20; limiter.attack.value = .003; limiter.release.value = .25;
      master = ctx.createGain(); master.gain.value = .45;
      master.connect(komp); komp.connect(ausgang); ausgang.connect(limiter); limiter.connect(ctx.destination);
      IDS.forEach(k => { const g = ctx.createGain(); g.connect(master); spurGain[k] = g; });
      /* Echo für die Flöte der Illusionen */
      illusionEcho = ctx.createDelay(1); illusionEcho.delayTime.value = .23;
      const rueck = ctx.createGain(); rueck.gain.value = .42;
      const echoFilter = ctx.createBiquadFilter(); echoFilter.type = "lowpass"; echoFilter.frequency.value = 2400;
      illusionEcho.connect(echoFilter); echoFilter.connect(rueck); rueck.connect(illusionEcho); echoFilter.connect(spurGain.melodie);
      mixAnwenden();
      const n = ctx.sampleRate;
      rauschen = ctx.createBuffer(1, n, ctx.sampleRate);
      const d = rauschen.getChannelData(0);
      for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    }
    if (ctx.state === "suspended") ctx.resume();
  }
  /* ---------- Vorberechnete Klänge ----------
     Aufwendige Instrumente werden einmal im Hintergrund (OfflineAudioContext) gerendert
     und danach nur noch als fertiger Puffer abgespielt – das spart pro Note dutzende Knoten. */
  const klangCache = new Map(), inArbeit = new Set();
  let rendert = false;
  function vorrendern(key, laenge, bauen, spitze) {
    if (!ctx || rendert || klangCache.has(key) || inArbeit.has(key)) return;
    const OAC = window.OfflineAudioContext || window.webkitOfflineAudioContext;
    if (!OAC) return;
    inArbeit.add(key);
    const sr = ctx.sampleRate, off = new OAC(1, Math.ceil(sr * laenge), sr);
    const altCtx = ctx, altGain = Object.assign({}, spurGain), altEcho = illusionEcho;
    ctx = off; rendert = true; illusionEcho = null;
    const ziel = off.createGain(); ziel.connect(off.destination);
    IDS.forEach(k => { spurGain[k] = ziel; });
    try { bauen(); } catch (_) {} finally { ctx = altCtx; Object.assign(spurGain, altGain); illusionEcho = altEcho; rendert = false; }
    const fertig = buf => {
      if (buf) { /* auf feste Spitzenlautstärke bringen – so kann kein Instrument übersteuern */
        const d = buf.getChannelData(0); let max = 0;
        for (let i = 0; i < d.length; i++) { const a = Math.abs(d[i]); if (a > max) max = a; }
        if (max > 0) { const f = spitze / max; for (let i = 0; i < d.length; i++) d[i] *= f; }
        klangCache.set(key, buf);
      }
      inArbeit.delete(key);
    };
    const pr = off.startRendering();
    if (pr && pr.then) pr.then(fertig, () => inArbeit.delete(key));
    else off.oncomplete = e => fertig(e.renderedBuffer);
  }
  function abspielen(buf, zeit, ziel, laut, dauer) {
    const src = ctx.createBufferSource(), g = ctx.createGain();
    src.buffer = buf; g.gain.value = laut;
    src.connect(g); g.connect(ziel); src.start(zeit);
    if (dauer) {
      const ende = Math.min(zeit + dauer, zeit + buf.duration - .15);
      g.gain.setValueAtTime(laut, ende); g.gain.linearRampToValueAtTime(0, ende + .12);
      src.stop(ende + .15);
    }
    return g;
  }
  const MEL_SPITZE = { glocken: .3, fidel: .26, drehleier: .3, schalmei: .2, dudelsack: .22, illusion: .26 };
  const ECHO_SPITZE = { panfloete: .3, okarina: .32, gesang: .27, horn: .27 };
  const ECHO_LAENGE = { panfloete: 3.4, okarina: 3.4, gesang: 3.6, horn: 3.4 };
  const MEL_LAENGE = { glocken: 1.6, fidel: 3.4, drehleier: 3.3, schalmei: 3.3, dudelsack: 3.3, illusion: 3.5 };
  function klaengeVorbereiten() {
    if (!ctx) return;
    const art = S.instrument;
    if (MEL_LAENGE[art]) for (let z = 0; z < 8; z++) {
      const f = midiHz(tonMidi("melodie", z, S));
      vorrendern(art + "|" + f.toFixed(2), MEL_LAENGE[art], () => melodieSpielen(f, 0, 3, 1), MEL_SPITZE[art]);
    }
    const ea = S.band.floete;
    if (ECHO_LAENGE[ea]) for (let z = 0; z < 8; z++) {
      const f = midiHz(tonMidi("floete", z, S));
      vorrendern("echo|" + ea + "|" + f.toFixed(2), ECHO_LAENGE[ea], () => echoSpielen(f, 0, 3, 1), ECHO_SPITZE[ea]);
    }
    if (S.band.ketten === "ketten") for (let v = 0; v < 4; v++) vorrendern("kette" + v, .9, () => kettenRasselnLive(0, 1), .38);
    [.32, 1.75, .9].forEach((l, a) => vorrendern("rex" + a, l, () => rexLautLive(0, a, 1), [.42, .34, .4][a]));
  }
  function saite(freq, art) {
    const key = art + freq.toFixed(2);
    if (saitenCache.has(key)) return saitenCache.get(key);
    const sr = ctx.sampleRate, dauer = art === "bass" ? 1.8 : art === "harfe" ? 2.6 : art === "mandoline" ? .9 : 1.4, n = Math.round(sr * dauer);
    const buf = ctx.createBuffer(1, n, sr), d = buf.getChannelData(0);
    const p = Math.max(2, Math.round(sr / freq)), ring = new Float32Array(p);
    for (let j = 0; j < p; j++) ring[j] = Math.random() * 2 - 1;
    if (art === "harfe") for (let k = 0; k < 2; k++) for (let j = 0; j < p; j++) ring[j] = (ring[j] + ring[(j + 1) % p]) / 2; /* weicher angezupft */
    const daempf = art === "bass" ? .4985 : art === "harfe" ? .4993 : art === "mandoline" ? .4962 : .4975;
    let idx = 0;
    for (let j = 0; j < n; j++) {
      const a = ring[idx], b = ring[(idx + 1) % p];
      d[j] = a;
      ring[idx] = (a + b) * daempf;
      idx = (idx + 1) % p;
    }
    saitenCache.set(key, buf);
    return buf;
  }
  /* Alle Saitenklänge der aktuellen Tonleiter vorab berechnen,
     damit beim Spielen nichts mehr gerechnet werden muss (verhindert Hänger) */
  function saitenVorbereiten() {
    if (!ctx) return;
    const sa = { laute: "mel", harfe: "harfe", mandoline: "mandoline" }[S.instrument];
    if (sa) for (let z = 0; z < 8; z++) saite(midiHz(tonMidi("melodie", z, S)), sa);
    for (let z = 0; z < BASS_STUFEN.length; z++) saite(midiHz(tonMidi("bass", z, S)), "bass");
    klaengeVorbereiten();
  }
  function zupf(freq, zeit, art, laut) {
    const src = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    src.buffer = saite(freq, art);
    f.type = "lowpass"; f.frequency.value = art === "bass" ? 1100 : art === "harfe" ? 4200 : art === "mandoline" ? 4800 : 3400; f.Q.value = .7;
    g.gain.value = (laut || 1) * (art === "bass" ? .9 : art === "harfe" ? .6 : art === "mandoline" ? .38 : .55);
    src.connect(f); f.connect(g); g.connect(spurGain[art === "bass" ? "bass" : "melodie"]);
    src.start(zeit);
  }
  function rauschStoss(zeit, ziel, typ, freq, q, laut, dauer, start) {
    const r = ctx.createBufferSource(), b = ctx.createBiquadFilter(), g = ctx.createGain();
    r.buffer = rauschen; b.type = typ; b.frequency.value = freq; b.Q.value = q;
    g.gain.setValueAtTime(laut, zeit); g.gain.exponentialRampToValueAtTime(.001, zeit + dauer);
    r.connect(b); b.connect(g); g.connect(ziel); r.start(zeit, start == null ? Math.random() * .5 : start, dauer + .02);
  }
  function klopfen(zeit, betont, laut) {
    const o = ctx.createOscillator(), g = ctx.createGain(), l = laut || 1;
    o.type = "triangle";
    o.frequency.setValueAtTime(betont ? 170 : 150, zeit);
    o.frequency.exponentialRampToValueAtTime(65, zeit + .08);
    g.gain.setValueAtTime((betont ? 1 : .7) * l, zeit);
    g.gain.exponentialRampToValueAtTime(.001, zeit + .16);
    o.connect(g); g.connect(spurGain.klopf); o.start(zeit); o.stop(zeit + .2);
    rauschStoss(zeit, spurGain.klopf, "bandpass", 1300, 1.5, (betont ? .35 : .22) * l, .035);
  }
  function schellen(zeit, laut) {
    const l = laut || 1;
    rauschStoss(zeit, spurGain.schelle, "highpass", 6500, .7, .32 * l, .2);
    for (let i = 0; i < 3; i++) {
      const o = ctx.createOscillator(), og = ctx.createGain(), z = zeit + i * .012;
      o.type = "sine"; o.frequency.value = 4200 + Math.random() * 3200;
      og.gain.setValueAtTime(.05 * l, z); og.gain.exponentialRampToValueAtTime(.0005, z + .09);
      o.connect(og); og.connect(spurGain.schelle); o.start(z); o.stop(z + .1);
    }
  }
  function trommeln(zeit, betont, laut) {
    const o = ctx.createOscillator(), g = ctx.createGain(), l = laut || 1;
    o.type = "sine";
    o.frequency.setValueAtTime(betont ? 105 : 92, zeit);
    o.frequency.exponentialRampToValueAtTime(46, zeit + .2);
    g.gain.setValueAtTime((betont ? 1.15 : .85) * l, zeit);
    g.gain.exponentialRampToValueAtTime(.001, zeit + .38);
    o.connect(g); g.connect(spurGain.trommel); o.start(zeit); o.stop(zeit + .4);
    rauschStoss(zeit, spurGain.trommel, "lowpass", 500, .7, .5 * l, .08);
    rauschStoss(zeit, spurGain.trommel, "bandpass", 2200, 1, .12 * l, .025);
  }
  /* ---------- Friedrichs Trommeln ---------- */
  function schlagTon(ziel, typ, f0, f1, abfall, laut, zeit, kurve) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = typ; o.frequency.setValueAtTime(f0, zeit); o.frequency.exponentialRampToValueAtTime(f1, zeit + (kurve || abfall * .5));
    g.gain.setValueAtTime(laut, zeit); g.gain.exponentialRampToValueAtTime(.001, zeit + abfall);
    o.connect(g); g.connect(ziel); o.start(zeit); o.stop(zeit + abfall + .02);
  }
  function friedrichSpielen(zeit, betont, laut) {
    const l = laut || 1, z = spurGain.trommel, art = S.band.trommel;
    if (art === "pauke") { /* tief und lang nachhallend */
      schlagTon(z, "sine", betont ? 92 : 84, betont ? 58 : 54, betont ? 1.1 : .8, (betont ? 1.2 : .9) * l, zeit, .25);
      schlagTon(z, "sine", 140, 120, .4, .25 * l, zeit);
      rauschStoss(zeit, z, "lowpass", 380, .7, .35 * l, .12);
    } else if (art === "bodhran") { /* trocken, mit Fellklatscher */
      schlagTon(z, "sine", betont ? 130 : 160, betont ? 70 : 90, .2, (betont ? 1 : .75) * l, zeit, .08);
      rauschStoss(zeit, z, "bandpass", betont ? 700 : 1100, 1.2, .3 * l, .04);
    } else if (art === "tamburin") { /* Fell plus Schellen */
      schlagTon(z, "triangle", 260, 160, .09, .45 * l, zeit);
      rauschStoss(zeit, z, "highpass", 7000, .7, (betont ? .4 : .3) * l, .18);
      for (let i = 0; i < 4; i++) {
        const o = ctx.createOscillator(), g = ctx.createGain(), t0 = zeit + i * .009;
        o.type = "sine"; o.frequency.value = 5200 + Math.random() * 2600;
        g.gain.setValueAtTime(.045 * l, t0); g.gain.exponentialRampToValueAtTime(.0005, t0 + .14);
        o.connect(g); g.connect(z); o.start(t0); o.stop(t0 + .15);
      }
    } else if (art === "stoecke") { /* zwei Holzstöcke, hell und knackig */
      schlagTon(z, "sine", betont ? 2300 : 2600, betont ? 2200 : 2500, .07, .5 * l, zeit);
      rauschStoss(zeit, z, "bandpass", 3000, 2, .25 * l, .02);
    } else trommeln(zeit, betont, l);
  }

  /* ---------- Ezekiels Rhythmus: Dinge, die jeder kann ---------- */
  function ezekielSpielen(zeit, laut) {
    const l = laut || 1, z = spurGain.ketten, art = S.band.ketten;
    if (art === "ketten") { kettenRasseln(zeit, l); return; }
    if (art === "klatschen") { /* mehrere Hände, minimal versetzt */
      [0, .007, .015].forEach((d, i) => rauschStoss(zeit + d, z, "bandpass", 1100 + i * 250, 1.1, (2 - i * .4) * l, .02));
      rauschStoss(zeit + .02, z, "bandpass", 1400, .9, .8 * l, .12);
    } else if (art === "schnipsen") {
      rauschStoss(zeit, z, "bandpass", 2900, 3, 1.5 * l, .03);
      schlagTon(z, "sine", 2400, 2100, .05, .32 * l, zeit);
    } else if (art === "rassel") { /* Eier-Rassel: kurzes Schütteln */
      const r = ctx.createBufferSource(), b = ctx.createBiquadFilter(), g = ctx.createGain();
      r.buffer = rauschen; b.type = "highpass"; b.frequency.value = 5200; b.Q.value = .6;
      g.gain.setValueAtTime(0, zeit); g.gain.linearRampToValueAtTime(.45 * l, zeit + .025); g.gain.exponentialRampToValueAtTime(.001, zeit + .13);
      r.connect(b); b.connect(g); g.connect(z); r.start(zeit, Math.random() * .5, .15);
    } else if (art === "stampfen") { /* Fuß auf Holzdielen */
      schlagTon(z, "sine", 95, 45, .28, .9 * l, zeit, .12);
      rauschStoss(zeit, z, "lowpass", 320, .8, .35 * l, .09);
      rauschStoss(zeit + .004, z, "bandpass", 650, 2, .12 * l, .05);
    } else if (art === "loeffel") { /* zwei Löffel gegeneinander */
      [0, .028].forEach((d, i) => {
        schlagTon(z, "sine", i ? 2700 : 1900, i ? 2650 : 1850, .05, .42 * l, zeit + d);
        rauschStoss(zeit + d, z, "highpass", 4000, .8, .32 * l, .025);
      });
    } else { /* Krug auf den Tisch */
      schlagTon(z, "sine", 170, 90, .14, .8 * l, zeit, .06);
      rauschStoss(zeit, z, "bandpass", 520, 1.4, .35 * l, .07);
      schlagTon(z, "sine", 920, 900, .25, .05 * l, zeit);
    }
  }

  /* ---------- Echos Instrumente ---------- */
  function echoSpielen(freq, zeit, dauer, laut) {
    const l = laut || 1, art = S.band.floete, ziel = spurGain.floete;
    if (art === "floete") { floete(freq, zeit, dauer || .25, l); return; }
    if (!rendert) {
      const buf = klangCache.get("echo|" + art + "|" + freq.toFixed(2));
      if (buf) { abspielen(buf, zeit, ziel, l, Math.max(.18, dauer || .3)); return; }
      klaengeVorbereiten();
    }
    const d = Math.max(.18, dauer || .3);
    const g = ctx.createGain(), sum = ctx.createGain(), lp = ctx.createBiquadFilter(), leise = ctx.createGain();
    leise.gain.value = rendert ? 1 : .35;
    lp.type = "lowpass"; sum.connect(lp); lp.connect(g); g.connect(leise); leise.connect(ziel);
    let oscs = [], ende;
    if (art === "panfloete") { /* viel Luft, leicht von unten angeblasen */
      const o = ctx.createOscillator(); o.type = "sine"; oscs = [o];
      o.frequency.setValueAtTime(freq * .985, zeit); o.frequency.linearRampToValueAtTime(freq, zeit + .07);
      o.connect(sum); lp.frequency.value = 3000;
      ende = huelle(g, zeit, d, .32 * l, .05, .12);
      const r = ctx.createBufferSource(), b = ctx.createBiquadFilter(), rg = ctx.createGain();
      r.buffer = rauschen; r.loop = true; b.type = "bandpass"; b.frequency.value = freq; b.Q.value = 6;
      rg.gain.setValueAtTime(0, zeit); rg.gain.linearRampToValueAtTime(.5 * l, zeit + .03); rg.gain.linearRampToValueAtTime(.18 * l, zeit + .2); rg.gain.linearRampToValueAtTime(0, ende);
      r.connect(b); b.connect(rg); rg.connect(g); r.start(zeit); r.stop(ende);
      rauschStoss(zeit, ziel, "bandpass", freq * 2, 2, .08 * l, .08);
    } else if (art === "okarina") { /* rund und weich */
      const o = ctx.createOscillator(), o3 = ctx.createOscillator(), g3 = ctx.createGain(); o.type = "sine"; o3.type = "sine";
      o.frequency.value = freq; o3.frequency.value = freq * 3; g3.gain.value = .05; oscs = [o, o3];
      o.connect(sum); o3.connect(g3); g3.connect(sum); lp.frequency.value = 2200;
      ende = huelle(g, zeit, d, .34 * l, .06, .14);
      vibrato(oscs, zeit, ende, 4.8, freq * .005, .3);
    } else if (art === "gesang") { /* Echo summt und singt – eine Oktave tiefer */
      const o = ctx.createOscillator(), o2 = ctx.createOscillator(); o.type = "sawtooth"; o2.type = "sawtooth";
      o.frequency.value = freq / 2; o2.frequency.value = freq / 2 * 1.003; oscs = [o, o2];
      const roh = ctx.createGain(); roh.gain.value = .35; o.connect(roh); o2.connect(roh);
      formant(roh, sum, [[600, 6, 1.4], [1000, 7, .9], [2500, 8, .35]]); /* „oh“ */
      lp.frequency.value = 3200;
      ende = huelle(g, zeit, d, .4 * l, .12, .2);
      vibrato(oscs, zeit, ende, 5.4, freq / 2 * .012, .35);
      rauschStoss(zeit, ziel, "bandpass", 1800, 1, .03 * l, .1);
    } else { /* Hirtenhorn: blechern, von unten angeschliffen */
      const o = ctx.createOscillator(); o.type = "sawtooth"; oscs = [o];
      o.frequency.setValueAtTime(freq / 2 * .97, zeit); o.frequency.linearRampToValueAtTime(freq / 2, zeit + .06);
      o.connect(sum); lp.Q.value = 1.5;
      lp.frequency.setValueAtTime(500, zeit); lp.frequency.linearRampToValueAtTime(2200, zeit + .08); lp.frequency.linearRampToValueAtTime(1300, zeit + .4);
      ende = huelle(g, zeit, d, .32 * l, .05, .1);
      vibrato(oscs, zeit, ende, 5, freq / 2 * .004, .4);
    }
    oscs.forEach(o => { o.start(zeit); o.stop(ende); });
  }

  function floete(freq, zeit, dauer, laut) {
    const o = ctx.createOscillator(), o2 = ctx.createOscillator(), g = ctx.createGain(), f = ctx.createBiquadFilter();
    const lfo = ctx.createOscillator(), lg = ctx.createGain(), l = laut || 1, ende = zeit + Math.max(.12, dauer);
    o.type = "triangle"; o.frequency.value = freq;
    o2.type = "sine"; o2.frequency.value = freq * 2;
    lfo.frequency.value = 5.2; lg.gain.setValueAtTime(0, zeit); lg.gain.linearRampToValueAtTime(freq * .006, zeit + .25);
    lfo.connect(lg); lg.connect(o.frequency); lg.connect(o2.frequency);
    const g2 = ctx.createGain(); g2.gain.value = .18; o2.connect(g2); g2.connect(f);
    f.type = "lowpass"; f.frequency.value = 2600;
    g.gain.setValueAtTime(0, zeit); g.gain.linearRampToValueAtTime(.32 * l, zeit + .05);
    g.gain.setValueAtTime(.28 * l, ende - .06); g.gain.linearRampToValueAtTime(0, ende + .08);
    o.connect(f); f.connect(g); g.connect(spurGain.floete);
    [o, o2, lfo].forEach(x => { x.start(zeit); x.stop(ende + .1); });
    rauschStoss(zeit, spurGain.floete, "bandpass", freq * 1.5, 3, .07 * l, .09);
  }
  /* ---------- Barradins Melodie-Instrumente ---------- */
  function huelle(g, zeit, dauer, spitze, anstieg, abfall) {
    const ende = zeit + Math.max(.1, dauer);
    g.gain.setValueAtTime(0, zeit);
    g.gain.linearRampToValueAtTime(spitze, zeit + anstieg);
    g.gain.setValueAtTime(spitze * .85, Math.max(zeit + anstieg + .01, ende - .03));
    g.gain.linearRampToValueAtTime(0, ende + abfall);
    return ende + abfall + .05;
  }
  function vibrato(ziel, zeit, ende, freq, tiefe, verz) {
    const lfo = ctx.createOscillator(), lg = ctx.createGain();
    lfo.frequency.value = freq;
    lg.gain.setValueAtTime(0, zeit); lg.gain.linearRampToValueAtTime(tiefe, zeit + verz);
    lfo.connect(lg); ziel.forEach(o => lg.connect(o.frequency)); lfo.start(zeit); lfo.stop(ende);
  }
  function formant(eingang, ausgang, liste) {
    liste.forEach(([fr, q, verst]) => {
      const b = ctx.createBiquadFilter(), g = ctx.createGain();
      b.type = "bandpass"; b.frequency.value = fr; b.Q.value = q; g.gain.value = verst;
      eingang.connect(b); b.connect(g); g.connect(ausgang);
    });
  }
  function melodieSpielen(freq, zeit, dauer, laut) {
    const l = laut || 1, ziel = spurGain.melodie, art = S.instrument;
    if (art === "laute" || art === "harfe") { zupf(freq, zeit, art === "harfe" ? "harfe" : "mel", l); return; }
    if (art === "mandoline") { /* Tremolo: schnell wiederholt angeschlagen */
      const n = Math.max(1, Math.min(6, Math.round(Math.max(.12, dauer || .2) / .08)));
      for (let k = 0; k < n; k++) zupf(freq, zeit + k * .08, "mandoline", l * (k ? .7 : 1));
      return;
    }
    if (!rendert) {
      const buf = klangCache.get(art + "|" + freq.toFixed(2));
      if (buf) {
        const g = abspielen(buf, zeit, ziel, l, art === "glocken" ? 0 : Math.max(.18, dauer || .3));
        if (art === "illusion" && illusionEcho) g.connect(illusionEcho);
        return;
      }
      klaengeVorbereiten();
    }
    if (art === "glocken") {
      [[1, .5, 1.4], [2.76, .18, .5], [5.4, .08, .25], [8.93, .04, .12]].forEach(([v, a, d]) => {
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.type = "sine"; o.frequency.value = freq * 2 * v;
        g.gain.setValueAtTime(a * l * .55, zeit); g.gain.exponentialRampToValueAtTime(.0005, zeit + d);
        o.connect(g); g.connect(ziel); o.start(zeit); o.stop(zeit + d + .05);
      });
      return;
    }
    const d = Math.max(.18, dauer || .3);
    const g = ctx.createGain(), sum = ctx.createGain(), lp = ctx.createBiquadFilter(), leise = ctx.createGain();
    leise.gain.value = rendert ? 1 : .35;
    lp.type = "lowpass"; sum.connect(lp); lp.connect(g); g.connect(leise); leise.connect(ziel);
    let oscs = [], ende;
    if (art === "fidel") { /* gestrichen: Sägezahn mit Korpus-Resonanzen und Vibrato */
      const o = ctx.createOscillator(); o.type = "sawtooth"; o.frequency.value = freq; oscs = [o];
      const roh = ctx.createGain(); roh.gain.value = .5; o.connect(roh);
      formant(roh, sum, [[280, 1.2, 1.1], [520, 1.5, 1.2], [1400, 2, .9], [3000, 2.5, .5]]);
      lp.frequency.value = 3200;
      ende = huelle(g, zeit, d, .42 * l, .09, .16);
      vibrato(oscs, zeit, ende, 5.6, freq * .007, .25);
      rauschStoss(zeit, ziel, "bandpass", 2400, 2, .05 * l, .12);
    } else if (art === "drehleier") { /* Rad-gestrichen, leicht schnarrend */
      const o = ctx.createOscillator(), o2 = ctx.createOscillator(); o.type = "sawtooth"; o2.type = "sawtooth";
      o.frequency.value = freq; o2.frequency.value = freq * 1.004; oscs = [o, o2];
      const roh = ctx.createGain(); roh.gain.value = .32; o.connect(roh); o2.connect(roh);
      const schnarr = ctx.createGain(), tr = ctx.createOscillator(), tg = ctx.createGain();
      tr.type = "sine"; tr.frequency.value = 28; tg.gain.value = .18; schnarr.gain.value = .65;
      tr.connect(tg); tg.connect(schnarr.gain); roh.connect(schnarr);
      formant(schnarr, sum, [[700, 1.4, 1], [1250, 3, 1.3], [2600, 3, .6]]);
      lp.frequency.value = 2600;
      ende = huelle(g, zeit, d, .4 * l, .04, .1);
      tr.start(zeit); tr.stop(ende);
    } else if (art === "schalmei") { /* Doppelrohrblatt: näselnd und kräftig */
      const o = ctx.createOscillator(), o2 = ctx.createOscillator(); o.type = "square"; o2.type = "sawtooth";
      o.frequency.value = freq; o2.frequency.value = freq; oscs = [o, o2];
      const roh = ctx.createGain(); roh.gain.value = .28; o.connect(roh); o2.connect(roh);
      formant(roh, sum, [[1100, 3, 1.1], [2400, 3, .5]]);
      lp.frequency.value = 2600;
      ende = huelle(g, zeit, d, .36 * l, .025, .06);
      vibrato(oscs, zeit, ende, 6.2, freq * .004, .15);
    } else if (art === "dudelsack") { /* Spielpfeife mit kleinem Vorschlag */
      const o = ctx.createOscillator(); o.type = "sawtooth"; oscs = [o];
      o.frequency.setValueAtTime(freq * 1.335, zeit); o.frequency.setValueAtTime(freq, zeit + .035);
      const roh = ctx.createGain(); roh.gain.value = .45; o.connect(roh);
      formant(roh, sum, [[900, 2.5, 1.1], [1900, 3, .7], [3300, 3, .25]]);
      lp.frequency.value = 3000;
      ende = huelle(g, zeit, d, .38 * l, .012, .03);
    } else { /* Flöte der Illusionen: weich, schimmernd und mit Echo */
      const o = ctx.createOscillator(), o2 = ctx.createOscillator(); o.type = "sine"; o2.type = "triangle";
      o.frequency.value = freq * 2; o2.frequency.value = freq * 2.003; oscs = [o, o2];
      o.connect(sum); const g2 = ctx.createGain(); g2.gain.value = .35; o2.connect(g2); g2.connect(sum);
      lp.frequency.value = 3200;
      ende = huelle(g, zeit, d, .3 * l, .07, .25);
      vibrato(oscs, zeit, ende, 4.6, freq * .012, .2);
      if (illusionEcho) g.connect(illusionEcho);
      rauschStoss(zeit, ziel, "bandpass", freq * 3, 3, .05 * l, .12);
    }
    oscs.forEach(o => { o.start(zeit); o.stop(ende); });
  }

  /* Ketten: schwere Eisenglieder – tiefe, inharmonische Teiltöne, dumpfer Anschlag */
  function kettenGlied(zeit, grund, laut) {
    [[1, 1, .22], [2.32, .6, .16], [4.25, .32, .1], [6.63, .14, .06]].forEach(([v, a, d]) => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = "sine"; o.frequency.value = grund * v * (1 + (Math.random() - .5) * .03);
      g.gain.setValueAtTime(a * laut, zeit); g.gain.exponentialRampToValueAtTime(.0004, zeit + d * (1 + Math.random() * .5));
      o.connect(g); g.connect(spurGain.ketten); o.start(zeit); o.stop(zeit + d * 1.6 + .02);
    });
    rauschStoss(zeit, spurGain.ketten, "bandpass", 1800, 1.2, .2 * laut, .02);
  }
  function kettenRasseln(zeit, laut) {
    const v = klangCache.get("kette" + Math.floor(Math.random() * 4)) || klangCache.get("kette0");
    if (v) abspielen(v, zeit, spurGain.ketten, laut || 1, 0); else { kettenRasselnLive(zeit, laut); klaengeVorbereiten(); }
  }
  function kettenRasselnLive(zeit, laut) {
    const l = laut || 1, n = 4 + Math.floor(Math.random() * 3);
    let z = zeit;
    for (let i = 0; i < n; i++) {
      kettenGlied(z, 320 + Math.random() * 380, (.2 - i * .02) * l);
      z += .035 + Math.random() * .05;
    }
    /* dumpfes Aufschlagen und Schleifen der schweren Glieder */
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = "sine"; o.frequency.setValueAtTime(140, zeit); o.frequency.exponentialRampToValueAtTime(70, zeit + .15);
    g.gain.setValueAtTime(.5 * l, zeit); g.gain.exponentialRampToValueAtTime(.001, zeit + .2);
    o.connect(g); g.connect(spurGain.ketten); o.start(zeit); o.stop(zeit + .22);
    rauschStoss(zeit, spurGain.ketten, "bandpass", 450, 1, .16 * l, .3);
  }

  /* Rex: Bellen mit Kehl-Formanten, langgezogenes Heulen, tiefes Knurren */
  function rexLaut(zeit, art, laut) {
    const b = klangCache.get("rex" + art);
    if (b) abspielen(b, zeit, spurGain.rex, laut || 1, 0); else { rexLautLive(zeit, art, laut); klaengeVorbereiten(); }
  }
  function rexLautLive(zeit, art, laut) {
    const l = laut || 1, ziel = spurGain.rex;
    if (art === 1) { /* Auuuuu! */
      const o = ctx.createOscillator(), o2 = ctx.createOscillator(), sum = ctx.createGain(), g = ctx.createGain(), lp = ctx.createBiquadFilter();
      o.type = "triangle"; o2.type = "sine";
      [o, o2].forEach((x, k) => {
        const m = k ? 2 : 1;
        x.frequency.setValueAtTime(420 * m, zeit); x.frequency.linearRampToValueAtTime(690 * m, zeit + .4);
        x.frequency.linearRampToValueAtTime(660 * m, zeit + 1.05); x.frequency.linearRampToValueAtTime(470 * m, zeit + 1.5);
      });
      const g2 = ctx.createGain(); g2.gain.value = .3; o2.connect(g2); g2.connect(sum); o.connect(sum);
      lp.type = "lowpass"; lp.frequency.setValueAtTime(900, zeit); lp.frequency.linearRampToValueAtTime(1600, zeit + .5); lp.frequency.linearRampToValueAtTime(800, zeit + 1.5);
      sum.connect(lp); lp.connect(g); g.connect(ziel);
      g.gain.setValueAtTime(0, zeit); g.gain.linearRampToValueAtTime(.42 * l, zeit + .25); g.gain.setValueAtTime(.38 * l, zeit + 1.15); g.gain.linearRampToValueAtTime(0, zeit + 1.55);
      vibrato([o, o2], zeit, zeit + 1.6, 5.2, 7, .5);
      [o, o2].forEach(x => { x.start(zeit); x.stop(zeit + 1.6); });
      rauschStoss(zeit, ziel, "bandpass", 1200, 1, .04 * l, 1.4, 0);
      return;
    }
    if (art === 2) { /* Grrrr … */
      const o = ctx.createOscillator(), g = ctx.createGain(), lp = ctx.createBiquadFilter(), am = ctx.createOscillator(), ag = ctx.createGain(), roh = ctx.createGain();
      o.type = "sawtooth"; o.frequency.setValueAtTime(115, zeit); o.frequency.linearRampToValueAtTime(128, zeit + .3); o.frequency.linearRampToValueAtTime(108, zeit + .7);
      am.type = "sine"; am.frequency.value = 31; ag.gain.value = .5; roh.gain.value = .55;
      am.connect(ag); ag.connect(roh.gain); o.connect(roh);
      lp.type = "lowpass"; lp.frequency.value = 850; lp.Q.value = 2;
      roh.connect(lp); formant(roh, lp, [[480, 3, .8]]); lp.connect(g); g.connect(ziel);
      g.gain.setValueAtTime(0, zeit); g.gain.linearRampToValueAtTime(.7 * l, zeit + .08); g.gain.setValueAtTime(.65 * l, zeit + .55); g.gain.linearRampToValueAtTime(0, zeit + .75);
      [o, am].forEach(x => { x.start(zeit); x.stop(zeit + .8); });
      rauschStoss(zeit, ziel, "bandpass", 400, 1.5, .12 * l, .7, 0);
      return;
    }
    /* Wuff! – kurzer, kehliger Beller */
    const o = ctx.createOscillator(), o2 = ctx.createOscillator(), roh = ctx.createGain(), g = ctx.createGain();
    o.type = "sawtooth"; o2.type = "square";
    o.frequency.setValueAtTime(330, zeit); o.frequency.linearRampToValueAtTime(410, zeit + .025); o.frequency.exponentialRampToValueAtTime(190, zeit + .14);
    o2.frequency.setValueAtTime(165, zeit); o2.frequency.exponentialRampToValueAtTime(95, zeit + .14);
    const g2 = ctx.createGain(); g2.gain.value = .35; o2.connect(g2); g2.connect(roh); o.connect(roh); roh.gain.value = .7;
    formant(roh, g, [[650, 2.2, 1.4], [1250, 3, 1], [2600, 3, .35]]);
    g.connect(ziel);
    g.gain.setValueAtTime(0, zeit); g.gain.linearRampToValueAtTime(.75 * l, zeit + .012); g.gain.setValueAtTime(.6 * l, zeit + .06); g.gain.exponentialRampToValueAtTime(.001, zeit + .19);
    [o, o2].forEach(x => { x.start(zeit); x.stop(zeit + .21); });
    rauschStoss(zeit, ziel, "bandpass", 1500, 1.2, .3 * l, .05, 0);
  }
  let bordunTeile = null;
  function bordunAn() {
    if (!ctx || bordunTeile || !S.bordun) return;
    const f = ctx.createBiquadFilter(), g = ctx.createGain();
    f.type = "lowpass"; f.frequency.value = 650; f.Q.value = .5;
    g.gain.setValueAtTime(0, ctx.currentTime); g.gain.linearRampToValueAtTime(.05, ctx.currentTime + .8);
    const oscs = [0, 7].map(() => { const o = ctx.createOscillator(); o.type = "sawtooth"; o.connect(f); o.start(); return o; });
    f.connect(g); g.connect(master);
    bordunTeile = { oscs, g };
    bordunStimmen();
  }
  function bordunStimmen() {
    if (!bordunTeile) return;
    [0, 7].forEach((iv, i) => bordunTeile.oscs[i].frequency.setTargetAtTime(midiHz(BASS_GRUND - 12 + S.transpose + iv), ctx.currentTime, .05));
  }
  function bordunAus() {
    if (!bordunTeile) return;
    const { oscs, g } = bordunTeile, jetzt = ctx.currentTime;
    g.gain.cancelScheduledValues(jetzt); g.gain.setValueAtTime(g.gain.value, jetzt); g.gain.linearRampToValueAtTime(0, jetzt + .4);
    oscs.forEach(o => o.stop(jetzt + .45));
    bordunTeile = null;
  }
  function spielen(spur, zeile, zeit, schritt, laut, dauer) {
    const betont = schritt % 4 === 0;
    if (spur === "klopf") klopfen(zeit, betont, laut);
    else if (spur === "schelle") schellen(zeit, laut);
    else if (spur === "trommel") friedrichSpielen(zeit, betont, laut);
    else if (spur === "ketten") ezekielSpielen(zeit, laut);
    else if (spur === "rex") rexLaut(zeit, zeile, laut);
    else if (spur === "floete") echoSpielen(midiHz(tonMidi("floete", zeile, S)), zeit, dauer || .25, laut);
    else if (spur === "melodie") melodieSpielen(midiHz(tonMidi("melodie", zeile, S)), zeit, dauer, laut);
    else zupf(midiHz(tonMidi(spur, zeile, S)), zeit, "bass", laut);
  }

  /* ---------- Variation: die Band improvisiert beim Spielen ---------- */
  function variiert(spur, wert, i, daten, v, letzterTakt) {
    if (v <= 0) return wert;
    const sp = SPUR[spur];
    const r = Math.random();
    if (sp.art === "an") {
      if (spur === "rex") return wert;
      if (wert >= 0) return i % 4 !== 0 && r < v * .15 ? -1 : wert;
      if (spur === "trommel" && letzterTakt && i >= 12 && r < v * .7) return 0; /* Trommelwirbel am Ende */
      if (r < v * (spur === "ketten" ? .05 : .12) && i % 2 === 0) return 0;
      return -1;
    }
    if (spur === "rex") return wert >= 0 ? wert : (r < v * .012 ? 0 : -1);
    const max = sp.zeilen - 1;
    if (wert >= 0) {
      if (i !== 0 && r < v * .12) return -1;
      if (r < v * .4) return Math.max(0, Math.min(max, wert + (Math.random() < .5 ? -1 : 1) * (spur === "bass" ? 3 : 1)));
      return wert;
    }
    if ((spur === "melodie" || spur === "floete") && r < v * .25) {
      const vor = daten[(i + SCHRITTE - 1) % SCHRITTE], nach = daten[(i + 1) % SCHRITTE];
      if (vor >= 0 && nach >= 0) return Math.round((vor + nach) / 2);
      if (vor >= 0) return Math.max(0, Math.min(max, vor + (Math.random() < .5 ? -1 : 1)));
    }
    return -1;
  }
  function notenLaenge(daten, i) {
    let n = 1;
    while (n < 4 && daten[(i + n) % SCHRITTE] < 0) n++;
    return n;
  }

  /* ---------- Taktgeber ---------- */
  let laeuft = false, schritt = 0, abschnitt = 0, naechste = 0, timer = null;
  const anzeige = [];
  const schrittDauer = () => 60 / S.tempo / 4;
  function planen() {
    const vorlauf = document.hidden ? 1.6 : .3; /* im Hintergrund weit vorausplanen, damit die Musik weiterläuft */
    while (naechste < ctx.currentTime + vorlauf) {
      const teilName = S.ablauf[abschnitt % S.ablauf.length] || "A", daten = S.teile[teilName];
      const v = S.variation / 10, letzterTakt = abschnitt % S.ablauf.length === S.ablauf.length - 1;
      const versatz = S.swing && schritt % 2 === 1 ? schrittDauer() * .33 : 0;
      const ev = { schritt, teil: teilName, zeit: naechste + versatz, spuren: {} };
      IDS.forEach(k => {
        if (S.mute[k]) return;
        const wert = variiert(k, daten[k][schritt], schritt, daten[k], v, letzterTakt);
        if (wert < 0) return;
        const wackel = v ? (Math.random() - .5) * .012 * v : 0;
        const laut = v ? 1 - Math.random() * .25 * v : 1;
        const haelt = k === "floete" || (k === "melodie" && (GEHALTEN[S.instrument] || S.instrument === "mandoline"));
        spielen(k, wert, ev.zeit + Math.max(0, wackel), schritt, laut, haelt ? notenLaenge(daten[k], schritt) * schrittDauer() * .95 : 0);
        ev.spuren[k] = wert;
      });
      anzeige.push(ev);
      naechste += schrittDauer();
      schritt = (schritt + 1) % SCHRITTE;
      if (schritt === 0) abschnitt = (abschnitt + 1) % S.ablauf.length;
    }
  }
  function start() {
    audioStart();
    saitenVorbereiten();
    laeuft = true; schritt = 0; abschnitt = 0; naechste = ctx.currentTime + .1; anzeige.length = 0;
    planen(); timer = setInterval(planen, 30);
    bordunAn();
    requestAnimationFrame(malen);
    knoepfe();
  }
  function stopp() {
    laeuft = false; clearInterval(timer); bordunAus();
    spalte(-1); teilAnzeige(null); knoepfe();
  }

  /* ---------- Anzeige im Takt ---------- */
  let spalten = [], aktiv = -1;
  function spalte(i) {
    if (aktiv >= 0 && spalten[aktiv]) spalten[aktiv].forEach(z => z.classList.remove("jetzt"));
    aktiv = i;
    if (i >= 0 && spalten[i]) spalten[i].forEach(z => z.classList.add("jetzt"));
  }
  function teilAnzeige(teilName) {
    root.querySelectorAll("[data-teil]").forEach(b => b.classList.toggle("spielt", b.dataset.teil === teilName));
  }
  const buehne = () => root.querySelector(".lw-buehne");
  /* Bewegungen der Band über die Web-Animations-Schnittstelle (ruckelt nicht) */
  const BEWEGUNG = {
    klopf: [[".barradin .kopf", "rotate(6deg) translateY(2px)", 280], [".barradin .arm-schlag", "rotate(-9deg) translate(2px, 4px)", 180], [".barradin .laute", "rotate(-1.5deg)", 200]],
    schelle: [[".barradin .fuss", "rotate(-8deg)", 200]],
    bass: [[".barradin .arm-schlag", "rotate(5deg)", 220]],
    mel: [[".barradin .hand-griff", "translate(-6px, 4px) scale(1.15)", 250]],
    trommel: [[".friedrich .f-arm", "rotate(14deg)", 200], [".friedrich .f-kopf", "rotate(6deg) translateY(2px)", 280]],
    floete: [[".echo .e-koerper", "rotate(-2.5deg)", 500]],
    ketten: [[".ezekiel .kette", "rotate(9deg)", 300], [".ezekiel .z-kopf", "rotate(6deg) translateY(2px)", 300]],
    wuff: [[".rex .r-kopf", "rotate(-14deg) translateY(-2px)", 250]],
    heul: [[".rex .r-kopf", "rotate(-32deg) translate(-2px, -3px)", 1300]]
  };
  const LEUCHTEN = { mel: ".barradin .saiten", bass: ".barradin .saiten", trommel: ".friedrich .trommelfell", schelle: ".barradin .schellring", ketten: ".ezekiel .augen" };
  let figurCache = {};
  const figur = sel => figurCache[sel] || (figurCache[sel] = root.querySelector(".lw-buehne " + sel));
  function zucken(art) {
    if (ruhig) return;
    (BEWEGUNG[art] || []).forEach(([sel, ziel, dauer]) => {
      const el = figur(sel); if (!el || !el.animate) return;
      el.animate(art === "heul"
        ? [{ transform: "none" }, { transform: ziel, offset: .15 }, { transform: ziel, offset: .8 }, { transform: "none" }]
        : [{ transform: "none" }, { transform: ziel, offset: .4 }, { transform: "none" }], { duration: dauer, easing: "ease-out" });
    });
    const l = LEUCHTEN[art] && figur(LEUCHTEN[art]);
    if (l && l.animate) l.animate([{ filter: "drop-shadow(0 0 4px #ffd27a) brightness(1.6)" }, { filter: "none" }], { duration: 300 });
  }
  /* Positionen auf der Bühne (in Prozent der Breite) */
  const ORT = { laute: 44, bass: 38, floete: 70, trommel: 14, ketten: 88, rex: 66 };
  function schweben(text, ort, klasse, hoehe) {
    const b = buehne(); if (!b || ruhig) return;
    const n = document.createElement("span");
    n.className = "lw-note " + (klasse || "");
    n.textContent = text;
    n.style.left = ort + Math.random() * 6 - 3 + "%";
    if (hoehe != null) n.style.bottom = hoehe + "%";
    n.style.setProperty("--dx", (Math.random() * 30 - 10) + "px");
    b.appendChild(n);
    setTimeout(() => n.remove(), 1700);
  }
  function malen() {
    if (!laeuft) return;
    const jetzt = ctx.currentTime;
    while (anzeige.length && anzeige[0].zeit <= jetzt) {
      const ev = anzeige.shift(), sp = ev.spuren;
      teilAnzeige(ev.teil);
      spalte(ev.teil === bearbeite ? ev.schritt : -1);
      if ("klopf" in sp) zucken("klopf");
      if ("schelle" in sp) zucken("schelle");
      if ("bass" in sp) { zucken("bass"); if (Math.random() < .4) schweben("♩", ORT.bass, "tief"); }
      if ("melodie" in sp) { zucken("mel"); schweben(Math.random() < .5 ? "♪" : "♫", ORT.laute); }
      if ("trommel" in sp) zucken("trommel");
      if ("floete" in sp) { zucken("floete"); if (Math.random() < .7) schweben("♪", ORT.floete, "floete", 62); }
      if ("ketten" in sp) zucken("ketten");
      if ("rex" in sp) { zucken(sp.rex === 1 ? "heul" : "wuff"); schweben(t().rexLaut[sp.rex], ORT.rex, "blase", 36); }
    }
    requestAnimationFrame(malen);
  }

  /* ---------- Die Band ---------- */
  const BUEHNE = `
<svg class="lw-figur" viewBox="0 0 660 210" aria-hidden="true">
 <!-- Friedrich mit Trommel -->
 <svg x="0" y="10" width="130" height="200" viewBox="0 0 130 200" class="friedrich" overflow="visible">
  <ellipse cx="66" cy="192" rx="52" ry="5" fill="rgba(0,0,0,.45)"/>
  <path d="M48 150 L46 189 M62 150 L64 189" stroke="#3b3326" stroke-width="10" stroke-linecap="round"/>
  <path d="M38 190 h14 M58 190 h14" stroke="#2a1d14" stroke-width="6" stroke-linecap="round"/>
  <path d="M40 104 Q46 124 68 128" fill="none" stroke="#344b29" stroke-width="8" stroke-linecap="round"/>
  <path d="M34 152 Q30 120 38 98 Q50 88 66 92 Q76 110 72 152 Z" fill="#3f5a32" stroke="#6f8a5a" stroke-width="1.5"/>
  <path d="M36 128 H72" stroke="#6b4423" stroke-width="3"/>
  <path d="M47 84 h10 v10 h-10 Z" fill="#c48c66"/>
  <g class="f-kopf">
   <circle cx="52" cy="74" r="13" fill="#d9a07a"/>
   <path d="M38 74 Q36 56 52 56 Q68 56 66 72 Q60 64 52 64 Q44 64 40 76 Z" fill="#6b4423"/>
   <path d="M43 80 Q52 92 62 80 Q60 88 52 90 Q44 88 43 80 Z" fill="#6b4423"/>
   <circle cx="56" cy="73" r="1.4" fill="#2a1a10"/>
  </g>
  <path d="M83 150 L74 192 M97 150 L97 192 M111 150 L120 192" stroke="#5a3a20" stroke-width="2.5"/>
  <path d="M71 138 L71 150 Q97 160 123 150 L123 138 Q97 146 71 138 Z" fill="#8a5a32" stroke="#3a2412" stroke-width="1"/>
  <ellipse class="trommelfell" cx="97" cy="138" rx="26" ry="8" fill="#e8d9b5" stroke="#8a5a32" stroke-width="1.5"/>
  <circle cx="68" cy="129" r="5" fill="#d9a07a"/><path d="M68 129 L82 139" stroke="#d8c49a" stroke-width="2.5" stroke-linecap="round"/>
  <g class="f-arm"><path d="M64 100 Q84 110 90 124" fill="none" stroke="#3f5a32" stroke-width="9" stroke-linecap="round"/>
   <circle cx="91" cy="126" r="5" fill="#d9a07a"/><path d="M91 126 L104 136" stroke="#d8c49a" stroke-width="2.5" stroke-linecap="round"/></g>
 </svg>
 <!-- Barradin -->
 <svg x="95" y="10" width="280" height="200" viewBox="0 0 280 200" class="barradin" overflow="visible">
  <ellipse cx="125" cy="192" rx="80" ry="6" fill="rgba(0,0,0,.45)"/>
  <g class="fass"><path d="M78 150 Q74 172 80 194 L132 194 Q138 172 134 150 Z" fill="#3a2a1c" stroke="#8a6a44" stroke-width="2"/>
   <path d="M77 162 H135 M77 182 H135" stroke="#6b5130" stroke-width="3"/></g>
  <path d="M104 150 Q130 146 150 152 L156 186" fill="none" stroke="#2a2230" stroke-width="13" stroke-linecap="round" stroke-linejoin="round"/>
  <g class="fuss"><path d="M126 154 Q150 156 166 160 L170 188" fill="none" stroke="#231c29" stroke-width="13" stroke-linecap="round" stroke-linejoin="round"/>
   <path d="M162 186 Q172 183 186 190 L186 194 L160 194 Z" fill="#1b1512" stroke="#8a6a44" stroke-width="1.5"/>
   <g class="schellring"><circle cx="164" cy="181" r="2.4" fill="#e0a046"/><circle cx="170" cy="182" r="2.4" fill="#e0a046"/><circle cx="176" cy="181" r="2.4" fill="#e0a046"/></g></g>
  <path d="M150 186 Q160 183 172 190 L172 194 L146 194 Z" fill="#1b1512" stroke="#8a6a44" stroke-width="1.5"/>
  <g class="koerper">
   <path d="M96 150 Q92 118 100 96 Q110 84 126 88 Q136 104 132 150 Z" fill="#1d1820" stroke="#e0a046" stroke-width="1.6"/>
   <path d="M112 92 L114 148" stroke="#e0a046" stroke-width="1.2" stroke-dasharray="3 4"/>
   <path class="arm-griff" d="M122 96 Q160 92 196 84" fill="none" stroke="#1d1820" stroke-width="10" stroke-linecap="round"/>
   <path d="M108 74 L109 92 L121 92 L121 74 Z" fill="#b8865f"/>
   <path d="M100 96 Q112 86 128 92" fill="none" stroke="#e0a046" stroke-width="2.4" stroke-linecap="round"/>
   <g class="kopf"><g transform="translate(0 6)">
    <path d="M100 70 Q96 50 112 44 Q128 40 132 56 Q134 70 124 76 Q110 80 100 70 Z" fill="#c99872"/>
    <path d="M103 60 L90 50 L104 66 Z" fill="#c99872" stroke="#9a7254" stroke-width="1"/>
    <path d="M98 58 Q92 36 112 32 Q134 28 138 48 Q142 40 136 34 Q146 44 134 58 Q130 46 120 46 Q112 46 106 56 Q104 50 98 58 Z" fill="#7a3f1d"/>
    <path d="M119 62 q3 -2 6 0" stroke="#2a1a10" stroke-width="1.6" fill="none" stroke-linecap="round"/>
    <path d="M118 70 q6 4 11 -1" stroke="#5a2a18" stroke-width="1.6" fill="none" stroke-linecap="round"/>
    <path d="M126 72 L140 76 L142 70" fill="none" stroke="#3a2a1c" stroke-width="2.4" stroke-linecap="round"/>
   </g></g>
  </g>
  <g class="laute">
   <path d="M164 122 L232 70 L238 77 L172 130 Z" fill="#5a3a20" stroke="#2a1a10" stroke-width="1.2"/>
   <path d="M232 70 L250 74 L252 82 L238 77 Z" fill="#4a2e18" stroke="#2a1a10" stroke-width="1.2"/>
   <g fill="#e0a046"><circle cx="242" cy="72" r="1.6"/><circle cx="247" cy="74" r="1.6"/><circle cx="244" cy="79" r="1.6"/><circle cx="249" cy="80" r="1.6"/></g>
   <ellipse cx="150" cy="140" rx="36" ry="25" transform="rotate(-38 150 140)" fill="#a8743c" stroke="#5a3a20" stroke-width="2"/>
   <circle cx="156" cy="134" r="8" fill="#2a1a10" stroke="#e0a046" stroke-width="1.2"/>
   <path class="saiten" d="M132 154 L236 74 M134 156 L238 76 M136 158 L240 78" stroke="#ebe2cc" stroke-width=".7" opacity=".85"/>
   <path d="M130 150 L138 160" stroke="#2a1a10" stroke-width="3" stroke-linecap="round"/>
  </g>
  <circle class="hand-griff" cx="200" cy="85" r="6" fill="#c99872"/>
  <g class="arm-schlag"><path d="M118 98 Q106 126 132 140" fill="none" stroke="#231c29" stroke-width="11" stroke-linecap="round"/>
   <path d="M118 98 Q106 126 132 140" fill="none" stroke="#e0a046" stroke-width="1" stroke-dasharray="2 5"/>
   <circle cx="136" cy="142" r="6.5" fill="#c99872"/></g>
  <circle class="rauchwolke" cx="146" cy="68" r="5" fill="rgba(220,215,230,.25)"/>
 </svg>
 <!-- Echo mit Flöte -->
 <svg x="360" y="10" width="110" height="200" viewBox="0 0 110 200" class="echo" overflow="visible">
  <ellipse cx="54" cy="192" rx="42" ry="5" fill="rgba(0,0,0,.45)"/>
  <g class="e-koerper">
   <path d="M44 66 Q34 92 40 124 L48 84 Z M64 66 Q72 92 66 120 L60 84 Z" fill="#e9e6dc"/>
   <path d="M38 98 Q30 140 22 192 L86 192 Q78 140 70 98 Q54 90 38 98 Z" fill="#cfcabb" stroke="#8a8676" stroke-width="1.2"/>
   <path d="M40 120 Q54 128 68 118" fill="none" stroke="#6f8a5a" stroke-width="4"/>
   <path d="M30 170 Q54 178 80 168" fill="none" stroke="#8a8676" stroke-width="1" stroke-dasharray="3 4"/>
   <g class="e-kopf">
    <path d="M38 50 Q30 36 34 24 M34 34 Q24 30 22 22 M36 28 Q40 18 38 10 M70 50 Q78 36 74 24 M74 34 Q84 30 86 22 M72 28 Q68 18 70 10" fill="none" stroke="#8a6a44" stroke-width="3.4" stroke-linecap="round"/>
    <circle cx="54" cy="70" r="12.5" fill="#cbb9a6"/>
    <path d="M41 66 Q42 52 54 52 Q67 52 67 66 Q60 58 54 58 Q47 58 41 66 Z" fill="#f2efe6"/>
    <path d="M44 76 Q54 96 64 76 Q60 88 54 90 Q48 88 44 76 Z" fill="#f2efe6"/>
    <path d="M57 69 h4" stroke="#3a2a1c" stroke-width="1.4" stroke-linecap="round"/>
   </g>
   <path d="M60 79 L104 96" stroke="#6b4a2a" stroke-width="4" stroke-linecap="round"/>
   <g fill="#2a1a10"><circle cx="78" cy="86" r="1"/><circle cx="85" cy="89" r="1"/><circle cx="92" cy="91" r="1"/></g>
   <path d="M42 100 Q56 112 74 88" fill="none" stroke="#cfcabb" stroke-width="8" stroke-linecap="round"/>
   <path d="M66 100 Q84 104 90 92" fill="none" stroke="#bdb8a8" stroke-width="7" stroke-linecap="round"/>
   <circle cx="74" cy="87" r="4.5" fill="#cbb9a6"/><circle cx="90" cy="92" r="4.5" fill="#cbb9a6"/>
  </g>
 </svg>
 <!-- Rex -->
 <svg x="450" y="112" width="90" height="98" viewBox="0 0 90 98" class="rex" overflow="visible">
  <ellipse cx="46" cy="92" rx="30" ry="4" fill="rgba(0,0,0,.45)"/>
  <path d="M64 86 Q84 80 80 62" fill="none" stroke="#26262b" stroke-width="6" stroke-linecap="round"/>
  <path d="M30 92 Q22 62 38 48 Q56 42 64 62 Q70 80 66 92 Z" fill="#26262b"/>
  <path d="M34 56 Q44 64 42 92 L32 92 Q28 70 34 56 Z" fill="#ece6da"/>
  <path d="M36 74 L36 92 M44 74 L44 92" stroke="#ece6da" stroke-width="5" stroke-linecap="round"/>
  <g class="r-kopf">
   <path d="M40 22 L36 34 L46 32 Z M52 24 L46 34 L54 36 Z" fill="#26262b"/>
   <ellipse cx="40" cy="40" rx="14" ry="12" fill="#26262b"/>
   <path d="M36 28 Q34 40 30 46 L38 46 Q38 36 40 28 Z" fill="#ece6da"/>
   <ellipse cx="25" cy="46" rx="9" ry="6" fill="#ece6da"/>
   <circle cx="17" cy="45" r="2.8" fill="#111"/>
   <circle cx="34" cy="37" r="2" fill="#2a1a10"/><circle cx="34" cy="33" r="1.4" fill="#b8743c"/><circle cx="45" cy="36" r="1.6" fill="#b8743c"/>
   <path class="maul" d="M18 50 Q24 53 30 50" fill="none" stroke="#111" stroke-width="1.3"/>
  </g>
 </svg>
 <!-- Ezekiel mit Ketten -->
 <svg x="530" y="10" width="130" height="200" viewBox="0 0 130 200" class="ezekiel" overflow="visible">
  <ellipse cx="64" cy="192" rx="50" ry="5" fill="rgba(0,0,0,.45)"/>
  <path d="M50 150 L46 189 M78 150 L82 189" stroke="#1a0e0e" stroke-width="13" stroke-linecap="round"/>
  <path d="M36 190 h16 M76 190 h16" stroke="#3a1a14" stroke-width="7" stroke-linecap="round"/>
  <path d="M30 104 Q18 124 22 140" fill="none" stroke="#2a1414" stroke-width="10" stroke-linecap="round"/>
  <path d="M30 100 Q24 140 36 154 L94 154 Q104 140 98 100 Q64 84 30 100 Z" fill="#2a1414" stroke="#9b3a2f" stroke-width="1.6"/>
  <path d="M30 100 L22 88 L40 96 Z M98 100 L106 88 L88 96 Z" fill="#3a1a14" stroke="#9b3a2f" stroke-width="1"/>
  <path class="glut" d="M50 108 L58 120 L54 132 M76 106 L70 122 L78 136 M60 140 L66 150" fill="none" stroke="#ff5a2e" stroke-width="1.4" opacity=".75"/>
  <g class="z-kopf">
   <path d="M52 64 Q34 52 36 34 Q42 46 54 58 Z M76 64 Q94 52 92 34 Q86 46 74 58 Z" fill="#3a1a14" stroke="#9b3a2f" stroke-width="1"/>
   <circle cx="64" cy="74" r="15" fill="#1a0d0d" stroke="#9b3a2f" stroke-width="1.4"/>
   <path class="augen" d="M56 72 l6 2 M66 74 l6 -2" stroke="#ff4a2a" stroke-width="2.6" stroke-linecap="round"/>
  </g>
  <path d="M96 104 Q110 120 104 136" fill="none" stroke="#2a1414" stroke-width="10" stroke-linecap="round"/>
  <circle cx="104" cy="138" r="5.5" fill="#3a1a14"/>
  <g class="kette"><path d="M104 140 Q112 166 96 178 Q78 186 80 164 Q82 150 98 146" fill="none" stroke="#b8b0a0" stroke-width="3.2" stroke-dasharray="4.5 2.5" stroke-linecap="round"/></g>
 </svg>
</svg>`;

  /* ---------- Oberfläche ---------- */
  function zeilenName(spur, z) {
    if (spur === "rex") return t().rexZeilen[z];
    return notenName(tonMidi(spur, z, S));
  }
  function rasterZeile(spur, zeile, beschriftung, klasse) {
    const daten = S.teile[bearbeite][spur];
    let html = '<div class="lw-name ' + (klasse || "") + '">' + beschriftung + "</div>";
    for (let i = 0; i < SCHRITTE; i++) {
      const istAn = SPUR[spur].art === "an" ? daten[i] >= 0 : daten[i] === zeile;
      html += '<button type="button" class="lw-zelle s-' + spur + (S.mute[spur] ? " stumm" : "") + (i % 4 === 0 ? " takt" : "") + (istAn ? " an" : "") +
        '" data-spur="' + spur + '" data-zeile="' + zeile + '" data-s="' + i + '" aria-pressed="' + istAn + '"></button>';
    }
    return html;
  }
  function zeichnen() {
    const T = t();
    const tonarten = Array.from({ length: 12 }, (_, i) => i - 5).map(tr => '<option value="' + tr + '"' + (tr === S.transpose ? " selected" : "") + ">" + notenName(MEL_GRUND + tr) + "</option>").join("");
    const modi = MODUS_LISTE.map(m => '<option value="' + m + '"' + (m === S.modus ? " selected" : "") + ">" + T.modi[m] + "</option>").join("");
    const ablaeufe = (ABLAEUFE.includes(S.ablauf) ? ABLAEUFE : ABLAEUFE.concat([S.ablauf])).map(a => '<option value="' + a + '"' + (a === S.ablauf ? " selected" : "") + ">" + a.split("").join(" – ") + "</option>").join("");
    const naechster = TEILE[(TEILE.indexOf(bearbeite) + 1) % TEILE.length];
    const wahl = k => k === "melodie" ? { liste: INSTRUMENTE, wert: S.instrument, namen: T.instrumente }
      : BAND[k] ? { liste: BAND[k], wert: S.band[k], namen: T.band[k] } : null;
    const kopf = k => {
      const zu = !!zugeklappt[k];
      return '<div class="lw-kopf' + (S.mute[k] ? " stumm" : "") + '" data-kopf="' + k + '"><div class="lw-kopf-in">' +
        '<button type="button" class="lw-spurname" data-zu="' + k + '" aria-expanded="' + !zu + '" title="' + esc(T.zuklappen) + '">' + (zu ? "▸ " : "▾ ") +
          T.wer[SPUR[k].wer] + " <small>· " + (wahl(k) ? wahl(k).namen[wahl(k).wert] : T.spuren[k]) + "</small></button>" +
        '<button type="button" class="lw-mute" data-mute="' + k + '" aria-pressed="' + !!S.mute[k] + '" aria-label="' + esc(T.stumm + " " + T.spuren[k]) + '" title="' + esc(T.stumm) + '">' + (S.mute[k] ? "🔇" : "🔊") + "</button>" +
        '<input type="range" class="lw-fader" min="0" max="9" step="1" value="' + S.vol[k] + '" data-vol="' + k + '" aria-label="' + esc(T.lautstaerke + " " + T.spuren[k]) + '">' +
        (wahl(k) ? '<select class="lw-instrument" data-feld="instrument" data-spur="' + k + '" aria-label="' + esc(T.instrument + " " + T.wer[SPUR[k].wer]) + '">' +
          wahl(k).liste.map(n => '<option value="' + n + '"' + (n === wahl(k).wert ? " selected" : "") + ">" + esc(wahl(k).namen[n]) + "</option>").join("") + "</select>" : "") +
        "</div></div>";
    };
    let raster = "";
    SPUREN.forEach(sp => {
      raster += kopf(sp.id);
      if (zugeklappt[sp.id]) return;
      if (sp.art === "an") raster += rasterZeile(sp.id, 0, (SYMBOL[sp.id] && SYMBOL[sp.id][S.band[sp.id]]) || sp.sym, "sym");
      else for (let z = sp.zeilen - 1; z >= 0; z--) raster += rasterZeile(sp.id, z, zeilenName(sp.id, z), (z === 0 || z === 7) && sp.id !== "rex" ? "grund" : (sp.id === "rex" ? "sym klein" : ""));
    });

    root.innerHTML =
      '<p class="label">' + T.label + "</p><h3>" + T.titel + '</h3><p class="tav-info">' + T.text + "</p>" +
      '<div class="lw-buehne">' + BUEHNE + "</div>" +
      '<div class="lw-steuer">' +
        '<button type="button" class="lw-play">' + (laeuft ? T.stopp : T.spielen) + "</button>" +
        '<label class="lw-feld lw-regler"><span>' + T.tempo + ' <b class="lw-bpm">' + S.tempo + '</b></span><input type="range" min="50" max="180" step="2" value="' + S.tempo + '" data-feld="tempo"></label>' +
        '<label class="lw-feld lw-regler"><span>' + T.variation + ' <b class="lw-var">' + S.variation * 10 + ' %</b></span><input type="range" min="0" max="10" step="1" value="' + S.variation + '" data-feld="variation"></label>' +
        '<label class="lw-feld"><span>' + T.tonart + '</span><select data-feld="transpose">' + tonarten + "</select></label>" +
        '<label class="lw-feld"><span>' + T.modus + '</span><select data-feld="modus">' + modi + "</select></label>" +
        '<button type="button" class="lw-schalter" data-feld="swing" aria-pressed="' + !!S.swing + '">' + T.swing + "</button>" +
        '<button type="button" class="lw-schalter" data-feld="bordun" aria-pressed="' + !!S.bordun + '">' + T.bordun + "</button>" +
      "</div>" +
      '<div class="lw-teile">' +
        '<span class="lw-teile-label">' + T.teil + ":</span>" +
        TEILE.map(p => '<button type="button" class="lw-teil' + (teilBenutzt(p) ? "" : " leer") + '" data-teil="' + p + '" aria-pressed="' + (bearbeite === p) + '">' + p + "</button>").join("") +
        '<label class="lw-feld lw-ablauf"><span>' + T.ablauf + '</span><select data-feld="ablauf">' + ablaeufe + "</select></label>" +
        '<button type="button" class="lw-klein" data-aktion="kopieren">' + T.kopieren(bearbeite, naechster) + "</button>" +
      "</div>" +
      '<div class="lw-vorlagen"><span>' + T.lieder + ":</span>" +
        LIEDER.map(k => '<button type="button" data-vorlage="' + k + '">' + T.vorlagen[k] + "</button>").join("") +
        '<button type="button" data-vorlage="zufall">' + T.zufall + '</button><button type="button" data-vorlage="leer">' + T.leeren + "</button>" +
      "</div>" +
      '<div class="lw-vorlagen lw-stimmungen"><span>' + T.stimmungen + ":</span>" +
        STIMMUNGEN.map(k => '<button type="button" data-vorlage="' + k + '">' + T.vorlagen[k] + "</button>").join("") +
        '<p class="lw-tipp">' + T.stimmungTipp + "</p>" +
      "</div>" +
      '<div class="lw-scroll"><div class="lw-raster">' + raster + "</div></div>" +
      '<p class="lw-wisch">' + T.wischen + "</p>" +
      '<div class="lw-fuss"><button type="button" class="lw-teilen">' + T.teilen + '</button><span class="lw-status" aria-live="polite"></span></div>';

    spalten = Array.from({ length: SCHRITTE }, (_, i) => Array.from(root.querySelectorAll('.lw-zelle[data-s="' + i + '"]')));
    aktiv = -1;
    figurCache = {};
  }
  const teilBenutzt = p => IDS.some(k => S.teile[p][k].some(v => v >= 0));
  function knoepfe() {
    const b = root.querySelector(".lw-play");
    if (b) { b.textContent = laeuft ? t().stopp : t().spielen; b.classList.toggle("laeuft", laeuft); }
  }
  function status(text) {
    const s = root.querySelector(".lw-status");
    if (!s) return;
    s.textContent = text;
    clearTimeout(status.t); status.t = setTimeout(() => { s.textContent = ""; }, 3500);
  }

  /* ---------- Improvisieren ---------- */
  function zufallsMelodie(dichte, start) {
    const a = leer();
    let stufe = start;
    for (let i = 0; i < SCHRITTE; i++) {
      if ((i % 2 === 1 && Math.random() < .55) || Math.random() > dichte) continue;
      stufe = Math.max(0, Math.min(7, stufe + zufall([-2, -1, -1, 0, 1, 1, 2])));
      a[i] = stufe;
    }
    return a;
  }
  function zufallsTeil(b) {
    const p = teilLeer();
    p.klopf = an([0, 8].concat(Math.random() < .6 ? [4, 12] : [6, 14]).concat(Math.random() < .5 ? [14] : [3, 11]));
    p.schelle = an([2, 6, 10, 14].filter(() => Math.random() < .7));
    p.trommel = an([0, 8].concat(b ? [6, 12, 14] : []).filter(i => i === 0 || Math.random() < .8));
    p.ketten = Math.random() < .5 ? an([zufall([4, 7, 12])]) : leer();
    [0, 4, 8, 12].forEach(i => { if (i % 8 === 0 || Math.random() < .6) p.bass[i] = i % 8 === 0 ? (b && i === 0 ? 2 : 0) : zufall([2, 3, 3, 1]); });
    p.melodie = zufallsMelodie(b ? .55 : .8, b ? 6 : 4);
    p.melodie[14] = 1; p.melodie[15] = 0;
    if (b || Math.random() < .4) p.floete = zufallsMelodie(.35, 4);
    if (Math.random() < .3) p.rex[15] = Math.random() < .6 ? 0 : (Math.random() < .5 ? 1 : 2);
    return p;
  }
  function zufallsLied() {
    const ablauf = zufall(["AB", "AABA", "AABB", "ABAC", "AABC"]);
    return pruefen({ tempo: 80 + Math.floor(Math.random() * 25) * 2, transpose: S.transpose, modus: zufall(MODUS_LISTE), instrument: zufall(INSTRUMENTE),
      band: { trommel: zufall(BAND.trommel), floete: zufall(BAND.floete), ketten: zufall(BAND.ketten) },
      swing: Math.random() < .3 ? 1 : 0, bordun: Math.random() < .7 ? 1 : 0, variation: S.variation, ablauf,
      teile: { A: zufallsTeil(false), B: zufallsTeil(true), C: ablauf.includes("C") ? zufallsTeil(true) : teilLeer(), D: teilLeer() }, vol: S.vol, mute: S.mute });
  }

  /* ---------- Bedienung ---------- */
  function antippen(z) {
    const spur = z.dataset.spur, i = +z.dataset.s, zeile = +z.dataset.zeile, daten = S.teile[bearbeite][spur];
    if (SPUR[spur].art === "an") daten[i] = daten[i] >= 0 ? -1 : 0;
    else daten[i] = daten[i] === zeile ? -1 : zeile;
    root.querySelectorAll('.lw-zelle[data-spur="' + spur + '"][data-s="' + i + '"]').forEach(c => {
      const istAn = SPUR[spur].art === "an" ? daten[i] >= 0 : daten[i] === +c.dataset.zeile;
      c.classList.toggle("an", istAn); c.setAttribute("aria-pressed", istAn);
    });
    merken();
    if (daten[i] < 0) return;
    try { audioStart(); spielen(spur, daten[i], ctx.currentTime + .01, i, 1, .3); } catch (_) {}
  }
  function neuGezeichnet() { zeichnen(); knoepfe(); if (laeuft) { bordunAus(); bordunAn(); } }

  root.addEventListener("click", e => {
    const z = e.target.closest(".lw-zelle");
    if (z) { antippen(z); return; }
    const mu = e.target.closest("[data-mute]");
    if (mu) {
      const k = mu.dataset.mute; S.mute[k] = S.mute[k] ? 0 : 1; merken(); mixAnwenden();
      mu.setAttribute("aria-pressed", !!S.mute[k]); mu.textContent = S.mute[k] ? "🔇" : "🔊";
      root.querySelector('[data-kopf="' + k + '"]').classList.toggle("stumm", !!S.mute[k]);
      root.querySelectorAll('.lw-zelle[data-spur="' + k + '"]').forEach(c => c.classList.toggle("stumm", !!S.mute[k]));
      return;
    }
    const zu = e.target.closest("[data-zu]");
    if (zu) {
      const k = zu.dataset.zu; zugeklappt[k] = !zugeklappt[k];
      try { localStorage.setItem("imres-lautenwerk-zu", JSON.stringify(zugeklappt)); } catch (_) {}
      const y = zu.getBoundingClientRect().top;
      zeichnen(); knoepfe();
      const neu = root.querySelector('[data-zu="' + k + '"]');
      if (neu) window.scrollBy(0, neu.getBoundingClientRect().top - y);
      return;
    }
    if (e.target.closest(".lw-play")) { laeuft ? stopp() : start(); return; }
    const tl = e.target.closest(".lw-teil");
    if (tl) { bearbeite = tl.dataset.teil; zeichnen(); knoepfe(); return; }
    if (e.target.closest('[data-aktion="kopieren"]')) {
      const von = bearbeite, nach = TEILE[(TEILE.indexOf(von) + 1) % TEILE.length];
      S.teile[nach] = kopie(S.teile[von]); merken(); bearbeite = nach; zeichnen(); knoepfe(); status(t().kopiert2(von, nach)); return;
    }
    const sch = e.target.closest(".lw-schalter");
    if (sch) {
      const f = sch.dataset.feld; S[f] = S[f] ? 0 : 1; sch.setAttribute("aria-pressed", !!S[f]); merken();
      if (f === "bordun" && laeuft) { S.bordun ? bordunAn() : bordunAus(); }
      return;
    }
    const v = e.target.closest("[data-vorlage]");
    if (v) {
      const k = v.dataset.vorlage, mix = { vol: S.vol, mute: S.mute };
      if (k === "leer") S.teile = { A: teilLeer(), B: teilLeer(), C: teilLeer(), D: teilLeer() };
      else if (k === "zufall") S = zufallsLied();
      else S = pruefen(ausVorlage(k, mix));
      bearbeite = "A";
      merken(); neuGezeichnet(); saitenVorbereiten();
      return;
    }
    if (e.target.closest(".lw-teilen")) {
      const url = location.origin + location.pathname + "?lied=" + kodieren() + "#taverne";
      if (navigator.share) {
        navigator.share({ title: t().titel, url }).then(() => status(t().geteilt)).catch(() => {});
      } else if (navigator.clipboard) {
        navigator.clipboard.writeText(url).then(() => status(t().kopiert), () => window.prompt(t().teilen, url));
      } else window.prompt(t().teilen, url);
    }
  });
  root.addEventListener("input", e => {
    const d = e.target.dataset || {};
    if (d.vol) { S.vol[d.vol] = +e.target.value; merken(); mixAnwenden(); return; }
    if (d.feld === "tempo") { S.tempo = +e.target.value; root.querySelector(".lw-bpm").textContent = S.tempo; merken(); }
    if (d.feld === "variation") { S.variation = +e.target.value; root.querySelector(".lw-var").textContent = S.variation * 10 + " %"; merken(); }
  });
  root.addEventListener("change", e => {
    const f = e.target.dataset && e.target.dataset.feld;
    if (f === "transpose") { S.transpose = +e.target.value; merken(); zeichnen(); knoepfe(); bordunStimmen(); saitenVorbereiten(); }
    if (f === "modus") { S.modus = e.target.value; merken(); zeichnen(); knoepfe(); saitenVorbereiten(); }
    if (f === "ablauf") { S.ablauf = e.target.value; merken(); }
    if (f === "instrument") {
      const spur = e.target.dataset.spur || "melodie";
      if (spur === "melodie") S.instrument = e.target.value; else S.band[spur] = e.target.value;
      merken(); zeichnen(); knoepfe(); saitenVorbereiten();
      try {
        audioStart();
        const jetzt = ctx.currentTime + .02;
        if (spur === "melodie") melodieSpielen(midiHz(tonMidi("melodie", 4, S)), jetzt, .45, 1);
        else if (spur === "floete") echoSpielen(midiHz(tonMidi("floete", 4, S)), jetzt, .5, 1);
        else if (spur === "trommel") { friedrichSpielen(jetzt, true, 1); friedrichSpielen(jetzt + .25, false, 1); }
        else { ezekielSpielen(jetzt, 1); ezekielSpielen(jetzt + .25, 1); }
      } catch (_) {}
    }
  });
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden && laeuft) { const jetzt = ctx.currentTime; while (anzeige.length && anzeige[0].zeit < jetzt - .05) anzeige.shift(); requestAnimationFrame(malen); }
  });

  /* ---------- Aussehen ---------- */
  const css = document.createElement("style");
  css.textContent = `
.lautenwerk { grid-column: 1 / -1; }
.lw-buehne { position: relative; height: clamp(170px, 32vw, 250px); overflow: hidden;
  background: radial-gradient(ellipse at 45% 85%, rgba(224,160,70,.16), transparent 65%); border-bottom: 1px solid var(--line); margin-inline: calc(-1 * clamp(1.2rem, 4vw, 2rem)); }
.lw-figur { position: absolute; inset: 4px 4px 0; width: calc(100% - 8px); height: calc(100% - 4px); overflow: visible; }
.lw-figur g, .lw-figur path, .lw-figur circle, .lw-figur ellipse { transform-box: view-box; }
.lw-figur .kopf { transform-origin: 114px 84px; }
.lw-figur .arm-schlag { transform-origin: 118px 98px; }
.lw-figur .fuss { transform-origin: 130px 155px; }
.lw-figur .laute { transform-origin: 150px 140px; }
.lw-figur .hand-griff { transform-origin: 200px 85px; }
.lw-figur .f-arm { transform-origin: 64px 100px; }
.lw-figur .f-kopf { transform-origin: 52px 88px; }
.lw-figur .e-koerper { transform-origin: 54px 190px; }
.lw-figur .e-kopf { transform-origin: 54px 82px; }
.lw-figur .kette { transform-origin: 104px 140px; }
.lw-figur .z-kopf { transform-origin: 64px 88px; }
.lw-figur .r-kopf { transform-origin: 44px 50px; }
.lw-figur .rauchwolke { transform-origin: 146px 68px; animation: lwrauch 4s ease-in-out infinite; }
.lw-figur .augen { filter: drop-shadow(0 0 3px #ff4a2a); }
.lw-figur .glut { animation: lwglut 3s ease-in-out infinite; }
@keyframes lwglut { 50% { opacity: .35 } }
@keyframes lwrauch { 0% { transform: translate(0,0); opacity: 0 } 30% { opacity: .9 } 100% { transform: translate(10px,-26px) scale(2); opacity: 0 } }
.lw-buehne.klopf .kopf { animation: lwnick .28s ease-out; }
.lw-buehne.klopf .arm-schlag { animation: lwklopf .18s ease-out; }
.lw-buehne.klopf .laute { animation: lwwackel .2s ease-out; }
.lw-buehne.schelle .fuss { animation: lwfuss .2s ease-out; }
.lw-buehne.schelle .schellring { animation: lwbling .25s ease-out; }
.lw-buehne.bass .arm-schlag { animation: lwzupf .22s ease-out; }
.lw-buehne.mel .hand-griff { animation: lwgriff .25s ease-out; }
.lw-buehne.mel .saiten, .lw-buehne.bass .saiten { animation: lwsaite .3s ease-out; }
.lw-buehne.trommel .f-arm { animation: lwschlag .2s ease-out; }
.lw-buehne.trommel .f-kopf { animation: lwnick .28s ease-out; }
.lw-buehne.trommel .trommelfell { animation: lwfell .25s ease-out; }
.lw-buehne.floete .e-koerper { animation: lwwiegen .5s ease-in-out; }
.lw-buehne.ketten .kette { animation: lwkette .3s ease-out; }
.lw-buehne.ketten .z-kopf { animation: lwnick .3s ease-out; }
.lw-buehne.ketten .augen { animation: lwaugen .35s ease-out; }
.lw-buehne.wuff .r-kopf { animation: lwwuff .25s ease-out; }
.lw-buehne.heul .r-kopf { animation: lwheul 1.3s ease-in-out; }
@keyframes lwnick { 40% { transform: rotate(6deg) translateY(2px) } }
@keyframes lwklopf { 40% { transform: rotate(-9deg) translate(2px, 4px) } }
@keyframes lwwackel { 40% { transform: rotate(-1.5deg) } }
@keyframes lwfuss { 40% { transform: rotate(-8deg) } }
@keyframes lwbling { 40% { filter: drop-shadow(0 0 4px #ffd27a) brightness(1.6) } }
@keyframes lwzupf { 40% { transform: rotate(5deg) } }
@keyframes lwgriff { 40% { transform: translate(-6px, 4px) scale(1.15) } }
@keyframes lwsaite { 0% { stroke: #ffd27a; opacity: 1; filter: drop-shadow(0 0 3px #ffd27a) } }
@keyframes lwschlag { 35% { transform: rotate(14deg) } }
@keyframes lwfell { 30% { fill: #fff6d8; filter: drop-shadow(0 0 5px #ffd27a) } }
@keyframes lwwiegen { 50% { transform: rotate(-2.5deg) } }
@keyframes lwkette { 25% { transform: rotate(9deg) } 60% { transform: rotate(-7deg) } }
@keyframes lwaugen { 40% { filter: drop-shadow(0 0 7px #ff4a2a) brightness(1.8) } }
@keyframes lwwuff { 40% { transform: rotate(-14deg) translateY(-2px) } }
@keyframes lwheul { 15%, 80% { transform: rotate(-32deg) translate(-2px, -3px) } }
.lw-note { position: absolute; bottom: 42%; font-size: 1.35rem; color: var(--ember); pointer-events: none; animation: lwnote 1.6s ease-out forwards; text-shadow: 0 0 8px rgba(224,160,70,.6); }
.lw-note.tief { color: var(--vellum); font-size: 1.05rem; }
.lw-note.floete { color: #cfe3c0; font-size: 1.1rem; text-shadow: 0 0 8px rgba(160,210,140,.6); }
.lw-note.blase { animation-name: lwblase; font-family: var(--hand); font-size: 1.3rem; color: var(--vellum); background: rgba(16,14,21,.85); border: 1px solid var(--line); padding: 0 .45rem; border-radius: 10px; white-space: nowrap; transform-origin: left bottom; }
@keyframes lwblase { 0% { transform: scale(.6); opacity: 0 } 15% { transform: scale(1); opacity: 1 } 75% { opacity: 1 } 100% { transform: translateY(-14px); opacity: 0 } }
@keyframes lwnote { from { transform: translate(0, 0); opacity: 1 } to { transform: translate(var(--dx, 10px), -80px) rotate(10deg); opacity: 0 } }

.lw-steuer { display: flex; flex-wrap: wrap; align-items: end; gap: .7rem 1rem; }
.lw-play { border: 1px solid var(--ember); background: var(--ember); color: var(--night); font: inherit; font-weight: 600; padding: .55rem 1.2rem; cursor: pointer; min-width: 8.5rem; }
.lw-play.laeuft { background: none; color: var(--ember); }
.lw-feld { display: grid; gap: .2rem; font-size: .78rem; letter-spacing: .06em; color: var(--ash); }
.lw-feld b { color: var(--vellum); font-weight: 600; }
.lw-feld select { font: inherit; font-size: .9rem; letter-spacing: 0; background: var(--night); color: var(--vellum); border: 1px solid var(--line); padding: .35rem .5rem; }
.lw-regler input { width: 8.5rem; accent-color: #e0a046; }
.lw-schalter { border: 1px solid var(--line); background: none; color: var(--ash); font: inherit; font-size: .85rem; padding: .4rem .8rem; cursor: pointer; border-radius: 999px; }
.lw-schalter[aria-pressed="true"] { border-color: var(--ember); color: var(--ember); }
.lw-schalter[aria-pressed="true"]::before { content: "✓ "; }
.lw-teile { display: flex; flex-wrap: wrap; align-items: end; gap: .5rem .7rem; }
.lw-teile-label { font-size: .78rem; letter-spacing: .06em; color: var(--ash); align-self: center; }
.lw-teil { position: relative; width: 2.6rem; height: 2.3rem; border: 1px solid var(--line); background: none; color: var(--vellum); font-family: var(--display); font-size: 1.15rem; cursor: pointer; }
.lw-teil.leer { color: var(--ash); border-style: dashed; }
.lw-teil[aria-pressed="true"] { border-color: var(--ember); background: rgba(224,160,70,.18); color: var(--ember); }
.lw-teil.spielt::after { content: ""; position: absolute; top: 4px; right: 4px; width: 6px; height: 6px; border-radius: 50%; background: #7fd36b; box-shadow: 0 0 6px #7fd36b; }
.lw-klein { border: 1px solid var(--line); background: none; color: var(--ash); font: inherit; font-size: .82rem; padding: .35rem .7rem; cursor: pointer; }
.lw-klein:hover { color: var(--ember); border-color: var(--ember); }
.lw-vorlagen { display: flex; flex-wrap: wrap; align-items: center; gap: .35rem; font-size: .85rem; color: var(--ash); }
.lw-vorlagen button { border: 1px solid var(--line); background: none; color: var(--vellum); font: inherit; font-size: .82rem; padding: .25rem .7rem; cursor: pointer; }
.lw-vorlagen button:hover { border-color: var(--ember); color: var(--ember); }
.lw-stimmungen { padding: .6rem .7rem; border: 1px dashed var(--line); }
.lw-tipp { flex-basis: 100%; margin: .2rem 0 0; font-size: .8rem; font-style: italic; color: var(--ash); }

.lw-scroll { overflow-x: auto; margin-inline: calc(-1 * clamp(1.2rem, 4vw, 2rem)); padding-inline: clamp(1.2rem, 4vw, 2rem); -webkit-overflow-scrolling: touch; }
.lw-raster { display: grid; grid-template-columns: 3.4rem repeat(16, minmax(1.75rem, 1fr)); gap: 3px; min-width: 36rem; }
.lw-kopf { grid-column: 1 / -1; margin-top: .8rem; }
.lw-kopf:first-child { margin-top: 0; }
.lw-kopf-in { position: sticky; left: 0; display: inline-flex; align-items: center; flex-wrap: wrap; gap: .4rem .55rem; max-width: calc(100vw - 2.5rem); }
.lw-spurname { border: 0; background: none; padding: .15rem 0; cursor: pointer; font: inherit; font-size: .7rem; font-weight: 600; letter-spacing: .14em; text-transform: uppercase; color: var(--ember); white-space: nowrap; }
.lw-spurname small { font-size: inherit; font-weight: 400; color: var(--ash); letter-spacing: .08em; }
.lw-mute { border: 1px solid var(--line); background: none; font-size: .85rem; line-height: 1; padding: .2rem .35rem; cursor: pointer; border-radius: 3px; }
.lw-mute[aria-pressed="true"] { border-color: var(--blood); background: rgba(155,58,47,.25); }
.lw-fader { width: 6.5rem; accent-color: #e0a046; }
.lw-instrument { font: inherit; font-size: .8rem; background: var(--night); color: var(--vellum); border: 1px solid var(--line); padding: .2rem .35rem; max-width: 11rem; }
.lw-kopf.stumm .lw-spurname, .lw-kopf.stumm .lw-fader { opacity: .4; }
.lw-zelle.stumm { opacity: .35; }
.lw-name { position: sticky; left: 0; z-index: 1; display: flex; align-items: center; justify-content: flex-end; padding-right: .45rem;
  font-family: var(--display); font-size: .82rem; color: var(--ash); background: var(--hall); }
.lw-name.grund { color: var(--vellum); }
.lw-name.sym { font-family: inherit; }
.lw-name.klein { font-size: .7rem; }
.lw-zelle { height: 1.75rem; padding: 0; border: 1px solid rgba(224,160,70,.14); background: rgba(235,226,204,.035); cursor: pointer; border-radius: 3px; transition: background .12s; -webkit-tap-highlight-color: transparent; }
.lw-zelle.takt { background: rgba(235,226,204,.08); }
.lw-zelle:hover { border-color: rgba(224,160,70,.5); }
.lw-zelle.an { background: var(--ember); border-color: var(--ember); box-shadow: 0 0 8px rgba(224,160,70,.35); }
.lw-zelle.s-schelle.an { background: #f0d48a; border-color: #f0d48a; }
.lw-zelle.s-bass.an { background: #b5643c; border-color: #b5643c; }
.lw-zelle.s-klopf.an { background: #c98a3a; border-color: #c98a3a; }
.lw-zelle.s-trommel.an { background: #7d9a5f; border-color: #7d9a5f; }
.lw-zelle.s-floete.an { background: #cfe3c0; border-color: #cfe3c0; }
.lw-zelle.s-ketten.an { background: #c4564a; border-color: #c4564a; }
.lw-zelle.s-rex.an { background: #b8743c; border-color: #b8743c; }
.lw-zelle.jetzt { outline: 1px solid rgba(235,226,204,.55); outline-offset: 0; }
.lw-zelle.jetzt.an { filter: brightness(1.35); box-shadow: 0 0 14px rgba(255,210,122,.8); }
.lw-wisch { display: none; font-size: .78rem; color: var(--ash); text-align: center; margin-top: -.3rem; }
@media (max-width: 640px) { .lw-wisch { display: block; } }
.lw-fuss { display: flex; flex-wrap: wrap; align-items: center; gap: .8rem; }
.lw-teilen { border: 1px solid var(--ember); background: none; color: var(--ember); font: inherit; font-size: .9rem; padding: .45rem 1rem; cursor: pointer; }
.lw-teilen:hover { background: var(--ember); color: var(--night); }
.lw-status { font-family: var(--hand); font-size: 1.3rem; color: var(--ember); }
@media (prefers-reduced-motion: reduce) { .lw-figur .rauchwolke, .lw-figur .glut { animation: none; } }
`;
  document.head.appendChild(css);

  zeichnen();
  let letzteSprache = sprache();
  new MutationObserver(() => { if (sprache() === letzteSprache) return; letzteSprache = sprache(); zeichnen(); knoepfe(); }).observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });
  if (ausLink) {
    setTimeout(() => {
      root.scrollIntoView({ block: "start" });
      status(t().geladen);
    }, 400);
  }
})();
