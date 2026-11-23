/* =====================================================================
   TALES NEVER END – Kartenpaket 6: mehr für Musiker, Zeichnerin,
   Taktikerin, Handy-Gucker, Veteran, Katze, Besuch – und für lange Runden
   ===================================================================== */
(window.TNE_KARTEN = window.TNE_KARTEN || []).push(String.raw`

§ #mu2_hintergrund musik
{name} will, dass jede Szene ihre eigene Hintergrundmusik bekommt. {Er} hat eine Liste mit 200 Liedern.
< Musik-Regie abgeben | s+6 l+2 t-4 laune+12 | {name} wird DJ der Runde. Der Bosskampf läuft zu Trommeln, die Taverne zu Dudelsack. | musik
> Stille ist auch Musik | l+3 laune-8 | {name} summt trotzdem leise. Die Stille ist nicht still.

§ #mu2_spottlied musik
{name} improvisiert ein Spottlied über {schurkeN}. Es reimt sich auf erschreckend viele Wörter.
< Würfel auf Darbietung | W12 s+8 ? m+4 : s-3 | Der Schurke hört davon und ist zutiefst gekränkt. Moralischer Sieg! :: Niemand lacht. Nicht mal die Gruppe. | musik
> Später vorsingen | t+3 laune-5 | Das Lied wird im Gruppenchat geteilt. Mit 3 Strophen mehr.

§ #mu2_instrument musik
{held} findet eine alte Laute im Dungeon. Sie spielt von selbst.
< Verflucht! | s+6 l+2 m-3 | Die Laute spielt nur Trauermärsche. Immer. Auch beim Kampf. | musik
> Magisch! | m+6 s+4 l-3 | Wer sie spielt, macht Gegner schläfrig. {name} ist im Himmel. | zzz

§ #mu2_tanz musik
{name} will, dass {held} den Schurken zu einem Tanzduell herausfordert.
< Tanzduell! | W13 s+10 l-5 ? frieden : s-4 | {schurkeN} kann nicht tanzen und gibt beschämt auf. :: {schurkeN} tanzt wie ein Gott. Demütigend. | musik
> „Bitte nicht“ | l+4 laune-6 | {name} tanzt trotzdem. Am echten Tisch. Allein.

§ #mu2_hymne musik wenn:kamp>1
{name} hat eine Hymne für die Welt-Chronik komponiert. Mit Namen aller gefallenen Helden.
< Feierlich singen | s+6 l+4 t-4 alle+6 | Der Tisch singt die Namen. Auch {tot}. Gänsehaut. | musik
> Zu lang | t+3 laune-6 | Die Hymne hat 47 Strophen. Ihr singt drei.

§ #ku2_portrait kunst
{name} hat Porträts aller Helden gezeichnet. {aheld} sieht darauf deutlich heldenhafter aus als beschrieben.
< Kanonisch! | s+6 m+3 laune+10 | {aheld} hat jetzt offiziell ein markantes Kinn und wehendes Haar. | funkeln
> Realistisch bleiben | l+3 laune-6 | {name} zeichnet {aheld} nach: mit Doppelkinn und Kohlfleck.

§ #ku2_karte kunst
{name} zeichnet während der Session eine Karte des Dungeons mit – präziser als deine eigene.
< {Seine} Karte gilt | l+4 s+4 laune+10 | Die Gruppe navigiert nach {seiner} Karte. Und findet einen Raum, den du nie geplant hast. | staub
> Deine Karte gilt | l+2 laune-6 | „Da ist aber keine Tür.“ – „Doch.“ – „Auf meiner nicht.“

§ #ku2_comic kunst
{name} hat die letzte Session als Comic gezeichnet. Mit Sprechblasen.
< Am Anfang zeigen | s+8 t-4 alle+5 | Alle lachen über den Comic. Das Huhn hat eine Sprechblase. | lachen
> Nach der Session | t+3 | Der Comic wird zum Abschluss herumgereicht. Ein Highlight.

§ #ku2_monster kunst
{name} hat ein eigenes Monster gezeichnet und fragt, ob es vorkommen darf. Es hat sechs Beine und Brille.
< Es kommt vor! | s+6 m-3 laune+12 | Der „Brillenkrabbler“ greift an. {name} ist begeistert und ein bisschen ängstlich. | ausruf
> Nicht in dieser Welt | l+4 laune-8 | Der Brillenkrabbler bleibt auf Papier. Er schaut traurig durch seine Brille.

§ #ku2_still kunst wenn:laune<30
{name} zeichnet nicht mehr. {Er} sitzt nur da und schaut auf die Würfel.
< In der Pause fragen | alle+3 laune+20 t-3 | „Alles okay?“ – „Ja… es war nur grade so laut.“ Danke fürs Fragen. | herzen
> Ruhige Szene | t-6 s+3 laune+12 | Eine stille Szene am See. {name} greift wieder zum Stift. | wellen

§ #tk2_formation taktik
{name} besteht darauf, dass die Gruppe in Formation marschiert: Tank vorne, Heiler Mitte, Schurke hinten.
< Formation lohnt sich | m+5 l+4 t-3 laune+8 | Der Hinterhalt prallt an der Formation ab. {name} nickt zufrieden. | schwerter
> Chaos-Angriff von hinten | s+5 m-3 laune-6 | Natürlich greifen die Goblins von hinten an. Wo der Heiler steht. | treffer

§ #tk2_ressourcen taktik
{name} zählt die Heiltränke der Gruppe. „Wir haben zu wenige für den Boss. Wir müssen zurück.“
< Zurück zur Stadt | t-6 l+5 m+3 | Ein Umweg, aber gut ausgerüstet. | gold
> „Wird schon“ | W12 t+4 ? s+5 : tod2 | Es reicht knapp! :: Es reichte nicht. | schaedel

§ #tk2_gelaende taktik
{name} will den Kampf auf einen Hügel verlagern. „Höhenvorteil!“
< Höhenvorteil gewährt | m+6 l+3 laune+10 | Pfeile regnen von oben. Die Gegner keuchen den Hügel hinauf. | pfeile
> Der Hügel ist ein Ameisenhaufen | s+8 l-3 m-3 | Höhenvorteil. Ameisenvorteil. Die Ameisen gewinnen. | insekten

§ #tk2_spionage taktik
{name} schlägt vor, erst das Lager von {schurkeN} auszukundschaften.
< Spionagemission | l+5 t-4 W12 ? m+5 : tod | Wertvolle Infos: Wachwechsel, Schwachstellen, Lieblingskuchen des Schurken. :: Der Spion wird entdeckt. | nacht
> Keine Zeit | t+5 laune-6 | Blindflug. {name} schreibt „ICH HAB'S GESAGT“ auf einen Zettel und hält ihn hoch.

§ #hd2_foto handy
{name} macht ständig Fotos vom Spieltisch für Social Media.
< Gruppenfoto! | s+6 t-3 | Alle posieren mit ihren Würfeln. Das Foto bekommt 3 Likes. Einer davon von Oma. | konfetti
> Bitte weglegen | l+3 laune-8 | Das Handy verschwindet. Für fünf Minuten.

§ #hd2_nachricht handy
{name} bekommt eine Nachricht und muss „ganz kurz“ antworten. Mitten im eigenen Zug.
< Zug überspringen | t+5 laune-5 | Die Initiative geht weiter. {held} steht einfach da.
> Warten | t-6 s-3 | Alle warten. Die Nachricht wird lang. Sehr lang.

§ #hd2_app handy
{name} hat eine App gefunden, die alle Regeln erklärt. Und sie widerspricht dir.
< Der App glauben | l+6 s-2 laune+8 | Die App hat recht. Leider. | staub
> „Ich bin die App“ | l-3 s+3 laune-6 | {name} schaut zwischen dir und dem Handy hin und her.

§ #hd2_akku handy wenn:t<40
Der Akku von {name} ist leer. Plötzlich ist {er} voll dabei.
< Spotlight geben | s+6 t+4 laune+15 | {held} rettet den Tag. Ohne Handy! Ein Wunder! | sonne
> Ladekabel anbieten | t-3 laune+5 | Das Handy lädt. {name} schaut ihm sehnsüchtig zu.

§ #vt2_geschichte veteran
{name} erzählt, diese Kampagne schon einmal gespielt zu haben. 1996. Und {er} weiß, wer der Verräter ist.
< Plot ändern | l-3 s+6 | Der Verräter ist jetzt jemand anderes. {name} ist verblüfft. Zum ersten Mal seit 1996. | ausruf
> Schweigegelübde | l+4 laune-4 | {name} legt die Hand aufs Herz. Grinst aber vielsagend.

§ #vt2_rat veteran wenn:typ:neu
{name} flüstert dir in der Pause zu: „Gib dem Neuling mal einen großen Moment.“
< Guter Rat | s+6 alle+5 | Der Neuling am Tisch darf den Drachen ablenken und wird zur Heldenfigur des Abends. | konfetti
> „Ich mach das schon“ | laune-5 l+2 | {name} hebt eine Augenbraue. „Wie du meinst.“

§ #vt2_tpk veteran
{name} erzählt von {seinem} ersten TPK. „Alle tot. Wegen einer Tür. Es war wunderschön.“
< Sentimental | s+5 t-4 | Alle hören zu. Am Ende applaudiert der Tisch der Tür. | lachen
> Grusel | l+3 s+3 | Die Spieler öffnen ab jetzt jede Tür mit einer 3-Meter-Stange.

§ #vt2_bleistift veteran
{name} radiert {seinen} Charakterbogen seit 1998 immer wieder neu. Das Papier ist dünn wie Pergament.
< Neuer Bogen | l+3 laune-6 | Der alte Bogen wird feierlich begraben. {name} weint ein bisschen.
> Ehrfurcht | s+5 laune+8 | Der Bogen ist ein Artefakt. Er bekommt eine Schutzhülle. | krone

§ #ka2_schnurren katze
Die Tischkatze schnurrt so laut, dass alle leiser reden müssen.
< ASMR-Szene | s+4 t-4 l+2 | Eine ruhige Szene im Schnurr-Rhythmus. Alle entspannen.
> Katze ausquartieren | t+2 s-2 | Die Katze maunzt vor der Tür. Die ganze Session lang.

§ #ka2_rache katze
Die Tischkatze hat sich auf die Miniaturen gelegt. Der Drache ist umgefallen.
< Die Katze ist ein Monster | s+8 l-3 katze | Ein riesiger Katzendämon greift an! Die Spieler zittern vor Lachen. | lachen
> Neu aufstellen | t-3 | Niemand weiß mehr, wo die Helden standen.

§ #ka2_wuerfel katze
Die Katze spielt Fußball mit dem W20 von {name}. Er rollt unter das Sofa.
< Sofa-Wurf zählt | s+6 l-3 katze | „Es ist eine 20! Ich weiß es!“ – Niemand kann es prüfen. | wuerfelregen
> Neuer Würfel | l+2 laune-4 | Der Ersatzwürfel ist pink und hat Glitzer.

§ #gs2_nachbar gast
Der Nachbar klingelt und beschwert sich über den Lärm. Dann sieht er die Miniaturen. „Ist das ein Beholder?“
< Einladen | s+5 alle+2 t-3 | Der Nachbar war in den 90ern Spielleiter und bleibt eine Stunde. Ab jetzt grüßt er im Treppenhaus mit „Initiative!“. | konfetti
> Entschuldigen | l+3 t+2 | Ihr spielt leiser. Der Barbar flüstert seine Schlachtrufe.

§ #gs2_ex gast
{name}s Ex schaut vorbei, um ein Buch abzuholen. Die Stimmung wird… seltsam.
< Charakter-Moment | s-4 l+4 laune-8 | {held} hat plötzlich sehr viel Wut auf einen NSC, der verdächtig ähnlich aussieht.
> Pause | t-4 alle+2 | Zehn Minuten Pause, dann ist alles wieder normal. Fast.

§ #gs2_kinder gast
Die Kinder des Gastgebers wollen auch mitspielen. Sofort.
< Kinder-Abenteuer | s+8 l-6 t-3 | Heute kämpfen die Helden gegen das Kitzelmonster. Alle haben Spaß. | konfetti
> Bettzeit | l+2 s-2 | Mit dem Versprechen eines eigenen Abenteuers am Wochenende gehen sie ins Bett.

§ #lg_jahr sl wenn:kamp>2
Die Welt-Chronik ist inzwischen dick wie ein Regelbuch. Die Spieler fragen nach der Geschichte ihrer Welt.
< Geschichtsstunde | l+6 s+4 t-6 | Du erzählst von alten Helden, Schurken und gefallenen Städten. Andächtige Stille. | staub
> Lieber Neues | t+4 s+2 | „Die Vergangenheit ruht. Heute schreiben wir Geschichte.“

§ #lg_altheld spieler wenn:legende,kamp>1
{name} findet in einer Ruine das Schwert von {legende}.
< Es zu tragen | m+8 s+5 l-2 | Das Schwert summt. Es erkennt einen würdigen Erben. | krone
> Es zu ehren | l+5 s+3 | Das Schwert kommt in einen Schrein. Pilger kommen. | glocke

§ #lg_alterschurke schurke wenn:kamp>2
{schurke} spricht: „Ich habe schon eure Vorgänger besiegt. {tot} hat genau so geschaut wie ihr.“
< Für {tot}! | m+5 s+6 t+4 | Der Tisch ist entflammt. Rache für die Gefallenen! | feuer
> Kalt lassen | l+4 s-2 | „Leere Worte.“ Der Schurke ist verunsichert.

§ #lg_runde sl wenn:karten>200
Diese Runde spielt seit Ewigkeiten. Die Spieler haben Insider-Witze, die Neue nicht verstehen.
< Zusammenhalt feiern | s+8 alle+6 t-4 | Ein Abend voller „Weißt du noch?“. | konfetti
> Neuen einbinden | l+3 s+3 alle+2 | Ihr erklärt den Neuen die Legende vom Huhn. Sie verstehen. Ein bisschen.

§ #lg_gefallene geist wenn:gefallen,kamp>1
In einer nebligen Nacht sitzen die Geister aller gefallenen Helden am Lagerfeuer. {tot} winkt.
< Mit ihnen reden | s+6 l+3 geist | Die Geister erzählen ihre Geschichten. Und geben einen Tipp für den Endkampf. | geister
> Weiterziehen | l+2 t+3 | Die Geister schauen der Gruppe nach. Stolz, irgendwie.

§ #lg_jubilaeum tisch wenn:karten>300 einmal
Ein Spieler hat einen Kuchen gebacken: „300 Momente zusammen am Tisch!“
< Feiern! | s+10 alle+10 t-6 | Die Kerzen sind Würfel. Alle singen. Tales never End. | konfetti
> Bescheiden | s+4 alle+4 | „Ach, das ist doch nichts.“ Es ist alles.

§ #zz_hut spieler
{held} findet einen Hut. Einen sehr großen Hut. Mit Federn.
< Magischer Hut | m+5 s+5 l-3 | Der Hut flüstert Ratschläge. Die meisten sind schlecht. | funkeln
> Nur ein Hut | s+4 | Ein sehr schöner Hut. {held} trägt ihn bis ans Lebensende.

§ #zz_waschtag sl
Die Helden waschen ihre Kleidung im Fluss. Seit drei Wochen zum ersten Mal.
< Ausspielen | s+6 l+4 t-4 | Ein Bär klaut eine Unterhose. Eine Verfolgungsjagd beginnt. | wellen
> Überspringen | t+4 | „Ihr seid sauber.“ Die Gruppe riecht trotzdem nach Ork.

§ #zz_brief npc
Ein Bote bringt einen Brief für {held}. Er ist an jemand anderen adressiert.
< Trotzdem lesen | s+5 l+2 t+3 | Er enthält einen Liebesbrief – an {schurkeN}! Ein Geheimnis! | herzen
> Zurückgeben | l+4 s-2 | Ehrlich. Langweilig. Ehrlich.

§ #zz_zwerg npc
Ein betrunkener Zwerg behauptet, {held} schulde ihm 30 Gold. Er hat sogar eine Quittung.
< Zahlen | m-3 l+5 | Die Quittung ist echt. {held} erinnert sich vage an eine Nacht in {ort}. | gold
> Wettsaufen um die Schuld | W12 s+8 ? m+2 : s-3 | Der Zwerg schläft unter dem Tisch. Schuld beglichen! :: {held} schläft unter dem Tisch. Schuld verdoppelt. | lachen

§ #zz_eule welt
Eine Eule landet auf der Schulter von {held} und weigert sich zu gehen.
< Neuer Begleiter | s+6 l-2 | Die Eule heißt Professor Uhu und hat Meinungen. | federn
> Verscheuchen | l+2 s-2 | Die Eule folgt der Gruppe trotzdem. Mit vorwurfsvollem Blick.

§ #zz_quelle welt
Eine magische Quelle verspricht: „Wer trinkt, wird verwandelt.“
< Trinken! | W10 s+8 l-4 ? m+5 : m-5 | {held} wird größer, stärker, glänzender! :: {held} hat jetzt Hasenohren. Für immer. | magie
> Nur schauen | l+3 | Im Wasser spiegelt sich {held} als Greis. Eine Warnung? | wellen
`);
