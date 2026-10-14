/* =====================================================================
   BARRADINS SPOTTBUCH – Beleidigungen für den „Gehässigen Spott“ in der Taverne
   ---------------------------------------------------------------------
   {n} steht für den Gegner, der verspottet wird.

   Stufen wie beim Loblied:
     patzer  = natürliche 1 → Barradin beleidigt aus Versehen sich selbst
     schwach = Summe bis 11        maessig = 12–16       gut = 17–21
     stark   = 22–25               legende = ab 26       krit = natürliche 20

   Die Bausteine:
     eigentor   Selbstbeleidigungen für den kritischen Patzer
     allgemein  Beleidigungen für jeden Gegner, nach Stufe
     kreaturen  maßgeschneiderter Spott für bestimmte Gegner (Name klein,
                ohne Leer- und Sonderzeichen: „Kuo-Toa“ → kuotoa)
     reime / kreaturReime / eigentorReime   dasselbe in Reimform
     reaktion   wie der Gegner reagiert, nach Stufe

   Neue Beleidigungen: einfach eine Zeile in Anführungszeichen ergänzen,
   mit Komma getrennt. Zeilenumbruch = \n
   ===================================================================== */
window.BARRADIN_SPOTT = {
  de: {
    eigentor: [
      "Du eitler, pfeiferauchender, über die eigenen Füße stolpernder Elf mit dem viel zu schönen Kinn! … Moment. Das bin ja ich.",
      "Du lächerlicher Möchtegernbarde mit nur einer einzigen Melodie im Repertoire! … Oh nein. Ich hab in den Spiegel geschaut.",
      "Du … du … Barde! Ja, genau, du BARDE! … Wieso gucken mich alle so an?",
      "Hah! Dein Vater ist in der Alternative für Elfen! … Oh. Meiner auch. Das war ein Eigentor.",
      "Dein Gesang klingt wie eine Katze im Weinfass! … Hab ich gerade über meinen eigenen Gesang gesprochen? Ich fürchte, ja.",
      "Du stinkst nach Pfeifenkraut und billigem Wein! … Ich rieche mal kurz an meinem Ärmel. Ja. Verdammt."
    ],

    allgemein: {
      schwach: [
        "{n}, du bist … äh … hässlich? Und du riechst … ein bisschen?",
        "Hey, {n}! Deine Mutter … äh … hat dich bestimmt lieb. Nein, warte, das war falsch herum.",
        "{n}, du … du Dings! Du Dingsbums!",
        "Du bist doof, {n}. So. Jetzt ist es raus.",
        "{n}, ich finde dich … nicht so gut. Auf einer Skala von eins bis zehn: eher so sechs."
      ],
      maessig: [
        "{n}, du hast das Charisma eines nassen Stiefels.",
        "Ich habe Kuhfladen gesehen, die mehr Würde hatten als du, {n}.",
        "{n}, selbst dein Schatten schämt sich, dir zu folgen.",
        "Du kämpfst wie ein Goblin mit Schnupfen, {n}.",
        "{n}, wenn Dummheit leuchten würde, bräuchten wir im Unterreich keine Fackeln mehr."
      ],
      gut: [
        "{n}, du bist der Grund, warum es im Unterreich keine Spiegel gibt.",
        "Ich würde dich ja beleidigen, {n}, aber die Natur ist mir schon gründlich zuvorgekommen.",
        "{n}, deine Existenz ist ein gescheiterter Rettungswurf der Schöpfung.",
        "Man sagt, jedes Wesen hat einen Zweck, {n}. Deiner ist offenbar, ein abschreckendes Beispiel zu sein.",
        "{n}, wärst du ein Zauber, dann ein Zaubertrick. Und zwar ein schlechter."
      ],
      stark: [
        "{n}, die Götter haben dich erschaffen, um zu beweisen, dass auch sie Fehler machen.",
        "Wenn ich dich ansehe, {n}, verstehe ich endlich, warum manche Völker lieber unter der Erde leben.",
        "{n}, selbst ein Mimik würde sich weigern, deine Gestalt anzunehmen.",
        "Ich habe Gallertwürfel mit mehr Rückgrat getroffen als dich, {n}.",
        "{n}, dein Anblick ist ein Fluch – und deine Stimme der Fluch, der ihn verlängert."
      ],
      legende: [
        "{n}, du bist eine Beleidigung für jede Kreatur, die je gekrochen, gekreucht oder geschleimt hat. Und glaub mir, die Messlatte lag tief.",
        "Wenn man im Wörterbuch „Enttäuschung“ nachschlägt, {n}, findet man dein Bild. Darunter steht: „Selbst das Wörterbuch bereut es.“",
        "{n}, du bist so überflüssig, dass dich sogar der Tod zweimal von seiner Liste gestrichen hat.",
        "Man wird Lieder über dich singen, {n}. Kurze. Mit Gelächter am Ende. Und ich schreibe sie alle."
      ],
      krit: [
        "Hör zu, {n}, mein Wort trifft wie ein Dolch:\nDu bist kein Monster, du bist bloß ein Strolch.\nDein Brüllen klingt wie ein verstimmtes Horn,\nund selbst dein Spiegelbild hat dich verlor'n!",
        "O {n}, du Gipfel der Erbärmlichkeit,\ndu Tintenklecks im großen Buch der Zeit!\nSelbst Krähen lachen, wenn du dich bewegst –\nich hoff, dass du's mit Fassung trägst!",
        "Ein Lied für dich, {n}, ganz ohne Gnade:\nDu bist wie Suppe – lauwarm, fad und schade.\nDie Götter schufen dich an einem schlechten Tag,\nund keiner, wirklich keiner, der dich mag!"
      ]
    },

    kreaturen: {
      demogorgon: [
        "Zwei Köpfe, {n}, und trotzdem kein einziger Gedanke.",
        "{n}, du hast zwei Köpfe, und keiner will mit dem anderen reden. Kann ich verstehen.",
        "Friedrich hat dich geboxt, {n}. FRIEDRICH. Lass das mal sacken.",
        "Dämonenfürst? Eher Dämonenfürst-Praktikant, {n}."
      ],
      venomfang: [
        "Ein Drache, {n}? Ich habe Eidechsen mit mehr Ausstrahlung gesehen.",
        "Dein Giftatem riecht wie Ezekiels Socken, {n}. Und das ist kein Kompliment.",
        "{n}, du wurdest von einem Barden hypnotisiert. Von einem BARDEN. Mit Laute."
      ],
      blight: [
        "{n}, du bist im Grunde nur Brennholz mit Selbstbewusstsein.",
        "Ein Feuerball von Echo, {n}, und du warst Kaminanzünder.",
        "{n}, selbst Unkraut hat mehr Würde als du."
      ],
      chasme: [
        "{n}, du bist eine überdimensionierte Stechmücke mit Größenwahn.",
        "Dein Summen nervt mehr als alles, was ich je gehört habe, {n}. Und ich kenne meinen eigenen Gesang.",
        "Ezekiel hat dir ins Auge gestochen, {n}. Ins AUGE. Wie peinlich ist das denn?"
      ],
      vrock: [
        "{n}, du bist ein Geier, der sich für einen Dämon hält.",
        "Deine Federn sehen aus wie ein Kissen nach einer Kneipenschlägerei, {n}.",
        "{n}, Echo hat dich mit einem Blitz gegrillt. Hast du gut geschmeckt? Nein? Dachte ich mir."
      ],
      kuotoa: [
        "{n}, ihr betet Steine an und wundert euch, dass keiner zurückbetet.",
        "Ihr riecht nach altem Fisch, {n}. Weil ihr alter Fisch seid.",
        "{n}, eure Götter sind erfunden, eure Stadt ist Schutt, und euer Atem ist unverzeihlich."
      ],
      ploopploopeen: [
        "Ploopploopeen? Ich nenne dich Blublupin, {n}, und daran ändert sich nichts.",
        "{n}, dein Name klingt wie ein Frosch, der in eine Pfütze fällt."
      ],
      ilvara: [
        "{n}, du hast dich als Druidin verkleidet. Selbst die Verkleidung hatte mehr Persönlichkeit als du.",
        "Du bist von einer Brücke gesprungen, {n}. Das Klügste, was du je getan hast."
      ],
      glasstab: [
        "Glasstab, {n}? Wie passend. Du warst genauso zerbrechlich.",
        "{n}, du hast der Spinne gedient. Nicht mal Spinnen wollen dir dienen."
      ],
      ettercap: [
        "{n}, du webst Netze wie ein betrunkener Zwerg Socken strickt.",
        "Halb Spinne, halb Mensch, ganz und gar überflüssig, {n}."
      ],
      riese: [
        "So groß, {n}, und trotzdem so ein kleines Hirn.",
        "{n}, die Stimmen in deinem Kopf haben sich über dich beschwert."
      ]
    },

    /* Gereimte Beleidigungen – Barradin liebt sie */
    eigentorReime: [
      "Du eitler Pfau mit Pfeife, Laut' und Kinn,\ndu … du … Moment. Ich weiß, wer ich bin.",
      "Dein Reim ist schief, dein Lied ist schlecht,\nund … oh. Das war mein Lied. Na, das ist gerecht."
    ],

    reime: {
      schwach: [
        "{n}, du bist … wie sag ich's … krumm,\nund … äh … ein bisschen dumm? Na, darum.",
        "Du riechst nach Käse, {n}, und nach Socken –\nmehr Reime hab ich nicht. Ich bleib hier hocken.",
        "{n}, du bist hässlich wie … ein Huhn?\nDas Huhn ist eigentlich ganz hübsch. Was nun?"
      ],
      maessig: [
        "{n}, dein Gesicht – ein Graus, ein Schreck,\nselbst Schnecken kriechen schneller davon vom Fleck.",
        "{n}, du bist zäh wie altes Leder\nund klug wie eine Gänsefeder.",
        "Man sagt, du seist gefährlich, {n}, und gemein –\nich glaub, du bist nur hässlich. Und allein.",
        "Du kämpfst so wild wie nasser Teig, {n},\nund denkst so flink wie ein morscher Zweig."
      ],
      gut: [
        "Die Mutter weinte, als sie dich gebar, {n},\nund weint noch heut – das ist doch sonnenklar.",
        "{n}, du bist ein Fehler im Gewebe der Welt,\nein Zaubertrick, der niemandem gefällt.",
        "Wenn Dummheit Gold wär', {n}, wärst du reich,\nein König gar im ganzen Unterreich.",
        "Dein Hirn, {n}, ist eine leere Truhe,\nund selbst die Motten darin finden keine Ruhe."
      ],
      stark: [
        "{n}, du bist kein Albtraum, nur ein schlechter Traum,\nwie kalter Brei mit einem Haar im Schaum.",
        "Selbst Demogorgon wirkt neben dir charmant, {n} –\nund der hat Tentakel statt Verstand.",
        "Wo andre Schatten werfen, wirfst du Scham,\n{n}, du Häufchen Elend, lahm und zahm.",
        "Du bist so finster, {n}, so voller Hass –\nund doch so lächerlich wie ein umgekipptes Fass."
      ],
      legende: [
        "O {n}, du Ausgeburt von Mief und Schleim,\ndu bist zu schlecht für jeden guten Reim!\nDrum reim ich schlecht, das passt zu dir genau:\nDu bist ein Witz. Und ich bin furchtbar schlau.",
        "Hört her, ihr Leut', ich sing vom kleinsten Wicht:\nEr heißt {n} und hat kein Gesicht –\nnur einen Fleck, wo andre eines tragen,\nund selbst der Fleck will nichts mehr dazu sagen.",
        "{n}, man sagt, du seist ein Schrecken alter Zeit –\nich sag: ein Schrecken nur für deine Eitelkeit.\nDein Spiegel ist zerbrochen – nicht verkehrt,\ner hat sich bloß aus Notwehr gewehrt."
      ],
      krit: [
        "Ich, Barradin, verkünde laut und klar:\n{n} ist das Hässlichste, das je geschah!\nDie Drachen lachen, die Dämonen auch,\nund selbst dein Schatten flieht mit flauem Bauch!",
        "Ein Lied, so scharf wie Ezekiels Klinge:\n{n}, du bist das kläglichste der Dinge!\nDu kriechst, du stinkst, du jammerst wie ein Kind –\nnun renn nach Haus, so schnell wie Wind!"
      ]
    },

    kreaturReime: {
      demogorgon: [
        "Zwei Köpfe, {n}, und doch kein einz'ger Plan –\nund Friedrich haute dir eins auf den Zahn!",
        "Ein Dämonenfürst? Ach bitte, sei doch still, {n}:\nDu bist ein Tintenfisch, der Fürst sein will!"
      ],
      venomfang: [
        "Ein grüner Drache, {n}? Eher grüner Schleim,\nhypnotisiert vom Barden – das ist mein Reim!",
        "Dein Giftatem, {n}, ist bloß Mundgeruch,\nich hab ihn notiert in meinem Fluchbuch."
      ],
      blight: [
        "{n}, du bist Gestrüpp mit roten Augen,\nzu nichts als Feuerholz scheinst du zu taugen."
      ],
      chasme: [
        "Du summst und brummst, {n}, und stichst im Kreis –\ndoch Ezekiels Dolch im Aug', das war dein Preis!"
      ],
      vrock: [
        "Ein Geier, {n}, der sich für schrecklich hält,\ndoch Echos Blitz hat dich ganz schnell gefällt!"
      ],
      kuotoa: [
        "Ihr Fischgesichter, {n}, glotzt so stumpf und blöd,\nselbst euer Gott war ausgedacht – wie öd!"
      ],
      ploopploopeen: [
        "Ploopploopeen, Blublupin – egal, wie man dich nennt:\nDein Name klingt nach Frosch, der durch die Pfütze rennt."
      ],
      ilvara: [
        "Du Druidin aus Lügen, {n}, so falsch wie Gift im Tee,\nsprangst von der Brücke – und keiner rief: oh weh."
      ],
      glasstab: [
        "Glasstab, so zerbrechlich, so dünn und so klar –\nein Pfeil von Friedrich, und weg warst du. Wunderbar."
      ],
      riese: [
        "So groß, {n}, und doch so klein im Kopf –\nein Riesenkessel mit 'nem leeren Topf."
      ],
      ettercap: [
        "{n}, du webst dein Netz so schief und krumm,\nselbst Spinnen schauen weg und sagen: dumm."
      ]
    },

    reaktion: {
      patzer: "Barradin hält inne. Dann setzt er sich still in eine Ecke und denkt über sein Leben nach.",
      schwach: "{n} blinzelt verwirrt und weiß nicht recht, ob das eine Beleidigung war.",
      maessig: "{n} knurrt verärgert. Das hat gesessen. Ein bisschen.",
      gut: "{n} zuckt zusammen. Irgendwo in der Taverne ruft jemand: „Ohhh!“",
      stark: "{n} wankt. Das Selbstwertgefühl liegt in Scherben.",
      legende: "{n} bricht zusammen und weint bitterlich. Die Taverne applaudiert.",
      krit: "{n} sinkt auf die Knie. Nichts wird je wieder so sein wie vorher. Die Taverne tobt."
    }
  },

  /* ===================================================================== */
  en: {
    eigentor: [
      "You vain, pipe-smoking, tripping-over-your-own-feet elf with a far too handsome chin! … Wait. That's me.",
      "You ridiculous wannabe bard with only one tune in your repertoire! … Oh no. I was looking in a mirror.",
      "You … you … BARD! Yes, you, you BARD! … Why is everyone looking at me?",
      "Hah! Your father is a member of the Alternative for Elves! … Oh. So is mine. That was an own goal.",
      "Your singing sounds like a cat in a wine barrel! … Was I just describing my own singing? I'm afraid I was.",
      "You reek of pipeweed and cheap wine! … Let me sniff my sleeve. Yes. Blast."
    ],

    allgemein: {
      schwach: [
        "{n}, you're … um … ugly? And you smell … a bit?",
        "Hey, {n}! Your mother … um … loves you very much. No, wait, that was the wrong way round.",
        "{n}, you … you thing! You … thingamajig!",
        "You're stupid, {n}. There. I said it.",
        "{n}, I don't think you're … that great. On a scale of one to ten: about a six."
      ],
      maessig: [
        "{n}, you have the charisma of a wet boot.",
        "I've seen cow pats with more dignity than you, {n}.",
        "{n}, even your shadow is ashamed to follow you.",
        "You fight like a goblin with a head cold, {n}.",
        "{n}, if stupidity glowed, we'd never need torches in the Underdark again."
      ],
      gut: [
        "{n}, you are the reason there are no mirrors in the Underdark.",
        "I'd insult you, {n}, but nature has already done a thorough job.",
        "{n}, your existence is creation's failed saving throw.",
        "They say every creature has a purpose, {n}. Yours appears to be serving as a warning.",
        "{n}, if you were a spell, you'd be a cantrip. A bad one."
      ],
      stark: [
        "{n}, the gods made you to prove that even they make mistakes.",
        "When I look at you, {n}, I finally understand why some peoples prefer to live underground.",
        "{n}, even a mimic would refuse to take your shape.",
        "I've met gelatinous cubes with more backbone than you, {n}.",
        "{n}, the sight of you is a curse – and your voice is the curse that makes it last."
      ],
      legende: [
        "{n}, you are an insult to every creature that has ever crawled, crept or oozed. And believe me, the bar was low.",
        "If you look up 'disappointment' in the dictionary, {n}, you'll find your picture. Underneath it says: 'Even the dictionary regrets this.'",
        "{n}, you are so pointless that Death has crossed you off his list twice.",
        "They will sing songs about you, {n}. Short ones. With laughter at the end. And I'll write every single one."
      ],
      krit: [
        "Now listen, {n}, my words cut like a knife:\nyou're not a monster, you're a waste of life.\nYour roar sounds like a badly tuned old horn,\nand even your reflection wishes it weren't born!",
        "O {n}, you summit of the sorry and the sad,\nyou inkblot in the finest book time ever had!\nEven crows start laughing when you move –\nI hope you've got the strength to take this groove!",
        "A song for you, {n}, with no mercy at all:\nyou're like cold soup – bland, grey and small.\nThe gods made you on a very bad day,\nand nobody, nobody wants you to stay!"
      ]
    },

    kreaturen: {
      demogorgon: [
        "Two heads, {n}, and still not a single thought.",
        "{n}, you have two heads and neither of them wants to talk to the other. I get it.",
        "Friedrich punched you, {n}. FRIEDRICH. Let that sink in.",
        "Demon prince? More like demon prince's intern, {n}."
      ],
      venomfang: [
        "A dragon, {n}? I've seen lizards with more presence.",
        "Your poison breath smells like Ezekiel's socks, {n}. And that is not a compliment.",
        "{n}, you were hypnotised by a bard. A BARD. With a lute."
      ],
      blight: [
        "{n}, you're basically firewood with self-confidence.",
        "One fireball from Echo, {n}, and you were kindling.",
        "{n}, even weeds have more dignity than you."
      ],
      chasme: [
        "{n}, you're an oversized mosquito with delusions of grandeur.",
        "Your buzzing is more annoying than anything I've ever heard, {n}. And I know my own singing.",
        "Ezekiel stabbed you in the eye, {n}. The EYE. How embarrassing is that?"
      ],
      vrock: [
        "{n}, you're a vulture who thinks it's a demon.",
        "Your feathers look like a pillow after a tavern brawl, {n}.",
        "{n}, Echo grilled you with a lightning bolt. Did you taste good? No? Thought not."
      ],
      kuotoa: [
        "{n}, you worship rocks and wonder why nobody worships you back.",
        "You smell like old fish, {n}. Because you are old fish.",
        "{n}, your gods are made up, your city is rubble and your breath is unforgivable."
      ],
      ploopploopeen: [
        "Ploopploopeen? I call you Blublupin, {n}, and that's not going to change.",
        "{n}, your name sounds like a frog falling into a puddle."
      ],
      ilvara: [
        "{n}, you disguised yourself as a druid. Even the disguise had more personality than you.",
        "You jumped off a bridge, {n}. The smartest thing you've ever done."
      ],
      glasstaff: [
        "Glasstaff, {n}? How fitting. You were just as fragile.",
        "{n}, you served the Spider. Not even spiders want to serve you."
      ],
      ettercap: [
        "{n}, you weave webs like a drunk dwarf knits socks.",
        "Half spider, half man, entirely pointless, {n}."
      ],
      giant: [
        "So big, {n}, and yet such a tiny brain.",
        "{n}, the voices in your head have filed a complaint about you."
      ]
    },

    /* Gereimte Beleidigungen – Barradin liebt sie */
    eigentorReime: [
      "You vain old peacock with pipe and lute and chin,\nyou … you … wait. I know the state I'm in.",
      "Your rhyme is crooked, your song is bad,\nand … oh. That's my song. Well, that's sad."
    ],

    reime: {
      schwach: [
        "{n}, you're … how do I say it … grim?\nAnd also … um … your head is dim? Hmm.",
        "You smell like cheese, {n}, and like socks –\nthat's all I've got. I'll sit here on these rocks.",
        "{n}, you're as ugly as … a hen?\nNo, hens are pretty. Let me start again."
      ],
      maessig: [
        "{n}, your face – a fright, a scare,\neven snails would hurry out of there.",
        "{n}, you're tough as an old boot\nand clever as a turnip root.",
        "They say you're dangerous, {n}, and mean –\nI say you're just the ugliest thing I've seen.",
        "You fight as wild as soggy dough, {n},\nand think as fast as a rotting log, you know."
      ],
      gut: [
        "Your mother wept the day that you were born, {n},\nand still weeps every single morn.",
        "{n}, you're a flaw in the weave of the world,\na cantrip that should never have been hurled.",
        "If stupidity were gold, {n}, you'd be rich,\nthe Underdark's own king without a hitch.",
        "Your brain, {n}, is an empty chest –\neven the moths inside can't get any rest."
      ],
      stark: [
        "{n}, you're not a nightmare, just a bad dream,\nlike cold porridge with a hair in the cream.",
        "Next to you, {n}, even Demogorgon seems charming –\nand he's got tentacles where brains should be. Alarming.",
        "Where others cast a shadow, you cast shame,\n{n}, you sad and sorry, limping, lame old game.",
        "You're so dark, {n}, so full of spite –\nand yet as silly as a toppled barrel at night."
      ],
      legende: [
        "O {n}, you spawn of mould and slime,\nyou're far too bad for any decent rhyme!\nSo I'll rhyme badly – that suits you just fine:\nyou're a joke. And this whole stage is mine.",
        "Hear, hear, good folk, I sing of the smallest wight:\nhis name is {n}, and he's a sorry sight –\nwhere others have a face, he has a stain,\nand even that stain wants to leave again.",
        "{n}, they say you're a terror of ancient days –\nI say you terrify mirrors in a hundred ways.\nYours shattered, and that wasn't wrong:\nit just defended itself. Took it long."
      ],
      krit: [
        "I, Barradin, proclaim it loud and clear:\n{n} is the ugliest thing that's ever been here!\nThe dragons laugh, the demons do as well,\nand even your own shadow says: farewell!",
        "A song as sharp as Ezekiel's blade:\n{n}, you're the sorriest thing ever made!\nYou crawl, you stink, you whimper like a child –\nnow run off home, all weeping, wet and wild!"
      ]
    },

    kreaturReime: {
      demogorgon: [
        "Two heads, {n}, and still not one plan –\nand Friedrich punched you, like a proper man!",
        "A demon prince? Oh hush, {n}, be still:\nyou're just a squid with a crown and no skill."
      ],
      venomfang: [
        "A green dragon, {n}? More like green goo,\nhypnotised by a bard – that's me, not you!"
      ],
      blight: [
        "{n}, you're shrubbery with ruby eyes,\nthe perfect kindling – what a nice surprise!"
      ],
      chasme: [
        "You buzz and hum, {n}, and sting in a ring –\nbut Ezekiel's dagger in your eye? Now that stings!"
      ],
      vrock: [
        "A vulture, {n}, who thinks it's oh so grim,\nbut Echo's lightning fried you, limb by limb!"
      ],
      kuotoa: [
        "You fish-faced fools, {n}, so dull and so dense,\neven your god was made up – no offence."
      ],
      ploopploopeen: [
        "Ploopploopeen, Blublupin – whatever, who cares:\nyour name sounds like a frog falling down the stairs."
      ],
      ilvara: [
        "A druid made of lies, {n}, as false as poisoned tea,\nyou jumped off a bridge – and nobody cried, not me."
      ],
      glasstaff: [
        "Glasstaff, so fragile, so thin and so clear –\none arrow from Friedrich, and you disappeared."
      ],
      giant: [
        "So tall, {n}, and yet so small inside your head –\nthe voices in there would rather talk to me instead."
      ],
      ettercap: [
        "{n}, you weave your web so crooked and so thin,\neven spiders look away and won't come in."
      ]
    },

    reaktion: {
      patzer: "Barradin pauses. Then he quietly sits down in a corner and reflects on his life.",
      schwach: "{n} blinks in confusion, not quite sure whether that was an insult.",
      maessig: "{n} growls in annoyance. That landed. A little.",
      gut: "{n} flinches. Somewhere in the tavern someone shouts: \"Ooooh!\"",
      stark: "{n} staggers. Their self-esteem lies in pieces.",
      legende: "{n} collapses and weeps bitterly. The tavern applauds.",
      krit: "{n} sinks to their knees. Nothing will ever be the same again. The tavern goes wild."
    }
  }
};
