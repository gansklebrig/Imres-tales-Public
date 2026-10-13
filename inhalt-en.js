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
        "Wherever the elven bard Barradin turns up, things do not stay quiet. He sings ballads, whirls burning torches through the air and turns somersaults until the crowd cheers. He knows he is good, and his self-confidence is contagious.",
        "His sharpest weapon is his tongue. With mockery and wit he throws opponents off balance, and many a foe has quite literally collapsed under his insults. That he, clumsy as ever, sometimes trips over his own feet in the heat of battle is all part of his charm.",
        "Barradin grew up in the house of his father, a zealous member of the <em>Alternative for Elves</em>. Today he deliberately walks a different path. At the side of a human, a druid, a Darkin and a dog, he has learned that origin says nothing about a companion's worth, and he stands up for that with his full voice.",
        "You will usually find him pipe in hand, surrounded by a cloud of fragrant herb and with a broad grin on his face."
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
        "And so there we stood together: me, the pipe-smoking bard, next to a slyly grinning human with a bow and a dog, a horned druid who looked ready for any quarrel, and finally a Darkin whose motionless face gave away nothing of what was going on inside him … The round of introductions went, to put it kindly, a little bumpily.",
        "So Gundren came straight to the point. According to his information, a magic forge was to be found in an old, abandoned mine. Magical items had once been crafted there. Several powerful lords are burning with interest in it, and Gundren smelled a chance to expand his export business considerably. How exactly, he kept to himself. He had me at the words “magic forge” anyway.",
        "!gundren-treffen.jpg|Our first meeting with Gundren. This is where our adventure begins.",
        "Our first job sounded harmless: escort a cart of goods safely to Phandalin. And whoever tracked down Elmar Barton there could look forward to an extra helping of gold. Echo's eyes lit up brighter than any torch at that.",
        "!aufbruch-neverwinter.jpg|Setting out from Neverwinter. Spirits on the driver's bench were high.",
        "## Ambush on the Road",
        "For several days the cart rolled along peacefully, and I had already begun composing a song about boring journeys. Then the way was suddenly blocked: a raided, half-burned wagon lay across the road. A shiver ran down my companions' spines and mine; every one of us knew at once that something was amiss. When a handful of goblins leapt out of the woods moments later, our little band was long since ready and stepped up to meet them. Thanks to a few missed attacks on our part, the fight was harder than expected, but in the end we struck the goblins down.",
        "!hinterhalt-sieg.jpg|The goblins are down, and the cart came through without a scratch.",
        "## The Goblin Cave",
        "I do not know whether we had tasted blood or whether the hope of a reward was driving us … Instead of simply moving on, our newly formed band of heroes decided to follow the tracks into the forest.",
        "We came across more goblins, who met their end more quickly this time. Echo was able to follow the bandits' tracks through the forest, and we found a cave in a gloomy cleft in the rock.",
        "At the mouth of the cave, several tethered wolves awaited us. Their whimpering cut right through me, so we promptly set them free. Then it was into the goblin nest, partly in silence from the shadows, partly with anything but restraint. <em class=\"aside\">Which part of that was mine, I would rather leave open.</em> In the end the chieftain and his entire band lay on the ground, and four sweaty, rather pleased adventurers and their dog stepped back into the daylight.",
        "!woelfe-befreit.jpg|The freed wolves in the goblin cave. Friedrich was clearly the driving force here.",
        "## Phandalin and the Red Robes",
        "At last our cart rolled into Phandalin, a small village. First things first: off to the tavern! There was eating and drinking until no one could manage another bite, and we haggled the innkeeper down to remarkably cheap rooms. Only then did the search for information begin. The companions roamed the lanes, spoke with the villagers and tried to find out what was going on. But people were tight-lipped and avoided our eyes, and it soon became clear that all was not well here.",
        "The breakthrough came, naturally, from me. In the tavern I struck up a song and sang until I had the locals completely under my spell. Then tongues loosened: a gang calling itself the Red Robes was extorting protection money from the townsfolk and had dug itself in at Castle Crackmore, right at the edge of the village. The fear in their voices made me furious.",
        "Before moving against the gang, our band paid a visit to the mayor of Phandalin. All we really wanted was to negotiate a juicy reward, but the conversation escalated rather quickly … Our demands were, to put it gently, excessive, and perhaps a little condescending … The whole affair very nearly ended in an outright quarrel, but in the end we managed to defuse the situation and move on with the prospect of a reward for breaking up the gang.",
        "!buergermeister-streit.jpg|Negotiating with the mayor of Phandalin. It went … let's say, lively.",
        "## Castle Crackmore",
        "By chance we found a secret way into the old, vine-covered castle and climbed down through partly collapsed, dusty tunnels into a cave that lay beneath the estate. Here we found a few enemies guarding several hostages from the village, held captive in a small cell. We overpowered the guards and freed those who had been dragged away from the village.",
        "We took the enemies' red robes so that, thus disguised, we could venture further into the castle ruins. <em class=\"aside\">Although Ezekiel, in his scarlet armour, probably would not have stood out much even before.</em> We pushed ever deeper into the old walls, hearts in our throats with every step.",
        "Behind a closed door we found an alchemist's room, or at least the walls were covered in herbs. In several cabinets and a display case stood jars holding all sorts of captured creatures, some alive, some dead and floating in liquid. Eyes and tongues; it hardly bears imagining what else could be found there. On top of that, a strong smell of fire hung in the air. I tried to explore the room stealthily, but clumsy as I am, I bumped into one of the cabinets, and one of the vials fell to the floor …",
        "At that, the other door opened, and before us stood Glasstaff, the leader of the Red Robes! He was furious about my clumsiness, and only with great effort could I convince him that we were the new recruits, ready for work … Luckily he believed us and sent us away.",
        "In the next room we found a group of four Red Robe followers, drinking merrily and playing a game of dice. We mingled with them and got our enemies to drink even more … When they were all so drunk that we probably looked like twelve to them, Ezekiel deftly stabbed the first one with his dagger, and we used the moment of surprise to kill the rest.",
        "Then it was Glasstaff's turn, and we cornered him in his secluded laboratory. He attempted a laughable attack on us, but soon realised that his followers could no longer help him, and he fled through a secret passage at the far end of his room. I sprinted after him, grabbed him at the decisive moment and dragged him back into the room with all my strength, and Friedrich seized the chance to bring him down with a perfectly placed arrow between the eyes!",
        "!glasstab-besiegt.jpg|After the victory over Glasstaff, still wearing the captured red robes.",
        "With his last breath, Glasstaff spoke of a certain Spider whom he apparently served. Is it a person, a power, a secret order? Questions upon questions, and they weighed on Friedrich most of all.",
        "Back in Phandalin the heroes of the day spread the good news, and after an intense discussion about what “the Spider” might possibly mean, it did not take long before we were celebrating with the freed prisoners and other villagers deep into the night.",
        "!siegesfeier.jpg|Our victory feast in Phandalin. My horn holds nothing but juice, by the way.",
        "After the celebration we went to the mayor to collect our reward, and it proved just as awkward as our first visit. <em class=\"aside\">Let us put it this way: he will not be inviting us back any time soon.</em>",
        "## The Prisoner in the Watchtower",
        "At this point I must confess: my memory of the days that followed is a little … hazy. <em class=\"aside\">Perhaps it was the herb in my pipe.</em>",
        "After our victory over the Red Robes, the next task was already waiting for us, at any rate. From whom, and why? We were to free a prisoner from a watchtower, a prisoner about whom nobody knew anything, not even his name.",
        "First we made a round of the tower to get the lay of the land, then the companions slipped in at a favourable spot. The surprise worked: before the guards knew what had hit them, they were facing four adventurers and a growling dog.",
        "But then a huge bugbear stood before us and gave us a thorough beating. <em class=\"aside\">In my memory he was at least ten feet tall. At least.</em> In the end, though, he too went down.",
        "Among the foes was also a dark elf named Nezna, who fought us fiercely. When the battle was lost, she had one more surprise in store: she was a shapeshifter. In the blink of an eye she turned into a small animal and scurried away, faster than any of us could follow. Before she vanished, though, she too spoke of the Spider. <em class=\"aside\">I am fairly sure she said “the Spider”. Fairly.</em>",
        "## Gundren's Brother",
        "The prisoner was saved, and when he introduced himself, the whole band was astonished: it was Nundro, Gundren's twin brother. <em class=\"aside\">Nundro, not Nando … right?</em>",
        "Together with him we returned to Gundren, who swept his brother into his arms with overflowing joy. I admit, even I felt a little warm around the heart at the sight.",
        "## The Magic Forge",
        "Then things got serious. Gundren gave us the task everything had been leading up to: we were to find the magic forge.",
        "The way led us into the old, abandoned mine where it was said to be hidden. We found our way through the enormous cavern, climbed down ravines and crept through crumbling, cobweb-draped corridors built long, long ago.",
        "Foe after foe stood in our way, but we struck down the old, rattling skeletons as well as the bat-like creatures that leapt at us from the ceiling! Some of those fights were truly hard. <em class=\"aside\">How many were there exactly? Many. Very many. More than I can count on two hands, I believe.</em>",
        "At the end of one of those corridors an old acquaintance was waiting: Nezna, the drow who had slipped away from us in the watchtower as a small animal. We were not going to be fooled by her a second time. I used my talents as a glamorous bard and cast a manipulation spell that kept her from attacking us from afar, Echo battered her and her two mercenaries with his lightning magic, and they barely survived the blast! Friedrich promptly brought down one of the mercenaries with an arrow, while Rex kept the second at bay and bit him in the leg! Ezekiel used the distraction, crept up on Nezna and drove his dagger deep into her back! Gurgling blood, Nezna sank to her knees, her hands pressed in disbelief to the spot on her chest where the dagger had pierced her, quickly turning scarlet … With her last strength she rasped, “The Spider will come for you,” before she finally collapsed!",
        "We defeated the last mercenary with ease – his will to fight was broken, he defended himself in a panic, but it did him no good, and moments later he lay motionless beside his employer and the other mercenary on the cold floor of the cave …",
        "We went deeper still in search of our goal, and for a moment we thought it might all be just a myth, but in the end we stood before it: the magic forge, surrounded by glowing runes. For a moment everything was still, and I even forgot to say something clever. How many generations had crafted magical items here, how many battles had been fought to bring it under someone's control?",
        "Our band cleared the last remaining guardians of the forge out of the way, and then at last it was ours!",
        "We made camp and considered how we wanted to proceed.",
        "!magische-schmiede.jpg|A rest before the magic forge. And no, I was not showing off.",
        "In the end it was back to Gundren, to bring him the good news and to tell him and his patrons that the magic forge had been found and its guardians dealt with.",
        "## Neverwinter",
        "We returned to Neverwinter, the city in whose harbour it had all begun. Whoever performs great deeds ought to tell of them, after all, and where better than in the great city? No sooner had we secured a room at an inn than we “requested” an audience with the Lords' Alliance.",
        "It did not go entirely by protocol. Somewhat clumsily and rather boldly, our band marched straight past the guards to the head of the Alliance, Captain Dolgrimson. He was not exactly pleased, but when we told him that, on Gundren's behalf, we had tracked down the magic forge and freed it, his mood improved noticeably.",
        "Even so, he put us off until the following day: there would be time for a conversation only later.",
        "So it was off through the streets of Neverwinter on our own; we listened in taverns and at market stalls and tried to catch rumours, to make use of the time and earn a little more coin … But without success, and in the evening we returned to our inn. After a few drinks at the bar the day came to an end, and our heroes slept soundly in their beds. After a few weeks on the road, it felt simply wonderful to lie in a soft, clean bed!",
        "## The Lords' Alliance",
        "At last it was back to the Alliance. After a long conversation the decision was made: our band of heroes would join the Lords' Alliance and lend it our strength. A bard among the ranks of the lords. I liked the sound of that.",
        "## Thundertree",
        "No sooner had we joined the Alliance than our first assignment awaited. Captain Dolgrimson sent us to Thundertree, a small, abandoned village a little east of Neverwinter. We were to look into matters there …",
        "Thundertree greeted us with a silence that crept straight under my skin: a handful of houses that seemed deserted, and towering over them all a large, half-ruined watchtower, its walls gnawed by moss and rot.",
        "## The Dragon in the Tower",
        "The companions crept up through the tower. Step by step, wondering what might await them there … On the topmost platform, fate struck: a young green dragon attacked, a poison-breathing horror with huge claws and teeth just waiting to tear us apart … A Venomfang!",
        "The fight was brutal. Then came my great moment: with my magic I drew the dragon into a hypnotic trance, and my companions seized the chance to get into position. <em class=\"aside\">I mention this only for the sake of completeness. And because it was magnificent.</em> In the end the Venomfang fell to our combined strength and many well-aimed attacks!",
        "But his poison breath had dealt us a nasty blow. My lungs were still burning hours later, and the others bore the marks of that brutal fight too. The dragon's poison had struck Echo and Ezekiel head-on and left grievous wounds, and Friedrich was very nearly scalped by a claw.",
        "So we survived only by a hair, and the priority right then was to catch our breath, tend to our wounds, fill my pipe and then, of course, gather the loot. Echo, as you might imagine, was particularly thorough.",
        "!venomfang-besiegt.jpg|The Venomfang is defeated. I treat myself to a pipe, and Rex has already claimed his share of the loot.",
        "## The Abandoned Village",
        "Then it was the rest of the village's turn. Zombies lurked in some of the seemingly empty houses, but thanks to our long rest they could barely trouble us anymore. In front of one house stood a statue that stopped Ezekiel in his tracks: he recognised it as his uncle. <em class=\"aside\">He said nothing more about it. Of course he didn't.</em>",
        "More fights followed, against blights, against two giant spiders and against yet more blights, until Echo unleashed an enormous fireball and solved the problem his own way. I can still feel the heat on my face.",
        "!ilvara-druidin.webp|Ilvara as she appeared to us: venerable, kindly and with a fox. What could possibly go wrong?|schmal",
        "In the last house, at long last, waited a druid who introduced herself as Ilvara. Dressed all in green, a fox upon her shoulders and a little sparrow on her foot, she looked like a guardian of the forest. It smelled of stew; we spotted a simmering pot and hoped for a warm meal. The rest of the room was filled with gathered herbs, tinctures and handwritten notes on the nature and the animals of this part of the forest bordering the village.",
        "None of us suspected anything when she invited us into her home … <em class=\"aside\">To this day that annoys me more than I care to admit.</em>"
      ],
      fortsetzung: "Continued in Chapter II …"
    },
    {
      nummer: "II",
      titel: "The Underdark",
      absaetze: [
        "## The Herbal Mist",
        "!ilvara-wahr.webp|Ilvara Mizzrym in her true form. Not much left of the guardian of the forest.|schmal links",
        "The moment we stepped into Ilvara's house, a sweet, poisonous vapour filled the air. One after another the heroes sank to the floor, and everything went black before my eyes. The friendly druid was in truth a shapeshifter who had drugged us with an herbal mist, and she carried us all off. Her true face we would only see later: Ilvara Mizzrym, a drow.",
        "## Captured",
        "None of us knew how much time had passed when we came to. <em class=\"aside\">A few hours? Days? Either way, I slept splendidly.</em> The whole band lay in chains, deep beneath the earth, in a prison-like chamber under lock and key. Guards stood outside the bars, glaring in grimly. For the first time on this journey, I was truly afraid.",
        "Then Echo had a brilliant idea: he turned into a rat, slipped out of the cell unnoticed and found our gear in a neighbouring room. Still in animal form, he brought everything back to us. <em class=\"aside\">Simply brilliant, Echo!</em>",
        "## The Breakout",
        "As soon as everyone held their weapons again, I did not hesitate. I insulted the guards so thoroughly and so artfully that they charged at us in a blind rage. Only now did it become clear that most of the enemies had been out of sight: they were waiting next door, beyond bridges on another platform, heard the clash of battle and came storming in.",
        "And then, out of nowhere, demons appeared in the middle of the fight. A chasme, a flying, insect-like abomination with several wings and a long stinger, swooped down on us, while a vrock, a vulture-like demon, fell upon our enemies. I have heard many things in my life, but I will never forget that buzzing.",
        "The fight was hard. The demons may have taken down most of the enemies, but in the end it was the companions who struck down both demons and the last remaining foes.",
        "Only one escaped: Ilvara, the drow shapeshifter. She leapt from the bridge into the river rushing far below and was gone.",
        "Afterwards our captors' hideout was searched thoroughly, with Echo leading the way, naturally. Some loot turned up. And a spider statue. It received a fresh coat of paint from us, at first just with an extra beard, but it quickly turned into phallic symbols and similar scribblings. Childish? Perhaps. Liberating? Absolutely.",
        "## Through the Webs",
        "Ever deeper the path led into the Underdark. Thick spider webs blocked the way, and in places we even had to balance across them. A few spiders did stand in our way, but Ezekiel and Friedrich quickly secured victory over the eight-legged foes with a handful of perfect hits.",
        "In one of the spider cocoons a surprise was waiting: a gnome named Fagas, captured but still alive. He told us of a magical temple to which Arafil of the Red Seat, a wizard, had sent him and his troop.",
        "Fagas went on to explain that his group had been sent to find a mysterious tomb: the resting place of the wizard Khaem, a Netherese mage who had lived some 3,000 years ago. A master of the magical Weave from a long-vanished high civilisation. Echo immediately smelled treasure.",
        "## The Wizard's Tomb",
        "Our way through the Underdark now revealed a surprisingly beautiful side: sparkling rivers, glowing mushrooms, an entire realm bathed in soft light. For a moment I almost forgot where we were. It was not long, however, before first spider monsters and later ettercaps stood in our way. The heroes slew them all and fought their way deeper into the depths.",
        "One of the fights took place in a ruin: a half-collapsed settlement that had vanished into the deep black of the abyss, save for its last few houses. Only thick spider webs still held those last houses in place. One wrong step, and it would have been a long fall into nothing.",
        "!unterreich-spinnweben.jpg|Making our way through the webs of the Underdark. Perfectly relaxed, as you can see.",
        "In a temple-like house our band discovered yet another spider statue. And as this one, too, received its new make-up, a secret passage opened up, quite by chance!",
        "No sooner had we entered it than a voice rang out in our heads, pleading for help. An icy shiver ran down my spine. The magical Weave, it seemed, was twisted in this place. Carefully we went deeper into the enchanted tomb, until a hidden switch turned up behind a statue.",
        "When we pulled it, a spectral figure appeared and spoke in unintelligible words. Then unholy energy formed a terrifying foe: a wraith. After a hard fight it was defeated, and our reward was a weapon of which legends already speak: Dawnbringer, a magic sword.",
        "## The Underground Lake",
        "After leaving the tomb we crossed yet more webs, ever deeper into the caves, until an underground lake opened up before us. On its shore the band met a group of kuo-toa, a race of fish folk.",
        "Their leader was Ploopploopeen, an archpriest. <em class=\"aside\">Ploopploopeen. For quite a while I called him Blublupin. He did not hold it against me. I think.</em> He asked us for help: part of his city at the edge of the lake was worshipping a false god: Demogorgon. After some discussion it was settled: we trust him.",
        "Ploopploopeen's plan: he would pretend to tie us up and smuggle us into the city. The plan worked, at least until we reached the city centre. Walking bound through a strange city is no fun, by the way, even when the ropes are only for show.",
        "## Demogorgon",
        "There a fight broke out among the kuo-toa at once. The false archpriestess attacked Ploopploopeen, more fish folk joined in, and within moments there was utter chaos.",
        "!kuo-toa-stadt.jpg|Chaos in the city of the kuo-toa. I provide the fitting soundtrack.",
        "In the middle of the melee a bound dwarf turned up among the enemies. While the fight was still raging, the companions managed to free him. His name was Kardal, and he claimed to be a scout of his city who had been captured by the fish folk.",
        "!demogorgon.webp|Demogorgon, Prince of Demons.|frei",
        "Then something rose from the lake: Demogorgon. A demon prince, a true demon god. Two heads, two arms with two tentacles each, a long tail and two legs that made the ground tremble. He let out an ungodly, terrifying scream, all magic was snuffed out, and our knees began to shake. <em class=\"aside\">I admit: mine were only shaking out of solidarity.</em>",
        "Friedrich was not deterred. He drew his bow and loosed an arrow at Demogorgon. The effect: none. Absolutely none. Nevertheless, Friedrich has insisted ever since that he punched a god.",
        "The monster set about destroying the city. With its tentacle arms it crushed buildings, foes and allies alike. We ran as I have never run before and, with a great deal of luck, reached a boat. Kardal escaped with us. Ploopploopeen and all the other kuo-toa perished, and nothing remained of their city but a few ruins.",
        "!flucht-see.jpg|Fleeing across the lake. Friedrich is still very proud of himself to this day.",
        "## Gracklstugh",
        "Our flight across the lake finally brought us to a breathtaking sight: a fortress hewn into the rock, towering behind mighty city walls above the city of Gracklstugh. After everything that lay behind us, it was almost too beautiful to be true.",
        "!gracklstugh.jpg|Arriving at Gracklstugh. Kardal leads the way.",
        "## The King's Son",
        "Grim guards stood at the city gate, but after Kardal had exchanged a few words with them, they let us pass without further ado. That alone should have made me suspicious.",
        "Beyond the gate lay a marketplace, one of the city's great trading squares. We did not linger there for long, but headed straight for a tavern and first of all ate long and very well. <em class=\"aside\">After fish folk, a demon god and a flight across the lake, we had honestly earned it.</em>",
        "In the middle of our meal, four armoured figures suddenly entered, marched up to our table and saluted. To Kardal. And so the truth came out: our humble scout is in fact the king's son! <em class=\"aside\">A prince. I had suspected as much. Well, almost.</em>",
        "## At the Court of King Horga",
        "!koenig-horga.webp|King Horga Stahl V. His beard alone has more dignity than all of Phandalin.|schmal",
        "The soldiers brought us to a keep, before King Horga Stahl V. As befits a bard, I struck up a song and told the king of Demogorgon and of how we had rescued his son. The king granted us leave to stay in the city. <em class=\"aside\">Whether that was down to the song or to the rescue of his son, let us leave open.</em>",
        "The stay was not easy on us, though. The air down here took its toll, on Echo most of all, who woke with clear signs of exhaustion.",
        "## Shopping in Gracklstugh",
        "What does a band of heroes do in a strange city? Exactly: go shopping. We stocked up on healing potions, and I acquired a flute of illusions and a few magic potions besides. <em class=\"aside\">You never know when you will need to enchant an audience. Or an enemy.</em>",
        "## The Raging Giant",
        "!riese.webp|The giant, shortly before we calmed him down. Judging by his look, he still hears the voices.|frei",
        "Suddenly we heard screams and the crash of houses, and already a giant stood before us and attacked. With our combined strength we managed to stun him and tie him up.",
        "Shortly afterwards a second giant appeared, but this one thanked us. He could not explain his kinsman's outburst. Apparently voices in his head had driven him to it. Voices in his head … a chill ran down my spine.",
        "As thanks, he invited us to speak with the Stonespeaker. What an honour!"
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
          { name: "The Magic Forge", x: 71.3, y: 75, kapitel: "I", abschnitt: "The Magic Forge", text: "Hidden deep within an old, abandoned mine. Nezna falls along the way, and after hard-fought battles the forge belongs to the party." },
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
          { name: "Gracklstugh", x: 19, y: 73, kapitel: "II", abschnitt: "Gracklstugh", text: "The fortress in the rock. Kardal turns out to be a prince, the king grants us hospitality, and a giant rampages through the city." }
        ]
      }
    ]
  },

  /* ---------- THE BESTIARY ---------- */
  bestiarium: [
    { name: "Venomfang", bild: "venomfang.jpg", status: "besiegt", ort: "The watchtower of Thundertree", text: "A kind of young green poison dragon. This one had made its lair in the crumbling watchtower. Its poison breath dealt the party a nasty blow until Barradin's hypnosis turned the tide." },
    { name: "Chasme", bild: "chasme.jpg", status: "besiegt", ort: "The prison in the Underdark", text: "A flying, insect-like demon with several wings and a long stinger. Appeared out of nowhere in the middle of the breakout and swooped down on the companions." },
    { name: "Vrock", bild: "vrock.jpg", status: "besiegt", ort: "The prison in the Underdark", text: "A vulture-like demon with ragged wings. Took down most of the guards before the companions struck it down as well." },
    { name: "Kuo-Toa", bild: "kuo-toa.jpg", status: "gefallen", ort: "The city by the underground lake", text: "A race of fish folk who lived on the shore of an underground lake. Some of them worshipped a false god, and in the city centre they turned on each other and on the companions. When Demogorgon came, they all perished, and nothing remained of their city but ruins." },
    { name: "Ploopploopeen", bild: "ploopploopeen.jpg", status: "gefallen", ort: "The city by the underground lake", text: "Archpriest of the kuo-toa. Asked the companions for help against the followers of a false god and smuggled them into his city as fake prisoners. He died when Demogorgon destroyed the city." },
    { name: "Demogorgon", bild: "demogorgon-karte.webp", status: "gesichtet", ort: "The underground lake", text: "A demon prince with two heads, tentacle arms and a long tail. His scream snuffed out all magic, and the companions escaped only by luck. Friedrich punched him anyway. Or so he says." }
  ],

  /* ---------- THE QUEST BOARD (same structure as inhalt.js; abschnitt = English "## " heading) ---------- */
  questtafel: {
    karten: [
      { id: "glasstab", x: 2, y: 4, b: 17, dreh: -4,
        kurz: "Glasstaff †<small>“the Spider …”</small>",
        label: "Clue", titel: "Glasstaff",
        text: "Leader of the Red Robes in Phandalin. Before he fell to Friedrich's arrow, he spoke with his last breath of the Spider, whom he apparently served.",
        kapitel: "I", abschnitt: "Castle Crackmore" },
      { id: "nezna", x: 17.5, y: 3.3, b: 16, dreh: 3,
        kurz: "Nezna †<small>Drow · in the mine</small>",
        label: "Clue", titel: "Nezna",
        text: "A dark elf who fought us fiercely in the watchtower. When the battle was lost, she turned into a small animal and escaped. Before that, she too spoke of the Spider. Later, as we searched the old mine for the magic forge, she stood before us once more, and this time she did not get away.",
        kapitel: "I", abschnitt: "The Magic Forge" },
      { id: "spinne", haupt: true, skizze: "spinne", x: 36, y: 5, b: 28, dreh: -1,
        kurz: "Who is the Spider?",
        label: "Above all else", titel: "Who is the Spider?",
        text: "A person, a power, a secret order? Ever since Castle Crackmore this question has not let us go, and the deeper we dig, the more often we run into eight legs.",
        hinweise: [
          "Glasstaff, leader of the Red Robes, served the Spider.",
          "The drow Nezna spoke of the Spider too, before we finished her off in the mine.",
          "Friedrich is the one it bothers most."
        ],
        kapitel: "I", abschnitt: "Castle Crackmore" },
      { id: "ilvara", bild: "skizze-ilvara.webp", zeichnung: true, format: "2/3", pos: "50% 0%", x: 2.7, y: 41.1, b: 13, dreh: -2,
        kurz: "Ilvara Mizzrym",
        label: "Escaped", titel: "Ilvara Mizzrym",
        text: "Posed as a friendly druid in Thundertree, knocked us out with a herbal mist and dragged us into the Underdark. During our breakout she leapt from the bridge into the river. None of us believes that was the end of her.",
        kapitel: "II", abschnitt: "The Breakout" },
      { id: "demogorgon", bild: "skizze-demogorgon.webp", zeichnung: true, format: "4/3", pos: "50% 50%", x: 73.7, y: 12.1, b: 20, dreh: 3,
        kurz: "Demogorgon<small>Why did he wake?</small>",
        label: "Ominous", titel: "Why did Demogorgon awaken?",
        text: "A demon prince rose from the lake and razed the city of the kuo-toa. Friedrich punched him. It did not stop him.",
        hinweise: ["Some of the kuo-toa worshipped him as a false god.", "His scream snuffed out all magic.", "Demons already appeared out of nowhere during our breakout.", "Where he went afterwards, nobody knows."],
        kapitel: "II", abschnitt: "Demogorgon" },
      { id: "gracklstugh", bild: "gracklstugh.jpg", format: "16/9", pos: "50% 50%", x: 34.5, y: 52.1, b: 25, dreh: 1,
        kurz: "Gracklstugh<small>What's going on?</small>",
        label: "We are here", titel: "What is going on in Gracklstugh?",
        text: "The king has granted us hospitality, but we do not entirely trust this city.",
        hinweise: ["The air down here wears on us, on Echo most of all.", "A giant attacked us, driven by voices in his head.", "A second giant invited us to speak with the Stonespeaker."],
        kapitel: "II", abschnitt: "At the Court of King Horga" },
      { id: "kardal", skizze: "krone", x: 57.5, y: 67.5, b: 13, dreh: 5,
        kurz: "Prince Kardal",
        label: "Solved", titel: "Prince Kardal",
        text: "We found him bound in the middle of the kuo-toa chaos, and he passed himself off as a simple scout of his city. Then, in Gracklstugh, four soldiers saluted him: Kardal is the king's son.",
        hinweise: ["Escaped across the lake with us in the boat.", "Because of him, the guards let us into the city.", "His father is King Horga Stahl V."],
        kapitel: "II", abschnitt: "The King's Son" },
      { id: "riese", bild: "skizze-riese.webp", zeichnung: true, format: "4/5", pos: "50% 8%", x: 79.7, y: 53.2, b: 12, dreh: -3,
        kurz: "Voices in his head?",
        label: "Puzzling", titel: "Voices in His Head",
        text: "A giant attacked us in the middle of Gracklstugh. A second giant could not explain the outburst; apparently voices in his head had driven him. Whose voices?",
        kapitel: "II", abschnitt: "The Raging Giant" },
    ],
    faeden: [
      { von: "nezna", nach: "spinne", a1: [0.03, 0.144], a2: [0.488, 0.034], grund: "spoke of the Spider as well." },
      { von: "ilvara", nach: "spinne", a1: [0.856, 0.061], a2: [0.06, 0.432] },
      { von: "gracklstugh", nach: "riese", farbe: "gelb", grund: "the attack happened in the middle of the city." },
      { von: "spinne", nach: "glasstab", schnur: false, grund: "served the Spider and spoke of it with his last breath." },
      { von: "kardal", nach: "demogorgon", schnur: false, grund: "Kardal was right in the chaos when Demogorgon came." },
      { von: "nezna", nach: "ilvara", schnur: false, grund: "both drow, both shapeshifters. Coincidence?" },
      { von: "glasstab", nach: "nezna", schnur: false, grund: "both spoke of the Spider." },
      { von: "kardal", nach: "gracklstugh", schnur: false, grund: "Kardal is the son of Gracklstugh's king." },
      { von: "ilvara", nach: "demogorgon", schnur: false, grund: "demons appeared out of nowhere during our breakout from her dungeon." }
    ],
    notizen: [
      { text: "both:<br>“the Spider”!", x: 11.4, y: 15.2, b: 10, dreh: 7 },
      { text: "???", gross: true, x: 61, y: 40, b: 7, dreh: 8 },
      { text: "Invited to the Stone&shy;speaker!", x: 89.3, y: 79.1, b: 10, dreh: -8 },
      { text: "!!!", gross: true, x: 92.3, y: 10.9, b: 7, dreh: 10 },
      { text: "what is KARDAL hiding?", x: 63.3, y: 86.1, b: 11, dreh: 5 }
    ]
  },

  /* ---------- THE NPC DIRECTORY ---------- */
  nsc: [
    { gruppe: "The Surface", name: "Gundren", status: "verbuendet", rolle: "Dwarf, merchant and our first employer", text: "Rounded us up with a letter and set us on the trail of the magic forge. Knows everyone who matters." },
    { gruppe: "The Surface", name: "Nundro", status: "verbuendet", rolle: "Gundren's twin brother", text: "Sat nameless in the watchtower until we freed him. Nundro, not Nando." },
    { gruppe: "The Surface", name: "Captain Dolgrimson", status: "verbuendet", rolle: "Head of the Lords' Alliance, Neverwinter", text: "First put us off, then welcomed us into the Alliance and promptly sent us to Thundertree." },
    { gruppe: "The Surface", name: "The Mayor of Phandalin", status: "neutral", rolle: "Phandalin", text: "Paid up in the end. Probably never wants to see us again, though." },
    { gruppe: "The Surface", name: "Glasstaff", status: "tot", rolle: "Leader of the Red Robes", text: "Kept Phandalin in fear and served the Spider. Fell to Friedrich's arrow after Barradin dragged him back out of the secret passage." },
    { gruppe: "The Surface", name: "Nezna", status: "tot", rolle: "Drow and shapeshifter", text: "Fought us fiercely in the watchtower, spoke of the Spider and escaped as a small animal. We cornered her again in the mine of the magic forge, and this time she fell." },
    { gruppe: "The Underdark", name: "Ilvara Mizzrym", bild: "ilvara-wahr.webp", bildPos: "50% 8%", status: "feindlich", rolle: "Drow and shapeshifter", text: "Posed as a friendly druid in Thundertree, knocked us out with a herbal mist and dragged us into the Underdark. Escaped with a leap into the river." },
    { gruppe: "The Underdark", name: "Fagas", status: "verbuendet", rolle: "Gnome, rescued from a spider cocoon", text: "Told us about the tomb of the wizard Khaem, to which Arafil of the Red Seat had sent him and his troop." },
    { gruppe: "The Underdark", name: "Ploopploopeen", bild: "ploopploopeen.jpg", bildPos: "50% 25%", status: "tot", rolle: "Archpriest of the kuo-toa", text: "Smuggled us into his city as fake prisoners and died when Demogorgon destroyed it. Barradin called him Blublupin for quite a while." },
    { gruppe: "The Underdark", name: "Kardal", status: "verbuendet", rolle: "Dwarf, son of the king of Gracklstugh", text: "Found bound among the kuo-toa, passed himself off as a scout and fled across the lake with us. In Gracklstugh it came out that he is the king's son." },
    { gruppe: "The Underdark", name: "King Horga Stahl V", bild: "portrait-koenig.jpg", bildPos: "50% 50%", status: "neutral", rolle: "King of Gracklstugh, Kardal's father", text: "Listened to Barradin's song about Demogorgon and the rescue of his son, and granted us leave to stay in the city." },
    { gruppe: "The Underdark", name: "The Raging Giant", bild: "portrait-riese.jpg", bildPos: "50% 50%", status: "unklar", rolle: "Giant in Gracklstugh", text: "Attacked us in the middle of the city until we managed to stun him and tie him up. Another giant believes voices in his head drove him to it." }
  ],

  kunst: [
    { bild: "skizze-demogorgon.webp", titel: "Demogorgon", text: "Seen at the underground lake. Friedrich punched him." },
    { bild: "skizze-ilvara.webp", titel: "Ilvara", text: "The “druid” of Thundertree, with her lynx." },
    { bild: "skizze-ploopploopeen.webp", titel: "Ploopploopeen", text: "Archpriest of the kuo-toa." },
    { bild: "skizze-ettercap.webp", titel: "Ettercap", text: "One of many in the webs of the Underdark." },
    { bild: "skizze-riese.webp", titel: "The Raging Giant", text: "Gracklstugh. Voices in his head?" },
    { bild: "skizze-chasme.webp", titel: "Chasme", text: "Appeared out of nowhere in the middle of our breakout." },
    { bild: "skizze-turm.webp", titel: "The Tower of Thundertree", text: "Where the Venomfang was waiting." },
    { bild: "skizze-ketten.webp", titel: "In Chains", text: "How we woke up in the Underdark." },
    { bild: "skizze-laute.webp", titel: "Barradin's Lute", text: "The party's most important weapon." }
  ]
};
