/* =====================================================================
   TALES NEVER END – Kartenpaket 9: Schwere Entscheidungen
   ---------------------------------------------------------------------
   Dilemmas, bei denen jede Wahl jemanden am Tisch trifft – im Spiel oder
   im echten Leben. Und Karten, mit denen Spieler auf deine früheren
   Entscheidungen zurückkommen.
   Neu im Kopf:   schwer (immer abwägen) · eile:N (N Sekunden Bedenkzeit)
   Neue Zeile:    ~ Label | Wirkung | Folgetext   = was passiert, wenn du
                  zu lange zögerst (nur zusammen mit eile:N)
   Neue Wirkung:  vertrauen±N (wie sehr dieser Spieler dir vertraut)
   Neue Merkmale: merk:groll · merk:heldgeopfert · merk:dank ·
                  merk:misstrauisch · merk:vertraut
   Platzhalter:   {damals} (die Wahl, die dir übel genommen wird),
                  {damalsheld}, {dankfuer}
   ===================================================================== */
(window.TNE_KARTEN = window.TNE_KARTEN || []).push(String.raw`

§ #dl_bruecke sl schwer eile:14 wenn:spieler>2
Die Brücke reißt. {held} hängt am einen Seil, {p2held} am anderen. Nur eins lässt sich hochziehen, bevor das zweite reißt.
< {held} hochziehen | tod2 laune+4 laune2-12 | {held} wird über die Kante gezogen. Das andere Seil reißt. {p2} legt den Würfel sehr langsam auf den Tisch. | traenen
> {p2held} hochziehen | tod laune2+4 laune-12 | {p2held} kommt hoch, keuchend. Von unten kommt kein Laut mehr. {name} schaut lange auf den Charakterbogen. | traenen
~ Zögern | tod tod2 s-6 | Während du überlegst, reißen beide Seile. Niemand am Tisch sagt etwas. Das ist schlimmer als jeder Protest. | schaedel

§ #dl_gegengift npc schwer
Ein Gegengift, zwei Vergiftete: {held} und die Schwester von {npcN}. Niemand sagt etwas.
< Für {held} | l+4 m+2 laune+4 alle-6 | {held} lebt. Die Schwester nicht. Die Gruppe verlässt das Dorf noch in derselben Nacht. Am Tisch wird lange über Notwendigkeit geredet. | traenen
> Für die Schwester | tod s+3 l+3 alle+4 | Die Schwester schlägt die Augen auf. {held} lächelt noch einmal, dann nicht mehr. Ein Ende, über das man noch Jahre redet. | heilung

§ #dl_wuerfel_drehen wuerfel schwer eile:10
Hinter dem Schirm: eine 20. Der Oger trifft kritisch, {held} wäre tot – {name}s Herzensheld. Niemand hat den Wurf gesehen.
< Ehrlich bleiben | tod l+6 laune-12 vertrauen+6 | „Er trifft. Kritisch.“ Du sagst es ruhig. {name} nickt nach einer Weile. „Fair.“ Es tut trotzdem weh. | schaedel
> Den Würfel „falsch gelesen“ | l-6 s+2 laune+3 +w_geschummelt | „Er … verfehlt knapp.“ Erleichtertes Ausatmen. Nur du weißt es. Vorerst.
~ Zu lange gezögert | l-3 laune-6 vertrauen-6 | „Warum dauert das so lange?“ Du sagst „Er verfehlt“ – aber alle haben dein Gesicht gesehen.

§ #dl_schummel_auf spieler wenn:w_geschummelt
In der Pause sagt {name} leise zu dir: „Ich hab gesehen, was du mit dem Würfel gemacht hast. Damals beim Oger.“
< „Ja. Ich wollte nicht, dass es so endet.“ | l+2 laune+4 vertrauen+6 -w_geschummelt | {name} denkt nach. „Okay. Aber sag's mir nächstes Mal vorher.“ Ein Pakt hinter dem Schirm.
> Abstreiten | laune-8 vertrauen-14 -w_geschummelt | „Klar.“ {name} sagt nichts mehr. Bei den nächsten Würfen schaut {name} sehr genau hin.

§ #dl_tpk sl schwer eile:12 wenn:m<40
Die Gruppe läuft in den Tod: zu viele Kultisten, keine Heilung. Du könntest ein Wunder schicken – aber alle würden es merken.
< Ein Wunder | l-8 s+2 m+4 alle-2 | Ein Erdbeben, genau im richtigen Moment. Die Gruppe entkommt. Irgendwer murmelt „Deus ex Machina“. Es klingt nicht dankbar.
> Die Würfel entscheiden lassen | W12 l+6 ? m+8 s+6 alle+6 : tpk | Gegen jede Wahrscheinlichkeit: Sie schaffen es. Dieser Abend wird Legende. :: Es gibt kein Wunder. Nur Stille und vier leere Charakterbögen. | schaedel
~ Zögern | tod2 l+3 s-3 | Während du nachdenkst, entscheiden die Kultisten. Einer fällt. Der Rest kommt mit dem Leben davon. | schaedel

§ #dl_spotlight tisch schwer
{name} hat sich wochenlang auf diese Szene vorbereitet, mit einem Brief in Charakter. Es ist 23:40. {p2} muss um sechs raus und gähnt.
< Die Szene in voller Länge spielen | laune+12 laune2-10 t-6 s+2 | Der Brief wird vorgelesen. Er ist wunderschön. // {p2} schläft kurz vor dem Ende im Sitzen ein. | kerze
> Auf nächste Woche verschieben | laune-12 laune2+6 t+5 | „Klar, kein Problem.“ {name} faltet den Brief zusammen. Er wird nächste Woche nicht mehr ganz so wichtig sein.

§ #dl_regelfehler spieler schwer
{name} hat eine Regel falsch angewendet, wohl ohne Absicht. Dadurch gewinnt {held} den Kampf, nicht {p2held}. Nur du hast es gemerkt.
< Offen korrigieren | l+6 laune-10 laune2+6 | Der Kampf wird zurückgedreht. {name} wird rot. „Sorry, echt nicht absichtlich.“ Es stimmt, aber es bleibt ein Kratzer.
> Lassen – es war ein ehrlicher Fehler | l-4 laune+2 laune2-8 | Niemand erfährt es. Außer {p2}, zwei Sessions später, beim Nachlesen. Dann wird es unangenehm.

§ #dl_toeten spieler schwer
{name} will die gefangene Kultistin hinrichten lassen. Sie hat ein ganzes Dorf ermordet. {p2}: „Wir sind doch nicht die Bösen.“ Deine Welt.
< Die Welt lässt es zu | l+4 m+3 laune+6 laune2-10 | Es passiert. Die Szene ist kurz und kalt. Am Tisch redet danach niemand für eine Minute. | schaedel
> Die Wache greift ein | l+3 laune-8 laune2+6 | Die Stadtwache übernimmt. Ein Gericht, ein Urteil – nach dem Gesetz von {ort}. {name} murmelt: „Bürokratie.“
^ Die Kultistin bittet um ein letztes Wort | s+3 l+2 t-4 beide+2 | Was sie sagt, verändert alles: Der Befehl kam von jemandem, den die Gruppe kennt. Der Streit am Tisch ist plötzlich egal.

§ #dl_artefakt welt schwer
Ein Artefakt würde die Gruppe unbesiegbar machen. Der Preis: {held} verliert jede Erinnerung an alles, was bisher geschah.
< Den Preis zahlen | m+12 lvl laune-12 l+2 | {held} schaut die Gruppe an wie Fremde. {name} spielt das grandios – und sehr leise. | magie
> Ablehnen | l+4 m-5 laune+4 | Die Gruppe geht. Schwächer, aber vollständig. Vielleicht war es das wert.

§ #dl_dorf welt schwer eile:14
Ein Dorf brennt. Im selben Moment ist {schurkeN} zum ersten Mal in Reichweite – auf der Flucht, verwundet, nur einen Pfeilschuss entfernt.
< Das Dorf retten | l+5 s+2 m-3 alle+3 | Zwanzig Familien überleben. {schurkeN} entkommt und lacht von der Hügelkuppe herunter. | feuer
> Die Verfolgung | W13 m+5 ? m+6 plot+1 boss-20 : l-4 alle-5 | {schurkeN} wird gestellt und schwer verwundet. Hinter der Gruppe brennt ein Dorf nieder. :: {schurkeN} entkommt trotzdem. Und das Dorf ist Asche. | pfeile
~ Zögern | l+2 alle-6 s-4 | Als die Gruppe sich endlich bewegt, ist {schurkeN} weg und das Dorf zur Hälfte niedergebrannt. | feuer

§ #dl_heilung sl schwer eile:12 wenn:spieler>2
Ein Heilzauber ist übrig. {held} liegt bei null Trefferpunkten, {p2held} ebenfalls. Die nächste Runde beginnt gleich.
< {held} heilen | laune+6 laune2-6 W10 ? : tod2 | {p2held} schafft den Todesrettungswurf aus eigener Kraft. Glück gehabt. :: {p2held} schafft den Rettungswurf nicht. | heilung
> {p2held} heilen | laune2+6 laune-6 W10 ? : tod | {held} kommt aus eigener Kraft zurück. Knapp. :: {held} kommt nicht zurück. | heilung
~ Zögern | W14 ? s+2 : tod tod2 | Ein Wunder: Beide stabilisieren sich von allein. :: Während du überlegst, verbluten beide. | schaedel

§ #dl_verraeter spieler schwer eile:15
Der Verräter ist enttarnt: {p2held}. {p2} hat das wochenlang geheim gespielt, mit dir abgesprochen. Alle ziehen die Waffen.
< Ein Kampf auf Leben und Tod | W12 s+8 m+4 ? tod2 laune2+4 : tod laune2+8 | {p2held} fällt – und {p2} grinst trotzdem breit. „Bester Abend meines Lebens.“ :: {p2held} entkommt und lässt {held} am Boden zurück. Der Plot hat gerade die Seiten gewechselt. | schwerter
> Ein Angebot: Exil statt Tod | l+4 s+4 laune2+6 bez-4 | {p2held} reitet in die Nacht. Ein Rivale fürs Leben. {p2} würfelt einen neuen Helden und eine neue Intrige.
~ Zögern | s-3 laune2-8 | Du zögerst so lange, dass die Szene verpufft. {p2} sagt: „Ich dachte, das wird der große Moment.“

§ #dl_leutnant sl schwer
Ein Leutnant von {schurkeN} liegt besiegt am Boden. Ein junger Mann stellt sich vor ihn: „Nicht! Das ist mein Vater!“
< Gnade | l+3 s+3 laune-4 +w_leutnant | Die Gruppe lässt beide gehen. Ob das ein Fehler war, wird sich zeigen. | herzen
> Der Leutnant weiß zu viel | m+4 l+4 laune+3 alle-5 | Es ist schnell vorbei. Der junge Mann rennt weg. Am Tisch fühlt sich niemand wie ein Held.

§ #dl_leutnant2 npc wenn:w_leutnant
Ein junger Mann in feindlichen Farben hält die Gruppe auf. „Ihr habt meinen Vater verschont.“ Er zeigt auf eine Geheimtür.
< Annehmen | m+4 l+3 s+4 -w_leutnant | Der Weg durch die Geheimtür spart einen ganzen Kampf. Gnade zahlt sich manchmal aus. | funkeln
> Misstrauen | l+3 t-3 -w_leutnant | Die Gruppe nimmt den langen Weg. Hinter der Geheimtür wartete wirklich nur Hilfe.

§ #dl_eid spieler schwer
{held} hat geschworen, {npcN} zu beschützen. Jetzt fordert {schurkeN} die Auslieferung – sonst brennt die Stadt.
< Den Eid halten | W13 m+3 l+4 ? s+6 laune+10 : tod | {held} steht allein vor dem Tor. Und hält stand. :: {held} hält den Eid. Bis zum Ende. | schwerter
> {npcN} ausliefern | m+3 laune-12 alle-4 | Die Stadt ist gerettet. {name} streicht den Schwur aus der Hintergrundgeschichte. Mit Kugelschreiber. Sehr fest.

§ #dl_verspaetung tisch schwer
{name} kommt zum dritten Mal eine Stunde zu spät. Alle haben gewartet. {p2} zu dir: „Sagst du was, oder soll ich?“
< Vor allen ansprechen | l+3 t+3 laune-12 laune2+6 alle+2 | Ein klarer Satz. {name} wird still und entschuldigt sich. Den Rest des Abends ist {name} sehr pünktlich mit allem. Fast zu pünktlich.
> Unter vier Augen, nach der Session | t-3 laune-4 laune2-6 vertrauen+6 | Ein ehrliches Gespräch: Schichtdienst, neuer Chef, alles zu viel. Die anderen erfahren davon nichts – und warten weiter.
^ Ab jetzt eine halbe Stunde später anfangen | t-4 laune+8 laune2-4 alle-2 | Gerecht für {name}, ungerecht für alle anderen, die pünktlich sind. Nach zwei Wochen wieder Thema.

§ #dl_abstimmung tisch schwer
Wird nächste Woche gespielt, obwohl {name} Prüfungen hat? Die Abstimmung steht unentschieden. Deine Stimme entscheidet.
< Spielen – ohne {name} | t+5 s+2 laune-10 alle+3 | Es wird gespielt. Hinterher liest {name} im Chat, was alles passiert ist. „Ihr hättet auch warten können.“
> Eine Woche Pause | t-6 s-3 laune+10 alle-3 | {name} schickt ein Herz. Zwei andere schicken nichts.

§ #dl_wahrheit spieler schwer
{name} fragt dich nach der Session ganz ehrlich: „War {held} eigentlich wichtig für die Geschichte?“ Die ehrliche Antwort ist: bisher kaum.
< Ehrlich sein – und es ändern | laune-6 l+3 vertrauen+12 >>dl_wahrheit2 | „Kaum. Aber das ändert sich.“ {name} ist kurz getroffen, dann nickt {er}. „Danke, dass du ehrlich bist.“
> „Natürlich!“ | laune+6 vertrauen-4 | {name} strahlt. // Und wartet ab jetzt auf den großen Moment, den du gerade versprochen hast.

§ #dl_wahrheit2 sl kette
Du hast {name} einen großen Moment versprochen. Heute könnte {held} ihn bekommen – auf Kosten der Szene von {p2held}.
< {held} bekommt den Moment | laune+14 laune2-8 s+3 vertrauen+8 | Es ist {name}s Abend. {p2} gönnt es, so halb.
> Beide teilen sich die Szene | t-4 l-2 laune+6 laune2+2 | Zwei halbe Momente. Nett, aber keiner davon wird erzählt werden.

§ #dl_ruhestand spieler schwer
{name} will {held} in den Ruhestand schicken – mitten im Plot, der an {h_ihm} hängt. „Ich hab eine neue Charakteridee.“
< Den Wunsch respektieren | held s+3 l-4 laune+12 | {held} zieht sich in eine Hütte am See zurück. Der Plot hängt ab jetzt am seidenen Faden – und an einem sehr motivierten neuen Helden. | blaetter
> Um eine letzte Session bitten | l+4 laune-6 t-2 | {name} willigt ein. Es wird ein würdiger Abschied, aber man merkt, dass {name} innerlich schon weiter ist.

§ #dl_goblinkind npc schwer
Ein alter Goblin hat Essen gestohlen. Die Wache will ihn hängen. {name}: „Ist doch nur ein Goblin.“ {p2} ist entsetzt.
< Für den Goblin einstehen | l+3 s+2 laune-6 laune2+8 m-2 | Die Gruppe zahlt die Strafe. Der alte Goblin folgt ihnen danach in sicherem Abstand. Er heißt, sagt er, Pips.
> Nicht eingreifen | m+3 laune+3 laune2-12 bezneu=spannung | Die Szene endet abrupt. {p2} geht kurz auf den Balkon. Es ist nur ein Spiel. Trotzdem.

§ #dl_freund_im_weg spieler schwer bez:freunde/paar/geschwister
{p2held} hat die Gruppe leichtsinnig in eine Falle geführt. {name} verteidigt {p2}. Wie hart sind die Folgen?
< Hart, aber fair | l+6 m-4 beide-6 bez+4 | Der Preis ist hoch: Ausrüstung weg, Ruf beschädigt. Die beiden halten zusammen, der Rest grummelt leiser.
> Milde | s+3 l-4 beide+4 alle-6 | Die beiden sind erleichtert. Die anderen merken sich das. Gut.

§ #dl_handel_mit_tod geist schwer wenn:gefallen
Der Tod persönlich bietet einen Handel an: {tot} darf zurückkehren. // Dafür nimmt er einen der Lebenden. Du darfst wählen, wen.
< {held} geht | tod s+5 l-4 geist alle+2 | {tot} öffnet die Augen. {held} schließt sie. {name} nickt langsam: „Das war ein guter Tausch.“ Ist es? | geister
> Den Handel ablehnen | l+4 s-2 | Der Tod lächelt. „Ich frage wieder.“ Und geht. | nebel

§ #dl_leben_retten welt schwer eile:12
Ein Schiff sinkt. Im Wasser: die Fischer aus dem Dorf – und der Händler mit dem einzigen Plan zur Festung. Ein Boot.
< Die Fischer | l+5 s+3 alle+4 plot-1 | Alle Fischer kommen an Land. Der Plan sinkt mit dem Händler. Der Weg zur Festung wird lang. | wellen
> Den Händler | m+5 plot+1 alle-8 | Der Plan ist gerettet. Am Strand bleibt es still. Niemand will darüber reden. | wellen
~ Zögern | W12 ? l+3 s+4 : alle-10 s-4 | Ihr springt einfach alle ins Wasser. Irgendwie schafft ihr es, alle zu retten. Glück. :: Ihr springt zu spät. | wellen

§ #gr_vorwurf spieler wenn:merk:groll
Mitten in einer Szene sagt {name} trocken: „Wie damals, als du ‚{damals}‘ entschieden hast.“ Ein paar lachen. Es klingt nicht nur nach Witz.
< Ehrlich ansprechen | t-4 l+2 laune+8 vertrauen+10 | „Das hängt dir noch nach, oder?“ – „Schon ein bisschen.“ Zwei Minuten, dann ist es gesagt. Es tut beiden gut.
> Weiterspielen | t+2 laune-4 vertrauen-4 | Du lachst mit. {name} nicht mehr.

§ #gr_held spieler wenn:merk:heldgeopfert
Seit dem Tod von {damalsheld} spielt {name} viel vorsichtiger. Heute setzt {held} keinen Fuß in die Höhle.
< Ein Denkmal für {damalsheld} im Spiel | l+2 s+2 laune+10 vertrauen+12 | Eine Statue auf dem Marktplatz. Mit einer Inschrift, die {name} selbst schreiben darf. {name} braucht dafür zehn Minuten und ist danach sehr still. | kerze
> „Das war Würfelpech.“ | laune-6 vertrauen-8 | Es war kein Würfelpech, und das wisst ihr beide.

§ #gr_misstrauen spieler wenn:merk:misstrauisch
{name} fragt bei jeder Entscheidung nach: „Ist das eine Falle? Ehrlich jetzt?“ Das Vertrauen in dich ist spürbar weg.
< Ab heute offen würfeln | l+4 t-3 s-2 vertrauen+16 laune+4 | Deine Würfe liegen jetzt vor dem Schirm. Die Spannung leidet ein wenig. Das Vertrauen kommt zurück. | wuerfelregen
> Die Spannung behalten | s+2 vertrauen-5 laune-4 | „Wirst du sehen.“ {name} rollt mit den Augen.

§ #gr_aussprache tisch wenn:merk:groll
Nach der Session bleibt {name} noch sitzen. // „Darf ich ehrlich sein? Ich hab manchmal das Gefühl, du hast was gegen mich.“
< Zuhören, wirklich zuhören | t-4 laune+12 vertrauen+18 | Es geht um ‚{damals}‘ und noch zwei, drei andere Kleinigkeiten. Am Ende umarmt ihr euch im Flur. | heilung
> Abwiegeln | W11 ? laune-4 vertrauen-8 : geht | „Na gut.“ {name} geht. Es ist nicht gut. :: Zwei Tage später schreibt {name}, dass {er} erstmal eine Pause macht. Vielleicht für länger.

§ #dk_kaffee spieler wenn:merk:dank
{name} bringt dir heute einen Kaffee mit. „Für ‚{dankfuer}‘ letztens. Das war ein richtig guter Moment.“
< Annehmen | s+2 laune+4 vertrauen+5 | Der Kaffee ist kalt, aber das Gefühl ist warm.
> „Den Moment hast du gemacht, nicht ich.“ | laune+7 vertrauen+8 | {name} grinst verlegen. Ein guter Abend fängt so an.

§ #dk_blind spieler wenn:merk:vertraut
{name} vertraut dir blind und lässt {held} in einen bodenlosen Schacht springen, „weil du das sicher geplant hast“. Hast du nicht.
< Ein Netz erfinden | l-5 s+5 vertrauen+4 | Unten ist ein Netz. Natürlich ist da ein Netz. Du hattest es immer geplant. | funkeln
> Konsequenz | W14 ? s+6 laune+6 : tod vertrauen-25 laune-10 | {held} bekommt einen Vorsprung zu fassen. Unfassbar. :: Unten ist nichts. Nur Stein. {name} schaut dich an, als hättest du ein Versprechen gebrochen. | schaedel

`);
