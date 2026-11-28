/* =====================================================================
   TALES NEVER END – Kartenpaket 12: Spielorte und Nebengeschichten
   ---------------------------------------------------------------------
   Wo ihr spielt, spielt mit: die Nachbarin unter dem Wohnzimmer, der
   Mitbewohner am Kühlschrank, die verschlossene Kellertür, der kleine
   Spieleladen, der Stammtisch nebenan, verschwundene Gartenzwerge –
   und Ausflüge in eine Hütte, auf eine Burg, eine Convention, in den
   Zug, ins Zeltlager und ans Bootshaus am See.
   Bedingungen: bei:ort · kap:ort=N (Fortschritt der Nebengeschichte,
   bleibt über alle Runden erhalten) · nsfrei (höchstens eine Kapitel-
   karte je Session, auf Ausflügen zwei) · wetter: · jz: · nacht · tag
   Wirkungen: kap=ort:N · umzug=ort|heim|treff · ausflug=ort|zufall ·
   wirt=ich · +stromweg (keine Spielleiter-Box mehr)
   Sprecher „ort“ mit name:… und rolle:… (Unterstrich = Leerzeichen),
   Sprecher „wirt“ = wer euch gerade bei sich zuhause spielen lässt.
   ===================================================================== */
(window.TNE_KARTEN = window.TNE_KARTEN || []).push(String.raw`

§ #nb_broesel1 tisch g:4 wenn:bei:wohnzimmer,kap:wohnzimmer=0,nsfrei
Mitten in der Verfolgungsjagd: // Tock. Tock. Tock. Jemand klopft von unten mit einem Besenstiel gegen die Decke. {wirt} flüstert: „Frau Brösel.“
< Ab jetzt leiser spielen | s-3 l+3 t-2 kap=wohnzimmer:1 | Ihr flüstert weiter. Die Verfolgungsjagd wird zur Schleichmission. // Erstaunlich spannend, eigentlich.
> Einmal zurückklopfen | s+4 l-2 kap=wohnzimmer:1 | {name} klopft dreimal auf den Boden. // Von unten kommen zwei Klopfer zurück. Niemand weiß, was das bedeutet.

§ #nb_broesel2 ort name:Frau_Brösel rolle:Nachbarin_von_unten g:4 wenn:bei:wohnzimmer,kap:wohnzimmer=1,nsfrei
Es klingelt. Frau Brösel steht im Bademantel vor der Tür, mit Lockenwicklern. „Wer ist Grimbold, und warum schreit er seit einer Stunde ‚Für die Ehre‘?“
< Erklären, was ihr spielt | l+4 t-4 alle+2 kap=wohnzimmer:2 | Du erklärst Pen & Paper, Würfel und Heldinnen. Frau Brösel hört genau zu. // „Und der Drache – ist der echt?“
> „Wir schauen nur einen Film.“ | s+3 laune-2 kap=wohnzimmer:2 | „Ein sehr lauter Film“, sagt Frau Brösel. // Sie schaut misstrauisch auf den W20 in deiner Hand.

§ #nb_broesel3 ort name:Frau_Brösel rolle:Nachbarin_von_unten g:4 wenn:bei:wohnzimmer,kap:wohnzimmer=2,nsfrei
Frau Brösel steht wieder vor der Tür. Diesmal mit einem Blech Bienenstich. „Ein Beschwerdekuchen.“ // „Und? Hat der Zwerg den Troll erwischt? Ich konnte nicht schlafen.“
< Hereinbitten | s+6 t-4 alle+4 kap=wohnzimmer:3 | Frau Brösel setzt sich in den Sessel, schaut eine Stunde zu und lacht an genau den richtigen Stellen. | herzen
> Kuchen nehmen, Tür zu | t+3 s+2 laune-2 kap=wohnzimmer:3 | Der Kuchen ist hervorragend. // Von unten hört man später ein enttäuschtes Seufzen.

§ #nb_broesel4 tisch g:4 wenn:bei:wohnzimmer,kap:wohnzimmer=3,nsfrei
Frau Brösel hört offenbar durch die Decke mit. Bei jedem wichtigen Wurf klopft sie: einmal heißt „gut gemacht“, zweimal „oh nein“. // {name} würfelt gerade für {held}.
< Ihr Klopfen zählt als Orakel | W10 s+5 l-2 ? m+4 : laune-3 kap=wohnzimmer:4 | Tock. Einmal! Der Wurf gelingt, der Tisch jubelt Richtung Fußboden. :: Tock. Tock. // {name} schaut vorwurfsvoll auf den Teppich. | wuerfelregen
> Ihr einen Zettel schreiben | l+3 t-2 kap=wohnzimmer:4 | Ihr schiebt einen Zettel unter ihre Tür: „Danke fürs Mitfiebern!“ // Am nächsten Tag liegt eine Antwort im Briefkasten. Mit Herz.

§ #nb_broesel5 ort name:Frau_Brösel rolle:Nachbarin_von_unten g:4 wenn:bei:wohnzimmer,kap:wohnzimmer=4,nsfrei
Frau Brösel bringt ein vergilbtes Heft mit. „1979, im Studentenwohnheim. Elfen und Kerker.“ // „Ich war Brunhilde die Unbeugsame. Zauberin. Stufe neun.“
< „Wollen Sie mal wieder?“ | s+6 alle+4 t-3 kap=wohnzimmer:5 | Frau Brösels Augen funkeln. „Nur wenn Brunhilde ihren Stab zurückbekommt.“ | funkeln
> Ehrfürchtig blättern | l+5 s+2 kap=wohnzimmer:5 | Das Heft ist voller Karten, Notizen und einem Drachen, der „Herbert“ heißt. // Herbert taucht ab jetzt in deiner Welt auf.

§ #nb_broesel6 ort name:Frau_Brösel rolle:Nachbarin_von_unten g:5 wenn:bei:wohnzimmer,kap:wohnzimmer=5,nsfrei
Heute spielt Frau Brösel mit. Brunhilde die Unbeugsame erscheint in einem Wirbel aus Lockenwicklern genau in dem Moment, in dem {held} fällt.
< Brunhilde rettet den Tag | m+6 s+8 alle+5 kap=wohnzimmer:6 | „Unbeugsam!“, ruft Frau Brösel und würfelt eine 20. Der ganze Tisch steht. // Sie kommt jetzt jeden Donnerstag. Mit Bienenstich. | konfetti
> Brunhilde lässt den Helden glänzen | s+6 laune+12 l+3 kap=wohnzimmer:6 | Brunhilde reicht {held} ihren Stab. „Jetzt du, Kindchen.“ // {name} hat Tränen in den Augen. | herzen

§ #nb_jannik1 ort name:Jannik rolle:Mitbewohner g:4 wenn:bei:wgkueche,kap:wgkueche=0,nsfrei
Mitbewohner Jannik schlurft in die Küche, holt sich ein Joghurt aus dem Kühlschrank und bleibt hinter {name} stehen. „Habt ihr den Kobold schon gekillt?“
< „Setz dich doch dazu!“ | s+3 kap=wgkueche:1 | „Nee, ich hab noch was vor.“ Er bleibt aber zwanzig Minuten an der Spüle stehen. // Beim Kampf murmelt er: „Feuerball wär jetzt gut.“
> „Psst, wir spielen.“ | l+2 t+2 kap=wgkueche:1 | Jannik hebt entschuldigend die Hände und geht. // Nach fünf Minuten kommt er zurück. Er hat den Löffel vergessen.

§ #nb_jannik2 tisch g:4 wenn:bei:wgkueche,kap:wgkueche=1,nsfrei
Im Kühlschrank steht ganz hinten ein Joghurt mit dem Zettel „NICHT ANFASSEN – J.“ // Das Haltbarkeitsdatum ist vom letzten Frühling. Der Deckel wölbt sich.
< Das Joghurt wird zum Schurken | s+6 l-3 kap=wgkueche:2 | {schurke} hat ab heute einen Handlanger: den Joghurt des Grauens. // {name} zeichnet ihm ein Gesicht auf den Deckel. | lachen
> Zettel dazukleben: „Jannik, bitte!“ | l+3 kap=wgkueche:2 | Am nächsten Tag steht unter eurem Zettel: „Er lebt. Ich kann ihn nicht wegwerfen.“

§ #nb_jannik3 ort name:Jannik rolle:Mitbewohner g:4 wenn:bei:wgkueche,kap:wgkueche=2,nsfrei
{name} findet auf dem Küchentisch einen Charakterbogen. Bleistift, viel Radiergummi, Name: „Jannikus der Joghurtmagier“. // Jannik steht in der Tür und wird sehr rot.
< „Du spielst ab sofort mit!“ | s+6 alle+3 t-3 kap=wgkueche:3 | „Nur heute“, sagt Jannik. Er hat sich schon einen Stuhl genommen. | herzen
> So tun, als hättest du nichts gesehen | l+2 kap=wgkueche:3 | Du legst den Bogen vorsichtig zurück. // Später ist er weg. Und auf dem Kühlschrank klebt ein Zettel: „Wann ist nächster Donnerstag?“

§ #nb_jannik4 tisch g:4 wenn:bei:wgkueche,kap:wgkueche=3,nsfrei
WG-Versammlung, ausgerechnet am Spielabend: Der Putzplan wurde seit sechs Wochen ignoriert. Mitbewohnerin Fee verlangt, dass jemand „jetzt sofort“ die Küche putzt.
< Alle putzen gemeinsam | t-8 s+4 alle+3 l+3 kap=wgkueche:4 | Ihr macht ein Abenteuer daraus: Die Spüle ist ein Sumpf, das Backblech ein Drache. // Nach einer Stunde glänzt alles. Fee ist sprachlos.
> Würfeln, wer putzt | W11 s+5 ? t+3 : laune-6 kap=wgkueche:4 | {anderer} würfelt eine 1 und putzt. Der Rest spielt weiter. :: {name} würfelt die 1. // {Er} putzt mit einem Ernst, als ginge es um ein Ritual. | wuerfelregen

§ #nb_jannik5 ort name:Jannik rolle:Mitbewohner g:4 wenn:bei:wgkueche,kap:wgkueche=4,nsfrei
Jannikus der Joghurtmagier hat genau einen Zauber: Er kann Milchprodukte sprechen lassen. // Jannik will ihn jetzt einsetzen. Gegen {schurke}.
< „Probier's!“ | W10 s+7 l-4 ? m+6 : s+3 kap=wgkueche:5 | Die Käseplatte des Schurken verrät alle seine Pläne. Der Tisch rastet aus. :: Das Milchkännchen sagt nur „Muh“. // Trotzdem ein riesiger Lacher. | lachen
> „Das ist nicht in den Regeln.“ | l+5 laune-4 kap=wgkueche:5 | Jannik schlägt im Regelbuch nach. // Er findet eine Fußnote, die ihm recht gibt. Zumindest liest er sie so.

§ #nb_jannik6 tisch g:5 wenn:bei:wgkueche,kap:wgkueche=5,nsfrei
Feierlicher Moment: Jannik trägt das Joghurt des Grauens zum Mülleimer. Alle stehen. Jemand summt eine Trauermelodie.
< Ein Abschiedslied | s+8 alle+5 t-3 kap=wgkueche:6 | {name} singt eine Ballade über „Den Joghurt, der zu lange blieb“. // Jannik weint ein bisschen. Vor Lachen, sagt er. | musik
> Das Joghurt bekommt einen Ehrenplatz im Spiel | s+5 l-3 kap=wgkueche:6 | Das Joghurt wird zum Schutzgeist der Taverne. // Jannikus der Joghurtmagier ist jetzt fester Teil der Runde. | magie

§ #nb_keller1 tisch g:4 wenn:bei:keller,kap:keller=0,nsfrei
Ein Geräusch hinter der verschlossenen Tür am Ende des Kellergangs. Ein Schaben. Dann Stille. // {wirt} sagt: „Ach, die Tür. Die war schon immer zu.“
< „Wir hören nach.“ | t-3 s+3 l+3 kap=keller:1 | Ihr drückt alle das Ohr an die Tür. Nichts. // Dann ein leises Klacken, als würde jemand einen Würfel ablegen.
> Weiterspielen, nicht drüber nachdenken | t+3 kap=keller:1 | Ihr spielt weiter. // Aber jedes Mal, wenn es still wird, schaut jemand zur Tür.

§ #nb_keller2 ort name:Herr_Kalkbrenner rolle:Hausmeister g:4 wenn:bei:keller,kap:keller=1,nsfrei
Hausmeister Herr Kalkbrenner kommt die Treppe herunter, um den Zähler abzulesen. Zur Tür sagt er nur: „Gerümpel vom Vormieter. Gerd hieß der. Komischer Kauz. Hat immer gewürfelt.“
< Nach Gerd fragen | l+5 t-3 kap=keller:2 | „Gerd? Hat hier unten gespielt, Achtziger, Neunziger. Hat einen Karton dagelassen.“ // Er zwinkert. „Schlüssel hab ich nicht.“
> Nach dem Schlüssel fragen | s+3 kap=keller:2 | „Schlüssel?“ Herr Kalkbrenner lacht. „Der liegt seit 1994 irgendwo in diesem Keller.“

§ #nb_keller3 tisch g:4 wenn:bei:keller,kap:keller=2,nsfrei
In einer alten Blechdose mit Schrauben findet {name} einen kleinen, rostigen Schlüssel. Am Schlüsselring hängt ein W6 aus Holz.
< Jetzt sofort aufschließen | t-4 s+5 l+3 kap=keller:3 | Das Schloss knirscht. Die Tür geht auf. // Dahinter: ein Regal, ein Klapptisch, ein Karton. Und eine Staubschicht, so dick wie ein Regelbuch. | staub:o_kellertuer
> Bis nach dem Spiel warten | s+2 l+2 kap=keller:3 | Ihr legt den Schlüssel in die Mitte des Tisches. // Den ganzen Abend schaut jeder immer wieder hin.

§ #nb_keller4 tisch g:4 wenn:bei:keller,kap:keller=3,nsfrei
Im Karton: Bleistiftkarten, drei Hefte und ein Deckblatt in Schönschrift: „Die Chroniken von Kellerstein – Kampagne seit 1987. Spielleiter: Gerd.“
< Daraus vorlesen | l+6 s+4 t-5 kap=keller:4 | Gerds Welt hat einen Zwergenkönig, der Gartenzwerge sammelt, und eine Brücke, über die nur Ehrliche gehen dürfen. // Die Runde ist ganz still.
> Eine Stadt daraus klauen | s+4 l+2 kap=keller:4 | „Kellerstein“ liegt ab heute in deiner Welt. // {name} fragt, ob Gerd das erlaubt hätte. Gute Frage.

§ #nb_keller5 tisch g:4 wenn:bei:keller,kap:keller=4,nsfrei
In einem der Hefte steht unter der letzten Session: „Fortsetzung folgt. Nächster Donnerstag.“ // Datum: 14. März 1994. Danach kommt nichts mehr.
< Gerd suchen | l+4 t-3 alle+3 kap=keller:5 | Die Hausverwaltung hat eine alte Adresse. {wirt} schreibt einen Brief, mit Bleistift, wie Gerd. | papier
> Die Kampagne selbst fortsetzen | s+5 l-2 kap=keller:5 | Heute endet „Kellerstein“ nicht mehr auf Seite 47. // Deine Runde spielt Gerds letzte Szene einfach weiter.

§ #nb_keller6 ort name:Gerd rolle:Spielleiter_von_1987 g:4 wenn:bei:keller,kap:keller=5,nsfrei
Es klingelt. Ein alter Mann mit weißem Bart steht vor der Tür, eine Ledertasche unterm Arm. „Ich bin Gerd. Ich hab euren Brief bekommen.“ // „Da unten liegen noch meine Würfel.“
< Gerd an den Tisch bitten | s+7 l+4 alle+5 kap=keller:6 | Gerd setzt sich, schaut lange auf den Klapptisch hinter der Tür und sagt leise: „Genau hier.“
> Gerd hinter den Schirm lassen | l+6 s+5 t-4 kap=keller:6 | Für eine Szene leitet Gerd. Er beschreibt eine Brücke über einen Abgrund. // Die Runde vergisst, Luft zu holen.

§ #nb_keller7 ort name:Gerd rolle:Spielleiter_von_1987 g:5 wenn:bei:keller,kap:keller=6,nsfrei
Gerd packt zum Abschied einen Lederbeutel aus. Darin: sieben alte Würfel, abgegriffen, die Zahlen fast weg. „Die haben schon viel gesehen. Jetzt seid ihr dran.“
< Würfel annehmen | s+6 l+4 alle+6 kap=keller:7 | Du rollst einen davon. Eine 20. Gerd lacht. „Die mögen dich.“ // Die Tür hinter dem Heizungsraum bleibt ab jetzt offen. | funkeln
> „Bitte kommen Sie wieder.“ | s+5 alle+5 kap=keller:7 | „Donnerstags?“, fragt Gerd. „Donnerstags“, sagt die ganze Runde gleichzeitig. | herzen

§ #nb_taube1 tisch g:4 wenn:bei:dachboden,kap:dachboden=0,nsfrei
Tock. Auf dem Dachfenster über dem Tisch sitzt eine Taube und klopft mit dem Schnabel gegen die Scheibe. Genau bei der Enthüllung des Schurken. // Sie schaut auf den Spielleiterschirm.
< Die Taube bekommt einen Namen | s+4 kap=dachboden:1 | Sie heißt ab jetzt „Herr Grau“. // {name} schwört, dass sie genickt hat.
> Fenster abklopfen | l+2 t+2 kap=dachboden:1 | Die Taube fliegt auf. // Fünf Minuten später sitzt sie wieder da. Mit einer Freundin.

§ #nb_taube2 tisch g:4 wenn:bei:dachboden,kap:dachboden=1,nsfrei
Herr Grau ist wieder da. Er klopft jetzt immer dann, wenn jemand eine 1 würfelt. // Es klappt bei jedem Wurf. Niemand weiß, wie.
< Herr Grau wird Schicksalsbote | s+5 l-3 kap=dachboden:2 | Ab sofort heißt eine 1 am Tisch nur noch „ein Grau“. // „Ich hab ein Grau gewürfelt“, seufzt {name}.
> Die Gardine zuziehen | l+3 laune-2 kap=dachboden:2 | Hinter der Gardine klopft es trotzdem. // Exakt bei der nächsten 1.

§ #nb_taube3 tisch g:4 wenn:bei:dachboden,kap:dachboden=2,nsfrei
Das Dachfenster war gekippt. Ein W20 lag zu nah am Rand. // Herr Grau hat ihn. Er sitzt auf dem Nachbardach, den Würfel im Schnabel.
< Rettungsmission! | W12 s+6 t-4 ? m+3 : laune-4 kap=dachboden:3 | {name} klettert halb aus dem Fenster und lockt mit Chips. Herr Grau lässt den Würfel fallen – direkt in die Regenrinne. Gerettet! :: Herr Grau fliegt davon. Mit dem Würfel. Mit dem guten Würfel.
> „Lass ihn. Es ist sein Würfel jetzt.“ | s+3 l-2 kap=dachboden:3 | Ein Würfel weniger. Eine Legende mehr. // {name} hält eine kurze Rede.

§ #nb_taube4 tisch g:4 wenn:bei:dachboden,kap:dachboden=3,nsfrei
Im Frühling entdeckt {wirt} auf dem Nachbardach ein Nest. Mittendrin, glänzend: der W20. Herr Grau sitzt darauf, als würde er ihn ausbrüten.
< Ein Kapitel darüber schreiben | s+5 l+2 kap=dachboden:4 | In deiner Welt gibt es ab jetzt Würfeltauben, die Glück brüten. // Die Spieler wollen sofort eine zähmen.
> Fotos machen, Gruppenchat | s+4 t+2 kap=dachboden:4 | Das Foto bekommt 47 Herzchen. // Jemand macht einen Sticker daraus.

§ #nb_taube5 tisch g:5 wenn:bei:dachboden,kap:dachboden=4,nsfrei
Herr Grau ist wieder am Fenster. Neben ihm sitzen zwei kleine, zerzauste Tauben. // Die eine hat genau sechs graue Punkte auf dem Rücken.
< Die Jungen taufen | s+7 alle+5 kap=dachboden:5 | Sie heißen Kritisch und Fehlschlag. // Ab jetzt hat der Dachboden die besten Glücksbringer der Stadt. | federn
> Ein Krümelbuffet aufs Dach | s+5 alle+4 l-2 kap=dachboden:5 | Herr Grau nimmt die Chips gnädig an. // Bei der nächsten 1 klopft niemand. Ein Friedensvertrag. | federn

§ #nb_laden1 ort name:Herr_Brettschneider rolle:Spieleladen_„Würfelturm“ g:4 wenn:bei:laden,kap:laden=0,nsfrei
Herr Brettschneider bringt euch Kaffee nach hinten und bleibt ungewöhnlich lange stehen. „Das Geschäft läuft … na ja. Die Leute bestellen alles im Internet.“ // Er schaut auf die Regale.
< „Wir kaufen heute was!“ | s+3 alle+2 kap=laden:1 | Ihr kauft drei Würfelsets, ein Abenteuer und einen Beutel in Drachenform. // Herr Brettschneider strahlt den ganzen Abend.
> Zuhören | l+4 t-3 kap=laden:1 | Er erzählt von 32 Jahren Würfelturm. Von Kindern, die heute selbst Spielleiter sind. // Dann geht er nach vorne und dreht das Schild auf „Geschlossen“.

§ #nb_laden2 tisch g:4 wenn:bei:laden,kap:laden=1,nsfrei
An der Ladentür hängt ein Zettel: „Mieterhöhung zum Quartal. Wir überlegen.“ // Darunter hat jemand mit Kuli geschrieben: „Bitte nicht!!“
< Einen Plan schmieden | l+4 s+3 t-3 kap=laden:2 | Ihr legt das Abenteuer kurz zur Seite und sammelt Ideen auf einem Charakterbogen. // Ganz oben steht: „Offener Spieltisch“.
> Erst mal weiterspielen | t+3 s-2 kap=laden:2 | Ihr spielt weiter. // Aber {name} schaut immer wieder zur Tür mit dem Zettel.

§ #nb_laden3 tisch g:4 wenn:bei:laden,kap:laden=2,nsfrei
Ihr ladet zu einem „Offenen Spieltisch“ in den Würfelturm ein: Jeder darf mal mitspielen. // Es kommen zwei Studentinnen, ein Rentner und ein Vater mit drei Kindern.
< Kinder-Abenteuer leiten | s+7 t-5 alle+4 kap=laden:3 | Die Kinder besiegen einen Drachen mit Freundschaft und einer Pfanne. // Der Vater kauft danach das Einsteigerset. | konfetti
> Alle an einen Tisch | s+4 t+3 l-2 kap=laden:3 | Neun Leute, ein Abenteuer, absolutes Chaos. // Herr Brettschneider verkauft an diesem Abend mehr als im ganzen Monat. | konfetti

§ #nb_laden4 ort name:Herr_Brettschneider rolle:Spieleladen_„Würfelturm“ g:4 wenn:bei:laden,kap:laden=3,nsfrei
Herr Brettschneider hält die Lokalzeitung hoch: „Der Würfelturm lebt – offene Spielabende in der Altstadt.“ Auf dem Foto: eure Runde, alle mit Pizzamund.
< Das Foto einrahmen | s+5 alle+3 kap=laden:4 | Es hängt jetzt neben dem Plakat von 1996. // {name} zeigt es jedem Kunden. Auch denen, die nur Batterien kaufen.
> „Wir machen das jeden Monat!“ | l+3 t-3 alle+4 kap=laden:4 | Ab jetzt ist jeder erste Samstag im Monat Offener Spieltisch. // Ihr seid offiziell eine Institution.

§ #nb_laden5 tisch g:4 wenn:bei:laden,kap:laden=4,nsfrei
Die Vermieterin kommt persönlich vorbei. Sie schaut sich um, sieht euren Tisch, sieht die Würfel. // „Mein Sohn hat früher hier gespielt“, sagt sie. „Jeden Freitag.“
< Sie zum Mitspielen einladen | W10 s+6 l+2 ? alle+5 : s+2 kap=laden:5 | Sie spielt eine halbe Stunde lang eine Händlerin, die sehr hart verhandelt. Sehr hart. // Beim Gehen lächelt sie. :: Sie lehnt freundlich ab, bleibt aber zehn Minuten stehen und schaut zu.
> Ihr von den Spielabenden erzählen | l+5 t-3 kap=laden:5 | Du erzählst vom Offenen Spieltisch und der Zeitung. // Sie macht sich Notizen.

§ #nb_laden6 ort name:Herr_Brettschneider rolle:Spieleladen_„Würfelturm“ g:4 wenn:bei:laden,kap:laden=5,nsfrei
Herr Brettschneider kommt mit einem Brief nach hinten und muss sich setzen. „Die Miete bleibt. Für fünf Jahre.“ // Er nimmt die Brille ab. „Wegen euch.“
< Eine Runde aufs Haus | s+7 alle+6 t-2 kap=laden:6 | Er holt eine Flasche aus der Kasse, die dort seit 1993 liegt. Sie schmeckt nach Staub und Freude. | konfetti
> Den Laden feiern – im Spiel | s+5 l+3 kap=laden:6 | Im Abenteuer gibt es ab heute den Würfelturm, einen magischen Laden, der jede Nacht ein bisschen größer wird.

§ #nb_laden7 ort name:Herr_Brettschneider rolle:Spieleladen_„Würfelturm“ g:5 wenn:bei:laden,kap:laden=6,nsfrei
Herr Brettschneider hat etwas aufgehängt: ein kleines Messingschild über eurem Tisch. „Stammtisch der Helden. Reserviert. Für immer.“
< Ein Foto mit Schild | s+6 alle+6 kap=laden:7 | Ihr stellt euch alle unter das Schild. Herr Brettschneider in der Mitte. // Er hält einen W20 hoch wie einen Pokal. | krone
> Würfel einweihen | s+5 m+3 kap=laden:7 | Jeder würfelt einmal auf den grünen Filz. // Lauter hohe Zahlen. Natürlich. | wuerfelregen

§ #nb_ewald1 ort name:Stammtisch-Ewald rolle:Stammtisch_nebenan g:4 wenn:bei:kneipe,kap:kneipe=0,nsfrei
Vom Stammtisch nebenan ruft Ewald herüber: „Na, Märchenstunde? Wer hat denn heute die Prinzessin gerettet?“ // Der ganze Stammtisch lacht.
< „Komm doch rüber!“ | s+3 kap=kneipe:1 | „Pff“, sagt Ewald. // Aber er dreht seinen Stuhl ein Stück in eure Richtung.
> Ignorieren | l+2 laune-2 kap=kneipe:1 | Ihr spielt weiter. // Ewald kommentiert trotzdem jeden lauten Jubel mit einem „Aha!“.

§ #nb_ewald2 tisch g:4 wenn:bei:kneipe,kap:kneipe=1,nsfrei
Lautstärke-Wettkampf: Nebenan läuft Fußball, bei jedem Tor brüllt der Stammtisch. // Bei jeder 20 brüllt ihr zurück.
< Lauter brüllen | s+6 l-3 t+3 kap=kneipe:2 | Bei der nächsten 20 springt ihr auf die Stühle. Doris lässt fast ein Tablett fallen. | konfetti
> Wirtin Doris schlichten lassen | l+4 t-2 kap=kneipe:2 | Doris stellt sich in die Tür. „Wer am lautesten ist, zahlt die nächste Runde.“ // Plötzlich ist es sehr still.

§ #nb_ewald3 ort name:Stammtisch-Ewald rolle:Stammtisch_nebenan g:4 wenn:bei:kneipe,kap:kneipe=2,nsfrei
Ewald steht plötzlich im Türrahmen. „Ich wollt nur mal gucken. Wo ist denn jetzt der Drache?“ // Er schaut sehr lange auf die Miniaturen.
< Ihm eine Mini geben | s+5 alle+3 kap=kneipe:3 | Ewald hält einen kleinen Zwerg in der Hand. „Der sieht aus wie mein Onkel.“ // Er stellt ihn nicht mehr ab.
> Ihm die Regeln erklären | l+5 t-4 kap=kneipe:3 | Ewald nickt bei jeder Regel. „Wie Skat“, sagt er. „Nur mit Drachen.“

§ #nb_ewald4 tisch g:4 wenn:bei:kneipe,kap:kneipe=3,nsfrei
Eine Wette: Wenn der Stammtisch beim Fußball gewinnt, spielt Ewald eine ganze Session mit. Wenn nicht, spielt ihr eine Runde Skat mit ihnen.
< Wette annehmen | W10 s+5 ? alle+4 : t-3 kap=kneipe:4 | Tor in der Nachspielzeit! Ewald muss mitspielen. Er tut so, als ärgere er sich. :: Ihr spielt Skat. {name} gewinnt. // Der Stammtisch ist schockiert.
> „Ewald darf einfach so mitspielen.“ | s+4 alle+3 l+2 kap=kneipe:4 | Ewald brummt. „Na gut. Aber nur, weil Doris guckt.“

§ #nb_ewald5 ort name:Stammtisch-Ewald rolle:„Ewald_Eisenbart“,_Zwergenkrieger g:4 wenn:bei:kneipe,kap:kneipe=4,nsfrei
Ewald spielt „Ewald Eisenbart“, einen Zwergenkrieger, der nur Skat-Begriffe benutzt. // „Ich reize den Oger auf achtzehn und spiel Grand mit Vieren!“
< Das zählt als Angriff | m+5 s+7 l-4 kap=kneipe:5 | Der Oger ist so verwirrt, dass er aufgibt. Ewald ist sehr zufrieden. | schwerter
> Ewald die Spielregeln zeigen | l+4 s+3 kap=kneipe:5 | Ewald lernt schnell. Bei der nächsten Probe würfelt er mit Gefühl. // „Wie beim Kartenmischen.“

§ #nb_ewald6 ort name:Doris rolle:Wirtin_„Zum_Krummen_Würfel“ g:5 wenn:bei:kneipe,kap:kneipe=5,nsfrei
Doris hat die Tische zusammengeschoben. Stammtisch und Spieltisch, alle an einer langen Tafel. // Über dem Tresen hängt ein riesiger Holzwürfel. „Der Krumme Würfel“, sagt sie. „Endlich hat die Kneipe ihren Namen verdient.“
< Gemeinsame Abenteuer-Nacht | s+8 alle+6 t-3 kap=kneipe:6 | Zwölf Leute, ein Abenteuer. Ewald Eisenbart und der Stammtisch verteidigen eine Brücke. // Der Fernseher bleibt aus. | konfetti
> Ein Prost auf den Würfel | s+6 alle+5 kap=kneipe:6 | Doris schenkt ein. Ewald hebt das Glas: „Auf die Prinzessin. Wer auch immer die gerettet hat.“ | konfetti

§ #nb_zwerg1 ort name:Herr_Kowalczyk rolle:Vorsitzender_des_Gartenvereins g:4 wenn:bei:laube,kap:laube=0,nsfrei
Herr Kowalczyk, Vorsitzender des Kleingartenvereins, steht am Zaun. „Bei Parzelle 12 ist ein Gartenzwerg verschwunden. Und bei 31. Sie spielen doch hier diese … Zauberspiele?“
< „Wir helfen bei der Suche!“ | l+4 s+3 t-3 kap=laube:1 | Herr Kowalczyk mustert euch. „Nun gut. Aber ich behalte Sie im Auge.“ | frage
> „Wir haben damit nichts zu tun.“ | l+2 laune-2 kap=laube:1 | „Das sagen sie alle“, sagt Herr Kowalczyk. // Er notiert sich etwas in ein kleines Heft.

§ #nb_zwerg2 tisch g:4 wenn:bei:laube,kap:laube=1,nsfrei
Inzwischen fehlen sieben Gartenzwerge im ganzen Verein. Am Zaun hängt ein Zettel: „Ruhezeit beachten – und Zwerge im Blick behalten!“ // {name} findet eine winzige Spur aus Erde, die zur Hecke führt.
< Detektiv spielen | s+5 t-4 l+3 kap=laube:2 | Mit Lupe und Taschenlampe folgt ihr der Spur. Sie endet an einem Loch im Zaun. Zu klein für einen Erwachsenen. | frage
> In die Kampagne einbauen | s+4 l-2 kap=laube:2 | Im Abenteuer verschwinden ab heute auch Statuen. // Die Spieler schauen sich nervös im Garten um.

§ #nb_zwerg3 tisch g:4 wenn:bei:laube,kap:laube=2,nsfrei
Beim Grillen hört ihr hinter der Hecke ein Flüstern: „Und jetzt greift die Zwergenarmee die Burg an!“ // Dann Stille. Dann ein Kichern.
< Leise nachschauen | t-3 s+5 kap=laube:3 | Durch die Hecke seht ihr zwölf Gartenzwerge in Schlachtordnung. Und einen Jungen mit einem Holzschwert. | ausruf
> Laut fragen: „Hallo?“ | s+3 t+2 kap=laube:3 | Es raschelt, jemand rennt weg. // Zurück bleibt ein Gartenzwerg mit einem Papierhelm.

§ #nb_zwerg4 ort name:Ludwig rolle:Nachbarsjunge_von_Parzelle_46 g:4 wenn:bei:laube,kap:laube=3,nsfrei
Der Junge heißt Ludwig, ist zehn und steht mit hängendem Kopf am Zaun. „Ich hab die nur ausgeliehen. Für meine Armee. Ihr spielt doch auch mit Figuren.“
< „Willst du mal mitspielen?“ | s+7 alle+4 t-3 kap=laube:4 | Ludwigs Augen werden riesig. Er rennt los und holt sein Holzschwert. | herzen
> „Die müssen zurück, Ludwig.“ | l+5 laune-3 kap=laube:4 | Ludwig nickt tapfer. „Aber der General darf bleiben, oder?“ // Der General hat einen Schnurrbart aus Moos.

§ #nb_zwerg5 tisch g:4 wenn:bei:laube,kap:laube=4,nsfrei
Ihr bringt die Zwerge zurück, nachts, mit Taschenlampen, Parzelle für Parzelle. Ludwig führt die Mission an. // Plötzlich geht bei Herrn Kowalczyk das Licht an.
< Stillstehen wie Gartenzwerge | W12 s+7 ? t+2 : s+3 laune-2 kap=laube:5 | Ihr erstarrt alle in Zwergenpose. Herr Kowalczyk schaut aus dem Fenster und geht wieder schlafen. Perfekt. :: Herr Kowalczyk kommt raus. „Was. Ist. Hier. Los.“ | nacht
> Alles erklären | l+5 t-2 kap=laube:5 | Herr Kowalczyk hört zu, schweigt lange und sagt dann: „Ludwig. Komm her.“ // Er klingt gar nicht wütend.

§ #nb_zwerg6 ort name:Herr_Kowalczyk rolle:Vorsitzender_des_Gartenvereins g:4 wenn:bei:laube,kap:laube=5,nsfrei
Herr Kowalczyk steht vor eurer Laube, mit einem Pappkarton. Darin: ein alter, abgeplatzter Gartenzwerg mit Laterne. „Den hatte ich als Junge. Er hieß Feldmarschall Knorr.“ // „Für Ludwigs Armee.“
< Feldmarschall Knorr ins Spiel holen | s+6 l+3 kap=laube:6 | Knorr wird Anführer der Zwergenwache in deiner Welt. Herr Kowalczyk bleibt zum Zuschauen. Bis nach der Ruhezeit. | krone
> Herrn Kowalczyk einladen | s+5 alle+4 kap=laube:6 | „Ich bin Vereinsvorsitzender“, sagt er. „Ich darf das gar nicht.“ // Er setzt sich trotzdem.

§ #nb_zwerg7 tisch g:5 wenn:bei:laube,kap:laube=6,nsfrei
Großes Sommerfest im Kleingartenverein. Programmpunkt drei: „Die Große Zwergenschlacht, geleitet von Parzelle 47“. // Zwanzig Kinder, vierzig Gartenzwerge, ein Spielleiter: du.
< Die Schlacht leiten | s+8 t-4 alle+6 kap=laube:7 | Ludwig ist General, Herr Kowalczyk der Drache. Am Ende gewinnen alle. Die Zwerge stehen wieder an ihren Plätzen. Fast alle. | konfetti
> Ludwig leiten lassen | s+6 l+3 alle+5 kap=laube:7 | Ludwig steht auf einer Bierbank und erzählt. Er ist erstaunlich gut. // „Hab ich von dir gelernt“, sagt er. | herzen

§ #nb_huette1 tisch g:4 wenn:bei:huette,kap:huette=0,nsfrei
Mitten in der spannendsten Szene: Das Licht flackert. Und geht aus. // Stromausfall. Nur noch der Kaminofen leuchtet. Die Spielleiter-Box ist stumm.
< Kerzen raus – weiterspielen | s+6 l+4 t-2 +stromweg kap=huette:1 | Ihr stellt Kerzen auf den Tisch. Die Geschichte wird plötzlich doppelt so gruselig. | kerze
> Taschenlampen unters Kinn | s+5 l-2 +stromweg kap=huette:1 | Jeder NSC hat jetzt ein grusliges Gesicht. Selbst der Bäcker. | dunkel

§ #nb_huette2 tisch g:4 wenn:bei:huette,kap:huette=1,nsfrei
Draußen knackt es. Dann ein Kratzen an der Hüttenwand. // Dann Schritte. Kleine, schnelle Schritte. Einmal ganz um die Hütte herum.
< „Ich schau nach.“ | W12 s+5 t-2 ? l+3 : laune-4 kap=huette:2 | Mit der Taschenlampe vor der Tür: zwei Augen, ganz tief am Boden. Dann ist es weg. :: {name} steht in Socken im Schnee, sieht nichts und hört hinter sich die Tür zufallen.
> Lauter spielen | s+3 t+3 kap=huette:2 | Ihr spielt lauter. // Das Kratzen auch.

§ #nb_huette3 ort name:Onkel_Arnulf rolle:Besitzer_der_Hütte_(Zettel_am_Kühlschrank) g:4 wenn:bei:huette,kap:huette=2,nsfrei
Am Kühlschrank hängt ein Zettel von Onkel Arnulf: „1. Ofen nie ausgehen lassen. 2. Chips nie draußen stehen lassen. 3. Hubert nicht füttern.“ // Wer ist Hubert?
< Die Chips reinholen | l+4 t-2 kap=huette:3 | Ihr holt die Chips von der Terrasse. Die Tüte ist schon angefressen. // Von unten.
> „Hubert ist bestimmt der Hund.“ | s+3 kap=huette:3 | Die Hütte hat keinen Hund. // Niemand sagt das laut.

§ #nb_huette4 tisch g:4 wenn:bei:huette,kap:huette=3,nsfrei
Nachts um zwei: Rascheln in der Küche. {name} weckt alle. Ihr schleicht mit Taschenlampen und Kochlöffeln hinunter, wie eine Abenteurergruppe. // Initiative würfeln!
< Gemeinsamer Angriff | W11 s+7 ? m+4 : s+4 kap=huette:4 | Ein Dachs. Ein dicker Dachs mit einer Chipstüte auf dem Kopf. Er schaut euch an, als hättet ihr gestört. :: Ihr stolpert übereinander. Der Dachs geht in Ruhe mit den Chips hinaus. | ausruf
> Langsam Licht an | l+4 s+5 kap=huette:4 | Im Licht sitzt ein Dachs auf dem Küchenboden und kaut. // Das ist Hubert. Natürlich ist das Hubert.

§ #nb_huette5 tisch g:5 wenn:bei:huette,kap:huette=4,nsfrei
Letzter Abend in der Hütte. Hubert sitzt vor dem Fenster und schaut auf euren Tisch, als würde er zuhören. // {name} schlägt vor, ihm eine Rolle im Spiel zu geben.
< Hubert wird ein Gott | s+7 l-2 alle+5 kap=huette:5 | Hubert, Gott der Snacks und Diebe, segnet ab heute jeden Wurf mit Krümeln. | funkeln
> Hubert bekommt eine Schale Erdnüsse | s+5 alle+4 kap=huette:5 | Hubert frisst, schaut, nickt (fast) und verschwindet im Wald. // Onkel Arnulf schreibt später: „Hubert lässt grüßen.“ | herzen

§ #nb_burg1 ort name:Herr_Eisenhut rolle:Burgwart g:4 wenn:bei:burg,kap:burg=0,nsfrei
Herr Eisenhut, der Burgwart, kommt mit einem Schlüsselbund in den Rittersaal. „Wussten Sie, dass hier die Weiße Frau umgeht? Seit 1623. Immer um Mitternacht. Immer im Nordturm.“
< „Erzählen Sie mehr!“ | l+5 s+3 t-4 kap=burg:1 | Herr Eisenhut erzählt 25 Minuten lang. Er hat Folien dabei. // Die Runde ist trotzdem gefesselt. | geister
> „Wir sind keine Kinder mehr.“ | t+3 s-2 kap=burg:1 | „Natürlich nicht“, sagt Herr Eisenhut. // Beim Rausgehen dreht er das Licht ein bisschen herunter.

§ #nb_burg2 tisch g:4 wenn:bei:burg,kap:burg=1,nsfrei
Kurz vor Mitternacht weht ein kalter Luftzug durch den Saal. Die Kerzen flackern. // Irgendwo oben knarrt eine Tür.
< Nachtwanderung zum Nordturm | s+6 t-4 l+3 kap=burg:2 | Ihr schleicht die Wendeltreppe hoch, ganz dicht beieinander. Oben: ein offenes Fenster. Und eine weiße Gardine. | geister
> Weiterspielen, aber mit Gänsehaut | s+3 l+2 kap=burg:2 | Ab sofort spielt die Kampagne auch in einer Burg. // Eine sehr ähnliche Burg. | nebel

§ #nb_burg3 tisch g:4 wenn:bei:burg,kap:burg=2,nsfrei
Auf eurem Tisch liegt morgens ein Zettel in alter Schrift: „Wer würfelt, der bleibe. Wer schummelt, der gehe.“ // Niemand gibt zu, ihn geschrieben zu haben.
< Ab jetzt offen würfeln | l+6 s+3 kap=burg:3 | Ihr würfelt alle sichtbar in der Tischmitte. Sogar du, hinter dem Schirm. // Die Würfel fühlen sich an diesem Tag besonders ehrlich an.
> „Das war doch Herr Eisenhut.“ | s+3 t+2 kap=burg:3 | Herr Eisenhut bestreitet es. // Er hat Tinte an den Fingern.

§ #nb_burg4 tisch g:4 wenn:bei:burg,kap:burg=3,nsfrei
Um Mitternacht steht eine Gestalt in weißem Gewand in der Tür des Rittersaals. Sie hält eine Laterne. // Und einen Charakterbogen.
< Sie an den Tisch bitten | s+7 l-2 alle+3 kap=burg:4 | Die Gestalt setzt sich, schlägt den Schleier zurück. Es ist Herr Eisenhuts Tochter. „Papa hat gesagt, hier spielt man.“ | geister
> Würfel als Waffe | W10 s+5 ? m+3 : laune-2 kap=burg:4 | {name} wirft einen W20 Richtung Tür. Die Gestalt fängt ihn. „Siebzehn“, sagt sie. „Nicht schlecht.“ :: Der Würfel verschwindet in einer Ritze im Boden. Für immer.

§ #nb_burg5 ort name:Herr_Eisenhut rolle:Burgwart g:5 wenn:bei:burg,kap:burg=4,nsfrei
Herr Eisenhut gibt zu: Die Weiße Frau gibt es nicht. Aber seit 1623 erzählt jeder Burgwart die Geschichte weiter. // „Jetzt seid ihr dran. Erzählt sie in eurer Welt weiter.“
< Die Weiße Frau wird Teil der Welt | s+6 l+4 alle+4 kap=burg:5 | In deiner Kampagne wandelt ab heute eine Weiße Frau, die nur Ehrliche sehen können. | geister
> Ein Gruppenfoto im Nordturm | s+5 alle+5 kap=burg:5 | Auf dem Foto ist im Fenster eine weiße Gardine zu sehen. // Zumindest sagt {name}, es sei eine Gardine.

§ #nb_con1 ort name:Moderatorin_Sanne rolle:Würfelzeit-Orga g:4 wenn:bei:con,kap:con=0,nsfrei
Sanne von der Orga bleibt an eurem Tisch stehen. „Tisch 42? Ihr seid fürs Turnier angemeldet. Hat euch das keiner gesagt?“ // Hat es nicht.
< „Klar, wir sind dabei!“ | s+5 t+4 l-2 kap=con:1 | Ihr bekommt eine Turnier-Mappe und einen Zeitplan. // Ihr habt keine Ahnung, worum es geht. Aber ihr seid motiviert.
> „Da muss ein Fehler sein.“ | l+3 kap=con:1 | Sanne prüft die Liste. „Nein. Ihr seid auch schon in der zweiten Runde.“ // Wie auch immer das passiert ist.

§ #nb_con2 tisch g:4 wenn:bei:con,kap:con=1,nsfrei
Um euren Tisch bilden sich Zuschauer. Erst zwei, dann zehn. Jemand filmt. // {name} wird plötzlich sehr theatralisch.
< Für das Publikum spielen | s+7 l-3 t+2 kap=con:2 | Jede Szene wird zur Bühne. Die Zuschauer klatschen bei jedem kritischen Treffer. | konfetti
> Die Zuschauer einbeziehen | s+5 alle+3 kap=con:2 | Bei jeder Probe darf das Publikum mitraten. // Ein Kind ruft: „Er lügt!“ Es hatte recht.

§ #nb_con3 tisch g:4 wenn:bei:con,kap:con=2,nsfrei
Eine Frau mit Tintenflecken an den Fingern setzt sich auf den freien Stuhl. Auf ihrem Namensschild steht: „Mara Tintenfass – Autorin“. // Sie hat das Abenteuer geschrieben, das du gerade leitest.
< Weiterleiten, als wäre nichts | W11 l+4 s+5 ? alle+4 : laune-3 kap=con:3 | Du improvisierst eine Szene, die nicht im Buch steht. Mara schreibt mit. „Das klau ich“, sagt sie. :: Du verhaspelst dich bei ihrem eigenen Bösewicht. Sie lacht freundlich.
> Sie fragen, wie es weitergeht | s+4 l+3 t-3 kap=con:3 | Mara verrät ein Geheimnis aus dem Buch, das nie gedruckt wurde. // Deine Spieler sind die Ersten, die es hören.

§ #nb_con4 tisch g:4 wenn:bei:con,kap:con=3,nsfrei
Durchsage: „Die Tische 17, 42 und 63 bitte zum Finale auf die Bühne.“ // Tisch 42. Das seid ihr.
< Auf die Bühne! | s+7 t+4 m+3 kap=con:4 | Scheinwerfer, ein Mikrofon, hundert Leute. {name} würfelt mit zitternden Händen. | funkeln
> „Wir spielen lieber hier weiter.“ | l+3 s+2 kap=con:4 | Sanne bringt euch das Finale einfach an den Tisch. Die Zuschauer kommen mit.

§ #nb_con5 ort name:Moderatorin_Sanne rolle:Würfelzeit-Orga g:5 wenn:bei:con,kap:con=4,nsfrei
Siegerehrung. Sanne hält einen goldenen W20 aus Plastik in der Hand. „Den Preis für den schönsten Tisch der Würfelzeit bekommt …“ // Trommelwirbel vom Nachbartisch.
< „… Tisch 42!“ | s+8 alle+6 m+3 kap=con:5 | Der goldene Würfel steht ab jetzt neben deinem Spielleiterschirm. // Er würfelt nur Zwanzigen. Er ist ja auch aus Plastik. | krone
> „… Tisch 17.“ | s+4 alle+3 l+2 kap=con:5 | Ihr klatscht am lautesten für die anderen. // Sanne bringt euch einen Sonderpreis: „Bestes Publikum“. | konfetti

§ #nb_zug1 ort name:Schaffnerin_Ilse rolle:Zugbegleiterin g:4 wenn:bei:zug,kap:zug=0,nsfrei
„Die Fahrkarten, bitte.“ Schaffnerin Ilse schaut auf eure Würfel, die Brotdose, den Spielleiterschirm. // „Und was wird das hier?“
< Ihr alles erklären | l+3 s+3 t-2 kap=zug:1 | Ilse hört zu, stempelt die Karten und sagt: „Mein Sohn macht so was. Mit Elfen.“
> „Ein Brettspiel.“ | t+3 kap=zug:1 | „Ein sehr lautes Brettspiel“, sagt Ilse. // Sie kommt auffällig oft vorbei.

§ #nb_zug2 tisch g:4 wenn:bei:zug,kap:zug=1,nsfrei
Durchsage: „Wegen einer Störung verzögert sich die Weiterfahrt um unbestimmte Zeit.“ // Der Zug steht mitten im Wald.
< Mehr Zeit zum Spielen! | s+5 t-4 alle+3 kap=zug:2 | Ihr baut die Wartezeit ins Spiel ein: Die Helden stecken in einem verzauberten Wald fest. // Es passt erschreckend gut. | ranken
> Würfeln, wie lange es dauert | W10 s+4 ? t+3 : t-5 kap=zug:2 | Zehn Minuten. Wie gewürfelt. Ilse schaut euch verwirrt an. :: Zwei Stunden. Ihr spielt eine ganze Session im stehenden Zug.

§ #nb_zug3 ort name:Schaffnerin_Ilse rolle:Zugbegleiterin g:4 wenn:bei:zug,kap:zug=2,nsfrei
Ilse setzt sich auf den freien Platz am Gang. „Pause. Darf ich mal würfeln?“ // Sie hält den W20 sehr vorsichtig.
< Sie würfeln lassen | W10 s+6 ? alle+4 : s+3 kap=zug:3 | Eine 20! Ilse schreit kurz auf. Das ganze Abteil klatscht. :: Eine 1. Ilse lacht laut. „Wie unsere Pünktlichkeit.“ | wuerfelregen
> Ihr eine Rolle geben | s+5 l+2 kap=zug:3 | Ilse spielt eine Fährfrau, die sehr streng Fahrkarten kontrolliert. // Sie ist überragend.

§ #nb_zug4 ort name:Schaffnerin_Ilse rolle:Zugbegleiterin g:5 wenn:bei:zug,kap:zug=3,nsfrei
Die nächste Durchsage kommt von Ilse persönlich: „Nächster Halt: Drachenhort. Bitte achten Sie auf den Schatz zwischen Zug und Bahnsteig.“ // Das ganze Abteil lacht.
< Applaus für Ilse | s+8 alle+6 kap=zug:4 | Ihr klatscht. Der halbe Wagen klatscht mit. // Ilse verbeugt sich im Gang. | konfetti
> Die Durchsage ins Spiel holen | s+6 l+3 kap=zug:4 | In deiner Welt gibt es ab heute einen magischen Zug zum Drachenhort. // Die Schaffnerin heißt natürlich Ilse.

§ #nb_zelt1 ort name:Festival-Kai rolle:Nachbarzelt g:4 wenn:bei:zelt,kap:zelt=0,nsfrei
Aus dem Nachbarzelt kriecht Festival-Kai, Sonnenbrille, Gitarre, verschlafen. „Leute, ihr seid lauter als die Bühne. Was spielt ihr da?“
< „Willst du mitmachen?“ | s+5 alle+2 kap=zelt:1 | Kai setzt sich auf eine Isomatte. „Ich spiel einen Barden. Ich hab ja die Gitarre.“
> „Sorry, wir sind leiser.“ | l+2 t+2 kap=zelt:1 | „Nee, alles gut“, sagt Kai. // Er bleibt trotzdem vor seinem Zelt sitzen und hört zu.

§ #nb_zelt2 tisch g:4 wenn:bei:zelt,kap:zelt=1,nsfrei
Regen. Der Pavillon ächzt. Wasser läuft in eine Ecke, genau auf den Stapel Charakterbögen.
< Alle in Kais Zelt | s+5 t-3 alle+3 kap=zelt:2 | Sieben Leute in einem Drei-Mann-Zelt, Taschenlampe, Würfel auf einer Isomatte. // Die beste Session des Jahres. | regen
> Die Bögen retten | W10 l+3 ? s+3 : laune-4 kap=zelt:2 | Gerettet! Nur {held}s Inventar ist verschwommen. Jetzt hat {er} angeblich drei Schwerter. :: Zu spät. Die Bögen sind Pappmaché. // Ihr spielt aus dem Gedächtnis weiter.

§ #nb_zelt3 ort name:Festival-Kai rolle:Nachbarzelt g:4 wenn:bei:zelt,kap:zelt=2,nsfrei
Kai hat ein Lied über eure Helden geschrieben. Es hat genau drei Akkorde. // Er will es am Lagerfeuer spielen. Vor allen.
< „Spiel es!“ | s+7 alle+4 kap=zelt:3 | Das Lied heißt „{held}, du Held“. Nach der zweiten Strophe singen die Nachbarzelte mit. | musik
> Einen Refrain vorschlagen | s+5 l+2 kap=zelt:3 | Ihr dichtet gemeinsam. Der Refrain reimt sich „Ork“ auf „Work“. // Kai findet das perfekt.

§ #nb_zelt4 ort name:Festival-Kai rolle:Nachbarzelt g:5 wenn:bei:zelt,kap:zelt=3,nsfrei
Kai hat es geschafft: Er darf euer Lied morgen auf der kleinen Bühne spielen. // „Ihr müsst alle mit. Als Chor. In Kostüm.“
< Ab auf die Bühne | s+8 alle+6 t+2 kap=zelt:4 | Vierzig Leute singen „{held}, du Held“. {name} weint ein bisschen. // Kai winkt euch beim Abbauen noch lange nach. | konfetti
> Vom Rand aus jubeln | s+5 alle+4 kap=zelt:4 | Ihr steht ganz vorne und haltet Würfel hoch wie Feuerzeuge. | konfetti

§ #nb_see1 ort name:Bademeister_Holger rolle:Ruderverein g:4 wenn:bei:see,kap:see=0,nsfrei
Bademeister Holger vom Ruderverein schließt euch das Bootshaus auf. „Schwimmen nur bis zur Boje. Und nicht nachts. Wegen dem Ding.“ // „Welches Ding?“ – „Na, das Ding.“
< Nachfragen | l+4 s+3 kap=see:1 | „Keiner weiß, was es ist“, sagt Holger. „Aber manchmal ist der Steg morgens nass. Von unten.“ | frage
> „Okay, Holger.“ | t+2 s+2 kap=see:1 | Holger nickt ernst. // Dann geht er, ohne sich umzudrehen.

§ #nb_see2 tisch g:4 wenn:bei:see,kap:see=1,nsfrei
Durch die Ritzen im Boden seht ihr etwas Großes unter dem Steg vorbeiziehen. // Dann ein Platschen. Dann sind die Wellen am Ufer plötzlich ein bisschen höher.
< Taschenlampe ins Wasser halten | W11 s+6 ? l+3 : laune-3 kap=see:2 | Ein riesiger Schatten. Mit Schnurrbart. Er ist sofort wieder weg. :: Die Taschenlampe fällt ins Wasser. Sie leuchtet noch eine Weile. Von unten. | wellen
> Es ins Abenteuer einbauen | s+4 l-2 kap=see:2 | In deiner Welt gibt es ab heute einen See, in dem etwas wohnt. // Die Spieler wollen nicht mehr rudern.

§ #nb_see3 tisch g:4 wenn:bei:see,kap:see=2,nsfrei
{name}s Angel, die am Steg lehnt, biegt sich plötzlich durch. Die Schnur saust ab. // Etwas zieht. Sehr stark.
< Alle helfen ziehen | W12 s+7 ? m+4 : s+3 kap=see:3 | Für eine Sekunde seht ihr ihn: einen riesigen, alten Karpfen mit goldenen Schuppen. Er spuckt den Haken aus und taucht ab. :: Die Schnur reißt. Alle fallen rückwärts auf die Planken. | wellen
> Loslassen | l+3 laune-2 kap=see:3 | Die Angel verschwindet im See. // Zwei Minuten später treibt sie ans Ufer. Ordentlich, fast höflich.

§ #nb_see4 ort name:Bademeister_Holger rolle:Ruderverein g:4 wenn:bei:see,kap:see=3,nsfrei
Holger kommt mit einem alten Foto: ein Junge, ein riesiger Karpfen, 1981. „Das bin ich. Und das ist Günther. Er ist älter als der Verein.“
< „Günther gehört zur Runde!“ | s+6 alle+4 kap=see:4 | Ab jetzt grüßt ihr jedes Mal den See, bevor ihr anfangt. „Hallo, Günther.“ | herzen
> Günthers Geschichte hören | l+5 t-3 kap=see:4 | Holger erzählt, wie Günther 1993 einen Angelwettbewerb gestoppt hat. Ganz allein. // Die Runde ist schwer beeindruckt.

§ #nb_see5 tisch g:5 wenn:bei:see,kap:see=4,nsfrei
Letzter Abend am See. Ihr legt Brotkrumen ans Ende des Stegs. Lange passiert nichts. // Dann taucht im Laternenlicht ein großer, goldener Kopf auf und schaut euch an.
< Ganz still sein | s+7 l+4 alle+6 kap=see:5 | Niemand sagt etwas. Günther frisst ein Krümelchen und taucht langsam wieder ab. // {name} flüstert: „Der war echt.“ | funkeln
> Ihm ein Lied singen | s+6 alle+5 kap=see:5 | {name} singt leise das Lied vom Wassergeist. Günther bleibt bis zur letzten Zeile. | musik

§ #om_strom tisch g:1.5 wenn:bei:wohnzimmer|dachboden|wgkueche,wetter:gewitter
Ein Donnerschlag, ganz nah. Das Licht flackert. // Und geht aus. Nur die Kerze auf dem Tisch brennt noch.
< Bei Kerzenlicht weiter | s+6 l+3 t-2 +stromweg | Die Gruselszene von eben wird dreimal so gruselig. // {name} rückt näher an {anderer}. | kerze:e_donner
> Handylampen an | t+3 s+1 | Sechs Handylampen leuchten in die Gesichter. // Es sieht aus wie ein Verhör.

§ #om_tram tisch g:1.2 wenn:bei:wohnzimmer|laden
Draußen rumpelt die Straßenbahn vorbei. Der Tisch zittert, ein Würfel rollt von der 3 auf die 4. // Genau der Wurf, der fehlte.
< Zählt! | s+4 l-3 m+2 | „Die Straßenbahn hat entschieden“, ruft {name}. Niemand widerspricht. | :o_tram
> Zählt nicht | l+4 laune-2 | „Vor der Straßenbahn war es eine 3.“ // {name} schaut der Bahn traurig hinterher.

§ #om_wohn_tee wirt g:1.2 wenn:bei:wohnzimmer
{name} hat für alle Tee gemacht. Sieben Sorten. Bei jeder Tasse erklärt {er} die Herkunft. // Das Abenteuer wartet.
< Teepause | s+3 t-5 alle+3 | Es ist gemütlich. Sehr gemütlich. Zwei Leute sind kurz davor einzuschlafen. | :o_aufgiessen
> „Danke! Weiter geht's.“ | t+3 laune-2 | {name} stellt die Kanne ab und setzt sich. // Sehr langsam.

§ #om_wg_party tisch g:1.2 wenn:bei:wgkueche,nacht
Im Nebenzimmer feiern die anderen Mitbewohner. Der Bass wummert durch die Wand. // Gerade jetzt, beim großen Schurkenmonolog.
< Monolog im Takt | s+6 l-3 | {schurkeN} droht im Rhythmus der Musik. Das ganze Zimmer nickt mit. | musik
> Rübergehen und bitten | l+2 t-3 | Die Musik wird leiser. // Dafür sitzt jetzt jemand von der Party bei euch und isst eure Chips.

§ #om_wg_kuehl spieler g:1.2 wenn:bei:wgkueche
{name} holt sich etwas aus dem Kühlschrank und hält es hoch: „Wem gehört dieser Käse? Er hat keinen Namen. Darf ich?“
< „Herrenloser Käse ist Beute!“ | s+4 l-2 | Der Käse wird geteilt. // Am nächsten Tag steht im WG-Chat: „WER HAT MEINEN KÄSE GEGESSEN“.
> „Lass ihn liegen.“ | l+3 laune-2 | {name} stellt den Käse zurück. // Ganz langsam. Mit Blick.

§ #om_keller_wasch tisch g:1.2 wenn:bei:keller
Die Waschmaschine im Nebenraum fängt an zu schleudern. Der Boden vibriert, die Minis auf dem Tisch wandern langsam Richtung Kante.
< Das wird ein Erdbeben im Spiel | s+5 l-2 | Im Abenteuer bebt die Erde genau so lange, wie die Waschmaschine schleudert. // Passt perfekt. | erdbeben:o_waschmaschine
> Minis festhalten | l+3 t-2 | Alle halten ihre Figur fest wie im Sturm. // Niemand bewegt sich, bis die Maschine fertig ist.

§ #om_dach_regen tisch g:1.4 wenn:bei:dachboden,wetter:regen|gewitter
Das Dachfenster ist undicht. Ein Tropfen landet auf {held}s Charakterbogen. // Mitten auf dem Lebenspunkte-Feld.
< Ein Eimer kommt auf den Tisch | s+3 l+2 | Plink. Plink. Plink. Der Eimer gibt ab jetzt den Takt vor. // {name} nennt ihn „die Uhr des Untergangs“.
> Umsetzen | t-3 l+2 | Der ganze Tisch rückt einen halben Meter nach links. // Der Tropfen findet trotzdem einen Weg.

§ #om_laden_kind gast g:1.3 wenn:bei:laden
Ein Mädchen, vielleicht acht, steht in der Tür zum Hinterzimmer. „Was spielt ihr? Darf ich zugucken?“ // Hinter ihr winkt die Mutter entschuldigend.
< Zuschauen lassen | s+5 alle+3 t-2 | Das Mädchen sitzt auf einem Hocker und fiebert bei jedem Wurf mit. Beim Gehen sagt sie: „Ich will Spielleiterin werden.“ | herzen
> „Komm wieder, wenn du größer bist.“ | l+2 t+2 laune-2 | Das Mädchen geht. // {name} schaut dich vorwurfsvoll an.

§ #om_laden_kunde tisch g:1 wenn:bei:laden
Ein Kunde steckt den Kopf herein. „Entschuldigung – wisst ihr, ob die Erweiterung mit den Drachen gut ist?“
< Ausführlich beraten | l+3 t-4 s+2 | {name} hält einen 15-minütigen Vortrag. Der Kunde kauft zwei. // Herr Brettschneider nickt anerkennend.
> „Fragen Sie vorne.“ | t+2 | Der Kunde geht. // Herr Brettschneider ruft von vorne: „Die ist super!“

§ #om_kneipe_tor tisch g:1.3 wenn:bei:kneipe
Nebenan: „TOOOR!“ Der ganze Stammtisch springt auf. Ein Bierglas fällt um. // Genau in dem Moment würfelt {name} eine 20.
< Ihr jubelt mit | s+6 t+2 | Für einen Moment feiern Stammtisch und Spieltisch zusammen. // Niemand weiß genau, was die anderen feiern. | konfetti
> Ihr ignoriert es | l+2 laune-2 | „Das war für den Fußball, nicht für mich“, sagt {name} enttäuscht.

§ #om_kneipe_doris ort name:Doris rolle:Wirtin_„Zum_Krummen_Würfel“ g:1.2 wenn:bei:kneipe
Doris bringt die nächste Runde und schaut auf die Karte. „Wo ist denn der Drache? Ich will heute einen Drachen sehen.“
< Spontan einen Drachen einbauen | s+5 l-3 m+2 | Ein Drache landet auf der Taverne im Spiel. Doris nickt zufrieden. // „Geht doch.“ | drache
> „Heute nicht, Doris.“ | l+3 | Doris zieht eine Augenbraue hoch. // Das nächste Bier kommt fünf Minuten später.

§ #om_laube_ruhe ort name:Herr_Kowalczyk rolle:Vorsitzender_des_Gartenvereins g:1.3 wenn:bei:laube,nacht
22:00 Uhr. Herr Kowalczyk steht mit Taschenlampe am Zaun. „Ruhezeit. Laut Satzung, Paragraf vier.“
< Ab jetzt flüstern | l+4 s+2 t-3 | Ihr spielt im Flüsterton weiter. Das Finale wird zur Verschwörung. // Herr Kowalczyk bleibt am Zaun stehen. Um besser zu hören.
> In die Laube umziehen | t-4 s+3 | Sechs Leute, eine Laube, ein Gartenstuhl zu wenig. // Kuschelig.

§ #om_laube_gewitter tisch g:1.4 wenn:bei:laube,wetter:gewitter|regen
Erste dicke Tropfen auf der Tischdecke. Dann prasselt es. // Die Charakterbögen!
< Alle in die Laube! | s+5 t-3 | Ihr rettet alles unter das Vordach. Der Regen trommelt aufs Dach, die Laterne schaukelt. // Gemütlicher geht es nicht. | regen
> Weiterspielen, Schirm drüber | l-2 s+4 | {name} hält einen Regenschirm über den Spielleiterschirm. // Sehr professionell. | regen

§ #om_huette_ofen tisch g:1.3 wenn:bei:huette
Der Kaminofen ist ausgegangen. Es wird kalt in der Hütte. Alle ziehen die Jacken an. // Wer geht raus, Holz holen?
< Würfeln, wer geht | W10 s+3 ? : laune-4 | {anderer} geht. Kommt mit einem Arm voll Holz und Schnee im Haar zurück. Held des Abends. :: {name} muss raus. // Es ist sehr dunkel. Und sehr kalt. | schnee
> Alle unter eine Decke | s+5 t-3 alle+2 | Ihr spielt unter drei Wolldecken. // Niemand will je wieder aufstehen.

§ #om_burg_nachtruhe ort name:Herr_Eisenhut rolle:Burgwart g:1.2 wenn:bei:burg,nacht
Herr Eisenhut steht im Nachthemd in der Tür. „Meine Herrschaften. Es ist halb eins.“ // „… Wie weit seid ihr denn?“
< „Kurz vor dem Endgegner!“ | s+5 alle+2 t+3 | „Na dann“, sagt Herr Eisenhut. Er setzt sich dazu. Im Nachthemd.
> Leiser machen | l+3 t-2 | Ihr flüstert. // Der Endgegner bekommt ein heiseres Lachen.

§ #om_con_durchsage tisch g:1.3 wenn:bei:con
Durchsage durch die ganze Halle: „Der Besitzer eines rosafarbenen Würfelbeutels in Drachenform möge sich bitte am Infostand melden.“ // {name} tastet panisch die Taschen ab.
< Zum Infostand rennen | t-3 s+4 | {name} kommt mit dem Beutel zurück und hat unterwegs zwei Freunde gefunden. | :o_durchsage
> „Später.“ | t+3 laune-3 | {name} würfelt den Rest des Abends mit geliehenen Würfeln. // Sie fallen alle auf die 2.

§ #om_zug_tunnel tisch g:1.3 wenn:bei:zug
Tunnel. Kein Netz, kein Licht, das Abteil ist kurz stockdunkel. // Genau als der Schurke die Kapuze abnimmt.
< Die Enthüllung in der Dunkelheit | s+6 l+2 | Als das Licht zurückkommt, starren alle auf deine Taschenlampe unterm Kinn. Ein Kind am Nebentisch kreischt. | dunkel
> Warten, bis es hell ist | t-2 l+2 | Im Tunnel hört man nur noch das Rattern. // Und {name}, der ganz leise „uuuuh“ macht.

§ #om_zelt_motten tisch g:1.2 wenn:bei:zelt|see|laube,nacht
Um die Laterne kreisen inzwischen so viele Motten, dass {name} sie zählt. // „Siebzehn. Das ist ein Schwarm. Das ist eine Begegnung.“
< Motten werden Gegner | s+5 l-3 m+2 | Die Helden kämpfen gegen einen Schwarm Riesenmotten. Am echten Tisch wedeln alle mit den Charakterbögen. | insekten
> Laterne weiter weg stellen | l+2 t-2 | Die Motten ziehen um. // Ihr spielt im Halbdunkel weiter.

§ #om_see_schwimm spieler g:1.2 wenn:bei:see,tag
{name} steht schon in Badehose am Steg. „Nur eine Runde! Dann bin ich wieder da. {held} kann so lange passen.“
< „Geh nur!“ | s+4 laune+8 t-3 | {name} springt. Kommt zurück, tropft auf die Karte und ist sehr glücklich. | wellen
> „Erst nach der Szene.“ | t+2 laune-4 | {name} spielt die Szene in Badehose zu Ende. // Mit sehr viel Ungeduld.

§ #pl_huette spieler phase:ende g:1.1 wenn:plan:nein,sess>1,typ:rolle
{name} hat eine Idee: „Mein Onkel hat eine Hütte im Wald. Kein Netz, Kaminofen, ein ganzes Wochenende. Für eine Session wie früher!“
< „Wir fahren hin!“ | s+5 alle+4 ausflug=huette | Ihr plant Fahrgemeinschaften, Einkaufslisten und wer den Würfelturm mitnimmt. // {name} strahlt. | funkeln
> Lieber wie immer | t+2 laune-4 | „Okay“, sagt {name}. // Die Idee bleibt im Raum hängen wie Kaminrauch.

§ #pl_burg tisch phase:ende g:1 wenn:plan:nein,sess>1
Im Gruppenchat schickt jemand einen Link: „Jugendherberge in einer Burg, mit Rittersaal. Nur 24 Euro pro Nacht.“ // Fünf Herzchen in zwei Minuten.
< Buchen! | s+6 alle+3 ausflug=burg | Ihr bucht den Rittersaal. In der Buchungsbestätigung steht: „Bitte keine Waffen mitbringen.“ // {name} fragt, ob Schaumstoff zählt. | krone
> „Zu teuer.“ | l+2 laune-2 | Der Link bleibt im Chat. Ab und zu reagiert noch jemand mit einem Herzchen.

§ #pl_con spieler phase:ende g:1 wenn:plan:nein,sess>1
{name} hält einen Flyer hoch: „Die Würfelzeit! Rollenspiel-Convention, nächstes Wochenende. Wir könnten da als Gruppe einen Tisch anmelden!“
< Anmelden! | s+5 t+3 ausflug=con | Ihr füllt das Formular aus. Bei „Gruppenname“ entbrennt ein 20-minütiger Streit. | konfetti
> Vielleicht nächstes Jahr | t+2 laune-3 | {name} steckt den Flyer weg. // Langsam. Ganz langsam.

§ #pl_zug tisch phase:ende g:.8 wenn:plan:nein,sess>2
Ihr fahrt alle zusammen zu einer Hochzeit in einer anderen Stadt. Sechs Stunden Zug. // {name} fragt: „Spielen wir unterwegs?“
< „Natürlich!“ | s+5 alle+2 ausflug=zug | {name} packt eine Brotdose ein. „Für die Würfel.“ | wuerfelregen
> „Da wird geschlafen.“ | t+3 laune-3 | Alle nicken. // Alle packen heimlich trotzdem Würfel ein.

§ #pl_zelt spieler phase:ende g:1.1 wenn:plan:nein,sess>1,jz:sommer|fruehling
{name}: „Am Wochenende ist das kleine Festival am Waldrand. Wir zelten sowieso. Lagerfeuer-Session?“
< „Ja!“ | s+6 alle+3 ausflug=zelt | Ihr kauft Marshmallows, Mückenspray und eine Gaslaterne. // {name} übt schon mal Gruselstimmen. | feuer
> „Ich zelte nicht.“ | l+2 laune-3 | {name} ist enttäuscht. // Später kommt im Chat ein Foto: ein leeres Zelt mit einem traurigen Smiley.

§ #pl_see tisch phase:ende g:1 wenn:plan:nein,sess>1,jz:sommer|fruehling
Über eine Freundin von {anderer} bekommt ihr für ein Wochenende das alte Bootshaus vom Ruderverein. Direkt am See.
< Zusagen! | s+5 alle+3 ausflug=see | Ihr plant Schwimmen, Grillen, Spielen. In dieser Reihenfolge. Oder umgekehrt. | wellen
> Absagen | l+2 laune-2 | Die Freundin ist etwas beleidigt. // Das Bootshaus bekommt ein Kanu-Verein.

§ #pl_zufall wirt phase:ende g:.8 wenn:plan:nein,sess>2
{name} sagt beim Abschied: „Ich brauch mal einen Tapetenwechsel. Lasst uns nächstes Mal woanders spielen. Irgendwo Besonderes.“
< Überraschungsausflug! | s+5 alle+3 ausflug=zufall | Du planst heimlich. Die Spieler bekommen nur eine Uhrzeit und eine Adresse. | funkeln
> „Hier ist es doch schön.“ | l+2 laune-4 | {name} seufzt. „Ja. Schon.“ // Es klingt nicht ganz überzeugt.

§ #um_eigenbedarf wirt g:.5 wenn:bei:heim,sess>1,plan:nein,kamp>1
{name} kommt blass an den Tisch. „Mein Vermieter hat Eigenbedarf angemeldet. Ich muss raus. Ende des Monats.“ // Wo spielt ihr dann?
< Bei jemand anderem | alle-2 s-2 wirt=anderer umzug=heim | {anderer} meldet sich sofort. „Bei mir. Ich hab Platz. Irgendwie.“ | :e_kiste
> Einen Treffpunkt außer Haus suchen | l+2 umzug=treff | Ihr sucht einen Ort, wo euch niemand rausschmeißen kann. // Theoretisch.

§ #um_angebot spieler g:.5 wenn:bei:heim|treff,sess>2,plan:nein,!w_umzugangebot
{name} hat eine neue Wohnung. „Mit großem Esstisch! Und einem Keller. Und einer Dachterrasse. Wollt ihr nicht ab jetzt bei mir spielen?“
< Umziehen! | s+4 alle+2 +w_umzugangebot wirt=ich umzug=heim | {name} schickt gleich Fotos in den Chat. Der Tisch ist wirklich sehr groß. | herzen
> „Wir bleiben, wo wir sind.“ | l+2 laune-4 +w_umzugangebot | {name} nickt. „Das Angebot steht.“

§ #um_laden tisch g:.45 wenn:bei:heim,sess>2,plan:nein,!w_umzugladen
Im „Würfelturm“, dem Spieleladen in der Altstadt, hängt ein Zettel: „Hinterzimmer für feste Spielrunden frei. Kostenlos. Nur nett sein.“
< Hinziehen! | s+3 l+3 +w_umzugladen umzug=laden | Herr Brettschneider freut sich so sehr, dass er euch den Schlüssel schon jetzt gibt. „Nur zur Sicherheit.“
> Zuhause ist es schöner | t+2 +w_umzugladen | Der Zettel hängt noch wochenlang. // {name} schaut jedes Mal hin, wenn ihr vorbeigeht.

§ #um_kneipe tisch g:.45 wenn:bei:heim|treff,sess>2,plan:nein,!w_umzugkneipe,nichtbei:kneipe
Wirtin Doris vom „Krummen Würfel“ hat gehört, dass ihr eine Runde seid. „Mein Nebenzimmer steht donnerstags leer. Ihr trinkt doch was, oder?“
< Ins Nebenzimmer! | s+4 +w_umzugkneipe umzug=kneipe | Doris reserviert den Tisch mit einem Bierdeckel, auf dem „Die Drachenleute“ steht. | :n_einschenken
> „Wir sind keine Kneipenrunde.“ | l+2 +w_umzugkneipe | Doris zuckt mit den Schultern. „Die Tür steht offen.“

§ #um_garten spieler g:.5 wenn:bei:heim,sess>1,plan:nein,jz:fruehling|sommer,!w_umzuggarten
{name} hat einen Schrebergarten übernommen. Parzelle 47. „Mit Laube! Lasst uns im Sommer draußen spielen!“
< In den Garten! | s+5 alle+3 +w_umzuggarten umzug=laube | Ihr spielt ab jetzt unter freiem Himmel. Mit Grill. Und mit Mücken. | ranken
> „Ich bin allergisch gegen alles.“ | l+2 laune-3 +w_umzuggarten | {name} ist enttäuscht. // Später kommt ein Foto von einer sehr schönen Tomate.

§ #um_zurueck tisch g:.5 wenn:bei:treff,sess>3,plan:nein
Eine Idee macht die Runde: „Wollen wir nicht wieder bei jemandem zuhause spielen? Mit eigener Küche und Sofa?“
< Wieder nach Hause | alle+2 s+2 wirt=anderer umzug=heim | {anderer} bietet an: „Bei mir. Ich mach Platz.“ // Es dauert dann doch drei Wochen.
> Hier bleiben | l+2 | Alle sind sich einig: Der Treffpunkt ist inzwischen Tradition.

`);
