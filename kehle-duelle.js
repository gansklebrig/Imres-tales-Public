/* =====================================================================
   BARRADINS GOLDENE KEHLE – Spott-Duelle
   ---------------------------------------------------------------------
   Ein Gegner singt seine Drohung (2 Zeilen), Barradin antwortet (4 Zeilen).
   Jede gut gesungene Zeile kostet den Gegner Lebenspunkte; jede Drohung
   kostet Barradin Fassung – umso mehr, je schwächer die Antwort davor war.
   Aufbau wie im Liederbuch (kehle-lieder.js):
     teile.G = Melodie des Gegners (zwei Zeilen), teile.B = Barradins Antwort
     runden  = [[Gegnerzeilen], [Barradins Zeilen]] …
     instr   = Instrument(e) der Gegnerstimme (je Zeile), schaden = Wucht der Drohung
   Neue Duelle hinten anhängen (gewonnene Duelle werden nach id gespeichert).
   ===================================================================== */
window.KEHLE_DUELLE = [
  {
    id: "glasstab", symbol: "🧪", bild: null, instr: ["fag"], schaden: 30,
    takt: 4, bpm: 126, modus: "moll", stil: "polka",
    name: { de: "Glasstab", en: "Glasstaff" },
    teile: {
      G: ["t8: 5 5 4 3 4 5 6 5", "t8: 5 4 3 2 #7, 2 #7, 1"],
      B: ["j8: 1 3 3 5 5 6 5 3", "j8: 3 4 5 6 5 4 3 2", "j8: 1 3 3 5 5 6 7 1'", "j8: 1' 7 6 5 4 2 #7, 1"]
    },
    runden: [
      [["Klei|ner Bar|de, frech und ei|tel,", "ich zer|schmelz dir gleich den Schei|tel!"],
       ["Dein Glas|stab ist so dünn wie du", "und e|ben|so ver|korkt da|zu.", "Du drohst mit Säu|re? Lach|haft, Wicht –", "noch ät|zen|der ist dein Ge|sicht!"]],
      [["Ro|te Ro|ben, stark wie Ei|sen,", "wer|den dir den Aus|gang wei|sen!"],
       ["Die Ro|ben sof|fen sich ins Grab,", "dann stach der Dar|kin al|le ab.", "Gleich läufst du weg, ich zieh dich her,", "und Fried|richs Pfeil, der trifft dich schwer."]],
      [["Spin|ne, Spin|ne, hör mein Fle|hen,", "lass den Bar|den un|ter|ge|hen!"],
       ["Die Spin|ne hört dich nicht, du Tropf,", "die hat ganz an|dre Ding' im Kopf.", "Du bist nur Glas, und Glas zer|bricht –", "und dei|nen Scher|ben wein ich nicht."]]
    ],
    de: { ort: "Glasstabs Labor in Schloss Crackmore", intro: "Phiolen, Augen in Gläsern und ein Magier mit sehr dünner Haut. Er will mich mit Säure übergießen – ich übergieße ihn mit Reimen.",
      sieg: "Glasstab sackt zwischen seinen Phiolen zusammen. Die Augen in den Gläsern applaudieren. Glaube ich.", pleite: "Glasstab lacht so sehr, dass er fast vergisst zu fliehen. Fast." },
    en: { ort: "Glasstaff's laboratory in Castle Crackmore", intro: "Phials, eyes in jars and a wizard with very thin skin. He wants to douse me in acid – I'll douse him in rhymes.",
      sieg: "Glasstaff collapses between his phials. The eyes in the jars applaud. I think.", pleite: "Glasstaff laughs so hard he almost forgets to run. Almost." }
  },
  {
    id: "venomfang", bild: "venomfang.jpg", instr: ["pos"], schaden: 36,
    takt: 4, bpm: 112, modus: "moll", stil: "marsch",
    name: { de: "Venomfang", en: "Venomfang" },
    teile: {
      G: ["t8: 1 1 1 3 2 1 #7, 1", "t8: 3 3 4 3 2 1 #7, 1"],
      B: ["j8: 5 1' 7 6 5 4 3 5", "j8: 5 4 3 2 3 4 5 5", "j8: 5 1' 7 6 5 6 7 1'", "j8: 1' 7 6 5 4 #7, 2 1"]
    },
    runden: [
      [["Klei|ne Wür|mer auf dem Tur|me,", "gleich seid ihr nur Gift im Stur|me!"],
       ["Du grü|ner Wurm, so groß wie dumm,", "dein A|tem bringt die Flie|gen um!", "Und reißt du dei|nen Ra|chen auf,", "dann setzt sich E|chos Feu|er drauf."]],
      [["Gold und Gift sind mei|ne Schät|ze,", "Bar|de, spar dir dei|ne Sät|ze!"],
       ["Schau her, du Ech|se, sieh das Licht,", "das Mus|ter, das dein Hirn zer|bricht.", "Du sab|berst schon und glotzt wie blind –", "jetzt sind wir dran. Und zwar ge|schwind!"]],
      [["Ich bin Ve|nom|fang, der Gro|ße,", "ihr seid Wan|zen in der Ho|se!"],
       ["Du bist ein Wurm mit Grö|ßen|wahn,", "ein auf|ge|bla|se|ner Fa|san.", "Und wenn du fällst, dann fällst du tief –", "dir sitzt ein Pfeil im Kopf. Ganz schief."]]
    ],
    de: { ort: "Das Plateau des Turms von Donnerbaum", intro: "Grüne Schuppen, grüner Atem, grüne Laune. Ein junger Drache, der sich für den Größten hält. Zeit, ihn kleinzusingen.",
      sieg: "Venomfang glotzt in meine bunten Lichter, bis Ezekiels Pfeil die Diskussion beendet.", pleite: "Venomfang hustet mir eine grüne Wolke ins Gesicht. Meine Reime riechen jetzt nach Sumpf." },
    en: { ort: "The platform of the Thundertree tower", intro: "Green scales, green breath, green mood. A young dragon who thinks he's the greatest. Time to sing him small.",
      sieg: "Venomfang stares into my colourful lights until Ezekiel's arrow ends the discussion.", pleite: "Venomfang coughs a green cloud into my face. My rhymes smell of swamp now." }
  },
  {
    id: "ilvara", bild: "ilvara-wahr.webp", instr: ["oboe"], schaden: 40,
    takt: 3, bpm: 150, modus: "moll", stil: "walzer",
    name: { de: "Ilvara", en: "Ilvara" },
    teile: {
      G: ["wt8: 5 5 6 5 4 3 4 5", "wt8: 5 4 3 2 3 #7, 1 1"],
      B: ["w9: 1 3 2 3 4 5 4 3 2", "w8: 2 3 4 5 4 3 2 1", "w9: 5 6 5 4 3 4 5 6 5", "w8: 5 4 3 2 #7, 2 #7, 1"]
    },
    runden: [
      [["Kommt her|ein, ich koch euch Sup|pe", "für die gan|ze Hel|den|trup|pe!"],
       ["Die Sup|pe roch nach Fuchs und Lü|gen,", "du Fal|sche mit dem grü|nen Kleid,", "doch hin|ter dei|nen sanf|ten Zü|gen", "steckt nichts als Gift und Häss|lich|keit."]],
      [["Spin|nen|mut|ter, hör mich ru|fen,", "lass sie fal|len von den Stu|fen!"],
       ["Ich mal|te dei|ner Spin|ne Bär|te", "und noch was an|de|res da|zu –", "jetzt trägt sie Schmuck von gro|ßer Här|te", "und sieht da|mit aus so wie du."]],
      [["Ich ent|kom|me euch, ihr Nar|ren,", "un|ten wird die Spin|ne har|ren!"],
       ["So spring doch, Drow, und schwimm nach Hau|se,", "der Fluss ist kalt – ich bin so froh!", "Dein Plat|scher war die schöns|te Pau|se,", "er wäscht den Dreck von dei|nem Po."]]
    ],
    de: { ort: "Der Hof von Ilvaras Feste", intro: "Ein Dämon kreist, die Wachen liegen am Boden, und vor mir steht die Drow, die uns mit Suppe vergiftet hat. Ich habe da ein paar Worte vorbereitet.",
      sieg: "Ilvara springt über das Geländer. Platsch. Schönster Schlussakkord meiner Laufbahn.", pleite: "Ilvara lacht, verwandelt sich in eine Fledermaus und flattert mir ins Haar. Ich finde sie heute noch." },
    en: { ort: "The courtyard of Ilvara's fortress", intro: "A demon circles, the guards are down, and before me stands the drow who poisoned us with soup. I've prepared a few words.",
      sieg: "Ilvara leaps over the railing. Splash. Finest closing chord of my career.", pleite: "Ilvara laughs, turns into a bat and flaps into my hair. I'm still finding bits of her." }
  },
  {
    id: "demogorgon", bild: "demogorgon.webp", instr: ["tuba", "pos"], schaden: 48,
    takt: 4, bpm: 96, modus: "moll", stil: "marsch",
    name: { de: "Demogorgon", en: "Demogorgon" },
    teile: {
      G: ["t8: 1 1 3 2 1 #7, 1 #7,", "t8: 5 5 6 5 4 3 2 1"],
      B: ["j8: 1 3 3 4 5 4 3 2", "j8: 2 3 4 5 4 3 2 1", "j8: 5 5 5 6 5 4 3 5", "j8: 5 4 3 2 1 #7, 2 1"]
    },
    runden: [
      [["Kniet, ihr Wür|mer, vor dem Thro|ne!", "Nein, ich bin's, ich trag die Kro|ne!"],
       ["Zwei Köp|fe, doch kein Fun|ken Hirn,", "und je|der hohl wie ei|ne Birn'.", "Ihr streit' euch, wer die Kro|ne trägt,", "bis sich der ei|ne selbst er|schlägt."]],
      [["Al|le Zau|ber sind er|lo|schen,", "ihr seid wert nicht ei|nen Gro|schen!"],
       ["Mein Zau|ber weg? Dann bleibt mein Mund,", "und der ist schär|fer als dein Schlund.", "Und Fried|rich box|te dich, du Gott –", "jetzt bleibt dir nur noch Hohn und Spott."]],
      [["Ich zer|mal|me Stadt und Tem|pel,", "Hel|den sind für mich nur Krem|pel!"],
       ["Du nahmst uns Ploop|ploo|peen, du Vieh,", "und Fa|gas, den ver|gess ich nie.", "Wir flie|hen heut, doch merk dir gut:", "Dein Grab|lied schreib ich einst mit Blut."]]
    ],
    de: { ort: "Am Ufer der versinkenden Stadt", intro: "Zwei Köpfe, vier Tentakel und keine Magie mehr. Besiegen kann ich ihn nicht. Aber ich kann ihn so lange beleidigen, bis wir am Boot sind.",
      sieg: "Die beiden Köpfe streiten sich, wer beleidigter ist. Wir rudern davon. Friedrich boxt zum Abschied noch einmal in die Luft.", pleite: "Demogorgon brüllt, und meine Knie schlottern. Diesmal nicht aus Solidarität. Rennen!" },
    en: { ort: "On the shore of the sinking city", intro: "Two heads, four tentacles and no magic left. I can't defeat him. But I can insult him until we reach the boat.",
      sieg: "The two heads argue about who is more offended. We row away. Friedrich throws one last punch at the air.", pleite: "Demogorgon roars and my knees shake. Not out of solidarity this time. Run!" }
  }
];
