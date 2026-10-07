/* =====================================================================
   IMRES TALES – ENGLISH CONTENT
   ---------------------------------------------------------------------
   English version of inhalt.js. Same structure, same image files.
   Station "abschnitt" values must match the English "## " headings.
   ===================================================================== */

window.INHALT_EN = {

  /* ---------- INTRO ---------- */
  intro: {
    label: "Our Dungeon Master",
    text: "The world, created by <strong>Imre</strong>, our magnificent Dungeon Master, lord of dice, worlds and fates. Without him there would be no harbour town, no magic forge and not a single failed saving throw. What is written here, he created. We merely survived it … so far, at least …"
  },

  /* ---------- THE COMPANIONS ---------- */
  helden: [
    {
      id: "barradin",
      name: "Barradin",
      rolle: "Bard",
      beiname: "the bard with the silver tongue",
      bild: "barradin.jpg",
      bildAlt: "Barradin with burning juggling torches at a night market",
      bildtext: "Barradin in his element: fire, an audience and a wide grin.",
      fries: "50% 30%",
      absaetze: [
        "Wherever the elven bard Barradin appears, silence does not last. He sings ballads, whirls flaming torches through the air and turns somersaults until the crowd roars. Nobody knows better than he does how good he is, and he is happy to say so. Yet his confidence is contagious: once Barradin catches fire, he carries the whole party with him.",
        "His sharpest weapon is his tongue. With mockery and wit he throws his foes off balance, and more than one enemy has quite literally collapsed beneath his verses. That he occasionally trips over his own feet in the heat of battle is all part of his charm.",
        "Barradin grew up in the house of his father, a zealous member of the <em>Alternative for Elves</em>. Today he has deliberately chosen a different path. At the side of a human, a druid, a Darkin and a dog, he has learned that where someone comes from says nothing about their worth as a companion, and he stands up for that at the top of his voice.",
        "You will usually find him pipe in hand, wrapped in a cloud of fragrant herb."
      ]
    },
    {
      id: "friedrich",
      name: "Friedrich",
      rolle: "Ranger",
      beiname: "the righteous ranger",
      bild: "friedrich.jpg",
      bildAlt: "Friedrich with a longbow in a forest full of tree houses and animals",
      bildtext: "Friedrich in the woods he knows so well.",
      fries: "52% 30%",
      absaetze: [
        "Friedrich is a human, a ranger and the calm centre of the party. Where others are already reaching for their weapons, he first seeks conversation and a path that needs no bloodshed. He is honest, dependable and has a fine sense for what is right.",
        "With his longbow he is a true master. A leaf on the wind, a fleeing hare or a rogue behind a castle wall: Friedrich's arrows find their mark. Whoever refuses his outstretched hand soon learns that peacefulness is not weakness. When he must act, he does not hesitate for a heartbeat, and often a single arrow ends the fight.",
        "At his side, always, is Rex, his loyal dog."
      ],
      begleiter: {
        id: "rex",
        name: "Rex",
        rolle: "Companion",
        bild: "rex.jpg",
        bildAlt: "Rex, a dog in an adventurer's cloak",
        fries: "45% 40%",
        absaetze: [
          "Rex is the heart of the party and everyone's undisputed favourite. He is playful, curious and always ready for an adventure, even if he occasionally forgets what it was actually about.",
          "Whether he is chasing a stick or a goblin, Rex gives it everything he has, tail wagging all the way."
        ]
      }
    },
    {
      id: "echo",
      name: "Echo",
      rolle: "Druid",
      beiname: "the horned druid",
      bild: "echo.jpg",
      bildAlt: "Echo, an antlered druid in white robes in a misty forest",
      bildtext: "Echo, moments before someone says the wrong thing.",
      breitbild: true,
      fries: "56% 30%",
      absaetze: [
        "Echo spent most of his life deep in the forests. There he became a druid: he learned the language of nature, studied monsters and awakened the old magic within himself. If need be, he takes on the shape of a beast.",
        "He has little patience for long negotiations. When an enemy gets cheeky, Echo would rather let his deeds do the talking, and those deeds usually look a lot like a fireball.",
        "His greatest passion is loot. Echo has an unfailing nose for treasure: no chest stays closed, no fallen foe goes unsearched. Given the choice, he would pocket everything that glitters. Yet at the end of the day the treasure still lands on the common pile, because for Echo the party comes first.",
        "His humour is hearty and sometimes as rough as an old oak trunk, but beneath it beats the heart of a loyal companion."
      ]
    },
    {
      id: "ezekiel",
      name: "Ezekiel",
      rolle: "Rogue",
      beiname: "the Destroyer",
      bild: "ezekiel.jpg",
      bildAlt: "Ezekiel, a horned, hooded figure with two blades before burning ruins",
      bildtext: "What Ezekiel is thinking, only Ezekiel knows.",
      fries: "50% 20%",
      absaetze: [
        "Ezekiel is the party's rogue and a man of few words. He watches, he waits, and he strikes when no one expects it. Beneath his hood hides a Darkin whose thoughts remain an eternal riddle to his companions.",
        "One moment he surprises the party with an unexpectedly kind gesture, the next he shows the ice-cold calm of an assassin. That is exactly what makes him so valuable: his enemies never know what is coming. His companions, on the other hand, have learned that they can rely on him when it truly matters.",
        "Many foes have already tasted his cold steel. They will not be the last."
      ],
      geheimnis: "Ezekiel keeps silent about his past. What story lies behind the name “the Destroyer” will be revealed one day."
    }
  ],

  /* ---------- NOTE BEFORE THE CHRONICLE ---------- */
  erzaehler: {
    name: "Barradin",
    bild: "barradin.jpg",
    label: "A word before we begin",
    text: "This chronicle is told to you by Barradin, and as befits a bard, he does not remember every detail quite exactly … He may have embellished one thing or another just a little, wildly exaggerated it or even left it out entirely … Imre alone knows the true story … but this one will hopefully enchant you all the same!"
  },

  /* ---------- THE CHRONICLE ---------- */
  kapitel: [
    {
      nummer: "I",
      titel: "The Road to Phandalin",
      station: 1,
      absaetze: [
        "## The Invitation",
        "It began with a letter. Each of us received an invitation from Gundren, a dwarf and merchant who seems to know everyone worth knowing. The meeting place: the harbour of Neverwinter. Creaking piers, fishing boats, merchants and sailors, and over it all the smell of salt and tar. I still remember standing there, pipe in the corner of my mouth, feeling it in my bones: something big begins here.",
        "And so there we stood together: me, an elf with a pipe, next to a human with a bow and a dog, a horned druid and a Darkin who did not say a single word. The round of introductions went, to put it kindly, a little bumpily. <em class=\"aside\">Mostly I remember introducing myself splendidly.</em>",
        "Gundren came straight to the point. Deep within an old, abandoned mine lies a magic forge where magical items were once crafted. Several powerful lords are burning with interest in it, and Gundren smelled a chance to expand his export business considerably. How exactly, he kept to himself. He had me at the words “magic forge” anyway.",
        "Our first job sounded harmless: escort a cart of goods safely to Phandalin. And whoever tracked down Elmar Barton there could look forward to an extra helping of gold. Echo's eyes lit up brighter than any torch at that.",
        "## Ambush on the Road",
        "For several days the cart rolled along peacefully, and I had already begun composing a song about boring journeys. Then the way was suddenly blocked: a raided, half-burned wagon lay across the road. A shiver ran down all our spines; we knew at once that something was amiss. When a handful of goblins leapt out of the woods moments later, we were ready, and the fight was over before it had properly begun.",
        "## The Goblin Cave",
        "Instead of simply moving on, we decided to follow the tracks into the forest. Phandalin would surely be grateful to see an end to the goblin plague, and there was bound to be loot as well.",
        "At the mouth of the cave we came upon several tethered wolves. Their whimpering cut right through me, so we promptly set them free. Then we stormed the goblin nest, partly in silence from the shadows, partly with anything but restraint. <em class=\"aside\">Which part of that was mine, I would rather leave open.</em> In the end the chieftain and his entire band lay on the ground, and we stepped back into the daylight victorious, sweaty and rather pleased with ourselves.",
        "## Phandalin and the Red Robes",
        "At last we reached Phandalin, a small village. First things first: we settled into the tavern, ate and drank to our hearts' content and haggled the innkeeper down to remarkably cheap rooms. Only then did we set out in search of information. We roamed the lanes, spoke with the villagers and tried to find out what was going on. But people were tight-lipped and avoided our eyes, and it soon became clear that all was not well here.",
        "The breakthrough came, naturally, from me. In the tavern I struck up a song and sang until I had the locals completely under my spell. Then tongues loosened: a gang calling itself the Red Robes was extorting protection money from the townsfolk and had dug itself in at Castle Crackmore, right at the edge of the village. The fear in their voices made me furious.",
        "Before moving against the gang, we paid a visit to the mayor of Phandalin. Our goal: to negotiate a reward, and a handsome one at that. The conversation, however, turned extremely awkward. Our demands were, to put it gently, excessive, the mood soured, and the whole affair very nearly ended in an outright quarrel. <em class=\"aside\">I would call it confident.</em>",
        "## Castle Crackmore",
        "We gained entry to the castle. First we freed a prisoner and, in doing so, seized a few red robes, which from then on served as our disguise. <em class=\"aside\">Although Ezekiel, in his scarlet armour, probably would not have stood out much even before.</em> In this way we pushed ever deeper into the old walls, hearts in our throats with every step, and took on the gang in several fights, one after another. <em class=\"aside\">How many fights there were, I no longer recall exactly. I was busy looking good in my red robe.</em>",
        "Last of all we confronted their leader, Glasstaff. When the fight turned against him, he tried to escape through a secret tunnel. I saw him vanishing, threw myself forward and caught hold of him at the very last moment. With all my strength I hauled him back into the room, and Friedrich brought him down with a perfect headshot.",
        "!glasstab-besiegt.jpg|After the victory over Glasstaff, still wearing the captured red robes.",
        "With his last breath, Glasstaff spoke of a certain Spider whom he apparently served. Is it a person, a power, a secret order? To this day, we do not know.",
        "Back in Phandalin we spread the good news and, while we were at it, tried to drive our reward up a little further. Then we celebrated in the tavern, wild and loud deep into the night. Yet however loud it got, one thought would not let me go: the Spider, whatever may lie behind that name.",
        "!siegesfeier.jpg|Our victory feast in Phandalin. My horn holds nothing but juice, by the way.",
        "After the celebration we went to the mayor to collect our reward, and it proved just as awkward as our first visit. <em class=\"aside\">Let us put it this way: he will not be inviting us back any time soon.</em>",
        "## The Prisoner in the Watchtower",
        "At this point I must confess: my memory of the days that followed is a little … hazy. <em class=\"aside\">Perhaps it was the herb in my pipe.</em>",
        "After our victory over the Red Robes, we received a new task, at any rate. From whom, and why? We were to free a prisoner from a watchtower, a prisoner about whom nobody knew anything, not even his name.",
        "First we circled the tower to get the lay of the land, then slipped in at a favourable spot. The surprise worked, and we were upon the guards before they knew what had hit them.",
        "But then a huge bugbear stood before us and gave us a thorough beating. <em class=\"aside\">In my memory he was at least ten feet tall. At least.</em> In the end, though, he too went down.",
        "Among the foes was also a dark elf named Nezna, who fought us fiercely. When the battle was lost, she had one more surprise in store: she was a shapeshifter. In the blink of an eye she turned into a small animal and scurried away, faster than any of us could follow. Before she vanished, though, she too spoke of the Spider. <em class=\"aside\">I am fairly sure she said “the Spider”. Fairly.</em>",
        "## Gundren's Brother",
        "The prisoner was saved, and when he introduced himself, we were astonished: it was Nundro, Gundren's twin brother. <em class=\"aside\">Nundro, not Nando … right?</em>",
        "Together with him we returned to Gundren, who swept his brother into his arms with overflowing joy. I admit, even I felt a little warm around the heart at the sight.",
        "## The Magic Forge",
        "Then things got serious. Gundren gave us the task everything had been leading up to: we were to find the magic forge.",
        "The way led us into the old, abandoned mine where it was said to be hidden. We fought our way through corridor after corridor and foe after foe, and some of those fights were truly hard. <em class=\"aside\">How many were there exactly? Many. Very many. More than I can count on two hands, I believe.</em>",
        "But in the end we stood before it: the magic forge, surrounded by glowing runes. For a moment everything was still, and I even forgot to say something clever. We cleared the last guardians out of the way until the forge was ours, then returned to Gundren to bring him the good news.",
        "!magische-schmiede.jpg|A rest before the magic forge. And no, I was not showing off.",
        "## Neverwinter",
        "Only then did we return to Neverwinter, the city in whose harbour it had all begun. Whoever performs great deeds ought to tell of them, after all, and where better than in the great city? No sooner had we secured a room at an inn than we requested an audience with the Lords' Alliance.",
        "It did not go entirely by protocol. Somewhat clumsily and rather boldly, we marched straight past the guards to the head of the Alliance, Captain Dolgrimson. He, however, put us off: there would be time for a conversation only later.",
        "So we wandered the streets of Neverwinter, listening in taverns and at market stalls and trying to catch rumours. Without success. <em class=\"aside\">I think. Or I have forgotten the rumours. Both are possible.</em>",
        "## The Lords' Alliance",
        "At last we returned to the Alliance. After a long conversation we made our decision: we would join the Lords' Alliance and lend it our strength. A bard among the ranks of the lords. I liked the sound of that.",
        "## Thundertree",
        "No sooner had we joined the Alliance than our first assignment awaited. Captain Dolgrimson sent us to Thundertree, a small, abandoned village a little east of Neverwinter. We were to look into matters there and find out whether anything was going on that ought not to be.",
        "Thundertree greeted us with a silence that crept straight under my skin: a handful of houses that seemed deserted, and towering over them all a large, half-ruined watchtower, its walls gnawed by moss and rot.",
        "## The Dragon in the Tower",
        "We entered the tower, searched it floor by floor and climbed ever higher. On the topmost platform, fate struck: a dragon attacked, a poison-breathing horror named Venomfang.",
        "The fight was brutal. Then came my great moment: with my magic I drew the dragon into a hypnotic trance, and we seized the chance to get into position. <em class=\"aside\">I mention this only for the sake of completeness. And because it was magnificent.</em> In the end Venomfang fell, but his poison breath had dealt us a nasty blow. My lungs were still burning hours later.",
        "First things first: catch our breath, bind our wounds and, of course, gather the loot. Echo, as you might imagine, was particularly thorough.",
        "!venomfang-besiegt.jpg|Venomfang is defeated. I treat myself to a pipe, and Rex has already claimed his share of the loot.",
        "## The Abandoned Village",
        "!ilvara-druidin.webp|Ilvara as she appeared to us: venerable, kindly and with a fox. What could possibly go wrong?|schmal",
        "Then we turned to the village. Zombies lurked in some of the seemingly empty houses. In front of one house stood a statue that stopped Ezekiel in his tracks: he recognised it as his uncle. <em class=\"aside\">He said nothing more about it. Of course he didn't.</em>",
        "More fights followed, against blights, against two giant spiders and against yet more blights, until Echo unleashed an enormous fireball and solved the problem his own way. I can still feel the heat on my face.",
        "In the last house we finally met a druid who introduced herself as Ilvara. Dressed all in green, a fox upon her shoulders, she looked like a guardian of the forest. None of us suspected anything when she invited us into her home. To this day that annoys me more than I care to admit."
      ],
      fortsetzung: "Continued in Chapter II …"
    },
    {
      nummer: "II",
      titel: "The Underdark",
      absaetze: [
        "## The Herbal Mist",
        "!ilvara-wahr.webp|Ilvara Mizzrym in her true form. Not much left of the guardian of the forest.|schmal links",
        "The moment we stepped into Ilvara's house, a sweet, poisonous vapour filled the air. One after another we sank to the floor, and everything went black before my eyes. The friendly druid was in truth a shapeshifter who had drugged us with an herbal mist, and she carried us all off. Her true face we would only see later: Ilvara Mizzrym, a drow.",
        "## Captured",
        "None of us knew how much time had passed when we came to. <em class=\"aside\">A few hours? Days? Either way, I slept splendidly.</em> We lay in chains, deep beneath the earth, in a prison-like chamber under lock and key. Guards stood outside the bars, glaring in grimly. For the first time on this journey, I was truly afraid.",
        "Then Echo had a brilliant idea: he turned into a rat, slipped out of the cell unnoticed and found our gear in a neighbouring room. Still in animal form, he brought everything back to us. <em class=\"aside\">Simply brilliant, Echo!</em>",
        "## The Breakout",
        "As soon as we were armed again, I did not hesitate. I insulted the guards so thoroughly and so artfully that they charged at us in a blind rage. Only now did it become clear that most of the enemies had been out of sight: they were waiting next door, beyond bridges on another platform, heard the clash of battle and came storming in.",
        "And then, out of nowhere, demons appeared in the middle of the fight. A chasme, a flying, insect-like abomination with several wings and a long stinger, swooped down on us, while a vrock, a vulture-like demon, fell upon our enemies. I have heard many things in my life, but I will never forget that buzzing.",
        "The fight was hard. The demons may have taken down most of the enemies, but in the end it was we who struck down both demons and the last remaining foes.",
        "Only one escaped: Ilvara, the drow shapeshifter. She leapt from the bridge into the river rushing far below and was gone.",
        "Afterwards we searched our captors' hideout and found some loot. And a spider statue. We painted it, at first just with an extra beard, but it quickly turned into phallic symbols and similar scribblings. Childish? Perhaps. Liberating? Absolutely.",
        "## Through the Webs",
        "We pressed deeper into the Underdark. Thick spider webs blocked the way, and in places we even had to balance across them. A few spiders did stand in our way, but Ezekiel and Friedrich quickly secured victory over the eight-legged foes with a handful of perfect hits.",
        "In one of the spider cocoons we made a surprising discovery: a gnome named Fagas, captured but still alive. He told us of a magical temple to which Arafil of the Red Seat, a wizard, had sent him and his troop.",
        "Fagas went on to explain that his group had been sent to find a mysterious tomb: the resting place of the wizard Karim, a Netherese mage who had lived some 3,000 years ago. A master of the magical Weave from a long-vanished high civilisation. Echo immediately smelled treasure.",
        "## The Wizard's Tomb",
        "Our way through the Underdark now revealed a surprisingly beautiful side: sparkling rivers, glowing mushrooms, an entire realm bathed in soft light. For a moment I almost forgot where we were. It was not long, however, before first spider monsters and later ettercaps stood in our way. We slew them all and fought our way deeper into the depths.",
        "One of the fights took place in a ruin: a half-collapsed settlement that had vanished into the deep black of the abyss, save for its last few houses. Only thick spider webs still held those last houses in place. One wrong step, and it would have been a long fall into nothing.",
        "!unterreich-spinnweben.jpg|Making our way through the webs of the Underdark. Perfectly relaxed, as you can see.",
        "In a temple-like house we found yet another spider statue. As we defaced this one too, we stumbled upon a secret passage!",
        "No sooner had we entered it than a voice rang out in our heads, pleading for help. An icy shiver ran down my spine. The magical Weave, it seemed, was twisted in this place. We pressed deeper into the enchanted tomb and found a hidden switch behind a statue.",
        "When we pulled it, a spectral figure appeared and spoke in unintelligible words. Then unholy energy formed a terrifying foe: a wraith. After a hard fight it was defeated, and we found a weapon of which legends already speak: Dawnbringer, a magic sword.",
        "## The Underground Lake",
        "After leaving the tomb we crossed yet more webs, ever deeper into the caves, until at last we reached an underground lake. On its shore we met a group of kuo-toa, a race of fish folk.",
        "Their leader was Ploopploopeen, an archpriest. <em class=\"aside\">Ploopploopeen. For quite a while I called him Blublupin. He did not hold it against me. I think.</em> He asked us for help: part of his city at the edge of the lake was worshipping a false god, Lermu-Gorgon. After some discussion we decided to trust him.",
        "Ploopploopeen's plan: he would pretend to tie us up and smuggle us into the city. The plan worked, at least until we reached the city centre. Walking bound through a strange city is no fun, by the way, even when the ropes are only for show.",
        "## Demogorgon",
        "There a fight broke out among the kuo-toa at once. The false archpriestess attacked Ploopploopeen, more fish folk joined in, and within moments there was utter chaos.",
        "!kuo-toa-stadt.jpg|Chaos in the city of the kuo-toa. I provide the fitting soundtrack.",
        "In the middle of the melee we spotted a bound dwarf among the enemies. We managed to free him while the fight was still raging. His name was Kardal, and he claimed to be a scout of his city who had been captured by the fish folk.",
        "!demogorgon.webp|Demogorgon, Prince of Demons.|frei",
        "Then something rose from the lake: Demogorgon. A demon prince, a true demon god. Two heads, two arms with two tentacles each, a long tail and two legs that made the ground tremble. He let out an ungodly, terrifying scream, all magic was snuffed out, and our knees began to shake. <em class=\"aside\">I admit: mine were only shaking out of solidarity.</em>",
        "Friedrich was not deterred. He drew his bow and loosed an arrow at Demogorgon. The effect: none. Absolutely none. Nevertheless, Friedrich has insisted ever since that he punched a god.",
        "The monster set about destroying the city. With its tentacle arms it crushed buildings, foes and allies alike. We ran as I have never run before and, with a great deal of luck, reached a boat. Kardal escaped with us. Ploopploopeen and all the other kuo-toa perished, and nothing remained of their city but a few ruins.",
        "!flucht-see.jpg|Fleeing across the lake. Friedrich is still very proud of himself to this day.",
        "## Gracklstugh",
        "Our flight across the lake finally brought us to a breathtaking sight: a fortress hewn into the rock, towering behind mighty city walls above the city of Gracklstugh. After everything that lay behind us, it was almost too beautiful to be true.",
        "!gracklstugh.jpg|Arriving at Gracklstugh. Kardal leads the way."
      ],
      fortsetzung: "To be continued …"
    }
  ],

  /* ---------- THE JOURNEY ---------- */
  reise: {
    karten: [
      {
        titel: "The Surface",
        karte: "weltkarte.jpg",
        stationen: [
          { name: "The Harbour of Neverwinter", x: 21.5, y: 46, kapitel: "I", abschnitt: "The Invitation", text: "Gundren invites the heroes and offers them the search for a magic forge." },
          { name: "Ambush on the Road", x: 44.4, y: 72.9, kapitel: "I", abschnitt: "Ambush on the Road", text: "Just after turning off the High Road towards Phandalin. The goblins leaping from the woods never stand a chance." },
          { name: "The Goblin Cave", x: 45.7, y: 66.8, kapitel: "I", abschnitt: "The Goblin Cave", text: "Separated from the site of the ambush by just a small stretch of forest. Wolves freed, nest stormed, chieftain slain." },
          { name: "Phandalin", x: 57.8, y: 76.4, kapitel: "I", abschnitt: "Phandalin and the Red Robes", text: "A small village in the grip of the Red Robes. At its edge lies Castle Crackmore, where Glasstaff falls and speaks of the Spider." },
          { name: "The Watchtower", x: 67.7, y: 67.8, kapitel: "I", abschnitt: "The Prisoner in the Watchtower", text: "A bugbear falls, a drow escapes, and the prisoner turns out to be Gundren's twin brother Nundro." },
          { name: "The Magic Forge", x: 71.3, y: 75, kapitel: "I", abschnitt: "The Magic Forge", text: "Hidden deep within an old, abandoned mine. After hard-fought battles, it belongs to the party." },
          { name: "Neverwinter", x: 25.5, y: 43.8, kapitel: "I", abschnitt: "Neverwinter", text: "Back in the great city. Here the companions join the Lords' Alliance." },
          { name: "Thundertree", x: 37.6, y: 45.8, kapitel: "I", abschnitt: "Thundertree", text: "An abandoned village with a crumbling watchtower. A poison dragon, zombies, blights and a druid who is not what she seems." }
        ]
      },
      {
        titel: "The Underdark",
        karte: "unterreich-karte.jpg",
        stationen: [
          { name: "The Dungeon", x: 8.0, y: 48.3, kapitel: "II", abschnitt: "Captured", text: "The companions wake here in chains. Echo fetches the gear as a rat, then come the breakout and the demons." },
          { name: "The Webs", x: 12.0, y: 40.7, kapitel: "II", abschnitt: "Through the Webs", text: "Balancing across spider webs. The gnome Fagas waits in a cocoon." },
          { name: "The Wizard's Tomb", x: 26.0, y: 27.3, kapitel: "II", abschnitt: "The Wizard's Tomb", text: "Behind a defaced spider statue: a wraith and the sword Dawnbringer." },
          { name: "The Underground Lake", x: 22.7, y: 41.9, kapitel: "II", abschnitt: "The Underground Lake", text: "On the shore, Ploopploopeen, archpriest of the kuo-toa, asks for help." },
          { name: "The Kuo-Toa Ruins", x: 20.0, y: 47.1, kapitel: "II", abschnitt: "Demogorgon", text: "Here Demogorgon rose from the lake. Only ruins remain of the city." },
          { name: "Gracklstugh", x: 19, y: 73, kapitel: "II", abschnitt: "Gracklstugh", text: "The fortress in the rock on the far shore of the lake." }
        ]
      }
    ]
  },

  /* ---------- THE BESTIARY ---------- */
  bestiarium: [
    { name: "Venomfang", bild: "venomfang.jpg", status: "besiegt", ort: "The watchtower of Thundertree", text: "A green poison dragon that had made its lair in the crumbling watchtower. Its poison breath dealt the party a nasty blow until Barradin's hypnosis turned the tide." },
    { name: "Chasme", bild: "chasme.jpg", status: "besiegt", ort: "The prison in the Underdark", text: "A flying, insect-like demon with several wings and a long stinger. Appeared out of nowhere in the middle of the breakout and swooped down on the companions." },
    { name: "Vrock", bild: "vrock.jpg", status: "besiegt", ort: "The prison in the Underdark", text: "A vulture-like demon with ragged wings. Took down most of the guards before the companions struck it down as well." },
    { name: "Kuo-Toa", bild: "kuo-toa.jpg", status: "gefallen", ort: "The city by the underground lake", text: "A race of fish folk who lived on the shore of an underground lake. Some of them worshipped a false god, and in the city centre they turned on each other and on the companions. When Demogorgon came, they all perished, and nothing remained of their city but ruins." },
    { name: "Ploopploopeen", bild: "ploopploopeen.jpg", status: "gefallen", ort: "The city by the underground lake", text: "Archpriest of the kuo-toa. Asked the companions for help against the followers of a false god and smuggled them into his city as fake prisoners. He died when Demogorgon destroyed the city." },
    { name: "Demogorgon", bild: "demogorgon-karte.webp", status: "gesichtet", ort: "The underground lake", text: "A demon prince with two heads, tentacle arms and a long tail. His scream snuffed out all magic, and the companions escaped only by luck. Friedrich punched him anyway. Or so he says." }
  ]
};
