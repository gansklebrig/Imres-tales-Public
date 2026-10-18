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
  /* Mitlauschen: ?lauschen=CODE macht diese Seite zum Zuhörer */
  let hoerer = null, funk = null;
  try { const c = new URLSearchParams(location.search).get("lauschen"); if (c && /^[a-z0-9]{4,16}$/i.test(c)) hoerer = { raum: c.toLowerCase(), an: false, verbunden: false, zuletzt: null }; } catch (_) {}

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
  /* Hallräume: Nachhallzeit, Abklingkurve, Vorverzögerung, Helligkeit und frühe Reflexionen der Wände */
  const RAEUME = {
    stube:   { dauer: .7, kurve: 2.6, vor: .004, hell: 7500, frueh: [[.009, .7], [.015, .5], [.022, .4], [.029, .28]] },
    taverne: { dauer: 1.4, kurve: 2.8, vor: .012, hell: 5500, frueh: [[.017, .55], [.026, .42], [.039, .3], [.052, .2]] },
    kapelle: { dauer: 3.2, kurve: 3.1, vor: .028, hell: 4200, frueh: [[.034, .35], [.051, .3], [.07, .2]] },
    palast:  { dauer: 4.4, kurve: 2.9, vor: .045, hell: 6200, frueh: [[.048, .45], [.075, .35], [.102, .28], [.13, .2]] },
    hoehle:  { dauer: 6.5, kurve: 2.3, vor: .07, hell: 2600, frueh: [[.14, .5], [.29, .34], [.45, .22], [.62, .14]] }
  };
  const KULISSEN = ["keine", "taverne", "feuer", "regen", "wald", "hoehle", "meer", "sturm"];
  const KULISSE_ZU = { rast: "feuer", unterreich: "hoehle", reise: "wald", spannung: "hoehle", sieg: "taverne", kampf: "keine",
    taverne: "taverne", hafen: "meer", wald: "wald", markt: "taverne", schmiede: "feuer", wiegen: "feuer", trauer: "regen",
    ballade: "taverne", saltarello: "taverne", schlacht: "sturm" };
  const EFFEKTE = ["drache", "schwert", "tuer", "donner", "schrei", "wuerfel", "zauber", "horn", "jubel"];
  /* lustige Spieltisch-Momente */
  const MOMENTE = ["tusch", "posaune", "krit", "dramatisch", "grillen", "ooh", "muenzen", "ruelpser", "schnarchen", "bonk"];
  const ALLE_FX = EFFEKTE.concat(MOMENTE);
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
      teil: "Teil bearbeiten", ablauf: "Ablauf", kopierenNach: a => a + " kopieren nach", ueberschreiben: b => b + " überschreiben?", kopiert2: (a, b) => "Teil " + a + " wurde nach " + b + " kopiert.",
      sicher: b => "Teil " + b + " ist nicht leer – zum Überschreiben noch einmal tippen.",
      lieder: "Lieder", stimmungen: "Stimmungen für Imre", intensitaet: "Intensität", intStufen: ["kaum hörbar", "sehr ruhig", "ruhig", "gelassen", "gemäßigt", "normal", "lebhaft", "bewegt", "drängend", "wild", "entfesselt"],
      vorlagen: { taverne: "Tavernentanz", saltarello: "Saltarello", ballade: "Ballade", hafen: "⚓ Hafenlied", wald: "🌲 Waldweise", markt: "🏘 Marktgewusel", schmiede: "⚒ Zwergenschmiede", trauer: "Trauerlied", schlacht: "Schlachtruf", wiegen: "Wiegenlied",
        kampf: "⚔ Kampf", unterreich: "🦇 Unterreich", reise: "🗺 Reise", spannung: "👁 Spannung", sieg: "🏆 Sieg", rast: "🔥 Lagerfeuer" },
      zufall: "🎲 Improvisieren", leeren: "Leeren",
      stumm: "Stumm schalten", lautstaerke: "Lautstärke", zuklappen: "Ein- oder ausklappen",
      teilen: "🔗 Lied teilen", kopiert: "Link kopiert – schick ihn an die Gruppe!", geteilt: "Geteilt!",
      geladen: "Ein geteiltes Lied wurde geladen.",
      stimmungTipp: "Jeder Klick komponiert ein neues Stück im Stil der Stimmung. Solange es läuft, wandelt es sich nach jedem Durchgang weiter – perfekt als Hintergrund für eure Sessions. Sobald du im Raster etwas änderst, bleibt es so, wie es ist.",
      wandelt: k => "♪ " + k + " wandelt sich weiter …",
      master: "Gesamtlautstärke", hall: "Hall", raum: "Raum",
      wechselGleich: n => "→ „" + n + "“ beginnt mit dem nächsten Takt …",
      kulisse: "Geräuschkulisse", kulisseLaut: "Kulisse",
      kulissen: { keine: "– keine –", taverne: "🍺 Taverne", feuer: "🔥 Lagerfeuer", regen: "🌧 Regen", wald: "🌲 Wald", hoehle: "💧 Höhle", meer: "🌊 Meer", sturm: "⛈ Sturm" },
      effekte: "Effekte",
      sfx: { drache: "🐉 Drachenbrüllen", schwert: "⚔ Schwertklirren", tuer: "🚪 Knarrende Tür", donner: "⚡ Donner", schrei: "😱 Ferner Schrei", wuerfel: "🎲 Würfel", zauber: "✨ Zauber", horn: "📯 Kriegshorn", jubel: "🍻 Jubel",
        tusch: "🥁 Ba-dum-tss", posaune: "🎺 Wah-wah-waah", krit: "🌟 Natürliche 20", dramatisch: "😨 Dun-dun-DUUUN", grillen: "🦗 Peinliche Stille",
        ooh: "😮 Ooooh!", muenzen: "💰 Münzen", ruelpser: "🍺 Rülpser", schnarchen: "😴 Schnarchen", bonk: "🔨 Bonk" }, momente: "Spieltisch-Momente",
      funk: "📡 Mitlauschen", funkTipp: "Alle anderen öffnen den Link und tippen auf „Zuhören“ – die Musik entsteht dann bei jedem selbst im Browser, Stimmungen, Kulisse und Effekte folgen deinem Pult.",
      funkStart: "📡 Für alle übertragen", funkStopp: "Übertragung beenden", funkKopieren: "🔗 Link kopieren", funkKopiert: "Link kopiert – ab damit in den Discord!",
      funkVerbinde: "Verbinde …", funkFehler: "Keine Verbindung – versuche es erneut …", funkZuhoerer: n => n === 1 ? "1 hört zu" : n + " hören zu", funkLaeuft: "Übertragung läuft",
      hTitel: "Imres Musik", hText: "Hier läuft, was Imre am Spieltisch spielt – Musik, Geräuschkulisse und Effekte. Tippe auf „Zuhören“, Lautstärke stellst du selbst ein.",
      hZuhoeren: "🎧 Zuhören", hAus: "❚❚ Stumm", hWarte: "Imre spielt gerade nichts – sobald er startet, hörst du es.", hVerbunden: "Verbunden", hVerbinde: "Verbinde mit Imres Pult …",
      hSelbst: "Selbst spielen statt zuhören", hLaut: "Meine Lautstärke",
      pult: "🎛 Spielleiter-Pult", komplett: "🎼 Komplette Ansicht", pultTipp: "Für den Spieltisch: Stimmungen wechseln sanft am Taktende, Kulisse und Effekte laufen über der Musik.",
      liedWaehlen: "Lied wählen …", kulisseAn: "Kulisse an", kulisseAus: "Kulisse aus", lieder2: "Lieder",
      raeume: { stube: "Kleine Stube", taverne: "Taverne", kapelle: "Kapelle", palast: "Thronsaal", hoehle: "Tropfsteinhöhle" }, hallSpur: "Hall für diese Spur an/aus", miniPause: "Musik pausieren", miniWeiter: "Musik fortsetzen", miniZur: "Zum Lautenwerk", eigenesLied: "Eigenes Lied",
      eigene: "Eigene Lieder", gespeichert: n => "📂 Gespeicherte Lieder (" + n + ")", gruppe: "Für die ganze Gruppe", lokal: "Nur auf diesem Gerät",
      speichern: "💾 Speichern", loeschen: "🗑 Löschen", liedName: "Name des Liedes", fuerAlle: "Für alle speichern", nurHier: "Nur hier speichern", abbrechen: "Abbrechen",
      gespeichertOk: n => "„" + n + "“ wurde gespeichert.", geloescht: n => "„" + n + "“ wurde gelöscht.", liedGeladen: n => "„" + n + "“ geladen.",
      pwFrage: "Passwort der Questtafel (für gemeinsame Lieder):", pwFalsch: "Das Passwort stimmt nicht.", serverFehler: "Der Server ist gerade nicht erreichbar.",
      loeschenFrage: n => "„" + n + "“ wirklich löschen?", keinName: "Bitte gib dem Lied einen Namen.",
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
      teil: "Edit part", ablauf: "Order", kopierenNach: a => "Copy " + a + " to", ueberschreiben: b => "Overwrite " + b + "?", kopiert2: (a, b) => "Part " + a + " was copied to " + b + ".",
      sicher: b => "Part " + b + " is not empty – tap again to overwrite it.",
      lieder: "Songs", stimmungen: "Moods for Imre", intensitaet: "Intensity", intStufen: ["barely there", "very calm", "calm", "relaxed", "moderate", "normal", "lively", "driving", "urgent", "wild", "unleashed"],
      vorlagen: { taverne: "Tavern dance", saltarello: "Saltarello", ballade: "Ballad", hafen: "⚓ Harbour shanty", wald: "🌲 Forest air", markt: "🏘 Market bustle", schmiede: "⚒ Dwarven forge", trauer: "Lament", schlacht: "Battle cry", wiegen: "Lullaby",
        kampf: "⚔ Battle", unterreich: "🦇 Underdark", reise: "🗺 Journey", spannung: "👁 Suspense", sieg: "🏆 Victory", rast: "🔥 Campfire" },
      zufall: "🎲 Improvise", leeren: "Clear",
      stumm: "Mute", lautstaerke: "Volume", zuklappen: "Expand or collapse",
      teilen: "🔗 Share song", kopiert: "Link copied – send it to the party!", geteilt: "Shared!",
      geladen: "A shared song has been loaded.",
      stimmungTipp: "Every click composes a new piece in the style of the mood. While it plays, it keeps changing after every round – perfect as background music for your sessions. As soon as you change something in the grid, it stays as it is.",
      wandelt: k => "♪ " + k + " keeps evolving …",
      master: "Master volume", hall: "Reverb", raum: "Room",
      wechselGleich: n => "→ “" + n + "” starts with the next bar …",
      kulisse: "Ambience", kulisseLaut: "Ambience",
      kulissen: { keine: "– none –", taverne: "🍺 Tavern", feuer: "🔥 Campfire", regen: "🌧 Rain", wald: "🌲 Forest", hoehle: "💧 Cave", meer: "🌊 Sea", sturm: "⛈ Storm" },
      effekte: "Effects",
      sfx: { drache: "🐉 Dragon roar", schwert: "⚔ Sword clash", tuer: "🚪 Creaking door", donner: "⚡ Thunder", schrei: "😱 Distant scream", wuerfel: "🎲 Dice", zauber: "✨ Spell", horn: "📯 War horn", jubel: "🍻 Cheers",
        tusch: "🥁 Ba-dum-tss", posaune: "🎺 Sad trombone", krit: "🌟 Natural 20", dramatisch: "😨 Dun-dun-DUNNN", grillen: "🦗 Awkward silence",
        ooh: "😮 Ooooh!", muenzen: "💰 Coins", ruelpser: "🍺 Burp", schnarchen: "😴 Snoring", bonk: "🔨 Bonk" }, momente: "Table moments",
      funk: "📡 Listen in", funkTipp: "Everyone else opens the link and taps “Listen” – the music is then created in each browser, and moods, ambience and effects follow your console.",
      funkStart: "📡 Broadcast to everyone", funkStopp: "Stop broadcast", funkKopieren: "🔗 Copy link", funkKopiert: "Link copied – drop it into Discord!",
      funkVerbinde: "Connecting …", funkFehler: "No connection – retrying …", funkZuhoerer: n => n === 1 ? "1 listening" : n + " listening", funkLaeuft: "Broadcast running",
      hTitel: "Imre's music", hText: "This plays whatever Imre plays at the table – music, ambience and effects. Tap “Listen”; you set the volume yourself.",
      hZuhoeren: "🎧 Listen", hAus: "❚❚ Mute", hWarte: "Imre isn't playing anything right now – you'll hear it as soon as he starts.", hVerbunden: "Connected", hVerbinde: "Connecting to Imre's console …",
      hSelbst: "Play yourself instead of listening", hLaut: "My volume",
      pult: "🎛 GM console", komplett: "🎼 Full view", pultTipp: "For the gaming table: moods change smoothly at the end of the bar, ambience and effects play over the music.",
      liedWaehlen: "Choose a song …", kulisseAn: "Ambience on", kulisseAus: "Ambience off", lieder2: "Songs",
      raeume: { stube: "Small room", taverne: "Tavern", kapelle: "Chapel", palast: "Throne hall", hoehle: "Cavern" }, hallSpur: "Reverb for this track on/off", miniPause: "Pause music", miniWeiter: "Resume music", miniZur: "Go to the lute machine", eigenesLied: "Your song",
      eigene: "Your songs", gespeichert: n => "📂 Saved songs (" + n + ")", gruppe: "For the whole party", lokal: "Only on this device",
      speichern: "💾 Save", loeschen: "🗑 Delete", liedName: "Song name", fuerAlle: "Save for everyone", nurHier: "Save here only", abbrechen: "Cancel",
      gespeichertOk: n => "“" + n + "” was saved.", geloescht: n => "“" + n + "” was deleted.", liedGeladen: n => "“" + n + "” loaded.",
      pwFrage: "Quest board password (for shared songs):", pwFalsch: "That password is wrong.", serverFehler: "The server can't be reached right now.",
      loeschenFrage: n => "Really delete “" + n + "”?", keinName: "Please give the song a name.",
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
      tempo: 104, transpose: 0, modus: "dorisch", swing: 0, bordun: 1, variation: 2, ablauf: "AABACADD",
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
        floete: folge({ 0: 3, 2: 1, 4: 6, 6: 3, 8: 5, 10: 3, 12: 4, 14: 6 }) }),
      /* D: alle zusammen, die Laute steigt zum hohen D, Echo in Terzen darunter */
      D: teil({ klopf: an([0, 4, 8, 12]), schelle: an([2, 6, 10, 14]), trommel: an([0, 3, 6, 8, 10, 11, 12, 14]), ketten: an([4, 12, 14, 15]),
        bass: folge({ 0: 0, 4: 2, 8: 3, 12: 0 }),
        melodie: folge({ 0: 7, 1: 6, 2: 7, 4: 5, 5: 4, 6: 3, 8: 4, 9: 5, 10: 6, 12: 7, 14: 7 }),
        floete: folge({ 0: 4, 2: 4, 4: 3, 6: 5, 8: 6, 10: 4, 12: 4, 14: 2 }), rex: folge({ 15: 0 }) }) },
    /* Saltarello: italienischer Springtanz im 3-3-2, die Schalmei springt, Echo antwortet */
    saltarello: { instrument: "schalmei", band: { trommel: "tamburin", floete: "floete", ketten: "stampfen" },
      tempo: 120, transpose: 0, modus: "dorisch", swing: 0, bordun: 1, variation: 2, ablauf: "AABBCCDD",
      A: teil({ klopf: an([0, 8]), schelle: an([4, 12]), trommel: an([0, 3, 6, 8, 11, 14]), ketten: an([0, 6, 8, 14]),
        bass: folge({ 0: 0, 6: 0, 8: 4, 14: 4 }),
        melodie: folge({ 0: 7, 1: 6, 2: 7, 3: 4, 4: 2, 6: 4, 7: 5, 8: 6, 9: 5, 10: 6, 11: 3, 12: 1, 14: 3, 15: 4 }) }),
      B: teil({ klopf: an([0, 8]), schelle: an([4, 12]), trommel: an([0, 3, 6, 8, 11, 14]), ketten: an([0, 6, 8, 14]),
        bass: folge({ 0: 2, 6: 2, 8: 0, 12: 3 }),
        melodie: folge({ 0: 5, 1: 4, 2: 3, 3: 5, 4: 7, 6: 5, 7: 4, 8: 4, 9: 3, 10: 2, 11: 1, 12: 1, 14: 4, 15: 6 }),
        floete: folge({ 0: 3, 6: 3, 8: 2, 12: 6, 14: 6 }) }),
      /* C: Echo ruft mit dem Motiv, die Schalmei antwortet */
      C: teil({ klopf: an([0, 8]), trommel: an([0, 3, 6, 8, 11, 14]), ketten: an([0, 8]),
        bass: folge({ 0: 4, 8: 2 }),
        floete: folge({ 0: 6, 1: 5, 2: 6, 3: 3, 4: 1, 6: 3 }),
        melodie: folge({ 8: 5, 9: 4, 10: 3, 11: 5, 12: 7, 14: 5 }) }),
      /* D: alle springen mit – Melodie oben, Echo in Terzen */
      D: teil({ klopf: an([0, 3, 6, 8, 11, 14]), schelle: an([2, 4, 10, 12]), trommel: an([0, 2, 3, 6, 8, 10, 11, 14]), ketten: an([0, 3, 6, 8, 11, 14]),
        bass: folge({ 0: 0, 4: 4, 8: 2, 12: 3 }),
        melodie: folge({ 0: 7, 1: 6, 2: 7, 3: 4, 4: 6, 5: 4, 6: 3, 7: 4, 8: 5, 9: 4, 10: 3, 11: 2, 12: 4, 13: 5, 14: 6, 15: 7 }),
        floete: folge({ 0: 4, 2: 4, 4: 3, 8: 3, 10: 5, 12: 6, 14: 4 }), rex: folge({ 15: 0 }) }) },
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
      tempo: 70, transpose: -2, modus: "aeolisch", swing: 0, bordun: 1, variation: 1, ablauf: "AABBCD",
      A: teil({ klopf: an([0, 8]), bass: folge({ 0: 0, 8: 2, 12: 3 }),
        melodie: folge({ 0: 4, 4: 2, 6: 0, 8: 3, 10: 5, 12: 1 }) }),
      B: teil({ trommel: an([0]), bass: folge({ 0: 4, 4: 1, 8: 2, 12: 3 }),
        melodie: folge({ 0: 6, 3: 5, 4: 4, 6: 2, 8: 0, 10: 3, 12: 1, 14: 4 }),
        floete: folge({ 0: 3, 4: 6, 8: 5, 12: 4 }), rex: folge({ 14: 1 }) }),
      /* C: Echo singt allein, die Fidel hält nur den Grund */
      C: teil({ bass: folge({ 0: 1, 8: 4 }), melodie: folge({ 0: 2, 8: 1 }),
        floete: folge({ 0: 4, 3: 3, 4: 2, 8: 6, 11: 5, 12: 3, 14: 1 }) }),
      /* D: alle zusammen, Auflösung nach Moll */
      D: teil({ klopf: an([0, 8]), trommel: an([0, 8]), ketten: an([12]), bass: folge({ 0: 2, 4: 3, 8: 0 }),
        melodie: folge({ 0: 5, 2: 3, 4: 4, 6: 6, 8: 7, 10: 4, 12: 2, 14: 0 }),
        floete: folge({ 0: 3, 4: 6, 8: 4, 12: 4 }) }) },
    schlacht: { instrument: "dudelsack", band: { trommel: "pauke", floete: "horn", ketten: "stampfen" },
      tempo: 128, transpose: 2, modus: "phrygisch", swing: 0, bordun: 1, variation: 2, ablauf: "AABCDD",
      A: teil({ klopf: an([0, 3, 6, 8, 11, 14]), schelle: an([2, 6, 10, 14]), trommel: an([0, 4, 8, 12]), ketten: an([0, 8]),
        bass: folge({ 0: 0, 2: 0, 4: 0, 6: 0, 8: 0, 10: 0, 12: 4, 14: 4 }),
        melodie: folge({ 0: 4, 2: 4, 3: 5, 4: 4, 6: 2, 7: 1, 8: 0, 10: 4, 11: 5, 12: 6, 14: 3, 15: 1 }) }),
      B: teil({ klopf: an([0, 4, 8, 12]), schelle: an([0, 2, 4, 6, 8, 10, 12, 14]), trommel: an([0, 4, 8, 10, 12, 14]), ketten: an([0, 4, 8, 12]),
        bass: folge({ 0: 0, 4: 2, 8: 3, 12: 4 }),
        melodie: folge({ 0: 7, 2: 4, 4: 5, 6: 3, 8: 4, 10: 6, 12: 6, 14: 1, 15: 0 }),
        floete: folge({ 0: 4, 4: 3, 8: 4, 12: 3 }), rex: folge({ 15: 0 }) }),
      C: teil({ klopf: an([0, 8]), trommel: an([0, 4, 8, 10, 12, 13, 14, 15]), ketten: an([0, 4, 8, 12]),
        bass: folge({ 0: 0, 8: 0 }), floete: folge({ 0: 4, 6: 4, 8: 7 }), rex: folge({ 12: 2 }) }),
      /* D: der Sturmangriff – Dudelsack und Horn im Wechsel der Akkorde */
      D: teil({ klopf: an([0, 2, 4, 6, 8, 10, 12, 14]), schelle: an([0, 2, 4, 6, 8, 10, 12, 14]), trommel: an([0, 2, 3, 4, 6, 8, 10, 11, 12, 14, 15]), ketten: an([0, 4, 8, 12]),
        bass: folge({ 0: 0, 2: 0, 4: 4, 6: 4, 8: 2, 10: 2, 12: 3, 14: 3 }),
        melodie: folge({ 0: 4, 2: 2, 4: 6, 6: 3, 8: 5, 10: 3, 12: 4, 14: 1, 15: 0 }),
        floete: folge({ 0: 7, 4: 1, 8: 7, 12: 6 }), rex: folge({ 14: 0 }) }) },
    wiegen: { instrument: "harfe", band: { trommel: "trommel", floete: "okarina", ketten: "rassel" },
      tempo: 84, transpose: 0, modus: "mixolydisch", swing: 1, bordun: 0, variation: 1, ablauf: "AABBCD",
      A: teil({ klopf: an([0, 8]), ketten: an([4, 12]), bass: folge({ 0: 0, 8: 2 }),
        melodie: folge({ 0: 4, 2: 2, 4: 4, 6: 2, 8: 3, 10: 5, 12: 3, 14: 0 }) }),
      B: teil({ klopf: an([0, 8]), schelle: an([12]), ketten: an([4, 12]), bass: folge({ 0: 4, 8: 0 }),
        melodie: folge({ 0: 6, 2: 3, 4: 1, 6: 3, 8: 2, 10: 4, 12: 0 }),
        floete: folge({ 0: 1, 4: 3, 8: 4, 12: 2 }) }),
      /* C: die Okarina singt, die Harfe tupft nur */
      C: teil({ ketten: an([4, 12]), bass: folge({ 0: 2, 8: 0 }), melodie: folge({ 0: 0, 8: 2 }),
        floete: folge({ 0: 5, 2: 3, 4: 5, 6: 7, 8: 4, 10: 2, 12: 4, 14: 7 }) }),
      /* D: Harfenarpeggio zum Einschlafen */
      D: teil({ klopf: an([0]), bass: folge({ 0: 4, 4: 2, 8: 0 }),
        melodie: folge({ 0: 1, 2: 3, 4: 5, 6: 3, 8: 4, 10: 2, 12: 0 }),
        floete: folge({ 0: 6, 8: 7 }), rex: folge({ 14: 2 }) }) },
    /* ---------- Neue Lieder ---------- */
    /* Hafenlied: Barradin ruft, die Mannschaft (Echo) antwortet – mit Krügen auf dem Tisch */
    hafen: { instrument: "fidel", band: { trommel: "trommel", floete: "gesang", ketten: "krug" },
      tempo: 108, transpose: 0, modus: "dorisch", swing: 0, bordun: 1, variation: 2, ablauf: "ABABCCDD",
      A: teil({ klopf: an([4, 12]), ketten: an([0, 8]), trommel: an([0, 8]),
        bass: folge({ 0: 0, 8: 4 }),
        melodie: folge({ 0: 4, 1: 4, 2: 4, 4: 0, 6: 2, 8: 3, 9: 3, 10: 3, 12: 1, 14: 3 }) }),
      B: teil({ klopf: an([4, 12]), ketten: an([0, 6, 8, 14]), trommel: an([0, 8, 14]),
        bass: folge({ 0: 0, 4: 4, 8: 0, 12: 3 }),
        melodie: folge({ 0: 2, 4: 1, 8: 2, 12: 6 }),
        floete: folge({ 0: 4, 2: 2, 4: 6, 6: 3, 8: 4, 10: 2, 12: 4, 14: 1 }) }),
      C: teil({ klopf: an([0, 4, 8, 12]), schelle: an([2, 6, 10, 14]), ketten: an([0, 8]), trommel: an([0, 3, 6, 8, 11, 14]),
        bass: folge({ 0: 2, 4: 2, 8: 3, 12: 4 }),
        melodie: folge({ 0: 3, 1: 4, 2: 5, 3: 4, 4: 3, 5: 2, 6: 0, 7: 2, 8: 4, 9: 5, 10: 6, 11: 5, 12: 6, 13: 4, 14: 3, 15: 1 }) }),
      D: teil({ klopf: an([0, 4, 8, 12]), schelle: an([2, 6, 10, 14]), ketten: an([0, 4, 8, 12]), trommel: an([0, 4, 6, 8, 12, 14]),
        bass: folge({ 0: 0, 4: 2, 8: 4, 12: 0 }),
        melodie: folge({ 0: 4, 2: 4, 4: 3, 6: 0, 8: 1, 10: 1, 12: 2, 14: 2 }),
        floete: folge({ 0: 7, 2: 7, 4: 5, 6: 3, 8: 6, 10: 3, 12: 4, 14: 0 }), rex: folge({ 15: 0 }) }) },
    /* Waldweise: Vogelrufe der Panflöte, raschelndes Laub, ein Tanz auf der Lichtung */
    wald: { instrument: "harfe", band: { trommel: "bodhran", floete: "panfloete", ketten: "rassel" },
      tempo: 104, transpose: 5, modus: "dorisch", swing: 1, bordun: 1, variation: 3, ablauf: "ABABCDCD",
      A: teil({ klopf: an([0, 8]), ketten: an([2, 6, 10, 14]),
        bass: folge({ 0: 0, 8: 4 }),
        melodie: folge({ 0: 0, 2: 2, 3: 3, 4: 4, 6: 2, 8: 1, 10: 3, 12: 6, 14: 1 }),
        floete: folge({ 12: 3, 14: 6, 15: 7 }) }),
      B: teil({ klopf: an([0, 8]), ketten: an([2, 6, 10, 14]), trommel: an([0, 8]),
        bass: folge({ 0: 2, 8: 0 }),
        melodie: folge({ 0: 3, 2: 5, 4: 7, 6: 5, 8: 4, 10: 2, 12: 0, 14: 2 }),
        floete: folge({ 12: 4, 14: 7, 15: 6 }), rex: folge({ 15: 0 }) }),
      C: teil({ klopf: an([0, 8]), ketten: an([2, 6, 10, 14]), trommel: an([0, 6, 8, 14]),
        bass: folge({ 0: 4, 4: 4, 8: 2, 12: 3 }),
        melodie: folge({ 0: 1, 8: 3, 12: 4 }),
        floete: folge({ 0: 6, 2: 3, 4: 1, 6: 3, 8: 5, 10: 0, 12: 6, 14: 4 }) }),
      D: teil({ klopf: an([0, 4, 8, 12]), schelle: an([4, 12]), ketten: an([2, 6, 10, 14]), trommel: an([0, 3, 6, 8, 11, 14]),
        bass: folge({ 0: 0, 4: 4, 8: 2, 12: 0 }),
        melodie: folge({ 0: 4, 1: 3, 2: 4, 4: 6, 5: 4, 6: 3, 8: 5, 9: 4, 10: 3, 12: 2, 13: 1, 14: 0 }),
        floete: folge({ 0: 7, 4: 3, 8: 7, 12: 4, 14: 2 }) }) },
    /* Marktgewusel: synkopierter Ohrwurm, Löffel-Spieler und ein bellender Marktköter */
    markt: { instrument: "mandoline", band: { trommel: "tamburin", floete: "floete", ketten: "loeffel" },
      tempo: 120, transpose: 0, modus: "mixolydisch", swing: 0, bordun: 0, variation: 2, ablauf: "AABBCCDD",
      A: teil({ klopf: an([0, 3, 6, 8, 11, 14]), schelle: an([4, 12]), trommel: an([0, 4, 8, 12]), ketten: an([2, 6, 10, 14]),
        bass: folge({ 0: 0, 3: 0, 6: 4, 8: 2, 11: 2, 14: 4 }),
        melodie: folge({ 0: 4, 2: 4, 3: 5, 4: 4, 6: 3, 8: 5, 10: 5, 11: 7, 12: 5, 14: 3 }),
        floete: folge({ 7: 6, 15: 6 }) }),
      B: teil({ klopf: an([0, 3, 6, 8, 11, 14]), schelle: an([4, 12]), trommel: an([0, 4, 8, 10, 12]), ketten: an([2, 6, 10, 14]),
        bass: folge({ 0: 2, 3: 2, 6: 0, 8: 4, 11: 4, 14: 3 }),
        melodie: folge({ 0: 7, 2: 7, 3: 5, 4: 3, 6: 4, 8: 6, 10: 6, 11: 5, 12: 3, 14: 1, 15: 2 }),
        floete: folge({ 5: 5, 13: 4 }), rex: folge({ 15: 0 }) }),
      C: teil({ klopf: an([0, 8]), trommel: an([0, 4, 8, 12]), ketten: an([0, 2, 4, 6, 8, 10, 12, 14]),
        bass: folge({ 0: 0, 8: 0 }),
        floete: folge({ 0: 4, 1: 5, 2: 7, 4: 4, 6: 2, 8: 4, 9: 5, 10: 7, 12: 7, 13: 6, 14: 4 }),
        rex: folge({ 5: 0, 7: 0 }) }),
      D: teil({ klopf: an([0, 3, 6, 8, 11, 14]), schelle: an([2, 4, 6, 10, 12, 14]), trommel: an([0, 2, 4, 6, 8, 10, 12, 14]), ketten: an([2, 6, 10, 14]),
        bass: folge({ 0: 0, 3: 0, 6: 4, 8: 2, 11: 2, 14: 4 }),
        melodie: folge({ 0: 4, 2: 4, 3: 5, 4: 4, 6: 3, 8: 5, 10: 5, 11: 7, 12: 5, 13: 4, 14: 3, 15: 4 }),
        floete: folge({ 0: 2, 2: 2, 3: 3, 4: 2, 6: 1, 8: 3, 10: 3, 11: 5, 12: 3, 14: 1 }) }) },
    /* Zwergenschmiede: Hammer auf Amboss im 3-3-2, Hörner aus der Tiefe */
    schmiede: { instrument: "drehleier", band: { trommel: "pauke", floete: "horn", ketten: "loeffel" },
      tempo: 96, transpose: -2, modus: "aeolisch", swing: 0, bordun: 1, variation: 2, ablauf: "AABBCADD",
      A: teil({ klopf: an([0, 8]), trommel: an([0, 8]), ketten: an([0, 3, 6, 8, 11, 14]),
        bass: folge({ 0: 0, 3: 0, 6: 0, 8: 4, 11: 4, 14: 0 }),
        melodie: folge({ 0: 0, 2: 2, 3: 3, 4: 4, 6: 4, 7: 3, 8: 3, 10: 1, 12: 6, 14: 4 }) }),
      B: teil({ klopf: an([0, 8]), trommel: an([0, 6, 8, 14]), ketten: an([0, 3, 6, 8, 11, 14]),
        bass: folge({ 0: 2, 6: 2, 8: 3, 14: 3 }),
        melodie: folge({ 0: 5, 2: 3, 4: 0, 6: 3, 8: 4, 10: 6, 12: 1, 14: 4 }),
        floete: folge({ 0: 3, 8: 6, 12: 4 }) }),
      C: teil({ trommel: an([0]), ketten: an([0, 3, 6, 8, 11, 14]), bass: folge({ 0: 0, 8: 0 }),
        floete: folge({ 0: 4, 2: 4, 3: 5, 4: 7, 8: 4, 10: 2, 12: 0 }), rex: folge({ 12: 2 }) }),
      D: teil({ klopf: an([0, 4, 8, 12]), trommel: an([0, 4, 8, 10, 12, 14]), ketten: an([0, 2, 3, 6, 8, 10, 11, 14]),
        bass: folge({ 0: 0, 4: 4, 8: 2, 12: 3 }),
        melodie: folge({ 0: 7, 2: 4, 4: 6, 6: 3, 8: 5, 10: 0, 12: 4, 13: 3, 14: 1 }),
        floete: folge({ 0: 4, 4: 1, 8: 3, 12: 6 }) }) },
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
  const LIEDER = ["taverne", "saltarello", "ballade", "hafen", "wald", "markt", "schmiede", "trauer", "schlacht", "wiegen"];
  const STIMMUNGEN = ["kampf", "unterreich", "reise", "spannung", "sieg", "rast"];

  /* ---------- Stimmungs-Generatoren ----------
     Jede Stimmung ist ein Stil: Tonleiter, Tempo, Besetzung, Akkordfolgen (Bass-Zeilen je Viertel),
     Rhythmen. Daraus wird bei jedem Aufruf ein neues Stück komponiert: Teil A stellt ein Motiv vor,
     B variiert es über andere Akkorde, C gehört Echo, D bringt das Motiv mit voller Besetzung zurück.
     Auf den Zählzeiten liegen immer Akkordtöne – so klingt es auch zufällig noch nach Musik. */
  const STIL = {
    kampf: { modus: ["phrygisch", "aeolisch"], tempo: [132, 146], transpose: [-2, 0, 2], swing: 0, bordun: 1, variation: 3,
      instrument: ["fidel", "dudelsack", "schalmei"], band: { trommel: ["pauke", "trommel"], floete: ["horn"], ketten: ["ketten", "stampfen"] },
      ablauf: ["AABACA", "AABCDD", "ABACABAD"], akkorde: [[0, 0, 4, 0], [0, 2, 3, 4], [0, 4, 2, 3], [0, 0, 2, 3], [2, 2, 3, 4]],
      bass: ["puls", "galopp"], rhythmus: [[0, 1, 2, 4, 6], [0, 2, 3, 4, 6], [0, 3, 4, 6]], lage: 3, dichte: 1, echo: "lang",
      klopf: [[0, 4, 8, 12]], schelle: [[2, 6, 10, 14], []], trommel: [[0, 3, 6, 8, 11, 14], [0, 2, 4, 6, 8, 10, 12, 13, 14, 15]],
      ketten: [[4, 12], [0, 6, 8, 14]], rex: [0, 2] },
    unterreich: { modus: ["phrygisch"], tempo: [58, 70], transpose: [-3, -5], swing: 0, bordun: 1, variation: 4,
      instrument: ["drehleier", "glocken", "illusion"], band: { trommel: ["pauke"], floete: ["okarina", "gesang"], ketten: ["ketten"] },
      ablauf: ["AB", "ABAC", "AABC"], akkorde: [[0, 0, 0, 1], [0, 0, 4, 0], [0, 0, 2, 0]],
      bass: ["orgel", "halbe"], rhythmus: [[0, 6], [2, 8], [0, 4]], lage: 2, dichte: .5, echo: "fern", schraeg: .35,
      klopf: [[]], schelle: [[]], trommel: [[0], [0, 12]], ketten: [[7], [5, 13], []], rex: [1, 2] },
    reise: { modus: ["mixolydisch", "dorisch"], tempo: [96, 108], transpose: [0, 2, -3], swing: 1, bordun: 1, variation: 3,
      instrument: ["mandoline", "laute", "harfe"], band: { trommel: ["bodhran", "trommel"], floete: ["panfloete", "floete"], ketten: ["rassel", "stampfen"] },
      ablauf: ["AABA", "AABACA", "ABABCD"], akkorde: [[0, 4, 2, 0], [2, 0, 4, 0], [0, 0, 4, 2], [0, 2, 4, 0]],
      bass: ["viertel", "halbe"], rhythmus: [[0, 2, 4, 6], [0, 2, 3, 4, 6], [0, 3, 4, 6, 7]], lage: 3, dichte: .9, echo: "antwort",
      klopf: [[0, 8]], schelle: [[4, 12], [2, 6, 10, 14]], trommel: [[0, 6, 8, 14], [0, 8]], ketten: [[2, 6, 10, 14]], rex: [0] },
    spannung: { modus: ["aeolisch", "phrygisch"], tempo: [84, 96], transpose: [0, -2], swing: 0, bordun: 0, variation: 4,
      instrument: ["glocken", "harfe", "illusion"], band: { trommel: ["pauke"], floete: ["okarina"], ketten: ["schnipsen", "rassel"] },
      ablauf: ["AAAB", "AABA", "AABC"], akkorde: [[0, 0, 0, 0], [0, 0, 1, 1], [0, 0, 2, 2], [0, 1, 0, 4]],
      bass: ["puls"], rhythmus: [[0, 4], [0, 6], [4]], lage: 5, dichte: .45, echo: "fern", schraeg: .25,
      klopf: [[]], schelle: [[]], trommel: [[0, 2], [0, 2, 8, 10]], ketten: [[0, 4, 8, 12]], rex: [2] },
    sieg: { modus: ["mixolydisch"], tempo: [116, 128], transpose: [0, 2], swing: 0, bordun: 1, variation: 3,
      instrument: ["laute", "dudelsack", "mandoline"], band: { trommel: ["tamburin", "trommel"], floete: ["horn", "floete"], ketten: ["klatschen", "stampfen"] },
      ablauf: ["AABB", "AABBCD", "ABACAD"], akkorde: [[0, 2, 4, 0], [0, 4, 2, 0], [2, 0, 4, 0], [0, 0, 2, 4]],
      bass: ["viertel", "puls"], rhythmus: [[0, 1, 2, 4, 6], [0, 2, 4, 6], [0, 2, 3, 4]], lage: 4, dichte: 1, echo: "lang",
      klopf: [[0, 4, 8, 12]], schelle: [[2, 6, 10, 14], [0, 2, 4, 6, 8, 10, 12, 14]], trommel: [[0, 4, 6, 8, 12, 14], [0, 2, 4, 6, 8, 10, 12, 13, 14, 15]],
      ketten: [[4, 12]], rex: [0, 1] },
    rast: { modus: ["dorisch", "mixolydisch"], tempo: [76, 88], transpose: [0, 5, -2], swing: 1, bordun: 0, variation: 2,
      instrument: ["harfe", "laute"], band: { trommel: ["bodhran"], floete: ["okarina", "gesang", "panfloete"], ketten: ["rassel", "schnipsen"] },
      ablauf: ["AABB", "ABAC", "AABBCD"], akkorde: [[0, 0, 4, 4], [2, 2, 0, 0], [0, 0, 2, 0], [4, 4, 0, 0]],
      bass: ["halbe"], rhythmus: [[0, 2, 4, 6], [0, 4, 6], [0, 3, 4]], lage: 3, dichte: .6, echo: "antwort",
      klopf: [[0, 8], []], schelle: [[], [12]], trommel: [[0], []], ketten: [[4, 12], []], rex: [2] }
  };
  const zwischen = ([a, b]) => a + Math.floor(Math.random() * ((b - a) / 2 + 1)) * 2;
  const akkordToene = bassZeile => { const d = BASS_STUFEN[bassZeile]; return [d % 7, (d + 2) % 7, (d + 4) % 7]; };
  const naechsterTon = (ziel, erlaubt) => {
    let best = null;
    for (let r = 0; r <= 7; r++) if (erlaubt.includes(r % 7) && (best === null || Math.abs(r - ziel) < Math.abs(best - ziel) || (Math.abs(r - ziel) === Math.abs(best - ziel) && Math.random() < .5))) best = r;
    return best;
  };
  function bassBauen(akk, art) {
    const a = leer(), schritte = { puls: [0, 2, 4, 6, 8, 10, 12, 14], viertel: [0, 4, 8, 12], halbe: [0, 8], galopp: [0, 3, 6, 8, 11, 14], orgel: [0] }[art];
    schritte.forEach(i => { a[i] = akk[Math.floor(i / 4)]; });
    if (art === "halbe" || art === "orgel") [4, 12].forEach(i => { if (akk[i / 4] !== akk[i / 4 - 1]) a[i] = akk[i / 4]; });
    return a;
  }
  /* Motiv: Rhythmus für eine halbe Taktlänge + Kontur; die zweite Hälfte wiederholt die Kontur über den neuen Akkorden */
  function motivBauen(st) {
    return { rhythmus: zufall(st.rhythmus), kontur: Array.from({ length: 6 }, () => zufall([-2, -1, -1, 1, 1, 2, 0])), start: st.lage + zufall([-1, 0, 1]) };
  }
  /* der Akkord, der an Schritt i wirklich klingt (letzter Basston davor) */
  const klingt = (bass, i) => { for (let k = 0; k < SCHRITTE; k++) { const v = bass[(i - k + SCHRITTE) % SCHRITTE]; if (v >= 0) return v; } return 0; };
  function melodieBauen(bass, motiv, st, versatz) {
    const a = leer();
    let ton = Math.max(0, Math.min(7, motiv.start + (versatz || 0)));
    [0, 8].forEach((halb, h) => {
      motiv.rhythmus.forEach((r, k) => {
        const i = halb + r; if (i >= SCHRITTE) return;
        if (h === 1 && k === motiv.rhythmus.length - 1 && Math.random() < .3) return; /* kleine Atempause am Ende */
        if (st.dichte < 1 && k > 0 && Math.random() > st.dichte) return;
        if (st.fuell && i % 2 === 0 && k < motiv.rhythmus.length - 1 && motiv.rhythmus[k + 1] - r > 1 && Math.random() < st.fuell) a[i + 1] = -2; /* Platzhalter für Durchgangston */
        const wunsch = ton + motiv.kontur[k % motiv.kontur.length];
        if (i % 2 === 0) ton = naechsterTon(wunsch, akkordToene(klingt(bass, i)));
        else ton = Math.max(0, Math.min(7, wunsch));
        if (st.schraeg && i % 2 === 1 && Math.random() < st.schraeg) ton = 1; /* die kleine Sekunde: unheimlich */
        a[i] = ton;
      });
    });
    /* Durchgangstöne bei hoher Intensität: zwischen zwei Tönen auf den Achteln */
    for (let i = 0; i < SCHRITTE; i++) if (a[i] === -2) {
      const vor = a[i - 1] >= 0 ? a[i - 1] : a[i - 2], nach = a.slice(i + 1).find(x => x >= 0);
      a[i] = vor >= 0 && nach >= 0 && nach !== vor ? Math.max(0, Math.min(7, vor + Math.sign(nach - vor))) : (vor >= 0 ? Math.min(7, vor + 1) : -1);
    }
    return a;
  }
  /* Echos Stimme: lange Töne, Antworten in den Pausen oder ferne Einzeltöne – meist eine Terz neben der Melodie */
  function echoBauen(bass, mel, art) {
    const a = leer();
    const setze = i => {
      const toene = akkordToene(klingt(bass, i)), m = mel[i];
      let wahl = toene.filter(t => m < 0 || (((t - m % 7) + 7) % 7 === 2 || ((t - m % 7) + 7) % 7 === 5));
      if (!wahl.length) wahl = toene;
      a[i] = naechsterTon(4, wahl);
    };
    if (art === "lang") [0, 4, 8, 12].forEach(i => { if (i % 8 === 0 || Math.random() < .6) setze(i); });
    else if (art === "fern") [0, 8].forEach(i => { if (Math.random() < .7) setze(i); });
    else for (let i = 0; i < SCHRITTE; i += 2) if (mel[i] < 0 && mel[(i + 15) % 16] < 0 && Math.random() < .8) setze(i);
    return a;
  }
  /* Intensität 0–10 (5 = wie komponiert): verdünnt oder verdichtet Melodie, Bass, Schlagwerk und Echo */
  function mitIntensitaet(st, stufe) {
    const x = (stufe == null ? 5 : stufe) / 10, o = Object.assign({}, st);
    o.dichte = x < .5 ? st.dichte * (.3 + 1.4 * x) : st.dichte;
    o.fuell = x > .5 ? (x - .5) * 1.1 : 0;
    const bassReihe = ["orgel", "halbe", "viertel", "puls", "galopp"];
    if (x <= .2) o.bass = ["orgel", "halbe"].filter(b => st.bass.includes(b)).concat(["halbe"]).slice(0, 1);
    else if (x <= .35) o.bass = st.bass.map(b => bassReihe[Math.max(1, bassReihe.indexOf(b) - 1)]);
    else if (x >= .8) o.bass = st.bass.map(b => b === "orgel" ? "halbe" : b === "halbe" ? "viertel" : b === "viertel" ? "puls" : b);
    const muster = liste => liste.map(m => {
      let n = m.slice();
      if (x < .5) n = n.filter(i => i === 0 || (i % 8 === 0 && x > .15) || (i % 4 === 0 && x > .3) || Math.random() < (x - .1) * 1.6);
      if (x > .6 && n.length) for (let i = 0; i < SCHRITTE; i += 2) if (!n.includes(i) && Math.random() < (x - .6) * (i % 4 === 0 ? 1.6 : .9)) n.push(i);
      if (x > .9 && n.length) for (let i = 1; i < SCHRITTE; i += 2) if (!n.includes(i) && Math.random() < .25) n.push(i);
      return n.sort((a, b) => a - b);
    });
    ["schelle", "trommel", "ketten"].forEach(k => { o[k] = muster(st[k]); });
    o.klopf = x < .25 ? [[]] : st.klopf;
    if (x < .3) o.echo = "fern"; else if (x > .75 && st.echo === "fern") o.echo = "antwort";
    o.rex = x < .3 ? [] : st.rex;
    o.schwung = x;
    return o;
  }
  /* Tempo zur Intensität: von etwas unter bis etwas über dem Stil-Rahmen */
  const tempoFuer = (st, stufe) => { const [a, b] = st.tempo, x = (stufe == null ? 5 : stufe) / 10; return Math.round((a - 8 + (b - a + 16) * x) / 2) * 2; };
  function stimmungTeile(st, alt) {
    /* ruhigerer Harmonierhythmus: eine Akkordfolge verteilt sich über zwei Teile (A = erste Hälfte, B = zweite) */
    const halb = (f, h) => [f[2 * h], f[2 * h], f[2 * h + 1], f[2 * h + 1]];
    const folge1 = zufall(st.akkorde), folge2 = zufall(st.akkorde);
    const p1 = halb(folge1, 0), p2 = halb(folge1, 1), p3 = halb(folge2, Math.random() < .5 ? 0 : 1);
    const bArt = zufall(st.bass), motiv = motivBauen(st), motiv2 = motivBauen(st);
    const rhy = (liste, i) => an(liste[Math.min(i, liste.length - 1)] || []);
    const teilVon = (akk, mel, fl, stufe) => {
      const t = teilLeer();
      t.bass = bassBauen(akk, bArt);
      t.melodie = mel; t.floete = fl;
      t.klopf = rhy(st.klopf, stufe); t.schelle = rhy(st.schelle, stufe); t.trommel = rhy(st.trommel, stufe); t.ketten = rhy(st.ketten, stufe);
      if (stufe === 1 && st.rex.length && Math.random() < .3) t.rex[15] = zufall(st.rex);
      return t;
    };
    const b1 = bassBauen(p1, bArt), b2 = bassBauen(p2, bArt), b3 = bassBauen(p3, bArt);
    const melA = melodieBauen(b1, motiv, st), melB = melodieBauen(b2, motiv, st, 1);
    const A = teilVon(p1, melA, st.echo === "antwort" ? echoBauen(b1, melA, "antwort") : leer(), 0);
    const B = teilVon(p2, melB, echoBauen(b2, melB, st.echo), 0);
    const flC = melodieBauen(b3, motiv2, st, 1);
    const C = teilVon(p3, leer(), flC, 0); C.melodie = b3.map((v, i) => i % 8 === 0 ? BASS_STUFEN[klingt(b3, i)] % 7 : -1);
    C.klopf = leer(); C.schelle = leer();
    const melD = melodieBauen(b1, motiv, st, 1);
    const D = teilVon(p1, melD, echoBauen(b1, melD, "lang"), 1);
    return { A, B, C, D };
  }
  function stimmungLied(k, behalten, stufe) {
    const roh = STIL[k], ist = stufe != null ? stufe : (typeof S.intensitaet === "number" ? S.intensitaet : 5), st = mitIntensitaet(roh, ist);
    const basis = behalten ? { tempo: S.tempo, transpose: S.transpose, modus: S.modus, instrument: S.instrument, band: S.band, ablauf: S.ablauf, swing: S.swing, bordun: S.bordun }
      : { tempo: tempoFuer(roh, ist) + zufall([-2, 0, 2]), transpose: zufall(st.transpose), modus: zufall(st.modus), instrument: zufall(st.instrument),
          band: { trommel: zufall(st.band.trommel), floete: zufall(st.band.floete), ketten: zufall(st.band.ketten) },
          ablauf: zufall(st.ablauf), swing: st.swing, bordun: st.bordun };
    return pruefen(Object.assign(basis, { variation: st.variation, teile: stimmungTeile(st), vol: S.vol, mute: S.mute, stimmung: k, intensitaet: ist }));
  }
  const kopie = o => JSON.parse(JSON.stringify(o));

  /* ---------- Zustand (gemerkt im Browser) ---------- */
  const MIX_START = () => ({
    vol: { klopf: 7, schelle: 5, bass: 8, melodie: 8, trommel: 7, floete: 6, ketten: 6, rex: 5 },
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
    if (typeof s.master !== "number") s.master = 8;
    if (typeof s.hall !== "number") s.hall = 0;
    if (!RAEUME[s.raum]) s.raum = "taverne";
    if (!KULISSEN.includes(s.kulisse)) s.kulisse = "keine";
    if (typeof s.kulisseVol !== "number") s.kulisseVol = 5;
    if (typeof s.intensitaet !== "number") s.intensitaet = 5;
    s.hallAus = Object.assign({ klopf: 0, schelle: 0, bass: 0, melodie: 0, trommel: 0, floete: 0, ketten: 0, rex: 0 }, s.hallAus || {});
    Object.keys(BAND).forEach(k => { if (!BAND[k].includes(s.band[k])) s.band[k] = BAND[k][0]; });
    if (typeof s.variation !== "number") s.variation = 0;
    if (!INSTRUMENTE.includes(s.instrument)) s.instrument = "laute";
    return s;
  }
  let S = pruefen(ausVorlage("taverne"));
  try {
    const g = JSON.parse(localStorage.getItem("imres-lautenwerk2") || "null");
    if (g && g.teile) S = pruefen(g);
  } catch (_) {}
  let zugeklappt = {};
  try { zugeklappt = JSON.parse(localStorage.getItem("imres-lautenwerk-zu") || "{}") || {}; } catch (_) {}
  let bearbeite = "A", kopierZiel = null;
  /* ---------- Eigene Lieder: lokal im Browser oder gemeinsam auf dem Server der Questtafel ---------- */
  const LIED_SERVER = { url: "https://iszdxkwkgkksdemtqhwu.supabase.co", key: "sb_publishable_Bt3Vw5BSnLaVcTRPTS0ZsA_MeG6G2-Z" };
  let lokaleLieder = [], gruppenLieder = [], gruppeOk = false, geladen = null, speicherForm = null;
  try { lokaleLieder = JSON.parse(localStorage.getItem("imres-lautenwerk-lieder") || "[]") || []; } catch (_) {}
  const lokalMerken = () => { try { localStorage.setItem("imres-lautenwerk-lieder", JSON.stringify(lokaleLieder)); } catch (_) {} };
  function liedServer(pfad, body) {
    const h = { apikey: LIED_SERVER.key, "Content-Type": "application/json" };
    if (/^eyJ/.test(LIED_SERVER.key)) h.Authorization = "Bearer " + LIED_SERVER.key;
    return fetch(LIED_SERVER.url + pfad, body === undefined ? { headers: h, cache: "no-store" } : { method: "POST", headers: h, body: JSON.stringify(body) })
      .then(r => r.ok ? (r.status === 204 ? null : r.json()) : Promise.reject(r.status));
  }
  function gruppeLaden() {
    return liedServer("/rest/v1/lieder?select=id,name,code,erstellt&order=erstellt.desc&limit=200")
      .then(l => { gruppenLieder = Array.isArray(l) ? l : []; gruppeOk = true; neuAuswahl(); })
      .catch(() => { gruppeOk = false; });
  }
  function eigeneAuswahl(T) {
    const opt = (q, l) => '<option value="' + q + ":" + esc(l.id) + '"' + (geladen && geladen.quelle === q && String(geladen.id) === String(l.id) ? " selected" : "") + ">" + esc(l.name) + "</option>";
    return '<select class="lw-gespeichert" data-feld="gespeichert" aria-label="' + esc(T.gespeichert(lokaleLieder.length + gruppenLieder.length)) + '">' +
      '<option value="">' + T.gespeichert(lokaleLieder.length + gruppenLieder.length) + "</option>" +
      (gruppenLieder.length ? '<optgroup label="' + esc(T.gruppe) + '">' + gruppenLieder.map(l => opt("g", l)).join("") + "</optgroup>" : "") +
      (lokaleLieder.length ? '<optgroup label="' + esc(T.lokal) + '">' + lokaleLieder.map(l => opt("l", l)).join("") + "</optgroup>" : "") +
      "</select>";
  }
  function neuAuswahl() { const alt = root.querySelector(".lw-gespeichert"); if (alt) alt.outerHTML = eigeneAuswahl(t()); }
  let liedPw = "";
  try { liedPw = localStorage.getItem("imres-tafel-pw") || ""; } catch (_) {}
  function passwort() {
    const pruefe = pw => liedServer("/rest/v1/rpc/tafel_pruefen", { passwort: pw }).then(ok => ok === true);
    return (liedPw ? pruefe(liedPw) : Promise.resolve(false)).then(ok => {
      if (ok) return liedPw;
      const pw = window.prompt(t().pwFrage, "");
      if (!pw) return null;
      return pruefe(pw).then(ok2 => {
        if (!ok2) { window.alert(t().pwFalsch); return null; }
        liedPw = pw; try { localStorage.setItem("imres-tafel-pw", pw); } catch (_) {}
        return pw;
      });
    });
  }
  const merken = () => { if (hoerer) return; try { localStorage.setItem("imres-lautenwerk2", JSON.stringify(S)); } catch (_) {} funkAenderung(); };

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
  const spurGain = {}, hallSend = {};
  let ausgang = null, hallEin = null, hallNass = null, hallNode = null, hallFilter = null;
  const hallCache = {};
  function hallBild(raum) {
    if (hallCache[raum]) return hallCache[raum];
    const r = RAEUME[raum], sr = ctx.sampleRate, len = Math.floor(sr * (r.dauer + r.vor + .05)), ir = ctx.createBuffer(2, len, sr), vor = Math.floor(sr * r.vor);
    for (let c = 0; c < 2; c++) {
      const d = ir.getChannelData(c);
      for (let i = vor; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - (i - vor) / (len - vor), r.kurve);
      /* frühe Reflexionen: einzelne Wandechos, links und rechts leicht versetzt */
      r.frueh.forEach(([z, a]) => { const i = Math.floor(sr * (z + c * .0031)); if (i < len) { d[i] += a * (c ? -1 : 1); if (i + 1 < len) d[i + 1] += a * .5; } });
      let e = 0; for (let i = 0; i < len; i++) e += d[i] * d[i];
      const f = 1 / Math.sqrt(e / sr * 2.2); /* gleiche Energie für alle Räume – sonst wären große Räume viel lauter */
      for (let i = 0; i < len; i++) d[i] *= f;
    }
    return (hallCache[raum] = ir);
  }
  function raumAnwenden() {
    if (!ctx || !hallEin) return;
    const neu = ctx.createConvolver();
    neu.buffer = hallBild(S.raum);
    if (hallNode) { try { hallFilter.disconnect(hallNode); hallNode.disconnect(); } catch (_) {} }
    hallFilter.connect(neu); neu.connect(hallNass); hallNode = neu;
    hallFilter.frequency.setTargetAtTime(RAEUME[S.raum].hell, ctx.currentTime, .05);
  }
  const masterPegel = () => Math.pow(S.master / 10, 1.5);
  const hallPegel = () => Math.pow(S.hall / 10, 1.3) * 1.6;
  /* ---------- Geräuschkulisse ---------- */
  let kul = null, kulRauschen = null, sfxBus = null;
  const kulPegel = () => Math.pow(S.kulisseVol / 10, 1.5) * .9;
  const zz = (a, b) => a + Math.random() * (b - a);
  function kulBett(ziel, filter, laut, lfo) {
    const r = ctx.createBufferSource(); r.buffer = kulRauschen; r.loop = true; r.loopStart = Math.random(); r.loopEnd = 3.9;
    let letzter = r;
    filter.forEach(([typ, f, q]) => { const b = ctx.createBiquadFilter(); b.type = typ; b.frequency.value = f; b.Q.value = q || .7; letzter.connect(b); letzter = b; });
    const g = ctx.createGain(); g.gain.value = laut; letzter.connect(g); g.connect(ziel);
    const knoten = [r];
    if (lfo) {
      const o = ctx.createOscillator(), og = ctx.createGain(); o.frequency.value = lfo[0]; og.gain.value = laut * lfo[1];
      o.connect(og); og.connect(g.gain); o.start(); knoten.push(o);
    }
    r.start(ctx.currentTime, Math.random() * 3); return knoten;
  }
  function kulStoss(zeit, typ, f, q, laut, dauer) {
    const r = ctx.createBufferSource(), b = ctx.createBiquadFilter(), g = ctx.createGain();
    r.buffer = kulRauschen; b.type = typ; b.frequency.value = f; b.Q.value = q;
    g.gain.setValueAtTime(laut, zeit); g.gain.exponentialRampToValueAtTime(.0005, zeit + dauer);
    r.connect(b); b.connect(g); g.connect(kul.g); r.start(zeit, Math.random() * 3, dauer + .02);
  }
  function kulTon(zeit, f0, f1, dauer, laut, typ) {
    const o = ctx.createOscillator(), g = ctx.createGain(); o.type = typ || "sine";
    o.frequency.setValueAtTime(f0, zeit); o.frequency.exponentialRampToValueAtTime(f1, zeit + dauer);
    g.gain.setValueAtTime(0, zeit); g.gain.linearRampToValueAtTime(laut, zeit + .008); g.gain.exponentialRampToValueAtTime(.0005, zeit + dauer + .05);
    o.connect(g); g.connect(kul.g); o.start(zeit); o.stop(zeit + dauer + .08);
  }
  /* Ereignisse je Kulisse: [mindestens, höchstens Sekunden bis zum nächsten, Funktion] */
  const KUL_EREIGNIS = {
    regen: [[.015, .07, z => kulStoss(z, "bandpass", zz(2500, 6500), 6, zz(.04, .16), .015)]],
    feuer: [[5, 13, z => { kulStoss(z, "bandpass", zz(600, 1100), 3, .5, .03); kulStoss(z + .04, "bandpass", zz(1200, 2000), 4, .2, .02); }]],
    hoehle: [[1.2, 4, z => { const f = zz(1300, 2100); kulTon(z, f, f * .55, .07, .45); }]],
    taverne: [[3.5, 11, z => kulFx("lachen", z, zz(.3, .75))], [1.8, 6, z => kulFx("krug", z, zz(.15, .45))]],
    wald: [[1.5, 5.5, z => { const f = zz(2600, 4200), n = 2 + Math.floor(Math.random() * 4); for (let i = 0; i < n; i++) kulTon(z + i * .11, f, f * 1.3, .06, .14); }]],
    meer: [[6, 14, z => { for (let i = 0; i < 2 + Math.floor(Math.random() * 2); i++) kulTon(z + i * .45, 1700, 1150, .35, .045, "triangle"); }]],
    sturm: [[12, 25, z => effekt("donner", .7, z)]]
  };
  const KUL_BETT = {
    regen: [[["bandpass", 2500, .5]], .5, [.13, .25]], feuer: null,
    hoehle: [[["bandpass", 250, .8]], .9, [.06, .6]], wald: [[["lowpass", 700, .7]], .8, [.1, .7]],
    meer: [[["lowpass", 500, .7]], .55, [.11, .9]], sturm: [[["bandpass", 600, .5]], .5, [.17, .8]],
    taverne: null
  };
  function kulisseStart(sofort) {
    if (!ctx) return;
    kulisseStop();
    const art = S.kulisse;
    if (art === "keine" || (!laeuft && !sofort)) return;
    const g = ctx.createGain(), j = ctx.currentTime;
    g.gain.setValueAtTime(0, j); g.gain.linearRampToValueAtTime(kulPegel(), j + 2.5);
    g.connect(master);
    const send = ctx.createGain(); send.gain.value = art === "hoehle" ? .9 : .3; g.connect(send); send.connect(hallEin);
    kul = { art, g, knoten: [], naechst: {} };
    const bett = KUL_BETT[art];
    if (bett) kul.knoten.push(...kulBett(g, bett[0], bett[1], bett[2]));
    if (art === "taverne") kulSchleife("gemurmel", 22050, 1.1);
    if (art === "feuer") kulSchleife("feuer", 32000, .7);
    if (art === "regen") kul.knoten.push(...kulBett(g, [["lowpass", 900, .7]], .2, null));
    if (art === "meer") kul.knoten.push(...kulBett(g, [["highpass", 2500, .7]], .12, [.11, .9]));
    if (art === "sturm") kul.knoten.push(...kulBett(g, [["highpass", 1500, .7]], .25, null));
    const ev = KUL_EREIGNIS[art] || [];
    kul.timer = setInterval(() => {
      if (!kul) return;
      const jetzt = ctx.currentTime;
      ev.forEach(([a, b, f], i) => {
        if (kul.naechst[i] == null) kul.naechst[i] = jetzt + zz(a, b);
        while (kul.naechst[i] < jetzt + .3) { try { f(Math.max(jetzt, kul.naechst[i])); } catch (_) {} kul.naechst[i] += zz(a, b); }
      });
    }, 100);
  }
  function kulisseStop() {
    if (!kul) return;
    const k = kul; kul = null; clearInterval(k.timer);
    const j = ctx.currentTime;
    k.g.gain.cancelScheduledValues(j); k.g.gain.setValueAtTime(k.g.gain.value, j); k.g.gain.linearRampToValueAtTime(0, j + 1.5);
    setTimeout(() => { k.knoten.forEach(n => { try { n.stop(); } catch (_) {} }); try { k.g.disconnect(); } catch (_) {} }, 1700);
  }

  /* ---------- Soundeffekte für den Spielleiter ---------- */
  /* ---------- gerechnete Klänge (klangwerk.js, im Hintergrund-Worker) ---------- */
  let kwWorker = null, kwNr = 0;
  const kwWarten = new Map(), kulPufferCache = {}, fxVorrat = {};
  function kwSync(gruppe, art, sr) {
    const K = window.Klangwerk;
    try { return K ? (gruppe === "kulisse" ? K.KULISSE : K.EFFEKT)[art](sr) : null; } catch (_) { return null; }
  }
  function kwStart() {
    try {
      const sk = document.querySelector('script[src*="klangwerk"]');
      kwWorker = new Worker(sk ? sk.src : "klangwerk.js");
      kwWorker.onmessage = e => { const w = kwWarten.get(e.data.id); if (!w) return; kwWarten.delete(e.data.id); w.fertig(e.data.daten); };
      kwWorker.onerror = ev => {
        if (ev && ev.preventDefault) ev.preventDefault();
        kwWorker = false; const alle = [...kwWarten.values()]; kwWarten.clear();
        alle.forEach((w, i) => setTimeout(() => w.fertig(kwSync(w.gruppe, w.art, w.sr)), 30 * i));
      };
    } catch (_) { kwWorker = false; }
  }
  function kwRechnen(gruppe, art, sr) {
    return new Promise(res => {
      const fertig = d => { if (!d || !ctx) return res(null); const b = ctx.createBuffer(1, d.length, sr); b.getChannelData(0).set(d); res(b); };
      if (kwWorker === null) kwStart();
      if (!kwWorker) { setTimeout(() => fertig(kwSync(gruppe, art, sr)), 0); return; }
      const id = ++kwNr; kwWarten.set(id, { gruppe, art, sr, fertig }); kwWorker.postMessage({ id, gruppe, art, sr });
    });
  }
  const kulPuffer = (name, sr) => kulPufferCache[name] || (kulPufferCache[name] = kwRechnen("kulisse", name, sr).then(b => { if (!b) delete kulPufferCache[name]; return b; }));
  function kulSchleife(name, sr, laut) {
    const k = kul;
    kulPuffer(name, sr).then(b => {
      if (!b || kul !== k) return;
      const q = ctx.createBufferSource(), g = ctx.createGain(); q.buffer = b; q.loop = true; g.gain.value = laut;
      q.connect(g); g.connect(k.g); q.start(ctx.currentTime + .05, Math.random() * b.duration); k.knoten.push(q);
    });
  }
  /* je Effekt liegen zwei fertige Varianten bereit; nach dem Abspielen wird eine neue gerechnet */
  function fxNachfuellen(art) {
    const v = fxVorrat[art] = fxVorrat[art] || { liste: [], rechnet: 0 };
    while (v.liste.length + v.rechnet < 2) { v.rechnet++; kwRechnen("effekt", art, 32000).then(b => { v.rechnet--; if (b) v.liste.push(b); }); }
  }
  function fxPuffer(art) {
    const v = fxVorrat[art];
    if (v && v.liste.length) { const b = v.liste.splice(Math.floor(Math.random() * v.liste.length), 1)[0]; fxNachfuellen(art); return Promise.resolve(b); }
    const p = kwRechnen("effekt", art, 32000); fxNachfuellen(art); return p;
  }
  function fxAbspielen(art, ziel, zeit, laut, tempo) {
    return fxPuffer(art).then(b => {
      if (!b || !ctx) return;
      const q = ctx.createBufferSource(), g = ctx.createGain(); q.buffer = b; q.playbackRate.value = tempo || 1; g.gain.value = laut;
      q.connect(g); g.connect(ziel); q.start(Math.max(zeit, ctx.currentTime + .01));
    });
  }
  function kulFx(art, z, laut) { const k = kul; if (k) fxAbspielen(art, k.g, z, laut, zz(.94, 1.06)); }
  /* Grundpegel je Effekt (die gerechneten Klänge sind auf gleiche Spitze gebracht) */
  const FX_PEGEL = { drache: .6, schwert: .45, tuer: .6, donner: .5, schrei: .33, wuerfel: .9, zauber: .4, horn: .4, jubel: .55,
    tusch: .7, posaune: .3, krit: .6, dramatisch: .5, grillen: .45, ooh: .5, muenzen: .6, ruelpser: .55, schnarchen: .8, bonk: .8 };
  function fxVorwaermen() { if (kwWorker !== false) ALLE_FX.forEach((f, i) => setTimeout(() => fxNachfuellen(f), 200 * i)); }
  function effekt(art, staerke, zeit) {
    if (!ctx) return;
    const z = Math.max(zeit || 0, ctx.currentTime + .02), l = staerke || 1;
    fxAbspielen(art, sfxBus, z, (FX_PEGEL[art] || .7) * l);
  }
  function effekteAnwenden() {
    if (!ctx) return;
    const j = ctx.currentTime;
    if (ausgang) ausgang.gain.setTargetAtTime(.6 * masterPegel(), j, .05);
    if (hallNass) hallNass.gain.setTargetAtTime(hallPegel(), j, .08);
    if (kul) kul.g.gain.setTargetAtTime(kulPegel(), j, .1);
    IDS.forEach(k => hallSend[k] && hallSend[k].gain.setTargetAtTime(S.hallAus[k] ? 0 : 1, j, .05));
  }
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
      komp.threshold.value = -16; komp.knee.value = 12; komp.ratio.value = 2; komp.attack.value = .01; komp.release.value = .3;
      ausgang = ctx.createGain(); ausgang.gain.value = .6 * masterPegel();
      const limiter = ctx.createDynamicsCompressor();
      limiter.threshold.value = -4; limiter.knee.value = 2; limiter.ratio.value = 20; limiter.attack.value = .003; limiter.release.value = .25;
      master = ctx.createGain(); master.gain.value = .45;
      master.connect(komp); komp.connect(ausgang); ausgang.connect(limiter); limiter.connect(ctx.destination);
      IDS.forEach(k => { const g = ctx.createGain(); g.connect(master); spurGain[k] = g; });
      /* Raumhall: jede Spur schickt einen Teil in einen Faltungshall (selbst erzeugter Raum, ca. 2,8 s) */
      hallEin = ctx.createGain(); hallNass = ctx.createGain(); hallNass.gain.value = hallPegel();
      kulRauschen = ctx.createBuffer(1, ctx.sampleRate * 4, ctx.sampleRate);
      { const d = kulRauschen.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }
      sfxBus = ctx.createGain(); sfxBus.gain.value = 1; sfxBus.connect(master); setTimeout(fxVorwaermen, 1500);
      { const s2 = ctx.createGain(); s2.gain.value = .5; sfxBus.connect(s2); s2.connect(hallEin); }
      hallFilter = ctx.createBiquadFilter(); hallFilter.type = "lowpass"; hallFilter.frequency.value = RAEUME[S.raum].hell;
      hallEin.connect(hallFilter); hallNass.connect(komp);
      raumAnwenden();
      IDS.forEach(k => { const g = ctx.createGain(); g.gain.value = S.hallAus[k] ? 0 : 1; spurGain[k].connect(g); g.connect(hallEin); hallSend[k] = g; });
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
      schlagTon(z, "sine", betont ? 92 : 84, betont ? 60 : 56, betont ? .7 : .5, (betont ? 1 : .75) * l, zeit, .2);
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
      schlagTon(z, "sine", 95, 45, .22, .7 * l, zeit, .1);
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
    f.type = "lowpass"; f.frequency.value = 480; f.Q.value = .3;
    g.gain.setValueAtTime(0, ctx.currentTime); g.gain.linearRampToValueAtTime(.06, ctx.currentTime + 1.2);
    const oscs = [0, 7].map(() => { const o = ctx.createOscillator(); o.type = "triangle"; o.connect(f); o.start(); return o; });
    f.connect(g); g.connect(master);
    bordunTeile = { oscs, g };
    bordunStimmen(0, ctx.currentTime);
  }
  /* Der Bordun wandert mit dem Bass: Grundton und – nur wenn sie rein ist – Quinte des klingenden Akkords.
     Ein starrer Dauerton würde sich sonst bei jedem Akkordwechsel reiben. */
  function bordunStimmen(bassZeile, zeit) {
    if (!bordunTeile) return;
    const sk = MODI[S.modus], stufe = BASS_STUFEN[bassZeile || 0];
    const grund = BASS_GRUND - 12 + S.transpose + sk[stufe];
    const quinte = (((sk[(stufe + 4) % 7] + (stufe + 4 >= 7 ? 12 : 0)) - sk[stufe]) === 7) ? grund + 7 : grund + 12;
    const z = Math.max(zeit || 0, ctx.currentTime);
    [grund, quinte].forEach((m, i) => bordunTeile.oscs[i].frequency.setTargetAtTime(midiHz(m), z, .06));
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
  let pausiert = false;
  let laeuft = false, schritt = 0, abschnitt = 0, naechste = 0, timer = null;
  const anzeige = [];
  let wechsel = null, tempoJetzt = 0, intensitaetNeu = false;
  const schrittDauer = () => 60 / (tempoJetzt || S.tempo) / 4;
  /* Wechsel am Taktanfang: neues Stück übernehmen, Tempo gleitet, kurzer Lautstärke-Atemzug */
  function wechselAnwenden(zeit) {
    const neu = wechsel; wechsel = null;
    S = neu; abschnitt = 0;
    if (ausgang) {
      const ziel = .6 * masterPegel();
      ausgang.gain.cancelScheduledValues(zeit - .3);
      ausgang.gain.setTargetAtTime(ziel * .72, Math.max(ctx.currentTime, zeit - .25), .08);
      ausgang.gain.setTargetAtTime(ziel, zeit + .05, .6);
    }
    setTimeout(() => {
      merken(); zeichnen(); knoepfe();
      bordunAus(); if (S.bordun) setTimeout(bordunAn, 450);
      kulisseStart();
    }, 0);
  }
  function planen() {
    const vorlauf = document.hidden ? 1.6 : .3; /* im Hintergrund weit vorausplanen, damit die Musik weiterläuft */
    while (naechste < ctx.currentTime + vorlauf) {
      if (schritt === 0 && wechsel) wechselAnwenden(naechste);
      else if (schritt === 0 && intensitaetNeu) { intensitaetNeu = false; stimmungWeiter(); }
      tempoJetzt = tempoJetzt ? tempoJetzt + (S.tempo - tempoJetzt) * .1 : S.tempo;
      const teilName = S.ablauf[abschnitt % S.ablauf.length] || "A", daten = S.teile[teilName];
      const v = S.variation / 10, letzterTakt = abschnitt % S.ablauf.length === S.ablauf.length - 1;
      const versatz = S.swing && schritt % 2 === 1 ? schrittDauer() * .33 : 0;
      const ev = { schritt, teil: teilName, zeit: naechste + versatz, spuren: {} };
      IDS.forEach(k => {
        if (S.mute[k]) return;
        const wert = variiert(k, daten[k][schritt], schritt, daten[k], v, letzterTakt);
        if (wert < 0) return;
        const wackel = v ? (Math.random() - .5) * .012 * v : 0;
        const laut = (v ? 1 - Math.random() * .25 * v : 1) * (S.stimmung ? .8 + .04 * S.intensitaet : 1);
        const haelt = k === "floete" || (k === "melodie" && (GEHALTEN[S.instrument] || S.instrument === "mandoline"));
        spielen(k, wert, ev.zeit + Math.max(0, wackel), schritt, laut, haelt ? notenLaenge(daten[k], schritt) * schrittDauer() * .95 : 0);
        if (k === "bass") bordunStimmen(wert, ev.zeit);
        ev.spuren[k] = wert;
      });
      anzeige.push(ev);
      naechste += schrittDauer();
      schritt = (schritt + 1) % SCHRITTE;
      if (schritt === 0) {
        abschnitt = (abschnitt + 1) % S.ablauf.length;
        /* Stimmung: nach jedem Durchgang ein leicht abgewandeltes neues Stück */
        if (abschnitt === 0 && S.stimmung && STIL[S.stimmung] && !hoerer) setTimeout(stimmungWeiter, 0);
      }
    }
  }
  function stimmungWeiter() {
    if (!S.stimmung || !STIL[S.stimmung]) return;
    const neu = stimmungLied(S.stimmung, true);
    S.teile = neu.teile; S.tempo = tempoFuer(STIL[S.stimmung], S.intensitaet);
    merken(); if (!S.pult) { zeichnen(); knoepfe(); }
  }
  function start(weiter) {
    audioStart();
    saitenVorbereiten();
    if (!weiter) { schritt = 0; abschnitt = 0; }
    tempoJetzt = S.tempo; wechsel = null;
    kulisseStart();
    laeuft = true; pausiert = false; naechste = ctx.currentTime + .1; anzeige.length = 0;
    planen(); timer = setInterval(planen, 30);
    bordunAn();
    requestAnimationFrame(malen);
    knoepfe(); funkAenderung();
  }
  function stopp(pause) {
    laeuft = false; pausiert = !!pause; clearInterval(timer); bordunAus(); kulisseStop(); wechsel = null;
    spalte(-1); teilAnzeige(null); knoepfe(); funkAenderung();
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
  /* Barradins Hände je Instrument: [Greifhand x, y, Bogen des Arms], [Schlaghand x, y, Ellbogen-Pfad], eigene Bewegungen */
  const ARME = {
    laute: { griff: [205, 96, "Q165 100"], schlag: [161, 126, "Q104 124 118 128 L"] },
    mandoline: { griff: [192, 100, "Q160 104"], schlag: [158, 132, "Q104 126 118 132 L"] },
    harfe: { griff: [182, 92, "Q155 90"], schlag: [162, 118, "Q104 120 118 124 L"] },
    fidel: { griff: [196, 97, "Q160 102"], schlag: [163, 125, "Q104 124 118 128 L"],
      bewegung: { bass: [[".barradin .arm-schlag", "translate(-7px, 7px)", 260]], klopf: [[".barradin .arm-schlag", "translate(5px, -5px)", 220]] } },
    drehleier: { griff: [176, 118, "Q150 116"], schlag: [160, 128, "Q104 126 118 132 L"],
      bewegung: { bass: [[".barradin .arm-schlag", "translate(-3px, 5px)", 260]] } },
    schalmei: { griff: [163, 83, "Q140 96"], schlag: [185, 89, "Q112 128 148 114 L"],
      bewegung: { bass: [[".barradin .arm-schlag", "translate(0, 1.5px)", 160]], klopf: [[".barradin .arm-schlag", "translate(0, 1.5px)", 160]], mel: [[".barradin .hand-griff", "translate(0, 1.5px)", 160]] } },
    illusion: { griff: [163, 83, "Q140 96"], schlag: [185, 89, "Q112 128 148 114 L"],
      bewegung: { bass: [[".barradin .arm-schlag", "translate(0, 1.5px)", 160]], klopf: [[".barradin .arm-schlag", "translate(0, 1.5px)", 160]], mel: [[".barradin .hand-griff", "translate(0, 1.5px)", 160]] } },
    dudelsack: { griff: [150, 128, "Q118 126"], schlag: [168, 137, "Q104 132 120 138 L"],
      bewegung: { bass: [[".barradin .arm-schlag", "translate(0, 2px)", 160]], klopf: [[".barradin .arm-griff", "translate(1px, 2px)", 220]], mel: [[".barradin .hand-griff", "translate(0, 2px)", 160]] } },
    glocken: { griff: [197, 99, "Q160 104"], schlag: [160, 128, "Q104 126 118 132 L"],
      bewegung: { mel: [[".barradin .hand-griff", "translate(-2px, 6px)", 200]] } }
  };
  function armeSetzen() {
    const fig = root.querySelector(".lw-buehne .barradin"); if (!fig) return;
    const a = ARME[S.instrument] || ARME.laute, [gx, gy, gb] = a.griff, [sx, sy, sb] = a.schlag;
    const q = sel => fig.querySelector(sel);
    q(".arm-griff").setAttribute("d", "M122 96 " + gb + " " + (gx - 4) + " " + gy);
    q(".griff-deko").setAttribute("d", "M" + (gx - 16) + " " + (gy - 4) + " l0 8");
    const h = q(".hand-griff"); h.setAttribute("cx", gx); h.setAttribute("cy", gy); h.style.transformOrigin = gx + "px " + gy + "px";
    q(".schlag-arm").setAttribute("d", "M118 98 " + sb + " " + (sx - 5) + " " + sy);
    q(".schlag-deko").setAttribute("d", "M" + (sx - 11) + " " + (sy - 4) + " l0 8");
    const sh = q(".schlag-hand"); sh.setAttribute("cx", sx); sh.setAttribute("cy", sy);
    q(".schlag-finger").setAttribute("d", "M" + (sx + 3) + " " + (sy - 5) + " q4 1 5 4 M" + (sx + 4) + " " + sy + " q4 1 5 4");
  }
  /* Bewegungen der Band über die Web-Animations-Schnittstelle (ruckelt nicht) */
  const BEWEGUNG = {
    klopf: [[".barradin .kopf", "rotate(6deg) translateY(2px)", 280], [".barradin .arm-schlag", "translate(-1px, 4px)", 180], [".barradin .laute", "rotate(-1.5deg)", 200]],
    schelle: [[".barradin .fuss", "rotate(-8deg)", 200]],
    bass: [[".barradin .arm-schlag", "translate(4px, 5px) rotate(-2deg)", 220]],
    mel: [[".barradin .hand-griff", "translate(-6px, 4px) scale(1.15)", 250]],
    trommel: [[".friedrich .f-arm", "rotate(14deg)", 200], [".friedrich .f-kopf", "rotate(6deg) translateY(2px)", 280]],
    floete: [[".echo .e-koerper", "rotate(-2.5deg)", 500]],
    ketten: [[".ezekiel .z-req", "rotate(8deg)", 280], [".ezekiel .z-kopf", "rotate(6deg) translateY(2px)", 300]],
    wuff: [[".rex .r-kopf", "rotate(-14deg) translateY(-2px)", 250]],
    heul: [[".rex .r-kopf", "rotate(-32deg) translate(-2px, -3px)", 1300]]
  };
  const LEUCHTEN = { mel: ".barradin .saiten", bass: ".barradin .saiten", trommel: ".friedrich .f-req", schelle: ".barradin .schellring", ketten: ".ezekiel .augen" };
  let figurCache = {};
  const figur = sel => figurCache[sel] || (figurCache[sel] = root.querySelector(".lw-buehne " + sel));
  function zucken(art) {
    if (ruhig) return;
    const eigen = ARME[S.instrument] && ARME[S.instrument].bewegung;
    ((eigen && eigen[art]) || BEWEGUNG[art] || []).forEach(([sel, ziel, dauer]) => {
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
 <defs>
  <radialGradient id="lw-glut" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#ffb347"/><stop offset=".5" stop-color="#ff5a2e"/><stop offset="1" stop-color="#ff5a2e" stop-opacity="0"/></radialGradient>
  <linearGradient id="lw-robe" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f4f1e8"/><stop offset="1" stop-color="#b9b4a6"/></linearGradient>
  <linearGradient id="lw-kapuze" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#a3241b"/><stop offset="1" stop-color="#4a0e0b"/></linearGradient>
 </defs>
 <!-- Friedrich: Waldläufer mit langem braunem Haar, Pelzkragen, Lederrüstung, Köcher – an der Trommel -->
 <svg x="0" y="10" width="130" height="200" viewBox="0 0 130 200" class="friedrich" overflow="visible">
  <ellipse cx="66" cy="192" rx="52" ry="5" fill="rgba(0,0,0,.45)"/>
  <path d="M27 78 Q22 92 30 100" fill="none" stroke="#6b4a2a" stroke-width="3"/>
  <path d="M20 60 Q8 104 26 150" fill="none" stroke="#7a5230" stroke-width="3" stroke-linecap="round"/>
  <path d="M20 60 L26 150" stroke="#d8c49a" stroke-width=".6" opacity=".7"/>
  <rect x="30" y="74" width="9" height="34" rx="3" transform="rotate(-14 34 90)" fill="#5a3a20" stroke="#2a1a10" stroke-width="1"/>
  <path d="M30 72 l-3 -8 M34 71 l0 -9 M38 72 l3 -8" stroke="#c9b48a" stroke-width="2.2" stroke-linecap="round"/>
  <path d="M48 150 L46 189 M62 150 L64 189" stroke="#4a3a28" stroke-width="10" stroke-linecap="round"/>
  <path d="M38 190 h14 M58 190 h14" stroke="#2a1d14" stroke-width="6" stroke-linecap="round"/>
  <path d="M34 152 Q30 120 38 98 Q52 88 68 94 Q76 112 72 152 Z" fill="#3f5a32" stroke="#22301c" stroke-width="1.2"/>
  <path d="M37 132 Q36 110 40 100 Q54 94 66 100 Q70 116 69 132 Z" fill="#6b4627" stroke="#3a2412" stroke-width="1.2"/>
  <path d="M40 104 L66 128 M66 104 L44 128" stroke="#4a2e18" stroke-width="2.4"/>
  <path d="M36 130 H71" stroke="#3a2412" stroke-width="3.5"/><rect x="50" y="127" width="6" height="6" fill="#c9a24a"/>
  <path d="M30 100 Q32 86 46 86 Q52 92 60 86 Q74 86 74 100 Q66 96 60 98 Q52 102 44 98 Q36 96 30 100 Z" fill="#cdb48a" stroke="#8a7350" stroke-width="1"/>
  <path d="M34 96 l3 -4 M42 92 l2 -4 M66 92 l2 -4 M71 96 l3 -3" stroke="#f0e2c0" stroke-width="1.2" stroke-linecap="round"/>
  <g class="f-kopf">
   <path d="M38 66 Q36 90 42 98 L48 86 Z M66 66 Q70 88 62 98 L58 86 Z" fill="#5a3a20"/>
   <path d="M48 82 h9 v8 h-9 Z" fill="#c48c66"/>
   <ellipse cx="52" cy="72" rx="12" ry="13.5" fill="#d9a07a"/>
   <path d="M40 72 Q41 90 52 90 Q63 90 64 72 Q62 82 58 81 Q52 84 46 81 Q42 82 40 72 Z" fill="#6b4423" opacity=".9"/>
   <path d="M47 80 Q52 77 57 80" fill="none" stroke="#5a3a20" stroke-width="2"/>
   <path d="M38 72 Q36 54 52 54 Q68 54 66 70 Q62 60 56 60 Q50 62 44 60 Q40 64 40 76 Z" fill="#6b4423"/>
   <path d="M44 58 Q48 54 56 56" fill="none" stroke="#8a5a32" stroke-width="1.2"/>
   <circle cx="47" cy="71" r="1.4" fill="#2a1a10"/><circle cx="57" cy="71" r="1.4" fill="#2a1a10"/>
   <path d="M44 67 q2.5 -2 5 0 M55 67 q2.5 -2 5 0" stroke="#4a2e18" stroke-width="1.6" fill="none"/>
   <path d="M47.5 82 Q52 86 56.5 82" fill="none" stroke="#f2e6d6" stroke-width="1.6" stroke-linecap="round"/>
  </g>
  <g class="f-req">
  <g class="req f-trommel">
   <path d="M83 150 L74 192 M97 150 L97 192 M111 150 L120 192" stroke="#5a3a20" stroke-width="2.5"/>
   <path d="M71 138 L71 150 Q97 160 123 150 L123 138 Q97 146 71 138 Z" fill="#8a5a32" stroke="#3a2412" stroke-width="1"/>
   <path d="M75 141 L80 152 L86 143 L92 154 L98 145 L104 154 L110 143 L116 152 L120 141" fill="none" stroke="#d8c49a" stroke-width="1"/>
   <ellipse class="trommelfell" cx="97" cy="138" rx="26" ry="8" fill="#e8d9b5" stroke="#8a5a32" stroke-width="1.5"/></g>
  <g class="req f-bodhran">
   <path d="M83 144 L74 192 M97 144 L97 192 M111 144 L120 192" stroke="#5a3a20" stroke-width="2.5"/>
   <path d="M70 137 L70 142 Q97 151 124 142 L124 137 Q97 146 70 137 Z" fill="#5a3a20" stroke="#2a1a10" stroke-width="1"/>
   <ellipse cx="97" cy="137" rx="27" ry="8.5" fill="#efe2c2" stroke="#5a3a20" stroke-width="1.5"/>
   <path d="M89 137 q8 -6 16 0 q-8 6 -16 0 Z M93 134 q4 6 8 0" fill="none" stroke="#3f5a32" stroke-width="1"/></g>
  <g class="req f-pauke">
   <path d="M78 168 L72 192 M116 168 L122 192" stroke="#5a3a20" stroke-width="3"/>
   <path d="M68 138 Q70 174 97 177 Q124 174 126 138 Q97 147 68 138 Z" fill="#b87333" stroke="#6b3f1a" stroke-width="1.2"/>
   <path d="M74 150 Q97 158 120 150 M79 164 Q97 170 115 164" fill="none" stroke="#e0a05a" stroke-width="1" opacity=".7"/>
   <ellipse cx="97" cy="138" rx="29" ry="8.5" fill="#efe2c2" stroke="#6b3f1a" stroke-width="1.6"/></g>
  <g class="req f-tamburin">
   <path d="M83 142 L74 192 M97 142 L97 192 M111 142 L120 192" stroke="#5a3a20" stroke-width="2.5"/>
   <ellipse cx="97" cy="138" rx="22" ry="7" fill="#efe2c2" stroke="#8a5a32" stroke-width="4"/>
   <g fill="#e0a046" stroke="#8a6a24" stroke-width=".5"><circle cx="76" cy="138" r="2.2"/><circle cx="84" cy="143" r="2.2"/><circle cx="97" cy="145.5" r="2.2"/><circle cx="110" cy="143" r="2.2"/><circle cx="118" cy="138" r="2.2"/><circle cx="97" cy="131" r="2"/></g></g>
  <g class="req f-stoecke">
   <path d="M86 142 L80 192 M108 142 L114 192" stroke="#5a3a20" stroke-width="2.5"/>
   <rect x="78" y="130" width="38" height="13" rx="5" fill="#8a5a32" stroke="#3a2412" stroke-width="1"/>
   <ellipse cx="116" cy="136.5" rx="3" ry="6.2" fill="#c9934f" stroke="#3a2412" stroke-width=".8"/>
   <path d="M84 134 h20 M82 139 h26" stroke="#6b4423" stroke-width=".8"/></g>
  </g>
  <path d="M40 104 Q46 124 66 129" fill="none" stroke="#6b4627" stroke-width="8" stroke-linecap="round"/>
  <circle cx="68" cy="129" r="5" fill="#d9a07a"/><path d="M68 129 L82 139" stroke="#d8c49a" stroke-width="2.5" stroke-linecap="round"/>
  <g class="f-arm"><path d="M64 100 Q84 110 90 124" fill="none" stroke="#6b4627" stroke-width="9" stroke-linecap="round"/>
   <path d="M82 114 l6 5" stroke="#3a2412" stroke-width="7" stroke-linecap="round"/>
   <circle cx="91" cy="126" r="5" fill="#d9a07a"/><path d="M91 126 L104 136" stroke="#d8c49a" stroke-width="2.5" stroke-linecap="round"/></g>
 </svg>
 <!-- Barradin: kupferrote Locken, breites Grinsen, schwarze Lederjacke mit Gold – auf dem Fass mit Laute -->
 <svg x="95" y="10" width="280" height="200" viewBox="0 0 280 200" class="barradin" overflow="visible">
  <ellipse cx="125" cy="192" rx="80" ry="6" fill="rgba(0,0,0,.45)"/>
  <g class="fass"><path d="M78 150 Q74 172 80 194 L132 194 Q138 172 134 150 Z" fill="#3a2a1c" stroke="#8a6a44" stroke-width="2"/>
   <path d="M77 162 H135 M77 182 H135" stroke="#6b5130" stroke-width="3"/></g>
  <path d="M104 150 Q130 146 150 152 L156 186" fill="none" stroke="#1c1712" stroke-width="13" stroke-linecap="round" stroke-linejoin="round"/>
  <g class="fuss"><path d="M126 154 Q150 156 166 160 L170 188" fill="none" stroke="#15110e" stroke-width="13" stroke-linecap="round" stroke-linejoin="round"/>
   <path d="M162 186 Q172 183 186 190 L186 194 L160 194 Z" fill="#2a1d14" stroke="#c9a24a" stroke-width="1.5"/>
   <g class="schellring"><circle cx="164" cy="181" r="2.4" fill="#e0a046"/><circle cx="170" cy="182" r="2.4" fill="#e0a046"/><circle cx="176" cy="181" r="2.4" fill="#e0a046"/></g></g>
  <path d="M150 186 Q160 183 172 190 L172 194 L146 194 Z" fill="#2a1d14" stroke="#c9a24a" stroke-width="1.5"/>
  <g class="koerper">
   <path d="M96 150 Q92 118 100 96 Q112 84 128 88 Q138 104 132 150 Z" fill="#17131a" stroke="#c9a24a" stroke-width="1.4"/>
   <path d="M114 92 L114 148" stroke="#c9a24a" stroke-width="1.6"/>
   <path d="M104 104 q5 4 0 8 q-5 4 0 8 q5 4 0 8 M124 104 q-5 4 0 8 q5 4 0 8 q-5 4 0 8" fill="none" stroke="#c9a24a" stroke-width="1.1"/>
   <path d="M100 140 H130" stroke="#3a2a1c" stroke-width="4"/><rect x="111" y="137" width="7" height="6" rx="1" fill="#e0b24a"/>
   <path d="M106 94 Q114 112 122 94" fill="none" stroke="#e0b24a" stroke-width="1.6"/>
   <path d="M108 94 Q114 118 120 94" fill="none" stroke="#e0b24a" stroke-width="1" opacity=".8"/>
   <path class="arm-griff" d="M122 96 Q160 92 196 84" fill="none" stroke="#17131a" stroke-width="10" stroke-linecap="round"/>
   <path class="griff-deko" d="M150 92 l6 -1 M170 89 l6 -1" stroke="#c9a24a" stroke-width="2.2"/>
   <path d="M95 98 Q98 88 110 88 L108 100 Q100 102 95 98 Z M134 98 Q130 88 120 88 L122 100 Q130 101 134 98 Z" fill="#a8823a" stroke="#e0b24a" stroke-width="1"/>
   <path d="M108 74 L109 90 L121 90 L121 74 Z" fill="#d6a37c"/>
   <g class="kopf"><g transform="translate(0 6)">
    <path d="M100 66 Q97 46 114 42 Q131 40 133 56 Q134 72 122 77 Q108 80 100 66 Z" fill="#e0ad86"/>
    <path d="M102 58 L92 50 L103 64 Z" fill="#e0ad86" stroke="#b07e5c" stroke-width="1"/>
    <circle cx="101" cy="64" r="1.6" fill="none" stroke="#e0b24a" stroke-width="1.2"/>
    <g fill="#b0521f" stroke="#7a3410" stroke-width=".8">
     <circle cx="100" cy="50" r="7"/><circle cx="108" cy="40" r="8"/><circle cx="120" cy="36" r="8.5"/><circle cx="132" cy="42" r="7.5"/>
     <circle cx="137" cy="52" r="5.5"/><circle cx="96" cy="58" r="5"/><circle cx="114" cy="31" r="6"/><circle cx="127" cy="31" r="5.5"/>
    </g>
    <path d="M104 46 q4 -6 10 -4 M118 40 q6 -4 12 2 M108 36 q4 -4 9 -2" fill="none" stroke="#e0763a" stroke-width="1.4" stroke-linecap="round"/>
    <path d="M110 50 Q112 54 118 51 Q126 48 130 54 Q126 50 120 53 Q114 56 110 50 Z" fill="#b0521f"/>
    <path d="M115 58 q3 -2.5 6 0 M124 57 q3 -2.5 6 0" stroke="#2a1a10" stroke-width="1.5" fill="none" stroke-linecap="round"/>
    <path d="M113 66 Q122 76 132 64 Q124 69 113 66 Z" fill="#fff6e8" stroke="#7a3a24" stroke-width="1.2" stroke-linejoin="round"/>
    <path d="M112 64 q-1.5 2 0 4 M133 62 q1.5 2 0 4" stroke="#b07e5c" stroke-width="1" fill="none"/>
    <path d="M131 66 L144 70 L146 63" fill="none" stroke="#3a2a1c" stroke-width="2.4" stroke-linecap="round"/>
    <circle cx="146" cy="62" r="2.4" fill="#3a2a1c"/><circle cx="146" cy="61" r="1.1" fill="#ff8a3a"/>
   </g></g>
  </g>
  <g class="laute req m-laute">
   <path d="M164 122 L232 70 L238 77 L172 130 Z" fill="#5a3a20" stroke="#2a1a10" stroke-width="1.2"/>
   <path d="M232 70 L250 74 L252 82 L238 77 Z" fill="#4a2e18" stroke="#2a1a10" stroke-width="1.2"/>
   <g fill="#e0a046"><circle cx="242" cy="72" r="1.6"/><circle cx="247" cy="74" r="1.6"/><circle cx="244" cy="79" r="1.6"/><circle cx="249" cy="80" r="1.6"/></g>
   <ellipse cx="150" cy="140" rx="36" ry="25" transform="rotate(-38 150 140)" fill="#a8743c" stroke="#5a3a20" stroke-width="2"/>
   <ellipse cx="150" cy="140" rx="30" ry="19" transform="rotate(-38 150 140)" fill="none" stroke="#c9934f" stroke-width="1" opacity=".7"/>
   <circle cx="156" cy="134" r="8" fill="#2a1a10" stroke="#e0a046" stroke-width="1.2"/>
   <path class="saiten" d="M132 154 L236 74 M134 156 L238 76 M136 158 L240 78" stroke="#ebe2cc" stroke-width=".7" opacity=".85"/>
   <path d="M130 150 L138 160" stroke="#2a1a10" stroke-width="3" stroke-linecap="round"/>
  </g>
  <g class="req m-mandoline">
   <path d="M160 124 L200 86 L205 92 L166 130 Z" fill="#4a2e18" stroke="#2a1a10" stroke-width="1"/>
   <path d="M200 86 L212 83 L214 91 L205 92 Z" fill="#3a2414" stroke="#2a1a10" stroke-width="1"/>
   <ellipse cx="150" cy="138" rx="27" ry="20" transform="rotate(-38 150 138)" fill="#7a3a1c" stroke="#3a1a0c" stroke-width="2"/>
   <path d="M136 146 Q150 128 166 124" fill="none" stroke="#c9934f" stroke-width="1" opacity=".6"/>
   <circle cx="154" cy="133" r="5" fill="#2a1a10" stroke="#e0a046" stroke-width="1"/>
   <path d="M138 152 L206 88 M140 154 L208 90" stroke="#ebe2cc" stroke-width=".7" opacity=".85"/></g>
  <g class="req m-harfe">
   <path d="M140 154 L202 94" stroke="#8a5a32" stroke-width="9" stroke-linecap="round"/>
   <path d="M140 154 L168 58" stroke="#6b4423" stroke-width="5" stroke-linecap="round"/>
   <path d="M168 58 Q196 58 202 94" fill="none" stroke="#6b4423" stroke-width="5" stroke-linecap="round"/>
   <g stroke="#f0d48a" stroke-width=".8"><path d="M154 70 L150 142 M162 64 L158 134 M170 61 L167 126 M178 61 L176 118 M186 64 L185 110 M194 72 L193 102"/></g>
   <circle cx="168" cy="58" r="3" fill="#e0a046"/></g>
  <g class="req m-fidel">
   <path d="M164 122 L200 86 L205 91 L170 128 Z" fill="#3a2414" stroke="#2a1a10" stroke-width="1"/>
   <path d="M200 86 Q208 80 212 86 Q210 92 205 91 Z" fill="#3a2414"/>
   <ellipse cx="146" cy="144" rx="17" ry="12" transform="rotate(-38 146 144)" fill="#9a4a22" stroke="#4a1a0a" stroke-width="1.5"/>
   <ellipse cx="160" cy="128" rx="13" ry="10" transform="rotate(-38 160 128)" fill="#9a4a22" stroke="#4a1a0a" stroke-width="1.5"/>
   <path d="M146 134 q2 3 0 6 M156 140 q2 3 0 6" stroke="#2a1a10" stroke-width="1.6" fill="none"/>
   <path d="M140 150 L206 88" stroke="#ebe2cc" stroke-width=".7" opacity=".85"/>
   <path d="M166 122 L118 172" stroke="#6b4423" stroke-width="2.2" stroke-linecap="round"/><path d="M168 125 L121 174" stroke="#f2ead8" stroke-width=".9"/></g>
  <g class="req m-drehleier">
   <path d="M136 142 L190 116 L198 128 L144 156 Z" fill="#8a5a32" stroke="#3a2412" stroke-width="1.2"/>
   <path d="M152 132 L186 115 L190 121 L156 138 Z" fill="#5a3a20" stroke="#2a1a10" stroke-width="1"/>
   <g fill="#efe2c2"><rect x="160" y="125" width="3" height="5" transform="rotate(-27 161 127)"/><rect x="168" y="121" width="3" height="5" transform="rotate(-27 169 123)"/><rect x="176" y="117" width="3" height="5" transform="rotate(-27 177 119)"/></g>
   <circle cx="146" cy="148" r="7" fill="#c9934f" stroke="#3a2412" stroke-width="1"/>
   <path d="M148 143 L159 129" stroke="#3a2412" stroke-width="2.4" stroke-linecap="round"/><circle cx="160" cy="128" r="2.6" fill="#e0a046"/></g>
  <g class="req m-schalmei">
   <path d="M129 74 L200 92" stroke="#6b4423" stroke-width="4.5" stroke-linecap="round"/>
   <path d="M200 92 L214 95 L212 102 Z" fill="#8a5a32" stroke="#3a2412" stroke-width="1"/>
   <g fill="#2a1a10"><circle cx="160" cy="82" r="1.2"/><circle cx="168" cy="84" r="1.2"/><circle cx="176" cy="86" r="1.2"/><circle cx="184" cy="88" r="1.2"/></g></g>
  <g class="req m-dudelsack">
   <path d="M112 108 L80 62 M115 106 L86 56 M118 106 L93 62" stroke="#3a2414" stroke-width="3.4" stroke-linecap="round"/>
   <g fill="#e0a046"><circle cx="79.5" cy="61" r="2.6"/><circle cx="85.5" cy="55" r="2.6"/><circle cx="92.5" cy="61" r="2.6"/></g>
   <ellipse cx="126" cy="120" rx="16" ry="11" transform="rotate(-20 126 120)" fill="#8a2a22" stroke="#3a0a08" stroke-width="1.2"/>
   <path d="M114 114 L138 124 M116 122 L136 116" stroke="#2a3a5a" stroke-width="2" opacity=".7"/>
   <path d="M124 110 L127 76" stroke="#3a2414" stroke-width="2.4"/>
   <path d="M138 122 L178 142" stroke="#3a2414" stroke-width="4" stroke-linecap="round"/><circle cx="179" cy="143" r="3" fill="#3a2414"/></g>
  <g class="req m-glocken">
   <path d="M138 130 L196 112 L200 124 L144 144 Z" fill="#3a2414" stroke="#2a1a10" stroke-width="1"/>
   <g stroke-width="3" stroke-linecap="round"><path d="M148 133 L150 139" stroke="#e0c070"/><path d="M156 130 L158 137" stroke="#d8dce6"/><path d="M164 127 L166 134" stroke="#e0c070"/><path d="M172 124 L174 131" stroke="#d8dce6"/><path d="M180 121 L182 128" stroke="#e0c070"/><path d="M188 118 L190 125" stroke="#d8dce6"/></g>
   <path d="M162 128 L170 120" stroke="#c9934f" stroke-width="1.8"/><circle cx="171" cy="119" r="3" fill="#9b3a2f"/>
   <path d="M196 100 L188 114" stroke="#c9934f" stroke-width="1.8"/><circle cx="187.5" cy="116" r="3" fill="#9b3a2f"/></g>
  <g class="req m-illusion">
   <path d="M129 74 L202 90" stroke="#b98cff" stroke-width="3.6" stroke-linecap="round"/>
   <path d="M129 74 L202 90" stroke="#efe2ff" stroke-width="1" stroke-linecap="round"/>
   <g fill="#e6d4ff"><circle cx="214" cy="84" r="1.6"/><circle cx="220" cy="94" r="1.2"/><circle cx="210" cy="98" r="1"/><circle cx="224" cy="86" r="1"/></g></g>
  <circle class="hand-griff" cx="200" cy="85" r="6" fill="#e0ad86"/>
  <g class="arm-schlag"><path class="schlag-arm" d="M118 98 Q104 124 118 128 L156 126" fill="none" stroke="#17131a" stroke-width="11" stroke-linecap="round" stroke-linejoin="round"/>
   <path d="M110 110 q3 3 7 2" fill="none" stroke="#c9a24a" stroke-width="1.4"/>
   <path class="schlag-deko" d="M150 122 l0 8" stroke="#c9a24a" stroke-width="3" stroke-linecap="round"/>
   <circle class="schlag-hand" cx="161" cy="126" r="6.5" fill="#e0ad86"/>
   <path class="schlag-finger" d="M164 121 q4 1 5 4 M165 126 q4 1 5 4" fill="none" stroke="#b07e5c" stroke-width="1" stroke-linecap="round"/></g>
  <circle class="rauchwolke" cx="148" cy="62" r="5" fill="rgba(220,215,230,.25)"/>
 </svg>
 <!-- Echo: weißes Haar und Bart, Geweih, Elfenohren, weiße Robe mit Pelz – mit Flöte -->
 <svg x="360" y="10" width="110" height="200" viewBox="0 0 110 200" class="echo" overflow="visible">
  <ellipse cx="54" cy="192" rx="42" ry="5" fill="rgba(0,0,0,.45)"/>
  <g class="e-koerper">
   <path d="M38 98 Q28 140 20 192 L88 192 Q80 140 70 98 Q54 90 38 98 Z" fill="url(#lw-robe)" stroke="#8a8676" stroke-width="1.2"/>
   <path d="M54 100 L54 192" stroke="#c9c3b2" stroke-width="1.2"/>
   <path d="M48 102 l6 10 l6 -10 M46 150 q8 8 16 0 M44 170 q10 8 20 0" fill="none" stroke="#9aa6b8" stroke-width="1.2"/>
   <path d="M38 126 Q54 134 70 126" fill="none" stroke="#6b4a2a" stroke-width="5"/>
   <circle cx="54" cy="130" r="3" fill="#9aa6b8" stroke="#e8eef6" stroke-width="1"/>
   <path d="M30 104 Q32 90 44 88 Q54 96 64 88 Q76 90 78 104 Q70 98 64 102 Q54 106 44 102 Q36 98 30 104 Z" fill="#f6f4ee" stroke="#c9c3b2" stroke-width="1"/>
   <path d="M34 100 l3 -4 M42 96 l2 -5 M66 96 l2 -5 M73 100 l3 -4" stroke="#fff" stroke-width="1.2" stroke-linecap="round"/>
   <g class="e-kopf">
    <path d="M42 56 Q38 40 30 30 M34 38 Q26 36 20 28 M32 34 Q30 24 34 16 M30 30 Q22 22 24 12" fill="none" stroke="#b8a68a" stroke-width="3" stroke-linecap="round"/>
    <path d="M66 56 Q70 40 78 30 M74 38 Q82 36 88 28 M76 34 Q78 24 74 16 M78 30 Q86 22 84 12" fill="none" stroke="#b8a68a" stroke-width="3" stroke-linecap="round"/>
    <path d="M40 62 Q34 84 38 104 L46 80 Z M68 62 Q74 84 70 104 L62 80 Z" fill="#f2efe6"/>
    <path d="M42 66 L30 60 L43 72 Z M66 66 L78 60 L65 72 Z" fill="#c4b6a6" stroke="#9a8c7c" stroke-width=".8"/>
    <ellipse cx="54" cy="68" rx="12" ry="13" fill="#cdbfb0"/>
    <path d="M41 64 Q42 50 54 50 Q66 50 67 64 Q60 56 54 57 Q48 56 41 64 Z" fill="#f6f4ee"/>
    <path d="M47 64 l5 1 M56 65 l5 -1" stroke="#3a3a44" stroke-width="1.6" stroke-linecap="round"/>
    <path d="M45 61 l6 1 M57 62 l6 -1" stroke="#f6f4ee" stroke-width="1.6" stroke-linecap="round"/>
    <path d="M43 74 Q44 100 54 104 Q64 100 65 74 Q60 82 54 81 Q48 82 43 74 Z" fill="#f6f4ee" stroke="#d8d2c4" stroke-width=".8"/>
    <path d="M50 78 Q54 76 58 78" stroke="#bdb2a4" stroke-width="1" fill="none"/>
   </g>
   <g class="req e-floete"><path d="M58 79 L104 96" stroke="#6b4a2a" stroke-width="4" stroke-linecap="round"/>
    <g fill="#2a1a10"><circle cx="78" cy="86" r="1"/><circle cx="85" cy="89" r="1"/><circle cx="92" cy="91" r="1"/></g></g>
   <g class="req e-panfloete" stroke="#7a5a2a" stroke-width=".8" fill="#d6b273">
    <rect x="57" y="76" width="4.5" height="30" rx="1.5"/><rect x="62" y="76" width="4.5" height="26" rx="1.5"/><rect x="67" y="76" width="4.5" height="22" rx="1.5"/>
    <rect x="72" y="76" width="4.5" height="18" rx="1.5"/><rect x="77" y="76" width="4.5" height="14" rx="1.5"/>
    <path d="M56 84 H83" stroke="#6b3a1a" stroke-width="2"/></g>
   <g class="req e-okarina"><ellipse cx="72" cy="86" rx="12" ry="7.5" fill="#b5653c" stroke="#6b3a1a" stroke-width="1"/>
    <path d="M60 81 L63 85" stroke="#b5653c" stroke-width="4" stroke-linecap="round"/>
    <g fill="#3a1a0c"><circle cx="70" cy="84" r="1.2"/><circle cx="75" cy="85" r="1.2"/><circle cx="79" cy="87" r="1.2"/></g></g>
   <g class="req e-horn"><path d="M58 80 Q76 94 92 82 Q100 74 102 64" fill="none" stroke="#e2d2a8" stroke-width="5" stroke-linecap="round"/>
    <path d="M58 80 Q76 94 92 82" fill="none" stroke="#8a7350" stroke-width="1.2" stroke-dasharray="2 4"/>
    <ellipse cx="102.5" cy="62" rx="6" ry="3.2" transform="rotate(-70 102.5 62)" fill="#4a3a28" stroke="#e2d2a8" stroke-width="1.5"/></g>
   <path d="M42 100 Q56 112 74 88" fill="none" stroke="#e9e6dc" stroke-width="8" stroke-linecap="round"/>
   <path d="M66 100 Q84 104 90 92" fill="none" stroke="#d8d3c4" stroke-width="7" stroke-linecap="round"/>
   <circle cx="74" cy="87" r="4.5" fill="#cdbfb0"/><circle cx="90" cy="92" r="4.5" fill="#cdbfb0"/>
  </g>
 </svg>
 <!-- Rex: Australian Shepherd in Schwarz, Weiß und Kupfer, mit Halstuch und Anhänger -->
 <svg x="450" y="112" width="90" height="98" viewBox="0 0 90 98" class="rex" overflow="visible">
  <ellipse cx="46" cy="92" rx="30" ry="4" fill="rgba(0,0,0,.45)"/>
  <path d="M62 86 Q84 84 82 66 Q80 76 66 80" fill="#26262b" stroke="#ece6da" stroke-width="1"/>
  <path d="M30 92 Q22 62 38 48 Q56 42 64 62 Q70 80 66 92 Z" fill="#26262b"/>
  <path d="M50 52 q6 6 4 14 M58 66 q4 6 2 12" fill="none" stroke="#7a7f8c" stroke-width="3" opacity=".7"/>
  <path d="M28 54 Q24 70 30 92 L46 92 Q48 72 44 56 Q36 50 28 54 Z" fill="#f4efe4"/>
  <path d="M28 60 l4 4 l-3 3 l5 3 l-4 4 l5 3" fill="none" stroke="#d8d0c0" stroke-width="1"/>
  <path d="M36 76 L36 92 M45 76 L45 92" stroke="#f4efe4" stroke-width="5" stroke-linecap="round"/>
  <path d="M33 90 h6 M42 90 h6" stroke="#c98a4a" stroke-width="2.5" stroke-linecap="round"/>
  <path d="M28 56 Q40 64 52 56 L50 62 Q40 68 30 62 Z" fill="#6b4627" stroke="#3a2412" stroke-width=".8"/>
  <path d="M40 64 l-2 6 l2 3 l2 -3 Z" fill="#d8dce6" stroke="#9aa6b8" stroke-width=".6"/>
  <g class="r-kopf">
   <path d="M40 18 L35 34 L47 31 Z M54 20 L47 33 L56 37 Z" fill="#26262b" stroke="#111" stroke-width=".8"/>
   <path d="M41 23 L39 31 L44 30 Z" fill="#c98a4a"/>
   <ellipse cx="40" cy="40" rx="14" ry="12" fill="#26262b"/>
   <path d="M48 32 q5 3 4 10" fill="none" stroke="#7a7f8c" stroke-width="3" opacity=".7"/>
   <path d="M38 28 Q34 40 28 46 L40 47 Q39 36 40 28 Z" fill="#f4efe4"/>
   <ellipse cx="25" cy="46" rx="9.5" ry="6.5" fill="#f4efe4"/>
   <path d="M30 42 q4 2 8 0" stroke="#c98a4a" stroke-width="2.5" fill="none"/>
   <circle cx="17" cy="44.5" r="2.8" fill="#111"/>
   <circle cx="34" cy="37" r="2.3" fill="#c98a2a"/><circle cx="34" cy="37" r="1.1" fill="#111"/>
   <circle cx="35" cy="33" r="1.5" fill="#c98a4a"/><circle cx="45" cy="36" r="1.6" fill="#c98a4a"/>
   <path class="maul" d="M18 50 Q24 53 30 50" fill="none" stroke="#111" stroke-width="1.3"/>
  </g>
 </svg>
 <!-- Ezekiel: Darkin mit gehörnter scharlachroter Kapuze, glühenden Augen, Stachelrüstung -->
 <svg x="530" y="10" width="130" height="200" viewBox="0 0 130 200" class="ezekiel" overflow="visible">
  <ellipse cx="64" cy="192" rx="50" ry="5" fill="rgba(0,0,0,.45)"/>
  <path d="M26 100 Q14 150 18 192 L30 184 L36 192 L44 180 L52 190 L58 180 Q40 150 40 104 Z M102 100 Q114 150 112 192 L102 184 L96 192 L88 180 L80 190 L74 180 Q90 150 88 104 Z" fill="#7a1712" stroke="#3a0806" stroke-width="1"/>
  <path d="M50 150 L46 189 M78 150 L82 189" stroke="#1a0e0e" stroke-width="13" stroke-linecap="round"/>
  <path d="M42 160 l-6 2 M86 160 l6 2 M44 176 l-6 2 M84 176 l6 2" stroke="#3a1a14" stroke-width="3" stroke-linecap="round"/>
  <path d="M36 190 h16 M76 190 h16" stroke="#3a1a14" stroke-width="7" stroke-linecap="round"/>
  <path class="z-links-std" d="M30 104 Q18 124 22 140" fill="none" stroke="#2a1414" stroke-width="10" stroke-linecap="round"/>
  <path d="M30 100 Q24 140 36 154 L94 154 Q104 140 98 100 Q64 84 30 100 Z" fill="#241010" stroke="#9b3a2f" stroke-width="1.4"/>
  <path d="M40 112 Q64 120 88 112 M38 128 Q64 136 90 128 M40 144 Q64 150 88 144" fill="none" stroke="#3a1a14" stroke-width="2"/>
  <path d="M64 98 L64 152" stroke="#3a1a14" stroke-width="2.4"/>
  <g fill="#9b3a2f"><circle cx="44" cy="114" r="1.4"/><circle cx="84" cy="114" r="1.4"/><circle cx="42" cy="130" r="1.4"/><circle cx="86" cy="130" r="1.4"/></g>
  <circle cx="64" cy="122" r="7" fill="url(#lw-glut)" class="glut"/>
  <path class="glut" d="M50 108 L58 120 L54 132 M76 106 L70 122 L78 136 M60 140 L66 150" fill="none" stroke="#ff5a2e" stroke-width="1.4" opacity=".75"/>
  <path d="M26 100 L14 84 L36 94 Z M102 100 L114 84 L92 94 Z" fill="#3a1a14" stroke="#9b3a2f" stroke-width="1"/>
  <path d="M18 88 l-4 -10 M110 88 l4 -10" stroke="#9b3a2f" stroke-width="2.4" stroke-linecap="round"/>
  <g class="z-kopf">
   <path d="M50 62 Q28 56 24 30 Q22 18 30 10 Q30 26 38 38 Q44 48 54 54 Z M78 62 Q100 56 104 30 Q106 18 98 10 Q98 26 90 38 Q84 48 74 54 Z" fill="#2a1414" stroke="#7a1712" stroke-width="1.2"/>
   <path d="M30 14 q3 8 2 14 M98 14 q-3 8 -2 14" stroke="#4a2420" stroke-width="1.4" fill="none"/>
   <path d="M40 98 Q36 70 44 56 Q54 46 64 46 Q74 46 84 56 Q92 70 88 98 Q76 90 64 90 Q52 90 40 98 Z" fill="url(#lw-kapuze)" stroke="#3a0806" stroke-width="1.2"/>
   <path d="M48 92 Q46 70 54 60 Q64 54 74 60 Q82 70 80 92 Q72 86 64 86 Q56 86 48 92 Z" fill="#0d0606"/>
   <path class="augen" d="M55 72 l7 2 M66 74 l7 -2" stroke="#ff4a2a" stroke-width="2.8" stroke-linecap="round"/>
  </g>
  <g class="z-rechts-std"><path d="M96 104 Q110 120 104 136" fill="none" stroke="#2a1414" stroke-width="10" stroke-linecap="round"/>
   <circle cx="104" cy="138" r="5.5" fill="#3a1a14"/></g>
  <g class="z-req">
   <g class="req z-ketten kette"><path d="M104 140 Q112 166 96 178 Q78 186 80 164 Q82 150 98 146" fill="none" stroke="#b8b0a0" stroke-width="3.2" stroke-dasharray="4.5 2.5" stroke-linecap="round"/></g>
   <g class="req z-klatschen">
    <path d="M32 104 Q36 126 56 122 M96 104 Q92 126 72 120" fill="none" stroke="#9b3a2f" stroke-width="12" stroke-linecap="round"/>
    <path d="M32 104 Q36 126 56 122 M96 104 Q92 126 72 120" fill="none" stroke="#2a1414" stroke-width="9" stroke-linecap="round"/>
    <circle cx="60" cy="120" r="6" fill="#5a2a22" stroke="#c4564a" stroke-width="1.4"/><circle cx="68" cy="119" r="6" fill="#5a2a22" stroke="#c4564a" stroke-width="1.4"/>
    <path d="M56 110 l-3 -5 M64 108 l0 -6 M72 110 l3 -5" stroke="#ff7a4a" stroke-width="1.4" stroke-linecap="round"/></g>
   <g class="req z-schnipsen">
    <path d="M96 104 Q114 98 110 80" fill="none" stroke="#2a1414" stroke-width="10" stroke-linecap="round"/>
    <circle cx="110" cy="77" r="5.5" fill="#3a1a14"/>
    <path d="M116 70 l5 -4 M118 77 l6 0 M116 84 l5 4" stroke="#ff7a4a" stroke-width="1.4" stroke-linecap="round"/></g>
   <g class="req z-rassel"><ellipse cx="107" cy="142" rx="4.5" ry="5.8" fill="#efe2c2" stroke="#8a7350" stroke-width="1"/>
    <path d="M113 136 l4 -3 M114 143 l5 0" stroke="#efe2c2" stroke-width="1.2" stroke-linecap="round" opacity=".7"/></g>
   <g class="req z-stampfen" stroke="#d8c49a" stroke-width="1.2" fill="none" stroke-linecap="round" opacity=".8">
    <path d="M70 186 q-4 -4 -2 -9 M96 186 q4 -4 2 -9 M66 192 h-6 M98 192 h6"/></g>
   <g class="req z-loeffel" stroke="#d8dce6" stroke-width="2" stroke-linecap="round">
    <path d="M104 140 L112 158 M106 139 L116 155"/><ellipse cx="113.5" cy="161" rx="2.6" ry="4" transform="rotate(-25 113.5 161)" fill="#d8dce6" stroke="none"/>
    <ellipse cx="118" cy="158" rx="2.6" ry="4" transform="rotate(-35 118 158)" fill="#d8dce6" stroke="none"/></g>
   <g class="req z-krug"><rect x="99" y="131" width="13" height="16" rx="2" fill="#8a5a32" stroke="#3a2412" stroke-width="1"/>
    <path d="M112 134 q6 1 5 6 q-1 4 -5 4" fill="none" stroke="#3a2412" stroke-width="2"/>
    <path d="M98 131 q3 -5 7 -2 q3 -4 7 0 q2 1 0 3 Z" fill="#fbf4e2"/><path d="M101 137 h9 M101 142 h9" stroke="#c9934f" stroke-width="1"/></g>
  </g>
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
  const raumWahl = T => '<label class="lw-feld"><span>' + T.raum + '</span><select data-feld="raum">' + Object.keys(RAEUME).map(r => '<option value="' + r + '"' + (r === S.raum ? " selected" : "") + ">" + T.raeume[r] + "</option>").join("") + "</select></label>";
  const kulisseWahl = T => '<select class="lw-gespeichert" data-feld="kulisse" aria-label="' + esc(T.kulisse) + '">' + KULISSEN.map(k => '<option value="' + k + '"' + (k === S.kulisse ? " selected" : "") + ">" + T.kulissen[k] + "</option>").join("") + "</select>" +
    '<button type="button" class="lw-schalter" data-aktion="kulisse" aria-pressed="' + !!kul + '">' + (kul ? T.kulisseAn : T.kulisseAus) + "</button>";
  const mixRegler = T =>
    '<label class="lw-feld lw-regler lw-master"><span>🔊 ' + T.master + ' <b class="lw-mval">' + S.master * 10 + ' %</b></span><input type="range" min="0" max="10" step="1" value="' + S.master + '" data-feld="master"></label>' +
    '<label class="lw-feld lw-regler lw-hallregler"><span>🏛 ' + T.hall + ' <b class="lw-hval">' + S.hall * 10 + ' %</b></span><input type="range" min="0" max="10" step="1" value="' + S.hall + '" data-feld="hall"></label>' +
    raumWahl(T);
  const intRegler = T => '<label class="lw-feld lw-regler lw-intensitaet"><span>🔥 ' + T.intensitaet + ' <b class="lw-ival">' + T.intStufen[S.intensitaet] + '</b></span><input type="range" min="0" max="10" step="1" value="' + S.intensitaet + '" data-feld="intensitaet"></label>';
  function pultZeichnen(T) {
    root.innerHTML =
      '<p class="label">' + T.label + "</p><h3>" + T.titel + '</h3><p class="tav-info">' + T.pultTipp + "</p>" +
      '<div class="lw-buehne lw-buehne-klein" data-mel="' + S.instrument + '" data-tr="' + S.band.trommel + '" data-fl="' + S.band.floete + '" data-ez="' + S.band.ketten + '">' + BUEHNE + "</div>" +
      '<div class="lw-pult">' +
        '<div class="lw-pult-kopf"><button type="button" class="lw-play lw-play-gross">' + (laeuft ? T.stopp : T.spielen) + "</button>" +
          '<span class="lw-pult-titel">' + esc(S.titel || T.eigenesLied) + "</span>" +
          '<button type="button" class="lw-schalter" data-aktion="pult">' + T.komplett + "</button></div>" +
        '<section><h4>' + T.stimmungen + '</h4><div class="lw-pult-gitter">' +
          STIMMUNGEN.map(k => '<button type="button" data-vorlage="' + k + '"' + (S.stimmung === k ? ' class="an"' : "") + ">" + T.vorlagen[k] + "</button>").join("") + "</div>" + intRegler(T) +
          '<select class="lw-gespeichert lw-pult-lieder" data-feld="liedwahl"><option value="">' + T.liedWaehlen + "</option>" +
            LIEDER.map(k => '<option value="' + k + '">' + T.vorlagen[k] + "</option>").join("") + "</select></section>" +
        '<section class="lw-pult-mix">' + mixRegler(T) + "</section>" +
        '<section><h4>' + T.kulisse + '</h4><div class="lw-pult-gitter">' +
          KULISSEN.map(k => '<button type="button" data-kulisse="' + k + '"' + (S.kulisse === k ? ' class="an"' : "") + ">" + T.kulissen[k] + "</button>").join("") + "</div>" +
          '<label class="lw-feld lw-regler"><span>' + T.kulisseLaut + ' <b class="lw-kval">' + S.kulisseVol * 10 + ' %</b></span><input type="range" min="0" max="10" step="1" value="' + S.kulisseVol + '" data-feld="kulvol"></label></section>' +
        '<section><h4>' + T.effekte + '</h4><div class="lw-pult-gitter lw-pult-fx">' + EFFEKTE.map(f => '<button type="button" data-sfx="' + f + '">' + T.sfx[f] + "</button>").join("") + "</div></section>" +
        '<section><h4>🎭 ' + T.momente + '</h4><div class="lw-pult-gitter lw-pult-fx">' + MOMENTE.map(f => '<button type="button" data-sfx="' + f + '">' + T.sfx[f] + "</button>").join("") + "</div></section>" +
        '<section class="lw-funk"><h4>' + T.funk + "</h4>" + funkTeil(T) + "</section>" +
      "</div>" +
      '<div class="lw-fuss"><span class="lw-status" aria-live="polite"></span></div>';
    spalten = []; aktiv = -1; figurCache = {};
  }
  /* ---------- Mitlauschen: Supabase Realtime (Broadcast + Presence) über einen schlichten WebSocket ---------- */
  function funkKanal(raum, rolle, beiNachricht, beiStatus) {
    let ws = null, ref = 0, joinRef = null, herz = null, zu = false, leute = {};
    const topic = "realtime:imres-lautenwerk-" + raum;
    const roh = (event, payload, t) => { if (ws && ws.readyState === 1) ws.send(JSON.stringify({ topic: t || topic, event, payload, ref: String(++ref), join_ref: t ? undefined : joinRef })); };
    const zaehlen = () => beiStatus("ok", Object.values(leute).filter(r => r === "hoerer").length);
    function auf() {
      beiStatus("verbinde");
      try { ws = new WebSocket(LIED_SERVER.url.replace(/^http/, "ws") + "/realtime/v1/websocket?apikey=" + encodeURIComponent(LIED_SERVER.key) + "&vsn=1.0.0"); }
      catch (_) { beiStatus("fehler"); setTimeout(() => zu || auf(), 4000); return; }
      ws.onopen = () => {
        joinRef = String(++ref);
        ws.send(JSON.stringify({ topic, event: "phx_join", ref: joinRef, join_ref: joinRef,
          payload: { config: { broadcast: { self: false, ack: false }, presence: { key: rolle + "-" + Math.random().toString(36).slice(2, 8) }, private: false } } }));
        herz = setInterval(() => roh("heartbeat", {}, "phoenix"), 25000);
      };
      ws.onmessage = e => {
        let m; try { m = JSON.parse(e.data); } catch (_) { return; }
        if (m.topic !== topic) return;
        if (m.event === "phx_reply" && m.ref === joinRef) {
          if (m.payload && m.payload.status === "ok") { leute = {}; zaehlen(); roh("presence", { type: "presence", event: "track", payload: { rolle } }); beiNachricht("_offen", {}); }
          else beiStatus("fehler");
        } else if (m.event === "broadcast" && m.payload) beiNachricht(m.payload.event, m.payload.payload || {});
        else if (m.event === "presence_state") { leute = {}; Object.keys(m.payload || {}).forEach(k => { leute[k] = k.split("-")[0]; }); zaehlen(); }
        else if (m.event === "presence_diff") {
          Object.keys((m.payload && m.payload.joins) || {}).forEach(k => { leute[k] = k.split("-")[0]; });
          Object.keys((m.payload && m.payload.leaves) || {}).forEach(k => { delete leute[k]; });
          zaehlen();
        }
      };
      ws.onclose = () => { clearInterval(herz); if (!zu) { beiStatus("fehler"); setTimeout(() => zu || auf(), 3000); } };
      ws.onerror = () => { try { ws.close(); } catch (_) {} };
    }
    auf();
    return {
      senden: (ev, daten) => roh("broadcast", { type: "broadcast", event: ev, payload: daten }),
      schliessen: () => { zu = true; clearInterval(herz); try { roh("phx_leave", {}); ws.close(); } catch (_) {} }
    };
  }
  function funkRaum() {
    let r = null; try { r = localStorage.getItem("imres-funk-raum"); } catch (_) {}
    if (!r || !/^[a-z0-9]{4,16}$/.test(r)) { r = Math.random().toString(36).slice(2, 10); try { localStorage.setItem("imres-funk-raum", r); } catch (_) {} }
    return r;
  }
  const funkLink = () => location.origin + location.pathname + "?lauschen=" + funkRaum() + "#taverne";
  function funkTeil(T) {
    if (!funk) return '<p class="lw-tipp">' + T.funkTipp + '</p><button type="button" class="lw-schalter" data-aktion="funk">' + T.funkStart + "</button>";
    return '<p class="lw-tipp">' + T.funkTipp + '</p><div class="lw-funk-zeile"><input type="text" readonly class="lw-funk-link" value="' + esc(funkLink()) + '">' +
      '<button type="button" class="lw-schalter" data-aktion="funkkopie">' + T.funkKopieren + "</button></div>" +
      '<p class="lw-funk-status">' + esc(funkStatusText(T)) + '</p><button type="button" class="lw-schalter" data-aktion="funk">' + T.funkStopp + "</button>";
  }
  const funkStatusText = T => !funk ? "" : funk.status === "ok" ? "🟢 " + T.funkLaeuft + " · " + T.funkZuhoerer(funk.zahl || 0) : funk.status === "fehler" ? "🔴 " + T.funkFehler : "🟡 " + T.funkVerbinde;
  function funkAnzeigen() { const el = root.querySelector(".lw-funk-status"); if (el) el.textContent = funkStatusText(t()); }
  function funkZustand() {
    return { lied: kodieren(), titel: S.titel || "", stimmung: S.stimmung || null, intensitaet: S.intensitaet, kulisse: S.kulisse, kulisseVol: S.kulisseVol,
      hall: S.hall, raum: S.raum, hallAus: S.hallAus, laeuft };
  }
  function funkSenden(ev, daten) { if (funk && funk.kanal) funk.kanal.senden(ev, daten); }
  function funkAenderung() {
    if (!funk) return;
    clearTimeout(funk.warte); funk.warte = setTimeout(() => funkSenden("zustand", funkZustand()), 250);
  }
  function funkUmschalten() {
    if (funk) { funk.kanal.schliessen(); clearInterval(funk.puls); funk = null; return; }
    funk = { status: "verbinde", zahl: 0 };
    funk.kanal = funkKanal(funkRaum(), "pult", (ev) => {
      if (ev === "_offen" || ev === "hallo") funkSenden("zustand", funkZustand());
    }, (st, n) => { if (!funk) return; funk.status = st; if (n != null) funk.zahl = n; funkAnzeigen(); });
    funk.puls = setInterval(() => funkSenden("zustand", funkZustand()), 15000); /* falls jemand etwas verpasst */
  }

  /* ---------- Zuhörer-Ansicht ---------- */
  function hoererZeichnen(T) {
    const z = hoerer.zuletzt;
    const stat = !hoerer.verbunden ? T.hVerbinde : (z && z.laeuft ? "🟢 " + T.hVerbunden : T.hWarte);
    root.innerHTML =
      '<p class="label">' + T.funk + "</p><h3>" + T.hTitel + '</h3><p class="tav-info">' + T.hText + "</p>" +
      '<div class="lw-buehne lw-buehne-klein" data-mel="' + S.instrument + '" data-tr="' + S.band.trommel + '" data-fl="' + S.band.floete + '" data-ez="' + S.band.ketten + '">' + BUEHNE + "</div>" +
      '<div class="lw-pult"><div class="lw-pult-kopf"><button type="button" class="lw-play-gross lw-hoeren' + (hoerer.an ? " an" : "") + '" data-aktion="hoeren">' + (hoerer.an ? T.hAus : T.hZuhoeren) + "</button>" +
        '<span class="lw-pult-titel">' + esc(z && z.titel ? z.titel : "") + "</span></div>" +
        '<p class="lw-funk-status">' + esc(stat) + "</p>" +
        '<section class="lw-pult-mix"><label class="lw-feld lw-regler lw-master"><span>🔊 ' + T.hLaut + ' <b class="lw-mval">' + S.master * 10 + ' %</b></span><input type="range" min="0" max="10" step="1" value="' + S.master + '" data-feld="master"></label></section>' +
        '<p class="lw-tipp"><a href="' + esc(location.pathname) + '#taverne">' + T.hSelbst + "</a></p>" +
      "</div>" + '<div class="lw-fuss"><span class="lw-status" aria-live="polite"></span></div>';
    spalten = []; aktiv = -1; figurCache = {};
  }
  function hoererEmpfang(ev, d) {
    if (ev === "_offen") { hoerer.verbunden = true; funkHoererKanal.senden("hallo", {}); zeichnen(); return; }
    if (ev === "fx") { if (hoerer.an && ctx && ALLE_FX.includes(d.art)) effekt(d.art); return; }
    if (ev !== "zustand") return;
    const neu = dekodieren(d.lied); if (!neu) return;
    const alt = hoerer.zuletzt; hoerer.zuletzt = d;
    Object.assign(neu, { titel: String(d.titel || "").slice(0, 80), stimmung: STIL[d.stimmung] ? d.stimmung : null, intensitaet: zahl(d.intensitaet, 0, 10, 5),
      kulisse: KULISSEN.includes(d.kulisse) ? d.kulisse : "keine", kulisseVol: zahl(d.kulisseVol, 0, 10, 5), hall: zahl(d.hall, 0, 10, 0),
      raum: RAEUME[d.raum] ? d.raum : "taverne", hallAus: Object.assign({}, S.hallAus, d.hallAus || {}), master: S.master, pult: false });
    const kern = x => [x.transpose, x.modus, x.instrument, x.band.trommel, x.band.floete, x.band.ketten, x.swing, x.bordun].join();
    const titelNeu = !alt || alt.titel !== d.titel || (alt.laeuft !== d.laeuft);
    if (laeuft && kern(neu) !== kern(S)) {
      wechsel = pruefen(neu);
      const a2 = S; S = wechsel; try { saitenVorbereiten(); } catch (_) {} S = a2;
    } else {
      const kulAlt = S.kulisse, raumAlt = S.raum;
      Object.assign(S, neu);
      if (ctx) { effekteAnwenden(); mixAnwenden(); if (raumAlt !== S.raum) raumAnwenden(); if (laeuft && kulAlt !== S.kulisse) kulisseStart(); }
    }
    if (hoerer.an && d.laeuft && !laeuft) start();
    if (laeuft && !d.laeuft) stopp();
    if (titelNeu) { zeichnen(); knoepfe(); }
  }
  let funkHoererKanal = null;
  if (hoerer) funkHoererKanal = funkKanal(hoerer.raum, "hoerer", hoererEmpfang, st => {
    if (st === "fehler" && hoerer.verbunden) { hoerer.verbunden = false; zeichnen(); }
  });

  function zeichnen() { zeichnenInnen(); armeSetzen(); }
  function zeichnenInnen() {
    const T = t();
    if (hoerer) { hoererZeichnen(T); return; }
    if (S.pult) { pultZeichnen(T); return; }
    const tonarten = Array.from({ length: 12 }, (_, i) => i - 5).map(tr => '<option value="' + tr + '"' + (tr === S.transpose ? " selected" : "") + ">" + notenName(MEL_GRUND + tr) + "</option>").join("");
    const modi = MODUS_LISTE.map(m => '<option value="' + m + '"' + (m === S.modus ? " selected" : "") + ">" + T.modi[m] + "</option>").join("");
    const ablaeufe = (ABLAEUFE.includes(S.ablauf) ? ABLAEUFE : ABLAEUFE.concat([S.ablauf])).map(a => '<option value="' + a + '"' + (a === S.ablauf ? " selected" : "") + ">" + a.split("").join(" – ") + "</option>").join("");
    const wahl = k => k === "melodie" ? { liste: INSTRUMENTE, wert: S.instrument, namen: T.instrumente }
      : BAND[k] ? { liste: BAND[k], wert: S.band[k], namen: T.band[k] } : null;
    const kopf = k => {
      const zu = !!zugeklappt[k];
      return '<div class="lw-kopf' + (S.mute[k] ? " stumm" : "") + '" data-kopf="' + k + '"><div class="lw-kopf-in">' +
        '<button type="button" class="lw-spurname" data-zu="' + k + '" aria-expanded="' + !zu + '" title="' + esc(T.zuklappen) + '">' + (zu ? "▸ " : "▾ ") +
          T.wer[SPUR[k].wer] + " <small>· " + (wahl(k) ? wahl(k).namen[wahl(k).wert] : T.spuren[k]) + "</small></button>" +
        '<button type="button" class="lw-mute" data-mute="' + k + '" aria-pressed="' + !!S.mute[k] + '" aria-label="' + esc(T.stumm + " " + T.spuren[k]) + '" title="' + esc(T.stumm) + '">' + (S.mute[k] ? "🔇" : "🔊") + "</button>" +
        '<input type="range" class="lw-fader" min="0" max="9" step="1" value="' + S.vol[k] + '" data-vol="' + k + '" aria-label="' + esc(T.lautstaerke + " " + T.spuren[k]) + '">' +
        '<button type="button" class="lw-hallknopf" data-hall="' + k + '" aria-pressed="' + !S.hallAus[k] + '" title="' + esc(T.hallSpur) + '" aria-label="' + esc(T.hallSpur + " – " + T.spuren[k]) + '">🏛</button>' +
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
      '<div class="lw-buehne" data-mel="' + S.instrument + '" data-tr="' + S.band.trommel + '" data-fl="' + S.band.floete + '" data-ez="' + S.band.ketten + '">' + BUEHNE + "</div>" +
      '<div class="lw-steuer">' +
        '<button type="button" class="lw-play">' + (laeuft ? T.stopp : T.spielen) + "</button>" +
        '<label class="lw-feld lw-regler"><span>' + T.tempo + ' <b class="lw-bpm">' + S.tempo + '</b></span><input type="range" min="50" max="180" step="2" value="' + S.tempo + '" data-feld="tempo"></label>' +
        '<label class="lw-feld lw-regler"><span>' + T.variation + ' <b class="lw-var">' + S.variation * 10 + ' %</b></span><input type="range" min="0" max="10" step="1" value="' + S.variation + '" data-feld="variation"></label>' +
        '<label class="lw-feld"><span>' + T.tonart + '</span><select data-feld="transpose">' + tonarten + "</select></label>" +
        '<label class="lw-feld"><span>' + T.modus + '</span><select data-feld="modus">' + modi + "</select></label>" +
        '<button type="button" class="lw-schalter" data-feld="swing" aria-pressed="' + !!S.swing + '">' + T.swing + "</button>" +
        '<button type="button" class="lw-schalter" data-feld="bordun" aria-pressed="' + !!S.bordun + '">' + T.bordun + "</button>" +
        '<button type="button" class="lw-schalter lw-pultknopf" data-aktion="pult">' + T.pult + "</button>" +
      "</div>" +
      '<div class="lw-vorlagen"><span>' + T.lieder + ":</span>" +
        LIEDER.map(k => '<button type="button" data-vorlage="' + k + '">' + T.vorlagen[k] + "</button>").join("") +
        '<button type="button" data-vorlage="zufall">' + T.zufall + '</button><button type="button" data-vorlage="leer">' + T.leeren + "</button>" +
      "</div>" +
      '<div class="lw-vorlagen lw-eigene"><span>' + T.eigene + ":</span>" + eigeneAuswahl(T) +
        '<button type="button" data-aktion="speichern">' + T.speichern + "</button>" +
        (geladen ? '<button type="button" data-aktion="loeschen">' + T.loeschen + "</button>" : "") +
        (speicherForm ? '<span class="lw-speicherform"><input type="text" maxlength="60" class="lw-liedname" placeholder="' + esc(T.liedName) + '" value="' + esc(speicherForm.name) + '">' +
          (gruppeOk ? '<button type="button" data-aktion="fueralle">' + T.fuerAlle + "</button>" : "") +
          '<button type="button" data-aktion="nurhier">' + T.nurHier + '</button><button type="button" data-aktion="abbrechen">' + T.abbrechen + "</button></span>" : "") +
      "</div>" +
      '<div class="lw-vorlagen lw-kulisse"><span>' + T.kulisse + ":</span>" + kulisseWahl(T) +
        '<label class="lw-feld lw-regler lw-kulregler"><span>' + T.kulisseLaut + ' <b class="lw-kval">' + S.kulisseVol * 10 + ' %</b></span><input type="range" min="0" max="10" step="1" value="' + S.kulisseVol + '" data-feld="kulvol"></label>' +
      "</div>" +
      '<div class="lw-vorlagen lw-effekte"><span>' + T.effekte + ":</span>" + EFFEKTE.map(f => '<button type="button" data-sfx="' + f + '">' + T.sfx[f] + "</button>").join("") + "</div>" +
      '<div class="lw-vorlagen lw-effekte"><span>🎭 ' + T.momente + ":</span>" + MOMENTE.map(f => '<button type="button" data-sfx="' + f + '">' + T.sfx[f] + "</button>").join("") + "</div>" +
      '<div class="lw-vorlagen lw-stimmungen"><span>' + T.stimmungen + ":</span>" +
        STIMMUNGEN.map(k => '<button type="button" data-vorlage="' + k + '"' + (S.stimmung === k ? ' class="an"' : "") + ">" + T.vorlagen[k] + "</button>").join("") +
        (S.stimmung ? '<span class="lw-wandelt">' + esc(T.wandelt(T.vorlagen[S.stimmung].replace(/^\S+\s/, ""))) + "</span>" : "") +
        intRegler(T) + '<div class="lw-stimm-mix">' + mixRegler(T) + "</div>" + '<p class="lw-tipp">' + T.stimmungTipp + "</p>" +
      "</div>" +
      '<div class="lw-teile">' +
        '<span class="lw-teile-label">' + T.teil + ":</span>" +
        TEILE.map(p => '<button type="button" class="lw-teil' + (teilBenutzt(p) ? "" : " leer") + '" data-teil="' + p + '" aria-pressed="' + (bearbeite === p) + '">' + p + "</button>").join("") +
        '<label class="lw-feld lw-ablauf"><span>' + T.ablauf + '</span><select data-feld="ablauf">' + ablaeufe + "</select></label>" +
        '<span class="lw-kopieren"><span class="lw-teile-label">' + T.kopierenNach(bearbeite) + ":</span>" +
          TEILE.filter(z => z !== bearbeite).map(z => '<button type="button" class="lw-klein' + (kopierZiel === z ? " warnung" : "") + '" data-kopiere="' + z + '">' +
            (kopierZiel === z ? T.ueberschreiben(z) : "→ " + z) + "</button>").join("") + "</span>" +
      "</div>" +
      '<div class="lw-scroll"><div class="lw-raster">' + raster + "</div></div>" +
      '<p class="lw-wisch">' + T.wischen + "</p>" +
      '<div class="lw-fuss"><button type="button" class="lw-teilen">' + T.teilen + '</button><span class="lw-status" aria-live="polite"></span></div>';

    spalten = Array.from({ length: SCHRITTE }, (_, i) => Array.from(root.querySelectorAll('.lw-zelle[data-s="' + i + '"]')));
    aktiv = -1;
    figurCache = {};
  }
  const teilBenutzt = p => IDS.some(k => S.teile[p][k].some(v => v >= 0));
  /* ---------- Mini-Player oben: erscheint, wenn die Musik läuft und das Lautenwerk nicht zu sehen ist ---------- */
  let mini = null, lautenwerkSichtbar = true;
  function miniBauen() {
    const tools = document.querySelector("header.top .tools");
    if (!tools || mini) return;
    mini = document.createElement("div");
    mini.className = "lw-mini"; mini.hidden = true;
    mini.innerHTML = '<a class="lw-mini-titel" href="#taverne"><span class="lw-mini-note">♪</span><span class="lw-mini-name"></span></a><button type="button" class="lw-mini-knopf"></button>';
    tools.insertBefore(mini, tools.firstChild);
    mini.querySelector(".lw-mini-knopf").addEventListener("click", () => {
      if (hoerer) { const b = root.querySelector('[data-aktion="hoeren"]'); if (b) b.click(); return; }
      laeuft ? stopp(true) : start(true);
    });
    if (window.IntersectionObserver) new IntersectionObserver(e => { lautenwerkSichtbar = e[e.length - 1].isIntersecting; miniAnzeigen(); }).observe(root);
  }
  function miniAnzeigen() {
    if (!mini) return;
    const T = t();
    mini.hidden = !((laeuft || pausiert) && !lautenwerkSichtbar);
    mini.classList.toggle("spielt", laeuft);
    mini.querySelector(".lw-mini-name").textContent = S.titel || T.eigenesLied;
    mini.querySelector(".lw-mini-titel").title = T.miniZur;
    const k = mini.querySelector(".lw-mini-knopf");
    k.textContent = laeuft ? "❚❚" : "▶"; k.setAttribute("aria-label", laeuft ? T.miniPause : T.miniWeiter); k.title = k.getAttribute("aria-label");
  }
  function knoepfe() {
    miniAnzeigen();
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
    if (S.stimmung) { S.stimmung = null; const w = root.querySelector(".lw-wandelt"); if (w) w.remove(); root.querySelectorAll(".lw-stimmungen [data-vorlage]").forEach(b => b.classList.remove("an")); }
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
  function vorlageWaehlen(k) {
    const mix = { vol: S.vol, mute: S.mute };
    const behalten = { intensitaet: S.intensitaet, master: S.master, hall: S.hall, hallAus: S.hallAus, raum: S.raum, kulisseVol: S.kulisseVol, pult: S.pult, kulisse: S.kulisse };
    let neu;
    if (k === "leer") { neu = Object.assign({}, S, { teile: { A: teilLeer(), B: teilLeer(), C: teilLeer(), D: teilLeer() }, titel: "", stimmung: null }); }
    else if (k === "zufall") neu = zufallsLied();
    else if (STIL[k]) neu = stimmungLied(k);
    else neu = pruefen(ausVorlage(k, mix));
    Object.assign(neu, behalten);
    if (k !== "leer") {
      neu.titel = k === "zufall" ? t().zufall.replace(/^\S+\s/, "") : t().vorlagen[k].replace(/^[^\wÄÖÜäöü]+/, "");
      if (KULISSE_ZU[k]) neu.kulisse = KULISSE_ZU[k];
    }
    if (k !== "leer" && !STIL[k]) neu.stimmung = null;
    geladen = null; bearbeite = "A";
    if (laeuft && k !== "leer") {
      /* sanft: erst am nächsten Taktanfang wechseln; Klänge schon jetzt vorbereiten */
      wechsel = neu;
      const alt = S; S = neu; try { saitenVorbereiten(); } catch (_) {} S = alt;
      root.querySelectorAll("[data-vorlage]").forEach(b => b.classList.toggle("wartet", b.dataset.vorlage === k));
      status(t().wechselGleich(neu.titel || ""));
      return;
    }
    S = neu;
    merken(); neuGezeichnet(); saitenVorbereiten();
  }
  function neuGezeichnet() { zeichnen(); knoepfe(); if (laeuft) { bordunAus(); bordunAn(); } }

  root.addEventListener("click", e => {
    const z = e.target.closest(".lw-zelle");
    if (z) { antippen(z); return; }
    const hk = e.target.closest("[data-hall]");
    if (hk) { const k = hk.dataset.hall; S.hallAus[k] = S.hallAus[k] ? 0 : 1; hk.setAttribute("aria-pressed", !S.hallAus[k]); merken(); effekteAnwenden(); return; }
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
    const fk = e.target.closest('[data-aktion="funk"], [data-aktion="funkkopie"], [data-aktion="hoeren"]');
    if (fk) {
      const a = fk.dataset.aktion;
      if (a === "funk") { funkUmschalten(); zeichnen(); knoepfe(); }
      if (a === "funkkopie") {
        const url = funkLink();
        if (navigator.clipboard) navigator.clipboard.writeText(url).then(() => status(t().funkKopiert), () => window.prompt(t().funkKopieren, url));
        else window.prompt(t().funkKopieren, url);
      }
      if (a === "hoeren") {
        hoerer.an = !hoerer.an;
        if (hoerer.an) { audioStart(); saitenVorbereiten(); if (hoerer.zuletzt && hoerer.zuletzt.laeuft) start(); }
        else if (laeuft) stopp();
        zeichnen(); knoepfe();
      }
      return;
    }
    const tl = e.target.closest(".lw-teil");
    if (tl) { bearbeite = tl.dataset.teil; kopierZiel = null; zeichnen(); knoepfe(); return; }
    const ak = e.target.closest("[data-aktion]");
    if (ak && ["speichern", "abbrechen", "nurhier", "fueralle", "loeschen"].includes(ak.dataset.aktion)) {
      const a = ak.dataset.aktion, T = t();
      const nameFeld = root.querySelector(".lw-liedname"), name = nameFeld ? nameFeld.value.trim().slice(0, 60) : "";
      if (a === "speichern") { speicherForm = { name: geladen ? geladen.name : "" }; zeichnen(); knoepfe(); const f = root.querySelector(".lw-liedname"); if (f) f.focus(); return; }
      if (a === "abbrechen") { speicherForm = null; zeichnen(); knoepfe(); return; }
      if ((a === "nurhier" || a === "fueralle") && !name) { status(T.keinName); return; }
      if (a === "nurhier") {
        const id = Date.now().toString(36);
        lokaleLieder.unshift({ id, name, code: kodieren() }); lokalMerken();
        geladen = { quelle: "l", id, name }; speicherForm = null; zeichnen(); knoepfe(); status(T.gespeichertOk(name)); return;
      }
      if (a === "fueralle") {
        const code = kodieren();
        passwort().then(pw => {
          if (!pw) return;
          return liedServer("/rest/v1/rpc/lied_speichern", { passwort: pw, titel: name, liedcode: code }).then(id => {
            geladen = { quelle: "g", id, name }; speicherForm = null;
            return gruppeLaden().then(() => { zeichnen(); knoepfe(); status(T.gespeichertOk(name)); });
          });
        }).catch(() => status(T.serverFehler));
        return;
      }
      if (a === "loeschen" && geladen) {
        if (!window.confirm(T.loeschenFrage(geladen.name))) return;
        const g = geladen;
        if (g.quelle === "l") {
          lokaleLieder = lokaleLieder.filter(l => l.id !== g.id); lokalMerken();
          geladen = null; zeichnen(); knoepfe(); status(T.geloescht(g.name)); return;
        }
        passwort().then(pw => {
          if (!pw) return;
          return liedServer("/rest/v1/rpc/lied_loeschen", { passwort: pw, lied_id: g.id })
            .then(() => gruppeLaden()).then(() => { geladen = null; zeichnen(); knoepfe(); status(T.geloescht(g.name)); });
        }).catch(() => status(T.serverFehler));
        return;
      }
    }
    const kp = e.target.closest("[data-kopiere]");
    if (kp) {
      const von = bearbeite, nach = kp.dataset.kopiere;
      if (teilBenutzt(nach) && kopierZiel !== nach) { kopierZiel = nach; zeichnen(); knoepfe(); status(t().sicher(nach)); return; }
      kopierZiel = null;
      S.teile[nach] = kopie(S.teile[von]); merken(); bearbeite = nach; zeichnen(); knoepfe(); status(t().kopiert2(von, nach)); return;
    }
    if (kopierZiel && !e.target.closest(".lw-zelle")) { kopierZiel = null; }
    const sch = e.target.closest(".lw-schalter[data-feld]");
    if (sch) {
      const f = sch.dataset.feld; S[f] = S[f] ? 0 : 1; sch.setAttribute("aria-pressed", !!S[f]); merken();
      if (f === "bordun" && laeuft) { S.bordun ? bordunAn() : bordunAus(); }
      return;
    }
    const v = e.target.closest("[data-vorlage]");
    if (v) { vorlageWaehlen(v.dataset.vorlage); return; }
    const kb = e.target.closest("[data-kulisse]");
    if (kb) { audioStart(); S.kulisse = kb.dataset.kulisse; merken(); kulisseStart(true); zeichnen(); knoepfe(); return; }
    const fx = e.target.closest("[data-sfx]");
    if (fx) { try { audioStart(); effekt(fx.dataset.sfx); funkSenden("fx", { art: fx.dataset.sfx }); fx.classList.remove("blitz"); void fx.offsetWidth; fx.classList.add("blitz"); } catch (_) {} return; }
    if (e.target.closest('[data-aktion="pult"]')) { S.pult = !S.pult; merken(); zeichnen(); knoepfe(); root.scrollIntoView({ block: "start" }); return; }
    if (e.target.closest('[data-aktion="kulisse"]')) { audioStart(); kul ? kulisseStop() : kulisseStart(true); zeichnen(); knoepfe(); return; }
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
    if (d.feld === "master") { S.master = +e.target.value; root.querySelectorAll(".lw-mval").forEach(x => x.textContent = S.master * 10 + " %"); merken(); effekteAnwenden(); }
    if (d.feld === "kulvol") { S.kulisseVol = +e.target.value; root.querySelectorAll(".lw-kval").forEach(x => x.textContent = S.kulisseVol * 10 + " %"); merken(); effekteAnwenden(); }
    if (d.feld === "intensitaet") {
      S.intensitaet = +e.target.value;
      root.querySelectorAll(".lw-ival").forEach(x => x.textContent = t().intStufen[S.intensitaet]);
      merken();
    }
    if (d.feld === "hall") { S.hall = +e.target.value; root.querySelectorAll(".lw-hval").forEach(x => x.textContent = S.hall * 10 + " %"); merken(); effekteAnwenden(); }
  });
  root.addEventListener("change", e => {
    const f = e.target.dataset && e.target.dataset.feld;
    if (f === "intensitaet" && S.stimmung && STIL[S.stimmung]) { if (laeuft) intensitaetNeu = true; else stimmungWeiter(); }
    if (f === "transpose") { S.transpose = +e.target.value; merken(); zeichnen(); knoepfe(); bordunStimmen(); saitenVorbereiten(); }
    if (f === "modus") { S.modus = e.target.value; merken(); zeichnen(); knoepfe(); saitenVorbereiten(); }
    if (f === "ablauf") { S.ablauf = e.target.value; merken(); }
    if (f === "kulisse") { audioStart(); S.kulisse = e.target.value; merken(); kulisseStart(true); zeichnen(); knoepfe(); }
    if (f === "liedwahl" && e.target.value) { vorlageWaehlen(e.target.value); }
    if (f === "raum") { S.raum = e.target.value; if (!S.hall) { S.hall = 5; const r = root.querySelector('[data-feld="hall"]'); if (r) r.value = 5; root.querySelector(".lw-hval").textContent = "50 %"; effekteAnwenden(); } merken(); raumAnwenden(); }
    if (f === "gespeichert" && e.target.value) {
      const [q, id] = e.target.value.split(":"), l = (q === "g" ? gruppenLieder : lokaleLieder).find(x => String(x.id) === id);
      const d = l && dekodieren(l.code);
      if (d) {
        d.vol = S.vol; d.mute = S.mute; d.master = S.master; d.hall = S.hall; d.hallAus = S.hallAus; d.raum = S.raum; d.kulisse = S.kulisse; d.kulisseVol = S.kulisseVol; d.pult = S.pult; S = d; S.stimmung = null; S.titel = l.name; geladen = { quelle: q, id: l.id, name: l.name }; bearbeite = "A";
        merken(); neuGezeichnet(); saitenVorbereiten(); status(t().liedGeladen(l.name));
      }
    }
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
.lw-figur .kette, .lw-figur .z-req { transform-origin: 104px 140px; }
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
@keyframes lwklopf { 40% { transform: translate(-1px, 4px) } }
@keyframes lwwackel { 40% { transform: rotate(-1.5deg) } }
@keyframes lwfuss { 40% { transform: rotate(-8deg) } }
@keyframes lwbling { 40% { filter: drop-shadow(0 0 4px #ffd27a) brightness(1.6) } }
@keyframes lwzupf { 40% { transform: translate(4px, 5px) rotate(-2deg) } }
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
.lw-kopieren { display: inline-flex; flex-wrap: wrap; align-items: center; gap: .35rem; }
.lw-klein.warnung { border-color: var(--blood); color: #ffb3a8; background: rgba(155,58,47,.25); }
.lw-vorlagen { display: flex; flex-wrap: wrap; align-items: center; gap: .35rem; font-size: .85rem; color: var(--ash); }
.lw-vorlagen button { border: 1px solid var(--line); background: none; color: var(--vellum); font: inherit; font-size: .82rem; padding: .25rem .7rem; cursor: pointer; }
.lw-vorlagen button:hover { border-color: var(--ember); color: var(--ember); }
.lw-stimmungen { padding: .6rem .7rem; border: 1px dashed var(--line); }
.lw-intensitaet { flex: 1 1 100%; margin-top: .5rem; }
.lw-stimm-mix { flex: 1 1 100%; display: flex; flex-wrap: wrap; gap: .5rem 1rem; align-items: flex-end; margin-top: .4rem; }
.lw-intensitaet input { width: 100%; accent-color: #c0502a; }
.lw-master input, .lw-hallregler input, .lw-kulregler input { width: 7rem; }
.lw-vorlagen button.wartet { border-color: var(--ember); color: var(--ember); animation: lwpuls 1s ease-in-out infinite; }
.lw-effekte button.blitz, .lw-pult-fx button.blitz { animation: lwblitz .5s ease-out; }
@keyframes lwblitz { 0% { background: var(--ember); color: var(--night); } }
.lw-pultknopf { border-color: var(--ember); color: var(--ember); }
.lw-buehne-klein { height: clamp(130px, 24vw, 190px); }
.lw-pult { display: grid; gap: 1.1rem; }
.lw-pult section { display: grid; gap: .55rem; padding: .8rem .9rem; border: 1px solid var(--line); background: rgba(235,226,204,.025); }
.lw-pult h4 { margin: 0; font-family: var(--body); font-size: .72rem; font-weight: 600; letter-spacing: .18em; text-transform: uppercase; color: var(--ember); }
.lw-pult-kopf { display: flex; flex-wrap: wrap; align-items: center; gap: .8rem; }
.lw-play-gross { font-size: 1.1rem; padding: .8rem 1.6rem; min-width: 10rem; }
.lw-hoeren { border: 1px solid var(--ember); background: var(--ember); color: var(--night); font: inherit; font-weight: 600; cursor: pointer; }
.lw-hoeren.an { background: none; color: var(--ember); }
.lw-funk-zeile { display: flex; flex-wrap: wrap; gap: .5rem; margin: .4rem 0; }
.lw-funk-link { flex: 1 1 14rem; min-width: 0; background: rgba(0,0,0,.3); border: 1px solid var(--line); color: inherit; font: inherit; font-size: .85rem; padding: .45rem .6rem; }
.lw-funk-status { margin: .5rem 0; font-size: .95rem; }
.lw-pult-titel { font-family: var(--name); font-size: 1.3rem; color: var(--vellum); flex: 1; }
.lw-pult-gitter { display: grid; grid-template-columns: repeat(auto-fill, minmax(9.5rem, 1fr)); gap: .45rem; }
.lw-pult-gitter button { border: 1px solid var(--line); background: rgba(16,14,21,.6); color: var(--vellum); font: inherit; font-size: .95rem; padding: .75rem .6rem; cursor: pointer; text-align: left; }
.lw-pult-gitter button:hover { border-color: var(--ember); color: var(--ember); }
.lw-pult-gitter button.an { background: var(--ember); border-color: var(--ember); color: var(--night); }
.lw-pult-mix { display: flex !important; flex-wrap: wrap; align-items: end; gap: 1rem; }
.lw-pult-lieder { max-width: 100%; font-size: .9rem; padding: .45rem; }
@media (max-width: 560px) { .lw-pult-gitter { grid-template-columns: 1fr 1fr; } .lw-pult-gitter button { font-size: .85rem; padding: .6rem .45rem; } }
.lw-hallknopf { border: 1px solid var(--line); background: none; font-size: .78rem; line-height: 1; padding: .2rem .35rem; cursor: pointer; border-radius: 3px; opacity: .45; filter: grayscale(1); }
.lw-hallknopf[aria-pressed="true"] { opacity: 1; filter: none; border-color: rgba(224,160,70,.6); }
.lw-mini { display: inline-flex; align-items: center; gap: .35rem; margin-right: .6rem; padding: .15rem .25rem .15rem .55rem; border: 1px solid rgba(224,160,70,.6); border-radius: 999px; background: rgba(16,14,21,.7); }
.lw-mini[hidden] { display: none; }
.lw-mini-titel { display: inline-flex; align-items: center; gap: .35rem; color: var(--vellum); text-decoration: none; font-size: .8rem; max-width: 11rem; }
.lw-mini-name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.lw-mini-note { color: var(--ember); }
.lw-mini.spielt .lw-mini-note { animation: lwpuls 1.2s ease-in-out infinite; }
.lw-mini-knopf { width: 1.9rem; height: 1.9rem; border-radius: 50%; border: 1px solid var(--ember); background: var(--ember); color: var(--night); font-size: .7rem; cursor: pointer; display: grid; place-items: center; padding: 0; }
@media (max-width: 640px) { .lw-mini-name { display: none; } .lw-mini { margin-right: .3rem; } }
.lw-vorlagen button.an { border-color: var(--ember); color: var(--night); background: var(--ember); }
.lw-wandelt { font-family: var(--hand); font-size: 1.15rem; color: var(--ember); margin-left: .3rem; animation: lwpuls 2.4s ease-in-out infinite; }
@keyframes lwpuls { 50% { opacity: .45; } }
.lw-gespeichert { font: inherit; font-size: .82rem; background: var(--night); color: var(--vellum); border: 1px solid var(--line); padding: .25rem .4rem; max-width: 16rem; }
.lw-speicherform { display: inline-flex; flex-wrap: wrap; align-items: center; gap: .35rem; }
.lw-liedname { font: inherit; font-size: .85rem; background: var(--night); color: var(--vellum); border: 1px solid var(--ember); padding: .25rem .45rem; width: 12rem; }
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
  /* Requisiten: nur das gewählte Instrument ist sichtbar */
  css.textContent += ".lw-figur .req { display: none; }\n" +
    INSTRUMENTE.map(i => '.lw-buehne[data-mel="' + i + '"] .m-' + (i === "laute" ? "laute" : i) + " { display: inline; }").join("\n") + "\n" +
    BAND.trommel.map(i => '.lw-buehne[data-tr="' + i + '"] .f-' + i + " { display: inline; }").join("\n") + "\n" +
    BAND.floete.map(i => '.lw-buehne[data-fl="' + i + '"] .e-' + i + " { display: inline; }").join("\n") + "\n" +
    BAND.ketten.map(i => '.lw-buehne[data-ez="' + i + '"] .z-' + i + " { display: inline; }").join("\n") + "\n" +
    '.lw-buehne[data-ez="klatschen"] .z-links-std, .lw-buehne[data-ez="klatschen"] .z-rechts-std, .lw-buehne[data-ez="schnipsen"] .z-rechts-std { display: none; }\n';
  document.head.appendChild(css);

  zeichnen();
  miniBauen();
  gruppeLaden().then(() => { if (gruppeOk) { zeichnen(); knoepfe(); } });
  let letzteSprache = sprache();
  new MutationObserver(() => { if (sprache() === letzteSprache) return; letzteSprache = sprache(); zeichnen(); knoepfe(); }).observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });
  if (hoerer) setTimeout(() => root.scrollIntoView({ block: "start" }), 400);
  if (ausLink) {
    setTimeout(() => {
      root.scrollIntoView({ block: "start" });
      status(t().geladen);
    }, 400);
  }
})();
