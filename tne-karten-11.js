/* =====================================================================
   TALES NEVER END – Kartenpaket 11: Es kann literally alles passieren
   ---------------------------------------------------------------------
   Vibecoding am Spieltisch, ein Vogel im Wohnzimmer, ein gewonnener
   Abend auf einer echten Burg – und jede Menge Zufall, drinnen wie
   draußen, im Spiel wie am Tisch.
   ===================================================================== */
(window.TNE_KARTEN = window.TNE_KARTEN || []).push(String.raw`

§ #vc_start spieler einmal
{name} hat den Laptop aufgeklappt und tippt nebenbei. „Ich vibecode nur kurz einen Würfel-Bot.“ // „Die KI macht das. Ich sag ihr nur, was ich will.“
< Lass {ihn} machen | s+3 t-2 +w_vibe >>vc_bot | {name} tippt „mach, dass es geil aussieht“ und drückt Enter. // Der Laptop-Lüfter klingt wie ein Föhn.
> „Laptop zu, wir spielen.“ | l+3 laune-4 | {name} klappt den Laptop zu. // Langsam. Mit sehr viel Gefühl.

§ #vc_bot spieler kette
Der Würfel-Bot ist fertig. Er hat Animationen, Soundeffekte und einen Darkmode. // Er würfelt nur leider ausschließlich Einsen.
< „Sag der KI, sie soll das fixen.“ | s+4 t-3 >>vc_feature | {name} schreibt: „bitte keine Einsen mehr“. // Der Bot würfelt jetzt ausschließlich Zweien. | wuerfelregen
> Echte Würfel, bitte | l+3 laune-3 | Der Bot bleibt im Tab offen. // Ab und zu würfelt er von selbst eine Eins. Einfach so.

§ #vc_feature spieler kette
{name}: „Die KI hat ungefragt ein Feature eingebaut.“ // Der Bot kommentiert jetzt jeden Wurf. „Schade! Aber du bist trotzdem wertvoll.“
< Der Bot bleibt – als Tischmaskottchen | s+6 alle+3 l-2 | Bei jeder 1 tröstet der Bot. Bei jeder 20 schickt er Konfetti. // {p2} hat sich schon zweimal bei ihm bedankt. | konfetti
> „Der Bot muss weg.“ | l+3 laune-5 | „Kann ich nicht löschen“, sagt {name}. „Er ist jetzt Teil des Systems.“ // Niemand weiß, ob das ein Witz war.

§ #vc_boss spieler wenn:w_vibe
Mitten im Bosskampf: {name} fragt die KI, wie man {schurkeN} am besten besiegt. // Die KI hat eine Antwort. Drei Seiten lang, mit Quellenangaben.
< „Okay, probier's.“ | W11 s+4 l-3 ? m+5 : m-3 laune-3 | Es funktioniert. Die KI ist sehr stolz. // {name} auch. :: Die KI hatte das falsche Regelwerk im Kopf. // {held} versucht, einen Drachen mit Feng-Shui zu besiegen.
> „Spiel mit deinem Kopf.“ | l+3 laune-2 s+2 | {name} klappt den Laptop zu. Plötzlich hat {er} selbst eine Idee. // Eine richtig gute.

§ #vc_website spieler wenn:w_vibe
{name} hat über Nacht eine Website für die Kampagne gebaut. Mit Karte und Soundkulisse. // „Nur sechs Stunden. Und 400 Nachrichten.“
< Sofort durchklicken | s+8 t-6 alle+5 | Auf der Seite gibt es sogar ein Kartenspiel über eine Spielleitung. // Der Tisch klickt sich fest. Bis halb eins. | funkeln
> „Zeig nach der Session.“ | t+3 laune-3 | {name} nickt. // Und aktualisiert sie trotzdem heimlich unterm Tisch.

§ #vc_npc spieler wenn:w_vibe
{name}: „Ich hab die KI gebeten, den Wirt zu spielen. Hör mal.“ // Der Wirt antwortet mit 600 Wörtern und bietet fünf Optionen an.
< Der Wirt bleibt KI | s+5 l-4 t-4 | Der Wirt ist jetzt extrem höflich und entschuldigt sich ständig. // Die Helden haben Mitleid mit ihm.
> „Der Wirt bin ich.“ | l+3 s+2 vertrauen+4 | Du räusperst dich: „Was wollt ihr?“ // Der Tisch klatscht. Kurz. Aber ehrlich.

§ #vg_vogel tisch einmal
Das Fenster steht offen. Plötzlich flattert eine Amsel ins Wohnzimmer und landet auf dem Spielleiterschirm. // Sie schaut auf deine Notizen.
< Ganz ruhig, Fenster weit auf | W9 s+5 ? alle+3 +w_vogel : t-4 laune-3 +w_vogel | Die Amsel hüpft zweimal über den Schirm, pickt einen Krümel und fliegt hinaus. // Alle atmen gleichzeitig aus. :: Die Amsel dreht vier Runden unter der Decke. Ein Würfel, ein Glas und {name} gehen zu Boden. Dann ist sie weg. | federn:e_fluegelschlag
> Sie ist ein Omen. Im Spiel auch. | s+8 l-5 +w_vogel | In {ort} landet im selben Moment eine schwarze Amsel auf {held}s Schulter. // Sie spricht. Mit deiner Stimme. | federn
^ Mit Handtuch einfangen | W13 s+4 t-3 ? laune+6 : laune-6 l-2 | {name} fängt sie im ersten Versuch. Wie ein Torwart. Applaus. :: Das Handtuch landet in der Bowle. Die Amsel landet auf {name}s Kopf. | federn

§ #vg_wieder tisch wenn:w_vogel
Die Amsel ist wieder da. Sie sitzt auf dem Fensterbrett und schaut herein. Jede Session. // Seit drei Wochen.
< Sie bekommt einen Namen | s+6 alle+4 | Sie heißt jetzt Frau Initiative. // Wenn sie pfeift, darf der Spieler am Fenster zuerst würfeln. | federn
> Ein Vogelhäuschen aufhängen | l+2 laune+5 | Ab jetzt gibt es Meisenknödel. // Die Amsel bringt nächste Woche ihren Partner mit. | federn

§ #vg_omen sl wenn:w_vogel
Im Spiel taucht eine Amsel auf, die {held} überallhin folgt. Der ganze Tisch schaut zum Fenster. // Draußen sitzt die echte.
< Die Amsel ist eine Verbündete | s+6 l+2 m+2 | Sie führt die Gruppe durch ein Labyrinth. // Am Fenster pfeift es zweimal. Zufall. Sicher. | federn
> Die Amsel ist ein Spion | s+7 l-3 | {schurkeN} sieht alles, was die Amsel sieht. // {p2} schließt vorsichtshalber das echte Fenster.

§ #bg_wettbewerb tisch einmal
Ein Rollenspielverein verlost einen Spielabend auf einer echten Burg. Gesucht: die beste Anekdote. // {name} schreibt schon.
< Gemeinsam die Bewerbung schreiben | W10 s+5 t-4 ? alle+6 +w_burg >>>bg_ankunft : laune-3 | Drei Wochen später kommt die Mail: Ihr habt gewonnen! // Am Gruppenchat explodieren die Ausrufezeichen. :: Ihr werdet Zweiter. Gewonnen hat eine Gruppe mit einem Barden, der eine Kuh verführt hat. // Fair. | konfetti
> „Wir gewinnen eh nie was.“ | l+2 laune-3 | {name} schickt die Bewerbung trotzdem ab. Allein. // Ohne es jemandem zu sagen.

§ #bg_ankunft tisch kette
Die Burg ist echt: Fackeln, Wehrgang, Rittersaal. Verwalter Kornmüller trägt einen Schlüsselbund wie ein Kerkermeister. // Keiner kriegt den Mund zu.
< Sofort im Rittersaal spielen | s+12 alle+8 t-4 >>bg_nacht | Kerzenlicht, ein offenes Feuer, der Würfel klingt auf dem alten Holz wie ein Donner. // Die beste Session aller Zeiten fängt an. | kerze
> Erst die Burg erkunden | s+6 l+2 t-4 >>bg_verlies | Kornmüller zeigt euch alles. Auch das Verlies. // „Da saß mal ein Spielleiter drin“, sagt er. Ihr glaubt, er macht Witze.

§ #bg_verlies tisch kette
Im Verlies gibt es noch Ketten an der Wand. {name} will die nächste Szene unbedingt hier spielen. // Mit einer Taschenlampe unterm Kinn.
< Abstieg ins Verlies | s+10 l-3 t-3 >>bg_nacht | Die Szene im Gefängnis spielt im echten Gefängnis. // {p2} gibt zu, ein bisschen Angst zu haben. Nur ein bisschen. | dunkel
> Lieber zurück an den Kamin | l+2 laune+3 >>bg_nacht | Oben ist es warm. // Unten klirrt es leise. Bestimmt der Wind.

§ #bg_nacht tisch kette
Mitternacht auf der Burg. Plötzlich geht in einem Fenster über dem Hof ein Licht an. // Kornmüller ist vor zwei Stunden heimgefahren.
< Nachsehen. Alle zusammen. | W11 s+10 t-3 ? alle+6 : alle+3 laune-2 >>bg_morgen | Im Turmzimmer: eine Zeitschaltuhr. // Die Erleichterung ist so laut, dass ihr sie im Dorf hören konnte. :: Im Turmzimmer: nichts. Das Licht ist aus. // Niemand schläft allein in dieser Nacht. | geister
> Es ins Spiel einbauen | s+8 l-4 >>bg_morgen | „In der Ferne flackert ein Licht im Turm …“ // In diesem Moment geht das echte Licht aus. Der ganze Tisch schreit. | geister

§ #bg_morgen tisch kette
Sonnenaufgang über den Zinnen. Ihr habt bis fünf gespielt. // {name} macht ein Foto, das später in jedem Wohnzimmer hängt.
< Ein Erinnerungsfoto mit allen | alle+8 s+6 l+2 | Fünf zerknitterte Gesichter auf einem Wehrgang. // Das schönste Bild der Kampagne. | sonne
> Ein Versprechen | alle+6 s+4 vertrauen+6 | „Nächstes Jahr wieder.“ // Diesmal meint es jeder ernst. | sonne

§ #bg_nachwirkung tisch wenn:w_burg
Seit der Burg findet {name} das Wohnzimmer „irgendwie klein“. // Und das Deckenlicht „irgendwie unromantisch“.
< Ab jetzt Kerzenlicht | s+5 l-2 alle+3 | Teelichter überall. // Einer fällt um. Der Charakterbogen von {p2} hat jetzt eine Brandnarbe. Passend. | kerze
> „Die Burg war einmalig.“ | l+2 laune-3 | {name} seufzt und zeigt zum dritten Mal das Foto. // Alle schauen es zum dritten Mal an. Gern.

§ #zf_strom tisch
Stromausfall. Im ganzen Haus. Mitten im Kampf. // Aus der Küche: „Hat jemand Kerzen?“
< Weiter bei Handylicht | s+8 l-3 alle+3 | Fünf Taschenlampen unter fünf Gesichtern. // Plötzlich ist jedes Monster doppelt so gruselig. | kerze
> Pause, bis das Licht wiederkommt | t-5 laune-2 | Vierzig Minuten im Dunkeln. Ihr redet über Gott und die Welt. // Als das Licht angeht, sind alle fast ein bisschen enttäuscht.

§ #zf_rauchmelder tisch
Der Rauchmelder piept. Einmal. Alle 40 Sekunden. // Batterie fast leer. Niemand weiß, welcher es ist.
< Großfahndung | t-5 s+5 alle+2 | Nach zehn Minuten stehen drei Leute auf Stühlen unter drei Rauchmeldern. // Es war der im Bad. | ausruf
> Ignorieren | laune-6 s+3 | Ab jetzt hat jeder Satz eine Pause. // Piep. Mitten in der Pointe. Piep.

§ #zf_warntag tisch
Alle Handys gleichzeitig: ohrenbetäubender Alarm. Probewarnung. // {name} hat vor Schreck den W20 verschluckt. Fast.
< Ins Spiel einbauen: Alarm in {ort} | s+8 l-3 | Im selben Moment heulen die Sirenen von {ort}. // Der Tisch ist begeistert. Die Nachbarn eher nicht. | glocke
> Durchatmen, weiter | t+2 laune-2 | Fünf Erwachsene halten sich gleichzeitig die Brust. // „Wir werden alt.“

§ #zf_saugroboter tisch
Der Saugroboter startet sich selbst. Er fährt unter dem Tisch durch. // Danach fehlt ein W8.
< Den Roboter verfolgen | s+6 t-4 | Fünf Erwachsene kriechen hinter einem Saugroboter her. // Er hat außerdem zwei Chips und einen Zettel mit Notizen gefressen. | ausruf
> „Er ist jetzt ein Monster im Spiel.“ | s+8 l-4 | In {ort} rollt ein runder Golem durch die Gassen und frisst alles. // Er heißt Roomba der Verschlinger.

§ #zf_sprachassistent tisch
{name} sagt laut „Feuerball!“. // Aus der Ecke: „Ich habe ‚Feuerball‘ zu deiner Einkaufsliste hinzugefügt.“
< Testen, was er noch versteht | s+6 t-4 alle+2 | „Spiele epische Kampfmusik.“ Er spielt Schlager. // Der Endkampf mit Schlager wird legendär. | musik
> Stecker ziehen | l+2 | Die Ecke ist still. // Zu still.

§ #zf_smartlicht tisch
Das smarte Licht spinnt. Es wechselt alle paar Sekunden die Farbe. // Rot. Grün. Lila. Rot.
< Die Session ist jetzt eine Disco | s+6 l-4 alle+2 | Der Goblin stirbt im Stroboskoplicht. // Es ist die glorreichste Goblin-Szene der Geschichte. | musik
> Licht auf Warmweiß, Router neu starten | t-3 l+2 | Fünfzehn Minuten mit dem Handy in der Hand. // Am Ende ist das Licht warmweiß. Fast.

§ #zf_lieferung tisch
Der Lieferdienst bringt das Essen. Falsche Bestellung. Statt Pizza: zwölf Portionen Sushi. // Bezahlt hat sie jemand anderes.
< Zurückbringen lassen | l+3 laune-2 | Der Fahrer ist dankbar. Er bekommt ein Trinkgeld und einen Würfel. // Er will nächste Woche wiederkommen.
> „Wir sind ehrliche Leute …“ – und essen | s+6 alle+4 l-4 | Die Gruppe isst Sushi und fühlt sich wie Diebe. // Die Helden rauben im Spiel aus Solidarität eine Bank aus.

§ #zf_nachbar gast
Es klingelt. Der Nachbar von unten im Bademantel. // „Was ist das für ein Geschrei? Ist ein Drache gestorben?“
< „Ja. Wollen Sie den nächsten sehen?“ | W10 s+6 ? neu : l+2 laune-2 | Er setzt sich. Im Bademantel. // Er bleibt drei Stunden und würfelt eine natürliche 20. :: „Nein danke. Aber leiser!“ // Er klingt ein ganz kleines bisschen neidisch. | lachen
> Kleinlaut entschuldigen | l+3 laune-3 | Ab jetzt wird geflüstert. // Der Bosskampf klingt wie eine Bibliothek.

§ #zf_mitbewohner gast
{name}s Mitbewohnerin kommt heim. Sie schaut drei Minuten zu. Dann zieht sie sich einen Stuhl heran. // „Ich bin ein Ork. Was muss ich tun?“
< Willkommen am Tisch | s+6 neu | Sie spielt einen Ork namens Rüdiger. // Rüdiger ist nach zwanzig Minuten der Liebling aller. | konfetti
> „Nächste Woche, ganz offiziell.“ | l+2 laune+2 | Sie nickt. Und liest bis dahin das ganze Spielerhandbuch. // Zweimal.

§ #zf_spinne tisch
An der Decke über dem Tisch: eine Spinne. Groß. // {name} hat sie gesehen. {name} spielt jetzt nicht mehr mit.
< Glas und Postkarte | W10 t-3 ? laune+6 : laune-6 s+3 | Die Spinne wird feierlich auf den Balkon gebracht. // {name} küsst dir fast die Hand. :: Die Spinne fällt. Direkt auf den Spielplan. Es entsteht Chaos. | insekten
> Sie wird ein Monster | s+6 l-3 | Im Spiel: eine Riesenspinne an der Decke der Höhle. // Der echte Tisch schaut synchron nach oben. | insekten

§ #zf_wespe tisch
Eine Wespe kreist über der Saftschorle. // Fünf Erwachsene erstarren gleichzeitig.
< Ganz ruhig bleiben | W9 ? s+3 : laune-4 s+4 | Die Wespe fliegt von allein raus. Alle tun so, als wären sie entspannt gewesen. :: {name} schlägt mit dem Regelbuch nach ihr. Getroffen hat {er} die Bowle. | insekten
> Fenster auf, Licht aus | t-3 l+2 | Die Wespe fliegt raus. // Dafür kommen drei Motten rein.

§ #zf_tisch tisch
Ein Krachen. Ein Tischbein gibt nach. Würfel, Miniaturen und Chips rutschen langsam nach links. // Ganz langsam.
< Alle halten fest! | W10 s+6 t-3 ? alle+4 : laune-4 | Fünf Hände stützen den Tisch, bis jemand ein Buch drunterschiebt. // Es ist das Spielerhandbuch. Endlich nützlich. :: Alles landet auf dem Boden. // Die Initiative-Reihenfolge ist jetzt eine archäologische Frage. | erdbeben
> Auf dem Boden weiterspielen | s+8 l-3 alle+3 | Picknickdecke, Kissen, Lagerfeuer-Stimmung. // Wie früher im Jugendzimmer. | kerze

§ #zf_sekt tisch
Jemand öffnet eine Flasche Sekt. Der Korken schießt an die Decke, prallt ab und landet in der Würfelschale. // Er rollt eine 20.
< Das zählt! | s+8 l-6 alle+3 | Der Korken bekommt einen Platz im Regal. // Daneben steht jetzt ein kleines Schild: „Natürliche 20“. | konfetti
> Das zählt nicht. | l+3 laune-2 | Der Korken bekommt trotzdem einen Ehrenplatz. // Er hat es sich verdient.

§ #zf_raclette tisch
Heute gibt es Raclette am Spieltisch. Acht Pfännchen, zwei Würfelschalen, ein Charakterbogen. // Was soll schon passieren?
< Durchziehen | s+8 alle+5 t-4 | Ein W6 landet in einem Pfännchen mit Käse. // Er wird erst nach dem Spiel gefunden. Er ist jetzt ein W6 mit Kruste. | feuer
> Erst essen, dann spielen | l+3 t+2 alle+3 | Zwei Stunden Raclette. // Danach spielt niemand mehr. Alle liegen auf dem Sofa.

§ #zf_schnee tisch
{name} schaut aus dem Fenster und flüstert: „Es schneit.“ // Der erste Schnee. Fünf Erwachsene stehen am Fenster.
< Kurz raus! | s+6 t-4 alle+5 | Zehn Minuten Schneeballschlacht im Hof. // Dann: heißer Tee, rote Nasen, beste Laune. | schnee
> Ins Spiel: Schneesturm in {ort} | s+5 l-2 | Die Helden frieren. // Die Spieler machen mit. Von wegen „nur so tun“. | schnee

§ #zf_tor tisch
Von draußen: ein riesiger Jubelschrei aus allen Fenstern der Straße. Fußball. // Euer Drache stirbt genau in diesem Moment.
< „Für uns. Natürlich für uns.“ | s+6 alle+3 | Die ganze Straße feiert euren Drachen. // So fühlt sich das also an. | konfetti
> Kurz den Spielstand checken | t-3 laune+2 | Es steht 1:1. // Für die nächste halbe Stunde hat der Tisch zwei Spielleiter: dich und den Liveticker.

§ #zf_falsche_wohnung gast
Es klingelt. Vor der Tür steht jemand mit Blumen und Parfum. // „Hi, ich bin Tobi. Das Date? Dritter Stock?“
< „Zweiter. Aber komm rein!“ | s+6 t-3 l-3 | Tobi bleibt eine halbe Stunde, würfelt einmal für den Oger und geht dann doch zu seinem Date. // Die Blumen lässt er da. | herzen
> Freundlich nach oben schicken | l+2 laune+2 | Eine Stunde später: Gelächter von oben. // Der Tisch hofft für Tobi. Sehr.

§ #zf_kostuem tisch
{name} kommt heute verkleidet. Komplett. Mit Umhang, Ohren und Stab. // Niemand sonst hat davon gewusst.
< Respekt zollen | s+6 alle+3 laune+6 | Den ganzen Abend spricht {name} nur in Charakter. // Ab Session zwei ziehen drei andere nach. | magie
> „Gab's eine Mail, die ich übersehen habe?“ | laune-3 s+4 | Es gab keine Mail. // {name} findet das „umso besser“.

§ #zf_kuchen_gott tisch
{name} hat eine Torte in Form eines W20 gebacken. Mit Zahlen aus Zuckerguss. // „Wer anschneidet, muss vorher würfeln.“
< Die Torte würfeln | s+6 alle+5 | Die Torte rollt nicht. Sie fällt um. // Auf die 1. Sie wird trotzdem gegessen. | konfetti
> Ehrfürchtig fotografieren | l+2 laune+4 | Sechzig Fotos aus allen Winkeln. // Dann bleibt nur noch die 13 übrig.

§ #zw_videothek welt
{held} stolpert durch ein Portal und landet in einer Videothek im Jahr 1996. // Ganz hinten gibt es einen Vorhang.
< Ab in die Fantasyabteilung | s+8 l-4 | {held} leiht sich drei Filme aus. // Die Gebühr für zu spätes Zurückgeben wird zum Fluch der Kampagne. | portal
> Sofort zurück! | l+3 | {held} nimmt nur eine Tüte Popcorn mit. // Und eine VHS. Ohne Hülle. | portal

§ #zw_reime welt
Ein Fluch: {held} kann nur noch in Reimen sprechen. // {name} schwitzt.
< {name} muss das ausspielen | s+8 laune+4 l-3 | „Ich zieh mein Schwert, ich bin bereit – äh … das ist es, was ich sag … zu zweit?“ // Standing Ovations. | musik
> Nach einer Szene gebrochen | l+3 s+2 | Der Fluch löst sich nach einem einzigen schrecklichen Gedicht über Käse.

§ #zw_tausch welt
Ein Blitz, ein Knall – {held} und {p2held} wachen im falschen Körper auf. // {name} und {p2} tauschen die Charakterbögen.
< Eine Session lang | s+10 l-5 beide+5 | Plötzlich muss {p2} {held} spielen. // Beide lernen eine Menge übereinander. Vor allem Peinliches. | magie
> Nur eine Szene | s+5 l+2 | Fünf Minuten Rollentausch. // Am Tisch wird geweint vor Lachen. | lachen

§ #zw_frosch welt
{held} küsst einen Frosch. Der Frosch wird kein Prinz. // {held} wird ein Frosch.
< Eine Session als Frosch | s+8 l-4 m-2 | {held} kann nur noch quaken und springen. // {name} ist nie besser drauf gewesen. | ranken:e_frosch
> Schnell zurückverwandeln | l+3 | Ein zweiter Kuss löst den Fluch. // Der Frosch bleibt in der Gruppe. Aus Prinzip. | ranken

§ #zw_grab welt
Auf dem Friedhof von {ort} findet {held} einen Grabstein. Darauf steht {h_sein} Name. Und das Datum von nächstem Dienstag. // Die Spieler starren dich an.
< Ermitteln | s+8 l-2 t-4 | Es ist das Grab eines Namensvetters. Glaubt ihr. // {name} schaut ab jetzt bei jedem Dienstag im Kalender kurz nach. | schaedel
> Grabstein umstoßen | W12 s+4 ? l+2 : m-4 | Nichts passiert. Glück gehabt. :: Ein Geist erscheint und ist sehr beleidigt. | geister

§ #zw_wahl welt
In {ort} sind Bürgermeisterwahlen. {name} will, dass {held} kandidiert. // Das Wahlprogramm: „Mehr Tavernen, weniger Treppen“.
< Wahlkampf! | W11 s+8 t-5 ? m+4 laune+8 : laune-4 | {held} gewinnt mit 52 Prozent. // Die Gruppe hat jetzt eine Stadt und keine Ahnung, wie man sie führt. :: {held} verliert gegen einen Esel. // Der Esel macht seine Sache gut. | krone
> „Wir sind Abenteurer, keine Politiker.“ | l+3 laune-3 | Der Esel kandidiert trotzdem. // Und gewinnt.

§ #zw_rezension npc
Der Wirt von {ort} bittet die Gruppe um eine Bewertung. „Fünf Sterne wären toll.“ // Hinter ihm: ein Schild mit dreihundert schlechten Bewertungen von Abenteurern.
< Ehrlich bewerten | s+5 l-2 | „Bier gut, Ratten freundlich, Bett nur leicht verflucht.“ // Drei Sterne. Der Wirt weint vor Glück.
> Fünf Sterne – gegen Freibier | m+3 l-2 laune+4 | Die Gruppe trinkt umsonst. // Der Wirt hängt das Schild mit eurem Namen auf.

§ #zw_anleitung welt
Der Dungeon wird mit einer Anleitung geliefert. Bilder, keine Worte. // Am Ende bleiben zwei Schrauben übrig.
< Zusammenbauen | W10 s+6 t-4 ? m+3 : m-3 l-2 | Der Dungeon steht. Er wackelt etwas. // Die beiden Schrauben werden nie wieder erwähnt. :: Der Dungeon klappt zusammen. Mit der Gruppe drin.
> Die Schrauben behalten | s+5 l-3 | Die Schrauben sind magisch. // Niemand weiß, wofür. Es wird eine Kampagne daraus.

§ #zw_skelett npc
Ein Skelett bewirbt sich bei der Gruppe als Gefolgsmann. Mit Lebenslauf. // Unter „Schwächen“ steht: „tot“.
< Einstellen | s+8 l-3 m+2 | Er heißt Knochen-Klaus und ist sehr pünktlich. // Er braucht keinen Lohn, nur ab und zu Milch. Für die Knochen. | schaedel
> Absagen | l+2 laune-2 | „Wir melden uns.“ // Er schaut sehr traurig. Mit leeren Augenhöhlen. Trotzdem.

§ #zw_gott_wuerfel gott
Ein neuer Gott erscheint der Gruppe: der Gott der Würfel. Er ist eine kleine, leuchtende W20. // „Opfert mir … Würfel.“
< Einen Würfel opfern | s+6 laune+3 | Ein W4 verschwindet in einem Lichtblitz. // Die nächsten drei Würfe sind Zwanzigen. Dann nie wieder. | wuerfelregen
> Den Gott ignorieren | W12 l+2 ? : laune-8 s+3 | Der Gott zuckt mit den Kanten. :: Der Gott ist beleidigt. Ab jetzt rollt jeder Würfel vom Tisch.

§ #zw_regenfrosch welt
Es regnet in {ort}. Frösche. // Viele Frösche.
< Ein Frosch-Abenteuer | s+8 l-4 | Die Gruppe sammelt die Frösche ein. Einer ist ein verzauberter Prinz. // Einer ist {schurkeN}. | ranken:e_frosch
> Schirme auf! | l+3 t-2 | Das Geräusch auf den Schirmen klingt wie Applaus. // Feuchter Applaus.

§ #zw_doppelgaenger welt
In der Taverne sitzt jemand, der genauso aussieht wie {held}. Er trinkt {h_sein} Lieblingsbier. // Er bezahlt mit {h_sein} Geld.
< Konfrontation | W11 s+6 ? m+3 : m-3 laune-3 | Es ist ein Gestaltwandler. Er hat einen sehr schlechten Tag. :: Er ist schneller. Und er hat {item} mitgenommen. | schwerter
> Ihm Freundschaft anbieten | s+8 l-4 | Ab jetzt hat die Gruppe zwei {held}. // Einer ist deutlich netter. | herzen

§ #zw_bard npc
Ein Barde singt in {ort} ein Lied über die Gruppe. Es stimmt nichts daran. // Im Lied ist {held} drei Meter groß und kann fliegen.
< Ihm zuprosten | s+5 laune+5 | Das Lied wird ein Hit. // {name} besteht ab jetzt darauf, dass {held} drei Meter groß ist. | musik
> Korrigieren | l+3 laune-2 | Der Barde hört genau zu. // Die neue Version ist noch falscher.

§ #zw_schurke_geburtstag schurke
{schurkeN} hat heute Geburtstag. Er hat einen kleinen Hut auf. // Er fragt, ob die Helden heute nicht kämpfen könnten.
< Gemeinsam Kuchen essen | s+8 l-5 boss-3 | Für eine Stunde sitzen Gut und Böse an einem Tisch. // Es ist erschreckend nett. | konfetti
> Angreifen | m+5 laune-3 boss+2 | Der Hut fliegt. // Die Gruppe fühlt sich danach ein bisschen schäbig.

§ #zw_zeitreise welt schwer
Ein Zauber geht schief: Die Gruppe wird um einen Tag zurückgeworfen. Alles passiert noch einmal. // Diesmal wisst ihr, was kommt.
< Es diesmal besser machen | s+8 m+4 l-4 | Die Gruppe spielt die gleiche Szene noch einmal. Mit Vorwissen. // {name} sagt jede Zeile des Wirts mit. | portal
> Alles genau gleich machen | s+4 l+4 | Aus Angst vor Paradoxen. // Es passiert ein Paradox. Natürlich.

§ #sp_ritualkerze welt schwer eile:10
Ein Ritual läuft. Wenn die Kerze herunterbrennt, ist {ort} verloren. Zwei Hebel. Kein Hinweis. // Die Kerze ist schon halb weg.
< Der linke Hebel | W10 m+3 ? s+8 alle+4 : tod2 s+4 | Klick. Die Kerze erlischt. // Ihr habt {ort} gerettet. :: Klick. Etwas fällt von der Decke. | kerze
> Der rechte Hebel | W10 m+3 ? s+8 alle+4 : tod s+4 | Klick. Die Kerze erlischt. // Ihr habt {ort} gerettet. :: Klick. Der Boden öffnet sich. | kerze
~ Zögern | m-6 l+2 alle-6 | Die Kerze erlischt von allein. // {ort} wird nie wieder das sein, was es war. | dunkel

§ #sp_seilbruecke welt schwer
Ein Seil über einem Abgrund. Es hält zwei, aber nicht drei. Auf der anderen Seite rennt etwas heran. // {held} und {p2held} sind noch nicht drüben.
< Beide gleichzeitig | W12 s+8 ? beide+6 : tod tod2 | Das Seil knarrt, hält und reißt eine Sekunde, nachdem beide drüben sind. :: Das Seil reißt in der Mitte. | wind
> {held} zuerst, {p2held} hält das Seil | W9 s+6 ? beide+4 : tod2 laune2-6 | Beide schaffen es. // Ganz knapp. :: {p2held} hält das Seil bis zuletzt. | wind

§ #sp_zwei_stimmen welt schwer
Im Dunkeln hört {held} zwei Stimmen. Beide klingen wie {p2held}. Beide rufen um Hilfe. // Nur eine ist echt.
< Der linken folgen | W11 s+6 ? beide+6 : tod2 | Es ist {p2held}. Erschöpft, aber lebendig. :: Es ist etwas, das {p2held} sehr gut nachmachen kann. | geister
> Der rechten folgen | W11 s+6 ? beide+6 : tod | Es ist {p2held}. Sie fallen sich in die Arme. :: Was immer es ist, es hat {held} schon erwartet. | geister

§ #ws_zeitung tisch
{name} hat eine Zeitung zur Kampagne gemacht: „Der {ort}er Bote“. Mit Klatsch, Kleinanzeigen und Wetterbericht. // Auf Seite drei: ein Interview mit dem Oger.
< Laut vorlesen | s+8 alle+6 t-4 | Die Kleinanzeige „Biete Zauberstab, kaum gebraucht“ ist von {p2}s Helden. // {p2} ist empört. Und stolz. | lachen
> Für die nächste Pause | l+2 laune+4 | Die Zeitung wird herumgereicht. // Am Ende hat jeder eine eigene Lieblingsseite.

§ #ws_minis tisch
{name} hat Miniaturen aller Helden bemalt. Wochenlang. Heimlich. // Die Augen sind ein bisschen schief. Es ist perfekt.
< Sofort aufstellen | s+6 alle+8 | Jeder hält seine Mini eine Weile in der Hand. // Niemand sagt was. Alle grinsen. | herzen
> Eine Vitrine für sie besorgen | alle+6 l+2 | Die Minis stehen jetzt im Regal. // Daneben: ein Platz für die Gefallenen.

§ #ws_dank sl
Nach der Session sagt {name}: „Danke, dass du das jede Woche machst.“ // Einfach so. Ohne Anlass.
< „Gern.“ | vertrauen+8 laune+6 | Du sagst nur das eine Wort. // Auf dem Heimweg merkst du, dass du lächelst. | herzen
> „Ohne euch wäre es nichts.“ | alle+5 vertrauen+5 | Kurzes Schweigen. // Dann sagt {p2}: „Wir wissen.“ Alle lachen. | herzen

§ #ws_sternschnuppe tisch
Pause auf dem Balkon. Plötzlich zieht eine Sternschnuppe über den Himmel. // Fünf Erwachsene wünschen sich heimlich etwas.
< Fragen, was sich jeder gewünscht hat | s+5 alle+5 | „Eine natürliche 20 im Finale“, sagt {name}. // Die anderen sagen nichts. Sie lächeln nur. | sterne
> Den Moment genießen | alle+4 laune+5 | Niemand sagt etwas. // Dann geht es zurück an den Tisch. | sterne

§ #ws_alte_gruppe tisch
{name} hat ein altes Foto gefunden. Die allererste Session dieser Runde, vor Jahren. Alle sehen sehr jung aus. // Einer hat noch Haare.
< Zeigen | s+6 alle+6 laune+5 | Jeder erinnert sich an etwas anderes. // Alle erinnern sich an den Goblin, der „Mehmet“ hieß. | herzen
> Gleich nochmal ein Foto machen | alle+5 l+2 | Selbe Pose, selbe Ecke. // Zehn Jahre dazwischen. Die Freundschaft ist geblieben.

§ #gk_geist_nachbar geist
Im Spiel taucht ein Geist auf, der unbedingt seine Geschichte erzählen will. Sie ist sehr lang. // Und sie hat kein Ende.
< Bis zum Ende zuhören | s+5 t-5 l+2 | Die Geschichte endet nach einer Stunde mit „und dann bin ich gestorben“. // Ein Spieler weint. Vermutlich vor Erschöpfung.
> Höflich unterbrechen | l+3 laune-2 | Der Geist ist beleidigt. // Er wird die Gruppe ab jetzt bis zum Ende der Kampagne begleiten. Und weitererzählen. | geister

§ #ch_mimik_klo chaos
{name}: „{held} geht aufs Klo.“ Das Klo in der Taverne hat Zähne. // Es ist eine Mimik.
< Kampf auf dem Klo | W10 s+8 l-4 ? m+3 : m-3 | {held} besiegt das Klo mit heruntergelassener Hose. // Ein Sieg, über den man nicht spricht. Ständig. | schwerter
> Rückzug | s+5 laune-2 | {held} wird es nie wieder wagen, auf irgendein Klo zu gehen. // {name} spielt das konsequent durch.

§ #ch_ziege chaos
{name}: „Ich kaufe eine Ziege.“ // „Warum?“ – „Ich kaufe eine Ziege.“
< Die Ziege gehört zur Gruppe | s+7 l-4 | Die Ziege heißt Gerhard. Gerhard frisst die Karte. // Gerhard frisst später auch eine Tür. | lachen:e_ziege
> „Es gibt keine Ziegen hier.“ | l+3 laune-3 | {name} schaut aus dem Fenster. Draußen steht eine Ziege. // Eine echte. Auf dem Nachbarsgrundstück. Der Tisch tobt.

§ #ch_namen chaos
{name} hat sich einen Namen für {held} ausgedacht und will ihn jetzt ändern: von „{held}“ zu „Dr. Kevin Sturmklinge, Esquire“. // Mitten in der Kampagne.
< Einverstanden | s+6 l-4 | Ab jetzt heißt {h_er} so. // Die NPCs auch. Alle NPCs. Es ist anstrengend.
> „Nur auf Visitenkarten.“ | l+2 s+3 | {held} lässt sich Visitenkarten drucken. // Sie sind wunderschön. | gold

§ #ch_tavernenquiz chaos
In der Taverne ist Quizabend. Erster Preis: ein magisches Schwert. // Die Fragen sind alle über 90er-Popmusik. Im Fantasy-Mittelalter.
< Mitmachen | W11 s+8 t-4 ? m+4 laune+5 : laune-3 | Der Tisch weiß alles. Wirklich alles. // Das Schwert gehört euch. :: Die Gruppe verliert gegen einen Zwerg, der jedes Lied mitsingt. | musik
> „Was ist das für ein Quiz?“ | l+3 | Die Gruppe geht. // Der Zwerg gewinnt das Schwert und singt.

§ #rg_schatten regel
{name} will {h_sein} Schatten als Waffe benutzen. // „Er ist ja immer da, oder?“
< Ein Wurf entscheidet | W14 s+6 ? m+4 l-3 : laune-3 | Der Schatten löst sich und haut zu. // {name} wird jetzt jede Session fragen, ob das noch geht. :: Der Schatten weigert sich. Er hat Gewerkschaftsrechte.
> „Nein.“ | l+4 laune-4 | „Und wenn ich eine Fackel …?“ // „Nein.“

§ #sn_wasabi snack
{name} hält eine grüne Kugel für Guacamole. Es ist Wasabi. Viel Wasabi. // Die nächsten drei Minuten spricht {name} nur in Vokalen.
< Mitleid und Milch | laune+4 s+4 t-3 | Ein Glas Milch rettet die Situation. // {held} trägt ab jetzt eine Milchflasche. Aus Solidarität.
> Es ins Spiel nehmen | s+8 l-3 | {held} wird von einem Drachen gebissen und schreit genau so. // Der Tisch erkennt die Stimme sofort.

§ #sn_kaffeemaschine snack
Die Kaffeemaschine macht ein Geräusch, das niemand jemals gehört hat. Dann Rauch. // Es ist 21 Uhr. Die Nacht ist noch lang.
< Rettungsaktion | W10 t-4 ? s+4 laune+3 : laune-6 | Entkalken, ausschalten, einschalten. Sie läuft. Gerade so. :: Sie ist tot. Am Tisch wird eine Schweigeminute eingelegt. | explosion
> Tee. Es gibt Tee. | laune-3 l+2 | Fünf Erwachsene trinken Pfefferminztee wie eine Strafe.

§ #ha_sprachnachricht handy
{name} schickt aus Versehen eine Sprachnachricht an die Familiengruppe. 4 Minuten. // Die Mutter antwortet: „Wer ist der Beholder?“
< Laut vorlesen, was die Familie schreibt | s+7 alle+3 | Die Familie ist jetzt im Lore drin. Der Onkel hat eine Theorie zum Bösewicht. // Sie ist richtig. | lachen
> Löschen, sofort | t-2 laune-4 | „Gelöscht.“ – „Alle haben es schon gehört.“ // {name} versinkt im Sofa.

§ #ha_kalender handy
Alle Handys vibrieren. {name} hat aus Versehen einen Termin für alle angelegt: „Drachentöten“. Jeden Donnerstag. Bis 2045. // Niemand löscht ihn.
< Annehmen. Alle. | alle+6 s+5 | Fünf Kalender, ein Termin, kein Ende. // Das ist ab jetzt Vertrag. | herzen
> „Bitte bis 2030 begrenzen.“ | l+2 laune+3 | {name} korrigiert. // 2031 gibt es eine Krise.

§ #ka_maus katze
Die Katze bringt ein Geschenk an den Tisch. Eine Maus. // Sie lebt noch.
< Die Maus ist ein NPC | s+8 l-4 t-3 | Die Maus flitzt unter das Sofa. Im Spiel huscht im selben Moment ein Mäusekönig vorbei. // Er wird ein wichtiger Charakter. | ausruf
> Katze, Maus, Tür | W9 t-4 ? laune+3 : laune-6 s+4 | Die Maus wird per Gemüsedose befreit. :: Die Maus ist zwanzig Minuten verschwunden. Niemand hebt mehr die Füße auf den Boden.

§ #mu_lied musik
Ein Song läuft, und plötzlich singt der ganze Tisch mit. Laut. Falsch. Inbrünstig. // Es ist ein Song, den niemand zugeben würde zu kennen.
< Bis zum Ende! | s+7 alle+6 t-3 | Beim Refrain steht {name} auf dem Stuhl. // Niemand wird jemals darüber sprechen. Alle werden es nie vergessen. | musik
> Skippen | l+2 laune-3 | Ein enttäuschtes Raunen. // Dann wird das Lied heimlich auf drei Handys weitergehört.

§ #sel_flugzeug welt selten
Ein Heißluftballon landet im Garten. Wirklich. Mitten in der Session. Der Pilot fragt nach Wasser. // Er hat noch zwei Plätze frei.
< Zwei steigen ein | s+10 t-6 alle+6 | {name} und {p2} schweben eine Stunde über der Stadt. // Sie kommen zurück und erzählen es wie ein Abenteuer. Es ist eins. | sonne
> Ein Glas Wasser, ein Winken | laune+4 l+2 | Der Ballon steigt in den Abendhimmel. // Fünf Erwachsene winken ihm nach. Einfach so. | sonne
^ Er wird ein NPC | s+8 l-4 xp+10 | Der Ballonfahrer landet in {ort} und bringt die Rettung. // Er heißt Horst und hat einen Schnurrbart. | wind

§ #sel_nordlicht tisch selten
{name} stürmt vom Balkon herein: „Kommt raus. Sofort.“ // Am Himmel: Polarlicht. Grün und violett. Über der Stadt.
< Alle raus | s+8 alle+8 t-5 | Eine halbe Stunde im Dunkeln, die Köpfe im Nacken. // Kein Würfel kann das überbieten. | sterne
> Ins Finale einbauen | s+6 l-3 | Im Spiel öffnet sich der Himmel über {ort}. // Die echten Farben tanzen noch vor dem Fenster. | magie

`);
