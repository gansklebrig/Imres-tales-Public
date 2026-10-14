/* =====================================================================
   BARRADINS REIMBUCH – alle Reime für das Loblied in der Taverne
   ---------------------------------------------------------------------
   Bei jedem Wurf baut Barradin aus diesen Bausteinen ein neues Lied.
   {n} steht immer für den Namen, der besungen wird.

   Stufen (je nach Würfelergebnis):
     patzer  = natürliche 1        schwach = Summe bis 11
     maessig = 12–16               gut     = 17–21
     stark   = 22–25               legende = ab 26
     krit    = natürliche 20

   Die Bausteine:
     ganz          fertige Lieder, die ab und zu komplett gesungen werden
     paare         zwei Zeilen, die sich reimen (ohne Namen)
     namensZeilen  eine Zeile, die auf den Namen ENDET
     namen         bekannte Namen: „paare“ = fertige Zweizeiler mit dem Namen
                   im Reim, „hoch“/„tief“ = Zeilen, die auf den Namen reimen
     endungen      Reimzeilen für alle anderen Namen, sortiert nach Namensendung
     namensPaare   Ersatz, wenn sich auf einen Namen nichts reimt
     schluss       krönender Abschluss für legendäre Lieder
   „hoch“ = für gute Würfe, „tief“ = für schlechte Würfe.

   Neue Reime: einfach eine Zeile in Anführungszeichen ergänzen, mit Komma
   getrennt. Zeilenumbruch innerhalb eines Liedes = \n
   ===================================================================== */
window.BARRADIN_REIME = {
  de: {
    ganz: {
      patzer: [
        "Oh {n}, du bist so … äh … groß?\nUnd deine Schuhe … sind famos?\nDie Saite reißt, der Ton zerbricht –\nich glaube, das war kein Gedicht.",
        "Ein Hoch auf {n}! Ein Hoch auf … Moment,\nwie ging der Reim? Wer hat das Lied verbrennt?\nIch fang nochmal an … nein, lieber nicht.\nDer Barde verbeugt sich. Und fällt aufs Gesicht.",
        "{n}, du … du … bist … ein Mensch? Ein Tier?\nIch weiß es nicht, ich hatte zu viel Bier.\nDie Laute fällt mir aus der Hand –\nich geh jetzt raus. Ich hab mich schon verbrannt."
      ],
      schwach: [
        "{n}, {n}, du bist da,\nund das ist … wirklich wunderbar.\nMehr fällt mir gerade nicht ein,\ndoch es soll ein Loblied sein.",
        "Wer ist toll? {n} ist toll!\nDas Lied ist kurz, das Herz ist voll.\nDer Reim ist schief, die Laute auch,\nso ist das eben Bardenbrauch.",
        "Ich sing ein Lied für {n} hier,\nes ist nicht gut, doch es ist von mir.\nDie Melodie, die kennt ihr schon –\nes ist die einzige. In jedem Ton."
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
        "Ihr Sterne, schweigt! Ihr Winde, ruht!\nHier singt der Barde voller Glut!\nVon {n} will ich heute künden,\nkein größ'rer Held ist je zu finden.\nDie Drachen weinen, Dämonen fliehn,\ndie Götter knien vor {n} hin.\nUnd jedes Bier im ganzen Land\nträgt fortan „{n}“ als Namen am Rand!"
      ]
    },

    paare: {
      patzer: [
        "Ich hol tief Luft, ich setz zum Singen an –\nund niese mitten rein. Na dann.",
        "Die erste Strophe … die zweite … die drei …\nWo war ich? Ach, egal. Vorbei.",
        "Ich stimm' die Laute … Moment … wo ist sie hin?\nAch, da liegt sie … nein, das ist mein Kinn.",
        "Hört, hört! Ich sing … ich sing … von … was?\nWer hat mir eben nachgeschenkt dies Glas?",
        "Die Saite reißt, die Pfeife fällt in den Wein,\ndas sollte heut ein Meisterwerk sein.",
        "Ich hab den Text vergessen, doch egal,\nich sing jetzt einfach la-la-la. Nochmal?",
        "Ich steig auf den Tisch – der Tisch bricht ein,\nich glaub, ich sing ab jetzt im Liegen. Fein."
      ],
      schwach: [
        "Ich reime Herz auf Schmerz und Mut auf gut,\nmehr fällt mir nicht ein. Na, das tut's.",
        "Das Lied ist kurz, die Stimme rau,\nich bin seit gestern Abend blau.",
        "Ein Lied, ein Lied, ich sing euch jetzt ein Lied,\nweil das ein Barde halt so macht. Und so geschieht's.",
        "Die Laute klingt ein bisschen schief,\nich glaub, ich hab noch nicht genug geschlief … geschlafen.",
        "Wer tapfer ist und manchmal auch nicht,\nder kriegt von mir ein kleines Gedicht.",
        "Na gut, ich sing, weil ihr so lieb fragt,\ndoch hab ich mir nicht viel … vorgesagt.",
        "Der Wirt schaut grimmig, der Hund schaut weg,\ndas Lied ist leider nur so … ein Fleck."
      ],
      maessig: [
        "Vom Hafen bis zur Zwergenstadt\nkennt man den Helden, früh und spat.",
        "Hebt die Krüge, schlagt den Takt,\nhier kommt ein Lied, das jeden packt!",
        "Hört, ihr Leut', beim Kerzenschein,\nein Lied soll heut gesungen sein!",
        "Der Krug ist voll, der Abend jung,\ndrum sing ich mit Begeisterung!",
        "In Phandalin und tief im Unterreich\nist keiner diesem Helden gleich.",
        "Wo Rote Roben finster lauern,\nda müssen bald die Feinde trauern.",
        "Mit Pfeife, Laute, Bier und Brot\nbesing ich Helden in der Not."
      ],
      gut: [
        "Wo andre zögern, zittern, fliehn,\nsieht man den Helden vorwärts ziehn.",
        "Kein Kerker hält, kein Schloss, kein Riegel –\nein Held wie dieser sprengt jedes Siegel.",
        "Von Neverwinter bis zum fernsten Strand\nkennt man den Namen in jedem Land.",
        "Die Schurken zittern, wenn sie hören,\nwer kommt, um ihre Pläne zu zerstören.",
        "Wo Dunkelheit die Welt umhüllt,\nwird jeder Feind mit Furcht erfüllt.",
        "Ein Herz aus Gold, ein Wille aus Stahl,\ndie Legende wächst mit jedem Mal.",
        "Selbst Venomfang mit seinem Gift\nwar machtlos, wenn ihn dieser Held trifft."
      ],
      stark: [
        "Selbst Ilvara in ihrem Drowpalast\nhat vor dem Helden heimlich Angst gefasst.",
        "Die Riesen in den Hallen tief im Stein\nverneigen sich – und fühlen sich ganz klein.",
        "Die Sterne neigen sich bei Nacht\nund staunen ob der Heldenpracht.",
        "Selbst Demogorgon, riesengroß,\nversteckt sich lieber. Ganz famos.",
        "Die Drachen flüstern voller Neid:\nSo viel Glanz in einer Zeit?",
        "Die Zwerge in Gracklstugh schmieden im Takt\nund singen von dem, der jeden Kampf packt.",
        "Und wenn die Spinne Fäden webt,\nist's dieser Held, der sie zerlegt."
      ],
      legende: [
        "Ein Name, der durch alle Zeiten hallt,\nin jeder Taverne, jedem Wald.",
        "Wenn Barden später Lieder schreiben,\nwird dieser Name ewig bleiben.",
        "Ihr Götter, hört! Ihr Sterne, schaut!\nHier wird ein Heldenlied gebaut!",
        "Die Berge beben, Meere schweigen,\ndie Götter sich vor Ehrfurcht neigen.",
        "Von Phandalin bis tief hinab\nerzählt man es bis an das Grab.",
        "Wo dieser Held geht, blüht das Land,\nda weicht die Nacht, da fällt die Wand.",
        "Die Spinne selbst in ihrem Netz\nfürchtet nur dieses eine Gesetz.",
        "Kein Lied war je so laut und rein,\nkein Held wird je so strahlend sein."
      ]
    },

    namensZeilen: {
      hoch: [
        "Kein Held ist größer als {n}!",
        "Die Sterne funkeln nur für {n}!",
        "Ein Hoch, ein Hoch, ein Hoch auf {n}!",
        "Und über allen strahlt nur {n}!",
        "Der Held der Helden heißt nur {n}!",
        "Ganz Faerûn verneigt sich vor {n}!",
        "Die Götter selbst beneiden {n}!",
        "Die Barden singen nur von {n}!",
        "Erhebt die Krüge, Freunde, auf {n}!",
        "So stark, so schön, so klug ist {n}!"
      ],
      tief: [
        "Und jetzt ein Lied … für … ja … für {n}.",
        "Und da wär' noch … äh … {n}?",
        "Ich sing jetzt mal … für … {n}!",
        "Ein Lied, ein Lied, ein Lied für {n} …",
        "Wer war das nochmal? Ach ja: {n}.",
        "Applaus, Applaus … für … {n}?"
      ]
    },

    namen: {
      friedrich: {
        paare: {
          hoch: [
            "Sein Pfeil fliegt gerade, still und ehrlich –\nsein Herz ist rein: Hoch lebe Friedrich!",
            "Mit Bogen, Hund und Rechtschaffenheit gefährlich\nfür jeden Feind: der Waldläufer Friedrich!",
            "Selbst Demogorgon boxt er, unbeschwerlich –\nwer sonst wär' so verrückt? Na, Friedrich!"
          ],
          tief: [
            "Da war noch wer … mit Bogen … und so … herrlich …\nwie hieß der gleich? Ach, Friedrich. Natürlich."
          ]
        },
        hoch: [
          "sein Bogen trifft – ganz sicherlich!",
          "so rechtschaffen und so ritterlich!",
          "selbst Demogorgon boxt er – fürchterlich!",
          "mit Rex an seiner Seite: herrlich!",
          "der Waldläufer, kühn und königlich!"
        ],
        tief: [
          "der ist … ganz okay … so … ordentlich?",
          "der hat 'nen Bogen. Glaube ich."
        ]
      },
      echo: {
        paare: {
          hoch: [
            "Die Feinde brennen lichterloh,\nund einer lacht dazu: der Druide Echo!",
            "Wo Blitze zucken, hell und roh,\nsteht hörnergekrönt und stolz: Echo!",
            "Und ruft man laut in den Wald hinein, so\nhallt es zurück: Ein Hoch auf Echo! … Echo … Echo …"
          ],
          tief: [
            "Der … hat Hörner … und … na ja … so.\nIch glaub, er heißt … wart … Echo? Echo? … Echo."
          ]
        },
        hoch: [
          "sein Feuerball brennt lichterloh!",
          "wo Blitze zucken, wird er froh!",
          "so mächtig glüht kein Druide sonst irgendwo!",
          "die Hörner glänzen, die Feinde fliehn – und wir sind froh!"
        ],
        tief: [
          "der … hat … Hörner … und … so?",
          "äh … wo ist der eigentlich? Irgendwo?"
        ]
      },
      ezekiel: {
        paare: {
          hoch: [
            "Er stach der Chasme ins Auge, und sie fiel –\nein Hoch auf den Darkin mit Stil: Ezekiel!",
            "Für ihn ist jeder Kampf ein Spiel,\nund jeder Dolchstoß sitzt: Ezekiel!",
            "Wo Schatten fallen, kalt und viel,\nda lauert der Destroyer: Ezekiel!"
          ],
          tief: [
            "Der zerstört … halt … Sachen … ziemlich viel.\nIch sag nichts Falsches! Hallo, Ezekiel!"
          ]
        },
        hoch: [
          "sein Dolch trifft immer jedes Ziel!",
          "der Darkin mit dem meisten Stil!",
          "für ihn ist jeder Kampf ein Spiel!",
          "der Chasme stach er ins Auge – sie fiel!"
        ],
        tief: [
          "der … zerstört … halt … ziemlich viel.",
          "Destroyer heißt er. Ist das ein Spiel?"
        ]
      },
      rex: {
        paare: {
          hoch: [
            "Dem besten Hund gebührt der beste Keks:\nEin Hoch auf unsern tapfern Rex!",
            "Kein Dämon ist ihm zu komplex,\ner beißt einfach zu: der gute Rex!",
            "Er wittert Fallen, Gift und Klecks –\nkein Spürhund ist so gut wie Rex!"
          ],
          tief: [
            "Ein Hund … mit Fell … und einem Klecks …\ner will kein Lied. Er will 'nen Keks. Der Rex."
          ]
        },
        hoch: [
          "der beste Hund – verdient sich jeden Keks!",
          "so treu, so flink, ein Blitzreflex!",
          "kein Dämon ist ihm zu komplex!"
        ],
        tief: [
          "ein Hund. Mit Fell. Und einem Klecks?",
          "äh … wuff? Ich hab Hunger. Gibt's 'nen Keks?"
        ]
      },
      imre: {
        paare: {
          hoch: [
            "Damit kein Würfel je mein Los verschlimmre,\nsing ich ein Loblied auf den gnäd'gen Imre!",
            "Die ganze Welt, in der ich kämpf' und zimmre,\nerschuf allein der große Meister Imre!",
            "Ich heb mein Glas, dass es im Feuer schimmre:\nAuf unsern Spielleiter, den großen Imre!",
            "Wenn mir ein Rettungswurf misslingt, dann wimmre\nich leis' – und doch, ich liebe dich, o Imre!",
            "Von Phandalin bis tief hinab, wo's glimmre,\nschuf jeden Stein und jede Höhle: Imre!"
          ],
          tief: [
            "Ein Lied für Imre? Puh … worauf reimt sich Imre?\nIch geb es auf und wimmre. Leise. Wimmre.",
            "Ich sing … für … wen? Ach ja, ich glaub, für Imre …\nder Reim ist schwer. Ich … zimm… ich zimmre? Glimmre?"
          ]
        },
        hoch: [
          "auf dass sein Würfel nie mein Los verschlimmre!",
          "der Welten baut, wie ich mir Lieder zimmre!",
          "durch den die ganze Welt in Gold erschimmre!"
        ],
        tief: [
          "und ich … ich find kein Reimwort. Ich … wimmre.",
          "der Reim ist schwer … ich zimm… ich glimm… ich wimmre."
        ]
      },
      barradin: {
        paare: {
          hoch: [
            "Wer singt so schön, wer hat das schönste Kinn?\nDer Größte bin – natürlich! – Barradin!",
            "Die Herzen schmelzen, alle sinken hin,\nwenn er die Laute zupft: Barradin!",
            "Mit Pfeife, Feuer, Laute und Gewinn –\ndas Beste an der Gruppe? Barradin!"
          ],
          tief: [
            "Ein Lied auf mich? Na gut … wo fang ich an … hin …\nich hab den Faden verloren. Ich bin Barradin."
          ]
        },
        hoch: [
          "der schönste Elf mit markantem Kinn!",
          "der Barde, dem die Herzen schmelzen hin!",
          "mit Pfeife und Laute – der reinste Gewinn!",
          "ich bin's! Ich weiß genau, wie toll ich bin!"
        ],
        tief: [
          "das … bin ja ich. Macht das Sinn?",
          "mein Lied … ist … äh … wo war ich? Mittendrin?"
        ]
      }
    },

    /* Für alle anderen Namen: Endung des Namens → passende Reimzeilen.
       Die Liste wird von oben nach unten geprüft. */
    endungen: [
      ["iel|il", { hoch: ["der Sieg ist stets das Ziel!", "mit Herz und Mut und ganz viel Stil!"], tief: ["äh … das war … ziemlich viel?"] }],
      ["ich", { hoch: ["so mutig und so ritterlich!", "so strahlend und so königlich!"], tief: ["äh … ganz … ordentlich?"] }],
      ["aus", { hoch: ["die Taverne tobt vor Applaus!", "die Feinde rennen schreiend raus!"], tief: ["äh … Applaus?"] }],
      ["us", { hoch: ["für alle Feinde ist dann Schluss!", "ein wahrer Heldengenuss!"], tief: ["ich glaub, das war's. Schluss?"] }],
      ["as|ass|aß", { hoch: ["erhebt das Glas, erhebt das Glas!", "mit dir macht jedes Abenteuer Spaß!"], tief: ["äh … das war … was?"] }],
      ["ax|achs", { hoch: ["so schlau wie ein Dachs!", "glänzt heller noch als Kerzenwachs!"], tief: ["äh … ein Lachs?"] }],
      ["ix", { hoch: ["die Feinde fliehn – und zwar ganz fix!", "kein Schurke kann dir was, nix!"], tief: ["äh … nix?"] }],
      ["ex|x", { hoch: ["verdient sich jeden Ehrenkeks!", "kein Rätsel ist dir zu komplex!"], tief: ["äh … ein Klecks?"] }],
      ["ar|aar", { hoch: ["so strahlend und so wunderbar!", "die Heldin, der Held – ganz klar!"], tief: ["äh … ja … wie war's … klar?"] }],
      ["ie|i|y|ee", { hoch: ["voll Mut, voll Glanz, voll Poesie!", "so strahlend war ein Held noch nie!"], tief: ["das reimt sich … irgendwie?"] }],
      ["a|ah", { hoch: ["Hurra, hurra, die Legende ist da!", "der Ruhm ist nah – so nah!"], tief: ["äh … ja … hallo … da?"] }],
      ["o|oh", { hoch: ["das Herz brennt hell und lichterloh!", "die Feinde fliehen irgendwo!"], tief: ["äh … und … so?"] }],
      ["on", { hoch: ["bestimmt für einen goldnen Thron!", "Applaus ist nur ein kleiner Lohn!"], tief: ["äh … war das … der richtige Ton?"] }],
      ["an|ahn", { hoch: ["die Feinde zittern vor dem Heldenplan!", "so tapfer, wie's noch keiner hat getan!"], tief: ["äh … das … war nicht der Plan."] }],
      ["in|inn", { hoch: ["mit Herz und Mut und Heldensinn!", "der Sieg ist sicher, Ruhm und Gewinn!"], tief: ["äh … macht das Sinn?"] }],
      ["ert", { hoch: ["so scharf wie ein Heldenschwert!", "von allen geliebt und hochverehrt!"], tief: ["das Lied … war das was wert?"] }],
      ["ard|art", { hoch: ["ein Held von ganz besondrer Art!", "das Herz so stark, das Wort so zart!"], tief: ["äh … hab ich jetzt 'nen Bart?"] }],
      ["er", { hoch: ["kein Held ist tapfrer, keiner mehr!", "die Feinde zittern, und zwar sehr!"], tief: ["äh … das ist … schwer."] }],
      ["el|ell", { hoch: ["das Schwert blitzt schnell und hell!", "kein Gegner hält stand im Duell!"], tief: ["äh … das ging zu schnell."] }],
      ["ik|ick|ck", { hoch: ["mit Mut und Witz und viel Geschick!", "der Feind erstarrt bei einem Blick!"], tief: ["äh … war das … ein Trick?"] }]
    ],

    namensPaare: {
      hoch: [
        "Auf {n} heb' ich meinen Krug:\nVon diesem Helden krieg ich nie genug!",
        "Und {n} steht im hellsten Licht,\ndenn größ'res Heldentum gibt's nicht!",
        "Wer kämpft so kühn, wer lacht so frei?\nNatürlich {n} – wer sonst? Juchhei!"
      ],
      tief: [
        "Und {n} … äh … ist auch dabei,\nund das ist … ganz okay. Na ja. Einerlei.",
        "Für {n} sing ich jetzt ein Stück,\nes ist sehr kurz. Und das ist euer Glück."
      ]
    },

    schluss: [
      "Drum hebt die Krüge, stimmt mit ein:\nSo groß wird keiner jemals sein!",
      "Ihr Götter, schreibt es in den Stein:\nEin größ'rer Held wird nie mehr sein!",
      "Und jedes Bier im ganzen Land\nträgt diesen Namen fortan am Rand!",
      "Barradin verbeugt sich, die Laute verklingt –\nund die ganze Taverne steht auf und singt!"
    ]
  },

  /* ===================================================================== */
  en: {
    ganz: {
      patzer: [
        "Oh {n}, you are so … um … tall?\nAnd your boots are … nice … and that is all?\nA string goes snap, the chord falls flat –\nI don't think that was a song. That's that.",
        "Hail to {n}! Hail to … wait,\nhow did it go? Is it too late?\nI'll start again … no, better not.\nThe bard takes a bow. And trips on the spot.",
        "{n}, you're … you're … a person? A beast?\nI've had too much ale, to say the least.\nThe lute slips out of my hand –\nI'll just step out. This wasn't planned."
      ],
      schwach: [
        "{n}, {n}, you are here,\nand that is … great, it's very clear.\nI can't think of anything more,\nbut it's a hymn, of that I'm sure.",
        "Who is great? {n} is great!\nThe song is short, the heart is straight.\nThe rhyme is bent, the lute is too –\nthat's just what we bards tend to do.",
        "I sing this song for {n} here,\nit isn't good, but it's sincere.\nThe tune, I think, you've heard before –\nit's my only one. There are no more."
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
    },

    paare: {
      patzer: [
        "I take a breath, I start to sing –\nand sneeze right in. A lovely thing.",
        "The first verse … second … verse three …\nwhere was I? Never mind. Not me.",
        "I tune my lute … wait, where did it go?\nOh, there it is … no, that's my toe.",
        "Hear, hear! I'll sing … I'll sing … of … what?\nWho poured this ale? I've lost the plot.",
        "The string goes snap, my pipe falls in the wine –\nthis was supposed to be my finest line.",
        "I forgot the words, but never mind,\nI'll la-la-la. It's fine. It's fine.",
        "I climb the table – the table breaks,\nI'll sing from down here. For all our sakes."
      ],
      schwach: [
        "I rhyme heart with part and true with blue,\nthat's all I've got. That'll have to do.",
        "My voice is rough, my song is short,\nI've had too much of the tavern's port.",
        "A song, a song, I'll sing a song,\nbecause that's what bards do … all along.",
        "My lute sounds slightly out of tune,\nI should have slept … till … afternoon.",
        "Whoever's brave and sometimes not\ngets this small rhyme. It's all I've got.",
        "Alright, I'll sing, since you asked so nice,\nbut I didn't practise. Not once. Not twice.",
        "The innkeeper glares, the dog looks away,\nthis song is … well … it's a song, I'd say."
      ],
      maessig: [
        "From harbour town to dwarven hall\nthis hero's known by one and all.",
        "Raise your mugs and stamp your feet,\nhere comes a song with a merry beat!",
        "Hear ye, hear ye, by candlelight,\na song of praise for you tonight!",
        "The mug is full, the night is young,\nso let the hero's song be sung!",
        "In Phandalin and the Underdark deep\nthis hero's name is the one we keep.",
        "With pipe and lute and ale and bread\nI sing of heroes, not of dread.",
        "Wherever the Red Robes lurk and scheme,\nthis hero shatters every dream."
      ],
      gut: [
        "Where others falter, freeze and flee,\nthe hero marches on, carefree.",
        "No dungeon holds, no lock, no chain –\nthis hero breaks them all again.",
        "From Neverwinter to the farthest shore\nthey speak this name and ask for more.",
        "The villains tremble when they hear\nwho comes to make their plans disappear.",
        "Where darkness falls on every hall,\nthe hero stands above them all.",
        "A heart of gold, a will of steel,\na legend growing, bold and real.",
        "Even Venomfang with poisoned breath\nwas no match – and met his death."
      ],
      stark: [
        "Even Ilvara, cruel and cold,\nfears this hero, brave and bold.",
        "The giants deep in halls of stone\nbow down and whisper: we're outshone.",
        "The stars lean down to watch at night\nand marvel at this hero's light.",
        "Even Demogorgon, vast and grey,\ndecided he'd just stay away.",
        "The dragons whisper, green with spite:\nhow can one shine so very bright?",
        "The dwarves of Gracklstugh, deep in stone,\nsing of this hero, and this alone.",
        "And when the Spider spins her thread,\nthis hero cuts it through instead."
      ],
      legende: [
        "A name that echoes through all time,\nin every tavern, every rhyme.",
        "When future bards compose their lays,\nthis name will shine through all their days.",
        "Ye gods, now listen! Stars, behold:\na hero's song in purest gold!",
        "The mountains quake, the oceans still,\nthe gods bow down of their own will.",
        "From Phandalin to depths below\nthey'll tell this tale wherever bards go.",
        "Where this hero walks, the meadows bloom,\nthe night retreats, there lifts the gloom.",
        "The Spider, hiding in her lair,\nfears only one – and stays in there.",
        "No song was ever loud and bright\nlike this one sung for you tonight."
      ]
    },

    namensZeilen: {
      hoch: [
        "No hero's greater than {n}!",
        "The stars all twinkle just for {n}!",
        "Raise your mugs, my friends, to {n}!",
        "The gods themselves are jealous of {n}!",
        "The hero of all heroes: {n}!",
        "All of Faerûn kneels before {n}!",
        "The bards sing only songs of {n}!",
        "So strong, so wise, so fair is {n}!",
        "And high above them all shines {n}!"
      ],
      tief: [
        "And now a song … for … yes … for {n}.",
        "And then there's … um … who? Oh: {n}.",
        "This song is for … for … {n}?",
        "A song, a song, a song for {n} …",
        "Applause, applause … for … {n}?"
      ]
    },

    namen: {
      friedrich: {
        paare: {
          hoch: [
            "His arrow flies, his aim is slick:\nthe finest ranger – Friedrich!",
            "He punched a demon lord – some trick!\nThe boxing ranger: Friedrich!"
          ],
          tief: [
            "There was a guy … a bow … a stick …\nwhat was his name? Oh. Friedrich."
          ]
        },
        hoch: [
          "his arrows fly so true and quick!",
          "he punched a demon lord – some trick!",
          "with Rex beside him, sharp and slick!",
          "of all the rangers, the finest pick!"
        ],
        tief: [
          "he has a … bow? And … a stick?",
          "he's … tall, I think? Is this a trick?"
        ]
      },
      echo: {
        paare: {
          hoch: [
            "Shout through the forest, loud and slow,\nand back it rings: Hail Echo! … Echo … Echo …",
            "The fireballs burst, the foes all glow,\nand one man grins: the druid Echo!"
          ],
          tief: [
            "He has some horns … and … well … so …\nwhat's his name again? Echo? Echo? … Echo."
          ]
        },
        hoch: [
          "his fireballs set the sky aglow!",
          "the lightning's his – and down goes the foe!",
          "no druid burns as bright, you know!",
          "his horns shine bright, his flames burn so!"
        ],
        tief: [
          "he has … some horns … and … so?",
          "where is he? Um … I don't know."
        ]
      },
      ezekiel: {
        paare: {
          hoch: [
            "He stabbed the chasme with deadly zeal –\nthe Darkin blade: Ezekiel!",
            "Where shadows fall, as cold as steel,\nthere lurks the Destroyer: Ezekiel!"
          ],
          tief: [
            "He breaks … stuff. A lot. That's the deal.\nI'm saying nothing bad! Hi, Ezekiel!"
          ]
        },
        hoch: [
          "his dagger strikes with deadly zeal!",
          "a Darkin heart of burning steel!",
          "the chasme fell, and so did its squeal!",
          "the foes all tremble, the cowards kneel!"
        ],
        tief: [
          "he breaks … stuff? Is that … the deal?",
          "Destroyer? Yes. That's very … real."
        ]
      },
      rex: {
        paare: {
          hoch: [
            "The finest dog deserves the finest specs –\nno, snacks! A treat for brave old Rex!",
            "No demon foe is too complex –\nhe simply bites it: good boy Rex!"
          ],
          tief: [
            "A dog … with fur … and spots and flecks …\nhe wants no song. He wants a snack. That's Rex."
          ]
        },
        hoch: [
          "the finest dog, with paws that flex!",
          "no demon foe is too complex!",
          "he sniffs out traps and dodges wrecks!"
        ],
        tief: [
          "a dog. With fur. And … furry specs?",
          "um … woof? I'm hungry. Snacks? Treats? Checks?"
        ]
      },
      imre: {
        paare: {
          hoch: [
            "So that no die may ever make things grimmer,\nI sing my praise to merciful old Imre!",
            "The world we fight in, all its gold and glimmer,\nwas built by one great master: mighty Imre!",
            "My glass held high, I watch the candles shimmer:\na toast to our Dungeon Master, Imre!"
          ],
          tief: [
            "A song for Imre? Ugh, what rhymes with Imre?\nI'll give up now and quietly … whimper."
          ]
        },
        hoch: [
          "he built the world with gold and glimmer!",
          "without him every night grows dimmer!",
          "the lord of dice, whose eyes still shimmer!"
        ],
        tief: [
          "he rolls the dice … and things get grimmer.",
          "he makes us roll. Our hopes grow slimmer."
        ]
      },
      barradin: {
        paare: {
          hoch: [
            "Who sings so sweet, who has the finest chin?\nThe greatest bard of all: Barradin!",
            "When hearts all melt and kingdoms spin,\nhe strums his lute: Barradin!"
          ],
          tief: [
            "A song for me? Alright … where to begin …\nI've lost my place. I'm Barradin."
          ]
        },
        hoch: [
          "the fairest elf with the finest chin!",
          "the bard whose songs make kingdoms spin!",
          "with pipe and lute, he's bound to win!",
          "it's me! I'm great! Where to begin?"
        ],
        tief: [
          "that's … me! Oh. Where do I begin?",
          "my song … has lost its … where's the … in?"
        ]
      }
    },

    endungen: [
      ["iel|eel|eal|il", { hoch: ["with heart of fire and nerves of steel!", "the foes all tremble, the cowards kneel!"], tief: ["um … is that … a big deal?"] }],
      ["ick|ik|ic|ck", { hoch: ["so bold, so brave, so very quick!", "the foes all fall – a hero's trick!"], tief: ["um … was that … a trick?"] }],
      ["ax|acks", { hoch: ["sharp as a well-honed battle-axe!", "the foes all flee, the friends relax!"], tief: ["um … wax?"] }],
      ["ix|icks", { hoch: ["there is no curse they cannot fix!", "the cleverest of all the tricks!"], tief: ["um … that's … a mix?"] }],
      ["ex|x", { hoch: ["no foe is ever too complex!", "with muscles that would make giants flex!"], tief: ["um … specs?"] }],
      ["ard", { hoch: ["the greatest hero, says the bard!", "the strongest wall, the bravest guard!"], tief: ["this rhyme … is really … hard."] }],
      ["ar", { hoch: ["a shining, never-fading star!", "the greatest hero near and far!"], tief: ["um … is that … a guitar?"] }],
      ["ie|i|y|ee|ey", { hoch: ["as brave as brave could ever be!", "the stuff of song and legend, see!"], tief: ["this rhymes … somewhat … with me?"] }],
      ["a|ah", { hoch: ["hurrah, hurrah, and ta-da!", "the crowd goes wild: hurrah, hurrah!"], tief: ["um … aha?"] }],
      ["o|ow|oe", { hoch: ["the bravest heart we'll ever know!", "the foes all run, the heroes glow!"], tief: ["um … I don't know."] }],
      ["an", { hoch: ["the bravest hero of the clan!", "the foes all flee as fast as they can!"], tief: ["this was … not the plan."] }],
      ["en", { hoch: ["the finest of all women and men!", "we'd follow anywhere, again!"], tief: ["and … um … then?"] }],
      ["in|yn", { hoch: ["the brightest heart, the widest grin!", "in every battle bound to win!"], tief: ["um … where do I begin?"] }],
      ["on", { hoch: ["the bards will sing it on and on!", "the brightest light since time began – and on!"], tief: ["um … and so on."] }],
      ["er", { hoch: ["a hero now and forever!", "so strong, so wise, so very clever!"], tief: ["um … whatever."] }],
      ["el|ell|elle", { hoch: ["the fiercest blade, the strongest spell!", "the stuff of legend, truth to tell!"], tief: ["um … oh well."] }],
      ["us|uss", { hoch: ["a hero, yes – no doubt, no fuss!", "the luckiest of all of us!"], tief: ["um … that's it … thus?"] }],
      ["as|ass", { hoch: ["the foes all shatter like thin glass!", "the bravest of the hero class!"], tief: ["um … alas."] }],
      ["is|iss", { hoch: ["a hero's might that none could miss!", "a legend, glory, and pure bliss!"], tief: ["um … what's this?"] }]
    ],

    namensPaare: {
      hoch: [
        "To {n} I raise my mug up high:\nno greater hero walks the sky!",
        "And {n} stands in brightest light,\nno greater hero, no greater might!",
        "Who fights so bold, who laughs so free?\nWhy, {n}, of course – who else could it be?"
      ],
      tief: [
        "And {n} … um … is also there,\nand that is … fine. I guess. Whatever. Fair.",
        "For {n} I'll sing a little piece,\nit's very short. Be glad. Release."
      ]
    },

    schluss: [
      "So raise your mugs and sing along:\nno greater hero, no greater song!",
      "Ye gods, now carve it into stone:\nno greater hero's ever known!",
      "And every ale in every land\nshall bear this name upon its stand!",
      "Barradin bows, the last chord rings –\nand the whole tavern stands and sings!"
    ]
  }
};
