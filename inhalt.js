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

  /* ---------- HINWEIS VOR DER CHRONIK ---------- */
  erzaehler: {
    name: "Barradin",
    bild: "barradin.jpg",
    label: "Ein Wort vorab",
    text: "Diese Chronik wird euch erzählt von Barradin, und wie es sich für einen Barden gehört, erinnert er sich nicht an jedes Detail ganz genau … Das eine oder andere hat er vielleicht ein klein wenig schöngedichtet, komplett übertrieben oder gar ausgelassen … Imre allein kennt die wahre Geschichte … Diese hier wird euch hoffentlich trotzdem verzaubern!"
  },

  /* ---------- DIE CHRONIK ----------
     Ein Absatz, der mit "## " beginnt, wird zur Zwischenüberschrift.
     Ein Absatz wie "!bild.jpg|Bildunterschrift" fügt ein Bild ein.
     "station" verweist auf die Nummer der Station auf der Karte (1 = erste). */
  kapitel: [
    {
      nummer: "I",
      titel: "Der Weg nach Thunderlin",
      station: 1,
      absaetze: [
        "## Die Einladung",
        "Es begann mit einem Brief. Jeder der Helden erhielt eine Einladung von Gundren, einem Zwerg und Händler, der offenbar jeden kennt, der etwas zu sagen hat. Der Treffpunkt war eine kleine Hafenstadt am Meer: ein paar windschiefe Häuser, ein Kai voller Fischerboote und der Geruch von Salz und Teer.",
        "Dort standen sie nun beieinander, ein Elf mit Pfeife, ein Mensch mit Bogen und Hund, ein gehörnter Druide und ein schweigsamer Darkin. Die Vorstellungsrunde verlief, vorsichtig gesagt, etwas holprig. <em class=\"aside\">Ich erinnere mich vor allem daran, dass ich mich hervorragend vorgestellt habe.</em>",
        "Gundren kam schnell zur Sache. In einer alten, verlassenen Mine soll eine magische Schmiede liegen, in der einst magische Gegenstände geschaffen wurden. Einige mächtige Lords interessieren sich brennend dafür, und Gundren wittert die Chance, sein Exportgeschäft kräftig zu erweitern. Wie genau, behielt er für sich.",
        "Der erste Auftrag klang harmlos: einen Karren mit Waren sicher nach Thunderlin bringen. Und wer dort Elmar Barton aufspürt, dem winkt eine Extraportion Gold.",
        "## Hinterhalt auf der Straße",
        "Mehrere Tage lang rollte der Karren friedlich dahin. Dann war der Weg plötzlich versperrt: Ein überfallener, halb niedergebrannter Wagen lag quer auf der Straße. Die Gefährten ahnten sofort, dass hier etwas faul war. Als kurz darauf eine Handvoll Goblins aus dem Wald sprang, waren sie bereit, und der Kampf war vorbei, bevor er richtig begonnen hatte.",
        "## Die Goblinhöhle",
        "Statt einfach weiterzufahren, beschloss die Gruppe, den Spuren in den Wald zu folgen. In Thunderlin würde man ihnen für das Ende der Goblinplage sicher dankbar sein, und Beute gab es bestimmt auch.",
        "Am Eingang der Höhle stießen sie auf mehrere angebundene Wölfe, die sie kurzerhand befreiten. Dann stürmten sie das Goblinnest, teils lautlos aus dem Schatten, teils mit allem anderen als Zurückhaltung. <em class=\"aside\">Welcher Teil davon meiner war, lasse ich lieber offen.</em> Am Ende lagen der Anführer und seine gesamte Bande am Boden, und die Gefährten traten siegreich wieder ans Tageslicht.",
        "## Thunderlin und die Roten Roben",
        "Schließlich erreichten die Gefährten Thunderlin, ein kleines Dorf. Das Wichtigste zuerst: Sie kehrten in die Taverne ein, aßen und tranken nach Herzenslust und feilschten den Wirt auf äußerst günstige Zimmer herunter. Erst danach machten sie sich auf die Suche nach Informationen. Sie streiften durch die Gassen, sprachen mit den Bewohnern und versuchten herauszufinden, was hier vor sich ging. Doch die Leute blieben wortkarg, und schnell war klar: Hier geht nicht alles mit rechten Dingen zu.",
        "Den Durchbruch brachte Barradin. In der Taverne stimmte er ein Lied an und sang, bis er die Einheimischen ganz in seinen Bann gezogen hatte. Nun lösten sich die Zungen: Eine Bande, die sich die Roten Roben nennt, presst den Bewohnern Schutzgeld ab und hat sich in Schloss Crackmore verschanzt, gleich am Rand des Dorfes.",
        "Bevor sie gegen die Bande vorgingen, statteten die Gefährten noch dem Bürgermeister von Thunderlin einen Besuch ab. Ihr Ziel: eine Belohnung aushandeln, und zwar eine ordentliche. Das Gespräch geriet allerdings äußerst unangenehm. Die Forderungen waren, vorsichtig gesagt, übertrieben, die Stimmung kippte, und beinahe wäre das Ganze in einem handfesten Streit geendet. <em class=\"aside\">Ich würde es eher selbstbewusst nennen.</em>",
        "## Schloss Crackmore",
        "Die Gruppe verschaffte sich Zugang zum Schloss. Zuerst befreiten sie einen Gefangenen und erbeuteten dabei einige rote Roben, die ihnen fortan als Tarnung dienten. <em class=\"aside\">Wobei Ezekiel in seiner scharlachroten Rüstung vermutlich auch vorher schon nicht weiter aufgefallen wäre.</em> So drangen sie immer tiefer in das Gemäuer vor und stellten die Bande in mehreren Kämpfen, einen nach dem anderen. <em class=\"aside\">Wie viele Kämpfe es waren, weiß ich nicht mehr genau. Ich war damit beschäftigt, in der roten Robe gut auszusehen.</em>",
        "Zuletzt stellten sie ihren Anführer Glasstab. Als sich der Kampf gegen ihn wendete, versuchte er, durch einen geheimen Tunnel zu entkommen. Doch Barradin bekam ihn gerade noch zu packen und zerrte ihn zurück in den Raum, wo Friedrich ihn mit einem perfekten Kopfschuss niederstreckte.",
        "!glasstab-besiegt.jpg|Nach dem Sieg über Glasstab, noch in den erbeuteten roten Roben.",
        "Mit seinem letzten Atemzug sprach Glasstab von einer gewissen Spinne, der er offenbar diente. Ist es eine Person, eine Macht, eine geheime Organisation? Bisher weiß es niemand.",
        "Zurück in Thunderlin verbreiteten die Gefährten die frohe Kunde und versuchten nebenbei, ihre Belohnung noch ein wenig in die Höhe zu treiben. Danach wurde in der Taverne ausgelassen gefeiert. Doch so laut es auch wurde, ein Gedanke ließ sie nicht los: die Spinne, was auch immer sich dahinter verbergen mag.",
        "Nach der Feier ging es zum Bürgermeister, um die Belohnung abzuholen, und das wurde ähnlich unangenehm wie beim ersten Besuch. <em class=\"aside\">Sagen wir so: Er wird uns so schnell nicht wieder einladen.</em>",
        "## Der Gefangene im Wachturm",
        "An dieser Stelle muss euer Erzähler gestehen: Seine Erinnerung an die folgenden Tage ist ein wenig … nebelig. <em class=\"aside\">Vielleicht lag es am Kraut in meiner Pfeife.</em>",
        "Nach dem Sieg über die Roten Roben erhielten die Gefährten jedenfalls einen neuen Auftrag. Von wem und warum? Sie sollten einen Gefangenen aus einem Wachturm befreien, über den niemand etwas wusste, nicht einmal seinen Namen.",
        "Zuerst umrundeten sie den Turm, um sich einen Überblick zu verschaffen, und stiegen dann an einer günstigen Stelle ein. Die Überraschung gelang, und die Gefährten stellten die Wachen, bevor diese wussten, wie ihnen geschah.",
        "Doch dann stand ihnen ein riesiger Bugbär gegenüber, der ihnen gehörig zusetzte. <em class=\"aside\">In meiner Erinnerung war er mindestens drei Meter groß. Mindestens.</em> Am Ende ging aber auch er zu Boden.",
        "Unter den Gegnern war auch eine Dunkelelfe namens Nezna, die erbittert gegen die Gefährten kämpfte. Als der Kampf verloren war, hatte sie noch eine Überraschung parat: Sie war eine Gestaltwandlerin. Blitzschnell verwandelte sie sich in ein kleines Tier und huschte davon, schneller, als ihr irgendjemand folgen konnte. Zuvor aber sprach auch sie von der Spinne. <em class=\"aside\">Ich bin mir ziemlich sicher, dass sie „die Spinne“ gesagt hat. Ziemlich.</em>",
        "## Gundrens Bruder",
        "Der Gefangene war gerettet, und als er sich vorstellte, staunten die Gefährten nicht schlecht: Es war Nundro, Gundrens Zwillingsbruder. <em class=\"aside\">Nundro, nicht Nando … oder?</em>",
        "Gemeinsam mit ihm kehrten sie zu Gundren zurück, und der schloss seinen Bruder überglücklich in die Arme.",
        "## Die magische Schmiede",
        "Dann wurde es ernst. Gundren gab den Gefährten den Auftrag, auf den alles hinausgelaufen war: Sie sollten die magische Schmiede finden.",
        "Der Weg führte in die alte, verlassene Mine, in der sie verborgen sein sollte. Die Gruppe kämpfte sich durch Gang um Gang und Gegner um Gegner, und einige dieser Kämpfe waren richtig hart. <em class=\"aside\">Wie viele es genau waren? Viele. Sehr viele. Mehr als ich an zwei Händen abzählen kann, glaube ich.</em>",
        "Doch am Ende standen sie vor ihr: der magischen Schmiede, umgeben von leuchtenden Runen. Die Gefährten räumten die letzten Wächter aus dem Weg, bis die Schmiede ihnen gehörte, und kehrten zu Gundren zurück, um ihm die gute Nachricht zu überbringen.",
        "!magische-schmiede.jpg|Rast vor der magischen Schmiede. Barradin besteht darauf, dass er nicht angegeben hat.",
        "## Neverwinter",
        "Erst danach zog es die Gruppe nach Neverwinter. Wer große Taten vollbringt, sollte schließlich auch davon erzählen, und wo ginge das besser als in der großen Stadt? Kaum hatten sie sich ein Zimmer in einem Gasthof gesichert, baten sie um eine Audienz bei der Allianz der Lords.",
        "Ganz nach Protokoll lief das nicht. Etwas plump und ziemlich forsch marschierten die Gefährten an den Wachen vorbei, geradewegs zum Leiter der Allianz, Captain Dolgrimson. Der jedoch vertröstete sie: Für ein Gespräch habe man erst später Zeit.",
        "Also streiften sie durch die Straßen von Neverwinter, lauschten in Tavernen und auf Marktplätzen und versuchten, Gerüchte aufzuschnappen. Ohne Erfolg. <em class=\"aside\">Glaube ich. Oder ich habe die Gerüchte vergessen. Beides möglich.</em>",
        "## Die Allianz der Lords",
        "Schließlich kehrten sie zur Allianz zurück. Nach einem langen Gespräch fassten die Gefährten einen Entschluss: Sie würden der Allianz der Lords beitreten und ihre Kräfte stärken."
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
      { name: "Thunderlin", x: 58, y: 64, kapitel: "I", abschnitt: "Thunderlin und die Roten Roben", text: "Ein kleines Dorf in den Fängen der Roten Roben. Am Dorfrand liegt Schloss Crackmore, wo Glasstab fällt und von der Spinne spricht." },
      { name: "Der Wachturm", x: 80, y: 40, kapitel: "I", abschnitt: "Der Gefangene im Wachturm", text: "Ein Bugbär fällt, eine Drow flieht, und der Gefangene entpuppt sich als Gundrens Zwillingsbruder Nundro." },
      { name: "Die magische Schmiede", x: 68, y: 22, kapitel: "I", abschnitt: "Die magische Schmiede", text: "Tief in einer alten, verlassenen Mine verborgen. Nach harten Kämpfen gehört sie der Gruppe." },
      { name: "Neverwinter", x: 24, y: 26, kapitel: "I", abschnitt: "Neverwinter", text: "Die große Stadt. Hier treten die Gefährten der Allianz der Lords bei." }
    ]
  },

  /* ---------- DAS BESTIARIUM ----------
     status: "besiegt", "gesichtet" oder "geruecht" (nur davon gehört)
     bild ist optional. Beispiel:
     { name: "Goblin", bild: "goblin.jpg", status: "besiegt", ort: "Die Straße", text: "Klein und gemein." } */
  bestiarium: []
};
