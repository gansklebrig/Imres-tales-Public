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
