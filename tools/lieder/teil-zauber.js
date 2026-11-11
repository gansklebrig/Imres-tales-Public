/* Gruppe „zauber“: elben, fey, gaukler, sternenhimmel */
module.exports = {
  elben: [
    // Mondwalzer: Terz-Quint-Aufstieg, lydische II (Stufe 1) als schimmernde Antwort
    { titel: "Silberlaub im Mondlicht", modus: "lydisch", takt: 12, tempo: 64, schlag: "walzer", bass: { i: "orgel", s: "halbe", r: "halbe", b: "orgel", h: "viertel" },
      intro: ["000", "0...4...7..."],
      strophe: [["000", "4.....2.4..."], ["111", "3.......5.3."], ["000", "2...4...7..."], ["444", "6.......4..."]],
      refrain: [["000", "7...b...9..."], ["111", "a...8...5.6."], ["000", "7...b...9.c."], ["444", "b...8...6..."]],
      bruecke: [["555", "c.......e...", "5...7...9..."], ["333", "a.......c...", "3...5...7..."]],
      schluss: ["440", "b...8...7..."] },
    // Hymne der Hallen: ganze und halbe Noten, plagale Schlüsse (3 → 0) wie ein Chor im Gewölbe
    { titel: "Die Hallen von Ithilwen", modus: "ionisch", tempo: 62, schlag: "ruhig", bass: "orgel",
      intro: ["0000", "7.......4......."],
      strophe: [["0000", "4.......5...4..."], ["3333", "5.......7...5..."], ["5555", "5.......4...2..."], ["4444", "4.......6...4..."]],
      refrain: [["0000", "7.......9...b..."], ["3333", "a.......c...a.9."], ["0000", "7.......9...b.c."], ["3300", "c...a...9...7..."]],
      bruecke: [["5555", "c...........e...", "5...7...9...7..."], ["1111", "c.......a.......", "1...3...5...3..."]],
      schluss: ["3300", "a.......7.......", "terz"] },
    // Harfenlichtung: Strophe als gebrochene Akkorde, Refrain singt darüber mit der lydischen Quarte
    { titel: "Lichtung der Erstgeborenen", modus: "lydisch", tempo: 66, schlag: "sanft", instrument: "harfe", bass: { i: "orgel", s: "orgel", r: "halbe", b: "orgel", h: "halbe" },
      intro: ["0000", "0.4.7.4.0.4.7.4."],
      strophe: [["0000", "2.4.7.4.2.4.7.4."], ["1111", "3.5.8.5.3.5.8.5."], ["0000", "4.7.9.7.4.7.9.7."], ["4444", "6.8.b.8.6...4..."]],
      refrain: [["0000", "9...b.a.9...7..."], ["1111", "a...8.a.c...a..."], ["0000", "9...b.a.9...b..."], ["4400", "b...8...7......."]],
      bruecke: [["5555", "c.......e.......", "5.7.9.c.9.7.5.7."], ["3333", "a.......c.......", "3.5.7.a.7.5.3.5."]] },
    // Erwachender Baum: drei Töne steigen auf und bleiben liegen, Sequenz Stufe um Stufe
    { titel: "Der Weiße Baum erwacht", modus: "ionisch", takt: 12, tempo: 60, schlag: "walzer", bass: { i: "orgel", s: "orgel", r: "halbe", b: "orgel", h: "halbe" },
      intro: ["000", "7...4...0..."],
      strophe: [["000", "2.3.4......."], ["333", "3.4.5......."], ["444", "4.5.6......."], ["000", "4...2...4..."]],
      refrain: [["000", "7.8.9......."], ["555", "9.8.7...5..."], ["000", "7.8.9...b..."], ["444", "b.a.8...6..."]],
      bruecke: [["333", "a...........", "3.5.7.a.7.5."], ["444", "b.......d...", "4.6.8.b.8.6."]],
      schluss: ["440", "b...8...7..."] },
    // Seufzer der Laubharfe: Wechselton-Motiv um die Quinte (4-3-4), lydisch gefärbt
    { titel: "Laubharfe", modus: "lydisch", takt: 12, tempo: 68, schlag: "walzer", bass: "halbe",
      intro: ["000", "4.3.4...0..."],
      strophe: [["000", "4.3.4...2..."], ["111", "5.3.1...3..."], ["000", "7.6.4...2..."], ["444", "6.5.4...1..."]],
      refrain: [["000", "b.a.b...9..."], ["111", "c.a.8...a..."], ["000", "b.a.b...e..."], ["444", "d.b.8...b..."]],
      bruecke: [["555", "c.....9.....", "5.7.9.7.5.7."], ["111", "a.....c.....", "1.3.5.3.1.3."]],
      schluss: ["440", "b.a.8...7..."] },
    // Uralte Wächter: Liegeton und sparsame Pentatonik, viel Luft zwischen den Tönen
    { titel: "Schlafende Wächter des Waldes", modus: "ionisch", tempo: 60, schlag: "ruhig", bass: "orgel", bordun: 1,
      intro: ["0000", "0.......7......."],
      strophe: [["0000", "4.......2...4..."], ["0000", "7.......4......."], ["3333", "5.......3...5..."], ["0000", "4...........2..."]],
      refrain: [["0000", "9...b...9...7..."], ["3333", "a...c...a......."], ["0000", "9...b...9...b..."], ["4444", "b...8...b......."]],
      bruecke: [["5555", "c...............", "5...7...9...7..."], ["4444", "b...............", "4...6...8...6..."]],
      schluss: ["3300", "a...9...7.......", ""] },
    // Mondsilberbrücke: punktierter Ruf (7..9) pendelt zwischen I und lydischer II
    { titel: "Brücke aus Mondsilber", modus: "lydisch", tempo: 62, schlag: "sanft", bass: { i: "orgel", s: "halbe", r: "halbe", b: "orgel", h: "viertel" },
      intro: ["0011", "0..4....3......."],
      strophe: [["0011", "4..5....3..2...."], ["0000", "2..4....7......."], ["0011", "4..5....8..5...."], ["4444", "6..4....1......."]],
      refrain: [["0011", "7..9....a..8...."], ["0000", "9..b....e......."], ["0011", "7..9....a..c...."], ["4400", "b..8....7......."]],
      bruecke: [["5555", "c.......9.......", "5..7..9.c..9..7."], ["1111", "a.......8.......", "1..3..5.8..5..3."]] },
    // Graue Fähre: beginnt im Moll-Schatten (vi, iii), Refrain fällt aus der Höhe wie Abschiedslicht
    { titel: "Die graue Fähre", modus: "ionisch", takt: 12, tempo: 66, schlag: "walzer", bass: { i: "orgel", s: "halbe", r: "viertel", b: "orgel", h: "viertel" },
      intro: ["555", "5...2...0..."],
      strophe: [["555", "5...4...2..."], ["222", "4...6...4..."], ["333", "5...3...0..."], ["444", "4...6...1..."]],
      refrain: [["000", "e...b...9..."], ["555", "c...9...7..."], ["000", "e...b...9.b."], ["444", "d...b...8..."]],
      bruecke: [["222", "9.......b...", "2...4...6..."], ["333", "a.......c...", "3...5...7..."]],
      schluss: ["340", "a...8...7..."] },
    // Morgentau: synkopierter Refrain (.9..b) über perlenden Achteln der Zweitstimme
    { titel: "Elbenhain im Morgentau", modus: "lydisch", tempo: 68, schlag: "sanft", bass: "viertel",
      intro: ["0000", "0.4.7.9.7.4.2.4."],
      strophe: [["0000", "4...2.4.7......."], ["1111", "5...3.5.8......."], ["0000", "4...2.4.9...7..."], ["4444", "6...4.6.8...b..."]],
      refrain: [["0000", "7.9.9..b..a.9..."], ["1111", "8.a.a..c..b.a..."], ["0000", "7.9.9..b..c.e..."], ["4400", "d.b.8...7......."]],
      bruecke: [["5555", "c...............", "5.7.9.7.5.7.9.c."], ["3333", "a.......c.......", "3.5.7.5.3.5.7.a."]] },
    // Frage und Antwort: Ruf auf der Quinte, Antwort zur Tonika, letzter Refrain steigt zur Doppeloktave
    { titel: "Krone aus Birkenlicht", modus: "ionisch", tempo: 64, schlag: "ruhig", bass: { i: "orgel", s: "halbe", r: "halbe", b: "orgel", h: "halbe" },
      intro: ["0000", "4.......7......."],
      strophe: [["0000", "4...4.5.4...2..."], ["4444", "4...4.6.8...6..."], ["5555", "5...5.4.2...0..."], ["4444", "1...2...4......."]],
      refrain: [["0033", "7...9...a...c..."], ["4400", "b...8...9......."], ["0033", "7...9...a...e..."], ["4400", "d...b...7......."]],
      bruecke: [["5555", "9.......c.......", "5...4...2...0..."], ["1111", "a.......8.......", "1...3...5...8..."]],
      refrain2: [["0033", "e...c...a...c..."], ["4400", "b...d...9......."], ["0033", "e...c...a...e..."], ["4400", "d...b...7......."]] }
  ],
  fey: [
    // Irrlicht-Jig: hüpfende Dreiergruppen, die lydische II blinkt jeden zweiten Takt auf
    { titel: "Irrlichtreigen", modus: "lydisch", takt: 12, tempo: 112, schlag: "jig", bass: { i: "orgel", s: "halbe", r: "viertel", b: "halbe", h: "viertel" },
      intro: ["000", "0.24.27.47.4"],
      strophe: [["000", "4.54.27.97.4"], ["111", "5.65.38.a8.5"], ["000", "4.54.27.97.b"], ["444", "b.a8.6b.84.."]],
      refrain: [["000", "b.cb.97..9.."], ["111", "a.ba.85..8.."], ["000", "b.cb.97..e.."], ["440", "b.a8.67....."]],
      bruecke: [["555", "c.....e.....", "5.79.75.79.7"], ["333", "a.....c.....", "3.57.53.57.5"]] },
    // Pilzkreis: Terzen hüpfen auf und ab wie kleine Füße, Refrain springt eine Oktave höher
    { titel: "Der Pilzkreis bei Nacht", modus: "ionisch", tempo: 110, schlag: "tanz", bass: { i: "orgel", s: "viertel", r: "viertel", b: "halbe", h: "puls" },
      intro: ["0000", "0.2.4.2.0.2.4.7."],
      strophe: [["0000", "2.4.2.4.7...4..."], ["3333", "3.5.3.5.7...5..."], ["4444", "4.6.4.6.8...6..."], ["0000", "4.2.4.2.0......."]],
      refrain: [["0000", "9.7.9.b.e...b..."], ["4444", "8.6.8.b.d...b..."], ["0000", "9.7.9.b.e...b.c."], ["4400", "d.b.8.6.7......."]],
      bruecke: [["5555", "c...e...c.......", "5.9.7.9.5.9.7.9."], ["1111", "a...c...a...8...", "1.5.3.5.1.5.3.5."]] },
    // Kobold-Triller: Wechsel zwischen Quinte und übermäßiger Quarte, frech und flirrend
    { titel: "Tautropfenkobold", modus: "lydisch", tempo: 116, schlag: "treibend", bass: { i: "orgel", s: "puls", r: "viertel", b: "halbe", h: "puls" },
      intro: ["0000", "4.3.4.3.4.3.4..."],
      strophe: [["0000", "4.3.4...7...4..."], ["1111", "5.3.5...8...5..."], ["0000", "4.3.4...9...7..."], ["4444", "6.5.4...6...8..."]],
      refrain: [["0000", "b.a.b.a.9...7..."], ["1111", "c.a.c.a.8...a..."], ["0000", "b.a.b.a.9...b..."], ["4400", "d.c.b...7......."]],
      bruecke: [["2222", "9...b...d.......", "2.4.6.4.2.4.6.9."], ["1111", "a...c...8.......", "1.3.5.3.1.3.5.8."]] },
    // Winziger Hofstaat: höfische Drehfigur im Jig, als tanze eine Königin im Fingerhut
    { titel: "Feenkönigin im Fingerhut", modus: "ionisch", takt: 12, tempo: 108, schlag: "jig", bass: "halbe",
      intro: ["000", "7.97.42.42.0"],
      strophe: [["000", "7.97.42.42.0"], ["333", "5.75.33.53.0"], ["444", "6.86.44.64.1"], ["000", "2.42.07.42.."]],
      refrain: [["000", "9.b9.79..7.."], ["555", "9.c9.79..5.."], ["000", "9.b9.7b..e.."], ["440", "b.db.87....."]],
      bruecke: [["333", "a.....c.....", "3.53.53.57.5"], ["444", "b.....d.....", "4.64.64.68.6"]] },
    // Flatterlinie: kurze Sechzehntel-Wirbel, dann Stille – wie Flügelschläge
    { titel: "Schmetterlingsbote", modus: "lydisch", tempo: 114, schlag: "sanft", instrument: "glocken", bass: { i: "orgel", s: "halbe", r: "viertel", b: "orgel", h: "viertel" },
      intro: ["0000", "4565....2...4..."],
      strophe: [["0000", "4565....2...4..."], ["1111", "5675....3...5..."], ["0000", "4565....7...9..."], ["4444", "8...6...4...6..."]],
      refrain: [["0011", "9ab9....a...c..."], ["0000", "b...9...7...9..."], ["0011", "9ab9....a...8..."], ["4400", "b...8...7......."]],
      bruecke: [["5555", "c.......9.......", "5.7.9.c.9.7.5.7."], ["4444", "b.......8.......", "4.6.8.b.8.6.4.6."]] },
    // Kichern: Tonwiederholung mit kleinem Hüpfer nach oben, geswingt
    { titel: "Das Lachen im Brombeerstrauch", modus: "ionisch", tempo: 118, schlag: "tanz", swing: 1, bass: { i: "orgel", s: "viertel", r: "viertel", b: "halbe", h: "viertel" },
      intro: ["0000", "4.4.4.7.4......."],
      strophe: [["0000", "4.4.4.7.4...2..."], ["5555", "5.5.5.9.7...5..."], ["3333", "5.5.5.a.7...5..."], ["4444", "4.4.6.8.b...8..."]],
      refrain: [["0000", "9.9.9.e.b...9..."], ["5555", "c.c.c.e.c...9..."], ["0000", "9.9.9.e.b.c.e..."], ["4400", "b.d.b.8.7......."]],
      bruecke: [["3333", "a.......7.......", "3.5.7.5.3.5.7.a."], ["1111", "8.......a.......", "1.3.5.3.1.3.5.8."]] },
    // Dryaden-Jig über Liegeton: archaisch kreisende Figur, lydische II als Zauberfarbe
    { titel: "Mondtanz der Dryaden", modus: "lydisch", takt: 12, tempo: 110, schlag: "jig", bordun: 1, bass: "orgel",
      intro: ["000", "0.40.47.47.0"],
      strophe: [["000", "7.47.42.47.4"], ["111", "8.58.53.58.5"], ["000", "7.47.42.47.9"], ["111", "a.8a.85.3..."]],
      refrain: [["000", "b.9b.97.9b.."], ["111", "c.ac.a8.ac.."], ["000", "b.9b.97.9e.."], ["440", "b.8b.87....."]],
      bruecke: [["555", "c.....9.....", "5.75.79.79.7"], ["444", "b.....8.....", "4.64.68.68.6"]] },
    // Quellwasser: Strophe perlt stufenweise abwärts, Refrain sprudelt mit Oktavsprung hoch
    { titel: "Kichernde Quelle", modus: "ionisch", tempo: 112, schlag: "sanft", instrument: "harfe", bass: "halbe",
      intro: ["0000", "e.d.b.9.7......."],
      strophe: [["0000", "9.8.7.6.4...2..."], ["3333", "a.9.7.6.5...3..."], ["4444", "b.a.8.7.6...4..."], ["0000", "7.6.4.3.2...4..."]],
      refrain: [["0000", "7...e...b.c.b..."], ["3333", "7...c...a.b.c..."], ["0000", "7...e...b.c.e..."], ["4400", "d.c.b.8.7......."]],
      bruecke: [["5555", "c...e...9.......", "9.7.5.7.9.7.5.2."], ["3333", "a...c...a.......", "7.5.3.5.7.5.3.0."]] },
    // Wechselbalg: Frage endet frech auf der lydischen Quarte über der II, Antwort löst brav auf
    { titel: "Wechselbalg am Fenster", modus: "lydisch", tempo: 108, schlag: "sanft", swing: 1, bass: "viertel",
      intro: ["0011", "4.2.0...3.5.3..."],
      strophe: [["0011", "4.2.0...3.5.3..."], ["0000", "4.2.0...2.4.7..."], ["0011", "4.2.0...3.5.8..."], ["4444", "6...4...1.4.6..."]],
      refrain: [["0011", "b.9.7...a.c.a..."], ["0000", "b.9.7...9...7..."], ["0011", "b.9.7...a.c.8..."], ["4400", "b.8.6...7......."]],
      bruecke: [["5555", "9.......c.......", "5.4.2.4.5.7.9.7."], ["2222", "b.......9.......", "2.4.6.4.2.4.6.9."]] },
    // Feenring-Reel: durchlaufende Achtel und ein Sechzehntel-Wirbel als Hauptmotiv im Refrain
    { titel: "Feenring-Reel", modus: "ionisch", tempo: 118, schlag: "treibend", bass: { i: "orgel", s: "viertel", r: "puls", b: "halbe", h: "puls" }, band: { trommel: "bodhran", floete: "piccolo", ketten: "schellen" },
      intro: ["0000", "0.2.4.7.4.2.4.7."],
      strophe: [["0000", "4.2.4.7.9.7.4.2."], ["3333", "5.3.5.7.a.7.5.3."], ["4444", "6.4.6.8.b.8.6.4."], ["0000", "2.4.7.4.2...0..."]],
      refrain: [["0000", "9b979b97e...b..."], ["4444", "8a868a86b...8..."], ["0000", "9b979b97e.c.b.9."], ["4400", "8a86b...7......."]],
      bruecke: [["5555", "c.......e.......", "5.7.9.7.5.7.9.c."], ["1111", "a.......c.......", "1.3.5.3.1.3.5.8."]] }
  ],
  gaukler: [
    // Feuerschlucker: Oktavsprung wie eine Stichflamme, dann über die kleine Septime (VII-Dur) hinab
    { titel: "Der Feuerschlucker", modus: "mixolydisch", tempo: 118, schlag: "tanz", bass: { i: "orgel", s: "viertel", r: "viertel", b: "halbe", h: "puls" },
      intro: ["0000", "0...7.......4..."],
      strophe: [["0000", "0...7...4.5.4..."], ["6666", "6...d...b.a.8..."], ["3333", "3...a...7.6.5..."], ["4444", "4...b...8.6.4..."]],
      refrain: [["0000", "7.9.b...e.d.b..."], ["6666", "d.b.a...8.a.d..."], ["0000", "7.9.b...e.d.e..."], ["3300", "c.a.c...7......."]],
      bruecke: [["5555", "9.......c.......", "5.7.9.7.5.7.9.c."], ["4444", "8.......b.......", "4.6.8.6.4.6.8.b."]] },
    // Hütchenspiel: drei Töne werden wie Becher vertauscht (4-2-7, 2-7-4, 7-4-2), geswingt
    { titel: "Hütchenspiel", modus: "ionisch", tempo: 116, schlag: "tanz", swing: 1, bass: "viertel",
      intro: ["0000", "4.2.7...2.7.4..."],
      strophe: [["0000", "4.2.7...2.7.4..."], ["4444", "6.4.8...4.8.6..."], ["0000", "7.4.2...4.2.7..."], ["4444", "8.6.4...6...4..."]],
      refrain: [["0000", "b.9.e...9.e.b..."], ["3333", "c.a.e...a.e.c..."], ["0000", "b.9.e...9.e.b.c."], ["4400", "d.b.8...7......."]],
      bruecke: [["5555", "c.......9.......", "5.9.7.5.9.7.5.9."], ["3333", "a.......c.......", "3.7.5.3.7.5.3.7."]] },
    // Schwebende Jungfrau: langsam steigende lydische Linie, die über der II in der Luft hängen bleibt
    { titel: "Die schwebende Jungfrau", modus: "lydisch", tempo: 112, schlag: "sanft", instrument: "illusion", bass: { i: "orgel", s: "orgel", r: "halbe", b: "orgel", h: "halbe" },
      intro: ["0000", "0.......4......."],
      strophe: [["0000", "0.......2...4..."], ["1111", "5.......3...1..."], ["0000", "4.......7...9..."], ["1111", "8.......5...3..."]],
      refrain: [["0011", "7...9...a.c.a..."], ["0000", "b.......9...7..."], ["0011", "7...9...a.c.8..."], ["4400", "b...8...7......."]],
      bruecke: [["5555", "c...............", "5.7.9.c.e.c.9.7."], ["2222", "b...............", "2.4.6.9.b.9.6.4."]] },
    // Fackeljonglage: Dreiklänge fliegen im Jig auf und ab wie Keulen in der Luft
    { titel: "Jonglieren mit Fackeln", modus: "mixolydisch", takt: 12, tempo: 120, schlag: "jig", bass: { i: "orgel", s: "halbe", r: "viertel", b: "halbe", h: "viertel" },
      intro: ["000", "0.24.27.42.0"],
      strophe: [["000", "2.47.42.47.9"], ["666", "3.68.63.68.a"], ["333", "3.57.53.57.a"], ["444", "4.68.64.6b.."]],
      refrain: [["000", "9.b9.7e..b.."], ["666", "a.da.8d..a.."], ["000", "9.b9.7e..e.."], ["440", "b.db.87....."]],
      bruecke: [["555", "c.....9.....", "5.79.75.79.7"], ["333", "a.....c.....", "3.57.53.57.5"]] },
    // Kaninchen aus dem Hut: Motiv, dann Atempause – und ein Ton springt am Taktende heraus
    { titel: "Kaninchen aus dem Hut", modus: "ionisch", tempo: 114, schlag: "tanz", bass: "halbe",
      intro: ["0000", "4.5.4.2........7"],
      strophe: [["0000", "4.5.4.2........7"], ["4444", "6.8.6.4........b"], ["0000", "4.5.4.2.0......7"], ["4444", "6.8.b...8...6..."]],
      refrain: [["0000", "e...b...9.b.e..."], ["4444", "d...b...8.b.d..."], ["0000", "e...b...9.7.9.b."], ["4400", "d...b...7......."]],
      bruecke: [["3333", "a...c...e.......", "3.5.7.a.7.5.3.5."], ["4444", "b...d...b.......", "4.6.8.b.8.6.4.6."]] },
    // Wunderzelt: Jig mit fallender Sequenz, die lydische II öffnet jedes Mal einen neuen Vorhang
    { titel: "Das Zelt der tausend Wunder", modus: "lydisch", takt: 12, tempo: 116, schlag: "jig", bass: "halbe", band: { trommel: "tamburin", floete: "floete", ketten: "triangel" },
      intro: ["000", "4.24.27..4.."],
      strophe: [["000", "4.24.27..4.."], ["111", "5.35.38..5.."], ["000", "7.47.49..7.."], ["444", "6.46.48..6.."]],
      refrain: [["000", "b.9b.9e..b.."], ["111", "a.8a.8c..a.."], ["000", "b.9b.97..9.."], ["440", "8.b8.67....."]],
      bruecke: [["555", "c.....e.....", "5.7.9.7.5.7."], ["333", "a.....c.....", "3.5.7.5.3.5."]] },
    // Seiltänzer-Walzer: Wechselton-Wackler auf jedem Taktanfang, als ob er die Balance sucht
    { titel: "Der Seiltänzer", modus: "ionisch", takt: 12, tempo: 112, schlag: "walzer", bass: { i: "orgel", s: "viertel", r: "viertel", b: "halbe", h: "viertel" },
      intro: ["000", "4.5.4...2..."],
      strophe: [["000", "4.5.4...2.3."], ["444", "6.7.6...4.5."], ["000", "7.8.7...4.5."], ["444", "6.5.4...1..."]],
      refrain: [["000", "9.a.9...b.c."], ["555", "c.d.c...9..."], ["000", "9.a.9...e..."], ["444", "d.c.b...8..."]],
      bruecke: [["333", "a.......c...", "3.5.7.5.3.5."], ["111", "8.......a...", "1.3.5.3.1.3."]],
      schluss: ["440", "b.a.8...7..."] },
    // Kartentrick: verschmitzter Haken mit der kleinen Septime (7-6-7) über I und VII-Dur
    { titel: "Kartentrick mit dem Kreuzbuben", modus: "mixolydisch", tempo: 122, schlag: "treibend", swing: 1, bass: { i: "orgel", s: "viertel", r: "viertel", b: "halbe", h: "puls" }, band: { trommel: "tamburin", floete: "klarinette", ketten: "schnipsen" },
      intro: ["0066", "7.6.7.4.6...8..."],
      strophe: [["0060", "4...2.4.6...4..."], ["0000", "2...4.7.4......."], ["0066", "4...2.4.6...8..."], ["3300", "5...3...4...2..."]],
      refrain: [["0066", "7.6.7.a.d...a..."], ["0000", "9.b.9.7.4......."], ["0066", "7.6.7.a.d...8..."], ["3300", "a.c.a...7......."]],
      bruecke: [["5555", "9.......c.......", "5.7.9.c.9.7.5.7."], ["4444", "b.......8.......", "4.8.6.b.6.8.4.8."]] },
    // Spiegelkabinett: der Refrain spiegelt sich – erst hinauf, im Antworttakt dieselbe Figur umgekehrt
    { titel: "Spiegelkabinett", modus: "lydisch", tempo: 114, schlag: "sanft", instrument: "glocken", bass: "viertel",
      intro: ["0000", "4.5.7...7.5.4..."],
      strophe: [["0000", "4.5.7...4.3.2..."], ["1111", "5.6.8...5.3.1..."], ["0000", "4.5.7...9.7.4..."], ["4444", "6...8...b...8..."]],
      refrain: [["0000", "b.c.e...b.a.9..."], ["1111", "a.8.5...8.a.c..."], ["0000", "b.c.e...b.a.b..."], ["4400", "d.b.8...7......."]],
      bruecke: [["2222", "9...b...d.......", "2.4.6.9.6.4.2.4."], ["5555", "c...9...7.......", "5.7.9.c.9.7.5.7."]] },
    // Tanzbär: schwerfälliges Stampfen in Vierteln, dann ein frecher Schlenker mit der kleinen Septime
    { titel: "Bärentanz auf dem Fass", modus: "mixolydisch", tempo: 112, schlag: "tanz", bass: "viertel", band: { trommel: "pauke", floete: "horn", ketten: "krug" },
      intro: ["0000", "0...4...0...4..."],
      strophe: [["0000", "0...4...2...4..."], ["6666", "1...6...3...6..."], ["0000", "0...4...7...4..."], ["4444", "1...4...6...8..."]],
      refrain: [["0000", "7...7.9.b...9.7."], ["6666", "d...d.b.a...8.6."], ["0000", "7...7.9.b...e..."], ["3300", "a...c.a.7......."]],
      bruecke: [["5555", "9.......7.......", "5...2...5...7..."], ["4444", "8.......b.......", "4...1...4...6..."]] }
  ],
  sternenhimmel: [
    // Milchstraße: weite Quint- und Quartsprünge in ganzen Noten über Liegeton, dorisch zwischen i und IV
    { titel: "Das Band der Milchstraße", modus: "dorisch", tempo: 62, schlag: "ruhig", bass: "orgel", bordun: 1,
      intro: ["0000", "0.......7......."],
      strophe: [["0000", "4.......7......."], ["3333", "5.......a......."], ["0000", "4.......9......."], ["6666", "8.......6......."]],
      refrain: [["0000", "b.......e...b..."], ["3333", "c.......a...7..."], ["0000", "b.......e...9..."], ["6600", "a.......7......."]],
      bruecke: [["2222", "9.......b.......", "2...4...6...9..."], ["4444", "8.......b.......", "4...6...8...b..."]] },
    // Wiegenlied der Sterne: sanft schaukelnde Sexten, lydische II als Sternenglanz
    { titel: "Wo die alten Sterne schlafen", modus: "lydisch", takt: 12, tempo: 60, schlag: "walzer", instrument: "glocken", bass: { i: "orgel", s: "orgel", r: "halbe", b: "orgel", h: "halbe" },
      intro: ["000", "0...7...4..."],
      strophe: [["000", "2...7...4..."], ["111", "3...8...5..."], ["000", "4...9...7..."], ["444", "6...b...8..."]],
      refrain: [["000", "9...e...b.a."], ["111", "a...c...8..."], ["000", "9...e...b.c."], ["444", "b...d...8..."]],
      bruecke: [["555", "c.......e...", "5.7.9.7.5.7."], ["333", "a.......7...", "3.5.7.a.7.5."]],
      schluss: ["040", "9...8...7..."] },
    // Sternbild des Jägers: Motiv 0-2-5 betont die helle dorische Sexte über der IV
    { titel: "Sternbild des Jägers", modus: "dorisch", tempo: 64, schlag: "sanft", bass: "halbe",
      intro: ["0033", "0...2...5......."],
      strophe: [["0033", "0...2...5...3..."], ["0000", "4...2...0......."], ["0033", "2...4...5...7..."], ["4444", "6...4...1......."]],
      refrain: [["0033", "7...9...c...a..."], ["0000", "b...9...7......."], ["0033", "7...9...c...e..."], ["6600", "d...a...7......."]],
      bruecke: [["2222", "9.......d.......", "2.4.6.9.6.4.2.4."], ["6666", "a.......d.......", "6.8.a.d.a.8.6.8."]] },
    // Kometenschweif: Strophe steigt in Sequenzen, Refrain fällt in langem Bogen aus der Höhe
    { titel: "Ein Komet zieht vorüber", modus: "ionisch", tempo: 66, schlag: "sanft", instrument: "harfe", bass: { i: "orgel", s: "halbe", r: "halbe", b: "orgel", h: "viertel" },
      intro: ["0000", "e.d.b.a.9......."],
      strophe: [["0000", "0...2...4...7..."], ["5555", "5...7...9...c..."], ["3333", "3...5...7...a..."], ["4444", "4...6...8...b..."]],
      refrain: [["0000", "e.d.b.a.9......."], ["5555", "c.b.9.8.7......."], ["0000", "e.d.b.a.9...b..."], ["4400", "d.c.b.a.7......."]],
      bruecke: [["1111", "a.......c.......", "1.3.5.8.5.3.1.3."], ["4444", "b.......d.......", "4.6.8.b.8.6.4.6."]] },
    // Sphärenuhr: tickendes Arpeggio der Zweitstimme, darüber ruhen lange lydische Töne
    { titel: "Die Sphärenuhr", modus: "lydisch", tempo: 58, schlag: "ruhig", instrument: "illusion", bass: "orgel",
      intro: ["0000", "0.4.7.4.0.4.7.4."],
      strophe: [["0000", "4...............", "0.4.7.4.0.4.7.4."], ["1111", "3...............", "1.5.8.5.1.5.8.5."], ["0000", "7.......9......."], ["1111", "8.......5......."]],
      refrain: [["0000", "b.......9...7..."], ["1111", "a.......c...a..."], ["0000", "b.......9...b..."], ["4400", "d.......7......."]],
      bruecke: [["5555", "c...e...c...9...", "5.9.c.9.5.9.c.9."], ["2222", "b...9...6...9...", "2.6.9.6.2.6.9.6."]] },
    // Polarnacht-Walzer: Moll-Walzer mit heller dorischer IV, Frage steigt, Antwort sinkt über iv–VII
    { titel: "Stille der Polarnacht", modus: "dorisch", takt: 12, tempo: 62, schlag: "walzer", bass: { i: "orgel", s: "orgel", r: "halbe", b: "orgel", h: "halbe" },
      intro: ["000", "0...4...7..."],
      strophe: [["000", "2...4...2..."], ["333", "3...5...7..."], ["666", "6...8...6..."], ["000", "4...2...0..."]],
      refrain: [["000", "7...9...b.9."], ["333", "a...c...e..."], ["000", "7...9...b.c."], ["666", "d...a...8..."]],
      bruecke: [["222", "9.......b...", "2.4.6.4.2.4."], ["333", "a.......c...", "3.5.7.5.3.5."]],
      schluss: ["460", "b...8...7..."] },
    // Himmelsleiter: jeder Takt eine Sprosse höher, Dreitonschritte als Sequenz
    { titel: "Himmelsleiter", modus: "ionisch", takt: 12, tempo: 64, schlag: "walzer", bass: "halbe",
      intro: ["000", "0.1.2...4..."],
      strophe: [["000", "2.3.4......."], ["555", "2.4.5......."], ["111", "3.4.5...8..."], ["444", "4.5.6...4..."]],
      refrain: [["000", "7.8.9...b..."], ["555", "9.a.c...9..."], ["000", "7.8.9...e..."], ["444", "b.c.d...b..."]],
      bruecke: [["555", "c...........", "5.7.9.c.9.7."], ["444", "b.......d...", "4.6.8.b.8.6."]],
      schluss: ["340", "a.9.8...7..."] },
    // Orakel-Handpan: pentatonisches Ostinato, Geheimnis durch die lydische II im Refrain
    { titel: "Orakel der Plejaden", modus: "lydisch", tempo: 60, schlag: "ruhig", instrument: "handpan", bass: "orgel",
      intro: ["0000", "0.4.7.......9..."],
      strophe: [["0000", "0.4.7.......9..."], ["1111", "1.5.8.......a..."], ["0000", "0.4.7.......b..."], ["4444", "1.4.6.......8..."]],
      refrain: [["0011", "9.....b.a......."], ["0000", "b.....9.7......."], ["0011", "9.....b.c......."], ["4400", "b.....8.7......."]],
      bruecke: [["5555", "c...............", "5.9.c.....9.7..."], ["2222", "b...............", "2.6.9.....6.4..."]] },
    // Wächtergesang: schlichter dorischer Choral i–VII–IV, der letzte Refrain hebt sich eine Etage höher
    { titel: "Das Lied der Sternenwächter", modus: "dorisch", tempo: 66, schlag: "sanft", bass: "halbe",
      intro: ["0000", "0...2...4......."],
      strophe: [["0000", "2...2.4.0...2..."], ["6666", "3...3.6.1...3..."], ["3333", "5...5.7.3...5..."], ["0000", "4...2...0......."]],
      refrain: [["0066", "7...7.9.a...8..."], ["3300", "c...a...9...7..."], ["0066", "7...7.9.a...d..."], ["3300", "a...c...7......."]],
      bruecke: [["2222", "9.......b.......", "2.4.6.9.6.4.2.4."], ["4444", "8.......b.......", "4.6.8.b.8.6.4.1."]],
      refrain2: [["0066", "e...e.b.a...8..."], ["3300", "c...e...9...7..."], ["0066", "e...e.b.a...d..."], ["3300", "c...a...7......."]] },
    // Sternschnuppen: schnelle Sechzehntel-Abstürze, die in langen Tönen verglühen
    { titel: "Wenn die Sterne fallen", modus: "ionisch", tempo: 60, schlag: "ruhig", bass: "orgel",
      intro: ["0000", "e...dcb9........"],
      strophe: [["0000", "4.......7654...."], ["3333", "5.......a987...."], ["4444", "6.......ba98...."], ["0000", "4.......7......."]],
      refrain: [["0000", "9...edcb9......."], ["3333", "a...e...c......."], ["0000", "9...edcb9...b..."], ["4400", "8...dcb87......."]],
      bruecke: [["5555", "c...............", "5...7...9...e..."], ["1111", "a...............", "1...3...5...8..."]] }
  ]
};
