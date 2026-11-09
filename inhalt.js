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
        "Es begann mit einem Brief. Jeder von uns erhielt eine Einladung von Gundren! Er war ein Zwerg und Händler aus der Stadt Neverwinter und kannte wohl jeden, der etwas zu sagen hat. Das Siegel war aus dunklem Wachs, die Handschrift so kantig wie ein Zwergenschild und der Ton so knapp, dass man ihm nicht widersprechen mochte. Treffpunkt war der Hafen der Stadt. Neverwinter, das Juwel des Nordens! Schon vom Hafen aus sieht man, warum man es so nennt: Hinter den Lagerhäusern ragen die Türme auf, und über dem Fluss, der hier ins Meer mündet, liegt ein feiner, warmer Dunst. Knarrende Stege, Fischerboote, Händler und Matrosen, Möwen, die um jeden Fischkopf zankten, und über allem der Geruch von Salz und Teer. Ich weiß noch, wie ich dort stand, die Pfeife im Mundwinkel, den Mantel vorteilhaft im Wind, und spürte: Hier beginnt etwas Großes.",
        "Da standen wir nun beieinander, vier Fremde auf einem Steg, die sich musterten wie Händler auf dem Pferdemarkt. Ich machte den Anfang, wie es sich gehört: Barradin, elfischer Barde, auch genannt die goldene Zunge. Pfeife im Mundwinkel, umweht von einer Wolke aus duftendem Kraut, gelockte, kurz abstehende Haare und ein Grinsen, das schon ganze Marktplätze erobert hat. Kurz: umwerfend. Ich nannte meinen Namen, drei Titel, die ich mir zum Teil selbst verliehen hatte, und verbeugte mich. Dass ich brennende Fackeln jongliere, Saltos schlage und mit bloßen Worten schon mehr Feinde zu Fall gebracht habe als manch einer mit dem Schwert, erwähnte ich nur ganz nebenbei. Zweimal. Daneben stand ein verschmitzt grinsender Mensch mit Bogen und Hund, dessen grünliches Gewand ihn sofort als Waldläufer erkennbar machte. „Friedrich, aus den Wäldern. Das ist Rex, er ist der Freundlichere von uns beiden. Ich rede lieber zuerst. Und wenn Reden nicht hilft, treffe ich.“ Ein Mann, der lieber redet: Ich mochte ihn sofort. Rex hatte inzwischen jeden von uns gründlicher beschnuppert als jede Stadtwache und entschieden, dass ich nach Pfeifenkraut rieche. Er hatte nicht unrecht. Dann ein gehörnter Druide in langen weißen Roben und mit grimmigem Blick. Er sah aus, als wäre er bereit für jeden Streit. „Echo. Druide. Die Hörner sind echt, und wer sie anfasst, verliert einen Finger. Ich komme aus dem tiefen Wald, da redet man nicht viel. Was ich mag: Gold, Edelsteine, alles, was glänzt. Und wer mir dumm kommt, der brennt.“ Eine Möwe, die neben ihm zu laut kreischte, starrte er so lange an, bis sie davonflog. Ich beschloss, meine Finger bei mir zu behalten. Der Vierte, den Gundren eingeladen hatte, war ein Darkin in glühender scharlachroter Rüstung. Unter seiner Kapuze ragten Hörner hervor, an seinem Gürtel hingen zwei Klingen, und seine regungslose Mimik ließ nicht durchblicken, was in ihm vorging … „Ezekiel. The Destroyer.“ Das war alles. Ein Name, ein Beiname, keine Verbeugung, nicht einmal ein Nicken. Die Vorstellungsrunde verlief, vorsichtig gesagt, etwas holprig.",
        "Gundren kam deshalb schnell zur Sache. Der schwarzbärtige Zwerg stützte seine schwieligen Hände auf ein Fass, das ihm als Tisch diente, und senkte die Stimme, obwohl ringsum nur Möwen lauschten. Seinen Informationen nach sei in einer alten, verlassenen Mine eine magische Schmiede zu finden, in der Höhle des Wellenechos. Echo hob kurz den Kopf, als hätte jemand nach ihm gerufen. In der Schmiede wurden dereinst magische Gegenstände geschaffen, Klingen, Ringe und Rüstungen, und als Gundren davon sprach, glänzten seine Augen wie frisch poliertes Messing. Einige mächtige Lords interessierten sich brennend dafür, und Gundren witterte die Chance, sein Exportgeschäft kräftig zu erweitern. Wie genau, behielt er für sich. Mich hatte er ohnehin schon bei den Worten „magische Schmiede“. Ich sah mich bereits mit einer Laute, die sich von selbst stimmt. Und als Gundren uns dann noch eine stattliche Belohnung versprach, tauten selbst Echos grimmige Züge auf. Er grinste sogar! Ezekiel nickte. Einmal. Ich beschloss, das als Begeisterung zu werten.",
        "!gundren-treffen.jpg|Unser erstes Treffen mit Gundren. Hier beginnt unser Abenteuer.",
        "Unser erster Auftrag klang harmlos: einen Karren mit Waren sicher nach Phandalin bringen, Bergbauwerkzeug und Vorräte, so schwer beladen, dass die Achsen ächzten. Und wer dort Elmar Barton aufspürt, dem winkt eine Extraportion Gold. Echo grinste schon wieder. Zweimal an einem Tag, ein persönlicher Rekord. Ich bin sicher, er rechnete die Extraportion im Kopf bereits in Fässer Bier um. Oder in Edelsteine. Im Morgengrauen rollten wir durch das Stadttor, zwei Ochsen vor dem Karren, die das Wort Eile nicht kannten. Rex lief vorneweg und bellte jeden Meilenstein an, als hätte der ihn persönlich beleidigt, und hinter uns versank Neverwinter im Dunst.",
        "!aufbruch-neverwinter.jpg|Aufbruch aus Neverwinter. Die Stimmung auf dem Kutschbock war bestens.",
        "## Hinterhalt auf der Straße",
        "Wir zogen die High Road hinab nach Süden, das Meer mal zur Rechten, mal hinter grünen Hügeln verborgen, und bogen schließlich ins Landesinnere ab, Richtung Phandalin. Mehrere Tage lang rollte der Karren friedlich dahin und knarrte bei jedem Schlagloch, als wolle er sich beschweren. Friedrich las die Fährten am Wegrand wie andere Leute Aushänge. Rex jagte jeden Schmetterling bis zur nächsten Biegung und kam stolz und mit leeren Pfoten zurück. Abends am Feuer gab ich Kostproben meines Repertoires, und Ezekiel saß dabei immer ein Stück außerhalb des Lichtscheins. Ich hatte schon begonnen, ein Lied über langweilige Reisen zu dichten, und suchte gerade verzweifelt einen Reim auf „Ochse“. Dann war der Weg plötzlich versperrt: Ein überfallener, halb niedergebrannter Wagen lag quer auf der Straße. Es roch nach kaltem Rauch und verbranntem Leder, und im Wald war es mit einem Mal sehr still. Kein Vogel, kein Wind. Jeder von uns ahnte sofort, dass hier etwas faul war. Als kurz darauf eine Handvoll Goblins kreischend und mit schartigen Klingen aus dem Wald sprang, stand unsere kleine Truppe längst kampfbereit und trat den Goblins entgegen. Der Kampf war härter als erwartet. <em class=\"aside\">Ich will niemanden beim Namen nennen, aber einige unserer Angriffe gingen mit großer Überzeugung ins Leere. Meine eingeschlossen.</em> Am Ende konnten wir die Goblins dennoch niederstrecken. Das Lied über langweilige Reisen habe ich danach nie fertig geschrieben.",
        "!hinterhalt-sieg.jpg|Die Goblins liegen am Boden, und der Wagen hat nichts abbekommen.",
        "## Die Goblinhöhle",
        "Ich weiß nicht, ob wir direkt Blut geleckt hatten oder uns die Hoffnung auf eine Belohnung antrieb … Echo wusste es. Friedrich wollte wissen, wem der verbrannte Wagen gehört hatte und ob jemand verschleppt worden war. Echo wollte wissen, wo die Goblins ihre Beute horteten. Und ich wollte vor allem eine Geschichte, die sich zu erzählen lohnt. Statt einfach weiterzufahren, beschloss unsere neu gefundene Heldengruppe also, den Spuren in den Wald zu folgen.",
        "Unterwegs liefen uns weitere Goblins über den Weg, diesmal mit deutlich kürzerem Auftritt. Echo las die Spuren: Er kniete sich hin, roch an der feuchten Erde, grummelte etwas Unverständliches und stapfte los, und wir hinterher, durch dichtes Unterholz, in dem jeder Dorn es auf meine gute Kleidung abgesehen hatte. Zweimal lagen Fallen auf dem Pfad, eine Schlinge und eine Grube. Ich entdeckte beide als Erster. Sagen wir: aus nächster Nähe. Am Ende führten uns die Spuren zu einer Höhle in einem düsteren Felsspalt, halb verborgen hinter Dornengestrüpp, und aus ihrem Maul floss ein kalter Bach.",
        "Am Eingang der Höhle erwarteten uns mehrere angebundene Wölfe, mager, an kurzen Ketten, und es roch nach nassem Fell. Ihr Winseln ging mir durch Mark und Bein. Friedrich war schon bei ihnen, bevor ich etwas sagen konnte, und so befreiten wir sie kurzerhand. Dann ging es hinein ins Goblinnest: Wasser tropfte von der Decke, beißender Rauch von Goblinfeuern hing in der Luft, dazu ein Gestank, den ich hier nicht beschreiben möchte, und jeder Schritt hallte von den Wänden wider. Wie genau es dort drinnen zuging, verschwimmt mir ein wenig, also erzähle ich es so, wie es hätte sein sollen: teils lautlos aus dem Schatten, teils mit allem anderen als Zurückhaltung. <em class=\"aside\">Welcher Teil davon meiner war, lasse ich lieber offen.</em> Irgendwann rauschte sogar eine Flutwelle durch den Gang, weil die Goblins einen Damm geöffnet hatten, aber wir hielten uns auf den Beinen. Am Ende lagen der Anführer und seine gesamte Bande am Boden, und vier verschwitzte, klatschnasse, ziemlich zufriedene Abenteurer samt Hund traten wieder ans Tageslicht.",
        "!woelfe-befreit.jpg|Die befreiten Wölfe in der Goblinhöhle. Friedrich war hier ganz klar die treibende Kraft.",
        "## Phandalin und die Roten Roben",
        "Der Karren stand noch genau da, wo wir ihn zurückgelassen hatten, unversehrt, als hätte er sich die ganze Aufregung nur angehört. Die letzte Etappe verging ohne Zwischenfälle, und schließlich erreichte unser Karren Phandalin. Wer sich ein Städtchen mit Mauer und Glockenturm vorstellt, wird enttäuscht: Phandalin ist eine Siedlung am Rand der Welt, ein paar Dutzend Häuser aus frischem Holz, gebaut zwischen den Steinruinen eines viel älteren Ortes, über die längst Gras und Brombeeren gewachsen sind. Es gab einen kleinen Schrein, ein paar Läden und eine Schänke namens „Zum schlafenden Riesen“, um die die Leute einen auffällig großen Bogen machten. Es roch nach Sägespänen, Holzrauch und Mist, und irgendwo hämmerte jemand. Das Wichtigste zuerst: ab in die Taverne! Es wurde gegessen und getrunken, bis keiner mehr konnte, dampfender Eintopf, dunkles Brot und ein Bier, das Echo „ehrlich“ nannte, was aus seinem Mund ein großes Lob ist. Beim Wirt handelten wir die Zimmer auf einen Spottpreis herunter. Erst danach begann die Suche nach Informationen. Die Gefährten streiften durch die Gassen, sprachen mit den Bewohnern und versuchten herauszufinden, was hier vor sich ging. Doch die Leute blieben wortkarg. Fensterläden klappten zu, wenn wir vorbeigingen, und wer uns ansah, sah schnell wieder weg. Schnell war klar: Hier geht nicht alles mit rechten Dingen zu.",
        "Den Durchbruch brachte, natürlich, ich. In der Taverne stimmte ich ein Lied an, etwas Heiteres über einen Zwerg, der sein Bier verteidigt: „Nimm mir das Gold und nimm mir den Bart, doch lass mir mein Bier, sonst wird es hart!“ Ich sang, bis ich die Einheimischen ganz in meinen Bann gezogen hatte. Irgendwann stellte ein alter Mann seinen Krug ab, sah sich zur Tür um und fing leise an zu erzählen. Nun lösten sich die Zungen: Eine Bande, die sich die Roten Roben nennt, presst den Bewohnern Schutzgeld ab und hat sich in Schloss Crackmore verschanzt, gleich am Rand des Dorfes. Schläger in roten Umhängen, die durch die Gassen stolzieren, als gehöre ihnen der Ort. Die Angst in ihren Stimmen machte mich wütend.",
        "Bevor es gegen die Bande ging, stattete unsere Truppe noch dem Bürgermeister von Phandalin einen Besuch ab. Harbin, so hieß er, empfing uns in seiner Amtsstube hinter einem Schreibtisch, der größer war als sein Mut: ein rundlicher, aufgeblasener Mann, der jeden zweiten Satz mit „selbstverständlich“ begann. Unser Ziel war es eigentlich nur, eine saftige Belohnung auszuhandeln, jedoch eskalierte das Gespräch recht schnell … Unsere Forderungen waren, vorsichtig gesagt, übertrieben und vielleicht ein bisschen herablassend … <em class=\"aside\">Was genau wir gefordert haben, weiß ich nicht mehr, und das ist vermutlich auch besser so.</em> Beinahe flogen die Fäuste. Am Ende zogen wir trotzdem weiter, mit dem Versprechen einer Belohnung, falls wir die Bande zerschlagen.",
        "!buergermeister-streit.jpg|Verhandlungen mit dem Bürgermeister von Phandalin. Es lief … sagen wir, lebhaft.",
        "## Schloss Crackmore",
        "Von außen sah Schloss Crackmore aus wie ein Gebiss mit fehlenden Zähnen: eingestürzte Zinnen, Krähen auf jedem Mauerrest. Den geheimen Weg in das alte, mit Ranken umwachsene Schloss verdanken wir Rex. Während wir noch berieten, wie wir am besten hineinkämen, jagte er einem Kaninchen hinterher und verschwand kopfüber in einem Gebüsch an der Schlossmauer. Als wir ihn wieder herausziehen wollten, entdeckten wir dahinter einen halb verschütteten Gang. <em class=\"aside\">Das Kaninchen war weg, Rex beleidigt, und wir hatten unseren Eingang.</em> Über teils eingefallene, staubige Tunnel stiegen wir hinab. Wurzeln hingen von der Decke, die Luft roch nach Moder, und unsere Fackel flackerte, als wolle sie lieber umkehren. Unter dem Anwesen öffnete sich eine Höhle. Dort bewachten ein paar Gegner eine Zelle voller Geiseln aus dem Dorf. Die Wachen waren schnell überwältigt, die Gefangenen frei: eine Handvoll erschöpfter, verdreckter Menschen, die uns ansahen, als wären wir vom Himmel gefallen. Einer von ihnen drückte mir so fest die Hand, dass ich beinahe meine Laute fallen ließ.",
        "Wir nahmen den Gegnern ihre roten Roben ab, um uns so getarnt weiter in die Schlossruine vorzuwagen. Meine kratzte, roch nach fremdem Schweiß, und Rot ist, bei aller Bescheidenheit, einfach nicht meine Farbe. <em class=\"aside\">Wobei Ezekiel in seiner scharlachroten Rüstung vermutlich auch vorher schon nicht weiter aufgefallen wäre.</em> Für Rex fand sich keine Robe in seiner Größe. Sollte jemand fragen, war er eben der Wachhund der Roten Roben. Rex schien mit der Rolle einverstanden. Wir drangen immer tiefer in das Gemäuer vor, das Herz bei jedem Schritt im Hals.",
        "Hinter einer geschlossenen Tür fanden wir den Raum eines Alchemisten, jedenfalls waren hier die Wände voll mit Kräutern. In Glaskolben blubberte es leise, und ein grünliches Licht lag über allem. In einigen Schränken und einer Vitrine befanden sich Gläser mit irgendwelchen gefangenen Wesen, teils lebendig, teils tot in einer Flüssigkeit treibend. Augen und Zungen, nicht auszumalen, was hier alles zu finden war. Außerdem hing ein starker Geruch von einem Feuer in der Luft. Ich versuchte, den Raum heimlich zu erkunden. Leider stellte sich mir ein Schrank in den Weg, und eine der Phiolen fiel herunter. Das Klirren hallte durch die Stille wie ein Gong …",
        "Daraufhin öffnete sich die andere Tür, und vor uns stand Glasstab, der Anführer der Roten Roben! Ein hagerer Mann in einer tiefroten Robe, mit stechendem Blick und einem Stab aus Glas in der Hand, in dem sich das grüne Licht brach. Er war äußerst erzürnt über den Lärm, und seine Stimme war so schneidend wie die Scherben am Boden. Ich verbeugte mich tief und sagte: „Verzeiht, Meister! Wir sind die Neuen. Ein bisschen übereifrig, aber bereit für jede Arbeit.“ Es kostete mich große Mühe, aber zum Glück glaubte er uns und schickte uns weg.",
        "Im Nebenraum fanden wir eine Gruppe von vier Anhängern der Roten Roben, die dort ausgelassen tranken und ein Würfelspiel spielten. Wir mischten uns unter sie und brachten die Gegner dazu, noch mehr Alkohol zu trinken … Ich verlor ein paar Runden. Mit Absicht, natürlich. Echo dagegen behielt jeden Einsatz auf dem Tisch so fest im Blick, als gehöre er schon ihm. Als sie alle so betrunken waren, dass wir für sie wohl wie zwölf aussahen, hob Ezekiel seinen Becher. Dann stach er den ersten Gegner gekonnt mit seinem Dolch nieder, und für die übrigen drei war das Würfelspiel kurz darauf ebenfalls vorbei.",
        "Danach ging es Glasstab an den Kragen, und wir stellten ihn in seinem abgeschiedenen Labor. Er versuchte noch einen lächerlichen Angriff gegen uns. Dann merkte er, dass niemand mehr kam, und floh durch einen Geheimgang am Ende seines Raums, Stein schabte über Stein. Ich sprintete ihm hinterher, bekam ihn im entscheidenden Moment am Kragen zu packen und zerrte ihn mit aller Kraft zurück in den Raum. Ein Sirren, und Friedrich hatte die Chance genutzt, um ihn mit einem perfekt platzierten Pfeil zwischen die Augen niederzustrecken!",
        "!glasstab-besiegt.jpg|Nach dem Sieg über Glasstab, noch in den erbeuteten roten Roben.",
        "Mit seinem letzten Atemzug sprach Glasstab von einer gewissen Spinne, der er offenbar diente. „Die Spinne … wird euch …“, flüsterte er noch, dann kam nichts mehr. Ist es eine Person, eine Macht, eine geheime Organisation? Friedrich stand noch lange schweigend über dem Toten. Fragen über Fragen, die vor allem ihn stark beschäftigten.",
        "Zurück in Phandalin verbreiteten die Helden des Tages die frohe Kunde. Was es mit der Spinne auf sich haben könnte, wurde lange diskutiert. <em class=\"aside\">Jeder hatte eine Theorie, und keine war gut.</em> Also feierten wir lieber mit den befreiten Gefangenen und den anderen Dorfbewohnern bis tief in die Nacht. Auf dem Dorfplatz loderte ein Feuer, ich spielte auf, bis mir die Finger glühten, und als Höhepunkt jonglierte ich mit brennenden Fackeln, unter dem Jubel des ganzen Dorfes. Getrunken habe ich dabei natürlich nur Saft. Ehrenwort.",
        "!siegesfeier.jpg|Unsere Siegesfeier in Phandalin. In meinem Horn ist übrigens nur Saft.",
        "Nach der Feier ging es zum Bürgermeister, um die Belohnung abzuholen. Echo zählte sie direkt vor Harbins Nase nach, Münze für Münze, und ließ sich dabei viel Zeit. Es lief ungefähr so gut wie beim ersten Besuch. <em class=\"aside\">Sagen wir so: Er wird uns so schnell nicht wieder einladen.</em> Lange hielt es uns danach ohnehin nicht mehr in Phandalin.",
        "## Der Gefangene im Wachturm",
        "An dieser Stelle muss ich gestehen: Meine Erinnerung an die folgenden Tage ist ein wenig … nebelig. <em class=\"aside\">Vielleicht lag es am regen Genuss des wundervollen Krauts in meiner Pfeife?</em> Seltsamerweise ist ausgerechnet die eine Nacht, von der ich jetzt erzähle, gestochen scharf. Vielleicht hat mir ein Bugbear den Nebel aus dem Kopf gebrüllt. Doch dazu gleich.",
        "Nach dem Sieg über die Roten Roben ließen wir, wenn ich mich recht erinnere, keine Zeit verstreichen und brachen direkt zu unserem nächsten Auftrag auf. Woher wir den Auftrag hatten und wer uns von dem Gefangenen erzählt hatte, liegt irgendwo in diesem Nebel. Aber ich weiß noch mit Sicherheit, dass wir einen Gefangenen aus einem Wachturm befreien wollten.",
        "Wir erreichten das Gebäude in einer sternklaren Nacht. Der Mond leuchtete als kleine Scheibe über uns, und es war gerade hell genug, um das Wachhaus mit dem angebauten Turm und die Grünfläche, die es umgab, zu erkennen. Ein alter Vorposten mit dicken Steinmauern, und kein Licht, keine Bewegung.",
        "Echo traute der Situation nicht und nutzte seine Magie, um uns zu tarnen und die Geräusche unserer Schritte zu dämpfen. Wir schlichen näher heran und suchten Deckung hinter einigen dicht gewachsenen Büschen und Sträuchern. Von dort spähten wir zu dem alten Gebäude. Nichts regte sich. Nicht einmal eine Grille zirpte.",
        "Dicht an die kalte, feuchte Mauer gepresst schlichen wir um den Turm. Durch einen Riss im Stein fiel fahles Fackellicht. Dahinter: ein bewaffneter Goblin, der etwas bewachte. Der Eingang lag hinter einer heruntergelassenen Zugbrücke, und dank Echos Zauber knarzte nicht ein einziges Brett, als wir ins Innere schlichen.",
        "Wir positionierten uns vor der Tür, hinter der wir den Wachturm vermuteten, nickten uns noch einmal mit sicherem Blick zu, und dann stieß Friedrich die alte Tür auf und trat hinein!",
        "Hinter der Tür war der Goblin, den wir von außen gesehen hatten, und er sprang komplett überrumpelt zur Seite. Er war jedoch nicht allein, und inmitten des Raumes stand eine Drow, die uns offenbar erwartet hatte … Sie trug eine leichte, komplett schwarze Rüstung, zog einen Krummsäbel aus der Scheide an ihrem Gürtel und streckte uns diesen kampfbereit entgegen. Neben ihr saßen zwei gefesselte Gestalten auf Stühlen, eine sah aus wie Gundren?! Neben ihm saß eine Kriegerin in Rüstung. Beide hatten die Hände auf dem Rücken gefesselt, waren außerdem an ihre Stühle gebunden und schauten überrascht in unsere Richtung. Die Erschöpfung stand ihnen ins Gesicht geschrieben, wahrscheinlich waren sie lange verhört worden.",
        "!bugbear-frei.webp|Ein Bugbear. Die Krallen waren in Wirklichkeit noch länger.|frei",
        "Und das war noch nicht alles, denn nur Augenblicke später bewegte sich etwas im anderen Teil des Wachturms, und wir vernahmen ein dumpfes Knurren. Dort richtete sich gerade ein Bugbear zu seiner vollen Größe auf, ein gewaltiger Verwandter der Goblins mit gelblichem Fell und langen Krallen, und sah uns grimmig entgegen. In seinen Augen lag derselbe stumpfe Kampfeswille wie bei seinen kleinen Vettern, und es war klar, dass er sich jeden Moment auf uns stürzen würde.",
        "Friedrich zögerte keinen Moment. Sein Pfeil streifte den Oberschenkel der Drow, und noch während sie schmerzerfüllt aufschrie und sich ungläubig an die Wunde griff, sprang Echo vor und ließ einen Fächer aus Eis auf sie und den Goblin zuschießen. Der Goblin bekam die volle Ladung ab, die Drow konnte trotz ihres verwundeten Beins zurückweichen und wurde nur gestreift.",
        "Ich spitzte gerade meine Lippen und wollte die Drow mit einem verbalen Angriff bedrohen, als der Bugbear auf uns zustürmte und mit seinem Angriffsschrei alles andere übertönte! Dabei hatte ich eine wirklich gute Beleidigung vorbereitet. Zum Glück stand er weit abseits und erreichte uns nicht, bevor Ezekiel mit einem gekonnten Schuss aus seinem Bogen dem eisbedeckten Goblin einen Pfeil genau zwischen die Augen schoss, und dieser fiel sofort tot nach hinten um. Zwischen die Augen ist bei uns offenbar Standard. Rex, der das alles wohl für ein Spiel hielt, sprang glücklich bellend auf die Drow zu und verbiss sich in ihr ohnehin schon blutiges Bein. Ihr Schmerzensschrei war noch nicht verklungen, da flutete ich ihre Gedanken mit Angst, und aus dem Schmerz wurde Panik.",
        "Der Bugbear war inzwischen näher gekommen und schlug mit seiner Pranke nach Echo. Die Krallen blitzten kurz im Fackelschein und schnitten dann direkt durch den Arm unseres Druiden, und Blut spritzte durch den Raum!",
        "Friedrich sah das, sprang mit einem gewaltigen Satz auf den Bugbear zu und stach sein Schwert in dessen pelzige Seite. Er musste ihn gut getroffen haben, aber trotz verwundeter Flanke schubste der Bugbear den Waldläufer von sich und drehte sich gerade wütend zu Echo um, um diesen ein weiteres Mal zu attackieren. Doch da war Ezekiel schon neben ihm, wie aus dem Nichts. Zwei Dolche, einer in die bereits verwundete Flanke, einer tief in den Rücken! Der behaarte Hüne erschlaffte und fiel zu Boden, die gezielte Attacke unseres Assassinen hatte ihn unschädlich gemacht. <em class=\"aside\">Als er aufschlug, bebte der Steinboden. So riesig war er.</em>",
        "Ob es an meiner Stimme in ihrem Kopf lag – ich denke schon – oder ob sie einfach realisierte, dass ihre einzige Chance die Flucht war: Sie verwandelte sich in eine kleine Fledermaus und floh blitzschnell auf den kleinen Spalt in der Turmmauer zu, durch den wir anfangs den Fackelschein gesehen hatten. Höhnisch rief sie: „Die Spinne wird euch kriegen …“, bevor sie mit einem lauten Lachen verschwand.",
        "Echo wollte ihr schon nachsetzen und die Verfolgung beginnen, doch ich hielt ihn zurück und deutete auf seine blutverschmierte Schulter und danach in Richtung der beiden Gefangenen.",
        "Während Echo anfing, seine Wunden zu heilen, schnitt Friedrich die beiden Gefangenen los. Die beiden waren sichtlich erleichtert und erzählten uns, dass sie seit Tagen hier gefangen gehalten wurden, um Informationen über Gundren und die Allianz der Lords herauszufinden. Der Gefangene stellte sich als Gundrens Zwillingsbruder Nundro heraus. <em class=\"aside\">Die beiden sehen wirklich exakt gleich aus und tragen sogar dieselbe Kleidung.</em> Die andere Gefangene stellte sich als Zilda vor, eine Söldnerin, die für Gundren arbeitete.",
        "## Gundrens Bruder",
        "Gemeinsam mit Nundro kehrten wir zu Gundren zurück, und der schloss seinen Bruder überglücklich in die Arme. Ich gebe zu, bei diesem Anblick wurde selbst mir ein wenig warm ums Herz.",
        "## Die magische Schmiede",
        "Dann wurde es ernst. Gundren gab uns den Auftrag, auf den alles hinausgelaufen war: Wir sollten die magische Schmiede finden.",
        "Der Weg führte uns in die alte, verlassene Mine, in der sie verborgen sein sollte. Wir fanden unseren Weg durch die riesige Höhle, kletterten Schluchten hinab und schlichen durch bröcklige, spinnwebenverhangene Gänge, die vor langer Zeit gebaut wurden.",
        "Gegner um Gegner stellte sich uns in den Weg, doch wir konnten sowohl die alten, klapprigen Skelette als auch die fledermausähnlichen Kreaturen, die uns von der Decke aus ansprangen, niederstrecken. Einige dieser Kämpfe waren richtig hart. <em class=\"aside\">Wie viele es genau waren? Viele. Sehr viele. Mehr als ich an zwei Händen abzählen kann, glaube ich.</em>",
        "Am Ende eines dieser Gänge wartete eine alte Bekannte: Nezna, die Drow, die uns im Wachturm als kleines Tier entwischt war. Ein zweites Mal ließen wir uns nicht von ihr austricksen. Während mein Zauber Nezna daran hinderte, uns aus der Ferne anzugreifen, schlug Echos Blitz zwischen ihr und ihren beiden Söldnern ein, und sie überlebten nur knapp. Der erste Söldner fiel sofort unter Friedrichs Pfeil, der zweite hatte alle Hände voll mit Rex zu tun, der sich in sein Bein verbissen hatte. Niemand achtete mehr auf den Schatten, der sich in Neznas Rücken schob. Ezekiel stach ihr seinen Dolch tief in den Rücken! Blut gurgelnd ging Nezna auf die Knie, ihre Hände ungläubig auf die Stelle an ihrer Brust gepresst, an der sie der Dolch durchbohrt hatte und die sich schnell scharlachrot verfärbte … Mit letzter Kraft röchelte sie: „Die Spinne wird euch holen“, bevor sie endgültig zusammenbrach.",
        "Der letzte Söldner wehrte sich nur noch panisch. Kurz darauf lag er neben seiner Auftraggeberin auf dem kalten Höhlenboden. Wer immer diese Spinne ist: Ihre Leute lernen offenbar genau einen Satz.",
        "Wir gingen noch tiefer, auf der Suche nach unserem Ziel, dachten kurzzeitig schon, es wäre alles nur ein Mythos, doch am Ende standen wir vor ihr: der magischen Schmiede, umgeben von leuchtenden Runen. Für einen Moment war es ganz still, und ich vergaß sogar, etwas Kluges zu sagen. Wie viele Generationen hatten hier wohl schon magische Gegenstände geschaffen, wie viele Schlachten wurden gekämpft, um sie unter ihre Kontrolle zu bringen?",
        "Die letzten verbliebenen Wächter der Schmiede räumte unsere Gruppe noch aus dem Weg, dann gehörte sie endlich uns!",
        "Die Runen an den Wänden glommen auf, eine nach der anderen, als hätte die Schmiede uns erwartet. Es roch nach kaltem Metall und nach etwas Älterem, das ich nicht benennen konnte. Echo strich mit den Fingern über den Amboss, so behutsam, wie ich ihn noch nie etwas habe anfassen sehen. Nicht einmal Gold.",
        "Wir schlugen unser Lager auf und überlegten, wie wir weiter vorgehen wollten.",
        "!magische-schmiede.jpg|Rast vor der magischen Schmiede. Und nein, ich habe nicht angegeben.",
        "Dann ging es zurück zu Gundren, mit der besten Nachricht, die ein Händler bekommen kann: Die Schmiede ist gefunden. Und die Wächter verlangen keinen Lohn mehr.",
        "## Neverwinter",
        "Wir kehrten nach Neverwinter zurück, in die Stadt, in deren Hafen alles begonnen hatte. Wer große Taten vollbringt, sollte schließlich auch davon erzählen, und wo ginge das besser als in der großen Stadt? Kaum hatten wir uns ein Zimmer in einem Gasthof gesichert, baten wir – sagen wir: nachdrücklich – um eine Audienz bei der Allianz der Lords.",
        "Ganz nach Protokoll lief das nicht. Etwas plump und ziemlich forsch marschierte unsere Truppe an den Wachen vorbei, geradewegs zum Leiter der Allianz, Captain Dolgrimson. Der war nicht gerade erfreut, doch als wir ihm erzählten, dass wir in Gundrens Auftrag die magische Schmiede aufgespürt und befreit hatten, verbesserte sich seine Stimmung merklich.",
        "Trotzdem vertröstete er uns auf den darauffolgenden Tag: Für ein Gespräch habe man erst später Zeit.",
        "Also ging es auf eigene Faust durch die Straßen von Neverwinter, wir lauschten in Tavernen und auf Marktplätzen und versuchten, Gerüchte aufzuschnappen, um die Zeit zu nutzen und noch etwas Geld zu verdienen … Jedoch ohne Erfolg, und wir kehrten abends zu unserem Gasthof zurück. Nach ein paar Getränken an der Bar fielen wir in unsere Betten. Nach Wochen auf der Straße fühlte sich ein gepolstertes, sauberes Bett an wie ein Geschenk der Götter.",
        "## Die Allianz der Lords",
        "Am nächsten Morgen ging es zurück zur Allianz. Nach einem langen Gespräch stand der Entschluss fest: Unsere Heldengruppe würde der Allianz der Lords beitreten und ihre Kräfte stärken. Ein Barde in den Reihen der Lords. Mir gefiel, wie das klang.",
        "## Donnerbaum",
        "Kaum waren wir Mitglieder der Allianz, wartete auch schon der erste Auftrag. Captain Dolgrimson schickte uns nach Donnerbaum, einem kleinen, verlassenen Dorf etwas östlich von Neverwinter. Wir sollten dort nach dem Rechten sehen …",
        "Donnerbaum empfing uns mit einer Stille, die mir sofort unter die Haut kroch: ein paar Häuser, die verlassen wirkten, und über allem ein großer, halb verfallener Wachturm, an dessen Mauern Moos und Moder nagten.",
        "## Der Drache im Turm",
        "Die Gefährten schlichen durch den Turm nach oben. Stufe um Stufe, gespannt, was sie dort erwarten sollte … Auf dem höchsten Plateau schlug das Schicksal zu: Zuerst hörten wir nur einen kreischenden, markerschütternden Aufschrei aus dem anliegenden Wald, dann wurde plötzlich eine Kreatur sichtbar, die schnell auf uns zuflog und schließlich auf dem Plateau landete … Ein junger grüner Drache griff an, ein giftspeiendes Ungetüm mit riesigen Krallen und Zähnen, die nur darauf warteten, uns zu zerfetzen … Ein Venomfang!",
        "Der Kampf war brutal. Kaum hatte sich Ezekiel halb vor dem ersten Giftstrahl gerettet, traf der nächste Giftodem Echo mit voller Wucht. Dann kam mein großer Moment: Ich zog den Drachen mit meiner Magie in einen hypnotischen Bann, und meine Gefährten nutzten die Gelegenheit, um mit vereinten Kräften auf das furchtbare Biest einzudreschen. In einem letzten tosenden Aufbäumen schlugen die Krallen des Drachen nach Friedrich und verfehlten ihn knapp. Ezekiel nutzte die Chance, die sich auftat, schoss einen gezielten Pfeil auf den Kopf des Drachen und verpasste ihm so den finalen Stoß! Wir gingen als glückliche Sieger aus dem Kampf hervor, allerdings hatte uns sein Giftatem übel zugesetzt. Meine Lunge brannte noch Stunden danach, und Friedrich wäre beinahe von einer Kralle skalpiert worden.",
        "Wir überlebten also nur knapp. Erst einmal: durchatmen, Wunden versorgen, Pfeife stopfen. In genau dieser Reihenfolge. Dann die Beute. Echo war dabei, wie man sich denken kann, besonders gründlich. Danach gönnten wir uns eine lange Rast, und die hatten wir uns verdient.",
        "!venomfang-besiegt.jpg|Der Venomfang ist besiegt. Ich gönne mir eine Pfeife, und Rex hat sich seinen Anteil an der Beute schon gesichert.",
        "## Das verlassene Dorf",
        "Dann war der Rest des Dorfes an der Reihe. In einigen der vermeintlich leeren Häuser lauerten Zombies, die laut ächzend und stöhnend auf uns zustolperten. Ausgeruht, wie wir waren, hatten sie keine Chance. Tot waren sie danach nicht mehr als vorher, nur deutlich ruhiger.",
        "Vor einem der Häuser stand eine Statue, bei deren Anblick Ezekiel innehielt: Er erkannte darin seinen Onkel. <em class=\"aside\">Mehr hat er dazu nicht gesagt … Natürlich nicht …</em>",
        "!blight-frei.webp|Blights: Wurzeln, Zweige und rubinrote Augen. Gemütlich ist anders.|breit",
        "In einem anderen Haus in der Ortsmitte vernahmen wir von draußen ein Ächzen von Holz und das Rascheln von Blättern, und als wir die Tür öffneten, stellten sich uns Blights in den Weg! Kleine Gestalten aus Wurzeln und knorrigem Holz, fast wie Menschen, mit rubinrot glühenden Augen. Sie waren flinker als gedacht und konnten einen leicht aus einem Hinterhalt anspringen, jedoch war ihnen unsere Heldengruppe überlegen, und wir besiegten sie mit nur wenigen Angriffen.",
        "Beim weiteren Durchsuchen des Dorfes entbrannten weitere Kämpfe gegen etliche Blights, gegen zwei riesige Spinnen und gegen, wer hätte es gedacht, noch mehr Blights … bis Echo einen gewaltigen Feuerball losließ, das Problem auf seine Weise löste und sich die verbliebenen Wurzelmonster in Asche verwandelten. <em class=\"aside\">Die Hitze spüre ich heute noch im Gesicht.</em>",
        "!ilvara-druidin.webp|Ilvara, wie sie sich uns zeigte: ehrwürdig, freundlich und mit Fuchs. Was sollte da schon schiefgehen?|schmal",
        "Vor dem letzten Haus wartete schließlich eine Druidin, die sich als Ilvara vorstellte. Ganz in Grün gekleidet, einen Fuchs auf den Schultern und einen kleinen Spatz auf dem Fuß, wirkte sie wie eine Hüterin des Waldes. Es roch nach Essen, und durch die offene Tür sahen wir einen köchelnden Topf und hofften auf eine warme Speise. Dahinter stapelten sich Kräuter, Tinkturen und handschriftliche Notizen über die Tiere des Waldes.",
        "Keiner von uns ahnte etwas Böses, als sie uns in ihr Haus bat …"
      ],
      /* Lebende Seitenränder: eine Kulisse pro "## "-Abschnitt, in derselben Reihenfolge (alle Orte stehen in chronik/kulissen.js) */
      kulissen: ["hafen", "waldstrasse", "goblinhoehle", "phandalin", "crackmore", "wachturm", "wiedersehen", "schmiede", "neverwinter", "allianz", "donnerbaum", "drachenturm", "geisterdorf"],
      /* „Was bisher geschah“ in 60 Sekunden: abschnitt = Überschrift, zu der „Zur Stelle“ springt */
      rueckblick: [
        { abschnitt: "Die Einladung", bild: "gundren-treffen.jpg", titel: "Ein Brief, ein Hafen, ein Zwerg", text: "Gundren lud uns in den Hafen von Neverwinter: mich, Friedrich samt Rex, den grimmigen Echo und Ezekiel, den undurchschaubaren Darkin. Die Vorstellungsrunde? Holprig. Das Angebot: eine verschollene magische Schmiede und eine stattliche Belohnung." },
        { abschnitt: "Hinterhalt auf der Straße", bild: "hinterhalt-sieg.jpg", titel: "Goblins am Wegesrand", text: "Auf dem Weg nach Phandalin sprangen Goblins aus dem Wald. Einige unserer Angriffe gingen mit großer Überzeugung ins Leere, meine eingeschlossen. Danach stürmten wir ihre Höhle und befreiten die angebundenen Wölfe." },
        { abschnitt: "Schloss Crackmore", bild: "glasstab-besiegt.jpg", titel: "Die Roten Roben", text: "Phandalin zahlte Schutzgeld an die Roten Roben. Rex fand beim Kaninchenjagen den Geheimgang ins Schloss, wir schlüpften in rote Roben, und Friedrichs Pfeil beendete Glasstabs Flucht. Seine letzten Worte: die Spinne." },
        { abschnitt: "Der Gefangene im Wachturm", bild: "bugbear.jpg", titel: "Bugbear, Drow und ein Zwilling", text: "In einer sternklaren Nacht stürmten wir einen Wachturm. Ezekiels Dolche fällten den Bugbear, die Drow entkam als Fledermaus. Der Gefangene? Nundro, Gundrens Zwillingsbruder, und mit ihm die Söldnerin Zilda." },
        { abschnitt: "Die magische Schmiede", bild: "magische-schmiede.jpg", titel: "Die magische Schmiede", text: "Durch die alte Mine, vorbei an Skeletten und Fledermausbiestern, bis zu Nezna. Diesmal traf sie Ezekiels Dolch. Dann standen wir vor der Schmiede voller leuchtender Runen. Sie gehört jetzt uns!" },
        { abschnitt: "Die Allianz der Lords", bild: "aufbruch-neverwinter.jpg", titel: "Ein Barde unter Lords", text: "Zurück in Neverwinter marschierten wir etwas forsch zum Leiter der Allianz der Lords. Eine Nacht im weichen Bett und ein langes Gespräch später waren wir Mitglieder. Mir gefällt, wie das klingt." },
        { abschnitt: "Der Drache im Turm", bild: "venomfang-besiegt.jpg", titel: "Ein Drache in Donnerbaum", text: "Erster Auftrag: das verlassene Dorf Donnerbaum. Oben auf dem Turm griff ein Venomfang an. Mein hypnotischer Bann, Ezekiels Pfeil, Drache tot. Danach Zombies, Blights und Echos Feuerball." },
        { abschnitt: "Das verlassene Dorf", bild: "ilvara-druidin.webp", titel: "Die freundliche Druidin", text: "Im letzten Haus empfing uns Ilvara: ganz in Grün, mit Fuchs und köchelndem Topf. Sie bat uns herein. Keiner von uns ahnte etwas Böses …" }
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
        "Wie viel Zeit vergangen war, wusste keiner von uns, als wir wieder zu uns kamen. Ein paar Stunden? Tage? Ich fühlte mich immer noch etwas benebelt, und es dauerte ein paar Momente, bis ich die Situation begriff. Die ganze Truppe lag in Fesseln, in einem gefängnisartigen Raum hinter Schloss und Riegel. Vor den Gitterstäben standen zwei Wachen und starrten grimmig herein. Sie lachten über uns, und außer ihren höhnischen Stimmen durchschnitt nur ein fernes Rauschen die Stille. Ich war mir nicht sicher, was dieses Rauschen war. Mich interessierten ohnehin eher die Beleidigungen der Wachen. Fachlich.",
        "Ich antwortete mit einem Fluch. Die Wache antwortete mit einem Knüppel. <em class=\"aside\">Ich wurde richtig wütend, zügelte mich aber, da ich die Hilflosigkeit der Lage erkannte.</em>",
        "!gefangen-kerker.jpg|Das böse Erwachen: hinter Gittern, gefesselt und bewacht. Selbst Rex schaut nicht begeistert.|mitte",
        "Dann hatte Echo eine geniale Idee: Er verwandelte sich in eine Ratte und nagte uns einem nach dem anderen die Fesseln durch. Danach schlüpfte er unbemerkt aus der Zelle und fand in einem Nebenraum unsere Ausrüstung. Immer noch in Tiergestalt schaffte er alles zurück zu uns. <em class=\"aside\">Einfach genial, Echo!</em>",
        "## Der Ausbruch",
        "Kaum hielten alle wieder ihre Waffen in den Händen, beleidigte ich die verdammten Wachen hemmungslos und ließ sie meine ganze Verachtung spüren. Sie stürmten herein, um mich zu bestrafen, und liefen geradewegs in unseren Hinterhalt! Einer von den beiden schrie leider so laut, dass es noch eine Weile in der riesigen Höhle widerhallte. Daraufhin schreckten wohl einige der Gegner auf, jedenfalls wurde die Festung sofort durchströmt von Schritten und Stimmen, die auf direktem Weg zu uns drängten …",
        "Und dann, wie aus dem Nichts, war auf einmal ein lautes, unangenehm anschwellendes Summen zu hören. Es kam näher und näher und übertönte die Wachen aus der Festung. Außerdem hallte plötzlich ein raubvogelähnlicher Schrei durch die Höhle, gefolgt von einem zerschmetternden Aufschlag und dem Schreien von Wachen aus einem nahe gelegenen Hof, der wohl hinter dem Wachturm lag.",
        "!chasme-frei.webp|Eine Chasme: Flügel, Stachel und dieses Summen …|frei hoch",
        "Wir hatten jedoch nicht lange Zeit, uns darüber Gedanken zu machen, denn fast zeitgleich stürzte sich mit ohrenbetäubendem Surren ein riesiges, wespenähnliches Monster mit langem Saugstachel auf uns! Echo erkannte, dass es sich um einen Dämon, eine Chasme, handelte, und rief allen zu, vorsichtig zu sein. Die Warnung des Druiden kam jedoch leider zu spät, und die Chasme stürzte sich mit voller Wucht auf Friedrich und traf ihn mit einem einzigen, gewaltigen Stich … Fassungslos sah ich Friedrich zu Boden gehen, sah, wie er langsam auf die Knie sank, seine Gesichtszüge spiegelten Ungläubigkeit und Überraschung wider.",
        "Mit einem wuterfüllten Schrei sprang Ezekiel aus seiner Deckung und stieß beide Dolche auf den Dämon nieder, der gerade seinen Freund gefällt hatte! Doch die Klingen glitten am Chitinpanzer ab. Echos Blitz traf dort, wo die Dolche versagt hatten, und brannte sich in den Panzer, während ich meinen ganzen angestauten Zorn in den Geist des Monsters schleuderte.",
        "Das verdammte Biest stach noch mal mit seinem riesigen Stachel zu und traf Ezekiel. Er schrie auf, begleitet vom aggressiven Summen, und ich sah, dass das Blut spritzte, als der Stachel des Monsters sich tief in sein Fleisch bohrte. Ich weiß nicht, wie er es schaffte, auf den Beinen zu bleiben, doch Ezekiel rammte seinen Dolch genau in das Auge der Bestie, und sein zweiter Angriff schnitt in den Körper der Chasme. <em class=\"aside\">Mitten ins Auge. Unglaublich.</em> Daraufhin verstummte das Summen endlich, und die Chasme lag regungslos auf dem Boden vor der Gefängniszelle.",
        "Echo und ich eilten dem ohnmächtigen Friedrich und dem schwer verletzten Ezekiel zu Hilfe, wirkten Heilzauber und verteilten Heiltränke. All das taten wir, während im Nebenhof immer noch Kampfgeräusche zu hören waren. Offenbar war dort immer noch eine blutige Auseinandersetzung im Gange … Einigermaßen erholt und mit verbundenen Wunden stiegen wir eine der Treppen empor und konnten zum ersten Mal in den Nebenhof sehen.",
        "!vrock-frei.webp|Ein Vrock, halb Geier, halb Albtraum.|frei hoch links",
        "Dort herrschte das absolute Chaos, zerstörte Tische und tote Soldaten waren über den Boden verteilt, und ein geierartiger Dämon mit zerzausten Schwingen kreiste über ihnen und attackierte die verbliebenen Gegner. Er stieß gerade mit einem lauten, krächzenden Aufschrei auf eine der Wachen nieder, als ich dahinter Ilvara erkannte, die Gestaltwandlerin, die uns betäubt und hierher verschleppt hatte. Mit grimmigem Gesichtsausdruck schoss die Drow Pfeile auf den Dämon, der durch ihre Festung wütete. <em class=\"aside\">Woher die Dämonen kamen und warum sie ausgerechnet Ilvaras Festung angriffen, ist mir bis heute ein Rätsel.</em>",
        "Von der Treppe aus erledigten Friedrich und Ezekiel mit gezielten Schüssen die letzten Wachen, blutverschmiert und trotzdem treffsicher wie eh und je, während Echo den Dämon, den er als Vrock erkannte, mit einem gleißenden Blitz vom Himmel holte. Noch knisternd vor Spannung schlug das Geiermonster hart auf dem Boden auf.",
        "Auf der gegnerischen Seite war nur noch die Drow verblieben, und ich fing an, ihr Schimpftiraden und heftige Beleidigungen entgegenzuschmettern. Ich denke, sie hat den Ernst ihrer Lage kapiert, und sie flüchtete. Sie rannte einfach auf das Geländer zu und sprang in den Abgrund. „Die Spinne wird euch alle kriegen!“, hallte es von der Höhlendecke, kurz gefolgt von einem Platschen – sie war in dem laut rauschenden Fluss unter der Feste gelandet und entkommen. <em class=\"aside\">Schon wieder diese Spinne. Langsam nehme ich das persönlich.</em>",
        "Danach wurde der Unterschlupf unserer Entführer gründlich durchsucht, Echo natürlich vorneweg. Etwas Beute kam zusammen. Außerdem fanden wir eine Spinnenstatue. Die bekam von uns eine neue Bemalung, zuerst nur mit einem zusätzlichen Bart, doch schnell wurden daraus Phallussymbole und ähnliche Schmierereien. Kindisch? Vielleicht. Befreiend? Absolut.",
        "## Durch die Spinnweben",
        "Immer tiefer führte der Weg ins Unterreich. Dichte Spinnweben versperrten uns teilweise den Weg. Es gab hier jedoch auch so tiefe Schluchten, dass wir ohne die Spinnweben niemals von der einen zur anderen Seite gekommen wären. Es war zwar ein ziemlicher Balanceakt, und wir mussten uns sehr konzentrieren, dabei keine neuen Spinnen auf uns aufmerksam zu machen … Wegen der klebrigen Fäden hätte ich beinahe einen Sprung zum nächsten Felsvorsprung nicht geschafft, und es war nur Friedrichs Hand, die mich vor dem Fallen bewahrte!",
        "Ein paar Spinnen stellten sich uns trotz aller Mühe, unerkannt zu bleiben, doch in den Weg. Ezekiel und Friedrich sorgten jedoch mit einigen perfekten Treffern schnell für den Sieg über die Achtbeiner.",
        "In einem der Spinnenkokons, die wir unterwegs fanden, wartete eine Überraschung: ein Gnom namens Fagas, gefangen, aber noch am Leben. Er erzählte uns, dass er und sein Trupp ausgesandt worden waren, um ein Grab zu finden. Arafil, einer der Magier des Roten Sitzes, hatte ihnen den Auftrag erteilt.",
        "Es handelte sich, so erzählte Fagas weiter, um ein ganz besonderes Grab: die Ruhestätte der Magierin Khaem, einer Netherese, die vor rund 3000 Jahren gelebt hatte. Eine Meisterin des magischen Fadens aus einer längst vergangenen Hochkultur. Echo witterte sofort einen Schatz, und Fagas schloss sich uns an.",
        "## Das Grab der Magierin",
        "Der Weg durch das Unterreich zeigte sich nun von einer überraschend schönen Seite: funkelnde Flüsse, leuchtende Pilze, ein ganzes Reich in sanftem Licht. Für einen Augenblick vergaß ich fast, wo wir waren. Es dauerte jedoch nicht lange, bis sich uns zuerst Spinnenmonster und später auch noch Ettercaps in den Weg stellten. Die Helden erschlugen sie alle und kämpften sich ihren Weg tiefer in die Unterwelt.",
        "Einer der Kämpfe fand in einer Ruine statt: einer halb eingebrochenen Siedlung, die bis auf die letzten Häuser im tiefen Schwarz des Abgrunds verschwunden war. Nur dicke Spinnennetze hielten diese letzten Häuser noch fest. Ein falscher Schritt, und es wäre hinab ins Nichts gegangen.",
        "!unterreich-spinnweben.jpg|Unterwegs durch die Spinnweben des Unterreichs. Ganz entspannt, wie man sieht.",
        "In einem tempelähnlichen Haus entdeckte unsere Truppe eine weitere Spinnenstatue. Und als auch diese ihr neues Make-up bekam, tat sich ganz zufällig ein Geheimgang auf!",
        "Kaum hatten wir ihn betreten, erklang eine Stimme in unseren Köpfen und flehte um Hilfe. Mir lief es eiskalt den Rücken hinunter. <em class=\"aside\">Wessen Stimme das war, ist bis heute ein Geheimnis.</em> Der magische Faden, so schien es, war an diesem Ort verdreht. Vorsichtig ging es tiefer in das verzauberte Grab, bis hinter einer Statue ein versteckter Schalter auftauchte.",
        "Als wir ihn betätigten, erschien eine geisterhafte Gestalt und sprach in unverständlichen Worten. Dann formte unheilige Energie einen furchterregenden Gegner: einen Wraith. Noch bevor einer von uns reagieren konnte, wirbelte er herum und rammte Fagas seine Krallen in den Bauch. Mit letzter Kraft röchelte der kleine Gnom: „Das … Grab …“, dann rührte er sich nicht mehr. Nach einem harten Kampf war der Wraith besiegt, und als Lohn wartete eine Waffe, von der schon Legenden erzählen: Dawnbringer, ein magisches Schwert.",
        "Als Ezekiel das Schwert aus seiner Halterung hob, wurde es hell im Grab. Kein Fackelschein, sondern ein warmes Licht wie ein Sonnenaufgang, mitten im Unterreich, wo seit Jahrtausenden keine Sonne geschienen hatte. Ehrfürchtig strich er mit den Fingern über die Klinge, und zum ersten Mal konnte ich in seinem sonst so regungslosen Gesicht lesen: Vorfreude. Vorfreude darauf, diese Klinge gegen jeden zu führen, der sich uns in den Weg stellt.",
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
        "Das Ungeheuer machte sich daran, die Stadt zu zerstören. Mit seinen Tentakelarmen zermalmte es Gebäude, Gegner und Verbündete gleichermaßen. Wir rannten, wie ich noch nie gerannt bin, und erreichten mit viel Glück ein Boot. Kardal entkam mit uns.",
        "Vom Boot aus sah ich zurück. Ploopploopeen stand noch auf den Stufen seines Tempels, die Arme erhoben, als könnte er den Dämon mit einem Gebet aufhalten. Dann fiel ein Tentakel, und der Tempel war nicht mehr da. Von seinem Volk und ihrer Stadt blieben nur Ruinen, die langsam im aufgewühlten See versanken. Ich hatte ihm noch ein Lied versprochen. Es wurde ein Klagelied.",
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
        "!audienz-horga.jpg|Audienz bei König Horga Stahl V. Kardal kniet vor seinem Vater, und wir versuchen, nicht allzu staubig auszusehen.",
        "Leicht fiel uns der Aufenthalt allerdings nicht. Die Luft hier unten setzte uns zu, vor allem Echo, der mit deutlichen Zeichen von Erschöpfung aufwachte.",
        "Unserem Druiden fehlte der Himmel. Morgens saß er am Fenster und starrte hinauf zur Felsdecke, wo eigentlich Wolken und Sterne hätten sein sollen. Dazu kam der Gestank der Stadt: Ruß und Schwefel aus unzähligen Schmieden, der in jeder Gasse hing und den er einfach nicht mehr aus der Nase bekam. Ein Druide ohne Himmel und frische Luft, das ist wie ein Barde ohne Publikum.",
        "## Einkaufen in Gracklstugh",
        "Was tut eine Heldengruppe in einer fremden Stadt? Richtig: einkaufen. Wir deckten uns mit Heiltränken ein, und ich erstand eine Flöte der Illusionen und dazu ein paar Zaubertränke. Natürlich konnte ich nicht widerstehen und spielte noch im Laden darauf: Über der Theke erschien ein winziger Demogorgon, kaum größer als meine Hand, der eine Miniaturstadt in Schutt und Asche legte. Der Händler fand das weniger lustig als ich. <em class=\"aside\">Man weiß nie, wann man ein Publikum verzaubern muss. Oder einen Gegner.</em>",
        "## Der rasende Riese",
        "!riese.webp|Der Riese, kurz bevor wir ihn zur Ruhe gebracht haben. Seinem Blick nach hört er die Stimmen noch.|frei",
        "Plötzlich hörten wir Schreie und das Krachen von Häusern, und schon stand ein Riese vor uns und griff an. Mit vereinten Kräften gelang es uns, ihn zu betäuben und zu fesseln.",
        "Kurz darauf erschien ein zweiter Riese, doch dieser dankte uns. Den Ausfall seines Artgenossen konnte er sich nicht erklären. Offenbar hatten ihn Stimmen in seinem Kopf dazu getrieben. Stimmen im Kopf … Das kam mir unangenehm bekannt vor.",
        "Zum Dank lud er uns ein, mit dem Steinsprecher zu reden. Welch eine Ehre!",
        "## Das Dorf der Riesen",
        "Nach ein paar weiteren Plänkeleien in unserer Gruppe (die Einzelheiten erspare ich der Nachwelt) beschlossen wir, der Einladung zu folgen. Kardal führte uns in das Dorf der Riesen, eine eigene kleine Welt am Rand von Gracklstugh. Hier wird Stein gebrochen: Riesen schieben gewaltige Wagen voller Gestein und Erz durch die Gassen, als wären es Schubkarren.",
        "Echo nutzte die Gelegenheit, den nächstbesten Riesen zu fragen, ob er Gundren kenne. Das hatte er in Gracklstugh schon bei jedem einzelnen Händler versucht. Der Riese sah sehr lange und sehr weit nach unten. Die Antwort war nein. Dafür bemerkte der Riese, wie Rex neugierig an ihm schnupperte, und streichelte ihn daraufhin interessiert und liebevoll. <em class=\"aside\">Rex hat in Gracklstugh offenbar mehr Freunde als wir alle zusammen.</em>",
        "## Der Steinsprecher",
        "Kaum hatten wir das Dorf betreten, empfing uns schon der Steinsprecher Hgraam. Er erzählte von einem alten Pakt zwischen den Riesen und dem König: Man lässt einander in Ruhe und achtet die Grenzen. Die Riesen leben zwar in einer Enklave der Stadt, bleiben aber lieber in ihrem Teil, und die Zwerge in ihrem. Mehr wollte Hgraam dazu nicht sagen. Dann wurde er ernst: Etwas Böses, Unersättliches regt sich, sagte er, und der Stein schreit. Mehr war aus ihm nicht herauszubekommen, denn Steinsprecher reden offenbar grundsätzlich in Rätseln. <em class=\"aside\">Ich kenne das. Ich nenne es Lyrik.</em> Ein schreiender Stein, ein Riese mit Stimmen im Kopf … ganz schön laut bei diesen Riesen.",
        "In einem letzten Versuch griff ich zu meiner Flöte der Illusionen und ließ ein weiteres Mal Demogorgon erscheinen, in voller Größe und mit allen Tentakeln, damit Hgraam begreift, mit welcher Art von Gefahr wir es hier unten zu tun haben könnten. Der Steinsprecher betrachtete den Dämon, nickte vage und sprach weiter in Rätseln, ungefähr so beeindruckt wie Ezekiel vor der Statue seines Onkels. <em class=\"aside\">Er war offenbar mit seinen eigenen Sorgen beschäftigt. Oder Riesen erschrecken einfach nicht so leicht.</em> Neue Antworten bekamen wir jedenfalls keine.",
        "Zum Dank dafür, dass wir den Riesen auf dem Markt der Klingen aufgehalten hatten, ohne ihm etwas anzutun, schenkte uns Hgraam einen Steinsprecher-Kristall. Die Ehre gebührt übrigens Friedrich: Er hatte den Rasenden mit einem Betäubungstrank ruhiggestellt, den wir keine fünf Minuten vorher an einem Marktstand gekauft hatten. <em class=\"aside\">Manchmal ist Einkaufen eben doch Heldentat.</em>",
        "## Besuch in der Schenke",
        "Zurück in der Schenke nahmen wir Kardal ins Verhör. Er wollte uns gerade von den Ärmsten der Stadt erzählen, die ganz unten in den Slums hausen, als zwei Zwerge in roten Roben an unseren Tisch traten und uns zu einem Gespräch baten. Sie nannten sich die Bewahrer der Flamme und dienten, so sagten sie, dem Meister der Flammen. <em class=\"aside\">Wer sich so nennt, hat entweder einen sehr großen Ofen oder ein sehr großes Ego. Wie sich herausstellte: beides.</em>",
        "## Die Bewahrer der Flamme",
        "Sie führten uns zu einem großen Stein, hinter dem sich ein geheimer Eingang verbarg. Mit jedem Schritt wurde es wärmer, bis wir vor Gartokkar standen, dem Hohepriester der Rotroben und ersten Diener ihres Meisters.",
        "Er geleitete uns in eine riesige, quadratische Halle, getaucht in ein lodernd rotes Licht wie aus dem Inneren eines Vulkans. Entlang der Wände und um alle Ecken floss ein unaufhörlicher Strom aus Lava. Und in der Mitte erhob sich ein Berg aus Gold: Münzen über Münzen, Edelsteine, halb geschmolzene Kostbarkeiten und Tiere aus purem Gold. Sogar ein goldener Hund war darunter. <em class=\"aside\">Rex hat ihn sehr lange und sehr misstrauisch angesehen.</em> Wir standen alle mit offenem Mund davor. Echo rechnete im Kopf schon nach, wie viel das wohl wäre und was er sich davon alles kaufen könnte. <em class=\"aside\">Man sah es an seinen Lippen. Er war bei Zahlen angekommen, für die ich keine Reime kenne.</em>",
        "Dann hörten wir es: ein Rauschen, das immer lauter wurde, wie von gewaltigen Schwingen. Etwas Großes kam näher. Sehr Großes.",
        "!themberchaud-halle.jpg|Wir vor Themberchaud und seinem Berg aus Gold. Ich habe noch nie ein Publikum gesehen, das so viel Feuer im Bauch hat.",
        "Mit einem tosenden Brausen landete der Meister der Flammen höchstpersönlich vor uns auf seinem Schatz: ein Drache! Themberchaud.",
        "## Themberchaud",
        "Ich tat, was ich am besten kann: Ich stimmte ein Lied an. Und was für eins! In Reimen besang ich unsere ganze Reise durch die Unterwelt, unsere Entführung in Donnerbaum, den Kampf gegen die Drow, die Spinnen und alles dazwischen, die Schlacht in der Stadt der Kuo-Toa, das Erscheinen Demogorgons, unsere Flucht und schließlich unsere Ankunft in Gracklstugh. Es war, das darf ich in aller Bescheidenheit sagen, eine natürliche 20. Themberchaud vernichtete uns jedenfalls nicht. <em class=\"aside\">Ich verbuche das als meinen bisher größten Erfolg vor Publikum.</em>",
        "Kaum war der letzte Ton verklungen, trat Echo vor und fragte den Drachen, ob er zufällig Gundren kenne. <em class=\"aside\">Ich habe in diesem Moment nicht geatmet. Themberchaud übrigens auch nicht. Dann hat er einfach weitergeredet. Die Antwort war also vermutlich nein.</em>",
        "Stattdessen erzählte uns der Drache, dass er seinem eigenen Hohepriester misstraut, und befahl uns, etwas für ihn zu erledigen und uns dafür von Gartokkar unterweisen zu lassen.",
        "## Das gestohlene Ei",
        "!themberchaud.webp|Themberchaud. Er hat mich nicht gefressen. Ich nehme das als Kompliment.|frei",
        "Erst als wir die Halle des Drachen wieder verließen und vor dem Ausgang auf Gartokkar trafen, rückte dieser mit der Sprache heraus: Jemand hat ein Drachenei gestohlen! Einem geheimen Hinweis zufolge verdächtigt er einen gewissen Drokey, angeblich ein Mitglied der Grauen Geister, einer Diebesgilde aus den Slums von Gracklstugh.",
        "Zum Abschluss überreichte er uns ein Abzeichen, als Zeichen, dass wir im Namen der Flamme handeln: eine faustgroße Goldmünze mit einem Drachenkopf darauf.",
        "<em class=\"aside\">Ein Drache, der seinem Priester nicht traut, ein Priester, der Diebe verdächtigt, und wir mittendrin. Ich spüre ein neues Lied.</em>"
      ],
      neuAb: "Das Dorf der Riesen", /* erster Abschnitt der neuesten Sitzung – dorthin führt „Weiterlesen“ auf der Startseite */
      /* Lebende Seitenränder: eine Kulisse pro "## "-Abschnitt, in derselben Reihenfolge (alle Orte stehen in chronik/kulissen.js) */
      kulissen: ["kraeuternebel", "kerker", "ausbruch", "spinnweben", "pilzgrab", "see", "demogorgon", "gracklstugh", "schenke", "thronsaal", "laden", "klingenmarkt", "riesendorf", "steinsprecher", "schenke-rotroben", "flammenhalle", "themberchaud", "drachenei"],
      /* „Was bisher geschah“ in 60 Sekunden: abschnitt = Überschrift, zu der „Zur Stelle“ springt */
      rueckblick: [
        { abschnitt: "Gefangen", bild: "gefangen-kerker.jpg", titel: "Aufgewacht hinter Gittern", text: "Ilvara war eine Drow und betäubte uns mit Kräuternebel. Wir erwachten gefesselt in einem Kerker. Echo nagte uns als Ratte die Fesseln durch und holte unsere Ausrüstung. Einfach genial." },
        { abschnitt: "Der Ausbruch", bild: "chasme.jpg", titel: "Ausbruch mit Dämonen", text: "Ich beleidigte die Wachen, sie liefen in unseren Hinterhalt. Dann eine Chasme: ein Stich, und Friedrich ging zu Boden, bis Ezekiel ihr den Dolch ins Auge rammte. Echo holte einen Vrock vom Himmel, Ilvara sprang in den Fluss." },
        { abschnitt: "Durch die Spinnweben", bild: "unterreich-spinnweben.jpg", titel: "Über Spinnennetze", text: "Wir balancierten über Netze und Schluchten, nur Friedrichs Hand bewahrte mich vor dem Fall. In einem Kokon steckte Fagas, ein Gnom auf der Suche nach dem Grab der Magierin Khaem." },
        { abschnitt: "Das Grab der Magierin", bild: "skizze-ettercap.webp", titel: "Dawnbringer", text: "Leuchtende Pilze, Ettercaps, eine frisch bemalte Spinnenstatue und ein Geheimgang. Im Grab tötete ein Wraith unseren Begleiter Fagas. Wir besiegten ihn, und Ezekiel hob Dawnbringer aus der Halterung: ein Sonnenaufgang mitten im Unterreich." },
        { abschnitt: "Demogorgon", bild: "kuo-toa-stadt.jpg", titel: "Ein Gott steigt aus dem See", text: "Ploopploopeen, Erzpriester der Kuo-Toa, schmuggelte uns in seine Stadt. Im Chaos befreiten wir den Zwerg Kardal. Dann stieg Demogorgon aus dem See. Friedrich schoss. Wirkung: keine. Geboxt hat er ihn trotzdem, sagt er." },
        { abschnitt: "Gracklstugh", bild: "flucht-see.jpg", titel: "Flucht übers Wasser", text: "Im Boot entkamen wir, während Ploopploopeens Tempel versank. Ich hatte ihm ein Lied versprochen, es wurde ein Klagelied. Am Ende des Sees: Gracklstugh, eine Festung im Fels." },
        { abschnitt: "Am Hof von König Horga", bild: "audienz-horga.jpg", titel: "Ein Prinz und ein König", text: "Kardal entpuppte sich als Sohn von König Horga. Mein Gesang (oder doch die Rettung seines Sohnes?) brachte uns Gastrecht. Echo vermisst den Himmel, und die Stadt riecht nach Ruß und Schwefel." },
        { abschnitt: "Der Steinsprecher", bild: "riese.webp", titel: "Stimmen im Kopf", text: "Ein Riese raste über den Markt, bis Friedrichs frisch gekaufter Betäubungstrank ihn stillstellte. Steinsprecher Hgraam schenkte uns einen Kristall und sprach in Rätseln: Etwas Unersättliches regt sich, der Stein schreit." },
        { abschnitt: "Das gestohlene Ei", bild: "themberchaud-halle.jpg", titel: "Ein Lied für einen Drachen", text: "Vor Themberchaud auf seinem Goldberg sang ich: eine natürliche 20, er fraß uns nicht. Sein Auftrag: Jemand hat ein Drachenei gestohlen, verdächtig ist ein gewisser Drokey von den Grauen Geistern. Ich spüre ein neues Lied." }
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
          { name: "Der Kerker", x: 8.0, y: 48.3, kapitel: "II", abschnitt: "Gefangen", text: "Hier erwachen die Gefährten gefesselt. Echo holt als Ratte die Ausrüstung, dann folgen Ausbruch und Dämonen." },
          { name: "Die Spinnweben", x: 12.0, y: 40.7, kapitel: "II", abschnitt: "Durch die Spinnweben", text: "Balancieren über Spinnennetze. In einem Kokon wartet der Gnom Fagas." },
          { name: "Das Grab der Magierin", x: 26.0, y: 27.3, kapitel: "II", abschnitt: "Das Grab der Magierin", text: "Hinter einer verunstalteten Spinnenstatue: ein Wraith und das Schwert Dawnbringer." },
          { name: "Der unterirdische See", x: 22.7, y: 41.9, kapitel: "II", abschnitt: "Der unterirdische See", text: "Am Ufer bittet Ploopploopeen, Erzpriester der Kuo-Toa, um Hilfe." },
          { name: "Die Ruinen der Kuo-Toa", x: 20.0, y: 47.1, kapitel: "II", abschnitt: "Demogorgon", text: "Hier stieg Demogorgon aus dem See. Von der Stadt sind nur Ruinen geblieben." },
          { name: "Gracklstugh", x: 19, y: 73, kapitel: "II", abschnitt: "Gracklstugh", text: "Die Festung im Fels. Kardal entpuppt sich als Prinz, der König gewährt uns Gastrecht, und ein Riese rast durch die Stadt." },
          { name: "Themberchauds Hort", x: 23.5, y: 77.5, kapitel: "II", abschnitt: "Die Bewahrer der Flamme", text: "Hinter einem großen Stein: eine lavaumflossene Halle, ein Berg aus Gold und ein Drache, der uns einen Auftrag gibt." }
        ]
      }
    ]
  },

  /* ---------- DAS BESTIARIUM ----------
     status: "besiegt", "gesichtet", "geruecht" (nur davon gehört) oder "gefallen" (tot, aber nicht durch uns)
     bild ist optional. Beispiel:
     { name: "Goblin", bild: "goblin.jpg", status: "besiegt", ort: "Die Straße", text: "Klein und gemein." } */
  bestiarium: [
    { name: "Bugbear", bild: "bugbear.jpg", status: "besiegt", ort: "Der Wachturm", text: "Ein riesiger, behaarter Goblinkrieger mit gelblichem Fell und langen, scharfen Krallen. Bewachte im Wachturm die Gefangenen, schlug Echo eine tiefe Wunde und fiel schließlich durch Friedrichs Schwert und Ezekiels Dolche." },
    { name: "Venomfang", bild: "venomfang.jpg", status: "besiegt", ort: "Der Wachturm von Donnerbaum", text: "Eine Art junger grüner Giftdrachen. Dieser hier hatte sich im verfallenen Wachturm eingenistet. Sein Giftatem setzte der Gruppe übel zu, bis Barradins Hypnose den entscheidenden Vorteil brachte." },
    { name: "Blight", bild: "blight.jpg", status: "besiegt", ort: "Das verlassene Dorf Donnerbaum", text: "Kleine, verästelte Wesen aus Wurzeln und verwachsenem Holz mit rubinroten Augen. Flinker als gedacht und gern im Hinterhalt, doch Echos Feuerball verwandelte die letzten von ihnen in Asche." },
    { name: "Chasme", bild: "chasme.jpg", status: "besiegt", ort: "Das Gefängnis im Unterreich", text: "Ein riesiger, wespenähnlicher Dämon mit langem Saugstachel und ohrenbetäubendem Summen. Streckte Friedrich mit einem einzigen Stich nieder, bis Ezekiel ihr seinen Dolch ins Auge rammte." },
    { name: "Vrock", bild: "vrock.jpg", status: "besiegt", ort: "Das Gefängnis im Unterreich", text: "Ein geierartiger Dämon mit zerzausten Schwingen. Wütete im Hof von Ilvaras Festung unter den Wachen, bis Echo ihm mit einem gleißenden Blitz die letzte Lebenskraft ausbrannte." },
    { name: "Kuo-Toa-Kultisten", bild: "kuo-toa.jpg", status: "gefallen", ort: "Die Stadt am unterirdischen See", text: "Nicht alle Kuo-Toa waren unsere Feinde – Erzpriester Ploopploopeen und seine Getreuen standen auf unserer Seite. Gegen uns kämpften die Anhänger der falschen Erzpriesterin, die Demogorgon als Gott verehrten. Im Stadtzentrum gingen sie auf ihr eigenes Volk und auf die Gefährten los. Als ihr Dämonengott dann wirklich kam, riss er die ganze Stadt mit sich – Freund wie Feind." },
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
      { id: "drachenei", bild: "skizze-themberchaud.webp", zeichnung: true, format: "4/3", pos: "70% 30%", x: 18, y: 55, b: 15, dreh: -3,
        kurz: "Das Drachenei<small>Drokey? Graue Geister?</small>",
        label: "Auftrag", titel: "Wer stahl Themberchauds Ei?",
        text: "Themberchaud, der Meister der Flammen, hat uns beauftragt: Jemand hat ein Drachenei gestohlen. Sein Hohepriester Gartokkar verdächtigt einen gewissen Drokey von den Grauen Geistern, einer Diebesgilde aus den Slums. Der Drache wiederum traut Gartokkar nicht.",
        hinweise: ["Unser Abzeichen: eine faustgroße Goldmünze mit Drachenkopf.", "Der Hinweis auf Drokey kam angeblich anonym.", "Kardal wollte uns gerade von den Ärmsten in den Slums erzählen …"],
        kapitel: "II", abschnitt: "Das gestohlene Ei" },
    ],
    /* schnur: false = kein roter Faden, steht aber im Detailtext unter „Zusammenhänge“ (die Zettel hängen dann nebeneinander). */
    faeden: [
      { von: "nezna", nach: "spinne", a1: [0.03, 0.144], a2: [0.488, 0.034], grund: "sprach ebenfalls von der Spinne." },
      { von: "ilvara", nach: "spinne", a1: [0.856, 0.061], a2: [0.06, 0.432], grund: "rief bei ihrer Flucht: „Die Spinne wird euch alle kriegen!“" },
      { von: "gracklstugh", nach: "riese", farbe: "gelb", grund: "der Angriff geschah mitten in der Stadt." },
      { von: "spinne", nach: "glasstab", schnur: false, grund: "diente der Spinne und sprach mit seinem letzten Atemzug von ihr." },
      { von: "kardal", nach: "demogorgon", schnur: false, grund: "Kardal war mitten im Chaos, als Demogorgon kam." },
      { von: "nezna", nach: "ilvara", schnur: false, grund: "beide Drow, beide Gestaltwandlerinnen. Zufall?" },
      { von: "glasstab", nach: "nezna", schnur: false, grund: "beide sprachen von der Spinne." },
      { von: "kardal", nach: "gracklstugh", schnur: false, grund: "Kardal ist der Sohn des Königs von Gracklstugh." },
      { von: "ilvara", nach: "demogorgon", schnur: false, grund: "beim Ausbruch aus ihrem Kerker tauchten wie aus dem Nichts Dämonen auf." },
      { von: "drachenei", nach: "gracklstugh", farbe: "gelb", grund: "das Ei verschwand mitten in der Stadt – die Grauen Geister hausen in ihren Slums." },
      { von: "drachenei", nach: "riese", schnur: false, grund: "„Etwas Böses, Unersättliches regt sich“, sagt der Steinsprecher. Hängt das zusammen?" }
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
    { gruppe: "Die Oberwelt", name: "Zilda", status: "verbuendet", rolle: "Söldnerin in Gundrens Diensten", text: "Saß zusammen mit Nundro im Wachturm gefesselt, wo beide tagelang über Gundren und die Allianz der Lords ausgefragt wurden. Bis wir die Tür aufstießen." },
    { gruppe: "Die Oberwelt", name: "Captain Dolgrimson", status: "verbuendet", rolle: "Leiter der Allianz der Lords, Neverwinter", text: "Hat uns erst vertröstet, dann in die Allianz aufgenommen und prompt nach Donnerbaum geschickt." },
    { gruppe: "Die Oberwelt", name: "Der Bürgermeister von Phandalin", status: "neutral", rolle: "Phandalin", text: "Hat am Ende bezahlt. Uns wiedersehen will er vermutlich trotzdem nicht." },
    { gruppe: "Die Oberwelt", name: "Glasstab", status: "tot", rolle: "Anführer der Roten Roben", text: "Hielt Phandalin in Angst und diente der Spinne. Fiel durch Friedrichs Pfeil, nachdem Barradin ihn aus dem Geheimgang zurückgezerrt hatte." },
    { gruppe: "Die Oberwelt", name: "Nezna", status: "tot", rolle: "Drow und Gestaltwandlerin", text: "Kämpfte im Wachturm erbittert gegen uns, sprach von der Spinne und entkam als kleines Tier. In der Mine der magischen Schmiede stellten wir sie erneut, und diesmal fiel sie." },
    { gruppe: "Das Unterreich", name: "Ilvara Mizzrym", bild: "ilvara-wahr.webp", bildPos: "50% 8%", status: "feindlich", rolle: "Drow und Gestaltwandlerin", text: "Gab sich in Donnerbaum als freundliche Druidin aus, betäubte uns mit einem Kräuternebel und verschleppte uns ins Unterreich. Entkam mit einem Sprung in den Fluss." },
    { gruppe: "Das Unterreich", name: "Fagas", status: "tot", rolle: "Gnom, aus einem Spinnenkokon gerettet", text: "Suchte im Auftrag Arafils vom Roten Sitz das Grab der Magierin Khaem und begleitete uns danach. Er starb im Grab der Magierin durch einen Wraith. Seine letzten Worte führten uns zu Dawnbringer." },
    { gruppe: "Das Unterreich", name: "Ploopploopeen", bild: "ploopploopeen.jpg", bildPos: "50% 25%", status: "tot", rolle: "Erzpriester der Kuo-Toa", text: "Ein Freund der Gruppe, wenn auch nur für kurze Zeit. Er vertraute uns, schmuggelte uns zum Schein gefesselt in seine Stadt und stand bis zuletzt auf den Stufen seines Tempels, als Demogorgon sie zerstörte. Barradin hat ihn liebevoll Blublupin genannt – und schuldet ihm noch ein Lied." },
    { gruppe: "Das Unterreich", name: "Kardal", status: "verbuendet", rolle: "Zwerg, Sohn des Königs von Gracklstugh", text: "Gefesselt bei den Kuo-Toa gefunden, gab sich als Späher aus und floh mit uns über den See. In Gracklstugh kam heraus, dass er der Sohn des Königs ist." },
    { gruppe: "Das Unterreich", name: "König Horga Stahl V.", bild: "portrait-koenig.jpg", bildPos: "50% 50%", status: "neutral", rolle: "König von Gracklstugh, Kardals Vater", text: "Hörte sich Barradins Gesang über Demogorgon und die Rettung seines Sohnes an und gewährte uns, in der Stadt zu verweilen." },
    { gruppe: "Das Unterreich", name: "Der rasende Riese", bild: "portrait-riese.jpg", bildPos: "50% 50%", status: "unklar", rolle: "Riese in Gracklstugh", text: "Griff uns mitten in der Stadt an, bis wir ihn betäuben und fesseln konnten. Ein anderer Riese meint, Stimmen in seinem Kopf hätten ihn dazu getrieben." },
    { gruppe: "Das Unterreich", name: "Hgraam", status: "neutral", rolle: "Steinsprecher der Riesen", text: "Empfing uns im Dorf der Riesen und sprach in Rätseln von etwas Bösem, Unersättlichem, das sich regt. Selbst ein illusionierter Demogorgon ließ ihn kalt. Zum Dank für den friedlich gestoppten Riesen schenkte er uns einen Steinsprecher-Kristall." },
    { gruppe: "Das Unterreich", name: "Themberchaud", bild: "themberchaud.webp", bildPos: "50% 25%", status: "neutral", rolle: "Drache, der Meister der Flammen", text: "Thront in einer lavaumflossenen Halle auf einem Berg aus Gold. Barradins gereimte Heldenballade (eine natürliche 20) stimmte ihn gnädig. Er misstraut seinem eigenen Hohepriester – und jemand hat ihm ein Drachenei gestohlen." },
    { gruppe: "Das Unterreich", name: "Gartokkar", status: "unklar", rolle: "Hohepriester der Bewahrer der Flamme", text: "Höchster der Rotroben und erster Diener Themberchauds. Schickt uns auf die Suche nach dem gestohlenen Drachenei und gab uns eine faustgroße Goldmünze als Abzeichen. Sein Meister traut ihm allerdings nicht über den Weg." },
    { gruppe: "Das Unterreich", name: "Drokey", status: "unklar", rolle: "Angeblich einer der Grauen Geister", text: "Einem geheimen Hinweis zufolge soll er das Drachenei gestohlen haben. Die Grauen Geister sind eine Diebesgilde aus den Slums von Gracklstugh. Gesehen haben wir ihn noch nicht." }
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
    { bild: "skizze-laute.webp", titel: "Barradins Laute", text: "Die wichtigste Waffe der Gruppe." },
    { bild: "skizze-themberchaud.webp", titel: "Themberchaud", text: "Aus sicherer Entfernung gezeichnet. Also aus dem Gedächtnis." }
  ]
};
