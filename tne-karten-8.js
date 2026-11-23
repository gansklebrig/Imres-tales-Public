/* =====================================================================
   TALES NEVER END – Kartenpaket 8: Echte Krisen, Bosskampf, seltene Karten
   ---------------------------------------------------------------------
   Krisen:   Startkarten tragen krise:art im Kopf und werden nicht gezogen,
             sondern vom Spiel ab und zu zu Sessionbeginn eingeschoben.
             Wirkungen: krise=art · krise- (vorbei) · pause=N (Sessions)
             Rückkehr: kz_art oder kz_art_2 … (automatisch, wenn die
             Pause vorbei ist). Sprecher „pausiert“ = Nachricht im Chat.
   Bosskampf: phase:bossstart / phase:boss – die letzten Karten vor dem
             Finale der letzten Session. boss-N trifft, boss+N heilt.
             Bedingung bhp<N / bhp>N. Je schwächer der Endgegner, desto
             leichter werden die Würfe im Finale.
   Selten:   Kopf „selten“ + dritte Wahl mit „^“ (nach oben wischen).
   ===================================================================== */
(window.TNE_KARTEN = window.TNE_KARTEN || []).push(String.raw`

§ #kr_umzug_start spieler krise:umzug einmal
Nach der Session druckst {name} an der Tür herum. Neuer Job, andere Stadt, Umzug in {wochen} Wochen. „Ich weiß noch nicht, wie das mit der Runde wird.“
< „Wir kriegen das hin. Notfalls per Video.“ | krise=umzug laune+8 alle-2 >>kr_umzug_kartons | {name} atmet hörbar aus. Ihr verabredet, dass das nicht „das letzte Mal“ wird. Keiner sagt es laut, aber alle denken es.
> „Lass uns nicht jetzt darüber reden.“ | krise=umzug laune-6 s-3 >>kr_umzug_kartons | Der Rest des Abends ist etwas gedämpft. Im Treppenhaus umarmt dich {name} trotzdem.

§ #kr_umzug_kartons spieler kette
{name} kommt eine Stunde zu spät, mit Staub in den Haaren und einem Pflaster am Daumen. Heute wurden Kartons gepackt. Müde, aber fest entschlossen zu spielen.
< Eine kurze, leichte Session | t+4 l-2 laune+6 >>kr_umzug_abschied | Ein Gasthaus, ein Rätsel, ein bisschen Kneipenschlägerei. Genau richtig für heute. | staub
> Ganz normal weitermachen | s-2 laune-3 >>kr_umzug_abschied | Um halb zwölf nickt {name} über dem Charakterbogen ein. Niemand weckt {name}.

§ #kr_umzug_abschied spieler kette
Letzte Session vor dem Umzug. Jemand hat einen Kuchen gebacken, der aussehen soll wie ein W20. Es ist eher ein W12. {name} versucht sehr, nicht sentimental zu werden.
< {held} einen großen Moment schreiben | s+6 l+2 laune+15 alle+4 pause=2 | {held} schließt das Tor der Festung von innen, damit die anderen fliehen können – und überlebt, knapp. Am Ende umarmen sich alle an der Tür. Lange. | herzen
> „Kein Abschied. Nur eine Pause.“ | s+3 alle+2 pause=2 | Kein großes Drama, nur ein „bis bald“. {held} bleibt im Spiel – als Brief, der irgendwann wieder ankommen wird.

§ #pz_umzug_moebel pausiert wenn:krise:umzug
{name} schickt ein Foto aus der neuen Wohnung: ein Klappstuhl, ein Umzugskarton als Tisch, darauf ein einzelner W20. „Erste Möbel.“
< Antworten: „Platz für einen Schirm ist da.“ | s+3 laune+6 | Drei Leute antworten gleichzeitig mit Möbelvorschlägen. Einer davon ist ein Thron. | lachen
> Ein Herz schicken und weiterspielen | t+2 laune+2 | Ein Herz. Manchmal reicht das.

§ #pz_umzug_video pausiert wenn:krise:umzug
{name} fragt, ob man sich heute per Video dazuschalten kann. Das WLAN in der neuen Wohnung ist … vorhanden.
< Laptop auf den Tisch | W11 laune+6 ? s+4 laune+6 : t-6 s-3 | Ruckelig, aber es klappt. {name} sitzt quasi wieder mit am Tisch und würfelt mit einem Würfel, den keiner sieht. Alle glauben die 17. :: Das Bild friert ein, während {name} gerade würfelt. Ein Standbild mit halb offenem Mund. Fünfzehn Minuten lang. | frage
> Lieber nächstes Mal richtig | t+2 laune-3 | „Klar. Verstehe.“ Klingt nicht ganz so klar.

§ #kz_umzug spieler kette
{name} ist zurück – zum ersten Mal seit dem Umzug, mit dem Zug angereist und mit einer Tüte Spezialitäten aus der neuen Stadt. Was davon isst man eigentlich?
< Großes Hallo | s+6 t-3 alle+6 laune+10 krise- | Die erste halbe Stunde wird nur geredet. Dann schmeckt jemand die Spezialität. Dann noch eine halbe Stunde. | konfetti
> Weiterspielen, als wäre nie etwas gewesen | t+3 laune+8 krise- | {name} setzt sich auf den alten Platz, nimmt die Würfel und sagt: „Wo waren wir?“ Genau das hat {name} gebraucht.

§ #kz_umzug_2 spieler kette
{name} ist zurück und hat eine Neuigkeit: Ab jetzt kommt {name} jeden zweiten Donnerstag mit dem Zug. Drei Stunden hin, drei Stunden zurück. „Die Runde ist es wert.“
< Die Sessions für diese Tage etwas länger planen | t-4 s+4 laune+12 krise- | Jeder zweite Donnerstag wird zum besonderen Donnerstag. | herzen
> Einen Fahrkosten-Topf aufstellen | l+3 alle+3 laune+8 krise- | Ein Schuhkarton mit „Zugtopf“ steht ab jetzt neben den Chips. Er ist erstaunlich voll.

§ #kr_baby_start spieler krise:baby einmal
{name} legt kommentarlos ein Ultraschallbild auf den Tisch, direkt neben die Würfel. Erst versteht es niemand. Dann alle gleichzeitig.
< Session unterbrechen, anstoßen | s+8 t-5 alle+8 krise=baby >>kr_baby_muede | Es gibt Sekt aus Kaffeetassen und sehr viele Fragen. Die Kampagne kann warten. | konfetti
> Ein Fest für die Helden | s+6 l-2 krise=baby >>kr_baby_muede | In der Taverne wird spontan ein Fest gegeben, ohne dass irgendein Held weiß, warum. Die Spieler wissen es. | musik

§ #kr_baby_muede spieler kette
{name} schläft fast ein. Seit Wochen keine durchgeschlafene Nacht, und das Kind ist noch nicht einmal da. „Ich bin wach. Ich bin wach!“
< {held} hält Nachtwache – eine ruhige Szene | t-3 laune+5 >>kr_baby_namen | Eine leise Szene am Feuer. {name} bleibt wach. Fast. | nacht
> Mit Kaffee weitermachen | laune-3 t+2 >>kr_baby_namen | Drei Espresso später ist {name} wach. Sehr wach. Etwas zu wach.

§ #kr_baby_namen spieler kette
{name} fragt den Tisch nach Namensideen fürs Kind. Der erste Vorschlag lautet „Grimbold“. Niemand lacht. Dann alle.
< Eine Namens-Abstimmung als Mini-Spiel | s+6 t-4 laune+6 >>kr_baby_geburt | Auf der Liste stehen am Ende „Mila“, „Theo“ und „Drachenherz“. Einer davon wird es. Vermutlich nicht der letzte. | lachen
> Zurück zum Abenteuer | t+3 >>kr_baby_geburt | Die Namensfrage wird vertagt. {name} notiert sich trotzdem heimlich „Elandriel“.

§ #kr_baby_geburt spieler kette
Ein Foto im Gruppenchat: winzig, zerknautscht, perfekt. Darunter schreibt {name}: „Ich bin dann mal ein paar Wochen raus. Haltet meinen Platz warm.“
< „Wir passen auf {held} auf.“ | alle+5 s+3 pause=2 | Die Antworten im Chat überschlagen sich. Irgendwer schickt ein Foto von einem winzigen gestrickten Drachen. | herzen
> Babysocke als Glücksbringer | s+4 l-1 pause=2 | Sie hängt da jetzt. Jedes Mal, wenn eine 20 fällt, tippt jemand kurz dagegen. | funkeln

§ #pz_baby_nacht pausiert wenn:krise:baby
{name} schreibt nachts um drei in den Chat: „Wach. Kind auch. Was macht eigentlich {held}?“
< Eine kleine Geschichte zurückschreiben | l+2 laune+10 xp+3 | Du schreibst, was {held} gerade erlebt. Fünf Absätze. Am Morgen kommt zurück: „Hab's beim Füttern gelesen. Danke.“ | sterne
> Ein Gute-Nacht-Emoji | laune+2 | 🌙. Es kommt ein Daumen zurück. Und ein Foto von einem sehr wachen Baby.

§ #kz_baby spieler kette
{name} ist zurück. Augenringe, Spucktuch über der Schulter, aber die Würfel in der Hand. „Ich hab drei Stunden. Lasst sie zählen.“
< Volle Action | s+5 t+4 laune+10 krise- | Explosionen, Verfolgungsjagd, ein Drache. {name} strahlt wie seit Wochen nicht. | explosion
> Ganz entspannt einsteigen | t-2 laune+8 alle+3 krise- | Eine gemütliche Taverne, ein bisschen Gerede, ein paar Pläne. Genau richtig. | heilung

§ #kz_baby_2 spieler kette
{name} ist wieder da – mit Babyphone. Es liegt direkt neben dem Schirm. // Jedes Mal, wenn es knistert, hält der ganze Tisch den Atem an.
< Flüsternd weiterspielen | s+4 l+2 t-3 laune+8 krise- | Die leiseste Kampfszene aller Zeiten. Der Barbar flüstert seinen Kampfschrei. | zzz
> Lautstärke runter, sonst normal | t+2 laune+6 krise- | Nach zwanzig Minuten vergisst man das Babyphone. Bis es piept. Dann ist {name} weg. Und zehn Minuten später wieder da.

§ #kr_job_start spieler krise:job einmal
{name} hat einen neuen Job. Probezeit, viel Druck, neue Leute. „Ich schaff es vielleicht nicht jede Woche.“
< „Dann spielen wir {held} mit, wenn du fehlst.“ | krise=job laune+6 l-2 >>kr_job_spaet | {name} lacht erleichtert. „Aber lasst {h_ihn} nicht sterben.“ – „Keine Versprechen.“
> „Termine sind Termine.“ | krise=job l+3 laune-6 >>kr_job_spaet | Klar, fair. Aber {name} ist danach ein bisschen still.

§ #kr_job_spaet spieler kette
{name} kommt eine Stunde zu spät, direkt aus dem Büro, noch im Hemd. Isst kalte Pizza im Stehen. // Und schaut alle zwei Minuten aufs Handy.
< Kurze Zusammenfassung und rein ins Geschehen | t+3 laune+6 >>kr_job_laptop | „Ihr seid in einer Höhle, es riecht nach Schwefel, {held} hat Hunger.“ – „Kenn ich.“
> Erst mal ankommen lassen | t-4 s+2 laune+4 >>kr_job_laptop | Zehn Minuten über den Job reden. Dann ist {name} angekommen. Wirklich angekommen.

§ #kr_job_laptop spieler kette
{name} hat den Laptop dabei. „Nur kurz eine Mail.“ Das war vor zwanzig Minuten.
< Freundlich ansprechen | W11 ? laune+3 t+3 >>kr_job_ende : laune-6 alle-2 >>kr_job_ende | {name} klappt den Laptop zu. „Sorry. Ihr habt recht. Das kann bis morgen warten.“ :: „Es ist halt wichtig!“ Die Stimmung ist für einen Moment angespannt.
> Ignorieren | t-4 s-3 >>kr_job_ende | Der Laptop bleibt auf. {held} steht die ganze Szene nur herum.

§ #kr_job_ende spieler kette
Probezeit bestanden! {name} bringt Sekt mit. // Und den festen Vorsatz, nie wieder so viel zu arbeiten.
< Anstoßen | s+5 laune+12 alle+3 krise- | Auf feste Verträge, freie Donnerstage und {held}! | konfetti
> Im Spiel: {held} wird im Orden befördert | s+3 l+2 laune+10 krise- | Mit Urkunde, Siegel und einer Rede des Großmeisters. {name} lacht: „Wie im echten Leben, nur mit Schwert.“ | krone

§ #kr_pruef_start spieler krise:pruefung einmal
{name} hat in drei Wochen Abschlussprüfungen. „Ich sollte eigentlich gar nicht hier sein.“ Zwischen den Charakterbögen liegen Karteikarten.
< „Dann mach Pause. Wir warten auf dich.“ | krise=pruefung pause=1 laune+5 | {name} packt die Karteikarten ein. „Daumen drücken!“ Der ganze Tisch drückt Daumen.
> „Ein Abend Ablenkung tut auch gut.“ | krise=pruefung s+3 >>kr_pruef_lernen | {name} bleibt. Die Karteikarten bleiben auch.

§ #kr_pruef_lernen spieler kette
Zwischen zwei Kämpfen lässt sich {name} von den anderen mit Karteikarten abfragen. {anderer} ist darin erschreckend gut.
< Daraus ein Mini-Quiz machen | s+4 t-4 laune+6 pause=1 | Für jede richtige Antwort bekommt {held} einen Inspirationspunkt. Selten hat jemand so viel über Thermodynamik gelernt. | frage
> Das Spiel geht vor | t+3 laune-4 pause=1 | Die Karteikarten verschwinden in der Tasche. Das schlechte Gewissen nicht.

§ #kz_pruefung spieler kette
{name} ist zurück: „Bestanden!“ Mit einer Note, über die nicht geredet wird. Aber bestanden.
< Eine Feier im Spiel | s+6 laune+12 krise- | In {ort} wird ein Fest gegeben, und {held} hält eine Rede über „lebenslanges Lernen“. | konfetti
> Direkt den nächsten Gegner angreifen – zur Feier | m+4 t+4 laune+10 krise- | „Ich will heute einfach Dinge mit einer Axt erschlagen. Glücklich.“ | schwerter

§ #kz_pruefung_2 spieler kette
{name} ist zurück. Eine Prüfung hat nicht geklappt, Nachholtermin im Herbst. „Ich will heute einfach nur Orks verhauen.“
< Dann gibt es heute Orks. Viele. | m+4 s+5 laune+12 krise- | Es gibt Orks. Sie fallen wie Dominosteine. {name} lacht zum ersten Mal seit Wochen richtig. | schwerter
> Kurz darüber reden | l+2 t-3 laune+8 alle+2 krise- | Fünf Minuten. Zwei Leute erzählen von ihren eigenen Nachprüfungen. Danach geht es leichter.

§ #kr_trenn_start spieler bez:paar krise:trennung einmal wenn:bez<45
{name} und {p2} kommen heute getrennt. Sie setzen sich an entgegengesetzte Enden des Tisches. Keiner sagt etwas, aber alle wissen es.
< Normal leiten, mit Fingerspitzengefühl | krise=trennung bez=ex bez-10 alle-3 t-2 >>kr_trenn_szene | Es ist ein seltsamer Abend. Aber er findet statt, und das ist schon viel.
> Vorher fragen, ob beide spielen wollen | krise=trennung bez=ex laune+3 laune2+3 t-4 >>kr_trenn_szene | Beide nicken. Man merkt, wie dankbar sie sind, gefragt worden zu sein.

§ #kr_trenn_szene spieler bez:ex kette
Im Abenteuer steht schon lange eine Szene an, in der {held} und {p2held} zusammenarbeiten müssen. Du hattest sie vor Wochen vorbereitet.
< Umschreiben: Sie bekommen getrennte Aufgaben | l-2 t-2 beide+5 >>kr_trenn_wahl | Keiner merkt, dass du gerade improvisierst. Außer den beiden. Sie merken es und sind froh.
> Die Szene so spielen | W12 ? bez+12 s+4 >>kr_trenn_wahl : bez-10 beide-8 >>kr_trenn_wahl | Überraschend gut. Beide spielen professionell, fast freundlich. :: Ein Satz im Spiel trifft etwas Echtes. Danach ist es sehr still am Tisch.

§ #kr_trenn_wahl spieler bez:ex kette
{name} schreibt dir privat: „Ich weiß nicht, ob ich weiter kommen kann, wenn {p2} auch da ist. Ist nicht gegen irgendwen.“
< Vorschlagen, eine Weile Pause zu machen | pause=2 laune+4 | {name} nimmt eine Auszeit. „Es ist kein Abschied“, schreibt {name}. Du glaubst es.
> Ermutigen zu bleiben | W12 ? bez+10 laune+8 krise- : geht | {name} bleibt. Es wird mit jeder Woche ein bisschen normaler. :: Am nächsten Tag kommt eine lange, ehrliche Nachricht. Es geht nicht. Ein Stuhl bleibt leer.

§ #kz_trennung spieler kette
{name} ist wieder da. Die Begrüßung mit allen ist herzlich, mit einer Person etwas vorsichtig. Aber es geht.
< Weiter wie früher | s+3 laune+10 krise- | Nach einer halben Stunde ist es fast wie früher. Fast reicht.
> Erst mal eine ruhige Session | t-3 alle+2 laune+8 krise- | Eine Reise durch einen Herbstwald, nichts Dramatisches. Manchmal ist das genau richtig. | blaetter

§ #kr_fam_start spieler krise:familie einmal
{name} sagt eine Stunde vor Beginn ab, nur per Nachricht: {Sein} Vater liegt im Krankenhaus. Nichts Lebensbedrohliches, aber {name} fährt jetzt in die Heimat.
< Spielen, aber in Gedanken dabei | krise=familie pause=1 alle-2 | Es wird gespielt, aber immer wieder schaut jemand aufs Handy. {held} bleibt im Lager, „passt auf die Pferde auf“.
> Die Session absagen, alle schreiben {name} | krise=familie pause=1 t-6 s-2 alle+3 laune+8 | Statt zu spielen, kommen im Chat zwanzig Nachrichten zusammen. {name} schickt ein Herz zurück.

§ #pz_familie pausiert wenn:krise:familie
{name} schreibt aus dem Krankenhausflur: „Ihm geht's besser. Erzählt mir was Lustiges von heute.“
< Die peinlichste Szene des Abends aufschreiben | s+4 laune+10 | Der Barbar ist in ein Fass gefallen und hat sich als Fass verkleidet bis zum Ende der Szene. {name}: „Ich musste so laut lachen, die Schwester hat geschaut.“ | lachen
> Ein Foto vom Tisch schicken, alle winken | s+3 alle+3 laune+8 | Fünf Leute, fünf schiefe Daumen hoch, ein Hund im Hintergrund. Es kommt ein „❤️“ zurück.

§ #kz_familie spieler kette
{name} ist zurück. Dem Vater geht es wieder gut. {name} sagt: „Ich brauch heute einfach einen ganz normalen Abend.“
< Einen ganz normalen Abend liefern | s+3 l+2 laune+12 krise- | Ein ganz normaler Abend mit einem Drachen, zwei Missverständnissen und Pizza. Perfekt. | heilung
> {held} eine kleine Heldentat schenken | s+5 m+2 laune+10 krise- | {held} rettet ein Kätzchen aus einem brennenden Haus. Klischee? Ja. Wirkung? Auch ja. | feuer

§ #kr_tier_start spieler krise:haustier einmal
{name} ist heute ungewöhnlich still. Später erzählt {name}, dass der alte Hund diese Woche eingeschläfert werden musste. Vierzehn Jahre alt.
< Ein treuer Hund folgt {held} | s+3 l-1 laune+12 krise=haustier >>kr_tier_hund | {name} lächelt zum ersten Mal an diesem Abend. Der Hund im Spiel bekommt den Namen des echten. | herzen
> Nicht thematisieren, einfach Ablenkung bieten | s+2 laune+4 krise=haustier >>kr_tier_hund | Ein Abend voller Abenteuer. {name} ist dankbar, dass keiner fragt.

§ #kr_tier_hund spieler kette
Der Hund im Spiel ist inzwischen der Liebling des ganzen Tisches. Gerade steht er zwischen {held} und einem wütenden Oger.
< Der Hund überlebt. Natürlich. | l-3 s+5 laune+8 krise- | Der Hund beißt den Oger in die Wade. Legendär. Er bekommt eine eigene Zeile im Charakterbogen. | funkeln
> Würfeln lassen | W8 ? s+4 laune+6 krise- : laune-15 s-8 alle-5 krise- | Der Hund weicht aus und bellt den Oger in die Flucht. :: Du hast den Hund sterben lassen. Fünf Menschen sehen dich an, als hättest du ein Verbrechen begangen. Hast du. | traenen

§ #kr_hoch_start spieler krise:hochzeit einmal
{name} hat sich verlobt! Die Hochzeit ist in {monate} Monaten, und ab jetzt dreht sich jedes zweite Gespräch um Tischordnungen und Blumenschmuck.
< Gratulieren! | s+5 alle+4 krise=hochzeit >>kr_hoch_plan | Es wird angestoßen, und {anderer} bietet an, die Rede zu halten. In Charakter. | konfetti
> „Sind wir eingeladen?“ | s+3 krise=hochzeit >>kr_hoch_plan | „Ihr sitzt an Tisch 7. Der heißt ‚Zum tänzelnden Pony‘. Das war nicht verhandelbar.“ | lachen

§ #kr_hoch_plan spieler kette
{name} fragt, ob die Runde bei der Hochzeit einen Programmpunkt machen will. Vielleicht eine kleine Rede? Vielleicht in Charakter?
< Ein Auftritt der Helden | s+8 l-3 t-3 laune+10 >>kr_hoch_tag | Es wird geprobt. Der Barde schreibt ein Lied. Es reimt sich auf „Würfelglück“. Leider auch auf „Stück für Stück“. | musik
> Ein gerahmter Charakterbogen | s+4 l+2 laune+8 >>kr_hoch_tag | {held}, Stufe {stufe}, mit allen Unterschriften. Im Rahmen sieht der Kaffeefleck fast künstlerisch aus. | funkeln

§ #kr_hoch_tag spieler kette
Die Hochzeit war wunderschön. Um Mitternacht würfelte die halbe Runde mit Krawatten um den Kopf an Tisch 7 um die letzte Brezel. Jetzt: Flitterwochen.
< Gute Reise! | s+5 alle+5 pause=1 | Ein Postkartenfoto kommt drei Tage später: Strand, Sonnenuntergang, ein W20 im Sand. | sonne
> Ein Flitterwochen-Abenteuer | s+4 l-2 xp+5 pause=1 | Wenn {name} zurückkommt, wartet ein Brief auf {held}: Ein geheimnisvoller Strand ruft.

§ #kz_hochzeit spieler kette
{name} ist zurück, braun gebrannt und mit einem Souvenir-Würfel aus dem Urlaub. Er hat auf jeder Seite eine Sechs.
< Den Würfel einmal benutzen lassen | s+6 l-4 laune+10 krise- | Einmal, ein einziges Mal. Es ist eine Sechs. Alle jubeln wie bei einer 20. | wuerfelregen
> Bewundern, aber Regeln sind Regeln | l+3 laune+6 krise- | Der Würfel kommt in die Vitrine. Zwischen den Glückswürfel und den Kronkorken vom ersten Spielabend.

§ #kr_burn_start spieler krise:burnout einmal
Nach der Session sagt {name} leise: „Ich weiß gerade nicht, ob ich das alles schaffe. Job, Familie, alles gleichzeitig. Liegt nicht an euch.“
< „Nimm dir die Pause. Dein Platz bleibt frei.“ | krise=burnout pause=2 laune+6 | {name} nickt nur. An der Tür sagt {name}: „Danke, dass das okay ist.“
> „Komm, wann du kannst.“ | krise=burnout laune+8 >>kr_burn_mal | Kein Druck, keine Erwartungen. {name} wirkt einen Hauch leichter.

§ #kr_burn_mal spieler kette
{name} kommt heute nur für eine Stunde. Ohne Vorbereitung, ohne Würfel, mit einer Tasse Tee. „Ich will einfach dabei sein.“
< {held} bekommt eine Nebenrolle ohne Druck | laune+10 t-2 krise- | {held} kümmert sich um die Pferde und kommentiert trocken das Geschehen. Großartig. | heilung
> „Mitlachen ist auch Spielen.“ | s+3 laune+8 krise- | {name} lacht an diesem Abend mehr als in den letzten drei Wochen zusammen.

§ #kz_burnout spieler kette
{name} ist zurück. Sieht ausgeschlafener aus. Hat sich ein neues Würfelset gekauft. „Neue Würfel, neues Glück.“
< Die neuen Würfel einweihen | s+4 laune+10 krise- | Der erste Wurf: eine 19. Fast. Aber eben fast. | wuerfelregen
> Sanft wieder einsteigen | t-2 laune+8 alle+2 krise- | Kein großes Ding draus machen. Einfach da sein. Das hilft am meisten.

§ #kz_allg spieler kette
{name} ist wieder da! Mit einem breiten Grinsen und einer Tüte Chips als Entschuldigung für die lange Pause.
< Großes Hallo | s+5 alle+4 laune+10 krise- | Als wäre {name} nie weg gewesen. | konfetti
> Direkt weiter | t+3 laune+6 krise- | Würfel raus, weiter geht's.

§ #bs_auftritt schurke phase:bossstart
Die Tür zum Thronsaal fliegt auf. {schurke} erhebt sich langsam vom Thron. „Ich habe auf euch gewartet. Ehrlich gesagt: ziemlich lange.“
< Initiative würfeln! | W9 t+4 s+3 ? boss-12 : t-3 | Die Helden sind schneller! Ein erster Treffer, bevor {schurkeN} überhaupt die Klinge zieht. :: {schurkeN} handelt zuerst. Natürlich. | schwerter
> Erst den Monolog anhören | l+3 s+2 t-5 boss-6 | Der Monolog dauert. Aber {held} hört darin von einer alten Wunde, die nie ganz verheilt ist. | ausruf

§ #bs_verwandlung schurke phase:bossstart
{schurke} lacht. Dann verwandelt sich die Gestalt: größer, dunkler, mit viel zu vielen Zähnen. Der Bosskampf beginnt.
< Licht aus, Musik an | s+6 t+3 | Jemand hat die Bossmusik schon vorbereitet. Gänsehaut am ganzen Tisch. | musik
> Battlemap ausrollen | l+4 m+2 t-4 boss-6 | Drei Meter Papier, zwölf Minis, ein Lineal. Irgendwer am Tisch bekommt glänzende Augen. | staub

§ #bs_mini tisch phase:bossstart
Der Moment ist da: Du stellst die große Boss-Miniatur auf den Tisch. Drei Wochen lang bemalt. Ein Raunen geht durch die Runde.
< Stolz vorzeigen | s+5 alle+4 | Es werden Fotos gemacht. Von allen Seiten. Mit Blitz. Der Boss ist jetzt berühmt. | funkeln
> „Die ist nur Deko.“ (Ist sie nicht.) | s+3 l-2 t+2 | Die Spieler glauben dir kein Wort. Zu Recht.

§ #bs_kerze sl phase:bossstart
Du dimmst das Licht und zündest eine einzelne Kerze an. Am Tisch wird es mucksmäuschenstill.
< Flüsternd erzählen | s+4 l+3 t-2 | Jedes Wort zählt. Sogar der Chaot hört zu. | kerze
> Plötzlich laut werden | W10 ? s+6 boss-8 : s-2 laune-4 | Alle zucken zusammen – und schlagen instinktiv zu. :: Jemand verschüttet vor Schreck die Cola über die Battlemap. | ausruf

§ #bs_arena welt phase:bossstart
Der Boden des Saals ist ein riesiges Mosaik. Einige Fliesen glühen rot, andere gar nicht. Über allem schwebt {schurkeN}.
< Den Rätselteil spielen | W12 l+3 ? boss-15 s+3 : t-4 m-3 | {held} erkennt das Muster. Die glühenden Fliesen schwächen den Boss, wenn man drauftritt. :: Die glühenden Fliesen sind einfach nur heiß. Sehr heiß. | feuer
> Den Rätselteil überspringen | t+4 s+2 | Die Helden springen einfach drüber. Elegant ist anders.

§ #bk_power power phase:boss
{name} steht auf. „{held} greift an. Mit allem.“ // „Ich hab mir diese Fähigkeit seit Stufe drei aufgespart.“
< Volle Wucht | W12 m+4 ? boss-30 s+4 : m-3 laune-5 | Der Treffer sitzt. {schurkeN} taumelt. Der Tisch tobt. :: Daneben. // {name} legt den Kopf auf den Tisch. | explosion
> {schurkeN} pariert – aber es kostet Kraft | m-2 boss-10 laune-2 | Ein Funkenregen, ein Knurren, ein kleiner Riss in der Rüstung.

§ #bk_heilen spieler phase:boss
{p2held} liegt am Boden. {name} muss sich entscheiden: Heilen oder alles auf einen Angriff setzen?
< Heilen | laune2+6 l+2 boss+5 | {p2held} kommt hustend wieder auf die Beine. Der Boss nutzt die Pause und sammelt sich. | heilung
> Angreifen! | W13 ? boss-25 s+4 : tod2 | Der Schlag trifft, während {p2held} hinter {held} langsam wieder zu sich kommt. :: Niemand heilt {p2held}. Der Boss sorgt dafür, dass es auch keiner mehr muss. | schwerter

§ #bk_taktik taktik phase:boss
{name} hat einen Plan auf Karopapier gezeichnet: Flankenangriff, Ablenkung, Seil, Kronleuchter. Mit Pfeilen.
< Den Plan ausführen | W11 l+3 ? boss-28 s+4 : t-4 s-2 | Alles klappt. Es ist fast unheimlich, wie gut das klappt. :: Das Seil ist zu kurz. Natürlich ist das Seil zu kurz. | pfeile
> Improvisieren lassen | s+4 l-3 boss-12 | Der halbe Plan, die doppelte Energie. Es reicht für ein paar Treffer.

§ #bk_chaos chaos phase:boss
{name}: „Ich werfe meinen Heiltrank auf den Boss. Nicht auf mich. AUF IHN.“
< Würfel! | W14 s+8 l-5 ? boss-25 : boss+10 | Die Flasche trifft genau zwischen die Augen. Benommen! :: Der Boss ist jetzt geheilt. Und sehr verwirrt. | explosion
> „Das ist keine Waffe.“ | l+3 laune-6 | {name} schmollt. „Wär aber geil gewesen.“

§ #bk_regel regel phase:boss
{name}: „Moment. Hat {schurkeN} Legendäre Resistenzen? Wie viele davon sind schon weg? Ich führe Buch.“
< Offenlegen: noch eine | l+5 s-2 boss-6 | {name} nickt zufrieden und plant den nächsten Zauber genau darauf. | staub
> „Hinter dem Schirm ist hinter dem Schirm.“ | t+3 laune-6 l-2 | {name} schreibt trotzdem mit. Du siehst es. {name} sieht, dass du es siehst.

§ #bk_snack snack phase:boss
Mitten im Bosskampf kommt {name} mit frischen Nachos zurück. // Der Kampf pausiert. Alle wollen Nachos.
< Snackpause | s+5 t-5 alle+5 boss+5 | Die Nachos sind ausgezeichnet. Der Boss nutzt die Pause, um sich die Wunden zu verbinden. | pizza
> „Nachos nach dem Kampf!“ | t+4 s-3 boss-6 | Hungrig kämpft es sich verbissener. Und schneller.

§ #bk_handy handy phase:boss
{name} schaut vom Handy auf. „Wer ist dran?“ – {name} ist dran. Seit drei Minuten.
< Freundlich erinnern | W10 t+2 ? boss-18 laune+3 : laune-2 | {name} würfelt, ohne zu wissen, worauf. Es trifft. :: Daneben. {name} legt das Handy weg. Immerhin.
> Überspringen | t+4 laune-6 | Der Kampf geht weiter. {name} merkt es erst zwei Runden später.

§ #bk_drama drama phase:boss
{name} lässt {held} vor dem Schlag einen Monolog halten. Über Freundschaft. Über {ort}. Er ist überraschend gut.
< Inspiration: Vorteil auf den Angriff | W9 s+6 l+2 ? boss-30 : s+2 | Die letzte Silbe, dann der Schlag. Der Tisch klatscht. Auch du. :: Der Monolog war großartig. Der Schlag weniger. | musik
> „Kürzer bitte.“ | t+4 laune-8 boss-10 | {name} kürzt auf drei Sätze. Sie sind immer noch gut.

§ #bk_neu neu phase:boss
{name} fragt leise: „Darf ich auch was machen? Ich weiß gar nicht, was mein Held alles kann.“
< Gemeinsam durch den Bogen gehen | t-4 laune+8 W11 ? boss-20 s+5 : | Zusammen findet ihr einen Zauber, den {held} seit Stufe eins hat. Er ist perfekt für genau diesen Moment. :: Der Zauber ist gut gewählt, der Wurf leider nicht. {name} lacht trotzdem. | magie
> Einen Vorschlag machen | t+2 boss-14 laune+3 | „Pfeil, Bogen, auf das Auge.“ Treffer. {name} ist begeistert. | pfeile

§ #bk_veteran veteran phase:boss
{name}: „1989 hatten wir mal einen Boss, der …“ Die Geschichte dauert sieben Minuten. Sie enthält aber einen echten Trick.
< Den Trick benutzen | l+4 t-5 boss-22 | Der Trick funktioniert. 35 Jahre Spielerfahrung zahlen sich aus. | ausruf
> „Spannend, aber jetzt nicht.“ | t+4 laune-6 | {name} murmelt: „Ihr werdet schon sehen.“

§ #bk_musik musik phase:boss
{name} spielt auf dem Handy die Bossmusik ab, ab dem Refrain, viel zu laut. Mit Chor.
< Lauter! | s+6 t+3 l-2 boss-8 | Mit Chor im Rücken trifft jeder Schlag doppelt so hart. Gefühlt jedenfalls. | musik
> Leiser, bitte | l+2 laune-4 | Die Musik läuft weiter, auf Lautstärke 3. Dramatisch flüsternd.

§ #bk_kunst kunst phase:boss
{name} hat den Boss während des Kampfes gezeichnet. Das Bild geht reihum. Er ist darauf furchteinflößend … // und hat einen kleinen Schnurrbart.
< Den Schnurrbart kanonisch machen | s+6 l-4 boss-6 | Der Boss hat ab jetzt einen Schnurrbart. Er wirkt dadurch irgendwie verletzlich. | lachen
> Bild bewundern, weiterkämpfen | s+3 t-2 laune+4 | Das Bild wird nach der Session eingerahmt.

§ #bk_phase2 schurke phase:boss wenn:bhp<65
{schurke} brüllt: „GENUG!“ Die zweite Phase beginnt. Der halbe Saal stürzt ein, aus dem Boden bricht Lava.
< Hinterherspringen | W12 m+3 ? boss-20 s+4 : tod | {held} springt über die Lava und trifft im Flug. Filmreif. :: Der Sprung war zu kurz. | feuer
> Rückzug und neu formieren | t-4 l+3 boss+10 alle+2 | Kurz durchatmen, Wunden verbinden. Der Boss regeneriert. Aber die Helden auch.

§ #bk_angebot schurke phase:boss
{schurke} hält inne. „Schließt euch mir an. Jedem von euch biete ich ein eigenes Königreich.“
< Einen Moment darüber nachdenken lassen | s+5 l+2 t-3 | {name} überlegt wirklich. Alle starren. Dann: „Nein. Aber danke für das Angebot.“ | krone
> Sofort ablehnen und zuschlagen | W10 m+3 ? boss-16 : boss+5 | „Hier ist meine Antwort!“ – Treffer. :: Die Antwort war laut, aber leider daneben. | schwerter

§ #bk_geisel schurke phase:boss
{schurke} packt {npcN} und hält eine Klinge an die Kehle. „Noch einen Schritt näher, und …“
< Verhandeln | W13 l+4 ? boss-12 s+4 : tod2 | Ein Ablenkungsmanöver, ein Wurfdolch, {npcN} ist frei! :: Die Verhandlung scheitert. Jemand bezahlt dafür. | ausruf
> Angreifen, das Risiko eingehen | W11 m+4 ? boss-22 : l-3 s-4 | Der Angriff ist schneller als die Klinge. :: {npc} wird verletzt. Die Spieler schauen dich vorwurfsvoll an. | schwerter

§ #bk_einsturz welt phase:boss
Säulen bersten, Steine regnen. Der Saal verändert sich mit jeder Kampfrunde. Irgendwo rauscht Wasser.
< Den Boss unter eine Säule locken | W12 l+2 ? boss-28 s+5 : m-4 | Eine Tonne Marmor auf den Kopf. Das sitzt. :: Die Säule fällt. Auf die falsche Seite. | erdbeben
> In Deckung gehen | t-3 m+2 | Die Helden überleben den Steinregen. Der Boss auch.

§ #bk_wuerfel wuerfel phase:boss
Alle würfeln gleichzeitig. Vier W20 rollen über den Tisch. // Einer fällt herunter und verschwindet unter dem Sofa.
< Der unterm Sofa zählt! | W10 s+6 l-2 ? boss-25 : boss+5 | Unterm Sofa liegt eine 18. Und ein Euro. Und ein alter Würfel von 2016. :: Unterm Sofa liegt eine 2. Und Staub. | wuerfelregen
> Neu würfeln | t-2 W12 ? boss-15 : | Ordnung muss sein. Treffer. :: Ordnung muss sein. Daneben. | wuerfelregen

§ #bk_hp sl phase:boss wenn:bhp<45
Laut deinen Notizen hat der Boss nur noch wenige Trefferpunkte. // Die Spieler wissen das nicht und planen gerade einen umständlichen Rückzug.
< Andeuten: „Sieht … angeschlagen aus.“ | boss-15 t+3 s+3 | Ein Moment Stille. Dann stürmen alle gleichzeitig nach vorne. | schwerter
> Schweigen und die Spannung genießen | t-3 s+2 l+2 | Der Rückzug ist toll gespielt. Völlig unnötig, aber toll.

§ #bk_zustark sl phase:boss wenn:bhp>70
Ehrlich gesagt: Du hast den Boss zu stark gebaut. Die Gruppe macht kaum Schaden, die Stimmung kippt langsam.
< Heimlich Trefferpunkte streichen | boss-25 l-3 s+3 | Niemand merkt es. Nur das Gefühl am Tisch wird plötzlich besser. | funkeln
> Durchziehen – das wird episch | W13 m+4 s+4 ? boss-20 : tod2 s-4 | Gegen alle Erwartung: ein gewaltiger Treffer. :: Episch war es. Für einen Helden auch das letzte Mal. | explosion

§ #bk_zuschwach sl phase:boss wenn:bhp<30
Der Boss fällt gleich – viel zu früh. Du hast noch eine ganze dritte Phase vorbereitet. Mit Tentakeln.
< Eine zweite Lebensleiste | boss+20 s+3 l-3 | „Ihr dachtet, das war's?“ Tentakel. Überall. Der Tisch stöhnt und freut sich gleichzeitig. | ausruf
> Fallen lassen | boss-20 s+4 t+4 | Kein Tentakel heute. Die Phase landet im Ordner „nächstes Mal“.

§ #bk_team spieler bez:freunde/paar/geschwister/wg phase:boss
{held} und {p2held} kombinieren ihre Angriffe. {name} und {p2} haben das offensichtlich vorher abgesprochen. Es gibt sogar einen Namen für das Manöver.
< Den Teamangriff zulassen | W10 ? boss-30 s+5 bez+6 : bez-3 s+2 | „DOPPELTER DONNERKEIL!“ Der Boss fliegt quer durch den Saal. :: Der Name war besser als der Angriff. Beide lachen trotzdem. | explosion
> Nacheinander würfeln | l+3 boss-12 | Ordentlich, aber unspektakulär. {p2} murmelt: „Wir hatten einen Namen dafür.“

§ #bk_altheld spieler phase:boss wenn:merk:verlust
{name} steht auf. // „Das ist für {altheld}.“
< Würfeln | W11 ? boss-30 laune+10 s+4 : laune-4 | Für {altheld}. Der Tisch ist für eine Sekunde still, dann jubelt er. :: Daneben. Aber {name} nickt nur. „{altheld} hätte auch danebengehauen.“ | schwerter
> Den Moment mit Inspiration belohnen | boss-15 laune+6 l+2 | Kein Würfel nötig. Manche Treffer schreibt man einfach. | funkeln

§ #bk_pech spieler phase:boss wenn:merk:pechvogel
Alles hängt jetzt an {name}s Wurf. // {name} hat diese Runde schon {nat1}-mal eine 1 gewürfelt.
< Würfeln lassen | W8 ? boss-35 s+8 laune+15 : s+3 laune-5 | Eine 19! {name} springt auf. Der Pechvogel-Fluch ist gebrochen. Für heute. :: Eine 2. // {name} lacht so verzweifelt, dass alle mitlachen müssen. | konfetti
> Jemand anderes würfelt | t+2 W10 ? boss-15 : | Ein anderer Würfel, eine andere Hand. Treffer. {name} ist halb erleichtert, halb beleidigt. :: Auch der andere Würfel hat keine Lust. Es liegt doch nicht an {name}.

§ #bk_geist geist phase:boss
Der Geist von {tot} erscheint im Saal und stellt sich schweigend neben die Helden.
< Der Geist kämpft mit | boss-20 s+5 l-2 | Eine geisterhafte Klinge, ein eiskalter Schlag. Dann verblasst {tot} mit einem Lächeln. | geister
> Der Geist warnt nur | l+3 boss-8 | Ein Flüstern: „Links. Immer links.“ Die Helden greifen links an. Es funktioniert. | geister

§ #bk_katze katze phase:boss
Die Tischkatze springt auf die Battlemap und wirft die Boss-Miniatur um. Sie rollt vom Tisch.
< Das zählt als Treffer | boss-15 s+6 l-4 | Die Katze bekommt einen Erfahrungspunkt. Und ein Leckerli. Der Boss liegt unterm Stuhl. | lachen
> Wieder hinstellen | l+2 laune-2 | Die Miniatur hat jetzt eine abgebrochene Hand. Der Boss im Spiel auch, beschließt du.

§ #bk_gott gott phase:boss
Mitten im Kampf hört {held} eine Stimme: {gott} bietet Hilfe an. „Ein kleiner Gefallen später. Nichts Großes.“
< Annehmen | boss-28 l-2 s+3 +w_schuld_gott | Ein Lichtstrahl, ein Schrei, der Boss brennt. Irgendwo wird eine Rechnung geschrieben. | sonne
> Ablehnen | m+2 l+2 | „Wir schaffen das allein.“ {gott} klingt beleidigt. Aber respektvoll.

§ #bk_npc npc phase:boss
Plötzlich stürmt {npc} mit Verstärkung in den Saal. Die Helden hatten vor ein paar Sessions einmal geholfen – das zahlt sich jetzt aus.
< Die Verstärkung kämpfen lassen | boss-18 s+5 l-2 | „Ihr habt mir damals geholfen. Jetzt bin ich dran!“ Gänsehaut. | schwerter
> Die Verstärkung sichert die Ausgänge | l+3 t-2 boss-6 | Klug, unspektakulär, sehr hilfreich.

§ #bk_flucht schurke phase:boss wenn:bhp<35
{schurkeN} ist schwer verwundet und weicht Schritt für Schritt Richtung Portal zurück.
< Hinterher! | W12 m+3 ? boss-30 : boss+12 | Ein letzter Sprung, ein letzter Hieb – der Boss geht zu Boden. :: Der Boss entkommt fast. Fast. Aber gewinnt Zeit. | portal
> Das Portal zerstören | W13 l+2 ? boss-20 s+4 : t-3 | Das Portal zerbricht. Kein Ausweg mehr. :: Das Portal zuckt, bleibt aber offen. | explosion

§ #bk_spaet tisch phase:boss
Es ist halb eins. Der Bosskampf läuft seit zwei Stunden. // Die erste Person gähnt so laut, dass der Boss kurz innehält.
< Tempo: Die Diener fallen automatisch | t+6 l-3 boss-10 | Keine Würfe mehr für die Diener. Nur noch der Boss. Plötzlich sind alle wieder wach. | staub
> Fünf Minuten Pause, Kaffee, weiter | t-4 alle+4 s+2 | Kaffee, Kekse, Klogang. Dann weiter, frischer als vorher.

§ #bk_regelbuch regelbuch phase:boss
Das Regelbuch fällt vom Tisch und klappt genau auf der Seite über Flankenangriffe auf. Zufall?
< Flankieren! | l+3 boss-18 | Zwei Helden links, einer rechts, Vorteil auf alles. Das Regelbuch hat gesprochen. | staub
> Zuklappen, weiterkämpfen | t+3 s+2 | Kein Zufall ist so gut wie ein guter Plan. Oder doch?

§ #bk_alle sl phase:boss
Die Helden umzingeln {schurkeN}. Alle Würfel liegen bereit. Wer schlägt zuerst zu?
< Alle gleichzeitig! | W11 s+6 t+3 ? boss-30 : boss-8 laune-3 | Vier Würfel, vier Treffer. Der Saal bebt. :: Ein Chaos aus Würfeln. Zwei treffen, zwei rollen vom Tisch. | wuerfelregen
> Der mit der schlechtesten Laune darf | laune+12 W12 ? boss-22 : | Die Person mit der schlechtesten Laune bekommt den großen Moment. Danach ist die Laune nicht mehr schlecht. :: Es klappt nicht. Aber die Geste kam an.

§ #fin_nachboss sl phase:finale wenn:boss_besiegt
{schurkeN} liegt besiegt am Boden. Der Saal ist still, nur das Feuer knistert. Alle schauen dich an: Was jetzt?
< Gnade | l+4 s+4 frieden | Die Helden lassen {schurkeN} gehen, gebrochen und allein. Eine Geschichte, über die man noch lange redet. | herzen
> Das Ende besiegeln | m+4 s+3 sieg lvl | Ein letzter Schlag. Dann Stille. Dann Jubel, der bis in die Küche schallt. | konfetti

§ #fin_nachboss2 schurke phase:finale wenn:boss_besiegt
{schurke} hustet. „Ihr … habt gewonnen. Aber wisst ihr, wer mich geschickt hat?“
< „Ist uns egal.“ | s+5 t+3 sieg | Der Tisch lacht. Der Schurke stirbt beleidigt. Ein guter Abschluss. | lachen
> „Wer?“ | l+4 s+2 sieg +w_auftraggeber | Ein Name wird geflüstert. Den Namen schreibst du dir sofort auf. Die nächste Kampagne hat ihren Schurken. | ausruf

§ #sel_wunsch gott selten
{gott} erscheint der Gruppe persönlich – und gewährt einen einzigen Wunsch. Am Tisch wird es sehr laut und dann sehr still.
< Macht für alle | m+10 lvl s+2 | Alle Helden steigen auf. Der Powergamer weint fast vor Glück. | krone
> Frieden für {ort} | l+4 s+5 alle+8 | Das Land blüht auf. Die Spieler sind seltsam gerührt. | sonne
^ Einen Toten zurückholen | l-6 s+8 alle+6 geist | {tot} öffnet die Augen. „Hab ich was verpasst?“ Jubel, Tränen, ein halber Herzinfarkt beim Spieler. | heilung

§ #sel_crossover gast selten
Es klingelt. Vor der Tür steht eine andere Spielgruppe aus dem Haus. Sie haben sich im Stockwerk geirrt. // Mit Charakterbögen für ein völlig anderes Rollenspiel.
< Crossover-Session! | s+10 l-8 t-4 alle+6 | Ein Cyberpunk-Hacker und ein Zwergenpriester teilen sich eine Taverne. Es ist der lustigste Abend des Jahres. | konfetti
> Höflich wegschicken | l+2 t+2 | „Viel Spaß im vierten Stock!“ Durch die Decke hört man sie den ganzen Abend jubeln.
^ Ihre SL spielt einen NSC | s+6 l-2 xp+10 alle+3 | Der NSC ist ein verwirrter Raumschiffkapitän. Er wird Kult. | portal

§ #sel_ei welt selten
In einem Brunnen in {ort} schlüpft ein Drache aus einem Ei, das dort seit hundert Jahren lag. Er hält {held} für seine Mutter.
< Aufziehen! | m+6 s+6 l-4 +w_babydrache | Der Babydrache frisst Stiefel, Kohlköpfe und einmal fast den Barden. Er heißt jetzt „Krümel“. | drache
> In die Berge bringen | l+4 s+2 | Ein tränenreicher Abschied am Gipfel. Der Drache dreht sich noch einmal um. | wind
^ An Drachenforscher geben | m+3 l+3 s-2 xp+8 | Gute Bezahlung, schlechtes Gewissen. Jahre später besucht der Drache die Gruppe. Er ist groß geworden. Er ist nachtragend. | gold

§ #sel_wuerfelgott wuerfel selten
Alle Würfel am Tisch zeigen plötzlich eine 20. Ohne dass jemand geworfen hat. Alle schauen dich an.
< Ein Wunder! Es zählt | s+8 l-6 lvl | Niemand weiß, was gerade passiert ist. Alle steigen auf. | wuerfelregen
> „Zählt nicht. Neu!“ | l+4 s-2 | Ordnung muss sein. Der Tisch protestiert lautstark.
^ Würfel einrahmen | s+5 l+2 xp+15 | Sie liegen jetzt unter Glas. Neben einer Notiz: „Datum, Uhrzeit, alle 20.“ | funkeln

§ #sel_thronerbe welt selten
Eine Hebamme erkennt ein Muttermal: {held} ist der verschollene Thronerbe von {ort}. Das war nicht geplant. Die Würfel wollten es so.
< Annehmen | m+10 l-4 s+5 | Eine Krone, ein Schloss, eine sehr verwirrte Gruppe. | krone
> „Die Hebamme irrt sich.“ | l+5 laune-4 | {name} ist sichtlich enttäuscht.
^ Erbe – aber einer Käserei | s+8 l-2 laune+6 | {held} erbt die größte Käserei des Landes. Es ist besser als jeder Thron. Sagt {name}.

§ #sel_alte_runde gast selten
Ein alter Freund aus deiner allerersten D&D-Runde vor zwanzig Jahren steht vor der Tür. Er hat zufällig gesehen, dass hier Licht brennt und Würfel klackern.
< Mitspielen lassen | s+5 t-3 alle+3 | Er würfelt einen Helden in drei Minuten. „Wie Fahrradfahren.“ | konfetti
> Erst mal ein Bier zusammen | t-5 s+3 laune+5 | Ihr redet über früher, über die Kampagne mit dem Turm und den einen Abend, als das Bett brannte. | lachen
^ Er leitet heute | s+6 l-3 xp+12 alle+5 | Du darfst zum ersten Mal seit Jahren selbst spielen. Dein Held stirbt nach zwölf Minuten. Es ist großartig. | funkeln

§ #sel_karte welt selten
Die Gruppe findet eine Karte ihrer ganzen Kampagne – mit Orten, die du noch gar nicht verraten hast. Und einem, den du selbst nicht kennst.
< Dem unbekannten Ort folgen | t+4 s+6 l-4 +w_unbekannt | Ein Ort, den du jetzt improvisieren musst. Du schwitzt. Die Spieler lieben es. | portal
> Die Karte verbrennen | l+3 s-2 | Zu viel Wissen ist gefährlich. Die Asche zeigt kurz ein Grinsen.
^ Die Karte verkaufen | m+5 t+3 | Ein Kartograf zahlt ein Vermögen. Und verschwindet mit sehr eiligen Schritten. | gold

§ #sel_hausregel regelbuch selten
Im Regelbuch steht eine handschriftliche Notiz, die angeblich niemand geschrieben hat: „Wer zuletzt eine 1 gewürfelt hat, darf einmal neu würfeln.“
< Als Hausregel übernehmen | s+5 l-3 alle+4 | Die Regel heißt ab jetzt „Gnade des Regelbuchs“. Der Pechvogel am Tisch weint vor Glück. | staub
> Ausradieren | l+4 laune-3 | Der Radierer hinterlässt einen Fleck. Er sieht aus wie eine 1.
^ Herausfinden, wer das war | t-4 s+6 | Die Handschrift passt zu niemandem. Außer vielleicht zu der Katze. | frage

§ #sel_lied welt selten
Ein fahrender Barde singt in der Taverne ein Lied über genau diese Heldengruppe. Es ist erstaunlich detailliert. Und nicht besonders schmeichelhaft.
< Mitsingen | s+8 l-2 alle+3 | Am Ende singt die ganze Taverne mit. Auch die Strophe über {held} und das Schwein. | musik
> Schweigegeld zahlen | m-2 l+3 s+2 | Er hört auf. Und schreibt eine neue Strophe über Bestechung. | gold
^ Den Barden anheuern | s+5 t+2 +w_barde | Ab jetzt reist ein Barde mit, der jede Peinlichkeit festhält. Für die Nachwelt. | musik

§ #sel_ahnenfest geist selten wenn:gefallen
In dieser einen Nacht des Jahres kehren alle gefallenen Helden der Chronik für ein Fest in die Taverne zurück. {tot} hebt den Krug.
< Mitfeiern | s+8 l-3 alle+6 | Tote und Lebende stoßen an. Niemand am Tisch redet in der nächsten halben Stunde über Regeln. | geister
> Nur zuhören | l+4 laune+4 alle+3 | Die Gefallenen erzählen von ihrem Ende. Es klingt fast schön. | kerze
^ Um einen Rat bitten | l+2 xp+10 plot+1 | „Hütet euch vor dem dritten Tor“, sagt {tot}. Dann bricht der Morgen an. | sterne

§ #sel_katzenblick katze selten
Die Tischkatze legt eine Pfote auf den Schirm und sieht dich lange an. Du schwörst: Sie hat genickt.
< Die Katze wird NSC | s+6 l-3 | Die Katze ist ab jetzt Hofmagierin von {ort}. Sie macht nichts. Sie ist perfekt. | magie
> Hochheben, weiterspielen | t+2 | Die Katze schnurrt. Du hättest schwören können, sie seufzt.
^ Die Katze würfelt | W10 ? s+8 lvl katze : s+4 katze | Die Pfote stößt den Würfel an: eine 20. Der Tisch flippt aus. :: Der Würfel rollt unters Sofa. Die Katze hinterher. Beide bleiben verschwunden. | wuerfelregen

§ #sel_tausch spieler selten
Ein Fluch vertauscht die Körper von {held} und {p2held}. {name} und {p2} müssen die Charakterbögen tauschen.
< Durchziehen bis Sessionende | s+8 l-4 t-2 laune2+3 | {name} spielt den Helden von {p2} – besser als {p2}. Das gibt zu reden. | portal
> Nur für eine Szene | s+4 t+2 | Lang genug für einen sehr peinlichen Moment in einem Badehaus. | lachen
^ Auch Plätze tauschen | s+6 alle+4 t-3 | Am Ende tauscht der ganze Tisch. Völliges Chaos. Völlig großartig. | konfetti

§ #sel_auge welt selten
Der Himmel über {ort} reißt auf. Dahinter: ein riesiges Auge. Es blinzelt einmal. Dann schließt sich der Himmel wieder.
< Nie wieder davon sprechen | l+3 t+2 | Die Helden einigen sich darauf, dass nichts war. Der Spieler mit dem Notizbuch schreibt trotzdem alles auf.
> Untersuchen | W14 ? l-4 s+8 xp+12 : l-6 s+2 | Die Spur führt zu einer Wahrheit, die alles verändert. :: Die Spur führt in den Wahnsinn. Ein bisschen. | portal
^ Zurückwinken | s+6 l-2 | Der Himmel reißt noch einmal auf. Das Auge wirkt … erfreut? | ausruf

§ #sel_schurke_kaffee schurke selten
{schurke} sitzt inkognito in der Taverne, direkt neben den Helden. Nicht, um zu kämpfen. // Nur, um zu reden.
< Zuhören | l+5 s+3 t-3 | Eine lange Geschichte über Fehler, Verrat und einen kaputten Traum. Die Helden zögern zum ersten Mal. | kerze
> Sofort angreifen | W12 m+5 ? boss-20 s+4 : m-5 | Ein Überraschungsangriff in der Taverne. Krüge fliegen. :: {schurkeN} lächelt traurig und verschwindet im Rauch. | schwerter
^ Ein Bier ausgeben | s+5 l-3 +w_schurkenbier | Am Ende des Abends lachen Held und Schurke zusammen. Das wird das Finale sehr kompliziert machen. | lachen

§ #sel_sternschnuppe welt selten
Eine Sternschnuppe schlägt im Wald neben dem Lager ein. Der Krater leuchtet noch, und etwas darin summt leise.
< Hineinklettern | W11 ? m+8 s+4 : m-4 | Ein Splitter aus Sternenmetall. Er will ein Schwert werden. :: Ein Splitter aus Sternenmetall. Er ist heiß. Sehr heiß. | sterne
> Einen Wunsch aussprechen | s+5 alle+5 | Alle wünschen sich etwas. Leise. Am Tisch auch. | sterne
^ Den Druiden fragen | l+3 xp+8 | Der Druide sagt, das Summen sei ein Lied. Ein sehr altes. Er singt mit. | musik

§ #sel_foto tisch selten
Jemand hat ein altes Foto der Runde dabei, von vor vielen Jahren. Ein paar von heute sind noch drauf. Mit sehr, sehr viel schlimmeren Frisuren.
< Herumgeben | s+6 t-3 alle+5 | Es wird gelacht, bis jemand Schluckauf hat. Dann wird es kurz still, weil auch Leute drauf sind, die nicht mehr kommen. | lachen
> An die Wand hängen | l+2 alle+3 | Das Foto hängt jetzt neben dem Schirm. Ab und zu schaut jemand drauf.
^ Ein Klassentreffen planen | s+5 t-2 xp+10 | Die Helden treffen in der nächsten Session ihre jüngeren Ichs. Es wird chaotisch. | portal

§ #sel_buch npc selten
Eine Bibliothekarin reicht {held} ein Buch: „{kampagne}“. Darin steht alles, was bisher geschah. Die letzten Seiten sind leer.
< Weiterschreiben | l+3 s+5 xp+10 | {held} schreibt einen Satz. In der nächsten Session passiert genau das. | magie
> Zurückgeben | l+4 | Die Bibliothekarin nickt. „Weise.“ Dann verschwindet sie zwischen den Regalen.
^ Bis zum Ende vorblättern | W13 ? s+6 plot+1 : l-6 t+4 | Auf der letzten Seite steht nur: „Und sie lebten.“ Das reicht. :: Die Seiten verbrennen beim Umblättern. Was blieb, war beunruhigend. | feuer

§ #fx_kruemel welt wenn:w_babydrache einmal
Krümel, der Babydrache der Gruppe, ist gewachsen. Beim Frühstück hat er die halbe Taverne angezündet. // Jetzt schaut er sehr schuldbewusst.
< Krümel bleibt bei der Gruppe | m+6 s+4 l-3 | Die Taverne wird auf Kosten der Gruppe neu gebaut. Krümel trägt dabei die Balken. Ein guter Junge. | drache
> Krümel zieht in die Berge | l+4 s+2 -w_babydrache | Ein letzter Blick über die Schulter, ein kleiner Rauchkringel zum Abschied. Der Tisch ist sehr still. | traenen

§ #fx_gottschuld gott wenn:w_schuld_gott einmal
{gott} kommt den Gefallen einfordern, der im Bosskampf versprochen wurde: Die Helden sollen den größten Tempel des Landes putzen. Mit Zahnbürsten.
< Schrubben | t-6 s+4 l+3 -w_schuld_gott | Drei Tage. Viele Zahnbürsten. Am Ende glänzt der Tempel, und {gott} schenkt jedem einen Segen. Und eine neue Zahnbürste. | sonne
> Nachverhandeln | W13 ? s+5 -w_schuld_gott : m-8 -w_schuld_gott | {gott} lacht und erlässt die Schuld. Für eine gute Geschichte. :: Göttlicher Zorn. Kurz, aber sehr gründlich. | blitz

§ #fx_barde npc wenn:w_barde
Der mitreisende Barde hat ein neues Lied fertig. Es handelt von der letzten Niederlage der Gruppe. Es hat einen Refrain. Der Refrain ist eingängig.
< Zuhören | s+6 l-2 | In der nächsten Stadt singen es schon die Kinder. Die Gruppe ist berühmt. Auf eine Art. | musik
> Den Barden entlassen | l+3 s-2 -w_barde | Er geht mit Würde und einer letzten Strophe über undankbare Helden. | musik

§ #fx_auftraggeber schurke phase:kstart wenn:w_auftraggeber einmal
Der Name aus dem letzten Finale ist zurück: ein Brief mit schwarzem Siegel. „Ihr habt meinen Diener besiegt. Kommt zu mir. Wenn ihr euch traut.“
< Die Einladung annehmen | t+5 s+5 l+3 -w_auftraggeber | Die neue Kampagne beginnt mit einem Ziel. Am Tisch wird sofort spekuliert. | ausruf
> Den Brief verbrennen | l+4 m+2 -w_auftraggeber | Die Asche formt kurz ein Gesicht. Es lächelt. | feuer

§ #fx_schurkenbier schurke phase:finale wenn:w_schurkenbier
{schurke} steht den Helden gegenüber – und erkennt die Leute vom Bier in der Taverne wieder. Ein kurzes Zögern.
< Reden | W12 l+4 s+6 ? frieden : tod2 | „Wir haben schon mal zusammen gelacht.“ Das Schwert sinkt. Was für ein Ende. :: Das Zögern war kurz. Zu kurz. | herzen
> Das Zögern nutzen | W11 m+5 ? sieg : tod | Ein schneller Schlag in den Moment des Zweifels. Sieg – mit einem bitteren Nachgeschmack. :: Das Zögern war gespielt. | schwerter

§ #fx_unbekannt welt wenn:w_unbekannt einmal
Die Gruppe erreicht den Ort, der auf keiner deiner Karten stand. Du hast immer noch keine Ahnung, was dort ist. Die Spieler schon – sie haben drei Theorien.
< Die beste Theorie wird wahr | s+8 l-3 alle+5 -w_unbekannt | Es ist tatsächlich eine schwebende Bibliothek voller verlorener Socken. Die Spieler sind überzeugt, dass du das von Anfang an geplant hast. | portal
> Etwas ganz anderes | W12 ? l+4 s+5 -w_unbekannt : l-6 s+2 -w_unbekannt | Ein stiller Garten mit Gräbern aller Helden, die noch nicht gestorben sind. Gänsehaut. :: Ein leeres Feld. Ein Schild: „Demnächst.“ Die Spieler sind empört. Zu Recht. | nebel

`);
