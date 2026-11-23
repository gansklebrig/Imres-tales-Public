/* =====================================================================
   TALES NEVER END – das unendliche Spielleiter-Spiel
   ---------------------------------------------------------------------
   Du sitzt hinter dem Schirm. Jede Karte ist ein Moment am Spieltisch:
   ein Spieler will etwas, die Würfel fallen, die Pizza kommt zu spät.
   Nach links oder rechts wischen = entscheiden. Vier Balken zeigen die
   Stimmung am Tisch (Macht, Realismus, Spaß, Tempo). Läuft einer ganz
   voll oder ganz leer, kippt die Runde. Am besten liegt alles zwischen
   der Mitte und drei Vierteln.

   Kampagnen → Sessions → Karten. Helden sterben, Spieler gehen und
   kommen, die Welt-Chronik wächst endlos. Spielleiter-Erfahrung bleibt
   für immer (Stufen, Werkzeuge hinter dem Schirm, Hausregeln, Erfolge).

   Karten stehen in tne-karten-*.js (eigene kleine Kartensprache, siehe
   Kommentar dort). Töne kommen aus amb/ (echte Aufnahmen der Bühne).
   ===================================================================== */
(function () {
  "use strict";
  const $ = s => document.querySelector(s);
  const esc = s => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lade = (k, d) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } };
  const sichere = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* voll oder gesperrt */ } };
  const handy = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent || "");

  /* ---------- Zufall (speicherbar, für die Tagesrunde mit festem Startwert) ---------- */
  const Z = { s: (Math.random() * 4294967296) >>> 0 };
  function zz() { Z.s = (Z.s + 0x6D2B79F5) >>> 0; let t = Z.s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }
  const zi = (a, b) => a + Math.floor(zz() * (b - a + 1));
  const wahl = arr => arr[Math.floor(zz() * arr.length)];
  const mischen = arr => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(zz() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

  /* =====================================================================
     DATEN
     ===================================================================== */
  const BALKEN = [
    { k: "m", name: "Macht", lo: "mickrig", hi: "OP", farbe: "#e0573a" },
    { k: "l", name: "Realismus", lo: "Schwachsinn", hi: "Bürokratie", farbe: "#c99a4a" },
    { k: "s", name: "Spaß", lo: "Pain", hi: "Albern", farbe: "#e8b14e" },
    { k: "t", name: "Tempo", lo: "zäh", hi: "gehetzt", farbe: "#d0743a" }
  ];
  const ZONE = [30, 75];

  /* Spielertypen: was sie mögen (Bereiche der Balken), wie sie aussehen */
  const TYPEN = {
    power: { titel: "Powergamer", farbe: "#c0442f", wunsch: { m: [55, 90] }, motto: "Will Schaden. Viel Schaden." },
    rolle: { titel: "Rollenspielerin", farbe: "#8e5bb5", wunsch: { l: [40, 80], t: [25, 65] }, motto: "Spricht nur in der Stimme ihres Helden." },
    regel: { titel: "Regelanwalt", farbe: "#7a6a3a", wunsch: { l: [50, 92] }, motto: "„Seite 193, zweiter Absatz.“" },
    chaos: { titel: "Chaot", farbe: "#d9822b", wunsch: { s: [55, 96], t: [40, 95] }, motto: "Würfelt erst, fragt nie." },
    snack: { titel: "Snackbeauftragter", farbe: "#a7713a", wunsch: { s: [40, 90], t: [10, 65] }, motto: "Hat Chips. Immer." },
    taktik: { titel: "Taktikerin", farbe: "#6f8f3a", wunsch: { m: [40, 80], t: [15, 60] }, motto: "Hat Karopapier mitgebracht." },
    neu: { titel: "Neuling", farbe: "#c9a24a", wunsch: { s: [45, 90], l: [10, 75] }, motto: "„Welcher Würfel ist der W12?“" },
    veteran: { titel: "Veteran", farbe: "#8a5a3a", wunsch: { l: [45, 90], m: [20, 72] }, motto: "Spielt seit 1987. Hat Meinungen." },
    handy: { titel: "Handy-Gucker", farbe: "#9c8a6a", wunsch: { t: [50, 95], s: [45, 95] }, motto: "„Hä, sind wir dran?“" },
    drama: { titel: "Theaterkind", farbe: "#b8376a", wunsch: { s: [40, 92], l: [25, 80] }, motto: "Jeder Satz ein Monolog." },
    kunst: { titel: "Zeichnerin", farbe: "#5f8a5a", wunsch: { s: [35, 85], t: [10, 70] }, motto: "Zeichnet jeden NSC ins Heft." },
    musik: { titel: "Musiker", farbe: "#c8853a", wunsch: { s: [45, 95] }, motto: "Hat die Ukulele dabei." }
  };
  const SPIELERNAMEN = ["Kevin", "Lena", "Bernd", "Mia", "Tobi", "Svenja", "Horst", "Jule", "Ömer", "Paula", "Max", "Anni", "Dennis", "Sophie", "Jonas", "Kathi", "Flo", "Nina", "Basti", "Lea", "Marco", "Steffi", "Luca", "Ronja", "Yusuf", "Ida", "Hannes", "Mira", "Pit", "Zoe", "Benni", "Clara", "Uwe", "Gabi", "Timo", "Elif", "Rüdiger", "Jana", "Sepp", "Vroni", "Malte", "Frieda", "Kalle", "Merle", "Ole", "Aylin", "Detlef", "Josie"];
  const VOELKER = ["Mensch", "Elf", "Zwerg", "Halbling", "Gnom", "Halbork", "Tiefling", "Drachenblütiger", "Goblin", "Katzenmensch", "Echsenmensch", "Aasimar", "Halbelf", "Kobold", "Minotaurus", "Pilzling", "Frosch-Mensch", "Waldschrat"];
  const KLASSEN = ["Barbar", "Barde", "Kleriker", "Druide", "Kämpfer", "Mönch", "Paladin", "Waldläufer", "Schurke", "Zauberer", "Hexenmeister", "Magier", "Tüftler", "Alchemist"];
  const HELDENNAMEN = ["Grimbold", "Ilvaria", "Thrain", "Morla", "Pip", "Zork", "Elandriel", "Bruno", "Kazrak", "Fenna", "Lirael", "Dorn", "Quix", "Sabeth", "Horgrim", "Ragnar", "Tilda", "Vex", "Yorrik", "Brumm", "Elowen", "Hilde", "Ottokar", "Zelphine", "Krümel", "Sir Reginald", "Bodo", "Gerlinde", "Xandor", "Mirabell", "Thokk", "Fidibus", "Ulla", "Wendelin", "Agathe", "Krogg", "Sunniva", "Balduin", "Esmeralda", "Timbo", "Rurik", "Lumi", "Gorm", "Isolde", "Kasimir", "Nessa", "Pankraz", "Ysolde", "Grünhilde", "Theobald", "Schattenklinge", "Nachtblut", "Moosbart", "Faelyn", "Brakk", "Odalys", "Rumpel", "Silvan", "Wanja", "Torvin", "Glimmer", "Hagen", "Jorinde", "Klaus der Kühne", "Mortimer", "Nimbus", "Orla", "Puck", "Rabia", "Sigurd", "Tamsin", "Urs", "Vilja", "Wolfram", "Xeno", "Yrsa", "Zappel", "Dunkelherz", "Sternenfunke", "Gundolf", "Hermine Hammerhand", "Bartholomäus"];
  const EIGEN = ["hat Angst vor Türen", "spricht nur in Reimen", "trägt einen Eimer als Helm", "hat eine 14-seitige Hintergrundgeschichte", "ist heimlich ein Drache (sagt er)", "sammelt Löffel", "hat einen Hasen namens Bürgermeister", "vertraut keinen Treppen", "flirtet mit Statuen", "isst alles, was er findet", "hält sich für den Auserwählten", "hat Waisen-Hintergrund, Variante Nr. 7", "schreit bei jedem Angriff seinen Namen", "kann nicht lügen – versucht es trotzdem", "hat einen bösen Zwilling (angeblich)", "will eigentlich Bäcker werden", "redet mit seiner Waffe", "zählt jede Münze dreimal", "hat Höhenangst und fliegt trotzdem", "sucht seinen verlorenen Hut", "ist allergisch gegen Magie", "rettet jede Katze", "spricht mit Akzent, den keiner einordnen kann", "trägt nur Lila", "will jeden NSC adoptieren", "schläft in Rüstung", "hat einen Schwur, nie zu rennen", "ist sehr, sehr klein", "glaubt an Glückssocken", "verliert ständig Finger (vorübergehend)", "kann nur flüstern", "führt ein Tagebuch über Gegner-Frisuren", "hasst Goblins persönlich", "ist eigentlich drei Kobolde im Mantel", "will eine Taverne eröffnen", "fürchtet sich vor Hühnern", "liebt Fallen", "nennt sich selbst in der dritten Person", "hat noch nie gewonnen", "trägt den Schädel seines Lehrers bei sich", "summt beim Schleichen", "möchte nur geliebt werden", "rechnet alles in Käse um", "hat ein Haustier-Mimik", "vergisst jede Nacht seinen Namen", "ist sehr höflich zu Untoten", "ist offiziell tot (Papierkram)", "hat Schulden bei einem Gott", "spielt Flöte, schlecht", "kann nicht schwimmen, wohnt auf einem Boot"];
  const ORTE = ["Nebelhain", "Grauwasser", "Kragenstein", "Zwielichtpass", "Rabenfels", "Moorbrück", "Eisenkamm", "Sonnfurt", "Salzhafen", "Krähenwinkel", "Tiefenbrunn", "Glimmertief", "Schattenmark", "Weidenau", "Bitterbach", "Hohenfrost", "Silberau", "Modergrund", "Brunnenwinkel", "Ascheklamm", "Goldhügel", "Mühlbach", "Wolkenstieg", "Knochenfurt", "Kesselsee", "Dornheim", "Fuchsbau", "Spiegelsand", "Wurzelgrund", "Sternfall"];
  const SCHURKEN = ["Lord Mortax", "die Lich-Königin Velthra", "Gerhard der Unaussprechliche", "der Nekromant Bodo", "Xal'gorath der Hungernde", "Madame Morgana", "der Rote Baron von Kragenstein", "die Hexe vom Moor", "Großinquisitor Fenwick", "der Drache Schmorgoth", "Kultführer Ulf", "die Spinnenkönigin Arachnia", "Professor Dunkelmond", "der Goblinkönig Snirk", "Baron von Blutwurst", "die Schneekönigin Frosta", "der untote Steuereintreiber", "das Ding aus dem Brunnen", "der Pilzfürst Myzel", "Graf Zahnlos", "die Schattenweberin", "der Kobold-Imperator Knirps III.", "Magister Malvolio", "die Eiserne Äbtissin", "der Wurm unter dem Berg"];
  const NPCS = ["Wirt Hubert", "die Kräuterfrau Gundel", "Hauptmann Brack", "der Händler Fizzlewick", "Schmiedin Hrodna", "Bürgermeister Pompelmus", "der mysteriöse Fremde im Umhang", "Bettler Ole", "Priesterin Aurelia", "der sprechende Rabe Kolk", "Bauer Jupp", "Barde Florian", "Gräfin von Zitterbach", "Zwerg Grombosch", "Hexe Schrumpelgund", "Gnom Pimpernell", "Stallbursche Tim", "Magierin Ysra", "die Wache Nr. 3", "Schankmaid Resi", "Fährmann Charon-Karl", "der alte Leuchtturmwärter", "Prinzessin Adelgunde", "Kaufmann Silbermund"];
  const MONSTER = ["Goblins", "Oger", "Kobolde", "Mimiks", "Gallertwürfel", "Eulenbären", "Trolle", "Ghule", "Lindwürmer", "Riesenratten", "Basilisken", "Harpyien", "Werwölfe", "Vampire", "Skelette", "Riesenspinnen", "Gargoyles", "Mantikore", "Schleime", "Golems", "Banditen", "wütende Gänseriche", "Kultisten", "Zombies", "Irrlichter", "Grottenschrate", "Echsenkrieger", "Höhlentrolle"];
  const DINGE = ["das Schwert +1 der Mittelmäßigkeit", "den Ring des ewigen Hungers", "eine Taschenuhr, die rückwärts läuft", "den Stab des Donnerns", "einen sprechenden Schädel", "die Stiefel der Eile", "einen Beutel mit unendlich Murmeln", "die Krone der Vergessenen", "ein verfluchtes Amulett", "den Kochlöffel der Macht", "ein Drachenei", "eine Schatzkarte mit einem X", "den Umhang der Unsichtbarkeit (nur montags)", "eine Laute aus Knochen", "den Kelch der Wahrheit", "einen Würfel, der immer 20 zeigt", "die Rüstung des Riesen (zu groß)", "ein Glas Mondlicht", "die Feder des Phönix", "eine Hose der Unverwundbarkeit"];
  const GOETTER = ["Fortunus", "Morna", "Gromm", "Mutter Sela", "Gouda", "Brutus", "Lunaria", "Pankratius der Gnädige"];
  const TITELMUSTER = ["Der Fluch von {ort}", "Schatten über {ort}", "Die Krone von {ort}", "Das Grab von {schurke}", "Die Rückkehr von {schurke}", "{ort} brennt", "Die letzte Schenke vor {ort}", "Das Geheimnis von {ort}", "Die Pilzkriege von {ort}", "Der lange Winter von {ort}", "Die Erben von {ort}", "Die Prophezeiung von {ort}", "Ein Drache namens Steuern", "Die Hochzeit von {ort}", "Das Turnier von {ort}", "Die Gruft unter {ort}", "Das Lied von {ort}", "Der Zorn von {schurke}"];

  /* Kampagnen-Schauplätze bestimmen die Grund-Atmosphäre */
  const SCHAUPLATZ = ["wald", "dungeon", "stadt", "see", "berg", "sumpf", "schloss", "wueste"];

  /* Enden: [Balken][0=leer,1=voll] */
  const ENDEN = {
    m0: { titel: "Ein Huhn hat gewonnen", bild: "🐔", text: "Die Helden sind so schwach, dass ein einzelnes Huhn die gesamte Gruppe in die Flucht geschlagen hat. Am nächsten Abend erstellen alle Charaktere für ein anderes Spiel. Ohne dich." },
    m1: { titel: "Göttlichkeit", bild: "👑", text: "Die Gruppe ist zu Göttern aufgestiegen. Es gibt nichts mehr zu besiegen, nichts mehr zu wollen. {spieler} hat sich zum Pantheon erklärt und verlangt Opfergaben in Form von Chips. Die Runde stirbt an Langeweile." },
    l0: { titel: "Kompletter Schwachsinn", bild: "🧀", text: "Der Mond ist ein Käse, der Schurke ist dein Vater, dein Vater ist ein Pferd, und das Pferd ist eigentlich ein Zeitreisender. Niemand weiß mehr, was los ist. {spieler} sagt leise: „Ich glaub, ich geh.“ Alle gehen." },
    l1: { titel: "Die Steuerprüfung", bild: "📑", text: "Jede Mahlzeit wird ausgewürfelt, jede Fackel hat eine Brenndauer, die Helden zahlen Abgaben an drei Fürstentümer. {spieler} gründet eine Buchhaltungs-AG. Der Drache wurde nie erreicht – es fehlte ein Passierschein." },
    s0: { titel: "Nur noch Pain", bild: "🌧️", text: "Niemand lacht mehr. {spieler} weint leise in den Würfelbeutel. Die Gruppe-Chat-Nachricht am nächsten Tag lautet nur: „Wir müssen reden.“" },
    s1: { titel: "Herr Puschel", bild: "🤡", text: "Alles ist nur noch ein Witz. Der Endgegner heißt inzwischen „Herr Puschel“, jede Szene endet mit einem Tanz. Als du eine ernste Szene versuchst, lacht der ganze Tisch fünf Minuten lang. Die Kampagne ist ein Meme geworden – und Memes sterben schnell." },
    t0: { titel: "Die ewige Kampfrunde", bild: "🐌", text: "Die Kampfrunde dauert seit drei Stunden. Zwei Spieler schlafen, einer bestellt Frühstück. {spieler} hat sein Testament in den Charakterbogen geschrieben. Niemand kommt nächste Woche." },
    t1: { titel: "20 Minuten Epos", bild: "💨", text: "Alles ging so schnell, dass die Kampagne in zwanzig Minuten vorbei war. Drache tot, Prinzessin gerettet, Welt verändert. Niemand weiß, was eigentlich passiert ist. {spieler} fragt: „Und jetzt?“ – Es gibt kein Jetzt mehr." },
    leer: { titel: "Der leere Tisch", bild: "🪑", text: "Einer nach dem anderen hat abgesagt. Du sitzt allein hinter dem Schirm, die Kerze brennt herunter. Irgendwo da draußen gibt es neue Spieler. Aber nicht heute." }
  };

  /* Werkzeuge hinter dem Schirm – dauerhaft mit Spielleiter-Stufen freigeschaltet */
  const WERKZEUGE = [
    { k: "blick", ic: "👁️", name: "Erfahrener Blick", stufe: 2, passiv: true, text: "Beim Zielen zeigt dir die Vorschau, ob ein Balken steigt (▲) oder fällt (▼)." },
    { k: "pizza", ic: "🍕", name: "Notfall-Pizza", stufe: 3, je: "session", n: 1, text: "Spaß +10, alle Spieler besser gelaunt – aber das Tempo leidet (−6)." },
    { k: "schirm", ic: "🛡️", name: "Sichtschirm-Wurf", stufe: 4, je: "kampagne", n: 2, text: "Der nächste Würfelwurf gelingt – egal, was der Würfel sagt. Niemand muss es wissen." },
    { k: "plot", ic: "✨", name: "Plot-Rüstung", stufe: 5, je: "kampagne", n: 1, passiv: true, text: "Der nächste Heldentod wird abgewendet. Gerade noch so." },
    { k: "pause", ic: "☕", name: "Pause!", stufe: 6, je: "session", n: 1, text: "Fünf Minuten Pause: Tempo rückt 15 zur Mitte." },
    { k: "buch", ic: "📕", name: "Regelbuch zuklappen", stufe: 7, je: "session", n: 1, text: "„Machen wir einfach so.“ Realismus rückt 15 zur Mitte." },
    { k: "skip", ic: "🃏", name: "Andere Karte", stufe: 8, je: "session", n: 1, text: "Diese Karte wandert unter den Stapel. Nächste!" },
    { k: "legende", ic: "📖", name: "Legendenbuch", stufe: 9, passiv: true, text: "Helden, die eine Kampagne überleben, werden Legenden: Die nächste Kampagne startet mit besserer Laune am Tisch." },
    { k: "glueck", ic: "🍀", name: "Glückswürfel", stufe: 10, passiv: true, text: "+2 auf alle Würfe hinter dem Schirm." },
    { k: "deus", ic: "⚡", name: "Deus ex Machina", stufe: 11, je: "kampagne", n: 1, text: "Alle Balken rücken 12 zur Mitte – aber Realismus verliert 8." },
    { k: "stamm", ic: "🍻", name: "Stammtisch", stufe: 12, passiv: true, text: "Die Laune deiner Spieler sinkt ein Drittel langsamer." },
    { k: "start", ic: "🕯️", name: "Bewährte Runde", stufe: 14, passiv: true, text: "Neue Runden starten mit Balken nah an der Mitte und einem fünften Spieler." },
    { k: "doppel", ic: "🎲", name: "Zweiter Würfel", stufe: 16, je: "kampagne", n: 2, text: "Beim nächsten Wurf werden zwei Würfel geworfen, der bessere zählt." },
    { k: "muse", ic: "🪶", name: "Muse", stufe: 18, je: "session", n: 1, text: "Alle Spieler +15 Laune. Eine gute Geschichte heilt alles." }
  ];

  /* Hausregeln – vor jeder neuen Runde wählbar, durch Erfolge freigeschaltet */
  const HAUSREGELN = [
    { k: "krit", name: "Kritische Treffer explodieren", text: "Natürliche 20 verdoppelt alles Gute, natürliche 1 alles Schlechte. Mehr Erfahrung (+15 %).", frei: "nat20", bonus: 1.15 },
    { k: "hardcore", name: "Hardcore: Tod ist Tod", text: "Keine Plot-Rüstung, Tode treffen die Laune doppelt. Erfahrung +50 %.", frei: "tpk", bonus: 1.5 },
    { k: "wuerfel", name: "Nur die Würfel entscheiden", text: "Viel mehr Würfelkarten. Erfahrung +10 %.", frei: "wuerfel50", bonus: 1.1 },
    { k: "kurz", name: "Kurze Sessions", text: "Sessions sind halb so lang, Kampagnen schneller vorbei.", frei: "kampagne1", bonus: 1 },
    { k: "trash", name: "Trash-Modus", text: "Wildere Karten, der Realismus schwankt um die Hälfte stärker. Erfahrung +20 %.", frei: "schwachsinn", bonus: 1.2 },
    { k: "snacks", name: "Snackpflicht", text: "Spaß sinkt langsamer, Tempo schwankt stärker.", frei: "pizza10", bonus: 1 },
    { k: "grosse", name: "Große Runde", text: "Sechs Spieler am Tisch. Mehr Stimmen, mehr Chaos. Erfahrung +25 %.", frei: "spieler20", bonus: 1.25 },
    { k: "eisern", name: "Eiserner Spielleiter", text: "Keine Werkzeuge hinter dem Schirm. Erfahrung +60 %.", frei: "stufe10", bonus: 1.6 }
  ];

  /* Erfolge */
  const ERFOLGE = [
    { k: "erste", ic: "🕯️", name: "Hinter dem Schirm", text: "Spiele deine erste Karte." },
    { k: "session1", ic: "🌙", name: "Erster Abend", text: "Beende eine Session." },
    { k: "kampagne1", ic: "🏰", name: "Kampagne geschafft", text: "Bringe eine Kampagne zu Ende." },
    { k: "kampagne5", ic: "🏯", name: "Weltenbauer", text: "Beende 5 Kampagnen (insgesamt)." },
    { k: "kampagne3run", ic: "🔥", name: "Eine Runde für die Ewigkeit", text: "Beende 3 Kampagnen mit derselben Runde." },
    { k: "karten100", ic: "🃏", name: "Hundert Momente", text: "Spiele 100 Karten in einer Runde." },
    { k: "karten300", ic: "📚", name: "Endlose Geschichte", text: "Spiele 300 Karten in einer Runde." },
    { k: "karten1000", ic: "♾️", name: "Tales never End", text: "Spiele insgesamt 1000 Karten." },
    { k: "nat20", ic: "🌟", name: "Natürliche 20", text: "Würfle eine natürliche 20." },
    { k: "nat1", ic: "💀", name: "Natürliche 1", text: "Würfle eine natürliche 1." },
    { k: "wuerfel50", ic: "🎲", name: "Würfelturm", text: "Würfle 50 Mal." },
    { k: "tod1", ic: "⚰️", name: "Das erste Opfer", text: "Ein Held stirbt." },
    { k: "tod25", ic: "🪦", name: "Friedhofsgärtner", text: "25 Helden sind gestorben (insgesamt)." },
    { k: "tpk", ic: "☠️", name: "TPK", text: "Die ganze Gruppe stirbt auf einmal." },
    { k: "pizza10", ic: "🍕", name: "Stammkunde", text: "Bestelle 10 Notfall-Pizzen." },
    { k: "spieler20", ic: "👥", name: "Offene Runde", text: "20 verschiedene Spieler saßen an deinen Tischen." },
    { k: "alleenden", ic: "🎭", name: "Alle Wege führen zum Ende", text: "Erlebe alle neun Enden." },
    { k: "schwachsinn", ic: "🧀", name: "Der Mond ist ein Käse", text: "Erlebe das Ende „Kompletter Schwachsinn“." },
    { k: "zone", ic: "⚖️", name: "Perfekte Balance", text: "Beende eine Session mit allen Balken im grünen Bereich." },
    { k: "zone5", ic: "🧘", name: "Meister des Gleichgewichts", text: "Beende 5 Sessions in Folge perfekt ausbalanciert." },
    { k: "stufe5", ic: "🎓", name: "Erfahrener Spielleiter", text: "Erreiche Spielleiter-Stufe 5." },
    { k: "stufe10", ic: "🧙", name: "Alter Hase", text: "Erreiche Spielleiter-Stufe 10." },
    { k: "stufe20", ic: "👑", name: "Weltenlenker", text: "Erreiche Spielleiter-Stufe 20." },
    { k: "sammler", ic: "🗂️", name: "Sammler", text: "Entdecke 250 verschiedene Karten." },
    { k: "sammler2", ic: "🏛️", name: "Archivar", text: "Entdecke 500 verschiedene Karten." },
    { k: "drache", ic: "🐉", name: "Drachenhochzeit", text: "Erlebe, wie ein Barde einen Drachen heiratet." },
    { k: "legende5", ic: "📖", name: "Legenden", text: "5 Helden sind zu Legenden geworden." },
    { k: "stufe10held", ic: "⚔️", name: "Stufe 10", text: "Ein Held erreicht Stufe 10." },
    { k: "veteran", ic: "🧓", name: "Seit 1987", text: "Halte einen Veteranen eine ganze Kampagne lang glücklich (Laune über 60)." },
    { k: "tages", ic: "📅", name: "Tagesrunde", text: "Spiele eine Tagesrunde." },
    { k: "hardcore", ic: "🩸", name: "Hardcore", text: "Beende eine Kampagne mit der Hausregel „Tod ist Tod“." },
    { k: "katze", ic: "🐈", name: "Würfelfresser", text: "Die Tischkatze hat einen Würfel verschluckt." },
    { k: "geist", ic: "👻", name: "Der Geist am Tisch", text: "Ein toter Held spukt weiter." },
    { k: "frieden", ic: "🕊️", name: "Pazifisten", text: "Die Gruppe löst den Endkampf ohne Gewalt." },
    { k: "nachfahre", ic: "🌳", name: "Erbe", text: "Ein Spieler spielt den Nachfahren einer Legende." }
  ];

  /* =====================================================================
     KARTEN EINLESEN
     Format (pro Karte):
       § #id sprecher schlüssel:wert …
       Text (eine oder mehrere Zeilen)
       < Linke Wahl | Wirkung | Folgetext | viz
       > Rechte Wahl | Wirkung | Folgetext | viz
     Wirkung: m+5 l-10 s+3 t-2 · tod · tod2 · tpk · lvl · laune+10 · alle-5 · neu · geht
              +flag · -flag · >id (gleich danach) · >>id (später) · xp+20 · held · plot+1
              W12 a b ? c d : e f   → Würfelprobe gegen 12 (Erfolg ? … : Fehlschlag)
     Folgetext mit Würfel: „Erfolgstext :: Fehlschlagtext“
     Bedingungen (wenn:…, kommagetrennt): m<40 s>60 akt=2 sess>1 kamp>1 flag !flag tote>0
              stufe>3 spieler<4 laune<30 legende hr:trash meta>5
     ===================================================================== */
  const KARTEN = [], KARTE = {};
  /* Ausgleich: Gute Laune schreibt sich leichter als schlechte. Positive Werte werden gedämpft,
     dafür verfliegt Spaß (und etwas Realismus/Macht) mit jeder Karte von selbst ein wenig. */
  const SKAL = { m: .7, l: .75, s: .6, t: 1 };
  const DRIFT = { m: -.3, l: -.5, s: -1.5, t: 0 };
  let STAERKE = 1.8;
  const skaliere = tok => tok.replace(/^([mlst])\+(\d+)$/, (_, b, n) => b + "+" + Math.max(1, Math.round(+n * SKAL[b])));
  function parseWirkung(s) {
    s = (s || "").trim();
    const w = { wurf: 0, ok: [], nein: [] };
    const m = s.match(/^W(\d+)\s*(.*)$/);
    if (m) {
      w.wurf = +m[1];
      const rest = m[2];
      const q = rest.indexOf("?"), d = rest.indexOf(":", q + 1);
      const vor = q >= 0 ? rest.slice(0, q) : rest;
      w.ok = (q >= 0 ? rest.slice(q + 1, d >= 0 ? d : undefined) : "").split(/\s+/).concat(vor.split(/\s+/)).filter(Boolean);
      w.nein = (d >= 0 ? rest.slice(d + 1) : "").split(/\s+/).concat(vor.split(/\s+/)).filter(Boolean);
    } else w.ok = s.split(/\s+/).filter(Boolean);
    w.ok = w.ok.map(skaliere); w.nein = w.nein.map(skaliere);
    return w;
  }
  function parseKarten(txt, quelle) {
    const bloecke = txt.split(/^§/m).slice(1);
    for (const b of bloecke) {
      const zeilen = b.split("\n");
      const kopf = zeilen.shift().trim().split(/\s+/);
      const k = { id: "", wer: "spieler", text: "", opt: [], g: 1, phase: "mitte", wenn: [], quelle };
      for (const t of kopf) {
        if (t[0] === "#") k.id = t.slice(1);
        else if (t.includes(":")) {
          const [a, v] = [t.slice(0, t.indexOf(":")), t.slice(t.indexOf(":") + 1)];
          if (a === "wenn") k.wenn = v.split(",").filter(Boolean);
          else if (a === "g") k.g = +v;
          else k[a] = v;
        } else if (t === "einmal" || t === "kette" || t === "wurfkarte" || t === "trash") k[t] = true;
        else if (t) k.wer = t;
      }
      const text = [];
      for (const z of zeilen) {
        const zz2 = z.trim();
        if (!zz2) continue;
        if (zz2[0] === "<" || zz2[0] === ">") {
          const teile = zz2.slice(1).split("|").map(x => x.trim());
          k.opt[zz2[0] === "<" ? 0 : 1] = { label: teile[0] || "…", w: parseWirkung(teile[1]), folge: teile[2] || "", viz: teile[3] || "" };
        } else text.push(zz2);
      }
      k.text = text.join(" ");
      if (!k.opt[0] || !k.opt[1]) { console.warn("Karte ohne zwei Wahlen:", k.id || k.text.slice(0, 40)); continue; }
      if (!k.id) k.id = quelle + "_" + KARTEN.length;
      if (KARTE[k.id]) { console.warn("Doppelte Karten-ID:", k.id); k.id += "_" + KARTEN.length; }
      KARTEN.push(k); KARTE[k.id] = k;
    }
  }
  (window.TNE_KARTEN || []).forEach((t, i) => parseKarten(t, "k" + (i + 1)));
  const ZIEHBAR = KARTEN.filter(k => !k.kette && !k.intern);

  /* =====================================================================
     SPEICHER
     ===================================================================== */
  const metaNeu = () => ({ v: 1, xp: 0, stufe: 1, erfolge: {}, gesehen: {}, enden: {}, stats: { karten: 0, sessions: 0, kampagnen: 0, helden: 0, tode: 0, wuerfe: 0, nat20: 0, nat1: 0, pizza: 0, spieler: 0, runden: 0, legenden: 0, besteKarten: 0, zoneFolge: 0 },
    welt: { jahr: 1, chronik: [], legenden: [], gefallene: [], schurken: [] }, tages: {}, einst: { atmo: 0.55, fx: 0.8, vib: false, auto: false, ruhig: false } });
  let META = lade("tne-meta", null) || metaNeu();
  META.einst = Object.assign(metaNeu().einst, META.einst || {});
  META.stats = Object.assign(metaNeu().stats, META.stats || {});
  META.welt = Object.assign(metaNeu().welt, META.welt || {});
  let RUN = lade("tne-run", null);
  if (RUN && RUN.v !== 1) RUN = null;
  const speichern = () => { sichere("tne-meta", META); if (RUN) { RUN.z = Z.s; sichere("tne-run", RUN); } else { try { localStorage.removeItem("tne-run"); } catch (e) { /* egal */ } } };

  /* =====================================================================
     TON – echte Aufnahmen aus amb/
     ===================================================================== */
  const Ton = (() => {
    let ctx = null, fxGain = null, atmoGain = null, aktiv = null, puffer = {};
    const V = window.TNE_VARIANTEN || {}, A = new Set(window.TNE_ATMO || []);
    function start() {
      if (ctx) { if (ctx.state === "suspended") ctx.resume(); return; }
      const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
      ctx = new AC(); fxGain = ctx.createGain(); atmoGain = ctx.createGain();
      fxGain.connect(ctx.destination); atmoGain.connect(ctx.destination); lautstaerke();
    }
    function lautstaerke() { if (!ctx) return; fxGain.gain.value = META.einst.fx; atmoGain.gain.value = META.einst.atmo * 0.55; }
    function datei(name) {
      if (A.has(name)) return "amb/" + name + ".mp3";
      if (V[name]) return "amb/" + name + "_" + (1 + Math.floor(Math.random() * V[name])) + ".mp3";
      if (/^(fx_|k_|timp|gong|gloeckchen|triangel|harfe|glock_|swell|crash|shake|bogen|holz)/.test(name)) return "klang/" + name + ".mp3";
      return null;
    }
    function laden(url) {
      if (!puffer[url]) puffer[url] = fetch(url).then(r => r.ok ? r.arrayBuffer() : Promise.reject(r.status)).then(b => new Promise((ok, f) => ctx.decodeAudioData(b, ok, f))).catch(() => null);
      return puffer[url];
    }
    function spiel(name, vol = 1, verz = 0) {
      if (!ctx || !name || META.einst.fx <= 0) return;
      const url = datei(name); if (!url) return;
      laden(url).then(buf => {
        if (!buf) return;
        const q = ctx.createBufferSource(), g = ctx.createGain(); q.buffer = buf;
        const dauer = Math.min(buf.duration, 4.5);
        g.gain.setValueAtTime(vol, ctx.currentTime + verz);
        g.gain.setValueAtTime(vol, ctx.currentTime + verz + dauer - 0.4);
        g.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + verz + dauer);
        q.connect(g); g.connect(fxGain); q.start(ctx.currentTime + verz); q.stop(ctx.currentTime + verz + dauer + 0.05);
      });
    }
    function atmo(name) {
      if (!ctx) return;
      if (aktiv && aktiv.name === name) return;
      const alt = aktiv; aktiv = { name };
      if (alt && alt.g) { const g = alt.g; g.gain.cancelScheduledValues(ctx.currentTime); g.gain.setValueAtTime(g.gain.value, ctx.currentTime); g.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + 2.5); setTimeout(() => { try { alt.q.stop(); } catch (e) { /* schon aus */ } }, 2700); }
      if (!name) return;
      const url = datei(name); if (!url) return;
      const ich = aktiv;
      laden(url).then(buf => {
        if (!buf || aktiv !== ich) return;
        const q = ctx.createBufferSource(), g = ctx.createGain(); q.buffer = buf; q.loop = true;
        g.gain.setValueAtTime(0.0001, ctx.currentTime); g.gain.linearRampToValueAtTime(1, ctx.currentTime + 3);
        q.connect(g); g.connect(atmoGain); q.start(0, Math.random() * Math.max(0, buf.duration - 1));
        ich.q = q; ich.g = g;
      });
    }
    return { start, spiel, atmo, lautstaerke };
  })();
  const vib = ms => { if (META.einst.vib && navigator.vibrate) try { navigator.vibrate(ms); } catch (e) { /* egal */ } };

  /* Atmosphäre je Ort */
  const ATMO = { taverne: "a_gaeste", wald: "a_voegel1", dungeon: "a_tropfstein", hoehle: "a_tropfstein_n1", stadt: "a_markt", see: "a_wellen1", meer: "a_brandung", sturm: "a_gewitter1", regen: "a_regen1", nacht: "a_grillen", kampf: "a_schlacht", friedhof: "a_friedhof", berg: "a_wind1", schloss: "a_halle", sumpf: "a_fliegenschwarm", feuer: "a_lagerfeuer", lager: "a_lagerfeuer_n1", schnee: "a_schneesturm", wueste: "a_heulwind", tempel: "a_klangschale", geister: "a_geisterhauch", hof: "a_hof", tisch: "a_feuer1", markt: "a_markt_n1", hafen: "a_hafen", fluss: "a_fluss", schmiede: "a_esse", kueche: "a_kochen", wiese: "a_sommerwiese", krieg: "a_kriegstrommeln", ruine: "a_ruinenwind", unterwasser: "a_unterwasser", zelt: "a_zelt", muehle: "a_muehle" };

  /* =====================================================================
     VISUALISIERUNG – kleine Effekte nach jeder Wahl
     ===================================================================== */
  const Viz = (() => {
    const cv = $("#viz"), c = cv.getContext("2d");
    let teile = [], laeuft = false, blitzT = 0, flashFarbe = null, flashT = 0, schuettel = 0, dunkel = 0, extra = [];
    function groesse() { const r = cv.getBoundingClientRect(), d = Math.min(2, window.devicePixelRatio || 1); cv.width = r.width * d; cv.height = r.height * d; c.setTransform(d, 0, 0, d, 0, 0); }
    window.addEventListener("resize", groesse);
    const W = () => cv.clientWidth, H = () => cv.clientHeight;
    const R = (a, b) => a + Math.random() * (b - a);
    function teil(o) { teile.push(Object.assign({ x: W() / 2, y: H() / 2, vx: 0, vy: 0, g: 0, l: 1.5, t: 0, r: 4, f: "#ffd27a", form: "kreis", rot: 0, vr: 0, a: 1, wind: 0 }, o)); }
    function zeichneForm(p) {
      const s = p.r;
      c.save(); c.translate(p.x, p.y); c.rotate(p.rot); c.globalAlpha = Math.max(0, p.a * (1 - Math.pow(p.t / p.l, 3)));
      c.fillStyle = p.f; c.strokeStyle = p.f;
      switch (p.form) {
        case "herz": c.beginPath(); c.moveTo(0, s * .35); c.bezierCurveTo(-s * 1.2, -s * .5, -s * .4, -s * 1.3, 0, -s * .45); c.bezierCurveTo(s * .4, -s * 1.3, s * 1.2, -s * .5, 0, s * .35); c.fill(); break;
        case "muenze": c.beginPath(); c.ellipse(0, 0, s, s * Math.abs(Math.cos(p.t * 8)) + .5, 0, 0, 7); c.fill(); c.strokeStyle = "#8a5a10"; c.lineWidth = 1; c.stroke(); break;
        case "stern": c.beginPath(); for (let i = 0; i < 10; i++) { const rr = i % 2 ? s * .45 : s; c.lineTo(Math.cos(i * Math.PI / 5) * rr, Math.sin(i * Math.PI / 5) * rr); } c.closePath(); c.fill(); break;
        case "strich": c.lineWidth = p.lw || 1.5; c.beginPath(); c.moveTo(0, 0); c.lineTo(p.vx * .03, p.vy * .03); c.stroke(); break;
        case "rechteck": c.fillRect(-s, -s * .5, s * 2, s); break;
        case "flocke": c.lineWidth = 1.2; for (let i = 0; i < 3; i++) { c.rotate(Math.PI / 3); c.beginPath(); c.moveTo(-s, 0); c.lineTo(s, 0); c.stroke(); } break;
        case "blatt": c.beginPath(); c.ellipse(0, 0, s, s * .45, 0, 0, 7); c.fill(); c.strokeStyle = "rgba(0,0,0,.25)"; c.beginPath(); c.moveTo(-s, 0); c.lineTo(s, 0); c.stroke(); break;
        case "note": c.beginPath(); c.ellipse(0, s * .6, s * .45, s * .32, -.4, 0, 7); c.fill(); c.fillRect(s * .32, -s, s * .14, s * 1.6); c.fillRect(s * .32, -s, s * .6, s * .2); break;
        case "schaedel": c.beginPath(); c.arc(0, -s * .15, s * .8, Math.PI, 0); c.lineTo(s * .55, s * .5); c.lineTo(-s * .55, s * .5); c.closePath(); c.fill(); c.fillStyle = "#1a0f08"; c.beginPath(); c.arc(-s * .32, -s * .1, s * .2, 0, 7); c.arc(s * .32, -s * .1, s * .2, 0, 7); c.fill(); c.fillRect(-s * .3, s * .32, s * .08, s * .18); c.fillRect(-s * .04, s * .32, s * .08, s * .18); c.fillRect(s * .22, s * .32, s * .08, s * .18); break;
        case "pizza": c.beginPath(); c.moveTo(0, -s); c.lineTo(s * .8, s * .7); c.quadraticCurveTo(0, s * 1.05, -s * .8, s * .7); c.closePath(); c.fillStyle = "#f2c25a"; c.fill(); c.fillStyle = "#c0442f"; [[0, -.1], [.3, .4], [-.3, .45]].forEach(([a, b]) => { c.beginPath(); c.arc(a * s, b * s, s * .16, 0, 7); c.fill(); }); c.strokeStyle = "#b07a2a"; c.lineWidth = s * .2; c.beginPath(); c.moveTo(s * .8, s * .7); c.quadraticCurveTo(0, s * 1.05, -s * .8, s * .7); c.stroke(); break;
        case "feder": c.beginPath(); c.ellipse(0, 0, s * .3, s, .3, 0, 7); c.fill(); break;
        case "text": c.font = "700 " + s + "px 'Alegreya Sans',sans-serif"; c.textAlign = "center"; c.fillText(p.txt, 0, 0); break;
        case "ring": c.lineWidth = 3 * (1 - p.t / p.l); c.beginPath(); c.arc(0, 0, s + p.t * 160, 0, 7); c.stroke(); break;
        case "tropfen": c.beginPath(); c.moveTo(0, -s); c.quadraticCurveTo(s * .7, s * .2, 0, s * .6); c.quadraticCurveTo(-s * .7, s * .2, 0, -s); c.fill(); break;
        case "fledermaus": c.beginPath(); c.moveTo(0, 0); const fl = Math.sin(p.t * 22) * s * .5; c.quadraticCurveTo(-s * .5, -s * .3 - fl, -s * 1.2, -fl); c.quadraticCurveTo(-s * .6, s * .1, 0, s * .3); c.quadraticCurveTo(s * .6, s * .1, s * 1.2, -fl); c.quadraticCurveTo(s * .5, -s * .3 - fl, 0, 0); c.fill(); break;
        case "ranke": c.lineWidth = 3; c.lineCap = "round"; c.beginPath(); const len = Math.min(1, p.t / (p.l * .6)) * s; c.moveTo(0, 0); for (let i = 0; i < len; i += 4) c.lineTo(Math.sin(i * .06 + p.seed) * 14, -i); c.stroke(); break;
        case "pfeil": c.lineWidth = 2; c.beginPath(); c.moveTo(-s, 0); c.lineTo(s, 0); c.stroke(); c.beginPath(); c.moveTo(s, 0); c.lineTo(s - 6, -4); c.lineTo(s - 6, 4); c.fill(); break;
        case "huhn": c.font = s + "px serif"; c.textAlign = "center"; c.fillText("🐔", 0, 0); break;
        case "geist": c.beginPath(); c.arc(0, -s * .3, s * .7, Math.PI, 0); c.lineTo(s * .7, s * .6); for (let i = 0; i < 4; i++) c.lineTo(s * .7 - (i + .5) * s * .35, s * (i % 2 ? .6 : .35)); c.lineTo(-s * .7, s * .6); c.closePath(); c.fill(); c.fillStyle = "#2b1d12"; c.beginPath(); c.arc(-s * .25, -s * .35, s * .12, 0, 7); c.arc(s * .25, -s * .35, s * .12, 0, 7); c.fill(); break;
        default: c.beginPath(); c.arc(0, 0, s, 0, 7); c.fill();
      }
      c.restore();
    }
    let letzte = 0;
    function schleife(ts) {
      const dt = Math.min(0.05, (ts - (letzte || ts)) / 1000); letzte = ts;
      const w = W(), h = H();
      c.clearRect(0, 0, w, h);
      if (dunkel > 0) { c.fillStyle = "rgba(5,2,1," + Math.min(.55, dunkel) + ")"; c.fillRect(0, 0, w, h); dunkel -= dt * .45; }
      if (flashT > 0) { c.fillStyle = flashFarbe.replace("A", Math.min(.6, flashT).toFixed(3)); c.fillRect(0, 0, w, h); flashT -= dt * 1.6; }
      if (blitzT > 0) {
        blitzT -= dt;
        if (blitzT > .35) { c.fillStyle = "rgba(255,250,230," + ((blitzT - .35) * 2.4).toFixed(3) + ")"; c.fillRect(0, 0, w, h); }
        if (blitzT > .2 && extra.blitz) { c.strokeStyle = "rgba(255,245,210,.95)"; c.lineWidth = 3; c.shadowColor = "#ffe9a0"; c.shadowBlur = 18; c.beginPath(); extra.blitz.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.stroke(); c.shadowBlur = 0; }
      }
      if (extra.drache && extra.drache.t < 2.2) {
        const d = extra.drache; d.t += dt; const x = -200 + d.t / 2.2 * (w + 400), y = h * .3 + Math.sin(d.t * 3) * 20;
        c.save(); c.translate(x, y); c.fillStyle = "rgba(10,4,2,.75)"; const fl = Math.sin(d.t * 9) * 40;
        c.beginPath(); c.moveTo(-90, 10); c.quadraticCurveTo(-20, -5, 60, 0); c.lineTo(95, -8); c.lineTo(70, 8); c.quadraticCurveTo(0, 20, -90, 10); c.fill();
        c.beginPath(); c.moveTo(-10, 0); c.quadraticCurveTo(-60, -60 - fl, -120, -40 - fl * .6); c.quadraticCurveTo(-60, -20, -10, 5); c.fill();
        c.beginPath(); c.moveTo(10, 0); c.quadraticCurveTo(20, -70 - fl, 70, -60 - fl * .6); c.quadraticCurveTo(30, -20, 15, 5); c.fill(); c.restore();
      }
      if (schuettel > 0) { schuettel -= dt; document.body.style.transform = "translate(" + R(-4, 4) * schuettel * 3 + "px," + R(-3, 3) * schuettel * 3 + "px)"; if (schuettel <= 0) document.body.style.transform = ""; }
      for (const p of teile) {
        p.t += dt; p.vy += p.g * dt; p.vx += p.wind * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.rot += p.vr * dt;
        if (p.wob) p.x += Math.sin(p.t * p.wob + (p.seed || 0)) * .6;
        if (p.zieh) { p.r = Math.max(0.2, p.r + p.zieh * dt); }
        zeichneForm(p);
      }
      teile = teile.filter(p => p.t < p.l);
      if (teile.length || blitzT > 0 || flashT > 0 || schuettel > 0 || dunkel > 0 || (extra.drache && extra.drache.t < 2.2)) requestAnimationFrame(schleife);
      else { laeuft = false; c.clearRect(0, 0, w, h); }
    }
    function los() { if (!laeuft) { laeuft = true; letzte = 0; groesse(); requestAnimationFrame(schleife); } }
    const E = {
      blitz() { const w = W(), h = H(); let x = R(w * .25, w * .75), y = 0; extra.blitz = [[x, y]]; while (y < h * .75) { x += R(-40, 40); y += R(20, 50); extra.blitz.push([x, y]); } blitzT = .7; schuettel = .25; E.regen(.6); },
      regen(st = 1) { const w = W(); for (let i = 0; i < 90 * st; i++) teil({ x: R(-40, w + 40), y: R(-120, -10), vx: -60, vy: R(500, 750), l: R(.8, 1.5), r: 1, f: "rgba(230,215,190,.55)", form: "strich", lw: 1.2 }); },
      feuer() { const w = W(), h = H(); for (let i = 0; i < 70; i++) teil({ x: R(w * .2, w * .8), y: h + 10, vx: R(-30, 30), vy: R(-320, -140), l: R(.8, 1.8), r: R(3, 9), f: wahl(["#ff7a3a", "#ffb648", "#ffd27a", "#e0442a"]), wob: 6, seed: R(0, 9), zieh: -3 }); flashFarbe = "rgba(255,120,40,A)"; flashT = .35; },
      explosion() { const w = W(), h = H(); for (let i = 0; i < 90; i++) { const a = R(0, 7), v = R(100, 520); teil({ x: w / 2, y: h * .45, vx: Math.cos(a) * v, vy: Math.sin(a) * v, g: 200, l: R(.6, 1.4), r: R(2, 7), f: wahl(["#ff7a3a", "#ffd27a", "#e0442a", "#5a4a3a"]) }); } flashFarbe = "rgba(255,200,120,A)"; flashT = .7; schuettel = .5; },
      muenzen() { const w = W(); for (let i = 0; i < 40; i++) teil({ x: R(w * .15, w * .85), y: R(-80, -10), vy: R(80, 200), g: 520, l: R(1.2, 2), r: R(5, 8), f: "#f2c14e", form: "muenze", vr: R(-3, 3) }); },
      herzen() { const w = W(), h = H(); for (let i = 0; i < 26; i++) teil({ x: R(w * .2, w * .8), y: h * R(.55, .85), vy: R(-140, -60), l: R(1.4, 2.4), r: R(7, 14), f: wahl(["#e0573a", "#ff7aa2", "#c0442f"]), wob: 3, seed: R(0, 9) }); },
      funkeln() { const w = W(), h = H(); for (let i = 0; i < 45; i++) teil({ x: R(w * .1, w * .9), y: R(h * .15, h * .8), vy: R(-30, 10), l: R(.6, 1.6), r: R(2, 6), f: wahl(["#ffe9a0", "#e8b14e", "#c99ae8", "#fff"]), form: "stern", vr: R(-2, 2) }); },
      magie() { E.funkeln(); const w = W(), h = H(); teil({ x: w / 2, y: h * .45, l: 1, r: 10, f: "#c99ae8", form: "ring" }); teil({ x: w / 2, y: h * .45, l: 1.3, r: 30, f: "#e8b14e", form: "ring" }); },
      schaedel() { const w = W(), h = H(); teil({ x: w / 2, y: h * .42, vy: -10, l: 2, r: 46, f: "#efe0c0", form: "schaedel", a: .9 }); for (let i = 0; i < 20; i++) teil({ x: R(0, w), y: R(h * .3, h), vy: R(-40, -10), l: R(1, 2), r: R(10, 26), f: "rgba(40,30,25,.35)", zieh: 10 }); dunkel = .6; },
      konfetti() { const w = W(); for (let i = 0; i < 110; i++) teil({ x: R(0, w), y: R(-100, -10), vx: R(-60, 60), vy: R(80, 220), g: 80, l: R(1.6, 2.6), r: R(3, 6), f: wahl(["#e0573a", "#e8b14e", "#7fa64a", "#c99ae8", "#ff7aa2", "#fff2c8"]), form: "rechteck", vr: R(-8, 8), wob: 4, seed: R(0, 9) }); },
      nebel() { const w = W(), h = H(); for (let i = 0; i < 26; i++) teil({ x: R(-60, w), y: R(h * .2, h), vx: R(15, 50), l: R(1.8, 3), r: R(40, 90), f: "rgba(220,205,180,.10)", zieh: 15 }); },
      schnee() { const w = W(); for (let i = 0; i < 70; i++) teil({ x: R(0, w), y: R(-100, -5), vx: R(-20, 20), vy: R(40, 90), l: R(2, 3.2), r: R(2, 5), f: "rgba(255,250,240,.9)", form: "flocke", wob: 2, seed: R(0, 9), vr: R(-1, 1) }); },
      zzz() { const w = W(), h = H(); for (let i = 0; i < 6; i++) teil({ x: w * .5 + R(-60, 60), y: h * .6, vx: R(10, 30), vy: R(-50, -30), l: 2.2, r: R(18, 34), f: "#efe0c0", form: "text", txt: "Z", a: .85, wob: 2, seed: i }); dunkel = .4; },
      schwerter() { const w = W(), h = H(); for (let i = 0; i < 40; i++) { const a = R(0, 7), v = R(150, 420); teil({ x: w / 2 + R(-30, 30), y: h * .45, vx: Math.cos(a) * v, vy: Math.sin(a) * v, g: 400, l: R(.3, .7), r: 1, f: "#ffe9a0", form: "strich", lw: 2 }); } flashFarbe = "rgba(255,240,200,A)"; flashT = .25; schuettel = .2; },
      treffer() { flashFarbe = "rgba(200,40,30,A)"; flashT = .55; schuettel = .4; E.schwerter(); },
      pfeile() { const w = W(), h = H(); for (let i = 0; i < 16; i++) teil({ x: -40 - R(0, 200), y: R(h * .2, h * .7), vx: R(600, 900), vy: R(-40, 40), l: 1.4, r: 16, f: "#d8c0a0", form: "pfeil" }); },
      portal() { const w = W(), h = H(); for (let i = 0; i < 5; i++) teil({ x: w / 2, y: h * .45, l: 1.6 + i * .2, r: 5 + i * 12, f: wahl(["#c99ae8", "#a978d8", "#e8b14e"]), form: "ring" }); for (let i = 0; i < 50; i++) { const a = R(0, 7), d = R(80, 200); teil({ x: w / 2 + Math.cos(a) * d, y: h * .45 + Math.sin(a) * d, vx: -Math.cos(a) * d, vy: -Math.sin(a) * d, l: 1, r: R(2, 4), f: "#e3c8ff" }); } },
      drache() { extra.drache = { t: 0 }; dunkel = .5; schuettel = .3; setTimeout(() => E.feuer(), 900); },
      geister() { const w = W(), h = H(); for (let i = 0; i < 7; i++) teil({ x: R(w * .1, w * .9), y: h * R(.5, .9), vy: R(-70, -30), l: R(2, 3), r: R(16, 28), f: "rgba(240,235,220,.55)", form: "geist", wob: 3, seed: R(0, 9) }); dunkel = .5; },
      ranken() { const w = W(), h = H(); for (let i = 0; i < 9; i++) teil({ x: R(w * .05, w * .95), y: h + 5, l: 2.2, r: R(h * .25, h * .6), f: wahl(["#5f8a3a", "#7fa64a", "#4b6e2a"]), form: "ranke", seed: R(0, 9) }); for (let i = 0; i < 20; i++) teil({ x: R(0, w), y: R(h * .3, h), vy: R(-30, 0), l: R(1.5, 2.2), r: R(4, 7), f: "#7fa64a", form: "blatt", vr: R(-2, 2) }); },
      blaetter() { const w = W(), h = H(); for (let i = 0; i < 40; i++) teil({ x: R(-50, w), y: R(-50, h * .5), vx: R(120, 260), vy: R(30, 90), l: R(1.6, 2.6), r: R(4, 8), f: wahl(["#c4652c", "#e8b14e", "#7fa64a", "#9c4a1a"]), form: "blatt", vr: R(-5, 5), wob: 3, seed: R(0, 9) }); },
      musik() { const w = W(), h = H(); for (let i = 0; i < 16; i++) teil({ x: R(w * .2, w * .8), y: h * R(.5, .8), vx: R(-30, 30), vy: R(-110, -50), l: R(1.5, 2.4), r: R(9, 15), f: wahl(["#efe0c0", "#e8b14e", "#ffd27a"]), form: "note", wob: 3, seed: R(0, 9), vr: R(-.5, .5) }); },
      erdbeben() { schuettel = .9; const w = W(), h = H(); for (let i = 0; i < 40; i++) teil({ x: R(0, w), y: R(-40, 0), vy: R(100, 300), g: 600, l: 1.5, r: R(3, 8), f: wahl(["#6a5440", "#8a7058", "#4a3a2c"]), form: "rechteck", vr: R(-4, 4) }); },
      heilung() { const w = W(), h = H(); for (let i = 0; i < 40; i++) teil({ x: R(w * .2, w * .8), y: h * R(.4, .9), vy: R(-90, -40), l: R(1, 2), r: R(3, 6), f: wahl(["#b8e07a", "#7fa64a", "#fff2c8"]), form: wahl(["kreis", "stern"]) }); flashFarbe = "rgba(180,230,120,A)"; flashT = .3; },
      gift() { const w = W(), h = H(); for (let i = 0; i < 40; i++) teil({ x: R(w * .1, w * .9), y: h * R(.6, 1), vy: R(-80, -30), l: R(1, 2.2), r: R(3, 10), f: "rgba(140,190,60,.55)", wob: 4, seed: R(0, 9) }); flashFarbe = "rgba(110,160,40,A)"; flashT = .3; },
      sonne() { flashFarbe = "rgba(255,220,140,A)"; flashT = .5; const w = W(), h = H(); for (let i = 0; i < 18; i++) { const a = i / 18 * 6.283; teil({ x: w / 2, y: h * .3, vx: Math.cos(a) * 220, vy: Math.sin(a) * 220, l: .9, r: 1, f: "#ffe9a0", form: "strich", lw: 3 }); } },
      nacht() { dunkel = .75; const w = W(), h = H(); for (let i = 0; i < 30; i++) teil({ x: R(0, w), y: R(0, h * .5), l: R(1.5, 2.5), r: R(1, 2.5), f: "#fff6dc", form: "stern" }); },
      wellen() { const w = W(), h = H(); for (let i = 0; i < 50; i++) teil({ x: R(0, w), y: h * R(.6, 1), vx: R(-80, 80), vy: R(-220, -80), g: 450, l: R(.8, 1.4), r: R(2, 5), f: "rgba(225,215,190,.7)", form: "tropfen" }); },
      traenen() { const w = W(), h = H(); for (let i = 0; i < 22; i++) teil({ x: R(w * .3, w * .7), y: h * R(.2, .4), vy: R(40, 80), g: 300, l: 1.5, r: R(4, 7), f: "rgba(230,220,200,.75)", form: "tropfen" }); },
      federn() { const w = W(), h = H(); for (let i = 0; i < 26; i++) teil({ x: w / 2 + R(-40, 40), y: h * .45, vx: R(-160, 160), vy: R(-160, 40), g: 40, l: R(2, 3), r: R(6, 10), f: wahl(["#fff6e6", "#e9d8b8", "#c9a87a"]), form: "feder", vr: R(-3, 3), wob: 4, seed: R(0, 9) }); teil({ x: w / 2, y: h * .5, vy: -30, l: 1.8, r: 40, f: "#000", form: "huhn" }); },
      krone() { const w = W(), h = H(); teil({ x: w / 2, y: h * .38, vy: -12, l: 2, r: 52, f: "#e8b14e", form: "text", txt: "♛" }); E.funkeln(); },
      glocke() { const w = W(), h = H(); for (let i = 0; i < 3; i++) teil({ x: w / 2, y: h * .4, l: 1.2 + i * .3, r: 10 + i * 6, f: "rgba(232,177,78,.8)", form: "ring" }); },
      pizza() { const w = W(); for (let i = 0; i < 14; i++) teil({ x: R(w * .1, w * .9), y: R(-120, -20), vy: R(60, 160), g: 260, l: 2.2, r: R(14, 22), form: "pizza", vr: R(-3, 3) }); },
      lachen() { const w = W(), h = H(); for (let i = 0; i < 10; i++) teil({ x: R(w * .15, w * .85), y: h * R(.4, .8), vy: R(-80, -30), l: 1.8, r: R(16, 26), f: "#ffe9c0", form: "text", txt: wahl(["HA", "HAHA", "hihi", "😂"]), wob: 3, seed: R(0, 9) }); },
      frage() { const w = W(), h = H(); for (let i = 0; i < 9; i++) teil({ x: R(w * .15, w * .85), y: h * R(.3, .8), vy: R(-50, -20), l: 1.8, r: R(22, 36), f: "#efe0c0", form: "text", txt: "?", vr: R(-1, 1) }); },
      ausruf() { const w = W(), h = H(); teil({ x: w / 2, y: h * .4, l: 1.2, r: 60, f: "#ffd27a", form: "text", txt: "!" }); schuettel = .15; },
      fledermaeuse() { const w = W(), h = H(); for (let i = 0; i < 14; i++) teil({ x: R(-100, 0), y: R(h * .1, h * .6), vx: R(250, 450), vy: R(-50, 50), l: 2, r: R(8, 14), f: "rgba(20,10,5,.85)", form: "fledermaus", wob: 6, seed: R(0, 9) }); dunkel = .35; },
      sterne() { const w = W(), h = H(); for (let i = 0; i < 4; i++) teil({ x: R(0, w * .4), y: R(0, h * .3), vx: R(300, 500), vy: R(120, 220), l: 1.2, r: 3, f: "#fff2c8", form: "stern" }); E.nacht(); },
      steine() { E.erdbeben(); },
      wind() { E.blaetter(); E.nebel(); },
      wuerfelregen() { const w = W(); for (let i = 0; i < 24; i++) teil({ x: R(0, w), y: R(-100, -10), vy: R(100, 200), g: 400, l: 2, r: R(14, 20), f: "#efe0c0", form: "text", txt: wahl(["⚀", "⚁", "⚂", "⚃", "⚄", "⚅"]), vr: R(-5, 5) }); },
      staub() { const w = W(), h = H(); for (let i = 0; i < 30; i++) teil({ x: R(w * .1, w * .9), y: R(h * .2, h * .9), vx: R(-10, 10), vy: R(-15, 5), l: R(1.5, 2.5), r: R(1, 2.5), f: "rgba(255,230,180,.6)" }); },
      gold() { E.muenzen(); E.funkeln(); },
      insekten() { const w = W(), h = H(); for (let i = 0; i < 40; i++) teil({ x: R(0, w), y: R(0, h), vx: R(-80, 80), vy: R(-80, 80), l: R(1.5, 2.5), r: 1.6, f: "#1a120c", wob: 20, seed: R(0, 9) }); },
      eis() { flashFarbe = "rgba(245,240,230,A)"; flashT = .45; E.schnee(); },
      dunkel() { dunkel = .8; },
      kerze() { dunkel = .5; E.staub(); }
    };
    function zeige(name) { if (META.einst.ruhig) return; const f = E[name]; if (f) { f(); los(); } }
    return { zeige, namen: Object.keys(E) };
  })();

  /* Stichwort → Effekt + Ton. Reihenfolge = Vorrang. */
  const STICH = [
    [/drache|dragon|schmorgoth/i, "drache", "e_drachenbruellen"],
    [/blitz|gewitter|donner/i, "blitz", "e_donner"],
    [/explo|sprengt|kabumm|bumm|feuerball/i, "explosion", "e_knall"],
    [/pizza|lieferdienst|lieferando/i, "pizza", "n_einschenken"],
    [/huhn|hühner|gans|gänserich|hahn/i, "federn", "e_huhn"],
    [/stirbt|tot\b|tod|leiche|begraben|grab\b|sarg|wiederbeleb/i, "schaedel", "n_tod"],
    [/geist|spuk|gespenst|untot|nekro/i, "geister", "e_geisterheulen"],
    [/feuer|brennt|flamm|fackel|glut|lagerfeuer/i, "feuer", "n_feuerstoss"],
    [/gold|münze|schatz|reich|bezahl|geld|silber|kupfer/i, "muenzen", "n_muenzen"],
    [/küss|verführ|liebe|romant|heirat|hochzeit|flirt|date|herz/i, "herzen", "e_glocklein"],
    [/regen|nass|sturm|flut/i, "regen", "n_tropfen"],
    [/schnee|frost|eis\b|kalt|winter/i, "schnee", "e_schnee"],
    [/nebel|rauch|dampf/i, "nebel", "e_atem"],
    [/portal|teleport|dimension|zeitreise|riss/i, "portal", "g_zauber"],
    [/zauber|magie|magisch|arkan|beschwör|fluch|verflucht/i, "magie", "g_zauber"],
    [/schläft|schlaf|eingeschlafen|müde|gähn|langweil/i, "zzz", "n_schnarchen"],
    [/pfeil|bogen|schuss|armbrust/i, "pfeile", "n_pfeil"],
    [/kampf|schwert|klinge|angriff|schlägt|hieb|duell|prügel|axt/i, "schwerter", "n_klingen"],
    [/beben|einsturz|stürzt ein|lawine|stein|fels/i, "erdbeben", "n_steinschlag"],
    [/heil|trank|gesund|segen/i, "heilung", "fx_wn_heilung"],
    [/gift|stink|pups|furz|ekel|schleim/i, "gift", "g_schleim"],
    [/ranke|pflanze|wald|baum|druide|blume/i, "ranken", "fx_wn_ranken"],
    [/lied|singt|sing|musik|laute|ukulele|flöte|tanz|barde/i, "musik", "n_applaus"],
    [/lach|witz|kicher|gacker/i, "lachen", "n_lachen"],
    [/wein|heul|traurig|tränen/i, "traenen", "n_wehklagen"],
    [/meer|see\b|schiff|wasser|fluss|ertrink|schwimm/i, "wellen", "n_platsch"],
    [/fledermaus|vampir/i, "fledermaeuse", "n_fledermaus"],
    [/krone|könig|thron|kaiser/i, "krone", "e_fernglocken"],
    [/glocke|läutet/i, "glocke", "n_glocke"],
    [/würfel|w20|w6/i, "wuerfelregen", "fx_ca_dice_throw_1"],
    [/wolf|heult/i, "nacht", "n_wolf"],
    [/nacht|dunkel|mond/i, "nacht", "e_eule"],
    [/sonne|licht|morgen|tag\b/i, "sonne", "e_vogel"],
    [/insekt|käfer|spinne|bienen|fliege/i, "insekten", "e_insekt"],
    [/wind|blätter|herbst/i, "wind", "e_windstoss"],
    [/\?\?|verwirr|hä\?|keine ahnung/i, "frage", "e_raunen"],
    [/applaus|jubel|feier|party|gewonnen|sieg/i, "konfetti", "e_jubel"],
    [/buch|regel|seite|bibliothek|papier|schrift/i, "staub", "e_buch"],
    [/tür|tor\b|schloss\b|schlüssel/i, "staub", "n_tuerauf"],
    [/katze|miau/i, "staub", "e_katze"],
    [/hund|bell/i, "staub", "e_bellen"],
    [/bier|met|trink|prost|schnaps|ale\b/i, "staub", "n_trinken"],
    [/essen|koch|suppe|braten|snack|chips/i, "staub", "e_essen"]
  ];
  function stichwort(text) { for (const [re, v, t] of STICH) if (re.test(text)) return [v, t]; return null; }

  /* =====================================================================
     PORTRÄTS (SVG)
     ===================================================================== */
  function gesicht(laune) {
    const l = laune == null ? 60 : laune;
    const kurve = l > 70 ? "M38 66 Q50 76 62 66" : l > 45 ? "M39 68 Q50 72 61 68" : l > 25 ? "M39 70 L61 70" : "M38 73 Q50 63 62 73";
    const brauen = l < 30 ? '<path d="M35 44 L45 48 M65 44 L55 48" stroke="#2b1d12" stroke-width="2.5" stroke-linecap="round"/>' : "";
    return '<circle cx="41" cy="54" r="3.6" fill="#2b1d12"/><circle cx="59" cy="54" r="3.6" fill="#2b1d12"/>' + brauen + '<path d="' + kurve + '" fill="none" stroke="#2b1d12" stroke-width="3" stroke-linecap="round"/>';
  }
  const ACCESSOIRE = {
    power: '<path d="M22 40 L30 18 L40 34 L50 14 L60 34 L70 18 L78 40 Z" fill="#c0442f" stroke="#7a2418" stroke-width="2"/>',
    rolle: '<path d="M20 44 Q50 4 80 44 Q72 26 50 24 Q28 26 20 44Z" fill="#6a3f8a"/><circle cx="50" cy="20" r="5" fill="#e8b14e"/>',
    regel: '<rect x="30" y="47" width="16" height="11" rx="4" fill="none" stroke="#2b1d12" stroke-width="2.5"/><rect x="54" y="47" width="16" height="11" rx="4" fill="none" stroke="#2b1d12" stroke-width="2.5"/><path d="M46 52 L54 52" stroke="#2b1d12" stroke-width="2.5"/>',
    chaos: '<path d="M26 34 L20 18 L34 28 L38 12 L46 28 L54 10 L60 28 L70 14 L70 32 L82 26 L74 40Z" fill="#d9822b"/>',
    snack: '<path d="M66 70 l14 -6 l4 10 l-14 6z" fill="#e8b14e" stroke="#8a5a10" stroke-width="1.5"/>',
    taktik: '<path d="M22 38 Q50 20 78 38 L78 42 L22 42Z" fill="#4b6e2a"/><rect x="45" y="22" width="10" height="8" fill="#e8b14e"/>',
    neu: '<path d="M30 30 Q50 12 70 30" fill="none" stroke="#c9a24a" stroke-width="6" stroke-linecap="round"/><text x="74" y="30" font-size="18" font-weight="800" fill="#7b3b1d">?</text>',
    veteran: '<path d="M28 76 Q50 98 72 76 Q66 86 50 88 Q34 86 28 76Z" fill="#d8d0c0"/><path d="M30 40 Q50 32 70 40" stroke="#d8d0c0" stroke-width="4" fill="none"/>',
    handy: '<rect x="66" y="58" width="13" height="22" rx="3" fill="#2b1d12"/><rect x="68" y="61" width="9" height="15" fill="#e8b14e"/>',
    drama: '<path d="M20 30 Q50 10 80 30 L76 36 Q50 22 24 36Z" fill="#b8376a"/><path d="M76 34 q10 0 8 12" stroke="#e8b14e" stroke-width="3" fill="none"/>',
    kunst: '<path d="M24 36 Q50 16 76 36 Q50 28 24 36Z" fill="#5f8a5a"/><path d="M70 66 L86 50" stroke="#c0442f" stroke-width="4" stroke-linecap="round"/>',
    musik: '<path d="M68 62 q14 -2 16 10 q-8 10 -18 2z" fill="#a7713a"/><path d="M74 64 L84 40" stroke="#5a3d27" stroke-width="3"/>'
  };
  function portraitSpieler(typ, laune, name) {
    const T = TYPEN[typ] || TYPEN.neu;
    return '<svg viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="52" r="40" fill="' + T.farbe + '" opacity=".3"/><circle cx="50" cy="56" r="30" fill="#f1d3a8" stroke="#8a5a30" stroke-width="2.5"/>' + gesicht(laune) + (ACCESSOIRE[typ] || "") + "</svg>";
  }
  const SYMBOLE = {
    sl: '<path d="M14 30 L50 18 L86 30 L80 82 L50 90 L20 82Z" fill="#5b3a22" stroke="#e8b14e" stroke-width="3"/><text x="50" y="66" font-size="34" text-anchor="middle" fill="#e8b14e" font-family="serif">SL</text>',
    npc: '<circle cx="50" cy="40" r="20" fill="#d8b080" stroke="#7a5030" stroke-width="2.5"/><path d="M18 90 Q50 50 82 90Z" fill="#8a5a30"/><path d="M28 34 Q50 6 72 34 Q50 22 28 34Z" fill="#5a3d27"/>',
    schurke: '<circle cx="50" cy="46" r="26" fill="#3a2414"/><path d="M28 42 L42 48 M72 42 L58 48" stroke="#ff7a3a" stroke-width="4" stroke-linecap="round"/><path d="M38 64 Q50 56 62 64" stroke="#ff7a3a" stroke-width="3" fill="none"/><path d="M24 30 L32 10 L40 26 M76 30 L68 10 L60 26" stroke="#3a2414" stroke-width="6" fill="none"/>',
    tisch: '<ellipse cx="50" cy="62" rx="40" ry="16" fill="#6e4a2c" stroke="#3a2414" stroke-width="2.5"/><rect x="40" y="30" width="8" height="26" fill="#efe0c0"/><path d="M44 30 q-4 -8 0 -14 q4 6 0 14" fill="#ffb648"/><circle cx="64" cy="56" r="6" fill="#c0442f"/>',
    welt: '<circle cx="50" cy="50" r="34" fill="#7fa64a" stroke="#3f5d1c" stroke-width="2.5"/><path d="M26 44 q10 -10 22 0 t24 4 M30 62 q12 -6 26 2" stroke="#3f5d1c" stroke-width="3" fill="none"/>',
    wuerfel: '<path d="M50 10 L86 32 L86 70 L50 92 L14 70 L14 32Z" fill="#efe0c0" stroke="#7b3b1d" stroke-width="3"/><path d="M50 10 L50 92 M14 32 L86 70 M86 32 L14 70" stroke="#7b3b1d" stroke-width="1.5" opacity=".5"/><text x="50" y="60" font-size="22" text-anchor="middle" fill="#7b3b1d" font-weight="800">20</text>',
    gast: '<circle cx="50" cy="40" r="18" fill="#e9c9a0" stroke="#7a5030" stroke-width="2.5"/><path d="M20 90 Q50 52 80 90Z" fill="#a7713a"/><circle cx="43" cy="40" r="2.5" fill="#2b1d12"/><circle cx="57" cy="40" r="2.5" fill="#2b1d12"/>',
    katze: '<path d="M24 34 L30 14 L42 28 Q50 26 58 28 L70 14 L76 34 Q84 52 72 70 Q50 84 28 70 Q16 52 24 34Z" fill="#3a2a1e"/><circle cx="40" cy="46" r="5" fill="#e8b14e"/><circle cx="60" cy="46" r="5" fill="#e8b14e"/><path d="M46 58 L50 62 L54 58" stroke="#e8b14e" stroke-width="2" fill="none"/>',
    regelbuch: '<rect x="20" y="16" width="60" height="72" rx="5" fill="#8f3f1a" stroke="#4a2010" stroke-width="3"/><rect x="28" y="24" width="44" height="18" fill="#e8b14e" opacity=".8"/><path d="M28 54 H72 M28 62 H66 M28 70 H70" stroke="#efe0c0" stroke-width="2"/>',
    geist: '<path d="M22 50 Q22 16 50 16 Q78 16 78 50 L78 88 L68 80 L58 88 L50 80 L42 88 L32 80 L22 88Z" fill="#efe9dc" stroke="#9a8f80" stroke-width="2.5"/><circle cx="40" cy="44" r="5" fill="#2b1d12"/><circle cx="60" cy="44" r="5" fill="#2b1d12"/>',
    gott: '<circle cx="50" cy="50" r="36" fill="#ffd27a" opacity=".4"/><circle cx="50" cy="50" r="22" fill="#ffe9a0" stroke="#e8b14e" stroke-width="3"/><path d="M50 8 V20 M50 80 V92 M8 50 H20 M80 50 H92" stroke="#e8b14e" stroke-width="4"/>'
  };
  function portraitSymbol(k) { return '<svg viewBox="0 0 100 100" aria-hidden="true">' + (SYMBOLE[k] || SYMBOLE.npc) + "</svg>"; }

  /* =====================================================================
     SPIELZUSTAND
     ===================================================================== */
  const hatWerkzeug = k => { const w = WERKZEUGE.find(x => x.k === k); return w && META.stufe >= w.stufe && !(RUN && RUN.hr && RUN.hr.includes("eisern")); };
  const hr = k => RUN && RUN.hr && RUN.hr.includes(k);

  function neuerHeld(sp, ahn) {
    const name = ahn ? ahn.name.split(" ")[0] + (zz() < .5 ? " der Zweite" : " Junior") : wahl(HELDENNAMEN);
    const h = { name, volk: wahl(VOELKER), klasse: wahl(KLASSEN), eigen: wahl(EIGEN), stufe: Math.max(1, RUN ? Math.round(durchschnittStufe() * .6) : 1), id: Math.random().toString(36).slice(2, 8) };
    if (sp.typ === "power" && zz() < .5) h.name = wahl(["Schattenklinge", "Nachtblut", "Dunkelherz", "Todesfaust", "Klingensturm"]);
    if (sp.typ === "rolle" && zz() < .5) h.eigen = "hat eine 14-seitige Hintergrundgeschichte";
    META.stats.helden++;
    return h;
  }
  function neuerSpieler(typ) {
    const belegt = new Set((RUN ? RUN.spieler : []).map(s => s.name));
    const freieTypen = Object.keys(TYPEN).filter(t => !(RUN && RUN.spieler.some(s => s.typ === t && !s.weg)));
    const sp = { name: wahl(SPIELERNAMEN.filter(n => !belegt.has(n))) || wahl(SPIELERNAMEN), typ: typ || wahl(freieTypen.length ? freieTypen : Object.keys(TYPEN)), laune: zi(55, 75), tode: 0 };
    sp.held = neuerHeld(sp);
    META.stats.spieler++;
    return sp;
  }
  const aktiveSpieler = () => RUN.spieler.filter(s => !s.weg);
  function durchschnittStufe() { const a = aktiveSpieler(); return a.length ? a.reduce((x, s) => x + s.held.stufe, 0) / a.length : 1; }

  function neueKampagne() {
    const ort = wahl(ORTE);
    let schurke = wahl(SCHURKEN);
    if (META.welt.schurken.length && zz() < .25) schurke = wahl(META.welt.schurken);
    const titel = wahl(TITELMUSTER).replace("{ort}", ort.replace(/^(den|die|das) /, "")).replace("{schurke}", schurke);
    RUN.k = { nr: (RUN.k ? RUN.k.nr : 0) + 1, titel, ort, schurke, platz: wahl(SCHAUPLATZ), sessions: zi(4, 6) - (hr("kurz") ? 1 : 0), session: 0, karte: 0, akt: 1, flags: {}, benutzt: {}, tote: [], log: [], plot: 0, werkzeug: {} };
    neueSession(true);
  }
  function sessionLaenge() { return (hr("kurz") ? 6 : 11) + zi(0, 3); }
  function neueSession(erste) {
    const k = RUN.k;
    k.session++; k.karte = 0; k.laenge = sessionLaenge(); k.wzSession = {};
    k.akt = k.session <= Math.ceil(k.sessions / 3) ? 1 : k.session < k.sessions ? 2 : 3;
    if (erste) k.werkzeug = {};
  }
  function neuerRun(opt) {
    opt = opt || {};
    if (opt.tages) { const d = new Date(), s = d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate(); Z.s = (s * 2654435761) >>> 0; } else Z.s = (Math.random() * 4294967296) >>> 0;
    RUN = { v: 1, b: { m: 50, l: 50, s: 50, t: 50 }, spieler: [], karten: 0, hr: opt.hr || [], tages: !!opt.tages, queue: [], einmal: {}, start: Date.now(), xp: 0, verlauf: [] };
    const start = hatWerkzeug("start");
    for (const k of "mlst") RUN.b[k] = start ? zi(46, 54) : zi(40, 60);
    const anzahl = hr("grosse") ? 6 : start ? 5 : 4;
    const typen = mischen(Object.keys(TYPEN)).slice(0, anzahl);
    for (const t of typen) RUN.spieler.push(neuerSpieler(t));
    META.stats.runden++;
    if (opt.tages) erfolg("tages");
    neueKampagne();
    aktuelle = null;
    naechsteKarte();
  }

  /* ---------- Bedingungen ---------- */
  function pruefe(bed, ctx) {
    for (const b of bed) {
      let m;
      if ((m = b.match(/^([mlst])([<>]=?)(\d+)$/))) { const v = RUN.b[m[1]], z = +m[3]; if (!(m[2] === "<" ? v < z : m[2] === ">" ? v > z : m[2] === "<=" ? v <= z : v >= z)) return false; }
      else if ((m = b.match(/^(akt|sess|kamp|tote|stufe|spieler|laune|meta|karten)([<>=])(\d+)$/))) {
        const wert = { akt: RUN.k.akt, sess: RUN.k.session, kamp: RUN.k.nr, tote: RUN.k.tote.length, stufe: durchschnittStufe(), spieler: aktiveSpieler().length, laune: ctx.sp ? ctx.sp.laune : 50, meta: META.stufe, karten: RUN.karten }[m[1]];
        const z = +m[3]; if (!(m[2] === "<" ? wert < z : m[2] === ">" ? wert > z : wert === z)) return false;
      }
      else if (b === "legende") { if (!META.welt.legenden.length) return false; }
      else if (b === "gefallen") { if (!META.welt.gefallene.length) return false; }
      else if ((m = b.match(/^hr:(\w+)$/))) { if (!hr(m[1])) return false; }
      else if ((m = b.match(/^typ:(\w+)$/))) { if (!aktiveSpieler().some(s => s.typ === m[1])) return false; }
      else if (b[0] === "!") { if (RUN.k.flags[b.slice(1)] || RUN.flags && RUN.flags[b.slice(1)]) return false; }
      else if (!(RUN.k.flags[b] || (RUN.flags && RUN.flags[b]))) return false;
    }
    return true;
  }

  /* ---------- Sprecher & Platzhalter ---------- */
  function sprecherFinden(k) {
    if (TYPEN[k.wer]) { const kand = aktiveSpieler().filter(s => s.typ === k.wer); return kand.length ? { sp: wahl(kand) } : null; }
    if (k.wer === "spieler") { const a = aktiveSpieler(); return a.length ? { sp: wahl(a) } : null; }
    if (k.wer === "geist") { return RUN.k.tote.length || META.welt.gefallene.length ? { sym: "geist" } : null; }
    return { sym: k.wer };
  }
  function fuelle(ctx) {
    const a = aktiveSpieler();
    const andere = a.filter(s => s !== ctx.sp);
    const anderer = andere.length ? wahl(andere) : ctx.sp || a[0];
    const tot = RUN.k.tote.length ? RUN.k.tote[RUN.k.tote.length - 1] : (META.welt.gefallene.length ? wahl(META.welt.gefallene) : { name: "Grimbold" });
    const leg = META.welt.legenden.length ? wahl(META.welt.legenden) : { name: "Grimbold der Erste", spieler: "jemand" };
    return {
      name: ctx.sp ? ctx.sp.name : "", held: ctx.sp ? ctx.sp.held.name : "", klasse: ctx.sp ? ctx.sp.held.klasse : "", volk: ctx.sp ? ctx.sp.held.volk : "", eigen: ctx.sp ? ctx.sp.held.eigen : "",
      anderer: anderer ? anderer.name : "", aheld: anderer ? anderer.held.name : "", aklasse: anderer ? anderer.held.klasse : "",
      schurke: RUN.k.schurke, schurkeN: RUN.k.schurke.replace(/^(der|die|das) /, ""), ort: RUN.k.ort, kampagne: RUN.k.titel, npc: (() => { const n = wahl(NPCS); return n; })(), monster: wahl(MONSTER), item: wahl(DINGE), gott: wahl(GOETTER),
      tot: tot.name, legende: leg.name, zahl: zi(3, 17), stufe: ctx.sp ? ctx.sp.held.stufe : 1, sl: "du"
    };
  }
  const ersetze = (t, f) => satz(t.replace(/\{(\w+)\}/g, (_, k) => k === "npcN" ? String(f.npc).replace(/^(der|die|das) /, "") : f[k] != null ? f[k] : "{" + k + "}"));
  const satz = t => t.replace(/(^|[.!?]\s+|„)([a-zäöü])/g, (m, a, b) => a + b.toUpperCase());
  function grossAnfang(t) { return t.charAt(0).toUpperCase() + t.slice(1); }

  /* ---------- Karte ziehen ---------- */
  let aktuelle = null;
  function phaseJetzt() {
    const k = RUN.k;
    if (k.karte === 0) return k.session === 1 ? (RUN.k.nr === 1 ? "rstart" : "kstart") : "start";
    if (k.karte >= k.laenge - 1) return k.session >= k.sessions ? "finale" : "ende";
    return "mitte";
  }
  function kandidaten(phase) {
    const out = [];
    for (const k of ZIEHBAR) {
      if (k.phase !== phase && !(phase === "rstart" && k.phase === "kstart")) continue;
      if (RUN.k.benutzt[k.id]) continue;
      if (k.einmal && RUN.einmal[k.id]) continue;
      if (k.nurhr && !hr(k.nurhr)) continue;
      const ctx = sprecherFinden(k); if (!ctx) continue;
      if (k.wenn.length && !pruefe(k.wenn, ctx)) continue;
      let g = k.g;
      if (hr("wuerfel") && (k.opt[0].w.wurf || k.opt[1].w.wurf)) g *= 3;
      if (hr("trash") && k.trash) g *= 2.5;
      if (ctx.sp && ctx.sp.laune < 30 && k.wenn.some(b => b.startsWith("laune<"))) g *= 3;
      if (!META.gesehen[k.id]) g *= 1.35;
      out.push({ k, ctx, g });
    }
    return out;
  }
  function ziehe() {
    // 1) Sonderfälle: Spieler will gehen / Neuer am Tisch
    const genervt = aktiveSpieler().find(s => s.laune <= 0);
    if (genervt) return sonderGehen(genervt);
    if (RUN.k.karte === 0 && RUN.k.nachrueck) { RUN.k.nachrueck = false; return sonderNeu(); }
    // 2) Kette
    for (let i = 0; i < RUN.queue.length; i++) {
      const q = RUN.queue[i];
      if (q.ab <= RUN.karten) {
        RUN.queue.splice(i, 1);
        const k = KARTE[q.id]; if (!k) break;
        const ctx = q.sp != null ? { sp: RUN.spieler[q.sp] && !RUN.spieler[q.sp].weg ? RUN.spieler[q.sp] : (sprecherFinden(k) || {}).sp } : sprecherFinden(k);
        if (ctx && (!k.wenn.length || pruefe(k.wenn, ctx))) return { k, ctx };
        break;
      }
    }
    // 3) Stapel
    let ph = phaseJetzt(), kand = kandidaten(ph);
    if (!kand.length && ph !== "mitte") kand = kandidaten("mitte");
    if (!kand.length) { RUN.k.benutzt = {}; kand = kandidaten(ph); if (!kand.length) kand = kandidaten("mitte"); }
    if (!kand.length) return { k: KARTE.notfall || ZIEHBAR[0], ctx: { sp: aktiveSpieler()[0] } };
    let summe = kand.reduce((a, x) => a + x.g, 0), r = zz() * summe;
    for (const x of kand) { r -= x.g; if (r <= 0) return x; }
    return kand[kand.length - 1];
  }
  function sonderGehen(sp) {
    const k = { id: "_gehen", wer: "spieler", sonder: true, text: "{name} packt die Würfel ein. „Sorry, ich glaub, das ist nichts mehr für mich.“", opt: [
      { label: "Bitte bleib!", w: parseWirkung("W13 laune+40 ? : geht s-4"), folge: "{name} seufzt und bleibt. „Na gut. Aber nur wegen der Snacks.“ :: Die Tür fällt ins Schloss. Ein Stuhl bleibt leer." },
      { label: "Lass gehen", w: parseWirkung("geht s+2 t+3"), folge: "{name} geht. Ehrlich gesagt ist die Stimmung danach etwas entspannter." }] };
    return { k, ctx: { sp } };
  }
  function sonderNeu() {
    const sp = neuerSpieler();
    const leg = META.welt.legenden.length && zz() < .35 ? wahl(META.welt.legenden) : null;
    if (leg) { sp.held = neuerHeld(sp, leg); sp.ahn = leg.name; }
    RUN.kandidat = sp;
    const k = { id: "_neu", wer: "gast", sonder: true, text: "Es klingelt. Vor der Tür steht " + sp.name + " (" + TYPEN[sp.typ].titel + "). „Ich hab gehört, ihr sucht noch jemanden?“ Im Gepäck: " + sp.held.name + ", " + sp.held.volk + "-" + sp.held.klasse + (leg ? " – Nachfahre der Legende " + leg.name + "!" : "") + ".", opt: [
      { label: "Wir sind voll", w: parseWirkung("t+2"), folge: sp.name + " zieht weiter. Vielleicht ein andermal." },
      { label: "Rein mit dir!", w: parseWirkung("aufnehmen s+3 t-2"), folge: sp.name + " zieht einen Stuhl heran. " + TYPEN[sp.typ].motto }] };
    return { k, ctx: { sym: "gast" } };
  }

  function naechsteKarte() {
    if (!RUN) return;
    const x = ziehe();
    const f = fuelle(x.ctx);
    aktuelle = { k: x.k, ctx: x.ctx, f, text: ersetze(x.k.text, f) };
    if (!x.k.sonder) { RUN.k.benutzt[x.k.id] = 1; if (x.k.einmal) RUN.einmal[x.k.id] = 1; }
    if (!META.gesehen[x.k.id] && !x.k.sonder) META.gesehen[x.k.id] = 1;
    zeigeKarte();
    if (x.k.ort && ATMO[x.k.ort]) Ton.atmo(ATMO[x.k.ort]);
    else if (RUN.k.karte === 0) Ton.atmo(ATMO[RUN.k.platz === "wueste" ? "wueste" : RUN.k.platz] || ATMO.tisch);
    speichern();
  }

  /* ---------- Wirkung anwenden ---------- */
  function wuerfeln(dc) {
    let r = zi(1, 20);
    const extra = [];
    if (RUN.k.wzNext === "doppel") { const r2 = zi(1, 20); extra.push("zwei Würfel: " + r + " & " + r2); r = Math.max(r, r2); RUN.k.wzNext = null; }
    const bonus = hatWerkzeug("glueck") ? 2 : 0;
    let ok = r === 20 || (r !== 1 && r + bonus >= dc);
    let gefaelscht = false;
    if (!ok && RUN.k.wzNext === "schirm") { ok = true; gefaelscht = true; RUN.k.wzNext = null; }
    META.stats.wuerfe++;
    if (META.stats.wuerfe >= 50) erfolg("wuerfel50");
    if (r === 20) { META.stats.nat20++; erfolg("nat20"); }
    if (r === 1) { META.stats.nat1++; erfolg("nat1"); }
    return { r, ok, bonus, gefaelscht, extra };
  }
  function anwenden(seite) {
    const k = aktuelle.k, o = k.opt[seite], ctx = aktuelle.ctx, f = aktuelle.f;
    let ops = o.w.ok, folge = o.folge, wurf = null;
    if (o.w.wurf) {
      wurf = wuerfeln(o.w.wurf);
      ops = wurf.ok ? o.w.ok : o.w.nein;
      const teile = folge.split("::");
      folge = (wurf.ok ? teile[0] : (teile[1] || teile[0])).trim();
    }
    const krit = wurf && hr("krit") && (wurf.r === 20 || wurf.r === 1) ? 2 : 1;
    const ereignisse = [];
    const delta = { m: 0, l: 0, s: 0, t: 0 };
    const eskal = STAERKE * (1 + Math.min(.6, (RUN.k.nr - 1) * .08));
    for (const op of ops) {
      let m;
      if ((m = op.match(/^([mlst])([+-]\d+)$/))) {
        let d = +m[2] * eskal;
        if (krit > 1 && ((wurf.r === 20 && d > 0) || (wurf.r === 1 && d < 0))) d *= 2;
        if (m[1] === "l" && hr("trash")) d *= 1.5;
        if (m[1] === "t" && hr("snacks")) d *= 1.3;
        if (m[1] === "s" && hr("snacks") && d < 0) d *= .7;
        delta[m[1]] += d;
      }
      else if ((m = op.match(/^laune([+-]\d+)$/))) { if (ctx.sp) ctx.sp.laune = clamp(ctx.sp.laune + +m[1], 0, 100); }
      else if ((m = op.match(/^alle([+-]\d+)$/))) aktiveSpieler().forEach(s => s.laune = clamp(s.laune + +m[1], 0, 100));
      else if ((m = op.match(/^xp\+(\d+)$/))) RUN.xp += +m[1];
      else if ((m = op.match(/^plot([+-]\d+)$/))) RUN.k.plot += +m[1];
      else if (op === "tod" || op === "tod2") {
        const opfer = op === "tod" && ctx.sp ? ctx.sp : wahl(aktiveSpieler().filter(s => s !== ctx.sp).concat(op === "tod" ? [] : [])) || ctx.sp || wahl(aktiveSpieler());
        if (opfer) ereignisse.push(heldStirbt(opfer));
      }
      else if (op === "tpk") { if (RUN.k.wzPlot || (hatWerkzeug("plot") && !hr("hardcore") && werkzeugRest("plot") > 0)) { werkzeugNutzen("plot", true); ereignisse.push({ t: "Plot-Rüstung! Die Gruppe überlebt knapp.", c: "gut" }); } else { aktiveSpieler().forEach(s => ereignisse.push(heldStirbt(s, true))); erfolg("tpk"); } }
      else if (op === "lvl") { aktiveSpieler().forEach(s => { s.held.stufe++; if (s.held.stufe >= 10) erfolg("stufe10held"); }); ereignisse.push({ t: "Stufenaufstieg! Alle Helden jetzt Stufe " + Math.round(durchschnittStufe()), c: "gut" }); }
      else if (op === "held") { if (ctx.sp) { ctx.sp.held = neuerHeld(ctx.sp); ereignisse.push({ t: ctx.sp.name + " spielt jetzt " + ctx.sp.held.name + " (" + ctx.sp.held.volk + "-" + ctx.sp.held.klasse + ")" }); } }
      else if (op === "geht") { if (ctx.sp) { ctx.sp.weg = true; ereignisse.push({ t: ctx.sp.name + " verlässt die Runde", c: "tod" }); RUN.k.nachrueck = true; } }
      else if (op === "neu") RUN.k.nachrueck = true;
      else if (op === "aufnehmen") { if (RUN.kandidat) { RUN.spieler.push(RUN.kandidat); if (RUN.kandidat.ahn) erfolg("nachfahre"); ereignisse.push({ t: RUN.kandidat.name + " ist dabei!", c: "gut" }); RUN.kandidat = null; } }
      else if (op === "ende") RUN.k.karte = RUN.k.laenge - 2;
      else if (op === "sieg") RUN.k.sieg = true;
      else if (op === "frieden") { RUN.k.sieg = true; erfolg("frieden"); }
      else if (op === "drache") erfolg("drache");
      else if (op === "katze") erfolg("katze");
      else if (op === "geist") erfolg("geist");
      else if ((m = op.match(/^\+(\w+)$/))) { if (m[1].startsWith("w_")) { RUN.flags = RUN.flags || {}; RUN.flags[m[1]] = 1; } else RUN.k.flags[m[1]] = 1; }
      else if ((m = op.match(/^-(\w+)$/))) { delete RUN.k.flags[m[1]]; if (RUN.flags) delete RUN.flags[m[1]]; }
      else if ((m = op.match(/^>>(\w+)$/))) RUN.queue.push({ id: m[1], ab: RUN.karten + zi(3, 7), sp: ctx.sp ? RUN.spieler.indexOf(ctx.sp) : null });
      else if ((m = op.match(/^>(\w+)$/))) RUN.queue.unshift({ id: m[1], ab: RUN.karten + 1, sp: ctx.sp ? RUN.spieler.indexOf(ctx.sp) : null });
    }
    // Balken bewegen
    const vorher = Object.assign({}, RUN.b);
    RUN.drift = RUN.drift || { m: 0, l: 0, s: 0, t: 0 };
    for (const b of "mlst") {
      RUN.drift[b] += DRIFT[b] * STAERKE * (hr("snacks") && b === "s" ? .6 : 1);
      const ganz = RUN.drift[b] > 0 ? Math.floor(RUN.drift[b]) : Math.ceil(RUN.drift[b]);
      RUN.drift[b] -= ganz;
      RUN.b[b] = clamp(Math.round(RUN.b[b] + delta[b] + ganz), 0, 100);
    }
    launeNachKarte(delta);
    RUN.karten++; RUN.k.karte++;
    META.stats.karten++;
    RUN.xp += 1;
    erfolg("erste");
    if (RUN.karten >= 100) erfolg("karten100");
    if (RUN.karten >= 300) erfolg("karten300");
    if (META.stats.karten >= 1000) erfolg("karten1000");
    const gesehen = Object.keys(META.gesehen).length;
    if (gesehen >= 250) erfolg("sammler");
    if (gesehen >= 500) erfolg("sammler2");
    const folgeText = grossAnfang(ersetze(folge || "", f));
    RUN.k.log.push({ t: folgeText || o.label, sess: RUN.k.session });
    if (RUN.k.log.length > 80) RUN.k.log.shift();
    RUN.verlauf.push(o.label);
    // Effekt & Ton
    let viz = o.viz, ton = null;
    if (viz && viz.includes(":")) { [viz, ton] = viz.split(":"); }
    const sw = stichwort(folgeText + " " + o.label + " " + (viz ? "" : aktuelle.text));
    if (!viz && sw) viz = sw[0];
    if (!ton && sw) ton = sw[1];
    if (!viz) viz = (delta.s > 4 ? "konfetti" : delta.s < -4 ? "traenen" : delta.m > 4 ? "funkeln" : "staub");
    return { folge: folgeText, wurf, ereignisse, vorher, delta, viz, ton, dc: o.w.wurf };
  }
  function heldStirbt(sp, tpk) {
    if (!tpk && !hr("hardcore") && hatWerkzeug("plot") && werkzeugRest("plot") > 0) { werkzeugNutzen("plot", true); return { t: "Plot-Rüstung rettet " + sp.held.name + "!", c: "gut" }; }
    const h = sp.held;
    RUN.k.tote.push({ name: h.name, spieler: sp.name, klasse: h.klasse, volk: h.volk, stufe: h.stufe });
    META.welt.gefallene.push({ name: h.name, spieler: sp.name, jahr: META.welt.jahr });
    if (META.welt.gefallene.length > 120) META.welt.gefallene.shift();
    META.stats.tode++; sp.tode++;
    erfolg("tod1"); if (META.stats.tode >= 25) erfolg("tod25");
    sp.laune = clamp(sp.laune - (sp.typ === "chaos" ? 2 : hr("hardcore") ? 24 : 12), 0, 100);
    sp.held = neuerHeld(sp);
    return { t: "† " + h.name + " ist gefallen – " + sp.name + " würfelt " + sp.held.name + " (" + sp.held.volk + "-" + sp.held.klasse + ")", c: "tod" };
  }
  function launeNachKarte(delta) {
    const faktor = hatWerkzeug("stamm") ? .67 : 1;
    for (const s of aktiveSpieler()) {
      const W = TYPEN[s.typ].wunsch;
      let d = 0;
      for (const b in W) {
        const v = RUN.b[b], [lo, hi] = W[b];
        if (v >= lo && v <= hi) d += 1.1; else d -= Math.min(4.5, (v < lo ? lo - v : v - hi) / 7 + .6);
      }
      for (const b of "mlst") if (RUN.b[b] < 15 || RUN.b[b] > 88) d -= 1.2;
      s.laune = clamp(s.laune + (d < 0 ? d * faktor : d), 0, 100);
    }
  }

  /* ---------- Session- und Kampagnenende ---------- */
  function balkenTot() { for (const b of "mlst") { if (RUN.b[b] <= 0) return b + "0"; if (RUN.b[b] >= 100) return b + "1"; } if (aktiveSpieler().length < 2) return "leer"; return null; }
  function sessionVorbei() { return RUN.k.karte >= RUN.k.laenge; }
  function sessionAbschluss() {
    const k = RUN.k;
    META.stats.sessions++;
    erfolg("session1");
    const imZiel = "mlst".split("").filter(b => RUN.b[b] >= ZONE[0] && RUN.b[b] <= ZONE[1]).length;
    let xp = 5 + imZiel * 2;
    if (imZiel === 4) { xp += 6; erfolg("zone"); META.stats.zoneFolge++; if (META.stats.zoneFolge >= 5) erfolg("zone5"); } else META.stats.zoneFolge = 0;
    RUN.xp += xp;
    return { imZiel, xp };
  }
  function kampagneAbschluss() {
    const k = RUN.k;
    META.stats.kampagnen++;
    RUN.kampagnenGeschafft = (RUN.kampagnenGeschafft || 0) + 1;
    erfolg("kampagne1");
    if (META.stats.kampagnen >= 5) erfolg("kampagne5");
    if (RUN.kampagnenGeschafft >= 3) erfolg("kampagne3run");
    if (hr("hardcore")) erfolg("hardcore");
    const ueberlebende = aktiveSpieler().map(s => ({ name: s.held.name, spieler: s.name, klasse: s.held.klasse, volk: s.held.volk, stufe: s.held.stufe }));
    for (const u of ueberlebende) { META.welt.legenden.push(Object.assign({ jahr: META.welt.jahr, kampagne: k.titel }, u)); META.stats.legenden++; }
    if (META.welt.legenden.length > 80) META.welt.legenden.splice(0, META.welt.legenden.length - 80);
    if (META.stats.legenden >= 5) erfolg("legende5");
    const v = aktiveSpieler().find(s => s.typ === "veteran" && s.laune > 60); if (v) erfolg("veteran");
    if (!k.sieg && RUN.k.flags.boss_besiegt) k.sieg = true;
    META.welt.chronik.push({ jahr: META.welt.jahr, titel: k.titel, schurke: k.schurke, sieg: !!k.sieg, helden: ueberlebende.map(u => u.name), tote: k.tote.map(t => t.name), tisch: aktiveSpieler().map(s => s.name) });
    if (META.welt.chronik.length > 200) META.welt.chronik.shift();
    if (!k.sieg && !META.welt.schurken.includes(k.schurke)) META.welt.schurken.push(k.schurke);
    if (k.sieg) META.welt.schurken = META.welt.schurken.filter(s => s !== k.schurke);
    META.welt.jahr += zi(1, 3);
    const xp = 25 + k.sessions * 3;
    RUN.xp += xp;
    // Wer geht nach der Kampagne?
    const gehen = [];
    for (const s of aktiveSpieler()) if (s.laune < 40 && zz() < .5) { s.weg = true; gehen.push(s.name); }
    // Balken atmen durch
    for (const b of "mlst") RUN.b[b] = Math.round(RUN.b[b] + (50 - RUN.b[b]) * .4);
    if (hatWerkzeug("legende")) aktiveSpieler().forEach(s => s.laune = clamp(s.laune + 12, 0, 100));
    aktiveSpieler().forEach(s => { s.laune = clamp(s.laune + 8, 0, 100); s.held = neuerHeld(s); });
    const alt = { titel: k.titel, sieg: k.sieg, schurke: k.schurke, tote: k.tote.length, helden: ueberlebende, gehen, xp };
    neueKampagne();
    if (aktiveSpieler().length < 4) RUN.k.nachrueck = true;
    return alt;
  }
  function runEnde(grund) {
    const E = ENDEN[grund] || ENDEN.leer;
    META.enden[grund] = (META.enden[grund] || 0) + 1;
    if (grund === "l0") erfolg("schwachsinn");
    if (Object.keys(ENDEN).every(e => META.enden[e])) erfolg("alleenden");
    const bonus = (RUN.hr || []).reduce((a, k) => a * ((HAUSREGELN.find(h => h.k === k) || {}).bonus || 1), 1) * (RUN.tages ? 1.1 : 1);
    const xp = Math.round(RUN.xp * bonus);
    const vorher = META.stufe;
    xpDazu(xp);
    META.stats.besteKarten = Math.max(META.stats.besteKarten, RUN.karten);
    if (RUN.tages) { const d = new Date().toISOString().slice(0, 10); META.tages[d] = Math.max(META.tages[d] || 0, RUN.karten); }
    const schuld = aktiveSpieler().length ? wahl(aktiveSpieler()).name : "Jemand";
    const info = { E, grund, text: E.text.replace(/\{spieler\}/g, schuld), karten: RUN.karten, kampagnen: (RUN.kampagnenGeschafft || 0), sessions: RUN.k.session, xp, vorher, nachher: META.stufe, tote: RUN.spieler.reduce((a, s) => a + s.tode, 0), titel: RUN.k.titel };
    RUN = null; speichern();
    return info;
  }
  const xpFuer = st => Math.round(60 * Math.pow(st, 1.45));
  function xpDazu(n) {
    META.xp += n;
    while (META.xp >= xpFuer(META.stufe)) { META.xp -= xpFuer(META.stufe); META.stufe++; const w = WERKZEUGE.find(x => x.stufe === META.stufe); toast("Spielleiter-Stufe <b>" + META.stufe + "</b>" + (w ? " – neu: " + w.ic + " " + w.name : "")); }
    if (META.stufe >= 5) erfolg("stufe5"); if (META.stufe >= 10) erfolg("stufe10"); if (META.stufe >= 20) erfolg("stufe20");
  }
  function erfolg(k) {
    if (META.erfolge[k]) return;
    const e = ERFOLGE.find(x => x.k === k); if (!e) return;
    META.erfolge[k] = Date.now();
    META.xp += 10;
    toast(e.ic + " Erfolg: <b>" + e.name + "</b>");
    const hrf = HAUSREGELN.find(h => h.frei === k); if (hrf) setTimeout(() => toast("Neue Hausregel: <b>" + hrf.name + "</b>"), 1800);
  }

  /* ---------- Werkzeuge ---------- */
  function werkzeugRest(k) {
    const w = WERKZEUGE.find(x => x.k === k); if (!w || !w.je) return 0;
    const benutzt = (w.je === "session" ? RUN.k.wzSession : RUN.k.werkzeug)[k] || 0;
    return Math.max(0, w.n - benutzt);
  }
  function werkzeugNutzen(k, still) {
    const w = WERKZEUGE.find(x => x.k === k); if (!w) return;
    const ziel = w.je === "session" ? RUN.k.wzSession : RUN.k.werkzeug;
    ziel[k] = (ziel[k] || 0) + 1;
    if (still) return;
    const zurMitte = (b, n) => { RUN.b[b] = Math.round(RUN.b[b] + Math.sign(50 - RUN.b[b]) * Math.min(n, Math.abs(50 - RUN.b[b]))); };
    if (k === "pizza") { RUN.b.s = clamp(RUN.b.s + 10, 0, 100); RUN.b.t = clamp(RUN.b.t - 6, 0, 100); aktiveSpieler().forEach(s => s.laune = clamp(s.laune + 10, 0, 100)); META.stats.pizza++; if (META.stats.pizza >= 10) erfolg("pizza10"); Viz.zeige("pizza"); Ton.spiel("e_essen"); }
    if (k === "pause") { zurMitte("t", 15); Viz.zeige("staub"); Ton.spiel("e_teeaufguss"); }
    if (k === "buch") { zurMitte("l", 15); Viz.zeige("staub"); Ton.spiel("e_buch"); }
    if (k === "deus") { for (const b of "mlst") zurMitte(b, 12); RUN.b.l = clamp(RUN.b.l - 8, 0, 100); Viz.zeige("sonne"); Ton.spiel("fx_wn_heilig_1"); }
    if (k === "muse") { aktiveSpieler().forEach(s => s.laune = clamp(s.laune + 15, 0, 100)); Viz.zeige("musik"); Ton.spiel("harfe_101"); }
    if (k === "schirm") { RUN.k.wzNext = "schirm"; toast("🛡️ Der nächste Wurf gelingt."); Ton.spiel("g_leder"); }
    if (k === "doppel") { RUN.k.wzNext = "doppel"; toast("🎲 Nächster Wurf mit zwei Würfeln."); Ton.spiel("fx_ca_dice_shake_1"); }
    if (k === "skip") { Ton.spiel("e_papier"); karteWeg(0, true); return; }
    zeichneBalken(); zeichneTisch(); zeichneFuss(); speichern();
    const tot = balkenTot(); if (tot) zeigeEnde(runEnde(tot));
  }

  /* =====================================================================
     DARSTELLUNG
     ===================================================================== */
  const ICONS = {
    m: '<path d="M30 74 L62 30 L70 22 L76 24 L74 30 L66 38 L34 78 Z" fill="F"/><path d="M28 64 L40 76 M24 80 L34 70" stroke="F" stroke-width="7" stroke-linecap="round"/>',
    l: '<path d="M26 22 H66 Q74 22 74 30 V76 Q74 82 68 82 H30 Q24 82 24 76 V28 Q24 22 26 22 Z" fill="F"/><path d="M33 36 H64 M33 47 H64 M33 58 H56" stroke="#2b1d12" stroke-width="4" stroke-linecap="round" opacity=".55"/>',
    s: '<circle cx="50" cy="52" r="28" fill="F"/><circle cx="40" cy="45" r="4" fill="#2b1d12"/><circle cx="60" cy="45" r="4" fill="#2b1d12"/><path d="M36 58 Q50 72 64 58" stroke="#2b1d12" stroke-width="4" fill="none" stroke-linecap="round"/>',
    t: '<path d="M30 18 H70 M30 84 H70" stroke="F" stroke-width="7" stroke-linecap="round"/><path d="M34 20 Q34 44 50 51 Q66 44 66 20 Z M34 82 Q34 58 50 51 Q66 58 66 82 Z" fill="F"/>'
  };
  function balkenIcon(k, v) {
    const id = "cl" + k;
    const leer = ICONS[k].replace(/F/g, "rgba(255,230,190,.16)");
    const voll = ICONS[k].replace(/F/g, v < ZONE[0] || v > ZONE[1] ? "#e0573a" : "#e8b14e");
    return '<svg viewBox="0 0 100 100"><defs><clipPath id="' + id + '"><rect x="0" y="' + (100 - v) + '" width="100" height="' + v + '"/></clipPath></defs>' + leer + '<g clip-path="url(#' + id + ')">' + voll + "</g></svg>";
  }
  function zeichneBalken(vorschau) {
    const box = $("#balken");
    if (!box.children.length) box.innerHTML = BALKEN.map(b => '<div class="bk" data-k="' + b.k + '" title="' + b.name + ': ' + b.lo + ' ↔ ' + b.hi + '"><div class="bk-punkt"></div><div class="bk-icon"></div><div class="bk-name">' + b.name + '</div><div class="bk-skala"><div class="zone"></div><div class="wert"></div></div><div class="bk-pole"><span>' + b.lo + "</span><span>" + b.hi + '</span></div></div>').join("");
    if (!RUN) return;
    for (const b of BALKEN) {
      const el = box.querySelector('[data-k="' + b.k + '"]'), v = RUN.b[b.k];
      el.querySelector(".bk-icon").innerHTML = balkenIcon(b.k, v);
      const w = el.querySelector(".wert"); w.style.width = v + "%"; w.classList.toggle("warn", v < 20 || v > 85);
      el.classList.toggle("warn", v < 15 || v > 88);
      el.setAttribute("aria-label", b.name + " " + v + " von 100");
      const p = el.querySelector(".bk-punkt");
      if (vorschau && vorschau[b.k]) {
        const d = vorschau[b.k], a = Math.abs(d), gr = a >= 12 ? "gross" : a >= 6 ? "mittel" : "klein";
        p.innerHTML = '<i class="' + gr + '"></i>' + (hatWerkzeug("blick") ? "<b>" + (d === "?" ? "?" : d > 0 ? "▲" : "▼") + "</b>" : "");
      } else p.innerHTML = "";
    }
  }
  function vorschauFuer(o) {
    const v = {};
    const ops = o.w.wurf ? o.w.ok.concat(o.w.nein) : o.w.ok;
    for (const op of ops) { const m = op.match(/^([mlst])([+-]\d+)$/); if (m) v[m[1]] = (v[m[1]] && Math.sign(v[m[1]]) !== Math.sign(+m[2])) ? "?" : (v[m[1]] || 0) + +m[2]; }
    return v;
  }
  function zeichneTisch(sprecher) {
    const box = $("#tisch"); if (!RUN) { box.innerHTML = ""; return; }
    box.innerHTML = RUN.spieler.filter(s => !s.weg).map(s => {
      const farbe = s.laune > 60 ? "#7fa64a" : s.laune > 35 ? "#e8b14e" : "#e0573a";
      return '<div class="platz' + (s === sprecher ? " spricht" : "") + '" title="' + esc(s.name + " – " + TYPEN[s.typ].titel + " · " + s.held.name + ", " + s.held.volk + "-" + s.held.klasse + " (Stufe " + s.held.stufe + "), " + s.held.eigen + " · Laune " + Math.round(s.laune)) + '">' + portraitSpieler(s.typ, s.laune) + '<div class="pn">' + esc(s.name) + '</div><div class="ph">' + esc(s.held.name) + "<br>" + esc(s.held.klasse) + " " + s.held.stufe + '</div><div class="laune"><i style="width:' + s.laune + "%;background:" + farbe + '"></i></div></div>';
    }).join("");
  }
  function zeichneFuss() {
    if (!RUN) return;
    const k = RUN.k;
    $("#zaehler").innerHTML = "<b>" + esc(k.titel) + "</b><br>Kampagne " + k.nr + " · Session " + k.session + "/" + k.sessions + " · Karte " + Math.min(k.karte + 1, k.laenge) + "/" + k.laenge + " · gesamt " + RUN.karten;
    $("#kopfunter").textContent = "Jahr " + META.welt.jahr + " der Chronik";
    const wz = WERKZEUGE.filter(w => !w.passiv && hatWerkzeug(w.k));
    $("#werkzeuge").innerHTML = wz.map(w => { const r = werkzeugRest(w.k); return '<button class="wz" data-wz="' + w.k + '" title="' + esc(w.name + ": " + w.text) + '" aria-label="' + esc(w.name) + '"' + (r ? "" : " disabled") + ">" + w.ic + (r ? "<i>" + r + "</i>" : "") + "</button>"; }).join("");
  }
  function sprecherInfo(ctx, k) {
    if (ctx.sp) return { name: ctx.sp.name, rolle: TYPEN[ctx.sp.typ].titel + " · spielt " + ctx.sp.held.name, svg: portraitSpieler(ctx.sp.typ, ctx.sp.laune) };
    const s = ctx.sym || k.wer;
    const namen = { sl: ["Deine innere Stimme", "Spielleiter"], npc: [aktuelle.f.npc, "Nichtspielercharakter"], schurke: [aktuelle.f.schurke, "Der Schurke"], tisch: ["Am Tisch", "Das echte Leben"], welt: ["Die Welt", "Ereignis"], wuerfel: ["Die Würfel", "Schicksal"], gast: ["Besuch", "An der Tür"], katze: ["Würfelfresser", "Die Tischkatze"], regelbuch: ["Das Regelbuch", "Seite " + aktuelle.f.zahl * 13], geist: [aktuelle.f.tot, "Ein Geist"], gott: [aktuelle.f.gott, "Eine Gottheit"] };
    const n = namen[s] || ["?", ""];
    return { name: grossAnfang(n[0]), rolle: n[1], svg: portraitSymbol(s) };
  }
  let karteEl = null, sperre = false;
  function zeigeKarte() {
    const st = $("#stapel");
    if (karteEl) karteEl.remove();
    const k = aktuelle.k, info = sprecherInfo(aktuelle.ctx, k);
    const el = document.createElement("div"); el.className = "karte neu"; el.setAttribute("role", "group"); el.setAttribute("aria-label", info.name);
    const wurf = k.opt[0].w.wurf || k.opt[1].w.wurf;
    el.innerHTML = '<div class="wahl-schild"></div><div class="portrait">' + info.svg + '</div><div class="sprecher">' + esc(info.name) + '</div><div class="rolle">' + esc(info.rolle) + '</div><div class="text">' + esc(aktuelle.text).replace(/„([^“]+)“/g, "„<em>$1</em>“") + "</div>" +
      (wurf ? '<div class="wurf">🎲 Probe möglich</div>' : "") + '<div class="fuss"><span>' + esc(RUN.k.titel) + "</span><span>" + "" + "</span></div>";
    st.appendChild(el); karteEl = el;
    const [l, r] = k.opt;
    $("#wahl-l").lastElementChild.textContent = ersetze(l.label, aktuelle.f) + (l.w.wurf ? " 🎲" + l.w.wurf : "");
    $("#wahl-r").firstElementChild.textContent = ersetze(r.label, aktuelle.f) + (r.w.wurf ? " 🎲" + r.w.wurf : "");
    $("#wahlen").classList.remove("aus");
    $("#kopfzeile").textContent = RUN.k.karte === 0 ? (RUN.k.session === 1 ? "Kampagne " + RUN.k.nr + ": „" + RUN.k.titel + "“ beginnt." : "Session " + RUN.k.session + " – zuletzt: " + (RUN.k.log.length ? RUN.k.log[RUN.k.log.length - 1].t.slice(0, 120) : "…")) : "";
    zeichneBalken(); zeichneTisch(aktuelle.ctx.sp); zeichneFuss();
    zieherAn(el);
    sperre = false;
  }

  /* ---------- Ziehen / Wischen ---------- */
  let ziel = null;
  function zieherAn(el) {
    let sx = 0, dx = 0, aktiv = false, id = null;
    const schild = el.querySelector(".wahl-schild");
    el.addEventListener("pointerdown", e => { if (sperre || el.classList.contains("folge")) return; aktiv = true; id = e.pointerId; sx = e.clientX; dx = 0; el.setPointerCapture(id); el.classList.add("zieht"); el.classList.remove("neu"); Ton.start(); });
    el.addEventListener("pointermove", e => {
      if (!aktiv || e.pointerId !== id) return;
      dx = e.clientX - sx;
      el.style.transform = "translateX(" + dx + "px) rotate(" + dx / 18 + "deg)";
      const seite = dx < -18 ? 0 : dx > 18 ? 1 : null;
      if (seite !== ziel) { ziel = seite; markiere(seite); }
      schild.style.opacity = seite == null ? 0 : Math.min(1, Math.abs(dx) / 70);
    });
    const ende = e => {
      if (!aktiv || (e && e.pointerId !== id)) return;
      aktiv = false; el.classList.remove("zieht");
      const breite = Math.min(window.innerWidth, 420);
      if (Math.abs(dx) > breite * .28) karteWeg(dx < 0 ? 0 : 1);
      else { el.style.transform = ""; schild.style.opacity = 0; ziel = null; markiere(null); }
    };
    el.addEventListener("pointerup", ende); el.addEventListener("pointercancel", ende);
  }
  function markiere(seite) {
    if (!aktuelle || !karteEl) return;
    const schild = karteEl.querySelector(".wahl-schild");
    if (seite == null) { zeichneBalken(); return; }
    const o = aktuelle.k.opt[seite];
    schild.textContent = ersetze(o.label, aktuelle.f) + (o.w.wurf ? "  🎲 " + o.w.wurf + "+" : "");
    schild.classList.toggle("r", seite === 1);
    zeichneBalken(vorschauFuer(o));
  }
  ["l", "r"].forEach((s, i) => {
    const b = $("#wahl-" + s);
    b.addEventListener("click", () => { Ton.start(); karteWeg(i); });
    b.addEventListener("mouseenter", () => markiere(i)); b.addEventListener("focus", () => markiere(i));
    b.addEventListener("mouseleave", () => markiere(null)); b.addEventListener("blur", () => markiere(null));
  });

  function karteWeg(seite, ueberspringen) {
    if (sperre || !aktuelle || !karteEl) return;
    sperre = true;
    const el = karteEl;
    el.classList.remove("zieht", "neu"); el.style.transform = "";
    el.classList.add(seite === 0 ? "weg-l" : "weg-r");
    $("#wahlen").classList.add("aus");
    Ton.spiel("e_papier", .5);
    vib(12);
    if (ueberspringen) { setTimeout(() => { RUN.k.benutzt[aktuelle.k.id] = 1; naechsteKarte(); }, 330); return; }
    const erg = anwenden(seite);
    setTimeout(() => {
      if (erg.wurf) zeigeWurf(erg, () => zeigeFolge(erg));
      else zeigeFolge(erg);
    }, 300);
  }
  function zeigeWurf(erg, fertig) {
    const w = erg.wurf, box = document.createElement("div");
    box.className = "wuerfel rollt" + (w.r === 20 ? " krit" : w.r === 1 ? " patzer" : "");
    box.innerHTML = '<svg viewBox="0 0 100 100"><path d="M50 6 L90 30 L90 72 L50 96 L10 72 L10 30Z" fill="#efe0c0" stroke="#7b3b1d" stroke-width="3"/><path d="M50 6 L28 58 L72 58 Z M10 30 L28 58 L10 72 M90 30 L72 58 L90 72 M28 58 L50 96 L72 58" fill="none" stroke="#7b3b1d" stroke-width="1.6" opacity=".55"/><text x="50" y="52" font-size="' + (w.r > 9 ? 22 : 26) + '" text-anchor="middle" fill="#7b3b1d" font-weight="800" font-family="Alegreya Sans,sans-serif">' + w.r + "</text></svg>" +
      '<div class="erg">' + (w.r === 20 ? "Natürliche 20!" : w.r === 1 ? "Patzer!" : w.r + (w.bonus ? "+" + w.bonus : "") + " gegen " + erg.dc) + (w.gefaelscht ? " … 🛡️" : "") + "</div>";
    $("#buehne").appendChild(box);
    Ton.spiel("fx_ca_dice_shake_" + zi(1, 3)); Ton.spiel("fx_ca_dice_throw_" + zi(1, 3), .9, .35);
    setTimeout(() => { Ton.spiel(w.ok ? (w.r === 20 ? "fx_wn_heilig_2" : "glock_103") : (w.r === 1 ? "n_lachen_boese" : "e_raunen"), .8); if (w.r === 20) Viz.zeige("funkeln"); vib(w.ok ? 20 : [30, 40, 30]); }, 900);
    setTimeout(() => { box.remove(); fertig(); }, 1900);
  }
  function zeigeFolge(erg) {
    const st = $("#stapel");
    if (karteEl) karteEl.remove();
    const el = document.createElement("div"); el.className = "karte folge neu"; el.tabIndex = 0;
    const ev = erg.ereignisse.map(e => '<span class="' + (e.c || "") + '">' + esc(e.t) + "</span>").join("");
    const pfeile = "mlst".split("").filter(b => Math.round(erg.delta[b])).map(b => { const B = BALKEN.find(x => x.k === b), d = Math.round(RUN ? RUN.b[b] - erg.vorher[b] : erg.delta[b]); return d ? (B.name + " " + (d > 0 ? "+" : "") + d) : ""; }).filter(Boolean).join(" · ");
    el.innerHTML = '<div class="folge-kopf">' + (erg.wurf ? (erg.wurf.ok ? "Gelungen" : "Misslungen") : "Und dann …") + '</div><div class="text">' + esc(erg.folge || "Die Geschichte geht weiter.") + '</div><div class="ereignisse">' + ev + '</div><div class="fuss"><span>' + esc(pfeile) + '</span><span class="weiter">weiter ▸</span></div>';
    st.appendChild(el); karteEl = el;
    Viz.zeige(erg.viz);
    if (erg.ton) Ton.spiel(erg.ton, .85);
    if (erg.ereignisse.some(e => e.c === "tod")) { setTimeout(() => Ton.spiel("n_tod", .7), 500); vib([40, 60, 40]); }
    zeichneBalken(); zeichneTisch(); zeichneFuss();
    for (const b of "mlst") if (Math.round(erg.delta[b])) { const e = document.querySelector('.bk[data-k="' + b + '"]'); if (e) { e.classList.remove("stoss"); void e.offsetWidth; e.classList.add("stoss"); } }
    blasen(erg);
    let weiter = false;
    const los = () => { if (weiter) return; weiter = true; el.removeEventListener("click", los); nachFolge(); };
    el.addEventListener("click", los);
    el.focus({ preventScroll: true });
    folgeWeiter = los;
    if (META.einst.auto) setTimeout(los, 3200 + (erg.folge || "").length * 25);
    speichern();
  }
  let folgeWeiter = null;
  function blasen(erg) {
    const plaetze = document.querySelectorAll(".platz");
    aktiveSpieler().forEach((s, i) => {
      if (!plaetze[i] || zz() > .22) return;
      const typ = s.typ, l = s.laune;
      const pool = l < 25 ? ["😤", "seufz…", "boah", "📱", "gähn", "ernsthaft?"] : l > 75 ? ["YES!", "😂", "geil", "♥", "jaaa", "🎲!"] : typ === "regel" ? ["Seite 193…", "regeltechnisch…"] : typ === "snack" ? ["*knusper*", "Chips?"] : typ === "chaos" ? ["ICH WÜRFLE!", "Feuerball?"] : typ === "drama" ? ["*Monolog*", "Mein Held!"] : ["hm", "okay", "nice", "😅"];
      const b = document.createElement("div"); b.className = "blase"; b.textContent = wahl(pool); plaetze[i].appendChild(b); setTimeout(() => b.remove(), 2500);
    });
  }
  function nachFolge() {
    folgeWeiter = null;
    if (!RUN) return;
    const tot = balkenTot();
    if (tot) { const info = runEnde(tot); zeigeEnde(info); return; }
    if (sessionVorbei()) {
      const s = sessionAbschluss();
      const k = RUN.k;
      if (k.session >= k.sessions) { const alt = kampagneAbschluss(); zeigeKampagnenEnde(alt, s); return; }
      zeigeSessionEnde(s);
      return;
    }
    naechsteKarte();
  }

  /* =====================================================================
     FENSTER
     ===================================================================== */
  function fenster(html, opt) {
    opt = opt || {};
    const s = document.createElement("div"); s.className = "schicht";
    s.innerHTML = '<div class="fenster" role="dialog" aria-modal="true">' + (opt.zu === false ? "" : '<button class="zu" aria-label="Schließen">✕</button>') + html + "</div>";
    $("#schichten").appendChild(s);
    const zu = () => { s.remove(); if (opt.weg) opt.weg(); };
    const zb = s.querySelector(".zu"); if (zb) zb.addEventListener("click", zu);
    if (opt.zu !== false) s.addEventListener("click", e => { if (e.target === s) zu(); });
    s.zu = zu;
    return s;
  }
  function toast(html) { const t = document.createElement("div"); t.className = "toast"; t.innerHTML = html; document.body.appendChild(t); setTimeout(() => t.remove(), 3700); }

  function zeigeSessionEnde(s) {
    const k = RUN.k;
    const zeilen = k.log.filter(x => x.sess === k.session).slice(-5).map(x => "<li>" + esc(x.t) + "</li>").join("");
    Ton.spiel("e_fernglocken", .6);
    const f = fenster('<h2>Session ' + k.session + ' ist vorbei</h2><p class="leise">Es ist ' + zi(23, 25) % 24 + ":" + String(zi(0, 59)).padStart(2, "0") + " Uhr. " + wahl(["Alle packen die Würfel ein.", "Die Pizza ist kalt, die Stimmung warm.", "Jemand sucht noch seinen Autoschlüssel.", "Die Kerze ist heruntergebrannt.", "„Gleiche Zeit nächste Woche?“"]) + '</p><h3>Was heute geschah</h3><ul class="liste">' + zeilen + '</ul><p>' + s.imZiel + ' von 4 Balken im grünen Bereich · <b>+' + s.xp + ' Erfahrung</b></p><div class="reihe"><button class="knopf" data-los>▶ Nächste Session</button></div>', { zu: false });
    f.querySelector("[data-los]").addEventListener("click", () => { f.remove(); neueSession(); naechsteKarte(); });
    speichern();
  }
  function zeigeKampagnenEnde(alt, s) {
    Ton.spiel(alt.sieg ? "e_jubel" : "e_fernglocken", .8);
    Viz.zeige(alt.sieg ? "konfetti" : "nebel");
    const helden = alt.helden.map(h => "<li><b>" + esc(h.name) + "</b> <small>" + esc(h.volk + "-" + h.klasse + ", Stufe " + h.stufe + " · gespielt von " + h.spieler) + "</small></li>").join("");
    const f = fenster('<h2>' + (alt.sieg ? "Sieg!" : "Kampagne beendet") + '</h2><p><b>„' + esc(alt.titel) + '“</b> ist zu Ende. ' + (alt.sieg ? esc(alt.schurke) + " ist besiegt." : esc(alt.schurke) + " ist entkommen … und wird wiederkehren.") + ' ' + (alt.tote ? alt.tote + " Helden sind gefallen." : "Niemand ist gefallen.") + '</p><h3>Neue Legenden</h3><ul class="liste">' + (helden || "<li>keine</li>") + '</ul>' + (alt.gehen.length ? "<p class='leise'>Nicht mehr dabei: " + esc(alt.gehen.join(", ")) + "</p>" : "") + '<p><b>+' + (alt.xp + s.xp) + ' Erfahrung</b> · Die Chronik ist jetzt im Jahr ' + META.welt.jahr + '.</p><p class="leise">Die Runde bleibt zusammen. Neue Helden werden gewürfelt – eine neue Geschichte beginnt: <b>„' + esc(RUN.k.titel) + '“</b></p><div class="reihe"><button class="knopf" data-los>▶ Weiter erzählen</button></div>', { zu: false });
    f.querySelector("[data-los]").addEventListener("click", () => { f.remove(); naechsteKarte(); });
    speichern();
  }
  function zeigeEnde(info) {
    Ton.atmo(null); Ton.spiel("n_tod", .7); Viz.zeige(info.grund === "s1" ? "lachen" : info.grund === "m0" ? "federn" : info.grund === "t0" ? "zzz" : "schaedel");
    const f = fenster('<div class="ende-bild">' + info.E.bild + '</div><h2 style="text-align:center">' + esc(info.E.titel) + '</h2><p class="ende-text">' + esc(info.text) + '</p><h3>Deine Runde</h3><ul class="liste"><li>' + info.karten + ' Karten gespielt · ' + info.kampagnen + ' Kampagnen beendet · ' + info.tote + ' Helden gestorben</li><li>Zuletzt: „' + esc(info.titel) + '“, Session ' + info.sessions + '</li><li><b>+' + info.xp + ' Spielleiter-Erfahrung</b>' + (info.nachher > info.vorher ? " · Stufe " + info.nachher + "!" : "") + '</li><li>Bester Lauf bisher: ' + META.stats.besteKarten + ' Karten</li></ul><p class="leise">Die Welt dreht sich weiter. Deine Legenden und Gefallenen bleiben in der Chronik – und tauchen in neuen Runden wieder auf.</p><div class="reihe"><button class="knopf" data-neu>▶ Neue Runde</button><button class="knopf zweit" data-titel>Hauptmenü</button></div>', { zu: false });
    f.querySelector("[data-neu]").addEventListener("click", () => { f.remove(); neueRundeFenster(); });
    f.querySelector("[data-titel]").addEventListener("click", () => { f.remove(); titelbild(); });
  }

  function neueRundeFenster() {
    const frei = h => !!META.erfolge[h.frei];
    const tagesKey = new Date().toISOString().slice(0, 10);
    const f = fenster('<h2>Neue Runde</h2><p>Neue Spieler, neue Helden, neue Kampagne. Die Welt-Chronik bleibt.</p><h3>Hausregeln</h3>' + HAUSREGELN.map(h => '<label class="hausregel' + (frei(h) ? "" : " gesperrt") + '"><input type="checkbox" value="' + h.k + '"' + (frei(h) ? "" : " disabled") + '><span><b>' + esc(h.name) + "</b><small>" + esc(frei(h) ? h.text : "🔒 Freischalten: " + (ERFOLGE.find(e => e.k === h.frei) || {}).text) + "</small></span></label>").join("") +
      '<div class="reihe"><button class="knopf" data-los>▶ Runde starten</button><button class="knopf zweit" data-tages>📅 Tagesrunde' + (META.tages[tagesKey] ? " (heute: " + META.tages[tagesKey] + ")" : "") + '</button></div><p class="leise">Tagesrunde: Heute bekommen alle denselben Tisch, dieselbe Kampagne und denselben Kartenstapel. Wie weit kommst du?</p>');
    const regeln = () => [...f.querySelectorAll("input:checked")].map(i => i.value);
    f.querySelector("[data-los]").addEventListener("click", () => { f.remove(); schliesseTitel(); neuerRun({ hr: regeln() }); });
    f.querySelector("[data-tages]").addEventListener("click", () => { f.remove(); schliesseTitel(); neuerRun({ hr: [], tages: true }); });
  }

  function menue() {
    const f = fenster('<h2>Menü</h2><div class="reihe" style="flex-direction:column">' +
      '<button class="knopf zweit" data-a="buch">🎓 Spielleiter-Buch</button><button class="knopf zweit" data-a="chronik">📜 Welt-Chronik</button><button class="knopf zweit" data-a="tisch">👥 Am Tisch</button><button class="knopf zweit" data-a="regeln">❓ So wird gespielt</button><button class="knopf zweit" data-a="einst">⚙️ Einstellungen</button>' +
      (RUN ? '<button class="knopf zweit" data-a="aufgeben">🏳️ Runde aufgeben</button>' : "") + '<button class="knopf zweit" data-a="titel">🏠 Hauptmenü</button></div>');
    f.addEventListener("click", e => {
      const a = e.target.closest("[data-a]"); if (!a) return;
      f.remove();
      ({ buch: spielleiterBuch, chronik: chronikFenster, tisch: tischFenster, regeln: regelFenster, einst: einstellungen, titel: titelbild, aufgeben: () => { if (confirmFenster("Runde wirklich aufgeben? Die Erfahrung wird trotzdem gutgeschrieben.", () => { const info = runEnde("leer"); info.E = { titel: "Aufgegeben", bild: "🏳️", text: "" }; info.text = "Du klappst den Schirm zu. Für heute ist Schluss."; zeigeEnde(info); })) { /* */ } } })[a.dataset.a]();
    });
  }
  function confirmFenster(text, ja) {
    const f = fenster("<h2>Sicher?</h2><p>" + esc(text) + '</p><div class="reihe"><button class="knopf" data-ja>Ja</button><button class="knopf zweit" data-nein>Nein</button></div>');
    f.querySelector("[data-ja]").addEventListener("click", () => { f.remove(); ja(); });
    f.querySelector("[data-nein]").addEventListener("click", () => f.remove());
    return true;
  }
  function spielleiterBuch(tab) {
    tab = tab || "stufe";
    const n = xpFuer(META.stufe);
    const gesehen = Object.keys(META.gesehen).length, gesamt = ZIEHBAR.length + KARTEN.filter(k => k.kette).length;
    const inhalt = {
      stufe: '<p>Spielleiter-Stufe <b>' + META.stufe + '</b></p><div class="fort"><i style="width:' + Math.round(META.xp / n * 100) + '%"></i></div><p class="leise">' + META.xp + " / " + n + ' Erfahrung bis Stufe ' + (META.stufe + 1) + '</p><h3>Werkzeuge hinter dem Schirm</h3><div class="gitter">' + WERKZEUGE.map(w => '<div class="kachel' + (META.stufe >= w.stufe ? "" : " gesperrt") + '"><span class="ic">' + w.ic + "</span><b>" + esc(w.name) + "</b>" + esc(w.text) + '<br><small class="leise">' + (META.stufe >= w.stufe ? (w.passiv ? "immer aktiv" : w.n + "× je " + (w.je === "session" ? "Session" : "Kampagne")) : "ab Stufe " + w.stufe) + "</small></div>").join("") + "</div>",
      erfolge: '<p>' + Object.keys(META.erfolge).length + " von " + ERFOLGE.length + ' Erfolgen</p><div class="gitter">' + ERFOLGE.map(e => '<div class="kachel' + (META.erfolge[e.k] ? "" : " gesperrt") + '"><span class="ic">' + e.ic + "</span><b>" + esc(e.name) + "</b>" + esc(e.text) + "</div>").join("") + "</div>",
      karten: '<p>Entdeckte Karten: <b>' + gesehen + " / " + gesamt + '</b></p><div class="fort"><i style="width:' + Math.round(gesehen / gesamt * 100) + '%"></i></div><p class="leise">Jede Runde mischt den Stapel neu. Seltene Karten erscheinen nur unter bestimmten Bedingungen – bei bestimmten Spielertypen, Balkenständen, in späten Kampagnen oder nach früheren Entscheidungen.</p><h3>Enden</h3><div class="gitter">' + Object.entries(ENDEN).map(([k, e]) => '<div class="kachel' + (META.enden[k] ? "" : " gesperrt") + '"><span class="ic">' + (META.enden[k] ? e.bild : "❔") + "</span><b>" + (META.enden[k] ? esc(e.titel) : "???") + "</b>" + (META.enden[k] ? META.enden[k] + "× erlebt" : "noch nicht erlebt") + "</div>").join("") + "</div>",
      stats: '<ul class="liste">' + [["Karten gespielt", META.stats.karten], ["Bester Lauf", META.stats.besteKarten + " Karten"], ["Runden", META.stats.runden], ["Sessions", META.stats.sessions], ["Kampagnen beendet", META.stats.kampagnen], ["Helden erschaffen", META.stats.helden], ["Helden gestorben", META.stats.tode], ["Legenden", META.stats.legenden], ["Würfe", META.stats.wuerfe], ["Natürliche 20", META.stats.nat20], ["Natürliche 1", META.stats.nat1], ["Notfall-Pizzen", META.stats.pizza], ["Spieler kennengelernt", META.stats.spieler]].map(([a, b]) => "<li>" + a + ": <b>" + b + "</b></li>").join("") + "</ul>"
    };
    const f = fenster('<h2>Spielleiter-Buch</h2><div class="tabs" role="tablist">' + [["stufe", "Stufe & Werkzeuge"], ["erfolge", "Erfolge"], ["karten", "Karten & Enden"], ["stats", "Statistik"]].map(([k, n]) => '<button role="tab" data-tab="' + k + '" aria-selected="' + (k === tab) + '">' + n + "</button>").join("") + "</div>" + inhalt[tab]);
    f.querySelectorAll("[data-tab]").forEach(b => b.addEventListener("click", () => { f.remove(); spielleiterBuch(b.dataset.tab); }));
  }
  function chronikFenster() {
    const W = META.welt;
    const ch = W.chronik.slice().reverse().map(c => "<li><b>Jahr " + c.jahr + ": „" + esc(c.titel) + "“</b><br><small>" + (c.sieg ? "Sieg über " : "Ungelöst – ") + esc(c.schurke) + " · Helden: " + esc(c.helden.join(", ") || "–") + (c.tote.length ? " · Gefallen: " + esc(c.tote.join(", ")) : "") + "</small></li>").join("");
    const leg = W.legenden.slice(-30).reverse().map(l => "<li><b>" + esc(l.name) + "</b> <small>" + esc(l.volk + "-" + l.klasse + ", Stufe " + l.stufe + " · Jahr " + l.jahr + " · " + l.spieler) + "</small></li>").join("");
    const gef = W.gefallene.slice(-30).reverse().map(g => esc(g.name)).join(", ");
    fenster('<h2>Welt-Chronik</h2><p>Jahr <b>' + W.jahr + '</b>. ' + W.chronik.length + ' Geschichten wurden erzählt. Die Welt vergisst nichts.</p>' + (W.schurken.length ? "<p class='leise'>Noch auf freiem Fuß: " + esc(W.schurken.join(", ")) + "</p>" : "") + '<h3>Geschichten</h3><ul class="liste">' + (ch || "<li class='leise'>Noch keine – beende deine erste Kampagne.</li>") + '</ul><h3>Legenden</h3><ul class="liste">' + (leg || "<li class='leise'>Noch keine.</li>") + "</ul><h3>Gefallene</h3><p class='leise'>" + (gef || "Noch niemand. Noch.") + "</p>");
  }
  function tischFenster() {
    if (!RUN) { fenster("<h2>Am Tisch</h2><p>Gerade läuft keine Runde.</p>"); return; }
    fenster('<h2>Am Tisch</h2><ul class="liste">' + aktiveSpieler().map(s => {
      const W = TYPEN[s.typ].wunsch;
      const mag = Object.keys(W).map(b => { const B = BALKEN.find(x => x.k === b); return B.name + " " + W[b][0] + "–" + W[b][1]; }).join(", ");
      return '<li style="display:flex;gap:.6rem;align-items:center"><span style="width:52px;flex:none">' + portraitSpieler(s.typ, s.laune) + "</span><span><b>" + esc(s.name) + "</b> – " + esc(TYPEN[s.typ].titel) + " <small>(Laune " + Math.round(s.laune) + ")</small><br><small>" + esc(TYPEN[s.typ].motto) + " Mag: " + esc(mag) + "</small><br>Spielt <b>" + esc(s.held.name) + "</b>, " + esc(s.held.volk + "-" + s.held.klasse) + ", Stufe " + s.held.stufe + " – " + esc(s.held.eigen) + (s.tode ? "<br><small>Schon " + s.tode + " Helden verloren.</small>" : "") + "</span></li>";
    }).join("") + '</ul><p class="leise">Fällt die Laune eines Spielers auf null, will er gehen. Wer am Tisch fehlt, wird ersetzt – durch Klingeln an der Tür.</p>');
  }
  function regelFenster() {
    fenster('<h2>So wird gespielt</h2><p>Du bist die Spielleitung. Jede Karte ist ein Moment am Spieltisch. <b>Wische nach links oder rechts</b> (oder tippe auf die Knöpfe, am PC: ← / →), um zu entscheiden.</p><h3>Die vier Balken</h3><p><b>Macht</b> (mickrig ↔ OP), <b>Realismus</b> (Schwachsinn ↔ Bürokratie), <b>Spaß</b> (Pain ↔ Albern-Kollaps), <b>Tempo</b> (zäh ↔ gehetzt). Der grüne Bereich liegt etwa zwischen der Mitte und drei Vierteln. Läuft ein Balken <b>ganz leer oder ganz voll</b>, kippt die Runde – Spielende.</p><p>Beim Zielen zeigen Punkte über den Balken, welche sich bewegen (groß = viel). Ab Spielleiter-Stufe 2 siehst du auch die Richtung.</p><h3>Die Spieler</h3><p>Jeder Spielertyp mag andere Balkenstände. Ist ein Balken lange außerhalb ihres Geschmacks, sinkt die Laune – bei null wollen sie gehen. Unter zwei Spielern ist die Runde vorbei.</p><h3>Würfel</h3><p>Manche Wahl verlangt eine Probe (🎲 12 = mindestens 12 auf dem W20). Eine 20 gelingt immer, eine 1 nie.</p><h3>Für immer</h3><p>Sessions werden zu Kampagnen, Kampagnen zur Welt-Chronik. Überlebende Helden werden Legenden, Schurken kehren zurück. Deine Spielleiter-Stufe, Werkzeuge, Hausregeln und Erfolge bleiben auch nach dem Ende einer Runde.</p><p class="leise">Tastatur: ← / → oder A / D wählen, Leertaste weiter, M Menü.</p>');
  }
  function einstellungen() {
    const e = META.einst;
    const f = fenster('<h2>Einstellungen</h2><div class="schalter"><span>Atmosphäre (Hintergrundklang)</span><input type="range" min="0" max="1" step="0.05" value="' + e.atmo + '" data-e="atmo"></div><div class="schalter"><span>Effekte</span><input type="range" min="0" max="1" step="0.05" value="' + e.fx + '" data-e="fx"></div><div class="schalter"><span>Vibration</span><input type="checkbox" data-e="vib"' + (e.vib ? " checked" : "") + '></div><div class="schalter"><span>Automatisch weiterblättern</span><input type="checkbox" data-e="auto"' + (e.auto ? " checked" : "") + '></div><div class="schalter"><span>Weniger Bewegung</span><input type="checkbox" data-e="ruhig"' + (e.ruhig ? " checked" : "") + '></div><h3>Spielstand</h3><p class="leise">Alles wird nur in diesem Browser gespeichert.</p><div class="reihe"><button class="knopf zweit" data-loesch>Alles zurücksetzen</button></div><p class="leise">Klänge: echte Aufnahmen aus der Bühne von imrestales.de (freie Lizenzen, siehe amb/).</p>');
    f.addEventListener("input", ev => { const i = ev.target.closest("[data-e]"); if (!i) return; e[i.dataset.e] = i.type === "checkbox" ? i.checked : +i.value; Ton.start(); Ton.lautstaerke(); document.body.classList.toggle("ruhig", e.ruhig); speichern(); });
    f.querySelector("[data-loesch]").addEventListener("click", () => confirmFenster("Wirklich alles löschen – Stufe, Erfolge, Chronik?", () => { META = metaNeu(); RUN = null; speichern(); location.reload(); }));
  }
  function logFenster() {
    if (!RUN) return;
    const k = RUN.k;
    const zeilen = k.log.slice().reverse().map(x => "<li><small>Session " + x.sess + "</small><br>" + esc(x.t) + "</li>").join("");
    fenster('<h2>Was bisher geschah</h2><p><b>„' + esc(k.titel) + '“</b> · Schurke: ' + esc(k.schurke) + " · Schauplatz: " + esc(k.ort) + '</p>' + (k.tote.length ? "<p class='leise'>Gefallen: " + esc(k.tote.map(t => t.name).join(", ")) + "</p>" : "") + '<ul class="liste">' + (zeilen || "<li class='leise'>Die Geschichte hat gerade erst begonnen.</li>") + "</ul>");
  }

  /* ---------- Titelbild ---------- */
  let titelEl = null;
  function schliesseTitel() { if (titelEl) { titelEl.remove(); titelEl = null; } }
  function titelbild() {
    schliesseTitel();
    $("#schichten").innerHTML = "";
    const t = document.createElement("div"); t.className = "titelbild";
    const n = Object.keys(META.gesehen).length;
    t.innerHTML = '<a class="zurueck" href="index.html#taverne">← Taverne</a><svg class="schirm" viewBox="0 0 300 150" aria-hidden="true"><path d="M20 140 L40 30 L110 20 L110 140Z" fill="#5b3a22" stroke="#e8b14e" stroke-width="3"/><path d="M110 140 L110 20 L190 20 L190 140Z" fill="#6e4a2c" stroke="#e8b14e" stroke-width="3"/><path d="M190 140 L190 20 L260 30 L280 140Z" fill="#5b3a22" stroke="#e8b14e" stroke-width="3"/><path d="M150 50 L170 62 L170 88 L150 100 L130 88 L130 62Z" fill="#efe0c0" stroke="#7b3b1d" stroke-width="2.5"/><text x="150" y="82" font-size="16" text-anchor="middle" fill="#7b3b1d" font-weight="800" font-family="sans-serif">20</text><path d="M55 60 h40 M55 75 h30 M55 90 h36 M205 60 h40 M210 75 h30 M205 90 h36" stroke="#e8b14e" stroke-width="3" opacity=".45"/></svg>' +
      '<span class="kerze" style="left:calc(50% - 160px);top:22%"></span><span class="kerze" style="left:calc(50% + 150px);top:25%"></span>' +
      '<h1>Tales never End</h1><p class="unter">Du sitzt hinter dem Schirm. Vier Balken, ein Tisch voller Spieler und eine Geschichte, die niemals endet.</p><div class="knoepfe">' +
      (RUN ? '<button class="knopf" data-a="weiter">▶ Weiterspielen</button>' : "") + '<button class="knopf' + (RUN ? " zweit" : "") + '" data-a="neu">' + (RUN ? "Neue Runde" : "▶ Neue Runde") + '</button><button class="knopf zweit" data-a="buch">🎓 Spielleiter-Buch</button><button class="knopf zweit" data-a="chronik">📜 Welt-Chronik</button><button class="knopf zweit" data-a="regeln">❓ So wird gespielt</button></div>' +
      '<div class="stand">Spielleiter-Stufe ' + META.stufe + " · " + n + " / " + KARTEN.length + " Karten entdeckt · Jahr " + META.welt.jahr + "</div>";
    document.body.appendChild(t); titelEl = t;
    t.addEventListener("click", e => {
      const a = e.target.closest("[data-a]"); if (!a) return;
      Ton.start();
      const w = a.dataset.a;
      if (w === "weiter") { schliesseTitel(); fortsetzen(); }
      else if (w === "neu") { if (RUN) confirmFenster("Die laufende Runde geht verloren (ohne Erfahrung). Trotzdem neu anfangen?", () => { RUN = null; neueRundeFenster(); }); else neueRundeFenster(); }
      else ({ buch: spielleiterBuch, chronik: chronikFenster, regeln: regelFenster })[w]();
    });
  }
  function fortsetzen() {
    Z.s = RUN.z || Z.s;
    if (!aktuelle) naechsteKarte(); else zeigeKarte();
  }

  /* ---------- Eingaben ---------- */
  $("#knopf-menue").addEventListener("click", () => { Ton.start(); menue(); });
  $("#knopf-log").addEventListener("click", logFenster);
  $("#werkzeuge").addEventListener("click", e => { const b = e.target.closest("[data-wz]"); if (!b || b.disabled || sperre) return; Ton.start(); werkzeugNutzen(b.dataset.wz); });
  document.addEventListener("keydown", e => {
    if ($("#schichten").children.length || titelEl) { if (e.key === "Escape") { const s = $("#schichten").lastElementChild; if (s && s.zu && s.querySelector(".zu")) s.zu(); } return; }
    if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") { if (folgeWeiter) folgeWeiter(); else karteWeg(0); e.preventDefault(); }
    else if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") { if (folgeWeiter) folgeWeiter(); else karteWeg(1); e.preventDefault(); }
    else if ((e.key === " " || e.key === "Enter") && folgeWeiter) { folgeWeiter(); e.preventDefault(); }
    else if (e.key === "m" || e.key === "M") menue();
  });
  document.addEventListener("visibilitychange", () => { if (document.hidden) speichern(); });

  /* ---------- Start ---------- */
  document.body.classList.toggle("ruhig", !!META.einst.ruhig);
  zeichneBalken();
  if (RUN && RUN.k) { try { titelbild(); } catch (e) { RUN = null; titelbild(); } } else { RUN = null; titelbild(); }
  /* Testlauf ohne Oberfläche (für Balance-Prüfungen): TNE.sim(Runden, "gierig"|"zufall") */
  function sim(n, art) {
    const ergebnisse = [], metaAlt = JSON.stringify(META);
    for (let i = 0; i < n; i++) {
      neuerRunStill();
      let sicher = 0;
      while (RUN && sicher++ < 3000) {
        const x = ziehe(); const f = fuelle(x.ctx);
        aktuelle = { k: x.k, ctx: x.ctx, f, text: "" };
        if (!x.k.sonder) RUN.k.benutzt[x.k.id] = 1;
        let seite = zz() < .5 ? 0 : 1;
        if (art === "gierig") { const sc = o => { const v = vorschauFuer(o); let s = 0; for (const b of "mlst") { let d = v[b]; if (d === "?") d = 0; const xx = RUN.b[b] + (d || 0) * STAERKE + DRIFT[b] * STAERKE * 2; s += Math.pow(xx - 52, 2); } return s; }; seite = sc(x.k.opt[0]) <= sc(x.k.opt[1]) ? 0 : 1; }
        anwenden(seite);
        const tot = balkenTot();
        if (tot) { ergebnisse.push({ ende: tot, karten: RUN.karten, kamp: RUN.kampagnenGeschafft || 0 }); RUN = null; break; }
        if (sessionVorbei()) { sessionAbschluss(); if (RUN.k.session >= RUN.k.sessions) kampagneAbschluss(); else neueSession(); }
      }
      if (RUN) { ergebnisse.push({ ende: "max", karten: RUN.karten, kamp: RUN.kampagnenGeschafft || 0 }); RUN = null; }
    }
    META = JSON.parse(metaAlt);
    return ergebnisse;
  }
  function neuerRunStill() {
    Z.s = (Math.random() * 4294967296) >>> 0;
    RUN = { v: 1, b: { m: zi(40, 60), l: zi(40, 60), s: zi(40, 60), t: zi(40, 60) }, spieler: [], karten: 0, hr: [], queue: [], einmal: {}, xp: 0, verlauf: [] };
    for (const t of mischen(Object.keys(TYPEN)).slice(0, 4)) RUN.spieler.push(neuerSpieler(t));
    neueKampagne();
  }
  window.TNE = { sim, staerke: v => { STAERKE = v; }, KARTEN, ZIEHBAR, META: () => META, RUN: () => RUN, akt: () => aktuelle, vorschau: vorschauFuer, Viz, stichwort, parseWirkung };
})();
