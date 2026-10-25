/* =====================================================================
   BARRADINS AUFTRITT – Rhythmusspiel in der Taverne
   Drei Spuren (Bass, Laute, Echos Flöte) fallen herab; im richtigen Moment
   tippen. Die Treffsicherheit wird am Ende zum Auftrittswurf (W20 + 7).
   „Barradins Weg“: Karriere über elf Bühnen, von der Straßenkneipe bis zu den Göttern –
   jede verlangt einen höheren Schwierigkeitsgrad beim Auftrittswurf und spielt ein schwereres Stück.
   Gespielt wird mit echten Instrumentenaufnahmen aus klang/ (Kontrabass, Laute, Flöte, Bodhrán);
   solange sie nicht geladen sind, klingt der berechnete Ersatz.
   ===================================================================== */
(function () {
  "use strict";
  const root = document.getElementById("auftritt");
  if (!root) return;
  const sprache = () => (document.documentElement.lang === "en" ? "en" : "de");
  const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const zufall = l => l[Math.floor(Math.random() * l.length)];

  const TX = {
    de: {
      label: "Bühnenprobe", titel: "Barradins Auftritt",
      text: "Barradin spielt auf – und du greifst in die Saiten! Tippe die Noten, sobald sie die goldene Linie erreichen. Am Ende entscheidet dein Taktgefühl über den Auftrittswurf.",
      steuerung: "Tasten A · S · D (oder J · K · L, ← ↓ →) – auf dem Handy einfach auf die Spur tippen. Noten mit Schweif gedrückt halten, bis der Schweif endet.",
      publikum: "Publikum",
      stufen: { leicht: "🍺 Bauern in Phandalin", mittel: "👑 Am Hof von König Horga", schwer: "🐉 Ein Drache hört zu" },
      spuren: ["Bass", "Laute", "Flöte"],
      start: "▶ Auftritt beginnen", nochmal: "↻ Noch ein Auftritt", abbrechen: "Abbrechen",
      urteil: { perfekt: "Meisterhaft!", gut: "Gut!", knapp: "Knapp …", daneben: "Daneben!", gehalten: "Gehalten!" },
      serie: n => n + "er-Serie", punkte: "Punkte",
      ergebnis: "Der Auftrittswurf", treffer: (a, b) => a + " von " + b + " Noten getroffen", beste: n => "Beste Serie: " + n,
      genau: p => "Treffsicherheit: " + p + " %", fehlgriffe: n => n + " Fehlgriffe",
      tipp: "Tipp: Lieber eine Note auslassen als wild zu hämmern – jeder Fehlgriff kostet. Getroffene Noten spielen die Melodie, also hör auf das Lied!", rekord: n => "Bisher bester Wurf hier: " + n, neuRekord: "Neuer Rekord vor diesem Publikum!",
      wurf: (w, s) => "W20: " + w + " + 7 Auftreten = " + s,
      lied: "Lied", neuesLied: "🎲 Neues Lied", erfunden: "Barradin improvisiert",
      lieder: { reigen: "Tavernenreigen", bugbear: "Der Bugbear im Fass", klage: "Phandalins Klage", schmiede: "Hammer und Amboss", seemann: "Seemannsgarn", walzer: "Demogorgons Walzer",
        schatten: "Ezekiels Schattentanz", rex: "Rex' wilde Jagd", ploop: "Ploopploopeens Tiefseeshanty", venom: "Venomfangs Odem",
        buerger: "Des Bürgermeisters Geldbeutel", palast: "Hymne der Krone", elfen: "Mondscheinreigen der Feen", goetter: "Das Ewige Lied" },
      stimmen_laden: "🎻 Instrumente werden gestimmt …",
      erfinden: { vorlage: ["Die Ballade vom {a} {n}", "Das Lied vom {a} {n}", "Der Reigen vom {a} {n}", "Die Mär vom {a} {n}", "Die Klage vom {a} {n}"],
        adj: ["traurigen", "betrunkenen", "tanzenden", "verliebten", "singenden", "hungrigen", "verlorenen", "kichernden", "einsamen", "wütenden", "verfluchten", "goldenen"],
        nom: ["Kobold", "Zwerg", "Drachen", "Bugbear", "Wirt", "Pilz", "Hering", "Barden", "Goblin", "Oger", "Schatten", "Mond", "Krug"] },
      bestenliste: "🏆 Bestenliste", nurHier: "Noch nur auf diesem Gerät gespeichert.", leer: "Noch niemand – sei die erste Legende!",
      eintragen: "🏆 Eintragen", deinName: "Dein Name", eingetragen: p => "Eingetragen – Platz " + p + "!", eingetragenOhne: "Eingetragen!", sendet: "Wird eingetragen …",
      fehler: { "Bitte freundlich bleiben": "Dieser Name ist leider nicht erlaubt – bitte wähle einen anderen.", "Bitte kurz warten": "Zu viele Einträge in kurzer Zeit – bitte später nochmal.",
        "Bitte später nochmal": "Zu viele Einträge in kurzer Zeit – bitte später nochmal.", "Name fehlt": "Bitte gib einen Namen ein.",
        netz: "Server nicht erreichbar – nur auf diesem Gerät gespeichert.", endgueltig: "Eintrag hat nicht geklappt – dein Ergebnis bleibt auf diesem Gerät.", _: "Eintrag hat nicht geklappt – bitte versuch es nochmal." },
      pause: "Pausiert – Tippen zum Weiterspielen", pauseKnopf: "⏸ Pause",
      ton: "Lautstärke", tonAus: "Ton aus", tonAn: "Ton an",
      kalib: { knopf: "🎯 Kalibrieren", titel: "Kalibrieren", hinweis: "Hör auf die Klicks und tippe 8× genau mit (auf die Bühne oder A · S · D).", vorzaehlen: "Erst zuhören …", mit: (n, m) => "Jetzt mittippen! " + n + " / " + m,
        fertig: ms => "Kalibriert: Deine Tipps werden um " + ms + " ms verschoben.", null: "Kalibriert: Kein Versatz nötig – du triffst genau!", zuWenig: "Zu wenige Tipps erkannt – bitte nochmal versuchen.",
        aktuell: ms => "Versatz: " + ms + " ms", zuruecksetzen: "zurücksetzen" },
      spalten: ["#", "Name", "Treffer", "Wurf", "Lied"],
      stimmen: {
        patzer: ["Ich … habe gerade mit der Laute nach einer Fliege geschlagen. Und sie getroffen. Das Lied nicht.", "Eine 1. Die Laute weint. Ich weine. Der Wirt schenkt mir aus Mitleid nach."],
        schwach: ["Ein höflicher Applaus. Von einer Person. Die eigentlich nur gähnen wollte.", "Die Zuhörer starren in ihre Krüge. Vielleicht suchen sie dort Trost."],
        maessig: ["Ganz ordentlich! Ein paar Leute wippen mit. Einer klatscht sogar im Takt. Fast.", "Kein Meisterwerk, aber der Wirt schmeißt mich nicht raus. Ein Erfolg!"],
        gut: ["Die Taverne tobt! Jemand wirft mir eine Rose zu. Oder einen Hering. Egal, ich nehm's!", "Krüge werden gehoben, Füße stampfen – so muss das klingen!"],
        stark: ["Selbst der grimmige Zwerg in der Ecke summt mit. Ich bin eine Legende. Fast.", "Zugaberufe! Ich verbeuge mich dreimal. Viermal. Ach, ich verbeug mich einfach weiter."],
        legende: ["Man wird Lieder über dieses Lied singen. Und ich werde sie alle singen.", "Die Götter selbst lehnen sich vor, um besser zu hören. Echo hat Tränen in den Augen. Ezekiel … nickt. Einmal."],
        krit: ["EINE NATÜRLICHE 20! Die Kerzen flackern, die Wände beben, und Rex heult die zweite Stimme!", "Natürliche 20! Selbst Imre legt den Würfel zur Seite und applaudiert."]
      },
      modi: { lieder: "🎵 Freies Spiel", weg: "📜 Barradins Weg" },
      weg: {
        text: "Vom Hinterhof bis zu den Göttern: Barradin spielt sich Bühne für Bühne nach oben. Jedes Publikum ist anspruchsvoller, jedes Stück schwerer – und der Auftrittswurf muss den Schwierigkeitsgrad schaffen, sonst geht es nicht weiter.",
        rang: "Ruf", sterne: "Sterne", station: n => "Bühne " + n, gesperrt: "Noch verschlossen",
        publikum: "Publikum", sg: n => "SG " + n, lied: "Stück",
        start: "▶ Auftreten", nochmal: "↻ Noch einmal versuchen", wiederholen: "↻ Noch einmal spielen", weiter: "Zur nächsten Bühne →",
        gegen: n => "Auftrittswurf gegen SG " + n, bestanden: "Bestanden!", durchgefallen: "Nicht geschafft …",
        neuerRang: r => "Neuer Ruf: " + r, ende: "Barradins Weg ist vollendet. Die Götter summen sein Lied.",
        zuruecksetzen: "Weg von vorn beginnen", sicher: "Wirklich den ganzen Fortschritt löschen?",
        unbekannt: "Unbekannter Barde",
        raenge: ["Straßenmusikant", "Spelunkensänger", "Hafenbarde", "Gasthaussänger", "Festbarde", "Ballmusikus", "Schlossbarde", "Spielmann des Unterreichs", "Hofbarde von Neverwinter", "Liebling der Feen", "Gottgeküsster Barde"],
        stationen: [
          { ort: "„Zum Lahmen Esel“ – Straßenkneipe in Phandalin", publikum: "Drei Bauern, ein schlafender Hund und der Wirt",
            intro: "Irgendwo muss eine Legende anfangen. Warum nicht hier, zwischen verschüttetem Bier und einem Hund, der sehr laut träumt?",
            sieg: "Der Wirt schenkt mir ein Freibier aus. Ein Bauer flüstert, unten am Hafen gebe es eine Spelunke, in der nur die Mutigen spielen.",
            pleite: "Der Hund ist aufgewacht. Und gegangen. Schnell noch ein Versuch, bevor auch die Bauern gehen." },
          { ort: "„Zur Ersoffenen Ratte“ – Spelunke am Hafen", publikum: "Halsabschneider, Schmuggler und ein Bugbear, der niemanden ansieht",
            intro: "Hier zahlt man mit Gold, mit Blut oder mit einem guten Lied. Ich habe nur eine Laute. Also: ein gutes Lied.",
            sieg: "Der Bugbear nickt. Niemand wird erstochen. In dieser Spelunke ist das stehender Applaus.",
            pleite: "Ein Messer steckt neben meinem Kopf im Balken. Das war wohl Kritik. Immerhin konstruktiv." },
          { ort: "„Zum Seemannsgarn“ – Hafenschenke", publikum: "Eine Schiffsmannschaft auf Landgang, laut und durstig",
            intro: "Seeleute singen mit, ob man will oder nicht. Die Kunst ist, dass sie das Richtige mitsingen.",
            sieg: "Die ganze Mannschaft brüllt den Refrain. Der Kapitän schreibt mir eine Empfehlung für ein feines Gasthaus – auf eine Fischschuppe, aber immerhin.",
            pleite: "Sie haben mein Lied übernommen. Mit neuem Text. Über mich. Nicht nett." },
          { ort: "„Zum Silbernen Krug“ – ein gesittetes Gasthaus", publikum: "Händler, Reisende und eine Dame mit Monokel",
            intro: "Tischdecken! Servietten! Niemand wirft mit Heringen. Hier muss man leise beeindrucken – mit einer Klage, die zu Herzen geht.",
            sieg: "Der Dame fällt vor Rührung das Monokel in die Suppe. Sie kennt den Bürgermeister von Phandalin persönlich – und er sucht Musik für sein Erntefest.",
            pleite: "Man hat höflich geschwiegen. Sehr höflich. Sehr lange." },
          { ort: "Erntefest beim Bürgermeister von Phandalin", publikum: "Der Bürgermeister, seine Ratsherren und sein gut bewachter Geldbeutel",
            intro: "Wir kennen uns. Er zahlt ungern. Diesmal soll er nicht nur zahlen – er soll es auch noch gern tun.",
            sieg: "Er hat bezahlt! Ohne zu feilschen! Das hat es in Phandalin noch nie gegeben. Sein Schwager, ein Landgraf, gibt nächsten Monat einen Ball …",
            pleite: "„Sehr schön“, sagt der Bürgermeister und hält mir eine Kupfermünze hin. Eine. Zum Teilen." },
          { ort: "Der Ball des Landgrafen", publikum: "Tanzende Adlige, die jeden falschen Takt bemerken",
            intro: "Ein Walzer. Hunderte Füße, die sich nach meinem Takt richten. Wenn ich stolpere, stolpert der ganze Saal.",
            sieg: "Der Saal dreht sich, als hätte ich ihn aufgezogen. Ein bleicher Fürst in schwarzem Samt lädt mich auf sein Schloss ein. Er lächelt mit … sehr vielen Zähnen.",
            pleite: "Ein Graf ist über seine Gräfin gestolpert. Beide schauen zu mir. Ich schaue zur Tür." },
          { ort: "Schloss Nachtfels", publikum: "Ein bleicher Fürst und Gäste, die nie blinzeln",
            intro: "Kerzen, die nicht flackern. Spiegel, in denen niemand steht. Ich spiele Ezekiels Schattentanz – er meinte, das käme hier gut an.",
            sieg: "Der Fürst klatscht langsam. Dann reicht er mir einen Geleitbrief ins Unterreich, an den Hof von König Horga Stahl V. „Er schätzt Musik mit Biss.“",
            pleite: "Die Gäste mustern mich, als wäre ich das Abendessen. Lieber schnell noch ein Versuch." },
          { ort: "Die Feste von König Horga Stahl V.", publikum: "Ein Zwergenkönig, der nur Musik im Takt seiner Schmiedehämmer duldet",
            intro: "Wir standen schon einmal vor ihm – als Gefangene. Diesmal komme ich freiwillig. Hammer und Amboss, im Takt seines Herzens. Hoffentlich hat er eins.",
            sieg: "König Horga schlägt mit der Faust auf die Thronlehne – im Takt! Er schickt einen Boten an die Oberfläche: Der Palast von Neverwinter soll von mir hören.",
            pleite: "Der König hebt eine Augenbraue. Die Wachen heben ihre Äxte. Ich hebe die Laute und fange noch einmal an." },
          { ort: "Der Palast von Neverwinter", publikum: "Der Hof, der Kronrat und sehr viele Trompeter, die neidisch schauen",
            intro: "Marmor, Banner, ein Saal so hoch, dass mein Echo erst morgen zurückkommt. Eine Hymne auf die Krone – kein Ton darf wackeln.",
            sieg: "Man ernennt mich zum Hofbarden! Und in der Nacht steht eine Gestalt aus Mondlicht an meinem Fenster: Die Feenkönigin will mich hören.",
            pleite: "Ein Trompeter grinst. Das kann ich nicht auf mir sitzen lassen." },
          { ort: "Der Hof der Feenkönigin im Mondhain", publikum: "Feen, Dryaden und eine Königin, die seit tausend Jahren nichts Neues gehört hat",
            intro: "Hier ist die Musik älter als die Bäume. Echo würde sich wie zu Hause fühlen. Ich fühle mich … sehr sterblich.",
            sieg: "Die Feenkönigin weint eine einzige Träne. Sie wird zu einem Stern, und der Stern weist den Weg zu den Hallen des Ewigen Liedes.",
            pleite: "Die Feen kichern. Eine hat meine Saiten zu Blumen verknotet. Noch einmal – mit Würde." },
          { ort: "Die Hallen des Ewigen Liedes", publikum: "Die Götter selbst",
            intro: "Kein Weg führt hierher, nur ein Lied. Wer hier spielt, spielt für die Ewigkeit. Keine Fehler, Barradin. Keine. Fehler.",
            sieg: "Die Götter erheben sich. Mein Lied wird in die Sterne geschrieben, und irgendwo in Phandalin wacht ein Hund auf und wedelt mit dem Schwanz.",
            pleite: "Ein Gott hustet. Ein anderer lächelt nachsichtig. Unsterbliche haben Zeit – und ich noch einen Versuch." }
        ]
      }
    },
    en: {
      label: "Stage rehearsal", titel: "Barradin's Performance",
      text: "Barradin strikes up – and you play along! Hit the notes as soon as they reach the golden line. In the end your sense of rhythm decides the performance check.",
      steuerung: "Keys A · S · D (or J · K · L, ← ↓ →) – on a phone just tap the lane. Notes with a tail: keep holding until the tail ends.",
      publikum: "Audience",
      stufen: { leicht: "🍺 Farmers in Phandalin", mittel: "👑 At King Horga's court", schwer: "🐉 A dragon is listening" },
      spuren: ["Bass", "Lute", "Flute"],
      start: "▶ Begin performance", nochmal: "↻ Another performance", abbrechen: "Cancel",
      urteil: { perfekt: "Masterful!", gut: "Good!", knapp: "Close …", daneben: "Missed!", gehalten: "Held!" },
      serie: n => n + " streak", punkte: "points",
      ergebnis: "The performance check", treffer: (a, b) => a + " of " + b + " notes hit", beste: n => "Best streak: " + n,
      genau: p => "Accuracy: " + p + " %", fehlgriffe: n => n + " misplays",
      tipp: "Tip: better to skip a note than to mash – every misplay costs. The notes you hit play the melody, so listen to the song!", rekord: n => "Best roll here so far: " + n, neuRekord: "New record in front of this audience!",
      wurf: (w, s) => "d20: " + w + " + 7 Performance = " + s,
      lied: "Song", neuesLied: "🎲 New song", erfunden: "Barradin improvises",
      lieder: { reigen: "Tavern Round", bugbear: "The Bugbear in the Barrel", klage: "Phandalin's Lament", schmiede: "Hammer and Anvil", seemann: "Sailor's Yarn", walzer: "Demogorgon's Waltz",
        schatten: "Ezekiel's Shadow Dance", rex: "Rex's Wild Hunt", ploop: "Ploopploopeen's Deep-Sea Shanty", venom: "Venomfang's Breath",
        buerger: "The Mayor's Purse", palast: "Hymn of the Crown", elfen: "Moonlit Dance of the Fey", goetter: "The Eternal Song" },
      stimmen_laden: "🎻 Tuning the instruments …",
      erfinden: { vorlage: ["The Ballad of the {a} {n}", "The Song of the {a} {n}", "The Round of the {a} {n}", "The Tale of the {a} {n}", "The Lament of the {a} {n}"],
        adj: ["Sad", "Drunken", "Dancing", "Lovesick", "Singing", "Hungry", "Lost", "Giggling", "Lonely", "Angry", "Cursed", "Golden"],
        nom: ["Kobold", "Dwarf", "Dragon", "Bugbear", "Innkeeper", "Mushroom", "Herring", "Bard", "Goblin", "Ogre", "Shadow", "Moon", "Tankard"] },
      bestenliste: "🏆 Leaderboard", nurHier: "Only saved on this device for now.", leer: "Nobody yet – be the first legend!",
      eintragen: "🏆 Submit", deinName: "Your name", eingetragen: p => "Submitted – rank " + p + "!", eingetragenOhne: "Submitted!", sendet: "Submitting …",
      fehler: { "Bitte freundlich bleiben": "That name isn't allowed – please choose another one.", "Bitte kurz warten": "Too many entries in a short time – please try again later.",
        "Bitte später nochmal": "Too many entries in a short time – please try again later.", "Name fehlt": "Please enter a name.",
        netz: "Server unreachable – saved on this device only.", endgueltig: "Submitting didn't work – your score stays on this device.", _: "Submitting didn't work – please try again." },
      pause: "Paused – tap to continue", pauseKnopf: "⏸ Pause",
      ton: "Volume", tonAus: "Sound off", tonAn: "Sound on",
      kalib: { knopf: "🎯 Calibrate", titel: "Calibrate", hinweis: "Listen to the clicks and tap along 8 times (on the stage or A · S · D).", vorzaehlen: "Listen first …", mit: (n, m) => "Tap along now! " + n + " / " + m,
        fertig: ms => "Calibrated: your taps are shifted by " + ms + " ms.", null: "Calibrated: no offset needed – you're spot on!", zuWenig: "Too few taps detected – please try again.",
        aktuell: ms => "Offset: " + ms + " ms", zuruecksetzen: "reset" },
      spalten: ["#", "Name", "Hits", "Roll", "Song"],
      stimmen: {
        patzer: ["I … just swatted a fly with my lute. Hit the fly. Not the song.", "A 1. The lute weeps. I weep. The innkeeper pours me another out of pity."],
        schwach: ["Polite applause. From one person. Who actually just wanted to yawn.", "The audience stares into their tankards. Maybe they're looking for comfort there."],
        maessig: ["Not bad! A few people tap along. One even claps in time. Almost.", "No masterpiece, but the innkeeper isn't throwing me out. A success!"],
        gut: ["The tavern goes wild! Someone throws me a rose. Or a herring. Whatever, I'll take it!", "Tankards raised, feet stomping – that's how it should sound!"],
        stark: ["Even the grumpy dwarf in the corner hums along. I'm a legend. Nearly.", "Encore! I bow three times. Four. Oh, I'll just keep bowing."],
        legende: ["They'll sing songs about this song. And I'll sing all of them.", "The gods themselves lean in to hear better. Echo has tears in his eyes. Ezekiel … nods. Once."],
        krit: ["A NATURAL 20! The candles flicker, the walls shake, and Rex howls the harmony!", "Natural 20! Even Imre puts down his dice and applauds."]
      },
      modi: { lieder: "🎵 Free play", weg: "📜 Barradin's Road" },
      weg: {
        text: "From the back alley to the gods: Barradin plays his way up, stage by stage. Every audience is pickier, every piece harder – and the performance check has to beat the DC, or the road ends here.",
        rang: "Fame", sterne: "Stars", station: n => "Stage " + n, gesperrt: "Still locked",
        publikum: "Audience", sg: n => "DC " + n, lied: "Piece",
        start: "▶ Perform", nochmal: "↻ Try again", wiederholen: "↻ Play it again", weiter: "On to the next stage →",
        gegen: n => "Performance check against DC " + n, bestanden: "Success!", durchgefallen: "Not quite …",
        neuerRang: r => "New fame: " + r, ende: "Barradin's road is complete. The gods are humming his song.",
        zuruecksetzen: "Start the road over", sicher: "Really erase all progress?",
        unbekannt: "Unknown bard",
        raenge: ["Street musician", "Dive singer", "Harbour bard", "Inn singer", "Festival bard", "Ballroom musician", "Castle bard", "Minstrel of the Underdark", "Court bard of Neverwinter", "Darling of the fey", "God-kissed bard"],
        stationen: [
          { ort: "\"The Lame Donkey\" – a street pub in Phandalin", publikum: "Three farmers, a sleeping dog and the innkeeper",
            intro: "A legend has to start somewhere. Why not here, between spilled beer and a dog that dreams very loudly?",
            sieg: "The innkeeper pours me a free ale. A farmer whispers that down by the harbour there's a dive where only the brave dare to play.",
            pleite: "The dog woke up. And left. Quick, another try before the farmers leave too." },
          { ort: "\"The Drowned Rat\" – a dive by the harbour", publikum: "Cutthroats, smugglers and a bugbear who looks at no one",
            intro: "Here you pay with gold, with blood or with a good song. All I have is a lute. So: a good song.",
            sieg: "The bugbear nods. Nobody gets stabbed. In this dive, that's a standing ovation.",
            pleite: "A knife is stuck in the beam next to my head. Criticism, I suppose. Constructive, at least." },
          { ort: "\"The Sailor's Yarn\" – a harbour tavern", publikum: "A ship's crew on shore leave, loud and thirsty",
            intro: "Sailors sing along whether you want them to or not. The trick is getting them to sing the right thing.",
            sieg: "The whole crew roars the chorus. The captain writes me a recommendation for a fine inn – on a fish scale, but still.",
            pleite: "They took over my song. With new lyrics. About me. Not nice." },
          { ort: "\"The Silver Tankard\" – a respectable inn", publikum: "Merchants, travellers and a lady with a monocle",
            intro: "Tablecloths! Napkins! Nobody throws herrings. Here you have to impress quietly – with a lament that goes straight to the heart.",
            sieg: "The lady is so moved her monocle drops into her soup. She knows the mayor of Phandalin personally – and he needs music for his harvest festival.",
            pleite: "They stayed politely silent. Very politely. For a very long time." },
          { ort: "The harvest festival of Phandalin's mayor", publikum: "The mayor, his councillors and his closely guarded purse",
            intro: "We've met. He hates paying. This time he shouldn't just pay – he should enjoy it.",
            sieg: "He paid! Without haggling! That has never happened in Phandalin. His brother-in-law, a landgrave, is giving a ball next month …",
            pleite: "\"Very nice,\" says the mayor, holding out a copper coin. One. To share." },
          { ort: "The landgrave's ball", publikum: "Dancing nobles who notice every wrong beat",
            intro: "A waltz. Hundreds of feet following my beat. If I stumble, the whole ballroom stumbles.",
            sieg: "The hall spins as if I had wound it up. A pale prince in black velvet invites me to his castle. He smiles with … a great many teeth.",
            pleite: "A count tripped over his countess. Both are looking at me. I am looking at the door." },
          { ort: "Castle Nightcrag", publikum: "A pale prince and guests who never blink",
            intro: "Candles that don't flicker. Mirrors with no one in them. I'm playing Ezekiel's Shadow Dance – he said it would go down well here.",
            sieg: "The prince claps slowly. Then he hands me a letter of passage to the Underdark, to the court of King Horga Stahl V. \"He likes music with a bite.\"",
            pleite: "The guests eye me as if I were dinner. Better try again – quickly." },
          { ort: "The stronghold of King Horga Stahl V.", publikum: "A dwarf king who only tolerates music in time with his forge hammers",
            intro: "We've stood before him once already – as prisoners. This time I came willingly. Hammer and anvil, in time with his heart. Hopefully he has one.",
            sieg: "King Horga pounds the armrest of his throne – in time! He sends a messenger to the surface: the palace of Neverwinter shall hear of me.",
            pleite: "The king raises an eyebrow. The guards raise their axes. I raise my lute and start again." },
          { ort: "The palace of Neverwinter", publikum: "The court, the crown council and a lot of jealous trumpeters",
            intro: "Marble, banners, a hall so high my echo won't come back until tomorrow. A hymn to the crown – not a single note may waver.",
            sieg: "They name me court bard! And that night a figure made of moonlight stands at my window: the Fey Queen wants to hear me.",
            pleite: "A trumpeter grins. I can't let that stand." },
          { ort: "The Fey Queen's court in the Moon Grove", publikum: "Fey, dryads and a queen who hasn't heard anything new in a thousand years",
            intro: "Here the music is older than the trees. Echo would feel right at home. I feel … very mortal.",
            sieg: "The Fey Queen sheds a single tear. It becomes a star, and the star points the way to the Halls of the Eternal Song.",
            pleite: "The fey giggle. One of them has tied my strings into flowers. Once more – with dignity." },
          { ort: "The Halls of the Eternal Song", publikum: "The gods themselves",
            intro: "No road leads here, only a song. Whoever plays here plays for eternity. No mistakes, Barradin. No. Mistakes.",
            sieg: "The gods rise. My song is written into the stars, and somewhere in Phandalin a dog wakes up and wags its tail.",
            pleite: "One god coughs. Another smiles indulgently. Immortals have time – and I have another try." }
        ]
      }
    }
  };
  const t = () => TX[sprache()];
  const zit = x => sprache() === "en" ? "“" + esc(x) + "”" : "„" + esc(x) + "“";

  /* ---------- Schwierigkeit ----------
     Je Stufe: Tempo, Flugzeit der Noten (länger = mehr Abstand, besser lesbar), Liedlänge,
     Rhythmus-Motive der Laute, Bassschläge, Einsätze von Echos Flöte (in geraden/ungeraden Takten),
     ob Doppelnoten erlaubt sind. Die Flöte antwortet der Laute: sie spielt vor allem in deren Pausen. */
  const STUFEN = {
    leicht: { basis: "leicht", tempo: 80, flug: 2.4, takte: 8, motive: [[4, 8, 12], [4, 8], [4, 10, 12], [4, 6, 8, 12]], bass: [0], floete: { g: [], u: [14] }, akkord: false },
    mittel: { basis: "mittel", tempo: 92, flug: 2.1, takte: 12, motive: [[2, 4, 6, 12], [4, 6, 10, 12], [2, 4, 10, 12, 14], [4, 6, 12, 14]], bass: [0, 8], floete: { g: [14], u: [10, 14] }, akkord: false },
    schwer: { basis: "schwer", tempo: 104, flug: 1.8, takte: 16, motive: [[0, 2, 4, 6, 8, 12], [0, 3, 6, 8, 10, 12], [2, 4, 6, 8, 10, 12, 14], [0, 4, 6, 8, 12, 14]], bass: [0, 8], floete: { g: [6, 14], u: [6, 10, 14] }, akkord: true }
  };
  const FENSTER = { perfekt: .05, gut: .1, knapp: .14 };
  const PUNKTE = { perfekt: 100, gut: 75, knapp: 45 };
  const FEHLGRIFF = 50; /* Abzug je Tipp ins Leere – Hämmern lohnt sich nicht */
  const FARBEN = ["#b5643c", "#e0a046", "#f0d48a"];
  const ZEICHEN = ["♩", "♪", "♫"];
  const TASTEN_ANZEIGE = ["A", "S", "D"];

  /* ---------- Lieder ----------
     Jedes Lied: Tonleiter, Grundton, Akkordfolge (Stufen je Takt), Tempo-Faktor, Taktart (16 = 4/4, 12 = 3/4).
     Die Melodie wird bei jedem Auftritt neu erfunden, folgt aber Akkorden und Motiven – so bleibt sie singbar. */
  const MODI = { dorisch: [0, 2, 3, 5, 7, 9, 10], ionisch: [0, 2, 4, 5, 7, 9, 11], aeolisch: [0, 2, 3, 5, 7, 8, 10],
    phrygisch: [0, 1, 3, 5, 7, 8, 10], mixolydisch: [0, 2, 4, 5, 7, 9, 10], harmonisch: [0, 2, 3, 5, 7, 8, 11], lydisch: [0, 2, 4, 6, 7, 9, 11] };
  const LIEDER = {
    reigen: { modus: "dorisch", grund: 62, tempo: 1, folge: [0, 6, 3, 0, 0, 6, 3, 4], takt: 16 },
    bugbear: { modus: "ionisch", grund: 60, tempo: 1.08, folge: [0, 3, 4, 0, 5, 3, 4, 4], takt: 16 },
    klage: { modus: "aeolisch", grund: 64, tempo: .85, folge: [0, 5, 2, 6, 0, 5, 3, 4], takt: 16 },
    schmiede: { modus: "phrygisch", grund: 64, tempo: 1, folge: [0, 1, 0, 6, 0, 1, 6, 0], takt: 16, bass: [0, 6, 12] },
    seemann: { modus: "mixolydisch", grund: 62, tempo: 1.05, folge: [0, 6, 0, 4, 0, 6, 3, 0], takt: 16 },
    walzer: { modus: "harmonisch", grund: 62, tempo: 1.1, folge: [0, 0, 3, 4, 0, 3, 4, 4], takt: 12 },
    /* Lieder mit eigenem Rhythmus: vor Bauern gelten die einfachen Standard-Rhythmen, ab dem Hof von König Horga ihre eigenen */
    schatten: { modus: "phrygisch", grund: 62, tempo: 1.12, folge: [0, 1, 0, 6, 0, 1, 5, 6], takt: 16, bass: [0, 6, 8, 14],
      motive: [[0, 3, 6, 10, 12], [2, 3, 6, 8, 11], [0, 3, 6, 10, 13], [3, 6, 8, 11]], floete: { g: [4, 14], u: [4, 9, 14] } },
    rex: { modus: "mixolydisch", grund: 64, tempo: 1.22, folge: [0, 6, 0, 4, 0, 6, 3, 4], takt: 16, bass: [0, 8],
      motive: [[0, 2, 4, 6, 8, 10, 12], [0, 2, 4, 8, 10, 12], [0, 2, 4, 6, 8, 12], [2, 4, 6, 8, 10, 12]], floete: { g: [14], u: [7, 14] } },
    ploop: { modus: "dorisch", grund: 62, tempo: 1.18, folge: [0, 3, 0, 4, 0, 3, 6, 0], takt: 12, bass: [0, 6], puls: [3, 6, 9],
      motive: [[0, 3, 6, 9], [0, 2, 3, 6, 8], [0, 3, 4, 6, 9], [0, 6, 9]], floete: { g: [10], u: [4, 10] } },
    venom: { modus: "harmonisch", grund: 64, tempo: 1.08, folge: [0, 5, 3, 4, 0, 3, 5, 4], takt: 16, bass: [0, 8],
      motive: [[0, 2, 4, 6, 8, 12], [0, 3, 6, 8, 11], [2, 4, 6, 10, 12], [0, 4, 6, 8, 10, 12]], floete: { g: [2, 10], u: [6, 10, 14] } },
    /* Stücke, die es nur auf Barradins Weg gibt */
    buerger: { nurWeg: true, modus: "ionisch", grund: 60, tempo: 1.04, folge: [0, 4, 5, 3, 0, 3, 4, 0], takt: 16, bass: [0, 8],
      motive: [[0, 4, 6, 8, 12], [2, 4, 8, 10, 12], [0, 4, 8, 12, 14], [4, 6, 8, 10, 12]], floete: { g: [14], u: [6, 14] } },
    palast: { nurWeg: true, modus: "ionisch", grund: 62, tempo: 1, folge: [0, 3, 4, 0, 5, 3, 1, 4], takt: 16, bass: [0, 4, 8, 12],
      motive: [[0, 2, 4, 6, 8, 12], [0, 4, 6, 8, 10, 12], [2, 4, 6, 8, 12, 14], [0, 3, 4, 8, 10, 12]], floete: { g: [10, 14], u: [6, 10, 14] } },
    elfen: { nurWeg: true, modus: "lydisch", grund: 64, tempo: 1.12, folge: [0, 1, 0, 4, 5, 1, 4, 0], takt: 12, bass: [0, 6], puls: [6],
      motive: [[0, 2, 4, 6, 8, 10], [0, 4, 6, 8, 10], [2, 4, 6, 8, 10], [0, 2, 6, 8, 10]], floete: { g: [3, 9], u: [3, 7, 11] } },
    goetter: { nurWeg: true, modus: "aeolisch", grund: 62, tempo: 1, folge: [0, 5, 6, 0, 3, 5, 6, 4], takt: 16, bass: [0, 6, 8, 12],
      motive: [[0, 2, 4, 6, 8, 10, 12, 14], [0, 3, 4, 6, 8, 11, 12], [2, 4, 6, 8, 10, 12, 14], [0, 2, 4, 7, 8, 10, 12]], floete: { g: [5, 13], u: [3, 9, 15] } }
  };
  /* ---------- Komponierte Melodien ----------
     Je Lied acht Takte, ein Zeichen je Schritt: „.“ = Pause, sonst die Stufe in der Tonleiter
     (0 = Grundton, 7 = Oktave, a/b/c = 10/11/12), „-“ = Ton halten. Aufbau: Hook – Antwort – Hook – Schluss.
     Ab sechs Schritten Länge wird ein gehaltener Ton zur Haltenote (gedrückt halten).
     Leichtere Stufen spielen nur die erste Note je Schlag (bzw. Halbschlag) – die Melodie bleibt erkennbar. */
  const MELODIEN = {
    reigen: ["4.7.7.8.9.8.7...", "6...8.7.6...3...", "5.7.a.9.7.6.5...", "4.2.4...7-------", "4.7.7.8.9.8.7...", "6...8.a.8.7.6...", "5...7.5.3.4.5...", "8...6...4-------"],
    bugbear: ["4.4.7...7.8.9.7.", "a.9.7...5.7.3...", "8.8.6...4.5.6.8.", "7...9.b.7-------", "9.9.7...5.6.7.9.", "a...7...5.7.a...", "b.a.8...6...4...", "4.5.6.7.8-------"],
    klage: ["4...7...9.8.7...", "7...5...2-------", "6...4.6.9...6.4.", "3...1.3.6-------", "4...7...9.8.7...", "7...9.a.9.7.5...", "3...5...7...5.3.", "4...8...6-------"],
    schmiede: ["0...0.4.2...0...", "1...3.5.3...1...", "2...4.7.4.2.0...", "1...3...6...3...", "7...7.6.4...2.0.", "1.3.5...8...5...", "6...3...1...3...", "4...2...0-------"],
    seemann: ["4...7.7.7...9.8.", "8...8.7.6...3...", "4...7.7.7.8.9.a.", "8...6...4.6.8...", "4...7.7.7...9.8.", "a...8...6.7.8...", "7...5...3.4.5...", "4...7...9-------"],
    walzer: ["4...7...9...", "9.8.7-------", "5...7...a...", "a.9.8-------", "4...7...9...", "a...7...5...", "6...8...4...", "8.7.6-------"],
    schatten: ["7..4..2...4.7...", "8..5..3...5.8.7.", "7..4..2...3.4...", "6..3..1...3.6...", "7..4..2...4.7...", "a..8..5...8.a...", "9..7..5...7.9...", "8..7..6...3-----"],
    rex: ["7.7.4...7.7.9...", "8...6...3.4.6...", "7.7.4...2.3.4...", "6...4...1-------", "7.7.4...7.7.9...", "a...8...6...3...", "5...7...3.4.5...", "4...6...8-------"],
    ploop: ["7.47.89.87.4", "5.7a.75.73..", "4.79.87.64..", "6.84.68..4..", "7.47.89.87.4", "a.97.53.57..", "8.63.68.76..", "7..4..0-----"],
    venom: ["7.6.7...4...2...", "5.4.5...2...0...", "3.4.5...7...a...", "8.7.6...4-------", "7.6.7...4...2...", "a.9.7...5...3...", "9.8.7...5...7...", "6...8...4-------"],
    buerger: ["7...7.9.b...9.7.", "8...6.8.b...8...", "7...5.7.9.8.7...", "5...7...a-------", "7...7.9.b...9.7.", "a...7...5.7.a...", "4.4.6...8...6.8.", "7...4...0-------"],
    palast: ["7-----4.4...7.9.", "a-------7...5...", "6...8...4...6.8.", "9-------7-------", "5.6.7...9.8.7...", "a.9.a...7...5...", "8.9.a...5...8...", "4...6...8-------"],
    elfen: ["4.7.9...7...", "5.8.a...8...", "9.8.7-------", "6...4-------", "5.7.9...7...", "5.8.a...8...", "4.6.8...6...", "7-----4-----"],
    goetter: ["7...4.7.9.8.7.4.", "7...5.7.9...7...", "8...6.8.a.9.8.6.", "7-------4...7...", "a.9.7...5...7...", "9...7...5.6.7...", "8...a...8.7.6...", "4.6.8...6-------"]
  };
  Object.keys(MELODIEN).forEach(k => { if (LIEDER[k]) LIEDER[k].melodie = MELODIEN[k]; });
  LIEDER.ploop.raster = [4, 3, 2]; /* Jig: Schläge zu je drei Schritten */
  LIEDER.schmiede.bassGleich = true; LIEDER.schatten.bassGleich = true;
  /* ---------- Barradins Weg ----------
     Elf Bühnen, jede mit eigenem Stück, eigener Schwierigkeit und einem Schwierigkeitsgrad (SG),
     den der Auftrittswurf erreichen muss. Fehlende Angaben kommen von der Grundstufe. */
  const station = (basis, lied, sg, mehr) => ({ lied, sg, st: Object.assign({}, STUFEN[basis], { basis }, mehr) });
  const WEG = [
    station("leicht", "reigen", 10, { tempo: 76, flug: 2.5, takte: 8, floete: { g: [], u: [] } }),
    station("leicht", "bugbear", 11, { tempo: 76, flug: 2.4, takte: 8 }),
    station("mittel", "seemann", 12, { tempo: 84, flug: 2.3, takte: 10, motive: [[4, 8, 12], [2, 4, 8, 12], [4, 6, 8, 12], [4, 10, 12, 14]], floete: { g: [], u: [14] } }),
    station("mittel", "klage", 13, { tempo: 106, flug: 2.2, takte: 10 }),
    station("mittel", "buerger", 14, { tempo: 90, flug: 2.1, takte: 12 }),
    station("schwer", "walzer", 15, { tempo: 88, flug: 2.0, takte: 12, akkord: false }),
    station("schwer", "schatten", 16, { tempo: 88, flug: 1.95, takte: 14, akkord: false }),
    station("schwer", "schmiede", 17, { tempo: 102, flug: 1.85, takte: 14 }),
    station("schwer", "palast", 18, { tempo: 106, flug: 1.8, takte: 16 }),
    station("schwer", "elfen", 19, { tempo: 98, flug: 1.7, takte: 16 }),
    station("schwer", "goetter", 21, { tempo: 114, flug: 1.6, takte: 20 })
  ];
  const WEG_ZEICHEN = ["🍺", "🐀", "⚓", "🕯️", "💰", "💃", "🦇", "⚒️", "👑", "🌙", "✨"];
  const FOLGEN = {
    dorisch: [[0, 6, 3, 0], [0, 3, 0, 6], [0, 6, 0, 3], [0, 4, 3, 0]], ionisch: [[0, 3, 4, 0], [0, 5, 3, 4], [0, 4, 5, 3], [0, 3, 0, 4]],
    aeolisch: [[0, 5, 2, 6], [0, 3, 6, 0], [0, 5, 3, 4], [0, 6, 5, 6]], phrygisch: [[0, 1, 0, 6], [0, 1, 6, 0], [0, 6, 5, 1]],
    mixolydisch: [[0, 6, 3, 0], [0, 6, 0, 4], [0, 3, 6, 0]], harmonisch: [[0, 3, 4, 0], [0, 5, 3, 4], [0, 3, 0, 4]],
    lydisch: [[0, 1, 0, 4], [0, 1, 5, 0], [0, 4, 1, 0]]
  };
  /* Walzer-Motive (12 Schritte je Takt) je Publikum */
  const WALZER = { leicht: [[4, 8], [4, 8, 10], [8], [4, 6, 8]], mittel: [[2, 4, 8], [4, 6, 8, 10], [2, 4, 6, 8], [4, 8, 10]],
    schwer: [[0, 2, 4, 6, 8, 10], [0, 4, 6, 8, 10], [2, 4, 6, 8, 10], [0, 3, 4, 8, 10]] };
  const FLOETE_WALZER = { leicht: { g: [], u: [10] }, mittel: { g: [10], u: [6, 10] }, schwer: { g: [4, 10], u: [4, 8, 10] } };
  /* Barradin improvisiert: ein Motiv wird erfunden und dann wiederholt und den Akkorden nachgeführt –
     so entsteht ein Hook statt Zufallsgedudel. */
  const RHYTHMEN = { 16: ["x.x.x.x.x...x...", "x...x.x.x...x...", "x.x.x...x.x.x...", "x...x...x.x.x.x.", "x..x..x...x.x...", "x.x.x...x...x.x.", "x...x.x.x.x.x..."],
    12: ["x...x...x...", "x.x.x...x...", "x...x.x.x.x.", "x.x.x.x.x..."] };
  const SCHLUSS = { 16: "x...x...x.......", 12: "x...x...x..." };
  function melodieErfinden(modus, folge, L) {
    const R = RHYTHMEN[L], a = zufall(R), b = zufall(R.filter(x => x !== a)), c = zufall(R);
    const form = [a, b, a, c, a, b, a, SCHLUSS[L]];
    const formen = new Map();
    const gestalt = r => {
      if (!formen.has(r)) { let v = zufall([0, 2, 4]); formen.set(r, [...r].map((ch, i) => { if (ch !== "x") return null; if (i) v = Math.max(-2, Math.min(6, v + zufall([-2, -1, -1, 0, 1, 1, 2]))); return v; })); }
      return formen.get(r);
    };
    const zeichen = "0123456789abc";
    return form.map((r, takt) => {
      const g = folge[takt % folge.length], tone = [g % 7, (g + 2) % 7, (g + 4) % 7];
      const basis = g < 3 ? g + 7 : g, gs = takt === 7 ? [4, 2, 0, null] : gestalt(r);
      let k = 0, vor1 = null, vor2 = null;
      return [...r].map((ch, i) => {
        if (ch !== "x") return ".";
        const v = takt === 7 ? [4, 2, 0][k++] : gs[i];
        const ziel = Math.max(0, Math.min(12, basis + v - 3));
        let best = null;
        /* nicht dreimal derselbe Ton hintereinander */
        const ok = n => (i % 4 ? true : tone.includes(n % 7)) && !(n === vor1 && n === vor2);
        for (let n = 0; n <= 12; n++) if (ok(n) && (best === null || Math.abs(n - ziel) < Math.abs(best - ziel))) best = n;
        vor2 = vor1; vor1 = best;
        return zeichen[best];
      }).join("");
    });
  }
  function liedErfinden() {
    const modus = zufall(Object.keys(MODI)), E = TX.de.erfinden, takt = Math.random() < .25 ? 12 : 16;
    const folge = zufall(FOLGEN[modus]).concat(zufall(FOLGEN[modus]));
    return { modus, grund: zufall([60, 62, 63, 64, 65]), tempo: zufall([.92, 1, 1.05, 1.12]), takt, folge, melodie: melodieErfinden(modus, folge, takt),
      name: [Math.floor(Math.random() * E.vorlage.length), Math.floor(Math.random() * E.adj.length), Math.floor(Math.random() * E.nom.length)] };
  }
  const liedName = (l, T) => l.name ? T.erfinden.vorlage[l.name[0]].replace("{a}", T.erfinden.adj[l.name[1]]).replace("{n}", T.erfinden.nom[l.name[2]]) : T.lieder[l.key];
  const skala = modus => Array.from({ length: 13 }, (_, n) => MODI[modus][n % 7] + 12 * Math.floor(n / 7));
  const akkordToene = g => [g % 7, (g + 2) % 7, (g + 4) % 7];
  const nah = (ziel, erlaubt) => { let b = null; for (let r = 0; r <= 9; r++) if (erlaubt(r) && (b === null || Math.abs(r - ziel) < Math.abs(b - ziel))) b = r; return b; };
  let SK = skala("dorisch"), GRUND = 62;
  /* Komponiertes Lied spielen: feste Melodie, Bass auf Grundton/Quinte, Echos Flöte eine Terz darüber in den Lücken */
  const STUFE_INDEX = { leicht: 0, mittel: 1, schwer: 2 };
  const HALT_MIN = 6; /* Schritte – ab dieser Länge muss man halten */
  function notenAusMelodie(st, lied, L, schritt, vor, akkord, eigen, bassSchritte) {
    const liste = [], akkorde = [], auto = [];
    const idx = STUFE_INDEX[st.basis] || 0, fenster = (lied.raster || [4, 2, 1])[idx];
    /* Reihenfolge der Takte: das Lied endet immer mit seinen letzten Takten; längere Auftritte spielen vorne mehr */
    const vorn = Math.max(0, st.takte - 8), folgeTakte = [];
    for (let i = 0; i < vorn; i++) folgeTakte.push(i % 8);
    for (let i = 0; i < Math.min(7, st.takte - 1); i++) folgeTakte.push(i);
    const zeit = (takt, s) => vor + (takt * L + s) * schritt;
    let fl = 4; /* Echos Flöte: Stufe über dem Grundton der Flötenlage */
    const naechsterAkkordton = (ziel, tone, ohne, min, max) => { let b = null; for (let n = min; n <= max; n++) if (tone.includes(n % 7) && n % 7 !== ohne && (b === null || Math.abs(n - ziel) < Math.abs(b - ziel))) b = n; return b == null ? ziel : b; };
    for (let takt = 0; takt < st.takte; takt++) {
      const letzter = takt === st.takte - 1, mt = folgeTakte[takt];
      const grund = letzter ? 0 : lied.folge[mt % lied.folge.length], tone = akkordToene(grund); akkorde.push(grund);
      const belegt = {};
      const setze = (s, spur, n, len, klingt) => {
        const halten = len >= HALT_MIN;
        liste.push({ zeit: zeit(takt, s), spur, ton: n, dauer: halten ? len * schritt : 0, klang: (klingt || len) * schritt, status: null }); belegt[s] = true;
      };
      const begleite = (s, spur, n, len, klingt) => auto.push({ zeit: zeit(takt, s), spur, ton: n, klang: (klingt || len) * schritt });
      if (letzter) { /* Schluss: Bass auf der Eins, die Laute hält den Grundton aus, die Flöte die Quinte darüber */
        setze(0, 0, 0, 2); setze(akkord ? 0 : 4, 1, 7, L - (akkord ? 0 : 4)); begleite(0, 2, 4, L);
        continue;
      }
      /* Melodie: Einsätze mit Länge („-“ hält); je Fenster spielt man die erste Note, den Rest spielt die Band */
      const zeile = lied.melodie[mt % lied.melodie.length], einsaetze = [];
      for (let s = 0; s < L; s++) {
        const ch = zeile[s]; if (!ch || ch === "." || ch === "-") continue;
        let len = 1; while (zeile[s + len] === "-") len++;
        let klingt = len; if (len === 1) { klingt = 1; while (s + klingt < L && zeile[s + klingt] === ".") klingt++; klingt = Math.min(4, klingt); }
        einsaetze.push({ s, n: parseInt(ch, 16), len, klingt });
      }
      const laute = {};
      let fensterBelegt = -1;
      einsaetze.forEach(e => {
        const f = Math.floor(e.s / fenster);
        if (f !== fensterBelegt) { fensterBelegt = f; laute[e.s] = e.n; setze(e.s, 1, e.n, e.len, e.klingt); }
        else begleite(e.s, 1, e.n, e.len, e.klingt);
      });
      /* Bass: Grundton, beim zweiten Schlag die Quinte; kollidiert er (ohne Doppelnoten) mit der Melodie, spielt ihn die Band */
      bassSchritte.forEach((s, k) => {
        const n = lied.bassGleich || k % 2 === 0 ? grund : grund + 4;
        if (!akkord && laute[s] != null) begleite(s, 0, n, 4); else setze(s, 0, n, 2);
      });
      /* Echos Flöte: hält Akkordtöne als Gegenstimme (weich geführt) – und wo die Laute einen langen Ton hält,
         antwortet sie mit einer kleinen absteigenden Figur. Spielbar ist sie in jedem zweiten Takt (mittel: nur ihr erster Ton). */
      const spielbar = (s, erste) => takt % 2 === 1 && (idx === 2 || (idx === 1 && erste && !belegt[s]));
      const letzte = einsaetze[einsaetze.length - 1];
      const melodieBei = s => { let n = null; einsaetze.forEach(e => { if (e.s <= s) n = e.n; }); return n == null ? -1 : n % 7; };
      if (letzte && letzte.len >= HALT_MIN && letzte.s + 2 < L) {
        let n = naechsterAkkordton(fl + 2, tone, melodieBei(letzte.s), 2, 9);
        for (let s = letzte.s + 2, k = 0; s < L && k < 3; s += 2, k++) {
          const len = s + 2 >= L || k === 2 ? L - s : 2;
          (spielbar(s, k === 0) && (idx === 2 || !belegt[s]) ? setze : begleite)(s, 2, n, len);
          fl = n; n = n > 0 ? naechsterAkkordton(n - 2, tone, -1, 0, n - 1) : n; if (n < 0) n = fl;
        }
      } else {
        const s0 = belegt[0] ? 2 : 0; /* setzt kurz nach der Eins ein – wie eine Antwort */
        fl = naechsterAkkordton(fl, tone, melodieBei(s0), 2, 8);
        (spielbar(s0, true) && (idx === 2 || !belegt[s0]) ? setze : begleite)(s0, 2, fl, L - s0);
      }
    }
    liste.sort((a, b) => a.zeit - b.zeit);
    return { liste, ende: vor + st.takte * L * schritt + 1.5, schritt, vor, akkorde, L, puls: lied.puls, auto, modus: lied.modus };
  }
  function noten(st, lied) {
    const L = lied.takt, stufe = st.basis, schritt = 60 / (st.tempo * lied.tempo) / 4, vor = 16 * schritt, liste = [], akkorde = [];
    SK = skala(lied.modus); GRUND = lied.grund;
    const eigen = st.basis !== "leicht", akkord = st.akkord;
    const motive = lied.motive && eigen ? lied.motive : (L === 12 ? WALZER[stufe] : st.motive);
    const bassSchritte = lied.bass && eigen ? lied.bass : (L === 12 ? [0] : st.bass);
    const floete = lied.floete && eigen ? lied.floete : (L === 12 ? FLOETE_WALZER[stufe] : st.floete);
    if (lied.melodie) return notenAusMelodie(st, lied, L, schritt, vor, akkord, eigen, bassSchritte);
    let fton = 4; /* Flötenstimme: Stufe in der Tonleiter, eine Oktave über der Laute */
    /* Phrasen: Motiv a, b, a, Schluss – die Kontur jedes Motivs wird einmal erfunden und dann wiederholt */
    const konturen = motive.map(m => m.map(() => zufall([-2, -1, -1, 1, 1, 2])));
    const plan = [0, 1, 0, 2, 3, 3, 0, 2];
    let ton = 4;
    for (let takt = 0; takt < st.takte; takt++) {
      const letzter = takt === st.takte - 1;
      const grund = letzter ? 0 : lied.folge[takt % lied.folge.length]; akkorde.push(grund);
      const mi = plan[takt % plan.length], motiv = motive[mi], kontur = konturen[mi];
      const belegt = {}, laute = {};
      const setze = (s, spur, n) => { liste.push({ zeit: vor + (takt * L + s) * schritt, spur, ton: n, status: null }); belegt[s] = (belegt[s] || 0) + 1; if (spur === 1) laute[s] = n; };
      bassSchritte.forEach(s => { if (!letzter || s === 0) setze(s, 0, grund); });
      if (letzter) { /* Schlussakkord: Laute auf dem Grundton, die Flöte hält die Quinte darüber */
        setze(akkord ? 0 : 4, 1, 7); if (eigen) setze(8, 2, 4); continue; }
      if (takt % 4 === 0) ton = 4;
      motiv.forEach((s, k) => {
        if (!akkord && belegt[s]) return;
        const ziel = ton + kontur[k];
        ton = s % 4 === 0 ? nah(ziel, r => akkordToene(grund).includes(r % 7)) : nah(ziel, () => true);
        setze(s, 1, ton);
      });
      /* Echos Flöte: antwortet in den Pausen der Laute, immer auf einem Akkordton; nie im Einklang mit der Laute */
      (takt % 2 ? floete.u : floete.g).forEach(s => {
        if (!akkord && belegt[s]) return;
        const passt = r => akkordToene(grund).includes(r % 7) && (laute[s] == null || r % 7 !== laute[s] % 7);
        fton = nah(fton + zufall([-2, -1, 1, 2]), passt); if (fton == null) fton = 4;
        setze(s, 2, fton);
      });
    }
    liste.sort((a, b) => a.zeit - b.zeit);
    return { liste, ende: vor + st.takte * L * schritt + 1.5, schritt, vor, akkorde, L, puls: lied.puls };
  }

  /* ---------- Klang ----------
     Echte Aufnahmen (klang/, siehe LIZENZ.txt): Kontrabass gezupft, Laute, Flöte, Bodhrán, Holzblock.
     Zwischentöne entstehen durch leichtes Umstimmen der nächstgelegenen Aufnahme.
     Fehlt eine Aufnahme (noch nicht geladen, offline), spielt der berechnete Klang (Karplus-Strong-Saiten). */
  let ctx = null, ausg = null, rausch = null, bus = null; /* bus: eigener Ausgang je Auftritt – beim Abbrechen wird er abgeklemmt */
  const saiten = new Map();
  function audio() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      ctx = new AC();
      const komp = ctx.createDynamicsCompressor(); komp.threshold.value = -16; komp.ratio.value = 2.5;
      ausg = ctx.createGain(); ausg.gain.value = .7 * pegel(); ausg.connect(komp); komp.connect(ctx.destination);
      rausch = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
      const d = rausch.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      /* iOS: Anruf, Siri, Wecker … unterbrechen den Klang („interrupted“) – dann pausiert der Auftritt */
      ctx.addEventListener("statechange", () => { if (spiel && !spiel.pause && ctx.state !== "running" && ctx.state !== "closed") pausieren(); });
    }
    if (ctx.state === "suspended" || ctx.state === "interrupted") { const p = ctx.resume(); if (p && p.catch) p.catch(() => {}); }
  }
  /* Lautstärke (0–1) und „Ton aus“ – gilt für Musik, Klicks und Applaus, wird gemerkt */
  let lautstaerke = 1, stumm = false;
  try { const v = parseFloat(localStorage.getItem("imres-auftritt-laut")); if (isFinite(v)) lautstaerke = Math.max(0, Math.min(1, v)); stumm = localStorage.getItem("imres-auftritt-stumm") === "1"; } catch (_) {}
  const pegel = () => stumm ? 0 : lautstaerke * lautstaerke; /* quadratisch: der Regler fühlt sich gleichmäßiger an */
  const pegelSetzen = () => { if (ausg) ausg.gain.setTargetAtTime(.7 * pegel(), ctx.currentTime, .03); };
  /* Hörzeit: die Stelle im Lied, die in diesem Moment (bzw. zum Zeitpunkt ms eines Tipps) aus dem Lautsprecher kommt.
     ctx.currentTime ist der Ausgabe um die Ausgabelatenz voraus; getOutputTimestamp verbindet Audio-Uhr und performance.now(). */
  function hoerZeit(ms) {
    const jetzt = performance.now();
    if (!(ms > 0) || ms > jetzt + 5 || ms < jetzt - 2000) ms = jetzt;
    const roh = ctx.currentTime - (jetzt - ms) / 1000;
    if (ctx.state === "running" && ctx.getOutputTimestamp) {
      try {
        const o = ctx.getOutputTimestamp();
        if (o && o.performanceTime > 0 && o.contextTime > 0) {
          const z = o.contextTime + (ms - o.performanceTime) / 1000;
          if (z <= roh + .005 && z >= roh - .5) return z;
        }
      } catch (_) {}
    }
    return roh - (ctx.outputLatency || 0) - (ctx.baseLatency || 0);
  }
  /* Kalibrierung: wie viele Sekunden dieser Spieler (mit diesem Gerät) im Mittel nach dem Klick tippt */
  let kalibWert = 0;
  try { const v = parseFloat(localStorage.getItem("imres-auftritt-kalib")); if (isFinite(v)) kalibWert = Math.max(-.25, Math.min(.25, v)); } catch (_) {}
  const hz = m => 440 * Math.pow(2, (m - 69) / 12);
  function saite(f, dauer, daempf) {
    const key = f.toFixed(1) + "|" + dauer;
    if (saiten.has(key)) return saiten.get(key);
    const sr = ctx.sampleRate, n = Math.round(sr * dauer), buf = ctx.createBuffer(1, n, sr), d = buf.getChannelData(0);
    const p = Math.max(2, Math.round(sr / f)), ring = new Float32Array(p);
    for (let j = 0; j < p; j++) ring[j] = Math.random() * 2 - 1;
    for (let k = 0; k < 2; k++) for (let j = 0; j < p; j++) ring[j] = (ring[j] + ring[(j + 1) % p]) / 2;
    let idx = 0;
    for (let j = 0; j < n; j++) { const a = ring[idx], b = ring[(idx + 1) % p]; d[j] = a; ring[idx] = (a + b) * daempf; idx = (idx + 1) % p; }
    saiten.set(key, buf); return buf;
  }
  const melHz = n => hz(GRUND + SK[n]), bassHz = n => hz(GRUND - 24 + SK[n % 7]);
  const MIDI = [n => GRUND - 24 + SK[n % 7], n => GRUND + SK[n], n => GRUND + 12 + SK[n]];
  const KARTE = { harfe: [28, 31, 35, 38, 41, 45, 48, 52, 55, 59, 62, 65, 69, 72, 76, 79, 83, 86, 89, 93, 95, 98, 101], kb: [28, 30, 31, 34, 36, 38, 40, 42, 44, 45, 49, 52, 56, 59],
    gitarre: [36, 39, 42, 45, 48, 51, 54, 57, 60, 63, 66, 69, 72, 75, 78, 81, 84], fl: [60, 64, 69, 72, 76, 81, 84, 88, 93, 96] };
  const SPUR_PROBE = ["kb", "gitarre", "fl"];
  const probeBuf = new Map(), probeLaedt = new Map();
  const probeBasis = (() => { const sk = document.querySelector('script[src*="auftritt"]'); return sk ? sk.src.replace(/auftritt\.js.*$/, "klang/") : "klang/"; })();
  const naechste = (gruppe, m) => KARTE[gruppe].reduce((b, x) => Math.abs(x - m) < Math.abs(b - m) ? x : b);
  const probeName = (gruppe, m) => KARTE[gruppe] ? gruppe + "_" + naechste(gruppe, m) : gruppe;
  function probeLaden(name) {
    if (probeBuf.has(name)) return Promise.resolve(probeBuf.get(name));
    if (probeLaedt.has(name)) return probeLaedt.get(name);
    const c = ctx;
    const pr = fetch(probeBasis + encodeURIComponent(name) + ".mp3").then(r => r.ok ? r.arrayBuffer() : Promise.reject(r.status))
      .then(ab => new Promise((res, rej) => { const x = c.decodeAudioData(ab, res, rej); if (x && x.catch) x.catch(rej); }))
      .then(b => {
        /* MP3 bringt am Anfang etwas Stille mit – überspringen, damit der Ton genau im Takt einsetzt */
        const d = b.getChannelData(0); let m = 0, i = 0;
        for (let k = 0; k < d.length; k++) m = Math.max(m, Math.abs(d[k]));
        while (i < d.length && Math.abs(d[i]) < m * .02) i++;
        b._start = Math.max(0, i - b.sampleRate * .003) / b.sampleRate;
        probeBuf.set(name, b); return b;
      }).catch(() => { probeLaedt.delete(name); return null; });
    probeLaedt.set(name, pr); return pr;
  }
  /* eine Aufnahme spielen; o = { ein, aus, dauer } – false, wenn sie (noch) fehlt */
  function probe(gruppe, m, z, laut, o) {
    const name = probeName(gruppe, m), b = probeBuf.get(name);
    if (!b) return false;
    o = o || {};
    const src = ctx.createBufferSource(), g = ctx.createGain();
    src.buffer = b; if (KARTE[gruppe]) src.playbackRate.value = Math.pow(2, (m - naechste(gruppe, m)) / 12);
    const lang = (b.duration - b._start) / src.playbackRate.value, ein = o.ein || .004;
    const dauer = Math.min(lang, o.dauer || lang), aus = Math.min(o.aus || .2, dauer * .5), ende = z + dauer;
    g.gain.setValueAtTime(0, z); g.gain.linearRampToValueAtTime(laut, z + ein);
    if (dauer < lang) { g.gain.setValueAtTime(laut, Math.max(z + ein, ende - aus)); g.gain.linearRampToValueAtTime(0, ende); }
    src.connect(g); g.connect(o.ziel || bus || ausg); src.start(z, b._start); src.stop(ende + .05);
    return true;
  }
  /* alle Aufnahmen für ein Lied laden (höchstens ein paar Sekunden warten, dann geht es notfalls mit dem Ersatzklang los) */
  function probenFuer(daten) {
    const namen = new Set(["bodh1", "bodh2", "holz1", "holz2"]);
    daten.liste.forEach(n => namen.add(probeName(SPUR_PROBE[n.spur], MIDI[n.spur](n.ton))));
    (daten.auto || []).forEach(a => namen.add(probeName(SPUR_PROBE[a.spur], MIDI[a.spur](a.ton))));
    if (daten.modus) { const MO = MODI[daten.modus]; daten.akkorde.forEach(g => [0, 4, 7, 9, 11].forEach(o => { const d = g + o; namen.add(probeName("harfe", GRUND - 12 + MO[d % 7] + 12 * Math.floor(d / 7))); })); }
    return Promise.race([Promise.all([...namen].map(probeLaden)), new Promise(r => setTimeout(r, 4000))]);
  }
  /* Ersatz-Flöte: weicher Sinus mit etwas Hauch und Vibrato */
  function floeteSynth(f, z, laut, dauer) {
    const o = ctx.createOscillator(), v = ctx.createOscillator(), vg = ctx.createGain(), g = ctx.createGain();
    o.type = "sine"; o.frequency.value = f; v.frequency.value = 5.2; vg.gain.value = f * .006;
    v.connect(vg); vg.connect(o.frequency);
    g.gain.setValueAtTime(0, z); g.gain.linearRampToValueAtTime(laut, z + .04); g.gain.setValueAtTime(laut, z + dauer - .08); g.gain.linearRampToValueAtTime(0, z + dauer);
    o.connect(g); g.connect(bus || ausg); o.start(z); v.start(z); o.stop(z + dauer + .05); v.stop(z + dauer + .05);
    rauschen(z, "bandpass", f * 2, laut * .25, .06);
  }
  function zupfen(f, z, laut, bass) {
    const src = ctx.createBufferSource(), lp = ctx.createBiquadFilter(), g = ctx.createGain();
    src.buffer = bass ? saite(f, 1.8, .4986) : saite(f, 1.4, .4979);
    lp.type = "lowpass"; lp.frequency.value = bass ? 1100 : 4200; lp.Q.value = .6;
    g.gain.value = laut; src.connect(lp); lp.connect(g); g.connect(bus || ausg); src.start(z);
  }
  function rauschen(z, typ, f, laut, dauer) {
    const r = ctx.createBufferSource(), b = ctx.createBiquadFilter(), g = ctx.createGain();
    r.buffer = rausch; b.type = typ; b.frequency.value = f;
    g.gain.setValueAtTime(laut, z); g.gain.exponentialRampToValueAtTime(.0008, z + dauer);
    r.connect(b); b.connect(g); g.connect(bus || ausg); r.start(z, Math.random() * .5, dauer + .02);
  }
  function schlag(z, f0, f1, laut, dauer) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.frequency.setValueAtTime(f0, z); o.frequency.exponentialRampToValueAtTime(f1, z + dauer * .6);
    g.gain.setValueAtTime(laut, z); g.gain.exponentialRampToValueAtTime(.001, z + dauer);
    o.connect(g); g.connect(bus || ausg); o.start(z); o.stop(z + dauer + .02);
  }
  /* Ton spielen: dauer = Klanglänge; lange Lautentöne als Tremolo (schnell wiederholt angeschlagen), damit sie klingen, solange man hält */
  const ton = (spur, n, z, dauer, ziel, faktor) => {
    const m = MIDI[spur](n), f = faktor || 1, sch = (spiel && spiel.daten.schritt) || .16;
    dauer = dauer || 0;
    if (spur === 0) { if (!probe("kb", m, z, .9 * f, { dauer: Math.max(1.1, Math.min(1.8, dauer)), aus: .3, ziel })) zupfen(bassHz(n), z, 1.1 * f, true); }
    else if (spur === 1) {
      if (!probe("gitarre", m, z, .62 * f, { dauer: Math.max(1, Math.min(2.2, dauer + 1)), aus: .35, ziel })) zupfen(melHz(n), z, .8 * f, false);
      if (dauer >= HALT_MIN * sch) for (let t = z + 2 * sch, k = 0; t < z + dauer - .05; t += sch / 2, k++)
        probe("gitarre", m, t, (k % 2 ? .2 : .26) * f, { dauer: Math.min(.45, z + dauer - t + .1), aus: .12, ziel });
    }
    else { const d = Math.max(.32, dauer || 3 * sch); if (!probe("fl", m, z, .36 * f, { ein: .05, aus: .25, dauer: d, ziel })) floeteSynth(hz(m), z, .14 * f, d); }
  };

  /* Fehlgriff: gedämpfte, schnarrende Saite */
  const daneben = z => { rauschen(z, "bandpass", 900, .35, .05); zupfen(hz(45), z, .25, true); };
  /* Begleitung: Rahmentrommel und ein weicher Akkord-Teppich – so klingt es auch zwischen den Treffern nach Musik */
  function begleitung(daten, start) {
    const knoten = [], s = daten.schritt, L = daten.L;
    /* Einzählen auf dem Holzblock */
    for (let i = 0; i < 4; i++) { const z = start + i * 4 * s; if (!probe(i ? "holz2" : "holz1", 0, z, .7, { dauer: .4, aus: .1 })) { rauschen(z, "bandpass", 2200, .35, .04); schlag(z, 900, 700, .05, .05); } }
    /* Bodhrán: schwerer Schlag auf der Eins, leichtere dazwischen */
    const trommel = (z, schwer, laut) => { if (!probe(schwer ? "bodh1" : "bodh2", 0, z, laut, { dauer: .9, aus: .25 })) { if (schwer) schlag(z, 105, 46, .55, .32); else rauschen(z, "bandpass", 1300, .12, .05); } };
    /* Die Band spielt alles, was gerade nicht deine Noten sind – so klingt das Lied immer vollständig */
    (daten.auto || []).forEach(a => ton(a.spur, a.ton, start + a.zeit, a.klang, null, a.spur === 2 ? .8 : .75));
    /* Harfe: gezupfte Akkordbrechung in Achteln – der Teppich unter allem */
    if (daten.modus) {
      const MO = MODI[daten.modus], stufeMidi = d => GRUND - 12 + MO[d % 7] + 12 * Math.floor(d / 7);
      const muster = L === 12 ? [0, 4, 7, 9, 7, 4] : [0, 4, 7, 9, 11, 9, 7, 4];
      daten.akkorde.forEach((g, takt) => {
        const z0 = start + daten.vor + takt * L * s, schluss = takt === daten.akkorde.length - 1;
        muster.forEach((o, k) => { if (schluss && k > 0) return; probe("harfe", stufeMidi(g + o), z0 + k * 2 * s, k === 0 ? .2 : .13, { dauer: schluss ? 2.5 : 1.2, aus: .4 }); });
      });
    }
    daten.akkorde.forEach((g, takt) => {
      const z = start + daten.vor + takt * L * s, dauer = L * s;
      trommel(z, true, .8);
      if (daten.puls) daten.puls.forEach(k => trommel(z + k * s, k === 6, k === 6 ? .55 : .3));
      else if (L === 12) [4, 8].forEach(k => trommel(z + k * s, false, .35));
      else { trommel(z + 8 * s, true, .55); trommel(z + 4 * s, false, .35); trommel(z + 12 * s, false, .35); }
      akkordToene(g).forEach((st, k) => {
        const o = ctx.createOscillator(), gg = ctx.createGain(), lp = ctx.createBiquadFilter();
        o.type = "triangle"; o.frequency.value = hz(GRUND - 12 + SK[st] + (k && SK[st] < SK[g % 7] ? 12 : 0));
        lp.type = "lowpass"; lp.frequency.value = 900;
        gg.gain.setValueAtTime(0, z); gg.gain.linearRampToValueAtTime(.02, z + .25); gg.gain.setValueAtTime(.02, z + dauer - .2); gg.gain.linearRampToValueAtTime(0, z + dauer + .1);
        o.connect(lp); lp.connect(gg); gg.connect(bus || ausg); o.start(z); o.stop(z + dauer + .15); knoten.push(o);
      });
    });
    return knoten;
  }
  function publikum(gut) {
    const z = ctx.currentTime + .1;
    if (gut) {
      for (let i = 0; i < 40; i++) rauschen(z + Math.random() * 2.2, "bandpass", 1100 + Math.random() * 800, .25 + Math.random() * .3, .03);
      for (let i = 0; i < 5; i++) { const s0 = z + Math.random() * .4; rauschen(s0, "bandpass", 700 + Math.random() * 600, .12, 2); }
    } else {
      for (let k = 0; k < 4; k++) for (let i = 0; i < 3; i++) schlag(z + k * .6 + i * .07, 4300, 4300, .05, .05); /* Grillen … */
    }
  }

  /* ---------- Zustand ---------- */
  let stufe = "mittel";
  try { stufe = localStorage.getItem("imres-auftritt-stufe") || "mittel"; } catch (_) {}
  if (!STUFEN[stufe]) stufe = "mittel";
  let spiel = null, ergebnis = null, liedWahl = "reigen", erfunden = null;
  try { liedWahl = localStorage.getItem("imres-auftritt-lied") || "reigen"; } catch (_) {}
  if ((!LIEDER[liedWahl] || LIEDER[liedWahl].nurWeg) && liedWahl !== "neu") liedWahl = "reigen";
  /* Barradins Weg: freigespielte Bühnen und Sterne je Bühne */
  let modus = "lieder", wegStation = 0;
  const wegLesen = () => { try { const w = JSON.parse(localStorage.getItem("imres-auftritt-weg") || "null"); if (w && Array.isArray(w.sterne)) return w; } catch (_) {} return { frei: 0, sterne: [] }; };
  let weg = wegLesen();
  weg.frei = Math.max(0, Math.min(WEG.length - 1, weg.frei | 0));
  /* Ein zweiter Tab darf keinen Fortschritt überschreiben: vor dem Schreiben zusammenführen
     (höchste freigespielte Bühne, je Bühne die meisten Sterne). „neu“ = Zeitpunkt des letzten Neubeginns –
     wurde anderswo später neu begonnen, gilt dieser Stand. */
  function wegMischen(s) {
    if (!s) return;
    if ((s.neu || 0) > (weg.neu || 0)) { weg = { frei: 0, sterne: [], neu: s.neu }; }
    else if ((s.neu || 0) < (weg.neu || 0)) return;
    weg.frei = Math.max(weg.frei | 0, Math.min(WEG.length - 1, Math.max(0, s.frei | 0)));
    s.sterne.forEach((x, i) => { const n = Math.max(0, Math.min(3, x | 0)); if (n > (weg.sterne[i] || 0)) weg.sterne[i] = n; });
  }
  const wegSpeichern = neu => { if (!neu) wegMischen(wegLesen()); try { localStorage.setItem("imres-auftritt-weg", JSON.stringify(weg)); } catch (_) {} };
  window.addEventListener("storage", e => {
    if (e.key !== "imres-auftritt-weg") return;
    wegMischen(wegLesen());
    if (modus === "weg" && !spiel && !stimmt && !kalib) { wegStation = Math.min(wegStation, weg.frei); zeichnen(); }
  });
  try { modus = localStorage.getItem("imres-auftritt-modus") === "weg" ? "weg" : "lieder"; wegStation = Math.min(weg.frei, Math.max(0, parseInt(localStorage.getItem("imres-auftritt-station"), 10) || weg.frei)); } catch (_) { wegStation = weg.frei; }
  const geschafft = () => weg.sterne.filter(x => x > 0).length;
  const rangName = T => { let n = -1; weg.sterne.forEach((x, i) => { if (x > 0) n = Math.max(n, i); }); return n < 0 ? T.weg.unbekannt : T.weg.raenge[n]; };
  const sterneText = n => "★".repeat(n) + "☆".repeat(3 - n);
  const wegLied = () => Object.assign({ key: WEG[wegStation].lied }, LIEDER[WEG[wegStation].lied]);
  const aktuellesLied = () => liedWahl === "neu" ? (erfunden || (erfunden = liedErfinden())) : Object.assign({ key: liedWahl }, LIEDER[liedWahl]);
  const rekordLesen = () => { try { return JSON.parse(localStorage.getItem("imres-auftritt-rekord") || "{}") || {}; } catch (_) { return {}; } };

  /* ---------- Oberfläche ---------- */
  function zeichnen() {
    const T = t();
    const imWeg = modus === "weg";
    root.innerHTML =
      '<p class="label">' + T.label + "</p><h3>" + T.titel + "</h3>" +
      '<div class="at-modus" role="tablist">' + ["lieder", "weg"].map(m => '<button type="button" role="tab" data-modus="' + m + '" aria-selected="' + (m === modus) + '">' + T.modi[m] + "</button>").join("") + "</div>" +
      '<p class="tav-info">' + (imWeg ? T.weg.text : T.text) + "</p>" +
      (imWeg ? wegHtml(T) : liederHtml(T)) +
      '<div class="at-buehne"><canvas class="at-canvas" width="560" height="380" aria-label="' + esc(T.titel) + '"></canvas>' +
        '<div class="at-ergebnis" ' + (ergebnis ? "" : "hidden") + ">" + (ergebnis ? ergebnisHtml(T) : "") + "</div>" +
        '<div class="at-pause" role="button" tabindex="0" hidden></div></div>' +
      '<p class="at-steuer">' + (kalib ? T.kalib.hinweis : T.steuerung + "<br>" + T.tipp) + "</p>" +
      '<div class="at-fuss">' + knoepfeHtml(T) + "</div>" +
      '<div class="at-ton"><button type="button" class="at-stumm"></button><label><span>' + T.ton + '</span><input type="range" class="at-laut" min="0" max="100" step="5"></label></div>' +
      (spiel || stimmt ? "" : kalibHtml(T)) +
      (imWeg ? (spiel || stimmt || kalib ? "" : '<div class="at-weg-fuss"><button type="button" class="at-zurueck">' + T.weg.zuruecksetzen + "</button></div>") :
        (ergebnis && !spiel ? '<div class="at-eintrag-box">' + eintragHtml(T) + "</div>" : "") + '<div class="at-liste">' + listeHtml(T) + "</div>");
    tonNeu(); pauseZeigen();
    if (kalib) return;
    malenRuhe();
    const pf = root.querySelector(".at-pfad"), akt = pf && pf.querySelector('[aria-pressed="true"]');
    if (akt) pf.scrollLeft = Math.max(0, akt.parentNode.offsetLeft - (pf.clientWidth - akt.parentNode.offsetWidth) / 2);
  }
  function liederHtml(T) {
    return '<div class="at-stufen"><span>' + T.publikum + ":</span>" +
        Object.keys(STUFEN).map(k => '<button type="button" data-stufe="' + k + '" aria-pressed="' + (k === stufe) + '">' + T.stufen[k] + "</button>").join("") + "</div>" +
      '<div class="at-stufen at-lieder"><span>' + T.lied + ":</span>" +
        Object.keys(LIEDER).filter(k => !LIEDER[k].nurWeg).map(k => '<button type="button" data-lied="' + k + '" aria-pressed="' + (k === liedWahl) + '">' + T.lieder[k] + "</button>").join("") +
        '<button type="button" data-lied="neu" aria-pressed="' + (liedWahl === "neu") + '">' + T.neuesLied + "</button>" +
        (liedWahl === "neu" ? '<span class="at-erfunden">♪ ' + esc(liedName(aktuellesLied(), T)) + "</span>" : "") + "</div>";
  }
  function wegHtml(T) {
    const W = T.weg, s = W.stationen[wegStation], st = WEG[wegStation], stern = weg.sterne.reduce((a, b) => a + (b || 0), 0);
    return '<div class="at-weg-kopf"><span>' + W.rang + ": <strong>" + esc(rangName(T)) + "</strong></span><span>" + W.sterne + ": <strong>" + stern + " / " + WEG.length * 3 + "</strong></span></div>" +
      '<ol class="at-pfad">' + WEG.map((_, i) => {
        const offen = i <= weg.frei, n = weg.sterne[i] || 0;
        return '<li><button type="button" data-station="' + i + '"' + (offen ? "" : " disabled") + ' aria-pressed="' + (i === wegStation) + '" title="' + esc(offen ? W.station(i + 1) + " – " + W.stationen[i].ort : W.gesperrt) + '">' +
          '<span class="sym" aria-hidden="true">' + (offen ? WEG_ZEICHEN[i] : "🔒") + '</span><span class="nr">' + (i + 1) + '</span><span class="st" aria-label="' + n + ' ' + W.sterne + '">' + (offen ? sterneText(n) : "") + "</span></button></li>";
      }).join("") + "</ol>" +
      (geschafft() === WEG.length ? '<p class="at-weg-ende">✨ ' + W.ende + "</p>" : "") +
      '<div class="at-station"><p class="at-ort"><span aria-hidden="true">' + WEG_ZEICHEN[wegStation] + "</span> " + W.station(wegStation + 1) + " · " + esc(s.ort) + "</p>" +
        '<p class="at-intro">' + zit(s.intro) + "</p>" +
        '<p class="at-eckdaten"><span>' + W.publikum + ": " + esc(s.publikum) + "</span><span>" + W.lied + ": <em>" + esc(T.lieder[st.lied]) + "</em></span><span class=\"sg\">" + W.sg(st.sg) + "</span></p></div>";
  }
  function tonNeu(nurKnopf) {
    const k = root.querySelector(".at-stumm"), r = root.querySelector(".at-laut"), T = t();
    const aus = stumm || lautstaerke === 0;
    if (k) { k.textContent = aus ? "🔇" : lautstaerke < .5 ? "🔉" : "🔊"; k.setAttribute("aria-pressed", String(aus)); k.setAttribute("aria-label", aus ? T.tonAn : T.tonAus); k.title = aus ? T.tonAn : T.tonAus; }
    if (r && !nurKnopf) { r.value = String(Math.round(lautstaerke * 100)); r.setAttribute("aria-label", T.ton); }
  }
  function kalibHtml(T) {
    const ms = Math.round(kalibWert * 1000);
    return '<div class="at-kalib-zeile">' + (kalib ? "" : '<button type="button" class="at-kalib">' + T.kalib.knopf + "</button>") +
      (ms && !kalib ? '<span class="at-kalib-wert">' + T.kalib.aktuell((ms > 0 ? "+" : "") + ms) + ' · <button type="button" class="at-kalib-weg">' + T.kalib.zuruecksetzen + "</button></span>" : "") +
      (kalibMeldung ? '<p class="at-kalib-info" role="status">' + esc(kalibMeldung) + "</p>" : "") + "</div>";
  }
  function knoepfeHtml(T) {
    if (kalib) return '<button type="button" class="tav-knopf at-start">' + T.abbrechen + "</button>";
    if (stimmt) return '<button type="button" class="tav-knopf at-start">' + T.stimmen_laden + "</button>";
    if (spiel) return '<button type="button" class="tav-knopf at-pause-knopf">' + T.pauseKnopf + '</button><button type="button" class="tav-knopf at-start">' + T.abbrechen + "</button>";
    if (modus !== "weg") return '<button type="button" class="tav-knopf at-start">' + (ergebnis ? T.nochmal : T.start) + "</button>";
    const W = T.weg, weiter = ergebnis && ergebnis.bestanden && wegStation < WEG.length - 1;
    return (weiter ? '<button type="button" class="tav-knopf at-weiter">' + W.weiter + "</button>" : "") +
      '<button type="button" class="tav-knopf at-start">' + (!ergebnis ? W.start : ergebnis.bestanden ? W.wiederholen : W.nochmal) + "</button>";
  }
  function ergebnisHtml(T) {
    const e = ergebnis;
    if (e.weg) {
      const W = T.weg, s = W.stationen[e.station];
      return '<p class="label">' + W.gegen(e.sg) + "</p>" +
        '<div class="at-w20' + (e.w20 === 20 ? " krit" : e.w20 === 1 ? " patzer" : "") + '">' + e.w20 + "</div>" +
        '<p class="at-summe">' + T.wurf(e.w20, e.summe) + "</p>" +
        '<p class="at-urteil ' + (e.bestanden ? "ja" : "nein") + '">' + (e.bestanden ? W.bestanden + ' <span class="at-sterne">' + sterneText(e.sterne) + "</span>" : W.durchgefallen) + "</p>" +
        '<p class="at-zitat">' + zit(e.bestanden ? s.sieg : s.pleite) + "</p>" +
        (e.neuerRang ? '<p class="at-rekord">' + W.neuerRang(W.raenge[e.station]) + "</p>" : "") +
        '<p class="at-werte">' + T.genau(e.prozent) + " · " + T.treffer(e.getroffen, e.gesamt) + " · " + T.fehlgriffe(e.streu) + " · " + T.beste(e.serie) + "</p>";
    }
    return '<p class="label">' + T.ergebnis + "</p>" +
      '<div class="at-w20' + (e.w20 === 20 ? " krit" : e.w20 === 1 ? " patzer" : "") + '">' + e.w20 + "</div>" +
      '<p class="at-summe">' + T.wurf(e.w20, e.summe) + "</p>" +
      '<p class="at-zitat">' + zit(e.zitat) + "</p>" +
      '<p class="at-werte">' + T.genau(e.prozent) + " · " + T.treffer(e.getroffen, e.gesamt) + " · " + T.fehlgriffe(e.streu) + " · " + T.beste(e.serie) + "</p>" +
      '<p class="at-rekord">' + (e.neu ? T.neuRekord : T.rekord(e.rekord)) + "</p>";
  }
  const canvas = () => root.querySelector(".at-canvas");
  function maße(c) {
    const r = c.getBoundingClientRect(), dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = Math.round(r.width * dpr), h = Math.round(r.height * dpr);
    if (c.width !== w || c.height !== h) { c.width = w; c.height = h; }
    return { w, h, dpr };
  }
  function grund(g, w, h, dpr, blitz) {
    g.clearRect(0, 0, w, h);
    const bahn = w / 3;
    for (let i = 0; i < 3; i++) {
      const x = i * bahn;
      const grad = g.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, "rgba(235,226,204,0.02)"); grad.addColorStop(1, "rgba(235,226,204,0.07)");
      g.fillStyle = grad; g.fillRect(x + 2 * dpr, 0, bahn - 4 * dpr, h);
      if (blitz && blitz[i] > 0) { g.fillStyle = "rgba(255,210,122," + (0.25 * blitz[i]) + ")"; g.fillRect(x + 2 * dpr, 0, bahn - 4 * dpr, h); }
      g.fillStyle = "rgba(235,226,204,0.5)"; g.font = (12 * dpr) + "px Georgia, serif"; g.textAlign = "center";
      g.fillText(t().spuren[i], x + bahn / 2, h - 10 * dpr);
    }
    const y = h * .82;
    g.strokeStyle = "#e0a046"; g.lineWidth = 3 * dpr; g.shadowColor = "#e0a046"; g.shadowBlur = 12 * dpr;
    g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); g.shadowBlur = 0;
    for (let i = 0; i < 3; i++) {
      g.strokeStyle = "rgba(224,160,70,.6)"; g.lineWidth = 2 * dpr; g.beginPath(); g.arc(i * bahn + bahn / 2, y, 18 * dpr, 0, Math.PI * 2); g.stroke();
      g.fillStyle = "rgba(235,226,204,.55)"; g.font = "bold " + (13 * dpr) + "px Georgia, serif"; g.textAlign = "center"; g.textBaseline = "middle";
      g.fillText(TASTEN_ANZEIGE[i], i * bahn + bahn / 2, y + 1); g.textBaseline = "alphabetic";
    }
    return y;
  }
  function malenRuhe() {
    const c = canvas(); if (!c) return;
    const { w, h, dpr } = maße(c), g = c.getContext("2d");
    const y = grund(g, w, h, dpr);
    if (!spiel && !ergebnis) {
      g.fillStyle = "rgba(235,226,204,.75)"; g.font = "italic " + (18 * dpr) + "px Georgia, serif"; g.textAlign = "center";
      const T = t(), imWeg = modus === "weg";
      g.fillText(imWeg ? WEG_ZEICHEN[wegStation] + "  " + T.weg.station(wegStation + 1) + " · " + T.weg.sg(WEG[wegStation].sg) : "🎻  " + T.stufen[stufe], w / 2, y / 2 - 12 * dpr);
      g.fillStyle = "rgba(224,160,70,.85)"; g.font = (15 * dpr) + "px Georgia, serif";
      g.fillText("♪ " + liedName(imWeg ? wegLied() : aktuellesLied(), T), w / 2, y / 2 + 16 * dpr);
    }
  }
  function malen() {
    if (!spiel) return;
    const c = canvas(); if (!c) return;
    const { w, h, dpr } = maße(c), g = c.getContext("2d"), jetzt = hoerZeit() - spiel.start, gewertet = jetzt - kalibWert;
    if (!spiel.pause) spiel.blitz = spiel.blitz.map(b => Math.max(0, b - .06));
    const y = grund(g, w, h, dpr, spiel.blitz), bahn = w / 3, flug = spiel.st.flug;
    /* Taktlinien wandern mit – so sieht man den Rhythmus kommen */
    const d0 = spiel.daten, schlagDauer = 4 * d0.schritt;
    for (let k = Math.floor((jetzt - d0.vor) / schlagDauer); ; k++) {
      const zt = d0.vor + k * schlagDauer, dt = zt - jetzt;
      if (dt > flug) break; if (dt < -.1 || zt > d0.ende) continue;
      const ly = y - (dt / flug) * y;
      const takt = k % (d0.L / 4) === 0;
      g.strokeStyle = takt ? "rgba(224,160,70,.28)" : "rgba(235,226,204,.08)"; g.lineWidth = (takt ? 2 : 1) * dpr;
      g.beginPath(); g.moveTo(0, ly); g.lineTo(w, ly); g.stroke();
    }
    /* Haltenoten: Schweif bis zum Ende des Tons; gehalten leuchtet er, und am Ende gibt es den Bonus */
    spiel.daten.liste.forEach(n => {
      if (!n.dauer) return;
      const ende = n.zeit + n.dauer, gehalten = spiel.halt[n.spur] && spiel.halt[n.spur].n === n;
      if (gehalten && gewertet >= ende) { loslassen(n.spur, true); return; }
      if (ende - jetzt < -.1 || n.zeit - jetzt > flug) return;
      if (n.bonus != null && !gehalten && !n.losgelassen) return;
      const x = n.spur * bahn + bahn / 2, kopf = gehalten ? y : y - ((n.zeit - jetzt) / flug) * y;
      const yEnde = Math.max(0, y - ((ende - jetzt) / flug) * y);
      if (kopf <= yEnde) return;
      const breit = 13 * dpr;
      g.globalAlpha = n.status === "daneben" || n.losgelassen ? .22 : gehalten ? .95 : .55;
      g.fillStyle = FARBEN[n.spur];
      if (gehalten) { g.shadowColor = FARBEN[n.spur]; g.shadowBlur = 16 * dpr; }
      g.beginPath(); g.roundRect ? g.roundRect(x - breit / 2, yEnde, breit, kopf - yEnde, breit / 2) : g.rect(x - breit / 2, yEnde, breit, kopf - yEnde); g.fill();
      g.shadowBlur = 0; g.globalAlpha = 1;
      if (gehalten) { /* Funken an der goldenen Linie */
        g.fillStyle = "#ffd27a"; for (let i = 0; i < 3; i++) { const a = Math.random() * Math.PI, r = (8 + Math.random() * 14) * dpr; g.fillRect(x + Math.cos(a) * r * 1.6, y - Math.sin(a) * r, 2 * dpr, 2 * dpr); }
      }
    });
    spiel.daten.liste.forEach(n => {
      if (n.status && n.status !== "daneben") return;
      const dt = n.zeit - jetzt; if (dt > flug || dt < -.4) return;
      const ny = y - (dt / flug) * y;
      const x = n.spur * bahn + bahn / 2, r = 17 * dpr;
      g.globalAlpha = n.status === "daneben" ? .3 : 1;
      g.fillStyle = FARBEN[n.spur]; g.shadowColor = FARBEN[n.spur]; g.shadowBlur = 10 * dpr;
      g.beginPath(); g.roundRect ? g.roundRect(x - r * 1.4, ny - r * .7, r * 2.8, r * 1.4, 7 * dpr) : g.rect(x - r * 1.4, ny - r * .7, r * 2.8, r * 1.4); g.fill();
      g.shadowBlur = 0; g.fillStyle = "#16121a"; g.font = (15 * dpr) + "px serif"; g.textAlign = "center"; g.textBaseline = "middle";
      g.fillText(ZEICHEN[n.spur], x, ny + 1); g.textBaseline = "alphabetic"; g.globalAlpha = 1;
      /* nicht getroffen → als daneben werten */
      if (!n.status && !spiel.pause && n.zeit - gewertet < -FENSTER.knapp) { n.status = "daneben"; spiel.serie = 0; zeigeUrteil("daneben", n.spur); }
    });
    g.fillStyle = "#ebe2cc"; g.textAlign = "left"; g.font = (14 * dpr) + "px Georgia, serif";
    g.fillText(Math.round(spiel.punkte) + " " + t().punkte, 10 * dpr, 22 * dpr);
    if (spiel.serie >= 5) { g.textAlign = "right"; g.fillStyle = "#e0a046"; g.fillText(t().serie(spiel.serie), w - 10 * dpr, 22 * dpr); }
    if (spiel.urteil && jetzt - spiel.urteil.zeit < .6) {
      const a = 1 - (jetzt - spiel.urteil.zeit) / .6;
      g.globalAlpha = a; g.textAlign = "center"; g.font = "bold " + (22 * dpr) + "px Georgia, serif";
      g.fillStyle = spiel.urteil.art === "daneben" ? "#c4564a" : spiel.urteil.art === "perfekt" ? "#ffd27a" : "#ebe2cc";
      g.fillText(t().urteil[spiel.urteil.art], spiel.urteil.spur * bahn + bahn / 2, y - 40 * dpr - (1 - a) * 20 * dpr); g.globalAlpha = 1;
    }
    if (!spiel.pause && jetzt > spiel.daten.ende) { beenden(); return; }
    requestAnimationFrame(malen);
  }
  function zeigeUrteil(art, spur) { spiel.urteil = { art, spur, zeit: hoerZeit() - spiel.start }; }

  /* ---------- Spielablauf ---------- */
  let stimmt = null; /* läuft gerade das Laden der Aufnahmen? */
  function starten() {
    audio();
    ergebnis = null;
    const imWeg = modus === "weg", st = imWeg ? WEG[wegStation].st : STUFEN[stufe];
    const lied = imWeg ? wegLied() : aktuellesLied();
    const daten = noten(st, lied); daten.lied = lied;
    const ort = imWeg ? wegStation : null;
    const token = stimmt = {};
    kalibMeldung = "";
    zeichnen();
    buehneZeigen();
    probenFuer(daten).then(() => {
      if (stimmt !== token) return; /* inzwischen abgebrochen */
      stimmt = null;
      SK = skala(lied.modus); GRUND = lied.grund; /* Tonleiter dieses Lieds aktiv halten */
      saite(hz(45), 1.8, .4986);
      daten.liste.forEach(n => { if (n.spur === 2) return; const m = MIDI[n.spur](n.ton); if (!probeBuf.has(probeName(SPUR_PROBE[n.spur], m))) { if (n.spur === 0) saite(bassHz(n.ton), 1.8, .4986); else saite(melHz(n.ton), 1.4, .4979); } });
      bus = ctx.createGain(); bus.connect(ausg);
      spiel = { daten, st, ort, start: ctx.currentTime + .35, punkte: 0, serie: 0, besteSerie: 0, streu: 0, blitz: [0, 0, 0], urteil: null, halt: {} };
      spiel.knoten = begleitung(daten, spiel.start);
      zeichnen();
      requestAnimationFrame(malen);
      if (document.hidden) pausieren(); /* während des Stimmens weggewechselt */
    });
  }
  /* ---------- Pause ----------
     Alles hängt an der Audio-Uhr: ctx.suspend() hält Musik, Noten und Wertung gemeinsam an.
     Weiter geht es nach einem kurzen 3-2-1, damit man wieder hineinfindet. */
  function pausieren() {
    if (!spiel || spiel.pause === "pause") return;
    clearTimeout(spiel.pauseUhr);
    Object.keys(spiel.halt).forEach(k => loslassen(+k, true)); /* gehaltene Töne zählen als gehalten */
    finger.clear();
    spiel.pause = "pause";
    if (ctx.state === "running") { const p = ctx.suspend(); if (p && p.catch) p.catch(() => {}); }
    pauseZeigen();
  }
  function weiterspielen() {
    if (!spiel || spiel.pause !== "pause") return;
    const sp = spiel;
    const schritt = n => {
      if (spiel !== sp || typeof sp.pause !== "number" && n !== 3) return;
      if (n > 0) { sp.pause = n; pauseZeigen(); sp.pauseUhr = setTimeout(() => schritt(n - 1), 650); return; }
      const p = ctx.resume();
      const los = () => { if (spiel !== sp || sp.pause !== 0) return; if (ctx.state === "running") { sp.pause = null; pauseZeigen(); } else { sp.pause = "pause"; pauseZeigen(); } };
      sp.pause = 0;
      if (p && p.then) p.then(los, () => { if (spiel === sp) { sp.pause = "pause"; pauseZeigen(); } }); else los();
    };
    schritt(3);
  }
  function pauseZeigen() {
    const el = root.querySelector(".at-pause"); if (!el) return;
    const p = spiel && spiel.pause;
    el.hidden = p == null || p === false;
    const k = root.querySelector(".at-pause-knopf"); if (k) k.disabled = !el.hidden;
    if (el.hidden) return;
    el.classList.toggle("zaehlt", typeof p === "number");
    el.innerHTML = typeof p === "number" ? '<span class="at-zahl">' + (p || "♪") + "</span>" : '<span class="at-pause-sym" aria-hidden="true">⏸</span><span>' + esc(t().pause) + "</span>";
  }
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) return;
    if (spiel) pausieren();
    if (kalib) kalibEnde(true);
  });
  window.addEventListener("pagehide", () => { if (spiel) pausieren(); });
  /* Bühne beim Start ganz ins Bild holen (auf dem Handy liegt sie sonst halb unter der Leiste) */
  function buehneZeigen() {
    const b = root.querySelector(".at-buehne"); if (!b) return;
    const r = b.getBoundingClientRect(); let unten = window.innerHeight;
    const nav = document.querySelector(".handyleiste");
    if (nav) { const nr = nav.getBoundingClientRect(); if (nr.height > 0 && nr.top < unten && getComputedStyle(nav).visibility !== "hidden") unten = nr.top; }
    if (r.top >= 0 && r.bottom <= unten) return;
    const ziel = r.height < unten ? (unten - r.height) / 2 : 8;
    window.scrollBy({ top: r.top - ziel, behavior: "smooth" });
  }
  /* ---------- Kalibrieren ----------
     Vier Klicks zum Zuhören, dann acht zum Mittippen. Der Median des Versatzes wird gemerkt
     und beim Werten jedes Tipps abgezogen (positiv = man tippt etwas später als man hört). */
  let kalib = null, kalibMeldung = "";
  const KALIB_VOR = 4, KALIB_MIT = 8, KALIB_TAKT = .6;
  function kalibStarten() {
    if (spiel || stimmt || kalib) return;
    audio(); ergebnis = null; kalibMeldung = "";
    const k = kalib = { tipps: [], start: 0, bereit: false };
    zeichnen(); buehneZeigen(); requestAnimationFrame(kalibMalen);
    Promise.race([Promise.all([probeLaden("holz1"), probeLaden("holz2")]), new Promise(r => setTimeout(r, 1500))]).then(() => {
      if (kalib !== k) return;
      k.bus = ctx.createGain(); k.bus.connect(ausg);
      k.start = ctx.currentTime + .5; k.bereit = true;
      for (let i = 0; i < KALIB_VOR + KALIB_MIT; i++) {
        const z = k.start + i * KALIB_TAKT, vor = i < KALIB_VOR;
        if (!probe(vor ? "holz2" : "holz1", 0, z, vor ? .55 : .8, { dauer: .4, aus: .1, ziel: k.bus })) {
          const alt = bus; bus = k.bus; rauschen(z, "bandpass", vor ? 1800 : 2600, .35, .04); schlag(z, vor ? 700 : 1000, vor ? 560 : 800, .06, .05); bus = alt;
        }
      }
    });
  }
  function kalibTipp(ms) { if (kalib && kalib.bereit) kalib.tipps.push(hoerZeit(ms) - kalib.start); }
  function kalibMalen() {
    const k = kalib; if (!k) return;
    const c = canvas(); if (!c) return;
    const { w, h, dpr } = maße(c), g = c.getContext("2d"), T = t();
    const y = grund(g, w, h, dpr), jetzt = k.bereit ? hoerZeit() - k.start : -1;
    const i = Math.floor(jetzt / KALIB_TAKT), seit = jetzt - i * KALIB_TAKT;
    const gezaehlt = new Set(k.tipps.map(x => Math.round(x / KALIB_TAKT)).filter(n => n >= KALIB_VOR && n < KALIB_VOR + KALIB_MIT)).size;
    g.textAlign = "center"; g.fillStyle = "rgba(235,226,204,.85)"; g.font = "italic " + (16 * dpr) + "px Georgia, serif";
    g.fillText(i < KALIB_VOR ? T.kalib.vorzaehlen : T.kalib.mit(gezaehlt, KALIB_MIT), w / 2, y * .3);
    const an = jetzt >= 0 && i < KALIB_VOR + KALIB_MIT ? Math.max(0, 1 - seit / .25) : 0;
    g.fillStyle = i < KALIB_VOR ? "rgba(235,226,204," + (.15 + .5 * an) + ")" : "rgba(224,160,70," + (.2 + .7 * an) + ")";
    g.beginPath(); g.arc(w / 2, y * .62, (22 + 10 * an) * dpr, 0, Math.PI * 2); g.fill();
    if (k.bereit && jetzt > (KALIB_VOR + KALIB_MIT) * KALIB_TAKT + .2) { kalibEnde(false); return; }
    requestAnimationFrame(kalibMalen);
  }
  function kalibEnde(abgebrochen) {
    const k = kalib; if (!k) return; kalib = null;
    if (k.bus) { const b = k.bus; b.gain.setTargetAtTime(0, ctx.currentTime, .03); setTimeout(() => { try { b.disconnect(); } catch (_) {} }, 300); }
    const T = t();
    if (abgebrochen) { kalibMeldung = ""; zeichnen(); return; }
    const versatz = [], belegt = new Set();
    k.tipps.forEach(x => { const n = Math.round(x / KALIB_TAKT), d = x - n * KALIB_TAKT; if (n >= KALIB_VOR && n < KALIB_VOR + KALIB_MIT && Math.abs(d) < .28 && !belegt.has(n)) { belegt.add(n); versatz.push(d); } });
    if (versatz.length < 5) kalibMeldung = T.kalib.zuWenig;
    else {
      versatz.sort((a, b) => a - b);
      const m = versatz.length % 2 ? versatz[versatz.length >> 1] : (versatz[versatz.length / 2 - 1] + versatz[versatz.length / 2]) / 2;
      kalibWert = Math.max(-.25, Math.min(.25, m));
      try { localStorage.setItem("imres-auftritt-kalib", kalibWert.toFixed(4)); } catch (_) {}
      const ms = Math.round(kalibWert * 1000);
      kalibMeldung = Math.abs(ms) < 5 ? T.kalib.null : T.kalib.fertig((ms > 0 ? "+" : "") + ms);
    }
    zeichnen();
  }
  function abbrechen() {
    if (kalib) { kalibEnde(true); return; }
    if (stimmt) { stimmt = null; zeichnen(); return; }
    if (!spiel) return;
    clearTimeout(spiel.pauseUhr);
    if (ctx.state !== "running") { const p = ctx.resume(); if (p && p.catch) p.catch(() => {}); }
    (spiel.knoten || []).forEach(n => { try { n.stop(); } catch (_) {} });
    spiel.halt = {};
    if (bus) { const b = bus; b.gain.setTargetAtTime(0, ctx.currentTime, .04); setTimeout(() => { try { b.disconnect(); } catch (_) {} }, 300); bus = null; }
    spiel = null; zeichnen();
  }
  /* ms: Zeitstempel des Eingabe-Ereignisses – so zählt der Moment des Tippens, nicht wann der Browser dazu kam */
  function tippen(spur, ms) {
    if (kalib) { kalibTipp(ms); return; }
    if (!spiel || spiel.pause != null) return;
    const jetzt = hoerZeit(ms) - spiel.start - kalibWert;
    spiel.blitz[spur] = 1;
    let best = null;
    spiel.daten.liste.forEach(n => { if (n.spur === spur && !n.status && Math.abs(n.zeit - jetzt) <= FENSTER.knapp && (!best || Math.abs(n.zeit - jetzt) < Math.abs(best.zeit - jetzt))) best = n; });
    if (!best) { daneben(ctx.currentTime); spiel.serie = 0; spiel.streu++; zeigeUrteil("daneben", spur); spiel.punkte = Math.max(0, spiel.punkte - FEHLGRIFF); return; }
    const d = Math.abs(best.zeit - jetzt), art = d <= FENSTER.perfekt ? "perfekt" : d <= FENSTER.gut ? "gut" : "knapp";
    best.status = art; spiel.serie++; spiel.besteSerie = Math.max(spiel.besteSerie, spiel.serie);
    spiel.punkte += PUNKTE[art] * (1 + Math.min(spiel.serie, 20) * .025);
    /* zu früh getippt? Dann erklingt der Ton trotzdem genau im Takt */
    if (best.dauer) {
      const hg = ctx.createGain(); hg.connect(bus || ausg);
      ton(spur, best.ton, Math.max(ctx.currentTime, spiel.start + best.zeit), best.klang, hg);
      spiel.halt[spur] = { n: best, hg };
    } else ton(spur, best.ton, Math.max(ctx.currentTime, spiel.start + best.zeit), best.klang);
    zeigeUrteil(art, spur);
  }
  /* Haltenote loslassen: Bonus nach gehaltenem Anteil; zu früh losgelassen verklingt der Ton */
  const HALT_BONUS = 50;
  function loslassen(spur, fertig) {
    if (!spiel || !spiel.halt[spur]) return;
    const { n, hg } = spiel.halt[spur]; delete spiel.halt[spur];
    const anteil = fertig ? 1 : Math.max(0, Math.min(1, (hoerZeit() - spiel.start - kalibWert - n.zeit) / n.dauer));
    n.bonus = Math.round(HALT_BONUS * (anteil >= .85 ? 1 : anteil));
    spiel.punkte += n.bonus * (1 + Math.min(spiel.serie, 20) * .025);
    if (anteil >= .85) zeigeUrteil("gehalten", spur);
    else { n.losgelassen = hoerZeit() - spiel.start; hg.gain.setTargetAtTime(0, ctx.currentTime, .06); }
  }
  function beenden() {
    Object.keys(spiel.halt || {}).forEach(k => loslassen(+k, true));
    const T = t(), liste = spiel.daten.liste;
    const summe = liste.reduce((a, n) => a + (PUNKTE[n.status] || 0) + (n.bonus || 0), 0) - spiel.streu * FEHLGRIFF;
    const moeglich = liste.reduce((a, n) => a + 100 + (n.dauer ? HALT_BONUS : 0), 0);
    const prozent = Math.max(0, Math.round(summe / moeglich * 100));
    const getroffen = liste.filter(n => PUNKTE[n.status]).length;
    let w20 = Math.round(1 + (prozent / 100) * 19 + (Math.random() * 2 - 1));
    w20 = Math.max(1, Math.min(20, w20));
    if (prozent >= 95 && Math.random() < .6) w20 = 20;
    if (prozent < 20) w20 = 1;
    const ges = w20 + 7;
    if (spiel.ort != null) { wegErgebnis(spiel.ort, { w20, ges, prozent, getroffen, gesamt: liste.length }); return; }
    const stufeText = w20 === 20 ? "krit" : w20 === 1 ? "patzer" : ges <= 11 ? "schwach" : ges <= 16 ? "maessig" : ges <= 21 ? "gut" : ges <= 25 ? "stark" : "legende";
    const rek = rekordLesen(), alt = rek[stufe] || 0, neu = ges > alt;
    if (neu) { rek[stufe] = ges; try { localStorage.setItem("imres-auftritt-rekord", JSON.stringify(rek)); } catch (_) {} }
    ergebnis = { lied: spiel.daten.lied, w20, summe: ges, prozent, getroffen, gesamt: liste.length, serie: spiel.besteSerie, streu: spiel.streu, zitat: zufall(T.stimmen[stufeText]), neu: neu && alt > 0, rekord: Math.max(alt, ges) };
    spiel = null; bus = null;
    if (liedWahl === "neu") erfunden = null; /* nächster Auftritt: wieder ein neues Lied */
    publikum(ges >= 17);
    zeichnen();
  }

  function wegErgebnis(i, r) {
    const sg = WEG[i].sg, bestanden = r.w20 === 20 || (r.w20 !== 1 && r.ges >= sg);
    const sterne = bestanden ? (r.prozent >= 92 || r.w20 === 20 ? 3 : r.prozent >= 80 ? 2 : 1) : 0;
    const vorher = rangName(TX.de), alt = weg.sterne[i] || 0;
    if (sterne > alt) weg.sterne[i] = sterne;
    for (let k = 0; k < WEG.length; k++) if (weg.sterne[k] == null) weg.sterne[k] = 0;
    if (bestanden && i === weg.frei && weg.frei < WEG.length - 1) weg.frei++;
    wegSpeichern();
    ergebnis = { weg: true, station: i, sg, bestanden, sterne, w20: r.w20, summe: r.ges, prozent: r.prozent, getroffen: r.getroffen, gesamt: r.gesamt,
      serie: spiel.besteSerie, streu: spiel.streu, neuerRang: bestanden && rangName(TX.de) !== vorher };
    spiel = null; bus = null;
    publikum(bestanden);
    zeichnen();
  }
  function stationWaehlen(i) {
    wegStation = Math.max(0, Math.min(weg.frei, i)); ergebnis = null;
    try { localStorage.setItem("imres-auftritt-station", String(wegStation)); } catch (_) {}
    zeichnen();
  }

  /* ---------- Eingaben ---------- */
  const TASTEN = { a: 0, s: 1, d: 2, j: 0, k: 1, l: 2, arrowleft: 0, arrowdown: 1, arrowright: 2 };
  window.addEventListener("keydown", e => {
    if (!(spiel || kalib) || e.repeat || e.metaKey || e.ctrlKey || e.altKey) return;
    const tag = (e.target && e.target.tagName) || "";
    if (/INPUT|TEXTAREA|SELECT/.test(tag)) return;
    if (spiel && spiel.pause === "pause" && (e.key === " " || e.key === "Enter")) { e.preventDefault(); weiterspielen(); return; }
    if (spiel && !spiel.pause && (e.key === "Escape" || e.key === "p" || e.key === "P")) { e.preventDefault(); pausieren(); return; }
    const k = TASTEN[String(e.key).toLowerCase()];
    if (k == null) return;
    e.preventDefault(); tippen(k, e.timeStamp);
  });
  window.addEventListener("keyup", e => {
    const k = TASTEN[String(e.key).toLowerCase()];
    if (k != null && spiel) loslassen(k);
  });
  root.addEventListener("pointerdown", e => {
    const c = e.target.closest(".at-canvas");
    if (!c || !(spiel || kalib)) return;
    e.preventDefault();
    const r = c.getBoundingClientRect(), spur = Math.max(0, Math.min(2, Math.floor((e.clientX - r.left) / (r.width / 3))));
    if (spiel && !spiel.pause) finger.set(e.pointerId, spur);
    tippen(spur, e.timeStamp);
  });
  /* Finger hoch = Haltenote loslassen */
  const finger = new Map();
  const fingerWeg = e => { if (!finger.has(e.pointerId)) return; const spur = finger.get(e.pointerId); finger.delete(e.pointerId); if (![...finger.values()].includes(spur)) loslassen(spur); };
  window.addEventListener("pointerup", fingerWeg); window.addEventListener("pointercancel", fingerWeg);
  root.addEventListener("click", e => {
    const st = e.target.closest("[data-stufe]");
    if (st && !spiel && !stimmt) { stufe = st.dataset.stufe; try { localStorage.setItem("imres-auftritt-stufe", stufe); } catch (_) {} ergebnis = null; zeichnen(); bestenLaden(); return; }
    const ld = e.target.closest("[data-lied]");
    if (ld && !spiel && !stimmt) { liedWahl = ld.dataset.lied; if (liedWahl === "neu") erfunden = liedErfinden(); try { localStorage.setItem("imres-auftritt-lied", liedWahl); } catch (_) {} ergebnis = null; zeichnen(); bestenLaden(); return; }
    const md = e.target.closest("[data-modus]");
    if (md && !spiel && !stimmt) { if (md.dataset.modus !== modus) { modus = md.dataset.modus; ergebnis = null; try { localStorage.setItem("imres-auftritt-modus", modus); } catch (_) {} zeichnen(); if (modus === "lieder") bestenLaden(); } return; }
    const sw = e.target.closest("[data-station]");
    if (sw && !sw.disabled && !spiel && !stimmt) { stationWaehlen(+sw.dataset.station); return; }
    if (e.target.closest(".at-weiter") && !spiel && !stimmt) { stationWaehlen(wegStation + 1); const b = root.querySelector(".at-station"); if (b && b.getBoundingClientRect().top < 70) b.scrollIntoView({ block: "start", behavior: "smooth" }); return; }
    if (e.target.closest(".at-zurueck") && !spiel && !stimmt) { if (window.confirm(t().weg.sicher)) { weg = { frei: 0, sterne: [], neu: Date.now() }; wegSpeichern(true); stationWaehlen(0); } return; }
    if (e.target.closest(".at-eintragen")) { eintragen(); return; }
    if (e.target.closest(".at-pause")) { weiterspielen(); return; }
    if (e.target.closest(".at-pause-knopf")) { pausieren(); return; }
    if (e.target.closest(".at-stumm")) { stumm = !stumm; try { localStorage.setItem("imres-auftritt-stumm", stumm ? "1" : "0"); } catch (_) {} pegelSetzen(); tonNeu(); return; }
    if (e.target.closest(".at-kalib")) { kalib ? abbrechen() : kalibStarten(); return; }
    if (e.target.closest(".at-kalib-weg")) { kalibWert = 0; try { localStorage.removeItem("imres-auftritt-kalib"); } catch (_) {} kalibMeldung = ""; zeichnen(); return; }
    if (e.target.closest(".at-start")) { spiel || stimmt || kalib ? abbrechen() : starten(); }
  });
  root.addEventListener("input", e => {
    const r = e.target.closest(".at-laut"); if (!r) return;
    lautstaerke = Math.max(0, Math.min(1, (+r.value || 0) / 100));
    if (stumm && lautstaerke > 0) stumm = false;
    try { localStorage.setItem("imres-auftritt-laut", String(lautstaerke)); localStorage.setItem("imres-auftritt-stumm", stumm ? "1" : "0"); } catch (_) {}
    pegelSetzen(); tonNeu(true);
  });
  window.addEventListener("resize", () => { if (!spiel) malenRuhe(); });
  root.addEventListener("keydown", e => { if (e.key === "Enter" && e.target.closest(".at-name")) { e.preventDefault(); eintragen(); } });

  /* ---------- Bestenliste: gemeinsam über Supabase, sonst auf diesem Gerät ---------- */
  const SERVER = { url: "https://iszdxkwkgkksdemtqhwu.supabase.co", key: "sb_publishable_Bt3Vw5BSnLaVcTRPTS0ZsA_MeG6G2-Z" };
  /* Fehler kommen als { status, msg } zurück (msg = Meldung des Servers); nach 10 s wird abgebrochen */
  function server(pfad, body) {
    const h = { apikey: SERVER.key, "Content-Type": "application/json" };
    const opt = body === undefined ? { headers: h, cache: "no-store" } : { method: "POST", headers: h, body: JSON.stringify(body) };
    const ab = window.AbortController ? new AbortController() : null, uhr = ab && setTimeout(() => ab.abort(), 10000);
    if (ab) opt.signal = ab.signal;
    const fertig = () => clearTimeout(uhr);
    return fetch(SERVER.url + pfad, opt)
      .then(r => r.ok ? (r.status === 204 ? null : r.json()) : r.json().catch(() => ({})).then(j => Promise.reject({ status: r.status, msg: String((j && (j.message || j.hint)) || "") })))
      .then(v => { fertig(); return v; }, f => { fertig(); return Promise.reject(f && f.status ? f : { status: 0, msg: "", netz: true }); });
  }
  /* Servermeldung → freundlicher Text; endgueltig = nochmal senden hilft nicht */
  function fehlerText(f, T) {
    const m = (f && f.msg) || "";
    if (!f || f.netz || !f.status || f.status === 404 || f.status >= 500) return { text: T.fehler.netz };
    const k = Object.keys(T.fehler).find(x => x.length > 2 && m.indexOf(x) >= 0), endgueltig = /falscher Tag|ungültig/i.test(m);
    return { text: k ? T.fehler[k] : endgueltig ? T.fehler.endgueltig : T.fehler._, endgueltig };
  }
  const besten = {}; let serverOk = null, meinEintrag = null;
  /* jede Liste gehört zu Publikum + Lied; alle erfundenen Lieder teilen sich eine Liste */
  const listenSchluessel = () => stufe + "|" + liedWahl;
  const liedFilter = () => liedWahl === "neu" ? "lied=like." + encodeURIComponent("neu|*") : "lied=eq." + liedWahl;
  const liedAnzeige = (feld, T) => String(feld || "").startsWith("neu|") ? String(feld).slice(4) : (T.lieder[feld] || feld);
  const lokalLesen = () => { try { return JSON.parse(localStorage.getItem("imres-auftritt-liste") || "{}") || {}; } catch (_) { return {}; } };
  const zahl = v => { const n = Number(v); return isFinite(n) ? n : 0; };
  const sauber = l => (Array.isArray(l) ? l : []).filter(e => e && typeof e === "object").map(e => ({ name: String(e.name == null ? "" : e.name), lied: String(e.lied == null ? "" : e.lied), prozent: zahl(e.prozent), wurf: zahl(e.wurf), serie: zahl(e.serie), erstellt: String(e.erstellt == null ? "" : e.erstellt) }));
  const sortieren = l => l.sort((a, b) => b.prozent - a.prozent || b.serie - a.serie || String(a.erstellt).localeCompare(String(b.erstellt)));
  function bestenLaden() {
    const k = listenSchluessel();
    return server("/rest/v1/auftritt_bestenliste?select=name,lied,prozent,wurf,serie,erstellt&stufe=eq." + stufe + "&" + liedFilter() + "&order=prozent.desc,serie.desc,erstellt.asc&limit=10")
      .then(l => { besten[k] = sauber(l); serverOk = true; })
      .catch(() => { serverOk = false; besten[k] = sortieren(sauber(lokalLesen()[k])).slice(0, 10); })
      .then(listeNeu);
  }
  function listeNeu() { const el = root.querySelector(".at-liste"); if (el) el.innerHTML = listeHtml(t()); }
  function listeHtml(T) {
    const l = besten[listenSchluessel()];
    if (!l) return "";
    const mitLied = liedWahl === "neu", sp = mitLied ? T.spalten : T.spalten.slice(0, 4);
    return '<h4>' + T.bestenliste + " · " + esc(T.stufen[stufe]) + " · " + esc(liedWahl === "neu" ? T.neuesLied : T.lieder[liedWahl]) + "</h4>" +
      (l.length ? '<table><thead><tr>' + sp.map(x => "<th>" + x + "</th>").join("") + "</tr></thead><tbody>" +
        l.map((e, i) => '<tr' + (meinEintrag && e.erstellt === meinEintrag ? ' class="mein"' : "") + "><td>" + (i < 3 ? ["🥇", "🥈", "🥉"][i] : i + 1) + "</td><td>" + esc(e.name) + "</td><td>" + zahl(e.prozent) + " %</td><td>" + zahl(e.wurf) + "</td>" + (mitLied ? "<td>" + esc(liedAnzeige(e.lied, T)) + "</td>" : "") + "</tr>").join("") +
        "</tbody></table>" : '<p class="at-leer">' + T.leer + "</p>") +
      (serverOk === false ? '<p class="at-leer">' + T.nurHier + "</p>" : "");
  }
  function eintragHtml(T) {
    const e = ergebnis;
    if (e.eingetragen) return '<p class="at-eingetragen">' + esc(e.eingetragen) + "</p>";
    if (e.endgueltig) return '<p class="at-fehler" role="alert">' + esc(e.fehler) + "</p>";
    let name = e.nameEingabe; if (name == null) { name = ""; try { name = localStorage.getItem("imres-auftritt-name") || ""; } catch (_) {} }
    return '<div class="at-eintrag"><input type="text" class="at-name" maxlength="24" placeholder="' + esc(T.deinName) + '" value="' + esc(name) + '"' + (e.sendet ? " disabled" : "") + ">" +
      '<button type="button" class="tav-knopf at-eintragen"' + (e.sendet ? " disabled" : "") + ">" + (e.sendet ? T.sendet : T.eintragen) + "</button></div>" +
      (e.fehler ? '<p class="at-fehler" role="alert">' + esc(e.fehler) + "</p>" : "");
  }
  function eintragNeu(fokus) {
    const el = root.querySelector(".at-eintrag-box"); if (!el || !ergebnis) return;
    el.innerHTML = eintragHtml(t());
    const f = el.querySelector(".at-name"); if (fokus && f) { try { f.focus({ preventScroll: true }); f.select(); } catch (_) {} }
  }
  function eintragen() {
    if (!ergebnis || ergebnis.eingetragen || ergebnis.sendet || ergebnis.endgueltig) return;
    const feld = root.querySelector(".at-name"), name = feld ? feld.value.trim().slice(0, 24) : "";
    if (!name) { if (feld) feld.focus(); return; }
    try { localStorage.setItem("imres-auftritt-name", name); } catch (_) {}
    const T = t(), erg = ergebnis, k2 = listenSchluessel();
    const e = { name, lied: erg.lied.key ? erg.lied.key : "neu|" + liedName(erg.lied, T).slice(0, 36), prozent: erg.prozent, wurf: erg.summe, serie: erg.serie, erstellt: new Date().toISOString() };
    /* auf diesem Gerät merken – ein früherer, abgelehnter Versuch desselben Auftritts wird ersetzt */
    const lok = lokalLesen(), alt = erg.lokal; lok[k2] = sortieren(sauber(lok[k2]).filter(x => !alt || x.erstellt !== alt).concat([e])).slice(0, 10);
    try { localStorage.setItem("imres-auftritt-liste", JSON.stringify(lok)); } catch (_) {}
    erg.lokal = e.erstellt; erg.nameEingabe = name; erg.fehler = ""; erg.sendet = true;
    eintragNeu();
    const fertig = () => {
      erg.sendet = false;
      const l = besten[k2] || [];
      const platz = l.findIndex(x => x.name === e.name && x.prozent === e.prozent && x.serie === e.serie) + 1;
      if (platz) meinEintrag = l[platz - 1].erstellt;
      erg.eingetragen = platz ? T.eingetragen(platz) : T.eingetragenOhne;
      if (ergebnis === erg && !spiel) zeichnen(); else listeNeu();
    };
    const fehler = f => {
      const F = fehlerText(f, T);
      erg.sendet = false; erg.fehler = F.text; erg.endgueltig = !!F.endgueltig;
      return bestenLaden().then(() => { if (ergebnis === erg && !spiel) eintragNeu(!F.endgueltig); });
    };
    server("/rest/v1/rpc/auftritt_eintragen", { p_name: e.name, p_stufe: stufe, p_lied: e.lied, p_prozent: e.prozent, p_wurf: e.wurf, p_serie: e.serie })
      .then(() => bestenLaden().then(fertig), fehler);
  }

  /* ---------- Aussehen ---------- */
  const css = document.createElement("style");
  css.textContent = `
.auftritt { grid-column: 1 / -1; }
.at-stufen { display: flex; flex-wrap: wrap; align-items: center; gap: .4rem; font-size: .85rem; color: var(--ash); }
.at-stufen button { border: 1px solid var(--line); background: none; color: var(--vellum); font: inherit; font-size: .85rem; padding: .35rem .8rem; cursor: pointer; }
.at-stufen button[aria-pressed="true"] { border-color: var(--ember); background: rgba(224,160,70,.18); color: var(--ember); }
.at-buehne { position: relative; max-width: 560px; width: 100%; margin: 0 auto; }
.at-canvas { display: block; width: 100%; height: clamp(300px, 52vw, 400px); background: radial-gradient(ellipse at 50% 90%, rgba(224,160,70,.14), transparent 70%), rgba(16,14,21,.7); border: 1px solid var(--line); touch-action: none; user-select: none; -webkit-user-select: none; cursor: pointer; }
.at-ergebnis { position: absolute; inset: 0; display: grid; align-content: center; justify-items: center; gap: .45rem; padding: 1rem; text-align: center; background: rgba(16,14,21,.88); border: 1px solid var(--ember); }
.at-ergebnis[hidden] { display: none; }
.at-ergebnis { overflow-y: auto; }
@media (max-width: 520px) { .at-ergebnis { gap: .3rem; padding: .7rem; } .at-ergebnis .at-zitat { font-size: .9rem; line-height: 1.35; } .at-w20 { width: 3.6rem; height: 3.6rem; font-size: 1.7rem; } }
.at-w20 { width: 4.6rem; height: 4.6rem; display: grid; place-items: center; font-family: var(--display); font-size: 2.2rem; color: var(--night); background: var(--ember); clip-path: polygon(50% 0, 100% 25%, 100% 75%, 50% 100%, 0 75%, 0 25%); animation: atroll .9s cubic-bezier(.3,1.4,.5,1); }
.at-w20.krit { background: #ffd27a; box-shadow: 0 0 30px #ffd27a; }
.at-w20.patzer { background: var(--blood); color: var(--vellum); }
@keyframes atroll { from { transform: rotate(-540deg) scale(.3); } }
.at-summe { font-family: var(--name); font-size: 1.25rem; color: var(--vellum); margin: 0; }
.at-zitat { font-style: italic; color: var(--vellum); max-width: 26rem; margin: 0; }
.at-werte, .at-rekord { font-size: .82rem; color: var(--ash); margin: 0; }
.at-rekord { color: var(--ember); }
.at-steuer { font-size: .8rem; color: var(--ash); text-align: center; margin: 0; }
.at-fuss { display: flex; justify-content: center; }
.at-erfunden { font-family: var(--hand); font-size: 1.15rem; color: var(--ember); margin-left: .3rem; }
.at-eintrag { display: flex; flex-wrap: wrap; justify-content: center; gap: .5rem; }
.at-name { background: rgba(0,0,0,.3); border: 1px solid var(--line); color: var(--vellum); font: inherit; padding: .45rem .7rem; min-width: 0; width: 12rem; }
.at-eingetragen { text-align: center; color: var(--ember); margin: 0; }
.at-liste { max-width: 560px; width: 100%; margin: 0 auto; }
.at-liste h4 { font-family: var(--display); font-size: .78rem; letter-spacing: .14em; text-transform: uppercase; color: var(--ember); margin: .4rem 0; }
.at-liste table { width: 100%; border-collapse: collapse; font-size: .88rem; }
.at-liste th { text-align: left; font-weight: normal; color: var(--ash); font-size: .75rem; border-bottom: 1px solid var(--line); padding: .25rem .4rem; }
.at-liste td { padding: .3rem .4rem; border-bottom: 1px solid rgba(235,226,204,.06); }
.at-liste td:last-child { color: var(--ash); font-size: .8rem; }
.at-liste tr.mein td { color: var(--ember); }
.at-leer { font-size: .82rem; color: var(--ash); margin: .3rem 0; }
.at-modus { display: inline-flex; flex-wrap: wrap; justify-self: start; border: 1px solid var(--line); }
.at-modus button { border: 0; background: none; color: var(--ash); font: inherit; font-size: .88rem; padding: .4rem .9rem; cursor: pointer; }
.at-modus button[aria-selected="true"] { background: var(--ember); color: var(--night); }
.at-weg-kopf { display: flex; flex-wrap: wrap; gap: .3rem 1.4rem; font-size: .88rem; color: var(--ash); }
.at-weg-kopf strong { color: var(--ember); font-weight: 600; }
.at-pfad { list-style: none; margin: 0; padding: .2rem 0 .5rem; display: flex; gap: .35rem; overflow-x: auto; scrollbar-width: thin; }
.at-pfad { position: relative; }
.at-pfad li { flex: 1 0 3.6rem; position: relative; }
.at-pfad li + li::before { content: ""; position: absolute; left: -.35rem; top: 1.25rem; width: .35rem; border-top: 1px dashed var(--line); }
.at-pfad button { width: 100%; display: grid; justify-items: center; gap: .1rem; padding: .35rem .2rem .3rem; border: 1px solid var(--line); background: rgba(0,0,0,.2); color: var(--vellum); font: inherit; cursor: pointer; }
.at-pfad button[aria-pressed="true"] { border-color: var(--ember); background: rgba(224,160,70,.16); box-shadow: 0 0 12px rgba(224,160,70,.25); }
.at-pfad button:disabled { cursor: not-allowed; opacity: .4; }
.at-pfad .sym { font-size: 1.2rem; line-height: 1.1; }
.at-pfad .nr { font-size: .7rem; color: var(--ash); }
.at-pfad .st { font-size: .62rem; letter-spacing: .02em; color: var(--ember); min-height: .8rem; }
.at-weg-ende { margin: 0; text-align: center; font-family: var(--hand); font-size: 1.3rem; color: var(--ember); }
.at-station { border-left: 2px solid var(--ember); padding: .2rem 0 .2rem .9rem; display: grid; gap: .35rem; }
.at-ort { margin: 0; font-family: var(--name); font-size: 1.2rem; color: var(--vellum); line-height: 1.2; }
.at-intro { margin: 0; font-style: italic; color: var(--vellum); }
.at-eckdaten { margin: 0; display: flex; flex-wrap: wrap; gap: .2rem 1.1rem; font-size: .83rem; color: var(--ash); }
.at-eckdaten .sg { color: var(--ember); font-weight: 600; }
.at-urteil { margin: 0; font-family: var(--display); font-size: 1.1rem; letter-spacing: .05em; }
.at-urteil.ja { color: #ffd27a; }
.at-urteil.nein { color: #c4564a; }
.at-sterne { letter-spacing: .1em; }
.at-fuss { gap: .6rem; flex-wrap: wrap; }
.at-weg-fuss { display: flex; justify-content: center; }
.at-weg-fuss { margin-top: 1.4rem; }
.at-zurueck { border: 1px solid var(--line); background: rgba(0,0,0,.2); color: var(--ash); font: inherit; font-size: .85rem; min-height: 44px; padding: .5rem 1.1rem; cursor: pointer; }
.at-zurueck:hover, .at-zurueck:focus-visible { color: var(--vellum); border-color: var(--ash); }
.at-pause { position: absolute; inset: 0; display: grid; place-content: center; justify-items: center; gap: .5rem; padding: 1rem; text-align: center; background: rgba(16,14,21,.82); border: 1px solid var(--ember); color: var(--vellum); font-family: var(--name); font-size: 1.2rem; cursor: pointer; touch-action: manipulation; user-select: none; -webkit-user-select: none; }
.at-pause[hidden] { display: none; }
.at-pause.zaehlt { background: rgba(16,14,21,.45); cursor: default; }
.at-pause-sym { font-size: 2.4rem; color: var(--ember); line-height: 1; }
.at-zahl { font-family: var(--display); font-size: 4rem; color: #ffd27a; text-shadow: 0 0 24px rgba(255,210,122,.6); animation: atzahl .65s ease-out; }
@keyframes atzahl { from { transform: scale(1.6); opacity: 0; } }
.at-ton { display: flex; justify-content: center; align-items: center; gap: .6rem; font-size: .82rem; color: var(--ash); }
.at-ton label { display: flex; align-items: center; gap: .5rem; }
.at-laut { width: 9rem; height: 32px; margin: 0; accent-color: var(--ember); }
.at-stumm { border: 1px solid var(--line); background: none; color: var(--vellum); font-size: 1.05rem; min-width: 44px; min-height: 40px; cursor: pointer; }
.at-stumm[aria-pressed="true"] { border-color: var(--ember); }
.at-kalib-zeile { display: flex; flex-wrap: wrap; justify-content: center; align-items: center; gap: .3rem .9rem; font-size: .82rem; color: var(--ash); }
.at-kalib { border: 1px solid var(--line); background: none; color: var(--vellum); font: inherit; font-size: .85rem; min-height: 40px; padding: .4rem .9rem; cursor: pointer; }
.at-kalib-weg { border: 0; background: none; color: var(--ash); font: inherit; text-decoration: underline; cursor: pointer; padding: .3rem .2rem; }
.at-kalib-info { flex-basis: 100%; text-align: center; color: var(--ember); margin: 0; }
.at-fehler { text-align: center; color: #e08a7e; font-size: .88rem; margin: .4rem 0 0; }
.at-eintrag input:disabled, .at-eintrag button:disabled { opacity: .6; }
.auftritt button, .at-pause { touch-action: manipulation; }
`;
  document.head.appendChild(css);

  root._zustand = () => ({ spiel, ctx, stimmt, kalib, kalibWert, weg, proben: [...probeBuf.keys()], hoerZeit: ms => hoerZeit(ms) }); /* für automatische Tests */
  zeichnen();
  bestenLaden();
  let letzteSprache = sprache();
  new MutationObserver(() => { if (sprache() === letzteSprache) return; letzteSprache = sprache(); if (!spiel) zeichnen(); }).observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });
  /* ---------- Controller (controller.js) ---------- */
  root._pad = {
    laeuft: () => !!spiel && !spiel.pause, pausiert: () => !!spiel && spiel.pause === "pause", spielt: () => !!spiel,
    pause: () => pausieren(), weiter: () => weiterspielen(),
    anzeige(l) { TASTEN_ANZEIGE.splice(0, 3, ...l); if (!spiel) malenRuhe(); }
  };
})();
