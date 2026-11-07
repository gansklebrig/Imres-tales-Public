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
      publikum: "Schwierigkeitsgrad",
      stufen: { leicht: "🍺 Bauern in Phandalin", mittel: "👑 Am Hof von König Horga", schwer: "🐉 Ein Drache hört zu" },
      stufenKurz: { leicht: "🍺 Bauern", mittel: "👑 Königshof", schwer: "🐉 Drache" },
      vorhang: "A · S · D oder auf die Spuren tippen – Noten mit Schweif gedrückt halten!",
      band: { echo: "🌿 Echo schwebt mit der Flöte herein!", friedrich: "🥁 Friedrich trommelt sich auf die Bühne!", ezekiel: "🗡 Ezekiel gleitet aus den Schatten …", rex: "🐕 Rex springt dazu – Wuff!" },
      feuer: ["🔥 Barradin brennt!", "🔥 Die Fackeln fliegen!", "🔥 Die ganze Bühne steht in Flammen!"],
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
        buerger: "Des Bürgermeisters Geldbeutel", palast: "Hymne der Krone", elfen: "Mondscheinreigen der Feen", goetter: "Das Ewige Lied",
        flammen: "Die Ballade vom Meister der Flammen" },
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
        neuerRang: r => "Neuer Ruf: " + r, ende: "Barradins Weg ist vollendet. Die Götter summen sein Lied – und tief unter Gracklstugh brummt ein Drache mit.",
        zuruecksetzen: "Weg von vorn beginnen", sicher: "Wirklich den ganzen Fortschritt löschen?",
        unbekannt: "Unbekannter Barde",
        raenge: ["Straßenmusikant", "Spelunkensänger", "Hafenbarde", "Gasthaussänger", "Festbarde", "Ballmusikus", "Schlossbarde", "Spielmann des Unterreichs", "Hofbarde von Neverwinter", "Liebling der Feen", "Gottgeküsster Barde", "Drachensänger"],
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
            sieg: "Die Götter erheben sich. Mein Lied wird in die Sterne geschrieben, und irgendwo in Phandalin wacht ein Hund auf und wedelt mit dem Schwanz. Nur: Tief im Unterreich hat jemand mitgehört, der nach Schwefel riecht. Zugabe!",
            pleite: "Ein Gott hustet. Ein anderer lächelt nachsichtig. Unsterbliche haben Zeit – und ich noch einen Versuch." },
          { ort: "Zugabe: Vor dem Meister der Flammen – Themberchauds Halle in Gracklstugh", publikum: "Ein roter Drache auf einem Berg aus Gold, sein Hohepriester Gartokkar und ein Echo, das die Münzen zählt",
            intro: "Lava an allen Rändern, Gold in der Mitte, und obendrauf ein Drache, der schon satt aussieht – hoffentlich. Ich singe ihm unsere ganze Reise: Donnerbaum, Drow, Spinnen, Kuo-Toa, Demogorgon. In Reimen. Ohne Patzer.",
            sieg: "Themberchaud senkt den gewaltigen Kopf. „Unterhaltsam.“ Wir dürfen leben – mehr noch: Der Meister der Flammen hat einen Auftrag für uns. Echo fragt ihn, ob er Gundren kennt. Er kennt ihn nicht.",
            pleite: "Aus den Nüstern des Drachen steigt ein Rauchwölkchen. Ein kleines. Ein warnendes. Meine Laute ist plötzlich sehr warm. Noch einmal – und diesmal mit Reimen, die sich reimen." }
        ]
      }
    },
    en: {
      label: "Stage rehearsal", titel: "Barradin's Performance",
      text: "Barradin strikes up – and you play along! Hit the notes as soon as they reach the golden line. In the end your sense of rhythm decides the performance check.",
      steuerung: "Keys A · S · D (or J · K · L, ← ↓ →) – on a phone just tap the lane. Notes with a tail: keep holding until the tail ends.",
      publikum: "Difficulty",
      stufen: { leicht: "🍺 Farmers in Phandalin", mittel: "👑 At King Horga's court", schwer: "🐉 A dragon is listening" },
      stufenKurz: { leicht: "🍺 Farmers", mittel: "👑 Royal court", schwer: "🐉 Dragon" },
      vorhang: "A · S · D or tap the lanes – hold the notes with tails!",
      band: { echo: "🌿 Echo floats in with his flute!", friedrich: "🥁 Friedrich drums his way onto the stage!", ezekiel: "🗡 Ezekiel slips out of the shadows …", rex: "🐕 Rex jumps in – woof!" },
      feuer: ["🔥 Barradin is on fire!", "🔥 The torches are flying!", "🔥 The whole stage is ablaze!"],
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
        buerger: "The Mayor's Purse", palast: "Hymn of the Crown", elfen: "Moonlit Dance of the Fey", goetter: "The Eternal Song",
        flammen: "The Ballad of the Master of Flames" },
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
        neuerRang: r => "New fame: " + r, ende: "Barradin's road is complete. The gods are humming his song – and deep beneath Gracklstugh a dragon rumbles along.",
        zuruecksetzen: "Start the road over", sicher: "Really erase all progress?",
        unbekannt: "Unknown bard",
        raenge: ["Street musician", "Dive singer", "Harbour bard", "Inn singer", "Festival bard", "Ballroom musician", "Castle bard", "Minstrel of the Underdark", "Court bard of Neverwinter", "Darling of the fey", "God-kissed bard", "Dragon singer"],
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
            sieg: "The gods rise. My song is written into the stars, and somewhere in Phandalin a dog wakes up and wags its tail. Except: deep in the Underdark, someone who smells of brimstone was listening. Encore!",
            pleite: "One god coughs. Another smiles indulgently. Immortals have time – and I have another try." },
          { ort: "Encore: before the Master of Flames – Themberchaud's hall in Gracklstugh", publikum: "A red dragon on a mountain of gold, his high priest Gartokkar and an Echo counting the coins",
            intro: "Lava on every edge, gold in the middle, and on top a dragon who already looks well fed – hopefully. I'll sing him our whole journey: Thunder Tree, drow, spiders, kuo-toa, Demogorgon. In rhyme. Without a slip.",
            sieg: "Themberchaud lowers his enormous head. \"Entertaining.\" We get to live – better still: the Master of Flames has a task for us. Echo asks him if he knows Gundren. He does not.",
            pleite: "A little puff of smoke rises from the dragon's nostrils. A small one. A warning one. My lute is suddenly very warm. Once more – and this time with rhymes that actually rhyme." }
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
      motive: [[0, 2, 4, 6, 8, 10, 12, 14], [0, 3, 4, 6, 8, 11, 12], [2, 4, 6, 8, 10, 12, 14], [0, 2, 4, 7, 8, 10, 12]], floete: { g: [5, 13], u: [3, 9, 15] } },
    /* Themberchauds Ballade: harmonisch Moll auf C, feurig – i, VI, iv, V; im Nachsatz der verminderte ii vor der Dominante */
    flammen: { modus: "harmonisch", grund: 60, tempo: 1, folge: [0, 5, 3, 4, 0, 5, 1, 4], takt: 16, bass: [0, 6, 8] }
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
    goetter: ["7...4.7.9.8.7.4.", "7...5.7.9...7...", "8...6.8.a.9.8.6.", "7-------4...7...", "a.9.7...5...7...", "9...7...5.6.7...", "8...a...8.7.6...", "4.6.8...6-------"],
    flammen: ["4.7.9...b-a-9.7.", "c-a-9...7.9.c...", "a...a.9.7...5.7.", "8.9.8.6.4-------", "4.7.9...b-a-9.7.", "c-b-c...9...7.9.", "a...8.a.c...a.8.", "b.a.b.8.6-------"]
  };
  Object.keys(MELODIEN).forEach(k => { if (LIEDER[k]) LIEDER[k].melodie = MELODIEN[k]; });
  LIEDER.ploop.raster = [4, 3, 2]; /* Jig: Schläge zu je drei Schritten */
  LIEDER.schmiede.bassGleich = true; LIEDER.schatten.bassGleich = true;
  /* ---------- Barradins Weg ----------
     Zwölf Bühnen (die letzte ist die Zugabe vor Themberchaud), jede mit eigenem Stück, eigener Schwierigkeit und einem Schwierigkeitsgrad (SG),
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
    station("schwer", "goetter", 21, { tempo: 114, flug: 1.6, takte: 20 }),
    /* Zugabe – nur hinten anhängen, die Sterne werden nach Index gespeichert */
    station("schwer", "flammen", 22, { tempo: 104, flug: 1.65, takte: 18 })
  ];
  const WEG_ZEICHEN = ["🍺", "🐀", "⚓", "🕯️", "💰", "💃", "🦇", "⚒️", "👑", "🌙", "✨", "🐉"];
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
  /* jede Bühne mit eigener Klangfarbe: statt der Harfe ein anderes Zupf- oder Schlaginstrument unter der Melodie, dazu eine andere Trommel
     (Psalter, Zither, Balafon, Mbira, Volksharfe, Scheitholt, Handglocken: VCSL, CC0; Hackbrett wie im Lautenwerk) */
  Object.assign(KARTE, {"psa":[70,72,74,76,78,80,82,84,86,88,90],"zit":[47,49,51,54,56,59,61,63,66,68,71,73,75,78,80,83],"bal":[61,65,72,77,84,89],"mbira":[46,48,50,51,53,55,56,58,60,62,63,65,67,68,70,72,73,74,75],"fharfe":[36,38,40,42,44,46,48,50,52,54,56,58,60,62,64,66,68,70,72,74,76,78,80,82,84,86,88,90,92],"strum":[50,52,54,55,57,59,61,62,64,66,67,69,71,73,74,76,78,79,81],"hglo":[60,62,64,66,68,70,72,74,76,78,80,81,84,86,88,90,92,94,96],"hack":[48,51,54,57,60,63,66,69,72,75,78,81,84,87,90,93,96]});
  const FARBE = { klage: { t: "psa", f: 1.6 }, seemann: { t: "strum", f: 1.15, tr: "rahm" }, buerger: { t: "strum", f: 1.15 }, walzer: { t: "fharfe", f: 1.4 },
    schatten: { t: "zit", f: 1.8, tr: "darb" }, schmiede: { t: "bal", f: 1.7, tr: "darb" }, palast: { t: "hack", f: 1.1 }, elfen: { t: "psa", f: 1.6, tr: "rahm" },
    goetter: { t: "hglo", f: 1.5, tr: "rahm" }, flammen: { t: "mbira", f: 1.7, tr: "darb" }, ploop: { t: "bal", f: 1.7 }, rex: { t: "strum", f: 1.15 }, venom: { t: "zit", f: 1.8, tr: "darb" } };
  const TROMMEL_PROBE = { rahm: ["rahm_1", "rahm_2", 1.5], darb: ["darb_1", "darb_2", 1.5] };
  const imBereich = (g, m) => { const k = KARTE[g]; if (!k) return m; while (m < k[0] - 2) m += 12; while (m > k[k.length - 1] + 2) m -= 12; return m; };
  const farbe = daten => (daten && daten.lied && FARBE[daten.lied.key]) || {};
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
    const fb = farbe(daten), tp = fb.t || "harfe", namen = new Set(["bodh1", "bodh2", "holz1", "holz2"].concat(fb.tr ? TROMMEL_PROBE[fb.tr].slice(0, 2) : []));
    daten.liste.forEach(n => namen.add(probeName(SPUR_PROBE[n.spur], MIDI[n.spur](n.ton))));
    (daten.auto || []).forEach(a => namen.add(probeName(SPUR_PROBE[a.spur], MIDI[a.spur](a.ton))));
    if (daten.modus) { const MO = MODI[daten.modus]; daten.akkorde.forEach(g => [0, 4, 7, 9, 11].forEach(o => { const d = g + o; namen.add(probeName(tp, imBereich(tp, GRUND - 12 + MO[d % 7] + 12 * Math.floor(d / 7)))); })); }
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
    const fb = farbe(daten), tp = fb.t || "harfe", tf = fb.f || 1, tr = fb.tr && TROMMEL_PROBE[fb.tr];
    const trommel = (z, schwer, laut) => { if (!(tr && probe(schwer ? tr[0] : tr[1], 0, z, laut * tr[2], { dauer: .9, aus: .25 })) && !probe(schwer ? "bodh1" : "bodh2", 0, z, laut, { dauer: .9, aus: .25 })) { if (schwer) schlag(z, 105, 46, .55, .32); else rauschen(z, "bandpass", 1300, .12, .05); } };
    /* Die Band spielt alles, was gerade nicht deine Noten sind – so klingt das Lied immer vollständig */
    (daten.auto || []).forEach(a => ton(a.spur, a.ton, start + a.zeit, a.klang, null, a.spur === 2 ? .8 : .75));
    /* Harfe: gezupfte Akkordbrechung in Achteln – der Teppich unter allem */
    if (daten.modus) {
      const MO = MODI[daten.modus], stufeMidi = d => GRUND - 12 + MO[d % 7] + 12 * Math.floor(d / 7);
      const muster = L === 12 ? [0, 4, 7, 9, 7, 4] : [0, 4, 7, 9, 11, 9, 7, 4];
      daten.akkorde.forEach((g, takt) => {
        const z0 = start + daten.vor + takt * L * s, schluss = takt === daten.akkorde.length - 1;
        muster.forEach((o, k) => { if (schluss && k > 0) return; if (!probe(tp, imBereich(tp, stufeMidi(g + o)), z0 + k * 2 * s, (k === 0 ? .2 : .13) * tf, { dauer: schluss ? 2.5 : 1.2, aus: .4 })) probe("harfe", stufeMidi(g + o), z0 + k * 2 * s, k === 0 ? .2 : .13, { dauer: schluss ? 2.5 : 1.2, aus: .4 }); });
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
  /* Bestandene Bühne schaltet die nächste frei – auch eine später angehängte Zugabe */
  const freiAusSternen = w => { (w.sterne || []).forEach((x, i) => { if (x > 0) w.frei = Math.max(w.frei | 0, i + 1); }); };
  freiAusSternen(weg);
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
    freiAusSternen(weg); weg.frei = Math.min(WEG.length - 1, weg.frei);
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

  /* =====================================================================
     DIE BÜHNE: Kulissen, Band und Publikum
     Hinter der Notenbahn steht eine gemalte Bühne – jede der zwölf Bühnen von „Barradins Weg“ hat
     ihre eigene Kulisse, das freie Spiel die passende zum Schwierigkeitsgrad (Bauern → „Lahmer Esel“,
     Hof → König Horgas Feste, Drache → Themberchauds Halle). Bei jedem Auftritt wird neu ausgewürfelt:
     Licht, Wetter vor dem Fenster, Deko, Publikum, kleine Gäste. Im Lauf des Lieds kommt die Gruppe dazu,
     das Publikum geht mit (Krüge hoch, Rosen und Münzen – oder Tomaten), lange Serien setzen die Bühne in Flammen.
     Alles Unbewegte wird einmal in eine eigene Leinwand gemalt; pro Bild kommt nur das Bewegte dazu.
     Bei „Bewegung reduzieren“ bleibt die Bühne ein ruhiges Bild ohne Partikel und Würfe.
     ===================================================================== */
  const reduziert = () => { try { return !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches); } catch (_) { return false; } };
  const zufallsGen = seed => { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let x = a; x = Math.imul(x ^ (x >>> 15), x | 1); x ^= x + Math.imul(x ^ (x >>> 7), x | 61); return ((x ^ (x >>> 14)) >>> 0) / 4294967296; }; };
  const aus = (R, l) => l[Math.floor(R() * l.length)];
  const rgba = (hex, a) => { const n = parseInt(hex.slice(1), 16); return "rgba(" + (n >> 16) + "," + ((n >> 8) & 255) + "," + (n & 255) + "," + a + ")"; };
  const TAU = Math.PI * 2;
  const klemme = (x, a, b) => Math.max(a, Math.min(b, x));
  const weich = x => { x = klemme(x, 0, 1); return x * x * (3 - 2 * x); };

  /* Leuchtpunkte (Licht, Flammen) als vorgemalte Bilder – billiger als Verläufe in jedem Bild */
  const leuchtBilder = new Map();
  function leuchtBild(farbe) {
    if (leuchtBilder.has(farbe)) return leuchtBilder.get(farbe);
    const c = document.createElement("canvas"); c.width = c.height = 64;
    const g = c.getContext("2d"), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    if (farbe === "flamme") { gr.addColorStop(0, "rgba(255,246,210,1)"); gr.addColorStop(.22, "rgba(255,196,90,.9)"); gr.addColorStop(.55, "rgba(235,96,34,.38)"); gr.addColorStop(1, "rgba(200,40,10,0)"); }
    else if (farbe === "rauch") { gr.addColorStop(0, "rgba(60,54,52,.55)"); gr.addColorStop(1, "rgba(60,54,52,0)"); }
    else { gr.addColorStop(0, rgba(farbe, .9)); gr.addColorStop(.35, rgba(farbe, .35)); gr.addColorStop(1, rgba(farbe, 0)); }
    g.fillStyle = gr; g.fillRect(0, 0, 64, 64); leuchtBilder.set(farbe, c); return c;
  }
  const leuchten = (g, farbe, x, y, r, a) => { if (a <= 0 || r <= 0) return; const alt = g.globalAlpha; g.globalAlpha = alt * Math.min(1, a); g.drawImage(leuchtBild(farbe), x - r, y - r, 2 * r, 2 * r); g.globalAlpha = alt; };

  /* ---------- Malwerkzeug für die Kulissen (alles in Geräte-Pixeln; u = Grundmaß) ---------- */
  function werkzeug(g, w, h, s) {
    const u = Math.min(w / 100, h / 70), wb = h * .6, y = h * .82, R = s.Rb;
    const L = { g, w, h, u, wb, y, R, s, fb: wb + (y - wb) * .16 };
    L.verlauf = (y0, y1, stops) => { const gr = g.createLinearGradient(0, y0, 0, y1); stops.forEach((c, i) => gr.addColorStop(i / (stops.length - 1), c)); return gr; };
    L.wand = (...farben) => { g.fillStyle = L.verlauf(0, wb, farben); g.fillRect(0, 0, w, wb + 1); };
    L.bretter = (farbe, breite) => {
      g.fillStyle = farbe;
      for (let x = R() * breite * u; x < w; x += breite * u * (.8 + R() * .4)) g.fillRect(x, 0, Math.max(1, u * .28), wb);
      for (let i = 0; i < w / (u * 14); i++) { g.beginPath(); g.ellipse(R() * w, R() * wb, u * .45, u * .8, 0, 0, TAU); g.fill(); }
    };
    L.steine = (farben, fuge) => {
      const sh = u * 4.2, sw = u * 9;
      g.fillStyle = fuge; g.fillRect(0, 0, w, wb);
      for (let r = 0, yy = 0; yy < wb; r++, yy += sh) for (let x = (r % 2) * -sw / 2; x < w; x += sw) {
        g.fillStyle = aus(R, farben); g.fillRect(x + u * .35, yy + u * .35, sw - u * .7, sh - u * .7);
        g.fillStyle = "rgba(255,240,210,.035)"; g.fillRect(x + u * .35, yy + u * .35, sw - u * .7, u * .5);
      }
    };
    L.balken = (yy, dicke, farbe) => { g.fillStyle = farbe; g.fillRect(0, yy, w, dicke * u); g.fillStyle = "rgba(0,0,0,.4)"; g.fillRect(0, yy + dicke * u * .72, w, dicke * u * .28); };
    L.pfosten = (x, breite, farbe) => { g.fillStyle = farbe; g.fillRect(x - breite * u / 2, 0, breite * u, wb); g.fillStyle = "rgba(0,0,0,.32)"; g.fillRect(x + breite * u * .15, 0, breite * u * .35, wb); };
    L.mond = (x, yy, r) => {
      leuchten(g, "#ffeec8", x, yy, r * 3.4, .5);
      g.fillStyle = "#f1e4c0"; g.beginPath(); g.arc(x, yy, r, 0, TAU); g.fill();
      g.fillStyle = "rgba(150,130,96,.22)"; [[-.3, -.2, .22], [.28, .12, .3], [-.05, .45, .14]].forEach(([a, b, c]) => { g.beginPath(); g.arc(x + a * r, yy + b * r, c * r, 0, TAU); g.fill(); });
    };
    L.sterne = (x0, y0, bw, bh, dichte) => {
      const n = Math.round(bw * bh / (u * u) * (dichte || .12));
      for (let i = 0; i < n; i++) {
        const x = x0 + R() * bw, yy = y0 + R() * bh, a = .25 + R() * .6, sz = Math.max(1, u * (.12 + R() * .2));
        g.fillStyle = "rgba(255,242,215," + a + ")"; g.fillRect(x, yy, sz, sz);
        if (R() < .1 && s.funkeln.length < 26) s.funkeln.push({ x, y: yy, sz: sz * 3.2, f: R() * TAU });
      }
    };
    L.daecher = (x0, y0, bw, bh) => {
      g.fillStyle = "#0b080c";
      for (let x = x0 - R() * u * 4; x < x0 + bw; x += u * (5 + R() * 4)) {
        const dh = bh * (.18 + R() * .16), dw = u * (5 + R() * 3);
        g.beginPath(); g.moveTo(x, y0 + bh); g.lineTo(x, y0 + bh - dh); g.lineTo(x + dw / 2, y0 + bh - dh - dw * .45); g.lineTo(x + dw, y0 + bh - dh); g.lineTo(x + dw, y0 + bh); g.fill();
        if (R() < .5) { g.fillStyle = "rgba(255,190,90,.75)"; g.fillRect(x + dw * .35, y0 + bh - dh * .6, u * .7, u * .8); g.fillStyle = "#0b080c"; }
      }
    };
    L.ausblick = (x, yy, bw, bh, art) => {
      art = art || s.v.wetter;
      const trueb = art === "regen" || art === "nebel";
      g.fillStyle = L.verlauf(yy, yy + bh, trueb ? ["#2d2730", "#151217"] : art === "abend" ? ["#d07a48", "#6a2c40"] : ["#22152c", "#0d0912"]); g.fillRect(x, yy, bw, bh);
      if (!trueb && art !== "abend") L.sterne(x, yy, bw, bh * (art === "meer" ? .55 : 1), .3);
      if (art === "mond" || art === "meer") L.mond(x + bw * (.3 + R() * .4), yy + bh * (.24 + R() * .12), Math.max(u * 1.1, Math.min(bw, bh) * .14));
      if (art === "meer") {
        const wy = yy + bh * .58; g.fillStyle = L.verlauf(wy, yy + bh, ["#17342c", "#08130f"]); g.fillRect(x, wy, bw, yy + bh - wy);
        g.fillStyle = "rgba(255,236,190,.35)";
        for (let i = 0; i < 7; i++) { const ly = wy + (i + 1) * (yy + bh - wy) / 8, lx = x + bw * (.3 + R() * .4), lw = u * (1 + R() * 2.5); g.fillRect(lx - lw, ly, lw * 2, Math.max(1, u * .2)); }
        s.wellen.push({ x, y: wy, bw, bh: yy + bh - wy });
      }
      if (art === "nebel") for (let i = 0; i < 6; i++) { g.fillStyle = "rgba(225,214,200,.08)"; g.beginPath(); g.ellipse(x + R() * bw, yy + bh * (.35 + R() * .55), bw * .45, bh * .12, 0, 0, TAU); g.fill(); }
      if (art === "regen") s.regen.push({ x, y: yy, bw, bh });
      if (s.v.daecher) L.daecher(x, yy, bw, bh);
    };
    L.fenster = (x, yy, bw, bh, rahmen, art) => {
      g.save(); g.beginPath(); g.rect(x, yy, bw, bh); g.clip(); L.ausblick(x, yy, bw, bh, art); g.restore();
      g.strokeStyle = rahmen; g.lineWidth = u * .9; g.strokeRect(x, yy, bw, bh);
      g.lineWidth = u * .5; g.beginPath(); g.moveTo(x + bw / 2, yy); g.lineTo(x + bw / 2, yy + bh); g.moveTo(x, yy + bh / 2); g.lineTo(x + bw, yy + bh / 2); g.stroke();
      g.fillStyle = rahmen; g.fillRect(x - u * .8, yy + bh, bw + u * 1.6, u * 1.1);
    };
    L.gitterfenster = (x, yy, bw, bh, rahmen, art) => {
      g.save(); g.beginPath(); g.rect(x, yy, bw, bh); g.clip(); L.ausblick(x, yy, bw, bh, art); g.restore();
      g.strokeStyle = rahmen; g.lineWidth = u * .8; g.strokeRect(x, yy, bw, bh);
      g.lineWidth = u * .45; g.beginPath(); for (let k = 1; k < 4; k++) { g.moveTo(x + bw * k / 4, yy); g.lineTo(x + bw * k / 4, yy + bh); } g.stroke();
    };
    L.rundfenster = (x, yy, r, rahmen, art) => {
      g.save(); g.beginPath(); g.arc(x, yy, r, 0, TAU); g.clip(); L.ausblick(x - r, yy - r, 2 * r, 2 * r, art); g.restore();
      g.strokeStyle = rahmen; g.lineWidth = u * 1.3; g.beginPath(); g.arc(x, yy, r, 0, TAU); g.stroke();
      g.fillStyle = "#8a6a3a"; for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; g.beginPath(); g.arc(x + Math.cos(a) * r, yy + Math.sin(a) * r, u * .32, 0, TAU); g.fill(); }
    };
    L.bogenfenster = (x, yy, bw, bh, rahmen, art, spitz) => {
      const pfad = () => {
        g.beginPath(); g.moveTo(x, yy + bh); g.lineTo(x, yy + bw / 2);
        if (spitz) { g.quadraticCurveTo(x, yy, x + bw / 2, yy - bw * .18); g.quadraticCurveTo(x + bw, yy, x + bw, yy + bw / 2); } else g.arc(x + bw / 2, yy + bw / 2, bw / 2, Math.PI, 0);
        g.lineTo(x + bw, yy + bh); g.closePath();
      };
      g.save(); pfad(); g.clip(); L.ausblick(x, yy - bw * .2, bw, bh + bw * .2, art); g.restore();
      g.strokeStyle = rahmen; g.lineWidth = u * 1.1; pfad(); g.stroke();
      g.lineWidth = u * .45; g.beginPath(); g.moveTo(x + bw / 2, yy + (spitz ? -bw * .12 : 0)); g.lineTo(x + bw / 2, yy + bh);
      for (let k = 1; k < 3; k++) { const ly = yy + bw / 2 + (bh - bw / 2) * k / 3; g.moveTo(x, ly); g.lineTo(x + bw, ly); }
      g.stroke();
    };
    L.laterne = (x, yy, gr, farbe, schwingt) => {
      if (schwingt) s.schwingen.push({ x, y: yy, gr, farbe, f: R() * TAU }); else laterneMalen(g, x, yy, gr, farbe, u);
      s.lichter.push({ x, y: yy, r: gr * u * 10, farbe, f: R() * TAU, schwing: schwingt ? s.schwingen.length - 1 : -1 });
    };
    L.kerze = (x, yy, gr, farbe) => {
      const b = gr * u; g.fillStyle = "#e6d9bb"; g.fillRect(x - b * .25, yy - b * 1.6, b * .5, b * 1.6);
      g.fillStyle = "rgba(0,0,0,.25)"; g.fillRect(x + b * .05, yy - b * 1.6, b * .2, b * 1.6);
      s.flammen.push({ x, y: yy - b * 1.6, b, f: R() * TAU });
      if (s.lichter.length < 12) s.lichter.push({ x, y: yy - b * 2, r: b * 7, farbe: farbe || "#ffb050", f: R() * TAU, schwing: -1 });
    };
    L.leuchter = (x, gr) => { /* Standleuchter mit drei Kerzen */
      const b = gr * u, fuss = L.fb + u * 2;
      g.fillStyle = "#2a2018"; g.fillRect(x - b * .2, fuss - b * 7, b * .4, b * 7); g.fillRect(x - b * 1.2, fuss - b * .3, b * 2.4, b * .3);
      g.strokeStyle = "#5a4628"; g.lineWidth = b * .3; g.beginPath(); g.moveTo(x - b * 2, fuss - b * 7.6); g.quadraticCurveTo(x, fuss - b * 6, x + b * 2, fuss - b * 7.6); g.stroke();
      [-2, 0, 2].forEach(k => L.kerze(x + k * b, fuss - b * (k ? 7.6 : 7), gr * .55, "#ffc060"));
    };
    L.fass = (x, gr) => {
      const b = gr * u, fuss = L.fb + u, bw = b * 5, bh = b * 6.5;
      g.fillStyle = "#3a2414"; g.beginPath(); g.ellipse(x, fuss - bh / 2, bw / 2, bh / 2, 0, 0, TAU); g.fill();
      g.fillStyle = "rgba(255,200,140,.06)"; g.beginPath(); g.ellipse(x - bw * .12, fuss - bh / 2, bw * .25, bh * .45, 0, 0, TAU); g.fill();
      g.strokeStyle = "#16100a"; g.lineWidth = u * .5; [.25, .75].forEach(k => { g.beginPath(); g.moveTo(x - bw * .48, fuss - bh * k); g.lineTo(x + bw * .48, fuss - bh * k); g.stroke(); });
      g.fillStyle = "#24160c"; g.beginPath(); g.ellipse(x, fuss - bh * .97, bw * .4, b * .6, 0, 0, TAU); g.fill();
      return fuss - bh;
    };
    L.kiste = (x, gr) => { const b = gr * u, fuss = L.fb + u; g.fillStyle = "#3a2818"; g.fillRect(x - b * 3, fuss - b * 4.5, b * 6, b * 4.5); g.strokeStyle = "#1a120a"; g.lineWidth = u * .4; g.strokeRect(x - b * 3, fuss - b * 4.5, b * 6, b * 4.5); g.beginPath(); g.moveTo(x - b * 3, fuss - b * 4.5); g.lineTo(x + b * 3, fuss); g.stroke(); return fuss - b * 4.5; };
    L.regal = (x, yy, bw) => {
      g.fillStyle = "#24160c"; g.fillRect(x, yy, bw, u * .8); g.fillRect(x, yy + u * 7, bw, u * .8);
      [yy, yy + u * 7].forEach(by => { for (let k = x + u; k < x + bw - u * 1.5; k += u * (1.6 + R() * 1.4)) {
        const art = R();
        if (art < .45) { g.fillStyle = aus(R, ["#3a5a2a", "#6a3a1a", "#5a1a1a", "#7a5a24"]); g.fillRect(k, by - u * 4, u * 1.2, u * 3); g.fillRect(k + u * .35, by - u * 5.2, u * .5, u * 1.3); }
        else if (art < .8) { g.fillStyle = "#6a4a2a"; g.fillRect(k, by - u * 2.4, u * 1.8, u * 2.4); g.strokeStyle = "#6a4a2a"; g.lineWidth = u * .35; g.beginPath(); g.arc(k + u * 1.9, by - u * 1.2, u * .6, -1.4, 1.4); g.stroke(); k += u * .6; }
        else { g.fillStyle = "#c8b890"; g.beginPath(); g.arc(k + u * .8, by - u * .9, u * .9, Math.PI, 0); g.fill(); }
      } });
    };
    L.bild = (x, yy, bw, bh) => {
      g.fillStyle = "#7a5a24"; g.fillRect(x - u * .8, yy - u * .8, bw + u * 1.6, bh + u * 1.6);
      g.fillStyle = L.verlauf(yy, yy + bh, [aus(R, ["#5a4a30", "#4a3a2a", "#3a3424"]), "#1e1810"]); g.fillRect(x, yy, bw, bh);
      if (R() < .5) { g.fillStyle = "#2a2014"; g.beginPath(); g.moveTo(x, yy + bh); for (let k = 0; k <= 6; k++) g.lineTo(x + bw * k / 6, yy + bh * (.55 + R() * .2)); g.lineTo(x + bw, yy + bh); g.fill(); }
      else { g.fillStyle = "#1a140e"; g.beginPath(); g.arc(x + bw / 2, yy + bh * .4, bw * .16, 0, TAU); g.fill(); g.beginPath(); g.ellipse(x + bw / 2, yy + bh, bw * .32, bh * .38, 0, Math.PI, 0); g.fill(); }
    };
    L.saeule = (x, bw, hell, dunkel) => {
      const gr = g.createLinearGradient(x - bw / 2, 0, x + bw / 2, 0); gr.addColorStop(0, dunkel); gr.addColorStop(.35, hell); gr.addColorStop(1, dunkel);
      g.fillStyle = gr; g.fillRect(x - bw / 2, 0, bw, wb);
      g.fillStyle = dunkel; g.fillRect(x - bw * .7, wb - u * 2, bw * 1.4, u * 2); g.fillRect(x - bw * .7, h * .07, bw * 1.4, u * 1.6);
      g.fillStyle = "rgba(0,0,0,.18)"; for (let k = -1; k <= 1; k++) g.fillRect(x + k * bw * .25 - u * .15, h * .07, u * .3, wb - h * .07);
    };
    L.banner = (x, yy, bw, bh, farbe, zeichenFarbe) => {
      g.fillStyle = "#3a2a14"; g.fillRect(x - bw * .62, yy - u * .6, bw * 1.24, u * .8);
      g.fillStyle = L.verlauf(yy, yy + bh, [farbe, rgba(farbe, .75)]);
      g.beginPath(); g.moveTo(x - bw / 2, yy); g.lineTo(x + bw / 2, yy); g.lineTo(x + bw / 2, yy + bh); g.lineTo(x, yy + bh - bw * .35); g.lineTo(x - bw / 2, yy + bh); g.closePath(); g.fill();
      g.strokeStyle = "#c9a040"; g.lineWidth = u * .35; g.stroke();
      g.fillStyle = zeichenFarbe || "#c9a040"; g.beginPath(); g.arc(x, yy + bh * .4, bw * .22, 0, TAU); g.fill();
      g.fillStyle = farbe; g.beginPath(); g.arc(x, yy + bh * .4, bw * .12, 0, TAU); g.fill();
    };
    L.girlande = (y0, durch, farben) => {
      const n = Math.max(8, Math.round(w / (u * 5)));
      g.strokeStyle = "#2a2014"; g.lineWidth = u * .25; g.beginPath(); g.moveTo(0, y0); g.quadraticCurveTo(w / 2, y0 + durch * 2, w, y0); g.stroke();
      for (let i = 0; i < n; i++) {
        const t0 = (i + .5) / n, x = t0 * w, yy = y0 + durch * 4 * t0 * (1 - t0);
        g.fillStyle = farben[i % farben.length]; g.beginPath(); g.moveTo(x - u * 1.5, yy); g.lineTo(x + u * 1.5, yy); g.lineTo(x, yy + u * 3); g.fill();
      }
    };
    L.lichterkette = (y0, durch, farbe) => {
      g.strokeStyle = "#1a140e"; g.lineWidth = u * .2; g.beginPath(); g.moveTo(0, y0); g.quadraticCurveTo(w / 2, y0 + durch * 2, w, y0); g.stroke();
      const n = Math.max(6, Math.round(w / (u * 9)));
      for (let i = 0; i < n; i++) {
        const t0 = (i + .5) / n, x = t0 * w, yy = y0 + durch * 4 * t0 * (1 - t0);
        g.fillStyle = farbe; g.beginPath(); g.arc(x, yy + u * .8, u * .65, 0, TAU); g.fill();
        if (i % 2 === 0 && s.lichter.length < 12) s.lichter.push({ x, y: yy + u, r: u * 5, farbe, f: R() * TAU, schwing: -1 });
      }
    };
    L.kronleuchter = (x, yy, gr) => {
      const b = gr * u;
      g.strokeStyle = "#2a2014"; g.lineWidth = u * .3; g.beginPath(); g.moveTo(x, 0); g.lineTo(x, yy - b); g.stroke();
      g.strokeStyle = "#8a6a30"; g.lineWidth = u * .6; g.beginPath(); g.ellipse(x, yy, b * 4, b * .9, 0, 0, TAU); g.stroke();
      g.beginPath(); g.moveTo(x, yy - b); g.lineTo(x, yy + b * 1.3); g.stroke();
      g.fillStyle = "rgba(255,240,200,.45)"; for (let i = 0; i < 10; i++) { const a = i / 10 * TAU; g.beginPath(); g.arc(x + Math.cos(a) * b * 3.6, yy + b * (1.1 + R()), u * .28, 0, TAU); g.fill(); }
      for (let i = 0; i < 6; i++) { const a = i / 6 * TAU, cx = x + Math.cos(a) * b * 4, cy = yy + Math.sin(a) * b * .9; g.fillStyle = "#e6d9bb"; g.fillRect(cx - b * .18, cy - b, b * .36, b); s.flammen.push({ x: cx, y: cy - b, b: b * .75, f: R() * TAU }); }
      s.lichter.push({ x, y: yy, r: b * 15, farbe: "#ffd58a", f: R() * TAU, schwing: -1 });
    };
    L.huegel = (basis, hoehe, farbe) => {
      g.fillStyle = farbe; g.beginPath(); g.moveTo(0, wb);
      const a = R() * 6, b2 = R() * 6;
      for (let x = 0; x <= w; x += u * 2) g.lineTo(x, basis - hoehe * (.5 + .3 * Math.sin(x / w * 5 + a) + .2 * Math.sin(x / w * 11 + b2)));
      g.lineTo(w, wb); g.closePath(); g.fill();
    };
    L.baum = (x, gr, farbe, krone) => {
      const b = gr * u, fuss = wb + u;
      g.fillStyle = farbe; g.fillRect(x - b * .8, fuss - b * 12, b * 1.6, b * 12);
      g.beginPath(); for (let k = 0; k < 6; k++) g.arc(x + (R() - .5) * b * 7, fuss - b * (13 + R() * 6), b * (3 + R() * 2.5), 0, TAU); g.fillStyle = krone || farbe; g.fill();
    };
    L.stalaktiten = farbe => { g.fillStyle = farbe; for (let x = -R() * u * 4; x < w; x += u * (3 + R() * 5)) { const l = u * (2 + R() * 7); g.beginPath(); g.moveTo(x, 0); g.lineTo(x + u * 1.6, l); g.lineTo(x + u * 3.2, 0); g.fill(); } };
    L.netz = (x, yy, bw, bh) => {
      g.strokeStyle = "rgba(170,150,110,.35)"; g.lineWidth = Math.max(1, u * .18);
      for (let k = 0; k <= 8; k++) { g.beginPath(); g.moveTo(x + bw * k / 8, yy); g.quadraticCurveTo(x + bw * k / 8 + u * 2, yy + bh * .6, x + bw * k / 8 * .8, yy + bh); g.stroke(); }
      for (let k = 1; k <= 5; k++) { g.beginPath(); g.moveTo(x, yy + bh * k / 6); g.quadraticCurveTo(x + bw / 2, yy + bh * k / 6 + u * 2.5, x + bw * .85, yy + bh * k / 6); g.stroke(); }
    };
    L.spinnweben = (x, yy, gr, sd) => {
      g.strokeStyle = "rgba(220,210,190,.14)"; g.lineWidth = Math.max(1, u * .15); const b = gr * u;
      for (let k = 0; k <= 4; k++) { const a = k / 4 * Math.PI / 2; g.beginPath(); g.moveTo(x, yy); g.lineTo(x + sd * Math.cos(a) * b, yy + Math.sin(a) * b); g.stroke(); }
      for (let r = .3; r <= 1; r += .23) { g.beginPath(); for (let k = 0; k <= 4; k++) { const a = k / 4 * Math.PI / 2; g.lineTo(x + sd * Math.cos(a) * b * r, yy + Math.sin(a) * b * r); } g.stroke(); }
    };
    L.boden = (a, b, art) => {
      g.fillStyle = L.verlauf(wb, y, [a, b]); g.fillRect(0, wb, w, y - wb + 1);
      const fx = w / 2, fy = wb - h * .9, unten = x => fx + (x - fx) * ((y - fy) / (wb - fy));
      if (art === "marmor") {
        g.strokeStyle = "rgba(255,240,215,.08)"; g.lineWidth = Math.max(1, u * .2);
        for (let i = -14; i <= 14; i++) { const xt = fx + i * w / 14; g.beginPath(); g.moveTo(xt, wb); g.lineTo(unten(xt), y); g.stroke(); }
        for (let k = 1; k < 6; k++) { const ly = wb + (y - wb) * Math.pow(k / 6, 1.5); g.beginPath(); g.moveTo(0, ly); g.lineTo(w, ly); g.stroke(); }
        leuchten(g, "#fff0d0", w / 2, wb + (y - wb) * .5, w * .4, .12);
      } else if (art === "stein") {
        g.strokeStyle = "rgba(0,0,0,.35)"; g.lineWidth = Math.max(1, u * .25);
        for (let k = 1; k < 5; k++) { const ly = wb + (y - wb) * Math.pow(k / 5, 1.4); g.beginPath(); g.moveTo(0, ly); g.lineTo(w, ly); g.stroke();
          for (let x = R() * u * 8; x < w; x += u * (6 + R() * 6) * (.5 + k / 5)) { g.beginPath(); g.moveTo(x, ly); g.lineTo(x, ly - (y - wb) / 5 * (k / 5 + .2)); g.stroke(); } }
      } else if (art === "gras") {
        g.strokeStyle = "rgba(120,150,70,.35)"; g.lineWidth = Math.max(1, u * .2);
        for (let i = 0; i < w / u * 2; i++) { const x = R() * w, yy = wb + R() * (y - wb), l = u * (.6 + (yy - wb) / (y - wb) * 1.4); g.beginPath(); g.moveTo(x, yy); g.lineTo(x + (R() - .5) * l, yy - l); g.stroke(); }
      } else if (art === "wolke") {
        for (let i = 0; i < 26; i++) { leuchten(g, aus(R, ["#f0d8a0", "#e0b0a0", "#fff0d0"]), R() * w, wb + R() * (y - wb), u * (6 + R() * 10), .18); }
      } else {
        g.strokeStyle = "rgba(0,0,0,.38)"; g.lineWidth = Math.max(1, u * .22);
        for (let i = -16; i <= 16; i++) { const xt = fx + i * w / 12; g.beginPath(); g.moveTo(xt, wb); g.lineTo(unten(xt), y); g.stroke(); }
        g.fillStyle = "rgba(255,220,170,.04)"; for (let k = 0; k < 4; k++) g.fillRect(0, wb + (y - wb) * (.2 + k * .22), w, Math.max(1, u * .2));
      }
      g.fillStyle = L.verlauf(wb, wb + u * 3.5, ["rgba(0,0,0,.5)", "rgba(0,0,0,0)"]); g.fillRect(0, wb, w, u * 3.5);
    };
    L.kante = farbe => {
      g.fillStyle = farbe; g.fillRect(0, y, w, u * 1.4);
      g.fillStyle = L.verlauf(y + u * 1.4, h, ["#0d0a0f", "#050407"]); g.fillRect(0, y + u * 1.4, w, h - y);
    };
    L.pelmet = farbe => {
      const ph = Math.max(u * 3, h * .045);
      g.fillStyle = L.verlauf(0, ph, [farbe, rgba(farbe, .85)]);
      g.beginPath(); g.moveTo(0, 0); g.lineTo(w, 0); g.lineTo(w, ph * .7);
      const n = Math.max(6, Math.round(w / (u * 9)));
      for (let i = n; i >= 0; i--) { const x = w * i / n; g.quadraticCurveTo(x + w / n / 2, ph * 1.15, x, ph * .7); }
      g.closePath(); g.fill();
      g.fillStyle = "#c9a040"; for (let i = 0; i <= n; i++) { g.beginPath(); g.arc(w * i / n, ph * .74, u * .45, 0, TAU); g.fill(); }
    };
    return L;
  }
  function laterneMalen(g, x, yy, gr, farbe, u) {
    const b = gr * u;
    g.strokeStyle = "#1a120c"; g.lineWidth = Math.max(1, u * .25); g.beginPath(); g.moveTo(x, yy - b * 2.4); g.lineTo(x, yy - b * 1); g.stroke();
    g.fillStyle = "#1a120c"; g.beginPath(); g.moveTo(x - b * .85, yy - b * .6); g.lineTo(x, yy - b * 1.15); g.lineTo(x + b * .85, yy - b * .6); g.fill();
    g.fillStyle = farbe; g.fillRect(x - b * .55, yy - b * .6, b * 1.1, b * 1.3);
    g.fillStyle = "rgba(255,246,214,.75)"; g.fillRect(x - b * .25, yy - b * .35, b * .5, b * .8);
    g.strokeStyle = "#1a120c"; g.lineWidth = Math.max(1, u * .3); g.strokeRect(x - b * .55, yy - b * .6, b * 1.1, b * 1.3);
    g.fillStyle = "#1a120c"; g.fillRect(x - b * .7, yy + b * .7, b * 1.4, b * .3);
  }

  /* ---------- Die zwölf Bühnen ----------
     licht/spot: Farbauswahl fürs Licht; wetter: was vor dem Fenster sein kann; leute: Hüte & Köpfe im Publikum;
     besonders: ein besonderer Gast vorn; gefaess: was bei guter Stimmung hochgehalten wird; schlecht/gut: was geworfen wird;
     teilchen: was in der Luft schwebt; vorhang: Farbe der Vorhänge. */
  const KULISSEN = [
    { /* 0 „Zum Lahmen Esel“ */ licht: ["#ffb35a", "#ffc46e", "#ff9e4a"], wetter: ["mond", "sterne", "regen", "nebel"], vorhang: "#6a2c1a",
      leute: ["stroh", "stroh", "kappe", "haube", "glatze", "kopftuch"], besonders: "hund", gefaess: "krug", anteil: .7, schlecht: ["tomate", "tomate", "kohl"], gut: "blume", teilchen: "staub",
      malen(L, v) {
        const { g, w, h, u, wb, R, s } = L;
        L.wand("#40291a", "#2c1c10", "#1e140b"); L.bretter("rgba(0,0,0,.26)", 7);
        v.daecher = true;
        const fw = Math.min(w * .24, u * 24), fx = v.links ? w * .1 : w * .9 - fw;
        L.fenster(fx, wb * .22, fw, fw * .72, "#1c120a"); v.daecher = false;
        L.balken(h * .05, 3, "#22150c");
        L.pfosten(v.links ? w * .06 : w * .94, 2.6, "#26180e");
        L.regal(v.links ? w * .6 : w * .12, wb * .3, Math.min(w * .3, u * 26));
        /* Wirtshausschild */
        const sx = w * (v.links ? .44 : .5), sy = wb * .12;
        g.fillStyle = "#3a2414"; g.fillRect(sx - u * 9, sy, u * 18, u * 5); g.strokeStyle = "#1a100a"; g.lineWidth = u * .5; g.strokeRect(sx - u * 9, sy, u * 18, u * 5);
        g.fillStyle = "#c9a060"; g.font = "italic " + Math.round(u * 2.3) + "px Georgia, serif"; g.textAlign = "center"; g.textBaseline = "middle";
        g.fillText(sprache() === "en" ? "The Lame Donkey" : "Zum Lahmen Esel", sx, sy + u * 2.6); g.textBaseline = "alphabetic";
        for (let i = 0; i < v.laternen; i++) L.laterne(w * (.25 + i * .5 + (R() - .5) * .1), h * .05 + u * 9, 1.6, "#ffb85a");
        const fx1 = v.links ? w * .82 : w * .14, oben = L.fass(fx1, 1.3); L.fass(fx1 + u * 7 * (v.links ? 1 : -1), 1.1);
        if (v.gast === "katze") katzeMalen(g, fx1, oben, u);
        if (v.gast === "kerze") L.kerze(fx1, oben, 1.1);
      } },
    { boden: ["#2a2218", "#18140e"], /* 1 „Zur Ersoffenen Ratte“ */ licht: ["#d8b05a", "#c89a48", "#e0b860"], wetter: ["nebel", "regen", "nebel"], vorhang: "#3a2a1c",
      leute: ["kopftuch", "kapuze", "glatze", "kopftuch", "dreispitz", "kapuze"], besonders: "bugbear", gefaess: "krug", anteil: .55, schlecht: ["tomate", "hering", "hering"], gut: "muenze", teilchen: "staub",
      malen(L, v) {
        const { g, w, h, u, wb, R, s } = L;
        L.steine(["#2f2d25", "#29271f", "#33301f", "#25231c", "#2c2a22"], "#15140f");
        g.fillStyle = L.verlauf(0, wb, ["rgba(0,0,0,.35)", "rgba(0,0,0,0)", "rgba(0,0,0,.4)"]); g.fillRect(0, 0, w, wb);
        L.balken(h * .1, 3.4, "#20150c");
        /* Messer im Balken – Kritik, konstruktiv */
        const mx = w * (.3 + R() * .4); g.fillStyle = "#cfc6b0"; g.beginPath(); g.moveTo(mx, h * .1 + u * 1.5); g.lineTo(mx + u * 4, h * .1 - u * 1.6); g.lineTo(mx + u * 4.6, h * .1 - u * .9); g.fill();
        g.fillStyle = "#2a1a0e"; g.fillRect(mx + u * 4, h * .1 - u * 2.6, u * 1.2, u * 1.6);
        L.netz(v.links ? 0 : w * .62, h * .1 + u * 3.4, w * .38, wb * .45);
        L.gitterfenster(v.links ? w * .7 : w * .1, wb * .32, Math.min(w * .18, u * 16), Math.min(w * .12, u * 10), "#121008");
        /* Steckbrief */
        const px = w * (v.links ? .48 : .5); g.fillStyle = "#b8a87e"; g.fillRect(px, wb * .5, u * 5, u * 6.5); g.fillStyle = "#3a2a1a"; g.beginPath(); g.arc(px + u * 2.5, wb * .5 + u * 2.6, u * 1.3, 0, TAU); g.fill(); g.fillRect(px + u, wb * .5 + u * 4.6, u * 3, u * .5);
        const k = L.kiste(w * (v.links ? .2 : .8), 1.2); L.kerze(w * (v.links ? .2 : .8), k, 1.1, "#e0b050");
        L.fass(w * (v.links ? .88 : .1), 1.2);
        if (v.gast === "ratte") ratteMalen(g, w * (v.links ? .3 : .7), L.fb + u * .6, u);
        L.spinnweben(0, 0, 9, 1); L.spinnweben(w, 0, 7, -1);
      } },
    { boden: ["#4a2e1c", "#22150c"], /* 2 „Zum Seemannsgarn“ */ licht: ["#ffb35a", "#ffc878", "#f0a050"], wetter: ["meer"], vorhang: "#5a1e16",
      leute: ["kappe", "kappe", "kopftuch", "dreispitz", "glatze", "kappe"], besonders: "kapitaen", gefaess: "krug", anteil: .75, schlecht: ["hering", "tomate", "hering"], gut: "muenze", teilchen: "staub",
      malen(L, v) {
        const { g, w, h, u, wb, R, s } = L;
        L.wand("#3c2416", "#2a180e", "#1a0f08"); L.bretter("rgba(0,0,0,.2)", 4.5);
        /* Spanten wie in einem Schiffsrumpf */
        g.strokeStyle = "#1c110a"; g.lineWidth = u * 2.2; for (let x = w * .05; x < w; x += w / 5) { g.beginPath(); g.moveTo(x, wb); g.quadraticCurveTo(x - u * 3, wb * .4, x + u * 4, 0); g.stroke(); }
        const n = w > u * 80 ? 3 : 2, r = Math.min(u * 6.5, w * .08);
        for (let i = 0; i < n; i++) L.rundfenster(w * (i + .5) / n + (R() - .5) * u * 4, wb * .42, r, "#5a4020", "meer");
        /* Steuerrad */
        const rx = w * (v.links ? .16 : .84), ry = wb * .16 + u * 6; g.strokeStyle = "#5a3a1c"; g.lineWidth = u * .9;
        g.beginPath(); g.arc(rx, ry, u * 4.5, 0, TAU); g.stroke(); g.beginPath(); g.arc(rx, ry, u * 1.2, 0, TAU); g.stroke();
        for (let k = 0; k < 8; k++) { const a = k / 8 * TAU; g.beginPath(); g.moveTo(rx + Math.cos(a) * u * 1.2, ry + Math.sin(a) * u * 1.2); g.lineTo(rx + Math.cos(a) * u * 6, ry + Math.sin(a) * u * 6); g.stroke(); }
        /* Anker */
        const ax = w * (v.links ? .84 : .16), ay = wb * .2; g.strokeStyle = "#2a2420"; g.lineWidth = u * .9;
        g.beginPath(); g.moveTo(ax, ay); g.lineTo(ax, ay + u * 10); g.moveTo(ax - u * 3, ay + u * 2); g.lineTo(ax + u * 3, ay + u * 2); g.moveTo(ax - u * 4, ay + u * 7); g.quadraticCurveTo(ax, ay + u * 12, ax + u * 4, ay + u * 7); g.stroke(); g.beginPath(); g.arc(ax, ay - u, u, 0, TAU); g.stroke();
        L.girlande(h * .04, u * 2, ["#7a2a20", "#c9a040", "#2a4a3a", "#e8dcc0"]);
        for (let i = 0; i < v.laternen; i++) L.laterne(w * (.2 + i * .3 + R() * .08), h * .05 + u * 10, 1.5, "#ffb85a", true);
        L.fass(w * (v.links ? .66 : .34), 1.1);
        if (v.gast === "papagei") papageiMalen(g, w * (v.links ? .66 : .34), L.fb + u - 1.1 * u * 6.5, u);
      } },
    { boden: ["#3a2418", "#1e130c"], /* 3 „Zum Silbernen Krug“ */ licht: ["#ffd08a", "#ffc070", "#ffe0a0"], wetter: ["mond", "sterne", "regen"], vorhang: "#6a1e22",
      leute: ["zylinder", "dutt", "haube", "zylinder", "glatze", "federhut"], besonders: "monokel", gefaess: "kelch", anteil: .45, schlecht: ["tomate", "broetchen"], gut: "rose", teilchen: "staub",
      malen(L, v) {
        const { g, w, h, u, wb, R, s } = L;
        L.wand("#3e2a24", "#30201a", "#24170f");
        g.fillStyle = "rgba(120,70,50,.18)"; for (let yy = u * 3; yy < wb * .62; yy += u * 5) for (let x = (yy / u / 5 % 2) * u * 3; x < w; x += u * 6) { g.beginPath(); g.ellipse(x, yy, u * .9, u * 1.5, 0, 0, TAU); g.fill(); }
        const ty = wb * .62; g.fillStyle = "#2a1a10"; g.fillRect(0, ty, w, wb - ty); g.fillStyle = "#3a2616"; g.fillRect(0, ty, w, u * 1.2);
        g.strokeStyle = "rgba(0,0,0,.4)"; g.lineWidth = u * .4; for (let x = u * 3; x < w; x += u * 10) g.strokeRect(x, ty + u * 2.5, u * 7.5, wb - ty - u * 4.5);
        const fw = Math.min(w * .18, u * 16), fx = v.links ? w * .08 : w * .92 - fw;
        L.fenster(fx, wb * .14, fw, fw * 1.1, "#1a100a");
        g.fillStyle = "#5a1a1e"; g.beginPath(); g.moveTo(fx - u * 3, wb * .1); g.quadraticCurveTo(fx + u, wb * .35, fx - u * 2, ty); g.lineTo(fx - u * 4, ty); g.lineTo(fx - u * 4, wb * .1); g.fill();
        g.beginPath(); g.moveTo(fx + fw + u * 3, wb * .1); g.quadraticCurveTo(fx + fw - u, wb * .35, fx + fw + u * 2, ty); g.lineTo(fx + fw + u * 4, ty); g.lineTo(fx + fw + u * 4, wb * .1); g.fill();
        const bx = v.links ? w * .58 : w * .26; L.bild(bx, wb * .18, u * 10, u * 8); if (w > u * 70) L.bild(bx + u * 15 * (v.links ? 1 : -1) + (v.links ? 0 : -u * 4), wb * .24, u * 7, u * 9);
        L.kronleuchter(w * (.45 + R() * .1), h * .13, 1.4);
        [.3, .7].forEach(k => { const x = w * k; g.fillStyle = "#7a5a24"; g.fillRect(x - u * .8, ty - u * 5, u * 1.6, u * .6); L.kerze(x, ty - u * 5, .9, "#ffc870"); });
        if (v.gast === "maus") mausMalen(g, w * (v.links ? .2 : .8), L.fb + u * .5, u);
      } },
    { /* 4 Erntefest beim Bürgermeister */ licht: ["#ffc46e", "#ffb050", "#ffd890"], wetter: ["abend", "daemmerung", "nacht"], vorhang: "#7a3a14",
      leute: ["stroh", "stroh", "haube", "zylinder", "kappe", "glatze", "blumen"], besonders: "buergermeister", gefaess: "krug", anteil: .65, schlecht: ["tomate", "tomate", "kohl"], gut: "muenze", teilchen: "blaetter",
      malen(L, v) {
        const { g, w, h, u, wb, R, s } = L, zeit = v.wetter;
        L.wand(...(zeit === "abend" ? ["#d8864a", "#a0505a", "#4a2440"] : zeit === "daemmerung" ? ["#a85a6a", "#5a2a4a", "#22122c"] : ["#1e1230", "#140b20", "#0a0710"]));
        if (zeit === "nacht") { L.sterne(0, 0, w, wb * .7, .1); L.mond(w * (v.links ? .78 : .22), wb * .2, u * 3.4); }
        else leuchten(g, zeit === "abend" ? "#ffd080" : "#ff9a7a", w * (v.links ? .75 : .25), wb * .95, u * 30, .7);
        L.huegel(wb, wb * .22, zeit === "nacht" ? "#0e0a10" : "#2a1824");
        L.huegel(wb, wb * .12, zeit === "nacht" ? "#0a070b" : "#1c1018");
        L.baum(w * (v.links ? .08 : .92), 1.6, "#120c0e"); if (w > u * 70) L.baum(w * (v.links ? .3 : .7), 1.1, "#140e10");
        /* Rahmen der Festbühne */
        g.fillStyle = "#2a1a0e"; g.fillRect(u * 2, 0, u * 2.4, wb); g.fillRect(w - u * 4.4, 0, u * 2.4, wb);
        L.girlande(h * .06, u * 3, ["#b8402a", "#d8a030", "#6a7a2a", "#e8dcc0"]);
        L.lichterkette(h * .15, u * 4, "#ffd27a");
        /* Erntegaben am Bühnenrand */
        const ballen = (x, gr) => { const b = gr * u, fuss = L.fb + u; g.fillStyle = "#8a6a2a"; g.fillRect(x - b * 4, fuss - b * 3.6, b * 8, b * 3.6); g.strokeStyle = "rgba(60,40,10,.6)"; g.lineWidth = u * .3; for (let k = 1; k < 6; k++) { g.beginPath(); g.moveTo(x - b * 4, fuss - b * 3.6 * k / 6); g.lineTo(x + b * 4, fuss - b * 3.6 * k / 6); g.stroke(); } return fuss - b * 3.6; };
        const kuerbis = (x, fuss, gr) => { const b = gr * u; g.fillStyle = "#c8641e"; g.beginPath(); g.ellipse(x, fuss - b * 1.4, b * 2, b * 1.4, 0, 0, TAU); g.fill(); g.strokeStyle = "rgba(90,30,0,.6)"; g.lineWidth = u * .25; g.beginPath(); g.ellipse(x, fuss - b * 1.4, b * .8, b * 1.4, 0, 0, TAU); g.stroke(); g.fillStyle = "#3a5a1a"; g.fillRect(x - b * .2, fuss - b * 3.1, b * .4, b * .6); };
        const o1 = ballen(w * (v.links ? .85 : .15), 1.2); kuerbis(w * (v.links ? .85 : .15), o1, 1); kuerbis(w * (v.links ? .72 : .28), L.fb + u, 1.2);
        if (w > u * 60) kuerbis(w * (v.links ? .76 : .24), L.fb + u, .8);
        /* Banner des Bürgermeisters */
        const bx = w * .5; g.fillStyle = "#6a2a14"; g.fillRect(bx - u * 11, h * .2, u * 22, u * 4.4); g.strokeStyle = "#c9a040"; g.lineWidth = u * .4; g.strokeRect(bx - u * 11, h * .2, u * 22, u * 4.4);
        g.fillStyle = "#e8d090"; g.font = Math.round(u * 2.4) + "px Georgia, serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(sprache() === "en" ? "Harvest Festival" : "Erntefest", bx, h * .2 + u * 2.3); g.textBaseline = "alphabetic";
        if (v.gast === "kraehe") kraeheMalen(g, w * (v.links ? .08 : .92) + u * 2, wb + u - 1.6 * u * 12, u);
      } },
    { boden: ["#3a3028", "#241c16", "marmor"], /* 5 Der Ball des Landgrafen */ licht: ["#ffe0a0", "#ffd080", "#fff0c0"], wetter: ["mond", "sterne"], vorhang: "#7a1a28",
      leute: ["peruecke", "federhut", "dutt", "peruecke", "zylinder", "krone"], gefaess: "kelch", anteil: .5, schlecht: ["tomate", "broetchen"], gut: "rose", teilchen: "glitzer",
      malen(L, v) {
        const { g, w, h, u, wb, R, s } = L;
        L.wand("#4a3a2a", "#36291e", "#251c14");
        const n = Math.max(3, Math.round(w / (u * 24))), feld = w / n;
        for (let i = 0; i < n; i++) {
          const x = feld * (i + .5), bw = Math.min(feld * .5, u * 12);
          L.bogenfenster(x - bw / 2, wb * .14, bw, wb * .64, "#5a4428");
          g.fillStyle = "#6a1a24"; g.beginPath(); g.moveTo(x - bw / 2 - u * 2, wb * .08); g.quadraticCurveTo(x, wb * .2, x + bw / 2 + u * 2, wb * .08); g.lineTo(x + bw / 2 + u * 2, wb * .05); g.lineTo(x - bw / 2 - u * 2, wb * .05); g.fill();
        }
        for (let i = 0; i <= n; i++) L.saeule(feld * i, u * 3.5, "#8a7658", "#3a2e20");
        L.kronleuchter(w * .3, h * .1, 1.3); L.kronleuchter(w * .7, h * .1, 1.3);
        for (let i = 0; i < v.paare; i++) s_paar(L, w * (.15 + .7 * (i + .5) / v.paare + (R() - .5) * .05));
      } },
    { boden: ["#2a1822", "#140a10", "stein"], /* 6 Schloss Nachtfels */ licht: ["#ff9a8a", "#e0a0c0", "#ffb070"], wetter: ["mond", "mond", "nebel"], vorhang: "#4a0e1a", ruhigeKerzen: true,
      leute: ["kragen", "kragen", "peruecke", "dutt", "kapuze"], besonders: "fuerst", gefaess: "kelch", anteil: .55, schlecht: ["tomate"], gut: "rose", teilchen: "fledermaus",
      malen(L, v) {
        const { g, w, h, u, wb, R, s } = L;
        L.steine(["#2a1626", "#24121f", "#2e1a2a", "#221020"], "#120810");
        g.fillStyle = L.verlauf(0, wb, ["rgba(10,4,10,.5)", "rgba(10,4,10,.1)", "rgba(10,4,10,.5)"]); g.fillRect(0, 0, w, wb);
        const fw = Math.min(w * .3, u * 26), fx = w * .5 - fw / 2;
        L.bogenfenster(fx, wb * .2, fw, wb * .72, "#1a0e16", v.wetter, true);
        [[fx - u * 6, -1], [fx + fw + u * 6, 1]].forEach(([x, sd]) => { g.fillStyle = "#5a0e1e"; g.beginPath(); g.moveTo(x, 0); g.quadraticCurveTo(x + sd * u * 8, wb * .45, x - sd * u * 1, wb); g.lineTo(x - sd * u * 7, wb); g.lineTo(x - sd * u * 7, 0); g.fill(); g.fillStyle = "rgba(0,0,0,.3)"; for (let k = 1; k < 4; k++) g.fillRect(x - sd * u * k * 1.7, 0, u * .5, wb); });
        /* Spiegel ohne Spiegelbild */
        const sx = w * (v.links ? .13 : .87); g.fillStyle = "#6a6a62"; g.beginPath(); g.ellipse(sx, wb * .42, u * 5, u * 7.5, 0, 0, TAU); g.fill(); g.fillStyle = "#1c1a20"; g.beginPath(); g.ellipse(sx, wb * .42, u * 4, u * 6.5, 0, 0, TAU); g.fill();
        g.fillStyle = "rgba(255,255,255,.06)"; g.beginPath(); g.ellipse(sx - u, wb * .38, u * 1.2, u * 4, .3, 0, TAU); g.fill();
        L.bild(w * (v.links ? .8 : .14), wb * .25, u * 7, u * 9);
        L.leuchter(w * (v.links ? .3 : .7), 1.2); if (w > u * 70) L.leuchter(w * (v.links ? .9 : .1), 1);
        L.spinnweben(0, 0, 11, 1); L.spinnweben(w, 0, 9, -1);
      } },
    { boden: ["#2a2420", "#18140f", "stein"], /* 7 Die Feste von König Horga */ licht: ["#ff9a4a", "#ffb060", "#ff8a40"], wetter: ["klar"], vorhang: "#4a2a14",
      leute: ["helm", "helm", "helm", "glatze", "kapuze", "helm"], besonders: "koenig", gefaess: "horn", anteil: .7, schlecht: ["tomate", "stein"], gut: "muenze", teilchen: "funken",
      malen(L, v) {
        const { g, w, h, u, wb, R, s } = L;
        L.wand("#2c241e", "#1e1814", "#130f0c");
        for (let i = 0; i < 40; i++) { g.fillStyle = "rgba(0,0,0," + (.1 + R() * .2) + ")"; g.beginPath(); g.ellipse(R() * w, R() * wb, u * (2 + R() * 6), u * (1 + R() * 3), R() * 3, 0, TAU); g.fill(); }
        /* Schmiede-Esse hinten */
        const ex = w * (v.links ? .3 : .7), eb = Math.min(w * .22, u * 18);
        g.fillStyle = "#0c0806"; g.beginPath(); g.moveTo(ex - eb / 2, wb); g.lineTo(ex - eb / 2, wb * .55); g.arc(ex, wb * .55, eb / 2, Math.PI, 0); g.lineTo(ex + eb / 2, wb); g.fill();
        const eg = g.createRadialGradient(ex, wb, 0, ex, wb, eb * .9); eg.addColorStop(0, "rgba(255,170,70,.9)"); eg.addColorStop(.5, "rgba(220,80,20,.45)"); eg.addColorStop(1, "rgba(120,30,0,0)");
        g.fillStyle = eg; g.beginPath(); g.moveTo(ex - eb / 2, wb); g.lineTo(ex - eb / 2, wb * .55); g.arc(ex, wb * .55, eb / 2, Math.PI, 0); g.lineTo(ex + eb / 2, wb); g.fill();
        s_esse(L, ex, wb, eb);
        /* Amboss */
        const ax = w * (v.links ? .55 : .45); g.fillStyle = "#1a1614"; g.beginPath(); g.moveTo(ax - u * 5, L.fb - u * 4); g.lineTo(ax + u * 4, L.fb - u * 4); g.quadraticCurveTo(ax + u * 7, L.fb - u * 4, ax + u * 6.5, L.fb - u * 3); g.lineTo(ax + u * 2, L.fb - u * 2.6); g.lineTo(ax + u * 2, L.fb + u * .5); g.lineTo(ax - u * 3, L.fb + u * .5); g.lineTo(ax - u * 3, L.fb - u * 2.6); g.lineTo(ax - u * 5, L.fb - u * 3); g.fill();
        /* Säulen mit Runen */
        [.06, .94].concat(w > u * 80 ? [v.links ? .8 : .2] : []).forEach(k => { L.saeule(w * k, u * 7, "#4a4038", "#1e1a16"); for (let r = 0; r < 4; r++) s.runen.push({ x: w * k, y: wb * (.22 + r * .17), gr: u * 1.6, z: Math.floor(R() * 6), f: R() * TAU }); });
        /* Wappen: gekreuzte Hämmer */
        const wx = w * .5, wy = wb * .18; g.fillStyle = "#3a2c1e"; g.beginPath(); g.moveTo(wx - u * 5, wy - u * 4); g.lineTo(wx + u * 5, wy - u * 4); g.lineTo(wx + u * 5, wy + u * 2); g.quadraticCurveTo(wx, wy + u * 7, wx - u * 5, wy + u * 2); g.closePath(); g.fill(); g.strokeStyle = "#a07a30"; g.lineWidth = u * .5; g.stroke();
        g.strokeStyle = "#c9a040"; g.lineWidth = u * .8; g.beginPath(); g.moveTo(wx - u * 3, wy + u * 3); g.lineTo(wx + u * 3, wy - u * 3); g.moveTo(wx + u * 3, wy + u * 3); g.lineTo(wx - u * 3, wy - u * 3); g.stroke();
        g.fillStyle = "#c9a040"; g.fillRect(wx + u * 2, wy - u * 4, u * 2.4, u * 1.6); g.fillRect(wx - u * 4.4, wy - u * 4, u * 2.4, u * 1.6);
        L.stalaktiten("#0e0b09");
        s.lichter.push({ x: ex, y: wb * .8, r: eb * 1.6, farbe: "#ff8a3a", f: R() * TAU, schwing: -1 });
        L.kerze(w * (v.links ? .9 : .1), L.fb, 1, "#ff9a4a");
      } },
    { boden: ["#6a6052", "#3a342c", "marmor"], /* 8 Der Palast von Neverwinter */ licht: ["#fff0c0", "#ffe0a0", "#ffd890"], wetter: ["sterne", "mond"], vorhang: "#8a1a1e",
      leute: ["krone", "federhut", "helm", "peruecke", "dutt", "zylinder"], gefaess: "kelch", anteil: .45, schlecht: ["tomate"], gut: "rose", teilchen: "staub",
      malen(L, v) {
        const { g, w, h, u, wb, R, s } = L;
        L.wand("#5a5046", "#463e36", "#2e2924");
        /* hohe Fenster mit Lichtbahnen */
        const n = Math.max(2, Math.round(w / (u * 30)));
        for (let i = 0; i < n; i++) { const x = w * (i + .5) / n, bw = u * 7; L.bogenfenster(x - bw / 2, h * .08, bw, wb * .32, "#3a3228", "sterne"); s.strahlen.push({ x, y: h * .08 + wb * .2, bw, f: R() * TAU }); }
        const sn = Math.max(4, Math.round(w / (u * 15)));
        for (let i = 0; i <= sn; i++) { const x = w * i / sn; L.saeule(x, u * 5, "#cfc4b0", "#6a6052"); if (i < sn) L.banner(x + w / sn / 2, wb * .5, u * 5, wb * .38, i % 2 ? "#8a1a1e" : "#6a1420"); }
        /* Balkon mit Trompetern */
        g.fillStyle = "#3a332c"; g.fillRect(0, wb * .44, w, u * 1.6);
        for (let x = w * .08; x < w; x += w * (.2 + R() * .1)) { g.fillStyle = "#1a1612"; g.beginPath(); g.arc(x, wb * .44 - u * 3.4, u * 1.2, 0, TAU); g.fill(); g.fillRect(x - u * 1.2, wb * .44 - u * 2.2, u * 2.4, u * 2.2); g.strokeStyle = "#c9a040"; g.lineWidth = u * .5; g.beginPath(); g.moveTo(x + u, wb * .44 - u * 3.2); g.lineTo(x + u * 4.5, wb * .44 - u * 4.2); g.stroke(); g.fillStyle = "#c9a040"; g.beginPath(); g.moveTo(x + u * 4.5, wb * .44 - u * 4.2); g.lineTo(x + u * 5.6, wb * .44 - u * 5.4); g.lineTo(x + u * 5.8, wb * .44 - u * 3.6); g.fill(); }
      } },
    { boden: ["#1a2414", "#0e140a", "gras"], /* 9 Der Hof der Feenkönigin */ licht: ["#f0e0a0", "#e8c0e0", "#d0f0a0"], wetter: ["mond"], vorhang: "#2a4a22",
      leute: ["elfe", "elfe", "blumen", "elfe", "blumen"], besonders: "feenkoenigin", gefaess: "blume", anteil: .6, schlecht: ["eichel", "pilz"], gut: "blume", teilchen: "gluehwuermchen",
      malen(L, v) {
        const { g, w, h, u, wb, R, s } = L;
        L.wand("#1e1428", "#161822", "#0e1410");
        L.sterne(0, 0, w, wb * .6, .08);
        L.mond(w * (v.links ? .72 : .28), wb * .28, u * 6);
        for (let i = 0; i < 5; i++) L.baum(w * (i / 4) + (R() - .5) * u * 6, 1.3 + R() * .8, "#120e12", "#0e140c");
        g.fillStyle = "#0b100a"; for (let x = -u * 4; x < w + u * 4; x += u * (4 + R() * 4)) { g.beginPath(); g.arc(x, -u * 2, u * (5 + R() * 5), 0, TAU); g.fill(); }
        /* Ranken mit leuchtenden Blüten */
        for (let i = 0; i < Math.round(w / (u * 12)); i++) {
          const x = R() * w, l = wb * (.15 + R() * .35); g.strokeStyle = "#162a14"; g.lineWidth = u * .35; g.beginPath(); g.moveTo(x, 0); g.quadraticCurveTo(x + u * 3, l / 2, x, l); g.stroke();
          const fa = aus(R, ["#f0a0d0", "#f0e090", "#c0f0b0"]); g.fillStyle = fa; g.beginPath(); g.arc(x, l, u * .7, 0, TAU); g.fill();
          if (s.lichter.length < 10) s.lichter.push({ x, y: l, r: u * 4, farbe: fa, f: R() * TAU, schwing: -1 });
        }
        /* Steinkreis */
        [.15, .32, .68, .85].forEach(k => { g.fillStyle = "#2a2a26"; g.beginPath(); g.moveTo(w * k - u * 2, wb + u); g.lineTo(w * k - u * 1.6, wb - u * 6); g.quadraticCurveTo(w * k, wb - u * 7.5, w * k + u * 1.6, wb - u * 6); g.lineTo(w * k + u * 2, wb + u); g.fill(); });
        /* Leuchtpilze */
        for (let i = 0; i < 6; i++) { const x = R() * w, yy = L.fb + R() * u * 4, b = u * (.8 + R() * .7), fa = aus(R, ["#e0a0f0", "#b0f0a0", "#f0d080"]);
          g.fillStyle = "#d8d0c0"; g.fillRect(x - b * .25, yy - b * 1.4, b * .5, b * 1.4); g.fillStyle = fa; g.beginPath(); g.ellipse(x, yy - b * 1.4, b * 1.2, b * .7, 0, Math.PI, 0); g.fill();
          if (s.lichter.length < 12) s.lichter.push({ x, y: yy - b, r: b * 5, farbe: fa, f: R() * TAU, schwing: -1 }); }
      } },
    { boden: ["#3a2a20", "#140c10", "wolke"], /* 10 Die Hallen des Ewigen Liedes */ licht: ["#ffe6b0", "#ffd0e0", "#fff0c8"], wetter: ["sterne"], vorhang: "#8a6a2a",
      leute: ["halo", "halo", "halo", "krone", "halo"], gefaess: null, anteil: 0, schlecht: ["tomate"], gut: "stern", teilchen: "glitzer",
      malen(L, v) {
        const { g, w, h, u, wb, R, s } = L;
        L.wand("#140a1c", "#20102a", "#0c0712");
        for (let i = 0; i < 7; i++) leuchten(g, aus(R, ["#a04080", "#c09040", "#c06a8a", "#8a3a6a"]), R() * w, R() * wb * .8, u * (14 + R() * 18), .22);
        L.sterne(0, 0, w, wb, .22);
        /* goldener Bogen */
        g.strokeStyle = "rgba(230,190,110,.55)"; g.lineWidth = u * 1.4; g.beginPath(); g.arc(w / 2, wb, Math.min(w * .42, wb * .85), Math.PI, 0); g.stroke();
        g.strokeStyle = "rgba(230,190,110,.25)"; g.lineWidth = u * .5; g.beginPath(); g.arc(w / 2, wb, Math.min(w * .42, wb * .85) - u * 2.5, Math.PI, 0); g.stroke();
        /* schwebende Säulen */
        [[.1, -.08], [.9, .1], [v.links ? .26 : .74, .05]].forEach(([k, kipp]) => { g.save(); g.translate(w * k, wb * .55); g.rotate(kipp); const sh = wb * .45; const gr = g.createLinearGradient(-u * 2.5, 0, u * 2.5, 0); gr.addColorStop(0, "#6a5a44"); gr.addColorStop(.4, "#e8dcc0"); gr.addColorStop(1, "#6a5a44"); g.fillStyle = gr; g.fillRect(-u * 2.5, -sh / 2, u * 5, sh); g.fillStyle = "#cfc0a0"; g.fillRect(-u * 3.4, -sh / 2 - u * 1.2, u * 6.8, u * 1.4); g.beginPath(); g.moveTo(-u * 2.5, sh / 2); g.lineTo(-u, sh / 2 + u * 2); g.lineTo(u * .5, sh / 2 + u * .6); g.lineTo(u * 2.5, sh / 2 + u * 1.8); g.lineTo(u * 2.5, sh / 2); g.fill(); g.restore(); });
        s.strahlen.push({ x: w / 2, y: 0, bw: u * 16, f: 0, oben: true });
      } },
    { boden: ["#2a1008", "#140604", "stein"], /* 11 Themberchauds Halle */ licht: ["#ff7a3a", "#ff9a4a", "#ff6a2a"], wetter: ["klar"], vorhang: "#5a1208",
      leute: ["hoerner", "hoerner", "glatze", "kapuze", "helm", "hoerner"], besonders: "gartokkar", gefaess: "horn", anteil: .5, schlecht: ["tomate"], gut: "muenze", teilchen: "asche",
      malen(L, v) {
        const { g, w, h, u, wb, R, s } = L;
        L.wand("#2a0e0a", "#1a0806", "#0c0403");
        for (let i = 0; i < 30; i++) { g.fillStyle = "rgba(0,0,0," + (.15 + R() * .25) + ")"; g.beginPath(); g.ellipse(R() * w, R() * wb, u * (3 + R() * 7), u * (1.5 + R() * 3), R() * 3, 0, TAU); g.fill(); }
        L.stalaktiten("#0a0302");
        /* Lavaströme */
        [[0, w * .22], [w * .8, w * .2]].forEach(([x, bw]) => { const ly = wb - u * 2.5; g.fillStyle = L.verlauf(ly, wb, ["#ffb040", "#c03a10"]); g.beginPath(); g.moveTo(x, wb); g.quadraticCurveTo(x + bw * .5, ly - u * 2, x + bw, wb); g.fill(); s.lava.push({ x: x + bw / 2, y: wb, r: bw * .8 }); });
        /* Der Drache auf seinem Goldberg */
        const dx = w * (v.links ? .25 : .75), D = Math.min(wb * .72, w * .32), sd = v.links ? 1 : -1;
        const kx = dx + sd * D * .15, ky = wb - D * 1.05;
        leuchten(g, "#ff5a1a", dx, wb - D * .5, D * 1.3, .45);
        /* Flügel, eingefaltet */
        g.fillStyle = "#2a0a08"; g.beginPath(); g.moveTo(dx - sd * D * .2, wb - D * .45); g.lineTo(dx - sd * D * .75, wb - D * 1.1); g.lineTo(dx - sd * D * .7, wb - D * .8); g.lineTo(dx - sd * D * .95, wb - D * .85); g.lineTo(dx - sd * D * .8, wb - D * .55); g.lineTo(dx - sd * D, wb - D * .5); g.lineTo(dx - sd * D * .6, wb - D * .3); g.fill();
        g.strokeStyle = "rgba(255,110,50,.4)"; g.lineWidth = Math.max(1, u * .3); g.stroke();
        g.fillStyle = "#300c09"; g.beginPath(); g.ellipse(dx + sd * -D * .1, wb - D * .18, D * .9, D * .45, 0, Math.PI, 0); g.fill();
        g.strokeStyle = "rgba(255,110,50,.45)"; g.lineWidth = Math.max(1, u * .35); g.stroke();
        g.strokeStyle = "#360e0a"; g.lineWidth = D * .2; g.lineCap = "round"; g.beginPath(); g.moveTo(dx + sd * -D * .3, wb - D * .4); g.quadraticCurveTo(dx + sd * -D * .55, wb - D * 1.0, dx + sd * D * .05, wb - D * 1.05); g.stroke();
        g.strokeStyle = "rgba(255,120,60,.35)"; g.lineWidth = Math.max(1, u * .35); g.beginPath(); g.moveTo(dx + sd * -D * .4, wb - D * .4); g.quadraticCurveTo(dx + sd * -D * .67, wb - D * 1.06, dx + sd * D * .02, wb - D * 1.16); g.stroke(); g.lineCap = "butt";
        g.fillStyle = "#3e100c"; g.beginPath(); g.moveTo(kx - sd * D * .14, ky - D * .1); g.quadraticCurveTo(kx + sd * D * .2, ky - D * .18, kx + sd * D * .45, ky + D * .02); g.lineTo(kx + sd * D * .44, ky + D * .1); g.quadraticCurveTo(kx + sd * D * .15, ky + D * .16, kx - sd * D * .12, ky + D * .12); g.closePath(); g.fill();
        g.strokeStyle = "rgba(255,130,70,.6)"; g.lineWidth = Math.max(1, u * .35); g.stroke();
        g.fillStyle = "#5a3a2a"; g.beginPath(); g.moveTo(kx - sd * D * .08, ky - D * .08); g.quadraticCurveTo(kx - sd * D * .3, ky - D * .3, kx - sd * D * .35, ky - D * .36); g.quadraticCurveTo(kx - sd * D * .22, ky - D * .18, kx - sd * D * .02, ky - D * .14); g.fill();
        g.beginPath(); g.moveTo(kx + sd * D * .02, ky - D * .12); g.quadraticCurveTo(kx - sd * D * .1, ky - D * .34, kx - sd * D * .14, ky - D * .4); g.quadraticCurveTo(kx - sd * D * .02, ky - D * .22, kx + sd * D * .08, ky - D * .14); g.fill();
        g.strokeStyle = "rgba(255,110,50,.45)"; g.lineWidth = Math.max(1, u * .3); g.beginPath(); g.moveTo(kx - sd * D * .12, ky + D * .12); g.quadraticCurveTo(kx + sd * D * .15, ky + D * .16, kx + sd * D * .44, ky + D * .1); g.stroke();
        s.drache = { ax: kx + sd * D * .12, ay: ky - D * .06, nx: kx + sd * D * .44, ny: ky + D * .03, D, sd };
        /* Gold */
        const gx = dx - sd * D * .05; g.fillStyle = L.verlauf(wb - D * .35, wb, ["#d8a840", "#7a5214"]); g.beginPath(); g.moveTo(gx - D * .95, wb + u); g.quadraticCurveTo(gx - D * .3, wb - D * .42, gx, wb - D * .38); g.quadraticCurveTo(gx + D * .4, wb - D * .4, gx + D, wb + u); g.fill();
        for (let i = 0; i < 40; i++) { const t0 = R(), x = gx - D * .9 + t0 * D * 1.8, top = wb - D * .38 * Math.sin(t0 * Math.PI); g.fillStyle = R() < .5 ? "#ffe08a" : "#b88a2a"; g.beginPath(); g.ellipse(x, top + R() * (wb - top), u * .7, u * .4, 0, 0, TAU); g.fill(); }
        g.fillStyle = "#c8b890"; const tx = w * (v.links ? .82 : .18); g.beginPath(); g.arc(tx, L.fb - u, u * 1.5, 0, TAU); g.fill(); g.fillStyle = "#140604"; g.fillRect(tx - u * .8, L.fb - u * 1.4, u * .5, u * .5); g.fillRect(tx + u * .3, L.fb - u * 1.4, u * .5, u * .5);
        s.lichter.push({ x: w * .1, y: wb, r: w * .3, farbe: "#ff6a20", f: 1, schwing: -1 }); s.lichter.push({ x: w * .9, y: wb, r: w * .3, farbe: "#ff6a20", f: 2, schwing: -1 });
      } }
  ];
  const KULISSE_FREI = { leicht: 0, mittel: 7, schwer: 11 };
  /* tanzende Paare (Ball) und Funken der Esse (Horga) werden pro Bild gemalt – hier nur merken */
  function s_paar(L, x) { L.s.paare.push({ x, y: L.wb + (L.y - L.wb) * .08, gr: L.u * 1.15, f: L.R() * TAU }); }
  function s_esse(L, x, y, b) { L.s.esse = { x, y, b }; }
  /* kleine Gäste */
  function katzeMalen(g, x, y, u) { g.fillStyle = "#0c0808"; g.beginPath(); g.ellipse(x, y - u * 1.4, u * 2, u * 1.5, 0, 0, TAU); g.fill(); g.beginPath(); g.arc(x - u * 1.4, y - u * 3, u * 1.1, 0, TAU); g.fill(); g.beginPath(); g.moveTo(x - u * 2.3, y - u * 3.6); g.lineTo(x - u * 2.1, y - u * 4.6); g.lineTo(x - u * 1.6, y - u * 3.8); g.moveTo(x - u * 1.1, y - u * 3.9); g.lineTo(x - u * .7, y - u * 4.7); g.lineTo(x - u * .5, y - u * 3.6); g.fill(); g.strokeStyle = "#0c0808"; g.lineWidth = u * .5; g.beginPath(); g.moveTo(x + u * 1.8, y - u); g.quadraticCurveTo(x + u * 3.5, y - u * .5, x + u * 3, y + u * 1.5); g.stroke(); g.fillStyle = "#c8d060"; g.fillRect(x - u * 1.9, y - u * 3.2, u * .35, u * .3); g.fillRect(x - u * 1.1, y - u * 3.2, u * .35, u * .3); }
  function ratteMalen(g, x, y, u) { g.fillStyle = "#0e0c0a"; g.beginPath(); g.ellipse(x, y - u * .6, u * 1.4, u * .7, 0, 0, TAU); g.fill(); g.beginPath(); g.moveTo(x - u * 1.2, y - u); g.lineTo(x - u * 2.4, y - u * .4); g.lineTo(x - u * 1.2, y - u * .2); g.fill(); g.strokeStyle = "#0e0c0a"; g.lineWidth = u * .2; g.beginPath(); g.moveTo(x + u * 1.3, y - u * .5); g.quadraticCurveTo(x + u * 3, y - u * .2, x + u * 3.4, y - u * 1.2); g.stroke(); g.fillStyle = "#d0a060"; g.fillRect(x - u * 1.8, y - u * .85, u * .25, u * .25); }
  function papageiMalen(g, x, y, u) { g.fillStyle = "#a83020"; g.beginPath(); g.ellipse(x, y - u * 1.8, u * .9, u * 1.6, -.2, 0, TAU); g.fill(); g.fillStyle = "#3a7a2a"; g.beginPath(); g.ellipse(x + u * .5, y - u * 1.4, u * .5, u * 1.3, .3, 0, TAU); g.fill(); g.fillStyle = "#c9a040"; g.beginPath(); g.moveTo(x - u * .9, y - u * 3); g.lineTo(x - u * 1.6, y - u * 2.6); g.lineTo(x - u * .8, y - u * 2.5); g.fill(); g.fillStyle = "#3a8a3a"; g.fillRect(x + u * .2, y - u * .4, u * .4, u * 1.4); }
  function mausMalen(g, x, y, u) { g.fillStyle = "#1a1612"; g.beginPath(); g.ellipse(x, y - u * .5, u * .9, u * .5, 0, 0, TAU); g.fill(); g.beginPath(); g.arc(x - u * .8, y - u * .9, u * .35, 0, TAU); g.fill(); g.strokeStyle = "#1a1612"; g.lineWidth = u * .15; g.beginPath(); g.moveTo(x + u * .9, y - u * .4); g.quadraticCurveTo(x + u * 2, y, x + u * 2.2, y - u * .8); g.stroke(); }
  function kraeheMalen(g, x, y, u) { g.fillStyle = "#0a080a"; g.beginPath(); g.ellipse(x, y - u, u * 1.4, u * .8, -.3, 0, TAU); g.fill(); g.beginPath(); g.arc(x - u * 1.2, y - u * 1.7, u * .55, 0, TAU); g.fill(); g.beginPath(); g.moveTo(x - u * 1.6, y - u * 1.8); g.lineTo(x - u * 2.5, y - u * 1.6); g.lineTo(x - u * 1.6, y - u * 1.5); g.fill(); g.beginPath(); g.moveTo(x + u * 1.2, y - u * .8); g.lineTo(x + u * 2.6, y - u * .3); g.lineTo(x + u * 1.2, y - u * .4); g.fill(); }

  /* ---------- Szene: Zustand der Bühne ---------- */
  let szene = null;
  const BAND = [ { wer: "echo", x: .31, p: .14, serie: 8 }, { wer: "friedrich", x: .69, p: .32, serie: 16 }, { wer: "ezekiel", x: .13, p: .52, serie: 26 }, { wer: "rex", x: .87, p: .7, serie: 36 } ];
  const FEUER_AB = [12, 25, 40];
  const jetztS = () => performance.now() / 1000;
  function szeneKey() { return modus === "weg" && !duell ? wegStation : KULISSE_FREI[stufe] || 0; }
  function szeneNeu(neu) {
    const k = szeneKey();
    if (szene && szene.k === k && !neu) return szene;
    const seed = (Math.random() * 4294967296) >>> 0, R = zufallsGen(seed), K = KULISSEN[k];
    const v = { licht: aus(R, K.licht), wetter: aus(R, K.wetter), links: R() < .5, laternen: 1 + Math.floor(R() * 2), paare: 2 + Math.floor(R() * 3),
      gast: R() < .4 ? aus(R, { 0: ["katze", "kerze"], 1: ["ratte"], 2: ["papagei"], 3: ["maus"], 4: ["kraehe"] }[k] || [""]) : "", hell: .8 + R() * .4, spot: aus(R, ["#ffd890", "#ffc0a0", "#fff0d0", "#ffd0e0"]) };
    szene = { k, K, seed, v, bg: null, bgSchluessel: "", leute: null, band: { barradin: { an: -9 } }, stimmung: .5, st: .5, jubel: 0, teilchen: [], wuerfe: [], flecken: [], flammenT: [], rauch: [],
      feuer: 0, vorhang: .34, vorhangZiel: .34, meldung: null, gespielt: false, zeit: jetztS(), letzt: 0, heul: 0, drachenWut: 0 };
    szene.teilchenTyp = k === 4 && v.wetter === "nacht" ? "gluehwuermchen" : K.teilchen;
    BAND.forEach(b => { szene.band[b.wer] = { an: null }; });
    return szene;
  }
  /* für einen neuen Auftritt: nur Barradin auf der Bühne, Stimmung in der Mitte, Vorhang auf */
  function szeneAuftritt() {
    if (!szene || szene.gespielt || szene.k !== szeneKey()) szeneNeu(true);
    const s = szene; s.gespielt = true;
    BAND.forEach(b => { s.band[b.wer].an = null; }); s.band.barradin.an = -9;
    s.stimmung = s.st = .5; s.jubel = 0; s.wuerfe = []; s.flecken = []; s.flammenT = []; s.rauch = []; s.feuer = 0; s.meldung = null; s.vorhangZiel = 0; s.heul = 0; s.ende = null;
  }
  function hintergrund(w, h) {
    const s = szene, schl = w + "x" + h + sprache();
    if (s.bg && s.bgSchluessel === schl) return s.bg;
    const c = s.bg || document.createElement("canvas"); c.width = w; c.height = h; s.bgSchluessel = schl; s.bg = c;
    s.lichter = []; s.flammen = []; s.schwingen = []; s.funkeln = []; s.regen = []; s.wellen = []; s.runen = []; s.strahlen = []; s.lava = []; s.paare = []; s.drache = null; s.esse = null; s.bodenFertig = false;
    s.Rb = zufallsGen(s.seed ^ 0x5bd1e995);
    const g = c.getContext("2d"), L = werkzeug(g, w, h, s);
    g.clearRect(0, 0, w, h);
    L.boden(...(s.K.boden || ["#4a3020", "#24170e"]));
    s.K.malen(L, s.v);
    /* große, ruhige Lichter und den Lichtkegel gleich ins Bild malen – pro Bild flackern nur die kleinen */
    g.globalCompositeOperation = "lighter";
    s.lichter = s.lichter.filter(l => { if (l.r <= L.u * 20 || l.schwing >= 0) return true; leuchten(g, l.farbe, l.x, l.y, l.r, .28 * s.v.hell); return false; });
    const bx = w / 2, sp = g.createLinearGradient(0, 0, 0, L.y); sp.addColorStop(0, rgba(s.v.spot, 0)); sp.addColorStop(1, rgba(s.v.spot, .09 * s.v.hell));
    g.fillStyle = sp; g.beginPath(); g.moveTo(bx - L.u * 3, 0); g.lineTo(bx + L.u * 3, 0); g.lineTo(bx + L.u * 13, L.y - L.u * 2); g.lineTo(bx - L.u * 13, L.y - L.u * 2); g.fill();
    g.globalCompositeOperation = "source-over";
    L.pelmet(s.K.vorhang);
    L.kante("#1e140c");
    s.leute = leuteErzeugen(s, w, h);
    return c;
  }
  function leuteErzeugen(s, w, h) {
    const R = zufallsGen(s.seed ^ 0x2545f491), K = s.K, u = Math.min(w / 100, h / 70), y = h * .82, band = h - y;
    const leute = [], r0 = Math.max(4, Math.min(band * .2, u * 3.3));
    [[.36, .92, .8], [.82, .9, 1.06]].forEach(([fy, dichte, gr], reihe) => {
      const r = r0 * gr, schritt = r * (reihe ? 2.9 : 2.5);
      for (let x = -R() * schritt * .5; x < w + schritt * .5; x += schritt * (.8 + R() * .45)) {
        if (R() > dichte) continue;
        leute.push({ x, y: y + band * fy + (R() - .5) * r * .4, r: r * (.86 + R() * .28), typ: aus(R, K.leute), reihe, f: R() * TAU, schwelle: .4 + R() * .45,
          gefaess: K.gefaess && R() < K.anteil ? K.gefaess : null, arm: 0, sd: R() < .5 ? -1 : 1, ton: R() });
      }
    });
    if (K.besonders) { const vorn = leute.filter(p => p.reihe === 1); const p = vorn[Math.floor(vorn.length * (.25 + R() * .5))]; if (p) { p.typ = K.besonders; p.besonders = true; if (p.typ === "hund") p.gefaess = null; else p.r *= 1.15; } }
    return leute;
  }

  /* ---------- Ereignisse aus dem Spiel ---------- */
  function szeneTreffer(art, serie, spur) {
    const s = szene; if (!s) return;
    s.stimmung = klemme(s.stimmung + (art === "perfekt" ? .045 : art === "gut" ? .03 : .012), 0, 1);
    if (serie && serie % 10 === 0) { s.jubel = Math.min(1.4, s.jubel + .7); const n = 2 + Math.min(4, serie / 10); for (let i = 0; i < n; i++) werfen(s.K.gut, null, i * .12); }
  }
  function szenePatzer(spur) {
    const s = szene; if (!s) return;
    s.stimmung = klemme(s.stimmung - .075, 0, 1);
    if (s.feuer >= 1) { s.feuer = 0; rauchPuff(); if (ctx && bus) rauschen(ctx.currentTime, "highpass", 2600, .05, .45); }
    if (Math.random() < .2 + (1 - s.stimmung) * .55) werfen(aus(Math.random, s.K.schlecht), null, 0, spur);
    if (s.drache) s.drachenWut = s.zeit;
  }
  function szeneSchluss(gut) {
    const s = szene; if (!s) return;
    s.ende = { gut, t: s.zeit };
    s.stimmung = gut ? 1 : .05; s.jubel = gut ? 1.5 : 0;
    const n = gut ? 9 : 7;
    for (let i = 0; i < n; i++) werfen(gut ? s.K.gut : aus(Math.random, s.K.schlecht), null, .15 + i * .14 + Math.random() * .1);
    if (!gut && s.drache) s.drachenWut = s.zeit + .4;
  }
  /* geworfen wird in normierten Koordinaten (0–1), damit es Größenwechsel übersteht */
  function werfen(art, von, verz, spur) {
    const s = szene; if (!s || !s.leute || !s.leute.length || reduziert() || s.wuerfe.length > 16) return;
    const W = s.bg ? s.bg.width : 1, Hh = s.bg ? s.bg.height : 1;
    const p = von || s.leute[Math.floor(Math.random() * s.leute.length)];
    const gut = art === s.K.gut;
    const zx = spur != null ? (spur + .2 + Math.random() * .6) / 3 : .12 + Math.random() * .76;
    const zy = gut ? .72 + Math.random() * .08 : .62 + Math.random() * .16;
    s.wuerfe.push({ art, x0: p.x / W, y0: (p.y - p.r) / Hh, x1: zx, y1: zy, t0: s.zeit + (verz || 0), dauer: .75 + Math.random() * .35, rot: Math.random() * TAU, dreh: (Math.random() - .5) * 12, werfer: p });
    p.wurf = s.zeit + (verz || 0);
  }
  function rauchPuff() {
    const s = szene; if (!s || reduziert()) return;
    for (let i = 0; i < 14; i++) s.rauch.push({ x: Math.random(), y: .8, vx: (Math.random() - .5) * .04, vy: -.05 - Math.random() * .08, t: 0, max: 1.2 + Math.random() * .8, r: .03 + Math.random() * .03 });
  }
  function meldungZeigen(text) { if (szene) szene.meldung = { text, t: szene.zeit }; }
  /* während des Lieds: Band kommt dazu, Feuer je nach Serie */
  function szeneFortschritt(p, serie) {
    const s = szene; if (!s) return;
    const frei = !s.meldung || s.zeit - s.meldung.t > 1.6;
    for (const b of BAND) { const m = s.band[b.wer]; if (m.an == null && (p >= b.p || serie >= b.serie)) { if (!frei) break; m.an = s.zeit; meldungZeigen(t().band[b.wer]); break; } }
    let f = 0; FEUER_AB.forEach((x, i) => { if (serie >= x) f = i + 1; });
    if (f > s.feuer) { s.feuer = f; if (frei || f > 1) meldungZeigen(t().feuer[f - 1]); if (ctx && bus) rauschen(ctx.currentTime, "lowpass", 700, .1, .6); if (f >= 2) s.heul = s.zeit; }
    else if (f < s.feuer) s.feuer = f;
  }

  /* ---------- Malen pro Bild ---------- */
  function teilchenPflegen(s, dt, typ) {
    const T = s.teilchen, ziel = { staub: 18, funken: 22, asche: 26, gluehwuermchen: 16, blaetter: 9, glitzer: 14, fledermaus: 4 }[typ] || 0;
    const neu = () => {
      switch (typ) {
        case "funken": case "asche": return { x: Math.random(), y: .6 + Math.random() * .25, vx: (Math.random() - .5) * .02, vy: -.05 - Math.random() * .1, t: 0, max: 2 + Math.random() * 3 };
        case "blaetter": return { x: Math.random(), y: -.05, vx: .01 + Math.random() * .02, vy: .04 + Math.random() * .04, t: 0, max: 30, rot: Math.random() * TAU, f: Math.random() * TAU, fa: aus(Math.random, ["#c8641e", "#a8401a", "#d89a30", "#7a3a14"]) };
        case "fledermaus": return { x: Math.random() < .5 ? -.05 : 1.05, y: .05 + Math.random() * .3, vx: 0, vy: 0, t: 0, max: 30, f: Math.random() * TAU };
        default: return { x: .05 + Math.random() * .9, y: .05 + Math.random() * .7, vx: (Math.random() - .5) * .01, vy: (Math.random() - .5) * .01, t: 0, max: 3 + Math.random() * 5, f: Math.random() * TAU };
      }
    };
    while (T.length < ziel) { const n = neu(); n.t = Math.random() * n.max * .9; T.push(n); }
    for (let i = 0; i < T.length; i++) {
      const p = T[i]; p.t += dt;
      if (typ === "fledermaus") { if (!p.vx) p.vx = (p.x < 0 ? 1 : -1) * (.08 + Math.random() * .06); p.y += Math.sin(s.zeit * 1.5 + p.f) * .0015; }
      if (typ === "blaetter") p.vx = .015 + Math.sin(s.zeit * 1.3 + p.f) * .02;
      if (typ === "gluehwuermchen") { p.vx += (Math.random() - .5) * .02 * dt; p.vy += (Math.random() - .5) * .02 * dt; p.vx = klemme(p.vx, -.02, .02); p.vy = klemme(p.vy, -.02, .02); }
      p.x += p.vx * dt; p.y += p.vy * dt;
      if (p.t > p.max || p.y < -.1 || p.y > 1.05 || p.x < -.1 || p.x > 1.1) T[i] = neu();
    }
  }
  function teilchenMalen(g, s, w, h, u, typ) {
    for (const p of s.teilchen) {
      const x = p.x * w, y = p.y * h, leben = Math.min(1, p.t / .6, (p.max - p.t) / .8);
      switch (typ) {
        case "staub": g.fillStyle = "rgba(255,232,190," + (.25 * leben * (.6 + .4 * Math.sin(s.zeit * 2 + p.f))) + ")"; g.fillRect(x, y, u * .3, u * .3); break;
        case "funken": case "asche": leuchten(g, typ === "asche" ? "#ff5a20" : "#ffa040", x + Math.sin(s.zeit * 3 + p.f) * u, y, u * 1.3, .8 * leben); break;
        case "gluehwuermchen": leuchten(g, "#d8f080", x, y, u * 2, .9 * leben * (.5 + .5 * Math.sin(s.zeit * 3 + p.f))); break;
        case "glitzer": { const a = Math.max(0, Math.sin(s.zeit * 1.7 + p.f)) * leben, r = u * .9 * a; g.fillStyle = "rgba(255,240,200," + a + ")"; g.fillRect(x - r, y - u * .1, r * 2, u * .2); g.fillRect(x - u * .1, y - r, u * .2, r * 2); break; }
        case "blaetter": g.save(); g.translate(x, y); g.rotate(p.rot + s.zeit * 1.5); g.fillStyle = p.fa; g.beginPath(); g.ellipse(0, 0, u * .9, u * .45, 0, 0, TAU); g.fill(); g.restore(); break;
        case "fledermaus": { const fl = Math.sin(s.zeit * 14 + p.f), b = u * 1.6; g.fillStyle = "#0a0608"; g.beginPath(); g.moveTo(x - b, y - fl * b * .6); g.quadraticCurveTo(x - b * .4, y + b * .1, x, y); g.quadraticCurveTo(x + b * .4, y + b * .1, x + b, y - fl * b * .6); g.quadraticCurveTo(x, y + b * .5, x - b, y - fl * b * .6); g.fill(); break; }
      }
    }
  }
  /* hinter der Notenbahn: Kulisse, Lichter, Band */
  function buehneHinten(g, w, h, dpr, schlag) {
    const s = szene; if (!s || !(w > 0) || !(h > 0)) return; /* Karte versteckt: nichts zu malen */
    const zeit = jetztS(), ruhe = reduziert();
    s.dt = s.letzt ? klemme(zeit - s.letzt, 0, .1) : 0; s.letzt = zeit; s.zeit = zeit;
    const bg = hintergrund(w, h);
    if (spiel || kalib) { /* im Spiel: Hintergrund samt Spuren aus einem Stück */
      if (!s.bgBahn || s.bgBahn.width !== w || s.bgBahn.height !== h || s.bgBahnVon !== s.bgSchluessel) {
        const c = s.bgBahn || document.createElement("canvas"); c.width = w; c.height = h; const bg2 = c.getContext("2d");
        bg2.drawImage(bg, 0, 0); bahnenMalen(bg2, w, h, dpr, 1); s.bgBahn = c; s.bgBahnVon = s.bgSchluessel;
      }
      g.drawImage(s.bgBahn, 0, 0);
    } else g.drawImage(bg, 0, 0);
    const u = Math.min(w / 100, h / 70), wb = h * .6, y = h * .82, dt = ruhe ? 0 : s.dt, licht = s.v.licht;
    s.st += (s.stimmung - s.st) * Math.min(1, dt * 2.5); s.jubel *= Math.exp(-dt * 1.2);
    s.vorhang += (s.vorhangZiel - s.vorhang) * Math.min(1, (ruhe ? 1 : dt * 2.2));
    if (s.ende && zeit - s.ende.t > 2.2) s.vorhangZiel = .22;
    /* tanzende Paare im Ballsaal */
    s.paare.forEach(p => {
      const dreh = Math.cos(zeit * 1.4 + p.f + schlag * .2), x = p.x + Math.sin(zeit * .5 + p.f) * u * 3, b = p.gr;
      g.save(); g.translate(x, p.y); g.scale(Math.max(.25, Math.abs(dreh)), 1); g.fillStyle = "rgba(22,14,20,.8)";
      g.beginPath(); g.moveTo(-b * 2.6, 0); g.quadraticCurveTo(-b * 1.6, -b * 5, -b * .6, -b * 6); g.lineTo(-b * .2, 0); g.fill();
      g.beginPath(); g.arc(-b * 1.1, -b * 6.8, b * .8, 0, TAU); g.arc(b * 1.1, -b * 7.4, b * .8, 0, TAU); g.fill();
      g.fillRect(b * .4, -b * 6.4, b * 1.4, b * 6.4); g.restore();
    });
    /* Runen (Horga) und Esse */
    s.runen.forEach(r => { const a = .35 + .35 * Math.sin(zeit * 1.3 + r.f); g.strokeStyle = "rgba(255,150,60," + a + ")"; g.lineWidth = Math.max(1, u * .3); runeMalen(g, r.x, r.y, r.gr, r.z); });
    if (s.esse && !ruhe) leuchten(g, "#ff8a3a", s.esse.x, s.esse.y, s.esse.b * (1.1 + .1 * Math.sin(zeit * 5)), .35);
    /* Lava pulsiert */
    s.lava.forEach(l => leuchten(g, "#ff7a2a", l.x, l.y, l.r * (1 + .08 * Math.sin(zeit * 1.7 + l.x)), .45 + .15 * Math.sin(zeit * 2.3)));
    /* Lichtbahnen */
    g.globalCompositeOperation = "lighter";
    s.strahlen.forEach(st => {
      const a = (.05 + .03 * Math.sin(zeit * .7 + st.f)) * (st.oben ? 1.6 : 1);
      const gr = g.createLinearGradient(0, st.y, 0, y); gr.addColorStop(0, "rgba(255,240,200," + a + ")"); gr.addColorStop(1, "rgba(255,240,200,0)");
      g.fillStyle = gr; g.beginPath(); g.moveTo(st.x - st.bw / 2, st.y); g.lineTo(st.x + st.bw / 2, st.y); g.lineTo(st.x + st.bw * (st.oben ? 1.6 : 2.2), y); g.lineTo(st.x - st.bw * (st.oben ? 1.6 : .6), y); g.fill();
    });
    g.globalCompositeOperation = "source-over";
    /* Regen vor dem Fenster */
    if (!ruhe) s.regen.forEach(f => { g.save(); g.beginPath(); g.rect(f.x, f.y, f.bw, f.bh); g.clip(); g.strokeStyle = "rgba(220,220,210,.3)"; g.lineWidth = Math.max(1, u * .15); g.beginPath(); for (let i = 0; i < 14; i++) { const x = f.x + ((i * 37.7 + zeit * 40 * u * .1) % f.bw), yy = f.y + ((i * 53.3 + zeit * 260 * u * .1) % f.bh); g.moveTo(x, yy); g.lineTo(x - u * .4, yy + u * 2); } g.stroke(); g.restore(); });
    /* Sterne funkeln */
    s.funkeln.forEach(st => { const a = Math.max(0, Math.sin(zeit * 1.3 + st.f)); if (a > .05) { g.fillStyle = "rgba(255,242,215," + (a * .8) + ")"; g.fillRect(st.x - st.sz / 2, st.y, st.sz, Math.max(1, st.sz / 5)); g.fillRect(st.x, st.y - st.sz / 2, Math.max(1, st.sz / 5), st.sz); } });
    /* schwingende Laternen */
    s.schwingen.forEach(l => { const b = l.gr * u, wink = ruhe ? 0 : Math.sin(zeit * 1.2 + l.f) * .12; g.save(); g.translate(l.x, l.y - b * 2.4); g.rotate(wink); laterneMalen(g, 0, b * 2.4, l.gr, l.farbe, u); g.restore(); l.dx = Math.sin(wink) * b * 2.4; });
    /* Kerzenflammen */
    s.flammen.forEach(f => {
      const fl = s.K.ruhigeKerzen || ruhe ? 1 : 1 + .18 * Math.sin(zeit * 9 + f.f) + .1 * Math.sin(zeit * 17 + f.f * 2), fh = f.b * 1.1 * fl, fw = f.b * .32;
      g.fillStyle = "#ffcf6a"; g.beginPath(); g.moveTo(f.x, f.y - fh); g.quadraticCurveTo(f.x + fw, f.y - fh * .3, f.x, f.y); g.quadraticCurveTo(f.x - fw, f.y - fh * .3, f.x, f.y - fh); g.fill();
      g.fillStyle = "#fff4d0"; g.beginPath(); g.ellipse(f.x, f.y - fh * .3, fw * .35, fh * .25, 0, 0, TAU); g.fill();
    });
    /* Lichter (flackernd, je nach Stimmung etwas heller) */
    const hell = s.v.hell * (.75 + .4 * s.st);
    g.globalCompositeOperation = "lighter";
    s.lichter.forEach(l => {
      const fl = s.K.ruhigeKerzen || ruhe ? 1 : 1 + .14 * Math.sin(zeit * 7 + l.f) + .08 * Math.sin(zeit * 13.7 + l.f * 2);
      const dx = l.schwing >= 0 && s.schwingen[l.schwing] ? s.schwingen[l.schwing].dx || 0 : 0;
      leuchten(g, l.farbe, l.x + dx, l.y, l.r, .28 * fl * hell);
    });
    /* Spot auf Barradin */
    const bx = w / 2, puls = 1 + .08 * Math.sin(schlag * TAU);
    leuchten(g, s.v.spot, bx, y - u * 3, u * 16, .3 * hell * puls);
    g.globalCompositeOperation = "source-over";
    /* Drache: Augen glühen, ab und zu ein warnendes Rauchwölkchen */
    if (s.drache) {
      const d = s.drache, wut = Math.max(0, 1 - (zeit - s.drachenWut) / 2.5), blinz = (zeit % 7) < .15 ? .1 : 1;
      leuchten(g, "#ffb030", d.ax, d.ay, d.D * (.07 + .05 * wut), (.7 + .3 * Math.sin(zeit * 2)) * blinz);
      g.fillStyle = "rgba(255,220,120," + blinz + ")"; g.beginPath(); g.ellipse(d.ax, d.ay, d.D * .025, d.D * .012 * (1 + wut), 0, 0, TAU); g.fill();
      if (!ruhe && (wut > .5 || Math.sin(zeit * .9) > .995)) { for (let i = 0; i < 2; i++) s.rauch.push({ x: d.nx / w, y: d.ny / h, vx: d.sd * .02 + (Math.random() - .5) * .02, vy: -.04 - Math.random() * .03, t: 0, max: 1.6, r: .015 + Math.random() * .015 }); }
    }
    /* Schwebeteilchen */
    if (!ruhe) { teilchenPflegen(s, dt, s.teilchenTyp); teilchenMalen(g, s, w, h, u, s.teilchenTyp); }
    /* Flecken auf den Bühnenbrettern */
    s.flecken = s.flecken.filter(f => zeit - f.t < f.dauer);
    s.flecken.forEach(f => { const a = Math.min(1, (f.dauer - (zeit - f.t)) / 1); g.globalAlpha = a; fleckMalen(g, f.art, f.x * w, f.y * h, u * 1.4, f.rot); g.globalAlpha = 1; });
    /* Band */
    bandMalen(g, w, h, u, schlag, zeit, ruhe);
  }
  function runeMalen(g, x, y, r, z) {
    const F = [[[0, -1, 0, 1], [0, -1, .7, -.3]], [[-.6, -1, -.6, 1], [-.6, 0, .6, -1], [-.6, 0, .6, 1]], [[0, -1, 0, 1], [-.7, -.4, .7, .4]], [[-.6, 1, 0, -1], [0, -1, .6, 1], [-.3, .2, .3, .2]], [[0, -1, 0, 1], [0, -1, .6, -.5], [0, 0, .6, -.5]], [[-.6, -1, .6, 1], [.6, -1, -.6, 1]]][z % 6];
    g.beginPath(); F.forEach(([a, b, c, d]) => { g.moveTo(x + a * r, y + b * r); g.lineTo(x + c * r, y + d * r); }); g.stroke();
  }
  function bandMalen(g, w, h, u, schlag, zeit, ruhe) {
    const s = szene, fy = h * .79, H = Math.min(h * .24, w * .19, u * 26), laeuft = !!spiel;
    const e = (laeuft ? .45 + .55 * s.st : .25) + s.jubel * .4;
    const heul = s.feuer >= 2 || (zeit - s.heul < 2);
    const reihe = [["ezekiel", .13], ["echo", .31], ["friedrich", .69], ["rex", .87], ["barradin", .5]];
    reihe.forEach(([wer, fx]) => {
      const m = s.band[wer]; if (!m || m.an == null) return;
      const p = ruhe ? 1 : weich((zeit - m.an) / 1.1);
      let x = w * fx, yy = fy, a = 1;
      if (wer === "friedrich") x = w * 1.12 + (x - w * 1.12) * p;
      else if (wer === "rex") { x = -w * .1 + (x + w * .1) * p; yy -= Math.sin(p * Math.PI) * H * .5; }
      else if (wer === "echo") { yy -= (1 - p) * H * .8; a = p; }
      else if (wer === "ezekiel") a = p;
      if (wer === "ezekiel" && p < 1 && !ruhe) leuchten(g, "rauch", x, fy - H * .4, H * .9 * (1.4 - p), (1 - p) * 1.2);
      if (wer === "echo" && p < 1 && !ruhe) for (let i = 0; i < 4; i++) { g.fillStyle = "rgba(120,160,60," + (1 - p) + ")"; g.beginPath(); g.ellipse(x + Math.sin(zeit * 3 + i) * H * .3, yy - H * (.2 + i * .2), u * .8, u * .4, i, 0, TAU); g.fill(); }
      /* Schatten am Boden */
      g.fillStyle = "rgba(0,0,0,.35)"; g.beginPath(); g.ellipse(x, fy + u * .3, H * .2, H * .035, 0, 0, TAU); g.fill();
      if (wer !== "barradin") leuchten(g, s.v.licht, x, fy - H * .5, H * .7, .12 * a);
      figur(g, wer, x, yy, wer === "rex" ? H * .62 : H, { takt: laeuft ? schlag : zeit * 1.1, e, licht: s.v.licht, alpha: a, feuer: s.feuer, heul: wer === "rex" && heul && laeuft, zeit });
    });
  }
  function figur(g, wer, x, fy, H, z) {
    g.save(); g.translate(x, fy); g.scale(H / 100, H / 100); g.globalAlpha = z.alpha;
    const ph = z.takt * Math.PI, hops = Math.abs(Math.sin(ph)), dunkel = "#16101a", rand = rgba(z.licht, .55);
    const fuell = (fn, farbe) => { g.beginPath(); fn(); g.fillStyle = farbe || dunkel; g.fill(); };
    const kante = fn => { g.beginPath(); fn(); g.strokeStyle = rand; g.lineWidth = 1.5; g.stroke(); };
    const linie = (pts, breite, farbe) => { g.beginPath(); g.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 2) g.lineTo(pts[i], pts[i + 1]); g.lineWidth = breite; g.strokeStyle = farbe || dunkel; g.lineCap = "round"; g.lineJoin = "round"; g.stroke(); };
    if (wer === "barradin") {
      const strum = Math.sin(z.takt * TAU * 2) * (.4 + z.e);
      g.translate(0, -hops * 3 * z.e); g.rotate(Math.sin(ph) * .04 * z.e);
      fuell(() => { g.moveTo(-13, -73); g.quadraticCurveTo(-24, -40, -22 + Math.sin(ph) * 2, -14); g.lineTo(22 + Math.sin(ph) * 2, -14); g.quadraticCurveTo(24, -40, 13, -73); }, "#3e1410");
      linie([-6, -40, -8 - hops * 2 * z.e, -3], 6.5); linie([6, -40, 8, -3], 6.5);
      fuell(() => { g.ellipse(-9, -2, 5.5, 2.6, 0, 0, TAU); g.ellipse(9.5, -2, 5.5, 2.6, 0, 0, TAU); }, "#120c10");
      const rumpf = () => { g.moveTo(-13, -74); g.quadraticCurveTo(-16, -55, -14, -37); g.lineTo(14, -37); g.quadraticCurveTo(16, -55, 13, -74); g.closePath(); };
      fuell(rumpf, "#241820"); kante(rumpf);
      g.fillStyle = "#5a3e1a"; g.fillRect(-14, -46, 28, 3);
      fuell(() => { g.moveTo(-6.5, -86); g.lineTo(-17, -94); g.lineTo(-7, -80); g.closePath(); g.moveTo(6.5, -86); g.lineTo(17, -94); g.lineTo(7, -80); g.closePath(); }, "#2a1e1e");
      const kopf = () => g.arc(0, -83, 8, 0, TAU);
      fuell(kopf, "#2a1e1e"); kante(kopf);
      fuell(() => g.ellipse(0, -89.5, 14, 3.6, -.12, 0, TAU), "#2e1418");
      fuell(() => { g.moveTo(-8, -90); g.quadraticCurveTo(-5, -103, 7, -100); g.lineTo(9, -90); g.closePath(); }, "#3a161c");
      g.beginPath(); g.moveTo(5, -98); g.quadraticCurveTo(18, -110 + Math.sin(ph) * 1.5, 28, -105); g.strokeStyle = "#c4564a"; g.lineWidth = 2.6; g.lineCap = "round"; g.stroke();
      g.save(); g.translate(6, -54); g.rotate(.62);
      g.fillStyle = "#7a4e24"; g.beginPath(); g.ellipse(0, 0, 11, 8.5, 0, 0, TAU); g.fill(); g.strokeStyle = rgba(z.licht, .55); g.lineWidth = 1; g.stroke();
      g.fillStyle = "#1a1008"; g.beginPath(); g.arc(-2, 0, 2.6, 0, TAU); g.fill();
      g.fillStyle = "#4a2e14"; g.fillRect(-32, -1.6, 22, 3.2); g.save(); g.translate(-32, 0); g.rotate(.5); g.fillRect(-6, -1.8, 6, 3.6); g.restore();
      g.restore();
      linie([-12, -71, -17, -63, -21, -72], 5, "#241820");
      linie([12, -71, 17, -58, 7 + strum * 2.5, -52 - strum * 1.5], 5, "#241820");
      if (z.feuer >= 2) { /* Fackeln jonglieren */
        for (let k = 0; k < 3; k++) {
          const a = z.zeit * 3.2 + k * TAU / 3, tx = Math.cos(a) * 16, ty = -112 - Math.abs(Math.sin(a)) * 30;
          g.save(); g.translate(tx, ty); g.rotate(a * 2); g.fillStyle = "#3a2410"; g.fillRect(-1.2, -2, 2.4, 12); g.restore();
          g.globalCompositeOperation = "lighter"; leuchten(g, "flamme", tx, ty - 2, 9, .95); g.globalCompositeOperation = "source-over";
        }
      }
    } else if (wer === "echo") {
      g.translate(0, -hops * 2 * z.e); g.rotate(Math.sin(ph) * .05 * z.e);
      const robe = () => { g.moveTo(-12, -72); g.quadraticCurveTo(-19, -32, -18, 0); g.lineTo(18, 0); g.quadraticCurveTo(19, -32, 12, -72); g.closePath(); };
      const gr = g.createLinearGradient(0, -72, 0, 0); gr.addColorStop(0, "#b0a68e"); gr.addColorStop(1, "#4e483c");
      fuell(robe, gr); kante(robe);
      g.strokeStyle = "#4a5a2a"; g.lineWidth = 2; g.beginPath(); g.moveTo(-14, -44); g.quadraticCurveTo(0, -40, 14, -44); g.stroke();
      const kopf = () => g.arc(0, -80, 7.5, 0, TAU);
      fuell(kopf, "#2a1e1a"); kante(kopf);
      g.strokeStyle = "#8a7048"; g.lineWidth = 2.2; g.lineCap = "round"; g.beginPath();
      [-1, 1].forEach(sd => { g.moveTo(sd * 4, -86); g.quadraticCurveTo(sd * 9, -96, sd * 15, -104); g.moveTo(sd * 9, -95); g.lineTo(sd * 16, -94); g.moveTo(sd * 12, -100); g.lineTo(sd * 11, -109); g.moveTo(sd * 15, -104); g.lineTo(sd * 20, -107); });
      g.stroke();
      linie([4, -78, 28, -74], 2.4, "#b88a50");
      linie([-11, -70, -4, -66, 8, -77], 4.5, "#8e8672"); linie([11, -70, 18, -68, 19, -75.5], 4.5, "#8e8672");
      if (z.e > .4) { g.fillStyle = rgba("#f0dca0", .5 + .3 * Math.sin(z.zeit * 3)); g.font = "13px serif"; g.fillText("♪", 30, -82 - (z.zeit * 14) % 22); }
    } else if (wer === "friedrich") {
      g.translate(0, -hops * 2.2 * z.e);
      const haut = (((z.takt % 1) + 1) % 1) < .14;
      g.save(); g.translate(9, -76); g.rotate(.35); g.fillStyle = "#2e1e10"; g.fillRect(-3, -10, 6, 26); g.strokeStyle = "#9a8a64"; g.lineWidth = 1.3; g.beginPath(); [-2, 0, 2].forEach(k => { g.moveTo(k, -10); g.lineTo(k * 1.4, -17); }); g.stroke(); g.restore();
      fuell(() => { g.moveTo(-13, -74); g.quadraticCurveTo(-21, -40, -18, -16); g.lineTo(18, -16); g.quadraticCurveTo(21, -40, 13, -74); }, "#222616");
      linie([-6, -40, -7, -3], 6.5, "#1c1a14"); linie([6, -40, 7 + hops * 2 * z.e, -3], 6.5, "#1c1a14");
      fuell(() => { g.ellipse(-8, -2, 5.5, 2.6, 0, 0, TAU); g.ellipse(9, -2, 5.5, 2.6, 0, 0, TAU); }, "#120c10");
      const rumpf = () => { g.moveTo(-13, -74); g.quadraticCurveTo(-15, -55, -13, -38); g.lineTo(13, -38); g.quadraticCurveTo(15, -55, 13, -74); g.closePath(); };
      fuell(rumpf, "#1e2416"); kante(rumpf);
      fuell(() => g.ellipse(0, -74, 12, 4.5, 0, 0, TAU), "#2a2e1c");
      const kopf = () => g.arc(0, -83, 8, 0, TAU);
      fuell(kopf, "#2a1e1a"); kante(kopf);
      fuell(() => g.arc(0, -85, 8.4, Math.PI * 1.05, Math.PI * 1.95), "#3a2414");
      g.save(); g.translate(-15, -55); g.rotate(-.2); g.fillStyle = "#c0a070"; g.beginPath(); g.ellipse(0, 0, 11, 12, 0, 0, TAU); g.fill(); g.strokeStyle = "#3a2410"; g.lineWidth = 2.4; g.stroke();
      if (haut) { g.strokeStyle = rgba("#ffe0a0", .7); g.lineWidth = 1.2; g.beginPath(); g.arc(0, 0, 15, -.7, .7); g.stroke(); } g.restore();
      linie([-12, -71, -20, -60, -17, -50], 5, "#1e2416");
      const hx = haut ? -9 : 2, hy = haut ? -57 : -69;
      linie([12, -71, 15, -60, hx, hy], 5, "#1e2416"); linie([hx, hy, hx - 6, hy + (haut ? 2 : -6)], 2.2, "#d0b890");
    } else if (wer === "ezekiel") {
      const sw = Math.sin(z.takt * Math.PI * .5) * 5 * z.e; g.translate(sw, 0);
      const mantel = () => { g.moveTo(-11, -76); g.quadraticCurveTo(-22, -40, -21, -6); for (let k = 0; k < 6; k++) g.lineTo(-21 + (k + .5) * 7, k % 2 ? -1 : -7); g.lineTo(21, -6); g.quadraticCurveTo(22, -40, 11, -76); g.closePath(); };
      g.save(); g.translate(-sw * .9, 0); g.globalAlpha *= .3; fuell(mantel, "#4a1438"); g.restore();
      fuell(mantel, "#120c14"); kante(mantel);
      const kap = () => { g.moveTo(-10, -72); g.quadraticCurveTo(-12, -92, 0, -96); g.quadraticCurveTo(12, -92, 10, -72); g.closePath(); };
      fuell(kap, "#18101a"); kante(kap);
      g.fillStyle = "#4a302a"; [-1, 1].forEach(sd => { g.beginPath(); g.moveTo(sd * 6, -90); g.quadraticCurveTo(sd * 17, -94, sd * 14, -108); g.quadraticCurveTo(sd * 13, -97, sd * 4, -94); g.closePath(); g.fill(); });
      g.fillStyle = "#ff7a3a"; g.fillRect(-4.5, -84, 3, 1.6); g.fillRect(1.5, -84, 3, 1.6);
      g.globalCompositeOperation = "lighter"; leuchten(g, "#ff6a2a", 0, -83, 9, .5); g.globalCompositeOperation = "source-over";
      const gl = .5 + .5 * Math.sin(z.zeit * 2.3);
      linie([-12, -66, -16, -52], 4.5, "#120c14"); linie([12, -66, 16, -52], 4.5, "#120c14");
      g.strokeStyle = rgba("#ece2c8", .55 + .35 * gl); g.lineWidth = 1.8; g.beginPath(); g.moveTo(-16, -52); g.quadraticCurveTo(-26, -44, -34, -26); g.moveTo(16, -52); g.quadraticCurveTo(26, -44, 34, -26); g.stroke();
    } else if (wer === "rex") {
      g.translate(0, -hops * 6 * z.e);
      const wedel = Math.sin(z.zeit * 14);
      g.strokeStyle = "#4a3220"; g.lineWidth = 6; g.lineCap = "round"; g.beginPath(); g.moveTo(10, -14); g.quadraticCurveTo(24, -18, 26 + wedel * 6, -34); g.stroke();
      const koerper = () => g.ellipse(0, -24, 15, 22, 0, 0, TAU);
      fuell(koerper, "#42301e"); kante(koerper);
      fuell(() => { g.ellipse(-11, -4, 8, 5, 0, 0, TAU); g.ellipse(11, -4, 8, 5, 0, 0, TAU); }, "#42301e");
      linie([-6, -28, -6, -3], 5, "#4e3822"); linie([6, -28, 6, -3], 5, "#4e3822");
      fuell(() => { g.moveTo(-13, -42); g.lineTo(13, -42); g.lineTo(18, -14); g.quadraticCurveTo(0, -8, -18, -14); g.closePath(); }, "#7a2420");
      fuell(() => g.arc(0, -42, 3, 0, TAU), "#c9a040");
      g.save(); g.translate(0, -52); g.rotate(z.heul ? -.45 : Math.sin(z.zeit * 2) * .08);
      const kopf = () => g.ellipse(0, 0, 11, 10, 0, 0, TAU);
      fuell(kopf, "#4e3622"); kante(kopf);
      fuell(() => g.ellipse(0, 5, 6.5, 5, 0, 0, TAU), "#6e4e32");
      fuell(() => g.arc(0, 2.5, 2, 0, TAU), "#100808");
      fuell(() => { g.ellipse(-10, -2, 3.8, 8, .35, 0, TAU); g.ellipse(10, -2, 3.8, 8, -.35, 0, TAU); }, "#30200e");
      g.fillStyle = "#f0e0b0"; g.fillRect(-5, -3, 2, 2); g.fillRect(3, -3, 2, 2);
      if (z.heul) { g.fillStyle = "#1a0a08"; g.beginPath(); g.ellipse(0, 8, 2.6, 2, 0, 0, TAU); g.fill(); }
      g.restore();
      if (z.heul) { g.fillStyle = rgba("#ffe0a0", .75); g.font = "italic 13px Georgia, serif"; g.textAlign = "center"; g.fillText(sprache() === "en" ? "Awoo!" : "Auuu!", 0, -76 - Math.sin(z.zeit * 3) * 3); }
    }
    g.restore();
  }
  /* vor der Notenbahn: Feuer, Publikum, Würfe, Vorhang, Ansage */
  function buehneVorn(g, w, h, dpr, schlag) {
    const s = szene; if (!s) return;
    const zeit = s.zeit, u = Math.min(w / 100, h / 70), y = h * .82, ruhe = reduziert(), dt = ruhe ? 0 : s.dt;
    /* Feuer an der goldenen Linie */
    if (s.feuer > 0 && !ruhe) {
      const rate = [0, 40, 75, 120][s.feuer];
      let n = rate * dt; while (n > 0 && s.flammenT.length < 110) { if (n < 1 && Math.random() > n) break; n -= 1; s.flammenT.push({ x: Math.random(), y: .82, vx: (Math.random() - .5) * .02, vy: -.12 - Math.random() * .1 * s.feuer, t: 0, max: .45 + Math.random() * .4, r: .02 + Math.random() * .02 * s.feuer }); }
    }
    if (s.flammenT.length) {
      g.globalCompositeOperation = "lighter";
      s.flammenT = s.flammenT.filter(p => (p.t += dt) < p.max);
      const fb = leuchtBild("flamme");
      s.flammenT.forEach(p => { p.x += p.vx * dt; p.y += p.vy * dt; const a = 1 - p.t / p.max, r = p.r * h * (.6 + a * .6); g.globalAlpha = a * .9; g.drawImage(fb, p.x * w - r * .6, p.y * h - r * 1.5, r * 1.2, r * 2.6); });
      g.globalAlpha = 1;
      g.globalCompositeOperation = "source-over";
    }
    if (s.feuer > 0) { g.globalCompositeOperation = "lighter"; const gr = g.createLinearGradient(0, y - u * 8 * s.feuer, 0, y); gr.addColorStop(0, "rgba(255,120,40,0)"); gr.addColorStop(1, "rgba(255,120,40," + (.12 * s.feuer) + ")"); g.fillStyle = gr; g.fillRect(0, y - u * 8 * s.feuer, w, u * 8 * s.feuer); g.globalCompositeOperation = "source-over"; }
    /* Rauch */
    if (s.rauch.length) { s.rauch = s.rauch.filter(p => (p.t += dt) < p.max); s.rauch.forEach(p => { p.x += p.vx * dt; p.y += p.vy * dt; const a = 1 - p.t / p.max; leuchten(g, "rauch", p.x * w, p.y * h, p.r * h * (1 + p.t), a); }); }
    /* Publikum */
    if (s.leute) publikumMalen(g, w, h, u, schlag, zeit, ruhe);
    /* Würfe */
    s.wuerfe = s.wuerfe.filter(wf => {
      const p = (zeit - wf.t0) / wf.dauer; if (p < 0) return true;
      if (p >= 1) { s.flecken.push({ art: wf.art, x: wf.x1, y: wf.y1, t: zeit, dauer: wf.art === "tomate" ? 4 : 3, rot: wf.rot }); if (wf.art === "tomate" && ctx && bus) rauschen(ctx.currentTime, "lowpass", 500, .12, .12); return false; }
      const x = (wf.x0 + (wf.x1 - wf.x0) * p) * w, yy = (wf.y0 + (wf.y1 - wf.y0) * p) * h - Math.sin(p * Math.PI) * h * .28;
      dingMalen(g, wf.art, x, yy, u * 1.5, wf.rot + wf.dreh * p, zeit);
      return true;
    });
    /* Vorhänge links und rechts */
    vorhangMalen(g, w, h, u);
    /* Ansage */
    if (s.meldung) {
      const a0 = (zeit - s.meldung.t) / 2.2; if (a0 > 1) s.meldung = null;
      else {
        const a = Math.min(1, a0 * 6, (1 - a0) * 4), fs = Math.max(12 * dpr, Math.min(17 * dpr, w / 26));
        g.font = "600 " + fs + "px Georgia, serif"; g.textAlign = "center"; g.textBaseline = "middle";
        const tw = Math.min(w - 16 * dpr, g.measureText(s.meldung.text).width + 28 * dpr), my = Math.max(68 * dpr, h * .14) - (1 - Math.min(1, a0 * 5)) * 10 * dpr;
        g.globalAlpha = a; g.fillStyle = "rgba(16,12,20,.82)"; g.strokeStyle = "rgba(224,160,70,.8)"; g.lineWidth = 1.5 * dpr;
        g.beginPath(); g.roundRect ? g.roundRect(w / 2 - tw / 2, my - fs, tw, fs * 2, fs) : g.rect(w / 2 - tw / 2, my - fs, tw, fs * 2); g.fill(); g.stroke();
        g.fillStyle = "#ffd27a"; g.fillText(s.meldung.text, w / 2, my + 1, tw - 16 * dpr); g.textBaseline = "alphabetic"; g.globalAlpha = 1;
      }
    }
  }
  function vorhangMalen(g, w, h, u) {
    const s = szene, breit = w * (.035 + .4 * s.vorhang); if (breit < 1) return;
    if (!s.vorhangBild || s.vorhangBild.height !== h || s.vorhangFarbe !== s.K.vorhang) {
      const c = s.vorhangBild || document.createElement("canvas"); c.width = 96; c.height = h; const vg = c.getContext("2d");
      const gr = vg.createLinearGradient(0, 0, 96, 0); for (let i = 0; i <= 8; i++) { gr.addColorStop(i / 8, i % 2 ? rgba(s.K.vorhang, 1) : "#120608"); }
      vg.fillStyle = gr; vg.fillRect(0, 0, 96, h);
      const sh = vg.createLinearGradient(0, 0, 0, h); sh.addColorStop(0, "rgba(0,0,0,.35)"); sh.addColorStop(.4, "rgba(255,220,180,.05)"); sh.addColorStop(1, "rgba(0,0,0,.45)"); vg.fillStyle = sh; vg.fillRect(0, 0, 96, h);
      s.vorhangBild = c; s.vorhangFarbe = s.K.vorhang;
    }
    const b = s.vorhangBild;
    g.drawImage(b, 0, 0, breit, h); g.save(); g.translate(w, 0); g.scale(-1, 1); g.drawImage(b, 0, 0, breit, h); g.restore();
    g.fillStyle = "#c9a040"; g.fillRect(breit - u * .35, 0, u * .35, h); g.fillRect(w - breit, 0, u * .35, h);
    /* Kordel */
    if (s.vorhang > .1) { g.strokeStyle = "#c9a040"; g.lineWidth = u * .5; g.beginPath(); g.moveTo(0, h * .55); g.quadraticCurveTo(breit * .6, h * .6, breit, h * .52); g.moveTo(w, h * .55); g.quadraticCurveTo(w - breit * .6, h * .6, w - breit, h * .52); g.stroke(); }
  }
  function publikumMalen(g, w, h, u, schlag, zeit, ruhe) {
    const s = szene, licht = rgba(s.v.licht, .4), e = .25 + s.st * .9 + s.jubel, dt = ruhe ? 1 : s.dt;
    const farben = ["#1c151c", "#0e0a10"];
    for (const p of s.leute) {
      const ziel = s.st > p.schwelle || s.jubel > .6 ? 1 : 0;
      p.arm += (ziel - p.arm) * Math.min(1, dt * 3.5);
      const bob = ruhe ? 0 : -Math.abs(Math.sin((schlag + p.f * .08) * Math.PI)) * p.r * .22 * e;
      const wirft = p.wurf && zeit - p.wurf > -.25 && zeit - p.wurf < .35;
      personMalen(g, p, bob, wirft ? 1 : p.arm, licht, farben[p.reihe], zeit, h, wirft);
    }
  }
  function personMalen(g, p, bob, arm, licht, farbe, zeit, h, wirft) {
    const r = p.r, x = p.x, yy = p.y + bob, typ = p.typ;
    g.fillStyle = farbe;
    if (typ === "hund") {
      g.beginPath(); g.ellipse(x, yy + r * .9, r * 1.9, r * .85, 0, 0, TAU); g.fill();
      g.beginPath(); g.arc(x - r * 1.4, yy + r * .25, r * .75, 0, TAU); g.fill();
      g.beginPath(); g.ellipse(x - r * 1.95, yy + r * .35, r * .3, r * .62, .5, 0, TAU); g.ellipse(x - r * .85, yy + r * .2, r * .3, r * .62, -.5, 0, TAU); g.fill();
      g.strokeStyle = licht; g.lineWidth = Math.max(1, r * .12); g.beginPath(); g.ellipse(x, yy + r * .9, r * 1.9, r * .85, 0, Math.PI * 1.1, Math.PI * 1.9); g.stroke();
      if (szene.st < .75) { const k = (zeit * .6) % 1; g.fillStyle = "rgba(235,226,204," + (1 - k) * .7 + ")"; g.font = "italic " + Math.round(r * (.8 + k * .6)) + "px Georgia, serif"; g.textAlign = "center"; g.fillText("z", x - r * 1.2 + k * r, yy - r * (.3 + k * 1.4)); }
      return;
    }
    const gross = typ === "bugbear" ? 1.3 : typ === "buergermeister" ? 1.15 : 1;
    if (typ === "elfe" || typ === "feenkoenigin") { /* Flügel, schimmernd */
      const fl = .7 + .3 * Math.sin(zeit * 9 + p.f), a = typ === "feenkoenigin" ? .35 : .22;
      g.fillStyle = "rgba(220,240,200," + a + ")"; g.beginPath(); g.ellipse(x - r * 1.3, yy + r * .9, r * 1.2 * fl, r * .6, -.6, 0, TAU); g.ellipse(x + r * 1.3, yy + r * .9, r * 1.2 * fl, r * .6, .6, 0, TAU); g.fill();
      g.fillStyle = farbe;
    }
    g.beginPath(); g.moveTo(x - r * 1.5 * gross, h); g.quadraticCurveTo(x - r * 1.6 * gross, yy + r * 1.15, x - r * .5, yy + r * .9); g.lineTo(x + r * .5, yy + r * .9); g.quadraticCurveTo(x + r * 1.6 * gross, yy + r * 1.15, x + r * 1.5 * gross, h); g.fill();
    if (arm > .02) {
      const sd = p.sd, sx = x + sd * r * 1.05, sy = yy + r * 1.3, hx = x + sd * r * (1.45 + (wirft ? .3 : 0)), hy = yy - r * (.2 + 1.5 * arm) + (wirft ? 0 : Math.sin(zeit * 4 + p.f) * r * .15);
      g.strokeStyle = farbe; g.lineWidth = r * .5; g.lineCap = "round"; g.beginPath(); g.moveTo(sx, sy); g.lineTo(hx, hy); g.stroke();
      if (!wirft) gefaessMalen(g, p.gefaess, hx, hy, r, zeit, p);
    }
    g.fillStyle = farbe; g.beginPath(); g.arc(x, yy, r * gross, 0, TAU); g.fill();
    hutMalen(g, typ, x, yy, r * gross, farbe, zeit, p);
    g.strokeStyle = licht; g.lineWidth = Math.max(1, r * .13); g.beginPath(); g.arc(x, yy, r * gross, Math.PI * 1.15, Math.PI * 1.85); g.stroke();
  }
  function gefaessMalen(g, art, x, y, r, zeit, p) {
    const b = r * .55;
    switch (art) {
      case "krug": g.fillStyle = "#7a5420"; g.fillRect(x - b, y - b * 1.7, b * 1.8, b * 1.9); g.strokeStyle = "#7a5420"; g.lineWidth = b * .35; g.beginPath(); g.arc(x + b * .95, y - b * .8, b * .5, -1.4, 1.4); g.stroke();
        g.fillStyle = "#efe6d0"; g.beginPath(); g.arc(x - b * .4, y - b * 1.75, b * .5, 0, TAU); g.arc(x + b * .35, y - b * 1.8, b * .55, 0, TAU); g.fill(); break;
      case "kelch": g.fillStyle = p.ton < .5 ? "#8a1a2a" : "#c9a040"; g.beginPath(); g.arc(x, y - b * 1.6, b * .8, 0, Math.PI); g.fill(); g.fillStyle = "#d8d0c0"; g.fillRect(x - b * .1, y - b * 1.6, b * .2, b * 1.4); g.fillRect(x - b * .5, y - b * .25, b, b * .2); break;
      case "horn": g.fillStyle = "#c8b080"; g.beginPath(); g.moveTo(x - b * .5, y - b * .2); g.quadraticCurveTo(x - b * .8, y - b * 2, x + b * .9, y - b * 2.4); g.lineTo(x + b * .7, y - b * 1.6); g.quadraticCurveTo(x, y - b * 1.2, x + b * .3, y); g.fill(); g.fillStyle = "#efe6d0"; g.beginPath(); g.ellipse(x + b * .8, y - b * 2, b * .35, b * .45, .5, 0, TAU); g.fill(); break;
      case "blume": g.strokeStyle = "#3a6a2a"; g.lineWidth = b * .25; g.beginPath(); g.moveTo(x, y); g.lineTo(x, y - b * 1.8); g.stroke(); dingMalen(g, "blume", x, y - b * 2, b * 1.2, zeit, zeit); break;
      default: leuchten(g, "#ffe6a0", x, y - b * .5, b * 2.4, .45 + .2 * Math.sin(zeit * 4 + p.f)); g.fillStyle = g.strokeStyle; g.beginPath(); g.arc(x, y, b * .45, 0, TAU); g.fill();
    }
  }
  function hutMalen(g, typ, x, y, r, farbe, zeit, p) {
    const flaeche = (fa, fn) => { g.fillStyle = fa; g.beginPath(); fn(); g.fill(); };
    switch (typ) {
      case "stroh": flaeche("#3e3018", () => g.ellipse(x, y - r * .35, r * 1.75, r * .38, 0, 0, TAU)); flaeche("#3e3018", () => g.ellipse(x, y - r * .5, r * .85, r * .6, 0, Math.PI, 0)); break;
      case "kappe": flaeche("#2a2622", () => { g.ellipse(x, y - r * .5, r * 1.05, r * .6, 0, Math.PI, 0); g.rect(x - r * 1.15, y - r * .55, r * 2.3, r * .22); }); break;
      case "haube": flaeche("#3a3026", () => g.arc(x, y - r * .1, r * 1.08, Math.PI * .92, Math.PI * 2.08)); flaeche("#3a3026", () => g.arc(x, y + r * .6, r * .3, 0, TAU)); break;
      case "kopftuch": flaeche("#4e1c16", () => { g.arc(x, y - r * .15, r * 1.04, Math.PI, 0); g.moveTo(x + r * .7, y - r * .2); g.lineTo(x + r * 1.5, y + r * .35); g.lineTo(x + r * 1.05, y + r * .5); }); break;
      case "dreispitz": case "kapitaen": flaeche("#1e1810", () => { g.moveTo(x - r * 1.7, y - r * .35); g.quadraticCurveTo(x, y - r * 1.9, x + r * 1.7, y - r * .35); g.quadraticCurveTo(x, y - r * .75, x - r * 1.7, y - r * .35); });
        if (typ === "kapitaen") { papageiMalen(g, x + r * 1.5, y + r * 1.15, r * .45); } break;
      case "zylinder": case "buergermeister": flaeche("#18141a", () => { g.rect(x - r * 1.3, y - r * .75, r * 2.6, r * .25); g.rect(x - r * .78, y - r * (typ === "buergermeister" ? 2.6 : 2.2), r * 1.56, r * (typ === "buergermeister" ? 1.9 : 1.5)); });
        flaeche(typ === "buergermeister" ? "#c9a040" : "rgba(150,40,40,.5)", () => g.rect(x - r * .78, y - r * 1.05, r * 1.56, r * .25)); break;
      case "dutt": case "monokel": flaeche(farbe, () => g.arc(x, y - r * 1.05, r * .45, 0, TAU));
        if (typ === "monokel") { g.strokeStyle = "#c9a040"; g.lineWidth = Math.max(1, r * .12); g.beginPath(); g.arc(x + r * 1.15, y - r * .1, r * .3, 0, TAU); g.stroke(); g.fillStyle = "rgba(255,240,200," + (.4 + .4 * Math.sin(zeit * 2)) + ")"; g.fillRect(x + r * 1.05, y - r * .2, r * .12, r * .12); } break;
      case "peruecke": flaeche("#5a544a", () => { [[-.75, -.3], [.75, -.3], [0, -.78], [-.5, .3], [.5, .3]].forEach(([a, b]) => { g.moveTo(x + a * r + r * .62, y + b * r); g.arc(x + a * r, y + b * r, r * .62, 0, TAU); }); }); flaeche("#2a1a1a", () => g.rect(x - r * .12, y + r * .6, r * .24, r * .7)); break;
      case "federhut": flaeche("#2a1e22", () => { g.ellipse(x, y - r * .45, r * 1.5, r * .32, 0, 0, TAU); g.ellipse(x, y - r * .62, r * .8, r * .5, 0, Math.PI, 0); });
        g.strokeStyle = aus(() => p.ton, ["#a83a2a", "#c9a040", "#e8dcc0"]); g.lineWidth = r * .18; g.beginPath(); g.moveTo(x + r * .4, y - r * .9); g.quadraticCurveTo(x + r * 1.6, y - r * 1.9, x + r * 2, y - r * 1.2); g.stroke(); break;
      case "kragen": case "fuerst": flaeche(typ === "fuerst" ? "#4a0e18" : "#2a0a12", () => { g.moveTo(x - r * 1.45, y + r * 1); g.lineTo(x - r * 1.15, y - r * .6); g.lineTo(x - r * .55, y + r * .75); g.moveTo(x + r * 1.45, y + r * 1); g.lineTo(x + r * 1.15, y - r * .6); g.lineTo(x + r * .55, y + r * .75); }); break;
      case "helm": case "koenig":
        if (typ === "koenig") { flaeche("#b08a30", () => { g.moveTo(x - r * .9, y - r * .55); for (let k = 0; k <= 4; k++) { g.lineTo(x - r * .9 + k * r * .45, y - r * (k % 2 ? 1 : 1.55)); } g.lineTo(x + r * .9, y - r * .55); }); }
        else { flaeche("#3e3a32", () => { g.arc(x, y - r * .05, r * 1.1, Math.PI, 0); g.rect(x - r * 1.15, y - r * .12, r * 2.3, r * .25); }); flaeche("#7a6a48", () => { g.moveTo(x - r * 1, y - r * .5); g.lineTo(x - r * 1.6, y - r * 1.3); g.lineTo(x - r * .8, y - r * .8); g.moveTo(x + r * 1, y - r * .5); g.lineTo(x + r * 1.6, y - r * 1.3); g.lineTo(x + r * .8, y - r * .8); }); }
        flaeche("#3a2a1a", () => { g.ellipse(x - r * 1, y + r * .65, r * .38, r * .65, .3, 0, TAU); g.ellipse(x + r * 1, y + r * .65, r * .38, r * .65, -.3, 0, TAU); }); break;
      case "krone": flaeche("#b08a30", () => { g.moveTo(x - r * .8, y - r * .6); for (let k = 0; k <= 4; k++) g.lineTo(x - r * .8 + k * r * .4, y - r * (k % 2 ? .95 : 1.35)); g.lineTo(x + r * .8, y - r * .6); }); break;
      case "elfe": case "feenkoenigin": flaeche(farbe, () => { g.moveTo(x - r * .85, y - r * .1); g.lineTo(x - r * 1.6, y - r * .95); g.lineTo(x - r * .7, y + r * .3); g.moveTo(x + r * .85, y - r * .1); g.lineTo(x + r * 1.6, y - r * .95); g.lineTo(x + r * .7, y + r * .3); });
        if (typ === "feenkoenigin") flaeche("#5a8a3a", () => { for (let k = 0; k < 7; k++) { const a = Math.PI + k / 6 * Math.PI; g.moveTo(x + Math.cos(a) * r, y + Math.sin(a) * r); g.ellipse(x + Math.cos(a) * r * 1.05, y + Math.sin(a) * r * 1.05 - r * .3, r * .22, r * .5, a + Math.PI / 2, 0, TAU); } });
        else break;
        break;
      case "blumen": for (let k = 0; k < 6; k++) { const a = Math.PI * 1.05 + k / 5 * Math.PI * .9; g.fillStyle = ["#e080a0", "#f0d070", "#f0f0e0"][k % 3]; g.beginPath(); g.arc(x + Math.cos(a) * r * .95, y + Math.sin(a) * r * .95, r * .2, 0, TAU); g.fill(); } break;
      case "halo": g.strokeStyle = "rgba(255,215,130," + (.65 + .25 * Math.sin(zeit * 2 + p.f)) + ")"; g.lineWidth = Math.max(1, r * .18); g.beginPath(); g.ellipse(x, y - r * 1.35, r * .8, r * .24, 0, 0, TAU); g.stroke(); break;
      case "hoerner": flaeche("#5a4436", () => { g.moveTo(x - r * .6, y - r * .7); g.quadraticCurveTo(x - r * 1.3, y - r * 1.1, x - r * 1.1, y - r * 1.7); g.quadraticCurveTo(x - r * .9, y - r * 1.1, x - r * .3, y - r * .9); g.moveTo(x + r * .6, y - r * .7); g.quadraticCurveTo(x + r * 1.3, y - r * 1.1, x + r * 1.1, y - r * 1.7); g.quadraticCurveTo(x + r * .9, y - r * 1.1, x + r * .3, y - r * .9); }); break;
      case "kapuze": flaeche(farbe, () => { g.moveTo(x - r * 1.15, y + r * .4); g.quadraticCurveTo(x - r * 1.2, y - r * 1.2, x, y - r * 1.6); g.quadraticCurveTo(x + r * 1.2, y - r * 1.2, x + r * 1.15, y + r * .4); }); break;
      case "gartokkar": flaeche("#3e1410", () => { g.moveTo(x - r * .8, y - r * .5); g.lineTo(x - r * .5, y - r * 2.4); g.lineTo(x, y - r * 2.9); g.lineTo(x + r * .5, y - r * 2.4); g.lineTo(x + r * .8, y - r * .5); }); flaeche("#c9a040", () => g.rect(x - r * .1, y - r * 2.6, r * .2, r * 2)); break;
      case "bugbear": flaeche("#2a1e16", () => { g.moveTo(x - r * .7, y - r * .5); g.lineTo(x - r * 1.5, y - r * 1.5); g.lineTo(x - r * .3, y - r * .9); g.moveTo(x + r * .7, y - r * .5); g.lineTo(x + r * 1.5, y - r * 1.5); g.lineTo(x + r * .3, y - r * .9); for (let k = 0; k < 7; k++) { const a = Math.PI + k / 6 * Math.PI; g.moveTo(x, y); g.arc(x + Math.cos(a) * r * .9, y + Math.sin(a) * r * .9, r * .28, 0, TAU); } }); break;
      case "glatze": g.fillStyle = "rgba(255,230,190,.1)"; g.beginPath(); g.arc(x - r * .3, y - r * .45, r * .3, 0, TAU); g.fill(); break;
    }
  }
  function dingMalen(g, art, x, y, r, rot, zeit) {
    g.save(); g.translate(x, y); g.rotate(rot);
    switch (art) {
      case "tomate": g.fillStyle = "#c8321e"; g.beginPath(); g.arc(0, 0, r, 0, TAU); g.fill(); g.fillStyle = "rgba(255,200,170,.45)"; g.beginPath(); g.arc(-r * .35, -r * .35, r * .3, 0, TAU); g.fill();
        g.fillStyle = "#3a7a2a"; for (let k = 0; k < 5; k++) { g.beginPath(); g.ellipse(Math.cos(k * 1.26) * r * .3, -r * .9 + Math.sin(k * 1.26) * r * .2, r * .32, r * .12, k * 1.26, 0, TAU); g.fill(); } break;
      case "kohl": g.fillStyle = "#6a9a3a"; g.beginPath(); g.arc(0, 0, r * 1.1, 0, TAU); g.fill(); g.strokeStyle = "#3a6a1a"; g.lineWidth = r * .15; g.beginPath(); g.arc(-r * .4, 0, r * .8, -1, 1); g.arc(r * .4, 0, r * .8, 2.1, 4.2); g.stroke(); break;
      case "hering": g.fillStyle = "#a0a890"; g.beginPath(); g.ellipse(0, 0, r * 1.7, r * .55, 0, 0, TAU); g.fill(); g.beginPath(); g.moveTo(r * 1.5, 0); g.lineTo(r * 2.3, -r * .6); g.lineTo(r * 2.3, r * .6); g.fill(); g.fillStyle = "#1a1a14"; g.beginPath(); g.arc(-r * 1.1, -r * .1, r * .13, 0, TAU); g.fill(); g.fillStyle = "rgba(255,255,240,.3)"; g.fillRect(-r, -r * .3, r * 2, r * .12); break;
      case "stein": g.fillStyle = "#6a625a"; g.beginPath(); g.moveTo(-r, -r * .3); g.lineTo(-r * .3, -r * .9); g.lineTo(r * .8, -r * .6); g.lineTo(r, r * .4); g.lineTo(0, r * .9); g.lineTo(-r * .8, r * .6); g.fill(); break;
      case "eichel": g.fillStyle = "#8a5a2a"; g.beginPath(); g.ellipse(0, r * .2, r * .6, r * .85, 0, 0, TAU); g.fill(); g.fillStyle = "#4a3018"; g.beginPath(); g.ellipse(0, -r * .4, r * .75, r * .4, 0, Math.PI, 0); g.fill(); g.fillRect(-r * .08, -r * 1.05, r * .16, r * .3); break;
      case "pilz": g.fillStyle = "#e8dcc8"; g.fillRect(-r * .3, -r * .1, r * .6, r); g.fillStyle = "#b8302a"; g.beginPath(); g.ellipse(0, -r * .1, r, r * .7, 0, Math.PI, 0); g.fill(); g.fillStyle = "#fff"; [[-.4, -.4], [.3, -.5], [0, -.25]].forEach(([a, b]) => { g.beginPath(); g.arc(a * r, b * r, r * .13, 0, TAU); g.fill(); }); break;
      case "broetchen": g.fillStyle = "#c08a48"; g.beginPath(); g.ellipse(0, 0, r * 1.2, r * .8, 0, 0, TAU); g.fill(); g.strokeStyle = "#7a5020"; g.lineWidth = r * .15; g.beginPath(); g.moveTo(-r * .6, 0); g.lineTo(r * .6, 0); g.stroke(); break;
      case "rose": g.strokeStyle = "#3a6a2a"; g.lineWidth = r * .2; g.beginPath(); g.moveTo(0, 0); g.lineTo(0, r * 2); g.stroke(); g.fillStyle = "#b01e2e"; g.beginPath(); g.arc(0, 0, r * .75, 0, TAU); g.fill(); g.fillStyle = "#d8404a"; g.beginPath(); g.arc(r * .1, -r * .15, r * .4, 0, TAU); g.fill(); break;
      case "blume": for (let k = 0; k < 5; k++) { g.fillStyle = "#f0a0c0"; g.beginPath(); g.ellipse(Math.cos(k * 1.26) * r * .55, Math.sin(k * 1.26) * r * .55, r * .45, r * .3, k * 1.26, 0, TAU); g.fill(); } g.fillStyle = "#f0d060"; g.beginPath(); g.arc(0, 0, r * .3, 0, TAU); g.fill(); break;
      case "muenze": g.scale(Math.max(.18, Math.abs(Math.cos(rot * 2))), 1); g.fillStyle = "#e0b040"; g.beginPath(); g.arc(0, 0, r * .85, 0, TAU); g.fill(); g.strokeStyle = "#8a6414"; g.lineWidth = r * .14; g.stroke(); g.fillStyle = "rgba(255,250,220,.7)"; g.fillRect(-r * .3, -r * .4, r * .2, r * .5); break;
      case "stern": g.globalCompositeOperation = "lighter"; leuchten(g, "#ffd890", 0, 0, r * 2.4, .7); g.globalCompositeOperation = "source-over"; g.fillStyle = "#fff0c0"; g.beginPath(); for (let k = 0; k < 10; k++) { const a = k / 10 * TAU - Math.PI / 2, rr = k % 2 ? r * .4 : r; g.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); } g.fill(); break;
    }
    g.restore();
  }
  function fleckMalen(g, art, x, y, r, rot) {
    if (art !== "tomate") { g.save(); g.translate(x, y); g.scale(1, .55); dingMalen(g, art, 0, 0, r * 1.05, rot, 0); g.restore(); return; }
    g.fillStyle = "#a8281a"; g.beginPath(); g.ellipse(x, y, r * 1.6, r * .55, 0, 0, TAU); g.fill();
    for (let k = 0; k < 6; k++) { const a = rot + k * 1.05, d = r * (1.3 + (k % 3) * .35); g.beginPath(); g.ellipse(x + Math.cos(a) * d, y + Math.sin(a) * d * .35, r * .35, r * .16, a, 0, TAU); g.fill(); }
    g.fillStyle = "#3a7a2a"; g.beginPath(); g.ellipse(x + r * .3, y - r * .1, r * .35, r * .14, .4, 0, TAU); g.fill();
  }
  /* Stage-Animation auch außerhalb des Lieds (Vorhang, Würfe, Kerzen) – sanft gedrosselt, nur wenn sichtbar */
  let ruheLaeuft = false, ruheSicht = true, ruheLetzt = 0;
  function ruheSchleife(ts) {
    if (spiel || kalib || !szene || reduziert() || !ruheSicht || document.hidden || !root.getClientRects().length) { ruheLaeuft = false; return; }
    const s = szene, lebhaft = s.wuerfe.length || s.flammenT.length || s.rauch.length || Math.abs(s.vorhang - s.vorhangZiel) > .003 || s.meldung || (s.ende && s.zeit - s.ende.t < 3);
    if (lebhaft || ts - ruheLetzt > 40) { ruheLetzt = ts; malenRuhe(); }
    requestAnimationFrame(ruheSchleife);
  }
  function ruheStarten() { if (ruheLaeuft || reduziert() || spiel || kalib) return; ruheLaeuft = true; requestAnimationFrame(ruheSchleife); }
  if (window.IntersectionObserver) new IntersectionObserver(es => { ruheSicht = es.some(e => e.isIntersecting); if (ruheSicht) ruheStarten(); }).observe(root);
  document.addEventListener("visibilitychange", () => { if (!document.hidden) ruheStarten(); });

  /* ---------- Oberfläche ---------- */
  function zeichnen() {
    const T = t();
    const imWeg = modus === "weg";
    const laeuft = !!(spiel || kalib);
    if (ergebnis && ergebnis.frisch) setTimeout(() => { if (ergebnis) ergebnis.frisch = false; }, 0);
    root.classList.toggle("at-fokus", !!(spiel || stimmt || kalib));
    root.innerHTML =
      '<p class="label">' + T.label + "</p><h3>" + T.titel + "</h3>" +
      '<div class="at-modus" role="tablist">' + ["lieder", "weg"].map(m => '<button type="button" role="tab" data-modus="' + m + '" aria-selected="' + (m === modus) + '">' + T.modi[m] + "</button>").join("") + "</div>" +
      '<p class="tav-info">' + (imWeg ? T.weg.text : T.text) + "</p>" +
      (imWeg ? wegHtml(T) : liederHtml(T)) +
      '<div class="at-buehne"><canvas class="at-canvas" width="560" height="380" aria-label="' + esc(T.titel) + '"></canvas>' +
        (laeuft ? '<div class="at-leiste">' + knoepfeHtml(T) + "</div>" : "") +
        (!laeuft && !ergebnis ? '<div class="at-vorhang">' + vorhangHtml(T) + "</div>" : "") +
        '<div class="at-ergebnis' + (ergebnis && ergebnis.frisch && !reduziert() ? " spaet" : "") + '" ' + (ergebnis ? "" : "hidden") + ">" +
          (ergebnis ? '<div class="at-erg-inhalt">' + ergebnisHtml(T) + '</div><div class="at-aktion">' + knoepfeHtml(T) + "</div>" : "") + "</div>" +
        '<div class="at-pause" role="button" tabindex="0" hidden></div></div>' +
      '<p class="at-steuer">' + (kalib ? T.kalib.hinweis : T.steuerung + "<br>" + T.tipp) + "</p>" +
      '<div class="at-fuss">' + (duell || laeuft ? "" : duellKnopfHtml()) + "</div>" +
      '<div class="at-ton"><button type="button" class="at-stumm"></button><label><span>' + T.ton + '</span><input type="range" class="at-laut" min="0" max="100" step="5"></label></div>' +
      (spiel || stimmt ? "" : kalibHtml(T)) +
      (imWeg ? (spiel || stimmt || kalib ? "" : '<div class="at-weg-fuss"><button type="button" class="at-zurueck">' + T.weg.zuruecksetzen + "</button></div>") :
        (ergebnis && !spiel && !ergebnis.duell ? '<div class="at-eintrag-box">' + eintragHtml(T) + "</div>" : "") + '<div class="at-liste">' + listeHtml(T) + "</div>");
    tonNeu(); pauseZeigen();
    if (duell) duellZeichnen(); /* Online-Duell: Leiste, Gegner, gesperrte Wahl */
    hoeheAnpassen();
    if (kalib) return;
    malenRuhe(); ruheStarten();
    const pf = root.querySelector(".at-pfad"), akt = pf && pf.querySelector('[aria-pressed="true"]');
    if (akt) pf.scrollLeft = Math.max(0, akt.parentNode.offsetLeft - (pf.clientWidth - akt.parentNode.offsetWidth) / 2);
  }
  /* Vorhang vor dem Auftritt: worum es geht – und der Start-Knopf direkt auf der Bühne */
  function vorhangHtml(T) {
    let kopf, titel, text = "", klein = "";
    if (modus === "weg" && !duell) {
      const W = T.weg, st = WEG[wegStation], s = W.stationen[wegStation];
      kopf = WEG_ZEICHEN[wegStation] + " " + W.station(wegStation + 1) + " · " + W.sg(st.sg);
      titel = esc(s.ort); text = zit(s.intro);
      klein = esc(W.publikum) + ": " + esc(s.publikum) + " · " + esc(W.lied) + ": <em>" + esc(T.lieder[st.lied]) + "</em>";
    } else {
      kopf = esc(T.stufen[stufe]); titel = "♪ " + esc(liedName(aktuellesLied(), T)); text = esc(T.vorhang);
    }
    return '<div class="at-v-karte"><p class="at-v-kopf">' + kopf + '</p><p class="at-v-titel">' + titel + "</p>" +
      (text ? '<p class="at-v-text">' + text + "</p>" : "") + (klein ? '<p class="at-v-klein">' + klein + "</p>" : "") + "</div>" +
      '<div class="at-aktion">' + knoepfeHtml(T) + "</div>";
  }
  /* Spielfläche so hoch, wie bis zum unteren Fensterrand Platz ist (im Vollbild: bis zum Rand der Karte) */
  function hoeheAnpassen() {
    const c = canvas(); if (!c || !c.getClientRects().length) return;
    const voll = root.classList.contains("tav-voll");
    let h;
    if (voll) { const kr = root.getBoundingClientRect(); h = root.clientHeight - (c.getBoundingClientRect().top - kr.top + root.scrollTop) - (root.classList.contains("at-fokus") ? 6 : 10); }
    else {
      let unten = window.innerHeight; const nav = document.querySelector(".handyleiste");
      if (nav) { const cs = getComputedStyle(nav), nr = nav.getBoundingClientRect(); if (cs.display !== "none" && cs.visibility !== "hidden" && cs.position === "fixed" && nr.height > 0 && nr.top < unten) unten = nr.top; }
      h = unten - (c.getBoundingClientRect().top + window.pageYOffset) - 12;
    }
    h = Math.round(Math.max(voll ? 200 : 250, Math.min(voll ? 4000 : 720, h)));
    if (root.style.getPropertyValue("--at-h") !== h + "px") root.style.setProperty("--at-h", h + "px");
  }
  function liederHtml(T) {
    return '<div class="at-stufen at-wahl" role="group" aria-label="' + esc(T.publikum) + '"><span class="at-wahl-titel">' + T.publikum + ":</span>" +
        Object.keys(STUFEN).map(k => '<button type="button" data-stufe="' + k + '" aria-pressed="' + (k === stufe) + '" title="' + esc(T.stufen[k]) + '"><span class="lang">' + T.stufen[k] + '</span><span class="kurz">' + T.stufenKurz[k] + "</span></button>").join("") + "</div>" +
      '<div class="at-stufen at-lieder"><label for="at-liedwahl">' + T.lied + ":</label>" +
        '<select id="at-liedwahl" class="at-liedwahl">' + Object.keys(LIEDER).filter(k => !LIEDER[k].nurWeg).map(k => '<option value="' + k + '"' + (k === liedWahl ? " selected" : "") + ">" + esc(T.lieder[k]) + "</option>").join("") +
          '<option value="neu"' + (liedWahl === "neu" ? " selected" : "") + ">" + esc(T.neuesLied) + "</option></select>" +
        (liedWahl === "neu" ? '<button type="button" data-lied="neu" title="' + esc(T.neuesLied) + '">🎲</button><span class="at-erfunden">♪ ' + esc(liedName(aktuellesLied(), T)) + "</span>" : "") + "</div>";
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
    if (duell && !kalib) return duellKnoepfe(T);
    if (kalib) return '<button type="button" class="tav-knopf at-start">' + T.abbrechen + "</button>";
    if (stimmt) return '<button type="button" class="tav-knopf at-start">' + T.stimmen_laden + "</button>";
    if (spiel) return '<button type="button" class="tav-knopf at-pause-knopf" aria-label="' + esc(T.pauseKnopf.replace(/^\W+/, "")) + '">' + T.pauseKnopf + '</button><button type="button" class="tav-knopf at-start">✕ ' + T.abbrechen + "</button>";
    if (modus !== "weg") return '<button type="button" class="tav-knopf at-start haupt">' + (ergebnis ? T.nochmal : T.start) + "</button>";
    const W = T.weg, weiter = ergebnis && ergebnis.bestanden && wegStation < WEG.length - 1;
    return (weiter ? '<button type="button" class="tav-knopf at-weiter haupt">' + W.weiter + "</button>" : "") +
      '<button type="button" class="tav-knopf at-start' + (weiter ? "" : " haupt") + '">' + (!ergebnis ? W.start : ergebnis.bestanden ? W.wiederholen : W.nochmal) + "</button>";
  }
  function ergebnisHtml(T) {
    const e = ergebnis;
    if (e.duell) return duellErgebnisHtml(T);
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
    /* höchstens ~0,8 Mio. Bildpunkte – die Bühne ist auch im Vollbild auf dem Handy flüssig */
    const r = c.getBoundingClientRect(), dpr = Math.max(Math.min(1, window.devicePixelRatio || 1), Math.min(2, window.devicePixelRatio || 1, Math.sqrt(8e5 / Math.max(1, r.width * r.height))));
    const w = Math.round(r.width * dpr), h = Math.round(r.height * dpr);
    if (c.width !== w || c.height !== h) { c.width = w; c.height = h; }
    return { w, h, dpr };
  }
  /* Taktposition in Schlägen – danach wippen Band und Publikum */
  function taktJetzt() {
    if (spiel && ctx) { const d = spiel.daten; return (hoerZeit() - spiel.start - d.vor) / (4 * d.schritt); }
    return performance.now() / 1000 * 1.15;
  }
  /* Bühne und Notenbahn: Kulisse dahinter, Spuren halb durchsichtig darüber, dann die goldene Linie */
  function grund(g, w, h, dpr, blitz) {
    g.clearRect(0, 0, w, h);
    const bahn = w / 3, y = h * .82, aktiv = !!(spiel || kalib), schlag = taktJetzt();
    szeneNeu(false);
    buehneHinten(g, w, h, dpr, schlag);
    if (!aktiv) bahnenMalen(g, w, h, dpr, .45);
    for (let i = 0; i < 3; i++) if (blitz && blitz[i] > 0) { g.fillStyle = "rgba(255,210,122," + (0.25 * blitz[i]) + ")"; g.fillRect(i * bahn + 2 * dpr, 0, bahn - 4 * dpr, y); }
    g.strokeStyle = szene && szene.feuer ? "#ff9a40" : "#e0a046"; g.lineWidth = 3 * dpr; g.shadowColor = g.strokeStyle; g.shadowBlur = 12 * dpr;
    g.globalAlpha = aktiv ? 1 : .7; g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); g.shadowBlur = 0;
    for (let i = 0; i < 3; i++) {
      g.fillStyle = "rgba(16,12,20,.45)"; g.beginPath(); g.arc(i * bahn + bahn / 2, y, 18 * dpr, 0, Math.PI * 2); g.fill();
      g.strokeStyle = "rgba(224,160,70,.7)"; g.lineWidth = 2 * dpr; g.beginPath(); g.arc(i * bahn + bahn / 2, y, 18 * dpr, 0, Math.PI * 2); g.stroke();
      g.fillStyle = "rgba(235,226,204,.75)"; g.font = "bold " + (13 * dpr) + "px Georgia, serif"; g.textAlign = "center"; g.textBaseline = "middle";
      g.fillText(TASTEN_ANZEIGE[i], i * bahn + bahn / 2, y + 1); g.textBaseline = "alphabetic";
    }
    g.globalAlpha = 1;
    return y;
  }
  function bahnenMalen(g, w, h, dpr, k) {
    const bahn = w / 3, y = h * .82;
    for (let i = 0; i < 3; i++) {
      const x = i * bahn, grad = g.createLinearGradient(0, 0, 0, y);
      grad.addColorStop(0, "rgba(10,8,14," + (.06 * k) + ")"); grad.addColorStop(1, "rgba(10,8,14," + (.4 * k) + ")");
      g.fillStyle = grad; g.fillRect(x + 2 * dpr, 0, bahn - 4 * dpr, y);
      g.fillStyle = "rgba(235,226,204," + (.1 * k) + ")"; if (i) g.fillRect(x - .5 * dpr, 0, 1 * dpr, y);
    }
  }
  /* Spurnamen unten über dem Publikum – mit dunklem Rand, damit sie lesbar bleiben */
  function spurNamen(g, w, h, dpr) {
    const bahn = w / 3; g.font = (12 * dpr) + "px Georgia, serif"; g.textAlign = "center"; g.lineWidth = 3 * dpr; g.strokeStyle = "rgba(10,8,14,.85)"; g.fillStyle = "rgba(235,226,204,.8)";
    for (let i = 0; i < 3; i++) { g.strokeText(t().spuren[i], i * bahn + bahn / 2, h - 8 * dpr); g.fillText(t().spuren[i], i * bahn + bahn / 2, h - 8 * dpr); }
  }
  function malenRuhe() {
    const c = canvas(); if (!c) return;
    const { w, h, dpr } = maße(c), g = c.getContext("2d");
    grund(g, w, h, dpr);
    buehneVorn(g, w, h, dpr, taktJetzt());
  }
  function malen() {
    if (!spiel) return;
    const c = canvas(); if (!c) return;
    const { w, h, dpr } = maße(c), g = c.getContext("2d"), jetzt = hoerZeit() - spiel.start, gewertet = jetzt - kalibWert;
    if (!spiel.pause) spiel.blitz = spiel.blitz.map(b => Math.max(0, b - .06));
    const y = grund(g, w, h, dpr, spiel.blitz), bahn = w / 3, flug = spiel.st.flug;
    /* Taktlinien wandern mit – so sieht man den Rhythmus kommen */
    const d0 = spiel.daten, schlagDauer = 4 * d0.schritt;
    if (!spiel.pause) szeneFortschritt(klemme(jetzt / Math.max(1, d0.ende - 1.5), 0, 1), spiel.serie);
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
      if (!n.status && !spiel.pause && n.zeit - gewertet < -FENSTER.knapp) { n.status = "daneben"; spiel.serie = 0; zeigeUrteil("daneben", n.spur); szenePatzer(n.spur); }
    });
    buehneVorn(g, w, h, dpr, (jetzt - d0.vor) / schlagDauer);
    spurNamen(g, w, h, dpr);
    g.shadowColor = "rgba(0,0,0,.9)"; g.shadowBlur = 4 * dpr;
    g.fillStyle = "#ebe2cc"; g.textAlign = "left"; g.font = (14 * dpr) + "px Georgia, serif";
    const links = 10 * dpr + (szene ? w * (.035 + .4 * szene.vorhang) : 0);
    g.fillText(Math.round(spiel.punkte) + " " + t().punkte, links, 22 * dpr);
    if (spiel.serie >= 5) { g.fillStyle = szene && szene.feuer ? "#ffb060" : "#e0a046"; g.fillText((szene && szene.feuer ? "🔥 " : "") + t().serie(spiel.serie), links, 41 * dpr); }
    if (spiel.urteil && jetzt - spiel.urteil.zeit < .6) {
      const a = 1 - (jetzt - spiel.urteil.zeit) / .6;
      g.globalAlpha = a; g.textAlign = "center"; g.font = "bold " + (22 * dpr) + "px Georgia, serif";
      g.fillStyle = spiel.urteil.art === "daneben" ? "#e0675a" : spiel.urteil.art === "perfekt" ? "#ffd27a" : "#ebe2cc";
      g.fillText(t().urteil[spiel.urteil.art], spiel.urteil.spur * bahn + bahn / 2, y - 40 * dpr - (1 - a) * 20 * dpr); g.globalAlpha = 1;
    }
    g.shadowBlur = 0;
    if (spiel.duell) {
      duellMalen(g, w, h, dpr, jetzt); try { gegnerMalen(jetzt); } catch (_) {}
      /* auf der eigenen Bühne: kurzer Hinweis, wenn der Gegner patzt */
      const ep = duell && duell.erPatzer;
      if (ep && jetzt - ep.t < 1.1 && jetzt >= 0) {
        const a = Math.min(1, (1.1 - (jetzt - ep.t)) / .4);
        const txt = dx().patzt(erName(), ep.n);
        g.globalAlpha = a; g.font = "italic 600 " + (14 * dpr) + "px Georgia, serif"; g.textAlign = "center";
        const tb = g.measureText(txt).width + 22 * dpr;
        g.fillStyle = "rgba(16,14,21,.82)"; g.strokeStyle = "rgba(127,178,255,.55)"; g.lineWidth = 1 * dpr;
        g.beginPath(); g.roundRect ? g.roundRect(w / 2 - tb / 2, 31 * dpr, tb, 22 * dpr, 11 * dpr) : g.rect(w / 2 - tb / 2, 31 * dpr, tb, 22 * dpr); g.fill(); g.stroke();
        g.fillStyle = "#7fb2ff"; g.textBaseline = "middle"; g.fillText(txt, w / 2, 42 * dpr); g.textBaseline = "alphabetic"; g.globalAlpha = 1;
      }
    }
    if (!spiel.pause && jetzt > spiel.daten.ende) { beenden(); return; }
    requestAnimationFrame(malen);
  }
  /* Online-Duell: was ich spiele, geht gesammelt an den Gegner (Note, Urteil) – so sieht er meine Spur neben seiner */
  const ART_NR = { perfekt: 1, gut: 2, knapp: 3 }, NR_ART = { 1: "perfekt", 2: "gut", 3: "knapp" };
  function zugMerken(n, art, spur) {
    if (!spiel || !spiel.duell || !duell) return;
    const i = n === -1 ? -1 : spiel.daten.liste.indexOf(n);
    (spiel.zuege = spiel.zuege || []).push(i === -1 ? [-1, art, spur, Math.round((hoerZeit() - spiel.start) * 100)] : [i, art]);
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
    szeneAuftritt();
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
    /* Im Duell gibt es keine Pause – das Lied läuft weiter (sonst liefen beide auseinander); nur den Ton wieder anwerfen */
    if (spiel && spiel.duell) { if (ctx.state !== "running" && ctx.state !== "closed") { const p = ctx.resume(); if (p && p.catch) p.catch(() => {}); } return; }
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
    if (root.classList.contains("tav-voll")) { if (root.classList.contains("at-fokus")) root.scrollTop = 0; else b.scrollIntoView({ block: "nearest" }); return; }
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
    if (szene) szene.vorhangZiel = .1;
    const y = grund(g, w, h, dpr), jetzt = k.bereit ? hoerZeit() - k.start : -1;
    buehneVorn(g, w, h, dpr, taktJetzt());
    const i = Math.floor(jetzt / KALIB_TAKT), seit = jetzt - i * KALIB_TAKT;
    const gezaehlt = new Set(k.tipps.map(x => Math.round(x / KALIB_TAKT)).filter(n => n >= KALIB_VOR && n < KALIB_VOR + KALIB_MIT)).size;
    g.textAlign = "center"; g.font = "italic " + (16 * dpr) + "px Georgia, serif";
    const ktx = i < KALIB_VOR ? T.kalib.vorzaehlen : T.kalib.mit(gezaehlt, KALIB_MIT), kb = g.measureText(ktx).width + 24 * dpr;
    g.fillStyle = "rgba(16,12,20,.78)"; g.fillRect(w / 2 - kb / 2, y * .3 - 22 * dpr, kb, 32 * dpr);
    g.fillStyle = "rgba(235,226,204,.92)"; g.fillText(ktx, w / 2, y * .3);
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
    if (stimmt) { stimmt = null; if (szene) szene.vorhangZiel = .34; zeichnen(); return; }
    if (!spiel) return;
    if (spiel.duell) duellAufgabe();
    clearTimeout(spiel.pauseUhr);
    if (ctx.state !== "running") { const p = ctx.resume(); if (p && p.catch) p.catch(() => {}); }
    (spiel.knoten || []).forEach(n => { try { n.stop(); } catch (_) {} });
    spiel.halt = {};
    if (bus) { const b = bus; b.gain.setTargetAtTime(0, ctx.currentTime, .04); setTimeout(() => { try { b.disconnect(); } catch (_) {} }, 300); bus = null; }
    spiel = null;
    if (szene) { szene.vorhangZiel = .34; szene.feuer = 0; }
    zeichnen();
  }
  /* ms: Zeitstempel des Eingabe-Ereignisses – so zählt der Moment des Tippens, nicht wann der Browser dazu kam */
  function tippen(spur, ms) {
    if (kalib) { kalibTipp(ms); return; }
    if (!spiel || spiel.pause != null) return;
    const jetzt = hoerZeit(ms) - spiel.start - kalibWert;
    spiel.blitz[spur] = 1;
    let best = null;
    spiel.daten.liste.forEach(n => { if (n.spur === spur && !n.status && Math.abs(n.zeit - jetzt) <= FENSTER.knapp && (!best || Math.abs(n.zeit - jetzt) < Math.abs(best.zeit - jetzt))) best = n; });
    if (!best) { daneben(ctx.currentTime); spiel.serie = 0; spiel.streu++; zeigeUrteil("daneben", spur); spiel.punkte = Math.max(0, spiel.punkte - FEHLGRIFF); zugMerken(-1, 9, spur); szenePatzer(spur); return; }
    const d = Math.abs(best.zeit - jetzt), art = d <= FENSTER.perfekt ? "perfekt" : d <= FENSTER.gut ? "gut" : "knapp";
    best.status = art; spiel.serie++; spiel.besteSerie = Math.max(spiel.besteSerie, spiel.serie); zugMerken(best, ART_NR[art]); szeneTreffer(art, spiel.serie, spur);
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
    if (anteil >= .85) { zeigeUrteil("gehalten", spur); zugMerken(n, 4); }
    else { n.losgelassen = hoerZeit() - spiel.start; hg.gain.setTargetAtTime(0, ctx.currentTime, .06); zugMerken(n, 5); }
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
    if (spiel.duell) { duellFertig({ w20, ges, prozent, getroffen, gesamt: liste.length }); return; }
    if (spiel.ort != null) { wegErgebnis(spiel.ort, { w20, ges, prozent, getroffen, gesamt: liste.length }); return; }
    const stufeText = w20 === 20 ? "krit" : w20 === 1 ? "patzer" : ges <= 11 ? "schwach" : ges <= 16 ? "maessig" : ges <= 21 ? "gut" : ges <= 25 ? "stark" : "legende";
    const rek = rekordLesen(), alt = rek[stufe] || 0, neu = ges > alt;
    if (neu) { rek[stufe] = ges; try { localStorage.setItem("imres-auftritt-rekord", JSON.stringify(rek)); } catch (_) {} }
    ergebnis = { lied: spiel.daten.lied, w20, summe: ges, prozent, getroffen, gesamt: liste.length, serie: spiel.besteSerie, streu: spiel.streu, zitat: zufall(T.stimmen[stufeText]), neu: neu && alt > 0, rekord: Math.max(alt, ges), frisch: true };
    szeneSchluss(ges >= 17);
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
      serie: spiel.besteSerie, streu: spiel.streu, neuerRang: bestanden && rangName(TX.de) !== vorher, frisch: true };
    szeneSchluss(bestanden);
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
  /* Lied aus der Auswahlliste */
  root.addEventListener("change", e => {
    const sel = e.target.closest && e.target.closest(".at-liedwahl"); if (!sel) return;
    if (spiel || stimmt) { sel.value = liedWahl; return; }
    if (duell) {
      if (!duell.s.host || (duell.phase !== "wahl" && duell.phase !== "warten" && duell.phase !== "ende")) { sel.value = liedWahl; return; }
      if (duell.phase === "ende") { duell.phase = "wahl"; ergebnis = null; duell.s.senden("zurueck", { r: duell.r }); duell.ichE = null; duell.erE = null; duell.rev = [false, false]; }
    }
    liedWahl = sel.value; if (liedWahl === "neu") erfunden = liedErfinden();
    try { localStorage.setItem("imres-auftritt-lied", liedWahl); } catch (_) {}
    ergebnis = null; zeichnen(); bestenLaden();
  });
  root.addEventListener("click", e => {
    const st = e.target.closest("[data-stufe]");
    if (st && !spiel && !stimmt) { stufe = st.dataset.stufe; try { localStorage.setItem("imres-auftritt-stufe", stufe); } catch (_) {} ergebnis = null; zeichnen(); bestenLaden(); return; }
    const ld = e.target.closest("[data-lied]");
    if (ld && !spiel && !stimmt) { liedWahl = ld.dataset.lied; if (liedWahl === "neu") erfunden = liedErfinden(); try { localStorage.setItem("imres-auftritt-lied", liedWahl); } catch (_) {} ergebnis = null; zeichnen(); bestenLaden(); return; }
    const md = e.target.closest("[data-modus]");
    if (md && !spiel && !stimmt) { if (md.dataset.modus !== modus) { modus = md.dataset.modus; ergebnis = null; try { localStorage.setItem("imres-auftritt-modus", modus); } catch (_) {} zeichnen(); if (modus === "lieder") bestenLaden(); } return; }
    const sw = e.target.closest("[data-station]");
    if (sw && !sw.disabled && !spiel && !stimmt) { stationWaehlen(+sw.dataset.station); return; }
    if (e.target.closest(".at-weiter") && !spiel && !stimmt) { stationWaehlen(wegStation + 1); buehneZeigen(); return; }
    const info = e.target.closest(".tav-info"); if (info && info.parentNode === root) { info.classList.toggle("offen"); return; }
    if (e.target.closest(".at-zurueck") && !spiel && !stimmt) { if (window.confirm(t().weg.sicher)) { weg = { frei: 0, sterne: [], neu: Date.now() }; wegSpeichern(true); stationWaehlen(0); } return; }
    if (e.target.closest(".at-eintragen")) { eintragen(); return; }
    if (e.target.closest(".at-pause")) { weiterspielen(); return; }
    if (e.target.closest(".at-pause-knopf")) { pausieren(); return; }
    if (e.target.closest(".at-stumm")) { stumm = !stumm; try { localStorage.setItem("imres-auftritt-stumm", stumm ? "1" : "0"); } catch (_) {} pegelSetzen(); tonNeu(); return; }
    if (e.target.closest(".at-kalib")) { kalib ? abbrechen() : kalibStarten(); return; }
    if (e.target.closest(".at-kalib-weg")) { kalibWert = 0; try { localStorage.removeItem("imres-auftritt-kalib"); } catch (_) {} kalibMeldung = ""; zeichnen(); return; }
    if (e.target.closest(".at-start")) { if (spiel || stimmt || kalib) abbrechen(); else { if (window.tavVollAuto) window.tavVollAuto("auftritt"); starten(); } }
  });
  root.addEventListener("input", e => {
    const r = e.target.closest(".at-laut"); if (!r) return;
    lautstaerke = Math.max(0, Math.min(1, (+r.value || 0) / 100));
    if (stumm && lautstaerke > 0) stumm = false;
    try { localStorage.setItem("imres-auftritt-laut", String(lautstaerke)); localStorage.setItem("imres-auftritt-stumm", stumm ? "1" : "0"); } catch (_) {}
    pegelSetzen(); tonNeu(true);
  });
  window.addEventListener("resize", () => { hoeheAnpassen(); if (!spiel && !kalib) malenRuhe(); });
  ["fullscreenchange", "webkitfullscreenchange"].forEach(n => document.addEventListener(n, () => setTimeout(() => { hoeheAnpassen(); if (!spiel && !kalib) malenRuhe(); }, 60)));
  if (window.ResizeObserver) new ResizeObserver(() => requestAnimationFrame(hoeheAnpassen)).observe(root);
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
    return '<div class="at-eintrag">' + ImresKuerzel.feld({ klasse: "at-name", aus: e.sendet }) +
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
    const feld = root.querySelector(".at-name"), name = ImresKuerzel.wert(feld);
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
.at-liedwahl { font: inherit; font-size: .85rem; color: var(--vellum); background: rgba(16,14,21,.85); border: 1px solid var(--ember); padding: .35rem .6rem; max-width: 100%; cursor: pointer; }
.at-liedwahl:disabled { opacity: .55; cursor: default; }
.at-stufen button[aria-pressed="true"] { border-color: var(--ember); background: rgba(224,160,70,.18); color: var(--ember); }
.at-buehne { position: relative; max-width: 35rem; width: 100%; margin: 0 auto; }
.at-canvas { display: block; width: 100%; height: clamp(300px, 52vw, 400px); background: radial-gradient(ellipse at 50% 90%, rgba(224,160,70,.14), transparent 70%), rgba(16,14,21,.7); border: 1px solid var(--line); touch-action: none; user-select: none; -webkit-user-select: none; cursor: pointer; }
.at-ergebnis { position: absolute; inset: 0; display: flex; flex-direction: column; gap: .5rem; padding: .8rem; text-align: center; background: rgba(16,14,21,.8); border: 1px solid var(--ember); overflow: hidden; }
.at-ergebnis[hidden] { display: none; }
.at-erg-inhalt { flex: 1 1 auto; min-height: 0; overflow-y: auto; display: grid; align-content: safe center; justify-items: center; gap: .45rem; }
.at-ergebnis.spaet { animation: aterg .6s ease 1.6s both; }
.at-ergebnis.spaet .at-w20 { animation-delay: 1.7s; animation-fill-mode: both; }
@keyframes aterg { from { opacity: 0; transform: translateY(10px); } }
@media (max-width: 520px), (max-height: 560px) { .at-ergebnis { gap: .35rem; padding: .55rem; } .at-erg-inhalt { gap: .3rem; } .at-ergebnis .at-zitat { font-size: .9rem; line-height: 1.35; } .at-w20 { width: 3.4rem; height: 3.4rem; font-size: 1.6rem; } }
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
.at-liste { max-width: 35rem; width: 100%; margin: 0 auto; }
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
.at-pfad .st { font-size: .7rem; letter-spacing: .02em; color: var(--ember); min-height: .8rem; }
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
/* Bühne: Höhe aus hoeheAnpassen(), Vorhang mit Start-Knopf, Leiste während des Spiels */
#taverne #auftritt .at-canvas { height: var(--at-h, clamp(300px, 52vw, 400px)); }
.at-vorhang { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: .7rem; padding: clamp(1.4rem, 7%, 2.6rem) clamp(.6rem, 9%, 3rem) 1rem; text-align: center; pointer-events: none; }
.at-v-karte { pointer-events: auto; max-width: 30rem; min-height: 0; overflow: hidden; display: grid; gap: .3rem; padding: .75rem 1.1rem; background: linear-gradient(rgba(16,12,20,.86), rgba(16,12,20,.74)); border: 1px solid rgba(224,160,70,.5); box-shadow: 0 12px 34px rgba(0,0,0,.55); animation: atvor .5s ease both; }
@keyframes atvor { from { opacity: 0; transform: translateY(-8px); } }
.at-v-kopf { margin: 0; font-family: var(--display); font-size: .74rem; letter-spacing: .14em; text-transform: uppercase; color: var(--ember); }
.at-v-titel { margin: 0; font-family: var(--name); font-size: 1.3rem; line-height: 1.15; color: var(--vellum); }
.at-v-text { margin: 0; font-style: italic; color: var(--vellum); font-size: .93rem; line-height: 1.4; display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 4; overflow: hidden; }
.at-v-klein { margin: 0; font-size: .8rem; color: var(--ash); }
.at-aktion { pointer-events: auto; flex: none; display: flex; flex-wrap: wrap; justify-content: center; align-items: center; gap: .5rem; }
.at-aktion .tav-knopf { min-height: 42px; background: rgba(16,12,20,.82); }
.at-aktion .tav-knopf:hover, .at-aktion .tav-knopf:focus-visible { background: var(--ember); color: var(--night); }
.at-aktion .tav-knopf.haupt { background: var(--ember); color: var(--night); font-size: 1.05rem; padding: .6rem 1.5rem; min-height: 46px; box-shadow: 0 0 24px rgba(224,160,70,.45); }
.at-aktion .tav-knopf.haupt:hover, .at-aktion .tav-knopf.haupt:focus-visible { background: #ffd27a; }
.at-aktion .at-duell-text { flex-basis: 100%; text-shadow: 0 1px 4px #000; }
.at-leiste { position: absolute; top: .4rem; right: .4rem; z-index: 2; display: flex; gap: .35rem; }
.at-leiste .tav-knopf { min-height: 36px; min-width: 36px; padding: .25rem .7rem; font-size: .82rem; background: rgba(16,12,20,.75); }
.tav-voll .at-leiste { right: 3.1rem; }
.at-wahl .kurz { display: none; }
/* Vollbild während des Auftritts: nur noch die Bühne */
#taverne #auftritt.tav-voll.at-fokus { padding: .3rem; row-gap: .3rem; }
#taverne #auftritt.tav-voll.at-fokus > :not(.at-buehne, .at-zwei, .at-duell-bar, .tav-voll-knopf) { display: none !important; }
/* Kleine Bildschirme: Auswahl kompakt, Stationstext steht auf dem Vorhang */
@media (max-width: 760px), (max-height: 560px) {
  #taverne #auftritt { row-gap: .5rem; }
  #auftritt .at-wahl .lang, #auftritt .at-wahl-titel, #auftritt .at-erfunden, #auftritt > .at-station { display: none; }
  #auftritt .at-wahl .kurz { display: inline; }
  #auftritt .at-wahl { flex-wrap: nowrap; }
  #auftritt .at-wahl button { flex: 1 1 0; min-width: 0; min-height: 40px; padding: .3rem .35rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  #auftritt .at-lieder { flex-wrap: nowrap; }
  #auftritt .at-liedwahl { flex: 1 1 auto; min-width: 0; min-height: 40px; }
  #auftritt .at-lieder button { min-height: 40px; min-width: 40px; }
  #auftritt:not(.tav-voll) > .tav-info { margin: 0; font-size: .88rem; line-height: 1.4; display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 2; overflow: hidden; cursor: pointer; }
  #auftritt > .tav-info.offen { -webkit-line-clamp: unset; display: block; }
  #auftritt .at-modus button { min-height: 38px; padding: .3rem .8rem; }
  #auftritt .at-weg-kopf { font-size: .8rem; }
  #auftritt .at-pfad { padding-bottom: .2rem; }
  #auftritt .at-pfad button { padding: .2rem .15rem; }
  #auftritt .at-pfad .sym { font-size: 1.05rem; }
  .at-vorhang { gap: .5rem; padding: 1.6rem .6rem .6rem; }
  .at-v-karte { padding: .55rem .8rem; gap: .2rem; }
  .at-v-titel { font-size: 1.08rem; }
  .at-v-text { font-size: .85rem; -webkit-line-clamp: 3; }
  .at-v-klein { display: none; }
  #taverne #auftritt.tav-voll.at-fokus .at-buehne { max-width: none; }
}
/* niedrige, breite Fenster (Handy quer, Handheld, Laptop): Auswahl links, Bühne rechts */
@media (max-height: 560px) and (min-width: 600px), (max-height: 820px) and (min-width: 1000px) {
  #taverne #auftritt:not(.tav-voll.at-fokus) { grid-template-columns: minmax(0, 1fr) minmax(0, 1.35fr); column-gap: 1rem; row-gap: 0; align-items: start; align-content: start; }
  #taverne #auftritt:not(.tav-voll.at-fokus) > * { grid-column: 1; margin-top: 0; margin-bottom: .5rem; }
  #taverne #auftritt:not(.tav-voll.at-fokus) > :is(.at-buehne, .at-zwei) { grid-column: 2; grid-row: 1 / span 18; max-width: none; margin-bottom: 0; }
  #auftritt .at-leiste { right: 3rem; }
}
@media (max-height: 820px) and (min-width: 1000px) {
  #taverne #auftritt:not(.tav-voll.at-fokus) { grid-template-columns: minmax(0, 1fr) minmax(0, 1.6fr); column-gap: 1.6rem; }
  #auftritt > .at-station .at-ort { font-size: 1.05rem; }
}
`;
  document.head.appendChild(css);

  /* ---------- Online-Duell (Verbindung und Lobby: duell.js) ----------
     Beide spielen dasselbe Stück zur selben Zeit. Der Gastgeber wählt Publikum und Lied; die Noten
     entstehen auf beiden Geräten aus derselben Vorlage (komponierte Lieder sind fest, ein erfundenes Lied
     wird ganz mitgeschickt). Start: Der Gast misst den Uhrenversatz (Ping-Pong), der Gastgeber nennt eine
     Startzeit in seiner Uhr, jeder rechnet sie in seine Audio-Uhr um. Unterwegs fliegen ~4× pro Sekunde
     die Zwischenstände hin und her, am Ende das Ergebnis. Keine Pause im Duell; nichts landet in der Bestenliste. */
  const DX = {
    de: { info: "⚔ Online-Duell: Ihr spielt dasselbe Lied zur selben Zeit – wer trifft besser?", infoHost: "Wähle Schwierigkeitsgrad und Lied, dann „Duell starten“.", infoGast: n => n + " wählt Schwierigkeitsgrad und Lied.",
      patzt: (n, k) => "😬 " + n + (k > 2 ? " patzt und patzt!" : k > 1 ? " patzt schon wieder!" : " patzt!"),
      keinePause: "Im Duell gibt es keine Pause: Wechselst du den Tab, läuft dein Lied weiter und verpasste Noten zählen.",
      warten: "Warte auf Gegner …", los: "⚔ Duell starten", waehlt: n => n + " wählt das Lied …", laden: "🎻 Instrumente werden gestimmt …", wartenAuf: n => "Warte auf " + n + " …",
      bereit: "▶ Bereit", bereitText: "Bereit – gleich geht es los …", tippBereit: "Tippe auf „Bereit“, damit dein Gerät den Ton spielen darf.",
      aufgeben: "Aufgeben", abbrechen: "Abbrechen", ergebnisWarte: n => "Warte auf das Ergebnis von " + n + " …",
      revanche: "⚔ Revanche", anderesLied: "🎵 Anderes Lied", revWarte: n => "Warte auf " + n + " …", revWill: n => n + " will eine Revanche!",
      titel: "Duell-Ergebnis", du: "Du", sieg: "🏆 Du gewinnst!", niederlage: n => n + " gewinnt!", remis: "Unentschieden!",
      zeilen: ["Treffsicherheit", "Auftrittswurf", "Beste Serie", "Treffer", "Fehlgriffe"],
      grund: { genau: "Die Treffsicherheit entscheidet.", wurf: "Gleich treffsicher – der Auftrittswurf entscheidet!", serie: "Gleichstand – die längere Serie entscheidet.", gleich: "Völliger Gleichstand.", aufgabe: n => n + " hat aufgegeben.", beide: "Beide haben aufgegeben." },
      aufgegeben: "aufgegeben", pausiert: "⏸ Gegner pausiert", fertig: "✔ fertig", zuSpaet: "Den Start verpasst – diese Runde zählt als aufgegeben.", gleich: "Gleich geht es los!", weg: n => n + " ist nicht mehr da." },
    en: { info: "⚔ Online duel: you both play the same song at the same time – who hits more?", infoHost: "Pick difficulty and song, then “Start duel”.", infoGast: n => n + " picks difficulty and song.",
      patzt: (n, k) => "😬 " + n + (k > 2 ? " fumbles again and again!" : k > 1 ? " fumbles again!" : " fumbles!"),
      keinePause: "There is no pause in a duel: if you switch tabs, your song keeps playing and missed notes count.",
      warten: "Waiting for an opponent …", los: "⚔ Start duel", waehlt: n => n + " is picking the song …", laden: "🎻 Tuning the instruments …", wartenAuf: n => "Waiting for " + n + " …",
      bereit: "▶ Ready", bereitText: "Ready – about to begin …", tippBereit: "Tap “Ready” so your device may play sound.",
      aufgeben: "Give up", abbrechen: "Cancel", ergebnisWarte: n => "Waiting for " + n + "'s result …",
      revanche: "⚔ Rematch", anderesLied: "🎵 Other song", revWarte: n => "Waiting for " + n + " …", revWill: n => n + " wants a rematch!",
      titel: "Duel result", du: "You", sieg: "🏆 You win!", niederlage: n => n + " wins!", remis: "Draw!",
      zeilen: ["Accuracy", "Performance check", "Best streak", "Hits", "Misplays"],
      grund: { genau: "Accuracy decides.", wurf: "Equally accurate – the performance check decides!", serie: "Tied – the longer streak decides.", gleich: "A perfect tie.", aufgabe: n => n + " gave up.", beide: "Both gave up." },
      aufgegeben: "gave up", pausiert: "⏸ Opponent paused", fertig: "✔ done", zuSpaet: "Missed the start – this round counts as given up.", gleich: "Here we go!", weg: n => n + " is no longer here." }
  };
  const dx = () => DX[sprache()];
  const hat = (o, k) => typeof k === "string" && Object.prototype.hasOwnProperty.call(o, k);
  const ganz = (x, a, b) => Number.isInteger(x) && x >= a && x <= b;
  let duell = null;
  /* duell = { s, phase: warten | wahl | laden | bereit | spiel | fertig | ende, r: Runde, cfg, vor: { daten, st, lied }, ichE, erE: Ergebnisse,
     er: { stand, bereit }, rev: [ich, er], tippen: Ton braucht einen Tipp, alt: gemerkte Wahl, takt: Zeitgeber } */
  function erfundenPruefen(x) {
    if (!x || typeof x !== "object" || !hat(MODI, x.modus)) return null;
    const E = TX.de.erfinden;
    if (![60, 62, 63, 64, 65].includes(x.grund) || ![.92, 1, 1.05, 1.12].includes(x.tempo) || (x.takt !== 12 && x.takt !== 16)) return null;
    if (!Array.isArray(x.folge) || x.folge.length !== 8 || !x.folge.every(g => ganz(g, 0, 6))) return null;
    if (!Array.isArray(x.melodie) || x.melodie.length !== 8 || !x.melodie.every(z => typeof z === "string" && z.length === x.takt && /^[0-9a-c.-]+$/.test(z))) return null;
    if (!Array.isArray(x.name) || x.name.length !== 3 || ![E.vorlage.length, E.adj.length, E.nom.length].every((m, i) => ganz(x.name[i], 0, m - 1))) return null;
    return { modus: x.modus, grund: x.grund, tempo: x.tempo, takt: x.takt, folge: x.folge.slice(), melodie: x.melodie.slice(), name: x.name.slice() };
  }
  /* Wahl (Publikum + Lied) prüfen: nur bekannte Stufen und Lieder des freien Spiels */
  function wahlPruefen(d) {
    if (!d || !hat(STUFEN, d.stufe)) return null;
    if (d.lied === "neu") { const n = erfundenPruefen(d.neu); return n ? { stufe: d.stufe, lied: "neu", neu: n } : null; }
    return hat(LIEDER, d.lied) && !LIEDER[d.lied].nurWeg ? { stufe: d.stufe, lied: d.lied } : null;
  }
  const wahlJetzt = () => (liedWahl === "neu" ? { stufe, lied: "neu", neu: aktuellesLied() } : { stufe, lied: liedWahl });
  const cfgLied = c => (c.lied === "neu" ? Object.assign({}, c.neu) : Object.assign({ key: c.lied }, LIEDER[c.lied]));
  function wahlUebernehmen(c) {
    stufe = c.stufe; liedWahl = c.lied;
    if (c.lied === "neu") erfunden = Object.assign({}, c.neu);
  }
  const erName = () => (duell ? duell.s.gegnerName() : "?");
  function duellBeginnen(s) {
    if (spiel || stimmt || kalib) { const d0 = duell; duell = null; abbrechen(); duell = d0; }
    duell = { s, phase: "warten", r: 0, cfg: null, vor: null, ichE: null, erE: null, er: { stand: null, bereit: -1 }, rev: [false, false], tippen: false,
      alt: { stufe, liedWahl, modus, erfunden }, gesendet: "", standZeit: 0, standText: "", takt: null, gewertet: -1, losBei: null };
    modus = "lieder"; ergebnis = null;
    duell.takt = setInterval(duellTakt, 250);
    s.on("wahl", d => { if (!duell || s.host) return; const c = wahlPruefen(d); if (!c) return; if (!spiel && (duell.phase === "wahl" || duell.phase === "ende" || duell.phase === "warten")) { wahlUebernehmen(c); if (duell.phase === "warten") duell.phase = "wahl"; zeichnen(); } });
    s.on("runde", d => { if (!duell || s.host || !ganz(d.r, 1, 1e6) || d.r <= duell.r) return; const c = wahlPruefen(d); if (c) duellLaden(d.r, c); });
    s.on("bereit", d => { if (!duell || !s.host || d.r !== duell.r) return; duell.er.bereit = d.r; if (duell.phase === "bereit") duellAnpfiff(); });
    s.on("los", d => { if (!duell || s.host || d.r !== duell.r || typeof d.T !== "number" || !isFinite(d.T)) return; duell.losBei = d.T; if (duell.phase === "bereit") duellStart(); });
    s.on("zug", d => {
      if (!duell || d.r !== duell.r || !Array.isArray(d.z) || !duell.vor) return;
      const liste = duell.vor.daten.liste, e = duell.erSpur = duell.erSpur || { status: new Map(), fehl: [] };
      d.z.slice(0, 200).forEach(z => {
        if (!Array.isArray(z)) return;
        if (z[0] === -1 && ganz(z[2], 0, 2) && typeof z[3] === "number") e.fehl.push({ spur: z[2], t: z[3] / 100 });
        else if (ganz(z[0], 0, liste.length - 1) && ganz(z[1], 1, 5)) { const alt = e.status.get(z[0]) || {}; if (z[1] <= 3) alt.art = NR_ART[z[1]]; else if (z[1] === 4) alt.gehalten = true; else alt.los = true; e.status.set(z[0], alt); }
      });
      if (e.fehl.length > 40) e.fehl.splice(0, e.fehl.length - 40);
    });
    s.on("stand", d => {
      if (!duell || d.r !== duell.r) return;
      if (!ganz(d.p, 0, 1e7) || !ganz(d.s, 0, 1e5) || !ganz(d.b, 0, 1e5) || !(d.pr === null || ganz(d.pr, 0, 100))) return;
      duell.er.stand = { p: d.p, s: d.s, b: d.b, pr: d.pr, h: d.h === 1 }; duellBalken();
    });
    s.on("ergebnis", d => { if (!duell || d.r !== duell.r || duell.erE) return; const e = ergebnisPruefen(d); if (!e) return; duell.erE = e; if (duell.phase === "fertig") duellEnde(); else duellBalken(); });
    s.on("revanche", d => { if (!duell || d.r !== duell.r || duell.phase !== "ende") return; duell.rev[1] = true; if (s.host && duell.rev[0]) duellRunde(); else zeichnen(); });
    s.on("zurueck", d => { if (!duell || !ganz(d.r, 0, 1e6) || d.r < duell.r) return; if (!spiel && duell.phase !== "fertig") duellZurWahl(false); });
    s.on("sync?", () => { if (duell && s.host) duellZustandSenden(); });
    s.on("zustand", d => {
      if (!duell || s.host || !ganz(d.r, 0, 1e6)) return;
      const c = d.cfg ? wahlPruefen(d.cfg) : null;
      if (d.r > duell.r && c && (d.phase === "laden" || d.phase === "bereit")) duellLaden(d.r, c);
      if (d.r === duell.r && typeof d.T === "number" && isFinite(d.T) && !spiel && (duell.phase === "laden" || duell.phase === "bereit")) { duell.losBei = d.T; if (duell.phase === "bereit") duellStart(); }
      if (d.phase === "wahl" && d.r >= duell.r && !spiel && duell.phase !== "fertig" && duell.phase !== "ende") { if (c) wahlUebernehmen(c); duellZurWahl(false); }
    });
    s.status((art, d) => {
      if (!duell || duell.s !== s) return;
      if (art === "partner") {
        if (d.neu && duell.phase !== "warten") { duellZurWahl(false); duell.erE = null; }
        if (duell.phase === "warten") duell.phase = "wahl";
        if (s.host) { duell.gesendet = ""; duellZustandSenden(); } else s.senden("sync?", {});
        duellErneutSenden();
      } else if (art === "verbindung" && d.ok && d.wieder) {
        if (s.host) duellZustandSenden(); else s.senden("sync?", {});
        duellErneutSenden();
      }
      if (!spiel) zeichnen(); else duellBalken();
    });
    zeichnen();
  }
  function duellBeenden(s) {
    if (!duell || duell.s !== s) return;
    const d = duell; duell = null;
    clearInterval(d.takt);
    if (spiel || stimmt) abbrechen();
    stufe = d.alt.stufe; liedWahl = d.alt.liedWahl; modus = d.alt.modus; erfunden = d.alt.erfunden;
    ergebnis = null; zeichnen(); bestenLaden();
  }
  function duellZustandSenden() {
    const d = duell; if (!d || !d.s.host) return;
    d.s.senden("wahl", wahlJetzt());
    d.s.senden("zustand", { r: d.r, phase: d.phase === "wahl" || d.phase === "warten" ? "wahl" : d.phase, cfg: d.cfg, T: d.losT || null });
  }
  /* nach einer Unterbrechung: eigenes Ergebnis und Revanche-Wunsch noch einmal schicken */
  function duellErneutSenden() {
    const d = duell; if (!d) return;
    if (d.ichE) d.s.senden("ergebnis", Object.assign({ r: d.r }, d.ichE));
    if (d.phase === "ende" && d.rev[0]) d.s.senden("revanche", { r: d.r });
    if (!d.s.host && d.phase === "bereit" && d.r) d.s.senden("bereit", { r: d.r });
  }
  function duellZurWahl(senden) {
    const d = duell; if (!d) return;
    if (senden) d.s.senden("zurueck", { r: d.r });
    d.phase = d.s.partner ? "wahl" : "warten"; d.vor = null; d.losBei = null; d.losT = null; d.ichE = null; d.erE = null; d.rev = [false, false];
    ergebnis = null;
    if (!spiel) zeichnen();
  }
  /* Gastgeber: neue Runde mit der aktuellen Wahl */
  function duellRunde() {
    const d = duell; if (!d || !d.s.host || !d.s.da() || spiel) return;
    audio();
    const c = wahlPruefen(wahlJetzt()); if (!c) return;
    const r = d.r + 1;
    d.s.senden("runde", Object.assign({ r }, c));
    duellLaden(r, c);
  }
  function duellLaden(r, c) {
    const d = duell; if (!d) return;
    if (kalib) kalibEnde(true);
    if (spiel) { const d0 = duell; duell = null; abbrechen(); duell = d0; }
    audio();
    wahlUebernehmen(c);
    d.r = r; d.cfg = c; d.phase = "laden"; d.ichE = null; d.erE = null; d.erSpur = null; d.er = { stand: null, bereit: d.er.bereit }; d.rev = [false, false]; d.losBei = null; d.losT = null; d.vor = null; d.tippen = false;
    ergebnis = null;
    const lied = cfgLied(c), st = STUFEN[c.stufe], daten = noten(st, lied); daten.lied = lied;
    zeichnen(); buehneZeigen();
    const fertig = () => {
      if (duell !== d || d.r !== r || d.phase !== "laden") return;
      SK = skala(lied.modus); GRUND = lied.grund;
      saite(hz(45), 1.8, .4986);
      daten.liste.forEach(n => { if (n.spur === 2) return; const m = MIDI[n.spur](n.ton); if (!probeBuf.has(probeName(SPUR_PROBE[n.spur], m))) { if (n.spur === 0) saite(bassHz(n.ton), 1.8, .4986); else saite(melHz(n.ton), 1.4, .4979); } });
      d.vor = { daten, st, lied };
      duellBereit();
    };
    const uhr = d.s.host ? Promise.resolve(null) : d.s.uhr(8).then(u => { if (u) d.versatz = u.versatz; d.uhrRtt = u ? u.rtt : null; });
    Promise.all([probenFuer(daten), uhr]).then(fertig);
  }
  function duellBereit() {
    const d = duell; if (!d) return;
    /* ohne laufende Audio-Uhr kein gemeinsamer Start: dann ein Tipp auf „Bereit“ */
    const weiter = () => {
      if (duell !== d || d.phase !== "laden" && d.phase !== "bereit") return;
      if (ctx.state !== "running") { d.tippen = true; d.phase = "bereit"; zeichnen(); return; }
      d.tippen = false; d.phase = "bereit";
      if (d.s.host) { if (d.er.bereit === d.r) duellAnpfiff(); else zeichnen(); }
      else { d.s.senden("bereit", { r: d.r }); if (d.losBei != null) duellStart(); else zeichnen(); }
    };
    if (ctx.state === "running") { weiter(); return; }
    const p = ctx.resume();
    let fertig = false; const einmal = () => { if (!fertig) { fertig = true; weiter(); } };
    if (p && p.then) p.then(einmal, einmal);
    setTimeout(einmal, 600);
  }
  /* Gastgeber: Startzeit festlegen – in vier Sekunden nach seiner Uhr */
  function duellAnpfiff() {
    const d = duell; if (!d || !d.s.host || d.phase !== "bereit" || d.tippen) return;
    const T = d.s.jetzt() + 4000;
    d.losT = T;
    d.s.senden("los", { r: d.r, T });
    d.losBei = T; duellStart();
  }
  function duellStart() {
    const d = duell; if (!d || !d.vor || spiel || d.tippen || d.losBei == null) return;
    const ziel = d.s.host ? d.losBei : d.losBei - (d.versatz || 0); /* Gastgeber-Uhr → eigene Uhr */
    const msBis = ziel - d.s.jetzt();
    if (msBis < -1500) { d.ichE = { aufgabe: true, prozent: 0, w20: 1, summe: 8, serie: 0, getroffen: 0, gesamt: d.vor.daten.liste.length, streu: 0, punkte: 0, spaet: true }; duellErgebnisSenden(); return; }
    const v = d.vor;
    SK = skala(v.lied.modus); GRUND = v.lied.grund;
    bus = ctx.createGain(); bus.connect(ausg);
    ergebnis = null;
    szeneAuftritt();
    spiel = { daten: v.daten, st: v.st, ort: null, start: hoerZeit() + msBis / 1000, punkte: 0, serie: 0, besteSerie: 0, streu: 0, blitz: [0, 0, 0], urteil: null, halt: {}, duell: true };
    spiel.knoten = begleitung(v.daten, spiel.start);
    /* für Tests: wann der Anfang des Lieds aus dem Lautsprecher kommt, in echter Uhrzeit (ohne Test-Versatz) */
    d.startEcht = (performance.timeOrigin || 0) + performance.now() + (spiel.start - hoerZeit()) * 1000;
    d.phase = "spiel"; d.standZeit = 0;
    zeichnen(); buehneZeigen();
    requestAnimationFrame(malen);
  }
  /* Zwischenstand: Treffsicherheit der Noten, die schon vorbei sind */
  function duellLauf() {
    if (!spiel) return null;
    const jetzt = hoerZeit() - spiel.start - kalibWert;
    let erreicht = 0, moeglich = 0;
    spiel.daten.liste.forEach(n => { if (n.status || n.zeit < jetzt - FENSTER.knapp) { erreicht += (PUNKTE[n.status] || 0) + (n.bonus || 0); moeglich += 100 + (n.dauer ? HALT_BONUS : 0); } });
    return moeglich ? Math.max(0, Math.min(100, Math.round((erreicht - spiel.streu * FEHLGRIFF) / moeglich * 100))) : null;
  }
  function duellTakt(sofort) {
    const d = duell; if (!d) return;
    if (spiel && spiel.duell) {
      /* versteckter Tab: kein requestAnimationFrame – verpasste Noten und das Ende hier werten */
      if (document.hidden) {
        const gewertet = hoerZeit() - spiel.start - kalibWert;
        Object.keys(spiel.halt).forEach(k => { const h = spiel.halt[k]; if (h && gewertet >= h.n.zeit + h.n.dauer) loslassen(+k, true); });
        spiel.daten.liste.forEach(n => { if (!n.status && n.zeit - gewertet < -FENSTER.knapp) { n.status = "daneben"; spiel.serie = 0; } });
        if (hoerZeit() - spiel.start > spiel.daten.ende) { beenden(); return; }
      }
      const st = { r: d.r, p: Math.round(spiel.punkte), s: spiel.serie, b: spiel.besteSerie, pr: duellLauf(), h: document.hidden ? 1 : 0 }, text = JSON.stringify(st);
      if (sofort === true || text !== d.standText || Date.now() - d.standZeit > 1000) { d.standText = text; d.standZeit = Date.now(); d.s.senden("stand", st); }
      if (spiel.zuege && spiel.zuege.length) { d.s.senden("zug", { r: d.r, z: spiel.zuege.splice(0, 120) }); }
      d.ichStand = st;
    }
    duellBalken();
  }
  document.addEventListener("visibilitychange", () => { if (duell) duellTakt(true); });
  function ergebnisPruefen(d) {
    if (!ganz(d.prozent, 0, 100) || !ganz(d.w20, 1, 20) || !ganz(d.summe, 8, 27) || !ganz(d.serie, 0, 1e5) || !ganz(d.getroffen, 0, 1e5) || !ganz(d.gesamt, 0, 1e5) || !ganz(d.streu, 0, 1e6) || !ganz(d.punkte, 0, 1e8)) return null;
    return { prozent: d.prozent, w20: d.w20, summe: d.summe, serie: d.serie, getroffen: d.getroffen, gesamt: d.gesamt, streu: d.streu, punkte: d.punkte, aufgabe: d.aufgabe === true };
  }
  function duellFertig(r) {
    const d = duell;
    d.ichE = { prozent: r.prozent, w20: r.w20, summe: r.ges, serie: spiel.besteSerie, getroffen: r.getroffen, gesamt: r.gesamt, streu: spiel.streu, punkte: Math.round(spiel.punkte), aufgabe: false };
    spiel = null; bus = null;
    duellErgebnisSenden();
  }
  function duellAufgabe() {
    const d = duell; if (!d || !spiel || d.ichE) return;
    d.ichE = { prozent: 0, w20: 1, summe: 8, serie: spiel.besteSerie, getroffen: spiel.daten.liste.filter(n => PUNKTE[n.status]).length, gesamt: spiel.daten.liste.length, streu: spiel.streu, punkte: Math.round(spiel.punkte), aufgabe: true };
    d.s.senden("ergebnis", Object.assign({ r: d.r }, d.ichE));
    d.phase = d.erE ? "ende" : "fertig"; if (d.erE) duellWerten();
    ergebnis = { duell: true };
  }
  function duellErgebnisSenden() {
    const d = duell;
    d.s.senden("ergebnis", Object.assign({ r: d.r }, d.ichE));
    ergebnis = { duell: true };
    if (d.erE) duellEnde(); else { d.phase = "fertig"; zeichnen(); }
  }
  /* wer gewinnt: Aufgabe verliert; dann Treffsicherheit, dann Auftrittswurf, dann längste Serie */
  function vergleich(a, b) {
    if (a.aufgabe || b.aufgabe) return a.aufgabe && b.aufgabe ? [0, "beide"] : [a.aufgabe ? -1 : 1, "aufgabe"];
    if (a.prozent !== b.prozent) return [a.prozent > b.prozent ? 1 : -1, "genau"];
    if (a.summe !== b.summe) return [a.summe > b.summe ? 1 : -1, "wurf"];
    if (a.serie !== b.serie) return [a.serie > b.serie ? 1 : -1, "serie"];
    return [0, "gleich"];
  }
  function duellWerten() {
    const d = duell;
    if (d.gewertet === d.r) return;
    d.gewertet = d.r;
    const [v] = vergleich(d.ichE, d.erE);
    if (window.ImresDuell) window.ImresDuell.bilanz("auftritt", v > 0 ? "sieg" : v < 0 ? "niederlage" : "remis");
    if (ctx) publikum(v >= 0);
    szeneSchluss(v >= 0);
  }
  function duellEnde() {
    const d = duell; if (!d || !d.ichE || !d.erE) return;
    d.phase = "ende"; ergebnis = { duell: true };
    duellWerten();
    if (!spiel) zeichnen();
  }
  /* ---------- Duell: Oberfläche ---------- */
  function duellKnoepfe(T) {
    const D = dx(), d = duell, n = esc(erName()), host = d.s.host, da = d.s.da();
    const text = x => '<p class="at-duell-text" role="status">' + x + "</p>";
    if (spiel) return '<button type="button" class="tav-knopf at-start">' + D.aufgeben + "</button>";
    if (d.phase === "warten") return text(D.warten);
    if (d.phase === "wahl") return host ? '<button type="button" class="tav-knopf at-duell-los"' + (da ? "" : " disabled") + ">" + D.los + "</button>" : text(D.waehlt(n));
    if (d.phase === "laden") return text(D.laden) + '<button type="button" class="tav-knopf at-duell-ab">' + D.abbrechen + "</button>";
    if (d.phase === "bereit") {
      if (d.tippen) return '<button type="button" class="tav-knopf at-duell-bereit">' + D.bereit + "</button>" + text(D.tippBereit);
      return text(host ? D.wartenAuf(n) : D.bereitText) + '<button type="button" class="tav-knopf at-duell-ab">' + D.abbrechen + "</button>";
    }
    if (d.phase === "fertig") return text(D.ergebnisWarte(n));
    if (d.phase === "ende") {
      const zusatz = d.rev[0] ? D.revWarte(n) : d.rev[1] ? D.revWill(n) : "";
      return '<button type="button" class="tav-knopf at-duell-revanche' + (d.rev[1] && !d.rev[0] ? " lockt" : "") + '"' + (d.rev[0] || !da ? " disabled" : "") + ">" + D.revanche + "</button>" +
        (host ? '<button type="button" class="tav-knopf at-duell-wahl">' + D.anderesLied + "</button>" : "") + (zusatz ? text(zusatz) : "");
    }
    return "";
  }
  function duellErgebnisHtml(T) {
    const D = dx(), d = duell; if (!d) return "";
    const a = d.ichE, b = d.erE, n = erName();
    let kopf = "", grund = "";
    if (a && b) {
      const [v, g] = vergleich(a, b);
      kopf = v > 0 ? D.sieg : v < 0 ? D.niederlage(n) : D.remis;
      grund = g === "aufgabe" ? D.grund.aufgabe(a.aufgabe ? D.du : n) : D.grund[g];
    } else kopf = D.ergebnisWarte(n);
    const wert = (e, f) => !e ? "…" : f(e);
    const zeilen = [
      e => e.aufgabe ? D.aufgegeben : e.prozent + " %",
      e => e.aufgabe ? "–" : (sprache() === "en" ? "d20 " : "W20 ") + e.w20 + " → " + e.summe,
      e => String(e.serie),
      e => e.getroffen + " / " + e.gesamt,
      e => String(e.streu)
    ];
    const besser = (i) => { if (!a || !b || i > 2) return ["", ""]; const x = [a.prozent, a.summe, a.serie][i], y = [b.prozent, b.summe, b.serie][i]; if (a.aufgabe || b.aufgabe || x === y) return ["", ""]; return x > y ? [" class=\"besser\"", ""] : ["", " class=\"besser\""]; };
    return '<p class="label">' + D.titel + "</p>" +
      '<p class="at-duell-sieger' + (a && b ? "" : " warte") + '">' + esc(kopf) + "</p>" +
      '<table class="at-duell-tab"><thead><tr><th></th><th>' + esc(D.du) + "</th><th>" + esc(n) + "</th></tr></thead><tbody>" +
      zeilen.map((f, i) => { const [x, y] = besser(i); return "<tr><td>" + D.zeilen[i] + "</td><td" + x + ">" + esc(wert(a, f)) + "</td><td" + y + ">" + esc(wert(b, f)) + "</td></tr>"; }).join("") +
      "</tbody></table>" + (grund ? '<p class="at-werte">' + esc(grund) + "</p>" : "") +
      (a && a.spaet ? '<p class="at-werte">' + D.zuSpaet + "</p>" : "") +
      (d.s.partner && d.s.partner.weg && !b ? '<p class="at-werte">' + esc(D.weg(n)) + "</p>" : "");
  }
  function duellZeichnen() {
    const d = duell, D = dx(), host = d.s.host;
    root.prepend(d.s.leiste());
    ["at-modus", "at-weg-fuss", "at-liste", "at-eintrag-box"].forEach(k => { const el = root.querySelector("." + k); if (el) el.remove(); });
    const info = root.querySelector(".tav-info");
    if (info) info.innerHTML = esc(D.info) + " " + esc(d.s.partner ? (host ? D.infoHost : D.infoGast(erName())) : "") + '<br><strong class="at-keine-pause">' + esc(D.keinePause) + "</strong>";
    if (!host || d.phase !== "wahl" && d.phase !== "warten" && d.phase !== "ende") root.querySelectorAll("[data-stufe], [data-lied], .at-liedwahl").forEach(b => { b.disabled = true; });
    const bh = root.querySelector(".at-buehne");
    if (bh && !root.querySelector(".at-duell-bar")) { const bar = document.createElement("div"); bar.className = "at-duell-bar"; bh.before(bar); }
    duellBalken(); gegnerFlaeche();
    /* Gastgeber: Wahl dem Gast zeigen */
    if (host && d.s.da() && (d.phase === "wahl" || d.phase === "ende")) { const w = JSON.stringify(wahlJetzt()); if (w !== d.gesendet) { d.gesendet = w; d.s.senden("wahl", wahlJetzt()); } }
  }
  function duellBalken() {
    const d = duell, bar = root.querySelector(".at-duell-bar"); if (!d || !bar) return;
    const D = dx(), T = t(), ich = d.ichStand, er = d.er.stand, laeuft = d.phase === "spiel" || d.phase === "fertig" || d.phase === "ende";
    bar.hidden = !laeuft || !d.s.partner;
    if (bar.hidden) return;
    const seite = (name, st, e, klasse, pause) => '<span class="at-db ' + klasse + '"><b>' + esc(name) + "</b> " +
      (e ? (e.aufgabe ? esc(D.aufgegeben) : e.punkte + '<span class="at-db-wort"> ' + esc(T.punkte) + "</span> · " + e.prozent + " % <em>" + esc(D.fertig) + "</em>")
        : st ? st.p + '<span class="at-db-wort"> ' + esc(T.punkte) + "</span>" + (st.pr != null ? " · " + st.pr + " %" : "") + (st.s >= 3 ? ' · <span class="at-db-serie">×' + st.s + "</span>" : "") : "–") +
      (pause ? ' <em class="at-db-pause">' + esc(D.pausiert) + "</em>" : "") + "</span>";
    const html = seite(D.du, ich && d.phase === "spiel" ? ich : null, d.phase !== "spiel" ? d.ichE : null, "ich", false) +
      seite(erName(), er, d.erE, "er", !!(er && er.h && !d.erE) || !!(d.s.partner && d.s.partner.weg && !d.erE));
    if (bar.innerHTML !== html) bar.innerHTML = html;
  }
  /* Gegner-Spur neben der eigenen: dieselben Noten, eingefärbt nach seinen Treffern.
     Sie läuft eine gute halbe Sekunde hinterher – so sind seine Treffer schon angekommen, wenn die Note die Linie erreicht. */
  const ER_VERZUG = .6;
  function gegnerMalen(jetztIch) {
    const c = root.querySelector(".at-canvas-er"); if (!c || !duell || !duell.vor || c.offsetParent === null) return;
    /* gleiche Höhe wie die eigene Bühne – dann liegen beide goldenen Linien auf einer Höhe */
    const eigen = canvas(); if (eigen && eigen.offsetHeight && Math.abs(c.offsetHeight - eigen.offsetHeight) > 1) c.style.height = eigen.offsetHeight + "px";
    const { w, h, dpr } = maße(c), g = c.getContext("2d"), jetzt = jetztIch - ER_VERZUG, e = duell.erSpur || { status: new Map(), fehl: [] };
    g.clearRect(0, 0, w, h);
    const bahn = w / 3, y = h * .82, flug = spiel.st.flug, liste = duell.vor.daten.liste, blau = "127,178,255";
    /* Patzer des Gegners: verpasste Note oder Fehlgriff – kurz rot, ein dumpfer Ton und ein Hinweis auf der eigenen Bühne */
    e.gemeldet = e.gemeldet || new Set(); e.patzer = e.patzer || [];
    const patzer = (schluessel, spur) => { if (e.gemeldet.has(schluessel)) return; e.gemeldet.add(schluessel); if (jetztIch < 0) return;
      e.patzer.push({ spur, t: jetzt }); duell.erPatzer = { t: jetztIch, n: (duell.erPatzer && jetztIch - duell.erPatzer.t < 1.2 ? duell.erPatzer.n + 1 : 1) };
      try { const z = ctx.currentTime; rauschen(z, "bandpass", 520, .16, .06); zupfen(hz(36), z, .12, true); } catch (_) {} };
    liste.forEach((n, i) => { if (!e.status.has(i) && n.zeit < jetzt - FENSTER.knapp - .25 && n.zeit > jetzt - 1.5) patzer("n" + i, n.spur); });
    e.fehl.forEach(f => { if (jetzt >= f.t && jetzt - f.t < 1) patzer("f" + f.t + ":" + f.spur, f.spur); });
    if (e.patzer.length > 20) e.patzer.splice(0, e.patzer.length - 20);
    const blitz = [0, 0, 0];
    for (let i = 0; i < 3; i++) {
      const grad = g.createLinearGradient(0, 0, 0, h); grad.addColorStop(0, "rgba(" + blau + ",0.02)"); grad.addColorStop(1, "rgba(" + blau + ",0.07)");
      g.fillStyle = grad; g.fillRect(i * bahn + 2 * dpr, 0, bahn - 4 * dpr, h);
    }
    /* Treffer-Leuchten und Fehlgriffe der letzten Augenblicke */
    liste.forEach((n, i) => { const st = e.status.get(i); if (st && st.art) { const dt = jetzt - n.zeit; if (dt >= 0 && dt < .3) blitz[n.spur] = Math.max(blitz[n.spur], 1 - dt / .3); } });
    blitz.forEach((b, i) => { if (b > 0) { g.fillStyle = "rgba(255,210,122," + (.22 * b) + ")"; g.fillRect(i * bahn + 2 * dpr, 0, bahn - 4 * dpr, h); } });
    e.patzer.forEach(f => { const dt = jetzt - f.t; if (dt >= 0 && dt < .45) { g.fillStyle = "rgba(196,86,74," + (.38 * (1 - dt / .45)) + ")"; g.fillRect(f.spur * bahn + 2 * dpr, 0, bahn - 4 * dpr, h); } });
    g.strokeStyle = "rgba(" + blau + ",.9)"; g.lineWidth = 3 * dpr; g.shadowColor = "rgba(" + blau + ",.8)"; g.shadowBlur = 10 * dpr;
    g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); g.shadowBlur = 0;
    for (let i = 0; i < 3; i++) { g.strokeStyle = "rgba(" + blau + ",.5)"; g.lineWidth = 2 * dpr; g.beginPath(); g.arc(i * bahn + bahn / 2, y, 16 * dpr, 0, Math.PI * 2); g.stroke(); }
    const r = Math.min(17 * dpr, bahn * .22);
    liste.forEach((n, i) => {
      const st = e.status.get(i) || {}, vorbei = n.zeit < jetzt - FENSTER.knapp - .25;
      const x = n.spur * bahn + bahn / 2;
      if (n.dauer) {
        const ende = n.zeit + n.dauer; if (ende - jetzt < -.1 || n.zeit - jetzt > flug) return;
        const haelt = st.art && !st.los && !st.gehalten && jetzt >= n.zeit && jetzt < ende;
        const kopf = haelt ? y : y - ((n.zeit - jetzt) / flug) * y, yEnde = Math.max(0, y - ((ende - jetzt) / flug) * y);
        if (kopf > yEnde && !(st.art && jetzt > n.zeit && !haelt)) { g.globalAlpha = (!st.art && vorbei) || st.los ? .2 : haelt ? .9 : .5; g.fillStyle = FARBEN[n.spur]; g.fillRect(x - 6 * dpr, yEnde, 12 * dpr, kopf - yEnde); g.globalAlpha = 1; }
      }
      if (st.art && jetzt >= n.zeit) return; /* getroffen: verschwindet an der Linie */
      const dt = n.zeit - jetzt; if (dt > flug || dt < -.4) return;
      const ny = y - (dt / flug) * y;
      g.globalAlpha = vorbei ? .28 : 1; g.fillStyle = FARBEN[n.spur];
      g.beginPath(); g.roundRect ? g.roundRect(x - r * 1.4, ny - r * .7, r * 2.8, r * 1.4, 6 * dpr) : g.rect(x - r * 1.4, ny - r * .7, r * 2.8, r * 1.4); g.fill();
      g.fillStyle = "#16121a"; g.font = (13 * dpr) + "px serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(ZEICHEN[n.spur], x, ny + 1); g.textBaseline = "alphabetic"; g.globalAlpha = 1;
    });
    /* „Daneben!“ beim Gegner */
    const lp = e.patzer[e.patzer.length - 1];
    if (lp && jetzt - lp.t < .6) { const a = 1 - (jetzt - lp.t) / .6; g.globalAlpha = a; g.textAlign = "center"; g.font = "bold " + (18 * dpr) + "px Georgia, serif"; g.fillStyle = "#c4564a";
      g.fillText(t().urteil.daneben, lp.spur * bahn + bahn / 2, y - 60 * dpr - (1 - a) * 16 * dpr); g.globalAlpha = 1; }
    /* letztes Urteil */
    let letzt = null;
    liste.forEach((n, i) => { const st = e.status.get(i); if (st && st.art && n.zeit <= jetzt && (!letzt || n.zeit > letzt.n.zeit)) letzt = { n, art: st.art }; });
    if (letzt && jetzt - letzt.n.zeit < .6) {
      const a = 1 - (jetzt - letzt.n.zeit) / .6; g.globalAlpha = a; g.textAlign = "center"; g.font = "bold " + (18 * dpr) + "px Georgia, serif";
      g.fillStyle = letzt.art === "perfekt" ? "#ffd27a" : "#ebe2cc"; g.fillText(t().urteil[letzt.art], letzt.n.spur * bahn + bahn / 2, y - 36 * dpr - (1 - a) * 16 * dpr); g.globalAlpha = 1;
    }
    const er = duell.er.stand;
    g.fillStyle = "rgba(" + blau + ",1)"; g.textAlign = "left"; g.font = "600 " + (14 * dpr) + "px Georgia, serif";
    g.fillText(erName(), 10 * dpr, 22 * dpr);
    g.fillStyle = "#ebe2cc"; g.font = (13 * dpr) + "px Georgia, serif";
    if (er) { g.fillText(er.p + " " + t().punkte, 10 * dpr, 40 * dpr); if (er.s >= 5) { g.textAlign = "right"; g.fillStyle = "#e0a046"; g.fillText(t().serie(er.s), w - 10 * dpr, 22 * dpr); } }
    if (jetztIch < 0) { g.fillStyle = "rgba(16,14,21,.5)"; g.fillRect(0, 0, w, y - 30 * dpr); }
  }
  /* Bühne im Duell zweigeteilt: links ich, rechts der Gegner */
  function gegnerFlaeche() {
    const d = duell, bh = root.querySelector(".at-buehne"); if (!d || !bh) return;
    const zeigen = d.phase === "spiel" && !!spiel && d.s.partner;
    let zwei = root.querySelector(".at-zwei");
    if (zeigen && !zwei) {
      zwei = document.createElement("div"); zwei.className = "at-zwei"; bh.before(zwei); zwei.appendChild(bh);
      const er = document.createElement("div"); er.className = "at-er"; er.innerHTML = '<canvas class="at-canvas-er" aria-label="' + esc(erName()) + '"></canvas>'; zwei.appendChild(er);
    } else if (!zeigen && zwei) { zwei.before(bh); zwei.remove(); }
    root.classList.toggle("at-im-duell", !!zeigen);
  }
  function duellMalen(g, w, h, dpr, jetzt) {
    if (jetzt >= 0) return;
    const D = dx(), y = h * .82, zahl = Math.ceil(-jetzt);
    g.fillStyle = "rgba(16,14,21,.55)"; g.fillRect(0, 0, w, y - 30 * dpr);
    g.textAlign = "center"; g.textBaseline = "middle";
    g.fillStyle = "#ffd27a"; g.shadowColor = "rgba(255,210,122,.6)"; g.shadowBlur = 24 * dpr;
    g.font = (72 * dpr) + "px Georgia, serif"; g.fillText(String(zahl), w / 2, y * .42); g.shadowBlur = 0;
    g.fillStyle = "rgba(235,226,204,.85)"; g.font = "italic " + (15 * dpr) + "px Georgia, serif";
    g.fillText(D.gleich + "  ·  " + D.du + " vs " + erName(), w / 2, y * .42 + 58 * dpr);
    g.textBaseline = "alphabetic";
  }
  function duellKnopfHtml() { return window.ImresDuell ? '<button type="button" class="tav-knopf duell-knopf at-duell-oeffnen">' + (sprache() === "en" ? "⚔ Online duel" : "⚔ Online-Duell") + "</button>" : ""; }
  root.addEventListener("click", e => {
    if (!duell) { if (e.target.closest(".at-duell-oeffnen") && window.ImresDuell) { duellAnmelden(); window.ImresDuell.oeffnen("auftritt"); } return; }
    /* Gast: Publikum und Lied wählt der Gastgeber; Modus-Wechsel gibt es im Duell nicht */
    if ((e.target.closest("[data-stufe], [data-lied]") && (!duell.s.host || (duell.phase !== "wahl" && duell.phase !== "warten" && duell.phase !== "ende"))) || e.target.closest("[data-modus], [data-station], .at-weiter, .at-zurueck, .at-eintragen")) { e.stopPropagation(); e.preventDefault(); return; }
    if (e.target.closest("[data-stufe], [data-lied]") && duell.phase === "ende") { duell.phase = "wahl"; ergebnis = null; duell.s.senden("zurueck", { r: duell.r }); duell.ichE = null; duell.erE = null; duell.rev = [false, false]; return; }
    if (e.target.closest(".at-duell-los")) { if (window.tavVollAuto) window.tavVollAuto("auftritt"); duellRunde(); return; }
    if (e.target.closest(".at-duell-ab")) { duellZurWahl(true); return; }
    if (e.target.closest(".at-duell-bereit")) { if (window.tavVollAuto) window.tavVollAuto("auftritt"); audio(); duellBereit(); return; }
    if (e.target.closest(".at-duell-wahl")) { duellZurWahl(true); return; }
    if (e.target.closest(".at-duell-revanche")) { if (duell.phase !== "ende" || duell.rev[0]) return; if (window.tavVollAuto) window.tavVollAuto("auftritt"); duell.rev[0] = true; duell.s.senden("revanche", { r: duell.r }); if (duell.s.host && duell.rev[1]) duellRunde(); else zeichnen(); }
  }, true);
  /* Ton im Duell bei jeder Berührung freischalten (iOS) */
  root.addEventListener("pointerdown", () => { if (duell && (!ctx || ctx.state !== "running")) audio(); }, true);
  function duellAnmelden() {
    if (!window.ImresDuell || duellAnmelden.fertig) return;
    duellAnmelden.fertig = true;
    window.ImresDuell.registrieren("auftritt", { kartenId: "auftritt", titel: () => t().titel, hinweis: () => dx().keinePause, beginnen: duellBeginnen, beenden: duellBeenden, geste: () => { try { audio(); } catch (_) {} } });
  }
  document.addEventListener("imres:duell-bereit", duellAnmelden);
  duellAnmelden();
  const duellCss = document.createElement("style");
  duellCss.textContent = `
.at-duell-knopf-zeile { display: flex; justify-content: center; }
.at-zwei { display: grid; grid-template-columns: minmax(0, 1.5fr) minmax(0, 1fr); gap: .5rem; max-width: 62.5rem; width: 100%; margin: 0 auto; align-items: start; }
.at-zwei .at-buehne { max-width: none; margin: 0; }
.at-er { min-width: 0; }
.at-canvas-er { display: block; width: 100%; height: clamp(300px, 52vw, 400px); background: radial-gradient(ellipse at 50% 90%, rgba(127,178,255,.1), transparent 70%), rgba(16,14,21,.7); border: 1px solid rgba(127,178,255,.4); pointer-events: none; }
@media (min-width: 900px) { .at-zwei { grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); } }
.auftritt.at-im-duell .at-duell-bar { max-width: 62.5rem; }
.at-duell-text { margin: 0; flex-basis: 100%; text-align: center; font-family: var(--name); font-size: 1.05rem; color: var(--vellum); }
.at-fuss .at-duell-text { order: 2; }
.at-keine-pause { color: #ffd27a; font-weight: 400; font-size: .9em; }
.at-duell-bar { max-width: 35rem; width: 100%; margin: 0 auto -.4rem; display: grid; grid-template-columns: 1fr 1fr; gap: .4rem; font-size: .82rem; }
.at-duell-bar[hidden] { display: none; }
.at-db { padding: .3rem .55rem; border: 1px solid var(--line); background: rgba(16,14,21,.7); color: var(--ash); min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.at-db b { color: var(--vellum); font-weight: 600; }
.at-db.ich { border-color: rgba(224,160,70,.55); }
.at-db.er { border-color: rgba(127,178,255,.5); text-align: right; }
.at-db em { font-style: normal; color: var(--ember); }
.at-db .at-db-serie { color: #ffd27a; }
.at-db .at-db-pause { color: #e08a7e; }
.at-duell-sieger { margin: 0; font-family: var(--name); font-size: 1.5rem; color: #ffd27a; line-height: 1.1; }
.at-duell-sieger.warte { font-size: 1.05rem; color: var(--vellum); }
.at-duell-tab { border-collapse: collapse; font-size: .88rem; min-width: min(20rem, 100%); }
.at-duell-tab th { font-weight: 600; color: var(--vellum); padding: .2rem .5rem; border-bottom: 1px solid var(--line); max-width: 8rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.at-duell-tab td { padding: .22rem .5rem; color: var(--vellum); border-bottom: 1px solid rgba(235,226,204,.06); }
.at-duell-tab td:first-child { color: var(--ash); text-align: left; font-size: .8rem; }
.at-duell-tab td.besser { color: #ffd27a; font-weight: 600; }
.at-duell-revanche.lockt { background: var(--ember); color: var(--night); }
.auftritt .at-fuss button:disabled { opacity: .55; cursor: default; }
.auftritt .at-stufen button:disabled { cursor: default; }
.auftritt .at-stufen button:disabled:not([aria-pressed="true"]) { opacity: .45; }
@media (max-width: 520px) { .at-db-wort { display: none; } .at-db { font-size: .78rem; padding: .3rem .45rem; } .at-duell-tab { font-size: .8rem; } .at-duell-tab td, .at-duell-tab th { padding: .15rem .35rem; } .at-duell-sieger { font-size: 1.25rem; } }
`;
  document.head.appendChild(duellCss);
  root._duell = () => duell && { phase: duell.phase, r: duell.r, host: duell.s.host, startEcht: duell.startEcht, versatz: duell.versatz, uhrRtt: duell.uhrRtt, cfg: duell.cfg, ichE: duell.ichE, erE: duell.erE,
    er: duell.er.stand, erZuege: duell.erSpur ? duell.erSpur.status.size : 0, rev: duell.rev.slice(), tippen: duell.tippen, noten: duell.vor ? duell.vor.daten.liste.map(n => [Math.round(n.zeit * 1e4), n.spur, n.ton, Math.round((n.dauer || 0) * 1e4)]) : null }; /* für automatische Tests */

  root._zustand = () => ({ spiel, ctx, stimmt, kalib, kalibWert, weg, proben: [...probeBuf.keys()], hoerZeit: ms => hoerZeit(ms) }); /* für automatische Tests */
  root._szene = () => szene; /* für automatische Tests: Kulisse, Band, Publikum */
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
