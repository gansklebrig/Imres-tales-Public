/* =====================================================================
   STARTBÜHNE – Würfel des Spielleiters und ein runder Abschluss
   ---------------------------------------------------------------------
   1. Das Spielleiter-Zitat und ein großer W20 stehen nebeneinander
      („Imre, Herr über Würfel“). Wer würfelt, bekommt einen Kommentar
      von einem der Helden – bei einer 20 sprühen Funken, bei einer 1
      lästert Ezekiel. Würfe und bester Wurf des Tages bleiben gespeichert.
      300 Sprüche (DE/EN), gezogen wie aus einem Kartenstapel – Wiederholung erst, wenn alle einer Sorte dran waren.
   2. Die Taverne-Kachel ist doppelt breit (keine Lücke mehr im Raster).
   3. Ganz unten: Siegel „Fortsetzung folgt …“ statt eines abrupten Endes.
   Klänge nur, wenn die Tavernenklänge eingeschaltet sind.
   ===================================================================== */
(function () {
  "use strict";
  const uebersicht = document.getElementById("uebersicht");
  if (!uebersicht) return;
  const sprache = () => (document.documentElement.lang === "en" ? "en" : "de");
  const esc = s => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const ruhig = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const zufall = l => l[Math.floor(Math.random() * l.length)];
  const lies = k => { try { return localStorage.getItem(k); } catch (_) { return null; } };
  const schreib = (k, v) => { try { localStorage.setItem(k, v); } catch (_) {} };

  const HELDEN = {
    barradin: { name: "Barradin", bild: "barradin.jpg" }, friedrich: { name: "Friedrich", bild: "friedrich.jpg" },
    echo: { name: "Echo", bild: "echo.jpg" }, ezekiel: { name: "Ezekiel", bild: "ezekiel.jpg" }, rex: { name: "Rex", bild: "rex-guckt.webp" }
  };
  const TX = {
    de: {
      label: "Probe des Tages", titel: "Wirf für die Gruppe", werfen: "W20 werfen", nochmal: "Nochmal werfen",
      hinweis: "Ein Klick – und die Helden haben eine Meinung dazu.",
      heute: (n, b) => "Heute: " + n + (n === 1 ? " Wurf" : " Würfe") + " · bester Wurf: " + b,
      krit: "Natürliche 20!", patzer: "Patzer!",
      ende: "Fortsetzung folgt …", endeKlein: "Die nächste Sitzung schreibt das nächste Kapitel.", hoch: "↑ Zurück zur Halle"
    },
    en: {
      label: "Check of the day", titel: "Roll for the party", werfen: "Roll d20", nochmal: "Roll again",
      hinweis: "One click – and the heroes will have opinions.",
      heute: (n, b) => "Today: " + n + (n === 1 ? " roll" : " rolls") + " · best roll: " + b,
      krit: "Natural 20!", patzer: "Fumble!",
      ende: "To be continued …", endeKlein: "The next session writes the next chapter.", hoch: "↑ Back to the hall"
    }
  };
  const t = () => TX[sprache()];

  /* Sprüche: [Held, Deutsch, Englisch] – gezogen wie aus einem Kartenstapel, Wiederholung erst nach allen */
  const SPRUECHE = {
    krit: [
      ["barradin", "Eine natürliche 20! Ich schreibe sofort ein Lied darüber.", "A natural 20! I'm writing a song about it right now."],
      ["barradin", "Applaus! Applaus! Ach, ich applaudiere einfach selbst.", "Applause! Applause! Oh, I'll just applaud myself."],
      ["barradin", "Das war so schön, ich muss mich kurz setzen. Dann ein Lied schreiben. Dann noch eins.", "That was so beautiful I need to sit down. Then write a song. Then another."],
      ["barradin", "Ich widme diesen Wurf … mir. Wer sonst hätte ihn verdient?", "I dedicate this roll to … myself. Who else would deserve it?"],
      ["barradin", "Zwanzig! Selbst der Bürgermeister von Phandalin würde dafür zahlen. Freiwillig!", "Twenty! Even the mayor of Phandalin would pay for that. Willingly!"],
      ["barradin", "Holt die Laute, holt den Met, holt die Barden aus drei Königreichen – das wird besungen!", "Fetch the lute, fetch the mead, fetch the bards of three kingdoms – this shall be sung!"],
      ["barradin", "Eine 20. Ich spüre, wie mein Ruhm wächst. Er war vorher schon gewaltig, aber jetzt …", "A 20. I can feel my fame growing. It was already vast, but now …"],
      ["barradin", "Besser hätte ich es nicht würfeln können. Gut, genauso gut vielleicht. Aber nicht besser.", "I couldn't have rolled it better. Well, maybe just as well. But not better."],
      ["friedrich", "Mitten ins Schwarze. Rex, hast du das gesehen?", "Bullseye. Rex, did you see that?"],
      ["friedrich", "So trifft man einen Goblin auf hundert Schritt. Im Dunkeln. Bei Regen.", "That's how you hit a goblin at a hundred paces. In the dark. In the rain."],
      ["friedrich", "Ruhige Hand, klarer Blick. Ich bin fast ein bisschen stolz auf dich.", "Steady hand, clear eye. I'm almost a little proud of you."],
      ["friedrich", "Damit hätten wir Venomfang auch ohne einen einzigen Pfeil vertrieben.", "With that we'd have driven off Venomfang without a single arrow."],
      ["friedrich", "Ich schnitze diese Zahl in meinen Bogen. Gleich neben die anderen Glückstage.", "I'm carving that number into my bow. Right next to the other lucky days."],
      ["friedrich", "Eine 20. Der Wald hält kurz den Atem an.", "A 20. The forest holds its breath for a moment."],
      ["friedrich", "Selbst Rex hat aufgehört zu bellen. Das heißt was.", "Even Rex stopped barking. That means something."],
      ["echo", "Selbst die Bäume flüstern deinen Namen.", "Even the trees whisper your name."],
      ["echo", "Die Sterne stehen richtig. Die Pilze auch. Das kommt selten vor.", "The stars are aligned. So are the mushrooms. That rarely happens."],
      ["echo", "Ich verwandle mich vor Freude in einen Bären. Zur Sicherheit: Geht einen Schritt zurück.", "I'm turning into a bear out of joy. For your safety: step back."],
      ["echo", "Der Donnerbaum hätte sich vor diesem Wurf verneigt.", "Thundertree itself would have bowed to that roll."],
      ["echo", "Der Hain jubelt. Ich höre es. Die Eichhörnchen sind völlig außer sich.", "The grove rejoices. I can hear it. The squirrels are beside themselves."],
      ["echo", "Zwanzig. Diesen Würfel lege ich in meinen Hort. Gleich neben das Gold.", "Twenty. I'm putting that die in my hoard. Right next to the gold."],
      ["echo", "Die Natur hat gesprochen – und zwar ziemlich laut.", "Nature has spoken – and rather loudly."],
      ["echo", "Ich spüre die Wurzeln der Welt nicken.", "I can feel the roots of the world nodding."],
      ["ezekiel", "… Beeindruckend. Ich habe das nicht gesagt.", "… Impressive. I never said that."],
      ["ezekiel", "Eine 20. Lass mich raten: Du hast ihn vorher angehaucht. Alter Trick.", "A 20. Let me guess: you breathed on it first. Old trick."],
      ["ezekiel", "Gut gewürfelt. Ich hätte ihn trotzdem gestohlen, bevor du ihn wirfst.", "Nice roll. I'd still have stolen the die before you threw it."],
      ["ezekiel", "Selbst die Schatten applaudieren. Leise. Das machen Schatten so.", "Even the shadows applaud. Quietly. Shadows do that."],
      ["ezekiel", "Merkwürdig. Mein Dolch fühlt sich plötzlich eifersüchtig an.", "Strange. My dagger suddenly feels jealous."],
      ["ezekiel", "Ich sage es nur einmal und dann nie wieder: Respekt.", "I'll say this once and never again: respect."],
      ["ezekiel", "Glasstab wäre vor diesem Wurf geflohen. Noch schneller als sonst.", "Glasstaff would have fled from that roll. Even faster than usual."],
      ["rex", "WUFF! WUFF! WUFF!", "WOOF! WOOF! WOOF!"],
      ["rex", "*rennt drei Runden um den Tisch und bringt dir einen Stock*", "*runs three laps around the table and brings you a stick*"],
      ["rex", "*springt dir auf den Schoß, obwohl er viel zu groß dafür ist*", "*jumps into your lap even though he's far too big for it*"],
      ["rex", "*heult begeistert den Mond an. Es ist Mittag.*", "*howls excitedly at the moon. It is noon.*"],
      ["rex", "*legt dir stolz einen Goblinschuh vor die Füße*", "*proudly drops a goblin's shoe at your feet*"],
      ["rex", "*wedelt so heftig, dass er umfällt*", "*wags so hard he falls over*"]
    ],
    hoch: [
      ["barradin", "Das klingt nach einem Erfolg – und nach einer Ballade.", "That sounds like a success – and a ballad."],
      ["barradin", "Hübsch! Nicht ganz so hübsch wie ich, aber hübsch.", "Pretty! Not quite as pretty as me, but pretty."],
      ["barradin", "Damit überzeugst du jede Wache in Neverwinter. Mit meinem Charme dazu sogar zwei.", "That would convince any guard in Neverwinter. With my charm, even two."],
      ["barradin", "Ich spüre eine Strophe kommen. Reimt sich irgendwas auf „Würfelglück“?", "I feel a verse coming. Does anything rhyme with 'lucky roll'?"],
      ["barradin", "Gut! Dafür bekommst du Inspiration. Eine kleine. Leicht gebraucht.", "Good! You get inspiration for that. A small one. Slightly used."],
      ["barradin", "So ein Wurf verdient einen Trinkspruch. Und den Trinkspruch trinke ich.", "A roll like that deserves a toast. And I'll drink the toast."],
      ["barradin", "Mein Publikum wäre begeistert. Mein Publikum ist immer begeistert. Weil ich da bin.", "My audience would be thrilled. My audience is always thrilled. Because I'm there."],
      ["barradin", "Ein Wurf mit Stil. Fast so viel Stil wie mein Hut.", "A roll with style. Almost as much style as my hat."],
      ["barradin", "Das bringt Glanz in die Chronik. Um den Rest kümmere ich mich.", "That adds shine to the chronicle. I'll handle the rest."],
      ["barradin", "Bravo! Ich stimme die Laute schon mal um – auf Siegesmelodie.", "Bravo! I'm retuning the lute already – to victory."],
      ["barradin", "Damit hätte ich König Horga ein Lächeln abgerungen. Fast.", "With that I'd have wrung a smile out of King Horga. Almost."],
      ["friedrich", "Sauber. So würde ich auch zielen.", "Clean. That's how I'd aim."],
      ["friedrich", "Guter Wurf. Rex wedelt, also ist es offiziell.", "Good roll. Rex is wagging, so it's official."],
      ["friedrich", "Das reicht für ein Abendessen. Und für Nachschlag.", "That's enough for dinner. And seconds."],
      ["friedrich", "Ruhig atmen, loslassen, treffen. Genau so.", "Breathe calmly, let go, hit. Exactly like that."],
      ["friedrich", "Damit findest du jede Spur. Sogar Ezekiels. Na ja – fast.", "With that you'd find any trail. Even Ezekiel's. Well – almost."],
      ["friedrich", "Wer so würfelt, bekommt am Lagerfeuer den besten Platz.", "Whoever rolls like that gets the best spot by the campfire."],
      ["friedrich", "Das hätte die Goblins auf der Straße nach Phandalin ganz schön erschreckt.", "That would've given the goblins on the road to Phandalin quite a scare."],
      ["friedrich", "Nicht schlecht. Der Wald nickt anerkennend.", "Not bad. The forest nods approvingly."],
      ["friedrich", "Gute Sicht, guter Wind, guter Wurf.", "Good sight, good wind, good roll."],
      ["friedrich", "Damit treffe ich den Apfel auf Barradins Kopf. Darf ich?", "With that I'd hit the apple on Barradin's head. May I?"],
      ["friedrich", "Solche Würfe hätten wir im Unterreich gebraucht.", "We could have used rolls like that in the Underdark."],
      ["echo", "Die Natur ist dir heute wohlgesonnen.", "Nature favours you today."],
      ["echo", "Die Ranken sind zufrieden. Selten genug.", "The vines are pleased. Rare enough."],
      ["echo", "Ein Rabe hat es gesehen. Er erzählt es jetzt allen.", "A raven saw it. Now he's telling everyone."],
      ["echo", "Gut. Ich lasse dir zur Belohnung eine Eichel wachsen.", "Good. I'll grow you an acorn as a reward."],
      ["echo", "Der Wind dreht sich zu deinen Gunsten. Ich habe ein bisschen nachgeholfen.", "The wind turns in your favour. I helped a little."],
      ["echo", "So ein Wurf lässt Moos schneller wachsen.", "A roll like that makes moss grow faster."],
      ["echo", "Ich spüre Zorn – nein, warte, das ist Freude. Verwechsle ich oft.", "I feel rage – no, wait, that's joy. I mix them up a lot."],
      ["echo", "Das Gold in meinem Hort glänzt gleich ein bisschen heller.", "The gold in my hoard gleams a little brighter now."],
      ["echo", "Die Wurzeln murmeln. Es klingt nach Lob.", "The roots are murmuring. It sounds like praise."],
      ["echo", "Davor hätten sogar die Blights Respekt.", "Even the blights would respect that."],
      ["echo", "Hübsch gewürfelt. Ich werde kurz zur Eule und starre dich anerkennend an.", "Nicely rolled. I'll briefly become an owl and stare at you approvingly."],
      ["ezekiel", "Nicht schlecht. Für einen Anfänger.", "Not bad. For a beginner."],
      ["ezekiel", "Passabel. Ich habe schon schlechtere Taschen geleert.", "Passable. I've emptied worse pockets."],
      ["ezekiel", "Gut. Ich behalte dich im Auge. Und deinen Geldbeutel.", "Good. I'm keeping an eye on you. And your purse."],
      ["ezekiel", "Ein Wurf, der leise ist und trotzdem trifft. Mein Stil.", "A quiet roll that still hits. My style."],
      ["ezekiel", "Damit kommst du an fast jeder Wache vorbei. Den Rest erledige ich.", "That gets you past almost any guard. I'll handle the rest."],
      ["ezekiel", "Glück oder Können? Egal. Beides lässt sich stehlen.", "Luck or skill? Doesn't matter. Both can be stolen."],
      ["ezekiel", "Ich nicke. Merk dir das. Ich nicke selten.", "I'm nodding. Remember that. I rarely nod."],
      ["ezekiel", "Brauchbar. Das Schloss einer Truhe wäre damit gerade so aufgegangen.", "Useful. That would've just about opened a chest lock."],
      ["ezekiel", "Hm. Die Dunkelheit in mir ist … zufrieden. Seltsames Gefühl.", "Hm. The darkness within me is … content. Strange feeling."],
      ["ezekiel", "Solide. Ich würde dich als Ablenkung mitnehmen.", "Solid. I'd take you along as a distraction."],
      ["ezekiel", "Fast gut genug, um mich zu beeindrucken. Fast.", "Almost good enough to impress me. Almost."],
      ["rex", "Wuff! *wedelt mit dem ganzen Hund*", "Woof! *wags the entire dog*"],
      ["rex", "*bringt dir einen Ball, den noch nie jemand gesehen hat*", "*brings you a ball nobody has ever seen before*"],
      ["rex", "*leckt den Würfel ab. Zur Sicherheit.*", "*licks the die. Just to be safe.*"],
      ["rex", "*bellt einmal kurz und anerkennend*", "*gives one short, approving bark*"],
      ["rex", "*setzt sich brav hin und erwartet ein Leckerli*", "*sits nicely and expects a treat*"],
      ["rex", "*stupst dich mit der Nase an: Nochmal!*", "*nudges you with his nose: again!*"],
      ["rex", "*jagt vor Freude seinen eigenen Schwanz*", "*happily chases his own tail*"],
      ["rex", "*schaut Friedrich an, als wolle er sagen: Siehst du?*", "*looks at Friedrich as if to say: see?*"],
      ["rex", "*knurrt einen Goblin an, der gar nicht da ist. Zur Feier des Tages.*", "*growls at a goblin who isn't even there. To celebrate.*"],
      ["rex", "*rollt sich auf den Rücken und verlangt Bauchkraulen*", "*rolls onto his back and demands belly rubs*"],
      ["barradin", "Ezekiel, schreib mit: So sieht Talent aus.", "Ezekiel, take notes: this is what talent looks like."],
      ["ezekiel", "Barradin hat schon angefangen zu singen. Danke dafür.", "Barradin has already started singing. Thanks for that."],
      ["friedrich", "Echo, merk dir die Zahl. Die brauchen wir nächstes Mal.", "Echo, remember that number. We'll need it next time."],
      ["echo", "Friedrich nickt. Rex wedelt. Barradin singt. Ich ertrage es.", "Friedrich nods. Rex wags. Barradin sings. I endure it."],
      ["barradin", "Gundren hätte uns dafür einen Bonus gezahlt. Hätte.", "Gundren would have paid us a bonus for that. Would have."],
      ["friedrich", "Damit hätten wir den Wachturm im Handumdrehen geräumt.", "With that we'd have cleared the watchtower in no time."],
      ["echo", "Die magische Schmiede würde bei diesem Wurf wohlig glühen.", "The magical forge would glow contentedly at that roll."],
      ["ezekiel", "Mit so einem Wurf hätte ich Glasstabs Stab gleich mitgenommen.", "With a roll like that I'd have taken Glasstaff's staff too."],
      ["rex", "*bringt dir Friedrichs Pfeil zurück. Ungefragt. Stolz.*", "*brings you back Friedrich's arrow. Unasked. Proudly.*"],
      ["barradin", "Ein Wurf wie ein gut gestimmter Akkord.", "A roll like a well-tuned chord."],
      ["friedrich", "Nicht perfekt, aber ehrlich. Ich mag ehrliche Würfe.", "Not perfect, but honest. I like honest rolls."],
      ["echo", "Ich lasse den Zorn heute stecken. Wegen dir.", "I'll keep my wrath in check today. Because of you."],
      ["ezekiel", "Ein Taschendieb mit diesem Glück wäre reich. Ich bin reich.", "A pickpocket with that luck would be rich. I am rich."],
      ["rex", "*holt Barradins Hut und setzt ihn dir auf*", "*fetches Barradin's hat and puts it on you*"],
      ["barradin", "Ich nehme diesen Wurf in mein Repertoire auf.", "I'm adding this roll to my repertoire."],
      ["friedrich", "Damit kommen wir sicher bis Gracklstugh. Und zurück.", "That gets us safely to Gracklstugh. And back."],
      ["echo", "Ein Wolf aus meinem Hain heult anerkennend.", "A wolf from my grove howls approvingly."],
      ["ezekiel", "Fast so leise und präzise wie mein Dolch.", "Almost as quiet and precise as my dagger."],
      ["rex", "*läuft zu Imre und bellt ihn stolz an*", "*runs over to Imre and barks at him proudly*"],
      ["friedrich", "Ein Treffer, über den wir am Lagerfeuer reden werden.", "A hit we'll talk about around the campfire."]
    ],
    mittel: [
      ["barradin", "Solide. Ich mache trotzdem ein Lied daraus.", "Solid. I'll make a song of it anyway."],
      ["barradin", "Mittelmaß ist nur eine Frage der Erzählung. Lass mich das erzählen.", "Mediocrity is just a matter of storytelling. Let me tell it."],
      ["barradin", "In der Ballade wird das eine 18. Künstlerische Freiheit.", "In the ballad this becomes an 18. Artistic licence."],
      ["barradin", "Ein Wurf wie eine Taverne am Dienstag: nichts los, aber gemütlich.", "A roll like a tavern on a Tuesday: nothing happening, but cosy."],
      ["barradin", "Nicht schlecht, nicht gut – genau richtig für eine Zwischenstrophe.", "Not bad, not good – just right for a middle verse."],
      ["barradin", "Ich hätte mehr Glitzer erwartet. Ich erwarte immer mehr Glitzer.", "I expected more sparkle. I always expect more sparkle."],
      ["barradin", "Damit bekäme ich in Phandalin ein freundliches Nicken. Von einer Kuh.", "That would earn me a friendly nod in Phandalin. From a cow."],
      ["barradin", "Hm. Ich stimme die Laute nochmal. Vielleicht lag es an der Laute.", "Hm. I'll retune the lute. Maybe it was the lute."],
      ["barradin", "Ganz ordentlich. Der Wirt schmeißt dich nicht raus.", "Quite decent. The innkeeper won't throw you out."],
      ["barradin", "So durchschnittlich wie Friedrichs Gesangsstimme. Verzeih, Friedrich.", "As average as Friedrich's singing voice. Sorry, Friedrich."],
      ["barradin", "Die Muse gähnt. Aber sie ist noch da.", "The muse yawns. But she's still here."],
      ["barradin", "Für einen Refrain reicht's. Refrains sind ja eh nur Wiederholung.", "It'll do for a chorus. Choruses are just repetition anyway."],
      ["friedrich", "Reicht für einen Goblin. Vielleicht zwei.", "Enough for a goblin. Maybe two."],
      ["friedrich", "Getroffen – nur nicht da, wo ich hingezielt hätte.", "A hit – just not where I'd have aimed."],
      ["friedrich", "Okay. Wir kommen weiter. Langsam, aber wir kommen weiter.", "Okay. We're making progress. Slowly, but we are."],
      ["friedrich", "Der Pfeil steckt im Baum neben dem Ziel. Der Baum ist beeindruckt.", "The arrow is in the tree next to the target. The tree is impressed."],
      ["friedrich", "Ganz brauchbar. Rex hebt immerhin ein Ohr.", "Fairly useful. Rex at least lifts one ear."],
      ["friedrich", "Das reicht, um nicht von der Straße abzukommen.", "That's enough to stay on the road."],
      ["friedrich", "Nicht jeder Schuss muss ein Meisterschuss sein. Die meisten sind einfach … Schüsse.", "Not every shot has to be a masterpiece. Most are just … shots."],
      ["friedrich", "Halbe Sicht, halber Wind, halber Erfolg.", "Half sight, half wind, half success."],
      ["friedrich", "Für ein Kaninchen reicht's. Für einen Bugbear eher nicht.", "Good enough for a rabbit. Probably not for a bugbear."],
      ["friedrich", "Ich hätte die Sehne etwas fester gezogen. Nächstes Mal.", "I'd have drawn the string a bit tighter. Next time."],
      ["friedrich", "So würfelt man an einem ganz normalen Reisetag.", "That's how you roll on an ordinary travel day."],
      ["friedrich", "Hm. Rex sieht mich an, als wäre das meine Schuld.", "Hm. Rex is looking at me like it's my fault."],
      ["echo", "Hm. Der Hain ist unentschlossen.", "Hm. The grove is undecided."],
      ["echo", "Die Pilze nicken. Halbherzig.", "The mushrooms nod. Half-heartedly."],
      ["echo", "Ein Wurf wie Herbstlaub: nicht mehr grün, aber auch noch nicht gefallen.", "A roll like autumn leaves: no longer green, but not yet fallen."],
      ["echo", "Ich überlege, ob ich mich darüber ärgern soll. Ich ärgere mich ein bisschen.", "I'm wondering whether to be annoyed. I'm a little annoyed."],
      ["echo", "Der Rabe zuckt mit den Flügeln. Er hat schon Besseres gesehen.", "The raven shrugs his wings. He's seen better."],
      ["echo", "Genug, um eine Ranke wachsen zu lassen. Eine kleine.", "Enough to grow a vine. A small one."],
      ["echo", "Die Erde brummt gleichgültig. Sie hat Zeit.", "The earth hums indifferently. It has time."],
      ["echo", "Mittelmäßig. Wie Regen an einem Mittwoch.", "Mediocre. Like rain on a Wednesday."],
      ["echo", "Ich schenke dir einen Stein. Er ist genauso durchschnittlich wie dein Wurf.", "I'll give you a stone. It's just as average as your roll."],
      ["echo", "Nicht genug Glanz für meinen Hort. Ich nehme ihn trotzdem.", "Not shiny enough for my hoard. I'll take it anyway."],
      ["echo", "Mein Zorn schläft weiter. Das ist gut für dich.", "My wrath keeps sleeping. That's good for you."],
      ["echo", "Die Bäume flüstern: „Joa.“", "The trees whisper: 'Eh.'"],
      ["ezekiel", "Durchschnitt. Wie die meisten Geldbeutel.", "Average. Like most purses."],
      ["ezekiel", "Weder Fisch noch Fleisch. Ich nehme beides.", "Neither fish nor fowl. I'll take both."],
      ["ezekiel", "Damit wirst du gesehen. Nicht erwischt, aber gesehen.", "With that you'd be seen. Not caught, but seen."],
      ["ezekiel", "Ich habe in Gracklstugh mit weniger Glück mehr gestohlen.", "I've stolen more with less luck in Gracklstugh."],
      ["ezekiel", "Langweilig. Aber Langeweile ist eine gute Tarnung.", "Boring. But boredom is good camouflage."],
      ["ezekiel", "Genau die Sorte Wurf, die niemand bemerkt. Unterschätz das nicht.", "Exactly the kind of roll nobody notices. Don't underestimate that."],
      ["ezekiel", "Die Wache schaut kurz her – und wieder weg. Reicht.", "The guard glances over – and away again. Good enough."],
      ["ezekiel", "Mittelmaß. Ich fühle … nichts. Wie immer, eigentlich.", "Mediocre. I feel … nothing. As usual, really."],
      ["ezekiel", "Das Schloss klemmt. Wackel noch ein bisschen.", "The lock is stuck. Jiggle it a bit more."],
      ["ezekiel", "Ich hätte die Zahl vertauscht, bevor es jemand merkt.", "I'd have swapped the number before anyone noticed."],
      ["ezekiel", "Nicht schlecht genug, um lustig zu sein. Schade.", "Not bad enough to be funny. Pity."],
      ["ezekiel", "Halb im Licht, halb im Schatten. Wie ich.", "Half in the light, half in shadow. Like me."],
      ["rex", "*schnüffelt misstrauisch am Würfel*", "*sniffs the die suspiciously*"],
      ["rex", "*legt den Kopf schief*", "*tilts his head*"],
      ["rex", "*gähnt herzhaft*", "*yawns heartily*"],
      ["rex", "*wedelt einmal. Langsam.*", "*wags once. Slowly.*"],
      ["rex", "*kratzt sich hinterm Ohr und denkt nach*", "*scratches behind his ear and ponders*"],
      ["rex", "*schaut zur Tür. Vielleicht kommt ja ein Goblin.*", "*looks at the door. Maybe a goblin will show up.*"],
      ["rex", "*bellt halbherzig*", "*barks half-heartedly*"],
      ["rex", "*versucht, den Würfel zu fressen. Friedrich hält ihn auf.*", "*tries to eat the die. Friedrich stops him.*"],
      ["rex", "*rollt sich zusammen. Weckt mich, wenn's spannend wird.*", "*curls up. Wake me when it gets exciting.*"],
      ["rex", "*hechelt freundlich, aber unbeeindruckt*", "*pants, friendly but unimpressed*"],
      ["rex", "*setzt sich auf Barradins Hut*", "*sits on Barradin's hat*"],
      ["rex", "*stupst den Würfel an, damit er nochmal rollt*", "*nudges the die so it rolls again*"],
      ["barradin", "Weder Ballade noch Spottlied. Vielleicht ein Trinklied?", "Neither ballad nor mocking song. A drinking song, perhaps?"],
      ["friedrich", "Damit kommt man durch Phandalin. Ohne aufzufallen.", "That gets you through Phandalin. Without standing out."],
      ["echo", "Der Hain zuckt mit den Ästen.", "The grove shrugs its branches."],
      ["ezekiel", "Barradin wird daraus trotzdem ein Heldenlied machen. Leider.", "Barradin will make a hero's song out of it anyway. Sadly."],
      ["rex", "*schaut Echo an. Echo schaut Rex an. Keiner sagt was.*", "*looks at Echo. Echo looks at Rex. Nobody says anything.*"],
      ["barradin", "Das ist der Moment, in dem der Barde einen Witz macht. Ich denke noch nach.", "This is the moment the bard tells a joke. I'm still thinking."],
      ["friedrich", "Gerade genug, um den Karren aus dem Schlamm zu ziehen.", "Just enough to pull the cart out of the mud."],
      ["echo", "Eine Ranke wächst. Dann überlegt sie es sich anders.", "A vine grows. Then it changes its mind."],
      ["ezekiel", "Ich hätte die Truhe damit geöffnet. Beim zweiten Versuch.", "I'd have opened the chest with that. On the second try."],
      ["rex", "*sucht unter dem Tisch nach besseren Zahlen*", "*searches under the table for better numbers*"],
      ["barradin", "Der Bürgermeister würde dafür eine Kupfermünze geben. Eine.", "The mayor would give a copper coin for that. One."],
      ["friedrich", "Für die Gruppe reicht das. Für eine Legende noch nicht.", "Good enough for the party. Not yet for a legend."],
      ["echo", "Die Pilze haben sich noch nicht entschieden, ob sie wachsen wollen.", "The mushrooms haven't decided yet whether to grow."],
      ["ezekiel", "Ein Wurf wie ein abgenutzter Dietrich. Tut's noch.", "A roll like a worn lockpick. Still does the job."],
      ["rex", "*bringt dir einen Stock. Einen mittelgroßen.*", "*brings you a stick. A medium-sized one.*"],
      ["barradin", "Ich würde sagen: mittlere Kunst. Wie die meiste Kunst.", "I'd call it middling art. Like most art."],
      ["friedrich", "Der Riese hätte darüber nur müde gelächelt.", "The giant would have just smiled wearily at that."],
      ["echo", "Mein Rabe hat es gesehen und beschlossen, es niemandem zu erzählen.", "My raven saw it and decided to tell no one."],
      ["ezekiel", "Ich gähne innerlich. Äußerlich auch.", "I'm yawning inside. Outside too."],
      ["rex", "*wedelt im Takt von Barradins Laute. Etwas daneben.*", "*wags in time with Barradin's lute. Slightly off-beat.*"]
    ],
    niedrig: [
      ["barradin", "Das … übergehen wir in der Ballade.", "We'll … skip that part in the ballad."],
      ["barradin", "In meinem Lied war das ein taktischer Rückzug.", "In my song that was a tactical retreat."],
      ["barradin", "Autsch. Meine Laute hat sich gerade selbst verstimmt. Aus Scham.", "Ouch. My lute just put itself out of tune. Out of shame."],
      ["barradin", "Kein Problem. Ich reime „Pech“ einfach auf „frech“.", "No problem. I'll just rhyme 'bad luck' with 'pluck'."],
      ["barradin", "Ich habe schon vor schlechterem Publikum gespielt. Aber nicht oft.", "I've played to worse crowds. But not often."],
      ["barradin", "Wir sagen einfach, der Würfel war verflucht. Von Glasstab. Der war ja eh böse.", "We'll just say the die was cursed. By Glasstaff. He was evil anyway."],
      ["barradin", "Ich spiele dir eine traurige Melodie. Sie ist kurz. Wie dein Glück.", "I'll play you a sad tune. It's short. Like your luck."],
      ["barradin", "Kopf hoch! Selbst ich habe einmal … nein, eigentlich nicht.", "Chin up! Even I once … no, actually I haven't."],
      ["barradin", "Das war mutig. Falsch, aber mutig.", "That was brave. Wrong, but brave."],
      ["barradin", "Nennen wir das eine Probe. Für den echten Wurf später.", "Let's call that a rehearsal. For the real roll later."],
      ["barradin", "Ich hätte dir Inspiration gegeben. Hätte. Konjunktiv.", "I'd have given you inspiration. Would have. Conditional."],
      ["friedrich", "Daneben. Aber der Baum dahinter ist jetzt sehr tot.", "Missed. But the tree behind it is very dead now."],
      ["friedrich", "Der Pfeil ist weg. Rex sucht ihn. Rex sucht ihn immer noch.", "The arrow's gone. Rex is looking for it. Rex is still looking for it."],
      ["friedrich", "Wind von links. Oder von rechts. Jedenfalls Wind.", "Wind from the left. Or the right. Wind, anyway."],
      ["friedrich", "So würfelt man, wenn man drei Nächte nicht geschlafen hat.", "That's how you roll after three nights without sleep."],
      ["friedrich", "Nicht schlimm. Aus Fehlschüssen lernt man am meisten. Du lernst heute sehr viel.", "No harm. You learn most from misses. You're learning a lot today."],
      ["friedrich", "Ich glaube, die Goblins lachen gerade. Leise, aber sie lachen.", "I think the goblins are laughing right now. Quietly, but they are."],
      ["friedrich", "Tief durchatmen. Und nächstes Mal die Augen auflassen.", "Deep breath. And next time keep your eyes open."],
      ["friedrich", "Damit hätten wir das Abendessen verpasst. Und das Frühstück.", "With that we'd have missed dinner. And breakfast."],
      ["friedrich", "Der Hirsch hat sich umgedreht und gelacht. Hirsche können das.", "The stag turned around and laughed. Stags can do that."],
      ["friedrich", "Rex hat sich die Pfoten vor die Augen gelegt.", "Rex has put his paws over his eyes."],
      ["friedrich", "Na ja. Wenigstens hast du niemanden aus der Gruppe getroffen.", "Well. At least you didn't hit anyone in the party."],
      ["echo", "Selbst die Pilze schauen weg.", "Even the mushrooms look away."],
      ["echo", "Mein Zorn wächst. Langsam. Wie ein Baum. Ein wütender Baum.", "My wrath is growing. Slowly. Like a tree. An angry tree."],
      ["echo", "Ein Eichhörnchen hat gerade sein Vertrauen in dich verloren.", "A squirrel has just lost its faith in you."],
      ["echo", "Die Ranke hat sich vor Scham um sich selbst gewickelt.", "The vine has wrapped itself around itself in shame."],
      ["echo", "Der Hain verzeiht. Ich nicht.", "The grove forgives. I don't."],
      ["echo", "Das war ein Stein. Ich mag keine Steine.", "That was a rock. I don't like rocks."],
      ["echo", "Ich verwandle mich in eine Ratte und verkrieche mich. Vor Fremdscham.", "I'm turning into a rat and hiding. Out of second-hand embarrassment."],
      ["echo", "Der Wald sagt nichts. Der Wald ist höflich.", "The forest says nothing. The forest is polite."],
      ["echo", "Irgendwo hat gerade ein Plünderer zufrieden gegrinst.", "Somewhere a plunderer just grinned contentedly."],
      ["echo", "Die Sonne versteckt sich hinter einer Wolke. Kann ich verstehen.", "The sun is hiding behind a cloud. I understand."],
      ["echo", "Ich pflanze einen Baum zum Gedenken an diesen Wurf. Einen kleinen, traurigen.", "I'll plant a tree in memory of this roll. A small, sad one."],
      ["ezekiel", "Ich hätte geschummelt. Nur so als Tipp.", "I'd have cheated. Just a tip."],
      ["ezekiel", "Erwischt. Von dir selbst. Beeindruckend auf seine Art.", "Caught. By yourself. Impressive in its own way."],
      ["ezekiel", "Die Wache hat dich gesehen. Und gehört. Und gerochen.", "The guard saw you. And heard you. And smelled you."],
      ["ezekiel", "Schwach. Gib mir den Würfel, ich zeig dir, wie man ihn … „behandelt“.", "Weak. Give me the die, I'll show you how to … 'handle' it."],
      ["ezekiel", "Ich lache nicht. Das ist nur die Dunkelheit, die zuckt.", "I'm not laughing. That's just the darkness twitching."],
      ["ezekiel", "Damit wärst du in Gracklstugh nicht mal bis zum Tor gekommen.", "With that you wouldn't even have reached the gates of Gracklstugh."],
      ["ezekiel", "Selbst meine Schatten haben sich abgewandt.", "Even my shadows turned away."],
      ["ezekiel", "Peinlich. Für dich. Für mich unterhaltsam.", "Embarrassing. For you. Entertaining for me."],
      ["ezekiel", "Ich nehme deinen Würfel mit. Er hat Besseres verdient.", "I'm taking your die. It deserves better."],
      ["ezekiel", "Das Schloss hat gewonnen. Gegen ein Schloss zu verlieren ist … besonders.", "The lock won. Losing to a lock is … special."],
      ["ezekiel", "Leise war das nicht. Gut auch nicht.", "That wasn't quiet. Or good."],
      ["rex", "*legt sich mit einem tiefen Seufzer hin*", "*lies down with a deep sigh*"],
      ["rex", "*winselt mitfühlend*", "*whimpers sympathetically*"],
      ["rex", "*bringt dir zum Trost seinen Lieblingsstock*", "*brings you his favourite stick for comfort*"],
      ["rex", "*legt dir den Kopf aufs Knie*", "*rests his head on your knee*"],
      ["rex", "*vergräbt den Würfel im Garten*", "*buries the die in the garden*"],
      ["rex", "*schaut weg und tut so, als hätte er nichts gesehen*", "*looks away and pretends he saw nothing*"],
      ["rex", "*leckt dir aufmunternd die Hand*", "*licks your hand encouragingly*"],
      ["rex", "*knurrt den Würfel an*", "*growls at the die*"],
      ["rex", "*versteckt sich unter dem Tisch*", "*hides under the table*"],
      ["rex", "*jault einmal kurz, ganz leise*", "*lets out one short, very quiet howl*"],
      ["barradin", "Ezekiel grinst. Das ist nie gut.", "Ezekiel is grinning. That's never good."],
      ["friedrich", "Echo, keine Bärengestalt jetzt. Bitte.", "Echo, no bear form now. Please."],
      ["echo", "Barradin wird darüber singen. Das ist die eigentliche Strafe.", "Barradin will sing about it. That's the real punishment."],
      ["ezekiel", "Der Bugbear im Fass hätte besser gewürfelt.", "The bugbear in the barrel would have rolled better."],
      ["rex", "*schaut Ezekiel an, als wäre es seine Schuld*", "*looks at Ezekiel as if it were his fault*"],
      ["barradin", "Ich nenne es: experimentelle Würfelkunst.", "I call it experimental dice art."],
      ["friedrich", "Damit hätten uns die Wölfe im Wald gefunden. Alle.", "With that the wolves in the forest would have found us. All of them."],
      ["echo", "Selbst das Moos wächst gerade rückwärts.", "Even the moss is growing backwards now."],
      ["ezekiel", "In Gracklstugh würde man dich dafür zum Schmiedegehilfen degradieren.", "In Gracklstugh they'd demote you to forge apprentice for that."],
      ["rex", "*bringt dir den kleinsten Stock, den er finden konnte*", "*brings you the smallest stick he could find*"],
      ["barradin", "Ich spiele einen Tusch. Einen sehr kleinen, traurigen Tusch.", "I'll play a fanfare. A very small, sad fanfare."],
      ["friedrich", "Ich habe schon Pfeile gesehen, die vor Angst umgekehrt sind. Jetzt auch Würfel.", "I've seen arrows turn back in fear. Now dice too."],
      ["echo", "Ich grolle. Leise. Wie ein Gewitter hinter dem Hügel.", "I'm grumbling. Quietly. Like a storm behind the hill."],
      ["ezekiel", "Die Ettercaps hätten dich damit in ihr Netz gewickelt. Als Vorspeise.", "The ettercaps would have wrapped you in their web for that. As a starter."],
      ["rex", "*legt sich auf den Würfel, damit er so etwas nie wieder tut*", "*lies down on the die so it never does that again*"],
      ["barradin", "Das kommt in die Chronik. Ganz klein. In eine Fußnote.", "That goes into the chronicle. Very small. In a footnote."],
      ["friedrich", "Kein Problem. Morgen ist auch noch ein Tag. Und übermorgen.", "No problem. There's always tomorrow. And the day after."],
      ["echo", "Irgendwo kreischt ein Vrock. Vermutlich vor Lachen.", "Somewhere a vrock shrieks. Probably with laughter."],
      ["ezekiel", "Ich würde dir einen Rat geben. Aber Rat kostet. Und Glück hast du offensichtlich keins.", "I'd give you advice. But advice costs. And you clearly have no luck."],
      ["rex", "*schnüffelt am Würfel und niest beleidigt*", "*sniffs the die and sneezes indignantly*"]
    ],
    patzer: [
      ["ezekiel", "Eine 1. Ich nehme deinen Geldbeutel – du brauchst ihn ohnehin nicht mehr.", "A 1. I'll take your purse – you won't be needing it."],
      ["ezekiel", "Glückwunsch. Imre lächelt. Das ist nie ein gutes Zeichen.", "Congratulations. Imre is smiling. That's never a good sign."],
      ["ezekiel", "Selbst Rex würfelt besser. Und Rex hat keine Daumen.", "Even Rex rolls better. And Rex has no thumbs."],
      ["ezekiel", "Ich würde ja helfen. Aber ehrlich: Das hier ist lustiger.", "I'd help. But honestly, this is funnier."],
      ["ezekiel", "Eine 1. Die kommt in mein Buch der schönsten Missgeschicke. Gleich auf Seite eins.", "A 1. That goes in my book of finest blunders. Right on page one."],
      ["ezekiel", "Der Demogorgon hat gerade aus dem Abgrund heraufgeschaut. Und gelacht. Mit beiden Köpfen.", "Demogorgon just peered up from the Abyss. And laughed. With both heads."],
      ["ezekiel", "Wenn du willst, sage ich allen, das war ich. Nein. Doch nicht.", "If you like, I'll tell everyone it was me. No. Never mind."],
      ["ezekiel", "Mein Dolch hat sich gerade vor Lachen von selbst gezogen.", "My dagger just drew itself from laughing."],
      ["ezekiel", "Eine 1. Selbst die Kuo-Toa hätten jetzt Mitleid mit dir. Und die beten Ploopploopeen an.", "A 1. Even the kuo-toa would pity you now. And they pray to Ploopploopeen."],
      ["ezekiel", "Ich habe Leute schon für weniger zum Schweigen gebracht. Aber das hier ist zu schön.", "I've silenced people for less. But this is too beautiful."],
      ["ezekiel", "Die Schatten weichen zurück. Sie wollen nicht mit dir gesehen werden.", "The shadows recoil. They don't want to be seen with you."],
      ["ezekiel", "Eine 1. Ich stehle sie. Niemand darf je davon erfahren. Außer allen, denen ich es erzähle.", "A 1. I'm stealing it. No one must ever know. Except everyone I tell."],
      ["ezekiel", "Glasstab hätte dich ausgelacht. Und wäre dann weggelaufen. Wie immer.", "Glasstaff would have laughed at you. And then run away. As always."],
      ["ezekiel", "Ich bin der Zerstörer. Aber das hier – das hast du ganz allein geschafft.", "I'm the Destroyer. But this – you managed all by yourself."],
      ["ezekiel", "Ilvara hätte dich dafür in Ketten gelegt. Zu Recht.", "Ilvara would have put you in chains for that. Rightly so."],
      ["ezekiel", "Wenn Pech ein Handwerk wäre, wärst du Meister.", "If bad luck were a craft, you'd be a master."],
      ["barradin", "Eine 1? Kein Problem. Das Lied heißt dann „Die Ballade vom tapferen Versager“.", "A 1? No problem. The song will be called 'The Ballad of the Brave Failure'."],
      ["barradin", "Ich … spiele einfach etwas lauter. Dann hört es keiner.", "I'll … just play a little louder. Then nobody hears it."],
      ["barradin", "Mit einer 1 habe ich mal versucht, einen Drachen zu bezirzen. Der Drache lebt noch. Ich auch. Knapp.", "With a 1 I once tried to charm a dragon. The dragon's still alive. So am I. Barely."],
      ["barradin", "Meine Laute weint. Ich weine. Der Wirt schenkt aus Mitleid nach.", "My lute weeps. I weep. The innkeeper pours another out of pity."],
      ["barradin", "Ich habe soeben beschlossen, diesen Wurf nie gesehen zu haben.", "I have just decided I never saw this roll."],
      ["friedrich", "Der Pfeil fliegt rückwärts. Ich wusste nicht, dass das geht.", "The arrow flew backwards. I didn't know that was possible."],
      ["friedrich", "Die Sehne ist gerissen. Mein Vertrauen in Würfel gleich mit.", "The string snapped. My faith in dice along with it."],
      ["friedrich", "Rex, bring den Würfel weg. Weit weg.", "Rex, take the die away. Far away."],
      ["friedrich", "Eine 1. Auf der Straße nach Phandalin wären wir jetzt Goblinfutter.", "A 1. On the road to Phandalin we'd be goblin food now."],
      ["friedrich", "Ich glaube, ich habe gerade Barradin getroffen. Entschuldigung, Barradin!", "I think I just hit Barradin. Sorry, Barradin!"],
      ["echo", "Mein Zorn ist voll. Ich weiß nicht, was jetzt passiert. Niemand weiß das.", "My wrath is full. I don't know what happens now. Nobody does."],
      ["echo", "Ich habe mich aus Versehen in ein Huhn verwandelt. Danke dafür.", "I accidentally turned into a chicken. Thanks for that."],
      ["echo", "Die Bäume tun so, als würden sie dich nicht kennen.", "The trees are pretending they don't know you."],
      ["echo", "Der Feuerball … ist in die falsche Richtung geflogen. Ich brauche kurz eine Pause.", "The fireball … went the wrong way. I need a moment."],
      ["echo", "Ein Pilz ist gerade verwelkt. Aus Prinzip.", "A mushroom just wilted. On principle."],
      ["rex", "*klaut dir den Würfel und rennt damit weg*", "*steals the die and runs off with it*"],
      ["rex", "*heult traurig, und alle Hunde in Phandalin heulen mit*", "*howls sadly, and every dog in Phandalin joins in*"],
      ["rex", "*schiebt dir mit der Nase einen neuen Würfel hin*", "*pushes a new die towards you with his nose*"],
      ["rex", "*niest. Genau auf den Würfel.*", "*sneezes. Right on the die.*"],
      ["rex", "*tut so, als wäre er Ezekiels Hund. Nur heute.*", "*pretends to be Ezekiel's dog. Just for today.*"]
    ]
  };

  /* Kartenstapel je Ergebnis: jeder Spruch kommt einmal dran, dann wird neu gemischt (im Browser gemerkt) */
  function ziehen(art) {
    const n = SPRUECHE[art].length;
    let stapel = {};
    try { stapel = JSON.parse(lies("imres-wuerfel-stapel") || "{}") || {}; } catch (_) { stapel = {}; }
    let rest = Array.isArray(stapel[art]) ? stapel[art].filter(i => Number.isInteger(i) && i >= 0 && i < n) : [];
    if (!rest.length) {
      rest = Array.from({ length: n }, (_, i) => i);
      for (let i = n - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [rest[i], rest[j]] = [rest[j], rest[i]]; }
      /* nicht direkt mit dem zuletzt gezeigten Spruch weitermachen */
      if (stapel["letzt-" + art] === rest[rest.length - 1] && n > 1) { const x = rest.pop(); rest.unshift(x); }
    }
    const idx = rest.pop();
    stapel[art] = rest; stapel["letzt-" + art] = idx;
    schreib("imres-wuerfel-stapel", JSON.stringify(stapel));
    return idx;
  }

  /* ---------- Würfel-Block neben dem Spielleiter ---------- */
  const intro = document.getElementById("intro");
  const runde = document.createElement("section"); runde.className = "runde";
  uebersicht.insertBefore(runde, intro || uebersicht.querySelector(".lede") || null);
  if (intro) runde.appendChild(intro);
  const karte = document.createElement("div"); karte.className = "wuerfel-karte"; runde.appendChild(karte);

  const W20 = '<svg viewBox="0 0 100 100" aria-hidden="true"><polygon class="w-flaeche" points="50,3 91,26.5 91,73.5 50,97 9,73.5 9,26.5"/>' +
    '<path class="w-kante" d="M50,22 L78,69 L22,69 Z M50,3 L50,22 M9,26.5 L50,22 L91,26.5 M9,26.5 L22,69 L9,73.5 M91,26.5 L78,69 L91,73.5 M22,69 L50,97 L78,69"/>' +
    '<text class="w-zahl" x="50" y="59">20</text></svg>';
  const tagHeute = () => { const d = new Date(); return d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate(); };
  function statistik() { try { const s = JSON.parse(lies("imres-wuerfel-tag") || "null"); if (s && s.tag === tagHeute()) return s; } catch (_) {} return { tag: tagHeute(), n: 0, best: 0 }; }
  let letzter = null;
  function karteBauen() {
    const T = t(), st = statistik();
    karte.innerHTML =
      '<p class="label">' + esc(T.label) + "</p>" +
      '<h3 class="wk-titel">' + esc(T.titel) + "</h3>" +
      '<button type="button" class="wk-wuerfel" aria-label="' + esc(T.werfen) + '">' + W20 + '<span class="wk-funken" aria-hidden="true"></span></button>' +
      '<div class="wk-ergebnis" aria-live="polite">' + (letzter ? ergebnisHtml(letzter) : '<p class="wk-hinweis">' + esc(T.hinweis) + "</p>") + "</div>" +
      '<p class="wk-statistik">' + (st.n ? esc(T.heute(st.n, st.best)) : "") + "</p>";
    if (letzter) karte.querySelector(".w-zahl").textContent = letzter.wurf;
  }
  function ergebnisHtml(e) {
    const T = t(), z = SPRUECHE[e.art][e.idx], h = HELDEN[z[0]];
    return (e.art === "krit" ? '<p class="wk-art krit">' + esc(T.krit) + "</p>" : e.art === "patzer" ? '<p class="wk-art patzer">' + esc(T.patzer) + "</p>" : "") +
      '<div class="wk-blase"><img src="' + h.bild + '" alt=""><p><b>' + esc(h.name) + "</b>" + esc(z[sprache() === "en" ? 2 : 1]) + "</p></div>";
  }
  /* Klänge nur mit eingeschalteten Tavernenklängen */
  const tonAn = () => lies("imres-saal-ton") === "1";
  function klang(datei, laut) { if (!tonAn()) return; try { const a = new Audio("klang/" + datei); a.volume = laut; const p = a.play(); if (p && p.catch) p.catch(() => {}); } catch (_) {} }

  let rollt = false;
  function werfen() {
    if (rollt) return;
    rollt = true;
    const wurf = 1 + Math.floor(Math.random() * 20);
    const knopf = karte.querySelector(".wk-wuerfel"), zahl = karte.querySelector(".w-zahl");
    knopf.classList.remove("krit", "patzer"); karte.classList.remove("krit", "patzer");
    knopf.classList.add("rollt");
    const dauer = ruhig ? 150 : 900, start = performance.now();
    klang("holz1.mp3", .35);
    const flimmern = setInterval(() => { zahl.textContent = 1 + Math.floor(Math.random() * 20); }, 60);
    setTimeout(() => klang("holz2.mp3", .3), dauer * .45);
    setTimeout(() => {
      clearInterval(flimmern); knopf.classList.remove("rollt"); rollt = false;
      const art = wurf === 20 ? "krit" : wurf === 1 ? "patzer" : wurf >= 15 ? "hoch" : wurf >= 8 ? "mittel" : "niedrig";
      letzter = { wurf, art, idx: ziehen(art) };
      const st = statistik(); st.n++; st.best = Math.max(st.best, wurf); schreib("imres-wuerfel-tag", JSON.stringify(st));
      karteBauen();
      const k2 = karte.querySelector(".wk-wuerfel");
      if (art === "krit") { k2.classList.add("krit"); karte.classList.add("krit"); funken(); klang("gloeckchen.mp3", .4); }
      if (art === "patzer") { k2.classList.add("patzer"); karte.classList.add("patzer"); klang("timp1.mp3", .25); }
      k2.focus({ preventScroll: true });
    }, dauer);
    void start;
  }
  function funken() {
    if (ruhig) return;
    const f = karte.querySelector(".wk-funken"); if (!f) return;
    f.innerHTML = Array.from({ length: 22 }, () => {
      const w = Math.random() * Math.PI * 2, d = 60 + Math.random() * 90;
      return '<span style="--dx:' + Math.round(Math.cos(w) * d) + "px;--dy:" + Math.round(Math.sin(w) * d) + "px;--v:" + (Math.random() * .15).toFixed(2) + 's"></span>';
    }).join("");
  }
  karte.addEventListener("click", e => { if (e.target.closest(".wk-wuerfel")) werfen(); });

  /* ---------- Abschluss: Siegel ---------- */
  const ende = document.createElement("div"); ende.className = "start-ende";
  uebersicht.appendChild(ende);
  function endeBauen() {
    const T = t();
    ende.innerHTML = '<span class="siegel" aria-hidden="true"><span>IT</span></span>' +
      '<p class="ende-text">' + esc(T.ende) + "</p>" +
      '<p class="ende-klein">' + esc(T.endeKlein) + "</p>" +
      '<a class="ende-hoch" href="#start">' + esc(T.hoch) + "</a>";
  }
  /* „Zurück zur Halle“: ganz nach oben */
  ende.addEventListener("click", e => { if (e.target.closest(".ende-hoch")) { e.preventDefault(); window.scrollTo({ top: 0, behavior: ruhig ? "auto" : "smooth" }); } });

  /* ---------- Aussehen ---------- */
  const W20_ZEICHEN = "data:image/svg+xml," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><g fill="none" stroke="#e0a046" stroke-width="1.6"><polygon points="50,3 91,26.5 91,73.5 50,97 9,73.5 9,26.5"/><path d="M50,22 L78,69 L22,69 Z M50,3 L50,22 M9,26.5 L50,22 L91,26.5 M9,26.5 L22,69 L9,73.5 M91,26.5 L78,69 L91,73.5 M22,69 L50,97 L78,69"/></g></svg>');
  const css = document.createElement("style");
  css.textContent = `
/* Spielleiter und Würfel nebeneinander */
.runde { display: grid; grid-template-columns: minmax(0, 1.35fr) minmax(0, 1fr); gap: clamp(1rem, 3vw, 1.8rem); align-items: stretch; }
.runde:has(> #intro[hidden]) { grid-template-columns: minmax(0, 1fr); }
@media (max-width: 820px) { .runde { grid-template-columns: minmax(0, 1fr); } }
.start-rest .runde .gm { position: relative; overflow: hidden; margin: 0; padding: clamp(1.3rem, 3.5vw, 2.2rem) clamp(1.3rem, 3.5vw, 2.4rem);
  border: 1px solid rgba(224,160,70,.28); border-left: 3px solid var(--ember);
  background: radial-gradient(120% 90% at 0% 0%, rgba(224,160,70,.10), transparent 60%), linear-gradient(160deg, rgba(30,24,34,.92), rgba(16,13,20,.92));
  box-shadow: 0 14px 36px rgba(0,0,0,.4); display: grid; align-content: center; }
.start-rest .runde .gm::after { content: ""; position: absolute; right: -2.5rem; bottom: -2.5rem; width: 13rem; height: 13rem; opacity: .1; transform: rotate(14deg);
  background: url("${W20_ZEICHEN}") center / contain no-repeat; pointer-events: none; }

.wuerfel-karte { position: relative; display: grid; justify-items: center; align-content: start; gap: .5rem; text-align: center; padding: clamp(1.1rem, 3vw, 1.6rem);
  border: 1px solid rgba(224,160,70,.28); background: radial-gradient(90% 70% at 50% 30%, rgba(224,160,70,.12), transparent 70%), linear-gradient(160deg, rgba(30,24,34,.92), rgba(16,13,20,.92));
  box-shadow: 0 14px 36px rgba(0,0,0,.4); transition: border-color .4s, box-shadow .4s; }
.wuerfel-karte.krit { border-color: #ffd27a; box-shadow: 0 0 0 1px #ffd27a, 0 0 46px rgba(255,210,122,.35); }
.wuerfel-karte.patzer { border-color: #c4564a; box-shadow: 0 0 0 1px #c4564a, 0 0 36px rgba(196,86,74,.3); }
.wuerfel-karte .label { margin: 0; }
.wk-titel { margin: 0; font-family: var(--name); font-weight: 400; font-size: clamp(1.4rem, 3vw, 1.75rem); color: var(--vellum); }
.wk-wuerfel { position: relative; width: 7.5rem; height: 7.5rem; padding: 0; border: 0; background: none; cursor: pointer; -webkit-tap-highlight-color: transparent; transition: transform .2s; }
.wk-wuerfel:hover { transform: scale(1.06) rotate(-4deg); }
.wk-wuerfel:focus-visible { outline: 2px solid var(--ember); outline-offset: 6px; border-radius: 12px; }
.wk-wuerfel svg { width: 100%; height: 100%; overflow: visible; filter: drop-shadow(0 8px 18px rgba(0,0,0,.6)); }
.w-flaeche { fill: #2a1f2c; stroke: var(--ember); stroke-width: 2.2; }
.w-kante { fill: none; stroke: rgba(224,160,70,.55); stroke-width: 1.2; }
.w-zahl { fill: #fff2d8; font-family: var(--display); font-size: 25px; text-anchor: middle; }
.wk-wuerfel.rollt svg { animation: wRollen .9s cubic-bezier(.2,.7,.3,1); }
@keyframes wRollen { 0% { transform: rotate(0) scale(1); } 30% { transform: rotate(-260deg) scale(.82) translateY(-10px); } 70% { transform: rotate(-650deg) scale(1.08); } 100% { transform: rotate(-720deg) scale(1); } }
.wk-wuerfel.krit .w-flaeche { fill: #6b4a12; stroke: #ffd27a; }
.wk-wuerfel.krit svg { filter: drop-shadow(0 0 22px rgba(255,210,122,.8)); animation: wKrit 1.2s ease-out; }
@keyframes wKrit { 0% { transform: scale(1); } 25% { transform: scale(1.22); } 100% { transform: scale(1); } }
.wk-wuerfel.patzer .w-flaeche { fill: #3a1512; stroke: #c4564a; }
.wk-wuerfel.patzer svg { animation: wWackeln .5s ease-in-out; }
@keyframes wWackeln { 0%, 100% { transform: translateX(0); } 20% { transform: translateX(-7px) rotate(-4deg); } 40% { transform: translateX(6px) rotate(3deg); } 60% { transform: translateX(-4px); } 80% { transform: translateX(3px); } }
.wk-funken { position: absolute; left: 50%; top: 50%; pointer-events: none; }
.wk-funken span { position: absolute; width: 6px; height: 6px; margin: -3px; border-radius: 50%; background: #ffd27a; box-shadow: 0 0 10px 2px rgba(255,190,90,.9);
  animation: wFunke 1.1s ease-out forwards; animation-delay: var(--v); opacity: 0; }
@keyframes wFunke { 0% { opacity: 1; transform: translate(0, 0) scale(1); } 100% { opacity: 0; transform: translate(var(--dx), var(--dy)) scale(.3); } }
.wk-ergebnis { min-height: 4.6rem; display: grid; gap: .4rem; justify-items: center; width: 100%; }
.wk-hinweis { margin: 0; font-size: .9rem; font-style: italic; color: var(--ash); }
.wk-art { margin: 0; font-family: var(--display); font-size: 1.05rem; letter-spacing: .06em; }
.wk-art.krit { color: #ffd27a; text-shadow: 0 0 14px rgba(255,210,122,.6); }
.wk-art.patzer { color: #e0695c; }
.wk-blase { display: flex; align-items: flex-start; gap: .65rem; max-width: 24rem; text-align: left; animation: blaseEin .4s cubic-bezier(.2,.8,.3,1); }
@keyframes blaseEin { from { opacity: 0; transform: translateY(8px); } }
.wk-blase img { flex: none; width: 2.6rem; height: 2.6rem; border-radius: 50%; object-fit: cover; object-position: top; border: 1px solid var(--ember); }
.wk-blase p { margin: 0; position: relative; padding: .55rem .8rem; background: rgba(235,226,204,.08); border: 1px solid var(--line); border-radius: 4px 12px 12px 12px; font-size: .92rem; line-height: 1.45; color: var(--vellum); }
.wk-blase b { display: block; font-size: .68rem; letter-spacing: .16em; text-transform: uppercase; color: var(--ember); font-weight: 600; margin-bottom: .1rem; }
.wk-statistik { margin: 0; min-height: 1em; font-size: .78rem; color: var(--ash); }

/* Taverne-Kachel doppelt breit – keine Lücke mehr im Raster */
@media (min-width: 760px) { .kacheln .kachel.k-taverne { grid-column: span 2; } }

/* Abschluss mit Siegel */
.start-ende { display: grid; justify-items: center; gap: .35rem; text-align: center; margin-top: clamp(1.5rem, 5vw, 3rem); padding-top: clamp(1.5rem, 5vw, 2.5rem); position: relative; }
.start-ende::before { content: ""; position: absolute; top: 0; left: 50%; width: min(26rem, 80%); transform: translateX(-50%); height: 1px; background: linear-gradient(90deg, transparent, var(--line), transparent); }
.siegel { display: grid; place-items: center; width: 4.4rem; height: 4.4rem; border-radius: 47% 53% 50% 50% / 52% 48% 52% 48%;
  background: radial-gradient(circle at 35% 30%, #c0463c, #8a2119 55%, #5e140f); box-shadow: 0 6px 16px rgba(0,0,0,.55), inset 0 -4px 8px rgba(0,0,0,.35), inset 0 3px 6px rgba(255,150,130,.25); transform: rotate(-8deg); }
.siegel span { display: grid; place-items: center; width: 3.1rem; height: 3.1rem; border-radius: 50%; border: 1.5px solid rgba(255,190,170,.35); font-family: var(--display); font-size: 1.15rem; letter-spacing: .04em; color: rgba(255,215,200,.85); text-shadow: 0 -1px 0 rgba(0,0,0,.4); }
.ende-text { margin: .6rem 0 0; font-family: var(--hand); font-size: clamp(1.7rem, 4.5vw, 2.3rem); color: var(--ember); line-height: 1; }
.ende-klein { margin: 0; font-size: .92rem; color: var(--ash); font-style: italic; }
.ende-hoch { margin-top: .6rem; font-size: .85rem; color: var(--ash); text-decoration: none; border-bottom: 1px dotted var(--line); }
.ende-hoch:hover { color: var(--ember); border-color: var(--ember); }
@media (prefers-reduced-motion: reduce) { .wk-wuerfel.rollt svg, .wk-wuerfel.krit svg, .wk-wuerfel.patzer svg, .wk-blase { animation: none; } }
`;
  document.head.appendChild(css);

  /* ---------- Start ---------- */
  karteBauen(); endeBauen();
  let letzteSprache = sprache();
  new MutationObserver(() => { if (sprache() === letzteSprache) return; letzteSprache = sprache(); karteBauen(); endeBauen(); })
    .observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });
})();
