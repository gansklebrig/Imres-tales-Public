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

   Weiter unten in dieser Datei steckt das Spiel „Loblied & Spott“ selbst
   (Bühne, Figuren, 3D-W20, Versbuch) – es nutzt diese Beleidigungen und
   die Reime aus reime.js.
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
        "{n}, ihr betet einen Dämon mit zwei Köpfen an – und habt zusammen nicht mal einen halben Verstand.",
        "Euer Kult riecht nach altem Fisch und schlechten Ideen, {n}.",
        "{n}, eure falsche Erzpriesterin predigt, und ihr glotzt wie Fische, die auf den Köder warten.",
        "Ploopploopeen hat euch gewarnt, {n}. Aber nein, ihr musstet ja unbedingt den Dämon anbeten."
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
      ],
      bugbear: [
        "{n}, du riechst wie ein nasser Bär, der in einen Goblin gefallen ist.",
        "Bugbear? Eher Bug als Bear, {n}.",
        "{n}, du hast dich im Hinterhalt versteckt – hinter einem einzigen Grashalm."
      ],
      themberchaud: [
        "{n}, du bist so fett, dass die Duergar dich mit der Schubkarre umbetten.",
        "Ein roter Drache, {n}? Eher ein roter Sitzsack mit Mundgeruch.",
        "{n}, du schläfst auf einem Goldhaufen, weil kein Bett der Welt dich trägt."
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
        "Ihr Kultisten, {n}, kniet vor Tentakeln nieder –\nder falsche Gott, und ihr die falschen Brüder!"
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
      ],
      bugbear: [
        "Ein Bugbear, {n}, zottelig und dumm –\nim Hinterhalt fiel er als Erster um!"
      ],
      themberchaud: [
        "{n}, du Drache, faul und fett,\ndie Duergar nennen dich ihr Bett!"
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
        "{n}, you worship a demon with two heads – and between all of you there isn't half a brain.",
        "Your cult smells of old fish and bad ideas, {n}.",
        "{n}, your false archpriestess preaches, and you gape like fish waiting for the bait.",
        "Ploopploopeen warned you, {n}. But no, you just had to worship the demon."
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
      ],
      bugbear: [
        "{n}, you smell like a wet bear that fell into a goblin.",
        "Bugbear? More bug than bear, {n}.",
        "{n}, you hid in an ambush – behind a single blade of grass."
      ],
      themberchaud: [
        "{n}, you're so fat the duergar move you around in a wheelbarrow.",
        "A red dragon, {n}? More like a red beanbag with bad breath.",
        "{n}, you sleep on a pile of gold because no bed in the world can hold you."
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
        "You cultists, {n}, bow down to tentacles and slime –\nyou picked the wrong god at the very worst time!"
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
      ],
      bugbear: [
        "A bugbear, {n}, shaggy, dim and slow –\nfirst to fall in the ambush, don't you know!"
      ],
      themberchaud: [
        "{n}, you dragon, lazy, round and red,\nthe duergar use you as a feather bed!"
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


/* =====================================================================
   LOBLIED & SPOTT – das Spiel auf der Tavernenkarte #barden-probe
   ---------------------------------------------------------------------
   Baut die Karte komplett neu auf (das HTML-Gerüst aus index.html wird
   ersetzt, damit die alte Würfelprobe in extras.js nicht mehr greift):
     • Bühne mit wechselnder Kulisse (Taverne, Marktplatz, Unterreich,
       Horgas Halle), Tageszeit, Wetter und zufälligem Publikum
     • Barradin als gezeichnete Figur mit Sprechblase (Vers Wort für Wort)
     • das Ziel reagiert sichtbar: Gesicht, Pose, Tränen, Wut, Schaden
     • ein echter 3D-W20, der über die Bühne kullert
     • Barradins Versbuch: gesungene Reime werden freigeschaltet
   Reime: reime.js (BARRADIN_REIME), Beleidigungen: oben (BARRADIN_SPOTT).
   Controller: root._probe (siehe ganz unten).
   ===================================================================== */
(function () {
  "use strict";
  const root = document.getElementById("barden-probe");
  if (!root || root._probe) return;

  const ruhig = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const sprache = () => (document.documentElement.lang === "en" ? "en" : "de");
  const zufall = l => l[Math.floor(Math.random() * l.length)];
  const zz = (a, b) => a + Math.random() * (b - a);
  const esc = s => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const lies = (k, d) => { try { const v = localStorage.getItem(k); return v == null ? d : v; } catch (_) { return d; } };
  const schreib = (k, v) => { try { localStorage.setItem(k, v); } catch (_) {} };
  const klemm = (x, a, b) => Math.max(a, Math.min(b, x));
  const schluessel = n => String(n).toLowerCase().replace(/[^a-zäöüßéèêáàâíìóòúùñ]/g, "");
  const w4 = n => { let x = 0; for (let i = 0; i < n; i++) x += 1 + Math.floor(Math.random() * 4); return x; };

  const BONUS = 7; /* Barradins Auftreten-Bonus */
  const LOB_ZIELE = ["Friedrich", "Echo", "Ezekiel", "Rex", "Imre", "Barradin"];
  const ZIEL_EXTRA = { de: ["Ilvara", "Glasstab", "Riese", "Themberchaud"], en: ["Ilvara", "Glasstaff", "Giant", "Themberchaud"] };
  /* englische Schlüssel im Spottbuch → gemeinsamer Schlüssel fürs Versbuch */
  const KANON = { glasstaff: "glasstab", giant: "riese" };

  /* ---------- Texte ---------- */
  const TX = {
    de: {
      modusLob: "♪ Loblied", modusSpott: "⚔ Spott",
      lobLabel: "Auftreten-Probe", lobTitel: "Barradins Loblied",
      lobText: "Wähle, wen Barradin besingen soll, und wirf den W20. Je höher der Wurf, desto prächtiger der Reim.",
      spottLabel: "Gehässiger Spott", spottTitel: "Barradins Spott",
      spottText: "Wähle einen Gegner und wirf den W20. Je höher der Wurf, desto vernichtender die Beleidigung. Vorsicht bei einer 1 …",
      lobZiel: "Wen besingen?", spottZiel: "Wen verspotten?",
      andere: "Jemand anderes …", namePlatz: "Name eintragen", du: "dich",
      werfen: "W20 werfen", nochmal: "Nochmal werfen", weiter: "Weiter", wirft: "Würfel rollt …",
      tipp: "Wirf den Würfel!", auftreten: "Auftreten", inspiration: "Inspiration",
      inspBereit: "✦ Bardische Inspiration bereit: +1W6",
      stufen: { patzer: "Kritischer Patzer!", schwach: "Mau", maessig: "Ganz ordentlich", gut: "Gelungen", stark: "Grandios", legende: "Legendär!", krit: "Natürliche 20!" },
      eigentor: "Eigentor!",
      buehne: {
        patzer: "Barradin stolpert über die eigenen Füße. Die Laute macht ein trauriges Plonk.",
        schwach: "Ein paar Gäste husten verlegen.",
        maessig: "Höflicher Applaus aus der Ecke.",
        gut: "Die Taverne klatscht, jemand wirft eine Münze.",
        stark: "Die Gäste springen auf und jubeln!",
        legende: "Tosender Applaus! Man trägt Barradin auf Schultern durch den Saal.",
        krit: "Die Menge rastet aus! Rosen fliegen, Krüge klirren, irgendwo weint ein Zwerg vor Rührung."
      },
      schaden: x => x + " psychischer Schaden", schadenKrit: x => x + " psychischer Schaden – kritisch!",
      schadenKein: "Rettungswurf geschafft – kein Schaden", schadenSelbst: x => x + " psychischer Schaden – an Barradin selbst",
      psychisch: "psychisch",
      selbstwert: "Selbstwert", flieht: n => n + " flieht heulend von der Bühne!", zurueck: n => n + " ist zurück – das Ego notdürftig geflickt.",
      gold: "Trinkgeld", goldPlus: n => "+" + n + " Gold",
      wuerfe: "Würfe", vertrieben: "vertrieben",
      kulisse: "Kulisse wechseln",
      orte: { taverne: "Steinhügel-Gasthaus, Phandalin", markt: "Marktplatz von Phandalin", hoehle: "Unterreich, vor Gracklstugh", halle: "Audienzhalle von König Horga" },
      zeiten: { morgen: "im Morgengrauen", tag: "am Mittag", abend: "am Abend", nacht: "um Mitternacht" },
      buch: "Versbuch", buchTitel: "Barradins Versbuch", buchZu: "Schließen",
      buchText: (n, g) => n + " von " + g + " Versen gesungen",
      kapitel: { lob: "♪ Loblieder", spott: "⚔ Spott & Hohn" },
      abschnitt: {
        ganz: "Ganze Lieder", paare: "Reimpaare", namen: "Persönliche Reime", schluss: "Krönende Schlüsse",
        eigentor: "Eigentore", eigentorReime: "Gereimte Eigentore", allgemein: "Beleidigungen", reime: "Gereimter Spott",
        kreaturen: "Maßgeschneidert", kreaturReime: "Maßgeschneiderte Reime"
      },
      gesperrt: "Noch nicht gesungen", nameFrei: "Name",
      neuVers: n => n === 1 ? "✦ Neuer Vers im Versbuch!" : "✦ " + n + " neue Verse im Versbuch!",
      raenge: ["Schankbarde", "Wanderbarde", "Bühnenbarde", "Hofbarde", "Meisterbarde", "Legende von Faerûn"],
      rang: "Rang",
      lage: { hoch: "für gute Würfe", tief: "für schlechte Würfe" },
      ziele: { patzer: "Patzer", schwach: "Mau", maessig: "Ordentlich", gut: "Gelungen", stark: "Grandios", legende: "Legendär", krit: "Natürliche 20" }
    },
    en: {
      modusLob: "♪ Praise", modusSpott: "⚔ Mockery",
      lobLabel: "Performance check", lobTitel: "Barradin's Song of Praise",
      lobText: "Pick who Barradin should sing about and roll the d20. The higher the roll, the grander the rhyme.",
      spottLabel: "Vicious Mockery", spottTitel: "Barradin's Mockery",
      spottText: "Pick a foe and roll the d20. The higher the roll, the more devastating the insult. Beware of a 1 …",
      lobZiel: "Who should he praise?", spottZiel: "Who should he mock?",
      andere: "Someone else …", namePlatz: "Enter a name", du: "you",
      werfen: "Roll the d20", nochmal: "Roll again", weiter: "Skip", wirft: "Rolling …",
      tipp: "Roll the die!", auftreten: "Performance", inspiration: "Inspiration",
      inspBereit: "✦ Bardic Inspiration ready: +1d6",
      stufen: { patzer: "Critical fumble!", schwach: "Meh", maessig: "Decent", gut: "Well done", stark: "Magnificent", legende: "Legendary!", krit: "Natural 20!" },
      eigentor: "Own goal!",
      buehne: {
        patzer: "Barradin trips over his own feet. The lute makes a sad little plonk.",
        schwach: "A few guests cough awkwardly.",
        maessig: "Polite applause from the corner.",
        gut: "The tavern claps, someone tosses a coin.",
        stark: "The guests leap up and cheer!",
        legende: "Thunderous applause! They carry Barradin through the hall on their shoulders.",
        krit: "The crowd goes wild! Roses fly, mugs clink, somewhere a dwarf is weeping with joy."
      },
      schaden: x => x + " psychic damage", schadenKrit: x => x + " psychic damage – critical!",
      schadenKein: "Saving throw succeeded – no damage", schadenSelbst: x => x + " psychic damage – to Barradin himself",
      psychisch: "psychic",
      selbstwert: "Self-esteem", flieht: n => n + " flees the stage, sobbing!", zurueck: n => n + " is back – ego hastily patched up.",
      gold: "Tips", goldPlus: n => "+" + n + " gold",
      wuerfe: "Rolls", vertrieben: "driven off",
      kulisse: "Change scenery",
      orte: { taverne: "Stonehill Inn, Phandalin", markt: "Phandalin market square", hoehle: "Underdark, outside Gracklstugh", halle: "King Horga's audience hall" },
      zeiten: { morgen: "at dawn", tag: "at noon", abend: "in the evening", nacht: "at midnight" },
      buch: "Songbook", buchTitel: "Barradin's Songbook", buchZu: "Close",
      buchText: (n, g) => n + " of " + g + " verses sung",
      kapitel: { lob: "♪ Songs of praise", spott: "⚔ Mockery & scorn" },
      abschnitt: {
        ganz: "Whole songs", paare: "Rhyming couplets", namen: "Personal rhymes", schluss: "Grand finales",
        eigentor: "Own goals", eigentorReime: "Rhymed own goals", allgemein: "Insults", reime: "Rhymed mockery",
        kreaturen: "Tailor-made", kreaturReime: "Tailor-made rhymes"
      },
      gesperrt: "Not sung yet", nameFrei: "Name",
      neuVers: n => n === 1 ? "✦ New verse in the songbook!" : "✦ " + n + " new verses in the songbook!",
      raenge: ["Tavern bard", "Wandering bard", "Stage bard", "Court bard", "Master bard", "Legend of Faerûn"],
      rang: "Rank",
      lage: { hoch: "for good rolls", tief: "for bad rolls" },
      ziele: { patzer: "Fumble", schwach: "Meh", maessig: "Decent", gut: "Well done", stark: "Magnificent", legende: "Legendary", krit: "Natural 20" }
    }
  };
  const t = () => TX[sprache()];

  /* Wie das besungene Gruppenmitglied reagiert: tief (1–11), mitte, hoch (ab 22 / 20) */
  const LOB_REAKTION = {
    de: {
      friedrich: { tief: ["Friedrich klopft Barradin mitleidig auf die Schulter.", "Friedrich tut so, als müsste er dringend nach seinen Pfeilen sehen."], mitte: ["Friedrich lächelt verlegen und kratzt sich am Bart.", "Friedrich wird rot bis unter die Kapuze."], hoch: ["Friedrich wischt sich heimlich eine Träne weg. Rex leckt sie ihm ab.", "Friedrich ist sprachlos. Dann umarmt er Barradin so fest, dass die Laute knackt."] },
      echo: { tief: ["Echo hebt eine Augenbraue. Das Geweih wackelt skeptisch.", "Echo verwandelt sich kurz in einen Stein. Zum Weghören."], mitte: ["Echo nickt anerkennend. Ein Spatz landet auf seinem Geweih.", "Echo lächelt, und irgendwo im Gebälk blüht eine Blume auf."], hoch: ["Echo ist so gerührt, dass ringsum Blumen aus den Dielen sprießen.", "Echo weint Freudentränen. Aus jeder wächst ein kleines Kleeblatt."] },
      ezekiel: { tief: ["Ezekiels Augen glühen. Nicht vor Freude.", "Ezekiel prüft demonstrativ die Schärfe seines Dolchs."], mitte: ["Ezekiel tut gelangweilt. Seine Augen glühen trotzdem eine Spur heller.", "Ezekiel nickt. Einmal. Das ist bei ihm ein Jubelsturm."], hoch: ["Ezekiel the Destroyer … errötet. Niemand darf je davon erfahren.", "Ezekiel muss kurz raus. Er hat etwas im Auge. Angeblich Staub."] },
      rex: { tief: ["Rex legt den Kopf schief. Dann gähnt er ausgiebig.", "Rex dreht sich dreimal im Kreis und schläft ein."], mitte: ["Rex wedelt mit dem Schwanz. Ein Keks wäre jetzt angemessen.", "Rex bellt einmal im Takt. Fast."], hoch: ["Rex wedelt so heftig, dass er umfällt. Wuff!", "Rex heult begeistert mit. Die ganze Taverne heult mit."] },
      imre: { tief: ["Imre notiert sich etwas. Das ist nie ein gutes Zeichen.", "Imre würfelt verdeckt hinter dem Schirm. Und lächelt."], mitte: ["Imre grinst hinter dem Spielleiterschirm. Vielleicht gibt's Inspiration.", "Imre nickt anerkennend und legt den Würfel wieder weg."], hoch: ["Imre ist gerührt und vergibt spontan Inspiration. Und ein Bier.", "Imre steht auf und klatscht. Die Glitzerhose funkelt mit."] },
      barradin: { tief: ["Barradins Spiegelbild schaut weg. Es schämt sich.", "Das Spiegelbild zuckt mit den Schultern. Kann ja mal passieren."], mitte: ["Das Spiegelbild zwinkert. Barradin zwinkert zurück.", "Barradin und sein Spiegelbild werfen sich Kusshände zu."], hoch: ["Barradin und sein Spiegelbild sind sich einig: der Größte, Schönste, Beste.", "Der Spiegel glüht vor Bewunderung. Fast springt er aus dem Rahmen."] },
      gast: { tief: ["{n} schaut sich um, ob vielleicht jemand anderes gemeint ist.", "{n} lächelt tapfer und klatscht zweimal."], mitte: ["{n} wird ein bisschen rot und winkt in die Menge.", "{n} lässt sich das Lied gleich nochmal vorsingen. Im Kopf."], hoch: ["{n} wird von der Menge auf Schultern durch den Saal getragen!", "{n} ist zu Tränen gerührt und bestellt eine Runde für alle!"] }
    },
    en: {
      friedrich: { tief: ["Friedrich gives Barradin a pitying pat on the shoulder.", "Friedrich suddenly has to check on his arrows. Urgently."], mitte: ["Friedrich smiles sheepishly and scratches his beard.", "Friedrich blushes all the way up to his hood."], hoch: ["Friedrich secretly wipes away a tear. Rex licks it off.", "Friedrich is speechless. Then he hugs Barradin so hard the lute creaks."] },
      echo: { tief: ["Echo raises an eyebrow. The antlers wobble sceptically.", "Echo briefly turns into a rock. To stop listening."], mitte: ["Echo nods approvingly. A sparrow lands on his antlers.", "Echo smiles, and a flower blooms somewhere in the rafters."], hoch: ["Echo is so moved that flowers sprout from the floorboards.", "Echo weeps tears of joy. Each one grows a tiny clover."] },
      ezekiel: { tief: ["Ezekiel's eyes glow. Not with joy.", "Ezekiel pointedly checks how sharp his dagger is."], mitte: ["Ezekiel acts bored. His eyes glow a little brighter anyway.", "Ezekiel nods. Once. For him, that's a standing ovation."], hoch: ["Ezekiel the Destroyer … blushes. No one must ever know.", "Ezekiel has to step outside. Something in his eye. Dust, apparently."] },
      rex: { tief: ["Rex tilts his head. Then yawns at length.", "Rex turns around three times and falls asleep."], mitte: ["Rex wags his tail. A biscuit would be appropriate now.", "Rex barks once, in time. Almost."], hoch: ["Rex wags so hard he falls over. Woof!", "Rex howls along with delight. The whole tavern howls along."] },
      imre: { tief: ["Imre writes something down. That's never a good sign.", "Imre rolls behind the screen. And smiles."], mitte: ["Imre grins behind the DM screen. Maybe there's inspiration in it.", "Imre nods approvingly and puts the die back down."], hoch: ["Imre is touched and hands out inspiration on the spot. And an ale.", "Imre stands up and applauds. The glitter trousers sparkle along."] },
      barradin: { tief: ["Barradin's reflection looks away. It's embarrassed.", "The reflection shrugs. Happens to the best of us."], mitte: ["The reflection winks. Barradin winks back.", "Barradin and his reflection blow each other kisses."], hoch: ["Barradin and his reflection agree: the greatest, handsomest, best.", "The mirror glows with admiration. It nearly leaps out of the frame."] },
      gast: { tief: ["{n} looks around in case someone else was meant.", "{n} smiles bravely and claps twice."], mitte: ["{n} blushes a little and waves to the crowd.", "{n} replays the song in their head. Twice."], hoch: ["{n} is carried through the hall on the crowd's shoulders!", "{n} is moved to tears and buys a round for everyone!"] }
    }
  };

  /* ---------- Speicher ---------- */
  const SPEICHER = "imres-probe";
  function standLesen() {
    let s = {};
    try { s = JSON.parse(lies(SPEICHER, "{}")) || {}; } catch (_) { s = {}; }
    if (!Array.isArray(s.buch)) s.buch = [];
    s.gold = Math.max(0, parseInt(s.gold, 10) || 0);
    s.wuerfe = Math.max(0, parseInt(s.wuerfe, 10) || 0);
    s.krits = Math.max(0, parseInt(s.krits, 10) || 0);
    s.patzer = Math.max(0, parseInt(s.patzer, 10) || 0);
    if (!s.vertrieben || typeof s.vertrieben !== "object") s.vertrieben = {};
    return s;
  }
  let stand = standLesen();
  let buchSet = new Set(stand.buch.filter(x => typeof x === "string"));
  function standSpeichern() { stand.buch = Array.from(buchSet); schreib(SPEICHER, JSON.stringify(stand)); }

  /* =====================================================================
     DICHTEN – baut Lied bzw. Spott und merkt sich, welche Verse benutzt wurden
     ===================================================================== */
  const letzte = [];
  const nimm = (liste, praefix, ids) => { const i = Math.floor(Math.random() * liste.length); if (praefix && ids) ids.push(praefix + i); return liste[i]; };
  function dichte(stufe, name) {
    const R = (window.BARRADIN_REIME || {})[sprache()];
    const ids = [];
    if (!R) return { text: name + "!", ids };
    const hoch = !(stufe === "patzer" || stufe === "schwach");
    const lage = hoch ? "hoch" : "tief";
    const pool = stufe === "krit" ? "legende" : stufe;
    const key = schluessel(name);
    const eigenePaare = R.namen[key] && R.namen[key].paare && R.namen[key].paare[lage];
    let reime = R.namen[key] && R.namen[key][lage];
    if (!reime) {
      const e = R.endungen.find(([m]) => new RegExp("(" + m + ")$").test(key));
      reime = e && e[1][lage];
    }
    const namensTeil = () => eigenePaare && eigenePaare.length && Math.random() < .6
      ? nimm(eigenePaare, "l.namen." + key + "." + lage + ".", ids)
      : reime && reime.length && Math.random() < .85
      ? zufall(R.namensZeilen[lage]) + "\n" + zufall(reime)
      : zufall(R.namensPaare[lage]);
    const paare = n => {
      const liste = (R.paare[pool] || []).map((p, i) => [p, i]).sort(() => Math.random() - .5).slice(0, n);
      liste.forEach(([, i]) => ids.push("l.paare." + pool + "." + i));
      return liste.map(x => x[0]);
    };
    let teile;
    if (Math.random() < .2 && R.ganz[stufe] && R.ganz[stufe].length) {
      teile = [nimm(R.ganz[stufe], "l.ganz." + stufe + ".", ids)];
    } else if (stufe === "legende" || stufe === "krit") {
      const [p1, p2] = paare(2);
      teile = [p1, p2, namensTeil(), nimm(R.schluss, "l.schluss.", ids)];
    } else if (stufe === "stark") {
      const [p1, p2] = paare(2);
      teile = [p1, namensTeil(), p2];
    } else {
      const [p1] = paare(1);
      teile = Math.random() < .5 ? [p1, namensTeil()] : [namensTeil(), p1];
    }
    const text = teile.filter(Boolean).join("\n").split("{n}").join(name);
    return { text: text.charAt(0).toUpperCase() + text.slice(1), ids };
  }
  function spotte(stufe, name) {
    const S = (window.BARRADIN_SPOTT || {})[sprache()];
    const ids = [];
    if (!S) return { text: name + "!", ids };
    if (stufe === "patzer") {
      const a = S.eigentor, b = S.eigentorReime || [], i = Math.floor(Math.random() * (a.length + b.length));
      if (i < a.length) { ids.push("s.eigentor." + i); return { text: a[i], ids }; }
      ids.push("s.eigentorReime." + (i - a.length)); return { text: b[i - a.length], ids };
    }
    const key = schluessel(name);
    const findeK = obj => obj ? Object.keys(obj).find(x => key === x || key.indexOf(x) > -1) : null;
    const kE = findeK(S.kreaturen), kR = findeK(S.kreaturReime);
    const eigen = kE && S.kreaturen[kE], eigenReim = kR && S.kreaturReime[kR];
    const stA = S.allgemein[stufe] ? stufe : "gut", allg = S.allgemein[stA];
    const gereimt = (S.reime && S.reime[stufe]) || [];
    const pE = kE && "s.kreaturen." + (KANON[kE] || kE) + ".", pR = kR && "s.kreaturReime." + (KANON[kR] || kR) + ".";
    const pA = "s.allgemein." + stA + ".", pG = "s.reime." + stufe + ".";
    const r = Math.random();
    let text;
    if (stufe === "schwach") text = gereimt.length && r < .5 ? nimm(gereimt, pG, ids) : nimm(allg, pA, ids);
    else if (stufe === "legende" || stufe === "krit") {
      const vorne = eigenReim && r < .3 ? nimm(eigenReim, pR, ids) : eigen && r < .45 ? nimm(eigen, pE, ids) : "";
      const i = Math.floor(Math.random() * (allg.length + gereimt.length));
      const hinten = i < allg.length ? (ids.push(pA + i), allg[i]) : (ids.push(pG + (i - allg.length)), gereimt[i - allg.length]);
      text = (vorne ? vorne + "\n\n" : "") + hinten;
    } else if (eigenReim && r < .3) text = nimm(eigenReim, pR, ids);
    else if (eigen && r < .45) text = nimm(eigen, pE, ids) + (stufe === "stark" ? " " + nimm(allg, pA, ids) : "");
    else if (gereimt.length && r < .8) text = nimm(gereimt, pG, ids);
    else text = nimm(allg, pA, ids);
    return { text: text.split("{n}").join(name), ids };
  }
  function neuesStueck(spott, stufe, name) {
    let s = spott ? spotte(stufe, name) : dichte(stufe, name);
    for (let i = 0; i < 6 && letzte.includes(s.text); i++) s = spott ? spotte(stufe, name) : dichte(stufe, name);
    letzte.push(s.text); if (letzte.length > 10) letzte.shift();
    return s;
  }

  /* ---------- Versbuch: alle sammelbaren Verse (Aufbau nach dem deutschen Buch) ---------- */
  function buchEintraege() {
    const R = window.BARRADIN_REIME || {}, S = window.BARRADIN_SPOTT || {};
    const Rd = R.de || {}, Sd = S.de || {}, L = [];
    const holeR = (lang, pfad) => pfad.reduce((o, k) => o && o[k], (R[lang] || {}));
    const holeS = (lang, pfad) => {
      const X = S[lang] || {};
      if (pfad[0] === "kreaturen" || pfad[0] === "kreaturReime") {
        const o = X[pfad[0]] || {}, k = Object.keys(o).find(x => (KANON[x] || x) === pfad[1]);
        return k ? o[k] : null;
      }
      return pfad.reduce((o, k) => o && o[k], X);
    };
    const STUFEN = ["patzer", "schwach", "maessig", "gut", "stark", "legende", "krit"];
    const add = (kap, abs, unter, id, liste, hole, pfad) => (liste || []).forEach((_, i) => L.push({ kap, abs, unter, id: id + i, text: lang => { const a = hole(lang, pfad); return a && a[i]; } }));
    STUFEN.forEach(s => add("lob", "ganz", s, "l.ganz." + s + ".", Rd.ganz && Rd.ganz[s], holeR, ["ganz", s]));
    Object.keys(Rd.namen || {}).forEach(k => ["hoch", "tief"].forEach(l => add("lob", "namen", k + "|" + l, "l.namen." + k + "." + l + ".", Rd.namen[k].paare && Rd.namen[k].paare[l], holeR, ["namen", k, "paare", l])));
    STUFEN.forEach(s => add("lob", "paare", s, "l.paare." + s + ".", Rd.paare && Rd.paare[s], holeR, ["paare", s]));
    add("lob", "schluss", "", "l.schluss.", Rd.schluss, holeR, ["schluss"]);
    add("spott", "eigentor", "", "s.eigentor.", Sd.eigentor, holeS, ["eigentor"]);
    add("spott", "eigentorReime", "", "s.eigentorReime.", Sd.eigentorReime, holeS, ["eigentorReime"]);
    STUFEN.forEach(s => add("spott", "allgemein", s, "s.allgemein." + s + ".", Sd.allgemein && Sd.allgemein[s], holeS, ["allgemein", s]));
    STUFEN.forEach(s => add("spott", "reime", s, "s.reime." + s + ".", Sd.reime && Sd.reime[s], holeS, ["reime", s]));
    Object.keys(Sd.kreaturen || {}).forEach(k => add("spott", "kreaturen", k, "s.kreaturen." + k + ".", Sd.kreaturen[k], holeS, ["kreaturen", k]));
    Object.keys(Sd.kreaturReime || {}).forEach(k => add("spott", "kreaturReime", k, "s.kreaturReime." + k + ".", Sd.kreaturReime[k], holeS, ["kreaturReime", k]));
    return L;
  }
  let EINTRAEGE = null;
  const eintraege = () => EINTRAEGE || (EINTRAEGE = buchEintraege());
  function fortschritt(kap) {
    const sp = sprache(); let n = 0, g = 0;
    eintraege().forEach(e => { if (kap && e.kap !== kap) return; if (!e.text(sp)) return; g++; if (buchSet.has(e.id)) n++; });
    return { n, g };
  }
  function rangName() {
    const f = fortschritt(), q = f.g ? f.n / f.g : 0, R = t().raenge;
    const stufe = q >= 1 ? 5 : q >= .8 ? 4 : q >= .55 ? 3 : q >= .3 ? 2 : q >= .1 ? 1 : 0;
    return R[stufe];
  }

  /* =====================================================================
     FIGUREN – gezeichnet im Comic-Stil wie der Spielleiter in „Würfel auf Verführen“
     viewBox 0 0 200 320, Kopfmitte bei (100, 68). Gesichtsausdruck über data-a/-b/-m.
     ===================================================================== */
  const AUSDRUCK = {
    neutral: { a: "offen", b: "normal", m: "neutral" },
    grinsen: { a: "offen", b: "hoch", m: "grinsen" },
    singen: { a: "zu", b: "hoch", m: "singen" },
    fies: { a: "halb", b: "boese", m: "smirk" },
    lachen: { a: "lachzu", b: "hoch", m: "lachen" },
    stolz: { a: "zu", b: "hoch", m: "smirk" },
    geschmeichelt: { a: "lachzu", b: "traurig", m: "grinsen", rot: 1 },
    geruehrt: { a: "lachzu", b: "traurig", m: "wellig", rot: 1, traenen: 1 },
    verliebt: { a: "herz", b: "hoch", m: "lachen", rot: 1 },
    peinlich: { a: "gross", b: "traurig", m: "zaehne", schweiss: 1 },
    verwirrt: { a: "skeptisch", b: "skeptisch", m: "wellig" },
    wuetend: { a: "offen", b: "boese", m: "zaehne", wut: 1, rotkopf: 1 },
    traurig: { a: "offen", b: "traurig", m: "traurig", traenen: 1 },
    schock: { a: "gross", b: "hoch", m: "o", schweiss: 1 },
    ko: { a: "x", b: "traurig", m: "o", sterne: 1 },
    konzentriert: { a: "halb", b: "normal", m: "neutral" }
  };
  function ausdruck(svg, name) {
    if (!svg) return;
    const A = AUSDRUCK[name] || AUSDRUCK.neutral;
    svg.dataset.a = A.a; svg.dataset.b = A.b; svg.dataset.m = A.m;
    ["rot", "traenen", "schweiss", "wut", "rotkopf", "sterne"].forEach(k => svg.classList.toggle("x-" + k, !!A[k]));
  }

  function gesicht(o) {
    const d = o.hautD, br = o.braue || "#3a2414";
    return `
      <ellipse cx="100" cy="68" rx="32" ry="36" fill="${o.haut}"/>
      ${o.kinn ? `<path d="M80 92 C 84 108 94 112 100 112 C 106 112 116 108 120 92 C 116 100 108 104 100 104 C 92 104 84 100 80 92 Z" fill="${o.haut}"/><path d="M97 106 q3 3 6 0" stroke="${d}" stroke-width="1.6" fill="none" stroke-linecap="round"/>` : ""}
      <ellipse class="f-rotkopf" cx="100" cy="70" rx="31" ry="34" fill="#e0302a" opacity=".28"/>
      ${o.vorneHaar || ""}
      ${o.bart || ""}
      <g class="f-brauen" stroke="${br}" stroke-width="3.2" fill="none" stroke-linecap="round">
        <path class="bb b-normal" d="M79 54 q8 -4 15 0 M106 54 q8 -4 15 0"/>
        <path class="bb b-hoch" d="M79 48 q8 -6 15 -1 M106 47 q8 -5 15 1"/>
        <path class="bb b-boese" d="M79 50 q8 2 15 7 M106 57 q8 -5 15 -7"/>
        <path class="bb b-traurig" d="M79 56 q8 -1 15 -7 M106 49 q7 6 15 7"/>
        <path class="bb b-skeptisch" d="M79 56 q8 -1 15 0 M106 47 q8 -6 15 0"/>
      </g>
      <g class="f-augen">
        <g class="aa a-offen"><ellipse cx="87" cy="66" rx="5.6" ry="6.2" fill="#fff"/><ellipse cx="113" cy="66" rx="5.6" ry="6.2" fill="#fff"/><g class="f-pup"><circle cx="88" cy="67" r="3" fill="${o.auge || "#2a1a10"}"/><circle cx="114" cy="67" r="3" fill="${o.auge || "#2a1a10"}"/><circle cx="89.2" cy="65.6" r="1" fill="#fff"/><circle cx="115.2" cy="65.6" r="1" fill="#fff"/></g></g>
        <g class="aa a-zu"><path d="M81 66 q6 4.5 12 0 M107 66 q6 4.5 12 0" stroke="#2a1a10" stroke-width="2.6" fill="none" stroke-linecap="round"/></g>
        <g class="aa a-lachzu"><path d="M81 68 q6 -7 12 0 M107 68 q6 -7 12 0" stroke="#2a1a10" stroke-width="2.6" fill="none" stroke-linecap="round"/></g>
        <g class="aa a-gross"><ellipse cx="87" cy="65" rx="7.6" ry="8.6" fill="#fff" stroke="#2a1a10" stroke-width=".8"/><ellipse cx="113" cy="65" rx="7.6" ry="8.6" fill="#fff" stroke="#2a1a10" stroke-width=".8"/><circle cx="87" cy="65" r="2.1" fill="#2a1a10"/><circle cx="113" cy="65" r="2.1" fill="#2a1a10"/></g>
        <g class="aa a-herz"><path d="M87 73 l-7 -7 a3.8 3.8 0 0 1 7 -4.6 a3.8 3.8 0 0 1 7 4.6 Z M113 73 l-7 -7 a3.8 3.8 0 0 1 7 -4.6 a3.8 3.8 0 0 1 7 4.6 Z" fill="#e0284e"/></g>
        <g class="aa a-x"><path d="M82 61 l10 10 M92 61 l-10 10 M108 61 l10 10 M118 61 l-10 10" stroke="#2a1a10" stroke-width="2.6" stroke-linecap="round"/></g>
        <g class="aa a-halb"><ellipse cx="87" cy="67" rx="5.6" ry="4.4" fill="#fff"/><ellipse cx="113" cy="67" rx="5.6" ry="4.4" fill="#fff"/><circle cx="89.5" cy="68" r="2.7" fill="#2a1a10"/><circle cx="115.5" cy="68" r="2.7" fill="#2a1a10"/><path d="M80.5 63.5 h13 M106.5 63.5 h13" stroke="${d}" stroke-width="3.4" stroke-linecap="round"/></g>
        <g class="aa a-skeptisch"><path d="M81 67 h12" stroke="#2a1a10" stroke-width="2.6" stroke-linecap="round"/><ellipse cx="113" cy="65" rx="6.2" ry="6.8" fill="#fff"/><circle cx="112" cy="66" r="2.9" fill="#2a1a10"/></g>
      </g>
      <path d="M100 69 q-5.5 11 -1 14 q3 1.5 6.5 -.6" fill="none" stroke="${d}" stroke-width="2.2" stroke-linecap="round"/>
      <g class="f-mund">
        <path class="mm m-neutral" d="M92 90 q8 2 16 0" stroke="#4a1c12" stroke-width="2.6" fill="none" stroke-linecap="round"/>
        <path class="mm m-grinsen" d="M87 86 q13 13 26 0" stroke="#4a1c12" stroke-width="2.8" fill="none" stroke-linecap="round"/>
        <g class="mm m-lachen"><path d="M85 85 q15 22 30 0 Z" fill="#6a2018" stroke="#4a1c12" stroke-width="1.6" stroke-linejoin="round"/><path d="M88 86 h24 l-2 4 h-20 Z" fill="#fff"/><path d="M93 96 q7 -4 14 0 q-7 4 -14 0" fill="#d0606a"/></g>
        <g class="mm m-singen"><g class="f-singmund"><ellipse cx="100" cy="91" rx="7.4" ry="8" fill="#6a2018" stroke="#4a1c12" stroke-width="1.6"/><ellipse cx="100" cy="95.5" rx="4.2" ry="2.4" fill="#d0606a"/></g></g>
        <ellipse class="mm m-o" cx="100" cy="92" rx="5.2" ry="6.8" fill="#6a2018" stroke="#4a1c12" stroke-width="1.4"/>
        <path class="mm m-traurig" d="M89 96 q11 -9 22 0" stroke="#4a1c12" stroke-width="2.8" fill="none" stroke-linecap="round"/>
        <g class="mm m-zaehne"><rect x="88" y="86" width="24" height="9" rx="3" fill="#fff" stroke="#4a1c12" stroke-width="1.6"/><path d="M88 90.5 h24 M94 86 v9 M100 86 v9 M106 86 v9" stroke="#4a1c12" stroke-width=".9"/></g>
        <path class="mm m-wellig" d="M88 91 q3 -4 6 0 t6 0 t6 0 t6 0" stroke="#4a1c12" stroke-width="2.4" fill="none" stroke-linecap="round"/>
        <path class="mm m-smirk" d="M89 91 q11 4 21 -6" stroke="#4a1c12" stroke-width="2.8" fill="none" stroke-linecap="round"/>
      </g>
      <g class="f-roete"><ellipse cx="77" cy="80" rx="7.5" ry="4.2" fill="#ff6a6a" opacity=".5"/><ellipse cx="123" cy="80" rx="7.5" ry="4.2" fill="#ff6a6a" opacity=".5"/></g>
      <g class="f-traenen"><path class="tr1" d="M81 72 q4.5 8 0 11.5 q-4.5 -3.5 0 -11.5 Z" fill="#f2f6f2" stroke="#a9bdb4" stroke-width=".9"/><path class="tr2" d="M119 72 q4.5 8 0 11.5 q-4.5 -3.5 0 -11.5 Z" fill="#f2f6f2" stroke="#a9bdb4" stroke-width=".9"/></g>
      <g class="f-schweiss"><path d="M136 38 q7 11 0 15 q-7 -4 0 -15 Z" fill="#f2f6f2" stroke="#a9bdb4" stroke-width="1.1"/></g>
      <g class="f-wut" stroke="#d0302a" stroke-width="3.4" fill="none" stroke-linecap="round"><path d="M122 26 q4 4 8 0 M134 30 q-4 4 0 8 M130 42 q-4 -4 -8 0 M118 38 q4 -4 0 -8"/></g>
      ${o.hut || ""}
      <g class="f-sterne" fill="#ffd27a"><path d="M66 22 l3 6 6 1 -5 4 1 6 -5 -3 -5 3 1 -6 -5 -4 6 -1 Z"/><path d="M128 16 l2.4 5 5 .8 -4 3.4 1 5 -4.4 -2.4 -4.4 2.4 1 -5 -4 -3.4 5 -.8 Z"/><path d="M100 4 l2 4 4 .6 -3 2.8 .8 4 -3.8 -2 -3.8 2 .8 -4 -3 -2.8 4 -.6 Z"/></g>`;
  }

  /* Haare, Bärte, Hüte als Bausteine */
  const HAAR = {
    locken: f => ({
      hinten: `<g fill="${f}"><circle cx="68" cy="50" r="17"/><circle cx="82" cy="32" r="19"/><circle cx="100" cy="26" r="20"/><circle cx="118" cy="32" r="19"/><circle cx="132" cy="50" r="17"/><circle cx="64" cy="70" r="13"/><circle cx="136" cy="70" r="13"/><circle cx="68" cy="88" r="10"/><circle cx="132" cy="88" r="10"/></g>`,
      vorne: `<g fill="${f}"><circle cx="76" cy="42" r="12"/><circle cx="89" cy="34" r="12.5"/><circle cx="104" cy="32" r="12.5"/><circle cx="118" cy="37" r="12"/><circle cx="128" cy="48" r="9.5"/><circle cx="71" cy="54" r="9"/></g><g fill="none" stroke="#d26a34" stroke-width="2" stroke-linecap="round" opacity=".8"><path d="M82 30 q6 -4 11 0 M98 26 q6 -4 11 0 M113 30 q6 -3 10 2 M70 44 q4 -5 9 -3 M124 42 q4 1 6 6"/></g>`
    }),
    dreads: f => ({
      hinten: `<g stroke="${f}" stroke-width="7" fill="none" stroke-linecap="round"><path d="M72 62 C 64 90 62 120 60 150"/><path d="M128 62 C 136 90 140 120 142 152"/><path d="M78 54 C 70 86 72 118 70 146"/><path d="M122 54 C 130 86 130 118 132 146"/></g><circle cx="100" cy="20" r="14" fill="${f}"/><path d="M90 16 q10 -8 20 2 M92 24 q8 -5 16 2" stroke="#5a3e22" stroke-width="1.6" fill="none"/>`,
      vorne: `<path d="M68 60 C 64 34 82 28 100 28 C 118 28 136 34 132 60 C 128 46 116 40 100 40 C 84 40 72 46 68 60 Z" fill="${f}"/><path d="M80 36 C 90 32 110 32 120 36 M76 44 C 88 37 112 37 124 44" stroke="#a8875a" stroke-width="1.5" fill="none"/>`
    }),
    kurz: f => ({ hinten: "", vorne: `<path d="M67 64 C 64 34 82 26 100 26 C 118 26 136 34 133 64 C 128 48 116 41 100 41 C 84 41 72 48 67 64 Z" fill="${f}"/>` }),
    glatt: f => ({ hinten: "", vorne: `<path d="M67 62 C 64 32 82 26 100 26 C 120 26 136 34 133 62 C 130 50 124 42 110 40 C 96 46 80 46 67 62 Z" fill="${f}"/><path d="M110 40 C 100 34 88 32 78 34" stroke="rgba(255,255,255,.25)" stroke-width="2" fill="none"/>` }),
    lang: f => ({ hinten: `<path d="M64 60 C 58 100 60 130 66 150 L 134 150 C 140 130 142 100 136 60 Z" fill="${f}"/>`, vorne: `<path d="M66 70 C 62 34 82 26 100 26 C 118 26 138 34 134 70 C 130 50 118 40 100 40 C 82 40 70 50 66 70 Z" fill="${f}"/>` }),
    zopf: f => ({ hinten: `<path d="M126 56 C 146 70 146 100 140 130" stroke="${f}" stroke-width="12" fill="none" stroke-linecap="round" stroke-dasharray="10 3"/>`, vorne: `<path d="M67 64 C 64 34 82 26 100 26 C 118 26 136 34 133 64 C 128 48 116 41 100 41 C 84 41 72 48 67 64 Z" fill="${f}"/>` }),
    glatze: f => ({ hinten: "", vorne: `<path d="M68 70 C 66 62 68 56 70 54 M132 70 C 134 62 132 56 130 54" stroke="${f}" stroke-width="6" fill="none" stroke-linecap="round"/><path d="M84 34 q10 -6 22 -2" stroke="rgba(255,255,255,.3)" stroke-width="3" fill="none" stroke-linecap="round"/>` })
  };
  const BART = {
    keiner: () => "",
    voll: f => `<path d="M69 74 C 68 112 88 126 100 126 C 112 126 132 112 131 74 C 128 92 122 98 116 100 C 112 94 88 94 84 100 C 78 98 72 92 69 74 Z" fill="${f}"/><path d="M86 86 q14 -8 28 0 q-7 4 -14 1.5 q-7 2.5 -14 -1.5 Z" fill="${f}"/>`,
    schnurr: f => `<path d="M84 86 q16 -9 32 0 q-8 5 -16 1.5 q-8 3.5 -16 -1.5 Z" fill="${f}"/>`,
    ziege: f => `<path d="M92 98 q8 22 16 0 q-8 4 -16 0 Z" fill="${f}"/><path d="M88 85 q12 -6 24 0 q-6 3 -12 1 q-6 2 -12 -1 Z" fill="${f}"/>`
  };
  const HUT = {
    keiner: () => "",
    kapuze: f => `<path d="M58 84 C 54 28 80 12 100 12 C 120 12 146 28 142 84 L 133 86 C 134 50 120 34 100 34 C 80 34 66 50 67 86 Z" fill="${f}"/>`,
    filzhut: f => `<ellipse cx="100" cy="38" rx="50" ry="9" fill="${f}"/><path d="M72 38 C 72 12 84 6 100 6 C 116 6 128 12 128 38 Z" fill="${f}"/><rect x="72" y="28" width="56" height="6" fill="#2a1a10" opacity=".6"/><path d="M118 28 l14 -18 l-6 20 Z" fill="#c9a043"/>`,
    spitzhut: f => `<ellipse cx="100" cy="36" rx="48" ry="8" fill="${f}"/><path d="M72 36 L 112 -30 L 128 36 Z" fill="${f}"/><path d="M76 30 h48" stroke="#c9a043" stroke-width="4"/>`,
    kappe: f => `<path d="M66 44 C 64 18 92 8 112 14 C 134 20 142 36 134 46 C 112 36 86 36 66 44 Z" fill="${f}"/><circle cx="112" cy="12" r="4" fill="#c9a043"/>`
  };
  const OHREN = {
    rund: h => `<ellipse cx="67" cy="72" rx="6" ry="10" fill="${h}"/><ellipse cx="133" cy="72" rx="6" ry="10" fill="${h}"/>`,
    elf: (h, d) => `<path d="M72 62 C 62 56 56 50 50 44 C 54 60 60 76 70 84 Z" fill="${h}"/><path d="M68 66 C 62 62 58 58 55 53 C 58 64 62 72 67 78" stroke="${d}" stroke-width="1.6" fill="none"/><path d="M128 62 C 138 56 144 50 150 44 C 146 60 140 76 130 84 Z" fill="${h}"/><path d="M132 66 C 138 62 142 58 145 53 C 142 64 138 72 133 78" stroke="${d}" stroke-width="1.6" fill="none"/>`
  };
  /* Arme einer gewöhnlichen Figur: an der Seite, hoch, Hände am Herz, Hände an den Wangen */
  function arme(farbe, haut, tattoo) {
    const A = (cls, l, r, hl, hr) => `<g class="fa fa-${cls}"><path d="${l}" stroke="${farbe}" stroke-width="17" fill="none" stroke-linecap="round"/><path d="${r}" stroke="${farbe}" stroke-width="17" fill="none" stroke-linecap="round"/>${tattoo ? `<path d="${l}" stroke="#3a2e2a" stroke-width="2" stroke-dasharray="3 7" fill="none" opacity=".7"/>` : ""}<circle cx="${hl[0]}" cy="${hl[1]}" r="9" fill="${haut}"/><circle cx="${hr[0]}" cy="${hr[1]}" r="9" fill="${haut}"/></g>`;
    return A("seite", "M62 128 C 50 162 48 192 54 214", "M138 128 C 150 162 152 192 146 214", [54, 219], [146, 219]) +
      A("hoch", "M62 128 C 46 100 40 72 44 46", "M138 128 C 154 100 160 72 156 46", [44, 40], [156, 40]) +
      A("herz", "M62 128 C 50 164 70 172 92 160", "M138 128 C 150 164 130 172 108 160", [95, 157], [105, 157]) +
      A("wangen", "M62 128 C 40 124 48 98 70 88", "M138 128 C 160 124 152 98 130 88", [72, 86], [128, 86]);
  }
  /* Eine Figur zusammensetzen. o: haut, hautD, haar, haarFarbe, bart, bartFarbe, hut, hutFarbe, ohren, kleid, hose, stiefel, robe, imre, stab, brille */
  function figurSVG(o, extraKlasse) {
    const H = (HAAR[o.haar] || HAAR.kurz)(o.haarFarbe || "#5a3a22");
    const g = gesicht({
      haut: o.haut, hautD: o.hautD, kinn: o.kinn, braue: o.braue || o.haarFarbe,
      vorneHaar: H.vorne, bart: (BART[o.bart] || BART.keiner)(o.bartFarbe || o.haarFarbe),
      hut: (HUT[o.hut] || HUT.keiner)(o.hutFarbe || "#3a2a1a")
    });
    const brille = o.brille ? `<g fill="none" stroke="#c9a043" stroke-width="2"><circle cx="87" cy="66" r="9"/><circle cx="113" cy="66" r="9"/><path d="M96 65 h8 M78 64 l-10 -3 M122 64 l10 -3"/></g>` : "";
    const beine = o.robe ? "" : `<rect x="74" y="232" width="24" height="66" fill="${o.hose}"/><rect x="102" y="232" width="24" height="66" fill="${o.hose}"/>
      <rect class="f-glitzer" x="74" y="232" width="52" height="66" fill="url(#bpGlitzer)"/>
      <rect x="68" y="290" width="32" height="22" rx="9" fill="${o.stiefel}"/><rect x="100" y="290" width="32" height="22" rx="9" fill="${o.stiefel}"/>`;
    const koerper = o.robe
      ? `<path d="M60 122 C 66 110 84 106 100 106 C 116 106 134 110 140 122 L 160 312 L 40 312 Z" fill="${o.kleid}"/><path d="M100 108 L 100 312" stroke="#c9a043" stroke-width="3"/><path d="M40 312 L 160 312" stroke="#c9a043" stroke-width="5"/><path d="M84 110 L 100 140 L 116 110" fill="none" stroke="#c9a043" stroke-width="3"/>`
      : o.imre
      ? `<path d="M60 122 C 66 110 84 106 100 106 C 116 106 134 110 140 122 L 146 236 C 120 244 80 244 54 236 Z" fill="${o.haut}"/><path d="M56 238 L 63 128 C 65 118 73 112 81 110 L 88 118 Q 100 134 112 118 L 119 110 C 127 112 135 118 137 128 L 144 238 Z" fill="${o.kleid}"/><path d="M66 140 c 3 -6 9 -6 9 0 c 0 6 -7 6 -6 0 M70 150 l4 6" stroke="#3a2e2a" stroke-width="1.8" fill="none" stroke-linecap="round"/>`
      : `<path d="M60 122 C 66 110 84 106 100 106 C 116 106 134 110 140 122 L 146 236 C 120 244 80 244 54 236 Z" fill="${o.kleid}"/><path d="M88 108 L 100 126 L 112 108" fill="${o.kragen || "#d8cbb0"}"/>`;
    const guertel = o.robe ? `<rect x="62" y="200" width="76" height="8" fill="#c9a043"/>` : `<rect x="56" y="204" width="88" height="10" fill="#2a1a10"/><rect x="94" y="203" width="12" height="12" rx="2" fill="none" stroke="#c9a043" stroke-width="2.4"/>`;
    const stab = o.stab ? `<g class="f-stab"><path d="M150 30 L 150 312" stroke="rgba(240,240,232,.75)" stroke-width="6" stroke-linecap="round"/><path d="M148 40 L 148 300" stroke="#fff" stroke-width="1.4" opacity=".8"/><circle cx="150" cy="26" r="9" fill="rgba(255,255,250,.55)" stroke="#fff" stroke-width="1.4"/></g>` : "";
    return `<svg class="bp-fig ${extraKlasse || ""}" viewBox="0 0 200 320" aria-hidden="true" data-a="offen" data-b="normal" data-m="neutral" data-arme="seite">
      <g class="f-ganz">
        ${H.hinten}
        ${beine}
        ${koerper}${guertel}
        <rect x="91" y="96" width="18" height="18" fill="${o.hautD}"/>
        ${arme(o.imre ? o.haut : o.kleid, o.haut, !!o.imre)}
        ${stab}
        <g class="f-kopf">${(OHREN[o.ohren] || OHREN.rund)(o.haut, o.hautD)}${g}${brille}</g>
      </g>
    </svg>`;
  }

  /* Barradin: Locken, Elfenohren, markantes Kinn, schwarzes Wams mit Gold – und die Laute */
  function barradinSVG() {
    const haut = "#f1c6a0", hautD = "#d29a72", haar = "#9a3f1c", wams = "#1e1916", gold = "#c9a043";
    const H = HAAR.locken(haar);
    const g = gesicht({ haut, hautD, kinn: true, braue: "#7a3016", vorneHaar: H.vorne, auge: "#3a5a2a" });
    return `<svg class="bp-fig bp-barradin-svg" viewBox="0 0 200 320" aria-hidden="true" data-a="offen" data-b="normal" data-m="grinsen" data-arme="laute">
      <defs><linearGradient id="bpLauteHolz" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e2a35a"/><stop offset=".6" stop-color="#b06a28"/><stop offset="1" stop-color="#6a3a14"/></linearGradient></defs>
      <g class="f-ganz">
        ${H.hinten}
        <rect x="74" y="232" width="24" height="66" fill="#2a2019"/><rect x="102" y="232" width="24" height="66" fill="#2a2019"/>
        <rect x="68" y="286" width="32" height="26" rx="9" fill="#5a3420"/><rect x="100" y="286" width="32" height="26" rx="9" fill="#5a3420"/>
        <path d="M70 292 h28 M102 292 h28" stroke="${gold}" stroke-width="2.4"/>
        <path d="M60 122 C 66 110 84 106 100 106 C 116 106 134 110 140 122 L 146 238 C 120 246 80 246 54 238 Z" fill="${wams}"/>
        <path d="M100 126 L 100 238" stroke="${gold}" stroke-width="3"/>
        <g fill="${gold}"><circle cx="100" cy="146" r="3"/><circle cx="100" cy="166" r="3"/><circle cx="100" cy="186" r="3"/></g>
        <path d="M70 130 q8 30 0 60 M130 130 q-8 30 0 60" stroke="${gold}" stroke-width="1.6" fill="none" opacity=".7"/>
        <path d="M86 106 L 100 128 L 114 106 Z" fill="#efe2c8"/>
        <path d="M84 104 L 100 128 L 116 104" fill="none" stroke="${gold}" stroke-width="3"/>
        <rect x="56" y="206" width="88" height="10" fill="#4a2a16"/><rect x="93" y="204" width="14" height="14" rx="2" fill="none" stroke="${gold}" stroke-width="2.6"/>
        <ellipse cx="62" cy="124" rx="15" ry="10" fill="${wams}" stroke="${gold}" stroke-width="2.4"/><ellipse cx="138" cy="124" rx="15" ry="10" fill="${wams}" stroke="${gold}" stroke-width="2.4"/>
        <rect x="91" y="96" width="18" height="16" fill="${hautD}"/>
        <g class="ba-laute">
          <path d="M84 192 L 166 116" stroke="#3a2010" stroke-width="9" stroke-linecap="round"/>
          <path d="M84 192 L 166 116" stroke="#5a3418" stroke-width="6" stroke-linecap="round"/>
          <path d="M162 120 L 180 98 L 186 104 L 168 124 Z" fill="#3a2010"/>
          <circle cx="178" cy="100" r="2" fill="${gold}"/><circle cx="183" cy="105" r="2" fill="${gold}"/>
          <g transform="rotate(47 80 196)"><ellipse cx="80" cy="206" rx="31" ry="26" fill="url(#bpLauteHolz)"/><ellipse cx="80" cy="176" rx="21" ry="18" fill="url(#bpLauteHolz)"/><circle cx="80" cy="190" r="8" fill="#2a1408"/><rect x="66" y="214" width="28" height="4" rx="1" fill="#3a2010"/></g>
          <path d="M70 212 L 166 116 M73 214 L 168 118 M76 216 L 170 120" stroke="#efe2c8" stroke-width=".7" opacity=".85"/>
        </g>
        <g class="fa ba-strum"><path d="M60 128 C 46 156 48 186 74 198" stroke="${wams}" stroke-width="17" fill="none" stroke-linecap="round"/><path d="M50 160 q6 2 12 -2" stroke="${gold}" stroke-width="2" fill="none"/><g class="ba-schlag"><circle cx="80" cy="200" r="9" fill="${haut}"/><path d="M84 194 l8 -6" stroke="${haut}" stroke-width="4" stroke-linecap="round"/></g></g>
        <g class="fa ba-griff"><path d="M140 128 C 160 150 168 140 160 122" stroke="${wams}" stroke-width="17" fill="none" stroke-linecap="round"/><circle cx="158" cy="120" r="9" fill="${haut}"/></g>
        <g class="fa ba-zeig"><path d="M140 128 C 160 122 176 114 188 108" stroke="${wams}" stroke-width="17" fill="none" stroke-linecap="round"/><circle cx="190" cy="106" r="9" fill="${haut}"/><path d="M194 102 l12 -5" stroke="${haut}" stroke-width="5" stroke-linecap="round"/></g>
        <g class="fa ba-hoch"><path d="M140 128 C 154 102 158 74 154 48" stroke="${wams}" stroke-width="17" fill="none" stroke-linecap="round"/><circle cx="154" cy="42" r="10" fill="${haut}"/></g>
        <g class="f-kopf">${OHREN.elf(haut, hautD)}${g}</g>
      </g>
    </svg>`;
  }

  /* =====================================================================
     KULISSEN – vier Bühnen, jede mit Tageszeit und zufälligen Details
     viewBox 0 0 800 450; die Figuren stehen unten auf den Dielen
     ===================================================================== */
  const ZEITEN = ["morgen", "tag", "abend", "nacht"];
  const HIMMEL = {
    morgen: ["#3a2440", "#b4587a", "#f3b27a"], tag: ["#9fb39a", "#d8d6ae", "#f2e4bc"],
    abend: ["#2a1430", "#8a2c3a", "#f08a3a"], nacht: ["#0c0710", "#1c0f26", "#2e1834"]
  };
  const TONUNG = { morgen: ["#3a1a2a", .14], tag: ["#000", 0], abend: ["#3a1408", .16], nacht: ["#08040e", .34] };
  function zeitJetzt() { const h = new Date().getHours(); return h >= 5 && h < 9 ? "morgen" : h >= 9 && h < 17 ? "tag" : h >= 17 && h < 21 ? "abend" : "nacht"; }
  function himmelDefs(z) {
    const c = HIMMEL[z];
    return `<linearGradient id="bpkHimmel" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c[0]}"/><stop offset=".6" stop-color="${c[1]}"/><stop offset="1" stop-color="${c[2]}"/></linearGradient>`;
  }
  /* Sonne/Mond/Sterne in einem Himmelsausschnitt (x, y, Breite, Höhe) */
  function himmelsKoerper(z, x, y, w, h) {
    let s = "";
    if (z === "nacht" || z === "abend") for (let i = 0; i < (z === "nacht" ? 26 : 8); i++) s += `<circle class="bp-stern" style="--d:${(Math.random() * 3).toFixed(2)}s" cx="${(x + Math.random() * w).toFixed(1)}" cy="${(y + Math.random() * h * .7).toFixed(1)}" r="${zz(.6, 1.6).toFixed(2)}" fill="#f3ecd2"/>`;
    if (z === "nacht") s += `<circle cx="${x + w * .7}" cy="${y + h * .28}" r="${Math.min(w, h) * .12}" fill="#f3ecd2"/><circle cx="${x + w * .7 + Math.min(w, h) * .05}" cy="${y + h * .26}" r="${Math.min(w, h) * .11}" fill="${HIMMEL.nacht[1]}"/>`;
    else if (z === "abend") s += `<circle cx="${x + w * .3}" cy="${y + h * .86}" r="${Math.min(w, h) * .2}" fill="#ffb05a" opacity=".95"/>`;
    else if (z === "morgen") s += `<circle cx="${x + w * .75}" cy="${y + h * .8}" r="${Math.min(w, h) * .15}" fill="#ffd8a0"/>`;
    else s += `<circle cx="${x + w * .62}" cy="${y + h * .25}" r="${Math.min(w, h) * .12}" fill="#fff6d6"/><circle cx="${x + w * .62}" cy="${y + h * .25}" r="${Math.min(w, h) * .2}" fill="#fff6d6" opacity=".25"/>`;
    return s;
  }
  function flamme(x, y, s, farbe) {
    return `<g transform="translate(${x} ${y}) scale(${s})"><g class="bp-flamme" style="--d:${(Math.random() * 1.2).toFixed(2)}s"><path d="M0 0 C -10 -10 -8 -24 0 -36 C 8 -24 10 -10 0 0 Z" fill="${farbe || "#ff9a3a"}"/><path d="M0 -2 C -5 -8 -4 -16 0 -24 C 4 -16 5 -8 0 -2 Z" fill="#ffe08a"/></g></g>`;
  }
  function glut(x, y, r, farbe, klasse) { return `<circle class="${klasse || "bp-flacker"}" style="--d:${(Math.random() * 2).toFixed(2)}s" cx="${x}" cy="${y}" r="${r}" fill="url(#bpkGlut${farbe || ""})"/>`; }
  const glutDefs = `<radialGradient id="bpkGlut"><stop offset="0" stop-color="#ffb35a" stop-opacity=".55"/><stop offset=".45" stop-color="#ff8a3a" stop-opacity=".18"/><stop offset="1" stop-color="#ff8a3a" stop-opacity="0"/></radialGradient>`;
  function dielen(y0, farbe, linie) {
    let s = `<rect x="0" y="${y0}" width="800" height="${450 - y0}" fill="${farbe}"/>`;
    let y = y0, d = 12;
    while (y < 450) { s += `<path d="M0 ${y.toFixed(1)} H800" stroke="${linie}" stroke-width="2"/>`; y += d; d *= 1.32; }
    for (let i = 0; i < 9; i++) { const x = 40 + i * 92 + zz(-10, 10); s += `<path d="M${x.toFixed(0)} ${y0} L ${(400 + (x - 400) * 1.8).toFixed(0)} 450" stroke="${linie}" stroke-width="1.2" opacity=".5"/>`; }
    return s;
  }
  function vorhang(farbe) {
    return `<linearGradient id="bpkSamt" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${farbe[1]}"/><stop offset=".5" stop-color="${farbe[0]}"/><stop offset="1" stop-color="${farbe[1]}"/></linearGradient>`;
  }
  function vorhangFormen(gold) {
    let s = `<path d="M0 0 L 118 0 C 96 110 80 230 70 340 L 0 340 Z" fill="url(#bpkSamt)"/><path d="M800 0 L 682 0 C 704 110 720 230 730 340 L 800 340 Z" fill="url(#bpkSamt)"/>`;
    s += `<path d="M30 0 C 28 120 24 230 22 340 M64 0 C 58 110 50 230 46 340 M770 0 C 772 120 776 230 778 340 M736 0 C 742 110 750 230 754 340" stroke="rgba(0,0,0,.28)" stroke-width="5" fill="none"/>`;
    let v = "M0 0 H800 V22 ";
    for (let x = 800; x > 0; x -= 50) v += `Q ${x - 25} 52 ${x - 50} 22 `;
    s += `<path d="${v}Z" fill="url(#bpkSamt)"/><path d="${v.replace("M0 0 H800 V22 ", "M800 22 ")}" fill="none" stroke="${gold}" stroke-width="3"/>`;
    return s;
  }
  function laterne(x, y) {
    return `<path d="M${x} 0 V ${y - 18}" stroke="#1a120c" stroke-width="2"/>${glut(x, y, 90)}<g transform="translate(${x} ${y})"><path d="M-12 -18 h24 l-4 -6 h-16 Z" fill="#2a1a10"/><rect x="-10" y="-18" width="20" height="28" rx="3" fill="#ffcf7a" opacity=".9"/><path d="M-10 -10 h20 M-10 0 h20 M0 -18 v28" stroke="#2a1a10" stroke-width="2"/><path d="M-12 10 h24 l-4 5 h-16 Z" fill="#2a1a10"/></g>`;
  }

  function taverneSVG(z) {
    const nacht = z === "nacht" || z === "abend";
    let s = `<defs>${himmelDefs(z)}${glutDefs}${vorhang(zufall([["#7a1820", "#3a080c"], ["#5a1a3a", "#2a0818"], ["#6a3a12", "#30180a"]]))}<clipPath id="bpkFenster"><path d="M340 210 V120 A60 60 0 0 1 460 120 V210 Z"/></clipPath></defs>`;
    s += `<rect width="800" height="450" fill="#2e1d12"/>`;
    for (let i = 0; i < 20; i++) s += `<rect x="${i * 40}" y="0" width="40" height="340" fill="${i % 2 ? "#3a2416" : "#352013"}"/><path d="M${i * 40} 0 V340" stroke="#1e130b" stroke-width="2"/>`;
    s += `<rect x="0" y="40" width="800" height="18" fill="#24160d"/><rect x="150" y="0" width="22" height="340" fill="#24160d"/><rect x="628" y="0" width="22" height="340" fill="#24160d"/>`;
    /* Fenster mit Himmel */
    s += `<path d="M340 210 V120 A60 60 0 0 1 460 120 V210 Z" fill="url(#bpkHimmel)"/><g clip-path="url(#bpkFenster)">${himmelsKoerper(z, 340, 60, 120, 150)}<path d="M330 214 L 360 170 L 392 196 L 430 160 L 470 214 Z" fill="#1e1a1a" opacity=".7"/></g>`;
    s += `<path d="M400 60 V210 M340 150 H460" stroke="#24160d" stroke-width="6"/><path d="M340 210 V120 A60 60 0 0 1 460 120 V210 Z" fill="none" stroke="#4a2e1a" stroke-width="10"/><rect x="326" y="208" width="148" height="12" fill="#4a2e1a"/>`;
    if (!nacht) s += `<path d="M345 215 L 455 215 L 520 340 L 300 340 Z" fill="#fff2c0" opacity=".06"/>`;
    /* Schild über dem Fenster */
    s += `<g transform="translate(400 18)"><path d="M-40 -12 V4" stroke="#1a120c" stroke-width="2"/><path d="M40 -12 V4" stroke="#1a120c" stroke-width="2"/><rect x="-54" y="4" width="108" height="30" rx="4" fill="#5a3820" stroke="#2a1a10" stroke-width="2"/><g fill="#e0a046"><rect x="-10" y="10" width="16" height="18" rx="2"/><path d="M6 13 q8 2 0 12" stroke="#e0a046" stroke-width="3" fill="none"/><ellipse cx="-2" cy="11" rx="10" ry="4" fill="#f3e6cf"/></g><circle cx="-38" cy="19" r="4" fill="#e0a046"/><circle cx="38" cy="19" r="4" fill="#e0a046"/></g>`;
    /* Regal mit Flaschen */
    s += `<g transform="translate(184 120)"><rect x="0" y="40" width="120" height="7" fill="#24160d"/><rect x="0" y="100" width="120" height="7" fill="#24160d"/>`;
    for (let i = 0; i < 6; i++) s += `<rect x="${8 + i * 18}" y="${14 + zz(0, 8)}" width="9" height="${26 - zz(0, 6)}" rx="3" fill="${zufall(["#2f4a2a", "#5a2a1a", "#6a4a1a", "#3a2a3a", "#7a5a2a"])}"/><rect x="${11 + i * 18}" y="8" width="3" height="10" fill="#2a1a10"/>`;
    for (let i = 0; i < 4; i++) s += `<rect x="${10 + i * 26}" y="78" width="18" height="22" rx="3" fill="#8a5a2a"/><path d="M${28 + i * 26} 82 q7 2 0 12" stroke="#8a5a2a" stroke-width="3" fill="none"/>`;
    if (Math.random() < .55) s += `<g class="bp-katze" transform="translate(${zufall([18, 70])} 100)"><path d="M0 0 C 0 -20 8 -26 16 -26 L 14 -36 L 20 -30 L 26 -36 L 26 -24 C 32 -20 34 -10 32 0 Z" fill="#141010"/><path class="bp-schwanz" d="M30 -2 C 44 0 46 -14 40 -22" stroke="#141010" stroke-width="5" fill="none" stroke-linecap="round"/><circle cx="18" cy="-24" r="1.6" fill="#e0c050"/><circle cx="24" cy="-24" r="1.6" fill="#e0c050"/></g>`;
    s += `</g>`;
    /* Kamin rechts */
    s += `<g transform="translate(476 196)"><path d="M0 144 V 30 Q 0 0 30 0 H 120 Q 150 0 150 30 V 144 Z" fill="#4a4040"/><path d="M22 144 V 54 Q 22 30 46 30 H 104 Q 128 30 128 54 V 144 Z" fill="#140c0a"/>`;
    for (let r = 0; r < 4; r++) s += `<path d="M0 ${36 + r * 28} h22 M128 ${36 + r * 28} h22" stroke="#2e2828" stroke-width="2"/>`;
    s += `${glut(75, 120, 70)}${flamme(60, 140, 1.1)}${flamme(78, 142, 1.5, "#ff7a2a")}${flamme(96, 140, 1.05)}<rect x="40" y="136" width="70" height="8" rx="3" fill="#3a2010"/><rect x="-10" y="-8" width="170" height="12" fill="#3a2416"/></g>`;
    /* Steckbrief an der Wand */
    if (Math.random() < .7) {
      const wer = zufall(["Venomfang", "Glasstab", "Demogorgon", "Ilvara", "Themberchaud"]);
      s += `<g transform="translate(${zufall([161, 660])} 120) rotate(${zz(-6, 6).toFixed(1)})"><rect x="-26" y="0" width="52" height="66" fill="#d9c493"/><text x="0" y="14" text-anchor="middle" font-size="10" font-family="Georgia,serif" fill="#5a1a12" font-weight="700">${sprache() === "en" ? "WANTED" : "GESUCHT"}</text><rect x="-17" y="19" width="34" height="28" fill="#8a7050"/><text x="0" y="58" text-anchor="middle" font-size="7" font-family="Georgia,serif" fill="#3a2a1a">${wer}</text><circle cx="0" cy="2" r="2.4" fill="#5a3a22"/></g>`;
    }
    s += laterne(240, 96) + laterne(560, 96);
    s += vorhangFormen("#c9a043");
    s += `<rect x="0" y="330" width="800" height="12" fill="#2a1a0e"/>` + dielen(340, "#4a2e1a", "#2e1c10");
    return s;
  }

  function marktSVG(z) {
    const dunkel = z === "nacht" || z === "abend";
    let s = `<defs>${himmelDefs(z)}${glutDefs}</defs><rect width="800" height="450" fill="url(#bpkHimmel)"/>${himmelsKoerper(z, 0, 0, 800, 240)}`;
    s += `<path d="M0 230 C 120 170 230 200 330 180 C 450 156 560 196 660 170 C 720 156 770 170 800 176 V 340 H 0 Z" fill="${dunkel ? "#1e1a1c" : "#6a6a4a"}" opacity=".85"/>`;
    s += `<path d="M0 250 C 140 226 260 240 400 226 C 540 212 660 236 800 222 V 340 H 0 Z" fill="${dunkel ? "#241c1c" : "#4f5a3a"}"/>`;
    /* Häuser */
    let x = -20;
    while (x < 820) {
      const w = zz(70, 110), h = zz(80, 130), y = 330 - h, wand = zufall(dunkel ? ["#2e2222", "#33261f", "#2a2026"] : ["#7a5a3a", "#8a6a4a", "#6a4a32", "#9a7a52"]), dach = dunkel ? "#1e1416" : zufall(["#6a2a1e", "#5a3020", "#4a2a2a"]);
      s += `<rect x="${x.toFixed(0)}" y="${y.toFixed(0)}" width="${w.toFixed(0)}" height="${h.toFixed(0)}" fill="${wand}"/><path d="M${(x - 8).toFixed(0)} ${y.toFixed(0)} L ${(x + w / 2).toFixed(0)} ${(y - zz(30, 50)).toFixed(0)} L ${(x + w + 8).toFixed(0)} ${y.toFixed(0)} Z" fill="${dach}"/>`;
      for (let i = 0; i < 2; i++) { const lit = dunkel && Math.random() < .7; s += `<rect class="${lit ? "bp-flacker" : ""}" style="--d:${zz(0, 3).toFixed(1)}s" x="${(x + 14 + i * (w - 40)).toFixed(0)}" y="${(y + 22).toFixed(0)}" width="14" height="18" fill="${lit ? "#ffcf7a" : dunkel ? "#1a1214" : "#3a2a1e"}"/>`; }
      x += w + zz(6, 20);
    }
    /* Wimpelkette */
    const farben = ["#9b3a2f", "#e0a046", "#6f8a5a", "#ebe2cc", "#7a3a6a"];
    s += `<path d="M0 70 Q 200 140 400 86 Q 600 140 800 70" stroke="#2a1a10" stroke-width="2" fill="none"/>`;
    for (let i = 1; i < 20; i++) { const tt = i / 20, px = tt * 800, loc = tt < .5 ? tt * 2 : (tt - .5) * 2, py = (tt < .5 ? 70 + (86 - 70) * loc : 86 + (70 - 86) * loc) + Math.sin(loc * Math.PI) * 34; s += `<path class="bp-wimpel" style="--d:${(i * .13).toFixed(2)}s" d="M${(px - 10).toFixed(1)} ${py.toFixed(1)} L ${(px + 10).toFixed(1)} ${py.toFixed(1)} L ${px.toFixed(1)} ${(py + 24).toFixed(1)} Z" fill="${farben[i % farben.length]}"/>`; }
    /* Fackeln */
    [110, 690].forEach(fx => { s += `<rect x="${fx - 4}" y="210" width="8" height="130" fill="#2a1a10"/>${dunkel ? glut(fx, 200, 80) : ""}${flamme(fx, 212, 1)}`; });
    /* Bühne: Wagen mit Brettern */
    s += `<rect x="0" y="322" width="800" height="18" fill="#5a3a20"/><rect x="0" y="336" width="800" height="6" fill="#2a1a0e"/>` + dielen(340, "#6a4628", "#3a2412");
    s += `<g transform="translate(36 300)"><rect width="46" height="40" fill="#7a5028" stroke="#3a2412" stroke-width="3"/><path d="M0 0 L46 40 M46 0 L0 40" stroke="#3a2412" stroke-width="3"/></g><g transform="translate(720 296)"><ellipse cx="22" cy="6" rx="22" ry="7" fill="#6a4020"/><rect x="0" y="6" width="44" height="40" fill="#7a4a22"/><path d="M0 18 h44 M0 34 h44" stroke="#3a2412" stroke-width="3"/></g>`;
    if (z !== "tag" || Math.random() < .3) s += `<rect width="800" height="450" fill="${TONUNG[z][0]}" opacity="${TONUNG[z][1] * .6}"/>`;
    return s;
  }

  function hoehleSVG(z) {
    const pilzFarben = zufall([["#ffb347", "#ff8a3a"], ["#c27ae0", "#9a4ac0"], ["#7ad87a", "#4aa84a"], ["#ff7ab0", "#c04a80"]]);
    let s = `<defs>${glutDefs}<radialGradient id="bpkGlutP"><stop offset="0" stop-color="${pilzFarben[0]}" stop-opacity=".5"/><stop offset="1" stop-color="${pilzFarben[0]}" stop-opacity="0"/></radialGradient><radialGradient id="bpkLava" cx="50%" cy="100%" r="80%"><stop offset="0" stop-color="#ff6a1a" stop-opacity=".55"/><stop offset="1" stop-color="#ff6a1a" stop-opacity="0"/></radialGradient></defs>`;
    s += `<rect width="800" height="450" fill="#0e0a10"/><rect x="0" y="120" width="800" height="230" fill="url(#bpkLava)"/>`;
    /* Gracklstugh in der Ferne */
    for (let i = 0; i < 14; i++) { const x = 180 + i * 32 + zz(-6, 6), h = zz(40, 110); s += `<rect x="${x.toFixed(0)}" y="${(300 - h).toFixed(0)}" width="${zz(18, 28).toFixed(0)}" height="${h.toFixed(0)}" fill="#1c1218"/>`; if (Math.random() < .6) s += `<rect class="bp-flacker" style="--d:${zz(0, 3).toFixed(1)}s" x="${(x + 6).toFixed(0)}" y="${(300 - h + 12).toFixed(0)}" width="4" height="6" fill="#ff9a3a"/>`; }
    s += `<path d="M0 0 H800 V120 C 700 160 640 90 560 130 C 480 170 420 100 340 140 C 260 180 180 100 100 150 C 60 170 20 140 0 150 Z" fill="#1d1520"/>`;
    for (let i = 0; i < 16; i++) { const x = zz(0, 800), w = zz(10, 26), h = zz(30, 110); s += `<path d="M${(x - w).toFixed(0)} 100 L ${x.toFixed(0)} ${(100 + h).toFixed(0)} L ${(x + w).toFixed(0)} 100 Z" fill="#251a2a"/>`; }
    s += `<path d="M0 150 C 40 170 60 250 50 340 H 0 Z" fill="#1a121e"/><path d="M800 140 C 760 170 740 250 752 340 H 800 Z" fill="#1a121e"/>`;
    /* Lavaspalt hinten */
    s += `<path class="bp-flacker" d="M120 312 C 200 302 260 318 340 306 C 420 296 520 318 600 304 C 650 298 700 310 760 302" stroke="#ff7a2a" stroke-width="4" fill="none" opacity=".85"/>`;
    s += `<rect x="0" y="318" width="800" height="24" fill="#1a1218"/>` + dielen(336, "#231a22", "#140e14");
    /* Leuchtpilze */
    const pilze = [[60, 330], [140, 344], [700, 336], [760, 350], [zz(240, 320), 330], [zz(480, 560), 332]];
    pilze.forEach(([px, py], i) => {
      const sk = zz(.7, 1.3);
      s += `${glut(px, py - 20 * sk, 60 * sk, "P", "bp-pilzglut")}<g transform="translate(${px.toFixed(0)} ${py}) scale(${sk.toFixed(2)})"><rect x="-3" y="-22" width="6" height="22" rx="2" fill="#e8d8c8"/><path d="M-18 -20 C -16 -38 16 -38 18 -20 Z" fill="${pilzFarben[i % 2]}"/><circle cx="-6" cy="-28" r="2.4" fill="#fff" opacity=".7"/><circle cx="6" cy="-25" r="1.8" fill="#fff" opacity=".6"/>${i % 2 ? "" : `<g transform="translate(16 0) scale(.6)"><rect x="-3" y="-22" width="6" height="22" rx="2" fill="#e8d8c8"/><path d="M-18 -20 C -16 -38 16 -38 18 -20 Z" fill="${pilzFarben[1]}"/></g>`}</g>`;
    });
    if (z === "nacht") s += `<rect width="800" height="450" fill="#000" opacity=".15"/>`;
    return s;
  }

  function halleSVG(z) {
    const bannerFarbe = zufall([["#7a1d16", "#c9a043"], ["#2f4a2a", "#c9a043"], ["#4a2a5a", "#e0a046"], ["#5a3a14", "#ebe2cc"]]);
    let s = `<defs>${himmelDefs(z)}${glutDefs}<linearGradient id="bpkSaeule" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#2a2226"/><stop offset=".5" stop-color="#4a4044"/><stop offset="1" stop-color="#2a2226"/></linearGradient></defs>`;
    s += `<rect width="800" height="450" fill="#262022"/>`;
    for (let r = 0; r < 12; r++) for (let c = 0; c < 14; c++) s += `<rect x="${c * 60 + (r % 2) * 30 - 30}" y="${r * 30}" width="58" height="28" fill="${zufall(["#2c2528", "#2a2326", "#302a2c"])}"/>`;
    /* Rundfenster mit Himmel */
    s += `<circle cx="400" cy="80" r="44" fill="url(#bpkHimmel)"/>${himmelsKoerper(z, 362, 42, 76, 76).replace(/r="([\d.]+)"/g, (m, r) => `r="${Math.min(+r, 10)}"`)}<circle cx="400" cy="80" r="44" fill="none" stroke="#5a4a44" stroke-width="8"/><path d="M400 36 V124 M356 80 H444" stroke="#5a4a44" stroke-width="4"/>`;
    s += `<path d="M370 124 L 430 124 L 470 340 L 330 340 Z" fill="#fff2c0" opacity="${z === "nacht" ? .02 : .05}"/>`;
    /* Thron */
    s += `<g transform="translate(400 210)"><rect x="-70" y="90" width="140" height="14" fill="#3a3034"/><rect x="-56" y="76" width="112" height="14" fill="#443a3e"/><path d="M-36 76 V -10 Q 0 -44 36 -10 V 76 Z" fill="#3a2a22" stroke="#c9a043" stroke-width="3"/><rect x="-44" y="30" width="88" height="14" fill="#5a3a22"/><circle cx="0" cy="-12" r="8" fill="#c9a043"/></g>`;
    /* Säulen und Banner */
    [80, 250, 550, 720].forEach((x, i) => {
      s += `<rect x="${x - 26}" y="0" width="52" height="340" fill="url(#bpkSaeule)"/><rect x="${x - 34}" y="28" width="68" height="14" fill="#4a4044"/><rect x="${x - 34}" y="318" width="68" height="22" fill="#3a3034"/>`;
      if (i === 1 || i === 2) { const bx = i === 1 ? 160 : 640; s += `<g transform="translate(${bx} 50)"><g class="bp-banner" style="--d:${i * .7}s"><path d="M-30 0 H30 V150 L 0 130 L -30 150 Z" fill="${bannerFarbe[0]}"/><path d="M-30 0 H30" stroke="${bannerFarbe[1]}" stroke-width="6"/><path d="M-12 50 h24 v12 h-24 Z M-4 62 v30 h8 v-30 M-18 92 h36 v8 h-36 Z" fill="${bannerFarbe[1]}"/></g></g>`; }
    });
    /* Feuerschalen */
    [290, 510].forEach(x => { s += `${glut(x, 250, 110)}<path d="M${x - 26} 262 h52 l-10 18 h-32 Z" fill="#3a3034"/><rect x="${x - 4}" y="280" width="8" height="60" fill="#2a2224"/>${flamme(x - 10, 264, 1.2)}${flamme(x + 6, 266, 1.6, "#ff7a2a")}${flamme(x + 16, 264, 1)}`; });
    s += `<rect x="0" y="334" width="800" height="10" fill="#1e181a"/>` + dielen(342, "#2e2628", "#1c1618");
    s += `<path d="M360 342 L 440 342 L 520 450 L 280 450 Z" fill="#6a1418"/><path d="M366 342 L 290 450 M434 342 L 510 450" stroke="#c9a043" stroke-width="4"/>`;
    s += `<rect width="800" height="450" fill="${TONUNG[z][0]}" opacity="${TONUNG[z][1] * .5}"/>`;
    return s;
  }

  /* Wetter- und Partikel-Ebene (HTML, damit sie im CSS animiert werden kann) */
  function partikel(ort, z) {
    if (ruhig) return "";
    let s = "", art;
    if (ort === "markt") art = z === "nacht" || z === "abend" ? zufall(["gluehwurm", "gluehwurm", "regen"]) : zufall(["blatt", "regen", "staub", "blatt"]);
    else if (ort === "hoehle") art = "spore";
    else if (ort === "halle") art = "funke";
    else art = zufall(["staub", "staub", "funke"]);
    const n = art === "regen" ? 46 : art === "staub" ? 16 : 14;
    for (let i = 0; i < n; i++) {
      const st = `left:${zz(2, 98).toFixed(1)}%;top:${zz(art === "regen" ? -20 : 10, art === "regen" ? 0 : 85).toFixed(1)}%;--d:${zz(0, 6).toFixed(2)}s;--t:${zz(art === "regen" ? .6 : 5, art === "regen" ? 1 : 11).toFixed(2)}s;--x:${zz(-40, 40).toFixed(0)}px`;
      const inhalt = art === "blatt" ? zufall(["🍂", "🍁"]) : "";
      s += `<i class="bp-p bp-p-${art}" style="${st}">${inhalt}</i>`;
    }
    return s;
  }

  /* Publikum: Schattenrisse in der ersten Reihe, jedes Mal anders gemischt */
  function publikumSVG() {
    const farben = ["#171014", "#1c1318", "#140e14", "#1f1517", "#191216"];
    const typen = ["mensch", "hut", "kapuze", "zwerg", "elf", "spitzhut", "ork", "halbling", "zopf"];
    let s = "", x = zz(10, 40), i = 0;
    while (x < 800) {
      const typ = zufall(typen), sk = typ === "halbling" ? zz(.7, .8) : typ === "ork" ? zz(1.05, 1.18) : zz(.86, 1.08), f = zufall(farben), y = 168 + (i % 2 ? 6 : 0);
      const rim = `stroke="#e0a046" stroke-opacity=".32" stroke-width="2"`;
      let k = `<path d="M-42 4 C -42 -38 -28 -52 0 -52 C 28 -52 42 -38 42 4 Z" fill="${f}" ${rim}/>`;
      const kopfR = typ === "ork" ? 25 : 22;
      k += `<g class="bp-gkopf"><circle cx="0" cy="-74" r="${kopfR}" fill="${f}" ${rim}/>`;
      if (typ === "hut") k += `<ellipse cx="0" cy="-90" rx="36" ry="6" fill="${f}" ${rim}/><rect x="-16" y="-120" width="32" height="30" rx="4" fill="${f}"/>`;
      if (typ === "kapuze") k += `<path d="M-30 -56 C -34 -108 34 -108 30 -56 Z" fill="${f}" ${rim}/>`;
      if (typ === "zwerg") k += `<path d="M-24 -84 C -24 -108 24 -108 24 -84 Z" fill="#2a2426"/><path d="M-24 -90 l-14 -18 l8 22 Z M24 -90 l14 -18 l-8 22 Z" fill="#cfc4b0"/><path d="M-20 -70 L 0 -24 L 20 -70 Z" fill="#3a2418"/>`;
      if (typ === "elf") k += `<path d="M-19 -80 L -40 -100 L -18 -70 Z M19 -80 L 40 -100 L 18 -70 Z" fill="${f}" ${rim}/>`;
      if (typ === "spitzhut") k += `<ellipse cx="0" cy="-90" rx="34" ry="6" fill="${f}"/><path d="M-22 -90 L 6 -150 L 22 -90 Z" fill="${f}" ${rim}/>`;
      if (typ === "ork") k += `<path d="M-8 -60 l-3 -8 M8 -60 l3 -8" stroke="#e8dcc4" stroke-width="3" stroke-linecap="round"/>`;
      if (typ === "zopf") k += `<circle cx="-20" cy="-92" r="9" fill="${f}" ${rim}/><circle cx="20" cy="-92" r="9" fill="${f}" ${rim}/>`;
      k += `<g class="bp-gaugen"><circle cx="-7" cy="-76" r="2.2" fill="#e0a046" opacity=".8"/><circle cx="7" cy="-76" r="2.2" fill="#e0a046" opacity=".8"/></g></g>`;
      if (Math.random() < .4) k += `<g class="bp-krug"><path d="M26 -36 L 44 -92" stroke="${f}" stroke-width="13" stroke-linecap="round"/><rect x="34" y="-122" width="22" height="26" rx="3" fill="#8a5a2a"/><ellipse cx="45" cy="-122" rx="12" ry="5" fill="#f3e6cf"/><path d="M56 -116 q8 2 0 12" stroke="#8a5a2a" stroke-width="4" fill="none"/></g>`;
      s += `<g class="bp-gast" style="--d:${(Math.random() * .4).toFixed(2)}s" transform="translate(${x.toFixed(0)} ${y}) scale(${sk.toFixed(2)})"><g class="bp-gast-i">${k}</g></g>`;
      x += zz(62, 92); i++;
    }
    return `<svg class="bp-publikum-svg" viewBox="0 0 800 170" preserveAspectRatio="xMidYMax slice" aria-hidden="true">${s}</svg>`;
  }

  /* =====================================================================
     ZIELE – wer besungen bzw. verspottet wird und wie er auf der Bühne steht
     hoehe = Anteil der Bühnenhöhe (Querformat), kopf = Kopfmitte im Bild (0–1)
     ===================================================================== */
  const BILDER = {
    friedrich: { bild: "friedrich-frei.webp", w: 576, h: 560, hoehe: .74, kopf: [.5, .13], kb: .16 },
    echo: { bild: "echo-frei.webp", w: 561, h: 560, hoehe: .8, kopf: [.49, .24], kb: .14 },
    ezekiel: { bild: "ezekiel-frei.webp", w: 417, h: 560, hoehe: .76, kopf: [.5, .13], kb: .16 },
    rex: { bild: "rex-frei.webp", w: 532, h: 560, hoehe: .55, kopf: [.44, .27], kb: .3 }
  };
  const MONSTER = {
    bugbear: { bild: "bugbear-frei.webp", w: 436, h: 454, hoehe: .72, kopf: [.4, .14], kb: .2, sw: 14 },
    venomfang: { steckbrief: "venomfang.jpg", pos: "45% 40%", sw: 22 },
    blight: { bild: "blight-frei.webp", w: 1100, h: 605, hoehe: .46, kopf: [.6, .5], kb: .14, sw: 8 },
    chasme: { bild: "chasme-frei.webp", w: 403, h: 547, hoehe: .66, kopf: [.32, .26], kb: .3, sw: 16, schwebt: .1 },
    vrock: { bild: "vrock-frei.webp", w: 409, h: 628, hoehe: .74, kopf: [.55, .72], kb: .3, sw: 18, schwebt: .05 },
    kuotoa: { bild: "kuo-toa-frei.webp", w: 307, h: 420, hoehe: .62, kopf: [.55, .28], kb: .3, sw: 12 },
    demogorgon: { bild: "demogorgon-frei.webp", w: 640, h: 542, hoehe: .82, kopf: [.2, .26], kb: .2, sw: 30 },
    ilvara: { bild: "ilvara-wahr.webp", w: 548, h: 998, hoehe: .84, kopf: [.52, .1], kb: .14, sw: 18 },
    glasstab: { figur: "glasstab", sw: 10 }, glasstaff: { figur: "glasstab", sw: 10 },
    riese: { bild: "riese-frei.webp", w: 434, h: 520, hoehe: .88, kopf: [.8, .12], kb: .2, sw: 24 }, giant: { bild: "riese-frei.webp", w: 434, h: 520, hoehe: .88, kopf: [.8, .12], kb: .2, sw: 24 },
    themberchaud: { bild: "themberchaud-frei.webp", w: 472, h: 640, hoehe: .88, kopf: [.36, .2], kb: .28, sw: 26 }
  };
  const FIGUREN = {
    imre: { haut: "#ecc29f", hautD: "#d3a07e", haar: "dreads", haarFarbe: "#8a6a44", braue: "#5a3e24", bart: "voll", bartFarbe: "#7a5a3a", kleid: "#24212a", hose: "#3a3330", stiefel: "#2a1e16", imre: true },
    glasstab: { haut: "#e8c8a8", hautD: "#c8a080", haar: "glatt", haarFarbe: "#2a2220", bart: "ziege", kleid: "#8a1e1e", robe: true, brille: true, stab: true }
  };
  function gastFigur() {
    const haut = zufall([["#f1c6a0", "#d29a72"], ["#d9a074", "#b47a52"], ["#a8704a", "#86553a"], ["#7a4e30", "#5e3a22"]]);
    return {
      haut: haut[0], hautD: haut[1], haar: zufall(["kurz", "lang", "zopf", "glatze", "locken", "kurz"]),
      haarFarbe: zufall(["#d8b25a", "#2a2220", "#6a4428", "#a4491f", "#a8a29a", "#4a2a1a"]),
      bart: zufall(["keiner", "keiner", "voll", "schnurr", "ziege"]), hut: zufall(["keiner", "keiner", "filzhut", "kapuze", "kappe", "spitzhut"]),
      hutFarbe: zufall(["#3a2a1a", "#4a2a5a", "#2f4a2a", "#6a2228", "#5a4a2a"]), ohren: zufall(["rund", "rund", "elf"]),
      kleid: zufall(["#4f6a3a", "#6a2228", "#6a4a2a", "#8a6a2a", "#4a2a5a", "#5a3a3a"]), hose: zufall(["#3a2a1e", "#2a2420", "#4a3a2a"]), stiefel: "#3a2416"
    };
  }
  function bestien() {
    const q = sprache() === "en" ? (window.INHALT_EN || window.INHALT) : window.INHALT;
    return ((q && q.bestiarium) || []).filter(b => b.bild);
  }
  function spottZiele() {
    const namen = bestien().map(b => b.name);
    (ZIEL_EXTRA[sprache()] || []).forEach(n => { if (!namen.includes(n)) namen.push(n); });
    return namen;
  }
  const monsterKey = name => { const k = schluessel(name); return Object.keys(MONSTER).find(x => k === x || k.indexOf(x) > -1) || null; };
  /* Beschreibung des aktuellen Ziels: art = bild | figur | spiegel | steckbrief */
  function zielBeschreibung(modus, ziel, name) {
    if (ziel === "*") return { art: "figur", figur: gastLook, key: "gast", sw: 10, hoehe: .72, a: .625, kopf: [.5, .21], kb: .3 };
    const k = schluessel(name);
    if (modus === "lob") {
      if (BILDER[k]) return Object.assign({ art: "bild", key: k, a: BILDER[k].w / BILDER[k].h }, BILDER[k]);
      if (k === "imre") return { art: "figur", figur: FIGUREN.imre, key: "imre", hoehe: .74, a: .625, kopf: [.5, .21], kb: .3 };
      if (k === "barradin") return { art: "spiegel", key: "barradin", hoehe: .74, a: .62, kopf: [.5, .32], kb: .3 };
      return { art: "figur", figur: gastLook, key: "gast", hoehe: .72, a: .625, kopf: [.5, .21], kb: .3 };
    }
    const mk = monsterKey(name), M = mk && MONSTER[mk];
    if (M && M.bild) return Object.assign({ art: "bild", key: mk, a: M.w / M.h }, M);
    if (M && M.figur) return { art: "figur", figur: FIGUREN[M.figur], key: mk, sw: M.sw, hoehe: .74, a: .625, kopf: [.5, .21], kb: .3 };
    const b = bestien().find(x => x.name === name);
    return { art: "steckbrief", bild: (M && M.steckbrief) || (b && b.bild) || "venomfang.jpg", pos: (M && M.pos) || "50% 35%", key: mk || k, sw: (M && M.sw) || 16, hoehe: .66, a: .74, kopf: [.5, .44], kb: .4 };
  }

  /* =====================================================================
     DER W20 – ein echtes Ikosaeder aus 20 Dreiecken in CSS-3D
     ===================================================================== */
  const W20 = (function () {
    const P = (1 + Math.sqrt(5)) / 2;
    const V = [[-1, P, 0], [1, P, 0], [-1, -P, 0], [1, -P, 0], [0, -1, P], [0, 1, P], [0, -1, -P], [0, 1, -P], [P, 0, -1], [P, 0, 1], [-P, 0, -1], [-P, 0, 1]];
    const F = [[0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11], [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8], [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9], [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1]];
    const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]], mul = (a, s) => [a[0] * s, a[1] * s, a[2] * s];
    const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2], len = a => Math.sqrt(dot(a, a)), norm = a => mul(a, 1 / len(a));
    const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
    const flaechen = F.map(f => {
      let [v0, v1, v2] = f.map(i => V[i]);
      const c = mul(add(add(v0, v1), v2), 1 / 3);
      let eR = norm(sub(v2, v1)), eD = norm(sub(mul(add(v1, v2), .5), v0)), eN = cross(eR, eD);
      if (dot(eN, c) < 0) { [v1, v2] = [v2, v1]; eR = norm(sub(v2, v1)); eN = cross(eR, eD); }
      return { v0, v1, v2, c, eR, eD, eN, zahl: 0 };
    });
    /* Gegenüberliegende Seiten ergeben zusammen 21 – wie bei einem echten W20 */
    let z = 1;
    flaechen.forEach(f => {
      if (f.zahl) return;
      const g = flaechen.find(h => !h.zahl && h !== f && len(add(h.c, f.c)) < .01);
      f.zahl = z; if (g) g.zahl = 21 - z; z++;
    });
    const M3 = (a, b) => { const r = [[0, 0, 0], [0, 0, 0], [0, 0, 0]]; for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) r[i][j] = a[i][0] * b[0][j] + a[i][1] * b[1][j] + a[i][2] * b[2][j]; return r; };
    const MV = (m, v) => [m[0][0] * v[0] + m[0][1] * v[1] + m[0][2] * v[2], m[1][0] * v[0] + m[1][1] * v[1] + m[1][2] * v[2], m[2][0] * v[0] + m[2][1] * v[1] + m[2][2] * v[2]];
    const rot = (ax, w) => { const [x, y, zz2] = ax, c = Math.cos(w), s = Math.sin(w), t2 = 1 - c; return [[t2 * x * x + c, t2 * x * y - s * zz2, t2 * x * zz2 + s * y], [t2 * x * y + s * zz2, t2 * y * y + c, t2 * y * zz2 - s * x], [t2 * x * zz2 - s * y, t2 * y * zz2 + s * x, t2 * zz2 * zz2 + c]]; };
    const css = m => "matrix3d(" + [m[0][0], m[1][0], m[2][0], 0, m[0][1], m[1][1], m[2][1], 0, m[0][2], m[1][2], m[2][2], 0, 0, 0, 0, 1].map(x => +x.toFixed(5)).join(",") + ")";
    const LICHT = norm([-.45, -.7, .65]);
    /* Ausrichtung, in der die Seite mit der Zahl n nach vorne zeigt (leicht gekippt, damit man die Kanten sieht) */
    function ziel(n, kipp, dreh) {
      const f = flaechen.find(x => x.zahl === n) || flaechen[0];
      const BT = [f.eR, f.eD, f.eN];
      return M3(M3(rot([0, 0, 1], dreh), rot([1, 0, 0], kipp)), BT);
    }
    return { flaechen, M3, MV, rot, css, ziel, LICHT, dot, norm };
  })();

  function wuerfelBauen(el) {
    el.innerHTML = '<div class="bp-w20-k">' + W20.flaechen.map((f, i) =>
      `<div class="bp-fl" data-i="${i}"><svg viewBox="0 0 100 86.6" aria-hidden="true"><polygon class="bp-fl-f" points="50,1.5 1.5,85.1 98.5,85.1"/><polygon class="bp-fl-i" points="50,16 14,78 86,78"/><text class="bp-fl-z" x="50" y="${f.zahl > 9 ? 66 : 67}">${f.zahl}</text>${f.zahl === 6 || f.zahl === 9 ? '<rect class="bp-fl-zs" x="42" y="71" width="16" height="3"/>' : ""}<path class="bp-fl-riss" d="M50 14 L 44 34 L 56 44 L 46 62 L 54 80"/><polygon class="bp-fl-s" points="50,0 0,86.6 100,86.6"/></svg></div>`).join("") + "</div>";
  }
  function wuerfelMasse(el, D) {
    const s = D / 1.92, h = s * Math.sqrt(3) / 2, k = s / 2;
    el.querySelectorAll(".bp-fl").forEach(div => {
      const f = W20.flaechen[+div.dataset.i];
      const O = [f.v1[0] * k - f.eD[0] * h, f.v1[1] * k - f.eD[1] * h, f.v1[2] * k - f.eD[2] * h];
      div.style.width = s + "px"; div.style.height = h + "px";
      div.style.transform = "matrix3d(" + [f.eR[0], f.eR[1], f.eR[2], 0, f.eD[0], f.eD[1], f.eD[2], 0, f.eN[0], f.eN[1], f.eN[2], 0, O[0], O[1], O[2], 1].map(x => +x.toFixed(4)).join(",") + ")";
    });
  }
  function wuerfelDrehen(el, M) {
    el.firstChild.style.transform = W20.css(M);
    const schatten = el._schatten || (el._schatten = Array.from(el.querySelectorAll(".bp-fl-s")));
    W20.flaechen.forEach((f, i) => {
      const n = W20.MV(M, f.eN);
      if (n[2] <= 0) return;
      const l = W20.dot(n, W20.LICHT);
      schatten[i].style.opacity = klemm(.6 - .62 * l, 0, .72).toFixed(3);
    });
  }

  /* =====================================================================
     AUSSEHEN
     ===================================================================== */
  const AUGEN = ["offen", "zu", "lachzu", "gross", "herz", "x", "halb", "skeptisch"], BRAUEN = ["normal", "hoch", "boese", "traurig", "skeptisch"], MUENDER = ["neutral", "grinsen", "lachen", "singen", "o", "traurig", "zaehne", "wellig", "smirk"];
  const css = document.createElement("style");
  css.textContent = `
#barden-probe.bp { --bp-gold: #ffd27a; --bp-psy: #b25fd0; padding: .6rem; gap: 0; position: relative; overflow: hidden; }
html body #taverne #barden-probe.bp:is(.saal-aktiv, .tav-voll) { display: flex; flex-direction: column; }
html body #taverne.saal-einzeln #barden-probe.bp:not(.tav-voll) { max-width: none; width: var(--bp-b, 100%); height: var(--bp-h, auto); margin-left: calc((100% - var(--bp-b, 100%)) / 2); justify-self: start; }
html body #taverne .tav-karte.tav-voll#barden-probe.bp { padding: .5rem; height: 100%; overflow: hidden; }
.bp-spiel { flex: 1; min-height: 0; display: grid; gap: .55rem; position: relative; }
.bp-spiel.breit { grid-template-columns: minmax(0, 1fr) var(--pw, 20rem); grid-template-rows: auto minmax(0, 1fr); grid-template-areas: "b k" "b p"; column-gap: .9rem; }
.bp-spiel.schmal { grid-template-columns: minmax(0, 1fr); grid-template-rows: auto minmax(0, 1fr) auto; grid-template-areas: "k" "b" "p"; gap: .4rem; }
.bp-kopf { grid-area: k; display: grid; gap: .25rem; align-content: start; padding-right: 2.8rem; min-width: 0; }
.bp-kopf .label { margin: 0; }
.bp-titel { font-family: var(--name); font-size: clamp(1.25rem, 2.2vw, 2rem); line-height: 1.05; margin: 0; }
.bp-info { color: var(--ash); font-size: .9rem; line-height: 1.4; margin: 0; }
.bp-spiel.eng .bp-info, .bp-spiel.eng .bp-kopf .label { display: none; }
.bp-spiel.sehr-eng .bp-titel { display: none; }
.bp-spiel.sehr-eng .bp-wahl { flex-wrap: nowrap; overflow-x: auto; overflow-y: hidden; flex: none; }
.bp-spiel.schmal .bp-kopf { grid-template-columns: auto minmax(0, 1fr); align-items: center; gap: .6rem; }
.bp-spiel.schmal :is(.bp-info, .bp-kopf .label) { display: none; }
.bp-spiel.schmal .bp-titel { font-size: 1.05rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.bp-modus { display: inline-flex; justify-self: start; border: 1px solid var(--line); border-radius: 4px; overflow: hidden; }
.bp-modus button { border: 0; background: none; color: var(--ash); font: inherit; font-size: .88rem; padding: .35rem .85rem; min-height: 36px; cursor: pointer; touch-action: manipulation; }
.bp-modus button[aria-selected="true"] { background: var(--ember); color: var(--night); }
.bp.spott .bp-modus button[aria-selected="true"] { background: var(--blood); color: var(--vellum); }
.bp-modus button:focus-visible, .bp-wahl button:focus-visible, .bp-panel button:focus-visible { outline: 2px solid var(--bp-gold); outline-offset: 2px; }

.bp-panel { grid-area: p; display: flex; flex-direction: column; gap: .45rem; min-height: 0; min-width: 0; }
.bp-wahl-label { margin: 0; font-size: .78rem; letter-spacing: .08em; text-transform: uppercase; color: var(--ember); }
.bp.spott .bp-wahl-label { color: #d46a5a; }
.bp-wahl { display: flex; flex-wrap: wrap; gap: .4rem; align-content: flex-start; overflow: auto; min-height: 0; flex: 0 1 auto; scrollbar-width: thin; padding: 2px; }
.bp-wahl button { display: inline-flex; align-items: center; gap: .4rem; border: 1px solid var(--line); background: rgba(0,0,0,.22); color: var(--vellum); font: inherit; font-size: .86rem; padding: .2rem .7rem .2rem .25rem; min-height: 36px; border-radius: 999px; cursor: pointer; white-space: nowrap; touch-action: manipulation; transition: background .2s, border-color .2s; }
.bp-wahl button:hover { border-color: var(--ember); }
.bp-wahl .bp-av { width: 28px; height: 28px; border-radius: 50%; object-fit: cover; object-position: 50% 12%; background: #2a1f24; flex: none; display: grid; place-items: center; font-size: .95rem; overflow: hidden; }
.bp-wahl button[aria-checked="true"] { background: var(--ember); border-color: var(--ember); color: var(--night); }
.bp.spott .bp-wahl button[aria-checked="true"] { background: var(--blood); border-color: #d46a5a; color: var(--vellum); }
.bp-spiel.schmal .bp-wahl { flex-wrap: nowrap; overflow-x: auto; overflow-y: hidden; flex: none; }
.bp-spiel.schmal .bp-wahl-label { display: none; }
.bp-name { font: inherit; font-size: .95rem; background: rgba(0,0,0,.25); color: var(--vellum); border: 1px solid var(--line); border-radius: 4px; padding: .4rem .6rem; min-height: 36px; width: 100%; }
.bp-name:focus { outline: none; border-color: var(--ember); }
.bp-ergebnis { display: grid; gap: .1rem; min-height: 2.6em; align-content: center; }
.bp-erg-titel { font-family: var(--display); font-size: 1.25rem; line-height: 1.1; color: var(--vellum); }
.bp-erg-titel.patzer { color: #ff7a6a; } .bp-erg-titel.krit, .bp-erg-titel.legende { color: var(--bp-gold); } .bp-erg-titel.stark, .bp-erg-titel.gut { color: var(--ember); }
.bp-erg-rechnung { font-size: .82rem; color: var(--ash); }
.bp-spiel.schmal .bp-ergebnis { grid-template-columns: auto 1fr; align-items: baseline; gap: .6rem; min-height: 0; }
.bp-spiel.schmal .bp-erg-titel { font-size: 1.02rem; }
.bp-spiel.schmal .bp-erg-rechnung { font-size: .76rem; text-align: right; }
.bp-verlauf { list-style: none; margin: .2rem 0 0; padding: .5rem 0 0; border-top: 1px solid var(--line); display: grid; gap: .3rem; min-height: 0; overflow: hidden; font-size: .82rem; color: var(--ash); }
.bp-verlauf:empty, .bp-spiel:is(.schmal, .eng) .bp-verlauf { display: none; }
.bp-verlauf li { display: flex; gap: .5rem; align-items: baseline; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.bp-verlauf li b { font-family: var(--display); font-weight: 400; color: var(--vellum); min-width: 1.6em; text-align: right; }
.bp-verlauf li.krit b, .bp-verlauf li.legende b { color: var(--bp-gold); } .bp-verlauf li.patzer b { color: #ff7a6a; }
.bp-insp { margin: 0; font-size: .8rem; color: var(--ember); }
.bp-fuss { margin-top: auto; display: grid; gap: .45rem; }
.bp-los { display: flex; align-items: center; justify-content: center; gap: .55rem; width: 100%; min-height: 50px; padding: .5rem 1rem; font-family: var(--display); font-size: 1.2rem; letter-spacing: .02em; color: #1a1008; cursor: pointer; touch-action: manipulation;
  background: linear-gradient(#f0b459, #c4822e); border: 1px solid var(--bp-gold); border-radius: 7px; box-shadow: 0 4px 0 #7a4a18, 0 0 22px rgba(224,160,70,.3); transition: transform .08s, box-shadow .08s, filter .2s; }
.bp-los:hover { filter: brightness(1.08); }
.bp-los:active { transform: translateY(3px); box-shadow: 0 1px 0 #7a4a18, 0 0 12px rgba(224,160,70,.3); }
.bp-los svg { width: 1.5em; height: 1.5em; flex: none; }
.bp.spott .bp-los { background: linear-gradient(#c45444, #7a1d16); color: var(--vellum); border-color: #e07a6a; box-shadow: 0 4px 0 #3a0a08, 0 0 22px rgba(196,84,68,.3); }
.bp-los.weiter { background: linear-gradient(#5a4a3a, #3a2e24); color: var(--vellum); border-color: var(--line); box-shadow: 0 4px 0 #1a1410; }
.bp-neben { display: flex; gap: .45rem; }
.bp-neben button { flex: 1; display: inline-flex; align-items: center; justify-content: center; gap: .4rem; min-height: 38px; border: 1px solid var(--line); background: rgba(0,0,0,.22); color: var(--ember); font: inherit; font-size: .86rem; padding: .3rem .6rem; border-radius: 5px; cursor: pointer; touch-action: manipulation; }
.bp-neben button:hover { border-color: var(--ember); }
.bp-neben .bp-kulisse-knopf { flex: 0 0 auto; min-width: 42px; }
.bp-buch-knopf.neu { animation: bpPuls 1s ease-in-out 4; border-color: var(--bp-gold); }
.bp-stats { margin: 0; font-size: .76rem; color: var(--ash); line-height: 1.35; }
.bp-spiel.schmal .bp-fuss { grid-template-columns: minmax(0, 1fr) auto; align-items: stretch; }
.bp-spiel.schmal .bp-neben { flex-direction: row; }
.bp-spiel.schmal .bp-neben button { flex: 0 0 auto; min-width: 44px; }
.bp-spiel.schmal .bp-buch-knopf .bp-bt { display: none; }
.bp-spiel.schmal .bp-stats { display: none; }
.bp-spiel.schmal .bp-los { font-size: 1.05rem; min-height: 46px; }

/* ---------- Bühne ---------- */
.bp-buehne { grid-area: b; position: relative; overflow: hidden; border: 1px solid var(--line); border-radius: 6px; background: #140e12; min-height: 0; min-width: 0; contain: layout paint; -webkit-tap-highlight-color: transparent; }
.bp-welt { position: absolute; inset: 0; }
.bp-welt.wackeln { animation: bpWackeln .45s ease-in-out 2; }
.bp-kulisse { position: absolute; inset: 0; width: 100%; height: 100%; display: block; }
.bp-buehne::after { content: ""; position: absolute; inset: 0; z-index: 5; pointer-events: none; background: radial-gradient(ellipse 75% 70% at 50% 45%, transparent 55%, rgba(8,4,8,.55)); }
.bp-partikel { position: absolute; inset: 0; z-index: 1; overflow: hidden; pointer-events: none; }
.bp-p { position: absolute; display: block; font-style: normal; will-change: transform; }
.bp-p-staub { width: 3px; height: 3px; border-radius: 50%; background: rgba(255,224,170,.6); animation: bpSchweben var(--t) linear var(--d) infinite; }
.bp-p-funke { width: 3px; height: 3px; border-radius: 50%; background: #ffb35a; box-shadow: 0 0 6px #ff8a3a; animation: bpAufsteigen var(--t) linear var(--d) infinite; }
.bp-p-spore { width: 4px; height: 4px; border-radius: 50%; background: #e0b0ff; box-shadow: 0 0 8px #c27ae0; animation: bpSchweben var(--t) ease-in-out var(--d) infinite; }
.bp-p-gluehwurm { width: 4px; height: 4px; border-radius: 50%; background: #e4f58a; box-shadow: 0 0 9px #c8e05a; animation: bpGluehen var(--t) ease-in-out var(--d) infinite; }
.bp-p-regen { width: 1.5px; height: 22px; background: linear-gradient(transparent, rgba(225,222,210,.55)); animation: bpRegen var(--t) linear var(--d) infinite; }
.bp-p-blatt { font-size: 15px; animation: bpFallen var(--t) linear var(--d) infinite; }
@keyframes bpSchweben { 0% { transform: translate(0, 0); opacity: 0 } 15% { opacity: 1 } 85% { opacity: 1 } 100% { transform: translate(var(--x), -60px); opacity: 0 } }
@keyframes bpAufsteigen { 0% { transform: translate(0, 40px); opacity: 0 } 20% { opacity: 1 } 100% { transform: translate(var(--x), -160px); opacity: 0 } }
@keyframes bpGluehen { 0%, 100% { transform: translate(0, 0); opacity: .1 } 50% { transform: translate(var(--x), -30px); opacity: 1 } }
@keyframes bpRegen { from { transform: translate(0, 0) } to { transform: translate(-30px, 900px) } }
@keyframes bpFallen { 0% { transform: translate(0, -60px) rotate(0); opacity: 0 } 10% { opacity: 1 } 100% { transform: translate(var(--x), 700px) rotate(540deg); opacity: .8 } }
.bp-flamme { transform-box: fill-box; transform-origin: 50% 100%; animation: bpFlamme .8s ease-in-out var(--d) infinite alternate; }
@keyframes bpFlamme { from { transform: scale(.88, .86) skewX(-4deg) } to { transform: scale(1.06, 1.12) skewX(4deg) } }
.bp-flacker { animation: bpFlackern 3.2s ease-in-out var(--d) infinite; }
@keyframes bpFlackern { 0%, 100% { opacity: .85 } 20% { opacity: 1 } 23% { opacity: .7 } 48% { opacity: .95 } 70% { opacity: .8 } }
.bp-pilzglut { animation: bpFlackern 4.5s ease-in-out var(--d) infinite; }
.bp-stern { animation: bpFunkeln 2.6s ease-in-out var(--d) infinite; }
@keyframes bpFunkeln { 0%, 100% { opacity: .35 } 50% { opacity: 1 } }
.bp-wimpel { transform-box: fill-box; transform-origin: 50% 0; animation: bpWehen 2.4s ease-in-out var(--d) infinite alternate; }
@keyframes bpWehen { from { transform: rotate(-7deg) } to { transform: rotate(7deg) } }
.bp-banner { transform-box: fill-box; transform-origin: 50% 0; animation: bpWehen 5s ease-in-out var(--d) infinite alternate; }
.bp-schwanz { transform-box: fill-box; transform-origin: 0 100%; animation: bpWehen 1.6s ease-in-out infinite alternate; }
.bp-spot { position: absolute; inset: 0; z-index: 2; pointer-events: none; opacity: .55; transition: opacity .6s;
  background: radial-gradient(ellipse var(--sw, 30%) 70% at var(--sx, 20%) 62%, rgba(255,222,160,.26), transparent 70%), linear-gradient(to bottom, rgba(255,222,160,.0), rgba(255,222,160,0)); }
.bp-spot.an { opacity: 1; }
.bp-spot.gold { opacity: 1; background: radial-gradient(ellipse var(--sw, 30%) 75% at var(--sx, 20%) 60%, rgba(255,210,122,.45), transparent 72%); }
.bp-spot.aus { animation: bpSpotAus 1.2s steps(2) 1 forwards; }
@keyframes bpSpotAus { 0% { opacity: 1 } 30% { opacity: .1 } 50% { opacity: .8 } 70% { opacity: 0 } 100% { opacity: .15 } }
.bp-ort { position: absolute; z-index: 12; left: .5rem; top: .5rem; margin: 0; padding: .15rem .55rem; font-size: .72rem; color: var(--vellum); background: rgba(10,6,10,.62); border: 1px solid rgba(224,160,70,.25); border-radius: 999px; pointer-events: none; max-width: calc(100% - 1rem); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; transition: opacity .4s; }
.bp-buehne:is(.laeuft, .gespielt) .bp-ort { opacity: 0; }

/* Figuren */
.bp-box { position: absolute; left: 0; top: 0; z-index: 3; transform-origin: 50% 100%; }
.bp-box > svg, .bp-box > img { width: 100%; height: 100%; display: block; }
.bp-box > img { object-fit: contain; filter: drop-shadow(0 10px 14px rgba(0,0,0,.55)); }
.bp-fig { overflow: visible; filter: drop-shadow(0 10px 12px rgba(0,0,0,.5)); }
.bp-fig :is(.aa, .bb, .mm, .fa, .f-roete, .f-traenen, .f-schweiss, .f-wut, .f-rotkopf, .f-sterne, .f-glitzer) { display: none; }
${AUGEN.map(a => `.bp-fig[data-a="${a}"] .a-${a}`).join(",")}, ${BRAUEN.map(b => `.bp-fig[data-b="${b}"] .b-${b}`).join(",")}, ${MUENDER.map(m => `.bp-fig[data-m="${m}"] .m-${m}`).join(",")} { display: inline; }
.bp-fig[data-arme="seite"] .fa-seite, .bp-fig[data-arme="hoch"] .fa-hoch, .bp-fig[data-arme="herz"] .fa-herz, .bp-fig[data-arme="wangen"] .fa-wangen,
.bp-fig[data-arme="laute"] :is(.ba-strum, .ba-griff), .bp-fig[data-arme="zeig"] :is(.ba-strum, .ba-zeig), .bp-fig[data-arme="hoch"] :is(.ba-strum, .ba-hoch) { display: inline; }
.bp-fig[data-arme]:not([data-arme="seite"]) .f-stab { display: none; }
.bp-fig.x-rot .f-roete, .bp-fig.x-traenen .f-traenen, .bp-fig.x-schweiss .f-schweiss, .bp-fig.x-wut .f-wut, .bp-fig.x-rotkopf .f-rotkopf, .bp-fig.x-sterne .f-sterne, .bp-fig.x-glitzer .f-glitzer { display: inline; }
.bp-fig .f-ganz, .bp-fig .f-kopf, .bp-fig .f-singmund, .bp-fig .ba-schlag, .bp-fig .f-sterne { transform-box: fill-box; }
.bp-fig .f-ganz { transform-origin: 50% 100%; transition: transform .5s cubic-bezier(.3,1.4,.5,1); }
.bp-fig .f-kopf { transform-origin: 50% 92%; transition: transform .4s; }
.bp-fig .f-singmund { transform-origin: 50% 30%; animation: bpSingen .26s ease-in-out infinite alternate; }
@keyframes bpSingen { from { transform: scaleY(.45) } to { transform: scaleY(1) } }
.bp-fig .f-traenen path { animation: bpTraene 1.2s ease-in infinite; }
.bp-fig .f-traenen .tr2 { animation-delay: .5s; }
@keyframes bpTraene { 0% { transform: translateY(0); opacity: 0 } 15% { opacity: 1 } 100% { transform: translateY(26px); opacity: 0 } }
.bp-fig .f-schweiss { animation: bpTraene 1.6s ease-in infinite; }
.bp-fig .f-wut { animation: bpPochen .5s ease-in-out infinite alternate; transform-box: fill-box; transform-origin: center; }
@keyframes bpPochen { from { transform: scale(.85) } to { transform: scale(1.15) } }
.bp-fig .f-sterne { transform-origin: 50% 50%; animation: bpKreisen 1.4s linear infinite; }
@keyframes bpKreisen { from { transform: rotate(0) } to { transform: rotate(360deg) } }
.bp-fig .f-glitzer { animation: bpFunkeln .8s ease-in-out infinite; }
.p-singen .f-kopf { animation: bpNicken .62s ease-in-out infinite alternate; }
@keyframes bpNicken { from { transform: rotate(-5deg) } to { transform: rotate(5deg) translateY(2px) } }
.p-singen .ba-schlag { animation: bpSchlag .2s ease-in-out infinite alternate; }
@keyframes bpSchlag { from { transform: translate(0, -3px) } to { transform: translate(2px, 5px) } }
.p-spotten .f-kopf { animation: bpNicken .4s ease-in-out infinite alternate; }
.p-spotten .ba-zeig { animation: bpStechen .4s ease-in-out infinite alternate; transform-box: fill-box; transform-origin: 0 50%; }
@keyframes bpStechen { from { transform: rotate(-4deg) } to { transform: rotate(5deg) } }
.p-wurf .ba-hoch { animation: bpWurfArm .5s ease-out 1; transform-box: fill-box; transform-origin: 0 100%; }
@keyframes bpWurfArm { 0% { transform: rotate(-40deg) } 60% { transform: rotate(30deg) } 100% { transform: rotate(0) } }
.p-stolpern .f-ganz { transform: translate(-6%, 2%) rotate(-74deg); transform-origin: 20% 100%; transition: transform .7s cubic-bezier(.5,-.4,.6,1.4); }
.p-verbeugen .f-ganz { animation: bpVerbeugen 1.3s ease-in-out 1; }
@keyframes bpVerbeugen { 0%, 100% { transform: none } 40%, 60% { transform: rotate(8deg) translateY(2%) scaleY(.93) } }
.p-hops { animation: bpHops .42s ease-in-out 4 alternate; }
@keyframes bpHops { from { transform: translateY(0) } to { transform: translateY(-7%) } }
.bp-box.r-hops { animation: bpHops .38s ease-in-out 4 alternate; }
.bp-box.r-kopf { animation: bpKopf 1.8s ease-in-out 1; }
@keyframes bpKopf { 0%, 100% { transform: none } 30% { transform: rotate(-5deg) } 65% { transform: rotate(4deg) } }
.bp-box.r-zurueck { animation: bpZurueck 1.4s ease-in-out 1; }
@keyframes bpZurueck { 0%, 100% { transform: none } 25%, 70% { transform: translateX(5%) rotate(5deg) } }
.bp-box.r-schmelzen { animation: bpSchmelzen 1.4s ease-in-out 3 alternate; }
@keyframes bpSchmelzen { from { transform: rotate(-3deg) scale(1) } to { transform: rotate(3deg) scale(1.04) } }
.bp-box.r-ekstase { animation: bpEkstase .5s ease-in-out 6 alternate; }
@keyframes bpEkstase { 0% { transform: translateY(0) rotate(-4deg) scale(1) } 100% { transform: translateY(-9%) rotate(4deg) scale(1.07) } }
.bp-box.r-wedeln { animation: bpWedeln .16s ease-in-out 14 alternate; }
@keyframes bpWedeln { from { transform: rotate(-5deg) } to { transform: rotate(5deg) } }
.bp-box.r-lachen { animation: bpLachen .14s ease-in-out 16 alternate; }
@keyframes bpLachen { from { transform: translateY(0) } to { transform: translateY(-2.5%) scaleY(1.02) } }
.bp-box.r-wut { animation: bpWut .09s linear 14 alternate; filter: drop-shadow(0 0 16px rgba(220,48,42,.85)); }
@keyframes bpWut { from { transform: translateX(-1.5%) } to { transform: translateX(1.5%) } }
.bp-box.r-treffer { animation: bpTreffer .7s cubic-bezier(.2,.8,.4,1) 1; }
@keyframes bpTreffer { 0% { transform: none; filter: brightness(1) } 15% { transform: translateX(9%) rotate(6deg); filter: brightness(2.2) drop-shadow(0 0 20px var(--bp-psy)) } 100% { transform: none; filter: none } }
.bp-box.r-wanken { animation: bpWanken 1.6s ease-in-out 1; }
@keyframes bpWanken { 0%, 100% { transform: none } 20% { transform: rotate(9deg) translateX(4%) } 45% { transform: rotate(-6deg) } 70% { transform: rotate(4deg) } }
.bp-box.r-knien { animation: bpKnien .8s ease-out 1 forwards; }
@keyframes bpKnien { to { transform: translateY(4%) scaleY(.84) rotate(4deg); filter: saturate(.55) brightness(.85) } }
.bp-box.r-zusammenbruch { animation: bpZusammen 1s cubic-bezier(.5,0,.6,1.4) 1 forwards; }
@keyframes bpZusammen { 20% { transform: translateX(6%) rotate(6deg); filter: brightness(2) drop-shadow(0 0 24px var(--bp-psy)) } to { transform: translateY(8%) scaleY(.68) skewX(-6deg) rotate(9deg); filter: grayscale(.6) brightness(.75) } }
.bp-box.r-flucht { animation: bpFlucht 1.1s ease-in 1 forwards; }
@keyframes bpFlucht { 0% { transform: none } 20% { transform: translateY(-6%) } 100% { transform: translateX(160%) rotate(14deg); opacity: 0 } }
.bp-box.r-auftritt { animation: bpAuftritt .9s cubic-bezier(.2,.9,.3,1.2) 1; }
@keyframes bpAuftritt { from { transform: translateX(150%); opacity: 0 } to { transform: none; opacity: 1 } }
.bp-box.r-psy { filter: drop-shadow(0 0 14px var(--bp-psy)); }
/* Spiegel und Steckbrief */
.bp-spiegel { width: 100%; height: 100%; position: relative; }
.bp-spiegel .rahmen { position: absolute; left: 6%; right: 6%; top: 0; height: 80%; border-radius: 50% / 46%; padding: 7%; background: radial-gradient(circle at 30% 25%, #ffe9a8, #c9a043 45%, #7a5a1e); box-shadow: 0 10px 18px rgba(0,0,0,.55), inset 0 0 0 3px #5a4012; }
.bp-spiegel .glas { width: 100%; height: 100%; border-radius: 50% / 46%; overflow: hidden; background: radial-gradient(circle at 40% 30%, #4a3a44, #1e161c); position: relative; box-shadow: inset 0 0 18px rgba(0,0,0,.7); }
.bp-spiegel .glas img { width: 100%; height: 100%; object-fit: cover; object-position: 50% 8%; transform: scaleX(-1); }
.bp-spiegel .glas::after { content: ""; position: absolute; inset: 0; background: linear-gradient(125deg, rgba(255,255,255,.28) 0 18%, transparent 30% 60%, rgba(255,255,255,.12) 70%, transparent 80%); }
.bp-spiegel .fuss { position: absolute; left: 22%; right: 22%; bottom: 0; height: 22%; background: linear-gradient(90deg, transparent 44%, #7a5a1e 44% 56%, transparent 56%), linear-gradient(transparent 80%, #5a4012 80%); }
.bp-steckbrief { width: 100%; height: 100%; position: relative; }
.bp-steckbrief .pfahl { position: absolute; left: 46%; width: 8%; top: 30%; bottom: 0; background: linear-gradient(90deg, #3a2412, #6a4424, #3a2412); }
.bp-steckbrief .blatt { position: absolute; left: 4%; right: 4%; top: 0; height: 78%; background: linear-gradient(170deg, #ecdcae, #cdb27a); box-shadow: 0 10px 18px rgba(0,0,0,.55); transform: rotate(-2deg); display: grid; grid-template-rows: auto 1fr auto; padding: 5% 6%; gap: 3%; color: #3a1a12; text-align: center; font-family: var(--display); }
.bp-steckbrief .kopfz { font-size: clamp(11px, 1.3em, 40px); letter-spacing: .08em; color: #7a1d16; }
.bp-steckbrief img { width: 100%; height: 100%; object-fit: cover; min-height: 0; filter: sepia(.35) contrast(1.05); border: 2px solid #5a3a22; }
.bp-steckbrief .name { font-size: clamp(11px, .9em, 28px); }
.bp-steckbrief .nagel { position: absolute; top: 1.5%; left: 50%; width: 10px; height: 10px; margin-left: -5px; border-radius: 50%; background: #3a2a1a; }
/* Selbstwert-Leiste über dem Gegner */
.bp-sw { position: absolute; z-index: 4; display: grid; gap: 2px; justify-items: center; pointer-events: none; transform: translateX(-50%); font-size: .7rem; color: var(--vellum); text-shadow: 0 1px 2px #000; white-space: nowrap; transition: opacity .3s; }
.bp-sw[hidden] { display: none; }
.bp-sw-bar { width: var(--bw, 120px); height: 9px; border-radius: 9px; background: rgba(10,6,10,.75); border: 1px solid rgba(178,95,208,.6); overflow: hidden; }
.bp-sw-bar i { display: block; height: 100%; width: var(--q, 100%); background: linear-gradient(90deg, #8a3ab0, #d47ae8); transition: width .8s cubic-bezier(.3,1,.4,1); }
/* Publikum */
.bp-publikum { position: absolute; left: 0; right: 0; bottom: 0; z-index: 6; height: var(--ph, 16%); pointer-events: none; }
.bp-publikum svg { width: 100%; height: 100%; display: block; }
.bp-gast-i, .bp-gkopf, .bp-krug { transform-box: fill-box; }
.bp-gast-i { transform-origin: 50% 100%; }
.bp-publikum.jubel .bp-gast-i { animation: bpGastHops .3s ease-in-out var(--d) 6 alternate; }
.bp-publikum.toben .bp-gast-i { animation: bpGastHops .24s ease-in-out var(--d) 14 alternate; }
.bp-publikum.klatschen .bp-gast-i { animation: bpGastHops .2s ease-in-out var(--d) 4 alternate; }
@keyframes bpGastHops { from { transform: translateY(0) } to { transform: translateY(-14px) } }
.bp-publikum:is(.jubel, .toben) .bp-krug { transform-origin: 0 100%; animation: bpKrug .3s ease-in-out 6 alternate; }
@keyframes bpKrug { from { transform: rotate(0) } to { transform: rotate(-16deg) } }
.bp-publikum.buh .bp-gkopf { transform-origin: 50% 100%; animation: bpBuh .16s ease-in-out var(--d) 10 alternate; }
@keyframes bpBuh { from { transform: rotate(-9deg) } to { transform: rotate(9deg) } }
.bp-publikum.lachen .bp-gast-i { animation: bpGastLachen .12s ease-in-out var(--d) 18 alternate; }
@keyframes bpGastLachen { from { transform: translateY(0) } to { transform: translateY(-5px) rotate(2deg) } }
.bp-publikum.oh .bp-gast-i { animation: bpGastOh 1.2s ease-out 1; }
@keyframes bpGastOh { 30% { transform: translateY(-6px) scaleY(1.04) } }
/* W20 */
.bp-w20 { position: absolute; left: 0; top: 0; z-index: 8; width: var(--ws, 100px); height: var(--ws, 100px); perspective: calc(var(--ws, 100px) * 5); cursor: pointer; will-change: transform; }
.bp-w20-k { position: absolute; left: 50%; top: 50%; width: 0; height: 0; transform-style: preserve-3d; }
.bp-fl { position: absolute; left: 0; top: 0; transform-origin: 0 0; backface-visibility: hidden; -webkit-backface-visibility: hidden; }
.bp-fl svg { width: 100%; height: 100%; display: block; overflow: visible; }
.bp-fl-f { fill: #5a3c1a; stroke: #ffd27a; stroke-width: 2.4; stroke-linejoin: round; }
.bp-fl-i { fill: #6e4a20; opacity: .55; }
.bp-fl-z { font-family: var(--display); font-size: 30px; font-weight: 700; fill: #ffe7a8; text-anchor: middle; paint-order: stroke; stroke: #2a1808; stroke-width: 3px; }
.bp-fl-zs { fill: #ffe7a8; }
.bp-fl-riss { fill: none; stroke: #1a0806; stroke-width: 3; stroke-linecap: round; stroke-linejoin: round; display: none; }
.bp-fl-s { fill: #000; opacity: .3; pointer-events: none; }
.bp.spott .bp-fl-f { fill: #5a1612; stroke: #ff9a7a; }
.bp.spott .bp-fl-i { fill: #7a221c; }
.bp.spott .bp-fl-z { fill: #fff0e0; }
.bp-fl.treffer .bp-fl-z { fill: #fff; }
.bp-w20.krit .bp-fl.treffer .bp-fl-z { fill: #fff6c8; stroke: #a86a10; }
.bp-w20.patzer .bp-fl.treffer .bp-fl-riss { display: inline; }
.bp-w20.patzer .bp-fl.treffer .bp-fl-f { fill: #3a0a08; }
.bp-w20-schatten { position: absolute; left: 0; top: 0; z-index: 7; width: var(--ws, 100px); height: calc(var(--ws, 100px) * .26); margin-left: calc(var(--ws, 100px) * -.5); margin-top: calc(var(--ws, 100px) * -.13); border-radius: 50%; background: radial-gradient(closest-side, rgba(0,0,0,.6), transparent); pointer-events: none; }
.bp-w20-halo { position: absolute; left: 0; top: 0; z-index: 7; width: calc(var(--ws, 100px) * 2.2); height: calc(var(--ws, 100px) * 2.2); margin: calc(var(--ws, 100px) * -1.1) 0 0 calc(var(--ws, 100px) * -1.1); border-radius: 50%; pointer-events: none; opacity: 0; transition: opacity .4s; background: radial-gradient(closest-side, rgba(255,210,122,.5), rgba(255,170,60,.12) 60%, transparent); }
.bp-w20-halo.ruhe { opacity: .45; animation: bpAtmen 2.4s ease-in-out infinite alternate; }
.bp-w20-halo.krit { opacity: 1; animation: bpAtmen .5s ease-in-out infinite alternate; background: radial-gradient(closest-side, rgba(255,236,170,.9), rgba(255,190,70,.35) 55%, transparent); }
.bp-w20-halo.patzer { opacity: 1; background: radial-gradient(closest-side, rgba(220,48,42,.7), rgba(150,20,20,.2) 60%, transparent); }
@keyframes bpAtmen { from { transform: scale(.9) } to { transform: scale(1.08) } }
/* Sprechblase */
.bp-blase { position: absolute; left: 0; top: 0; z-index: 10; box-sizing: border-box; width: max-content; padding: .45em .8em .5em; background: #f8eed8; color: #2a1c12; border: 3px solid #2a1c12; border-radius: 1.1em;
  box-shadow: 0 5px 0 rgba(0,0,0,.28), 0 14px 28px rgba(0,0,0,.45); font-family: var(--hand); line-height: 1.16; opacity: 0; transform: scale(.75); transform-origin: var(--ox, 0) var(--oy, 100%); transition: opacity .25s, transform .35s cubic-bezier(.3,1.6,.5,1); pointer-events: none; }
.bp-blase.da { opacity: 1; transform: none; pointer-events: auto; }
.bp.spott .bp-blase { background: #f6e4d4; border-color: #6a1410; }
.bp-blase::before, .bp-blase::after { content: ""; position: absolute; width: 0; height: 0; border-style: solid; }
.bp-blase.z-links::before { left: -22px; top: var(--zy, 30px); border-width: 10px 22px 10px 0; border-color: transparent #2a1c12 transparent transparent; }
.bp-blase.z-links::after { left: -16px; top: calc(var(--zy, 30px) + 3px); border-width: 7px 17px 7px 0; border-color: transparent #f8eed8 transparent transparent; }
.bp-blase.z-unten::before { top: 100%; left: var(--zx, 30px); border-width: 22px 10px 0 10px; border-color: #2a1c12 transparent transparent transparent; }
.bp-blase.z-unten::after { top: calc(100% - 1px); left: calc(var(--zx, 30px) + 3px); border-width: 17px 7px 0 7px; border-color: #f8eed8 transparent transparent transparent; }
.bp.spott .bp-blase.z-links::before { border-right-color: #6a1410; } .bp.spott .bp-blase.z-links::after { border-right-color: #f6e4d4; }
.bp.spott .bp-blase.z-unten::before { border-top-color: #6a1410; } .bp.spott .bp-blase.z-unten::after { border-top-color: #f6e4d4; }
.bp-vers { overflow-wrap: break-word; }
.bp-vers .zl { display: block; }
.bp-vers .lz { display: block; height: .45em; }
.bp-vers .w { visibility: hidden; display: inline-block; }
.bp-vers .w.da { visibility: visible; animation: bpWort .22s ease-out; }
.bp-vers .nm { color: #8a1d16; font-weight: 700; }
.bp.spott .bp-vers .nm { color: #6a1410; }
@keyframes bpWort { from { transform: translateY(.25em) scale(.8); opacity: 0 } }
.bp-blase.denkt .bp-vers { letter-spacing: .2em; font-size: 1.6em !important; }
/* Stempel, Zeile, Effekte */
.bp-stempel { position: absolute; left: 0; top: 0; z-index: 11; margin: 0; font-family: var(--display); font-size: var(--sf, 2rem); line-height: 1; white-space: nowrap; color: var(--bp-gold); pointer-events: none;
  text-shadow: 0 3px 0 #2a1a0e, 0 0 20px rgba(255,180,80,.65); transform: translate(-50%, -50%) rotate(-6deg) scale(0); opacity: 0; }
.bp-stempel.da { animation: bpStempel .55s cubic-bezier(.3,1.7,.5,1) forwards; }
.bp-stempel.weg { animation: bpStempelWeg .5s ease-in forwards; }
.bp-stempel.patzer { color: #ff7a6a; text-shadow: 0 3px 0 #2a0a08, 0 0 20px rgba(220,48,42,.7); }
.bp-stempel.krit { color: #fff2c0; font-size: calc(var(--sf, 2rem) * 1.25); text-shadow: 0 3px 0 #6a3a08, 0 0 28px rgba(255,210,122,1), 0 0 60px rgba(255,170,60,.8); }
.bp-stempel.schwach, .bp-stempel.maessig { color: var(--vellum); }
@keyframes bpStempel { to { transform: translate(-50%, -50%) rotate(-6deg) scale(1); opacity: 1 } }
@keyframes bpStempelWeg { from { transform: translate(-50%, -50%) rotate(-6deg) scale(1); opacity: 1 } to { transform: translate(-50%, -90%) rotate(-6deg) scale(.7); opacity: 0 } }
.bp-zeile { position: absolute; z-index: 12; left: 50%; bottom: .5rem; transform: translateX(-50%); margin: 0; width: max-content; max-width: calc(100% - 1rem); padding: .35rem .8rem; border-radius: 6px; background: rgba(10,6,10,.78); border: 1px solid rgba(224,160,70,.3); color: var(--vellum); font-size: .84rem; line-height: 1.3; text-align: center; font-style: italic; opacity: 0; transition: opacity .4s; pointer-events: none; }
.bp-zeile.da { opacity: 1; }
.bp-zeile b { font-style: normal; color: var(--bp-gold); font-weight: 600; }
.bp-zeile b.psy { color: #e0a0f0; }
.bp-fx { position: absolute; inset: 0; z-index: 9; pointer-events: none; overflow: hidden; }
.bp-fx > * { position: absolute; left: 0; top: 0; line-height: 1; font-style: normal; }
.fx-schweb { animation: bpSteigen 1.8s ease-out var(--d, 0s) 1 forwards; opacity: 0; }
@keyframes bpSteigen { 0% { transform: translate(-50%, 0) scale(.4); opacity: 0 } 18% { transform: translate(-50%, -10px) scale(1.1); opacity: 1 } 100% { transform: translate(calc(-50% + var(--x, 0px)), -90px) scale(.9); opacity: 0 } }
.fx-bleib { transform: translate(-50%, -50%); animation: bpPop .4s cubic-bezier(.3,1.7,.5,1) var(--d, 0s) both; }
@keyframes bpPop { from { transform: translate(-50%, -50%) scale(0); opacity: 0 } }
.fx-wipp { animation: bpPop .4s cubic-bezier(.3,1.7,.5,1) var(--d, 0s) both, bpWipp .5s ease-in-out .4s infinite alternate; transform: translate(-50%, -50%); }
@keyframes bpWipp { from { transform: translate(-50%, -50%) rotate(-8deg) } to { transform: translate(-50%, -62%) rotate(8deg) } }
.fx-roete { width: var(--g, 20px); height: calc(var(--g, 20px) * .55); border-radius: 50%; background: radial-gradient(closest-side, rgba(255,90,100,.7), rgba(255,90,100,0)); transform: translate(-50%, -50%); animation: bpPop .6s ease-out both; }
.fx-traene { width: var(--g, 8px); height: var(--g, 8px); background: #f2f6f2; border: 1px solid #a9bdb4; border-radius: 0 50% 50% 50%; transform: rotate(45deg); animation: bpTropfen 1.1s ease-in var(--d, 0s) infinite; opacity: 0; }
@keyframes bpTropfen { 0% { transform: translate(0, 0) rotate(45deg); opacity: 0 } 15% { opacity: 1 } 100% { transform: translate(var(--x, 0px), 60px) rotate(45deg); opacity: 0 } }
.fx-ring { width: var(--g, 60px); height: var(--g, 60px); margin: calc(var(--g, 60px) * -.5) 0 0 calc(var(--g, 60px) * -.5); border-radius: 50%; border: 3px solid var(--bp-psy); box-shadow: 0 0 14px var(--bp-psy), inset 0 0 14px var(--bp-psy); animation: bpRing 1s ease-out var(--d, 0s) both; }
@keyframes bpRing { from { transform: scale(.2); opacity: 1 } to { transform: scale(2.2); opacity: 0 } }
.fx-text { font-family: var(--display); font-weight: 700; color: var(--bp-gold); text-shadow: 0 2px 0 #2a1a0e, 0 0 10px rgba(0,0,0,.6); white-space: nowrap; }
.fx-schaden { font-family: var(--display); font-weight: 700; color: #f0c0ff; text-shadow: 0 3px 0 #2a0a3a, 0 0 18px var(--bp-psy); white-space: nowrap; text-align: center; animation: bpSchaden 2.2s cubic-bezier(.2,.9,.3,1) 1 forwards; }
.fx-schaden small { display: block; font-size: .32em; letter-spacing: .08em; color: #e8d0f0; }
.fx-schaden.krit { color: #fff2c0; text-shadow: 0 3px 0 #6a3a08, 0 0 22px #ffb35a; }
@keyframes bpSchaden { 0% { transform: translate(-50%, -50%) scale(.3); opacity: 0 } 12% { transform: translate(-50%, -70%) scale(1.25); opacity: 1 } 25% { transform: translate(-50%, -70%) scale(1) } 80% { opacity: 1 } 100% { transform: translate(-50%, -160%) scale(.95); opacity: 0 } }
.fx-flug { transform: translate(-50%, -50%); }
.bp-blitz { position: absolute; inset: 0; z-index: 13; pointer-events: none; opacity: 0; background: radial-gradient(circle at var(--bx, 50%) var(--by, 60%), rgba(255,240,200,.9), rgba(255,200,120,.35) 40%, transparent 75%); }
.bp-blitz.an { animation: bpBlitz .9s ease-out 1; }
.bp-blitz.rot { background: radial-gradient(circle at var(--bx, 50%) var(--by, 60%), rgba(220,48,42,.6), rgba(120,10,10,.3) 45%, transparent 80%); }
@keyframes bpBlitz { 0% { opacity: 0 } 12% { opacity: 1 } 100% { opacity: 0 } }
.bp-toast { position: absolute; z-index: 14; right: .6rem; bottom: 22%; transform: translateX(130%); margin: 0; padding: .4rem .9rem; border-radius: 999px; background: #f1e7cf; color: #2a1c12; border: 2px solid var(--bp-gold); font-size: .86rem; font-weight: 600; box-shadow: 0 6px 18px rgba(0,0,0,.5); transition: transform .45s cubic-bezier(.3,1.5,.5,1); white-space: nowrap; pointer-events: none; }
.bp-toast.da { transform: none; }
@keyframes bpWackeln { 0%, 100% { transform: none } 20% { transform: translate(-6px, 2px) rotate(-.6deg) } 40% { transform: translate(5px, -2px) rotate(.5deg) } 60% { transform: translate(-4px, 1px) } 80% { transform: translate(3px, 0) } }
@keyframes bpPuls { 50% { box-shadow: 0 0 0 4px rgba(255,210,122,.35), 0 0 18px rgba(255,210,122,.6); } }

/* ---------- Versbuch ---------- */
.bp-buch { position: absolute; inset: 0; z-index: 30; display: flex; flex-direction: column; min-height: 0; background: linear-gradient(172deg, #f1e7cf, #dcc9a2); color: #2a2118; border: 1px solid #8a6a3a; border-radius: 6px; box-shadow: 0 20px 50px rgba(0,0,0,.6); animation: bpBuchAuf .35s cubic-bezier(.3,1.3,.5,1); }
.bp-buch[hidden] { display: none; }
@keyframes bpBuchAuf { from { transform: translateY(16px) scale(.97); opacity: 0 } }
.bp-buch-kopf { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: .3rem 1rem; padding: .8rem 1rem .6rem; border-bottom: 1px solid rgba(90,60,30,.3); }
.bp-buch-kopf h4 { margin: 0; font-family: var(--name); font-weight: 400; font-size: clamp(1.2rem, 2.4vw, 1.7rem); color: #1d1610; }
.bp-buch-zu { grid-row: 1 / span 2; grid-column: 2; align-self: start; min-width: 40px; min-height: 40px; border: 1px solid #8a6a3a; background: rgba(255,255,255,.35); color: #5a1a12; font: inherit; font-size: 1.2rem; border-radius: 6px; cursor: pointer; }
.bp-buch-rang { margin: 0; font-size: .82rem; color: #6a5236; }
.bp-buch-rang b { color: #7a1d16; }
.bp-balken { grid-column: 1 / -1; height: 10px; border-radius: 10px; background: rgba(90,60,30,.22); overflow: hidden; }
.bp-balken i { display: block; height: 100%; width: var(--q, 0%); background: linear-gradient(90deg, #c4822e, #e0a046, #9b3a2f); border-radius: 10px; }
.bp-buch-tabs { display: flex; gap: .4rem; padding: .5rem 1rem 0; flex-wrap: wrap; }
.bp-buch-tabs button { border: 1px solid #8a6a3a; background: transparent; color: #4a3622; font: inherit; font-size: .88rem; padding: .3rem .8rem; min-height: 36px; border-radius: 999px; cursor: pointer; }
.bp-buch-tabs button[aria-selected="true"] { background: #5a1a12; color: #f3e6cf; border-color: #5a1a12; }
.bp-buch-liste { flex: 1; min-height: 0; overflow-y: auto; padding: .4rem 1rem 1rem; overscroll-behavior: contain; columns: var(--sp, 1); column-gap: 2rem; }
.bp-buch-liste h5 { margin: .9rem 0 .35rem; font-family: var(--display); font-size: .92rem; letter-spacing: .04em; color: #7a1d16; break-after: avoid; }
.bp-buch-liste h5 small { color: #6a5236; font-family: var(--body); font-size: .78rem; letter-spacing: 0; }
.bp-bv { margin: 0 0 .5rem; padding: .35rem .55rem; border-left: 3px solid #c4822e; background: rgba(255,255,255,.28); font-family: var(--hand); font-size: 1.12rem; line-height: 1.2; white-space: pre-line; break-inside: avoid; }
.bp-bv i { font-style: normal; color: #7a1d16; border-bottom: 1px dashed #7a1d16; }
.bp-bv.zu { border-left-color: rgba(90,60,30,.3); background: rgba(90,60,30,.07); display: grid; gap: 5px; padding: .5rem .55rem; }
.bp-bv.zu span { display: block; height: 7px; border-radius: 4px; background: rgba(90,60,30,.18); }
.bp-bv.zu em { font-family: var(--body); font-size: .72rem; color: #8a7458; font-style: italic; }
.bp-bv.frisch { border-left-color: #7a1d16; box-shadow: inset 0 0 0 1px rgba(122,29,22,.3); }

@media (prefers-reduced-motion: reduce) {
  .bp-buehne *, .bp-buehne *::before, .bp-buehne *::after { animation-duration: .01ms !important; animation-iteration-count: 1 !important; transition-duration: .01ms !important; }
  .bp-p { display: none; }
}
`;
  document.head.appendChild(css);

  /* =====================================================================
     AUFBAU DER KARTE
     ===================================================================== */
  const W20_ICON = '<svg viewBox="0 0 100 100" aria-hidden="true"><polygon points="50,4 91,27 91,73 50,96 9,73 9,27" fill="none" stroke="currentColor" stroke-width="6" stroke-linejoin="round"/><path d="M50,24 L76,68 L24,68 Z M50,4 L50,24 M9,27 L50,24 L91,27 M9,27 L24,68 L9,73 M91,27 L76,68 L91,73 M24,68 L50,96 L76,68" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linejoin="round" opacity=".75"/></svg>';
  root.classList.add("bp");
  root.innerHTML =
    '<div class="bp-spiel breit">' +
      '<div class="bp-kopf"><div class="bp-modus" role="tablist"></div><p class="label bp-label"></p><h3 class="bp-titel"></h3><p class="bp-info"></p></div>' +
      '<div class="bp-buehne"><div class="bp-welt">' +
        '<svg class="bp-kulisse" viewBox="0 0 800 450" preserveAspectRatio="xMidYMax slice" aria-hidden="true"></svg>' +
        '<div class="bp-partikel"></div><div class="bp-spot"></div>' +
        '<div class="bp-box bp-barradin"></div><div class="bp-box bp-ziel"></div>' +
        '<div class="bp-sw" hidden><span class="bp-sw-txt"></span><span class="bp-sw-bar"><i></i></span></div>' +
        '<div class="bp-publikum"></div>' +
        '<div class="bp-w20-halo ruhe"></div><div class="bp-w20-schatten"></div><div class="bp-w20" aria-hidden="true"></div>' +
        '<div class="bp-fx"></div>' +
        '<div class="bp-blase" aria-hidden="true"><div class="bp-vers"></div></div>' +
        '<p class="bp-stempel"></p>' +
        '<p class="bp-zeile" aria-live="polite"></p><p class="bp-ort"></p><div class="bp-blitz"></div><p class="bp-toast" role="status"></p>' +
      '</div></div>' +
      '<div class="bp-panel">' +
        '<p class="bp-wahl-label"></p><div class="bp-wahl" role="radiogroup"></div>' +
        '<input type="text" class="bp-name" maxlength="30" autocomplete="off" hidden>' +
        '<div class="bp-ergebnis" aria-live="polite"><b class="bp-erg-titel"></b><span class="bp-erg-rechnung"></span></div>' +
        '<p class="bp-insp" hidden></p><ol class="bp-verlauf" aria-label="Verlauf"></ol>' +
        '<div class="bp-fuss"><button type="button" class="bp-los">' + W20_ICON + '<span></span></button>' +
          '<div class="bp-neben"><button type="button" class="bp-buch-knopf"><span aria-hidden="true">📖</span><span class="bp-bt"></span><span class="bp-bz"></span></button><button type="button" class="bp-kulisse-knopf"><span aria-hidden="true">🎭</span></button></div>' +
          '<p class="bp-stats"></p></div>' +
      '</div>' +
      '<div class="bp-buch" hidden role="dialog" aria-modal="false"></div>' +
    '</div>';
  const $ = s => root.querySelector(s);
  const spiel = $(".bp-spiel"), buehne = $(".bp-buehne"), welt = $(".bp-welt"), kulisseEl = $(".bp-kulisse"), partikelEl = $(".bp-partikel"), spotEl = $(".bp-spot");
  const barradinBox = $(".bp-barradin"), zielBox = $(".bp-ziel"), swEl = $(".bp-sw"), publikumEl = $(".bp-publikum");
  const w20El = $(".bp-w20"), haloEl = $(".bp-w20-halo"), schattenEl = $(".bp-w20-schatten"), fxEl = $(".bp-fx"), blase = $(".bp-blase"), versEl = $(".bp-vers");
  const stempelEl = $(".bp-stempel"), zeileEl = $(".bp-zeile"), ortEl = $(".bp-ort"), blitzEl = $(".bp-blitz"), toastEl = $(".bp-toast");
  const modusEl = $(".bp-modus"), wahlEl = $(".bp-wahl"), nameEl = $(".bp-name"), losEl = $(".bp-los"), buchKnopf = $(".bp-buch-knopf"), kulisseKnopf = $(".bp-kulisse-knopf"), buchEl = $(".bp-buch");
  barradinBox.innerHTML = barradinSVG();
  const barradin = barradinBox.firstElementChild;
  /* gemeinsames Muster für Imres Glitzerhose (Rosa, Gold, Silber – kein Blau) */
  const defs = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  defs.setAttribute("width", "0"); defs.setAttribute("height", "0"); defs.setAttribute("aria-hidden", "true"); defs.style.position = "absolute";
  defs.innerHTML = '<defs><pattern id="bpGlitzer" width="7" height="7" patternUnits="userSpaceOnUse"><rect width="7" height="7" fill="#b0889a"/><circle cx="1.8" cy="1.8" r="1.6" fill="#fff4dc"/><circle cx="5.2" cy="5.2" r="1.6" fill="#ffd27a"/><circle cx="5.2" cy="1.8" r="1.3" fill="#f0a0c0"/><circle cx="1.8" cy="5.2" r="1.3" fill="#e8e0e8"/></pattern></defs>';
  root.appendChild(defs);
  wuerfelBauen(w20El);

  /* ---------- Zustand ---------- */
  let modus = lies("imres-probe-modus", "lob") === "spott" ? "spott" : "lob";
  const zielWahl = { lob: LOB_ZIELE[0], spott: null };
  let ziel = LOB_ZIELE[0], eigenerName = "", gastLook = gastFigur();
  let zustand = "ruhe"; /* ruhe | rollt | singt | fertig */
  let wurfDaten = null, zielInfo = null, zielSvg = null;
  let ort = zufall(["taverne", "taverne", "markt", "halle"]), zeit = zeitJetzt();
  const swStand = {}; /* Selbstwert der Gegner in dieser Sitzung */
  let L = { W: 0, H: 0, hoch: false }; /* aktuelle Bühnenmaße */
  let wuerfelM = W20.ziel(20, .32, -.08), wuerfelPos = { x: 0, y: 0 };
  let ersterWurf = false, buchKap = "lob", buchOffen = false;
  try { const w = JSON.parse(lies("imres-probe-wahl", "{}")); if (w && typeof w === "object") { if (typeof w.lob === "string") zielWahl.lob = w.lob; if (typeof w.spott === "string") zielWahl.spott = w.spott; } } catch (_) {}

  /* Zeitplan, damit sich alles vorspulen lässt */
  let plaene = [];
  function plan(fn, ms) {
    const p = { fn, due: performance.now() + ms };
    p.id = setTimeout(() => { plaene = plaene.filter(x => x !== p); fn(); }, ms);
    plaene.push(p);
  }
  function planLeeren() { plaene.forEach(p => clearTimeout(p.id)); plaene = []; }
  /* Vorspulen: Würfel sofort landen lassen und den Vers ganz zeigen – bis zur Reaktion */
  function vorspulen() {
    if (wurfAnim) wurfAnim.ende();
    for (let i = 0; i < 6 && (zustand === "rollt" || zustand === "singt") && plaene.length; i++) {
      const rest = plaene.slice().sort((a, b) => a.due - b.due);
      planLeeren();
      rest.forEach(p => p.fn());
    }
  }

  /* ---------- Texte setzen ---------- */
  function zielName() { return ziel === "*" ? (eigenerName.trim() || t().du) : ziel; }
  function texteSetzen() {
    const T = t(), lob = modus === "lob";
    root.classList.toggle("spott", !lob);
    modusEl.innerHTML = ["lob", "spott"].map(m => '<button type="button" role="tab" data-modus="' + m + '" aria-selected="' + (modus === m) + '">' + esc(m === "lob" ? T.modusLob : T.modusSpott) + "</button>").join("");
    $(".bp-label").textContent = lob ? T.lobLabel : T.spottLabel;
    $(".bp-titel").textContent = lob ? T.lobTitel : T.spottTitel;
    $(".bp-info").textContent = lob ? T.lobText : T.spottText;
    $(".bp-wahl-label").textContent = lob ? T.lobZiel : T.spottZiel;
    wahlEl.setAttribute("aria-label", lob ? T.lobZiel : T.spottZiel);
    nameEl.placeholder = T.namePlatz;
    $(".bp-bt").textContent = T.buch;
    kulisseKnopf.setAttribute("aria-label", T.kulisse); kulisseKnopf.title = T.kulisse;
    knopfText();
    zieleZeichnen();
    statsZeigen();
    inspZeigen();
    ortZeigen();
    verlaufZeigen();
    if (!wurfDaten) { $(".bp-erg-titel").textContent = T.tipp; $(".bp-erg-titel").className = "bp-erg-titel"; $(".bp-erg-rechnung").textContent = "+" + BONUS + " " + T.auftreten; }
    else ergebnisZeigen();
  }
  function knopfText() {
    const T = t(), sp = losEl.querySelector("span");
    const laeuft = zustand === "rollt" || zustand === "singt";
    losEl.classList.toggle("weiter", laeuft);
    sp.textContent = laeuft ? T.weiter + " ⏩" : wurfDaten ? T.nochmal : T.werfen;
  }
  function avatar(n) {
    const k = schluessel(n);
    if (modus === "lob") {
      if (BILDER[k]) return '<img class="bp-av" src="' + BILDER[k].bild + '" alt="" loading="lazy">';
      if (k === "barradin") return '<img class="bp-av" src="barradin-frei.webp" alt="" loading="lazy">';
      if (k === "imre") return '<span class="bp-av">🎲</span>';
    } else {
      const mk = monsterKey(n), M = mk && MONSTER[mk];
      if (M && M.bild) return '<img class="bp-av" src="' + M.bild + '" alt="" loading="lazy">';
      if (M && M.steckbrief) return '<img class="bp-av" src="' + M.steckbrief + '" alt="" loading="lazy">';
      if (M && M.figur) return '<span class="bp-av">🧙</span>';
      const b = bestien().find(x => x.name === n); if (b) return '<img class="bp-av" src="' + esc(b.bild) + '" alt="" loading="lazy">';
    }
    return '<span class="bp-av">✒️</span>';
  }
  function zieleZeichnen() {
    const liste = modus === "lob" ? LOB_ZIELE : spottZiele();
    if (ziel !== "*" && !liste.includes(ziel)) ziel = liste[0];
    wahlEl.innerHTML = liste.map(n => '<button type="button" role="radio" data-ziel="' + esc(n) + '" aria-checked="' + (ziel === n) + '">' + avatar(n) + "<span>" + esc(n) + "</span></button>").join("") +
      '<button type="button" role="radio" data-ziel="*" aria-checked="' + (ziel === "*") + '"><span class="bp-av">✒️</span><span>' + esc(t().andere) + "</span></button>";
    nameEl.hidden = ziel !== "*";
    const akt = wahlEl.querySelector('[aria-checked="true"]');
    if (akt && spiel.classList.contains("schmal")) { const l = akt.offsetLeft - wahlEl.offsetLeft; if (l < wahlEl.scrollLeft || l + akt.offsetWidth > wahlEl.scrollLeft + wahlEl.clientWidth) wahlEl.scrollLeft = l - 8; }
  }
  function statsZeigen() {
    const T = t(), f = fortschritt(), v = Object.values(stand.vertrieben).reduce((a, b) => a + (+b || 0), 0);
    $(".bp-bz").textContent = f.n + "/" + f.g;
    buchKnopf.setAttribute("aria-label", T.buch + " " + f.n + "/" + f.g);
    $(".bp-stats").textContent = "💰 " + stand.gold + " · 🎲 " + T.wuerfe + ": " + stand.wuerfe + (v ? " · ☠ " + v + " " + T.vertrieben : "") + " · " + T.rang + ": " + rangName();
  }
  function inspZeigen() {
    const el = $(".bp-insp"), an = lies("imres-inspiration", "0") === "1";
    el.hidden = !an; el.textContent = t().inspBereit;
  }
  function ortZeigen() { ortEl.textContent = "📍 " + t().orte[ort] + " · " + t().zeiten[zeit]; }
  function ergebnisZeigen() {
    const T = t(), w = wurfDaten; if (!w) return;
    const titel = $(".bp-erg-titel");
    titel.textContent = w.modus === "spott" && w.stufe === "patzer" ? T.eigentor : T.stufen[w.stufe];
    titel.className = "bp-erg-titel " + w.stufe;
    $(".bp-erg-rechnung").textContent = "W20 " + w.wurf + " + " + BONUS + " " + T.auftreten + (w.insp ? " + " + w.insp + " " + T.inspiration : "") + " = " + w.summe;
  }

  /* ---------- Kulisse ---------- */
  function kulisseBauen() {
    const f = { taverne: taverneSVG, markt: marktSVG, hoehle: hoehleSVG, halle: halleSVG }[ort] || taverneSVG;
    kulisseEl.innerHTML = f(zeit);
    partikelEl.innerHTML = partikel(ort, zeit);
    publikumEl.innerHTML = publikumSVG();
    ortZeigen();
  }
  function kulisseWechseln() {
    const orte = ["taverne", "markt", "hoehle", "halle"].filter(o => o !== ort);
    ort = zufall(modus === "spott" ? orte : orte.filter(o => o !== "hoehle").concat(orte.includes("hoehle") && Math.random() < .3 ? ["hoehle"] : []));
    zeit = zufall(ZEITEN);
    kulisseBauen();
    buehne.classList.remove("gespielt");
    welt.animate && !ruhig && welt.animate([{ opacity: .2 }, { opacity: 1 }], { duration: 450 });
  }

  /* ---------- Ziel auf die Bühne stellen ---------- */
  function zielAufbauen(auftritt) {
    const name = zielName();
    zielInfo = zielBeschreibung(modus, ziel, name);
    zielSvg = null;
    let html = "";
    if (zielInfo.art === "bild") html = '<img src="' + zielInfo.bild + '" alt="' + esc(name) + '" draggable="false">';
    else if (zielInfo.art === "figur") html = figurSVG(zielInfo.figur);
    else if (zielInfo.art === "spiegel") html = '<div class="bp-spiegel"><div class="rahmen"><div class="glas"><img src="barradin-frei.webp" alt="" draggable="false"></div></div><div class="fuss"></div></div>';
    else html = '<div class="bp-steckbrief"><div class="pfahl"></div><div class="blatt"><span class="kopfz">' + (sprache() === "en" ? "WANTED" : "GESUCHT") + '</span><img src="' + esc(zielInfo.bild) + '" alt="' + esc(name) + '" style="object-position:' + zielInfo.pos + '" draggable="false"><span class="name">' + esc(name) + '</span></div><span class="nagel"></span></div>';
    zielBox.innerHTML = html;
    zielBox.className = "bp-box bp-ziel";
    if (zielInfo.art === "figur") { zielSvg = zielBox.firstElementChild; ausdruck(zielSvg, "neutral"); }
    if (auftritt && !ruhig) { void zielBox.offsetWidth; zielBox.classList.add("r-auftritt"); }
    swZeigen();
    layout();
  }
  function swKey() { return modus === "spott" ? (ziel === "*" ? "gast:" + schluessel(zielName()) : zielInfo.key) : null; }
  function swZeigen() {
    const k = swKey();
    if (!k) { swEl.hidden = true; return; }
    const max = zielInfo.sw || 12;
    if (swStand[k] == null) swStand[k] = max;
    swEl.hidden = false;
    $(".bp-sw-txt").textContent = t().selbstwert + " " + Math.max(0, swStand[k]) + "/" + max;
    swEl.style.setProperty("--q", Math.max(0, swStand[k]) / max * 100 + "%");
  }

  /* =====================================================================
     MASSE – Karte füllt das Fenster, Bühne so groß wie möglich
     ===================================================================== */
  let randMesser = null;
  function untenFrei() {
    const nav = document.querySelector(".handyleiste");
    if (nav) { const cs = getComputedStyle(nav), r = nav.getBoundingClientRect(); if (cs.display !== "none" && cs.visibility !== "hidden" && cs.position === "fixed" && r.height > 0 && r.top < window.innerHeight) return r.top; }
    if (!randMesser) { randMesser = document.createElement("div"); randMesser.style.cssText = "position:fixed;left:0;bottom:0;width:0;height:0;padding-bottom:env(safe-area-inset-bottom,0px);visibility:hidden;pointer-events:none"; document.body.appendChild(randMesser); }
    return window.innerHeight - (parseFloat(getComputedStyle(randMesser).paddingBottom) || 0);
  }
  function kartenMasse() {
    const voll = root.classList.contains("tav-voll");
    const sichtbar = root.offsetParent !== null || voll;
    if (!sichtbar) return;
    let b, h;
    if (voll) { b = root.clientWidth; h = root.clientHeight; root.style.removeProperty("--bp-b"); root.style.removeProperty("--bp-h"); }
    else {
      const vw = document.documentElement.clientWidth, wrapW = root.parentElement ? root.parentElement.clientWidth : vw;
      const oben = root.getBoundingClientRect().top + window.pageYOffset;
      h = Math.max(240, Math.floor(untenFrei() - oben - 12));
      const rand = vw < 600 ? 10 : 24, maxW = vw - 2 * rand;
      b = Math.round(Math.max(Math.min(wrapW, maxW), Math.min(maxW, h * 2.1, 2600)));
      root.style.setProperty("--bp-b", b + "px"); root.style.setProperty("--bp-h", h + "px");
    }
    const breit = b >= 520 && b / h >= 1.22;
    spiel.classList.toggle("breit", breit); spiel.classList.toggle("schmal", !breit);
    const fs = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
    const pw = klemm(b * .27, 13.5 * fs, 26 * fs);
    spiel.style.setProperty("--pw", Math.round(pw) + "px");
    spiel.classList.toggle("eng", breit ? h < 600 : true);
    spiel.classList.toggle("sehr-eng", breit && h < 470);
  }
  function setzeBox(el, x, y, w, h) { el.style.left = x.toFixed(1) + "px"; el.style.top = y.toFixed(1) + "px"; el.style.width = w.toFixed(1) + "px"; el.style.height = h.toFixed(1) + "px"; }
  function layout() {
    const W = buehne.clientWidth, H = buehne.clientHeight;
    if (!W || !H) return;
    const hoch = W / H < 1.08;
    L = { W, H, hoch };
    const boden = hoch ? H * .93 : H * .9;
    /* Barradin links */
    const bh = hoch ? Math.min(H * .5, W * .44 / .625) : Math.min(H * .78, W * .3 / .625), bw = bh * .625;
    const bx = hoch ? Math.max(W * .02, W * .25 - bw / 2) : Math.max(W * .02, W * .17 - bw / 2);
    setzeBox(barradinBox, bx, boden - bh, bw, bh);
    L.b = { x: bx, y: boden - bh, w: bw, h: bh };
    /* Ziel rechts */
    const z = zielInfo || { a: .625, hoehe: .74 };
    let zh = (hoch ? H * .62 : H) * (z.hoehe || .74), maxW = hoch ? W * .5 : W * .38;
    if (zh * z.a > maxW) zh = maxW / z.a;
    const zw = zh * z.a, zcx = hoch ? W * .74 : W * .8;
    const zx = Math.min(W - zw - W * .01, zcx - zw / 2), zy = boden - zh - (z.schwebt || 0) * H;
    setzeBox(zielBox, zx, zy, zw, zh);
    L.z = { x: zx, y: zy, w: zw, h: zh };
    swEl.style.left = (zx + zw / 2) + "px"; swEl.style.top = Math.max(4, zy - 24) + "px";
    swEl.style.setProperty("--bw", klemm(zw * .7, 80, 200) + "px");
    /* Spot auf Barradin */
    spotEl.style.setProperty("--sx", ((bx + bw / 2) / W * 100).toFixed(1) + "%");
    spotEl.style.setProperty("--sw", klemm(bw / W * 140, 18, 60).toFixed(1) + "%");
    /* Publikum */
    publikumEl.style.setProperty("--ph", (hoch ? 11 : 14) + "%");
    /* Würfel */
    const D = Math.round(klemm(H * (hoch ? .12 : .17), 46, 190));
    if (D !== L.D) { welt.style.setProperty("--ws", D + "px"); wuerfelMasse(w20El, D); }
    L.D = D;
    L.ruhe = hoch ? { x: W * .5, y: boden - D * .3 } : { x: (bx + bw + zx) / 2 + W * .02, y: boden - D * .55 };
    if (!wurfAnim) { wuerfelPos = { x: L.ruhe.x, y: L.ruhe.y }; wuerfelSetzen(wuerfelPos.x, wuerfelPos.y, 0); wuerfelDrehen(w20El, wuerfelM); }
    stempelEl.style.setProperty("--sf", klemm(H * .085, 22, 80).toFixed(0) + "px");
    stempelEl.style.left = L.ruhe.x + "px"; stempelEl.style.top = Math.max(H * .12, L.ruhe.y - D * 1.25) + "px";
    blasePassen();
  }
  function wuerfelSetzen(x, y, hoeheUeberBoden) {
    const D = L.D || 100;
    w20El.style.transform = "translate(" + (x - D / 2).toFixed(1) + "px," + (y - D / 2).toFixed(1) + "px)";
    haloEl.style.transform = "translate(" + x.toFixed(1) + "px," + y.toFixed(1) + "px)";
    const s = klemm(1 - hoeheUeberBoden / (L.H * .5), .35, 1);
    schattenEl.style.transform = "translate(" + x.toFixed(1) + "px," + (L.ruhe ? L.ruhe.y + D * .46 : y + D * .46).toFixed(1) + "px) scale(" + s.toFixed(2) + ")";
    schattenEl.style.opacity = s.toFixed(2);
  }

  /* ---------- Sprechblase ---------- */
  function blasePassen() {
    if (!versEl.childNodes.length) return;
    const { W, H, hoch, b, z } = L;
    if (!W || !b) return;
    let links, oben, maxB, maxH;
    if (hoch) {
      links = W * .03; oben = H * .03; maxB = W * .94;
      maxH = Math.max(H * .3, b.y - oben - 26);
    } else {
      links = b.x + b.w * .82; oben = H * .04;
      maxB = Math.min(W * .64, z.x + z.w * .1 - links - 8);
      if (maxB < W * .3) maxB = W * .3;
      maxH = H * .62;
    }
    blase.style.left = links + "px"; blase.style.top = oben + "px"; blase.style.maxWidth = maxB + "px"; blase.style.maxHeight = "none";
    /* Schriftgröße suchen, bei der alles hineinpasst */
    let lo = 11, hi = Math.round(klemm(H * .056, 14, 44)), best = lo;
    while (lo <= hi) {
      const m = (lo + hi) >> 1;
      blase.style.fontSize = m + "px";
      if (blase.offsetHeight <= maxH && blase.scrollWidth <= maxB + 1) { best = m; lo = m + 1; } else hi = m - 1;
    }
    blase.style.fontSize = best + "px";
    blase.style.maxHeight = maxH + "px";
    blase.style.overflowY = blase.scrollHeight > maxH + 2 ? "auto" : "hidden";
    const bh = blase.offsetHeight, bw = blase.offsetWidth;
    const kopfY = b.y + b.h * .2, kopfX = b.x + b.w * .58;
    if (hoch) {
      blase.className = blase.className.replace(/\bz-\w+/g, "").trim() + " z-unten";
      blase.style.top = Math.max(4, Math.min(oben, b.y - bh - 24)) + "px";
      blase.style.setProperty("--zx", klemm(kopfX - links - 10, 16, bw - 40) + "px");
      blase.style.setProperty("--ox", klemm(kopfX - links, 0, bw) + "px"); blase.style.setProperty("--oy", "100%");
    } else {
      blase.className = blase.className.replace(/\bz-\w+/g, "").trim() + " z-links";
      const top = Math.max(4, Math.min(oben, kopfY - bh * .5));
      blase.style.top = top + "px";
      blase.style.setProperty("--zy", klemm(kopfY - top - 10, 12, bh - 34) + "px");
      blase.style.setProperty("--ox", "0px"); blase.style.setProperty("--oy", klemm(kopfY - top, 0, bh) + "px");
    }
  }
  function versSetzen(text, name) {
    const nm = String(name || "");
    const zeilen = String(text).split("\n");
    let html = "", n = 0;
    zeilen.forEach(z => {
      if (!z.trim()) { html += '<span class="lz"></span>'; return; }
      html += '<span class="zl">' + z.split(/\s+/).filter(Boolean).map(wort => {
        const istName = nm && nm.length > 1 && wort.replace(/[^\p{L}-]/gu, "").toLowerCase() === nm.replace(/[^\p{L}-]/gu, "").toLowerCase();
        n++;
        return '<span class="w' + (istName ? " nm" : "") + '">' + esc(wort) + "</span>";
      }).join(" ") + "</span>";
    });
    versEl.innerHTML = html;
    return n;
  }
  function blaseZeigen(an) { blase.classList.toggle("da", !!an); blase.setAttribute("aria-hidden", an ? "false" : "true"); }

  /* =====================================================================
     EFFEKTE
     ===================================================================== */
  function kopfPunkt() {
    const z = L.z, i = zielInfo || { kopf: [.5, .2] };
    return { x: z.x + z.w * i.kopf[0], y: z.y + z.h * i.kopf[1], g: Math.max(18, z.w * (i.kb || .25)) };
  }
  function fx(klasse, x, y, inhalt, stil) {
    const el = document.createElement("span");
    el.className = klasse;
    el.style.left = x.toFixed(1) + "px"; el.style.top = y.toFixed(1) + "px";
    if (stil) Object.keys(stil).forEach(k => el.style.setProperty(k, stil[k]));
    if (inhalt != null) el.innerHTML = inhalt;
    fxEl.appendChild(el);
    return el;
  }
  function fxWeg(el, ms) { setTimeout(() => el.remove(), ms); }
  function schwebt(zeichen, x, y, n, farbe, groesse) {
    for (let i = 0; i < n; i++) {
      const el = fx("fx-schweb", x + zz(-30, 30), y + zz(-10, 10), zufall([].concat(zeichen)), { "--d": (i * .16).toFixed(2) + "s", "--x": zz(-40, 40).toFixed(0) + "px" });
      el.style.color = farbe || "#e0284e"; el.style.fontSize = (groesse || 22) + "px";
      fxWeg(el, 2200 + i * 160);
    }
  }
  function zielEffekte(liste) {
    const k = kopfPunkt(), g = k.g;
    liste.forEach(art => {
      if (art === "herz") schwebt("♥", k.x, k.y - g * .3, 3, "#e0284e", g * .6);
      else if (art === "herzen") schwebt(["♥", "♥", "❤"], k.x, k.y - g * .3, 8, "#ff4a7a", g * .7);
      else if (art === "funkeln") schwebt(["✦", "✧", "★"], k.x, k.y, 7, "#ffd27a", g * .55);
      else if (art === "noten") schwebt(["♪", "♫"], k.x, k.y - g * .4, 3, "#ffd27a", g * .6);
      else if (art === "frage") { const el = fx("fx-text fx-wipp", k.x + g * .6, k.y - g * .9, "?", { "--d": "0s" }); el.style.fontSize = g * 1.1 + "px"; }
      else if (art === "wuff") { const el = fx("fx-text fx-wipp", k.x + g * .5, k.y - g * 1.1, sprache() === "en" ? "Woof!" : "Wuff!"); el.style.fontSize = g * .55 + "px"; }
      else if (art === "haha") { const el = fx("fx-text fx-wipp", k.x, k.y - g * 1.1, "HA HA!"); el.style.fontSize = g * .6 + "px"; el.style.color = "#ff9a7a"; }
      else if (art === "wut" && !zielSvg) { const el = fx("fx-bleib", k.x + g * .55, k.y - g * .55, "💢"); el.style.fontSize = g * .7 + "px"; }
      else if (art === "schweiss" && !zielSvg) { const el = fx("fx-traene", k.x + g * .6, k.y - g * .5, "", { "--g": g * .28 + "px", "--d": "0s" }); el.style.animationIterationCount = "3"; }
      else if (art === "roete" && !zielSvg) { [-1, 1].forEach(s => fx("fx-roete", k.x + s * g * .32, k.y + g * .18, "", { "--g": g * .42 + "px" })); }
      else if (art === "traenen" && !zielSvg) { [-1, 1].forEach((s, i) => fx("fx-traene", k.x + s * g * .25, k.y + g * .05, "", { "--g": Math.max(6, g * .16) + "px", "--d": (i * .45) + "s", "--x": (s * 6) + "px" })); }
      else if (art === "sterne" && !zielSvg) { const el = fx("fx-bleib", k.x, k.y - g * .7, '<span style="display:inline-block;animation:bpKreisen 1.4s linear infinite">✦ ★ ✦</span>'); el.style.fontSize = g * .45 + "px"; el.style.color = "#ffd27a"; }
      else if (art === "wolke") { const el = fx("fx-wipp", k.x, k.y - g * 1.2, "🌧️"); el.style.fontSize = g * .9 + "px"; }
      else if (art === "schild") { const el = fx("fx-bleib", k.x - g * .4, k.y + g * .2, "🛡️"); el.style.fontSize = g * .9 + "px"; }
      else if (art === "psycho") { for (let i = 0; i < 3; i++) { const el = fx("fx-ring", k.x, k.y, "", { "--g": g * 1.6 + "px", "--d": (i * .22) + "s" }); fxWeg(el, 1800); } }
    });
  }
  function schadenZeigen(x, y, zahl, krit) {
    const el = fx("fx-schaden" + (krit ? " krit" : ""), x, y, "−" + zahl + "<small>" + esc(t().psychisch) + "</small>");
    el.style.fontSize = klemm(L.H * (krit ? .14 : .1), 26, 110) + "px";
    fxWeg(el, 2400);
  }
  /* Etwas aus dem Publikum auf die Bühne werfen */
  function werfenAusPublikum(zeichen, n, zielX, zielY) {
    if (ruhig) return;
    for (let i = 0; i < n; i++) {
      const sx = zz(L.W * .1, L.W * .9), sy = L.H * 1.02, ex = zielX + zz(-L.W * .06, L.W * .06), ey = zielY + zz(-8, 8);
      const el = fx("fx-flug", sx, sy, zufall([].concat(zeichen)));
      el.style.fontSize = klemm(L.H * .06, 16, 46) + "px";
      const hoehe = L.H * zz(.35, .6), dauer = zz(700, 1000);
      el.animate([
        { transform: `translate(-50%,-50%) rotate(0)`, offset: 0 },
        { transform: `translate(calc(-50% + ${(ex - sx) * .5}px), calc(-50% + ${(ey - sy) * .5 - hoehe}px)) rotate(${zz(-200, 200)}deg)`, offset: .5 },
        { transform: `translate(calc(-50% + ${ex - sx}px), calc(-50% + ${ey - sy}px)) rotate(${zz(-400, 400)}deg)`, offset: 1 }
      ], { duration: dauer, delay: i * 110, easing: "linear", fill: "both" });
      fxWeg(el, dauer + i * 110 + 1400);
    }
  }
  function konfetti(n) {
    if (ruhig) return;
    const farben = ["#ffd27a", "#e0a046", "#ebe2cc", "#f0c27a", "#e0284e", "#c27ae0", "#6f8a5a"];
    for (let i = 0; i < n; i++) {
      const x = zz(0, L.W), el = fx("fx-flug", x, -20, zufall(["♪", "♫", "✦", "★", "◆", "▲", "●"]));
      el.style.color = zufall(farben); el.style.fontSize = zz(10, 22) + "px";
      const dauer = zz(1800, 3200);
      el.animate([{ transform: "translate(-50%,-50%) rotate(0)" }, { transform: `translate(calc(-50% + ${zz(-80, 80)}px), ${L.H + 40}px) rotate(${zz(-720, 720)}deg)` }], { duration: dauer, delay: zz(0, 600), easing: "cubic-bezier(.3,.1,.6,1)", fill: "both" });
      fxWeg(el, dauer + 700);
    }
  }
  function blitz(rot) { if (ruhig) return; blitzEl.classList.remove("an", "rot"); void blitzEl.offsetWidth; blitzEl.style.setProperty("--bx", (wuerfelPos.x / L.W * 100) + "%"); blitzEl.style.setProperty("--by", (wuerfelPos.y / L.H * 100) + "%"); blitzEl.classList.toggle("rot", !!rot); blitzEl.classList.add("an"); }
  let toastUhr = 0;
  function toast(text) { toastEl.textContent = text; toastEl.classList.add("da"); clearTimeout(toastUhr); toastUhr = setTimeout(() => toastEl.classList.remove("da"), 2800); }
  let notenUhr = 0;
  function notenStarten() {
    clearInterval(notenUhr);
    if (ruhig) return;
    notenUhr = setInterval(() => {
      const b = L.b; if (!b) return;
      const el = fx("fx-schweb", b.x + b.w * .45, b.y + b.h * .55, zufall(["♪", "♫", "♩"]), { "--x": zz(-10, 60).toFixed(0) + "px" });
      el.style.color = modus === "spott" ? "#ff9a7a" : "#ffd27a"; el.style.fontSize = klemm(L.H * .05, 14, 40) + "px";
      fxWeg(el, 1900);
    }, 420);
  }
  function notenStopp() { clearInterval(notenUhr); }

  /* =====================================================================
     DER WURF
     ===================================================================== */
  let wurfAnim = null, festWurf = 0;
  function wuerfelRollen(zahl, fertig) {
    if (!L.b) layout();
    if (!L.b) { fertig(); return; }
    const MF = W20.ziel(zahl, zz(.22, .38), zz(-.18, .18));
    const achse1 = W20.norm([zz(-1, 1), zz(-1, 1), zz(-1, 1)]), achse2 = W20.norm([zz(-1, 1), zz(-1, 1), zz(-1, 1)]);
    const th1 = zz(4, 6) * Math.PI, th2 = zz(2, 3) * Math.PI;
    const dauer = ruhig ? 0 : 1500, A0 = Math.max(50, L.H * .26), grenzen = [0, .46, .7, .86, 1], hops = [A0, A0 * .32, A0 * .13, A0 * .05];
    const t0 = performance.now();
    haloEl.className = "bp-w20-halo";
    let fertigGemeldet = false;
    function schritt(jetzt) {
      const tt = dauer ? klemm((jetzt - t0) / dauer, 0, 1) : 1;
      /* Start und Ziel jedes Mal neu – die Bühne kann während des Wurfs ins Vollbild wachsen */
      const start = { x: L.b.x + L.b.w * .9, y: L.b.y + L.b.h * .2 }, ende = { x: L.ruhe.x, y: L.ruhe.y };
      const xe = 1 - Math.pow(1 - tt, 2.2);
      const x = start.x + (ende.x - start.x) * xe;
      let y, seg = 0;
      while (seg < 3 && tt > grenzen[seg + 1]) seg++;
      const u = (tt - grenzen[seg]) / (grenzen[seg + 1] - grenzen[seg]);
      if (seg === 0) y = start.y + (ende.y - start.y) * u - hops[0] * 4 * u * (1 - u);
      else y = ende.y - hops[seg] * 4 * u * (1 - u);
      const r = Math.pow(1 - tt, 2), r2 = Math.pow(1 - tt, 2.4);
      wuerfelM = W20.M3(W20.M3(MF, W20.rot(achse1, th1 * r)), W20.rot(achse2, th2 * r2));
      wuerfelPos = { x, y };
      wuerfelSetzen(x, y, ende.y - y);
      wuerfelDrehen(w20El, wuerfelM);
      if (tt < 1) wurfAnim.raf = requestAnimationFrame(schritt);
      else if (!fertigGemeldet) { fertigGemeldet = true; wurfAnim = null; fertig(); }
    }
    wurfAnim = { raf: 0, ende: () => { cancelAnimationFrame(wurfAnim.raf); schritt(t0 + dauer + 1); } };
    w20El.querySelectorAll(".bp-fl.treffer").forEach(e => e.classList.remove("treffer"));
    w20El.classList.remove("krit", "patzer");
    wurfAnim.raf = requestAnimationFrame(schritt);
  }

  function stufeVon(wurf, summe) {
    if (wurf === 1) return "patzer";
    if (wurf === 20) return "krit";
    if (summe <= 11) return "schwach";
    if (summe <= 16) return "maessig";
    if (summe <= 21) return "gut";
    if (summe <= 25) return "stark";
    return "legende";
  }

  /* Alles zurück auf Anfang vor einem neuen Wurf */
  function aufraeumen() {
    planLeeren(); notenStopp();
    fxEl.innerHTML = "";
    blaseZeigen(false);
    stempelEl.className = "bp-stempel";
    zeileEl.classList.remove("da");
    publikumEl.className = "bp-publikum";
    spotEl.className = "bp-spot";
    welt.classList.remove("wackeln");
    barradinBox.className = "bp-box bp-barradin";
    barradin.dataset.arme = "laute"; ausdruck(barradin, "grinsen");
    zielBox.className = "bp-box bp-ziel";
    if (zielSvg) { ausdruck(zielSvg, "neutral"); zielSvg.dataset.arme = "seite"; zielSvg.classList.remove("x-glitzer"); }
  }

  function werfen() {
    if (zustand === "rollt" || zustand === "singt") { vorspulen(); return; }
    if (buchOffen) buchZu();
    if (!ersterWurf) { ersterWurf = true; if (window.tavVollAuto) window.tavVollAuto("barden-probe"); }
    if (ziel === "*") { eigenerName = nameEl.value.slice(0, 30); }
    aufraeumen();
    /* Gegner hat sich nach der Flucht noch nicht erholt? Dann kommt er jetzt zurück */
    const k = swKey(); if (k && swStand[k] != null && swStand[k] <= 0) { swStand[k] = zielInfo.sw || 12; }
    zielAufbauen(false);
    const wurf = festWurf || 1 + Math.floor(Math.random() * 20);
    festWurf = 0;
    let insp = 0;
    if (lies("imres-inspiration", "0") === "1") { insp = 1 + Math.floor(Math.random() * 6); schreib("imres-inspiration", "0"); }
    const summe = wurf + BONUS + insp, stufe = stufeVon(wurf, summe), name = zielName();
    wurfDaten = { wurf, insp, summe, stufe, name, modus, schaden: stufe === "patzer" ? w4(1) : stufe === "krit" ? w4(4) : stufe === "schwach" ? 0 : w4(2) };
    zustand = "rollt"; knopfText();
    buehne.classList.add("laeuft", "gespielt");
    $(".bp-erg-titel").textContent = t().wirft; $(".bp-erg-titel").className = "bp-erg-titel"; $(".bp-erg-rechnung").textContent = "";
    /* Barradin wirft */
    barradin.dataset.arme = "hoch"; ausdruck(barradin, "konzentriert");
    barradinBox.classList.add("p-wurf");
    if (zielSvg) ausdruck(zielSvg, modus === "spott" ? "fies" : "grinsen");
    wuerfelRollen(wurf, gelandet);
  }

  function gelandet() {
    const w = wurfDaten, T = t();
    barradinBox.classList.remove("p-wurf");
    const f = w20El.querySelectorAll(".bp-fl")[W20.flaechen.findIndex(x => x.zahl === w.wurf)];
    if (f) f.classList.add("treffer");
    w20El.classList.toggle("krit", w.wurf === 20); w20El.classList.toggle("patzer", w.wurf === 1);
    haloEl.className = "bp-w20-halo" + (w.wurf === 20 ? " krit" : w.wurf === 1 ? " patzer" : "");
    stempelEl.textContent = w.modus === "spott" && w.stufe === "patzer" ? T.eigentor : T.stufen[w.stufe];
    stempelEl.className = "bp-stempel " + w.stufe; void stempelEl.offsetWidth; stempelEl.classList.add("da");
    ergebnisZeigen();
    inspZeigen();
    stand.wuerfe++; if (w.wurf === 20) stand.krits++; if (w.wurf === 1) stand.patzer++;
    if (w.wurf === 20) { blitz(false); konfetti(60); spotEl.className = "bp-spot gold"; }
    if (w.wurf === 1) { blitz(true); if (!ruhig) welt.classList.add("wackeln"); spotEl.className = "bp-spot aus"; }
    zustand = "singt"; knopfText();
    const stueck = neuesStueck(w.modus === "spott", w.stufe, w.name);
    w.text = stueck.text; w.ids = stueck.ids;
    plan(() => stempelEl.classList.add("weg"), 1500);
    plan(() => singen(), ruhig ? 0 : 650);
  }

  function singen() {
    const w = wurfDaten, spott = w.modus === "spott";
    barradin.dataset.arme = spott ? "zeig" : "laute";
    ausdruck(barradin, spott ? "fies" : w.stufe === "patzer" ? "peinlich" : "singen");
    barradinBox.classList.add(spott ? "p-spotten" : "p-singen");
    if (spotEl.className === "bp-spot") spotEl.classList.add("an");
    if (zielSvg) ausdruck(zielSvg, spott ? "konzentriert" : "neutral");
    const n = versSetzen(w.text, w.name);
    blasePassen();
    blaseZeigen(true);
    if (!spott || w.stufe === "patzer") notenStarten();
    const woerter = Array.from(versEl.querySelectorAll(".w"));
    const dauer = ruhig ? 0 : klemm(n * 95, 1200, 6500), proWort = n ? dauer / n : 0;
    let zeitPunkt = 0;
    woerter.forEach((el, i) => {
      const letzteZeile = el.parentNode.lastElementChild === el;
      plan(() => el.classList.add("da"), zeitPunkt);
      zeitPunkt += proWort + (letzteZeile ? proWort * 1.6 : 0);
    });
    plan(() => reagieren(), zeitPunkt + (ruhig ? 0 : 350));
  }

  /* Reaktionen nach Stufe */
  const R_LOB = {
    patzer: { g: "peinlich", a: "r-zurueck", fx: ["schweiss"], p: "buh", b: "peinlich" },
    schwach: { g: "verwirrt", a: "r-kopf", fx: ["frage"], p: "", b: "peinlich" },
    maessig: { g: "grinsen", a: "r-hops", fx: ["noten"], p: "klatschen", b: "grinsen" },
    gut: { g: "geschmeichelt", a: "r-hops", fx: ["roete", "herz"], p: "jubel", b: "stolz", pose: "p-verbeugen" },
    stark: { g: "geruehrt", a: "r-schmelzen", fx: ["roete", "traenen", "herz", "funkeln"], p: "jubel", b: "lachen", arme: "hoch" },
    legende: { g: "verliebt", a: "r-schmelzen", fx: ["roete", "traenen", "herzen", "funkeln"], p: "toben", b: "lachen", arme: "hoch" },
    krit: { g: "verliebt", a: "r-ekstase", fx: ["roete", "traenen", "herzen", "funkeln"], p: "toben", b: "lachen", arme: "hoch" }
  };
  const R_SPOTT = {
    patzer: { g: "lachen", a: "r-lachen", fx: ["haha"], p: "lachen", b: "traurig" },
    schwach: { g: "verwirrt", a: "r-kopf", fx: ["frage", "schild"], p: "", b: "peinlich" },
    maessig: { g: "wuetend", a: "r-wut", fx: ["wut"], p: "oh", b: "fies" },
    gut: { g: "wuetend", a: "r-treffer", fx: ["wut", "schweiss", "psycho"], p: "oh", b: "stolz" },
    stark: { g: "schock", a: "r-wanken", fx: ["schweiss", "psycho"], p: "jubel", b: "stolz", arme: "hoch" },
    legende: { g: "traurig", a: "r-knien", fx: ["traenen", "wolke", "psycho"], p: "jubel", b: "lachen", arme: "hoch" },
    krit: { g: "ko", a: "r-zusammenbruch", fx: ["traenen", "sterne", "psycho"], p: "toben", b: "lachen", arme: "hoch" }
  };
  const TRINKGELD = { patzer: 0, schwach: 1, maessig: 3, gut: 6, stark: 10, legende: 15, krit: 25 };

  function reagieren() {
    const w = wurfDaten, T = t(), spott = w.modus === "spott", R = (spott ? R_SPOTT : R_LOB)[w.stufe];
    notenStopp();
    barradinBox.classList.remove("p-singen", "p-spotten");
    /* Barradin */
    ausdruck(barradin, R.b);
    barradin.dataset.arme = R.arme || (spott ? "zeig" : "laute");
    if (R.pose) barradinBox.classList.add(R.pose);
    if (!spott && w.stufe === "patzer") barradinBox.classList.add("p-stolpern");
    if (R.arme === "hoch" && !ruhig) barradinBox.classList.add("p-hops");
    /* Ziel */
    const key = zielInfo.key;
    let anim = R.a, effekte = R.fx.slice();
    if (!spott && key === "rex" && (w.stufe === "stark" || w.stufe === "legende" || w.stufe === "krit")) { anim = "r-wedeln"; effekte.push("wuff"); }
    if (!spott && key === "rex" && w.stufe === "maessig") effekte.push("wuff");
    if (zielSvg) {
      ausdruck(zielSvg, R.g);
      zielSvg.dataset.arme = { geruehrt: "herz", verliebt: "hoch", geschmeichelt: "herz", schock: "wangen", peinlich: "wangen", lachen: "seite", ko: "seite" }[R.g] || "seite";
      if (key === "imre" && !spott && (w.stufe === "legende" || w.stufe === "krit" || w.stufe === "stark")) zielSvg.classList.add("x-glitzer");
    }
    if (!ruhig) { zielBox.classList.remove("r-auftritt"); void zielBox.offsetWidth; zielBox.classList.add(anim); }
    zielEffekte(effekte);
    /* Publikum */
    if (R.p) publikumEl.classList.add(R.p);
    let zeile1 = "", zeile2 = "";
    if (spott) {
      const S = (window.BARRADIN_SPOTT || {})[sprache()];
      zeile1 = S ? S.reaktion[w.stufe].split("{n}").join(w.name) : "";
      if (w.stufe === "patzer") {
        const b = L.b; schadenZeigen(b.x + b.w * .5, b.y + b.h * .18, w.schaden, false);
        zeile2 = "⚔ " + T.schadenSelbst(w.schaden);
      } else if (w.stufe === "schwach") zeile2 = "🛡 " + T.schadenKein;
      else {
        const k = kopfPunkt();
        schadenZeigen(k.x, k.y - k.g * .2, w.schaden, w.stufe === "krit");
        zeile2 = "⚔ " + (w.stufe === "krit" ? T.schadenKrit(w.schaden) : T.schaden(w.schaden));
        const sk = swKey();
        if (sk) {
          swStand[sk] = Math.max(0, (swStand[sk] == null ? zielInfo.sw : swStand[sk]) - w.schaden);
          swZeigen();
          if (swStand[sk] <= 0) {
            const vk = zielInfo.key || sk;
            stand.vertrieben[vk] = (+stand.vertrieben[vk] || 0) + 1;
            plan(() => { zielBox.className = "bp-box bp-ziel"; void zielBox.offsetWidth; if (!ruhig) zielBox.classList.add("r-flucht"); zeileSetzen(T.flieht(w.name), "☠ " + T.vertrieben + ": " + stand.vertrieben[vk]); publikumEl.className = "bp-publikum toben"; konfetti(30); }, 1900);
            plan(() => { swStand[sk] = zielInfo.sw || 12; zielAufbauen(true); zeileSetzen(T.zurueck(w.name), ""); }, 4200);
          }
        }
      }
      if (w.stufe === "krit") { werfenAusPublikum(["🌹", "🍺", "✨"], 7, L.b.x + L.b.w / 2, L.b.y + L.b.h * .95); }
      if (w.stufe === "patzer") werfenAusPublikum(["🍅", "🥬"], 4, L.b.x + L.b.w / 2, L.b.y + L.b.h * .4);
    } else {
      const RT = LOB_REAKTION[sprache()], rk = RT[key] || RT.gast;
      const gruppe = w.stufe === "patzer" || w.stufe === "schwach" ? "tief" : w.stufe === "maessig" || w.stufe === "gut" ? "mitte" : "hoch";
      zeile1 = zufall(rk[gruppe]).split("{n}").join(w.name);
      const gold = TRINKGELD[w.stufe] || 0;
      stand.gold += gold;
      zeile2 = T.buehne[w.stufe] + (gold ? " · 💰 " + T.goldPlus(gold) : "");
      if (gold) werfenAusPublikum(w.stufe === "krit" || w.stufe === "legende" ? ["🌹", "🪙", "🪙", "💐"] : ["🪙"], Math.min(9, Math.ceil(gold / 2.5)), L.b.x + L.b.w / 2, L.b.y + L.b.h * .96);
      if (w.stufe === "patzer") { werfenAusPublikum(["🍅", "🍅", "🥬"], 5, L.b.x + L.b.w / 2, L.b.y + L.b.h * .45); const el = fx("fx-text fx-schweb", L.b.x + L.b.w * .4, L.b.y + L.b.h * .55, "Plonk!"); el.style.fontSize = klemm(L.H * .05, 14, 36) + "px"; el.style.color = "#ebe2cc"; fxWeg(el, 2000); }
      if (w.stufe === "legende") konfetti(30);
    }
    zeileSetzen(zeile1, zeile2);
    /* Versbuch */
    const neu = (w.ids || []).filter(id => !buchSet.has(id));
    neu.forEach(id => buchSet.add(id));
    w.neu = neu;
    if (neu.length) { toast(T.neuVers(neu.length)); buchKnopf.classList.remove("neu"); void buchKnopf.offsetWidth; buchKnopf.classList.add("neu"); }
    standSpeichern();
    statsZeigen();
    verlauf.unshift({ wurf: w.wurf, summe: w.summe, stufe: w.stufe, name: w.name, modus: w.modus }); if (verlauf.length > 8) verlauf.pop();
    verlaufZeigen();
    zustand = "fertig"; knopfText();
    buehne.classList.remove("laeuft");
  }
  const verlauf = [];
  function verlaufZeigen() {
    const T = t();
    $(".bp-verlauf").innerHTML = verlauf.map(v => '<li class="' + v.stufe + '"><b>' + v.wurf + "</b><span>" + (v.modus === "spott" ? "⚔ " : "♪ ") + esc(v.name) + " · " + esc(v.modus === "spott" && v.stufe === "patzer" ? T.eigentor : T.stufen[v.stufe]) + " (" + v.summe + ")</span></li>").join("");
  }
  function zeileSetzen(a, b) {
    zeileEl.innerHTML = esc(a) + (b ? '<br><b class="' + (/⚔/.test(b) ? "psy" : "") + '">' + esc(b) + "</b>" : "");
    zeileEl.classList.toggle("da", !!(a || b));
  }

  /* =====================================================================
     VERSBUCH
     ===================================================================== */
  const ANZEIGE_NAMEN = { kuotoa: "Kuo-Toa", glasstab: { de: "Glasstab", en: "Glasstaff" }, riese: { de: "Riese", en: "Giant" }, ilvara: "Ilvara", demogorgon: "Demogorgon", venomfang: "Venomfang", blight: "Blight", chasme: "Chasme", vrock: "Vrock", ettercap: "Ettercap", bugbear: "Bugbear", themberchaud: "Themberchaud" };
  const gross = s => s.charAt(0).toUpperCase() + s.slice(1);
  function unterTitel(e) {
    const T = t(), sp = sprache();
    if (e.abs === "namen") { const [k, l] = e.unter.split("|"); return gross(k) + " · " + T.lage[l]; }
    if (e.abs === "kreaturen" || e.abs === "kreaturReime") { const n = ANZEIGE_NAMEN[e.unter]; return n ? (typeof n === "string" ? n : n[sp]) : gross(e.unter); }
    return T.ziele[e.unter] || "";
  }
  function buchZeichnen() {
    const T = t(), sp = sprache(), alle = fortschritt(), f = { lob: fortschritt("lob"), spott: fortschritt("spott") };
    const frisch = new Set((wurfDaten && wurfDaten.neu) || []);
    let liste = "", letzterAbs = "", letzterUnter = null;
    eintraege().forEach(e => {
      if (e.kap !== buchKap) return;
      const text = e.text(sp) || e.text("de");
      if (!e.text(sp)) return;
      if (e.abs !== letzterAbs || e.unter !== letzterUnter) {
        const ut = unterTitel(e);
        liste += "<h5>" + esc(T.abschnitt[e.abs]) + (ut ? " <small>· " + esc(ut) + "</small>" : "") + "</h5>";
        letzterAbs = e.abs; letzterUnter = e.unter;
      }
      if (buchSet.has(e.id)) liste += '<p class="bp-bv' + (frisch.has(e.id) ? " frisch" : "") + '">' + esc(text).split("{n}").join("<i>" + esc(T.nameFrei) + "</i>") + "</p>";
      else liste += '<p class="bp-bv zu" aria-label="' + esc(T.gesperrt) + '">' + String(text).split("\n").slice(0, 4).map(z => '<span style="width:' + klemm(z.length * 1.9, 18, 100).toFixed(0) + '%"></span>').join("") + "<em>🔒 " + esc(T.gesperrt) + "</em></p>";
    });
    buchEl.innerHTML =
      '<div class="bp-buch-kopf"><h4>' + esc(T.buchTitel) + '</h4><button type="button" class="bp-buch-zu" aria-label="' + esc(T.buchZu) + '">✕</button>' +
      '<p class="bp-buch-rang">' + esc(T.buchText(alle.n, alle.g)) + " · " + esc(T.rang) + ": <b>" + esc(rangName()) + "</b></p>" +
      '<div class="bp-balken" role="progressbar" aria-valuemin="0" aria-valuemax="' + alle.g + '" aria-valuenow="' + alle.n + '"><i style="--q:' + (alle.g ? alle.n / alle.g * 100 : 0).toFixed(1) + '%"></i></div></div>' +
      '<div class="bp-buch-tabs" role="tablist">' + ["lob", "spott"].map(k => '<button type="button" role="tab" data-kap="' + k + '" aria-selected="' + (buchKap === k) + '">' + esc(T.kapitel[k]) + " · " + f[k].n + "/" + f[k].g + "</button>").join("") + "</div>" +
      '<div class="bp-buch-liste" tabindex="0">' + liste + "</div>";
    buchEl.style.setProperty("--sp", buchEl.clientWidth > 900 ? 2 : 1);
  }
  function buchAuf() {
    buchKap = modus; buchOffen = true;
    buchKnopf.classList.remove("neu");
    buchEl.hidden = false; buchZeichnen();
    const zu = buchEl.querySelector(".bp-buch-zu"); if (zu) zu.focus({ preventScroll: true });
    const fr = buchEl.querySelector(".bp-bv.frisch"), li = buchEl.querySelector(".bp-buch-liste");
    if (fr && li && buchEl.style.getPropertyValue("--sp") !== "2") li.scrollTop = Math.max(0, fr.offsetTop - li.offsetTop - li.clientHeight / 3);
  }
  function buchZu() { buchOffen = false; buchEl.hidden = true; buchKnopf.focus({ preventScroll: true }); }

  /* =====================================================================
     BEDIENUNG
     ===================================================================== */
  function wahlMerken() { schreib("imres-probe-wahl", JSON.stringify(zielWahl)); schreib("imres-probe-modus", modus); }
  function modusSetzen(m) {
    if (m === modus || (m !== "lob" && m !== "spott")) return;
    if (zustand === "rollt" || zustand === "singt") vorspulen();
    zielWahl[modus] = ziel;
    modus = m;
    ziel = zielWahl[modus] || (modus === "lob" ? LOB_ZIELE[0] : spottZiele()[0]);
    wurfDaten = null; zustand = "ruhe";
    aufraeumen();
    if (modus === "spott" && Math.random() < .5 && ort !== "hoehle") { ort = "hoehle"; zeit = zufall(ZEITEN); kulisseBauen(); }
    else if (modus === "lob" && ort === "hoehle") { ort = zufall(["taverne", "markt", "halle"]); kulisseBauen(); }
    texteSetzen();
    zielAufbauen(true);
    wuerfelM = W20.ziel(20, .32, -.08); haloEl.className = "bp-w20-halo ruhe"; w20El.classList.remove("krit", "patzer"); w20El.querySelectorAll(".treffer").forEach(e => e.classList.remove("treffer")); layout();
    wahlMerken();
  }
  function zielSetzen(z) {
    if (z === ziel && z !== "*") return;
    if (zustand === "rollt" || zustand === "singt") vorspulen();
    ziel = z; zielWahl[modus] = z;
    if (z === "*") gastLook = gastFigur();
    zieleZeichnen();
    aufraeumen();
    zielAufbauen(true);
    wahlMerken();
    if (z === "*") nameEl.focus();
  }
  modusEl.addEventListener("click", e => { const b = e.target.closest("[data-modus]"); if (b) modusSetzen(b.dataset.modus); });
  wahlEl.addEventListener("click", e => { const b = e.target.closest("[data-ziel]"); if (b) zielSetzen(b.dataset.ziel); });
  nameEl.addEventListener("input", () => { eigenerName = nameEl.value.slice(0, 30); });
  nameEl.addEventListener("change", () => { eigenerName = nameEl.value.slice(0, 30); if (ziel === "*") swZeigen(); });
  nameEl.addEventListener("keydown", e => { if (e.key === "Enter") { e.preventDefault(); werfen(); } });
  losEl.addEventListener("click", werfen);
  w20El.addEventListener("click", werfen);
  blase.addEventListener("click", () => { if (zustand === "singt") vorspulen(); });
  buchKnopf.addEventListener("click", () => (buchOffen ? buchZu() : buchAuf()));
  kulisseKnopf.addEventListener("click", kulisseWechseln);
  buchEl.addEventListener("click", e => {
    if (e.target.closest(".bp-buch-zu")) { buchZu(); return; }
    const k = e.target.closest("[data-kap]"); if (k) { buchKap = k.dataset.kap; buchZeichnen(); const tab = buchEl.querySelector('[data-kap="' + buchKap + '"]'); if (tab) tab.focus({ preventScroll: true }); }
  });
  root.addEventListener("keydown", e => { if (e.key === "Escape" && buchOffen) { e.stopPropagation(); buchZu(); } });
  /* Laute in der Seite kann Inspiration schenken – beim Zurückkommen neu nachsehen */
  root.addEventListener("pointerenter", inspZeigen);
  window.addEventListener("focus", inspZeigen);

  /* Augen wandern ab und zu */
  setInterval(() => {
    if (ruhig || root.offsetParent === null && !root.classList.contains("tav-voll")) return;
    root.querySelectorAll(".f-pup").forEach(p => p.setAttribute("transform", "translate(" + zufall([-1.6, 0, 0, 1.6]) + " " + zufall([0, 0, 1]) + ")"));
  }, 2600);

  /* Größe beobachten */
  let rafMasse = 0;
  function masseSpaeter() { cancelAnimationFrame(rafMasse); rafMasse = requestAnimationFrame(() => { kartenMasse(); layout(); }); }
  if (window.ResizeObserver) { const ro = new ResizeObserver(masseSpaeter); ro.observe(buehne); ro.observe(root); }
  window.addEventListener("resize", masseSpaeter);
  new MutationObserver(masseSpaeter).observe(root, { attributes: true, attributeFilter: ["class"] });
  new MutationObserver(() => { EINTRAEGE = null; texteSetzen(); zielAufbauen(false); if (buchOffen) buchZeichnen(); })
    .observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });

  /* ---------- Start ---------- */
  ziel = zielWahl[modus] || (modus === "lob" ? LOB_ZIELE[0] : spottZiele()[0]);
  if (modus === "spott" && Math.random() < .5) ort = "hoehle";
  kulisseBauen();
  texteSetzen();
  zielAufbauen(false);
  ausdruck(barradin, "grinsen");
  masseSpaeter();

  /* =====================================================================
     CONTROLLER-SCHNITTSTELLE (für controller.js)
       root._probe.optionen()  → alle wählbaren Knöpfe in Lesereihenfolge
       root._probe.werfen()    → W20 werfen (bzw. vorspulen, solange gesungen wird)
       root._probe.aktiv()     → true, wenn die Karte zu sehen ist
       … und ein paar Helfer, siehe unten
     ===================================================================== */
  const sichtbar = el => !!(el && !el.hidden && el.offsetParent !== null && getComputedStyle(el).visibility !== "hidden");
  root._probe = {
    optionen() {
      if (buchOffen) return Array.from(buchEl.querySelectorAll(".bp-buch-zu, .bp-buch-tabs button")).filter(sichtbar);
      return Array.from(root.querySelectorAll(".bp-modus button, .bp-wahl button, .bp-name, .bp-los, .bp-buch-knopf, .bp-kulisse-knopf")).filter(sichtbar);
    },
    werfen,
    aktiv: () => (root.classList.contains("tav-voll") || (root.offsetParent !== null && getComputedStyle(root).display !== "none")),
    zustand: () => zustand,
    vorspulen,
    modus: m => { if (m) modusSetzen(m); return modus; },
    ziel: z => { if (z != null) zielSetzen(z); return ziel; },
    buchOffen: () => buchOffen,
    buch: auf => { if (auf === undefined ? !buchOffen : auf) buchAuf(); else buchZu(); return buchOffen; },
    buchBlaettern: dy => { const l = buchEl.querySelector(".bp-buch-liste"); if (l) l.scrollBy({ top: dy, behavior: "auto" }); },
    kulisse: kulisseWechseln
  };
  /* für automatische Tests: Wurf mit fester Zahl */
  if (/probe-test/.test(location.search)) root._probe._test = { wurf: n => { festWurf = klemm(n | 0, 1, 20); werfen(); }, stand: () => JSON.parse(JSON.stringify(stand)), L: () => L };
})();
