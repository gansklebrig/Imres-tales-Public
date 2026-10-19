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
            "Im Wald ist er sanft und still und friedlich –\ndoch wehe den Feinden! Hoch lebe Friedrich!",
            "Sein Pfeil knackt jedes Schloss, ganz wie ein Dietrich –\nkein Feind ist sicher vor dem Waldläufer Friedrich!",
            "Mit Rex an der Seite sieht er aus so niedlich –\ndoch selbst Demogorgon boxt er: unser Friedrich!",
            "Er führt uns voran wie ein tapferer Fähnrich –\nmit Bogen und Herz: der Waldläufer Friedrich!"
          ],
          tief: [
            "Da war noch wer … mit Bogen … ziemlich … niedlich …\nwie hieß der gleich? Ach ja! Der Friedrich."
          ]
        },
        hoch: [
          "im Wald ganz still – im Kampf nicht friedlich!",
          "mit Rex an seiner Seite – wie niedlich!",
          "sein Pfeil knackt jedes Schloss wie ein Dietrich!",
          "er führt uns voran wie ein tapferer Fähnrich!"
        ],
        tief: [
          "der ist … ganz … niedlich?",
          "der hat 'nen Bogen. Und ist … friedlich?"
        ]
      },
      echo: {
        paare: {
          hoch: [
            "Der Fuchs, der Spatz, der Hirsch und selbst der Gecko\nverneigen sich vor dem Druiden Echo!",
            "Die Blights sind Asche, die Spinnen im Dreck, oh –\nein Hoch auf den Druiden mit Geweih: Echo!",
            "„Wer ist der Größte?“, ruf ich in den Wald – und keck, oh,\nhallt es zurück: „Echo!“ … Echo … Echo …"
          ],
          tief: [
            "Der … hat ein Geweih … und … ist weg, oh …\nich glaub, er heißt … wart … Echo? Echo? … Echo."
          ]
        },
        hoch: [
          "selbst Drachen kriechen ins Versteck, oh!",
          "sein Feuerball fegt alle Feinde weg, oh!",
          "die Feinde liegen flach im Dreck, oh!",
          "vor seinem Blitz wird jeder Dämon klein wie ein Gecko!"
        ],
        tief: [
          "der … hat ein Geweih … und ist … weg, oh?",
          "äh … wo ist der? Im Versteck, oh?"
        ]
      },
      ezekiel: {
        paare: {
          hoch: [
            "Er stach der Chasme ins Auge, und sie fiel –\nein Hoch auf den Darkin mit Stil: Ezekiel!",
            "Ein Schatten, ein Dolch, ein lautloses Spiel –\nund schon ist es vorbei: Ezekiel!",
            "Sein Dolch trifft immer und überall sein Ziel –\ndas ist der Destroyer: Ezekiel!",
            "Glühende Augen, die Rüstung subtil …\nna gut, nicht subtil. Doch mit Stil: Ezekiel!"
          ],
          tief: [
            "Der zerstört … halt … Sachen … ziemlich viel.\nIch sag nichts Falsches! Hallo, Ezekiel!"
          ]
        },
        hoch: [
          "sein Dolch trifft immer jedes Ziel!",
          "der Darkin mit dem meisten Stil!",
          "für ihn ist jeder Kampf ein Spiel!",
          "der Chasme stach er ins Auge – sie fiel!",
          "kein Schatten ist ihm zu subtil!"
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
       Die Liste wird von oben nach unten geprüft – speziellere Endungen stehen daher weiter oben
       (z. B. „aus“ vor „us“, „ier“ vor „er“, „ein“ vor „in“). Entscheidend ist nur der Klang der letzten Silbe. */
    endungen: [
      /* ---------- auf -l ---------- */
      ["iel|ihl|il|ill|eil|yl|yll", { hoch: ["der Sieg ist stets das Ziel!", "mit Herz und Mut und ganz viel Stil!", "die Feinde purzeln wie beim Kegelspiel!"], tief: ["äh … das war … ziemlich viel?", "äh … war das jetzt … ein Spiel?"] }],
      ["aul", { hoch: ["und reitet stolz auf seinem Gaul!", "und stopft jedem Schurken das Maul!"], tief: ["äh … ich bin … zu faul."] }],
      ["al|ahl|all|aal", { hoch: ["das Schwert, es blitzt wie heller Stahl!", "Applaus erfüllt den ganzen Saal!", "so strahlend wie ein Sonnenstrahl!"], tief: ["äh … gleich nochmal?", "äh … das war … egal?"] }],
      ["arl", { hoch: ["so prächtig wie ein Nordlandjarl!", "geehrt wie ein Jarl!"], tief: ["äh … ein … Jarl?"] }],
      ["el|ell|elle|ael", { hoch: ["das Schwert blitzt schnell und hell!", "kein Gegner hält stand im Duell!", "und funkelt heller als Juwel!"], tief: ["äh … das ging zu schnell.", "äh … wo ist … mein Fell?"] }],
      ["ol|oll|ohl", { hoch: ["dein Ruhm ist groß und wundervoll!", "so tapfer, mutig und so toll!", "die Krüge sind auf dich randvoll!"], tief: ["äh … zum Wohl?", "äh … war das … Moll?"] }],
      ["ul|ull|uhl", { hoch: ["der Thron ist dein, der Heldenstuhl!", "bei dir ist jeder Feind am Ende: null!"], tief: ["äh … wo ist mein … Stuhl?"] }],
      ["elm", { hoch: ["mit Flügeln an dem goldnen Helm!", "ein frecher, kühner, edler Schelm!"], tief: ["äh … wo ist … mein Helm?"] }],

      /* ---------- auf -ch / -g ---------- */
      ["ich|ig|ych", { hoch: ["so mutig und so ritterlich!", "so strahlend und so königlich!", "die Feinde fürchten dich, und wie: fürchterlich!"], tief: ["äh … ganz … ordentlich?", "äh … ich glaub … das war nicht ich."] }],
      ["sch|sh", { hoch: ["so frisch und flink wie jeder Fisch!", "mit Fäusten hart wie Eichentisch!"], tief: ["äh … ich lieg … unterm Tisch."] }],
      ["ach|agh", { hoch: ["so stark, dass zittert jedes Dach!", "die Feinde sind dagegen schwach!"], tief: ["äh … ach?"] }],
      ["och|ogh", { hoch: ["drei Mal hoch, und dann noch ein Hoch!", "selbst Drachen kriechen ins Mauseloch!"], tief: ["äh … wo war ich … noch?"] }],
      ["uch|ugh", { hoch: ["dein Name steht im Heldenbuch!", "und bricht für alle jeden Fluch!"], tief: ["äh … das war … ein Fluch."] }],

      /* ---------- auf -s / -z / -st ---------- */
      ["aust", { hoch: ["so fest wie eine Heldenfaust!", "dass es den Feinden fürchterlich graust!"], tief: ["äh … mir … graust."] }],
      ["aus|ous", { hoch: ["die Taverne tobt vor Applaus!", "die Feinde rennen schreiend raus!"], tief: ["äh … Applaus?"] }],
      ["orst|urst", { hoch: ["so stolz wie Adler hoch im Horst!", "der König über Wald und Forst!"], tief: ["äh … verirrt im Forst?"] }],
      ["ernst", { hoch: ["du kämpfst mit Witz und doch mit Ernst!"], tief: ["äh … ist das … dein Ernst?"] }],
      ["ast|aßt", { hoch: ["du bist der hochverehrte Ehrengast!", "die Feinde fliehen voller Hast!"], tief: ["äh … zu viel … Last?"] }],
      ["est", { hoch: ["für dich gibt's heut ein Riesenfest!", "berühmt von Osten bis nach West!"], tief: ["äh … und … der Rest?"] }],
      ["ist|yst", { hoch: ["mit scharfem Schwert und kluger List!", "der größte Held, der du nun bist!"], tief: ["äh … was … ist?"] }],
      ["ust|ußt", { hoch: ["voll Mut und Stolz in seiner Brust!", "die Feinde weichen voller Frust!"], tief: ["äh … ich hab … keine Lust."] }],
      ["ans|anz|ants", { hoch: ["im strahlend hellen Siegerglanz!", "die ganze Schenke tanzt den Siegestanz!"], tief: ["äh … eine … Gans?"] }],
      ["einz|eins", { hoch: ["du bist und bleibst die Nummer eins!", "kein Held ist so wie du, nicht eins!"], tief: ["äh … zwei … drei … eins?"] }],
      ["ens|enz", { hoch: ["verbeugt euch vor der Exzellenz!", "das Lied erklingt voll Eloquenz!"], tief: ["äh … falsche … Kadenz?"] }],
      ["ins|inz", { hoch: ["so edel wie ein Märchenprinz!", "ein Held, ein Recke und ein Prinz!"], tief: ["äh … ein … Prinz?"] }],
      ["ars|ahrs", { hoch: ["so stark wie Kriegsgott Mars!", "du bist der Größte – und das war's!"], tief: ["äh … war's?"] }],
      ["ers|ärs", { hoch: ["für dich der allerschönste Vers!", "die Barden dichten Vers um Vers!"], tief: ["äh … mir fehlt … ein Vers."] }],
      ["ils|ilz", { hoch: ["so selten wie ein goldner Pilz!", "der Feind verkriecht sich wie ein Pilz!"], tief: ["äh … ein … Pilz?"] }],
      ["ats|atz|atts", { hoch: ["du bist der allerbeste Schatz!", "für dich gibt's stets den ersten Platz!"], tief: ["äh … wo war mein … Satz?"] }],
      ["itz|its|itzt|zzt|iz|itts", { hoch: ["so schnell und hell wie Donnerblitz!", "mit scharfem Schwert und scharfem Witz!"], tief: ["äh … war das … ein Witz?"] }],
      ["utz|uts", { hoch: ["du bist der ganzen Truppe Schutz!", "den Feinden bietest du stets Trutz!"], tief: ["äh … nur … Schmutz?"] }],
      ["as|ass|aß|az", { hoch: ["erhebt das Glas, erhebt das Glas!", "mit dir macht jedes Abenteuer Spaß!", "die Feinde beißen schnell ins Gras!"], tief: ["äh … das war … was?"] }],
      ["es|ess|eß|ez", { hoch: ["macht mit den Bösen kurzen Prozess!", "ein Fest, ein Jubel, ein Exzess!"], tief: ["äh … zu viel … Stress?"] }],
      ["is|iss|iß|ys", { hoch: ["der Sieg ist dir gewiss!", "mit Mut und Witz und scharfem Biss!"], tief: ["äh … ganz … gewiss?"] }],
      ["os|oss|oß", { hoch: ["der Held, der Meister und der Boss!", "so edel hoch auf seinem Ross!"], tief: ["äh … was ist … los?"] }],
      ["us|uss|uß", { hoch: ["für alle Feinde ist dann Schluss!", "ein wahrer Heldengenuss!"], tief: ["ich glaub, das war's. Schluss?"] }],

      /* ---------- auf -x ---------- */
      ["ax|achs|acks|aks", { hoch: ["so schlau wie ein Dachs!", "glänzt heller noch als Kerzenwachs!"], tief: ["äh … ein Lachs?"] }],
      ["ix|icks|iks", { hoch: ["die Feinde fliehn – und zwar ganz fix!", "kein Schurke kann dir was, nix!"], tief: ["äh … nix?"] }],
      ["ex|x", { hoch: ["verdient sich jeden Ehrenkeks!", "kein Rätsel ist dir zu komplex!"], tief: ["äh … ein Klecks?"] }],

      /* ---------- auf -r ---------- */
      ["ier|ir|ihr|yr|eer", { hoch: ["drum trinkt mit mir ein großes Bier!", "des Abenteuers schönste Zier!"], tief: ["äh … wer singt … hier?"] }],
      ["or|ohr|oor", { hoch: ["die ganze Schenke singt im Chor!", "dein Ruhm steigt hoch zum Himmel empor!"], tief: ["äh … kommt mir das … nur so vor?"] }],
      ["ur|uhr|our", { hoch: ["ein Held von wahrhaft edler Natur!", "die Feinde fliehn, es bleibt nicht eine Spur!"], tief: ["äh … wie spät ist's … auf der Uhr?"] }],
      ["ar|aar|ahr", { hoch: ["so strahlend und so wunderbar!", "die Heldin, der Held – ganz klar!"], tief: ["äh … ja … wie war's … klar?"] }],
      ["ör|ür|öhr|ühr", { hoch: ["der Feind steht da wie vor der Tür!", "die Götter selbst sind ganz Gehör!"], tief: ["äh … ist das … Gehör?"] }],
      ["er", { hoch: ["kein Held ist tapfrer, keiner mehr!", "die Feinde zittern, und zwar sehr!"], tief: ["äh … das ist … schwer."] }],

      /* ---------- auf -t / -d ---------- */
      ["ort|ord", { hoch: ["die Feinde rennen alle fort!", "darauf mein Ehrenwort!"], tief: ["äh … mir fehlt das … Wort."] }],
      ["orn|örn", { hoch: ["voll heil'gem Heldenzorn!", "stets mutig ganz nach vorn!"], tief: ["äh … nochmal von vorn?"] }],
      ["ern", { hoch: ["so hell wie der Abendstern!", "geliebt von nah und fern!"], tief: ["äh … ich sing … ganz gern?"] }],
      ["ernd|ernt|ent|end|änd", { hoch: ["ein Herz, das hell vor Mut stets brennt!", "ein Held, den jedes Kind schon kennt!"], tief: ["äh … ist das … Talent?"] }],
      ["ert|erd|ehrt", { hoch: ["so scharf wie ein Heldenschwert!", "von allen geliebt und hochverehrt!"], tief: ["das Lied … war das was wert?"] }],
      ["ard|art|ardt|aart", { hoch: ["ein Held von ganz besondrer Art!", "das Herz so stark, das Wort so zart!"], tief: ["äh … hab ich jetzt 'nen Bart?"] }],
      ["urt|urd", { hoch: ["kein Fluss zu tief, er kennt die Furt!", "das größte Wunder seit Geburt!"], tief: ["äh … wo ist … mein Gurt?"] }],
      ["ald|alt", { hoch: ["der Ruhm erschallt durch jeden Wald!", "die Feinde fliehn – und das sehr bald!"], tief: ["äh … mir ist … kalt?"] }],
      ["old|olt|oldt", { hoch: ["dein Herz ist reiner noch als Gold!", "das Glück ist dir für immer hold!"], tief: ["äh … wo bleibt mein … Sold?"] }],
      ["ild|ilt", { hoch: ["so stark wie Eichenholz und Schild!", "so tapfer, kühn und wild!"], tief: ["äh … ein schiefes … Bild?"] }],
      ["eld|elt", { hoch: ["der größte Held der ganzen Welt!", "der Schrecken auf dem Schlachtenfeld!"], tief: ["äh … gibt's dafür … Geld?"] }],
      ["ond|ont|ohnt", { hoch: ["so silbern wie der helle Mond!", "stets kämpfend an der vordren Front!"], tief: ["äh … ob sich das … lohnt?"] }],
      ["und|unt", { hoch: ["die Sage geht von Mund zu Mund!", "der Treuste in dem Heldenbund!"], tief: ["äh … aus welchem … Grund?"] }],
      ["and|ant", { hoch: ["berühmt im ganzen weiten Land!", "das Schwert so sicher in der Hand!"], tief: ["äh … ich hab den Faden … nicht zur Hand."] }],
      ["ind|int", { hoch: ["so schnell wie Sturm und Wind!", "die Feinde fliehen, und zwar geschwind!"], tief: ["äh … ich sing wie … ein Kind?"] }],
      ["ied|iet", { hoch: ["für dich erklingt das schönste Lied!", "geschmiedet wie vom besten Schmied!"], tief: ["äh … was … geschieht?"] }],
      ["eit|eid|eyd", { hoch: ["der größte Held in unsrer Zeit!", "zum Kampf ist er stets bereit!"], tief: ["äh … ist es … schon so weit?"] }],
      ["ed|et|ett|eth|äd", { hoch: ["der Ruhm ist strahlend und komplett!", "wir singen dir ein Heldenduett!"], tief: ["äh … das war … ganz nett?"] }],
      ["id|it|itt|ith|yd", { hoch: ["die Feinde fliehn mit jedem Schritt!", "wir alle reiten mit dir mit!"], tief: ["äh … wer kommt noch … mit?"] }],
      ["ad|at|att|ath|aat|aad|ahd", { hoch: ["berühmt für jede Heldentat!", "mit klugem Kopf und weisem Rat!"], tief: ["äh … weiß jemand … Rat?"] }],
      ["ott|odd", { hoch: ["so herrlich wie ein Gott!", "die Feinde fliehen, und zwar flott!"], tief: ["äh … war das … Spott?"] }],
      ["ot|od|oth|oot", { hoch: ["der Retter in der höchsten Not!", "die Wangen glühen feuerrot!"], tief: ["äh … ein Stück … Brot?"] }],
      ["ud|ut|utt|uth", { hoch: ["voll Feuer, Kraft und Heldenmut!", "das Herz voll heißer Glut!"], tief: ["äh … ist alles … gut?"] }],

      /* ---------- auf -b / -p / -f ---------- */
      ["ab|ap|abb|app", { hoch: ["bis tief ins Unterreich hinab!", "die Feinde halten dich nicht ab!"], tief: ["äh … ich brech … hier ab."] }],
      ["ob|op|opp|obb", { hoch: ["dir allein gebührt das Lob!", "die Feinde fliehn im wilden Galopp!"], tief: ["äh … war das … zu grob?"] }],
      ["ieb|ib|ip|ipp", { hoch: ["ein jeder Schlag ein Meisterhieb!", "wir haben dich von Herzen lieb!"], tief: ["äh … wer war … der Dieb?"] }],
      ["ub|up|upp|ubb", { hoch: ["die Feinde fliehen – schwupp, schwupp!", "der Stärkste in der ganzen Trupp'!"], tief: ["äh … und … schwupp?"] }],
      ["alf|alph", { hoch: ["der Held, der jedem Freunde half!", "der allen aus der Klemme half!"], tief: ["äh … ob das … half?"] }],
      ["olf|olph", { hoch: ["so wild und frei wie ein Wolf!", "die Feinde heulen wie ein Wolf!"], tief: ["äh … ein … Wolf?"] }],
      ["af|aff|av|ahf|aph", { hoch: ["so edel wie ein Graf!", "die Feinde finden keinen Schlaf!"], tief: ["äh … ich zähl jetzt … Schaf?"] }],
      ["ef|eff|ev", { hoch: ["der ganzen Truppe wahrer Chef!", "der Held, der Meister und der Chef!"], tief: ["äh … wer ist hier … Chef?"] }],
      ["if|iff|iv", { hoch: ["so sicher wie ein Schwertergriff!", "der Kapitän auf jedem Schiff!"], tief: ["äh … ein falscher … Griff?"] }],
      ["of|off|oph|ov", { hoch: ["der hellste Glanz an jedem Hof!", "aus ganz besonders edlem Stoff!"], tief: ["äh … war das … doof?"] }],
      ["uf|uff", { hoch: ["von ganz besonders edlem Ruf!", "das Schönste, was der Himmel schuf!"], tief: ["äh … war das … ein Ruf?"] }],

      /* ---------- auf -k / -g ---------- */
      ["ag|ak|ack|ac|aq|aag", { hoch: ["der Held vom ersten bis zum letzten Tag!", "die Feinde fallen Schlag auf Schlag!"], tief: ["äh … was ich … mag?"] }],
      ["eg|ek|eck|ec", { hoch: ["kein Hindernis versperrt den Weg!", "so kühn, so frech, so keck!"], tief: ["äh … ein … Fleck?"] }],
      ["og|ok|ock|oc", { hoch: ["so fest und standhaft wie ein Block!", "der Feind kriegt einen Riesenschock!"], tief: ["äh … wo ist mein … Stock?"] }],
      ["ug|uk|uck|uc", { hoch: ["so tapfer, stark und weise, klug!", "auf dich erheb ich meinen Krug!"], tief: ["äh … ist das … genug?"] }],
      ["ark|arc|arg|arq", { hoch: ["so mutig, edel und so stark!", "bis tief hinein ins Knochenmark!"], tief: ["äh … war das … zu stark?"] }],
      ["erk|erg", { hoch: ["ein wahres Meisterwerk!", "so stark wie jeder Zwerg vom Berg!"], tief: ["äh … ein … Zwerg?"] }],
      ["irk|irg", { hoch: ["berühmt in jedem Land und Bezirk!", "der Stolz von jedem Stadtbezirk!"], tief: ["äh … in welchem … Bezirk?"] }],
      ["ork|org|örg|ürg|ørg", { hoch: ["die Feinde fliehn – vom Goblin bis zum Ork!", "verscheucht sogar den grimmigsten Ork!"], tief: ["äh … ich seh … 'nen Ork?"] }],
      ["urg|burg", { hoch: ["so sicher wie die stärkste Burg!", "der Herr von jeder Felsenburg!"], tief: ["äh … wo war die … Burg?"] }],
      ["ik|ick|ic|ck", { hoch: ["mit Mut und Witz und viel Geschick!", "der Feind erstarrt bei einem Blick!"], tief: ["äh … war das … ein Trick?"] }],

      /* ---------- auf -m ---------- */
      ["am|amm|ahm", { hoch: ["der Stolz von unserm ganzen Stamm!", "die Feinde werden lammfromm, zahm!"], tief: ["äh … wer … kam?"] }],
      ["em|emm|ehm", { hoch: ["geschmückt mit einem Diadem!", "für dich ist nichts ein Problem!"], tief: ["äh … ein … Problem?"] }],
      ["im|imm|ihm|ym", { hoch: ["kein Feind ist dir zu wild, zu schlimm!", "die Gegner zittern vor dem Grimm!"], tief: ["äh … so schlimm?"] }],
      ["om|omm|ohm", { hoch: ["dein Ruhm fließt breit wie ein Strom!", "die Glocken läuten laut im Dom!"], tief: ["äh … ein … Atom?"] }],
      ["um|umm|uhm", { hoch: ["unsterblich ist dein Heldenruhm!", "die Feinde fallen reihum um!"], tief: ["äh … warum?"] }],

      /* ---------- auf -n / -ng / -nk ---------- */
      ["ein|ain|eyn|ayn", { hoch: ["im hellen Kerzen- und im Sonnenschein!", "auf dich trink ich den besten Wein!"], tief: ["äh … das war … fein?"] }],
      ["an|ahn|ann|ian", { hoch: ["die Feinde zittern vor dem Heldenplan!", "so tapfer, wie's noch keiner hat getan!", "der Held, der Recke und der Mann!"], tief: ["äh … das … war nicht der Plan."] }],
      ["on|onn|ohn", { hoch: ["bestimmt für einen goldnen Thron!", "Applaus ist nur ein kleiner Lohn!"], tief: ["äh … war das … der richtige Ton?"] }],
      ["in|inn|yn|ihn", { hoch: ["mit Herz und Mut und Heldensinn!", "der Sieg ist sicher, Ruhm und Gewinn!"], tief: ["äh … macht das Sinn?"] }],
      ["un|unn|uhn", { hoch: ["die Feinde fliehn – was soll'n sie tun?", "die Waffen dürfen endlich ruhn!"], tief: ["äh … und … nun?"] }],
      ["en|enn|än|ehn", { hoch: ["der beste Held, den ich so kenn'!", "ein Held, mit dem ich gern durch Drachenhöhlen renn'!"], tief: ["äh … wie war der Name … denn?"] }],
      ["ang", { hoch: ["dir gilt der schönste Lautenklang!", "die Feinde fliehen, angst und bang!"], tief: ["äh … war das … zu lang?"] }],
      ["ing", { hoch: ["dein Name glänzt wie Gold am Ring!", "ein wahrhaft heldenhaftes Ding!"], tief: ["äh … was war das für … ein Ding?"] }],
      ["ung", { hoch: ["voll Kraft und Feuer und voll Schwung!", "so stark, so tapfer und so jung!"], tief: ["äh … Erinnerung?"] }],
      ["ong", { hoch: ["der Sieg erklingt wie ein Gong!", "so stark wie einst der King Kong!"], tief: ["äh … Ping-Pong?"] }],
      ["ank|anc", { hoch: ["dir sei der ganze Heldendank!", "für dich der allerbeste Trank!"], tief: ["äh … ich bin … krank?"] }],
      ["ink|inc", { hoch: ["so schnell und flink!", "so frei und bunt wie jeder Fink!"], tief: ["äh … ich … sink?"] }],

      /* ---------- auf Selbstlaut ---------- */
      ["ai|ay|ei|aj", { hoch: ["die Feinde fliehen mit Geschrei!", "so mutig, stark und frei!"], tief: ["äh … einerlei?"] }],
      ["oi|oy|eu|äu", { hoch: ["so ehrlich und so treu!", "an jedem Tag ein Wunder, immer neu!"], tief: ["äh … ein Haufen … Heu?"] }],
      ["au", { hoch: ["so klug, so weise und so schlau!", "die Feinde werden bleich und grau!"], tief: ["äh … ich weiß nicht … genau."] }],
      ["é|è|ée|eh|ä", { hoch: ["so strahlend weiß wie frischer Schnee!", "so zauberhaft wie eine Fee!"], tief: ["äh … gute … Idee?"] }],
      ["ie|i|y|ee|ey|ih|í|ì", { hoch: ["voll Mut, voll Glanz, voll Poesie!", "so strahlend war ein Held noch nie!"], tief: ["das reimt sich … irgendwie?"] }],
      ["u|uh|ou|oo|ú|ù", { hoch: ["die Feinde fliehen schnell im Nu!", "kein Held ist tapfrer so wie du!"], tief: ["äh … und … du?"] }],
      ["a|ah|á|à", { hoch: ["Hurra, hurra, die Legende ist da!", "der Ruhm ist nah – so nah!"], tief: ["äh … ja … hallo … da?"] }],
      ["o|oh|ow|ó|ò", { hoch: ["das Herz brennt hell und lichterloh!", "die Feinde fliehen irgendwo!"], tief: ["äh … und … so?"] }],

      /* ---------- auf -e (Endsilbe mit Mitlaut davor) ---------- */
      ["ke|cke", { hoch: ["kein Feind entkommt aus deiner Pranke!", "für dich das Lied, das ich dir schenke!"], tief: ["äh … danke?"] }],
      ["le|lle", { hoch: ["dein Mut glüht heller als die Kohle!", "ein Held mit großer, edler Seele!"], tief: ["äh … meine … Kehle …"] }],
      ["ne|nne", { hoch: ["so strahlend wie die Sonne!", "dir allein gebührt die Krone!"], tief: ["äh … meine … Bühne?"] }],
      ["re|rre", { hoch: ["dir allein gebührt die Ehre!", "dein Name klingt bis an die Meere!"], tief: ["äh … Ehre? … Beere?"] }],
      ["se|sse|ße|ze", { hoch: ["so sanft und stark wie eine Brise!", "ein Held, ein Recke, ja, ein Riese!"], tief: ["äh … eine … Krise?"] }],
      ["ge|gge", { hoch: ["die Feinde zittern, angst und bange!", "die fallen alle – nicht mehr lange!"], tief: ["äh … dauert das … noch lange?"] }],
      ["we|ve", { hoch: ["so stolz und mutig wie ein Löwe!", "die Feinde flattern weg wie Möwe!"], tief: ["äh … eine … Möwe?"] }],
      ["de", { hoch: ["die ganze Welt ist voller Freude!", "das Gold der Sieger, das Geschmeide!"], tief: ["äh … war das … schade?"] }],
      ["te|tte|the", { hoch: ["kein Feind, der sich zu kämpfen traute!", "voll Glanz, als ob der Morgen graute!"], tief: ["äh … wo … ist die Laute?"] }],
      ["me|mme", { hoch: ["die Feinde lauschen deiner Stimme!", "im Herzen lodert eine Flamme!"], tief: ["äh … meine … Stimme …"] }],
      ["be|pe|ppe", { hoch: ["für dich die allerschönste Gabe!", "und alle tragen deine Farbe!"], tief: ["äh … ist das … die Suppe?"] }],
      ["che|sche|he", { hoch: ["die Feinde fürchten deine Rache!", "du führst die gute Sache!"], tief: ["äh … Drache? … Lache?"] }]
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
            "He punched a demon lord – some trick!\nThe boxing ranger: Friedrich!",
            "Through forest, fog and thorny thicket,\nno one tracks like Friedrich!"
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
            "The fox, the bird, the deer, and even the gecko\nbow down before the druid Echo!",
            "The blights are ashes, the spiders a wreck, oh –\nall hail the antlered druid: Echo!",
            "“Who's the greatest?” I shout through the trees – and, what the heck, oh,\nback it rings: “Echo!” … Echo … Echo …"
          ],
          tief: [
            "He … has antlers … and … what the heck, oh …\nI think he's called … Echo? Echo? … Echo."
          ]
        },
        hoch: [
          "the dragon cowers, small as a gecko!",
          "his lightning leaves the foes a wreck, oh!",
          "his fireball? Foes gone in a sec, oh!",
          "the beasts all bow – from bear to gecko!"
        ],
        tief: [
          "he has … some antlers … and … what the heck, oh?",
          "where is he? Hiding like a gecko?"
        ]
      },
      ezekiel: {
        paare: {
          hoch: [
            "He stabbed the chasme with deadly zeal –\nthe Darkin blade: Ezekiel!",
            "Where shadows fall, as cold as steel,\nthere lurks the Destroyer: Ezekiel!",
            "One shadow, one dagger, one silent deal –\nand it's over: Ezekiel!"
          ],
          tief: [
            "He breaks … stuff. A lot. That's the deal.\nI'm saying nothing bad! Hi, Ezekiel!"
          ]
        },
        hoch: [
          "his dagger strikes with deadly zeal!",
          "a Darkin heart of burning steel!",
          "one silent stab – and that's the deal!",
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

    /* Ending of the name → rhyming lines. Checked top to bottom, so more specific endings come first. */
    endungen: [
      /* -l */
      ["ale|ail|ayle", { hoch: ["the bravest hero of the tale!", "the foes all tremble, weak and pale!"], tief: ["um … another ale?"] }],
      ["iel|eel|eal|il|ill|eil|yl|yll", { hoch: ["with heart of fire and nerves of steel!", "the foes all tremble, the cowards kneel!"], tief: ["um … is that … a big deal?"] }],
      ["al|all|aul|awl", { hoch: ["the tallest of the heroes all!", "the foes all stumble, trip and fall!"], tief: ["um … that's all."] }],
      ["arl", { hoch: ["the foes all flee before your snarl!"], tief: ["um … a snarl?"] }],
      ["ils|ills", { hoch: ["the bravest hero, with the skills!", "renowned across the vales and hills!"], tief: ["um … chills?"] }],
      ["el|ell|elle|ael", { hoch: ["the fiercest blade, the strongest spell!", "the stuff of legend, truth to tell!"], tief: ["um … oh well."] }],
      ["ol|oll|ole", { hoch: ["a hero in complete control!", "with fire burning in the soul!"], tief: ["um … my role?"] }],
      ["elm", { hoch: ["the hero standing at the helm!", "the greatest in the realm!"], tief: ["um … overwhelm?"] }],
      /* -s / -z / -x */
      ["aus|ous|us|uss", { hoch: ["a hero, yes – no doubt, no fuss!", "the luckiest of all of us!"], tief: ["um … that's it … thus?"] }],
      ["aust|ust", { hoch: ["the foes all crumble into dust!", "in you we place our faith and trust!"], tief: ["um … I must?"] }],
      ["est", { hoch: ["the bravest, boldest and the best!", "the champion of every quest!"], tief: ["um … I need a rest."] }],
      ["orst|urst|irst", { hoch: ["the bravest, boldest and the first!", "the foes all flee, they fear the worst!"], tief: ["um … I've got a thirst."] }],
      ["einz|eins|ines", { hoch: ["the brightest star that ever shines!", "the foe gives up, the foe resigns!"], tief: ["um … I forgot my lines?"] }],
      ["itz|its|itzt|zzt|iz|izz", { hoch: ["the foes are struck as by a blitz!", "the cleverest of all the wits!"], tief: ["um … in bits?"] }],
      ["utz|uts", { hoch: ["a hero full of fire and guts!", "a hero, and no ifs or buts!"], tief: ["um … no ifs or buts."] }],
      ["ats|atz|atts", { hoch: ["the foes all scatter like the rats!", "the crowd throws up their cheers and hats!"], tief: ["um … the cats?"] }],
      ["as|ass|az", { hoch: ["the foes all shatter like thin glass!", "the bravest of the hero class!"], tief: ["um … alas."] }],
      ["es|ess|ez", { hoch: ["the bravest hero, nothing less!", "the crowd cries out: yes, yes, yes!"], tief: ["um … I guess?"] }],
      ["is|iss|ys", { hoch: ["a hero's might that none could miss!", "a legend, glory, and pure bliss!"], tief: ["um … what's this?"] }],
      ["os|oss", { hoch: ["the biggest, baddest, bravest boss!", "the foes all flee and count their loss!"], tief: ["um … at a loss."] }],
      ["ance|ants|ans|anz", { hoch: ["the foes all freeze – they stand no chance!", "the tavern rises up to dance!"], tief: ["um … in a trance?"] }],
      ["ax|acks", { hoch: ["sharp as a well-honed battle-axe!", "the foes all flee, the friends relax!"], tief: ["um … wax?"] }],
      ["ix|icks", { hoch: ["there is no curse they cannot fix!", "the cleverest of all the tricks!"], tief: ["um … that's … a mix?"] }],
      ["ex|x", { hoch: ["no foe is ever too complex!", "with muscles that would make giants flex!"], tief: ["um … specs?"] }],
      /* -r */
      ["rre|air|aire|are", { hoch: ["a hero with such style and flair!", "the foes all flee in sheer despair!"], tief: ["um … I don't care?"] }],
      ["ier|ir|eer|ear|yr", { hoch: ["the crowds all cheer for you right here!", "a hero who will have no fear!"], tief: ["um … another beer?"] }],
      ["or|oor|ore|our", { hoch: ["the bravest one in any war!", "the crowds all cheer and shout for more!"], tief: ["um … what's this for?"] }],
      ["art|eart", { hoch: ["the bravest and the purest heart!", "a hero right from the very start!"], tief: ["um … where do I start?"] }],
      ["irk|erk|urk", { hoch: ["the foes all fear a hero's smirk!", "a hero never known to shirk!"], tief: ["um … is that … a quirk?"] }],
      ["ard", { hoch: ["the greatest hero, says the bard!", "the strongest wall, the bravest guard!"], tief: ["this rhyme … is really … hard."] }],
      ["ar|arr", { hoch: ["a shining, never-fading star!", "the greatest hero near and far!"], tief: ["um … is that … a guitar?"] }],
      ["ars|arrs", { hoch: ["the brightest of the shining stars!", "as mighty as the god of Mars!"], tief: ["um … guitars?"] }],
      ["er|ur", { hoch: ["a hero now and forever!", "so strong, so wise, so very clever!"], tief: ["um … whatever."] }],
      /* -t / -d */
      ["ord", { hoch: ["the sharpest edge of any sword!", "the people's champion and lord!"], tief: ["um … I'm bored?"] }],
      ["orn|örn", { hoch: ["the greatest hero ever born!", "so sound the trumpet, blow the horn!"], tief: ["um … my lute is torn."] }],
      ["ert|urt|irt|erd", { hoch: ["forever brave, forever alert!", "the foes are left lying in the dirt!"], tief: ["um … my throat … it's hurt."] }],
      ["old|olt", { hoch: ["a heart of pure and shining gold!", "the bravest of the bold!"], tief: ["um … I'm cold."] }],
      ["ald|alt", { hoch: ["the foes all grind to a halt!", "a hero's courage without fault!"], tief: ["um … my fault?"] }],
      ["und|ond|unt|ont", { hoch: ["the bravest here and far beyond!", "of you the bards are very fond!"], tief: ["um … I'm fond?"] }],
      ["and|ant", { hoch: ["the bravest hero in the land!", "the foes all flee from your command!"], tief: ["um … I lost the band."] }],
      ["ent|end|ernd", { hoch: ["the hero's strength is never spent!", "a hero truly heaven-sent!"], tief: ["um … where'd it go … it went."] }],
      ["eit|ite|ight", { hoch: ["the bravest hero, shining bright!", "the foes all flee into the night!"], tief: ["um … not quite."] }],
      ["uth|ooth", { hoch: ["a hero of eternal youth!", "the bravest blade, and that's the truth!"], tief: ["um … my tooth?"] }],
      ["ed|ead", { hoch: ["the foes all flee in fear and dread!", "with crown of glory on the head!"], tief: ["um … what was it I said?"] }],
      ["id|yd", { hoch: ["the foes all fled and ran and hid!", "no braver deed than what you did!"], tief: ["um … what … did?"] }],
      ["ad|add|ahd", { hoch: ["the best of times we ever had!", "it makes the crowd so very glad!"], tief: ["um … was that bad?"] }],
      ["at|att", { hoch: ["the finest feather in the hat!", "a hero's hero – that is that!"], tief: ["um … where's my hat?"] }],
      ["et|ett", { hoch: ["the bravest hero, I would bet!", "a song that no one will forget!"], tief: ["um … not done yet?"] }],
      ["eth|ath", { hoch: ["the bravest blade from birth to death!", "the crowd cheers till they're out of breath!"], tief: ["um … out of breath."] }],
      ["ot|ott", { hoch: ["the bravest of the whole lot!", "a hero never once forgot!"], tief: ["um … I lost the plot."] }],
      ["ate|ait", { hoch: ["the master of their very fate!", "so come, let's all now celebrate!"], tief: ["um … am I late?"] }],
      /* -b / -p / -f / -v */
      ["ab|abb", { hoch: ["the foes all flee from every stab!", "with every jab, the foes go drab!"], tief: ["um … a crab?"] }],
      ["ipp|ip", { hoch: ["a steady hand, a steady grip!", "the captain of the hero ship!"], tief: ["um … a slip?"] }],
      ["ob|op", { hoch: ["the crowd's a cheering, singing mob!", "you did a mighty hero's job!"], tief: ["um … I'm a slob."] }],
      ["alf|alph", { hoch: ["the whole tavern cheers on your behalf!", "a hero, not a mere half!"], tief: ["um … only half?"] }],
      ["olf|olph|ulf", { hoch: ["as fierce and wild as any wolf!", "the foes all flee before the wolf!"], tief: ["um … a wolf?"] }],
      ["af|aff|av", { hoch: ["a mighty mage with sword and staff!", "the foes are nothing more than chaff!"], tief: ["um … a laugh?"] }],
      ["if|iff|eif|ief", { hoch: ["the foes all tumble off the cliff!", "no foe can stand you, not a whiff!"], tief: ["um … a whiff?"] }],
      ["ef|eff|ev", { hoch: ["the top commander and the chef!"], tief: ["um … I'm deaf?"] }],
      ["oph|of|off", { hoch: ["the foes all run and scurry off!", "the bravest hero, not a toff!"], tief: ["um … a cough."] }],
      ["uf|uff", { hoch: ["a hero made of sterner stuff!", "the foes have had more than enough!"], tief: ["um … enough."] }],
      ["ave", { hoch: ["the bravest of the brave!", "the foes all crawl back to their cave!"], tief: ["um … I need a shave."] }],
      ["eve|ieve", { hoch: ["more glory than you could believe!", "the foes all flee and take their leave!"], tief: ["um … make-believe?"] }],
      /* -k */
      ["ake|aik", { hoch: ["the earth itself begins to quake!", "the foes all tremble, shiver, shake!"], tief: ["um … a mistake?"] }],
      ["ike|yke", { hoch: ["as swift and deadly as a lightning strike!", "the bravest hero, none alike!"], tief: ["um … a hike?"] }],
      ["ig", { hoch: ["the hero's heart is very big!", "the foes all flee and dance a jig!"], tief: ["um … a pig?"] }],
      ["ack|ac|ak|aq", { hoch: ["the foes all flee and don't come back!", "no courage do you ever lack!"], tief: ["um … I lost track."] }],
      ["eck|ek|ec", { hoch: ["the bravest hero, what the heck!", "the foes all bow and bend the neck!"], tief: ["um … a wreck."] }],
      ["ock|ok|og|oc", { hoch: ["as steady as a mountain rock!", "the foes all scatter in shock!"], tief: ["um … writer's block."] }],
      ["uck|uk|ug|uc", { hoch: ["with courage, skill and lots of luck!", "the foes all flee – the ducks all duck!"], tief: ["um … I'm stuck."] }],
      ["ark|arc", { hoch: ["a light that shines in every dark!", "a hero's flame, a hero's spark!"], tief: ["um … a lark?"] }],
      ["ick|ik|ic|ck", { hoch: ["so bold, so brave, so very quick!", "the foes all fall – a hero's trick!"], tief: ["um … was that … a trick?"] }],
      /* -m */
      ["am|amm", { hoch: ["the bravest band – and here I am!", "as stubborn as a battering ram!"], tief: ["um … I'm in a jam."] }],
      ["im|ym|imm", { hoch: ["a cup of glory to the brim!", "the foes all flee, their faces grim!"], tief: ["um … a whim?"] }],
      ["om|dom", { hoch: ["they'll sing of you in every kingdom!", "a beacon bright of shining wisdom!"], tief: ["um … wisdom?"] }],
      ["um|umb", { hoch: ["so beat the bells and beat the drum!", "the bravest yet, the best to come!"], tief: ["um … um … um."] }],
      /* -n / -ng / -nk */
      ["ain|ane|ayne|aine", { hoch: ["the brightest sun after the rain!", "the bravest blade in all the plain!"], tief: ["um … again?"] }],
      ["ene|ine|een|ean", { hoch: ["the bravest hero ever seen!", "the noblest knight, the fairest queen!"], tief: ["um … what does that mean?"] }],
      ["one|onne|own", { hoch: ["the bravest hero ever known!", "and sitting proud upon the throne!"], tief: ["um … I'm all alone."] }],
      ["an", { hoch: ["the bravest hero of the clan!", "the foes all flee as fast as they can!"], tief: ["this was … not the plan."] }],
      ["en", { hoch: ["the finest of all women and men!", "we'd follow anywhere, again!"], tief: ["and … um … then?"] }],
      ["in|yn|inn", { hoch: ["the brightest heart, the widest grin!", "in every battle bound to win!"], tief: ["um … where do I begin?"] }],
      ["on", { hoch: ["the bards will sing it on and on!", "the brightest light since time began – and on!"], tief: ["um … and so on."] }],
      ["ang", { hoch: ["the battle bells all rang and rang!", "the tavern shook with quite a bang!"], tief: ["um … I sang?"] }],
      ["ing", { hoch: ["of every hero, you're the king!", "for you the bards will always sing!"], tief: ["um … everything?"] }],
      ["ong", { hoch: ["a hero brave and true and strong!", "we'll sing of you the whole night long!"], tief: ["um … was that wrong?"] }],
      ["ank", { hoch: ["the foes all walk the plank!", "the finest hero of the rank!"], tief: ["um … my mind is blank."] }],
      ["ink", { hoch: ["much faster than a blink!", "the foes all flee and shrink!"], tief: ["um … let me think."] }],
      /* vowels */
      ["ay|ai|é|ée", { hoch: ["they'll sing of you till Judgement Day!", "the foes all flee and run away!"], tief: ["um … okay?"] }],
      ["oy|oi", { hoch: ["a hero's pride, a bard's own joy!", "the bravest girl or bravest boy!"], tief: ["um … oh boy."] }],
      ["ew|ue|oo|ou|u", { hoch: ["so brave, so bold, so ever true!", "no foe could ever see it through!"], tief: ["um … who?"] }],
      ["ose", { hoch: ["the bravest hero, heaven knows!", "the foes all flee on tippy-toes!"], tief: ["um … I suppose."] }],
      ["ie|i|y|ee|ey", { hoch: ["as brave as brave could ever be!", "the stuff of song and legend, see!"], tief: ["this rhymes … somewhat … with me?"] }],
      ["a|ah", { hoch: ["hurrah, hurrah, and ta-da!", "the crowd goes wild: hurrah, hurrah!"], tief: ["um … aha?"] }],
      ["o|ow|oe", { hoch: ["the bravest heart we'll ever know!", "the foes all run, the heroes glow!"], tief: ["um … I don't know."] }]
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
