/* =====================================================================
   BARRADINS GOLDENE KEHLE – Liederbuch und Tournee
   ---------------------------------------------------------------------
   Hier stehen alle Lieder und die Stationen der Tournee. Das Spiel selbst
   (Mikrofon, Notenbahn, Wertung) steckt in kehle.js.

   NEUES LIED (z. B. nach einer Sitzung): einfach HINTEN in „lieder“ anhängen
   und – wenn es einen Auftrittsort gibt – hinten in „weg“ eine Station.
   Nie dazwischen einfügen: die Sterne werden nach Reihenfolge gespeichert.

   So ist ein Lied aufgebaut:
     takt   3 oder 4 (Schläge pro Takt)     bpm   Tempo
     modus  "dur" oder "moll"                stil  ballade · polka · marsch · walzer · harfe · hymne
     teile  Melodien, je Zeile „Muster: Töne“
            Töne sind Stufen der Tonleiter: 1 = Grundton … 7, ' = Oktave höher, , = tiefer,
            # / b davor = halber Ton höher/tiefer. Ein Ton pro Silbe.
     folge  welcher Teil mit welchem Text kommt. Silben mit | trennen.
   Muster (Rhythmus, Silbenzahl):
     4/4: j8 j9 j10 j11 (Jambus, Auftakt) · j7f · t7 t8 (Trochäus, betont vorn)
     3/4: w8 w9 (Jambus) · w11 w12 (Walzer-Daktylus) · w8a · wt7 wt8 (Trochäus)
   Die Begleitung (Akkorde) sucht sich das Spiel selbst passend zur Melodie.
   ===================================================================== */
window.KEHLE_LIEDER = {
  lieder: [
    /* ---------- 1 · Neverwinter ---------- */
    {
      id: "brief", grad: 1, takt: 4, bpm: 108, modus: "dur", stil: "ballade",
      titel: { de: "Der Brief mit Zwergensiegel", en: "The Letter with the Dwarven Seal" },
      teile: {
        V: ["j9: 1 3 3 4 5 5 4 3 3", "j9: 1 3 3 4 5 6 5 2 2", "j8: 5 5 6 5 4 3 4 5", "j8: 5 4 3 2 3 2 7, 1"],
        C: ["t8: 1 3 5 5 6 5 4 3", "t7: 5 5 4 3 2 2 1", "t8: 1 3 5 5 6 5 4 3", "t7: 2 2 4 3 2 7, 1"]
      },
      folge: [
        ["V", ["Ein Brief kam an mit Zwer|gen|sie|gel,", "ich las ihn zwi|schen Krug und Spie|gel:", "„Am Ha|fen, wo die Mö|wen schrein,", "da sollt ihr reich und Hel|den sein!“"]],
        ["C", ["Ei|ne Schmie|de, alt und ma|gisch,", "und ein Lohn, der Hel|den lockt!", "E|cho grinst so|gar – wie tra|gisch,", "sonst nur mür|risch, stur, ver|stockt."]],
        ["V", ["Da stand ein Wald|mann samt dem Hun|de,", "ein Horn|kopf mit Ge|wit|ter|mun|de,", "ein Dar|kin, rot und re|gungs|los –", "und ich? Na ja, ich war fa|mos."]],
        ["C", ["Ei|ne Schmie|de, alt und ma|gisch,", "und ein Lohn, der Hel|den lockt!", "E|cho grinst so|gar – wie tra|gisch,", "sonst nur mür|risch, stur, ver|stockt."]]
      ]
    },
    /* ---------- 2 · Die Straße nach Phandalin ---------- */
    {
      id: "goblin", grad: 1, takt: 4, bpm: 138, modus: "dur", stil: "polka",
      titel: { de: "Goblin, kleiner Wicht", en: "Goblin, Little Wretch" },
      teile: {
        V: ["j8: 1 3 3 5 5 6 5 3", "j8: 4 4 3 2 2 7, 1 2", "j8: 1 3 3 5 5 6 5 1'", "j8: 7 6 5 4 2 7, 2 1"],
        C: ["t7: 5 3 5 3 5 6 5", "t7: 4 4 4 2 4 3 2", "t8: 5 3 5 3 5 6 7 1'", "t8: 4 4 2 2 5 5 7, 1"]
      },
      folge: [
        ["V", ["Ein Kar|ren rollt nach Phan|da|lin,", "da liegt ein Wa|gen quer – und hin.", "Aus Bü|schen springt die grü|ne Brut", "mit Zäh|nen schief und Hirn wie Sud."]],
        ["C", ["Gob|lin, Gob|lin, klei|ner Wicht,", "dein Ge|sicht – ein Schund|ge|dicht!", "Schief und grün und vol|ler Ris|se,", "und dein A|tem riecht nach Pis|se!"]],
        ["V", ["Wir hau'n da|ne|ben, al|le vier,", "mit Ü|ber|zeu|gung, glaubt es mir.", "Doch Rex beißt zu und Fried|rich trifft,", "und E|cho zau|bert Eis und Gift."]],
        ["C", ["Gob|lin, Gob|lin, klei|ner Wicht,", "dein Ge|sicht – ein Schund|ge|dicht!", "Schief und grün und vol|ler Ris|se,", "und dein A|tem riecht nach Pis|se!"]],
        ["V", ["Ge|fang|ne Wöl|fe jau|len laut,", "wir schnei|den los, was Gob|lin klaut.", "Dann rein ins Nest, mal still, mal nicht –", "der Boss kriegt Stahl ins An|ge|sicht."]],
        ["C", ["Gob|lin, Gob|lin, klei|ner Wicht,", "dein Ge|sicht – ein Schund|ge|dicht!", "Schief und grün und vol|ler Ris|se,", "und dein A|tem riecht nach Pis|se!"]]
      ]
    },
    /* ---------- 3 · Schloss Crackmore ---------- */
    {
      id: "glasstab", grad: 2, takt: 3, bpm: 160, modus: "moll", stil: "walzer",
      titel: { de: "O Glasstab, du Glied", en: "Oh Glasstaff, You Tool" },
      teile: {
        V: ["w12: 1 1 3 2 1 5 4 3 2 3 4 3", "w12: 1 1 3 2 1 5 4 3 2 1 #7, 1", "w12: 5 5 6 5 4 3 4 5 4 3 2 5", "w12: 5 4 3 2 1 2 3 4 3 2 #7, 1"],
        C: ["w11: 5 1' 7 6 5 6 7 1' 7 6 5", "w11: 5 1' 7 6 5 4 3 4 5 6 5", "w11: 5 1' 7 6 5 6 7 1' 7 1' #7", "w11: 5 1' 5 3 4 3 2 3 2 #7, 1"]
      },
      folge: [
        ["V", ["Ein Ka|nin|chen, ein Busch und der Rex hin|ter|her –", "und da lag er, der Tun|nel: Wer braucht schon ein Heer?", "Und wir zo|gen uns Ro|ben der Fein|de ans Fell,", "nur E|ze|kiel war auch oh|ne Ro|be schon grell."]],
        ["C", ["O Glas|stab, du Glied, du ver|glas|ter, du Wicht,", "dein Stab ist aus Glas, doch dein Rück|grat ist's nicht!", "Man sieht dir durchs Hirn bis zum Hin|tern hin|durch,", "du Glas|kol|ben|furz, du La|bor|rat|ten|lurch!"]],
        ["V", ["Doch ich stieß an ein Glas, und es klirr|te im Raum,", "und da stand er, der Glas|stab – ein Alb|traum mit Flaum.", "„Wir sind neu|e Re|kru|ten!“ – Er schluck|te es glatt,", "denn das Hirn hin|term Glas war so dünn wie ein Blatt."]],
        ["C", ["O Glas|stab, du Glied, du ver|glas|ter, du Wicht,", "dein Stab ist aus Glas, doch dein Rück|grat ist's nicht!", "Man sieht dir durchs Hirn bis zum Hin|tern hin|durch,", "du Glas|kol|ben|furz, du La|bor|rat|ten|lurch!"]],
        ["V", ["Sei|ne Leu|te, die sof|fen sich voll, Krug um Krug,", "bis wir aus|sah'n wie zwölf – und dann war es ge|nug.", "Dann der Dolch von E|ze|kiel – der Glas|stab, er lief,", "doch ich zog ihn zu|rück: Fried|richs Pfeil, und zwar tief."]],
        ["C", ["O Glas|stab, du Glied, du ver|glas|ter, du Wicht,", "dein Stab ist aus Glas, doch dein Rück|grat ist's nicht!", "Man sieht dir durchs Hirn bis zum Hin|tern hin|durch,", "du Glas|kol|ben|furz, du La|bor|rat|ten|lurch!"]]
      ]
    },
    /* ---------- 4 · Donnerbaum ---------- */
    {
      id: "venomfang", grad: 2, takt: 4, bpm: 120, modus: "moll", stil: "marsch",
      titel: { de: "Venomfang, du Echsenfurz", en: "Venomfang, You Lizard Fart" },
      teile: {
        V: ["j8: 1 3 3 4 5 4 3 2", "j8: 2 3 4 5 4 3 2 1", "j8: 5 5 5 6 5 4 3 5", "j8: 5 4 3 2 1 #7, 2 1"],
        C: ["t7: 1' 1' 7 6 5 6 7", "t7: 6 6 5 4 3 4 5", "t7: 1' 1' 7 6 5 4 5", "t7: 4 4 3 2 #7, 2 1"]
      },
      folge: [
        ["V", ["In Don|ner|baum, im mor|schen Turm,", "da stie|gen wir hi|nauf im Sturm,", "dann kreischt es aus dem Wald he|ran:", "ein grü|ner, gif|ti|ger Ty|rann."]],
        ["C", ["Ve|nom|fang, du Ech|sen|furz,", "dei|ne Flü|gel sind zu kurz!", "Spuckst du Gift, dann spuck ich Spott –", "E|cho macht dich zu Kom|pott!"]],
        ["V", ["Das Gift traf E|cho grün und voll,", "der hus|te|te vor lau|ter Groll.", "Da sang ich, und der Dra|che sann", "und fiel in mei|nen bun|ten Bann."]],
        ["C", ["Ve|nom|fang, du Ech|sen|furz,", "dei|ne Flü|gel sind zu kurz!", "Spuckst du Gift, dann spuck ich Spott –", "E|cho macht dich zu Kom|pott!"]],
        ["V", ["Er schlug nach Fried|rich, knapp vor|bei,", "E|ze|kiels Pfeil: der Kopf ent|zwei!", "Dann stopf ich mir die Pfei|fe fein,", "und E|cho sackt die Beu|te ein."]],
        ["C", ["Ve|nom|fang, du Ech|sen|furz,", "dei|ne Flü|gel sind zu kurz!", "Spuckst du Gift, dann spuck ich Spott –", "E|cho macht dich zu Kom|pott!"]]
      ]
    },
    /* ---------- 5 · Ilvaras Feste ---------- */
    {
      id: "spinne", grad: 2, takt: 4, bpm: 132, modus: "moll", stil: "polka",
      titel: { de: "Die Spinne wird euch kriegen", en: "The Spider Will Get You" },
      teile: {
        V: ["j8: 5 5 4 3 4 5 6 5", "j8: 5 4 3 2 3 4 3 2", "j8: 5 6 6 5 4 3 4 5", "j8: 5 4 3 2 #7, 2 #7, 1"],
        C: ["j7f: 5 1' 7 6 5 4 3", "j7f: 3 4 5 6 5 4 5", "j7f: 5 1' 7 6 5 6 7", "j7f: 1' 7 6 5 4 #7, 1"]
      },
      folge: [
        ["V", ["Ein Häus|chen tief im grü|nen Wald,", "da wohnt 'ne gü|ti|ge Ge|stalt", "mit Fuchs und Spatz und Sup|pen|topf –", "dann Ne|bel, und es dröhnt der Kopf."]],
        ["C", ["„Die Spin|ne wird euch krie|gen!“,", "schreit je|de Drow im Flie|gen.", "Doch wir be|ma|len Spin|nen", "mit Pim|meln – und ge|win|nen!"]],
        ["V", ["Wir wach|ten auf, in Ket|ten, nass,", "zwei Wa|chen grins|ten vol|ler Hass.", "Doch E|cho wird zur Rat|te, klein,", "und nagt uns frei, holt Waf|fen rein."]],
        ["C", ["„Die Spin|ne wird euch krie|gen!“,", "schreit je|de Drow im Flie|gen.", "Doch wir be|ma|len Spin|nen", "mit Pim|meln – und ge|win|nen!"]],
        ["V", ["Ich schimpf' die Wa|chen bis aufs Blut,", "sie stür|men rein vor lau|ter Wut.", "Ein Dä|mon summt, die Fes|te bebt,", "Il|va|ra springt und ü|ber|lebt."]],
        ["C", ["„Die Spin|ne wird euch krie|gen!“,", "schreit je|de Drow im Flie|gen.", "Doch wir be|ma|len Spin|nen", "mit Pim|meln – und ge|win|nen!"]]
      ]
    },
    /* ---------- 6 · Der See der Kuo-Toa ---------- */
    {
      id: "ploop", grad: 3, takt: 3, bpm: 104, modus: "moll", stil: "harfe",
      titel: { de: "Klagelied für Ploopploopeen", en: "Lament for Ploopploopeen" },
      teile: {
        V: ["w9: 1 3 2 3 4 5 4 3 2", "w9: 2 3 4 5 6 5 4 3 2", "w8: 5 6 5 4 3 2 3 4", "w8: 4 3 2 1 #7, 2 #7, 1"],
        C: ["w9: 5 1' 7 6 5 6 7 1' 5", "w9: 5 6 5 4 3 4 5 3 2", "w9: 5 1' 7 6 5 6 7 1' 7", "w9: 6 5 4 3 2 2 1 #7, 1"]
      },
      folge: [
        ["V", ["Am stil|len See, wo Pil|ze glim|men,", "da hört' ich ei|ne Stim|me schwim|men.", "Ich nannt' ihn lang nur Blu|blu|pin,", "er lä|chel|te und nahm es hin."]],
        ["V", ["Er bat um Hil|fe für die Sei|nen,", "die sich mit fal|schem Gott ver|ei|nen.", "Zum Schein ge|fes|selt gin|gen wir,", "ver|trau|ten ihm – er glaub|te mir."]],
        ["C", ["O Ploop|ploo|peen, du Herr der Tie|fe,", "dir war ein fro|hes Lied ver|spro|chen.", "Wenn ich dich nur noch ein|mal rie|fe …", "Nun klingt es lei|se und ge|bro|chen."]],
        ["V", ["Der klei|ne Fa|gas fiel im Strei|te,", "der Gnom, so treu an uns|rer Sei|te.", "Dann stieg der Zwei|kopf aus dem See,", "und al|les wur|de Schutt und Weh."]],
        ["V", ["Du standst am Tem|pel, Arm' er|ho|ben,", "als rings|um Fels und Was|ser to|ben.", "Ein Fang|arm fiel, so schwer wie Blei –", "und nichts blieb üb|rig. Nichts. Vor|bei."]],
        ["C", ["O Ploop|ploo|peen, du Herr der Tie|fe,", "dir war ein fro|hes Lied ver|spro|chen.", "Wenn ich dich nur noch ein|mal rie|fe …", "Nun klingt es lei|se und ge|bro|chen."]]
      ]
    },
    /* ---------- 7 · Die Flucht über den See ---------- */
    {
      id: "friedrich", grad: 2, takt: 3, bpm: 176, modus: "dur", stil: "walzer",
      titel: { de: "Friedrich boxte einen Gott", en: "Friedrich Punched a God" },
      teile: {
        V: ["w8a: 1 3 3 4 5 5 6 5", "w8a: 5 4 4 3 2 2 7, 2", "w8a: 1 3 3 4 5 5 6 1'", "w8a: 1' 7 6 5 4 2 7, 1"],
        C: ["wt7: 5 3 5 6 5 4 3", "wt7: 4 2 4 5 4 7, 1", "wt7: 1' 1' 7 6 5 4 5", "wt7: 4 2 4 5 4 7, 1"]
      },
      folge: [
        ["V", ["Zwei Köp|fe, Ten|ta|kel, ein Schrei,", "und al|le Ma|gie war vor|bei,", "da schlot|ter|te je|dem das Knie –", "bei mir nur aus Mit|leid, sonst nie."]],
        ["C", ["Hört, ihr Leut', es ist kein Spott:", "Fried|rich box|te ei|nen Gott!", "Wir|kung null – doch das ist gleich,", "er er|zählt's in je|dem Reich!"]],
        ["V", ["Er spann|te den Bo|gen ganz cool", "und schoss auf den Gott aus dem Pfuhl.", "Der Pfeil prall|te ab wie ein Floh –", "und Fried|rich? Der war trotz|dem froh."]],
        ["C", ["Hört, ihr Leut', es ist kein Spott:", "Fried|rich box|te ei|nen Gott!", "Wir|kung null – doch das ist gleich,", "er er|zählt's in je|dem Reich!"]],
        ["V", ["Wir rann|ten, wie nie je ge|rannt,", "zum Boot an dem ret|ten|den Strand,", "und Fried|rich er|zählt es bis heut',", "und kei|ner, der's hört, ist er|freut."]],
        ["C", ["Hört, ihr Leut', es ist kein Spott:", "Fried|rich box|te ei|nen Gott!", "Wir|kung null – doch das ist gleich,", "er er|zählt's in je|dem Reich!"]]
      ]
    },
    /* ---------- 8 · Am Hof von König Horga ---------- */
    {
      id: "horga", grad: 3, takt: 3, bpm: 108, modus: "dur", stil: "hymne",
      titel: { de: "Heil dir, Horga", en: "Hail to Thee, Horga" },
      teile: {
        V: ["w9: 5 1 2 3 4 5 6 5 4", "w8: 3 4 3 2 1 7, 1 2", "w9: 5 1 2 3 4 5 6 6 5", "w8: 1' 7 6 5 4 3 2 1"],
        C: ["wt8: 1' 7 6 5 6 7 1' 5", "wt8: 6 6 5 4 3 4 5 5", "wt8: 1' 7 6 5 6 7 1' 1'", "wt8: 6 5 4 3 2 3 1 1"]
      },
      folge: [
        ["V", ["O Kö|nig Hor|ga, Stahl der Fünf|te,", "dein Thron aus Fels, dein Wort aus Erz,", "dein Bart wiegt mehr als hun|dert Zünf|te,", "und un|ter Stahl schlägt Gold – dein Herz!"]],
        ["C", ["Heil dir, Hor|ga, Herr der Hal|len,", "Ham|mer, Am|boss, Bart und Kro|ne!", "Mö|gen Fein|de vor dir fal|len –", "und dein Bier ist auch nicht oh|ne!"]],
        ["V", ["Wir brach|ten dir den Sohn nach Hau|se,", "den Prin|zen Kar|dal, heil und ganz.", "Er spiel|te Spä|her oh|ne Pau|se –", "ich ahnt' es. Fast. Mit E|le|ganz."]],
        ["C", ["Heil dir, Hor|ga, Herr der Hal|len,", "Ham|mer, Am|boss, Bart und Kro|ne!", "Mö|gen Fein|de vor dir fal|len –", "und dein Bier ist auch nicht oh|ne!"]],
        ["V", ["Wir sa|hen De|mo|gor|gon stei|gen,", "zwei Köp|fe, Grau|en, Schrei und Schlund.", "Wir flo|hen – und ich will nicht schwei|gen:", "Die Un|ter|welt ist nicht ge|sund."]],
        ["C", ["Heil dir, Hor|ga, Herr der Hal|len,", "Ham|mer, Am|boss, Bart und Kro|ne!", "Mö|gen Fein|de vor dir fal|len –", "und dein Bier ist auch nicht oh|ne!"]]
      ]
    },
    /* ---------- 9 · Markt der Klingen & Dorf der Riesen ---------- */
    {
      id: "gundren", grad: 2, takt: 4, bpm: 116, modus: "dur", stil: "polka",
      titel: { de: "Kennst du Gundren?", en: "Do You Know Gundren?" },
      teile: {
        V: ["j9: 1 3 3 5 5 6 5 4 3", "j9: 2 4 4 6 6 5 4 3 2", "j8: 3 5 5 5 6 5 7 1'", "j8: 5 4 3 2 3 2 7, 1"],
        C: ["t8: 1' 1' 6 5 1' 1' 6 5", "t7: 4 4 6 5 4 3 2", "t8: 1' 1' 6 5 4 4 6 5", "t7: 4 3 2 2 5 7, 1"]
      },
      folge: [
        ["V", ["Ein Händ|ler auf dem Markt der Klin|gen", "wollt' E|cho grad ein Schwert auf|zwin|gen.", "Doch E|cho fragt, ganz ernst, ganz schlicht,", "nach Gun|dren. Nein. Den kennt er nicht."]],
        ["C", ["Kennst du Gun|dren? Kennst du Gun|dren?", "Zwerg mit Bart und schwar|zem Haar!", "Kennst du Gun|dren? Kennst du Gun|dren?", "Nein? Na gut. Dann nächs|tes Jahr!"]],
        ["V", ["Im Rie|sen|dorf bei Stein und Kar|ren", "da blieb ein Rie|se bei uns har|ren.", "Der Rie|se schaut sehr lang hi|nab", "und strei|chelt Rex. Die Ant|wort? Knapp."]],
        ["C", ["Kennst du Gun|dren? Kennst du Gun|dren?", "Zwerg mit Bart und schwar|zem Haar!", "Kennst du Gun|dren? Kennst du Gun|dren?", "Nein? Na gut. Dann nächs|tes Jahr!"]],
        ["V", ["Und vor dem Dra|chen, Glut und Feu|er,", "da wird die Fra|ge rich|tig teu|er:", "Ich hielt die Luft an – und er spricht", "ganz ein|fach wei|ter. Heißt wohl: nicht."]],
        ["C", ["Kennst du Gun|dren? Kennst du Gun|dren?", "Zwerg mit Bart und schwar|zem Haar!", "Kennst du Gun|dren? Kennst du Gun|dren?", "Nein? Na gut. Dann nächs|tes Jahr!"]]
      ]
    },
    /* ---------- 10 · Die Halle der Flamme ---------- */
    {
      id: "themberchaud", grad: 4, takt: 4, bpm: 96, modus: "moll", stil: "hymne",
      titel: { de: "Verschone uns, o Themberchaud", en: "Spare Us, O Themberchaud" },
      teile: {
        V: ["j10: 1 1 2 3 4 5 4 3 2 1", "j10: 5 6 5 4 3 4 5 6 5 5", "j11: 5 1' 7 6 5 6 7 1' 7 6 5", "j11: 5 4 3 2 3 4 3 2 1 #7, 1"],
        C: ["j8: 5 1' 1' 7 6 7 1' 2'", "j8: 2' 1' 7 6 5 6 5 4", "j8: 5 1' 1' 2' 1' 7 6 5", "j8: 5 4 3 2 4 3 2 1"]
      },
      folge: [
        ["V", ["O Meis|ter al|ler Flam|men, Herr der Glut,", "auf Gold ge|bet|tet, präch|tig, groß und gut,", "ver|nimm das Lied von vie|ren, die hier ka|men", "durch Nacht und Netz in dei|nes Feu|ers Na|men."]],
        ["C", ["Ver|scho|ne uns, o Them|ber|chaud!", "Dein Schatz ist hoch, dein Bauch ist rund,", "wir sind nur Würst|chen, schmal wie Stroh,", "und schme|cken gräss|lich – nicht ge|sund!"]],
        ["V", ["In Don|ner|baum, da koch|te uns 'ne Drow", "'ne Sup|pe aus Be|trug, so falsch wie schlau;", "wir schlu|gen uns durch Ker|ker, Netz und Spin|nen,", "um Dawn|brin|ger im Gra|be zu ge|win|nen."]],
        ["V", ["Wir sah'n die Stadt der Fi|sche un|ter|gehn,", "den Dä|mon|fürs|ten aus den Flu|ten stehn;", "wir flo|hen ü|ber Wel|len, schwarz und ban|ge,", "und ka|men her zu dir mit dem Ge|san|ge."]],
        ["C", ["Ver|scho|ne uns, o Them|ber|chaud!", "Dein Schatz ist hoch, dein Bauch ist rund,", "wir sind nur Würst|chen, schmal wie Stroh,", "und schme|cken gräss|lich – nicht ge|sund!"]],
        ["C", ["Ver|scho|ne uns, o Them|ber|chaud!", "Dein Schatz ist hoch, dein Bauch ist rund,", "wir sind nur Würst|chen, schmal wie Stroh,", "und schme|cken gräss|lich – nicht ge|sund!"]]
      ]
    }
  ],

  /* ---------- Die Tournee: eine Station je Lied, in der Reihenfolge der Kampagne ---------- */
  weg: [
    { lied: "brief", sg: 8,
      de: { ort: "Der Hafen von Neverwinter", publikum: "Matrosen, Möwen und ein Zwerg mit Brief",
        intro: "Salz, Teer und vier Fremde, die sich noch nicht leiden können. Perfekt, um sich warmzusingen.",
        sieg: "Die Matrosen schunkeln, die Möwen schweigen respektvoll, und Gundren zahlt die erste Runde. Wir sind eine Gruppe. Irgendwie.",
        pleite: "Eine Möwe hat mir auf die Laute geschissen. Ich werte das als Kritik." },
      en: { ort: "The Harbour of Neverwinter", publikum: "Sailors, gulls and a dwarf with a letter",
        intro: "Salt, tar and four strangers who can't stand each other yet. Perfect for a warm-up.",
        sieg: "The sailors sway, the gulls fall respectfully silent, and Gundren buys the first round. We're a party. Sort of.",
        pleite: "A gull just shat on my lute. I'm taking that as a review." } },
    { lied: "goblin", sg: 9,
      de: { ort: "Die Straße nach Phandalin", publikum: "Ein Haufen Goblins im Gebüsch",
        intro: "Ein Wagen liegt quer, die Büsche kichern. Ich singe ihnen was – zum Abschied.",
        sieg: "Die Goblins rennen heulend in den Wald. Psychischer Schaden: maximal.",
        pleite: "Die Goblins klatschen begeistert. Schlimmer hätte es nicht kommen können." },
      en: { ort: "The Road to Phandalin", publikum: "A bunch of goblins in the bushes",
        intro: "A wagon blocks the road, the bushes are giggling. I'll sing them something – as a farewell.",
        sieg: "The goblins run howling into the woods. Psychic damage: maximum.",
        pleite: "The goblins applaud wildly. It could not have gone worse." } },
    { lied: "glasstab", sg: 10,
      de: { ort: "Schloss Crackmore", publikum: "Glasstab und die Roten Roben",
        intro: "Geklaute Roben, eine zerdepperte Phiole, und Glasstab starrt mich an. Zeit für ein Ablenkungsmanöver.",
        sieg: "Glasstab ist so beleidigt, dass er vergisst, wegzurennen. Friedrich bedankt sich herzlich.",
        pleite: "Glasstab nickt anerkennend und will mich rekrutieren. Ich glaube, das ist die schlimmste Kritik von allen." },
      en: { ort: "Castle Crackmore", publikum: "Glasstaff and the Red Robes",
        intro: "Stolen robes, a smashed phial, and Glasstaff is staring at me. Time for a distraction.",
        sieg: "Glasstaff is so offended he forgets to run. Friedrich says thank you.",
        pleite: "Glasstaff nods approvingly and wants to recruit me. That's the worst review of all." } },
    { lied: "venomfang", sg: 11,
      de: { ort: "Der Turm von Donnerbaum", publikum: "Venomfang, jung, grün und giftig",
        intro: "Ein Drache landet auf dem Plateau. Zwischen uns und seinem Mundgeruch steht nur noch meine Stimme.",
        sieg: "Der Drache starrt gebannt in meine bunten Lichter. Den Rest erledigt Ezekiels Pfeil.",
        pleite: "Der Drache hustet zurück. Echo auch. Beide grün." },
      en: { ort: "The Tower of Thundertree", publikum: "Venomfang – young, green and toxic",
        intro: "A dragon lands on the platform. Only my voice stands between us and his breath.",
        sieg: "The dragon stares, spellbound, into my colourful lights. Ezekiel's arrow does the rest.",
        pleite: "The dragon coughs back. So does Echo. Both green." } },
    { lied: "spinne", sg: 12,
      de: { ort: "Ilvaras Feste im Unterreich", publikum: "Zwei Wachen, ein Dämon und eine Drow",
        intro: "Gefesselt, nass, und Echo ist gerade eine Ratte. Ich mache das, was ich am besten kann: das Maul auf.",
        sieg: "Die Wachen stürmen wutentbrannt in die Zelle – geradewegs in unseren Hinterhalt.",
        pleite: "Die Wachen lachen nur und stopfen mir einen Socken in den Mund. Einen benutzten." },
      en: { ort: "Ilvara's Fortress in the Underdark", publikum: "Two guards, a demon and a drow",
        intro: "Tied up, soaked, and Echo is currently a rat. So I do what I do best: open my mouth.",
        sieg: "The guards storm into the cell in a rage – straight into our ambush.",
        pleite: "The guards just laugh and stuff a sock in my mouth. A used one." } },
    { lied: "ploop", sg: 13,
      de: { ort: "Am unterirdischen See", publikum: "Die Kuo-Toa – und einer, der zuhört",
        intro: "Leuchtpilze, stilles Wasser und ein Versprechen, das ich noch halten muss. Dieses Lied singe ich leise.",
        sieg: "Irgendwo unter dem Wasser, glaube ich, lächelt ein Priester. Blublupin. Ploopploopeen. Ich kann es jetzt.",
        pleite: "Meine Stimme bricht. Bei diesem Lied darf sie das." },
      en: { ort: "By the Underground Lake", publikum: "The Kuo-Toa – and one who is listening",
        intro: "Glowing mushrooms, still water and a promise I still have to keep. I sing this one quietly.",
        sieg: "Somewhere beneath the water, I think, a priest is smiling. Blublupin. Ploopploopeen. I can say it now.",
        pleite: "My voice breaks. With this song, it's allowed to." } },
    { lied: "friedrich", sg: 14,
      de: { ort: "Auf dem Boot", publikum: "Die Gefährten – und ein sehr stolzer Waldläufer",
        intro: "Hinter uns versinkt eine Stadt, vor uns schwarzes Wasser. Friedrich wünscht sich ein Lied über sich. Er bekommt eins.",
        sieg: "Friedrich hat Tränen in den Augen, Rex heult die zweite Stimme, und Kardal rudert doppelt so schnell.",
        pleite: "Friedrich findet, das Lied werde ihm nicht gerecht. Er habe immerhin einen GOTT geboxt." },
      en: { ort: "On the Boat", publikum: "The companions – and a very proud ranger",
        intro: "Behind us a city sinks, ahead of us black water. Friedrich wants a song about himself. He gets one.",
        sieg: "Friedrich has tears in his eyes, Rex howls the harmony, and Kardal rows twice as fast.",
        pleite: "Friedrich says the song doesn't do him justice. He punched a GOD, after all." } },
    { lied: "horga", sg: 15,
      de: { ort: "Am Hof von König Horga", publikum: "König Horga Stahl V. und sein Hofstaat",
        intro: "Ein Thron aus Fels, ein Bart wie ein Wasserfall, und Kardal kniet vor seinem Vater. Hier zählt jede Silbe.",
        sieg: "Der König nickt. Einmal. Für einen Duergar ist das ein Feuerwerk.",
        pleite: "Der König gähnt. Ein Wächter zieht schon höflich die Axt." },
      en: { ort: "At the Court of King Horga", publikum: "King Horga Stahl V and his court",
        intro: "A throne of rock, a beard like a waterfall, and Kardal kneeling before his father. Every syllable counts here.",
        sieg: "The king nods. Once. For a duergar, that's fireworks.",
        pleite: "The king yawns. A guard politely draws his axe." } },
    { lied: "gundren", sg: 16,
      de: { ort: "Markt der Klingen & Dorf der Riesen", publikum: "Händler, Riesen und Rex' neue Freunde",
        intro: "Echo hat eine Frage. Echo hat immer dieselbe Frage. Ich mache ein Lied draus.",
        sieg: "Halb Gracklstugh singt den Kehrreim mit. Gundren kennt trotzdem keiner.",
        pleite: "Ein Händler fragt mich, ob ich Gundren kenne. Ich fürchte, es ist ansteckend." },
      en: { ort: "Market of Blades & Village of Giants", publikum: "Traders, giants and Rex's new friends",
        intro: "Echo has a question. Echo always has the same question. I'm turning it into a song.",
        sieg: "Half of Gracklstugh joins the chorus. Still, nobody knows Gundren.",
        pleite: "A trader asks me whether I know Gundren. I'm afraid it's contagious." } },
    { lied: "themberchaud", sg: 18,
      de: { ort: "Die Halle der Flamme", publikum: "Themberchaud, Meister der Flammen",
        intro: "Lava an den Wänden, ein Berg aus Gold und ein Drache, der mich mit einem Schnauben braten könnte. Das Publikum meines Lebens.",
        sieg: "Eine natürliche 20! Themberchaud frisst uns nicht. Ich verbuche das als stehende Ovationen.",
        pleite: "Themberchaud schnaubt. Meine Augenbrauen sind weg. Aber ich lebe." },
      en: { ort: "The Hall of the Flame", publikum: "Themberchaud, Master of Flames",
        intro: "Lava on the walls, a mountain of gold and a dragon who could roast me with one snort. The audience of my life.",
        sieg: "A natural 20! Themberchaud doesn't eat us. I'm counting that as a standing ovation.",
        pleite: "Themberchaud snorts. My eyebrows are gone. But I'm alive." } }
  ]
};
