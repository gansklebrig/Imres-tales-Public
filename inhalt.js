/* =====================================================================
   IMRES TALES – ALLE INHALTE DER WEBSITE
   ---------------------------------------------------------------------
   Diese Datei enthält alle Texte. Für neue Kapitel, Stationen oder
   Gegner muss nur diese Datei ausgetauscht werden – die index.html
   bleibt gleich.

   Bilder liegen direkt neben dieser Datei (ohne Unterordner). Absätze stehen jeweils in
   Anführungszeichen und werden durch Kommas getrennt.
   ===================================================================== */

window.INHALT = {

  /* ---------- INTRO (oben auf der Seite) ---------- */
  intro: {
    label: "Unser Spielleiter",
    text: "Eine Welt. Vier Helden. Ein Hund. Und <strong>Imre</strong>, unser grandioser Spielleiter, Herr über Würfel, Welten und Schicksale. Ohne ihn gäbe es keine Hafenstadt, keine magische Schmiede und keinen einzigen gescheiterten Rettungswurf. Was hier geschrieben steht, hat er erschaffen. Wir haben es nur überlebt … bisher jedenfalls …"
  },

  /* ---------- DIE GEFÄHRTEN ---------- */
  helden: [
    {
      id: "barradin",
      name: "Barradin",
      rolle: "Barde",
      beiname: "der Barde mit der goldenen Zunge",
      bild: "barradin.jpg",
      bildAlt: "Barradin mit brennenden Jonglierfackeln auf einem nächtlichen Markt",
      bildtext: "Barradin in seinem Element: Feuer, Publikum und ein breites Grinsen.",
      fries: "50% 30%",
      absaetze: [
        "Wo der elfische Barde Barradin auftaucht, wird es nicht leise. Er singt Balladen, wirbelt brennende Fackeln durch die Luft und schlägt Saltos, bis die Menge jubelt. Dass er gut ist, weiß er selbst am besten, und er sagt es auch gern. Sein Selbstbewusstsein ist ansteckend: Hat Barradin erst einmal Feuer gefangen, reißt er die ganze Gruppe mit.",
        "Seine schärfste Waffe ist seine Zunge. Mit Spott und Witz bringt er Gegner aus der Fassung, und schon so mancher Feind ist unter seinen Versen buchstäblich zusammengebrochen. Dass er im Eifer des Gefechts auch mal über die eigenen Füße stolpert, gehört zu seinem Charme.",
        "Aufgewachsen ist Barradin im Haus seines Vaters, eines eifrigen Mitglieds der <em>Alternative für Elfen</em>. Heute geht er bewusst einen anderen Weg. An der Seite eines Menschen, eines Druiden, eines Darkin und eines Hundes hat er gelernt, dass Herkunft nichts über den Wert eines Gefährten sagt, und dafür steht er mit voller Stimme ein.",
        "Man findet ihn meist mit seiner Pfeife in der Hand, umgeben von einer Wolke aus duftendem Kraut."
      ]
    },
    {
      id: "friedrich",
      name: "Friedrich",
      rolle: "Waldläufer",
      beiname: "der rechtschaffene Waldläufer",
      bild: "friedrich.jpg",
      bildAlt: "Friedrich mit Langbogen in einem Wald voller Baumhäuser und Tiere",
      bildtext: "Friedrich in den Wäldern, die er so gut kennt.",
      fries: "52% 30%",
      absaetze: [
        "Friedrich ist ein Mensch, ein Waldläufer und der ruhende Pol der Gruppe. Wo andere schon die Waffen ziehen, sucht er zuerst das Gespräch und einen Weg, der ohne Blutvergießen auskommt. Er ist ehrlich, verlässlich und hat ein feines Gespür dafür, was richtig ist.",
        "Mit seinem Langbogen ist er ein wahrer Meister. Egal ob Blatt im Wind, ein fliehender Hase oder ein Schurke hinter der Burgmauer: Friedrichs Pfeile finden ihr Ziel. Wer seine ausgestreckte Hand ausschlägt, lernt schnell, dass Friedfertigkeit nicht Schwäche bedeutet. Muss er handeln, dann zögert er keinen Augenblick und beendet häufig mit nur einem einzigen Pfeil den Kampf.",
        "An seiner Seite ist immer Rex, sein treuer Hund."
      ],
      begleiter: {
        id: "rex",
        name: "Rex",
        rolle: "Gefährte",
        bild: "rex.jpg",
        bildAlt: "Rex, ein Hund im Abenteurerumhang",
        fries: "45% 40%",
        absaetze: [
          "Rex ist das Herz der Gruppe und der unangefochtene Liebling aller. Er ist verspielt, neugierig und immer bereit für ein Abenteuer, auch wenn er gelegentlich vergisst, worum es eigentlich ging.",
          "Ob er einen Stock jagt oder einen Goblin: Rex macht alles mit vollem Einsatz und wedelndem Schwanz."
        ]
      }
    },
    {
      id: "echo",
      name: "Echo",
      rolle: "Druide",
      beiname: "der gehörnte Druide",
      bild: "echo.jpg",
      bildAlt: "Echo, ein Druide mit Geweih und weißem Gewand in einem nebligen Wald",
      bildtext: "Echo, kurz bevor jemand etwas Falsches sagt.",
      breitbild: true,
      fries: "56% 30%",
      absaetze: [
        "Echo hat den größten Teil seines Lebens in den tiefen Wäldern verbracht. Dort wurde er zum Druiden: Er lernte die Sprache der Natur, studierte Monster und weckte die alte Magie in sich. Wenn es sein muss, nimmt er selbst die Gestalt eines Tieres an.",
        "Von langen Verhandlungen hält er wenig. Wird ein Gegner frech, lässt Echo lieber Taten sprechen, und die sehen meistens aus wie ein Feuerball.",
        "Seine größte Leidenschaft ist Beute. Echo hat einen untrüglichen Riecher für Schätze: Keine Truhe bleibt ungeöffnet, kein besiegter Gegner undurchsucht. Am liebsten würde er alles einstecken, was glänzt. Am Ende des Tages landet der Schatz aber doch auf dem gemeinsamen Haufen, denn für Echo gehört die Gruppe dazu.",
        "Sein Humor ist herzhaft und manchmal so grob wie ein alter Eichenstamm, doch darunter steckt ein treuer Gefährte."
      ]
    },
    {
      id: "ezekiel",
      name: "Ezekiel",
      rolle: "Schurke",
      beiname: "the Destroyer",
      bild: "ezekiel.jpg",
      bildAlt: "Ezekiel, eine gehörnte Gestalt mit Kapuze und zwei Klingen vor brennenden Ruinen",
      bildtext: "Was Ezekiel denkt, weiß nur Ezekiel.",
      fries: "50% 20%",
      absaetze: [
        "Ezekiel ist der Schurke der Gruppe und ein Mann weniger Worte. Er beobachtet, wartet und schlägt zu, wenn niemand damit rechnet. Unter seiner Kapuze verbirgt sich ein Darkin, dessen Gedanken für seine Gefährten ein ewiges Rätsel bleiben.",
        "Mal überrascht er die Gruppe mit einer unerwartet freundlichen Geste, mal zeigt er die eiskalte Ruhe eines Assassinen. Genau das macht ihn so wertvoll: Seine Feinde wissen nie, was sie erwartet. Seine Gefährten dagegen haben gelernt, dass sie sich im entscheidenden Moment auf ihn verlassen können.",
        "Viele Gegner haben bereits seinen kalten Stahl zu spüren bekommen. Es werden nicht die letzten sein."
      ],
      geheimnis: "Über seine Vergangenheit schweigt Ezekiel. Welche Geschichte hinter dem Namen „the Destroyer“ steckt, wird sich eines Tages zeigen."
    }
  ],

  /* ---------- DIE CHRONIK ----------
     Ein Absatz, der mit "## " beginnt, wird zur Zwischenüberschrift.
     "station" verweist auf die Nummer der Station auf der Karte (1 = erste). */
  kapitel: [
    {
      nummer: "I",
      titel: "Der Weg nach Thunderlin",
      station: 1,
      absaetze: [
        "## Die Einladung",
        "Es begann mit einem Brief. Jeder der Helden erhielt eine Einladung von Gundren, einem Zwerg und Händler, der offenbar jeden kennt, der etwas zu sagen hat. Der Treffpunkt war eine kleine Hafenstadt am Meer: ein paar windschiefe Häuser, ein Kai voller Fischerboote und der Geruch von Salz und Teer.",
        "Dort standen sie nun beieinander, ein Elf mit Pfeife, ein Mensch mit Bogen und Hund, ein gehörnter Druide und ein schweigsamer Darkin. Die Vorstellungsrunde verlief, vorsichtig gesagt, etwas holprig.",
        "Gundren kam schnell zur Sache. Irgendwo in der Wildnis soll eine magische Schmiede liegen, in der einst magische Gegenstände geschaffen wurden. Einige mächtige Lords interessieren sich brennend dafür, und Gundren wittert die Chance, sein Exportgeschäft kräftig zu erweitern. Wie genau, behielt er für sich.",
        "Der erste Auftrag klang harmlos: einen Karren mit Waren sicher nach Thunderlin bringen. Und wer dort Elmar Barton aufspürt, dem winkt eine Extraportion Gold.",
        "## Hinterhalt auf der Straße",
        "Mehrere Tage lang rollte der Karren friedlich dahin. Dann war der Weg plötzlich versperrt: Ein überfallener, halb niedergebrannter Wagen lag quer auf der Straße. Die Gefährten ahnten sofort, dass hier etwas faul war. Als kurz darauf eine Handvoll Goblins aus dem Wald sprang, waren sie bereit, und der Kampf war vorbei, bevor er richtig begonnen hatte.",
        "## Die Goblinhöhle",
        "Statt einfach weiterzufahren, beschloss die Gruppe, den Spuren in den Wald zu folgen. In Thunderlin würde man ihnen für das Ende der Goblinplage sicher dankbar sein, und Beute gab es bestimmt auch.",
        "Am Eingang der Höhle stießen sie auf mehrere angebundene Wölfe, die sie kurzerhand befreiten. Dann stürmten sie das Goblinnest, teils lautlos aus dem Schatten, teils mit allem anderen als Zurückhaltung. Am Ende lagen der Anführer und seine gesamte Bande am Boden, und die Gefährten traten siegreich wieder ans Tageslicht.",
        "## Thunderlin und die Roten Roben",
        "Schließlich erreichten die Gefährten Thunderlin, ein kleines Dorf. Sie streiften durch die Gassen, sprachen mit den Bewohnern und versuchten herauszufinden, was hier vor sich ging. Doch die Leute blieben wortkarg, und schnell war klar: Hier geht nicht alles mit rechten Dingen zu.",
        "Den Durchbruch brachte Barradin. In der Taverne stimmte er ein Lied an und sang, bis er die Einheimischen ganz in seinen Bann gezogen hatte. Nun lösten sich die Zungen: Eine Bande, die sich die Roten Roben nennt, presst den Bewohnern Schutzgeld ab und hat sich in Schloss Crackmore verschanzt, gleich am Rand des Dorfes.",
        "## Schloss Crackmore",
        "Die Gruppe verschaffte sich Zugang zum Schloss. Zuerst befreiten sie einen Gefangenen und erbeuteten dabei einige rote Roben, die ihnen fortan als Tarnung dienten. So drangen sie immer tiefer in das Gemäuer vor und stellten die Bande in mehreren Kämpfen, einen nach dem anderen. Auch ihr Anführer Glasstab fiel.",
        "Mit seinem letzten Atemzug sprach Glasstab von einer gewissen Spinne, der er offenbar diente. Ist es eine Person, eine Macht, eine geheime Organisation? Bisher weiß es niemand.",
        "Siegreich kehrten die Gefährten nach Thunderlin zurück. Die Frage nach der Spinne aber lässt sie seitdem nicht mehr los."
      ],
      fortsetzung: "Fortsetzung folgt …"
    }
  ],

  /* ---------- DIE REISE ----------
     karte: Dateiname der Weltkarte, z. B. "weltkarte.jpg" (null = Platzhalter)
     x / y: Position in Prozent von links / von oben (0 bis 100)
     abschnitt: Zwischenüberschrift im Kapitel, zu der die Station springt */
  reise: {
    karte: null,
    stationen: [
      { name: "Die kleine Hafenstadt", x: 8, y: 76, kapitel: "I", abschnitt: "Die Einladung", text: "Gundren lädt die Helden ein und bietet ihnen die Suche nach einer magischen Schmiede an." },
      { name: "Hinterhalt auf der Straße", x: 30, y: 66, kapitel: "I", abschnitt: "Hinterhalt auf der Straße", text: "Ein zerstörter Wagen versperrt den Weg. Die Goblins, die aus dem Wald springen, haben keine Chance." },
      { name: "Die Goblinhöhle", x: 30, y: 54, kapitel: "I", abschnitt: "Die Goblinhöhle", text: "Nur durch ein kleines Waldstück vom Ort des Überfalls getrennt. Wölfe befreit, Nest gestürmt, Anführer erschlagen." },
      { name: "Thunderlin", x: 58, y: 64, kapitel: "I", abschnitt: "Thunderlin und die Roten Roben", text: "Ein kleines Dorf in den Fängen der Roten Roben. Am Dorfrand liegt Schloss Crackmore, wo Glasstab fällt und von der Spinne spricht." }
    ]
  },

  /* ---------- DAS BESTIARIUM ----------
     status: "besiegt", "gesichtet" oder "geruecht" (nur davon gehört)
     bild ist optional. Beispiel:
     { name: "Goblin", bild: "goblin.jpg", status: "besiegt", ort: "Die Straße", text: "Klein und gemein." } */
  bestiarium: []
};
