/* =====================================================================
   TALES NEVER END – Kartenpaket 4: Spielleiter, NSC, Schurke, Welt,
   Würfel, Regelbuch, Geister, Götter, Erzählstränge, späte Kampagnen
   ===================================================================== */
(window.TNE_KARTEN = window.TNE_KARTEN || []).push(String.raw`

§ #sl_twist sl
Du hast eine Idee für einen gewaltigen Plot-Twist: {npc} ist in Wahrheit {schurke} in Verkleidung!
< Twist enthüllen | s+8 l-5 t+5 | Die Masken fallen! Der Tisch springt auf. Jemand wirft Chips. | ausruf
> Subtil andeuten | l+5 t-3 +twist | Du streust kleine Hinweise. Nur eine Person am Tisch merkt es. Und schweigt. Noch.

§ #sl_twist2 sl wenn:twist
Deine subtilen Hinweise haben gewirkt. Ein Spieler sagt: „Moment… war {npc} etwa die ganze Zeit…?“
< „Ja!“ | s+10 l+4 -twist | Der Groschen fällt bei allen gleichzeitig. Bester Moment der Kampagne! | ausruf
> „Keine Ahnung, wovon du redest“ | l+3 s+3 | Die Paranoia am Tisch steigt auf 100. Jeder NSC wird verhört.

§ #sl_railroad sl
Die Gruppe will nach Süden. // Dein ganzer Plot liegt im Norden.
< Sie umlenken | l+4 s-4 alle-4 | Eine Brücke ist eingestürzt. Im Süden. Und im Westen. Und im Osten. Seltsam.
> Mitgehen und improvisieren | W12 s+6 ? l+3 : l-6 | Im Süden findest du spontan eine noch bessere Geschichte! :: Im Süden ist… nichts. Du erfindest panisch ein Dorf namens „Dorf“. | magie

§ #sl_nsc sl
Du merkst, dass alle NSCs in deiner Welt gleich klingen: wie du mit tiefer Stimme.
< Mehr Stimmen! | s+6 l+3 t-3 | Der Schmied lispelt, die Königin flüstert, der Goblin quietscht. Du bist heiser. | musik
> Notizzettel | l+4 | Du schreibst zu jedem NSC eine Eigenart. „Kratzt sich ständig.“ Alle kratzen sich jetzt.

§ #sl_ausgedacht sl
Ein Spieler fragt nach dem Namen des Wirts. Du hast keinen.
< „Bob.“ | s+5 l-3 | Bob ist jetzt die wichtigste Figur der Kampagne. Alle lieben Bob.
> Namensliste | l+4 t-2 | Du ziehst einen Namen aus deiner Liste: „Gundolf Eichenfass“. Klingt nach Plan.

§ #sl_fudge sl
Hinter dem Schirm würfelst du: Der Oger trifft kritisch. Das würde {aheld} töten.
< Würfel lügen | l-5 s+3 m+3 | „Er… verfehlt knapp.“ Niemand muss es je erfahren.
> Würfel sprechen | l+6 tod2 s-3 | Du zeigst den Würfel. Kritischer Treffer. {aheld} fällt. Respekt am Tisch. | schaedel

§ #sl_belohnung sl
Die Gruppe hat einen großartigen Plan gehabt. Wie belohnst du sie?
< Inspiration für alle | s+6 m+3 alle+4 | Kleine Bonusmarken. Alle fühlen sich gesehen. | funkeln
> Ein magischer Gegenstand | m+8 l-2 | Die Gruppe findet {item}. Fast zu stark. | gold

§ #sl_tempo sl wenn:t<30
Die Session zieht sich. // Jemand hat begonnen, die Chipskrümel zu sortieren.
< Ninja-Angriff! | t+12 s+4 l-3 | Aus den Schatten springen Ninjas. Warum? Egal! Alle sind wach! | schwerter
> Zeitsprung | t+10 l+2 | „Drei Tage später erreicht ihr {ort}.“ Erleichterung.

§ #sl_tempohoch sl wenn:t>75
Alles passiert so schnell, dass niemand mehr weiß, wo die Gruppe gerade ist.
< Lagerfeuer-Szene | t-12 s+3 l+3 | Ein ruhiger Abend. Die Helden reden. Alle atmen durch. | feuer
> Weiter rasen | t+5 s+3 | „Und dann noch ein Drache!“ – „SCHON WIEDER?“ | drache

§ #sl_logikweg sl wenn:l<25
Die Spieler schauen sich verwirrt an. Nichts in deiner Welt ergibt mehr Sinn.
< Alles war ein Traum | l+15 s-6 | „…und dann wacht ihr auf.“ Kollektives Stöhnen. Aber jetzt ergibt es wieder Sinn. | zzz
> Der Wahnsinn wird Plot | s+5 l+6 | Ein Gott des Chaos steckt dahinter! Der Unsinn hatte System! | portal

§ #sl_logikhoch sl wenn:l>78
Die Gruppe diskutiert seit 20 Minuten, wie viel Hafer ein Pferd pro Tag frisst.
< Abkürzung | l-12 t+6 s+3 | „Das Pferd frisst genug.“ Erleichterung. Zurück zum Abenteuer.
> Exakt ausrechnen | l+5 t-6 laune-3 | 6 Kilo. {name} notiert es. Das Pferd wird es nie erfahren.

§ #sl_macht sl wenn:m>80
Die Helden sind so stark, dass sie mit Goblins Jonglieren spielen.
< Ein mächtiger Gegner | m-14 t+3 W12 ? s+5 : tod2 | Ein Erzlich tritt auf. Endlich zittern sie wieder. :: Der Erzlich hält nichts zurück. Ein Held stirbt. Es war wohl nötig. | geister
> Göttliche Prüfung | m-8 l+3 | Die Götter nehmen ihnen ein paar Kräfte. „Damit ihr demütig bleibt.“ | sonne

§ #sl_machtweg sl wenn:m<22
Die Helden sind so schwach, dass ein einzelner Gänserich sie in die Flucht schlägt.
< Ein Mentor hilft | m+12 l-3 | Ein alter Magier bringt der Gruppe Tricks bei. Endlich Hoffnung. | magie
> Schatzfund | m+10 s+3 l-2 | Eine Kiste voller Waffen! Gerade rechtzeitig. Zu rechtzeitig. | gold

§ #sl_spassweg sl wenn:s<25
Am Tisch herrscht Grabesstimmung. Niemand lacht mehr.
< Ein lustiger NSC | s+14 l-4 | Ein Gnom mit Hut verkauft „magische“ Steine. Einer davon furzt. | lachen
> Gemeinsamer Sieg | s+10 m+3 | Ein leichter Kampf, ein großer Schatz. Endlich wieder Jubel! | konfetti

§ #sl_spasshoch sl wenn:s>80
Niemand nimmt mehr irgendetwas ernst. Gerade tanzt der Barbar mit dem Oger.
< Ernste Wendung | s-14 l+6 | Ein geliebter NSC stirbt. Plötzlich ist es still. | schaedel
> Mittanzen | s+5 l-4 | Der Oger ist ein großartiger Tänzer. Der Plot? Später. | musik

§ #sl_vorbereitung sl
Du hast 4 Stunden einen Dungeon vorbereitet. Die Gruppe will ihn umgehen.
< Dungeon kommt zu ihnen | l-5 s+5 | Der Dungeon … wandert. Er ist jetzt ein Lebewesen. | erdbeben
> Loslassen | l+3 s+2 | Der Dungeon wandert in die Schublade. Für die nächste Kampagne.

§ #sl_zeichen sl
Du merkst, dass einer der Spieler gerade sehr still ist.
< In der Pause nachfragen | alle+4 t-3 | „Alles okay?“ – „Ja, nur müde.“ Danke fürs Fragen.
> Einbinden | s+4 alle+2 | Der stille Held bekommt einen Moment im Rampenlicht.

§ #sl_muede sl
Du bist selbst todmüde. Die Spieler sind voller Energie.
< Kaffee und durch | t+3 s+3 | Du leitest auf Koffein. Es entstehen sehr seltsame NSCs. | lachen
> Früher Schluss | t+6 alle-4 | „Heute nur bis zehn.“ Die Spieler protestieren. Leise.

§ #sl_kritik sl
Nach der Session kritisiert ein Spieler: „Die Kämpfe sind zu lang.“
< Schnellere Kämpfe | t+8 l-3 | Gegner haben jetzt halb so viele Trefferpunkte. Es ist ein Unterschied wie Tag und Nacht.
> So bleibt es | l+3 alle-3 | Du magst lange Kämpfe. Du stehst dazu.

§ #sl_zufall sl
Du würfelst eine Zufallsbegegnung. Es ist… ein fahrender Händler mit einem Bären.
< Freundlicher Händler | s+5 m+3 | Der Bär tanzt. Der Händler verkauft Heiltränke. Alle zufrieden. | gold
> Der Bär ist ein Werbär | t+5 m-3 W12 ? s+5 : tod | Ein überraschender Kampf! Spannend! :: Der Werbär ist zu stark. Ein Held bleibt zurück. | treffer

§ #sl_innere sl
Deine innere Stimme flüstert: „Du könntest einfach alle sterben lassen.“
< Bloß nicht | l+2 s+2 | Du ignorierst die Stimme. Heute.
> Ein klein bisschen | m-8 l+4 s-3 tod2 | Eine Falle, ein Opfer. Die Spieler sind ab jetzt vorsichtiger. Viel vorsichtiger. | schaedel

§ #sl_hausaufgabe sl
Du hast vergessen, was du letzte Woche geplant hattest. Komplett.
< So tun als ob | W11 l+2 ? s+5 : l-8 | Du improvisierst brillant. Niemand merkt etwas. :: „Aber letzte Woche hast du gesagt…“ Erwischt. | frage
> Zugeben | s+4 l-3 alle+3 | „Ich hab's vergessen.“ Alle lachen. Ein Spieler hat zum Glück mitgeschrieben.

§ #sl_notizen sl
Jemand am Tisch erhascht einen Blick hinter deinen Schirm. Direkt auf deine Notizen.
< Notizen ändern | l-4 s+3 | Du schreibst schnell alles um. „Der Verräter ist… jetzt jemand anderes.“
> Darauf vertrauen | l+3 s+4 | Ein kurzes, verschwörerisches Nicken. Du hast jetzt einen Komplizen am Tisch.

§ #npc_hilfe npc
{npc} bittet die Helden um Hilfe: Die Ziege ist in den Brunnen gefallen.
< Ziegenrettung! | s+6 l+3 t-3 | Ein heldenhafter Abstieg in den Brunnen. Die Ziege beißt. Unten liegt aber ein Schatz! | gold
> Keine Zeit | t+4 alle-2 | {npcN} weint. Die Ziege meckert. Der Plot geht weiter.

§ #npc_verkauf npc
{npc} verkauft „original Drachenschuppen“. Sie sehen aus wie lackierte Kartoffelchips.
< Kaufen | s+6 l-4 m+2 | Es sind lackierte Kartoffelchips. Aber magische! +1 auf Rettungswürfe gegen Hunger. | gold
> Feilschen | l+4 W10 ? s+4 : s-2 | Für 2 Kupfer. Ein guter Deal. Für lackierte Chips. :: {npcN} ist beleidigt und erhöht den Preis.

§ #npc_raetsel npc
{npc} stellt ein Rätsel: „Was hat Hände, aber kann nicht klatschen?“
< Spieler raten lassen | l+5 t-6 s+3 | Nach 15 Minuten: „Eine Uhr!“ – Jubel! Der Weg ist frei. | glocke
> Mit Würfel lösen | t+5 laune-0 s-2 | „Intelligenz-Wurf.“ – „Langweilig!“, ruft jemand.

§ #npc_streit npc
{npc} und ein anderer NSC streiten auf offener Straße. Beide wollen, dass die Helden Partei ergreifen.
< Partei ergreifen | s+5 t+3 alle-2 | Ein Feind fürs Leben. Und ein neuer Freund. | ausruf
> Schlichten | l+5 s+3 t-4 | Mit einer Rede vereint {held} die Streithähne. Applaus! | herzen

§ #npc_quest npc
{npc} hat eine Quest: „Bringt mir 20 Wolfsfelle!“
< Sammelquest | l+3 t-6 m+3 | Es dauert ewig. Aber die Wölfe waren gefährlich. Erfahrung! | nacht
> Kürzen | t+5 s+2 | „Drei Felle reichen auch.“ – „Wirklich?“ – „Wirklich.“

§ #npc_kind npc
Ein Kind läuft weinend auf die Helden zu. „Ein Monster hat meinen Teddy!“
< Teddy-Mission! | s+6 l+3 t+3 W10 ? m+3 : tod | Das Monster war ein einsamer Kobold. Er gibt den Teddy zurück und weint. :: Das Monster war kein Kobold. Es war ein Mantikor. | herzen
> Das Kind ist eine Falle | s+4 l-3 m-3 | Das Kind ist ein Gestaltwandler! Was für ein Klischee. Es funktioniert trotzdem. | ausruf

§ #npc_bard npc
Ein Barde singt in der Taverne ein Lied über die Gruppe. Es ist nicht schmeichelhaft.
< Duell der Barden | W12 s+8 ? m+3 : s-4 | Der Gruppen-Barde kontert mit einem Spottlied. Die Taverne tobt. :: Der Barde ist einfach besser. Die Gruppe wird ausgelacht. | musik
> Ignorieren | l+2 s-2 | Das Lied wird ein Ohrwurm. In ganz {ort}.

§ #npc_wache npc
{npc} hält die Helden am Stadttor an. „Waffen sind in der Stadt verboten.“
< Waffen abgeben | l+6 m-4 | Die Gruppe ist unbewaffnet in der Stadt. Spannung! | staub
> Schmuggeln | W12 s+5 ? m+2 : l+4 m-4 | Der Barbar versteckt seine Axt in einem Brotlaib. Erfolg! :: Das Brot ist zu klein für eine Zweihandaxt. | lachen

§ #npc_liebe npc
{npc} hat sich in {held} verliebt. // Schwer verliebt.
< Erwidern | s+6 l+2 t-3 | Eine zarte Romanze. {name} wird rot. | herzen
> Freundlich abweisen | l+3 s+3 | {npcN} schreibt fortan traurige Gedichte über {held}. Sehr schlechte.

§ #npc_wirt npc
Der Wirt erzählt beim dritten Bier von einem verlassenen Turm, in dem es spukt.
< Hingehen! | s+5 t+4 l+2 | Eine neue Nebenquest. Der Turm ist sehr, sehr verlassen. | geister
> Nur Gerede | l+2 | Der Wirt erzählt auch, dass es in jedem Turm spukt. Das ist sein Ding.

§ #npc_gerechtigkeit npc
Ein Bauer bittet um Hilfe gegen den Steuereintreiber des Barons.
< Rebellion! | s+6 l+3 t+5 m+3 | Die Gruppe führt einen Bauernaufstand an. Mit Mistgabeln! | feuer
> Steuern zahlen | l+5 s-4 | Die Gruppe bezahlt die Steuern des Bauern. Heldentat der Buchhaltung. | gold

§ #sk_drohung schurke
{schurke} erscheint als Projektion. „Ihr seid lästige Fliegen.“
< Zurückdrohen | s+5 t+3 | „Fliegen? Wir sind HORNISSEN!“ – Der Schurke ist verwirrt. | magie
> Ausfragen | l+5 t-3 | Aus reiner Eitelkeit verrät {schurkeN} einen Teil des Plans. Typisch Schurke.

§ #sk_angriff schurke
Die Schergen von {schurkeN} überfallen das Lager bei Nacht.
< Kampf im Dunkeln | W12 m+3 t+5 ? lvl s+4 : tod | Die Gruppe wehrt den Angriff ab. Alle steigen auf! :: Der Überfall kostet ein Leben. Die Rache ist gewiss. | nacht
> Flucht durch den Wald | t+5 l+3 m-3 | Eine panische Flucht durch die Bäume. Alle überleben. Gerade so. | wind

§ #sk_angebot schurke
{schurke} macht ein Angebot: „Schließt euch mir an, und ihr bekommt Macht.“
< Zum Schein annehmen | s+6 l+3 t-3 +doppelspiel | Ein riskantes Doppelspiel beginnt. | ausruf
> Ablehnen | l+3 m+3 | „Niemals!“ Ein großer, heroischer Moment. | krone

§ #sk_doppel2 schurke wenn:doppelspiel
{schurke} wird misstrauisch. „Beweist eure Loyalität. Tötet {npcN}.“
< Täuschen | W14 s+6 l+3 ? -doppelspiel m+4 : tod | Ein inszenierter Tod mit Theaterblut! Der Schurke glaubt es! :: Der Schurke durchschaut den Trick. Ein Held bezahlt dafür. | ausruf
> Auffliegen lassen | t+6 m+3 -doppelspiel | Die Tarnung fliegt auf. Kampf in der Schurkenburg! | schwerter

§ #sk_entkommen schurke
Die Helden haben {schurkeN} gestellt. Doch es gibt noch einen Fluchtweg.
< Entkommen lassen | l+4 s-3 t+3 | „Wir sehen uns wieder!“ Der Schurke verschwindet in Rauch. Frustrierend. Aber gut für die Story. | nebel
> Erwischen | m+6 s+5 t+5 l-3 | Ein Pfeil trifft den Umhang. Der Schurke stolpert. Gefangen! Aber was jetzt? | pfeile

§ #sk_komisch schurke trash
{schurke} trägt heute einen pinken Umhang. Angeblich ein Wasch-Unfall.
< Den Umhang verspotten | s+10 l-5 | {schurkeN} weint. Harter Tag. | lachen
> Ernst bleiben | l+4 s+2 | Die Gruppe ignoriert den Umhang tapfer. Fast.

§ #sk_mitleid schurke
Die Helden erfahren die traurige Vorgeschichte von {schurkeN}.
< Mitleid! | l+5 s+3 t-4 | Der Schurke hatte nie Freunde. Plötzlich ist alles komplizierter. | traenen
> Egal, böse ist böse | m+3 t+3 | „Trotzdem ein Monster.“ Die Gruppe schärft ihre Waffen.

§ #sk_spion schurke
{schurke} hat einen Spion in der Gruppe. Es ist… das Pferd.
< Pferd verhören | s+10 l-6 | Das Pferd gesteht alles. Unter Tränen. | lachen
> Fake-Infos füttern | l+4 s+5 | Die Gruppe flüstert dem Pferd falsche Pläne ins Ohr. Genial. | ausruf

§ #sk_burg schurke
Die Gruppe steht vor der Burg von {schurkeN}. Mauern, Fallen, Drachen.
< Frontal angreifen | W14 m+5 t+8 ? lvl : tod | Unglaublich, aber es klappt! :: Frontal war keine gute Idee. | explosion
> Durch die Kanalisation | l+5 s+3 t-4 | Es stinkt. Aber niemand sieht sie kommen. | gift

§ #sk_rueckkehr schurke wenn:kamp>1
{schurke} ist zurück! Aus einer früheren Geschichte, schlauer und wütender als je zuvor.
< „Nicht schon wieder!“ | s+6 l+4 t+3 | Die Spieler erinnern sich an alte Narben. Alte Rechnungen! | ausruf
> Diesmal fertigmachen | m+6 t+3 | Die Gruppe ist vorbereitet. Diesmal gibt es kein Entkommen.

§ #we_sturm welt ort:sturm
Ein Sturm zieht auf. Blitze zucken über {ort}.
< Unterschlupf suchen | l+4 t-4 | Eine verlassene Hütte. Gemütlich. Bis jemand anklopft. | blitz
> Weiterziehen | t+4 m-3 W10 ? s+3 : tod | Durchnässt, aber angekommen. :: Ein Blitz schlägt ein. Genau dort. | blitz

§ #we_fest welt
In {ort} wird ein großes Fest gefeiert: das Fest der Rüben.
< Mitfeiern | s+8 t-4 | Die Gruppe gewinnt den Rübenweitwurf. Ruhm! Ehre! Rüben! | konfetti
> Plot verfolgen | t+3 l+3 s-2 | Während alle feiern, schleicht die Gruppe in den Turm.

§ #we_seuche welt
Eine Seuche bricht in {ort} aus. Die Leute husten grünen Schleim.
< Heilmittel suchen | l+5 t+3 m+3 | Eine Quest nach dem seltenen Mondkraut! | heilung
> Weiterziehen | t+4 l+3 s-3 | Die Gruppe verlässt die Stadt. Mit schlechtem Gewissen. | gift

§ #we_eclipse welt
Eine Sonnenfinsternis. Alle Untoten im Umkreis erwachen.
< Kampf! | m+4 t+6 W12 ? lvl : tod | Hunderte Skelette, eine Gruppe Helden, eine lange Nacht. Sieg! :: Zu viele Skelette. Ein Held geht unter. | geister
> Verstecken | l+4 t-4 | Die Gruppe versteckt sich in einer Kirche. Die Toten klopfen die ganze Nacht. | nacht

§ #we_meteor welt trash
Ein Meteor schlägt neben der Gruppe ein. Er ist… ein riesiger Käse.
< Untersuchen | s+10 l-10 | Der Käse ist magisch. Wer davon isst, kann Mäuse verstehen. | explosion
> Weitergehen | l+3 s-2 | Ihr ignoriert den Weltraumkäse. Er wird zum Wallfahrtsort.

§ #we_winter welt ort:schnee
Der Winter kommt früh nach {ort}. Die Pässe sind verschneit.
< Durch den Schnee | l+5 t-5 m-3 | Eine harte Reise durch Eis und Wind. | schnee
> Überwintern | t-8 s+4 l+3 | Die Gruppe verbringt den Winter in einer Taverne. Viele Geschichten, viel Met. | feuer

§ #we_markt welt ort:markt
Ein reisender Wundermarkt kommt in die Stadt. Mit Feuerspuckern und Zauberern!
< Einkaufen | m+5 s+4 | {held} kauft {item}. Mit ungewissen Nebenwirkungen. | gold
> Taschendiebe! | t+4 s+3 l+2 | Während alle staunen, sind die Geldbeutel weg. | lachen

§ #we_drache welt
Ein Drache kreist über {ort}. Niemand weiß, was er will.
< Mit ihm reden | W13 l+4 s+5 ? m+5 : tod | Er will nur seinen verlorenen Ball zurück. Ein Drachenball. :: Er will Frühstück. Und es gibt nur eine Gruppe in Reichweite. | drache
> Angreifen | W15 m+8 t+6 ? lvl : tpk | Der Drache stürzt! Legenden werden geschrieben! :: Das war ein Fehler. Ein großer, feuriger Fehler. | drache

§ #we_erdbeben welt
Ein Erdbeben erschüttert {ort}. Ein uralter Tempel bricht aus dem Boden.
< Hinein! | t+4 s+5 W11 ? m+5 : tod | Uralte Schätze! Uralte Flüche! :: Uralte Fallen. Sehr wirksame. | erdbeben
> Erst beobachten | l+5 t-4 | Aus dem Tempel kommen seltsame Lichter. Und Gesang. | magie

§ #we_nebel welt ort:geister
Ein unnatürlicher Nebel liegt über dem Moor. Stimmen flüstern Namen.
< Den Stimmen folgen | s+5 l+3 W12 ? m+3 : tod | Die Stimmen führen zu einem vergessenen Grab und einem Schatz. :: Die Stimmen führen in den Sumpf. Für immer. | geister
> Ohren zuhalten | l+3 t+3 | Ihr marschiert stur durch den Nebel. Gänsehaut inklusive. | nebel

§ #we_krieg welt ort:krieg
Zwei Königreiche erklären sich den Krieg. Die Gruppe steht genau dazwischen.
< Für eine Seite kämpfen | m+5 t+5 l+3 | Ruhm in der Schlacht! Aber auch Feinde. | schwerter
> Frieden stiften | W14 l+5 s+5 ? frieden : t+4 | Ein Wunder der Diplomatie: Die Könige reichen sich die Hand. :: Beide Seiten jagen jetzt die Gruppe. | herzen

§ #we_pilze welt trash
Riesige Pilze sprießen über Nacht in {ort}. Sie singen.
< Mitsingen | s+8 l-6 | Die Pilze und die Gruppe nehmen gemeinsam ein Album auf. | musik
> Abfackeln | m+3 l+2 s-2 | Die Pilze kreischen. Das war gemein. | feuer

§ #wf_glueck wuerfel
Die Würfel sind heute heiß. // {name} würfelt drei 20er hintereinander.
< Glück lassen | m+8 s+6 l-3 | Der Abend der Legenden! Alles gelingt! | wuerfelregen
> Würfel prüfen | l+6 laune-6 | „Ist der gezinkt?“ Der Würfel wird untersucht. Er ist sauber. Nur verdammt glücklich.

§ #wf_pech wuerfel
Heute würfelt niemand über 5. // Keiner.
< Würfel ins Gefängnis | s+6 l-2 | Die Würfel werden bestraft. Ein Holzkästchen dient als Kerker. | lachen
> Durchhalten | m-6 s-4 l+3 | Die Gruppe kämpft sich durch einen Abend voller Fehlschläge. | treffer

§ #wf_entscheidung wuerfel wurfkarte
Das Schicksal will eine Entscheidung. Ein einziger Wurf für die ganze Gruppe.
< Würfeln! | W11 s+5 ? m+6 lvl : m-6 tod2 | Das Schicksal ist gnädig! Alle steigen auf! :: Das Schicksal ist grausam. | wuerfelregen
> Nicht herausfordern | l+3 t+3 | Manchmal ist es klüger, das Schicksal nicht herauszufordern.

§ #wf_kritisch wuerfel
Eine natürliche 20 beim Überzeugungswurf! Die Wache würde jetzt alles glauben.
< Alles glauben | s+8 l-6 | „Ihr seid die Königin?“ – „Ja.“ – „Sehr wohl, Majestät!“ | krone
> Nur das Vernünftige | l+4 s+3 | Die Wache lässt euch durch. Mehr nicht. Fair.

§ #wf_patzer wuerfel
Eine natürliche 1 beim Zauberwurf. Die Magie gerät außer Kontrolle.
< Wilde Magie! | W10 s+8 l-5 ? m+3 : tod | Alle Helden haben jetzt Hasenohren. Und +2 auf Wahrnehmung! :: Der Feuerball explodiert in der eigenen Hand. | portal
> Zauber verpufft | l+3 s-2 | Ein trauriges Pfffft.

§ #rb_seite regelbuch
Das Regelbuch klappt beim Fallen auf einer Seite auf: „Optionale Regel: Verletzungen“.
< Einführen | l+8 m-5 s-3 | Ab jetzt gibt es gebrochene Beine. Und Holzbeine. | staub
> Zuklappen | l-3 s+2 | Manche Regeln bleiben besser optional.

§ #rb_errata regelbuch
Eine neue Errata ist erschienen. // Die Lieblingsfähigkeit der Gruppe wurde abgeschwächt.
< Übernehmen | l+6 m-6 alle-4 | Kollektives Murren. Aber es war wirklich zu stark.
> Ignorieren | m+3 l-4 | „Wir spielen die alte Version.“ Irgendwo am Tisch zuckt ein Augenlid.

§ #rb_monster regelbuch
Im Monsterhandbuch findest du ein vergessenes Monster: den Kettenkrabbler.
< Einsetzen | m-4 s+5 t+3 W12 ? lvl : tod | Niemand kannte ihn. Alle fürchten ihn. Sieg nach hartem Kampf! :: Der Kettenkrabbler ist gnadenlos. | treffer
> Zu gruselig | l+2 | Der Kettenkrabbler bleibt im Buch. Wo er hingehört.

§ #gt_tot geist
Der Geist von {tot} erscheint der Gruppe. „Ihr habt mich vergessen…“
< Gedenken | l+5 s+3 t-4 geist | Die Gruppe baut einen Schrein. Der Geist ist zufrieden und gibt einen Hinweis. | geister
> Exorzismus | m+3 s+3 | Der Geist wird verbannt. Er war eh etwas anstrengend. | magie

§ #gt_rache geist
{tot} will Rache. Der Geist bietet an, gegen {schurkeN} zu kämpfen.
< Annehmen | m+8 l-3 geist | Ein Geisterkrieger an der Seite der Gruppe! Unheimlich stark. | geister
> Ruhe in Frieden | l+5 s+2 | Der Geist löst sich lächelnd in Licht auf. | sonne

§ #gt_alt geist wenn:gefallen
Ein Geist aus einer längst vergangenen Runde streift durch die Ruinen. Es ist {tot}.
< Ansprechen | l+5 s+4 geist | {tot} erzählt von einer alten Gruppe, einem alten Kampf. Die Welt ist älter, als die Spieler dachten. | geister
> Vorbeigehen | t+3 | Ein trauriger Blick folgt euch noch lange.

§ #go_gebet gott
Ein Kleriker betet zu {gott}. Und {gott} antwortet. Persönlich.
< Wunder gewähren | m+8 l-5 s+3 | Ein Lichtstrahl heilt alle Wunden. Halleluja! | sonne
> Prüfung stellen | l+5 m+3 t-4 | „Beweist euch würdig.“ Eine heilige Quest beginnt. | glocke

§ #go_launen gott trash
{gott} ist heute gelaunt und verwandelt die Gruppe zum Spaß in Frösche.
< Frosch-Abenteuer | s+10 l-8 m-5 | Die Gruppe hüpft durch ein Kapitel als Frösche. Es ist die beste Session ever. | lachen
> Sofort zurückverwandeln | l+4 s-2 | {gott} seufzt. „Ihr seid keine Spaßvögel.“

§ #go_wette gott
{gott} schließt mit einem anderen Gott eine Wette über die Gruppe ab.
< Die Gruppe erfährt es | s+6 l+3 t+3 | „Wir sind ein Wettobjekt?!“ Empörung. Motivation! | ausruf
> Geheim lassen | l+5 m+3 | Die Gruppe hat seltsames Glück. Und seltsames Pech.

§ #sp_nsc_dorf spieler wenn:kamp>2
{name}: „Wie wär's, wenn {held} in {ort} ein Dorf gründet? Für die Legenden der früheren Geschichten?“
< Heldendorf! | l+4 s+6 t-4 | Es heißt „Legendenruh“. Es hat eine Statue von {legende}. | krone
> Später | t+3 laune-4 | Vielleicht nach dem nächsten Schurken.

§ #sp_wiederholung spieler wenn:kamp>2
{name}: „Moment, gegen {schurkeN} haben wir doch schon mal gekämpft! In einer anderen Geschichte!“
< Kontinuität! | l+6 s+4 | Die Welt-Chronik lebt. Alte Narben, alte Feinde. | ausruf
> Ein Klon | s+6 l-4 | Es ist ein Klon. Oder ein Zwilling. Oder ein Zwillingsklon. | lachen

§ #sl_ewig sl wenn:karten>150
Du merkst: Diese Runde spielt jetzt schon unfassbar lange zusammen. Es fühlt sich an wie eine Familie.
< Ein Fest für die Runde | s+8 alle+8 t-4 | Ein Abend ohne Plot. Nur Erinnerungen und Pizza. | konfetti
> Weiter erzählen | l+3 t+3 | Die Geschichte hört nie auf. Tales never End. | funkeln

§ #sl_meta sl wenn:karten>250 einmal
Ein Spieler fragt: „Glaubst du, wir sitzen in Wahrheit auch nur in einem Spiel? Und jemand wischt nach links und rechts?“
< „Unsinn.“ | l+4 s+3 | Alle lachen. Irgendwo wischt jemand nach rechts. | frage
> „Vielleicht…“ | s+6 l-6 | Gänsehaut am ganzen Tisch. Die Kerze flackert. | magie

§ #st_regen welt phase:start
Draußen regnet es in Strömen. // Im Spiel auch?
< Ja, Regen | l+3 s+3 t-3 | Die Helden stapfen durch den Matsch. Es klingt drinnen wie draußen. | regen
> Sonnenschein | s+4 t+3 | Im Spiel scheint die Sonne. Seelische Kompensation. | sonne

§ #st_gewohnheit spieler phase:start
Bevor es losgeht, will {name} das Würfelritual machen: Jeder Würfel wird einmal geküsst.
< Mitmachen | s+6 t-3 | Der ganze Tisch küsst seine Würfel. Glück garantiert. | herzen
> Losspielen | t+4 laune-4 | {name} küsst {seine} Würfel heimlich unter dem Tisch.

§ #st_neuegeschichte sl phase:start
Heute gibt es einen neuen Schauplatz. Wohin?
< In die Unterwelt | l+3 m-3 s+4 | Pilzwälder, blinde Fische, seltsame Völker. | nebel
> In die Hauptstadt | s+4 t+3 l+3 | Intrigen, Paläste, Taschendiebe. | krone

§ #st_wetter2 welt phase:start
Herbst. Bunte Blätter fallen, die Helden wandern durch einen goldenen Wald.
< Beschaulich | s+4 t-4 l+2 | Pilze sammeln, Eichhörnchen beobachten, Rast am Bach. | blaetter
> Hinterhalt | t+6 m+2 W10 ? s+3 : tod | Banditen im Laub! Abgewehrt! :: Der Hinterhalt war gut geplant. | pfeile

§ #st_feedback spieler phase:start
{name} sagt vor dem Start: „Ich fand letztes Mal zu wenig Kampf.“
< Mehr Kampf heute | m+4 t+4 laune+8 | Heute gibt es drei Kämpfe. {name} glüht. | schwerter
> Gleich gewichten | l+3 laune-2 | Du merkst es dir für später.

§ #st_karte sl phase:start
Du hast eine neue Karte gezeichnet. Sie ist wunderschön. Und riesig.
< Ausrollen | l+4 s+5 t-3 | Die Karte bedeckt den ganzen Tisch. Die Chips wandern auf den Boden. | staub
> Nur zeigen, was sie sehen | l+3 t+2 | Nebel des Krieges. Alle sind neugierig.

§ #se_nachbesprechung spieler phase:ende
Nach der Session will {name} noch eine halbe Stunde über Theorien reden.
< Zuhören | s+5 t-4 laune+8 | Die Theorie ist besser als dein Plot. Du klaust sie heimlich.
> Schlafen gehen | t+3 laune-4 | „Gute Nacht!“ {name} schreibt im Chat einfach weiter.

§ #se_epilog sl phase:ende
Zum Abschluss der Session: Willst du eine Szene beim Schurken zeigen?
< Schurkenszene | l+3 s+5 t+3 | „Währenddessen in der Burg…“ {schurke} lacht böse. Gänsehaut! | nacht
> Nein, Geheimnis | l+4 | Die Spieler wissen nicht, was kommt. Gut so.

§ #se_muede tisch phase:ende
Alle gähnen. Die Kerze ist heruntergebrannt.
< Schnell abschließen | t+5 s+2 | „Ihr schlaft in der Taverne. Ende.“ | zzz
> Noch ein letzter Wurf | W10 s+5 ? m+3 : s-3 | Ein letzter Glückswurf auf die Beute. Gold! :: Nur ein rostiger Löffel. | gold

§ #se_abstimmung tisch phase:ende
Termin für nächste Woche finden. // Drei können Dienstag, zwei Donnerstag.
< Dienstag | t+3 alle-3 | Zwei sind traurig, aber es wird gespielt.
> Umfrage-Tool | t-5 s-2 alle+2 | Nach vier Tagen Abstimmung: Samstag! Alle können. Wunder.

§ #se_geschenk spieler phase:ende
Am Ende der Session schenkt dir {name} ein Würfelset. „Für den besten SL.“
< Rührung | s+6 alle+4 | Du würfelst ab sofort mit Würfeln aus Kristall. | funkeln
> Bescheidenheit | s+3 | „Ach, das war doch nichts!“ Es war eine Menge.

§ #se_levelup2 sl phase:ende wenn:sess>2
Die Helden haben viel geschafft. Steigen sie auf?
< Ja! | m+6 lvl s+3 | Alle steigen auf. Neue Fähigkeiten glühen. | funkeln
> Noch nicht | l+4 m+2 | „Bald.“

§ #se_ruhe sl phase:ende
Ein ruhiger Ausklang: Die Helden sitzen auf einem Hügel und schauen in die Sterne.
< Sternenhimmel | s+4 l+3 t-3 | Eine Sternschnuppe. Jeder Held wünscht sich etwas. | sterne
> Ein Komet! | t+4 s+3 | Ein roter Komet zieht über den Himmel. Ein Omen! | sterne

§ #ks_karawane sl phase:kstart
Die Helden begleiten eine Handelskarawane nach {ort}.
< Ruhige Reise | l+4 t-3 | Gespräche mit Händlern, Gerüchte über {schurkeN}. | staub
> Überfall! | t+6 m+3 W10 ? s+4 : tod2 | Die Karawane wird überfallen – die Helden retten den Tag! :: Der Überfall fordert ein Opfer. | pfeile

§ #ks_erbe sl phase:kstart
{held} erbt ein Schloss in {ort}. Es hat ein kleines Problem: // Geister.
< Geisterschloss! | s+6 l+3 | Ein Erbe mit Gespenstern. Die Kampagne hat ihren Mittelpunkt. | geister
> Verkaufen | m+5 l+2 | Das Geld geht in Ausrüstung. Die Geister in die Nachbarschaft.

§ #ks_prophezeiung sl phase:kstart
Eine alte Frau prophezeit: „Einer von euch wird {schurkeN} stürzen. Oder zur rechten Hand werden.“
< Spannung! | l+4 s+5 t+2 | Am Tisch fragt sich jeder, wer gemeint ist. | magie
> Alte Frau ist verrückt | s+4 l-2 | „Sie sagt das jedem.“ Aber was, wenn nicht?

§ #ks_amnesie sl phase:kstart
Die Helden wachen ohne Erinnerung auf. Auf ihren Armen: eine Tätowierung von {ort}.
< Mysterium! | l+3 s+5 t+4 | Wer sind sie? Was haben sie getan? Die Spieler sind sofort im Bann. | frage
> Alte Bekannte | s+4 l-2 | „Ihr kennt euch aus einer Kneipe. Mehr nicht.“

§ #ks_turnier sl phase:kstart
In {ort} findet ein großes Turnier statt. Der Preis: {item}.
< Teilnehmen | m+5 s+5 | Lanzenstechen, Bogenschießen, Wetttrinken! | krone
> Den Betrug aufdecken | l+5 t+3 | Das Turnier ist manipuliert! Wer steckt dahinter? | ausruf

§ #fin_burg sl phase:finale
Der Sturm auf die Burg von {schurkeN}. Alles kulminiert.
< Alles oder nichts | W12 m+6 s+6 t+5 ? sieg lvl : tod tod2 | Die Tore fallen, der Schurke fällt. Jubel in {ort}! :: Ein hoher Preis. Doch {schurkeN} ist… verschwunden. | explosion
> List und Tücke | W11 l+6 s+4 ? sieg : tod | Durch einen Geheimgang direkt in den Thronsaal! Überrumpelt! :: Der Geheimgang war eine Falle. | staub

§ #fin_gott gott phase:finale
Im letzten Moment greift {gott} ein. „Ich biete euch den Sieg – zu einem Preis.“
< Preis zahlen | sieg m-6 l-3 s+3 | Der Sieg ist errungen. Aber jeder Held verliert eine Erinnerung. | sonne
> Selbst kämpfen | W13 m+5 s+5 ? sieg lvl : tpk | Aus eigener Kraft! Die Götter applaudieren. :: Hochmut kommt vor dem Fall. | explosion

§ #fin_freund npc phase:finale
{npc} taucht im Finale mit einer Armee aus allen Freunden auf, die die Gruppe in dieser Kampagne gefunden hat.
< Gemeinsam! | m+8 s+8 sieg | Alle kehren zurück: der Schmied, der Wirt, das Huhn. Der Schurke hat keine Chance. | konfetti
> Zu spät | W12 m+3 ? sieg : tod2 | Die Armee kommt gerade rechtzeitig! :: Die Armee kommt eine Stunde zu spät. | schwerter

§ #fin_spiegel schurke phase:finale
{schurke} enthüllt: „Ich bin, was ihr werdet, wenn ihr gewinnt.“
< Trotzdem kämpfen | W12 m+4 l+3 ? sieg : tod | Die Gruppe siegt – und schwört, nie so zu werden. :: Die Prophezeiung erfüllt sich nicht. Aber sie kostet ein Leben. | treffer
> Den Kreis brechen | W14 l+6 s+4 ? frieden : m-5 | Die Gruppe zerbricht die Krone der Macht. Niemand herrscht. Frieden! :: Die Krone zerbricht nicht. | magie
`);
