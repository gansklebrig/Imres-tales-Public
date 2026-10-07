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
        "It began with a letter. Each of the heroes received an invitation from Gundren, a dwarf and merchant who seems to know everyone worth knowing. The meeting place was the harbour of Neverwinter: creaking piers, fishing boats, merchants and sailors, and over it all the smell of salt and tar.",
        "And so there they stood together: an elf with a pipe, a human with a bow and a dog, a horned druid and a silent Darkin. The round of introductions went, to put it kindly, a little bumpily. <em class=\"aside\">Mostly I remember introducing myself splendidly.</em>",
        "Gundren came straight to the point. Deep within an old, abandoned mine lies a magic forge where magical items were once crafted. Several powerful lords are burning with interest in it, and Gundren smells a chance to expand his export business considerably. How exactly, he kept to himself.",
        "The first job sounded harmless: escort a cart of goods safely to Phandalin. And whoever tracked down Elmar Barton there could look forward to an extra helping of gold.",
        "## Ambush on the Road",
        "For several days the cart rolled along peacefully. Then the way was suddenly blocked: a raided, half-burned wagon lay across the road. The companions sensed at once that something was amiss. When a handful of goblins leapt out of the woods moments later, they were ready, and the fight was over before it had properly begun.",
        "## The Goblin Cave",
        "Instead of simply moving on, the party decided to follow the tracks into the forest. Phandalin would surely be grateful to see an end to the goblin plague, and there was bound to be loot as well.",
        "At the mouth of the cave they came upon several tethered wolves, which they promptly set free. Then they stormed the goblin nest, partly in silence from the shadows, partly with anything but restraint. <em class=\"aside\">Which part of that was mine, I would rather leave open.</em> In the end the chieftain and his entire band lay on the ground, and the companions stepped victorious back into the daylight.",
        "## Phandalin and the Red Robes",
        "At last the companions reached Phandalin, a small village. First things first: they settled into the tavern, ate and drank to their hearts' content and haggled the innkeeper down to remarkably cheap rooms. Only then did they set out in search of information. They roamed its lanes, spoke with its people and tried to find out what was going on. But the villagers were tight-lipped, and it soon became clear that all was not well here.",
        "The breakthrough came from Barradin. In the tavern he struck up a song and sang until he had the locals completely under his spell. Then tongues loosened: a gang calling itself the Red Robes was extorting protection money from the townsfolk and had dug itself in at Castle Crackmore, right at the edge of the village.",
        "Before moving against the gang, the companions paid a visit to the mayor of Phandalin. Their goal: to negotiate a reward, and a handsome one at that. The conversation, however, turned extremely awkward. Their demands were, to put it gently, excessive, the mood soured, and the whole affair very nearly ended in an outright quarrel. <em class=\"aside\">I would call it confident.</em>",
        "## Castle Crackmore",
        "The party gained entry to the castle. First they freed a prisoner and, in doing so, seized a few red robes, which from then on served as their disguise. <em class=\"aside\">Although Ezekiel, in his scarlet armour, probably would not have stood out much even before.</em> In this way they pushed ever deeper into the old walls and took on the gang in several fights, one after another. <em class=\"aside\">How many fights there were, I no longer recall exactly. I was busy looking good in my red robe.</em>",
        "Last of all they confronted their leader, Glasstaff. When the fight turned against him, he tried to escape through a secret tunnel. But Barradin caught hold of him at the very last moment and hauled him back into the room, where Friedrich brought him down with a perfect headshot.",
        "!glasstab-besiegt.jpg|After the victory over Glasstaff, still wearing the captured red robes.",
        "With his last breath, Glasstaff spoke of a certain Spider whom he apparently served. Is it a person, a power, a secret order? To this day, nobody knows.",
        "Back in Phandalin the companions spread the good news and, while they were at it, tried to drive their reward up a little further. Then the tavern saw a wild celebration. Yet however loud it got, one thought would not let them go: the Spider, whatever may lie behind that name.",
        "!siegesfeier.jpg|The victory feast in Phandalin. Barradin's horn holds nothing but juice, by the way.",
        "After the celebration they went to the mayor to collect their reward, and it proved just as awkward as their first visit. <em class=\"aside\">Let us put it this way: he will not be inviting us back any time soon.</em>",
        "## The Prisoner in the Watchtower",
        "At this point your narrator must confess: his memory of the days that followed is a little … hazy. <em class=\"aside\">Perhaps it was the herb in my pipe.</em>",
        "After their victory over the Red Robes, the companions received a new task, at any rate. From whom, and why? They were to free a prisoner from a watchtower, a prisoner about whom nobody knew anything, not even his name.",
        "First they circled the tower to get the lay of the land, then slipped in at a favourable spot. The surprise worked, and the companions were upon the guards before they knew what had hit them.",
        "But then a huge bugbear stood before them and gave them a thorough beating. <em class=\"aside\">In my memory he was at least ten feet tall. At least.</em> In the end, though, he too went down.",
        "Among the foes was also a dark elf named Nezna, who fought the companions fiercely. When the battle was lost, she had one more surprise in store: she was a shapeshifter. In the blink of an eye she turned into a small animal and scurried away, faster than anyone could follow. Before she vanished, though, she too spoke of the Spider. <em class=\"aside\">I am fairly sure she said “the Spider”. Fairly.</em>",
        "## Gundren's Brother",
        "The prisoner was saved, and when he introduced himself, the companions were astonished: it was Nundro, Gundren's twin brother. <em class=\"aside\">Nundro, not Nando … right?</em>",
        "Together with him they returned to Gundren, who swept his brother into his arms with overflowing joy.",
        "## The Magic Forge",
        "Then things got serious. Gundren gave the companions the task everything had been leading up to: they were to find the magic forge.",
        "The way led into the old, abandoned mine where it was said to be hidden. The party fought its way through corridor after corridor and foe after foe, and some of those fights were truly hard. <em class=\"aside\">How many were there exactly? Many. Very many. More than I can count on two hands, I believe.</em>",
        "But in the end they stood before it: the magic forge, surrounded by glowing runes. The companions cleared the last guardians out of the way until the forge was theirs, then returned to Gundren to bring him the good news.",
        "!magische-schmiede.jpg|A rest before the magic forge. Barradin insists he was not showing off.",
        "## Neverwinter",
        "Only then did the party return to Neverwinter, the city in whose harbour it had all begun. Whoever performs great deeds ought to tell of them, after all, and where better than in the great city? No sooner had they secured a room at an inn than they requested an audience with the Lords' Alliance.",
        "It did not go entirely by protocol. Somewhat clumsily and rather boldly, the companions marched straight past the guards to the head of the Alliance, Captain Dolgrimson. He, however, put them off: there would be time for a conversation only later.",
        "So they wandered the streets of Neverwinter, listening in taverns and at market stalls and trying to catch rumours. Without success. <em class=\"aside\">I think. Or I have forgotten the rumours. Both are possible.</em>",
        "## The Lords' Alliance",
        "At last they returned to the Alliance. After a long conversation the companions made their decision: they would join the Lords' Alliance and lend it their strength."
      ],
      fortsetzung: "To be continued …"
    }
  ],

  /* ---------- THE JOURNEY ---------- */
  reise: {
    karte: "weltkarte.jpg",
    stationen: [
      { name: "The Harbour of Neverwinter", x: 21.5, y: 46, kapitel: "I", abschnitt: "The Invitation", text: "Gundren invites the heroes and offers them the search for a magic forge." },
      { name: "Ambush on the Road", x: 44.4, y: 72.9, kapitel: "I", abschnitt: "Ambush on the Road", text: "Just after turning off the High Road towards Phandalin. The goblins leaping from the woods never stand a chance." },
      { name: "The Goblin Cave", x: 45.7, y: 66.8, kapitel: "I", abschnitt: "The Goblin Cave", text: "Separated from the site of the ambush by just a small stretch of forest. Wolves freed, nest stormed, chieftain slain." },
      { name: "Phandalin", x: 57.8, y: 76.4, kapitel: "I", abschnitt: "Phandalin and the Red Robes", text: "A small village in the grip of the Red Robes. At its edge lies Castle Crackmore, where Glasstaff falls and speaks of the Spider." },
      { name: "The Watchtower", x: 67.7, y: 67.8, kapitel: "I", abschnitt: "The Prisoner in the Watchtower", text: "A bugbear falls, a drow escapes, and the prisoner turns out to be Gundren's twin brother Nundro." },
      { name: "The Magic Forge", x: 71.3, y: 75, kapitel: "I", abschnitt: "The Magic Forge", text: "Hidden deep within an old, abandoned mine. After hard-fought battles, it belongs to the party." },
      { name: "Neverwinter", x: 25.5, y: 43.8, kapitel: "I", abschnitt: "Neverwinter", text: "Back in the great city. Here the companions join the Lords' Alliance." }
    ]
  },

  /* ---------- THE BESTIARY ---------- */
  bestiarium: []
};
