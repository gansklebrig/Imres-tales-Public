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
   Jedes Lied besteht aus bis zu 16 Teilen (A–P, je ein Takt) und einem Ablauf,
   z. B. A-A-B-A. Jeder Teil hat eine Rolle im Lied (Vorspiel, Strophe, Aufbau,
   Refrain, Zwischenteil, Höhepunkt) – mehrere Teile hintereinander bilden einen
   Abschnitt, so entstehen Melodien über vier Takte. Der Variations-Regler lässt die Band frei improvisieren:
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
  /* Sparmodus für Handys: größerer Audiopuffer, vorgerechnete Klänge, schlankere Kulissen */
  let spar = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent || "");
  try { const v = localStorage.getItem("imres-lw-spar"); if (v === "1" || v === "0") spar = v === "1"; } catch (_) {}
  /* Auf Handys und Tablets immer die leichte Bauweise für Hall und Raumklang – auch ohne Sparmodus:
     ein gemeinsames Hall-Netz statt zwei Faltungshallen, keine Stereo-Verteilung, etwas schlankeres Orchester */
  const mobil = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent || "") || (navigator.maxTouchPoints > 1 && /Mac/.test(navigator.platform || ""));
  /* einmal beim Start der Tonberechnung festgelegt – ein Umschalten des Sparmodus gilt erst nach dem Neuladen */
  let leichtFest = null;
  const leicht = () => leichtFest !== null ? leichtFest : (spar || mobil);
  try { const c = new URLSearchParams(location.search).get("lauschen"); if (c && /^[a-z0-9]{4,16}$/i.test(c)) hoerer = { raum: c.toLowerCase(), an: false, verbunden: false, zuletzt: null }; } catch (_) {}

  const ruhig = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const sprache = () => (document.documentElement.lang === "en" ? "en" : "de");
  const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const zufall = l => l[Math.floor(Math.random() * l.length)];
  const SCHRITTE = 16;
  /* Spielzustand eines Teils: Tonart-Anhebung im Höhepunkt, Break, verändertes Taktgefühl */
  let hebung = 0, brk = null, brkAb = 99, gefuehl = null;

  /* ---------- Spuren ---------- */
  /* art "an" = nur an/aus, art "ton" = eine Zeile pro Ton */
  const SPUREN = [
    { id: "klopf", wer: "barradin", art: "an", sym: "✊" },
    { id: "schelle", wer: "barradin", art: "an", sym: "🔔" },
    { id: "bass", wer: "barradin", art: "ton", zeilen: 7 },
    { id: "melodie", wer: "barradin", art: "ton", zeilen: 15 },
    { id: "trommel", wer: "friedrich", art: "an", sym: "🥁" },
    { id: "floete", wer: "echo", art: "ton", zeilen: 8 },
    { id: "ketten", wer: "ezekiel", art: "an", sym: "⛓" },
    { id: "rex", wer: "rex", art: "ton", zeilen: 3 }
  ];
  const IDS = SPUREN.map(s => s.id);
  const SPUR = Object.fromEntries(SPUREN.map(s => [s.id, s]));
  const TEILE = "ABCDEFGHIJKLMNOP".split("");
  /* Rolle jedes Teils: i = Vorspiel, s = Strophe, v = Aufbau (vor dem Refrain), r = Refrain, b = Zwischenteil, h = Höhepunkt.
     Lieder ohne gespeicherte Rollen behalten die alte Bedeutung: A Strophe, B Refrain, C Zwischenteil (Solo der Gäste), D Höhepunkt. */
  const ROLLEN = ["i", "s", "v", "r", "b", "h"];
  const ROLLE_ALT = { A: "s", B: "r", C: "b", D: "h" };
  const rollenStandard = () => TEILE.map(p => ROLLE_ALT[p] || "s").join("");
  const rolleVon = (s, p) => (s.rollen && s.rollen[TEILE.indexOf(p)]) || ROLLE_ALT[p] || "s";
  const ABLAEUFE = ["A", "AB", "AABB", "AABA", "ABAB", "AAAB", "ABC", "ABAC", "AABC", "ABCB", "AABACA", "AABBCC", "ABCD", "ABCABCD", "ABACABAD", "AABBCCDD"];
  /* Barradins Instrumente für die Melodie-Spur */
  const INSTRUMENTE = ["laute", "harfe", "mandoline", "fidel", "drehleier", "schalmei", "dudelsack", "glocken", "illusion", "hackbrett", "cembalo", "akkordeon", "sitar"];
  const GEHALTEN = { fidel: 1, drehleier: 1, schalmei: 1, dudelsack: 1, illusion: 1, akkordeon: 1 };
  /* Die Instrumente der übrigen Band */
  const BAND = {
    trommel: ["trommel", "pauke", "bodhran", "tamburin", "stoecke", "taiko"],
    floete: ["floete", "panfloete", "okarina", "gesang", "horn", "klarinette", "oboe", "blockfloete", "piccolo", "pfeife", "shakuhachi", "englischhorn", "oohchor", "bratsche"],
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
  const KULISSEN = ["keine", "taverne", "feuer", "wald", "waldnacht", "regen", "zelt", "sturm", "meer", "schiff", "wasserfall", "hoehle", "unterreich", "kerker", "sumpf", "unterwasser", "schmiede", "labor", "bibliothek", "tempel", "dorf", "markt", "hafen", "gebirge", "mine", "strasse", "burg", "ufer"];
  /* Bühnenbild für die neueren Kulissen: nächstliegendes vorhandenes Bild */
  const KUL_BILD = { waldnacht: "wald", zelt: "regen", schiff: "meer", wasserfall: "wald", unterreich: "hoehle", kerker: "hoehle", sumpf: "wald", unterwasser: "meer", schmiede: "feuer", labor: "taverne", bibliothek: "taverne", tempel: "hoehle", dorf: "wald", markt: "taverne", hafen: "meer", gebirge: "sturm", mine: "hoehle", strasse: "wald", burg: "taverne", ufer: "wald" };
  const KULISSE_ZU = { rast: "feuer", unterreich: "hoehle", reise: "strasse", spannung: "hoehle", sieg: "taverne", kampf: "keine",
    taverne: "taverne", hafen: "hafen", wald: "wald", schmiede: "schmiede", wiegen: "feuer", trauer: "regen", ballade: "taverne",
    auenland: "wald", elben: "wald", zwerge: "mine", reiter: "strasse", dorffest: "taverne", kamin: "feuer", shanty: "meer", pilger: "regen",
    klage: "regen", marktplatz: "markt", hof: "burg", grusel: "hoehle", fey: "wald", boss: "sturm",
    heldenlied: "burg", trinklied: "taverne", verfolgung: "strasse", ruinen: "tempel" };
  const EFFEKTE = ["drache", "schwert", "tuer", "donner", "schrei", "wuerfel", "zauber", "horn", "jubel"];
  /* lustige Spieltisch-Momente */
  const MOMENTE = ["tusch", "posaune", "krit", "dramatisch", "grillen", "ooh", "muenzen", "ruelpser", "schnarchen", "bonk",
    "lufthorn", "kratzer", "boom", "falsch", "richtig", "rutsch", "boing", "hupe", "halleluja", "levelup", "schock", "wirbel"];
  /* Kampfgeräusche */
  const KAMPF_FX = ["bogen", "pfeil", "hieb", "verfehlt", "block", "wucht", "schmerz", "sterben", "feuerball", "blitz", "heiltrank"];
  /* gemeinfreie Klassiker, von der eigenen Band mit echten Instrumenten gespielt */
  const KLASSIKER = ["zirkus", "trauermarsch", "toccata", "zarathustra", "bergkoenig", "walkuere", "galopp", "hochzeit",
    "elise", "nachtmusik", "freude", "diesirae", "wiegenlied", "morgen", "zapfenstreich", "angriff", "kanon", "fruehling", "turca"];
  const COVER_LISTE = ["matrose", "washerwoman", "swallowtail", "morrison", "drowsymaggie", "cooley", "scarborough", "greensleeves", "folia", "korobeiniki", "amazinggrace", "bruderjakob", "sakura", "auldlangsyne", "shchedryk"];
  const ALLE_FX = EFFEKTE.concat(KAMPF_FX, MOMENTE, KLASSIKER, COVER_LISTE);
  const BAND_START = () => ({ trommel: "trommel", floete: "floete", ketten: "ketten" });
  const SYMBOL = {
    trommel: { trommel: "🥁", pauke: "🥁", bodhran: "🥁", tamburin: "🥁", stoecke: "🥢", taiko: "🥁" },
    ketten: { ketten: "⛓", klatschen: "👏", schnipsen: "👌", rassel: "🥚", stampfen: "🦶", loeffel: "🥄", krug: "🍺" }
  };

  /* ---------- Texte ---------- */
  const TX = {
    de: {
      label: "Spielmannskunst", titel: "Barradins Lautenwerk",
      text: "Die Gefährten spielen auf, du bestimmst wie. Tippe in die Raster: Barradin klopft, klingelt, zupft den Bass und spielt die Melodie, Friedrich schlägt den Takt, Echo spielt die zweite Stimme, Ezekiel sorgt für den Rhythmus – und Rex gibt seinen Senf dazu. Bei jedem Gefährten kannst du das Instrument wählen.",
      spielen: "▶ Spielen", stopp: "■ Anhalten", ausklang: "🎼 Ausklang", ausklangTipp: "Spielt den Takt zu Ende und schließt mit einem Schlussakkord", ausklingt: "🎼 Die Band spielt den Schlussakkord …", tempo: "Tempo", tonart: "Tonart", modus: "Tonleiter",
      swing: "Tanzschritt", bordun: "Bordun", variation: "Variation",
      wer: { barradin: "Barradin", friedrich: "Friedrich", echo: "Echo", ezekiel: "Ezekiel", rex: "Rex" },
      spuren: { klopf: "Klopfen", schelle: "Schellen", bass: "Bass", melodie: "Laute", trommel: "Trommel", floete: "Flöte", ketten: "Ketten", rex: "Rex" },
      rexZeilen: ["Wuff", "Heulen", "Knurren"], rexLaut: ["Wuff!", "Auuuuu!", "Grrrr …"],
      instrument: "Instrument", instrumente: { laute: "Laute", harfe: "Harfe", mandoline: "Mandoline", fidel: "Fidel", drehleier: "Drehleier", schalmei: "Schalmei", dudelsack: "Dudelsack", glocken: "Glockenspiel", illusion: "Flöte der Illusionen", hackbrett: "Hackbrett", cembalo: "Cembalo", akkordeon: "Akkordeon", sitar: "Sitar" },
      band: {
        trommel: { trommel: "Landsknechttrommel", pauke: "Kesselpauke", bodhran: "Bodhrán", tamburin: "Schellentrommel", stoecke: "Holzstöcke", taiko: "Taiko-Trommel" },
        floete: { floete: "Holzflöte", panfloete: "Panflöte", okarina: "Okarina", gesang: "Gesang", horn: "Hirtenhorn", klarinette: "Klarinette", oboe: "Oboe",
          blockfloete: "Blockflöte", piccolo: "Piccoloflöte", pfeife: "Blechpfeife", shakuhachi: "Shakuhachi", englischhorn: "Englischhorn", oohchor: "Chor", bratsche: "Bratsche" },
        ketten: { ketten: "Ketten", klatschen: "Klatschen", schnipsen: "Schnipsen", rassel: "Rassel", stampfen: "Stampfen", loeffel: "Löffel", krug: "Krug auf den Tisch" }
      },
      alleSpuren: "Alle", schritte: "Schritte",
      teil: "Teil bearbeiten", ablauf: "Ablauf", rolleVon: p => "Rolle von " + p, pattern: "Pattern", kette: "Kette",
      modusTitel: "Art zu komponieren", modusPattern: "▦ 4 Pattern", modusLied: "▤ Ganzes Lied",
      modusPatternTipp: "Wie an einer Groovebox: vier Takte A–D, die du zu einer Kette verbindest.",
      modusLiedTipp: "Bis zu 16 Takte mit Rollen wie Strophe und Refrain – so komponieren auch die Stimmungen.",
      liedHinweis: n => "Gerade ist ein ganzes Lied mit " + n + " Takten geladen (Strophe, Refrain, Schlussrefrain …). Im Pattern-Modus gibt es nur vier Pattern A–D.",
      zuPattern: "▦ In 4 Pattern umwandeln", liedBearbeiten: "▤ Ganzes Lied bearbeiten",
      umgewandelt: "In vier Pattern umgewandelt: A Strophe, B Refrain, C Zwischenteil, D Höhepunkt.",
      rollen: { i: "Vorspiel", s: "Strophe", v: "Aufbau", r: "Refrain", b: "Zwischenteil", h: "Höhepunkt" }, kopierenNach: a => a + " kopieren nach", ueberschreiben: b => b + " überschreiben?", kopiert2: (a, b) => "Teil " + a + " wurde nach " + b + " kopiert.",
      sicher: b => "Teil " + b + " ist nicht leer – zum Überschreiben noch einmal tippen.",
      lieder: "Lieder", stimmungen: "Stimmungen", intensitaet: "Intensität", intStufen: ["kaum hörbar", "sehr ruhig", "ruhig", "gelassen", "gemäßigt", "normal", "lebhaft", "bewegt", "drängend", "wild", "entfesselt"],
      vorlagen: { taverne: "Tavernentanz", ballade: "Ballade", hafen: "⚓ Hafenlied", wald: "🌲 Waldweise", schmiede: "⚒ Schmiede", trauer: "Trauerlied", wiegen: "Wiegenlied",
        kampf: "⚔ Kampf", unterreich: "🦇 Unterreich", reise: "🗺 Reise", spannung: "👁 Spannung", sieg: "🏆 Sieg", rast: "🔥 Lager",
        auenland: "🌿 Auenland", elben: "✨ Elben", zwerge: "⛏ Zwerge", reiter: "🐎 Reiter", dorffest: "💃 Dorffest", kamin: "🕯 Kamin", shanty: "🌊 Shanty", pilger: "⛪ Pilger",
        klage: "🥀 Klage", marktplatz: "🛒 Marktplatz", hof: "👑 Königshof", grusel: "👻 Spukhaus", fey: "🧚 Feenwald", boss: "🐲 Endgegner",
        heldenlied: "🛡 Heldenlied", trinklied: "🍻 Trinklied", verfolgung: "🏃 Verfolgung", ruinen: "🏛 Ruinen" },
      klangwelten: "Klangwelten", klangTipp: "Volksmusik und Fantasy-Klänge – jedes Mal neu komponiert, im Stil vertraut, aber immer eigene Melodien.",
      zufall: "🎲 Zufall", leeren: "Leeren",
      stumm: "Stumm schalten", lautstaerke: "Lautstärke", zuklappen: "Ein- oder ausklappen",
      teilen: "🔗 Lied teilen", kopiert: "Link kopiert – schick ihn an die Gruppe!", geteilt: "Geteilt!",
      geladen: "Ein geteiltes Lied wurde geladen.",
      stimmungTipp: "Jeder Klick komponiert ein neues Stück im Stil der Stimmung. Solange es läuft, wandelt es sich nach jedem Durchgang weiter – perfekt als Hintergrund für eure Sessions. Sobald du im Raster etwas änderst, bleibt es so, wie es ist.",
      wandelt: k => "♪ " + k + " wandelt sich weiter …",
      master: "Musik", fxLaut: "Effekte", hall: "Hall", raum: "Raum",
      wechselGleich: n => "→ „" + n + "“ beginnt mit dem nächsten Takt …",
      kulisse: "Geräuschkulisse", kulisseLaut: "Kulisse",
      kulissen: { keine: "– keine –", taverne: "🍺 Taverne", feuer: "🔥 Lagerfeuer", regen: "🌧 Regen", wald: "🌲 Wald", hoehle: "💧 Höhle", meer: "🌊 Küste", sturm: "⛈ Gewitter",
        waldnacht: "🌙 Wald bei Nacht", zelt: "⛺ Zelt im Regen", schiff: "⛵ An Deck", wasserfall: "🏞 Wasserfall", unterreich: "🕸 Unterreich", kerker: "⛓ Kerker", sumpf: "🐸 Sumpf", unterwasser: "🫧 Unter Wasser", schmiede: "⚒ Schmiede", labor: "⚗ Alchemistenstube", bibliothek: "📚 Bibliothek", tempel: "⛪ Tempel",
        dorf: "🐓 Bauernhof", markt: "🛒 Marktplatz", hafen: "⚓ Hafen", gebirge: "🏔 Bergpass im Schnee", mine: "⛏ Zwergenmine", strasse: "🐴 Unterwegs", burg: "🏰 Burghof", ufer: "🛶 Flussufer" },
      effekte: "Effekte",
      sfx: { drache: "🐉 Drache", schwert: "⚔ Klingen", tuer: "🚪 Tür", donner: "⚡ Donner", schrei: "😱 Schrei", wuerfel: "🎲 Würfel", zauber: "✨ Zauber", horn: "📯 Horn", jubel: "🍻 Jubel",
        tusch: "🥁 Ba-dum-tss", posaune: "🎺 Wah-wah", krit: "🌟 Nat 20", dramatisch: "😨 Dun-dun", grillen: "🦗 Stille",
        ooh: "😮 Ooooh!", muenzen: "💰 Münzen", ruelpser: "🍺 Rülpser", schnarchen: "😴 Zzz", bonk: "🔨 Bonk",
        lufthorn: "📯 Partyhupe", kratzer: "💿 Moment mal …", boom: "💥 Boom", falsch: "❌ Falsch!", richtig: "✅ Richtig!", rutsch: "📉 Absturz",
        boing: "🌀 Boing", hupe: "🤡 Hup-hup", halleluja: "😇 Halleluja", levelup: "⬆️ Level up!", schock: "😱 Schock", wirbel: "🥁 Trommelwirbel",
        zirkus: "🤡 Zirkus", trauermarsch: "⚰️ Trauermarsch", toccata: "🦇 Schurken-Orgel", zarathustra: "🌅 Zarathustra", bergkoenig: "👺 Bergkönig",
        walkuere: "🐎 Walkürenritt", galopp: "🏇 Galopp", hochzeit: "💍 Hochzeitsmarsch", elise: "🎹 Für Elise", nachtmusik: "🎩 Nachtmusik",
        matrose: "⚓ Drunken Sailor", scarborough: "🌿 Scarborough Fair", greensleeves: "💚 Greensleeves", korobeiniki: "🧱 Korobeiniki", auldlangsyne: "🥂 Auld Lang Syne", shchedryk: "🔔 Schtschedryk",
        amazinggrace: "🕊 Amazing Grace", bruderjakob: "🔁 Bruder Jakob (Kanon)", swallowtail: "🐦 Swallowtail Jig", morrison: "🍀 Morrison's Jig", drowsymaggie: "😴 Drowsy Maggie", cooley: "🎻 Cooley's Reel", folia: "💃 La Folia", washerwoman: "☘️ Irish Washerwoman", sakura: "🌸 Sakura",
        kanon: "👑 Pachelbel-Kanon", fruehling: "🐦 Vivaldi: Frühling", turca: "🐫 Alla turca",
        freude: "🇪🇺 Ode an die Freude", diesirae: "💀 Dies irae", wiegenlied: "🌙 Wiegenlied", morgen: "☀️ Morgenstimmung", zapfenstreich: "🎺 Zapfenstreich", angriff: "📯 Angriff!",
        bogen: "🏹 Bogen", pfeil: "🎯 Pfeil", hieb: "🗡 Hieb", verfehlt: "💨 Verfehlt", block: "🛡 Block", wucht: "🔨 Wucht",
        schmerz: "😫 Aua", sterben: "💀 Tod", feuerball: "🔥 Feuerball", blitz: "⚡ Blitz", heiltrank: "🧪 Trank" }, momente: "Spieltisch-Momente", kampfFx: "Kampf",
      funk: "📡 Mitlauschen", funkTipp: "Alle anderen öffnen den Link und tippen auf „Zuhören“ – die Musik entsteht dann bei jedem selbst im Browser, Stimmungen, Kulisse und Effekte folgen deinem Pult.",
      funkStart: "📡 Für alle übertragen", funkStopp: "Übertragung beenden", funkKopieren: "🔗 Link kopieren", funkKopiert: "Link kopiert – ab damit in den Discord!",
      funkVerbinde: "Verbinde …", funkFehler: "Keine Verbindung – versuche es erneut …", funkZuhoerer: n => n === 1 ? "1 hört zu" : n + " hören zu", funkLaeuft: "Übertragung läuft",
      hTitel: "Imres Musik", hText: "Hier läuft, was Imre am Spieltisch spielt – Musik, Geräuschkulisse und Effekte. Tippe auf „Zuhören“, Lautstärke stellst du selbst ein.",
      hZuhoeren: "🎧 Zuhören", hAus: "❚❚ Stumm", hWarte: "Imre spielt gerade nichts – sobald er startet, hörst du es.", hVerbunden: "Verbunden", hVerbinde: "Verbinde mit Imres Pult …",
      hSelbst: "Selbst spielen statt zuhören", hSignal: (n, s) => "📶 " + n + " Signale von Imre" + (s == null ? "" : " · zuletzt vor " + s + " s"), hIphone: "iPhone: Falls nichts zu hören ist, Lautlos-Schalter prüfen und Lautstärke hochdrehen.", hLaut: "Meine Lautstärke",
      pult: "🎛 Spielleiter-Pult", pultGross: "Spielleiter-Pult öffnen", pultUnter: "Stimmungen, Geräuschkulisse und Effekte für den Spieltisch – mit einem Fingertipp", komplett: "🎼 Komplette Ansicht", pultTipp: "Für den Spieltisch: Stimmungen wechseln sanft am Taktende, Kulisse und Effekte laufen über der Musik.",
      liedWaehlen: "Lied wählen …", kulisseAn: "Kulisse an", kulisseAus: "Kulisse aus", lieder2: "Lieder",
      raeume: { stube: "Kleine Stube", taverne: "Taverne", kapelle: "Kapelle", palast: "Thronsaal", hoehle: "Tropfsteinhöhle" }, hallSpur: "Hall für diese Spur an/aus", miniPause: "Musik pausieren", miniWeiter: "Musik fortsetzen", miniKulStopp: "Geräusche anhalten", miniKulWeiter: "Geräusche wieder starten", miniZur: "Zum Lautenwerk", eigenesLied: "Eigenes Lied",
      orchester: "🎻 Orchester", orchTipp: "Streicher, Hörner und Pauken (echte Aufnahmen) unter den Stimmungen – bauen sich bis zum Höhepunkt auf.",
      echoHall: "Echo-Hall", spar: "🔋 Sparmodus", sparTipp: "Für Handys: weniger Rechenlast, keine Aussetzer. Wirkt nach dem Neuladen der Seite vollständig.", sparAn: "Sparmodus an – lade die Seite neu, damit er ganz greift.", sparAus: "Sparmodus aus – lade die Seite neu, damit es ganz greift.",
      stAlle: n => "Alle " + n + " Stimmungen", stWeniger: "Weniger Stimmungen", kulAlle: n => "Alle " + n + " Kulissen", kulWeniger: "Weniger Kulissen", fxKlappe: "💥 Effekte, Kampf, Momente & Klassik",
      tabStimmungen: "🎭 Stimmungen", tabLieder: "🎼 Lieder", tabEigene: "💾 Eigene", tabEffekte: "💥 Effekte", tabKampf: "⚔ Kampf", tabMomente: "🎭 Momente", tabKlassik: "🎻 Klassiker", coverTitel: "🎤 Cover der Band – alte Volkslieder (nochmal tippen = aus)", vorlagenTitel: "🎵 Lieder der Band",
      musik: "Musik", klang: "Kulisse & Effekte", keineEigenen: "Noch keine gespeicherten Lieder – im Raster komponieren und speichern.",
      eigene: "Eigene Lieder", gespeichert: n => "📂 Gespeicherte Lieder (" + n + ")", gruppe: "Für die ganze Gruppe", lokal: "Nur auf diesem Gerät",
      stimmSpeichern: "💾 Stimmung speichern", stimmNeu: "⭐ Als neue Stimmung", stimmUeber: n => "✎ „" + n + "“ überschreiben", stimmZurueck: "↺ Original wiederherstellen",
      stimmZurueckOk: "Die ursprüngliche Stimmung ist wiederhergestellt.", stimmNamePlatz: "Name der Stimmung",
      stimmTipp: "Merkt sich Intensität, Instrumente, Kulisse samt Lautstärke, Hall, Raum, Echo-Hall und Orchester – in diesem Browser.",
      speichern: "💾 Speichern", loeschen: "🗑 Löschen", liedName: "Name des Liedes", fuerAlle: "Für alle speichern", nurHier: "Nur hier speichern", abbrechen: "Abbrechen",
      gespeichertOk: n => "„" + n + "“ wurde gespeichert.", geloescht: n => "„" + n + "“ wurde gelöscht.", liedGeladen: n => "„" + n + "“ geladen.",
      pwFrage: "Passwort der Questtafel (für gemeinsame Lieder):", pwFalsch: "Das Passwort stimmt nicht.", abmelden: "🔓 Abmelden", abmeldenTipp: "Passwort der Questtafel in diesem Tab vergessen", abgemeldet: "Abgemeldet – das Passwort ist vergessen.", serverFehler: "Der Server ist gerade nicht erreichbar.",
      loeschenFrage: n => "„" + n + "“ wirklich löschen?", keinName: "Bitte gib dem Lied einen Namen.",
      modi: { dorisch: "Dorisch", mixolydisch: "Mixolydisch", aeolisch: "Äolisch", phrygisch: "Phrygisch", ionisch: "Dur", lydisch: "Lydisch" },
      noten: ["C", "C♯", "D", "E♭", "E", "F", "F♯", "G", "G♯", "A", "B", "H"],
      wischen: "← wischen →"
    },
    en: {
      label: "Minstrelsy", titel: "Barradin's Lute Machine",
      text: "The companions strike up, you decide how. Tap the grids: Barradin knocks, jingles, plucks the bass and plays the melody, Friedrich keeps the beat, Echo plays the second voice, Ezekiel adds the rhythm – and Rex adds his two cents. You can pick the instrument for every companion.",
      spielen: "▶ Play", stopp: "■ Stop", ausklang: "🎼 Finish", ausklangTipp: "Plays to the end of the bar and closes with a final chord", ausklingt: "🎼 The band plays the final chord …", tempo: "Tempo", tonart: "Key", modus: "Mode",
      swing: "Dance step", bordun: "Drone", variation: "Variation",
      wer: { barradin: "Barradin", friedrich: "Friedrich", echo: "Echo", ezekiel: "Ezekiel", rex: "Rex" },
      spuren: { klopf: "Knock", schelle: "Bells", bass: "Bass", melodie: "Lute", trommel: "Drum", floete: "Flute", ketten: "Chains", rex: "Rex" },
      rexZeilen: ["Woof", "Howl", "Growl"], rexLaut: ["Woof!", "Awooooo!", "Grrrr …"],
      instrument: "Instrument", instrumente: { laute: "Lute", harfe: "Harp", mandoline: "Mandolin", fidel: "Fiddle", drehleier: "Hurdy-gurdy", schalmei: "Shawm", dudelsack: "Bagpipes", glocken: "Glockenspiel", illusion: "Flute of Illusions", hackbrett: "Hammered dulcimer", cembalo: "Harpsichord", akkordeon: "Accordion", sitar: "Sitar" },
      band: {
        trommel: { trommel: "Field drum", pauke: "Kettledrum", bodhran: "Bodhrán", tamburin: "Tambourine", stoecke: "Wooden sticks", taiko: "Taiko drum" },
        floete: { floete: "Wooden flute", panfloete: "Pan flute", okarina: "Ocarina", gesang: "Singing", horn: "Shepherd's horn", klarinette: "Clarinet", oboe: "Oboe",
          blockfloete: "Recorder", piccolo: "Piccolo", pfeife: "Tin whistle", shakuhachi: "Shakuhachi", englischhorn: "Cor anglais", oohchor: "Choir", bratsche: "Viola" },
        ketten: { ketten: "Chains", klatschen: "Clapping", schnipsen: "Finger snaps", rassel: "Shaker", stampfen: "Stomping", loeffel: "Spoons", krug: "Tankard on the table" }
      },
      alleSpuren: "All", schritte: "Steps",
      teil: "Edit part", ablauf: "Order", rolleVon: p => "Role of " + p, pattern: "Pattern", kette: "Chain",
      modusTitel: "How to compose", modusPattern: "▦ 4 patterns", modusLied: "▤ Full song",
      modusPatternTipp: "Like a groovebox: four bars A–D that you link into a chain.",
      modusLiedTipp: "Up to 16 bars with roles like verse and chorus – the way the moods compose.",
      liedHinweis: n => "A full song with " + n + " bars is loaded (verse, chorus, final chorus …). Pattern mode only has four patterns A–D.",
      zuPattern: "▦ Turn into 4 patterns", liedBearbeiten: "▤ Edit the full song",
      umgewandelt: "Turned into four patterns: A verse, B chorus, C bridge, D finale.",
      rollen: { i: "Intro", s: "Verse", v: "Build-up", r: "Chorus", b: "Bridge", h: "Finale" }, kopierenNach: a => "Copy " + a + " to", ueberschreiben: b => "Overwrite " + b + "?", kopiert2: (a, b) => "Part " + a + " was copied to " + b + ".",
      sicher: b => "Part " + b + " is not empty – tap again to overwrite it.",
      lieder: "Songs", stimmungen: "Moods", intensitaet: "Intensity", intStufen: ["barely there", "very calm", "calm", "relaxed", "moderate", "normal", "lively", "driving", "urgent", "wild", "unleashed"],
      vorlagen: { taverne: "Tavern dance", ballade: "Ballad", hafen: "⚓ Harbour shanty", wald: "🌲 Forest air", schmiede: "⚒ Forge", trauer: "Lament", wiegen: "Lullaby",
        kampf: "⚔ Battle", unterreich: "🦇 Underdark", reise: "🗺 Journey", spannung: "👁 Suspense", sieg: "🏆 Victory", rast: "🔥 Camp",
        auenland: "🌿 Shire", elben: "✨ Elves", zwerge: "⛏ Dwarves", reiter: "🐎 Riders", dorffest: "💃 Fair", kamin: "🕯 Fireside", shanty: "🌊 Shanty", pilger: "⛪ Pilgrim",
        klage: "🥀 Lament", marktplatz: "🛒 Market square", hof: "👑 Royal court", grusel: "👻 Haunted house", fey: "🧚 Fey forest", boss: "🐲 Boss fight" ,
        heldenlied: "🛡 Heroes' Anthem", trinklied: "🍻 Drinking Song", verfolgung: "🏃 Chase", ruinen: "🏛 Ancient Ruins" },
      klangwelten: "Soundscapes", klangTipp: "Folk music and fantasy sounds – freshly composed every time, familiar in style but always with original melodies.",
      zufall: "🎲 Random", leeren: "Clear",
      stumm: "Mute", lautstaerke: "Volume", zuklappen: "Expand or collapse",
      teilen: "🔗 Share song", kopiert: "Link copied – send it to the party!", geteilt: "Shared!",
      geladen: "A shared song has been loaded.",
      stimmungTipp: "Every click composes a new piece in the style of the mood. While it plays, it keeps changing after every round – perfect as background music for your sessions. As soon as you change something in the grid, it stays as it is.",
      wandelt: k => "♪ " + k + " keeps evolving …",
      master: "Music", fxLaut: "Effects", hall: "Reverb", raum: "Room",
      wechselGleich: n => "→ “" + n + "” starts with the next bar …",
      kulisse: "Ambience", kulisseLaut: "Ambience",
      kulissen: { keine: "– none –", taverne: "🍺 Tavern", feuer: "🔥 Campfire", regen: "🌧 Rain", wald: "🌲 Forest", hoehle: "💧 Cave", meer: "🌊 Coast", sturm: "⛈ Thunderstorm",
        waldnacht: "🌙 Forest at night", zelt: "⛺ Tent in the rain", schiff: "⛵ On deck", wasserfall: "🏞 Waterfall", unterreich: "🕸 Underdark", kerker: "⛓ Dungeon", sumpf: "🐸 Swamp", unterwasser: "🫧 Underwater", schmiede: "⚒ Forge", labor: "⚗ Alchemist's study", bibliothek: "📚 Library", tempel: "⛪ Temple",
        dorf: "🐓 Farmstead", markt: "🛒 Market square", hafen: "⚓ Harbour", gebirge: "🏔 Snowy mountain pass", mine: "⛏ Dwarven mine", strasse: "🐴 On the road", burg: "🏰 Castle courtyard", ufer: "🛶 Riverbank" },
      effekte: "Effects",
      sfx: { drache: "🐉 Dragon", schwert: "⚔ Blades", tuer: "🚪 Door", donner: "⚡ Thunder", schrei: "😱 Scream", wuerfel: "🎲 Dice", zauber: "✨ Spell", horn: "📯 Horn", jubel: "🍻 Cheers",
        tusch: "🥁 Ba-dum-tss", posaune: "🎺 Wah-wah", krit: "🌟 Nat 20", dramatisch: "😨 Dun-dun", grillen: "🦗 Silence",
        ooh: "😮 Ooooh!", muenzen: "💰 Coins", ruelpser: "🍺 Burp", schnarchen: "😴 Zzz", bonk: "🔨 Bonk",
        lufthorn: "📯 Air horn", kratzer: "💿 Wait a minute …", boom: "💥 Boom", falsch: "❌ Wrong!", richtig: "✅ Correct!", rutsch: "📉 Crash",
        boing: "🌀 Boing", hupe: "🤡 Honk honk", halleluja: "😇 Hallelujah", levelup: "⬆️ Level up!", schock: "😱 Shock", wirbel: "🥁 Drum roll",
        zirkus: "🤡 Circus", trauermarsch: "⚰️ Funeral march", toccata: "🦇 Villain organ", zarathustra: "🌅 Zarathustra", bergkoenig: "👺 Mountain King",
        walkuere: "🐎 Valkyries", galopp: "🏇 Gallop", hochzeit: "💍 Wedding march", elise: "🎹 Für Elise", nachtmusik: "🎩 Night music",
        swallowtail: "🐦 Swallowtail Jig", morrison: "🍀 Morrison's Jig", drowsymaggie: "😴 Drowsy Maggie", cooley: "🎻 Cooley's Reel", folia: "💃 La Folia", matrose: "⚓ Drunken Sailor", scarborough: "🌿 Scarborough Fair", greensleeves: "💚 Greensleeves", korobeiniki: "🧱 Korobeiniki", auldlangsyne: "🥂 Auld Lang Syne", shchedryk: "🔔 Carol of the Bells",
        amazinggrace: "🕊 Amazing Grace", bruderjakob: "🔁 Frère Jacques (round)", washerwoman: "☘️ Irish Washerwoman", sakura: "🌸 Sakura",
        kanon: "👑 Pachelbel’s Canon", fruehling: "🐦 Vivaldi: Spring", turca: "🐫 Alla turca",
        freude: "🇪🇺 Ode to Joy", diesirae: "💀 Dies irae", wiegenlied: "🌙 Lullaby", morgen: "☀️ Morning mood", zapfenstreich: "🎺 Taps", angriff: "📯 Charge!",
        bogen: "🏹 Bow", pfeil: "🎯 Arrow", hieb: "🗡 Slash", verfehlt: "💨 Miss", block: "🛡 Block", wucht: "🔨 Smash",
        schmerz: "😫 Ouch", sterben: "💀 Death", feuerball: "🔥 Fireball", blitz: "⚡ Lightning", heiltrank: "🧪 Potion" }, momente: "Table moments", kampfFx: "Combat",
      funk: "📡 Listen in", funkTipp: "Everyone else opens the link and taps “Listen” – the music is then created in each browser, and moods, ambience and effects follow your console.",
      funkStart: "📡 Broadcast to everyone", funkStopp: "Stop broadcast", funkKopieren: "🔗 Copy link", funkKopiert: "Link copied – drop it into Discord!",
      funkVerbinde: "Connecting …", funkFehler: "No connection – retrying …", funkZuhoerer: n => n === 1 ? "1 listening" : n + " listening", funkLaeuft: "Broadcast running",
      hTitel: "Imre's music", hText: "This plays whatever Imre plays at the table – music, ambience and effects. Tap “Listen”; you set the volume yourself.",
      hZuhoeren: "🎧 Listen", hAus: "❚❚ Mute", hWarte: "Imre isn't playing anything right now – you'll hear it as soon as he starts.", hVerbunden: "Connected", hVerbinde: "Connecting to Imre's console …",
      hSelbst: "Play yourself instead of listening", hSignal: (n, s) => "📶 " + n + " signals from Imre" + (s == null ? "" : " · last " + s + " s ago"), hIphone: "iPhone: if you hear nothing, check the silent switch and turn the volume up.", hLaut: "My volume",
      pult: "🎛 GM console", pultGross: "Open the GM console", pultUnter: "Moods, ambience and effects for the gaming table – one tap away", komplett: "🎼 Full view", pultTipp: "For the gaming table: moods change smoothly at the end of the bar, ambience and effects play over the music.",
      liedWaehlen: "Choose a song …", kulisseAn: "Ambience on", kulisseAus: "Ambience off", lieder2: "Songs",
      raeume: { stube: "Small room", taverne: "Tavern", kapelle: "Chapel", palast: "Throne hall", hoehle: "Cavern" }, hallSpur: "Reverb for this track on/off", miniPause: "Pause music", miniWeiter: "Resume music", miniKulStopp: "Stop ambience", miniKulWeiter: "Restart ambience", miniZur: "Go to the lute machine", eigenesLied: "Your song",
      orchester: "🎻 Orchestra", orchTipp: "Strings, horns and timpani (real recordings) under the moods – building up to the climax.",
      echoHall: "Echo reverb", spar: "🔋 Power saving", sparTipp: "For phones: less processing load, no dropouts. Fully applies after reloading the page.", sparAn: "Power saving on – reload the page for full effect.", sparAus: "Power saving off – reload the page for full effect.",
      stAlle: n => "All " + n + " moods", stWeniger: "Fewer moods", kulAlle: n => "All " + n + " backdrops", kulWeniger: "Fewer backdrops", fxKlappe: "💥 Effects, combat, moments & classics",
      tabStimmungen: "🎭 Moods", tabLieder: "🎼 Songs", tabEigene: "💾 Saved", tabEffekte: "💥 Effects", tabKampf: "⚔ Combat", tabMomente: "🎭 Moments", tabKlassik: "🎻 Classics", coverTitel: "🎤 The band’s covers – old folk songs (tap again = stop)", vorlagenTitel: "🎵 The band’s own songs",
      musik: "Music", klang: "Ambience & effects", keineEigenen: "No saved songs yet – compose in the grid and save.",
      eigene: "Your songs", gespeichert: n => "📂 Saved songs (" + n + ")", gruppe: "For the whole party", lokal: "Only on this device",
      stimmSpeichern: "💾 Save mood", stimmNeu: "⭐ As new mood", stimmUeber: n => "✎ Overwrite “" + n + "”", stimmZurueck: "↺ Restore original",
      stimmZurueckOk: "The original mood has been restored.", stimmNamePlatz: "Mood name",
      stimmTipp: "Remembers intensity, instruments, ambience and its volume, reverb, room, Echo reverb and orchestra – in this browser.",
      speichern: "💾 Save", loeschen: "🗑 Delete", liedName: "Song name", fuerAlle: "Save for everyone", nurHier: "Save here only", abbrechen: "Cancel",
      gespeichertOk: n => "“" + n + "” was saved.", geloescht: n => "“" + n + "” was deleted.", liedGeladen: n => "“" + n + "” loaded.",
      pwFrage: "Quest board password (for shared songs):", pwFalsch: "That password is wrong.", abmelden: "🔓 Log out", abmeldenTipp: "Forget the quest board password in this tab", abgemeldet: "Logged out – the password has been forgotten.", serverFehler: "The server can't be reached right now.",
      loeschenFrage: n => "Really delete “" + n + "”?", keinName: "Please give the song a name.",
      modi: { dorisch: "Dorian", mixolydisch: "Mixolydian", aeolisch: "Aeolian", phrygisch: "Phrygian", ionisch: "Major", lydisch: "Lydian" },
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
    phrygisch: [0, 1, 3, 5, 7, 8, 10, 12],
    ionisch: [0, 2, 4, 5, 7, 9, 11, 12],
    lydisch: [0, 2, 4, 6, 7, 9, 11, 12]
  };
  const MODUS_LISTE = Object.keys(MODI);
  /* Bass-Zeilen: Grundton, Terz, Quarte, Quinte, Septime – dazu (hinten angehängt, damit alte Lieder gleich klingen) Sexte und Sekunde */
  const BASS_STUFEN = [0, 2, 3, 4, 6, 5, 1];
  /* Reihenfolge der Bass-Zeilen im Raster, von hoch nach tief */
  const BASS_ANZEIGE = [4, 5, 3, 2, 1, 6, 0];
  /* auf welcher Stufe jede Tonleiter ihren verminderten (schiefen) Dreiklang hat – solche Akkorde meiden die Stimmungen */
  const VERMINDERT = { ionisch: 6, dorisch: 5, phrygisch: 4, lydisch: 3, mixolydisch: 2, aeolisch: 1 };
  /* Stimmung – oder bei den Liedern der Band die Besetzung, aus der Kapelle, Orchester und Hall kommen */
  const stilKey = () => S.stimmung || S.besetzung || null;
  const KAPELLE_NAMEN = ["kampf", "boss", "verfolgung", "spannung", "grusel", "unterreich", "ruinen", "reise", "reiter", "heldenlied", "sieg", "rast", "trinklied", "kamin", "klage", "auenland", "elben", "fey", "zwerge", "dorffest", "marktplatz", "hof", "shanty", "pilger"];
  const MEL_GRUND = 62, BASS_GRUND = 38, FLOETE_GRUND = 74; /* D4, D2, D5 */
  const midiHz = m => 440 * Math.pow(2, (m - 69) / 12);
  const tonMidi = (spur, zeile, s) => {
    const sk = MODI[s.modus], st = z => sk[z % 7] + 12 * Math.floor(z / 7);
    const h = s === S ? hebung : 0;
    if (spur === "bass") return BASS_GRUND + s.transpose + h + sk[BASS_STUFEN[zeile]];
    if (spur === "floete") return FLOETE_GRUND + s.transpose + h + st(zeile);
    return MEL_GRUND + s.transpose + h + st(zeile);
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
  const LIEDER = ["taverne", "ballade", "hafen", "wald", "schmiede", "trauer", "wiegen"];
  const STIMMUNGEN = ["kampf", "boss", "verfolgung", "spannung", "grusel", "unterreich", "ruinen", "reise", "reiter", "heldenlied", "sieg", "rast", "trinklied", "kamin", "klage", "auenland", "elben", "fey", "zwerge", "dorffest", "marktplatz", "hof", "shanty", "pilger"];

  /* ---------- Stimmungs-Generatoren ----------
     Jede Stimmung ist ein Stil: Tonleiter, Tempo, Besetzung, Akkordfolgen (Bass-Zeilen je Viertel),
     Rhythmen. Daraus wird bei jedem Aufruf ein neues Stück komponiert: Teil A stellt ein Motiv vor,
     B variiert es über andere Akkorde, C gehört Echo, D bringt das Motiv mit voller Besetzung zurück.
     Auf den Zählzeiten liegen immer Akkordtöne – so klingt es auch zufällig noch nach Musik. */
  const STIL = {
    /* Kampf: Schlachtmusik wie im Film – Taiko, Pauken und Streicher treiben im 3-3-2, darüber ein heldenhaftes Thema
       in langen Tönen (Fidel, Horn, Chor), die Akkorde schreiten i – VI – VII; kein Zufallsgeklapper mehr */
    kampf: { fanfare: 1, form: "hymne", gefuehl: "halb", modus: ["aeolisch"], tempo: [146, 158], transpose: [-2, 0], swing: 0, bordun: 1, variation: 1,
      instrument: ["fidel", "drehleier", "dudelsack"], band: { trommel: ["taiko", "pauke"], floete: ["horn", "oohchor"], ketten: ["stampfen", "ketten"] },
      ablauf: ["AABACA"], akkorde: [[0, 5, 4, 0], [0, 5, 1, 4], [0, 5, 4, 4], [0, 2, 5, 4], [0, 5, 2, 4]],
      bass: ["galopp", "puls"], rhythmus: [[0, 3, 6], [0, 4, 6], [0, 3, 4, 6], [0, 6]], lage: 3, dichte: 1, echo: "lang",
      klopf: [[0, 8], [0, 4, 8, 12]], schelle: [[]], trommel: [[0, 3, 6, 8, 11, 14], [0, 3, 6, 8, 10, 11, 12, 14]],
      ketten: [[4, 12], [4, 12, 14]], rex: [0, 2] },
    unterreich: { chaos: 1, modus: ["phrygisch"], tempo: [56, 64], transpose: [-3, -5], swing: 0, bordun: 1, variation: 4,
      instrument: ["drehleier", "glocken", "illusion", "sitar"], band: { trommel: ["pauke", "taiko"], floete: ["okarina", "gesang", "shakuhachi", "oohchor", "bratsche"], ketten: ["ketten", "rassel"] },
      ablauf: ["ABAC", "ABAC", "AABC"], akkorde: [[0, 0, 6, 0], [0, 5, 0, 6], [0, 0, 2, 6], [0, 4, 6, 0]],
      bass: ["orgel", "halbe"], rhythmus: [[0, 6], [2, 8], [0, 4]], lage: 2, dichte: .5, echo: "fern", schraeg: .35,
      klopf: [[]], schelle: [[]], trommel: [[0], [0, 12]], ketten: [[7], [5, 13], []], rex: [1, 2] },
    reise: { zier: "triller", terzen: 1, modus: ["dorisch"], tempo: [96, 104], transpose: [0, 2, -3], swing: 1, bordun: 1, variation: 3,
      instrument: ["mandoline", "laute", "harfe", "hackbrett", "akkordeon"], band: { trommel: ["bodhran", "trommel", "tamburin"], floete: ["panfloete", "floete", "klarinette", "blockfloete", "pfeife"], ketten: ["rassel", "stampfen", "klatschen"] },
      ablauf: ["AABACB", "AABACA", "ABABCD"], akkorde: [[0, 4, 2, 0], [0, 2, 4, 0], [0, 6, 2, 4], [0, 4, 6, 2], [0, 2, 0, 3]],
      bass: ["viertel", "halbe"], rhythmus: [[0, 2, 4, 6], [0, 2, 3, 4, 6], [0, 3, 4, 6, 7]], lage: 3, dichte: .9, echo: "antwort",
      klopf: [[0, 8]], schelle: [[4, 12], [2, 6, 10, 14]], trommel: [[0, 6, 8, 14], [0, 8]], ketten: [[2, 6, 10, 14]], rex: [0] },
    spannung: { chaos: 1, modus: ["aeolisch"], tempo: [86, 96], transpose: [0, -2], swing: 0, bordun: 0, variation: 4,
      instrument: ["glocken", "harfe", "illusion", "sitar", "cembalo"], band: { trommel: ["pauke", "stoecke"], floete: ["okarina", "englischhorn", "klarinette", "bratsche"], ketten: ["schnipsen", "rassel"] },
      ablauf: ["AAABAC", "AABACA", "AABC"], akkorde: [[0, 0, 5, 5], [0, 5, 0, 4], [0, 4, 5, 4], [0, 0, 6, 6], [0, 2, 0, 5]],
      bass: ["puls"], rhythmus: [[0, 4], [0, 6], [4]], lage: 5, dichte: .45, echo: "fern", schraeg: .25,
      klopf: [[]], schelle: [[]], trommel: [[0, 2], [0, 2, 8, 10]], ketten: [[0, 4, 8, 12]], rex: [2] },
    sieg: { hebung: 1, fanfare: 1, zier: "triller", terzen: 1, modus: ["ionisch", "mixolydisch"], tempo: [112, 124], transpose: [0, 2], swing: 0, bordun: 1, variation: 3,
      instrument: ["laute", "dudelsack", "mandoline", "akkordeon"], band: { trommel: ["tamburin", "trommel", "pauke"], floete: ["horn", "floete", "piccolo", "pfeife"], ketten: ["klatschen", "stampfen", "krug"] },
      ablauf: ["AABBCB", "AABBCD", "ABACAD"], akkorde: [[0, 2, 3, 0], [0, 5, 2, 3], [0, 6, 3, 0], [0, 4, 2, 0], [0, 2, 0, 3]],
      bass: ["viertel", "puls"], rhythmus: [[0, 1, 2, 4, 6], [0, 2, 4, 6], [0, 2, 3, 4]], lage: 4, dichte: 1, echo: "lang",
      klopf: [[0, 4, 8, 12]], schelle: [[2, 6, 10, 14], [0, 2, 4, 6, 8, 10, 12, 14]], trommel: [[0, 4, 6, 8, 12, 14], [0, 2, 4, 6, 8, 10, 12, 13, 14, 15]],
      ketten: [[4, 12]], rex: [0, 1] },
    rast: { dreier: "walzer", zier: "vorhalt", modus: ["mixolydisch", "ionisch"], tempo: [72, 80], transpose: [0, 5, -2], swing: 1, bordun: 0, variation: 2,
      instrument: ["harfe", "laute", "hackbrett", "mandoline"], band: { trommel: ["bodhran", "stoecke"], floete: ["okarina", "gesang", "panfloete", "klarinette", "blockfloete"], ketten: ["rassel", "schnipsen", "loeffel"] },
      ablauf: ["AABB", "ABAC", "AABBCD"], akkorde: [[0, 0, 2, 2], [0, 6, 0, 2], [0, 4, 2, 0], [0, 2, 4, 0], [0, 3, 2, 0]],
      bass: ["halbe"], rhythmus: [[0, 2, 4, 6], [0, 4, 6], [0, 3, 4]], lage: 3, dichte: .6, echo: "antwort",
      klopf: [[0, 8], []], schelle: [[], [12]], trommel: [[0], []], ketten: [[4, 12], []], rex: [2] },
    /* ---- Klangwelten: Volksmusik und Fantasy-Stile (eigene Melodien, nur der Charakter erinnert) ---- */
    /* grünes Hügelland: Dur, hüpfend, Flöte antwortet */
    auenland: { dreier: "jig", zier: "triller", terzen: 1, modus: ["ionisch"], tempo: [104, 112], transpose: [0, 2, -3], swing: 1, bordun: 1, variation: 3,
      instrument: ["fidel", "harfe", "mandoline", "hackbrett", "akkordeon"], band: { trommel: ["bodhran", "tamburin"], floete: ["pfeife", "floete", "klarinette", "blockfloete", "panfloete"], ketten: ["klatschen", "loeffel", "schnipsen"] },
      ablauf: ["AABA", "AABBCD", "ABACAD"], akkorde: [[0, 2, 3, 0], [0, 5, 2, 3], [0, 3, 5, 2], [0, 1, 2, 3], [0, 6, 3, 0], [0, 2, 0, 3]],
      bass: ["viertel", "halbe"], rhythmus: [[0, 2, 3, 4, 6], [0, 1, 2, 4, 6], [0, 3, 4, 6, 7], [0, 2, 4, 5, 6]], lage: 4, dichte: .9, echo: "antwort",
      klopf: [[0, 8], [0, 6, 8, 14]], schelle: [[], [4, 12]], trommel: [[0, 6, 8, 14], [0, 3, 6, 8, 11, 14]], ketten: [[4, 12], [2, 6, 10, 14]], rex: [0] },
    /* Halle der Elben: lydisch schwebend, langsam, Harfe und Gesang */
    elben: { dreier: "walzer", zier: "vorhalt", terzen: 1, modus: ["lydisch", "ionisch"], tempo: [60, 68], transpose: [0, 2, -2], swing: 0, bordun: 1, variation: 2,
      instrument: ["harfe", "glocken", "illusion", "hackbrett"], band: { trommel: ["pauke"], floete: ["gesang", "oohchor", "shakuhachi", "floete"], ketten: ["schnipsen"] },
      ablauf: ["ABAC", "AABC", "ABAC"], akkorde: [[0, 6, 5, 3], [0, 6, 0, 5], [0, 5, 1, 3], [0, 5, 0, 3], [0, 4, 5, 0], [0, 1, 5, 0]],
      bass: ["orgel", "halbe"], rhythmus: [[0, 4], [0, 4, 6], [0, 2, 4], [0, 6]], lage: 5, dichte: .55, echo: "lang",
      klopf: [[]], schelle: [[]], trommel: [[0], []], ketten: [[], [12]], rex: [2] },
    /* Hallen unter dem Berg: tief, schwer, Hörner, Hammer im 3-3-2 */
    zwerge: { zier: "triller", terzen: 1, modus: ["aeolisch", "dorisch"], tempo: [70, 80], transpose: [-3, -5, -2], swing: 0, bordun: 1, variation: 3,
      instrument: ["drehleier", "laute", "fidel", "dudelsack"], band: { trommel: ["pauke", "taiko", "trommel"], floete: ["oohchor", "horn", "gesang", "bratsche"], ketten: ["stampfen", "ketten", "loeffel", "krug"] },
      ablauf: ["AABACA", "AABCBD", "AABCDD"], akkorde: [[0, 4, 2, 0], [0, 0, 4, 0], [0, 1, 4, 0], [0, 2, 0, 4], [0, 5, 4, 0], [0, 4, 5, 4]],
      bass: ["galopp", "halbe"], rhythmus: [[0, 3, 4, 6], [0, 2, 4, 6], [0, 3, 6]], lage: 2, dichte: .8, echo: "lang",
      klopf: [[0, 8]], schelle: [[]], trommel: [[0, 3, 6, 8, 11, 14], [0, 8]], ketten: [[0, 3, 6, 8, 11, 14], [3, 11]], rex: [0, 2] },
    /* Reiter über die Ebene: galoppierend, heroisch, Horn und Fidel */
    reiter: { fanfare: 1, gefuehl: "halb", zier: "triller", terzen: 1, modus: ["aeolisch", "dorisch"], tempo: [116, 126], transpose: [0, -2, 2], swing: 0, bordun: 1, variation: 3,
      instrument: ["fidel", "dudelsack", "drehleier", "mandoline"], band: { trommel: ["taiko", "trommel", "bodhran"], floete: ["horn", "floete", "oohchor"], ketten: ["stampfen", "rassel"] },
      ablauf: ["AABACA", "AABCDD", "ABACAD"], akkorde: [[0, 5, 4, 0], [0, 5, 1, 4], [0, 4, 5, 4], [0, 4, 2, 0], [0, 1, 4, 0], [0, 2, 4, 0]],
      bass: ["galopp"], rhythmus: [[0, 3, 4, 6], [0, 1, 2, 4, 6], [0, 2, 3, 4, 6]], lage: 4, dichte: .95, echo: "lang",
      klopf: [[0, 8]], schelle: [[]], trommel: [[0, 3, 4, 8, 11, 12], [0, 2, 3, 4, 8, 10, 11, 12]], ketten: [[4, 12], [0, 4, 8, 12]], rex: [0] },
    /* Volkstanz auf dem Dorfplatz: flott, Fiedel, Klatschen und Stampfen */
    dorffest: { hebung: 1, zier: "triller", terzen: 1, modus: ["mixolydisch"], tempo: [120, 130], transpose: [0, 2, -3], swing: 0, bordun: 1, variation: 3,
      instrument: ["fidel", "dudelsack", "drehleier", "akkordeon", "hackbrett"], band: { trommel: ["bodhran", "tamburin", "stoecke"], floete: ["floete", "pfeife", "blockfloete", "piccolo"], ketten: ["klatschen", "stampfen", "krug"] },
      ablauf: ["AABBCB", "AABBCD", "ABABCD"], akkorde: [[0, 4, 2, 0], [0, 2, 4, 0], [0, 5, 2, 4], [0, 2, 0, 4], [0, 6, 4, 0]],
      bass: ["viertel", "puls"], rhythmus: [[0, 1, 2, 3, 4, 6], [0, 2, 3, 4, 6, 7], [0, 1, 2, 4, 5, 6]], lage: 4, dichte: 1, echo: "antwort",
      klopf: [[0, 4, 8, 12]], schelle: [[2, 6, 10, 14], [4, 12]], trommel: [[0, 4, 6, 8, 12, 14], [0, 2, 4, 6, 8, 10, 12, 14]], ketten: [[4, 12], [2, 6, 10, 14]], rex: [0, 1] },
    /* Ballade am Kamin: ruhig erzählend, Laute und leise Stimme */
    kamin: { dreier: "walzer", zier: "vorhalt", terzen: 1, modus: ["aeolisch", "dorisch"], tempo: [68, 76], transpose: [0, -2, 3], swing: 1, bordun: 0, variation: 2,
      instrument: ["laute", "harfe", "hackbrett", "cembalo"], band: { trommel: ["bodhran"], floete: ["gesang", "okarina", "klarinette", "bratsche", "englischhorn"], ketten: ["schnipsen", "loeffel"] },
      ablauf: ["AABA", "ABAB", "AABC"], akkorde: [[0, 5, 1, 4], [0, 5, 2, 3], [0, 4, 2, 0], [0, 1, 4, 0], [0, 2, 3, 0], [0, 2, 5, 3]],
      bass: ["halbe"], rhythmus: [[0, 2, 4, 6], [0, 3, 4, 6], [0, 4, 6]], lage: 3, dichte: .7, echo: "antwort",
      klopf: [[], [0, 8]], schelle: [[]], trommel: [[], [0]], ketten: [[]], rex: [2] },
    /* Seemannslied: wiegend, die Mannschaft antwortet, Krüge auf dem Tisch */
    shanty: { dreier: "jig", zier: "triller", terzen: 1, modus: ["dorisch", "aeolisch"], tempo: [92, 100], transpose: [0, 2, -3], swing: 0, bordun: 1, variation: 3,
      instrument: ["mandoline", "laute", "drehleier", "akkordeon"], band: { trommel: ["trommel", "bodhran"], floete: ["gesang", "horn", "klarinette", "pfeife", "oohchor"], ketten: ["krug", "stampfen", "klatschen"] },
      ablauf: ["AABACA", "ABABCB", "AABBCD"], akkorde: [[0, 4, 0, 3], [0, 1, 4, 0], [0, 2, 4, 0], [0, 5, 4, 0], [0, 5, 1, 4]],
      bass: ["viertel"], rhythmus: [[0, 2, 4, 6], [0, 3, 4, 6], [0, 2, 3, 4]], lage: 3, dichte: .85, echo: "antwort",
      klopf: [[0, 8]], schelle: [[]], trommel: [[0, 8], [0, 6, 8]], ketten: [[4, 12], [0, 4, 8, 12]], rex: [0] },
    /* Pilgerweg: getragen wie ein alter Choral, Gesang über Orgelpunkt */
    pilger: { zier: "vorhalt", modus: ["dorisch", "aeolisch"], tempo: [60, 68], transpose: [0, -2, 2], swing: 0, bordun: 1, variation: 2,
      instrument: ["drehleier", "glocken", "harfe", "sitar"], band: { trommel: ["pauke"], floete: ["gesang", "oboe", "englischhorn", "oohchor", "shakuhachi"], ketten: ["schnipsen"] },
      ablauf: ["AB", "AABA", "ABAC"], akkorde: [[0, 4, 0, 2], [0, 2, 0, 4], [0, 0, 4, 0], [0, 2, 3, 0], [0, 3, 4, 0]],
      bass: ["orgel", "halbe"], rhythmus: [[0, 4], [0, 4, 6], [0, 2, 4]], lage: 4, dichte: .6, echo: "lang",
      klopf: [[]], schelle: [[]], trommel: [[0], []], ketten: [[]], rex: [2] },
    /* ---- weitere Stimmungen ---- */
    /* Klage: Abschied, Begräbnis, verlorene Gefährten */
    klage: { zier: "vorhalt", modus: ["aeolisch", "dorisch"], tempo: [54, 62], transpose: [0, -2, 3], swing: 0, bordun: 1, variation: 2,
      instrument: ["fidel", "harfe", "laute", "cembalo"], band: { trommel: ["pauke"], floete: ["gesang", "okarina", "oboe", "englischhorn", "bratsche"], ketten: ["schnipsen"] },
      ablauf: ["ABAC", "AABACA", "ABAC"], akkorde: [[0, 5, 1, 4], [0, 5, 2, 3], [0, 2, 5, 3], [0, 4, 5, 3], [0, 1, 4, 0], [0, 2, 0, 3]],
      bass: ["halbe", "orgel"], rhythmus: [[0, 4], [0, 4, 6], [0, 6]], lage: 3, dichte: .5, echo: "lang",
      klopf: [[]], schelle: [[]], trommel: [[0], []], ketten: [[]], rex: [2] },
    /* Marktplatz: Feilschen, Gaukler, buntes Treiben */
    marktplatz: { zier: "triller", terzen: 1, modus: ["dorisch"], tempo: [100, 110], transpose: [0, 2, -3], swing: 1, bordun: 0, variation: 3,
      instrument: ["mandoline", "laute", "schalmei", "akkordeon", "cembalo", "hackbrett"], band: { trommel: ["tamburin", "bodhran", "stoecke"], floete: ["floete", "panfloete", "klarinette", "pfeife", "blockfloete"], ketten: ["krug", "klatschen", "loeffel"] },
      ablauf: ["AABBCB", "ABAC", "AABBCD"], akkorde: [[0, 2, 3, 0], [0, 5, 2, 3], [0, 6, 3, 0], [0, 4, 2, 0], [0, 2, 0, 3]],
      bass: ["viertel"], rhythmus: [[0, 1, 2, 4, 6], [0, 2, 3, 4, 6], [0, 2, 4, 5, 6]], lage: 4, dichte: .95, echo: "antwort",
      klopf: [[0, 8]], schelle: [[4, 12], [2, 6, 10, 14]], trommel: [[0, 6, 8, 14], [0, 4, 8, 12]], ketten: [[2, 6, 10, 14], [4, 12]], rex: [0] },
    /* Königshof: feierlich, höfisch, Fanfaren */
    hof: { dreier: "walzer", zier: "vorhalt", terzen: 1, modus: ["ionisch"], tempo: [80, 90], transpose: [0, 2, -2], swing: 0, bordun: 0, variation: 2,
      instrument: ["harfe", "laute", "fidel", "cembalo"], band: { trommel: ["pauke", "trommel"], floete: ["horn", "floete", "oboe", "blockfloete", "bratsche"], ketten: ["schnipsen"] },
      ablauf: ["AABACA", "AABBCD", "ABACAD"], akkorde: [[0, 6, 3, 0], [0, 2, 3, 0], [0, 5, 6, 3], [0, 1, 2, 3], [0, 3, 5, 2]],
      bass: ["viertel", "halbe"], rhythmus: [[0, 4, 6], [0, 2, 4, 6], [0, 3, 4]], lage: 4, dichte: .75, echo: "lang",
      klopf: [[]], schelle: [[]], trommel: [[0, 8], [0, 6, 8]], ketten: [[]], rex: [2] },
    /* Spukhaus: Grusel, Untote, knarrende Dielen */
    grusel: { chaos: 1, modus: ["phrygisch"], tempo: [54, 62], transpose: [-2, -4, 0], swing: 0, bordun: 1, variation: 4,
      instrument: ["glocken", "illusion", "drehleier", "cembalo"], band: { trommel: ["pauke"], floete: ["okarina", "gesang", "oohchor", "bratsche"], ketten: ["ketten", "rassel"] },
      ablauf: ["ABAC", "AAABAC", "ABAC"], akkorde: [[0, 6, 0, 6], [0, 0, 5, 6], [0, 4, 5, 6], [0, 2, 6, 0]],
      bass: ["orgel", "puls"], rhythmus: [[0, 6], [3, 8], [0]], lage: 2, dichte: .4, echo: "fern", schraeg: .45,
      klopf: [[]], schelle: [[]], trommel: [[0], [0, 10]], ketten: [[7], [5, 13], []], rex: [1, 2] },
    /* Feenwald: verspielt, glitzernd, Schabernack */
    fey: { zier: "triller", terzen: 1, modus: ["lydisch", "ionisch"], tempo: [108, 118], transpose: [0, 2, 5], swing: 1, bordun: 0, variation: 3,
      instrument: ["harfe", "glocken", "mandoline", "hackbrett"], band: { trommel: ["tamburin", "bodhran"], floete: ["panfloete", "floete", "piccolo", "blockfloete", "okarina"], ketten: ["schnipsen", "rassel"] },
      ablauf: ["AABACA", "ABAC", "AABBCD"], akkorde: [[0, 6, 0, 6], [0, 6, 5, 3], [0, 1, 5, 3], [0, 5, 6, 3], [0, 3, 5, 6]],
      bass: ["viertel", "halbe"], rhythmus: [[0, 1, 2, 4, 6], [0, 2, 3, 4, 6, 7], [0, 1, 3, 4, 6]], lage: 5, dichte: .9, echo: "antwort",
      klopf: [[]], schelle: [[2, 6, 10, 14], [0, 4, 8, 12]], trommel: [[0, 8], [0, 6, 8, 14]], ketten: [[4, 12], [2, 6, 10, 14]], rex: [0] },
    /* Endgegner: noch schneller und wuchtiger als der Kampf */
    /* Endgegner: übermächtig und düster wie die Brücke von Khazad-dûm – schwerer und breiter als der Kampf, phrygisch,
       ein Riff, das sich festbeißt, Chor und tiefe Bläser, Amboss-Schläge und Gong; im Zwischenteil halbes Tempo */
    boss: { fanfare: 1, form: "hymne", riff: 1, modus: ["phrygisch"], tempo: [148, 160], transpose: [-2, -4], swing: 0, bordun: 1, variation: 1,
      instrument: ["fidel", "drehleier"], band: { trommel: ["taiko", "pauke"], floete: ["oohchor", "horn"], ketten: ["ketten", "stampfen"] },
      ablauf: ["AABACA"], akkorde: [[0, 6, 0, 5], [0, 6, 5, 4], [0, 5, 6, 0], [0, 0, 6, 5], [0, 5, 4, 6]],
      bass: ["galopp", "halbe"], rhythmus: [[0, 3, 6], [0, 6], [0, 2, 3, 6], [0, 4, 6]], lage: 2, dichte: 1, echo: "lang",
      klopf: [[0, 8]], schelle: [[]], trommel: [[0, 3, 6, 8, 10], [0, 3, 6, 8, 10, 11, 12, 14]],
      ketten: [[8], [0, 8]], rex: [0, 2] },
    /* ---- Lieder mit ganzer Form (Strophe, Refrain, Schlussrefrain) ---- */
    /* Heldenlied: eine Hymne auf die Gefährten – breiter Refrain zum Mitsingen, Hörner, am Ende einen Ganzton höher */
    heldenlied: { hebung: 1, gefuehl: 1, form: "hymne", zier: "triller", terzen: 1, modus: ["ionisch", "mixolydisch"], tempo: [80, 92], transpose: [0, 2, -3], swing: 0, bordun: 1, variation: 2,
      instrument: ["fidel", "laute", "harfe", "dudelsack"], band: { trommel: ["pauke", "taiko", "trommel"], floete: ["horn", "oohchor", "gesang", "floete"], ketten: ["stampfen", "klatschen"] },
      ablauf: ["AABACA"], akkorde: [[0, 4, 5, 3], [0, 5, 2, 3], [0, 2, 5, 3], [0, 3, 5, 2], [0, 6, 2, 3], [0, 4, 2, 3]],
      bass: ["viertel", "puls"], rhythmus: [[0, 2, 4, 6], [0, 3, 4, 6], [0, 2, 3, 4, 6], [0, 4, 6]], lage: 3, dichte: .9, echo: "lang",
      klopf: [[0, 8], [0, 4, 8, 12]], schelle: [[], [4, 12]], trommel: [[0, 8], [0, 3, 6, 8, 11, 14]], ketten: [[4, 12], [4, 12]], rex: [0, 1] },
    /* Trinklied: Krüge hoch! Stampfen, Klatschen und ein Refrain, den nach dem dritten Krug jeder mitsingt */
    trinklied: { hebung: 1, form: "tanz", dreier: "jig", zier: "triller", terzen: 1, modus: ["mixolydisch", "ionisch"], tempo: [108, 118], transpose: [0, 2, -3], swing: 1, bordun: 1, variation: 3,
      instrument: ["fidel", "laute", "dudelsack", "mandoline", "akkordeon"], band: { trommel: ["bodhran", "tamburin"], floete: ["gesang", "floete", "pfeife", "klarinette"], ketten: ["krug", "stampfen", "klatschen", "loeffel"] },
      ablauf: ["AABBCD"], akkorde: [[0, 3, 0, 3], [0, 2, 3, 0], [0, 4, 0, 3], [0, 2, 0, 3], [0, 5, 2, 3]],
      bass: ["viertel", "puls"], rhythmus: [[0, 2, 3, 4, 6], [0, 1, 2, 4, 6], [0, 2, 4, 6], [0, 3, 4, 6]], lage: 3, dichte: 1, echo: "antwort",
      klopf: [[0, 8], [0, 4, 8, 12]], schelle: [[2, 6, 10, 14], [0, 2, 4, 6, 8, 10, 12, 14]], trommel: [[0, 6, 8, 14], [0, 3, 6, 8, 11, 14]], ketten: [[4, 12], [0, 4, 8, 12]], rex: [0, 1] },
    /* Verfolgung: Hetzjagd durch Gassen und Wälder – treibende Achtel und ein Riff, das nicht loslässt */
    verfolgung: { gefuehl: "halb", form: "hymne", chaos: 1, riff: 1, modus: ["phrygisch"], tempo: [150, 162], transpose: [0, -2, 2], swing: 0, bordun: 1, variation: 2,
      instrument: ["fidel", "schalmei", "mandoline", "drehleier"], band: { trommel: ["trommel", "taiko", "stoecke"], floete: ["horn", "floete", "piccolo"], ketten: ["stampfen", "ketten"] },
      ablauf: ["AABACA"], akkorde: [[0, 5, 4, 0], [0, 4, 5, 4], [0, 0, 5, 4], [0, 6, 0, 4], [0, 5, 0, 4]],
      bass: ["puls", "galopp"], rhythmus: [[0, 2, 3, 4, 6], [0, 1, 2, 4, 6], [0, 2, 4, 5, 6], [0, 2, 4, 6]], lage: 3, dichte: 1, echo: "lang",
      klopf: [[0, 4, 8, 12]], schelle: [[2, 6, 10, 14]], trommel: [[0, 3, 6, 8, 11, 14], [0, 2, 3, 6, 8, 10, 11, 14]], ketten: [[4, 12], [4, 10, 12]], rex: [0] },
    /* Alte Ruinen: Staunen und Geheimnis – lydisch schwebend, Glocken und ferne Stimmen, langsam wachsend */
    ruinen: { form: "ballade", zier: "vorhalt", modus: ["dorisch", "aeolisch"], tempo: [62, 70], transpose: [0, -2, 3], swing: 0, bordun: 1, variation: 2,
      instrument: ["harfe", "glocken", "illusion", "sitar"], band: { trommel: ["pauke"], floete: ["gesang", "okarina", "panfloete", "shakuhachi", "englischhorn"], ketten: ["schnipsen", "rassel"] },
      ablauf: ["ABAC"], akkorde: [[0, 6, 0, 5], [0, 1, 6, 0], [0, 5, 6, 0], [0, 6, 5, 6], [0, 2, 0, 6]],
      bass: ["orgel", "halbe"], rhythmus: [[0, 4], [0, 4, 6], [0, 3, 4], [0, 6]], lage: 4, dichte: .55, echo: "fern",
      klopf: [[]], schelle: [[]], trommel: [[0], [0, 12]], ketten: [[], [6, 14]], rex: [2] }
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
  /* der Akkord, der an Schritt i wirklich klingt (letzter Basston davor) */
  const klingt = (bass, i) => { for (let k = 0; k < SCHRITTE; k++) { const v = bass[(i - k + SCHRITTE) % SCHRITTE]; if (v >= 0) return v; } return 0; };
  /* ---------- Melodien mit Ohrwurm-Bauplan ----------
     Ein kurzes Motiv (Rhythmus + Form) wird wiederholt, als Sequenz versetzt und beantwortet:
     A = Motiv + Sequenz (endet offen), B = Motiv + Antwort (endet auf dem Grundton), D = Motiv + Schluss.
     Starke Zählzeiten landen auf Akkordtönen, dazwischen geht die Melodie meist schrittweise. */
  const FORMEN = {
    bogen: [0, 1, 2, 1, 0, -1], steigend: [0, 1, 2, 3, 4, 5], fallend: [0, -1, -2, -3, -4, -5], wechsel: [0, 1, 0, -1, 0, 1],
    sprung: [0, 2, 1, 0, -1, 0], terzen: [0, 2, 1, 3, 2, 4], ruf: [0, 0, 1, 0, -1, -2], welle: [0, -1, 0, 2, 1, 0]
  };
  /* typische Melodiewendungen (Tonleiterschritte relativ zum ersten Ton) – angelehnt an Fantasy- und Filmmusik */
  Object.assign(FORMEN, {
    held: [0, 3, 4, 3, 2, 4],        /* Quarte hinauf, dann weiter – der Ruf einer Heldenhymne */
    fanfare: [0, 4, 2, 4, 5, 4],     /* Quinte, Dreiklang – Fanfare */
    weite: [0, 4, 3, 2, 3, 1],       /* großer Sprung, dann langsam zurück – Weite, Landschaft */
    elbisch: [0, 1, 3, 2, 1, 2],     /* sanft steigend mit Umspielung – schwebend */
    seufzer: [0, -1, -1, -2, -3, -2],/* Abwärtsseufzer – Klage */
    huepfer: [0, 1, 2, 4, 2, 1],     /* Hüpfen im Jig – Auenland */
    zwergen: [0, 0, -1, -2, 0, -2],  /* schwer, schreitend, wiederholte Töne – Lied unter dem Berg */
    sturm: [0, 0, 1, 0, 3, 2],       /* Tonwiederholung und Sprung – Kampf */
    lauf: [0, 1, 2, 3, 2, 1],        /* gehetzter Lauf – Verfolgung */
    spuk: [0, 1, 0, -1, 3, 2],       /* kriechend mit plötzlichem Sprung – Grusel */
    tiefe: [0, -1, 0, 1, 0, -3],     /* kreisend, dann in die Tiefe – Unterreich */
    choral: [0, 1, 0, -1, 0, 0],     /* schrittweise wie ein alter Choral – Pilger */
    fern: [0, 4, 3, 1, 2, 0],        /* weiter Ruf ins Leere – Ruinen */
    glitzer: [0, 2, 4, 5, 4, 2],     /* gebrochener Akkord – Feen */
    seemann: [0, 0, 0, 2, 4, 2],     /* Tonwiederholung zum Mitgrölen – Shanty */
    krug: [0, 0, 2, 4, 2, 0],        /* Trinklied */
    wiegen: [0, 2, 1, 2, 0, -1],     /* wiegend am Feuer */
    menuett: [0, 2, 1, 3, 2, 4],     /* höfisch in Terzen */
    wanderer: [0, 2, 3, 4, 3, 1]     /* auf der Straße – Reise */
  });
  /* je Stimmung: Formen für Strophe (s), Ohrwurm (h), Zwischenteil (b), der Sprung zu Beginn des Ohrwurms (kopf, in Tonleiterschritten)
     und wie die Strophe ihre Sequenz versetzt (seq) */
  const WENDUNG = {
    heldenlied: { s: ["wanderer", "bogen", "held"], h: ["held", "fanfare"], b: ["weite", "steigend"], kopf: [3, 4], seq: [1, 2] },
    sieg: { s: ["fanfare", "terzen"], h: ["fanfare", "held"], b: ["steigend"], kopf: [4], seq: [1, 2] },
    hof: { s: ["menuett", "terzen", "bogen"], h: ["menuett", "fanfare"], b: ["bogen"], kopf: [2, 4], seq: [1] },
    reiter: { s: ["weite", "held"], h: ["held", "weite"], b: ["steigend", "weite"], kopf: [3, 4], seq: [1, 2] },
    kampf: { s: ["held", "weite", "ruf"], h: ["held", "fanfare"], b: ["steigend", "weite"], kopf: [4, 3], seq: [1, 2] },
    boss: { s: ["tiefe", "zwergen"], h: ["ruf", "held"], b: ["steigend"], kopf: [1, 4], seq: [1] },
    verfolgung: { s: ["lauf", "sturm"], h: ["lauf", "sprung"], b: ["steigend"], kopf: [2], seq: [1, 2] },
    spannung: { s: ["wechsel", "spuk"], h: ["spuk", "ruf"], b: ["welle"], kopf: [1, 3], seq: [1, -1] },
    grusel: { s: ["spuk", "wechsel"], h: ["spuk", "seufzer"], b: ["welle"], kopf: [3], seq: [-1] },
    unterreich: { s: ["tiefe", "wechsel"], h: ["tiefe", "zwergen"], b: ["welle"], kopf: [-2, 3], seq: [-1] },
    ruinen: { s: ["fern", "welle"], h: ["fern", "elbisch"], b: ["weite", "welle"], kopf: [4], seq: [1, -1] },
    elben: { s: ["elbisch", "welle", "bogen"], h: ["elbisch", "weite"], b: ["weite", "elbisch"], kopf: [2, 4], seq: [1] },
    fey: { s: ["glitzer", "huepfer"], h: ["glitzer", "terzen"], b: ["steigend"], kopf: [2, 4], seq: [1, 2] },
    pilger: { s: ["choral", "bogen"], h: ["choral", "fern"], b: ["welle"], kopf: [2], seq: [1, -1] },
    klage: { s: ["seufzer", "fallend"], h: ["seufzer", "welle"], b: ["fallend", "welle"], kopf: [2], seq: [-1] },
    kamin: { s: ["wiegen", "bogen", "fallend"], h: ["bogen", "seufzer"], b: ["welle"], kopf: [2], seq: [1, -1] },
    rast: { s: ["wiegen", "welle"], h: ["wiegen", "bogen"], b: ["welle"], kopf: [2], seq: [1] },
    reise: { s: ["wanderer", "weite"], h: ["weite", "wanderer"], b: ["steigend"], kopf: [3, 4], seq: [1, 2] },
    auenland: { s: ["huepfer", "terzen"], h: ["huepfer", "bogen"], b: ["welle"], kopf: [2], seq: [1, 2] },
    zwerge: { s: ["zwergen", "ruf"], h: ["zwergen", "held"], b: ["fallend"], kopf: [3], seq: [-1, 1] },
    dorffest: { s: ["huepfer", "terzen", "krug"], h: ["krug", "huepfer"], b: ["steigend"], kopf: [2, 4], seq: [1, 2] },
    marktplatz: { s: ["terzen", "huepfer"], h: ["krug", "glitzer"], b: ["welle"], kopf: [2], seq: [1, 2] },
    trinklied: { s: ["krug", "seemann"], h: ["krug", "fanfare"], b: ["steigend"], kopf: [2, 4], seq: [1, 2] },
    shanty: { s: ["seemann", "wiegen"], h: ["seemann", "ruf"], b: ["welle"], kopf: [2, 3], seq: [1, -1] }
  };
  Object.keys(WENDUNG).forEach(k => { if (STIL[k]) STIL[k].wendung = WENDUNG[k]; });
  const STIL_FORMEN = { ruhig: ["bogen", "wechsel", "fallend", "welle", "ruf"], lebhaft: ["bogen", "terzen", "sprung", "steigend", "welle", "ruf"], wild: ["steigend", "sprung", "terzen", "wechsel", "ruf"] };
  const umkehren = f => f.map(x => -x);
  /* naheliegender Akkordton – nur wenn er die Form höchstens um einen Schritt verbiegt */
  const zumAkkord = (ton, bass, i) => { const z = naechsterTon(ton, akkordToene(klingt(bass, i))); return Math.abs(z - ton) <= 1 ? z : ton; };
  const grenze = x => Math.max(0, Math.min(7, x));
  function motivBauen(st) {
    const sortiert = st.rhythmus.slice().sort((a, b) => a.length - b.length);
    /* geringe Dichte (leise Stufen) = die sparsamsten Rhythmen, sonst einer der volleren */
    const rhythmus = st.dichte < .6 ? sortiert[0] : st.dichte < .85 ? zufall(sortiert.slice(0, Math.max(1, sortiert.length - 1))) : zufall(sortiert.slice(Math.floor(sortiert.length / 2)));
    const art = st.chaos ? "wild" : st.dichte < .7 ? "ruhig" : "lebhaft";
    return { rhythmus, form: FORMEN[zufall(STIL_FORMEN[art])], start: st.lage + zufall([-1, 0, 0, 1]) };
  }
  /* eine halbe Taktlänge: Rhythmus ab Schritt „halb“, Form ab Startton; ziel = Schlusston (Zahl) oder null */
  function halbeSetzen(a, bass, motiv, halb, start, form, ziel) {
    const r = motiv.rhythmus, n = r.length;
    const rel = r.map((_, k) => form[k % form.length] - form[0]), lo = Math.min(...rel), hi = Math.max(...rel);
    /* Startton so legen, dass die ganze Form in den Tonraum passt – sonst „klebt“ sie oben oder unten fest */
    let ton = Math.max(-lo, Math.min(7 - hi, start));
    ton = zumAkkord(ton, bass, halb);
    if (ton + hi > 7) ton -= ton + hi - 7; if (ton + lo < 0) ton -= ton + lo;
    r.forEach((s, k) => {
      const i = halb + s; if (i >= SCHRITTE) return;
      let t = grenze(ton + rel[k]);
      /* auf den Zählzeiten zum Akkord rücken (höchstens einen Schritt, und nie auf den Ton davor – sonst klebt die Melodie) */
      if (k > 0 && i % 4 === 0) {
        const toene = akkordToene(klingt(bass, i)), vor = a[halb + r[k - 1]];
        if (!toene.includes(t % 7)) {
          const richtung = rel[k] >= rel[k - 1] ? 1 : -1;
          const z = [t + richtung, t - richtung].find(x => x >= 0 && x <= 7 && x !== vor && toene.includes(x % 7));
          if (z != null) t = z;
        }
      }
      if (k === n - 1 && ziel != null) t = ziel;
      a[i] = t;
    });
    return a[halb + r[n - 1]];
  }
  const schlussTon = (bass, i, wunsch, offen) => {
    const toene = akkordToene(klingt(bass, i));
    const kand = [0, 1, 2, 3, 4, 5, 6, 7].filter(t => toene.includes(t % 7) && (offen ? t % 7 !== 0 : true));
    const tonika = kand.filter(t => t % 7 === 0);
    const pool = !offen && tonika.length ? tonika : (kand.length ? kand : [wunsch]);
    return pool.reduce((b, t) => Math.abs(t - wunsch) < Math.abs(b - wunsch) ? t : b, pool[0]);
  };
  function phraseBauen(bass, motiv, st, art) {
    const a = leer(), r = motiv.rhythmus, letzter = 8 + r[r.length - 1];
    const s = motiv.start, f = motiv.form;
    const erstes = halbeSetzen(a, bass, motiv, 0, s, f, null);
    if (art === "frage" && st.riff) { /* Riff: die zweite Hälfte wiederholt die erste – das bleibt im Ohr */
      const ende = a[r[r.length - 1]];
      halbeSetzen(a, bass, motiv, 8, erstes, f, schlussTon(bass, letzter, ende, true));
    } else if (art === "frage") { /* Sequenz: dieselbe Form eine Stufe versetzt, offenes Ende */
      const ende = a[r[r.length - 1]];
      halbeSetzen(a, bass, motiv, 8, erstes + (ende > erstes ? -1 : 1), f, schlussTon(bass, letzter, ende + 1, true));
    } else { /* Antwort: umgekehrte Form, landet auf dem Grundton */
      halbeSetzen(a, bass, motiv, 8, s + 1, umkehren(f), schlussTon(bass, letzter, s - 1, false));
    }
    /* Durchgangstöne bei hoher Intensität: nur in Lücken von genau zwei Schritten, immer gleich */
    if (st.fuell > .2) for (let i = 1; i < SCHRITTE - 1; i++) {
      if (a[i] < 0 && a[i - 1] >= 0 && a[i + 1] >= 0 && Math.abs(a[i + 1] - a[i - 1]) === 2 && (i % 4 === 1 || st.fuell > .45)) a[i] = (a[i - 1] + a[i + 1]) / 2;
    }
    if (st.schraeg) for (let i = 1; i < SCHRITTE; i += 4) if (a[i] >= 0 && a[i] % 7 === 0) a[i] = 1; /* die kleine Sekunde: unheimlich */
    verzieren(a, bass, st, art);
    return a;
  }
  /* Verzierungen, wie sie Spielleute wirklich spielen – fest ins Thema geschrieben, damit sie zum Wiedererkennen gehören:
     Triller = Pralltriller (Ton, Nachbar, Ton) auf einem langen Ton der Volksmusik-Stimmungen,
     Vorhalt = der Schlusston einer Phrase kommt erst als Nachbarton von oben und löst sich dann auf (Seufzer). */
  function verzieren(a, bass, st, art) {
    const frei = (i, n) => { for (let k = 1; k <= n; k++) if (i + k >= SCHRITTE || a[i + k] >= 0) return false; return true; };
    if (st.zier === "triller") {
      [0, 8].forEach(h => {
        if (st.schwung != null && st.schwung < .3) return;
        for (let i = h; i < h + 8; i++) if (a[i] >= 0 && frei(i, 3)) {
          const t = a[i], n = t < 14 ? t + 1 : t - 1;
          a[i + 1] = n; a[i + 2] = t; break;
        }
      });
    } else if (st.zier === "vorhalt" && art === "antwort") {
      [8].forEach(h => { /* nur am Phrasenende – ein Seufzer, kein Dauerzustand */
        let letzter = -1; for (let i = h; i < h + 8; i++) if (a[i] >= 0) letzter = i;
        if (letzter < h + 2 || letzter + 2 >= h + 8 || !frei(letzter, 2)) return;
        const t = a[letzter]; if (t >= 14) return;
        a[letzter + 2] = t; a[letzter] = t + 1;
      });
    }
  }
  /* Echo singt die Melodie in Terzen mit (eine Oktave höher klingt das als Sexte darüber) – nur dort, wo es zum Akkord passt */
  function terzStimme(bass, mel) {
    return mel.map((m, i) => {
      if (m < 0) return -1;
      const toene = akkordToene(klingt(bass, i));
      let z = m >= 2 ? m - 2 : m + 5;
      if (i % 4 === 0 && !toene.includes(z % 7)) { const alt = naechsterTon(z, toene); if (alt != null && Math.abs(alt - z) <= 1) z = alt; }
      return grenze(z);
    });
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
  /* Tempo zur Intensität – nur innerhalb des Rahmens der Stimmung, damit sie ihren Charakter behält */
  const tempoFuer = (st, stufe) => { const [a, b] = st.tempo, x = (stufe == null ? 5 : stufe) / 10; return Math.round((a + (b - a) * x) / 2) * 2; };
  /* Akkordfolgen, die in dieser Tonleiter wohlklingen (ohne verminderten Dreiklang) */
  function folgenFuer(st, modus) {
    const v = VERMINDERT[modus], ok = st.akkorde.filter(f => !f.some(z => BASS_STUFEN[z] === v));
    return ok.length ? ok : [[0, 0, 0, 0]];
  }
  /* ---------- Dreier-Takte: Walzer (3/4) und Jig (6/8) in zwölf Schritten ---------- */
  const RHYTHMUS12 = {
    walzer: { ruhig: [[0, 4, 8], [0, 6, 8], [0, 8]], lebhaft: [[0, 4, 6, 8], [0, 2, 4, 8], [0, 4, 8, 10], [0, 6, 8, 10]] },
    jig: { ruhig: [[0, 4, 6, 10], [0, 6, 10], [0, 4, 6]], lebhaft: [[0, 2, 4, 6, 8, 10], [0, 4, 6, 8, 10], [0, 2, 4, 6, 10]] }
  };
  function phrase12(bass, motiv, st, art) {
    const a = leer(), r = motiv.rhythmus, n = r.length, jig = st.dreier === "jig", schlag = jig ? [0, 6] : [0, 4, 8];
    const f = art === "antwort" ? umkehren(motiv.form) : motiv.form;
    const rel = r.map((_, k) => f[k % f.length] - f[0]), lo = Math.min(...rel), hi = Math.max(...rel);
    let ton = Math.max(-lo, Math.min(7 - hi, motiv.start + (art === "antwort" ? 1 : 0)));
    ton = zumAkkord(ton, bass, 0); if (ton + hi > 7) ton -= ton + hi - 7; if (ton + lo < 0) ton -= ton + lo;
    r.forEach((s, k) => {
      let t = grenze(ton + rel[k]);
      if (schlag.includes(s)) {
        const toene = akkordToene(klingt(bass, s)), vor = k > 0 ? a[r[k - 1]] : -9;
        if (!toene.includes(t % 7)) { const ri = k > 0 && rel[k] < rel[k - 1] ? -1 : 1; const z = [t + ri, t - ri, t + 2 * ri, t - 2 * ri].find(x => x >= 0 && x <= 7 && x !== vor && toene.includes(x % 7)); if (z != null) t = z; }
      }
      if (k === n - 1) t = schlussTon(bass, s, t, art === "frage");
      a[s] = t;
    });
    /* Seufzer am Ende der Antwort, wenn Platz ist */
    if (st.zier === "vorhalt" && art === "antwort") { const l = r[n - 1]; if (l + 2 < 12 && a[l + 1] < 0 && a[l + 2] < 0 && a[l] < 7) { a[l + 2] = a[l]; a[l] = a[l] + 1; } }
    return a;
  }
  function stimmungTeile12(st, modus) {
    const jig = st.dreier === "jig", mitte = jig ? 6 : 8;
    const folgen = folgenFuer(st, modus || st.modus[0]);
    const f1 = zufall(folgen), f2 = folgen.length > 1 ? zufall(folgen.filter(f => f !== f1)) : f1;
    const bassVon = (c0, c1) => { const a = leer(); a[0] = c0; if (c1 !== c0) a[mitte] = c1; return a; };
    const ruhig = st.dichte < .8 || (st.schwung != null && st.schwung < .4);
    const rl = RHYTHMUS12[jig ? "jig" : "walzer"][ruhig ? "ruhig" : "lebhaft"];
    const motivVon = () => ({ rhythmus: zufall(rl), form: FORMEN[zufall(STIL_FORMEN[ruhig ? "ruhig" : "lebhaft"])], start: st.lage + zufall([-1, 0, 0, 1]) });
    const m1 = motivVon(), m2 = motivVon();
    const b1 = bassVon(f1[0], f1[1]), b2 = bassVon(f1[2], f1[3]), b3 = bassVon(f2[0], f2[1]);
    const leise = st.schwung != null && st.schwung < .3, voll = st.schwung != null && st.schwung > .7;
    const schlag = (stufe) => jig
      ? { klopf: leise ? [] : [0, 6], schelle: leise ? [] : (voll ? [2, 4, 8, 10] : [3, 9]), trommel: stufe ? [0, 4, 6, 10] : [0, 6], ketten: leise ? [] : [6] }
      : { klopf: leise ? [] : [4, 8], schelle: voll ? [4, 8] : [], trommel: stufe ? [0, 8] : [0], ketten: leise || !(st.ketten[0] || []).length ? [] : [4, 8] };
    const teil = (bass, mel, fl, stufe) => {
      const t = teilLeer(), sc = schlag(stufe);
      t.bass = bass; t.melodie = mel; t.floete = fl;
      ["klopf", "schelle", "trommel", "ketten"].forEach(k => { t[k] = (st[k] && st[k][0] && st[k][0].length === 0 && k !== "trommel") ? leer() : an(sc[k]); });
      return t;
    };
    const echo = (bass, mel, art) => {
      const a = leer(), setze = i => { const toene = akkordToene(klingt(bass, i)), m = mel[i]; let w = toene.filter(x => m < 0 || ((x - m % 7 + 7) % 7 === 2 || (x - m % 7 + 7) % 7 === 5)); if (!w.length) w = toene; a[i] = naechsterTon(4, w); };
      if (art === "lang") [0, mitte].forEach(setze);
      else for (let i = 0; i < 12; i += 2) if (mel[i] < 0 && (i === 0 || mel[i - 1] < 0) && Math.random() < .7) setze(i);
      return a;
    };
    const melA = phrase12(b1, m1, st, "frage"), melB = phrase12(b2, m1, st, "antwort"), melD = phrase12(b1, m1, st, "antwort");
    const A = teil(b1, melA, st.echo === "antwort" ? echo(b1, melA, "antwort") : leer(), 0);
    const B = teil(b2, melB, echo(b2, melB, "lang"), 0);
    const C = teil(b3, b3.map((v, i) => i === 0 ? BASS_STUFEN[klingt(b3, i)] % 7 : -1), phrase12(b3, m2, st, "antwort"), 0); C.klopf = leer(); C.schelle = leer();
    const D = teil(b1, melD, st.terzen ? terzStimme(b1, melD) : echo(b1, melD, "lang"), 1);
    return { A, B, C, D };
  }
  function stimmungTeile(st, modus) {
    if (st.taktJetzt === 12) return stimmungTeile12(st, modus);
    /* ruhigerer Harmonierhythmus: eine Akkordfolge verteilt sich über zwei Teile (A = erste Hälfte, B = zweite) */
    const halb = (f, h) => [f[2 * h], f[2 * h], f[2 * h + 1], f[2 * h + 1]];
    const folgen = folgenFuer(st, modus || st.modus[0]);
    const folge1 = zufall(folgen), folge2 = folgen.length > 1 ? zufall(folgen.filter(f => f !== folge1)) : folge1;
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
    const melA = phraseBauen(b1, motiv, st, "frage"), melB = phraseBauen(b2, motiv, st, "antwort");
    const A = teilVon(p1, melA, st.echo === "antwort" ? echoBauen(b1, melA, "antwort") : leer(), 0);
    const B = teilVon(p2, melB, echoBauen(b2, melB, st.echo), 0);
    const flC = phraseBauen(b3, motiv2, st, "antwort");
    const C = teilVon(p3, leer(), flC, 0); C.melodie = b3.map((v, i) => i % 8 === 0 ? BASS_STUFEN[klingt(b3, i)] % 7 : -1);
    C.klopf = leer(); C.schelle = leer();
    const melD = phraseBauen(b1, motiv, st, "antwort");
    /* Höhepunkt: in festlichen Stimmungen singt Echo die Melodie in Terzen mit */
    const D = teilVon(p1, melD, st.terzen && (st.schwung == null || st.schwung >= .35) ? terzStimme(b1, melD) : echoBauen(b1, melD, "lang"), 1);
    return { A, B, C, D };
  }
  /* ---------- Der Liedschreiber: ganze Lieder statt vier Takten ----------
     Jede Stimmung bekommt eine Liedform (Vorspiel, Strophe, Aufbau, Refrain, Zwischenteil, Schlussrefrain).
     Ein Abschnitt besteht aus mehreren Teilen (je ein Takt) – so entstehen Melodiebögen über vier Takte:
       Strophe      = Motiv, Motiv als Sequenz versetzt, Motiv wieder, offener Schluss
       Refrain      = Ohrwurm, Antwort, derselbe Ohrwurm noch einmal, Schluss auf dem Grundton – höher als die Strophe
       Aufbau       = die Laute läuft eine Tonleiter hinauf in den Refrain, die Trommel treibt
       Zwischenteil = andere Akkorde, die Laute hält lange Töne, Echo (oder ein Gast) spielt ein Solo
       Höhepunkt    = der Refrain mit voller Besetzung, Echo in Terzen, am Ende hinauf zum hohen Grundton
     Die Laute spielt in zwei Oktaven (Zeile 0–14), auf den Zählzeiten liegen immer Akkordtöne. */
  const LIEDFORMEN = {
    /* Hymne: Strophe, Aufbau, Refrain – und ein großer Schlussrefrain nach dem Zwischenteil */
    hymne: { teile: [["i", 1], ["s", 4], ["v", 1], ["r", 4], ["b", 2], ["h", 4]],
      folgen: [["i", "s", "s", "v", "r", "r", "b", "v", "h", "h"], ["i", "s", "v", "r", "b", "v", "h", "h"], ["i", "s", "s", "v", "r", "b", "v", "h"]] },
    /* Ballade: ruhig erzählend, ohne treibenden Aufbau */
    ballade: { teile: [["i", 1], ["s", 4], ["r", 4], ["b", 2], ["h", 4]],
      folgen: [["i", "s", "s", "r", "b", "h"], ["i", "s", "r", "s", "r", "b", "h"], ["i", "s", "s", "r", "b", "h", "h"]] },
    /* Tanz: Strophe und Refrain wechseln sich ab, erst vor dem Schluss wird angeheizt */
    tanz: { teile: [["i", 1], ["s", 4], ["r", 4], ["b", 2], ["v", 1], ["h", 4]],
      folgen: [["i", "s", "r", "s", "r", "b", "v", "h"], ["i", "s", "s", "r", "r", "b", "v", "h", "h"], ["i", "s", "r", "b", "v", "h", "h"]] },
    /* dunkel: langes Vorspiel, der „Refrain“ ist das bedrohliche Thema */
    dunkel: { teile: [["i", 2], ["s", 4], ["r", 4], ["b", 2], ["h", 4]],
      folgen: [["i", "s", "s", "r", "b", "h"], ["i", "s", "r", "b", "s", "h"], ["i", "s", "r", "s", "r", "b", "h"]] }
  };
  function formFuer(st) {
    if (st.form) return st.form;
    if (st.chaos && !st.riff) return "dunkel";
    if (st.dreier === "jig" || (st.swing && st.dichte >= .85)) return "tanz";
    return st.dichte < .7 ? "ballade" : "hymne";
  }
  function formBauen(st) {
    const f = LIEDFORMEN[formFuer(st)], buchst = {}; let rollen = "", i = 0;
    f.teile.forEach(([r, n]) => { buchst[r] = TEILE.slice(i, i + n).join(""); rollen += r.repeat(n); i += n; });
    rollen = (rollen + "s".repeat(16)).slice(0, 16);
    return { rollen, ablauf: zufall(f.folgen).map(r => buchst[r]).join("") };
  }
  /* Abschnitte aus dem Rollen-Text: [{ rolle, teile: ["B", "C", …] }] */
  function abschnitteVon(rollen) {
    const out = [];
    TEILE.forEach((p, i) => { const r = rollen[i]; if (out.length && out[out.length - 1].rolle === r) out[out.length - 1].teile.push(p); else out.push({ rolle: r, teile: [p] }); });
    return out;
  }
  const BASS_REIHE = ["orgel", "halbe", "viertel", "puls", "galopp"];
  const HAKEN_FORMEN = { ruhig: ["bogen", "welle", "ruf", "fallend"], lebhaft: ["sprung", "terzen", "ruf", "bogen", "welle"], wild: ["ruf", "sprung", "steigend", "wechsel"] };
  function liedTeile(st, modus, rollen, L) {
    L = L === 12 ? 12 : 16;
    const jig = st.dreier === "jig", cfg = L === 12 ? { schlag: jig ? [0, 6] : [0, 4, 8], mitte: jig ? 6 : 8 } : { schlag: [0, 4, 8, 12], mitte: 8 };
    const vm = VERMINDERT[modus], ok = z => BASS_STUFEN[z] !== vm;
    const folgen = folgenFuer(st, modus);
    const ruhig = st.dichte < .75 || (st.schwung != null && st.schwung < .35);
    const dunkel = !!st.chaos && !st.riff;
    const art = st.chaos ? "wild" : ruhig ? "ruhig" : "lebhaft";
    const hr = !ruhig && L === 16 && Math.random() < .55 ? 2 : 1; /* Akkorde je Takt */
    const dom = ok(3) ? 3 : 4, sub = ok(2) ? 2 : 5;
    /* ----- Tonräume: Strophe in der Mitte, Refrain darüber, der Höhepunkt reicht bis zum hohen Grundton ----- */
    const cv = Math.max(3, Math.min(8, st.lage + 2)), loV = Math.max(0, cv - 4), hiV = Math.min(12, cv + 4);
    const cr = Math.max(5, Math.min(10, cv + (dunkel ? 1 : ruhig ? 2 : 3))), loR = Math.max(0, cr - 3), hiR = Math.min(13, cr + 4);
    const spitze = dunkel ? 7 : cr >= 8 ? 14 : 7, hiH = Math.max(hiR, spitze);
    /* ----- Harmonien ----- */
    const P = zufall(folgen), Q = zufall(folgen);
    let R = zufall(folgen.length > 1 ? folgen.filter(f => f !== P) : folgen);
    /* der Refrain beginnt gern auf der Subdominante oder der Mollparallele – das hebt ihn von der Strophe ab */
    { const k = R.findIndex(c => c === 2 || c === 5); if (k > 0 && Math.random() < .8) R = R.slice(k).concat(R.slice(0, k)); }
    const strophenAkk = hr === 1 ? P.map(c => [c]) : [[P[0], P[1]], [P[2], P[3]], [Q[0], Q[1]], [Q[2], Q[3]]];
    { const l = strophenAkk[3]; if (l[l.length - 1] === 0) l[l.length - 1] = dom; }
    const refrainAkk = hr === 1 ? [[R[0]], [R[1]], [R[0]], [dom, 0]] : [[R[0], R[1]], [R[2], R[3]], [R[0], R[1]], [dom, 0]];
    const BR = [[5, 2], [2, 5], [5, 6], [6, 2], [2, 4], [5, 4], [6, 5]].filter(([a, b]) => ok(a) && ok(b));
    const [b0, b1] = BR.length ? zufall(BR) : [sub, sub];
    const brueckeAkk = [[b0], [b1, dom]];
    /* ----- Bass: in der Strophe ruhiger, im Refrain treibender ----- */
    const arten = st.bass.slice().sort((a, b) => BASS_REIHE.indexOf(a) - BASS_REIHE.indexOf(b));
    const artS = arten.length > 1 && Math.random() < .6 ? arten[0] : zufall(arten), artR = arten[arten.length - 1];
    const artVor = artR === "galopp" ? "galopp" : ruhig ? "viertel" : "puls", artB = ruhig || dunkel ? (arten.includes("orgel") ? "orgel" : "halbe") : "halbe", artI = dunkel ? arten[0] : artS;
    const bassVon = (ch, a) => {
      if (L === 12) { const b = leer(); b[0] = ch[0]; if (ch.length > 1 && ch[1] !== ch[0]) b[cfg.mitte] = ch[1]; return b; }
      return bassBauen(ch.length > 1 ? [ch[0], ch[0], ch[1], ch[1]] : [ch[0], ch[0], ch[0], ch[0]], a);
    };
    /* ----- Rhythmen und Motive ----- */
    const sortiert = st.rhythmus.slice().sort((a, b) => a.length - b.length);
    const halbWahl = dichter => st.dichte < .6 ? sortiert[0] : dichter ? zufall(sortiert.slice(Math.floor(sortiert.length / 2))) : zufall(sortiert.slice(0, Math.max(1, sortiert.length - 1)));
    const taktRhythmus = (dichter, gleich) => {
      if (L === 12) return zufall(RHYTHMUS12[jig ? "jig" : "walzer"][ruhig ? "ruhig" : "lebhaft"]).slice();
      const a = halbWahl(dichter), b = gleich ? a : halbWahl(dichter);
      return a.concat(b.map(x => x + 8));
    };
    /* Motiv = Rhythmus + Form; die zweite Takthälfte wiederholt die Form, versetzt um „sprung“ (Sequenz) */
    const motiv = (pos, form, sprung) => {
      const f = FORMEN[form], n1 = pos.filter(p => p < cfg.mitte).length;
      return { pos, rel: pos.map((p, k) => { const kk = p < cfg.mitte ? k : k - n1; return f[kk % f.length] - f[0] + (p < cfg.mitte ? 0 : sprung); }) };
    };
    const umgekehrt = m => ({ pos: m.pos, rel: m.rel.map(x => -x) });
    const rS = taktRhythmus(false, !!st.riff || Math.random() < .55);
    let rH = taktRhythmus(true, Math.random() < .35);
    for (let k = 0; k < 6 && String(rH) === String(rS); k++) rH = taktRhythmus(true, Math.random() < .35);
    /* die typische Wendung der Stimmung: eigene Formen für Strophe und Ohrwurm, und der Ohrwurm beginnt mit ihrem Sprung */
    const w = st.wendung || null;
    const mS = motiv(rS, zufall(w ? w.s : STIL_FORMEN[art]), st.riff ? 0 : zufall(w ? w.seq : [-1, 1, 2]));
    const mH = motiv(rH, zufall(w ? w.h : HAKEN_FORMEN[art]), st.riff ? 0 : zufall([-1, -2, 1]));
    if (w && w.kopf && mH.rel.length >= 3) {
      const sp = zufall(w.kopf), d = sp - (mH.rel[1] - mH.rel[0]);
      /* Sprung einsetzen und den Rest der ersten Takthälfte mitziehen, damit die Linie danach stimmig weitergeht */
      for (let k = 1; k < mH.rel.length; k++) mH.rel[k] += d * (k === 1 ? 1 : .6);
      mH.rel = mH.rel.map(Math.round);
    }
    const sequenz = zufall(w ? w.seq : [-1, 1, 2]);
    /* ----- Töne setzen ----- */
    function setzeTakt(bass, m, start, lo, hi, ziel) {
      const a = leer(); if (!m.pos.length) return a;
      const rlo = Math.min(...m.rel), rhi = Math.max(...m.rel);
      const s0 = Math.max(lo - rlo, Math.min(hi - rhi, start));
      let vor = -9;
      m.pos.forEach((p, k) => {
        let t = Math.max(lo, Math.min(hi, s0 + m.rel[k]));
        if (cfg.schlag.includes(p)) {
          const toene = akkordToene(klingt(bass, p));
          if (!toene.includes(t % 7)) {
            const ri = k > 0 && m.rel[k] < m.rel[k - 1] ? -1 : 1;
            const z = [t + ri, t - ri, t + 2 * ri, t - 2 * ri].find(x => x >= lo && x <= hi && x !== vor && toene.includes(x % 7));
            if (z != null) t = z;
          }
        }
        if (k === m.pos.length - 1 && ziel != null) t = ziel;
        a[p] = t; vor = t;
      });
      return a;
    }
    function zielTon(bass, p, wunsch, wie, lo, hi) {
      const toene = akkordToene(klingt(bass, p));
      let kand = []; for (let t = lo; t <= hi; t++) if (toene.includes(t % 7)) kand.push(t);
      if (wie === "zu") { const g = kand.filter(t => t % 7 === 0); if (g.length) kand = g; }
      if (wie === "offen") { const g = kand.filter(t => t % 7 !== 0); if (g.length) kand = g; }
      if (!kand.length) return Math.max(lo, Math.min(hi, wunsch));
      return kand.reduce((b, t) => Math.abs(t - wunsch) < Math.abs(b - wunsch) ? t : b, kand[0]);
    }
    /* Schlusstakt einer Phrase: der Anfang des Motivs, dann ein langer Ton auf der Takthälfte */
    function kadenzTakt(bass, m, start, lo, hi, wie, wunsch) {
      const n = Math.max(1, m.pos.filter(p => p < cfg.mitte).length);
      const k = { pos: m.pos.slice(0, n).filter(p => p < cfg.mitte).concat([cfg.mitte]), rel: m.rel.slice(0, n).concat([m.rel[n - 1] - 1]) };
      return setzeTakt(bass, k, start, lo, hi, zielTon(bass, cfg.mitte, wunsch, wie, lo, hi));
    }
    function schmuecken(a, bass, wie) {
      if (st.fuell > .2) for (let i = 1; i < L - 1; i++) {
        if (a[i] < 0 && a[i - 1] >= 0 && a[i + 1] >= 0 && Math.abs(a[i + 1] - a[i - 1]) === 2 && (i % 4 === 1 || st.fuell > .45)) a[i] = (a[i - 1] + a[i + 1]) / 2;
      }
      if (st.schraeg) for (let i = 1; i < L; i += 4) if (a[i] >= 0 && a[i] % 7 === 0) a[i] += 1;
      if (L === 16) verzieren(a, bass, st, wie);
      for (let i = L; i < SCHRITTE; i++) a[i] = -1;
      return a;
    }
    const zurFloete = t => t < 0 ? -1 : t >= 7 ? Math.min(7, t - 7) : t;
    /* Echo singt in Terzen (oder Sexten) mit – Echos Flöte klingt eine Oktave höher als die Zeile */
    const terzFl = (bass, mel) => mel.map((m, i) => {
      if (m < 0 || i >= L) return -1;
      const toene = akkordToene(klingt(bass, i));
      for (const c of [m - 2, m + 2, m - 5, m + 5, m + 9]) {
        if (c < 7 || c > 14) continue;
        let f = c - 7;
        if (cfg.schlag.includes(i) && !toene.includes(f % 7)) { const alt = naechsterTon(f, toene); if (alt != null && Math.abs(alt - f) <= 1) f = alt; }
        return Math.max(0, Math.min(7, f));
      }
      return -1;
    });
    const echo = (bass, mel, wie) => { const a = echoBauen(bass, mel, wie); for (let i = L; i < SCHRITTE; i++) a[i] = -1; return a; };
    /* ----- Schlagwerk je Rolle ----- */
    const rhy = (liste, i) => an(((liste && liste[Math.min(i, liste.length - 1)]) || []).filter(x => x < L));
    function schlagwerk(t, rolle) {
      const stufe = rolle === "r" || rolle === "h" ? 1 : 0;
      if (L === 12) {
        const leise = st.schwung != null && st.schwung < .3, voll = st.schwung != null && st.schwung > .7;
        const sc = jig ? { klopf: leise ? [] : [0, 6], schelle: leise ? [] : (voll ? [2, 4, 8, 10] : [3, 9]), trommel: stufe ? [0, 4, 6, 10] : [0, 6], ketten: leise ? [] : [6] }
          : { klopf: leise ? [] : [4, 8], schelle: voll ? [4, 8] : [], trommel: stufe ? [0, 8] : [0], ketten: leise || !(st.ketten[0] || []).length ? [] : [4, 8] };
        if (rolle === "v") sc.trommel = jig ? [0, 2, 4, 6, 8, 10] : [0, 4, 8, 10];
        ["klopf", "schelle", "trommel", "ketten"].forEach(k => { t[k] = (st[k] && st[k][0] && st[k][0].length === 0 && k !== "trommel") ? leer() : an(sc[k]); });
      } else {
        t.klopf = rhy(st.klopf, stufe); t.schelle = rhy(st.schelle, stufe); t.trommel = rhy(st.trommel, stufe); t.ketten = rhy(st.ketten, stufe);
        if (rolle === "v" && (st.trommel[0] || []).length) {
          const grund = (st.trommel[st.trommel.length - 1] || []).filter(x => x < 8);
          t.trommel = an(grund.concat(st.dichte >= .85 ? [8, 10, 12, 13, 14, 15] : [8, 12, 14]));
        }
      }
      if (rolle === "i") { t.klopf = leer(); t.schelle = leer(); }
      if (rolle === "b") { t.klopf = leer(); t.schelle = leer(); t.trommel = an((st.trommel[0] || []).length ? [0] : []); }
    }
    /* ----- Abschnitte komponieren ----- */
    function strophe(n) {
      return Array.from({ length: n }, (_, k) => {
        const ch = strophenAkk[k % strophenAkk.length], bass = bassVon(ch, artS);
        const mel = k === n - 1 ? kadenzTakt(bass, mS, cv, loV, hiV, "offen", cv + 1)
          : setzeTakt(bass, mS, k % 4 === 1 ? cv + sequenz : cv, loV, hiV, null);
        schmuecken(mel, bass, k === n - 1 ? "antwort" : "frage");
        return { bass, mel, fl: echo(bass, mel, st.echo) };
      });
    }
    /* Gegenstimme für die Kapelle: lange Akkordtöne unter der Melodie, in Gegenbewegung zu ihr;
       wo die Melodie Luft lässt, füllt sie mit einem Zwischenton – so antworten sich Barradin und die Kapelle */
    function gegenstimme(bass, mel) {
      const a = leer(), schlaege = L === 12 ? (jig ? [0, 6] : [0, 4, 8]) : [0, 4, 8, 12], halb = L === 12 ? (jig ? 6 : 4) : 4;
      let vor = null, melVor = null;
      const melBei = i => { for (let k = i; k >= 0; k--) if (mel[k] >= 0) return mel[k]; return cr; };
      schlaege.forEach((pp, k) => {
        const stark = k === 0 || pp === cfg.mitte, ruht = mel.slice(pp, pp + halb).every(v => v < 0);
        if (!stark && !ruht) return;
        const m = melBei(pp), trend = melVor == null ? 0 : Math.sign(m - melVor); melVor = m;
        const toene = akkordToene(klingt(bass, pp)), lo = Math.max(0, m - 9), hi = Math.max(lo + 2, m - 3);
        const ziel = vor == null ? m - 5 : vor - (trend || (Math.random() < .5 ? 1 : -1));
        let best = null;
        for (let t = lo; t <= hi; t++) if (toene.includes(((t % 7) + 7) % 7) && (best === null || Math.abs(t - ziel) < Math.abs(best - ziel) || (t !== vor && best === vor))) best = t;
        if (best == null) return;
        a[pp] = best; vor = best;
      });
      return a;
    }
    function refrain(n) {
      let haken = null;
      return Array.from({ length: n }, (_, k) => {
        const ch = refrainAkk[k % refrainAkk.length], bass = bassVon(ch, artR);
        let mel;
        if (k === n - 1) mel = schmuecken(kadenzTakt(bass, mH, cr, loR, hiR, "zu", cr - 1), bass, "antwort");
        else if (k % 2 === 1) mel = schmuecken(setzeTakt(bass, umgekehrt(mH), cr - 1, loR, hiR, null), bass, "antwort");
        else {
          /* derselbe Ohrwurm noch einmal – bei gleichem Akkord Ton für Ton gleich */
          if (!haken || String(ch) !== String(refrainAkk[0])) haken = schmuecken(setzeTakt(bass, mH, cr, loR, hiR, null), bass, "frage");
          mel = haken.slice();
        }
        return { bass, mel, fl: echo(bass, mel, ruhig ? "lang" : "antwort"), gegen: gegenstimme(bass, mel) };
      });
    }
    function hoehe(n, ref) {
      return Array.from({ length: n }, (_, k) => {
        const b = ref[k % ref.length], ch = refrainAkk[k % refrainAkk.length];
        const bass = b ? b.bass.slice() : bassVon(ch, artR);
        const mel = k === n - 1 ? schmuecken(kadenzTakt(bass, mH, cr, loR, hiH, "zu", spitze), bass, "antwort") : b.mel.slice();
        return { bass, mel, fl: st.terzen ? terzFl(bass, mel) : echo(bass, mel, "lang"), rex: k === n - 1, gegen: k === n - 1 || !b.gegen ? gegenstimme(bass, mel) : b.gegen.slice() };
      });
    }
    function aufbauTakt() {
      const bass = bassVon([sub, dom], artVor);
      const pos = L === 12 ? (ruhig ? [0, 4, 8] : [0, 2, 4, 6, 8, 10]) : (ruhig ? [0, 4, 8, 12] : [0, 2, 4, 6, 8, 10, 12, 14]);
      const ende = cr - 1, anf = ende - (pos.length - 1);
      const mel = setzeTakt(bass, { pos, rel: pos.map((_, k) => k) }, anf, Math.max(0, anf - 2), Math.min(14, ende + 1), null);
      return { bass, mel, fl: echo(bass, mel, "fern") };
    }
    function bruecke(n) {
      const mF = motiv(rH, zufall(w && w.b ? w.b : ["bogen", "welle", "steigend"]), -1);
      const lang = L === 12 ? { pos: [0], rel: [0] } : { pos: [0, cfg.mitte], rel: [0, -1] };
      return Array.from({ length: n }, (_, k) => {
        const ch = brueckeAkk[k % brueckeAkk.length], bass = bassVon(ch, artB);
        const letzt = lang.pos[lang.pos.length - 1];
        const mel = setzeTakt(bass, lang, cv - 1, loV, hiV, k === n - 1 ? zielTon(bass, letzt, cv, "offen", loV, hiV) : null);
        const fl = setzeTakt(bass, mF, k ? 9 : 10, 7, 14, null).map(t => t < 0 ? -1 : t - 7);
        return { bass, mel, fl };
      });
    }
    function vorspiel(n) {
      return Array.from({ length: n }, (_, k) => {
        const letzt = k === n - 1, ch = letzt ? refrainAkk[0].slice(0, 1) : [0], bass = bassVon(ch, artI);
        /* Echo deutet den Ohrwurm schon einmal an */
        const fl = letzt && !dunkel ? setzeTakt(bass, { pos: mH.pos.filter(p => p < cfg.mitte), rel: mH.rel.filter((_, i) => mH.pos[i] < cfg.mitte) }, cr, loR, hiR, null).map(zurFloete) : leer();
        return { bass, mel: leer(), fl };
      });
    }
    const teile = Object.fromEntries(TEILE.map(p => [p, teilLeer()]));
    const gesehen = new Map();
    let refStueck = null;
    const abs = abschnitteVon(rollen);
    /* der Refrain zuerst – der Höhepunkt baut auf ihm auf */
    abs.slice().sort((a, b) => (a.rolle === "r" ? -1 : 0) - (b.rolle === "r" ? -1 : 0)).forEach(a => {
      if (gesehen.has(a.rolle)) { const vor = gesehen.get(a.rolle); a.teile.forEach((p, k) => { teile[p] = kopie(teile[vor[k % vor.length]]); }); return; }
      gesehen.set(a.rolle, a.teile);
      const n = a.teile.length;
      let takte;
      if (a.rolle === "s") takte = strophe(n);
      else if (a.rolle === "r") takte = refStueck = refrain(n);
      else if (a.rolle === "h") takte = hoehe(n, refStueck || refrain(4));
      else if (a.rolle === "v") takte = Array.from({ length: n }, aufbauTakt);
      else if (a.rolle === "b") takte = bruecke(n);
      else takte = vorspiel(n);
      a.teile.forEach((p, k) => {
        const x = takte[k], t = teilLeer();
        t.bass = x.bass; t.melodie = x.mel.map(v => v < 0 ? -1 : Math.max(0, Math.min(14, Math.round(v)))); t.floete = x.fl.map(v => v < 0 ? -1 : Math.max(0, Math.min(7, Math.round(v))));
        if (x.gegen) t.gegen = x.gegen.map(v => v < 0 ? -1 : Math.max(0, Math.min(14, Math.round(v))));
        schlagwerk(t, a.rolle);
        if ((a.rolle === "r" || a.rolle === "h") && k === n - 1 && st.rex.length && Math.random() < .5) t.rex[L - 1] = zufall(st.rex);
        teile[p] = t;
      });
    });
    return teile;
  }
  /* Barradin und Echo nie mit derselben Klangfamilie (Schalmei und Oboe sind dieselbe Aufnahme, Fidel/Drehleier und Bratsche fast) */
  const FAMILIE = { schalmei: ["oboe", "englischhorn"], fidel: ["bratsche"], drehleier: ["bratsche"], dudelsack: ["pfeife", "piccolo"] };
  const echoWahl = (liste, mel, jetzt) => { const ok = liste.filter(x => !(FAMILIE[mel] || []).includes(x)), r = ok.length ? ok : liste, ohne = r.filter(x => x !== jetzt); return zufall(jetzt != null && ohne.length ? ohne : r); };
  function stimmungLied(k, behalten, stufe, neueForm) {
    const roh = STIL[k], ist = stufe != null ? stufe : (typeof S.intensitaet === "number" ? S.intensitaet : 5), st = mitIntensitaet(roh, ist);
    /* Stimmungen mit handgeschriebenen Themen (Kampf, Endgegner): ein Thema wählen – beim neuen Lied ein anderes */
    if (roh.lieder && roh.lieder.length) {
      const alt = behalten && S.stimmung === k && Number.isInteger(S.liedNr) ? S.liedNr : -1;
      let nr = alt >= 0 && !neueForm ? alt : Math.floor(Math.random() * roh.lieder.length);
      if (neueForm && roh.lieder.length > 1) while (nr === alt) nr = Math.floor(Math.random() * roh.lieder.length);
      const v = liedVonNoten(roh.lieder[nr]), gleich = behalten && S.stimmung === k;
      return pruefen({ tempo: tempoFuer(roh, ist), transpose: gleich ? S.transpose : zufall(roh.transpose), modus: v.modus, instrument: gleich ? S.instrument : v.instrument,
        band: gleich ? S.band : Object.assign(BAND_START(), v.band), ablauf: v.ablauf, rollen: v.rollen, swing: v.swing || 0, bordun: v.bordun, takt: 16, liedNr: nr,
        arrSeed: Math.random() < .5 ? 0 : 1, kapWahl: gleich && Array.isArray(S.kapWahl) && S.kapWahl.length ? S.kapWahl.slice() : kapelleWaehlen(k),
        variation: v.variation, teile: Object.fromEntries(TEILE.map(p => [p, v[p] || teilLeer()])), vol: S.vol, mute: S.mute, stimmung: k, intensitaet: ist });
    }
    const basis = behalten ? { tempo: S.tempo, transpose: S.transpose, modus: S.modus, instrument: S.instrument, band: S.band, ablauf: S.ablauf, swing: S.swing, bordun: S.bordun, takt: S.takt === 12 && roh.dreier ? 12 : 16 }
      : { tempo: tempoFuer(roh, ist) + zufall([-2, 0, 2]), transpose: zufall(st.transpose), modus: zufall(st.modus), instrument: zufall(st.instrument),
          band: { trommel: zufall(st.band.trommel), floete: zufall(st.band.floete), ketten: zufall(st.band.ketten) },
          ablauf: zufall(st.ablauf), swing: st.swing, bordun: st.bordun, takt: roh.dreier ? 12 : 16 };
    if (!behalten && (FAMILIE[basis.instrument] || []).includes(basis.band.floete)) basis.band.floete = echoWahl(st.band.floete, basis.instrument);
    st.taktJetzt = basis.takt;
    if (basis.takt === 12) basis.swing = 0;
    /* ein ganzes Lied: die Form bleibt beim Weiterkomponieren gleich (die Band ist mitten im Stück), ein neues Thema darf eine neue Form bringen */
    const form = behalten && !neueForm && S.rollen && S.stimmung === k ? { rollen: S.rollen, ablauf: S.ablauf } : formBauen(roh);
    let teile;
    basis.arrSeed = behalten && !neueForm && S.stimmung === k && typeof S.arrSeed === "number" ? S.arrSeed : (Math.random() < .5 ? 0 : 1);
    basis.kapWahl = behalten && !neueForm && S.stimmung === k && Array.isArray(S.kapWahl) && S.kapWahl.length ? S.kapWahl.slice() : kapelleWaehlen(k);
    try { teile = liedTeile(st, basis.modus, form.rollen, basis.takt); basis.ablauf = form.ablauf; basis.rollen = form.rollen; }
    catch (_) { teile = stimmungTeile(st, basis.modus); if (!/^[ABCD]+$/.test(basis.ablauf)) basis.ablauf = zufall(roh.ablauf); delete basis.rollen; }
    return pruefen(Object.assign(basis, { variation: st.variation, teile, vol: S.vol, mute: S.mute, stimmung: k, intensitaet: ist }));
  }

  const kopie = o => JSON.parse(JSON.stringify(o));

  /* ---------- Zustand (gemerkt im Browser) ---------- */
  const MIX_START = () => ({
    vol: { klopf: 7, schelle: 5, bass: 8, melodie: 8, trommel: 7, floete: 6, ketten: 6, rex: 5 },
    mute: Object.fromEntries(IDS.map(k => [k, 0]))
  });
  /* ---------- Die Lieder der Band, neu geschrieben ----------
     Jedes Lied ist eine ganze Form (Vorspiel, Strophe, Refrain, Zwischenteil, Schlussrefrain) mit fester Kapelle.
     Notiert als Leadsheet: je Takt die Akkorde (vier Viertel, Bass-Zeilen 0 = I, 1 = III, 2 = IV, 3 = V, 4 = VII, 5 = VI, 6 = II)
     und die Melodie in 16 Schritten (Zeichen 0–9, a–e = Tonleiterstufen, „.“ = klingt weiter / Pause).
     Echos Stimme: eigene Noten oder „echo“ (antwortet in den Pausen), „lang“ (lange Töne), „terz“ (singt in Terzen mit). */
  const LIED_ROLLEN = "issssrrrrbbhhhhs";
  const LIEDER_NEU = {
    taverne: { instrument: "laute", band: { trommel: "bodhran", floete: "floete", ketten: "klatschen" }, tempo: 112, transpose: 0, modus: "dorisch", swing: 0, bordun: 1, variation: 2,
      besetzung: "trinklied", kapWahl: [0, 1, 4], ablauf: "ABCDEFGHIBCDEFGHIJKLMNO",
      bass: { i: "halbe", s: "viertel", r: "puls", b: "halbe", h: "puls" },
      schlag: { i: { trommel: [0, 8] }, s: { trommel: [0, 6, 8, 14], klopf: [0, 8], schelle: [4, 12] }, r: { trommel: [0, 3, 6, 8, 11, 14], klopf: [0, 4, 8, 12], schelle: [2, 6, 10, 14], ketten: [4, 12] },
        b: { trommel: [0] }, h: { trommel: [0, 3, 6, 8, 10, 11, 12, 14], klopf: [0, 4, 8, 12], schelle: [2, 6, 10, 14], ketten: [4, 12] } },
      takte: [["0000", "", "4...2...4...7..."],
        ["0044", "4.2.4.7.6.4.6.4.", "echo"], ["0033", "4.2.4.7.8.7.6.4.", "echo"], ["0044", "2.4.7.9.8.6.3.6.", "echo"], ["2233", "3.5.7.5.4.......", "lang"],
        ["0044", "7...9.7.6...8.6.", "lang"], ["2233", "a...9.7.8...6.8.", "lang"], ["0044", "7...9.7.6...8.6.", "lang"], ["3300", "8.7.6.4.7.......", "lang"],
        ["1122", "9.......a.......", "2.4.6.4.3.5.7.5."], ["4433", "8.......6.......", "6.4.3.1.4.6.4..."],
        ["0044", "7...9.7.6...8.6.", "terz"], ["2233", "a...9.7.8...6.8.", "terz"], ["0044", "7...9.7.6...8.6.", "terz"], ["3300", "8.7.6.8.7...7...", "terz"]] },
    ballade: { instrument: "harfe", band: { trommel: "bodhran", floete: "gesang", ketten: "schnipsen" }, tempo: 76, transpose: 0, modus: "aeolisch", swing: 0, bordun: 0, variation: 1,
      besetzung: "kamin", kapWahl: [0, 1, 2], ablauf: "ABCDEFGHIBCDEJKLMNO",
      bass: { i: "orgel", s: "halbe", r: "viertel", b: "orgel", h: "viertel" },
      schlag: { s: { trommel: [0] }, r: { trommel: [0, 8], ketten: [4, 12] }, h: { trommel: [0, 6, 8, 14], ketten: [4, 12] } },
      takte: [["0000", "0...4...7...4...", ""],
        ["0055", "4...4.3.5...0.2.", "echo"], ["2244", "3...5.3.1...3.4.", "echo"], ["0055", "4...7.6.5...2.4.", "echo"], ["2233", "3...5.3.1.......", "lang"],
        ["5522", "7...7.9.a...c.a.", "lang"], ["0044", "9...7.6.8...6.4.", "lang"], ["5522", "7...7.9.a...c.a.", "lang"], ["2300", "a...8.6.7.......", "lang"],
        ["1144", "9.......8.......", "4.6.4.2.3.1.3.5."], ["5533", "7.......8.......", "2.4.5.2.4.6.4.1."],
        ["5522", "7...7.9.a...c.a.", "terz"], ["0044", "9...7.6.8...6.4.", "terz"], ["5522", "7...7.9.a...c.a.", "terz"], ["2300", "a...8.6.7...7...", "terz"]] },
    hafen: { instrument: "akkordeon", band: { trommel: "trommel", floete: "gesang", ketten: "krug" }, tempo: 100, transpose: 0, modus: "dorisch", swing: 0, bordun: 1, variation: 2,
      besetzung: "shanty", kapWahl: [1, 2, 3], ablauf: "ABCDEFGHIBCDEFGHIJKLMNO",
      bass: { i: "halbe", s: "viertel", r: "viertel", b: "halbe", h: "puls" },
      schlag: { i: { ketten: [4, 12] }, s: { trommel: [0, 8], ketten: [4, 12] }, r: { trommel: [0, 6, 8, 14], klopf: [0, 8], ketten: [4, 12] },
        b: { trommel: [0] }, h: { trommel: [0, 3, 6, 8, 11, 14], klopf: [0, 8], ketten: [4, 10, 12] } },
      takte: [["0000", "", ""],
        ["0000", "4.4.4.2.0.2.4...", "echo"], ["4444", "3.3.3.1.6.1.3...", "echo"], ["0000", "4.4.4.2.0.2.4...", "echo"], ["4430", "3.1.6...4...0...", "lang"],
        ["0022", "7...7...a...c...", "terz"], ["4433", "8...6...8...6...", "terz"], ["0022", "7...7...a...c...", "terz"], ["4300", "8.6.4.6.7.......", "lang"],
        ["2222", "a.......c.......", "3.5.7.5.3.5.0..."], ["4433", "8.......6.......", "6.4.3.1.4.6.4..."],
        ["0022", "7...7...a...c...", "terz"], ["4433", "8...6...8...6...", "terz"], ["0022", "7...7...a...c...", "terz"], ["4300", "8.6.4.6.7...7...", "terz"]] },
    wald: { instrument: "harfe", band: { trommel: "bodhran", floete: "panfloete", ketten: "rassel" }, tempo: 92, transpose: 0, modus: "lydisch", swing: 1, bordun: 0, variation: 2,
      besetzung: "fey", kapWahl: [0, 2, 4], ablauf: "ABCDEFGHIJKLMNO",
      bass: { i: "orgel", s: "halbe", r: "viertel", b: "halbe", h: "viertel" },
      schlag: { s: { trommel: [0, 8], schelle: [12] }, r: { trommel: [0, 6, 8], ketten: [2, 6, 10, 14] }, h: { trommel: [0, 6, 8, 14], ketten: [2, 6, 10, 14] } },
      takte: [["0000", "", "4.......2......."],
        ["0066", "4.5.4.2.1.3.5.3.", "echo"], ["5533", "5.4.2.0.4.6.8.6.", "echo"], ["0066", "4.5.7.5.3.5.8.5.", "echo"], ["1133", "4.2.4.6.4.......", "lang"],
        ["0066", "9...b.9.8...a.8.", "lang"], ["5533", "7...9.7.6...8.6.", "lang"], ["0066", "9...b.9.8...a.8.", "lang"], ["6300", "8.a.8.6.7.......", "lang"],
        ["5555", "c.......9.......", "0.2.5.4.2.4.0.2."], ["1133", "b.......d.......", "4.6.4.2.6.4.1.4."],
        ["0066", "9...b.9.8...a.8.", "terz"], ["5533", "7...9.7.6...8.6.", "terz"], ["0066", "9...b.9.8...a.8.", "terz"], ["6300", "8.a.8.6.7...7...", "terz"]] },
    schmiede: { instrument: "drehleier", band: { trommel: "pauke", floete: "horn", ketten: "loeffel" }, tempo: 88, transpose: -2, modus: "aeolisch", swing: 0, bordun: 1, variation: 2,
      besetzung: "zwerge", kapWahl: [0, 1, 2], ablauf: "ABCDEFGHIBCDEFGHIJKLMNO",
      bass: { i: "halbe", s: "halbe", r: "galopp", b: "halbe", h: "galopp" },
      schlag: { i: { trommel: [0, 8] }, s: { trommel: [0, 8], ketten: [3, 11] }, r: { trommel: [0, 3, 6, 8, 11, 14], klopf: [0, 8], ketten: [3, 6, 11, 14] },
        b: { trommel: [0] }, h: { trommel: [0, 3, 6, 8, 10, 11, 12, 14], klopf: [0, 8], ketten: [3, 6, 11, 14] } },
      takte: [["0000", "", ""],
        ["0000", "0..0..2.4...2...", "lang"], ["5544", "0..0..2.3...1...", "lang"], ["0000", "0..0..2.4...2...", "lang"], ["5533", "2..2..0.1.......", "lang"],
        ["0055", "7..7..9.7...5...", "terz"], ["4433", "6..6..8.6...4...", "terz"], ["0055", "7..7..9.7...5...", "terz"], ["4400", "6..8..6.7.......", "lang"],
        ["2222", "a.......c.......", "3...5...7...5..."], ["3333", "b.......8.......", "4...6...1...4..."],
        ["0055", "7..7..9.7...5...", "terz"], ["4433", "6..6..8.6...4...", "terz"], ["0055", "7..7..9.7...5...", "terz"], ["4400", "6..8..6.7...7...", "terz"]] },
    trauer: { instrument: "fidel", band: { trommel: "pauke", floete: "gesang", ketten: "ketten" }, tempo: 58, transpose: 0, modus: "aeolisch", swing: 0, bordun: 1, variation: 1,
      besetzung: "klage", kapWahl: [0, 1, 2], ablauf: "ABCDEFGHIJKLMNO",
      bass: { i: "orgel", s: "halbe", r: "halbe", b: "orgel", h: "viertel" },
      schlag: { s: { trommel: [0] }, r: { trommel: [0, 8] }, b: { trommel: [0] }, h: { trommel: [0, 8, 12] } },
      takte: [["0000", "", "4.......2......."],
        ["0055", "4...4.3.5...0.2.", "lang"], ["2244", "3...5.3.1...3...", "lang"], ["0055", "4...7.6.5...2.0.", "lang"], ["2233", "3...5.3.1.......", "lang"],
        ["5522", "7...9.7.a...c...", "lang"], ["0044", "9...7.6.8...6...", "lang"], ["5522", "7...9.7.a...c...", "lang"], ["2300", "a...8.6.7.......", "lang"],
        ["1144", "9.......8.......", "4...6...3...1..."], ["5533", "7.......8.......", "2...5...4...1..."],
        ["5522", "7...9.7.a...c...", "terz"], ["0044", "9...7.6.8...6...", "terz"], ["5522", "7...9.7.a...c...", "terz"], ["2300", "a...8.6.7...7...", "terz"]] },
    wiegen: { instrument: "glocken", band: { trommel: "bodhran", floete: "okarina", ketten: "rassel" }, tempo: 66, transpose: 0, modus: "ionisch", swing: 0, bordun: 0, variation: 1,
      besetzung: "rast", kapWahl: [0, 4, 1], ablauf: "ABCDEFGHIJKLMNO",
      bass: { i: "orgel", s: "halbe", r: "halbe", b: "orgel", h: "halbe" },
      schlag: { r: { trommel: [0], ketten: [4, 12] }, h: { trommel: [0, 8], ketten: [4, 12] } },
      takte: [["0000", "", ""],
        ["0033", "4.3.2...4.3.1...", "echo"], ["3300", "1.2.4...4.2.0...", "echo"], ["0033", "4.3.2...4.3.1...", "echo"], ["2233", "3.4.5...4...1...", "lang"],
        ["5522", "7...5...7...a...", "lang"], ["0033", "9...7...8...6...", "lang"], ["5522", "7...5...7...a...", "lang"], ["2300", "5...6.8.7.......", "lang"],
        ["6633", "8.......6.......", "1...3...4...6..."], ["5522", "7.......7.......", "2...5...3...5..."],
        ["5522", "7...5...7...a...", "terz"], ["0033", "9...7...8...6...", "terz"], ["5522", "7...5...7...a...", "terz"], ["2300", "5...6.8.7...7...", "terz"]] }
  };
  function liedVonNoten(d) {
    const v = { instrument: d.instrument, band: d.band, tempo: d.tempo, transpose: d.transpose, modus: d.modus, swing: d.swing, bordun: d.bordun, variation: d.variation,
      ablauf: d.ablauf, rollen: LIED_ROLLEN, besetzung: d.besetzung, kapWahl: (d.kapWahl || []).slice(), swing: d.swing || 0 };
    const zeile = str => { const a = leer(); for (let i = 0; i < SCHRITTE && i < str.length; i++) if (str[i] !== ".") a[i] = parseInt(str[i], 36); return a; };
    d.takte.forEach(([akk, mel, fl], k) => {
      const p = TEILE[k], rolle = LIED_ROLLEN[k], t = teilLeer();
      const ch = akk.split("").map(Number), bass = bassBauen(ch, d.bass[rolle] || "halbe"), m = zeile(mel);
      t.bass = bass; t.melodie = m;
      t.floete = fl === "echo" ? echoBauen(bass, m, "antwort") : fl === "lang" ? echoBauen(bass, m, "lang") : fl === "terz" ? terzStimme(bass, m) : fl ? zeile(fl) : leer();
      const sc = (d.schlag || {})[rolle] || {};
      ["klopf", "schelle", "trommel", "ketten"].forEach(s => { t[s] = an(sc[s] || []); });
      if (k === d.takte.length - 1) t.rex[15] = 0;
      v[p] = t;
    });
    return v;
  }
  Object.keys(LIEDER_NEU).forEach(k => { VORLAGEN[k] = liedVonNoten(LIEDER_NEU[k]); });
  /* ---------- Kampf und Endgegner: handgeschriebene Kampfthemen ----------
     Inspiriert von Spiele-Kampfmusik (Pokémon & Co.): ein schneller Lauf als Auftakt, treibende Achtel im Bass,
     Snare mit Rückschlag und Wirbeln, synkopierte Riffs in der Strophe und ein heldenhafter Refrain in hoher Lage.
     Mehrere Themen je Stimmung – mit jedem neuen Lied kommt ein anderes. */
  const BOSS_SCHLAG = {
    i: { trommel: [0, 4, 8, 12, 13, 14, 15], schelle: [] },
    s: { trommel: [0, 3, 6, 8, 11, 14], klopf: [4, 12], schelle: [0, 2, 4, 6, 8, 10, 12, 14], ketten: [4, 12] },
    r: { trommel: [0, 2, 3, 6, 8, 10, 11, 14], klopf: [4, 12], schelle: [0, 2, 4, 6, 8, 10, 12, 14], ketten: [4, 12] },
    b: { trommel: [0, 3, 6, 8, 11, 14], schelle: [0, 4, 8, 12], ketten: [4, 12] },
    h: { trommel: [0, 2, 3, 4, 6, 8, 10, 11, 12, 13, 14, 15], klopf: [4, 12], schelle: [0, 2, 4, 6, 8, 10, 12, 14], ketten: [4, 12] }
  };
  const KAMPF_SCHLAG = {
    i: { trommel: [10, 12, 13, 14, 15], schelle: [] },
    s: { trommel: [0, 3, 6, 8, 10, 14], klopf: [4, 12], schelle: [0, 2, 4, 6, 8, 10, 12, 14], ketten: [4, 12] },
    r: { trommel: [0, 3, 4, 6, 8, 11, 12, 14], klopf: [4, 12], schelle: [0, 2, 4, 6, 8, 10, 12, 14], ketten: [4, 12] },
    b: { trommel: [0, 4, 8, 12, 13, 14, 15], schelle: [0, 4, 8, 12], ketten: [4, 12] },
    h: { trommel: [0, 3, 6, 8, 10, 11, 12, 13, 14, 15], klopf: [4, 12], schelle: [0, 2, 4, 6, 8, 10, 12, 14], ketten: [4, 12] }
  };
  const KAMPF_LIEDER = {
    kampf: [
      { instrument: "fidel", band: { trommel: "trommel", floete: "horn", ketten: "stampfen" }, modus: "aeolisch", bordun: 0, variation: 1, ablauf: "ABCDEFGHIBCDEFGHIJKLMNO",
        bass: { i: "orgel", s: "puls", r: "galopp", b: "puls", h: "galopp" }, schlag: KAMPF_SCHLAG,
        takte: [["0000", "edcba9876543210.", ""],
          ["0000", "4.4.7.4.9.7.4.2.", "lang"], ["5555", "5.5.7.5.9.7.5.2.", "lang"], ["2222", "3.3.7.3.a.7.5.3.", "lang"], ["3333", "4.6.8.b.8.6.b.d.", "lang"],
          ["0055", "7.7.9.b.c...9.7.", "terz"], ["4433", "a.a.8.6.b.......", "terz"], ["0055", "7.7.9.b.c...e.c.", "terz"], ["4433", "d.c.a.c.b.......", "lang"],
          ["5544", "c.......a.......", "5.7.5.2.6.3.6.1."], ["2233", "a.......b.c.d.e.", "3.5.3.0.4.6.1.4."],
          ["0055", "7.7.9.b.c...9.7.", "terz"], ["4433", "a.a.8.6.b.......", "terz"], ["0055", "7.7.9.b.c...e.c.", "terz"], ["4400", "d.c.a.c.e.......", "terz"]] },
      { instrument: "fidel", band: { trommel: "taiko", floete: "horn", ketten: "stampfen" }, modus: "aeolisch", bordun: 0, variation: 1, ablauf: "ABCDEFGHIBCDEFGHIJKLMNO",
        bass: { i: "orgel", s: "puls", r: "puls", b: "halbe", h: "galopp" }, schlag: KAMPF_SCHLAG,
        takte: [["0000", "0.4.7.4.0.4.7.b.", ""],
          ["0000", "4.4.5.4.2...0.2.", "lang"], ["4444", "3.3.4.3.1...6.1.", "lang"], ["5555", "2.2.3.2.0...5.7.", "lang"], ["3333", "1.4.6.8.b...8...", "lang"],
          ["5544", "c..c..a.a...8...", "terz"], ["0033", "9..9..7.b...8...", "terz"], ["5544", "c..c..a.a...8...", "terz"], ["2300", "a..a..8.7.......", "lang"],
          ["1111", "9.......b.......", "2...4...6...4..."], ["3333", "b.......8.......", "4...6...1...4..."],
          ["5544", "c..c..a.a...8...", "terz"], ["0033", "9..9..7.b...8...", "terz"], ["5544", "c..c..a.a...8...", "terz"], ["2300", "a..a..8.7...e...", "terz"]] }
    ],
    boss: [
      { instrument: "drehleier", band: { trommel: "taiko", floete: "oohchor", ketten: "ketten" }, modus: "phrygisch", bordun: 1, variation: 1, ablauf: "ABCDEFGHIBCDEFGHIJKLMNO",
        bass: { i: "puls", s: "galopp", r: "puls", b: "galopp", h: "galopp" }, schlag: BOSS_SCHLAG,
        takte: [["0000", "e.d.c.b.a.9.8.7.", ""],
          ["0066", "0.0.1.0.1.1.3.1.", "lang"], ["0066", "0.0.1.0.5.3.1.3.", "lang"], ["5544", "2.2.0.2.6.6.3.1.", "lang"], ["6666", "1.3.5.8.a.8.5.3.", "lang"],
          ["0066", "7...7.8.a...8.7.", "terz"], ["5566", "9...9.7.8...a.c.", "terz"], ["0066", "7...7.8.a...c.e.", "terz"], ["4466", "d.c.a.8.8.......", "lang"],
          ["1111", "b.......9.......", "2...4...6...4..."], ["6666", "a.......8.a.c.e.", "1...3...5...3..."],
          ["0066", "7...7.8.a...8.7.", "terz"], ["5566", "9...9.7.8...a.c.", "terz"], ["0066", "7...7.8.a...c.e.", "terz"], ["6600", "c.a.8.a.7...0...", "terz"]] },
      { instrument: "fidel", band: { trommel: "pauke", floete: "oohchor", ketten: "ketten" }, modus: "phrygisch", bordun: 1, variation: 1, ablauf: "ABCDEFGHIBCDEFGHIJKLMNO",
        bass: { i: "puls", s: "galopp", r: "galopp", b: "puls", h: "galopp" }, schlag: BOSS_SCHLAG,
        takte: [["0000", "0.1.0.1.0.1.0.1.", ""],
          ["0000", "4.5.4.2.4.5.4.2.", "lang"], ["6666", "5.6.5.3.5.6.5.3.", "lang"], ["5555", "2.3.2.0.2.3.2.5.", "lang"], ["4444", "6.8.a.d.a.8.6.3.", "lang"],
          ["0055", "e...e.d.c...9...", "terz"], ["6644", "c...a.8.d...a...", "terz"], ["0055", "e...e.d.c...9...", "terz"], ["6600", "8.a.c.a.7.......", "lang"],
          ["5555", "9.......c.......", "2...5...7...5..."], ["6666", "a.......c.a.8.a.", "3...5...1...3..."],
          ["0055", "e...e.d.c...9...", "terz"], ["6644", "c...a.8.d...a...", "terz"], ["0055", "e...e.d.c...9...", "terz"], ["6600", "8.a.c.a.7...e...", "terz"]] }
    ]
  };
  /* Verfolgung: gehetzt und voller Angst. Phrygisch (der bange Halbton über dem Grundton), Sechzehntel-Zittern, stolpernde Akzente,
     im Refrain schmerzliche Schreie in hoher Lage, die abwärts fallen – und nur einmal, kurz vor dem Ende des Refrains,
     ein Dur-Akkord mit einer aufsteigenden Linie: der Hauch von Hoffnung, der gleich wieder verschluckt wird */
  const VERF_SCHLAG = {
    i: { trommel: [0, 2, 4, 6, 8, 10, 12, 13, 14, 15], schelle: [] },
    s: { trommel: [0, 3, 6, 9, 12, 14], klopf: [4, 12], schelle: [0, 2, 4, 6, 8, 10, 12, 14], ketten: [7, 15] },
    r: { trommel: [0, 2, 3, 6, 8, 10, 11, 14], klopf: [4, 12], schelle: [0, 2, 4, 6, 8, 10, 12, 14], ketten: [7, 15] },
    b: { trommel: [0, 3, 6, 13, 14, 15], schelle: [0, 4, 8, 12] },
    h: { trommel: [0, 2, 3, 6, 8, 9, 10, 11, 12, 13, 14, 15], klopf: [4, 12], schelle: [0, 2, 4, 6, 8, 10, 12, 14], ketten: [7, 15] }
  };
  KAMPF_LIEDER.verfolgung = [
    { instrument: "fidel", band: { trommel: "trommel", floete: "bratsche", ketten: "ketten" }, modus: "phrygisch", bordun: 1, variation: 1, ablauf: "ABCDEFGHIBCDEFGHIJKLMNO",
      bass: { i: "puls", s: "puls", r: "galopp", b: "halbe", h: "galopp" }, schlag: VERF_SCHLAG,
      takte: [["0000", "0101010101010101", ""],
        ["0000", "4.3.4.5.4.3.2.0.", "lang"], ["6666", "5.3.5.6.5.3.1.3.", "lang"], ["0000", "4.3.4.5.7.5.4.2.", "lang"], ["4466", "6.5.3.1.3.1.5.1.", "lang"],
        ["0055", "b...a.9.9...c.9.", "lang"], ["6644", "c...a.8.a...8.6.", "lang"], ["0055", "b...a.9.9...c.9.", "lang"], ["1111", "9...b...d.......", "terz"],
        ["0000", "0.......1.......", "0.1.0.1.2.1.0.1."], ["6666", "1.......3.4.5.6.", "1.3.1.3.5.3.1.3."],
        ["0055", "b...a.9.9...c.9.", "lang"], ["6644", "c...a.8.a...8.6.", "lang"], ["0055", "b...a.9.9...c.9.", "lang"], ["1100", "9.b.d...7...0...", "terz"]] },
    { instrument: "drehleier", band: { trommel: "taiko", floete: "oohchor", ketten: "ketten" }, modus: "phrygisch", bordun: 1, variation: 1, ablauf: "ABCDEFGHIBCDEFGHIJKLMNO",
      bass: { i: "puls", s: "puls", r: "galopp", b: "halbe", h: "galopp" }, schlag: VERF_SCHLAG,
      takte: [["0000", "e.d.c.b.a.9.8.7.", ""],
        ["0000", "0..1..0.4..2..0.", "lang"], ["6666", "1..3..1.5..3..1.", "lang"], ["5555", "2..0..2.5..4..2.", "lang"], ["4400", "3..1..6.7..4..2.", "lang"],
        ["0066", "e...e.d.a...c.a.", "lang"], ["5544", "c...9.7.d...a.8.", "lang"], ["0066", "e...e.d.a...c.a.", "lang"], ["1155", "b...9...c...e...", "terz"],
        ["2222", "a.......7.......", "3.5.3.0.3.5.7.5."], ["6666", "8.......8.a.c.e.", "1.3.5.3.1.3.5.1."],
        ["0066", "e...e.d.a...c.a.", "lang"], ["5544", "c...9.7.d...a.8.", "lang"], ["0066", "e...e.d.a...c.a.", "lang"], ["5500", "c.a.9.7.7...0...", "terz"]] }
  ];
  /* ---------- Spannung, Reiter, Sieg, Marktplatz: ebenfalls handgeschrieben ---------- */
  const SPANN_SCHLAG = { s: { trommel: [0], ketten: [0, 4, 8, 12] }, r: { trommel: [0, 8], ketten: [0, 2, 4, 6, 8, 10, 12, 14] }, b: { ketten: [0, 4, 8, 12] },
    h: { trommel: [0, 4, 8, 12, 14], ketten: [0, 2, 4, 6, 8, 10, 12, 14], schelle: [2, 6, 10, 14] } };
  const REIT_SCHLAG = { i: { trommel: [0, 3, 6, 8, 11, 14] }, s: { trommel: [0, 3, 6, 8, 11, 14], klopf: [8], schelle: [0, 8] }, r: { trommel: [0, 3, 6, 8, 11, 14], klopf: [4, 12], schelle: [0, 4, 8, 12], ketten: [4, 12] },
    b: { trommel: [0, 8] }, h: { trommel: [0, 3, 6, 8, 11, 12, 14], klopf: [4, 12], schelle: [0, 2, 4, 6, 8, 10, 12, 14], ketten: [4, 12] } };
  const SIEG_SCHLAG = { i: { trommel: [0, 2, 4, 6, 8, 10, 12, 13, 14, 15] }, s: { trommel: [0, 4, 8, 12], schelle: [2, 6, 10, 14], ketten: [4, 12] },
    r: { trommel: [0, 3, 4, 6, 8, 11, 12, 14], klopf: [4, 12], schelle: [0, 2, 4, 6, 8, 10, 12, 14], ketten: [4, 12] }, b: { trommel: [0, 8], schelle: [4, 12] },
    h: { trommel: [0, 2, 3, 4, 6, 8, 10, 11, 12, 14], klopf: [4, 12], schelle: [0, 2, 4, 6, 8, 10, 12, 14], ketten: [4, 12] } };
  const MARKT_SCHLAG = { i: { trommel: [0, 8] }, s: { trommel: [0, 6, 8, 14], klopf: [4, 12], schelle: [2, 10] }, r: { trommel: [0, 3, 6, 8, 11, 14], klopf: [4, 12], ketten: [6, 14] },
    b: { trommel: [0, 8] }, h: { trommel: [0, 3, 6, 8, 11, 14], klopf: [4, 12], schelle: [2, 6, 10, 14], ketten: [6, 14] } };
  const ABL = "ABCDEFGHIBCDEFGHIJKLMNO";
  Object.assign(KAMPF_LIEDER, {
    /* Spannung: tickendes Ostinato, ein reibender Halbton, Stille im Zwischenteil – und dann zittert alles */
    spannung: [
      { instrument: "harfe", band: { trommel: "pauke", floete: "englischhorn", ketten: "schnipsen" }, modus: "phrygisch", bordun: 1, variation: 1, ablauf: ABL,
        bass: { i: "orgel", s: "puls", r: "halbe", b: "orgel", h: "puls" }, schlag: SPANN_SCHLAG,
        takte: [["0000", "0...0...0...0...", ""],
          ["0000", "0.0.0.1.0.0.0.1.", "lang"], ["0000", "0.0.0.1.0.0.2.1.", "lang"], ["6666", "1.1.1.3.1.1.1.3.", "lang"], ["0000", "0.0.0.1.4...5...", "lang"],
          ["0000", "7.......8.......", "lang"], ["5555", "9.......8.......", "lang"], ["0000", "7.......8...7...", "lang"], ["6666", "8...a...c...8...", "lang"],
          ["0000", "................", "0...0...1...1..."], ["4444", "........6.8.a.d.", "6...6...1...3..."],
          ["0000", "7.8.7.8.7.8.7.8.", "lang"], ["5555", "9.8.9.8.9.8.9.8.", "lang"], ["0000", "7.8.7.8.a.8.7.8.", "lang"], ["6600", "8.......7...0...", "lang"]] },
      { instrument: "cembalo", band: { trommel: "pauke", floete: "bratsche", ketten: "schnipsen" }, modus: "aeolisch", bordun: 1, variation: 1, ablauf: ABL,
        bass: { i: "orgel", s: "puls", r: "halbe", b: "orgel", h: "puls" }, schlag: SPANN_SCHLAG,
        takte: [["0000", "4.......4.......", ""],
          ["0000", "4.5.4...4.5.4...", "lang"], ["5555", "5.6.5...5.6.5...", "lang"], ["0000", "4.5.4...7.5.4...", "lang"], ["3333", "4.3.1...6.4.1...", "lang"],
          ["0000", "b...........a...", "lang"], ["5555", "c...........b...", "lang"], ["2222", "a...........c...", "lang"], ["3333", "b.c.d.e.d.c.b...", "lang"],
          ["0000", "................", "4...5...4...5..."], ["4444", "............9.a.", "6...6...3...3..."],
          ["0000", "b.a.b.a.b.a.b.a.", "lang"], ["5555", "c.b.c.b.c.b.c.b.", "lang"], ["2222", "a.c.a.c.a.c.a.c.", "lang"], ["3300", "b.......7...0...", "lang"]] }
    ],
    /* Reiter: Galopp im 3-3-2, ein weiter, edler Ruf darüber, Hörner antworten */
    reiter: [
      { instrument: "fidel", band: { trommel: "bodhran", floete: "horn", ketten: "stampfen" }, modus: "dorisch", bordun: 1, variation: 1, ablauf: ABL,
        bass: { i: "galopp", s: "galopp", r: "galopp", b: "halbe", h: "galopp" }, schlag: REIT_SCHLAG,
        takte: [["0000", "0..0..0.4..4..4.", ""],
          ["0000", "4...7...4.2.0.2.", "lang"], ["2222", "3...7...5.3.0.3.", "lang"], ["4444", "6...8...6.3.1.3.", "lang"], ["3300", "4...6...7.......", "lang"],
          ["0022", "7...9.a.a...c.a.", "terz"], ["4433", "8...a.8.6...8.b.", "terz"], ["0022", "7...9.a.a...c.a.", "terz"], ["2300", "a...b.a.7.......", "lang"],
          ["1111", "9.......b.......", "2...4...6...4..."], ["4433", "8.......b.......", "1...3...4...6..."],
          ["0022", "7...9.a.a...c.a.", "terz"], ["4433", "8...a.8.6...8.b.", "terz"], ["0022", "7...9.a.a...c.a.", "terz"], ["2300", "a...b.a.e.......", "terz"]] },
      { instrument: "fidel", band: { trommel: "trommel", floete: "horn", ketten: "stampfen" }, modus: "dorisch", bordun: 1, variation: 1, ablauf: ABL,
        bass: { i: "galopp", s: "galopp", r: "galopp", b: "halbe", h: "galopp" }, schlag: REIT_SCHLAG,
        takte: [["0000", "7..7..7.4..4..4.", ""],
          ["0000", "0...2...4...7...", "lang"], ["4444", "1...3...6...8...", "lang"], ["2222", "3...5...7...a...", "lang"], ["3333", "4...6...8...b...", "lang"],
          ["0044", "e.......d.c.a.8.", "terz"], ["2233", "c.......b.a.8.6.", "terz"], ["0044", "e.......d.c.a.8.", "terz"], ["4400", "d.c.a.8.7.......", "lang"],
          ["1111", "b.......9.......", "2...4...6...4..."], ["3333", "8.......b.......", "4...6...1...4..."],
          ["0044", "e.......d.c.a.8.", "terz"], ["2233", "c.......b.a.8.6.", "terz"], ["0044", "e.......d.c.a.8.", "terz"], ["4400", "d.c.a.8.7...e...", "terz"]] }
    ],
    /* Sieg: Siegesfanfare (ta-ta-ta-taaa), Marschtrommel, ein breiter Refrain und ein Schluss, der wirklich ankommt */
    sieg: [
      { instrument: "dudelsack", band: { trommel: "trommel", floete: "horn", ketten: "klatschen" }, modus: "ionisch", bordun: 1, variation: 1, ablauf: ABL,
        bass: { i: "halbe", s: "viertel", r: "puls", b: "halbe", h: "puls" }, schlag: SIEG_SCHLAG,
        takte: [["0530", "777.5...6...7...", ""],
          ["0000", "4.4.7...4.4.9...", "lang"], ["2222", "5.5.7...5.5.a...", "lang"], ["3333", "6.6.8...6.6.b...", "lang"], ["3300", "8.6.4.6.7.......", "lang"],
          ["0022", "e...e.d.c...a.c.", "terz"], ["5533", "c...c.b.b...8.6.", "terz"], ["0022", "e...e.d.c...a.c.", "terz"], ["2300", "a...b...e.......", "terz"],
          ["5555", "9.......7.......", "5...7...5...2..."], ["6633", "8.......b...d...", "1...3...4...6..."],
          ["0022", "e...e.d.c...a.c.", "terz"], ["5533", "c...c.b.b...8.6.", "terz"], ["0022", "e...e.d.c...a.c.", "terz"], ["3300", "d.b.8.b.e...e...", "terz"]] },
      { instrument: "mandoline", band: { trommel: "pauke", floete: "pfeife", ketten: "klatschen" }, modus: "ionisch", bordun: 1, variation: 1, ablauf: ABL,
        bass: { i: "halbe", s: "viertel", r: "puls", b: "halbe", h: "puls" }, schlag: SIEG_SCHLAG,
        takte: [["0000", "0.4.7.b.e.......", ""],
          ["0000", "7.7.9.7.4...7...", "lang"], ["2222", "7.7.a.7.5...7...", "lang"], ["5555", "7.7.9.7.5...2...", "lang"], ["3333", "6.8.b.8.6.......", "lang"],
          ["0033", "e...b...d...b...", "terz"], ["2200", "c...a...e...b...", "terz"], ["0033", "e...b...d...b...", "terz"], ["2300", "a...b...e.......", "terz"],
          ["1111", "9.......b.......", "2...4...6...4..."], ["6633", "8.......b...d...", "1...3...4...6..."],
          ["0033", "e...b...d...b...", "terz"], ["2200", "c...a...e...b...", "terz"], ["0033", "e...b...d...b...", "terz"], ["3300", "d.b.8.b.e...e...", "terz"]] }
    ],
    /* Marktplatz: Feilschen – Händler ruft, Kunde widerspricht (Ruf und Antwort), dorisch, belebt, aber nicht zuckersüß */
    marktplatz: [
      { instrument: "schalmei", band: { trommel: "tamburin", floete: "klarinette", ketten: "krug" }, modus: "dorisch", bordun: 1, variation: 1, swing: 1, ablauf: ABL,
        bass: { i: "halbe", s: "viertel", r: "viertel", b: "halbe", h: "puls" }, schlag: MARKT_SCHLAG,
        takte: [["0000", "0.0.4...0.0.2...", ""],
          ["0000", "4.3.4.7.4.......", "........4.2.0.2."], ["4444", "3.1.3.6.3.......", "........6.3.1.3."], ["2222", "5.3.5.7.a.......", "........5.3.0.3."], ["3300", "4.6.4.1.7...4...", ""],
          ["0044", "7.7.9.7.........", "........6.6.1.6."], ["2233", "a.a.c.a.........", "........4.4.6.4."], ["0044", "7.9.b.9.8...6...", ""], ["3300", "8.6.4.6.7.......", "........4.2.0..."],
          ["1111", "9.......b.......", "2.4.6.4.2.4.6.4."], ["3333", "b.......8.......", "4.6.1.6.4.6.1.6."],
          ["0044", "7.7.9.7.........", "........6.6.1.6."], ["2233", "a.a.c.a.........", "........4.4.6.4."], ["0044", "7.9.b.9.8...6...", ""], ["3300", "8.6.4.6.7...0...", "........4.2.0..."]] },
      { instrument: "cembalo", band: { trommel: "tamburin", floete: "englischhorn", ketten: "loeffel" }, modus: "dorisch", bordun: 0, variation: 1, swing: 1, ablauf: ABL,
        bass: { i: "halbe", s: "viertel", r: "viertel", b: "halbe", h: "puls" }, schlag: MARKT_SCHLAG,
        takte: [["0000", "4.2.4.2.0.......", ""],
          ["0000", "2.4.2.0.4.......", "........2.4.0..."], ["2222", "3.5.3.0.5.......", "........3.5.0..."], ["4444", "1.3.1.6.3.......", "........1.3.6..."], ["3300", "4.1.4.6.7...0...", ""],
          ["0022", "9.7.9.b.a.......", "........3.5.3.0."], ["4433", "8.6.8.a.b.......", "........4.6.1.4."], ["0022", "9.7.9.b.a.......", "........3.5.3.0."], ["3300", "b.8.6.8.7.......", "........4.2.0..."],
          ["1111", "b.......9.......", "2.4.6.4.2.4.6.4."], ["2233", "a.......8.......", "3.5.0.5.4.6.1.6."],
          ["0022", "9.7.9.b.a.......", "........3.5.3.0."], ["4433", "8.6.8.a.b.......", "........4.6.1.4."], ["0022", "9.7.9.b.a.......", "........3.5.3.0."], ["3300", "b.8.6.8.7...0...", "........4.2.0..."]] }
    ]
  });
  Object.keys(KAMPF_LIEDER).forEach(k => { if (STIL[k]) STIL[k].lieder = KAMPF_LIEDER[k]; });

  const ausVorlage = (k, mix) => {
    const v = kopie(VORLAGEN[k]);
    return { tempo: v.tempo, transpose: v.transpose, modus: v.modus, swing: v.swing, bordun: v.bordun, variation: v.variation, instrument: v.instrument || "laute",
      ...(v.rollen ? { rollen: v.rollen } : {}), ...(v.besetzung ? { besetzung: v.besetzung, kapWahl: v.kapWahl } : {}),
      band: Object.assign(BAND_START(), v.band || {}),
      ablauf: v.ablauf, teile: Object.fromEntries(TEILE.map(p => [p, v[p] || teilLeer()])), ...(mix || MIX_START()) };
  };
  function pruefen(s) {
    const m = MIX_START();
    s.vol = Object.assign(m.vol, s.vol || {}); s.mute = Object.assign(m.mute, s.mute || {});
    s.teile = s.teile || {};
    TEILE.forEach(p => { s.teile[p] = Object.assign(teilLeer(), s.teile[p] || {}); });
    if (!/^[A-P]{1,64}$/.test(s.ablauf || "")) s.ablauf = "A";
    if (typeof s.rollen !== "string" || !/^[isvrbh]{16}$/.test(s.rollen)) delete s.rollen;
    s.band = Object.assign(BAND_START(), s.band || {});
    if (typeof s.master !== "number") s.master = 8;
    if (typeof s.hall !== "number") s.hall = 0;
    if (!RAEUME[s.raum]) s.raum = "taverne";
    if (!KULISSEN.includes(s.kulisse)) s.kulisse = "keine";
    if (typeof s.kulisseVol !== "number") s.kulisseVol = 5;
    if (typeof s.intensitaet !== "number") s.intensitaet = 5;
    if (s.takt !== 12) s.takt = 16;
    if (!s.gaeste || typeof s.gaeste !== "object") s.gaeste = {};
    if (typeof s.fxVol !== "number") s.fxVol = 8;
    if (typeof s.echoHall !== "number") s.echoHall = 3;
    if (s.orchester !== 0) s.orchester = 1;
    if (s.kapelle !== 0) s.kapelle = 1;
    if (s.besetzung && (s.stimmung || !KAPELLE_NAMEN.includes(s.besetzung))) delete s.besetzung;
    if (s.kapStufe !== 1) s.kapStufe = 2;
    if (![0, 1, 2].includes(s.kick)) s.kick = 1;
    s.kapWahl = Array.isArray(s.kapWahl) ? s.kapWahl.filter(Number.isInteger).slice(0, 4) : [];
    s.hallAus = Object.assign({ klopf: 0, schelle: 0, bass: 0, melodie: 0, trommel: 0, floete: 0, ketten: 0, rex: 0 }, s.hallAus || {});
    Object.keys(BAND).forEach(k => { if (!BAND[k].includes(s.band[k])) s.band[k] = BAND[k][0]; });
    if (typeof s.variation !== "number") s.variation = 0;
    if (!INSTRUMENTE.includes(s.instrument)) s.instrument = "laute";
    return s;
  }
  let S = pruefen(ausVorlage("taverne"));
  /* erster Besuch: die Tavernenmelodie trägt ihren Namen (nicht „Eigenes Lied“) */
  try { S.titel = t().vorlagen.taverne.replace(/^[^\wÄÖÜäöü]+/, ""); } catch (_) {}
  try {
    const g = JSON.parse(localStorage.getItem("imres-lautenwerk2") || "null");
    if (g && g.teile) S = pruefen(g);
  } catch (_) {}
  /* Die Bühne öffnet immer im Spielleiter-Pult – die komplette Ansicht liegt hinter einem eigenen Schalter */
  S.pult = true;
  let zugeklappt = {};
  try { zugeklappt = JSON.parse(localStorage.getItem("imres-lautenwerk-zu") || "{}") || {}; } catch (_) {}
  let bearbeite = "A", kopierZiel = null;
  /* ---------- Eigene Lieder: lokal im Browser oder gemeinsam auf dem Server der Questtafel ---------- */
  const LIED_SERVER = { url: "https://iszdxkwkgkksdemtqhwu.supabase.co", key: "sb_publishable_Bt3Vw5BSnLaVcTRPTS0ZsA_MeG6G2-Z" };
  let lokaleLieder = [], gruppenLieder = [], gruppeOk = false, geladen = null, speicherForm = null;
  /* Eigene Stimmungen: Grundstimmung + gemerkte Einstellungen (Intensität, Instrumente, Kulisse, Hall, Raum …).
     Schlüssel „e_…“ = neue Stimmung; Schlüssel einer eingebauten Stimmung = überschriebene Fassung. */
  let eigeneStimmungen = {}, stimmForm = null;
  try { eigeneStimmungen = JSON.parse(localStorage.getItem("imres-lw-stimmungen") || "{}") || {}; } catch (_) {}
  const stimmungenMerken = () => { try { localStorage.setItem("imres-lw-stimmungen", JSON.stringify(eigeneStimmungen)); } catch (_) {} };
  const STIMM_WERTE = () => ({ intensitaet: S.intensitaet, kulisse: S.kulisse, kulisseVol: S.kulisseVol, hall: S.hall, raum: S.raum, echoHall: S.echoHall,
    orchester: S.orchester, kapelle: S.kapelle, kapStufe: S.kapStufe, instrument: S.instrument, band: Object.assign({}, S.band), gaeste: Object.assign({}, S.gaeste) });
  const stimmName = k => eigeneStimmungen[k] && eigeneStimmungen[k].name ? eigeneStimmungen[k].name : (t().vorlagen[k] || "").replace(/^[^\wÄÖÜäöü]+/, "");
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
  function neuAuswahl() { if (musikTab === "eigene") boxNeu("musik"); }
  /* Passwort der Questtafel: nur für diese Sitzung (Tab) gemerkt, gleicher Schlüssel wie auf der Tafel */
  let liedPw = "";
  const PW_SCHLUESSEL = "imres-tafel-pw";
  try { localStorage.removeItem(PW_SCHLUESSEL); } catch (_) {}
  const pwLesen = () => { try { liedPw = sessionStorage.getItem(PW_SCHLUESSEL) || ""; } catch (_) {} return liedPw; };
  const pwMerken = pw => { liedPw = pw || ""; try { if (pw) sessionStorage.setItem(PW_SCHLUESSEL, pw); else sessionStorage.removeItem(PW_SCHLUESSEL); } catch (_) {} };
  pwLesen();
  function passwort() {
    const pruefe = pw => liedServer("/rest/v1/rpc/tafel_pruefen", { passwort: pw }).then(ok => ok === true);
    pwLesen();
    return (liedPw ? pruefe(liedPw) : Promise.resolve(false)).then(ok => {
      if (ok) return liedPw;
      if (liedPw) pwMerken("");
      const pw = window.prompt(t().pwFrage, "");
      if (!pw) return null;
      return pruefe(pw).then(ok2 => {
        if (!ok2) { window.alert(t().pwFalsch); return null; }
        pwMerken(pw);
        return pw;
      });
    });
  }
  const merken = () => { if (hoerer) return; try { localStorage.setItem("imres-lautenwerk2", JSON.stringify(S)); } catch (_) {} funkAenderung(); };

  /* ---------- Lied als kurzer Code für den Link ---------- */
  const hex = a => { let n = 0; a.forEach((v, i) => { if (v >= 0) n |= 1 << i; }); return n.toString(16).padStart(4, "0"); };
  const unhex = h => { const n = parseInt(h, 16) || 0; return Array.from({ length: SCHRITTE }, (_, i) => ((n >> i) & 1) ? 0 : -1); };
  /* Töne als ein Zeichen: 0–9, darüber a–e (die zweite Oktave der Laute) */
  const ziffern = a => a.map(v => v < 0 ? "." : v.toString(36)).join("");
  const unziffern = (str, max) => String(str || "").padEnd(SCHRITTE, ".").slice(0, SCHRITTE).split("").map(c => { const n = parseInt(c, 36); return isNaN(n) || n > max ? -1 : n; });
  const zahl = (x, min, max, d) => { const n = parseInt(x, 10); return isNaN(n) ? d : Math.max(min, Math.min(max, n)); };
  /* Format 6 = bis zu 16 Teile (nur so viele wie gebraucht) mit ihren Rollen, Laute in zwei Oktaven.
     Format 5 = vier Teile + Taktart (12 = Dreivierteltakt) und Kulisse; ältere Links bleiben lesbar */
  const kodieren = () => {
    const genutzt = TEILE.filter(p => S.ablauf.includes(p) || IDS.some(k => S.teile[p][k].some(v => v >= 0))), n = Math.max(4, TEILE.indexOf(genutzt[genutzt.length - 1]) + 1);
    return ["6", S.tempo, S.transpose, MODUS_LISTE.indexOf(S.modus), S.swing, S.bordun, S.variation, S.ablauf,
      IDS.map(k => (S.mute[k] ? "m" : "") + S.vol[k]).join(""), n, S.rollen || "x"]
      .concat(...TEILE.slice(0, n).map(p => SPUREN.map(sp => sp.art === "an" ? hex(S.teile[p][sp.id]) : ziffern(S.teile[p][sp.id]))))
      .concat([Math.max(0, INSTRUMENTE.indexOf(S.instrument)).toString(36) + ["trommel", "floete", "ketten"].map(k => Math.max(0, BAND[k].indexOf(S.band[k])).toString(36)).join("")])
      .concat([S.takt === 12 ? 12 : 16, Math.max(0, KULISSEN.indexOf(S.kulisse))])
      .join("-");
  };
  const zahl36 = (x, min, max, d) => { const n = parseInt(x, 36); return isNaN(n) ? d : Math.max(min, Math.min(max, n)); };
  function dekodieren(code) {
    /* negative Tonart (z. B. -2) steht als "--2" im Code – vor dem Zerlegen schützen */
    const p = String(code).replace(/--(\d)/g, "-~$1").split("-").map(x => x.replace(/^~/, "-"));
    if (p[0] === "6") {
      const n = zahl(p[9], 1, TEILE.length, 4), F = SPUREN.length;
      if (p.length !== 14 + n * F) return null;
      const s = { tempo: zahl(p[1], 50, 180, 110), transpose: zahl(p[2], -5, 6, 0), modus: MODUS_LISTE[zahl(p[3], 0, MODUS_LISTE.length - 1, 0)],
        swing: zahl(p[4], 0, 1, 0), bordun: zahl(p[5], 0, 1, 1), variation: zahl(p[6], 0, 10, 0), ablauf: String(p[7]).toUpperCase(),
        ...MIX_START(), teile: {}, band: BAND_START() };
      if (/^[isvrbh]{16}$/.test(p[10])) s.rollen = p[10];
      const mix = p[8].match(/m?\d/g);
      if (mix && mix.length === IDS.length) IDS.forEach((k, i) => { s.mute[k] = mix[i][0] === "m" ? 1 : 0; s.vol[k] = +mix[i].slice(-1); });
      TEILE.slice(0, n).forEach((teilName, ti) => {
        s.teile[teilName] = {};
        SPUREN.forEach((sp, si) => { const feld = p[11 + ti * F + si]; s.teile[teilName][sp.id] = sp.art === "an" ? unhex(feld) : unziffern(feld, sp.zeilen - 1); });
      });
      const ins = String(p[11 + n * F] || "");
      s.instrument = INSTRUMENTE[zahl36(ins[0], 0, INSTRUMENTE.length - 1, 0)];
      ["trommel", "floete", "ketten"].forEach((k, i) => { s.band[k] = BAND[k][zahl36(ins[i + 1], 0, BAND[k].length - 1, 0)]; });
      s.takt = p[12 + n * F] === "12" ? 12 : 16; s.kulisse = KULISSEN[zahl(p[13 + n * F], 0, KULISSEN.length - 1, 0)];
      return pruefen(s);
    }
    if ((p[0] === "4" && p.length === 10 + 4 * SPUREN.length) || (p[0] === "5" && p.length === 12 + 4 * SPUREN.length)) {
      const s = { tempo: zahl(p[1], 50, 180, 110), transpose: zahl(p[2], -5, 6, 0), modus: MODUS_LISTE[zahl(p[3], 0, MODUS_LISTE.length - 1, 0)],
        swing: zahl(p[4], 0, 1, 0), bordun: zahl(p[5], 0, 1, 1), variation: zahl(p[6], 0, 10, 0), ablauf: String(p[7]).toUpperCase(),
        ...MIX_START(), teile: {}, band: BAND_START() };
      const mix = p[8].match(/m?\d/g);
      if (mix && mix.length === IDS.length) IDS.forEach((k, i) => { s.mute[k] = mix[i][0] === "m" ? 1 : 0; s.vol[k] = +mix[i].slice(-1); });
      ["A", "B", "C", "D"].forEach((teilName, ti) => {
        s.teile[teilName] = {};
        SPUREN.forEach((sp, si) => {
          const feld = p[9 + ti * SPUREN.length + si];
          s.teile[teilName][sp.id] = sp.art === "an" ? unhex(feld) : unziffern(feld, sp.zeilen - 1);
        });
      });
      const ins = String(p[9 + 4 * SPUREN.length] || "");
      s.instrument = INSTRUMENTE[zahl(ins[0], 0, INSTRUMENTE.length - 1, 0)];
      ["trommel", "floete", "ketten"].forEach((k, i) => { s.band[k] = BAND[k][zahl(ins[i + 1], 0, BAND[k].length - 1, 0)]; });
      if (p[0] === "5") { s.takt = p[10 + 4 * SPUREN.length] === "12" ? 12 : 16; s.kulisse = KULISSEN[zahl(p[11 + 4 * SPUREN.length], 0, KULISSEN.length - 1, 0)]; }
      return pruefen(s);
    }
    if ((p[0] === "2" && p.length === 9 + 2 * SPUREN.length) || (p[0] === "3" && p.length === 10 + 2 * SPUREN.length)) {
      const s = { tempo: zahl(p[1], 50, 180, 110), transpose: zahl(p[2], -5, 6, 0), modus: MODUS_LISTE[zahl(p[3], 0, MODUS_LISTE.length - 1, 0)],
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
      const s = { tempo: zahl(p[0], 50, 180, 110), transpose: zahl(p[1], -5, 6, 0), modus: MODUS_LISTE[zahl(p[2], 0, MODUS_LISTE.length - 1, 0)],
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
  /* Sparsamer Hall fürs Handy: vier rückgekoppelte Verzögerungen mit Dämpfung (Feedback-Delay-Netz).
     Klingt etwas einfacher als der Faltungshall, kostet aber nur einen Bruchteil der Rechenzeit. */
  function fdnHall(rt60, hell) {
    const ein = ctx.createGain(), aus = ctx.createGain(), n = 4;
    const zeiten = [.0631, .0797, .0937, .1129], linien = [];
    for (let i = 0; i < n; i++) {
      const d = ctx.createDelay(.5), lp = ctx.createBiquadFilter();
      d.delayTime.value = zeiten[i]; lp.type = "lowpass"; lp.frequency.value = hell || 3500; lp.Q.value = -6; /* Q in dB: ohne Resonanzspitze, sonst schaukelt sich die Schleife auf */
      ein.connect(d); d.connect(lp); lp.connect(aus);
      linien.push({ d, lp, fb: .95 * Math.pow(10, -3 * zeiten[i] / Math.max(.3, rt60)) });
    }
    /* Householder-Mischung: jede Linie speist alle anderen – dicht, aber stabil */
    linien.forEach((a, i) => linien.forEach((b, j) => { const g = ctx.createGain(); g.gain.value = a.fb * (i === j ? .5 : -.5); a.lp.connect(g); g.connect(b.d); }));
    /* je länger der Nachhall, desto mehr Energie sammelt sich – das gleicht der Ausgangspegel aus */
    aus.gain.value = .7 * (1 - Math.max(...linien.map(l => l.fb)));
    return { ein, aus, connect: z => aus.connect(z), disconnect: () => { try { aus.disconnect(); } catch (_) {} } };
  }
  let sparHallIn = null, sparAktiv = false, kompRef = null, hallHP = null, orchHall = null, gastHall = null;
  let atem = null, pumpBus = null, breiteGain = null, taktEcho = null, taktEchoNass = null, taktEchoEin = null;
  const pumpZiel = () => pumpBus || master;
  /* Hall-Netz nur dann am Ausgang, wenn überhaupt ein Hall läuft – sonst spart es die Rechenzeit ganz */
  function sparAusgang() {
    if (!leicht() || !hallNode || !kompRef) return;
    const soll = S.hall > 0 || S.echoHall > 0;
    if (soll === sparAktiv) return;
    try { if (soll) hallNode.connect(kompRef); else hallNode.disconnect(); sparAktiv = soll; } catch (_) {}
  }
  function raumAnwenden() {
    if (!ctx || !hallEin) return;
    if (leicht()) {
      /* Sparmodus und Handy: EIN gemeinsames Hall-Netz für Raumhall und Echo-Hall, jeweils mit eigenem Sendepegel davor */
      const r = RAEUME[S.raum], neu = fdnHall(Math.max(2, r.dauer * .7), r.hell);
      neu.aus.gain.value *= .1; /* auf den Pegel des Faltungshalls abgestimmt */
      if (!sparHallIn) { sparHallIn = ctx.createGain(); sparHallIn.gain.value = hallPegel() * SPAR_HALL; hallFilter.connect(sparHallIn); }
      if (hallNode) { try { sparHallIn.disconnect(); if (echoNass) echoNass.disconnect(); hallNode.disconnect(); } catch (_) {} }
      sparHallIn.connect(neu.ein); if (echoNass) echoNass.connect(neu.ein);
      hallNode = neu; sparAktiv = false; sparAusgang();
      hallFilter.frequency.setTargetAtTime(r.hell, ctx.currentTime, .05);
      sparHallIn.gain.setTargetAtTime(hallPegel() * SPAR_HALL, ctx.currentTime, .08);
      return;
    }
    const neu = ctx.createConvolver();
    neu.buffer = hallBild(S.raum);
    if (hallNode) { try { hallFilter.disconnect(hallNode); hallNode.disconnect(); } catch (_) {} }
    hallFilter.connect(neu); neu.connect(hallNass); hallNode = neu;
    if (hallNass) hallNass.gain.setTargetAtTime(hallPegel(), ctx.currentTime, .08);
    hallFilter.frequency.setTargetAtTime(RAEUME[S.raum].hell, ctx.currentTime, .05);
  }
  const masterPegel = () => Math.pow(S.master / 10, 1.5);
  /* Effekte und Spieltisch-Momente haben ihren eigenen Pegel – unabhängig von der Musik */
  const fxPegel = () => .55 * Math.pow((typeof S.fxVol === "number" ? S.fxVol : 8) / 10, 1.5);
  let fxAusgang = null, ducken = null, duckEnde = 0, musikStumm = false;
  function musikWieder() {
    if (!ducken || !musikStumm) return;
    const j = ctx.currentTime; ducken.gain.cancelScheduledValues(j); ducken.gain.setValueAtTime(ducken.gain.value, j); ducken.gain.setTargetAtTime(1, j, .05); musikStumm = false;
  }
  /* Während ein Effekt läuft, tritt die Musik sanft etwas zurück (gut 3 dB) und kommt danach weich wieder */
  function musikDucken(start, dauer) {
    if (!ducken || musikPauseAb) return;
    const jetzt = ctx.currentTime, ende = Math.max(duckEnde, start + Math.max(.4, dauer * .85));
    const p = ducken.gain;
    if (musikStumm) return;
    p.cancelScheduledValues(jetzt); p.setValueAtTime(p.value, jetzt);
    p.setTargetAtTime(.68, Math.max(jetzt, start - .08), .12);
    p.setTargetAtTime(1, ende, .45);
    duckEnde = ende;
  }
  let echoSend = null, echoKonv = null, echoNass = null, echoVerbunden = false;
  const echoPegel = () => Math.pow((typeof S.echoHall === "number" ? S.echoHall : 3) / 10, 1.2) * 1.3;
  function echoBild() {
    const sr = ctx.sampleRate, dauer = spar ? 1.8 : 3.2, vor = Math.floor(sr * .035), len = Math.floor(sr * dauer) + vor, ir = ctx.createBuffer(2, len, sr);
    for (let c = 0; c < 2; c++) {
      const d = ir.getChannelData(c); let lp = 0;
      for (let i = vor; i < len; i++) { const t = (i - vor) / (len - vor); lp += .35 * ((Math.random() * 2 - 1) - lp); d[i] = lp * Math.pow(1 - t, 2.2) * Math.min(1, (i - vor) / (sr * .04)); }
      let e = 0; for (let i = 0; i < len; i++) e += d[i] * d[i];
      const f = 1 / Math.sqrt(e / sr * 2.2); for (let i = 0; i < len; i++) d[i] *= f;
    }
    return ir;
  }
  function echoHallSchalten() {
    if (!echoSend) return;
    const soll = S.echoHall > 0;
    if (soll === echoVerbunden) return;
    try { if (soll) spurGain.floete.connect(echoSend); else spurGain.floete.disconnect(echoSend); echoVerbunden = soll; } catch (_) {}
  }
  /* Hall aus = Faltungshall ganz abgeklemmt: spart auf dem Handy viel Rechenzeit */
  let hallVerbunden = false;
  function hallSchalten() {
    if (!hallEin || !hallFilter) return;
    const soll = S.hall > 0;
    if (soll === hallVerbunden) return;
    try { if (soll) hallEin.connect(hallFilter); else hallEin.disconnect(hallFilter); hallVerbunden = soll; } catch (_) {}
  }
  /* Hallanteil je Raum und Gerät abgeglichen (nachgemessen): bei 100 % ist der Hall etwa so laut wie die Musik selbst,
     große Räume eine Spur mehr. Der Faltungshall (PC) war vorher 10–15 dB lauter als das Hall-Netz am Handy. */
  const hallTrim = () => { const d = (RAEUME[S.raum] || RAEUME.taverne).dauer; return leicht() ? .8 * Math.pow(d / 1.4, .32) : .335 * Math.pow(1.4 / d, .27); };
  const hallPegel = () => Math.pow(S.hall / 10, 1.2) * 2.2 * hallTrim();
  /* das schlanke Hall-Netz (Handy/Sparmodus) braucht mehr Eingangspegel, um so viel Raum zu ergeben wie der Faltungshall */
  const SPAR_HALL = 3.5;
  /* ---------- Geräuschkulisse ---------- */
  let kul = null, kulRauschen = null, sfxBus = null, kulMerk = null, kulBus = null; /* kulMerk: über den Mini-Player angehaltene Kulisse */
  const kulPegel = () => Math.pow(S.kulisseVol / 10, 1.5) * .9;
  const zz = (a, b) => a + Math.random() * (b - a);
  /* Rauschbett; opt.wandern lässt die Filter langsam wandern (heulender Wind), opt.schwanken die Lautstärke */
  function kulBett(ziel, filter, laut, lfo, opt) {
    const r = ctx.createBufferSource(); r.buffer = kulRauschen; r.loop = true; r.loopStart = Math.random(); r.loopEnd = 3.9;
    let letzter = r; const filt = [];
    filter.forEach(([typ, f, q]) => { const b = ctx.createBiquadFilter(); b.type = typ; b.frequency.value = f; b.Q.value = q || .7; letzter.connect(b); letzter = b; filt.push([b, f]); });
    const g = ctx.createGain(); g.gain.value = laut; letzter.connect(g); g.connect(ziel);
    if (kul) kul.schichten.push({ g, laut, filt, wandern: (opt && opt.wandern) || .15, schwanken: (opt && opt.schwanken) || [.6, 1.25], naechst: 0 });
    const knoten = [r];
    if (lfo) {
      const o = ctx.createOscillator(), og = ctx.createGain(); o.frequency.value = lfo[0]; og.gain.value = laut * lfo[1];
      o.connect(og); og.connect(g.gain); o.start(); knoten.push(o);
    }
    r.start(ctx.currentTime, Math.random() * 3); return knoten;
  }
  function kulStoss(zeit, typ, f, q, laut, dauer) {
    if (spar && dauer < .02 && Math.random() < .6) return; /* Sparmodus: weniger einzelne Regentropfen */
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
  const ferne = () => { const d = Math.random(); return { tief: 600 + 7000 * Math.pow(1 - d, 2), laut: 1 - d * .7 }; };
  const KUL_EREIGNIS = {
    regen: [[.015, .07, z => kulStoss(z, "bandpass", zz(2500, 6500), 6, zz(.04, .16) * (kul.phase || 1), .015)],
            [5, 14, z => kulFx("tropfen", z, zz(.08, .2))], [20, 45, z => kulFx("boe", z, zz(.1, .25))]],
    feuer: [[5, 13, z => { kulStoss(z, "bandpass", zz(600, 1100), 3, .5, .03); kulStoss(z + .04, "bandpass", zz(1200, 2000), 4, .2, .02); }],
            [9, 22, z => kulFx("knacken", z, zz(.15, .35))], [40, 90, z => kulFx("eule", z, zz(.08, .16), { tief: 1500 })], [25, 60, z => kulFx("rascheln", z, zz(.08, .15))]],
    hoehle: [[1.2, 5, z => kulFx("tropfen", z, zz(.15, .5))], [.6, 3, z => { const f = zz(1300, 2100); kulTon(z, f, f * .55, .07, zz(.15, .4)); }],
             [25, 70, z => kulFx("steinschlag", z, zz(.2, .45), { tief: zz(1500, 4000) })], [18, 50, z => kulFx("fledermaus", z, zz(.08, .16))]],
    taverne: [[3.5, 11, z => kulFx("lachen", z, zz(.3, .75))], [1.8, 6, z => kulFx("krug", z, zz(.15, .45))],
              [7, 20, z => kulFx("stuhl", z, zz(.12, .28))], [15, 40, z => kulFx("knarren", z, zz(.08, .16))],
              [45, 100, z => kulFx("jubel", z, zz(.1, .18), { tief: 1800 })], [6, 16, z => kulFx("schritte", z, zz(.12, .25), { tief: zz(2500, 6000) })]],
    wald: [[2, 7, z => kulFx("vogel", z, zz(.15, .45))], [3, 9, z => kulFx("vogel", z, zz(.08, .2), { tief: 3000 })],
           [25, 60, z => kulFx("specht", z, zz(.15, .3), { tief: zz(2500, 6000) })], [15, 40, z => kulFx("knacken", z, zz(.12, .25))],
           [10, 25, z => kulFx("rascheln", z, zz(.15, .3))]],
    meer: [[3.5, 8, z => kulFx("welle", z, zz(.65, 1.2), { tempo: zz(.85, 1.1) })], [8, 22, z => kulFx("moewe", z, zz(.15, .4))],
           [40, 90, z => kulFx("glocke", z, zz(.08, .16), { tief: 2000 })], [14, 30, z => kulFx("knarren", z, zz(.12, .22))]],
    sturm: [[3, 9, z => kulFx("boe", z, zz(.35, .8), { tempo: zz(.8, 1.15) })],
            [8, 28, z => { const f = ferne(); kulFx("donner", z, 1.1 * f.laut, { tief: f.tief, tempo: zz(.85, 1.05) }); }],
            [12, 35, z => kulFx("fensterladen", z, zz(.2, .45))],
            [.02, .08, z => kulStoss(z, "bandpass", zz(2500, 6000), 5, zz(.03, .1) * (kul.phase || 1), .012)]]
  };
  /* Rauschbetten: [Filter], Pegel, LFO, Optionen */
  const KUL_BETT = {
    regen: [[[["bandpass", 2500, .5]], .7, [.13, .25]], [[["lowpass", 900, .7]], .3, null]],
    feuer: [],
    hoehle: [[[["bandpass", 250, .8]], .9, [.06, .6]], [[["bandpass", 420, 5]], .14, null, { wandern: .35, schwanken: [.2, 1.3] }]],
    wald: [[[["lowpass", 700, .7]], .8, [.1, .7]], [[["bandpass", 3500, .8]], .1, null, { wandern: .25, schwanken: [.2, 1.6] }]],
    meer: [[[["lowpass", 500, .7]], .45, null], [[["highpass", 2500, .7]], .08, null]],
    sturm: [[[["lowpass", 450, .7]], .55, null, { schwanken: [.4, 1.4] }],
            [[["bandpass", 700, 6]], .32, null, { wandern: .45, schwanken: [.2, 1.5] }],
            [[["bandpass", 1150, 8]], .18, null, { wandern: .45, schwanken: [.1, 1.6] }],
            [[["bandpass", 2600, .5]], .25, null, { schwanken: [.5, 1.3] }],
            [[["highpass", 1500, .7]], .14, null]],
    taverne: []
  };
  /* Echte Aufnahmen als Grundteppich (Blanket-Sammlung: gemeinfrei/CC0 bzw. CC BY, siehe klang/LIZENZ.txt).
     Jede Datei enthält die Schleife mit je einer halben Sekunde Vor- und Nachlauf – so schließt sie nahtlos. [Länge in s, Lautheit] */
  const KUL_AUFNAHME = { k_regen: [60, .041], k_feuer: [22, .018], k_grillen: [45, .128], k_voegel: [60, .06],
    k_bach: [50, .058], k_wellen: [60, .054], k_boot: [37.9934, .034], k_sturm: [22, .102], k_wind: [11.5, .133] };
  const KUL_VORLAUF = .5;
  /* Schichten je Kulisse: [Aufnahme, Stärke, { tief: Tiefpass, tempo, pan }] */
  const KUL_SCHICHT = {
    regen: [["k_regen", 1], ["k_wind", .14, { tief: 900 }]],
    feuer: [["k_feuer", 1.1], ["k_grillen", .32]],
    taverne: [["k_feuer", .4]],
    wald: [["k_voegel", .85], ["k_bach", .3], ["k_wind", .16, { tief: 1400 }]],
    hoehle: [["k_bach", .55, { tief: 650, tempo: .8 }], ["k_wind", .35, { tief: 380, tempo: .7 }]],
    meer: [["k_wellen", .85], ["k_boot", .6], ["k_wind", .22, { tempo: .9 }]],
    sturm: [["k_sturm", .55], ["k_regen", .6], ["k_wind", .75], ["k_wind", .5, { tempo: .8, pan: -.4 }]]
  };
  /* was von den gerechneten Klängen bleibt, wenn die Aufnahmen laufen: Rauschbetten (Indizes) und Ereignisse, die wegfallen */
  const KUL_REST = { regen: { betten: [], ohne: [0] }, feuer: { betten: [], schleife: 0 }, taverne: { schleife: 1 }, wald: { betten: [], ohne: [1] },
    hoehle: { betten: [1] }, meer: { betten: [], ohne: [0] }, sturm: { betten: [1, 2], ohne: [3] } };
  const KUL_GRUND = 2.2;
  function kulAufnahmen(k) {
    const liste = KUL_SCHICHT[k.art]; if (!liste) return;
    liste.slice(0, spar ? 2 : 9).forEach(([name, staerke, o]) => {
      o = o || {};
      sampleLaden(name).then(b => {
        if (!b || kul !== k) return;
        const [L, rms] = KUL_AUFNAHME[name], j = ctx.currentTime;
        const q = ctx.createBufferSource(); q.buffer = b; q.loop = true; q.loopStart = KUL_VORLAUF; q.loopEnd = Math.min(b.duration, KUL_VORLAUF + L);
        q.playbackRate.value = o.tempo || 1;
        const g = ctx.createGain(), laut = KUL_GRUND * staerke * Math.min(3, .07 / rms);
        g.gain.setValueAtTime(0, j); g.gain.linearRampToValueAtTime(laut, j + 2.5);
        let letzter = q;
        if (o.tief) { const lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = o.tief; letzter.connect(lp); letzter = lp; }
        if (o.pan && ctx.createStereoPanner && !leicht()) { const pn = ctx.createStereoPanner(); pn.pan.value = o.pan; letzter.connect(pn); letzter = pn; }
        letzter.connect(g); g.connect(k.g);
        q.start(j, KUL_VORLAUF + Math.random() * L);
        k.knoten.push(q);
        k.schichten.push({ g, laut, filt: [], wandern: 0, schwanken: [.8, 1.15], naechst: j + 3 });
      });
    });
  }
  /* Stärke-Phasen: mal Flaute, mal Höhepunkt – je Kulisse unterschiedlich weit */
  const KUL_PHASE = { sturm: [.35, 1.3], meer: [.6, 1.2], regen: [.6, 1.3], wald: [.7, 1.15], hoehle: [.7, 1.15], feuer: [.75, 1.15], taverne: [.75, 1.2] };
  /* ---------- Kulissen aus den Klangwelten-Aufnahmen (amb/, siehe klang/LIZENZ.txt) ----------
     Teppiche: lange Aufnahmen, von denen immer neue Ausschnitte weich ineinander geblendet werden – keine hörbare Schleife.
     Ereignisse: echte Einzelgeräusche (e_*, fx_*), nur Fledermaus und Lachen sind gerechnet. */
  const AMB_LAUT = {"a_feuer1":.0281,"a_feuer2":.0108,"a_feuer3":.0158,"a_grillen":.129,"a_nacht":.144,"a_voegel1":.0601,"a_voegel2":.0565,"a_laub":.0853,"a_bach1":.0405,"a_bach2":.0505,
    "a_wasserfall":.1828,"a_wind1":.0818,"a_wind2":.0963,"a_regen1":.0387,"a_regen2":.0462,"a_waldregen":.0248,"a_starkregen":.043,"a_zelt":.0196,"a_gewitter1":.0441,"a_gewitter2":.0412,
    "a_wellen1":.0623,"a_wellen2":.0559,"a_boot":.0343,"a_tropfen1":.0089,"a_tropfen2":.0249,"a_unterwasser":.1387,"a_kochen":.0825,"a_blubbern":.0647,
    "a_baumwind":.0829, "a_bienen":.143, "a_dschungel":.048, "a_fensterregen":.1195, "a_fluss":.0479, "a_gaeste":.0478, "a_gesang":.1534, "a_grillen2":.0479, "a_halle":.0474, "a_heulwind":.0772, "a_klangschale":.1555, "a_kochen2":.0477, "a_lagerfeuer":.0148, "a_laubregen":.0434, "a_leichtregen":.0482, "a_segel":.0394, "a_starkregen2":.0724, "a_tropfen3":.0474, "a_uhr":.0428, "a_wasserfall2":.0588, "a_wellen3":.0476, "a_zelt2":.0459,
    "a_hof":.0499, "a_hafen":.0499, "a_markt":.0499, "a_tagvoegel":.0498, "a_rinnsal":.0496, "a_strom":.0485, "a_wildwasser":.0495, "a_brandung":.05, "a_klippen":.05, "a_regen3":.0499, "a_regen4":.0499, "a_schneesturm":.05, "a_wind3":.0444, "a_orkan":.05, "a_huehner":.05, "a_kuehe":.0491, "a_schafe":.0497, "a_schnurren":.0499, "a_schneeschritte":.0457, "a_kiesweg":.0255, "l_windspiel":.0274, "l_wal":.1221};
  const ambReihe = (p, n) => Array.from({ length: n }, (_, i) => p + (i + 1));
  /* Ereignisse aus Aufnahmen: f = Dateien, tempo = Abspieltempo, folge = [min, max Anzahl, Abstand min, max] */
  const AMB_EV = {
    heulen: { f: ambReihe("e_heulen_", 1), tempo: [.5, .62] }, glocke: { f: ambReihe("e_glocke_", 4), tempo: [.8, 1] }, gong: { f: ambReihe("e_gong_", 2), tempo: [.85, 1] },
    kette: { f: ambReihe("e_kette_", 4) }, stein: { f: ambReihe("e_stein_", 6) }, platsch: { f: ambReihe("e_platsch_", 4) }, blubb: { f: ambReihe("e_blubb_", 4) },
    insekt: { f: ambReihe("e_insekt_", 4) }, buch: { f: ambReihe("e_buch_", 6) }, papier: { f: ambReihe("e_papier_", 3) },
    hammer: { f: ambReihe("e_hammer_", 6).concat(["amboss"]), folge: [3, 7, .55, .75] }, metall: { f: ambReihe("e_metall_", 3) },
    stoehnen: { f: ambReihe("e_stoehnen_", 4), tempo: [.75, .95] }, schleim: { f: ambReihe("e_schleim_", 3) }, monster: { f: ambReihe("e_monster_", 3), tempo: [.6, .8] },
    blasebalg: { f: ambReihe("e_blasebalg_", 2) }, ast: { f: ambReihe("e_ast_", 4) }, kies: { f: ambReihe("e_kies_", 2), folge: [3, 6, .5, .6] },
    laubschritt: { f: ambReihe("e_laubschritt_", 2), folge: [3, 6, .5, .62] }, riegel: { f: ambReihe("e_riegel_", 4) }, hund: { f: ambReihe("e_hund_", 2).concat(ambReihe("e_bellen_", 5)) },
    tuch: { f: ambReihe("e_tuch_", 3) }, zischen: { f: ambReihe("e_zischen_", 2) },
    frosch: { f: ambReihe("e_frosch_", 8), tempo: [.82, 1.12], folge: [1, 3, .45, .9] },
    eule: { f: ambReihe("e_eule_", 2), tempo: [.88, 1.05] }, moewe: { f: ambReihe("e_moewe_", 10) }, specht: { f: ambReihe("e_specht_", 4) },
    vogel: { f: ambReihe("e_vogel_", 10), tempo: [.92, 1.08] }, kraehe: { f: ambReihe("e_kraehe_", 7) }, wolf: { f: ambReihe("e_wolf_", 4), tempo: [.9, 1.03] },
    wal: { f: ambReihe("e_wal_", 3), tempo: [.8, 1] }, pferd: { f: ["e_pferd_1"], tempo: [.9, 1.06] }, katze: { f: ambReihe("e_katze_", 4) }, ruder: { f: ambReihe("e_ruder_", 3) },
    donner: { f: ["fx_fo2_sfx100v2_thunder_01"].concat(ambReihe("e_donner_", 4)), tempo: [.8, 1.05] },
    chor: { f: ["stimme_57", "stimme_60", "stimme_63"], tempo: [.66, .9], lang: 1 },
    klangschale: { f: ["a_klangschale"], tempo: [.98, 1.02] },
    kuh: { f: ambReihe("e_kuh_", 7), tempo: [.9, 1.05] }, huhn: { f: ambReihe("e_huhn_", 4), tempo: [.92, 1.08], folge: [1, 3, .5, 1.1] }, schaf: { f: ambReihe("e_schaf_", 2), tempo: [.88, 1.1] },
    schwein: { f: ambReihe("e_schwein_", 3), tempo: [.9, 1.08] }, ross: { f: ambReihe("e_ross_", 6).concat(["e_pferd_1"]), tempo: [.92, 1.06] }, hufe: { f: ambReihe("e_hufe_", 6) },
    schnee: { f: ambReihe("e_schnee_", 8).concat(ambReihe("g_schnee_", 4)), folge: [3, 7, .55, .7] }, tor: { f: ambReihe("e_tor_", 4), tempo: [.85, 1] }, rumpf: { f: ambReihe("e_rumpf_", 2), tempo: [.8, 1] },
    axt: { f: ambReihe("e_axt_", 8), folge: [2, 5, 1.1, 1.6] }, baumfall: { f: ambReihe("e_baumfall_", 4), tempo: [.85, 1] }, hacke: { f: ambReihe("e_hacke_", 8), folge: [2, 5, .9, 1.4] }, erz: { f: ambReihe("e_erz_", 6), folge: [1, 3, 1, 1.5] },
    zimmern: { f: ambReihe("e_zimmern_", 6), folge: [3, 7, .45, .7] }, windstoss: { f: ["e_windstoss_1"], tempo: [.8, 1.1] }, grollen: { f: ambReihe("e_grollen_", 2), tempo: [.8, 1] },
    galopp: { f: ["g_galopp_1"], tempo: [.92, 1.05] }, steinschlag: { f: ambReihe("g_steinschlag_", 4), tempo: [.85, 1] }, untot: { f: ambReihe("g_untot_", 8), tempo: [.8, .95] },
    schatten: { f: ambReihe("g_schatten_", 5), tempo: [.8, 1] }, troll: { f: ambReihe("g_troll_", 10), tempo: [.75, .9] }, schluessel: { f: ambReihe("g_schluessel_", 5) }, schloss: { f: ambReihe("g_schloss_", 7) },
    nass: { f: ambReihe("g_nass_", 3), folge: [3, 6, .5, .65] }, gras: { f: ambReihe("g_gras_", 5), folge: [3, 7, .5, .62] }, holzbruch: { f: ambReihe("g_holzbruch_", 7), tempo: [.85, 1] }, glasbruch: { f: ambReihe("g_glasbruch_", 4) },
    edelstein: { f: ambReihe("g_edelstein_", 3) }, leder: { f: ambReihe("g_leder_", 6) }, kettenhemd: { f: ambReihe("g_kettenhemd_", 5) }, zauber: { f: ambReihe("g_zauber_", 4), tempo: [.8, 1] },
    steinschritte: { f: ambReihe("g_stein_", 5), folge: [3, 6, .5, .62] },
    uebung: { f: ambReihe("g_metallhieb_", 7).concat(ambReihe("g_schild_", 5)), folge: [2, 5, .45, .9] }
  };
  /* über kulFx (echte Aufnahmen aus ECHT bzw. gerechnet): Art in der Kulisse → Art in kulFx */
  const KUL_FX = { krug: "krug", stuhl: "stuhl", knarren: "knarren", schritte: "schritte", holzschritte: "schritte", muenzen: "muenzen", tuer: "tuer",
    lachen: "lachen", fledermaus: "fledermaus" };
  /* Klangwelten: betten [Quelle, Stärke, { tief }], ev [Art, [min, max] Sekunden, Stärke, Anteil „aus der Ferne“], raum = Hallanteil */
  const KUL_WELT = {
    taverne: { raum: .3, betten: [["a_feuer1", .55], ["a_gaeste", .8, { tief: 3800 }], ["a_feuer3", .3], ["a_schnurren", .12, { tief: 1200 }], ["a_wind3", .08, { tief: 500 }], ["a_lagerfeuer", .2]],
      ev: [["krug", [2.5, 8], .55, .2], ["stuhl", [8, 20], .4, .3], ["knarren", [10, 25], .35, .3], ["holzschritte", [9, 22], .35, .4], ["muenzen", [20, 45], .35, .4], ["tuer", [45, 100], .3, .5], ["katze", [50, 120], .28, .1], ["hund", [70, 160], .25, 1], ["leder", [30, 70], .25, .4], ["kettenhemd", [60, 140], .25, .5], ["ross", [90, 200], .25, 1], ["glasbruch", [150, 320], .2, .6]] },
    feuer: { raum: .35, betten: [["a_feuer2", 1], ["a_grillen", .45], ["a_nacht", .35], ["a_wind1", .15, { tief: 900 }], ["a_lagerfeuer", .45], ["a_grillen2", .22], ["a_wind3", .12, { tief: 700 }], ["a_rinnsal", .1, { tief: 1600 }]],
      ev: [["eule", [25, 60], .4, .6], ["heulen", [70, 160], .3, 1], ["wolf", [90, 200], .3, 1], ["ast", [15, 35], .35, .5], ["laubschritt", [40, 90], .3, .8], ["ross", [70, 160], .25, .6], ["leder", [40, 90], .22, .3], ["grollen", [150, 300], .2, 1], ["gras", [60, 130], .25, .8]] },
    wald: { raum: .3, betten: [["a_voegel1", .8], ["a_voegel2", .55], ["a_laub", .3], ["a_bach1", .25], ["a_wind1", .14, { tief: 1400 }], ["a_baumwind", .3], ["a_bienen", .08, { tief: 3000 }], ["a_tagvoegel", .45], ["a_rinnsal", .2]],
      ev: [["specht", [25, 60], .35, .6], ["vogel", [6, 16], .35, .5], ["kraehe", [40, 100], .25, .8], ["ast", [20, 45], .3, .6], ["laubschritt", [35, 80], .3, .7], ["axt", [60, 150], .25, 1], ["baumfall", [200, 400], .2, 1], ["gras", [40, 90], .3, .6], ["ross", [120, 240], .2, 1]] },
    waldnacht: { raum: .4, betten: [["a_nacht", .9], ["a_grillen", .55], ["a_wind2", .22, { tief: 1200 }], ["a_baumwind", .25, { tief: 1600 }], ["a_grillen2", .3], ["a_wind3", .15, { tief: 900 }], ["a_rinnsal", .12, { tief: 1500 }]],
      ev: [["eule", [15, 40], .45, .5], ["heulen", [45, 110], .35, 1], ["wolf", [60, 150], .3, 1], ["ast", [12, 30], .35, .6], ["fledermaus", [30, 70], .25, .5], ["grollen", [120, 260], .2, 1], ["troll", [150, 300], .16, 1], ["gras", [50, 110], .25, .8]] },
    regen: { raum: .3, betten: [["a_waldregen", 1], ["a_regen1", .45], ["a_wind1", .2, { tief: 1000 }], ["a_laubregen", .5], ["a_leichtregen", .3], ["a_regen3", .45], ["a_regen4", .3], ["a_rinnsal", .2]],
      ev: [["donner", [50, 130], .35, 1], ["platsch", [14, 35], .25, .5], ["pferd", [70, 160], .3, .8], ["kraehe", [60, 140], .2, 1], ["grollen", [40, 100], .35, 1], ["nass", [40, 90], .3, .6], ["windstoss", [30, 80], .3, .5]] },
    zelt: { raum: .15, betten: [["a_zelt", 1], ["a_regen2", .3, { tief: 1800 }], ["a_wind1", .2, { tief: 700 }], ["a_zelt2", .55], ["a_heulwind", .12, { tief: 600 }], ["a_regen4", .25, { tief: 1400 }]],
      ev: [["donner", [60, 150], .3, 1], ["tuch", [25, 60], .25, .2], ["grollen", [50, 120], .3, 1], ["windstoss", [25, 60], .3, .3], ["leder", [30, 70], .2, .2], ["ross", [80, 180], .2, .8]] },
    sturm: { raum: .45, betten: [["a_gewitter1", 1], ["a_gewitter2", .5], ["a_starkregen", .45], ["a_wind2", .4], ["a_starkregen2", .4], ["a_heulwind", .35], ["a_orkan", .4], ["a_regen3", .35]],
      ev: [["donner", [14, 40], .55, .5], ["donner", [25, 70], .4, 1], ["grollen", [15, 40], .45, .8], ["windstoss", [8, 20], .4, .4], ["holzbruch", [60, 150], .3, .8]] },
    hoehle: { raum: .9, betten: [["a_tropfen1", 1], ["a_tropfen2", .45], ["a_wind1", .22, { tief: 380 }], ["a_tropfen3", .45, { schleife: true }], ["a_heulwind", .12, { tief: 400 }], ["a_rinnsal", .2, { tief: 900 }], ["a_wind3", .1, { tief: 300 }]],
      ev: [["stein", [20, 50], .35, .6], ["platsch", [12, 30], .25, .6], ["fledermaus", [30, 80], .2, .5], ["steinschlag", [40, 100], .3, .8], ["hacke", [90, 200], .2, 1], ["nass", [60, 140], .2, .8]] },
    unterreich: { raum: .9, betten: [["a_tropfen1", .7], ["a_unterwasser", .35, { tief: 500 }], ["a_bach2", .18, { tief: 600 }], ["a_tropfen3", .3, { schleife: true }], ["a_heulwind", .14, { tief: 300 }], ["a_wildwasser", .1, { tief: 400 }], ["a_wind3", .12, { tief: 250 }]],
      ev: [["monster", [30, 75], .3, 1], ["schleim", [20, 50], .3, .6], ["stein", [25, 60], .3, .7], ["stoehnen", [60, 140], .2, 1], ["kette", [70, 150], .2, 1], ["schatten", [40, 100], .25, .8], ["troll", [70, 160], .25, 1], ["hacke", [50, 120], .22, 1], ["steinschlag", [40, 90], .25, .9], ["erz", [90, 200], .2, 1]] },
    kerker: { raum: .7, betten: [["a_tropfen2", .6], ["a_wind1", .25, { tief: 450 }], ["a_tropfen1", .75], ["a_heulwind", .14, { tief: 500 }], ["a_wind3", .12, { tief: 350 }], ["a_regen4", .08, { tief: 500 }]],
      ev: [["kette", [10, 25], .4, .5], ["stoehnen", [25, 60], .3, .8], ["riegel", [35, 80], .35, .6], ["kies", [30, 70], .3, .7], ["tuer", [70, 150], .25, .8], ["hund", [80, 180], .22, 1], ["schluessel", [40, 90], .3, .6], ["schloss", [60, 130], .3, .7], ["nass", [60, 120], .25, .8], ["tor", [100, 220], .25, 1]] },
    meer: { raum: .3, betten: [["a_wellen1", 1], ["a_wellen2", .55], ["a_wind2", .3], ["a_wellen3", .55], ["a_brandung", .55], ["a_klippen", .35], ["a_wind3", .18]],
      ev: [["moewe", [8, 22], .4, .5], ["glocke", [60, 140], .2, 1], ["windstoss", [30, 80], .3, .4], ["ruder", [90, 200], .25, .9], ["rumpf", [100, 220], .2, 1]] },
    schiff: { raum: .25, betten: [["a_boot", 1], ["a_wellen2", .7], ["a_wind1", .4], ["a_segel", .55], ["a_brandung", .25], ["a_wind3", .2]],
      ev: [["knarren", [8, 20], .4, .3], ["moewe", [15, 40], .3, .6], ["tuch", [10, 25], .35, .3], ["glocke", [50, 120], .25, .6], ["holzschritte", [25, 60], .3, .5], ["rumpf", [12, 30], .35, .3], ["kette", [60, 140], .25, .5], ["windstoss", [25, 60], .3, .3], ["leder", [40, 90], .2, .4]] },
    wasserfall: { raum: .35, betten: [["a_wasserfall", .9], ["a_bach2", .55], ["a_voegel2", .28], ["a_wasserfall2", .4], ["a_fluss", .35], ["a_wildwasser", .3], ["a_strom", .35], ["a_tagvoegel", .25]],
      ev: [["vogel", [10, 25], .3, .6], ["platsch", [20, 45], .25, .5], ["specht", [40, 100], .2, .8], ["frosch", [25, 60], .25, .8], ["ruder", [60, 150], .3, .6], ["nass", [50, 120], .25, .6], ["steinschlag", [120, 260], .15, 1]] },
    schmiede: { raum: .25, betten: [["a_feuer1", .75], ["a_feuer3", .35], ["a_lagerfeuer", .3], ["a_wind3", .08, { tief: 500 }], ["a_markt", .12, { tief: 1500 }], ["a_hof", .08, { tief: 1200 }]],
      ev: [["hammer", [6, 14], .55, .1], ["blasebalg", [12, 28], .35, .2], ["zischen", [20, 45], .3, .2], ["metall", [15, 35], .3, .3], ["zimmern", [40, 90], .25, .7], ["kettenhemd", [40, 90], .25, .4], ["ross", [90, 200], .25, .9], ["hufe", [80, 180], .25, .8]] },
    labor: { raum: .25, betten: [["a_kochen", .7], ["a_blubbern", .45], ["a_feuer3", .35], ["a_kochen2", .35], ["a_wind3", .08, { tief: 600 }], ["a_rinnsal", .1, { tief: 2500 }]],
      ev: [["krug", [8, 20], .35, .2], ["blubb", [5, 14], .35, .3], ["buch", [20, 45], .3, .3], ["zischen", [25, 60], .25, .3], ["glasbruch", [120, 260], .2, .5], ["zauber", [50, 120], .2, .4], ["edelstein", [40, 90], .22, .3], ["papier", [25, 60], .25, .3]] },
    bibliothek: { raum: .5, betten: [["a_feuer3", .7], ["a_wind2", .25, { tief: 600 }], ["a_uhr", .18, { takt: 2.0005 }], ["a_fensterregen", .14, { tief: 2500 }], ["a_schnurren", .1, { tief: 1000 }], ["a_regen4", .1, { tief: 1200 }]],
      ev: [["buch", [8, 20], .35, .3], ["papier", [12, 30], .3, .3], ["knarren", [25, 60], .25, .6], ["holzschritte", [30, 70], .25, .7], ["katze", [50, 120], .28, .2], ["schluessel", [90, 200], .2, .6], ["leder", [40, 90], .2, .4], ["grollen", [150, 300], .15, 1]] },
    tempel: { raum: .9, betten: [["a_wind1", .35, { tief: 500 }], ["a_wind2", .2, { tief: 300 }], ["a_feuer3", .3, { tief: 2000 }], ["a_gesang", .2, { tief: 3000 }], ["a_halle", .22, { tief: 1800 }], ["l_windspiel", .15, { tief: 3500 }], ["a_rinnsal", .1, { tief: 1500 }]],
      ev: [["klangschale", [25, 50], .04, 0], ["chor", [14, 34], .3, .7], ["glocke", [20, 50], .4, .5], ["gong", [50, 120], .35, .5], ["steinschritte", [30, 70], .22, .7], ["tor", [120, 260], .22, 1]] },
    sumpf: { raum: .35, betten: [["a_blubbern", .4], ["a_grillen", .4], ["a_nacht", .4], ["a_tropfen2", .3], ["a_dschungel", .22], ["a_rinnsal", .2], ["a_wind3", .1, { tief: 600 }]],
      ev: [["frosch", [3, 9], .45, .5], ["insekt", [6, 16], .3, .4], ["platsch", [15, 35], .3, .6], ["blubb", [8, 20], .3, .5], ["eule", [50, 120], .25, 1], ["kraehe", [40, 100], .22, .9], ["troll", [90, 200], .2, 1], ["nass", [40, 90], .25, .7]] },
    unterwasser: { raum: .6, betten: [["a_unterwasser", 1], ["a_blubbern", .3, { tief: 1500 }], ["a_wildwasser", .12, { tief: 300 }], ["l_wal", .12, { tief: 1500 }], ["a_wellen1", .15, { tief: 300 }]],
      ev: [["blubb", [5, 14], .3, .5], ["wal", [35, 90], .3, .8], ["monster", [70, 160], .15, 1], ["rumpf", [90, 200], .2, 1], ["kette", [120, 260], .15, 1]] },
    dorf: { raum: .35, betten: [["a_hof", .8], ["a_tagvoegel", .45], ["a_huehner", .3], ["a_kuehe", .22], ["a_schafe", .15], ["a_wind3", .12, { tief: 1200 }], ["a_bienen", .06, { tief: 3000 }]],
      ev: [["huhn", [8, 20], .35, .4], ["kuh", [20, 50], .35, .7], ["schaf", [25, 60], .3, .7], ["schwein", [40, 90], .3, .5], ["ross", [40, 100], .3, .6], ["hund", [50, 120], .25, .8], ["axt", [40, 90], .3, .8], ["zimmern", [50, 120], .25, .9], ["glocke", [120, 260], .2, 1]] },
    markt: { raum: .35, betten: [["a_markt", 1], ["a_gaeste", .3, { tief: 2500 }], ["a_tagvoegel", .15], ["a_huehner", .1, { tief: 2500 }], ["a_wind3", .08, { tief: 1000 }], ["a_hof", .12, { tief: 2000 }], ["a_rinnsal", .08, { tief: 2500 }]],
      ev: [["muenzen", [8, 20], .35, .3], ["hufe", [25, 60], .3, .5], ["ross", [40, 90], .25, .7], ["huhn", [30, 70], .25, .6], ["hund", [50, 120], .22, .8], ["krug", [20, 45], .3, .4], ["zimmern", [40, 90], .25, 1], ["hammer", [60, 140], .22, 1], ["glocke", [90, 200], .2, 1]] },
    hafen: { raum: .4, betten: [["a_hafen", 1], ["a_wellen3", .4], ["a_boot", .3], ["a_wind2", .2], ["a_segel", .2], ["a_brandung", .2, { tief: 1500 }], ["a_markt", .1, { tief: 2000 }]],
      ev: [["moewe", [8, 20], .35, .5], ["glocke", [50, 120], .25, .7], ["knarren", [12, 30], .3, .4], ["kette", [30, 70], .3, .5], ["rumpf", [25, 60], .3, .5], ["ruder", [40, 90], .3, .6], ["zimmern", [50, 110], .22, 1], ["muenzen", [60, 140], .22, .5]] },
    gebirge: { raum: .6, betten: [["a_schneesturm", .7], ["a_wind3", .5], ["a_heulwind", .3], ["a_schneeschritte", .18, { tief: 3000 }], ["a_wind2", .2, { tief: 900 }], ["a_orkan", .2, { tief: 1500 }]],
      ev: [["windstoss", [15, 40], .35, .4], ["schnee", [30, 70], .3, .5], ["wolf", [70, 160], .3, 1], ["kraehe", [60, 140], .22, 1], ["steinschlag", [50, 120], .3, 1], ["heulen", [90, 200], .28, 1], ["kettenhemd", [40, 90], .2, .3]] },
    mine: { raum: .8, betten: [["a_tropfen2", .5], ["a_wind1", .25, { tief: 400 }], ["a_feuer3", .3, { tief: 1500 }], ["a_rinnsal", .15, { tief: 900 }], ["a_tropfen1", .6], ["a_wind3", .1, { tief: 250 }], ["a_gaeste", .05, { tief: 600 }]],
      ev: [["hacke", [5, 14], .4, .6], ["erz", [12, 30], .35, .6], ["hammer", [30, 70], .3, .8], ["kette", [30, 70], .3, .6], ["steinschlag", [40, 90], .3, .8], ["blasebalg", [50, 120], .22, 1], ["zischen", [60, 140], .2, 1], ["kies", [40, 90], .25, .6]] },
    strasse: { raum: .3, betten: [["a_tagvoegel", .6], ["a_kiesweg", .25], ["a_wind1", .3, { tief: 2000 }], ["a_baumwind", .25], ["a_bienen", .06, { tief: 3000 }], ["a_rinnsal", .1, { tief: 2000 }]],
      ev: [["hufe", [10, 25], .35, .2], ["ross", [30, 70], .3, .3], ["leder", [20, 45], .25, .2], ["kettenhemd", [30, 70], .25, .2], ["vogel", [10, 25], .3, .6], ["kraehe", [50, 120], .22, .9], ["knarren", [25, 60], .25, .3], ["galopp", [120, 260], .25, 1]] },
    burg: { raum: .6, betten: [["a_wind3", .3], ["a_tagvoegel", .2], ["a_feuer3", .2], ["a_markt", .1, { tief: 1200 }], ["a_huehner", .06, { tief: 2000 }], ["a_hof", .1, { tief: 1600 }]],
      ev: [["uebung", [12, 30], .3, .6], ["kettenhemd", [15, 35], .3, .4], ["hufe", [30, 70], .3, .5], ["ross", [40, 100], .25, .7], ["tor", [60, 140], .3, .7], ["hammer", [40, 90], .22, 1], ["glocke", [90, 200], .25, 1], ["hund", [70, 160], .22, .8], ["schluessel", [60, 140], .25, .4]] },
    ufer: { raum: .35, betten: [["a_strom", .8], ["a_rinnsal", .4], ["a_tagvoegel", .4], ["a_fluss", .3], ["a_wind1", .15, { tief: 1800 }], ["a_bienen", .05, { tief: 3000 }]],
      ev: [["frosch", [10, 25], .35, .6], ["platsch", [15, 35], .3, .5], ["ruder", [40, 90], .3, .6], ["vogel", [8, 20], .3, .6], ["specht", [40, 100], .22, .8], ["nass", [50, 110], .25, .5], ["insekt", [20, 45], .2, .4], ["moewe", [100, 220], .18, 1]] }
  };
  /* Gesamtpegel der Klangwelten im Pult, abgestimmt auf die bisherigen Kulissen */
  const WELT_GRUND = 2.6;
  /* leise Klangwelten etwas anheben, damit alle Kulissen ähnlich präsent sind */
  const WELT_PEGEL = { taverne: 0.98, feuer: 1.39, wald: 0.91, waldnacht: 0.99, regen: 1.16, zelt: 1.55, sturm: 0.92, hoehle: 1.95, unterreich: 1.97, kerker: 2.58, meer: 1.07, schiff: 1.16, wasserfall: 0.9, schmiede: 1.57, labor: 0.99, bibliothek: 2.33, tempel: 2.27, sumpf: 1.35, unterwasser: 0.99, dorf: 1.05, markt: 1, hafen: 0.93, gebirge: 1.15, mine: 2.66, strasse: 1.49, burg: 2.82, ufer: 1.03 };
  const ambBasis = (() => { const sk = document.querySelector('script[src*="lautenwerk"]'); return sk ? sk.src.replace(/lautenwerk\.js.*$/, "amb/") : "amb/"; })();
  const ambBuf = new Map(), ambLaedt = new Map();
  function ambLaden(name) {
    if (name === "amboss" || name.startsWith("fx_") || name.startsWith("stimme_")) return sampleLaden(name);
    if (ambBuf.has(name)) return Promise.resolve(ambBuf.get(name));
    if (ambLaedt.has(name)) return ambLaedt.get(name);
    if (!ctx) return Promise.resolve(null);
    const c = ctx;
    const pr = fetch(ambBasis + encodeURIComponent(name) + ".mp3").then(r => r.ok ? r.arrayBuffer() : Promise.reject(r.status))
      .then(ab => new Promise((res, rej) => { const x = c.decodeAudioData(ab, res, rej); if (x && x.catch) x.catch(rej); }))
      .then(b => { ambBuf.set(name, b); return b; }).catch(() => { ambLaedt.delete(name); return null; });
    ambLaedt.set(name, pr); return pr;
  }
  const ambPuffer = n => n === "amboss" || n.startsWith("fx_") || n.startsWith("stimme_") ? sampleBuf.get(n) : ambBuf.get(n);
  const LIN_EIN = new Float32Array(64), LIN_AUS = new Float32Array(64);
  for (let i = 0; i < 64; i++) { LIN_EIN[i] = i / 63; LIN_AUS[i] = 1 - i / 63; }
  const KUL_EIN = new Float32Array(64), KUL_AUS = new Float32Array(64);
  for (let i = 0; i < 64; i++) { KUL_EIN[i] = Math.sin(i / 63 * Math.PI / 2); KUL_AUS[i] = Math.cos(i / 63 * Math.PI / 2); }
  function weltBett(k, [name, staerke, o]) {
    o = o || {};
    const out = ctx.createGain(); out.gain.value = 0;
    if (o.tief) { const lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = o.tief; out.connect(lp); lp.connect(k.g); } else out.connect(k.g);
    const b = { out, o, naechst: 0, drift: 0, buf: null, pos: null };
    if (name === "@gemurmel") { /* gerechnetes Stimmengewirr der Taverne */
      kulSchleife("gemurmel", 22050, 1.1 * staerke * (k.wlaut || 1)); return b;
    }
    b.grund = WELT_GRUND * (k.wlaut || 1) * staerke * Math.min(1.15, .055 / (AMB_LAUT[name] || .05));
    ambLaden(name).then(buf => {
      if (!buf || kul !== k) return;
      b.buf = buf; b.naechst = ctx.currentTime + .05;
      out.gain.setValueAtTime(0, ctx.currentTime); out.gain.linearRampToValueAtTime(b.grund, ctx.currentTime + 3);
      /* Aufnahmen mit unregelmäßigem Rhythmus (Pfützen-Tropfen): als ganze, nahtlose Endlosschleife – zerschnitten würden sie stolpern */
      if (o.schleife) { const q = ctx.createBufferSource(); q.buffer = buf; q.loop = true; q.connect(out); q.start(ctx.currentTime + .05, Math.random() * buf.duration); k.knoten.push(q); }
      weltBettPlanen(k, b);
    });
    return b;
  }
  /* immer neue, zufällige Ausschnitte mit weichen Überblendungen */
  function weltBettPlanen(k, b) {
    if (!b.buf) return;
    const D = b.buf.duration;
    while (!b.o.schleife && b.naechst < ctx.currentTime + 6) {
      /* len und X in echter Zeit; der Ausschnitt muss samt Tempo-Abweichung vollständig in der Datei liegen und darf erst
         nach dem Ende der Ausblendung aufhören – sonst wird er hörbar abgeschnitten. Kurze Aufnahmen: lange Überblendung. */
      const rate = b.o.takt ? 1 : zz(.985, 1.015), kurz = D < 15;
      const len = Math.min((D - .3 - (b.o.takt || 0)) / rate * (kurz ? .92 : .8), zz(9, 22)), X = kurz ? len * .45 : Math.min(3, len * .3);
      const inhalt = len * rate, t = b.naechst;
      /* rhythmische Aufnahmen (Standuhr): neuer Ausschnitt liegt genau im Takt des vorigen, Tempo fest, lineare Überblendung –
         so fallen die Ticks beim Überblenden übereinander, statt zu stolpern */
      let off;
      if (b.o.takt) {
        const hi = Math.max(0, D - inhalt - .2), P = b.o.takt;
        if (b.pos != null) { const ks = []; for (let o = ((b.pos % P) + P) % P; o <= hi; o += P) ks.push(o); off = ks.length ? ks[Math.floor(Math.random() * ks.length)] : Math.random() * hi; }
        else off = Math.random() * hi;
        b.pos = off + (len - X) * rate;
      } else off = Math.random() * Math.max(0, D - inhalt - .2);
      const q = ctx.createBufferSource(), g = ctx.createGain(); q.buffer = b.buf; q.playbackRate.value = rate;
      g.gain.value = 0; g.gain.setValueCurveAtTime(b.o.takt ? LIN_EIN : KUL_EIN, t, X); g.gain.setValueCurveAtTime(b.o.takt ? LIN_AUS : KUL_AUS, t + len - X, X);
      q.connect(g); g.connect(b.out); q.start(t, off); q.stop(t + len + .05);
      k.knoten.push(q); q.onended = () => { const i = k.knoten.indexOf(q); if (i >= 0) k.knoten.splice(i, 1); };
      b.naechst = t + len - X;
    }
    /* langsames Atmen der Lautstärke */
    if (ctx.currentTime > b.drift) { b.drift = ctx.currentTime + zz(8, 20); b.out.gain.setTargetAtTime(b.grund * zz(.78, 1.15), ctx.currentTime, zz(2, 5)); }
  }
  function weltEreignis(k, [art, , staerke, fern]) {
    const weit = Math.random() < (fern || 0), laut = staerke * (k.wlaut || 1) * (weit ? zz(.3, .55) : zz(.65, 1));
    if (KUL_FX[art]) { kulFx(KUL_FX[art], ctx.currentTime + .05, laut * 1.3, weit ? { tief: zz(900, 2600) } : {}); return; }
    const e = AMB_EV[art]; if (!e) return;
    const g = ctx.createGain(); g.gain.value = laut * WELT_GRUND; let letzter = g;
    if (weit) { const lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = zz(900, 2600); letzter.connect(lp); letzter = lp; }
    if (ctx.createStereoPanner && !leicht()) { const pn = ctx.createStereoPanner(); pn.pan.value = zz(-.8, .8); letzter.connect(pn); letzter = pn; }
    letzter.connect(k.g);
    if (weit && k.send) { const sg = ctx.createGain(); sg.gain.value = 1.5; letzter.connect(sg); sg.connect(k.send); }
    const n = e.folge ? Math.round(zz(e.folge[0], e.folge[1])) : 1;
    let t = ctx.currentTime + .05;
    for (let i = 0; i < n; i++) {
      const name = zufall(e.f), b = ambPuffer(name);
      if (!b) { ambLaden(name); continue; }
      const q = ctx.createBufferSource(), r = e.tempo ? zz(e.tempo[0], e.tempo[1]) : zz(.95, 1.05); q.buffer = b; q.playbackRate.value = r;
      if (e.lang) { const gg = ctx.createGain(), d = b.duration / r; gg.gain.setValueAtTime(0, t); gg.gain.linearRampToValueAtTime(1, t + d * .35); gg.gain.linearRampToValueAtTime(0, t + d); q.connect(gg); gg.connect(g); }
      else if (e.folge) { const gg = ctx.createGain(); gg.gain.value = zz(.7, 1); q.connect(gg); gg.connect(g); }
      else q.connect(g);
      q.start(t, b._start || 0);
      if (e.folge) t += zz(e.folge[2], e.folge[3]);
    }
  }
  function weltStart(k, w) {
    k.phase = 1; k.wlaut = WELT_PEGEL[k.art] || 1;
    const betten = w.betten.slice(0, spar ? 2 : 9).map(x => weltBett(k, x));
    /* Einzelgeräusche schon vorladen, damit das erste gleich zu hören ist */
    w.ev.forEach(([art]) => { if (AMB_EV[art]) AMB_EV[art].f.forEach(ambLaden); else if (KUL_FX[art] && ECHT[KUL_FX[art]]) echtVorladen(); });
    k.timer = setInterval(() => {
      if (kul !== k) return;
      const jetzt = ctx.currentTime;
      betten.forEach(b => weltBettPlanen(k, b));
      w.ev.forEach((x, i) => {
        if (k.naechst[i] == null) { k.naechst[i] = jetzt + zz(x[1][0] * .3, x[1][1] * .6); return; }
        if (jetzt >= k.naechst[i]) { k.naechst[i] = jetzt + zz(x[1][0], x[1][1]); try { weltEreignis(k, x); } catch (_) {} }
      });
    }, 250);
  }
  /* sofort = vom Nutzer selbst angetippt: diese Kulisse bleibt, bis man sie selbst ändert – auch über Musik-Stopp und Stimmungswechsel hinweg.
     Ohne sofort kommt sie von der Stimmung und geht mit der Musik. */
  function kulisseStart(sofort) {
    if (!ctx) return;
    /* läuft genau diese Kulisse schon, nicht neu starten (sonst kurzes Aus- und Einblenden) */
    if (kul && kul.art === S.kulisse && S.kulisse !== "keine") { if (sofort) kul.allein = true; return; }
    kulisseStop();
    const art = S.kulisse;
    if (art === "keine" || (!laeuft && !sofort)) return;
    musikWieder();
    const g = ctx.createGain(), j = ctx.currentTime;
    g.gain.setValueAtTime(0, j); g.gain.linearRampToValueAtTime(kulPegel(), j + 2.5);
    /* eigener Weg an der Musik-Dämpfung vorbei: Anhalten, Wechsel-Übergänge und Effekte dämpfen nur die Musik, nicht die Kulisse */
    if (!kulBus) { kulBus = ctx.createGain(); kulBus.gain.value = .38; kulBus.connect(kompRef || master); }
    g.connect(kulBus);
    const send = ctx.createGain(); send.gain.value = art === "hoehle" ? .9 : .3; g.connect(send); send.connect(hallEin);
    kul = { art, g, send, knoten: [], naechst: {}, schichten: [], phase: 1, phaseNaechst: 0, allein: !!sofort };
    kulMerk = null;
    if (KUL_WELT[art]) { send.gain.value = KUL_WELT[art].raum; weltStart(kul, KUL_WELT[art]); try { miniAnzeigen(); } catch (_) {} return; }
    const rest = KUL_SCHICHT[art] ? KUL_REST[art] || {} : {};
    (KUL_BETT[art] || []).filter((_, i) => !rest.betten || rest.betten.includes(i)).slice(0, spar ? 2 : 9).forEach(([f, l, lfo, opt]) => kul.knoten.push(...kulBett(g, f, l, lfo, opt)));
    const sk = rest.schleife == null ? 1 : rest.schleife;
    if (art === "taverne" && sk) kulSchleife("gemurmel", 22050, 1.1 * sk);
    if (art === "feuer" && sk) kulSchleife("feuer", 32000, .7 * sk);
    kulAufnahmen(kul);
    const ev = (KUL_EREIGNIS[art] || []).filter((_, i) => !(rest.ohne || []).includes(i));
    kul.timer = setInterval(() => {
      if (!kul) return;
      const jetzt = ctx.currentTime;
      /* langsame Stärke-Phasen und Schwankungen jeder Schicht – nichts klingt zweimal gleich */
      if (jetzt > kul.phaseNaechst) { const [a, b] = KUL_PHASE[art] || [.8, 1.1]; kul.phase = zz(a, b); kul.phaseNaechst = jetzt + zz(12, 35); }
      kul.schichten.forEach(sch => {
        if (jetzt < sch.naechst) return;
        sch.naechst = jetzt + zz(2.5, 8);
        sch.g.gain.setTargetAtTime(sch.laut * kul.phase * zz(sch.schwanken[0], sch.schwanken[1]), jetzt, zz(1, 3.5));
        sch.filt.forEach(([b, f]) => b.frequency.setTargetAtTime(f * zz(1 - sch.wandern, 1 + sch.wandern), jetzt, zz(1.5, 4)));
      });
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
    try { miniAnzeigen(); } catch (_) {}
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
  function fxNachfuellen(art, ziel) {
    const v = fxVorrat[art] = fxVorrat[art] || { liste: [], rechnet: 0 };
    while (v.liste.length + v.rechnet < (ziel || 2)) { v.rechnet++; kwRechnen("effekt", art, 32000).then(b => { v.rechnet--; if (b) v.liste.push(b); }); }
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
      const st = Math.max(zeit, ctx.currentTime + .01);
      q.connect(g); g.connect(ziel); q.start(st);
      return { start: st, dauer: b.duration / (tempo || 1) };
    });
  }
  /* Ereignis der Kulisse: mal links, mal rechts, mal weit weg (dumpfer) */
  function kulFx(art, z, laut, opt) {
    const k = kul; if (!k) return;
    opt = opt || {};
    let ziel = k.g;
    try {
      if (ctx.createStereoPanner && !leicht()) { const pn = ctx.createStereoPanner(); pn.pan.value = opt.pan != null ? opt.pan : zz(-.75, .75); pn.connect(ziel); ziel = pn; }
      if (opt.tief) { const lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = opt.tief; lp.connect(ziel); ziel = lp; }
    } catch (_) {}
    if (ECHT[art]) { echtVorladen(); if (echtSpielen(art, ziel, z, laut * (k.phase || 1) * (KUL_ECHT_PEGEL[art] || 1), opt.tempo || zz(.94, 1.06))) return; }
    if (art === "schritte") return;
    fxAbspielen(art, ziel, z, laut * (k.phase || 1), opt.tempo || zz(.94, 1.06));
  }
  const KUL_ECHT_PEGEL = { krug: 1.6, stuhl: 1.4, knarren: 1.6, schritte: 1.3, donner: 1.1 };
  /* Echte Aufnahmen für Effekte und Kulissen-Ereignisse (Kenney und OpenGameArt, alle CC0 – siehe klang/LIZENZ.txt).
     Je Effekt mehrere Varianten; eine Variante = Schichten [Datei, Versatz s, Tempo, Stärke]; s = Anteil des gerechneten Klangs obendrauf. */
  const ECHT = {"drache":{"v":[[["fx_cr2_roar_05",0,0.62,1],["fx_rd_creature_roar_03",0.35,0.7,0.6]],[["fx_cr2_monster_20",0,0.6,1],["fx_cr2_roar_06",0.4,0.68,0.7]],[["fx_rd_creature_roar_02",0,0.6,1],["fx_cr2_roar_04",0.5,0.66,0.7]]],"s":0.5},"schwert":{"v":[[["fx_rp_sword_unsheathe",0,1,1]],[["fx_rp_sword_unsheathe2",0,1,1]],[["fx_rp_sword_unsheathe3",0,1,1]],[["fx_rp_sword_unsheathe4",0,1,1]],[["fx_rp_sword_unsheathe5",0,1,1]]]},"tuer":{"v":[[["fx_ka_dooropen_2",0,0.9,1]],[["fx_ka_dooropen_1",0,0.85,1],["fx_ka_creak2",0.3,0.9,0.6]],[["fx_fo_door_01",0,1,1]],[["fx_rp_door",0,1,1]]]},"donner":{"v":[[["fx_fo2_sfx100v2_thunder_01",0,1,1]],[["fx_fo2_sfx100v2_thunder_01",0,0.85,1]],[["fx_fo2_sfx100v2_thunder_01",0,1.12,1]]],"s":0.45},"schrei":{"v":[[["fx_cr_scream_01",0,1,1]],[["fx_cr_scream_02",0,1,1]],[["fx_cr_scream_01",0,0.9,1]]]},"wuerfel":{"v":[[["fx_ca_dice_shake_1",0,1,0.8],["fx_ca_dice_throw_1",1.3,1,1]],[["fx_ca_dice_shake_2",0,1,0.8],["fx_ca_dice_throw_2",1.2,1,1],["fx_ca_die_throw_3",1.25,1,0.7]],[["fx_ca_dice_shake_3",0,1,0.8],["fx_ca_dice_throw_3",1.3,1,1]]]},"zauber":{"v":[[["fx_rp_spell",0,1,1]],[["fx_rd_spell_01",0,1,1],["fx_rd_spell_02",0.35,1.1,0.7]],[["fx_rp_magic1",0,1,1],["fx_rd_item_gem_04",0.2,1,0.6]]],"s":0.45},"bogen":{"v":[[["fx_ba_bow",0,1,1]],[["fx_ba_bow",0,0.92,1],["fx_ba_swish_3",0.08,1.2,0.5]]]},"pfeil":{"v":[[["fx_ba_swish_2",0,1.3,0.7],["fx_im_impactwood_heavy_000",0.22,1,1]],[["fx_ba_swish_4",0,1.3,0.7],["fx_im_impactwood_heavy_002",0.2,1,1]],[["fx_ba_swish_3",0,1.4,0.6],["fx_mw_wood_hit_03",0.22,1,1]]]},"hieb":{"v":[[["fx_rd_blade_01",0,1,1],["fx_im_impactpunch_heavy_000",0.12,1,0.6]],[["fx_rd_blade_02",0,1,1],["fx_ka_knifeslice",0.05,1,0.6]],[["fx_rd_blade_03",0,1,1],["fx_im_impactpunch_heavy_002",0.12,1,0.6]]]},"verfehlt":{"v":[[["fx_ba_swish_2",0,1,1]],[["fx_ba_swish_3",0,1,1]],[["fx_ba_swish_4",0,1,1]],[["fx_rp_swing",0,1,1],["fx_rp_swing2",0.18,1,0.7]]]},"block":{"v":[[["fx_im_impactmetal_heavy_000",0,1,1],["fx_rp_metal_ringing",0.02,1,0.6]],[["fx_im_impactplate_heavy_001",0,1,1],["fx_rp_metal_ringing",0.02,1.1,0.5]],[["fx_br_bfh1_metal_hit_02",0,1,1],["fx_im_impactmetal_heavy_003",0,1,0.7]]]},"wucht":{"v":[[["fx_im_impactpunch_heavy_001",0,0.8,1],["fx_br_bfh1_hit_02",0,0.85,0.8]],[["fx_hp_hit05",0,1,1]],[["fx_hp_hit08",0,1,1]],[["fx_im_impactpunch_heavy_003",0,0.75,1],["fx_br_bfh1_rock_breaking_02",0.02,1,0.5]]]},"schmerz":{"v":[[["fx_cr_hurt_02",0,1,1]],[["fx_cr_hurt_01",0,1,1]],[["fx_cr2_human_03",0,1,1]],[["fx_cr2_human_05",0,1,1]],[["fx_cr_hurt_05",0,1,1]]]},"sterben":{"v":[[["fx_cr2_die_02",0,0.95,1],["fx_im_impactsoft_heavy_001",0.55,0.9,0.7]],[["fx_cr2_die_03",0,0.95,1],["fx_im_impactsoft_heavy_003",0.6,0.9,0.7]],[["fx_cr2_die_04",0,0.95,1],["fx_im_impactsoft_heavy_000",0.7,0.9,0.7]]]},"feuerball":{"v":[[["fx_rd_spell_fire_03",0,1,1],["fx_fo_explosion",0.9,0.8,0.9]],[["fx_rd_spell_fire_04",0,1,1],["fx_fo_explosion",0.8,0.9,0.8]],[["fx_rd_spell_fire_01",0,1,1],["fx_fo_explosion",0.6,0.75,0.9]]],"s":0.35},"heiltrank":{"v":[[["fx_rp_bottle",0,1,1],["fx_wa_bubble_01",0.45,1,0.7],["fx_rp_bubble2",0.8,1,0.6]],[["fx_rp_bottle",0,0.95,1],["fx_rp_bubble",0.5,1,0.7],["fx_rp_bubble3",0.9,1,0.5]]],"s":0.4},"muenzen":{"v":[[["fx_ka_handlecoins",0,1,1],["fx_rd_item_coins_04",0.25,1,0.9]],[["fx_rd_item_coins_04",0,1,1]],[["fx_rp_coin2",0,1,1],["fx_ka_handlecoins2",0.4,1,0.8]]]},"ruelpser":{"v":[[["fx_rp_burp",0,1,1]],[["fx_cr_burp_01",0,0.9,1]],[["fx_cr_burp_02",0,0.9,1]]]},"schnarchen":{"v":[[["fx_cr2_snore_02",0,1,1],["fx_cr2_snore_02",1.6,0.95,0.9],["fx_cr2_snore_02",3.2,1,0.8]],[["fx_cr_snore",0,0.9,1],["fx_cr_snore",1.3,0.88,0.9],["fx_cr_snore",2.6,0.9,0.8]]]},"boing":{"v":[[["fx_fo_spring_01",0,1,1]],[["fx_fo_spring_02",0,1,1]],[["fx_fo_spring_06",0,1,1]]]},"boom":{"v":[[["fx_fo_explosion",0,0.7,1],["fx_br_bfh1_rock_breaking_01",0.05,0.8,0.6]],[["fx_fo_explosion",0,0.6,1],["fx_br_bfh1_rock_falling_04",0.3,1,0.6]]],"s":0.5},"bonk":{"v":[[["fx_im_impactwood_heavy_001",0,1,1],["fx_mw_wood_hit_05",0,0.9,0.6]],[["fx_mw_wood_hit_08",0,0.9,1],["fx_im_impactplank_medium_002",0,1,0.6]]],"s":0.6},"stuhl":{"v":[[["fx_mw_wood_squeak_01",0,1,1],["fx_ka_footstep04",0.4,1,0.5]],[["fx_mw_wood_squeak_02",0,1,1]],[["fx_fo_wooden_02",0,1,1]],[["fx_mw_wood_slam_02",0,1,0.7]]]},"krug":{"v":[[["fx_fo_glass_02",0,0.85,1]],[["fx_fo_glass_03",0,0.9,1]],[["fx_fo_dishes_01",0,1,0.8]],[["fx_fo_dishes_03",0,1,0.8]],[["fx_fo2_sfx100v2_glass_02",0,0.9,1]],[["fx_fo_pot_01",0,0.9,0.7]]]},"knarren":{"v":[[["fx_ka_creak1",0,1,1]],[["fx_ka_creak2",0,1,1]],[["fx_ka_creak3",0,0.9,1]],[["fx_mw_wood_squeak_01",0,0.8,1]]]},"schritte":{"v":[[["fx_ka_footstep00",0,1,1],["fx_ka_footstep01",0.42,1,0.9],["fx_ka_footstep02",0.85,1,0.8],["fx_ka_footstep03",1.28,1,0.7]],[["fx_im_footstep_wood_001",0,1,1],["fx_im_footstep_wood_002",0.4,1,0.9],["fx_im_footstep_wood_003",0.8,1,0.8]]]}};
  const ECHT_DAUER = {"fx_cr2_roar_05":0.944,"fx_rd_creature_roar_03":0.899,"fx_cr2_monster_20":1.235,"fx_cr2_roar_06":0.861,"fx_rd_creature_roar_02":0.899,"fx_cr2_roar_04":0.841,"fx_rp_sword_unsheathe":0.388,"fx_rp_sword_unsheathe2":0.333,"fx_rp_sword_unsheathe3":0.369,"fx_rp_sword_unsheathe4":0.33,"fx_rp_sword_unsheathe5":0.349,"fx_ka_dooropen_2":1.38,"fx_ka_dooropen_1":0.913,"fx_ka_creak2":0.781,"fx_fo_door_01":2.568,"fx_rp_door":0.746,"fx_fo2_sfx100v2_thunder_01":4.287,"fx_cr_scream_01":0.87,"fx_cr_scream_02":0.897,"fx_ca_dice_shake_1":1.351,"fx_ca_dice_throw_1":0.558,"fx_ca_dice_shake_2":1.215,"fx_ca_dice_throw_2":0.354,"fx_ca_die_throw_3":0.619,"fx_ca_dice_shake_3":1.479,"fx_ca_dice_throw_3":0.52,"fx_rp_spell":2.534,"fx_rd_spell_01":0.547,"fx_rd_spell_02":0.459,"fx_rp_magic1":0.646,"fx_rd_item_gem_04":0.552,"fx_ba_bow":0.339,"fx_ba_swish_3":0.57,"fx_ba_swish_2":0.238,"fx_im_impactwood_heavy_000":0.31,"fx_ba_swish_4":0.315,"fx_im_impactwood_heavy_002":0.31,"fx_mw_wood_hit_03":0.299,"fx_rd_blade_01":0.271,"fx_im_impactpunch_heavy_000":0.489,"fx_rd_blade_02":0.303,"fx_ka_knifeslice":0.396,"fx_rd_blade_03":0.307,"fx_im_impactpunch_heavy_002":0.366,"fx_rp_swing":0.148,"fx_rp_swing2":0.125,"fx_im_impactmetal_heavy_000":0.165,"fx_rp_metal_ringing":0.507,"fx_im_impactplate_heavy_001":0.349,"fx_br_bfh1_metal_hit_02":0.433,"fx_im_impactmetal_heavy_003":0.204,"fx_im_impactpunch_heavy_001":0.418,"fx_br_bfh1_hit_02":0.557,"fx_hp_hit05":0.59,"fx_hp_hit08":0.685,"fx_im_impactpunch_heavy_003":0.376,"fx_br_bfh1_rock_breaking_02":0.865,"fx_cr_hurt_02":0.403,"fx_cr_hurt_01":0.403,"fx_cr2_human_03":0.613,"fx_cr2_human_05":0.544,"fx_cr_hurt_05":0.352,"fx_cr2_die_02":0.573,"fx_im_impactsoft_heavy_001":0.569,"fx_cr2_die_03":0.564,"fx_im_impactsoft_heavy_003":0.541,"fx_cr2_die_04":0.769,"fx_im_impactsoft_heavy_000":0.527,"fx_rd_spell_fire_03":1.633,"fx_fo_explosion":0.321,"fx_rd_spell_fire_04":1.267,"fx_rd_spell_fire_01":0.882,"fx_rp_bottle":0.406,"fx_wa_bubble_01":0.579,"fx_rp_bubble2":0.355,"fx_rp_bubble":0.384,"fx_rp_bubble3":0.62,"fx_ka_handlecoins":0.738,"fx_rd_item_coins_04":1.559,"fx_rp_coin2":0.893,"fx_ka_handlecoins2":0.319,"fx_rp_burp":0.924,"fx_cr_burp_01":0.543,"fx_cr_burp_02":0.725,"fx_cr2_snore_02":0.79,"fx_cr_snore":0.396,"fx_fo_spring_01":0.946,"fx_fo_spring_02":1.106,"fx_fo_spring_06":0.756,"fx_br_bfh1_rock_breaking_01":0.535,"fx_br_bfh1_rock_falling_04":0.254,"fx_im_impactwood_heavy_001":0.31,"fx_mw_wood_hit_05":0.16,"fx_mw_wood_hit_08":0.332,"fx_im_impactplank_medium_002":0.44,"fx_mw_wood_squeak_01":0.385,"fx_ka_footstep04":0.286,"fx_mw_wood_squeak_02":0.298,"fx_fo_wooden_02":0.34,"fx_mw_wood_slam_02":0.397,"fx_fo_glass_02":0.356,"fx_fo_glass_03":0.373,"fx_fo_dishes_01":0.759,"fx_fo_dishes_03":0.658,"fx_fo2_sfx100v2_glass_02":0.424,"fx_fo_pot_01":0.275,"fx_ka_creak1":0.6,"fx_ka_creak3":0.318,"fx_ka_footstep00":0.224,"fx_ka_footstep01":0.249,"fx_ka_footstep02":0.229,"fx_ka_footstep03":0.253,"fx_im_footstep_wood_001":0.249,"fx_im_footstep_wood_002":0.248,"fx_im_footstep_wood_003":0.249};
  let echtGeladen = false;
  function echtVorladen() { if (echtGeladen) return; echtGeladen = true; Object.keys(ECHT_DAUER).forEach((n, i) => setTimeout(() => sampleLaden(n), 40 * i)); }
  /* spielt eine Variante, wenn alle Schichten schon geladen sind – sonst null (dann übernimmt der gerechnete Klang) */
  function echtSpielen(art, ziel, zeit, laut, tempo) {
    const e = ECHT[art]; if (!e || !ctx || rendert) return null;
    const bereit = e.v.filter(v => v.every(([n]) => sampleBuf.get(n)));
    e.v.forEach(v => v.forEach(([n]) => { if (!sampleBuf.get(n)) sampleLaden(n); }));
    if (!bereit.length) return null;
    const v = zufall(bereit), st = Math.max(zeit, ctx.currentTime + .01), t = tempo || zz(.96, 1.04);
    let ende = 0;
    v.forEach(([n, o, r, g]) => {
      const b = sampleBuf.get(n), q = ctx.createBufferSource(), gn = ctx.createGain();
      q.buffer = b; q.playbackRate.value = r * t; gn.gain.value = laut * g;
      q.connect(gn); gn.connect(ziel); q.start(st + o / t, b._start || 0);
      ende = Math.max(ende, o / t + (b.duration - (b._start || 0)) / (r * t));
    });
    return { start: st, dauer: ende };
  }
  /* Grundpegel je Effekt (die gerechneten Klänge sind auf gleiche Spitze gebracht) */
  const FX_PEGEL = { drache: .6, schwert: .45, tuer: .6, donner: .5, schrei: .33, wuerfel: .9, zauber: .4, horn: .4, jubel: .55,
    bogen: .7, pfeil: .8, hieb: .7, verfehlt: .5, block: .8, wucht: .8, schmerz: .45, sterben: .5, feuerball: .7, blitz: .5, heiltrank: .55,
    tusch: .7, posaune: .3, krit: .6, dramatisch: .5, grillen: .45, ooh: .5, muenzen: .6, ruelpser: .55, schnarchen: .8, bonk: .8,
    lufthorn: .38, kratzer: .65, boom: .55, falsch: .3, richtig: .6, rutsch: .25, boing: .55, hupe: .32, halleluja: .55, levelup: .33, schock: .6, wirbel: 1 };
  /* sanft vorrechnen: je Effekt erst eine Variante, mit Abstand – damit schwächere Geräte nicht ins Stocken geraten */
  function fxVorwaermen() { if (kwWorker !== false && !spar) EFFEKTE.concat(KAMPF_FX, MOMENTE).forEach((f, i) => setTimeout(() => fxNachfuellen(f, 1), 2500 + 600 * i)); }
  function effekt(art, staerke, zeit) {
    if (!ctx) return;
    try { buehneFx(art); } catch (_) {}
    if (KLASSIK[art]) { klassikSpielen(art, staerke); return; }
    const z = Math.max(zeit || 0, ctx.currentTime + .02), l = staerke || 1, pg = (FX_PEGEL[art] || .7) * l;
    echtVorladen();
    const echt = echtSpielen(art, sfxBus, z, pg * (ECHT_PEGEL[art] || 1));
    if (echt) { musikDucken(echt.start, echt.dauer); if (ECHT[art].s) fxAbspielen(art, sfxBus, z, pg * ECHT[art].s); return; }
    fxAbspielen(art, sfxBus, z, pg).then(r => { if (r) musikDucken(r.start, r.dauer); });
  }
  /* Feinabgleich der Aufnahmen gegenüber den gerechneten Klängen */
  const ECHT_PEGEL = { drache: 1.07, schwert: 1.33, tuer: 1.26, schrei: 1.38, wuerfel: 1.55, zauber: 1.09, bogen: 1.24, pfeil: 1.25, hieb: 1.22, verfehlt: 1.31, block: 1.25, wucht: .92, schmerz: 1.33, sterben: 1.37, feuerball: 1.41, heiltrank: 1.33, muenzen: 1.45, ruelpser: 1.32, schnarchen: 1.28, boing: 1.7, boom: 1.35, bonk: 1.12 };
  /* ---------- Hall pro Instrument und Stimmung ----------
     Jedes Instrument hat seinen eigenen Hallanteil: gehaltene, schwebende Klänge (Harfe, Glocken, Chor, Horn, Pauke) bekommen viel Raum,
     alles Rhythmische (Bass, Klopfen, Umpa, Zupfstreicher) bleibt fast trocken – so wird es episch, ohne zum Klangbrei zu werden.
     Jede Stimmung hat dazu einen Grundcharakter (nass) und ihre „Helden“, die besonders weit klingen; welcher Held es ist,
     wechselt mit dem Lied. Der Hall-Regler bleibt der Meister über alles, die 🏛-Knöpfe schalten einzelne Spuren ganz trocken. */
  const HALL_INSTR = {
    melodie: { harfe: 1.3, glocken: 1.4, illusion: 1.3, laute: .9, mandoline: .7, fidel: 1, drehleier: 1, schalmei: .8, dudelsack: .75, hackbrett: 1.1, cembalo: .7, akkordeon: .6, sitar: 1.2 },
    floete: { horn: 1.3, gesang: 1.3, oohchor: 1.5, shakuhachi: 1.4, okarina: 1.2, floete: 1, panfloete: 1.1, klarinette: .9, oboe: 1, englischhorn: 1.2, bratsche: 1.1, piccolo: .7, pfeife: .6, blockfloete: .8 },
    trommel: { pauke: 1.2, taiko: 1.3, trommel: .5, bodhran: .45, tamburin: .4, stoecke: .3 },
    kap: { ooh: 1.5, rgl: 1.6, cel: 1.4, spiel: 1.3, kal: 1, bra: 1.1, eh: 1.2, shaku: 1.4, bfl: .8, pic: .6, pfeife: .5, blech: 1.2, taiko: 1.3, pizz: .4, akk: .5, hack: .9, cemb: .6, mar: .7, xyl: .6, sitar: 1.1 }
  };
  const HALL_SPUR = { bass: .25, klopf: .3, schelle: .5, ketten: .6, rex: .8 };
  const HALL_WEISE = { umpa: .55, ostinato: .6, puls: 1, stoss: .85, halte: 1.3, glanz: 1.35, arp: .8 };
  /* nass = Grundcharakter der Stimmung, held = mögliche Helden (eine Gruppe je Lied), orch/gast = Teppich und Gäste */
  const HALL_STIMMUNG = {
    heldenlied: { nass: 1, held: [["trommel", "floete"], ["floete", "kap"], ["trommel", "kap"]], orch: 1.3 },
    kampf: { nass: .85, held: [["trommel"], ["floete", "trommel"]], orch: 1.2 },
    boss: { nass: .95, held: [["trommel", "kap"], ["floete", "trommel"]], orch: 1.3 },
    verfolgung: { nass: .6, held: [["trommel"], ["floete"]], orch: .9 },
    spannung: { nass: .9, held: [["melodie"], ["kap"]], orch: 1.1 },
    grusel: { nass: 1.2, held: [["melodie", "kap"], ["floete"]], orch: 1.2 },
    unterreich: { nass: 1.25, held: [["melodie", "trommel"], ["floete", "kap"]], orch: 1.2 },
    ruinen: { nass: 1.2, held: [["floete"], ["melodie", "kap"]], orch: 1.2 },
    elben: { nass: 1.2, held: [["melodie"], ["floete", "kap"]], orch: 1.2 },
    fey: { nass: 1.05, held: [["melodie"], ["kap"]], orch: 1 },
    pilger: { nass: 1.25, held: [["floete", "kap"], ["melodie"]], orch: 1.3 },
    klage: { nass: 1.05, held: [["melodie"], ["floete"]], orch: 1.1 },
    kamin: { nass: .8, held: [["melodie"], ["floete"]], orch: .9 },
    rast: { nass: .8, held: [["floete"], ["melodie"]], orch: .9 },
    reise: { nass: .85, held: [["floete"], ["melodie"]], orch: 1 },
    hof: { nass: 1, held: [["kap", "floete"], ["melodie"]], orch: 1.2 },
    sieg: { nass: .95, held: [["kap", "trommel"], ["floete"]], orch: 1.2 },
    reiter: { nass: .8, held: [["floete"], ["kap"]], orch: 1.1 },
    zwerge: { nass: 1, held: [["floete", "trommel"], ["kap"]], orch: 1.2 },
    auenland: { nass: .7, held: [["floete"], ["melodie"]], orch: .9 },
    dorffest: { nass: .6, held: [["floete"], ["kap"]], orch: .8 },
    marktplatz: { nass: .6, held: [["kap"], ["floete"]], orch: .8 },
    trinklied: { nass: .6, held: [["floete"], ["melodie"]], orch: .8 },
    shanty: { nass: .75, held: [["floete", "kap"], ["melodie"]], orch: .9 }
  };
  const HELD = 1.45, NEBEN = .8;
  function hallStimmung() {
    const p = stilKey() && HALL_STIMMUNG[stilKey()];
    if (!p) return null;
    const held = p.held[((S.arrSeed || 0) + (S.kapWahl || []).reduce((a, b) => a + b, 0)) % p.held.length];
    return { nass: p.nass, held, orch: p.orch || 1 };
  }
  /* Hallanteil einer Spur der Band (ohne die 🏛-Knöpfe) */
  function hallAnteil(k) {
    const p = hallStimmung();
    let w = k === "melodie" ? HALL_INSTR.melodie[S.instrument] || 1 : k === "floete" ? HALL_INSTR.floete[S.band.floete] || 1 : k === "trommel" ? HALL_INSTR.trommel[S.band.trommel] || .6 : HALL_SPUR[k] != null ? HALL_SPUR[k] : 1;
    if (!p) return w;
    w *= p.nass;
    if (k === "melodie" || k === "floete" || k === "trommel") w *= p.held.includes(k) ? HELD : NEBEN;
    return Math.min(1.9, w);
  }
  /* Hallanteil eines Kapellen-Musikers */
  function kapHallAnteil(p) {
    const st = hallStimmung();
    let w = (HALL_INSTR.kap[p.inst] || 1) * (HALL_WEISE[p.jetzt] || 1) * .55;
    if (st) w *= st.nass * (st.held.includes("kap") && !["umpa", "ostinato"].includes(p.jetzt) ? HELD : NEBEN);
    return Math.min(1.2, w);
  }
  function hallProfilAnwenden() {
    if (!ctx) return;
    const j = ctx.currentTime, st = hallStimmung();
    IDS.forEach(k => hallSend[k] && hallSend[k].gain.setTargetAtTime(S.hallAus[k] ? 0 : hallAnteil(k), j, .3));
    if (orchHall) orchHall.gain.setTargetAtTime(.7 * (st ? st.orch * st.nass : 1), j, .3);
    if (gastHall) gastHall.gain.setTargetAtTime(.6 * (st ? st.nass : 1), j, .3);
  }
  function effekteAnwenden() {
    if (!ctx) return;
    const j = ctx.currentTime;
    if (ausgang) ausgang.gain.setTargetAtTime(.6 * masterPegel(), j, .05);
    if (fxAusgang) fxAusgang.gain.setTargetAtTime(fxPegel(), j, .05);
    if (hallNass) hallNass.gain.setTargetAtTime(hallPegel(), j, .08);
    hallSchalten();
    if (echoNass) echoNass.gain.setTargetAtTime(echoPegel() * (leicht() ? 10 : 1), j, .08);
    if (sparHallIn) sparHallIn.gain.setTargetAtTime(hallPegel() * SPAR_HALL, j, .08);
    sparAusgang();
    echoHallSchalten();
    if (kul) kul.g.gain.setTargetAtTime(kulPegel(), j, .1);
    hallProfilAnwenden();
  }
  const spurPegel = k => S.mute[k] ? 0 : Math.pow(S.vol[k] / 9, 1.6);
  function mixAnwenden() {
    if (!ctx) return;
    IDS.forEach(k => spurGain[k] && spurGain[k].gain.setTargetAtTime(spurPegel(k), ctx.currentTime, .03));
  }
  const saitenCache = new Map();
  /* iPhone: Web-Audio verstummt sonst beim Lautlos-Schalter. Wiedergabe-Sitzung anmelden und ein stummes
     <audio> mitlaufen lassen – dann gilt die Musik als „Medienwiedergabe" wie ein Video. */
  let stummAudio = null;
  function stummschalterUmgehen() {
    try { if (navigator.audioSession) navigator.audioSession.type = "playback"; } catch (_) {}
    if (stummAudio) { if (stummAudio.paused) stummAudio.play().catch(() => {}); return; }
    try {
      /* 6 Sekunden: kürzere Töne zählt Android nicht als Medienwiedergabe – dann gingen die Kopfhörer-Tasten ins Leere */
      const n = 8000 * 6, b = new ArrayBuffer(44 + n), v = new DataView(b), w = (o, str) => { for (let i = 0; i < str.length; i++) v.setUint8(o + i, str.charCodeAt(i)); };
      w(0, "RIFF"); v.setUint32(4, 36 + n, true); w(8, "WAVEfmt "); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
      v.setUint32(24, 8000, true); v.setUint32(28, 8000, true); v.setUint16(32, 1, true); v.setUint16(34, 8, true); w(36, "data"); v.setUint32(40, n, true);
      for (let i = 0; i < n; i++) v.setUint8(44 + i, 128);
      let bin = ""; new Uint8Array(b).forEach(x => { bin += String.fromCharCode(x); });
      stummAudio = new Audio("data:audio/wav;base64," + btoa(bin)); stummAudio.loop = true; stummAudio.setAttribute("playsinline", "");
      stummAudio.play().catch(() => {});
    } catch (_) {}
    medienSitzung();
  }
  /* ---------- Kopfhörer- und Sperrbildschirm-Tasten ----------
     Pause am (Bluetooth-)Kopfhörer hält Musik UND Kulisse an, Play setzt beides fort – genau dort, wo es war. */
  let medienMerk = null, medienAn = false;
  function medienSitzung() {
    if (!("mediaSession" in navigator) || medienAn) return;
    medienAn = true;
    const ms = navigator.mediaSession, h = (a, f) => { try { ms.setActionHandler(a, f); } catch (_) {} };
    h("pause", () => medienPause());
    h("stop", () => medienPause());
    h("play", () => medienWeiter());
    medienStand();
  }
  function medienPause() {
    if (!ctx) return;
    medienMerk = { musik: laeuft, kul: kul ? kul.art : null, allein: !!(kul && kul.allein) };
    if (laeuft) stopp(true);
    if (kul) kulisseStop();
    if (stummAudio) try { stummAudio.pause(); } catch (_) {}
    medienStand(); try { knoepfe(); } catch (_) {}
  }
  function medienWeiter() {
    const m = medienMerk; medienMerk = null;
    if (stummAudio && stummAudio.paused) stummAudio.play().catch(() => {});
    if (!m || m.musik || (!m.kul && !laeuft)) { if (!laeuft) start(true); }
    else if (m.kul) { audioStart(); S.kulisse = m.kul; kulisseStart(true); }
    medienStand(); try { knoepfe(); } catch (_) {}
  }
  function medienStand() {
    if (!("mediaSession" in navigator)) return;
    const ms = navigator.mediaSession, an = laeuft || !!kul;
    try { ms.playbackState = an ? "playing" : "paused"; } catch (_) {}
    try {
      const titel = (S.titel || (S.stimmung && t().vorlagen[S.stimmung] ? t().vorlagen[S.stimmung].replace(/^[^\wÄÖÜäöü]+/, "") : "")) || t().titel || "Lautenwerk";
      if (window.MediaMetadata && (!ms.metadata || ms.metadata.title !== titel)) ms.metadata = new MediaMetadata({ title: titel, artist: "Lautenwerk · Imres Tales", album: "Imres Tales" });
    } catch (_) {}
  }
  function audioStart() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      /* Sparmodus: mit halber Abtastrate rechnen (24 kHz) – halbiert die gesamte Rechenlast, Höhen bis 12 kHz bleiben */
      leichtFest = spar || mobil;
      try { ctx = spar ? new AC({ latencyHint: .25, sampleRate: 24000 }) : new AC({ latencyHint: "playback" }); } catch (_) { try { ctx = new AC({ latencyHint: "playback" }); } catch (__) { ctx = new AC(); } } /* größerer Puffer = keine Aussetzer auf dem Handy */
      /* Signalkette: Spuren → Master → sanfter Kompressor → Ausgangspegel → Limiter.
         Hält die Lautstärke auch auf Kopfhörern unter der Übersteuerungsgrenze. */
      const komp = ctx.createDynamicsCompressor(); kompRef = komp;
      komp.threshold.value = -20; komp.knee.value = 10; komp.ratio.value = 2; komp.attack.value = .006; komp.release.value = .25;
      ausgang = ctx.createGain(); ausgang.gain.value = .6 * masterPegel();
      const limiter = ctx.createDynamicsCompressor();
      limiter.threshold.value = -4; limiter.knee.value = 2; limiter.ratio.value = 20; limiter.attack.value = .003; limiter.release.value = .25;
      master = ctx.createGain(); master.gain.value = .38;
      ducken = ctx.createGain(); ducken.gain.value = 1;
      /* „Atem“: das kurze Luftholen vor einem Refrain (alles für einen Augenblick fast still) */
      atem = ctx.createGain(); atem.gain.value = 1;
      master.connect(atem); atem.connect(ducken); ducken.connect(komp); komp.connect(ausgang); ausgang.connect(limiter); limiter.connect(ctx.destination);
      /* Pump-Bus: Teppich, Orchester, Kapelle, Gäste und Sub-Bass ducken sich bei jedem Kick kurz weg */
      pumpBus = ctx.createGain(); pumpBus.gain.value = 1; pumpBus.connect(master);
      try { pegelMesser = ctx.createAnalyser(); pegelMesser.fftSize = 256; pegelDaten = new Uint8Array(pegelMesser.fftSize); limiter.connect(pegelMesser); } catch (_) { pegelMesser = null; }
      /* Bühne in Stereo: Friedrich links, Echo und Ezekiel rechts, Barradin in der Mitte */
      const PAN = { klopf: -.08, schelle: .18, bass: 0, melodie: -.12, trommel: -.42, floete: .4, ketten: .5, rex: .3 };
      /* Klangbild: alles außer Bass und Trommel ohne tiefe Brummanteile (sonst Brei), die Melodie etwas präsenter */
      const EQ = { melodie: [130, 2600, 2.2], floete: [160, 0, 0], klopf: [140, 0, 0], schelle: [220, 0, 0], ketten: [160, 0, 0], rex: [180, 0, 0] };
      IDS.forEach(k => {
        const g = ctx.createGain(); spurGain[k] = g;
        let aus = g;
        if (EQ[k]) {
          const hp = ctx.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = EQ[k][0]; hp.Q.value = .6; aus.connect(hp); aus = hp;
          if (EQ[k][1] && !leicht()) { const pk = ctx.createBiquadFilter(); pk.type = "peaking"; pk.frequency.value = EQ[k][1]; pk.Q.value = .9; pk.gain.value = EQ[k][2]; aus.connect(pk); aus = pk; }
        }
        if (!leicht() && ctx.createStereoPanner) { const pn = ctx.createStereoPanner(); pn.pan.value = PAN[k]; aus.connect(pn); pn.connect(master); } else aus.connect(master);
      });
      /* Breite: Barradins Melodie minimal versetzt und leicht verstimmt ein zweites Mal, auf der anderen Seite */
      if (!leicht() && ctx.createStereoPanner) {
        const d = ctx.createDelay(.05), g2 = ctx.createGain(), pn2 = ctx.createStereoPanner(), lfo = ctx.createOscillator(), lg = ctx.createGain();
        d.delayTime.value = .019; g2.gain.value = .3; pn2.pan.value = .55; lfo.frequency.value = .35; lg.gain.value = .0016;
        lfo.connect(lg); lg.connect(d.delayTime); lfo.start();
        const hp2 = ctx.createBiquadFilter(); hp2.type = "highpass"; hp2.frequency.value = 220;
        spurGain.melodie.connect(hp2); hp2.connect(d); d.connect(g2); g2.connect(pn2); pn2.connect(master); breiteGain = g2;
      }
      /* Echo im Takt (punktierte Achtel) für Flöte, Melodie und Kapelle – nur in ruhigen, schwebenden Stimmungen */
      taktEcho = ctx.createDelay(2); taktEcho.delayTime.value = .45;
      const tfb = ctx.createGain(), tlp = ctx.createBiquadFilter(), thp = ctx.createBiquadFilter();
      tfb.gain.value = .32; tlp.type = "lowpass"; tlp.frequency.value = 3200; thp.type = "highpass"; thp.frequency.value = 300;
      taktEchoNass = ctx.createGain(); taktEchoNass.gain.value = 0;
      taktEcho.connect(tlp); tlp.connect(thp); thp.connect(tfb); tfb.connect(taktEcho); thp.connect(taktEchoNass); taktEchoNass.connect(master);
      taktEchoEin = ctx.createGain(); taktEchoEin.gain.value = 1; taktEchoEin.connect(taktEcho);
      ["floete", "melodie"].forEach(k => { const sg = ctx.createGain(); sg.gain.value = k === "floete" ? 1 : .6; spurGain[k].connect(sg); sg.connect(taktEchoEin); });
      /* Raumhall: jede Spur schickt einen Teil in einen Faltungshall (selbst erzeugter Raum, ca. 2,8 s) */
      hallEin = ctx.createGain(); hallNass = ctx.createGain(); hallNass.gain.value = hallPegel();
      kulRauschen = ctx.createBuffer(1, ctx.sampleRate * 4, ctx.sampleRate);
      { const d = kulRauschen.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }
      sfxBus = ctx.createGain(); sfxBus.gain.value = 1;
      fxAusgang = ctx.createGain(); fxAusgang.gain.value = fxPegel(); sfxBus.connect(fxAusgang); fxAusgang.connect(limiter); setTimeout(fxVorwaermen, 1500);
      /* Effekte bleiben trocken – ein Bogenschuss mit Kirchenhall klingt seltsam */
      hallFilter = ctx.createBiquadFilter(); hallFilter.type = "lowpass"; hallFilter.frequency.value = RAEUME[S.raum].hell;
      /* alles, was in den Hall geht, ohne Tiefen: Bass und Grundtöne im Nachhall würden den Klang verschmieren */
      hallHP = ctx.createBiquadFilter(); hallHP.type = "highpass"; hallHP.frequency.value = 280; hallHP.Q.value = .5; hallHP.connect(hallEin);
      hallNass.connect(komp); hallSchalten();
      raumAnwenden();
      IDS.forEach(k => { const g = ctx.createGain(); g.gain.value = S.hallAus[k] ? 0 : hallAnteil(k); spurGain[k].connect(g); g.connect(hallHP); hallSend[k] = g; });
      /* Echos eigener Hall: weiter, schwebender Raum nur für ihre Instrumente, unabhängig vom Raumhall */
      echoSend = ctx.createGain(); echoSend.gain.value = 1; echoNass = ctx.createGain(); echoNass.gain.value = echoPegel();
      if (leicht()) { echoNass.gain.value = echoPegel() * 10; echoSend.connect(echoNass); if (hallNode && hallNode.ein) echoNass.connect(hallNode.ein); sparAusgang(); }
      else { echoKonv = ctx.createConvolver(); echoKonv.buffer = echoBild(); echoSend.connect(echoKonv); echoKonv.connect(echoNass); echoNass.connect(komp); }
      echoHallSchalten();
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
    stummschalterUmgehen();
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
        if (max > 0 && spitze != null) { const f = spitze / max; for (let i = 0; i < d.length; i++) d[i] *= f; }
        klangCache.set(key, buf);
      }
      inArbeit.delete(key);
    };
    /* immer nur eine Vorberechnung gleichzeitig – sonst konkurriert sie auf dem Handy mit der laufenden Musik */
    renderSchlange.push(() => new Promise(fertigGesamt => {
      const ok = b => { fertig(b); fertigGesamt(); }, nein = () => { inArbeit.delete(key); fertigGesamt(); };
      const pr = off.startRendering();
      if (pr && pr.then) pr.then(ok, nein); else off.oncomplete = e => ok(e.renderedBuffer);
    }));
    schlangeWeiter();
  }
  const renderSchlange = []; let schlangeLaeuft = false;
  function schlangeWeiter() {
    if (schlangeLaeuft || !renderSchlange.length) return;
    schlangeLaeuft = true;
    renderSchlange.shift()().then(() => { schlangeLaeuft = false; setTimeout(schlangeWeiter, spar ? 40 : 0); });
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
  const ECHO_SPITZE = { panfloete: .24, okarina: .25, gesang: .27, horn: .27 };
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
  /* Bass: gezupfte tiefe Saite mit vollem Körper – Grundton, kräftige Obertöne (hörbar auch auf kleinen
     Lautsprechern), Anschlag mit leichtem Tonhöhen-Ruck, dazu ein weicher Daumen-„Plopp". Fest auf gleiche Spitze gebracht. */
  function bassSaite(freq) {
    const sr = ctx.sampleRate, n = Math.round(sr * 1.9), buf = ctx.createBuffer(1, n, sr), d = buf.getChannelData(0);
    const AMP = [1, .62, .42, .26, .16, .1, .06, .035], pos = .2;
    AMP.forEach((a0, k) => {
      const h = k + 1, fh = freq * h * (1 + .0002 * (h * h - 1)); /* Grundton exakt, nur die Obertöne leicht gespreizt */
      if (fh > sr * .45) return;
      const a = a0 * Math.abs(Math.sin(Math.PI * h * pos)) / Math.sin(Math.PI * pos), tau = 1.5 / (1 + k * .7);
      let ph = Math.random() * .3;
      for (let j = 0; j < n; j++) {
        const t = j / sr, ruck = 1 + .012 * Math.exp(-t / .035);
        ph += 2 * Math.PI * fh * ruck / sr;
        d[j] += Math.sin(ph) * a * Math.exp(-t / tau) * Math.min(1, t / .004);
      }
    });
    /* Daumen-Anschlag */
    let lp = 0; const c = 1 - Math.exp(-2 * Math.PI * 400 / sr);
    for (let j = 0; j < Math.round(sr * .03); j++) { lp += c * ((Math.random() * 2 - 1) - lp); d[j] += lp * 1.2 * (1 - j / (sr * .03)); }
    let max = 0; for (let j = 0; j < n; j++) max = Math.max(max, Math.abs(d[j]));
    const f = .85 / (max || 1), aus = Math.round(sr * .06);
    for (let j = 0; j < n; j++) d[j] *= f * (j > n - aus ? (n - j) / aus : 1);
    return buf;
  }
  function saite(freq, art) {
    const key = art + freq.toFixed(2);
    if (saitenCache.has(key)) return saitenCache.get(key);
    if (art === "bass") { const b = bassSaite(freq); saitenCache.set(key, b); return b; }
    const sr = ctx.sampleRate, dauer = art === "bass" ? 1.8 : art === "harfe" ? 2.6 : art === "mandoline" ? .9 : 1.4, n = Math.round(sr * dauer);
    const buf = ctx.createBuffer(1, n, sr), d = buf.getChannelData(0);
    /* Schleifenlänge exakt treffen: die Mittelung kürzt die Schleife um eine halbe Probe, der Rest
       (Bruchteil einer Probe) kommt aus einem Allpass – sonst klingen hohe Töne bis zu 40 Cent zu hoch */
    const P = sr / freq + .5, p = Math.max(2, Math.floor(P - .1)), fr = P - p, C = (1 - fr) / (1 + fr), ring = new Float32Array(p);
    for (let j = 0; j < p; j++) ring[j] = Math.random() * 2 - 1;
    if (art === "harfe") for (let k = 0; k < 2; k++) for (let j = 0; j < p; j++) ring[j] = (ring[j] + ring[(j + 1) % p]) / 2; /* weicher angezupft */
    const daempf = art === "bass" ? .4985 : art === "harfe" ? .4993 : art === "mandoline" ? .4962 : .4975;
    let idx = 0, apX = 0, apY = 0;
    for (let j = 0; j < n; j++) {
      const a = ring[idx], b = ring[(idx + 1) % p];
      d[j] = a;
      const x = (a + b) * daempf; apY = C * x + apX - C * apY; apX = x;
      ring[idx] = apY;
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
    /* auch einen Ganzton höher – für die Anhebung im Höhepunkt */
    [0, 2].forEach(h => {
      if (sa) for (let z = 0; z < SPUR.melodie.zeilen; z++) saite(midiHz(tonMidi("melodie", z, S) - hebung + h), sa);
      for (let z = 0; z < BASS_STUFEN.length; z++) saite(midiHz(tonMidi("bass", z, S) - hebung + h), "bass");
    });
    klaengeVorbereiten();
  }
  function zupf(freq, zeit, art, laut) {
    const src = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    src.buffer = saite(freq, art);
    f.type = "lowpass"; f.frequency.value = art === "bass" ? 1800 : art === "harfe" ? 4200 : art === "mandoline" ? 4800 : 3400; f.Q.value = .7;
    g.gain.value = (laut || 1) * (art === "bass" ? .55 : art === "harfe" ? .6 : art === "mandoline" ? .38 : .55);
    if (spar && !rendert) src.connect(g); else { src.connect(f); f.connect(g); }
    g.connect(spurGain[art === "bass" ? "bass" : "melodie"]);
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
  /* Echos neue Instrumente: [Aufnahme, Lage in Halbtönen, Pegel] */
  const ECHO_NEU = { blockfloete: ["bfl", -12, .3], piccolo: ["pic", 12, .15], pfeife: ["pfeife", 12, .15], shakuhachi: ["shaku", -12, .36], englischhorn: ["eh", -12, .32], oohchor: ["ooh", -12, .3], bratsche: ["bra", -12, .34] };
  /* Echos Lage (nachgemessen): Echos Linie liegt nah an Barradins Melodie. Damit sich beide nicht kreuzen und reiben,
     spielen Flöten, Klarinette, Gesang & Co. eine Oktave darunter (Sexte bis Dezime unter der Laute),
     Piccolo und Blechpfeife dagegen eine Oktave darüber – ihr allerhöchster Ton wird zurückgeklappt */
  const ECHO_OBEN = { piccolo: 102, pfeife: 98 };
  const echoOben = art => !!ECHO_OBEN[art];
  function echoSpielen(freq, zeit, dauer, laut) {
    const l = laut || 1, art = S.band.floete, ziel = spurGain.floete;
    if (ECHO_OBEN[art] && 69 + 12 * Math.log2(freq / 440) + 12 > ECHO_OBEN[art] + .5) freq /= 2;
    if (ECHO_NEU[art]) {
      const [g, lage, pg] = ECHO_NEU[art], d = Math.max(.2, dauer || .25);
      if (!rendert && probe(g, Math.round(69 + 12 * Math.log2(freq / 440)) + lage, zeit, ziel, pg * l, { ein: .04, aus: .16, dauer: d + .08 })) return;
      floete(lage < 0 ? freq / 2 : freq, zeit, dauer || .25, l); return;
    }
    const fOrig = freq;
    /* Holzflöte, Panflöte und Okarina eine Oktave tiefer: warm und rund, unter der Melodie */
    if (art === "floete" || art === "panfloete" || art === "okarina") freq = freq / 2;
    if ((art === "floete" || art === "horn") && !rendert) {
      const m = Math.round(69 + 12 * Math.log2(freq / 440)) + (art === "horn" ? -12 : 0), d = Math.max(.18, dauer || .25);
      const ok = art === "horn" ? probe("horn", m, zeit, ziel, .5 * l, { ein: .06, aus: .18, dauer: d + .1 })
        : d >= .32 ? probe("fl", m, zeit, ziel, .36 * l, { ein: .05, aus: .2, dauer: d + .08 }) : probe("flst", m, zeit, ziel, .38 * l, { dauer: Math.max(.25, d), aus: .08 });
      if (ok) return;
    }
    if ((art === "klarinette" || art === "oboe") && !rendert) {
      const d = Math.max(.2, dauer || .3), m = Math.round(69 + 12 * Math.log2(freq / 440)) - 12;
      if (probe(art === "klarinette" ? "klar" : "oboe", m, zeit, ziel, (art === "oboe" ? .36 : .42) * l, { ein: .04, aus: .16, dauer: d + .08 })) return;
      floete(freq / 2, zeit, dauer || .25, l); return;
    }
    if (art === "klarinette" || art === "oboe") { floete(freq / 2, zeit, dauer || .25, l); return; }
    if (art === "gesang" && !rendert) {
      const d = Math.max(.2, dauer || .3);
      if (probe("stimme", Math.round(69 + 12 * Math.log2(freq / 2 / 440)), zeit, ziel, PEGEL_ECHT.gesang * l, { ein: .08, aus: .2, dauer: d + .1 })) return;
    }
    if ((art === "panfloete" || art === "okarina") && !rendert) {
      const d = Math.max(.18, dauer || .25);
      if (probe(art === "panfloete" ? "pan" : "oka", Math.round(69 + 12 * Math.log2(freq / 440)), zeit, ziel, PEGEL_ECHT[art] * l, { ein: .03, aus: .15, dauer: d + .08 })) return;
    }
    if (art === "floete") {
      const key = "echo|floete|" + freq.toFixed(2), buf = !rendert && klangCache.get(key);
      if (buf) { abspielen(buf, zeit, ziel, l, Math.max(.18, dauer || .25)); return; }
      floete(freq, zeit, dauer || .25, l);
      if (!rendert) vorrendern(key, 3.2, () => floete(freq, 0, 3, 1), null);
      return;
    }
    if (!rendert) {
      const buf = klangCache.get("echo|" + art + "|" + fOrig.toFixed(2));
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
      o.connect(sum); lp.frequency.value = 2000;
      ende = huelle(g, zeit, d, .28 * l, .07, .14);
      const r = ctx.createBufferSource(), b = ctx.createBiquadFilter(), rg = ctx.createGain();
      r.buffer = rauschen; r.loop = true; b.type = "bandpass"; b.frequency.value = freq; b.Q.value = 6;
      rg.gain.setValueAtTime(0, zeit); rg.gain.linearRampToValueAtTime(.32 * l, zeit + .04); rg.gain.linearRampToValueAtTime(.1 * l, zeit + .2); rg.gain.linearRampToValueAtTime(0, ende);
      r.connect(b); b.connect(rg); rg.connect(g); r.start(zeit); r.stop(ende);
      rauschStoss(zeit, ziel, "bandpass", Math.min(2400, freq * 2), 2, .04 * l, .08);
    } else if (art === "okarina") { /* rund und weich */
      const o = ctx.createOscillator(), o3 = ctx.createOscillator(), g3 = ctx.createGain(); o.type = "sine"; o3.type = "sine";
      o.frequency.value = freq; o3.frequency.value = freq * 3; g3.gain.value = .05; oscs = [o, o3];
      o.connect(sum); o3.connect(g3); g3.connect(sum); lp.frequency.value = 2200;
      ende = huelle(g, zeit, d, .34 * l, .06, .14);
      vibrato(oscs, zeit, ende, 4.8, freq * .005, .3);
    } else if (art === "gesang") { /* Echo summt und singt – eine Oktave tiefer */
      /* warmer Chor-Klang („ooh–aah“): zwei leicht verstimmte Stimmen, breite Formanten, Brustton aus einem Sinus */
      const f0 = freq / 2, o = ctx.createOscillator(), o2 = ctx.createOscillator(), o3 = ctx.createOscillator();
      o.type = "triangle"; o2.type = "sawtooth"; o3.type = "sine";
      o.frequency.value = f0; o2.frequency.value = f0 * 1.004; o3.frequency.value = f0; oscs = [o, o2, o3];
      const roh = ctx.createGain(), sg = ctx.createGain(), brust = ctx.createGain();
      roh.gain.value = .5; sg.gain.value = .16; brust.gain.value = .55;
      o.connect(roh); o2.connect(sg); sg.connect(roh); o3.connect(brust); brust.connect(sum);
      formant(roh, sum, [[480, 2.5, 1.3], [850, 3, .55], [2600, 4, .12]]);
      lp.frequency.value = 2100; lp.Q.value = .5;
      ende = huelle(g, zeit, d, .36 * l, .18, .28);
      vibrato(oscs, zeit, ende, 5.1, f0 * .008, .45);
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

  /* Holzflöte: weicher Grundton, wenig Obertöne, sanft angeblasen, Vibrato erst bei langen Tönen */
  function floete(freq, zeit, dauer, laut) {
    const l = laut || 1, ende = zeit + Math.max(.14, dauer);
    const o = ctx.createOscillator(), o2 = ctx.createOscillator(), o3 = ctx.createOscillator(), g = ctx.createGain(), f = ctx.createBiquadFilter();
    o.type = "sine"; o2.type = "sine"; o3.type = "sine";
    o.frequency.setValueAtTime(freq * .99, zeit); o.frequency.linearRampToValueAtTime(freq, zeit + .06);
    o2.frequency.setValueAtTime(freq * 1.98, zeit); o2.frequency.linearRampToValueAtTime(freq * 2, zeit + .06);
    o3.frequency.value = freq * 3;
    const g2 = ctx.createGain(), g3 = ctx.createGain(); g2.gain.value = .16; g3.gain.value = .04;
    o.connect(f); o2.connect(g2); g2.connect(f); o3.connect(g3); g3.connect(f);
    f.type = "lowpass"; f.frequency.value = 1900; f.Q.value = .5;
    g.gain.setValueAtTime(0, zeit); g.gain.linearRampToValueAtTime(.27 * l, zeit + .07);
    g.gain.setTargetAtTime(.22 * l, zeit + .12, .25);
    g.gain.setValueAtTime(.22 * l, Math.max(zeit + .13, ende - .05)); g.gain.linearRampToValueAtTime(0, ende + .12);
    f.connect(g); g.connect(spurGain.floete);
    [o, o2, o3].forEach(x => { x.start(zeit); x.stop(ende + .15); });
    if (dauer > .4) vibrato([o, o2, o3], zeit, ende + .15, 4.8, freq * .004, .35);
    /* leiser, dunkler Atemhauch */
    const r = ctx.createBufferSource(), rb = ctx.createBiquadFilter(), rg = ctx.createGain();
    r.buffer = rauschen; r.loop = true; rb.type = "bandpass"; rb.frequency.value = Math.min(2500, freq * 2); rb.Q.value = 1.2;
    rg.gain.setValueAtTime(0, zeit); rg.gain.linearRampToValueAtTime(.05 * l, zeit + .04); rg.gain.setTargetAtTime(.015 * l, zeit + .08, .1); rg.gain.linearRampToValueAtTime(0, ende + .1);
    r.connect(rb); rb.connect(rg); rg.connect(spurGain.floete); r.start(zeit, Math.random() * .5); r.stop(ende + .12);
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
  /* Barradins neue Instrumente: [Aufnahme, Pegel, Ausklang in s (0 = gehalten wie ein Balg)] */
  const MEL_NEU = { hackbrett: ["hack", .42, 2.4], cembalo: ["cemb", .36, 2.2], sitar: ["sitar", .38, 2.6], akkordeon: ["akk", .34, 0] };
  function melodieSpielen(freq, zeit, dauer, laut) {
    const l = laut || 1, ziel = spurGain.melodie, art = S.instrument;
    if (MEL_NEU[art]) {
      const [g, pg, aus] = MEL_NEU[art], m = Math.round(69 + 12 * Math.log2(freq / 440));
      if (!rendert && (aus ? probe(g, m, zeit, ziel, pg * l, { dauer: aus, aus: .35 }) : probe(g, m, zeit, ziel, pg * l, { ein: .03, aus: .12, dauer: Math.max(.2, dauer || .3) + .06 }))) return;
      zupf(freq, zeit, "mel", l); return;
    }
    if (art === "harfe" && probe("harfe", Math.round(69 + 12 * Math.log2(freq / 440)), zeit, ziel, .55 * l, { dauer: 2.6, aus: .4 })) return;
    if (art === "glocken" && probe("glock", Math.round(69 + 12 * Math.log2(freq / 440)) + 12, zeit, ziel, .32 * l)) return;
    if ((art === "fidel" || art === "schalmei") && !rendert) {
      const m = Math.round(69 + 12 * Math.log2(freq / 440)), d = Math.max(.18, dauer || .25), lang = d >= .32;
      const g = art === "fidel" ? (lang ? "geige" : "geigest") : (lang ? "oboe" : "oboest");
      if (probe(g, m, zeit, ziel, (art === "fidel" ? (lang ? .9 : .54) : .32) * l, lang ? { ein: .06, aus: .16, dauer: d + .08 } : { dauer: Math.max(.22, d), aus: .07 })) return;
    }
    if (art === "laute" && !rendert && probe("gitarre", Math.round(69 + 12 * Math.log2(freq / 440)), zeit, ziel, PEGEL_ECHT.laute * l, { dauer: 2.4, aus: .35 })) return;
    if (art === "dudelsack" && !rendert) {
      const d = Math.max(.18, dauer || .3);
      if (probe("dudel", Math.round(69 + 12 * Math.log2(freq / 440)), zeit, ziel, PEGEL_ECHT.dudelsack * l, { ein: .02, aus: .08, dauer: d + .05 })) return;
    }
    if (art === "laute" || art === "harfe") { zupf(freq, zeit, art === "harfe" ? "harfe" : "mel", l); return; }
    if (art === "mandoline" && !rendert && sampleBuf.get("gitarre_" + naechsteProbe("gitarre", Math.round(69 + 12 * Math.log2(freq / 440))))) {
      /* Tremolo mit der echten gezupften Saite */
      const m = Math.round(69 + 12 * Math.log2(freq / 440)), n = Math.max(1, Math.min(6, Math.round(Math.max(.12, dauer || .2) / .08)));
      for (let k = 0; k < n; k++) probe("gitarre", m, zeit + k * .08, ziel, PEGEL_ECHT.laute * .8 * l * (k ? .65 : 1), { dauer: k === n - 1 ? 1.2 : .14, aus: k === n - 1 ? .3 : .03 });
      return;
    }
    if (art === "drehleier" && !rendert) {
      const d = Math.max(.18, dauer || .3);
      if (probe("geige", Math.round(69 + 12 * Math.log2(freq / 440)), zeit, ziel, PEGEL_ECHT.drehleier * l, { ein: .04, aus: .12, dauer: d + .06 })) return;
    }
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
      o.frequency.value = freq / 1.002; o2.frequency.value = freq * 1.002; oscs = [o, o2];
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
      o.frequency.value = freq * 2 / 1.0015; o2.frequency.value = freq * 2 * 1.0015; oscs = [o, o2];
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
    const grund = BASS_GRUND + S.transpose + hebung + sk[stufe];
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
  /* Schlagwerk einmal vorrechnen (je drei Varianten) und danach nur noch abspielen – spart je Schlag viele Klangbausteine */
  let perkZaehler = 0;
  function perk(spur, art, betont, zeit, laut, live) {
    const key = "perk|" + spur + "|" + art + "|" + (betont ? 1 : 0) + "|" + (perkZaehler++ % 3);
    const b = !rendert && klangCache.get(key);
    if (b) { abspielen(b, zeit, spurGain[spur], laut || 1); return; }
    live(zeit, laut);
    if (!rendert) vorrendern(key, art === "pauke" ? .95 : .6, () => live(0, 1), null);
  }
  function spielen(spur, zeile, zeit, schritt, laut, dauer) {
    const betont = schritt % 4 === 0;
    if (spur === "klopf") { if (!schlagProbe("klopf", betont, zeit, spurGain.klopf, laut)) perk("klopf", "klopf", betont, zeit, laut, (z, l) => klopfen(z, betont, l)); }
    else if (spur === "schelle") { if (!schlagProbe("schelle", Math.random() < .5, zeit, spurGain.schelle, laut)) perk("schelle", "schelle", false, zeit, laut, (z, l) => schellen(z, l)); }
    else if (spur === "trommel") {
      if (schlagProbe(S.band.trommel, betont, zeit, spurGain.trommel, laut)) return;
      if (S.band.trommel === "tamburin" && probe(betont ? "tamb1" : "tamb2", 0, zeit, spurGain.trommel, (betont ? .75 : .54) * (laut || 1), { dauer: .7, aus: .2 })) return;
      if (S.band.trommel === "taiko" && probe("taiko", betont ? 36 : 42, zeit, spurGain.trommel, (betont ? .9 : .6) * (laut || 1), { dauer: 1.6, aus: .4 })) return;
      if (S.band.trommel === "pauke" && probe(betont ? "timp1" : "timp3", 0, zeit, spurGain.trommel, (betont ? .8 : .55) * (laut || 1), { dauer: betont ? 1.6 : 1, aus: .4 })) return;
      perk("trommel", S.band.trommel, betont, zeit, laut, (z, l) => friedrichSpielen(z, betont, l));
    }
    else if (spur === "ketten") { if (schlagProbe(S.band.ketten, betont, zeit, spurGain.ketten, laut)) return; if (S.band.ketten === "ketten") ezekielSpielen(zeit, laut); else perk("ketten", S.band.ketten, betont, zeit, laut, (z, l) => ezekielSpielen(z, l)); }
    else if (spur === "rex") rexLaut(zeit, zeile, laut);
    else if (spur === "floete") echoSpielen(midiHz(tonMidi("floete", zeile, S)), zeit, dauer || .25, laut);
    else if (spur === "melodie") melodieSpielen(midiHz(tonMidi("melodie", zeile, S)), zeit, dauer, laut);
    else {
      /* in den Stimmungen zupft ein echter Kontrabass, in den Tavernenliedern bleibt Barradins Basssaite */
      const pr = orchProfil(), m = tonMidi(spur, zeile, S);
      if (pr && !pr.volk && probe("kb", m, zeit, spurGain.bass, .66 * (laut || 1), { dauer: 1.4, aus: .3 })) return;
      if ((!pr || pr.volk) && probe("gitarre", m, zeit, spurGain.bass, PEGEL_ECHT.bass * (laut || 1), { dauer: 1.6, aus: .3 })) return;
      zupf(midiHz(m), zeit, "bass", laut);
    }
  }

  /* ---------- Variation: die Band improvisiert beim Spielen ---------- */
  /* Improvisation beim Abspielen. In den Stimmungen bleibt die Melodie fast unangetastet, damit sie sich einprägt;
     nur chaotische Stimmungen (Kampf, Endgegner, Spannung …) dürfen stärker ausschmücken. Der Bass bleibt dort immer stehen. */
  let wirbelJetzt = false;
  function variiert(spur, wert, i, daten, v, letzterTakt) {
    if (v <= 0) return wert;
    const sp = SPUR[spur], stil = S.stimmung && STIL[S.stimmung], ton = stil ? (stil.chaos ? (stil.riff ? .22 : .38) : .12) : 1;
    const r = Math.random();
    if (sp.art === "an") {
      if (spur === "rex") return wert;
      if (wert >= 0) return i % 4 !== 0 && r < v * .15 ? -1 : wert;
      if (spur === "trommel" && letzterTakt && wirbelJetzt && i >= 12) return 0; /* Trommelwirbel – nur ab und zu am Ende eines Durchgangs */
      if (r < v * (spur === "ketten" ? .05 : .12) && i % 2 === 0) return 0;
      return -1;
    }
    if (spur === "rex") return wert >= 0 ? wert : (r < v * .012 ? 0 : -1);
    const max = sp.zeilen - 1;
    if (wert >= 0) {
      if (stil && spur === "bass") return wert;
      if (i !== 0 && i % 4 !== 0 && r < v * .12 * ton) return -1;
      if (i % 4 !== 0 && r < v * .4 * ton) return Math.max(0, Math.min(spur === "bass" ? 4 : max, wert + (Math.random() < .5 ? -1 : 1) * (spur === "bass" ? 3 : 1)));
      return wert;
    }
    if ((spur === "melodie" || spur === "floete") && r < v * .25 * ton) {
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
  let pausiert = false, kapJetzt = null;
  let laeuft = false, schritt = 0, abschnitt = 0, naechste = 0, timer = null;
  const anzeige = [];
  let durchgang = 0, ausduennen = false, einblend = 0;
  const EINBLEND = 48; /* drei Takte, in denen das neue Stück Schicht für Schicht dazukommt */
  const SCHLAGWERK = { klopf: 1, schelle: 1, trommel: 1, ketten: 1, rex: 1 };
  /* ---------- Bassdrum („Wumms“) ----------
     Eine tiefe Trommel unter der ganzen Musik – je nach Stimmung anders: bei Festen ein warmer Fass-Schlag auf den Vierteln,
     bei Kampf, Reitern und Hymnen ein harter, treibender Kick, bei Grusel und Spannung ein leiser Herzschlag, in ruhigen Stimmungen keiner.
     S.kick: 0 = aus, 1 = passend (Standard), 2 = kräftig. Sie folgt dem Regler und der Stummtaste der Trommel. */
  const KICK_FAMILIE = { trinklied: "fest", dorffest: "fest", marktplatz: "fest", shanty: "fest", auenland: "fest", reise: "fest", sieg: "fest", taverne: "fest", hafen: "fest",
    kampf: "episch", boss: "episch", verfolgung: "episch", reiter: "episch", heldenlied: "episch", zwerge: "episch", schmiede: "episch",
    grusel: "herz", unterreich: "herz", spannung: "herz", ruinen: "herz" };
  let kickBus = null;
  function kickSchlag(zeit, l, tief) {
    if (!ctx || rendert) return;
    if (!kickBus) { kickBus = ctx.createGain(); kickBus.gain.value = 1; kickBus.connect(master); }
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = "sine"; o.frequency.setValueAtTime(tief ? 150 : 115, zeit); o.frequency.exponentialRampToValueAtTime(tief ? 44 : 56, zeit + (tief ? .12 : .09));
    g.gain.setValueAtTime(.0001, zeit); g.gain.exponentialRampToValueAtTime(l, zeit + .005); g.gain.exponentialRampToValueAtTime(.001, zeit + (tief ? .45 : .3));
    o.connect(g); g.connect(kickBus); o.start(zeit); o.stop(zeit + .5);
    /* der Anschlag: ein kurzes Klicken, damit man den Schlag auch auf kleinen Lautsprechern hört */
    if (rauschen) { const r = ctx.createBufferSource(), f = ctx.createBiquadFilter(), gg = ctx.createGain(); r.buffer = rauschen; f.type = "bandpass"; f.frequency.value = tief ? 2200 : 1600; f.Q.value = 1.2;
      gg.gain.setValueAtTime(l * (tief ? .35 : .22), zeit); gg.gain.exponentialRampToValueAtTime(.001, zeit + .02); r.connect(f); f.connect(gg); gg.connect(kickBus); r.start(zeit); r.stop(zeit + .03); }
  }
  /* wo der Kick in diesem Schritt fällt (oder -1) */
  function kickMuster(rolle, L) {
    const fam = KICK_FAMILIE[stilKey()] || "ruhig", st = S.kick === 2 ? 1 : 0, i = S.intensitaet + st * 2, jig = (STIL[S.stimmung] || {}).dreier === "jig";
    if (!S.kick) return [];
    if (L === 12) {
      if (fam === "ruhig") return st && (rolle === "r" || rolle === "h") ? [0] : [];
      if (fam === "herz") return i >= 2 ? [0, 2] : [];
      return i < 4 ? [] : rolle === "i" || rolle === "b" ? [0] : jig ? (fam === "episch" && (rolle === "r" || rolle === "h") ? [0, 3, 6, 9] : [0, 6]) : (i >= 7 ? [0, 4, 8] : [0]);
    }
    if (fam === "fest") return i < 4 ? [] : rolle === "i" || rolle === "b" ? [0] : i >= 7 || rolle === "h" ? [0, 4, 8, 12] : [0, 8];
    if (fam === "episch") {
      if (i < 3) return [];
      if (rolle === "i") return [0, 12, 13, 14, 15];
      if (rolle === "b") return [0, 8];
      if (rolle === "s" || rolle === "v") return i >= 6 ? [0, 6, 8, 11] : [0, 8];
      return i >= 8 || st ? [0, 3, 4, 6, 8, 11, 12, 14] : [0, 3, 6, 8, 11, 14];
    }
    if (fam === "herz") return i < 2 ? [] : rolle === "r" || rolle === "h" ? [0, 3, 8, 11] : [0, 3];
    return st && (rolle === "r" || rolle === "h") ? [0, 8] : [];
  }
  const TAKT_ECHO = { elben: .32, ruinen: .3, pilger: .26, unterreich: .26, grusel: .26, spannung: .2, rast: .2, klage: .2, kamin: .14, fey: .2, hof: .1, reise: .1, auenland: .08, ballade: .16, wald: .22, wiegen: .2, trauer: .2 };
  function taktEchoStellen(zeit) {
    if (!taktEcho) return;
    const sd = schrittDauer(), soll = Math.min(1.5, sd * 6); /* punktierte Achtel */
    taktEcho.delayTime.setTargetAtTime(soll, zeit, .3);
    const w = (TAKT_ECHO[stilKey() || ""] || 0) * (S.hall > 0 ? 1 : .7);
    taktEchoNass.gain.setTargetAtTime(w, zeit, .5);
  }
  /* Sub-Bass: eine reine, sehr tiefe Welle eine Oktave unter dem Bass – nur in den epischen Stimmungen */
  function subBass(zeile, zeit, dauer) {
    if (!ctx || rendert || S.mute.bass || (KICK_FAMILIE[stilKey()] || "") !== "episch" || S.intensitaet < 3) return;
    const m = tonMidi("bass", zeile, S) - 12, f = 440 * Math.pow(2, (m - 69) / 12); if (f < 25) return;
    const o = ctx.createOscillator(), g = ctx.createGain(), l = .3 * spurPegel("bass"), d = Math.max(.12, Math.min(dauer, 1.6));
    o.type = "sine"; o.frequency.value = f;
    g.gain.setValueAtTime(.0001, zeit); g.gain.exponentialRampToValueAtTime(l, zeit + .015); g.gain.setValueAtTime(l, zeit + d * .7); g.gain.exponentialRampToValueAtTime(.0005, zeit + d + .06);
    o.connect(g); g.connect(pumpZiel()); o.start(zeit); o.stop(zeit + d + .1);
  }
  /* Pumpen: bei jedem Kick ducken sich Teppich, Orchester, Kapelle, Gäste und Sub-Bass für einen Augenblick */
  function pumpen(zeit, tiefe) {
    if (!pumpBus) return;
    const g = pumpBus.gain;
    g.cancelScheduledValues(zeit); g.setValueAtTime(1, zeit); g.linearRampToValueAtTime(tiefe, zeit + .012); g.setTargetAtTime(1, zeit + .04, .09);
  }
  /* Anlauf in den Refrain: Becken schwillt an, die Snare wirbelt hinauf – und der Refrain kommt mit einem großen Schlag */
  function anlaufSchritt(zeit, ab) {
    if (!S.rollen || !ctx || rendert || ausduennen || einblend > 0 || S.intensitaet < 3) return;
    const L = taktL(), naechst = (ab + 1) % S.ablauf.length, r = rolleAn(ab), rn = rolleAn(naechst);
    const fam = KICK_FAMILIE[stilKey()] || "ruhig", sd = schrittDauer();
    /* der große Schlag auf der Eins des Refrains */
    if (schritt === 0 && abschnittAnfang(ab) && (r === "r" || r === "h") && ab > 0 && rolleAn(ab - 1) !== r) {
      if (fam === "ruhig") { probe("rgl", 79 + S.transpose, zeit, master, .12); return; }
      probe("crash", 0, zeit, master, fam === "herz" ? .14 : .22); probe("bd", 0, zeit, master, .3); probe("timp1", 0, zeit, master, .3);
      return;
    }
    if (!(abschnittAnfang(naechst) && (rn === "r" || rn === "h") && rn !== r && naechst !== 0)) return;
    if (schritt === L - 8) {
      /* Becken-Anschwellen über den halben Takt bis genau zur Eins */
      const sw = sampleBuf.get("swell"), lang = 8 * sd;
      if (sw) probe("swell", 0, zeit, master, fam === "ruhig" ? .14 : .26, { ein: .05, dauer: lang + .03, aus: .03, versatz: Math.max(0, sw._spitze - sw._start - lang) }); else sampleLaden("swell");
    }
    if (fam !== "ruhig" && schritt >= L - 4 && schritt < L - 1) probe(schritt % 2 ? "snare2" : "snare1", 0, zeit, master, .14 + .07 * (schritt - L + 4));
    /* der Atemzug: das letzte Sechzehntel fast still */

  }
  function kickSchritt(zeit, ab) {
    if (!S.kick || S.mute.trommel || !ctx || ausduennen || einblend > EINBLEND / 2) return;
    const L = taktL(), rolle = S.rollen ? rolleAn(ab) : "r";
    let m = kickMuster(rolle, L);
    if (gefuehl === "halb") m = m.filter(x => x % 8 === 0);
    if (brk === "luft" && schritt >= brkAb) return;
    if (!m.includes(schritt)) return;
    const fam = KICK_FAMILIE[stilKey()] || "ruhig", pegel = 1.3 * spurPegel("trommel") * (S.kick === 2 ? 1.25 : 1);
    const betont = schritt === 0 || schritt === L / 2, l = (fam === "herz" ? (schritt % 8 === 0 ? .42 : .3) : fam === "fest" ? .5 : (betont ? .62 : .5)) * pegel;
    kickSchlag(zeit, Math.min(.9, l), fam === "episch" || fam === "herz");
    if (fam === "episch" || fam === "fest") pumpen(zeit, fam === "episch" ? (S.kick === 2 ? .5 : .6) : .78);
    /* im Kampf und im Höhepunkt rollt auf den großen Schlägen die Orchester-Trommel mit */
    if (fam === "episch" && schritt === 0 && (rolle === "r" || rolle === "h")) probe("bd", 0, zeit, master, .22 * pegel);
  }
  let wechsel = null, tempoJetzt = 0, intensitaetNeu = false, wechselAb = 0, ausklangAb = 0, ausklingt = false, brueckeBus = null;
  /* Stimmungen, bei denen ein Wechsel mit Paukenwirbel angekündigt wird (2 = zusätzlich Becken auf der Eins) */
  const DRAMA = { heldenlied: 1, verfolgung: 2, ruinen: 1, kampf: 2, boss: 2, sieg: 2, reiter: 2, zwerge: 1, spannung: 1, unterreich: 1, reise: 1, grusel: 1, hof: 1 };
  /* Ende des laufenden Takts – liegt er weniger als einen Schlag entfernt, das Ende des nächsten */
  function taktEnde() {
    const sd = schrittDauer(), L = taktL(); let T = naechste + ((L - schritt) % L) * sd;
    if (T - ctx.currentTime < 4 * sd) T += L * sd;
    return T;
  }
  function brueckeZiel() {
    if (!brueckeBus) { brueckeBus = ctx.createGain(); brueckeBus.connect(ducken); }
    return brueckeBus;
  }
  /* Weicher Übergang: die alte Musik tritt bis zum Taktende zurück, bei dramatischen Zielen kündigt ein
     Paukenwirbel (mit anschwellendem Becken) den Wechsel an; das neue Stück blendet sich auf der Eins ein. */
  function brueckeStarten() {
    const jetzt = ctx.currentTime, neu = wechsel, dr = neu.stimmung && neu.orchester !== 0 ? DRAMA[neu.stimmung] || 0 : 0;
    let T = taktEnde();
    /* sanfter Wechsel: mindestens ein halber Takt zum Ausklingen – das Schlagwerk hört zuerst auf, die Melodie wird leiser */
    /* lieber einen Moment länger als zu abrupt: sanft mindestens drei Viertel eines Takts zum Ausklingen, dramatisch mindestens ein halber für den Wirbel */
    if (T - jetzt < 12 * schrittDauer()) T += taktL() * schrittDauer();
    wechselAb = T; wechselStart = jetzt; ausduennen = !dr;
    master.gain.cancelScheduledValues(jetzt); master.gain.setValueAtTime(master.gain.value, jetzt);
    master.gain.linearRampToValueAtTime(.38 * (dr ? .3 : .22), T);
    if (dr && !rendert) {
      ["timproll", "swell", "crash", "timp1"].forEach(sampleLaden);
      const z = brueckeZiel(), lang = Math.min(T - jetzt - .05, 3);
      probe("timproll", 0, T - lang, z, dr > 1 ? .55 : .4, { ein: Math.min(.8, lang * .6), dauer: lang + .08, aus: .08 });
      const sw = sampleBuf.get("swell");
      if (sw && dr > 1) probe("swell", 0, T - lang, z, .3, { ein: .05, dauer: lang + .05, aus: .05, versatz: Math.max(0, sw._spitze - sw._start - lang) });
    }
  }
  const schrittDauer = () => 60 / (tempoJetzt || S.tempo) / 4;
  const taktL = () => S.takt === 12 ? 12 : SCHRITTE;
  /* zu Beginn jedes Teils: Höhepunkt einen Ganzton höher, Breaks vor dem Höhepunkt, ab und zu ein anderes Taktgefühl */
  function teilPlanen(ab) {
    hebung = 0; brk = null; brkAb = 99; gefuehl = null;
    const st = S.stimmung && STIL[S.stimmung]; if (!st || ausklingt || ausklangAb || wechsel) return;
    const L = S.ablauf.length, c = hoehepunkt(), naechst = (ab + 1) % L, TL = taktL();
    const energie = (st.dichte || 1) >= .85, dunkel = DUNKEL.includes(S.stimmung);
    if (S.rollen) {
      /* ganze Lieder: der Schlussrefrain steht einen Ganzton höher; am Ende eines Abschnitts vor Refrain oder Höhepunkt
         ein Break, im Zwischenteil ab und zu halbes Taktgefühl, im zweiten Schlussrefrain doppeltes */
      const r = rolleAn(ab), rn = rolleAn(naechst), endet = naechst === 0 || abschnittAnfang(naechst);
      if (st.hebung && r === "h" && S.intensitaet >= 3) hebung = 2;
      if (endet && rn !== r && (rn === "h" || rn === "r") && S.intensitaet >= 3 && Math.random() < (rn === "h" ? .7 : .4)) brk = energie ? "trommel" : "luft";
      else if (endet && r !== "h" && r !== "i" && S.intensitaet >= 2 && Math.random() < .1) brk = "luft";
      if (brk) brkAb = brk === "trommel" ? TL / 2 : TL - 4;
      if (st.gefuehl && r === "b" && durchgang % 2 === 1 && TL === 16) gefuehl = "halb";
      else if (st.gefuehl && st.gefuehl !== "halb" && r === "h" && energie && TL === 16 && S.intensitaet >= 6 && sektionNr(ab) % 2 === 1) gefuehl = "doppelt";
      return;
    }
    if (st.hebung && L > 2 && ab === c && durchgang % 2 === 1 && S.intensitaet >= 3) hebung = 2;
    if (L > 2 && naechst === c && ab !== c && S.intensitaet >= 3 && Math.random() < .55) { brk = energie ? "trommel" : "luft"; }
    else if (ab !== c && L > 1 && S.intensitaet >= 2 && Math.random() < .12) brk = "luft";
    if (brk) brkAb = brk === "trommel" ? TL / 2 : TL - 4;
    if (st.gefuehl && ab !== c && ab > 0 && S.ablauf[ab] === "B" && durchgang % 3 === 2 && TL === 16) gefuehl = "halb";
    else if (st.gefuehl && st.gefuehl !== "halb" && ab === c && energie && durchgang % 2 === 0 && TL === 16 && S.intensitaet >= 6) gefuehl = "doppelt";
  }
  /* Wechsel am Taktanfang: neues Stück übernehmen, Tempo gleitet, kurzer Lautstärke-Atemzug */
  function wechselAnwenden(zeit) {
    const neu = wechsel; wechsel = null; wechselAb = 0;
    const raumAlt = S.raum;
    S = neu; abschnitt = 0; durchgang = 0; padAkkord = -1; orchVorladen();
    try { effekteAnwenden(); mixAnwenden(); if (raumAlt !== S.raum) raumAnwenden(); } catch (_) {}
    const dr = S.stimmung && S.orchester !== 0 ? DRAMA[S.stimmung] || 0 : 0;
    ausduennen = false; einblend = dr ? 0 : EINBLEND;
    if (master) {
      /* das neue Stück blendet sich ein – bei dramatischen Zielen schnell und mit Schlag auf der Eins, sonst sanft */
      const mg = master.gain;
      if (mg.cancelAndHoldAtTime) mg.cancelAndHoldAtTime(zeit); else { mg.cancelScheduledValues(zeit); mg.setValueAtTime(.38 * (dr ? .3 : .22), zeit); }
      if (!dr) mg.setTargetAtTime(.38 * .2, zeit, .15); /* kurz zurücknehmen, dann langsam aufblenden */
      mg.setTargetAtTime(.38, zeit + (dr ? 0 : .4), dr ? .12 : 2.8);
      if (dr > 1) { probe("crash", 0, zeit, brueckeZiel(), .3); probe("timp1", 0, zeit, brueckeZiel(), .5); }
      else if (dr) probe("timp1", 0, zeit, brueckeZiel(), .4);
    }
    setTimeout(() => {
      merken(); if (S.pult) { zeichnen(); knoepfe(); } else autoZeichnen();
      bordunAus(); if (S.bordun) setTimeout(bordunAn, 450);
      kulisseStart();
    }, Math.max(0, (zeit - ctx.currentTime) * 1000)); /* Anzeige wechselt erst, wenn das neue Stück wirklich erklingt */
  }
  function planen() {
    const vorlauf = document.hidden ? 1 : .3; /* im Hintergrund weit vorausplanen, damit die Musik weiterläuft */
    if (ausklingt) return;
    if (musikPauseAb && naechste >= musikPauseAb) { if (naechste < ctx.currentTime) naechste = ctx.currentTime; return; }
    if (wechsel && !wechselAb) brueckeStarten();
    if (ausklangAb === -1) { ausklangAb = taktEnde(); ausklangStart = ctx.currentTime; }
    while (naechste < ctx.currentTime + vorlauf && !(musikPauseAb && naechste >= musikPauseAb)) {
      if (schritt === 0 && ausklangAb && naechste >= ausklangAb - 2 * schrittDauer()) { schlussAkkord(naechste); return; }
      if (schritt === 0 && hoerer) funkAusrichten(false);
      if (schritt === 0 && wechsel && naechste >= wechselAb - 2 * schrittDauer()) wechselAnwenden(naechste);
      else if (schritt === 0 && intensitaetNeu) { intensitaetNeu = false; stimmungWeiter(); }
      if (schritt === 0) { teilPlanen(abschnitt % S.ablauf.length); try { kapJetzt = stilKey() && S.kapelle !== 0 ? kapPlan(abschnitt % S.ablauf.length) : null; } catch (_) { kapJetzt = null; } }
      const zielTempo = ausduennen && wechsel ? wechsel.tempo : S.tempo;
      tempoJetzt = tempoJetzt ? tempoJetzt + (zielTempo - tempoJetzt) * (ausduennen || einblend ? .05 : .1) : S.tempo;
      const teilName = S.ablauf[abschnitt % S.ablauf.length] || "A", daten = S.teile[teilName];
      const v = S.variation / 10, letzterTakt = abschnitt % S.ablauf.length === S.ablauf.length - 1;
      const versatz = S.swing && schritt % 2 === 1 ? schrittDauer() * .33 : 0;
      const ev = { schritt, teil: teilName, zeit: naechste + versatz, spuren: {} };
      const ein = einblend > 0 ? 1 - einblend / EINBLEND : 1;
      IDS.forEach(k => {
        if (S.mute[k]) return;
        if (k === "floete" && gastSolist(abschnitt % S.ablauf.length)) return;
        if (k === "floete" && kapJetzt && kapJetzt.echo === 0) return; /* die Kapelle spielt hier Solo bzw. den Ohrwurm */ /* im Zwischenteil (alte Lieder: C-Teil) spielt der Gast Echos Stimme als Solo */
        /* weicher Übergang: vorher fällt das Schlagwerk weg, danach kommt es erst im zweiten Takt wieder dazu */
        if (SCHLAGWERK[k] && (ausduennen || (einblend > EINBLEND / 2))) return;
        let wert = variiert(k, daten[k][schritt], schritt, daten[k], v, letzterTakt);
        /* halbes Taktgefühl: Trommel nur auf der Eins, Klatschen auf der Drei, Bass in Halben */
        if (gefuehl === "halb") {
          if (k === "trommel") wert = schritt % 8 === 0 ? 0 : -1; else if (k === "ketten") wert = schritt === 8 ? 0 : -1;
          else if (k === "klopf" || k === "schelle") wert = -1; else if (k === "bass") wert = schritt % 8 === 0 ? klingt(daten.bass, schritt) : -1;
        } else if (gefuehl === "doppelt" && (k === "trommel" || k === "schelle") && wert < 0 && schritt % 2 === 0) wert = 0;
        /* Break: vor dem Höhepunkt nur Trommel und Bass (mit Wirbel am Ende) – oder ein Luftloch, in dem nur Barradin weiterspielt */
        if (brk && schritt >= brkAb) {
          if (brk === "trommel") { if (!["trommel", "bass", "klopf"].includes(k)) wert = -1; else if (k === "trommel" && schritt >= taktL() - 4) wert = 0; }
          else if (k !== "melodie") wert = -1;
        }
        if (wert < 0) return;
        /* Groove: jeder Ton minimal früher oder später, die Nachschläge des Schlagwerks etwas zurückgelehnt */
        const wackel = (v ? (Math.random() - .5) * .012 * v : 0) + (Math.random() - .5) * .008 + (SCHLAGWERK[k] && schritt % 2 === 1 ? .006 : 0);
        /* Betonung wie bei echten Spielleuten: die Eins trägt, Achtel dazwischen leichter, Sechzehntel am leisesten */
        const akzent = (S.stimmung && !SCHLAGWERK[k] ? (schritt % 8 === 0 ? 1.1 : schritt % 4 === 0 ? 1 : schritt % 2 === 0 ? .88 : .78)
          : SCHLAGWERK[k] ? (schritt % 4 === 0 ? 1 : schritt % 2 === 0 ? .9 : .8) : 1) * (.94 + Math.random() * .12);
        const laut = (k === "floete" && kapJetzt ? kapJetzt.echo : 1) * akzent * (v ? 1 - Math.random() * .25 * v : 1) * (S.stimmung ? .8 + .04 * S.intensitaet : 1) * (k === "melodie" || k === "floete" ? (ausduennen ? .6 : .45 + .55 * ein) : 1) * (k === "floete" && gastJetzt.length ? .6 : 1);
        const haelt = k === "floete" || (k === "melodie" && (GEHALTEN[S.instrument] || S.instrument === "mandoline"));
        spielen(k, wert, ev.zeit + Math.max(0, wackel), schritt, laut, haelt ? notenLaenge(daten[k], schritt) * schrittDauer() * .95 : 0);
        if (k === "bass") { bordunStimmen(wert, ev.zeit); try { subBass(wert, ev.zeit + Math.max(0, wackel), notenLaenge(daten.bass, schritt) * schrittDauer()); } catch (_) {} }
        ev.spuren[k] = wert;
      });
      try { kickSchritt(ev.zeit, abschnitt % S.ablauf.length); } catch (_) {}
      try { anlaufSchritt(ev.zeit, abschnitt % S.ablauf.length); if (schritt === 0) taktEchoStellen(ev.zeit); } catch (_) {}
      if (!(brk && schritt >= brkAb)) {
        try { orchesterSchritt(ev.zeit, daten, abschnitt % S.ablauf.length); } catch (_) {}
        try { gaesteSchritt(ev.zeit, daten, abschnitt % S.ablauf.length); } catch (_) {}
        try { kapelleSchritt(ev.zeit, daten, abschnitt % S.ablauf.length); } catch (_) {}
      }
      anzeige.push(ev);
      if (einblend > 0) einblend--;
      naechste += schrittDauer();
      schritt = (schritt + 1) % taktL();
      if (schritt === 0) {
        abschnitt = (abschnitt + 1) % S.ablauf.length;
        /* Stimmung: nach jedem Durchgang ein leicht abgewandeltes neues Stück */
        if (abschnitt === 0) {
          durchgang++;
          const st = S.stimmung && STIL[S.stimmung];
          wirbelJetzt = Math.random() < (st ? (st.chaos ? .25 : .15) : .3);
          /* Stimmung: das Thema darf sich einprägen – erst nach drei Durchgängen ein neues, leicht abgewandeltes Stück */
          if (st && !hoerer && durchgang % (S.ablauf.length >= 12 ? 2 : 3) === 0) setTimeout(() => stimmungWeiter(true), 0);
        }
      }
    }
  }
  /* Taktgeber im Hintergrund-Worker: Browser bremsen Zeitgeber in versteckten Tabs und auf dem Handy stark aus –
     Nachrichten aus einem Worker kommen trotzdem regelmäßig an, so stockt die Musik nicht. */
  let taktWorker = null;
  function taktgeber(an) {
    try {
      if (!taktWorker) {
        if (!an) return;
        const url = URL.createObjectURL(new Blob(["let t=null;onmessage=e=>{clearInterval(t);if(e.data>0)t=setInterval(()=>postMessage(1),e.data);};"], { type: "text/javascript" }));
        taktWorker = new Worker(url);
        taktWorker.onmessage = () => { if (laeuft) planen(); };
      }
      taktWorker.postMessage(an ? 25 : 0);
    } catch (_) { taktWorker = null; }
  }
  function stimmungWeiter(neuesThema) {
    if (!S.stimmung || !STIL[S.stimmung]) return;
    const neu = stimmungLied(S.stimmung, true, undefined, neuesThema);
    S.teile = neu.teile; S.ablauf = neu.ablauf; if (neu.rollen) S.rollen = neu.rollen; else delete S.rollen; S.kapWahl = neu.kapWahl; S.arrSeed = neu.arrSeed; S.tempo = tempoFuer(STIL[S.stimmung], S.intensitaet);
    /* mit dem neuen Thema greifen Barradin und Echo manchmal zu einem anderen Instrument – außer man hat sie selbst gewählt */
    if (neuesThema && !S.festBesetzung) {
      const st = STIL[S.stimmung], anders = (liste, jetzt) => { const r = liste.filter(x => x !== jetzt); return r.length ? zufall(r) : jetzt; };
      let neuBes = false;
      if (st.instrument.length > 1 && Math.random() < .55) { S.instrument = anders(st.instrument, S.instrument); neuBes = true; }
      if (st.band.floete.length > 1 && Math.random() < .55) { S.band = Object.assign({}, S.band, { floete: echoWahl(st.band.floete, S.instrument, S.band.floete) }); neuBes = true; }
      else if ((FAMILIE[S.instrument] || []).includes(S.band.floete)) { S.band = Object.assign({}, S.band, { floete: echoWahl(st.band.floete, S.instrument) }); neuBes = true; }
      if (neuBes) { try { saitenVorbereiten(); } catch (_) {} }
    }
    orchVorladen();
    try { hallProfilAnwenden(); } catch (_) {}
    merken(); if (!S.pult) autoZeichnen();
  }
  /* Ausklang: am Taktende ein gemeinsamer Schlussakkord, dann verklingt alles und die Band hört auf */
  function schlussAkkord(z) {
    ausklingt = true; ausklangAb = 0;
    const m = k => !S.mute[k], pr = orchProfil(), mid = (sp, r) => midiHz(tonMidi(sp, r, S));
    try {
      if (m("bass")) spielen("bass", 0, z, 0, 1);
      if (m("melodie")) [0, 4, 7].forEach((r, i) => melodieSpielen(mid("melodie", r), z + i * .035, 2.6, .85));
      if (m("floete")) echoSpielen(mid("floete", 0), z + .02, 2.4, .7);
      if (m("trommel")) spielen("trommel", 0, z, 0, 1);
      if (m("klopf")) spielen("klopf", 0, z, 0, .9);
      if (pr && pr.pad && !S.mute.bass) {
        orchAufbauen(); const ak = akkordMidi(0);
        probe("vc", ak.grund, z, orchPan.vc, .3, { ein: .08, aus: 1.2, dauer: 3.6 });
        probe("vln", ak.terz, z, orchPan.vln, .2, { ein: .1, aus: 1.2, dauer: 3.6 });
        probe("vln", ak.quinte, z, orchPan.vln, .18, { ein: .12, aus: 1.2, dauer: 3.6 });
        if (pr.gross > 1) probe("crash", 0, z, orchPan.gross, .25);
        if (pr.gross) probe("timp1", 0, z, orchPan.gross, .45);
      }
    } catch (_) {}
    const ende = z + 2.2;
    if (master.gain.cancelAndHoldAtTime) master.gain.cancelAndHoldAtTime(z); else master.gain.cancelScheduledValues(z);
    master.gain.setTargetAtTime(0, ende, .5);
    bordunAus();
    status(t().ausklingt);
    setTimeout(() => { if (ausklingt) { stopp(); if (master) { master.gain.cancelScheduledValues(ctx.currentTime); master.gain.value = .38; } } }, Math.max(0, (ende - ctx.currentTime) * 1000) + 2200);
  }
  function start(weiter) {
    audioStart();
    saitenVorbereiten();
    const vonVorn = !weiter || !pausiert || schritt >= taktL() || abschnitt >= S.ablauf.length;
    if (vonVorn) { schritt = 0; abschnitt = 0; durchgang = 0; }
    /* jeder Start ist ein sanftes Intro: die Band kommt Schicht für Schicht dazu, das Schlagwerk erst nach ein paar Takten */
    tempoJetzt = S.tempo; wechsel = null; wechselAb = 0; ausklangAb = 0; ausklingt = false; padAkkord = -1; ausduennen = false; einblend = EINBLEND;
    if (klassikLauf) klassikStopp(true, true);
    clearTimeout(fortsetzTimer); musikPauseAb = 0;
    /* … und die Lautstärke steigt von null an (gut 4 Sekunden bis zum vollen Pegel) */
    if (master) { const j = ctx.currentTime, mg = master.gain; mg.cancelScheduledValues(j); mg.setValueAtTime(.0001, j); mg.linearRampToValueAtTime(.38 * .15, j + .8); mg.setTargetAtTime(.38, j + .8, 1.3); }
    musikWieder(); orchVorladen();
    laeuft = true; pausiert = false; naechste = ctx.currentTime + .1; anzeige.length = 0;
    kulisseStart(); /* erst jetzt: vorher galt die Musik noch als angehalten, und die Kulisse schaltete sich gleich wieder ab */
    planen(); timer = setInterval(planen, 30); taktgeber(true);
    bordunAn();
    malenStarten();
    knoepfe(); funkAenderung(); medienStand();
  }
  function stopp(pause) {
    laeuft = false; pausiert = !!pause; clearInterval(timer); taktgeber(false); wechselAb = 0; ausklangAb = 0; ausklingt = false; musikPauseAb = 0; if (klassikLauf) klassikStopp(true);
    /* beim Anhalten klingen bereits geplante Töne nicht mehr nach, sondern verstummen weich */
    if (ducken) { const j = ctx.currentTime; ducken.gain.cancelScheduledValues(j); ducken.gain.setValueAtTime(ducken.gain.value, j); ducken.gain.setTargetAtTime(0, j, .1); duckEnde = 0; musikStumm = true; } bordunAus(); if (!(kul && kul.allein)) kulisseStop();
    /* ein gewählter, aber noch nicht begonnener Wechsel bleibt die Auswahl für das nächste Play */
    if (wechsel) { S = wechsel; merken(); setTimeout(() => { zeichnen(); knoepfe(); }, 0); }
    ausduennen = false; einblend = 0;
    wechsel = null;
    spalte(-1); teilAnzeige(null); knoepfe(); funkAenderung(); setTimeout(medienStand, 0);
  }


  /* ---------- Echte Instrumente (Aufnahmen aus der Versilian Community Sample Library, CC0) ----------
     Jede Aufnahme liegt als kurze MP3 im Ordner klang/. Geladen wird erst, wenn ein Instrument gebraucht wird;
     bis dahin spielt der berechnete Klang. Zwischentöne entstehen durch leichtes Umstimmen der nächsten Aufnahme. */
  const SAMPLE_KARTE = { /* Kapelle und neue Instrumente (FluidR3, CC BY 3.0) */ akk: [53,  56,  59,  62,  65,  68,  71,  74,  77,  80,  83,  86,  89], hack: [48,  51,  54,  57,  60,  63,  66,  69,  72,  75,  78,  81,  84,  87,  90,  93,  96], cemb: [41,  44,  47,  50,  53,  56,  59,  62,  65,  68,  71,  74,  77,  80,  83,  86,  89], mar: [45,  48,  51,  54,  57,  60,  63,  66,  69,  72,  75,  78,  81,  84,  87,  90,  93,  96], cel: [60,  63,  66,  69,  72,  75,  78,  81,  84,  87,  90,  93,  96,  99,  102,  105,  108], spiel: [60,  63,  66,  69,  72,  75,  78,  81,  84,  87,  90,  93,  96,  99,  102,  105], rgl: [60,  63,  66,  69,  72,  75,  78], taiko: [36,  42,  48], bfl: [60,  63,  66,  69,  72,  75,  78,  81,  84,  87,  90,  93,  96], pic: [74,  77,  80,  83,  86,  89,  92,  95,  98,  101,  104], shaku: [55,  58,  61,  64,  67,  70,  73,  76,  79,  82], eh: [52,  55,  58,  61,  64,  67,  70,  73,  76,  79], sitar: [48,  51,  54,  57,  60,  63,  66,  69,  72,  75,  78,  81,  84], kal: [60,  63,  66,  69,  72,  75,  78,  81,  84,  87,  90,  93,  96], bra: [48,  51,  54,  57,  60,  63,  66,  69,  72,  75,  78,  81,  84], pizz: [36,  39,  42,  45,  48,  51,  54,  57,  60,  63,  66,  69,  72,  75,  78,  81,  84], blech: [46,  49,  52,  55,  58,  61,  64,  67,  70,  73,  76,  79,  82], xyl: [65,  68,  71,  74,  77,  80,  83,  86,  89,  92,  95,  98,  101,  104], pfeife: [72,  75,  78,  81,  84,  87,  90,  93,  96], ooh: [48,  51,  54,  57,  60,  63,  66,  69,  72,  75,  78],
    vln: [55, 57, 59, 62, 66, 69, 72, 76, 79, 83, 86], vc: [36, 40, 43, 47, 50, 53, 57, 60, 64, 67, 71, 74, 77],
    spic: [36, 40, 43, 47, 50, 53, 57, 60, 64, 67, 71, 74, 77], horn: [36, 39, 43, 46, 50, 53, 57, 60],
    fl: [60, 64, 69, 72, 76, 81, 84, 88, 93, 96], flst: [69, 72, 76, 81, 84, 88, 93, 96],
    harfe: [28, 31, 35, 38, 41, 45, 48, 52, 55, 59, 62, 65, 69, 72, 76, 79, 83, 86, 89, 93, 95, 98, 101], glock: [79, 84, 91, 96, 103, 108],
    gitarre: [36, 39, 42, 45, 48, 51, 54, 57, 60, 63, 66, 69, 72, 75, 78, 81, 84], dudel: [60, 63, 66, 69, 72, 75, 78, 81, 84, 87],
    pan: [60, 63, 66, 69, 72, 75, 78, 81, 84, 87, 90], stimme: [57, 60, 63, 66, 69, 72, 75, 78, 81, 84, 87], oka: [60, 63, 66, 69, 72, 75, 78, 81, 84, 87, 90],
    fag: [34,  37,  41,  45,  46,  48,  55,  60,  63,  68,  69,  72], pos: [34,  37,  39,  41,  46,  50,  53,  60,  61,  63,  65], vctrem: [36,  40,  43,  50,  53,  57,  59,  60,  64,  67,  71,  74,  77], trp: [53,  57,  60,  63,  67,  70,  74,  77,  81,  84], oboest: [58,  62,  65,  70,  74,  77,  82,  89], kb: [28,  30,  31,  34,  36,  38,  40,  42,  44,  45,  49,  52,  56,  59], geigest: [55,  57,  60,  64,  67,  69,  72,  76,  79,  81,  84,  88,  91,  93,  96], geige: [55,  57,  60,  64,  67,  69,  72,  76,  79,  81,  84,  88,  91,  93,  96], tuba: [34,  39,  41,  46,  50,  53,  58], klar: [50,  53,  58,  62,  65,  70,  74,  77,  82,  86,  90], orgel: [36,  42,  48,  54,  60,  66,  72,  78,  84,  90,  96], vlntrem: [55,  57,  59,  62,  69,  72,  76,  79,  83,  86], oboe: [58,  62,  65,  70,  74,  77,  82,  86,  89] };
  /* Stimmung der Aufnahmen, nachgemessen (Cent zu hoch +, zu tief −): einige Flöten, die Harfe und manche Streicher waren
     bis zu 25 Cent verstimmt, eine Klarinetten-Aufnahme sogar einen Halbton – das wird beim Abspielen ausgeglichen */
  const STIMM_KORR = {"akk":{"80":6,"83":6,"86":6,"89":11},"hack":{"63":7,"66":5},"cel":{"84":10,"87":10,"96":6,"99":6,"102":6,"105":6,"108":6},"pizz":{"36":-24,"39":-11,"42":22,"45":24,"48":20,"51":22,"57":12,"60":5,"69":-13,"72":7,"78":-12,"81":-21},"blech":{"61":5,"64":5},"vln":{"69":5,"62":6,"66":-5},"vc":{"40":-11,"53":16},"spic":{"36":-6,"40":-8,"53":-16,"57":6,"60":23,"64":-9,"67":-18,"71":-7,"74":-7,"77":7,"43":-5},"harfe":{"28":-22,"31":-27,"35":-17,"38":-6,"41":-7,"45":-5,"52":-5,"55":-11,"59":-14,"62":-13,"69":-9,"72":-12,"76":-11,"79":-5,"83":-9,"86":-8,"89":-6,"93":-19,"95":-11,"98":-8,"101":-30},"vctrem":{"36":-6,"40":10,"50":5,"53":-5,"57":7,"59":23,"64":12,"67":-12,"71":-10,"74":-8,"77":14},"trp":{"53":-7,"67":10,"74":7,"81":9},"oboest":{"89":-13},"kb":{"30":-22,"34":-7,"36":-20,"38":7,"40":-14,"42":-5,"56":-28,"59":-13},"geigest":{"55":6,"60":-9,"72":6,"76":5,"84":5,"91":6},"geige":{"60":22,"64":7,"67":-5,"76":7,"79":7,"88":8,"84":-5},"tuba":{"50":-6,"53":-6,"58":8},"orgel":{"36":-10},"vlntrem":{"57":-11,"69":-8,"72":8,"79":-8},"flst":{"72":-8,"88":-17,"93":-7},"klar":{"65":6,"77":6,"86":6,"90":-98},"stimme":{"84":-10,"87":-10},"horn":{"39":-7,"50":-9,"53":-7},"bfl":{"60":13,"75":10,"78":8,"84":7,"87":7,"90":7,"93":7,"96":6,"63":10,"66":6,"69":5,"72":5},"pic":{"74":7,"77":8,"95":8},"pfeife":{"72":18,"81":6,"84":-7,"87":11,"90":15,"93":11},"shaku":{"55":-8,"58":-8,"61":-8,"64":-5},"eh":{"55":7,"64":-9,"67":9,"70":-7,"76":-8,"79":-9},"bra":{"54":14,"84":-6,"60":7,"63":-6,"81":9},"glock":{"79":8,"84":12,"91":12,"96":15,"103":16,"108":24}};
  const sampleBuf = new Map(), sampleLaedt = new Map();
  const sampleBasis = (() => { const sk = document.querySelector('script[src*="lautenwerk"]'); return sk ? sk.src.replace(/lautenwerk\.js.*$/, "klang/") : "klang/"; })();
  function sampleLaden(name) {
    if (sampleBuf.has(name)) return Promise.resolve(sampleBuf.get(name));
    if (sampleLaedt.has(name)) return sampleLaedt.get(name);
    if (!ctx || rendert) return Promise.resolve(null);
    const c = ctx;
    const pr = fetch(sampleBasis + encodeURIComponent(name) + ".mp3").then(r => r.ok ? r.arrayBuffer() : Promise.reject(r.status))
      .then(ab => new Promise((res, rej) => { const x = c.decodeAudioData(ab, res, rej); if (x && x.catch) x.catch(rej); }))
      .then(b => {
        /* Einsatz suchen: MP3 bringt am Anfang etwas Stille mit – die überspringen wir, damit alles im Takt sitzt */
        const d = b.getChannelData(0); let m = 0, i = 0, spitze = 0;
        for (let k = 0; k < d.length; k++) { const a = Math.abs(d[k]); if (a > m) { m = a; spitze = k; } }
        while (i < d.length && Math.abs(d[i]) < m * .02) i++;
        b._start = Math.max(0, i - b.sampleRate * .003) / b.sampleRate; b._spitze = spitze / b.sampleRate;
        sampleBuf.set(name, b); return b;
      }).catch(() => { sampleLaedt.delete(name); return null; });
    sampleLaedt.set(name, pr); return pr;
  }
  /* Lautstärke der Aufnahmen aus dem FluidR3-Klangsatz, abgestimmt auf die bisherigen Klänge */
  const PEGEL_ECHT = { laute: .5, dudelsack: .45, panfloete: .26, okarina: .26, bass: .6, gesang: .4, drehleier: .8,
    trommel: 1.15, bodhran: 1.1, stoecke: 1.3, schelle: .5, klopf: 1, rassel: .65 };
  /* Schlagwerk aus Aufnahmen: [betonter Schlag, normaler Schlag] */
  const SCHLAG_PROBE = { trommel: ["snare1", "snare2"], bodhran: ["bodh1", "bodh2"], stoecke: ["clave1", "clave2"], schelle: ["schelle1", "schelle2"], klopf: ["holz1", "holz2"], rassel: ["shake", "shake"] };
  function schlagProbe(art, betont, zeit, ziel, laut) {
    const p = SCHLAG_PROBE[art]; if (!p || rendert) return false;
    return probe(p[betont ? 0 : 1], 0, zeit, ziel, PEGEL_ECHT[art] * (betont ? 1 : .8) * (laut || 1), { dauer: 1.2, aus: .25 });
  }
  const naechsteProbe = (gruppe, midi) => (SAMPLE_KARTE[gruppe] || []).reduce((b, m) => b == null || Math.abs(m - midi) < Math.abs(b - midi) ? m : b, null);
  function probenLaden(gruppe) { (SAMPLE_KARTE[gruppe] || [gruppe]).forEach(m => sampleLaden(SAMPLE_KARTE[gruppe] ? gruppe + "_" + m : gruppe)); }
  /* eine Aufnahme spielen: o = { ein, aus, dauer, pan } – gibt false zurück, wenn sie noch nicht geladen ist */
  function probe(gruppe, midi, zeit, ziel, laut, o) {
    if (rendert || !ctx) return false;
    o = o || {};
    const m = SAMPLE_KARTE[gruppe] ? naechsteProbe(gruppe, midi) : null, name = m == null ? gruppe : gruppe + "_" + m, b = sampleBuf.get(name);
    if (!b) { sampleLaden(name); return false; }
    const src = ctx.createBufferSource(), g = ctx.createGain();
    src.buffer = b; if (m != null) src.playbackRate.value = Math.pow(2, (midi - m) / 12 - ((STIMM_KORR[gruppe] && STIMM_KORR[gruppe][m]) || 0) / 1200);
    const rate = src.playbackRate.value, lang = (b.duration - b._start) / rate, ein = o.ein || .004;
    const dauer = Math.min(lang, o.dauer || lang), aus = Math.min(o.aus || .2, dauer * .5), ende = zeit + dauer;
    g.gain.setValueAtTime(0, zeit); g.gain.linearRampToValueAtTime(laut, zeit + ein);
    if (o.dauer && o.dauer < lang) { g.gain.setValueAtTime(laut, Math.max(zeit + ein, ende - aus)); g.gain.linearRampToValueAtTime(0, ende); }
    src.connect(g); g.connect(ziel);
    src.start(zeit, b._start + (o.versatz || 0)); src.stop(ende + .05);
    return true;
  }

  /* ---------- Orchester: Streicherteppich, treibende Celli, Hörner und große Schläge ----------
     Je Stimmung ein Profil. Über die Teile eines Durchgangs baut sich das Orchester auf und gipfelt im
     Höhepunkt (Teil D bzw. dem letzten Teil): davor Paukenwirbel und anschwellendes Becken, darauf Becken und große Trommel. */
  /* pad = Teppich (Stärke), farbe = welche Instrumente ihn spielen, ost = treibende Celli, horn/trp/pos = Blech im Höhepunkt,
     tuba = tiefes Fundament, amboss = Schmiedeschläge, glanz = Glöckchen, gross = große Schläge (2 Becken+Trommel, 1 Gong bzw. Pauke) */
  const ORCH = {
    kampf: { pad: .8, ost: 1, horn: 1, trp: 1, pos: 1, gross: 2 }, sieg: { pad: .8, horn: 1, trp: 1, gross: 2 },
    reiter: { pad: .7, ost: 1, horn: 1, trp: 1, gross: 2 }, zwerge: { pad: .7, horn: 1, pos: 1, tuba: 1, amboss: 1, gross: 2, tief: 1 },
    spannung: { pad: .6, farbe: "trem", ost: 1, gross: 1 }, unterreich: { pad: .6, farbe: "trem", tief: 1, tuba: 1, gross: 1, gong: 1 },
    elben: { pad: .7, hoch: 1, glanz: 1 }, boss: { pad: .9, ost: 1, horn: 1, trp: 1, pos: 1, tuba: 1, amboss: 1, gross: 2, tief: 1 },
    grusel: { pad: .55, farbe: "trem", tief: 1, gross: 1, gong: 1 }, klage: { pad: .6 }, hof: { pad: .55, horn: 1, trp: 1, gross: 1 },
    fey: { pad: .4, hoch: 1, glanz: 1 }, marktplatz: { pad: 0, volk: 1 }, pilger: { pad: .6, farbe: "orgel" }, reise: { pad: .5, gross: 1 },
    auenland: { pad: .45, farbe: "holz" }, shanty: { pad: .4, farbe: "holz" }, rast: { pad: .4, farbe: "holz" }, kamin: { pad: .35, farbe: "holz" },
    dorffest: { pad: 0, volk: 1 }, trinklied: { pad: 0, volk: 1 },
    heldenlied: { pad: .7, horn: 1, trp: 1, pos: 1, gross: 2 }, verfolgung: { pad: .8, ost: 1, horn: 1, gross: 2 }, ruinen: { pad: .6, hoch: 1, glanz: 1, gong: 1, gross: 1 }
  };
  const PAD_FARBE = { ooh: ["ooh", "ooh"], bratsche: ["vc", "bra"], trem: ["vctrem", "vlntrem"], orgel: ["orgel", "orgel"], holz: ["fag", "klar"], blech: ["pos", "horn"], chor: ["stimme", "stimme"], holz2: ["klar", "fl"] };
  /* Klangfarbe des Teppichs: je Stimmung mehrere, gewählt nach dem Thema – mit jedem neuen Thema klingt der Hintergrund anders */
  const ORCH_FARBEN = { heldenlied: ["", "blech", "chor"], verfolgung: ["trem", "trem", ""], ruinen: ["chor", "holz2", "orgel", "ooh"], kampf: ["", "blech"], boss: ["", "blech", "chor", "ooh"], spannung: ["trem", "chor"], grusel: ["trem", "chor", "ooh"], unterreich: ["trem", "chor", "orgel"],
    elben: ["", "chor", "holz2", "ooh"], klage: ["", "chor", "holz", "bratsche"], pilger: ["orgel", "chor", "ooh"], hof: ["", "blech", "holz2", "bratsche"], zwerge: ["", "blech", "chor"],
    auenland: ["holz", "holz2"], shanty: ["holz", "chor"], rast: ["holz", "holz2"], kamin: ["holz", "holz2", "", "bratsche"], reise: ["", "holz2"], sieg: ["", "blech"], reiter: ["", "blech"], fey: ["", "holz2"] };
  function orchFarbe(pr) {
    const l = stilKey() && ORCH_FARBEN[stilKey()];
    if (!l) return pr ? pr.farbe : "";
    const m = (S.teile && TEILE.map(p => S.teile[p] && S.teile[p].melodie).find(x => x && x.some(v => v >= 0))) || [], h = m.reduce((a, v, i) => a + (v + 2) * (i + 7), 0);
    return l[h % l.length];
  }
  /* der Teppich soll nicht dieselbe Klangfarbe haben wie Echo oder die Kapelle – sonst spielen zwei gleiche Stimmen dieselben Töne */
  function orchFrei(fa) {
    const e = S.band.floete, kap = (() => { try { return kapSpieler().map(p => p.inst); } catch (_) { return []; } })();
    if ((fa === "chor" || fa === "ooh") && (e === "gesang" || e === "oohchor" || kap.includes("ooh"))) return "";
    if (fa === "holz2" && (e === "floete" || e === "blockfloete" || e === "piccolo" || e === "klarinette" || kap.includes("bfl"))) return e === "klarinette" ? "" : "holz";
    if (fa === "holz" && (e === "klarinette" || e === "oboe" || e === "englischhorn")) return "";
    if (fa === "blech" && (e === "horn" || kap.includes("blech"))) return "";
    if (fa === "bratsche" && (e === "bratsche" || kap.includes("bra"))) return "";
    return fa;
  }
  const orchProfil = () => S.orchester !== 0 && stilKey() && ORCH[stilKey()] ? ORCH[stilKey()] : null;
  let orchBus = null, orchPan = {}, padAkkord = -1, padEnde = 0;
  function orchAufbauen() {
    if (orchBus || !ctx) return;
    orchBus = ctx.createGain(); orchBus.gain.value = 1; orchBus.connect(pumpZiel());
    const hs = ctx.createGain(); hs.gain.value = .7; orchBus.connect(hs); hs.connect(hallHP || hallEin); orchHall = hs; hallProfilAnwenden();
    [["vln", -.35], ["vc", .3], ["horn", .12], ["blech", .22], ["holz", -.18], ["gross", 0]].forEach(([k, p]) => {
      let n = ctx.createGain();
      if (!leicht() && ctx.createStereoPanner) { const pn = ctx.createStereoPanner(); pn.pan.value = p; pn.connect(orchBus); n.connect(pn); } else n.connect(orchBus);
      orchPan[k] = n;
    });
  }
  function orchVorladen() {
    const pr = orchProfil();
    if (S.instrument === "harfe") probenLaden("harfe");
    if (S.instrument === "glocken") probenLaden("glock");
    if (S.instrument === "fidel") { probenLaden("geige"); probenLaden("geigest"); }
    if (S.instrument === "laute") probenLaden("gitarre");
    if (S.instrument === "dudelsack") probenLaden("dudel");
    if (!pr || pr.volk) probenLaden("gitarre"); /* Barradins Basssaiten in den Liedern */
    if (S.band.floete === "panfloete") probenLaden("pan");
    if (S.band.floete === "okarina") probenLaden("oka");
    if (S.band.floete === "gesang") probenLaden("stimme");
    if (S.instrument === "mandoline") probenLaden("gitarre");
    if (S.instrument === "drehleier") probenLaden("geige");
    [S.band.trommel, S.band.ketten, "schelle", "klopf"].forEach(a => (SCHLAG_PROBE[a] || []).forEach(sampleLaden));
    if (S.instrument === "schalmei") { probenLaden("oboe"); probenLaden("oboest"); }
    if (MEL_NEU[S.instrument]) probenLaden(MEL_NEU[S.instrument][0]);
    if (ECHO_NEU[S.band.floete]) probenLaden(ECHO_NEU[S.band.floete][0]);
    if (S.band.trommel === "taiko") probenLaden("taiko");
    try { kapelleVorladen(); } catch (_) {}
    if (S.band.trommel === "tamburin") { sampleLaden("tamb1"); sampleLaden("tamb2"); }
    if (S.band.floete === "floete") { probenLaden("fl"); probenLaden("flst"); }
    if (S.band.floete === "horn") probenLaden("horn");
    if (S.band.floete === "klarinette") probenLaden("klar");
    if (S.band.floete === "oboe") probenLaden("oboe");
    { const f = orchFrei(orchFarbe(pr)); (PAD_FARBE[f] || ["vc", "vln"]).forEach(probenLaden); }
    if (S.band.trommel === "pauke") { sampleLaden("timp1"); sampleLaden("timp3"); }
    if (!pr) return;
    if (!pr.volk) probenLaden("kb");
    if (pr.pad) (PAD_FARBE[pr.farbe] || ["vc", "vln"]).forEach(probenLaden);
    if (pr.ost) probenLaden("spic");
    if (pr.horn) probenLaden("horn");
    if (pr.trp) probenLaden("trp");
    if (pr.pos) probenLaden("pos");
    if (pr.tuba) probenLaden("tuba");
    if (pr.amboss) sampleLaden("amboss");
    if (pr.glanz) sampleLaden("gloeckchen");
    if (pr.gong) { sampleLaden("gong"); sampleLaden("bogen"); }
    if (pr.gross) ["timproll", "crash", "swell", "bd", "timp1"].forEach(sampleLaden);
  }
  /* Akkordtöne zur Bass-Zeile: Grundton, Terz, Quinte als MIDI-Noten */
  function akkordMidi(zeile) {
    const sk = MODI[S.modus], d = BASS_STUFEN[zeile || 0], st = i => sk[i % 7] + 12 * Math.floor(i / 7), tr = S.transpose + hebung;
    return { grund: BASS_GRUND + 12 + tr + st(d), terz: MEL_GRUND + tr + st(d + 2), quinte: MEL_GRUND + tr + st(d + 4), q2: BASS_GRUND + 12 + tr + st(d + 4) };
  }
  /* Rollen im laufenden Lied: Abschnitt = Teile derselben Rolle hintereinander (eine Wiederholung beginnt einen neuen) */
  const DUNKEL = ["grusel", "unterreich", "spannung", "ruinen"];
  const rolleAn = ab => rolleVon(S, S.ablauf[ab] || "A");
  const abschnittAnfang = ab => ab === 0 || rolleAn(ab) !== rolleAn(ab - 1) || S.ablauf[ab] <= S.ablauf[ab - 1];
  function sektionNr(ab) { let n = 0; for (let i = 1; i <= ab; i++) if (abschnittAnfang(i)) n++; return n; }
  function hoehepunkt() {
    if (S.rollen) { for (let i = 0; i < S.ablauf.length; i++) if (rolleAn(i) === "h") return i; return S.ablauf.length - 1; }
    const i = S.ablauf.indexOf("D"); return i >= 0 ? i : S.ablauf.length - 1;
  }
  const istHoch = ab => S.rollen ? rolleAn(ab) === "h" : ab === hoehepunkt();
  const AUFBAU = { i: .3, s: .4, v: .65, r: .82, b: .5, h: 1 };
  /* wie weit das Orchester in diesem Teil schon „aufgebaut“ ist: 0 (Anfang) … 1 (Höhepunkt) */
  function aufbau(ab) {
    if (S.rollen) return AUFBAU[rolleAn(ab)] || .5;
    const c = hoehepunkt(), L = S.ablauf.length;
    if (L <= 2) return ab === c ? 1 : .6;
    return ab < c ? .25 + .75 * ab / Math.max(1, c) : ab === c ? 1 : .7;
  }
  function orchesterSchritt(zeit, daten, ab) {
    const pr = orchProfil(); if (!pr || !ctx || S.mute.bass) return;
    orchAufbauen();
    const x = aufbau(ab), int = S.intensitaet / 10, sd = schrittDauer(), c = hoehepunkt(), bar = taktL() * sd;
    const zeile = klingt(daten.bass, schritt), ak = akkordMidi(zeile);
    /* Teppich: bei jedem Akkordwechsel (und zu jedem Takt) neu, gehalten bis zum nächsten Wechsel */
    if (pr.pad && x >= .25 && (schritt % 8 === 0 || zeile !== padAkkord) && (zeile !== padAkkord || schritt === 0 || zeit >= padEnde - .05)) {
      let n = 1; while (n < taktL() - schritt && klingt(daten.bass, schritt + n) === zeile) n++;
      const dauer = n * sd + .35, l = pr.pad * (.5 + .5 * x) * (.6 + .5 * int) * (gastJetzt.length ? .72 : 1); /* Platz für die Gäste */
      const fa = orchFrei(orchFarbe(pr)), vl = pr.tief ? -12 : pr.hoch ? 12 : 0, [tief, hoch] = PAD_FARBE[fa] || ["vc", "vln"];
      const pt = fa === "holz" || fa === "holz2" ? orchPan.holz : fa === "blech" ? orchPan.horn : orchPan.vc, ph = fa === "holz" || fa === "holz2" ? orchPan.holz : fa === "blech" ? orchPan.horn : orchPan.vln;
      const fk = { orgel: .45, holz: .8, holz2: .7, blech: .62, chor: .75, ooh: .8, bratsche: .9 }[fa] || 1, hk = fa === "holz" || fa === "chor" || fa === "blech" ? -12 : 0;
      oprobe(tief, ak.grund, zeit, pt, .3 * l * fk, { ein: .28, aus: .45, dauer });
      if (!pr.tief || x > .6) {
        /* der Teppich bleibt unter Barradins Melodie (außer bei den Stimmungen, die oben schimmern sollen) */
        const r = MEL_GRUND + S.transpose, unter = m => pr.hoch ? m : inLage(m, r - 6, r + 8);
        oprobe(hoch, unter(ak.terz + vl + hk), zeit, ph, (leicht() ? .26 : .2) * l * fk, { ein: .32, aus: .5, dauer });
        if (!leicht()) oprobe(hoch, unter(ak.quinte + vl + hk), zeit, ph, .18 * l * fk, { ein: .36, aus: .5, dauer });
      }
      padAkkord = zeile; padEnde = zeit + dauer;
    }
    /* treibende Celli (Spiccato-Achtel) ab der Hälfte des Aufbaus */
    if (pr.ost && x >= .5 && S.intensitaet >= (leicht() ? 6 : 3) && schritt % 2 === 0) {
      const ton = [ak.grund - 12, ak.grund - 12, ak.q2 - 12, ak.grund - 12][(schritt / 2) % 4];
      oprobe("spic", ton, zeit, orchPan.vc, (.22 + .12 * int) * (schritt % 4 === 0 ? 1 : .75), { dauer: sd * 1.8, aus: .05 });
    }
    /* Hörner im Höhepunkt (bei hoher Intensität schon früher) */
    if (pr.horn && (istHoch(ab) || (S.rollen && rolleAn(ab) === "r" && S.intensitaet >= 6) || S.intensitaet >= 8) && schritt % 8 === 0) {
      oprobe("horn", ak.grund - 12 + 12, zeit, orchPan.horn, .26 * (.6 + .5 * int), { ein: .12, aus: .35, dauer: 8 * sd + .2 });
      oprobe("horn", ak.q2, zeit, orchPan.horn, .18 * (.6 + .5 * int), { ein: .14, aus: .35, dauer: 8 * sd + .2 });
    }
    /* Blech im Höhepunkt: Trompeten auf Terz und Quinte, Posaune auf dem Grundton */
    if (istHoch(ab) && schritt % 8 === 0 && (pr.trp || pr.pos)) {
      const bl = .2 * (.6 + .5 * int), d8 = 8 * sd + .15;
      const r = MEL_GRUND + S.transpose, tl = m => inLage(m, r - 4, r + 8);
      if (pr.trp) { oprobe("trp", tl(ak.terz), zeit, orchPan.blech, bl * 1.3, { ein: .05, aus: .3, dauer: d8 }); oprobe("trp", tl(ak.quinte), zeit, orchPan.blech, bl * 1.1, { ein: .05, aus: .3, dauer: d8 }); }
      if (pr.pos) oprobe("pos", ak.grund, zeit, orchPan.blech, bl * 1.1, { ein: .06, aus: .3, dauer: d8 });
    }
    /* Tuba als tiefes Fundament, sobald sich das Stück aufgebaut hat */
    if (pr.tuba && x >= .5 && schritt === 0) oprobe("tuba", ak.grund - 12, zeit, orchPan.blech, .26 * (.6 + .5 * int), { ein: .12, aus: .4, dauer: bar + .1 });
    /* Zwergenschmiede: Amboss auf Eins und Drei */
    if (pr.amboss && x >= .5 && schritt % 8 === 0) oprobe("amboss", 0, zeit, orchPan.vc, (schritt === 0 ? .2 : .14) * (.6 + .5 * int));
    /* Elben: ab und zu ein Schimmer aus Glöckchen */
    if (pr.glanz && schritt === 0 && Math.random() < .35) oprobe("gloeckchen", 0, zeit, orchPan.vln, .18);
    /* große Momente: Takt vor dem Höhepunkt Wirbel und Schwellen, auf der Eins des Höhepunkts der Schlag */
    if (pr.gross && schritt === 0 && durchgang % (pr.gross > 1 ? 2 : 3) === 0) {
      const L = S.ablauf.length, vorher = (c - 1 + L) % L, hochAnfang = S.rollen ? istHoch(ab) && abschnittAnfang(ab) : ab === c;
      if ((S.rollen ? !istHoch(ab) && istHoch((ab + 1) % L) : ab === vorher) && L > 1) {
        oprobe("timproll", 0, zeit, orchPan.gross, pr.gross > 1 ? .5 : .3, { ein: .4, dauer: bar, aus: .1 });
        const sw = sampleBuf.get("swell");
        if (pr.gong) oprobe("bogen", 0, zeit, orchPan.gross, .22, { ein: .6, dauer: bar + .05, aus: .05 });
        if (sw && pr.gross > 1) { const v = Math.max(0, sw._spitze - sw._start - bar); oprobe("swell", 0, zeit, orchPan.gross, .32, { ein: .05, dauer: bar + .05, aus: .05, versatz: v }); }
        else if (!sw) sampleLaden("swell");
      }
      if (hochAnfang && L > 1) {
        if (pr.gross > 1) { oprobe("crash", 0, zeit, orchPan.gross, .38); oprobe("bd", 0, zeit, orchPan.gross, .55); }
        oprobe("timp1", 0, zeit, orchPan.gross, pr.gross > 1 ? .55 : .35);
        if (pr.gong) oprobe("gong", 0, zeit, orchPan.gross, .32);
      }
    }
  }


  /* ---------- Klassiker-Memes: gemeinfreie Melodien, gespielt von unseren echten Instrumenten ----------
     Jedes Stück ist eine kleine Partitur: n(Instrument, Ton, Beginn, Dauer, Lautstärke, Optionen). */
  const TONNAME = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  const ton = x => { const m = /^([A-G])([#b]?)(-?\d)$/.exec(x); return 12 * (+m[3] + 1) + TONNAME[m[1]] + (m[2] === "#" ? 1 : m[2] === "b" ? -1 : 0); };
  /* Melodie aus [Ton|null, Dauer] – gibt die Endzeit zurück */
  function linie(n, gr, t, liste, laut, o) {
    liste.forEach(([x, d]) => { if (x) (Array.isArray(x) ? x : [x]).forEach(y => n(gr, ton(y), t, d * ((o && o.leg) || .92), laut, o)); t += d; });
    return t;
  }
  /* Hilfen für die Partituren: Tonfolge in Achteln (Faktor e), Ton eine/zwei Oktaven verschoben */
  const okt = (x, k) => x && (Array.isArray(x) ? x.map(y => okt(y, k)) : x.replace(/-?\d$/, o => +o + k));
  const achtel = (liste, e) => liste.map(([x, d]) => [x, d * e]);
  const KLASSIK = {
    bergkoenig(n) { /* Grieg: In der Halle des Bergkönigs – das Thema kehrt immer schneller und lauter wieder */
      const A = [["B3", 1], ["C#4", 1], ["D4", 1], ["E4", 1], ["F#4", 1], ["D4", 1], ["F#4", 2], ["E#4", 1], ["C#4", 1], ["E#4", 2], ["E4", 1], ["C4", 1], ["E4", 2],
        ["B3", 1], ["C#4", 1], ["D4", 1], ["E4", 1], ["F#4", 1], ["D4", 1], ["F#4", 1], ["B4", 1], ["A4", 1], ["F#4", 1], ["D4", 1], ["F#4", 1], ["A4", 4]];
      const F = [["F#4", 1], ["G#4", 1], ["A#4", 1], ["B4", 1], ["C#5", 1], ["A#4", 1], ["C#5", 2], ["D5", 1], ["A#4", 1], ["D5", 2], ["C#5", 1], ["A#4", 1], ["C#5", 2],
        ["F#4", 1], ["G#4", 1], ["A#4", 1], ["B4", 1], ["C#5", 1], ["A#4", 1], ["C#5", 1], ["F#5", 1], ["E5", 1], ["C#5", 1], ["A#4", 1], ["C#5", 1], ["E5", 4]];
      const runden = [
        { e: .24, mel: [["fag", 0, .45]], bass: ["kb", .3] },
        { e: .2, mel: [["fag", 0, .4], ["spic", 0, .3]], bass: ["kb", .35] },
        { e: .165, mel: [["geigest", 1, .4], ["spic", 0, .35]], bass: ["kb", .4], horn: 1 },
        { e: .13, mel: [["geigest", 1, .45], ["spic", 0, .4], ["trp", 0, .2]], bass: ["tuba", .35], horn: 1, pauke: 1 }];
      let t = 0;
      runden.forEach(r => {
        [A, F].forEach(teil => {
          const start = t;
          r.mel.forEach(([gr, o, l]) => { t = linie(n, gr, start, achtel(teil.map(([x, d]) => [okt(x, o), d]), r.e), l, { kurz: 1, leg: .6 }); });
          for (let i = 0; i < 16; i++) {
            const z = start + i * 2 * r.e, grund = teil === A ? (i % 8 < 4 ? "B1" : "F#1") : (i % 8 < 4 ? "F#1" : "C#2");
            n(r.bass[0], ton(grund) + (r.bass[0] === "tuba" ? 12 : 12), z, r.e, r.bass[1], { kurz: 1 });
            if (r.horn && i % 4 === 0) n("horn", ton(teil === A ? "D4" : "C#4"), z, 4 * r.e, .2);
            if (r.pauke && i % 2 === 0) n("timp1", 0, z, 0, .3);
          }
        });
      });
      /* Schluss: wuchtige Akkordschläge */
      [0, .45, .9, 1.35, 1.65, 1.95].forEach((d, k) => {
        ["B2", "F#3", "B3", "D4", "F#4"].forEach(x => n(k % 2 ? "trp" : "horn", ton(x), t + d, .25, .22));
        n("crash", 0, t + d, 0, .2 + .03 * k); n("timp1", 0, t + d, 0, .45); n("bd", 0, t + d, 0, .3);
      });
      ["B2", "F#3", "B3", "D4", "F#4", "B4"].forEach(x => { n("trp", ton(x), t + 2.4, 1.6, .25); n("vln", ton(x) + 12, t + 2.4, 1.6, .15); });
      n("crash", 0, t + 2.4, 0, .4); n("gong", 0, t + 2.4, 0, .3); n("timproll", 0, t + 2.4, 0, .3);
    },
    toccata(n) { /* Bach: Toccata d-Moll – die berühmte Eröffnung */
      let t = 0;
      const ruf = o => {
        t = linie(n, "orgel", t, [[["A" + (4 + o), "A" + (5 + o)], .11], [["G" + (4 + o), "G" + (5 + o)], .11], [["A" + (4 + o), "A" + (5 + o)], 1.3], [null, .45],
          [["G" + (4 + o), "G" + (5 + o)], .12], [["F" + (4 + o), "F" + (5 + o)], .12], [["E" + (4 + o), "E" + (5 + o)], .12], [["D" + (4 + o), "D" + (5 + o)], .14],
          [["C#" + (4 + o), "C#" + (5 + o)], .8], [["D" + (4 + o), "D" + (5 + o)], 1.6], [null, .5]], .28, { leg: .98 });
      };
      ruf(0); ruf(-1); ruf(-2);
      /* der schaurige, von unten aufgebaute Akkord über dem Orgelpunkt */
      n("orgel", ton("D2"), t, 7, .3);
      ["C#3", "E3", "G3", "Bb3", "C#4", "E4", "G4", "Bb4"].forEach((x, i) => n("orgel", ton(x), t + .5 + i * .14, 3.4 - i * .14, .17));
      t += 4;
      ["D3", "F3", "A3", "D4", "F4", "A4"].forEach(x => n("orgel", ton(x), t, 2.4, .2));
      t += 2.6;
      /* rasende Läufe */
      for (let r = 0; r < 4; r++) {
        const lauf = ["A5", "G5", "F5", "E5", "D5", "C#5", "D5", "E5", "F5", "E5", "D5", "C#5"].map(x => [okt(x, -Math.floor(r / 2)), .085]);
        t = linie(n, "orgel", t, lauf, .22, { leg: .95 });
      }
      n("orgel", ton("A1") + 12, t - 1.2, 1.2, .25);
      ["C#3", "E3", "G3", "A3", "C#4", "E4"].forEach(x => n("orgel", ton(x), t, 1.2, .18)); n("orgel", ton("A1") + 12, t, 1.2, .3);
      t += 1.3;
      ["D3", "F3", "A3", "D4", "F4", "A4", "D5"].forEach(x => n("orgel", ton(x), t, 3.5, .2)); n("orgel", ton("D2"), t, 3.5, .35);
    },
    zarathustra(n) { /* Strauss: Also sprach Zarathustra – Sonnenaufgang */
      n("orgel", ton("C2"), 0, 31, .28); n("kb", ton("C2"), 0, 2, .3);
      const pauke = t0 => [0, .28, .56, .84, 1.12, 1.4, 1.68, 1.96, 2.24, 2.52].forEach((d, k) => n(k % 2 ? "timp3" : "timp1", 0, t0 + d, 0, .3 + .025 * k));
      const aufstieg = (t0, a, b) => {
        n("trp", ton("C4"), t0, 1.3, .38); n("trp", ton("G4"), t0 + 1.3, 1.3, .38); n("trp", ton("C5"), t0 + 2.6, 1.9, .42); n("swell", 0, t0 + 2.6, 0, .18);
        ["C3", "G3", "C4", a[0]].forEach(x => n("vc", ton(x), t0 + 2.6, .55, .22)); n("trp", ton(a[1]), t0 + 2.6, .55, .4); n("horn", ton(a[0]), t0 + 2.6, .55, .25);
        ["C3", "G3", "C4", b[0]].forEach(x => n("vc", ton(x), t0 + 3.15, 1.2, .22)); n("trp", ton(b[1]), t0 + 3.15, 1.2, .4); n("horn", ton(b[0]), t0 + 3.15, 1.2, .25);
        pauke(t0 + 4.4);
      };
      aufstieg(.3, ["E4", "E5"], ["Eb4", "Eb5"]);
      aufstieg(7.6, ["Eb4", "Eb5"], ["E4", "E5"]);
      /* dritter Aufstieg mit dem großen Höhepunkt */
      const t3 = 14.9;
      n("trp", ton("C4"), t3, 1.2, .4); n("trp", ton("G4"), t3 + 1.2, 1.2, .4); n("trp", ton("C5"), t3 + 2.4, 1.2, .42);
      [["A4", 0], ["B4", .45], ["C5", .9], ["D5", 1.35]].forEach(([x, d]) => { n("trp", ton(x), t3 + 3.6 + d, .45, .38); n("vln", ton(x) + 12, t3 + 3.6 + d, .45, .15); });
      ["G3", "B3", "D4", "F4"].forEach(x => { n("horn", ton(x), t3 + 5.4, 1.4, .25); n("vc", ton(x) - 12, t3 + 5.4, 1.4, .2); }); n("trp", ton("E5"), t3 + 5.4, .7, .4); n("trp", ton("F5"), t3 + 6.1, .7, .4);
      n("timproll", 0, t3 + 5.4, 0, .35); n("swell", 0, t3 + 4.6, 0, .25);
      const z = t3 + 6.8;
      ["C4", "E4", "G4", "C5", "E5", "G5"].forEach(x => { n("trp", ton(x), z, 3.6, .26); n("vln", ton(x) + 12, z, 3.6, .14); });
      ["C3", "G3", "E4"].forEach(x => n("horn", ton(x), z, 3.6, .3)); ["C2", "C3", "G3"].forEach(x => n("orgel", ton(x) + 12, z, 7, .25));
      n("vc", ton("C3"), z, 3.6, .3); n("tuba", ton("C2") + 12, z, 3.6, .3);
      n("crash", 0, z, 0, .4); n("bd", 0, z, 0, .45); n("timp1", 0, z, 0, .5); n("gong", 0, z, 0, .3);
    },
    walkuere(n) { /* Wagner: Walkürenritt */
      const mot = (a, b, c, d) => [[a, .12], [b, .36], [a, .12], [b, .24], [c, .72], [b, .12], [c, .36], [b, .12], [c, .24], [d, .9]];
      let t = 0;
      /* Streicher wirbeln und galoppieren */
      const galopp = (t0, t1, grund) => { for (let x = t0; x < t1; x += .48) { n("spic", ton(grund), x, .12, .25, { kurz: 1 }); n("spic", ton(grund), x + .36, .12, .2, { kurz: 1 }); } };
      for (let x = 0; x < 2; x += .06) n("vlntrem", ton(["B4", "C#5", "D5", "F#5"][Math.floor(x / .5) % 4]), x, .5, .02);
      n("vlntrem", ton("B4"), 0, 2, .16); n("vctrem", ton("B2"), 0, 2, .2); galopp(0, 2, "B2");
      t = 2;
      [[["F#4", "B4", "D5", "F#5"], "B2", 1], [["A4", "D5", "F#5", "A5"], "D3", 1], [["F#4", "B4", "D5", "F#5"], "B2", 2],
        [["C#4", "F#4", "A4", "C#5"], "F#2", 2], [["E4", "A4", "C#5", "E5"], "A2", 2], [["F#4", "B4", "D5", "F#5"], "B2", 2]].forEach(([m, g, stufe]) => {
        const dauer = mot(...m).reduce((s, [, d]) => s + d, 0);
        linie(n, "horn", t, mot(...okt(m, -1)), .32, { leg: .9 });
        if (stufe > 1) { linie(n, "trp", t, mot(...m), .3, { leg: .9 }); linie(n, "pos", t, mot(...okt(m, -2)), .25, { leg: .9 }); }
        n("vlntrem", ton(okt(m[1], 0)), t, dauer, .14); n("vctrem", ton(g), t, dauer, .2); galopp(t, t + dauer, g);
        n("timp1", 0, t, 0, .3); n("timp1", 0, t + dauer - .9, 0, .3);
        t += dauer + .3;
      });
      ["B2", "F#3", "B3", "D4", "F#4", "B4"].forEach(x => { n("trp", ton(x), t, 2.2, .22); n("horn", ton(x) - 12, t, 2.2, .2); });
      n("crash", 0, t, 0, .35); n("timp1", 0, t, 0, .5); n("timproll", 0, t, 0, .3);
    },
    galopp(n) { /* Rossini: Wilhelm Tell, Finale */
      let t = 0;
      const gal = (x, k) => { for (let i = 0; i < (k || 3); i++) t = linie(n, "trp", t, [[x, .1], [x, .1], [x, .2]], .32, { kurz: 1, leg: .7 }); };
      n("trp", ton("E4"), 0, .2, .3); n("trp", ton("B4"), .2, .2, .3); n("trp", ton("E5"), .4, .6, .35); t = 1.2;
      const durchgang = voll => {
        const t0 = t;
        gal("E4"); t = linie(n, "trp", t, [["A4", .2], ["B4", .2], ["C#5", .6]], .34);
        gal("E4"); t = linie(n, "trp", t, [["A4", .2], ["C#5", .2], ["B4", .2], ["G#4", .2], ["E4", .6]], .34);
        gal("B4"); t = linie(n, "trp", t, [["B4", .2], ["C#5", .2], ["D#5", .6]], .34);
        gal("B4"); t = linie(n, "trp", t, [["C#5", .2], ["D#5", .2], ["C#5", .2], ["A#4", .2], ["F#4", .6]], .34);
        gal("E4"); t = linie(n, "trp", t, [["A4", .2], ["B4", .2], ["C#5", .6]], .34);
        gal("E4", 2); t = linie(n, "trp", t, [["A4", .2], ["G#4", .2], ["F#4", .2], ["B4", .2], ["E4", .8]], .36);
        for (let x = t0; x < t; x += .2) {
          n(Math.round(x / .2) % 2 ? "snare2" : "snare1", 0, x, 0, voll ? .22 : .14);
          n("spic", ton(Math.round(x / .4) % 2 ? "B2" : "E3"), x, .15, .2, { kurz: 1 });
          if (voll && Math.round(x / .2) % 4 === 0) { n("horn", ton("E3"), x + .1, .15, .15, { kurz: 1 }); n("horn", ton("G#3"), x + .1, .15, .12, { kurz: 1 }); }
        }
      };
      durchgang(false); durchgang(true);
      for (let k = 0; k < 4; k++) { ["E3", "B3", "E4", "G#4"].forEach(x => n("trp", ton(x), t + k * .4, k === 3 ? 1.4 : .2, .25)); n("timp1", 0, t + k * .4, 0, .4); }
      n("crash", 0, t + 1.2, 0, .35); n("bd", 0, t + 1.2, 0, .35);
    },
    zirkus(n) { /* Fučík: Einzug der Gladiatoren */
      const e = .11;
      const thema = (t, gr, o, l) => {
        [["E5", "D#5", "E5", "C5", "D#5", "E5", "C5"], ["C5", "B4", "C5", "A4", "B4", "C5", "A4"], ["A4", "G#4", "A4", "F4", "G#4", "A4", "F4"]].forEach(g => {
          t = linie(n, gr, t, g.map((x, i) => [okt(x, o), i === 6 ? 2 * e : e]).concat([[null, e]]), l, { kurz: 1 });
        });
        t = linie(n, gr, t, ["G4", "F#4", "F4", "E4", "D#4", "D4", "C#4", "C4"].map(x => [okt(x, o), e * .75]), l, { kurz: 1 });
        t = linie(n, gr, t, [[okt("D4", o), e], [okt("E4", o), e], [okt("F4", o), e], [okt("F#4", o), e], [okt("G4", o), 2 * e], [null, 2 * e]], l, { kurz: 1 });
        return t;
      };
      const umpa = (t0, t1, l) => { for (let k = 0; t0 + k * 2 * e < t1; k++) { const z = t0 + k * 2 * e; if (k % 2 === 0) n("tuba", ton(k % 4 ? "G2" : "C2") + 12, z, e * 1.5, l, { kurz: 1 }); else ["E4", "G4", "C5"].forEach(x => n("horn", ton(x) - 12, z, e * 1.2, l * .4, { kurz: 1 })); } };
      let t = 0;
      ["C4", "E4", "G4", "C5"].forEach((x, i) => n("trp", ton(x), i * .12, .1, .3)); n("crash", 0, .5, 0, .2); t = .9;
      let t2 = thema(t, "trp", 0, .3); umpa(t, t2, .3); t = t2;
      t2 = thema(t, "pos", -1, .38); umpa(t, t2, .3); t = t2;
      t2 = thema(t, "geigest", 0, .35); umpa(t, t2, .3); t = t2;
      t2 = thema(t, "trp", 0, .3); thema(t, "flst", 1, .2); umpa(t, t2, .35); for (let x = t; x < t2; x += 4 * e) n("snare2", 0, x, 0, .15); t = t2;
      n("trp", ton("G4"), t, e, .3); ["C4", "E4", "G4", "C5"].forEach(x => n("trp", ton(x), t + 2 * e, .7, .25)); n("tuba", ton("C2") + 12, t + 2 * e, .7, .35);
      n("crash", 0, t + 2 * e, 0, .3); n("timp1", 0, t + 2 * e, 0, .4);
    },
    trauermarsch(n) { /* Chopin: Trauermarsch */
      const q = 1.05;
      const satz = (a, hoch) => [[a, q], [a, q * .75], [a, q * .25], [a, q], [hoch[0], q * .75], [hoch[1], q * .25], [hoch[1], q * .75], [a, q * .25], [a, q * .75], [hoch[2], q * .25], [a, q * 1.6]];
      const A = satz("Bb3", ["Db4", "C4", "A3"]), B = satz("F4", ["Ab4", "G4", "E4"]);
      let t = 0;
      const begleit = (t0, takte, grund, l) => { for (let k = 0; k < takte * 2; k++) { n("tuba", ton(grund) + 12, t0 + k * q, q * .9, l); n("kb", ton(grund) + 12 + (k % 2 ? 7 : 0), t0 + k * q, q * .8, l); n("timp1", 0, t0 + k * q, 0, l * .9); } };
      [[A, "horn", "Bb1", .28], [A, "pos", "Bb1", .3], [B, "horn", "F1", .3], [A, "trp", "Bb1", .3]].forEach(([m, gr, g, l], i) => {
        linie(n, gr, t, m, .4, { leg: .85 }); linie(n, "vc", t, m, .22, { leg: .85 });
        if (i === 3) { linie(n, "vln", t, m.map(([x, d]) => [okt(x, 1), d]), .14, { leg: .85 }); n("orgel", ton("Bb2"), t, 8 * q, .2); }
        begleit(t, 4, g, l); t += 8.2 * q;
      });
      n("gong", 0, t - .4, 0, .3);
    },
    hochzeit(n) { /* Mendelssohn: Hochzeitsmarsch – Fanfare und Einzug */
      const ak = [["C3", "E3", "G3"], ["A2", "E3", "A3"], ["F2", "C3", "A3"], ["G2", "D3", "F3", "B3"], ["C3", "E3", "G3", "C4"], ["E2", "G#3", "B3", "E4"], ["A2", "E3", "A3", "C4"], ["D3", "F#3", "A3", "D4"], ["G2", "D3", "G3", "B3"]];
      ak.concat(ak).forEach((a, k) => {
        const t = k * 1.05 + (k > 8 ? .6 : 0);
        linie(n, "trp", t, [["C5", .11], ["C5", .11], ["C5", .11], [k % 9 === 8 ? "B4" : "C5", k % 9 === 8 ? 1.4 : .7]], k > 8 ? .36 : .3);
        a.forEach(x => { n("horn", ton(x), t + .33, k % 9 === 8 ? 1.4 : .7, .16); n("pos", ton(x) - 12, t + .33, k % 9 === 8 ? 1.4 : .7, .1); if (k > 8) n("vln", ton(x) + 12, t + .33, k % 9 === 8 ? 1.4 : .7, .1); });
        n("timp1", 0, t + .33, 0, .25);
      });
      const t = 18 * 1.05 + 1.6;
      [["C3", "E3", "G3", "C4", "E4", "G4", "C5"]].forEach(a => a.forEach(x => { n("trp", ton(x), t, 2.4, .2); n("vln", ton(x) + 12, t, 2.4, .12); }));
      n("orgel", ton("C2") + 12, t, 2.4, .25); n("crash", 0, t, 0, .3); n("timp1", 0, t, 0, .45);
    },
    elise(n) { /* Beethoven: Für Elise */
      const s = .19;
      const A1 = [["E5", s], ["D#5", s], ["E5", s], ["D#5", s], ["E5", s], ["B4", s], ["D5", s], ["C5", s], ["A4", 3 * s], ["C4", s], ["E4", s], ["A4", s], ["B4", 3 * s], ["E4", s], ["G#4", s], ["B4", s], ["C5", 3 * s], ["E4", s]];
      const A2 = A1.slice(0, 13).concat([["E4", s], ["C5", s], ["B4", s], ["A4", 4 * s]]);
      const B = [["B4", s], ["C5", s], ["D5", s], ["E5", 3 * s], ["G4", s], ["F5", s], ["E5", s], ["D5", 3 * s], ["F4", s], ["E5", s], ["D5", s], ["C5", 3 * s], ["E4", s], ["D5", s], ["C5", s], ["B4", 2 * s], ["E4", s], ["E5", s], ["E6", 2 * s], ["D#5", s], ["E5", s], ["D#5", s], ["E5", s], ["D#5", s]];
      const links = (t0, folge) => folge.forEach(([x, i]) => n("harfe", ton(x), t0 + i * s, .5, .32));
      const LA = [["A2", 8], ["E3", 9], ["A3", 10], ["E2", 11], ["E3", 12], ["G#3", 13], ["A2", 15], ["E3", 16], ["A3", 17]];
      let t = 0;
      [A1, A2, B, A1, A2].forEach(m => {
        const t0 = t; t = linie(n, "harfe", t, m, .5);
        if (m !== B) links(t0, LA); else links(t0, [["C3", 3], ["G3", 4], ["C4", 5], ["G2", 7], ["G3", 8], ["B3", 9], ["A2", 11], ["E3", 12], ["A3", 13], ["E2", 15], ["E3", 16]]);
      });
    },
    nachtmusik(n) { /* Mozart: Eine kleine Nachtmusik */
      const e = .2;
      const p1 = [["G4", 2 * e], [null, e], ["D4", e], ["G4", 2 * e], [null, e], ["D4", e], ["G4", e], ["D4", e], ["G4", e], ["B4", e], ["D5", 4 * e]];
      const p2 = [["C5", 2 * e], [null, e], ["A4", e], ["C5", 2 * e], [null, e], ["A4", e], ["C5", e], ["A4", e], ["F#4", e], ["A4", e], ["D4", 4 * e]];
      const p3 = [["G4", e], ["G4", e / 2], ["B4", e / 2], ["A4", e / 2], ["G4", e / 2], ["G4", e], ["F#4", e], ["F#4", e / 2], ["A4", e / 2], ["C5", e / 2], ["F#4", e / 2], ["A4", e], ["G4", e],
        ["G4", e / 2], ["B4", e / 2], ["A4", e / 2], ["G4", e / 2], ["G4", e], ["F#4", e], ["F#4", e / 2], ["A4", e / 2], ["C5", e / 2], ["F#4", e / 2], ["G4", 2 * e]];
      let t = 0;
      [[p1, "G2"], [p2, "D3"], [p3, "G2"], [p1, "G2"], [p2, "D3"]].forEach(([m, g]) => {
        const t0 = t; t = linie(n, "geige", t, m, .45, { leg: .8 }); linie(n, "vln", t0, m.map(([x, d]) => [okt(x, 1), d]), .1, { leg: .8 });
        linie(n, "vc", t0, m.map(([x, d]) => [okt(x, -1), d]), .22, { leg: .8 });
        for (let x = t0; x < t; x += 2 * e) n("spic", ton(g), x, e, .15, { kurz: 1 });
      });
      [["G3", "D4", "B4", "G5"], ["D3", "A3", "F#4", "D5"], ["G3", "D4", "B4", "G5"]].forEach((a, k) => a.forEach(x => n("geige", ton(x), t + k * .35, k === 2 ? 1 : .25, .18)));
    },
    freude(n) { /* Beethoven: Ode an die Freude */
      const q = .38;
      const z1 = [["E4", q], ["E4", q], ["F4", q], ["G4", q], ["G4", q], ["F4", q], ["E4", q], ["D4", q], ["C4", q], ["C4", q], ["D4", q], ["E4", q]];
      const s1 = z1.concat([["E4", q * 1.5], ["D4", q * .5], ["D4", q * 2]]), s2 = z1.concat([["D4", q * 1.5], ["C4", q * .5], ["C4", q * 2]]);
      const s3 = [["D4", q], ["D4", q], ["E4", q], ["C4", q], ["D4", q], ["E4", q / 2], ["F4", q / 2], ["E4", q], ["C4", q], ["D4", q], ["E4", q / 2], ["F4", q / 2], ["E4", q], ["D4", q], ["C4", q], ["D4", q], ["G3", q * 2]];
      const bass = { s1: ["C3", "G2", "C3", "G2"], s2: ["C3", "G2", "C3", "C3"], s3: ["G2", "C3", "G2", "G2"] };
      let t = 0;
      [[s1, "fl", .4, "s1"], [s2, "oboe", .35, "s2"], [s3, "geige", .35, "s3"], [s2, "trp", .32, "s2"], [s3, "trp", .32, "s3"], [s2, "trp", .32, "s2"]].forEach(([m, gr, l, b], i) => {
        const t0 = t; t = linie(n, gr, t, m, l, { leg: .95 });
        if (i >= 3) { linie(n, "stimme", t0, m.map(([x, d]) => [okt(x, 1), d]), .25, { leg: .97 }); linie(n, "horn", t0, m.map(([x, d]) => [okt(x, -1), d]), .2); }
        bass[b].forEach((x, k) => { n(i >= 3 ? "pos" : "vc", ton(x), t0 + k * 4 * q, 4 * q, .2); if (i >= 3) n("timp1", 0, t0 + k * 4 * q, 0, .25); });
      });
      n("crash", 0, t - 2 * q, 0, .25);
    },
    diesirae(n) { /* Dies irae – gregorianischer Gesang */
      const q = .5;
      const z1 = [["F4", q], ["E4", q], ["F4", q], ["D4", q], ["E4", q], ["C4", q], ["D4", q * 1.2], ["D4", q * 2.2]];
      const z2 = [["F4", q], ["F4", q], ["G4", q], ["F4", q], ["E4", q], ["D4", q], ["C4", q], ["E4", q], ["F4", q], ["E4", q], ["D4", q * 2.4]];
      let t = 0;
      [z1, z2, z1].forEach((m, i) => {
        const t0 = t; t = linie(n, "stimme", t, m, .32, { leg: 1 }); linie(n, "stimme", t0, m.map(([x, d]) => [okt(x, -1), d]), .26, { leg: 1 });
        n("orgel", ton("D2"), t0, t - t0 + .3, .25); n("orgel", ton("A2"), t0, t - t0 + .3, .15);
        if (i === 2) linie(n, "pos", t0, m.map(([x, d]) => [okt(x, -1), d]), .2, { leg: 1 });
        n("timp1", 0, t0, 0, .25); t += .3;
      });
      n("gong", 0, t - .5, 0, .4); n("orgel", ton("D2"), t - .5, 3, .3);
    },
    wiegenlied(n) { /* Brahms: Wiegenlied */
      const m = [["E4", .28], ["E4", .28], ["G4", .9], ["E4", .28], ["E4", .28], ["G4", .9], ["E4", .28], ["G4", .28], ["C5", .56], ["B4", .8], ["A4", .28], ["A4", .56], ["G4", 1.1],
        ["D4", .28], ["E4", .28], ["F4", .56], ["D4", .56], ["D4", .28], ["E4", .28], ["F4", 1.1], ["D4", .28], ["F4", .28], ["B4", .28], ["A4", .28], ["G4", .56], ["B4", .56], ["C5", 1.1],
        ["C4", .28], ["C4", .28], ["C5", 1.1], ["A4", .28], ["F4", .28], ["G4", 1.1], ["E4", .28], ["C4", .28], ["F4", .56], ["E4", .28], ["D4", .28], ["C4", 1.6]];
      const akk = [["C3", 0], ["G2", 2.8], ["C3", 4.4], ["G2", 6.4], ["G2", 8.6], ["C3", 10.6], ["F2", 11.8], ["C3", 13.6], ["G2", 14.4], ["C3", 15.2]];
      let t = 0;
      [["harfe", "glock"], ["fl", "harfe"]].forEach(([haupt, neben]) => {
        const t0 = t; t = linie(n, haupt, t, m, haupt === "fl" ? .35 : .45, { leg: .95 }); linie(n, neben, t0, m.map(([x, d]) => [okt(x, neben === "glock" ? 1 : 0), d]), .2);
        akk.forEach(([x, d]) => n("harfe", ton(x), t0 + d, 1.4, .25));
        t += .4;
      });
    },
    morgen(n) { /* Grieg: Morgenstimmung */
      const e = .2, m = [["G#5", e], ["E5", e], ["D#5", e], ["C#5", e], ["D#5", e], ["E5", 2 * e], ["G#5", e], ["E5", e], ["D#5", e], ["C#5", e], ["D#5", e], ["E5", e], ["D#5", e], ["E5", e],
        ["G#5", e], ["E5", e], ["G#5", e], ["A5", e], ["E5", e], ["A5", e], ["G#5", e], ["E5", e], ["D#5", e], ["C#5", 4 * e]];
      let t = 0;
      [["fl", 0, .4], ["oboe", -1, .35], ["fl", 0, .4], ["geige", -1, .4]].forEach(([gr, o, l], i) => {
        const t0 = t; t = linie(n, gr, t, m.map(([x, d]) => [okt(x, o), d]), l, { leg: .97 });
        n("vc", ton("E3"), t0, 2.8, .18); n("vln", ton("B4"), t0, 2.8, .08 + .03 * i); n("vc", ton("A2"), t0 + 2.8, 2, .18); n("vln", ton("C#5"), t0 + 2.8, 2, .08 + .03 * i);
        if (i === 3) { linie(n, "vln", t0, m.map(([x, d]) => [okt(x, 0), d]), .18, { leg: .97 }); n("horn", ton("E3"), t0, 4.8, .2); }
        t += .2;
      });
      ["E3", "B3", "E4", "G#4", "B4", "E5"].forEach(x => { n("vln", ton(x) + 12, t, 3, .12); n("horn", ton(x) - 12, t, 3, .15); }); n("fl", ton("E5"), t, 3, .3);
    },
    zapfenstreich(n) { /* Signal „Taps“ */
      linie(n, "trp", 0, [["G4", .6], ["G4", .2], ["C5", 1.6], ["G4", .6], ["C5", .2], ["E5", 1.6], ["G4", .4], ["C5", .4], ["E5", .8], ["G4", .4], ["C5", .4], ["E5", .8],
        ["G4", .4], ["C5", .4], ["E5", 1.6], ["C5", .6], ["E5", .2], ["G5", 1.6], ["E5", .6], ["C5", .2], ["G4", 1.6], ["G4", .6], ["G4", .2], ["C5", 2.6]], .4, { leg: .93 });
    },
    kanon(n) { /* Pachelbel: Kanon in D */
      const q = .72, bass = ["D3", "A2", "B2", "F#2", "G2", "D2", "G2", "A2"], akk = ["D", "A", "Bm", "F#m", "G", "D", "G", "A"];
      const AK = { D: ["D4", "F#4", "A4"], A: ["C#4", "E4", "A4"], Bm: ["D4", "F#4", "B4"], "F#m": ["C#4", "F#4", "A4"], G: ["D4", "G4", "B4"] };
      const l1 = ["F#5", "E5", "D5", "C#5", "B4", "A4", "B4", "C#5"].map(x => [x, 1]);
      const l2 = ["D5", "C#5", "B4", "A4", "G4", "F#4", "G4", "E4"].map(x => [x, 1]);
      const l3 = ["D4", "F#4", "A4", "G4", "F#4", "D4", "F#4", "E4", "D4", "B3", "D4", "A4", "G4", "B4", "A4", "G4"].map(x => [x, .5]);
      const l4 = ["F#4", "D4", "E4", "C#5", "D5", "F#5", "A5", "A4", "B4", "G4", "A4", "F#4", "D4", "D5", "D5", "C#5"].map(x => [x, .5]);
      const zyklen = 8;
      for (let c = 0; c < zyklen; c++) {
        const t0 = c * 8 * q;
        bass.forEach((x, i) => { n("vc", ton(x), t0 + i * q, q * .98, .25); n("kb", ton(x), t0 + i * q, q, .25); if (c >= 1 && c < 7) AK[akk[i]] && AK[akk[i]].forEach(y => n("harfe", ton(y), t0 + i * q + .03, q, .1)); });
        const linien = [l1, l2, l3, l4];
        [["geige", 1], ["vln", 2], ["geige", 3]].forEach(([gr, start], v) => { const k = c - start; if (k >= 0 && k < 5) linie(n, gr, t0, achtel(linien[k % 4], q), gr === "vln" ? .16 : .32 - .04 * v, { leg: .95 }); });
      }
      const t = zyklen * 8 * q; ["D3", "A3", "D4", "F#4", "A4", "D5"].forEach(x => { n("vc", ton(x) - 12, t, 3, .15); n("geige", ton(x), t, 3, .15); n("harfe", ton(x), t, 3, .2); });
    },
    fruehling(n) { /* Vivaldi: Der Frühling */
      const e = .23;
      const r = [["E4", 1], ["G#4", 1], ["G#4", 1], ["G#4", 1], ["F#4", .5], ["E4", .5], ["B4", 3], ["B4", .5], ["A4", .5], ["G#4", 1], ["G#4", 1], ["G#4", 1], ["F#4", .5], ["E4", .5], ["B4", 3], ["B4", .5], ["A4", .5],
        ["G#4", 1], ["A4", 1], ["B4", 2], ["A4", 1], ["G#4", 1], ["F#4", 2], ["D#4", 1], ["B3", 1], ["E4", 1], ["E4", 1], ["E4", 2]];
      let t = 0;
      [[0, .4, 1], [0, .22, 0], [0, .4, 1]].forEach(([o, l, voll], i) => {
        const t0 = t; t = linie(n, "geige", t, achtel(r.map(([x, d]) => [okt(x, 1 + o), d]), e), l, { leg: .85 });
        if (voll) linie(n, "vln", t0, achtel(r.map(([x, d]) => [okt(x, 1), d]), e), l * .4, { leg: .85 });
        for (let z = t0; z < t - .05; z += 2 * e) n("spic", ton(Math.round((z - t0) / (2 * e)) % 4 < 2 ? "E3" : "B2"), z, e, voll ? .22 : .12, { kurz: 1 });
        t += .1;
        if (i === 1) { /* Vogelgezwitscher */
          for (let k = 0; k < 14; k++) n("flst", ton(["E6", "F#6", "E6", "G#6"][k % 4]), t + k * .09, .08, .18, { kurz: 1 });
          t += 1.5;
        }
      });
      ["E3", "B3", "E4", "G#4", "B4", "E5"].forEach(x => n("geige", ton(x), t, 1.6, .15)); n("vc", ton("E2") + 12, t, 1.6, .25);
    },
    turca(n) { /* Mozart: Rondo alla turca */
      const s = .13;
      const m = [["B4", 1], ["A4", 1], ["G#4", 1], ["A4", 1], ["C5", 4], ["D5", 1], ["C5", 1], ["B4", 1], ["C5", 1], ["E5", 4], ["F5", 1], ["E5", 1], ["D#5", 1], ["E5", 1],
        ["B5", 1], ["A5", 1], ["G#5", 1], ["A5", 1], ["B5", 1], ["A5", 1], ["G#5", 1], ["A5", 1], ["C6", 4], ["A5", 2], ["C6", 2], ["B5", 2], ["A5", 2], ["G5", 2], ["A5", 2],
        ["B5", 2], ["A5", 2], ["G5", 2], ["A5", 2], ["B5", 2], ["A5", 2], ["G5", 2], ["F#5", 2], ["E5", 4]];
      let t = 0;
      [["flst", -1, .4], ["oboest", -1, .4], ["geigest", -1, .42]].forEach(([gr, o, l], i) => {
        const t0 = t; t = linie(n, gr, t, achtel(m.map(([x, d]) => [okt(x, o), d]), s), l, { kurz: 1, leg: .8 });
        for (let z = t0 + 4 * s; z < t - .05; z += 2 * s) { const k = Math.round((z - t0) / (2 * s)); n(k % 2 ? "harfe" : "kb", ton(k % 4 < 2 ? "A2" : "E2") + (k % 2 ? 12 : 0), z, s * 1.5, .25, { kurz: 1 }); }
        if (i === 2) { coverTrommel(n, t0, t, 4 * s, "bodh", .4); for (let z = t0; z < t; z += 2 * s) n("schelle1", 0, z + s, 0, .15); }
      });
      ["A3", "C4", "E4", "A4"].forEach(x => { n("geige", ton(x), t, .8, .2); n("harfe", ton(x), t, 1.2, .25); }); n("bodh1", 0, t, 0, .5);
    },
    angriff(n) { /* Signal „Charge!“ – zweimal, beim zweiten Mal mit der ganzen Kapelle */
      const m = [["G4", .15], ["C5", .15], ["E5", .15], ["G5", .4], ["E5", .15], ["G5", 1]];
      linie(n, "trp", 0, m, .42, { leg: .9 });
      for (let t = 0; t < 1; t += .05) n("snare2", 0, t, 0, .06 + .12 * t);
      linie(n, "trp", 2.1, m, .42, { leg: .9 }); linie(n, "horn", 2.1, m.map(([x, d]) => [okt(x, -1), d]), .3, { leg: .9 });
      for (let t = 2.1; t < 3.1; t += .05) n("snare2", 0, t, 0, .08 + .14 * (t - 2.1));
      ["C4", "E4", "G4", "C5"].forEach(x => n("trp", ton(x), 3.1, 1.2, .2)); n("crash", 0, 3.1, 0, .35); n("bd", 0, 3.1, 0, .4); n("timp1", 0, 3.1, 0, .4);
    }
  };
  /* ---------- Cover der Band: gemeinfreie Volkslieder, von Barradin & Co. gespielt ---------- */
  const AKK = { Dm: ["D3", "F3", "A3"], C: ["C3", "E3", "G3"], Am: ["A2", "E3", "A3", "C4"], G: ["G2", "D3", "G3", "B3"], E: ["E2", "B2", "E3", "G#3"], F: ["F2", "C3", "F3", "A3"],
    Bb: ["Bb2", "D3", "F3", "Bb3"], Gm: ["G2", "D3", "G3", "Bb3"], D: ["D3", "A3", "D4", "F#3"], Eb: ["Eb3", "G3", "Bb3"], A: ["A2", "E3", "A3", "C#4"] };
  /* Laute schlägt den Akkord: Bass auf der Eins, Akkord auf den übrigen Schlägen */
  function laute(n, t, folge, schlag, proTakt, l) {
    folge.forEach(name => {
      const a = AKK[name];
      for (let b = 0; b < proTakt; b++) {
        const z = t + b * schlag;
        if (b === 0) { n("gitarre", ton(a[0]), z, schlag * 1.5, l * 1.1); n("kb", ton(a[0]), z, schlag * 1.2, l * .7); }
        else if (proTakt === 3 || b % 2 === 1 || proTakt === 2) a.slice(1).forEach((x, i) => n("gitarre", ton(x) + 12, z + i * .012, schlag * .9, l * .55));
        else n("gitarre", ton(a[a.length > 3 ? 1 : 2]), z, schlag, l * .8);
      }
      t += proTakt * schlag;
    });
    return t;
  }
  const coverTrommel = (n, t0, t1, schlag, art, l) => { for (let z = t0, k = 0; z < t1 - .01; z += schlag, k++) n(art === "tamb" ? (k % 2 ? "tamb2" : "tamb1") : (k % 2 ? "bodh2" : "bodh1"), 0, z, 0, l); };
  const COVER_STUECKE = {
    amazinggrace(n) { /* „Amazing Grace“ – Melodie „New Britain“ (1829) */
      const b = .55;
      const m = [["D4", 1], ["G4", 2], ["B4", .5], ["G4", .5], ["B4", 2], ["A4", 1], ["G4", 2], ["E4", 1], ["D4", 2], ["D4", 1], ["G4", 2], ["B4", .5], ["G4", .5], ["B4", 2], ["A4", 1], ["D5", 3],
        ["D5", 2], ["B4", 1], ["D5", 2], ["B4", .5], ["D5", .5], ["B4", 2], ["A4", 1], ["G4", 2], ["E4", 1], ["D4", 2], ["D4", 1], ["G4", 2], ["B4", .5], ["G4", .5], ["B4", 2], ["A4", 1], ["G4", 3]];
      const akk = ["G", "G", "C", "G", "G", "D", "D", "G", "G", "C", "G", "G", "D", "G"];
      let t = 0;
      [["fl", .4], ["dudel", .3], ["stimme", .32]].forEach(([gr, l], i) => {
        const t0 = t; t = linie(n, gr, t, achtel(m, b), l, { leg: .96 });
        if (i === 1) { n("orgel", ton("G2"), t0, t - t0, .18); n("orgel", ton("D3"), t0, t - t0, .12); }
        else akk.forEach((a, k) => AKK[a].forEach((x, j) => n("harfe", ton(x), t0 + b + k * 3 * b + j * .15, 1.6, .2)));
        if (i === 2) { linie(n, "dudel", t0, achtel(m, b), .22, { leg: .96 }); akk.forEach((a, k) => n("vc", ton(AKK[a][0]), t0 + b + k * 3 * b, 3 * b, .2)); n("timp1", 0, t - 3 * b, 0, .3); }
        t += .3;
      });
    },
    bruderjakob(n) { /* „Bruder Jakob“ als vierstimmiger Kanon */
      const q = .42;
      const m = [["F4", 1], ["G4", 1], ["A4", 1], ["F4", 1], ["F4", 1], ["G4", 1], ["A4", 1], ["F4", 1], ["A4", 1], ["Bb4", 1], ["C5", 2], ["A4", 1], ["Bb4", 1], ["C5", 2],
        ["C5", .5], ["D5", .5], ["C5", .5], ["Bb4", .5], ["A4", 1], ["F4", 1], ["C5", .5], ["D5", .5], ["C5", .5], ["Bb4", .5], ["A4", 1], ["F4", 1], ["F4", 1], ["C4", 1], ["F4", 2], ["F4", 1], ["C4", 1], ["F4", 2]];
      const stimmen = [["hack", 0, .38], ["bfl", 1, .28], ["akk", 0, .26], ["bra", -1, .34]];
      stimmen.forEach(([gr, o, l], k) => { const t0 = k * 8 * q; linie(n, gr, t0, achtel(m.concat(m).map(([x, d]) => [okt(x, o), d]), q), l, { leg: .9 }); });
      const ende = 3 * 8 * q + 64 * q;
      for (let z = 0; z < ende - .1; z += 2 * q) { n("gitarre", ton("F2") + 12, z, q * 1.5, .25); ["A3", "C4", "F4"].forEach(x => n("gitarre", ton(x), z + q, q, .12)); }
      coverTrommel(n, 0, ende, q, "bodh", .35);
    },
    washerwoman(n) { /* „The Irish Washerwoman“ – irischer Jig */
      const e = .15;
      const A = [["B4", 1], ["G4", 1], ["G4", 1], ["D4", 1], ["G4", 1], ["G4", 1], ["B4", 1], ["G4", 1], ["B4", 1], ["D5", 1], ["C5", 1], ["B4", 1], ["C5", 1], ["A4", 1], ["A4", 1], ["E4", 1], ["A4", 1], ["A4", 1],
        ["C5", 1], ["A4", 1], ["C5", 1], ["E5", 1], ["D5", 1], ["C5", 1], ["B4", 1], ["G4", 1], ["G4", 1], ["D4", 1], ["G4", 1], ["G4", 1], ["B4", 1], ["G4", 1], ["B4", 1], ["D5", 1], ["C5", 1], ["B4", 1],
        ["C5", 1], ["B4", 1], ["C5", 1], ["A4", 1], ["D5", 1], ["C5", 1], ["B4", 1], ["G4", 1], ["G4", 1], ["G4", 2], [null, 1]];
      const B = [["D5", 1], ["G4", 1], ["G4", 1], ["B4", 1], ["G4", 1], ["G4", 1], ["D5", 1], ["G4", 1], ["G4", 1], ["B4", 1], ["G4", 1], ["G4", 1], ["E5", 1], ["A4", 1], ["A4", 1], ["C5", 1], ["A4", 1], ["A4", 1],
        ["E5", 1], ["A4", 1], ["A4", 1], ["C5", 1], ["A4", 1], ["A4", 1], ["D5", 1], ["G4", 1], ["G4", 1], ["B4", 1], ["G4", 1], ["G4", 1], ["D5", 1], ["E5", 1], ["D5", 1], ["C5", 1], ["B4", 1], ["A4", 1],
        ["B4", 1], ["C5", 1], ["A4", 1], ["F#4", 1], ["A4", 1], ["D5", 1], ["B4", 1], ["G4", 1], ["G4", 1], ["G4", 2], [null, 1]];
      const akkA = ["G", "G", "Am", "D", "G", "G", "D", "G"], akkB = ["G", "G", "Am", "Am", "G", "G", "D", "G"];
      let t = 0;
      [[A, akkA, "geige"], [A, akkA, "fl"], [B, akkB, "geige"], [B, akkB, "fl"], [A, akkA, "dudel"], [A, akkA, "geige"]].forEach(([m, folge, gr], i) => {
        const t0 = t; t = linie(n, gr, t, achtel(m, e), gr === "dudel" ? .3 : .38, { leg: .85 });
        if (i >= 4) linie(n, "fl", t0, achtel(m, e), .2, { leg: .85 });
        folge.forEach((a, k) => { const z = t0 + k * 6 * e; n("gitarre", ton(AKK[a][0]), z, 3 * e, .3); AKK[a].slice(1).forEach((x, j) => n("gitarre", ton(x) + 12, z + 3 * e + j * .01, 2 * e, .15)); });
        coverTrommel(n, t0, t, 3 * e, "bodh", .45); if (i >= 2) coverTrommel(n, t0 + 1.5 * e, t, 3 * e, "tamb", .25);
      });
      ["G3", "D4", "G4", "B4"].forEach(x => n("gitarre", ton(x), t, 1.2, .3)); n("bodh1", 0, t, 0, .6);
    },
    sakura(n) { /* „Sakura“ – japanisches Volkslied */
      const q = .5;
      const m = [["A4", 1], ["A4", 1], ["B4", 2], ["A4", 1], ["A4", 1], ["B4", 2], ["A4", 1], ["B4", 1], ["C5", 1], ["B4", 1], ["A4", 1], ["B4", .5], ["A4", .5], ["F4", 2],
        ["E4", 1], ["C4", 1], ["E4", 1], ["F4", 1], ["E4", 1], ["E4", .5], ["C4", .5], ["B3", 2], ["A4", 1], ["B4", 1], ["C5", 1], ["B4", 1], ["A4", 1], ["B4", .5], ["A4", .5], ["F4", 2],
        ["E4", 1], ["C4", 1], ["E4", 1], ["F4", 1], ["E4", 1], ["E4", .5], ["C4", .5], ["B3", 2], ["A4", 1], ["A4", 1], ["B4", 2], ["A4", 1], ["A4", 1], ["B4", 2],
        ["E4", 1], ["F4", 1], ["B4", .5], ["A4", .5], ["F4", 1], ["E4", 4]];
      let t = 0;
      [["harfe", .5], ["fl", .38]].forEach(([gr, l], i) => {
        const t0 = t; t = linie(n, gr, t, achtel(m, q), l, { leg: .95 });
        for (let z = t0; z < t - .1; z += 4 * q) { n("harfe", ton("A2"), z, 2, .25); n("harfe", ton("E3"), z + 2 * q, 1.5, .18); }
        if (i === 1) linie(n, "harfe", t0, achtel(m.map(([x, d]) => [okt(x, -1), d]), q), .25);
        t += .3;
      });
      n("glock", ton("E5") + 12, t - 2, 0, .2); n("gong", 0, t - 2, 0, .15);
    },
    matrose(n) { /* „What shall we do with the drunken sailor“ – Seemannslied */
      const q = .4;
      const zeile = (a, b, c) => [[a, 1], [a, .5], [a, .5], [a, 1], [a, .5], [a, .5], [a, 1], [b[0], 1], [b[1], 1], [b[2], 1]];
      const strophe = zeile("A4", ["D4", "F4", "A4"], 0).concat(zeile("G4", ["C4", "E4", "G4"]), zeile("A4", ["B4", "C5", "D5"]), [["C5", 1], ["A4", 1], ["G4", 1], ["E4", 1], ["D4", 2], ["D4", 2]]);
      const chorz = (a, b) => [[a, 2], [a, 1.5], [a, .5], [a, 1], [b[0], 1], [b[1], 1], [b[2], 1]];
      const refrain = chorz("A4", ["D4", "F4", "A4"]).concat(chorz("G4", ["C4", "E4", "G4"]), chorz("A4", ["B4", "C5", "D5"]), [["C5", 1], ["A4", 1], ["G4", 1], ["E4", 1], ["D4", 2], ["D4", 2]]);
      const akk = ["Dm", "Dm", "C", "C", "Dm", "Dm", "C", "Dm"];
      let t = laute(n, 0, ["Dm", "Dm"], q, 4, .3); coverTrommel(n, 0, t, q, "bodh", .5);
      [[strophe, "geige", .4], [refrain, "dudel", .32], [strophe, "fl", .4], [refrain, "dudel", .32]].forEach(([m, gr, l], i) => {
        const t0 = t; t = linie(n, gr, t, achtel(m, q), l, { leg: .9 });
        if (i % 2) { linie(n, "stimme", t0, achtel(m, q), .2, { leg: .95 }); coverTrommel(n, t0 + q / 2, t, q, "tamb", .35); }
        laute(n, t0, akk, q, 4, .3); coverTrommel(n, t0, t, q, "bodh", .55);
      });
      ["D3", "A3", "D4", "F4"].forEach(x => n("gitarre", ton(x), t, 1.5, .4)); n("dudel", ton("D5"), t, 1.2, .3); n("bodh1", 0, t, 0, .7);
    },
    scarborough(n) { /* „Scarborough Fair“ – englische Ballade */
      const b = .52;
      const m = [["D4", 2], ["D4", 1], ["A4", 2], ["A4", 1], ["E4", 1.5], ["F4", .5], ["E4", 1], ["D4", 3],
        [null, 1], ["A4", 1], ["C5", 1], ["D5", 2], ["C5", 1], ["A4", 1], ["B4", 1], ["G4", 1], ["A4", 3],
        ["D5", 2], ["D5", 1], ["C5", 2], ["A4", 1], ["A4", 1], ["G4", 1], ["F4", 1], ["E4", 1], ["C4", 2],
        ["D4", 2], ["A4", 1], ["G4", 2], ["F4", 1], ["E4", 1], ["D4", 1], ["C4", 1], ["D4", 3]];
      const akk = ["Dm", "Dm", "C", "Dm", "Dm", "F", "C", "Dm", "F", "C", "Dm", "Dm", "C", "Dm", "C", "Dm"];
      const harfe = (t0) => akk.forEach((a, k) => AKK[a].concat([okt(AKK[a][1], 1)]).forEach((x, i) => n("harfe", ton(x) + (i ? 0 : 0), t0 + k * 3 * b + i * b * .75, 1.4, .25)));
      let t = 0;
      [["fl", .4], ["stimme", .32], ["geige", .4]].forEach(([gr, l], i) => {
        const t0 = t; t = linie(n, gr, t, achtel(m, b), l, { leg: .95 }); harfe(t0);
        if (i === 2) { linie(n, "fl", t0, achtel(m.map(([x, d]) => [okt(x, 1), d]), b), .15, { leg: .95 }); akk.forEach((a, k) => n("vc", ton(AKK[a][0]), t0 + k * 3 * b, 3 * b, .18)); }
      });
      ["D3", "A3", "D4", "F4", "A4"].forEach((x, i) => n("harfe", ton(x), t + i * .12, 2.5, .3));
    },
    greensleeves(n) { /* „Greensleeves“ – englisches Lied aus dem 16. Jahrhundert */
      const e = .2;
      const s = [["A4", 1], ["C5", 2], ["D5", 1], ["E5", 1.5], ["F5", .5], ["E5", 1], ["D5", 2], ["B4", 1], ["G4", 1.5], ["A4", .5], ["B4", 1], ["C5", 2], ["A4", 1], ["A4", 1.5], ["G#4", .5], ["A4", 1], ["B4", 2], ["G#4", 1], ["E4", 2],
        ["A4", 1], ["C5", 2], ["D5", 1], ["E5", 1.5], ["F5", .5], ["E5", 1], ["D5", 2], ["B4", 1], ["G4", 1.5], ["A4", .5], ["B4", 1], ["C5", 1.5], ["B4", .5], ["A4", 1], ["G#4", 1.5], ["F#4", .5], ["G#4", 1], ["A4", 3], ["A4", 2]];
      const r = [[null, 1], ["G5", 3], ["G5", 1.5], ["F#5", .5], ["E5", 1], ["D5", 2], ["B4", 1], ["G4", 1.5], ["A4", .5], ["B4", 1], ["C5", 2], ["A4", 1], ["A4", 1.5], ["G#4", .5], ["A4", 1], ["B4", 2], ["G#4", 1], ["E4", 3],
        ["G5", 3], ["G5", 1.5], ["F#5", .5], ["E5", 1], ["D5", 2], ["B4", 1], ["G4", 1.5], ["A4", .5], ["B4", 1], ["C5", 1.5], ["B4", .5], ["A4", 1], ["G#4", 1.5], ["F#4", .5], ["G#4", 1], ["A4", 3], ["A4", 2]];
      const akkS = ["Am", "G", "Am", "E", "Am", "G", "Am", "E", "Am"], akkR = ["C", "G", "Am", "E", "C", "G", "Am", "E", "Am"];
      const harfe = (t0, folge) => folge.forEach((a, k) => AKK[a].forEach((x, i) => n(i ? "harfe" : "gitarre", ton(x), t0 + e + k * 6 * e + i * e * 1.2, 1.4, .22)));
      let t = 0;
      [[s, akkS, "geige", .38], [r, akkR, "geige", .38], [s, akkS, "fl", .4], [r, akkR, "oboe", .34]].forEach(([m, folge, gr, l], i) => {
        const t0 = t; t = linie(n, gr, t, achtel(m, e), l, { leg: .95 }); harfe(t0, folge);
        if (i === 3) { linie(n, "fl", t0, achtel(m, e), .2, { leg: .95 }); folge.forEach((a, k) => n("vc", ton(AKK[a][0]), t0 + e + k * 6 * e, 6 * e, .15)); }
      });
      AKK.Am.forEach((x, i) => n("harfe", ton(x) + 12, t + i * .1, 2.5, .28));
    },
    korobeiniki(n) { /* „Korobeiniki“ – russisches Volkslied (die Melodie, die man aus Tetris kennt) */
      const A = [["E5", 1], ["B4", .5], ["C5", .5], ["D5", 1], ["C5", .5], ["B4", .5], ["A4", 1], ["A4", .5], ["C5", .5], ["E5", 1], ["D5", .5], ["C5", .5], ["B4", 1.5], ["C5", .5], ["D5", 1], ["E5", 1], ["C5", 1], ["A4", 1], ["A4", 2],
        [null, .5], ["D5", 1], ["F5", .5], ["A5", 1], ["G5", .5], ["F5", .5], ["E5", 1.5], ["C5", .5], ["E5", 1], ["D5", .5], ["C5", .5], ["B4", 1], ["B4", .5], ["C5", .5], ["D5", 1], ["E5", 1], ["C5", 1], ["A4", 1], ["A4", 2]];
      const B = [["E5", 2], ["C5", 2], ["D5", 2], ["B4", 2], ["C5", 2], ["A4", 2], ["G#4", 2], ["B4", 2], ["E5", 2], ["C5", 2], ["D5", 2], ["B4", 2], ["C5", 1], ["E5", 1], ["A5", 2], ["G#5", 4]];
      const akkA = ["E", "Am", "E", "Am", "Dm", "C", "E", "Am"], akkB = ["Am", "E", "Am", "E", "Am", "E", "Am", "E"];
      let t = 0;
      [[A, akkA, "geigest", .42, .36], [A, akkA, "geige", .4, .36], [B, akkB, "oboe", .36, .42], [A, akkA, "geigest", .42, .3], [A, akkA, "geigest", .44, .26]].forEach(([m, folge, gr, l, q], i) => {
        const t0 = t; t = linie(n, gr, t, achtel(m, q), l, { kurz: gr === "geigest" ? 1 : 0, leg: gr === "geigest" ? .7 : .92 });
        laute(n, t0, folge, q, 4, .28);
        if (i >= 3) { linie(n, "klar", t0, achtel(m.map(([x, d]) => [okt(x, -1), d]), q), .2, { leg: .8 }); coverTrommel(n, t0, t, q, "bodh", .5); coverTrommel(n, t0 + q / 2, t, q, "tamb", .3); }
        if (i === 4) n("crash", 0, t0, 0, .2);
      });
      ["A3", "E4", "A4", "C5"].forEach(x => n("gitarre", ton(x), t, 1.4, .35)); n("geige", ton("A5"), t, 1.2, .3); n("bodh1", 0, t, 0, .7); n("crash", 0, t, 0, .25);
    },
    auldlangsyne(n) { /* „Auld Lang Syne“ – schottisches Abschiedslied */
      const q = .5;
      const s = [["C4", 1], ["F4", 1.5], ["F4", .5], ["F4", 1], ["A4", 1], ["G4", 1.5], ["F4", .5], ["G4", 1], ["A4", .5], ["G4", .5], ["F4", 1.5], ["F4", .5], ["A4", 1], ["C5", 1], ["D5", 3],
        ["D5", 1], ["C5", 1.5], ["A4", .5], ["A4", 1], ["F4", 1], ["G4", 1.5], ["F4", .5], ["G4", 1], ["A4", .5], ["G4", .5], ["F4", 1.5], ["D4", .5], ["D4", 1], ["C4", 1], ["F4", 3]];
      const akk = ["F", "F", "C", "C", "F", "F", "Bb", "Bb", "F", "F", "C", "C", "Dm", "Bb", "F", "F"];
      let t = 0;
      [["fl", .4], ["stimme", .34], ["geige", .4]].forEach(([gr, l], i) => {
        const t0 = t; t = linie(n, gr, t, achtel(s, q), l, { leg: .95 });
        akk.forEach((a, k) => { const z = t0 + q + k * 2 * q; AKK[a].forEach((x, j) => n("gitarre", ton(x) + (j ? 12 : 0), z + j * .02, 2 * q, .2)); n("kb", ton(AKK[a][0]), z, 2 * q, .25); });
        if (i === 2) { linie(n, "stimme", t0, achtel(s, q), .25, { leg: .95 }); linie(n, "horn", t0, achtel(s.map(([x, d]) => [okt(x, -1), d]), q), .15); }
      });
      AKK.F.forEach((x, i) => { n("gitarre", ton(x), t + i * .03, 2.5, .3); n("stimme", ton(x) + 12, t, 2.5, .12); });
    },
    shchedryk(n) { /* „Schtschedryk“ – ukrainisches Neujahrslied (Leontowytsch), bekannt als „Carol of the Bells“ */
      const e = .19, takt = 6 * e;
      const ost = [["Bb4", 2], ["A4", 1], ["Bb4", 1], ["G4", 2]];
      const takte = 24; let t = 0;
      for (let k = 0; k < takte; k++) {
        const z = k * takt, staerke = k < 4 ? .3 : k < 20 ? .38 : .3;
        linie(n, k < 8 ? "cel" : "geigest", z, achtel(ost, e), staerke, { kurz: k >= 8 ? 1 : 0, leg: .8 });
        if (k >= 4 && k < 22) linie(n, k < 12 ? "kal" : "hack", z, achtel(ost, e), .18, { leg: .8 });
        if (k >= 12 && k % 4 === 0) n("rgl", ton("G5"), z, 3, .16);
        if (k >= 4 && k < 22) n("vc", ton(["G2", "F2", "Eb2", "D2"][k % 4]), z, takt, .22);
        if (k >= 8 && k < 20) n("vln", ton(["D5", "C5", "Bb4", "A4"][k % 4]), z, takt, .14);
        if (k >= 12 && k < 20 && k % 2 === 0) linie(n, "trp", z, achtel([["G5", 1], ["G5", 1], ["G5", 1], ["F5", 1], ["Eb5", 1], ["D5", 1]], e).map(([x, d]) => [okt(x, -1), d]), .25, { kurz: 1, leg: .7 });
        if (k >= 16 && k < 20) { linie(n, "ooh", z, achtel([["D5", 3], ["C5", 3]], e), .24); n("timp1", 0, z, 0, .3); }
        if (k === 16) n("crash", 0, z, 0, .2);
        t = z + takt;
      }
      n("harfe", ton("G3"), t, 2.5, .3); n("harfe", ton("D4"), t + .05, 2.5, .25); n("harfe", ton("G4"), t + .1, 2.5, .3); n("vc", ton("G2"), t, 2.2, .2);
    }
  };
  /* ---------- Cover, neu arrangiert für die ganze Kapelle ----------
     Jedes Cover besteht aus der überlieferten Melodie, den Akkorden je Takt und einem Plan, wer in welchem Durchgang spielt:
     Vorspiel → erste Strophe leise und sparsam → dann kommen Gegenstimme, Bass, Trommeln, Chor und Glanz dazu → großer Schluss.
     Alle Melodien sind alte Volksweisen oder vor 1929 erschienen (gemeinfrei). */
  const LAGE_COVER = { fl: [60, 96], flst: [60, 96], bfl: [60, 93], pfeife: [72, 96], pic: [76, 100], geige: [55, 93], geigest: [55, 93], oboe: [58, 88], klar: [50, 86],
    dudel: [60, 86], stimme: [57, 81], ooh: [48, 76], harfe: [40, 96], gitarre: [40, 84], akk: [53, 86], hack: [52, 93], cemb: [45, 88], mar: [48, 90], xyl: [65, 100],
    kal: [60, 93], cel: [60, 100], spiel: [64, 100], sitar: [50, 82], shaku: [55, 82], eh: [52, 79], bra: [48, 82], pizz: [40, 79], blech: [48, 80], horn: [41, 69], trp: [55, 82], vc: [36, 67], fag: [36, 67] };
  /* Akkordsymbol → Grundton (MIDI, um C3) und Akkordtöne als Tonklassen */
  function akkord(sym) {
    const m = /^([A-G])([#b]?)(m(?!aj))?(7)?(dim)?$/.exec(sym || "C"); if (!m) return { grund: 48, pk: [0, 4, 7] };
    const g = TONNAME[m[1]] + (m[2] === "#" ? 1 : m[2] === "b" ? -1 : 0), moll = !!m[3], dim = !!m[5];
    const pk = [0, dim || moll ? 3 : 4, dim ? 6 : 7].concat(m[4] ? [10] : []).map(x => (g + x) % 12);
    return { grund: 48 + ((g + 12 - 0) % 12), pk };
  }
  const faltIn = (m, [lo, hi]) => { while (m > hi) m -= 12; while (m < lo) m += 12; return m; };
  /* eine ganze Melodie in die Lage eines Instruments legen (ganze Oktaven, einzelne Ausreißer gefaltet) */
  function melodieLage(noten, gr, okt) {
    const lage = LAGE_COVER[gr] || [48, 90], hs = noten.filter(x => x[0]).map(x => ton(x[0]));
    let best = 0, bestW = -1;
    for (const o of [-24, -12, 0, 12, 24]) { const w = hs.filter(h => h + o >= lage[0] && h + o <= lage[1]).length - Math.abs(o) / 100; if (w > bestW) { bestW = w; best = o; } }
    return noten.map(([x, d]) => [x ? faltIn(ton(x) + best + (okt || 0) * 12, lage) : null, d]);
  }
  /* der Ablauf eines Covers. d = { e: Sekunden je Einheit, takt: Einheiten je Takt, auf: Auftakt, teile: {A: [[Ton, Dauer]…]}, akk: {A: [Akkord je Takt]},
     folge: [{ teil, lead, l, zweit, doppel, begl, bass, trommel, chor, glanz, pad }…], stil: jig | reel | walzer | ballade | hymne | marsch, vor: Takte Vorspiel } */
  function arrangiere(n, d) {
    const e = d.e, T = d.takt * e, stil = d.stil || "ballade";
    let t = 0;
    const akkBei = (liste, zeit) => { const k = Math.max(0, Math.floor((zeit + 1e-6) / T)); return liste[Math.min(k, liste.length - 1)]; };
    /* Begleitung eines Taktes */
    function begleitung(gr, sym, z, l, dichte) {
      if (!gr) return;
      const a = akkord(sym), lage = LAGE_COVER[gr] || [48, 84], tief = faltIn(a.grund, [Math.max(lage[0], 40), Math.max(lage[0], 40) + 11]);
      const ak = a.pk.map(pc => faltIn(tief + ((pc - tief % 12) + 12) % 12, [tief + 1, tief + 16]));
      const kurz = gr === "pizz" || gr === "mar" || gr === "xyl" || gr === "kal" ? .9 : 1.6;
      if (stil === "jig" || stil === "walzer") {
        const halb = d.takt / 2;
        n(gr, tief, z, kurz, l); ak.forEach((x, i) => n(gr, x, z + (stil === "walzer" ? d.takt / 3 : 2) * e + i * .01, kurz * .6, l * .55));
        if (stil === "jig") { n(gr, faltIn(tief + 7, [tief, tief + 12]), z + halb * e, kurz, l * .8); ak.forEach((x, i) => n(gr, x, z + (halb + 2) * e + i * .01, kurz * .6, l * .5)); }
        else ak.forEach((x, i) => n(gr, x, z + 2 * d.takt / 3 * e + i * .01, kurz * .6, l * .5));
      } else if (stil === "reel" || stil === "marsch") {
        const v = d.takt / 4;
        [0, 1, 2, 3].forEach(q => { if (q % 2 === 0) n(gr, q ? faltIn(tief + 7, [tief, tief + 12]) : tief, z + q * v * e, kurz, l); else ak.forEach((x, i) => n(gr, x, z + q * v * e + i * .01, kurz * .6, l * .55)); });
      } else if (stil === "hymne") {
        n(gr, tief, z, T * .98, l); ak.forEach((x, i) => n(gr, x, z + .02 * i, T * .98, l * .6));
      } else { /* Ballade: gebrochene Akkorde */
        const folge = [tief].concat(ak, [ak[0] + 12, ak[1] + 12]).slice(0, Math.max(3, Math.min(8, dichte || d.takt)));
        const schritt = T / folge.length;
        folge.forEach((x, i) => n(gr, x, z + i * schritt, Math.max(1.2, T), l * (i ? .6 : 1)));
      }
    }
    function trommel(stufe, z, letzter) {
      if (!stufe) return;
      if (stil === "jig") { const h = d.takt / 2; n("bodh1", 0, z, 0, .5); n("bodh2", 0, z + h * e, 0, .38); if (stufe > 1) { n("bodh2", 0, z + 2 * e, 0, .22); n("bodh2", 0, z + (h + 2) * e, 0, .22); n("tamb2", 0, z + h * e, 0, .2); } }
      else if (stil === "reel") { const v = d.takt / 4; for (let q = 0; q < 4; q++) n(q % 2 ? "bodh2" : "bodh1", 0, z + q * v * e, 0, q % 2 ? .3 : .45); if (stufe > 1) [1, 3].forEach(q => n("tamb1", 0, z + q * v * e, 0, .22)); }
      else if (stil === "walzer") { n("bodh1", 0, z, 0, .42); if (stufe > 1) { n("tamb2", 0, z + d.takt / 3 * e, 0, .15); n("tamb2", 0, z + 2 * d.takt / 3 * e, 0, .15); } }
      else if (stil === "marsch") { const v = d.takt / 4; for (let q = 0; q < 4; q++) n(q % 2 ? "snare2" : "snare1", 0, z + q * v * e, 0, q % 2 ? .22 : .32); if (stufe > 1) n("bd", 0, z, 0, .3); }
      else { if (stufe > 1) n("timp1", 0, z, 0, .3); else n("bodh1", 0, z, 0, .3); if (letzter && stufe > 1) n("timproll", 0, z + T - 1, 0, .2); }
    }
    /* Vorspiel: Begleitung der ersten Takte */
    const vor = d.vor == null ? 2 : d.vor, erste = d.folge[0], akk0 = d.akk[erste.teil];
    for (let k = 0; k < vor; k++) { begleitung(erste.begl || "harfe", akk0[k % akk0.length], t + k * T, .3); if (erste.trommel) trommel(1, t + k * T); }
    t += vor * T;
    d.folge.forEach((r, ri) => {
      const mel = d.teile[r.teil], akk = d.akk[r.teil], start = t, auf = (d.auf || 0) * e;
      const lead = melodieLage(mel, r.lead, r.okt);
      let z = start;
      lead.forEach(([m, dd]) => { if (m != null) n(r.lead, m, z, dd * e * (r.leg || .93), r.l || .38); z += dd * e; });
      const ende = Math.max(z, start + auf + akk.length * T);
      /* Gegenstimme: der nächste Akkordton unter der Melodie (Terz oder Sexte), weich */
      if (r.zweit) { let zz = start; lead.forEach(([m, dd]) => { if (m != null) { const a = akkord(akkBei(akk, zz - start - auf)), kand = [];
        for (let x = m - 3; x >= m - 9; x--) if (a.pk.includes(((x % 12) + 12) % 12)) { kand.push(x); break; }
        if (kand.length) n(r.zweit, faltIn(kand[0], LAGE_COVER[r.zweit] || [48, 84]), zz, dd * e * .95, r.zl || .2); } zz += dd * e; }); }
      /* Verdopplung eine Oktave höher (oder tiefer) */
      if (r.doppel) { const dl = melodieLage(mel, r.doppel, r.dokt || 0); let zz = start; dl.forEach(([m, dd]) => { if (m != null) n(r.doppel, m, zz, dd * e * .9, r.dl || .18); zz += dd * e; }); }
      akk.forEach((sym, k) => {
        const zt = start + auf + k * T, a = akkord(sym);
        begleitung(r.begl, sym, zt, r.bl || .26, r.dichte);
        if (r.begl2) begleitung(r.begl2, sym, zt, r.bl2 || .16, r.dichte);
        if (r.bass) n(r.bass, faltIn(a.grund, LAGE_COVER[r.bass] ? [LAGE_COVER[r.bass][0], LAGE_COVER[r.bass][0] + 14] : [36, 50]), zt, T * .95, r.bassl || .24);
        if (r.chor) a.pk.slice(1, 3).forEach((pc, i) => n(r.chor, faltIn(48 + pc, LAGE_COVER[r.chor] || [52, 72]), zt + .02 * i, T * .98, r.chorl || .13));
        if (r.pad) a.pk.forEach((pc, i) => n(r.pad, faltIn(55 + pc, LAGE_COVER[r.pad] || [55, 76]), zt, T * .98, r.padl || .1));
        if (r.glanz && k % 2 === 0) n(r.glanz, faltIn(84 + a.pk[0], LAGE_COVER[r.glanz] || [76, 96]), zt, 2.5, r.gll || .16);
        if (r.trommel) trommel(r.trommel, zt, k === akk.length - 1 && ri === d.folge.length - 1);
      });
      t = ende + (r.atem || 0);
    });
    /* Schluss: Schlussakkord der ganzen Kapelle */
    const last = d.folge[d.folge.length - 1], a = akkord(d.akk[last.teil][d.akk[last.teil].length - 1]);
    const tief = faltIn(a.grund, [40, 51]);
    [tief].concat(a.pk.map(pc => faltIn(tief + 12 + ((pc - tief % 12) + 12) % 12, [tief + 12, tief + 24]))).forEach((x, i) => n("harfe", x, t + i * .09, 3, .3));
    if (last.bass) n(last.bass, faltIn(a.grund, LAGE_COVER[last.bass] ? [LAGE_COVER[last.bass][0], LAGE_COVER[last.bass][0] + 14] : [36, 50]), t, 2.6, .25);
    if (last.chor) a.pk.forEach((pc, i) => n(last.chor, faltIn(52 + pc, [52, 72]), t + .03 * i, 2.8, .14));
    if (last.glanz) n(last.glanz, faltIn(84 + a.pk[0], LAGE_COVER[last.glanz] || [76, 96]), t + .3, 3, .2);
    if (d.schlussSchlag) n(d.schlussSchlag, 0, t, 0, .4);
    return t + 3;
  }
  /* kurze Schreibweise für Reels und Jigs (ABC): Großbuchstaben = 4. Oktave, klein = 5., ' höher, , tiefer, ^ # _ b, Zahl = Länge, z = Pause */
  function abc(str, vorz) {
    const vz = {}; (vorz || "").split(" ").filter(Boolean).forEach(x => { vz[x[0]] = x[1]; });
    const out = []; const re = /([\^_=]?)([A-Ga-gz])([',]*)(\d*\/?\d*)/g; let m;
    const clean = str.replace(/[|:\]\[]/g, " ");
    while ((m = re.exec(clean))) {
      const [, acc, b, okt, dur] = m;
      let d = 1; if (dur) { if (dur.includes("/")) { const [a, c] = dur.split("/"); d = (+a || 1) / (+c || 2); } else d = +dur; }
      if (b === "z") { out.push([null, d]); continue; }
      const gross = b === b.toUpperCase(), name = b.toUpperCase();
      let o = gross ? 4 : 5; o += (okt.match(/'/g) || []).length - (okt.match(/,/g) || []).length;
      const vorzeichen = acc === "^" ? "#" : acc === "_" ? "b" : acc === "=" ? "" : (vz[name] || "");
      out.push([name + vorzeichen + o, d]);
    }
    return out;
  }
  const NEUE_COVER = {
    /* ---- bekannte Cover, neu arrangiert ---- */
    amazinggrace(n) {
      const m = [["D4", 1], ["G4", 2], ["B4", .5], ["G4", .5], ["B4", 2], ["A4", 1], ["G4", 2], ["E4", 1], ["D4", 2], ["D4", 1], ["G4", 2], ["B4", .5], ["G4", .5], ["B4", 2], ["A4", 1], ["D5", 3],
        ["D5", 2], ["B4", 1], ["D5", 2], ["B4", .5], ["D5", .5], ["B4", 2], ["A4", 1], ["G4", 2], ["E4", 1], ["D4", 2], ["D4", 1], ["G4", 2], ["B4", .5], ["G4", .5], ["B4", 2], ["A4", 1], ["G4", 3]];
      const A = ["G", "G", "C", "G", "G", "G", "D", "G", "G", "G", "C", "G", "G", "D", "G"];
      arrangiere(n, { e: .55, takt: 3, auf: 1, stil: "walzer", vor: 2, teile: { A: m }, akk: { A },
        folge: [{ teil: "A", lead: "shaku", l: .4, begl: "harfe", bl: .2 },
          { teil: "A", lead: "dudel", l: .3, zweit: "bra", zl: .16, begl: "harfe", bass: "vc", chor: "ooh", atem: .3 },
          { teil: "A", lead: "dudel", l: .32, doppel: "pfeife", dl: .12, zweit: "akk", zl: .14, begl: "harfe", bass: "vc", chor: "ooh", glanz: "rgl", pad: "orgel", padl: .07, trommel: 2 }] });
    },
    scarborough(n) {
      const m = [["D4", 2], ["D4", 1], ["A4", 2], ["A4", 1], ["E4", 1.5], ["F4", .5], ["E4", 1], ["D4", 3],
        [null, 1], ["A4", 1], ["C5", 1], ["D5", 2], ["C5", 1], ["A4", 1], ["B4", 1], ["G4", 1], ["A4", 3],
        ["D5", 2], ["D5", 1], ["C5", 2], ["A4", 1], ["A4", 1], ["G4", 1], ["F4", 1], ["E4", 1], ["C4", 2],
        ["D4", 2], ["A4", 1], ["G4", 2], ["F4", 1], ["E4", 1], ["D4", 1], ["C4", 1], ["D4", 3]];
      const A = ["Dm", "Dm", "C", "Dm", "Dm", "F", "C", "Dm", "F", "C", "Dm", "Dm", "C", "Dm", "C", "Dm"];
      arrangiere(n, { e: .52, takt: 3, stil: "ballade", vor: 2, teile: { A: m }, akk: { A },
        folge: [{ teil: "A", lead: "bfl", l: .36, begl: "harfe", bl: .2, dichte: 3 },
          { teil: "A", lead: "stimme", l: .3, zweit: "eh", zl: .15, begl: "hack", bl: .18, dichte: 6, glanz: "cel" },
          { teil: "A", lead: "geige", l: .36, doppel: "fl", dokt: 1, dl: .12, begl: "harfe", bass: "vc", chor: "ooh", glanz: "cel", trommel: 1 }] });
    },
    greensleeves(n) {
      const s = [["A4", 1], ["C5", 2], ["D5", 1], ["E5", 1.5], ["F5", .5], ["E5", 1], ["D5", 2], ["B4", 1], ["G4", 1.5], ["A4", .5], ["B4", 1], ["C5", 2], ["A4", 1], ["A4", 1.5], ["G#4", .5], ["A4", 1], ["B4", 2], ["G#4", 1], ["E4", 2],
        ["A4", 1], ["C5", 2], ["D5", 1], ["E5", 1.5], ["F5", .5], ["E5", 1], ["D5", 2], ["B4", 1], ["G4", 1.5], ["A4", .5], ["B4", 1], ["C5", 1.5], ["B4", .5], ["A4", 1], ["G#4", 1.5], ["F#4", .5], ["G#4", 1], ["A4", 3], ["A4", 2]];
      const r = [[null, 1], ["G5", 3], ["G5", 1.5], ["F#5", .5], ["E5", 1], ["D5", 2], ["B4", 1], ["G4", 1.5], ["A4", .5], ["B4", 1], ["C5", 2], ["A4", 1], ["A4", 1.5], ["G#4", .5], ["A4", 1], ["B4", 2], ["G#4", 1], ["E4", 3],
        ["G5", 3], ["G5", 1.5], ["F#5", .5], ["E5", 1], ["D5", 2], ["B4", 1], ["G4", 1.5], ["A4", .5], ["B4", 1], ["C5", 1.5], ["B4", .5], ["A4", 1], ["G#4", 1.5], ["F#4", .5], ["G#4", 1], ["A4", 3], ["A4", 2]];
      arrangiere(n, { e: .2, takt: 3, auf: 1, stil: "walzer", vor: 2, teile: { S: s, R: r },
        akk: { S: ["Am", "Am", "G", "G", "Am", "Am", "E", "E", "Am", "Am", "G", "G", "Am", "E", "Am", "Am"], R: ["C", "C", "G", "G", "Am", "Am", "E", "E", "C", "C", "G", "G", "Am", "E", "Am", "Am"] },
        folge: [{ teil: "S", lead: "cemb", l: .34, begl: "harfe", bl: .18 }, { teil: "R", lead: "fl", l: .36, begl: "harfe", bl: .18, glanz: "kal" },
          { teil: "S", lead: "geige", l: .36, zweit: "bra", zl: .15, begl: "cemb", bl: .16, bass: "vc" }, { teil: "R", lead: "oboe", l: .32, doppel: "fl", dokt: 1, dl: .12, zweit: "bra", zl: .14, begl: "harfe", bass: "vc", chor: "ooh", glanz: "cel", trommel: 1 }] });
    },
    matrose(n) {
      const zeile = (a, b) => [[a, 1], [a, .5], [a, .5], [a, 1], [a, .5], [a, .5], [a, 1], [b[0], 1], [b[1], 1], [b[2], 1]];
      const strophe = zeile("A4", ["D4", "F4", "A4"]).concat(zeile("G4", ["C4", "E4", "G4"]), zeile("A4", ["B4", "C5", "D5"]), [["C5", 1], ["A4", 1], ["G4", 1], ["E4", 1], ["D4", 2], ["D4", 2]]);
      const chorz = (a, b) => [[a, 2], [a, 1.5], [a, .5], [a, 1], [b[0], 1], [b[1], 1], [b[2], 1]];
      const refrain = chorz("A4", ["D4", "F4", "A4"]).concat(chorz("G4", ["C4", "E4", "G4"]), chorz("A4", ["B4", "C5", "D5"]), [["C5", 1], ["A4", 1], ["G4", 1], ["E4", 1], ["D4", 2], ["D4", 2]]);
      const A = ["Dm", "Dm", "C", "C", "Dm", "Dm", "C", "Dm"];
      arrangiere(n, { e: .4, takt: 4, stil: "reel", vor: 2, schlussSchlag: "bodh1", teile: { S: strophe, R: refrain }, akk: { S: A, R: A },
        folge: [{ teil: "S", lead: "akk", l: .34, begl: "gitarre", bl: .24, trommel: 1 }, { teil: "R", lead: "stimme", l: .3, zweit: "ooh", zl: .14, begl: "gitarre", bass: "pizz", trommel: 2 },
          { teil: "S", lead: "pfeife", l: .26, zweit: "akk", zl: .14, begl: "akk", bl: .18, bass: "pizz", trommel: 2 }, { teil: "R", lead: "stimme", l: .3, doppel: "akk", dl: .16, zweit: "ooh", zl: .16, begl: "gitarre", bass: "tuba", chor: "ooh", trommel: 2 }] });
    },
    korobeiniki(n) {
      const A = [["E5", 1], ["B4", .5], ["C5", .5], ["D5", 1], ["C5", .5], ["B4", .5], ["A4", 1], ["A4", .5], ["C5", .5], ["E5", 1], ["D5", .5], ["C5", .5], ["B4", 1.5], ["C5", .5], ["D5", 1], ["E5", 1], ["C5", 1], ["A4", 1], ["A4", 2],
        [null, .5], ["D5", 1], ["F5", .5], ["A5", 1], ["G5", .5], ["F5", .5], ["E5", 1.5], ["C5", .5], ["E5", 1], ["D5", .5], ["C5", .5], ["B4", 1], ["B4", .5], ["C5", .5], ["D5", 1], ["E5", 1], ["C5", 1], ["A4", 1], ["A4", 2]];
      const B = [["E5", 2], ["C5", 2], ["D5", 2], ["B4", 2], ["C5", 2], ["A4", 2], ["G#4", 2], ["B4", 2], ["E5", 2], ["C5", 2], ["D5", 2], ["B4", 2], ["C5", 1], ["E5", 1], ["A5", 2], ["G#5", 4]];
      const aA = ["E", "Am", "E", "Am", "Dm", "C", "E", "Am"], aB = ["Am", "E", "Am", "E", "Am", "E", "Am", "E"];
      arrangiere(n, { e: .36, takt: 4, stil: "marsch", vor: 2, teile: { A, B }, akk: { A: aA, B: aB },
        folge: [{ teil: "A", lead: "akk", l: .32, begl: "pizz", bl: .26 }, { teil: "A", lead: "geigest", l: .36, leg: .7, zweit: "akk", zl: .14, begl: "pizz", bass: "kb", trommel: 1 },
          { teil: "B", lead: "bra", l: .34, chor: "ooh", begl: "akk", bl: .16, bass: "kb" }, { teil: "A", lead: "xyl", l: .3, doppel: "geigest", dokt: -1, dl: .22, begl: "pizz", bass: "kb", trommel: 2 },
          { teil: "A", lead: "geigest", l: .4, leg: .7, doppel: "blech", dokt: -1, dl: .18, zweit: "akk", zl: .16, begl: "pizz", bass: "tuba", chor: "ooh", trommel: 2 }] });
    },
    auldlangsyne(n) {
      const s = [["C4", 1], ["F4", 1.5], ["F4", .5], ["F4", 1], ["A4", 1], ["G4", 1.5], ["F4", .5], ["G4", 1], ["A4", .5], ["G4", .5], ["F4", 1.5], ["F4", .5], ["A4", 1], ["C5", 1], ["D5", 3],
        ["D5", 1], ["C5", 1.5], ["A4", .5], ["A4", 1], ["F4", 1], ["G4", 1.5], ["F4", .5], ["G4", 1], ["A4", .5], ["G4", .5], ["F4", 1.5], ["D4", .5], ["D4", 1], ["C4", 1], ["F4", 3]];
      const A = ["F", "F", "C", "C", "F", "F", "Bb", "Bb", "F", "F", "C", "C", "Dm", "Bb", "F", "F"];
      arrangiere(n, { e: .5, takt: 2, auf: 1, stil: "hymne", vor: 2, teile: { A: s }, akk: { A },
        folge: [{ teil: "A", lead: "fl", l: .36, begl: "harfe", bl: .16 }, { teil: "A", lead: "stimme", l: .3, zweit: "eh", zl: .14, begl: "akk", bl: .14, bass: "vc", atem: .2 },
          { teil: "A", lead: "geige", l: .36, doppel: "stimme", dl: .2, zweit: "bra", zl: .15, begl: "akk", bl: .14, bass: "vc", chor: "ooh", glanz: "rgl", trommel: 2 }] });
    },
    washerwoman(n) {
      const A = abc("BGG DGG BGB dcB cAA EAA cAc edc BGG DGG BGB dcB cBc Adc BGG G2z", "F#");
      const B = abc("dGG BGG dGG BGG eAA cAA eAA cAA dGG BGG ded cBA BcA FAd BGG G2z", "F#");
      const aA = ["G", "G", "Am", "D", "G", "G", "D", "G"], aB = ["G", "G", "Am", "Am", "G", "G", "D", "G"];
      arrangiere(n, { e: .15, takt: 6, stil: "jig", vor: 2, schlussSchlag: "bodh1", teile: { A, B }, akk: { A: aA, B: aB },
        folge: [{ teil: "A", lead: "geige", l: .36, leg: .85, begl: "gitarre", bl: .22, trommel: 1 }, { teil: "A", lead: "pfeife", l: .24, leg: .85, begl: "gitarre", bass: "pizz", trommel: 2 },
          { teil: "B", lead: "akk", l: .3, leg: .85, begl: "gitarre", bass: "pizz", trommel: 2 }, { teil: "B", lead: "hack", l: .32, begl: "akk", bl: .16, bass: "pizz", trommel: 2 },
          { teil: "A", lead: "geige", l: .38, leg: .85, doppel: "pfeife", dokt: 1, dl: .14, begl: "gitarre", begl2: "akk", bass: "pizz", trommel: 2 }] });
    },
    sakura(n) {
      const m = [["A4", 1], ["A4", 1], ["B4", 2], ["A4", 1], ["A4", 1], ["B4", 2], ["A4", 1], ["B4", 1], ["C5", 1], ["B4", 1], ["A4", 1], ["B4", .5], ["A4", .5], ["F4", 2],
        ["E4", 1], ["C4", 1], ["E4", 1], ["F4", 1], ["E4", 1], ["E4", .5], ["C4", .5], ["B3", 2], ["A4", 1], ["B4", 1], ["C5", 1], ["B4", 1], ["A4", 1], ["B4", .5], ["A4", .5], ["F4", 2],
        ["E4", 1], ["C4", 1], ["E4", 1], ["F4", 1], ["E4", 1], ["E4", .5], ["C4", .5], ["B3", 2], ["A4", 1], ["A4", 1], ["B4", 2], ["A4", 1], ["A4", 1], ["B4", 2],
        ["E4", 1], ["F4", 1], ["B4", .5], ["A4", .5], ["F4", 1], ["E4", 4]];
      const A = ["Am", "Am", "Am", "Dm", "Am", "E", "Am", "Dm", "Am", "E", "Am", "Am", "Dm", "E"];
      arrangiere(n, { e: .5, takt: 4, stil: "ballade", vor: 1, schlussSchlag: "gong", teile: { A: m }, akk: { A },
        folge: [{ teil: "A", lead: "kal", l: .4, begl: "harfe", bl: .16, dichte: 4 }, { teil: "A", lead: "shaku", l: .38, zweit: "hack", zl: .14, begl: "harfe", bl: .16, dichte: 4, glanz: "spiel", atem: .4 },
          { teil: "A", lead: "sitar", l: .34, doppel: "shaku", dl: .2, dokt: 0, begl: "hack", bl: .16, dichte: 8, chor: "ooh", glanz: "cel" }] });
    },
    /* ---- neue Cover (überlieferte Tanzweisen) ---- */
    swallowtail(n) { /* „Swallowtail Jig“ – irischer Jig, E-dorisch */
      const A = abc("GEE BEE GEE BAG FDD ADD dcd AGF GEE BEE GEE B2c dcd AGF GEE E3", "F# C#");
      const B = abc("Bcd e2f e2f edB Bcd e2f edB d3 Bcd e2f e2f edB dcd AGF GEE E3", "F# C#");
      const aA = ["Em", "Em", "D", "D", "Em", "Em", "D", "Em"], aB = ["Em", "Em", "Em", "D", "Em", "Em", "D", "Em"];
      arrangiere(n, { e: .16, takt: 6, stil: "jig", vor: 2, schlussSchlag: "bodh1", teile: { A, B }, akk: { A: aA, B: aB },
        folge: [{ teil: "A", lead: "pfeife", l: .26, leg: .85, begl: "gitarre", bl: .2, trommel: 1 }, { teil: "A", lead: "geige", l: .36, leg: .85, begl: "gitarre", bass: "pizz", trommel: 2 },
          { teil: "B", lead: "geige", l: .36, leg: .85, zweit: "akk", zl: .14, begl: "gitarre", bass: "pizz", trommel: 2 }, { teil: "B", lead: "hack", l: .32, doppel: "pfeife", dokt: 1, dl: .12, begl: "akk", bl: .16, bass: "pizz", trommel: 2 },
          { teil: "A", lead: "dudel", l: .3, leg: .85, doppel: "geige", dl: .2, begl: "gitarre", begl2: "akk", bass: "pizz", trommel: 2 }] });
    },
    drowsymaggie(n) { /* „Drowsy Maggie“ – irischer Reel */
      const A = abc("E2BE dEBE E2BE AFDF E2BE dEBE BABc dAFD", "F# C#");
      const B = abc("d2fd c2ec defg afge d2fd c2ec BABc dAFA", "F# C#");
      const aA = ["Em", "D", "Em", "D"], aB = ["D", "D", "D", "Bm"];
      arrangiere(n, { e: .14, takt: 8, stil: "reel", vor: 2, schlussSchlag: "bodh1", teile: { A: A.concat(A), B: B.concat(B) }, akk: { A: aA.concat(aA), B: aB.concat(aB) },
        folge: [{ teil: "A", lead: "geige", l: .36, leg: .82, begl: "gitarre", bl: .2, trommel: 1 }, { teil: "B", lead: "pfeife", l: .24, leg: .82, begl: "gitarre", bass: "pizz", trommel: 2 },
          { teil: "A", lead: "akk", l: .3, leg: .82, doppel: "geige", dl: .2, begl: "gitarre", bass: "pizz", trommel: 2 }, { teil: "B", lead: "geige", l: .38, leg: .82, doppel: "pfeife", dokt: 1, dl: .12, zweit: "akk", zl: .12, begl: "gitarre", bass: "pizz", trommel: 2 }] });
    },
    cooley(n) { /* „Cooley's Reel“ – irischer Reel */
      const A = abc("EBBA B2EB B2AB dBAG FDAD BDAD FDAD dAFD EBBA B2EB B2AB defg afec dBAF DEFD E4", "F# C#");
      const B = abc("eB B2 efge eB B2 gedB A2FA DAFA A2FA defg eB B2 eB B2 eB B2 defg afec dBAF DEFD E4", "F# C#");
      const aA = ["Em", "Em", "D", "D", "Em", "Em", "D", "Em"], aB = ["Em", "Em", "D", "D", "Em", "Em", "D", "Em"];
      arrangiere(n, { e: .135, takt: 8, stil: "reel", vor: 2, schlussSchlag: "bodh1", teile: { A, B }, akk: { A: aA, B: aB },
        folge: [{ teil: "A", lead: "fl", l: .36, leg: .82, begl: "gitarre", bl: .2, trommel: 1 }, { teil: "B", lead: "geige", l: .36, leg: .82, begl: "gitarre", bass: "pizz", trommel: 2 },
          { teil: "A", lead: "hack", l: .32, doppel: "fl", dl: .16, begl: "akk", bl: .16, bass: "pizz", trommel: 2 }, { teil: "B", lead: "dudel", l: .3, leg: .85, doppel: "geige", dl: .2, begl: "gitarre", begl2: "akk", bass: "pizz", trommel: 2 }] });
    },
    morrison(n) { /* „Morrison's Jig“ – irischer Jig */
      const A = abc("E3 B3 EBE AFD EDE B3 dcB AFD E3 B3 EBE AFD G3 FGA dAG FED", "F# C#");
      const B = abc("Bee fee aee fee Bee fee a2g fed Bee fee aee fee gfe d2A BAG FED", "F# C#");
      const aA = ["Em", "D", "Em", "D", "Em", "D", "G", "D"], aB = ["Em", "Em", "Em", "D", "Em", "Em", "G", "D"];
      arrangiere(n, { e: .16, takt: 6, stil: "jig", vor: 2, schlussSchlag: "bodh1", teile: { A, B, E: abc("E3 B3 EBE AFD EDE B3 dcB AFD E3 B3 EBE AFD G3 FGA BAG E3", "F# C#") },
        akk: { A: aA, B: aB, E: ["Em", "D", "Em", "D", "Em", "D", "G", "Em"] },
        folge: [{ teil: "A", lead: "bfl", l: .32, leg: .85, begl: "gitarre", bl: .2, trommel: 1 }, { teil: "B", lead: "geige", l: .36, leg: .85, begl: "gitarre", bass: "pizz", trommel: 2 },
          { teil: "A", lead: "akk", l: .3, leg: .85, zweit: "bra", zl: .12, begl: "gitarre", bass: "pizz", trommel: 2 }, { teil: "B", lead: "pfeife", l: .24, leg: .85, doppel: "geige", dokt: -1, dl: .2, begl: "akk", bl: .16, bass: "pizz", trommel: 2 },
          { teil: "E", lead: "geige", l: .38, leg: .85, doppel: "bfl", dl: .16, begl: "gitarre", begl2: "akk", bass: "pizz", trommel: 2 }] });
    },
    folia(n) { /* „La Folia“ – der alte spanisch-portugiesische Tanz über seinen berühmten Bass (17. Jh.), mit eigenen Variationen */
      const akk = ["Dm", "A", "Dm", "C", "F", "C", "Dm", "A", "Dm", "A", "Dm", "C", "F", "C", "Dm", "Dm"];
      const thema = [["D5", 3], ["C#5", 2], ["E5", 1], ["D5", 2], ["F5", 1], ["E5", 3], ["F5", 2], ["C5", 1], ["E5", 2], ["G4", 1], ["D5", 2], ["F4", 1], ["E4", 3],
        ["F4", 2], ["A4", 1], ["E4", 2], ["A4", 1], ["D4", 2], ["F4", 1], ["G4", 2], ["E4", 1], ["A4", 2], ["C5", 1], ["G4", 2], ["E4", 1], ["F4", 1.5], ["E4", 1.5], ["D4", 3]];
      const arp = [["D5", "F5", "A4"], ["C#5", "E5", "A4"], ["D5", "A4", "F4"], ["E5", "C5", "G4"], ["F5", "C5", "A4"], ["E5", "G4", "C5"], ["D5", "F5", "A4"], ["E5", "C#5", "A4"],
        ["F5", "D5", "A4"], ["E5", "A4", "C#5"], ["D5", "F4", "A4"], ["C5", "E5", "G4"], ["A4", "C5", "F5"], ["G4", "C5", "E5"], ["F5", "E5", "D5"]];
      const var1 = arp.flatMap(b => b.map(x => [x, 1])).concat([["D5", 3]]);
      arrangiere(n, { e: .3, takt: 3, stil: "walzer", vor: 2, schlussSchlag: "timp1", teile: { T: thema, V: var1 }, akk: { T: akk, V: akk },
        folge: [{ teil: "T", lead: "cemb", l: .34, begl: "gitarre", bl: .2 }, { teil: "V", lead: "geige", l: .34, begl: "cemb", bl: .16, bass: "vc" },
          { teil: "T", lead: "blech", l: .26, zweit: "bra", zl: .16, begl: "cemb", bl: .14, bass: "kb", chor: "ooh", trommel: 2 }, { teil: "V", lead: "geigest", l: .38, leg: .75, doppel: "xyl", dokt: 1, dl: .14, begl: "harfe", bass: "kb", trommel: 2 }] });
    }
  };
  Object.assign(COVER_STUECKE, NEUE_COVER);
  const COVER = Object.keys(COVER_STUECKE);
  Object.assign(KLASSIK, COVER_STUECKE);
  /* Abspielen: die Partitur wird vorab gelesen, die Aufnahmen geladen, dann Stück für Stück eingeplant.
     Ein zweiter Druck auf denselben Knopf (oder ■ Anhalten) beendet das Stück weich. */
  let klassikLauf = null, musikPauseAb = 0, fortsetzTimer = 0;
  /* Läuft Musik, blendet sie für das Stück weich aus und hält am Taktende an – danach setzt sie weich wieder ein */
  function musikPausieren() {
    clearTimeout(fortsetzTimer);
    if (!laeuft) return 0;
    if (musikPauseAb) return 1; /* schon pausiert – z. B. weil gerade ein anderes Stück lief */
    const j = ctx.currentTime; musikPauseAb = j + 1.1;
    ducken.gain.cancelScheduledValues(j); ducken.gain.setValueAtTime(ducken.gain.value, j); ducken.gain.setTargetAtTime(0, j, .3);
    setTimeout(bordunAus, 900);
    return 1;
  }
  function musikFortsetzen() {
    clearTimeout(fortsetzTimer);
    if (!musikPauseAb || klassikLauf) return;
    musikPauseAb = 0;
    if (!laeuft || !ctx) return;
    const j = ctx.currentTime; schritt = 0; naechste = j + .15; padAkkord = -1;
    ducken.gain.cancelScheduledValues(j); ducken.gain.setValueAtTime(0, j); ducken.gain.setTargetAtTime(1, j + .1, .6); musikStumm = false;
    if (S.bordun) setTimeout(bordunAn, 300);
  }
  /* ersetzt = gleich folgt ein anderes Stück: dann bleibt die Musik pausiert */
  function klassikStopp(sanft, ersetzt) {
    const k = klassikLauf; if (!k) return;
    klassikLauf = null; clearInterval(k.timer); klassikQ.length = 0;
    const j = ctx.currentTime; k.bus.gain.cancelScheduledValues(j); k.bus.gain.setTargetAtTime(0, j, sanft ? .25 : .06);
    setTimeout(() => { try { k.bus.disconnect(); } catch (_) {} }, 1500);
    clearTimeout(fortsetzTimer);
    if (!ersetzt) fortsetzTimer = setTimeout(musikFortsetzen, sanft ? 500 : 100);
    klassikKnoepfe();
  }
  function klassikKnoepfe() { root.querySelectorAll("[data-sfx]").forEach(b => b.classList.toggle("spielt", !!klassikLauf && klassikLauf.art === b.dataset.sfx)); try { favMarkieren(); } catch (_) {} try { miniAnzeigen(); } catch (_) {} }
  async function klassikSpielen(art, laut) {
    const f = KLASSIK[art]; if (!f || !ctx) return;
    if (klassikLauf) { const war = klassikLauf.art; klassikStopp(true, war !== art); if (war === art) return; }
    const noten = [], namen = new Set();
    f((gr, m, t, d, g, o) => { const k = SAMPLE_KARTE[gr] ? gr + "_" + naechsteProbe(gr, m) : gr; namen.add(k); noten.push([t, gr, m, d, g, o]); });
    noten.sort((a, b) => a[0] - b[0]);
    const lauf = { art, timer: null, bus: ctx.createGain() }; klassikLauf = lauf; klassikKnoepfe();
    await Promise.all([...namen].map(sampleLaden));
    if (klassikLauf !== lauf) return;
    /* Cover sind Musik und folgen dem Musik-Regler, Klassiker-Effekte dem Effekte-Regler */
    lauf.bus.connect(COVER_LISTE.includes(art) && kompRef ? kompRef : sfxBus);
    /* Klassiker und Cover sind Musik: sie gehen in den Raumhall (Hall-Regler) – nur die Geräuscheffekte bleiben trocken */
    if (hallEin) { const hs = ctx.createGain(); hs.gain.value = COVER_LISTE.includes(art) ? .8 : .5; lauf.bus.connect(hs); hs.connect(hallEin); }
    const pause = musikPausieren();
    const ende = noten.reduce((s, x) => Math.max(s, x[0] + (x[3] || 2)), 0);
    const z = ctx.currentTime + (pause ? .7 : .08), l = (laut || 1) * (COVER_LISTE.includes(art) ? .55 : .75) * ({ zarathustra: .75, trauermarsch: .85, nachtmusik: 1.5, fruehling: 2, zirkus: 1.2, galopp: 1.2, angriff: 1.2, zapfenstreich: 1.15 }[art] || 1);
    let i = 0;
    const planen2 = () => {
      const bis = ctx.currentTime + 1.2 - z;
      while (i < noten.length && noten[i][0] < bis) {
        const [t, gr, m, d, g, o] = noten[i++];
        if (klassikQ.length < 400) klassikQ.push([z + t, BAND_SPUR(gr)]); geistMerken(gr, z + t);
        if (KAP_FIG[gr] && kapQ.length < 300) kapQ.push([z + t, gr]); /* die Kapellen-Musiker treten auch bei den Covern auf */
        if (!SAMPLE_KARTE[gr]) probe(gr, 0, z + t, lauf.bus, g * l);
        else probe(gr, m, z + t, lauf.bus, g * l, o && o.kurz ? { dauer: Math.max(.08, d), aus: .04 } : { ein: .02, aus: Math.min(.25, d * .3), dauer: d + .05 });
      }
      if (i >= noten.length && ctx.currentTime > z + ende - .6) { clearInterval(lauf.timer); if (klassikLauf === lauf) { klassikLauf = null; klassikKnoepfe(); musikFortsetzen(); } }
    };
    planen2(); lauf.timer = setInterval(planen2, 250); malenStarten();
    if (!pause) musikDucken(z, ende + .4);
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
    hackbrett: { griff: [197, 104, "Q160 104"], schlag: [160, 124, "Q104 126 118 132 L"],
      bewegung: { mel: [[".barradin .hand-griff", "translate(-2px, 6px)", 200]], bass: [[".barradin .arm-schlag", "translate(1px, 5px)", 200]] } },
    cembalo: { griff: [196, 124, "Q166 108"], schlag: [148, 126, "Q104 124 118 128 L"],
      bewegung: { mel: [[".barradin .hand-griff", "translate(0, 3px)", 160]], bass: [[".barradin .arm-schlag", "translate(0, 3px)", 160]] } },
    akkordeon: { griff: [176, 114, "Q160 102"], schlag: [131, 124, "Q104 124 118 128 L"],
      bewegung: { bass: [[".barradin .m-akkordeon .balg", "scaleX(.86)", 320]], mel: [[".barradin .hand-griff", "translate(0, 2px)", 160]] } },
    sitar: { griff: [214, 82, "Q168 94"], schlag: [161, 126, "Q104 124 118 128 L"] },
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
  <g class="req f-taiko">
   <path d="M76 168 L68 192 M118 168 L126 192" stroke="#3a2412" stroke-width="3"/>
   <rect x="67" y="134" width="60" height="42" rx="16" fill="#7a3a1a" stroke="#3a1a0a" stroke-width="1.2"/>
   <path d="M69 144 H125 M69 166 H125" stroke="#c9a24a" stroke-width="1"/>
   <g fill="#e0b84a"><circle cx="75" cy="144" r="1.2"/><circle cx="85" cy="144" r="1.2"/><circle cx="97" cy="144" r="1.2"/><circle cx="109" cy="144" r="1.2"/><circle cx="119" cy="144" r="1.2"/><circle cx="75" cy="166" r="1.2"/><circle cx="85" cy="166" r="1.2"/><circle cx="97" cy="166" r="1.2"/><circle cx="109" cy="166" r="1.2"/><circle cx="119" cy="166" r="1.2"/></g>
   <path d="M84 150 Q97 160 110 150" stroke="#d8c49a" stroke-width="1.5" fill="none"/>
   <ellipse class="trommelfell" cx="97" cy="135" rx="29" ry="7.5" fill="#e8d9b5" stroke="#3a1a0a" stroke-width="1.4"/></g>
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
  <g class="req m-hackbrett">
   <path d="M126 142 L204 116 L210 129 L134 157 Z" fill="#8a5a2a" stroke="#3a2412" stroke-width="1.2"/>
   <path class="saiten" d="M132 146 L204 121 M134 150 L206 125 M136 153 L208 128" stroke="#efe2c2" stroke-width=".6"/>
   <circle cx="168" cy="137" r="4" fill="#3a2412"/>
   <path d="M197 104 L188 120 M160 124 L170 137" stroke="#d8c49a" stroke-width="1.8"/><circle cx="188" cy="121" r="2.4" fill="#9b3a2f"/><circle cx="170" cy="138" r="2.4" fill="#9b3a2f"/></g>
  <g class="req m-cembalo">
   <path d="M118 130 H212 Q226 130 226 140 L222 150 H122 Z" fill="#3a1f12" stroke="#c9a24a" stroke-width="1.2"/>
   <rect x="128" y="124" width="84" height="7" fill="#f4f0e6" stroke="#2a1a10" stroke-width=".7"/>
   <g fill="#1a1010"><rect x="133" y="124" width="3" height="4"/><rect x="141" y="124" width="3" height="4"/><rect x="153" y="124" width="3" height="4"/><rect x="161" y="124" width="3" height="4"/><rect x="169" y="124" width="3" height="4"/><rect x="181" y="124" width="3" height="4"/><rect x="189" y="124" width="3" height="4"/><rect x="201" y="124" width="3" height="4"/></g>
   <path class="saiten" d="M130 140 H214" stroke="#c9a24a" stroke-width=".8"/></g>
  <g class="req m-akkordeon">
   <rect x="124" y="98" width="12" height="44" rx="3" fill="#b0302a" stroke="#5a1010"/>
   <g class="balg"><path d="M136 98 L141 103 L136 108 L141 113 L136 118 L141 123 L136 128 L141 133 L136 142 H168 L163 133 L168 128 L163 123 L168 118 L163 113 L168 108 L163 103 L168 98 Z" fill="#c83a30" stroke="#5a1010" stroke-width=".8"/>
   <path class="saiten" d="M141 103 H163 M141 113 H163 M141 123 H163 M141 133 H163" stroke="#e0b84a" stroke-width=".8"/></g>
   <rect x="168" y="98" width="14" height="44" rx="3" fill="#efe6d4" stroke="#6b1a14"/>
   <g fill="#1a1010"><rect x="170" y="102" width="6" height="2.4"/><rect x="170" y="108" width="6" height="2.4"/><rect x="170" y="114" width="6" height="2.4"/><rect x="170" y="120" width="6" height="2.4"/><rect x="170" y="126" width="6" height="2.4"/><rect x="170" y="132" width="6" height="2.4"/></g>
   <g fill="#f4f0e0"><circle cx="130" cy="106" r="1.5"/><circle cx="130" cy="113" r="1.5"/><circle cx="130" cy="120" r="1.5"/><circle cx="130" cy="127" r="1.5"/></g></g>
  <g class="req m-sitar">
   <path d="M160 128 L250 40 L256 46 L168 134 Z" fill="#6a3a1a" stroke="#2a1a10" stroke-width="1.2"/>
   <g stroke="#e0b84a" stroke-width="1"><path d="M180 112 l6 6 M192 100 l6 6 M204 88 l6 6 M216 76 l6 6 M228 64 l6 6"/></g>
   <circle cx="254" cy="40" r="8" fill="#a8643a" stroke="#4a2410" stroke-width="1.2"/>
   <ellipse cx="146" cy="144" rx="32" ry="27" transform="rotate(-38 146 144)" fill="#b0703c" stroke="#4a2410" stroke-width="2"/>
   <ellipse cx="146" cy="144" rx="22" ry="17" transform="rotate(-38 146 144)" fill="none" stroke="#e0b84a" stroke-width="1" opacity=".8"/>
   <path class="saiten" d="M134 154 L252 42 M137 156 L254 44" stroke="#ebe2cc" stroke-width=".6" opacity=".9"/></g>
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
   <g class="req e-klarinette"><path d="M58 80 L100 110" stroke="#18141a" stroke-width="4.4" stroke-linecap="round"/><path d="M97 107 L107 115 L100 118 Z" fill="#18141a"/>
    <g fill="#c8ccd6"><circle cx="78" cy="94.3" r="1.2"/><circle cx="84" cy="98.6" r="1.2"/><circle cx="90" cy="102.9" r="1.2"/></g><path d="M60 82 l2 -2" stroke="#c8ccd6" stroke-width="1.6"/></g>
   <g class="req e-oboe"><path d="M58 80 L98 108" stroke="#2a1a14" stroke-width="3.4" stroke-linecap="round"/><path d="M96 106 L103 112 L98 114 Z" fill="#2a1a14"/>
    <g fill="#d8dce6"><circle cx="80" cy="95.4" r="1"/><circle cx="86" cy="99.6" r="1"/><circle cx="92" cy="103.8" r="1"/></g><path d="M56 79 l3 1" stroke="#c9a24a" stroke-width="1.4"/></g>
   <g class="req e-blockfloete"><path d="M58 80 L98 108" stroke="#d8b070" stroke-width="4.4" stroke-linecap="round"/><path d="M95 105 L103 112 L97 114 Z" fill="#c09050"/>
    <g fill="#5a3a1a"><circle cx="76" cy="92.6" r="1"/><circle cx="82" cy="96.8" r="1"/><circle cx="88" cy="101" r="1"/></g><path d="M58 80 l4 2.8" stroke="#f0e0b0" stroke-width="4.6"/></g>
   <g class="req e-piccolo"><path d="M58 79 L96 93" stroke="#d8dce6" stroke-width="2.6" stroke-linecap="round"/>
    <g fill="#5a5a64"><circle cx="80" cy="87" r=".8"/><circle cx="85" cy="88.9" r=".8"/><circle cx="90" cy="90.7" r=".8"/></g></g>
   <g class="req e-pfeife"><path d="M58 80 L96 106" stroke="#c8ccd6" stroke-width="3.2" stroke-linecap="round"/><path d="M58 80 L63 83.4" stroke="#2a6a3a" stroke-width="3.8" stroke-linecap="round"/>
    <g fill="#3a3a44"><circle cx="78" cy="93.7" r=".9"/><circle cx="83" cy="97.1" r=".9"/><circle cx="88" cy="100.5" r=".9"/></g></g>
   <g class="req e-shakuhachi"><path d="M58 80 L100 112" stroke="#b8a060" stroke-width="5.6" stroke-linecap="round"/>
    <path d="M70 87 l-3 4 M84 98 l-3 4 M95 106 l-3 4" stroke="#7a6630" stroke-width="1.4"/></g>
   <g class="req e-englischhorn"><path d="M54 76 Q58 76 60 81" stroke="#c9a24a" stroke-width="1.4" fill="none"/><path d="M60 81 L97 107" stroke="#2a1a14" stroke-width="3.4" stroke-linecap="round"/>
    <ellipse cx="100" cy="110" rx="4.4" ry="5.6" transform="rotate(-35 100 110)" fill="#2a1a14"/>
    <g fill="#d8dce6"><circle cx="78" cy="93.7" r="1"/><circle cx="84" cy="97.9" r="1"/></g></g>
   <g class="req e-oohchor"><path d="M70 82 L82 86 L82 100 L70 96 Z" fill="#f4eedc" stroke="#6b4a2a" stroke-width="1"/><path d="M82 86 L95 84 L95 98 L82 100 Z" fill="#efe6d0" stroke="#6b4a2a" stroke-width="1"/>
    <path d="M73 87 l6 2 M73 90 l6 2 M85 89 l7 -1 M85 92 l7 -1" stroke="#8a7a60" stroke-width=".6"/><ellipse class="mund" cx="54" cy="80" rx="2.6" ry="3" fill="#5a4a4a"/></g>
   <g class="req e-bratsche"><path d="M64 84 L100 98" stroke="#3a2414" stroke-width="3" stroke-linecap="round"/><path d="M100 98 q5 1 5 -3" stroke="#3a2414" stroke-width="2.4" fill="none"/>
    <ellipse cx="64" cy="86" rx="11" ry="7.5" transform="rotate(22 64 86)" fill="#9a4a22" stroke="#4a1a0a"/><path d="M60 84 q2 2 0 4 M68 87 q2 2 0 4" stroke="#2a1a10" stroke-width="1.1" fill="none"/>
    <path d="M58 104 L86 72" stroke="#6b4423" stroke-width="1.8"/><path d="M60 104 L87 74" stroke="#f2ead8" stroke-width=".7"/></g>
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
  /* ---------- Bühnenbild: Kulissen-Hintergründe, Geister-Orchester, Publikum ----------
     Alles selbst gezeichnet (SVG). Die Hintergründe füllen die ganze Bühnenbreite, die Band steht davor. */
  const zufallFolge = (saat => () => { saat = (saat * 16807) % 2147483647; return (saat - 1) / 2147483646; })(424242);
  const r1 = (a, b) => a + zufallFolge() * (b - a);
  const sterne = n => Array.from({ length: n }, (_, i) => '<circle class="stern" cx="' + r1(0, 800).toFixed(0) + '" cy="' + r1(4, 120).toFixed(0) + '" r="' + r1(.5, 1.6).toFixed(1) +
    '" style="animation-delay:-' + r1(0, 4).toFixed(1) + 's;animation-duration:' + r1(2.5, 5).toFixed(1) + 's"/>').join("");
  /* Regen, der nahtlos fällt: jeder Strich steht doppelt (eine Bahn höher), die Gruppe rutscht genau eine Bahn weiter */
  const regenStriche = (n, laenge, klasse) => '<g class="' + klasse + '">' + Array.from({ length: n }, () => {
    const x = r1(-40, 840), y = r1(0, 250), d = "l" + (-laenge * .25).toFixed(1) + " " + laenge;
    return '<path d="M' + x.toFixed(0) + " " + y.toFixed(0) + " " + d + " M" + (x + 62.5).toFixed(1) + " " + (y - 250).toFixed(0) + " " + d + '"/>';
  }).join("") + "</g>";
  const tannen = (xs, basis, hoehe, farbe) => xs.map(([x, s]) => {
    const h = hoehe * s, b = h * .42;
    return '<path d="M' + x + " " + (basis - h) + " L" + (x - b * .45) + " " + (basis - h * .55) + " L" + (x - b * .25) + " " + (basis - h * .55) + " L" + (x - b * .75) + " " + (basis - h * .2) +
      " L" + (x - b * .35) + " " + (basis - h * .2) + " L" + (x - b) + " " + basis + " L" + (x + b) + " " + basis + " L" + (x + b * .35) + " " + (basis - h * .2) + " L" + (x + b * .75) + " " + (basis - h * .2) +
      " L" + (x + b * .25) + " " + (basis - h * .55) + " L" + (x + b * .45) + " " + (basis - h * .55) + ' Z" fill="' + farbe + '"/>';
  }).join("");
  const flaschen = (x0, y, n) => Array.from({ length: n }, (_, i) => {
    const x = x0 + i * 15 + r1(-2, 2), h = r1(16, 26), farbe = ["#2f5a34", "#5a3a1a", "#7a5a1e", "#3a2a5a", "#6a2420"][i % 5];
    return i % 4 === 3
      ? '<g><rect x="' + x + '" y="' + (y - 13) + '" width="11" height="13" rx="2" fill="#6b4a2a" stroke="#2a1a0e"/><path d="M' + (x + 11) + " " + (y - 10) + " q5 0 5 4 q0 4 -5 4" + '" fill="none" stroke="#2a1a0e" stroke-width="2"/></g>'
      : '<g><rect x="' + x + '" y="' + (y - h) + '" width="9" height="' + h + '" rx="3" fill="' + farbe + '" opacity=".9"/><rect x="' + (x + 3) + '" y="' + (y - h - 7) + '" width="3" height="8" fill="' + farbe + '"/>' +
        '<rect x="' + (x + 1.5) + '" y="' + (y - h + 3) + '" width="2" height="' + (h - 7) + '" fill="#fff" opacity=".12"/></g>';
  }).join("");
  const laterne = (x, y) => '<g class="laterne"><path d="M' + x + " 0 V" + (y - 14) + '" stroke="#3a2a1a" stroke-width="1.5" stroke-dasharray="3 2"/>' +
    '<circle class="licht" cx="' + x + '" cy="' + y + '" r="46" fill="url(#lwb-lampe)"/>' +
    '<path d="M' + (x - 9) + " " + (y - 12) + " h18 l-3 26 h-12 Z" + '" fill="#2a1d12" stroke="#7a5a32"/><rect class="flamme" x="' + (x - 4) + '" y="' + (y - 7) + '" width="8" height="14" rx="4" fill="#ffc35a"/>' +
    '<path d="M' + (x - 11) + " " + (y - 14) + " h22 l-4 -6 h-14 Z" + '" fill="#3a2a1a" stroke="#7a5a32"/></g>';
  const kristall = (x, y, s, farbe, d) => '<g class="kristall" style="animation-delay:-' + d + 's"><path d="M' + x + " " + y + " l" + (-6 * s) + " " + (-10 * s) + " l" + (4 * s) + " " + (-26 * s) + " l" + (6 * s) + " " + (20 * s) + " l" + (4 * s) + " " + (-12 * s) + " l" + (3 * s) + " " + (28 * s) +
    ' Z" fill="' + farbe + '" opacity=".75"/><circle cx="' + x + '" cy="' + (y - 12 * s) + '" r="' + Math.abs(30 * s) + '" fill="url(#lwb-lampe)" opacity=".5"/></g>';

  const KULISSEN_BILD = `
<svg class="lw-kulisse-bild" viewBox="0 0 800 250" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
 <defs>
  <radialGradient id="lwb-lampe"><stop offset="0" stop-color="#ffc35a" stop-opacity=".55"/><stop offset=".35" stop-color="#ff9a3a" stop-opacity=".18"/><stop offset="1" stop-color="#ff9a3a" stop-opacity="0"/></radialGradient>
  <radialGradient id="lwb-feuer" cx="50%" cy="100%" r="70%"><stop offset="0" stop-color="#ffb347" stop-opacity=".55"/><stop offset=".4" stop-color="#ff5a2e" stop-opacity=".2"/><stop offset="1" stop-color="#ff5a2e" stop-opacity="0"/></radialGradient>
  <radialGradient id="lwb-mond"><stop offset=".55" stop-color="#e8e4cf"/><stop offset=".62" stop-color="#e8e4cf" stop-opacity=".25"/><stop offset="1" stop-color="#e8e4cf" stop-opacity="0"/></radialGradient>
  <radialGradient id="lwb-spot" cx="50%" cy="0%" r="100%"><stop offset="0" stop-color="#ffe7b0" stop-opacity=".22"/><stop offset="1" stop-color="#ffe7b0" stop-opacity="0"/></radialGradient>
  <linearGradient id="lwb-vorhang" x1="0" x2="1"><stop offset="0" stop-color="#4a0f14"/><stop offset=".25" stop-color="#8a2228"/><stop offset=".5" stop-color="#5a1418"/><stop offset=".75" stop-color="#8a2228"/><stop offset="1" stop-color="#4a0f14"/></linearGradient>
  <linearGradient id="lwb-nacht" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#070a18"/><stop offset=".7" stop-color="#151a30"/><stop offset="1" stop-color="#2a1a22"/></linearGradient>
  <linearGradient id="lwb-wald" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#06100f"/><stop offset=".6" stop-color="#0f2420"/><stop offset="1" stop-color="#0a1612"/></linearGradient>
  <linearGradient id="lwb-meer-himmel" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#121a33"/><stop offset=".55" stop-color="#3a3350"/><stop offset="1" stop-color="#b8603a"/></linearGradient>
  <linearGradient id="lwb-meer" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1c3048"/><stop offset="1" stop-color="#0a1422"/></linearGradient>
  <linearGradient id="lwb-sturm" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0c0e14"/><stop offset="1" stop-color="#1c2028"/></linearGradient>
  <linearGradient id="lwb-holz" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a1a10"/><stop offset="1" stop-color="#1a100a"/></linearGradient>
 </defs>

 <!-- Bühne: roter Samtvorhang, Lichtkegel, Dielen -->
 <g class="bg bg-keine">
  <rect width="800" height="250" fill="#120a0e"/>
  <g class="spots"><path class="spot s1" d="M250 0 L150 250 H410 Z" fill="url(#lwb-spot)"/><path class="spot s2" d="M550 0 L390 250 H650 Z" fill="url(#lwb-spot)"/></g>
  <g fill="#1d1210" stroke="#2c1c14" stroke-width="1.2">${Array.from({ length: 9 }, (_, i) => '<path d="M' + (i * 100 - 40) + ' 250 L' + (400 + (i - 4) * 70) + ' 212"/>').join("")}</g>
  <rect y="212" width="800" height="38" fill="#24160f" opacity=".85"/><path d="M0 212 H800" stroke="#e0a046" stroke-opacity=".25"/>
  <path class="vorhang links" d="M0 0 H130 Q118 60 126 120 Q110 180 120 250 H0 Z" fill="url(#lwb-vorhang)"/>
  <path class="vorhang rechts" d="M800 0 H670 Q682 60 674 120 Q690 180 680 250 H800 Z" fill="url(#lwb-vorhang)"/>
  <path d="M0 0 H800 V26 Q760 40 720 26 Q680 40 640 26 Q600 40 560 26 Q520 40 480 26 Q440 40 400 26 Q360 40 320 26 Q280 40 240 26 Q200 40 160 26 Q120 40 80 26 Q40 40 0 26 Z" fill="#7a1c22"/>
  <path d="M0 26 Q40 40 80 26 Q120 40 160 26 Q200 40 240 26 Q280 40 320 26 Q360 40 400 26 Q440 40 480 26 Q520 40 560 26 Q600 40 640 26 Q680 40 720 26 Q760 40 800 26" fill="none" stroke="#e0a046" stroke-width="2.5" stroke-dasharray="1 3" opacity=".8"/>
 </g>

 <!-- Taverne: Holzwand, Regale voller Flaschen, Laternen, Fässer -->
 <g class="bg bg-taverne">
  <rect width="800" height="250" fill="url(#lwb-holz)"/>
  <g stroke="#120a06" stroke-width="2" opacity=".7">${Array.from({ length: 20 }, (_, i) => '<path d="M' + (i * 42 + 8) + ' 0 V250"/>').join("")}</g>
  <g fill="#fff" opacity=".025">${Array.from({ length: 20 }, (_, i) => '<rect x="' + (i * 42 + 12) + '" y="0" width="6" height="250"/>').join("")}</g>
  <rect y="52" width="800" height="14" fill="#3a2414"/><rect y="64" width="800" height="3" fill="#120a06" opacity=".7"/>
  <rect x="140" y="66" width="12" height="184" fill="#2e1c10"/><rect x="648" y="66" width="12" height="184" fill="#2e1c10"/>
  <rect x="20" y="118" width="210" height="7" fill="#4a2e18"/><g>${flaschen(30, 118, 13)}</g>
  <rect x="580" y="118" width="200" height="7" fill="#4a2e18"/><g>${flaschen(590, 118, 12)}</g>
  <g transform="translate(400 30)" opacity=".7"><path d="M-22 -14 H22 V8 Q22 26 0 34 Q-22 26 -22 8 Z" fill="#5a1c1c" stroke="#c9a24a" stroke-width="2"/><path d="M-10 -2 L0 14 L10 -2 M0 -6 V22" stroke="#c9a24a" stroke-width="2" fill="none"/></g>
  ${laterne(95, 92)}${laterne(705, 92)}
  <g fill="#3a2414" stroke="#1a0e08" stroke-width="2"><ellipse cx="40" cy="226" rx="38" ry="30"/><ellipse cx="760" cy="226" rx="38" ry="30"/></g>
  <g stroke="#7a5a32" stroke-width="2.5" fill="none" opacity=".8"><path d="M6 212 Q40 220 74 212 M6 240 Q40 248 74 240 M726 212 Q760 220 794 212 M726 240 Q760 248 794 240"/></g>
 </g>

 <!-- Lagerfeuer bei Nacht: Sterne, Mond, Hügel, Tannen, Funkenflug -->
 <g class="bg bg-feuer">
  <rect width="800" height="250" fill="url(#lwb-nacht)"/>
  <g fill="#fff">${sterne(55)}</g>
  <circle cx="690" cy="44" r="30" fill="url(#lwb-mond)"/><circle cx="702" cy="38" r="17" fill="#0b0f20"/>
  <path d="M0 190 Q120 150 230 176 Q330 140 450 170 Q560 138 680 168 Q750 158 800 172 V250 H0 Z" fill="#0d1018"/>
  ${tannen([[20, 1.1], [62, .8], [98, 1], [710, .9], [748, 1.15], [790, .8]], 236, 150, "#06080e")}
  <ellipse class="feuerschein" cx="400" cy="250" rx="380" ry="150" fill="url(#lwb-feuer)"/>
  <g class="funken" fill="#ffb347">${Array.from({ length: 14 }, (_, i) => '<circle cx="' + r1(250, 550).toFixed(0) + '" cy="248" r="' + r1(.8, 1.8).toFixed(1) + '" style="animation-delay:-' + r1(0, 4).toFixed(1) + 's;animation-duration:' + r1(2.8, 4.5).toFixed(1) + 's"/>').join("")}</g>
 </g>

 <!-- Regen: Steinmauer mit Bogenfenstern, draußen schüttet es -->
 <g class="bg bg-regen">
  <rect width="800" height="250" fill="#14161c"/>
  <g fill="#1d2028" stroke="#0c0d12" stroke-width="2">${Array.from({ length: 8 }, (_, r) => Array.from({ length: 11 }, (_, c) => '<rect x="' + (c * 80 - (r % 2) * 40) + '" y="' + r * 32 + '" width="78" height="30" rx="3"/>').join("")).join("")}</g>
  <g>${[110, 690].map(x => '<g><path d="M' + (x - 55) + ' 200 V90 Q' + x + ' 30 ' + (x + 55) + ' 90 V200 Z" fill="#0e1c30"/>' +
    '<path d="M' + (x - 55) + ' 200 V90 Q' + x + ' 30 ' + (x + 55) + ' 90 V200" fill="none" stroke="#3a3428" stroke-width="7"/><path d="M' + x + ' 44 V200 M' + (x - 55) + ' 128 H' + (x + 55) + '" stroke="#2a2418" stroke-width="4"/>' +
    '<rect x="' + (x - 62) + '" y="198" width="124" height="9" fill="#3a3428"/></g>').join("")}</g>
  <clipPath id="lwb-fenster"><path d="M55 200 V90 Q110 30 165 90 V200 Z M635 200 V90 Q690 30 745 90 V200 Z"/></clipPath>
  <g clip-path="url(#lwb-fenster)" stroke="#9ab4d8" stroke-width="1.2" opacity=".55">${regenStriche(70, 26, "regen-fall")}</g>
  <g class="kerze"><rect x="96" y="182" width="7" height="16" fill="#e8dcc0"/><ellipse class="flamme" cx="99.5" cy="178" rx="3" ry="6" fill="#ffc35a"/><circle class="licht" cx="99.5" cy="178" r="34" fill="url(#lwb-lampe)"/></g>
  <g stroke="#9ab4d8" stroke-width=".9" opacity=".14">${regenStriche(60, 20, "regen-fall langsam")}</g>
  <circle class="tropfen" cx="400" cy="0" r="2" fill="#9ab4d8" opacity=".6"/>
 </g>

 <!-- Wald bei Nacht: Mond, drei Reihen Bäume, Nebel, Glühwürmchen -->
 <g class="bg bg-wald">
  <rect width="800" height="250" fill="url(#lwb-wald)"/>
  <circle cx="560" cy="52" r="40" fill="url(#lwb-mond)" opacity=".85"/>
  ${tannen([[30, .9], [90, 1.1], [150, .8], [230, 1], [300, .7], [380, .95], [460, .75], [530, 1.05], [610, .85], [680, 1], [750, .9]], 210, 170, "#143028")}
  <ellipse class="nebel" cx="400" cy="200" rx="460" ry="28" fill="#cfe3dc" opacity=".08"/>
  ${tannen([[0, 1.2], [70, 1], [130, 1.3], [680, 1.25], [740, 1], [800, 1.3]], 252, 190, "#0a1a14")}
  <g class="gluehwuermchen" fill="#d8ff8a">${Array.from({ length: 16 }, () => '<circle cx="' + r1(20, 780).toFixed(0) + '" cy="' + r1(80, 230).toFixed(0) + '" r="1.6" style="animation-delay:-' + r1(0, 6).toFixed(1) + 's;animation-duration:' + r1(4, 8).toFixed(1) + 's"/>').join("")}</g>
 </g>

 <!-- Höhle: Tropfsteine, leuchtende Kristalle, fallende Tropfen -->
 <g class="bg bg-hoehle">
  <rect width="800" height="250" fill="#08070c"/>
  <path d="M0 0 H800 V30 L770 26 L752 70 L736 28 L700 34 L688 60 L670 30 L630 36 L612 92 L596 34 L560 30 L540 52 L520 28 L470 34 L458 64 L444 30 L400 26 L380 48 L360 28 L320 34 L300 80 L284 30 L240 36 L226 58 L210 30 L170 26 L150 74 L134 28 L96 34 L84 56 L70 30 L30 36 L18 66 L0 40 Z" fill="#15121c"/>
  <path d="M0 250 V150 Q30 140 50 170 L70 120 L88 176 Q110 168 130 200 L150 160 L170 250 Z M800 250 V140 Q770 150 752 176 L732 116 L712 180 Q690 170 672 204 L652 164 L632 250 Z" fill="#110e17"/>
  ${kristall(60, 180, 1.1, "#6ae0ff", 0)}${kristall(100, 205, .8, "#b47aff", 1.2)}${kristall(720, 176, 1.2, "#b47aff", .6)}${kristall(760, 210, .8, "#6ae0ff", 2)}${kristall(400, 30, -.7, "#6ae0ff", 1.5)}
  <g class="tropfsteine" fill="#9ab4d8">${[150, 300, 612, 752].map((x, i) => '<circle class="tropfen" cx="' + x + '" cy="80" r="1.8" style="animation-delay:-' + (i * 1.3) + 's"/>').join("")}</g>
 </g>

 <!-- Meer: Abendhimmel, Wellen, Schiffsreling, Takelage, Möwen -->
 <g class="bg bg-meer">
  <rect width="800" height="170" fill="url(#lwb-meer-himmel)"/>
  <circle cx="420" cy="168" r="34" fill="#ffb066" opacity=".55"/>
  <rect y="160" width="800" height="90" fill="url(#lwb-meer)"/>
  <path d="M380 166 h80 M372 176 h96 M388 188 h64" stroke="#ffb066" stroke-width="2" opacity=".45"/>
  <g class="wellen" fill="none" stroke="#5a7aa0" stroke-width="2" opacity=".5">
   <path class="w1" d="M-80 180 Q-60 172 -40 180 T0 180 T40 180 T80 180 T120 180 T160 180 T200 180 T240 180 T280 180 T320 180 T360 180 T400 180 T440 180 T480 180 T520 180 T560 180 T600 180 T640 180 T680 180 T720 180 T760 180 T800 180 T840 180 T880 180"/>
   <path class="w2" d="M-80 200 Q-55 190 -30 200 T20 200 T70 200 T120 200 T170 200 T220 200 T270 200 T320 200 T370 200 T420 200 T470 200 T520 200 T570 200 T620 200 T670 200 T720 200 T770 200 T820 200 T870 200"/></g>
  <g class="moewen" fill="none" stroke="#1a1a24" stroke-width="2"><path class="m1" d="M120 60 q8 -8 16 0 q8 -8 16 0"/><path class="m2" d="M600 40 q6 -6 12 0 q6 -6 12 0"/></g>
  <path d="M60 0 L40 250 M60 0 L300 120 M60 30 L160 250" stroke="#3a2a1a" stroke-width="2.5"/><rect x="52" y="0" width="16" height="250" fill="#2a1a10"/>
  <rect y="214" width="800" height="9" fill="#4a2e18"/><rect y="240" width="800" height="10" fill="#3a2414"/>
  <g fill="#3a2414">${Array.from({ length: 17 }, (_, i) => '<rect x="' + (i * 50) + '" y="214" width="9" height="36"/>').join("")}</g>
 </g>

 <!-- Sturm: jagende Wolken, Platzregen, Blitze, sich biegende Bäume -->
 <g class="bg bg-sturm">
  <rect width="800" height="250" fill="url(#lwb-sturm)"/>
  <rect class="blitzlicht" width="800" height="250" fill="#dfe8ff" opacity="0"/>
  <path class="blitz" d="M520 0 L498 60 L516 62 L486 130 L506 132 L470 210" fill="none" stroke="#eef4ff" stroke-width="3" opacity="0"/>
  <g class="wolken" fill="#232733">${Array.from({ length: 12 }, (_, i) => '<ellipse cx="' + (i * 80 - 40) + '" cy="' + (20 + (i % 3) * 14) + '" rx="' + r1(70, 110).toFixed(0) + '" ry="' + r1(26, 40).toFixed(0) + '"/>').join("")}</g>
  <g class="wolken w2" fill="#1a1d26">${Array.from({ length: 10 }, (_, i) => '<ellipse cx="' + (i * 95) + '" cy="' + (50 + (i % 2) * 12) + '" rx="' + r1(60, 100).toFixed(0) + '" ry="' + r1(20, 30).toFixed(0) + '"/>').join("")}</g>
  <g class="baeume-wind">${tannen([[30, 1.1], [90, .8], [720, 1], [775, 1.2]], 250, 160, "#0a0c10")}</g>
  <g stroke="#a8b8d0" stroke-width="1.2" opacity=".35">${regenStriche(110, 34, "regen-fall schnell")}</g>
 </g>
</svg>`;

  /* Geister-Orchester: schemenhafte Musiker auf einer Empore hinter der Band – sie werden sichtbar, sobald das Orchester spielt */
  const geist = (x, y, s, inhalt, kl) => '<g class="geist ' + kl + '" transform="translate(' + x + " " + y + ") scale(" + s + ')"><g class="g-k"><circle cx="0" cy="-34" r="8"/><path d="M-12 -24 Q0 -30 12 -24 L16 18 H-16 Z"/>' + inhalt + "</g></g>";
  const GEISTER = `
<svg class="lw-geister" viewBox="0 0 660 210" aria-hidden="true">
 <defs><radialGradient id="lwb-geistlicht"><stop offset="0" stop-color="#bfe0ff" stop-opacity=".35"/><stop offset="1" stop-color="#bfe0ff" stop-opacity="0"/></radialGradient></defs>
 <g class="g-alle">
  <ellipse class="g-schein" cx="330" cy="44" rx="300" ry="46" fill="url(#lwb-geistlicht)"/>
  <g class="g-streicher">
   ${[[168, 52, .62], [204, 48, .6], [240, 52, .62], [276, 48, .6]].map(([x, y, s]) => geist(x, y, s, '<ellipse cx="9" cy="-24" rx="9" ry="4" transform="rotate(-25 9 -24)"/><path class="g-bogen" d="M-6 -36 L26 -14" stroke-width="2"/>', "geige")).join("")}
   ${[[488, 74, .78], [528, 70, .74]].map(([x, y, s]) => geist(x, y, s, '<ellipse cx="0" cy="4" rx="9" ry="16"/><path d="M0 -14 V30" stroke-width="1.5"/><path class="g-bogen quer" d="M-16 2 H16" stroke-width="2.2"/>', "cello")).join("")}
  </g>
  <g class="g-blech">
   ${[[318, 46, .6], [352, 50, .62], [386, 46, .6]].map(([x, y, s]) => geist(x, y, s, '<path d="M8 -26 L30 -30" stroke-width="3"/><path d="M30 -36 L38 -30 L30 -24 Z"/>', "horn")).join("")}
  </g>
  <g class="g-neu g-orgel"><path class="g-pfeifen" d="M28 70 V22 M38 70 V14 M48 70 V8 M58 70 V4 M68 70 V8 M78 70 V14 M88 70 V22" stroke-width="5" stroke-linecap="round"/>${geist(58, 76, .66, '<path d="M-22 4 H22" stroke-width="4"/><path d="M-14 -14 L-10 2 M14 -14 L10 2" stroke-width="2"/>', "organist")}</g>
  <g class="g-neu g-amboss">${geist(64, 62, .7, '<path d="M-26 22 H-4 L-8 30 H-22 Z"/><path class="schlegel" d="M12 -22 L-8 12" stroke-width="2.4"/><rect x="-14" y="8" width="10" height="6" rx="1"/>', "schmied")}</g>
  <g class="g-neu g-holz">${[[428, 50, .6], [458, 54, .6]].map(([x, y, s]) => geist(x, y, s, '<path d="M4 -30 L24 -2" stroke-width="2.6"/><path d="M22 -4 L27 2 L20 3 Z"/>', "holzblaeser")).join("")}</g>
  <g class="g-neu g-chor">${[[578, 50, .6], [604, 44, .6], [630, 50, .6]].map(([x, y, s]) => geist(x, y, s, '<ellipse class="g-mund" cx="0" cy="-30" rx="2.2" ry="2.8"/><path d="M-10 -14 L0 -11 L10 -14 L10 -3 L0 0 L-10 -3 Z"/>', "saenger")).join("")}</g>
  <g class="g-neu g-glanz">${geist(404, 26, .5, '<path d="M14 -24 l7 12 h-14 Z"/><path d="M-14 -24 l7 12 h-14 Z"/><circle cx="14" cy="-10" r="2"/><circle cx="-14" cy="-10" r="2"/>', "glocke")}</g>
  <g class="g-pauke">${geist(118, 54, .66, '<ellipse class="kessel" cx="0" cy="26" rx="20" ry="7"/><path d="M-20 26 Q0 50 20 26"/><path class="schlegel" d="M-12 -10 L-4 20 M12 -10 L4 20" stroke-width="2"/>', "pauker")}</g>
 </g>
</svg>`;

  /* Publikum in der ersten Reihe: Köpfe und Schultern als Scherenschnitt, manche mit Krug – jeder Gast ein eigenes kleines Bild */
  const KOEPFE = {
    hut: '<path d="M-13 -50 L1 -86 L12 -50 Z"/><path d="M-22 -50 H22" stroke-width="4"/>',
    helm: '<path d="M-14 -46 Q0 -66 14 -46 Z"/><path d="M-12 -52 Q-24 -60 -22 -72 M12 -52 Q24 -60 22 -72" fill="none" stroke-width="3.5"/>',
    elf: '<path d="M-12 -44 L-25 -56 L-11 -38 M12 -44 L25 -56 L11 -38"/><path d="M-12 -46 Q0 -60 12 -46" />',
    kapuze: '<path d="M-17 -34 Q-19 -64 0 -62 Q19 -64 17 -34 Q8 -50 0 -50 Q-8 -50 -17 -34 Z"/>',
    zopf: '<path d="M10 -44 Q22 -34 18 -18" fill="none" stroke-width="5"/>',
    bart: '<path d="M-11 -38 Q0 -14 11 -38 Z"/>',
    keiner: ""
  };
  const gast = (kopf, krug, s, i) => '<svg class="gast' + (krug ? " hat-krug" : "") + '" viewBox="-34 -92 68 94" style="--i:' + i + ";--s:" + s + '"><path d="M-27 2 Q-26 -28 0 -31 Q26 -28 27 2 Z"/><circle cx="0" cy="-43" r="13"/>' + kopf +
    (krug ? '<g class="krug"><path class="arm" d="M17 -22 Q22 -36 24 -44" fill="none" stroke-width="7" stroke-linecap="round"/><rect x="18" y="-60" width="12" height="15" rx="2"/><path d="M30 -56 q6 0 6 5 q0 5 -6 5" fill="none" stroke-width="2.5"/></g>' : "") + "</svg>";
  const PUBLIKUM = '<div class="lw-publikum" aria-hidden="true">' +
    [["hut", 0, 1], ["keiner", 1, .92], ["helm", 1, 1.05], ["zopf", 0, .9], ["kapuze", 0, 1], ["bart", 1, .97], ["elf", 0, 1.04], ["keiner", 1, .9], ["helm", 0, 1], ["zopf", 1, .95], ["kapuze", 1, 1.02], ["hut", 0, .93]]
      .map(([k, krug, s], i) => gast(KOEPFE[k], krug, s, i)).join("") + "</div>";
  const BUEHNE_HINTEN = KULISSEN_BILD + GEISTER;
  const BUEHNE_VORNE = PUBLIKUM + '<div class="lw-fx-licht"></div>';

  /* Die Figuren bekommen je eine Hülle, damit sie als Ganzes springen, sinken oder wackeln können */
  const BUEHNE_FIG = BUEHNE.replace(/\n <svg (x="\d+" y="\d+"[^>]*class="(\w+)")/g, '\n <g class="fg fg-$2"><svg $1').replace(/\n <\/svg>/g, "\n </svg></g>");
  /* wie das Publikum auf die Musik reagiert */
  const PUB_STIMMUNG = { trinklied: "tanz", heldenlied: "nicken", verfolgung: "duck", ruinen: "wiegen", dorffest: "tanz", marktplatz: "tanz", sieg: "tanz", shanty: "tanz", auenland: "tanz", fey: "tanz", reiter: "tanz",
    kampf: "duck", boss: "duck", spannung: "duck", grusel: "duck", unterreich: "duck",
    elben: "wiegen", klage: "wiegen", kamin: "wiegen", pilger: "wiegen", rast: "wiegen", hof: "wiegen", reise: "nicken", zwerge: "nicken" };
  const PUB_STUECK = { trauermarsch: "wiegen", wiegenlied: "wiegen", elise: "wiegen", morgen: "wiegen", kanon: "wiegen", amazinggrace: "wiegen", scarborough: "wiegen",
    greensleeves: "wiegen", sakura: "wiegen", auldlangsyne: "wiegen", diesirae: "duck", toccata: "duck", walkuere: "duck", zarathustra: "still", bergkoenig: "nicken", freude: "nicken", shchedryk: "nicken" };
  function publikumArt() {
    if (klassikLauf) return PUB_STUECK[klassikLauf.art] || "tanz";
    if (!laeuft) return "still";
    return S.stimmung ? PUB_STIMMUNG[S.stimmung] || "nicken" : "nicken";
  }
  const buehneAttr = () => ' data-mel="' + S.instrument + '" data-tr="' + S.band.trommel + '" data-fl="' + S.band.floete + '" data-ez="' + S.band.ketten +
    '" data-kul="' + esc(KUL_BILD[S.kulisse] || S.kulisse) + '" data-pub="' + publikumArt() + '"';
  const buehneHTML = klein => '<div class="lw-buehne' + (klein ? " lw-buehne-klein" : "") + (leicht() ? " spar" : "") + '"' + buehneAttr() + '><div class="lw-szene">' +
    BUEHNE_HINTEN + BUEHNE_FIG + GAESTE_HTML + BUEHNE_VORNE + "</div></div>";

  /* ---------- Bühne lebt: Pegel, Geister-Orchester, Publikum, Effekte ---------- */
  let pegelMesser = null, pegelDaten = null, pegelGlatt = 0, orchGlatt = 0, blechGlatt = 0, strBis = 0, blechBis = 0, strZiel = 0, fxBis = 0, malt = false, bildZaehler = 0;
  const geistQ = [], klassikQ = [], letzterZuck = {};
  let letzterSchlag = 0, buehneMerk = "";
  const GEIST_ART = g => /^(vln|vc|spic|kb|vlntrem|vctrem|geigest|bra|bogen)/.test(g) ? "str" : /^(horn|trp|pos|tuba)/.test(g) ? "blech" : /^(timp|bd|crash|gong|swell)/.test(g) ? "pauke"
    : /^(fl|klar|fag|oboe)/.test(g) ? "holz" : /^(stimme|ooh)/.test(g) ? "chor" : g === "orgel" ? "orgel" : g === "amboss" ? "amboss" : g === "gloeckchen" ? "glanz" : "";
  /* weitere Geister auf der Empore: Holzbläser, Chor, Organist, Schmied und Glöckner – jeder nur, solange er spielt */
  const GEIST_NEU = ["holz", "chor", "orgel", "amboss", "glanz"], geistBis = {};
  const BAND_SPUR = g => /^(timp|bd|snare|bodh|tamb|crash|gong|swell)/.test(g) ? "trommel" : /^(schelle|shake|clave|holz|gloeckchen|amboss)/.test(g) ? "ketten"
    : /^(fl|pan|oka|dudel|oboe|klar|fag)/.test(g) ? "floete" : /^(kb|tuba|vc|pos)/.test(g) ? "bass" : g === "gitarre" ? "klopf" : "melodie";
  function geistMerken(gr, zeit) { const a = GEIST_ART(gr); if (a && geistQ.length < 200) geistQ.push([zeit, a]); }
  /* Orchester-Töne gehen über diese Hülle, damit die Geister wissen, wann sie spielen */
  function oprobe(gr, m, zeit, ...rest) { geistMerken(gr, zeit); return probe(gr, m, zeit, ...rest); }
  function malenStarten() { if (!malt) { malt = true; requestAnimationFrame(malen); } }
  /* eine Spur der Band sichtbar machen (aus der Musik oder aus einem Klassiker) */
  function spurZeigen(k, wert) {
    const jetzt = performance.now();
    if (letzterZuck[k] && jetzt - letzterZuck[k] < 95) return;
    letzterZuck[k] = jetzt;
    if (k === "klopf") zucken("klopf");
    else if (k === "schelle") zucken("schelle");
    else if (k === "bass") { zucken("bass"); if (Math.random() < .4) schweben("♩", bandOrt(ORT.bass), "tief"); }
    else if (k === "melodie") { zucken("mel"); schweben(Math.random() < .5 ? "♪" : "♫", bandOrt(ORT.laute)); }
    else if (k === "trommel") { zucken("trommel"); publikumSchlag(); }
    else if (k === "floete") { zucken("floete"); if (Math.random() < .7) schweben("♪", bandOrt(ORT.floete), "floete", 62); }
    else if (k === "ketten") zucken("ketten");
    else if (k === "rex") { zucken(wert === 1 ? "heul" : "wuff"); schweben(t().rexLaut[wert], bandOrt(ORT.rex), "blase", 36); }
  }
  /* Publikum im Takt: tanzen hüpft, nicken nickt – wiegen und ducken laufen ruhig über CSS */
  function publikumSchlag() {
    const b = buehne(); if (!b || ruhig) return;
    const jetzt = performance.now(); if (jetzt - letzterSchlag < 280) return;
    letzterSchlag = jetzt;
    const art = b.dataset.pub; if (art !== "tanz" && art !== "nicken") return;
    let n = 0;
    b.querySelectorAll(".lw-publikum .gast").forEach((g, i) => {
      if (!g.animate || (b.classList.contains("spar") && i % 2)) return;
      if (art === "tanz") {
        const hoch = 3 + Math.random() * 5, seite = (n++ % 2 ? 1 : -1) * (2 + Math.random() * 3);
        g.animate([{ transform: "none" }, { transform: "translateY(-" + hoch + "px) rotate(" + seite + "deg)", offset: .35 }, { transform: "none" }], { duration: 300, delay: Math.random() * 40, easing: "ease-out" });
      } else g.animate([{ transform: "none" }, { transform: "rotate(" + (i % 2 ? 3 : -3) + "deg) translateY(1.5px)", offset: .4 }, { transform: "none" }], { duration: 340, delay: i * 12, easing: "ease-out" });
    });
  }
  /* Werte auf die Bühne schreiben: Lichtpegel, Orchester, Stimmung des Publikums */
  function buehneTick(b) {
    const jetzt = ctx ? ctx.currentTime : 0;
    if (pegelMesser && (++bildZaehler & 1)) {
      pegelMesser.getByteTimeDomainData(pegelDaten);
      let s = 0; for (let i = 0; i < pegelDaten.length; i += 2) { const x = pegelDaten[i] - 128; s += x * x; }
      const rms = Math.min(1, Math.sqrt(s / (pegelDaten.length / 2)) / 38);
      pegelGlatt += (rms - pegelGlatt) * (rms > pegelGlatt ? .5 : .12);
    }
    while (geistQ.length && geistQ[0][0] <= jetzt) {
      const [, a] = geistQ.shift();
      if (a === "str") { strBis = jetzt + 2.2; strZiel = Math.min(1, strZiel + .25); }
      else if (a === "blech") { blechBis = jetzt + 2.4; strBis = Math.max(strBis, jetzt + 1.2); }
      else if (a === "pauke") { paukeSchlag(b); strBis = Math.max(strBis, jetzt + 1); }
      else { geistBis[a] = jetzt + (a === "amboss" || a === "glanz" ? 2.2 : 4.5); if (a === "amboss") geistHammer(b); }
    }
    GEIST_NEU.forEach(a => b.classList.toggle("g-" + a, !!(laeuft || klassikLauf) && jetzt < (geistBis[a] || 0)));
    if (jetzt > strBis) strZiel = 0; else strZiel = Math.max(strZiel, .55);
    orchGlatt += (strZiel - orchGlatt) * .04;
    blechGlatt += ((jetzt < blechBis ? 1 : 0) - blechGlatt) * .05;
    const merk = pegelGlatt.toFixed(2) + "|" + orchGlatt.toFixed(2) + "|" + blechGlatt.toFixed(2);
    if (merk !== buehneMerk) {
      buehneMerk = merk;
      b.style.setProperty("--pegel", pegelGlatt.toFixed(2));
      b.style.setProperty("--orch", orchGlatt.toFixed(2));
      b.style.setProperty("--blech", blechGlatt.toFixed(2));
      b.classList.toggle("orch-an", orchGlatt > .15);
    }
    const pub = publikumArt();
    if (b.dataset.pub !== pub) b.dataset.pub = pub;
    if (b.dataset.kul !== S.kulisse) b.dataset.kul = S.kulisse;
    if (b.dataset.mel !== S.instrument || b.dataset.fl !== S.band.floete) { b.dataset.mel = S.instrument; b.dataset.fl = S.band.floete; b.dataset.tr = S.band.trommel; b.dataset.ez = S.band.ketten; figurCache = {}; armeSetzen(); }
    b.classList.toggle("spielt", !!(laeuft || klassikLauf));
  }
  function geistHammer(b) {
    if (ruhig) return;
    const s = b.querySelector(".lw-geister .g-amboss .schlegel"); if (s && s.animate) s.animate([{ transform: "none" }, { transform: "rotate(-24deg)", offset: .3 }, { transform: "none" }], { duration: 300 });
  }
  function paukeSchlag(b) {
    if (ruhig) return;
    const p = b.querySelector(".lw-geister .g-pauke"); if (p && p.animate) p.animate([{ opacity: 1, filter: "drop-shadow(0 0 6px #cfe6ff)" }, { opacity: "" , filter: "none" }], { duration: 500, easing: "ease-out" });
    const s = b.querySelector(".lw-geister .schlegel"); if (s && s.animate) s.animate([{ transform: "none" }, { transform: "translateY(4px)", offset: .3 }, { transform: "none" }], { duration: 260 });
  }
  function malen() {
    const b = buehne();
    const aktiv = ctx && b && !document.hidden && (laeuft || klassikLauf || performance.now() < fxBis || orchGlatt > .02 || pegelGlatt > .02 || anzeige.length || geistQ.length || gastQ.length || kapQ.length || root.querySelector('.lw-gast.da'));
    if (!aktiv) { malt = false; if (b) b.classList.remove("spielt"); return; }
    const jetzt = ctx.currentTime;
    while (anzeige.length && anzeige[0].zeit <= jetzt) {
      const ev = anzeige.shift(), sp = ev.spuren;
      teilAnzeige(ev.teil);
      spalte(ev.teil === bearbeite ? ev.schritt : -1);
      haelfteAnzeige(ev.teil === bearbeite ? ev.schritt : -1);
      if (ev.schritt % 4 === 0) publikumSchlag();
      ["klopf", "schelle", "bass", "melodie", "trommel", "floete", "ketten", "rex"].forEach(k => { if (k in sp) spurZeigen(k, sp[k]); });
    }
    while (klassikQ.length && klassikQ[0][0] <= jetzt) spurZeigen(klassikQ.shift()[1]);
    buehneTick(b);
    try { gaesteZeigen(b); } catch (_) {}
    try { wechselAnzeige(); } catch (_) {}
    requestAnimationFrame(malen);
  }

  /* ---------- Effekte auf der Bühne ---------- */
  function fxEbene(b) {
    let e = b.querySelector(".lw-fx");
    if (!e) { e = document.createElement("div"); e.className = "lw-fx"; b.appendChild(e); }
    return e;
  }
  const wenig = () => leicht() ? .5 : 1;
  function fxTeil(b, html, klasse, stil) {
    const e = document.createElement("span"); e.className = "lw-t " + (klasse || ""); e.innerHTML = html;
    Object.assign(e.style, stil || {}); fxEbene(b).appendChild(e); return e;
  }
  function weg(e, anim) { if (anim) anim.onfinish = () => e.remove(); else setTimeout(() => e.remove(), 2000); }
  /* Partikel fliegen lassen: Startpunkt in Prozent, Bewegung in Pixel */
  function flieg(b, html, klasse, x, y, keyframes, dauer, verz) {
    const e = fxTeil(b, html, klasse, { left: x + "%", top: y + "%" });
    if (!e.animate) { e.remove(); return; }
    weg(e, e.animate(keyframes, { duration: dauer, delay: verz || 0, easing: "cubic-bezier(.2,.6,.4,1)", fill: "both" }));
  }
  function wackeln(b, px, dauer) {
    const s = b.querySelector(".lw-szene"); if (!s || !s.animate) return;
    const k = []; for (let i = 0; i <= 10; i++) { const f = px * (1 - i / 10); k.push({ transform: "translate(" + ((Math.random() * 2 - 1) * f).toFixed(1) + "px," + ((Math.random() * 2 - 1) * f).toFixed(1) + "px)" }); }
    k[10] = { transform: "none" };
    s.animate(k, { duration: dauer });
  }
  function licht(b, hintergrund, dauer, staerke, mischen) {
    const l = b.querySelector(".lw-fx-licht"); if (!l || !l.animate) return;
    l.style.background = hintergrund; l.style.mixBlendMode = mischen || "normal";
    l.animate([{ opacity: 0 }, { opacity: staerke, offset: .08 }, { opacity: 0 }], { duration: dauer, easing: "ease-out" });
  }
  function szeneFilter(b, filter, dauer) { const s = b.querySelector(".lw-szene"); if (s && s.animate) s.animate([{ filter: "none" }, { filter, offset: .15 }, { filter, offset: .7 }, { filter: "none" }], { duration: dauer }); }
  const FIGUREN = ["friedrich", "barradin", "echo", "rex", "ezekiel"];
  function fig(b, name, keyframes, dauer, verz, easing) {
    const e = b.querySelector(".fg-" + name); if (!e || !e.animate) return;
    e.animate(keyframes, { duration: dauer, delay: verz || 0, easing: easing || "ease-out" });
  }
  function alleSpringen(b, hoehe, dauer) {
    FIGUREN.forEach((f, i) => fig(b, f, [{ transform: "none" }, { transform: "translateY(-" + hoehe * (f === "rex" ? 1.3 : 1) + "px)", offset: .35 }, { transform: "translateY(2px) scaleY(.97)", offset: .8 }, { transform: "none" }], dauer || 520, i * 45, "cubic-bezier(.3,.7,.4,1)"));
  }
  function alleSinken(b, dauer) { FIGUREN.forEach((f, i) => fig(b, f, [{ transform: "none" }, { transform: "translateY(6px) rotate(" + (i % 2 ? 2 : -2) + "deg)", offset: .3 }, { transform: "translateY(6px) rotate(" + (i % 2 ? 2 : -2) + "deg)", offset: .75 }, { transform: "none" }], dauer, i * 80, "ease-in-out")); }
  function alleZittern(b, dauer) { FIGUREN.forEach((f, i) => { const k = []; for (let j = 0; j < 9; j++) k.push({ transform: "translateX(" + (j % 2 ? 1.5 : -1.5) + "px)" }); k.push({ transform: "none" }); fig(b, f, k, dauer, i * 30, "linear"); }); }
  function publikum(b, art) {
    b.querySelectorAll(".lw-publikum .gast").forEach((g, i) => {
      if (!g.animate) return;
      if (art === "jubel") g.animate([{ transform: "none" }, { transform: "translateY(-" + (5 + Math.random() * 6) + "px)", offset: .3 }, { transform: "translateY(-2px)", offset: .6 }, { transform: "translateY(-" + (3 + Math.random() * 4) + "px)", offset: .8 }, { transform: "none" }], { duration: 1100, delay: i * 30 });
      else if (art === "ooh") g.animate([{ transform: "none" }, { transform: "translateY(-3px) rotate(" + (i % 2 ? -4 : 4) + "deg)", offset: .25 }, { transform: "translateY(-3px) rotate(" + (i % 2 ? -4 : 4) + "deg)", offset: .75 }, { transform: "none" }], { duration: 1500, delay: i * 20 });
      else if (art === "schock") g.animate([{ transform: "none" }, { transform: "translateY(-9px)", offset: .15 }, { transform: "translateY(-6px)", offset: .5 }, { transform: "none" }], { duration: 800, delay: Math.random() * 60 });
      else if (art === "duck") g.animate([{ transform: "none" }, { transform: "translateY(55%)", offset: .2 }, { transform: "translateY(55%)", offset: .7 }, { transform: "none" }], { duration: 1600, delay: i * 15 });
      else if (art === "still") g.animate([{ opacity: 1 }, { opacity: .55, offset: .2 }, { opacity: .55, offset: .8 }, { opacity: 1 }], { duration: 2600 });
    });
    if (art === "jubel") b.querySelectorAll(".lw-publikum .krug").forEach((k, i) => k.animate && k.animate([{ transform: "none" }, { transform: "translate(2px,-10px) rotate(-12deg)", offset: .3 }, { transform: "translate(2px,-8px) rotate(8deg)", offset: .6 }, { transform: "none" }], { duration: 1200, delay: i * 50 }));
  }
  function konfetti(b, n, farben) {
    farben = farben || ["#e0a046", "#e25b4b", "#7fc8a9", "#8fb3ff", "#f4e3b2", "#c48bff"];
    const h = b.clientHeight;
    for (let i = 0; i < n * wenig(); i++) {
      const x = Math.random() * 100, dx = (Math.random() * 2 - 1) * 40, r = Math.random() * 720 - 360;
      flieg(b, "", "konfetti", x, -6, [{ transform: "translate(0,0) rotate(0)", opacity: 1 }, { transform: "translate(" + dx + "px," + h * (.55 + Math.random() * .5) + "px) rotate(" + r + "deg)", opacity: 1, offset: .85 }, { transform: "translate(" + dx * 1.2 + "px," + h * 1.05 + "px) rotate(" + r * 1.2 + "deg)", opacity: 0 }], 1600 + Math.random() * 1200, Math.random() * 400);
      const e = fxEbene(b).lastChild; if (e) e.style.background = farben[i % farben.length];
    }
  }
  function regnen(b, n, html, klasse, dauer) {
    const h = b.clientHeight;
    for (let i = 0; i < n * wenig(); i++) flieg(b, html, klasse, 5 + Math.random() * 90, -10, [{ transform: "translate(0,0) rotate(0)" }, { transform: "translate(" + (Math.random() * 20 - 10) + "px," + h * .82 + "px) rotate(" + (Math.random() * 300) + "deg)", offset: .8 },
      { transform: "translate(" + (Math.random() * 20 - 10) + "px," + h * .74 + "px) rotate(" + (Math.random() * 300) + "deg)", offset: .9 }, { transform: "translate(0," + h * .82 + "px)", opacity: 0 }], dauer || 1500, Math.random() * 700);
  }
  function aufsteigen(b, n, html, klasse, x0, x1, dauer) {
    const h = b.clientHeight;
    for (let i = 0; i < n * wenig(); i++) flieg(b, html, klasse, x0 + Math.random() * (x1 - x0), 70 + Math.random() * 20, [{ transform: "translate(0,0) scale(.6)", opacity: 0 }, { opacity: 1, offset: .2 }, { transform: "translate(" + (Math.random() * 30 - 15) + "px,-" + h * (.4 + Math.random() * .35) + "px) scale(1.1)", opacity: 0 }], dauer || 1800, Math.random() * 600);
  }
  function platzen(b, n, html, klasse, x, y, weite, dauer) {
    for (let i = 0; i < n * wenig(); i++) {
      const w = Math.random() * Math.PI * 2, r = weite * (.4 + Math.random() * .6);
      flieg(b, html, klasse, x, y, [{ transform: "translate(0,0) scale(.4)", opacity: 1 }, { transform: "translate(" + Math.cos(w) * r + "px," + Math.sin(w) * r + "px) scale(1)", opacity: .9, offset: .6 }, { transform: "translate(" + Math.cos(w) * r * 1.2 + "px," + (Math.sin(w) * r * 1.2 + 14) + "px) scale(.8)", opacity: 0 }], dauer || 900, Math.random() * 80);
    }
  }
  function gross(b, html, klasse, dauer) {
    flieg(b, html, "gross " + (klasse || ""), 50, 42, [{ transform: "translate(-50%,-50%) scale(.2) rotate(-12deg)", opacity: 0 }, { transform: "translate(-50%,-50%) scale(1.15) rotate(3deg)", opacity: 1, offset: .2 },
      { transform: "translate(-50%,-50%) scale(1) rotate(0)", opacity: 1, offset: .32 }, { transform: "translate(-50%,-50%) scale(1)", opacity: 1, offset: .8 }, { transform: "translate(-50%,-60%) scale(1.1)", opacity: 0 }], dauer || 1600);
  }
  function quer(b, html, klasse, vonLinks, y, dauer, bogen) {
    const w = b.clientWidth;
    flieg(b, html, klasse, vonLinks ? -8 : 104, y, [{ transform: "translate(0,0)" + (vonLinks ? "" : " scaleX(-1)") }, { transform: "translate(" + (vonLinks ? 1 : -1) * w * .56 + "px," + (bogen ? -bogen : 0) + "px)" + (vonLinks ? "" : " scaleX(-1)"), offset: .5 },
      { transform: "translate(" + (vonLinks ? 1 : -1) * w * 1.15 + "px,0)" + (vonLinks ? "" : " scaleX(-1)") }], dauer, 0);
  }
  const DRACHE = '<svg viewBox="0 0 220 110"><g class="drachen-fluegel"><path d="M92 54 L58 4 L84 18 L80 0 L104 24 L106 6 L122 46 Z"/></g><path d="M2 62 Q30 54 60 60 Q84 46 110 52 L148 46 Q160 38 172 42 L196 36 L206 42 L192 48 L200 54 L182 54 Q168 58 150 58 L118 64 Q96 74 74 66 Q40 74 2 62 Z"/><path d="M118 62 l-6 14 l6 -2 M88 66 l-4 14 l5 -2" stroke-width="3" fill="none"/><circle cx="186" cy="44" r="1.8" fill="#ff8a3a"/></svg>';
  const BLITZ_SVG = '<svg viewBox="0 0 60 200" preserveAspectRatio="none"><path d="M34 0 L18 70 L32 72 L10 140 L28 140 L6 200" fill="none" stroke="#f4f8ff" stroke-width="4"/><path d="M34 0 L18 70 L32 72 L10 140 L28 140 L6 200" fill="none" stroke="#9cc4ff" stroke-width="10" opacity=".35"/></svg>';
  const STRAHLEN = '<svg viewBox="0 0 200 120" preserveAspectRatio="none"><g fill="#ffe7a0">' + Array.from({ length: 9 }, (_, i) => '<path d="M100 -10 L' + (i * 25 - 6) + ' 130 L' + (i * 25 + 6) + ' 130 Z" opacity=".' + (3 + (i % 3)) + '"/>').join("") + "</g></svg>";
  function buehneFx(art) {
    const b = buehne(); if (!b) return;
    fxBis = performance.now() + 3500; malenStarten();
    if (ruhig) { if (["donner", "blitz", "boom", "feuerball", "krit"].includes(art)) licht(b, "#fff", 400, .2); return; }
    const h = b.clientHeight;
    switch (art) {
      case "drache":
        flieg(b, DRACHE, "drache", -40, 4, [{ transform: "translate(0,0) scale(1)" }, { transform: "translate(" + b.clientWidth * .8 + "px," + h * .05 + "px) scale(1.25)", offset: .55 }, { transform: "translate(" + b.clientWidth * 1.5 + "px,-" + h * .1 + "px) scale(1.4)" }], 2600);
        setTimeout(() => { wackeln(b, 7, 1300); licht(b, "radial-gradient(ellipse at 50% 0%, rgba(255,110,40,.75), transparent 70%)", 1500, .9); alleSinken(b, 1400); publikum(b, "duck"); }, 700);
        break;
      case "schwert": case "hieb":
        flieg(b, "", "hieb", 30, 18, [{ transform: "rotate(-28deg) scaleX(0)", opacity: 1 }, { transform: "rotate(-28deg) scaleX(1)", opacity: 1, offset: .35 }, { transform: "rotate(-28deg) scaleX(1) translateX(30px)", opacity: 0 }], 420);
        platzen(b, 8, "", "funke", 52, 42, 40, 500); wackeln(b, 3, 300); break;
      case "tuer":
        licht(b, "rgba(0,0,0,.85)", 1600, .7);
        flieg(b, "", "tuerlicht", 0, 0, [{ opacity: 0, transform: "scaleX(.1)" }, { opacity: .8, transform: "scaleX(1)", offset: .3 }, { opacity: 0, transform: "scaleX(1.1)" }], 1600, 200);
        alleZittern(b, 300); break;
      case "donner":
        licht(b, "#e8f0ff", 350, .85); setTimeout(() => licht(b, "#e8f0ff", 500, .6), 260); setTimeout(() => wackeln(b, 5, 900), 200); break;
      case "schrei": alleZittern(b, 600); licht(b, "radial-gradient(circle, transparent 35%, rgba(120,0,0,.7))", 1300, 1); publikum(b, "schock");
        FIGUREN.forEach((f, i) => setTimeout(() => schweben("!", [12, 34, 60, 72, 90][i], "blase", 60), i * 60)); break;
      case "wuerfel": case "krit": {
        const w = b.clientWidth;
        flieg(b, '<svg viewBox="0 0 40 40"><path d="M20 2 L37 12 L37 28 L20 38 L3 28 L3 12 Z" fill="#e0a046" stroke="#5a3a10" stroke-width="2"/><path d="M20 2 L10 26 L30 26 Z M3 12 L10 26 M37 12 L30 26 M20 38 L10 26 M20 38 L30 26" fill="none" stroke="#5a3a10" stroke-width="1.5"/><text x="20" y="22" text-anchor="middle" font-size="9" font-weight="700" fill="#2a1a08">' + (art === "krit" ? 20 : 1 + Math.floor(Math.random() * 20)) + "</text></svg>", "w20", 0, 64,
          [{ transform: "translate(0,0) rotate(0)" }, { transform: "translate(" + w * .25 + "px,-" + h * .3 + "px) rotate(300deg)", offset: .3 }, { transform: "translate(" + w * .42 + "px,0) rotate(560deg)", offset: .55 }, { transform: "translate(" + w * .47 + "px,-" + h * .08 + "px) rotate(640deg)", offset: .7 }, { transform: "translate(" + w * .5 + "px,0) rotate(720deg)", offset: .85 }, { transform: "translate(" + w * .5 + "px,0) rotate(720deg)", opacity: 0 }], art === "krit" ? 1700 : 2000);
        if (art === "krit") setTimeout(() => { konfetti(b, 60); gross(b, "NAT 20!", "gold", 2000); licht(b, "radial-gradient(circle, rgba(255,220,120,.6), transparent 70%)", 1200, 1); alleSpringen(b, 14); publikum(b, "jubel"); }, 1000);
        break;
      }
      case "zauber": platzen(b, 26, "✦", "funkel lila", 50, 45, 120, 1400); licht(b, "radial-gradient(circle, rgba(170,110,255,.55), transparent 65%)", 1500, 1); break;
      case "horn": flieg(b, STRAHLEN, "strahlen", 0, 0, [{ opacity: 0 }, { opacity: .7, offset: .3 }, { opacity: 0 }], 2200);
        FIGUREN.forEach((f, i) => fig(b, f, [{ transform: "none" }, { transform: "translateY(-3px) scaleY(1.03)", offset: .3 }, { transform: "none" }], 1400, i * 70)); break;
      case "jubel": konfetti(b, 30); publikum(b, "jubel"); alleSpringen(b, 9); break;
      case "bogen": quer(b, "", "pfeil", true, 40, 620); break;
      case "pfeil": quer(b, "", "pfeil", false, 36, 420); setTimeout(() => { wackeln(b, 2.5, 220); platzen(b, 6, "", "staub", 18, 45, 22, 500); }, 380); break;
      case "verfehlt": quer(b, "", "pfeil", true, 18, 520, 10); fig(b, "barradin", [{ transform: "none" }, { transform: "translate(-8px,4px) rotate(-5deg)", offset: .3 }, { transform: "none" }], 700, 100);
        setTimeout(() => schweben("…", ORT.laute, "blase", 66), 300); break;
      case "block": platzen(b, 14, "", "funke", 46, 46, 50, 600); licht(b, "#fff6dc", 260, .5); flieg(b, "🛡", "symbol", 46, 36, [{ transform: "scale(.3)", opacity: 0 }, { transform: "scale(1.3)", opacity: 1, offset: .25 }, { transform: "scale(1)", opacity: 0 }], 900); wackeln(b, 3, 250); break;
      case "wucht": wackeln(b, 9, 600); platzen(b, 10, "", "staub", 50, 86, 70, 900); licht(b, "#000", 400, .35); break;
      case "schmerz": licht(b, "radial-gradient(circle, transparent 30%, rgba(200,20,20,.75))", 900, 1);
        fig(b, "barradin", [{ transform: "none" }, { transform: "translateX(-5px) rotate(-3deg)", offset: .2 }, { transform: "translateX(4px) rotate(2deg)", offset: .45 }, { transform: "none" }], 500); break;
      case "sterben": licht(b, "radial-gradient(circle, rgba(0,0,0,.2), rgba(0,0,0,.92))", 3000, 1); szeneFilter(b, "grayscale(1) brightness(.7)", 3000); alleSinken(b, 2600); publikum(b, "still");
        flieg(b, "💀", "symbol gross-sym", 47, 40, [{ transform: "translateY(0) scale(.5)", opacity: 0 }, { opacity: 1, offset: .25 }, { transform: "translateY(-40px) scale(1.2)", opacity: 0 }], 2400, 300); break;
      case "feuerball": licht(b, "radial-gradient(circle, rgba(255,170,60,.9), rgba(255,60,20,.5) 45%, transparent 75%)", 1200, 1); wackeln(b, 7, 700);
        platzen(b, 22, "", "glut", 50, 50, 150, 1300); aufsteigen(b, 8, "", "rauch", 35, 65, 2400); break;
      case "blitz": flieg(b, BLITZ_SVG, "blitzstrahl", 44, 0, [{ opacity: 0 }, { opacity: 1, offset: .05 }, { opacity: .2, offset: .2 }, { opacity: 1, offset: .3 }, { opacity: 0 }], 700);
        licht(b, "#eef4ff", 450, .8); wackeln(b, 4, 400); alleZittern(b, 400); break;
      case "heiltrank": aufsteigen(b, 18, "", "funkel gruen", 25, 75, 1900); aufsteigen(b, 5, "💚", "herz", 30, 70, 2100); licht(b, "radial-gradient(circle, rgba(120,255,160,.4), transparent 70%)", 1500, 1); break;
      case "tusch": flieg(b, "", "spot", 50, 0, [{ opacity: 0 }, { opacity: 1, offset: .15 }, { opacity: 1, offset: .7 }, { opacity: 0 }], 1800); platzen(b, 18, "✦", "funkel", 50, 40, 110, 1100); alleSpringen(b, 6); break;
      case "posaune": alleSinken(b, 2400); szeneFilter(b, "saturate(.3) brightness(.85)", 2400); schweben("😞", 50, "blase", 60); break;
      case "dramatisch": { const s = b.querySelector(".lw-szene"); if (s && s.animate) s.animate([{ transform: "none" }, { transform: "scale(1.12)", offset: .25 }, { transform: "scale(1.12)", offset: .8 }, { transform: "none" }], { duration: 2400, easing: "ease-in-out" });
        licht(b, "radial-gradient(circle, transparent 25%, rgba(0,0,0,.85) 70%)", 2400, 1); break; }
      case "grillen": licht(b, "rgba(4,8,20,.8)", 3200, .8); publikum(b, "still"); ["zirp", "zirp…"].forEach((z, i) => setTimeout(() => schweben(z, 15 + Math.random() * 70, "zirp", 12), 400 + i * 900)); break;
      case "ooh": publikum(b, "ooh"); [20, 50, 80].forEach((x, i) => setTimeout(() => schweben("Ooh!", x, "blase", 18), i * 140)); break;
      case "muenzen": regnen(b, 26, "", "muenze", 1500); break;
      case "ruelpser": platzen(b, 9, "", "wolke", 44, 34, 40, 1600); fig(b, "barradin", [{ transform: "none" }, { transform: "translateY(-3px) scale(1.04)", offset: .3 }, { transform: "none" }], 500); break;
      case "schnarchen": FIGUREN.forEach((f, i) => setTimeout(() => schweben("z", [12, 36, 60, 70, 90][i], "zzz", 55), i * 250)); setTimeout(() => schweben("Z", 42, "zzz gross-z", 60), 900); alleSinken(b, 3000); licht(b, "rgba(10,14,40,.7)", 3000, .6); break;
      case "bonk": fig(b, "barradin", [{ transform: "none" }, { transform: "translateY(5px) scaleY(.93)", offset: .12 }, { transform: "rotate(-4deg)", offset: .35 }, { transform: "rotate(3deg)", offset: .55 }, { transform: "rotate(-2deg)", offset: .75 }, { transform: "none" }], 1300);
        for (let i = 0; i < 5; i++) { const w = i / 5 * 360; flieg(b, "★", "stern-kreis", ORT.laute - 2, 24, [0, 90, 180, 270, 360].map(a => ({ transform: "rotate(" + (w + a) + "deg) translateX(22px) rotate(-" + (w + a) + "deg) scaleY(.6)" })).concat([{ transform: "rotate(" + (w + 450) + "deg) translateX(22px)", opacity: 0 }]), 1700); }
        break;
      case "lufthorn": wackeln(b, 6, 900); alleSpringen(b, 7, 400); setTimeout(() => alleSpringen(b, 7, 400), 450); flieg(b, "📯", "symbol", 8, 30, [{ transform: "scale(.5) rotate(-20deg)", opacity: 0 }, { transform: "scale(1.4) rotate(0)", opacity: 1, offset: .2 }, { transform: "scale(1.2)", opacity: 0 }], 1200); break;
      case "kratzer": b.classList.add("halt"); szeneFilter(b, "contrast(1.4) hue-rotate(20deg)", 500); { const s = b.querySelector(".lw-szene"); if (s && s.animate) s.animate([{ transform: "none" }, { transform: "translateX(-6px) skewX(4deg)", offset: .2 }, { transform: "translateX(5px)", offset: .4 }, { transform: "none" }], { duration: 400 }); }
        setTimeout(() => b.classList.remove("halt"), 900); break;
      case "boom": licht(b, "radial-gradient(circle, #fff, rgba(255,160,60,.8) 40%, rgba(60,20,0,.6))", 1300, 1); wackeln(b, 12, 1100); aufsteigen(b, 12, "", "rauch", 25, 75, 2600); platzen(b, 20, "", "glut", 50, 60, 170, 1000); alleSpringen(b, 12); publikum(b, "schock"); break;
      case "falsch": gross(b, "✗", "rot", 1300); wackeln(b, 3, 300); break;
      case "richtig": gross(b, "✓", "gruen", 1300); platzen(b, 10, "✦", "funkel gruen", 50, 42, 80, 900); break;
      case "rutsch": fig(b, "barradin", [{ transform: "none" }, { transform: "translateY(18px) scaleY(.9)", offset: .55 }, { transform: "translateY(-6px)", offset: .8 }, { transform: "none" }], 1300, 0, "ease-in-out"); break;
      case "boing": alleSpringen(b, 22, 700); break;
      case "hupe": fig(b, "rex", [{ transform: "none" }, { transform: "translateY(-18px) rotate(-8deg)", offset: .3 }, { transform: "none" }], 600); schweben("HUP!", ORT.rex, "blase", 52); break;
      case "halleluja": flieg(b, STRAHLEN, "strahlen gold", 0, 0, [{ opacity: 0 }, { opacity: .85, offset: .3 }, { opacity: .85, offset: .7 }, { opacity: 0 }], 3200); aufsteigen(b, 16, "✦", "funkel", 10, 90, 2600);
        FIGUREN.forEach((f, i) => fig(b, f, [{ transform: "none", filter: "none" }, { transform: "translateY(-6px)", filter: "brightness(1.4) drop-shadow(0 0 6px #ffe7a0)", offset: .4 }, { transform: "translateY(-6px)", filter: "brightness(1.4) drop-shadow(0 0 6px #ffe7a0)", offset: .75 }, { transform: "none", filter: "none" }], 3000, i * 90)); break;
      case "levelup": aufsteigen(b, 26, "", "funkel gold", 5, 95, 2000); gross(b, "LEVEL UP!", "gold klein", 2000); alleSpringen(b, 10); break;
      case "schock": alleSpringen(b, 16, 420); publikum(b, "schock"); FIGUREN.forEach((f, i) => setTimeout(() => schweben("!", [12, 36, 60, 70, 90][i], "blase", 60), i * 40)); licht(b, "#fff", 200, .4); break;
      case "wirbel": flieg(b, "", "spot wandert", 10, 0, [{ transform: "translateX(0)", opacity: 0 }, { opacity: 1, offset: .15 }, { transform: "translateX(" + b.clientWidth * .55 + "px)", opacity: 1, offset: .85 }, { transform: "translateX(" + b.clientWidth * .3 + "px)", opacity: 0 }], 2600);
        for (let i = 0; i < 12; i++) setTimeout(() => zucken("trommel"), i * 110); break;
      default:
        if (KLASSIK[art]) { flieg(b, "", "spot", 50, 0, [{ opacity: 0 }, { opacity: 1, offset: .3 }, { opacity: 0 }], 2000); publikum(b, "jubel"); }
    }
  }

  /* ---------- Gastmusiker aus unserer Geschichte ----------
     Sie kommen in passenden Stimmungen dazu und spielen eine eigene Stimme auf echten Aufnahmen (VSCO, gemeinfrei; FluidR3, CC BY).
     Die Gefallenen spielen als Geister mit. Stufe je Gast: 0 = nie, 1 = automatisch (passende Stimmungen), 2 = immer. */
  const GAESTE = [
    { id: "gundren", name: "Gundren", sym: "⛏", seite: "l", gr: "tuba", rolle: "tuba", pegel: .5, stimmungen: ["zwerge", "dorffest", "marktplatz", "shanty", "trinklied"] },
    { id: "nundro", name: "Nundro", sym: "⛏", seite: "l", gr: "pos", rolle: "posaune", pegel: .3, stimmungen: ["zwerge", "dorffest", "marktplatz", "shanty", "trinklied"] },
    { id: "zilda", name: "Zilda", sym: "🗡", seite: "l", gr: "snare1", rolle: "marsch", pegel: .42, stimmungen: ["kampf", "boss", "reiter", "verfolgung"] },
    { id: "fagas", name: "Fagas", sym: "👻", seite: "l", gr: "glock", rolle: "glitzer", pegel: .26, geist: 1, stimmungen: ["fey", "elben", "klage", "ruinen"] },
    { id: "kardal", name: "Kardal", sym: "👑", seite: "r", gr: "trp", rolle: "fanfare", pegel: .26, stimmungen: ["hof", "sieg", "zwerge", "heldenlied"] },
    { id: "dolgrimson", name: "Dolgrimson", sym: "⚓", seite: "r", gr: "horn", rolle: "signal", pegel: .34, stimmungen: ["reiter", "reise", "hof", "heldenlied"] },
    { id: "ilvara", name: "Ilvara", sym: "🕷", seite: "r", gr: "oboe", rolle: "schief", pegel: .28, stimmungen: ["spannung", "grusel"] },
    { id: "ploopploopeen", name: "Ploopploopeen", sym: "🐟", seite: "r", gr: "stimme", rolle: "chor", pegel: .3, geist: 1, stimmungen: ["unterreich", "grusel"] }
  ];
  const GAST = Object.fromEntries(GAESTE.map(g => [g.id, g]));
  Object.assign(TX.de, { gaesteTitel: "Gäste", gaesteTipp: "Gäste aus unserer Geschichte spielen in passenden Stimmungen mit und bekommen ein Solo.", gaesteEinzeln: "Gäste einzeln an- und abwählen",
    gastStufe: ["nie", "auto", "immer"], gastInstr: { gundren: "Tuba", nundro: "Posaune", zilda: "Marschtrommel", fagas: "Glockenspiel (Geist)", kardal: "Trompete", dolgrimson: "Signalhorn", ilvara: "Oboe", ploopploopeen: "Chorgesang (Geist)" } });
  Object.assign(TX.en, { gaesteTitel: "Guests", gaesteTipp: "Guests from our story join in fitting moods and get a solo.", gaesteEinzeln: "Choose guests one by one",
    gastStufe: ["never", "auto", "always"], gastInstr: { gundren: "tuba", nundro: "trombone", zilda: "marching drum", fagas: "glockenspiel (ghost)", kardal: "trumpet", dolgrimson: "signal horn", ilvara: "oboe", ploopploopeen: "chant (ghost)" } });
  const gastStufe = id => S.gaeste && (S.gaeste[id] === 0 || S.gaeste[id] === 2) ? S.gaeste[id] : 1;
  let gastJetzt = [], gastBus = null, gastSeite = {};
  const gastQ = [], gastZuletzt = {};
  function gastBusBauen() {
    if (gastBus || !ctx) return;
    gastBus = ctx.createGain(); gastBus.gain.value = 1; gastBus.connect(pumpZiel());
    const hs = ctx.createGain(); hs.gain.value = .6; gastBus.connect(hs); hs.connect(hallHP || hallEin); gastHall = hs; hallProfilAnwenden();
    [["l", -.45], ["r", .45]].forEach(([k, p]) => {
      const n = ctx.createGain();
      if (!leicht() && ctx.createStereoPanner) { const pn = ctx.createStereoPanner(); pn.pan.value = p; n.connect(pn); pn.connect(gastBus); } else n.connect(gastBus);
      gastSeite[k] = n;
    });
  }
  /* wer überhaupt mitspielen darf: passende Gäste (automatisch) und alle, die auf „immer“ stehen */
  function gastKandidaten() {
    const st = S.stimmung; if (!st || !STIL[st] || !gaesteAn()) return [];
    return GAESTE.filter(g => { const s = gastStufe(g.id); return s === 2 || (s === 1 && g.stimmungen.includes(st) && S.intensitaet >= 2); });
  }
  /* Der Zwischenteil (bei alten Liedern der C-Teil) gehört einem Gast: er spielt dort Echos Stimme als Solo. Wer dran ist, wechselt mit jedem neuen Thema. */
  function gastSolist(ab) {
    if (!S.stimmung || (S.rollen ? rolleAn(ab) !== "b" : S.ablauf[ab] !== "C")) return null;
    try { const kp = S.kapelle !== 0 && kapPlan(ab); if (kp && kp.solo) return null; } catch (_) {}
    const k = gastKandidaten(); if (!k.length) return null;
    const eigen = k.filter(g => g.stimmungen.includes(S.stimmung)), pool = eigen.length ? eigen : k;
    const tl = S.teile[S.ablauf[ab]], f = (tl && tl.floete) || [], h = f.reduce((a, v, i) => a + (v + 2) * (i + 3), 0);
    return pool[h % pool.length];
  }
  let gastSoloJetzt = null;
  /* wer in diesem Teil spielt: im ersten Teil die Band allein, danach wechseln sich die Gäste ab, im Höhepunkt sind alle da */
  function gaesteWaehlen(ab) {
    const c = hoehepunkt(), L = S.ablauf.length, so = gastSolist(ab);
    gastSoloJetzt = so;
    const wer = S.rollen ? sektionNr(ab) : ab;
    const kand = so ? [so] : gastKandidaten().filter(g => L === 1 || istHoch(ab) || (ab > 0 && (wer + GAESTE.indexOf(g)) % 2 === 0));
    gastJetzt = kand.slice(0, leicht() ? 1 : 3);
    gastJetzt.forEach(x => { if (x.rolle === "marsch") { sampleLaden("snare1"); sampleLaden("snare2"); } else probenLaden(x.gr); });
  }
  function gaesteVorladen() {
    if (!S.stimmung) return;
    GAESTE.forEach(g => { const s = gastStufe(g.id); if (s === 2 || (s === 1 && g.stimmungen.includes(S.stimmung))) { if (g.rolle === "marsch") { sampleLaden("snare1"); sampleLaden("snare2"); } else probenLaden(g.gr); } });
  }
  function gastTon(g, gr, midi, zeit, dauer, laut, o) {
    if (probe(gr, midi, zeit, gastSeite[g.seite], g.pegel * laut, Object.assign({ dauer, ein: .03, aus: Math.min(.3, dauer * .4) }, o || {})) && gastQ.length < 300) gastQ.push([zeit, g.id]);
  }
  /* Akkordtöne in den Tonraum eines Instruments rücken */
  const inLage = (m, lo, hi) => { while (m < lo) m += 12; while (m > hi) m -= 12; return m; };
  const GAST_ROLLE = {
    /* Gundren: in der Halle ein tiefer Ruf auf jedem Akkord, auf dem Fest das „Umm“ des Umpa */
    tuba(g, z, sd, ak, x) {
      if (S.takt === 12) { if (schritt === 0) gastTon(g, "tuba", inLage(ak.grund - 12, 33, 52), z, sd * 4, 1); return; }
      if (S.stimmung === "zwerge" || (gastStufe(g.id) === 2 && !g.stimmungen.includes(S.stimmung) && x.ruhig)) { if (x.wechselt) gastTon(g, "tuba", inLage(ak.grund - 12, 33, 50), z, x.n * sd + .1, 1, { ein: .08 }); return; }
      if (schritt === 0 || schritt === 8) gastTon(g, "tuba", inLage((schritt === 0 ? ak.grund : ak.q2) - 12, 33, 52), z, sd * 3, schritt === 0 ? 1 : .85);
    },
    /* Nundro, der Zwilling: das „Pah“ dazwischen – oder in der Halle eine Terz über dem Bruder */
    posaune(g, z, sd, ak, x) {
      if (S.takt === 12) { if (schritt === (STIL[S.stimmung] && STIL[S.stimmung].dreier === "jig" ? 6 : 4) || (schritt === 8 && STIL[S.stimmung].dreier !== "jig")) gastTon(g, "pos", inLage(ak.terz - 12, 45, 64), z, sd * 1.6, .8, { aus: .06 }); return; }
      if (S.stimmung === "zwerge" || (gastStufe(g.id) === 2 && !g.stimmungen.includes(S.stimmung) && x.ruhig)) { if (x.wechselt) gastTon(g, "pos", inLage(ak.terz - 12, 45, 62), z, x.n * sd + .1, .9, { ein: .1 }); return; }
      if (schritt === 4 || schritt === 12) gastTon(g, "pos", inLage((schritt === 4 ? ak.terz : ak.quinte) - 12, 45, 64), z, sd * 1.6, .8, { aus: .06 });
    },
    /* Zilda: Marschtrommel mit Akzenten auf Zwei und Vier, Vorschlägen und einem Wirbel vor dem Höhepunkt */
    marsch(g, z, sd, ak, x) {
      const c = hoehepunkt(), L = S.ablauf.length, vorher = L > 1 && x.ab === (c - 1 + L) % L;
      if (vorher && schritt >= 8) { gastTon(g, schritt % 2 ? "snare2" : "snare1", 0, z, .4, .35 + .05 * (schritt - 8)); return; }
      if (schritt === 4 || schritt === 12) gastTon(g, "snare1", 0, z, .5, 1);
      else if ((schritt === 14 || schritt === 15) && x.takt) gastTon(g, "snare2", 0, z, .4, .45);
      else if (schritt === 0 && x.ab === c) gastTon(g, "snare1", 0, z, .5, .9);
      else if (schritt % 2 === 1 && Math.random() < .12 * x.int) gastTon(g, "snare2", 0, z, .3, .25);
    },
    /* Fagas’ Geist: Glockenspiel-Arpeggios in den Wald- und Feenstimmungen, einzelne helle Töne in der Klage */
    glitzer(g, z, sd, ak, x) {
      if (S.stimmung === "klage") { if (x.wechselt && (schritt === 0 || x.takt)) gastTon(g, "glock", inLage(ak.quinte + 12, 76, 96), z, 2.2, .8); return; }
      if (!(x.takt || x.hoch)) return;
      const folge = { 8: ak.terz + 12, 10: ak.quinte + 12, 12: ak.grund + 36, 14: ak.terz + 24 };
      if (folge[schritt] != null) gastTon(g, "glock", inLage(folge[schritt], 76, 100), z, 1.6, schritt === 8 ? .9 : .7);
    },
    /* Kardal: Fanfare des Königssohns am Anfang jedes zweiten Teils (im Höhepunkt immer) */
    fanfare(g, z, sd, ak, x) {
      if (!(x.takt === 0 || x.hoch)) return;
      const grund = inLage(ak.grund + 12, 60, 72), terz = inLage(ak.terz, grund + 1, grund + 6), quinte = inLage(ak.quinte, grund + 5, grund + 9);
      const f = { 0: [grund, 1.6, 1], 2: [grund, 1, .8], 3: [terz, 1, .85], 4: [quinte, 4, 1] };
      if (f[schritt]) gastTon(g, "trp", f[schritt][0], z, sd * f[schritt][1], f[schritt][2], { ein: .015, aus: .08 });
      if (x.hoch && schritt === 12) gastTon(g, "trp", inLage(ak.quinte, 64, 79), z, sd * 4, .9, { ein: .02 });
    },
    /* Captain Dolgrimson: Signalruf Quinte – Grundton – Quinte über das weite Land */
    signal(g, z, sd, ak, x) {
      if (!(x.takt || x.hoch)) return;
      const q = inLage(ak.q2, 55, 67), gr = q - 7;
      const f = { 0: [q, 3], 3: [gr, 1], 4: [q, 7] };
      if (f[schritt]) gastTon(g, "horn", f[schritt][0], z, sd * f[schritt][1] + .05, schritt === 4 ? .9 : 1, { ein: .05 });
    },
    /* Ilvara: eine verführerisch schiefe Oboe – sie rutscht um einen Halbton daneben und zurück */
    schief(g, z, sd, ak, x) {
      if (!(x.takt || x.hoch)) return;
      const t3 = inLage(ak.terz, 64, 80);
      if (schritt === 8) gastTon(g, "oboe", t3, z, sd * 3, .9, { ein: .12 });
      if (schritt === 11) gastTon(g, "oboe", t3 + 1, z, sd * 2, .8, { ein: .06 });
      if (schritt === 13) gastTon(g, "oboe", t3, z, sd * 4, .75, { ein: .06, aus: .4 });
    },
    /* Ploopploopeens Geist: ein tiefer, fremder Gesang auf Grundton und Quinte, der mit jedem Akkord neu anhebt */
    chor(g, z, sd, ak, x) {
      if (!x.wechselt) return;
      const d = x.n * sd + .4;
      gastTon(g, "stimme", inLage(ak.grund, 50, 61), z, d, .9, { ein: .4, aus: .5 });
      if (!leicht()) gastTon(g, "stimme", inLage(ak.q2, 55, 66), z + .05, d, .55, { ein: .5, aus: .5 });
    }
  };
  function gaesteSchritt(zeit, daten, ab) {
    if (!S.stimmung || !STIL[S.stimmung] || !ctx) return;
    if (schritt === 0) gaesteWaehlen(ab);
    if (!gastJetzt.length || ausduennen || einblend > EINBLEND / 2) return;
    gastBusBauen();
    const sd = schrittDauer(), zeile = klingt(daten.bass, schritt), ak = akkordMidi(zeile);
    let n = 1; while (n < taktL() - schritt && klingt(daten.bass, schritt + n) === zeile) n++;
    const wechselt = schritt === 0 || (schritt % 4 === 0 && zeile !== klingt(daten.bass, schritt - 1));
    const x = { ab, n, wechselt, takt: ab % 2, hoch: istHoch(ab), int: S.intensitaet / 10, ruhig: (STIL[S.stimmung].dichte || 1) < .7 };
    if (gastSoloJetzt && gastJetzt[0] === gastSoloJetzt) { gastSolo(gastSoloJetzt, zeit, sd, daten); return; }
    gastJetzt.forEach(g => { try { GAST_ROLLE[g.rolle](g, zeit, sd, ak, x); } catch (_) {} });
  }
  /* das Solo: Echos Stimme des C-Teils, in der Lage des Gast-Instruments und etwas lauter */
  const SOLO_LAGE = { tuba: -24, posaune: -12, fanfare: 0, signal: -12, schief: 0, glitzer: 24, chor: 0 };
  function gastSolo(g, zeit, sd, daten) {
    const v = daten.floete[schritt];
    if (g.rolle === "marsch") { /* Zilda trommelt den Rhythmus der Melodie mit Vorschlägen und Akzenten */
      if (v >= 0) gastTon(g, schritt % 4 === 0 ? "snare1" : "snare2", 0, zeit, .5, schritt % 4 === 0 ? 1.15 : .8);
      else if (schritt % 2 === 1 && Math.random() < .35) gastTon(g, "snare2", 0, zeit, .3, .35);
      if (schritt >= 12 && Math.random() < .5) gastTon(g, "snare2", 0, zeit + sd / 2, .3, .4);
      return;
    }
    if (v < 0) return;
    const m = tonMidi("melodie", v, S) + (SOLO_LAGE[g.rolle] || 0), d = notenLaenge(daten.floete, schritt) * sd * .95 + (g.rolle === "chor" ? .25 : .04);
    gastTon(g, g.gr, m, zeit, d, 1.4, { ein: g.rolle === "chor" ? .12 : g.rolle === "glitzer" ? .004 : .025, aus: g.rolle === "glitzer" ? .6 : .12 });
  }

  /* ---------- Die Kapelle: eine ganze Big Band zusätzlich zu den Gefährten ----------
     Je Stimmung ein Kreis von Musikern (FluidR3-Klangsatz, CC BY 3.0). Bei jedem neuen Lied spielen zwei bis drei
     von ihnen mit – jedes Lied klingt anders besetzt. Jeder Musiker hat eine Spielweise und spielt nur in seinen
     Abschnitten (i Vorspiel, s Strophe, v Aufbau, r Refrain, b Zwischenteil, h Höhepunkt).
     Eintrag: [Instrument, Spielweise, Abschnitte, Oktavlage in Halbtönen, ab Intensität] */
  const KAP_INSTR = { akk: { g: .3, halt: 1 }, hack: { g: .36 }, cemb: { g: .3 }, mar: { g: .4 }, cel: { g: .3 }, spiel: { g: .28 }, rgl: { g: .24 },
    taiko: { g: .6 }, bfl: { g: .24, halt: 1 }, pic: { g: .17, halt: 1 }, pfeife: { g: .18, halt: 1 }, shaku: { g: .28, halt: 1 }, eh: { g: .26, halt: 1 },
    sitar: { g: .3 }, kal: { g: .4 }, bra: { g: .28, halt: 1 }, pizz: { g: .4 }, blech: { g: .24, halt: 1 }, xyl: { g: .26 }, ooh: { g: .24, halt: 1 } };
  const KAPELLE = {
    kampf: [["blech", "stoss", "srh"], ["taiko", "stampf", "svrbh"], ["pizz", "ostinato", "sv"], ["xyl", "unisono", "rh", 12, 5], ["ooh", "halte", "rh", -12]],
    boss: [["blech", "stoss", "srh"], ["taiko", "stampf", "isvrbh"], ["ooh", "halte", "srh", -12], ["pizz", "ostinato", "sb"], ["bra", "unisono", "h", -12, 5]],
    verfolgung: [["pizz", "ostinato", "svrh"], ["taiko", "stampf", "rh"], ["ooh", "halte", "rh", -12], ["blech", "stoss", "h"], ["bra", "terz", "r", -12]],
    spannung: [["pizz", "ostinato", "srh"], ["rgl", "glanz", "h"], ["cel", "echo", "r", 0, 4], ["sitar", "ostinato", "s"], ["spiel", "echo", "b"]],
    grusel: [["spiel", "unisono", "s", 12], ["ooh", "halte", "rh", -12], ["rgl", "glanz", "h"], ["cel", "echo", "b"], ["eh", "terz", "r", -12]],
    unterreich: [["sitar", "ostinato", "srh"], ["taiko", "puls", "h"], ["shaku", "echo", "sb"], ["ooh", "halte", "h", -12], ["rgl", "glanz", "h"]],
    ruinen: [["cel", "glanz", "srh"], ["shaku", "echo", "sr"], ["ooh", "halte", "h"], ["kal", "arp", "b"], ["sitar", "arp", "s"]],
    reise: [["hack", "arp", "srh"], ["bfl", "unisono", "rh"], ["pizz", "umpa", "s"], ["akk", "halte", "h"], ["mar", "ostinato", "s"]],
    reiter: [["blech", "stoss", "rh"], ["taiko", "puls", "svrh"], ["pizz", "ostinato", "s"], ["pic", "unisono", "h", 12, 6], ["hack", "arp", "s"]],
    heldenlied: [["blech", "stoss", "rh"], ["ooh", "halte", "h"], ["hack", "arp", "s"], ["taiko", "puls", "vh"], ["bra", "terz", "r", -12]],
    sieg: [["blech", "stoss", "srh"], ["pic", "unisono", "h", 12, 4], ["xyl", "glanz", "rh"], ["akk", "umpa", "s"], ["cemb", "arp", "s"]],
    rast: [["kal", "arp", "srh"], ["bfl", "echo", "r"], ["akk", "halte", "h"], ["hack", "terz", "h", -12], ["spiel", "glanz", "b"]],
    trinklied: [["akk", "umpa", "svrh"], ["hack", "unisono", "rh"], ["pfeife", "unisono", "h", 12, 5], ["xyl", "echo", "r"], ["mar", "ostinato", "s"]],
    kamin: [["hack", "arp", "srh"], ["bra", "terz", "rh", -12], ["spiel", "glanz", "ib"], ["eh", "echo", "s"], ["cemb", "arp", "s"]],
    klage: [["bra", "terz", "rh", -12], ["ooh", "halte", "h"], ["rgl", "glanz", "h"], ["eh", "unisono", "s", -12], ["cel", "glanz", "ib"]],
    auenland: [["pfeife", "unisono", "rh", 12, 4], ["akk", "umpa", "srh"], ["mar", "ostinato", "s"], ["bfl", "echo", "r"], ["hack", "arp", "s"]],
    elben: [["cel", "arp", "srh"], ["shaku", "echo", "rh"], ["ooh", "halte", "h"], ["kal", "glanz", "ib"], ["bra", "terz", "r", -12]],
    fey: [["cel", "glanz", "srh"], ["xyl", "arp", "rh"], ["kal", "ostinato", "s"], ["pic", "unisono", "h", 12, 5], ["spiel", "echo", "b"]],
    zwerge: [["taiko", "puls", "svrh"], ["blech", "stoss", "rh"], ["ooh", "halte", "h", -12], ["akk", "umpa", "s"], ["pizz", "umpa", "s"]],
    dorffest: [["akk", "umpa", "srh"], ["hack", "unisono", "rh"], ["pfeife", "echo", "h"], ["xyl", "arp", "s"], ["mar", "ostinato", "s"]],
    marktplatz: [["mar", "ostinato", "srh"], ["hack", "echo", "rh"], ["bra", "terz", "rh", -12], ["cemb", "arp", "s"], ["sitar", "echo", "b"]],
    hof: [["cemb", "arp", "srh"], ["blech", "stoss", "h"], ["bra", "terz", "rh", -12], ["bfl", "echo", "s"], ["cel", "glanz", "ib"]],
    shanty: [["akk", "umpa", "srh"], ["pfeife", "unisono", "rh", 12, 4], ["pizz", "ostinato", "s"], ["ooh", "halte", "h", -12], ["bra", "terz", "r", -12]],
    pilger: [["ooh", "halte", "srh"], ["rgl", "glanz", "rh"], ["eh", "unisono", "b", -12], ["bfl", "echo", "h"], ["cel", "glanz", "b"]]
  };
  Object.assign(TX.de, { kapelle: "🎺 Kapelle", kapelleTipp: "Weitere Musiker spielen in den Stimmungen mit – bei jedem neuen Lied eine andere Besetzung.", kapNeu: "Andere Besetzung",
    kapName: { akk: "Akkordeon", hack: "Hackbrett", cemb: "Cembalo", mar: "Marimba", cel: "Celesta", spiel: "Spieluhr", rgl: "Röhrenglocken", taiko: "Taiko", bfl: "Blockflöte",
      pic: "Piccolo", pfeife: "Blechpfeife", shaku: "Shakuhachi", eh: "Englischhorn", sitar: "Sitar", kal: "Kalimba", bra: "Bratsche", pizz: "Zupfstreicher", blech: "Bläsersatz", xyl: "Xylophon", ooh: "Chor" } });
  Object.assign(TX.en, { kapelle: "🎺 Band", kapelleTipp: "More musicians join the moods – a different line-up for every new song.", kapNeu: "Different line-up",
    kapName: { akk: "accordion", hack: "hammered dulcimer", cemb: "harpsichord", mar: "marimba", cel: "celesta", spiel: "music box", rgl: "tubular bells", taiko: "taiko", bfl: "recorder",
      pic: "piccolo", pfeife: "tin whistle", shaku: "shakuhachi", eh: "cor anglais", sitar: "sitar", kal: "kalimba", bra: "viola", pizz: "pizzicato strings", blech: "brass section", xyl: "xylophone", ooh: "choir" } });
  /* zwei bis drei Musiker aus dem Kreis der Stimmung – das Schlagwerk (Taiko) höchstens einmal */
  function kapelleWaehlen(k) {
    const pool = KAPELLE[k]; if (!pool) return [];
    /* Kampfmusik: Bläser und Taiko sind immer dabei */
    if (STIL[k] && STIL[k].fanfare) { const fest = [0, 1], rest = pool.map((_, i) => i).filter(i => i > 1).sort(() => Math.random() - .5); return fest.concat(rest.slice(0, 1)).sort((a, b) => a - b); }
    const ix = pool.map((_, i) => i).sort(() => Math.random() - .5), n = pool.length >= 4 && Math.random() < .65 ? 3 : 2;
    return ix.slice(0, n).sort((a, b) => a - b);
  }
  function kapSpieler() {
    const pool = stilKey() && KAPELLE[stilKey()];
    if (!pool || S.kapelle === 0 || !Array.isArray(S.kapWahl)) return [];
    return S.kapWahl.filter(i => pool[i]).slice(0, S.kapStufe === 1 ? 1 : leicht() ? 2 : 3).map((i, k) => {
      const [inst, weise, ab, lage, ab_int] = pool[i];
      return { inst, weise, ab, lage: lage || 0, min: ab_int == null ? 2 : ab_int, pan: [-.7, .7, -.15][k % 3] };
    });
  }
  let kapBus = null; const kapSeite = {};
  function kapBusBauen() {
    if (kapBus || !ctx) return;
    kapBus = ctx.createGain(); kapBus.gain.value = 1; kapBus.connect(pumpZiel());
    if (taktEchoEin) { const es = ctx.createGain(); es.gain.value = .5; kapBus.connect(es); es.connect(taktEchoEin); }
  }
  function kapZiel(pan) {
    const k = String(pan);
    if (kapSeite[k]) return kapSeite[k];
    const n = ctx.createGain();
    if (!leicht() && ctx.createStereoPanner) { const pn = ctx.createStereoPanner(); pn.pan.value = pan; n.connect(pn); pn.connect(kapBus); } else n.connect(kapBus);
    const hs = ctx.createGain(); hs.gain.value = .55; n.connect(hs); hs.connect(hallHP || hallEin); n._hall = hs; n._hallWert = .55;
    return kapSeite[k] = n;
  }
  /* Lagen der Kapelle, damit sich niemand mit Barradins Melodie (r … r+24) oder Echo im selben Bereich reibt:
     Begleitung (Umpa, Stöße, gehaltene Akkorde, Muster) unter der Melodie, helle Instrumente (Glöckchen & Co.) darüber,
     Melodie-Verdopplung immer eine Oktave entfernt, die Gegenstimme auf der Seite, wo Echo gerade nicht spielt */
  const KAP_HELL = ["xyl", "cel", "spiel", "kal", "pic", "pfeife", "rgl"];
  function kapFenster(p, weise) {
    /* spielt Barradin selbst Glöckchen (eine Oktave höher), rücken die hellen Kapellen-Instrumente nach unten */
    const r = MEL_GRUND + S.transpose, hell = KAP_HELL.includes(p.inst) && S.instrument !== "glocken";
    switch (weise) {
      case "umpa": case "stoss": case "halte": return [r - 15, r + 5];
      case "ostinato": case "arp": return hell ? [r + 19, r + 34] : [r - 12, r + 7];
      case "glanz": return [r + 22, r + 38];
      case "fanfare": return [r - 3, r + 19];
      case "unisono": return hell ? [r + 12, r + 40] : [r - 13, r + 11];
      case "terz": return hell ? [r + 10, r + 34] : [r - 6, r + 21];
      case "echo": return hell || echoOben(S.band.floete) === false ? [r + 12, r + 34] : [r - 12, r + 12];
      case "gegen": return echoOben(S.band.floete) || !hell ? [r - 12, r + 10] : [r + 14, r + 34];
      default: return null; /* Solo, Ohrwurm: wie geschrieben */
    }
  }
  function kapTon(p, midi, zeit, dauer, laut, int, nichtGleich) {
    const def = KAP_INSTR[p.inst], karte = SAMPLE_KARTE[p.inst]; if (!def || !karte) return;
    let lo = karte[0] - 2, hi = karte[karte.length - 1] + 2;
    const f = p.inst === "taiko" ? null : kapFenster(p, p.jetzt);
    if (f && Math.min(hi, f[1]) - Math.max(lo, f[0]) >= 11) { lo = Math.max(lo, f[0]); hi = Math.min(hi, f[1]); }
    let m = p.inst === "taiko" ? midi : inLage(midi, lo, hi);
    /* eine Verdopplung soll nie genau auf Barradins Ton landen – dann lieber die andere Oktave oder gar nicht */
    if (nichtGleich != null && m === nichtGleich) { if (m + 12 <= hi) m += 12; else if (m - 12 >= lo) m -= 12; else return; }
    const l = def.g * laut * (.55 + .55 * int);
    zeit += (Math.random() - .5) * .01; /* die Kapelle spielt nicht roboterhaft genau */
    const ziel = kapZiel(p.pan), hw = kapHallAnteil(p);
    if (ziel._hall && Math.abs(ziel._hallWert - hw) > .02) { ziel._hall.gain.setTargetAtTime(hw, Math.max(ctx.currentTime, zeit - .02), .05); ziel._hallWert = hw; }
    if (probe(p.inst, m, zeit, ziel, l, def.halt ? { ein: .04, aus: Math.min(.25, dauer * .4), dauer: dauer + .06 } : { dauer: Math.max(dauer, 1.2), aus: .3 }) && kapQ.length < 300) kapQ.push([zeit, p.inst]);
  }
  const kapQ = [], kapZuletzt = {}, kapSeiteMerk = {};
  const KAP_WEISE = {
    /* spielt die Melodie mit (eine Oktave höher oder tiefer) */
    unisono(p, z, sd, ak, x, d) { const v = d.melodie[schritt]; if (v < 0) return; const mm = tonMidi("melodie", v, S) + (S.instrument === "glocken" ? 12 : 0); kapTon(p, mm + (KAP_HELL.includes(p.inst) && S.instrument !== "glocken" ? 12 : -12), z, notenLaenge(d.melodie, schritt) * sd * .95, 1, x.int, mm); },
    /* eine Terz unter der Melodie */
    terz(p, z, sd, ak, x, d) { const v = d.melodie[schritt]; if (v < 0 || v < 2) return; kapTon(p, tonMidi("melodie", v - 2, S) + p.lage, z, notenLaenge(d.melodie, schritt) * sd * .95, .8, x.int); },
    /* antwortet wie ein Echo, zwei Schritte später und eine Oktave höher */
    echo(p, z, sd, ak, x, d) { if (schritt < 2) return; const v = d.melodie[schritt - 2]; if (v < 0 || d.melodie[schritt] >= 0) return; kapTon(p, tonMidi("melodie", v, S) + 12 + p.lage, z, 1.6 * sd, .65, x.int); },
    /* gebrochene Akkorde in Achteln */
    arp(p, z, sd, ak, x) { if (schritt % 2) return; const f = [ak.grund + 12, ak.terz, ak.quinte, ak.terz + 12]; kapTon(p, f[(schritt / 2) % 4] + p.lage, z, 2.4 * sd, schritt % (x.L === 12 ? 6 : 8) === 0 ? 1 : .72, x.int); },
    /* Umpa: Grundton auf der Eins, Akkord auf den leichten Zeiten */
    umpa(p, z, sd, ak, x) {
      const bass = x.L === 12 ? (x.jig ? [0, 6] : [0]) : [0, 8], akk = x.L === 12 ? (x.jig ? [3, 9] : [4, 8]) : [4, 12];
      if (bass.includes(schritt)) kapTon(p, ak.grund + p.lage, z, 1.6 * sd, .85, x.int);
      else if (akk.includes(schritt)) [ak.terz, ak.quinte].forEach(m => kapTon(p, m + p.lage, z, 1.4 * sd, .62, x.int));
    },
    /* Bläserstöße: kurze, satte Akkorde – im Höhepunkt öfter und synkopiert */
    stoss(p, z, sd, ak, x) {
      const hits = x.L === 12 ? (x.rolle === "h" ? [0, 4, 8] : [0, 8]) : (x.rolle === "h" ? [0, 6, 10, 12] : [0, 10]);
      if (!hits.includes(schritt)) return;
      [ak.terz, ak.quinte, ak.grund + 12].forEach((m, i) => kapTon(p, m + p.lage, z, (schritt === 0 ? 3 : 1.3) * sd, i ? .62 : .8, x.int));
    },
    /* ein wiederkehrendes Muster aus Akkordtönen (3-3-2) */
    ostinato(p, z, sd, ak, x) {
      const pos = x.L === 12 ? [0, 3, 6, 9] : [0, 3, 6, 8, 11, 14], i = pos.indexOf(schritt); if (i < 0) return;
      const f = [ak.grund + 12, ak.quinte, ak.terz + 12, ak.quinte, ak.grund + 24, ak.quinte];
      kapTon(p, f[i] + p.lage, z, 1.8 * sd, i === 0 ? 1 : .72, x.int);
    },
    /* ein heller Glanzton zu jedem Takt (im Höhepunkt zweimal) */
    glanz(p, z, sd, ak, x) { if (!(schritt === 0 || (x.rolle === "h" && schritt === x.mitte))) return; kapTon(p, ak.quinte + 12 + p.lage, z, 6 * sd, .9, x.int); },
    /* große Trommel: Eins und Drei, im Höhepunkt mehr, am Abschnittsende ein Wirbel */
    puls(p, z, sd, ak, x) {
      if (schritt === 0) kapTon(p, 36, z, 1.4, 1, x.int);
      else if (schritt === x.mitte) kapTon(p, 42, z, 1.2, .8, x.int);
      else if (x.ende && schritt >= x.L - 4) kapTon(p, 48, z, .6, .45 + .12 * (schritt - x.L + 4), x.int);
      else if (x.rolle === "h" && schritt === x.L - 4) kapTon(p, 42, z, 1, .7, x.int);
    },
    /* die eigene Gegenstimme aus dem Liedschreiber (lange Töne, Gegenbewegung) */
    gegen(p, z, sd, ak, x, d) {
      const g = d.gegen; if (!g) return; const v = g[schritt]; if (v < 0) return;
      let n = 1; while (schritt + n < x.L && g[schritt + n] < 0) n++;
      kapTon(p, tonMidi("melodie", v, S) + p.lage, z, n * sd * .96, .85, x.int);
    },
    /* das Solo im Zwischenteil: Echos Linie, gespielt vom Kapellenmusiker */
    solo(p, z, sd, ak, x, d) { const v = d.floete[schritt]; if (v < 0) return; kapTon(p, tonMidi("floete", v, S) - 12 + p.lage, z, notenLaenge(d.floete, schritt) * sd * .95, 1.25, Math.max(x.int, .6)); },
    /* im Vorspiel: der Ohrwurm des Refrains, schon einmal angedeutet */
    haken(p, z, sd, ak, x) {
      let r = null; for (let i = 0; i < S.ablauf.length; i++) if (rolleAn(i) === "r") { r = S.teile[S.ablauf[i]]; break; }
      if (!r) return; const v = r.melodie[schritt]; if (v < 0 || schritt >= x.mitte + (x.L === 12 ? 0 : 4)) return;
      kapTon(p, tonMidi("melodie", v, S) + p.lage, z, notenLaenge(r.melodie, schritt) * sd * .95, 1, Math.max(x.int, .6));
    },
    /* Fanfare: die Bläser spielen Barradins Melodie in ihrer eigenen Lage mit */
    fanfare(p, z, sd, ak, x, d) { const v = d.melodie[schritt]; if (v < 0) return; kapTon(p, tonMidi("melodie", v, S), z, notenLaenge(d.melodie, schritt) * sd * .92, 1.25, Math.max(x.int, .7)); },
    /* große Trommel auf jedem Schlag, am Abschnittsende ein Wirbel */
    stampf(p, z, sd, ak, x) {
      const viertel = x.L === 12 ? 3 : 4;
      if (schritt % viertel === 0) kapTon(p, schritt === 0 ? 36 : 42, z, 1, schritt === 0 ? 1 : .75, x.int);
      else if (x.ende && schritt >= x.L - 3) kapTon(p, 48, z, .5, .55, x.int);
    },
    /* lang gehaltener Akkord bei jedem Akkordwechsel */
    halte(p, z, sd, ak, x) { if (!x.wechselt) return; const d = x.n * sd + .3; [ak.terz, ak.quinte].forEach((m, i) => kapTon(p, m + p.lage, z, d, i ? .66 : .82, x.int)); }
  };
  /* ---------- Der Arrangeur: wer aus der Kapelle wann was spielt ----------
     Über das Lied baut sich die Kapelle auf: in der ersten Strophe nur ein Musiker, ab der zweiten antwortet einer Barradin
     (Ruf und Antwort), im Refrain spielen alle und ein Melodie-Instrument hat seine eigene Gegenstimme, ab dem zweiten Refrain
     verdoppelt der Bläsersatz den Ohrwurm. Im Zwischenteil bekommt abwechselnd ein Kapellenmusiker oder Echo bzw. ein Gast das Solo.
     Das Vorspiel deutet ein Kapellenmusiker mit dem Ohrwurm an. Spielt die Kapelle eine eigene Stimme, nimmt sich Echo zurück. */
  const KAP_MELODISCH = ["bfl", "pfeife", "shaku", "eh", "bra", "pic", "sitar", "akk", "hack", "xyl", "mar", "cemb", "cel", "kal", "spiel"];
  const KAP_RHYTHMUS = ["puls", "ostinato", "umpa", "stoss", "stampf"];
  function vorkommen(ab) { const r = rolleAn(ab); let n = -1; for (let i = 0; i <= ab; i++) if (rolleAn(i) === r && abschnittAnfang(i)) n++; return Math.max(0, n); }
  const abschnittEnde = ab => { const L = S.ablauf.length, nx = ab + 1; return nx >= L || abschnittAnfang(nx); };
  let kapPlanMerk = null;
  function kapPlan(ab) {
    const sp = kapSpieler(); if (!sp.length) return null;
    const key = [ab, S.ablauf, S.kapWahl.join(), S.intensitaet, durchgang, S.rollen || ""].join("|");
    if (kapPlanMerk && kapPlanMerk.key === key) return kapPlanMerk.plan;
    const r = rolleAn(ab), n = vorkommen(ab), tl = S.teile[S.ablauf[ab]] || {};
    /* die eigene Stimme bekommt ein Melodie-Instrument, das nicht gerade den Rhythmus trägt (Akkordeon-Umpa bleibt Umpa) */
    const mel = sp.map((_, i) => i).filter(i => KAP_MELODISCH.includes(sp[i].inst))
      .sort((a, b) => (KAP_RHYTHMUS.includes(sp[a].weise) - KAP_RHYTHMUS.includes(sp[b].weise)) || (KAP_MELODISCH.indexOf(sp[a].inst) - KAP_MELODISCH.indexOf(sp[b].inst)));
    const m = mel.length ? mel[0] : -1, bl = sp.findIndex(p => p.inst === "blech");
    const gegenDa = !!(tl.gegen && tl.gegen.some(v => v >= 0));
    let w = sp.map(p => p.ab.includes(r) ? p.weise : null), echo = 1, solo = false;
    if (!S.rollen) return (kapPlanMerk = { key, plan: { w, echo, solo } }).plan;   /* alte Lieder: wie bisher */
    if (r === "i") { w = w.map(() => null); if (m >= 0 && abschnittEnde(ab)) { w[m] = "haken"; echo = 0; } }
    else if (r === "s") {
      if (n === 0) { const erst = w.findIndex(x => x); w = w.map((x, i) => i === (erst >= 0 ? erst : 0) ? (x || sp[i].weise) : null); }
      else if (m >= 0 && (!w[m] || w[m] === "unisono")) w[m] = "echo";
    }
    else if (r === "v") w = sp.map((p, i) => KAP_RHYTHMUS.includes(p.weise) ? p.weise : w[i]);
    else if (r === "r" || r === "h") {
      w = sp.map(p => p.weise);
      if (m >= 0) { w[m] = gegenDa ? "gegen" : "terz"; echo = gegenDa ? .5 : 1; }
      if (bl >= 0 && (n >= 1 || r === "h")) w[bl] = abschnittEnde(ab) ? "stoss" : "unisono";
      /* Kampfmusik: im Refrain spielen die Bläser die Melodie selbst – die Fanfare */
      if (bl >= 0 && STIL[stilKey()] && STIL[stilKey()].fanfare) w[bl] = "fanfare";
    }
    else if (r === "b") {
      if (m >= 0 && (n + (S.arrSeed || 0) + durchgang) % 2 === 0) {
        w = sp.map((p, i) => i === m ? "solo" : ["halte", "glanz", "arp"].includes(p.weise) ? p.weise : null);
        echo = 0; solo = true;
      }
    }
    return (kapPlanMerk = { key, plan: { w, echo, solo } }).plan;
  }
  function kapelleSchritt(zeit, daten, ab) {
    if (!stilKey() || !ctx || ausduennen || einblend > EINBLEND / 2 || S.intensitaet < 2) return;
    const sp = kapSpieler(); if (!sp.length) return;
    kapBusBauen();
    const L = taktL(), rolle = rolleAn(ab), sd = schrittDauer(), zeile = klingt(daten.bass, schritt), ak = akkordMidi(zeile);
    let n = 1; while (n < L - schritt && klingt(daten.bass, schritt + n) === zeile) n++;
    const st = STIL[S.stimmung] || {}, naechst = (ab + 1) % S.ablauf.length;
    const x = { L, rolle, n, int: S.intensitaet / 10, jig: st.dreier === "jig", mitte: L === 12 ? (st.dreier === "jig" ? 6 : 8) : 8,
      wechselt: schritt === 0 || (schritt % 4 === 0 && zeile !== klingt(daten.bass, schritt - 1)), ende: naechst === 0 || abschnittAnfang(naechst) };
    /* der Plan des Arrangeurs; bei ruhiger Intensität nur der erste Musiker (das Solo und der Ohrwurm im Vorspiel bleiben) */
    const plan = kapPlan(ab) || { w: sp.map(p => p.ab.includes(rolle) ? p.weise : null) };
    sp.forEach((p, k) => {
      const weise = plan.w[k]; if (!weise || !KAP_WEISE[weise]) return;
      const besonders = weise === "solo" || weise === "haken";
      if (!besonders && (S.intensitaet < p.min || (k > 0 && S.intensitaet <= 3))) return;
      p.jetzt = weise;
      try { KAP_WEISE[weise](p, zeit, sd, ak, x, daten); } catch (_) {}
    });
  }
  function kapelleVorladen() { kapSpieler().forEach(p => probenLaden(p.inst)); }
  /* ---------- Mitspieler: Orchester, Kapelle und Gäste unter einem Dach ---------- */
  Object.assign(TX.de, { kick: "Bassdrum", kickStufe: ["aus", "passend", "kräftig"], kickTipp: "Tiefe Trommel unter der Musik: bei Festen ein warmer Schlag, im Kampf ein treibender Kick, bei Grusel ein Herzschlag. Antippen wechselt aus – passend – kräftig." });
  Object.assign(TX.en, { kick: "Bass drum", kickStufe: ["off", "fitting", "strong"], kickTipp: "Deep drum under the music: a warm thump at feasts, a driving kick in battle, a heartbeat in horror. Tap to cycle off – fitting – strong." });
  Object.assign(TX.de, { mitspieler: "🎻 Mitspieler", msStufe: ["Band allein", "Ein paar", "Volle Big Band"], msEigen: "eigene Auswahl", msAuf: "Einzeln einstellen",
    msOrch: "🎻 Geister-Orchester", msKap: "🎺 Kapelle", msGaeste: "🎭 Gäste", msNurBand: "Nur die Band spielt.", msGastPasst: "in passenden Stimmungen", msEinzeln: "Einzeln", msWaehle: "Wähle eine Stimmung, dann siehst du hier, wer mitspielt." });
  Object.assign(TX.en, { mitspieler: "🎻 Players", msStufe: ["Band alone", "A few", "Full big band"], msEigen: "custom", msAuf: "Adjust one by one",
    msOrch: "🎻 Ghost orchestra", msKap: "🎺 Street band", msGaeste: "🎭 Guests", msNurBand: "Only the band plays.", msGastPasst: "in fitting moods", msEinzeln: "Details", msWaehle: "Pick a mood to see who joins in." });
  let msAuf = false;
  /* welche Stufe gerade gilt – oder -1, wenn einzeln umgestellt wurde */
  function msStufe() {
    const o = S.orchester !== 0, k = S.kapelle !== 0, g = gaesteAn();
    if (!o && !k && !g) return 0;
    if (o && k && g) return S.kapStufe === 1 ? 1 : 2;
    return -1;
  }
  function msSetzen(n) {
    S.orchester = n ? 1 : 0; S.kapelle = n ? 1 : 0; S.kapStufe = n === 1 ? 1 : 2;
    S.gaeste = Object.assign({}, S.gaeste || {}, { _aus: n ? 0 : 1 });
    merken();
    if (ctx) { try { orchVorladen(); kapelleVorladen(); gaesteVorladen(); } catch (_) {} }
  }
  function mitspielerZeile(T) {
    if (hoerer) return "";
    const st = msStufe(), mitSt = !!(S.stimmung && KAPELLE[S.stimmung]);
    const kap = mitSt && S.kapelle !== 0 ? kapSpieler().map(p => (KAP_FIG[p.inst] ? KAP_FIG[p.inst].name + " (" + T.kapName[p.inst] + ")" : T.kapName[p.inst])) : [];
    const gaeste = gaesteAn() ? gastKandidaten().map(g => g.name) : [];
    const wer = [S.orchester !== 0 && ORCH[S.stimmung] ? T.msOrch.replace(/^\S+\s/, "") : "", ...kap, ...gaeste].filter(Boolean);
    const chip = (an, html, attr, tipp, extra) => '<button type="button" class="lw-gchip' + (an ? " ein" : "") + (extra || "") + '" ' + attr + ' aria-pressed="' + an + '"' + (tipp ? ' title="' + esc(tipp) + '"' : "") + ">" + html + "</button>";
    return '<div class="lw-mitspieler' + (msAuf ? " auf" : "") + '"><div class="lw-ms-kopf">' +
      '<div class="lw-ms-stufen" role="group" aria-label="' + esc(T.mitspieler) + '">' + T.msStufe.map((n, i) => '<button type="button" data-mitspieler="' + i + '" aria-pressed="' + (st === i) + '">' + n + "</button>").join("") + "</div></div>" +
      '<div class="lw-ms-fuss"><div class="lw-ms-wer">' + (st === -1 ? "<i>" + esc(T.msEigen) + "</i> · " : "") + esc(wer.length ? wer.join(" · ") : st === 0 ? T.msNurBand : T.msWaehle) + "</div>" +
      (kap.length ? '<button type="button" class="lw-klein" data-aktion="kapneu" title="' + esc(T.kapNeu) + '">🎲</button>' : "") + info("mitspieler") +
      '<button type="button" class="lw-gz-auf lw-ms-einzeln" data-aktion="msauf" aria-expanded="' + msAuf + '" title="' + esc(T.msAuf) + '">' + T.msEinzeln + " " + (msAuf ? "▴" : "▾") + "</button></div>" +
      (msAuf ? '<div class="lw-ms-liste">' +
        '<div class="lw-ms-gruppe">' + chip(S.orchester !== 0, T.msOrch, 'data-aktion="orchester"', T.orchTipp, " lw-orch") + "</div>" +
        '<div class="lw-ms-gruppe">' + chip(S.kapelle !== 0, T.msKap, 'data-aktion="kapelle"', T.kapelleTipp) +
          (mitSt && S.kapelle !== 0 ? '<span class="lw-kap-namen">' + esc(kap.join(" · ")) + "</span>" : "") + "</div>" +
        '<div class="lw-ms-gruppe">' + chip(gaesteAn(), T.msGaeste, 'data-aktion="gaeste"', T.gaesteTipp) + '<span class="lw-ms-klein">' + esc(T.msGastPasst) + "</span>" +
          '<div class="lw-gz-liste' + (gaesteAn() ? "" : " aus") + '">' + GAESTE.map(g => chip(gastStufe(g.id) > 0, g.sym + " " + g.name, 'data-gast="' + g.id + '"', T.gastInstr[g.id], (g.geist ? " geist" : "") + (gastDa[g.id] ? " spielt" : ""))).join("") + "</div></div>" +
        "</div>" : "") + "</div>";
  }
  function kapelleZeile(T) {
    if (hoerer || !S.stimmung || !KAPELLE[S.stimmung]) return "";
    const an = S.kapelle !== 0, namen = kapSpieler().map(p => T.kapName[p.inst]).join(" · ");
    return '<div class="lw-kapelle-zeile"><button type="button" class="lw-schalter" data-aktion="kapelle" aria-pressed="' + an + '" title="' + esc(T.kapelleTipp) + '">' + T.kapelle + "</button>" +
      (an ? '<span class="lw-kap-namen">' + esc(namen) + '</span><button type="button" class="lw-klein" data-aktion="kapneu" title="' + esc(T.kapNeu) + '">🎲</button>' : "") + "</div>";
  }

  /* ---------- Die Gäste auf der Bühne ---------- */
  const zwerg = (o) => '<ellipse cx="45" cy="137" rx="28" ry="3" fill="rgba(0,0,0,.4)"/>' +
    '<rect x="31" y="118" width="11" height="17" fill="' + o.hose + '"/><rect x="48" y="118" width="11" height="17" fill="' + o.hose + '"/><path d="M28 136 h16 v-5 h-15 Z M46 136 h16 v-5 h-15 Z" fill="#24160c"/>' +
    '<path d="M21 123 Q19 88 45 83 Q71 88 69 123 Z" fill="' + o.rock + '"/><path d="M21 113 H69" stroke="#2a1a0e" stroke-width="5"/><rect x="41" y="109" width="8" height="8" fill="#c9a24a"/>' +
    '<circle cx="45" cy="65" r="13" fill="' + o.haut + '"/>' +
    '<path d="M32 66 Q29 100 45 109 Q61 100 58 66 Q52 75 45 75 Q38 75 32 66 Z" fill="' + o.bart + '"/>' + (o.zopf ? '<path d="M45 100 V116 M40 98 L38 112 M50 98 L52 112" stroke="' + o.bart + '" stroke-width="3"/><circle cx="45" cy="117" r="2" fill="#c9a24a"/>' : "") +
    '<path d="M39 71 Q45 75 51 71" stroke="' + o.bartDunkel + '" stroke-width="2.4" fill="none"/>' +
    '<circle cx="40" cy="63" r="1.6" fill="#1a1008"/><circle cx="50" cy="63" r="1.6" fill="#1a1008"/><path d="M37 59 l5 -1 M48 58 l5 1" stroke="' + o.bartDunkel + '" stroke-width="1.6"/>' +
    '<ellipse cx="45" cy="67.5" rx="3.2" ry="2.6" fill="' + o.nase + '"/>' + o.kopf + o.instr +
    '<circle cx="' + o.h1[0] + '" cy="' + o.h1[1] + '" r="4" fill="' + o.haut + '"/><circle cx="' + o.h2[0] + '" cy="' + o.h2[1] + '" r="4" fill="' + o.haut + '"/>';
  const GAST_BILD = {
    gundren: zwerg({ hose: "#4a3424", rock: "#7a3a22", haut: "#d9a07a", nase: "#c48c66", bart: "#8a4a22", bartDunkel: "#5a2e12",
      kopf: '<path d="M31 59 Q32 45 45 44 Q58 45 59 59 Z" fill="#5a3a20"/><path d="M29 59 H61" stroke="#3a2412" stroke-width="3"/>',
      instr: '<g class="instr"><circle cx="40" cy="98" r="13" fill="none" stroke="#d9a63a" stroke-width="5"/><circle cx="40" cy="98" r="7" fill="none" stroke="#b8862a" stroke-width="2"/><path d="M50 89 Q60 72 69 56" stroke="#d9a63a" stroke-width="6" fill="none"/>' +
        '<ellipse cx="71" cy="51" rx="12" ry="5" transform="rotate(-28 71 51)" fill="#f0c860" stroke="#9a7020" stroke-width="1.5"/><path d="M46 75 L41 86" stroke="#c9a24a" stroke-width="2.5"/><rect x="51" y="92" width="4" height="8" fill="#b8862a"/><rect x="56" y="88" width="4" height="8" fill="#b8862a"/></g>',
      h1: [29, 99], h2: [57, 93] }),
    nundro: zwerg({ hose: "#3a3a2a", rock: "#3f5a32", haut: "#d9a07a", nase: "#c48c66", bart: "#d6d2c8", bartDunkel: "#9a968c",
      kopf: '<path d="M30 62 Q30 42 45 41 Q60 42 60 62 Q54 52 45 52 Q36 52 30 62 Z" fill="#5a6a3a"/>',
      instr: '<g class="instr"><path d="M46 72 H82 M48 80 H82" stroke="#d9a63a" stroke-width="3" fill="none"/><path d="M82 72 Q87 76 82 80" stroke="#d9a63a" stroke-width="3" fill="none"/>' +
        '<path d="M52 72 L30 64 M30 64 L22 58 L22 72 Z" stroke="#d9a63a" stroke-width="3" fill="#f0c860"/></g>', h1: [56, 76], h2: [78, 80] }),
    kardal: zwerg({ hose: "#2a2a34", rock: "#3a3a4a", haut: "#9c9ca8", nase: "#8a8a96", bart: "#1e1e24", bartDunkel: "#0e0e12", zopf: 1,
      kopf: '<path d="M32 58 Q45 50 58 58" stroke="#d8dce6" stroke-width="3" fill="none"/><path d="M42 54 L45 48 L48 54" fill="#d8dce6"/><circle cx="45" cy="55" r="1.6" fill="#7ad0ff"/>',
      instr: '<g class="instr"><path d="M48 72 L74 54" stroke="#e0b84a" stroke-width="3"/><path d="M72 56 L82 40 L88 48 Z" fill="#f0c860" stroke="#9a7020"/><path d="M56 66 v-6 M60 63 v-6 M64 60 v-6" stroke="#c9a24a" stroke-width="2"/></g>',
      h1: [56, 70], h2: [64, 62] }),
    dolgrimson: '<ellipse cx="45" cy="137" rx="24" ry="3" fill="rgba(0,0,0,.4)"/>' +
      '<rect x="35" y="96" width="9" height="38" fill="#2a2a38"/><rect x="47" y="96" width="9" height="38" fill="#2a2a38"/><path d="M32 136 h14 v-6 h-13 Z M45 136 h14 v-6 h-13 Z" fill="#15151c"/>' +
      '<path d="M27 104 Q25 54 45 49 Q65 54 63 104 L67 114 H23 Z" fill="#23365a"/><path d="M45 52 V112" stroke="#18243e" stroke-width="2"/>' +
      '<circle cx="41" cy="64" r="1.6" fill="#e0b84a"/><circle cx="41" cy="76" r="1.6" fill="#e0b84a"/><circle cx="41" cy="88" r="1.6" fill="#e0b84a"/><path d="M26 54 h10 M54 54 h10" stroke="#e0b84a" stroke-width="3"/>' +
      '<path d="M37 92 H53" stroke="#5a3a20" stroke-width="4"/><circle cx="45" cy="35" r="10" fill="#e0b08a"/><path d="M38 40 Q45 37 52 40" stroke="#8a8a8a" stroke-width="2.5" fill="none"/>' +
      '<circle cx="41" cy="33" r="1.4" fill="#1a1008"/><circle cx="49" cy="33" r="1.4" fill="#1a1008"/>' +
      '<path d="M25 29 Q45 8 65 29 Q45 22 25 29 Z" fill="#14141c"/><path d="M27 28 Q45 21 63 28" stroke="#e0b84a" stroke-width="1.2" fill="none"/>' +
      '<g class="instr"><circle cx="62" cy="54" r="9" fill="none" stroke="#d9a63a" stroke-width="3"/><path d="M51 41 Q57 45 56 48" stroke="#d9a63a" stroke-width="2.5" fill="none"/><path d="M67 61 L76 70 L69 74 Z" fill="#f0c860" stroke="#9a7020"/></g>' +
      '<circle cx="54" cy="47" r="3.6" fill="#e0b08a"/><circle cx="66" cy="62" r="3.6" fill="#e0b08a"/>',
    zilda: '<ellipse cx="45" cy="137" rx="24" ry="3" fill="rgba(0,0,0,.4)"/>' +
      '<rect x="36" y="98" width="8" height="36" fill="#3a2a1e"/><rect x="47" y="98" width="8" height="36" fill="#3a2a1e"/><path d="M33 136 h13 v-8 h-12 Z M45 136 h13 v-8 h-12 Z" fill="#20140c"/>' +
      '<path d="M29 100 Q28 58 45 53 Q62 58 61 100 Z" fill="#6b4627"/><path d="M33 62 L57 90 M57 62 L35 90" stroke="#4a2e18" stroke-width="2.2"/><path d="M28 100 H62" stroke="#2a1a0e" stroke-width="4"/>' +
      '<path d="M33 30 Q45 18 57 30 Q62 52 70 60 Q60 56 56 44 Z" fill="#a8452a"/><circle cx="45" cy="39" r="10" fill="#e6b896"/><path d="M35 34 Q45 24 55 34 Q50 30 45 31 Q40 30 35 34 Z" fill="#a8452a"/>' +
      '<circle cx="41" cy="39" r="1.4" fill="#1a1008"/><circle cx="49" cy="39" r="1.4" fill="#1a1008"/><path d="M42 44 Q45 46 48 44" stroke="#8a4a3a" stroke-width="1.4" fill="none"/>' +
      '<g class="instr"><rect x="34" y="96" width="30" height="16" rx="2" fill="#a83a2a" stroke="#5a1a10"/><ellipse cx="49" cy="96" rx="15" ry="4" fill="#ece4d0" stroke="#8a7a60"/><path d="M36 100 L44 110 L52 100 L60 110" stroke="#e0b84a" stroke-width="1.4" fill="none"/></g>' +
      '<g class="stoecke"><path d="M30 70 L42 92 M68 70 L56 92" stroke="#d8c49a" stroke-width="2.5" stroke-linecap="round"/></g><circle cx="30" cy="70" r="3.6" fill="#e6b896"/><circle cx="68" cy="70" r="3.6" fill="#e6b896"/>',
    ilvara: '<ellipse cx="45" cy="137" rx="24" ry="3" fill="rgba(0,0,0,.4)"/>' +
      '<path d="M27 136 Q30 80 45 54 Q60 80 63 136 Z" fill="#3a1f4a"/><path d="M45 56 V136" stroke="#2a1236" stroke-width="2"/><path d="M33 100 Q45 108 57 100" stroke="#b088d0" stroke-width="1.4" fill="none"/>' +
      '<path d="M34 30 Q30 70 26 88 Q36 70 38 50 Z M56 30 Q60 70 64 88 Q54 70 52 50 Z" fill="#e8e6f0"/><circle cx="45" cy="38" r="10" fill="#4a3a5e"/>' +
      '<path d="M35 34 Q45 22 55 34 Q50 29 45 30 Q40 29 35 34 Z" fill="#e8e6f0"/><path d="M35 38 l-6 -5 M55 38 l6 -5" stroke="#4a3a5e" stroke-width="2.4"/>' +
      '<circle cx="41" cy="38" r="1.6" fill="#ff3a3a"/><circle cx="49" cy="38" r="1.6" fill="#ff3a3a"/><path d="M41 37 h0 M49 37 h0" stroke="#ff8a8a"/>' +
      '<g class="instr"><path d="M45 45 L52 82" stroke="#14101a" stroke-width="3" stroke-linecap="round"/><path d="M50 72 L54 82 L49 83 Z" fill="#14101a"/><circle cx="47.5" cy="58" r="1" fill="#c0c0c8"/><circle cx="49" cy="66" r="1" fill="#c0c0c8"/></g>' +
      '<circle cx="47" cy="58" r="3.4" fill="#4a3a5e"/><circle cx="50" cy="72" r="3.4" fill="#4a3a5e"/>',
    fagas: '<ellipse cx="45" cy="137" rx="22" ry="3" fill="rgba(0,0,0,.25)"/>' +
      '<rect x="37" y="120" width="7" height="15" fill="#4a5a6a"/><rect x="47" y="120" width="7" height="15" fill="#4a5a6a"/>' +
      '<path d="M30 124 Q29 98 45 94 Q61 98 60 124 Z" fill="#4a7a5a"/><circle cx="45" cy="82" r="11" fill="#f0c8a8"/><ellipse cx="45" cy="85" rx="4" ry="3.4" fill="#e0a888"/>' +
      '<path d="M36 88 Q45 104 54 88 Q50 92 45 92 Q40 92 36 88 Z" fill="#f4f4f4"/><circle cx="41" cy="80" r="1.4" fill="#1a1008"/><circle cx="49" cy="80" r="1.4" fill="#1a1008"/>' +
      '<path d="M33 75 L45 44 L57 75 Z" fill="#6a3a8a"/><path d="M33 75 H57" stroke="#4a2a6a" stroke-width="3"/>' +
      '<g class="instr"><path d="M24 116 L66 116 L60 106 L30 106 Z" fill="#3a2a1a"/>' + [0, 1, 2, 3, 4, 5].map(i => '<rect x="' + (30 + i * 5.4) + '" y="' + (104 - i * .6) + '" width="4" height="' + (12 - i) + '" rx="1" fill="#d8dce6"/>').join("") + '</g>' +
      '<g class="stoecke"><path d="M30 96 L38 104 M60 96 L52 104" stroke="#d8c49a" stroke-width="2"/><circle cx="38" cy="104" r="2" fill="#e0b84a"/><circle cx="52" cy="104" r="2" fill="#e0b84a"/></g>',
    ploopploopeen: '<ellipse cx="45" cy="137" rx="24" ry="3" fill="rgba(0,0,0,.25)"/>' +
      '<path d="M25 136 Q27 86 45 70 Q63 86 65 136 Z" fill="#6a2a2a"/><path d="M45 72 V136" stroke="#4a1a1a" stroke-width="2"/>' +
      '<path d="M45 100 m-6 0 a6 6 0 1 0 12 0 a4 4 0 1 0 -8 0 a2 2 0 1 0 4 0" stroke="#e0b84a" stroke-width="1.6" fill="none"/>' +
      '<path d="M32 46 Q45 18 58 46 Q60 66 45 72 Q30 66 32 46 Z" fill="#5a8a7a"/><path d="M38 26 L45 10 L52 26 L49 24 L45 16 L41 24 Z" fill="#3a6a5a"/>' +
      '<circle cx="31" cy="46" r="7" fill="#e8f0e0"/><circle cx="59" cy="46" r="7" fill="#e8f0e0"/><circle cx="30" cy="46" r="3.4" fill="#101010"/><circle cx="60" cy="46" r="3.4" fill="#101010"/>' +
      '<ellipse class="mund" cx="45" cy="61" rx="6" ry="5" fill="#1a0e10"/><path d="M36 52 q2 2 4 0 M50 52 q2 2 4 0" stroke="#3a6a5a" stroke-width="1.4" fill="none"/>' +
      '<path d="M26 80 L16 64 M64 80 L74 64" stroke="#5a8a7a" stroke-width="6" stroke-linecap="round"/><path d="M14 64 l-3 -6 M16 62 l0 -7 M18 63 l3 -6 M72 63 l-3 -6 M74 62 l0 -7 M76 64 l3 -6" stroke="#5a8a7a" stroke-width="2"/>'
  };
  /* ---------- Die Kapelle auf der Bühne: zu jedem Instrument ein eigener Musiker ---------- */
  const nH = (x, y, haut) => '<circle cx="' + x + '" cy="' + y + '" r="3.7" fill="' + haut + '"/>';
  const nArm = (x1, y1, bx, by, x2, y2, farbe) => '<path d="M' + x1 + " " + y1 + " Q" + bx + " " + by + " " + x2 + " " + y2 + '" stroke="' + farbe + '" stroke-width="6.5" fill="none" stroke-linecap="round"/>';
  const NPC_HAAR = {
    kurz: (y, c) => '<path d="M35 ' + (y - 1) + " Q34 " + (y - 13) + " 45 " + (y - 13) + " Q56 " + (y - 13) + " 55 " + (y - 1) + " Q51 " + (y - 8) + " 45 " + (y - 8) + " Q39 " + (y - 8) + " 35 " + (y - 1) + ' Z" fill="' + c + '"/>',
    lang: (y, c) => '<path d="M35 ' + (y - 1) + " Q34 " + (y - 13) + " 45 " + (y - 13) + " Q56 " + (y - 13) + " 55 " + (y - 1) + " Q51 " + (y - 8) + " 45 " + (y - 8) + " Q39 " + (y - 8) + " 35 " + (y - 1) + ' Z M35 ' + (y - 3) + " Q31 " + (y + 12) + " 33 " + (y + 22) + " L38 " + (y + 4) + " Z M55 " + (y - 3) + " Q59 " + (y + 12) + " 57 " + (y + 22) + " L52 " + (y + 4) + ' Z" fill="' + c + '"/>',
    dutt: (y, c) => NPC_HAAR.kurz(y, c) + '<circle cx="45" cy="' + (y - 14) + '" r="4.5" fill="' + c + '"/>',
    locken: (y, c) => [[36, -6], [39, -11], [45, -13], [51, -11], [54, -6]].map(([x, d]) => '<circle cx="' + x + '" cy="' + (y + d) + '" r="4.2" fill="' + c + '"/>').join(""),
    keins: () => ""
  };
  const NPC_HUT = {
    spitz: (y, c) => '<path d="M33 ' + (y - 6) + " L47 " + (y - 36) + " L57 " + (y - 6) + ' Z" fill="' + c + '"/><path d="M31 ' + (y - 6) + " H59" + '" stroke="rgba(0,0,0,.35)" stroke-width="3"/>',
    kappe: (y, c) => '<ellipse cx="47" cy="' + (y - 9) + '" rx="12" ry="5" fill="' + c + '"/><circle cx="47" cy="' + (y - 14) + '" r="1.8" fill="' + c + '"/>',
    feder: (y, c) => '<ellipse cx="46" cy="' + (y - 9) + '" rx="13" ry="5" fill="' + c + '"/><path d="M52 ' + (y - 12) + " Q66 " + (y - 26) + " 72 " + (y - 22) + " Q62 " + (y - 18) + " 54 " + (y - 9) + ' Z" fill="#f4f0e6"/>',
    kapuze: (y, c) => '<path d="M32 ' + (y + 9) + " Q30 " + (y - 17) + " 45 " + (y - 17) + " Q60 " + (y - 17) + " 58 " + (y + 9) + " Q56 " + (y - 7) + " 45 " + (y - 8) + " Q34 " + (y - 7) + " 32 " + (y + 9) + ' Z" fill="' + c + '"/>',
    kasa: (y) => '<path d="M24 ' + (y - 4) + " L45 " + (y - 19) + " L66 " + (y - 4) + ' Z" fill="#c9a86a" stroke="#7a5a30" stroke-width="1"/>',
    hoerner: (y, c) => '<path d="M38 ' + (y - 8) + " Q31 " + (y - 19) + " 35 " + (y - 25) + " Q38 " + (y - 16) + " 42 " + (y - 10) + " Z M52 " + (y - 8) + " Q59 " + (y - 19) + " 55 " + (y - 25) + " Q52 " + (y - 16) + " 48 " + (y - 10) + ' Z" fill="' + c + '"/>',
    tuch: (y, c) => '<path d="M34 ' + (y - 2) + " Q35 " + (y - 13) + " 45 " + (y - 13) + " Q55 " + (y - 13) + " 56 " + (y - 2) + ' Z" fill="' + c + '"/><path d="M56 ' + (y - 4) + " l6 3 l-3 5 Z" + '" fill="' + c + '"/>',
    perucke: (y) => [[34, -2], [34, 5], [35, -9], [45, -13], [55, -9], [56, -2], [56, 5]].map(([x, d]) => '<circle cx="' + x + '" cy="' + (y + d) + '" r="4.6" fill="#ece8de"/>').join(""),
    shako: (y, c) => '<rect x="37" y="' + (y - 23) + '" width="16" height="14" rx="2" fill="' + c + '"/><path d="M35 ' + (y - 9) + " H55" + '" stroke="#1a1a1a" stroke-width="2.5"/><circle cx="45" cy="' + (y - 17) + '" r="2" fill="#e0b84a"/><path d="M45 ' + (y - 23) + " v-5" + '" stroke="#f4f0e6" stroke-width="2.5"/>',
    keiner: () => ""
  };
  /* ein Musiker aus dem Volk: Kopfhöhe ky, Kleidung, Haar, Hut – das Instrument und die Arme kommen obendrauf */
  function npc(o) {
    const y = o.ky || 40, sy = y + 16, h = o.haut, k = o.kleid, bt = o.klein ? 116 : 108;
    let s = '<ellipse cx="45" cy="137" rx="23" ry="3" fill="rgba(0,0,0,.4)"/>';
    if (o.robe) s += '<path d="M27 135 Q29 ' + (sy + 34) + " 34 " + sy + " Q45 " + (sy - 5) + " 56 " + sy + " Q61 " + (sy + 34) + ' 63 135 Z" fill="' + k + '"/>' + (o.saum ? '<path d="M27.5 132 H62.5" stroke="' + o.saum + '" stroke-width="2.5"/>' : "");
    else s += '<rect x="36" y="' + bt + '" width="8" height="' + (134 - bt) + '" fill="' + (o.hose || "#3a2a1e") + '"/><rect x="47" y="' + bt + '" width="8" height="' + (134 - bt) + '" fill="' + (o.hose || "#3a2a1e") + '"/>' +
      '<path d="M33 136 h12 v-5 h-11 Z M46 136 h12 v-5 h-11 Z" fill="#20140c"/>' +
      '<path d="M30 ' + (bt + 4) + " Q29 " + (sy + 6) + " 35 " + sy + " Q45 " + (sy - 5) + " 55 " + sy + " Q61 " + (sy + 6) + " 60 " + (bt + 4) + ' Z" fill="' + k + '"/>' +
      (o.gurt ? '<path d="M30 ' + (bt - 2) + " H60" + '" stroke="' + o.gurt + '" stroke-width="3.5"/>' : "");
    if (o.muster) s += o.muster;
    if (o.elf) s += '<path d="M36 ' + y + " L27 " + (y - 7) + " L36 " + (y + 4) + " Z M54 " + y + " L63 " + (y - 7) + " L54 " + (y + 4) + ' Z" fill="' + h + '"/>';
    if (o.gross) s += '<ellipse cx="33" cy="' + y + '" rx="7" ry="4" transform="rotate(-25 33 ' + y + ')" fill="' + h + '"/><ellipse cx="57" cy="' + y + '" rx="7" ry="4" transform="rotate(25 57 ' + y + ')" fill="' + h + '"/>';
    s += '<circle cx="45" cy="' + y + '" r="' + (o.klein ? 11 : 10) + '" fill="' + h + '"/>' + (NPC_HAAR[o.haar || "kurz"] || NPC_HAAR.kurz)(y, o.haarFarbe || "#4a2e18");
    if (o.bart) s += '<path d="M37 ' + (y + 3) + " Q38 " + (y + 18) + " 45 " + (y + 20) + " Q52 " + (y + 18) + " 53 " + (y + 3) + " Q49 " + (y + 8) + " 45 " + (y + 8) + " Q41 " + (y + 8) + " 37 " + (y + 3) + ' Z" fill="' + o.bart + '"/>';
    s += '<circle cx="41" cy="' + (y - 1) + '" r="1.4" fill="#1a1008"/><circle cx="49" cy="' + (y - 1) + '" r="1.4" fill="#1a1008"/>';
    s += o.singt ? '<ellipse class="mund" cx="45" cy="' + (y + 5) + '" rx="2.6" ry="2.2" fill="#3a1a14"/>' : o.blaest ? "" : '<path d="M42 ' + (y + 4.5) + " Q45 " + (y + 7) + " 48 " + (y + 4.5) + '" stroke="rgba(60,30,20,.75)" stroke-width="1.3" fill="none"/>';
    if (o.zaehne) s += '<path d="M41 ' + (y + 5) + " l1 -3 l1 3 M47 " + (y + 5) + " l1 -3 l1 3" + '" stroke="#f4f0e0" stroke-width="1.2" fill="#f4f0e0"/>';
    if (o.hut) s += NPC_HUT[o.hut](y, o.hutFarbe || "#5a3a20");
    return s + (o.vorne || "") + '<g class="instr">' + o.instr + "</g>" + (o.arme || "");
  }
  /* die Musiker der Kapelle: Name, ob Geist, und ihr Bild (viewBox 0 0 90 140) */
  const KAP_FIG = {
    akk: { name: "Mira", bild: npc({ klein: 1, ky: 62, haut: "#e8b896", kleid: "#8a3a5a", haar: "dutt", haarFarbe: "#7a4a22", hose: "#4a2e2a",
      instr: '<rect x="27" y="84" width="8" height="26" rx="2" fill="#efe6d4" stroke="#6b1a14"/><g class="balg"><path d="M35 84 L38 87 L35 90 L38 93 L35 96 L38 99 L35 102 L38 105 L35 110 H55 L52 105 L55 102 L52 99 L55 96 L52 93 L55 90 L52 87 L55 84 Z" fill="#b0302a" stroke="#5a1010" stroke-width=".8"/>' +
        '<path d="M38 87 H52 M38 93 H52 M38 99 H52 M38 105 H52" stroke="#e0b84a" stroke-width=".7"/></g><rect x="55" y="84" width="8" height="26" rx="2" fill="#b0302a" stroke="#5a1010"/>' +
        [88, 93, 98, 103].map(v => '<circle cx="59" cy="' + v + '" r="1.2" fill="#f4f0e0"/>').join("") + [86, 90, 94, 98, 102, 106].map(v => '<path d="M28 ' + v + ' h6" stroke="#1a1010" stroke-width="1.4"/>').join(""),
      arme: nArm(36, 79, 30, 86, 31, 96, "#8a3a5a") + nArm(54, 79, 60, 86, 59, 96, "#8a3a5a") + nH(31, 96, "#e8b896") + nH(59, 96, "#e8b896") }) },
    hack: { name: "Pimpel", bild: npc({ klein: 1, ky: 64, haut: "#f0c0a0", kleid: "#3a6a8a", haar: "keins", bart: "#f4f0e8", hut: "spitz", hutFarbe: "#b0302a", hose: "#5a4a3a",
      instr: '<path d="M22 110 L20 134 M68 110 L70 134" stroke="#4a2e18" stroke-width="2.5"/><path d="M14 110 L76 110 L67 97 L23 97 Z" fill="#8a5a2a" stroke="#3a2412" stroke-width="1.2"/>' +
        '<path d="M22 100 H68 M20 103.5 H70 M18 107 H72" stroke="#efe2c2" stroke-width=".6"/><circle cx="45" cy="103" r="3" fill="#3a2412"/>',
      arme: nArm(36, 80, 30, 88, 33, 93, "#3a6a8a") + nArm(54, 80, 60, 88, 57, 93, "#3a6a8a") + '<g class="stoecke"><path d="M33 93 L28 101 M57 93 L62 101" stroke="#d8c49a" stroke-width="1.6"/><circle cx="28" cy="101" r="1.8" fill="#9b3a2f"/><circle cx="62" cy="101" r="1.8" fill="#9b3a2f"/></g>' + nH(33, 93, "#f0c0a0") + nH(57, 93, "#f0c0a0") }) },
    cemb: { name: "Baron Quill", bild: npc({ ky: 38, haut: "#ecc8a8", kleid: "#33356a", haar: "keins", hut: "perucke", gurt: "#c9a24a", hose: "#e8e0d0",
      muster: '<path d="M45 56 V100" stroke="#e0b84a" stroke-width="1.6"/><path d="M40 57 L45 63 L50 57" fill="#f4f0e6"/>',
      instr: '<path d="M18 104 L16 134 M72 104 L74 134 M45 104 L45 134" stroke="#2a1a10" stroke-width="2.5"/><path d="M10 90 H66 Q80 90 80 98 L78 104 H10 Z" fill="#3a1f12" stroke="#c9a24a" stroke-width="1.2"/>' +
        '<rect x="14" y="88" width="52" height="5" fill="#f4f0e6" stroke="#2a1a10" stroke-width=".6"/>' + [18, 24, 30, 36, 42, 48, 54, 60].map(x => '<rect x="' + x + '" y="88" width="2.4" height="3" fill="#1a1010"/>').join(""),
      arme: nArm(35, 55, 28, 72, 34, 89, "#33356a") + nArm(55, 55, 62, 72, 55, 89, "#33356a") + nH(34, 89, "#ecc8a8") + nH(55, 89, "#ecc8a8") }) },
    mar: { name: "Oska", bild: npc({ ky: 40, haut: "#8aa868", kleid: "#c0702a", haar: "lang", haarFarbe: "#1a1410", zaehne: 1, gurt: "#5a3a20", hose: "#4a3a2a",
      instr: '<path d="M14 104 L12 134 M76 104 L78 134" stroke="#4a2e18" stroke-width="2.5"/>' + [0, 1, 2, 3, 4, 5, 6].map(i => '<rect x="' + (12 + i * 9.6) + '" y="' + (94 + i * .7) + '" width="8" height="' + (10 - i * .7) + '" rx="1.5" fill="#a8643a" stroke="#5a2e12" stroke-width=".6"/>').join("") +
        [0, 1, 2, 3, 4, 5, 6].map(i => '<rect x="' + (14.5 + i * 9.6) + '" y="105" width="3" height="' + (22 - i * 2) + '" fill="#8a8a92"/>').join(""),
      arme: nArm(35, 56, 26, 76, 30, 88, "#c0702a") + nArm(55, 56, 64, 76, 60, 88, "#c0702a") + '<g class="stoecke"><path d="M30 88 L24 95 M60 88 L66 95" stroke="#d8c49a" stroke-width="1.6"/><circle cx="24" cy="95" r="2.2" fill="#3a5a9a"/><circle cx="66" cy="95" r="2.2" fill="#3a5a9a"/></g>' + nH(30, 88, "#8aa868") + nH(60, 88, "#8aa868") }) },
    cel: { name: "Lady Wispel", geist: 1, bild: npc({ ky: 38, haut: "#dfe8f0", kleid: "#9ab4d0", robe: 1, saum: "#e8f0ff", haar: "lang", haarFarbe: "#b8a8e0",
      instr: '<rect x="14" y="84" width="62" height="40" rx="3" fill="#5a3a5a" stroke="#d8c0e0" stroke-width="1"/><rect x="18" y="84" width="54" height="5" fill="#f4f0e6"/>' + [22, 30, 38, 46, 54, 62].map(x => '<rect x="' + x + '" y="84" width="2.4" height="3" fill="#1a1010"/>').join("") +
        '<path d="M22 96 H68 M22 110 H68" stroke="#d8c0e0" stroke-width=".7"/><circle cx="45" cy="104" r="4" fill="none" stroke="#d8c0e0"/><path d="M18 124 v10 M72 124 v10" stroke="#5a3a5a" stroke-width="3"/>',
      arme: nArm(35, 54, 28, 70, 33, 85, "#9ab4d0") + nArm(55, 54, 62, 70, 57, 85, "#9ab4d0") + nH(33, 85, "#dfe8f0") + nH(57, 85, "#dfe8f0") }) },
    spiel: { name: "Nele", geist: 1, bild: npc({ klein: 1, ky: 66, haut: "#e8eef4", kleid: "#e4e8f0", robe: 1, saum: "#b0c0d8", haar: "lang", haarFarbe: "#c8b890", singt: 1,
      instr: '<rect x="33" y="94" width="24" height="12" rx="1.5" fill="#8a5a3a" stroke="#4a2a12"/><path d="M33 94 L36 86 H60 L57 94 Z" fill="#a8744a" stroke="#4a2a12" stroke-width=".8"/><path d="M45 94 v-6" stroke="#e0b84a" stroke-width="1"/><circle cx="45" cy="87" r="1.8" fill="#f0a0c0"/>' +
        '<g class="kurbel"><path d="M57 100 h5 v-5" stroke="#c9a24a" stroke-width="1.6" fill="none"/></g>',
      arme: nArm(37, 83, 32, 92, 35, 100, "#e4e8f0") + nArm(53, 83, 60, 90, 60, 96, "#e4e8f0") + nH(35, 100, "#e8eef4") + nH(60, 96, "#e8eef4") }) },
    rgl: { name: "Bruder Anselm", bild: npc({ ky: 42, haut: "#e0b090", kleid: "#6a4a2a", robe: 1, haar: "keins", hut: "kapuze", hutFarbe: "#5a3a1e",
      muster: '<path d="M34 98 Q45 102 56 98" stroke="#d8c49a" stroke-width="2" fill="none"/>',
      vorne: '<path d="M66 30 V134 M88 30 V134 M64 30 H90" stroke="#3a2412" stroke-width="2.5"/>' + [0, 1, 2, 3].map(i => '<rect x="' + (68.5 + i * 4.6) + '" y="33" width="3.2" height="' + (62 - i * 9) + '" rx="1.2" fill="#d8c070" stroke="#8a7020" stroke-width=".5"/>').join(""),
      instr: "",
      arme: nArm(35, 58, 30, 76, 38, 84, "#6a4a2a") + nArm(55, 58, 62, 62, 64, 58, "#6a4a2a") + '<g class="stoecke"><path d="M64 58 L70 49" stroke="#8a5a32" stroke-width="2"/><rect x="67" y="45" width="7" height="4" rx="1.5" fill="#efe2c2" transform="rotate(-55 70 47)"/></g>' + nH(38, 84, "#e0b090") + nH(64, 58, "#e0b090") }) },
    taiko: { name: "Grom", bild: npc({ ky: 38, haut: "#7a9a5a", kleid: "#7a9a5a", haar: "keins", hut: "tuch", hutFarbe: "#b0302a", zaehne: 1, hose: "#2a2a34", gurt: "#b0302a",
      muster: '<path d="M38 66 Q45 70 52 66 M40 78 h10" stroke="#5a7a3a" stroke-width="1.4" fill="none"/>',
      instr: '<path d="M20 126 L16 136 M70 126 L74 136" stroke="#3a2412" stroke-width="3"/><rect x="16" y="90" width="58" height="38" rx="15" fill="#7a3a1a" stroke="#3a1a0a" stroke-width="1.2"/>' +
        '<ellipse cx="45" cy="91" rx="27" ry="5" fill="#e8d9b5" stroke="#3a1a0a"/><path d="M18 100 H72 M18 118 H72" stroke="#c9a24a" stroke-width="1"/>' + [24, 32, 40, 48, 56, 64].map(x => '<circle cx="' + x + '" cy="100" r="1.1" fill="#e0b84a"/><circle cx="' + x + '" cy="118" r="1.1" fill="#e0b84a"/>').join("") + '<path d="M34 104 Q45 114 56 104" stroke="#d8c49a" stroke-width="1.5" fill="none"/>',
      arme: nArm(34, 54, 22, 58, 24, 44, "#7a9a5a") + nArm(56, 54, 68, 58, 66, 44, "#7a9a5a") + '<g class="stoecke"><path d="M24 44 L30 26 M66 44 L60 26" stroke="#d8c49a" stroke-width="3" stroke-linecap="round"/></g>' + nH(24, 44, "#7a9a5a") + nH(66, 44, "#7a9a5a") }) },
    bfl: { name: "Tobi", bild: npc({ klein: 1, ky: 64, haut: "#f0c8a0", kleid: "#4a7a3a", haar: "locken", haarFarbe: "#d8b060", hose: "#6a4a2a", gurt: "#5a3a20", blaest: 1,
      instr: '<path d="M45 70 L50 108" stroke="#d8b070" stroke-width="4" stroke-linecap="round"/><path d="M49 103 L52 110 L47 111 Z" fill="#c09050"/>' + [82, 88, 94].map(v => '<circle cx="' + (45 + (v - 70) * 5 / 38) + '" cy="' + v + '" r=".9" fill="#5a3a1a"/>').join(""),
      arme: nArm(37, 81, 34, 92, 46, 84, "#4a7a3a") + nArm(53, 81, 58, 98, 49, 98, "#4a7a3a") + nH(46, 84, "#f0c8a0") + nH(49, 98, "#f0c8a0") }) },
    pic: { name: "Fips", bild: npc({ klein: 1, ky: 62, haut: "#f0c4a4", kleid: "#a8302a", haar: "kurz", haarFarbe: "#3a2414", hut: "shako", hutFarbe: "#1e2a4a", hose: "#eae4d6", gurt: "#f4f0e6", blaest: 1,
      muster: '<path d="M36 84 L54 104 M54 84 L36 104" stroke="#f4f0e6" stroke-width="1.6"/>',
      instr: '<path d="M46 67 L78 60" stroke="#d8dce6" stroke-width="2.6" stroke-linecap="round"/><g fill="#5a5a64"><circle cx="60" cy="64" r=".8"/><circle cx="65" cy="63" r=".8"/><circle cx="70" cy="62" r=".8"/></g>',
      arme: nArm(37, 79, 42, 84, 54, 66, "#a8302a") + nArm(53, 79, 66, 80, 70, 63, "#a8302a") + nH(54, 66, "#f0c4a4") + nH(70, 63, "#f0c4a4") }) },
    pfeife: { name: "Jonte", bild: npc({ ky: 40, haut: "#e0a87a", kleid: "#e8e4dc", haar: "kurz", haarFarbe: "#6a3a1a", hut: "tuch", hutFarbe: "#b0302a", bart: "#6a3a1a", hose: "#2a3a5a", blaest: 1,
      muster: [64, 72, 80, 88, 96, 104].map(v => '<path d="M30.5 ' + v + ' H59.5" stroke="#2a4a7a" stroke-width="2.6"/>').join(""),
      instr: '<path d="M46 46 L60 80" stroke="#c8ccd6" stroke-width="3" stroke-linecap="round"/><path d="M46 46 L49 53" stroke="#2a6a3a" stroke-width="3.4" stroke-linecap="round"/>' + [62, 68, 74].map(v => '<circle cx="' + (46 + (v - 46) * 14 / 34) + '" cy="' + v + '" r=".9" fill="#3a3a44"/>').join(""),
      arme: nArm(35, 56, 36, 72, 51, 62, "#e8e4dc") + nArm(55, 56, 64, 70, 57, 73, "#e8e4dc") + nH(51, 62, "#e0a87a") + nH(57, 73, "#e0a87a") }) },
    shaku: { name: "Ren", bild: npc({ ky: 40, haut: "#e4b890", kleid: "#4a5a6a", robe: 1, saum: "#2a3440", haar: "keins", hut: "kasa", blaest: 1,
      muster: '<path d="M38 56 L45 76 L52 56" stroke="#e8e0d0" stroke-width="2" fill="none"/>',
      instr: '<path d="M45 47 L49 104" stroke="#b8a060" stroke-width="5" stroke-linecap="round"/><path d="M44.5 62 h5 M45.6 78 h5 M46.8 94 h5" stroke="#7a6630" stroke-width="1.2"/>',
      arme: nArm(35, 56, 34, 70, 46, 66, "#4a5a6a") + nArm(55, 56, 58, 80, 48, 86, "#4a5a6a") + nH(46, 66, "#e4b890") + nH(48, 86, "#e4b890") }) },
    eh: { name: "Elarion", bild: npc({ ky: 38, haut: "#f0d8c0", kleid: "#3a6a4a", robe: 1, saum: "#d8c070", haar: "lang", haarFarbe: "#e8e4d8", elf: 1, blaest: 1,
      muster: '<path d="M45 56 V132" stroke="#d8c070" stroke-width="1.2"/>',
      instr: '<path d="M46 42 Q49 46 47 50" stroke="#c9a24a" stroke-width="1.4" fill="none"/><path d="M47 50 L53 100" stroke="#2a1a14" stroke-width="3.4" stroke-linecap="round"/><ellipse cx="53.5" cy="103" rx="3.6" ry="4.6" fill="#2a1a14"/>' + [62, 72, 82].map(v => '<circle cx="' + (47 + (v - 50) * 6 / 50) + '" cy="' + v + '" r=".9" fill="#d8dce6"/>').join(""),
      arme: nArm(35, 54, 36, 68, 48, 62, "#3a6a4a") + nArm(55, 54, 60, 80, 51, 84, "#3a6a4a") + nH(48, 62, "#f0d8c0") + nH(51, 84, "#f0d8c0") }) },
    sitar: { name: "Zaria", bild: npc({ ky: 40, haut: "#a8708e", kleid: "#2a7a7a", haar: "lang", haarFarbe: "#1a1020", hut: "hoerner", hutFarbe: "#2a1a24", gurt: "#e0b84a", hose: "#3a2a4a",
      instr: '<path d="M30 104 L80 28" stroke="#6a3a1a" stroke-width="4.4" stroke-linecap="round"/><circle cx="29" cy="106" r="14" fill="#a8643a" stroke="#4a2410" stroke-width="1.2"/><circle cx="29" cy="106" r="8" fill="none" stroke="#e0b84a" stroke-width=".8"/>' +
        '<circle cx="74" cy="36" r="5" fill="#a8643a" stroke="#4a2410"/>' + [0, 1, 2, 3, 4].map(i => '<path d="M' + (44 + i * 6) + " " + (79 - i * 9) + ' l4 2.5" stroke="#e0b84a" stroke-width=".9"/>').join("") + '<path d="M30 104 L80 28" stroke="#ebe2cc" stroke-width=".5"/>',
      arme: nArm(35, 56, 42, 70, 62, 57, "#2a7a7a") + nArm(55, 56, 50, 86, 37, 98, "#2a7a7a") + nH(62, 57, "#a8708e") + nH(37, 98, "#a8708e") }) },
    kal: { name: "Funkel", bild: '<g class="fluegel"><path d="M40 80 Q14 56 18 86 Q22 98 40 88 Z M50 80 Q76 56 72 86 Q68 98 50 88 Z" fill="rgba(200,240,255,.45)" stroke="rgba(230,250,255,.8)" stroke-width=".8"/></g>' +
      npc({ klein: 1, ky: 64, haut: "#f4dcc8", kleid: "#7ab06a", robe: 1, saum: "#e8f0a0", haar: "locken", haarFarbe: "#e8a0c8", elf: 1,
        instr: '<rect x="34" y="88" width="22" height="13" rx="3" fill="#a8743c" stroke="#5a3a1a"/><circle cx="45" cy="97" r="2" fill="#3a2410"/>' + [0, 1, 2, 3, 4, 5, 6].map(i => '<path d="M' + (36.5 + i * 2.8) + " 89 v" + (6 - Math.abs(i - 3) * 1.2) + '" stroke="#e0e4ec" stroke-width="1.4"/>').join(""),
        arme: nArm(37, 81, 31, 90, 35, 96, "#7ab06a") + nArm(53, 81, 59, 90, 55, 96, "#7ab06a") + nH(35, 96, "#f4dcc8") + nH(55, 96, "#f4dcc8") }) },
    bra: { name: "Liriel", bild: npc({ ky: 40, haut: "#f2d6c0", kleid: "#7a2a3a", robe: 1, saum: "#d8a050", haar: "lang", haarFarbe: "#b0441e", elf: 1,
      instr: '<path d="M30 56 L10 48" stroke="#3a2414" stroke-width="3" stroke-linecap="round"/><path d="M10 48 q-4 -2 -3 -6" stroke="#3a2414" stroke-width="2.4" fill="none"/>' +
        '<ellipse cx="36" cy="60" rx="10" ry="7" transform="rotate(20 36 60)" fill="#9a4a22" stroke="#4a1a0a"/><path d="M33 58 q2 2 0 4 M40 60 q2 2 0 4" stroke="#2a1a10" stroke-width="1.2" fill="none"/><path d="M42 63 L10 48" stroke="#ebe2cc" stroke-width=".5"/>',
      arme: nArm(35, 56, 22, 66, 18, 52, "#7a2a3a") + '<g class="bogen">' + nArm(55, 56, 64, 72, 58, 72, "#7a2a3a") + '<path d="M58 72 L22 64" stroke="#6b4423" stroke-width="1.6"/><path d="M58 70 L23 62" stroke="#f2ead8" stroke-width=".7"/>' + nH(58, 72, "#f2d6c0") + "</g>" + nH(18, 52, "#f2d6c0") }) },
    pizz: { name: "Knirps", bild: npc({ klein: 1, ky: 70, haut: "#8ab060", kleid: "#6a5a3a", haar: "keins", gross: 1, zaehne: 1, hose: "#3a3a2a", gurt: "#3a2414", hut: "kappe", hutFarbe: "#6a2a2a",
      vorne: "",
      instr: '<path d="M62 70 L64 14" stroke="#2a1a10" stroke-width="3.4"/><path d="M64 14 q4 -6 0 -9 q-4 3 0 9" fill="#3a2414"/><path d="M60 128 L58 136" stroke="#2a1a10" stroke-width="2"/>' +
        '<path d="M62 66 Q46 66 49 84 Q44 92 48 104 Q42 128 61 128 Q80 128 74 104 Q78 92 73 84 Q76 66 62 66 Z" fill="#9a4a22" stroke="#4a1a0a" stroke-width="1.2"/><path d="M57 92 q2 3 0 6 M66 92 q2 3 0 6" stroke="#2a1a10" stroke-width="1.4" fill="none"/>' +
        '<path d="M58 118 h8" stroke="#2a1a10" stroke-width="2"/><path d="M61 118 L63 14 M63 118 L64.5 14" stroke="#ebe2cc" stroke-width=".5"/>',
      arme: nArm(37, 87, 44, 70, 61, 46, "#6a5a3a") + nArm(53, 87, 52, 102, 59, 104, "#6a5a3a") + nH(61, 46, "#8ab060") + nH(59, 104, "#8ab060") }) },
    blech: { name: "Herold Hagen", bild: npc({ ky: 38, haut: "#e8b890", kleid: "#2a4a8a", haar: "kurz", haarFarbe: "#3a2414", hut: "feder", hutFarbe: "#8a1e1e", hose: "#e8e0d0", gurt: "#c9a24a", blaest: 1,
      muster: '<path d="M34 56 H56 L54 102 H36 Z" fill="#c9a24a" opacity=".25"/><path d="M45 70 l4 6 l-4 6 l-4 -6 Z" fill="#e0b84a"/>',
      instr: '<path d="M46 44 L82 38" stroke="#e0b84a" stroke-width="2.8" stroke-linecap="round"/><path d="M80 38 L90 30 L90 46 Z" fill="#f0c860" stroke="#9a7020" stroke-width=".8"/>' +
        '<path d="M58 42 L74 39.5 L74 58 L66 54 L58 60 Z" fill="#8a1e1e" stroke="#e0b84a" stroke-width=".8"/><path d="M66 46 l2.5 4 l-2.5 4 l-2.5 -4 Z" fill="#e0b84a"/>',
      arme: nArm(35, 54, 40, 62, 55, 44, "#2a4a8a") + nArm(55, 54, 66, 58, 70, 40, "#2a4a8a") + nH(55, 44, "#e8b890") + nH(70, 40, "#e8b890") }) },
    xyl: { name: "Klapper", bild: '<ellipse cx="45" cy="137" rx="22" ry="3" fill="rgba(0,0,0,.4)"/>' +
      '<path d="M39 106 L37 134 M51 106 L53 134" stroke="#ece6d4" stroke-width="3.4" stroke-linecap="round"/><path d="M33 135 h7 M50 135 h7" stroke="#ece6d4" stroke-width="3" stroke-linecap="round"/>' +
      '<path d="M45 52 V104" stroke="#ece6d4" stroke-width="3"/>' + [62, 70, 78, 86].map((v, i) => '<path d="M' + (34 + i) + " " + v + " Q45 " + (v + 5) + " " + (56 - i) + " " + v + '" stroke="#ece6d4" stroke-width="2.4" fill="none"/>').join("") +
      '<path d="M36 104 Q45 98 54 104 Q45 110 36 104 Z" fill="#ece6d4"/>' +
      '<path d="M35 38 Q35 24 45 24 Q55 24 55 38 Q55 46 50 48 V52 H40 V48 Q35 46 35 38 Z" fill="#f4f0e2"/><circle cx="41" cy="37" r="3" fill="#1a1010"/><circle cx="49" cy="37" r="3" fill="#1a1010"/><circle cx="41" cy="37" r=".9" fill="#7ad0ff"/><circle cx="49" cy="37" r=".9" fill="#7ad0ff"/>' +
      '<path d="M44 42 l1 -2 l1 2 Z" fill="#1a1010"/><path class="mund" d="M41 48 h8 M43 46.5 v3 M45 46.5 v3 M47 46.5 v3" stroke="#1a1010" stroke-width=".8"/>' +
      '<g class="instr"><path d="M16 106 L12 134 M74 106 L78 134" stroke="#4a2e18" stroke-width="2.5"/>' + [0, 1, 2, 3, 4, 5, 6].map(i => '<rect x="' + (12 + i * 9.6) + '" y="' + (96 + i * .6) + '" width="8" height="' + (9 - i * .6) + '" rx="1.2" fill="' + ["#d84a3a", "#e8903a", "#e8c83a", "#6ab04a", "#3a8ad8", "#6a5ad8", "#b05ad8"][i] + '" stroke="rgba(0,0,0,.4)" stroke-width=".5"/>').join("") + '<path d="M10 106 H80" stroke="#4a2e18" stroke-width="2"/></g>' +
      '<path d="M37 56 Q28 70 30 88 M53 56 Q62 70 60 88" stroke="#ece6d4" stroke-width="3" fill="none" stroke-linecap="round"/>' +
      '<g class="stoecke"><path d="M30 88 L24 95 M60 88 L66 95" stroke="#ece6d4" stroke-width="2"/><circle cx="24" cy="95" r="2.4" fill="#f4f0e2"/><circle cx="66" cy="95" r="2.4" fill="#f4f0e2"/></g>' },
    ooh: { name: "Die Nebelstimmen", geist: 1, bild: [[20, 50, .82], [70, 50, .82], [45, 40, 1]].map(([x, y, s]) => '<g transform="translate(' + x + " " + y + ") scale(" + s + ')"><path d="M-14 86 Q-16 20 0 14 Q16 20 14 86 Q8 80 4 86 Q0 80 -4 86 Q-8 80 -14 86 Z" fill="#c8d8ec"/>' +
      '<path d="M-12 30 Q-14 2 0 0 Q14 2 12 30 Q6 20 0 20 Q-6 20 -12 30 Z" fill="#9ab0cc"/><circle cx="0" cy="18" r="9" fill="#e8f0fa"/><circle cx="-3.4" cy="16" r="1.4" fill="#2a3a5a"/><circle cx="3.4" cy="16" r="1.4" fill="#2a3a5a"/>' +
      '<ellipse class="mund" cx="0" cy="22.5" rx="2.4" ry="3" fill="#2a3a5a"/><rect x="-8" y="40" width="16" height="11" rx="1" fill="#6a4a2a"/><path d="M0 40 v11" stroke="#e8e0d0" stroke-width=".8"/></g>').join("") }
  };
  const KAP_HTML = Object.keys(KAP_FIG).map(id => '<svg class="lw-gast lw-kap kap-' + id + (KAP_FIG[id].geist ? " geist" : "") + ' seite-l" data-gast-bild="kap-' + id + '" viewBox="0 0 90 140" overflow="visible"><g class="gk">' + KAP_FIG[id].bild + "</g></svg>").join("");
  const GAESTE_HTML = '<div class="lw-gaeste" aria-hidden="true">' + KAP_HTML + GAESTE.map(g => '<svg class="lw-gast gast-' + g.id + (g.geist ? " geist" : "") + " seite-" + g.seite + '" data-gast-bild="' + g.id + '" viewBox="0 0 90 140" overflow="visible"><g class="gk">' + GAST_BILD[g.id] + "</g></svg>").join("") + "</div>";
  const gastDa = {};
  /* wer gerade gespielt hat, steht auf der Bühne; wer länger still ist, geht wieder */
  function gaesteZeigen(b) {
    const jetzt = performance.now(), da = { l: [], r: [] };
    if (!laeuft) Object.keys(gastZuletzt).forEach(k => delete gastZuletzt[k]);
    while (gastQ.length && gastQ[0][0] <= ctx.currentTime) {
      const id = gastQ.shift()[1]; gastZuletzt[id] = jetzt; gastWippen(b, id);
    }
    GAESTE.forEach(g => { if (gastZuletzt[g.id] && jetzt - gastZuletzt[g.id] < (g.rolle === "chor" || g.rolle === "glitzer" || g.rolle === "schief" || g.rolle === "signal" || g.rolle === "fanfare" ? 7000 : 3500) && (laeuft || klassikLauf)) da[g.seite].push(g.id); });
    kapZeigen(b, jetzt, da);
    bandRuecken(b, da.l.length, da.r.length);
    GAESTE.forEach(g => {
      const el = b.querySelector('[data-gast-bild="' + g.id + '"]'); if (!el) return;
      const i = da[g.seite].indexOf(g.id), ist = i >= 0;
      if (ist) el.style.setProperty("--slot", i);
      el.classList.toggle("solo", ist && gastSoloJetzt === g && (laeuft || false));
      if (ist !== el.classList.contains("da")) {
        el.classList.toggle("da", ist);
        if (ist && !gastDa[g.id]) setTimeout(() => { const r = el.getBoundingClientRect(), br = b.getBoundingClientRect(); if (r.width) schweben((g.geist ? "👻 " : "") + g.name, Math.max(9, Math.min(91, (r.left + r.width / 2 - br.left) / br.width * 100)), "blase gastname", 70); }, 500);
        gastDa[g.id] = ist;
      }
    });
    root.querySelectorAll("[data-gast]").forEach(c => c.classList.toggle("spielt", !!gastDa[c.dataset.gast]));
    return da.l.length + da.r.length > 0;
  }
  /* Die Musiker der Kapelle treten an den Bühnenrand, sobald ihr Instrument erklingt – innen neben der Band, die Gäste außen.
     Wer länger still ist (oder nicht mehr zur Besetzung gehört), geht wieder. */
  const kapDa = {};
  function kapZeigen(b, jetzt, da) {
    if (!laeuft && !klassikLauf) Object.keys(kapZuletzt).forEach(k => delete kapZuletzt[k]);
    while (kapQ.length && kapQ[0][0] <= ctx.currentTime) {
      const id = kapQ.shift()[1]; kapZuletzt[id] = jetzt; kapWippen(b, id);
    }
    /* beim Cover: wer zuletzt gespielt hat (höchstens vier) */
    const spieler = laeuft ? kapSpieler() : klassikLauf ? Object.keys(kapZuletzt).filter(k => KAP_FIG[k]).sort((a, c) => kapZuletzt[c] - kapZuletzt[a]).slice(0, 4).map(inst => ({ inst, weise: "" })) : [];
    const jetztDa = spieler.filter(p => kapZuletzt[p.inst] && jetzt - kapZuletzt[p.inst] < (p.weise === "glanz" || p.weise === "halte" ? 9000 : 5000)).map(p => p.inst);
    Object.keys(kapSeiteMerk).forEach(i => { if (!jetztDa.includes(i)) delete kapSeiteMerk[i]; });
    jetztDa.forEach(i => {
      if (!kapSeiteMerk[i]) { const n = s => da[s].length + jetztDa.filter(x => kapSeiteMerk[x] === s).length; kapSeiteMerk[i] = n("l") <= n("r") ? "l" : "r"; }
    });
    ["l", "r"].forEach(s => jetztDa.forEach(i => { if (kapSeiteMerk[i] === s) da[s].push("kap-" + i); }));
    Object.keys(KAP_FIG).forEach(id => {
      const el = b.querySelector('[data-gast-bild="kap-' + id + '"]'); if (!el) return;
      const seite = kapSeiteMerk[id], ist = !!seite;
      if (ist) {
        el.style.setProperty("--slot", da[seite].indexOf("kap-" + id));
        if (!el.classList.contains("seite-" + seite)) {
          /* die Seite wechseln, ohne quer über die Bühne zu fliegen */
          el.style.transition = "none"; el.classList.remove("da", "seite-l", "seite-r"); el.classList.add("seite-" + seite); void el.getBoundingClientRect(); el.style.transition = "";
        }
      }
      if (ist !== el.classList.contains("da")) {
        el.classList.toggle("da", ist);
        if (ist && !kapDa[id]) setTimeout(() => { const r = el.getBoundingClientRect(), br = b.getBoundingClientRect(); if (r.width && el.classList.contains("da")) schweben((KAP_FIG[id].geist ? "👻 " : "") + KAP_FIG[id].name + " · " + t().kapName[id], Math.max(12, Math.min(88, (r.left + r.width / 2 - br.left) / br.width * 100)), "blase gastname", 70); }, 500);
        kapDa[id] = ist;
      }
    });
  }
  function kapWippen(b, id) {
    if (ruhig) return;
    const el = b.querySelector('[data-gast-bild="kap-' + id + '"]'); if (!el || !el.classList.contains("da")) return;
    const k = el.querySelector(".gk"), q = sel => el.querySelector(sel), an = (e, f, d) => { if (e && e.animate) e.animate(f, { duration: d }); };
    const links = el.classList.contains("seite-l");
    an(k, [{ transform: "none" }, { transform: "translateY(-1.5px) rotate(" + (links ? 1.5 : -1.5) + "deg)", offset: .4 }, { transform: "none" }], 300);
    an(q(".stoecke"), [{ transform: "none" }, { transform: "translateY(5px)", offset: .35 }, { transform: "none" }], 180);
    an(q(".balg"), [{ transform: "scaleX(1)" }, { transform: "scaleX(.82)", offset: .5 }, { transform: "scaleX(1)" }], 520);
    an(q(".bogen"), [{ transform: "none" }, { transform: "translate(-6px, -1px)", offset: .5 }, { transform: "none" }], 420);
    an(q(".kurbel"), [{ transform: "rotate(0)" }, { transform: "rotate(360deg)" }], 600);
    an(q(".fluegel"), [{ transform: "scaleX(1)" }, { transform: "scaleX(.8)", offset: .5 }, { transform: "scaleX(1)" }], 300);
    an(q(".instr"), [{ filter: "brightness(1.5) drop-shadow(0 0 3px #ffe7a0)" }, { filter: "none" }], 380);
    an(q(".mund"), [{ transform: "scaleY(.5)" }, { transform: "scaleY(1.25)" }, { transform: "scaleY(1)" }], 600);
    if (Math.random() < .35) {
      const r = el.getBoundingClientRect(), br = b.getBoundingClientRect();
      if (r.width) schweben(id === "ooh" ? "～" : id === "taiko" ? "✦" : "♪", (r.left + r.width * (links ? .7 : .3) - br.left) / br.width * 100, "gast", 55);
    }
  }
  /* Kommen Gäste, rückt die Band zusammen und macht am Rand Platz: kleiner und zur freien Seite verschoben */
  let bandMerk = "", bandEl = null;
  const bandLage = { s: 1, x: 0 };
  function bandRuecken(b, nl, nr) {
    const W = b.clientWidth, H = b.clientHeight; if (!W || !H) return;
    /* Band und Gäste schrumpfen gemeinsam, bis alle nebeneinander passen – so bleiben die Größen stimmig */
    /* auf schmalen, hohen Bühnen (Handy quer) sind die Musiker nicht größer als die Band */
    const bandH = Math.min(H - 4, (W - 8) * 210 / 660), gs0 = Math.min(1, .66 * bandH / (.62 * H));
    const gw0 = H * .62 * gs0 * 90 / 140 / W, fig = Math.min(1, (H - 4) / 210 * 660 / W);
    let sk = 1, L = 0, R = 0, gw = gw0, schritt = gw0 * .72;
    for (let k = 0; k < 6; k++) {
      gw = gw0 * Math.min(1, sk); schritt = gw * .62;
      L = nl ? .015 + gw + (nl - 1) * schritt : 0; R = nr ? .015 + gw + (nr - 1) * schritt : 0;
      sk = Math.min(1, Math.max(.72, (1 - L - R) / fig));
    }
    /* viele Musiker: enger zusammenstehen statt in die Band hinein */
    const zwischen = Math.max(0, nl - 1) + Math.max(0, nr - 1), fest = (nl ? .015 + gw : 0) + (nr ? .015 + gw : 0), platz = 1 - fig * sk;
    if (zwischen && fest + zwischen * schritt > platz) {
      schritt = Math.max(gw * .42, (platz - fest) / zwischen);
      L = nl ? .015 + gw + (nl - 1) * schritt : 0; R = nr ? .015 + gw + (nr - 1) * schritt : 0;
    }
    const frei = 1 - L - R, x = (L + frei / 2 - .5) * 100;
    const unten = ((H - 4 - bandH) / 2 + bandH * .05) * sk;
    const merk = sk.toFixed(3) + "|" + x.toFixed(2) + "|" + (schritt * 100).toFixed(2) + "|" + unten.toFixed(0);
    if (merk === bandMerk && b === bandEl) return;
    bandMerk = merk; bandEl = b; bandLage.s = sk; bandLage.x = x;
    b.style.setProperty("--gast-s", (gs0 * Math.min(1, sk / Math.max(.6, fig) * fig + (1 - fig))).toFixed(3));
    b.style.setProperty("--band-s", sk.toFixed(3)); b.style.setProperty("--band-x", x.toFixed(2) + "%"); b.style.setProperty("--gs", (schritt * 100).toFixed(2) + "%"); b.style.setProperty("--gast-unten", unten.toFixed(1) + "px");
  }
  /* Ort auf der Bühne (in %) einer Bandfigur, wenn die Band gerade zusammengerückt ist */
  const bandOrt = p => 50 + (p - 50) * bandLage.s + bandLage.x;
  function gastWippen(b, id) {
    if (ruhig) return;
    const el = b.querySelector('[data-gast-bild="' + id + '"]'); if (!el || !el.classList.contains("da")) return;
    const g = GAST[id], k = el.querySelector(".gk"), ins = el.querySelector(".instr"), st = el.querySelector(".stoecke");
    if (k && k.animate) k.animate([{ transform: "none" }, { transform: g.rolle === "marsch" ? "translateY(1.5px)" : "translateY(-2px) rotate(" + (g.seite === "l" ? 2 : -2) + "deg)", offset: .4 }, { transform: "none" }], { duration: 260 });
    if (st && st.animate) st.animate([{ transform: "none" }, { transform: "translateY(6px)", offset: .35 }, { transform: "none" }], { duration: 180 });
    if (ins && ins.animate && g.rolle !== "marsch") ins.animate([{ filter: "brightness(1.6) drop-shadow(0 0 3px #ffe7a0)" }, { filter: "none" }], { duration: 350 });
    const m = el.querySelector(".mund"); if (m && m.animate) m.animate([{ transform: "scaleY(.5)" }, { transform: "scaleY(1.2)" }, { transform: "scaleY(1)" }], { duration: 600 });
    if (Math.random() < (g.rolle === "marsch" ? .15 : .45)) {
      const r = el.getBoundingClientRect(), br = b.getBoundingClientRect();
      if (r.width) schweben(g.rolle === "marsch" ? "✦" : g.rolle === "chor" ? "～" : "♪", (r.left + r.width * (g.seite === "l" ? .75 : .25) - br.left) / br.width * 100, "gast", 55);
    }
  }
  /* die Gäste-Reihe im Pult */
  /* die Gäste im Pult: eingeklappt nur ein Schalter für alle, aufgeklappt jeder Gast einzeln an oder aus */
  let gaesteAuf = false;
  const gaesteAn = () => !(S.gaeste && S.gaeste._aus);
  function gaesteZeile(T) {
    if (hoerer) return "";
    const an = gaesteAn();
    return '<div class="lw-gaeste-zeile' + (gaesteAuf ? " auf" : "") + '">' +
      '<button type="button" class="lw-schalter" data-aktion="gaeste" aria-pressed="' + an + '" title="' + esc(T.gaesteTipp) + '">🎭 ' + T.gaesteTitel + "</button>" +
      '<button type="button" class="lw-gz-auf" data-aktion="gaesteauf" aria-expanded="' + gaesteAuf + '" title="' + esc(T.gaesteEinzeln) + '">' + (gaesteAuf ? "▴" : "▾") + "</button>" + info("gaeste") +
      (gaesteAuf ? '<div class="lw-gz-liste' + (an ? "" : " aus") + '">' + GAESTE.map(g => { const ein = gastStufe(g.id) > 0;
        return '<button type="button" class="lw-gchip' + (ein ? " ein" : "") + (g.geist ? " geist" : "") + (gastDa[g.id] ? " spielt" : "") + '" data-gast="' + g.id + '" aria-pressed="' + ein + '" title="' + esc(T.gastInstr[g.id]) + '">' + g.sym + " " + g.name + "</button>"; }).join("") + "</div>" : "") + "</div>";
  }
  function gaesteNeu() { const z = root.querySelector(".lw-zweiklapp"); if (z) z.outerHTML = zweiKlapp(t()); else { const m = root.querySelector(".lw-mitspieler"); if (m) m.outerHTML = mitspielerZeile(t()); } }
  root.addEventListener("click", e => {
    if (e.target.closest('[data-aktion="gaeste"]')) { e.stopPropagation(); S.gaeste = Object.assign({}, S.gaeste || {}, { _aus: gaesteAn() ? 1 : 0 }); merken(); gaesteVorladen(); gaesteNeu(); return; }
    if (e.target.closest('[data-aktion="gaesteauf"]')) { e.stopPropagation(); gaesteAuf = !gaesteAuf; gaesteNeu(); return; }
    if (e.target.closest('[data-aktion="msauf"]')) { e.stopPropagation(); msAuf = !msAuf; gaesteNeu(); return; }
    const ms = e.target.closest("[data-mitspieler]");
    if (ms) { e.stopPropagation(); msSetzen(+ms.dataset.mitspieler); gaesteNeu(); return; }
    const c = e.target.closest("[data-gast]"); if (!c) return;
    e.stopPropagation();
    const id = c.dataset.gast;
    S.gaeste = Object.assign({}, S.gaeste || {}, { [id]: gastStufe(id) > 0 ? 0 : 1 });
    merken(); gaesteVorladen(); gaesteNeu();
  }, true);
  /* ---------- Pult-Helfer: Aufklappen, Wechselanzeige, mitwandernde Steuerleiste ---------- */
  root.addEventListener("click", e => {
    const ei = e.target.closest("[data-einst]");
    if (ei) { e.stopPropagation(); einstAuf[ei.dataset.einst] = !einstAuf[ei.dataset.einst]; boxNeu(ei.dataset.einst === "musik" || ei.dataset.einst === "mitspieler" ? "musik" : "klang"); return; }
    if (e.target.closest('[data-aktion="funkauf"]')) { e.stopPropagation(); funkAuf = !funkAuf; zeichnen(); knoepfe(); return; }
    /* ein Klick: Musik aus, leeres Notenblatt, komplette Ansicht – los geht’s mit dem eigenen Lied */
    if (e.target.closest('[data-aktion="komponieren"]')) {
      e.stopPropagation();
      /* nur nachfragen, wenn wirklich etwas verloren ginge: laufende Musik oder ein Lied mit Noten */
      const verlust = laeuft || TEILE.some(teilBenutzt);
      if (verlust && leerFrage < Date.now()) {
        leerFrage = Date.now() + 4000; zeichnen(); knoepfe();
        setTimeout(() => { if (leerFrage && leerFrage <= Date.now()) { leerFrage = 0; const b = root.querySelector(".lw-leerblatt.frage"); if (b) { zeichnen(); knoepfe(); } } }, 4100);
        return;
      }
      leerFrage = 0;
      if (laeuft) stopp();
      if (klassikLauf) klassikStopp(true);
      vorlageWaehlen("leer"); S.pult = false; S.titel = ""; merken(); zeichnen(); knoepfe();
      const r = root.querySelector(".lw-raster") || root; r.scrollIntoView({ block: "start", behavior: "smooth" });
      return;
    }
  }, true);
  let wechselStart = 0, ausklangStart = 0, wechselMerk = "";
  /* was als Nächstes kommt und wie weit es noch ist (0 … 1) */
  function wechselStand() {
    if (!ctx || !laeuft) return null;
    const j = ctx.currentTime, T = t();
    if (wechsel) return { text: "→ " + (wechsel.titel || T.eigenesLied), p: wechselAb ? (j - wechselStart) / Math.max(.2, wechselAb - wechselStart) : 0 };
    if (ausklangAb && !ausklingt) return { text: "→ " + T.ausklangKommt, p: ausklangAb > 0 ? (j - ausklangStart) / Math.max(.2, ausklangAb - ausklangStart) : 0 };
    return null;
  }
  function wechselAnzeige() {
    const w = wechselStand(), text = w ? w.text : "", p = w ? Math.max(0, Math.min(1, w.p)) : 0;
    const ziele = [root, leiste].filter(Boolean);
    if (text !== wechselMerk) {
      wechselMerk = text;
      ziele.forEach(z => z.querySelectorAll(".lw-titel-naechste, .ll-naechste").forEach(el => { el.textContent = text; }));
      ziele.forEach(z => z.querySelectorAll(".lw-pult-titel, .ll-titel").forEach(el => el.classList.toggle("wechselt", !!text)));
    }
    ziele.forEach(z => z.querySelectorAll(".lw-wechselbalken").forEach(el => { el.style.transform = "scaleX(" + p.toFixed(3) + ")"; }));
  }
  let leiste = null, leisteFrame = 0, leisteAuf = false;
  function intensitaetSetzen(w) {
    S.intensitaet = Math.max(0, Math.min(10, w));
    root.querySelectorAll(".lw-ival").forEach(x => { x.textContent = t().intStufen[S.intensitaet]; });
    const r = root.querySelector('[data-feld="intensitaet"]'); if (r) r.value = S.intensitaet;
    merken();
    if (S.stimmung && STIL[S.stimmung]) { if (laeuft) intensitaetNeu = true; else stimmungWeiter(); }
    leisteAktualisieren();
  }
  function leisteBauen() {
    if (leiste || hoerer || !document.body) return;
    leiste = document.createElement("div"); leiste.className = "lw-leiste"; leiste.hidden = true;
    leiste.innerHTML = '<button type="button" class="ll-play"></button><button type="button" class="ll-aus" title="">🎼</button>' +
      '<span class="ll-titel"><span class="ll-name"></span><span class="ll-naechste"></span><i class="lw-wechselbalken"></i></span>' +
      '<span class="ll-int"><button type="button" class="ll-minus" aria-label="−">−</button><b class="ll-wert"></b><button type="button" class="ll-plus" aria-label="+">+</button></span>' +
      '<button type="button" class="ll-einst" aria-expanded="false">⚙</button>' +
      '<div class="ll-panel" hidden>' +
        '<label class="lw-kleinregler"><span class="ll-pm"></span><input type="range" min="0" max="10" step="1" data-ll="master"><b class="ll-pmw"></b></label>' +
        '<label class="lw-kleinregler"><span class="ll-pk"></span><input type="range" min="0" max="10" step="1" data-ll="kulvol"><b class="ll-pkw"></b></label>' +
        '<div class="ll-knoepfe"><button type="button" class="lw-schalter ll-kul"></button><button type="button" class="lw-schalter ll-hin"></button></div>' +
      "</div>";
    document.body.appendChild(leiste);
    leiste.addEventListener("click", e => {
      if (e.target.closest(".ll-play")) { audioStart(); laeuft ? stopp(true) : start(true); try { knoepfe(); } catch (_) {} }
      else if (e.target.closest(".ll-aus")) { const b = root.querySelector(".lw-ausklang"); if (b) b.click(); }
      else if (e.target.closest(".ll-minus")) intensitaetSetzen(S.intensitaet - 1);
      else if (e.target.closest(".ll-plus")) intensitaetSetzen(S.intensitaet + 1);
      else if (e.target.closest(".ll-einst")) { leisteAuf = !leisteAuf; }
      else if (e.target.closest(".ll-kul")) {
        audioStart();
        if (kul) { kulMerk = S.kulisse; kulisseStop(); }
        else { if (S.kulisse === "keine" && kulMerk) S.kulisse = kulMerk; if (S.kulisse !== "keine") { merken(); kulisseStart(true); } }
        try { zeichnen(); knoepfe(); } catch (_) {}
      }
      else if (e.target.closest(".ll-hin")) {
        leisteAuf = false;
        if (!root.offsetParent && window.ImresAnsicht) { try { window.ImresAnsicht.merkeScroll(); history.pushState(null, "", "#lautenwerk"); window.ImresAnsicht.zeige(root); } catch (_) {} }
        requestAnimationFrame(() => root.scrollIntoView({ block: "start", behavior: "smooth" }));
      }
      leisteAktualisieren();
    });
    leiste.addEventListener("input", e => {
      const f = e.target.dataset && e.target.dataset.ll; if (!f) return;
      const v = +e.target.value;
      if (f === "master") { S.master = v; root.querySelectorAll(".lw-mval").forEach(x => x.textContent = v * 10 + " %"); }
      else { S.kulisseVol = v; root.querySelectorAll(".lw-kval").forEach(x => x.textContent = v * 10 + " %"); }
      root.querySelectorAll('[data-feld="' + f + '"]').forEach(r => { r.value = v; });
      merken(); effekteAnwenden(); leisteAktualisieren();
    });
    const pruefen2 = () => { leisteFrame = 0; leisteAktualisieren(); };
    window.addEventListener("scroll", () => { if (!leisteFrame) leisteFrame = requestAnimationFrame(pruefen2); }, { passive: true });
    window.addEventListener("resize", () => { if (!leisteFrame) leisteFrame = requestAnimationFrame(pruefen2); });
  }
  /* Die Leiste unten: im Pult und in der kompletten Ansicht, sobald die eigenen Knöpfe aus dem Bild sind –
     und überall sonst auf der Seite, sobald einmal Musik oder Kulisse lief. */
  function leisteAktualisieren() {
    if (!leiste) return;
    const T = t(), vh = window.innerHeight || 800;
    let zeigen = false;
    if (!hoerer) {
      const r = root.getBoundingClientRect(), imBild = r.top < vh && r.bottom > 0;
      const steuer = root.querySelector(S.pult ? ".lw-pult-kopf" : ".lw-steuer");
      if (imBild) {
        if (steuer) { const k = steuer.getBoundingClientRect(); zeigen = (k.bottom < 0 || k.top > vh) && r.bottom > 140; }
      } else zeigen = laeuft || pausiert || !!kul;
    }
    const vorher = !leiste.hidden;
    leiste.hidden = !zeigen;
    document.documentElement.classList.toggle("lw-leiste-da", zeigen);
    if (vorher !== zeigen) { try { miniAnzeigen(); } catch (_) {} }
    if (!zeigen) { leisteAuf = false; return; }
    const pn = leiste.querySelector(".ll-panel"), eb = leiste.querySelector(".ll-einst");
    pn.hidden = !leisteAuf; eb.setAttribute("aria-expanded", leisteAuf); eb.title = eb.ariaLabel = T.einstKurz;
    if (leisteAuf) {
      leiste.querySelector(".ll-pm").textContent = "🔊 " + T.master; leiste.querySelector(".ll-pk").textContent = "🌫 " + T.kulisseLaut;
      const m = leiste.querySelector('[data-ll="master"]'), k = leiste.querySelector('[data-ll="kulvol"]');
      if (document.activeElement !== m) m.value = S.master; if (document.activeElement !== k) k.value = S.kulisseVol;
      leiste.querySelector(".ll-pmw").textContent = S.master * 10 + " %"; leiste.querySelector(".ll-pkw").textContent = S.kulisseVol * 10 + " %";
      const kb = leiste.querySelector(".ll-kul"); kb.textContent = kul ? T.kulisseAn : T.kulisseAus; kb.setAttribute("aria-pressed", !!kul);
      kb.hidden = !kul && S.kulisse === "keine" && !kulMerk;
      leiste.querySelector(".ll-hin").textContent = T.zumLautenwerk;
    }
    const p = leiste.querySelector(".ll-play");
    p.textContent = laeuft ? "❚❚" : "▶"; p.classList.toggle("laeuft", laeuft); p.setAttribute("aria-label", laeuft ? T.miniPause : T.miniWeiter);
    const a = leiste.querySelector(".ll-aus"); a.hidden = !laeuft; a.disabled = ausklingt || !!ausklangAb; a.title = T.ausklangTipp;
    leiste.querySelector(".ll-name").textContent = S.titel || T.eigenesLied;
    const st = !!(S.stimmung && STIL[S.stimmung]);
    leiste.querySelector(".ll-int").hidden = !st;
    leiste.querySelector(".ll-wert").textContent = "🔥 " + T.intStufen[S.intensitaet];
  }
  /* ---------- Rundgang: eingeblendet, Schritt für Schritt, ohne die Seite zu verlassen ---------- */
  Object.assign(TX.de, { rundgang: "❔ Rundgang", rundgangTipp: "Kurzer Rundgang durch das Pult", weiter: "Weiter", zurueck: "Zurück", fertig: "Fertig", beenden: "Beenden",
    info: {
      intensitaet: "Wie viel los ist: links ruhig und sparsam, rechts dicht und wild. Die Änderung greift am nächsten Taktanfang.",
      gaeste: "Figuren aus eurer Geschichte spielen in passenden Stimmungen mit und bekommen im Zwischenteil ein Solo. Aufklappen, um einzelne an- oder abzuwählen.",
      mitspieler: "Band allein: nur Barradin, Friedrich, Echo, Ezekiel und Rex. Ein paar Mitspieler: dazu das Geister-Orchester, ein Musiker der Kapelle und die Gäste aus eurer Geschichte. Volle Big Band: die ganze Kapelle. Aufgeklappt lässt sich jede Gruppe einzeln an- und abschalten; die Gäste kommen nur in Stimmungen, die zu ihnen passen.",
      speichern: "Merkt sich die aktuelle Stimmung samt Intensität, Kulisse, Hall, Instrumenten und Gästen – als neue Stimmung (⭐) oder als eigene Fassung einer vorhandenen (✎).",
      musik: "Stimmungen komponieren endlos neue Lieder im passenden Charakter – mit Vorspiel, Strophe, einem Refrain zum Mitsummen, Zwischenteil und großem Schlussrefrain. Lieder sind fertige Stücke der Band und Cover alter Volksweisen, unter „Eigene“ liegen deine gespeicherten Lieder.",
      klang: "Kulissen sind Hintergrundgeräusche, die dauerhaft laufen. Effekte erklingen einmal auf Knopfdruck. Beide laufen über der Musik, die Lautstärke regelst du direkt über den Kacheln.",
      hall: "Raumhall für die Musik, die Kulissen, Cover und Klassiker – die Geräuscheffekte bleiben trocken. „Raum“ wählt die Art des Raums, Echo-Hall gilt nur für Echos Flöte."
    },
    schritte: [
      ["buehne", "🎭 Die Bühne", "Hier spielt die Band, was gerade läuft. Gäste aus eurer Geschichte kommen dazu, das Publikum reagiert, und Effekte sind auch zu sehen."],
      ["play", "▶ Start und Ausklang", "Startet und stoppt die Musik. „Ausklang“ beendet das Stück sauber mit einem Schlussakkord – schöner als einfach abzubrechen."],
      ["stimmungen", "🎵 Stimmungen", "Tippe auf eine Stimmung: Sie wechselt sanft am Taktende, der goldene Balken unter dem Titel zeigt, wann. Jede Stimmung erfindet laufend neue Melodien."],
      ["intensitaet", "🔥 Intensität", "Von leise bis wild – dieselbe Stimmung, mal zurückhaltend unter einem Gespräch, mal mitten im Getümmel."],
      ["punkt", "● Favoriten", "Der kleine Punkt an jeder Kachel heftet sie oben in ihrer Liste an. So hast du deine Lieblinge immer griffbereit."],
      ["tabs", "📜 Lieder und Eigene", "Fertige Lieder der Band, Cover alter Volksweisen und deine selbst gespeicherten Stücke."],
      ["kulisse", "🌧 Kulisse", "Hintergrundgeräusche wie Taverne, Regen oder Höhle laufen unter der Musik weiter. Der Regler darüber stellt ihre Lautstärke ein."],
      ["effekte", "💥 Effekte", "Einmalige Geräusche auf Knopfdruck: Drache, Schwert, Würfel, Kampf, lustige Momente und kurze Klassiker – zugeklappt, damit das Pult kurz bleibt; einmal antippen klappt sie auf."],
      ["mitspieler", "🎻 Mitspieler", "Wer außer der Band mitspielt: Band allein, ein paar Mitspieler oder die volle Big Band mit Geister-Orchester, Kapelle und Gästen. Aufklappen für die Feineinstellung, 🎲 holt eine neue Besetzung."],
      ["einst", "⚙ Klang & Raum", "Seltene Einstellungen liegen hier eingeklappt: Lautstärke der Musik, Hall, Raum und Sparmodus."],
      ["oben", "Oben rechts", "🌫 Klangwelten: reine Geräusche ohne Musik · 📡 Mitlauschen: Link für die Runde, alle hören mit · Die kleinen ⓘ erklären einzelne Regler."]
    ] });
  Object.assign(TX.en, { rundgang: "❔ Tour", rundgangTipp: "A short tour of the console", weiter: "Next", zurueck: "Back", fertig: "Done", beenden: "Close",
    info: {
      intensitaet: "How busy it gets: left is calm and sparse, right is dense and wild. Changes take effect at the next bar.",
      gaeste: "Characters from your story join in fitting moods and get a solo in the bridge. Expand to switch single guests on or off.",
      mitspieler: "Band alone: just Barradin, Friedrich, Echo, Ezekiel and Rex. A few players: plus the ghost orchestra, one street-band musician and the guests from your story. Full big band: the whole street band. Expanded, every group can be switched on or off; guests only join moods that suit them.",
      speichern: "Saves the current mood with intensity, backdrop, reverb, instruments and guests – as a new mood (⭐) or as your own version of an existing one (✎).",
      musik: "Moods keep composing new songs in their character – with intro, verse, a chorus to hum along, bridge and a big final chorus. Songs are finished pieces by the band and covers of old folk tunes; “Own” holds your saved songs.",
      klang: "Backdrops are background sounds that keep running. Effects play once per tap. Both play over the music; set their volume right above the tiles.",
      hall: "Room reverb for music, backdrops, covers and classics – sound effects stay dry. “Room” picks the kind of space, echo reverb only applies to Echo's flute."
    },
    schritte: [
      ["buehne", "🎭 The stage", "The band plays whatever is running. Guests from your story join in, the audience reacts, and effects show up too."],
      ["play", "▶ Start and fade-out", "Starts and stops the music. “Fade-out” ends the piece cleanly with a final chord – nicer than just cutting off."],
      ["stimmungen", "🎵 Moods", "Tap a mood: it changes smoothly at the end of the bar, the golden bar below the title shows when. Every mood keeps inventing new melodies."],
      ["intensitaet", "🔥 Intensity", "From quiet to wild – the same mood, sometimes reserved under a conversation, sometimes right in the thick of battle."],
      ["punkt", "● Favourites", "The small dot on every tile pins it to the top of its list, so your favourites are always at hand."],
      ["tabs", "📜 Songs and own", "Finished songs by the band, covers of old folk tunes and the pieces you saved yourself."],
      ["kulisse", "🌧 Backdrop", "Background sounds like tavern, rain or cave keep running under the music. The slider above sets their volume."],
      ["effekte", "💥 Effects", "One-off sounds at a tap: dragon, sword, dice, combat, funny moments and short classics – folded away to keep the desk short; tap once to unfold."],
      ["mitspieler", "🎻 Players", "Who joins the band: band alone, a few players or the full big band with ghost orchestra, street band and guests. Expand for details, 🎲 brings a new line-up."],
      ["einst", "⚙ Sound & room", "Rarely used settings are folded away here: music volume, reverb, room and power saving."],
      ["oben", "Top right", "🌫 Soundscapes: pure ambience without music · 📡 Listen in: a link for the group · The small ⓘ explain single controls."]
    ] });
  const RUNDGANG_ZIEL = {
    buehne: () => root.querySelector(".lw-buehne"), play: () => root.querySelector(".lw-pult-kopf .lw-play"),
    stimmungen: () => root.querySelector(".lw-musik .lw-pult-gitter"), intensitaet: () => root.querySelector(".lw-intensitaet"),
    punkt: () => root.querySelector(".lw-musik .lw-pult-gitter button"), tabs: () => root.querySelector(".lw-musik .lw-tabs"),
    kulisse: () => root.querySelector(".lw-klang .lw-kul-gitter"), effekte: () => root.querySelector(".lw-klang .lw-pult-fx") || root.querySelector('.lw-klang [data-klangauf="fx"]'),
    einst: () => root.querySelector('.lw-musik [data-einst="musik"]'), mitspieler: () => root.querySelector('[data-einst="mitspieler"]'), oben: () => root.querySelector(".lw-kopf-rechts")
  };
  let rundgang = null;
  function rundgangStart() {
    if (!S.pult) { S.pult = true; merken(); zeichnen(); knoepfe(); }
    if (musikTab !== "stimmungen") { musikTab = "stimmungen"; boxNeu("musik"); }
    try { localStorage.setItem("imres-lw-rundgang", "1"); } catch (_) {}
    root.querySelectorAll('[data-aktion="rundgang"]').forEach(b => b.classList.remove("neu"));
    const el = document.createElement("div"); el.className = "lw-tour"; el.setAttribute("role", "dialog"); el.setAttribute("aria-modal", "true");
    el.innerHTML = '<div class="lw-tour-loch"></div><div class="lw-tour-blase" tabindex="-1"></div>';
    document.body.appendChild(el);
    rundgang = { el, i: 0, nach: () => rundgangLage() };
    window.addEventListener("scroll", rundgang.nach, { passive: true }); window.addEventListener("resize", rundgang.nach);
    rundgangSchritt(0);
  }
  function rundgangEnde() {
    if (!rundgang) return;
    window.removeEventListener("scroll", rundgang.nach); window.removeEventListener("resize", rundgang.nach);
    rundgang.el.remove(); rundgang = null;
    const b = root.querySelector('[data-aktion="rundgang"]'); if (b) b.focus();
  }
  function rundgangSchritt(i) {
    const T = t(), L = T.schritte;
    if (i < 0 || i >= L.length) { rundgangEnde(); return; }
    rundgang.i = i;
    const [k, titel, text] = L[i], ziel = RUNDGANG_ZIEL[k] && RUNDGANG_ZIEL[k]();
    rundgang.ziel = ziel;
    const bl = rundgang.el.querySelector(".lw-tour-blase");
    bl.innerHTML = '<p class="lw-tour-nr">' + (i + 1) + " / " + L.length + '</p><h4>' + titel + "</h4><p>" + text + '</p><div class="lw-tour-knoepfe">' +
      '<button type="button" class="lw-klein" data-tour="ende">' + T.beenden + "</button><span></span>" +
      (i > 0 ? '<button type="button" class="lw-klein" data-tour="zurueck">' + T.zurueck + "</button>" : "") +
      '<button type="button" class="lw-tour-weiter" data-tour="weiter">' + (i === L.length - 1 ? T.fertig : T.weiter) + "</button></div>";
    if (ziel) ziel.scrollIntoView({ block: "center", behavior: ruhig ? "auto" : "smooth" });
    rundgangLage(); setTimeout(rundgangLage, 380); setTimeout(rundgangLage, 800);
    bl.focus({ preventScroll: true });
  }
  function rundgangLage() {
    if (!rundgang) return;
    const loch = rundgang.el.querySelector(".lw-tour-loch"), bl = rundgang.el.querySelector(".lw-tour-blase"), z = rundgang.ziel;
    const vw = window.innerWidth, vh = window.innerHeight;
    if (!z) { loch.style.cssText = "left:50%;top:50%;width:0;height:0"; bl.style.left = Math.max(12, (vw - bl.offsetWidth) / 2) + "px"; bl.style.top = Math.max(12, (vh - bl.offsetHeight) / 2) + "px"; return; }
    const r = z.getBoundingClientRect(), p = 8;
    loch.style.cssText = "left:" + (r.left - p) + "px;top:" + (r.top - p) + "px;width:" + (r.width + 2 * p) + "px;height:" + (r.height + 2 * p) + "px";
    const bw = bl.offsetWidth, bh = bl.offsetHeight;
    let top = r.bottom + p + 12;
    if (top + bh > vh - 10) top = r.top - p - 12 - bh;
    if (top < 10) top = Math.min(vh - bh - 10, Math.max(10, r.top + 20));
    bl.style.top = top + "px";
    bl.style.left = Math.max(10, Math.min(vw - bw - 10, r.left + r.width / 2 - bw / 2)) + "px";
  }
  document.addEventListener("click", e => {
    if (!rundgang) return;
    const b = e.target.closest("[data-tour]");
    if (b) { const a = b.dataset.tour; if (a === "ende") rundgangEnde(); else rundgangSchritt(rundgang.i + (a === "weiter" ? 1 : -1)); return; }
    if (e.target.closest(".lw-tour")) { e.stopPropagation(); e.preventDefault(); }
  }, true);
  document.addEventListener("keydown", e => {
    if (!rundgang) return;
    if (e.key === "Escape") rundgangEnde();
    else if (e.key === "ArrowRight" || e.key === "Enter") { e.preventDefault(); rundgangSchritt(rundgang.i + 1); }
    else if (e.key === "ArrowLeft") { e.preventDefault(); rundgangSchritt(rundgang.i - 1); }
  });
  root.addEventListener("click", e => { if (e.target.closest('[data-aktion="rundgang"]')) { e.stopPropagation(); rundgangStart(); } }, true);
  const rundgangNeu = () => { try { return !localStorage.getItem("imres-lw-rundgang"); } catch (_) { return false; } };

  /* ---------- ⓘ: kleine Erklärungen zum Antippen ---------- */
  const info = k => '<button type="button" class="lw-info" data-info="' + k + '" aria-label="Info" aria-expanded="false">ⓘ</button>';
  let infoBlase = null;
  function infoZu() { if (infoBlase) { infoBlase.remove(); infoBlase = null; root.querySelectorAll(".lw-info[aria-expanded=true]").forEach(b => b.setAttribute("aria-expanded", "false")); } }
  document.addEventListener("click", e => {
    const b = e.target.closest(".lw-info");
    if (!b) { if (infoBlase && !e.target.closest(".lw-info-blase")) infoZu(); return; }
    e.preventDefault(); e.stopPropagation();
    const offen = infoBlase && infoBlase.dataset.k === b.dataset.info; infoZu(); if (offen) return;
    infoBlase = document.createElement("div"); infoBlase.className = "lw-info-blase"; infoBlase.dataset.k = b.dataset.info; infoBlase.setAttribute("role", "note");
    infoBlase.textContent = t().info[b.dataset.info] || "";
    document.body.appendChild(infoBlase); b.setAttribute("aria-expanded", "true");
    const r = b.getBoundingClientRect(), w = infoBlase.offsetWidth, h = infoBlase.offsetHeight;
    let top = r.bottom + 8 + scrollY; if (r.bottom + 8 + h > innerHeight - 10) top = r.top - 8 - h + scrollY;
    infoBlase.style.top = top + "px"; infoBlase.style.left = Math.max(10, Math.min(innerWidth - w - 10, r.left + r.width / 2 - w / 2)) + scrollX + "px";
  }, true);
  document.addEventListener("keydown", e => { if (e.key === "Escape") infoZu(); });
  window.addEventListener("scroll", () => { if (infoBlase) infoZu(); }, { passive: true });
  /* ---------- Favoriten: ein kleiner Punkt an jeder Kachel heftet sie oben in ihrer eigenen Liste an ---------- */
  Object.assign(TX.de, { favAn: "Oben anheften", favAus: "Nicht mehr anheften" });
  Object.assign(TX.en, { favAn: "Pin to top", favAus: "Unpin" });
  let favs = (() => { try { const x = JSON.parse(localStorage.getItem("imres-lw-favs")); if (Array.isArray(x)) return x.filter(f => typeof f === "string").slice(0, 80); } catch (_) {} return []; })();
  function favsMerken() { try { localStorage.setItem("imres-lw-favs", JSON.stringify(favs)); } catch (_) {} }
  const FAV_Q = { "data-vorlage": "v", "data-sfx": "s", "data-kulisse": "k" };
  /* angeheftete zuerst (in der Reihenfolge des Anheftens), danach der Rest wie gewohnt */
  function oben(q, liste) {
    const rang = k => { const i = favs.indexOf(q + ":" + k); return i < 0 ? 1e4 : i; };
    return liste.map((k, i) => [k, i]).sort((x, y) => rang(x[0]) - rang(y[0]) || x[1] - y[1]).map(x => x[0]);
  }
  /* der Punkt in der Ecke: ein eigener Tippbereich innerhalb der Kachel */
  function favPunkt(attr, wert) {
    const q = FAV_Q[attr]; if (!q || hoerer || wert === "zufall" || wert === "leer") return "";
    const an = favs.includes(q + ":" + wert), T = t();
    return '<span class="lw-pin' + (an ? " an" : "") + '" data-pin="' + esc(q + ":" + wert) + '" role="button" aria-pressed="' + an + '" title="' + esc(an ? T.favAus : T.favAn) + '" aria-label="' + esc(an ? T.favAus : T.favAn) + '"></span>';
  }
  function favMarkieren() {}
  root.addEventListener("click", e => {
    const p = e.target.closest("[data-pin]"); if (!p) return;
    e.stopPropagation(); e.preventDefault();
    const f = p.dataset.pin;
    favs = favs.includes(f) ? favs.filter(x => x !== f) : favs.concat([f]); favsMerken();
    boxNeu(f[0] === "v" ? "musik" : f[0] === "k" || f[0] === "s" && !COVER_LISTE.includes(f.slice(2)) ? "klang" : "musik");
  }, true);

  /* ---------- Oberfläche ---------- */
  function zeilenName(spur, z) {
    if (spur === "rex") return t().rexZeilen[z];
    return notenName(tonMidi(spur, z, S));
  }
  function rasterZeile(spur, zeile, beschriftung, klasse) {
    const daten = S.teile[bearbeite][spur];
    let html = '<div class="lw-name ' + (klasse || "") + '">' + beschriftung + "</div>";
    const [von, bis] = rasterFenster();
    for (let i = von; i < bis; i++) { /* Dreivierteltakt: nur 12 Spalten – die übrigen würden nie erklingen */
      const istAn = SPUR[spur].art === "an" ? daten[i] >= 0 : daten[i] === zeile;
      html += '<button type="button" class="lw-zelle s-' + spur + (S.mute[spur] ? " stumm" : "") + (i % 4 === 0 ? " takt" : "") + (istAn ? " an" : "") +
        '" data-spur="' + spur + '" data-zeile="' + zeile + '" data-s="' + i + '" aria-pressed="' + istAn + '"></button>';
    }
    return html;
  }
  const raumWahl = T => '<label class="lw-feld"><span>' + T.raum + '</span><select data-feld="raum">' + Object.keys(RAEUME).map(r => '<option value="' + r + '"' + (r === S.raum ? " selected" : "") + ">" + T.raeume[r] + "</option>").join("") + "</select></label>";
  const kulisseWahl = T => '<select class="lw-gespeichert" data-feld="kulisse" aria-label="' + esc(T.kulisse) + '">' + KULISSEN.map(k => '<option value="' + k + '"' + (k === S.kulisse ? " selected" : "") + ">" + T.kulissen[k] + "</option>").join("") + "</select>" +
    '<button type="button" class="lw-schalter" data-aktion="kulisse" aria-pressed="' + !!kul + '">' + (kul ? T.kulisseAn : T.kulisseAus) + "</button>";
  const sparKnopf = T => '<button type="button" class="lw-schalter lw-spar" data-aktion="spar" aria-pressed="' + spar + '" title="' + esc(T.sparTipp) + '">' + T.spar + "</button>";
  const mixRegler = T =>
    '<label class="lw-feld lw-regler lw-master"><span>🔊 ' + T.master + ' <b class="lw-mval">' + S.master * 10 + ' %</b></span><input type="range" min="0" max="10" step="1" value="' + S.master + '" data-feld="master"></label>' +
    '<label class="lw-feld lw-regler lw-hallregler"><span>🏛 ' + T.hall + ' <b class="lw-hval">' + S.hall * 10 + ' %</b> ' + info("hall") + '</span><input type="range" min="0" max="10" step="1" value="' + S.hall + '" data-feld="hall"></label>' +
    '<label class="lw-feld lw-regler lw-echohall"><span>🌫 ' + T.echoHall + ' <b class="lw-eval">' + S.echoHall * 10 + ' %</b></span><input type="range" min="0" max="10" step="1" value="' + S.echoHall + '" data-feld="echohall"></label>' +
    raumWahl(T) + '<button type="button" class="lw-schalter lw-kick" data-aktion="kick" aria-pressed="' + (S.kick !== 0) + '" title="' + esc(T.kickTipp) + '">🥁 ' + T.kick + ": " + T.kickStufe[S.kick] + "</button>" + sparKnopf(T);
  const fxRegler = T => '<label class="lw-feld lw-regler lw-fxregler"><span>💥 ' + T.fxLaut + ' <b class="lw-fval">' + S.fxVol * 10 + ' %</b></span><input type="range" min="0" max="10" step="1" value="' + S.fxVol + '" data-feld="fxvol"></label>';
  const intRegler = T => '<label class="lw-feld lw-regler lw-intensitaet"><span>🔥 ' + T.intensitaet + ' <b class="lw-ival">' + T.intStufen[S.intensitaet] + '</b> ' + info("intensitaet") + '</span><input type="range" min="0" max="10" step="1" value="' + S.intensitaet + '" data-feld="intensitaet"></label>';
  /* schmaler Regler direkt über seinen Kacheln – für das, was am Tisch oft nachgeregelt wird */
  const kleinRegler = (sym, text, feld, wert, klasse) => '<label class="lw-kleinregler"><span>' + sym + " " + text + '</span><input type="range" min="0" max="10" step="1" value="' + wert + '" data-feld="' + feld + '"><b class="' + klasse + '">' + wert * 10 + " %</b></label>";
  Object.assign(TX.de, { kulisseKurz: "Kulisse", effekteKurz: "Effekte", einstKurz: "Lautstärke und Kulisse", zumLautenwerk: "↑ Zum Lautenwerk" });
  Object.assign(TX.en, { kulisseKurz: "Backdrop", effekteKurz: "Effects", einstKurz: "Volume and backdrop", zumLautenwerk: "↑ To the Lautenwerk" });
  /* selten gebrauchte Regler: eingeklappt, bis man sie braucht */
  const einstAuf = { musik: false, klang: false, mitspieler: false };
  /* Mitspieler und Klang & Raum: zwei Knöpfe nebeneinander, beide standardmäßig zugeklappt; aufgeklappt erscheint das Feld darunter */
  function zweiKlapp(T) {
    const st = msStufe(), mk = einstAuf.mitspieler, kk = einstAuf.musik;
    const knopf = (k, auf, txt, sub) => '<button type="button" class="lw-einst-kopf lw-zk-knopf' + (auf ? " auf" : "") + '" data-einst="' + k + '" aria-expanded="' + auf + '"><span class="lw-zk-titel">' + txt + ' <span>' + (auf ? "▴" : "▾") + '</span></span>' + (sub ? '<small>' + esc(sub) + "</small>" : "") + "</button>";
    return '<div class="lw-einst lw-zweiklapp' + (mk || kk ? " auf" : "") + '"><div class="lw-zk-reihe">' +
      knopf("mitspieler", mk, T.mitspieler, st >= 0 ? T.msStufe[st] : T.msEigen) +
      knopf("musik", kk, "⚙ " + T.einstMusik, T.hall + " " + S.hall * 10 + " %") + "</div>" +
      (mk ? mitspielerZeile(T) : "") + (kk ? '<div class="lw-stimm-mix">' + mixRegler(T) + "</div>" : "") + "</div>";
  }
  const einklapp = (k, titel, inhalt) => '<div class="lw-einst' + (einstAuf[k] ? " auf" : "") + '"><button type="button" class="lw-einst-kopf" data-einst="' + k + '" aria-expanded="' + einstAuf[k] + '">⚙ ' + titel + ' <span>' + (einstAuf[k] ? "▴" : "▾") + "</span></button>" + (einstAuf[k] ? inhalt : "") + "</div>";
  Object.assign(TX.de, { komponieren: "✍ Leeres Notenblatt", komponierenTipp: "Neues Lied von Grund auf – öffnet ein leeres Notenblatt in der kompletten Ansicht",
    werkTitel: "Selbst gestalten", komplettUnter: "Alle Spuren, Noten und Regler – zum Feinschliff und Komponieren",
    leerUnter: "Ein neues Lied von Grund auf schreiben", leerSicher: an => "Nochmal tippen zum Bestätigen – das aktuelle Lied wird geleert" + (an ? " und die Musik stoppt." : "."),
    zumPult: "Zurück zum Spielleiter-Pult" });
  Object.assign(TX.en, { komponieren: "✍ Empty sheet", komponierenTipp: "Start a song from scratch – opens an empty sheet in the full view",
    werkTitel: "Make your own", komplettUnter: "All tracks, notes and controls – for fine-tuning and composing",
    leerUnter: "Write a new song from scratch", leerSicher: an => "Tap again to confirm – the current song will be cleared" + (an ? " and the music stops." : "."),
    zumPult: "Back to the GM console" });
  /* Werkstatt: große, abgesetzte Schalter für die komplette Ansicht und das leere Notenblatt */
  let leerFrage = 0;
  const grossKnopf = (aktion, icon, titel, unter, extra) => '<button type="button" class="lw-werkknopf' + (extra || "") + '" data-aktion="' + aktion + '"><span class="lw-pb-icon">' + icon + "</span><span><b>" + titel + "</b><small>" + unter + "</small></span></button>";
  const werkstatt = (T, imPult) => '<section class="lw-werkstatt"><h4>🛠 ' + T.werkTitel + '</h4><div class="lw-werkknoepfe">' +
    (imPult ? grossKnopf("pult", "🎼", T.komplett.replace(/^\S+\s/, ""), T.komplettUnter) : "") +
    grossKnopf("komponieren", "✍", T.komponieren.replace(/^\S+\s/, ""), leerFrage > Date.now() ? T.leerSicher(laeuft) : T.leerUnter, " lw-leerblatt" + (leerFrage > Date.now() ? " frage" : "")) +
    "</div></section>";
  Object.assign(TX.de, { klangwelten: "🌫 Klangwelten", klangweltenTipp: "Reine Geräuschkulissen aus echten Aufnahmen – ohne Musik" });
  Object.assign(TX.en, { klangwelten: "🌫 Soundscapes", klangweltenTipp: "Pure ambience from real recordings – no music" });
  Object.assign(TX.de, { einstMusik: "Klang & Raum", einstKlang: "Lautstärke Kulisse & Effekte", wechselZu: "wechselt zu", ausklangKommt: "Ausklang", leisePlus: "Intensität", funkKurz: "Mitlauschen" });
  Object.assign(TX.en, { einstMusik: "Sound & room", einstKlang: "Backdrop & effects volume", wechselZu: "switching to", ausklangKommt: "Fade-out", leisePlus: "Intensity", funkKurz: "Listen in" });
  /* ---------- Gemeinsame Bedienfelder für Pult und komplette Ansicht ---------- */
  let musikTab = "stimmungen", fxTab = "effekte";
  try { musikTab = localStorage.getItem("imres-lw-musiktab") || "stimmungen"; fxTab = localStorage.getItem("imres-lw-fxtab") || "effekte"; } catch (_) {}
  const kachelText = text => { const m = /^([^\p{L}\p{N}\s–&<]+)\s+([\s\S]+)$/u.exec(text); return m ? '<span class="ki">' + m[1] + '</span><span class="kt">' + m[2] + "</span>" : '<span class="kt">' + text + "</span>"; };
  const kachel = (attr, wert, text, an) => '<button type="button" ' + attr + '="' + esc(wert) + '"' + (an ? ' class="an"' : "") + ">" + kachelText(text) + favPunkt(attr, wert) + "</button>";
  const reiter = (art, liste, aktiv, T) => '<div class="lw-tabs" role="tablist">' + liste.map(([k, txt]) =>
    '<button type="button" role="tab" data-' + art + '="' + k + '" aria-selected="' + (k === aktiv) + '">' + txt + "</button>").join("") + "</div>";
  function stimmSpeicherZeile(T) {
    if (hoerer || !S.stimmung || !STIL[S.stimmung]) return "";
    const aktiv = S.eigeneStimmung || S.stimmung, name = stimmName(aktiv) || S.titel || "";
    if (!stimmForm) return '<div class="lw-eigene-zeile"><button type="button" class="lw-klein" data-aktion="stimmspeichern" title="' + esc(T.stimmTipp) + '">' + T.stimmSpeichern + "</button>" + info("speichern") + "</div>";
    const eigen = aktiv.startsWith("e_"), ueberschrieben = !eigen && eigeneStimmungen[aktiv];
    return '<div class="lw-eigene-zeile"><span class="lw-speicherform"><input type="text" maxlength="40" class="lw-stimmname" placeholder="' + esc(T.stimmNamePlatz) + '" value="' + esc(stimmForm.name) + '">' +
      '<button type="button" data-aktion="stimmneu">' + T.stimmNeu + "</button>" +
      '<button type="button" data-aktion="stimmueber">' + T.stimmUeber(name) + "</button>" +
      (ueberschrieben ? '<button type="button" data-aktion="stimmzurueck">' + T.stimmZurueck + "</button>" : "") +
      (eigen ? '<button type="button" data-aktion="stimmloeschen">' + T.loeschen + "</button>" : "") +
      '<button type="button" data-aktion="stimmabbrechen">' + T.abbrechen + "</button></span>" +
      '<p class="lw-tipp">' + T.stimmTipp + "</p></div>";
  }
  /* von den Stimmungen zuerst zwölf (Favoriten und die laufende vorn), der Rest aufklappbar */
  const ST_KURZ = 12; let mehrSt = 0;
  function musikBox(T, voll) {
    let kacheln;
    if (musikTab === "lieder") kacheln = ['<p class="lw-trenner">' + T.vorlagenTitel + "</p>"].concat(oben("v", LIEDER).map(k => kachel("data-vorlage", k, T.vorlagen[k], !S.stimmung && S.titel === T.vorlagen[k].replace(/^[^\wÄÖÜäöü]+/, ""))),
        voll ? [kachel("data-vorlage", "zufall", T.zufall)] : [],
        ['<p class="lw-trenner">' + T.coverTitel + "</p>"], oben("s", COVER_LISTE).map(k => kachel("data-sfx", k, T.sfx[k]))).join("");
    else if (musikTab === "eigene") {
      const alle = gruppenLieder.map(l => ["g", l]).concat(lokaleLieder.map(l => ["l", l]));
      kacheln = alle.length ? alle.map(([q, l]) => kachel("data-eigen", q + ":" + l.id, (q === "g" ? "👥 " : "📱 ") + esc(l.name), geladen && geladen.quelle === q && String(geladen.id) === String(l.id))).join("")
        : '<p class="lw-tipp lw-leer">' + T.keineEigenen + "</p>";
    } else {
      let st = oben("v", STIMMUNGEN.concat(Object.keys(eigeneStimmungen).filter(id => id.startsWith("e_") && STIL[eigeneStimmungen[id].basis])));
      const jetzt = S.eigeneStimmung || S.stimmung;
      if (!klangAuf.st && st.length > ST_KURZ) { const kurz = st.slice(0, ST_KURZ); if (jetzt && st.includes(jetzt) && !kurz.includes(jetzt)) kurz[ST_KURZ - 1] = jetzt; mehrSt = st.length; st = kurz; } else mehrSt = st.length > ST_KURZ ? st.length : 0;
      kacheln = st.map(k => k.startsWith("e_")
      ? kachel("data-vorlage", k, "⭐ " + esc(eigeneStimmungen[k].name), S.eigeneStimmung === k)
      : kachel("data-vorlage", k, eigeneStimmungen[k] ? esc((T.vorlagen[k].match(/^[^\wÄÖÜäöü]+/) || [""])[0] + stimmName(k)) + " ✎" : T.vorlagen[k], S.stimmung === k && (!S.eigeneStimmung || S.eigeneStimmung === k))).join("");
    }
    return '<section class="lw-box lw-musik"><div class="lw-box-kopf"><h4>🎵 ' + T.musik + " " + info("musik") + "</h4>" +
        reiter("musiktab", [["stimmungen", T.tabStimmungen], ["lieder", T.tabLieder], ["eigene", T.tabEigene]], musikTab, T) + "</div>" +
      '<div class="lw-pult-gitter">' + kacheln + "</div>" +
      (musikTab === "stimmungen" && mehrSt ? '<button type="button" class="lw-klappe" data-klangauf="st" aria-expanded="' + !!klangAuf.st + '">' + (klangAuf.st ? T.stWeniger : T.stAlle(mehrSt)) + " <span>" + (klangAuf.st ? "▴" : "▾") + "</span></button>" : "") +
      (voll && musikTab === "eigene" ? '<div class="lw-eigene-zeile">' + '<button type="button" class="lw-klein" data-aktion="speichern">' + T.speichern + "</button>" +
        (geladen ? '<button type="button" class="lw-klein" data-aktion="loeschen">' + T.loeschen + "</button>" : "") +
        (gruppeOk && pwLesen() ? '<button type="button" class="lw-klein" data-aktion="abmelden" title="' + esc(T.abmeldenTipp) + '">' + T.abmelden + "</button>" : "") +
        (speicherForm ? '<span class="lw-speicherform"><input type="text" maxlength="60" class="lw-liedname" placeholder="' + esc(T.liedName) + '" value="' + esc(speicherForm.name) + '">' +
          (gruppeOk ? '<button type="button" data-aktion="fueralle">' + T.fuerAlle + "</button>" : "") +
          '<button type="button" data-aktion="nurhier">' + T.nurHier + '</button><button type="button" data-aktion="abbrechen">' + T.abbrechen + "</button></span>" : "") + "</div>" : "") +
      (musikTab === "stimmungen" ? intRegler(T) + stimmSpeicherZeile(T) + zweiKlapp(T) : einklapp("musik", T.einstMusik, '<div class="lw-stimm-mix">' + mixRegler(T) + "</div>")) + "</section>";
  }
  /* Kulissen und Effekte nehmen am Handy viel Platz: von den Kulissen zuerst nur neun (Favoriten und die laufende vorn),
     die Effekte und Momente sind zugeklappt, bis man sie braucht – das merkt sich die Seite */
  let klangAuf = { kul: false, fx: false };
  try { klangAuf = Object.assign(klangAuf, JSON.parse(localStorage.getItem("imres-lw-klangauf") || "{}") || {}); } catch (_) {}
  const KUL_KURZ = 9;
  function klangBox(T) {
    const liste = fxTab === "kampf" ? KAMPF_FX : fxTab === "momente" ? MOMENTE : fxTab === "klassik" ? KLASSIKER : EFFEKTE;
    let kul = oben("k", KULISSEN);
    if (!klangAuf.kul) { const kurz = kul.slice(0, KUL_KURZ); if (!kurz.includes(S.kulisse)) kurz[KUL_KURZ - 1] = S.kulisse; kul = kurz; }
    const klappe = (k, auf, text) => '<button type="button" class="lw-klappe" data-klangauf="' + k + '" aria-expanded="' + auf + '">' + text + " <span>" + (auf ? "▴" : "▾") + "</span></button>";
    return '<section class="lw-box lw-klang"><div class="lw-box-kopf"><h4>🔊 ' + T.klang + " " + info("klang") + "</h4></div>" +
      kleinRegler("🌧", T.kulisseKurz, "kulvol", S.kulisseVol, "lw-kval") +
      '<div class="lw-pult-gitter lw-kul-gitter">' + kul.map(k => kachel("data-kulisse", k, T.kulissen[k], S.kulisse === k)).join("") + "</div>" +
      klappe("kul", klangAuf.kul, klangAuf.kul ? T.kulWeniger : T.kulAlle(KULISSEN.length - 1)) +
      klappe("fx", klangAuf.fx, T.fxKlappe) +
      (klangAuf.fx ? reiter("fxtab", [["effekte", T.tabEffekte], ["kampf", T.tabKampf], ["momente", T.tabMomente], ["klassik", T.tabKlassik]], fxTab, T) +
        kleinRegler("💥", T.effekteKurz, "fxvol", S.fxVol, "lw-fval") +
        '<div class="lw-pult-gitter lw-pult-fx">' + oben("s", liste).map(f => kachel("data-sfx", f, T.sfx[f])).join("") + "</div>" : "") +
"</section>";
  }
  const konsole = (T, voll) => '<div class="lw-konsole">' + musikBox(T, voll) + klangBox(T) + "</div>";
  function boxNeu(welche) {
    const T = t(), alt = root.querySelector(welche === "musik" ? ".lw-musik" : ".lw-klang");
    if (alt) alt.outerHTML = welche === "musik" ? musikBox(T, !S.pult && !hoerer) : klangBox(T);
    klassikKnoepfe();
  }
  function eigenLaden(wert) {
    const [q, id] = String(wert).split(":"), l = (q === "g" ? gruppenLieder : lokaleLieder).find(x => String(x.id) === id);
    const d = l && dekodieren(l.code);
    if (!d) return;
    ["vol", "mute", "master", "hall", "hallAus", "raum", "kulisse", "kulisseVol", "pult", "fxVol", "intensitaet", "echoHall", "orchester", "kapelle", "kapStufe", "kick", "gaeste"].forEach(k => { d[k] = S[k]; });
    d.stimmung = null; d.titel = l.name; geladen = { quelle: q, id: l.id, name: l.name }; bearbeite = "A";
    if (laeuft) { wechsel = d; const a = S; S = d; try { saitenVorbereiten(); } catch (_) {} S = a; status(t().wechselGleich(l.name)); boxNeu("musik"); return; }
    S = d; pausiert = false; merken(); neuGezeichnet(); saitenVorbereiten(); status(t().liedGeladen(l.name));
  }
  function pultZeichnen(T) {
    root.innerHTML =
      '<p class="label">' + T.label + "</p><h3>" + T.titel + '</h3><p class="tav-info">' + T.pultTipp + "</p>" +
      buehneHTML(true) +
      '<div class="lw-pult">' +
        '<div class="lw-pult-kopf"><button type="button" class="lw-play lw-play-gross">' + (laeuft ? T.stopp : T.spielen) + "</button>" +
          '<button type="button" class="lw-ausklang" data-aktion="ausklang" title="' + esc(T.ausklangTipp) + '"' + (laeuft ? "" : " hidden") + ">" + T.ausklang + "</button>" +
          '<span class="lw-pult-titel"><span class="lw-titel-name">' + esc(S.titel || T.eigenesLied) + '</span><span class="lw-titel-naechste"></span><i class="lw-wechselbalken"></i></span>' +
          '<span class="lw-kopf-rechts"><button type="button" class="lw-schalter lw-rundgang-knopf' + (rundgangNeu() ? " neu" : "") + '" data-aktion="rundgang" title="' + esc(T.rundgangTipp) + '">' + T.rundgang + "</button>" + '<a class="lw-schalter lw-klangwelten" href="ambient.html" title="' + esc(T.klangweltenTipp) + '">' + T.klangwelten + "</a>" + '<button type="button" class="lw-schalter lw-funk-knopf' + (funk ? " an" : "") + '" data-aktion="funkauf" aria-expanded="' + funkAuf + '">' + funkKnopfText(T) + "</button></span></div>" +
        (funkAuf ? '<section class="lw-funk"><h4>' + T.funk + "</h4>" + funkTeil(T) + "</section>" : "") +
        konsole(T, false) +
        werkstatt(T, true) +
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
  const funkLink = () => location.origin + location.pathname + "?lauschen=" + funkRaum() + "#lautenwerk";
  function funkTeil(T) {
    if (!funk) return '<p class="lw-tipp">' + T.funkTipp + '</p><button type="button" class="lw-schalter" data-aktion="funk">' + T.funkStart + "</button>";
    return '<p class="lw-tipp">' + T.funkTipp + '</p><div class="lw-funk-zeile"><input type="text" readonly class="lw-funk-link" value="' + esc(funkLink()) + '">' +
      '<button type="button" class="lw-schalter" data-aktion="funkkopie">' + T.funkKopieren + "</button></div>" +
      '<p class="lw-funk-status">' + esc(funkStatusText(T)) + '</p><button type="button" class="lw-schalter" data-aktion="funk">' + T.funkStopp + "</button>";
  }
  const funkStatusText = T => !funk ? "" : funk.status === "ok" ? "🟢 " + T.funkLaeuft + " · " + T.funkZuhoerer(funk.zahl || 0) : funk.status === "fehler" ? "🔴 " + T.funkFehler : "🟡 " + T.funkVerbinde;
  function funkAnzeigen() { const el = root.querySelector(".lw-funk-status"); if (el) el.textContent = funkStatusText(t()); const k = root.querySelector(".lw-funk-knopf"); if (k) { k.textContent = funkKnopfText(t()); k.classList.toggle("an", !!funk); } }
  let funkAuf = false;
  const funkKnopfText = T => "📡 " + (funk && funk.status === "ok" ? (funk.zahl || 0) : funk ? "…" : T.funkKurz);
  function funkZustand() {
    const lied = { tempo: S.tempo, transpose: S.transpose, modus: S.modus, swing: S.swing, bordun: S.bordun, variation: S.variation,
      ablauf: S.ablauf, rollen: S.rollen || null, kapelle: S.kapelle, kapWahl: S.kapWahl || [], vol: S.vol, mute: S.mute, teile: Object.fromEntries(TEILE.filter(p => S.ablauf.includes(p)).map(p => [p, S.teile[p]])), instrument: S.instrument, band: S.band, takt: S.takt };
    return { s: lied, pos: { abschnitt, schritt }, lied: kodieren(), titel: S.titel || "", stimmung: S.stimmung || null, intensitaet: S.intensitaet, kulisse: S.kulisse, kulisseVol: S.kulisseVol,
      hall: S.hall, raum: S.raum, hallAus: S.hallAus, echoHall: S.echoHall, orchester: S.orchester, kapStufe: S.kapStufe, gaeste: S.gaeste, laeuft };
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
      buehneHTML(true) +
      '<div class="lw-pult"><div class="lw-pult-kopf"><button type="button" class="lw-play-gross lw-hoeren' + (hoerer.an ? " an" : "") + '" data-aktion="hoeren">' + (hoerer.an ? T.hAus : T.hZuhoeren) + "</button>" +
        '<span class="lw-pult-titel">' + esc(z && z.titel ? z.titel : "") + "</span></div>" +
        '<p class="lw-funk-status">' + esc(stat) + "</p>" + '<p class="lw-diagnose"></p>' +
        '<section class="lw-pult-mix"><label class="lw-feld lw-regler lw-master"><span>🔊 ' + T.hLaut + ' <b class="lw-mval">' + S.master * 10 + ' %</b></span><input type="range" min="0" max="10" step="1" value="' + S.master + '" data-feld="master"></label>' + fxRegler(T) + '</section>' +
        '<p class="lw-tipp">' + T.hIphone + "</p>" +
        '<p class="lw-tipp"><a href="' + esc(location.pathname) + '#lautenwerk">' + T.hSelbst + "</a></p>" +
      "</div>" + '<div class="lw-fuss"><span class="lw-status" aria-live="polite"></span></div>';
    spalten = []; aktiv = -1; figurCache = {};
  }
  /* geschätzte Stelle, an der Imre gerade ist */
  function funkAusrichten(sofort) {
    if (!hoerer || !funkPos || performance.now() - funkPos.t > 20000) return;
    const vergangen = (performance.now() - funkPos.t) / 1000 / schrittDauer();
    const gesamt = funkPos.schritt + vergangen, L = S.ablauf.length || 1;
    /* am Taktanfang auf den nächstgelegenen Takt runden – kleine Netzverzögerungen springen so nicht um einen Teil daneben */
    const takte = sofort ? Math.floor(gesamt / taktL()) : Math.round(gesamt / taktL());
    const ziel = ((funkPos.abschnitt + takte) % L + L) % L;
    if (sofort) { abschnitt = ziel; schritt = Math.floor(gesamt) % taktL(); }
    else abschnitt = ziel;
  }
  function hoererDiagnose() {
    const el = root.querySelector(".lw-diagnose"); if (!el || !hoerer) return;
    const T = t(), seit = hoerer.letztes ? Math.round((Date.now() - hoerer.letztes) / 1000) : null;
    el.textContent = T.hSignal(hoerer.nachrichten || 0, seit) + (ctx ? " · Audio: " + ctx.state : "");
  }
  /* Lied vom Pult übernehmen – jedes Feld wird geprüft, damit kaputte Daten nichts anrichten */
  function liedAusFunk(x) {
    if (!x || typeof x !== "object" || !x.teile) return null;
    const zahlFeld = (a, n, max) => Array.from({ length: SCHRITTE }, (_, i) => { const v = Array.isArray(a) ? a[i] : -1; return Number.isInteger(v) && v >= 0 && v <= max ? v : -1; });
    const teile = {};
    TEILE.forEach(p => { const t = x.teile[p] || {}; teile[p] = {}; SPUREN.forEach(sp => { teile[p][sp.id] = zahlFeld(t[sp.id], SCHRITTE, sp.art === "an" ? 0 : sp.zeilen - 1); }); });
    const vol = {}, mute = {};
    IDS.forEach(k => { vol[k] = zahl(x.vol && x.vol[k], 0, 10, 7); mute[k] = x.mute && x.mute[k] ? 1 : 0; });
    return pruefen({ tempo: zahl(x.tempo, 40, 200, 110), transpose: zahl(x.transpose, -7, 7, 0), modus: MODUS_LISTE.includes(x.modus) ? x.modus : MODUS_LISTE[0],
      swing: x.swing ? 1 : 0, bordun: x.bordun ? 1 : 0, variation: zahl(x.variation, 0, 10, 0), ablauf: String(x.ablauf || "A"),
      vol, mute, teile, rollen: typeof x.rollen === "string" ? x.rollen : undefined, kapelle: x.kapelle === 0 ? 0 : 1, kapWahl: Array.isArray(x.kapWahl) ? x.kapWahl : [], instrument: String(x.instrument || ""), band: Object.assign({}, x.band || {}), takt: x.takt === 12 ? 12 : 16 });
  }
  /* Position des Pults merken: an jedem Taktanfang springt der Zuhörer in denselben Teil wie Imre */
  let funkPos = null;
  function hoererEmpfang(ev, d) {
    if (ev !== "_offen") { hoerer.nachrichten = (hoerer.nachrichten || 0) + 1; hoerer.letztes = Date.now(); hoererDiagnose(); }
    if (ev === "_offen") { hoerer.verbunden = true; funkHoererKanal.senden("hallo", {}); zeichnen(); return; }
    if (ev === "fx") {
      if (!hoerer.an || !ctx || !ALLE_FX.includes(d.art)) return;
      if (KLASSIK[d.art] && typeof d.an === "boolean") {
        const spielt = !!(klassikLauf && klassikLauf.art === d.art);
        if (d.an !== spielt) effekt(d.art);
        return;
      }
      effekt(d.art); return;
    }
    if (ev !== "zustand") return;
    const alt = hoerer.zuletzt; hoerer.zuletzt = d;
    if (d.pos && Number.isInteger(d.pos.abschnitt) && Number.isInteger(d.pos.schritt)) funkPos = { abschnitt: d.pos.abschnitt, schritt: d.pos.schritt, t: performance.now() };
    /* Stopp zuerst – das darf nie an einem kaputten Lied scheitern */
    if (laeuft && !d.laeuft) { stopp(); zeichnen(); knoepfe(); }
    let neu = null;
    try { neu = liedAusFunk(d.s); } catch (_) {}
    if (!neu) neu = dekodieren(d.lied);
    if (!neu) { zeichnen(); knoepfe(); return; }
    Object.assign(neu, { titel: String(d.titel || "").slice(0, 80), stimmung: STIL[d.stimmung] ? d.stimmung : null, intensitaet: zahl(d.intensitaet, 0, 10, 5),
      kulisse: KULISSEN.includes(d.kulisse) ? d.kulisse : "keine", kulisseVol: zahl(d.kulisseVol, 0, 10, 5), hall: zahl(d.hall, 0, 10, 0),
      raum: RAEUME[d.raum] ? d.raum : "taverne", echoHall: zahl(d.echoHall, 0, 10, 3), orchester: d.orchester === 0 ? 0 : 1, kapStufe: d.kapStufe === 1 ? 1 : 2, gaeste: Object.assign(Object.fromEntries(GAESTE.map(g => [g.id, d.gaeste && [0, 1, 2].includes(d.gaeste[g.id]) ? d.gaeste[g.id] : 1])), { _aus: d.gaeste && d.gaeste._aus ? 1 : 0 }), hallAus: Object.assign({}, S.hallAus, d.hallAus || {}), master: S.master, pult: false });
    const kern = x => [x.transpose, x.modus, x.instrument, x.band.trommel, x.band.floete, x.band.ketten, x.swing, x.bordun, x.takt].join();
    const titelNeu = !alt || alt.titel !== d.titel || (alt.laeuft !== d.laeuft);
    if (laeuft && kern(neu) !== kern(S)) {
      wechsel = pruefen(neu);
      const a2 = S; S = wechsel; try { saitenVorbereiten(); } catch (_) {} S = a2;
    } else {
      const kulAlt = S.kulisse, raumAlt = S.raum;
      Object.assign(S, neu);
      if (ctx) { effekteAnwenden(); mixAnwenden(); if (raumAlt !== S.raum) raumAnwenden(); if (laeuft && kulAlt !== S.kulisse) kulisseStart(); }
    }
    if (hoerer.an && d.laeuft && !laeuft) { start(); funkAusrichten(true); }
    if (titelNeu) { zeichnen(); knoepfe(); }
  }
  let funkHoererKanal = null;
  if (hoerer) setInterval(hoererDiagnose, 1000);
  if (hoerer) funkHoererKanal = funkKanal(hoerer.raum, "hoerer", hoererEmpfang, st => {
    if (st === "fehler" && hoerer.verbunden) { hoerer.verbunden = false; zeichnen(); }
  });

  function zeichnen() {
    /* das Feld, das man gerade bedient hat, verliert den Fokus, bevor es ersetzt wird – sonst bleibt am Handy
       der Zustand „Tastatur offen“ hängen und die Navigationsleiste der Seite taucht später unter dem Finger auf */
    const f = document.activeElement; if (f && f !== document.body && root.contains(f) && f.blur) { try { f.blur(); } catch (_) {} }
    zeichnenSpaeter = false;
    root.classList.toggle("lw-pultmodus", !!S.pult && !hoerer); zeichnenInnen(); armeSetzen(); klassikKnoepfe();
  }
  /* von der Musik ausgelöstes Neuzeichnen (neues Thema, Wechsel): nicht mitten in eine offene Auswahl oder ein Eingabefeld hinein */
  let zeichnenSpaeter = false;
  const feldOffen = () => { const f = document.activeElement; return !!f && root.contains(f) && (f.tagName === "SELECT" || (f.tagName === "INPUT" && f.type === "text")); };
  function autoZeichnen() { if (feldOffen()) { zeichnenSpaeter = true; return; } zeichnen(); knoepfe(); }
  root.addEventListener("focusout", () => setTimeout(() => { if (zeichnenSpaeter && !feldOffen()) { zeichnen(); knoepfe(); } }, 60));
  /* Handy gedreht oder Fenster schmaler/breiter: Raster und Aufteilung passen sich an */
  try {
    const mq = window.matchMedia("(max-width: 760px)"), neu = () => { try { zeichnen(); knoepfe(); } catch (_) {} };
    if (mq.addEventListener) mq.addEventListener("change", neu); else if (mq.addListener) mq.addListener(neu);
  } catch (_) {}
  function zeichnenInnen() {
    const T = t();
    if (hoerer) { hoererZeichnen(T); return; }
    if (S.pult) { pultZeichnen(T); return; }
    if (!(editModus === "lied" ? TEILE : PATTERN).includes(bearbeite)) { bearbeite = "A"; kopierZiel = null; }
    const tonarten = Array.from({ length: 12 }, (_, i) => i - 5).map(tr => '<option value="' + tr + '"' + (tr === S.transpose ? " selected" : "") + ">" + notenName(MEL_GRUND + tr) + "</option>").join("");
    const modi = MODUS_LISTE.map(m => '<option value="' + m + '"' + (m === S.modus ? " selected" : "") + ">" + T.modi[m] + "</option>").join("");
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
      if (schmal() && spurWahl !== "alle" && sp.wer !== spurWahl) return;
      raster += kopf(sp.id);
      if (zugeklappt[sp.id]) return;
      if (sp.art === "an") raster += rasterZeile(sp.id, 0, (SYMBOL[sp.id] && SYMBOL[sp.id][S.band[sp.id]]) || sp.sym, "sym");
      else for (const z of (sp.id === "bass" ? BASS_ANZEIGE : Array.from({ length: zeilenZahl(sp) }, (_, k) => zeilenZahl(sp) - 1 - k))) raster += rasterZeile(sp.id, z, zeilenName(sp.id, z), (z === 0 || z === 7 || z === 14) && sp.id !== "rex" ? "grund" : (sp.id === "rex" ? "sym klein" : ""));
    });

    root.innerHTML =
      '<p class="label">' + T.label + "</p><h3>" + T.titel + '</h3><p class="tav-info">' + T.text + "</p>" +
      '<button type="button" class="lw-pultbanner" data-aktion="pult"><span class="lw-pb-icon">🎛</span><span><b>' + T.zumPult + "</b><small>" + T.pultUnter + '</small></span><span class="lw-pb-pfeil">→</span></button>' +
      buehneHTML(false) +
      werkstatt(T, false) +
      '<div class="lw-steuer">' +
        '<button type="button" class="lw-play">' + (laeuft ? T.stopp : T.spielen) + "</button>" +
        '<button type="button" class="lw-ausklang" data-aktion="ausklang" title="' + esc(T.ausklangTipp) + '"' + (laeuft ? "" : " hidden") + ">" + T.ausklang + "</button>" +
        '<label class="lw-feld lw-regler"><span>' + T.tempo + ' <b class="lw-bpm">' + S.tempo + '</b></span><input type="range" min="50" max="180" step="2" value="' + S.tempo + '" data-feld="tempo"></label>' +
        '<label class="lw-feld lw-regler"><span>' + T.variation + ' <b class="lw-var">' + S.variation * 10 + ' %</b></span><input type="range" min="0" max="10" step="1" value="' + S.variation + '" data-feld="variation"></label>' +
        '<label class="lw-feld"><span>' + T.tonart + '</span><select data-feld="transpose">' + tonarten + "</select></label>" +
        '<label class="lw-feld"><span>' + T.modus + '</span><select data-feld="modus">' + modi + "</select></label>" +
        '<button type="button" class="lw-schalter" data-feld="swing" aria-pressed="' + !!S.swing + '">' + T.swing + "</button>" +
        '<button type="button" class="lw-schalter" data-feld="bordun" aria-pressed="' + !!S.bordun + '">' + T.bordun + "</button>" +
      "</div>" +
      konsole(T, true) +
      editorHTML(T, raster) +
      '<p class="lw-wisch">' + T.wischen + "</p>" +
      '<div class="lw-fuss"><button type="button" class="lw-teilen">' + T.teilen + '</button><span class="lw-status" aria-live="polite"></span></div>';

    spalten = Array.from({ length: SCHRITTE }, (_, i) => Array.from(root.querySelectorAll('.lw-zelle[data-s="' + i + '"]')));
    aktiv = -1;
    figurCache = {};
  }
  const teilBenutzt = p => IDS.some(k => S.teile[p][k].some(v => v >= 0));
  /* ---------- Zwei Arten zu komponieren ----------
     „4 Pattern“ (Standard): wie an einer Groovebox – vier Takte A–D, die man zu einer Kette (Ablauf) verbindet, die Laute in einer Oktave.
     „Ganzes Lied“: bis zu 16 Takte mit Rollen (Strophe, Refrain …) und die Laute in zwei Oktaven – so schreiben auch die Stimmungen.
     Ein ganzes Lied lässt sich in vier Pattern umwandeln: je ein Takt aus Strophe, Refrain, Zwischenteil und Höhepunkt. */
  let editModus = "pattern";
  try { if (localStorage.getItem("imres-lw-modus") === "lied") editModus = "lied"; } catch (_) {}
  const PATTERN = ["A", "B", "C", "D"];
  const istGanzesLied = () => !!S.rollen || /[E-P]/.test(S.ablauf) || TEILE.slice(4).some(teilBenutzt);
  /* im Pattern-Modus nur eine Oktave – außer das Lied hat schon höhere Töne */
  const zeilenZahl = sp => sp.id === "melodie" && editModus === "pattern" && !PATTERN.some(p => S.teile[p].melodie.some(v => v > 7)) ? 8 : sp.zeilen;
  function zuPattern() {
    const nimm = r => { for (let i = 0; i < S.ablauf.length; i++) if (rolleAn(i) === r) return S.ablauf[i]; return null; };
    const a0 = nimm("s") || S.ablauf[0], quelle = { A: a0, B: nimm("r") || nimm("h") || a0, C: nimm("b"), D: nimm("h") || nimm("r") || a0 };
    const neu = Object.fromEntries(TEILE.map(p => [p, teilLeer()]));
    PATTERN.forEach(p => { if (quelle[p]) neu[p] = kopie(S.teile[quelle[p]]); });
    const mel = PATTERN.flatMap(p => neu[p].melodie.filter(v => v >= 0));
    if (mel.length && Math.min(...mel) >= 7) PATTERN.forEach(p => { neu[p].melodie = neu[p].melodie.map(v => v < 0 ? v : v - 7); });
    S.teile = neu; S.ablauf = quelle.C ? "AABBCD" : "AABBDD"; delete S.rollen;
    if (S.stimmung) { S.stimmung = null; const w = root.querySelector(".lw-wandelt"); if (w) w.remove(); }
    bearbeite = "A"; kopierZiel = null; merken();
  }
  function editorHTML(T, raster) {
    const lied = editModus === "lied", ganz = istGanzesLied();
    const schalter = '<div class="lw-modus" role="group" aria-label="' + esc(T.modusTitel) + '">' +
      '<button type="button" data-modus="pattern" aria-pressed="' + !lied + '">' + T.modusPattern + "</button>" +
      '<button type="button" data-modus="lied" aria-pressed="' + lied + '">' + T.modusLied + "</button>" +
      '<span class="lw-modus-tipp">' + (lied ? T.modusLiedTipp : T.modusPatternTipp) + "</span></div>";
    if (!lied && ganz) return schalter +
      '<div class="lw-liedkarte"><p>' + T.liedHinweis(S.ablauf.length) + "</p>" +
      '<button type="button" class="lw-schalter" data-aktion="zupattern">' + T.zuPattern + "</button>" +
      '<button type="button" class="lw-schalter" data-modus="lied">' + T.liedBearbeiten + "</button></div>";
    const teile = lied ? TEILE : PATTERN;
    if (!teile.includes(bearbeite)) bearbeite = "A";
    let mitte;
    if (lied) mitte =
      '<label class="lw-feld lw-rolle"><span>' + T.rolleVon(bearbeite) + '</span><select data-feld="rolle">' +
        ROLLEN.map(r => '<option value="' + r + '"' + (rolleVon(S, bearbeite) === r ? " selected" : "") + ">" + T.rollen[r] + "</option>").join("") + "</select></label>" +
      '<label class="lw-feld lw-ablauf"><span>' + T.ablauf + '</span><input type="text" data-feld="ablauf" value="' + esc(S.ablauf) + '" list="lw-ablaeufe" maxlength="64" spellcheck="false" autocomplete="off" autocapitalize="characters">' +
        '<datalist id="lw-ablaeufe">' + ABLAEUFE.map(a => '<option value="' + a + '"></option>').join("") + "</datalist></label>" +
      '<span class="lw-kopieren"><label class="lw-feld"><span>' + T.kopierenNach(bearbeite) + '</span><select data-feld="kopiere"><option value="">…</option>' +
        TEILE.filter(z => z !== bearbeite).map(z => '<option value="' + z + '">' + z + (teilBenutzt(z) ? " •" : "") + "</option>").join("") + "</select></label>" +
        (kopierZiel ? '<button type="button" class="lw-klein warnung" data-kopiere="' + kopierZiel + '">' + T.ueberschreiben(kopierZiel) + "</button>" : "") + "</span>";
    else {
      const ablaeufe = (ABLAEUFE.includes(S.ablauf) ? ABLAEUFE : ABLAEUFE.concat([S.ablauf])).map(a => '<option value="' + a + '"' + (a === S.ablauf ? " selected" : "") + ">" + a.split("").join(" – ") + "</option>").join("");
      mitte =
        '<label class="lw-feld lw-ablauf"><span>' + T.kette + '</span><select data-feld="ablauf">' + ablaeufe + "</select></label>" +
        '<span class="lw-kopieren"><span class="lw-teile-label">' + T.kopierenNach(bearbeite) + ":</span>" +
          PATTERN.filter(z => z !== bearbeite).map(z => '<button type="button" class="lw-klein' + (kopierZiel === z ? " warnung" : "") + '" data-kopiere="' + z + '">' +
            (kopierZiel === z ? T.ueberschreiben(z) : "→ " + z) + "</button>").join("") + "</span>";
    }
    return schalter +
      '<div class="lw-teile">' +
        '<span class="lw-teilgruppe"><span class="lw-teile-label">' + (lied ? T.teil : T.pattern) + ':</span><span class="lw-teilknoepfe">' +
        teile.map(p => '<button type="button" class="lw-teil' + (lied ? " r-" + rolleVon(S, p) : "") + (teilBenutzt(p) || S.ablauf.includes(p) ? "" : " leer") + '" data-teil="' + p + '" aria-pressed="' + (bearbeite === p) + '"' + (lied ? ' title="' + esc(T.rollen[rolleVon(S, p)]) + '"' : "") + ">" + p + "</button>").join("") + "</span></span>" +
        mitte +
      "</div>" +
      rasterWahl(T) +
      '<div class="lw-scroll"><div class="lw-raster' + (taktL() === 12 ? " drei" : "") + (schmal() ? " halb" : "") + '">' + raster + "</div></div>";
  }
  /* ---------- Am Handy: Raster wie an einer Groovebox ----------
     Ein halber Takt pro Bildschirm (Schritte 1–8 | 9–16) mit großen Feldern statt seitlich zu scrollen,
     und immer nur ein Gefährte – oben wählt man, wessen Spuren man sieht. */
  const schmal = () => !!(window.matchMedia && window.matchMedia("(max-width: 760px)").matches);
  let rasterHaelfte = 0, spurWahl = "barradin";
  const WER_LISTE = ["barradin", "friedrich", "echo", "ezekiel", "rex"];
  try { const w = localStorage.getItem("imres-lw-spurwahl"); if (w === "alle" || WER_LISTE.includes(w)) spurWahl = w; } catch (_) {}
  function rasterFenster() { const L = taktL(); if (!schmal()) return [0, L]; const h = L / 2; return [rasterHaelfte * h, rasterHaelfte * h + h]; }
  function rasterWahl(T) {
    if (!schmal()) return "";
    const h = taktL() / 2;
    return '<div class="lw-rasterwahl"><div class="lw-wer" role="tablist">' +
      WER_LISTE.concat(["alle"]).map(w => '<button type="button" role="tab" data-werwahl="' + w + '" aria-selected="' + (spurWahl === w) + '">' + (w === "alle" ? T.alleSpuren : T.wer[w]) + "</button>").join("") + "</div>" +
      '<div class="lw-haelfte" role="group" aria-label="' + esc(T.schritte) + '">' +
      [0, 1].map(k => '<button type="button" data-haelfte="' + k + '" aria-pressed="' + (rasterHaelfte === k) + '">' + (k * h + 1) + "–" + (k * h + h) + "</button>").join("") + "</div></div>";
  }
  /* welche Hälfte gerade erklingt: ein Punkt auf ihrem Knopf */
  function haelfteAnzeige(i) { if (!schmal()) return; const h = taktL() / 2; root.querySelectorAll("[data-haelfte]").forEach(b => b.classList.toggle("spielt", i >= 0 && Math.floor(i / h) === +b.dataset.haelfte)); }
  /* ---------- Mini-Player oben: erscheint, wenn die Musik läuft und das Lautenwerk nicht zu sehen ist ---------- */
  let mini = null, lautenwerkSichtbar = true;
  function miniBauen() {
    const tools = document.querySelector("header.top .tools");
    if (!tools || mini) return;
    mini = document.createElement("div");
    mini.className = "lw-mini"; mini.hidden = true;
    mini.innerHTML = '<a class="lw-mini-titel" href="#lautenwerk"><span class="lw-mini-note">♪</span><span class="lw-mini-name"></span></a><button type="button" class="lw-mini-knopf"></button><button type="button" class="lw-mini-knopf lw-mini-kul"></button>';
    tools.insertBefore(mini, tools.firstChild);
    mini.querySelector(".lw-mini-knopf").addEventListener("click", () => {
      if (hoerer) { const b = root.querySelector('[data-aktion="hoeren"]'); if (b) b.click(); return; }
      laeuft ? stopp(true) : start(true);
    });
    /* nur Geräusche (Kulisse oder Dauer-Effekt) ohne Musik: eigener Stopp-Knopf, danach wieder startbar */
    mini.querySelector(".lw-mini-kul").addEventListener("click", () => {
      if (kul || klassikLauf) {
        if (kul) { kulMerk = S.kulisse; kulisseStop(); }
        if (klassikLauf) klassikStopp(true);
      } else if (kulMerk) { audioStart(); S.kulisse = kulMerk; kulisseStart(true); }
      miniAnzeigen();
    });
    if (window.IntersectionObserver) new IntersectionObserver(e => { lautenwerkSichtbar = e[e.length - 1].isIntersecting; miniAnzeigen(); }).observe(root);
  }
  function miniAnzeigen() {
    if (!mini) return;
    const T = t();
    const musik = laeuft || pausiert, geraeusch = !laeuft && (!!kul || !!klassikLauf), gemerkt = !laeuft && !geraeusch && !!kulMerk;
    mini.hidden = !((musik || geraeusch || gemerkt) && !lautenwerkSichtbar) || !!(leiste && !leiste.hidden);
    mini.classList.toggle("spielt", laeuft || geraeusch);
    const kk = mini.querySelector(".lw-mini-kul"), nurKul = !musik || geraeusch;
    kk.hidden = !(geraeusch || gemerkt);
    kk.textContent = geraeusch ? "■" : "▶";
    kk.setAttribute("aria-label", geraeusch ? T.miniKulStopp : T.miniKulWeiter); kk.title = kk.getAttribute("aria-label");
    mini.querySelector(".lw-mini-note").textContent = musik && !geraeusch ? "♪" : "🌫";
    mini.querySelector(".lw-mini-knopf:not(.lw-mini-kul)").hidden = !musik || geraeusch;
    mini.querySelector(".lw-mini-name").textContent = nurKul && (geraeusch || gemerkt)
      ? (kul ? T.kulissen[kul.art] : klassikLauf ? T.sfx[klassikLauf.art] : T.kulissen[kulMerk] || "").replace(/^\S+\s/, "")
      : S.titel || T.eigenesLied;
    mini.querySelector(".lw-mini-titel").title = T.miniZur;
    const k = mini.querySelector(".lw-mini-knopf:not(.lw-mini-kul)");
    k.textContent = laeuft ? "❚❚" : "▶"; k.setAttribute("aria-label", laeuft ? T.miniPause : T.miniWeiter); k.title = k.getAttribute("aria-label");
  }
  function knoepfe() {
    miniAnzeigen(); try { favMarkieren(); leisteBauen(); leisteAktualisieren(); wechselMerk = "\u0000"; wechselAnzeige(); } catch (_) {}
    const b = root.querySelector(".lw-play");
    if (b) { b.textContent = laeuft ? t().stopp : t().spielen; b.classList.toggle("laeuft", laeuft); }
    root.querySelectorAll(".lw-ausklang").forEach(a => { a.hidden = !laeuft; a.disabled = ausklingt || !!ausklangAb; });
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
      teile: { A: zufallsTeil(false), B: zufallsTeil(true), C: ablauf.includes("C") ? zufallsTeil(true) : teilLeer() }, vol: S.vol, mute: S.mute });
  }

  /* ---------- Bedienung ---------- */
  function stimmungLoesen() {
    if (!S.stimmung) return;
    S.stimmung = null; const w = root.querySelector(".lw-wandelt"); if (w) w.remove();
    root.querySelectorAll(".lw-musik [data-vorlage]").forEach(b => b.classList.remove("an"));
  }
  function antippen(z) {
    const spur = z.dataset.spur, i = +z.dataset.s, zeile = +z.dataset.zeile, daten = S.teile[bearbeite][spur];
    if (S.stimmung) { S.stimmung = null; const w = root.querySelector(".lw-wandelt"); if (w) w.remove(); root.querySelectorAll(".lw-musik [data-vorlage]").forEach(b => b.classList.remove("an")); }
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
    const behalten = { orchester: S.orchester, kapelle: S.kapelle, kapStufe: S.kapStufe, kick: S.kick, echoHall: S.echoHall, fxVol: S.fxVol, intensitaet: S.intensitaet, master: S.master, hall: S.hall, hallAus: S.hallAus, raum: S.raum, kulisseVol: S.kulisseVol, pult: S.pult, kulisse: S.kulisse, gaeste: S.gaeste };
    let neu;
    if (k === "leer") { neu = Object.assign({}, S, { teile: Object.fromEntries(TEILE.map(p => [p, teilLeer()])), ablauf: "A", titel: "", stimmung: null }); delete neu.rollen; }
    else if (k === "zufall") neu = zufallsLied();
    else if (STIL[k] || (eigeneStimmungen[k] && STIL[eigeneStimmungen[k].basis])) {
      const eig = eigeneStimmungen[k], basis = eig ? eig.basis : k;
      neu = stimmungLied(basis, false, eig && eig.werte ? eig.werte.intensitaet : undefined);
      /* läuft schon Musik, bleibt die neue Stimmung möglichst nah an Tonart und Tonleiter der alten – so gleitet der Wechsel */
      if (laeuft && S) {
        const st = STIL[basis], tr = st.transpose.reduce((b, x) => Math.abs(x - S.transpose) < Math.abs(b - S.transpose) ? x : b, st.transpose[0]);
        neu.transpose = tr;
        if (!st.lieder && st.modus.includes(S.modus) && neu.modus !== S.modus) { neu.modus = S.modus; const st2 = mitIntensitaet(st, neu.intensitaet); st2.taktJetzt = neu.takt; let tl; try { tl = neu.rollen ? liedTeile(st2, neu.modus, neu.rollen, neu.takt) : stimmungTeile(st2, neu.modus); } catch (_) { tl = neu.teile; } neu.teile = pruefen({ teile: tl }).teile; }
      }
    }
    else neu = pruefen(ausVorlage(k, mix));
    Object.assign(neu, behalten);
    const eig = eigeneStimmungen[k];
    if (k !== "leer") {
      neu.titel = k === "zufall" ? t().zufall.replace(/^\S+\s/, "") : eig ? stimmName(k) : t().vorlagen[k].replace(/^[^\wÄÖÜäöü]+/, "");
      if (KULISSE_ZU[k]) neu.kulisse = KULISSE_ZU[k];
    }
    /* selbst angetippte Kulisse läuft: sie bleibt, statt von der Kulisse der Stimmung ersetzt zu werden */
    if (kul && kul.allein && !(eigeneStimmungen[k] && eigeneStimmungen[k].werte && eigeneStimmungen[k].werte.kulisse)) neu.kulisse = kul.art;
    neu.eigeneStimmung = null; neu.festBesetzung = 0;
    if (eig && eig.werte) {
      neu.festBesetzung = eig.werte.instrument ? 1 : 0;
      /* gespeicherte Stimmung: ihre Einstellungen gewinnen */
      const w = eig.werte;
      ["intensitaet", "kulisse", "kulisseVol", "hall", "raum", "echoHall", "orchester", "kapelle", "kapStufe", "instrument", "gaeste"].forEach(f => { if (w[f] != null) neu[f] = w[f]; });
      if (w.band) neu.band = Object.assign({}, neu.band, w.band);
      neu.stimmung = eig.basis; neu.eigeneStimmung = k;
      if (!KULISSEN.includes(neu.kulisse)) neu.kulisse = "keine";
      if (!RAEUME[neu.raum]) neu.raum = "taverne";
    }
    if (k !== "leer" && !neu.stimmung) neu.stimmung = null;
    if (k !== "leer" && !STIL[k] && !eig) neu.stimmung = null;
    geladen = null; bearbeite = "A";
    if (laeuft && k !== "leer") {
      /* sanft: erst am nächsten Taktanfang wechseln; Klänge schon jetzt vorbereiten */
      wechsel = neu;
      const alt = S; S = neu; try { saitenVorbereiten(); } catch (_) {} S = alt;
      root.querySelectorAll("[data-vorlage]").forEach(b => b.classList.toggle("wartet", b.dataset.vorlage === k));
      status(t().wechselGleich(neu.titel || ""));
      return;
    }
    const raumAlt = S.raum;
    S = neu; if (!laeuft) pausiert = false;
    merken(); neuGezeichnet(); saitenVorbereiten();
    if (ctx) { effekteAnwenden(); mixAnwenden(); if (raumAlt !== S.raum) raumAnwenden(); }
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
    if (e.target.closest('[data-aktion="ausklang"]')) { if (laeuft && !ausklingt && !ausklangAb) { ausklangAb = -1; wechsel = null; wechselAb = 0; knoepfe(); status(t().ausklingt); } return; }
    if (e.target.closest('[data-aktion="kapelle"]')) { S.kapelle = S.kapelle === 0 ? 1 : 0; merken(); if (ctx) kapelleVorladen(); gaesteNeu(); return; }
    if (e.target.closest('[data-aktion="kapneu"]')) { if (S.stimmung) { S.kapWahl = kapelleWaehlen(S.stimmung); merken(); if (ctx) kapelleVorladen(); gaesteNeu(); } return; }
    if (e.target.closest('[data-aktion="orchester"]')) {
      S.orchester = S.orchester === 0 ? 1 : 0; merken(); if (ctx) orchVorladen(); gaesteNeu(); return;
    }
    if (e.target.closest('[data-aktion="kick"]')) {
      S.kick = ((S.kick == null ? 1 : S.kick) + 1) % 3; merken();
      root.querySelectorAll(".lw-kick").forEach(b => { b.setAttribute("aria-pressed", S.kick !== 0); b.textContent = "🥁 " + t().kick + ": " + t().kickStufe[S.kick]; });
      return;
    }
    if (e.target.closest('[data-aktion="spar"]')) {
      spar = !spar; try { localStorage.setItem("imres-lw-spar", spar ? "1" : "0"); } catch (_) {}
      root.querySelectorAll(".lw-spar").forEach(b => b.setAttribute("aria-pressed", spar)); status(spar ? t().sparAn : t().sparAus); return;
    }
    const mt = e.target.closest("[data-musiktab]");
    if (mt) { musikTab = mt.dataset.musiktab; try { localStorage.setItem("imres-lw-musiktab", musikTab); } catch (_) {} boxNeu("musik"); return; }
    const ka = e.target.closest("[data-klangauf]");
    if (ka) { const k = ka.dataset.klangauf; klangAuf[k] = !klangAuf[k]; try { localStorage.setItem("imres-lw-klangauf", JSON.stringify(klangAuf)); } catch (_) {} boxNeu(k === "st" ? "musik" : "klang"); return; }
    const ft = e.target.closest("[data-fxtab]");
    if (ft) { fxTab = ft.dataset.fxtab; try { localStorage.setItem("imres-lw-fxtab", fxTab); } catch (_) {} boxNeu("klang"); return; }
    const eg = e.target.closest("[data-eigen]");
    if (eg) { audioStart(); eigenLaden(eg.dataset.eigen); return; }
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
        if (hoerer.an) {
          audioStart(); saitenVorbereiten();
          try { const z = ctx.currentTime + .03; [0, .09].forEach((d, i) => { const o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.value = i ? 1320 : 990; g.gain.setValueAtTime(.12, z + d); g.gain.exponentialRampToValueAtTime(.001, z + d + .25); o.connect(g); g.connect(sfxBus); o.start(z + d); o.stop(z + d + .3); }); } catch (_) {}
          if (hoerer.zuletzt && hoerer.zuletzt.laeuft) start();
        }
        else if (laeuft) stopp();
        zeichnen(); knoepfe();
      }
      return;
    }
    const ww = e.target.closest("[data-werwahl]");
    if (ww) { spurWahl = ww.dataset.werwahl; try { localStorage.setItem("imres-lw-spurwahl", spurWahl); } catch (_) {} zeichnen(); knoepfe(); return; }
    const hb = e.target.closest("[data-haelfte]");
    if (hb) { rasterHaelfte = +hb.dataset.haelfte ? 1 : 0; zeichnen(); knoepfe(); return; }
    const md = e.target.closest("[data-modus]");
    if (md) { editModus = md.dataset.modus === "lied" ? "lied" : "pattern"; try { localStorage.setItem("imres-lw-modus", editModus); } catch (_) {} kopierZiel = null; zeichnen(); knoepfe(); return; }
    if (e.target.closest('[data-aktion="zupattern"]')) { zuPattern(); zeichnen(); knoepfe(); status(t().umgewandelt); return; }
    const tl = e.target.closest(".lw-teil");
    if (tl) { bearbeite = tl.dataset.teil; kopierZiel = null; zeichnen(); knoepfe(); return; }
    const sa = e.target.closest("[data-aktion]");
    if (sa && sa.dataset.aktion.startsWith("stimm")) {
      const a = sa.dataset.aktion, T = t(), feld = root.querySelector(".lw-stimmname"), name = feld ? feld.value.trim().slice(0, 40) : "";
      const aktiv = S.eigeneStimmung || S.stimmung;
      if (a === "stimmspeichern") { stimmForm = { name: stimmName(aktiv) }; boxNeu("musik"); const f = root.querySelector(".lw-stimmname"); if (f) { f.focus(); f.select(); } return; }
      if (a === "stimmabbrechen") { stimmForm = null; boxNeu("musik"); return; }
      if (a === "stimmneu" || a === "stimmueber") {
        if (!S.stimmung || !STIL[S.stimmung]) return;
        if (a === "stimmneu" && !name) { status(T.keinName); return; }
        const id = a === "stimmneu" ? "e_" + Date.now().toString(36) : aktiv;
        const nm = name || stimmName(aktiv);
        eigeneStimmungen[id] = { name: nm, basis: S.stimmung, werte: STIMM_WERTE() };
        stimmungenMerken(); S.eigeneStimmung = id; S.titel = nm; merken(); stimmForm = null; zeichnen(); knoepfe(); status(T.gespeichertOk(nm)); return;
      }
      if (a === "stimmzurueck" && eigeneStimmungen[aktiv] && !aktiv.startsWith("e_")) {
        delete eigeneStimmungen[aktiv]; stimmungenMerken(); S.eigeneStimmung = null; S.titel = stimmName(aktiv); merken(); stimmForm = null; zeichnen(); knoepfe(); status(T.stimmZurueckOk); return;
      }
      if (a === "stimmloeschen" && aktiv.startsWith("e_") && eigeneStimmungen[aktiv]) {
        const nm = eigeneStimmungen[aktiv].name;
        if (!window.confirm(T.loeschenFrage(nm))) return;
        delete eigeneStimmungen[aktiv]; stimmungenMerken(); S.eigeneStimmung = null; merken(); stimmForm = null; zeichnen(); knoepfe(); status(T.geloescht(nm)); return;
      }
      return;
    }
    const ak = e.target.closest("[data-aktion]");
    if (ak && ["speichern", "abbrechen", "nurhier", "fueralle", "loeschen", "abmelden"].includes(ak.dataset.aktion)) {
      const a = ak.dataset.aktion, T = t();
      if (a === "abmelden") { pwMerken(""); zeichnen(); knoepfe(); status(T.abgemeldet); return; }
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
    if (v) {
      const k = v.dataset.vorlage, istStimmung = !!(STIL[k] || (eigeneStimmungen[k] && STIL[eigeneStimmungen[k].basis]));
      vorlageWaehlen(k);
      /* eine Stimmung antippen genügt: läuft noch nichts, beginnt sie gleich – leise von null an */
      if (istStimmung && !laeuft && !hoerer) { pausiert = false; start(); }
      return;
    }
    const kb = e.target.closest("[data-kulisse]");
    if (kb) { audioStart(); S.kulisse = kb.dataset.kulisse; merken(); kulisseStart(true); zeichnen(); knoepfe(); return; }
    const fx = e.target.closest("[data-sfx]");
    if (fx) { try { audioStart(); effekt(fx.dataset.sfx); funkSenden("fx", KLASSIK[fx.dataset.sfx] ? { art: fx.dataset.sfx, an: !!(klassikLauf && klassikLauf.art === fx.dataset.sfx) } : { art: fx.dataset.sfx }); fx.classList.remove("blitz"); void fx.offsetWidth; fx.classList.add("blitz"); } catch (_) {} return; }
    if (e.target.closest('[data-aktion="pult"]')) { S.pult = !S.pult; merken(); zeichnen(); knoepfe(); root.scrollIntoView({ block: "start" }); return; }
    if (e.target.closest('[data-aktion="kulisse"]')) { audioStart(); kul ? kulisseStop() : kulisseStart(true); zeichnen(); knoepfe(); return; }
    if (e.target.closest(".lw-teilen")) {
      const url = location.origin + location.pathname + "?lied=" + kodieren() + "#lautenwerk";
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
    if (d.feld === "echohall") { S.echoHall = +e.target.value; root.querySelectorAll(".lw-eval").forEach(x => x.textContent = S.echoHall * 10 + " %"); merken(); effekteAnwenden(); }
    if (d.feld === "fxvol") { S.fxVol = +e.target.value; root.querySelectorAll(".lw-fval").forEach(x => x.textContent = S.fxVol * 10 + " %"); merken(); effekteAnwenden(); }
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
    if (f === "ablauf" || f === "rolle" || (f === "kopiere" && e.target.value)) stimmungLoesen();
    if (f === "ablauf") { const v = String(e.target.value).toUpperCase().replace(/[^A-P]/g, "").slice(0, 64) || "A"; S.ablauf = v; e.target.value = v; merken(); zeichnen(); knoepfe(); }
    if (f === "rolle") { const i = TEILE.indexOf(bearbeite), r = S.rollen || rollenStandard(); S.rollen = r.slice(0, i) + e.target.value + r.slice(i + 1); merken(); zeichnen(); knoepfe(); }
    if (f === "kopiere" && e.target.value) {
      const von = bearbeite, nach = e.target.value;
      if (teilBenutzt(nach)) { kopierZiel = nach; zeichnen(); knoepfe(); status(t().sicher(nach)); return; }
      kopierZiel = null; S.teile[nach] = kopie(S.teile[von]); merken(); bearbeite = nach; zeichnen(); knoepfe(); status(t().kopiert2(von, nach)); return;
    }
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
      if (S.stimmung) S.festBesetzung = 1; /* selbst gewählt: bleibt, auch wenn das Thema wechselt */
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
    if (!document.hidden && laeuft) { const jetzt = ctx.currentTime; while (anzeige.length && anzeige[0].zeit < jetzt - .05) anzeige.shift(); malenStarten(); }
  });

  /* ---------- Aussehen ---------- */
  const css = document.createElement("style");
  css.textContent = `
.lautenwerk { grid-column: 1 / -1; }
.lw-buehne { background: #0d0a10; }
.lw-szene { position: absolute; inset: 0; transform-origin: 34% 60%; }
.lw-figur .fg-friedrich { transform-origin: 65px 208px; } .lw-figur .fg-barradin { transform-origin: 215px 208px; } .lw-figur .fg-echo { transform-origin: 415px 208px; } .lw-figur .fg-rex { transform-origin: 495px 210px; } .lw-figur .fg-ezekiel { transform-origin: 595px 208px; }
.lw-kulisse-bild { position: absolute; inset: 0; width: 100%; height: 100%; display: block; }
.lw-kulisse-bild .bg { display: none; }
.lw-kulisse-bild g, .lw-kulisse-bild path, .lw-kulisse-bild circle, .lw-kulisse-bild ellipse, .lw-kulisse-bild rect { transform-box: fill-box; }
.lw-buehne::after { content: ""; position: absolute; inset: 0; pointer-events: none; background: linear-gradient(180deg, rgba(8,6,10,.15), transparent 30%, transparent 70%, rgba(8,6,10,.55)); }
.lw-kulisse-bild .stern { animation: lwfunkeln 3s ease-in-out infinite; }
@keyframes lwfunkeln { 50% { opacity: .2; } }
.lw-kulisse-bild .licht { opacity: calc(.3 + var(--pegel, 0) * 1.5); }
.lw-kulisse-bild .flamme { transform-origin: 50% 100%; animation: lwflacker .32s ease-in-out infinite alternate; }
@keyframes lwflacker { from { transform: scale(1, 1); } to { transform: scale(.82, 1.2); } }
.lw-kulisse-bild .feuerschein { transform-origin: 50% 100%; opacity: calc(.55 + var(--pegel, 0) * 1.1); animation: lwschein 1.3s ease-in-out infinite alternate; }
@keyframes lwschein { to { transform: scale(1.06, 1.12); } }
.lw-kulisse-bild .funken circle { animation: lwfunke 4s linear infinite; }
@keyframes lwfunke { 0% { transform: translate(0, 0); opacity: 0; } 10% { opacity: 1; } 100% { transform: translate(18px, -190px); opacity: 0; } }
.lw-kulisse-bild .regen-fall { animation: lwregen .5s linear infinite; transform-box: view-box; }
.lw-kulisse-bild .regen-fall.langsam { animation-duration: .9s; }
.lw-kulisse-bild .regen-fall.schnell { animation-duration: .36s; }
@keyframes lwregen { to { transform: translate(-62.5px, 250px); } }
.lw-kulisse-bild .tropfen { animation: lwtropfen 2.8s ease-in infinite; }
@keyframes lwtropfen { 0%, 40% { transform: translateY(0); opacity: 0; } 45% { opacity: .9; } 100% { transform: translateY(150px); opacity: 0; } }
.lw-kulisse-bild .nebel { animation: lwnebel 14s ease-in-out infinite alternate; }
@keyframes lwnebel { from { transform: translateX(-40px); } to { transform: translateX(40px) scaleY(1.3); } }
.lw-kulisse-bild .gluehwuermchen circle { animation: lwgluehen 6s ease-in-out infinite; filter: drop-shadow(0 0 3px #d8ff8a); }
@keyframes lwgluehen { 0%, 100% { opacity: 0; transform: translate(0, 0); } 40% { opacity: 1; } 60% { opacity: .8; transform: translate(14px, -10px); } }
.lw-kulisse-bild .kristall { animation: lwkristall 4s ease-in-out infinite; }
@keyframes lwkristall { 50% { opacity: .55; } }
.lw-kulisse-bild .wellen .w1 { animation: lwwelle 5s linear infinite; }
.lw-kulisse-bild .wellen .w2 { animation: lwwelle2 7s linear infinite; }
@keyframes lwwelle { to { transform: translateX(80px); } }
@keyframes lwwelle2 { to { transform: translateX(-100px); } }
.lw-kulisse-bild .moewen .m1 { animation: lwmoewe 22s linear infinite; }
.lw-kulisse-bild .moewen .m2 { animation: lwmoewe 30s linear infinite -12s; }
@keyframes lwmoewe { from { transform: translate(-200px, 10px); } 50% { transform: translate(300px, -10px); } to { transform: translate(800px, 6px); } }
.lw-kulisse-bild .wolken { animation: lwwolken 26s ease-in-out infinite alternate; }
.lw-kulisse-bild .wolken.w2 { animation-duration: 17s; animation-direction: alternate-reverse; }
@keyframes lwwolken { from { transform: translateX(-50px); } to { transform: translateX(50px); } }
.lw-kulisse-bild .blitzlicht { animation: lwsturmblitz 9s linear infinite; }
.lw-kulisse-bild .blitz { animation: lwsturmblitz2 9s linear infinite; }
@keyframes lwsturmblitz { 0%, 60%, 62.5%, 64%, 100% { opacity: 0; } 61% { opacity: .45; } 63% { opacity: .3; } }
@keyframes lwsturmblitz2 { 0%, 60%, 62.5%, 64%, 100% { opacity: 0; } 61%, 63% { opacity: 1; } }
.lw-kulisse-bild .baeume-wind > path { transform-origin: 50% 100%; animation: lwwind 2.2s ease-in-out infinite alternate; }
@keyframes lwwind { from { transform: skewX(-4deg); } to { transform: skewX(3deg); } }
.lw-kulisse-bild .spot { transform-origin: 50% 0; opacity: calc(.45 + var(--pegel, 0) * 1.3); animation: lwspot 8s ease-in-out infinite alternate; }
.lw-kulisse-bild .spot.s2 { animation-duration: 6.5s; animation-direction: alternate-reverse; }
@keyframes lwspot { from { transform: rotate(-7deg); } to { transform: rotate(7deg); } }
.lw-buehne:not(.spielt) .lw-kulisse-bild *, .lw-buehne.halt * { animation-play-state: paused !important; }
.lw-buehne.spar .stern, .lw-buehne.spar .regen-fall.langsam, .lw-buehne.spar .wolken.w2, .lw-buehne.spar .gluehwuermchen circle, .lw-buehne.spar .nebel { animation: none; }
.lw-buehne.spar .gluehwuermchen circle { filter: none; }
.lw-geister { position: absolute; inset: 4px 4px 0; width: calc(100% - 8px); height: calc(100% - 4px); overflow: visible; opacity: .75; fill: rgba(190,222,255,.16); stroke: rgba(205,230,255,.55); stroke-width: 1.2; }
.lw-geister g, .lw-geister path, .lw-geister ellipse { transform-box: fill-box; }
.lw-geister .g-schein { stroke: none; opacity: calc(var(--orch, 0) * (.25 + var(--blech, 0) * .75)); }
.lw-geister .g-streicher, .lw-geister .g-pauke { opacity: var(--orch, 0); }
.lw-geister .g-neu { opacity: 0; transition: opacity 1.4s ease; }
.lw-buehne.spielt .lw-geister .g-neu .geist .g-k { animation: lwgeistwiegen 2.6s ease-in-out infinite alternate; transform-origin: 50% 100%; }
.lw-buehne.g-holz .lw-geister .g-holz, .lw-buehne.g-chor .lw-geister .g-chor, .lw-buehne.g-orgel .lw-geister .g-orgel, .lw-buehne.g-amboss .lw-geister .g-amboss, .lw-buehne.g-glanz .lw-geister .g-glanz { opacity: 1; }
.lw-buehne.g-orgel .lw-geister .g-amboss { opacity: 0; }
.lw-geister .g-pfeifen { stroke: rgba(205,230,255,.4); }
.lw-buehne.g-chor .lw-geister .g-mund { animation: lwsingen 1.3s ease-in-out infinite alternate; transform-origin: 50% 50%; }
.lw-buehne.g-chor .lw-geister .saenger:nth-child(2) .g-mund { animation-delay: -.6s; }
@keyframes lwsingen { from { transform: scaleY(.6); } to { transform: scaleY(1.3); } }
.lw-buehne.g-glanz .lw-geister .g-glanz .g-k { animation: lwgeistwiegen 1.4s ease-in-out infinite alternate; transform-origin: 50% 0; }
.lw-figur .balg, .lw-gast .balg, .lw-gast .fluegel { transform-box: fill-box; transform-origin: 50% 50%; }
.lw-gast .kurbel { transform-box: fill-box; transform-origin: 0 100%; }
.lw-geister .g-empore { fill: none; opacity: .5; }
.lw-geister .g-blech { opacity: calc(var(--orch, 0) * (.2 + var(--blech, 0) * .8)); transform: translateY(calc(var(--blech, 0) * -3px)); transform-box: view-box; }
.lw-geister .g-blech .horn path { stroke-width: 2.5; }
.lw-buehne.orch-an .lw-geister .g-bogen { animation: lwbogen .9s ease-in-out infinite alternate; }
.lw-buehne.orch-an .lw-geister .g-bogen.quer { animation-duration: 1.2s; }
.lw-buehne.orch-an .lw-geister .geist .g-k { animation: lwgeistwiegen 2.6s ease-in-out infinite alternate; transform-origin: 50% 100%; }
.lw-geister .geist:nth-child(2n) .g-k { animation-delay: -1.3s !important; }
@keyframes lwbogen { from { transform: translate(-5px, -3px); } to { transform: translate(5px, 3px); } }
@keyframes lwgeistwiegen { from { transform: rotate(-3deg); } to { transform: rotate(3deg); } }
.lw-publikum { position: absolute; left: 0; right: 0; bottom: -3px; height: clamp(26px, 17%, 44px); display: flex; justify-content: space-evenly; align-items: flex-end; pointer-events: none; transition: transform .7s ease, opacity .7s; z-index: 1; }
.lw-publikum .gast { height: 100%; width: auto; flex: 0 0 auto; margin: 0 -5px; fill: #060509; stroke: #060509; overflow: visible; transform-origin: 50% 100%; scale: var(--s, 1); }
.lw-publikum .gast .krug rect { fill: #24170c; stroke: #060509; }
.lw-buehne:not(.spar) .lw-publikum .gast { filter: drop-shadow(0 -1px 0 rgba(224,160,70,.28)); }
@media (max-width: 560px) { .lw-publikum .gast:nth-child(3n) { display: none; } }
.lw-buehne[data-pub="duck"] .lw-publikum { transform: translateY(42%); }
.lw-buehne[data-pub="duck"] .lw-publikum .gast { animation: lwspaehen 6s ease-in-out infinite; animation-delay: calc(var(--i) * -1.7s); }
@keyframes lwspaehen { 0%, 70%, 100% { transform: none; } 78%, 88% { transform: translateY(-30%); } }
.lw-buehne[data-pub="wiegen"] .lw-publikum .gast { animation: lwwiegen3 3.4s ease-in-out infinite alternate; animation-delay: calc(var(--i) * -.45s); }
@keyframes lwwiegen3 { from { transform: rotate(-5deg); } to { transform: rotate(5deg); } }
.lw-buehne[data-pub="still"] .lw-publikum { opacity: .85; }
.lw-gaeste { position: absolute; inset: 0; pointer-events: none; }
.lw-gast { position: absolute; bottom: var(--gast-unten, 5%); height: calc(62% * var(--gast-s, 1)); width: auto; aspect-ratio: 90 / 140; opacity: 0; visibility: hidden; transition: transform 1s cubic-bezier(.3,.8,.3,1), opacity .8s, visibility 0s 1s; overflow: visible; }
.lw-gast.seite-l { left: calc(1.5% + var(--slot, 0) * var(--gs, 8%)); transform: translateX(-170%); }
.lw-gast.seite-r { right: calc(1.5% + var(--slot, 0) * var(--gs, 8%)); transform: translateX(170%); }
.lw-gast.da { opacity: 1; transform: none; visibility: visible; transition-delay: 0s; }
.lw-gast.solo:not(.geist) { filter: drop-shadow(0 0 7px rgba(255,214,130,.85)); }
.lw-gast.solo { z-index: 2; }
.lw-gast.geist { filter: saturate(.5) brightness(1.25) drop-shadow(0 0 6px rgba(150,210,255,.9)); }
.lw-gast.geist.da { opacity: .62; animation: lwgeistschweben 2.8s ease-in-out infinite alternate; }
@keyframes lwgeistschweben { from { translate: 0 0; } to { translate: 0 -7px; } }
.lw-gast g, .lw-gast path, .lw-gast ellipse { transform-box: fill-box; transform-origin: 50% 100%; }
.lw-gast .mund { transform-origin: 50% 50%; }
.lw-note.gast { font-size: 1.1rem; color: #ffe7a0; }
.lw-note.gastname { font-size: .95rem; white-space: nowrap; }
.lw-gaeste-zeile { display: flex; flex-wrap: wrap; align-items: center; gap: .35rem; }
.lw-gz-auf { border: 1px solid var(--line); background: none; color: var(--ash); font: inherit; font-size: .85rem; width: 2rem; height: 2rem; border-radius: 50%; cursor: pointer; }
.lw-gz-auf:hover { color: var(--ember); border-color: var(--ember); }
.lw-gz-liste { flex-basis: 100%; display: flex; flex-wrap: wrap; gap: .3rem; }
.lw-gz-liste.aus { opacity: .45; }
.lw-gchip { border: 1px solid var(--line); background: rgba(16,14,21,.6); color: var(--ash); font: inherit; font-size: .8rem; padding: .28rem .55rem; cursor: pointer; white-space: nowrap; border-radius: 999px; text-decoration: line-through; opacity: .6; }
.lw-gchip.ein { color: var(--vellum); border-color: rgba(224,160,70,.5); text-decoration: none; opacity: 1; }
.lw-gchip.spielt { box-shadow: 0 0 0 1px var(--ember), 0 0 10px rgba(224,160,70,.45); }
.lw-gchip.geist.spielt { box-shadow: 0 0 0 1px #9fd8ff, 0 0 10px rgba(150,210,255,.5); }
.lw-fx-licht { position: absolute; inset: 0; opacity: 0; pointer-events: none; z-index: 2; }
.lw-fx { position: absolute; inset: 0; pointer-events: none; overflow: hidden; z-index: 3; }
.lw-t { position: absolute; pointer-events: none; line-height: 1; will-change: transform, opacity; }
.lw-t svg { display: block; width: 100%; height: 100%; }
.lw-t.konfetti { width: 7px; height: 11px; }
.lw-t.funke { width: 4px; height: 4px; border-radius: 50%; background: #fff3c4; box-shadow: 0 0 6px 1px #ffc35a; }
.lw-t.staub { width: 16px; height: 16px; border-radius: 50%; background: radial-gradient(circle, rgba(190,170,140,.6), transparent 70%); }
.lw-t.glut { width: 6px; height: 6px; border-radius: 50%; background: #ffcf6a; box-shadow: 0 0 8px 2px #ff5a2e; }
.lw-t.rauch { width: 40px; height: 40px; margin: -20px; border-radius: 50%; background: radial-gradient(circle, rgba(120,110,115,.6), transparent 70%); }
.lw-t.wolke { width: 30px; height: 30px; margin: -15px; border-radius: 50%; background: radial-gradient(circle, rgba(150,210,90,.7), transparent 70%); }
.lw-t.funkel { color: #ffe7a0; font-size: 15px; text-shadow: 0 0 8px currentColor; }
.lw-t.funkel.lila { color: #d4b0ff; } .lw-t.funkel.gruen { color: #a6ffc0; } .lw-t.funkel.gold { color: #ffd27a; }
.lw-t.funkel:empty { width: 5px; height: 5px; border-radius: 50%; background: currentColor; box-shadow: 0 0 8px 2px currentColor; }
.lw-t.muenze { width: 13px; height: 13px; border-radius: 50%; background: radial-gradient(circle at 35% 35%, #fff2b8, #e0aa3e 55%, #8a6216); box-shadow: 0 0 0 1px #6b4a10, 0 0 6px rgba(255,210,120,.5); }
.lw-t.symbol { font-size: 2.1rem; margin: -1rem; } .lw-t.gross-sym { font-size: 3.2rem; }
.lw-t.herz { font-size: 1.1rem; }
.lw-t.gross { font-family: var(--display, Georgia, serif); font-size: clamp(2.2rem, 8vw, 4rem); font-weight: 700; white-space: nowrap; letter-spacing: .03em; text-shadow: 0 3px 0 #000, 0 0 22px currentColor; }
.lw-t.gross.gold { color: #ffd27a; } .lw-t.gross.rot { color: #ff6a55; } .lw-t.gross.gruen { color: #86ffa8; } .lw-t.gross.klein { font-size: clamp(1.5rem, 5.5vw, 2.8rem); }
.lw-t.hieb { width: 42%; height: 3px; background: linear-gradient(90deg, transparent, #fff 40%, #fff 70%, transparent); box-shadow: 0 0 14px 2px rgba(255,255,255,.8); transform-origin: 0 50%; border-radius: 50%; }
.lw-t.pfeil { width: 54px; height: 2px; background: linear-gradient(90deg, #8a6a3a, #d8c49a); }
.lw-t.pfeil::after { content: ""; position: absolute; right: -8px; top: -4px; border-left: 9px solid #e6e6ea; border-top: 5px solid transparent; border-bottom: 5px solid transparent; }
.lw-t.pfeil::before { content: ""; position: absolute; left: -2px; top: -4px; width: 10px; height: 10px; background: linear-gradient(135deg, transparent 45%, #b5463a 46%, #b5463a 54%, transparent 55%), linear-gradient(45deg, transparent 45%, #b5463a 46%, #b5463a 54%, transparent 55%); }
.lw-t.tuerlicht { left: 0; top: 0; width: 45%; height: 100%; background: linear-gradient(90deg, rgba(255,222,160,.7), transparent); transform-origin: 0 50%; clip-path: polygon(0 20%, 100% 0, 100% 100%, 0 80%); }
.lw-t.drache { width: clamp(150px, 32%, 280px); fill: #050308; stroke: #050308; filter: drop-shadow(0 0 12px rgba(255,90,30,.45)); }
.lw-t.drache .drachen-fluegel { transform-box: fill-box; transform-origin: 50% 100%; animation: lwfluegel .42s ease-in-out infinite alternate; }
@keyframes lwfluegel { to { transform: scaleY(-.55); } }
.lw-t.w20 { width: clamp(32px, 6vw, 46px); height: clamp(32px, 6vw, 46px); filter: drop-shadow(0 3px 3px rgba(0,0,0,.6)); }
.lw-t.strahlen { left: 0 !important; top: 0 !important; width: 100%; height: 100%; mix-blend-mode: screen; }
.lw-t.blitzstrahl { width: 14%; height: 72%; filter: drop-shadow(0 0 8px #bcd6ff); }
.lw-t.spot { width: 46%; height: 100%; margin-left: -23%; background: radial-gradient(ellipse 50% 100% at 50% 0, rgba(255,236,180,.55), transparent 80%); mix-blend-mode: screen; }
.lw-t.stern-kreis { color: #ffe066; font-size: 21px; text-shadow: 0 0 6px #ffb300; }
.lw-note.zzz { color: #bcd0ff; font-family: var(--hand); font-size: 1.3rem; text-shadow: 0 0 8px rgba(150,180,255,.6); }
.lw-note.zzz.gross-z { font-size: 2rem; }
.lw-note.zirp { color: #a9c9a4; font-size: .95rem; font-style: italic; }
.lw-pult-gitter button, .lw-effekte button, .lw-vorlagen button { position: relative; }
.lw-pult-gitter button:has(.lw-pin) { padding-right: 1.2rem; }
.lw-pin { position: absolute; top: 0; right: 0; bottom: 0; width: 1.3rem; display: flex; align-items: center; justify-content: center; cursor: pointer; }
.lw-pin::after { content: ""; width: .5rem; height: .5rem; border-radius: 50%; border: 1px solid rgba(224,160,70,.45); transition: transform .15s, background .15s; }
.lw-pin:hover::after { border-color: var(--ember); transform: scale(1.3); }
.lw-pin.an::after { background: var(--ember); border-color: var(--ember); box-shadow: 0 0 6px rgba(224,160,70,.6); }
button.an > .lw-pin::after { border-color: rgba(16,14,21,.5); }
button.an > .lw-pin.an::after { background: var(--night); border-color: var(--night); box-shadow: none; }
button:has(> .lw-pin.an) { border-color: rgba(224,160,70,.55); }
@media (prefers-reduced-motion: reduce) { .lw-buehne *, .lw-buehne *::before, .lw-buehne *::after { animation: none !important; } }
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
.lw-trenner { grid-column: 1 / -1; margin: .5rem 0 0; font-size: .78rem; letter-spacing: .08em; color: var(--ash); }
.lw-pult-gitter [data-sfx].spielt, .lw-pult-fx [data-sfx].spielt { border-color: var(--ember); background: rgba(224,160,70,.2); color: var(--ember); }
.lw-pult-gitter [data-sfx].spielt::after, .lw-pult-fx [data-sfx].spielt::after { content: " ■"; font-size: .8em; }
.lw-ausklang { border: 1px solid var(--line); background: none; color: var(--vellum); font: inherit; padding: .55rem 1rem; cursor: pointer; }
.lw-ausklang:hover:not(:disabled) { border-color: var(--ember); color: var(--ember); }
.lw-ausklang:disabled { opacity: .5; cursor: default; }
.lw-feld { display: grid; gap: .2rem; font-size: .78rem; letter-spacing: .06em; color: var(--ash); }
.lw-feld b { color: var(--vellum); font-weight: 600; }
.lw-feld select { font: inherit; font-size: .9rem; letter-spacing: 0; background: var(--night); color: var(--vellum); border: 1px solid var(--line); padding: .35rem .5rem; }
.lw-regler input { width: 8.5rem; accent-color: #e0a046; }
.lw-schalter { border: 1px solid var(--line); background: none; color: var(--ash); font: inherit; font-size: .85rem; padding: .4rem .8rem; cursor: pointer; border-radius: 999px; }
.lw-schalter[aria-pressed="true"] { border-color: var(--ember); color: var(--ember); }
.lw-schalter[aria-pressed="true"]::before { content: "✓ "; }
.lw-teile { display: flex; flex-wrap: wrap; align-items: end; gap: .5rem .7rem; }
.lw-teilgruppe { display: inline-flex; flex-wrap: wrap; align-items: center; gap: .5rem .7rem; }
.lw-teilknoepfe { display: inline-flex; flex-wrap: nowrap; gap: .5rem; }
.lw-teile-label { font-size: .78rem; letter-spacing: .06em; color: var(--ash); align-self: center; }
.lw-teil { position: relative; width: 2.6rem; height: 2.3rem; border: 1px solid var(--line); background: none; color: var(--vellum); font-family: var(--display); font-size: 1.15rem; cursor: pointer; }
.lw-teil.leer { color: var(--ash); border-style: dashed; }
.lw-teil::before { content: ""; position: absolute; left: 3px; right: 3px; bottom: 2px; height: 3px; border-radius: 2px; background: var(--rf, transparent); opacity: .85; }
.lw-teil.r-i { --rf: #8a8f9a; } .lw-teil.r-s { --rf: #6fa6d8; } .lw-teil.r-v { --rf: #d8b25a; } .lw-teil.r-r { --rf: #e07a46; } .lw-teil.r-b { --rf: #9a7ad8; } .lw-teil.r-h { --rf: #e64a5a; }
.lw-teilknoepfe { flex-wrap: wrap !important; max-width: 100%; }
.lw-ablauf input { width: min(22rem, 100%); font: inherit; font-family: var(--mono, monospace); letter-spacing: .08em; text-transform: uppercase; }
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
.lw-klangwelt-titel { flex: 1 1 100%; margin-top: .3rem; font-size: .85rem; color: var(--ash); }
.lw-stimm-mix { flex: 1 1 100%; display: flex; flex-wrap: wrap; gap: .5rem 1rem; align-items: flex-end; margin-top: .4rem; }
.lw-intensitaet input { width: 100%; accent-color: #c0502a; }
.lw-master input, .lw-hallregler input, .lw-kulregler input { width: 7rem; }
.lw-vorlagen button.wartet { border-color: var(--ember); color: var(--ember); animation: lwpuls 1s ease-in-out infinite; }
.lw-effekte button.blitz, .lw-pult-fx button.blitz { animation: lwblitz .5s ease-out; }
@keyframes lwblitz { 0% { background: var(--ember); color: var(--night); } }
/* Konsole: Musik links, Kulisse & Effekte rechts – auf schmalen Bildschirmen untereinander */
.lw-konsole { display: grid; grid-template-columns: 1fr 1fr; gap: .7rem; align-items: start; margin: .2rem 0 .9rem; }
@media (max-width: 760px) { .lw-konsole { grid-template-columns: 1fr; } }
.lw-box { display: grid; gap: .55rem; padding: .75rem .8rem; border: 1px solid var(--line); background: rgba(235,226,204,.025); min-width: 0; }
.lw-box h4 { margin: 0; font-family: var(--body); font-size: .72rem; font-weight: 600; letter-spacing: .18em; text-transform: uppercase; color: var(--ember); }
.lw-box-kopf { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: .4rem .8rem; }
.lw-tabs { display: flex; gap: .25rem; flex-wrap: wrap; }
.lw-tabs button { border: 1px solid var(--line); border-radius: 999px; background: none; color: var(--ash); font: inherit; font-size: .8rem; padding: .25rem .7rem; cursor: pointer; }
.lw-tabs button[aria-selected="true"] { border-color: var(--ember); color: var(--night); background: var(--ember); }
.lw-box .lw-stimm-mix { margin-top: 0; }
.lw-box .lw-intensitaet { margin-top: 0; }
.lw-leer { grid-column: 1 / -1; margin: .2rem 0; }
.lw-eigene-zeile { display: flex; flex-wrap: wrap; gap: .4rem; align-items: center; }
.lw-kul-gitter button { padding-top: .4rem; padding-bottom: .4rem; font-size: .82rem; }
.lw-pultbanner { display: flex; align-items: center; gap: .9rem; width: 100%; text-align: left; margin: .2rem 0 1rem; padding: .85rem 1.1rem;
  border: 2px solid var(--ember); background: linear-gradient(100deg, rgba(224,160,70,.28), rgba(224,160,70,.08)); color: var(--vellum); font: inherit; cursor: pointer;
  box-shadow: 0 0 18px rgba(224,160,70,.18); transition: background .2s, transform .15s; }
.lw-pultbanner:hover { background: linear-gradient(100deg, rgba(224,160,70,.42), rgba(224,160,70,.14)); transform: translateY(-1px); }
.lw-pultbanner b { display: block; font-family: var(--display); font-size: 1.15rem; letter-spacing: .04em; color: var(--ember); }
.lw-pultbanner small { display: block; font-size: .85rem; color: var(--vellum); opacity: .85; margin-top: .15rem; }
.lw-pb-icon { font-size: 2rem; line-height: 1; }
.lw-pb-pfeil { margin-left: auto; font-size: 1.5rem; color: var(--ember); }
.lw-werkstatt { margin-top: .6rem; border-top: 1px dashed var(--line) !important; padding-top: 1rem !important; }
.lw-werkstatt h4 { margin: 0; }
.lw-werkknoepfe { display: grid; grid-template-columns: repeat(auto-fit, minmax(15rem, 1fr)); gap: 1rem; }
.lw-werkknopf { display: flex; align-items: center; gap: .9rem; text-align: left; padding: .95rem 1.1rem; min-height: 4.2rem;
  border: 2px solid rgba(235,226,204,.35); background: rgba(235,226,204,.05); color: var(--vellum); font: inherit; cursor: pointer; transition: background .2s, border-color .2s; }
.lw-werkknopf:hover { border-color: var(--ember); background: rgba(224,160,70,.1); }
.lw-werkknopf b { display: block; font-family: var(--display); font-size: 1.1rem; letter-spacing: .04em; color: var(--ember); }
.lw-werkknopf small { display: block; font-size: .85rem; opacity: .85; margin-top: .15rem; }
.lw-leerblatt { border-style: dashed; }
.lw-leerblatt.frage { border-color: var(--blood, #c4564a); border-style: solid; background: rgba(196,86,74,.14); }
.lw-leerblatt.frage small { color: #f0b0a6; opacity: 1; }
:not(.lw-pult) > .lw-werkstatt { margin: 0 0 1rem; border: 0 !important; padding: 0 !important; }
:not(.lw-pult) > .lw-werkstatt h4 { display: none; }
.lw-fxregler { margin-top: .6rem; }
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
/* Zuhörer per Link: nur das Lautenwerk zeigen */
body.lw-nur-zuhoeren #buehne .part-head, body.lw-nur-zuhoeren #buehne .bereich-weiter { display: none; }
.lw-diagnose { margin: 0 0 .4rem; font-size: .75rem; color: var(--ash); }
.lw-pult-titel { font-family: var(--name); font-size: 1.3rem; color: var(--vellum); flex: 1; }
.lw-pult-gitter { display: grid; grid-template-columns: repeat(auto-fill, minmax(6.6rem, 1fr)); gap: .35rem; }
.lw-pult-gitter button { border: 1px solid var(--line); background: rgba(16,14,21,.6); color: var(--vellum); font: inherit; font-size: .9rem; padding: .55rem .5rem; cursor: pointer; text-align: left; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.lw-pult-gitter button:hover { border-color: var(--ember); color: var(--ember); }
.lw-pult-gitter button.an { background: var(--ember); border-color: var(--ember); color: var(--night); }
.lw-pult-mix { display: flex !important; flex-wrap: wrap; align-items: end; gap: 1rem; }
.lw-pult-lieder { max-width: 100%; font-size: .9rem; padding: .45rem; }
@media (max-width: 560px) { .lw-pult-gitter { grid-template-columns: repeat(3, 1fr); } .lw-pult-gitter button { font-size: .8rem; padding: .55rem .35rem; } }
.lw-hallknopf { border: 1px solid var(--line); background: none; font-size: .78rem; line-height: 1; padding: .2rem .35rem; cursor: pointer; border-radius: 3px; opacity: .45; filter: grayscale(1); }
.lw-hallknopf[aria-pressed="true"] { opacity: 1; filter: none; border-color: rgba(224,160,70,.6); }
.lw-mini { display: inline-flex; align-items: center; gap: .35rem; margin-right: .6rem; padding: .15rem .25rem .15rem .55rem; border: 1px solid rgba(224,160,70,.6); border-radius: 999px; background: rgba(16,14,21,.7); }
.lw-mini[hidden], .lw-mini-knopf[hidden] { display: none; }
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
.lw-speicherform button { border: 1px solid var(--line); background: none; color: var(--vellum); font: inherit; font-size: .85rem; padding: .35rem .7rem; cursor: pointer; }
.lw-speicherform button:hover { border-color: var(--ember); color: var(--ember); }
.lw-stimmname { font: inherit; font-size: .85rem; background: var(--night); color: var(--vellum); border: 1px solid var(--ember); padding: .3rem .45rem; width: 14rem; max-width: 100%; }
.lw-eigene-zeile .lw-tipp { flex-basis: 100%; margin: .2rem 0 0; font-size: .78rem; }
.lw-liedname { font: inherit; font-size: .85rem; background: var(--night); color: var(--vellum); border: 1px solid var(--ember); padding: .25rem .45rem; width: 12rem; }
.lw-tipp { flex-basis: 100%; margin: .2rem 0 0; font-size: .8rem; font-style: italic; color: var(--ash); }

/* seitliches Wischen auf der Bühne darf nie zur Zurück-Geste des Browsers werden (die springt sonst auf die Startseite) */
.lw-scroll, .lw-tabs { overscroll-behavior-x: contain; }
html:has(#buehne.aktiv), html:has(#buehne.aktiv) body { overscroll-behavior-x: none; }
html.hl-tastatur .lw-leiste { bottom: max(.6rem, env(safe-area-inset-bottom)); }
#lautenwerk { touch-action: manipulation; }
.lw-scroll { overflow-x: auto; margin-inline: calc(-1 * clamp(1.2rem, 4vw, 2rem)); padding-inline: clamp(1.2rem, 4vw, 2rem); -webkit-overflow-scrolling: touch; }
.lw-raster { display: grid; grid-template-columns: 3.4rem repeat(16, minmax(1.75rem, 1fr)); gap: 3px; min-width: 36rem; }
.lw-raster.drei { grid-template-columns: 3.4rem repeat(12, minmax(1.75rem, 1fr)); min-width: 28rem; }
.lw-raster.halb { grid-template-columns: 3rem repeat(8, minmax(0, 1fr)); min-width: 0; gap: 5px; }
.lw-raster.drei.halb { grid-template-columns: 3rem repeat(6, minmax(0, 1fr)); }
.lw-raster.halb .lw-zelle { height: 2.6rem; border-radius: 6px; }
.lw-raster.halb ~ .lw-wisch, .lw-scroll:has(.lw-raster.halb) + .lw-wisch { display: none !important; }
.lw-rasterwahl { display: grid; gap: .5rem; margin: .4rem 0 .6rem; }
.lw-wer { display: flex; flex-wrap: wrap; gap: .3rem; }
.lw-wer::-webkit-scrollbar { display: none; }
.lw-wer button, .lw-haelfte button { flex: 0 0 auto; font: inherit; font-size: .88rem; padding: .5rem .8rem; border: 1px solid var(--line); background: none; color: var(--vellum); border-radius: 999px; cursor: pointer; }
.lw-wer button[aria-selected="true"], .lw-haelfte button[aria-pressed="true"] { border-color: var(--ember); background: rgba(224,160,70,.18); color: var(--ember); }
.lw-haelfte { display: grid; grid-template-columns: 1fr 1fr; gap: .4rem; }
.lw-haelfte button { position: relative; font-family: var(--display); font-size: 1.05rem; padding: .55rem; border-radius: 8px; }
.lw-haelfte button.spielt::after { content: ""; position: absolute; top: 6px; right: 8px; width: 7px; height: 7px; border-radius: 50%; background: #7fd36b; box-shadow: 0 0 6px #7fd36b; }
/* Querformat am Handy: Bühne links (bleibt stehen), Pult rechts */
@media (orientation: landscape) and (max-height: 540px) {
  #lautenwerk.lw-pultmodus { display: grid; grid-template-columns: minmax(0, 44%) minmax(0, 1fr); column-gap: 1rem; align-items: start; }
  #lautenwerk.lw-pultmodus > * { grid-column: 2; min-width: 0; }
  #lautenwerk.lw-pultmodus > .lw-buehne { grid-column: 1; grid-row: 1 / span 40; position: sticky; top: 4rem; height: min(62vh, 260px); margin-inline: 0; width: auto; }
  #lautenwerk.lw-pultmodus .lw-pult-gitter { grid-template-columns: repeat(auto-fill, minmax(6.4rem, 1fr)); }
  #lautenwerk.lw-pultmodus .lw-konsole { grid-template-columns: 1fr; }
  #lautenwerk.lw-pultmodus .lw-pult-kopf { flex-wrap: wrap; }
}
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
.lw-pult-gitter .ki { margin-right: .3em; }
@media (max-width: 560px) {
  .lw-pult-gitter { grid-template-columns: repeat(3, minmax(0, 1fr)); gap: .3rem; }
  .lw-pult-gitter button { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: .15rem; text-align: center; padding: .45rem .25rem .4rem; min-height: 3.6rem; white-space: normal; }
  .lw-pult-gitter button:has(.lw-pin) { padding-right: .25rem; }
  .lw-pult-gitter .ki { margin: 0; font-size: 1.35rem; line-height: 1; }
  .lw-pult-gitter .kt { font-size: .74rem; line-height: 1.15; max-width: 100%; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; word-break: break-word; hyphens: auto; }
  .lw-pult-gitter .lw-pin { bottom: auto; height: 1.4rem; width: 1.4rem; }
  .lw-pult-gitter [data-sfx].spielt::after { position: absolute; left: .3rem; top: .2rem; }
  .lw-tabs { flex-wrap: nowrap; overflow-x: auto; scrollbar-width: none; -webkit-overflow-scrolling: touch; margin-inline: -.2rem; padding: 0 .2rem .1rem; }
  .lw-tabs::-webkit-scrollbar { display: none; }
  .lw-tabs button { flex: 0 0 auto; }
}
.lw-einst { border-top: 1px solid var(--line); padding-top: .45rem; display: grid; gap: .5rem; }
.lw-zk-reihe { display: grid; grid-template-columns: 1fr 1fr; gap: .5rem; }
.lw-zk-knopf { display: flex; flex-direction: column; align-items: flex-start; gap: .1rem; border: 1px solid var(--line) !important; border-radius: 10px; padding: .45rem .6rem !important; background: rgba(16,14,21,.45) !important; min-height: 2.9rem; }
.lw-zk-knopf small { font-size: .75rem; color: var(--ash); }
.lw-zk-knopf.auf { border-color: var(--ember) !important; color: var(--ember); }
.lw-zk-titel { white-space: nowrap; }
.lw-einst-kopf { background: none; border: 0; color: var(--ash); font: inherit; font-size: .85rem; text-align: left; padding: .2rem 0; cursor: pointer; }
.lw-einst-kopf:hover, .lw-einst.auf .lw-einst-kopf { color: var(--ember); }
.lw-kopf-rechts { display: inline-flex; gap: .4rem; margin-left: auto; flex-wrap: wrap; justify-content: flex-end; }
.lw-funk-knopf.an { border-color: var(--ember); color: var(--ember); }
.lw-klangwelten { text-decoration: none; display: inline-flex; align-items: center; }
.lw-pult-titel { position: relative; display: inline-flex; flex-direction: column; flex: 1 1 9rem; min-width: 0; padding-bottom: .3rem; }
.lw-titel-name { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
html.lw-leiste-da #lautenwerk { padding-bottom: 5rem; }
html.lw-leiste-da body { padding-bottom: 4.6rem; }
.ll-einst { width: 2.2rem; height: 2.2rem; flex: 0 0 auto; border-radius: 50%; border: 1px solid var(--line); background: none; color: var(--vellum); font-size: 1rem; }
.ll-einst[aria-expanded="true"] { border-color: var(--ember); color: var(--ember); }
.ll-panel { position: absolute; right: 0; bottom: calc(100% + .5rem); width: min(22rem, 100%); display: grid; gap: .55rem; padding: .8rem .9rem; border: 1px solid rgba(224,160,70,.55); border-radius: 16px; background: rgba(16,14,21,.97); box-shadow: 0 8px 28px rgba(0,0,0,.55); }
.ll-panel[hidden] { display: none; }
.ll-knoepfe { display: flex; flex-wrap: wrap; gap: .4rem; }
.ll-knoepfe [hidden] { display: none; }
.lw-titel-naechste, .ll-naechste { font-size: .78rem; color: var(--ember); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.lw-titel-naechste:empty, .ll-naechste:empty { display: none; }
.lw-wechselbalken { position: absolute; left: 0; right: 0; bottom: 0; height: 2px; background: var(--ember); transform-origin: 0 50%; transform: scaleX(0); opacity: 0; transition: opacity .4s; border-radius: 2px; }
.wechselt > .lw-wechselbalken { opacity: 1; }
.lw-leiste { position: fixed; left: 50%; bottom: max(.6rem, env(safe-area-inset-bottom)); transform: translateX(-50%); z-index: 60; width: min(40rem, calc(100% - 1.2rem)); display: flex; align-items: center; gap: .45rem; padding: .4rem .5rem; border: 1px solid rgba(224,160,70,.55); border-radius: 999px; background: rgba(16,14,21,.94); box-shadow: 0 8px 28px rgba(0,0,0,.55); backdrop-filter: blur(6px); animation: lwleisteein .25s ease-out; }
.lw-leiste[hidden] { display: none; }
@keyframes lwleisteein { from { transform: translate(-50%, 120%); opacity: 0; } }
/* am Handy liegt unten die Navigationsleiste der Seite – die Musikleiste schwebt darüber */
@media (max-width: 760px) { .lw-leiste { bottom: calc(66px + env(safe-area-inset-bottom, 0px)); } html.lw-leiste-da body { padding-bottom: calc(126px + env(safe-area-inset-bottom, 0px)); } }
.lw-leiste button { font: inherit; cursor: pointer; }
.ll-play { width: 2.6rem; height: 2.6rem; flex: 0 0 auto; border-radius: 50%; border: 1px solid var(--ember); background: var(--ember); color: var(--night); font-size: 1rem; }
.ll-play.laeuft { background: none; color: var(--ember); }
.ll-aus { width: 2.3rem; height: 2.3rem; flex: 0 0 auto; border-radius: 50%; border: 1px solid var(--line); background: none; color: var(--vellum); }
.ll-aus[hidden] { display: none; }
.ll-aus:disabled { opacity: .4; }
.ll-titel { position: relative; flex: 1; min-width: 0; display: flex; flex-direction: column; padding-bottom: .25rem; }
.ll-name { color: var(--vellum); font-size: .92rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ll-int { display: inline-flex; align-items: center; gap: .2rem; flex: 0 0 auto; }
.ll-int[hidden] { display: none; }
.ll-int button { width: 2rem; height: 2rem; border-radius: 50%; border: 1px solid var(--line); background: none; color: var(--vellum); font-size: 1.05rem; line-height: 1; }
.ll-int button:hover { border-color: var(--ember); color: var(--ember); }
.ll-wert { font-weight: 400; font-size: .76rem; color: var(--ash); min-width: 3.6rem; text-align: center; white-space: nowrap; }
@media (max-width: 420px) { .ll-wert { min-width: 0; font-size: .7rem; } }
.lw-modus { display: flex; flex-wrap: wrap; align-items: center; gap: .4rem .5rem; margin: 1rem 0 .7rem; }
.lw-modus button { font: inherit; font-size: .92rem; padding: .45rem .85rem; border: 1px solid var(--line); background: none; color: var(--vellum); cursor: pointer; border-radius: 999px; }
.lw-modus button[aria-pressed="true"] { border-color: var(--ember); background: rgba(224,160,70,.18); color: var(--ember); }
.lw-modus-tipp { flex: 1 1 14rem; font-size: .8rem; color: var(--ash); }
.lw-liedkarte { display: flex; flex-wrap: wrap; gap: .5rem; align-items: center; padding: .9rem 1rem; margin-bottom: 1rem; border: 1px dashed rgba(224,160,70,.55); border-radius: 12px; background: rgba(224,160,70,.06); }
.lw-liedkarte p { flex: 1 1 100%; margin: 0 0 .3rem; color: var(--vellum); font-size: .92rem; }
.lw-mitspieler { margin: .55rem 0 .25rem; display: flex; flex-direction: column; gap: .35rem; }
.lw-ms-kopf { display: flex; flex-wrap: wrap; align-items: center; gap: .4rem .5rem; }
.lw-ms-titel { font-size: .9rem; color: var(--vellum); white-space: nowrap; }
.lw-ms-stufen { display: flex; border: 1px solid var(--line); border-radius: 999px; overflow: hidden; flex: 1 1 100%; }
.lw-ms-stufen button { flex: 1 1 0; border: 0; background: rgba(16,14,21,.6); color: var(--ash); font: inherit; font-size: .82rem; padding: .45rem .5rem; min-height: 2.3rem; cursor: pointer; white-space: nowrap; }
.lw-ms-stufen button + button { border-left: 1px solid var(--line); }
.lw-ms-stufen button[aria-pressed="true"] { background: var(--ember); color: var(--night); font-weight: 600; }
.lw-ms-fuss { display: flex; align-items: center; gap: .4rem; }
.lw-ms-fuss .lw-ms-wer { flex: 1; }
.lw-ms-einzeln { width: auto !important; border-radius: 999px !important; padding: 0 .7rem; white-space: nowrap; }
.lw-ms-wer { font-size: .8rem; color: var(--ash); line-height: 1.35; }
.lw-ms-wer i { color: var(--ember); font-style: normal; }
.lw-ms-liste { display: flex; flex-direction: column; gap: .45rem; padding: .5rem .6rem; border: 1px solid var(--line); border-radius: 10px; background: rgba(16,14,21,.35); }
.lw-ms-gruppe { display: flex; flex-wrap: wrap; align-items: center; gap: .3rem .5rem; }
.lw-ms-klein { font-size: .75rem; color: var(--ash); }
.lw-ms-liste .lw-gz-liste { margin-top: .1rem; }
@media (max-width: 420px) { .lw-ms-stufen { flex-basis: 100%; max-width: none; order: 3; } }
.lw-kapelle-zeile { display: flex; flex-wrap: wrap; align-items: center; gap: .4rem .6rem; margin: .5rem 0 .2rem; }
.lw-kap-namen { flex: 1 1 10rem; font-size: .82rem; color: var(--vellum); }
.lw-klappe { display: flex; justify-content: space-between; align-items: center; width: 100%; margin: .55rem 0 0; padding: .6rem .8rem; border: 1px solid var(--line); border-radius: 10px; background: rgba(235,226,204,.03); color: var(--vellum); font: inherit; font-size: .9rem; cursor: pointer; text-align: left; }
.lw-klappe:hover, .lw-klappe[aria-expanded="true"] { border-color: var(--ember); color: var(--ember); }
.lw-klappe + .lw-klappe { margin-top: .45rem; }
.lw-kleinregler { display: flex; align-items: center; gap: .6rem; font-size: .82rem; color: var(--ash); }
.lw-kleinregler span { flex: 0 0 auto; white-space: nowrap; }
.lw-kleinregler input { flex: 1 1 auto; min-width: 4rem; max-width: 16rem; accent-color: var(--ember); }
.lw-kleinregler b { flex: 0 0 2.6rem; text-align: right; color: var(--vellum); font-weight: 600; font-size: .8rem; }
.lw-buehne .lw-figur, .lw-buehne .lw-geister { transform: translateX(var(--band-x, 0%)) scale(var(--band-s, 1)); transform-origin: 50% 100%; transition: transform 1.1s cubic-bezier(.4,.1,.3,1); }
.lw-tour { position: fixed; inset: 0; z-index: 10000; }
.lw-tour-loch { position: fixed; border-radius: 12px; box-shadow: 0 0 0 200vmax rgba(6,4,8,.72), 0 0 0 2px var(--ember), 0 0 24px rgba(224,160,70,.45); transition: left .3s ease, top .3s ease, width .3s ease, height .3s ease; pointer-events: none; }
.lw-tour-blase { position: fixed; width: min(22rem, calc(100vw - 20px)); background: #1b151e; border: 1px solid var(--ember); border-radius: 12px; padding: .8rem .95rem .7rem; box-shadow: 0 12px 34px rgba(0,0,0,.6); color: var(--vellum); transition: top .3s ease, left .3s ease; outline: none; }
.lw-tour-blase h4 { margin: .1rem 0 .3rem; font-size: 1.1rem; color: var(--ember); }
.lw-tour-blase p { margin: 0 0 .5rem; font-size: .95rem; line-height: 1.45; }
.lw-tour-blase .lw-tour-nr { font-size: .75rem; color: var(--ash); margin: 0; }
.lw-tour-knoepfe { display: flex; align-items: center; gap: .4rem; }
.lw-tour-knoepfe span { flex: 1; }
.lw-tour-weiter { border: 1px solid var(--ember); background: var(--ember); color: var(--night); font: inherit; font-size: .9rem; padding: .4rem .9rem; border-radius: 999px; cursor: pointer; }
.lw-rundgang-knopf.neu { border-color: var(--ember); color: var(--ember); animation: lwpuls 1.6s ease-in-out 4; }
.lw-info { border: 1px solid var(--line); background: none; color: var(--ash); width: 1.35rem; height: 1.35rem; border-radius: 50%; font-size: .78rem; line-height: 1; padding: 0; cursor: pointer; vertical-align: middle; font-family: inherit; font-weight: 400; letter-spacing: 0; text-transform: none; }
.lw-info:hover, .lw-info[aria-expanded="true"] { color: var(--ember); border-color: var(--ember); }
.lw-info-blase { position: absolute; z-index: 9999; max-width: min(19rem, calc(100vw - 20px)); background: #1b151e; border: 1px solid rgba(224,160,70,.6); border-radius: 10px; padding: .55rem .7rem; font-size: .88rem; line-height: 1.4; color: var(--vellum); box-shadow: 0 8px 24px rgba(0,0,0,.55); }
@media (prefers-reduced-motion: reduce) { .lw-tour-loch, .lw-tour-blase { transition: none; } .lw-rundgang-knopf.neu { animation: none; } }
`;
  /* Requisiten: nur das gewählte Instrument ist sichtbar */
  css.textContent += ".lw-figur .req { display: none; }\n" +
    KULISSEN.map(k => '.lw-buehne[data-kul="' + k + '"] .bg-' + k + ' { display: inline; }').join("\n") + "\n" +
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
  if (hoerer) document.body.classList.add("lw-nur-zuhoeren");
  /* ältere Links zeigten auf die Taverne – das Lautenwerk wohnt jetzt auf der Bühne */
  if ((hoerer || ausLink) && location.hash !== "#lautenwerk") { try { location.replace(location.pathname + location.search + "#lautenwerk"); } catch (_) {} }
  if (ausLink) {
    setTimeout(() => {
      root.scrollIntoView({ block: "start" });
      status(t().geladen);
    }, 400);
  }
})();
