/* =====================================================================
   WÜRFEL AUF CHARME – Barradin will jeden NSC bezirzen
   ---------------------------------------------------------------------
   Hinter dem Spielleiterschirm sitzt der Spielleiter (namenlos) in seinem
   Zimmer mit Gitarren und Postern an der Wand. Vor ihm erscheinen nacheinander
   die NSC, die er spielt. Barradin wählt einen Spruch, würfelt einen W20 + Charisma,
   und das Gesicht des Spielleiters verrät, was er davon hält.
   - 8 NSC (+ geheimer Bonus), je NSC 3 Herzen in 4 Sprüchen
   - Sprucharten: charmant (SG), kühn (SG+4, 2 Herzen), absurd (Lotterie, kostet Geduld),
     passend (zum NSC, SG−4)
   - Joker je Lauf einmal: Echo („Kennst du Gundren?“), Rex, Flöte der Illusionen
   - Leiste „Geduld des Spielleiters“: bei 0 klappt er den Schirm zu
   - Eroberungsbuch: bestes Ergebnis je NSC wird gespeichert (imres-charme-buch)
   ===================================================================== */
(function () {
  "use strict";
  const root = document.getElementById("charme-karte");
  if (!root) return;
  const sprache = () => (document.documentElement.lang === "en" ? "en" : "de");
  const esc = s => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const zufall = l => l[Math.floor(Math.random() * l.length)];
  const lies = (k, d) => { try { const v = localStorage.getItem(k); return v == null ? d : v; } catch (_) { return d; } };
  const schreib = (k, v) => { try { localStorage.setItem(k, v); } catch (_) {} };
  const ruhig = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const CHA = 6; /* Barradins Charisma-Bonus */

  /* ---------- Die NSC ---------- */
  const NSC = [
    { id: "gundren", bild: "gundren-frei.webp", sg: 9, pos: "50% 10%" },
    { id: "buergermeister", bild: "buergermeister-frei.webp", sg: 10, pos: "50% 20%" },
    { id: "bugbear", bild: "bugbear-frei.webp", sg: 12, pos: "50% 30%" },
    { id: "ilvara", bild: "ilvara-wahr.webp", sg: 13, pos: "50% 8%" },
    { id: "kuotoa", bild: "kuo-toa-frei.webp", sg: 13, pos: "50% 20%" },
    { id: "horga", bild: "koenig-horga.webp", sg: 14, pos: "50% 10%" },
    { id: "hgraam", bild: "riese-frei.webp", sg: 15, pos: "50% 15%" },
    { id: "themberchaud", bild: "themberchaud.webp", sg: 17, pos: "50% 20%" }
  ];
  const BONUS = { id: "demogorgon", bild: "demogorgon.webp", sg: 20, pos: "50% 30%" };

  /* ---------- Texte ---------- */
  const TX = {
    de: {
      label: "Würfelspiel", titel: "Würfel auf Charme",
      text: "Jeder Barde kennt die Frage: Kann ich den NSC verführen? Barradin probiert es bei allen. Wähle einen Spruch, wirf den W20 – und schau dem Spielleiter ins Gesicht.",
      start: "▶ Ich würfle auf Charme", nochmal: "↻ Noch eine Sitzung", buch: "📖 Eroberungsbuch", zurueck: "Zurück",
      geduld: "Geduld des Spielleiters", aufgabe: "Aufgabe", sprueche: n => "Noch " + n + (n === 1 ? " Spruch" : " Sprüche"),
      arten: { charmant: "Charmant", kuehn: "Kühn", absurd: "Absurd", passend: "Passend" },
      artInfo: { charmant: n => "SG " + n + " · 1 ♥", kuehn: n => "SG " + n + " · 2 ♥", absurd: () => "Glückssache · kostet Geduld", passend: n => "SG " + n + " · 1 ♥" },
      joker: { echo: "Echo: „Kennst du Gundren?“", rex: "Rex schickt", floete: "Flöte der Illusionen" },
      jokerKurz: { echo: "🗣 „Gundren?“", rex: "🐕 Rex", floete: "🎶 Flöte" },
      jokerInfo: { echo: "Neue Sprüche + ein Zug mehr", rex: "+1 ♥, garantiert", floete: "Nächster Wurf mit Vorteil" },
      wurf: (w, b, s) => "W20: " + w + " + " + b + " Charisma = " + s,
      gegen: sg => "gegen SG " + sg,
      erfolg: "Erfolg!", misserfolg: "Daneben.", krit: "Natürliche 20!", patzer: "Natürliche 1 …",
      erobert: "Erobert!", korb: "Ein Korb.", weiter: "Nächster NSC →", ende: "Sitzungsende",
      schirmZu: "Der Spielleiter klappt den Schirm zu.",
      bilanz: (e, n, h) => e + " von " + n + " NSC erobert · " + h + " ♥",
      rekord: n => "Bester Abend bisher: " + n + " ♥", neuRekord: "Neuer Rekord!",
      buchTitel: "Das Eroberungsbuch", buchText: "Wen hat Barradin schon um den Finger gewickelt?",
      buchStand: { erobert: "♥ Erobert", korb: "✗ Korb", offen: "Noch nicht getroffen" },
      bonusRuf: "Der Spielleiter grinst. „Ihr habt noch Zeit? Gut. Ich hätte da noch jemanden …“",
      nsc: {
        gundren: { name: "Gundren", aufgabe: "Überrede ihn, den Lohn im Voraus zu zahlen.",
          intro: "„Ah, die Helden! Bereit für den Weg nach Phandalin?“",
          charmant: ["„Gundren, ist das Erz in deinem Bart, oder funkeln deine Augen einfach so, wenn du mich ansiehst?“", "„Ich würde jede Karawane mit dir begleiten. Am liebsten die, in der nur wir zwei sitzen.“", "„Dein Bart ist so prächtig geflochten. Darf ich … nur einmal kurz durchfahren?“", "„Weißt du, was in Phandalin am meisten glänzt? Nicht die Mine. Du.“"],
          kuehn: ["„Zahl uns im Voraus, und ich zahle dich mit Küssen zurück. Mit Zinsen.“", "„Vergiss die verschollene Mine, Gundren. Den größten Schatz hast du gerade vor dir.“", "„Ein Kuss für jede Goldmünze. Ich hab Zeit.“"],
          absurd: ["„Ich habe von dir geträumt. Du warst ein Pony. Ich war der Wagen. Wir waren glücklich.“", "„Darf ich deinen Hut tragen? Nur kurz. Für immer. Im Bett.“", "„Bist du eine Spitzhacke? Weil du mein Herz gerade freigelegt hast.“"],
          passend: ["„Du suchst eine verlorene Schmiede? Ich hab da ein Feuer, das nur für dich brennt.“", "„Von allen Zwergen auf dem Weg nach Phandalin bist du eindeutig der Hübscheste.“"],
          ja: ["Gundren zwirbelt verlegen seinen Bart. „Na, du bist mir einer …“", "Gundren wird rot bis unter die Hutkrempe. „Hör auf. Nein, mach weiter.“", "„Ha! Mit so einem Mundwerk solltest du Händler werden. Oder … mein Begleiter.“"],
          nein: ["„Bezahlt wird in Phandalin. Auch für Charmeure.“", "Gundren zählt demonstrativ seine Münzen. Für sich. Und zwinkert nicht zurück."],
          krit: "Gundren drückt dir den ganzen Beutel in die Hand – und einen Kuss auf die Wange. Durch den Bart. Es kitzelt.",
          patzer: "Gundren schreibt sich deinen Namen auf. Auf die Liste der Leute, die nichts bekommen.",
          sieg: "Der Lohn klimpert im Voraus. Gundren winkt euch nach und haucht Barradin einen Luftkuss zu.",
          verloren: "„Wir sehen uns in Phandalin.“ Dort werdet ihr ihn so schnell nicht sehen …" },
        buergermeister: { name: "Der Bürgermeister von Phandalin", aufgabe: "Bring ihn dazu, die Belohnung ohne Feilschen auszuzahlen.",
          intro: "„Belohnung? Ich erinnere mich an keine Belohnung.“",
          charmant: ["„Herr Bürgermeister, Ihre Amtskette steht Ihnen – aber Sie würden auch ohne sie glänzen.“", "„Sie haben eine so starke … Verwaltungsaura. Mir wird ganz warm.“", "„Ihr Pelzkragen ist das Weichste in Phandalin. Fast so weich wie Ihr Blick.“", "„Darf ich Ihnen sagen, dass Sie unterschreiben wie ein Poet?“"],
          kuehn: ["„Zahlen Sie die volle Belohnung, und ich lade Sie zum Abendessen ein. Kerzenschein. Nur wir und die Steuerlisten.“", "„So ein großer Mann sollte auch große Gesten machen. Fangen wir mit der Belohnung an. Dann sehen wir weiter.“", "„Ich hätte da einen Antrag. Keinen Amtsantrag.“"],
          absurd: ["„Ich möchte Ihre Unterschrift. Auf meinem Herzen. Oder einem Scheck. Am besten beides.“", "„Sind Sie ein Zauberer? Jedes Mal, wenn ich Sie ansehe, verschwindet mein Gold. Und mein Verstand.“"],
          passend: ["„Ich habe gehört, Sie zählen jeden Abend Ihre Münzen. Ich würde gern danebensitzen. Ganz nah.“", "„Wählen Sie mich. Nicht ins Amt. In Ihr Herz.“"],
          ja: ["Der Bürgermeister lockert die Amtskette. „Ist es hier warm geworden?“", "„Nun ja … ich will ja kein Unmensch sein.“ Er errötet bis zu den Ohren.", "Er tupft sich die Stirn. „Sie … Sie Schmeichler.“"],
          nein: ["„Schmeichelei kostet extra. Für Sie doppelt.“", "Er schiebt den Geldbeutel ein Stück weiter weg. Und den Stuhl auch."],
          krit: "Der Bürgermeister zahlt ohne Feilschen – und fragt, ob Barradin am Samstag schon etwas vorhat.",
          patzer: "Er erhebt eine Gebühr für Komplimente. Rückwirkend.",
          sieg: "Ihr bekommt die volle Belohnung. Und der Bürgermeister schreibt Barradin ein Gedicht. Es reimt sich nicht.",
          verloren: "Er gibt euch eine Kupfermünze. Eine. Zum Teilen." },
        bugbear: { name: "Der Bugbear im Wachturm", aufgabe: "Lass dich durch die Tür, ohne zu kämpfen.",
          intro: "Ein riesiger, haariger Bugbear versperrt die Tür. „GRRR.“",
          charmant: ["„Was für ein prächtiges Fell! Darf ich mal … kraulen?“", "„Du hast die schönsten Krallen im ganzen Wachturm. Und die schönsten Augen.“", "„Dein Knurren geht mir durch Mark und Bein. Auf die gute Art.“", "„So groß, so stark, so flauschig. Du bist mein Typ.“"],
          kuehn: ["„Lass mich durch, und ich nenne meine nächste Laute nach dir. Und mein nächstes Kind.“", "„Du und ich, Großer. Kerzenlicht. Ein Fass Bier. Eine Decke aus deinem Fell. Also, mit dir drin.“", "„Komm her und gib mir eine von diesen Bärenumarmungen.“"],
          absurd: ["„Ich habe ein Fass. Du hast ein Fass. Siehst du? Seelenverwandte.“", "„Bist du ein Teppich? Ich würde nämlich gern vor dem Kamin auf dir liegen.“"],
          passend: ["„Grrr.“ (Barradin knurrt zärtlich zurück und zwinkert.)", "„Du bewachst diese Tür so leidenschaftlich. Bewach doch lieber mich.“"],
          ja: ["Der Bugbear schnurrt. Leise. Verliebt.", "„…Grrr?“ Er klimpert mit den Wimpern. Er hat erstaunlich lange Wimpern.", "Der Bugbear streicht sich verlegen das Fell glatt."],
          nein: ["„GRRR!“", "Der Bugbear legt die Ohren an. Das ist kein Flirt-Zeichen."],
          krit: "Der Bugbear öffnet die Tür, verbeugt sich, schenkt dir eine halbe Ratte und ein Herz aus Knochen.",
          patzer: "Der Bugbear setzt sich auf dich. Es ist warm. Es ist schwer.",
          sieg: "Die Tür steht offen. Der Bugbear schaut dir seufzend nach und malt ein Herz in den Staub.",
          verloren: "Ihr müsst doch kämpfen. Der Bugbear wirkt gekränkt." },
        ilvara: { name: "Ilvara Mizzrym", aufgabe: "Bring sie dazu, die Ketten ein wenig zu lockern.",
          intro: "„Sklaven reden nicht, wenn man sie nicht fragt.“",
          charmant: ["„Herrin, Euer Blick ist schärfer als jede Drow-Klinge. Und ich würde mich gern daran schneiden.“", "„In diesen Ketten fühle ich mich Euch so nah.“", "„Diese Festung ist düster. Ihr dagegen strahlt wie das Licht, das ich so vermisse.“", "„Ihr seid die Einzige hier, für die ich freiwillig bleiben würde.“"],
          kuehn: ["„Lockert die Ketten, und ich singe Euch ein Liebeslied, bei dem selbst Lolth errötet.“", "„Ihr und ich, Herrin – ich halte die Laute, Ihr die Peitsche. Ein Traumpaar.“", "„Nehmt mir die Ketten ab. Dann gehöre ich Euch trotzdem.“"],
          absurd: ["„Ich mag Spinnen. Sehr. Acht Beine, acht Arme zum Umarmen. Bitte.“", "„Seid Ihr eine Druidin? Weil Ihr mich in einen verliebten Trottel verwandelt habt.“"],
          passend: ["„Eure Spinnen haben ausgezeichneten Geschmack. Sie weichen Euch nie von der Seite. Ich verstehe sie.“", "„Ihr habt mich in Euer Netz gelockt, Herrin. Und ich will gar nicht raus.“"],
          ja: ["Ilvara hebt eine Augenbraue. Bei ihr ist das fast ein Erröten.", "„Unterhaltsam.“ Sie lässt die Peitsche sinken. Langsam.", "Ilvara wendet sich ab, damit niemand ihr Lächeln sieht. Barradin sieht es trotzdem."],
          nein: ["„Noch ein Wort, und du fütterst die Spinnen.“", "Sie lässt die Peitsche knallen. Nicht nah. Aber nah genug."],
          krit: "Ilvara lockert die Ketten, beugt sich vor und flüstert: „Wenn du fliehst, Barde … flieh langsam.“",
          patzer: "Ilvara verdoppelt deine Ketten. „Zur Sicherheit.“",
          sieg: "Die Ketten sitzen lockerer. Ilvara tut so, als wäre nichts gewesen – aber sie schaut dir nach.",
          verloren: "„Abführen.“ Die Ketten klirren. Romantisch ist anders." },
        kuotoa: { name: "Ein Kuo-Toa-Wächter", aufgabe: "Er soll euch in die Stadt lassen.",
          intro: "Der Wächter glotzt. Lange. Ohne zu blinzeln.",
          charmant: ["„Deine Schuppen schimmern wie der See im Mondlicht.“", "„Du hast die schönsten großen Augen, die ich je gesehen habe. Und du blinzelst nie weg. Romantisch.“", "„Du riechst nach Algen. Ich liebe Algen.“", "„So glänzend, so glitschig, so … geheimnisvoll.“"],
          kuehn: ["„Lass uns rein, und ich nehme dich mit auf eine Bootsfahrt. Nur wir zwei und der unterirdische See.“", "„Gib mir einen feuchten Kuss, und ich vergesse, wie seltsam das hier gerade ist.“", "„Ich würde für dich sogar Kiemen kriegen wollen.“"],
          absurd: ["„Blubb.“ (Barradin blinzelt verführerisch. Mit beiden Augen. Nacheinander.)", "„Bist du ein Fisch? Weil du mich am Haken hast.“"],
          passend: ["„Du hast etwas Göttliches an dir. Ein echtes, nicht ausgedachtes. Ich würde dich anbeten.“", "„Ich bin zwar kein Fisch, aber ich schwimme auf dich.“"],
          ja: ["Der Wächter blubbert zufrieden. Seine Flossen zittern.", "„Blubb.“ Es klingt verliebt. Vermutlich.", "Der Wächter wird an den Kiemen ganz rosa."],
          nein: ["Der Wächter glotzt weiter. Unbeeindruckt. Und feucht.", "„Fremde. Verdächtig. Zu charmant. Blubb.“"],
          krit: "Der Wächter öffnet das Tor, winkt mit beiden Flossen und schenkt Barradin eine Muschel. In Herzform. Fast.",
          patzer: "Der Wächter ruft drei Freunde. Sie glotzen jetzt alle.",
          sieg: "Das Tor öffnet sich mit einem feuchten Quietschen. Der Wächter schmachtet euch nach.",
          verloren: "Ihr kommt trotzdem rein – gefesselt. Wie geplant. Irgendwie." },
        horga: { name: "König Horga Stahl V.", aufgabe: "Erbitte Gastrecht in Gracklstugh.",
          intro: "„Sprich, Barde. Aber fass dich kurz.“",
          charmant: ["„Majestät, Euer Bart allein hat mehr Würde als ganz Phandalin. Und mehr Sexappeal.“", "„Eure Krone sitzt so vortrefflich. Aber ich wette, ohne seid Ihr noch schöner.“", "„Gracklstugh glüht – aber Ihr glüht heller. Ich schmelze.“", "„Wenn Ihr befehlt, gehorche ich. Gern. Immer.“"],
          kuehn: ["„Gewährt uns Gastrecht, und ich komponiere Euch eine Liebeshymne. Mit Amboss-Solo.“", "„Ein König wie Ihr braucht einen Barden wie mich. An seiner Seite. Jeden Abend.“", "„Majestät, darf ich um diesen Tanz bitten? Auch wenn keine Musik spielt?“"],
          absurd: ["„Darf ich Euren Bart flechten? Ganz langsam.“", "„Seid Ihr ein Amboss? Weil mein Herz bei Euch schneller hämmert.“"],
          passend: ["„Wir haben Euren Sohn gerettet. Und dabei an seinen hinreißenden Vater gedacht. Die ganze Zeit.“", "„Ich habe noch nie einen so stählernen König gesehen. Hart, aber mit weichem Kern?“"],
          ja: ["Der König brummt. Seine Ohren werden rot.", "„Hmpf. Du hast Mut, Barde.“ Er streicht sich geschmeichelt über den Bart.", "Der Hof tuschelt. Der König sagt nichts. Aber er lächelt."],
          nein: ["„Wache!“ Die Wachen rühren sich nicht. Aber sie kichern.", "Der König schaut, als hätte er in eine Zitrone gebissen."],
          krit: "Der König lacht – zum ersten Mal seit fünfzig Jahren – und bietet Barradin einen Ehrenplatz neben dem Thron an.",
          patzer: "Der König lässt dich höflich, aber bestimmt hinausrollen. In einem Fass.",
          sieg: "Gastrecht gewährt. Und eine Einladung zum Abendessen. Kardal reibt sich peinlich berührt die Stirn.",
          verloren: "Ihr dürft bleiben – aber nur, weil ihr seinen Sohn gerettet habt." },
        hgraam: { name: "Der Steinsprecher", aufgabe: "Er soll euch seinen Steinsprecher-Kristall geben.",
          intro: "„Der Stein schreit. Hörst du ihn?“",
          charmant: ["„Ihr seid so … standfest. Ich mag Männer, an die man sich anlehnen kann.“", "„Eure Haut hat eine wundervolle Maserung. Darf ich mal fühlen?“", "„Wenn Ihr sprecht, höre ich den Berg singen. Und mein Herz.“", "„Ihr seid ein Fels in der Brandung. Und ich bin die Brandung.“"],
          kuehn: ["„Gebt mir den Kristall, und ich singe für Euch, bis der Stein aufhört zu schreien. Und anfängt zu seufzen.“", "„Ihr und ich – Fels und Barde. Ich klettere gern.“", "„Hebt mich hoch. Nur einmal. Bitte.“"],
          absurd: ["„Ich habe auch ein paar Steine. In der Tasche. Für Euch gesammelt. Wollt Ihr sie sehen?“", "„Seid Ihr ein Steinbruch? Weil ich mich gerade in Euch verliere.“"],
          passend: ["„Der Stein schreit? Ich auch. Vor Verlangen.“", "„Euch würde ich auch zuhören, wenn Ihr nur Rätsel sprecht. Gerade dann.“"],
          ja: ["Der Steinsprecher nickt langsam. Sehr langsam. Sehr zärtlich.", "„Der Stein … mag dich.“ Er schaut weg. Riesen werden auch rot.", "Ein winziger Kiesel rollt verlegen von seiner Schulter."],
          nein: ["Der Steinsprecher spricht weiter in Rätseln. Über etwas völlig anderes.", "Er betrachtet dich wie einen Kiesel, der zu viel flirtet."],
          krit: "Der Steinsprecher lächelt und hebt Barradin hoch wie einen kostbaren Edelstein. Irgendwo fällt ein Fels vor Rührung um.",
          patzer: "Er hält dich für einen sprechenden Stein und legt dich zu den anderen.",
          sieg: "Der Kristall liegt warm in deiner Hand. Der Steinsprecher hat ihn zuvor kurz an sein Herz gedrückt.",
          verloren: "„Etwas Unersättliches regt sich.“ Er meint dich." },
        themberchaud: { name: "Themberchaud, der Meister der Flammen", aufgabe: "Überzeuge ihn, euch nicht zu fressen.",
          intro: "Der Drache landet auf dem Gold. Die Halle wird sehr warm. Sehr still.",
          charmant: ["„Euer Schatz glänzt – aber nicht so wie Eure Schuppen.“", "„Ich habe noch nie einen so prachtvollen Drachen gesehen. Ehrlich gesagt überhaupt noch nie einen. Aber Ihr setzt die Messlatte hoch.“", "„Euer Feuer wärmt mein Herz. Und meine Augenbrauen.“", "„Man nennt Euch Meister der Flammen. Ich verstehe jetzt, warum ich brenne.“"],
          kuehn: ["„Lasst uns leben, und ich singe Euch jeden Abend ein Liebeslied. Direkt auf Eurem Goldberg.“", "„Ihr speit Feuer, ich spucke Verse. Lasst uns zusammen etwas entfachen.“", "„Ich wäre gern Euer kostbarstes Stück. Legt mich ganz oben auf den Hort.“"],
          absurd: ["„Darf ich mit Euch auf dem goldenen Hund kuscheln? Er sieht bequem aus.“", "„Seid Ihr ein Vulkan? Weil ich bei Euch dahinschmelze. Wörtlich.“"],
          passend: ["„Ein Wesen von Eurem Geschmack sammelt nur das Schönste. Und hier stehe ich.“", "„Bei Euch ist es heißer als in der Lava. Und es liegt nicht an der Lava.“"],
          ja: ["Themberchaud stößt eine zufriedene, fast herzförmige Rauchwolke aus.", "„Unterhaltsam.“ Er senkt den Kopf und mustert Barradin. Lange.", "Die Lava blubbert. Themberchaud schnurrt. Beides klingt verdächtig nach Zuneigung."],
          nein: ["Ein warnendes Rauchwölkchen steigt aus seinen Nüstern.", "Die Laute wird plötzlich sehr warm."],
          krit: "Themberchaud schnurrt und legt Barradin eine Goldmünze in die Hand. „Zur Erinnerung an mich.“ Echo fragt leise, ob er Gundren kennt.",
          patzer: "Themberchaud niest. Barradins Haare sind jetzt kürzer.",
          sieg: "Der Drache verschont euch, gibt euch einen Auftrag und zwinkert. Barradin nennt das ein Date.",
          verloren: "Ihr lebt – aber nur, weil Themberchaud jemanden für die Drecksarbeit braucht." },
        demogorgon: { name: "Demogorgon (Bonus)", aufgabe: "Bitte … einfach wieder gehen.",
          intro: "Zwei Köpfe. Tentakel. Der Spielleiter lächelt sehr breit.",
          charmant: ["„Ihr habt zwei wunderschöne Köpfe. Ich kann mich nicht entscheiden, welchen ich zuerst anschmachte.“", "„Diese Tentakel! So viele. So … umarmend.“", "„Euer Schrei ist so durchdringend. So … leidenschaftlich.“"],
          kuehn: ["„Geht zurück in den Abgrund, und ich schreibe Euch ein Liebesduett. Für beide Köpfe.“", "„Zwei Köpfe, zwei Küsse. Ich bin bereit.“", "„Ihr und ich, Dämonenfürst. Was könnte schon schiefgehen?“"],
          absurd: ["„Friedrich hat dich geboxt. Ich würde dich lieber umarmen. Mit allen Tentakeln.“", "„Welcher Kopf ist der romantische? Ich frage für mich.“"],
          passend: ["(Barradin hält die Flöte der Illusionen hoch und zaubert Demogorgon ein Herz aus Licht.)", "„Ihr seid der Fürst der Dämonen. Und der Fürst meines Herzens.“"],
          ja: ["Der linke Kopf kichert verliebt. Der rechte ist eifersüchtig.", "Die Tentakel formen ein Herz. Ein schiefes, aber ein Herz."],
          nein: ["Beide Köpfe schreien. Gleichzeitig.", "Ein Tentakel tätschelt Barradin. Zu fest."],
          krit: "Demogorgon errötet. Auf beiden Köpfen. Und verschwindet verwirrt im See – mit einem Blick zurück.",
          patzer: "Demogorgon frisst die Laute. Der Spielleiter muss kurz raus.",
          sieg: "Demogorgon zieht sich zurück. Beide Köpfe werfen Barradin einen Luftkuss zu.",
          verloren: "Ihr rennt zum Boot. Wie damals. Nur peinlicher." }
      },
      sl: { /* Der Spielleiter kommentiert */
        start: ["„Okay. Ihr steht vor …“ – „Ich flirte.“ – „Ich hab noch gar nicht gesagt, vor wem!“", "„Ich ahne Schlimmes.“", "„Bitte. Bitte nicht wieder flirten.“", "„Barradin, er ist ein NSC. Ein NSC!“"],
        absurd: ["„Das ist nicht dein Ernst.“", "„Ich schreibe das auf.“", "„Ich hasse euch. Liebevoll.“", "„…Mach einen Wurf.“"],
        erfolg: ["„Okay. Das zählt.“", "„Ich kann's nicht fassen.“", "„…Na gut. Er wird rot.“", "„Warum funktioniert das IMMER?“", "„Ich spiele das jetzt mit Würde. Irgendwie.“"],
        misserfolg: ["„Nein.“", "„Das hat er nicht gehört. Absichtlich.“", "„Würfel lügen nicht.“", "„Nächster Versuch.“"],
        krit: ["„WAS?!“", "„Das … das gibt's nicht.“", "„Ich muss kurz meine Notizen umschreiben.“"],
        patzer: ["„HAHAHA – nein.“", "„Das wird Konsequenzen haben.“", "„Ich lass das einfach so stehen.“"],
        echo: ["„Nein, er kennt Gundren nicht.“", "„Echo. Bitte.“", "„Niemand kennt Gundren.“"],
        rex: ["„Gut, den Hund lieben alle. Das ist unfair.“", "„Rex. Natürlich Rex.“"],
        floete: ["„Nicht schon wieder Demogorgon.“", "„Ihr und eure Flöte.“"],
        korb: ["„Korb. Ich liebe Körbe.“", "„Das wars dann wohl.“"],
        erobert: ["„Ich gebe auf.“", "„Ich hätte ihn nicht so nett schreiben sollen.“", "„Das kommt ins Abenteuertagebuch. Leider.“"],
        schirm: "„Pause. Ich brauche einen Tee.“",
        peinlich: ["(Der Spielleiter sagt nichts. Lange.)", "(Irgendwo zirpt eine Grille.)", "(Jemand am Tisch räuspert sich.)", "(Der Spielleiter schaut dich an. Und schaut. Und schaut.)", "(Echo raschelt sehr laut mit einer Chipstüte.)", "(Man hört die Uhr ticken.)", "„Er … … … sieht dich an.“", "(Der Spielleiter blinzelt nicht mehr.)", "„…“ – „…“ – „…Würfel einfach.“", "(Friedrich schaut aus dem Fenster.)"],
        nachhall: ["…", "… …", "…Danke?", "…Okay.", "…Bitte geh.", "…Hm."]
      }
    },
    en: {
      label: "Dice game", titel: "Roll for Charm",
      text: "Every bard knows the question: can I seduce the NPC? Barradin tries it on everyone. Pick a line, roll the d20 – and watch the game master's face.",
      start: "▶ I roll for charm", nochmal: "↻ Another session", buch: "📖 Book of Conquests", zurueck: "Back",
      geduld: "Game master's patience", aufgabe: "Task", sprueche: n => n + (n === 1 ? " line" : " lines") + " left",
      arten: { charmant: "Charming", kuehn: "Bold", absurd: "Absurd", passend: "Fitting" },
      artInfo: { charmant: n => "DC " + n + " · 1 ♥", kuehn: n => "DC " + n + " · 2 ♥", absurd: () => "Pure luck · costs patience", passend: n => "DC " + n + " · 1 ♥" },
      joker: { echo: "Echo: \"Do you know Gundren?\"", rex: "Send in Rex", floete: "Flute of illusions" },
      jokerKurz: { echo: "🗣 \"Gundren?\"", rex: "🐕 Rex", floete: "🎶 Flute" },
      jokerInfo: { echo: "New lines + one extra turn", rex: "+1 ♥, guaranteed", floete: "Next roll with advantage" },
      wurf: (w, b, s) => "d20: " + w + " + " + b + " Charisma = " + s,
      gegen: sg => "vs DC " + sg,
      erfolg: "Success!", misserfolg: "Missed.", krit: "Natural 20!", patzer: "Natural 1 …",
      erobert: "Conquered!", korb: "Rejected.", weiter: "Next NPC →", ende: "End of session",
      schirmZu: "The game master folds his screen.",
      bilanz: (e, n, h) => e + " of " + n + " NPCs conquered · " + h + " ♥",
      rekord: n => "Best evening so far: " + n + " ♥", neuRekord: "New record!",
      buchTitel: "The Book of Conquests", buchText: "Who has Barradin already wrapped around his finger?",
      buchStand: { erobert: "♥ Conquered", korb: "✗ Rejected", offen: "Not met yet" },
      bonusRuf: "The game master grins. \"You still have time? Good. I have one more …\"",
      nsc: {
        gundren: { name: "Gundren", aufgabe: "Talk him into paying in advance.",
          intro: "\"Ah, the heroes! Ready for the road to Phandalin?\"",
          charmant: ["\"Gundren, is that ore in your beard, or do your eyes always sparkle like that when you look at me?\"", "\"I'd escort any caravan with you. Ideally the one where it's just us two.\"", "\"Your beard is so beautifully braided. May I … just run my fingers through it once?\"", "\"You know what shines brightest in Phandalin? Not the mine. You.\""],
          kuehn: ["\"Pay us in advance and I'll pay you back in kisses. With interest.\"", "\"Forget the lost mine, Gundren. The greatest treasure is standing right in front of you.\"", "\"One kiss for every gold coin. I've got time.\""],
          absurd: ["\"I dreamt of you. You were a pony. I was the cart. We were happy.\"", "\"May I wear your hat? Just briefly. Forever. To bed.\"", "\"Are you a pickaxe? Because you just struck my heart.\""],
          passend: ["\"You're looking for a lost forge? I've got a fire burning just for you.\"", "\"Of all the dwarves on the road to Phandalin, you're clearly the handsome one.\""],
          ja: ["Gundren twirls his beard bashfully. \"Oh, you're a smooth one …\"", "Gundren blushes right up to his hat brim. \"Stop it. No, keep going.\"", "\"Ha! With a mouth like that you should be a merchant. Or … my companion.\""],
          nein: ["\"Payment in Phandalin. Even for charmers.\"", "Gundren counts his coins pointedly. For himself. And doesn't wink back."],
          krit: "Gundren presses the whole purse into your hand – and a kiss on your cheek. Through the beard. It tickles.",
          patzer: "Gundren writes your name down. On the list of people who get nothing.",
          sieg: "The reward jingles in advance. Gundren waves you off and blows Barradin a kiss.",
          verloren: "\"See you in Phandalin.\" You won't, not for a while …" },
        buergermeister: { name: "The Mayor of Phandalin", aufgabe: "Get him to pay the reward without haggling.",
          intro: "\"Reward? I recall no reward.\"",
          charmant: ["\"Mister Mayor, your chain of office suits you – but you'd shine without it too.\"", "\"You have such a strong … administrative aura. I'm getting all warm.\"", "\"Your fur collar is the softest thing in Phandalin. Almost as soft as your gaze.\"", "\"May I say you sign documents like a poet?\""],
          kuehn: ["\"Pay the full reward and I'll take you to dinner. Candlelight. Just us and the tax rolls.\"", "\"A great man should make great gestures. Let's start with the reward. Then we'll see.\"", "\"I have a proposal. Not an official one.\""],
          absurd: ["\"I'd like your signature. On my heart. Or a cheque. Ideally both.\"", "\"Are you a wizard? Every time I look at you, my gold disappears. And my mind.\""],
          passend: ["\"I hear you count your coins every evening. I'd love to sit next to you. Very close.\"", "\"Vote for me. Not for office. For your heart.\""],
          ja: ["The mayor loosens his chain of office. \"Has it got warm in here?\"", "\"Well … I don't want to be a brute.\" He blushes to his ears.", "He dabs his forehead. \"You … you flatterer.\""],
          nein: ["\"Flattery costs extra. Double for you.\"", "He pushes the purse a little further away. And his chair."],
          krit: "The mayor pays without haggling – and asks whether Barradin is free on Saturday.",
          patzer: "He charges a fee for compliments. Retroactively.",
          sieg: "You get the full reward. And the mayor writes Barradin a poem. It doesn't rhyme.",
          verloren: "He gives you a copper coin. One. To share." },
        bugbear: { name: "The bugbear in the watchtower", aufgabe: "Get through the door without a fight.",
          intro: "A huge, hairy bugbear blocks the door. \"GRRR.\"",
          charmant: ["\"What magnificent fur! May I … give it a scratch?\"", "\"You have the finest claws in the whole watchtower. And the finest eyes.\"", "\"Your growl goes right through me. In a good way.\"", "\"So big, so strong, so fluffy. You're my type.\""],
          kuehn: ["\"Let me through and I'll name my next lute after you. And my firstborn.\"", "\"You and me, big guy. Candlelight. A barrel of beer. A blanket made of your fur. With you in it.\"", "\"Come here and give me one of those bear hugs.\""],
          absurd: ["\"I have a barrel. You have a barrel. See? Soulmates.\"", "\"Are you a rug? Because I'd love to lie on you in front of the fire.\""],
          passend: ["\"Grrr.\" (Barradin growls back tenderly and winks.)", "\"You guard that door so passionately. Guard me instead.\""],
          ja: ["The bugbear purrs. Quietly. Smitten.", "\"…Grrr?\" He flutters his lashes. He has surprisingly long lashes.", "The bugbear bashfully smooths down his fur."],
          nein: ["\"GRRR!\"", "The bugbear flattens his ears. Not a flirting signal."],
          krit: "The bugbear opens the door, bows, and gives you half a rat and a heart made of bones.",
          patzer: "The bugbear sits on you. It's warm. It's heavy.",
          sieg: "The door is open. The bugbear sighs after you and draws a heart in the dust.",
          verloren: "You have to fight after all. The bugbear looks hurt." },
        ilvara: { name: "Ilvara Mizzrym", aufgabe: "Get her to loosen the chains a little.",
          intro: "\"Slaves don't speak unless spoken to.\"",
          charmant: ["\"Mistress, your gaze is sharper than any drow blade. And I'd gladly cut myself on it.\"", "\"In these chains I feel so close to you.\"", "\"This fortress is gloomy. You, however, shine like the light I miss so much.\"", "\"You're the only one here I'd stay for willingly.\""],
          kuehn: ["\"Loosen the chains and I'll sing you a love song that would make Lolth blush.\"", "\"You and me, mistress – I hold the lute, you hold the whip. A dream couple.\"", "\"Take off my chains. I'll still be yours.\""],
          absurd: ["\"I like spiders. A lot. Eight legs, eight arms to hug. Please.\"", "\"Are you a druid? Because you've turned me into a lovesick fool.\""],
          passend: ["\"Your spiders have excellent taste. They never leave your side. I understand them.\"", "\"You've lured me into your web, mistress. And I don't want to leave.\""],
          ja: ["Ilvara raises an eyebrow. For her, that's almost a blush.", "\"Amusing.\" She lowers the whip. Slowly.", "Ilvara turns away so no one sees her smile. Barradin sees it anyway."],
          nein: ["\"One more word and you feed the spiders.\"", "She cracks the whip. Not close. But close enough."],
          krit: "Ilvara loosens the chains, leans in and whispers: \"If you flee, bard … flee slowly.\"",
          patzer: "Ilvara doubles your chains. \"For safety.\"",
          sieg: "The chains sit looser. Ilvara pretends nothing happened – but she watches you go.",
          verloren: "\"Take him away.\" The chains rattle. Not romantic." },
        kuotoa: { name: "A kuo-toa guard", aufgabe: "He should let you into the city.",
          intro: "The guard stares. For a long time. Without blinking.",
          charmant: ["\"Your scales shimmer like the lake in moonlight.\"", "\"You have the most beautiful big eyes I've ever seen. And you never look away. Romantic.\"", "\"You smell of algae. I love algae.\"", "\"So shiny, so slippery, so … mysterious.\""],
          kuehn: ["\"Let us in and I'll take you on a boat ride. Just the two of us and the underground lake.\"", "\"Give me a wet kiss and I'll forget how strange this is.\"", "\"For you I'd even want gills.\""],
          absurd: ["\"Blub.\" (Barradin winks seductively. With both eyes. One after the other.)", "\"Are you a fish? Because you've got me hooked.\""],
          passend: ["\"There's something divine about you. A real one, not a made-up one. I'd worship you.\"", "\"I'm no fish, but I'm swimming in your direction.\""],
          ja: ["The guard bubbles contentedly. His fins tremble.", "\"Blub.\" It sounds smitten. Probably.", "The guard's gills turn quite pink."],
          nein: ["The guard keeps staring. Unimpressed. And damp.", "\"Strangers. Suspicious. Too charming. Blub.\""],
          krit: "The guard opens the gate, waves with both fins and gives Barradin a shell. Heart-shaped. Almost.",
          patzer: "The guard calls three friends. Now they're all staring.",
          sieg: "The gate opens with a wet squeak. The guard gazes after you longingly.",
          verloren: "You get in anyway – in chains. As planned. Sort of." },
        horga: { name: "King Horga Steel V", aufgabe: "Ask for hospitality in Gracklstugh.",
          intro: "\"Speak, bard. But be brief.\"",
          charmant: ["\"Your Majesty, your beard alone has more dignity than all of Phandalin. And more allure.\"", "\"Your crown fits splendidly. But I bet you're even more handsome without it.\"", "\"Gracklstugh glows – but you glow brighter. I'm melting.\"", "\"When you command, I obey. Gladly. Always.\""],
          kuehn: ["\"Grant us hospitality and I'll compose you a love anthem. With an anvil solo.\"", "\"A king like you needs a bard like me. At his side. Every evening.\"", "\"Your Majesty, may I have this dance? Even without music?\""],
          absurd: ["\"May I braid your beard? Very slowly.\"", "\"Are you an anvil? Because my heart hammers faster around you.\""],
          passend: ["\"We saved your son. And thought of his dashing father the whole time.\"", "\"I've never seen such a steely king. Hard on the outside, soft on the inside?\""],
          ja: ["The king grumbles. His ears turn red.", "\"Hmph. You have nerve, bard.\" He strokes his beard, flattered.", "The court whispers. The king says nothing. But he smiles."],
          nein: ["\"Guards!\" The guards don't move. But they giggle.", "The king looks as if he'd bitten a lemon."],
          krit: "The king laughs – for the first time in fifty years – and offers Barradin a seat of honour beside the throne.",
          patzer: "The king has you politely but firmly rolled out. In a barrel.",
          sieg: "Hospitality granted. And a dinner invitation. Kardal rubs his forehead in embarrassment.",
          verloren: "You may stay – but only because you saved his son." },
        hgraam: { name: "The Stonespeaker", aufgabe: "He should give you his stonespeaker crystal.",
          intro: "\"The stone is screaming. Do you hear it?\"",
          charmant: ["\"You are so … steadfast. I like men I can lean on.\"", "\"Your skin has a wonderful grain. May I touch it?\"", "\"When you speak, I hear the mountain sing. And my heart.\"", "\"You're a rock in the surf. And I'm the surf.\""],
          kuehn: ["\"Give me the crystal and I'll sing for you until the stone stops screaming. And starts sighing.\"", "\"You and me – rock and bard. I do love climbing.\"", "\"Lift me up. Just once. Please.\""],
          absurd: ["\"I have some stones too. In my pocket. Collected for you. Want to see?\"", "\"Are you a quarry? Because I'm losing myself in you.\""],
          passend: ["\"The stone screams? So do I. With longing.\"", "\"I'd listen to you even if you only spoke in riddles. Especially then.\""],
          ja: ["The Stonespeaker nods slowly. Very slowly. Very tenderly.", "\"The stone … likes you.\" He looks away. Giants blush too.", "A tiny pebble rolls bashfully off his shoulder."],
          nein: ["The Stonespeaker keeps speaking in riddles. About something else entirely.", "He regards you like a pebble that flirts too much."],
          krit: "The Stonespeaker smiles and lifts Barradin up like a precious gem. Somewhere a rock falls over, deeply moved.",
          patzer: "He mistakes you for a talking stone and puts you with the others.",
          sieg: "The crystal lies warm in your hand. The Stonespeaker held it to his heart for a moment first.",
          verloren: "\"Something insatiable is stirring.\" He means you." },
        themberchaud: { name: "Themberchaud, Master of Flames", aufgabe: "Convince him not to eat you.",
          intro: "The dragon lands on the gold. The hall gets very warm. Very quiet.",
          charmant: ["\"Your hoard shines – but not like your scales.\"", "\"I've never seen such a magnificent dragon. Honestly, I've never seen one at all. But you set the bar high.\"", "\"Your fire warms my heart. And my eyebrows.\"", "\"They call you Master of Flames. Now I understand why I'm burning.\""],
          kuehn: ["\"Let us live and I'll sing you a love song every evening. Right on top of your gold.\"", "\"You breathe fire, I spit verse. Let's kindle something together.\"", "\"I'd love to be your most precious piece. Put me right on top of the hoard.\""],
          absurd: ["\"May I cuddle with you on the golden dog? It looks comfy.\"", "\"Are you a volcano? Because I'm melting. Literally.\""],
          passend: ["\"A being of your taste only collects the most beautiful things. And here I stand.\"", "\"It's hotter near you than in the lava. And it's not the lava.\""],
          ja: ["Themberchaud puffs out a contented, almost heart-shaped cloud of smoke.", "\"Entertaining.\" He lowers his head and studies Barradin. For a long time.", "The lava bubbles. Themberchaud purrs. Both sound suspiciously like affection."],
          nein: ["A warning wisp of smoke rises from his nostrils.", "The lute suddenly gets very warm."],
          krit: "Themberchaud purrs and puts a gold coin in Barradin's hand. \"Something to remember me by.\" Echo quietly asks if he knows Gundren.",
          patzer: "Themberchaud sneezes. Barradin's hair is shorter now.",
          sieg: "The dragon spares you, gives you a task and winks. Barradin calls it a date.",
          verloren: "You live – but only because Themberchaud needs someone for the dirty work." },
        demogorgon: { name: "Demogorgon (bonus)", aufgabe: "Please … just leave again.",
          intro: "Two heads. Tentacles. The game master smiles very widely.",
          charmant: ["\"You have two beautiful heads. I can't decide which one to swoon over first.\"", "\"Those tentacles! So many. So … huggy.\"", "\"Your scream is so piercing. So … passionate.\""],
          kuehn: ["\"Go back to the Abyss and I'll write you a love duet. For both heads.\"", "\"Two heads, two kisses. I'm ready.\"", "\"You and me, demon prince. What could possibly go wrong?\""],
          absurd: ["\"Friedrich punched you. I'd rather hug you. With all the tentacles.\"", "\"Which head is the romantic one? Asking for myself.\""],
          passend: ["(Barradin raises the flute of illusions and conjures Demogorgon a heart of light.)", "\"You're the prince of demons. And the prince of my heart.\""],
          ja: ["The left head giggles, smitten. The right one is jealous.", "The tentacles form a heart. A wonky one, but a heart."],
          nein: ["Both heads scream. At the same time.", "A tentacle pats Barradin. Too hard."],
          krit: "Demogorgon blushes. On both heads. And vanishes into the lake, confused – with one look back.",
          patzer: "Demogorgon eats the lute. The game master has to step out for a moment.",
          sieg: "Demogorgon retreats. Both heads blow Barradin a kiss.",
          verloren: "You run for the boat. Like back then. Only more embarrassing." }
      },
      sl: {
        start: ["\"Okay. You stand before …\" – \"I flirt.\" – \"I haven't even said who!\"", "\"I have a bad feeling about this.\"", "\"Please. Please don't flirt again.\"", "\"Barradin, he's an NPC. An NPC!\""],
        absurd: ["\"You can't be serious.\"", "\"I'm writing that down.\"", "\"I hate you. Lovingly.\"", "\"…Roll.\""],
        erfolg: ["\"Okay. That counts.\"", "\"I can't believe it.\"", "\"…Fine. He blushes.\"", "\"Why does this ALWAYS work?\"", "\"I'll play this with dignity. Somehow.\""],
        misserfolg: ["\"No.\"", "\"He didn't hear that. On purpose.\"", "\"Dice don't lie.\"", "\"Next try.\""],
        krit: ["\"WHAT?!\"", "\"That … that's impossible.\"", "\"I need to rewrite my notes.\""],
        patzer: ["\"HAHAHA – no.\"", "\"That will have consequences.\"", "\"I'll just leave that there.\""],
        echo: ["\"No, he doesn't know Gundren.\"", "\"Echo. Please.\"", "\"Nobody knows Gundren.\""],
        rex: ["\"Fine, everyone loves the dog. That's unfair.\"", "\"Rex. Of course Rex.\""],
        floete: ["\"Not Demogorgon again.\"", "\"You and your flute.\""],
        korb: ["\"Rejected. I love a rejection.\"", "\"Well, that's that.\""],
        erobert: ["\"I give up.\"", "\"I shouldn't have written him so nice.\"", "\"That's going in the adventure log. Sadly.\""],
        schirm: "\"Break. I need a cup of tea.\"",
        peinlich: ["(The game master says nothing. For a long time.)", "(Somewhere, a cricket chirps.)", "(Someone at the table clears their throat.)", "(The game master looks at you. And looks. And looks.)", "(Echo rustles a crisp packet very loudly.)", "(You can hear the clock ticking.)", "\"He … … … looks at you.\"", "(The game master has stopped blinking.)", "\"…\" – \"…\" – \"…Just roll.\"", "(Friedrich stares out of the window.)"],
        nachhall: ["…", "… …", "…Thanks?", "…Okay.", "…Please leave.", "…Hm."]
      }
    }
  };
  const t = () => TX[sprache()];

  /* ---------- Szene: Zimmer, Spielleiter, Schirm (SVG) ---------- */
  const ZIMMER = `
<svg class="ch-zimmer" viewBox="0 0 400 300" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
  <defs>
    <radialGradient id="chLicht" cx="72%" cy="18%" r="70%"><stop offset="0" stop-color="#5a3a26"/><stop offset=".55" stop-color="#2a1d1f"/><stop offset="1" stop-color="#151017"/></radialGradient>
    <linearGradient id="chHolz" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6b4528"/><stop offset="1" stop-color="#3a2416"/></linearGradient>
    <radialGradient id="chLampLicht"><stop offset="0" stop-color="#ff7ab8" stop-opacity=".35"/><stop offset=".5" stop-color="#ffb070" stop-opacity=".12"/><stop offset="1" stop-color="#ffb070" stop-opacity="0"/></radialGradient>
    <linearGradient id="chAkustik" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e2a35a"/><stop offset="1" stop-color="#9a5a24"/></linearGradient>
  </defs>
  <rect width="400" height="300" fill="url(#chLicht)"/>
  <!-- Poster: Drache -->
  <g class="ch-wand" transform="translate(0 40)"><g transform="translate(14 30) rotate(-3)">
    <rect width="66" height="88" rx="2" fill="#2b2230" stroke="#c9a46a" stroke-width="1.5"/>
    <rect x="5" y="5" width="56" height="62" fill="#3c1f22"/>
    <path d="M13 58 C 20 40 30 34 40 36 C 46 22 56 20 58 14 C 54 28 50 34 52 44 C 48 52 36 56 13 58 Z" fill="#c2412f"/>
    <path d="M33 37 l -14 -12 l 6 14 Z M40 36 l 4 -18 l 3 17 Z" fill="#8a2a22"/>
    <circle cx="53" cy="20" r="1.5" fill="#ffd27a"/>
    <rect x="9" y="72" width="48" height="4" fill="#c9a46a"/><rect x="15" y="79" width="36" height="3" fill="#8a7a62"/>
  </g>
  <!-- Poster: W20 -->
  <g transform="translate(88 42) rotate(2)">
    <rect width="48" height="62" rx="2" fill="#1e2a3a" stroke="#c9a46a" stroke-width="1.2"/>
    <polygon points="24,9 39,18 39,36 24,45 9,36 9,18" fill="none" stroke="#ffd27a" stroke-width="1.6"/>
    <path d="M24 9 L24 19 M9 18 L24 19 L39 18 M24 19 L15 34 L33 34 Z M15 34 L9 36 M33 34 L39 36 M15 34 L24 45 L33 34" fill="none" stroke="#ffd27a" stroke-width="1"/>
    <text x="24" y="31" text-anchor="middle" font-size="8" font-weight="700" fill="#ffd27a" font-family="Georgia,serif">20</text>
    <rect x="8" y="51" width="32" height="3" fill="#c9a46a"/>
  </g>
  <!-- Poster: Karte -->
  <g transform="translate(352 14) rotate(4) scale(.8)">
    <rect width="56" height="70" rx="2" fill="#d9c493" stroke="#7a5a34" stroke-width="1.2"/>
    <path d="M8 18 C 18 10 26 24 36 16 C 44 10 50 22 48 30 C 40 36 46 48 36 54 C 26 58 20 48 12 52 C 6 44 4 28 8 18 Z" fill="#b89a62" opacity=".7"/>
    <path d="M14 26 l 8 6 l 10 -4 l 8 10" fill="none" stroke="#8a2a22" stroke-width="1" stroke-dasharray="2 2"/>
    <circle cx="40" cy="38" r="2" fill="#8a2a22"/>
  </g>
  <!-- Gitarre (akustisch) -->
  <g transform="translate(146 -6) rotate(-8)">
    <rect x="19" y="-4" width="10" height="16" rx="2" fill="#3a2416"/>
    <rect x="21.5" y="10" width="5" height="54" fill="#5a3a22"/>
    <ellipse cx="24" cy="78" rx="15" ry="14" fill="url(#chAkustik)"/>
    <ellipse cx="24" cy="104" rx="20" ry="18" fill="url(#chAkustik)"/>
    <circle cx="24" cy="90" r="6" fill="#2a1a12"/>
    <rect x="17" y="110" width="14" height="3" fill="#3a2416"/>
    <path d="M22.5 10 V 110 M24 10 V 110 M25.5 10 V 110" stroke="#e8e0cc" stroke-width=".35"/>
    <circle cx="24" cy="-7" r="3" fill="#5a4a3a"/>
  </g>
  <!-- Gitarre (E-Gitarre) -->
  <g transform="translate(322 50) rotate(9) scale(.9)">
    <path d="M18 -2 h 10 l -1 14 h -8 Z" fill="#1d1a1a"/>
    <rect x="20" y="12" width="6" height="56" fill="#4a3020"/>
    <path d="M6 70 C 2 60 14 58 18 66 L 28 66 C 32 56 46 60 42 72 C 52 82 46 104 30 108 L 16 108 C 0 104 -4 84 6 70 Z" fill="#a1232c"/>
    <rect x="14" y="80" width="18" height="4" fill="#ddd"/><rect x="14" y="90" width="18" height="4" fill="#ddd"/>
    <circle cx="36" cy="100" r="2" fill="#ddd"/>
    <path d="M22 12 V 98 M24 12 V 98" stroke="#e8e0cc" stroke-width=".35"/>
    <circle cx="23" cy="-5" r="3" fill="#5a4a3a"/>
  </g>
  </g>
  <!-- Lichterkette -->
  <g class="ch-kette" transform="translate(0 50)"><path d="M-5 22 Q 100 64 205 26 Q 305 62 405 24" stroke="#1a1410" stroke-width="1.1" fill="none"/><g class="kb" style="--d:0.00s"><circle cx="16.0" cy="34.6" r="7" fill="#ffd27a" opacity=".22"/><ellipse cx="16.0" cy="33.6" rx="2.4" ry="3.4" fill="#ffd27a"/></g><g class="kb" style="--d:0.37s"><circle cx="37.0" cy="40.6" r="7" fill="#ff7ab0" opacity=".22"/><ellipse cx="37.0" cy="39.6" rx="2.4" ry="3.4" fill="#ff7ab0"/></g><g class="kb" style="--d:0.74s"><circle cx="58.0" cy="45.0" r="7" fill="#ffb060" opacity=".22"/><ellipse cx="58.0" cy="44.0" rx="2.4" ry="3.4" fill="#ffb060"/></g><g class="kb" style="--d:1.11s"><circle cx="79.0" cy="47.8" r="7" fill="#c9a0ff" opacity=".22"/><ellipse cx="79.0" cy="46.8" rx="2.4" ry="3.4" fill="#c9a0ff"/></g><g class="kb" style="--d:1.48s"><circle cx="100.0" cy="49.0" r="7" fill="#ff7ab0" opacity=".22"/><ellipse cx="100.0" cy="48.0" rx="2.4" ry="3.4" fill="#ff7ab0"/></g><g class="kb" style="--d:1.85s"><circle cx="121.0" cy="48.6" r="7" fill="#ffd27a" opacity=".22"/><ellipse cx="121.0" cy="47.6" rx="2.4" ry="3.4" fill="#ffd27a"/></g><g class="kb" style="--d:0.02s"><circle cx="142.0" cy="46.6" r="7" fill="#ffd27a" opacity=".22"/><ellipse cx="142.0" cy="45.6" rx="2.4" ry="3.4" fill="#ffd27a"/></g><g class="kb" style="--d:0.39s"><circle cx="163.0" cy="43.0" r="7" fill="#ff7ab0" opacity=".22"/><ellipse cx="163.0" cy="42.0" rx="2.4" ry="3.4" fill="#ff7ab0"/></g><g class="kb" style="--d:0.76s"><circle cx="184.0" cy="37.8" r="7" fill="#ffb060" opacity=".22"/><ellipse cx="184.0" cy="36.8" rx="2.4" ry="3.4" fill="#ffb060"/></g><g class="kb" style="--d:1.13s"><circle cx="225.0" cy="37.5" r="7" fill="#c9a0ff" opacity=".22"/><ellipse cx="225.0" cy="36.5" rx="2.4" ry="3.4" fill="#c9a0ff"/></g><g class="kb" style="--d:1.50s"><circle cx="245.0" cy="42.4" r="7" fill="#ff7ab0" opacity=".22"/><ellipse cx="245.0" cy="41.4" rx="2.4" ry="3.4" fill="#ff7ab0"/></g><g class="kb" style="--d:1.87s"><circle cx="265.0" cy="45.9" r="7" fill="#ffd27a" opacity=".22"/><ellipse cx="265.0" cy="44.9" rx="2.4" ry="3.4" fill="#ffd27a"/></g><g class="kb" style="--d:0.04s"><circle cx="285.0" cy="48.0" r="7" fill="#ffd27a" opacity=".22"/><ellipse cx="285.0" cy="47.0" rx="2.4" ry="3.4" fill="#ffd27a"/></g><g class="kb" style="--d:0.41s"><circle cx="305.0" cy="48.5" r="7" fill="#ff7ab0" opacity=".22"/><ellipse cx="305.0" cy="47.5" rx="2.4" ry="3.4" fill="#ff7ab0"/></g><g class="kb" style="--d:0.78s"><circle cx="325.0" cy="47.6" r="7" fill="#ffb060" opacity=".22"/><ellipse cx="325.0" cy="46.6" rx="2.4" ry="3.4" fill="#ffb060"/></g><g class="kb" style="--d:1.15s"><circle cx="345.0" cy="45.1" r="7" fill="#c9a0ff" opacity=".22"/><ellipse cx="345.0" cy="44.1" rx="2.4" ry="3.4" fill="#c9a0ff"/></g><g class="kb" style="--d:1.52s"><circle cx="365.0" cy="41.2" r="7" fill="#ff7ab0" opacity=".22"/><ellipse cx="365.0" cy="40.2" rx="2.4" ry="3.4" fill="#ff7ab0"/></g><g class="kb" style="--d:1.89s"><circle cx="385.0" cy="35.9" r="7" fill="#ffd27a" opacity=".22"/><ellipse cx="385.0" cy="34.9" rx="2.4" ry="3.4" fill="#ffd27a"/></g></g>
  <!-- Regal mit Würfeln und Büchern -->
  <g transform="translate(0 30)">
  <rect x="0" y="150" width="120" height="5" fill="#4a2e1a"/>
  <rect x="8" y="128" width="8" height="22" fill="#6a2a2a"/><rect x="17" y="131" width="7" height="19" fill="#2a4a6a"/><rect x="25" y="126" width="9" height="24" fill="#3a5a2a"/>
  <polygon points="52,150 58,140 64,150" fill="#7a3ab0"/><polygon points="70,150 75,142 80,150" fill="#d0a030"/><rect x="88" y="142" width="8" height="8" fill="#b02a2a" transform="rotate(12 92 146)"/>
  </g>
  <!-- Lampe -->
  <circle class="ch-lampenschein" cx="372" cy="170" r="70" fill="url(#chLampLicht)"/>
  <!-- Lavalampe auf dem Beistelltisch -->
  <rect x="340" y="234" width="64" height="5" fill="#4a2e1a"/>
  <g class="ch-lavalampe">
    <circle cx="372" cy="206" r="26" fill="#ff5a9a" opacity=".12"/>
    <path d="M362 234 L 366 226 L 378 226 L 382 234 Z" fill="#8a8aa0"/>
    <path d="M366 226 L 362 190 Q 372 176 382 190 L 378 226 Z" fill="#5a1844" stroke="#c0c0d0" stroke-width=".8"/>
    <g class="ch-lava"><ellipse cx="371" cy="220" rx="4" ry="4.5" fill="#ff7ab8"/><ellipse cx="374" cy="214" rx="3" ry="3.5" fill="#ff9acb"/><ellipse cx="369" cy="223" rx="3.2" ry="2.6" fill="#ff5aa0"/></g>
    <path d="M364 190 Q 372 180 380 190 L 378 184 L 366 184 Z" fill="#8a8aa0"/>
  </g>
  <!-- Spielleiter -->
  <g class="ch-sl">
    <g class="ch-koerper">
      <!-- schmale, nackte Schultern, dunkles Tanktop -->
      <path d="M222 300 L 225 216 C 227 200 238 192 252 190 L 288 190 C 302 192 313 200 315 216 L 318 300 Z" fill="#ecc29f"/>
      <path d="M236 300 L 237 222 C 238 208 245 198 254 193 L 257 191 L 262 203 Q 270 212 278 203 L 283 191 L 286 193 C 295 198 302 208 303 222 L 304 300 Z" fill="#1d2740"/>
      <path d="M262 203 Q 270 212 278 203" fill="none" stroke="#2c3a5c" stroke-width="2"/>
      <!-- Tattoos auf den Schultern -->
      <path d="M229 208 c 3 -5 9 -5 9 1 c 0 5 -7 5 -6 0 M233 216 l 4 6" stroke="#2a3a52" stroke-width="1.6" fill="none" stroke-linecap="round"/>
      <path d="M308 206 l 3 5 l -5 2 l 3 5" stroke="#2a3a52" stroke-width="1.6" fill="none" stroke-linecap="round"/>
      <!-- Arme bis zum Tisch, mit Band-Tattoos -->
      <g class="ch-arme">
        <path d="M228 206 C 222 214 224 222 232 226" stroke="#ecc29f" stroke-width="12" fill="none" stroke-linecap="round"/>
        <path class="arm-r" d="M312 206 C 318 214 316 222 308 226" stroke="#ecc29f" stroke-width="12" fill="none" stroke-linecap="round"/>
      </g>
      <rect x="263" y="166" width="14" height="26" rx="6" fill="#e2b592"/>
      <g class="ch-kopf">
        <!-- Dreads, hinten zum Dutt gebunden -->
        <path d="M292 108 C 304 120 306 150 308 178 M296 112 C 310 126 312 152 316 176 M288 106 C 298 124 298 150 300 172" stroke="#8a6a44" stroke-width="5" fill="none" stroke-linecap="round"/>
        <circle cx="290" cy="98" r="11" fill="#8a6a44"/><path d="M282 94 q 8 -6 16 2 M284 101 q 7 -4 13 2" stroke="#6a4c2e" stroke-width="1.4" fill="none"/>
        <ellipse cx="270" cy="139" rx="24" ry="31" fill="#ecc29f"/>
        <ellipse cx="246" cy="142" rx="4.5" ry="7.5" fill="#e2b592"/><ellipse cx="294" cy="142" rx="4.5" ry="7.5" fill="#e2b592"/>
        <!-- Haare nach hinten, dunkelblond-braun -->
        <path d="M246 132 C 243 108 256 99 272 99 C 289 99 299 110 295 130 C 292 117 284 111 272 111 C 260 111 251 117 246 132 Z" fill="#8a6a44"/>
        <path d="M256 108 C 264 103 276 103 286 108 M252 116 C 260 108 280 107 290 116" stroke="#a8875a" stroke-width="1.3" fill="none"/>
        <!-- Vollbart mit Schnurrbart -->
        <path d="M247 140 C 246 165 258 177 270 178 C 282 177 294 165 293 140 C 291 154 286 159 281 161 C 277 156 263 156 259 161 C 254 159 249 154 247 140 Z" fill="#7a5a3a"/>
        <path d="M259 154 C 264 150 276 150 281 154 C 276 153 264 153 259 154 Z" fill="#6a4c2e"/>
        <!-- Augenbrauen -->
        <g class="ch-brauen">
          <path class="b-normal" d="M253 128 q 6 -3 11 0 M276 128 q 6 -3 11 0" stroke="#5a3e24" stroke-width="2.4" fill="none" stroke-linecap="round"/>
          <path class="b-hoch" d="M253 124 q 6 -5 11 -1 M276 123 q 6 -4 11 1" stroke="#5a3e24" stroke-width="2.4" fill="none" stroke-linecap="round"/>
          <path class="b-boese" d="M253 126 q 6 1 11 4 M276 130 q 6 -3 11 -4" stroke="#5a3e24" stroke-width="2.4" fill="none" stroke-linecap="round"/>
          <path class="b-muede" d="M253 130 q 6 -1 11 1 M276 131 q 6 -2 11 -1" stroke="#5a3e24" stroke-width="2.4" fill="none" stroke-linecap="round"/>
        </g>
        <!-- Augen -->
        <g class="ch-augen">
          <g class="a-offen"><ellipse cx="259" cy="138" rx="4.6" ry="5" fill="#fff"/><ellipse cx="281" cy="138" rx="4.6" ry="5" fill="#fff"/>
            <g class="ch-pupillen"><circle cx="259.5" cy="138.5" r="2.4" fill="#3a2a1a"/><circle cx="281.5" cy="138.5" r="2.4" fill="#3a2a1a"/></g></g>
          <g class="a-gross"><ellipse cx="259" cy="137" rx="6" ry="7" fill="#fff"/><ellipse cx="281" cy="137" rx="6" ry="7" fill="#fff"/><circle cx="259" cy="137" r="2" fill="#3a2a1a"/><circle cx="281" cy="137" r="2" fill="#3a2a1a"/></g>
          <g class="a-zu"><path d="M254 139 q 5 4 10 0 M276 139 q 5 4 10 0" stroke="#3a2a1a" stroke-width="2" fill="none" stroke-linecap="round"/></g>
          <g class="a-halb"><path d="M254 137 h 10 M276 137 h 10" stroke="#3a2a1a" stroke-width="2" stroke-linecap="round"/><path d="M255 138 q 4 3 8 0 M277 138 q 4 3 8 0" fill="#3a2a1a"/></g>
          <g class="a-unten"><ellipse cx="259" cy="140" rx="4.6" ry="4" fill="#fff"/><ellipse cx="281" cy="140" rx="4.6" ry="4" fill="#fff"/><circle cx="259" cy="142" r="2.2" fill="#3a2a1a"/><circle cx="281" cy="142" r="2.2" fill="#3a2a1a"/></g>
        </g>
        <path d="M270 140 q -3 9 0 12 q 2 1 4 0" fill="none" stroke="#c99878" stroke-width="1.6" stroke-linecap="round"/>
        <!-- Münder -->
        <g class="ch-mund">
          <path class="m-neutral" d="M262 158 q 8 2 16 0" stroke="#3e1a12" stroke-width="2" fill="none" stroke-linecap="round"/>
          <path class="m-grinsen" d="M260 156 q 10 9 20 0" stroke="#3e1a12" stroke-width="2.2" fill="none" stroke-linecap="round"/>
          <g class="m-lachen"><path d="M258 154 q 12 16 24 0 Z" fill="#6a2222"/><path d="M261 155 h 18 l -2 3 h -14 Z" fill="#fff"/></g>
          <ellipse class="m-o" cx="270" cy="159" rx="5" ry="6.5" fill="#6a2222"/>
          <path class="m-schief" d="M262 160 q 6 -3 16 -4" stroke="#3e1a12" stroke-width="2" fill="none" stroke-linecap="round"/>
          <path class="m-traurig" d="M262 161 q 8 -5 16 0" stroke="#3e1a12" stroke-width="2" fill="none" stroke-linecap="round"/>
        </g>
        <g class="ch-roete"><ellipse cx="252" cy="150" rx="5" ry="3" fill="#ff7a7a" opacity=".35"/><ellipse cx="288" cy="150" rx="5" ry="3" fill="#ff7a7a" opacity=".35"/></g>
        <g class="ch-zzz"><text x="300" y="112" font-size="11" fill="#cfe6ff" font-family="Georgia,serif">z</text><text x="308" y="102" font-size="14" fill="#cfe6ff" font-family="Georgia,serif">Z</text></g>
        <g class="ch-schweiss"><path d="M300 124 q 3 6 0 8 q -3 -2 0 -8 Z" fill="#9fd6ff"/></g>
      </g>
      <!-- Hände -->
      <g class="ch-haende">
        <g class="h-ruhe"><ellipse cx="236" cy="226" rx="10" ry="6.5" fill="#ecc29f"/><ellipse cx="304" cy="226" rx="10" ry="6.5" fill="#ecc29f"/><path d="M226 222 l 3 8 M229 221 l 3 8" stroke="#22262e" stroke-width="1.6"/><rect x="309" y="221" width="3" height="9" fill="#c99a3a"/></g>
        <g class="h-facepalm"><path d="M312 208 C 312 190 296 174 284 160" stroke="#ecc29f" stroke-width="11" fill="none" stroke-linecap="round"/><path d="M303 186 l 8 -6 M300 182 l 8 -6" stroke="#22262e" stroke-width="1.8"/><ellipse cx="272" cy="141" rx="14" ry="11" fill="#ecc29f"/><path d="M262 134 h 21 M261 140 h 22 M262 146 h 20" stroke="#d3a07e" stroke-width="1"/><ellipse cx="236" cy="226" rx="10" ry="6.5" fill="#ecc29f"/></g>
        <g class="h-daumen"><path d="M312 208 C 322 200 322 190 318 180" stroke="#ecc29f" stroke-width="11" fill="none" stroke-linecap="round"/><path d="M314 196 h 10 M314 192 h 10" stroke="#22262e" stroke-width="1.8"/><rect x="309" y="160" width="16" height="18" rx="5" fill="#ecc29f"/><rect x="313" y="148" width="7" height="16" rx="3.5" fill="#ecc29f"/><ellipse cx="236" cy="226" rx="10" ry="6.5" fill="#ecc29f"/></g>
        <g class="h-stift"><ellipse cx="236" cy="226" rx="10" ry="6.5" fill="#ecc29f"/><ellipse cx="300" cy="222" rx="10" ry="6.5" fill="#ecc29f"/><path d="M298 222 l 12 -18" stroke="#e0a046" stroke-width="3" stroke-linecap="round"/></g>
      </g>
    </g>
  </g>
</svg>`;
  const VORNE = `
<svg class="ch-vorne" viewBox="0 0 400 300" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
  <defs><radialGradient id="chKerzenLicht"><stop offset="0" stop-color="#ffcf7a" stop-opacity=".45"/><stop offset="1" stop-color="#ffcf7a" stop-opacity="0"/></radialGradient><linearGradient id="chSchirm" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5a1e24"/><stop offset="1" stop-color="#2a0d12"/></linearGradient></defs>
  <rect x="0" y="262" width="400" height="38" fill="url(#chHolz)"/>
  <rect x="0" y="260" width="400" height="4" fill="#8a5a34"/>
  <g class="ch-schirm">
    <path d="M196 222 L 252 214 L 252 262 L 196 264 Z" fill="url(#chSchirm)" stroke="#c9a46a" stroke-width="1.2"/>
    <path d="M252 214 L 312 214 L 312 262 L 252 262 Z" fill="url(#chSchirm)" stroke="#c9a46a" stroke-width="1.2"/>
    <path d="M312 214 L 368 222 L 368 264 L 312 262 Z" fill="url(#chSchirm)" stroke="#c9a46a" stroke-width="1.2"/>
    <path d="M216 252 C 222 232 236 228 240 236 C 244 228 246 226 248 222" fill="none" stroke="#c9a46a" stroke-width="1.3"/>
    <polygon points="282,224 294,231 294,245 282,252 270,245 270,231" fill="none" stroke="#c9a46a" stroke-width="1.3"/>
    <path d="M330 252 l 8 -16 l 8 16 Z M338 236 v -8" fill="none" stroke="#c9a46a" stroke-width="1.3"/>
  </g>
  <!-- Kerze mit Schein -->
  <g transform="translate(118 0)">
  <circle class="ch-kerzenschein" cx="66" cy="226" r="40" fill="url(#chKerzenLicht)"/>
  <rect x="60" y="236" width="12" height="28" rx="2" fill="#f2e6cf"/><path d="M60 240 q 3 6 0 10" stroke="#e6d6b8" stroke-width="2" fill="none"/>
  <path d="M66 236 v -4" stroke="#2a1a10" stroke-width="1.2"/>
  <path class="ch-flamme" d="M66 220 C 61 227 62 233 66 233 C 70 233 71 227 66 220 Z" fill="#ffd36a"/>
  <path class="ch-flamme" d="M66 225 C 64 229 64 232 66 232 C 68 232 68 229 66 225 Z" fill="#fff4c8"/>
  </g>
  <!-- Weinglas -->
  <g transform="translate(64 0)">
  <path d="M86 244 q 0 12 8 12 q 8 0 8 -12 Z" fill="rgba(220,230,255,.18)" stroke="rgba(230,235,255,.6)" stroke-width=".8"/>
  <path d="M87 250 q 1 6 7 6 q 6 0 7 -6 Z" fill="#8a1030"/>
  <path d="M94 256 v 7 M89 264 h 10" stroke="rgba(230,235,255,.6)" stroke-width="1.2"/>
  </g>
  <!-- Rose in der Vase -->
  <path d="M378 264 L 380 244 Q 384 240 388 244 L 390 264 Z" fill="rgba(160,210,255,.35)" stroke="rgba(220,235,255,.6)" stroke-width=".8"/>
  <path d="M384 244 C 383 232 386 226 385 214" stroke="#3a7a3a" stroke-width="1.6" fill="none"/>
  <path d="M385 228 q 6 -4 9 -1 q -5 3 -9 1 Z" fill="#3a7a3a"/>
  <circle cx="385" cy="212" r="6" fill="#c0183c"/><path d="M381 211 q 4 -5 8 0 M382 214 q 3 2 6 0" stroke="#7a0a20" stroke-width="1" fill="none"/>
  <polygon points="118,280 126,272 134,280 126,288" fill="#7a3ab0"/><polygon points="138,286 144,276 150,286" fill="#d0a030"/>
  <rect x="104" y="268" width="26" height="18" rx="2" fill="#efe2c2" transform="rotate(-6 117 277)"/>
</svg>`;

  /* ---------- Zustand ---------- */
  let S = null;  /* laufende Sitzung */
  let ansicht = "start"; /* start | spiel | buch */
  const buchLesen = () => { try { return JSON.parse(lies("imres-charme-buch", "{}")) || {}; } catch (_) { return {}; } };
  const rekord = () => parseInt(lies("imres-charme-rekord", "0"), 10) || 0;

  /* ---------- Aufbau ---------- */
  root.innerHTML =
    '<p class="label ch-label"></p><h3 class="ch-titel"></h3><p class="tav-info ch-text"></p>' +
    '<div class="ch-buehne">' + ZIMMER +
      '<div class="ch-sl-blase" aria-live="polite"></div>' +
      '<img class="ch-nsc" alt="" hidden>' +
      VORNE +
      '<div class="ch-nsc-blase" aria-live="polite"></div>' +
      '<div class="ch-wuerfel" hidden><span></span></div>' +
      '<div class="ch-kopfzeile"><div class="ch-geduld"><span class="ch-geduld-txt"></span><span class="ch-geduld-bar"><i></i></span></div><button type="button" class="ch-ton" data-tun="ton"></button><div class="ch-herzen"></div></div>' +
    "</div>" +
    '<div class="ch-tafel"></div>';
  const $ = s => root.querySelector(s);
  const buehne = $(".ch-buehne"), sl = $(".ch-sl"), nscImg = $(".ch-nsc"), nscBlase = $(".ch-nsc-blase"), slBlase = $(".ch-sl-blase"),
    wuerfel = $(".ch-wuerfel"), tafel = $(".ch-tafel");

  /* Gesichtsausdruck: Augen, Brauen, Mund, Hände */
  const AUSDRUCK = {
    neutral: { a: "offen", b: "normal", m: "neutral", h: "ruhe" },
    grinsen: { a: "offen", b: "hoch", m: "grinsen", h: "ruhe" },
    lachen: { a: "zu", b: "hoch", m: "lachen", h: "ruhe" },
    facepalm: { a: "zu", b: "boese", m: "schief", h: "facepalm" },
    schock: { a: "gross", b: "hoch", m: "o", h: "ruhe" },
    notiert: { a: "unten", b: "normal", m: "schief", h: "stift" },
    stolz: { a: "zu", b: "hoch", m: "grinsen", h: "daumen", r: 1 },
    genervt: { a: "halb", b: "muede", m: "traurig", h: "ruhe" },
    errötet: { a: "zu", b: "hoch", m: "grinsen", h: "ruhe", r: 1 },
    schwitzt: { a: "gross", b: "hoch", m: "schief", h: "ruhe", sw: 1 },
    schlaeft: { a: "zu", b: "muede", m: "neutral", h: "ruhe", z: 1 },
    starr: { a: "offen", b: "normal", m: "neutral", h: "ruhe" }
  };
  let ausdruckUhr = 0, ruheUhr = 0;
  function gesicht(name, dauer, danach) {
    const A = AUSDRUCK[name] || AUSDRUCK.neutral;
    sl.dataset.a = A.a; sl.dataset.b = A.b; sl.dataset.m = A.m; sl.dataset.h = A.h;
    sl.classList.toggle("rot", !!A.r); sl.classList.toggle("zzz", !!A.z); sl.classList.toggle("schweiss", !!A.sw);
    sl.classList.remove("hops"); void sl.getBBox; requestAnimationFrame(() => sl.classList.add("hops"));
    clearTimeout(ausdruckUhr);
    if (dauer) ausdruckUhr = setTimeout(() => gesicht(danach || "neutral"), dauer);
    clearTimeout(ruheUhr);
    ruheUhr = setTimeout(() => { if (ansicht !== "spiel" || (S && S.wirft)) gesicht("schlaeft"); }, 25000);
  }
  /* Augen wandern ab und zu */
  setInterval(() => {
    const p = root.querySelector(".ch-pupillen"); if (!p || ruhig) return;
    const dx = zufall([-1.5, 0, 0, 1.5]), dy = zufall([0, 0, 1]);
    p.setAttribute("transform", "translate(" + dx + " " + dy + ")");
  }, 2600);

  function blase(el, text, dauer) {
    el.textContent = text; el.classList.add("da");
    clearTimeout(el._uhr); if (dauer) el._uhr = setTimeout(() => el.classList.remove("da"), dauer);
  }
  const slSagt = (pool, dauer) => blase(slBlase, typeof pool === "string" ? pool : zufall(pool), dauer || 2600);

  function nscZeigen(n) {
    nscImg.hidden = false; nscImg.classList.remove("da"); nscImg.src = n.bild; nscImg.style.objectPosition = n.pos;
    nscImg.dataset.nsc = n.id;
    void nscImg.offsetWidth; requestAnimationFrame(() => nscImg.classList.add("da"));
    buehne.classList.remove("rauch"); void buehne.offsetWidth; buehne.classList.add("rauch");
  }

  /* =====================================================================
     PRACHT & KLANG – Stimmungslicht, Disco, Regenwolke, Grillen, Posaune …
     ===================================================================== */
  /* ---------- Klang: Samples aus klang/ + ein paar Synth-Effekte ---------- */
  const Ton = (() => {
    let ctx = null, master = null, musikBus = null, effektBus = null;
    let an = lies("imres-charme-ton", "1") === "1";
    const puffer = {}, laden = {};
    const FAM = {
      pos: [34, 37, 39, 41, 46, 50, 53, 60, 61, 63, 65],
      harfe: [52, 55, 59, 62, 65, 69, 72, 76, 79, 83, 86, 89],
      gitarre: [36, 39, 42, 45, 48, 51, 54, 57, 60, 63, 66, 69, 72, 75],
      aah: [57, 60, 63, 66, 69, 72, 75, 78],
      klar: [58, 62, 65, 70, 74, 77, 82],
      trp: [60, 63, 67, 70, 74, 77]
    };
    const EINZEL = ["bd", "shake", "crash", "k_grillen", "fx_0_dog_bark", "fx_ca_dice_shake_1", "fx_ca_dice_throw_1", "fx_fo_spring_01", "gong", "swell", "clave1", "snare1", "beckenroll"];
    function init() {
      if (ctx) { if (ctx.state === "suspended") ctx.resume(); return ctx; }
      const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return null;
      try { ctx = new AC(); } catch (_) { return null; }
      master = ctx.createGain(); master.gain.value = .85;
      const komp = ctx.createDynamicsCompressor(); master.connect(komp); komp.connect(ctx.destination);
      musikBus = ctx.createGain(); musikBus.gain.value = 0; musikBus.connect(master);
      effektBus = ctx.createGain(); effektBus.gain.value = 1; effektBus.connect(master);
      Object.keys(FAM).forEach(f => FAM[f].forEach(n => hole(f + "_" + n)));
      EINZEL.forEach(hole);
      return ctx;
    }
    function hole(name) {
      if (puffer[name]) return Promise.resolve(puffer[name]);
      if (!laden[name]) laden[name] = fetch("klang/" + name + ".mp3").then(r => r.ok ? r.arrayBuffer() : Promise.reject())
        .then(b => new Promise((ok, no) => ctx.decodeAudioData(b, ok, no))).then(b => (puffer[name] = b)).catch(() => null);
      return laden[name];
    }
    const jetzt = () => ctx ? ctx.currentTime : 0;
    function spiel(name, o) {
      o = o || {};
      if (!an || !ctx || !puffer[name]) return null;
      const q = ctx.createBufferSource(); q.buffer = puffer[name];
      q.playbackRate.value = o.rate || 1;
      if (o.detune) q.detune.value = o.detune;
      const g = ctx.createGain(), t0 = jetzt() + (o.zeit || 0), laut = o.laut == null ? .5 : o.laut;
      g.gain.setValueAtTime(o.ein ? 0 : laut, t0);
      if (o.ein) g.gain.linearRampToValueAtTime(laut, t0 + o.ein);
      let kette = q;
      if (o.filter) { const f = ctx.createBiquadFilter(); f.type = o.filter.typ || "lowpass"; f.frequency.value = o.filter.f; f.Q.value = o.filter.q || 1;
        if (o.filter.bis) { f.frequency.setValueAtTime(o.filter.f, t0); f.frequency.exponentialRampToValueAtTime(o.filter.bis, t0 + (o.filter.in || .3)); }
        kette.connect(f); kette = f; }
      if (o.vibrato) { const l = ctx.createOscillator(), lg = ctx.createGain(); l.frequency.value = o.vibrato.f || 5.5; lg.gain.value = o.vibrato.tiefe || 30; l.connect(lg); lg.connect(q.detune); l.start(t0 + (o.vibrato.ab || 0)); l.stop(t0 + (o.dauer || 3) + .5); }
      kette.connect(g); g.connect(o.bus || effektBus);
      q.start(t0, o.ab || 0);
      if (o.dauer) { g.gain.setValueAtTime(laut, t0 + o.dauer); g.gain.exponentialRampToValueAtTime(.001, t0 + o.dauer + (o.aus || .25)); q.stop(t0 + o.dauer + (o.aus || .25) + .05); }
      return { q, g };
    }
    function note(fam, midi, o) {
      const l = FAM[fam]; let best = l[0];
      l.forEach(n => { if (Math.abs(n - midi) < Math.abs(best - midi)) best = n; });
      o = Object.assign({}, o, { rate: Math.pow(2, (midi - best) / 12) });
      return spiel(fam + "_" + best, o);
    }
    /* reine Synth-Klänge */
    function osz(typ, f0, f1, zeit, dauer, laut, bus) {
      if (!an || !ctx) return;
      const o = ctx.createOscillator(), g = ctx.createGain(), t0 = jetzt() + zeit;
      o.type = typ; o.frequency.setValueAtTime(f0, t0); if (f1) o.frequency.exponentialRampToValueAtTime(f1, t0 + dauer);
      g.gain.setValueAtTime(.0001, t0); g.gain.exponentialRampToValueAtTime(laut, t0 + .02); g.gain.exponentialRampToValueAtTime(.0001, t0 + dauer);
      o.connect(g); g.connect(bus || effektBus); o.start(t0); o.stop(t0 + dauer + .05);
    }
    function rauschen(zeit, dauer, laut, f0, f1, q) {
      if (!an || !ctx) return;
      const n = Math.floor(ctx.sampleRate * dauer), b = ctx.createBuffer(1, n, ctx.sampleRate), d = b.getChannelData(0);
      for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
      const s = ctx.createBufferSource(); s.buffer = b;
      const f = ctx.createBiquadFilter(), g = ctx.createGain(), t0 = jetzt() + zeit;
      f.type = "bandpass"; f.Q.value = q || 2; f.frequency.setValueAtTime(f0, t0); if (f1) f.frequency.exponentialRampToValueAtTime(f1, t0 + dauer);
      g.gain.setValueAtTime(laut, t0); g.gain.exponentialRampToValueAtTime(.0001, t0 + dauer);
      s.connect(f); f.connect(g); g.connect(effektBus); s.start(t0);
    }
    /* ---------- Effekte ---------- */
    const fx = {
      harfeHoch(z, basis) { [0, 4, 7, 11, 14, 16, 19, 23, 26].forEach((s, i) => note("harfe", (basis || 62) + s, { zeit: (z || 0) + i * .045, laut: .32 })); },
      chor(z, akkord, laut, dauer) { (akkord || [62, 66, 69, 73]).forEach(m => note("aah", m, { zeit: z || 0, laut: laut || .22, ein: .35, dauer: dauer || 1.6, aus: .8 })); },
      kuss(z) { z = z || 0; rauschen(z, .09, .5, 2200, 900, 3); osz("sine", 520, 1300, z + .05, .16, .25); },
      kuesse() { [0, .22, .38].forEach(z => fx.kuss(z)); },
      herzschlag(n) { for (let i = 0; i < (n || 3); i++) { const z = i * (.62 - i * .06); osz("sine", 68, 38, z, .16, .7); osz("sine", 60, 34, z + .16, .14, .45); } },
      wuerfel() { spiel("fx_ca_dice_shake_1", { laut: .5 }); spiel("fx_ca_dice_throw_1", { zeit: .65, laut: .6 }); fx.herzschlag(3); },
      /* „Bow-chicka-wow-wow“: gedämpfte Gitarre durch ein Wah-Filter */
      wah(z) {
        z = z || 0;
        const rhythmus = [[0, 45, .22, 400, 2400], [.3, 52, .12, 900, 2800], [.42, 52, .12, 900, 2800], [.6, 47, .34, 350, 3000], [1.0, 47, .4, 350, 2600]];
        rhythmus.forEach(([t, m, d, f0, f1]) => note("gitarre", m, { zeit: z + t, laut: .55, dauer: d, aus: .12, filter: { typ: "bandpass", f: f0, bis: f1, in: d, q: 6 } }));
        spiel("bd", { zeit: z, laut: .35 }); spiel("bd", { zeit: z + .6, laut: .3 });
      },
      /* schmachtende Klarinette mit viel Vibrato (Kneipen-Saxofon für Arme) */
      schmacht(z) { z = z || 0; [[62, 0, .28], [65, .3, .28], [69, .6, .3], [67, .95, .9]].forEach(([m, t, d]) => note("klar", m, { zeit: z + t, laut: .42, dauer: d, aus: .3, vibrato: { f: 5.8, tiefe: 28, ab: .08 }, filter: { f: 2600 } })); },
      boing(z) { spiel("fx_fo_spring_01", { zeit: z || 0, laut: .55 }); },
      /* Wah-wah-wah-waaah */
      posaune(kurz) {
        const l = kurz ? [[53, 0, .32], [50, .38, .9]] : [[53, 0, .34], [52, .42, .34], [51, .84, .34], [50, 1.26, 1.5]];
        l.forEach(([m, t, d], i) => note("pos", m, { zeit: t, laut: .6, dauer: d, aus: .3, vibrato: i === l.length - 1 ? { f: 6, tiefe: 45, ab: .25 } : null }));
      },
      kratzer() { rauschen(0, .22, .6, 900, 3800, 3); rauschen(.2, .18, .5, 3000, 700, 3); },
      pfeifeRunter(z) { osz("sine", 1500, 260, z || 0, .7, .22); },
      fanfare(z) { z = z || 0; [[67, 0, .14], [67, .16, .14], [67, .32, .14], [72, .5, .7]].forEach(([m, t, d]) => note("trp", m, { zeit: z + t, laut: .45, dauer: d })); },
      /* Disco: zwei Takte vier auf den Boden */
      disco() {
        const b = .25;
        for (let i = 0; i < 8; i++) { spiel("bd", { zeit: i * b * 2, laut: .5 }); spiel("shake", { zeit: i * b * 2 + b, laut: .25 }); note("gitarre", i % 4 < 2 ? 38 : 43, { zeit: i * b * 2, laut: .5, dauer: .2 }); note("gitarre", i % 4 < 2 ? 50 : 55, { zeit: i * b * 2 + b, laut: .35, dauer: .14 }); }
        spiel("crash", { laut: .4 }); fx.chor(0, [69, 73, 76, 81], .26, 3.2); fx.fanfare(.1);
      },
      grillen(dauer) {
        const s = spiel("k_grillen", { laut: .55, ein: .8, ab: Math.random() * 30, dauer: Math.max(1, dauer - .8), aus: .8 });
        return s;
      },
      bellen() { spiel("fx_0_dog_bark", { laut: .6 }); },
      zauber() { spiel("swell", { laut: .4, dauer: 1.6, aus: .6 }); fx.harfeHoch(.1, 74); },
      gong() { spiel("gong", { laut: .5 }); },
      auftritt() { fx.harfeHoch(0, 60); fx.chor(.15, [60, 64, 67, 71], .14, 1.2); },
      klapper() { spiel("clave1", { laut: .4 }); spiel("clave1", { zeit: .18, laut: .3, rate: 1.2 }); }
    };
    /* ---------- Lounge-Musik: Bossa-Gitarre, Bass, Besen – und bei viel Liebe ein Chor ---------- */
    const AKK = [
      { b: 38, a: [53, 57, 60, 64] },  /* Dm9 */
      { b: 43, a: [53, 57, 59, 64] },  /* G13 */
      { b: 36, a: [52, 55, 59, 62] },  /* Cmaj9 */
      { b: 45, a: [55, 58, 61, 64] }   /* A7b9 */
    ];
    const SCHLAG = .68;
    let musikAn = false, naechsterTakt = 0, takt = 0, uhr = 0, liebe = 0;
    function taktPlanen(t0, i) {
      const A = AKK[i % 4], mb = musikBus;
      const n = (fam, m, z, o) => note(fam, m, Object.assign({ zeit: z - jetzt(), bus: mb }, o));
      n("gitarre", A.b, t0, { laut: .5, dauer: SCHLAG * 1.4, aus: .3 });
      n("gitarre", A.b + 7, t0 + SCHLAG * 2, { laut: .38, dauer: SCHLAG * .9, aus: .3 });
      n("gitarre", A.b, t0 + SCHLAG * 3.5, { laut: .3, dauer: SCHLAG * .4 });
      [0, 1.5, 2.5].forEach((s, k) => A.a.forEach((m, j) => n("gitarre", m, t0 + SCHLAG * s + j * .012, { laut: k === 0 ? .17 : .12, dauer: SCHLAG * (k === 0 ? 1.2 : .7), aus: .2, filter: { f: 2400 } })));
      for (let s = 0; s < 4; s++) spiel("shake", { zeit: t0 + SCHLAG * s + (s % 2 ? .04 : 0) - jetzt(), laut: s % 2 ? .1 : .05, bus: mb });
      if (liebe >= 2) A.a.forEach(m => n("aah", m + 12, t0, { laut: liebe >= 3 ? .09 : .06, ein: .5, dauer: SCHLAG * 3.6, aus: .5 }));
      if (liebe >= 1 && i % 2 === 1) [0, .5, 1].forEach((s, k) => n("klar", A.a[(k + i) % 4] + 12, t0 + SCHLAG * (2 + s), { laut: .1, dauer: SCHLAG * .45, vibrato: { f: 5.5, tiefe: 22 } }));
    }
    function ticken() {
      if (!musikAn || !ctx) return;
      while (naechsterTakt < jetzt() + .6) { taktPlanen(naechsterTakt, takt++); naechsterTakt += SCHLAG * 4; }
    }
    function musik(soll) {
      if (!ctx) return;
      if (soll && an) {
        if (!musikAn) { musikAn = true; naechsterTakt = jetzt() + .15; clearInterval(uhr); uhr = setInterval(ticken, 150); ticken(); }
        musikBus.gain.cancelScheduledValues(jetzt()); musikBus.gain.setTargetAtTime(.75, jetzt(), .4);
      } else if (musikAn) {
        musikBus.gain.cancelScheduledValues(jetzt()); musikBus.gain.setTargetAtTime(0, jetzt(), .15);
        musikAn = false; clearInterval(uhr);
      }
    }
    /* Musik bricht ab (peinliche Stille) und kommt wieder */
    function stille(dauer) {
      if (!ctx || !musikAn) return;
      musikBus.gain.cancelScheduledValues(jetzt()); musikBus.gain.setValueAtTime(musikBus.gain.value, jetzt());
      musikBus.gain.linearRampToValueAtTime(0, jetzt() + .08);
      musikBus.gain.setValueAtTime(0, jetzt() + dauer); musikBus.gain.linearRampToValueAtTime(.75, jetzt() + dauer + 1.2);
    }
    return {
      init, fx, musik, stille,
      liebe: n => { liebe = n; },
      an: () => an,
      schalten() { an = !an; schreib("imres-charme-ton", an ? "1" : "0"); if (!an) musik(false); return an; }
    };
  })();
  const tonFx = (name, ...a) => { try { if (Ton.an()) Ton.fx[name](...a); } catch (_) {} };

  /* ---------- Bild: Stimmungslicht, Disco, Regen, Steppenläufer, Stempel ---------- */
  const pracht = document.createElement("div");
  pracht.className = "ch-pracht";
  pracht.innerHTML =
    '<div class="ch-funken">' + Array.from({ length: 18 }, (_, i) => '<i style="--x:' + (Math.random() * 100).toFixed(1) + "%;--y:" + (20 + Math.random() * 70).toFixed(1) + "%;--d:" + (Math.random() * 9).toFixed(2) + "s;--s:" + (6 + Math.random() * 7).toFixed(1) + 's"></i>').join("") + "</div>" +
    '<div class="ch-stimmung"></div><div class="ch-spots"></div>' +
    '<div class="ch-disco"><b></b></div>' +
    '<div class="ch-wolke">☁️<span></span></div>' +
    '<div class="ch-busch"></div>' +
    '<div class="ch-stempel"></div>';
  buehne.insertBefore(pracht, buehne.querySelector(".ch-sl-blase"));
  /* die Funken liegen hinter dem NSC, Licht & Effekte davor */
  const funken = pracht.querySelector(".ch-funken");
  buehne.insertBefore(funken, buehne.querySelector(".ch-zimmer").nextSibling);
  const stempelEl = pracht.querySelector(".ch-stempel");
  let moodUhr = 0;
  function stimmung(mood, dauer) {
    buehne.dataset.mood = mood;
    clearTimeout(moodUhr);
    if (dauer) moodUhr = setTimeout(() => { if (buehne.dataset.mood === mood) buehne.dataset.mood = ""; }, dauer);
  }
  function stempel(text, art) {
    stempelEl.textContent = text; stempelEl.className = "ch-stempel " + art;
    void stempelEl.offsetWidth; stempelEl.classList.add("los");
  }
  function flug(zeichen, n, art) {
    if (ruhig) return;
    for (let i = 0; i < (n || 1); i++) {
      const f = document.createElement("span"); f.className = "ch-flug " + (art || "werfen"); f.textContent = Array.isArray(zeichen) ? zufall(zeichen) : zeichen;
      f.style.setProperty("--x", (Math.random() * 100).toFixed(0) + "%"); f.style.setProperty("--r", (Math.random() * 720 - 360).toFixed(0) + "deg");
      f.style.animationDelay = (i * .07 + Math.random() * .25).toFixed(2) + "s"; f.style.fontSize = (16 + Math.random() * 18).toFixed(0) + "px";
      f.style.setProperty("--bw", buehne.clientWidth + "px"); f.style.setProperty("--bh", buehne.clientHeight + "px");
      buehne.appendChild(f); setTimeout(() => f.remove(), 3600);
    }
  }
  function nscReagiert(klasse, dauer) {
    nscImg.classList.remove("verliebt", "kalt", "hin");
    void nscImg.offsetWidth; nscImg.classList.add(klasse);
    setTimeout(() => nscImg.classList.remove(klasse), dauer || 1800);
  }
  function liebeSetzen() {
    const l = S && !S.ende && ansicht === "spiel" ? S.herzen : 0;
    buehne.style.setProperty("--liebe", (l / 3).toFixed(2)); buehne.dataset.liebe = l; Ton.liebe(l);
  }
  /* ---------- Hooks in den Spielablauf ---------- */
  const SPRUCH_FLUG = { charmant: "🌹", kuehn: "💋", absurd: ["🐟", "🧀", "🦆", "🥔"], passend: "✨" };
  const effekte = {
    start() { Ton.init(); tonFx("auftritt"); Ton.musik(true); },
    nsc() { tonFx("auftritt"); stimmung("auftritt", 1200); liebeSetzen(); },
    spruch(art) {
      flug(SPRUCH_FLUG[art], art === "absurd" ? 3 : 1, "werfen");
      if (art === "kuehn") tonFx("wah"); else if (art === "absurd") { tonFx("boing"); tonFx("klapper"); } else if (art === "passend") tonFx("harfeHoch", 0, 67); else tonFx("schmacht");
    },
    wurf() { tonFx("wuerfel"); buehne.classList.add("spannung"); },
    peinlich(dauer) {
      Ton.stille(dauer + .6); tonFx("grillen", dauer + .4); stimmung("peinlich", dauer * 1000);
      const busch = pracht.querySelector(".ch-busch"); busch.classList.remove("rollt"); busch.style.setProperty("--bw", buehne.clientWidth + "px"); void busch.offsetWidth; busch.classList.add("rollt");
      busch.style.animationDuration = Math.max(2.5, dauer - .5) + "s";
    },
    ergebnis(art2) {
      buehne.classList.remove("spannung"); liebeSetzen();
      const T = sprache() === "en";
      if (art2 === "krit") { stimmung("disco", 3600); stempel(T ? "NAT 20!" : "NATÜRLICHE 20!", "krit"); tonFx("disco"); flug(["✨", "💖", "⭐", "💋"], 22, "regen"); nscReagiert("verliebt", 3000); }
      else if (art2 === "patzer") { stimmung("patzer", 3000); stempel(T ? "CRITICAL FAIL" : "PATZER!", "patzer"); tonFx("kratzer"); setTimeout(() => tonFx("posaune"), 300); nscReagiert("kalt", 1500); }
      else if (art2 === "erfolg") { stimmung("romantik", 2200); tonFx("kuss"); tonFx("harfeHoch", .1); tonFx("chor", .15, null, .16, 1.4); flug(["💗", "💕", "💖"], 6, "aufsteigen"); nscReagiert("verliebt"); }
      else { stimmung("frost", 1600); tonFx("posaune", true); nscReagiert("kalt", 900); }
    },
    ende(gewonnen) {
      const T = sprache() === "en";
      if (gewonnen) { stimmung("erobert", 4200); stempel(T ? "CONQUERED ♥" : "EROBERT ♥", "erobert"); tonFx("wah"); tonFx("kuesse"); tonFx("chor", .1, [62, 66, 69, 74], .24, 2.6); setTimeout(() => tonFx("wah"), 1300);
        flug(["🌹", "💋", "💖", "💘", "🌸"], 26, "regen"); nscReagiert("verliebt", 3500); }
      else { stimmung("korb", 3200); stempel(T ? "REJECTED" : "KORB!", "korb"); flug("🧺", 1, "korb"); tonFx("pfeifeRunter"); setTimeout(() => tonFx("boing"), 700); setTimeout(() => tonFx("posaune", true), 900); }
    },
    joker(k) {
      if (k === "rex") { tonFx("bellen"); flug(["🐕", "🦴", "💗"], 8, "aufsteigen"); stimmung("romantik", 1800); }
      if (k === "floete") { tonFx("zauber"); stimmung("zauber", 2200); flug(["✨", "🌟", "👹"], 10, "aufsteigen"); }
      if (k === "echo") { tonFx("klapper"); flug(["❓", "🤷"], 4, "aufsteigen"); }
      liebeSetzen();
    },
    schluss(zu) {
      Ton.musik(false); liebeSetzen();
      if (zu) { tonFx("gong"); stimmung("patzer", 2500); } else { tonFx("disco"); stimmung("erobert", 3000); }
    }
  };
  /* Musik nur, solange das Spiel läuft und zu sehen ist */
  if ("IntersectionObserver" in window) new IntersectionObserver(e => { const sicht = e[0].isIntersecting; Ton.musik(sicht && ansicht === "spiel" && !!S && !S.ende); }).observe(buehne);
  document.addEventListener("visibilitychange", () => { if (document.hidden) Ton.musik(false); else if (ansicht === "spiel" && S && !S.ende) Ton.musik(true); });

  /* ---------- Ablauf ---------- */
  function neueSitzung() {
    S = { reihe: NSC.slice(), i: 0, geduld: 10, herzenGesamt: 0, erobert: 0, joker: { echo: 1, rex: 1, floete: 1 }, vorteil: false, bonus: false, ergebnisse: [] };
    ansicht = "spiel"; nscStart();
  }
  function nscStart() {
    const n = S.reihe[S.i];
    S.nsc = n; S.herzen = 0; S.zuege = 4; S.fertig = null; S.letzt = null;
    S.angebot = spruchAngebot(n);
    nscZeigen(n); effekte.nsc();
    gesicht("grinsen", 1400);
    slSagt(t().sl.start, 2000);
    setTimeout(() => { if (S && S.nsc === n) blase(nscBlase, t().nsc[n.id].intro, 0); }, 500);
    zeichnen();
  }
  /* drei Sprüche: einer charmant, einer kühn, einer absurd – manchmal statt charmant der passende */
  function spruchAngebot(n) {
    const T = t().nsc[n.id], arten = ["charmant", "kuehn", "absurd"];
    if (Math.random() < .45) arten[0] = "passend";
    return arten.map(art => ({ art, idx: Math.floor(Math.random() * T[art].length) }));
  }
  const sgFuer = (art, n) => art === "kuehn" ? n.sg + 4 : art === "passend" ? n.sg - 4 : n.sg;

  function wuerfeln(art, idx) {
    if (!S || S.fertig || S.wirft) return;
    const n = S.nsc, T = t(), NT = T.nsc[n.id];
    S.wirft = true;
    blase(nscBlase, "Barradin: " + NT[art][idx % NT[art].length], 0);
    nscBlase.classList.add("barradin");
    effekte.spruch(art);
    if (art === "absurd") { gesicht("facepalm", 1500); slSagt(T.sl.absurd, 1800); S.geduld = Math.max(0, S.geduld - 1); }
    else gesicht("notiert");
    zeichnen();
    /* Manchmal wird es unangenehm still, bevor überhaupt gewürfelt wird */
    const p = art === "absurd" ? .55 : art === "kuehn" ? .38 : .2;
    if (!S.peinlichZuletzt && Math.random() < p) { S.peinlichZuletzt = true; peinlichePause(() => rollen(art)); }
    else { S.peinlichZuletzt = false; rollen(art); }
  }
  function peinlichePause(weiterMit) {
    const n = S.nsc, T = t(), dauer = ruhig ? 1800 : 4200 + Math.random() * 3200;
    setTimeout(() => {
      if (!S || S.nsc !== n) return;
      gesicht("starr"); sl.classList.add("starr"); effekte.peinlich(dauer / 1000);
      blase(slBlase, "…", 0); slBlase.classList.add("punkte");
    }, 900);
    setTimeout(() => { if (S && S.nsc === n) { nscBlase.classList.remove("barradin"); blase(nscBlase, "…", 0); nscBlase.classList.add("punkte"); } }, 2100);
    setTimeout(() => { if (S && S.nsc === n) { slBlase.classList.remove("punkte"); blase(slBlase, zufall(T.sl.peinlich), 0); } }, 3300);
    setTimeout(() => {
      sl.classList.remove("starr"); slBlase.classList.remove("punkte"); nscBlase.classList.remove("punkte");
      if (S && S.nsc === n) { gesicht("genervt"); weiterMit(); }
    }, dauer + 900);
  }
  function rollen(art) {
    /* Würfel rollt */
    const w1 = 1 + Math.floor(Math.random() * 20), w2 = 1 + Math.floor(Math.random() * 20);
    const w = S.vorteil ? Math.max(w1, w2) : w1; const vort = S.vorteil; S.vorteil = false;
    wuerfel.hidden = false; wuerfel.className = "ch-wuerfel rollt";
    const zahl = wuerfel.querySelector("span");
    const flimmer = setInterval(() => { zahl.textContent = 1 + Math.floor(Math.random() * 20); }, 60);
    effekte.wurf();
    setTimeout(() => {
      clearInterval(flimmer); zahl.textContent = w;
      wuerfel.className = "ch-wuerfel" + (w === 20 ? " krit" : w === 1 ? " patzer" : "");
      auswerten(art, w, vort ? [w1, w2] : null);
    }, ruhig ? 200 : 1500);
  }
  function auswerten(art, w, beide) {
    const n = S.nsc, T = t(), NT = T.nsc[n.id], sg = sgFuer(art, n), summe = w + CHA;
    let herz = 0, art2;
    if (w === 20) { herz = 3; art2 = "krit"; }
    else if (w === 1) { herz = -1; art2 = "patzer"; S.geduld = Math.max(0, S.geduld - 2); }
    else if (art === "absurd") { if (w >= 10) { herz = 1; art2 = "erfolg"; } else { art2 = "misserfolg"; S.geduld = Math.max(0, S.geduld - 1); } }
    else if (summe >= sg) { herz = art === "kuehn" ? 2 : 1; art2 = "erfolg"; }
    else { art2 = "misserfolg"; if (art === "kuehn") S.geduld = Math.max(0, S.geduld - 1); }
    S.herzen = Math.max(0, Math.min(3, S.herzen + herz));
    S.zuege--;
    S.letzt = { art2, w, summe, sg: art === "absurd" ? null : sg, beide };
    nscBlase.classList.remove("barradin");
    effekte.ergebnis(art2);
    if (art2 === "krit") { gesicht("schock", 1100, "stolz"); slSagt(T.sl.krit); blase(nscBlase, NT.krit, 0); }
    else if (art2 === "patzer") { gesicht("facepalm", 1300, "lachen"); slSagt(T.sl.patzer); blase(nscBlase, NT.patzer, 0); }
    else if (art2 === "erfolg") { gesicht(S.herzen >= 3 ? "errötet" : "grinsen", 2400); slSagt(T.sl.erfolg); blase(nscBlase, zufall(NT.ja), 0); }
    else {
      gesicht(summe >= sg - 3 ? "notiert" : "genervt", 2400); slSagt(T.sl.misserfolg);
      /* … und manchmal hängt die Antwort unangenehm lange in der Luft */
      if (S.herzen < 3 && S.zuege > 0 && S.geduld > 0 && Math.random() < .35 && !ruhig) {
        const nn = S.nsc; blase(nscBlase, zufall(T.sl.nachhall), 0); nscBlase.classList.add("punkte");
        setTimeout(() => { if (S && S.nsc === nn && !S.wirft) { nscBlase.classList.remove("punkte"); blase(nscBlase, zufall(NT.nein), 0); } }, 2600);
      } else blase(nscBlase, zufall(NT.nein), 0);
    }
    S.wirft = false;
    if (S.herzen >= 3) nscEnde(true);
    else if (S.zuege <= 0 || S.geduld <= 0) nscEnde(false);
    else S.angebot = spruchAngebot(n);
    zeichnen();
  }
  function nscEnde(gewonnen) {
    const n = S.nsc, T = t(), NT = T.nsc[n.id];
    S.fertig = gewonnen ? "erobert" : "korb";
    if (gewonnen) { S.erobert++; S.herzenGesamt += 3 + Math.max(0, S.zuege); }
    else { S.herzenGesamt += S.herzen; S.geduld = Math.max(0, S.geduld - 1); }
    S.ergebnisse.push({ id: n.id, ok: gewonnen });
    const buch = buchLesen(); if (gewonnen || !buch[n.id]) buch[n.id] = gewonnen ? "erobert" : "korb"; schreib("imres-charme-buch", JSON.stringify(buch));
    setTimeout(() => {
      if (!S || S.nsc !== n) return;
      blase(nscBlase, gewonnen ? NT.sieg : NT.verloren, 0);
      slSagt(gewonnen ? T.sl.erobert : T.sl.korb, 2800);
      gesicht(gewonnen ? "schwitzt" : "lachen", 2600);
      if (gewonnen) herzRegen();
      effekte.ende(gewonnen);
      zeichnen();
    }, 1500);
  }
  function weiter() {
    if (!S) return;
    if (S.geduld <= 0) return sitzungEnde(true);
    S.i++;
    if (S.i >= S.reihe.length && !S.bonus && S.erobert >= 6) { S.bonus = true; S.reihe.push(BONUS); slSagt(t().bonusRuf, 3600); }
    if (S.i >= S.reihe.length) return sitzungEnde(false);
    nscStart();
  }
  function sitzungEnde(zu) {
    S.ende = zu ? "schirm" : "fertig";
    const alt = rekord(); S.neuRekord = S.herzenGesamt > alt; if (S.neuRekord) schreib("imres-charme-rekord", String(S.herzenGesamt));
    nscImg.classList.remove("da");
    nscBlase.classList.remove("da");
    effekte.schluss(zu);
    if (zu) { buehne.classList.add("zu"); gesicht("genervt"); slSagt(t().sl.schirm, 4000); }
    else gesicht("stolz", 3000, "grinsen");
    zeichnen();
  }
  function joker(k) {
    if (!S || S.fertig || S.wirft || !S.joker[k]) return;
    const T = t(); S.joker[k] = 0;
    if (k === "echo") { S.zuege++; S.angebot = spruchAngebot(S.nsc); gesicht("genervt", 2200); slSagt(T.sl.echo); blase(nscBlase, sprache() === "en" ? "Echo: \"Do you know Gundren?\" – \"…Who?\"" : "Echo: „Kennst du Gundren?“ – „…Wen?“", 0); S.geduld = Math.max(0, S.geduld - 1); }
    if (k === "rex") { S.herzen = Math.min(3, S.herzen + 1); gesicht("lachen", 2200); slSagt(T.sl.rex); blase(nscBlase, sprache() === "en" ? "Rex wags his tail. Resistance is futile." : "Rex wedelt. Widerstand ist zwecklos.", 0); if (S.herzen >= 3) nscEnde(true); }
    if (k === "floete") { S.vorteil = true; gesicht("schock", 1400, "genervt"); slSagt(T.sl.floete); blase(nscBlase, sprache() === "en" ? "A tiny Demogorgon appears above the flute. Very impressive." : "Über der Flöte erscheint ein winziger Demogorgon. Sehr beeindruckend.", 0); S.geduld = Math.max(0, S.geduld - 1); }
    effekte.joker(k);
    if (S.geduld <= 0 && !S.fertig) nscEnde(false);
    zeichnen();
  }
  function herzRegen() {
    if (ruhig) return;
    for (let i = 0; i < 14; i++) {
      const h = document.createElement("span"); h.className = "ch-herz-flug"; h.textContent = "♥";
      h.style.left = (15 + Math.random() * 40) + "%"; h.style.animationDelay = (Math.random() * .6) + "s"; h.style.fontSize = (12 + Math.random() * 16) + "px";
      buehne.appendChild(h); setTimeout(() => h.remove(), 2200);
    }
  }

  /* ---------- Zeichnen ---------- */
  function zeichnen() {
    const T = t();
    $(".ch-label").textContent = T.label; $(".ch-titel").textContent = T.titel; $(".ch-text").textContent = T.text;
    const kopf = $(".ch-kopfzeile");
    kopf.hidden = ansicht !== "spiel";
    if (ansicht === "spiel" && S) {
      $(".ch-geduld-txt").textContent = T.geduld;
      const tk = $(".ch-ton"); tk.textContent = Ton.an() ? "🔊 " + (sprache() === "en" ? "Sound" : "Ton") : "🔇"; tk.setAttribute("aria-pressed", Ton.an());
      liebeSetzen();
      const bar = $(".ch-geduld-bar i"); bar.style.width = (S.geduld * 10) + "%"; bar.parentNode.classList.toggle("knapp", S.geduld <= 3);
      $(".ch-herzen").innerHTML = [0, 1, 2].map(i => '<span class="' + (i < S.herzen ? "voll" : "") + '">♥</span>').join("");
    }
    buehne.classList.toggle("laeuft", ansicht === "spiel" && !!S && !S.ende);
    root.classList.toggle("ch-laeuft", ansicht === "spiel" && !!S);
    if (ansicht === "buch") return buchZeichnen();
    if (ansicht === "start" || !S) {
      buehne.classList.remove("zu"); nscImg.hidden = true; wuerfel.hidden = true; nscBlase.classList.remove("da");
      const r = rekord();
      tafel.innerHTML = '<div class="ch-knoepfe"><button type="button" class="tav-knopf ch-haupt" data-tun="start">' + esc(T.start) + "</button>" +
        '<button type="button" class="tav-knopf" data-tun="buch">' + esc(T.buch) + "</button></div>" +
        (r ? '<p class="ch-klein">' + esc(T.rekord(r)) + "</p>" : "");
      return;
    }
    const n = S.nsc, NT = T.nsc[n.id];
    if (S.ende) {
      wuerfel.hidden = true;
      tafel.innerHTML = '<p class="ch-ergebnis">' + esc(S.ende === "schirm" ? T.schirmZu : T.ende) + "</p>" +
        '<p class="ch-bilanz">' + esc(T.bilanz(S.erobert, S.ergebnisse.length, S.herzenGesamt)) + "</p>" +
        '<p class="ch-klein">' + esc(S.neuRekord ? T.neuRekord : T.rekord(rekord())) + "</p>" +
        '<div class="ch-reihe">' + S.ergebnisse.map(e => '<span class="' + (e.ok ? "ok" : "") + '" title="' + esc(T.nsc[e.id].name) + '"><img src="' + esc((e.id === "demogorgon" ? BONUS : NSC.find(x => x.id === e.id)).bild) + '" alt="">' + (e.ok ? "♥" : "✗") + "</span>").join("") + "</div>" +
        '<div class="ch-knoepfe"><button type="button" class="tav-knopf ch-haupt" data-tun="start">' + esc(T.nochmal) + '</button><button type="button" class="tav-knopf" data-tun="buch">' + esc(T.buch) + "</button></div>";
      return;
    }
    let html = '<div class="ch-nsc-kopf"><b>' + esc(NT.name) + "</b>" + (S.fertig ? "" : '<em>' + esc(T.sprueche(S.zuege)) + "</em>") + "<span>" + esc(T.aufgabe) + ": " + esc(NT.aufgabe) + "</span></div>";
    if (!S.letzt) html += '<p class="ch-wurf leer">&nbsp;</p>';
    if (S.letzt) {
      const L = S.letzt;
      html += '<p class="ch-wurf ' + L.art2 + '">' + esc(L.art2 === "krit" ? T.krit : L.art2 === "patzer" ? T.patzer : L.art2 === "erfolg" ? T.erfolg : T.misserfolg) +
        " <small>" + esc(T.wurf(L.beide ? L.beide.join("/") + " → " + L.w : L.w, CHA, L.summe)) + (L.sg ? " " + esc(T.gegen(L.sg)) : "") + "</small></p>";
    }
    if (S.fertig) {
      html += '<p class="ch-ergebnis ' + S.fertig + '">' + esc(S.fertig === "erobert" ? T.erobert : T.korb) + "</p>" +
        '<div class="ch-knoepfe"><button type="button" class="tav-knopf ch-haupt" data-tun="weiter">' + esc(S.geduld <= 0 || S.i >= S.reihe.length - 1 && !(S.erobert >= 6 && !S.bonus) ? T.ende : T.weiter) + "</button></div>";
    } else {
      html += '<div class="ch-sprueche">' + S.angebot.map(a => '<button type="button" class="ch-spruch art-' + a.art + '" data-art="' + a.art + '" data-idx="' + a.idx + '"' + (S.wirft ? " disabled" : "") + ">" +
          '<span class="ch-art">' + esc(T.arten[a.art]) + " · " + esc(T.artInfo[a.art](sgFuer(a.art, n))) + "</span>" + esc(NT[a.art][a.idx]) + "</button>").join("") + "</div>" +
        '<div class="ch-joker">' + ["echo", "rex", "floete"].map(k => '<button type="button" class="ch-jk" data-joker="' + k + '"' + (S.joker[k] && !S.wirft ? "" : " disabled") + ' title="' + esc(T.jokerInfo[k]) + '">' +
          '<span class="jk-lang">' + esc(T.joker[k]) + '</span><span class="jk-kurz">' + esc(T.jokerKurz[k]) + "</span><small>" + esc(T.jokerInfo[k]) + "</small></button>").join("") + "</div>";
    }
    tafel.innerHTML = html;
    passen();
  }
  /* Vollbild: Bühne so groß wie möglich, Tafel bleibt darunter ganz sichtbar */
  function passen() {
    if (!root.classList.contains("tav-voll")) { buehne.style.height = buehne.style.width = ""; return; }
    const cs = getComputedStyle(root), innen = root.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
    const breite = root.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    const tafelH = tafel.offsetHeight + parseFloat(getComputedStyle(tafel).marginTop || 0);
    const h = Math.max(150, Math.floor(innen - tafelH - 4));
    buehne.style.height = h + "px";
    buehne.style.width = Math.min(breite, Math.round(h * 1.75), 1100) + "px";
  }
  window.addEventListener("resize", () => requestAnimationFrame(passen));
  new MutationObserver(() => requestAnimationFrame(passen)).observe(root, { attributes: true, attributeFilter: ["class"] });
  function buchZeichnen() {
    const T = t(), B = buchLesen(), alle = NSC.concat([BONUS]);
    nscImg.hidden = true; wuerfel.hidden = true; nscBlase.classList.remove("da");
    tafel.innerHTML = '<h4 class="ch-buch-titel">' + esc(T.buchTitel) + '</h4><p class="ch-klein">' + esc(T.buchText) + "</p>" +
      '<div class="ch-buch">' + alle.map(n => {
        const st = B[n.id] || "offen", geheim = n.id === "demogorgon" && st === "offen";
        return '<div class="ch-seite ' + st + '">' + (geheim ? '<span class="ch-geheim">?</span>' : '<img src="' + esc(n.bild) + '" alt="">') +
          "<b>" + esc(geheim ? "???" : T.nsc[n.id].name) + "</b><small>" + esc(T.buchStand[st]) + "</small></div>";
      }).join("") + "</div>" +
      '<div class="ch-knoepfe"><button type="button" class="tav-knopf" data-tun="zurueck">' + esc(T.zurueck) + "</button></div>";
  }

  /* ---------- Bedienung ---------- */
  root.addEventListener("click", e => {
    const b = e.target.closest("button"); if (!b || b.disabled) return;
    if (b.closest(".tav-voll-knopf")) return;
    if (b.dataset.art) { wuerfeln(b.dataset.art, +b.dataset.idx); return; }
    if (b.dataset.joker) { joker(b.dataset.joker); return; }
    const tun = b.dataset.tun;
    if (tun === "start") { buehne.classList.remove("zu"); effekte.start(); neueSitzung(); einpassen(); }
    else if (tun === "ton") { Ton.init(); const an = Ton.schalten(); if (an && ansicht === "spiel" && S && !S.ende) Ton.musik(true); zeichnen(); }
    else if (tun === "weiter") weiter();
    else if (tun === "buch") { ansicht = "buch"; Ton.musik(false); zeichnen(); }
    else if (tun === "zurueck") { ansicht = S && !S.ende ? "spiel" : "start"; if (ansicht === "start") S = null; else Ton.musik(true); zeichnen(); }
  });
  /* Handy: Bühne direkt unter die Kopfleiste schieben, damit alles auf einen Bildschirm passt */
  function einpassen() {
    if (root.classList.contains("tav-voll") || window.innerWidth > 700) return;
    const kopf = document.querySelector("header.top");
    root.style.setProperty("--ch-oben", ((kopf ? kopf.getBoundingClientRect().height : 56) + 6) + "px");
    requestAnimationFrame(() => buehne.scrollIntoView({ block: "start", behavior: ruhig ? "auto" : "smooth" }));
  }
  /* Klick auf den Spielleiter: er schaut kurz auf */
  buehne.addEventListener("click", e => { if (e.target.closest(".ch-zimmer")) gesicht(zufall(["grinsen", "schock", "errötet", "genervt"]), 1200); });

  /* ---------- Aussehen ---------- */
  const css = document.createElement("style");
  css.textContent = `
.charme .ch-buehne { position: relative; width: 100%; aspect-ratio: 16 / 10; overflow: hidden; border: 1px solid var(--line); background: #151017; user-select: none; -webkit-user-select: none; }

.ch-zimmer, .ch-vorne { position: absolute; inset: 0; width: 100%; height: 100%; }
.ch-vorne { pointer-events: none; z-index: 3; }
.ch-zimmer { z-index: 1; cursor: pointer; }
/* Spielleiter: atmen, blinzeln, Ausdrücke */
.ch-sl .ch-koerper { animation: chAtmen 4.2s ease-in-out infinite; transform-box: fill-box; transform-origin: 50% 100%; }
@keyframes chAtmen { 50% { transform: translateY(1.5px) scaleY(.995); } }
.ch-sl.hops .ch-kopf { animation: chHops .35s ease; transform-box: fill-box; transform-origin: 50% 100%; }
@keyframes chHops { 40% { transform: translateY(-3px) rotate(-2deg); } }
.ch-sl .a-offen { animation: chBlinzeln 5.5s infinite; transform-box: fill-box; transform-origin: 50% 50%; }
@keyframes chBlinzeln { 0%, 95%, 100% { transform: scaleY(1); } 97% { transform: scaleY(.1); } }
.ch-pupillen { transition: transform .4s ease; }
.ch-brauen > *, .ch-augen > *, .ch-mund > *, .ch-haende > * { display: none; }
.ch-sl[data-b="normal"] .b-normal, .ch-sl[data-b="hoch"] .b-hoch, .ch-sl[data-b="boese"] .b-boese, .ch-sl[data-b="muede"] .b-muede,
.ch-sl[data-a="offen"] .a-offen, .ch-sl[data-a="gross"] .a-gross, .ch-sl[data-a="zu"] .a-zu, .ch-sl[data-a="halb"] .a-halb, .ch-sl[data-a="unten"] .a-unten,
.ch-sl[data-m="neutral"] .m-neutral, .ch-sl[data-m="grinsen"] .m-grinsen, .ch-sl[data-m="lachen"] .m-lachen, .ch-sl[data-m="o"] .m-o, .ch-sl[data-m="schief"] .m-schief, .ch-sl[data-m="traurig"] .m-traurig,
.ch-sl[data-h="ruhe"] .h-ruhe, .ch-sl[data-h="facepalm"] .h-facepalm, .ch-sl[data-h="daumen"] .h-daumen, .ch-sl[data-h="stift"] .h-stift { display: inline; }
.ch-roete, .ch-zzz, .ch-schweiss { display: none; }
.ch-sl[data-h="facepalm"] .arm-r, .ch-sl[data-h="daumen"] .arm-r { display: none; }
.ch-sl.starr .a-offen { animation: none; }
.ch-sl.starr .ch-pupillen { transform: none !important; }
.ch-sl.starr .ch-koerper { animation-play-state: paused; }
.ch-sl-blase.punkte, .ch-nsc-blase.punkte { font-style: normal; letter-spacing: .25em; animation: chPunkte 1.4s ease-in-out infinite; }
@keyframes chPunkte { 50% { opacity: .45; } }
.ch-sl.rot .ch-roete, .ch-sl.zzz .ch-zzz, .ch-sl.schweiss .ch-schweiss { display: inline; }
.ch-sl.zzz .ch-zzz { animation: chZzz 2s ease-in-out infinite; }
@keyframes chZzz { 50% { transform: translateY(-4px); opacity: .6; } }
.ch-sl[data-m="lachen"] .ch-kopf { animation: chLachen .5s ease-in-out 3; transform-box: fill-box; transform-origin: 50% 100%; }
@keyframes chLachen { 50% { transform: rotate(3deg) translateY(-1px); } }
/* Schirm zu */
.ch-buehne.zu .ch-schirm { transform: translateY(26px) scaleY(.2); transform-origin: 50% 100%; transform-box: fill-box; transition: transform .6s ease; }
/* NSC erscheint vor dem Spielleiter */
.ch-nsc { position: absolute; z-index: 4; left: 3%; bottom: 4%; height: 82%; max-width: 46%; object-fit: contain; object-position: 50% 100%;
  filter: drop-shadow(0 0 18px rgba(255,210,122,.25)) drop-shadow(0 10px 18px rgba(0,0,0,.6)); opacity: 0; transform: translateY(12%) scale(.9); transition: opacity .5s ease, transform .6s cubic-bezier(.2,1.3,.4,1); pointer-events: none; }
.ch-nsc.da { opacity: 1; transform: none; }
.ch-nsc[data-nsc="themberchaud"], .ch-nsc[data-nsc="demogorgon"] { height: 92%; max-width: 55%; left: 0; }
.ch-nsc[data-nsc="buergermeister"] { height: 58%; }
.ch-buehne.rauch::after { content: ""; position: absolute; z-index: 5; left: 2%; bottom: 0; width: 46%; height: 70%; pointer-events: none;
  background: radial-gradient(closest-side, rgba(235,226,204,.45), transparent); animation: chRauch .9s ease-out forwards; }
@keyframes chRauch { from { opacity: 1; transform: scale(.6); } to { opacity: 0; transform: scale(1.4); } }
/* Sprechblasen */
.ch-nsc-blase, .ch-sl-blase { position: absolute; z-index: 6; max-width: 46%; padding: .45rem .7rem; font-size: clamp(.72rem, 2.3vw, .92rem); line-height: 1.3;
  border-radius: 10px; opacity: 0; transform: translateY(6px); transition: opacity .3s, transform .3s; pointer-events: none; }
.ch-nsc-blase { left: 3%; top: 4%; background: rgba(240,230,210,.95); color: #1d1610; box-shadow: 0 6px 18px rgba(0,0,0,.5); }
.ch-nsc-blase.barradin { background: #2b2230; color: var(--vellum); border: 1px solid var(--ember); font-style: italic; }
.ch-sl-blase { right: 3%; top: 4%; background: rgba(16,12,18,.92); color: #ffe3a6; border: 1px solid rgba(255,210,122,.5); font-style: italic; }
.ch-nsc-blase.da, .ch-sl-blase.da { opacity: 1; transform: none; }
/* Würfel */
.ch-wuerfel { position: absolute; z-index: 7; left: 50%; top: 42%; width: 64px; height: 64px; margin: -32px 0 0 -32px; display: grid; place-items: center;
  clip-path: polygon(50% 0, 100% 25%, 100% 75%, 50% 100%, 0 75%, 0 25%); background: linear-gradient(160deg, #6a3a7a, #2a1230);
  font: 800 1.6rem/1 Georgia, "Times New Roman", serif; font-variant-numeric: lining-nums; color: #f6ecd6; }
.ch-wuerfel.rollt { animation: chRoll .15s linear infinite; }
@keyframes chRoll { to { transform: rotate(60deg) scale(1.08); } }
.ch-wuerfel.krit { background: linear-gradient(160deg, #ffe07a, #a8741a); color: #2a1a08; animation: chLand .45s ease-out; }
.ch-wuerfel.patzer { background: linear-gradient(160deg, #8a2a2a, #2a0808); animation: chLand .45s ease-out; }
@keyframes chLand { from { transform: scale(1.5); } }
/* Kopfzeile */
.ch-kopfzeile { position: absolute; z-index: 6; left: 3%; right: 3%; bottom: 3%; display: flex; justify-content: space-between; align-items: end; gap: .6rem; pointer-events: none; }
.ch-kopfzeile[hidden] { display: none; }
.ch-geduld { display: grid; gap: .15rem; font-size: .66rem; letter-spacing: .1em; text-transform: uppercase; color: #ffe3a6; text-shadow: 0 1px 2px #000; }
.ch-geduld-bar { width: clamp(90px, 26vw, 160px); height: 7px; background: rgba(0,0,0,.6); border: 1px solid rgba(255,210,122,.5); border-radius: 4px; overflow: hidden; }
.ch-geduld-bar i { display: block; height: 100%; background: linear-gradient(90deg, #7fd36b, #e0a046); transition: width .4s ease; }
.ch-geduld-bar.knapp i { background: linear-gradient(90deg, #c4564a, #e0a046); }
.ch-herzen span { font-size: clamp(1.1rem, 4vw, 1.6rem); color: rgba(255,255,255,.25); text-shadow: 0 1px 3px #000; margin-left: .1rem; transition: color .3s, transform .3s; }
.ch-herzen span.voll { color: #ff5a7a; transform: scale(1.15); }
.ch-herz-flug { position: absolute; z-index: 8; bottom: 20%; color: #ff5a7a; animation: chHerz 2s ease-out forwards; pointer-events: none; }
@keyframes chHerz { to { transform: translateY(-160px) rotate(20deg); opacity: 0; } }
/* Tafel unter der Bühne */
.ch-tafel { display: grid; gap: .6rem; margin-top: .7rem; }
.ch-nsc-kopf { display: grid; grid-template-columns: 1fr auto; align-items: baseline; gap: .1rem .6rem; }
.ch-nsc-kopf span { grid-column: 1 / -1; }
.ch-nsc-kopf em { font-style: normal; font-size: .8rem; color: var(--ash); white-space: nowrap; }
.ch-wurf.leer { min-height: 1.2em; }
.jk-kurz { display: none; }
.ch-nsc-kopf b { font-family: var(--name); font-weight: 400; font-size: 1.25rem; color: var(--vellum); }
.ch-nsc-kopf span { font-size: .88rem; color: var(--ash); }
.ch-klein { font-size: .82rem; color: var(--ash); margin: 0; }
.ch-wurf { margin: 0; font-weight: 600; color: var(--vellum); }
.ch-wurf small { font-weight: 400; color: var(--ash); }
.ch-wurf.krit { color: #ffd27a; } .ch-wurf.patzer { color: #e07a6a; } .ch-wurf.erfolg { color: #9fe08f; }
.ch-sprueche { display: grid; gap: .45rem; }
.ch-spruch { display: grid; gap: .2rem; text-align: left; padding: .6rem .8rem; border: 1px solid var(--line); background: rgba(255,255,255,.03); color: var(--vellum); font: inherit; font-size: .95rem; line-height: 1.35; cursor: pointer; transition: border-color .2s, background .2s, transform .15s; }
.ch-spruch:hover:not([disabled]), .ch-spruch:focus-visible { border-color: var(--ember); background: rgba(224,160,70,.08); transform: translateX(3px); }
.ch-spruch[disabled] { opacity: .5; cursor: default; }
.ch-art { font-size: .68rem; font-weight: 600; letter-spacing: .12em; text-transform: uppercase; color: var(--ember); }
.ch-spruch.art-absurd .ch-art { color: #d39bff; } .ch-spruch.art-kuehn .ch-art { color: #ff8a6a; } .ch-spruch.art-passend .ch-art { color: #7fd3b0; }
.ch-joker { display: flex; flex-wrap: wrap; gap: .4rem; }
.ch-jk { display: grid; text-align: left; padding: .4rem .65rem; border: 1px dashed rgba(224,160,70,.55); background: none; color: var(--vellum); font: inherit; font-size: .82rem; cursor: pointer; }
.ch-jk small { font-size: .7rem; color: var(--ash); }
.ch-jk[disabled] { opacity: .35; cursor: default; text-decoration: line-through; }
.ch-ergebnis { margin: 0; font-family: var(--name); font-size: 1.5rem; color: var(--vellum); }
.ch-ergebnis.erobert { color: #ff8aa0; } .ch-ergebnis.korb { color: var(--ash); }
.ch-bilanz { margin: 0; font-weight: 600; color: var(--ember); }
.ch-knoepfe { display: flex; flex-wrap: wrap; gap: .5rem; }
.ch-reihe { display: flex; flex-wrap: wrap; gap: .35rem; }
.ch-reihe span { position: relative; width: 44px; height: 44px; border: 1px solid var(--line); background: #1b151e; display: grid; place-items: end center; font-size: .75rem; color: var(--ash); overflow: hidden; }
.ch-reihe span.ok { border-color: #ff8aa0; color: #ff8aa0; }
.ch-reihe img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: contain; opacity: .8; }
.ch-buch-titel { margin: 0; font-family: var(--name); font-weight: 400; font-size: 1.3rem; color: var(--vellum); }
.ch-buch { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 8.5rem), 1fr)); gap: .5rem; }
.ch-seite { display: grid; gap: .2rem; justify-items: center; text-align: center; padding: .5rem; border: 1px solid var(--line); background: linear-gradient(180deg, #f1e6c8, #dccba0); color: #2a2016; }
.ch-seite img { width: 100%; height: 84px; object-fit: contain; }
.ch-seite.offen img { filter: brightness(0) opacity(.35); }
.ch-seite b { font-family: var(--name); font-weight: 400; font-size: .92rem; line-height: 1.1; }
.ch-seite small { font-size: .72rem; color: #6a5a42; }
.ch-seite.erobert small { color: #b0304a; font-weight: 600; }
.ch-geheim { width: 100%; height: 84px; display: grid; place-items: center; font-family: var(--name); font-size: 2.6rem; color: #8a7a62; }
/* Handy: alles auf einen Bildschirm – Bühne, Aufgabe, Sprüche, Joker */
.charme .ch-buehne { scroll-margin-top: var(--ch-oben, 64px); }
@media (max-width: 700px) {
  .charme.ch-laeuft > .ch-text { display: none; }
  .charme .ch-buehne { aspect-ratio: auto; height: clamp(190px, 33svh, 300px); }
  .ch-tafel { gap: .35rem; margin-top: .45rem; }
  .ch-nsc-kopf b { font-size: 1.05rem; }
  .ch-nsc-kopf span { font-size: .78rem; line-height: 1.25; }
  .ch-wurf { font-size: .85rem; line-height: 1.25; }
  .ch-wurf small { font-size: .74rem; }
  .ch-sprueche { gap: .3rem; }
  .ch-spruch { padding: .38rem .6rem; font-size: .84rem; line-height: 1.28; gap: .1rem; }
  .ch-art { font-size: .6rem; }
  .ch-joker { display: grid; grid-template-columns: repeat(3, 1fr); gap: .3rem; }
  .ch-jk { padding: .35rem .3rem; text-align: center; font-size: .8rem; }
  .ch-jk .jk-lang, .ch-jk small { display: none; }
  .ch-jk .jk-kurz { display: inline; }
  .ch-nsc-blase, .ch-sl-blase { font-size: .7rem; padding: .3rem .5rem; max-width: 48%; }
  .ch-wuerfel { width: 50px; height: 50px; margin: -25px 0 0 -25px; font-size: 1.25rem; }
  .ch-ergebnis { font-size: 1.25rem; }
  .ch-buch { grid-template-columns: repeat(3, 1fr); gap: .35rem; }
  .ch-seite { padding: .35rem .25rem; }
  .ch-seite img, .ch-geheim { height: 56px; }
  .ch-seite b { font-size: .78rem; }
  .ch-seite small { font-size: .64rem; }
}
@media (max-width: 700px) and (max-height: 780px) {
  .charme .ch-buehne { height: clamp(160px, 25svh, 300px); }
  .ch-spruch { font-size: .8rem; padding: .32rem .55rem; }
  .ch-nsc-kopf span { font-size: .74rem; }
}
/* Vollbild: Größe der Bühne rechnet passen() aus – sie füllt den Platz über der Tafel */
.charme.tav-voll { display: block; padding-top: 3rem; padding-bottom: .6rem; }
.charme.tav-voll > .ch-buehne { aspect-ratio: auto; margin-inline: auto; }
.charme.tav-voll > .ch-tafel { max-width: 1100px; margin-inline: auto; }
@media (max-width: 700px) { .charme.tav-voll { padding: 3rem .5rem .5rem; } }
/* ===== Pracht: lebendiger Hintergrund ===== */
.ch-buehne { --liebe: 0; }
.ch-kette .kb { animation: chFunkeln 2.2s ease-in-out infinite; animation-delay: var(--d); }
@keyframes chFunkeln { 0%, 100% { opacity: 1; } 50% { opacity: .35; } }
.ch-buehne[data-liebe="2"] .ch-kette .kb, .ch-buehne[data-liebe="3"] .ch-kette .kb { animation-duration: 1s; }
.ch-buehne[data-mood="disco"] .ch-kette .kb { animation: chFunkeln .25s steps(2) infinite; animation-delay: var(--d); }
.ch-lampenschein { animation: chLampe 3.6s ease-in-out infinite; transform-box: fill-box; transform-origin: center; }
@keyframes chLampe { 50% { opacity: .55; transform: scale(1.12); } }
.ch-lava b { animation: chLava 7s ease-in-out infinite; transform-box: fill-box; }
.ch-lava b:nth-child(2) { animation-duration: 9s; animation-delay: -3s; }
.ch-lava b:nth-child(3) { animation-duration: 11s; animation-delay: -6s; }
@keyframes chLava { 0%, 100% { transform: translateY(0) scale(1, 1); } 50% { transform: translateY(-34px) scale(.8, 1.2); } }
.ch-flamme { animation: chFlamme .18s ease-in-out infinite alternate; transform-box: fill-box; transform-origin: 50% 100%; }
@keyframes chFlamme { from { transform: scale(1, 1) skewX(-3deg); } to { transform: scale(.88, 1.12) skewX(4deg); } }
.ch-kerzenschein { animation: chKerze 2.4s ease-in-out infinite; }
@keyframes chKerze { 0%, 100% { opacity: .9; } 30% { opacity: .65; } 60% { opacity: 1; } 80% { opacity: .75; } }
/* schwebende Funken / Staub im Licht */
.ch-funken { position: absolute; inset: 0; z-index: 2; pointer-events: none; overflow: hidden; }
.ch-funken i { position: absolute; left: var(--x); top: var(--y); width: 3px; height: 3px; border-radius: 50%; background: #ffe2a8; box-shadow: 0 0 6px 2px rgba(255,200,120,.6);
  opacity: 0; animation: chStaub var(--s) linear infinite; animation-delay: calc(var(--d) * -1); }
@keyframes chStaub { 0% { opacity: 0; transform: translate(0, 0); } 20% { opacity: .8; } 80% { opacity: .6; } 100% { opacity: 0; transform: translate(14px, -70px); } }
.ch-buehne[data-liebe="2"] .ch-funken i, .ch-buehne[data-liebe="3"] .ch-funken i { background: #ffb3d1; box-shadow: 0 0 7px 3px rgba(255,110,170,.6); }
.ch-pracht { position: absolute; inset: 0; z-index: 5; pointer-events: none; }
/* Stimmungslicht: wird rosa, je mehr Herzen */
.ch-stimmung { position: absolute; inset: 0; transition: background .8s ease, opacity .6s ease;
  background: radial-gradient(ellipse at 30% 60%, rgba(255,70,150, calc(var(--liebe) * .28)), transparent 60%),
              radial-gradient(ellipse at 70% 30%, rgba(255,120,180, calc(var(--liebe) * .18)), transparent 55%); mix-blend-mode: screen; }
.ch-buehne[data-mood="romantik"] .ch-stimmung, .ch-buehne[data-mood="erobert"] .ch-stimmung {
  background: radial-gradient(ellipse at 30% 60%, rgba(255,60,150,.42), transparent 62%), radial-gradient(ellipse at 75% 35%, rgba(255,140,200,.3), transparent 60%);
  animation: chPuls 1.1s ease-in-out infinite; }
@keyframes chPuls { 50% { opacity: .55; } }
.ch-buehne[data-mood="auftritt"] .ch-stimmung { background: radial-gradient(ellipse at 22% 70%, rgba(255,230,160,.4), transparent 55%); }
.ch-buehne[data-mood="zauber"] .ch-stimmung { background: radial-gradient(ellipse at 25% 50%, rgba(140,90,255,.45), transparent 60%); animation: chPuls .7s ease-in-out infinite; }
.ch-buehne[data-mood="frost"] .ch-stimmung { background: rgba(70,110,180,.22); mix-blend-mode: multiply; }
.ch-buehne[data-mood="korb"] .ch-stimmung { background: rgba(40,60,110,.42); mix-blend-mode: multiply; }
/* Peinliche Stille: Licht aus, Spot auf den Spielleiter */
.ch-buehne[data-mood="peinlich"] .ch-stimmung { mix-blend-mode: normal; transition: background 1.2s ease;
  background: radial-gradient(circle at 67% 42%, transparent 0 14%, rgba(0,0,0,.72) 26%); }
.ch-buehne[data-mood="peinlich"] .ch-kette .kb { animation: none; opacity: .15; }
.ch-buehne[data-mood="peinlich"] .ch-funken { opacity: 0; transition: opacity 1s; }
/* Patzer: alles grau, Wackeln, Regenwolke */
.ch-buehne[data-mood="patzer"] > svg, .ch-buehne[data-mood="patzer"] .ch-nsc { filter: grayscale(.85) brightness(.75); transition: filter .3s; }
.ch-buehne[data-mood="patzer"] { animation: chWackeln .45s ease 2; }
@keyframes chWackeln { 20% { transform: translate(-6px, 2px) rotate(-.6deg); } 40% { transform: translate(5px, -2px) rotate(.5deg); } 60% { transform: translate(-4px, 1px); } 80% { transform: translate(3px, 0); } }
.ch-buehne[data-mood="patzer"] .ch-kette .kb { animation: chFunkeln .12s steps(2) infinite; }
.ch-wolke { position: absolute; left: 12%; top: 6%; font-size: clamp(2.6rem, 9vw, 4.6rem); line-height: 1; opacity: 0; transform: translateY(-40px); transition: opacity .4s, transform .5s cubic-bezier(.2,1.4,.4,1); filter: grayscale(1) brightness(.7); }
.ch-wolke span { position: absolute; left: 15%; top: 70%; width: 70%; height: 160%;
  background: repeating-linear-gradient(100deg, transparent 0 7px, rgba(150,190,255,.75) 7px 8.5px); background-size: 100% 30px; animation: chRegen .25s linear infinite;
  -webkit-mask: linear-gradient(#000, transparent); mask: linear-gradient(#000, transparent); }
@keyframes chRegen { to { background-position: -6px 30px; } }
.ch-buehne[data-mood="patzer"] .ch-wolke, .ch-buehne[data-mood="korb"] .ch-wolke { opacity: 1; transform: none; }
/* Disco bei der natürlichen 20 */
.ch-disco { position: absolute; left: 50%; top: 0; width: clamp(42px, 9vw, 70px); aspect-ratio: 1; margin-left: calc(clamp(42px, 9vw, 70px) / -2); transform: translateY(-140%); transition: transform .7s cubic-bezier(.3,1.5,.5,1); }
.ch-disco::before { content: ""; position: absolute; left: 50%; bottom: 100%; width: 1px; height: 200px; background: #888; }
.ch-disco b { position: absolute; inset: 0; border-radius: 50%; box-shadow: 0 0 22px rgba(255,255,255,.6);
  background: radial-gradient(circle at 35% 30%, #fff 0 8%, transparent 30%),
    repeating-linear-gradient(0deg, rgba(0,0,0,.35) 0 1px, transparent 1px 7px), repeating-linear-gradient(90deg, rgba(0,0,0,.35) 0 1px, transparent 1px 7px),
    linear-gradient(135deg, #e8e8f0, #8a8aa0); animation: chKugel .6s linear infinite; }
@keyframes chKugel { to { background-position: 0 0, 0 7px, 7px 0, 0 0; } }
.ch-spots { position: absolute; inset: -60%; opacity: 0; transition: opacity .4s; mix-blend-mode: screen;
  background: conic-gradient(from 0deg at 50% 50%, rgba(255,0,140,.55) 0 8deg, transparent 8deg 45deg, rgba(0,200,255,.5) 45deg 53deg, transparent 53deg 90deg,
    rgba(255,220,0,.5) 90deg 98deg, transparent 98deg 135deg, rgba(140,255,90,.5) 135deg 143deg, transparent 143deg 180deg,
    rgba(255,0,140,.55) 180deg 188deg, transparent 188deg 225deg, rgba(0,200,255,.5) 225deg 233deg, transparent 233deg 270deg, rgba(255,220,0,.5) 270deg 278deg, transparent 278deg 360deg); }
.ch-buehne[data-mood="disco"] .ch-disco { transform: translateY(12%); }
.ch-buehne[data-mood="disco"] .ch-spots { opacity: 1; animation: chDreh 2.4s linear infinite; }
@keyframes chDreh { to { transform: rotate(360deg); } }
.ch-buehne[data-mood="disco"] .ch-stimmung { background: rgba(40,0,60,.35); mix-blend-mode: multiply; }
.ch-buehne[data-mood="disco"] .ch-sl .ch-koerper { animation: chTanz .5s ease-in-out infinite; }
@keyframes chTanz { 25% { transform: translateY(-4px) rotate(-2deg); } 75% { transform: translateY(-4px) rotate(2deg); } }
.ch-buehne[data-mood="erobert"] .ch-sl .ch-koerper { animation: chTanz .7s ease-in-out infinite; }
/* Steppenläufer in der peinlichen Stille */
.ch-busch { position: absolute; bottom: 9%; left: -12%; width: clamp(28px, 7vw, 54px); aspect-ratio: 1; border-radius: 50%; opacity: 0;
  background: radial-gradient(circle, transparent 30%, rgba(160,120,70,.9) 31% 34%, transparent 35% 50%, rgba(160,120,70,.9) 51% 54%, transparent 55%),
    repeating-conic-gradient(rgba(140,100,55,.95) 0 6deg, transparent 6deg 24deg); }
.ch-busch.rollt { animation: chBusch 5s linear forwards; }
@keyframes chBusch { 0% { opacity: 1; transform: translate(0, 0) rotate(0); } 25% { transform: translate(calc(var(--bw) * .3), -14px) rotate(260deg); } 35% { transform: translate(calc(var(--bw) * .42), 0) rotate(380deg); }
  70% { transform: translate(calc(var(--bw) * .8), -10px) rotate(760deg); } 100% { opacity: 1; transform: translate(calc(var(--bw) * 1.2), 0) rotate(1100deg); } }
/* Stempel: NAT 20! / PATZER! / EROBERT ♥ / KORB! */
.ch-stempel { position: absolute; left: 50%; top: 38%; z-index: 9; transform: translate(-50%, -50%) scale(0) rotate(-12deg); opacity: 0; white-space: nowrap;
  font: 900 clamp(1.6rem, 7vw, 3.6rem)/1 Georgia, serif; letter-spacing: .04em; padding: .15em .45em; border: .12em solid currentColor; border-radius: .2em; text-shadow: 0 3px 0 rgba(0,0,0,.45); }
.ch-stempel.los { animation: chStempel 2.4s cubic-bezier(.2,1.6,.4,1) forwards; }
@keyframes chStempel { 0% { opacity: 0; transform: translate(-50%, -50%) scale(3) rotate(-12deg); } 15% { opacity: 1; transform: translate(-50%, -50%) scale(1) rotate(-8deg); }
  80% { opacity: 1; transform: translate(-50%, -50%) scale(1.05) rotate(-8deg); } 100% { opacity: 0; transform: translate(-50%, -50%) scale(1.1) rotate(-8deg); } }
.ch-stempel.krit { color: #ffe07a; background: rgba(80,30,100,.55); }
.ch-stempel.patzer { color: #ff6a5a; background: rgba(40,10,10,.6); }
.ch-stempel.erobert { color: #ff8ac0; background: rgba(90,10,50,.55); }
.ch-stempel.korb { color: #9fc4ff; background: rgba(10,20,50,.6); }
/* Fliegende Rosen, Küsse, Fische … */
.ch-flug { position: absolute; z-index: 8; pointer-events: none; line-height: 1; }
.ch-flug.werfen { right: 6%; bottom: 8%; animation: chWerfen 1.1s cubic-bezier(.3,.1,.5,1) forwards; }
@keyframes chWerfen { 0% { opacity: 0; transform: translate(0, 0) rotate(0) scale(.6); } 15% { opacity: 1; } 55% { transform: translate(calc(var(--bw) * -.42), calc(var(--bh) * -.45)) rotate(var(--r)) scale(1.3); }
  100% { opacity: 0; transform: translate(calc(var(--bw) * -.68), calc(var(--bh) * -.2)) rotate(var(--r)) scale(1); } }
.ch-flug.regen { top: -10%; left: var(--x); animation: chRegnen 3.2s ease-in forwards; }
@keyframes chRegnen { 0% { opacity: 0; transform: translateY(0) rotate(0); } 10% { opacity: 1; } 100% { opacity: .9; transform: translateY(calc(var(--bh) * 1.15)) rotate(var(--r)); } }
.ch-flug.aufsteigen { bottom: 18%; left: calc(8% + var(--x) * .35); animation: chAuf 2.2s ease-out forwards; }
@keyframes chAuf { 0% { opacity: 0; transform: scale(.4); } 20% { opacity: 1; transform: scale(1.1); } 100% { opacity: 0; transform: translateY(-180px) rotate(calc(var(--r) * .1)); } }
.ch-flug.korb { top: -20%; left: 18%; font-size: clamp(2.6rem, 10vw, 5rem) !important; animation: chKorb 1.6s cubic-bezier(.5,0,.7,1) forwards; }
@keyframes chKorb { 0% { transform: translateY(0) rotate(-20deg); } 55% { transform: translateY(calc(var(--bh) * .55)) rotate(8deg); } 70% { transform: translateY(calc(var(--bh) * .44)) rotate(-6deg); } 85% { transform: translateY(calc(var(--bh) * .55)) rotate(3deg); } 100% { transform: translateY(calc(var(--bh) * .55)) rotate(0); } }
/* NSC reagiert */
.ch-nsc.da.verliebt { animation: chVerliebt .5s ease 3; filter: drop-shadow(0 0 24px rgba(255,90,160,.9)) drop-shadow(0 10px 18px rgba(0,0,0,.6)); }
@keyframes chVerliebt { 50% { transform: translateY(-4%) scale(1.04) rotate(-2deg); } }
.ch-nsc.da.kalt { animation: chKalt .4s ease 2; filter: drop-shadow(0 0 14px rgba(120,170,255,.7)) saturate(.6); }
@keyframes chKalt { 25% { transform: translateX(-3%) rotate(-2deg); } 75% { transform: translateX(3%) rotate(2deg); } }
/* Spannung beim Würfeln: Licht wird enger */
.ch-buehne.spannung .ch-stimmung { background: radial-gradient(circle at 50% 42%, transparent 10%, rgba(0,0,0,.45) 60%); mix-blend-mode: normal; }
.ch-buehne.spannung .ch-wuerfel { box-shadow: 0 0 30px rgba(200,120,255,.8); }
/* Herzen schlagen */
.ch-herzen span.voll { animation: chHerzSchlag 1s ease-in-out infinite; display: inline-block; }
@keyframes chHerzSchlag { 0%, 60%, 100% { transform: scale(1.15); } 15% { transform: scale(1.4); } 30% { transform: scale(1.1); } 45% { transform: scale(1.3); } }
.ch-ton { pointer-events: auto; align-self: end; padding: .15rem .45rem; border: 1px solid rgba(255,210,122,.5); border-radius: 999px; background: rgba(0,0,0,.55); color: #ffe3a6; font: inherit; font-size: .8rem; cursor: pointer; }
@media (prefers-reduced-motion: reduce) {
  .ch-kette .kb, .ch-lava b, .ch-flamme, .ch-funken i, .ch-spots, .ch-buehne[data-mood], .ch-herzen span.voll, .ch-disco b { animation: none !important; }
}

@media (prefers-reduced-motion: reduce) { .ch-sl .ch-koerper, .ch-sl .a-offen, .ch-sl.hops .ch-kopf, .ch-sl[data-m="lachen"] .ch-kopf { animation: none; } .ch-nsc { transition: opacity .3s; } }
`;
  document.head.appendChild(css);

  gesicht("neutral");
  zeichnen();
  new MutationObserver(zeichnen).observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });
  root._charme = { nsc: NSC, zustand: () => S, neu: neueSitzung, wuerfeln, joker, weiter, gesicht, effekte, stimmung, Ton };
})();
