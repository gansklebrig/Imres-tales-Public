/* =====================================================================
   TALES NEVER END – Kartenpaket 2: Chaot, Snackbeauftragter, Taktikerin,
   Neuling, Veteran, Handy-Gucker
   ===================================================================== */
(window.TNE_KARTEN = window.TNE_KARTEN || []).push(String.raw`

§ #ch_kneipe chaos
{name}: „{held} fängt eine Kneipenschlägerei an. Einfach so. Weil's lustig ist.“
< Schlägerei! | s+10 l-5 t+5 | Stühle fliegen, ein Zwerg wird als Waffe benutzt, der Wirt weint. | treffer
> Rausschmiss | l+5 s-4 laune-8 | Der Türsteher, ein Halbriese namens Bernd, wirft {held} auf die Straße.

§ #ch_tuer chaos
{name} will die Tür nicht öffnen. // {name} will die Tür ESSEN.
< Konstitutionswurf! | W13 s+10 l-8 ? m+3 : tod | {held} isst die Tür. Holzsplitter überall. Der Tisch ist sprachlos. :: {held} erstickt an einer Türklinke. Würdelos. | lachen
> Das geht nicht | l+5 laune-6 | „Warum nicht?!“ – „Weil… weil Türen nicht essbar sind.“

§ #ch_huhn chaos
{name}: „{held} adoptiert das Huhn.“ // „Es heißt jetzt General Gackerich und hat einen Rang.“
< General Gackerich lebt! | s+10 l-6 +huhn >>ch_huhn2 | Das Huhn bekommt einen Mini-Helm. Es wird zur wichtigsten Figur der Kampagne. | federn
> Das Huhn flieht | s+2 laune-5 | General Gackerich desertiert in der ersten Nacht.

§ #ch_huhn2 chaos kette wenn:huhn
General Gackerich, das Kampfhuhn, hat einen Gegner angegriffen und… gewonnen?
< Beförderung! | s+10 m+4 l-6 | Gackerich ist jetzt Feldmarschall. Er hat eine Armee aus Wachteln. | federn
> Das Huhn stirbt heroisch | s-4 l+5 -huhn | Ein Moment der Stille für General Gackerich. {name} hat echte Tränen. | traenen

§ #ch_verfuehren chaos
„Ich versuche, den Drachen zu verführen.“ {name} meint es todernst.
< Würfel auf Charisma | W16 s+12 l-8 ? +drachenliebe >>ch_drachenliebe2 : tod | Der Drache errötet. Ein Rauchwölkchen in Herzform. Oh nein. Oh doch. :: Der Drache ist nicht geschmeichelt. Er ist hungrig. | herzen
> Der Drache lacht | s+6 laune-4 | Der Drache lacht so sehr, dass er umfällt. Die Gruppe kann sich vorbeischleichen. | lachen

§ #ch_drachenliebe2 chaos kette wenn:drachenliebe
Der Drache taucht wieder auf. Mit einem Strauß aus brennenden Rosen. Er will {held}.
< Ja sagen | s+10 m+10 l-10 +drachenhochzeit >>ch_drachenliebe3 | Es wird eine Verlobung. Der Drache heißt Herbert und ist sehr romantisch. | herzen
> Schluss machen | s+4 m-6 l+4 | Herbert verwüstet aus Liebeskummer ein Dorf. Konsequenzen! | drache

§ #ch_drachenliebe3 chaos kette wenn:drachenhochzeit einmal
Die Drachenhochzeit! Herbert hat alle eingeladen: Zwerge, Elfen … // und {schurke}.
< Feiern! | s+12 m+6 l-8 drache | Es ist die beste Hochzeit aller Zeiten. Der Schurke weint gerührt in der zweiten Reihe. | konfetti
> Einspruch! | t+8 s+6 W12 ? m+5 : tod | {npc} erhebt Einspruch. Chaos! Ein Kampf in Hochzeitskleidern! :: Herbert frisst den Störenfried. Und versehentlich {held}. | drache

§ #ch_wuerfel chaos
{name} würfelt einfach, ohne dass du um einen Wurf gebeten hast. „20! Was passiert?“
< Lass es zählen | s+8 l-6 m+3 | „Du findest… äh… einen Schatz.“ Jetzt würfeln alle wild herum. | wuerfelregen
> Ignorieren | l+5 laune-6 | „Ich hab nicht nach einem Wurf gefragt.“ – „Aber 20!“

§ #ch_plan chaos
Die Gruppe hat eine Stunde lang einen perfekten Plan ausgearbeitet. {name}: „Ich renn einfach rein.“
< Konsequenzen | W12 s+8 t+8 ? m+5 : tod | Wunder geschehen: Der Ansturm funktioniert. Die Wachen sind zu verdutzt. :: {held} läuft in eine Speerreihe. Plan B. | schwerter
> Die anderen halten {held} fest | l+4 laune-8 | {aheld} packt {held} am Kragen. „Halt. Still.“

§ #ch_schwein chaos
{name}: „{held} wirft sich auf das Schwein und reitet es in die Schlacht.“
< Akrobatik! | W11 s+10 l-5 ? m+4 : m-4 | Das Schwein galoppiert, quiekt, rammt den Hauptmann. Triumph! :: Das Schwein wirft {held} in den Matsch. | lachen
> Das Schwein ist ein Polymorph | s+8 l-4 t+4 | Das Schwein verwandelt sich in einen Magier, der SEHR sauer ist. | magie

§ #ch_feuer chaos
„Kann ich die Taverne anzünden?“ // „Nur ein bisschen?“
< Nur ein bisschen | s+6 l-4 t+6 | Es war nicht nur ein bisschen. Die halbe Stadt sucht Wasser. | feuer
> Der Wirt greift ein | l+4 s+3 m-3 | Der Wirt löscht mit Bier. Die Gruppe schuldet ihm 300 Gold.

§ #ch_spitzname chaos
{name} nennt {schurkeN} ab sofort nur noch „Schnuckelputz“.
< Schurke hört es | s+8 l-4 t+4 | {schurkeN} ist so beleidigt, dass es sofort zum Angriff kommt. Viel zu früh! | ausruf
> Bleibt hängen | s+6 l-5 | Bald sagen alle „Schnuckelputz“. Auch du. Es ruiniert jede ernste Szene. | lachen

§ #ch_nackt chaos
{name}: „{held} geht nackt in die Schlacht, weil das psychologische Kriegsführung ist.“
< Einschüchtern-Wurf | W13 s+10 l-6 ? m+4 : m-6 | Die Gegner fliehen schreiend. Psychologisch korrekt! :: Sie lachen nur. Dann schießen sie. | lachen
> Kälte-Schaden | s+5 l+4 | Es ist Winter. {held} bekommt Erkältung. Für drei Sessions. | schnee

§ #ch_teleport chaos
Der Zauberer der Gruppe hat einen Teleportationsstab gefunden. {name} hat ihn sich geschnappt.
< Wild teleportieren! | W10 s+8 t+6 l-6 ? m+3 : tod | {held} landet in der Schatzkammer von {schurkeN}. Jackpot! :: {held} landet in einer Wand. Halb drin. Für immer. | portal
> Stab ist verflucht | s+5 l+2 m-4 | Jede Teleportation endet in einem Kuhstall. | lachen

§ #ch_grimasse chaos wenn:laune<30
{name} gähnt demonstrativ und baut einen Turm aus Würfeln. „Passiert hier heute noch was?“
< Explosion! | s+8 t+8 m+3 laune+20 | Aus dem Nichts explodiert die Burg. Niemand weiß warum. {name} ist glücklich. | explosion
> „Gleich!“ | t-3 laune-6 | Der Würfelturm fällt. Auf deine Notizen.

§ #ch_npc chaos
{name} fragt {npcN}: „Willst du mit uns abenteuern? Wir haben Snacks.“
< Ja! | s+8 m+3 l-3 | {npcN} schließt sich an. Unvorbereitet. In Hausschuhen. | konfetti
> „Nein, ich hab Kinder“ | l+4 s+3 | {npcN} bleibt. Aber gibt einen Rabatt.

§ #ch_gift chaos
„Ich trinke den unbekannten Trank. Alle drei. Gleichzeitig.“
< Zufallstabelle | W8 s+10 l-5 ? m+8 : tod | {held} kann jetzt fliegen, Feuer spucken und Gedanken lesen. Für eine Stunde. :: {held} verwandelt sich in einen Frosch. Einen toten Frosch. | gift
> Nur Bauchweh | s+6 t-3 | {held} hat sehr laute Bauchgeräusche. Schleichen ist vorbei. | lachen

§ #ch_wette chaos
{name} wettet mit {npcN}, dass {held} einen Bären im Armdrücken besiegt.
< Bär holen! | W14 s+10 l-6 ? m+6 : tod | {held} gewinnt. Der Bär ist jetzt ein Fan. :: Der Bär gewinnt. Und isst den Verlierer. Das war die Wette. | treffer
> Die Wette platzt | s+3 l+3 | Kein Bär verfügbar. Nur ein Dachs. Der Dachs gewinnt trotzdem.

§ #ch_kostuem chaos
{name} erscheint heute im echten Kostüm von {held}. Mit Pappschwert.
< Inspiration-Bonus | s+10 l-2 laune+10 | Der ganze Abend fühlt sich wie ein Theaterstück an. Fantastisch. | konfetti
> Zu viel des Guten | s+4 t-4 | Das Pappschwert trifft dreimal deine Cola.

§ #ch_furz chaos trash
{name} besteht darauf, dass {held} ab jetzt einen „Furzzauber“ als Signaturangriff nutzt.
< Erlauben | s+10 l-10 m+2 | „Flatulentia Maxima!“ Es wirkt erschreckend gut gegen Untote. | gift
> Nein. Bitte. | l+5 s-3 laune-8 | {name} macht trotzdem das Geräusch. Bei jedem Angriff.

§ #ch_bard chaos
{name} spielt jetzt einen Barden, der jeden NSC anflirtet. Ausnahmslos.
< Würfel auf Verführen | W15 s+10 l-5 ? m+3 : s+3 | Der Stadtwächter schmilzt dahin. Freier Eintritt! :: Die Stadtwächterin wirft einen Stiefel. | herzen
> NSC flirtet zurück | s+8 l-3 t-3 | Plötzlich verfolgt ein verliebter Oger die Gruppe. | herzen

§ #ch_karte chaos
{name} zeichnet auf deine Weltkarte heimlich einen riesigen Penis-Berg.
< Kanonisch machen | s+10 l-10 | Der „Große Zipfelberg“ ist jetzt ein offizieller Ort. Er hat ein Kloster. | lachen
> Wegradieren | l+4 laune-6 | Du radierst. Man sieht es trotzdem noch ein bisschen.

§ #ch_alleinflucht chaos
Die Gruppe ist umzingelt. {name} hat einen Plan. // „Ich opfere {aheld} und renne.“
< Erlauben (oh je) | W12 s+6 t+6 ? tod2 m+3 : tod | {aheld} wird zurückgelassen. Der Tisch ist schockiert. Das wird nachwirken. :: Beide sterben. Das Karma war schnell. | schaedel
> „Ihr seid ein Team!“ | l+3 alle+2 laune-6 | Die Gruppe kämpft sich gemeinsam frei. Mit Mühe.

§ #ch_monolog chaos
Gerade als {schurkeN} zum Monolog ansetzen will, fragt {name}: „Wie alt bist du eigentlich?“
< Schurke antwortet | s+8 l-4 t-3 | „Ich bin… 2.004.“ – „Hast du da Freunde?“ Der Schurke wird nachdenklich. | lachen
> Schurke ignoriert es | l+4 laune-4 | Der Monolog geht weiter. {name} flüstert die ganze Zeit „Opa“.

§ #ch_noob chaos wenn:typ:neu
{name} bringt dem Neuling bei: „Wenn du eine 1 würfelst, musst du einen Shot trinken.“
< Hausregel! | s+8 l-4 t-3 | Ab sofort wird jede 1 gefeiert. Mit Apfelsaft. Meistens.
> Nein, keine Regel | l+3 laune-5 | „Okay, aber der Würfel muss dann ins Gefängnis.“ Es gibt jetzt ein Würfelgefängnis.

§ #sn_pizza snack
{name}: „Sollen wir Pizza bestellen? Jetzt? Wir sind mitten im Dungeon.“
< Pizza! | s+8 t-8 alle+5 | 40 Minuten später: alle satt, Dungeon vergessen. | pizza
> Nach dem Kampf | t+4 laune-6 | Der Kampf wird plötzlich sehr schnell. Hunger beschleunigt.

§ #sn_chips snack
Die Chips sind alle. // {name} schaut dich an wie ein Paladin auf einen Untoten.
< Pause zum Einkaufen | t-10 s+4 laune+10 | Zwanzig Minuten Spätkauf-Mission. Ein episches Abenteuer für sich. | staub
> Weiterspielen | s-5 laune-10 | {name} isst traurig die Krümel aus der Tüte.

§ #sn_essen snack
{name} beschreibt jedes Essen, das {held} in der Taverne bestellt, in epischer Länge.
< Mitspielen | s+6 t-6 l+3 | Du erfindest ein Menü mit 12 Gängen. {held} probiert alles. | staub
> Kurz halten | t+4 laune-6 | „Es gibt Eintopf.“ – „Was für ein Eintopf?“ – „…Eintopf.“

§ #sn_tavernenbesitzer snack
{name}: „{held} will die Taverne kaufen und Wirt werden.“
< Neue Nebenhandlung | l+3 s+8 t-5 +taverne | Die „Goldene Gabel“ gehört jetzt der Gruppe! Hypothek inklusive. | gold
> Zu teuer | l+4 laune-6 | Die Taverne kostet 50.000 Gold. {held} hat 14.

§ #sn_taverne2 npc wenn:taverne
Die Gruppentaverne „Goldene Gabel“ hat ein Problem: Ratten. Sehr große Ratten. Mit Gewerkschaft.
< Verhandeln | l+5 s+6 | Die Ratten bekommen einen Tisch und Käse. Sie werden Stammgäste. | lachen
> Kammerjäger-Quest | m+5 t+3 | Ein Kampf im eigenen Keller. Bierfässer gehen zu Bruch. | schwerter

§ #sn_kekse snack
{name} hat Kekse in Form von Monstern gebacken. // „Wer den Beholder isst, hat Vorteil auf den nächsten Wurf.“
< Keks-Regel annehmen | s+8 m+3 l-3 | Alle essen strategisch Kekse. Der Drachen-Keks ist heiß umkämpft. | konfetti
> Nur essen | s+5 t-3 | Die Kekse sind großartig. Das Spiel pausiert für 10 Minuten.

§ #sn_mittagsschlaf snack wenn:t<35
{name} ist nach dem dritten Teller Nudeln am Tisch eingeschlafen.
< Held schläft auch | s+5 t-3 l-2 | {held} schläft im Spiel mitten im Kampf ein. Wird von einem Kobold mit Hut dekoriert. | zzz
> Wecken | t+5 laune-8 | {name} schreckt hoch. „Ich greife an! Wen?“

§ #sn_getraenk snack
{name} erfindet einen Cocktail namens „Heiltrank“ und mixt ihn für alle.
< Ingame-Bonus | s+8 m+2 l-3 | Wer trinkt, bekommt 1W4 Trefferpunkte. Im Spiel. Real gibt's Kopfschmerz. | heilung
> Lieber Wasser | l+3 s-2 | Der „Heiltrank“ bleibt unangetastet. Er ist knallgrün.

§ #sn_rezept snack
{name}: „Kann {held} Kochen als Fertigkeit lernen? Ich will Monster kochen.“
< Monster-Küche! | s+8 l-2 t-3 | Gegrillte Riesenspinne. Sie schmeckt nach Hühnchen. Natürlich. | feuer
> „Das ist kein Kochspiel“ | l+3 laune-8 | {name} kocht trotzdem. Im Kopf.

§ #sn_bauch snack
{held} soll eine Woche hungern, weil der Proviant ausgegangen ist.
< Realistisch: Erschöpfung | l+8 m-6 s-4 | Die Gruppe wird schwächer, gereizter, hungriger. Wie im echten Leben. | staub
> Pilze im Wald | s+4 W10 ? m+3 : tod | Lecker! // Und nur leicht halluzinogen. :: Das waren die anderen Pilze. Die tödlichen. | gift

§ #sn_spaeter snack
{name}: „Können wir die Pause bitte etwas länger machen? Ich hab noch Lasagne.“
< Lasagne-Pause | s+6 t-8 alle+4 | Lasagne verbindet. Alle reden über alte Kampagnen. | staub
> Kurz halten | t+4 laune-5 | Die Lasagne wird am Tisch gegessen. Auf den Bögen.

§ #tk_plan taktik
{name} hat ein Karopapier mit Flankenmanövern, Sichtlinien und Fluchtwegen gezeichnet.
< Belohnen | m+6 l+5 t-6 laune+10 | Der Plan funktioniert perfekt. Die Banditen werden präzise ausmanövriert. | schwerter
> Plan durchkreuzen | s+4 m-4 laune-10 | Ein Erdbeben. Kein Plan überlebt den Kontakt mit dem Spielleiter. | erdbeben

§ #tk_raster taktik
{name}: „Können wir die Kämpfe mit Miniaturen und Gelände spielen? Ich hab Styropor-Ruinen gebaut!“
< Ja! | l+6 s+4 t-8 laune+12 | Die Ruinen sind großartig. Die Kämpfe dauern doppelt so lang. | staub
> Theater des Geistes | t+5 l-3 laune-8 | „Stell dir vor, da sind Ruinen.“ {name} streichelt {seine} Styropor-Säule.

§ #tk_rueckzug taktik
{name}: „Wir sollten uns zurückziehen. Die Gegner sind uns 3 zu 1 überlegen.“
< Klug zurückziehen | l+6 m-3 t-3 | Ein geordneter Rückzug. Niemand stirbt. Langweilig, aber weise.
> Die anderen wollen kämpfen | W13 s+6 t+5 ? m+5 lvl : tod2 | Gegen jede Chance gewinnt die Gruppe! Alle steigen auf! :: {name} hatte recht. Ein Held bleibt auf dem Feld. | treffer

§ #tk_falle taktik
{name} will eine elaborierte Falle für {monster} bauen: Seile, Fässer, Öl und ein Kronleuchter.
< Bauen lassen | m+6 s+6 t-6 W10 ? lvl : m-4 | Die Falle funktioniert in jeder Stufe. Rube-Goldberg wäre stolz. :: Die Falle schnappt zu. Bei der Gruppe. | explosion
> Keine Zeit | t+4 laune-8 | Die Monster kommen, bevor das zweite Seil gespannt ist.

§ #tk_zeitplan taktik
{name} möchte die Positionen aller Helden in jeder Sekunde der Kampfrunde wissen.
< Präzise Runden | l+8 t-8 | Jede Runde dauert 6 Sekunden. Im Spiel. Am Tisch 12 Minuten.
> Grob schätzen | t+5 laune-6 | „Ihr seid ungefähr da.“ – „UNGEFÄHR?“

§ #tk_belagerung taktik
{name}: „Was, wenn wir die Burg von {schurkeN} belagern? Mit Söldnern und Katapulten?“
< Massenschlacht! | m+8 l+3 t-5 +armee | Die Gruppe heuert Söldner an. Ein Feldzug beginnt! | schwerter
> Zu groß | l+3 laune-6 | „Ihr seid vier Leute.“

§ #tk_armee npc wenn:armee
Die Söldner der Gruppe verlangen Bezahlung. Der Hauptmann wird ungeduldig.
< Bezahlen | m+5 l+5 s-3 | Die Kasse ist leer, aber die Armee loyal. Weiter geht's. | gold
> Mit Ruhm vertrösten | W13 s+4 ? m+3 : m-8 -armee | Der Hauptmann lässt sich überreden. Noch. :: Die Söldner laufen über. Zu {schurkeN}. | schwerter

§ #tk_flanke taktik wenn:laune<30
{name} seufzt: „Ihr ignoriert jede Taktik. Ich kann auch gleich zu Hause bleiben.“
< Taktik-Kampf | m+5 t-4 l+3 laune+20 | Ein Kampf, der nur mit Teamwork zu gewinnen ist. {name} dirigiert alle. | schwerter
> „Ist halt Chaos“ | s+3 laune-10 | {name} packt das Karopapier weg.

§ #tk_kriegsrat taktik
Vor dem großen Kampf will {name} einen Kriegsrat abhalten. Mit Tagesordnung.
< Kriegsrat | l+6 t-6 m+4 | Drei Stunden Diskussion. Der Plan ist wasserdicht. | staub
> „Ihr greift an.“ | t+6 laune-6 | Der Kriegsrat dauert eine Minute.

§ #tk_gegnerwerte taktik
{name}: „Welche Rüstungsklasse hat der Oger genau?“
< Verraten | l+3 t+3 m+2 | „16.“ {name} rechnet. Und plant. Gnadenlos.
> „Würfel, dann siehst du's“ | s+3 l-2 laune-4 | {name} würfelt, beobachtet dein Gesicht und schätzt 15–17.

§ #nb_wuerfel neu
{name} hält einen W12 hoch. „Welcher ist das nochmal? Der Zwölfer? Wofür braucht man den?“
< Geduldig erklären | l+3 t-5 laune+10 | Alle erklären gleichzeitig. {name} versteht nur „Barbaren“.
> „Für Barbaren“ | s+4 t+3 | „Wer ist Barbara?“

§ #nb_klasse neu
{name}: „Ich weiß nicht, was ich spielen soll. Was macht denn so ein Zauberer?“
< Kurze Erklärung | t+3 laune+5 | {name} wählt Zauberer und verwechselt sofort Feuerball mit Feuerwerk. | magie
> Die Gruppe hilft | s+5 t-6 laune+8 | Vier Leute bauen gleichzeitig {name}s Charakter. Er ist absurd.

§ #nb_mut neu
{name} traut sich nicht zu sprechen. {held} steht stumm in der Ecke.
< Spotlight geben | s+5 t-3 laune+15 | {npc} spricht {held} direkt an. {name} antwortet zögerlich – und wird plötzlich mutig. | herzen
> Laufen lassen | t+3 laune-8 | {held} bleibt stumm. Vielleicht nächste Woche.

§ #nb_regel neu
{name} fragt bei jedem Wurf: „Muss ich jetzt den großen oder den kleinen Würfel nehmen?“
< Spickzettel basteln | l+4 t+2 laune+8 | Ein Spickzettel mit Bildchen. {name} ist begeistert.
> Einfach machen lassen | s+5 l-5 | {name} würfelt mit einem W6 für einen Feuerball. Niemand korrigiert. | wuerfelregen

§ #nb_unschuld neu
Der Neuling fragt: „Darf ich den Schurken nicht einfach… nett fragen?“
< Probier's | W15 s+8 l-3 ? frieden : laune-6 | Der Schurke ist so überrascht, dass er zustimmt. Der Tisch ist fassungslos. :: Der Schurke lacht. „Niedlich.“ | herzen
> „So läuft das nicht“ | l+4 laune-8 | {name} wird stiller.

§ #nb_tod neu wenn:tote>0
{name} versteht nicht, warum der Held von {anderer} tot ist. „Kommt der nicht wieder?“
< Wiederbelebung erklären | l+3 s+3 | „Mit genug Gold und einem Kleriker schon.“ {name} wird nachdenklich.
> „Tot ist tot“ | l+5 s-4 laune-6 | {name} schaut den eigenen Charakterbogen jetzt sehr besorgt an.

§ #nb_freude neu
{name} würfelt die erste 20 {seines} Lebens. {Er} springt auf.
< Groß feiern | s+10 m+4 laune+15 | Der ganze Tisch jubelt. Eine Legende ist geboren. | konfetti
> Gelassen bleiben | s+3 laune+3 | „Schön. Du triffst.“ {name} grinst trotzdem den ganzen Abend.

§ #nb_buch neu
{name} hat sich heimlich das Spielleiter-Handbuch gekauft und kennt jetzt alle Monster.
< Neue Monster erfinden | l-3 s+5 t-3 | Du erfindest den „Pfannkuchenwurm“. {name} blättert vergeblich.
> Stolz sein | l+3 laune+8 | „Ich will auch mal leiten!“ Eine neue Spielleitung ist geboren.

§ #nb_verwirrt neu wenn:l<30
{name} ist völlig verloren: „Moment… warum ist der König jetzt ein Pferd? Und warum sind wir auf dem Mond?“
< Zusammenfassen | l+8 t-5 laune+10 | Du erklärst alles noch einmal. Es klingt laut ausgesprochen sogar noch verrückter. | frage
> „Ist halt so“ | s+3 laune-10 | {name} schreibt „Pferd = König?“ auf den Bogen.

§ #nb_fragen neu
{name} fragt: „Kann ich eigentlich alles machen? Echt alles?“
< „Fast alles“ | s+6 l+2 laune+8 | {name} probiert es aus: {held} versucht, mit einem Fisch zu reden. Der Fisch antwortet. | wellen
> „Innerhalb der Regeln“ | l+5 laune-4 | {name} liest das Regelbuch vom ersten Kapitel an. Ab morgen.

§ #nb_freund neu
{name} hat jemanden mitgebracht, der „nur mal zuschauen“ will.
< Darf mitspielen | neu s+5 t-4 | Ab nächster Session ist die Begleitung dabei. Der Charakter heißt angeblich Glitzerfee 3000. | konfetti
> Nur zuschauen | l+2 t+2 | Der Besuch sitzt daneben und kommentiert jeden Wurf wie ein Fußballspiel.

§ #vt_frueher veteran
{name}: „Früher, in der zweiten Edition, hätte {held} das gar nicht überlebt.“
< Old-School-Regeln | l+6 m-6 laune+10 | Ab jetzt: Fallen töten sofort. Willkommen 1987. | schaedel
> „Gut, dass wir jetzt spielen“ | s+3 laune-8 | {name} erzählt trotzdem die Geschichte von {seinem} Elf, der 1989 an einer Tür starb.

§ #vt_anekdote veteran
{name} erzählt zum vierten Mal die Geschichte, wie {seine} Gruppe 1994 einen Gott getötet hat.
< Zuhören | s+3 t-8 laune+10 | Die Geschichte wird jedes Mal besser. Diesmal waren es zwei Götter. | staub
> Sanft unterbrechen | t+5 laune-8 | „Spannend! Aber zurück zu… “ {name} murmelt weiter.

§ #vt_tipp veteran
{name} flüstert dir zu: „Lass sie ruhig mal verlieren. Verlieren macht Geschichten.“
< Weise Worte | m-6 l+5 s+3 | Ein harter Kampf, ein Rückzug, ein Sieg später. Die Gruppe wächst daran. | treffer
> „Heute nicht“ | m+3 laune-5 | {name} zuckt mit den Schultern. „Du wirst es lernen.“

§ #vt_mentor veteran wenn:typ:neu
{name} nimmt den Neuling unter {seine} Fittiche und erklärt alles. Auch, was du falsch machst.
< Das ist schön | l+4 s+4 alle+5 | Der Neuling lernt schnell. Und hat jetzt Meinungen über Initiative. | herzen
> „Ich bin der SL!“ | l+2 laune-8 | {name} hebt die Hände. „Ich mein ja nur.“

§ #vt_power veteran wenn:m>75
{name}: „Die Gruppe ist viel zu stark. Wo ist die Herausforderung? Wo ist die ANGST?“
< Ein tödlicher Dungeon | m-10 l+4 W12 ? s+5 : tod | Ein Dungeon voller Fallen. Die Spieler zittern. {name} lächelt zufrieden. :: Eine Falle zu viel. Ein Held fällt. {name}: „So muss das.“ | schaedel
> „Lass ihnen den Spaß“ | m+3 laune-10 | {name} verschränkt die Arme und denkt an 1987.

§ #vt_regel veteran
{name} und {anderer} streiten über eine Regel, die es in dieser Edition gar nicht mehr gibt.
< Du entscheidest | l+5 t+3 alle-3 | Du findest einen Kompromiss. Beide sind gleich unzufrieden.
> Lass sie diskutieren | t-10 l+4 s-3 | Nach 25 Minuten einigen sie sich: Beide hatten recht. Irgendwie. | staub

§ #vt_wuerfel veteran
{name} benutzt seit 30 Jahren denselben Glückswürfel. Gerade ist er unter den Tisch gerollt.
< Suchaktion! | t-8 s+5 | Alle krabbeln unter den Tisch. Der Würfel zeigt 20. Er wird geehrt. | wuerfelregen
> Ersatzwürfel | s-3 laune-10 | {name} würfelt mit einem fremden Würfel. Drei Einsen hintereinander. {name} schweigt.

§ #vt_karte veteran
{name} erkennt, dass dein Dungeon fast exakt einem Abenteuer von 1983 entspricht.
< Zugeben | s+5 l+2 laune+8 | „Hommage!“ {name} grinst und verrät keine Fallen. Fast keine.
> Abstreiten | l-3 laune-5 | „Reiner Zufall.“ {name} kennt jeden Raum. Und schweigt vielsagend.

§ #vt_ritter veteran
{name}: „Unser Paladin müsste eigentlich seinen Schwur gebrochen haben. Er hat gerade gelogen.“
< Konsequenzen | l+8 m-5 s+3 | Der Paladin verliert seine Kräfte, bis er Buße tut. Drama! | ausruf
> Nur eine Notlüge | l-3 laune-6 | „Die zählen nicht.“ – „Seit wann?“

§ #hd_handy handy
{name} schaut seit zehn Minuten aufs Handy. „Hä? Wir sind dran?“
< Direkt ansprechen | t-3 laune+3 l+2 | „{held}, ein Ork steht vor dir.“ – „Oh! Äh! Ich greif an!“
> Held entführen lassen | s+6 l-3 t+3 laune-5 | {held} wird von Harpyien entführt. {name} merkt es eine Stunde später. | lachen

§ #hd_memes handy
{name} zeigt dem ganzen Tisch ein Meme. Dann noch eins. Und noch eins.
< Lachen, dann weiter | s+6 t-6 | Die Memes sind gut. Das Spiel ruht 15 Minuten. | lachen
> Handykorb! | l+4 laune-10 s+2 | Alle Handys kommen in einen Korb. {name} sieht aus, als hätte {er} ein Haustier verloren.

§ #hd_recherche handy
{name} googelt mitten im Spiel die Werte des Monsters, gegen das ihr kämpft.
< Monster umbauen | l-3 s+5 | Das Monster hat jetzt zwei Köpfe. „Steht nicht im Internet!“ – „Jetzt schon.“ | ausruf
> Ignorieren | l+3 m+3 laune+2 | {name} kennt die Schwachstelle. Die Gruppe gewinnt schnell.

§ #hd_musik handy
{name} hat eine Playlist mit „epischer Kampfmusik“ und will sie laufen lassen.
< Musik an! | s+8 t+4 | Der Kampf fühlt sich an wie im Kino. Bis Werbung kommt. | musik
> Lieber Ruhe | l+3 laune-6 | {name} summt die Melodie leise. Sehr leise. Ununterbrochen.

§ #hd_zufall handy
{name} hat eine Würfel-App und würfelt nur noch digital.
< Echte Würfel! | l+5 laune-6 | „Würfel müssen Klack machen!“ {name} leiht sich einen W20.
> Ist doch egal | t+5 s+2 | Die App hat Animationen und Soundeffekte. Bei jeder 20 explodiert Konfetti. | konfetti

§ #hd_lange handy wenn:t<35
{name} gähnt. // „Ich zock zwischendurch mal was am Handy. Ruft mich, wenn ich dran bin.“
< Tempo machen | t+10 s+4 laune+15 | Zack, Kampf vorbei, neuer Ort, Verfolgungsjagd! {name} legt das Handy weg. | schwerter
> „Okay…“ | laune-8 t-3 | {name} spielt jetzt Candy Crush. Die Gruppe verliert einen Mitstreiter.

§ #hd_live handy
{name} fragt, ob man die Session nicht live streamen könnte. „Das wär voll gut!“
< Streamen! | s+6 t+4 l-3 | Drei Zuschauer. Einer davon ist {name}s Oma. Sie schreibt „schön“.
> Lieber privat | l+3 s+2 laune-6 | „Vielleicht beim nächsten Mal“, sagt {name} zum fünften Mal.

§ #hd_wiki handy
{name}: „Ich hab für unsere Kampagne ein Wiki angelegt! Mit allen NSCs!“
< Großartig! | l+8 s+3 laune+10 | Das Wiki hat 140 Seiten. Und einen Artikel über das Huhn.
> „Hat das jemand gelesen?“ | s+2 laune-6 | Niemand hat es gelesen. Aber es ist sehr schön.
`);
