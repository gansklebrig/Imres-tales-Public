/* =====================================================================
   FRIEDRICHS JAGD – Bogenspiel in der Taverne
   ---------------------------------------------------------------------
   Friedrich erzählt die Kampagne nach, Kapitel für Kapitel:
   Straße nach Phandalin → Goblinhöhle → Schloss Crackmore → Wachturm →
   magische Schmiede → Donnerbaum → Ausbruch im Unterreich →
   Spinnweben → unterirdischer See → Gracklstugh → endlose Nacht.
   Jedes Kapitel hat eine eigene Kulisse (waldlauf-welten.js), eigene
   Gegner (waldlauf-figuren.js malt die, für die es kein Bild gibt) und
   einen Höhepunkt (Glasstab, Nezna, Venomfang, Ilvara, Wraith,
   Demogorgon, der rasende Riese …).
   Ziehen & loslassen spannt den Bogen. Rex bellt, bevor etwas
   auftaucht. Nach jeder Welle wählt man eine Gabe.
   Drei Schwierigkeitsstufen, Pause, Bonusziele, Kapitelwahl (Übung)
   und eine gemeinsame Bestenliste (Supabase-Tabelle jagd_bestenliste).
   ===================================================================== */
(function () {
  "use strict";
  const root = document.getElementById("waldlauf");
  const FIG = window.WALDLAUF_FIGUREN, WELT = window.WALDLAUF_WELTEN;
  if (!root || !FIG || !WELT) return;

  const sprache = () => (document.documentElement.lang === "en" ? "en" : "de");
  const esc = s => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const zufall = l => l[Math.floor(Math.random() * l.length)];
  const lies = (k, d) => { try { const v = localStorage.getItem(k); return v == null ? d : v; } catch (_) { return d; } };
  const schreib = (k, v) => { try { localStorage.setItem(k, v); } catch (_) {} };
  const ruhig = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const mischen = l => { for (let i = l.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [l[i], l[j]] = [l[j], l[i]]; } return l; };
  const ROEMISCH = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];

  /* ---------- Texte ---------- */
  const TX = {
    de: {
      label: "Waldläufer-Probe", titel: "Friedrichs Jagd",
      text: "Friedrich erzählt eure Kampagne nach: vom Hinterhalt auf der Straße bis nach Gracklstugh. Spann den Bogen, halte die Gegner vom Lager fern und hör auf Rex: Er wittert sie zuerst.",
      steuerung: "Irgendwo ins Bild tippen, zurückziehen, zielen, loslassen. Je weiter du ziehst, desto kräftiger der Schuss.",
      start: "▶ Auf die Jagd", weiter: "▶ Weiter", nochmal: "↻ Neue Jagd", beenden: "Jagd beenden",
      pause: "Kurze Rast", pauseText: "Die Jagd wartet auf dich.", pauseKnopf: "Pause",
      hud: (k, n) => k + " · Welle " + n, welle: n => "Welle " + n, serie: n => "Serie ×" + n,
      kapitel: "Kapitel", kapWahl: "Ab Kapitel", uebung: "Übungsjagd: zählt nicht für die Bestenliste.", uebungEnde: "Übungsjagd – zählt nicht für die Bestenliste.",
      kapGeschafft: r => "Kapitel " + r + " geschafft!", neuFrei: n => "Neue Gabe am Lagerfeuer: " + n, neu: "Neu",
      kap: [
        { titel: "Der Weg nach Phandalin", text: "Gundren hat uns angeheuert, einen Karren nach Phandalin zu bringen. Tagelang nur Staub und Barradins Reiselieder. Dann liegt ein brennender Wagen quer über der Straße, und Rex knurrt. Goblins.", wellen: ["Hinterhalt auf der Straße", "Noch mehr aus dem Gebüsch"] },
        { titel: "Die Goblinhöhle", text: "Echo folgt den Spuren bis zu einer Höhle im Felsspalt. Am Eingang winseln angebundene Wölfe. Die befreien wir. Also: Wenn ein Wolf vorbeiläuft, Finger weg von der Sehne.", wellen: ["Wölfe am Eingang", "Das Goblinnest"] },
        { titel: "Schloss Crackmore", text: "In Phandalin pressen die Roten Roben den Leuten Geld ab. Den geheimen Gang ins Schloss hat Rex gefunden, als er einem Kaninchen nachjagte. Drinnen wartet Glasstab. Er springt hin und her, und wenn es eng wird, rennt er.", wellen: ["Die Roten Roben", "Glasstabs Labor"] },
        { titel: "Der Wachturm", text: "Sternklare Nacht, ein Gefangener im Turm. Ich stoße die Tür auf: ein Goblin, ein Bugbear und Nezna, eine Drow. Ist sie verwundet, wird sie zur Fledermaus und flieht. Holt sie vorher vom Himmel.", wellen: ["Die Tür fliegt auf", "Der Bugbear erhebt sich"] },
        { titel: "Die magische Schmiede", text: "Gundren schickt uns in die alte Mine. Skelette, die nicht liegen bleiben wollen, und Fledermauswesen von der Decke. Am Ende des Gangs wartet Nezna. Ein zweites Mal entkommt sie uns nicht.", wellen: ["Knochen in der Dunkelheit", "Nezna und ihre Söldner"] },
        { titel: "Donnerbaum", text: "Die Allianz der Lords schickt uns in ein verlassenes Dorf. Oben im Turm kreischt Venomfang, ein junger grüner Drache. Holt er Luft, braucht es drei schnelle Treffer, sonst erwischt uns sein Giftodem. Danach warten Zombies, Blights und Spinnen.", wellen: ["Der Drache im Turm", "Das verlassene Dorf"] },
        { titel: "Der Ausbruch", text: "Die nette Druidin hat uns mit Kräuternebel betäubt. Wir wachen in Ketten im Unterreich auf. Echo nagt als Ratte die Fesseln durch, Barradin beleidigt die Wachen, und im Hof wüten Dämonen. Dann zeigt Ilvara ihr wahres Gesicht.", wellen: ["Die Wachen stürmen herein", "Dämonen im Hof"] },
        { titel: "Durch die Spinnweben", text: "Immer tiefer, über Schluchten und Netze. Spinnen seilen sich von der Decke ab, Ettercaps lauern dazwischen. Im Grab der Magierin Khaem erhebt sich ein Wraith. Treffen kann man ihn nur, wenn er sichtbar ist.", wellen: ["Spinnen von der Decke", "Das Grab der Magierin"] },
        { titel: "Der unterirdische See", text: "Ploopploopeen bittet uns um Hilfe gegen die Anhänger eines falschen Gottes. In der Stadt der Kuo-Toa bricht Chaos aus. Dann steigt Demogorgon aus dem See. Haltet durch, bis das Boot ablegt. Oder boxt ihn diesmal wirklich.", wellen: ["Chaos in der Stadt", "Demogorgon erwacht"] },
        { titel: "Gracklstugh", text: "Kardal, der Späher, ist in Wahrheit ein Prinz. Wir dürfen in der Stadt bleiben, doch etwas stimmt hier nicht: Stimmen in den Köpfen. Besessene Duergar greifen an, und dann rast ein Riese durch die Gassen. Betäuben, nicht töten.", wellen: ["Stimmen in den Köpfen", "Der rasende Riese"] }
      ],
      endlos: { titel: "Endlose Nacht", text: "Der Riese ist gefesselt, und hier endet unsere Chronik. Vorerst. Doch die Stimmen werden lauter, und von überall her kommen sie zurück: Goblins, Dämonen, Drachen. Wie lange hält das Lager?", unter: "Die Stimmen werden lauter" },
      wuff: "Wuff!", grr: "Grrr!", entkommen: "Entkommen!", doppel: "Doppeltreffer!", dreifach: "Dreifachtreffer!",
      bossFaellt: { demogorgon: "Demogorgon fällt!", anfuehrer: "Der Anführer fällt!", glasstab: "Glasstab ist gestellt!", neznaBoss: "Nezna fällt!", venomfang: "Venomfang stürzt ab!", ilvara: "Ilvara ist besiegt!", wraith: "Der Wraith zerfällt!", riese: "Betäubt und gefesselt!" },
      bossRuft: { demogorgon: "Demogorgon!", anfuehrer: "Ein Bugbear-Anführer!", glasstab: "Glasstab!", neznaBoss: "Nezna, schon wieder!", venomfang: "Venomfang greift an!", ilvara: "Die Druidin …?", wraith: "Ein Wraith erhebt sich!", riese: "Ein rasender Riese!" },
      flieht: { glasstab: "Glasstab flieht zum Geheimgang!", ilvara: "Ilvara springt zum Abgrund!", nezna: "Nezna wird zur Fledermaus!" },
      entwischt: { glasstab: "Glasstab ist entwischt!", ilvara: "„Die Spinne wird euch alle kriegen!“", nezna: "Nezna entkommt … vorerst." },
      neznaGestellt: "Nezna gestellt!", enttarnt: "Ilvara zeigt ihr wahres Gesicht!",
      odemLaden: "Venomfang holt Luft!", odem: "Giftodem!", unterbrochen: "Unterbrochen!", rasen: "Der Riese rast!",
      wolfHinweis: "Ein Wolf! Nicht schießen.", wolfFrei: "Wolf befreit!", wolfAua: "Doch nicht den Wolf!",
      wieder: "Es steht wieder auf …", boot: s => "⛵ Boot legt ab: " + s, geflohen: "Ins Boot – geflohen!", geboxt: "Diesmal wirklich geboxt!", krit: "NAT 20!",
      bonus: { hase: "Fliehender Hase", blatt: "Blatt im Wind", stimme: "Stimme gebannt" }, bonusDa: { hase: "Ein Hase! Schnell!", blatt: "Ein Blatt im Wind …", stimme: "Eine Stimme flüstert …" },
      stufenTitel: "Schwierigkeit", stufen: { lehrling: "🌱 Lehrling", waldlaeufer: "🏹 Waldläufer", legende: "🐉 Legende" },
      stufenText: { lehrling: "Langsamere Gegner, 7 Leben.", waldlaeufer: "Die Jagd, wie Friedrich sie kennt. 5 Leben.", legende: "Schnell, gnadenlos, 4 Leben." },
      bestenliste: "🏆 Bestenliste", nurHier: "Noch nur auf diesem Gerät gespeichert.", leer: "Noch niemand – sei die erste Legende!",
      eintragen: "🏆 Eintragen", deinName: "Dein Name", eingetragen: p => "Eingetragen – Platz " + p + "!", eingetragenOhne: "Eingetragen!",
      spalten: ["#", "Name", "Punkte", "Welle"],
      rast: "Rast am Lagerfeuer", rastText: "Wähle eine Gabe für die nächste Welle.",
      stufe: (a, b) => "Stufe " + a + "/" + b,
      gaben: {
        mehrfach: [["Doppelschuss", "Zwei Pfeile auf einmal."], ["Dreifachschuss", "Drei Pfeile im Fächer."]],
        feuer: [["Feuerpfeile", "Treffer setzen alles in der Nähe in Brand."], ["Glutpfeile", "Größere Flammen, doppelter Schaden."]],
        zug: [["Schneller Zug", "Der Bogen ist schneller wieder gespannt."]],
        durchschlag: [["Durchschlag", "Pfeile fliegen durch einen Gegner hindurch."], ["Großer Durchschlag", "Pfeile durchbohren zwei Gegner."]],
        rex: [["Rex packt zu", "Rex stürzt sich auf Gegner am Boden und hält sie fest."], ["Bissiger Rex", "Rex packt öfter und fester zu."]],
        adler: [["Adlerauge", "Die Flugbahn ist viel weiter zu sehen."]],
        echo: [["Echos Ranken", "Wurzeln aus dem Boden bremsen alle Gegner."], ["Dichtes Dickicht", "Die Ranken bremsen noch stärker."]],
        rast: [["Rast am Feuer", "+2 Leben fürs Lager."]],
        barradin: [["Barradins Inspiration", "Ein Lied im Ohr: Serien bringen doppelt so viele Punkte."]],
        krit: [["Natürliche 20", "Jeder Treffer kann kritisch sein: dreifacher Schaden."], ["Glückswürfel", "Kritische Treffer doppelt so oft."]],
        eis: [["Echos Eisfächer", "Treffer frieren Gegner an und bremsen sie stark."], ["Klirrender Frost", "Länger und stärker eingefroren."]],
        blitz: [["Echos Blitz", "Treffer springen manchmal als Blitz auf zwei Gegner über."], ["Kettenblitz", "Öfter, und auf drei Gegner."]],
        gift: [["Venomfangs Gift", "Getroffene Gegner nehmen noch zweimal Giftschaden."], ["Drachengift", "Dreimal Giftschaden."]],
        ezekiel: [["Ezekiels Dolche", "Ezekiel lauert am Rand: Wer fliehen will, kassiert einen Dolch."], ["Darkin-Klingen", "Ezekiels Dolche treffen doppelt hart."]],
        mal: [["Jägermal", "Getroffene Gegner sind markiert und nehmen mehr Schaden."]],
        hypnose: [["Barradins Hypnose", "Barradin bannt immer wieder den stärksten Gegner."], ["Bannlied", "Barradin singt öfter."]],
        dawnbringer: [["Dawnbringer", "Ezekiels Schwert leuchtet auf und trifft alle Gegner. Wraiths werden sichtbar."], ["Morgenröte", "Das Licht kommt öfter."]],
        floete: [["Flöte der Illusionen", "Barradin spielt einen Mini-Demogorgon herbei. Gegner in der Nähe kehren um."]]
      },
      ende: "Das Lager ist gefallen",
      punkte: "Punkte", wert: { kapitel: "Kapitel", welle: "Welle", erlegt: "Erlegt", genau: "Treffsicherheit", bonus: "Bonusziele" },
      rekord: (n, st) => "Dein Rekord (" + st + "): " + n + " Punkte", neuRekord: "Neuer Rekord!",
      ton: ["🔊 Ton an", "🔈 Ton aus"],
      spruch: {
        schwach: ["Der Wald war heute lauter als mein Bogen. Morgen wieder.", "Rex hat mehr erwischt als ich. Sagt es nicht weiter.", "Manchmal ist es klüger, das Lager zu räumen. Heute war so ein Tag."],
        mittel: ["Ordentliche Jagd. Kaum ein Pfeil verschwendet. Fast.", "Das Lager hat lange gehalten. Mehr verlange ich nicht.", "Ich hätte zuerst mit ihnen reden sollen. Aber sie wollten nicht reden."],
        gut: ["Ein Pfeil, ein Gegner. So hat man es mich gelehrt.", "Gute Arbeit, Rex. Du bekommst den größten Knochen.", "Barradin wird ein Lied darüber schreiben. Leider."],
        boss: ["Demogorgon. Ich sag ja: Ich hab einen Gott geboxt.", "Erzählt Barradin nichts davon, sonst singt er drei Tage lang.", "Zwei Köpfe, ein Pfeil zu viel."],
        legende: ["Die Bäume flüstern meinen Namen. Oder ist das Echo?", "Selbst Ezekiel hat genickt. Einmal.", "Imre blättert hektisch in seinem Monsterhandbuch. Ihm gehen die Gegner aus."]
      }
    },
    en: {
      label: "Ranger check", titel: "Friedrich's Hunt",
      text: "Friedrich retells your campaign: from the ambush on the road all the way to Gracklstugh. Draw your bow, keep the enemies away from the camp and listen to Rex: he smells them first.",
      steuerung: "Touch anywhere in the picture, pull back, aim, let go. The further you pull, the stronger the shot.",
      start: "▶ Begin the hunt", weiter: "▶ Continue", nochmal: "↻ New hunt", beenden: "End the hunt",
      pause: "A short rest", pauseText: "The hunt is waiting for you.", pauseKnopf: "Pause",
      hud: (k, n) => k + " · Wave " + n, welle: n => "Wave " + n, serie: n => "Streak ×" + n,
      kapitel: "Chapter", kapWahl: "From chapter", uebung: "Practice hunt: doesn't count for the leaderboard.", uebungEnde: "Practice hunt – doesn't count for the leaderboard.",
      kapGeschafft: r => "Chapter " + r + " complete!", neuFrei: n => "New gift at the campfire: " + n, neu: "New",
      kap: [
        { titel: "The Road to Phandalin", text: "Gundren hired us to bring a cart to Phandalin. Days of nothing but dust and Barradin's travel songs. Then a burning wagon blocks the road, and Rex growls. Goblins.", wellen: ["Ambush on the road", "More from the bushes"] },
        { titel: "The Goblin Cave", text: "Echo follows the tracks to a cave in a rocky cleft. Tied-up wolves whimper at the entrance. We set them free. So: when a wolf runs past, hands off the bowstring.", wellen: ["Wolves at the entrance", "The goblin nest"] },
        { titel: "Castle Crackmore", text: "In Phandalin the Red Robes extort money from the people. Rex found the secret passage into the castle while chasing a rabbit. Inside waits Glasstaff. He blinks back and forth, and when things get tight, he runs.", wellen: ["The Red Robes", "Glasstaff's laboratory"] },
        { titel: "The Watchtower", text: "A starry night, a prisoner in the tower. I kick the door open: a goblin, a bugbear and Nezna, a drow. Once she's wounded, she turns into a bat and flees. Shoot her down before that.", wellen: ["The door bursts open", "The bugbear rises"] },
        { titel: "The Magic Forge", text: "Gundren sends us into the old mine. Skeletons that won't stay down and bat-like creatures from the ceiling. At the end of the tunnel waits Nezna. She won't escape us a second time.", wellen: ["Bones in the dark", "Nezna and her mercenaries"] },
        { titel: "Thundertree", text: "The Lords' Alliance sends us to an abandoned village. Up in the tower, Venomfang shrieks, a young green dragon. When he draws breath, it takes three quick hits, or his poison breath gets us. Then zombies, blights and spiders await.", wellen: ["The dragon in the tower", "The abandoned village"] },
        { titel: "The Breakout", text: "The friendly druid knocked us out with herbal mist. We wake up in chains in the Underdark. Echo gnaws through the ropes as a rat, Barradin insults the guards, and demons rage in the courtyard. Then Ilvara shows her true face.", wellen: ["The guards storm in", "Demons in the courtyard"] },
        { titel: "Through the Webs", text: "Ever deeper, across chasms and webs. Spiders lower themselves from the ceiling, ettercaps lurk in between. In the tomb of the mage Khaem a wraith rises. You can only hit it while it is visible.", wellen: ["Spiders from the ceiling", "The mage's tomb"] },
        { titel: "The Underground Lake", text: "Ploopploopeen asks for help against the followers of a false god. Chaos breaks out in the city of the kuo-toa. Then Demogorgon rises from the lake. Hold on until the boat casts off. Or punch him for real this time.", wellen: ["Chaos in the city", "Demogorgon awakens"] },
        { titel: "Gracklstugh", text: "Kardal the scout is actually a prince. We may stay in the city, but something is wrong here: voices in people's heads. Possessed duergar attack, and then a giant rampages through the alleys. Stun him, don't kill him.", wellen: ["Voices in their heads", "The raging giant"] }
      ],
      endlos: { titel: "Endless Night", text: "The giant is tied up, and this is where our chronicle ends. For now. But the voices grow louder, and from everywhere they come back: goblins, demons, dragons. How long will the camp hold?", unter: "The voices grow louder" },
      wuff: "Woof!", grr: "Grrr!", entkommen: "Escaped!", doppel: "Double hit!", dreifach: "Triple hit!",
      bossFaellt: { demogorgon: "Demogorgon falls!", anfuehrer: "The leader falls!", glasstab: "Glasstaff is caught!", neznaBoss: "Nezna falls!", venomfang: "Venomfang crashes down!", ilvara: "Ilvara is defeated!", wraith: "The wraith crumbles!", riese: "Stunned and tied up!" },
      bossRuft: { demogorgon: "Demogorgon!", anfuehrer: "A bugbear leader!", glasstab: "Glasstaff!", neznaBoss: "Nezna, again!", venomfang: "Venomfang attacks!", ilvara: "The druid …?", wraith: "A wraith rises!", riese: "A raging giant!" },
      flieht: { glasstab: "Glasstaff runs for the secret passage!", ilvara: "Ilvara leaps for the abyss!", nezna: "Nezna turns into a bat!" },
      entwischt: { glasstab: "Glasstaff got away!", ilvara: "“The Spider will get you all!”", nezna: "Nezna escapes … for now." },
      neznaGestellt: "Nezna caught!", enttarnt: "Ilvara shows her true face!",
      odemLaden: "Venomfang draws breath!", odem: "Poison breath!", unterbrochen: "Interrupted!", rasen: "The giant rages!",
      wolfHinweis: "A wolf! Don't shoot.", wolfFrei: "Wolf freed!", wolfAua: "Not the wolf!",
      wieder: "It gets back up …", boot: s => "⛵ Boat leaves in: " + s, geflohen: "Into the boat – escaped!", geboxt: "Punched for real this time!", krit: "NAT 20!",
      bonus: { hase: "Fleeing hare", blatt: "Leaf in the wind", stimme: "Voice banished" }, bonusDa: { hase: "A hare! Quick!", blatt: "A leaf in the wind …", stimme: "A voice whispers …" },
      stufenTitel: "Difficulty", stufen: { lehrling: "🌱 Apprentice", waldlaeufer: "🏹 Ranger", legende: "🐉 Legend" },
      stufenText: { lehrling: "Slower enemies, 7 lives.", waldlaeufer: "The hunt as Friedrich knows it. 5 lives.", legende: "Fast, merciless, 4 lives." },
      bestenliste: "🏆 Leaderboard", nurHier: "Only saved on this device for now.", leer: "Nobody yet – be the first legend!",
      eintragen: "🏆 Submit", deinName: "Your name", eingetragen: p => "Submitted – rank " + p + "!", eingetragenOhne: "Submitted!",
      spalten: ["#", "Name", "Points", "Wave"],
      rast: "Rest at the campfire", rastText: "Choose a gift for the next wave.",
      stufe: (a, b) => "Level " + a + "/" + b,
      gaben: {
        mehrfach: [["Double shot", "Two arrows at once."], ["Triple shot", "Three arrows in a fan."]],
        feuer: [["Fire arrows", "Hits set everything nearby ablaze."], ["Ember arrows", "Bigger flames, double damage."]],
        zug: [["Quick draw", "The bow is drawn again faster."]],
        durchschlag: [["Piercing", "Arrows fly through one enemy."], ["Great piercing", "Arrows pierce two enemies."]],
        rex: [["Rex bites", "Rex pounces on enemies on the ground and holds them."], ["Fierce Rex", "Rex bites more often and harder."]],
        adler: [["Eagle eye", "You see much more of the flight path."]],
        echo: [["Echo's vines", "Roots from the ground slow all enemies."], ["Dense thicket", "The vines slow them even more."]],
        rast: [["Rest by the fire", "+2 lives for the camp."]],
        barradin: [["Barradin's inspiration", "A song in your ear: streaks score twice as much."]],
        krit: [["Natural 20", "Any hit can be critical: triple damage."], ["Lucky die", "Critical hits twice as often."]],
        eis: [["Echo's cone of cold", "Hits freeze enemies and slow them down a lot."], ["Biting frost", "Frozen longer and harder."]],
        blitz: [["Echo's lightning", "Hits sometimes jump to two enemies as lightning."], ["Chain lightning", "More often, and to three enemies."]],
        gift: [["Venomfang's poison", "Enemies hit take poison damage twice more."], ["Dragon poison", "Three times poison damage."]],
        ezekiel: [["Ezekiel's daggers", "Ezekiel lurks at the edge: whoever tries to escape gets a dagger."], ["Darkin blades", "Ezekiel's daggers hit twice as hard."]],
        mal: [["Hunter's mark", "Enemies hit are marked and take more damage."]],
        hypnose: [["Barradin's hypnosis", "Barradin keeps entrancing the strongest enemy."], ["Song of binding", "Barradin sings more often."]],
        dawnbringer: [["Dawnbringer", "Ezekiel's sword flares up and hits every enemy. Wraiths become visible."], ["Daybreak", "The light comes more often."]],
        floete: [["Flute of illusions", "Barradin conjures a tiny Demogorgon. Nearby enemies turn back."]]
      },
      ende: "The camp has fallen",
      punkte: "points", wert: { kapitel: "Chapter", welle: "Wave", erlegt: "Slain", genau: "Accuracy", bonus: "Bonus targets" },
      rekord: (n, st) => "Your record (" + st + "): " + n + " points", neuRekord: "New record!",
      ton: ["🔊 Sound on", "🔈 Sound off"],
      spruch: {
        schwach: ["The forest was louder than my bow today. Tomorrow again.", "Rex caught more than I did. Don't tell anyone.", "Sometimes it's wiser to break camp. Today was such a day."],
        mittel: ["A decent hunt. Hardly an arrow wasted. Almost.", "The camp held for a long time. I ask for no more.", "I should have talked to them first. But they didn't want to talk."],
        gut: ["One arrow, one enemy. That's how I was taught.", "Good work, Rex. You get the biggest bone.", "Barradin will write a song about this. Sadly."],
        boss: ["Demogorgon. Told you: I punched a god.", "Don't tell Barradin, or he'll sing about it for three days.", "Two heads, one arrow too many."],
        legende: ["The trees whisper my name. Or is that Echo?", "Even Ezekiel nodded. Once.", "Imre is frantically leafing through his monster manual. He's running out of enemies."]
      }
    }
  };
  const t = () => TX[sprache()];

  /* ---------- Die Kapitel der Kampagne ---------- */
  const KAPITEL = [
    { thema: "strasse", bild: "hinterhalt-sieg.jpg", wellen: [
      { abstand: 1.7, gegner: { goblin: 8 } },
      { abstand: 1.5, gegner: { goblin: 7, bandit: 4 } }] },
    { thema: "hoehle", bild: "woelfe-befreit.jpg", wellen: [
      { abstand: 1.45, gegner: { goblin: 8, wolf: 3 } },
      { abstand: 1.3, gegner: { goblin: 9, bandit: 4, wolf: 2 } }] },
    { thema: "schloss", bild: "glasstab-besiegt.jpg", wellen: [
      { abstand: 1.4, gegner: { robe: 8, goblin: 3 } },
      { abstand: 1.6, gegner: { robe: 4 }, boss: "glasstab" }] },
    { thema: "wachturm", bild: null, wellen: [
      { abstand: 1.35, gegner: { goblin: 7, bandit: 3, nezna: 1 } },
      { abstand: 1.6, gegner: { goblin: 3, bugbear: 2 }, boss: "anfuehrer" }] },
    { thema: "mine", bild: "magische-schmiede.jpg", wellen: [
      { abstand: 1.3, gegner: { skelett: 8, stirge: 5 } },
      { abstand: 1.5, gegner: { skelett: 4, soeldner: 2 }, boss: "neznaBoss" }] },
    { thema: "donnerbaum", bild: "venomfang-besiegt.jpg", wellen: [
      { abstand: 1.9, gegner: { blight: 3 }, boss: "venomfang" },
      { abstand: 1.25, gegner: { zombie: 5, blight: 8, spinne: 3 } }] },
    { thema: "gefaengnis", bild: "gefangen-kerker.jpg", wellen: [
      { abstand: 1.3, gegner: { drowwache: 6, soeldner: 5 } },
      { abstand: 1.6, gegner: { chasme: 3, vrock: 3 }, boss: "ilvara" }] },
    { thema: "spinnweben", bild: "unterreich-spinnweben.jpg", wellen: [
      { abstand: 1.2, gegner: { spinne: 9, ettercap: 4 } },
      { abstand: 1.6, gegner: { spinne: 3, ettercap: 2 }, boss: "wraith" }] },
    { thema: "see", bild: "kuo-toa-stadt.jpg", wellen: [
      { abstand: 1.15, gegner: { kuotoa: 12 } },
      { abstand: 2, gegner: {}, boss: "demogorgon", flucht: 40, eskorte: ["kuotoa", "kuotoa"] }] },
    { thema: "gracklstugh", bild: "gracklstugh.jpg", wellen: [
      { abstand: 1.2, gegner: { duergar: 9, chasme: 2 } },
      { abstand: 1.6, gegner: { duergar: 3 }, boss: "riese" }] }
  ];
  const PLAN = [];
  KAPITEL.forEach((k, ki) => k.wellen.forEach((w, wi) => PLAN.push({ kap: ki, w: wi })));
  const ENDLOS_BILD = "siegesfeier.jpg";
  const ENDLOS_GEGNER = ["goblin", "bandit", "soeldner", "robe", "drowwache", "skelett", "zombie", "spinne", "ettercap", "kuotoa", "duergar", "stirge", "blight", "bugbear", "vrock", "chasme"];
  const ENDLOS_BOSSE = ["anfuehrer", "glasstab", "venomfang", "neznaBoss", "ilvara", "wraith", "riese", "demogorgon"];

  /* ---------- Welt ---------- */
  const W = 400, H = 500, G = 520;
  const SCHULTER = { x: 200, y: 446 };
  const BAHNEN = [{ y: 300, s: 0.58 }, { y: 352, s: 0.78 }, { y: 410, s: 0.98 }];
  const REX_HEIM = { x: 350, y: 486 };
  const FONT_D = '"IM Fell English SC", "Palatino Linotype", Georgia, serif';
  const FONT_H = 'Caveat, "Segoe Print", cursive';

  const SPL = {
    gruen: ["#5d6e35", "#8a9b4c", "#3b2a1b"], rot: ["#7a2f26", "#6b4a30", "#2a2622"], grau: ["#8d9096", "#5a5d63", "#2a2622"],
    lila: ["#3a3448", "#6b5ca8", "#ff5a4a"], knochen: ["#d9d1bc", "#8a8270", "#9be7ff"], faul: ["#7d8a6a", "#5a6650", "#9b3a2f"],
    spinne: ["#3a2a26", "#9b3a2f", "#140f0e"], fisch: ["#5a8a82", "#c9b48a", "#2a4442"], zwerg: ["#7a7c84", "#c88aff", "#4a4642"]
  };
  const ARTEN = {
    goblin:    { malen: ["goblin"], hoehe: 54, hp: 1, tempo: 62, punkte: 8, art: "boden", splitter: SPL.gruen },
    bandit:    { malen: ["bandit"], hoehe: 86, hp: 2, tempo: 42, punkte: 15, art: "boden", splitter: SPL.rot },
    soeldner:  { malen: ["bandit", "soeldner"], hoehe: 86, hp: 2, tempo: 44, punkte: 15, art: "boden", splitter: SPL.grau },
    robe:      { malen: ["robe"], hoehe: 84, hp: 2, tempo: 44, punkte: 15, art: "boden", splitter: ["#b8432f", "#7a2a20", "#c9a35a"] },
    drowwache: { malen: ["drow", "wache"], hoehe: 86, hp: 2, tempo: 52, punkte: 18, art: "boden", splitter: SPL.lila },
    nezna:     { malen: ["drow"], hoehe: 90, hp: 4, tempo: 44, punkte: 60, art: "boden", verwandeln: true, splitter: SPL.lila },
    skelett:   { malen: ["skelett"], hoehe: 80, hp: 1, tempo: 46, punkte: 12, art: "boden", wieder: true, splitter: SPL.knochen },
    zombie:    { malen: ["zombie"], hoehe: 84, hp: 4, tempo: 24, punkte: 25, art: "boden", splitter: SPL.faul },
    spinne:    { malen: ["spinne"], hoehe: 44, hp: 2, tempo: 72, punkte: 18, art: "boden", seil: true, hell: 1.5, splitter: SPL.spinne },
    ettercap:  { malen: ["ettercap"], hoehe: 78, hp: 3, tempo: 40, punkte: 25, art: "boden", splitter: ["#5a5a7a", "#b4ff6a", "#2a2a3a"] },
    kuotoa:    { malen: ["kuotoa"], hoehe: 86, hp: 2, tempo: 50, punkte: 16, art: "boden", splitter: SPL.fisch },
    duergar:   { malen: ["duergar"], hoehe: 68, hp: 3, tempo: 40, punkte: 22, art: "boden", stimme: true, splitter: SPL.zwerg },
    stirge:    { malen: ["fledermaus", "stirge"], hoehe: 34, hp: 1, tempo: 92, punkte: 14, art: "flug", splitter: ["#5a3a2a", "#9b3a2f", "#3e2a20"] },
    blight:    { bild: "blight-frei.webp", quelle: [400, 0, 700, 605], hoehe: 60, hp: 1, tempo: 52, punkte: 10, art: "boden", blick: 1, hell: 1.9, splitter: ["#3b4a3a", "#6f8a5a", "#2a2f26"] },
    bugbear:   { bild: "bugbear-frei.webp", hoehe: 92, hp: 3, tempo: 33, punkte: 30, art: "boden", splitter: ["#9b3a2f", "#a8783e", "#5a4430"] },
    vrock:     { bild: "vrock-frei.webp", hoehe: 80, hp: 2, tempo: 62, punkte: 20, art: "flug", blick: 1, hell: 1.35, splitter: ["#a89f8f", "#6a6256", "#3a352f"] },
    chasme:    { bild: "chasme-frei.webp", hoehe: 64, hp: 1, tempo: 100, punkte: 25, art: "flug", blick: 1, splitter: ["#c4564a", "#2b3550", "#9b3a2f"] },
    wolf:      { malen: ["wolf"], hoehe: 46, hp: 1, tempo: 95, punkte: 25, art: "freund", splitter: ["#9a9aa2", "#55555c", "#c9c9cc"] },
    // Höhepunkte
    anfuehrer: { sprite: "bugbear", hoehe: 140, hp: 12, tempo: 21, punkte: 150, art: "boss", mini: true, verlust: 2, glut: "rgba(224,160,70,.5)", eskorte: ["goblin", "goblin", "bandit"], splitter: ["#9b3a2f", "#a8783e", "#e0a046"] },
    glasstab:  { malen: ["glasstab"], hoehe: 112, hp: 10, tempo: 26, punkte: 160, art: "boss", mini: true, teleport: 3.2, flucht: 0.35, verlust: 2, glut: "rgba(155,231,255,.5)", eskorte: ["robe", "robe", "goblin"], splitter: ["#c4523a", "#9be7ff", "#c9a35a"] },
    neznaBoss: { sprite: "nezna", hoehe: 104, hp: 11, tempo: 34, punkte: 180, art: "boss", mini: true, teleport: 2.8, verlust: 2, glut: "rgba(255,90,74,.45)", eskorte: ["skelett", "stirge", "soeldner"], splitter: SPL.lila },
    venomfang: { malen: ["venomfang"], hoehe: 110, hp: 22, tempo: 58, punkte: 300, art: "boss", drache: true, verlust: 0, glut: "rgba(160,255,90,.45)", eskorte: ["blight", "blight", "zombie"], splitter: ["#5a9a4a", "#e8ff5a", "#24482a"] },
    ilvara:    { bild: "ilvara-druidin.webp", hoehe: 118, hp: 14, tempo: 22, punkte: 260, art: "boss", mini: true, maske: true, teleport: 3.4, flucht: 0.25, verlust: 1, ohneRand: true, glut: "rgba(190,140,255,.5)", eskorte: ["drowwache", "chasme", "vrock"], splitter: ["#6b5ca8", "#e8e6f0", "#1d1828"] },
    wraith:    { malen: ["wraith"], hoehe: 130, hp: 15, tempo: 16, punkte: 300, art: "boss", schwebt: true, phasen: true, verlust: 2, glut: "rgba(155,231,255,.6)", eskorte: ["spinne", "ettercap"], splitter: ["#9be7ff", "#141826", "#c8e8ff"] },
    demogorgon:{ bild: "demogorgon.webp", hoehe: 196, hp: 28, tempo: 15, punkte: 400, art: "boss", verlust: 3, glut: "rgba(196,86,74,.55)", eskorte: ["blight", "goblin", "chasme"], splitter: ["#e0a046", "#9b3a2f", "#c98a3a"] },
    riese:     { bild: "riese.webp", freistellen: 38, hoehe: 172, hp: 26, tempo: 15, punkte: 350, art: "boss", rasen: true, verlust: 3, glut: "rgba(255,150,80,.45)", eskorte: ["duergar"], splitter: ["#c9a08a", "#7a5a4a", "#e0a046"] },
    // Bonusziele
    hase:      { malen: ["hase"], hoehe: 34, hp: 1, tempo: 165, punkte: 60, art: "bonus", splitter: ["#8a6a4a", "#ebe2cc", "#5a4430"] },
    blatt:     { malen: ["blatt"], hoehe: 30, hp: 1, tempo: 0, punkte: 90, art: "bonus", splitter: ["#e0a046", "#ffcf7a", "#c4564a"] },
    stimme:    { malen: ["stimme"], hoehe: 26, hp: 1, tempo: 0, punkte: 40, art: "bonus", splitter: ["#c88aff", "#ffffff", "#7a3cc8"] }
  };
  const STUFEN = {
    lehrling:    { tempo: 0.75, leben: 7, abstand: 1.35 },
    waldlaeufer: { tempo: 1, leben: 5, abstand: 1 },
    legende:     { tempo: 1.22, leben: 4, abstand: 0.82 }
  };
  let stufeWahl = STUFEN[lies("imres-waldlauf-stufe", "")] ? lies("imres-waldlauf-stufe", "") : "waldlaeufer";
  let kapFrei = Math.max(1, Math.min(KAPITEL.length, parseInt(lies("imres-waldlauf-kapitel", "1"), 10) || 1));
  let startKap = 0;

  const GABEN = { mehrfach: 2, feuer: 2, zug: 3, durchschlag: 2, rex: 2, adler: 1, echo: 2, rast: 99, barradin: 1, krit: 2, eis: 2, blitz: 2, gift: 2, ezekiel: 2, mal: 1, hypnose: 2, dawnbringer: 2, floete: 1 };
  const GABE_SYM = { mehrfach: "🏹", feuer: "🔥", zug: "💨", durchschlag: "🎯", rex: "🐕", adler: "🦅", echo: "🌿", rast: "🍖", barradin: "🎶", krit: "🎲", eis: "❄️", blitz: "🌩️", gift: "🧪", ezekiel: "🗡️", mal: "👁️", hypnose: "🌀", dawnbringer: "☀️", floete: "🪄" };
  const GABE_AB = { gift: 6, dawnbringer: 8, floete: 10 }; // so viele Kapitel müssen geschafft sein

  /* ---------- Bilder ---------- */
  const SPRITES = {};
  let rexBild = null;
  function laden(src, cb) { const i = new Image(); i.decoding = "async"; i.onload = () => cb(i); i.src = src; }
  function vorbereiten(img, q, maxH, hell, ohneRand) {
    const [sx, sy, sw, sh] = q || [0, 0, img.naturalWidth || img.width, img.naturalHeight || img.height];
    const f = Math.min(1, maxH / sh), w = Math.max(1, Math.round(sw * f)), h = Math.max(1, Math.round(sh * f));
    const c = document.createElement("canvas"); c.width = w; c.height = h;
    const x = c.getContext("2d");
    x.drawImage(img, sx, sy, sw, sh, 0, 0, w, h);
    if (hell !== 1) try { // aufhellen, damit sie sich von der dunklen Kulisse abheben
      const d = x.getImageData(0, 0, w, h), px = d.data;
      for (let i = 0; i < px.length; i += 4) { px[i] = Math.min(255, px[i] * hell + 14); px[i + 1] = Math.min(255, px[i + 1] * hell + 12); px[i + 2] = Math.min(255, px[i + 2] * hell + 8); }
      x.putImageData(d, 0, 0);
    } catch (_) {}
    if (!ohneRand) {
      x.globalCompositeOperation = "destination-in";
      const fe = 0.08;
      let g = x.createLinearGradient(0, 0, w, 0);
      g.addColorStop(0, "rgba(0,0,0,0)"); g.addColorStop(fe, "#000"); g.addColorStop(1 - fe, "#000"); g.addColorStop(1, "rgba(0,0,0,0)");
      x.fillStyle = g; x.fillRect(0, 0, w, h);
      g = x.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, "rgba(0,0,0,0)"); g.addColorStop(fe, "#000"); g.addColorStop(1 - fe, "#000"); g.addColorStop(1, "rgba(0,0,0,0)");
      x.fillStyle = g; x.fillRect(0, 0, w, h);
    }
    const s = document.createElement("canvas"); s.width = w; s.height = h;
    const y = s.getContext("2d"); y.translate(w, 0); y.scale(-1, 1); y.drawImage(c, 0, 0);
    return { normal: c, gespiegelt: s, verh: w / h };
  }
  function bilderLaden() {
    Object.keys(ARTEN).forEach(k => {
      const a = ARTEN[k];
      if (a.blick === undefined) a.blick = -1;
      if (a.sprite) return;
      if (a.malen) { SPRITES[k] = vorbereiten(FIG.malen(a.malen[0], a.malen[1]), null, 280, a.hell || 1, true); return; }
      const maxH = k === "demogorgon" ? 440 : k === "riese" ? 360 : 300;
      laden(a.bild, img => {
        const quelle = a.freistellen ? FIG.freistellen(img, a.freistellen) : img;
        SPRITES[k] = vorbereiten(quelle, a.quelle, maxH, a.hell || 1.15, a.ohneRand);
      });
    });
    SPRITES.fledermaus_nezna = vorbereiten(FIG.malen("fledermaus"), null, 200, 1.2, true);
    SPRITES.illusion = vorbereiten(FIG.malen("illusion"), null, 200, 1, true);
    laden("ilvara-wahr.webp", img => { SPRITES.ilvara_wahr = vorbereiten(img, null, 300, 1.15, true); });
    laden("rex-guckt.webp", img => { rexBild = img; });
  }

  /* ---------- Klang (eigene Synthese, keine Dateien) ---------- */
  let ac = null, rauschen = null, tonAn = lies("imres-waldlauf-ton", "1") === "1";
  function audio() {
    if (!tonAn) return null;
    if (!ac) { try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (_) { return null; } }
    if (ac.state === "suspended") ac.resume();
    if (!rauschen) {
      rauschen = ac.createBuffer(1, ac.sampleRate * 1.5, ac.sampleRate);
      const d = rauschen.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    return ac;
  }
  function huelle(a, ziel, start, spitze, dauer) {
    const g = a.createGain(); g.gain.setValueAtTime(0.0001, start);
    g.gain.exponentialRampToValueAtTime(spitze, start + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, start + dauer);
    g.connect(ziel); return g;
  }
  function ton(typ, f1, f2, dauer, laut, verz, filt) {
    const a = audio(); if (!a) return;
    const t0 = a.currentTime + (verz || 0);
    const o = a.createOscillator(); o.type = typ;
    o.frequency.setValueAtTime(f1, t0); o.frequency.exponentialRampToValueAtTime(f2, t0 + dauer);
    let ziel = huelle(a, a.destination, t0, laut, dauer);
    if (filt) { const b = a.createBiquadFilter(); b.type = filt[0]; b.frequency.value = filt[1]; b.Q.value = filt[2] || 1; b.connect(ziel); ziel = b; }
    o.connect(ziel); o.start(t0); o.stop(t0 + dauer + 0.05);
  }
  function knistern(dauer, laut, typ, freq, verz) {
    const a = audio(); if (!a) return;
    const t0 = a.currentTime + (verz || 0);
    const q = a.createBufferSource(); q.buffer = rauschen;
    const b = a.createBiquadFilter(); b.type = typ; b.frequency.value = freq;
    q.connect(b); b.connect(huelle(a, a.destination, t0, laut, dauer));
    q.start(t0, Math.random() * 0.2); q.stop(t0 + dauer + 0.05);
  }
  const KLANG = {
    sehne: p => { ton("triangle", 200 + p * 90, 70, 0.2, 0.2); knistern(0.09, 0.07, "highpass", 2500); },
    treffer: () => { knistern(0.09, 0.28, "lowpass", 900); ton("sine", 150, 55, 0.12, 0.25); },
    feuer: () => knistern(0.35, 0.16, "bandpass", 1400),
    tod: () => ton("triangle", 420, 140, 0.25, 0.08),
    bellen: () => { ton("sawtooth", 560, 280, 0.09, 0.13, 0, ["bandpass", 900, 2]); ton("sawtooth", 600, 300, 0.1, 0.13, 0.15, ["bandpass", 900, 2]); },
    knurren: () => ton("sawtooth", 110, 90, 0.5, 0.09, 0, ["lowpass", 500, 1]),
    entkommen: () => ton("sine", 320, 110, 0.45, 0.14),
    gabe: () => [523, 659, 784, 1046].forEach((f, i) => ton("triangle", f, f, 0.18, 0.12, i * 0.09)),
    bruellen: () => { knistern(1.2, 0.3, "lowpass", 320); ton("sawtooth", 72, 40, 1.2, 0.22, 0, ["lowpass", 400, 1]); },
    glocke: treffer => (treffer ? [880, 1175, 1568] : [1175, 1568]).forEach((f, i) => ton("sine", f, f, 0.3, 0.07, i * 0.07)),
    puff: () => { knistern(0.25, 0.14, "highpass", 1800); ton("sine", 900, 300, 0.25, 0.06); },
    odem: () => { knistern(1.1, 0.24, "bandpass", 600); ton("sawtooth", 160, 60, 0.9, 0.1, 0, ["lowpass", 700, 1]); },
    jaulen: () => ton("sine", 950, 520, 0.45, 0.12),
    blitz: () => knistern(0.16, 0.22, "highpass", 3200),
    licht: () => [523, 784, 1046, 1568].forEach((f, i) => ton("triangle", f, f, 0.4, 0.07, i * 0.05)),
    floete: () => [784, 988, 1175, 988].forEach((f, i) => ton("sine", f, f, 0.16, 0.08, i * 0.12)),
    krit: () => [659, 988].forEach((f, i) => ton("square", f, f, 0.12, 0.05, i * 0.06)),
    seite: () => [392, 523, 659].forEach((f, i) => ton("triangle", f, f, 0.5, 0.08, i * 0.15)),
    ende: () => [392, 330, 262, 196].forEach((f, i) => ton("triangle", f, f * 0.98, 0.35, 0.12, i * 0.22))
  };

  /* ---------- Spielzustand ---------- */
  let zustand = "start"; // start | geschichte | spiel | wahl | pause | ende
  let S = null;
  const GABEN_LEER = () => { const g = {}; Object.keys(GABEN).forEach(k => { g[k] = 0; }); return g; };
  function neuesSpiel(abKap) {
    S = {
      stufe: stufeWahl, maxLeben: STUFEN[stufeWahl].leben, uebung: abKap > 0,
      welle: 0, leben: STUFEN[stufeWahl].leben, punkte: 0, combo: 0, besteCombo: 0, erlegt: 0, bonus: 0, bonusT: 10, salven: 0, salvenTreffer: 0,
      kapFertig: abKap, kapAktuell: abKap, neuFrei: [], kapGeschafft: -1, gezeigt: {},
      gaben: GABEN_LEER(),
      pfeile: [], gegner: [], teilchen: [], texte: [], blasen: [], blitze: [], dolche: [],
      warte: [], abstand: 1.5, spawnT: 0, gebellt: false, eskorteT: 0, eskorte2T: 0, eskorte: null, bossRufT: 0,
      banner: null, abkuehl: 0, vorgemerkt: null, beben: 0, endeT: 0, welleFertigT: -1, fluchtT: 0,
      hypT: 10, lichtT: 12, licht: 0, floeteT: 12, illusion: null, wolfHinweis: false,
      rex: { zustand: "wartet", x: REX_HEIM.x, y: REX_HEIM.y, ziel: null, t: 0, cd: 4, hops: 0 },
      salveId: 0, salvenOffen: {}, endlosThemen: mischen(WELT.namen.slice())
    };
    // Übung ab einem späteren Kapitel: zwei Gaben je übersprungenem Kapitel
    for (let i = 0; i < abKap * 2; i++) {
      const m = gabenMoeglich().filter(k => k !== "rast");
      if (m.length) S.gaben[zufall(m)]++;
    }
    S.welle = abKap ? PLAN.findIndex(p => p.kap === abKap) : 0;
  }
  function gabenMoeglich() {
    return Object.keys(GABEN).filter(k => {
      if (GABE_AB[k] && S.kapFertig < GABE_AB[k]) return false;
      return k === "rast" ? S.leben < S.maxLeben : S.gaben[k] < GABEN[k];
    });
  }

  function welleBauen(n) {
    const l = [], add = (typ, k) => { for (let i = 0; i < k; i++) l.push(typ); };
    if (n <= PLAN.length) {
      const p = PLAN[n - 1], w = KAPITEL[p.kap].wellen[p.w];
      Object.keys(w.gegner).forEach(k => add(k, w.gegner[k]));
      const erster = l.length ? l[0] : null;
      mischen(l);
      if (erster && l[0] !== erster) { const i = l.indexOf(erster); [l[0], l[i]] = [l[i], l[0]]; }
      if (w.boss) l.splice(w.flucht ? 0 : Math.min(2, l.length), 0, w.boss);
      return { liste: l, abstand: w.abstand, boss: w.boss, flucht: w.flucht || 0, eskorte: w.eskorte, thema: KAPITEL[p.kap].thema, unter: t().kap[p.kap].wellen[p.w], kap: p.kap };
    }
    const m = n - PLAN.length;
    const typen = mischen(ENDLOS_GEGNER.slice()).slice(0, 5);
    const anzahl = 10 + Math.min(16, m * 2);
    for (let i = 0; i < anzahl; i++) l.push(typen[i % typen.length]);
    mischen(l);
    let boss = null;
    if (m % 3 === 0) { boss = ENDLOS_BOSSE[(m / 3 - 1) % ENDLOS_BOSSE.length]; l.splice(Math.floor(l.length / 2), 0, boss); }
    return { liste: l, abstand: Math.max(0.5, 1.05 - 0.04 * m), boss, flucht: 0, thema: S.endlosThemen[Math.floor((m - 1) / 2) % S.endlosThemen.length], unter: t().endlos.unter, kap: KAPITEL.length };
  }

  function welleStarten(n) {
    S.welle = n;
    const w = welleBauen(n);
    S.kapAktuell = w.kap;
    weltSetzen(w.thema);
    S.warte = w.liste.map(typ => ({ typ, dir: Math.random() < 0.5 ? 1 : -1 }));
    S.abstand = w.abstand * STUFEN[S.stufe].abstand;
    S.eskorte = w.eskorte || null;
    S.fluchtT = w.flucht || 0; S.fluchtLaeuft = false;
    S.gegner = []; S.pfeile = []; S.blitze = []; S.dolche = [];
    S.bonusT = 6 + Math.random() * 8;
    S.spawnT = 2.2; S.gebellt = false; S.welleFertigT = -1;
    S.eskorteT = 5; S.eskorte2T = 9;
    S.banner = { titel: t().welle(n), unter: w.unter, t: 0, dauer: 2.4 };
    zustand = "spiel";
    schleierZu();
  }
  /* vor dem ersten Kampf eines Kapitels erzählt Friedrich, was passiert */
  function naechsteWelle(n) {
    const neuesKapitel = n <= PLAN.length ? PLAN[n - 1].w === 0 : n === PLAN.length + 1;
    if (neuesKapitel && !S.gezeigt[n]) { S.gezeigt[n] = true; geschichteZeigen(n); }
    else welleStarten(n);
    anwerfen();
  }
  function kapitelVon(n) { return n <= PLAN.length ? PLAN[n - 1].kap : KAPITEL.length; }

  function tempoFaktor() {
    const m = Math.max(0, S.welle - PLAN.length);
    return STUFEN[S.stufe].tempo * (1 - 0.15 * S.gaben.echo) * (1 + 0.05 * m);
  }

  function groesseSetzen(e, spKey, hoehe) {
    const sp = SPRITES[spKey];
    e.sp = spKey; e.h = hoehe * e.s; e.w = e.h * (sp ? sp.verh : 0.8);
  }
  function spawnen(e) {
    const a = ARTEN[e.typ], key = a.sprite || e.typ;
    let y, s = 1, bahn = -1, bew = "boden", x = e.dir === 1 ? -40 : W + 40;
    if (a.art === "boden" || a.art === "freund" || e.typ === "hase") {
      bahn = e.typ === "hase" ? 1 + Math.floor(Math.random() * 2) : Math.floor(Math.random() * 3);
      y = BAHNEN[bahn].y; s = BAHNEN[bahn].s;
      if (a.seil) { bew = "seil"; x = 50 + Math.random() * 300; }
      if (e.typ === "hase") bew = "hase";
    } else if (a.art === "flug") { y = 120 + Math.random() * 150; s = 0.72 + (y - 120) / 150 * 0.28; bew = "flug"; }
    else if (e.typ === "blatt") { y = 60; bew = "blatt"; x = 70 + Math.random() * 260; }
    else if (e.typ === "stimme") { y = e.y || 320; bew = "wisp"; x = e.x || 80 + Math.random() * 240; }
    else if (a.drache) { y = 150; bew = "drache"; }
    else if (a.schwebt) { y = 222; bew = "schwebe"; }
    else { bahn = 1; y = BAHNEN[1].y + 10; bew = "boss"; }
    const g = { typ: e.typ, a, sp: key, x, basisX: x, y: bew === "seil" ? -10 : y, basisY: y, s, h: 0, w: 0, dir: e.dir, bahn, bew,
      t: 0, phase: Math.random() * 6, tempo: a.tempo * (0.9 + Math.random() * 0.2), tot: 0, blitz: 0, gehalten: false,
      eis: 0, eisK: 0, bann: 0, angst: 0, sichtbar: 0, liegt: 0, gift: null, mal: false, dolch: false,
      teleT: a.teleport || 0, odemT: 7, laedt: false, unterbrechung: 0, verlust: a.verlust || 1 };
    groesseSetzen(g, key, a.hoehe);
    if (bew !== "seil" && bew !== "blatt" && bew !== "wisp") g.x = e.dir === 1 ? -g.w / 2 : W + g.w / 2;
    g.basisX = g.x;
    // Ausdauer wächst in der endlosen Nacht
    const m = Math.max(0, S.welle - PLAN.length), extra = Math.floor(m / 3);
    g.hp = a.art === "boss" ? a.hp + (a.mini ? 3 : 6) * extra : a.hp + (a.hp > 1 && a.art !== "bonus" && a.art !== "freund" ? extra : 0);
    g.maxHp = g.hp;
    if (a.art === "boss" && e.typ === "demogorgon" && S.fluchtT > 0) { g.bleibt = true; S.fluchtLaeuft = true; }
    S.gegner.push(g);
    if (a.art === "boss") { KLANG.bruellen(); S.beben = a.mini ? 0.4 : 0.7; S.bossRufT = 4; S.eskorteT = 3; S.eskorte2T = 7; textAuf(W / 2, 200, t().bossRuft[e.typ], a.mini ? "#e0a046" : "#c4564a", 26, 1.6); }
    if (a.art === "bonus" && e.typ !== "stimme") { textAuf(W / 2, 92, t().bonusDa[e.typ], "#ebe2cc", 19, 1.6); KLANG.glocke(); if (e.typ === "hase") S.rex.hops = 0.35; }
    if (a.art === "freund" && !S.wolfHinweis) { S.wolfHinweis = true; textAuf(W / 2, 150, t().wolfHinweis, "#ebe2cc", 22, 2.4); }
  }

  /* ---------- Schießen ---------- */
  let zielen = null;
  function zielVektor() {
    if (!zielen) return null;
    const dx = zielen.sx - zielen.x, dy = zielen.sy - zielen.y;
    const len = Math.hypot(dx, dy);
    if (len < 12) return null;
    let ang = Math.atan2(dy, dx);
    if (ang > -0.1 && ang <= Math.PI / 2) ang = -0.1;
    else if (ang > Math.PI / 2 || ang < -Math.PI + 0.1) ang = -Math.PI + 0.1;
    const p = Math.max(0.18, Math.min(1, len / 110));
    return { ang, p, v: 330 + p * 500 };
  }
  function bogenPunkt(ang) { return { x: SCHULTER.x + Math.cos(ang) * 30, y: SCHULTER.y - 4 + Math.sin(ang) * 30 }; }

  function schiessen(z) {
    const n = 1 + S.gaben.mehrfach;
    const id = ++S.salveId;
    S.salvenOffen[id] = { offen: n, treffer: 0, kills: 0 };
    S.salven++;
    for (let i = 0; i < n; i++) {
      const ang = z.ang + (i - (n - 1) / 2) * 0.075;
      const b = bogenPunkt(z.ang);
      S.pfeile.push({ x: b.x, y: b.y, vx: Math.cos(ang) * z.v, vy: Math.sin(ang) * z.v, salve: id, durch: S.gaben.durchschlag, getroffen: [], feuer: S.gaben.feuer, t: 0 });
    }
    S.abkuehl = 0.55 * Math.pow(0.78, S.gaben.zug);
    KLANG.sehne(z.p);
  }

  function salveSchliessen(id) {
    const v = S.salvenOffen[id]; if (!v) return;
    v.offen--;
    if (v.offen > 0) return;
    delete S.salvenOffen[id];
    if (v.treffer > 0) { S.salvenTreffer++; S.combo++; S.besteCombo = Math.max(S.besteCombo, S.combo); }
    else S.combo = 0;
    if (v.kills >= 2) {
      const bonus = 15 * v.kills;
      S.punkte += bonus;
      textAuf(W / 2, 250, (v.kills >= 3 ? t().dreifach : t().doppel) + " +" + bonus, "#e0a046", 22, 1.3);
    }
  }

  const angreifbar = e => !e.tot && e.liegt <= 0 && !e.unsichtbar && e.a.art !== "freund" && e.a.art !== "bonus";

  function puff(x, y, farben, n) { funken(x, y, farben || ["#a89f8f", "#ebe2cc", "#6a6256"], n || 18); KLANG.puff(); }

  function schaden(e, dmg, salve, pfeil) {
    if (e.tot || e.liegt > 0) return false;
    const tx = t(), m = mitte(e);
    if (e.a.art === "freund") {
      if (pfeil && !e.aua) { e.aua = true; e.tempo *= 1.8; S.punkte = Math.max(0, S.punkte - 20); S.combo = 0; textAuf(m.x, m.y - 16, tx.wolfAua + " −20", "#c4564a", 19, 1.3); KLANG.jaulen(); }
      return false;
    }
    if (pfeil && e.mal) dmg += 1;
    e.hp -= dmg; e.blitz = 0.12;
    if (salve) salve.treffer++;
    if (e.laedt && e.hp > 0) {
      e.unterbrechung++;
      if (e.unterbrechung >= 3) { e.laedt = false; e.odemT = 8; textAuf(m.x, m.y - 40, tx.unterbrochen, "#b4ff6a", 22, 1.2); KLANG.puff(); }
    }
    if (e.a.maske && !e.enttarnt) {
      e.enttarnt = true; puff(m.x, m.y, ["#6b5ca8", "#c88aff", "#1d1828"], 30);
      groesseSetzen(e, SPRITES.ilvara_wahr ? "ilvara_wahr" : e.sp, e.a.hoehe);
      textAuf(W / 2, 170, tx.enttarnt, "#c88aff", 22, 1.8);
    }
    if (e.a.verwandeln && !e.verwandelt && e.hp > 0 && e.hp <= e.maxHp / 2) {
      e.verwandelt = true; e.flieht = true; puff(m.x, m.y, SPL.lila, 24);
      groesseSetzen(e, "fledermaus_nezna", 40); e.bew = "fledermaus"; e.tempo = 135; e.verlust = 0; e.bahn = -1;
      e.dir = e.x < W / 2 ? -1 : 1; e.y -= 30;
      textAuf(W / 2, 160, tx.flieht.nezna, "#c88aff", 22, 1.6);
    }
    if (e.a.flucht && !e.flieht && e.hp > 0 && e.hp / e.maxHp <= e.a.flucht) {
      e.flieht = true; e.dir = e.x < W / 2 ? -1 : 1; e.tempo *= 3.2; e.teleT = 0;
      textAuf(W / 2, 170, tx.flieht[e.typ], "#e0a046", 22, 1.6);
    }
    if (e.a.rasen && !e.rast && e.hp > 0 && e.hp <= e.maxHp / 2) {
      e.rast = true; e.tempo *= 1.7; S.beben = 0.6; KLANG.bruellen(); textAuf(W / 2, 170, tx.rasen, "#e0a046", 24, 1.5);
    }
    if (e.hp > 0) return false;
    if (e.a.wieder && !e.erhoben) {
      e.erhoben = true; e.liegt = 1.7; e.hp = 1; e.maxHp = 1; e.gift = null; e.eis = 0;
      funken(m.x, m.y, e.a.splitter, 10); KLANG.tod();
      textAuf(m.x, m.y - 20, tx.wieder, "#a89f8f", 16, 1.3);
      if (salve) salve.kills++;
      return true;
    }
    e.tot = 0.001;
    const mult = 1 + Math.min(S.combo, 20) * 0.1 * (S.gaben.barradin ? 2 : 1);
    const p = Math.round(e.a.punkte * mult);
    S.punkte += p;
    if (e.a.art === "bonus") {
      S.bonus++;
      textAuf(m.x, m.y - 14, tx.bonus[e.typ] + " +" + p, "#ffcf7a", 20, 1.4);
      glut(m.x, m.y, ruhig ? 8 : 24); KLANG.glocke(true);
      return true;
    }
    S.erlegt++;
    if (salve) salve.kills++;
    textAuf(m.x, m.y - 10, "+" + p, "#ebe2cc", e.a.art === "boss" ? 30 : 18, 0.9);
    funken(m.x, m.y, e.a.splitter, e.a.art === "boss" ? (e.a.mini ? 40 : 70) : 16);
    KLANG.tod();
    if (e.verwandelt) { S.punkte += 100; textAuf(W / 2, 170, tx.neznaGestellt + " +100", "#e0a046", 24, 1.6); }
    if (e.a.stimme) spawnen({ typ: "stimme", dir: 1, x: m.x, y: m.y });
    if (e.a.art === "boss") {
      S.beben = e.a.mini ? 0.6 : 1; KLANG.bruellen();
      textAuf(W / 2, 180, tx.bossFaellt[e.typ], "#e0a046", 30, 2.2);
      if (e.bleibt) { S.punkte += 500; textAuf(W / 2, 214, tx.geboxt + " +500", "#ffcf7a", 22, 2.4); S.fluchtT = 0; }
    }
    return true;
  }
  function mitte(e) { return { x: e.x, y: e.y - e.h * (e.a.art === "boss" ? 0.55 : 0.5) }; }
  function radius(e) {
    if (e.a.art === "bonus") return Math.min(e.w, e.h) * 0.5 + 7;
    return Math.max(Math.min(e.w, e.h) * 0.4, (e.w + e.h) * 0.15) + 3;
  }

  /* Pfeiltreffer mit allen Gaben */
  function pfeilTrifft(p, e) {
    const salve = S.salvenOffen[p.salve], m = mitte(e), g = S.gaben;
    KLANG.treffer();
    funken(p.x, p.y, e.a.splitter, 6);
    let dmg = p.feuer > 1 ? 2 : 1;
    if (g.krit && e.a.art !== "freund" && Math.random() < 0.1 * g.krit) { dmg *= 3; textAuf(m.x, m.y - e.h * 0.5 - 8, t().krit, "#ffcf7a", 22, 1); KLANG.krit(); }
    const war = !e.tot;
    schaden(e, dmg, salve, true);
    if (e.a.art === "freund" || e.a.art === "bonus") return;
    if (war && !e.tot) {
      if (g.mal) e.mal = true;
      if (g.eis) { e.eis = g.eis > 1 ? 3.5 : 2.5; e.eisK = g.eis > 1 ? 0.65 : 0.5; }
      if (g.gift) e.gift = { n: g.gift + 1, t: 1 };
    }
    if (p.feuer) {
      const rad = p.feuer > 1 ? 60 : 40;
      glut(p.x, p.y, ruhig ? 6 : 18); KLANG.feuer();
      S.gegner.forEach(o => {
        if (o === e || !angreifbar(o)) return;
        const om = mitte(o);
        if (Math.hypot(om.x - p.x, om.y - p.y) < rad + radius(o) * 0.5) schaden(o, 1, salve, false);
      });
    }
    if (g.blitz && Math.random() < (g.blitz > 1 ? 0.4 : 0.25)) {
      const ziele = S.gegner.filter(o => o !== e && angreifbar(o))
        .map(o => ({ o, d: Math.hypot(mitte(o).x - m.x, mitte(o).y - m.y) })).filter(z => z.d < 150)
        .sort((a, b) => a.d - b.d).slice(0, g.blitz > 1 ? 3 : 2);
      if (ziele.length) {
        let von = m;
        ziele.forEach(z => { const zm = mitte(z.o); S.blitze.push({ a: von, b: zm, t: 0 }); von = zm; schaden(z.o, 1, salve, false); });
        KLANG.blitz();
      }
    }
  }

  /* ---------- Teilchen & Texte ---------- */
  function funken(x, y, farben, n) {
    if (ruhig) n = Math.ceil(n / 3);
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, v = 40 + Math.random() * 160;
      S.teilchen.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 60, leben: 0.5 + Math.random() * 0.6, max: 1.1, farbe: zufall(farben), gr: 1.5 + Math.random() * 2.5, schwer: 1 });
    }
  }
  function glut(x, y, n, farben) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, v = 20 + Math.random() * 90;
      S.teilchen.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 40, leben: 0.4 + Math.random() * 0.5, max: 0.9, farbe: zufall(farben || ["#e0a046", "#ffcf7a", "#c4564a"]), gr: 2 + Math.random() * 3, schwer: -0.3, leuchten: true });
    }
  }
  function textAuf(x, y, text, farbe, gr, dauer) { S.texte.push({ x, y, text, farbe, gr, t: 0, dauer: dauer || 1 }); }

  /* ---------- Rex ---------- */
  function rexUpdate(dt) {
    const r = S.rex;
    r.hops = Math.max(0, r.hops - dt);
    const lvl = S.gaben.rex;
    if (r.zustand === "wartet") {
      r.x += (REX_HEIM.x - r.x) * Math.min(1, dt * 6); r.y += (REX_HEIM.y - r.y) * Math.min(1, dt * 6);
      if (!lvl) return;
      r.cd -= dt;
      if (r.cd <= 0) {
        let best = null, bd = 1e9;
        S.gegner.forEach(e => {
          if (!angreifbar(e) || e.gehalten || e.bew !== "boden" || e.x < 30 || e.x > W - 30) return;
          const d = Math.hypot(e.x - r.x, e.y - r.y); if (d < bd) { bd = d; best = e; }
        });
        if (best) { r.ziel = best; r.zustand = "rennt"; best.gehalten = true; KLANG.knurren(); }
        else r.cd = 0.5;
      }
    } else if (r.zustand === "rennt") {
      const e = r.ziel;
      if (!e || e.tot || e.liegt > 0) { if (e) e.gehalten = false; r.zustand = "zurueck"; return; }
      const zx = e.x, zy = e.y - e.h * 0.25, d = Math.hypot(zx - r.x, zy - r.y), v = 460 * dt;
      if (d <= v + 4) { r.zustand = "haelt"; r.t = lvl > 1 ? 1.6 : 2.2; textAuf(zx, zy - e.h * 0.6, t().grr, "#e0a046", 20, 0.9); }
      else { r.x += (zx - r.x) / d * v; r.y += (zy - r.y) / d * v; }
    } else if (r.zustand === "haelt") {
      const e = r.ziel;
      if (!e || e.tot || e.liegt > 0) { if (e) e.gehalten = false; r.zustand = "zurueck"; return; }
      r.x = e.x + Math.sin(performance.now() / 50) * 2; r.y = e.y - e.h * 0.25;
      r.t -= dt;
      if (r.t <= 0) {
        e.gehalten = false;
        funken(mitte(e).x, mitte(e).y, e.a.splitter, 8);
        KLANG.treffer();
        schaden(e, lvl > 1 ? 3 : 1, null, false);
        r.zustand = "zurueck";
      }
    } else if (r.zustand === "zurueck") {
      const d = Math.hypot(REX_HEIM.x - r.x, REX_HEIM.y - r.y), v = 420 * dt;
      if (d <= v + 2) { r.zustand = "wartet"; r.cd = lvl > 1 ? 4.5 : 7.5; r.ziel = null; }
      else { r.x += (REX_HEIM.x - r.x) / d * v; r.y += (REX_HEIM.y - r.y) / d * v; }
    }
  }

  /* ---------- Gaben, die von selbst wirken ---------- */
  function gabenUpdate(dt) {
    const g = S.gaben, lebend = S.gegner.filter(angreifbar);
    if (g.hypnose) {
      S.hypT -= dt;
      if (S.hypT <= 0) {
        S.hypT = g.hypnose > 1 ? 8 : 12;
        const ziel = lebend.filter(e => e.bann <= 0).sort((a, b) => b.hp - a.hp)[0];
        if (ziel) { ziel.bann = 3; ziel.laedt = false; ziel.odemT = Math.max(ziel.odemT, 6); KLANG.floete(); }
      }
    }
    if (g.dawnbringer) {
      S.lichtT -= dt;
      if (S.lichtT <= 0 && S.gegner.some(e => !e.tot && e.a.art !== "freund" && e.a.art !== "bonus")) {
        S.lichtT = g.dawnbringer > 1 ? 10 : 15; S.licht = 0.7; KLANG.licht();
        S.gegner.forEach(e => { if (e.a.phasen) e.sichtbar = 2.5; });
        S.gegner.slice().forEach(e => { if (!e.tot && e.liegt <= 0 && e.a.art !== "freund" && e.a.art !== "bonus") schaden(e, 1, null, false); });
      }
    }
    if (g.floete) {
      S.floeteT -= dt;
      if (S.floeteT <= 0 && lebend.length) {
        S.floeteT = 14;
        const ix = 120 + Math.random() * 160, iy = BAHNEN[1].y;
        S.illusion = { x: ix, y: iy, t: 0 }; KLANG.floete();
        lebend.forEach(e => { if (e.a.art !== "boss" && Math.abs(e.x - ix) < 170) e.angst = 2.5; });
      }
    }
    if (g.ezekiel) {
      lebend.forEach(e => {
        if (e.dolch || e.bleibt || e.bew === "drache" || e.bew === "seil") return;
        const amRand = (e.dir === 1 && e.x > W - 34) || (e.dir === -1 && e.x < 34);
        if (amRand) { e.dolch = true; S.dolche.push({ x: e.dir === 1 ? W + 10 : -10, y: H - 40, ziel: e, t: 0 }); }
      });
    }
    S.dolche.forEach(d => {
      d.t += dt;
      if (d.t >= 0.18 && !d.fertig) { d.fertig = true; if (!d.ziel.tot) { funken(mitte(d.ziel).x, mitte(d.ziel).y, ["#9b3a2f", "#c4564a", "#ebe2cc"], 8); KLANG.treffer(); schaden(d.ziel, g.ezekiel > 1 ? 2 : 1, null, false); } }
    });
    S.dolche = S.dolche.filter(d => d.t < 0.3);
    S.licht = Math.max(0, S.licht - dt);
    if (S.illusion) { S.illusion.t += dt; if (S.illusion.t > 2.6) S.illusion = null; }
    S.blitze.forEach(b => b.t += dt); S.blitze = S.blitze.filter(b => b.t < 0.25);
  }

  /* ---------- Update ---------- */
  function update(dt) {
    const tx = t();
    if (S.banner) { S.banner.t += dt; if (S.banner.t > S.banner.dauer) S.banner = null; }
    S.beben = Math.max(0, S.beben - dt);
    S.abkuehl = Math.max(0, S.abkuehl - dt);
    if (S.vorgemerkt && S.abkuehl <= 0) { schiessen(S.vorgemerkt); S.vorgemerkt = null; }

    // Gegner erscheinen – Rex bellt vorher
    if (S.warte.length) {
      S.spawnT -= dt;
      if (!S.gebellt && S.spawnT <= 0.9) {
        S.gebellt = true;
        const n = S.warte[0], a = ARTEN[n.typ];
        if (a.seil) {
          S.blasen.push({ x: W / 2, y: 70, t: 0, dauer: 1.1, dir: 0, gross: false });
        } else {
          const by = a.art === "flug" || a.drache ? 170 : a.art === "boss" ? 280 : 330;
          S.blasen.push({ x: n.dir === 1 ? 38 : W - 38, y: by, t: 0, dauer: 1.1, dir: n.dir, gross: a.art === "boss" });
        }
        S.rex.hops = 0.35;
        KLANG.bellen();
      }
      if (S.spawnT <= 0) {
        spawnen(S.warte.shift());
        S.spawnT = S.abstand * (0.75 + Math.random() * 0.5); S.gebellt = false;
      }
    }

    // Höhepunkte rufen Verstärkung
    const boss = S.gegner.find(e => e.a.art === "boss" && !e.tot);
    if (boss) {
      S.eskorteT -= dt; S.eskorte2T -= dt;
      const esk = S.eskorte || boss.a.eskorte || ["goblin"];
      const ruf = typ => { S.warte.unshift({ typ, dir: Math.random() < 0.5 ? 1 : -1 }); S.spawnT = Math.min(S.spawnT, 1); S.gebellt = false; };
      if (S.eskorteT <= 0) { S.eskorteT = 3.8 / STUFEN[S.stufe].tempo; ruf(esk[0]); }
      if (S.eskorte2T <= 0) { S.eskorte2T = 7 / STUFEN[S.stufe].tempo; ruf(zufall(esk)); }
      S.bossRufT -= dt;
      if (S.bossRufT <= 0) { S.bossRufT = 9; S.beben = boss.a.mini ? 0.3 : 0.5; KLANG.bruellen(); }
    }

    // Flucht über den See: nach Ablauf der Zeit ins Boot
    if (S.fluchtT > 0 && S.fluchtLaeuft) {
      S.fluchtT -= dt;
      if (S.fluchtT <= 0) {
        S.gegner.forEach(e => { if (!e.tot) { e.weg = true; } });
        S.warte = []; textAuf(W / 2, 190, tx.geflohen, "#ebe2cc", 26, 2.2); KLANG.seite();
        if (S.rex.ziel) { S.rex.zustand = "zurueck"; S.rex.ziel = null; }
      }
    }

    // Bonusziele: oben ein Hase oder ein Blatt, unter der Erde eine flüsternde Stimme
    if (S.warte.length || S.gegner.some(e => e.a.art !== "bonus" && e.a.art !== "freund")) {
      S.bonusT -= dt;
      if (S.bonusT <= 0 && !S.gegner.some(e => e.a.art === "bonus")) {
        S.bonusT = 13 + Math.random() * 9;
        if (welt && welt.unten) { spawnen({ typ: "stimme", dir: 1, x: 70 + Math.random() * 260, y: 330 }); textAuf(W / 2, 92, tx.bonusDa.stimme, "#ebe2cc", 19, 1.6); KLANG.glocke(); }
        else spawnen({ typ: Math.random() < 0.55 ? "hase" : "blatt", dir: Math.random() < 0.5 ? 1 : -1 });
      }
    }

    gabenUpdate(dt);

    const tf = tempoFaktor();
    S.gegner.forEach(e => {
      if (e.weg) return;
      e.t += dt; e.blitz = Math.max(0, e.blitz - dt);
      if (e.tot) { e.tot += dt; return; }
      e.eis = Math.max(0, e.eis - dt); e.bann = Math.max(0, e.bann - dt); e.angst = Math.max(0, e.angst - dt); e.sichtbar = Math.max(0, e.sichtbar - dt);
      if (e.liegt > 0) { e.liegt -= dt; return; }
      if (e.gift) {
        e.gift.t -= dt;
        if (e.gift.t <= 0) { e.gift.n--; e.gift.t = 1; glut(mitte(e).x, mitte(e).y, 6, ["#8ad84a", "#b4ff6a", "#3e7a3a"]); schaden(e, 1, null, false); if (e.gift && e.gift.n <= 0) e.gift = null; }
        if (e.tot) return;
      }
      e.unsichtbar = !!e.a.phasen && e.sichtbar <= 0 && (e.t % 4) > 2.6;
      let f = (e.a.art === "bonus" || e.a.art === "freund") ? 1 : tf;
      if (e.bann > 0 || e.gehalten) f = 0;
      if (e.eis > 0) f *= 1 - e.eisK;
      const zurueck = e.angst > 0 && e.a.art !== "boss";
      if (zurueck) f *= -0.8;
      const schritt = e.dir * e.tempo * f * dt;
      switch (e.bew) {
        case "seil":
          if (e.bann <= 0) e.y += 95 * dt;
          if (e.y >= e.basisY) { e.y = e.basisY; e.bew = "boden"; }
          break;
        case "blatt":
          e.y += 34 * dt; e.x = e.basisX + Math.sin(e.t * 1.7 + e.phase) * 42;
          if (e.y > BAHNEN[0].y - 6) e.weg = true;
          return;
        case "wisp":
          e.y -= 46 * dt; e.x = e.basisX + Math.sin(e.t * 2.2 + e.phase) * 30;
          if (e.y < -30) e.weg = true;
          return;
        case "drache":
          e.x += schritt;
          if (e.x < 70 && e.dir < 0) e.dir = 1; else if (e.x > W - 70 && e.dir > 0) e.dir = -1;
          e.y = e.basisY + Math.sin(e.t * 1.4) * 18;
          if (e.bann <= 0) {
            e.odemT -= dt;
            if (e.odemT <= 2.2 && !e.laedt && e.odemT > 0) { e.laedt = true; e.unterbrechung = 0; textAuf(W / 2, 96, tx.odemLaden, "#b4ff6a", 22, 1.6); }
            if (e.odemT <= 0) {
              if (e.laedt) {
                e.laedt = false; S.leben = Math.max(0, S.leben - 1); S.combo = 0; S.beben = 0.7; KLANG.odem();
                textAuf(W / 2, 230, tx.odem, "#b4ff6a", 28, 1.5);
                for (let i = 0; i < (ruhig ? 10 : 40); i++) S.teilchen.push({ x: e.x - e.dir * 50 + (Math.random() - 0.5) * 30, y: e.y - e.h * 0.4, vx: (Math.random() - 0.5) * 160, vy: 120 + Math.random() * 200, leben: 1 + Math.random() * 0.6, max: 1.6, farbe: zufall(["#8ad84a", "#b4ff6a", "#3e7a3a"]), gr: 3 + Math.random() * 4, schwer: 0.3, leuchten: true });
              }
              e.odemT = 8;
            }
          }
          return;
        case "flug":
          e.x += schritt;
          if (e.typ === "vrock") e.y = e.basisY + Math.sin(e.t * 2.1 + e.phase) * 28 * e.s;
          else if (e.typ === "chasme") e.y = e.basisY + Math.sin(e.t * 5.2 + e.phase) * 34 * e.s + Math.sin(e.t * 1.3) * 18;
          else e.y = e.basisY + Math.sin(e.t * 7 + e.phase) * 22 + Math.sin(e.t * 2.3) * 16;
          break;
        case "fledermaus":
          e.x += e.dir * e.tempo * (f === 0 ? 0 : Math.abs(f)) * dt;
          e.y += (120 - e.y) * Math.min(1, dt * 1.5) + Math.sin(e.t * 9) * 1.2;
          break;
        case "schwebe":
          e.x += schritt; e.y = e.basisY + Math.sin(e.t * 1.2) * 10;
          break;
        case "hase":
          e.x += schritt; e.y = e.basisY - Math.abs(Math.sin(e.t * 10 + e.phase)) * 10 * e.s;
          break;
        case "boss":
          if (e.bleibt) {
            const ziel = 200 + Math.sin(e.t * 0.35) * 70;
            e.x += Math.sign(ziel - e.x) * Math.min(Math.abs(ziel - e.x), e.tempo * Math.max(0, f) * 1.2 * dt);
            e.dir = ziel > e.x ? 1 : -1;
          } else e.x += schritt;
          e.y = e.basisY + Math.sin(e.t * 1.6) * 3;
          if (e.a.teleport && !e.flieht && e.bann <= 0 && !e.gehalten) {
            e.teleT -= dt;
            if (e.teleT <= 0 && e.x > 30 && e.x < W - 30) {
              e.teleT = e.a.teleport;
              const m = mitte(e); puff(m.x, m.y, e.a.splitter, 16);
              let nx = 70 + Math.random() * 260; if (Math.abs(nx - e.x) < 70) nx = e.x < W / 2 ? nx + 90 : nx - 90;
              e.x = Math.max(60, Math.min(W - 60, nx));
              funken(e.x, mitte(e).y, e.a.splitter, 14);
            }
          }
          break;
        default:
          e.x += schritt; e.y = e.basisY + Math.sin(e.t * 9 + e.phase) * 1.4 * e.s;
      }
      if (zurueck) {
        if (e.dir === 1 && e.x < -e.w / 2 + 2) e.x = -e.w / 2 + 2;
        if (e.dir === -1 && e.x > W + e.w / 2 - 2) e.x = W + e.w / 2 - 2;
      }
      if (e.bleibt) return;
      if ((e.dir === 1 && e.x - e.w / 2 > W) || (e.dir === -1 && e.x + e.w / 2 < 0)) {
        e.weg = true;
        if (S.rex.ziel === e) { S.rex.zustand = "zurueck"; S.rex.ziel = null; }
        const rx = e.dir === 1 ? W - 70 : 70, ry = Math.min(e.y - e.h / 2, 420);
        if (e.a.art === "bonus") return;
        if (e.a.art === "freund") { if (!e.aua) { S.punkte += e.a.punkte; textAuf(rx, ry, tx.wolfFrei + " +" + e.a.punkte, "#ebe2cc", 18, 1.3); KLANG.glocke(); } return; }
        if (e.verwandelt || (e.flieht && tx.entwischt[e.typ])) textAuf(W / 2, 180, tx.entwischt[e.verwandelt ? "nezna" : e.typ], "#c88aff", 20, 2);
        if (e.verlust > 0) {
          S.leben = Math.max(0, S.leben - e.verlust); S.combo = 0; S.beben = Math.max(S.beben, 0.35);
          textAuf(rx, ry, tx.entkommen, "#c4564a", 18, 1.1);
          KLANG.entkommen();
        }
      }
    });
    S.gegner = S.gegner.filter(e => !e.weg && !(e.tot && e.tot > 0.5));

    // Pfeile mit Unterschritten
    S.pfeile.forEach(p => {
      const schritte = 3;
      for (let k = 0; k < schritte && !p.weg; k++) {
        const d = dt / schritte;
        p.vy += G * d; p.x += p.vx * d; p.y += p.vy * d; p.t += d;
        for (const e of S.gegner) {
          if (e.tot || e.liegt > 0 || e.unsichtbar || p.getroffen.includes(e)) continue;
          const m = mitte(e), r = radius(e);
          if ((p.x - m.x) ** 2 + (p.y - m.y) ** 2 < r * r) {
            p.getroffen.push(e);
            pfeilTrifft(p, e);
            if (p.durch > 0) p.durch--; else { p.weg = true; }
            break;
          }
        }
        if (p.y > H + 20 || p.x < -40 || p.x > W + 40 || p.y < -400) p.weg = true;
      }
      if (p.feuer && !ruhig && Math.random() < 0.6) S.teilchen.push({ x: p.x, y: p.y, vx: (Math.random() - 0.5) * 20, vy: -20, leben: 0.3, max: 0.3, farbe: "#e0a046", gr: 2, schwer: -0.2, leuchten: true });
    });
    S.pfeile.filter(p => p.weg).forEach(p => salveSchliessen(p.salve));
    S.pfeile = S.pfeile.filter(p => !p.weg);

    rexUpdate(dt);

    S.teilchen.forEach(q => { q.leben -= dt; q.vy += 300 * q.schwer * dt; q.x += q.vx * dt; q.y += q.vy * dt; });
    S.teilchen = S.teilchen.filter(q => q.leben > 0);
    S.texte.forEach(x => { x.t += dt; x.y -= 22 * dt; });
    S.texte = S.texte.filter(x => x.t < x.dauer);
    S.blasen.forEach(b => b.t += dt);
    S.blasen = S.blasen.filter(b => b.t < b.dauer);

    if (S.leben <= 0) { S.endeT += dt; if (S.endeT > 0.9) spielEnde(); return; }

    const offen = S.gegner.some(e => e.a.art !== "bonus" && e.a.art !== "freund");
    if (!S.warte.length && !offen && S.welleFertigT < 0) S.welleFertigT = 0;
    if (S.welleFertigT >= 0) { S.welleFertigT += dt; if (S.welleFertigT > 1.1 && !S.pfeile.length) welleGeschafft(); }
  }

  function welleGeschafft() {
    const n = S.welle;
    if (n <= PLAN.length && (n === PLAN.length || PLAN[n].kap !== PLAN[n - 1].kap)) {
      const k = PLAN[n - 1].kap;
      S.kapFertig = Math.max(S.kapFertig, k + 1); S.kapGeschafft = k;
      Object.keys(GABE_AB).forEach(g => { if (GABE_AB[g] === S.kapFertig) S.neuFrei.push(g); });
      const frei = Math.min(KAPITEL.length, k + 2);
      if (frei > kapFrei) { kapFrei = frei; schreib("imres-waldlauf-kapitel", String(kapFrei)); }
      KLANG.seite();
    } else S.kapGeschafft = -1;
    gabenZeigen();
  }

  /* ---------- Zeichnen ---------- */
  const leinwand = document.createElement("canvas");
  const ctx = leinwand.getContext("2d");
  let skala = 1, welt = null, weltAlt = null, wechsel = 0, weltName = "";
  const amb = Array.from({ length: 22 }, () => ({ x: Math.random() * W, y: Math.random() * H, p: Math.random() * 6, v: 0.4 + Math.random() * 0.8 }));

  function weltSetzen(name) {
    if (name === weltName) return;
    weltAlt = welt; welt = WELT.bauen(name); weltName = name; wechsel = weltAlt ? 1 : 0;
  }

  function ambientZeichnen(art, jetzt) {
    const s = jetzt / 1000;
    amb.forEach((f, i) => {
      let x, y, farbe, r = 1.6;
      if (art === "gluehwurm") {
        x = f.x + Math.sin(s * f.v + f.p) * 18; y = 180 + (f.y % 260) + Math.cos(s * 0.77 * f.v + f.p) * 10;
        const a = 0.35 + 0.35 * Math.sin(s * 2.5 * f.v + f.p); farbe = "rgba(224,190,110," + Math.max(0, a).toFixed(2) + ")";
      } else if (art === "glut") {
        y = H - ((f.y + s * 30 * f.v) % H); x = f.x + Math.sin(s * f.v + f.p) * 12;
        farbe = "rgba(255," + (140 + (i % 3) * 30) + ",70," + (0.25 + 0.5 * (y / H)).toFixed(2) + ")"; r = 1.4;
      } else if (art === "sporen") {
        y = H - ((f.y + s * 12 * f.v) % H); x = f.x + Math.sin(s * 0.6 * f.v + f.p) * 20;
        farbe = i % 2 ? "rgba(110,230,230,.55)" : "rgba(190,130,255,.5)"; r = 1.3 + (i % 3) * 0.4;
      } else if (art === "staub") {
        x = (f.x + s * 6 * f.v) % W; y = 60 + (f.y % 300) + Math.sin(s * f.v + f.p) * 8;
        farbe = "rgba(170,210,255," + (0.2 + 0.25 * Math.sin(s * 2 * f.v + f.p)).toFixed(2) + ")"; r = 1.1;
      } else if (art === "asche") {
        y = (f.y + s * 14 * f.v) % H; x = f.x + Math.sin(s * 0.8 * f.v + f.p) * 16;
        farbe = "rgba(168,159,143,.35)"; r = 1.3;
      } else return;
      ctx.fillStyle = farbe; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    });
  }

  function gegnerZeichnen(e) {
    const sp = SPRITES[e.sp];
    let alpha = 1, dy = 0, dreh = 0;
    if (e.tot) { const k = e.tot / 0.5; alpha = 1 - k; dy = k * 18; dreh = e.dir * k * 0.5; }
    if (e.bew === "boden" && e.t < 0.35 && !e.a.seil) dy += (1 - e.t / 0.35) * e.h * 0.6;
    if (e.unsichtbar) alpha *= 0.12;
    else if (e.a.phasen && e.sichtbar <= 0) { const ph = e.t % 4; if (ph > 2.3) alpha *= Math.max(0.12, 1 - (ph - 2.3) / 0.3); else if (ph < 0.3) alpha *= Math.max(0.12, ph / 0.3); }
    if (e.bew === "seil") {
      ctx.strokeStyle = "rgba(220,230,240,.35)"; ctx.lineWidth = 0.8;
      ctx.beginPath(); ctx.moveTo(e.x, 0); ctx.lineTo(e.x, e.y - e.h * 0.6); ctx.stroke();
    }
    const wackel = e.gehalten ? Math.sin(e.t * 40) * 2 : 0;
    ctx.save();
    ctx.globalAlpha = alpha * (e.blitz > 0 ? 0.55 : 1);
    ctx.translate(e.x + wackel, e.y + dy);
    if (e.typ === "blatt") { ctx.translate(0, -e.h / 2); ctx.rotate(Math.sin(e.t * 2.3 + e.phase) * 0.9); ctx.translate(0, e.h / 2); }
    if (dreh) ctx.rotate(dreh);
    if (e.liegt > 0) { ctx.globalAlpha *= 0.8; ctx.rotate(e.dir * 1.35); ctx.scale(0.8, 0.8); }
    if (e.bew === "flug" || e.bew === "fledermaus") ctx.rotate(Math.sin(e.t * 3 + e.phase) * 0.06);
    if (sp) {
      const img = (e.dir === e.a.blick) ? sp.normal : sp.gespiegelt;
      let schatten = e.a.glut || (e.a.art === "bonus" ? "rgba(255,207,122,.8)" : "rgba(235,226,204,.38)");
      if (e.gift) schatten = "rgba(140,230,70,.9)";
      if (e.eis > 0) schatten = "rgba(150,220,255,.95)";
      if (e.laedt) schatten = "rgba(180,255,90," + (0.6 + 0.4 * Math.sin(e.t * 20)).toFixed(2) + ")";
      ctx.shadowColor = schatten; ctx.shadowBlur = e.a.art === "boss" || e.laedt ? 20 : e.a.art === "bonus" || e.eis > 0 || e.gift ? 14 : 9;
      ctx.drawImage(img, -e.w / 2, -e.h, e.w, e.h);
      ctx.shadowBlur = 0;
      if (e.eis > 0) { ctx.globalAlpha *= 0.28; ctx.fillStyle = "#bfe8ff"; ctx.beginPath(); ctx.ellipse(0, -e.h / 2, e.w * 0.45, e.h * 0.5, 0, 0, Math.PI * 2); ctx.fill(); }
    } else {
      ctx.fillStyle = e.a.splitter[0]; ctx.beginPath(); ctx.ellipse(0, -e.h / 2, e.w / 2.4, e.h / 2.2, 0, 0, 7); ctx.fill();
    }
    ctx.restore();
    if (e.tot || e.liegt > 0 || e.unsichtbar) return;
    const kopf = e.y - e.h - 8;
    if (e.maxHp > 1 && e.a.art !== "freund") {
      const bw = e.a.art === "boss" ? 120 : Math.max(26, e.w * 0.55), bx = Math.max(4, Math.min(W - bw - 4, e.x - bw / 2));
      ctx.fillStyle = "rgba(16,14,21,.75)"; ctx.fillRect(bx - 1, kopf - 1, bw + 2, 5);
      ctx.fillStyle = e.a.art === "boss" && !e.a.mini ? "#c4564a" : "#e0a046"; ctx.fillRect(bx, kopf, bw * Math.max(0, e.hp / e.maxHp), 3);
    }
    if (e.mal) { ctx.fillStyle = "#e0a046"; ctx.beginPath(); ctx.moveTo(e.x, kopf - 12); ctx.lineTo(e.x + 4, kopf - 7); ctx.lineTo(e.x, kopf - 2); ctx.lineTo(e.x - 4, kopf - 7); ctx.closePath(); ctx.fill(); }
    if (e.bann > 0) {
      ctx.strokeStyle = "rgba(200,138,255,.85)"; ctx.lineWidth = 1.6;
      for (let i = 0; i < 2; i++) { ctx.beginPath(); ctx.arc(e.x, kopf - 8, 6 + i * 4, e.t * 6 + i * 2, e.t * 6 + i * 2 + Math.PI * 1.3); ctx.stroke(); }
    }
    if (e.laedt) {
      ctx.strokeStyle = "#b4ff6a"; ctx.lineWidth = 2;
      for (let i = 0; i < 3; i++) { ctx.globalAlpha = i < e.unterbrechung ? 0.25 : 1; ctx.beginPath(); ctx.arc(e.x - 14 + i * 14, kopf - 12, 4, 0, Math.PI * 2); ctx.stroke(); }
      ctx.globalAlpha = 1;
    }
  }

  function friedrichZeichnen(z) {
    const ang = z ? z.ang : -Math.PI / 2 + Math.sin(performance.now() / 1400) * 0.05;
    const p = z ? z.p : 0;
    const sx = SCHULTER.x, sy = SCHULTER.y;
    ctx.fillStyle = "#0a0d0a";
    ctx.beginPath(); ctx.ellipse(200, H + 14, 120, 48, 0, 0, Math.PI * 2); ctx.fill();
    ctx.save(); ctx.translate(sx + 12, sy - 6); ctx.rotate(0.35);
    ctx.fillStyle = "#3a2c1e"; ctx.fillRect(-4, -4, 8, 34);
    ctx.strokeStyle = "#e0a046"; ctx.lineWidth = 1.5;
    for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.moveTo(i * 2.5, -4); ctx.lineTo(i * 3, -12); ctx.stroke(); }
    ctx.restore();
    ctx.fillStyle = "#1f2a1d";
    ctx.beginPath(); ctx.moveTo(sx - 18, sy); ctx.quadraticCurveTo(sx - 34, sy + 30, sx - 30, H + 2); ctx.lineTo(sx + 30, H + 2); ctx.quadraticCurveTo(sx + 34, sy + 30, sx + 18, sy); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = "rgba(224,160,70,.35)"; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(sx + 18, sy); ctx.quadraticCurveTo(sx + 34, sy + 30, sx + 30, H); ctx.stroke();
    ctx.fillStyle = "#243022";
    ctx.beginPath(); ctx.moveTo(sx - 13, sy - 4); ctx.quadraticCurveTo(sx - 14, sy - 26, sx, sy - 30); ctx.quadraticCurveTo(sx + 14, sy - 26, sx + 13, sy - 4); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = "rgba(224,160,70,.3)"; ctx.beginPath(); ctx.moveTo(sx, sy - 30); ctx.quadraticCurveTo(sx + 14, sy - 26, sx + 13, sy - 4); ctx.stroke();
    const dx = Math.cos(ang), dy = Math.sin(ang), px = -dy, py = dx;
    const b = bogenPunkt(ang);
    ctx.strokeStyle = "#1f2a1d"; ctx.lineWidth = 6; ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(sx - 6, sy - 2); ctx.lineTo(b.x, b.y); ctx.stroke();
    const t1 = { x: b.x + px * 27 - dx * 9, y: b.y + py * 27 - dy * 9 }, t2 = { x: b.x - px * 27 - dx * 9, y: b.y - py * 27 - dy * 9 };
    const nock = { x: b.x - dx * (8 + p * 18), y: b.y - dy * (8 + p * 18) };
    ctx.strokeStyle = "rgba(235,226,204,.75)"; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(t1.x, t1.y); ctx.lineTo(nock.x, nock.y); ctx.lineTo(t2.x, t2.y); ctx.stroke();
    ctx.strokeStyle = "#8a6a44"; ctx.lineWidth = 3.2;
    ctx.beginPath(); ctx.moveTo(t1.x, t1.y); ctx.quadraticCurveTo(b.x + dx * 9, b.y + dy * 9, t2.x, t2.y); ctx.stroke();
    if (S && S.abkuehl <= 0 && zustand === "spiel") {
      const spitze = { x: nock.x + dx * 44, y: nock.y + dy * 44 };
      pfeilZeichnen(nock.x, nock.y, spitze.x, spitze.y, S.gaben.feuer);
    } else if (S && zustand === "spiel") {
      const k = 1 - S.abkuehl / (0.55 * Math.pow(0.78, S.gaben.zug));
      ctx.strokeStyle = "rgba(224,160,70,.6)"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(sx, sy - 16, 22, -Math.PI / 2, -Math.PI / 2 + k * Math.PI * 2); ctx.stroke();
    }
    ctx.lineCap = "butt";
  }

  function pfeilZeichnen(x1, y1, x2, y2, feuer) {
    const ang = Math.atan2(y2 - y1, x2 - x1);
    ctx.strokeStyle = "#c9b28a"; ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    ctx.fillStyle = feuer ? "#ffcf7a" : "#d8d0bd";
    ctx.save(); ctx.translate(x2, y2); ctx.rotate(ang);
    if (feuer) { ctx.shadowColor = "#e0a046"; ctx.shadowBlur = 10; }
    ctx.beginPath(); ctx.moveTo(4, 0); ctx.lineTo(-4, -3.2); ctx.lineTo(-4, 3.2); ctx.closePath(); ctx.fill();
    ctx.restore();
    ctx.save(); ctx.translate(x1, y1); ctx.rotate(ang);
    ctx.fillStyle = "#9b3a2f";
    ctx.beginPath(); ctx.moveTo(6, 0); ctx.lineTo(-2, -4); ctx.lineTo(0, 0); ctx.lineTo(-2, 4); ctx.closePath(); ctx.fill();
    ctx.restore();
  }

  function flugbahnZeichnen(z) {
    const b = bogenPunkt(z.ang);
    let x = b.x, y = b.y, vx = Math.cos(z.ang) * z.v, vy = Math.sin(z.ang) * z.v;
    const dauer = S.gaben.adler ? 0.85 : 0.3, schritt = 0.028;
    for (let tt = 0; tt < dauer; tt += schritt) {
      vy += G * schritt; x += vx * schritt; y += vy * schritt;
      if (y < -10 || x < -10 || x > W + 10) break;
      ctx.fillStyle = "rgba(224,160,70," + (0.75 * (1 - tt / dauer)).toFixed(3) + ")";
      ctx.beginPath(); ctx.arc(x, y, 2, 0, Math.PI * 2); ctx.fill();
    }
  }

  function rexZeichnen() {
    const r = S ? S.rex : { x: REX_HEIM.x, y: REX_HEIM.y, hops: 0, zustand: "wartet" };
    const gr = r.zustand === "wartet" ? 50 : 40;
    const hop = r.hops > 0 ? Math.sin(r.hops / 0.35 * Math.PI) * 10 : 0;
    const lauf = (r.zustand === "rennt" || r.zustand === "zurueck") ? Math.abs(Math.sin(performance.now() / 70)) * 6 : 0;
    if (rexBild) ctx.drawImage(rexBild, r.x - gr / 2, r.y - gr / 2 - hop - lauf, gr, gr);
    else { ctx.fillStyle = "#6a4a2e"; ctx.beginPath(); ctx.arc(r.x, r.y - hop, gr / 2.4, 0, 7); ctx.fill(); }
  }

  function blaseZeichnen(b) {
    const k = b.t / b.dauer, a = k < 0.15 ? k / 0.15 : k > 0.8 ? (1 - k) / 0.2 : 1;
    const txt = t().wuff + (b.gross ? "!!" : "");
    ctx.save(); ctx.globalAlpha = a;
    ctx.font = "600 " + (b.gross ? 24 : 20) + "px " + FONT_H;
    const tw = ctx.measureText(txt).width + 16, th = b.gross ? 32 : 28;
    const x = Math.max(4, Math.min(W - tw - 4, b.x - tw / 2)), y = b.y - th / 2 + Math.sin(b.t * 20) * 1.5;
    ctx.fillStyle = "rgba(241,231,207,.95)"; ctx.strokeStyle = "#e0a046"; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.rect(x, y, tw, th); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#2a2118"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText(txt, x + tw / 2, y + th / 2 + 1);
    ctx.fillStyle = "#e0a046"; ctx.font = "16px " + FONT_D;
    if (b.dir) ctx.fillText(b.dir === 1 ? "◂" : "▸", b.dir === 1 ? x + tw + 9 : x - 9, y + th / 2);
    else ctx.fillText("▴", x + tw / 2, y - 8);
    ctx.restore();
  }

  function hudZeichnen() {
    const tx = t();
    ctx.textBaseline = "top";
    ctx.fillStyle = "rgba(9,8,15,.55)"; ctx.fillRect(0, 0, W, 34);
    ctx.font = "15px " + FONT_D; ctx.fillStyle = "#a89f8f"; ctx.textAlign = "left";
    const kap = S.kapAktuell >= KAPITEL.length ? "∞" : ROEMISCH[S.kapAktuell];
    ctx.fillText(tx.hud(kap, S.welle), 10, 10);
    ctx.textAlign = "center"; ctx.fillStyle = "#e0a046"; ctx.font = "22px " + FONT_D;
    ctx.fillText(String(S.punkte), W / 2, 6);
    ctx.textAlign = "right";
    let hs = ""; for (let i = 0; i < S.maxLeben; i++) hs += i < S.leben ? "♥" : "♡";
    ctx.font = (S.maxLeben > 5 ? 14 : 16) + "px " + FONT_D;
    ctx.fillStyle = S.leben <= 1 ? "#c4564a" : "#e0a046"; ctx.fillText(hs, W - 10, 9);
    let zeile = 37;
    if (S.fluchtT > 0 && S.fluchtLaeuft) {
      ctx.textAlign = "center"; ctx.font = "600 19px " + FONT_H; ctx.fillStyle = "#9be7ff";
      ctx.fillText(tx.boot(Math.ceil(S.fluchtT)), W / 2, zeile); zeile += 20;
    }
    if (S.combo >= 2) {
      ctx.textAlign = "center"; ctx.font = "600 18px " + FONT_H; ctx.fillStyle = "#ebe2cc";
      ctx.fillText(tx.serie(S.combo), W / 2, zeile);
    }
    const g = Object.keys(S.gaben).filter(k => k !== "rast" && S.gaben[k] > 0);
    ctx.textAlign = "left"; ctx.textBaseline = "bottom"; ctx.font = "12px sans-serif"; ctx.globalAlpha = 0.85;
    g.forEach((k, i) => ctx.fillText(GABE_SYM[k] + (S.gaben[k] > 1 ? S.gaben[k] : ""), 6 + (i % 6) * 23, H - 5 - Math.floor(i / 6) * 17));
    ctx.globalAlpha = 1;
  }

  function bannerZeichnen() {
    const b = S.banner; if (!b) return;
    const k = b.t / b.dauer, a = k < 0.15 ? k / 0.15 : k > 0.75 ? (1 - k) / 0.25 : 1;
    ctx.save(); ctx.globalAlpha = a; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillStyle = "rgba(9,8,15,.5)"; ctx.fillRect(0, 186, W, 74);
    ctx.fillStyle = "#e0a046"; ctx.font = "34px " + FONT_D; ctx.fillText(b.titel, W / 2, 212);
    ctx.fillStyle = "#ebe2cc"; ctx.font = "600 21px " + FONT_H; ctx.fillText(b.unter, W / 2, 242);
    ctx.restore();
  }

  function zeichnen(jetzt) {
    if (!welt) return;
    const s = jetzt / 1000;
    ctx.setTransform(skala, 0, 0, skala, 0, 0);
    ctx.save();
    if (S && S.beben > 0 && !ruhig) ctx.translate((Math.random() - 0.5) * 8 * S.beben, (Math.random() - 0.5) * 8 * S.beben);
    ctx.drawImage(welt.hg, 0, 0, W, H);
    welt.deko(ctx, s);
    ambientZeichnen(welt.partikel, jetzt);
    const gg = S ? S.gegner : [];
    gg.forEach(e => { if (e.bahn < 0 && (e.bew === "drache" || e.bew === "schwebe")) gegnerZeichnen(e); });
    for (let i = 0; i < 3; i++) {
      gg.forEach(e => { if (e.bahn === i) gegnerZeichnen(e); });
      ctx.drawImage(welt.lagen[i], 0, 0, W, H);
    }
    gg.forEach(e => { if (e.bahn < 0 && e.bew !== "drache" && e.bew !== "schwebe") gegnerZeichnen(e); });
    if (weltAlt && wechsel > 0) {
      ctx.globalAlpha = wechsel; ctx.drawImage(weltAlt.hg, 0, 0, W, H); weltAlt.lagen.forEach(l => ctx.drawImage(l, 0, 0, W, H)); ctx.globalAlpha = 1;
    }
    if (S) {
      if (S.illusion && SPRITES.illusion) {
        const il = S.illusion, a = il.t < 0.3 ? il.t / 0.3 : il.t > 2.2 ? (2.6 - il.t) / 0.4 : 1, hh = 70;
        ctx.save(); ctx.globalAlpha = Math.max(0, a) * 0.85; ctx.shadowColor = "rgba(255,150,80,.8)"; ctx.shadowBlur = 16;
        ctx.drawImage(SPRITES.illusion.normal, il.x - hh * SPRITES.illusion.verh / 2, il.y - hh + Math.sin(il.t * 8) * 3, hh * SPRITES.illusion.verh, hh); ctx.restore();
      }
      S.pfeile.forEach(p => {
        const sp = Math.hypot(p.vx, p.vy) || 1;
        pfeilZeichnen(p.x - p.vx / sp * 30, p.y - p.vy / sp * 30, p.x, p.y, p.feuer);
      });
      S.dolche.forEach(d => {
        if (d.ziel.tot && d.fertig) return;
        const m = mitte(d.ziel), k = Math.min(1, d.t / 0.18), x = d.x + (m.x - d.x) * k, y = d.y + (m.y - d.y) * k;
        ctx.save(); ctx.translate(x, y); ctx.rotate(Math.atan2(m.y - d.y, m.x - d.x)); ctx.fillStyle = "#e2ded2";
        ctx.beginPath(); ctx.moveTo(9, 0); ctx.lineTo(-4, -2.5); ctx.lineTo(-4, 2.5); ctx.closePath(); ctx.fill(); ctx.fillStyle = "#9b3a2f"; ctx.fillRect(-9, -1.5, 5, 3); ctx.restore();
      });
      S.blitze.forEach(b => {
        ctx.strokeStyle = "rgba(200,230,255," + (1 - b.t / 0.25).toFixed(2) + ")"; ctx.lineWidth = 2; ctx.shadowColor = "#9be7ff"; ctx.shadowBlur = 10;
        ctx.beginPath(); ctx.moveTo(b.a.x, b.a.y);
        for (let i = 1; i < 5; i++) ctx.lineTo(b.a.x + (b.b.x - b.a.x) * i / 5 + (Math.random() - 0.5) * 14, b.a.y + (b.b.y - b.a.y) * i / 5 + (Math.random() - 0.5) * 14);
        ctx.lineTo(b.b.x, b.b.y); ctx.stroke(); ctx.shadowBlur = 0;
      });
      S.teilchen.forEach(q => {
        ctx.globalAlpha = Math.max(0, q.leben / q.max);
        ctx.fillStyle = q.farbe;
        if (q.leuchten) { ctx.beginPath(); ctx.arc(q.x, q.y, q.gr, 0, 7); ctx.fill(); }
        else ctx.fillRect(q.x - q.gr / 2, q.y - q.gr / 2, q.gr, q.gr);
      });
      ctx.globalAlpha = 1;
    }
    const z = zustand === "spiel" ? zielVektor() : null;
    if (z) flugbahnZeichnen(z);
    friedrichZeichnen(z);
    rexZeichnen();
    if (S) {
      S.blasen.forEach(blaseZeichnen);
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      S.texte.forEach(x => {
        ctx.globalAlpha = Math.max(0, 1 - x.t / x.dauer);
        ctx.font = (x.gr > 20 ? "" : "600 ") + x.gr + "px " + (x.gr > 20 ? FONT_D : FONT_H);
        const xx = Math.max(ctx.measureText(x.text).width / 2 + 4, Math.min(W - ctx.measureText(x.text).width / 2 - 4, x.x));
        ctx.fillStyle = "rgba(9,8,15,.6)"; ctx.fillText(x.text, xx + 1, x.y + 1);
        ctx.fillStyle = x.farbe; ctx.fillText(x.text, xx, x.y);
      });
      ctx.globalAlpha = 1;
      if (S.licht > 0) { ctx.fillStyle = "rgba(255,236,190," + (S.licht * 0.55).toFixed(2) + ")"; ctx.fillRect(0, 0, W, H); }
    }
    ctx.restore();
    if (S && zustand !== "start" && zustand !== "geschichte") hudZeichnen();
    if (S && zustand === "spiel") bannerZeichnen();
  }

  /* ---------- Schleife ---------- */
  let sichtbar = false, letzte = 0, rafId = 0;
  function schleife(jetzt) {
    rafId = 0;
    const dt = Math.min(0.033, (jetzt - (letzte || jetzt)) / 1000);
    letzte = jetzt;
    if (wechsel > 0) { wechsel = Math.max(0, wechsel - dt / 1.2); if (!wechsel) weltAlt = null; }
    if (zustand === "spiel" && S) update(dt);
    else if (S && (zustand === "wahl" || zustand === "ende" || zustand === "geschichte")) {
      S.teilchen.forEach(q => { q.leben -= dt; q.vy += 300 * q.schwer * dt; q.x += q.vx * dt; q.y += q.vy * dt; });
      S.teilchen = S.teilchen.filter(q => q.leben > 0);
    }
    zeichnen(jetzt);
    if (sichtbar && !document.hidden && zustand !== "pause") rafId = requestAnimationFrame(schleife);
  }
  function anwerfen() { if (!rafId && sichtbar && !document.hidden) { letzte = 0; rafId = requestAnimationFrame(schleife); } }

  /* ---------- DOM & Overlays ---------- */
  let buehne, schleier, tafel, fussRekord, tonKnopf, pauseKnopf, listeEl;
  const rekordKey = st => "imres-waldlauf-rekord-" + st;
  (function altenRekordUebernehmen() { const alt = lies("imres-waldlauf-rekord", ""); if (alt && !lies(rekordKey("waldlaeufer"), "")) schreib(rekordKey("waldlaeufer"), alt); })();
  const aktuelleStufe = () => (S && zustand !== "start" ? S.stufe : stufeWahl);

  function aufbauen() {
    const tx = t();
    root.innerHTML =
      '<p class="label" id="wl-label">' + esc(tx.label) + '</p>' +
      '<h3 id="wl-titel">' + esc(tx.titel) + '</h3>' +
      '<p class="tav-info" id="wl-text">' + esc(tx.text) + '</p>' +
      '<p class="wl-steuerung" id="wl-steuerung">' + esc(tx.steuerung) + '</p>' +
      '<div class="wl-buehne"><button type="button" class="wl-pause" aria-label="Pause"><span aria-hidden="true">❚❚</span></button><div class="wl-schleier"><div class="wl-tafel"></div></div></div>' +
      '<div class="wl-fuss"><span class="wl-rekord"></span><button type="button" class="wl-ton"></button></div>' +
      '<div class="wl-liste" aria-live="polite"></div>';
    buehne = root.querySelector(".wl-buehne");
    buehne.insertBefore(leinwand, buehne.firstChild);
    leinwand.setAttribute("aria-label", tx.titel);
    schleier = root.querySelector(".wl-schleier");
    tafel = root.querySelector(".wl-tafel");
    fussRekord = root.querySelector(".wl-rekord");
    tonKnopf = root.querySelector(".wl-ton");
    pauseKnopf = root.querySelector(".wl-pause");
    listeEl = root.querySelector(".wl-liste");
    tonKnopf.addEventListener("click", () => { tonAn = !tonAn; schreib("imres-waldlauf-ton", tonAn ? "1" : "0"); fussSetzen(); if (tonAn) KLANG.bellen(); });
    pauseKnopf.addEventListener("click", pausieren);
    tafel.addEventListener("click", tafelKlick);
    tafel.addEventListener("keydown", e => { if (e.key === "Enter" && e.target.closest(".wl-name")) { e.preventDefault(); eintragen(); } });
    fussSetzen();
  }
  function fussSetzen() {
    const tx = t(), st = aktuelleStufe(), r = parseInt(lies(rekordKey(st), "0"), 10);
    fussRekord.textContent = r ? tx.rekord(r, tx.stufen[st]) : "";
    tonKnopf.textContent = tonAn ? tx.ton[0] : tx.ton[1];
    tonKnopf.setAttribute("aria-pressed", String(tonAn));
    pauseKnopf.setAttribute("aria-label", tx.pauseKnopf);
  }
  function texteSetzen() {
    const tx = t();
    root.querySelector("#wl-label").textContent = tx.label;
    root.querySelector("#wl-titel").textContent = tx.titel;
    root.querySelector("#wl-text").textContent = tx.text;
    root.querySelector("#wl-steuerung").textContent = tx.steuerung;
    leinwand.setAttribute("aria-label", tx.titel);
    fussSetzen(); listeNeu();
    if (zustand === "start") startZeigen();
    else if (zustand === "pause") pauseZeigen();
    else if (zustand === "wahl") gabenZeigen(true);
    else if (zustand === "ende") spielEnde(true);
    else if (zustand === "geschichte") geschichteZeigen(S.geschichteN, true);
  }

  function schleierAuf(html) { tafel.innerHTML = html; schleier.hidden = false; buehne.classList.remove("laeuft"); schleier.scrollTop = 0; }
  function schleierZu() { schleier.hidden = true; buehne.classList.add("laeuft"); }

  function stufenHtml(tx) {
    return '<div class="wl-stufen" role="radiogroup" aria-label="' + esc(tx.stufenTitel) + '">' +
      Object.keys(STUFEN).map(k => '<button type="button" role="radio" data-stufe="' + k + '" aria-checked="' + (k === stufeWahl) + '">' + esc(tx.stufen[k]) + '</button>').join("") +
      '</div><p class="wl-stufen-text">' + esc(tx.stufenText[stufeWahl]) + '</p>';
  }
  function kapitelHtml(tx) {
    if (kapFrei <= 1) return "";
    let h = '<div class="wl-kapitel" role="radiogroup" aria-label="' + esc(tx.kapWahl) + '"><span>' + esc(tx.kapWahl) + '</span>';
    for (let i = 0; i < kapFrei; i++) h += '<button type="button" role="radio" data-kap="' + i + '" aria-checked="' + (i === startKap) + '" title="' + esc(tx.kap[i].titel) + '">' + ROEMISCH[i] + '</button>';
    return h + '</div>' + (startKap > 0 ? '<p class="wl-stufen-text">' + esc(tx.kap[startKap].titel) + ' · ' + esc(tx.uebung) + '</p>' : "");
  }
  function startZeigen() {
    const tx = t();
    weltSetzen(KAPITEL[startKap].thema);
    schleierAuf('<h4>' + esc(tx.titel) + '</h4>' + stufenHtml(tx) + kapitelHtml(tx) +
      '<button type="button" class="tav-knopf wl-haupt" data-tun="start">' + esc(tx.start) + '</button>');
  }
  function pauseZeigen() {
    const tx = t();
    schleierAuf('<h4>' + esc(tx.pause) + '</h4><p>' + esc(tx.pauseText) + '</p><button type="button" class="tav-knopf wl-haupt" data-tun="weiter">' + esc(tx.weiter) + '</button>' +
      '<button type="button" class="wl-leise" data-tun="beenden">' + esc(tx.beenden) + '</button>');
  }

  /* Friedrichs Erzählung vor jedem Kapitel – auf einem Pergamentblatt */
  function geschichteZeigen(n, nurNeuZeichnen) {
    const tx = t(), k = kapitelVon(n), endlos = k >= KAPITEL.length;
    const daten = endlos ? tx.endlos : tx.kap[k], bild = endlos ? ENDLOS_BILD : KAPITEL[k].bild;
    if (!nurNeuZeichnen) {
      zustand = "geschichte"; S.geschichteN = n; zielen = null;
      weltSetzen(endlos ? S.endlosThemen[0] : KAPITEL[k].thema);
      KLANG.seite();
    }
    schleierAuf('<article class="wl-blatt">' +
      (bild ? '<img src="' + esc(bild) + '" alt="" loading="eager">' : "") +
      '<p class="label">' + esc(endlos ? "∞" : tx.kapitel + " " + ROEMISCH[k]) + '</p>' +
      '<h4>' + esc(daten.titel) + '</h4>' +
      '<p class="wl-erz">' + esc(daten.text) + '</p>' +
      '<button type="button" class="tav-knopf wl-haupt" data-tun="kampf">' + esc(tx.weiter) + '</button>' +
      '</article>');
  }

  let angebot = [];
  function gabenZeigen(nurNeuZeichnen) {
    const tx = t();
    if (!nurNeuZeichnen) {
      zustand = "wahl"; zielen = null; S.vorgemerkt = null;
      S.texte = []; S.blasen = []; S.banner = null;
      S.gegner = S.gegner.filter(e => e.a.art !== "bonus" && e.a.art !== "freund");
      const moegl = gabenMoeglich();
      const neu = S.neuFrei.filter(k => moegl.includes(k));
      const ohneRast = moegl.filter(k => k !== "rast" && !neu.includes(k));
      const rastRein = moegl.includes("rast") && (S.leben <= 2 || Math.random() < 0.35);
      angebot = neu.concat(mischen(ohneRast)).slice(0, rastRein ? 2 : 3);
      if (rastRein) angebot.push("rast");
      if (!angebot.length) angebot = ["rast"];
      S.neuMarke = neu.slice(); S.neuFrei = [];
      KLANG.gabe();
    }
    const dreh = [-1.2, 0.8, -0.5];
    const karten = angebot.map((k, i) => {
      const lvl = S.gaben[k], stufen = tx.gaben[k], [name, text] = stufen[Math.min(lvl, stufen.length - 1)];
      const stufe = GABEN[k] > 1 && GABEN[k] < 99 ? '<span class="stufe">' + esc(tx.stufe(lvl + 1, GABEN[k])) + '</span>' : "";
      const neuMarke = (S.neuMarke || []).includes(k) ? '<span class="neu">' + esc(tx.neu) + '</span>' : "";
      return '<button type="button" class="wl-gabe" data-gabe="' + k + '" style="--dreh:' + dreh[i] + 'deg"><span class="sym" aria-hidden="true">' + GABE_SYM[k] + '</span><span class="wl-gabe-text"><strong>' + esc(name) + stufe + neuMarke + '</strong><small>' + esc(text) + '</small></span></button>';
    }).join("");
    const kopf = S.kapGeschafft >= 0 ? '<p class="wl-spruch">' + esc(tx.kapGeschafft(ROEMISCH[S.kapGeschafft])) + '</p>' : '<p>' + esc(tx.rastText) + '</p>';
    const neuText = (S.neuMarke || []).length ? '<p class="wl-neu-gabe">' + esc(tx.neuFrei(tx.gaben[S.neuMarke[0]][0][0])) + '</p>' : "";
    schleierAuf('<h4>' + esc(tx.rast) + '</h4>' + kopf + neuText +
      '<div class="wl-gaben">' + karten + '</div>' +
      (S.welle >= 3 ? '<button type="button" class="wl-leise" data-tun="beenden">' + esc(tx.beenden) + '</button>' : ""));
  }

  function spielEnde(nurNeuZeichnen) {
    const tx = t();
    if (!nurNeuZeichnen) {
      zustand = "ende"; zielen = null; S.texte = []; S.blasen = [];
      KLANG.ende();
      const alt = parseInt(lies(rekordKey(S.stufe), "0"), 10);
      S.neuerRekord = !S.uebung && S.punkte > alt && S.punkte > 0;
      if (S.neuerRekord) schreib(rekordKey(S.stufe), String(S.punkte));
      S.altRekord = alt;
      S.genau = S.salven ? Math.round(S.salvenTreffer / S.salven * 100) : 0;
      const k = S.kapAktuell;
      S.spruchStufe = k >= KAPITEL.length ? "legende" : k >= 8 ? "boss" : k >= 4 ? "gut" : k >= 2 ? "mittel" : "schwach";
      S.spruchIdx = Math.floor(Math.random() * 3);
      S.eingetragen = ""; S.sendet = false;
    }
    const spruch = tx.spruch[S.spruchStufe][S.spruchIdx];
    const freiwillig = S.leben > 0;
    const kap = S.kapAktuell >= KAPITEL.length ? "∞" : ROEMISCH[S.kapAktuell];
    schleierAuf(
      '<h4>' + esc(freiwillig ? tx.titel : tx.ende) + '</h4>' +
      '<p class="wl-gross">' + S.punkte + ' <span>' + esc(tx.punkte) + ' · ' + esc(tx.stufen[S.stufe]) + '</span></p>' +
      (S.neuerRekord && S.altRekord ? '<p class="wl-neu">' + esc(tx.neuRekord) + '</p>' : "") +
      '<dl class="wl-werte">' +
      '<dt>' + esc(tx.wert.kapitel) + '</dt><dd>' + kap + '</dd>' +
      '<dt>' + esc(tx.wert.welle) + '</dt><dd>' + S.welle + '</dd>' +
      '<dt>' + esc(tx.wert.erlegt) + '</dt><dd>' + S.erlegt + '</dd>' +
      '<dt>' + esc(tx.wert.genau) + '</dt><dd>' + S.genau + ' %</dd>' +
      '<dt>' + esc(tx.wert.bonus) + '</dt><dd>' + S.bonus + '</dd>' +
      '</dl>' +
      '<p class="wl-spruch">' + (sprache() === "en" ? "“" : "„") + esc(spruch) + "“" + ' <span>– Friedrich</span></p>' +
      (S.uebung ? '<p class="wl-leer">' + esc(tx.uebungEnde) + '</p>' : eintragHtml(tx)) +
      '<button type="button" class="tav-knopf wl-haupt" data-tun="neu">' + esc(tx.nochmal) + '</button>');
    fussSetzen(); listeNeu();
  }

  function tafelKlick(e) {
    const st = e.target.closest("[data-stufe]");
    if (st && zustand === "start") {
      stufeWahl = st.dataset.stufe; schreib("imres-waldlauf-stufe", stufeWahl);
      startZeigen(); fussSetzen(); bestenLaden(stufeWahl);
      return;
    }
    const kb = e.target.closest("[data-kap]");
    if (kb && zustand === "start") { startKap = parseInt(kb.dataset.kap, 10) || 0; startZeigen(); zeichnen(performance.now()); return; }
    const g = e.target.closest("[data-gabe]");
    if (g && zustand === "wahl") {
      const k = g.dataset.gabe;
      if (k === "rast") S.leben = Math.min(S.maxLeben, S.leben + 2); else S.gaben[k]++;
      if (k === "rex") S.rex.cd = 1.5;
      if (k === "hypnose") S.hypT = 4;
      if (k === "dawnbringer") S.lichtT = 6;
      if (k === "floete") S.floeteT = 6;
      audio();
      naechsteWelle(S.welle + 1);
      return;
    }
    if (e.target.closest(".wl-eintragen")) { eintragen(); return; }
    const b = e.target.closest("[data-tun]"); if (!b) return;
    const tun = b.dataset.tun;
    audio();
    if (tun === "start") { neuesSpiel(startKap); fussSetzen(); listeNeu(); naechsteWelle(S.welle + 1); }
    else if (tun === "kampf") { welleStarten(S.geschichteN); anwerfen(); }
    else if (tun === "neu") { zustand = "start"; S = null; startZeigen(); fussSetzen(); bestenLaden(stufeWahl); zeichnen(performance.now()); }
    else if (tun === "weiter") { zustand = "spiel"; schleierZu(); anwerfen(); }
    else if (tun === "beenden") spielEnde();
  }

  function pausieren() {
    if (zustand !== "spiel") return;
    zustand = "pause"; zielen = null; S.vorgemerkt = null;
    pauseZeigen();
  }
  document.addEventListener("keydown", e => {
    if (zustand !== "spiel" || !sichtbar) return;
    if (e.key === "Escape" || e.key === "p" || e.key === "P") { e.preventDefault(); pausieren(); }
  });

  /* ---------- Bestenliste: gemeinsam über Supabase (wie beim Auftritt), sonst auf diesem Gerät ---------- */
  const SERVER = { url: "https://iszdxkwkgkksdemtqhwu.supabase.co", key: "sb_publishable_Bt3Vw5BSnLaVcTRPTS0ZsA_MeG6G2-Z" };
  function server(pfad, body) {
    const h = { apikey: SERVER.key, "Content-Type": "application/json" };
    return fetch(SERVER.url + pfad, body === undefined ? { headers: h, cache: "no-store" } : { method: "POST", headers: h, body: JSON.stringify(body) })
      .then(r => r.ok ? (r.status === 204 ? null : r.json()) : Promise.reject(r.status));
  }
  const besten = {}, serverOk = {}; let meinEintrag = null;
  const lokalLesen = () => { try { return JSON.parse(localStorage.getItem("imres-waldlauf-liste") || "{}") || {}; } catch (_) { return {}; } };
  const sortieren = l => l.sort((a, b) => b.punkte - a.punkte || b.welle - a.welle || String(a.erstellt).localeCompare(String(b.erstellt)));
  function bestenLaden(st) {
    return server("/rest/v1/jagd_bestenliste?select=name,punkte,welle,genauigkeit,erstellt&stufe=eq." + st + "&order=punkte.desc,welle.desc,erstellt.asc&limit=10")
      .then(l => { besten[st] = Array.isArray(l) ? l : []; serverOk[st] = true; })
      .catch(() => { serverOk[st] = false; besten[st] = sortieren(lokalLesen()[st] || []).slice(0, 10); })
      .then(listeNeu);
  }
  function listeNeu() {
    if (!listeEl) return;
    const T = t(), st = aktuelleStufe(), l = besten[st];
    if (!l) { listeEl.innerHTML = ""; return; }
    listeEl.innerHTML = '<h4>' + T.bestenliste + " · " + esc(T.stufen[st]) + "</h4>" +
      (l.length ? "<table><thead><tr>" + T.spalten.map(x => "<th>" + esc(x) + "</th>").join("") + "</tr></thead><tbody>" +
        l.map((e, i) => "<tr" + (meinEintrag && e.erstellt === meinEintrag ? ' class="mein"' : "") + "><td>" + (i < 3 ? ["🥇", "🥈", "🥉"][i] : i + 1) + "</td><td>" + esc(e.name) + "</td><td>" + e.punkte + "</td><td>" + e.welle + "</td></tr>").join("") +
        "</tbody></table>" : '<p class="wl-leer">' + esc(T.leer) + "</p>") +
      (serverOk[st] === false ? '<p class="wl-leer">' + esc(T.nurHier) + "</p>" : "");
  }
  function eintragHtml(T) {
    if (!S || S.punkte <= 0) return "";
    if (S.eingetragen) return '<p class="wl-eingetragen">' + esc(S.eingetragen) + "</p>";
    const name = lies("imres-waldlauf-name", "") || lies("imres-auftritt-name", "");
    return '<div class="wl-eintrag"><input type="text" class="wl-name" maxlength="24" autocomplete="nickname" placeholder="' + esc(T.deinName) + '" value="' + esc(name) + '">' +
      '<button type="button" class="tav-knopf wl-eintragen"' + (S.sendet ? " disabled" : "") + ">" + esc(T.eintragen) + "</button></div>";
  }
  function eintragen() {
    if (!S || zustand !== "ende" || S.uebung || S.eingetragen || S.sendet) return;
    const feld = tafel.querySelector(".wl-name"), name = feld ? feld.value.trim().slice(0, 24) : "";
    if (!name) { if (feld) feld.focus(); return; }
    schreib("imres-waldlauf-name", name);
    const T = t(), st = S.stufe, spiel = S;
    const e = { name, punkte: S.punkte, welle: S.welle, genauigkeit: S.genau, erstellt: new Date().toISOString() };
    const lok = lokalLesen(); lok[st] = sortieren((lok[st] || []).concat([e])).slice(0, 10);
    schreib("imres-waldlauf-liste", JSON.stringify(lok));
    spiel.sendet = true;
    server("/rest/v1/rpc/jagd_eintragen", { p_name: name, p_stufe: st, p_punkte: e.punkte, p_welle: e.welle, p_genauigkeit: e.genauigkeit })
      .catch(() => {}).then(() => bestenLaden(st)).then(() => {
        spiel.sendet = false;
        const l = besten[st] || [];
        const platz = l.findIndex(x => x.name === name && x.punkte === e.punkte && x.welle === e.welle) + 1;
        if (platz) meinEintrag = l[platz - 1].erstellt;
        spiel.eingetragen = platz ? T.eingetragen(platz) : T.eingetragenOhne;
        if (S === spiel && zustand === "ende") spielEnde(true); else listeNeu();
      });
  }

  /* ---------- Eingabe ---------- */
  function punkt(ev) {
    const r = leinwand.getBoundingClientRect();
    return { x: (ev.clientX - r.left) * W / r.width, y: (ev.clientY - r.top) * H / r.height };
  }
  leinwand.addEventListener("pointerdown", ev => {
    if (zustand !== "spiel") return;
    ev.preventDefault();
    try { leinwand.setPointerCapture(ev.pointerId); } catch (_) {}
    const p = punkt(ev);
    zielen = { id: ev.pointerId, sx: p.x, sy: p.y, x: p.x, y: p.y };
    audio();
  });
  leinwand.addEventListener("pointermove", ev => {
    if (!zielen || ev.pointerId !== zielen.id) return;
    const p = punkt(ev); zielen.x = p.x; zielen.y = p.y;
  });
  function loslassen(ev, abbrechen) {
    if (!zielen || ev.pointerId !== zielen.id) return;
    const z = abbrechen ? null : zielVektor();
    zielen = null;
    if (z && zustand === "spiel") { if (S.abkuehl <= 0) schiessen(z); else S.vorgemerkt = z; }
  }
  leinwand.addEventListener("pointerup", ev => loslassen(ev, false));
  leinwand.addEventListener("pointercancel", ev => loslassen(ev, true));
  leinwand.addEventListener("contextmenu", ev => ev.preventDefault());

  /* ---------- Größe ---------- */
  function groesse() {
    const r = leinwand.getBoundingClientRect(); if (!r.width) return;
    const dpr = Math.min(2.5, window.devicePixelRatio || 1);
    leinwand.width = Math.round(r.width * dpr); leinwand.height = Math.round(r.height * dpr);
    skala = leinwand.width / W;
    zeichnen(performance.now());
  }

  /* ---------- Stil ---------- */
  const css = document.createElement("style");
  css.textContent = `
.waldlauf .wl-steuerung { font-size: .86rem; color: var(--ash); font-style: italic; }
.wl-buehne { position: relative; width: 100%; max-width: min(100%, calc(76vh * .8)); justify-self: center; aspect-ratio: 4 / 5; border: 1px solid var(--line); background: #0b0a12; overflow: hidden; user-select: none; -webkit-user-select: none; -webkit-touch-callout: none; box-shadow: 0 14px 30px rgba(0,0,0,.45); }
.wl-buehne canvas { position: absolute; inset: 0; display: block; width: 100%; height: 100%; touch-action: pan-y; cursor: crosshair; -webkit-tap-highlight-color: transparent; }
.wl-buehne.laeuft canvas { touch-action: none; }
.wl-schleier { position: absolute; inset: 0; display: grid; place-items: center; padding: clamp(.7rem, 3vw, 1.4rem); background: rgba(9,8,15,.68); text-align: center; overflow-y: auto; }
.wl-schleier[hidden] { display: none; }
.wl-tafel { display: grid; gap: .55rem; justify-items: center; width: 100%; max-width: 30rem; }
.wl-tafel h4 { font-family: var(--name); font-weight: 400; font-size: clamp(1.45rem, 5.5vw, 2rem); line-height: 1.05; color: var(--vellum); }
.wl-tafel p { color: var(--ash); font-size: .92rem; margin: 0; }
.wl-tafel .tav-knopf { justify-self: center; }
.wl-tafel .wl-haupt { font-size: 1rem; padding: .55rem 1.3rem; background: color-mix(in srgb, var(--ember) 14%, transparent); }
.wl-tafel .wl-gross { font-family: var(--display); font-size: clamp(2.2rem, 9vw, 3rem); color: var(--ember) !important; line-height: 1; }
.wl-gross span { font-size: .4em; color: var(--ash); }
.wl-tafel .wl-neu { font-family: var(--hand); font-size: 1.35rem; color: var(--vellum) !important; }
.wl-werte { display: grid; grid-template-columns: auto auto; gap: .15rem 1.1rem; font-size: .88rem; margin: 0; text-align: left; }
.wl-werte dt { color: var(--ash); } .wl-werte dd { margin: 0; color: var(--vellum); font-weight: 600; text-align: right; }
.wl-tafel .wl-spruch { font-family: var(--hand); font-size: 1.25rem; line-height: 1.15; color: var(--ember) !important; }
.wl-spruch span { font-family: var(--body); font-size: .8rem; color: var(--ash); white-space: nowrap; }
.wl-tafel .wl-neu-gabe { font-family: var(--hand); font-size: 1.15rem; color: var(--vellum); }
.wl-gaben { display: grid; gap: .6rem; width: 100%; grid-template-columns: repeat(3, minmax(0, 1fr)); }
.wl-gabe { display: grid; gap: .3rem; justify-items: center; align-content: start; padding: .75rem .5rem .7rem; border: 0; cursor: pointer; font: inherit; text-align: center;
  background: linear-gradient(172deg, #f1e7cf, #ddcca8); color: #2a2118; box-shadow: 0 8px 18px rgba(0,0,0,.45);
  transform: rotate(var(--dreh, 0deg)); transition: transform .2s, box-shadow .2s; -webkit-tap-highlight-color: transparent; }
.wl-gabe:hover, .wl-gabe:focus-visible { transform: translateY(-3px) rotate(var(--dreh, 0deg)); box-shadow: 0 0 0 2px var(--ember), 0 12px 24px rgba(0,0,0,.5); outline: none; }
.wl-gabe .sym { font-size: 1.7rem; line-height: 1; }
.wl-gabe-text { display: grid; gap: .15rem; }
.wl-gabe strong { font-family: var(--name); font-weight: 400; font-size: 1.05rem; line-height: 1.1; color: #1d1610; }
.wl-gabe .stufe { display: block; font-family: var(--body); font-size: .66rem; letter-spacing: .06em; text-transform: uppercase; color: var(--blood); }
.wl-gabe .neu { display: inline-block; margin-left: .35rem; padding: 0 .35rem; font-family: var(--body); font-size: .62rem; letter-spacing: .06em; text-transform: uppercase; color: #f1e7cf; background: var(--blood); vertical-align: middle; }
.wl-gabe small { font-size: .8rem; line-height: 1.25; color: #5a4a36; }
.wl-blatt { display: grid; gap: .4rem; width: 100%; max-width: 24rem; padding: .75rem .85rem .85rem; text-align: left;
  background: linear-gradient(172deg, #f1e7cf, #ddcca8); color: #2a2118; box-shadow: 0 14px 30px rgba(0,0,0,.5); transform: rotate(-.6deg); animation: wlblatt .5s ease-out; }
@keyframes wlblatt { from { opacity: 0; transform: translateY(12px) rotate(-.6deg); } }
.wl-blatt img { width: 100%; height: clamp(5rem, 24vw, 9rem); object-fit: cover; display: block; border: 1px solid rgba(42,33,24,.35); filter: sepia(.15) contrast(1.05); }
.wl-tafel .wl-blatt .label { color: var(--blood); margin: .1rem 0 0; }
.wl-tafel .wl-blatt h4 { color: #1d1610; font-size: clamp(1.25rem, 5vw, 1.6rem); }
.wl-tafel .wl-blatt .wl-erz { color: #3a2e22; font-size: .88rem; line-height: 1.42; }
.wl-tafel .wl-blatt .tav-knopf { justify-self: end; border-color: #7a2f26; color: #7a2f26; background: rgba(122,47,38,.08); }
.wl-tafel .wl-blatt .tav-knopf:hover { background: #7a2f26; color: #f1e7cf; }
@media (max-width: 480px) {
  .wl-gaben { grid-template-columns: 1fr; gap: .45rem; }
  .wl-gabe { grid-template-columns: auto 1fr; justify-items: start; align-items: center; text-align: left; gap: .6rem; padding: .4rem .7rem; }
  .wl-gabe .sym { font-size: 1.35rem; }
  .wl-gabe strong { font-size: .98rem; }
  .wl-gabe .stufe { display: inline; margin-left: .35rem; }
  .wl-gabe small { font-size: .76rem; line-height: 1.2; }
  .wl-tafel { gap: .4rem; }
  .wl-tafel h4 { font-size: 1.35rem; }
  .wl-tafel p { font-size: .85rem; }
  .wl-tafel .wl-gross { font-size: 2.1rem; }
  .wl-werte { font-size: .78rem; gap: 0 .6rem; grid-template-columns: auto auto auto auto; }
  .wl-tafel .wl-spruch { font-size: 1.1rem; }
  .wl-tafel .wl-haupt { padding: .4rem 1.1rem; font-size: .95rem; }
  .wl-tafel .wl-blatt .wl-erz { font-size: .8rem; line-height: 1.35; }
  .wl-blatt { padding: .55rem .65rem .65rem; gap: .3rem; }
}
.wl-leise { background: none; border: 0; color: var(--ash); font: inherit; font-size: .85rem; text-decoration: underline; text-underline-offset: 3px; cursor: pointer; padding: .2rem; }
.wl-pause { position: absolute; top: 12%; right: 8px; z-index: 2; display: none; width: 2.3rem; height: 2.3rem; padding: 0; border: 1px solid var(--line); border-radius: 50%; background: rgba(9,8,15,.55); color: var(--vellum); font-size: .8rem; letter-spacing: -.1em; cursor: pointer; -webkit-tap-highlight-color: transparent; }
.wl-pause:hover, .wl-pause:focus-visible { border-color: var(--ember); color: var(--ember); }
.wl-buehne.laeuft .wl-pause { display: grid; place-items: center; }
.wl-stufen, .wl-kapitel { display: flex; flex-wrap: wrap; justify-content: center; align-items: center; gap: .3rem; }
.wl-stufen button, .wl-kapitel button { border: 1px solid var(--line); background: rgba(9,8,15,.4); color: var(--vellum); font: inherit; font-size: .82rem; padding: .38rem .55rem; white-space: nowrap; cursor: pointer; }
.wl-kapitel span { font-size: .8rem; color: var(--ash); margin-right: .2rem; }
.wl-kapitel button { font-family: var(--display); min-width: 2rem; padding: .28rem .4rem; }
.wl-stufen button[aria-checked="true"], .wl-kapitel button[aria-checked="true"] { border-color: var(--ember); background: rgba(224,160,70,.18); color: var(--ember); }
.wl-tafel .wl-stufen-text { font-style: italic; font-size: .85rem; min-height: 1.3em; }
.wl-eintrag { display: flex; flex-wrap: wrap; justify-content: center; gap: .4rem; }
.wl-name { background: rgba(0,0,0,.35); border: 1px solid var(--line); color: var(--vellum); font: inherit; font-size: .9rem; padding: .4rem .6rem; width: 10.5rem; min-width: 0; }
.wl-eintrag .tav-knopf { font-size: .88rem; padding: .4rem .8rem; }
.wl-tafel .wl-eingetragen { color: var(--ember); }
.wl-liste { width: 100%; max-width: min(100%, calc(76vh * .8)); justify-self: center; }
.wl-liste:empty { display: none; }
.wl-liste h4 { font-family: var(--display); font-size: .78rem; letter-spacing: .14em; text-transform: uppercase; color: var(--ember); margin: .2rem 0 .4rem; font-weight: 400; }
.wl-liste table { width: 100%; border-collapse: collapse; font-size: .88rem; }
.wl-liste th { text-align: left; font-weight: normal; color: var(--ash); font-size: .75rem; border-bottom: 1px solid var(--line); padding: .25rem .4rem; }
.wl-liste td { padding: .3rem .4rem; border-bottom: 1px solid rgba(235,226,204,.06); }
.wl-liste td:nth-child(3), .wl-liste th:nth-child(3), .wl-liste td:nth-child(4), .wl-liste th:nth-child(4) { text-align: right; }
.wl-liste tr.mein td { color: var(--ember); }
.wl-leer, .wl-tafel .wl-leer { color: var(--ash); font-size: .85rem; font-style: italic; margin: .3rem 0 0; }
.wl-fuss { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: .5rem; font-size: .88rem; color: var(--ash); }
.wl-ton { background: none; border: 1px solid var(--line); color: var(--ash); font: inherit; font-size: .84rem; padding: .3rem .75rem; cursor: pointer; }
.wl-ton:hover { color: var(--vellum); border-color: var(--ember); }
@media (prefers-reduced-motion: reduce) { .wl-gabe { transition: none; } .wl-blatt { animation: none; } }
`;
  document.head.appendChild(css);

  /* ---------- Start ---------- */
  aufbauen();
  bestenLaden(stufeWahl);
  bilderLaden();
  startZeigen();
  if (window.ResizeObserver) new ResizeObserver(groesse).observe(buehne); else window.addEventListener("resize", groesse);
  groesse();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => zeichnen(performance.now()));
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(eintraege => {
      sichtbar = eintraege[0].isIntersecting;
      if (sichtbar) anwerfen(); else pausieren();
    }, { threshold: 0.15 }).observe(buehne);
  } else { sichtbar = true; anwerfen(); }
  document.addEventListener("visibilitychange", () => { if (document.hidden) pausieren(); else anwerfen(); });
  let letzteSprache = sprache();
  new MutationObserver(() => { if (sprache() === letzteSprache) return; letzteSprache = sprache(); texteSetzen(); zeichnen(performance.now()); })
    .observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });
})();
