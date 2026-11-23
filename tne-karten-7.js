/* =====================================================================
   TALES NEVER END – Kartenpaket 7: Beziehungen am Tisch & Gedächtnis
   ---------------------------------------------------------------------
   Neue Kopf-Schlüssel:
     bez:typ        Karte braucht zwei Spieler mit dieser Beziehung
                    (paar, freunde, geschwister, kollegen, wg, ex, spannung,
                    schwarm, mehrere mit „/“, „*“ = egal welche).
                    {name}/{held} = der eine, {p2}/{p2held} = der andere.
   Neue Wirkungen:  bez+N bez-N  · bez=typ (Art ändern) · bezneu=typ (nur
                    wenn die beiden noch nichts verbindet) · laune2±N (der
                    andere) · beide±N · >>>id (Kette, deutlich später)
   Neue Bedingungen: bez<N bez>N · merk:pechvogel|glueckskind|trauert|
                    verbittert|paranoid|stammgast|verlust|uebermuetig|frisch
   Platzhalter:     {altheld} (zuletzt gestorbener Held dieses Spielers),
                    {altkampagne}, {tode}, {nat1}, {nat20}, {kampagnen}
   ===================================================================== */
(window.TNE_KARTEN = window.TNE_KARTEN || []).push(String.raw`

§ #bz_paar_insider spieler bez:paar
{name} und {p2} lachen über etwas, das nur die beiden verstehen. Es hat mit „dem Ding in Italien“ zu tun. Der Rest des Tisches wartet höflich.
< Kurz lachen lassen | s+2 t-3 bez+4 alle-1 | Nach einer Minute wischt sich {p2} die Tränen weg. „Sorry. Okay. Wir sind da.“ | lachen
> „Leute, wir sind im Dungeon.“ | t+3 bez-2 beide-2 | Beide richten sich auf wie ertappte Schulkinder. Der Dungeon geht weiter.

§ #bz_paar_auto spieler bez:paar
{name} und {p2} sind zusammen gekommen und haben im Auto ganz offensichtlich gestritten. Beide reden nur noch mit dir, nicht miteinander.
< Eine Szene, in der ihre Helden zusammenarbeiten müssen | W12 l+2 ? bez+10 s+4 beide+4 : bez-6 s-4 beide-4 | Irgendwo zwischen Fallgrube und Seil fangen die beiden wieder an, normal zu reden. Sogar über Echtes. :: Die Szene wird zur Fortsetzung des Streits mit Schwertern. Der Tisch starrt auf seine Würfel.
> Den Helden getrennte Aufgaben geben | t-4 l+2 bez-2 beide+3 | Zwei Handlungsstränge, ein bisschen mehr Arbeit für dich. Aber niemand muss heute Abend so tun als ob.

§ #bz_paar_schutz spieler bez:paar
{held} wirft sich zwischen den Oger und {p2held}. Taktisch war das Unsinn. {name} schaut nicht zu {p2}, aber {p2} schaut zu {name}.
< Den Moment wirken lassen | s+4 l+2 m-3 bez+8 | Der Oger trifft {held} hart. Aber auf der Heimfahrt, erzählt man sich später, wurde viel gegrinst. | herzen
> Würfeln wie immer | W12 m+3 ? s+3 : tod | {held} pariert den Hieb. Heldenhaft und unverschämt knapp. :: Der Oger trifft. {held} fällt – für {p2held}.

§ #bz_paar_beutel spieler bez:paar
{name} und {p2} teilen sich einen Würfelbeutel. Gerade wird verhandelt, wer heute die „gute“ W20 bekommt. Es geht um viel.
< Dir eine Entscheidung zuschieben lassen | s+3 laune-2 laune2+3 | Du entscheidest für {p2}. {name} spricht den Rest des Abends nur noch in Andeutungen von „Verrat am Spieltisch“. | lachen
> „Ihr dürft eure eigenen Würfel kaufen.“ | l+2 t+2 bez-1 | Am nächsten Spielabend haben beide neue Würfel. Sie sind identisch.

§ #bz_paar_jahrestag spieler bez:paar einmal
In der Pause flüstert {name} dir zu: Heute ist der Jahrestag mit {p2}. Ob du im Spiel vielleicht irgendetwas machen könntest? Nichts Großes.
< Ein Sternschnuppenregen über dem Lager der Helden | s+5 l-2 bez+10 laune+6 laune2+8 | Du beschreibst ihn ganz beiläufig. {p2} merkt nach zwei Sätzen, was gerade passiert. Der Rest des Tisches tut so, als hätte er es nicht gemerkt. | sterne
> „Ich will nicht, dass es zu viel wird.“ | l+2 laune-3 | {name} nickt. Später, beim Abwasch, sagt {name}: „War vielleicht eh besser so.“ Ganz überzeugt klingt es nicht.

§ #bz_paar_kuehl spieler bez:paar wenn:bez<40
Seit Wochen ist zwischen {name} und {p2} etwas kühl. Heute sitzen sie zum ersten Mal nicht nebeneinander, und keiner sagt etwas dazu.
< Nach der Session kurz nachfragen, ganz beiläufig | t-2 bez+6 >>bz_paar_gespraech | Du fragst nur: „Alles okay bei euch?“ {name} sagt: „Ja. Also. Mal sehen.“ Immerhin ehrlich.
> Nicht deine Baustelle | alle-2 bez-4 | Du leitest einfach. Die Stimmung bleibt den ganzen Abend ein bisschen zu höflich.

§ #bz_paar_gespraech spieler bez:paar kette
Am nächsten Tag schreibt dir {name}: „Danke fürs Fragen gestern. Wir reden gerade viel. Ich weiß nicht, ob wir das nächste Mal beide kommen.“
< „Kommt, wie es passt. Die Runde läuft nicht weg.“ | bez+6 beide+5 | Nächstes Mal kommen beide. Sie sitzen wieder nebeneinander. Nicht ganz so nah wie früher, aber nebeneinander.
> „Sagt einfach rechtzeitig Bescheid.“ | l+2 t+2 bez+2 | Sachlich, aber fair. {name} schickt einen Daumen zurück.

§ #bz_paar_date spieler bez:paar
{name} möchte, dass {held} und {p2held} im Spiel ein Date haben. Auf dem Jahrmarkt von {ort}. {p2} wird ein bisschen rot, sagt aber nicht nein.
< Ein Jahrmarkt mit Losbude und Riesenrad | s+5 t-4 bez+6 alle-1 | Der Barbar gewinnt am Stand einen Plüschgreif und schenkt ihn dem Paar. Alle anderen spielen derweil Ringwerfen. | konfetti
> Der Jahrmarkt wird überfallen | m+3 t+4 bez-1 laune-3 | Kaum stehen sie am Riesenrad, greifen Kultisten an. Romantik muss warten. {name} seufzt hörbar. | schwerter

§ #bz_fr_insider spieler bez:freunde
{name} und {p2} haben einen Insider aus einer Runde vor drei Jahren: „Der Kohlkopf.“ Er fällt heute zum siebten Mal. Die Neuen verstehen immer noch nichts.
< Den Kohlkopf endlich erklären lassen | s+4 t-4 alle+2 bez+3 | Die Geschichte dauert zehn Minuten und ist absolut nicht so lustig, wie die beiden denken. Trotzdem lachen am Ende alle. | lachen
> „Das bleibt euer Geheimnis.“ | t+2 bez+2 alle-1 | Die beiden grinsen sich an. Der Kohlkopf lebt weiter.

§ #bz_fr_trank spieler bez:freunde
{p2held} liegt bei null Trefferpunkten. {name} hat noch genau einen Heiltrank. {held} selbst hat auch nur noch vier.
< Den Trank für {p2held} | bez+8 m-3 laune2+6 | „Du schuldest mir was.“ – „Ich schulde dir seit 2019 was.“ | heilung
> Selbst trinken | m+3 bez-6 laune2-6 | Taktisch richtig. Später sagt {p2}: „Schon okay.“ Es ist nicht ganz okay.

§ #bz_fr_plan spieler bez:freunde
{name} und {p2} haben vorher per Nachricht einen Plan ausgeheckt. Das merkst du daran, dass sie sich seit zehn Minuten angrinsen.
< Den Plan aufgehen lassen | s+5 t+3 l-2 bez+5 | Der Plan ist absurd, umständlich und funktioniert. Die beiden klatschen sich über den Tisch ab. | konfetti
> Den Plan durchkreuzen | W12 l+3 ? s+4 : s-3 bez-1 beide-3 | Du durchkreuzt ihn – aber so, dass es noch besser wird. :: Der Plan scheitert an einem Detail. Die beiden schauen sich an wie zwei Kinder, denen das Eis runtergefallen ist.

§ #bz_fr_heimweg tisch bez:freunde
{name} ist die Mitfahrgelegenheit von {p2}. {p2} muss heute um 23 Uhr los – also muss {name} auch.
< Pünktlich Schluss für alle | t+5 s-2 | Ein etwas abruptes Ende mitten im Kampf. Aber ein spannender Cliffhanger.
> Die beiden gehen, der Rest spielt weiter | t-2 beide-5 alle+1 | Auf dem Heimweg schreibt {name} in den Chat: „Und? Wer ist gestorben?“ Niemand antwortet sofort.

§ #bz_gs_peinlich spieler bez:geschwister
{name} erzählt eine Geschichte über {p2} aus der Kindheit. Es geht um einen Kostümball und eine Topfpflanze. Halb lustig, halb nicht.
< Mitlachen | s+4 laune2-6 bez-4 | Der Tisch lacht. {p2} lacht mit, aber wirft {name} einen Blick zu, der nach „Weihnachten“ klingt.
> Elegant zum Spiel zurückleiten | t+2 laune2+3 bez+1 | {p2} formt mit den Lippen ein lautloses „Danke“ in deine Richtung.

§ #bz_gs_strichliste spieler bez:geschwister
{name} und {p2} führen heimlich eine Strichliste, wessen Held mehr Schaden macht. Inzwischen ist die Liste nicht mehr heimlich.
< Daraus ein Turnier machen | s+5 m+3 t+2 bez+2 alle-1 | Die Strichliste bekommt eine eigene Spalte im Abenteuerbuch. Die anderen wetten mit. | schwerter
> „Das ist kein Wettbewerb.“ | l+3 beide-4 | Beide nicken. Die Strichliste wird kleiner geschrieben.

§ #bz_gs_mama tisch bez:geschwister
Das Handy von {p2} klingelt: die Mutter der beiden. Sie will wissen, ob {name} auch an Omas Geburtstag am Sonntag denkt. {name} hatte es vergessen.
< Fünf Minuten Familienkrisensitzung | t-4 s+3 bez+3 | Am Tisch wird gemeinsam ein Geschenk für die Oma ausgesucht. Es wird ein Puzzle mit Drachenmotiv.
> Laut stellen, alle sagen Hallo | s+5 l-2 t-2 alle+2 | Die Mutter hört kurz zu und sagt: „Ach, ihr spielt wieder dieses Ritterspiel.“ Der Tisch fühlt sich gesehen. | lachen

§ #bz_ko_excel spieler bez:kollegen
{name} und {p2} fangen an, über ein Meeting von heute Nachmittag zu reden. Es geht um ein Excel-Problem. Es geht um eine Formatvorlage.
< Ins Spiel holen: der Bürgermeister hat das gleiche Problem | s+4 l-2 t-2 bez+2 | Plötzlich soll {held} die Steuerrollen von {ort} retten. Mit „SVERWEIS“-Zauber. Die beiden sind begeistert. | staub
> „Feierabend ist Feierabend.“ | t+3 beide-2 | Beide lachen. „Stimmt. Sorry.“ Fünf Minuten später geht es wieder um die Formatvorlage.

§ #bz_ko_chef spieler bez:kollegen
{held} soll einen Hauptmann bestechen. {name} zu {p2}: „Mach's wie beim Abteilungsleiter.“ Die beiden lachen sehr, sehr lange.
< „Wie macht man es denn beim Abteilungsleiter?“ | W11 s+5 ? m+3 bez+3 : s+2 | Mit Kuchen und Komplimenten. Der Hauptmann ist begeistert. :: Kuchen funktioniert bei Hauptleuten nicht. Er nimmt den Kuchen trotzdem. | lachen
> Weiterspielen | t+2 | Das Rätsel um den Abteilungsleiter bleibt ungelöst.

§ #bz_wg_pfanne spieler bez:wg
{name} und {p2} streiten leise, aber ausdauernd über den Putzplan. Es geht anscheinend um eine Pfanne. Die Pfanne steht seit Dienstag.
< Im Spiel: ein verfluchter Kessel, den niemand spülen will | s+5 l-3 bez+3 | Am Ende spült ihn {held} – unter Protest. {p2} applaudiert. Der Streit ist erstaunlich schnell vergessen. | gift
> „Das klärt ihr zuhause.“ | t+2 bez-3 | Es wird zuhause geklärt. Nicht leise, wie man hört.

§ #bz_wg_heim tisch bez:wg
Die Runde findet heute in der WG von {name} und {p2} statt. In der Küche stapelt sich Geschirr, und es ist sehr klar, wessen Woche es war.
< Gemeinsam abspülen, dann spielen | t-5 s+4 alle+3 bez+5 | Zehn Leute, eine Spüle, viele Meinungen über Spülmittel. Es wird ein guter Abend. | heilung
> Nicht hinschauen | s+2 bez-3 | Niemand schaut hin. Irgendwann steht {p2} wortlos auf und spült. Sehr laut.

§ #bz_ex_vertrauen spieler bez:ex
{name} und {p2} waren mal ein Paar. Heute muss {held} im Spiel {p2held} vertrauen und blind über einen Abgrund springen.
< Die Szene so spielen | W12 s+3 ? bez+10 s+4 : bez-8 beide-4 | Es wird gesprungen, und es wird gefangen. Danach sind beide kurz still, dann grinsen sie. :: {p2held} fängt nicht. Das war ein Würfelergebnis, sagt {p2}. Niemand glaubt es so ganz.
> Ein Seil statt Vertrauen | l+3 t-2 | Mit Seil, Haken und Sicherung. Sehr sicher, sehr unpersönlich. Vermutlich besser so.

§ #bz_ex_date spieler bez:ex
{p2} erwähnt beiläufig ein Date am Wochenende. {name} schaut auf einmal sehr konzentriert auf den Charakterbogen.
< Schnell eine Kampfszene starten | m+3 t+4 laune+3 | Nichts lenkt so gut ab wie ein Rudel Goblins. {name} ist dir sichtbar dankbar. | schwerter
> Nichts tun | laune-8 bez-4 | Das Gespräch läuft weiter. {name} lacht an den richtigen Stellen, nur etwas zu spät.

§ #bz_ex_frieden spieler bez:ex wenn:bez>55
Beim Aufräumen helfen sich {name} und {p2} ohne ein Wort. Sie reichen sich Würfel und Gläser, als hätten sie das schon tausendmal gemacht.
< (Einfach passieren lassen) | bez=freunde bez+10 beide+6 | Ein paar Wochen später sitzen sie wieder nebeneinander. Als Freunde. Es wirkt, als wäre etwas leichter geworden. | heilung
> Einen Witz darüber machen | s+3 bez-6 beide-3 | Beide lachen kurz. Der Moment ist vorbei.

§ #bz_sp_regel spieler bez:spannung
{name} korrigiert {p2} zum dritten Mal heute bei einer Regel. {p2} atmet hörbar aus und legt die Würfel sehr ordentlich hin.
< „Danke. Ich entscheide das hier.“ | l+2 laune-4 laune2+5 bez+3 | Freundlich, aber klar. Danach ist es etwas ruhiger. {p2} wirkt erleichtert.
> Nachschlagen | l+5 t-5 bez-6 laune2-6 | {name} hatte recht. Das macht es nicht besser.

§ #bz_sp_kekse spieler bez:spannung
{name} hat heute Kekse mitgebracht. „Für alle.“ Die mit Schokolade liegen allerdings direkt vor {p2}. Das ist vermutlich kein Zufall.
< Nichts sagen, Kekse essen | bez+10 s+2 | {p2} nimmt einen. Dann noch einen. „Danke.“ Mehr wird nicht gesagt. Mehr muss auch nicht. | heilung
> „Oh, darf ich auch?“ | s+3 bez+4 | Du ruinierst den Moment ein bisschen. Aber die Kekse sind wirklich gut.

§ #bz_sp_knall spieler bez:spannung wenn:bez<32
Zwischen {name} und {p2} kracht es. Vordergründig geht es um eine Regel zum Festhalten. Eigentlich geht es um etwas ganz anderes, das niemand ausspricht.
< Pause machen, mit beiden einzeln reden | t-6 bez+14 beide+3 | Fünf Minuten auf dem Balkon mit {name}, fünf in der Küche mit {p2}. Danach geht es weiter, merklich entspannter. | staub
> Die Regel entscheiden und einfach weitermachen | l+3 t+2 bez-8 laune-5 laune2-5 | Die Regel ist geklärt. Das andere nicht.

§ #bz_sp_versoehnung spieler bez:spannung wenn:bez>60
{name} und {p2} haben heute zum ersten Mal zusammen über einen Witz gelacht. Ein ehrliches Lachen. Der Rest des Tisches tut so, als wäre nichts.
< Ihre Helden in ein gemeinsames Abenteuer schicken | s+4 bez=freunde bez+6 | Ein Nebenauftrag, nur die beiden. Sie kommen mit drei Goldstücken und einem Running Gag zurück. | konfetti
> Nichts erzwingen | bez+5 | Gut so. Manche Dinge wachsen besser, wenn keiner zuschaut.

§ #bz_sw_platz spieler bez:schwarm
{name} hat sich heute wieder neben {p2} gesetzt. Zufällig. Zum vierten Mal in Folge. Der Platz neben dir war frei.
< (Du hast nichts gesehen.) | s+2 bez+3 | Du siehst nichts. Gar nichts. Den ganzen Abend nicht.
> Eine Teamaufgabe für ihre beiden Helden | s+4 t-2 bez+5 laune+4 | Ein Rätsel für zwei. {name} redet zu schnell und lacht zu viel. {p2} scheint es nicht zu stören.

§ #bz_sw_witz spieler bez:schwarm
{name} lacht über jeden Witz von {p2}. Auch über die, die gar keine waren. Gerade hat {p2} „Okay, ich würfel“ gesagt, und {name} hat gelacht.
< Weiterspielen, als wäre nichts | s+2 bez+2 | Es ist nichts. Nichts, das irgendwer kommentieren müsste.
> Ein Kommentar vom Chaoten | s+4 laune-8 bez-3 | „Haha, {name} findet ja ALLES lustig, was {p2} sagt!“ {name} wird rot bis unter die Haare. Es ist sehr still.

§ #bz_sw_wache spieler bez:schwarm
{held} und {p2held} haben im Spiel gemeinsam Nachtwache. Ein Lagerfeuer, ein Sternenhimmel, kein Monster in Sicht. {name} ist plötzlich ganz still.
< Eine ruhige, ehrliche Szene am Feuer | s+4 l+3 t-3 bez+8 >>>bz_sw_entscheidung | Die beiden Helden reden über Heimat und Angst und den ersten Kuss. Ganz in Charakter. Ganz. | feuer
> Ein Wolfsrudel greift an | m+3 t+4 laune-3 | Das Feuer, die Sterne, dann zwanzig Wölfe. Du bist ein schrecklicher Mensch, sagt der Blick von {name}. | nacht

§ #bz_sw_entscheidung tisch bez:schwarm kette
Nach der Session bleiben {name} und {p2} noch draußen vor der Haustür stehen. Ziemlich lange. Die anderen gehen absichtlich langsam an ihnen vorbei.
< (Das geht dich nichts an.) | W10 ? bez=paar beide+10 s+4 : bez=freunde beide+3 | In der Woche drauf kommen sie zusammen an. Keiner sagt etwas. Alle grinsen. :: Es bleibt bei einer sehr guten Freundschaft. Beide wirken erleichtert, dass es ausgesprochen ist. | herzen
> Im Gruppenchat einen Witz darüber machen | s+3 bez-6 beide-8 | Ein Zwinker-Emoji. {name} antwortet nur mit einem Daumen. Du hättest es lassen sollen.

§ #bz_neu_heimweg spieler wenn:spieler>2
{name} und {p2} haben heute zum ersten Mal den gleichen Heimweg. Später erfährst du: Sie haben an der Bushaltestelle noch eine halbe Stunde geredet.
< Die Helden nächstes Mal als Team einplanen | bezneu=freunde s+3 t-2 | Zwei Helden, ein Plan, ein neues Duo. Am Tisch entsteht etwas, das du nicht geschrieben hast. | konfetti
> Laufen lassen | bezneu=freunde bez-12 s+1 | Ein Anfang. Mal schauen, was daraus wird.

§ #bz_neu_unterbrechen spieler wenn:spieler>2
{name} unterbricht {p2} zum dritten Mal mitten im Satz, um zu erklären, was {held} „eigentlich viel besser“ machen würde.
< Freundlich, aber klar einschreiten | l+2 t-2 laune-3 laune2+5 | „Moment, {p2} war noch nicht fertig.“ Ein kleiner Satz. {p2} schaut dich dankbar an.
> Laufen lassen | t+3 laune2-8 bezneu=spannung | {p2} hört auf zu reden. Den Rest des Abends sagt {p2} nur noch das Nötigste.

§ #bz_neu_chips spieler wenn:spieler>2
{name} hat {p2} heute zweimal Chips angeboten. Unaufgefordert. {name} bietet sonst nie jemandem Chips an. Niemals.
< (Notiert.) | bezneu=schwarm s+2 | Du sagst nichts. Aber du merkst dir das. Hinter dem Schirm sieht man alles.
> Laut fragen, ob du auch welche kriegst | s+4 laune-4 | Du kriegst auch welche. Die Magie des Moments ist dahin.

§ #bz_neu_streit spieler wenn:spieler>2
{name} findet, dass {p2held} „den Plan sabotiert“ hat. {p2} findet, dass es gar keinen Plan gab. Beide haben ein bisschen recht.
< Eine Entscheidung treffen: der Plan zählte | l+3 laune+3 laune2-6 bezneu=spannung | {name} fühlt sich bestätigt. {p2} nicht.
> Ein Monster lenkt ab | m+3 t+3 | Ein Troll beendet die Diskussion auf natürliche Weise. | schwerter

§ #bz_paar_trennung_nah spieler bez:paar wenn:bez<25
{name} und {p2} sind heute getrennt angereist. {p2} sagt kaum etwas, sitzt am anderen Tischende und packt nach dem letzten Wurf sofort die Sachen.
< Nicht nachbohren | bez-4 laune-4 laune2-3 | Der Abend läuft. Aber zwischen zwei Stühlen ist es spürbar kalt.
> Nach der Session kurz mit {name} reden | t-3 laune+6 bez+4 | Ihr redet zwanzig Minuten über alles außer das. Am Ende sagt {name}: „Danke, dass du gefragt hast.“

§ #bz_alle_foto tisch bez:*
{name} will heute ein Foto vom ganzen Tisch machen. „Für die Chronik.“ Alle sollen ihre Würfel hochhalten.
< Selbstauslöser, alle drauf | s+5 t-3 alle+3 bez+3 | Das Foto ist schief, die Hälfte blinzelt, jemand hat Chips im Mund. Es wird das Profilbild der Gruppe. | konfetti
> „Nach der Session.“ | t+2 | Nach der Session haben es alle vergessen.

§ #me_trauer spieler wenn:merk:trauert
{name} hat den Charakterbogen von {altheld} noch dabei. Zusammengefaltet, unter dem neuen. Beim Würfeln schaut {name} kurz darauf.
< Ein Lied über {altheld} in der Taverne | s+3 l+2 laune+12 | Ein Barde singt von {altheld}. Schlecht gereimt, aber mit viel Gefühl. {name} singt den Refrain leise mit. | musik
> Nach vorne schauen | t+3 laune-4 | Das Abenteuer geht weiter. {name} faltet den alten Bogen etwas kleiner.

§ #me_paranoid spieler wenn:merk:paranoid
{name} lässt {held} jede Tür zehn Minuten lang abtasten. Nach {tode} toten Helden traut {name} in diesem Dungeon gar nichts mehr. Auch nicht dem Fußboden.
< Belohnen: Diesmal war wirklich eine Falle da | l+4 t-3 laune+8 | „ICH WUSSTE ES!“ {name} zeigt die entschärfte Druckplatte herum wie eine Trophäe. | ausruf
> „Da ist keine Falle.“ | t+4 laune-3 l-1 | Da ist keine Falle. {name} glaubt es trotzdem nicht. Zu Recht, wie die nächste Tür zeigt.

§ #me_pechvogel spieler wenn:merk:pechvogel
{name} hat in dieser Runde schon {nat1}-mal eine natürliche 1 gewürfelt. Gerade sammelt {name} alle W20 vom Tisch ein, um „den guten“ zu finden.
< Einen deiner Würfel leihen | s+3 laune+8 | Dein Glückswürfel. Der erste Wurf damit: eine 1. Der Tisch explodiert vor Lachen. {name} auch, zum Glück. | lachen
> „Es sind nicht die Würfel.“ | l+2 laune-5 | Statistisch hast du recht. Gefühlt nicht.
^ Würfel in ein Glas mit Salz legen | s+5 l-3 laune+5 | Ein uraltes Ritual, sagt der Veteran. Die Würfel liegen jetzt die ganze Session im Salz. Wirkt es? Wer weiß. | magie

§ #me_glueckskind spieler wenn:merk:glueckskind
{name} hat schon {nat20} natürliche 20en geworfen. Die anderen wollen jetzt den Würfel sehen. Und zwar genau.
< Würfeltest am Tisch: zwanzigmal werfen | s+5 t-4 l+2 | Der Würfel zeigt in zwanzig Würfen genau einmal eine 20. Völlig normal. Die Verschwörungstheorien bleiben. | wuerfelregen
> „Glück ist auch eine Fähigkeit.“ | s+2 laune+4 alle-2 | {name} grinst sehr breit. Der Rest grummelt.

§ #me_verbittert spieler wenn:merk:verbittert
{name} hat {tode} Helden verloren. Beim Erschaffen des neuen sagt {name} nur: „Ich gebe ihm keinen Namen. Lohnt sich ja eh nicht.“
< Dem namenlosen Helden etwas geben, das zählt | l+2 s+2 laune+12 | Ein NSC fragt nach seinem Namen. {name} denkt lange nach. „Hoffnung.“ Schweigen. Dann: „Nein, Horst.“ | heilung
> Galgenhumor zulassen | s+4 l-2 laune+2 | Der Held heißt „Nummer {tode}“. Es wird ein Running Gag.

§ #me_verlust_haendler spieler wenn:merk:verlust
Ein Händler in {ort} fragt, ob {held} zufällig {altheld} gekannt hat. Du hast das nicht geplant. Es ist dir einfach so rausgerutscht.
< Ausbauen: Er hat noch etwas, das {altheld} gehörte | laune+10 s+3 l-1 | Ein zerkratzter Talisman. {name} legt ihn ganz vorsichtig auf den neuen Bogen. | funkeln
> Schnell weitererzählen | t+2 laune-2 | Der Händler zuckt mit den Schultern und verkauft weiter Kohl.

§ #me_rache spieler wenn:merk:verlust
{name} will, dass {held} den Mörder von {altheld} jagt. Das ist drei Sessions her. {name} hat es nicht vergessen. Du schon.
< Eine Nebenquest daraus machen | t-4 l+3 s+3 laune+10 | Eine Spur, ein Name, ein Ziel. Plötzlich hat {held} eine Geschichte. | schwerter
> „Die Spur ist kalt.“ | t+3 laune-6 | Kalt. Vorerst. {name} schreibt den Namen trotzdem auf.

§ #me_uebermut spieler wenn:merk:uebermuetig
{name} lässt {held} ohne Rüstung in den Drachenhort laufen. „Keine Sorge. Ich verliere nie.“
< Konsequenzen | W14 m+4 ? s+6 : tod | Unglaublich. Es klappt schon wieder. Der Tisch ist fassungslos. :: Der Drache wacht auf. {name} verliert. Zum ersten Mal. | drache
> Den Drachen nur schnarchen lassen | s+4 m+3 l-4 | Der Drache schläft weiter. {name} fühlt sich unbesiegbar. Das wird noch Folgen haben.

§ #me_stammgast spieler wenn:merk:stammgast
{name} ist seit {kampagnen} Kampagnen dabei und erklärt den Neueren gerade, wie das „damals“ war. Damals ist ungefähr vor einem Jahr.
< Ein alter Bekannter aus damals taucht auf | s+4 l+2 laune+6 alle+1 | Ein NSC aus einer früheren Kampagne erkennt {held} wieder. {name} strahlt. | funkeln
> „Früher war auch nicht alles besser.“ | s+2 laune-3 | „Doch“, sagt {name}. „Die Pizza.“

§ #me_frisch spieler wenn:merk:frisch
{name} ist noch neu in der Runde und fragt leise, ob die anderen sich schon lange kennen. Es klingt ein bisschen, als ginge es eigentlich um etwas anderes.
< Eine Szene, in der {held} im Mittelpunkt steht | t-2 s+3 laune+10 | {held} rettet ein Dorf. Allein. Die anderen spielen Bauern, die jubeln. Ab heute gehört {name} dazu. | konfetti
> Die anderen erklären lassen | s+3 alle+2 laune+4 | Drei Leute erzählen gleichzeitig alte Geschichten. {name} versteht kein Wort, lacht aber mit.

§ #me_alter_bogen spieler wenn:merk:verlust,kamp>1
Beim Aufräumen findet {name} den Bogen von {altheld} aus „{altkampagne}“. Stufe {stufe}, Kaffeefleck, eine Telefonnummer, die keiner mehr kennt.
< Vorlesen | s+4 t-4 alle+2 laune+5 | Die Notizen sind wirr, die Zeichnungen grausam, die Erinnerungen großartig. | staub
> Einrahmen | l+2 laune+8 | Der Bogen hängt jetzt in der Küche. Ein Heldenschrein für Arme.

§ #pz_held pausiert
{name} fragt im Gruppenchat, was eigentlich {held} gerade macht. Der Held ist ja noch irgendwie in der Gruppe.
< {held} reist als stiller Begleiter mit | l-2 s+3 laune+6 | {held} trägt jetzt das Gepäck und nickt weise. {name} schickt drei lachende Smileys.
> {held} wartet in der Taverne | l+3 t+2 laune-2 | {held} hat in der Taverne inzwischen eine Stammkneipenkarriere. „Gut“, schreibt {name}. „Hat sich's verdient.“

§ #pz_sprachnachricht pausiert
{name} schickt eine vierminütige Sprachnachricht in den Gruppenchat. Es ist mitten in der Session. Wollt ihr sie abspielen?
< Abspielen, alle hören zu | s+4 t-4 laune+6 alle+1 | Die Nachricht ist chaotisch, warm und endet mit: „Und grüßt {held} von mir.“ Gerührtes Schweigen. | musik
> Nach der Session anhören | t+2 laune-3 | Nach der Session hört sie keiner. Aber am nächsten Tag schon.

§ #pz_zusammenfassung pausiert
{name} bittet um eine Zusammenfassung der letzten Session, „damit ich nicht völlig raus bin“.
< Du schreibst eine liebevolle Zusammenfassung | l+3 laune+8 xp+3 | Mit Zeichnungen und Zitaten. {name} antwortet: „Ich hab beim Lesen gelacht. Laut. Im Zug.“ | staub
> Jemand anderes macht drei Stichpunkte | s+3 laune-1 | „Ork tot. Taverne brannte. Wieder Ork.“ Präzise.

§ #pz_daumen pausiert
{name} schreibt: „Würfelt heute bitte eine für mich. Egal wofür.“
< Eine 20! | s+5 laune+8 | Es wird eine 20 gewürfelt, und alle schicken das Foto in den Chat. {name} antwortet mit einem einzigen „!!!“. | wuerfelregen
> Eine 1. | s+3 laune+3 | Eine 1. Natürlich. {name} schreibt: „Typisch.“ Aber es klingt zufrieden.

`);
