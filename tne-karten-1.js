/* =====================================================================
   TALES NEVER END – Kartenpaket 1: Abende, Kampagnen, Finale,
   Powergamer, Rollenspielerin, Regelanwalt
   ---------------------------------------------------------------------
   § #id sprecher schlüssel:wert …      (phase:start/ende/kstart/finale, ort:…, wenn:…, g:…, einmal, kette, trash)
   Text
   < Linke Wahl | Wirkung | Folgetext | viz
   > Rechte Wahl | Wirkung | Folgetext | viz
   Platzhalter: {name} {held} {klasse} {volk} {eigen} {anderer} {aheld} {aklasse} {schurke} {schurkeN}
   {ort} {kampagne} {npc} {npcN} {monster} {item} {gott} {tot} {legende} {zahl} {stufe}
   ===================================================================== */
(window.TNE_KARTEN = window.TNE_KARTEN || []).push(String.raw`

§ #rs_erste sl phase:kstart ort:tisch einmal
Die erste Session einer neuen Runde. Vier fremde Leute sitzen an deinem Tisch und starren dich erwartungsvoll an. Du hast drei Seiten Notizen und Bauchweh.
< Klassisch: Taverne | l+5 t-5 s+3 | „Ihr trefft euch alle in einer Taverne.“ Niemand beschwert sich. Es ist Tradition.
> Mitten im Kampf | m+5 t+10 s+5 l-3 | „Ihr fallt aus einem brennenden Luftschiff.“ Der ganze Tisch schreit begeistert. | feuer

§ #ks_taverne sl phase:kstart ort:taverne
„{kampagne}“ beginnt. Wie bringst du die Helden zusammen?
< Ein Auftraggeber | l+6 t-4 | {npc} braucht Hilfe und zahlt gut. Alle nicken. Ein solider Start.
> Ein Gefängniswagen | s+6 t+6 l-2 | Die Helden wachen gefesselt in einem Gefängniswagen auf. Woher sie sich kennen? Egal. Flucht!

§ #ks_prolog sl phase:kstart
Du hast einen fünfseitigen Prolog über die Geschichte von {ort} geschrieben. Willst du ihn vorlesen?
< Vorlesen | l+8 t-10 s-4 | Nach Seite drei schnarcht jemand. Aber die Welt fühlt sich echt an. | zzz
> Zusammenfassen | t+5 l-3 s+3 | „Lange Geschichte kurz: Es gibt Ärger in {ort}.“ – „Perfekt, los geht's.“

§ #ks_sessionnull sl phase:kstart
Willst du vorher eine „Session Null“ machen, um Erwartungen am Tisch zu klären?
< Ja, reden wir | l+5 s+3 t-8 alle+5 | Ihr redet über Grenzen, Wünsche und ob Pferde sterben dürfen. Alle fühlen sich gehört.
> Ach was, losspielen | t+6 s+2 alle-3 | Ihr legt einfach los. Wird schon schiefgehen.

§ #ks_karte kunst phase:kstart
{name} hat eine Karte von {ort} gezeichnet – mit Flüssen, Bergen und einer sehr detaillierten Taverne. Sie passt nur leider nicht zu deiner.
< Ihre Karte nehmen | l-4 s+6 laune+12 | {name} strahlt. Deine Welt hat jetzt einen Drachenberg, wo vorher ein See war. Egal!
> Deine behalten | l+5 laune-10 | „Oh. Okay.“ {name} faltet die Karte ganz langsam zusammen.

§ #ks_rueckkehr sl phase:kstart wenn:kamp>1
Eine neue Kampagne in einer alten Welt. Sollen Spuren der letzten Geschichte auftauchen?
< Ja, alte Narben | l+6 s+4 t-3 | Ein Denkmal erinnert an {legende}. Die Spieler sind gerührt. Kontinuität!
> Neuer Kontinent | t+5 m+2 l-2 | Frischer Wind, neue Karten, neue Geheimnisse.

§ #ks_legende spieler phase:kstart wenn:legende
{name} fragt: „Darf mein neuer Held ein Nachfahre von {legende} sein?“
< Ja, mit Erbe | m+8 s+5 l-2 laune+10 nachfahre | {held} trägt das alte Familienwappen. Die Legende lebt weiter. | krone
> Lieber neu | l+4 laune-6 | „Neue Helden, neue Geschichten.“ {name} radiert den Nachnamen wieder aus.

§ #ks_schurkenbrief schurke phase:kstart
Bevor es losgeht, bekommen die Helden einen Brief: „Gebt auf, oder {ort} brennt. Gezeichnet, {schurke}.“
< Bedrohlich lassen | l+5 s+2 t+3 +brief | Die Spieler schauen sich ernst an. Das ist persönlich.
> Mit Rechtschreibfehlern | s+8 l-6 | Der Brief strotzt vor Fehlern. „Wir haben einen Analphabeten als Endgegner!“ | lachen

§ #ks_wetter welt phase:kstart
Die Reise nach {ort} beginnt. Welches Wetter?
< Strahlender Sommer | s+4 t+4 | Vögel, Blumen, ein freundlicher Bauer. Fast verdächtig nett. | sonne
> Ein Gewitter | l+3 s+2 t-4 m-3 | Blitze zucken, die Straße wird zum Schlammfluss. Atmosphäre! | blitz

§ #ks_charakterbau spieler phase:kstart
{name} braucht für die Charaktererschaffung noch… „nur ganz kurz“… die Werte.
< Auswürfeln | W10 m+6 s+4 ? : m-6 s+3 | Wahnsinn, nur Werte über 15! {held} ist ein Halbgott. :: Lauter Vieren und Fünfen. {held} hat Mühe, die Tür zu öffnen. | wuerfelregen
> Punktekaufen | l+6 t-6 | Fair, ausgeglichen, eine halbe Stunde Rechnerei.

§ #ks_hook sl phase:kstart
Wie findet die Gruppe ihren ersten Auftrag?
< Auftragstafel | l+4 t+2 | An der Tafel hängt: „Ratten im Keller. Lohn: 5 Silber.“ Ein Klassiker.
> Ein Fremder stirbt | s+5 l+2 t+5 | Ein Sterbender drückt {held} eine Karte in die Hand: „Bringt das… nach {ort}…“ Dann kippt er um. | schaedel

§ #st_ankommen tisch phase:start
Es ist 19 Uhr. Eigentlich. Es ist 19:47 und {name} „steckt noch im Stau“.
< Ohne anfangen | t+6 laune-6 s-2 | Ihr legt los. {held} wird kurzerhand von einer Eule entführt.
> Warten | t-8 s+3 alle+2 | Ihr wartet, quatscht und esst schon mal die Hälfte der Chips.

§ #st_rueckblick sl phase:start
„Was ist letztes Mal passiert?“ Alle schauen dich an. Niemand erinnert sich.
< Du fasst zusammen | l+5 t-4 | Du erzählst spannend und dramatisch. Ein paar Details erfindest du einfach neu.
> Ein Spieler fasst zusammen | s+6 l-6 t-2 | „Also, wir haben einen Drachen geküsst und dann…“ – „Haben wir NICHT.“ | lachen

§ #st_snacks snack phase:start
{name} kommt mit drei Tüten Chips, Gummibärchen und einem selbstgebackenen Kuchen in Form eines W20.
< Erst mal essen | s+8 t-8 laune+5 | Der Kuchen ist fantastisch. Es wird eine Stunde lang nur gegessen. | konfetti
> Essen beim Spielen | s+3 l-2 | Krümel überall. Der Charakterbogen hat jetzt einen Fettfleck in Form eines Drachen.

§ #st_regelaenderung regel phase:start
{name} hat das neue Regelbuch durchgelesen. „Es gibt 37 Änderungen, die wir ab heute beachten sollten.“
< Alle einführen | l+12 t-8 laune+10 s-4 | Der Abend beginnt mit einem Vortrag. Mit Folien. | staub
> Später vielleicht | l-3 s+3 laune-8 | „Wir spielen erst mal weiter wie bisher.“ {name} macht sich Notizen. Ominöse Notizen.

§ #st_neuerHeld spieler phase:start
{name}: „Ich hab übrigens einen neuen Charakter gebaut. Der alte langweilt mich.“
< Na gut | held s+5 l-5 | {name} spielt jetzt {held}. Der alte Held „geht Kräuter sammeln“. Für immer.
> Nein, weiter so | l+5 laune-8 | {name} spielt grummelnd {held} weiter. Mit sehr viel Seufzen.

§ #st_ort welt phase:start
Die Session beginnt. Wo stehen die Helden?
< In einer Höhle | l+3 t-3 m+2 | Tropfen hallen. Irgendwo knackt ein Knochen. | nebel:a_tropfstein_n1
> Auf dem Markt | s+4 t+3 | Händler schreien, Taschendiebe lauern, ein Huhn entkommt. | federn

§ #st_mittagsschlaf tisch phase:start
Alle sind müde von der Arbeitswoche. Die Energie am Tisch ist bei ungefähr 12 %.
< Actionreicher Einstieg | t+8 s+4 m+2 | Ein Lindwurm bricht durch die Tavernenwand. Alle sind schlagartig wach! | drache
> Gemütlich anfangen | t-6 s+2 alle+3 | Ein Abend in der Taverne mit Musik und Gerüchten. Zum Runterkommen.

§ #st_entschuldigung sl phase:start
Du hast keine Zeit zum Vorbereiten gehabt. Gar keine.
< Improvisieren | W11 s+5 ? l+3 : l-8 | Dir fällt aus dem Nichts eine brillante Intrige ein. Die Spieler glauben, das war geplant. :: Die Geschichte ergibt keinen Sinn. Der Bürgermeister ist plötzlich ein Werwolf UND ein Pferd. | magie
> Kurzer Dungeon | l+3 t+4 s-2 | Fünf Räume, drei Fallen, ein Boss. Altbewährt, ein bisschen lahm.

§ #st_geburtstag tisch phase:start
{name} hat heute Geburtstag.
< Geschenk im Spiel | m+8 s+6 l-3 laune+15 | {held} findet {item} – „vom Universum, zum Geburtstag“. | konfetti
> Ein Lied singen | s+8 t-4 | Der ganze Tisch singt schief. {name} wird rot. Schön. | musik

§ #st_sommer welt phase:start
Draußen sind 34 Grad. Drinnen sind 36. Niemand hat Lust auf irgendwas.
< Eis-Dungeon! | s+5 l-2 | Die Helden betreten eine Eishöhle. Psychologisch hilft es tatsächlich. | schnee
> Auf den Balkon | t-6 s+4 l-2 | Ihr spielt draußen. Ein Charakterbogen fliegt davon. | wind

§ #se_cliff sl phase:ende
Die Session neigt sich dem Ende. Wie hörst du auf?
< Cliffhanger! | s+6 t+5 l-2 | „…und dann öffnet sich die Tür. Dahinter steht… nächste Woche.“ Kollektives Aufstöhnen. Alle kommen wieder. | ausruf
> Ruhiger Abschluss | l+4 t-4 s+2 | Die Helden schlagen ihr Lager auf. Ein guter Abend. | feuer

§ #se_xp sl phase:ende
Zeit, Erfahrungspunkte zu verteilen.
< Großzügig | m+8 s+4 lvl | Stufenaufstieg für alle! Neue Fähigkeiten, neue Zauber, neues Chaos. | funkeln
> Streng nach Regeln | l+6 m+2 | Alle bekommen exakt 340 EP. Niemand steigt auf. „Nächstes Mal bestimmt.“

§ #se_spaet tisch phase:ende
Es ist 1:30 Uhr. Der Kampf ist noch nicht vorbei.
< Durchziehen | t-6 m+3 s+3 | Um 2:15 fällt der letzte Gegner. Alle sind halb tot, aber glücklich. | schwerter
> Mitten im Kampf pausieren | t+4 s-4 l+2 | „Wir frieren den Kampf ein.“ Nächste Woche weiß niemand mehr, wer wo stand. | frage

§ #se_beute sl phase:ende
Die Gruppe teilt die Beute auf. Es gibt Streit um {item}.
< Würfeln lassen | W10 s+4 ? l+2 : s-6 | {aheld} gewinnt fair. Alle sind zufrieden. :: Der Verlierer schmollt bis zum Ende der Nacht. | gold
> Du entscheidest | l+3 alle-3 t+4 | Du gibst es dem, dem es am meisten nützt. Alle sind gleichmäßig ein bisschen sauer.

§ #se_essen snack phase:ende
{name}: „Sollen wir nächstes Mal grillen?“
< Spiel-Grillabend! | s+8 t-6 alle+4 | Die nächste Session wird ein Grillfest. Es wird viel gegessen und wenig gespielt. | feuer
> Konzentriert spielen | t+4 l+2 laune-6 | „Gerne, aber nach der Kampagne.“

§ #se_lob spieler phase:ende
Zum Abschied sagt {name}: „Das war echt die beste Session bisher!“
< Bescheiden bleiben | s+4 alle+3 | Du strahlst innerlich wie ein Paladin bei Sonnenaufgang. | sonne
> Mehr verraten | s+5 l-3 t+3 | „Wartet erst nächste Woche ab…“ Die Spieler spekulieren im Gruppenchat bis 3 Uhr.

§ #se_hausaufgabe sl phase:ende
Sollen die Spieler bis nächste Woche Hintergrundgeschichten schreiben?
< Ja, bitte! | l+6 laune+0 t-3 | Zwei schreiben Romane, einer schreibt „Waise. Mag Äxte.“
> Lieber nicht | s+2 t+2 | Niemand macht Hausaufgaben. Wie immer.

§ #se_gruppenchat tisch phase:ende
Nach der Session explodiert der Gruppenchat mit Theorien, wer der Verräter ist.
< Mitspekulieren | s+6 l-4 | Du schreibst „Interessante Theorie…“ und klaust die beste Idee für den Plot.
> Schweigen | l+4 s+2 | Dein Schweigen macht alle wahnsinnig. Perfekt.

§ #fin_boss schurke phase:finale
Der letzte Abend. {schurke} steht vor den Helden. Die Luft knistert. „Ihr seid zu spät.“
< Epischer Endkampf | W12 m+5 s+5 t+3 ? sieg lvl : tod2 s+3 | Würfel fliegen, Zauber krachen, {held} landet den letzten Treffer. {schurke} fällt! :: Der Kampf ist brutal. {schurke} entkommt durch ein Portal – nicht ohne ein Opfer zu fordern. | explosion
> Reden statt kämpfen | W14 l+5 ? frieden s+6 : m-5 t-4 | Mit einer bewegenden Rede überzeugt die Gruppe {schurke}, aufzugeben. Tränen. Umarmungen. :: {schurke} lacht nur. „Worte? WORTE?“ Dann fliegt alles in die Luft. | herzen

§ #fin_verrat npc phase:finale
Kurz vor dem Ende enthüllt sich {npc} als Verräter – in Diensten von {schurke}!
< Großer Plot-Twist | l+3 s+6 t+3 W11 ? sieg : tod2 | Die Gruppe kämpft sich trotzdem durch. Am Ende liegt der Schurke am Boden. :: Der Verrat kostet ein Leben. Aber die Geschichte ist erzählt. | ausruf
> Das war ein Test | s+4 l-4 sieg | „Ich habe euch nur geprüft!“ Der Verräter war nie einer. Die Spieler sind verwirrt, aber zufrieden.

§ #fin_drache welt phase:finale
Im Finale erhebt sich ein Drache über {ort}. Er war die ganze Zeit der eigentliche Strippenzieher.
< Alle Kräfte vereint | W13 m+8 s+8 ? sieg lvl : tpk | Pfeile, Feuer, Gebete – der Drache stürzt brüllend vom Himmel. LEGENDÄR. :: Der Drache ist zu stark. Feuer überall. Das war's für die Helden. | drache
> Verhandeln | W12 l+6 ? sieg s+5 : m-8 | Der Drache will nur seinen Hort zurück. Deal! :: Der Drache frisst den Unterhändler. Nicht alle, nur den einen. | gold

§ #fin_ritual sl phase:finale
Das Ritual von {schurke} ist fast vollendet. Die Helden haben eine Runde Zeit.
< Spannung maximal | t+8 s+6 W10 ? sieg : tod | In letzter Sekunde zerbricht {held} den Kristall. Das Ritual scheitert! :: Zu spät. Das Ritual gelingt halb. {schurkeN} fliegt davon, die Welt zittert. | portal
> Die Helden opfern etwas | l+6 s-3 m-4 sieg tod | {held} opfert sich für die anderen. Stille am Tisch. Dann Applaus. | schaedel

§ #fin_lachen chaos phase:finale
Mitten im dramatischen Finale fragt {name}: „Kann ich {schurkeN} einfach eine Pizza anbieten?“
< Würfel drauf | W15 s+10 l-8 ? frieden : tod | {schurkeN} hatte seit 300 Jahren keine Pizza mehr. Er weint. Er gibt auf. :: {schurkeN} hasst Ananas. {held} hatte Ananas drauf. Folgenreich. | pizza
> „Nein.“ | l+4 s-4 t+3 W10 ? sieg : tod2 | Ernsthaft kämpft sich die Gruppe zum Sieg. :: Ernsthaft, aber erfolglos. Ein Held bleibt zurück. | schwerter

§ #fin_zeit tisch phase:finale
Das Finale läuft – und es ist schon 0:40 Uhr. Zwei Leute müssen morgen um 6 raus.
< Schnelles Ende | t+10 l-4 sieg | In zehn Minuten ist {schurkeN} besiegt. Etwas gehetzt, aber erledigt. | konfetti
> Auf nächste Woche | t-8 s+4 l+3 W8 ? sieg : | Das große Finale bekommt eine eigene Session. Würdig! :: Nächste Woche ist plötzlich die halbe Gruppe krank. Das Finale endet unspektakulär.

§ #fin_opfer rolle phase:finale
{name} steht auf. Mit zitternder Stimme: „{held} bleibt zurück und hält die Brücke. Geht!“
< Den Moment geben | l+5 s+8 tod sieg laune+20 | {held} hält die Brücke. Für immer. Der Tisch ist mucksmäuschenstill. Dann weint jemand. | schaedel
> Plot-Rüstung | s+3 m+4 l-6 sieg laune-10 | Der Held überlebt wie durch ein Wunder. {name} ist fast enttäuscht.

§ #pg_haendler power
{name}: „Kann {held} den Händler einfach umhauen und den Laden ausrauben?“
< Nein, Stadtwache | l+6 m-4 laune-6 | Wachen tauchen auf. {name} schmollt hinter dem Charakterbogen.
> Klar, warum nicht | m+10 l-8 s+3 | {held} ist jetzt reich und hat ein Kopfgeld von 4.000 Gold. | gold

§ #pg_multiclass power
{name} will {held} zum Paladin/Hexenmeister/Barden-Multiclass machen. „Ist total legal, hab's durchgerechnet.“
< Erlauben | m+12 l-3 laune+10 | {held} kann jetzt im Kampf heilen, fluchen UND singen. Es ist absurd stark. | magie
> Nur eine Klasse | m-6 l+4 laune-10 | „Das ist doch langweilig!“ {name} rechnet weiter.

§ #pg_schaden power
„Ich mache… 147 Schaden.“ {name} hat irgendwas kombiniert, das du nicht ganz verstehst.
< Lass es zählen | m+10 s+3 l-4 | Der Endboss explodiert in der ersten Runde. Der Tisch ist geschockt. | explosion
> Nachrechnen | l+6 t-8 W12 ? m-4 : m+6 | Es waren eigentlich 31. {name} gibt kleinlaut zu, dass er was falsch gelesen hat. :: Es waren wirklich 147. Respekt. | staub

§ #pg_items power
{name} hat eine Liste mit 12 magischen Gegenständen, die {held} „unbedingt braucht“.
< Einen davon | m+5 l+2 | {held} findet im nächsten Dungeon zufällig genau das Schwert, das er wollte.
> Alle verstecken | m+12 l-5 s+2 | Jeder Dungeon ist jetzt ein Einkaufszentrum. {held} glänzt wie ein Weihnachtsbaum. | gold

§ #pg_tot power wenn:m<40
{name}: „Mein Held ist SCHWACH. Ich hab das Gefühl, ich spiel einen Kartoffelsack.“
< Upgrade-Quest | m+10 t-3 laune+12 | Eine Nebenquest zu einem mächtigen Artefakt. {name} ist wieder Feuer und Flamme. | funkeln
> „Schwäche ist Charakter“ | l+4 laune-12 s-3 | {name} stöhnt sehr laut.

§ #pg_bosslaengen power
{name} will den Endgegner mit einem Schlag töten, bevor du überhaupt den Monolog halten kannst.
< Monolog unterbrechen | m+6 s+5 l-3 t+6 | Mitten im „Ihr Narren!“ trifft ein Pfeil. Der Schurke ist tot. Dein schöner Monolog… | pfeile
> Monolog zuerst | l+4 t-6 s-2 laune-6 | Der Schurke redet. Und redet. {name} spielt währenddessen Handy.

§ #pg_hartkampf power wenn:m>60
{name} langweilt sich. „Die Gegner sind zu leicht. Gib uns mal was Richtiges!“
< Monster hochdrehen | m-10 s+4 t-3 W12 ? lvl : tod | {monster} mit doppelten Lebenspunkten! Der Kampf ist hart, aber geschafft – und alle steigen auf. :: Das war zu viel. {held} fällt. {name}: „Okay… vielleicht doch nicht so hart.“ | treffer
> „Seid froh!“ | m+4 laune-8 | Die Gruppe pflügt weiter durch Gegner wie durch Butter.

§ #pg_minmax power
{name} hat {held} so optimiert, dass Charisma bei 3 liegt. „Ist doch egal, ich rede eh nicht.“
< Dann rede halt nicht | m+6 s-3 l+2 | {held} grunzt sich durch jede Verhandlung. Erstaunlich effektiv.
> Sozialszene erzwingen | l+5 s+6 laune-8 | {held} muss eine Rede beim Königsball halten. Es ist herrlich furchtbar. | lachen

§ #pg_crit power
{name} würfelt eine 20 und will einen „kritischen Enthauptungs-Finisher“ beschreiben – sehr ausführlich.
< Ausführlich lassen | s+6 m+4 t-4 laune+8 | Es ist sehr blutig, sehr dramatisch, mit Zeitlupe. Alle klatschen. | schwerter
> Kurz halten | t+4 laune-4 | „Er fällt um.“ – „ER FÄLLT UM?!“

§ #pg_feuerball power
{name}: „Feuerball. Auf alles. Auch auf die Geiseln.“
< Konsequenzen! | l+8 s-4 m-3 | Die Stadt erklärt die Gruppe zu Gesuchten. Plakate hängen überall. | feuer
> Die Geiseln waren Illusionen | s+5 l-8 m+4 | Glück gehabt! Aber eigentlich… war das nicht etwas zu praktisch? | explosion

§ #pg_level power
„Wann steigen wir endlich auf? Wir sind seit 4 Sessions Stufe {stufe}!“
< Jetzt sofort | m+8 lvl l-2 | Ein Lichtstrahl, ein Ding-Geräusch, alle sind stärker. | funkeln
> Nach dem Dungeon | l+4 laune-6 t-2 | {name} zählt die verbleibenden Räume. Laut.

§ #pg_pvp power
{name} will {aheld} angreifen. „Der hat meine Beute geklaut!“
< PvP erlauben | W11 s+4 t+5 ? m+4 : tod2 s-6 | Ein kurzer Kampf, ein blaues Auge, dann vertragen sie sich. :: Der Streit eskaliert. {aheld} überlebt das nicht. Stimmung im Keller. | treffer
> Kein PvP | l+3 s-2 alle+2 | „Klärt das außerhalb des Spiels.“ Die beiden schmollen um die Wette.

§ #pg_kopfgeld power
{held} hat Lust auf Kopfgeldjagd. „Wer ist hier am meisten wert? Ich will den.“
< {schurkeN} selbst! | m+8 t+8 l-3 | Die Gruppe stürmt direkt zum Schurken. Viel zu früh! | schwerter
> Kleine Fische | l+3 m+3 t-3 | Ein paar Banditen, etwas Gold. Solide Arbeit.

§ #pg_elite power wenn:kamp>1
{name}: „Ich bau mir den Helden so, dass er NICHT sterben kann. Vertrau mir.“
< Okay… | m+12 l-4 laune+8 | {held} hat 9 Leben, 3 Schutzzauber und eine Rüstung aus Drachenzähnen. | funkeln
> Nein. | l+4 laune-10 | {name} murmelt „feige“ in den Würfelbeutel.

§ #pg_kampfrunde power
Es ist der vierte Kampf heute. {name} will noch einen.
< Noch einer! | m+6 t+3 s-3 | {monster} greifen an. {name} jubelt. Der Rest gähnt. | schwerter
> Rollenspiel-Szene | l+4 s+3 laune-8 | Die Gruppe besucht ein Teehaus. {name} wirft vor Frust einen W4 – barfuß drauftreten wird später jemand.

§ #pg_zufallsbeute power
{name} plündert die Leiche des Goblins zum dritten Mal. „Ich suche nochmal gründlicher.“
< Nichts mehr da | l+4 laune-4 | „Ein Knopf. Und ein Zahn. Nichts sonst.“
> Ein geheimes Fach | m+6 s+4 l-4 | In der Unterhose des Goblins: ein Drachenei. Natürlich. | gold

§ #rp_stimme rolle
{name} spricht seit zwanzig Minuten mit verstellter Stimme als {held}. Es ist beeindruckend. Es ist anstrengend.
< Mitmachen | s+6 l+4 t-8 laune+8 | Du antwortest als {npc}, mit Akzent. Es entsteht großes Theater. | musik
> Sanft weiterleiten | t+6 laune-8 | „Okay, und dann geht ihr weiter.“ {name} schaut verletzt.

§ #rp_hintergrund rolle
{name} hat eine elfseitige Hintergrundgeschichte für {held} geschrieben. Mit Stammbaum.
< In den Plot einbauen | l+8 s+5 t-4 laune+15 | Der vermisste Bruder von {held} ist der Hauptmann der Wache! {name} schreit vor Freude. | ausruf
> Überfliegen | t+3 laune-10 | Du liest die erste und die letzte Seite. {name} merkt es.

§ #rp_traene rolle
{held} sitzt am Grab des Mentors. {name} spielt die Szene mit echten Tränen.
< Raum geben | l+6 s+4 t-8 | Der ganze Tisch ist still. Eine der schönsten Szenen der Kampagne. | traenen
> Ein Ghul springt raus | s+6 l-6 t+6 laune-15 | Schreck! Lachen! {name} ist fassungslos. „Das war MEIN MOMENT!“ | geister

§ #rp_romanze rolle
{name} will, dass {held} eine Romanze mit {npc} beginnt.
< Zarte Liebe | l+5 s+5 t-4 laune+10 +romanze | Zwischen Schwertkämpfen gibt es jetzt verstohlene Blicke. Der Tisch shippt. | herzen
> Korb | s+3 laune-8 | {npcN} ist leider schon verheiratet. Mit einem Troll. Sehr glücklich.

§ #rp_romanze2 npc wenn:romanze
{npc} will {held} heimlich treffen. Ein Brief mit einer gepressten Blume liegt im Zimmer.
< Romantisches Date | s+6 l+3 t-5 | Ein Spaziergang im Mondlicht. Der Rest des Tisches macht Kussgeräusche. | herzen
> Eine Falle! | l+4 s+4 m-4 -romanze | Es war ein Doppelagent. {name} ist am Boden zerstört. | ausruf

§ #rp_ingame rolle
{name} besteht darauf, dass alle nur noch in der Ich-Form ihrer Helden reden.
< Okay, voller Immersion | l+8 s+2 t-6 laune+8 | Plötzlich spricht auch {anderer} mit Lispeln. Die Szene ist absurd intensiv.
> Nicht übertreiben | t+4 s+2 laune-6 | „Wir reden normal, okay?“ {name} wechselt in die dritte Person. Aus Protest.

§ #rp_tagebuch rolle
{name} führt ein Tagebuch aus Sicht von {held} und will es zu Beginn jeder Session vorlesen.
< Ja, vorlesen | l+5 s+4 t-6 | Das Tagebuch ist witzig und rührend. Und es erinnert alle, was passiert ist. | staub
> Nur per Chat | t+4 laune-5 | Das Tagebuch landet im Gruppenchat. Niemand liest es.

§ #rp_moral rolle
{held} weigert sich, den gefangenen Goblin zu töten. „Er hat auch eine Familie!“
< Goblin verschonen | l+5 s+5 t-3 +goblinfreund | Der Goblin heißt Snorfi und folgt der Gruppe jetzt überallhin. | herzen
> Gruppe streitet | t-6 s-3 l+3 alle-3 | Zwanzig Minuten Moraldebatte. Der Goblin entkommt währenddessen.

§ #rp_snorfi npc wenn:goblinfreund
Snorfi, der gerettete Goblin, kommt mit einem Geschenk: einer toten Ratte. Und einer Information über {schurkeN}.
< Ratte annehmen | s+8 l+2 | Die Information ist Gold wert. Die Ratte nicht. | lachen
> Nur die Info | l+4 m+3 | Snorfi ist gekränkt. Aber er hilft trotzdem.

§ #rp_akzent rolle
{name} fragt, ob die Elfen in deiner Welt einen bestimmten Dialekt haben. „Ich denke an Schwäbisch.“
< Ja, Elfen schwäbeln | s+10 l-6 | „Grüß Gott, Wandersleut'.“ Der Tisch liegt am Boden. | lachen
> Nein, Elfisch | l+5 laune-3 | Du improvisierst eine Kunstsprache. Sie klingt sehr nach Finnisch.

§ #rp_versprechen rolle
{held} hat einem sterbenden Bauern versprochen, seine Kuh zu einer Schwester nach {ort} zu bringen. Die Kuh ist jetzt seit 3 Sessions dabei.
< Kuh-Quest lösen | l+5 s+6 t-5 | Die Schwester weint vor Glück. Die Kuh auch, irgendwie. | herzen
> Kuh wird Kampfkuh | m+6 s+8 l-6 | Die Kuh lernt Kampfkunst. Ihr Name: Muhammad. | lachen

§ #rp_szene rolle
{name}: „Können wir mal eine Szene ohne Würfel spielen? Nur Reden?“
< Klar, nur Reden | l+6 s+3 t-6 m-2 | Eine lange Lagerfeuerszene. Alle erzählen von ihren Ängsten. Bewegend. | feuer
> Dann aber spannend | t+4 m+3 laune-4 | Mitten im Gespräch greifen Wölfe an. Dramatik! | nacht

§ #rp_nsc rolle
{name} redet mit jedem einzelnen Dorfbewohner. Gerade mit Nummer 14: einem Schäfer.
< Schäfer ausbauen | l+5 s+3 t-8 | Der Schäfer hat eine traurige Geschichte und einen Hinweis! Wer hätte das gedacht. | staub
> „Der Schäfer weiß nichts“ | t+6 laune-6 | „Ich bin nur ein Schäfer.“ Der Satz wird zum Running Gag.

§ #rp_namen rolle
{name} will den Namen von {held} ändern, weil er „nicht mehr zur Entwicklung passt“.
< Zeremonie! | s+5 l+3 t-3 | Ein feierliches Namensritual. {held} heißt jetzt „{held} die Geläuterte“. | glocke
> Ein Spitzname reicht | s+3 | Ab jetzt nennen alle {held} nur noch „Bohne“. Für immer.

§ #rp_spaet rolle wenn:laune<35
{name} wirkt frustriert. „Es wird nur noch gekämpft. Wann spielen wir eigentlich mal ROLLE?“
< Ein Ball am Hof! | l+6 s+4 m-3 laune+20 | Die Gruppe wird zu einem Maskenball eingeladen. Intrigen! Tänze! | musik
> „Kämpfen IST Rolle“ | m+4 laune-10 | {name} verschränkt die Arme.

§ #rp_traum rolle
{name} fragt, ob {held} prophetische Träume haben kann.
< Vision schicken | l+4 s+5 t+2 | Im Traum sieht {held} {schurkeN} auf einem Thron aus Knochen. Gänsehaut. | nacht
> Nur ein Albtraum | s+4 l-2 | {held} träumt, die Zähne fallen aus. Keine Prophezeiung, nur Stress.

§ #rp_brief rolle
{held} will einen Brief an die Mutter schreiben. {name} liest ihn laut vor.
< Mama antwortet | l+5 s+6 t-3 | Die Mutter schickt Kekse und einen Pullover. +2 auf Moral! | herzen
> Postkutsche überfallen | m+3 t+4 s+2 | Der Brief kommt nie an. Aber die Räuber lesen ihn und weinen. | lachen

§ #rl_seite regel
{name}: „Moment. Seite 193, zweiter Absatz: Das darf man so nicht.“
< Nachschlagen | l+8 t-10 laune+8 | Zwölf Minuten Nachschlagen. {name} hat recht. Natürlich. | staub
> Regel 0: SL hat recht | t+4 l-5 laune-10 | „Machen wir heute so.“ {name} schreibt es auf. Für später.

§ #rl_fallschaden regel
{held} fällt 90 Meter tief. {name}: „Das sind laut Regelwerk maximal 20W6 Fallschaden.“
< Würfeln! | W9 l+5 ? m+3 s+4 : tod | Wie durch ein Wunder: nur 34 Schaden. {held} steht wieder auf. :: Das sind 81 Schaden. {held} ist… Brei. | wuerfelregen
> Ein Heuwagen | s+6 l-6 | Unten steht zufällig ein Heuwagen. Klassiker. | lachen

§ #rl_inventar regel
{name} will das Gewicht des Inventars aller Helden ausrechnen. Inklusive Münzen.
< Mach mal | l+10 t-8 m-3 | Die Gruppe ist überladen und braucht einen Esel. Der Esel heißt Kevin. | staub
> Nein danke | l-4 laune-8 s+2 | {name} rechnet heimlich weiter und seufzt bei jeder Münze.

§ #rl_gelegenheit regel
„Der Goblin läuft weg, das provoziert einen Gelegenheitsangriff!“
< Ja, natürlich | l+5 m+3 | {name} erklärt die Regel, alle lernen etwas. Der Goblin stirbt. | schwerter
> Lass ihn laufen | l-4 s+3 laune-5 | Der Goblin erzählt seinem Clan von der Gruppe. Das wird noch Folgen haben.

§ #rl_lichtquelle regel
{name}: „Hat eigentlich irgendwer eine Lichtquelle? Wir sind seit drei Räumen in totaler Dunkelheit.“
< Stimmt, alles dunkel | l+8 s+3 m-4 t-3 | Panik! Niemand hat eine Fackel. Der Halbling hat nur Kerzenstummel. | dunkel
> „Ihr habt Fackeln“ | t+3 l-4 laune-6 | „Woher?“ – „Die waren halt da.“ {name} ist empört.

§ #rl_rasten regel
{name}: „Wir rasten. Lang. Mit allem: Wachschichten, Zelte, Rationen.“
< Wachschichten auswürfeln | l+6 t-6 W10 ? m+5 : tod2 | Die Nacht verläuft ruhig. Am Morgen sind alle frisch. :: Nachts greifen {monster} an. Jemand hatte die Wache verschlafen. | nacht
> „Ihr rastet. Morgen.“ | t+5 l-3 m+4 | Zack, alle geheilt. {name} hätte gern die Zelte beschrieben.

§ #rl_kompendium regel
{name} hat ein selbst geschriebenes Kompendium mit Hausregeln mitgebracht. 64 Seiten. Gebunden.
< Einführen | l+12 s-4 t-6 laune+12 | Die neuen Regeln sind… erstaunlich durchdacht? Kritische Fehlschläge haben jetzt Tabellen.
> „Ich les es mal“ | laune-8 s+2 | Das Kompendium wandert in dein Regal. Neben das andere Kompendium.

§ #rl_streit regel
{name} und {anderer} streiten, ob man unter Wasser Feuerbälle zaubern kann.
< {name} hat recht | l+6 laune+6 s-2 | „Natürlich nicht! Physik!“ – „Es ist MAGIE!“ – „Physik!“
> Es zischt nur | s+6 l+2 t-2 | Der Feuerball wird zu einer großen Blubberblase. Alle zufrieden. | wellen

§ #rl_charakterbogen regel
{name} merkt, dass {aheld} seit drei Sessions einen Bonus von +4 auf alles benutzt, den es gar nicht gibt.
< Korrigieren | l+8 m-6 s-3 | {anderer} wird kleinlaut. Die Gruppe ist plötzlich viel schwächer.
> Ignorieren | m+3 l-6 laune-10 | {name} reibt sich die Schläfen. Sehr deutlich.

§ #rl_initiative regel
Der Kampf beginnt. Wie wird die Initiative gehandhabt?
< Einzeln würfeln | l+6 t-5 | Jeder würfelt, du notierst, es dauert. Aber es ist fair. | wuerfelregen
> Gruppenweise | t+6 l-4 | Erst die Helden, dann die Monster. Schnell und schmutzig.

§ #rl_zauberkomp regel
„Hast du überhaupt die Materialkomponente für den Zauber? Eine Perle im Wert von 100 Gold?“
< Nein, Zauber scheitert | l+8 m-5 s-3 | Der Zauberer durchsucht verzweifelt seine Taschen. Nur Fussel. | staub
> Zauberbeutel reicht | l-3 t+3 laune-5 | „Ist halt im Zauberbeutel.“ – „Magischer Kapitalismus“, murmelt {name}.

§ #rl_diagonal regel
{name}: „Diagonal laufen kostet auf dem Raster doppelt. Jedes zweite Feld!“
< Genau so | l+6 t-4 m-2 | Die Gruppe kommt nicht mehr an den Bogenschützen ran. Taktisch korrekt.
> Raster weg! | t+5 s+3 l-4 laune-8 | „Wir spielen jetzt ohne Raster.“ {name} sieht aus, als hättest du seinen Hund getreten.

§ #rl_ausgerechnet regel wenn:laune<30
{name} hat aufgehört zu reden. Er blättert nur noch stumm im Regelbuch und schüttelt den Kopf.
< Lass ihn eine Regel bestimmen | l+8 laune+20 | {name} darf eine Regel festlegen. Er wählt Belastungsregeln. Natürlich.
> Ansprechen | s+3 laune+8 t-4 | „Alles okay?“ – „Ja. Ich finde nur, Fallschaden ist zu niedrig.“

§ #rl_stealth regel
{held} schleicht in voller Plattenrüstung. {name}: „Da gibt's Nachteil drauf!“
< Nachteil | W14 l+5 ? s+6 : s+3 m-4 | Unfassbar: Er schafft es trotzdem! Die Wachen schlafen tief. :: KLONK. KLIRR. SCHEPPER. Alle Wachen wachen auf. | schwerter
> Ohne Nachteil | l-5 m+3 laune-6 | Die Rüstung ist „sehr gut geölt“. {name} schnaubt.

§ #rl_zufall regel
{name} hat herausgefunden, dass deine Zufallsbegegnungs-Tabelle nicht ganz zufällig ist. Es kommen immer Goblins.
< Neue Tabelle | l+6 t-3 | Ab jetzt: Goblins, Wölfe, ein verwirrter Gnom und sehr selten ein Drache.
> „Es ist eine Goblin-Region“ | s+5 l-2 | Die Gruppe findet heraus, warum: Ein Goblin-Imperium plant etwas Großes! | lachen

§ #rl_tod regel
{name}: „Laut Regeln ist {aheld} jetzt tot. Er hat drei Rettungswürfe verpatzt.“
< Regeln sind Regeln | l+8 tod2 s-3 | {aheld} stirbt. {anderer} schaut traurig auf den Charakterbogen. | schaedel
> Eine göttliche Fügung | l-6 s+3 m+2 laune-10 | Ein Lichtstrahl. {aheld} lebt. {name} notiert: „Göttliche Willkür, Sitzung 7“.
`);
