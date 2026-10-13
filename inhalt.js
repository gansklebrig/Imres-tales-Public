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
    text: "Die Welt, erschaffen von <strong>Imre</strong>, unserem grandiosen Spielleiter, Herrn über Würfel, Welten und Schicksale. Ohne ihn gäbe es keine Hafenstadt, keine magische Schmiede und keinen einzigen gescheiterten Rettungswurf. Was hier geschrieben steht, hat er erschaffen. Wir haben es nur überlebt … bisher jedenfalls …"
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
        "Wo der elfische Barde Barradin auftaucht, wird es nicht leise. Er singt Balladen, wirbelt brennende Fackeln durch die Luft und schlägt Saltos, bis die Menge jubelt. Dass er gut ist, weiß er und sein Selbstbewusstsein ist ansteckend.",
        "Seine schärfste Waffe ist seine Zunge. Mit Spott und Witz bringt er Gegner aus der Fassung, und schon so mancher Feind ist unter seinen Beschimpfungen buchstäblich zusammengebrochen. Dass er, tollpatschig wie eh und je, im Eifer des Gefechts auch mal über die eigenen Füße stolpert, gehört zu seinem Charme.",
        "Aufgewachsen ist Barradin im Haus seines Vaters, eines eifrigen Mitglieds der <em>Alternative für Elfen</em>. Heute geht er bewusst einen anderen Weg. An der Seite eines Menschen, eines Druiden, eines Darkin und eines Hundes hat er gelernt, dass Herkunft nichts über den Wert eines Gefährten sagt, und dafür steht er mit voller Stimme ein.",
        "Man findet ihn meist mit seiner Pfeife in der Hand, umgeben von einer Wolke aus duftendem Kraut und einem breiten Grinsen im Gesicht."
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
      titel: "Der Weg nach Phandalin",
      station: 1,
      absaetze: [
        "## Die Einladung",
        "Es begann mit einem Brief. Jeder von uns erhielt eine Einladung von Gundren, einem Zwerg und Händler, der offenbar jeden kennt, der etwas zu sagen hat. Treffpunkt: der Hafen von Neverwinter. Knarrende Stege, Fischerboote, Händler und Matrosen, und über allem der Geruch von Salz und Teer. Ich weiß noch, wie ich dort stand, die Pfeife im Mundwinkel, und spürte: Hier beginnt etwas Großes.",
        "Da standen wir nun beieinander: ich, der pfeiferauchende Barde, daneben ein verschmitzt grinsender Mensch mit Bogen und Hund, ein gehörnter Druide, der aussah, als wäre er bereit für jeden Streit, und noch ein Darkin, der mit regungsloser Mimik nicht durchblicken ließ, was in ihm vorging … Die Vorstellungsrunde verlief, vorsichtig gesagt, etwas holprig.",
        "Gundren kam deshalb schnell zur Sache. Seinen Informationen nach solle in einer alten, verlassenen Mine eine magische Schmiede zu finden sein. In ihr wurden dereinst magische Gegenstände geschaffen. Einige mächtige Lords interessieren sich brennend dafür, und Gundren witterte die Chance, sein Exportgeschäft kräftig zu erweitern. Wie genau, behielt er für sich. Mich hatte er ohnehin schon bei den Worten „magische Schmiede“.",
        "!gundren-treffen.jpg|Unser erstes Treffen mit Gundren. Hier beginnt unser Abenteuer.",
        "Unser erster Auftrag klang harmlos: einen Karren mit Waren sicher nach Phandalin bringen. Und wer dort Elmar Barton aufspürt, dem winkt eine Extraportion Gold. Echos Augen leuchteten bei diesem Satz heller als jede Fackel.",
        "!aufbruch-neverwinter.jpg|Aufbruch aus Neverwinter. Die Stimmung auf dem Kutschbock war bestens.",
        "## Hinterhalt auf der Straße",
        "Mehrere Tage lang rollte der Karren friedlich dahin, und ich hatte schon begonnen, ein Lied über langweilige Reisen zu dichten. Dann war der Weg plötzlich versperrt: Ein überfallener, halb niedergebrannter Wagen lag quer auf der Straße. Meinen Gefährten und mir lief ein Schauer über den Rücken, jeder ahnte sofort, dass hier etwas faul war. Als kurz darauf eine Handvoll Goblins aus dem Wald sprang, stand unsere kleine Truppe längst kampfbereit und trat den Goblins entgegen. Der Kampf war dank einiger verfehlter Angriffe unserer Gruppe härter als erwartet, doch wir konnten die Goblins letztlich niederstrecken.",
        "!hinterhalt-sieg.jpg|Die Goblins liegen am Boden, und der Wagen hat nichts abbekommen.",
        "## Die Goblinhöhle",
        "Ich weiß nicht, ob wir direkt Blut geleckt hatten oder uns die Hoffnung auf eine Belohnung antrieb … Statt einfach weiterzufahren, beschloss unsere neu gefundene Heldengruppe, den Spuren in den Wald zu folgen.",
        "Wir fanden noch weitere Goblins, die diesmal schneller ihr Ende fanden. Echo konnte den Spuren der Banditen durch den Wald folgen, und wir fanden eine Höhle in einem düsteren Felsspalt.",
        "Am Eingang der Höhle erwarteten uns mehrere angebundene Wölfe. Ihr Winseln ging mir durch Mark und Bein, also befreiten wir sie kurzerhand. Dann ging es hinein ins Goblinnest, teils lautlos aus dem Schatten, teils mit allem anderen als Zurückhaltung. <em class=\"aside\">Welcher Teil davon meiner war, lasse ich lieber offen.</em> Am Ende lagen der Anführer und seine gesamte Bande am Boden, und vier verschwitzte, ziemlich zufriedene Abenteurer samt Hund traten wieder ans Tageslicht.",
        "!woelfe-befreit.jpg|Die befreiten Wölfe in der Goblinhöhle. Friedrich war hier ganz klar die treibende Kraft.",
        "## Phandalin und die Roten Roben",
        "Schließlich erreichte unser Karren Phandalin, ein kleines Dorf. Das Wichtigste zuerst: ab in die Taverne! Es wurde gegessen und getrunken, bis keiner mehr konnte, und den Wirt feilschten wir auf äußerst günstige Zimmer herunter. Erst danach begann die Suche nach Informationen. Die Gefährten streiften durch die Gassen, sprachen mit den Bewohnern und versuchten herauszufinden, was hier vor sich ging. Doch die Leute blieben wortkarg und wichen unseren Blicken aus, und schnell war klar: Hier geht nicht alles mit rechten Dingen zu.",
        "Den Durchbruch brachte, natürlich, ich. In der Taverne stimmte ich ein Lied an und sang, bis ich die Einheimischen ganz in meinen Bann gezogen hatte. Nun lösten sich die Zungen: Eine Bande, die sich die Roten Roben nennt, presst den Bewohnern Schutzgeld ab und hat sich in Schloss Crackmore verschanzt, gleich am Rand des Dorfes. Die Angst in ihren Stimmen machte mich wütend.",
        "Bevor es gegen die Bande ging, stattete unsere Truppe noch dem Bürgermeister von Phandalin einen Besuch ab. Unser Ziel war es eigentlich nur, eine saftige Belohnung auszuhandeln, jedoch eskalierte das Gespräch recht schnell … Unsere Forderungen waren, vorsichtig gesagt, übertrieben und vielleicht ein bisschen herablassend … Beinahe wäre das Ganze in einem handfesten Streit geendet, aber wir konnten die Situation dann doch noch entschärfen und mit einer Aussicht auf eine Belohnung für die Zerschlagung der Bande weiterziehen.",
        "!buergermeister-streit.jpg|Verhandlungen mit dem Bürgermeister von Phandalin. Es lief … sagen wir, lebhaft.",
        "## Schloss Crackmore",
        "Zufälligerweise fanden wir einen geheimen Weg in das alte, mit Ranken umwachsene Schloss und stiegen dort über teils eingefallene, staubige Tunnel hinab in eine Höhle, die sich unter dem Anwesen befand. Hier fanden wir ein paar Gegner, die mehrere Geiseln aus dem Dorf bewachten und in einer kleinen Zelle gefangen hielten. Wir konnten die Wachen überwältigen und befreiten jene, die aus dem Dorf verschleppt wurden.",
        "Wir nahmen den Gegnern ihre roten Roben ab, um uns so getarnt weiter in die Schlossruine vorzuwagen. <em class=\"aside\">Wobei Ezekiel in seiner scharlachroten Rüstung vermutlich auch vorher schon nicht weiter aufgefallen wäre.</em> Wir drangen immer tiefer in das Gemäuer vor, das Herz bei jedem Schritt im Hals.",
        "Hinter einer geschlossenen Tür fanden wir den Raum eines Alchemisten, jedenfalls waren hier die Wände voll mit Kräutern. In einigen Schränken und einer Vitrine befanden sich Gläser mit irgendwelchen gefangenen Wesen, teils lebendig, teils tot in einer Flüssigkeit treibend. Augen und Zungen, nicht auszumalen, was hier alles zu finden war. Außerdem hing ein starker Geruch von einem Feuer in der Luft. Ich versuchte, den Raum heimlich zu erkunden, tollpatschig wie ich bin, stieß ich jedoch gegen einen der Schränke, und eine der Phiolen fiel herunter …",
        "Daraufhin öffnete sich die andere Tür, und vor uns stand Glasstab, der Anführer der Roten Roben! Er war äußerst erzürnt über meine Tollpatschigkeit, und ich konnte ihn nur mit großer Mühe überzeugen, dass wir die neuen Rekruten sind und bereit wären für Arbeit … Zum Glück hat er uns geglaubt und uns weggeschickt.",
        "Im Nebenraum fanden wir eine Gruppe von vier Anhängern der Roten Roben, die dort ausgelassen tranken und ein Würfelspiel spielten. Wir mischten uns unter sie und brachten die Gegner dazu, noch mehr Alkohol zu trinken … Als sie alle so betrunken waren, dass wir für sie wohl wie zwölf aussahen, stach Ezekiel den ersten Gegner gekonnt mit seinem Dolch nieder, und wir nutzten den Überraschungsmoment, um die restlichen zu töten.",
        "Danach ging es Glasstab an den Kragen, und wir stellten ihn in seinem abgeschiedenen Labor. Er versuchte noch einen lächerlichen Angriff gegen uns, merkte jedoch schnell, dass seine Gefolgschaft ihm nicht mehr helfen konnte, und ergriff die Flucht durch einen Geheimgang am Ende seines Raums. Ich sprintete ihm hinterher und konnte ihn im entscheidenden Moment packen und mit aller Kraft wieder zurück in den Raum zerren, und Friedrich nutzte die Chance, um ihn mit einem perfekt platzierten Pfeil zwischen die Augen niederzustrecken!",
        "!glasstab-besiegt.jpg|Nach dem Sieg über Glasstab, noch in den erbeuteten roten Roben.",
        "Mit seinem letzten Atemzug sprach Glasstab von einer gewissen Spinne, der er offenbar diente. Ist es eine Person, eine Macht, eine geheime Organisation? Fragen über Fragen, die vor allem Friedrich stark beschäftigten.",
        "Zurück in Phandalin verbreiteten die Helden des Tages die frohe Kunde, und nach einer intensiven Diskussion, in der wir die Möglichkeiten der Bedeutung von „der Spinne“ besprachen, dauerte es nicht allzu lange, bis wir mit den befreiten Gefangenen und anderen Dorfbewohnern bis tief in die Nacht feierten.",
        "!siegesfeier.jpg|Unsere Siegesfeier in Phandalin. In meinem Horn ist übrigens nur Saft.",
        "Nach der Feier ging es zum Bürgermeister, um die Belohnung abzuholen, und das wurde ähnlich unangenehm wie beim ersten Besuch. <em class=\"aside\">Sagen wir so: Er wird uns so schnell nicht wieder einladen.</em>",
        "## Der Gefangene im Wachturm",
        "An dieser Stelle muss ich gestehen: Meine Erinnerung an die folgenden Tage ist ein wenig … nebelig. <em class=\"aside\">Vielleicht lag es am Kraut in meiner Pfeife.</em>",
        "Nach dem Sieg über die Roten Roben wartete jedenfalls schon der nächste Auftrag auf uns. Von wem und warum? Wir sollten einen Gefangenen aus einem Wachturm befreien, über den niemand etwas wusste, nicht einmal seinen Namen.",
        "Zuerst ging es einmal rund um den Turm, um uns einen Überblick zu verschaffen, dann stiegen die Gefährten an einer günstigen Stelle ein. Die Überraschung gelang: Ehe die Wachen wussten, wie ihnen geschah, standen ihnen vier Abenteurer und ein knurrender Hund gegenüber.",
        "Doch dann stand uns ein riesiger Bugbär gegenüber, der uns gehörig zusetzte. <em class=\"aside\">In meiner Erinnerung war er mindestens drei Meter groß. Mindestens.</em> Am Ende ging aber auch er zu Boden.",
        "Unter den Gegnern war auch eine Dunkelelfe namens Nezna, die erbittert gegen uns kämpfte. Als der Kampf verloren war, hatte sie noch eine Überraschung parat: Sie war eine Gestaltwandlerin. Blitzschnell verwandelte sie sich in ein kleines Tier und huschte davon, schneller, als ihr irgendjemand von uns folgen konnte. Zuvor aber sprach auch sie von der Spinne. <em class=\"aside\">Ich bin mir ziemlich sicher, dass sie „die Spinne“ gesagt hat. Ziemlich.</em>",
        "## Gundrens Bruder",
        "Der Gefangene war gerettet, und als er sich vorstellte, staunte die ganze Truppe nicht schlecht: Es war Nundro, Gundrens Zwillingsbruder. <em class=\"aside\">Nundro, nicht Nando … oder?</em>",
        "Gemeinsam mit ihm kehrten wir zu Gundren zurück, und der schloss seinen Bruder überglücklich in die Arme. Ich gebe zu, bei diesem Anblick wurde selbst mir ein wenig warm ums Herz.",
        "## Die magische Schmiede",
        "Dann wurde es ernst. Gundren gab uns den Auftrag, auf den alles hinausgelaufen war: Wir sollten die magische Schmiede finden.",
        "Der Weg führte uns in die alte, verlassene Mine, in der sie verborgen sein sollte. Wir fanden unseren Weg durch die riesige Höhle, kletterten Schluchten hinab und schlichen durch bröcklige, spinnwebenverhangene Gänge, die vor langer Zeit gebaut wurden.",
        "Gegner um Gegner stellte sich uns in den Weg, doch wir konnten sowohl die alten, klapprigen Skelette als auch die fledermausähnlichen Kreaturen, die uns von der Decke aus ansprangen, niederstrecken! Einige dieser Kämpfe waren richtig hart. <em class=\"aside\">Wie viele es genau waren? Viele. Sehr viele. Mehr als ich an zwei Händen abzählen kann, glaube ich.</em>",
        "Am Ende eines dieser Gänge wartete eine alte Bekannte: Nezna, die Drow, die uns im Wachturm als kleines Tier entwischt war. Ein zweites Mal ließen wir uns nicht von ihr austricksen. Ich nutzte meine Fähigkeiten als glamouröser Barde und wirkte einen Manipulationszauber, der sie daran hinderte, uns bereits aus der Ferne anzugreifen, Echo setzte ihr und ihren beiden Söldnern mit seiner Blitzmagie zu, und sie überlebten seinen Angriff nur knapp! Friedrich streckte den einen der Söldner jedoch sofort mit einem Pfeil nieder, während Rex den zweiten in Schach hielt und diesen in sein Bein biss! Ezekiel nutzte die Ablenkung, schlich sich an Nezna heran und stach ihr seinen Dolch tief in den Rücken! Blut gurgelnd ging Nezna auf die Knie, ihre Hände ungläubig auf die Stelle an ihrer Brust gepresst, an der sie der Dolch durchbohrt hatte und die sich schnell scharlachrot verfärbte … Mit letzter Kraft röchelte sie: „Die Spinne wird euch holen“, bevor sie endgültig zusammenbrach!",
        "Wir besiegten den letzten Söldner mit Leichtigkeit – sein Kampfeswille war gebrochen, er verteidigte sich panisch, jedoch half ihm das nichts, und kurz darauf lag er regungslos neben seiner Auftraggeberin und dem anderen Söldner auf dem kalten Boden der Höhle …",
        "Wir gingen noch tiefer, auf der Suche nach unserem Ziel, dachten kurzzeitig schon, es wäre alles nur ein Mythos, doch am Ende standen wir vor ihr: der magischen Schmiede, umgeben von leuchtenden Runen. Für einen Moment war es ganz still, und ich vergaß sogar, etwas Kluges zu sagen. Wie viele Generationen hatten hier wohl schon magische Gegenstände geschaffen, wie viele Schlachten wurden gekämpft, um sie unter ihre Kontrolle zu bringen?",
        "Die letzten verbliebenen Wächter der Schmiede räumte unsere Gruppe noch aus dem Weg, dann gehörte sie endlich uns!",
        "Wir schlugen unser Lager auf und überlegten, wie wir weiter vorgehen wollten.",
        "!magische-schmiede.jpg|Rast vor der magischen Schmiede. Und nein, ich habe nicht angegeben.",
        "Letztlich ging es zurück zu Gundren, um ihm die gute Nachricht zu überbringen und ihm und seinen Auftraggebern die Kunde von der gefundenen magischen Schmiede und dem Beseitigen der Wächter zu überbringen.",
        "## Neverwinter",
        "Wir kehrten nach Neverwinter zurück, in die Stadt, in deren Hafen alles begonnen hatte. Wer große Taten vollbringt, sollte schließlich auch davon erzählen, und wo ginge das besser als in der großen Stadt? Kaum hatten wir uns ein Zimmer in einem Gasthof gesichert, „baten“ wir um eine Audienz bei der Allianz der Lords.",
        "Ganz nach Protokoll lief das nicht. Etwas plump und ziemlich forsch marschierte unsere Truppe an den Wachen vorbei, geradewegs zum Leiter der Allianz, Captain Dolgrimson. Der war nicht gerade erfreut, doch als wir ihm erzählten, dass wir in Gundrens Auftrag die magische Schmiede aufgespürt und befreit hatten, verbesserte sich seine Stimmung merklich.",
        "Trotzdem vertröstete er uns auf den darauffolgenden Tag: Für ein Gespräch habe man erst später Zeit.",
        "Also ging es auf eigene Faust durch die Straßen von Neverwinter, wir lauschten in Tavernen und auf Marktplätzen und versuchten, Gerüchte aufzuschnappen, um die Zeit zu nutzen und noch etwas Geld zu verdienen … Jedoch ohne Erfolg, und wir kehrten abends zu unserem Gasthof zurück. Nach ein paar Getränken an der Bar ging der Tag zu Ende, und unsere Helden schliefen seelenruhig in ihren Betten. Nach ein paar Wochen auf der Straße fühlte es sich einfach nur wunderbar an, in einem gepolsterten und sauberen Bett zu liegen!",
        "## Die Allianz der Lords",
        "Schließlich ging es zurück zur Allianz. Nach einem langen Gespräch stand der Entschluss fest: Unsere Heldengruppe würde der Allianz der Lords beitreten und ihre Kräfte stärken. Ein Barde in den Reihen der Lords. Mir gefiel, wie das klang.",
        "## Donnerbaum",
        "Kaum waren wir Mitglieder der Allianz, wartete auch schon der erste Auftrag. Captain Dolgrimson schickte uns nach Donnerbaum, einem kleinen, verlassenen Dorf etwas östlich von Neverwinter. Wir sollten dort nach dem Rechten sehen …",
        "Donnerbaum empfing uns mit einer Stille, die mir sofort unter die Haut kroch: ein paar Häuser, die verlassen wirkten, und über allem ein großer, halb verfallener Wachturm, an dessen Mauern Moos und Moder nagten.",
        "## Der Drache im Turm",
        "Die Gefährten schlichen durch den Turm nach oben. Stufe um Stufe, gespannt, was sie dort erwarten sollte … Auf dem höchsten Plateau schlug das Schicksal zu: Ein junger grüner Drache griff an, ein giftspeiendes Ungetüm mit riesigen Krallen und Zähnen, die nur darauf warteten, uns zu zerfetzen … Ein Venomfang!",
        "Der Kampf war brutal. Dann kam mein großer Moment: Ich zog den Drachen mit meiner Magie in einen hypnotischen Bann, und meine Gefährten nutzten die Gelegenheit, um sich in Stellung zu bringen. <em class=\"aside\">Ich erwähne das nur der Vollständigkeit halber. Und weil es großartig war.</em> Am Ende fiel der Venomfang durch unsere vereinten Kräfte und etliche gezielte Angriffe!",
        "Sein Giftatem hatte uns jedoch übel zugesetzt. Meine Lunge brannte noch Stunden danach, und auch die anderen waren von dem brutalen Kampf gezeichnet. Echo und Ezekiel hatte der Drache mit seinem Gift direkt getroffen und schwere Wunden hinterlassen, und Friedrich wurde beinahe von einer Kralle skalpiert.",
        "Wir überlebten also nur knapp, und die Priorität war gerade, erst einmal durchzuatmen, sich um die Wunden zu kümmern, meine Pfeife zu stopfen und dann natürlich die Beute einzusammeln. Echo war dabei, wie man sich denken kann, besonders gründlich.",
        "!venomfang-besiegt.jpg|Der Venomfang ist besiegt. Ich gönne mir eine Pfeife, und Rex hat sich seinen Anteil an der Beute schon gesichert.",
        "## Das verlassene Dorf",
        "Dann war der Rest des Dorfes an der Reihe. In einigen der vermeintlich leeren Häuser lauerten Zombies, die uns dank der langen Rast nur noch kaum zusetzen konnten. Vor einem der Häuser stand eine Statue, bei deren Anblick Ezekiel innehielt: Er erkannte darin seinen Onkel. <em class=\"aside\">Mehr hat er dazu nicht gesagt. Natürlich nicht.</em>",
        "Es folgten weitere Kämpfe gegen Blights, gegen zwei riesige Spinnen und gegen noch mehr Blights, bis Echo einen gewaltigen Feuerball losließ und das Problem auf seine Weise löste. Die Hitze spüre ich heute noch im Gesicht.",
        "!ilvara-druidin.webp|Ilvara, wie sie sich uns zeigte: ehrwürdig, freundlich und mit Fuchs. Was sollte da schon schiefgehen?|schmal",
        "Im letzten Haus wartete schließlich eine Druidin, die sich als Ilvara vorstellte. Ganz in Grün gekleidet, einen Fuchs auf den Schultern und einen kleinen Spatz auf dem Fuß, wirkte sie wie eine Hüterin des Waldes. Es roch nach Eintopf, und wir entdeckten einen kochenden Topf und hofften auf eine warme Speise. Der Rest des Raumes war gefüllt mit gesammelten Kräutern, Tinkturen und handschriftlichen Notizen über die Natur und die Tiere in diesem Teil des Waldes, der an das Dorf angrenzte.",
        "Keiner von uns ahnte etwas Böses, als sie uns in ihr Haus bat … <em class=\"aside\">Heute ärgert mich das mehr, als ich zugeben möchte.</em>"
      ],
      fortsetzung: "Weiter in Kapitel II …"
    },
    {
      nummer: "II",
      titel: "Das Unterreich",
      absaetze: [
        "## Der Kräuternebel",
        "!ilvara-wahr.webp|Ilvara Mizzrym in ihrer wahren Gestalt. Von der Hüterin des Waldes ist nicht viel übrig.|schmal links",
        "Kaum hatten wir Ilvaras Haus betreten, lag plötzlich ein süßlicher, giftiger Dampf in der Luft. Einer nach dem anderen sanken die Helden zu Boden, und mir wurde schwarz vor Augen. Die freundliche Druidin war in Wahrheit eine Gestaltwandlerin, die uns mit einem Kräuternebel betäubt hatte, und sie verschleppte uns alle. Ihr wahres Gesicht sollten wir erst später sehen: Ilvara Mizzrym, eine Drow.",
        "## Gefangen",
        "!gefangen-kerker.jpg|Das böse Erwachen: hinter Gittern, gefesselt und bewacht. Selbst Rex schaut nicht begeistert.|schmal",
        "Wie viel Zeit vergangen war, wusste keiner von uns, als wir wieder zu uns kamen. <em class=\"aside\">Ein paar Stunden? Tage? Ich habe jedenfalls hervorragend geschlafen.</em> Die ganze Truppe lag in Ketten, tief unter der Erde, in einem gefängnisartigen Raum hinter Schloss und Riegel. Vor den Gitterstäben standen Wachen und starrten grimmig herein. Zum ersten Mal auf dieser Reise hatte ich wirklich Angst.",
        "Dann hatte Echo eine geniale Idee: Er verwandelte sich in eine Ratte, schlüpfte unbemerkt aus der Zelle und fand in einem Nebenraum unsere Ausrüstung. Immer noch in Tiergestalt schaffte er alles zurück zu uns. <em class=\"aside\">Einfach genial, Echo!</em>",
        "## Der Ausbruch",
        "Kaum hielten alle wieder ihre Waffen in den Händen, zögerte ich nicht lange. Ich beleidigte die Wachen so ausgiebig und so kunstvoll, dass sie wutentbrannt auf uns losgingen. Erst jetzt zeigte sich, dass die meisten Gegner gar nicht zu sehen gewesen waren: Sie warteten nebenan, hinter Brücken auf einem anderen Plateau, hörten den Kampflärm und stürmten heran.",
        "Und dann, wie aus dem Nichts, tauchten mitten im Kampf Dämonen auf. Ein Chasme, ein fliegendes, insektenartiges Scheusal mit mehreren Flügeln und einem langen Stachel, stürzte sich auf uns, während sich ein Vrock, ein geierartiger Dämon, über unsere Gegner hermachte. Ich habe in meinem Leben viel gehört, aber dieses Summen werde ich nie vergessen.",
        "Der Kampf war hart. Die Dämonen hatten zwar einen Großteil der Gegner erledigt, doch am Ende waren es die Gefährten, die die beiden Dämonen und die zuletzt verbliebenen Gegner niederstreckten.",
        "Nur eine entkam: Ilvara, die Drow und Gestaltwandlerin. Sie sprang von der Brücke in den Fluss, der tief darunter rauschte, und war verschwunden.",
        "Danach wurde der Unterschlupf unserer Entführer gründlich durchsucht, Echo natürlich vorneweg. Etwas Beute kam zusammen. Und eine Spinnenstatue. Die bekam von uns eine neue Bemalung, zuerst nur mit einem zusätzlichen Bart, doch schnell wurden daraus Phallussymbole und ähnliche Schmierereien. Kindisch? Vielleicht. Befreiend? Absolut.",
        "## Durch die Spinnweben",
        "Immer tiefer führte der Weg ins Unterreich. Dichte Spinnweben versperrten uns teilweise den Weg. Es gab hier jedoch auch so tiefe Schluchten, dass wir ohne die Spinnweben niemals von der einen zur anderen Seite gekommen wären. Es war zwar ein ziemlicher Balanceakt, und wir mussten uns sehr konzentrieren, dabei keine neuen Spinnen auf uns aufmerksam zu machen … Wegen der klebrigen Fäden hätte ich beinahe einen Sprung zum nächsten Felsvorsprung nicht geschafft, und es war nur Friedrichs Hand, die mich vor dem Fallen bewahrte!",
        "Ein paar Spinnen stellten sich uns trotz aller Mühe, unerkannt zu bleiben, doch in den Weg. Ezekiel und Friedrich sorgten jedoch mit einigen perfekten Treffern schnell für den Sieg über die Achtbeiner.",
        "In einem der Spinnenkokons, die wir unterwegs fanden, wartete eine Überraschung: ein Gnom namens Fagas, gefangen, aber noch am Leben. Er erzählte uns von einem magischen Tempel, zu dem er und sein Trupp ausgesandt wurden. Arafil, einer der Magier des Roten Sitzes, hatte ihnen den Auftrag erteilt.",
        "Seine Gruppe, so erzählte Fagas weiter, war ausgesandt worden, um ein geheimnisvolles Grab zu finden: die Ruhestätte der Magierin Khaem, einer Netherese, die vor rund 3000 Jahren gelebt hatte. Eine Meisterin des magischen Fadens aus einer längst vergangenen Hochkultur. Echo witterte sofort einen Schatz.",
        "## Das Grab der Magierin",
        "Der Weg durch das Unterreich zeigte sich nun von einer überraschend schönen Seite: funkelnde Flüsse, leuchtende Pilze, ein ganzes Reich in sanftem Licht. Für einen Augenblick vergaß ich fast, wo wir waren. Es dauerte jedoch nicht lange, bis sich uns zuerst Spinnenmonster und später auch noch Ettercaps in den Weg stellten. Die Helden erschlugen sie alle und kämpften sich ihren Weg tiefer in die Unterwelt.",
        "Einer der Kämpfe fand in einer Ruine statt: einer halb eingebrochenen Siedlung, die bis auf die letzten Häuser im tiefen Schwarz des Abgrunds verschwunden war. Nur dicke Spinnennetze hielten diese letzten Häuser noch fest. Ein falscher Schritt, und es wäre hinab ins Nichts gegangen.",
        "!unterreich-spinnweben.jpg|Unterwegs durch die Spinnweben des Unterreichs. Ganz entspannt, wie man sieht.",
        "In einem tempelähnlichen Haus entdeckte unsere Truppe eine weitere Spinnenstatue. Und als auch diese ihr neues Make-up bekam, tat sich ganz zufällig ein Geheimgang auf!",
        "Kaum hatten wir ihn betreten, erklang eine Stimme in unseren Köpfen und flehte um Hilfe. Mir lief es eiskalt den Rücken hinunter. Der magische Faden, so schien es, war an diesem Ort verdreht. Vorsichtig ging es tiefer in das verzauberte Grab, bis hinter einer Statue ein versteckter Schalter auftauchte.",
        "Als wir ihn betätigten, erschien eine geisterhafte Gestalt und sprach in unverständlichen Worten. Dann formte unheilige Energie einen furchterregenden Gegner: einen Wraith. Nach einem harten Kampf war er besiegt, und als Lohn wartete eine Waffe, von der schon Legenden erzählen: Dawnbringer, ein magisches Schwert.",
        "## Der unterirdische See",
        "Nachdem wir das Grab verlassen hatten, ging es über weitere Spinnweben noch tiefer in die Höhlen hinein, bis sich vor uns ein unterirdischer See auftat. Am Ufer begegnete die Gruppe einigen Kuo-Toa, ein Volk von Fischmenschen.",
        "Ihr Anführer war Ploopploopeen, ein Erzpriester. <em class=\"aside\">Ploopploopeen. Ich hatte ihn eine ganze Weile Blublupin genannt. Er hat es mir nicht übelgenommen. Glaube ich.</em> Er bat uns um Hilfe: Ein Teil seiner Stadt am Rand des Sees bete einen falschen Gott an: Demogorgon. Nach einiger Diskussion stand fest: Wir vertrauen ihm.",
        "Ploopploopeens Plan: Er wollte uns zum Schein fesseln und so in die Stadt schmuggeln. Der Plan ging auf, zumindest bis wir das Stadtzentrum erreichten. Gefesselt durch eine fremde Stadt zu laufen, ist übrigens kein Vergnügen, selbst wenn die Fesseln nur gespielt sind.",
        "## Demogorgon",
        "Dort brach sofort ein Kampf unter den Kuo-Toa aus. Die falsche Erzpriesterin griff Ploopploopeen an, weitere Fischmenschen mischten sich ein, und binnen Augenblicken herrschte das reinste Chaos.",
        "!kuo-toa-stadt.jpg|Chaos in der Stadt der Kuo-Toa. Ich liefere die passende Musik dazu.",
        "Mitten im Getümmel tauchte zwischen den Gegnern ein gefesselter Zwerg auf. Noch während des Kampfes gelang es den Gefährten, ihn zu befreien. Sein Name war Kardal, und er behauptete, ein Späher seiner Stadt zu sein, den die Fischmenschen gefangen genommen hatten.",
        "!demogorgon.webp|Demogorgon, Fürst der Dämonen.|frei",
        "Dann stieg etwas aus dem See empor: Demogorgon. Ein Dämonenfürst, ein wahrhaftiger Dämonengott. Zwei Köpfe, zwei Arme mit je zwei Tentakeln, ein langer Schwanz und zwei Beine, die die Erde erzittern ließen. Er stieß einen gottlos lauten, grauenhaften Schrei aus, alle Magie erlosch, und uns schlotterten die Knie. <em class=\"aside\">Ich gebe zu: Meine schlotterten nur aus Solidarität.</em>",
        "Friedrich ließ sich davon nicht beirren, legte an und schoss einen Pfeil auf Demogorgon. Die Wirkung: keine. Absolut keine. Trotzdem behauptet Friedrich seitdem steif und fest, er habe einen Gott geboxt.",
        "Das Ungeheuer machte sich daran, die Stadt zu zerstören. Mit seinen Tentakelarmen zermalmte es Gebäude, Gegner und Verbündete gleichermaßen. Wir rannten, wie ich noch nie gerannt bin, und erreichten mit viel Glück ein Boot. Kardal entkam mit uns. Ploopploopeen und alle anderen Kuo-Toa fanden den Tod, und von ihrer Stadt blieben nur ein paar Ruinen.",
        "!flucht-see.jpg|Die Flucht über den See. Friedrich ist bis heute sehr stolz auf sich.",
        "## Gracklstugh",
        "Die Flucht über den See führte uns schließlich zu einem atemberaubenden Anblick: einer in den Fels gehauenen Festung, die hinter gewaltigen Stadtmauern über der Stadt Gracklstugh emporragte. Nach allem, was hinter uns lag, war es fast zu schön, um wahr zu sein.",
        "!gracklstugh.jpg|Ankunft vor Gracklstugh. Kardal zeigt den Weg.",
        "## Der Sohn des Königs",
        "Am Stadttor standen grimmige Wachen, doch nachdem Kardal ein paar Worte mit ihnen gewechselt hatte, ließen sie uns ohne Weiteres passieren. Schon das hätte mich stutzig machen sollen.",
        "Hinter dem Tor lag ein Marktplatz, einer der großen Handelsplätze der Stadt. Lange hielten wir uns dort nicht auf, sondern steuerten geradewegs eine Taverne an und aßen erst einmal ausgiebig und richtig lecker. <em class=\"aside\">Nach Fischmenschen, Dämonengott und Flucht über den See hatten wir uns das redlich verdient.</em>",
        "Mitten im Essen traten plötzlich vier gerüstete Gestalten ein, marschierten auf unseren Tisch zu und salutierten. Vor Kardal. Da kam die Wahrheit ans Licht: Unser bescheidener Späher ist in Wahrheit der Sohn des Königs! <em class=\"aside\">Ein Prinz. Ich hatte es ja geahnt. Also, fast.</em>",
        "## Am Hof von König Horga",
        "!koenig-horga.webp|König Horga Stahl V. Sein Bart allein hat mehr Würde als ganz Phandalin.|schmal",
        "Die Soldaten brachten uns in eine Feste, vor König Horga Stahl V. Wie es sich für einen Barden gehört, stimmte ich einen Gesang an und erzählte dem König von Demogorgon und davon, wie wir seinen Sohn gerettet hatten. Der König gewährte uns, in der Stadt zu verweilen. <em class=\"aside\">Ob das am Gesang lag oder an der Rettung seines Sohnes, lassen wir einfach offen.</em>",
        "Leicht fiel uns der Aufenthalt allerdings nicht. Die Luft hier unten setzte uns zu, vor allem Echo, der mit deutlichen Zeichen von Erschöpfung aufwachte.",
        "## Einkaufen in Gracklstugh",
        "Was tut eine Heldengruppe in einer fremden Stadt? Richtig: einkaufen. Wir deckten uns mit Heiltränken ein, und ich erstand eine Flöte der Illusionen und dazu ein paar Zaubertränke. <em class=\"aside\">Man weiß nie, wann man ein Publikum verzaubern muss. Oder einen Gegner.</em>",
        "## Der rasende Riese",
        "!riese.webp|Der Riese, kurz bevor wir ihn zur Ruhe gebracht haben. Seinem Blick nach hört er die Stimmen noch.|frei",
        "Plötzlich hörten wir Schreie und das Krachen von Häusern, und schon stand ein Riese vor uns und griff an. Mit vereinten Kräften gelang es uns, ihn zu betäuben und zu fesseln.",
        "Kurz darauf erschien ein zweiter Riese, doch dieser dankte uns. Den Ausfall seines Artgenossen konnte er sich nicht erklären. Offenbar hatten ihn Stimmen in seinem Kopf dazu getrieben. Stimmen im Kopf … mir lief es kalt den Rücken hinunter.",
        "Zum Dank lud er uns ein, mit dem Steinsprecher zu reden. Welch eine Ehre!"
      ],
      fortsetzung: "Fortsetzung folgt …"
    }
  ],

  /* ---------- DIE REISE ----------
     karte: Dateiname der Weltkarte, z. B. "weltkarte.jpg" (null = Platzhalter)
     x / y: Position in Prozent von links / von oben (0 bis 100)
     abschnitt: Zwischenüberschrift im Kapitel, zu der die Station springt */
  reise: {
    karten: [
      {
        titel: "Die Oberwelt",
        karte: "weltkarte.jpg",
        stationen: [
          { name: "Der Hafen von Neverwinter", x: 21.5, y: 46, kapitel: "I", abschnitt: "Die Einladung", text: "Gundren lädt die Helden ein und bietet ihnen die Suche nach einer magischen Schmiede an." },
          { name: "Hinterhalt auf der Straße", x: 44.4, y: 72.9, kapitel: "I", abschnitt: "Hinterhalt auf der Straße", text: "Kurz nach der Abzweigung von der High Road Richtung Phandalin. Die Goblins, die aus dem Wald springen, haben keine Chance." },
          { name: "Die Goblinhöhle", x: 45.7, y: 66.8, kapitel: "I", abschnitt: "Die Goblinhöhle", text: "Nur durch ein kleines Waldstück vom Ort des Überfalls getrennt. Wölfe befreit, Nest gestürmt, Anführer erschlagen." },
          { name: "Phandalin", x: 57.8, y: 76.4, kapitel: "I", abschnitt: "Phandalin und die Roten Roben", text: "Ein kleines Dorf in den Fängen der Roten Roben. Am Dorfrand liegt Schloss Crackmore, wo Glasstab fällt und von der Spinne spricht." },
          { name: "Der Wachturm", x: 67.7, y: 67.8, kapitel: "I", abschnitt: "Der Gefangene im Wachturm", text: "Ein Bugbär fällt, eine Drow flieht, und der Gefangene entpuppt sich als Gundrens Zwillingsbruder Nundro." },
          { name: "Die magische Schmiede", x: 71.3, y: 75, kapitel: "I", abschnitt: "Die magische Schmiede", text: "Tief in einer alten, verlassenen Mine verborgen. Unterwegs fällt Nezna, und nach harten Kämpfen gehört die Schmiede der Gruppe." },
          { name: "Neverwinter", x: 25.5, y: 43.8, kapitel: "I", abschnitt: "Neverwinter", text: "Zurück in der großen Stadt. Hier treten die Gefährten der Allianz der Lords bei." },
          { name: "Donnerbaum", x: 37.6, y: 45.8, kapitel: "I", abschnitt: "Donnerbaum", text: "Ein verlassenes Dorf mit verfallenem Wachturm. Ein Giftdrache, Zombies, Blights und eine Druidin, die nicht ist, was sie scheint." }
        ]
      },
      {
        titel: "Das Unterreich",
        karte: "unterreich-karte.jpg",
        stationen: [
          { name: "Der Kerker", x: 8.0, y: 48.3, kapitel: "II", abschnitt: "Gefangen", text: "Hier erwachen die Gefährten in Ketten. Echo holt als Ratte die Ausrüstung, dann folgen Ausbruch und Dämonen." },
          { name: "Die Spinnweben", x: 12.0, y: 40.7, kapitel: "II", abschnitt: "Durch die Spinnweben", text: "Balancieren über Spinnennetze. In einem Kokon wartet der Gnom Fagas." },
          { name: "Das Grab der Magierin", x: 26.0, y: 27.3, kapitel: "II", abschnitt: "Das Grab der Magierin", text: "Hinter einer verunstalteten Spinnenstatue: ein Wraith und das Schwert Dawnbringer." },
          { name: "Der unterirdische See", x: 22.7, y: 41.9, kapitel: "II", abschnitt: "Der unterirdische See", text: "Am Ufer bittet Ploopploopeen, Erzpriester der Kuo-Toa, um Hilfe." },
          { name: "Die Ruinen der Kuo-Toa", x: 20.0, y: 47.1, kapitel: "II", abschnitt: "Demogorgon", text: "Hier stieg Demogorgon aus dem See. Von der Stadt sind nur Ruinen geblieben." },
          { name: "Gracklstugh", x: 19, y: 73, kapitel: "II", abschnitt: "Gracklstugh", text: "Die Festung im Fels. Kardal entpuppt sich als Prinz, der König gewährt uns Gastrecht, und ein Riese rast durch die Stadt." }
        ]
      }
    ]
  },

  /* ---------- DAS BESTIARIUM ----------
     status: "besiegt", "gesichtet", "geruecht" (nur davon gehört) oder "gefallen" (tot, aber nicht durch uns)
     bild ist optional. Beispiel:
     { name: "Goblin", bild: "goblin.jpg", status: "besiegt", ort: "Die Straße", text: "Klein und gemein." } */
  bestiarium: [
    { name: "Venomfang", bild: "venomfang.jpg", status: "besiegt", ort: "Der Wachturm von Donnerbaum", text: "Eine Art junger grüner Giftdrachen. Dieser hier hatte sich im verfallenen Wachturm eingenistet. Sein Giftatem setzte der Gruppe übel zu, bis Barradins Hypnose den entscheidenden Vorteil brachte." },
    { name: "Chasme", bild: "chasme.jpg", status: "besiegt", ort: "Das Gefängnis im Unterreich", text: "Ein fliegender, insektenartiger Dämon mit mehreren Flügeln und einem langen Stachel. Tauchte mitten im Ausbruch aus dem Nichts auf und stürzte sich auf die Gefährten." },
    { name: "Vrock", bild: "vrock.jpg", status: "besiegt", ort: "Das Gefängnis im Unterreich", text: "Ein geierartiger Dämon mit zerzausten Schwingen. Erledigte einen Großteil der Wachen, bevor die Gefährten auch ihn niederstreckten." },
    { name: "Kuo-Toa", bild: "kuo-toa.jpg", status: "gefallen", ort: "Die Stadt am unterirdischen See", text: "Ein Volk von Fischmenschen, das am Ufer eines unterirdischen Sees lebte. Ein Teil von ihnen betete einen falschen Gott an, und im Stadtzentrum gingen sie aufeinander und auf die Gefährten los. Als Demogorgon kam, starben sie alle, und von ihrer Stadt blieben nur Ruinen." },
    { name: "Ploopploopeen", bild: "ploopploopeen.jpg", status: "gefallen", ort: "Die Stadt am unterirdischen See", text: "Erzpriester der Kuo-Toa. Bat die Gefährten um Hilfe gegen die Anhänger eines falschen Gottes und schmuggelte sie zum Schein gefesselt in seine Stadt. Er starb, als Demogorgon die Stadt zerstörte." },
    { name: "Demogorgon", bild: "demogorgon-karte.webp", status: "gesichtet", ort: "Der unterirdische See", text: "Ein Dämonenfürst mit zwei Köpfen, Tentakelarmen und einem langen Schwanz. Sein Schrei ließ alle Magie erlöschen, und die Gefährten entkamen nur mit Glück. Friedrich hat ihn trotzdem geboxt. Sagt er." }
  ],

  /* ---------- DIE QUESTTAFEL ----------
     Ein Holzbrett mit angepinnten Zetteln. Antippen öffnet den ganzen Text.
     Position auf dem Brett (Holzfläche im Bild): x / y = linke obere Ecke in Prozent, b = Breite in Prozent, dreh = Schräglage in Grad.
     Aussehen: bild (Bilddatei, wird wie eine Zeichnung eingefärbt), skizze ("spinne" oder "krone") oder nichts (einfacher Notizzettel).
     kurz: was handschriftlich auf dem Zettel steht (<br> = neue Zeile, <small> = kleiner).
     haupt: true = rot und groß. lose: true = ein loser roter Faden hängt am Zettel.
     faeden: Zusammenhänge zwischen zwei Zetteln (von / nach = id), grund = Erklärung im Detailtext.
     Ist eine Frage gelöst, einfach den Zettel und seine Fäden löschen. */
  questtafel: {
    karten: [
      { id: "glasstab", x: 2, y: 4, b: 17, dreh: -4,
        kurz: "Glasstab †<small>„die Spinne …“</small>",
        label: "Hinweis", titel: "Glasstab",
        text: "Anführer der Roten Roben in Phandalin. Bevor er durch Friedrichs Pfeil fiel, sprach er mit seinem letzten Atemzug von der Spinne, der er offenbar diente.",
        kapitel: "I", abschnitt: "Schloss Crackmore" },
      { id: "nezna", x: 17.5, y: 3.3, b: 16, dreh: 3,
        kurz: "Nezna †<small>Drow · in der Mine</small>",
        label: "Hinweis", titel: "Nezna",
        text: "Eine Dunkelelfe, die im Wachturm erbittert gegen uns kämpfte. Als der Kampf verloren war, verwandelte sie sich in ein kleines Tier und entkam. Zuvor sprach auch sie von der Spinne. Als wir später die alte Mine nach der magischen Schmiede durchsuchten, stand sie uns erneut gegenüber, und diesmal entkam sie nicht.",
        kapitel: "I", abschnitt: "Die magische Schmiede" },
      { id: "spinne", haupt: true, skizze: "spinne", x: 36, y: 5, b: 28, dreh: -1,
        kurz: "Wer ist die Spinne?",
        label: "Über allem", titel: "Wer ist die Spinne?",
        text: "Eine Person, eine Macht, ein geheimer Orden? Seit Schloss Crackmore lässt uns diese Frage nicht mehr los, und je tiefer wir graben, desto öfter stoßen wir auf acht Beine.",
        hinweise: [
          "Glasstab, der Anführer der Roten Roben, diente ihr.",
          "Auch die Drow Nezna sprach von der Spinne, bevor wir sie in der Mine zur Strecke brachten.",
          "Friedrich lässt das Thema am wenigsten los."
        ],
        kapitel: "I", abschnitt: "Schloss Crackmore" },
      { id: "ilvara", bild: "skizze-ilvara.webp", zeichnung: true, format: "2/3", pos: "50% 0%", x: 2.7, y: 41.1, b: 13, dreh: -2,
        kurz: "Ilvara Mizzrym",
        label: "Entkommen", titel: "Ilvara Mizzrym",
        text: "Gab sich in Donnerbaum als freundliche Druidin aus, betäubte uns mit einem Kräuternebel und verschleppte uns ins Unterreich. Beim Ausbruch sprang sie von der Brücke in den Fluss. Dass sie das nicht überlebt hat, glaubt keiner von uns.",
        kapitel: "II", abschnitt: "Der Ausbruch" },
      { id: "demogorgon", bild: "skizze-demogorgon.webp", zeichnung: true, format: "4/3", pos: "50% 50%", x: 73.7, y: 12.1, b: 20, dreh: 3,
        kurz: "Demogorgon<small>Warum erwacht?</small>",
        label: "Bedrohlich", titel: "Warum ist Demogorgon erwacht?",
        text: "Ein Dämonenfürst stieg aus dem See und machte die Stadt der Kuo-Toa dem Erdboden gleich. Friedrich hat ihn geboxt. Aufgehalten hat ihn das nicht.",
        hinweise: ["Ein Teil der Kuo-Toa betete ihn als falschen Gott an.", "Sein Schrei ließ alle Magie erlöschen.", "Schon bei unserem Ausbruch tauchten wie aus dem Nichts Dämonen auf.", "Wohin er danach verschwunden ist, weiß niemand."],
        kapitel: "II", abschnitt: "Demogorgon" },
      { id: "gracklstugh", bild: "gracklstugh.jpg", format: "16/9", pos: "50% 50%", x: 34.5, y: 52.1, b: 25, dreh: 1,
        kurz: "Gracklstugh<small>Was geht hier vor?</small>",
        label: "Hier sind wir", titel: "Was geht in Gracklstugh vor sich?",
        text: "Der König hat uns Gastrecht gewährt, doch ganz geheuer ist uns die Stadt nicht.",
        hinweise: ["Die Luft hier unten zehrt an uns, vor allem an Echo.", "Ein Riese griff uns an, getrieben von Stimmen in seinem Kopf.", "Ein zweiter Riese lud uns ein, mit dem Steinsprecher zu reden."],
        kapitel: "II", abschnitt: "Am Hof von König Horga" },
      { id: "kardal", skizze: "krone", x: 57.5, y: 67.5, b: 13, dreh: 5,
        kurz: "Prinz Kardal",
        label: "Aufgeklärt", titel: "Prinz Kardal",
        text: "Wir fanden ihn gefesselt mitten im Chaos der Kuo-Toa, und er gab sich als einfacher Späher seiner Stadt aus. In Gracklstugh salutierten dann vier Soldaten vor ihm: Kardal ist der Sohn des Königs.",
        hinweise: ["Entkam mit uns im Boot über den See.", "Seinetwegen ließen uns die Wachen in die Stadt.", "Sein Vater ist König Horga Stahl V."],
        kapitel: "II", abschnitt: "Der Sohn des Königs" },
      { id: "riese", bild: "skizze-riese.webp", zeichnung: true, format: "4/5", pos: "50% 8%", x: 79.7, y: 53.2, b: 12, dreh: -3,
        kurz: "Stimmen im Kopf?",
        label: "Rätselhaft", titel: "Stimmen im Kopf",
        text: "Ein Riese griff uns mitten in Gracklstugh an. Ein zweiter Riese konnte sich den Ausfall nicht erklären, offenbar hatten ihn Stimmen in seinem Kopf getrieben. Wessen Stimmen?",
        kapitel: "II", abschnitt: "Der rasende Riese" },
    ],
    /* schnur: false = kein roter Faden, steht aber im Detailtext unter „Zusammenhänge“ (die Zettel hängen dann nebeneinander). */
    faeden: [
      { von: "nezna", nach: "spinne", a1: [0.03, 0.144], a2: [0.488, 0.034], grund: "sprach ebenfalls von der Spinne." },
      { von: "ilvara", nach: "spinne", a1: [0.856, 0.061], a2: [0.06, 0.432] },
      { von: "gracklstugh", nach: "riese", farbe: "gelb", grund: "der Angriff geschah mitten in der Stadt." },
      { von: "spinne", nach: "glasstab", schnur: false, grund: "diente der Spinne und sprach mit seinem letzten Atemzug von ihr." },
      { von: "kardal", nach: "demogorgon", schnur: false, grund: "Kardal war mitten im Chaos, als Demogorgon kam." },
      { von: "nezna", nach: "ilvara", schnur: false, grund: "beide Drow, beide Gestaltwandlerinnen. Zufall?" },
      { von: "glasstab", nach: "nezna", schnur: false, grund: "beide sprachen von der Spinne." },
      { von: "kardal", nach: "gracklstugh", schnur: false, grund: "Kardal ist der Sohn des Königs von Gracklstugh." },
      { von: "ilvara", nach: "demogorgon", schnur: false, grund: "beim Ausbruch aus ihrem Kerker tauchten wie aus dem Nichts Dämonen auf." }
    ],
    /* Gelbe Randnotizen, nur zur Deko (nicht anklickbar). gross: true = große Schrift. */
    notizen: [
      { text: "beide:<br>„die Spinne“!", x: 11.4, y: 15.2, b: 10, dreh: 7 },
      { text: "???", gross: true, x: 61, y: 40, b: 7, dreh: 8 },
      { text: "Einladung zum Stein&shy;sprecher!", x: 89.3, y: 79.1, b: 10, dreh: -8 },
      { text: "!!!", gross: true, x: 92.3, y: 10.9, b: 7, dreh: 10 },
      { text: "was verbirgt KARDAL?", x: 63.3, y: 86.1, b: 11, dreh: 5 }
    ]
  },

  /* ---------- DAS NSC-VERZEICHNIS ----------
     status: "verbuendet", "feindlich", "unklar", "neutral" oder "tot"
     gruppe: Überschrift, unter der die Person steht. bild ist optional (sonst erscheint der Anfangsbuchstabe).
     bildPos: welcher Bildausschnitt im runden Porträt zu sehen ist (optional). */
  nsc: [
    { gruppe: "Die Oberwelt", name: "Gundren", status: "verbuendet", rolle: "Zwerg, Händler und unser erster Auftraggeber", text: "Hat uns mit einem Brief zusammengetrommelt und uns auf die Spur der magischen Schmiede gesetzt. Kennt jeden, der etwas zu sagen hat." },
    { gruppe: "Die Oberwelt", name: "Nundro", status: "verbuendet", rolle: "Gundrens Zwillingsbruder", text: "Saß namenlos im Wachturm gefangen, bis wir ihn befreit haben. Nundro, nicht Nando." },
    { gruppe: "Die Oberwelt", name: "Captain Dolgrimson", status: "verbuendet", rolle: "Leiter der Allianz der Lords, Neverwinter", text: "Hat uns erst vertröstet, dann in die Allianz aufgenommen und prompt nach Donnerbaum geschickt." },
    { gruppe: "Die Oberwelt", name: "Der Bürgermeister von Phandalin", status: "neutral", rolle: "Phandalin", text: "Hat am Ende bezahlt. Uns wiedersehen will er vermutlich trotzdem nicht." },
    { gruppe: "Die Oberwelt", name: "Glasstab", status: "tot", rolle: "Anführer der Roten Roben", text: "Hielt Phandalin in Angst und diente der Spinne. Fiel durch Friedrichs Pfeil, nachdem Barradin ihn aus dem Geheimgang zurückgezerrt hatte." },
    { gruppe: "Die Oberwelt", name: "Nezna", status: "tot", rolle: "Drow und Gestaltwandlerin", text: "Kämpfte im Wachturm erbittert gegen uns, sprach von der Spinne und entkam als kleines Tier. In der Mine der magischen Schmiede stellten wir sie erneut, und diesmal fiel sie." },
    { gruppe: "Das Unterreich", name: "Ilvara Mizzrym", bild: "ilvara-wahr.webp", bildPos: "50% 8%", status: "feindlich", rolle: "Drow und Gestaltwandlerin", text: "Gab sich in Donnerbaum als freundliche Druidin aus, betäubte uns mit einem Kräuternebel und verschleppte uns ins Unterreich. Entkam mit einem Sprung in den Fluss." },
    { gruppe: "Das Unterreich", name: "Fagas", status: "verbuendet", rolle: "Gnom, aus einem Spinnenkokon gerettet", text: "Erzählte uns vom Grab der Magierin Khaem, zu dem Arafil des Roten Sitzes ihn und seinen Trupp geschickt hatte." },
    { gruppe: "Das Unterreich", name: "Ploopploopeen", bild: "ploopploopeen.jpg", bildPos: "50% 25%", status: "tot", rolle: "Erzpriester der Kuo-Toa", text: "Schmuggelte uns zum Schein gefesselt in seine Stadt und starb, als Demogorgon sie zerstörte. Barradin hat ihn lange Blublupin genannt." },
    { gruppe: "Das Unterreich", name: "Kardal", status: "verbuendet", rolle: "Zwerg, Sohn des Königs von Gracklstugh", text: "Gefesselt bei den Kuo-Toa gefunden, gab sich als Späher aus und floh mit uns über den See. In Gracklstugh kam heraus, dass er der Sohn des Königs ist." },
    { gruppe: "Das Unterreich", name: "König Horga Stahl V.", bild: "portrait-koenig.jpg", bildPos: "50% 50%", status: "neutral", rolle: "König von Gracklstugh, Kardals Vater", text: "Hörte sich Barradins Gesang über Demogorgon und die Rettung seines Sohnes an und gewährte uns, in der Stadt zu verweilen." },
    { gruppe: "Das Unterreich", name: "Der rasende Riese", bild: "portrait-riese.jpg", bildPos: "50% 50%", status: "unklar", rolle: "Riese in Gracklstugh", text: "Griff uns mitten in der Stadt an, bis wir ihn betäuben und fesseln konnten. Ein anderer Riese meint, Stimmen in seinem Kopf hätten ihn dazu getrieben." }
  ],

  /* ---------- BARRADINS KÜNSTE ----------
     Barradins eigene Zeichnungen aus dem Notizbuch. Neue Zeichnung: Datei neben die anderen legen und hier eintragen. */
  kunst: [
    { bild: "skizze-demogorgon.webp", titel: "Demogorgon", text: "Gesehen am unterirdischen See. Friedrich hat ihn geboxt." },
    { bild: "skizze-ilvara.webp", titel: "Ilvara", text: "Die „Druidin“ von Donnerbaum, mit ihrem Luchs." },
    { bild: "skizze-ploopploopeen.webp", titel: "Ploopploopeen", text: "Erzpriester der Kuo-Toa." },
    { bild: "skizze-ettercap.webp", titel: "Ettercap", text: "Einer von vielen in den Spinnweben des Unterreichs." },
    { bild: "skizze-riese.webp", titel: "Der rasende Riese", text: "Gracklstugh. Stimmen im Kopf?" },
    { bild: "skizze-chasme.webp", titel: "Chasme", text: "Tauchte mitten im Ausbruch aus dem Nichts auf." },
    { bild: "skizze-turm.webp", titel: "Der Turm von Donnerbaum", text: "Hier wartete der Venomfang." },
    { bild: "skizze-ketten.webp", titel: "In Ketten", text: "So sind wir im Unterreich aufgewacht." },
    { bild: "skizze-laute.webp", titel: "Barradins Laute", text: "Die wichtigste Waffe der Gruppe." }
  ]
};
