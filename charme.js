/* =====================================================================
   WÜRFEL AUF VERFÜHREN – Barradin will jeden NSC bezirzen
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
      label: "Würfelspiel", titel: "Würfel auf Verführen",
      text: "Jeder Barde kennt die Frage: Kann ich den NSC verführen? Barradin probiert es bei allen. Wähle einen Spruch, wirf den W20 – und schau dem Spielleiter ins Gesicht.",
      start: "▶ Ich würfle auf Verführen", nochmal: "↻ Noch eine Sitzung", buch: "📖 Eroberungsbuch", zurueck: "Zurück",
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
      label: "Dice game", titel: "Roll to Seduce",
      text: "Every bard knows the question: can I seduce the NPC? Barradin tries it on everyone. Pick a line, roll the d20 – and watch the game master's face.",
      start: "▶ I roll to seduce", nochmal: "↻ Another session", buch: "📖 Book of Conquests", zurueck: "Back",
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

  /* ---------- Texte für Laune, Folgefragen, Gruppe, Rausch, Geheimsprüche, Anleitung, Klang, Teilen ---------- */
  const TX2 = {
    de: {
      laune: ["angefressen", "genervt", "neutral", "gut drauf", "begeistert"], launeLabel: "Laune",
      vorteil: ["„Okay, das war gut. Nächster Wurf mit Vorteil.“", "„Ich bin heute großzügig. Vorteil.“"],
      wuerde: "„Rettungswurf auf Würde. Jetzt.“", wuerdeOk: "„…Bestanden. Diesmal.“", wuerdeNein: "„Durchgefallen. Ein Herz weniger.“",
      wuerdeWurf: (w, s) => "Rettungswurf auf Würde: W20 " + w + " + 2 = " + s + " gegen SG 12",
      rausch: "BARDEN-RAUSCH!", rauschSl: ["„Er ist im Flow. Hilfe.“", "„Nein, nein, nein – drei hintereinander?!“"], rauschInfo: "🔥 Barden-Rausch: Der nächste Spruch zählt doppelt",
      serie: n => "🔥 " + n + " in Folge",
      geheim: "Geheimspruch", geheimInfo: n => "SG " + n + " · 2 ♥", geheimNeu: "📜 Neuer Geheimspruch freigeschaltet!", geheimBuch: "📜 Geheimspruch: ",
      frageLabel: "Der NSC fragt nach …", antwortSl: { gut: ["„Gute Antwort. Leider.“", "„Verdammt, das war charmant.“"], mittel: ["„Mutig. Nicht.“", "„Okay …?“"], schlecht: ["„Oh nein.“", "„Das schreibe ich auf.“", "„Warum.“"] },
      mittelNsc: ["(nickt verwirrt)", "„…Aha.“", "„Mhm.“"],
      gruppe: {
        friedrich: { an: "Friedrich legt einen Pfeil auf. „Soll ich?“", gut: "Der Pfeil trifft eine Fliege direkt neben dem NSC. Beeindruckt.", schlecht: "Der Pfeil trifft den Hut des NSC. Stimmung: weg." },
        ezekiel: { an: "Ezekiel schleicht sich hinter den NSC …", gut: "Ezekiel klaut die Börse – Barradin gibt sie „zufällig gefunden“ zurück. Heldenhaft!", schlecht: "Ezekiel wird beim Klauen erwischt. Barradin tut so, als kenne er ihn nicht." },
        echo: { an: "Echo beugt sich vor: „Kennst du Gundren?“", gut: "Der NSC muss lachen. Das Eis ist gebrochen.", schlecht: "„Nein.“ Peinliche Stille. Schon wieder." },
        rex: { an: "Rex trottet zum NSC und schnüffelt …", gut: "Rex leckt dem NSC die Hand. Herz geschmolzen.", schlecht: "Rex hebt das Bein. Am NSC." }
      },
      gruppeSl: { gut: ["„Ihr seid unfair.“", "„Die Gruppe hilft. Natürlich.“"], schlecht: ["„HAHA – nein.“", "„Danke, Gruppe.“"] },
      anleitungTitel: "So geht's",
      anleitung: ["Wähle einen Spruch: <b>charmant</b> ist sicher, <b>kühn</b> bringt zwei Herzen, ist aber schwer, <b>absurd</b> ist Glückssache, <b>passend</b> ist leicht.",
        "Gewürfelt wird W20 + 6 Charisma gegen den SG. <b>Drei Herzen</b> erobern den NSC – du hast vier Sprüche.",
        "Achte auf die <b>Geduld</b> und die <b>Laune</b> des Spielleiters. Joker helfen einmal pro Abend. <b>Tippe auf die Bühne</b>, um Szenen zu überspringen."],
      los: "Los geht's", anleitungKnopf: "❔ Anleitung",
      klang: "Klang", musik: "Musik", effekte: "Effekte", leise: "Leise-Modus", fertig: "Fertig",
      fortsetzen: (i, n) => "▶ Weiterspielen (NSC " + i + " von " + n + ")",
      skip: "⏩ Tippen zum Überspringen", aushalten: "„Nein. Aushalten.“",
      teilen: "📸 Bild teilen", teilenText: "Mein Abend bei „Würfel auf Verführen“ auf imrestales.de",
      titel: ["Ewiger Single der Schwertküste", "Charmanter Stümper", "Tavernen-Casanova", "Herzensbrecher von Gracklstugh", "Bezwinger aller Herzen", "Verführer des Abgrunds"],
      peinlich: "Peinlichster Moment", keinMoment: "Keiner. Unheimlich.", erobertVon: (e, n) => e + " von " + n + " NSC erobert",
      glitzer: ["„…Ihr habt nichts gesehen.“", "„Die Hose bleibt unter uns.“"]
    },
    en: {
      laune: ["fuming", "annoyed", "neutral", "in a good mood", "thrilled"], launeLabel: "Mood",
      vorteil: ["\"Okay, that was good. Next roll with advantage.\"", "\"I'm feeling generous. Advantage.\""],
      wuerde: "\"Dignity saving throw. Now.\"", wuerdeOk: "\"…Passed. This time.\"", wuerdeNein: "\"Failed. Lose a heart.\"",
      wuerdeWurf: (w, s) => "Dignity save: d20 " + w + " + 2 = " + s + " vs DC 12",
      rausch: "BARD FRENZY!", rauschSl: ["\"He's in the flow. Help.\"", "\"No, no, no – three in a row?!\""], rauschInfo: "🔥 Bard frenzy: the next line counts double",
      serie: n => "🔥 " + n + " in a row",
      geheim: "Secret line", geheimInfo: n => "DC " + n + " · 2 ♥", geheimNeu: "📜 New secret line unlocked!", geheimBuch: "📜 Secret line: ",
      frageLabel: "The NPC asks …", antwortSl: { gut: ["\"Good answer. Sadly.\"", "\"Damn, that was charming.\""], mittel: ["\"Bold. Not.\"", "\"Okay …?\""], schlecht: ["\"Oh no.\"", "\"I'm writing that down.\"", "\"Why.\""] },
      mittelNsc: ["(nods, confused)", "\"…I see.\"", "\"Mhm.\""],
      gruppe: {
        friedrich: { an: "Friedrich nocks an arrow. \"Shall I?\"", gut: "The arrow hits a fly right next to the NPC. Impressed.", schlecht: "The arrow hits the NPC's hat. Mood: gone." },
        ezekiel: { an: "Ezekiel sneaks up behind the NPC …", gut: "Ezekiel steals the purse – Barradin returns it, \"found it by chance\". Heroic!", schlecht: "Ezekiel gets caught stealing. Barradin pretends not to know him." },
        echo: { an: "Echo leans in: \"Do you know Gundren?\"", gut: "The NPC has to laugh. The ice is broken.", schlecht: "\"No.\" Awkward silence. Again." },
        rex: { an: "Rex trots over to the NPC and sniffs …", gut: "Rex licks the NPC's hand. Heart melted.", schlecht: "Rex lifts his leg. On the NPC." }
      },
      gruppeSl: { gut: ["\"You're unfair.\"", "\"The party helps. Of course.\""], schlecht: ["\"HAHA – no.\"", "\"Thanks, party.\""] },
      anleitungTitel: "How it works",
      anleitung: ["Pick a line: <b>charming</b> is safe, <b>bold</b> gives two hearts but is hard, <b>absurd</b> is pure luck, <b>fitting</b> is easy.",
        "You roll d20 + 6 Charisma against the DC. <b>Three hearts</b> conquer the NPC – you have four lines.",
        "Watch the game master's <b>patience</b> and <b>mood</b>. Jokers help once per evening. <b>Tap the stage</b> to skip scenes."],
      los: "Let's go", anleitungKnopf: "❔ How to play",
      klang: "Sound", musik: "Music", effekte: "Effects", leise: "Quiet mode", fertig: "Done",
      fortsetzen: (i, n) => "▶ Continue (NPC " + i + " of " + n + ")",
      skip: "⏩ Tap to skip", aushalten: "\"No. Endure it.\"",
      teilen: "📸 Share picture", teilenText: "My evening of \"Roll to Seduce\" on imrestales.de",
      titel: ["Eternal single of the Sword Coast", "Charming bungler", "Tavern Casanova", "Heartbreaker of Gracklstugh", "Conqueror of all hearts", "Seducer of the Abyss"],
      peinlich: "Most awkward moment", keinMoment: "None. Creepy.", erobertVon: (e, n) => e + " of " + n + " NPCs conquered",
      glitzer: ["\"…You saw nothing.\"", "\"The trousers stay between us.\""]
    }
  };
  const NSC2 = {
    de: {
      gundren: { geheim: "„Gundren, du suchst eine verlorene Mine? Mein Herz ist auch noch unentdeckt.“", frage: "„Und was bekomme ich dafür, wenn ich im Voraus zahle?“", gut: "„Meine ewige Dankbarkeit. Und eine Ballade.“", mittel: "„Äh … eine Quittung?“", schlecht: "„Ich verrate niemandem, wo deine Mine ist. Versprochen.“" },
      buergermeister: { geheim: "„Für Sie würde ich sogar Steuern zahlen. Freiwillig.“", frage: "„Und was sagen Sie meinen Wählern?“", gut: "„Dass Phandalin den großzügigsten Bürgermeister der Schwertküste hat.“", mittel: "„Nichts. Ich bin diskret.“", schlecht: "„Dass Sie sehr gut im Zählen sind. Vor allem im Behalten.“" },
      bugbear: { geheim: "„Ich hab dir eine Ratte mitgebracht. Eine ganze.“", frage: "„GRRR?“ (Er scheint eine Frage zu stellen.)", gut: "„Grrr.“ (zärtlich)", mittel: "„Ja?“", schlecht: "„Sitz!“" },
      ilvara: { geheim: "„Lolth hat viele Diener. Aber nur einen, der für Euch singt.“", frage: "„Und was genau willst du dafür tun?“", gut: "„Alles, Herrin. Außer Spinnen füttern.“", mittel: "„Singen?“", schlecht: "„Fliehen. Also … später. Mit Euch!“" },
      kuotoa: { geheim: "„Ich habe einen neuen Gott erfunden. Er heißt wie du.“", frage: "„Blubb? Wer ist dein Lieblingsgott?“", gut: "„Du.“", mittel: "„Ich hab mehrere.“", schlecht: "„Ich glaube nicht an ausgedachte Götter.“" },
      horga: { geheim: "„Majestät, ich habe Euren Sohn gerettet. Darf ich jetzt Euren Abend retten?“", frage: "„Und was kann ein Barde einem König bieten?“", gut: "„Unsterblichkeit. In Liedform.“", mittel: "„Unterhaltung beim Essen?“", schlecht: "„Tipps zur Bartpflege.“" },
      hgraam: { geheim: "„Der Stein hat mir verraten, dass er Euch mag. Ich auch.“", frage: "„Hörst du den Stein? Was sagt er?“", gut: "„Er sagt, Ihr seid weise. Und gutaussehend.“", mittel: "„Er sagt … Stein?“", schlecht: "„Er sagt, Ihr seid ein bisschen langsam.“" },
      themberchaud: { geheim: "„Ich habe Eurem Hort etwas mitgebracht: mich. Mit Schleife.“", frage: "„Und warum sollte ich dich nicht einfach fressen?“", gut: "„Weil ich lebend viel unterhaltsamer bin.“", mittel: "„Ich bin zäh. Wirklich.“", schlecht: "„Echo schmeckt besser.“" },
      demogorgon: { geheim: "„Zwei Köpfe. Ein Herz. Meins.“", frage: "(Beide Köpfe sehen dich fragend an.)", gut: "„Ich mag euch beide gleich gern.“", mittel: "„Hallo?“", schlecht: "„Der linke ist hübscher.“" }
    },
    en: {
      gundren: { geheim: "\"Gundren, you're looking for a lost mine? My heart is still undiscovered too.\"", frage: "\"And what do I get if I pay in advance?\"", gut: "\"My eternal gratitude. And a ballad.\"", mittel: "\"Uh … a receipt?\"", schlecht: "\"I won't tell anyone where your mine is. Promise.\"" },
      buergermeister: { geheim: "\"For you I'd even pay taxes. Voluntarily.\"", frage: "\"And what will you tell my voters?\"", gut: "\"That Phandalin has the most generous mayor on the Sword Coast.\"", mittel: "\"Nothing. I'm discreet.\"", schlecht: "\"That you're very good at counting. Especially at keeping.\"" },
      bugbear: { geheim: "\"I brought you a rat. A whole one.\"", frage: "\"GRRR?\" (He seems to be asking something.)", gut: "\"Grrr.\" (tenderly)", mittel: "\"Yes?\"", schlecht: "\"Sit!\"" },
      ilvara: { geheim: "\"Lolth has many servants. But only one who sings for you.\"", frage: "\"And what exactly will you do for it?\"", gut: "\"Anything, mistress. Except feed the spiders.\"", mittel: "\"Sing?\"", schlecht: "\"Escape. I mean … later. With you!\"" },
      kuotoa: { geheim: "\"I invented a new god. It has your name.\"", frage: "\"Blub? Who is your favourite god?\"", gut: "\"You.\"", mittel: "\"I have several.\"", schlecht: "\"I don't believe in made-up gods.\"" },
      horga: { geheim: "\"Your Majesty, I saved your son. May I save your evening now?\"", frage: "\"And what can a bard offer a king?\"", gut: "\"Immortality. In song.\"", mittel: "\"Dinner entertainment?\"", schlecht: "\"Beard care tips.\"" },
      hgraam: { geheim: "\"The stone told me it likes you. So do I.\"", frage: "\"Do you hear the stone? What does it say?\"", gut: "\"It says you are wise. And handsome.\"", mittel: "\"It says … stone?\"", schlecht: "\"It says you're a bit slow.\"" },
      themberchaud: { geheim: "\"I brought something for your hoard: me. With a bow.\"", frage: "\"And why shouldn't I simply eat you?\"", gut: "\"Because I'm far more entertaining alive.\"", mittel: "\"I'm tough. Really.\"", schlecht: "\"Echo tastes better.\"" },
      demogorgon: { geheim: "\"Two heads. One heart. Mine.\"", frage: "(Both heads look at you questioningly.)", gut: "\"I like you both equally.\"", mittel: "\"Hello?\"", schlecht: "\"The left one is prettier.\"" }
    }
  };
  const t2 = () => TX2[sprache()], n2 = id => NSC2[sprache()][id];

  /* ---------- Szene: Zimmer, Spielleiter, Schirm (SVG) ---------- */
  const ZIMMER = `
<svg class="ch-zimmer" viewBox="0 0 400 300" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
  <defs>
    <radialGradient id="chLicht" cx="72%" cy="18%" r="70%"><stop offset="0" stop-color="#5a3a26"/><stop offset=".55" stop-color="#2a1d1f"/><stop offset="1" stop-color="#151017"/></radialGradient>
    <linearGradient id="chHolz" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6b4528"/><stop offset="1" stop-color="#3a2416"/></linearGradient>
    <radialGradient id="chLampLicht"><stop offset="0" stop-color="#ff7ab8" stop-opacity=".35"/><stop offset=".5" stop-color="#ffb070" stop-opacity=".12"/><stop offset="1" stop-color="#ffb070" stop-opacity="0"/></radialGradient>
    <pattern id="chPail" width="6" height="6" patternUnits="userSpaceOnUse"><rect width="6" height="6" fill="#6f7fa8"/><circle cx="1.5" cy="1.5" r="1.45" fill="#e8f0ff"/><circle cx="4.5" cy="4.5" r="1.45" fill="#b8c8ff"/><circle cx="4.5" cy="1.5" r="1.25" fill="#9fb0d8"/><circle cx="1.5" cy="4.5" r="1.25" fill="#d8e0f8"/></pattern>
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
      <!-- die Glitzerhose (sonst hinter dem Schirm versteckt) -->
      <g class="ch-hose"><path d="M226 246 L 314 246 L 320 304 L 220 304 Z" fill="url(#chPail)"/><rect x="226" y="242" width="88" height="6" rx="2" fill="#24222a"/><rect x="264" y="242" width="12" height="6" fill="#c9a43a"/>
        <g class="ch-glanz"><path d="M240 256 l 2 -6 l 2 6 l 6 2 l -6 2 l -2 6 l -2 -6 l -6 -2 Z" fill="#fff"/><path d="M290 268 l 1.5 -4 l 1.5 4 l 4 1.5 l -4 1.5 l -1.5 4 l -1.5 -4 l -4 -1.5 Z" fill="#fff"/><path d="M262 284 l 1.5 -4 l 1.5 4 l 4 1.5 l -4 1.5 l -1.5 4 l -1.5 -4 l -4 -1.5 Z" fill="#dfe8ff"/><path d="M304 252 l 1 -3 l 1 3 l 3 1 l -3 1 l -1 3 l -1 -3 l -3 -1 Z" fill="#fff"/></g></g>
      <!-- Tattoos auf den Schultern -->
      <path d="M229 208 c 3 -5 9 -5 9 1 c 0 5 -7 5 -6 0 M233 216 l 4 6" stroke="#2a3a52" stroke-width="1.6" fill="none" stroke-linecap="round"/>
      <path d="M308 206 l 3 5 l -5 2 l 3 5" stroke="#2a3a52" stroke-width="1.6" fill="none" stroke-linecap="round"/>
      <!-- Arme bis zum Tisch, mit Band-Tattoos -->
      <g class="ch-arme">
        <path d="M228 206 C 222 214 224 222 232 226" stroke="#ecc29f" stroke-width="12" fill="none" stroke-linecap="round"/>
        <path class="arm-r" d="M312 206 C 318 214 316 222 308 226" stroke="#ecc29f" stroke-width="12" fill="none" stroke-linecap="round"/>
      </g>
      <rect x="263" y="166" width="14" height="26" rx="6" fill="#e2b592"/>
      <g class="ch-pose"><g class="ch-kopf">
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
          <path class="b-skeptisch" d="M253 130 q 6 0 11 1 M276 121 q 6 -5 11 0" stroke="#5a3e24" stroke-width="2.4" fill="none" stroke-linecap="round"/>
          <path class="b-traurig" d="M253 130 q 6 -1 11 -6 M276 124 q 5 5 11 6" stroke="#5a3e24" stroke-width="2.4" fill="none" stroke-linecap="round"/>
        </g>
        <!-- Augen -->
        <g class="ch-augen">
          <g class="a-offen"><ellipse cx="259" cy="138" rx="4.6" ry="5" fill="#fff"/><ellipse cx="281" cy="138" rx="4.6" ry="5" fill="#fff"/>
            <g class="ch-pupillen"><circle cx="259.5" cy="138.5" r="2.4" fill="#3a2a1a"/><circle cx="281.5" cy="138.5" r="2.4" fill="#3a2a1a"/></g></g>
          <g class="a-gross"><ellipse cx="259" cy="137" rx="6" ry="7" fill="#fff"/><ellipse cx="281" cy="137" rx="6" ry="7" fill="#fff"/><circle cx="259" cy="137" r="2" fill="#3a2a1a"/><circle cx="281" cy="137" r="2" fill="#3a2a1a"/></g>
          <g class="a-zu"><path d="M254 139 q 5 4 10 0 M276 139 q 5 4 10 0" stroke="#3a2a1a" stroke-width="2" fill="none" stroke-linecap="round"/></g>
          <g class="a-halb"><path d="M254 137 h 10 M276 137 h 10" stroke="#3a2a1a" stroke-width="2" stroke-linecap="round"/><path d="M255 138 q 4 3 8 0 M277 138 q 4 3 8 0" fill="#3a2a1a"/></g>
          <g class="a-herz"><path d="M259 144 l -5.5 -5.5 a 3 3 0 0 1 5.5 -3.6 a 3 3 0 0 1 5.5 3.6 Z M281 144 l -5.5 -5.5 a 3 3 0 0 1 5.5 -3.6 a 3 3 0 0 1 5.5 3.6 Z" fill="#e8204a"/></g>
          <g class="a-x"><path d="M254 134 l 8 4 l -8 4 M286 134 l -8 4 l 8 4" stroke="#3a2a1a" stroke-width="2.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></g>
          <g class="a-rollen"><ellipse cx="259" cy="138" rx="4.6" ry="5" fill="#fff"/><ellipse cx="281" cy="138" rx="4.6" ry="5" fill="#fff"/><circle cx="259.5" cy="134.6" r="2.3" fill="#3a2a1a"/><circle cx="281" cy="134.6" r="2.3" fill="#3a2a1a"/></g>
          <g class="a-skeptisch"><path d="M254 139 h 10" stroke="#3a2a1a" stroke-width="2" stroke-linecap="round"/><path d="M255.5 139.5 q 3.5 2.5 7 0" fill="#3a2a1a"/><ellipse cx="281" cy="137" rx="5" ry="5.6" fill="#fff"/><circle cx="280" cy="137.5" r="2.4" fill="#3a2a1a"/></g>
          <g class="a-lachzu"><path d="M254 140 q 5 -6 10 0 M276 140 q 5 -6 10 0" stroke="#3a2a1a" stroke-width="2.2" fill="none" stroke-linecap="round"/></g>
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
          <g class="m-zaehne"><rect x="261" y="154.5" width="18" height="7" rx="2.5" fill="#fff" stroke="#3e1a12" stroke-width="1.4"/><path d="M261 158 h 18 M265.5 154.5 v 7 M270 154.5 v 7 M274.5 154.5 v 7" stroke="#3e1a12" stroke-width=".8"/></g>
          <path class="m-wellig" d="M261 159 q 2.3 -3 4.5 0 t 4.5 0 t 4.5 0 t 4.5 0" stroke="#3e1a12" stroke-width="1.8" fill="none" stroke-linecap="round"/>
          <path class="m-smirk" d="M262 159 q 9 2 16 -5" stroke="#3e1a12" stroke-width="2" fill="none" stroke-linecap="round"/>
          <path class="m-gepresst" d="M264 158 q 6 -1.5 12 0" stroke="#3e1a12" stroke-width="2.6" fill="none" stroke-linecap="round"/>
          <path class="m-strich" d="M263 158 h 14" stroke="#3e1a12" stroke-width="2" stroke-linecap="round"/>
        </g>
        <g class="ch-roete"><ellipse cx="252" cy="150" rx="5" ry="3" fill="#ff7a7a" opacity=".35"/><ellipse cx="288" cy="150" rx="5" ry="3" fill="#ff7a7a" opacity=".35"/></g>
        <g class="ch-zzz"><text x="300" y="112" font-size="11" fill="#cfe6ff" font-family="Georgia,serif">z</text><text x="308" y="102" font-size="14" fill="#cfe6ff" font-family="Georgia,serif">Z</text></g>
        <g class="ch-schweiss"><path d="M300 124 q 3 6 0 8 q -3 -2 0 -8 Z" fill="#9fd6ff"/><path d="M243 128 q 2.5 5 0 7 q -2.5 -2 0 -7 Z" fill="#9fd6ff"/></g>
        <g class="ch-traenen"><path class="tr1" d="M251 142 q 3 6 0 8 q -3 -2 0 -8 Z" fill="#9fd6ff"/><path class="tr2" d="M289 142 q 3 6 0 8 q -3 -2 0 -8 Z" fill="#9fd6ff"/></g>
        <g class="ch-backen"><ellipse cx="251" cy="153" rx="6" ry="5" fill="#f2c8a8" stroke="#d3a07e" stroke-width=".8"/><ellipse cx="289" cy="153" rx="6" ry="5" fill="#f2c8a8" stroke="#d3a07e" stroke-width=".8"/></g>
      </g></g>
      <!-- Hände -->
      <g class="ch-haende">
        <g class="h-ruhe"><ellipse cx="236" cy="226" rx="10" ry="6.5" fill="#ecc29f"/><ellipse cx="304" cy="226" rx="10" ry="6.5" fill="#ecc29f"/><path d="M226 222 l 3 8 M229 221 l 3 8" stroke="#22262e" stroke-width="1.6"/><rect x="309" y="221" width="3" height="9" fill="#c99a3a"/></g>
        <g class="h-facepalm"><path d="M312 208 C 312 190 296 174 284 160" stroke="#ecc29f" stroke-width="11" fill="none" stroke-linecap="round"/><path d="M303 186 l 8 -6 M300 182 l 8 -6" stroke="#22262e" stroke-width="1.8"/><ellipse cx="272" cy="141" rx="14" ry="11" fill="#ecc29f"/><path d="M262 134 h 21 M261 140 h 22 M262 146 h 20" stroke="#d3a07e" stroke-width="1"/><ellipse cx="236" cy="226" rx="10" ry="6.5" fill="#ecc29f"/></g>
        <g class="h-daumen"><path d="M312 208 C 322 200 322 190 318 180" stroke="#ecc29f" stroke-width="11" fill="none" stroke-linecap="round"/><path d="M314 196 h 10 M314 192 h 10" stroke="#22262e" stroke-width="1.8"/><rect x="309" y="160" width="16" height="18" rx="5" fill="#ecc29f"/><rect x="313" y="148" width="7" height="16" rx="3.5" fill="#ecc29f"/><ellipse cx="236" cy="226" rx="10" ry="6.5" fill="#ecc29f"/></g>
        <g class="h-mund"><path d="M312 208 C 316 190 298 178 282 168" stroke="#ecc29f" stroke-width="11" fill="none" stroke-linecap="round"/><path d="M304 190 l 8 -5 M301 186 l 8 -5" stroke="#22262e" stroke-width="1.8"/><ellipse cx="272" cy="160" rx="12" ry="8" fill="#ecc29f"/><path d="M262 157 h 17 M261 161 h 18" stroke="#d3a07e" stroke-width="1"/><ellipse cx="236" cy="226" rx="10" ry="6.5" fill="#ecc29f"/></g>
        <g class="h-kinn"><path d="M312 208 C 312 198 298 192 286 188" stroke="#ecc29f" stroke-width="11" fill="none" stroke-linecap="round"/><path d="M302 196 l 4 -8 M298 195 l 4 -8" stroke="#22262e" stroke-width="1.8"/><circle cx="280" cy="181" r="7.5" fill="#ecc29f"/><path d="M276 176 q 4 -2 8 0" stroke="#d3a07e" stroke-width="1" fill="none"/><ellipse cx="236" cy="226" rx="10" ry="6.5" fill="#ecc29f"/></g>
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
    '<div class="ch-buehne"><div class="ch-kamera">' + ZIMMER +
      '<img class="ch-nsc" alt="" hidden>' +
      VORNE + "</div>" +
      '<div class="ch-sl-blase" aria-live="polite"></div>' +
      '<div class="ch-nsc-blase" aria-live="polite"></div>' +
      '<div class="ch-wuerfel" hidden><span></span></div>' +
      '<div class="ch-kopfzeile"><div class="ch-geduld"><span class="ch-geduld-txt"></span><span class="ch-geduld-bar"><i></i></span></div><span class="ch-laune" aria-live="polite"></span><button type="button" class="ch-ton" data-tun="ton"></button><div class="ch-herzen"></div></div>' +
    "</div>" +
    '<div class="ch-tafel"></div>';
  const $ = s => root.querySelector(s);
  const buehne = $(".ch-buehne"), sl = $(".ch-sl"), nscImg = $(".ch-nsc"), nscBlase = $(".ch-nsc-blase"), slBlase = $(".ch-sl-blase"),
    wuerfel = $(".ch-wuerfel"), tafel = $(".ch-tafel");

  /* Gesichtsausdruck: Augen, Brauen, Mund, Hände */
  const AUSDRUCK = {
    neutral: { a: "offen", b: "normal", m: "neutral", h: "ruhe" },
    grinsen: { a: "offen", b: "hoch", m: "grinsen", h: "ruhe" },
    lachen: { a: "lachzu", b: "hoch", m: "lachen", h: "ruhe", p: "zurueck" },
    facepalm: { a: "zu", b: "boese", m: "schief", h: "facepalm" },
    schock: { a: "gross", b: "hoch", m: "o", h: "ruhe", p: "zurueck" },
    notiert: { a: "unten", b: "normal", m: "schief", h: "stift" },
    stolz: { a: "zu", b: "hoch", m: "grinsen", h: "daumen", r: 1 },
    genervt: { a: "halb", b: "muede", m: "traurig", h: "ruhe" },
    errötet: { a: "lachzu", b: "traurig", m: "gepresst", h: "ruhe", r: 1, p: "links" },
    schwitzt: { a: "gross", b: "hoch", m: "schief", h: "ruhe", sw: 1 },
    schlaeft: { a: "zu", b: "muede", m: "neutral", h: "ruhe", z: 1 },
    starr: { a: "offen", b: "normal", m: "strich", h: "ruhe", zk: 1 },
    skeptisch: { a: "skeptisch", b: "skeptisch", m: "schief", h: "kinn", p: "vor" },
    fremdscham: { a: "x", b: "traurig", m: "zaehne", h: "ruhe", p: "ducken", sw: 1 },
    kichern: { a: "lachzu", b: "hoch", m: "gepresst", h: "mund", r: 1, p: "links" },
    verliebt: { a: "herz", b: "hoch", m: "grinsen", h: "ruhe", r: 1, p: "rechts" },
    augenrollen: { a: "rollen", b: "muede", m: "wellig", h: "ruhe", p: "zurueck" },
    smirk: { a: "halb", b: "skeptisch", m: "smirk", h: "ruhe", p: "rechts" },
    pokerface: { a: "offen", b: "normal", m: "strich", h: "ruhe" },
    lachtraenen: { a: "lachzu", b: "hoch", m: "lachen", h: "ruhe", p: "zurueck", tr: 1 },
    unglaeubig: { a: "gross", b: "hoch", m: "wellig", h: "ruhe", p: "vor" },
    seufzen: { a: "zu", b: "traurig", m: "o", h: "ruhe", p: "ducken" },
    verkneifen: { a: "lachzu", b: "boese", m: "gepresst", h: "ruhe", r: 1, bk: 1 }
  };
  let ausdruckUhr = 0, ruheUhr = 0;
  function gesicht(name, dauer, danach) {
    const A = AUSDRUCK[name] || AUSDRUCK.neutral;
    sl.dataset.a = A.a; sl.dataset.b = A.b; sl.dataset.m = A.m; sl.dataset.h = A.h;
    sl.classList.toggle("rot", !!A.r); sl.classList.toggle("zzz", !!A.z); sl.classList.toggle("schweiss", !!A.sw);
    sl.classList.toggle("traenen", !!A.tr); sl.classList.toggle("backen", !!A.bk); sl.classList.toggle("zucken", !!A.zk);
    sl.dataset.p = A.p || "";
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
  let sprechUhr = 0;
  const slSagt = (pool, dauer) => {
    const txt = typeof pool === "string" ? pool : zufall(pool);
    blase(slBlase, txt, dauer || 2600);
    if (/^\(/.test(txt) || txt === "…" || ruhig) return;
    sl.classList.add("spricht"); clearTimeout(sprechUhr);
    sprechUhr = setTimeout(() => sl.classList.remove("spricht"), Math.min(2200, 300 + txt.length * 45));
  };

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
    let musikLaut = parseFloat(lies("imres-charme-musik", ".7")), effektLaut = parseFloat(lies("imres-charme-effekte", "1"));
    if (!(musikLaut >= 0)) musikLaut = .7; if (!(effektLaut >= 0)) effektLaut = 1;
    const puffer = {}, laden = {};
    let stimmen = 0;
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
      try { ctx = new AC({ latencyHint: "playback" }); } catch (_) { try { ctx = new AC(); } catch (__) { return null; } }
      master = ctx.createGain(); master.gain.value = .7;
      const komp = ctx.createDynamicsCompressor();
      komp.threshold.value = -16; komp.knee.value = 12; komp.ratio.value = 4; komp.attack.value = .006; komp.release.value = .25;
      master.connect(komp); komp.connect(ctx.destination);
      musikBus = ctx.createGain(); musikBus.gain.value = 0; musikBus.connect(master);
      effektBus = ctx.createGain(); effektBus.gain.value = effektLaut; effektBus.connect(master);
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
      if (o.bus === musikBus && stimmen >= 26) return null; /* nicht zu viele Stimmen gleichzeitig – sonst knackt es auf dem Handy */
      const q = ctx.createBufferSource(); q.buffer = puffer[name];
      q.playbackRate.value = o.rate || 1;
      if (o.detune) q.detune.value = o.detune;
      const g = ctx.createGain(), t0 = jetzt() + (o.zeit || 0), laut = o.laut == null ? .5 : o.laut;
      /* weicher Einsatz statt hartem Sprung – verhindert Knackser */
      g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(laut, t0 + (o.ein || .008));
      let kette = q;
      if (o.filter) { const f = ctx.createBiquadFilter(); f.type = o.filter.typ || "lowpass"; f.frequency.value = o.filter.f; f.Q.value = o.filter.q || 1;
        if (o.filter.bis) { f.frequency.setValueAtTime(o.filter.f, t0); f.frequency.exponentialRampToValueAtTime(o.filter.bis, t0 + (o.filter.in || .3)); }
        kette.connect(f); kette = f; }
      if (o.vibrato) { const l = ctx.createOscillator(), lg = ctx.createGain(); l.frequency.value = o.vibrato.f || 5.5; lg.gain.value = o.vibrato.tiefe || 30; l.connect(lg); lg.connect(q.detune); l.start(t0 + (o.vibrato.ab || 0)); l.stop(t0 + (o.dauer || 3) + .5); }
      kette.connect(g); g.connect(o.bus || effektBus);
      q.start(t0, o.ab || 0);
      if (o.bus === musikBus) { stimmen++; q.onended = () => { stimmen--; }; }
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
    /* ---------- Lounge-Musik: ein ganzes Stück (A A B A, 32 Takte) mit wechselnden Mustern,
       Klarinetten-Melodien, Harfen-Übergängen und Pausentakten – und bei viel Liebe ein Chor ---------- */
    const K = (b, a, sk) => ({ b, a, sk });
    const PROG = {
      A: [K(38, [53, 57, 60, 64], [62, 64, 65, 67, 69, 72, 74]), K(43, [53, 57, 59, 64], [62, 64, 65, 67, 69, 71, 74]),
          K(36, [52, 55, 59, 62], [60, 62, 64, 67, 69, 71, 72]), K(45, [55, 58, 61, 64], [61, 64, 67, 69, 70, 73]),
          K(38, [53, 57, 60, 64], [62, 65, 67, 69, 72, 74]), K(43, [53, 57, 59, 64], [62, 65, 67, 71, 74]),
          K(40, [55, 58, 62, 64], [62, 64, 67, 70, 72, 74]), K(45, [55, 58, 61, 64], [61, 64, 67, 69, 70, 73])],
      B: [K(46, [53, 57, 60, 62], [62, 65, 67, 69, 70, 72]), K(45, [55, 57, 61, 64], [61, 64, 67, 69, 72]),
          K(38, [53, 57, 60, 64], [62, 64, 65, 69, 72, 74]), K(38, [54, 57, 60, 63], [62, 63, 66, 69, 72]),
          K(43, [53, 57, 58, 62], [62, 65, 67, 69, 70, 74]), K(36, [52, 57, 58, 62], [60, 62, 64, 67, 69, 70, 72]),
          K(41, [52, 57, 60, 64], [60, 62, 64, 65, 67, 69, 72]), K(40, [53, 56, 59, 62], [59, 62, 64, 65, 68, 71])]
    };
    const FORM = ["A", "A", "B", "A"];
    const COMP = [[[0, 1.2], [1.5, .7], [2.5, .7]], [[0, .8], [1, .5], [2.5, .7], [3.5, .4]], [[.5, .8], [1.5, .7], [3, .8]], [[0, 3.6]], [[0, .7], [1.5, .5], [2, .5], [3, .8]]];
    const BASS = [[[0, 0, 1.4], [2, 7, .9], [3.5, "nah", .4]], [[0, 0, .9], [1.5, 0, .5], [2, 7, .9], [3.5, 7, .4]], [[0, 0, .9], [1, 3, .9], [2, 7, .9], [3, "nah", .9]], [[0, 0, 1.8], [2.5, 7, 1.2]]];
    const RHY = [[0, .5, 1, 2], [0, 1.5, 2], [.5, 1, 1.5, 2.5, 3], [0, 2, 2.5], [1, 1.5, 2, 3.5], [0, .75, 1.5]];
    let SCHLAG = .68;
    let musikAn = false, naechsterTakt = 0, takt = 0, uhr = 0, liebe = 0;
    let comp = 0, bass = 0, melodie = false, letzteNote = 69;
    const wahl = l => l[Math.floor(Math.random() * l.length)];
    function taktPlanen(t0, i) {
      const pos = i % 32, teil = FORM[pos >> 3], bar = pos % 8, A = PROG[teil][bar];
      const naechst = PROG[FORM[((pos + 1) % 32) >> 3]][(pos + 1) % 8];
      const mb = musikBus, n = (fam, m, z, o) => note(fam, m, Object.assign({ zeit: z - jetzt(), bus: mb }, o));
      /* neue Muster am Anfang jedes Teils (und gelegentlich mittendrin) */
      if (bar === 0 || (bar === 4 && Math.random() < .4)) {
        comp = teil === "B" ? wahl([1, 2, 4]) : wahl([0, 0, 1, 2, 4]);
        bass = teil === "B" ? wahl([2, 1]) : wahl([0, 0, 1, 3]);
        melodie = (pos >= 8 && Math.random() < .75) || liebe >= 1;
      }
      const pause = pos === 31 && Math.random() < .4;     /* Stop-Time-Takt vor dem Neuanfang */
      const intim = liebe >= 2 && Math.random() < .3;   /* manchmal nur lange, gehaltene Akkorde */
      /* Gitarrenbegleitung */
      (pause ? [[0, .6]] : intim ? COMP[3] : COMP[comp]).forEach(([b, d], k) =>
        A.a.forEach((m, j) => n("gitarre", m, t0 + SCHLAG * b + j * (intim ? .05 : .012), { laut: k === 0 ? .16 : .11, dauer: SCHLAG * d, aus: .25, filter: { f: 2300 } })));
      /* Bass */
      (pause ? [[0, 0, .6]] : BASS[bass]).forEach(([b, iv, d]) => {
        const m = iv === "nah" ? naechst.b + wahl([-1, 1]) : A.b + iv;
        n("gitarre", m, t0 + SCHLAG * b, { laut: b === 0 ? .48 : .36, dauer: SCHLAG * d, aus: .25 });
      });
      if (!pause) {
        /* Besen / Shaker in Achteln, leicht geswingt */
        for (let s8 = 0; s8 < 8; s8++) spiel("shake", { zeit: t0 + SCHLAG * (s8 / 2) + (s8 % 2 ? .05 : 0) - jetzt(), laut: s8 % 4 === 2 ? .1 : s8 % 2 ? .055 : .035, bus: mb });
        /* Clave im B-Teil, leise Bassdrum ab dem dritten Teil */
        if (teil === "B") (bar % 2 ? [1, 2] : [0, 1.5, 3]).forEach(b => spiel("clave1", { zeit: t0 + SCHLAG * b - jetzt(), laut: .07, rate: 1.1, bus: mb }));
        if (pos >= 16) [0, 2].forEach(b => spiel("bd", { zeit: t0 + SCHLAG * b - jetzt(), laut: .14, bus: mb }));
        if (Math.random() < .15) spiel("snare1", { zeit: t0 + SCHLAG * 3.5 - jetzt(), laut: .05, bus: mb });
      }
      /* Klarinetten-Melodie: Phrasen über zwei Takte, dann ein Takt Luft */
      if (melodie && !pause && bar % 4 !== 3 && Math.random() < .85) {
        const sk = A.sk.map(m => m + 12).filter(m => m >= 70 && m <= 88), r = wahl(RHY);
        r.forEach((b, k) => {
          let ziel = letzteNote + wahl([-3, -2, -1, 1, 2, 2, 3, 4]);
          const best = sk.reduce((a, c) => Math.abs(c - ziel) < Math.abs(a - ziel) ? c : a, sk[0]);
          letzteNote = best;
          const dauer = (r[k + 1] != null ? r[k + 1] - b : 4 - b) * SCHLAG * .9;
          n("klar", best, t0 + SCHLAG * b, { laut: .085, dauer: Math.min(dauer, SCHLAG * 1.8), aus: .3, vibrato: { f: 5.4, tiefe: 20, ab: .12 }, filter: { f: 2800 } });
        });
      }
      /* Harfe als Übergang am Ende jedes Teils */
      if (bar === 7 && !pause) A.a.concat(A.a.map(m => m + 12)).forEach((m, k) => n("harfe", m + 12, t0 + SCHLAG * 2 + k * .1, { laut: .07 }));
      /* Chor bei viel Liebe */
      if (liebe >= 2 && !pause) A.a.forEach(m => n("aah", m + 12, t0, { laut: liebe >= 3 ? .08 : .055, ein: .5, dauer: SCHLAG * 3.6, aus: .5 }));
    }
    function ticken() {
      if (!musikAn || !ctx) return;
      while (naechsterTakt < jetzt() + .6) { taktPlanen(naechsterTakt, takt++); naechsterTakt += SCHLAG * 4; }
    }
    function musik(soll) {
      if (!ctx) return;
      if (soll && an) {
        if (!musikAn) { musikAn = true; naechsterTakt = jetzt() + .15; clearInterval(uhr); uhr = setInterval(ticken, 150); ticken(); }
        musikBus.gain.cancelScheduledValues(jetzt()); musikBus.gain.setTargetAtTime(musikLaut, jetzt(), .4);
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
      musikBus.gain.setValueAtTime(0, jetzt() + dauer); musikBus.gain.linearRampToValueAtTime(musikLaut, jetzt() + dauer + 1.2);
    }
    return {
      init, fx, musik, stille,
      liebe: n => { liebe = n; },
      tempo: f => { SCHLAG = .68 * f; },
      laut: () => ({ musik: musikLaut, effekte: effektLaut }),
      setzeLaut(art, v) {
        if (art === "musik") { musikLaut = v; schreib("imres-charme-musik", String(v)); if (ctx && musikAn) { musikBus.gain.cancelScheduledValues(jetzt()); musikBus.gain.setTargetAtTime(v, jetzt(), .1); } }
        else { effektLaut = v; schreib("imres-charme-effekte", String(v)); if (ctx) effektBus.gain.setTargetAtTime(v, jetzt(), .05); }
      },
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
  const zimmerEl = buehne.querySelector(".ch-zimmer"); zimmerEl.parentNode.insertBefore(funken, zimmerEl.nextSibling);
  const stempelEl = pracht.querySelector(".ch-stempel");
  buehne.appendChild(stempelEl); /* über dem Würfel */
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
  const SPRUCH_FLUG = { charmant: "🌹", kuehn: "💋", absurd: ["🐟", "🧀", "🦆", "🥔"], passend: "✨", geheim: ["📜", "💘"] };
  const effekte = {
    start() { Ton.init(); tonFx("auftritt"); Ton.musik(true); },
    nsc() { tonFx("auftritt"); stimmung("auftritt", 1200); liebeSetzen(); },
    spruch(art) {
      flug(SPRUCH_FLUG[art], art === "absurd" ? 3 : 1, "werfen");
      if (art === "kuehn") tonFx("wah"); else if (art === "absurd") { tonFx("boing"); tonFx("klapper"); } else if (art === "passend") tonFx("harfeHoch", 0, 67); else if (art === "geheim") { tonFx("zauber"); tonFx("schmacht"); } else tonFx("schmacht");
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
      if (art2 === "krit") { stimmung("disco", 3600); stempel(T || window.innerWidth <= 700 ? "NAT 20!" : "NATÜRLICHE 20!", "krit"); tonFx("disco"); flug(["✨", "💖", "⭐", "💋"], 22, "regen"); nscReagiert("verliebt", 3000); }
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


  /* ---------- Kamera: Nahaufnahmen von Spielleiter und NSC ---------- */
  const kameraEl = buehne.querySelector(".ch-kamera");
  let kamUhr = 0;
  function szenePunkt(x, y) { /* SVG-Koordinate → Pixel in der Bühne (slice bzw. meet) */
    const W = buehne.clientWidth, Hh = buehne.clientHeight, meet = window.innerWidth <= 700;
    const sk = meet ? Math.min(W / 400, Hh / 300) : Math.max(W / 400, Hh / 300);
    return [(W - 400 * sk) / 2 + x * sk, Hh - 300 * sk + y * sk];
  }
  function nscGesicht() {
    const W = nscImg.offsetWidth, Hh = nscImg.offsetHeight, nw = nscImg.naturalWidth || 1, nh = nscImg.naturalHeight || 1;
    const s = Math.min(W / nw, Hh / nh), bw = nw * s, bh = nh * s;
    const links = nscImg.offsetLeft + (W - bw) / 2, oben = nscImg.offsetTop + (Hh - bh);
    const f = { gundren: [.6, .2], buergermeister: [.62, .2], bugbear: [.4, .2], ilvara: [.5, .22], kuotoa: [.5, .33], horga: [.5, .2],
      hgraam: [.76, .16], themberchaud: [.32, .42], demogorgon: [.5, .14] }[nscImg.dataset.nsc] || [.5, .2];
    return [links + bw * f[0], oben + bh * f[1]];
  }
  function kamera(ziel, zoom, art) {
    if (ruhig) return;
    clearTimeout(kamUhr);
    kameraEl.classList.remove("schnitt", "schleich");
    if (art) kameraEl.classList.add(art);
    const spot = (x, y, z) => { buehne.style.setProperty("--sx", (x / buehne.clientWidth * 100).toFixed(1) + "%"); buehne.style.setProperty("--sy", (y / buehne.clientHeight * 100).toFixed(1) + "%"); buehne.style.setProperty("--zr", z); };
    if (!ziel || zoom <= 1) { kameraEl.style.transform = ""; buehne.classList.remove("kamera-nah"); const d = szenePunkt(270, 142); spot(d[0], d[1], 1); return; }
    const W = buehne.clientWidth, Hh = buehne.clientHeight;
    const [px, py] = ziel === "sl" ? szenePunkt(270, 142) : ziel === "nsc" ? nscGesicht() : (() => { const a = szenePunkt(270, 142), b = nscGesicht(); return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]; })();
    let tx = W / 2 - zoom * px, ty = Hh * .45 - zoom * py;
    tx = Math.min(0, Math.max(W - zoom * W, tx)); ty = Math.min(0, Math.max(Hh - zoom * Hh, ty));
    kameraEl.style.transform = "translate(" + tx.toFixed(1) + "px," + ty.toFixed(1) + "px) scale(" + zoom + ")";
    const d = szenePunkt(270, 142); spot(tx + zoom * d[0], ty + zoom * d[1], zoom);
    buehne.classList.toggle("kamera-nah", zoom >= 1.6);
  }
  /* Nahaufnahme für eine Weile, dann zurück in die Totale */
  function nah(ziel, zoom, ms, art) { kamera(ziel, zoom, art); kamUhr = setTimeout(() => kamera(null), ms); }
  /* ---------- Ablauf ---------- */
  /* Zeitplan: alles, was „gleich passiert“, läuft über plan() – so lässt es sich mit einem Tipp vorspulen */
  let plaene = [];
  const skipEl = document.createElement("div"); skipEl.className = "ch-skip"; buehne.appendChild(skipEl);
  function skipZeigen() { buehne.classList.toggle("kann-skip", plaene.length > 0 && ansicht === "spiel"); skipEl.textContent = t2().skip; }
  function plan(fn, ms) {
    const p = { fn, bis: performance.now() + ms };
    p.id = setTimeout(() => { plaene = plaene.filter(x => x !== p); fn(); skipZeigen(); }, ms);
    plaene.push(p); skipZeigen(); return p;
  }
  function planLeeren() { plaene.forEach(p => clearTimeout(p.id)); plaene = []; skipZeigen(); }
  function vorspulen() {
    if (!plaene.length) return false;
    if (S && S.peinlichBis && performance.now() < S.peinlichBis) { blase(slBlase, t2().aushalten, 0); return true; } /* die Stille wird erst ausgehalten */
    let n = 0;
    while (plaene.length && n++ < 40) {
      plaene.sort((a, b) => a.bis - b.bis);
      const p = plaene.shift(); clearTimeout(p.id); p.fn();
    }
    skipZeigen(); return true;
  }
  const geheimLesen = () => { try { return JSON.parse(lies("imres-charme-geheim", "{}")) || {}; } catch (_) { return {}; } };
  const klemm = (v, a, b) => Math.max(a, Math.min(b, v));
  function launeAendern(d) { if (S) S.laune = klemm((S.laune || 0) + d, -3, 3); }
  const LAUNE_ICON = ["😡", "😒", "😐", "🙂", "😍"];
  const launeStufe = l => l <= -3 ? 0 : l <= -1 ? 1 : l === 0 ? 2 : l <= 2 ? 3 : 4;
  function moment(p, text) { if (S && (!S.moment || p > S.moment.p)) S.moment = { p, text, wer: t().nsc[S.nsc.id].name }; }

  function neueSitzung() {
    planLeeren();
    S = { reihe: NSC.slice(), i: 0, geduld: 10, herzenGesamt: 0, erobert: 0, joker: { echo: 1, rex: 1, floete: 1 }, vorteil: false, bonus: false, ergebnisse: [],
      laune: 0, serie: 0, rausch: false, moment: null };
    ansicht = "spiel"; nscStart();
  }
  function nscStart(fortgesetzt) {
    const n = S.reihe[S.i];
    S.nsc = n;
    if (!fortgesetzt) { S.herzen = 0; S.zuege = 4; S.fertig = null; S.letzt = null; S.letzt2 = null; S.frage = null; S.frageGehabt = false; S.gruppeZahl = 0; S.geheimGenutzt = false; S.neuGeheim = false; S.angebot = spruchAngebot(n); }
    clearTimeout(wuerfelUhr); wuerfel.hidden = true; wuerfel.classList.remove("weg");
    nscZeigen(n); effekte.nsc();
    setTimeout(() => { if (S && S.nsc === n) { kamera("nsc", 1.9, "schnitt"); setTimeout(() => kamera(null, 1, "zieh"), 700); } }, 350);
    gesicht("grinsen", 1400);
    slSagt(t().sl.start, 2000);
    plan(() => { if (S && S.nsc === n) blase(nscBlase, S.frage ? n2(n.id).frage : t().nsc[n.id].intro, 0); }, 500);
    zeichnen();
  }
  /* drei Sprüche: einer charmant, einer kühn, einer absurd – manchmal statt charmant der passende; freigeschaltete Geheimsprüche obendrauf */
  function spruchAngebot(n) {
    const T = t().nsc[n.id], arten = ["charmant", "kuehn", "absurd"];
    if (Math.random() < .45) arten[0] = "passend";
    const l = arten.map(art => ({ art, idx: Math.floor(Math.random() * T[art].length) }));
    if (geheimLesen()[n.id] && !(S && S.geheimGenutzt)) l.unshift({ art: "geheim", idx: 0 });
    return l;
  }
  const sgFuer = (art, n) => art === "kuehn" ? n.sg + 4 : art === "passend" ? n.sg - 4 : art === "geheim" ? n.sg - 6 : n.sg;
  const spruchText = (art, idx, id) => art === "geheim" ? n2(id).geheim : t().nsc[id][art][idx % t().nsc[id][art].length];

  function wuerfeln(art, idx) {
    if (!S || S.fertig || S.wirft || S.frage) return;
    const n = S.nsc, T = t();
    S.wirft = true; S.spruch = spruchText(art, idx, n.id);
    if (art === "geheim") S.geheimGenutzt = true;
    blase(nscBlase, "Barradin: " + S.spruch, 0);
    nscBlase.classList.add("barradin");
    effekte.spruch(art);
    if (art === "absurd") { gesicht(zufall(["facepalm", "augenrollen", "unglaeubig"]), 1500); slSagt(T.sl.absurd, 1800); S.geduld = Math.max(0, S.geduld - 1); }
    else gesicht({ charmant: "skeptisch", kuehn: zufall(["fremdscham", "verkneifen"]), passend: "smirk", geheim: "unglaeubig" }[art] || "notiert");
    nah("nsc", 2.2, 1300);
    zeichnen();
    /* Manchmal wird es unangenehm still, bevor überhaupt gewürfelt wird */
    const p = art === "absurd" ? .55 : art === "kuehn" ? .38 : art === "geheim" ? 0 : .2;
    if (!S.peinlichZuletzt && Math.random() < p) { S.peinlichZuletzt = true; peinlichePause(() => rollen(art)); }
    else { S.peinlichZuletzt = false; rollen(art); }
  }
  function peinlichePause(weiterMit) {
    const n = S.nsc, T = t(), dauer = ruhig ? 1800 : 4200 + Math.random() * 3200;
    S.peinlichBis = performance.now() + 900 + 2000;
    launeAendern(-1);
    plan(() => {
      if (!S || S.nsc !== n) return;
      gesicht("starr"); sl.classList.add("starr"); effekte.peinlich(dauer / 1000);
      kamera("sl", 1.7, "schnitt"); requestAnimationFrame(() => requestAnimationFrame(() => kamera("sl", 2.5, "schleich")));
      blase(slBlase, "…", 0); slBlase.classList.add("punkte");
    }, 900);
    plan(() => { if (S && S.nsc === n) { nscBlase.classList.remove("barradin"); blase(nscBlase, "…", 0); nscBlase.classList.add("punkte"); kamera("nsc", 2.4, "schnitt"); } }, 2100);
    plan(() => {
      if (!S || S.nsc !== n) return;
      const satz = zufall(T.sl.peinlich);
      slBlase.classList.remove("punkte"); blase(slBlase, satz, 0); kamera("sl", 2.2, "schnitt"); gesicht(zufall(["starr", "fremdscham", "pokerface"])); sl.classList.add("starr");
      moment(2, "Barradin: " + S.spruch + " … " + satz);
      requestAnimationFrame(() => requestAnimationFrame(() => kamera("sl", 3, "schleich")));
    }, 3300);
    plan(() => {
      sl.classList.remove("starr"); slBlase.classList.remove("punkte"); nscBlase.classList.remove("punkte");
      kamera(null, 1, "zieh"); if (S) S.peinlichBis = 0;
      Ton.stille(0);
      if (S && S.nsc === n) { gesicht("seufzen", 1200); weiterMit(); }
    }, dauer + 900);
  }
  let wuerfelUhr = 0;
  function wuerfelZeigen(w, rollend) {
    clearTimeout(wuerfelUhr);
    wuerfel.hidden = false; wuerfel.className = "ch-wuerfel" + (rollend ? " rollt" : w === 20 ? " krit" : w === 1 ? " patzer" : "");
    if (!rollend) wuerfelUhr = setTimeout(() => { wuerfel.classList.add("weg"); wuerfelUhr = setTimeout(() => { wuerfel.hidden = true; wuerfel.classList.remove("weg"); }, 450); }, w === 20 || w === 1 ? 2600 : 1900);
  }
  function rollen(art) {
    /* Würfel rollt */
    const w1 = 1 + Math.floor(Math.random() * 20), w2 = 1 + Math.floor(Math.random() * 20);
    const w = S.vorteil ? Math.max(w1, w2) : w1; const vort = S.vorteil; S.vorteil = false;
    wuerfelZeigen(0, true);
    const zahl = wuerfel.querySelector("span");
    const flimmer = setInterval(() => { zahl.textContent = 1 + Math.floor(Math.random() * 20); }, 60);
    effekte.wurf();
    plan(() => {
      clearInterval(flimmer); zahl.textContent = w;
      wuerfelZeigen(w);
      auswerten(art, w, vort ? [w1, w2] : null);
    }, ruhig ? 200 : 1500);
  }
  function auswerten(art, w, beide) {
    const n = S.nsc, T = t(), NT = T.nsc[n.id], sg = sgFuer(art, n), summe = w + CHA;
    let herz = 0, art2;
    if (w === 20) { herz = 3; art2 = "krit"; }
    else if (w === 1) { herz = -1; art2 = "patzer"; S.geduld = Math.max(0, S.geduld - 2); }
    else if (art === "absurd") { if (w >= 10) { herz = 1; art2 = "erfolg"; } else { art2 = "misserfolg"; S.geduld = Math.max(0, S.geduld - 1); } }
    else if (summe >= sg) { herz = art === "kuehn" || art === "geheim" ? 2 : 1; art2 = "erfolg"; }
    else { art2 = "misserfolg"; if (art === "kuehn") S.geduld = Math.max(0, S.geduld - 1); }
    /* Barden-Rausch: dieser Spruch zählt doppelt */
    const imRausch = S.rausch;
    if (imRausch) { if (herz > 0) herz *= 2; S.rausch = false; buehne.classList.remove("rausch"); Ton.tempo(1); }
    S.herzen = Math.max(0, Math.min(3, S.herzen + herz));
    S.zuege--;
    S.letzt = { art2, w, summe, sg: art === "absurd" ? null : sg, beide, rausch: imRausch && herz > 0 }; S.letzt2 = null;
    /* Laune des Spielleiters */
    launeAendern(art2 === "krit" ? 2 : art2 === "erfolg" ? 1 : art2 === "patzer" ? 1 : (art === "absurd" || art === "kuehn") ? -1 : 0);
    /* Serie → Rausch */
    if (art2 === "erfolg" || art2 === "krit") S.serie = (S.serie || 0) + 1; else S.serie = 0;
    nscBlase.classList.remove("barradin");
    effekte.ergebnis(art2);
    if (art2 === "krit") {
      gesicht("schock", 1200, "verliebt"); slSagt(T.sl.krit); blase(nscBlase, NT.krit, 0);
      kamera("sl", 2.4, "schnitt"); kamUhr = setTimeout(() => { kamera("nsc", 1.8, "schnitt"); kamUhr = setTimeout(() => kamera(null, 1, "zieh"), 1400); }, 1200);
    }
    else if (art2 === "patzer") { gesicht("fremdscham", 1300, "lachtraenen"); slSagt(T.sl.patzer); blase(nscBlase, NT.patzer, 0); nah("sl", 2.2, 2000, "schnitt"); moment(3, NT.patzer); }
    else if (art2 === "erfolg") {
      gesicht(S.herzen >= 3 ? "verliebt" : zufall(["kichern", "errötet", "verkneifen", "grinsen"]), 2600); slSagt(T.sl.erfolg); blase(nscBlase, zufall(NT.ja), 0);
      if (Math.random() < .5) nah("nsc", 1.9, 1400); else nah("sl", 2.1, 1400);
    }
    else {
      gesicht(summe >= sg - 3 ? zufall(["notiert", "smirk"]) : zufall(["augenrollen", "pokerface", "genervt", "smirk"]), 2400); slSagt(T.sl.misserfolg);
      if (Math.random() < .45) nah("sl", 2, 1300);
      /* … und manchmal hängt die Antwort unangenehm lange in der Luft */
      if (S.herzen < 3 && S.zuege > 0 && S.geduld > 0 && Math.random() < .35 && !ruhig) {
        const nn = S.nsc; blase(nscBlase, zufall(T.sl.nachhall), 0); nscBlase.classList.add("punkte");
        plan(() => { if (S && S.nsc === nn) { nscBlase.classList.remove("punkte"); blase(nscBlase, zufall(NT.nein), 0); } }, 2600);
      } else blase(nscBlase, zufall(NT.nein), 0);
    }
    S.wirft = false;
    if (S.herzen >= 3) return nscEnde(true);
    if (S.zuege <= 0 || S.geduld <= 0) return nscEnde(false);
    S.angebot = spruchAngebot(n);
    nachDemWurf(art2);
    zeichnen();
  }
  /* Was nach einem Wurf noch passieren kann: Rausch, Laune, Folgefrage oder die Gruppe funkt dazwischen */
  function nachDemWurf(art2) {
    const n = S.nsc, T2 = t2();
    if (S.serie >= 3 && !S.rausch) {
      S.serie = 0; S.rausch = true;
      plan(() => { if (!S || S.nsc !== n) return; buehne.classList.add("rausch"); stempel(T2.rausch, "rausch"); slSagt(T2.rauschSl, 2400); gesicht("unglaeubig", 1800); Ton.tempo(.82); tonFx("fanfare"); zeichnen(); }, 1700);
      return;
    }
    if (S.laune >= 3) {
      S.laune = 1; S.vorteil = true;
      plan(() => { if (!S || S.nsc !== n) return; slSagt(T2.vorteil, 2600); gesicht("stolz", 1800); tonFx("harfeHoch", 0, 67); zeichnen(); }, 1800);
      return;
    }
    if (S.laune <= -3) { S.wirft = true; zeichnen(); plan(() => wuerdeWurf(n), 1800); return; }
    if (art2 === "erfolg" && !S.frageGehabt && Math.random() < .45) {
      S.frageGehabt = true; S.wirft = true; zeichnen();
      plan(() => {
        if (!S || S.nsc !== n) return;
        S.wirft = false; S.frage = ["gut", "mittel", "schlecht"].sort(() => Math.random() - .5);
        blase(nscBlase, n2(n.id).frage, 0); nah("nsc", 2, 1500); gesicht("skeptisch", 1500); tonFx("klapper");
        zeichnen();
      }, 2000);
      return;
    }
    if ((S.gruppeZahl || 0) < 2 && Math.random() < .24) { S.gruppeZahl = (S.gruppeZahl || 0) + 1; S.wirft = true; zeichnen(); plan(() => gruppeFunktDazwischen(n), 2100); }
  }
  function wuerdeWurf(n) {
    if (!S || S.nsc !== n) return;
    const T2 = t2();
    slSagt(T2.wuerde, 2400); gesicht("skeptisch"); nah("sl", 2.2, 1400, "schnitt");
    const w = 1 + Math.floor(Math.random() * 20), s = w + 2;
    wuerfelZeigen(0, true); const zahl = wuerfel.querySelector("span");
    const flimmer = setInterval(() => { zahl.textContent = 1 + Math.floor(Math.random() * 20); }, 60);
    tonFx("wuerfel");
    plan(() => {
      clearInterval(flimmer); zahl.textContent = w; wuerfelZeigen(w);
      S.laune = -1; S.wirft = false;
      S.letzt2 = { text: T2.wuerdeWurf(w, s), ok: s >= 12 };
      if (s >= 12) { slSagt(T2.wuerdeOk, 2200); gesicht("smirk", 1800); tonFx("harfeHoch", 0, 60); }
      else { slSagt(T2.wuerdeNein, 2400); gesicht("lachtraenen", 2000); tonFx("posaune", true); S.herzen = Math.max(0, S.herzen - 1); S.geduld = Math.max(0, S.geduld - 1); stimmung("frost", 1400); }
      if (S.geduld <= 0) return nscEnde(false);
      zeichnen();
    }, 1500);
  }
  const GRUPPE_ZEICHEN = { friedrich: ["🏹"], ezekiel: ["🗡️", "💰"], echo: ["❓", "🌿"], rex: ["🐕", "🦴"] };
  function gruppeFunktDazwischen(n) {
    if (!S || S.nsc !== n) return;
    const T2 = t2(), wer = zufall(["friedrich", "ezekiel", "echo", "rex"]), g = T2.gruppe[wer];
    slSagt(g.an, 2600); gesicht("unglaeubig", 1600); flug(GRUPPE_ZEICHEN[wer], 4, "aufsteigen"); tonFx(wer === "rex" ? "bellen" : "klapper");
    plan(() => {
      if (!S || S.nsc !== n) return;
      const gut = Math.random() < .55;
      blase(nscBlase, gut ? g.gut : g.schlecht, 0);
      slSagt(gut ? T2.gruppeSl.gut : T2.gruppeSl.schlecht, 2400);
      if (gut) { S.herzen = Math.min(3, S.herzen + 1); gesicht("kichern", 2000); nscReagiert("verliebt"); tonFx("kuss"); flug(["💗", "💕"], 5, "aufsteigen"); }
      else { S.herzen = Math.max(0, S.herzen - 1); if (wer === "ezekiel" || wer === "echo") S.geduld = Math.max(0, S.geduld - 1); gesicht("lachtraenen", 2200); nscReagiert("kalt", 900); tonFx("posaune", true); moment(2, g.schlecht); }
      S.wirft = false; liebeSetzen();
      if (S.herzen >= 3) return nscEnde(true);
      if (S.geduld <= 0) return nscEnde(false);
      zeichnen();
    }, 1900);
  }
  function antworten(k) {
    if (!S || !S.frage) return;
    const n = S.nsc, T2 = t2(), A = n2(n.id), NT = t().nsc[n.id];
    S.frage = null; S.wirft = true;
    blase(nscBlase, "Barradin: " + A[k], 0); nscBlase.classList.add("barradin");
    gesicht(k === "gut" ? "verkneifen" : k === "mittel" ? "pokerface" : "fremdscham", 1200);
    zeichnen();
    plan(() => {
      if (!S || S.nsc !== n) return;
      nscBlase.classList.remove("barradin");
      slSagt(T2.antwortSl[k], 2400);
      if (k === "gut") { S.herzen = Math.min(3, S.herzen + 1); launeAendern(1); blase(nscBlase, zufall(NT.ja), 0); gesicht("errötet", 2200); nscReagiert("verliebt"); tonFx("kuss"); tonFx("harfeHoch", .1); flug(["💗", "💖"], 6, "aufsteigen"); }
      else if (k === "mittel") { blase(nscBlase, zufall(T2.mittelNsc), 0); gesicht("smirk", 1800); }
      else { S.herzen = Math.max(0, S.herzen - 1); S.geduld = Math.max(0, S.geduld - 1); launeAendern(-1); blase(nscBlase, zufall(NT.nein), 0); gesicht("facepalm", 1400, "lachtraenen"); nscReagiert("kalt", 900); tonFx("posaune", true); stimmung("frost", 1400); moment(3, "Barradin: " + A[k]); }
      S.wirft = false; liebeSetzen();
      if (S.herzen >= 3) return nscEnde(true);
      if (S.geduld <= 0) return nscEnde(false);
      zeichnen();
    }, 1000);
  }
  function nscEnde(gewonnen) {
    const n = S.nsc, T = t(), NT = T.nsc[n.id];
    S.fertig = gewonnen ? "erobert" : "korb"; S.wirft = false; S.frage = null;
    if (S.rausch) { S.rausch = false; buehne.classList.remove("rausch"); Ton.tempo(1); }
    if (gewonnen) { S.erobert++; S.herzenGesamt += 3 + Math.max(0, S.zuege); }
    else { S.herzenGesamt += S.herzen; S.geduld = Math.max(0, S.geduld - 1); moment(1, NT.verloren); }
    S.ergebnisse.push({ id: n.id, ok: gewonnen });
    const buch = buchLesen(); if (gewonnen || !buch[n.id]) buch[n.id] = gewonnen ? "erobert" : "korb"; schreib("imres-charme-buch", JSON.stringify(buch));
    if (gewonnen) { const g = geheimLesen(); if (!g[n.id]) { g[n.id] = true; schreib("imres-charme-geheim", JSON.stringify(g)); S.neuGeheim = true; } }
    plan(() => {
      if (!S || S.nsc !== n) return;
      blase(nscBlase, gewonnen ? NT.sieg : NT.verloren, 0);
      slSagt(gewonnen ? T.sl.erobert : T.sl.korb, 2800);
      gesicht(gewonnen ? zufall(["verliebt", "schwitzt", "errötet"]) : zufall(["lachtraenen", "smirk", "lachen"]), 2800);
      if (gewonnen) { kamera("beide", 1.45, "zieh"); kamUhr = setTimeout(() => kamera(null, 1, "zieh"), 2600); glitzerhose(); } else nah("sl", 2.2, 1800, "schnitt");
      if (gewonnen) herzRegen();
      if (S.neuGeheim) flug("📜", 3, "aufsteigen");
      effekte.ende(gewonnen);
      zeichnen();
    }, 1500);
    zeichnen();
  }
  /* Bei einer Eroberung springt der Spielleiter auf, der Schirm kippt – und die Glitzerhose blitzt */
  function glitzerhose() {
    if (ruhig) return;
    buehne.classList.add("glitzer");
    setTimeout(() => { if (S && !S.ende) { slSagt(t2().glitzer, 2400); gesicht("errötet", 2000); } }, 2300);
    setTimeout(() => buehne.classList.remove("glitzer"), 3400);
  }
  function weiter() {
    if (!S) return;
    planLeeren();
    if (S.geduld <= 0) return sitzungEnde(true);
    S.i++;
    if (S.i >= S.reihe.length && !S.bonus && S.erobert >= 6) { S.bonus = true; S.reihe.push(BONUS); slSagt(t().bonusRuf, 3600); }
    if (S.i >= S.reihe.length) return sitzungEnde(false);
    nscStart();
  }
  function sitzungEnde(zu) {
    planLeeren();
    S.ende = zu ? "schirm" : "fertig";
    const alt = rekord(); S.neuRekord = S.herzenGesamt > alt; if (S.neuRekord) schreib("imres-charme-rekord", String(S.herzenGesamt));
    try { localStorage.removeItem("imres-charme-lauf"); } catch (_) {}
    nscImg.classList.remove("da");
    nscBlase.classList.remove("da");
    buehne.classList.remove("rausch"); Ton.tempo(1);
    effekte.schluss(zu); kamera(null);
    if (zu) { buehne.classList.add("zu"); gesicht("genervt"); slSagt(t().sl.schirm, 4000); }
    else gesicht("stolz", 3000, "grinsen");
    zeichnen();
  }
  function joker(k) {
    if (!S || S.fertig || S.wirft || S.frage || !S.joker[k]) return;
    const T = t(); S.joker[k] = 0;
    if (k === "echo") { S.zuege++; S.angebot = spruchAngebot(S.nsc); gesicht("augenrollen", 2200); slSagt(T.sl.echo); nah("sl", 2, 1400); blase(nscBlase, sprache() === "en" ? "Echo: \"Do you know Gundren?\" – \"…Who?\"" : "Echo: „Kennst du Gundren?“ – „…Wen?“", 0); S.geduld = Math.max(0, S.geduld - 1); launeAendern(-1); }
    if (k === "rex") { S.herzen = Math.min(3, S.herzen + 1); gesicht("kichern", 2200); slSagt(T.sl.rex); blase(nscBlase, sprache() === "en" ? "Rex wags his tail. Resistance is futile." : "Rex wedelt. Widerstand ist zwecklos.", 0); launeAendern(1); }
    if (k === "floete") { S.vorteil = true; gesicht("schock", 1400, "seufzen"); slSagt(T.sl.floete); nah("sl", 2.2, 1200, "schnitt"); blase(nscBlase, sprache() === "en" ? "A tiny Demogorgon appears above the flute. Very impressive." : "Über der Flöte erscheint ein winziger Demogorgon. Sehr beeindruckend.", 0); S.geduld = Math.max(0, S.geduld - 1); launeAendern(-1); }
    effekte.joker(k);
    if (S.herzen >= 3) return nscEnde(true);
    if (S.geduld <= 0 && !S.fertig) return nscEnde(false);
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

  /* ---------- Lauf speichern / fortsetzen ---------- */
  const LAUF = "imres-charme-lauf";
  const FELDER = ["i", "geduld", "herzenGesamt", "erobert", "joker", "vorteil", "bonus", "ergebnisse", "herzen", "zuege", "fertig", "letzt", "letzt2", "angebot", "laune", "serie", "geheimGenutzt", "frageGehabt", "frage", "gruppeZahl", "moment", "neuGeheim"];
  function speichern() {
    if (!S || S.ende || S.wirft) return;
    const d = { v: 1, ids: S.reihe.map(n => n.id) }; FELDER.forEach(k => { d[k] = S[k]; });
    schreib(LAUF, JSON.stringify(d));
  }
  function gespeichert() {
    try { const d = JSON.parse(lies(LAUF, "null")); return d && d.v === 1 && Array.isArray(d.ids) && d.i < d.ids.length ? d : null; } catch (_) { return null; }
  }
  function fortsetzen() {
    const d = gespeichert(); if (!d) return neueSitzung();
    planLeeren();
    S = { reihe: d.ids.map(id => id === BONUS.id ? BONUS : NSC.find(n => n.id === id)).filter(Boolean), rausch: false };
    FELDER.forEach(k => { S[k] = d[k]; });
    if (!S.reihe[S.i]) return neueSitzung();
    ansicht = "spiel"; nscStart(true);
  }

  /* ---------- Anleitung & Klangregler ---------- */
  const anleitungEl = document.createElement("div"); anleitungEl.className = "ch-anleitung"; anleitungEl.hidden = true; buehne.appendChild(anleitungEl);
  const reglerEl = document.createElement("div"); reglerEl.className = "ch-regler"; reglerEl.hidden = true; buehne.appendChild(reglerEl);
  let nachAnleitung = null;
  function anleitungZeigen(dann) {
    const T2 = t2(); nachAnleitung = dann || null;
    anleitungEl.innerHTML = '<div class="ch-karte-innen"><h4>' + esc(T2.anleitungTitel) + "</h4><ol>" + T2.anleitung.map(s => "<li>" + s + "</li>").join("") + "</ol>" +
      '<button type="button" class="tav-knopf ch-haupt" data-tun="anleitungZu" autofocus>' + esc(T2.los) + "</button></div>";
    anleitungEl.hidden = false;
  }
  function reglerZeigen() {
    const T2 = t2(), m = Math.round(Ton.laut().musik * 100), e = Math.round(Ton.laut().effekte * 100);
    reglerEl.innerHTML = '<div class="ch-karte-innen"><h4>🎚 ' + esc(T2.klang) + "</h4>" +
      '<label>' + esc(T2.musik) + ' <input type="range" min="0" max="100" step="5" value="' + m + '" data-regler="musik"></label>' +
      '<label>' + esc(T2.effekte) + ' <input type="range" min="0" max="100" step="5" value="' + e + '" data-regler="effekte"></label>' +
      '<label class="ch-leise"><input type="checkbox" data-regler="leise"' + (Ton.an() ? "" : " checked") + "> " + esc(T2.leise) + "</label>" +
      '<button type="button" class="tav-knopf" data-tun="reglerZu">' + esc(T2.fertig) + "</button></div>";
    reglerEl.hidden = false;
  }
  reglerEl.addEventListener("input", e => {
    const r = e.target.dataset.regler; if (!r) return;
    Ton.init();
    if (r === "musik") Ton.setzeLaut("musik", e.target.value / 100);
    if (r === "effekte") { Ton.setzeLaut("effekte", e.target.value / 100); }
  });
  reglerEl.addEventListener("change", e => {
    const r = e.target.dataset.regler;
    if (r === "effekte") tonFx("kuss");
    if (r === "leise") { Ton.init(); const soll = !e.target.checked; if (Ton.an() !== soll) Ton.schalten(); if (soll && ansicht === "spiel" && S && !S.ende) Ton.musik(true); zeichnen(); }
  });

  /* ---------- Teilen-Bild ---------- */
  function titelIndex() {
    if (!S) return 0;
    if (S.ergebnisse.some(e => e.id === "demogorgon" && e.ok)) return 5;
    const e = S.erobert; return e === 0 ? 0 : e <= 2 ? 1 : e <= 4 ? 2 : e <= 6 ? 3 : 4;
  }
  const bildLaden = src => new Promise(ok => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => ok(null); i.src = src; });
  function umbrechen(c, text, x, y, breite, zeile) {
    const woerter = String(text).split(" "); let z = "", yy = y;
    woerter.forEach(w => { const probe = z ? z + " " + w : w; if (c.measureText(probe).width > breite && z) { c.fillText(z, x, yy); z = w; yy += zeile; } else z = probe; });
    if (z) c.fillText(z, x, yy); return yy + zeile;
  }
  async function bildTeilen(knopf) {
    if (!S) return;
    const T = t(), T2 = t2(), W = 1080, H = 1350, cv = document.createElement("canvas"); cv.width = W; cv.height = H;
    const c = cv.getContext("2d");
    if (knopf) knopf.disabled = true;
    const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, "#2a1530"); g.addColorStop(.6, "#1a1020"); g.addColorStop(1, "#120c14");
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    const r = c.createRadialGradient(W / 2, 360, 40, W / 2, 360, 620); r.addColorStop(0, "rgba(255,90,160,.35)"); r.addColorStop(1, "rgba(255,90,160,0)");
    c.fillStyle = r; c.fillRect(0, 0, W, H);
    c.textAlign = "center"; c.fillStyle = "#e0a046"; c.font = "600 34px Georgia, serif"; c.fillText(T.titel.toUpperCase(), W / 2, 96);
    c.fillStyle = "#ffd0e0"; c.font = "italic 30px Georgia, serif"; c.fillText(sprache() === "en" ? "Barradin is …" : "Barradin ist …", W / 2, 170);
    c.fillStyle = "#ff8ac0"; c.font = "bold 66px Georgia, serif"; umbrechen(c, T2.titel[titelIndex()], W / 2, 250, 960, 74);
    c.fillStyle = "#f6ecd6"; c.font = "40px Georgia, serif"; c.fillText(T2.erobertVon(S.erobert, S.ergebnisse.length) + " · " + S.herzenGesamt + " ♥", W / 2, 420);
    /* NSC-Reihe */
    const bilder = await Promise.all(S.ergebnisse.map(e => bildLaden((e.id === "demogorgon" ? BONUS : NSC.find(x => x.id === e.id)).bild)));
    const n = S.ergebnisse.length, gr = Math.min(170, Math.floor(980 / Math.max(1, Math.ceil(n / 2)))), proZeile = Math.ceil(n / 2) || 1;
    S.ergebnisse.forEach((e, k) => {
      const zeile = Math.floor(k / proZeile), spalte = k % proZeile, inZeile = zeile === 0 ? Math.min(proZeile, n) : n - proZeile;
      const x0 = W / 2 - inZeile * (gr + 14) / 2 + spalte * (gr + 14), y0 = 480 + zeile * (gr + 40);
      c.fillStyle = e.ok ? "rgba(255,90,160,.18)" : "rgba(255,255,255,.05)"; c.fillRect(x0, y0, gr, gr);
      c.strokeStyle = e.ok ? "#ff8ac0" : "#55485a"; c.lineWidth = 3; c.strokeRect(x0, y0, gr, gr);
      const im = bilder[k];
      if (im) { const s = Math.min((gr - 16) / im.width, (gr - 16) / im.height), bw = im.width * s, bh = im.height * s; c.globalAlpha = e.ok ? 1 : .45; c.drawImage(im, x0 + (gr - bw) / 2, y0 + gr - 8 - bh, bw, bh); c.globalAlpha = 1; }
      c.font = "bold 44px Georgia, serif"; c.fillStyle = e.ok ? "#ff5a8a" : "#9fc4ff"; c.fillText(e.ok ? "♥" : "✗", x0 + gr - 26, y0 + 46);
    });
    /* Peinlichster Moment */
    const yM = 480 + 2 * (gr + 40) + 30;
    c.font = "italic 36px Georgia, serif";
    const zeilen = (() => { let z = "", n = 1; String(S.moment ? S.moment.text : t2().keinMoment).split(" ").forEach(w => { const p = z ? z + " " + w : w; if (c.measureText(p).width > W - 220 && z) { n++; z = w; } else z = p; }); return n; })();
    const hM = Math.min(H - 140 - yM, 150 + zeilen * 46);
    c.fillStyle = "rgba(0,0,0,.35)"; c.fillRect(70, yM, W - 140, hM); c.strokeStyle = "rgba(224,160,70,.6)"; c.lineWidth = 2; c.strokeRect(70, yM, W - 140, hM);
    c.fillStyle = "#e0a046"; c.font = "600 30px Georgia, serif"; c.fillText(T2.peinlich.toUpperCase(), W / 2, yM + 56);
    c.fillStyle = "#f6ecd6"; c.font = "italic 36px Georgia, serif";
    const m = S.moment;
    let yy = umbrechen(c, m ? m.text : T2.keinMoment, W / 2, yM + 116, W - 220, 46);
    if (m) { c.fillStyle = "#b8a890"; c.font = "28px Georgia, serif"; c.fillText("— " + m.wer, W / 2, Math.min(yy + 6, yM + hM - 24)); }
    c.fillStyle = "#e0a046"; c.font = "600 32px Georgia, serif"; c.fillText("imrestales.de", W / 2, H - 60);
    cv.toBlob(async blob => {
      if (knopf) knopf.disabled = false;
      if (!blob) return;
      const datei = new File([blob], "wuerfel-auf-verfuehren.png", { type: "image/png" });
      try {
        if (navigator.canShare && navigator.canShare({ files: [datei] })) { await navigator.share({ files: [datei], text: T2.teilenText }); return; }
      } catch (_) { return; }
      const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = datei.name; document.body.appendChild(a); a.click();
      setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 2000);
    }, "image/png");
  }

  /* ---------- Zeichnen ---------- */
  function zeichnen() {
    const T = t(), T2 = t2();
    $(".ch-label").textContent = T.label; $(".ch-titel").textContent = T.titel; $(".ch-text").textContent = T.text;
    const kopf = $(".ch-kopfzeile");
    kopf.hidden = ansicht !== "spiel";
    skipZeigen();
    if (ansicht === "spiel" && S) {
      $(".ch-geduld-txt").textContent = T.geduld;
      const tk = $(".ch-ton"); tk.innerHTML = Ton.an() ? '🎚<span class="ton-txt"> ' + esc(T2.klang) + "</span>" : "🔇"; tk.setAttribute("aria-label", T2.klang);
      liebeSetzen();
      const bar = $(".ch-geduld-bar i"); bar.style.width = (S.geduld * 10) + "%"; bar.parentNode.classList.toggle("knapp", S.geduld <= 3);
      $(".ch-herzen").innerHTML = [0, 1, 2].map(i => '<span class="' + (i < S.herzen ? "voll" : "") + '">♥</span>').join("");
      const ls = launeStufe(S.laune || 0), le = $(".ch-laune");
      le.textContent = LAUNE_ICON[ls]; le.title = T2.launeLabel + ": " + T2.laune[ls]; le.dataset.stufe = ls;
    }
    buehne.classList.toggle("laeuft", ansicht === "spiel" && !!S && !S.ende);
    root.classList.toggle("ch-laeuft", ansicht === "spiel" && !!S);
    if (ansicht === "buch") return buchZeichnen();
    if (ansicht === "start" || !S) {
      buehne.classList.remove("zu"); nscImg.hidden = true; wuerfel.hidden = true; nscBlase.classList.remove("da");
      const r = rekord(), g = gespeichert();
      tafel.innerHTML = '<div class="ch-knoepfe">' +
        (g ? '<button type="button" class="tav-knopf ch-haupt haupt" data-tun="fortsetzen">' + esc(T2.fortsetzen(g.i + 1, g.ids.length)) + "</button>" : "") +
        '<button type="button" class="tav-knopf' + (g ? "" : " ch-haupt haupt") + '" data-tun="start">' + esc(T.start) + "</button>" +
        '<button type="button" class="tav-knopf" data-tun="buch">' + esc(T.buch) + "</button>" +
        '<button type="button" class="tav-knopf" data-tun="anleitung">' + esc(T2.anleitungKnopf) + "</button></div>" +
        (r ? '<p class="ch-klein">' + esc(T.rekord(r)) + "</p>" : "");
      return;
    }
    const n = S.nsc, NT = T.nsc[n.id];
    if (S.ende) {
      wuerfel.hidden = true;
      tafel.innerHTML = '<p class="ch-ergebnis">' + esc(S.ende === "schirm" ? T.schirmZu : T.ende) + "</p>" +
        '<p class="ch-rang">„' + esc(T2.titel[titelIndex()]) + '“</p>' +
        '<p class="ch-bilanz">' + esc(T.bilanz(S.erobert, S.ergebnisse.length, S.herzenGesamt)) + "</p>" +
        '<p class="ch-klein">' + esc(S.neuRekord ? T.neuRekord : T.rekord(rekord())) + "</p>" +
        '<div class="ch-reihe">' + S.ergebnisse.map(e => '<span class="' + (e.ok ? "ok" : "") + '" title="' + esc(T.nsc[e.id].name) + '"><img src="' + esc((e.id === "demogorgon" ? BONUS : NSC.find(x => x.id === e.id)).bild) + '" alt="">' + (e.ok ? "♥" : "✗") + "</span>").join("") + "</div>" +
        '<div class="ch-knoepfe"><button type="button" class="tav-knopf ch-haupt haupt" data-tun="start">' + esc(T.nochmal) + '</button><button type="button" class="tav-knopf" data-tun="teilen">' + esc(T2.teilen) + '</button><button type="button" class="tav-knopf" data-tun="buch">' + esc(T.buch) + "</button></div>";
      return;
    }
    let html = '<div class="ch-nsc-kopf"><b>' + esc(NT.name) + "</b>" + (S.fertig ? "" : '<em>' + esc(T.sprueche(S.zuege)) + "</em>") + "<span>" + esc(T.aufgabe) + ": " + esc(NT.aufgabe) + "</span></div>";
    if (!S.letzt) html += '<p class="ch-wurf leer">&nbsp;</p>';
    if (S.letzt) {
      const L = S.letzt;
      html += '<p class="ch-wurf ' + L.art2 + '">' + esc(L.art2 === "krit" ? T.krit : L.art2 === "patzer" ? T.patzer : L.art2 === "erfolg" ? T.erfolg : T.misserfolg) +
        " <small>" + esc(T.wurf(L.beide ? L.beide.join("/") + " → " + L.w : L.w, CHA, L.summe)) + (L.sg ? " " + esc(T.gegen(L.sg)) : "") + (L.rausch ? " · ×2 🔥" : "") + "</small></p>";
    }
    if (S.letzt2) html += '<p class="ch-wurf ' + (S.letzt2.ok ? "erfolg" : "patzer") + '"><small>' + esc(S.letzt2.text) + "</small></p>";
    if (S.rausch) html += '<p class="ch-hinweis rausch">' + esc(T2.rauschInfo) + "</p>";
    else if (S.serie >= 2) html += '<p class="ch-hinweis">' + esc(T2.serie(S.serie)) + "</p>";
    if (S.fertig) {
      html += '<p class="ch-ergebnis ' + S.fertig + '">' + esc(S.fertig === "erobert" ? T.erobert : T.korb) + "</p>" +
        (S.neuGeheim ? '<p class="ch-hinweis geheim">' + esc(T2.geheimNeu) + "</p>" : "") +
        '<div class="ch-knoepfe"><button type="button" class="tav-knopf ch-haupt haupt" data-tun="weiter">' + esc(S.geduld <= 0 || S.i >= S.reihe.length - 1 && !(S.erobert >= 6 && !S.bonus) ? T.ende : T.weiter) + "</button></div>";
    } else if (S.frage) {
      const A = n2(n.id);
      html += '<p class="ch-frage">' + esc(T2.frageLabel) + "</p>" +
        '<div class="ch-sprueche">' + S.frage.map(k => '<button type="button" class="ch-spruch ch-antwort" data-antwort="' + k + '">' + esc(A[k]) + "</button>").join("") + "</div>";
    } else {
      html += '<div class="ch-sprueche">' + S.angebot.map(a => '<button type="button" class="ch-spruch art-' + a.art + '" data-art="' + a.art + '" data-idx="' + a.idx + '"' + (S.wirft ? " disabled" : "") + ">" +
          '<span class="ch-art">' + esc(a.art === "geheim" ? "📜 " + T2.geheim : T.arten[a.art]) + " · " + esc(a.art === "geheim" ? T2.geheimInfo(sgFuer(a.art, n)) : T.artInfo[a.art](sgFuer(a.art, n))) + (S.vorteil && a.art !== "absurd" ? " · ⬆ Vorteil" : "") + "</span>" + esc(spruchText(a.art, a.idx, n.id)) + "</button>").join("") + "</div>" +
        '<div class="ch-joker">' + ["echo", "rex", "floete"].map(k => '<button type="button" class="ch-jk" data-joker="' + k + '"' + (S.joker[k] && !S.wirft ? "" : " disabled") + ' title="' + esc(T.jokerInfo[k]) + '">' +
          '<span class="jk-lang">' + esc(T.joker[k]) + '</span><span class="jk-kurz">' + esc(T.jokerKurz[k]) + "</span><small>" + esc(T.jokerInfo[k]) + "</small></button>").join("") + "</div>";
    }
    tafel.innerHTML = html;
    padMarkieren();
    speichern();
    passen();
  }
  /* Vollbild: Bühne so groß wie möglich, Tafel bleibt darunter ganz sichtbar */
  const handy = () => window.innerWidth <= 700;
  /* Handy: Szene wird ganz gezeigt (meet) statt beschnitten (slice); --sz = Höhe der Szene */
  function szeneMessen() {
    const h = handy();
    root.querySelectorAll(".ch-zimmer, .ch-vorne").forEach(svg => svg.setAttribute("preserveAspectRatio", h ? "xMidYMax meet" : "xMidYMax slice"));
    if (h) buehne.style.setProperty("--sz", Math.round(Math.min(buehne.clientHeight, buehne.clientWidth * .75)) + "px");
    else buehne.style.removeProperty("--sz");
  }
  if ("ResizeObserver" in window) new ResizeObserver(() => szeneMessen()).observe(buehne);
  function passen() {
    szeneMessen();
    if (!root.classList.contains("tav-voll")) { buehne.style.height = buehne.style.width = ""; return; }
    const cs = getComputedStyle(root), innen = root.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
    const breite = root.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    const tafelH = tafel.offsetHeight + parseFloat(getComputedStyle(tafel).marginTop || 0);
    let h = Math.max(150, Math.floor(innen - tafelH - 4));
    if (handy()) h = Math.min(h, Math.round(breite * .75 + 74));
    buehne.style.height = h + "px";
    buehne.style.width = Math.min(breite, Math.round(h * 1.75), 1100) + "px";
  }
  window.addEventListener("resize", () => requestAnimationFrame(passen));
  new MutationObserver(() => requestAnimationFrame(passen)).observe(root, { attributes: true, attributeFilter: ["class"] });
  function buchZeichnen() {
    const T = t(), T2 = t2(), B = buchLesen(), G = geheimLesen(), alle = NSC.concat([BONUS]);
    nscImg.hidden = true; wuerfel.hidden = true; nscBlase.classList.remove("da");
    tafel.innerHTML = '<h4 class="ch-buch-titel">' + esc(T.buchTitel) + '</h4><p class="ch-klein">' + esc(T.buchText) + "</p>" +
      '<div class="ch-buch">' + alle.map(n => {
        const st = B[n.id] || "offen", geheim = n.id === "demogorgon" && st === "offen";
        return '<div class="ch-seite ' + st + '">' + (geheim ? '<span class="ch-geheim">?</span>' : '<img src="' + esc(n.bild) + '" alt="">') +
          "<b>" + esc(geheim ? "???" : T.nsc[n.id].name) + "</b><small>" + esc(T.buchStand[st]) + "</small>" +
          (G[n.id] ? '<i class="ch-geheimspruch">' + esc(T2.geheimBuch) + esc(n2(n.id).geheim) + "</i>" : "") + "</div>";
      }).join("") + "</div>" +
      '<div class="ch-knoepfe"><button type="button" class="tav-knopf haupt" data-tun="zurueck">' + esc(T.zurueck) + "</button></div>";
  }

  /* ---------- Bedienung ---------- */
  function starten(fort) {
    buehne.classList.remove("zu"); effekte.start();
    if (fort) fortsetzen(); else neueSitzung();
    const vk = root.querySelector(".tav-voll-knopf");
    if (handy() && vk && !root.classList.contains("tav-voll")) vk.click(); else einpassen();
  }
  root.addEventListener("click", e => {
    const b = e.target.closest("button"); if (!b || b.disabled) return;
    if (b.closest(".tav-voll-knopf")) return;
    if (b.dataset.art) { wuerfeln(b.dataset.art, +b.dataset.idx); return; }
    if (b.dataset.antwort) { antworten(b.dataset.antwort); return; }
    if (b.dataset.joker) { joker(b.dataset.joker); return; }
    const tun = b.dataset.tun;
    if (tun === "start" || tun === "fortsetzen") {
      const fort = tun === "fortsetzen";
      if (!lies("imres-charme-anleitung")) {
        schreib("imres-charme-anleitung", "1");
        /* Handy: erst ins Vollbild, dann die Anleitung über der Bühne */
        const vk = root.querySelector(".tav-voll-knopf");
        if (handy() && vk && !root.classList.contains("tav-voll")) vk.click(); else einpassen();
        Ton.init();
        anleitungZeigen(() => starten(fort));
      }
      else starten(fort);
    }
    else if (tun === "anleitung") anleitungZeigen();
    else if (tun === "anleitungZu") { anleitungEl.hidden = true; const f = nachAnleitung; nachAnleitung = null; if (f) f(); }
    else if (tun === "ton") { Ton.init(); reglerEl.hidden ? reglerZeigen() : (reglerEl.hidden = true); }
    else if (tun === "reglerZu") { reglerEl.hidden = true; zeichnen(); }
    else if (tun === "weiter") weiter();
    else if (tun === "teilen") bildTeilen(b);
    else if (tun === "buch") { ansicht = "buch"; Ton.musik(false); zeichnen(); }
    else if (tun === "zurueck") { ansicht = S && !S.ende ? "spiel" : "start"; if (ansicht === "start") S = null; else Ton.musik(true); zeichnen(); }
  });
  /* Tipp auf die Bühne: vorspulen – oder, wenn nichts läuft, schaut der Spielleiter auf */
  buehne.addEventListener("click", e => {
    if (e.target.closest("button, input, label, .ch-regler, .ch-anleitung")) return;
    if (ansicht === "spiel" && vorspulen()) return;
    if (e.target.closest(".ch-zimmer")) gesicht(zufall(["grinsen", "schock", "errötet", "genervt", "kichern", "verliebt", "skeptisch", "augenrollen", "smirk", "fremdscham"]), 1400);
  });
  /* Tastatur: Leertaste spult vor */
  root.addEventListener("keydown", e => { if (e.key === " " && ansicht === "spiel" && !/INPUT|BUTTON/.test(e.target.tagName) && vorspulen()) e.preventDefault(); });
  /* Handy: Bühne direkt unter die Kopfleiste schieben, damit alles auf einen Bildschirm passt */
  function einpassen() {
    if (root.classList.contains("tav-voll") || window.innerWidth > 700) return;
    const kopf = document.querySelector("header.top");
    root.style.setProperty("--ch-oben", ((kopf ? kopf.getBoundingClientRect().height : 56) + 6) + "px");
    requestAnimationFrame(() => buehne.scrollIntoView({ block: "start", behavior: ruhig ? "auto" : "smooth" }));
  }

  /* ---------- Xbox-Controller (controller.js ruft root._pad) ---------- */
  let padWahl = -1;
  const padOptionen = () => Array.from(tafel.querySelectorAll("[data-art], [data-antwort], [data-tun='weiter']")).filter(b => !b.disabled);
  function padMarkieren() {
    tafel.querySelectorAll(".pad-wahl").forEach(b => b.classList.remove("pad-wahl"));
    if (padWahl < 0) return;
    const l = padOptionen(); if (!l.length) return;
    padWahl = Math.min(padWahl, l.length - 1); l[padWahl].classList.add("pad-wahl");
  }
  root._pad = {
    aktiv: () => ansicht === "spiel" && !!S && !S.ende && anleitungEl.hidden && reglerEl.hidden,
    wahl(i) { padWahl = i; padMarkieren(); },
    bewegen(d) { const l = padOptionen(); if (!l.length) return; padWahl = padWahl < 0 ? 0 : (padWahl + d + l.length) % l.length; padMarkieren(); },
    ok() {
      if (vorspulen()) return;
      const l = padOptionen(); if (!l.length) return;
      if (padWahl < 0) padWahl = 0;
      const b = l[Math.min(padWahl, l.length - 1)]; if (b) b.click();
      requestAnimationFrame(padMarkieren);
    },
    skip() { vorspulen(); },
    joker(k) { joker(k); },
    regler() { Ton.init(); reglerZeigen(); }
  };

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
.ch-wuerfel { transition: opacity .4s ease, transform .4s ease; }
.ch-wuerfel.weg { opacity: 0; transform: scale(.6); }
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
  .ch-ergebnis { font-size: 1.25rem; }
  .ch-buch { grid-template-columns: repeat(3, 1fr); gap: .35rem; }
  .ch-seite { padding: .35rem .25rem; }
  .ch-seite img, .ch-geheim { height: 56px; }
  .ch-seite b { font-size: .78rem; }
  .ch-seite small { font-size: .64rem; }
}
@media (max-width: 700px) and (max-height: 780px) {
  .ch-spruch { font-size: .8rem; padding: .32rem .55rem; }
  .ch-nsc-kopf span { font-size: .74rem; }
}
/* Vollbild: Größe der Bühne rechnet passen() aus – sie füllt den Platz über der Tafel */
.charme.tav-voll { display: block; padding-top: 3rem; padding-bottom: .6rem; }
.charme.tav-voll > .ch-buehne { aspect-ratio: auto; margin-inline: auto; }
.charme.tav-voll > .ch-tafel { max-width: 1100px; margin-inline: auto; }
@media (max-width: 700px) { .charme.tav-voll { padding: 3rem .5rem .5rem; display: flex !important; flex-direction: column; justify-content: center; } }
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
  background: radial-gradient(circle at var(--sx, 67%) var(--sy, 42%), transparent 0 calc(var(--zr, 1) * 11%), rgba(0,0,0,.72) calc(var(--zr, 1) * 22%)); }
.ch-buehne[data-mood="peinlich"] .ch-kette .kb { animation: none; opacity: .15; }
.ch-buehne[data-mood="peinlich"] .ch-funken { opacity: 0; transition: opacity 1s; }
/* Patzer: alles grau, Wackeln, Regenwolke */
.ch-buehne[data-mood="patzer"] .ch-kamera > svg, .ch-buehne[data-mood="patzer"] .ch-nsc { filter: grayscale(.85) brightness(.75); transition: filter .3s; }
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


/* ===== Mimik: neue Gesichtsteile, Posen, Sprechen ===== */
.ch-sl[data-b="skeptisch"] .b-skeptisch, .ch-sl[data-b="traurig"] .b-traurig,
.ch-sl[data-a="herz"] .a-herz, .ch-sl[data-a="x"] .a-x, .ch-sl[data-a="rollen"] .a-rollen, .ch-sl[data-a="skeptisch"] .a-skeptisch, .ch-sl[data-a="lachzu"] .a-lachzu,
.ch-sl[data-m="zaehne"] .m-zaehne, .ch-sl[data-m="wellig"] .m-wellig, .ch-sl[data-m="smirk"] .m-smirk, .ch-sl[data-m="gepresst"] .m-gepresst, .ch-sl[data-m="strich"] .m-strich,
.ch-sl[data-h="mund"] .h-mund, .ch-sl[data-h="kinn"] .h-kinn { display: inline; }
.ch-sl[data-h="mund"] .arm-r, .ch-sl[data-h="kinn"] .arm-r { display: none; }
.ch-traenen, .ch-backen { display: none; }
.ch-sl.traenen .ch-traenen, .ch-sl.backen .ch-backen { display: inline; }
.ch-sl.traenen .ch-traenen path { animation: chTraene .8s ease-in infinite; transform-box: fill-box; }
.ch-sl.traenen .ch-traenen .tr2 { animation-delay: .35s; }
@keyframes chTraene { from { transform: translate(0, 0); opacity: 1; } to { transform: translate(0, 16px); opacity: 0; } }
.ch-sl.backen .ch-backen { animation: chBacken .9s ease-in-out infinite; transform-box: fill-box; transform-origin: center; }
@keyframes chBacken { 50% { transform: scale(1.12); } }
.a-herz { animation: chHerzAuge .6s ease-in-out infinite; transform-box: fill-box; transform-origin: center; }
@keyframes chHerzAuge { 50% { transform: scale(1.25); } }
.ch-sl.zucken .ch-augen { animation: chZucken 1.3s infinite; transform-box: fill-box; transform-origin: 30% 50%; }
@keyframes chZucken { 0%, 86%, 100% { transform: none; } 88% { transform: translate(.6px, -.4px) scaleY(.82); } 90% { transform: none; } 92% { transform: translate(-.4px, .3px) scaleY(.88); } 94% { transform: none; } }
.ch-sl.rot .ch-roete ellipse { opacity: .55; }
/* Kopfhaltung */
.ch-pose { transition: transform .35s cubic-bezier(.3,1.4,.5,1); transform-box: view-box; transform-origin: 270px 178px; }
.ch-sl[data-p="vor"] .ch-pose { transform: translateY(3px) scale(1.07); }
.ch-sl[data-p="zurueck"] .ch-pose { transform: translateY(-5px) scale(.96); }
.ch-sl[data-p="links"] .ch-pose { transform: rotate(-8deg); }
.ch-sl[data-p="rechts"] .ch-pose { transform: rotate(7deg); }
.ch-sl[data-p="ducken"] .ch-pose { transform: translateY(7px) rotate(-3deg); }
/* Sprechen: Mund klappt auf und zu */
.ch-sl.spricht .ch-mund > * { display: none !important; }
.ch-sl.spricht .ch-mund .m-o { display: inline !important; animation: chSprechen .16s ease-in-out infinite alternate; transform-box: fill-box; transform-origin: center; }
@keyframes chSprechen { from { transform: scaleY(.25) scaleX(1.2); } to { transform: scaleY(.85); } }
/* ===== Kamera ===== */
.ch-kamera { position: absolute; inset: 0; transform-origin: 0 0; will-change: transform; transition: transform .55s cubic-bezier(.4,0,.2,1); }
.ch-kamera.schnitt { transition: none; }
.ch-kamera.schleich { transition: transform 3.2s cubic-bezier(.3,0,.6,1); }
.ch-kamera.zieh { transition: transform 1.4s cubic-bezier(.2,.7,.2,1); }
.ch-buehne.kamera-nah::before { content: ""; position: absolute; inset: 0; z-index: 6; pointer-events: none; box-shadow: inset 0 0 60px 20px rgba(0,0,0,.65); }
@media (prefers-reduced-motion: reduce) { .ch-kamera { transition: none !important; } .ch-pose { transition: none; } }

/* ===== Laune, Rausch, Folgefragen, Geheimsprüche, Anleitung, Regler, Vorspulen, Glitzerhose, Controller ===== */
.ch-laune { pointer-events: auto; align-self: end; font-size: clamp(1rem, 3.6vw, 1.4rem); line-height: 1; filter: drop-shadow(0 1px 2px #000); transition: transform .3s; cursor: help; }
.ch-laune[data-stufe="0"] { animation: chWut .5s ease-in-out infinite; }
.ch-laune[data-stufe="4"] { animation: chHerzSchlag 1s ease-in-out infinite; }
@keyframes chWut { 25% { transform: translateX(-1.5px) rotate(-6deg); } 75% { transform: translateX(1.5px) rotate(6deg); } }
.ch-kopfzeile { align-items: end; }
.ch-hinweis { margin: 0; font-size: .82rem; color: #ffb36a; font-weight: 600; }
.ch-hinweis.rausch { color: #ffd27a; text-shadow: 0 0 10px rgba(255,160,60,.6); animation: chPuls .8s ease-in-out infinite; }
.ch-hinweis.geheim { color: #ffd27a; }
.ch-frage { margin: 0; font-size: .78rem; letter-spacing: .12em; text-transform: uppercase; color: var(--ember); }
.ch-antwort { border-style: dashed; }
.ch-spruch.art-geheim { border-color: rgba(255,210,122,.7); background: linear-gradient(90deg, rgba(255,210,122,.12), rgba(255,255,255,.02)); }
.ch-spruch.art-geheim .ch-art { color: #ffd27a; }
.ch-rang { margin: 0; font-family: var(--name); font-size: 1.25rem; color: #ff8ac0; }
.ch-geheimspruch { display: block; font-size: .66rem; line-height: 1.25; color: #7a4a10; font-style: italic; }
/* Barden-Rausch: goldener Rand, alles etwas schneller */
.ch-buehne.rausch { box-shadow: inset 0 0 0 3px rgba(255,190,80,.85), inset 0 0 40px rgba(255,150,40,.45); }
.ch-buehne.rausch .ch-kette .kb { animation-duration: .5s; }
.ch-buehne.rausch .ch-funken i { background: #ffd27a; box-shadow: 0 0 8px 3px rgba(255,180,60,.7); animation-duration: 3s; }
.ch-stempel.rausch { color: #ffd27a; background: rgba(120,50,0,.55); }
/* Vorspulen */
.ch-skip { position: absolute; z-index: 9; left: 50%; bottom: 13%; transform: translateX(-50%); padding: .2rem .6rem; border-radius: 999px; background: rgba(0,0,0,.55);
  color: rgba(255,227,166,.85); font-size: .7rem; letter-spacing: .04em; white-space: nowrap; pointer-events: none; opacity: 0; transition: opacity .3s; }
.ch-buehne.kann-skip .ch-skip { opacity: 1; transition-delay: .9s; }
.ch-buehne.kann-skip { cursor: pointer; }
/* Anleitung & Regler als Karte über der Bühne */
.ch-anleitung, .ch-regler { position: absolute; inset: 0; z-index: 12; display: grid; place-items: center; padding: .6rem; background: rgba(10,6,12,.72); }
.ch-anleitung[hidden], .ch-regler[hidden] { display: none; }
.ch-karte-innen { width: min(30rem, 100%); max-height: 100%; overflow: auto; display: grid; gap: .55rem; padding: .9rem 1rem; border: 1px solid rgba(224,160,70,.6); background: #1d1520; color: var(--vellum); box-shadow: 0 10px 30px rgba(0,0,0,.6); }
.ch-karte-innen h4 { margin: 0; font-family: var(--name); font-weight: 400; font-size: 1.3rem; }
.ch-karte-innen ol { margin: 0; padding-left: 1.2rem; display: grid; gap: .35rem; font-size: .9rem; line-height: 1.4; }
.ch-karte-innen b { color: #ffd27a; font-weight: 600; }
.ch-karte-innen label { display: grid; gap: .2rem; font-size: .85rem; }
.ch-karte-innen label.ch-leise { display: flex; align-items: center; gap: .45rem; }
.ch-karte-innen input[type="range"] { width: 100%; accent-color: #e0a046; }
@media (max-width: 700px) { .ch-karte-innen { padding: .7rem .8rem; gap: .4rem; } .ch-karte-innen ol { font-size: .8rem; } }
/* Glitzerhose: Schirm kippt, Spielleiter springt auf */
.ch-hose .ch-glanz path { animation: chGlanz 1.1s ease-in-out infinite; transform-box: fill-box; transform-origin: center; }
.ch-hose .ch-glanz path:nth-child(2) { animation-delay: .3s; } .ch-hose .ch-glanz path:nth-child(3) { animation-delay: .6s; } .ch-hose .ch-glanz path:nth-child(4) { animation-delay: .85s; }
@keyframes chGlanz { 0%, 100% { opacity: .2; transform: scale(.5); } 50% { opacity: 1; transform: scale(1.3); } }
.ch-schirm { transition: transform .45s cubic-bezier(.4,1.6,.5,1); transform-box: fill-box; transform-origin: 50% 100%; }
.ch-buehne.glitzer .ch-schirm { transform: scaleY(.12) skewX(-6deg); }
.ch-buehne.glitzer .ch-sl .ch-koerper { animation: chAufspringen 3.2s ease-in-out forwards; }
@keyframes chAufspringen { 0% { transform: none; } 15% { transform: translateY(-34px); } 22% { transform: translateY(-26px); } 30%, 85% { transform: translateY(-30px); } 100% { transform: none; } }
.ch-buehne.glitzer .ch-hose { filter: drop-shadow(0 0 6px rgba(190,210,255,.9)); }
/* Controller-Auswahl */
.ch-tafel .pad-wahl { outline: 2px solid #ffd27a; outline-offset: 2px; border-color: #ffd27a; background: rgba(255,210,122,.1); }
/* ===== Handy: ganze Szene sichtbar (nichts abgeschnitten), Sprechblasen im Band darüber ===== */
@media (max-width: 700px) {
  .charme .ch-buehne { aspect-ratio: 400 / 372; height: auto; margin-inline: -.5rem; background: linear-gradient(180deg, #120d12, #22181c 40%, #2a1d1f); }
  .charme.tav-voll > .ch-buehne { margin-inline: auto; }
  .ch-nsc { height: calc(var(--sz, 100%) * .84); bottom: calc(var(--sz, 100%) * .03); max-width: 50%; left: 1%; }
  .ch-nsc[data-nsc="themberchaud"], .ch-nsc[data-nsc="demogorgon"] { height: calc(var(--sz, 100%) * .95); max-width: 56%; }
  .ch-nsc[data-nsc="buergermeister"] { height: calc(var(--sz, 100%) * .6); }
  .ch-nsc-blase, .ch-sl-blase { top: 1.5%; font-size: .72rem; line-height: 1.25; padding: .3rem .5rem; max-width: 49.5%; border-radius: 8px; }
  .ch-nsc-blase { left: 1%; } .ch-sl-blase { right: 1%; }
  .ch-wuerfel { width: 46px; height: 46px; margin: 0 0 0 -23px; top: auto; left: 52%; bottom: calc(var(--sz, 100%) * .47); font-size: 1.15rem; }
  .ch-stempel { top: calc(100% - var(--sz, 100%) * .55); font-size: clamp(1.15rem, 6.4vw, 2rem); white-space: normal; text-align: center; max-width: 92%; }
  .ch-wolke { top: calc(100% - var(--sz, 100%) * .98); }
  .ch-geduld { font-size: .55rem; letter-spacing: .06em; }
  .ch-geduld-bar { width: 22vw; }
  .ch-ton .ton-txt { display: none; }
  .ch-kopfzeile { bottom: 2%; left: 2.5%; right: 2.5%; }
}
@media (max-width: 700px) and (max-height: 780px) {
  .charme:not(.tav-voll) .ch-buehne { aspect-ratio: 400 / 330; }
}
@media (prefers-reduced-motion: reduce) { .ch-sl .ch-koerper, .ch-sl .a-offen, .ch-sl.hops .ch-kopf, .ch-sl[data-m="lachen"] .ch-kopf { animation: none; } .ch-nsc { transition: opacity .3s; } }
`;
  document.head.appendChild(css);

  gesicht("neutral");
  zeichnen();
  new MutationObserver(zeichnen).observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });
  root._charme = { nsc: NSC, zustand: () => S, neu: neueSitzung, wuerfeln, joker, weiter, gesicht, effekte, stimmung, Ton, kamera, zeichnen, sag: (wer, txt) => wer === "sl" ? slSagt(txt, 60000) : blase(nscBlase, txt, 0), buch: () => { ansicht = "buch"; zeichnen(); }, peinlich: f => { S.wirft = true; peinlichePause(f || (() => { S.wirft = false; })); } };
})();
