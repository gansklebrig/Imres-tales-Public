/* =====================================================================
   TALES NEVER END – Kartenpaket 3: Theaterkind, Zeichnerin, Musiker,
   beliebige Spieler, das echte Leben am Tisch, Tischkatze, Besuch
   ===================================================================== */
(window.TNE_KARTEN = window.TNE_KARTEN || []).push(String.raw`

§ #dr_monolog drama
{name} steht auf, legt die Hand aufs Herz und beginnt einen Monolog als {held}. Er dauert schon sieben Minuten.
< Applaus! | s+6 l+3 t-8 laune+12 | Standing Ovations. {anderer} wischt sich eine Träne weg. | musik
> Ein Pfeil unterbricht | t+6 s+4 laune-10 | Mitten im „Und so schwöre ich—“ trifft ein Pfeil die Mütze. | pfeile

§ #dr_tod drama
{name} möchte, dass {held} einen dramatischen Heldentod stirbt. „Es wäre so poetisch!“
< Gönn es {ihm} | tod s+6 l+4 laune+20 | Ein Opfer im Sonnenuntergang. Alle sind ergriffen. Dann würfelt {name} sofort einen neuen. | schaedel
> „Du bist zu wichtig“ | m+3 laune-8 | {name} ist enttäuscht, dass {held} weiterleben muss.

§ #dr_spotlight drama
{name} hat in jeder Szene die Hauptrolle. {anderer} hat seit einer Stunde nichts gesagt.
< Spotlight verteilen | l+3 s+3 laune-8 alle+4 | {npc} spricht {aheld} direkt an. Endlich darf {anderer} glänzen.
> Laufen lassen | s+4 t-4 alle-4 laune+8 | {name} ist großartig. Der Rest schaut zu.

§ #dr_verkleidung drama
{name}: „{held} verkleidet sich als die Königin, um in den Palast zu kommen.“
< Täuschen-Wurf | W14 s+10 l-4 ? m+4 : m-6 | Die Wachen verbeugen sich. Die echte Königin auch, aus Verwirrung. :: Die Perücke rutscht im falschen Moment. Kerker statt Thronsaal. | krone
> Die echte Königin steht da | s+8 t+5 | Zwei Königinnen. Ein Raum. Eine sehr peinliche Stille. | ausruf

§ #dr_akzent drama
{name} spricht ab heute mit französischem Akzent, weil {held} „aus dem Süden kommt“.
< Ganz Frankreich-Fantasy | s+8 l-3 | Plötzlich haben alle NSCs Akzente. Der Ork klingt wie ein Pariser Kellner. | lachen
> Lieber nicht | l+3 laune-8 | {name} versucht es trotzdem und rutscht ins Italienische ab.

§ #dr_tragik drama
{name} hat heimlich eine tragische Wendung für {held} geplant: „{held} ist eigentlich das Kind von {schurkeN}!“
< Einbauen! | l-3 s+8 t+3 laune+15 +sohn >>dr_sohn2 | Die Enthüllung platzt mitten in die Schlacht. Kollektives Kreischen. | ausruf
> Nein, das ist dein Plot | l+5 laune-10 | „{held} ist das Kind eines Bäckers.“ {name} sinkt in sich zusammen.

§ #dr_sohn2 schurke kette wenn:sohn
{schurke} hält inne. „{held}… mein Kind. Komm an meine Seite.“
< Zum Schurken überlaufen | s+8 l-4 m+6 t+5 | {held} läuft über! Die Gruppe ist geschockt. Der Tisch tobt. | ausruf
> „Niemals!“ | l+5 s+6 W12 ? m+5 : tod | {held} schlägt das Angebot aus. Ein Familiendrama in Rüstung. :: Das Familiendrama endet tragisch. | treffer

§ #dr_lied drama
{name} will ein selbstgeschriebenes Lied über die Abenteuer der Gruppe vorsingen.
< Bühne frei! | s+10 t-6 laune+12 | Es reimt „Drache“ auf „Rache“ und „Bier“ auf „hier“. Ein Hit. | musik
> Später | laune-8 t+3 | Das Lied wird im Gruppenchat als Sprachnachricht verschickt. 6 Minuten lang.

§ #dr_schrei drama
Bei jedem Angriff schreit {name} den Namen der Attacke. Laut. Die Nachbarn klopfen.
< Mitspielen | s+8 t+3 | Bald schreien alle ihre Attacken. „DONNERSCHLAG DER GERECHTIGKEIT!“ | blitz
> Leiser bitte | l+3 laune-6 | Die Attacken werden jetzt geflüstert. Das ist irgendwie gruseliger.

§ #dr_weinen drama wenn:tote>0
{name} besteht auf einer Beerdigung für {tot}. Mit Grabrede. Mit Gesang.
< Würdige Zeremonie | l+5 s+3 t-8 | Die Grabrede ist wunderschön. Der Tisch steht schweigend. | traenen
> Kurze Andacht | t+4 laune-6 | „Ruhe in Frieden.“ – „Das ist ALLES?“

§ #dr_drama drama wenn:laune<30
{name} seufzt theatralisch. „Ich habe das Gefühl, meine Figur bedeutet niemandem etwas.“
< Persönliche Questline | l+5 s+4 laune+25 | Eine Prophezeiung handelt ausgerechnet von {held}! {name} blüht auf. | funkeln
> „Du bist wichtig!“ | laune+8 s+2 | Ein kurzer Moment. {name} lächelt. Ein bisschen.

§ #dr_auftritt drama
Die Gruppe muss als Schauspieltruppe in eine Burg. {name} hat sofort ein ganzes Stück geschrieben.
< Aufführen! | s+10 l+2 t-8 | Das Stück heißt „Der Fall des Tyrannen“. Der Tyrann sitzt in der ersten Reihe. | musik
> Nur kurz spielen | t+4 W12 ? s+5 : m-4 | Fünf Minuten Improtheater, dann rein. :: Die Wachen erkennen das Stück als Satire. Verhaftung! | ausruf

§ #ku_zeichnung kunst
{name} hat {npcN} gezeichnet – viel hübscher als in deiner Beschreibung.
< Das Bild gilt ab jetzt | s+6 l-2 laune+12 | Der NSC wird zum Liebling der Gruppe. Alle wollen {npcN} beschützen. | herzen
> In Wahrheit eher hässlich | l+3 laune-8 s+2 | {name} radiert seufzend einen Buckel dazu.

§ #ku_karte kunst
{name} zeichnet während der Session ununterbrochen. Gerade hat {er} nicht zugehört.
< Kurz zusammenfassen | t-3 laune+5 | {name} zeigt dir die Zeichnung: Die Gruppe in einer epischen Pose. Wunderschön. | staub
> Dann eben verpasst | t+3 laune-5 s+2 | {held} steht plötzlich alleine vor einer Wache. „Wie bin ich hier hingekommen?“

§ #ku_monster kunst
{name} hat das Monster von letzter Woche gemalt. Es ist viel gruseliger als deine Beschreibung.
< Es kommt zurück! | m-4 s+6 t+3 | Das Monster ist wieder da – genau wie auf dem Bild. Alle schreien. | geister
> Ins Kampagnenbuch | l+4 s+3 laune+8 | Das Bild bekommt einen Ehrenplatz in deinem Notizbuch.

§ #ku_buch kunst
{name} schlägt vor, ein gezeichnetes Kampagnentagebuch zu führen – mit allen Szenen.
< Großartige Idee | l+5 s+5 laune+12 | Nach drei Sessions ist es ein Kunstwerk. Ihr wollt es drucken lassen. | staub
> Zu viel Arbeit | laune-6 | {name} malt es trotzdem. Nur für sich.

§ #ku_ruhe kunst wenn:t>70
{name} murmelt: „Es geht alles so schnell, ich komm mit dem Zeichnen gar nicht hinterher.“
< Pause & Lagerfeuer | t-10 s+4 laune+15 | Eine ruhige Szene am Lagerfeuer. {name} zeichnet die Gruppe im Feuerschein. | feuer
> Weiter, weiter | t+3 laune-10 | Die Skizze bleibt halbfertig. {held} hat nur einen Arm.

§ #ku_figuren kunst
{name} hat Miniaturen für alle Helden bemalt. Die von {aheld} hat aus Versehen drei Augen.
< Kanonisch! | s+8 l-4 | {aheld} hat ab jetzt ein drittes Auge. Es sieht in die Zukunft. Manchmal. | magie
> Übermalen | l+2 s+2 | Das dritte Auge verschwindet. Aber alle wissen davon.

§ #mu_ukulele musik
{name} holt die Ukulele raus. // „Barradin-Style: Ich verzaubere den Wächter mit einem Lied!“
< Echt singen lassen! | W10 s+10 t-4 ? m+3 : l-3 | Es ist erstaunlich gut. Der Wächter schläft ein. Zwei Spieler auch. :: Die Saite reißt. Der Wächter auch. Aus. | musik
> Nur würfeln | t+3 laune-6 | {name} würfelt. 14. Die Ukulele bleibt traurig im Koffer.

§ #mu_titelsong musik
{name} hat einen Titelsong für die Kampagne „{kampagne}“ komponiert.
< Vor jeder Session! | s+8 t-4 laune+12 | Ab jetzt beginnt jede Session mit dem Lied. Alle summen mit. | musik
> Nur einmal | s+3 | Ihr hört ihn einmal. Er ist ein Ohrwurm. Für Wochen.

§ #mu_trommel musik
{name} trommelt bei jedem Kampf auf dem Tisch. Die Würfel hüpfen.
< Kampftrommeln! | s+6 t+6 | Die Atmosphäre ist wild. Ein Würfel fällt in die Chips. | schwerter
> Bitte nicht | l+2 laune-8 | Die Würfel stehen still. {name}s Finger zucken.

§ #mu_barde musik
{name} und {anderer} gründen im Spiel eine Barden-Band. Name: „Die Wandelnden Würfel“.
< Tournee! | s+10 l-5 t+3 | Die Gruppe spielt Konzerte in jeder Stadt. Der Plot wartet. Geduldig. | musik
> Plot vor Musik | l+4 alle-3 | Die Band trennt sich nach einem Auftritt. Kreative Differenzen.

§ #mu_falsch musik
{name} singt das Wiegenlied der Elfen. Es klingt wie ein Gnom mit Erkältung.
< Wirkung umdrehen | s+8 l-3 | Statt einzuschlafen greifen die Wachen wütend an. Akustischer Angriff! | lachen
> Wirkt trotzdem | m+3 s+3 laune+5 | Die Wachen schlafen ein. Wahrscheinlich aus Selbstschutz. | zzz

§ #sp_pause spieler
{name} muss mal kurz telefonieren. // „Fünf Minuten!“
< Weiter ohne | t+3 laune-4 | {held} wird währenddessen von einem Mimik-Stuhl angeknabbert. | lachen
> Pause für alle | t-6 s+3 | Pause. Alle holen Getränke. Nach 20 Minuten geht's weiter.

§ #sp_frage spieler
{name}: „Was riecht {held} eigentlich gerade?“
< Ausführlich | l+5 s+3 t-4 | Moder, nasses Fell und … Zimt? Seltsam. Ein Hinweis! | nebel
> „Dungeon.“ | t+3 laune-3 | „Dungeon riecht nach Dungeon.“

§ #sp_kaffee spieler
{name} kippt Cola über den Charakterbogen.
< Neuer Bogen | t-6 l+2 | Zwanzig Minuten Abschreiben. {held} hat jetzt drei Fertigkeiten mehr. Zufall. | staub
> Fleck als Narbe | s+6 l-2 | Der Fleck ist jetzt eine Narbe im Gesicht von {held}. Mit Geschichte. | lachen

§ #sp_nachfrage spieler
{name}: „Wie viele Goblins sind es genau?“
< Genau sieben | l+3 t+2 | „Sieben.“ {name} plant präzise.
> „Viele.“ | s+3 l-3 | „Wie viele ist viele?“ – „Genug.“

§ #sp_entdeckung spieler
{held} untersucht eine unscheinbare Wand. {name} würfelt Wahrnehmung.
< Geheimgang! | W12 s+5 ? m+5 l+2 : t-3 | Ein Geheimgang führt direkt zur Schatzkammer! :: Nichts. Nur eine Wand. Eine sehr gut gemachte Wand. | staub
> Nichts dort | t+3 laune-4 | Es ist wirklich nur eine Wand. Diesmal.

§ #sp_schlaf spieler wenn:t<30
{name} ist am Tisch eingeschlafen. // Mit dem Kopf auf dem Würfelturm.
< Held schläft auch | s+4 t+2 | {held} schläft im Spiel ein. Ein Kobold malt {h_ihm} einen Schnurrbart. | zzz
> Wecken mit Gong | s+5 t+5 laune-6 | GONG! // {name} wirft vor Schreck Initiative. | glocke

§ #sp_gold spieler
{name} will {held}s gesamtes Gold für ein Pferd ausgeben. Ein besonderes Pferd.
< Ein Einhorn! | m+6 s+5 l-5 | Das Pferd ist ein Einhorn. Es hat Allergien. | funkeln
> Ein normales Pferd | l+5 s+2 | Das Pferd heißt Gaul. Es ist zufrieden.

§ #sp_frisch spieler
{name} hat heute keine Lust auf Kämpfe. „Können wir nicht einfach einkaufen gehen? Im Spiel?“
< Shoppingtour! | s+6 l+2 t-5 m+4 | Ein Markttag in {ort}. Feilschen, Gerüchte, ein verfluchter Hut. | gold
> Kampf zuerst | m+3 t+3 laune-8 | {monster} greifen auf dem Weg zum Markt an.

§ #sp_einschuechtern spieler
{name} will {npcN} verhören. „Ich lass mein Schwert ganz langsam schleifen. Ganz langsam.“
< Einschüchtern | W12 s+5 ? l+4 m+3 : s-3 | {npcN} redet wie ein Wasserfall. :: {npcN} lacht und schleift ein eigenes, größeres Schwert. | schwerter
> Bestechen stattdessen | l+3 s+2 | Zehn Gold, und {npcN} erzählt alles. Und noch mehr.

§ #sp_plan spieler
Die Gruppe plant seit 45 Minuten den Einbruch in den Turm. Niemand hat bisher gewürfelt.
< Abkürzen | t+8 laune-3 | „Ihr seid drin. Was jetzt?“ Panik – sie haben nur den Einstieg geplant. | ausruf
> Weiter planen lassen | t-8 l+5 m+3 | Der Plan wird perfekt. Er hat Phasen. Und Codewörter. | staub

§ #sp_kritfehl spieler
{name} würfelt eine natürliche 1 beim Angriff.
< Spektakulärer Patzer | s+8 m-3 | {held} stolpert, das Schwert fliegt, trifft einen Kronleuchter, der auf den Gegner fällt. Treffer?! | lachen
> Einfach verfehlt | l+3 | Daneben. // Ganz normal daneben.

§ #sp_zweifel spieler
{name}: „Ist das eigentlich eine Falle? Das sieht aus wie eine Falle.“
< Ja, Falle | W11 l+4 ? m+3 : m-4 | {held} entschärft sie mit Bravour. :: Die Falle schnappt zu. Ein Finger weniger. Vielleicht. | staub
> Paranoia lohnt nicht | s+4 t-5 | Es war keine Falle. Die Gruppe hat 20 Minuten einen Teppich untersucht.

§ #sp_tier spieler
{name} will ein Tier zähmen. Ganz egal welches. Gerade steht ein Dachs vor {held}.
< Dachs zähmen | W13 s+8 ? m+3 l-2 : tod | Der Dachs wird zum treuesten Begleiter der Gruppe. Er heißt Herr Krause. :: Der Dachs ist… sehr wütend. Unglaublich wütend. | herzen
> Dachs flieht | s+2 l+3 | Der Dachs verschwindet im Unterholz. Er wird sich erinnern.

§ #sp_lieblings spieler
{name} hat einen Lieblings-NSC: {npc}. Jede Session kommt die Frage, was {npcN} gerade macht.
< Eine eigene Questline | l+3 s+6 laune+10 | {npcN} hat ein Geheimnis! Die Gruppe hilft. | herzen
> {npcN} stirbt | s-4 l+5 t+3 laune-15 | Der Lieblings-NSC stirbt. {name} schwört blutige Rache. Motivation! | schaedel

§ #sp_jemand spieler
{name}: „Ist {held} eigentlich verheiratet? Ich hab vergessen, was ich mir ausgedacht hab.“
< Ja, glücklich | l+3 s+4 | {held} hat eine Frau, drei Hühner und eine Ziege daheim.
> Es war kompliziert | s+6 l-2 | {held} hat einen Ex. Einen Vampir. Er schreibt noch Briefe.

§ #sp_seil spieler
„Wir haben doch ein Seil, oder?“ // „Jede Gruppe hat ein Seil.“
< Niemand hat ein Seil | l+6 s+3 t-4 | Fünfzehn Meter Abgrund. Kein Seil. Großes Drama. | frage
> Klar habt ihr ein Seil | t+5 l-3 | „Natürlich. 50 Fuß Hanfseil.“ Abenteuer gerettet.

§ #sp_dieb spieler
{name} merkt, dass {aheld} heimlich aus dem Gruppenschatz klaut.
< Konfrontation | s+5 t+3 alle-4 | Ein Streit im Spiel. Ein Streit am Tisch. Eine Versöhnung bei Pizza. | ausruf
> Ignorieren | l+2 s+2 | Es bleibt ein Geheimnis. Vorerst.

§ #sp_unsichtbar spieler
{name} will den ganzen Abend unsichtbar bleiben. „Ich bin einfach still dabei.“
< Okay | t+3 | {held} folgt der Gruppe unsichtbar und hätte fast den Schatz verpasst.
> Ein Hund riecht {held} | s+5 l+2 | Ein Hund schnüffelt an der leeren Luft und wedelt. Enttarnt! | lachen

§ #sp_schwimmen spieler
{held} kann nicht schwimmen. // Die Brücke ist gerade eingestürzt.
< Athletik-Wurf | W12 s+5 ? m+3 : tod | {held} paddelt panisch und schafft es. Wie ein nasser Hund. :: Blubb. Blubb. Stille. | wellen
> {aheld} springt hinterher | l+3 s+3 | {aheld} zieht {held} am Schopf aus dem Wasser. Eine Lebensschuld ist entstanden.

§ #sp_namevergessen spieler
{name} hat vergessen, wie {held} heißt. „Ähm… Grim… Grom… na, {h_der} mit dem Schwert.“
< Neuer Name | s+5 l-3 | Ab jetzt heißt {held} offiziell „{h_Der} mit dem Schwert“. Klingt fast heldenhaft.
> Bogen zeigen | l+2 | „Ach ja, {held}!“ {name} schreibt es sich groß auf die Hand.

§ #sp_ehrlich spieler
{name}: „Ich glaub, {held} würde das nicht tun. Kann ich das rückgängig machen?“
< Zurückspulen | l-3 t-3 laune+8 | Ihr spult zurück. Zeitreise am Spieltisch.
> Konsequenzen leben | l+5 s+3 laune-4 | {held} muss mit der Entscheidung leben. Gute Geschichte!

§ #sp_wiederkehr spieler wenn:tote>0
{name} fragt, ob {tot} nicht als Geist zurückkehren kann.
< Geist erlauben | s+6 l-4 geist | {tot} spukt jetzt um die Gruppe herum und gibt ungefragt Ratschläge. | geister
> Tot bleibt tot | l+5 laune-6 | {tot} bleibt in Frieden. Oder ist zumindest still.

§ #sp_hund spieler
{name}: „Kann {held} einen Hund haben? So wie Friedrich in Imres Tales?“
< Ein treuer Hund! | s+8 l+2 m+3 | Der Hund heißt Rex der Zweite. Er findet jede Spur und jedes Würstchen. | herzen
> Eine Katze | s+5 | Die Katze ignoriert {held} komplett. Wie echte Katzen.

§ #sp_laute spieler
{name} will einen elfischen Barden spielen, der jeden NSC verführen will. „Ich nenn ihn… Barradin.“
< Gute Wahl | s+8 l-3 held | Der neue Barde stimmt sofort die Laute. Drei NSCs erröten. Ein Spielleiter seufzt. | musik
> Der Name ist vergeben | l+3 laune-4 | „Den gibt's schon. Er ist legendär.“

§ #ti_klingel tisch
Es klingelt. Der Pizzabote. // Mitten im Bosskampf.
< Kampf pausieren | t-6 s+5 | Pizzapause! Der Boss wartet. Geduldig. Er hat ja Zeit. | pizza
> Einer geht | s+2 t+2 | Der Spieler an der Tür verpasst den wichtigsten Wurf des Abends.

§ #ti_nachbarn tisch
Die Nachbarn klopfen gegen die Wand. Es ist 23:15. // Der Barbar schreit seit einer Stunde.
< Flüster-Modus | l+3 s+5 t-3 | Der Rest des Kampfes wird geflüstert. Es ist sehr spannend und sehr albern. | lachen
> Musik lauter | s+4 l-2 | Jetzt klopfen auch die anderen Nachbarn.

§ #ti_stromausfall tisch
Stromausfall! Nur noch Kerzen.
< Gruselszene! | l+5 s+8 t-2 | Im Kerzenschein erzählst du eine Geistergeschichte. Alle bekommen Gänsehaut. | geister
> Handylicht | t+3 s-2 | Alle leuchten mit Handys. Die Atmosphäre ist… effizient.

§ #ti_streit tisch
Zwei Spieler streiten außerhalb des Spiels über Politik. Die Stimmung kippt.
< Zurück ins Spiel | l+3 alle+3 t+3 | „Leute! Ein Drache!“ Ablenkung funktioniert. | drache
> Pause machen | t-6 s-3 alle+5 | Zehn Minuten frische Luft. Danach geht's besser.

§ #ti_tisch tisch
Der Tisch ist voller Würfel, Chips, Charakterbögen und drei leeren Flaschen. Niemand findet mehr die Karte.
< Aufräumen! | l+4 t-4 s-2 | Ordnung. // Dann stellt jemand ein Glas auf die Karte. | staub
> Chaos akzeptieren | s+4 l-3 | Die Karte ist jetzt unter den Chips. Die Chips sind jetzt ein Gebirge.

§ #ti_mama tisch
Das Handy von {name} klingelt. Es ist {seine} Mutter. Sie will wissen, ob {er} schon gegessen hat.
< Grüße an Mama | s+6 t-3 | Der ganze Tisch ruft „Hallo!“. Mama will mitspielen. | lachen
> Wegdrücken | t+2 laune-3 | Sie ruft dreimal an. {name} geht doch ran.

§ #ti_wuerfelweg tisch
Ein Würfel rollt vom Tisch und verschwindet unter dem Sofa. Er zeigt… niemand weiß es.
< Zählt als 20 | s+6 l-4 | Der Sofa-Gott hat gesprochen! | wuerfelregen
> Neu würfeln | l+3 | Unter dem Sofa findet ihr zwei weitere verschollene Würfel und eine Socke.

§ #ti_gast tisch
Jemand aus der WG kommt heim und schaut euch beim Spielen zu. „Was macht ihr da?“
< Einladen | s+5 neu t-4 | Sofort Feuer und Flamme. Nächste Woche gibt es einen Charakter mehr am Tisch. | konfetti
> „Wir lernen“ | l+2 s+3 | „Lernen? Mit Drachen?“ Kopfschütteln, Abgang in die Küche.

§ #ti_corona tisch
Zwei Spieler sind krank und spielen online zugeschaltet. Das WLAN ruckelt.
< Durchziehen | t-5 s-3 l+2 | „Kannst du das wiederholen?“ – „Kannst du das wiederholen?“ – „Du bist eingefroren!“
> Zusatz-Session | t+3 s+3 | Ihr spielt heute nur einen Nebenquest-Oneshot. Ganz entspannt.

§ #ti_regen tisch ort:regen
Draußen tobt ein Unwetter. Drinnen ist es gemütlich. Perfektes Spielwetter.
< Gruselatmosphäre nutzen | l+4 s+6 | Im Spiel tobt jetzt auch ein Sturm. Blitz und Donner passen perfekt. | blitz
> Gemütliche Szene | s+4 t-4 alle+3 | Die Helden sitzen am Kamin einer Taverne. Spiel und Wirklichkeit verschwimmen. | regen

§ #ti_lieferdienst tisch
Die Pizza ist seit 90 Minuten unterwegs. Die Stimmung sinkt mit jeder Minute.
< Notfall-Nudeln | s+5 t-5 alle+4 | Du kochst Nudeln. Die Pizza kommt, als alle satt sind. | pizza
> Ablenkung im Spiel | t+5 s-3 | Ein spannender Kampf lenkt vom Hunger ab. Fast.

§ #ti_spielabend tisch
Alle haben heute nur zwei Stunden Zeit.
< Kurze Action-Session | t+8 m+3 s+3 | Ein Kampf, eine Flucht, ein Cliffhanger. Effizient! | schwerter
> Lieber verschieben | t-6 s-3 l+2 | Ihr redet nur über Pläne. Es wird trotzdem nett.

§ #ti_zettel tisch
{name} schiebt dir heimlich einen Zettel zu: „{held} will {aheld} heimlich verraten.“
< Erlauben | s+6 l+3 t+3 +verrat >>ti_verrat2 | Ein Geheimplot im Plot. Du grinst unauffällig. | ausruf
> Zettel zurück | l+2 laune-6 | Du schreibst „Nein“ und ein Smiley darauf.

§ #ti_verrat2 spieler kette wenn:verrat
Der Verrat fliegt auf! {aheld} kommt hinter den geheimen Plan von {held}.
< Großes Drama | s+8 t+5 alle-4 | Schreie, Anklagen, Tränen. Bester Abend seit Monaten. | ausruf
> Versöhnung | l+4 s+4 alle+4 | Es war ein Missverständnis. Fast. | herzen

§ #ti_kerze tisch
Die Duftkerze auf dem Tisch riecht nach „Drachenfeuer“. Also nach Zimt und Rauch.
< Atmosphäre! | s+4 l+3 | Alle fühlen sich wie in einer Taverne. | kerze
> Fenster auf | t+2 | Die Kerze wird gelöscht. Zwei Leute husten noch.

§ #ti_musik tisch
Die Hintergrundmusik spielt plötzlich einen Popsong statt epischer Musik.
< Weiter so! | s+8 l-4 | Die Schlacht läuft zu „Eye of the Tiger“. Niemand beschwert sich. | musik
> Schnell wechseln | l+3 | Zurück zu Harfen und Trommeln.

§ #ti_wlan tisch
{name} hat ein Problem: Das Online-Würfelprogramm ist abgestürzt.
< Echte Würfel! | l+3 s+3 | Klack, klack. So muss das. | wuerfelregen
> Würfel-Apps diskutieren | t-6 s-2 | Zwanzig Minuten Debatte, welche App am fairsten ist.

§ #ti_neuerort tisch
Eure Stammkneipe, in der ihr spielt, schließt heute früher.
< Umzug ins Wohnzimmer | t-5 s+4 | Mit Snacks und Decken. Gemütlich!
> Im Park weiterspielen | s+6 l-3 t+3 | Zwischen Joggern und Enten. Eine Ente wird NSC. | federn

§ #ka_wuerfel katze
Die Tischkatze springt auf den Tisch und schiebt einen Würfel ganz langsam über die Kante.
< Es zählt, was er zeigt | W10 s+6 ? m+4 : m-4 katze | Eine 18! Die Katze ist ein Glücksbringer. :: Eine 1. Die Katze schaut dich an. Sie wusste es. | lachen
> Neu würfeln | l+3 | Die Katze schiebt den nächsten Würfel runter. Und den nächsten.

§ #ka_karte katze
Die Katze hat sich auf die Karte gelegt. Genau auf den Ort, an den die Gruppe will.
< Die Katze bleibt | s+5 l-3 | Ihr spielt um die Katze herum. Sie ist jetzt ein Gebirge im Spiel.
> Sanft heben | l+2 | Sie faucht. // Dann geht sie zur Würfelschale.

§ #ka_spielen katze
Die Katze hat einen W4 verschluckt. // Oder jedenfalls ist er weg.
< Panik! | t-8 s+3 katze | Ihr sucht zwanzig Minuten. Der Würfel ist unter dem Kühlschrank. Die Katze ist unschuldig. Diesmal. | frage
> Ach, ein W4 | s+2 | Niemand vermisst W4s. Niemand.

§ #ka_npc katze
Die Katze maunzt laut, genau als {npc} spricht.
< Der NSC hat eine Katze | s+6 | {npcN} hat ab sofort eine sprechende Katze auf der Schulter. | lachen
> Weiter im Text | l+2 | Die Katze maunzt erneut. Sie fühlt sich ignoriert.

§ #ka_schlaf katze
Die Katze schläft auf dem Charakterbogen von {name}.
< Inspiration für alle | s+5 alle+3 | Niemand traut sich, sie zu wecken. Ihr spielt aus dem Gedächtnis.
> Den Bogen retten | t+2 laune-3 | Katzenhaare überall. Der Bogen riecht nach Thunfisch.

§ #gs_mutter gast
Die Mitbewohnerin kommt heim und fragt: „Spielt ihr schon wieder dieses Drachending?“
< Einmal würfeln lassen | s+4 t-3 | Sie würfelt einmal für einen Goblin, trifft und geht zufrieden ins Bett. „Okay. Verstehe.“ | konfetti
> „Wir sind fast fertig“ | t+3 | Ihr seid nicht fast fertig.

§ #gs_lieferant gast
Der Pizzabote sieht die Würfel und sagt: „Oh, D&D! Ich spiel seit 15 Jahren!“
< Er erzählt eine Geschichte | s+5 t-5 | Er erzählt von seinem Paladin, der einen Gott verprügelt hat. Er bekommt ein Stück Pizza.
> Danke, tschüss | t+2 | Er geht. // Er wirkt enttäuscht.

§ #gs_alte gast wenn:kamp>1
Ein ehemaliger Spieler aus einer früheren Runde schaut vorbei. „Na? Lebt mein alter Held noch?“
< Gastauftritt! | s+6 l+3 | Sein alter Held taucht als weiser Mentor auf. Nostalgie! | funkeln
> Nur auf ein Bier | s+3 t-3 | Ihr erzählt alte Geschichten. Die neuen Spieler hören staunend zu.
`);
