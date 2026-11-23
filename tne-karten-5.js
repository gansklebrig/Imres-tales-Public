/* =====================================================================
   TALES NEVER END – Kartenpaket 5: Dungeons, Reisen, Städte, Zufälle,
   Erzählstränge (Kette), Trash, Hausregel-Karten
   ===================================================================== */
(window.TNE_KARTEN = window.TNE_KARTEN || []).push(String.raw`

§ #dg_mimik sl
Im Dungeon steht eine verdächtig unauffällige Schatztruhe. {held} will sie öffnen.
< Es ist eine Mimik | W12 s+6 t+4 ? m+3 : tod | Die Truhe hat Zähne! Nach hartem Kampf liegt sie besiegt da. Darin: eine kleinere Truhe. :: Die Truhe frisst {held}. Mit Ausrüstung. | treffer
> Echte Truhe | m+6 s+2 l-2 | Gold, ein Heiltrank und ein Zettel: „Diesmal nicht.“ | gold

§ #dg_falle sl
Ein Gang voller Druckplatten. // Und niemand in der Gruppe kann Fallen finden.
< Vorsichtig tasten | l+6 t-8 s-4 | Eine Stunde Zentimeter für Zentimeter. Niemand stirbt. Alle sterben innerlich. | staub
> Einfach rennen | W11 t+8 s+4 ? : tod2 | Pfeile zischen, Klingen sausen – alle kommen durch! :: Eine Platte zu viel. | pfeile

§ #dg_raetsel sl
Eine Tür mit einem Rätsel. // Die Spieler raten seit 30 Minuten falsch.
< Hinweis geben | t+6 s+2 l-2 | „Denkt an… etwas mit Zähnen, das nie beißt.“ – „EIN KAMM!“ Jubel. | glocke
> Sie sollen weiterraten | l+4 t-8 s-6 | Die Antwort war „Echo“. Niemand kommt drauf. Der Barbar tritt die Tür ein. | frage

§ #dg_wasser sl ort:hoehle
Der Dungeon ist halb überflutet. Die Fackeln gehen aus.
< Tauchgang! | W12 s+5 t+3 ? m+3 : tod | Unter Wasser finden sie den Ausgang. Und einen sehr verwirrten Aal. :: Zu lange unter Wasser. | wellen
> Umweg | t-5 l+4 | Ein langer Weg über glitschige Stege. Alle sind nass und schlecht gelaunt. | regen

§ #dg_boss npc
Der Zwischenboss heißt {npcN}, hat einen Speer und schlechte Laune.
< Harter Kampf | W12 m+3 t+4 ? lvl s+4 : tod | Der Zwischenboss fällt. Alle steigen auf! :: Der Speer trifft. | schwerter
> Liebeskummer! | s+8 l-3 t-3 | Statt zu kämpfen, hört sich die Gruppe die ganze traurige Geschichte an. Danach darf sie durch. | herzen

§ #dg_kerker sl ort:dungeon
Die Gruppe wird gefangen genommen und in einen Kerker gesperrt. Ohne Ausrüstung.
< Ausbruch planen | l+5 s+4 t-4 | Ein Löffel, ein loser Stein, viel Geduld. Klassischer Ausbruch! | staub
> Gefängniswärter bestechen | s+3 m-3 W10 ? t+5 : t-5 | Der Wärter ist käuflich. Sehr käuflich. :: Der Wärter meldet es dem Hauptmann. Zwei Tage extra. | gold

§ #dg_portal sl
Im tiefsten Raum des Dungeons schimmert ein Portal. Wohin es führt, weiß niemand.
< Hindurch! | t+8 s+6 l-5 | Die Gruppe landet in einer Taverne auf einer anderen Ebene. Dort trinken Engel und Dämonen zusammen. | portal
> Versiegeln | l+5 m+2 | Das Portal schließt sich. Irgendetwas dahinter seufzt enttäuscht.

§ #dg_schleim sl
Ein Gallertwürfel füllt den ganzen Gang. In ihm schwimmen Münzen, ein Schwert … // und ein verwirrter Gnom.
< Gnom retten | W11 s+6 l+2 ? m+3 : tod2 | Der Gnom ist ein Händler! Er gibt Rabatt auf Lebenszeit. :: Der Würfel ist hungrig. Sehr. | gift
> Würfel umgehen | t-4 l+3 | Die Gruppe nimmt einen anderen Weg. Der Gnom winkt traurig.

§ #rs_strasse sl
Die Reise nach {ort} dauert neun Tage. Wie spielst du das?
< Montage! | t+10 l-3 s+3 | „Neun Tage vergehen.“ Eine Montage mit Lagerfeuern, Regen und einem Bären. | wind
> Jeden Tag ausspielen | l+8 t-12 s-4 | Tag 4: Ein Rad bricht. Tag 5: Nieselregen. Tag 6: Noch mehr Nieselregen. | regen

§ #rs_kutsche npc
Ein Kutscher bietet an, die Gruppe mitzunehmen. Er redet ununterbrochen.
< Mitfahren | t+6 s+3 l+2 | Er erzählt alle Gerüchte des Landes. Eines davon stimmt sogar. | staub
> Laufen | t-4 m+2 | Die Füße tun weh, aber die Ohren sind dankbar.

§ #rs_berg welt ort:berg
Ein Gebirgspass. Lawinengefahr. Ein Ziegenhirte warnt: // „Nicht heute.“
< Trotzdem rüber | W13 t+6 m+2 ? s+4 : tod | Eine dramatische Überquerung im Schneegestöber. Geschafft! :: Die Lawine kommt. | schnee
> Abwarten | t-8 l+4 s-2 | Drei Tage in der Hirtenhütte. Viel Ziegenkäse. Sehr viel Ziegenkäse.

§ #rs_schiff welt ort:meer
Die Gruppe reist per Schiff. // Der Kapitän ist ein einbeiniger Halbling mit Papagei.
< Seeschlacht! | W12 m+5 s+6 t+5 ? lvl : tod | Piraten entern – und werden zurückgeschlagen! Rum für alle! :: Ein Held geht über Bord. | wellen
> Seekrankheit | s+5 l+3 m-3 | Alle sind seekrank. Der Papagei lacht. Drei Tage lang. | lachen

§ #rs_wald welt ort:wald
Ein uralter Wald. Die Bäume scheinen zu flüstern.
< Zuhören | l+3 s+4 t-3 | Die Bäume verraten, wo {schurkeN} sein Lager hat. | ranken
> Schnell durch | t+5 W10 ? : m-4 | Ohne Probleme durch. :: Der Wald ist beleidigt. Wurzeln greifen nach den Füßen. | ranken

§ #rs_bruecke welt
Eine Hängebrücke über einer Schlucht. Sie knarrt bedrohlich. Ein Troll verlangt Brückenzoll.
< Bezahlen | m-3 l+5 | Der Troll gibt Wechselgeld und eine Quittung. Sehr ordentlicher Troll. | gold
> Rätselduell | W12 s+6 ? m+2 : t-5 | Der Troll verliert und muss eine Woche lang nett sein. :: Der Troll gewinnt. Die Gruppe muss ihm ein Lied singen. | musik

§ #st_stadt welt ort:stadt
Die Gruppe erreicht die Hauptstadt. Hunderte Menschen, tausend Möglichkeiten.
< Stadtabenteuer | l+5 s+4 t-4 | Diebesgilden, Händler, Intrigen am Hof. Ein ganzer Abend nur in der Stadt. | krone
> Nur Vorräte kaufen | t+6 s-2 | Kurz rein, kurz raus. Zwei Spieler sind enttäuscht.

§ #st_gilde npc ort:stadt
Die Diebesgilde von {ort} bietet {held} eine Mitgliedschaft an.
< Annehmen | s+6 m+4 l+2 +gilde >>st_gilde2 | {held} bekommt einen Geheimnamen: „Schatten Nr. 7“. | nacht
> Ablehnen | l+3 s-2 | Die Gilde ist beleidigt. Ab jetzt fehlen ständig Kleinigkeiten.

§ #st_gilde2 npc kette wenn:gilde
Die Diebesgilde verlangt einen Gefallen: Ein Bild aus dem Palast stehlen.
< Der große Coup | W14 s+8 t+5 ? m+6 : tod | Der Einbruch gelingt spektakulär! Ezekiel wäre stolz. :: Die Wachen waren gewarnt. | ausruf
> Austreten | l+4 s-4 -gilde | Die Gilde lässt {held} ziehen. Mit einem Messer im Tisch als Abschiedsgeschenk.

§ #st_gericht npc ort:stadt
{held} steht vor Gericht. Der Vorwurf: // Hühnerdiebstahl.
< Verteidigungsrede | W12 l+6 s+6 ? : m-4 | Die Rede ist so gut, dass das Huhn freigesprochen wird. Wie auch immer das geht. :: Verurteilt zu drei Tagen Pranger. | federn
> Flucht aus dem Saal | t+8 s+5 l-5 | Ein Sprung durchs Fenster! Jetzt ist die ganze Gruppe gesucht. | glocke

§ #st_markt npc ort:markt
Ein Händler verkauft „garantiert echte“ Drachenschuppen-Rüstung.
< Kaufen | m+6 l-4 W10 ? : m-6 | Sie ist echt! Unglaublich! :: Sie ist aus bemalter Pappe. Im Regen löst sie sich auf. | gold
> Prüfen lassen | l+5 t-3 | Ein Zwerg prüft: Fälschung. Der Händler ist verschwunden.

§ #st_bad welt
Die Helden gönnen sich einen Tag im Badehaus.
< Entspannungs-Session | s+5 t-8 alle+4 | Ein ganzer Abend nur Gespräche, Gerüchte und Seifenblasen. | wellen
> Ein Attentat! | t+8 s+4 m+2 | Mitten im Dampfbad greifen Assassinen an. Nackt und mit Handtüchern wird gekämpft! | schwerter

§ #zf_wetter wuerfel
Zufallstabelle Wetter: Es regnet Frösche.
< Ernst nehmen | l+3 s+4 | Ein Zeichen! Ein Gott ist unzufrieden. Die Gruppe forscht nach. | regen
> Frösche essen | s+8 l-4 | Der Halbling brät Froschschenkel. Erstaunlich lecker. | lachen

§ #zf_begegnung wuerfel
Zufallsbegegnung: Ein einzelner, sehr kleiner Goblin mit einem sehr großen Schwert.
< Kampf | m+4 s+3 | Der Goblin wird besiegt. Das Schwert ist ein Erbstück! | schwerter
> Mitnehmen | s+8 l-2 +goblinfreund | Der Goblin heißt Snorfi und will ein Held werden. | herzen

§ #zf_haendler wuerfel
Zufallsbegegnung: Ein fahrender Händler – der einzige Händler weit und breit, der Heiltränke hat. Zu Wucherpreisen.
< Zahlen | m+5 l+2 s-3 | Teuer, aber nötig. Die Gruppe ist pleite, aber am Leben. | gold
> Feilschen | W12 ? m+5 s+3 : s-3 | Halber Preis! :: Er verdoppelt den Preis aus Trotz.

§ #zf_nebel wuerfel ort:geister
Zufallsbegegnung: Dichter Nebel. Darin: eine Stimme, die nach {held} ruft.
< Folgen | W12 s+6 ? m+3 : tod | Es ist ein Geist, der einen Schatz verrät. :: Es ist ein Irrlicht. | geister
> Ignorieren | l+3 t+2 | Die Stimme wird lauter. Dann still. Unheimlich still. | nebel

§ #zf_feier wuerfel
Zufallsbegegnung: Eine Elfenhochzeit im Wald. Die Gruppe ist eingeladen.
< Mitfeiern | s+8 t-6 | Die Feier dauert – wie bei Elfen üblich – sieben Jahre. Oder fühlt sich so an. | musik
> Höflich ablehnen | l+3 t+3 | Die Elfen sind enttäuscht, schenken aber jedem eine Blume.

§ #k_weise1 npc kette
Ein alter Weiser bietet an, {held} das Geheimnis der Macht zu lehren. Es dauert drei Wochen.
< Lernen | m+8 t-6 >>k_weise2 | {held} zieht sich in die Berge zurück. | magie
> Keine Zeit | t+3 | Der Weise zuckt mit den Schultern. „Die Jugend.“

§ #k_weise_start npc
Ein alter Mann am Wegesrand bittet um ein Stück Brot.
< Brot geben | s+3 l+3 >k_weise1 | Der Alte lächelt. Seine Augen funkeln. Das war kein gewöhnlicher Bettler. | sonne
> Weitergehen | t+3 s-2 | Hinter euch hört ihr ein leises Lachen. Seltsam.

§ #k_weise2 npc kette
{held} kehrt aus der Lehre zurück. Etwas hat sich verändert.
< Neue Kraft zeigen | m+8 s+5 lvl | {held} spaltet einen Felsen mit einem Fingerschnippen. Der Tisch johlt. | explosion
> Der Weise war ein Betrüger | s+6 l-3 m-3 | Drei Wochen Gemüse schälen. Aber {held} kann jetzt sehr gut Kartoffeln schälen. | lachen

§ #k_ei1 spieler
{held} findet ein riesiges, warmes Ei in einer Höhle.
< Mitnehmen | s+5 l+2 +ei >>k_ei2 | Das Ei wird in Decken gewickelt. {name} streichelt es ständig. | herzen
> Liegen lassen | l+3 | Als die Gruppe geht, hört sie ein Knacken hinter sich.

§ #k_ei2 spieler kette wenn:ei
Das Ei bekommt Risse! Etwas schlüpft.
< Ein Babydrache! | s+10 m+5 l-4 +drachenbaby | Er hält {held} für seine Mutter. Er niest Funken. | drache
> Ein Huhn. | s+8 l+2 | Ein sehr großes Huhn. Es heißt jetzt General Gackerich II. | federn

§ #k_ei3 spieler wenn:drachenbaby
Der Babydrache der Gruppe ist gewachsen. Er passt kaum noch durch Türen und frisst Kühe.
< Behalten | m+10 l-5 s+4 | Er wird zum Reittier. Fliegende Helden! | drache
> In die Freiheit | s+5 l+4 t-3 | Ein tränenreicher Abschied auf einem Berggipfel. Er dreht noch eine Runde zum Gruß. | traenen

§ #k_fluch1 sl
{held} berührt ein verfluchtes Amulett. Ein Fluch legt sich über den Helden.
< Fluch wirkt sofort | l+4 m-5 s+4 +fluch >>k_fluch2 | {held} kann nur noch rückwärts sprechen. „!efliH“ | magie
> Rettungswurf | W13 ? s+3 : m-5 +fluch >>k_fluch2 | Glück gehabt: Der Fluch prallt ab. :: Der Fluch sitzt. Er wird sich zeigen. | magie

§ #k_fluch2 sl kette wenn:fluch
Der Fluch auf {held} wird stärker. Nachts verwandelt sich der Held in einen Frosch.
< Heilmittel suchen | l+5 t+3 -fluch | Eine Quest zur Hexe im Moor. Am Ende: ein Kuss, ein Plopp, ein Held. | herzen
> Mit dem Fluch leben | s+8 l-4 | Nachts gibt es jetzt einen Frosch in der Gruppe. Er ist erstaunlich nützlich. | lachen

§ #k_wette1 spieler
{name} wettet mit {npcN}: Wenn die Gruppe {schurkeN} besiegt, bekommt sie ein Schloss.
< Wette gilt | s+6 m+3 +wette >>>k_wette2 | Handschlag. Zeugen. Ein Schloss steht auf dem Spiel! | gold
> Keine Wetten | l+3 s-2 | „Wir sind Profis.“ – „Seit wann?“

§ #k_wette2 npc kette wenn:wette
{npc} erinnert die Gruppe an die Wette – und hat das Schloss schon renovieren lassen. Für sich selbst.
< Betrug! | t+5 s+5 W12 ? m+5 : s-4 | Ein Duell um das Schloss! Gewonnen! :: Der bessere Anwalt sitzt leider auf der anderen Seite. | schwerter
> Es war nur Spaß | l+3 s+2 -wette | Alle lachen. Nur {npcN} nicht. Die Vorhänge waren schon gekauft.

§ #k_rivale1 npc
Eine rivalisierende Heldengruppe taucht auf: „Die Glorreichen Vier“. Sie sind besser ausgerüstet.
< Rivalität! | s+6 t+4 +rivalen >>>k_rivale2 | Ab jetzt ist es ein Wettlauf. Wer schafft {schurkeN} zuerst? | ausruf
> Zusammenarbeit | l+4 m+4 s-2 | Gemeinsam sind sie stark. Aber die anderen nehmen den Ruhm. | herzen

§ #k_rivale2 npc kette wenn:rivalen
„Die Glorreichen Vier“ haben den Dungeon vor euch geplündert. Nur ein Zettel: „Zu langsam!“
< Rache! | m+4 t+6 s+4 | Die Gruppe sabotiert die Rivalen beim nächsten Abenteuer. Herrlich kindisch. | lachen
> Sie geraten in Gefahr | l+4 s+5 W12 ? -rivalen m+4 : tod | Die Rivalen sind gefangen. Die Gruppe rettet sie. Jetzt sind sie Freunde. :: Die Rettung kostet einen Helden. | herzen

§ #tr_bierkrieg chaos trash
{name} lässt {held} der Nachbartaverne den Krieg erklären. Grund: Das Bier ist zu warm.
< Bierkrieg! | s+10 l-8 t+5 | Katapulte mit Fässern, Schlachtrufe, ein Waffenstillstand bei Freibier. | explosion
> Diplomatie | l+4 s+2 | Ein Friedensvertrag: Kalte Krüge für alle. | konfetti

§ #tr_pferd spieler trash
{name}: „{held} heiratet {h_sein} Pferd.“
< Hochzeit! | s+10 l-10 | Das Pferd trägt Schleier. Der Priester ist ratlos. Alle weinen vor Lachen. | herzen
> Das Pferd lehnt ab | s+8 l-2 | Das Pferd schüttelt den Kopf und galoppiert davon. Herzschmerz. | traenen

§ #tr_mond welt trash
Die Gruppe entdeckt: Der Mond ist ein Ei. Und es bekommt Risse.
< Plot daraus machen | l-8 s+6 t+5 | Die neue Kampagnen-Bedrohung: Mondküken. | ausruf
> Es war ein Traum | l+6 s-4 | Ein Ei. Ein Traum. Ein Frühstück. | zzz

§ #tr_sprechender spieler trash
{held} hat einen sprechenden Stein gefunden. Er sagt nur „Hallo“. Immer wieder.
< Der Stein wird Gefährte | s+8 l-4 | „Hallo.“ – „Hallo, Stein.“ – „Hallo.“ Ein Running Gag ist geboren. | lachen
> In den Fluss werfen | s-2 l+3 | „Hallooo…“ *platsch*. Stille. Manche vermissen ihn. | wellen

§ #tr_barde chaos trash
{name} will den nächsten Endgegner mit einem Rap-Battle besiegen.
< Würfel auf Darbietung | W14 s+12 l-6 ? m+3 : s-4 | Die Reime sind so hart, dass der Lich zu Staub zerfällt. :: Der Lich rappt zurück. Besser. Viel besser. | musik
> Kein Rap | l+4 laune-8 | {name} murmelt den Rest des Abends Reime vor sich hin.

§ #tr_zeitreise welt trash
Die Gruppe wird in die Zeit zurückgeschleudert. Vor 1000 Jahren. Mit Wikingern. Und einem T-Rex.
< Mitspielen | s+10 l-10 t+5 | Der T-Rex wird gezähmt. Die Wikinger sind beeindruckt. Die Geschichte ist komplett zerstört. | portal
> Sofort zurück | l+5 s-3 | Nur ein Flackern. Ein Wikingerhelm bleibt zurück. | portal

§ #hr_hardcore sl nurhr:hardcore
Hausregel „Tod ist Tod“: {held} liegt bei null Trefferpunkten. Keine Wiederbelebung möglich.
< Regel ist Regel | l+6 tod s-4 | {held} stirbt. Endgültig. Der Tisch schweigt. Respekt. | schaedel
> Rettungswurf | W12 ? s+6 : tod | {held} schafft den Wurf! Mit einem Trefferpunkt! :: Die Würfel haben gesprochen. | wuerfelregen

§ #hr_trash welt nurhr:trash trash
Trash-Modus: Ein Bus fährt durch das mittelalterliche Dorf. Niemand weiß, warum.
< Einsteigen | s+12 l-12 t+6 | Der Bus fährt zu einem Konzert. Danach fährt er nie wieder. | lachen
> Ignorieren | l+2 s+3 | Der Bus hupt beleidigt und verschwindet im Nebel. | nebel

§ #hr_wuerfel wuerfel nurhr:wuerfel
Nur die Würfel entscheiden: Ein einziger W20 bestimmt den Ausgang der ganzen Szene.
< Würfeln | W10 s+4 ? m+6 : m-6 | Die Würfel lieben euch. :: Die Würfel hassen euch. | wuerfelregen
> Zweimal würfeln | W14 s+6 ? m+8 lvl : tod2 | Volles Risiko, volle Belohnung! :: Volles Risiko, volles Pech. | wuerfelregen

§ #pl_spaetstart tisch wenn:sess>3
Die Spieler kennen sich inzwischen so gut, dass sie Insider-Witze aus früheren Sessions erzählen.
< Mitlachen | s+8 t-4 alle+4 | „Weißt du noch, das Huhn?“ – Alle lachen fünf Minuten. | lachen
> Zurück zum Plot | t+4 l+3 | „Okay, okay – wo waren wir?“

§ #pl_bossvorbote schurke wenn:akt=3
Die Helden spüren es: Die letzte Schlacht naht. {schurke} sammelt Armeen.
< Kriegsrat halten | l+5 t-4 m+3 | Bündnisse werden geschmiedet, Pläne geschmiedet, Waffen geschmiedet. Viel Schmieden. | schwerter
> Direkt angreifen | t+8 m+4 W12 ? s+5 : tod | Ein Überraschungsangriff auf die Vorhut! Erfolg! :: Eine Falle. | schwerter

§ #pl_akt2 sl wenn:akt=2
Mitte der Kampagne. Die Geschichte braucht eine Wendung.
< Ein Verbündeter stirbt | s-5 l+5 t+4 | {npc} stirbt in den Armen von {held}. Die Gruppe schwört Rache. | schaedel
> Ein neuer Verbündeter | s+5 m+4 | Ein mysteriöser Fremder schließt sich an. Er weiß zu viel. | ausruf

§ #pl_akt1 sl wenn:akt=1
Die Gruppe hat noch keine Ahnung, wer {schurkeN} ist. Zeigst du den Schurken schon jetzt?
< Ja, ein Auftritt | s+5 t+4 l-2 | {schurke} zeigt sich kurz auf einem Turm. Blitze zucken. Gänsehaut. | blitz
> Nein, Mysterium | l+5 t-3 | Nur Gerüchte. Schatten. Ein Name, der geflüstert wird.

§ #ex_pain1 sl
Die Gruppe hat seit drei Sessions keinen Erfolg gehabt. Jeder Plan scheitert.
< Ein Sieg gönnen | s+8 m+5 l-3 | Endlich gelingt etwas! Jubel am Tisch! | konfetti
> Durchhalten lassen | s-8 l+5 m-3 | Noch ein Rückschlag. Die Stimmung ist düster. Aber der Sieg wird süßer sein. | regen

§ #ex_pain2 spieler
{name} ist genervt: „Unsere Helden verlieren immer. Ich hab keine Lust mehr.“
< Leichtere Gegner | s+6 m+6 l-3 laune+10 | Ein paar Goblins zum Verprügeln. Therapie. | schwerter
> „Das ist Teil der Geschichte“ | s-6 l+5 laune-10 | {name} verschränkt die Arme. Vielleicht kommt die Wende noch.

§ #ex_pain3 tisch
{name} hatte einen furchtbaren Tag und braucht heute einfach nur Spaß.
< Leichte Session | s+8 t+3 l-4 alle+4 | Ein albernes Abenteuer mit einem tanzenden Bären. Genau das Richtige. | musik
> Normal weiterspielen | l+4 s-6 alle-3 | Die geplante düstere Szene kommt. Es war nicht der richtige Abend.

§ #ex_pain4 sl
Du bemerkst, dass die Spieler sich sichtlich quälen: Die Kampagne ist zu düster geworden.
< Ein Lichtblick | s+10 l-3 | Ein Dorffest, ein geretteter Esel, ein lachender Zwerg. Atmen. | sonne
> Die Dunkelheit ist das Thema | s-8 l+6 | Es bleibt düster. Wer durchhält, wird es nie vergessen. | nacht

§ #ex_pain5 welt
Eine Seuche, ein Krieg, eine Hungersnot – alles gleichzeitig in {ort}.
< Hoffnung zeigen | s+5 l-3 m+3 | Die Gruppe organisiert Hilfe. Die Leute jubeln ihnen zu. | herzen
> Elend zeigen | s-8 l+6 t-3 | Die Gruppe sieht das Leid. Es verändert sie. Und den Tisch. | traenen

§ #ex_pain6 npc
{npc} bittet die Gruppe flehentlich um Hilfe – aber sie hat keine Zeit.
< Trotzdem helfen | s+4 t-6 l+3 | Die Zeit fehlt am Ende. Aber das Herz war am rechten Fleck. | herzen
> Weiterziehen | s-6 t+5 | {npcN} wird später nie wieder gesehen. Das wird nachhallen. | traenen

§ #ex_pain7 spieler
{name} hat schlecht geschlafen und ist gereizt. Jede Kleinigkeit nervt.
< Rücksicht nehmen | s+3 t+3 laune+10 | Du gibst {held} heute einen großen Moment. Die Laune steigt. | sonne
> Weiterspielen | s-5 laune-8 | {name} seufzt bei jedem Wurf.

§ #ex_pain8 sl
Die Gruppe streitet, ob sie den gefangenen Banditen hinrichten soll.
< Moraldebatte | l+6 s-6 t-6 | 30 Minuten Philosophie. Niemand ist zufrieden. Aber alle denken nach.
> Der Bandit entkommt | t+5 s+2 l-3 | Während der Debatte entkommt er. Problem gelöst. Irgendwie.

§ #ex_ernst sl wenn:s>70
Die Stimmung ist ausgelassen. Willst du eine ernste Szene einstreuen?
< Ein Verlust | s-10 l+6 | {npc} stirbt. Plötzlich ist alles still. | schaedel
> Albern bleiben | s+4 l-3 | Die Party geht weiter. Ein Oger tanzt Polka. | musik

§ #ex_regelstreit regel
{name} weigert sich weiterzuspielen, bis geklärt ist, ob Pfeile im Regen schlechter fliegen.
< Ausdiskutieren | l+6 s-8 t-6 laune+10 | 25 Minuten. Ergebnis: Ja, Nachteil. Niemand ist glücklich. | regen
> Machtwort | s+2 t+4 laune-12 | „Pfeile fliegen normal.“ {name} schreibt es in {sein} Beschwerdebuch.

§ #ex_tpkgefahr sl wenn:m<35
Die Gruppe ist stark angeschlagen und läuft in einen Hinterhalt.
< Gnadenlos | W13 s-4 ? m+5 : tpk | Mit letzter Kraft überleben alle! Legendär! :: Niemand überlebt. Ein neuer Anfang. | schaedel
> Ein Retter | m+6 l-5 s+3 | Die Stadtwache kommt im letzten Moment. Etwas zu passend. | glocke

§ #ex_langweile spieler wenn:t<40
{name} gähnt so laut, dass alle es hören.
< Tempo! | t+10 s+3 | Ein Erdbeben, ein Drache, eine Verfolgungsjagd! Alle sind wach. | erdbeben
> Ignorieren | t-3 s-5 laune-8 | Das Gähnen ist ansteckend. Bald gähnt der ganze Tisch.

§ #ex_hektik spieler wenn:t>65
{name}: „Moment, Moment! Wo sind wir? Was ist passiert? Wer ist der Typ?“
< Zusammenfassen | t-10 l+4 laune+5 | Du fasst zusammen. Erleichterung am Tisch.
> Weiter, weiter! | t+5 s+2 laune-8 | {name} gibt auf und würfelt einfach mit.

§ #ex_op spieler wenn:m>70
{name}: „Ehrlich gesagt ist es langweilig, wenn wir alles mit einem Schlag töten.“
< Härtere Gegner | m-10 s+4 | Ein Kampf, bei dem alle zittern. Endlich wieder Spannung! | treffer
> „Genießt es“ | m+4 s-4 laune-6 | Noch ein Gegner explodiert beim Hinsehen. Gähn.

§ #ex_schwach spieler wenn:m<35
{name}: „Mein Held kriegt nichts gebacken. Ich hab das Gefühl, ich würfle nur Fehlschläge.“
< Magischer Fund | m+10 l-3 laune+10 | {held} findet {item}. Endlich! | gold
> Training-Montage | m+6 t-5 | Eine Woche Training im Spiel. {held} wird stärker. Langsam. | schwerter

§ #ex_logik spieler wenn:l<35
{name}: „Wartet, wieso kann der Bürgermeister fliegen? Das ergibt doch keinen Sinn.“
< Erklärung erfinden | l+8 s-2 | „Er hat einen magischen Hut.“ – „Seit wann?“ – „Schon immer.“
> „Ist halt so“ | l-4 s+4 laune-6 | Der fliegende Bürgermeister bleibt ein Mysterium.

§ #ex_buerokratie spieler wenn:l>70
{name}: „Müssen wir wirklich für jede Stadt einen Passierschein beantragen?“
< Regel kippen | l-10 t+5 s+3 laune+6 | Die Passierscheine sind abgeschafft. Jubel! | konfetti
> „Ja, es ist realistisch“ | l+4 s-6 laune-8 | Das Formular hat 14 Seiten. Auf Elfisch.

§ #mt_regen tisch
Es ist Sonntagnachmittag. Draußen regnet es. Ihr könntet einfach den ganzen Tag spielen.
< Marathon-Session | t-8 s+6 m+3 lvl | Zehn Stunden! Drei Pizzen! Alle steigen auf! | pizza
> Normal lange | t+3 | Nach vier Stunden gehen alle zufrieden heim.

§ #mt_absage tisch
Zwei Spieler sagen kurzfristig ab. Nur noch die Hälfte ist da.
< Nebenquest mit den Anwesenden | s+5 l-2 t+3 | Ein kleines Abenteuer für die, die da sind. Sehr gemütlich.
> Brettspielabend | s+4 t-6 alle-3 | Ihr spielt was anderes. Es wird lustig, aber die Kampagne pausiert.

§ #mt_snack tisch
Jemand hat selbstgemachte Würfel-Kekse mitgebracht. Mit Augen aus Schokolinsen.
< Keks-Würfeln | s+8 l-3 | Wer seinen Keks würfelt, muss ihn essen. Es gibt viele kritische Treffer. | konfetti
> Normale Würfel | l+3 s+2 | Die Kekse werden in der Pause gegessen.

§ #mt_handyverbot tisch
Du überlegst, ein Handyverbot am Tisch einzuführen.
< Handykorb! | l+4 t+4 s-4 alle-4 | Die Handys liegen im Korb. Konzentration! Und Entzugserscheinungen.
> Freiheit | s+3 t-4 | Die Handys bleiben. Es werden viele Memes gezeigt.

§ #mt_kostuem tisch
Alle sind heute verkleidet gekommen. Es ist Fasching.
< Faschings-Session | s+10 l-6 | Die Helden spielen heute ihre Spieler. Meta-Chaos. | konfetti
> Normal spielen | l+3 s+3 | Ein Pirat, eine Hexe und ein Hotdog spielen ernsthaft weiter.

§ #mt_neues tisch
Ein Spieler hat neue, wunderschöne Metallwürfel gekauft. Sie sind schwer wie Steine.
< Einweihen! | s+6 | Der erste Wurf: eine 20! Die Würfel sind gesegnet. | wuerfelregen
> Vorsicht, der Tisch! | s+3 l+2 | Ein Würfel hinterlässt eine Delle im Tisch. Für immer.

§ #mt_karte tisch
Du hast eine 3D-Karte aus Pappmaché gebaut. Sie nimmt den halben Tisch ein.
< Grandios! | s+8 l+3 t-4 | Alle staunen. Die Miniaturen stehen auf echten Bergen. | konfetti
> Zu groß | t+3 s-2 | Die Karte wird auf den Boden verbannt. Die Katze schläft darin.

§ #gk_wiedergeburt gott wenn:tote>0
{gott} bietet an, {tot} wiederzubeleben – im Tausch gegen einen Dienst.
< Annehmen | m+5 l-4 s+5 | {tot} lebt! // Schuldet jetzt aber einem Gott einen Gefallen. | sonne
> Ablehnen | l+5 s-3 | „Der Tod gehört zum Leben.“ Weise. Traurig.

§ #gk_prophet gott
{gott} spricht durch einen Bettler: „Der Verräter sitzt an eurem Tisch.“
< Paranoia! | s+6 l+3 t-4 | Jeder verdächtigt jeden. Großartig. | ausruf
> Es meint den Wirt | s+4 l-2 | Der Wirt war es. Er hat das Bier verwässert. Skandal!

§ #gk_segen gott
{gott} segnet die Gruppe. Jeder bekommt einen Wunsch.
< Wünsche erfüllen | m+8 s+5 l-5 | Ein Held wünscht sich einen unendlichen Bierkrug. Ein Held wünscht sich Weisheit. Einer wünscht sich einen Hut. | funkeln
> Mit Haken | l+5 s+5 m+3 | Jeder Wunsch hat eine kleine Nebenwirkung. Der Hut singt. | magie

§ #gs_alteRunde gast wenn:legende
Ein Spieler aus einer früheren Runde ruft an: „Spielt ihr noch in der Welt mit {legende}?“
< Gastauftritt | s+6 l+4 | {legende} erscheint als alter Mentor. Die Neuen staunen. | krone
> „Andere Zeiten“ | l+3 s-2 | Die alten Geschichten bleiben Geschichten.

§ #wd_rezept welt
In {ort} gibt es ein Kochturnier. Der Preis: {item}.
< Teilnehmen | s+6 m+3 W11 ? m+3 : s-2 | Die Pilzpfanne der Gruppe gewinnt! Friedrich wäre stolz. :: Die Suppe war versalzen. | feuer
> Zuschauen | s+3 t-3 | Ein Troll gewinnt mit Steinsuppe. Sie schmeckt überraschend gut.

§ #wd_tier welt
Ein riesiger Hirsch mit goldenem Geweih erscheint auf einer Lichtung.
< Ihm folgen | l+3 s+5 t+3 | Er führt die Gruppe zu einer verborgenen Quelle der Heilung. | heilung
> Jagen | W14 m+5 l+2 ? s-3 : tod | Der Hirsch fällt. Der Wald trauert. Ein Fluch liegt nun über euch. :: Der Hirsch wehrt sich. Heftig. | ranken

§ #wd_wolf welt ort:nacht
In der Nacht heulen Wölfe ums Lager. Viele Wölfe.
< Feuer schüren | l+4 t-3 | Die ganze Nacht Wache, das Feuer hoch. Am Morgen sind die Wölfe weg. | feuer
> Ein Druide spricht mit ihnen | W12 s+6 ? m+3 : tod2 | Die Wölfe werden Verbündete! :: Der Leitwolf verstand nur „Futter“. | nacht

§ #wd_vulkan welt
Ein Vulkan bricht in der Nähe von {ort} aus.
< Flucht! | t+10 W11 s+4 ? : tod2 | Eine wilde Flucht vor der Lava! Alle schaffen es! :: Einer war zu langsam. | feuer
> Den Feuerdämon stellen | W15 m+8 s+6 ? lvl : tpk | Der Feuerdämon wird zurückgedrängt. Legenden! :: Lava. // Viel Lava. | explosion

§ #rb_neueEdition regelbuch
Eine neue Edition des Regelwerks ist erschienen. Alles ist anders.
< Umsteigen | l+6 t-6 m-3 alle-2 | Neue Bögen, neue Regeln, neues Chaos. Zwei Sessions Eingewöhnung. | staub
> Bei der alten bleiben | l-2 s+3 | „Never change a running system.“

§ #rb_kritkarte regelbuch
Jemand bringt Kritische-Treffer-Karten mit: Jeder Krit zieht eine Karte mit besonderem Effekt.
< Einführen | s+8 l-3 m+3 | „Du schlägst dem Ork den Helm über die Augen.“ Wunderbar! | schwerter
> Nein danke | l+3 s-1 | Die Karten liegen im Regal neben dem Kompendium.
`);
