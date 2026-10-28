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
        gundren: { name: "Gundren Felsensucher", aufgabe: "Überrede ihn, den Lohn im Voraus zu zahlen.",
          intro: "„Ah, die Helden! Bereit für den Weg nach Phandalin?“",
          charmant: ["„Gundren, dein Bart glänzt heute wie poliertes Erz.“", "„Mit dir würde ich jede Karawane begleiten. Auch eine leere.“", "„Ein Zwerg mit so viel Stil verdient Gefährten mit Stil. Also uns.“"],
          kuehn: ["„Zahl uns jetzt, und ich schreibe dir eine Ballade. Mit Refrain.“", "„Du und ich, Gundren – das ist der Anfang einer langen Geschäftsbeziehung. Und vielleicht mehr.“"],
          absurd: ["„Ich habe von dir geträumt. Du warst ein Pony. Ich war der Wagen.“", "„Darf ich deinen Hut tragen? Nur kurz. Für immer.“"],
          passend: ["„Ich kenne da eine magische Schmiede … also, du kennst sie. Und ich kenne dich.“"],
          ja: ["Gundren lacht dröhnend. „Ihr gefallt mir! Hier, die Hälfte jetzt.“", "„Ha! So ein Mundwerk. Na gut, na gut.“"],
          nein: ["„Bezahlt wird in Phandalin. Wie immer.“", "Gundren zählt demonstrativ seine Münzen. Für sich."],
          krit: "Gundren wird rot unter dem Bart und drückt dir den ganzen Beutel in die Hand.",
          patzer: "Gundren schreibt sich deinen Namen auf. Auf die Liste der Leute, die nichts bekommen.",
          sieg: "Der Lohn klimpert im Voraus. Gundren winkt euch nach, ein bisschen verlegen.",
          verloren: "„Wir sehen uns in Phandalin.“ Dort werdet ihr ihn so schnell nicht sehen …" },
        buergermeister: { name: "Der Bürgermeister von Phandalin", aufgabe: "Bring ihn dazu, die Belohnung ohne Feilschen auszuzahlen.",
          intro: "„Belohnung? Ich erinnere mich an keine Belohnung.“",
          charmant: ["„Herr Bürgermeister, Ihre Amtskette steht Ihnen ausgezeichnet.“", "„Phandalin hat Glück, so einen weitsichtigen Mann zu haben.“", "„Ihr Pelzkragen ist das Weichste, was ich seit Neverwinter gesehen habe.“"],
          kuehn: ["„Zahlen Sie, und ich singe auf dem Marktplatz, wie großzügig Sie sind.“", "„Ein so großer Mann sollte auch große Belohnungen zahlen.“"],
          absurd: ["„Ich möchte Ihre Unterschrift. Auf meinem Herzen. Oder einem Scheck.“", "„Sind Sie ein Zauberer? Weil jedes Mal, wenn ich Sie ansehe, verschwindet mein Gold.“"],
          passend: ["„Ich habe gehört, Sie zählen Ihre Münzen jeden Abend. Ich würde Ihnen dabei zusehen. Fasziniert.“"],
          ja: ["Der Bürgermeister errötet. „Nun ja … ich will nicht so sein.“", "„So viel Verständnis für Verwaltung! Hier, nehmt.“"],
          nein: ["„Schmeichelei kostet extra. Für euch.“", "Er schiebt den Geldbeutel ein Stück weiter weg."],
          krit: "Der Bürgermeister zahlt – ohne zu feilschen. Phandalin hält kurz den Atem an.",
          patzer: "Er erhebt eine Gebühr für Komplimente. Rückwirkend.",
          sieg: "Ihr bekommt die volle Belohnung. Zum ersten Mal in der Geschichte Phandalins.",
          verloren: "Er gibt euch eine Kupfermünze. Eine. Zum Teilen." },
        bugbear: { name: "Der Bugbear im Wachturm", aufgabe: "Lass dich durch die Tür, ohne zu kämpfen.",
          intro: "Ein riesiger, haariger Bugbear versperrt die Tür. „GRRR.“",
          charmant: ["„Was für ein prächtiges Fell! Benutzt du eine Spülung?“", "„Du hast die schönsten Krallen im ganzen Wachturm.“", "„Weißt du, dass du ein sehr ausdrucksstarkes Knurren hast?“"],
          kuehn: ["„Lass mich durch, und ich nenne meine nächste Laute nach dir.“", "„Du und ich, Großer. Kerzenlicht. Ein Fass Bier. Was meinst du?“"],
          absurd: ["„Ich habe ein Fass. Du hast ein Fass. Siehst du? Wir haben so viel gemeinsam.“", "„Bist du ein Teppich? Ich würde nämlich gern auf dir liegen. Kurz.“"],
          passend: ["„Grrr.“ (Barradin knurrt zärtlich zurück.)"],
          ja: ["Der Bugbear schnurrt. Leise. Fast.", "„…Grrr?“ Er tritt ein kleines Stück zur Seite."],
          nein: ["„GRRR!“", "Der Bugbear legt die Ohren an. Das ist kein gutes Zeichen."],
          krit: "Der Bugbear öffnet die Tür, verbeugt sich und schenkt dir eine halbe Ratte.",
          patzer: "Der Bugbear setzt sich auf dich. Es ist warm. Es ist schwer.",
          sieg: "Die Tür steht offen. Der Bugbear schaut dir verträumt nach.",
          verloren: "Ihr müsst doch kämpfen. Der Bugbear wirkt gekränkt." },
        ilvara: { name: "Ilvara Mizzrym", aufgabe: "Bring sie dazu, die Ketten ein wenig zu lockern.",
          intro: "„Sklaven reden nicht, wenn man sie nicht fragt.“",
          charmant: ["„Herrin, Euer Blick ist schärfer als jede Drow-Klinge.“", "„In diesen Ketten fühle ich mich Euch so nah.“", "„Diese Festung ist düster. Ihr dagegen strahlt.“"],
          kuehn: ["„Lockert die Ketten, und ich singe Euch ein Lied, das selbst Lolth erröten lässt.“", "„Ihr und ich, Herrin – wir wären ein unschlagbares Paar. Ich halte die Laute, Ihr die Peitsche.“"],
          absurd: ["„Ich mag Spinnen. Sehr. Wirklich. Bitte.“", "„Seid Ihr eine Druidin? Ich frage nur, weil … oh. Oh nein.“"],
          passend: ["„Eure Spinnen haben ausgezeichneten Geschmack. Sie bewachen Euch.“"],
          ja: ["Ilvara hebt eine Augenbraue. Das ist bei ihr fast ein Lächeln.", "„Unterhaltsam. Das rettet dir vielleicht den Tag.“"],
          nein: ["„Noch ein Wort, und du fütterst die Spinnen.“", "Sie lässt die Peitsche knallen. Nicht nah. Aber nah genug."],
          krit: "Ilvara lockert die Ketten – und schaut sich danach misstrauisch um, als hätte sie das nicht gewollt.",
          patzer: "Ilvara verdoppelt deine Ketten. „Zur Sicherheit.“",
          sieg: "Die Ketten sitzen lockerer. Ilvara tut so, als wäre nichts gewesen.",
          verloren: "„Abführen.“ Die Ketten klirren. Romantisch ist anders." },
        kuotoa: { name: "Ein Kuo-Toa-Wächter", aufgabe: "Er soll euch in die Stadt lassen.",
          intro: "Der Wächter glotzt. Lange. Ohne zu blinzeln.",
          charmant: ["„Deine Schuppen schimmern wie der See im Mondlicht.“", "„Du hast die schönsten großen Augen, die ich je gesehen habe.“", "„Riechst du nach Algen? Ich liebe Algen.“"],
          kuehn: ["„Lass uns rein, und ich singe dir ein Lied über den See. Mit Blubbern.“", "„Wir zwei, ein Boot, der unterirdische See … denk drüber nach.“"],
          absurd: ["„Blubb.“ (Barradin blinzelt verführerisch.)", "„Bist du ein Fisch? Weil du mir den Atem raubst. Unter Wasser.“"],
          passend: ["„Du hast etwas Göttliches an dir. Ein echtes, nicht ausgedachtes.“"],
          ja: ["Der Wächter blubbert zufrieden.", "„Blubb.“ Es klingt freundlich. Vermutlich."],
          nein: ["Der Wächter glotzt weiter. Unbeeindruckt. Und feucht.", "„Fremde. Verdächtig. Blubb.“"],
          krit: "Der Wächter öffnet das Tor und winkt mit beiden Flossen.",
          patzer: "Der Wächter ruft drei Freunde. Sie glotzen jetzt alle.",
          sieg: "Das Tor öffnet sich mit einem feuchten Quietschen.",
          verloren: "Ihr kommt trotzdem rein – gefesselt. Wie geplant. Irgendwie." },
        horga: { name: "König Horga Stahl V.", aufgabe: "Erbitte Gastrecht in Gracklstugh.",
          intro: "„Sprich, Barde. Aber fass dich kurz.“",
          charmant: ["„Majestät, Euer Bart allein hat mehr Würde als ganz Phandalin.“", "„Eure Krone sitzt so vortrefflich, als wäre sie für Euch geschmiedet.“", "„Gracklstugh glüht – aber Ihr glüht heller.“"],
          kuehn: ["„Gewährt uns Gastrecht, und ich komponiere Euch eine Hymne. Mit Amboss-Solo.“", "„Ein König wie Ihr verdient einen Barden wie mich. Täglich.“"],
          absurd: ["„Darf ich Euren Bart flechten? Rein freundschaftlich.“", "„Seid Ihr ein Amboss? Weil mein Herz bei Euch schneller hämmert.“"],
          passend: ["„Wir haben Euren Sohn gerettet. Und dabei an Euch gedacht. Die ganze Zeit.“"],
          ja: ["Der König brummt. Das könnte Zustimmung sein.", "„Hmpf. Du hast Mut, Barde.“"],
          nein: ["„Wache!“ Die Wachen rühren sich nicht. Aber sie schauen.", "Der König schaut, als hätte er in eine Zitrone gebissen."],
          krit: "Der König lacht – zum ersten Mal seit fünfzig Jahren. Der Hof erstarrt.",
          patzer: "Der König lässt dich höflich, aber bestimmt hinausrollen. In einem Fass.",
          sieg: "Gastrecht gewährt. Kardal reibt sich peinlich berührt die Stirn.",
          verloren: "Ihr dürft bleiben – aber nur, weil ihr seinen Sohn gerettet habt." },
        hgraam: { name: "Der Steinsprecher", aufgabe: "Er soll euch seinen Steinsprecher-Kristall geben.",
          intro: "„Der Stein schreit. Hörst du ihn?“",
          charmant: ["„Ihr seid so … standfest. Ich bewundere das.“", "„Eure Haut hat eine wundervolle Maserung. Granit?“", "„Wenn Ihr sprecht, höre ich den Berg singen.“"],
          kuehn: ["„Gebt mir den Kristall, und ich singe für Euch, bis der Stein aufhört zu schreien.“", "„Ihr und ich – Fels und Fels. Naja. Fels und Barde.“"],
          absurd: ["„Ich habe auch ein paar Steine. In der Tasche. Wollt Ihr sie sehen?“", "„Seid Ihr ein Steinbruch? Weil ich mich gerade in Euch verliere.“"],
          passend: ["„Der Stein schreit? Ich auch. Vor Bewunderung.“"],
          ja: ["Der Steinsprecher nickt langsam. Sehr langsam.", "„Der Stein … mag dich.“"],
          nein: ["Der Steinsprecher spricht weiter in Rätseln. Über etwas völlig anderes.", "Er betrachtet dich wie ein Kiesel, der zu viel redet."],
          krit: "Der Steinsprecher lächelt. Irgendwo in Gracklstugh fällt ein Fels vor Freude um.",
          patzer: "Er hält dich für einen sprechenden Stein und legt dich zu den anderen.",
          sieg: "Der Kristall liegt warm in deiner Hand. Der Stein schreit kurz leiser.",
          verloren: "„Etwas Unersättliches regt sich.“ Er meint dich." },
        themberchaud: { name: "Themberchaud, der Meister der Flammen", aufgabe: "Überzeuge ihn, euch nicht zu fressen.",
          intro: "Der Drache landet auf dem Gold. Die Halle wird sehr warm. Sehr still.",
          charmant: ["„Euer Schatz glänzt – aber nicht so wie Eure Schuppen.“", "„Ich habe noch nie einen so prachtvollen Drachen gesehen. Ehrlich gesagt überhaupt noch nie einen.“", "„Euer Feuer wärmt mein Herz. Und meine Augenbrauen.“"],
          kuehn: ["„Lasst uns leben, und ich singe Euch eine Ballade über die Reise durch das ganze Unterreich. In Reimen.“", "„Ihr und ich, Meister – Ihr speit Feuer, ich spucke Verse.“"],
          absurd: ["„Darf ich auf dem goldenen Hund sitzen? Er sieht bequem aus.“", "„Seid Ihr ein Vulkan? Weil ich bei Euch dahinschmelze. Wörtlich.“"],
          passend: ["„Ein Wesen von Eurem Geschmack sammelt nur das Beste. Ich wäre gern Teil der Sammlung.“"],
          ja: ["Themberchaud stößt eine zufriedene Rauchwolke aus.", "„Unterhaltsam.“ Das Wort hallt durch die Halle."],
          nein: ["Ein warnendes Rauchwölkchen steigt aus seinen Nüstern.", "Die Laute wird plötzlich sehr warm."],
          krit: "Themberchaud schnurrt. Echo fragt leise, ob er Gundren kennt. Er kennt ihn nicht – aber er ist bester Laune.",
          patzer: "Themberchaud niest. Barradins Haare sind jetzt kürzer.",
          sieg: "Der Drache verschont euch und gibt euch einen Auftrag. Barradin nennt das ein Date.",
          verloren: "Ihr lebt – aber nur, weil Themberchaud jemanden für die Drecksarbeit braucht." },
        demogorgon: { name: "Demogorgon (Bonus)", aufgabe: "Bitte … einfach wieder gehen.",
          intro: "Zwei Köpfe. Tentakel. Der Spielleiter lächelt sehr breit.",
          charmant: ["„Ihr … habt zwei wunderschöne Köpfe. Beide.“", "„Diese Tentakel! So … viele.“", "„Euer Schrei ist so durchdringend. So … musikalisch.“"],
          kuehn: ["„Geht zurück in den Abgrund, und ich schreibe Euch ein Duett. Für beide Köpfe.“", "„Ihr und ich, Dämonenfürst. Was könnte schon schiefgehen?“"],
          absurd: ["„Friedrich hat dich geboxt. Ich würde dich lieber umarmen.“", "„Welcher Kopf ist der romantische?“"],
          passend: ["(Barradin hält die Flöte der Illusionen hoch und zeigt Demogorgon … Demogorgon.)"],
          ja: ["Der linke Kopf kichert. Der rechte ist skeptisch.", "Die Tentakel winken. Ist das gut?"],
          nein: ["Beide Köpfe schreien. Gleichzeitig.", "Ein Tentakel tätschelt Barradin. Zu fest."],
          krit: "Demogorgon … errötet. Auf beiden Köpfen. Und verschwindet verwirrt im See.",
          patzer: "Demogorgon frisst die Laute. Der Spielleiter muss kurz raus.",
          sieg: "Demogorgon zieht sich zurück. Beide Köpfe schauen noch einmal zurück.",
          verloren: "Ihr rennt zum Boot. Wie damals. Nur peinlicher." }
      },
      sl: { /* Der Spielleiter kommentiert */
        start: ["„Okay. Ihr steht vor …“", "„Ich ahne Schlimmes.“", "„Bitte. Bitte nicht wieder.“"],
        absurd: ["„Das ist nicht dein Ernst.“", "„Ich schreibe das auf.“", "„Ich hasse euch. Liebevoll.“", "„…Mach einen Wurf.“"],
        erfolg: ["„Okay. Das zählt.“", "„Ich kann's nicht fassen.“", "„…Na gut.“", "„Er wird rot. Natürlich wird er rot.“"],
        misserfolg: ["„Nein.“", "„Das hat er nicht gehört. Absichtlich.“", "„Würfel lügen nicht.“", "„Nächster Versuch.“"],
        krit: ["„WAS?!“", "„Das … das gibt's nicht.“", "„Ich muss kurz meine Notizen umschreiben.“"],
        patzer: ["„HAHAHA – nein.“", "„Das wird Konsequenzen haben.“", "„Ich lass das einfach so stehen.“"],
        echo: ["„Nein, er kennt Gundren nicht.“", "„Echo. Bitte.“", "„Niemand kennt Gundren.“"],
        rex: ["„Gut, den Hund lieben alle. Das ist unfair.“", "„Rex. Natürlich Rex.“"],
        floete: ["„Nicht schon wieder Demogorgon.“", "„Ihr und eure Flöte.“"],
        korb: ["„Korb. Ich liebe Körbe.“", "„Das wars dann wohl.“"],
        erobert: ["„Ich gebe auf.“", "„Ich hätte ihn nicht so nett schreiben sollen.“"],
        schirm: "„Pause. Ich brauche einen Tee.“"
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
        gundren: { name: "Gundren Rockseeker", aufgabe: "Talk him into paying in advance.",
          intro: "\"Ah, the heroes! Ready for the road to Phandalin?\"",
          charmant: ["\"Gundren, your beard shines like polished ore today.\"", "\"I'd escort any caravan with you. Even an empty one.\"", "\"A dwarf with this much style deserves companions with style. That's us.\""],
          kuehn: ["\"Pay us now and I'll write you a ballad. With a chorus.\"", "\"You and me, Gundren – the start of a long business relationship. And maybe more.\""],
          absurd: ["\"I dreamt of you. You were a pony. I was the cart.\"", "\"May I wear your hat? Just briefly. Forever.\""],
          passend: ["\"I know of a magic forge … well, you know it. And I know you.\""],
          ja: ["Gundren roars with laughter. \"I like you! Here, half now.\"", "\"Ha! What a mouth on you. Fine, fine.\""],
          nein: ["\"Payment in Phandalin. As always.\"", "Gundren counts his coins pointedly. For himself."],
          krit: "Gundren blushes under his beard and presses the whole purse into your hand.",
          patzer: "Gundren writes your name down. On the list of people who get nothing.",
          sieg: "The reward jingles in advance. Gundren waves you off, a little flustered.",
          verloren: "\"See you in Phandalin.\" You won't, not for a while …" },
        buergermeister: { name: "The Mayor of Phandalin", aufgabe: "Get him to pay the reward without haggling.",
          intro: "\"Reward? I recall no reward.\"",
          charmant: ["\"Mister Mayor, your chain of office suits you splendidly.\"", "\"Phandalin is lucky to have such a far-sighted man.\"", "\"Your fur collar is the softest thing I've seen since Neverwinter.\""],
          kuehn: ["\"Pay up, and I'll sing in the market square about how generous you are.\"", "\"Such a great man should pay great rewards.\""],
          absurd: ["\"I'd like your signature. On my heart. Or a cheque.\"", "\"Are you a wizard? Because every time I look at you, my gold disappears.\""],
          passend: ["\"I hear you count your coins every evening. I'd watch you do it. Fascinated.\""],
          ja: ["The mayor blushes. \"Well … I don't want to be like that.\"", "\"Such understanding for administration! Here, take it.\""],
          nein: ["\"Flattery costs extra. For you.\"", "He pushes the purse a little further away."],
          krit: "The mayor pays – without haggling. Phandalin holds its breath.",
          patzer: "He charges a fee for compliments. Retroactively.",
          sieg: "You get the full reward. For the first time in Phandalin's history.",
          verloren: "He gives you a copper coin. One. To share." },
        bugbear: { name: "The bugbear in the watchtower", aufgabe: "Get through the door without a fight.",
          intro: "A huge, hairy bugbear blocks the door. \"GRRR.\"",
          charmant: ["\"What magnificent fur! Do you use conditioner?\"", "\"You have the finest claws in the whole watchtower.\"", "\"Did you know you have a very expressive growl?\""],
          kuehn: ["\"Let me through and I'll name my next lute after you.\"", "\"You and me, big guy. Candlelight. A barrel of beer. What do you say?\""],
          absurd: ["\"I have a barrel. You have a barrel. See? We have so much in common.\"", "\"Are you a rug? Because I'd like to lie on you. Briefly.\""],
          passend: ["\"Grrr.\" (Barradin growls back tenderly.)"],
          ja: ["The bugbear purrs. Quietly. Almost.", "\"…Grrr?\" He steps aside a little."],
          nein: ["\"GRRR!\"", "The bugbear flattens his ears. Not a good sign."],
          krit: "The bugbear opens the door, bows and gives you half a rat.",
          patzer: "The bugbear sits on you. It's warm. It's heavy.",
          sieg: "The door is open. The bugbear gazes after you dreamily.",
          verloren: "You have to fight after all. The bugbear looks hurt." },
        ilvara: { name: "Ilvara Mizzrym", aufgabe: "Get her to loosen the chains a little.",
          intro: "\"Slaves don't speak unless spoken to.\"",
          charmant: ["\"Mistress, your gaze is sharper than any drow blade.\"", "\"In these chains I feel so close to you.\"", "\"This fortress is gloomy. You, however, shine.\""],
          kuehn: ["\"Loosen the chains and I'll sing you a song that would make Lolth blush.\"", "\"You and me, mistress – an unbeatable pair. I hold the lute, you hold the whip.\""],
          absurd: ["\"I like spiders. A lot. Really. Please.\"", "\"Are you a druid? I only ask because … oh. Oh no.\""],
          passend: ["\"Your spiders have excellent taste. They guard you.\""],
          ja: ["Ilvara raises an eyebrow. For her, that's almost a smile.", "\"Amusing. That might save your day.\""],
          nein: ["\"One more word and you feed the spiders.\"", "She cracks the whip. Not close. But close enough."],
          krit: "Ilvara loosens the chains – then looks around suspiciously, as if she hadn't meant to.",
          patzer: "Ilvara doubles your chains. \"For safety.\"",
          sieg: "The chains sit looser. Ilvara pretends nothing happened.",
          verloren: "\"Take him away.\" The chains rattle. Not romantic." },
        kuotoa: { name: "A kuo-toa guard", aufgabe: "He should let you into the city.",
          intro: "The guard stares. For a long time. Without blinking.",
          charmant: ["\"Your scales shimmer like the lake in moonlight.\"", "\"You have the most beautiful big eyes I've ever seen.\"", "\"Do you smell of algae? I love algae.\""],
          kuehn: ["\"Let us in and I'll sing you a song about the lake. With bubbling.\"", "\"The two of us, a boat, the underground lake … think about it.\""],
          absurd: ["\"Blub.\" (Barradin winks seductively.)", "\"Are you a fish? Because you take my breath away. Underwater.\""],
          passend: ["\"There's something divine about you. A real one, not a made-up one.\""],
          ja: ["The guard bubbles contentedly.", "\"Blub.\" It sounds friendly. Probably."],
          nein: ["The guard keeps staring. Unimpressed. And damp.", "\"Strangers. Suspicious. Blub.\""],
          krit: "The guard opens the gate and waves with both fins.",
          patzer: "The guard calls three friends. Now they're all staring.",
          sieg: "The gate opens with a wet squeak.",
          verloren: "You get in anyway – in chains. As planned. Sort of." },
        horga: { name: "King Horga Steel V", aufgabe: "Ask for hospitality in Gracklstugh.",
          intro: "\"Speak, bard. But be brief.\"",
          charmant: ["\"Your Majesty, your beard alone has more dignity than all of Phandalin.\"", "\"Your crown fits as if it had been forged for you.\"", "\"Gracklstugh glows – but you glow brighter.\""],
          kuehn: ["\"Grant us hospitality and I'll compose you an anthem. With an anvil solo.\"", "\"A king like you deserves a bard like me. Daily.\""],
          absurd: ["\"May I braid your beard? Purely as friends.\"", "\"Are you an anvil? Because my heart hammers faster around you.\""],
          passend: ["\"We saved your son. And thought of you the whole time.\""],
          ja: ["The king grumbles. That could be approval.", "\"Hmph. You have nerve, bard.\""],
          nein: ["\"Guards!\" The guards don't move. But they look.", "The king looks as if he'd bitten a lemon."],
          krit: "The king laughs – for the first time in fifty years. The court freezes.",
          patzer: "The king has you politely but firmly rolled out. In a barrel.",
          sieg: "Hospitality granted. Kardal rubs his forehead in embarrassment.",
          verloren: "You may stay – but only because you saved his son." },
        hgraam: { name: "The Stonespeaker", aufgabe: "He should give you his stonespeaker crystal.",
          intro: "\"The stone is screaming. Do you hear it?\"",
          charmant: ["\"You are so … steadfast. I admire that.\"", "\"Your skin has a wonderful grain. Granite?\"", "\"When you speak, I hear the mountain sing.\""],
          kuehn: ["\"Give me the crystal and I'll sing for you until the stone stops screaming.\"", "\"You and me – rock and rock. Well. Rock and bard.\""],
          absurd: ["\"I have some stones too. In my pocket. Want to see?\"", "\"Are you a quarry? Because I'm losing myself in you.\""],
          passend: ["\"The stone screams? So do I. With admiration.\""],
          ja: ["The Stonespeaker nods slowly. Very slowly.", "\"The stone … likes you.\""],
          nein: ["The Stonespeaker keeps speaking in riddles. About something else entirely.", "He regards you like a pebble that talks too much."],
          krit: "The Stonespeaker smiles. Somewhere in Gracklstugh a rock falls over with joy.",
          patzer: "He mistakes you for a talking stone and puts you with the others.",
          sieg: "The crystal lies warm in your hand. The stone screams a little quieter.",
          verloren: "\"Something insatiable is stirring.\" He means you." },
        themberchaud: { name: "Themberchaud, Master of Flames", aufgabe: "Convince him not to eat you.",
          intro: "The dragon lands on the gold. The hall gets very warm. Very quiet.",
          charmant: ["\"Your hoard shines – but not like your scales.\"", "\"I've never seen such a magnificent dragon. To be honest, I've never seen one at all.\"", "\"Your fire warms my heart. And my eyebrows.\""],
          kuehn: ["\"Let us live and I'll sing you a ballad of our journey through the whole Underdark. In rhyme.\"", "\"You and me, Master – you breathe fire, I spit verse.\""],
          absurd: ["\"May I sit on the golden dog? It looks comfy.\"", "\"Are you a volcano? Because I'm melting. Literally.\""],
          passend: ["\"A being of your taste only collects the best. I'd love to be part of the collection.\""],
          ja: ["Themberchaud puffs out a contented cloud of smoke.", "\"Entertaining.\" The word echoes through the hall."],
          nein: ["A warning wisp of smoke rises from his nostrils.", "The lute suddenly gets very warm."],
          krit: "Themberchaud purrs. Echo quietly asks if he knows Gundren. He doesn't – but he's in the best of moods.",
          patzer: "Themberchaud sneezes. Barradin's hair is shorter now.",
          sieg: "The dragon spares you and gives you a task. Barradin calls it a date.",
          verloren: "You live – but only because Themberchaud needs someone for the dirty work." },
        demogorgon: { name: "Demogorgon (bonus)", aufgabe: "Please … just leave again.",
          intro: "Two heads. Tentacles. The game master smiles very widely.",
          charmant: ["\"You … have two beautiful heads. Both of them.\"", "\"Those tentacles! So … many.\"", "\"Your scream is so piercing. So … musical.\""],
          kuehn: ["\"Go back to the Abyss and I'll write you a duet. For both heads.\"", "\"You and me, demon prince. What could possibly go wrong?\""],
          absurd: ["\"Friedrich punched you. I'd rather hug you.\"", "\"Which head is the romantic one?\""],
          passend: ["(Barradin raises the flute of illusions and shows Demogorgon … Demogorgon.)"],
          ja: ["The left head giggles. The right one is sceptical.", "The tentacles wave. Is that good?"],
          nein: ["Both heads scream. At the same time.", "A tentacle pats Barradin. Too hard."],
          krit: "Demogorgon … blushes. On both heads. And vanishes into the lake, confused.",
          patzer: "Demogorgon eats the lute. The game master has to step out for a moment.",
          sieg: "Demogorgon retreats. Both heads look back once more.",
          verloren: "You run for the boat. Like back then. Only more embarrassing." }
      },
      sl: {
        start: ["\"Okay. You stand before …\"", "\"I have a bad feeling about this.\"", "\"Please. Please not again.\""],
        absurd: ["\"You can't be serious.\"", "\"I'm writing that down.\"", "\"I hate you. Lovingly.\"", "\"…Roll.\""],
        erfolg: ["\"Okay. That counts.\"", "\"I can't believe it.\"", "\"…Fine.\"", "\"He blushes. Of course he blushes.\""],
        misserfolg: ["\"No.\"", "\"He didn't hear that. On purpose.\"", "\"Dice don't lie.\"", "\"Next try.\""],
        krit: ["\"WHAT?!\"", "\"That … that's impossible.\"", "\"I need to rewrite my notes.\""],
        patzer: ["\"HAHAHA – no.\"", "\"That will have consequences.\"", "\"I'll just leave that there.\""],
        echo: ["\"No, he doesn't know Gundren.\"", "\"Echo. Please.\"", "\"Nobody knows Gundren.\""],
        rex: ["\"Fine, everyone loves the dog. That's unfair.\"", "\"Rex. Of course Rex.\""],
        floete: ["\"Not Demogorgon again.\"", "\"You and your flute.\""],
        korb: ["\"Rejected. I love a rejection.\"", "\"Well, that's that.\""],
        erobert: ["\"I give up.\"", "\"I shouldn't have written him so nice.\""],
        schirm: "\"Break. I need a cup of tea.\""
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
  <!-- Regal mit Würfeln und Büchern -->
  <g transform="translate(0 30)">
  <rect x="0" y="150" width="120" height="5" fill="#4a2e1a"/>
  <rect x="8" y="128" width="8" height="22" fill="#6a2a2a"/><rect x="17" y="131" width="7" height="19" fill="#2a4a6a"/><rect x="25" y="126" width="9" height="24" fill="#3a5a2a"/>
  <polygon points="52,150 58,140 64,150" fill="#7a3ab0"/><polygon points="70,150 75,142 80,150" fill="#d0a030"/><rect x="88" y="142" width="8" height="8" fill="#b02a2a" transform="rotate(12 92 146)"/>
  </g>
  <!-- Lampe -->
  <circle cx="372" cy="128" r="30" fill="#ffcf7a" opacity=".08"/>
  <!-- Spielleiter -->
  <g class="ch-sl">
    <g class="ch-koerper">
      <path d="M210 300 L 214 214 C 216 196 232 186 252 184 L 288 184 C 308 186 324 196 326 214 L 330 300 Z" fill="#2f4a3a"/>
      <path d="M252 184 L 270 206 L 288 184 Z" fill="#284034"/>
      <rect x="262" y="166" width="16" height="22" rx="6" fill="#e6b896"/>
      <g class="ch-kopf">
        <ellipse cx="270" cy="138" rx="27" ry="32" fill="#efc4a2"/>
        <ellipse cx="243" cy="142" rx="5" ry="8" fill="#e6b896"/><ellipse cx="297" cy="142" rx="5" ry="8" fill="#e6b896"/>
        <!-- kurze braune Haare -->
        <path d="M242 132 C 238 104 256 96 272 98 C 292 98 302 110 298 132 C 296 122 290 116 282 114 C 276 120 262 118 254 114 C 248 118 244 124 242 132 Z" fill="#6b4226"/>
        <path d="M254 114 C 258 108 266 106 272 108" fill="none" stroke="#4e2f1a" stroke-width="1.6"/>
        <!-- Augenbrauen -->
        <g class="ch-brauen">
          <path class="b-normal" d="M253 128 q 6 -3 11 0 M276 128 q 6 -3 11 0" stroke="#4e2f1a" stroke-width="2.2" fill="none" stroke-linecap="round"/>
          <path class="b-hoch" d="M253 124 q 6 -5 11 -1 M276 123 q 6 -4 11 1" stroke="#4e2f1a" stroke-width="2.2" fill="none" stroke-linecap="round"/>
          <path class="b-boese" d="M253 126 q 6 1 11 4 M276 130 q 6 -3 11 -4" stroke="#4e2f1a" stroke-width="2.2" fill="none" stroke-linecap="round"/>
          <path class="b-muede" d="M253 130 q 6 -1 11 1 M276 131 q 6 -2 11 -1" stroke="#4e2f1a" stroke-width="2.2" fill="none" stroke-linecap="round"/>
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
          <path class="m-neutral" d="M262 158 q 8 2 16 0" stroke="#7a3a2a" stroke-width="2" fill="none" stroke-linecap="round"/>
          <path class="m-grinsen" d="M260 156 q 10 9 20 0" stroke="#7a3a2a" stroke-width="2.2" fill="none" stroke-linecap="round"/>
          <g class="m-lachen"><path d="M258 154 q 12 16 24 0 Z" fill="#6a2222"/><path d="M261 155 h 18 l -2 3 h -14 Z" fill="#fff"/></g>
          <ellipse class="m-o" cx="270" cy="159" rx="5" ry="6.5" fill="#6a2222"/>
          <path class="m-schief" d="M262 160 q 6 -3 16 -4" stroke="#7a3a2a" stroke-width="2" fill="none" stroke-linecap="round"/>
          <path class="m-traurig" d="M262 161 q 8 -5 16 0" stroke="#7a3a2a" stroke-width="2" fill="none" stroke-linecap="round"/>
        </g>
        <g class="ch-roete"><ellipse cx="252" cy="150" rx="5" ry="3" fill="#ff7a7a" opacity=".35"/><ellipse cx="288" cy="150" rx="5" ry="3" fill="#ff7a7a" opacity=".35"/></g>
        <g class="ch-zzz"><text x="300" y="112" font-size="11" fill="#cfe6ff" font-family="Georgia,serif">z</text><text x="308" y="102" font-size="14" fill="#cfe6ff" font-family="Georgia,serif">Z</text></g>
        <g class="ch-schweiss"><path d="M300 124 q 3 6 0 8 q -3 -2 0 -8 Z" fill="#9fd6ff"/></g>
      </g>
      <!-- Hände -->
      <g class="ch-haende">
        <g class="h-ruhe"><ellipse cx="236" cy="226" rx="11" ry="7" fill="#efc4a2"/><ellipse cx="304" cy="226" rx="11" ry="7" fill="#efc4a2"/></g>
        <g class="h-facepalm"><path d="M300 228 C 304 200 292 176 284 160" stroke="#2f4a3a" stroke-width="13" fill="none" stroke-linecap="round"/><ellipse cx="272" cy="141" rx="15" ry="11" fill="#efc4a2"/><path d="M262 134 h 22 M261 140 h 23 M262 146 h 21" stroke="#d8a888" stroke-width="1"/><ellipse cx="236" cy="226" rx="11" ry="7" fill="#efc4a2"/></g>
        <g class="h-daumen"><path d="M312 228 C 320 210 322 194 318 180" stroke="#2f4a3a" stroke-width="12" fill="none" stroke-linecap="round"/><rect x="309" y="160" width="16" height="18" rx="5" fill="#efc4a2"/><rect x="313" y="148" width="7" height="16" rx="3.5" fill="#efc4a2"/><ellipse cx="236" cy="226" rx="11" ry="7" fill="#efc4a2"/></g>
        <g class="h-stift"><ellipse cx="236" cy="226" rx="11" ry="7" fill="#efc4a2"/><ellipse cx="300" cy="222" rx="11" ry="7" fill="#efc4a2"/><path d="M298 222 l 12 -18" stroke="#e0a046" stroke-width="3" stroke-linecap="round"/></g>
      </g>
    </g>
  </g>
</svg>`;
  const VORNE = `
<svg class="ch-vorne" viewBox="0 0 400 300" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
  <defs><linearGradient id="chSchirm" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5a1e24"/><stop offset="1" stop-color="#2a0d12"/></linearGradient></defs>
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
  <polygon points="150,274 158,266 166,274 158,282" fill="#7a3ab0"/><polygon points="168,282 174,272 180,282" fill="#d0a030"/>
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
      '<div class="ch-kopfzeile"><div class="ch-geduld"><span class="ch-geduld-txt"></span><span class="ch-geduld-bar"><i></i></span></div><div class="ch-herzen"></div></div>' +
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
    schlaeft: { a: "zu", b: "muede", m: "neutral", h: "ruhe", z: 1 }
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

  /* ---------- Ablauf ---------- */
  function neueSitzung() {
    S = { reihe: NSC.slice(), i: 0, geduld: 10, herzenGesamt: 0, erobert: 0, joker: { echo: 1, rex: 1, floete: 1 }, vorteil: false, bonus: false, ergebnisse: [] };
    ansicht = "spiel"; nscStart();
  }
  function nscStart() {
    const n = S.reihe[S.i];
    S.nsc = n; S.herzen = 0; S.zuege = 4; S.fertig = null; S.letzt = null;
    S.angebot = spruchAngebot(n);
    nscZeigen(n);
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
    if (art === "absurd") { gesicht("facepalm", 1500); slSagt(T.sl.absurd, 1800); S.geduld = Math.max(0, S.geduld - 1); }
    else gesicht("notiert");
    zeichnen();
    /* Würfel rollt */
    const w1 = 1 + Math.floor(Math.random() * 20), w2 = 1 + Math.floor(Math.random() * 20);
    const w = S.vorteil ? Math.max(w1, w2) : w1; const vort = S.vorteil; S.vorteil = false;
    wuerfel.hidden = false; wuerfel.className = "ch-wuerfel rollt";
    const zahl = wuerfel.querySelector("span");
    const flimmer = setInterval(() => { zahl.textContent = 1 + Math.floor(Math.random() * 20); }, 60);
    klang("holz1.mp3", .35);
    setTimeout(() => {
      clearInterval(flimmer); zahl.textContent = w;
      wuerfel.className = "ch-wuerfel" + (w === 20 ? " krit" : w === 1 ? " patzer" : "");
      klang(w === 20 ? "gloeckchen.mp3" : w === 1 ? "timp1.mp3" : "holz2.mp3", .35);
      auswerten(art, w, vort ? [w1, w2] : null);
    }, ruhig ? 200 : 1100);
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
    if (art2 === "krit") { gesicht("schock", 1100, "stolz"); slSagt(T.sl.krit); blase(nscBlase, NT.krit, 0); }
    else if (art2 === "patzer") { gesicht("facepalm", 1300, "lachen"); slSagt(T.sl.patzer); blase(nscBlase, NT.patzer, 0); }
    else if (art2 === "erfolg") { gesicht(S.herzen >= 3 ? "errötet" : "grinsen", 2400); slSagt(T.sl.erfolg); blase(nscBlase, zufall(NT.ja), 0); }
    else { gesicht(summe >= sg - 3 ? "notiert" : "genervt", 2400); slSagt(T.sl.misserfolg); blase(nscBlase, zufall(NT.nein), 0); }
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
  function klang(datei, laut) {
    if (lies("imres-saal-ton") !== "1") return;
    try { const a = new Audio("klang/" + datei); a.volume = laut; const p = a.play(); if (p && p.catch) p.catch(() => {}); } catch (_) {}
  }

  /* ---------- Zeichnen ---------- */
  function zeichnen() {
    const T = t();
    $(".ch-label").textContent = T.label; $(".ch-titel").textContent = T.titel; $(".ch-text").textContent = T.text;
    const kopf = $(".ch-kopfzeile");
    kopf.hidden = ansicht !== "spiel";
    if (ansicht === "spiel" && S) {
      $(".ch-geduld-txt").textContent = T.geduld;
      const bar = $(".ch-geduld-bar i"); bar.style.width = (S.geduld * 10) + "%"; bar.parentNode.classList.toggle("knapp", S.geduld <= 3);
      $(".ch-herzen").innerHTML = [0, 1, 2].map(i => '<span class="' + (i < S.herzen ? "voll" : "") + '">♥</span>').join("");
    }
    buehne.classList.toggle("laeuft", ansicht === "spiel" && !!S && !S.ende);
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
    let html = '<div class="ch-nsc-kopf"><b>' + esc(NT.name) + "</b><span>" + esc(T.aufgabe) + ": " + esc(NT.aufgabe) + "</span></div>";
    if (S.letzt) {
      const L = S.letzt;
      html += '<p class="ch-wurf ' + L.art2 + '">' + esc(L.art2 === "krit" ? T.krit : L.art2 === "patzer" ? T.patzer : L.art2 === "erfolg" ? T.erfolg : T.misserfolg) +
        " <small>" + esc(T.wurf(L.beide ? L.beide.join("/") + " → " + L.w : L.w, CHA, L.summe)) + (L.sg ? " " + esc(T.gegen(L.sg)) : "") + "</small></p>";
    }
    if (S.fertig) {
      html += '<p class="ch-ergebnis ' + S.fertig + '">' + esc(S.fertig === "erobert" ? T.erobert : T.korb) + "</p>" +
        '<div class="ch-knoepfe"><button type="button" class="tav-knopf ch-haupt" data-tun="weiter">' + esc(S.geduld <= 0 || S.i >= S.reihe.length - 1 && !(S.erobert >= 6 && !S.bonus) ? T.ende : T.weiter) + "</button></div>";
    } else {
      html += '<p class="ch-klein">' + esc(T.sprueche(S.zuege)) + "</p>" +
        '<div class="ch-sprueche">' + S.angebot.map(a => '<button type="button" class="ch-spruch art-' + a.art + '" data-art="' + a.art + '" data-idx="' + a.idx + '"' + (S.wirft ? " disabled" : "") + ">" +
          '<span class="ch-art">' + esc(T.arten[a.art]) + " · " + esc(T.artInfo[a.art](sgFuer(a.art, n))) + "</span>" + esc(NT[a.art][a.idx]) + "</button>").join("") + "</div>" +
        '<div class="ch-joker">' + ["echo", "rex", "floete"].map(k => '<button type="button" class="ch-jk" data-joker="' + k + '"' + (S.joker[k] && !S.wirft ? "" : " disabled") + ' title="' + esc(T.jokerInfo[k]) + '">' +
          esc(T.joker[k]) + "<small>" + esc(T.jokerInfo[k]) + "</small></button>").join("") + "</div>";
    }
    tafel.innerHTML = html;
  }
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
    if (b.dataset.art) { wuerfeln(b.dataset.art, +b.dataset.idx); return; }
    if (b.dataset.joker) { joker(b.dataset.joker); return; }
    const tun = b.dataset.tun;
    if (tun === "start") { buehne.classList.remove("zu"); neueSitzung(); }
    else if (tun === "weiter") weiter();
    else if (tun === "buch") { ansicht = "buch"; zeichnen(); }
    else if (tun === "zurueck") { ansicht = S && !S.ende ? "spiel" : "start"; if (ansicht === "start") S = null; zeichnen(); }
  });
  /* Klick auf den Spielleiter: er schaut kurz auf */
  buehne.addEventListener("click", e => { if (e.target.closest(".ch-zimmer")) gesicht(zufall(["grinsen", "schock", "errötet", "genervt"]), 1200); });

  /* ---------- Aussehen ---------- */
  const css = document.createElement("style");
  css.textContent = `
.charme .ch-buehne { position: relative; width: 100%; aspect-ratio: 16 / 10; overflow: hidden; border: 1px solid var(--line); background: #151017; user-select: none; -webkit-user-select: none; }
@media (max-width: 600px) { .charme .ch-buehne { aspect-ratio: 4 / 3.6; } }
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
.ch-nsc-kopf { display: grid; gap: .1rem; }
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
@media (prefers-reduced-motion: reduce) { .ch-sl .ch-koerper, .ch-sl .a-offen, .ch-sl.hops .ch-kopf, .ch-sl[data-m="lachen"] .ch-kopf { animation: none; } .ch-nsc { transition: opacity .3s; } }
`;
  document.head.appendChild(css);

  gesicht("neutral");
  zeichnen();
  new MutationObserver(zeichnen).observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });
  root._charme = { nsc: NSC, zustand: () => S, neu: neueSitzung, wuerfeln, joker, weiter, gesicht };
})();
