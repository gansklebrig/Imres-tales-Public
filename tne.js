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
  const GR = window.TNE_GRAFIK;
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
    power: { titel: "Powergamer", titelW: "Powergamerin", farbe: "#c0442f", wunsch: { m: [55, 90] }, motto: "Will Schaden. Viel Schaden." },
    rolle: { titel: "Rollenspieler", titelW: "Rollenspielerin", farbe: "#8e5bb5", wunsch: { l: [40, 80], t: [25, 65] }, motto: "Spricht nur mit der Stimme des eigenen Helden." },
    regel: { titel: "Regelanwalt", titelW: "Regelanwältin", farbe: "#7a6a3a", wunsch: { l: [50, 92] }, motto: "„Seite 193, zweiter Absatz.“" },
    chaos: { titel: "Chaot", titelW: "Chaotin", farbe: "#d9822b", wunsch: { s: [55, 96], t: [40, 95] }, motto: "Würfelt erst, fragt nie." },
    snack: { titel: "Snackbeauftragter", titelW: "Snackbeauftragte", farbe: "#a7713a", wunsch: { s: [40, 90], t: [10, 65] }, motto: "Hat Chips. Immer." },
    taktik: { titel: "Taktiker", titelW: "Taktikerin", farbe: "#6f8f3a", wunsch: { m: [40, 80], t: [15, 60] }, motto: "Hat Karopapier mitgebracht." },
    neu: { titel: "Neuling", farbe: "#c9a24a", wunsch: { s: [45, 90], l: [10, 75] }, motto: "„Welcher Würfel ist der W12?“" },
    veteran: { titel: "Veteran", titelW: "Veteranin", farbe: "#8a5a3a", wunsch: { l: [45, 90], m: [20, 72] }, motto: "Spielt seit 1987. Hat Meinungen." },
    handy: { titel: "Handy-Gucker", titelW: "Handy-Guckerin", farbe: "#9c8a6a", wunsch: { t: [50, 95], s: [45, 95] }, motto: "„Hä, sind wir dran?“" },
    drama: { titel: "Theaterkind", farbe: "#b8376a", wunsch: { s: [40, 92], l: [25, 80] }, motto: "Jeder Satz ein Monolog." },
    kunst: { titel: "Zeichner", titelW: "Zeichnerin", farbe: "#5f8a5a", wunsch: { s: [35, 85], t: [10, 70] }, motto: "Zeichnet jeden NSC ins Heft." },
    musik: { titel: "Musiker", titelW: "Musikerin", farbe: "#c8853a", wunsch: { s: [45, 95] }, motto: "Hat die Ukulele dabei." }
  };
  const SPIELERNAMEN = ["Kevin", "Lena", "Bernd", "Mia", "Tobi", "Svenja", "Horst", "Jule", "Ömer", "Paula", "Max", "Anni", "Dennis", "Sophie", "Jonas", "Kathi", "Flo", "Nina", "Basti", "Lea", "Marco", "Steffi", "Luca", "Ronja", "Yusuf", "Ida", "Hannes", "Mira", "Pit", "Zoe", "Benni", "Clara", "Uwe", "Gabi", "Timo", "Elif", "Rüdiger", "Jana", "Sepp", "Vroni", "Malte", "Frieda", "Kalle", "Merle", "Ole", "Aylin", "Detlef", "Josie"];
  const VOELKER = ["Mensch", "Elf", "Zwerg", "Halbling", "Gnom", "Halbork", "Tiefling", "Drachenblütiger", "Goblin", "Katzenmensch", "Echsenmensch", "Aasimar", "Halbelf", "Kobold", "Minotaurus", "Pilzling", "Frosch-Mensch", "Waldschrat"];
  const KLASSEN = ["Barbar", "Barde", "Kleriker", "Druide", "Kämpfer", "Mönch", "Paladin", "Waldläufer", "Schurke", "Zauberer", "Hexenmeister", "Magier", "Tüftler", "Alchemist"];
  const HELDENNAMEN = ["Grimbold", "Ilvaria", "Thrain", "Morla", "Pip", "Zork", "Elandriel", "Bruno", "Kazrak", "Fenna", "Lirael", "Dorn", "Quix", "Sabeth", "Horgrim", "Ragnar", "Tilda", "Vex", "Yorrik", "Brumm", "Elowen", "Hilde", "Ottokar", "Zelphine", "Krümel", "Sir Reginald", "Bodo", "Gerlinde", "Xandor", "Mirabell", "Thokk", "Fidibus", "Ulla", "Wendelin", "Agathe", "Krogg", "Sunniva", "Balduin", "Esmeralda", "Timbo", "Rurik", "Lumi", "Gorm", "Isolde", "Kasimir", "Nessa", "Pankraz", "Ysolde", "Grünhilde", "Theobald", "Schattenklinge", "Nachtblut", "Moosbart", "Faelyn", "Brakk", "Odalys", "Rumpel", "Silvan", "Wanja", "Torvin", "Glimmer", "Hagen", "Jorinde", "Klaus Kühnbart", "Mortimer", "Nimbus", "Orla", "Puck", "Rabia", "Sigurd", "Tamsin", "Urs", "Vilja", "Wolfram", "Xeno", "Yrsa", "Zappel", "Dunkelherz", "Sternenfunke", "Gundolf", "Hermine Hammerhand", "Bartholomäus"];
  // Grammatisches Geschlecht: Spielernamen stehen abwechselnd männlich/weiblich in der Liste
  const typTitel = sp => (spG(sp) === "w" && TYPEN[sp.typ].titelW) || TYPEN[sp.typ].titel;
  const HELDINNEN = new Set(["Ilvaria", "Morla", "Fenna", "Lirael", "Sabeth", "Tilda", "Elowen", "Hilde", "Zelphine", "Gerlinde", "Mirabell", "Ulla", "Agathe", "Sunniva", "Esmeralda", "Lumi", "Isolde", "Nessa", "Ysolde", "Grünhilde", "Faelyn", "Odalys", "Wanja", "Jorinde", "Orla", "Rabia", "Tamsin", "Vilja", "Yrsa", "Hermine Hammerhand", "Elandriel"]);
  const spG = sp => sp.g || (SPIELERNAMEN.indexOf(sp.name) % 2 === 1 ? "w" : "m");
  const heldG = h => h.g || (HELDINNEN.has(h.name) ? "w" : "m");
  const PRON = { er: ["er", "sie"], ihn: ["ihn", "sie"], ihm: ["ihm", "ihr"], sein: ["sein", "ihr"], seine: ["seine", "ihre"], seinen: ["seinen", "ihren"], seinem: ["seinem", "ihrem"], seiner: ["seiner", "ihrer"], seines: ["seines", "ihres"], der: ["der", "die"], dem: ["dem", "der"], den: ["den", "die"], ein: ["ein", "eine"], einen: ["einen", "eine"], einem: ["einem", "einer"] };
  function pronomen(f, w, vorsatz) { for (const k in PRON) { const v = PRON[k][w ? 1 : 0]; f[vorsatz + k] = v; f[vorsatz + k.charAt(0).toUpperCase() + k.slice(1)] = v.charAt(0).toUpperCase() + v.slice(1); } }
  const EIGEN = ["hat Angst vor Türen", "spricht nur in Reimen", "trägt einen Eimer als Helm", "hat eine 14-seitige Hintergrundgeschichte", "ist heimlich ein Drache (angeblich)", "sammelt Löffel", "hat einen Hasen namens Bürgermeister", "vertraut keinen Treppen", "flirtet mit Statuen", "isst alles, was herumliegt", "hält sich für den Auserwählten", "hat Waisen-Hintergrund, Variante Nr. 7", "schreit bei jedem Angriff den eigenen Namen", "kann nicht lügen – versucht es trotzdem", "hat einen bösen Zwilling (angeblich)", "will eigentlich Bäcker werden", "redet mit der eigenen Waffe", "zählt jede Münze dreimal", "hat Höhenangst und fliegt trotzdem", "sucht einen verlorenen Hut", "ist allergisch gegen Magie", "rettet jede Katze", "spricht mit Akzent, den keiner einordnen kann", "trägt nur Lila", "will jeden NSC adoptieren", "schläft in Rüstung", "hat einen Schwur, nie zu rennen", "ist sehr, sehr klein", "glaubt an Glückssocken", "verliert ständig Finger (vorübergehend)", "kann nur flüstern", "führt ein Tagebuch über Gegner-Frisuren", "hasst Goblins persönlich", "ist eigentlich drei Kobolde im Mantel", "will eine Taverne eröffnen", "fürchtet sich vor Hühnern", "liebt Fallen", "nennt sich selbst in der dritten Person", "hat noch nie gewonnen", "trägt den Schädel des alten Lehrmeisters bei sich", "summt beim Schleichen", "möchte nur geliebt werden", "rechnet alles in Käse um", "hat ein Haustier-Mimik", "vergisst jede Nacht den eigenen Namen", "ist sehr höflich zu Untoten", "ist offiziell tot (Papierkram)", "hat Schulden bei einem Gott", "spielt Flöte, schlecht", "kann nicht schwimmen, wohnt auf einem Boot"];
  const ORTE = ["Nebelhain", "Grauwasser", "Kragenstein", "Zwielichtpass", "Rabenfels", "Moorbrück", "Eisenkamm", "Sonnfurt", "Salzhafen", "Krähenwinkel", "Tiefenbrunn", "Glimmertief", "Schattenmark", "Weidenau", "Bitterbach", "Hohenfrost", "Silberau", "Modergrund", "Brunnenwinkel", "Ascheklamm", "Goldhügel", "Mühlbach", "Wolkenstieg", "Knochenfurt", "Kesselsee", "Dornheim", "Fuchsbau", "Spiegelsand", "Wurzelgrund", "Sternfall"];
  const SCHURKEN = ["Lord Mortax", "die Lich-Königin Velthra", "Gerhard der Unaussprechliche", "der Nekromant Bodo", "Xal'gorath der Hungernde", "Madame Morgana", "Baron Rotbart von Kragenstein", "die Moorhexe Grete", "Großinquisitor Fenwick", "der Drache Schmorgoth", "Kultführer Ulf", "die Spinnenkönigin Arachnia", "Professor Dunkelmond", "der Goblinkönig Snirk", "Baron von Blutwurst", "die Schneekönigin Frosta", "Steuereintreiber Morbus der Untote", "die Brunnenkreatur Gluck", "der Pilzfürst Myzel", "Graf Zahnlos", "die Schattenweberin Nyx", "der Kobold-Imperator Knirps III.", "Magister Malvolio", "Äbtissin Ferra die Eiserne", "der Bergwurm Grollmaul"];
  const NPCS = ["Wirt Hubert", "die Kräuterfrau Gundel", "Hauptmann Brack", "der Händler Fizzlewick", "Schmiedin Hrodna", "Bürgermeister Pompelmus", "der mysteriöse Fremde im Umhang", "Bettler Ole", "Priesterin Aurelia", "der sprechende Rabe Kolk", "Bauer Jupp", "Barde Florian", "Gräfin von Zitterbach", "Zwerg Grombosch", "Hexe Schrumpelgund", "Gnom Pimpernell", "Stallbursche Tim", "Magierin Ysra", "die Wache Nr. 3", "Schankmaid Resi", "Fährmann Charon-Karl", "der alte Leuchtturmwärter", "Prinzessin Adelgunde", "Kaufmann Silbermund"];
  const MONSTER = ["Goblins", "Oger", "Kobolde", "Mimiks", "Gallertwürfel", "Eulenbären", "Trolle", "Ghule", "Lindwürmer", "Riesenratten", "Basilisken", "Harpyien", "Werwölfe", "Vampire", "Skelette", "Riesenspinnen", "Gargoyles", "Mantikore", "Schleime", "Golems", "Banditen", "wütende Gänseriche", "Kultisten", "Zombies", "Irrlichter", "Grottenschrate", "Echsenkrieger", "Höhlentrolle"];
  const DINGE = ["das Schwert +1 der Mittelmäßigkeit", "den Ring des ewigen Hungers", "eine Taschenuhr, die rückwärts läuft", "den Stab des Donnerns", "einen sprechenden Schädel", "die Stiefel der Eile", "einen Beutel mit unendlich Murmeln", "die Krone der Vergessenen", "ein verfluchtes Amulett", "den Kochlöffel der Macht", "ein Drachenei", "eine Schatzkarte mit einem X", "den Umhang der Unsichtbarkeit (nur montags)", "eine Laute aus Knochen", "den Kelch der Wahrheit", "einen Würfel, der immer 20 zeigt", "die Rüstung des Riesen (zu groß)", "ein Glas Mondlicht", "die Feder des Phönix", "eine Hose der Unverwundbarkeit"];
  const GOETTER = ["Fortunus", "Morna", "Gromm", "Mutter Sela", "Gouda", "Brutus", "Lunaria", "Pankratius der Gnädige"];
  const TITELMUSTER = ["Der Fluch von {ort}", "Schatten über {ort}", "Die Krone von {ort}", "{Schurke} erwacht", "{Schurke} kehrt zurück", "{ort} brennt", "Die letzte Schenke vor {ort}", "Das Geheimnis von {ort}", "Die Pilzkriege von {ort}", "Der lange Winter von {ort}", "Die Erben von {ort}", "Die Prophezeiung von {ort}", "Ein Drache namens Steuern", "Die Hochzeit von {ort}", "Das Turnier von {ort}", "Die Gruft unter {ort}", "Das Lied von {ort}", "{Schurke} schlägt zurück"];

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
    const m = s.match(/^(.*?)\bW(\d+)\s*(.*)$/);
    if (m) {
      w.wurf = +m[2];
      const rest = m[3];
      const q = rest.indexOf("?"), d = rest.indexOf(":", q + 1);
      const vor = m[1] + " " + (q >= 0 ? rest.slice(0, q) : rest);
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
        } else if (t === "einmal" || t === "kette" || t === "wurfkarte" || t === "trash" || t === "selten" || t === "schwer") k[t] = true;
        else if (t) k.wer = t;
      }
      const text = [];
      for (const z of zeilen) {
        const zz2 = z.trim();
        if (!zz2) continue;
        if (zz2[0] === "<" || zz2[0] === ">" || zz2[0] === "^" || zz2[0] === "~") {
          const teile = zz2.slice(1).split("|").map(x => x.trim());
          const ziel = zz2[0] === "~" ? "zoegern" : null;
          (ziel ? (o => { k.zoegern = o; }) : (o => { k.opt[zz2[0] === "<" ? 0 : zz2[0] === ">" ? 1 : 2] = o; }))({ label: teile[0] || "…", w: parseWirkung(teile[1]), folge: teile[2] || "", viz: teile[3] || "" });
        } else text.push(zz2);
      }
      k.text = text.join(" ");
      if (!k.opt[0] || !k.opt[1]) { console.warn("Karte ohne zwei Wahlen:", k.id || k.text.slice(0, 40)); continue; }
      if (k.krise) k.kette = true;
      k.brauchtSp = /\{(name|held|klasse|volk|eigen|stufe|altheld|altkampagne|tode|nat1|nat20|kampagnen|krise|[Ee]r|[Ss]ein\w*|[Ii]hn|[Ii]hm|h_\w+)\}/.test([k.text, ...k.opt.flatMap(o => [o.label, o.folge])].join(" "));
      const SCHWER_OPS = /^(tod2?|tpk|geht|pause=\d+|krise=\w+|bez=(ex|weg|spannung)|sieg|frieden|ende)$/;
      k.schwer = k.schwer || !!k.eile || k.opt.some(o => { const ops = o.w.ok.concat(o.w.nein || []); return ops.some(x => SCHWER_OPS.test(x)) || ops.reduce((a, x) => { const m = x.match(/^[mlst]([+-]\d+)$/); return a + (m ? Math.abs(+m[1]) : 0); }, 0) >= 24; });
      k.folgekarte = k.wenn.some(b => /^[a-z][a-z_]*$/.test(b) && !["legende", "gefallen", "ruhig"].includes(b));
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
  const metaNeu = () => ({ v: 1, xp: 0, stufe: 1, erfolge: {}, gesehen: {}, enden: {}, stats: { karten: 0, sessions: 0, kampagnen: 0, helden: 0, tode: 0, wuerfe: 0, nat20: 0, nat1: 0, pizza: 0, spieler: 0, runden: 0, legenden: 0, besteKarten: 0, zoneFolge: 0, bosse: 0, ziele: 0, bez: 0, krisen: 0, selten: 0 },
    welt: { jahr: 1, chronik: [], legenden: [], gefallene: [], schurken: [] }, tages: {}, wuerfel: { pergament: 1 }, wuerfelAktiv: "pergament", selten: {}, einst: { atmo: 0.55, fx: 0.8, vib: false, auto: false, ruhig: false } });
  let META = lade("tne-meta", null) || metaNeu();
  META.einst = Object.assign(metaNeu().einst, META.einst || {});
  META.stats = Object.assign(metaNeu().stats, META.stats || {});
  META.welt = Object.assign(metaNeu().welt, META.welt || {});
  META.wuerfel = META.wuerfel || { pergament: 1 }; META.wuerfelAktiv = META.wuerfelAktiv || "pergament"; META.selten = META.selten || {};
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
    /* Ton-Schalter (tonregler.js): Atmosphäre („Musik“) und Effekte schnell stumm, Regler bleiben wie eingestellt */
    const tonM = () => !window.TonRegler || TonRegler.musik("tne"), tonE = () => !window.TonRegler || TonRegler.effekte("tne");
    if (window.TonRegler) TonRegler.anmelden("tne", { aendern: () => lautstaerke() });
    function lautstaerke() { if (!ctx) return; fxGain.gain.value = tonE() ? META.einst.fx : 0; atmoGain.gain.value = tonM() ? META.einst.atmo * 0.55 : 0; }
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
  if (window.TonRegler) { const kopf = document.querySelector(".kopf"), log = document.getElementById("knopf-log"); if (kopf) kopf.insertBefore(TonRegler.knoepfe("tne"), log || null); }
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
      drache() { const G = window.TNE_GRAFIK; if (G) G.drachenFlug(document.getElementById("buehne")); dunkel = .5; schuettel = .3; setTimeout(() => { schuettel = .5; E.feuer(); }, 1300); },
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
    const name = ahn ? ahn.name.split(" ")[0] + (zz() < .5 ? " II." : " Junior") : wahl(HELDENNAMEN);
    const h = { name, g: null, volk: wahl(VOELKER), klasse: wahl(KLASSEN), eigen: wahl(EIGEN), stufe: Math.max(1, RUN ? Math.round(durchschnittStufe() * .6) : 1), id: Math.random().toString(36).slice(2, 8) };
    if (sp.typ === "power" && zz() < .5) h.name = wahl(["Schattenklinge", "Nachtblut", "Dunkelherz", "Todesfaust", "Klingensturm"]);
    if (sp.typ === "rolle" && zz() < .5) h.eigen = "hat eine 14-seitige Hintergrundgeschichte";
    h.g = HELDINNEN.has(h.name) ? "w" : "m";
    META.stats.helden++;
    return h;
  }
  function neuerSpieler(typ) {
    const belegt = new Set((RUN ? RUN.spieler : []).map(s => s.name));
    const freieTypen = Object.keys(TYPEN).filter(t => !(RUN && RUN.spieler.some(s => s.typ === t && !s.weg)));
    const sp = { name: wahl(SPIELERNAMEN.filter(n => !belegt.has(n))) || wahl(SPIELERNAMEN), typ: typ || wahl(freieTypen.length ? freieTypen : Object.keys(TYPEN)), laune: zi(55, 75), tode: 0 };
    sp.held = neuerHeld(sp);
    sp.aussehen = GR.aussehenNeu(zz);
    sp.mem = { nat20: 0, nat1: 0, kampagnen: 0, erinnerung: [], seit: RUN ? RUN.karten : 0 };
    META.stats.spieler++;
    if (META.stats.spieler >= 20) erfolg("spieler20");
    return sp;
  }
  const aktiveSpieler = () => RUN.spieler.filter(s => !s.weg && !s.pause);
  const pausierte = () => RUN.spieler.filter(s => !s.weg && s.pause);
  const idx = sp => RUN.spieler.indexOf(sp);
  function memo(sp) { if (!sp.mem) sp.mem = { nat20: 0, nat1: 0, kampagnen: 0, erinnerung: [], seit: 0 }; if (!sp.aussehen) sp.aussehen = GR.aussehenNeu(GR.rng(GR.hash(sp.name + sp.typ))); return sp; }

  /* ---------- Beziehungen am Tisch ----------
     Jede Beziehung: a, b (Index in RUN.spieler), typ, wert 0–100 (wie gut es gerade läuft).
     Sie färben die Laune: Wer sich gerade nicht grün ist, zieht den Tisch runter. */
  const BEZ = {
    paar: { name: "ein Paar", ic: "♥" }, freunde: { name: "befreundet", ic: "🤝" }, geschwister: { name: "Geschwister", ic: "👪" },
    kollegen: { name: "Arbeitskollegen", ic: "💼" }, wg: { name: "WG-Mitbewohner", ic: "🔑" }, ex: { name: "Ex-Paar", ic: "🥀" },
    spannung: { name: "angespannt", ic: "⚡" }, schwarm: { name: "heimlich verknallt", ic: "💭" }
  };
  function bezNeu(a, b, typ, wert) {
    if (!a || !b || a === b) return null;
    RUN.bez = RUN.bez || [];
    const alt = bezZwischen(a, b);
    if (alt) { alt.typ = typ; if (wert != null) alt.wert = wert; return alt; }
    const z = { a: idx(a), b: idx(b), typ, wert: wert == null ? zi(55, 78) : wert, seit: RUN.karten };
    RUN.bez.push(z); return z;
  }
  function bezZwischen(a, b) { const i = idx(a), j = idx(b); return (RUN.bez || []).find(z => (z.a === i && z.b === j) || (z.a === j && z.b === i)) || null; }
  function bezVon(sp) { const i = idx(sp); return (RUN.bez || []).filter(z => z.a === i || z.b === i).map(z => ({ z, ander: RUN.spieler[z.a === i ? z.b : z.a] })); }
  const anwesend = s => s && !s.weg && !s.pause;
  function startBeziehungen() {
    RUN.bez = [];
    const a = mischen(RUN.spieler), n = a.length >= 5 ? 2 : zz() < .75 ? 2 : 1;
    const typen = [["freunde", 3], ["paar", 2], ["kollegen", 1.6], ["wg", 1.6], ["geschwister", 1.3], ["ex", .5], ["schwarm", .5]];
    for (let i = 0; i < n && i * 2 + 1 < a.length; i++) {
      let r = zz() * typen.reduce((x, t) => x + t[1], 0), typ = "freunde";
      for (const [t, g] of typen) { r -= g; if (r <= 0) { typ = t; break; } }
      bezNeu(a[i * 2], a[i * 2 + 1], typ, typ === "ex" ? zi(30, 50) : zi(55, 80));
    }
  }

  /* ---------- Gedächtnis: Spieler erinnern sich ---------- */
  function merkmale(sp) {
    memo(sp);
    const m = sp.mem, out = {};
    if (m.nat1 >= 2 && m.nat1 > m.nat20) out.pechvogel = 1;
    if (m.nat20 >= 2 && m.nat20 > m.nat1) out.glueckskind = 1;
    if (m.letzterTod != null && RUN.karten - m.letzterTod < 18) out.trauert = 1;
    if (sp.tode >= 3) out.verbittert = 1;
    if (sp.tode >= 2) out.paranoid = 1;
    if (m.kampagnen >= 2) out.stammgast = 1;
    if (m.erinnerung.length) out.verlust = 1;
    if ((m.erfolge || 0) >= 6 && !sp.tode) out.uebermuetig = 1;
    if (m.seit > 0 && RUN.karten - m.seit < 25) out.frisch = 1;
    const g = (m.groll || []).slice(-1)[0], dk = (m.dank || []).slice(-1)[0];
    if (g && RUN.karten - g.karte < 70) out.groll = 1;
    if (g && g.held && RUN.karten - g.karte < 90) out.heldgeopfert = 1;
    if (dk && RUN.karten - dk.karte < 70) out.dank = 1;
    if ((sp.vertrauen == null ? 60 : sp.vertrauen) < 32) out.misstrauisch = 1;
    if ((sp.vertrauen || 0) > 84) out.vertraut = 1;
    return out;
  }

  /* ---------- Echte Krisen ---------- */
  const KRISEN = { umzug: { ic: "📦", name: "Umzug" }, baby: { ic: "🍼", name: "Baby" }, job: { ic: "💼", name: "neuer Job" }, pruefung: { ic: "📚", name: "Prüfungen" }, trennung: { ic: "💔", name: "Trennung" }, familie: { ic: "🕯️", name: "Familie" }, haustier: { ic: "🐾", name: "Haustier" }, hochzeit: { ic: "💍", name: "Hochzeit" }, burnout: { ic: "🌫️", name: "zu viel um die Ohren" } };
  function kriseVielleicht() {
    if (RUN.karten < 22 || RUN.spieler.some(s => !s.weg && (s.krise || s.pause))) return;
    if (aktiveSpieler().length < 4 || zz() > .24) return;
    if (RUN.letzteKrise && RUN.karten - RUN.letzteKrise < 45) return;
    const start = mischen(KARTEN.filter(k => k.krise && !(RUN.einmal[k.id])));
    for (const k of start) { const ctx = sprecherFinden(k); if (ctx && (!k.wenn.length || pruefe(k.wenn, ctx))) { RUN.queue.push({ id: k.id, ab: RUN.karten + zi(1, 4), sp: ctx.sp ? idx(ctx.sp) : null, sp2: ctx.sp2 ? idx(ctx.sp2) : null }); RUN.letzteKrise = RUN.karten; return; } }
  }
  function rueckkehrPruefen() {
    for (const s of pausierte()) {
      if (s.pause.bis > RUN.sessGesamt) continue;
      const art = s.pause.art || "allg";
      delete s.pause;
      const varianten = KARTEN.filter(k => k.id === "kz_" + art || k.id.startsWith("kz_" + art + "_"));
      const id = varianten.length ? wahl(varianten).id : "kz_allg";
      RUN.queue.unshift({ id, ab: RUN.karten, sp: idx(s) });
    }
  }

  /* ---------- Geheime Ziele (eins je Kampagne) ---------- */
  const ZIELE = [
    { k: "keintod", ic: "🛡️", name: "Niemand bleibt zurück", text: "In dieser Kampagne stirbt kein einziger Held.", ok: k => !k.tote.length },
    { k: "spass", ic: "😄", name: "Gute Abende", text: "Spaß fällt die ganze Kampagne nicht unter 35.", ok: k => k.zs.min.s >= 35, stand: k => "tiefster Spaß bisher: " + k.zs.min.s },
    { k: "alleda", ic: "🪑", name: "Volle Stühle", text: "Niemand verlässt in dieser Kampagne die Runde.", ok: k => !k.zs.gegangen },
    { k: "laune", ic: "☺️", name: "Alle zufrieden", text: "Am Ende der Kampagne haben alle am Tisch mehr als 55 Laune.", ok: () => aktiveSpieler().every(s => s.laune > 55), stand: () => "niedrigste Laune gerade: " + Math.round(Math.min(...aktiveSpieler().map(s => s.laune))) },
    { k: "boss", ic: "🐲", name: "Vor dem Finale", text: "Besiege den Endgegner im Bosskampf, bevor das Finale beginnt.", ok: k => !!k.flags.boss_besiegt },
    { k: "zone", ic: "⚖️", name: "Im Gleichgewicht", text: "Beende jede Session dieser Kampagne mit mindestens drei Balken im grünen Bereich.", ok: k => k.zs.zone },
    { k: "wuerfel", ic: "🎲", name: "Würfelglück", text: "Zwei natürliche 20 in dieser Kampagne.", ok: k => k.zs.nat20 >= 2, stand: k => k.zs.nat20 + " / 2" },
    { k: "tempo", ic: "⏳", name: "Kein Leerlauf", text: "Tempo fällt nie unter 28.", ok: k => k.zs.min.t >= 28, stand: k => "tiefstes Tempo bisher: " + k.zs.min.t },
    { k: "real", ic: "📏", name: "Glaubwürdig", text: "Realismus bleibt die ganze Kampagne zwischen 25 und 80.", ok: k => k.zs.min.l >= 25 && k.zs.max.l <= 80, stand: k => "bisher " + k.zs.min.l + "–" + k.zs.max.l },
    { k: "macht", ic: "⚔️", name: "Auf Augenhöhe", text: "Macht bleibt die ganze Kampagne zwischen 25 und 78.", ok: k => k.zs.min.m >= 25 && k.zs.max.m <= 78, stand: k => "bisher " + k.zs.min.m + "–" + k.zs.max.m },
    { k: "bez", ic: "🤝", name: "Zusammenhalt", text: "Am Ende der Kampagne steht jede Beziehung am Tisch bei mindestens 50.", ok: () => (RUN.bez || []).filter(z => anwesend(RUN.spieler[z.a]) && anwesend(RUN.spieler[z.b]) && !["ex", "spannung"].includes(z.typ)).every(z => z.wert >= 50) },
    { k: "neu", ic: "🚪", name: "Offene Tür", text: "Nimm in dieser Kampagne jemand Neues in die Runde auf.", ok: k => k.zs.neu > 0 }
  ];
  function zielStand(k) { return { min: { m: RUN.b.m, l: RUN.b.l, s: RUN.b.s, t: RUN.b.t }, max: { m: RUN.b.m, l: RUN.b.l, s: RUN.b.s, t: RUN.b.t }, gegangen: 0, nat20: 0, neu: 0, zone: true }; }

  /* ---------- Bosskampf ---------- */
  const bossAb = k => Math.max(2, k.laenge - 7);
  const istLetzteSession = () => RUN.k.session >= RUN.k.sessions;
  const imBoss = () => istLetzteSession() && RUN.k.karte >= bossAb(RUN.k) && RUN.k.karte < RUN.k.laenge - 1 && !(RUN.k.boss && RUN.k.boss.hp <= 0);

  /* ---------- Würfelsammlung ---------- */
  const FREI = { start: () => true, stufe3: () => META.stufe >= 3, tod1: () => META.erfolge.tod1, nat20: () => META.erfolge.nat20, kampagne1: () => META.erfolge.kampagne1, ziel1: () => META.stats.ziele >= 1, tpk: () => META.erfolge.tpk, selten3: () => Object.keys(META.selten).length >= 3, stufe10: () => META.stufe >= 10, spieler20: () => META.erfolge.spieler20, drache: () => META.erfolge.drache, pizza10: () => META.erfolge.pizza10, katze: () => META.erfolge.katze, geist: () => META.erfolge.geist, beziehung: () => META.stats.bez >= 1, boss3: () => META.stats.bosse >= 3 };
  const FREI_TEXT = { start: "von Anfang an", stufe3: "Spielleiter-Stufe 3", tod1: "der erste gefallene Held", nat20: "eine natürliche 20", kampagne1: "die erste beendete Kampagne", ziel1: "ein erreichtes geheimes Ziel", tpk: "ein TPK", selten3: "drei seltene Karten entdeckt", stufe10: "Spielleiter-Stufe 10", spieler20: "20 verschiedene Spieler", drache: "die Drachenhochzeit", pizza10: "10 Notfall-Pizzen", katze: "die Katze frisst einen Würfel", geist: "ein Geist am Tisch", beziehung: "aus Schwärmerei wird ein Paar – oder eine Freundschaft ganz eng", boss3: "drei besiegte Endgegner" };
  function wuerfelPruefen() {
    for (const w of GR.WUERFEL) if (!META.wuerfel[w.k] && FREI[w.frei] && FREI[w.frei]()) { META.wuerfel[w.k] = 1; setTimeout(() => toast("🎲 Neues Würfelset: <b>" + esc(w.name) + "</b> – im Spielleiter-Buch auswählen"), 2400); }
  }
  const wuerfelSet = () => GR.WUERFEL.find(w => w.k === META.wuerfelAktiv) || GR.WUERFEL[0];
  function durchschnittStufe() { const a = aktiveSpieler(); return a.length ? a.reduce((x, s) => x + s.held.stufe, 0) / a.length : 1; }

  function neueKampagne() {
    const ort = wahl(ORTE);
    let schurke = wahl(SCHURKEN);
    if (META.welt.schurken.length && zz() < .25) schurke = wahl(META.welt.schurken);
    const titel = wahl(TITELMUSTER).replace("{ort}", ort.replace(/^(den|die|das) /, "")).replace("{Schurke}", schurke.charAt(0).toUpperCase() + schurke.slice(1));
    RUN.k = { nr: (RUN.k ? RUN.k.nr : 0) + 1, titel, ort, schurke, platz: wahl(SCHAUPLATZ), sessions: zi(4, 6) - (hr("kurz") ? 1 : 0), session: 0, karte: 0, akt: 1, flags: {}, benutzt: {}, tote: [], log: [], plot: 0, werkzeug: {} };
    const letztes = RUN.letztesZiel;
    RUN.k.ziel = wahl(ZIELE.filter(z => z.k !== letztes)).k; RUN.letztesZiel = RUN.k.ziel;
    RUN.k.zs = zielStand();
    neueSession(true);
  }
  function sessionLaenge() { return (hr("kurz") ? 6 : 11) + zi(0, 3); }
  function neueSession(erste) {
    const k = RUN.k;
    k.session++; k.karte = 0; k.laenge = sessionLaenge(); k.wzSession = {};
    k.akt = k.session <= Math.ceil(k.sessions / 3) ? 1 : k.session < k.sessions ? 2 : 3;
    if (k.session >= k.sessions) k.laenge += 4;
    if (erste) k.werkzeug = {};
    RUN.sessGesamt = (RUN.sessGesamt || 0) + 1;
    if (RUN.spieler && RUN.spieler.length) { rueckkehrPruefen(); kriseVielleicht(); }
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
    startBeziehungen();
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
      else if ((m = b.match(/^bez([<>])(\d+)$/))) { if (!ctx.bez) return false; if (!(m[1] === "<" ? ctx.bez.wert < +m[2] : ctx.bez.wert > +m[2])) return false; }
      else if ((m = b.match(/^bhp([<>])(\d+)$/))) { const hp = RUN.k.boss ? RUN.k.boss.hp : 100; if (!(m[1] === "<" ? hp < +m[2] : hp > +m[2])) return false; }
      else if ((m = b.match(/^merk:(\w+)$/))) { if (!ctx.sp || !merkmale(ctx.sp)[m[1]]) return false; }
      else if ((m = b.match(/^krise:(\w+)$/))) { if (!ctx.sp || !ctx.sp.krise || (m[1] !== "alle" && ctx.sp.krise.art !== m[1])) return false; }
      else if (b === "ruhig") { if (RUN.spieler.some(s => !s.weg && (s.krise || s.pause))) return false; }
      else if ((m = b.match(/^bezhat:(\w+)$/))) { if (!ctx.sp || !bezVon(ctx.sp).some(x => x.z.typ === m[1] && anwesend(x.ander))) return false; }
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
    if (k.bez) {
      const typen = k.bez.split("/");
      const paare = (RUN.bez || []).filter(z => (k.bez === "*" || typen.includes(z.typ)) && anwesend(RUN.spieler[z.a]) && anwesend(RUN.spieler[z.b]));
      if (!paare.length) return null;
      const z = wahl(paare);
      let a = RUN.spieler[z.a], b = RUN.spieler[z.b];
      if (z.typ !== "schwarm" && zz() < .5) [a, b] = [b, a];
      if (TYPEN[k.wer] && a.typ !== k.wer) { if (b.typ === k.wer && z.typ !== "schwarm") [a, b] = [b, a]; else return null; }
      return { sp: a, sp2: b, bez: z };
    }
    if (k.wer === "pausiert") { const p = pausierte(); return p.length ? { sp: wahl(p), chat: true } : null; }
    if (k.krise && k.krisenwer) { const kand = aktiveSpieler().filter(s => s.typ === k.krisenwer); if (kand.length) return { sp: wahl(kand) }; }
    if (TYPEN[k.wer]) { const kand = aktiveSpieler().filter(s => s.typ === k.wer); return kand.length ? { sp: wahl(kand) } : null; }
    if (k.wer === "spieler") { const a = aktiveSpieler(); return a.length ? { sp: wahl(a) } : null; }
    const betroffen = () => { const a = aktiveSpieler(); return a.length ? wahl(a) : null; };
    if (k.wer === "geist") { if (!(RUN.k.tote.length || META.welt.gefallene.length)) return null; return k.brauchtSp ? { sym: "geist", sp: betroffen() } : { sym: "geist" }; }
    if (k.brauchtSp) { const b = betroffen(); return b ? { sym: k.wer, sp: b } : null; }
    return { sym: k.wer };
  }
  function fuelle(ctx) {
    const a = aktiveSpieler();
    const andere = a.filter(s => s !== ctx.sp);
    if (!ctx.sp2 && andere.length) ctx.sp2 = wahl(andere);
    const anderer = ctx.sp2 || ctx.sp || a[0];
    const mem = ctx.sp ? memo(ctx.sp).mem : null, erin = mem && mem.erinnerung.length ? mem.erinnerung[mem.erinnerung.length - 1] : null;
    const tot = RUN.k.tote.length ? RUN.k.tote[RUN.k.tote.length - 1] : (META.welt.gefallene.length ? wahl(META.welt.gefallene) : { name: "Grimbold" });
    const leg = META.welt.legenden.length ? wahl(META.welt.legenden) : { name: "Grimbold Eisenfaust", spieler: "jemand" };
    const f = {
      name: ctx.sp ? ctx.sp.name : "", held: ctx.sp ? ctx.sp.held.name : "", klasse: ctx.sp ? ctx.sp.held.klasse : "", volk: ctx.sp ? ctx.sp.held.volk : "", eigen: ctx.sp ? ctx.sp.held.eigen : "",
      anderer: anderer ? anderer.name : "", aheld: anderer ? anderer.held.name : "", aklasse: anderer ? anderer.held.klasse : "",
      schurke: RUN.k.schurke, schurkeN: RUN.k.schurke.replace(/^(der|die|das) /, ""), ort: RUN.k.ort, kampagne: RUN.k.titel, npc: (() => { const n = wahl(NPCS); return n; })(), monster: wahl(MONSTER), item: wahl(DINGE), gott: wahl(GOETTER),
      tot: tot.name, legende: leg.name, zahl: zi(3, 17), stufe: ctx.sp ? ctx.sp.held.stufe : 1, sl: "du",
      p2: anderer ? anderer.name : "", p2held: anderer ? anderer.held.name : "", bez: ctx.bez ? BEZ[ctx.bez.typ].name : "",
      altheld: erin ? erin.held : "Grimbold", altkampagne: erin ? erin.kampagne : "der letzten Kampagne", tode: ctx.sp ? ctx.sp.tode : 0, kampagnen: mem ? mem.kampagnen : 0,
      damals: mem && mem.groll && mem.groll.length ? mem.groll[mem.groll.length - 1].wahl : "das mit dem Oger", damalsheld: mem && mem.groll && mem.groll.length && mem.groll[mem.groll.length - 1].held ? mem.groll[mem.groll.length - 1].held : (erin ? erin.held : "Grimbold"), dankfuer: mem && mem.dank && mem.dank.length ? mem.dank[mem.dank.length - 1].wahl : "die Szene am Lagerfeuer",
      nat1: mem ? mem.nat1 : 0, nat20: mem ? mem.nat20 : 0, wochen: zi(2, 6), monate: zi(2, 5), krise: ctx.sp && ctx.sp.krise ? KRISEN[ctx.sp.krise.art].name : ""
    };
    pronomen(f, ctx.sp && spG(ctx.sp) === "w", "");
    pronomen(f, ctx.sp && heldG(ctx.sp.held) === "w", "h_");
    pronomen(f, anderer && spG(anderer) === "w", "p2_");
    pronomen(f, anderer && heldG(anderer.held) === "w", "p2h_");
    return f;
  }
  const ersetze = (t, f) => satz(t.replace(/\{(\w+)\}/g, (_, k) => k === "npcN" ? String(f.npc).replace(/^(der|die|das) /, "") : f[k] != null ? f[k] : "{" + k + "}"));
  const satz = t => t.replace(/(^|[.!?]\s+|(?:^|[.!?:]\s*)„)([a-zäöü])/g, (m, a, b) => a + b.toUpperCase());
  function grossAnfang(t) { return t.charAt(0).toUpperCase() + t.slice(1); }

  /* ---------- Karte ziehen ---------- */
  let aktuelle = null;
  function phaseJetzt() {
    const k = RUN.k;
    if (k.karte === 0) return k.session === 1 ? (RUN.k.nr === 1 ? "rstart" : "kstart") : "start";
    if (k.karte >= k.laenge - 1) return k.session >= k.sessions ? "finale" : "ende";
    if (imBoss()) return k.karte === bossAb(k) ? "bossstart" : "boss";
    return "mitte";
  }
  function kandidaten(phase) {
    const out = [];
    for (const k of ZIEHBAR) {
      if (k.phase !== phase && !(phase === "rstart" && k.phase === "kstart")) continue;
      if (RUN.k.benutzt[k.id]) continue;
      if (k.einmal && RUN.einmal[k.id]) continue;
      if (k.nurhr && !hr(k.nurhr)) continue;
      if (k.selten && (RUN.karten < 15 || RUN.einmal[k.id])) continue;
      const ctx = sprecherFinden(k); if (!ctx) continue;
      if (k.wenn.length && !pruefe(k.wenn, ctx)) continue;
      let g = k.g;
      if (hr("wuerfel") && (k.opt[0].w.wurf || k.opt[1].w.wurf)) g *= 3;
      if (hr("trash") && k.trash) g *= 2.5;
      if (ctx.sp && ctx.sp.laune < 30 && k.wenn.some(b => b.startsWith("laune<"))) g *= 3;
      if (!META.gesehen[k.id]) g *= 1.35;
      if (k.selten) g *= .3;
      if (k.bez) g *= 1.2;
      if (k.folgekarte) g *= 5;
      if (k.wenn.some(b => /^(merk:(pechvogel|glueckskind|trauert|verbittert|paranoid|uebermuetig|frisch)|bez[<>]|krise:|bezhat:)/.test(b))) g *= 2.5;
      if (k.wenn.some(b => /^merk:(verlust|stammgast)$/.test(b))) g *= .45;
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
        const k = KARTE[q.id];
        const persoenlich = k && (/^k[rz]_/.test(k.id) || k.wer === "pausiert"), sp = q.sp != null ? RUN.spieler[q.sp] : null;
        if (k && persoenlich && sp && sp.pause && k.wer !== "pausiert") continue;   // wartet, bis die Person zurück ist
        RUN.queue.splice(i, 1);
        if (!k) break;
        if (persoenlich && sp && (sp.weg || (k.wer === "pausiert" && !sp.pause))) { i--; continue; }
        let ctx = q.sp != null ? { sp: sp && !sp.weg ? sp : (sprecherFinden(k) || {}).sp } : sprecherFinden(k);
        if (ctx && q.sp2 != null && RUN.spieler[q.sp2] && anwesend(RUN.spieler[q.sp2])) { ctx.sp2 = RUN.spieler[q.sp2]; const z = ctx.sp && bezZwischen(ctx.sp, ctx.sp2); if (z) ctx.bez = z; }
        if (ctx && k.bez && !ctx.bez) ctx = null;
        if (ctx && !ctx.sp && (TYPEN[k.wer] || k.wer === "spieler" || k.wer === "pausiert" || k.brauchtSp)) ctx = null;
        if (ctx && k.wer === "pausiert") ctx.chat = true;
        if (ctx && !TYPEN[k.wer] && !["spieler", "pausiert"].includes(k.wer) && !k.bez) ctx.sym = k.wer;
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
    const a = aktiveSpieler();
    let intro = "Es klingelt. Vor der Tür steht " + sp.name + " (" + typTitel(sp) + "). „Ich hab gehört, ihr sucht noch jemanden?“";
    if (a.length && zz() < .45) {
      const f = wahl(a), art = wahl(["freunde", "freunde", "kollegen", "geschwister", "paar", "wg"]);
      sp.mit = { i: idx(f), typ: art };
      intro = {
        freunde: f.name + " hat " + sp.name + " mitgebracht. Die beiden kennen sich seit der Schulzeit, und seit Monaten kam bei jedem Treffen die Frage, ob man da nicht mal mitspielen könnte.",
        kollegen: f.name + " bringt " + sp.name + " mit, aus dem Büro. „Wir haben in der Mittagspause so viel über D&D geredet, jetzt will " + sp.name + " das mal echt sehen.“",
        geschwister: f.name + " hat das jüngere Geschwisterkind dabei: " + sp.name + ". Hat sich die Würfel schon vor zwei Wochen gekauft.",
        paar: f.name + " kommt nicht allein: " + sp.name + ", die neue Beziehung, sitzt etwas verlegen daneben. „Ist das okay, wenn " + sp.name + " mitspielt?“",
        wg: f.name + " hat " + sp.name + " aus der WG mitgebracht. „Hat gehört, wie wir jeden Donnerstag lachen, und wollte endlich wissen, warum.“"
      }[art];
      if (sp.typ === "neu") intro += " Erste Runde überhaupt.";
    }
    const k = { id: "_neu", wer: "gast", sonder: true, text: intro + " Im Gepäck: " + sp.held.name + ", " + sp.held.volk + "-" + sp.held.klasse + (leg ? " – Nachfahre der Legende " + leg.name + "!" : "") + ".", opt: [
      { label: "Wir sind voll", w: parseWirkung(sp.mit ? "t+2 alle-2" : "t+2"), folge: sp.mit ? "Kurzes, unangenehmes Schweigen. " + sp.name + " sagt, das sei total okay, und geht dann doch etwas früher." : sp.name + " zieht weiter. Vielleicht ein andermal." },
      { label: "Rein mit dir!", w: parseWirkung("aufnehmen s+3 t-2"), folge: sp.name + " zieht einen Stuhl heran. " + TYPEN[sp.typ].motto }] };
    return { k, ctx: { sym: "gast" } };
  }

  function naechsteKarte() {
    if (!RUN) return;
    if (imBoss() && !RUN.k.boss) RUN.k.boss = { hp: 100 };
    const x = ziehe();
    const f = fuelle(x.ctx);
    aktuelle = { k: x.k, ctx: x.ctx, f, text: ersetze(x.k.text, f) };
    if (!x.k.sonder) { RUN.k.benutzt[x.k.id] = 1; if (x.k.einmal) RUN.einmal[x.k.id] = 1; }
    if (!META.gesehen[x.k.id] && !x.k.sonder) META.gesehen[x.k.id] = 1;
    if (x.k.selten) { RUN.einmal[x.k.id] = 1; META.stats.selten++; if (!META.selten[x.k.id]) { META.selten[x.k.id] = 1; setTimeout(() => toast("✨ Seltene Karte entdeckt! <b>" + Object.keys(META.selten).length + "</b> gesammelt"), 600); } }
    if (x.k.wer === "katze") RUN.k.flags.katze_da = 1;
    wuerfelPruefen();
    zeigeKarte();
    if (x.k.selten) { Viz.zeige("funkeln"); Ton.spiel("gloeckchen", .7); }
    if (x.k.wer === "katze" || zz() < .02) setTimeout(katzeLauf, 700);
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
    const k = aktuelle.k, o = seite === 3 ? k.zoegern : k.opt[seite], ctx = aktuelle.ctx, f = aktuelle.f;
    let ops = o.w.ok, folge = o.folge, wurf = null;
    let dc = o.w.wurf, bossHilfe = 0;
    if (dc && istLetzteSession() && RUN.k.karte >= RUN.k.laenge - 1 && RUN.k.boss) { bossHilfe = Math.round((100 - RUN.k.boss.hp) / 14); dc = Math.max(2, dc - bossHilfe); }
    if (o.w.wurf) {
      wurf = wuerfeln(dc);
      wurf.bossHilfe = bossHilfe;
      if (ctx.sp) { memo(ctx.sp); if (wurf.r === 20) ctx.sp.mem.nat20++; if (wurf.r === 1) ctx.sp.mem.nat1++; if (wurf.ok) ctx.sp.mem.erfolge = (ctx.sp.mem.erfolge || 0) + 1; }
      if (wurf.r === 20 && RUN.k.zs) RUN.k.zs.nat20++;
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
        const opfer = op === "tod" && ctx.sp ? ctx.sp : (op === "tod2" && ctx.sp2 && anwesend(ctx.sp2) ? ctx.sp2 : wahl(aktiveSpieler().filter(s => s !== ctx.sp))) || ctx.sp || wahl(aktiveSpieler());
        if (opfer) ereignisse.push(heldStirbt(opfer));
      }
      else if (op === "tpk") { if (RUN.k.wzPlot || (hatWerkzeug("plot") && !hr("hardcore") && werkzeugRest("plot") > 0)) { werkzeugNutzen("plot", true); ereignisse.push({ t: "Plot-Rüstung! Die Gruppe überlebt knapp.", c: "gut" }); } else { aktiveSpieler().forEach(s => ereignisse.push(heldStirbt(s, true))); erfolg("tpk"); } }
      else if (op === "lvl") { aktiveSpieler().forEach(s => { s.held.stufe++; if (s.held.stufe >= 10) erfolg("stufe10held"); }); ereignisse.push({ t: "Stufenaufstieg! Alle Helden jetzt Stufe " + Math.round(durchschnittStufe()), c: "gut" }); }
      else if (op === "held") { if (ctx.sp) { ctx.sp.held = neuerHeld(ctx.sp); ereignisse.push({ t: ctx.sp.name + " spielt jetzt " + ctx.sp.held.name + " (" + ctx.sp.held.volk + "-" + ctx.sp.held.klasse + ")" }); } }
      else if (op === "geht") { if (ctx.sp) ereignisse.push(...spielerGeht(ctx.sp)); }
      else if (op === "neu") RUN.k.nachrueck = true;
      else if (op === "aufnehmen") { if (RUN.kandidat) { const kd = RUN.kandidat, mit = kd.mit; delete kd.mit; kd.mem.seit = RUN.karten; RUN.spieler.push(kd); if (mit && RUN.spieler[mit.i] && anwesend(RUN.spieler[mit.i])) bezNeu(kd, RUN.spieler[mit.i], mit.typ, zi(60, 82)); if (kd.ahn) erfolg("nachfahre"); if (RUN.k.zs) RUN.k.zs.neu++; ereignisse.push({ t: kd.name + " ist dabei!", c: "gut" }); RUN.kandidat = null; } }
      else if (op === "ende") RUN.k.karte = RUN.k.laenge - 2;
      else if (op === "sieg") RUN.k.sieg = true;
      else if (op === "frieden") { RUN.k.sieg = true; erfolg("frieden"); }
      else if (op === "drache") erfolg("drache");
      else if (op === "katze") erfolg("katze");
      else if (op === "nachfahre") erfolg("nachfahre");
      else if (op === "geist") erfolg("geist");
      else if ((m = op.match(/^\+(\w+)$/))) { if (m[1].startsWith("w_")) { RUN.flags = RUN.flags || {}; RUN.flags[m[1]] = 1; } else RUN.k.flags[m[1]] = 1; }
      else if ((m = op.match(/^-(\w+)$/))) { delete RUN.k.flags[m[1]]; if (RUN.flags) delete RUN.flags[m[1]]; }
      else if ((m = op.match(/^>>(\w+)$/))) RUN.queue.push({ id: m[1], ab: RUN.karten + zi(3, 7), sp: ctx.sp ? idx(ctx.sp) : null, sp2: ctx.sp2 ? idx(ctx.sp2) : null });
      else if ((m = op.match(/^>(\w+)$/))) RUN.queue.unshift({ id: m[1], ab: RUN.karten + 1, sp: ctx.sp ? idx(ctx.sp) : null, sp2: ctx.sp2 ? idx(ctx.sp2) : null });
      else if ((m = op.match(/^>>>(\w+)$/))) RUN.queue.push({ id: m[1], ab: RUN.karten + zi(12, 22), sp: ctx.sp ? idx(ctx.sp) : null, sp2: ctx.sp2 ? idx(ctx.sp2) : null });
      // Beziehungen
      else if ((m = op.match(/^bez([+-]\d+)$/))) { if (ctx.bez) { ctx.bez.wert = clamp(ctx.bez.wert + +m[1], 0, 100); if (ctx.bez.wert >= 88 && ["freunde", "paar", "geschwister"].includes(ctx.bez.typ)) { META.stats.bez++; } } }
      else if ((m = op.match(/^bez=(\w+)$/))) {
        if (m[1] === "weg") { if (ctx.bez) RUN.bez.splice(RUN.bez.indexOf(ctx.bez), 1); }
        else if (ctx.bez) { const alt = ctx.bez.typ; ctx.bez.typ = m[1]; if (m[1] === "paar" && alt !== "paar") { META.stats.bez++; ereignisse.push({ t: ctx.sp.name + " & " + ctx.sp2.name + " " + BEZ.paar.ic, c: "gut" }); } }
        else if (ctx.sp && ctx.sp2) ctx.bez = bezNeu(ctx.sp, ctx.sp2, m[1]);
      }
      else if ((m = op.match(/^bezneu=(\w+)$/))) { if (ctx.sp && ctx.sp2 && !bezZwischen(ctx.sp, ctx.sp2)) ctx.bez = bezNeu(ctx.sp, ctx.sp2, m[1], m[1] === "spannung" ? zi(30, 45) : zi(55, 70)); }
      else if ((m = op.match(/^vertrauen([+-]\d+)$/))) { if (ctx.sp) ctx.sp.vertrauen = clamp((ctx.sp.vertrauen == null ? 60 : ctx.sp.vertrauen) + +m[1], 0, 100); }
      else if ((m = op.match(/^laune2([+-]\d+)$/))) { if (ctx.sp2) ctx.sp2.laune = clamp(ctx.sp2.laune + +m[1], 0, 100); }
      else if ((m = op.match(/^beide([+-]\d+)$/))) { [ctx.sp, ctx.sp2].forEach(x => { if (x) x.laune = clamp(x.laune + +m[1], 0, 100); }); }
      // Krisen
      else if ((m = op.match(/^krise=(\w+)$/))) { if (ctx.sp) { ctx.sp.krise = { art: m[1], seit: RUN.karten }; META.stats.krisen++; } }
      else if (op === "krise-") { if (ctx.sp) delete ctx.sp.krise; }
      else if ((m = op.match(/^pause=(\d+)$/))) { if (ctx.sp && aktiveSpieler().length > 2) { ctx.sp.pause = { bis: (RUN.sessGesamt || 1) + +m[1], art: ctx.sp.krise ? ctx.sp.krise.art : "allg" }; ereignisse.push({ t: ctx.sp.name + " setzt " + (+m[1] === 1 ? "eine Session" : m[1] + " Sessions") + " aus" }); } }
      else if (op === "zurueck") { if (ctx.sp) { delete ctx.sp.pause; } }
      // Boss
      else if ((m = op.match(/^boss([+-])(\d+)$/))) {
        const b = RUN.k.boss = RUN.k.boss || { hp: 100 };
        let n = Math.round(+m[2] * (m[1] === "-" ? 1.9 : 1) * (krit > 1 && wurf && wurf.r === 20 ? 2 : 1));
        b.hp = clamp(b.hp + (m[1] === "+" ? n : -n), 0, 100);
        b.letzt = (m[1] === "+" ? n : -n);
        if (b.hp <= 0 && !RUN.k.flags.boss_besiegt) { RUN.k.flags.boss_besiegt = 1; RUN.k.sieg = true; META.stats.bosse++; ereignisse.push({ t: "Der Endgegner ist besiegt!", c: "gut" }); if (RUN.k.karte < RUN.k.laenge - 2) RUN.k.karte = RUN.k.laenge - 2; }
      }
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
    // Geheimes Ziel mitschreiben
    if (RUN.k.zs) for (const b of "mlst") { RUN.k.zs.min[b] = Math.min(RUN.k.zs.min[b], RUN.b[b]); RUN.k.zs.max[b] = Math.max(RUN.k.zs.max[b], RUN.b[b]); }
    return { folge: folgeText, wurf, ereignisse, vorher, delta, viz, ton, dc };
  }
  function spielerGeht(sp) {
    const ev = [];
    if (sp.weg) return ev;
    sp.weg = true; delete sp.krise; delete sp.pause;
    ev.push({ t: sp.name + " verlässt die Runde", c: "tod" });
    RUN.k.nachrueck = true;
    if (RUN.k.zs) RUN.k.zs.gegangen++;
    for (const x of bezVon(sp)) {
      if (!anwesend(x.ander)) continue;
      if (["paar", "freunde", "geschwister", "wg", "schwarm"].includes(x.z.typ)) {
        x.ander.laune = clamp(x.ander.laune - (x.z.typ === "paar" ? 16 : 10), 0, 100);
        if (x.z.typ === "paar" && x.z.wert > 62 && aktiveSpieler().length > 3 && zz() < .4) { x.ander.weg = true; delete x.ander.krise; if (RUN.k.zs) RUN.k.zs.gegangen++; ev.push({ t: x.ander.name + " geht mit", c: "tod" }); }
        else ev.push({ t: x.ander.name + " ist geknickt" });
      } else if (x.z.typ === "spannung" || x.z.typ === "ex") { x.ander.laune = clamp(x.ander.laune + 6, 0, 100); }
    }
    return ev;
  }
  function heldStirbt(sp, tpk) {
    if (!tpk && !hr("hardcore") && hatWerkzeug("plot") && werkzeugRest("plot") > 0) { werkzeugNutzen("plot", true); return { t: "Plot-Rüstung rettet " + sp.held.name + "!", c: "gut" }; }
    const h = sp.held;
    RUN.k.tote.push({ name: h.name, spieler: sp.name, klasse: h.klasse, volk: h.volk, stufe: h.stufe });
    META.welt.gefallene.push({ name: h.name, spieler: sp.name, jahr: META.welt.jahr });
    if (META.welt.gefallene.length > 120) META.welt.gefallene.shift();
    META.stats.tode++; sp.tode++;
    memo(sp); sp.mem.erinnerung.push({ held: h.name, kampagne: RUN.k.titel, klasse: h.klasse, karte: RUN.karten }); if (sp.mem.erinnerung.length > 6) sp.mem.erinnerung.shift(); sp.mem.letzterTod = RUN.karten;
    for (const x of bezVon(sp)) if (anwesend(x.ander) && ["paar", "freunde", "geschwister", "schwarm"].includes(x.z.typ)) x.ander.laune = clamp(x.ander.laune - 4, 0, 100);
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
      const vertrauen = s.vertrauen == null ? 60 : s.vertrauen;
      s.laune = clamp(s.laune + (d < 0 ? d * faktor * (1.3 - vertrauen / 200) : d), 0, 100);
    }
    // Beziehungen färben die Stimmung
    for (const z of RUN.bez || []) {
      const a = RUN.spieler[z.a], b = RUN.spieler[z.b];
      if (!anwesend(a) || !anwesend(b)) continue;
      let d = 0;
      if (z.typ === "spannung" || (z.typ === "ex" && z.wert < 40) || z.wert < 25) d = -.45 * faktor;
      else if (["paar", "freunde", "geschwister"].includes(z.typ) && z.wert > 72) d = .25;
      if (d) { a.laune = clamp(a.laune + d, 0, 100); b.laune = clamp(b.laune + d, 0, 100); }
      // Dinge beruhigen sich langsam von selbst
      if (z.typ === "spannung" && zz() < .06) z.wert = clamp(z.wert + 3, 0, 100);
      else if (zz() < .05) z.wert = clamp(z.wert + zi(-7, 5), 0, 100);   // Alltag: mal besser, mal schlechter
    }
    // Wer in einer Krise steckt, ist nicht ganz bei der Sache
    for (const s of aktiveSpieler()) if (s.krise && zz() < .3) s.laune = clamp(s.laune - .6, 0, 100);
  }

  /* ---------- Session- und Kampagnenende ---------- */
  function balkenTot() { for (const b of "mlst") { if (RUN.b[b] <= 0) return b + "0"; if (RUN.b[b] >= 100) return b + "1"; } if (aktiveSpieler().length + pausierte().length < 2) return "leer"; return null; }
  function sessionVorbei() { return RUN.k.karte >= RUN.k.laenge; }
  function sessionAbschluss() {
    const k = RUN.k;
    META.stats.sessions++;
    erfolg("session1");
    const imZiel = "mlst".split("").filter(b => RUN.b[b] >= ZONE[0] && RUN.b[b] <= ZONE[1]).length;
    let xp = 5 + imZiel * 2;
    if (RUN.k.zs && imZiel < 3) RUN.k.zs.zone = false;
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
    aktiveSpieler().forEach(s => { memo(s).mem.kampagnen++; });
    const Z1 = ZIELE.find(z => z.k === k.ziel);
    let zielErg = null;
    if (Z1 && k.zs) { const ok = !!Z1.ok(k); zielErg = { name: Z1.name, ic: Z1.ic, text: Z1.text, ok }; if (ok) { META.stats.ziele++; RUN.xp += 30; } }
    META.welt.chronik.push({ jahr: META.welt.jahr, titel: k.titel, schurke: k.schurke, sieg: !!k.sieg, helden: ueberlebende.map(u => u.name), tote: k.tote.map(t => t.name), tisch: aktiveSpieler().map(s => s.name) });
    if (META.welt.chronik.length > 200) META.welt.chronik.shift();
    if (!k.sieg && !META.welt.schurken.includes(k.schurke)) META.welt.schurken.push(k.schurke);
    if (k.sieg) META.welt.schurken = META.welt.schurken.filter(s => s !== k.schurke);
    META.welt.jahr += zi(1, 3);
    const xp = 25 + k.sessions * 3;
    RUN.xp += xp;
    // Wer geht nach der Kampagne?
    const gehen = [];
    for (const s of aktiveSpieler()) if (s.laune < 40 && zz() < .5) { spielerGeht(s); gehen.push(s.name); }
    // Balken atmen durch
    for (const b of "mlst") RUN.b[b] = Math.round(RUN.b[b] + (50 - RUN.b[b]) * .4);
    if (hatWerkzeug("legende")) aktiveSpieler().forEach(s => s.laune = clamp(s.laune + 12, 0, 100));
    aktiveSpieler().forEach(s => { s.laune = clamp(s.laune + 8, 0, 100); s.held = neuerHeld(s); });
    const alt = { titel: k.titel, sieg: k.sieg, schurke: k.schurke, tote: k.tote.length, helden: ueberlebende, gehen, xp, ziel: zielErg, boss: k.boss ? k.boss.hp : null, schwer: k.schwerLog || [] };
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
  /* ---------- Prognose: Wie wird der Tisch reagieren? ----------
     Für jede Wahl wird abgeschätzt, wie sich die Laune jedes Spielers verändert –
     über die Balken (was der Spielertyp mag), direkte Wirkungen, Tod des eigenen
     Helden, Gehen, Beziehungen. Bei Würfelproben gibt es zwei Zweige. */
  function zufriedenheit(s, b) {
    const W = TYPEN[s.typ].wunsch; let d = 0;
    for (const x in W) { const v = b[x], [lo, hi] = W[x]; d += v >= lo && v <= hi ? 1.1 : -Math.min(4.5, (v < lo ? lo - v : v - hi) / 7 + .6); }
    for (const x of "mlst") if (b[x] < 15 || b[x] > 88) d -= 1.2;
    return d;
  }
  function prognose(seite) {
    if (!aktuelle || !RUN) return null;
    const k = aktuelle.k, o = seite === 3 ? k.zoegern : k.opt[seite], ctx = aktuelle.ctx;
    if (!o) return null;
    const eskal = STAERKE * (1 + Math.min(.6, (RUN.k.nr - 1) * .08));
    const leute = aktiveSpieler(), zweige = o.w.wurf ? [o.w.ok, o.w.nein] : [o.w.ok];
    const erg = zweige.map(ops => {
      const b = Object.assign({}, RUN.b), d = new Map(leute.map(x => [x, 0])), tod = new Set(), geht = new Set(), pause = new Set();
      let todIrgendwer = false, bezSchaden = 0;
      const plus = (x, n) => { if (x && d.has(x)) d.set(x, d.get(x) + n); };
      for (const op of ops) {
        let m;
        if ((m = op.match(/^([mlst])([+-]\d+)$/))) b[m[1]] = clamp(b[m[1]] + +m[2] * eskal, 0, 100);
        else if ((m = op.match(/^laune([+-]\d+)$/))) plus(ctx.sp, +m[1]);
        else if ((m = op.match(/^laune2([+-]\d+)$/))) plus(ctx.sp2, +m[1]);
        else if ((m = op.match(/^beide([+-]\d+)$/))) { plus(ctx.sp, +m[1]); plus(ctx.sp2, +m[1]); }
        else if ((m = op.match(/^alle([+-]\d+)$/))) leute.forEach(x => plus(x, +m[1]));
        else if (op === "tod") { if (ctx.sp) tod.add(ctx.sp); else todIrgendwer = true; }
        else if (op === "tod2") { if (ctx.sp2 && anwesend(ctx.sp2)) tod.add(ctx.sp2); else todIrgendwer = true; }
        else if (op === "tpk") leute.forEach(x => tod.add(x));
        else if (op === "geht") { if (ctx.sp) geht.add(ctx.sp); }
        else if (/^pause=/.test(op)) { if (ctx.sp) pause.add(ctx.sp); }
        else if ((m = op.match(/^bez([+-]\d+)$/))) { plus(ctx.sp, +m[1] * .4); plus(ctx.sp2, +m[1] * .4); if (+m[1] < 0) bezSchaden += -m[1]; }
        else if ((m = op.match(/^bez=(\w+)$/))) { const n = ["ex", "weg", "spannung"].includes(m[1]) ? -10 : m[1] === "paar" ? 10 : 0; plus(ctx.sp, n); plus(ctx.sp2, n); if (n < 0) bezSchaden += 20; }
        else if (op === "lvl") leute.forEach(x => plus(x, x.typ === "power" ? 6 : 3));
        else if (op === "sieg") leute.forEach(x => plus(x, 5));
      }
      for (const x of leute) {
        plus(x, (zufriedenheit(x, b) - zufriedenheit(x, RUN.b)) * 3.2);
        if (tod.has(x)) { plus(x, x.typ === "chaos" ? -3 : x.typ === "drama" ? -6 : -13); for (const y of bezVon(x)) if (["paar", "freunde", "geschwister"].includes(y.z.typ)) plus(y.ander, -4); }
      }
      return { d, tod, geht, pause, todIrgendwer, bezSchaden, b };
    });
    const proSpieler = leute.map(x => {
      const werte = erg.map(e => e.d.get(x));
      return { sp: x, min: Math.min(...werte), max: Math.max(...werte), tod: erg.map(e => e.tod.has(x)), geht: erg.some(e => e.geht.has(x)), pause: erg.some(e => e.pause.has(x)) };
    });
    return { proSpieler, zweige: erg, wurf: o.w.wurf, o };
  }
  /* Was steht auf dem Spiel? – kurze, konkrete Zeilen */
  function buerde(p) {
    if (!p) return [];
    const z = [], sicher = !p.wurf, bars = p.zweige[0].b;
    for (const x of p.proSpieler) {
      const tod = x.tod.every(Boolean) ? "stirbt" : x.tod.some(Boolean) ? "kann sterben" : null;
      if (tod) z.push({ ic: "💀", t: x.sp.held.name + " (" + x.sp.name + ") " + tod, c: "tod" });
      if (x.geht) z.push({ ic: "🚪", t: x.sp.name + " verlässt die Runde", c: "tod" });
      if (x.pause) z.push({ ic: "💬", t: x.sp.name + " fehlt eine Weile", c: "schlecht" });
    }
    if (p.zweige.some(e => e.todIrgendwer)) z.push({ ic: "💀", t: "Irgendein Held kann sterben", c: "tod" });
    const schlecht = p.proSpieler.filter(x => x.max <= -5 && !x.tod.some(Boolean)).sort((a, b) => a.max - b.max);
    const gut = p.proSpieler.filter(x => x.min >= 5).sort((a, b) => b.min - a.min);
    if (schlecht.length) z.push({ ic: "😠", t: schlecht.slice(0, 3).map(x => x.sp.name).join(", ") + (schlecht.length === 1 ? " wird" : " werden") + " es dir übel nehmen", c: "schlecht" });
    const wackel = p.proSpieler.filter(x => x.min <= -5 && x.max >= 3);
    if (wackel.length && !sicher) z.push({ ic: "🎲", t: "Hängt am Wurf: " + wackel.slice(0, 3).map(x => x.sp.name).join(", "), c: "" });
    if (gut.length) z.push({ ic: "😊", t: gut.slice(0, 3).map(x => x.sp.name).join(", ") + (gut.length === 1 ? " wird" : " werden") + " es lieben", c: "gut" });
    if (p.zweige.some(e => e.bezSchaden >= 10) && aktuelle.ctx.sp2) z.push({ ic: "💔", t: aktuelle.ctx.sp.name + " und " + aktuelle.ctx.sp2.name + ": das belastet", c: "schlecht" });
    for (const B of BALKEN) {
      const v = bars[B.k], d = v - RUN.b[B.k];
      if (v <= 6 || v >= 94) z.push({ ic: "⚠️", t: B.name + " kippt fast", c: "tod" });
      else if (Math.abs(d) >= 12) z.push({ ic: d > 0 ? "⬆" : "⬇", t: B.name + (d > 0 ? " steigt stark" : " stürzt ab"), c: "" });
    }
    return z.slice(0, 5);
  }

  /* ---------- Nachhall: Spieler merken sich, was du entschieden hast ---------- */
  function nachhall(k, seite, launeVor, ereignisse, label) {
    const schwer = k.schwer;
    for (const x of aktiveSpieler().concat(RUN.spieler.filter(y => y.weg && launeVor[idx(y)] != null && !y.wegNotiert))) {
      memo(x); const m = x.mem;
      if (x.vertrauen == null) x.vertrauen = 60;
      const d = x.laune - launeVor[idx(x)];
      const heldTot = ereignisse.some(e => e.c === "tod" && e.t.includes("– " + x.name + " würfelt"));
      const durchWurf = !!(aktuelle.k.opt[seite] && aktuelle.k.opt[seite].w.wurf);
      if (d <= -7 || (heldTot && !durchWurf)) {
        m.groll = (m.groll || []).concat({ wahl: label, karte: RUN.karten, held: heldTot ? (m.erinnerung.slice(-1)[0] || {}).held : null }).slice(-4);
        x.vertrauen = clamp(x.vertrauen - (heldTot && !durchWurf ? 14 : schwer ? 9 : 5), 0, 100);
      } else if (d >= 7) {
        m.dank = (m.dank || []).concat({ wahl: label, karte: RUN.karten }).slice(-4);
        x.vertrauen = clamp(x.vertrauen + (schwer ? 7 : 4), 0, 100);
      }
      if (x.weg) x.wegNotiert = true;
    }
    if (schwer) { RUN.k.schwerLog = (RUN.k.schwerLog || []).concat({ t: ersetze(k.text, aktuelle.f).slice(0, 90), wahl: label }).slice(-12); }
  }

  /* ---------- Sitzplätze mit gezeichneten Figuren ---------- */
  const reaktion = {};
  const REAK = { jubel: ["lach", "🙌"], lachen: ["lach", "😂"], schock: ["schock", "😱"], kopf: ["traurig", ""], wuetend: ["wuetend", "💢"], traurig: ["traurig", "💧"], skeptisch: ["skeptisch", ""], stolz: ["stolz", "✨"], schlaf: ["schlaf", ""], handy: ["neutral", ""] };
  function haltung(s) {
    if (s.laune < 14) return "kopf";
    if (RUN.b.t < 22 && (idx(s) % 2 === 0 || s.laune < 40)) return "schlaf";
    if ((s.typ === "handy" && (RUN.b.s < 48 || RUN.b.t < 35)) || (s.laune < 28 && s.typ !== "regel" && idx(s) % 3 === 0)) return "handy";
    return "";
  }
  function progAusdruck(x) {
    if (x.tod.every(Boolean)) return ["schock", "💀", "tod"];
    if (x.geht) return ["traurig", "🚪", "tod"];
    if (x.tod.some(Boolean)) return ["schock", "🎲💀", "bang"];
    const lo = x.min, hi = x.max;
    if (lo <= -5 && hi >= 3) return ["skeptisch", "🎲", "bang"];
    if (hi <= -10) return ["wuetend", "▼▼", "minus"];
    if (hi <= -4) return ["skeptisch", "▼", "minus"];
    if (lo >= 9) return ["lach", "▲▲", "plus"];
    if (lo >= 4) return ["grins", "▲", "plus"];
    return ["neutral", "", "egal"];
  }
  function zeichneTisch(sprecher, prog) {
    const box = $("#tisch"); if (!RUN) { box.innerHTML = ""; return; }
    const jetzt = Date.now();
    const pMap = prog ? new Map(prog.proSpieler.map(x => [x.sp, progAusdruck(x)])) : null;
    box.classList.toggle("prognose", !!prog);
    box.innerHTML = RUN.spieler.filter(s => !s.weg).map(s => {
      memo(s);
      const i = idx(s), pr = pMap && pMap.get(s), r = !pr && reaktion[i] && reaktion[i].bis > jetzt ? reaktion[i].art : null;
      const pause = !!s.pause, h = pause || pr ? "" : haltung(s);
      const ausdruck = pr ? pr[0] : r ? REAK[r][0] : h === "kopf" ? "muede" : h === "schlaf" ? "schlaf" : null;
      const farbe = s.laune > 60 ? "#7fa64a" : s.laune > 35 ? "#e8b14e" : "#e0573a";
      const bz = bezVon(s).filter(x => anwesend(x.ander) || x.ander.pause).map(x => '<span title="' + esc(BEZ[x.z.typ].name + " mit " + x.ander.name + " (" + Math.round(x.z.wert) + ")") + '"' + (x.z.wert < 30 ? ' class="schlecht"' : "") + ">" + BEZ[x.z.typ].ic + "</span>").join("");
      const titel = s.name + " – " + typTitel(s) + " · " + s.held.name + ", " + s.held.volk + "-" + s.held.klasse + " (Stufe " + s.held.stufe + "), " + s.held.eigen + " · Laune " + Math.round(s.laune) + (s.krise ? " · " + KRISEN[s.krise.art].name : "") + (pause ? " · pausiert" : "");
      const reak = pr ? pr[1] : r && REAK[r][1] ? REAK[r][1] : h === "handy" ? "📱" : h === "schlaf" ? "💤" : "";
      return '<div class="platz' + (s === sprecher ? " spricht" : "") + (r ? " r-" + r : "") + (h ? " h-" + h : "") + (pause ? " pausiert" : "") + (pr ? " p-" + pr[2] : "") + '" data-i="' + i + '" title="' + esc(titel) + '"><div class="figur">' + GR.figur(s, ausdruck, { bg: pause ? "#cfc3ad" : "#efe0c0", rand: TYPEN[s.typ].farbe }) + (reak ? '<span class="reak">' + reak + "</span>" : "") + (s.krise ? '<span class="kr" title="' + esc(KRISEN[s.krise.art].name) + '">' + KRISEN[s.krise.art].ic + "</span>" : "") + (pause ? '<span class="kr">💬</span>' : "") + '</div><div class="pn">' + esc(s.name) + (bz ? '<span class="bz">' + bz + "</span>" : "") + '</div><div class="ph">' + (pause ? "pausiert" : esc(s.held.name) + "<br>" + esc(s.held.klasse) + " " + s.held.stufe) + '</div><div class="laune"><i style="width:' + s.laune + "%;background:" + farbe + '"></i></div></div>';
    }).join("");
  }
  function reagieren(erg, ctx) {
    const jetzt = Date.now();
    for (const s of aktiveSpieler()) {
      const i = idx(s), vor = erg.launeVor ? erg.launeVor[i] : s.laune, d = s.laune - vor;
      let art = null;
      if (erg.ereignisse.some(e => e.c === "tod" && e.t.includes("– " + s.name + " würfelt"))) art = "schock";
      else if (erg.wurf && ctx.sp === s && erg.wurf.r === 20) art = "jubel";
      else if (erg.wurf && ctx.sp === s && erg.wurf.r === 1) art = "kopf";
      else if (d >= 6) art = zz() < .5 ? "jubel" : "lachen";
      else if (d <= -6) art = zz() < .5 ? "wuetend" : "kopf";
      else if (erg.ereignisse.some(e => e.c === "tod")) art = zz() < .5 ? "schock" : "traurig";
      else if (zz() < .3) art = erg.delta.s > 4 ? "lachen" : erg.delta.s < -4 ? "skeptisch" : erg.delta.m > 5 ? "stolz" : RUN.b.t < 30 ? "schlaf" : null;
      if (art) reaktion[i] = { art, bis: jetzt + 2800 };
    }
    setTimeout(() => { if (RUN && !$("#schichten").children.length) zeichneTisch(aktuelle && aktuelle.ctx ? aktuelle.ctx.sp : null); }, 2900);
  }

  /* ---------- Der Spieltisch von oben ---------- */
  let tischKey = "";
  function zeichneTischbild() {
    const box = $("#tischbild"); if (!box) return;
    if (!RUN || !RUN.k) { box.innerHTML = ""; tischKey = ""; return; }
    const app = $("#app").getBoundingClientRect(), st = $("#stapel").getBoundingClientRect();
    if (!app.width || !st.width) return;
    const k = RUN.k, q = v => Math.round(v / 5) * 5;
    const z = {
      W: app.width, H: app.height, karte: { x: st.left - app.left, y: st.top - app.top, w: st.width, h: st.height },
      balken: { m: q(RUN.b.m), l: q(RUN.b.l), s: q(RUN.b.s), t: q(RUN.b.t) }, fortschritt: Math.round(Math.min(1, k.karte / k.laenge) * 10) / 10,
      spieler: aktiveSpieler().map(s => ({ name: s.held.name, farbe: TYPEN[s.typ].farbe, handy: haltung(s) === "handy" })),
      seed: k.nr * 97 + k.session * 13 + RUN.spieler.length, boss: imBoss() || (istLetzteSession() && k.karte >= k.laenge - 1), katze: !!(k.flags.katze_da || (k.nr + k.session) % 4 === 0),
      wuerfelSet: wuerfelSet()
    };
    const key = JSON.stringify([Math.round(z.W), Math.round(z.H), Math.round(z.karte.x), Math.round(z.karte.y), z.balken, z.fortschritt, z.spieler, z.seed, z.boss, z.katze, z.wuerfelSet.k]);
    if (key === tischKey) return;
    tischKey = key;
    box.innerHTML = GR.tisch(z);
  }
  let groessenTimer = null;
  window.addEventListener("resize", () => { clearTimeout(groessenTimer); groessenTimer = setTimeout(zeichneTischbild, 200); });
  function katzeLauf() {
    if (META.einst.ruhig || document.querySelector(".katzelauf")) return;
    const el = document.createElement("div"); el.className = "katzelauf"; el.setAttribute("aria-hidden", "true");
    el.innerHTML = '<svg viewBox="0 0 120 70"><g fill="#2a1d14"><path class="schwanz" d="M14 30 Q-4 20 4 4 Q8 0 10 4 Q4 18 18 26Z"/><ellipse cx="50" cy="34" rx="34" ry="14"/><path d="M78 26 Q84 14 96 16 Q108 18 106 32 Q104 40 92 40 Q82 40 78 34Z"/><path d="M88 18 L90 6 L96 16Z M100 17 L106 7 L106 20Z"/><g class="bein b1"><rect x="26" y="40" width="7" height="24" rx="3.5"/></g><g class="bein b2"><rect x="38" y="40" width="7" height="24" rx="3.5"/></g><g class="bein b2"><rect x="62" y="40" width="7" height="24" rx="3.5"/></g><g class="bein b1"><rect x="74" y="40" width="7" height="24" rx="3.5"/></g></g><circle cx="97" cy="26" r="2.6" fill="#e8b14e"/><circle cx="97.6" cy="26" r="1.1" fill="#1a1008"/><path d="M106 30 l8 -2 M106 32 l8 1" stroke="#8a7a62" stroke-width=".8"/></svg>';
    $("#app").appendChild(el);
    Ton.spiel("e_katze", .45, 1.6);
    setTimeout(() => el.remove(), 10000);
  }

  function zeichneFuss() {
    if (!RUN) return;
    const k = RUN.k;
    $("#zaehler").innerHTML = "<b>" + esc(k.titel) + "</b><br>Kampagne " + k.nr + " · Session " + k.session + "/" + k.sessions + " · Karte " + Math.min(k.karte + 1, k.laenge) + "/" + k.laenge + " · gesamt " + RUN.karten;
    $("#kopfunter").textContent = "Jahr " + META.welt.jahr + " der Chronik";
    const wz = WERKZEUGE.filter(w => !w.passiv && hatWerkzeug(w.k));
    $("#werkzeuge").innerHTML = (k.ziel ? '<button class="wz ziel" data-ziel title="Geheimes Ziel dieser Kampagne" aria-label="Geheimes Ziel">🎯</button>' : "") + wz.map(w => { const r = werkzeugRest(w.k); return '<button class="wz" data-wz="' + w.k + '" title="' + esc(w.name + ": " + w.text) + '" aria-label="' + esc(w.name) + '"' + (r ? "" : " disabled") + ">" + w.ic + (r ? "<i>" + r + "</i>" : "") + "</button>"; }).join("");
  }
  function sprecherInfo(ctx, k) {
    if (ctx.sp && !ctx.sym) {
      let rolle = typTitel(ctx.sp) + " · spielt " + ctx.sp.held.name;
      if (ctx.chat) rolle = "im Gruppenchat";
      else if (ctx.bez && ctx.sp2) rolle = typTitel(ctx.sp) + " · " + BEZ[ctx.bez.typ].ic + " " + ctx.sp2.name;
      else if (ctx.sp.krise && (k.krise || /^kr_|^kz_/.test(k.id))) rolle = typTitel(ctx.sp) + " · " + KRISEN[ctx.sp.krise.art].ic + " " + KRISEN[ctx.sp.krise.art].name;
      return { name: ctx.sp.name, rolle, svg: GR.figur(memo(ctx.sp), null, { rand: TYPEN[ctx.sp.typ].farbe }) };
    }
    const s = ctx.sym || k.wer;
    const namen = { sl: ["Deine innere Stimme", "Spielleiter"], npc: [aktuelle.f.npc, "Nichtspielercharakter"], schurke: [aktuelle.f.schurke, imBoss() ? "Der Endgegner" : "Der Schurke"], tisch: ["Am Tisch", "Das echte Leben"], welt: ["Die Welt", "Ereignis"], wuerfel: ["Die Würfel", "Schicksal"], gast: ["Besuch", "An der Tür"], katze: ["Würfelfresser", "Die Tischkatze"], regelbuch: ["Das Regelbuch", "Seite " + aktuelle.f.zahl * 13], geist: [aktuelle.f.tot, "Ein Geist"], gott: [aktuelle.f.gott, "Eine Gottheit"] };
    const n = namen[s] || ["?", ""];
    return { name: grossAnfang(n[0]), rolle: n[1], svg: portraitSymbol(s) };
  }

  let karteEl = null, sperre = false;
  function kartenTyp(ctx, k) { if (imBoss() || k.phase === "boss" || k.phase === "bossstart") return "boss"; if (ctx.chat) return "tisch"; return ctx.sym || (ctx.sp ? "spieler" : k.wer); }
  function bannerFuer(ctx, k, text) {
    const boss = imBoss() || k.phase === "boss" || k.phase === "bossstart";
    const szene = ctx.chat ? "chat" : GR.szeneFuer(k, text, ctx.sym || (ctx.sp ? "spieler" : k.wer), RUN.k.platz, boss);
    const fort = RUN.k.karte / Math.max(1, RUN.k.laenge), r = zz();
    const zeit = szene === "tisch" ? (fort > .5 ? "nacht" : "abend") : r < .25 ? null : fort < .4 ? "tag" : fort < .75 ? "abend" : "nacht";
    return GR.banner(szene, GR.hash(k.id) ^ (RUN.karten * 2654435761), zeit);
  }
  function bossLeiste() {
    const kz = $("#kopfzeile");
    if (!RUN.k.boss || !istLetzteSession() || RUN.k.karte < bossAb(RUN.k)) return false;
    const hp = RUN.k.boss.hp;
    kz.innerHTML = '<div class="bossleiste' + (hp <= 0 ? " besiegt" : "") + '"><span>' + esc(RUN.k.schurkeN || RUN.k.schurke.replace(/^(der|die|das) /, "")) + "</span><b><i style=\"width:" + hp + '%"></i></b><small>' + (hp <= 0 ? "besiegt" : hp + " / 100") + "</small></div>";
    return true;
  }
  function zeigeKarte() {
    const st = $("#stapel");
    if (karteEl) karteEl.remove();
    const k = aktuelle.k, info = sprecherInfo(aktuelle.ctx, k);
    const typ = kartenTyp(aktuelle.ctx, k);
    if (!aktuelle.banner) aktuelle.banner = bannerFuer(aktuelle.ctx, k, aktuelle.text);
    const el = document.createElement("div"); el.className = "karte neu t-" + typ + (k.selten ? " selten" : ""); el.setAttribute("role", "group"); el.setAttribute("aria-label", info.name);
    const wurf = k.opt.some(o => o.w.wurf);
    el.innerHTML = '<div class="banner">' + aktuelle.banner + '</div>' + GR.rahmen(typ, k.selten) + (k.selten ? '<div class="glanz"></div><div class="selten-tag">✦ selten ✦</div>' : "") + '<div class="wahl-schild"></div><div class="portrait">' + info.svg + '</div><div class="sprecher">' + esc(info.name) + '</div><div class="rolle">' + esc(info.rolle) + '</div><div class="text"><span>' + esc(aktuelle.text).replace(/„([^“]+)“/g, "„<em>$1</em>“") + "</span></div>" +
      (wurf ? '<div class="wurf">🎲 Probe möglich</div>' : "") + '<div class="fuss"><span>' + esc(RUN.k.titel) + "</span><span>" + (RUN.k.ziel ? '<span title="Geheimes Ziel">🎯</span>' : "") + "</span></div>";
    st.appendChild(el); karteEl = el;
    const [l, r, m] = k.opt;
    $("#wahl-l").lastElementChild.textContent = ersetze(l.label, aktuelle.f) + (l.w.wurf ? " 🎲" + l.w.wurf : "");
    $("#wahl-r").firstElementChild.textContent = ersetze(r.label, aktuelle.f) + (r.w.wurf ? " 🎲" + r.w.wurf : "");
    const mk = $("#wahl-m");
    mk.hidden = !m; if (m) mk.lastElementChild.textContent = ersetze(m.label, aktuelle.f) + (m.w.wurf ? " 🎲" + m.w.wurf : "");
    $("#wahlen").classList.toggle("drei", !!m);
    $("#wahlen").classList.remove("aus");
    if (!bossLeiste()) $("#kopfzeile").textContent = RUN.k.karte === 0 ? (RUN.k.session === 1 ? "Kampagne " + RUN.k.nr + ": „" + RUN.k.titel + "“ beginnt." : "Session " + RUN.k.session + " – zuletzt: " + (RUN.k.log.length ? RUN.k.log[RUN.k.log.length - 1].t.slice(0, 120) : "…")) : aktuelle.ctx.chat ? "📱 Nachricht im Gruppenchat" : "";
    zeichneBalken(); zeichneTisch(aktuelle.ctx.sp); zeichneFuss();
    requestAnimationFrame(zeichneTischbild);
    zieherAn(el);
    abwaegen = null; $("#app").classList.remove("schwer-moment"); ["l", "r", "m"].forEach(x => $("#wahl-" + x).classList.remove("bestaetigen"));
    if (k.schwer && !k.sonder) { el.classList.add("schwer"); const sg = document.createElement("div"); sg.className = "schwer-siegel"; sg.title = "Schwere Entscheidung – du wirst zweimal gefragt"; sg.textContent = "⚖"; el.appendChild(sg); }
    sperre = false;
    starteEile();
  }


  /* ---------- Ziehen / Wischen ---------- */
  let ziel = null;
  function zieherAn(el) {
    let sx = 0, sy = 0, dx = 0, dy = 0, aktiv = false, id = null;
    const schild = el.querySelector(".wahl-schild");
    const drei = () => aktuelle && aktuelle.k.opt[2];
    el.addEventListener("pointerdown", e => { if (sperre || el.classList.contains("folge")) return; aktiv = true; id = e.pointerId; sx = e.clientX; sy = e.clientY; dx = 0; dy = 0; el.setPointerCapture(id); el.classList.add("zieht"); el.classList.remove("neu"); Ton.start(); });
    el.addEventListener("pointermove", e => {
      if (!aktiv || e.pointerId !== id) return;
      dx = e.clientX - sx; dy = drei() ? Math.min(0, e.clientY - sy) : 0;
      el.style.transform = "translate(" + dx + "px," + dy + "px) rotate(" + dx / 18 + "deg)";
      const hoch = drei() && dy < -26 && Math.abs(dy) > Math.abs(dx);
      const seite = hoch ? 2 : dx < -18 ? 0 : dx > 18 ? 1 : null;
      if (seite !== ziel) { ziel = seite; markiere(seite); }
      schild.style.opacity = seite == null ? 0 : Math.min(1, Math.max(Math.abs(dx), Math.abs(dy)) / 70);
    });
    const ende = e => {
      if (!aktiv || (e && e.pointerId !== id)) return;
      aktiv = false; el.classList.remove("zieht");
      const breite = Math.min(window.innerWidth, 420);
      if (abwaegen != null && Math.abs(dx) < 8 && Math.abs(dy) < 8) { el.style.transform = ""; ziel = null; abwaegenEnde(); return; }
      if (drei() && dy < -90 && Math.abs(dy) > Math.abs(dx)) karteWeg(2);
      else if (Math.abs(dx) > breite * .28) karteWeg(dx < 0 ? 0 : 1);
      else { el.style.transform = ""; ziel = null; if (abwaegen != null) markiere(abwaegen); else { schild.style.opacity = 0; markiere(null); } }
    };
    el.addEventListener("pointerup", ende); el.addEventListener("pointercancel", ende);
  }

  function markiere(seite) {
    if (!aktuelle || !karteEl || sperre || karteEl.classList.contains("folge")) return;
    const schild = karteEl.querySelector(".wahl-schild"); if (!schild) return;
    if (seite == null) { zeichneBalken(); if (abwaegen == null) zeichneTisch(aktuelle.ctx.sp); return; }
    const o = aktuelle.k.opt[seite];
    zeichneTisch(aktuelle.ctx.sp, prognose(seite));
    schild.textContent = ersetze(o.label, aktuelle.f) + (o.w.wurf ? "  🎲 " + o.w.wurf + "+" : "");
    schild.classList.toggle("r", seite === 1); schild.classList.toggle("m", seite === 2);
    zeichneBalken(vorschauFuer(o));
  }
  ["l", "r", "m"].forEach((s, i) => {
    const b = $("#wahl-" + s);
    b.addEventListener("click", () => { Ton.start(); karteWeg(i); });
    b.addEventListener("mouseenter", () => markiere(i)); b.addEventListener("focus", () => markiere(i));
    b.addEventListener("mouseleave", () => markiere(abwaegen)); b.addEventListener("blur", () => markiere(abwaegen));
  });

  /* ---------- Abwägen: schwere Entscheidungen wollen zweimal getroffen werden ---------- */
  let abwaegen = null, eileTimer = null;
  const grob = () => window.matchMedia && window.matchMedia("(pointer: coarse)").matches;
  function abwaegenStart(seite) {
    abwaegen = seite;
    const el = karteEl; el.style.transform = "";
    el.classList.remove("ab-l", "ab-r", "ab-o", "neu"); el.classList.add("abwaegen", seite === 0 ? "ab-l" : seite === 2 ? "ab-o" : "ab-r");
    markiere(seite);
    const schild = el.querySelector(".wahl-schild"); if (schild) schild.style.opacity = 1;
    const p = prognose(seite), z = buerde(p), o = aktuelle.k.opt[seite];
    let box = el.querySelector(".buerde"); if (!box) { box = document.createElement("div"); box.className = "buerde"; el.appendChild(box); }
    box.innerHTML = '<div class="b-kopf">⚖ Schwere Entscheidung</div><div class="b-wahl">„' + esc(ersetze(o.label, aktuelle.f)) + "“" + (o.w.wurf ? " <small>🎲 " + o.w.wurf + "+</small>" : "") + "</div>" +
      (z.length ? "<ul>" + z.map(x => '<li class="' + x.c + '"><span>' + x.ic + "</span>" + esc(x.t) + "</li>").join("") + "</ul>" : '<p class="leise">Keiner am Tisch wird es dir krummnehmen. Glaubst du.</p>') +
      '<div class="b-fuss">' + (grob() ? "Nochmal in dieselbe Richtung wischen · Karte antippen nimmt zurück" : "Nochmal wählen, um es zu besiegeln · Esc nimmt zurück") + "</div>";
    $("#app").classList.add("schwer-moment");
    ["l", "r", "m"].forEach((x, i) => $("#wahl-" + x).classList.toggle("bestaetigen", i === seite));
    Ton.spiel("a_herzschlag", .6); vib([15, 90, 15]);
  }
  function abwaegenEnde() {
    abwaegen = null;
    if (karteEl) { karteEl.classList.remove("abwaegen", "ab-l", "ab-r", "ab-o"); const b = karteEl.querySelector(".buerde"); if (b) b.remove(); const sch = karteEl.querySelector(".wahl-schild"); if (sch) sch.style.opacity = 0; }
    $("#app").classList.remove("schwer-moment");
    ["l", "r", "m"].forEach(x => $("#wahl-" + x).classList.remove("bestaetigen"));
    if (aktuelle) markiere(null);
  }
  function starteEile() {
    clearInterval(eileTimer);
    const k = aktuelle.k, el = karteEl;
    if (!k.eile || !k.zoegern || !el || META.einst.keineEile) return;
    const dauer = (+k.eile || 12) * 1000; let rest = dauer;
    const lunte = document.createElement("div"); lunte.className = "lunte"; lunte.innerHTML = "<i></i><b>⏳ " + Math.round(dauer / 1000) + "</b>"; el.appendChild(lunte);
    Ton.spiel("a_uhr", .45);
    eileTimer = setInterval(() => {
      if (karteEl !== el || !aktuelle || aktuelle.k !== k) { clearInterval(eileTimer); return; }
      if ($("#schichten").children.length || sperre) return;
      rest -= 100;
      lunte.firstChild.style.width = Math.max(0, rest / dauer * 100) + "%";
      lunte.lastChild.textContent = "⏳ " + Math.ceil(Math.max(0, rest) / 1000);
      if (rest <= 4000 && !el.classList.contains("eilt")) { el.classList.add("eilt"); Ton.spiel("a_herzschlag", .5); }
      if (rest <= 0) { clearInterval(eileTimer); abwaegenEnde(); karteWeg(3, false, true); }
    }, 100);
  }

  function karteWeg(seite, ueberspringen, zeitUm) {
    if (sperre || !aktuelle || !karteEl) return;
    if (seite === 2 && !aktuelle.k.opt[2]) return;
    if (seite === 3 && !aktuelle.k.zoegern) return;
    if (!ueberspringen && !zeitUm && seite !== 3 && aktuelle.k.schwer && abwaegen !== seite && !META.einst.schnell) { abwaegenStart(seite); return; }
    const besiegelt = abwaegen === seite && !zeitUm;
    sperre = true; clearInterval(eileTimer);
    const el = karteEl;
    if (besiegelt) {
      el.classList.add("besiegelt"); Ton.spiel("gong", .55); vib([30, 50, 60]);
      const b = el.querySelector(".buerde"); if (b) b.classList.add("weg");
      setTimeout(() => { $("#app").classList.remove("schwer-moment"); weiterWeg(); }, 650);
    } else weiterWeg();
    function weiterWeg() {
    abwaegen = null; ["l", "r", "m"].forEach(x => $("#wahl-" + x).classList.remove("bestaetigen"));
    el.classList.remove("zieht", "neu"); el.style.transform = "";
    el.classList.add(seite === 0 ? "weg-l" : seite === 2 ? "weg-o" : seite === 3 ? "weg-u" : "weg-r");
    $("#wahlen").classList.add("aus");
    Ton.spiel("e_papier", .5);
    vib(12);
    if (ueberspringen) { setTimeout(() => { RUN.k.benutzt[aktuelle.k.id] = 1; naechsteKarte(); }, 330); return; }
    const launeVor = RUN.spieler.map(s => s.laune);
    const kk = aktuelle.k, label = seite === 3 ? "zu lange gezögert" : ersetze(kk.opt[seite].label, aktuelle.f);
    const erg = anwenden(seite);
    nachhall(kk, seite, launeVor, erg.ereignisse, label);
    erg.launeVor = launeVor; erg.ctx = aktuelle.ctx; erg.banner = aktuelle.banner; erg.typ = kartenTyp(aktuelle.ctx, aktuelle.k); erg.zoegern = seite === 3; erg.schwer = kk.schwer;
    setTimeout(() => {
      if (erg.wurf) zeigeWurf(erg, () => zeigeFolge(erg));
      else zeigeFolge(erg);
    }, 300);
    }
  }
  function zeigeWurf(erg, fertig) {
    const w = erg.wurf, box = document.createElement("div"), set = wuerfelSet();
    box.className = "wuerfel rollt set-" + set.k + (w.r === 20 ? " krit" : w.r === 1 ? " patzer" : "");
    box.innerHTML = GR.wuerfelSvg(set, w.r) +
      '<div class="erg">' + (w.r === 20 ? "Natürliche 20!" : w.r === 1 ? "Patzer!" : w.r + (w.bonus ? "+" + w.bonus : "") + " gegen " + erg.dc) + (w.gefaelscht ? " … 🛡️" : "") + (w.bossHilfe ? '<small>Endgegner geschwächt: −' + w.bossHilfe + "</small>" : "") + "</div>";
    $("#buehne").appendChild(box);
    Ton.spiel("fx_ca_dice_shake_" + zi(1, 3)); Ton.spiel("fx_ca_dice_throw_" + zi(1, 3), .9, .35);
    if (set.ton) Ton.spiel(set.tonN ? set.ton + zi(1, set.tonN) : set.ton, .55, .8);
    setTimeout(() => { Ton.spiel(w.ok ? (w.r === 20 ? "fx_wn_heilig_2" : "glock_103") : (w.r === 1 ? "n_lachen_boese" : "e_raunen"), .8); if (w.r === 20) Viz.zeige("funkeln"); vib(w.ok ? 20 : [30, 40, 30]); }, 900);
    setTimeout(() => { box.remove(); fertig(); }, 1900);
  }

  function zeigeFolge(erg) {
    const st = $("#stapel");
    if (karteEl) karteEl.remove();
    const el = document.createElement("div"); el.className = "karte folge neu t-" + (erg.typ || "spieler"); el.tabIndex = 0;
    const ev = erg.ereignisse.map(e => '<span class="' + (e.c || "") + '">' + esc(e.t) + "</span>").join("");
    const pfeile = "mlst".split("").filter(b => Math.round(erg.delta[b])).map(b => { const B = BALKEN.find(x => x.k === b), d = Math.round(RUN ? RUN.b[b] - erg.vorher[b] : erg.delta[b]); return d ? (B.name + " " + (d > 0 ? "+" : "") + d) : ""; }).filter(Boolean).join(" · ");
    const boss = RUN && RUN.k.boss && RUN.k.boss.letzt ? '<div class="bosstreffer ' + (RUN.k.boss.letzt < 0 ? "ja" : "nein") + '">' + (RUN.k.boss.letzt < 0 ? "Endgegner " + RUN.k.boss.letzt : "Endgegner erholt sich +" + RUN.k.boss.letzt) + "</div>" : "";
    if (RUN && RUN.k.boss) RUN.k.boss.letzt = 0;
    el.innerHTML = (erg.banner ? '<div class="banner klein">' + erg.banner + "</div>" : "") + GR.rahmen(erg.typ || "spieler", false) + '<div class="folge-kopf">' + (erg.zoegern ? "Du hast zu lange gezögert …" : erg.wurf ? (erg.wurf.ok ? "Gelungen" : "Misslungen") : erg.schwer ? "Entschieden." : "Und dann …") + '</div>' + boss + '<div class="text"><span>' + esc(erg.folge || "Die Geschichte geht weiter.") + '</span></div><div class="ereignisse">' + ev + '</div><div class="fuss"><span>' + esc(pfeile) + '</span><span class="weiter">weiter ▸</span></div>';
    st.appendChild(el); karteEl = el;
    Viz.zeige(erg.viz);
    if (!META.einst.ruhig) {
      if (["feuer", "explosion", "drache"].includes(erg.viz)) setTimeout(() => GR.randFeuer(el), erg.viz === "drache" ? 1300 : 150);
      if (erg.ereignisse.some(e => e.c === "tod")) setTimeout(() => GR.tod(el), 250);
    }
    if (erg.ton) Ton.spiel(erg.ton, .85);
    if (erg.ereignisse.some(e => e.c === "tod")) { setTimeout(() => Ton.spiel("n_tod", .7), 500); vib([40, 60, 40]); }
    if (RUN) reagieren(erg, erg.ctx || {});
    zeichneBalken(); zeichneTisch(); zeichneFuss();
    if (RUN) bossLeiste();
    requestAnimationFrame(zeichneTischbild);
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
    aktiveSpieler().forEach(s => {
      const platz = document.querySelector('.platz[data-i="' + idx(s) + '"]');
      if (!platz || zz() > .2) return;
      const typ = s.typ, l = s.laune, m = merkmale(s);
      const pool = l < 25 ? ["seufz…", "boah", "ernsthaft?", "hm.", "…", "können wir weiter?"] : l > 75 ? ["YES!", "geil", "jaaa", "🎲!", "hahaha", "okay, liebe ich"] : m.trauert ? ["RIP " + (s.mem.erinnerung.slice(-1)[0] || {}).held, "*schaut auf alten Bogen*"] : m.pechvogel ? ["natürlich wieder ich", "meine Würfel hassen mich"] : typ === "regel" ? ["Seite 193…", "regeltechnisch…"] : typ === "snack" ? ["*knusper*", "Chips?"] : typ === "chaos" ? ["ICH WÜRFLE!", "Feuerball?"] : typ === "drama" ? ["*Monolog*", "Mein Held!"] : typ === "taktik" ? ["Formation!", "hm, Flanke…"] : ["hm", "okay", "nice", "😅"];
      const b = document.createElement("div"); b.className = "blase"; b.textContent = wahl(pool); platz.appendChild(b); setTimeout(() => b.remove(), 2500);
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
    const f = fenster('<h2>' + (alt.sieg ? "Sieg!" : "Kampagne beendet") + '</h2><p><b>„' + esc(alt.titel) + '“</b> ist zu Ende. ' + (alt.sieg ? esc(alt.schurke) + " ist besiegt." : esc(alt.schurke) + " ist entkommen … und wird wiederkehren.") + ' ' + (alt.tote ? alt.tote + " Helden sind gefallen." : "Niemand ist gefallen.") + '</p><h3>Neue Legenden</h3><ul class="liste">' + (helden || "<li>keine</li>") + '</ul>' + (alt.gehen.length ? "<p class='leise'>Nicht mehr dabei: " + esc(alt.gehen.join(", ")) + "</p>" : "") + '' + (alt.schwer && alt.schwer.length ? '<h3>Entscheidungen, die bleiben</h3><ul class="liste schwerliste">' + alt.schwer.slice(-5).map(x => '<li><small>' + esc(x.t) + '…</small><br>⚖ <b>' + esc(x.wahl) + '</b></li>').join("") + '</ul>' : "") + (alt.ziel ? '<div class="zielkarte ' + (alt.ziel.ok ? "ok" : "nein") + '"><span class="ic">' + alt.ziel.ic + "</span><b>Geheimes Ziel: " + esc(alt.ziel.name) + "</b><p>" + esc(alt.ziel.text) + "</p><small>" + (alt.ziel.ok ? "Geschafft! +30 Erfahrung" : "Leider nicht geschafft.") + "</small></div>" : "") + '<p><b>+' + (alt.xp + s.xp) + ' Erfahrung</b> · Die Chronik ist jetzt im Jahr ' + META.welt.jahr + '.</p><p class="leise">Die Runde bleibt zusammen. Neue Helden werden gewürfelt – eine neue Geschichte beginnt: <b>„' + esc(RUN.k.titel) + '“</b></p><div class="reihe"><button class="knopf" data-los>▶ Weiter erzählen</button></div>', { zu: false });
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
      wuerfel: '<p>Würfelsets: <b>' + Object.keys(META.wuerfel).length + " / " + GR.WUERFEL.length + '</b> – tippe ein Set an, um damit zu würfeln.</p><div class="gitter wgitter">' + GR.WUERFEL.map(w => { const hat = META.wuerfel[w.k]; return '<button class="kachel wkachel' + (hat ? "" : " gesperrt") + (META.wuerfelAktiv === w.k ? " aktiv" : "") + '" data-set="' + w.k + '"' + (hat ? "" : " disabled") + ">" + GR.wuerfelSvg(hat ? w : { k: "zu", farbe: "#4a3a2c", rand: "#2b1d12", zahl: "#8a7a62" }, hat ? 20 : "?") + "<b>" + (hat ? esc(w.name) : "???") + "</b><small>" + esc(hat ? w.text : "🔒 " + FREI_TEXT[w.frei]) + "</small></button>"; }).join("") + "</div>" +
        '<h3>Seltene Karten</h3><p>' + Object.keys(META.selten).length + " von " + KARTEN.filter(k => k.selten).length + ' entdeckt. Seltene Karten haben einen goldenen Rand und eine dritte Wahl (nach oben wischen oder ↑).</p><div class="gitter">' + KARTEN.filter(k => k.selten).map(k => '<div class="kachel' + (META.selten[k.id] ? " goldkachel" : " gesperrt") + '"><span class="ic">' + (META.selten[k.id] ? "✦" : "❔") + "</span>" + (META.selten[k.id] ? esc(k.titel || k.text.replace(/\{\w+\}/g, "…").slice(0, 60) + "…") : "noch nicht gezogen") + "</div>").join("") + "</div>",
      stats: '<ul class="liste">' + [["Karten gespielt", META.stats.karten], ["Bester Lauf", META.stats.besteKarten + " Karten"], ["Runden", META.stats.runden], ["Sessions", META.stats.sessions], ["Kampagnen beendet", META.stats.kampagnen], ["Helden erschaffen", META.stats.helden], ["Helden gestorben", META.stats.tode], ["Legenden", META.stats.legenden], ["Würfe", META.stats.wuerfe], ["Natürliche 20", META.stats.nat20], ["Natürliche 1", META.stats.nat1], ["Notfall-Pizzen", META.stats.pizza], ["Spieler kennengelernt", META.stats.spieler], ["Endgegner besiegt", META.stats.bosse], ["Geheime Ziele erreicht", META.stats.ziele], ["Echte Krisen am Tisch", META.stats.krisen], ["Seltene Karten gezogen", META.stats.selten]].map(([a, b]) => "<li>" + a + ": <b>" + b + "</b></li>").join("") + "</ul>"
    };
    const f = fenster('<h2>Spielleiter-Buch</h2><div class="tabs" role="tablist">' + [["stufe", "Stufe & Werkzeuge"], ["erfolge", "Erfolge"], ["karten", "Karten & Enden"], ["wuerfel", "Würfel & Seltenes"], ["stats", "Statistik"]].map(([k, n]) => '<button role="tab" data-tab="' + k + '" aria-selected="' + (k === tab) + '">' + n + "</button>").join("") + "</div>" + inhalt[tab]);
    f.querySelectorAll("[data-tab]").forEach(b => b.addEventListener("click", () => { f.remove(); spielleiterBuch(b.dataset.tab); }));
    f.querySelectorAll("[data-set]").forEach(b => b.addEventListener("click", () => { META.wuerfelAktiv = b.dataset.set; speichern(); Ton.start(); const w = GR.WUERFEL.find(x => x.k === b.dataset.set); Ton.spiel("fx_ca_dice_throw_" + zi(1, 3), .8); if (w && w.ton) Ton.spiel(w.tonN ? w.ton + zi(1, w.tonN) : w.ton, .5, .3); tischKey = ""; f.remove(); spielleiterBuch("wuerfel"); }));
  }
  function chronikFenster() {
    const W = META.welt;
    const ch = W.chronik.slice().reverse().map(c => "<li><b>Jahr " + c.jahr + ": „" + esc(c.titel) + "“</b><br><small>" + (c.sieg ? "Sieg über " : "Ungelöst – ") + esc(c.schurke) + " · Helden: " + esc(c.helden.join(", ") || "–") + (c.tote.length ? " · Gefallen: " + esc(c.tote.join(", ")) : "") + "</small></li>").join("");
    const leg = W.legenden.slice(-30).reverse().map(l => "<li><b>" + esc(l.name) + "</b> <small>" + esc(l.volk + "-" + l.klasse + ", Stufe " + l.stufe + " · Jahr " + l.jahr + " · " + l.spieler) + "</small></li>").join("");
    const gef = W.gefallene.slice(-30).reverse().map(g => esc(g.name)).join(", ");
    fenster('<h2>Welt-Chronik</h2><p>Jahr <b>' + W.jahr + '</b>. ' + W.chronik.length + ' Geschichten wurden erzählt. Die Welt vergisst nichts.</p>' + (W.schurken.length ? "<p class='leise'>Noch auf freiem Fuß: " + esc(W.schurken.join(", ")) + "</p>" : "") + '<h3>Geschichten</h3><ul class="liste">' + (ch || "<li class='leise'>Noch keine – beende deine erste Kampagne.</li>") + '</ul><h3>Legenden</h3><ul class="liste">' + (leg || "<li class='leise'>Noch keine.</li>") + "</ul><h3>Gefallene</h3><p class='leise'>" + (gef || "Noch niemand. Noch.") + "</p>");
  }
  const MERK_TEXT = { groll: "nimmt dir eine Entscheidung übel", heldgeopfert: "hat dir nicht verziehen, dass du den Helden geopfert hast", dank: "ist dir für eine Entscheidung dankbar", misstrauisch: "traut deinen Entscheidungen nicht mehr", vertraut: "würde dir blind folgen", pechvogel: "Pechvogel – würfelt auffällig oft die 1", glueckskind: "Glückskind – die Würfel lieben", trauert: "trauert noch um den letzten Helden", verbittert: "hat schon zu viele Helden verloren", paranoid: "traut keiner Truhe mehr", stammgast: "Stammgast seit mehreren Kampagnen", uebermuetig: "fühlt sich langsam unbesiegbar", frisch: "noch ganz neu in dieser Runde" };
  function tischFenster() {
    if (!RUN) { fenster("<h2>Am Tisch</h2><p>Gerade läuft keine Runde.</p>"); return; }
    const leute = RUN.spieler.filter(s => !s.weg);
    const bz = (RUN.bez || []).filter(z => !RUN.spieler[z.a].weg && !RUN.spieler[z.b].weg).map(z => '<li class="bezzeile"><span>' + esc(RUN.spieler[z.a].name) + " " + BEZ[z.typ].ic + " " + esc(RUN.spieler[z.b].name) + "</span><small>" + BEZ[z.typ].name + '</small><b class="bezwert"><i style="width:' + Math.round(z.wert) + "%;background:" + (z.wert > 60 ? "#7fa64a" : z.wert > 35 ? "#e8b14e" : "#e0573a") + '"></i></b></li>').join("");
    fenster('<h2>Am Tisch</h2><ul class="liste">' + leute.map(s => {
      memo(s);
      const W = TYPEN[s.typ].wunsch;
      const mag = Object.keys(W).map(b => { const B = BALKEN.find(x => x.k === b); return B.name + " " + W[b][0] + "–" + W[b][1]; }).join(", ");
      const mk = Object.keys(merkmale(s)).filter(x => MERK_TEXT[x]).map(x => MERK_TEXT[x]);
      const erin = s.mem.erinnerung.slice(-3).map(e => e.held).join(", ");
      return '<li style="display:flex;gap:.6rem;align-items:center"><span style="width:58px;flex:none">' + GR.figur(s, null, { rand: TYPEN[s.typ].farbe }) + "</span><span><b>" + esc(s.name) + "</b> – " + esc(typTitel(s)) + " <small>(Laune " + Math.round(s.laune) + " · Vertrauen in dich " + Math.round(s.vertrauen == null ? 60 : s.vertrauen) + ")</small>" + (s.krise ? " <small>" + KRISEN[s.krise.art].ic + " " + KRISEN[s.krise.art].name + "</small>" : "") + (s.pause ? " <small>💬 pausiert</small>" : "") + "<br><small>" + esc(TYPEN[s.typ].motto) + " Mag: " + esc(mag) + "</small><br>Spielt <b>" + esc(s.held.name) + "</b>, " + esc(s.held.volk + "-" + s.held.klasse) + ", Stufe " + s.held.stufe + " – " + esc(s.held.eigen) + (erin ? "<br><small>Vermisst noch: " + esc(erin) + "</small>" : "") + (mk.length ? "<br><small class='merk'>" + esc(mk.join(" · ")) + "</small>" : "") + "</span></li>";
    }).join("") + "</ul>" + (bz ? '<h3>Wer mit wem</h3><ul class="liste">' + bz + "</ul>" : "") + '<p class="leise">Fällt die Laune eines Spielers auf null, will er gehen. Beziehungen färben die Stimmung: Wer sich gerade nicht grün ist, zieht beide runter. Wer geht, nimmt manchmal jemanden mit.</p>');
  }

  function regelFenster() {
    fenster('<h2>So wird gespielt</h2><p>Du bist die Spielleitung. Jede Karte ist ein Moment am Spieltisch. <b>Wische nach links oder rechts</b> (oder tippe auf die Knöpfe, am PC: ← / →), um zu entscheiden.</p><h3>Die vier Balken</h3><p><b>Macht</b> (mickrig ↔ OP), <b>Realismus</b> (Schwachsinn ↔ Bürokratie), <b>Spaß</b> (Pain ↔ Albern-Kollaps), <b>Tempo</b> (zäh ↔ gehetzt). Der grüne Bereich liegt etwa zwischen der Mitte und drei Vierteln. Läuft ein Balken <b>ganz leer oder ganz voll</b>, kippt die Runde – Spielende.</p><p>Beim Zielen zeigen Punkte über den Balken, welche sich bewegen (groß = viel). Ab Spielleiter-Stufe 2 siehst du auch die Richtung.</p><h3>Die Spieler</h3><p>Jeder Spielertyp mag andere Balkenstände. Ist ein Balken lange außerhalb ihres Geschmacks, sinkt die Laune – bei null wollen sie gehen. Unter zwei Spielern ist die Runde vorbei.</p><h3>Würfel</h3><p>Manche Wahl verlangt eine Probe (🎲 12 = mindestens 12 auf dem W20). Eine 20 gelingt immer, eine 1 nie. Im Spielleiter-Buch sammelst du Würfelsets – jedes klingt und sieht anders aus.</p><h3>Die Menschen am Tisch</h3><p>Manche Spieler sind befreundet, Geschwister, ein Paar oder können sich gerade nicht leiden. Das färbt die Laune beider. Spieler merken sich, was ihnen passiert ist: gefallene Helden, Pech beim Würfeln, wie lange sie schon dabei sind. Und manchmal kommt das echte Leben dazwischen – ein Umzug, ein Baby, ein neuer Job. Dann pausiert jemand und meldet sich im Gruppenchat.</p><h3>Schwere Entscheidungen</h3><p>Wenn du eine Wahl antippst oder die Karte anziehst, siehst du an den Gesichtern am Tisch, wer sich freut (▲), wer sauer wird (▼) und wessen Held in Gefahr ist (💀). Karten mit rotem ⚖-Siegel sind schwer: Du wirst gefragt, ob du das wirklich willst, und siehst, was auf dem Spiel steht. Manchmal brennt oben eine Lunte – wer zu lange zögert, lässt die Zeit entscheiden. Spieler merken sich deine Entscheidungen: Wer sich übergangen fühlt, verliert das Vertrauen in dich, nimmt Rückschläge schwerer und spricht dich irgendwann darauf an.</p><h3>Bosskampf & Ziele</h3><p>In der letzten Session jeder Kampagne wartet der Endgegner. Jeder Treffer im Bosskampf macht das Finale leichter. Jede Kampagne hat außerdem ein <b>geheimes Ziel</b> (🎯 unten rechts). <b>Seltene Karten</b> glänzen golden und haben eine dritte Wahl: nach oben wischen oder ↑.</p><h3>Für immer</h3><p>Sessions werden zu Kampagnen, Kampagnen zur Welt-Chronik. Überlebende Helden werden Legenden, Schurken kehren zurück. Deine Spielleiter-Stufe, Werkzeuge, Hausregeln und Erfolge bleiben auch nach dem Ende einer Runde.</p><p class="leise">Tastatur: ← / → oder A / D wählen, ↑ / W für die dritte Wahl, Leertaste weiter, M Menü.</p>');
  }
  function einstellungen() {
    const e = META.einst;
    const f = fenster('<h2>Einstellungen</h2><div class="schalter"><span>Atmosphäre (Hintergrundklang)</span><input type="range" min="0" max="1" step="0.05" value="' + e.atmo + '" data-e="atmo"></div><div class="schalter"><span>Effekte</span><input type="range" min="0" max="1" step="0.05" value="' + e.fx + '" data-e="fx"></div><div class="schalter"><span>Schwere Entscheidungen ohne Rückfrage</span><input type="checkbox" data-e="schnell"' + (e.schnell ? " checked" : "") + '></div><div class="schalter"><span>Ohne Zeitdruck (keine ablaufende Lunte)</span><input type="checkbox" data-e="keineEile"' + (e.keineEile ? " checked" : "") + '></div><div class="schalter"><span>Vibration</span><input type="checkbox" data-e="vib"' + (e.vib ? " checked" : "") + '></div><div class="schalter"><span>Automatisch weiterblättern</span><input type="checkbox" data-e="auto"' + (e.auto ? " checked" : "") + '></div><div class="schalter"><span>Weniger Bewegung</span><input type="checkbox" data-e="ruhig"' + (e.ruhig ? " checked" : "") + '></div><h3>Spielstand</h3><p class="leise">Alles wird nur in diesem Browser gespeichert.</p><div class="reihe"><button class="knopf zweit" data-loesch>Alles zurücksetzen</button></div><p class="leise">Klänge: echte Aufnahmen aus der Bühne von imrestales.de (freie Lizenzen, siehe amb/).</p>');
    f.addEventListener("input", ev => { const i = ev.target.closest("[data-e]"); if (!i) return; e[i.dataset.e] = i.type === "checkbox" ? i.checked : +i.value; Ton.start(); Ton.lautstaerke(); document.body.classList.toggle("ruhig", e.ruhig); speichern(); });
    f.querySelector("[data-loesch]").addEventListener("click", () => confirmFenster("Wirklich alles löschen – Stufe, Erfolge, Chronik?", () => { META = metaNeu(); RUN = null; speichern(); location.reload(); }));
  }
  function zielFenster() {
    if (!RUN || !RUN.k.ziel) return;
    const Z1 = ZIELE.find(z => z.k === RUN.k.ziel);
    fenster('<h2>🎯 Geheimes Ziel</h2><p class="leise">Nur du hinter dem Schirm weißt davon. Schaffst du es bis zum Ende dieser Kampagne, gibt es +30 Erfahrung – und vielleicht ein neues Würfelset.</p><div class="zielkarte"><span class="ic">' + Z1.ic + "</span><b>" + esc(Z1.name) + "</b><p>" + esc(Z1.text) + "</p>" + (Z1.stand ? '<small class="leise">' + esc(Z1.stand(RUN.k)) + "</small>" : "") + "</div><p class='leise'>Erreichte Ziele bisher: " + META.stats.ziele + "</p>");
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
  $("#werkzeuge").addEventListener("click", e => { if (e.target.closest("[data-ziel]")) { zielFenster(); return; } const b = e.target.closest("[data-wz]"); if (!b || b.disabled || sperre) return; Ton.start(); werkzeugNutzen(b.dataset.wz); });
  document.addEventListener("keydown", e => {
    if ($("#schichten").children.length || titelEl) { if (e.key === "Escape") { const s = $("#schichten").lastElementChild; if (s && s.zu && s.querySelector(".zu")) s.zu(); } return; }
    if (e.key === "Escape" && abwaegen != null) { abwaegenEnde(); return; }
    if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") { if (folgeWeiter) folgeWeiter(); else karteWeg(0); e.preventDefault(); }
    else if ((e.key === "ArrowUp" || e.key === "w" || e.key === "W") && !folgeWeiter && aktuelle && aktuelle.k.opt[2]) { karteWeg(2); e.preventDefault(); }
    else if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") { if (folgeWeiter) folgeWeiter(); else karteWeg(1); e.preventDefault(); }
    else if ((e.key === " " || e.key === "Enter") && folgeWeiter) { folgeWeiter(); e.preventDefault(); }
    else if ((e.key === " " || e.key === "Enter") && abwaegen != null) { karteWeg(abwaegen); e.preventDefault(); }
    else if (e.key === "m" || e.key === "M") menue();
  });
  document.addEventListener("visibilitychange", () => { if (document.hidden) speichern(); });

  /* ---------- Start ---------- */
  document.body.classList.toggle("ruhig", !!META.einst.ruhig);
  zeichneBalken();
  if (RUN && RUN.k) { try { titelbild(); } catch (e) { RUN = null; titelbild(); } } else { RUN = null; titelbild(); }
  /* Testlauf ohne Oberfläche (für Balance-Prüfungen): TNE.sim(Runden, "gierig"|"zufall") */
  let protokoll = null;
  function sim(n, art, mitProtokoll) {
    const ergebnisse = [], metaAlt = JSON.stringify(META);
    protokoll = mitProtokoll ? { gezogen: {}, phase: {}, fehler: {} } : null;
    for (let i = 0; i < n; i++) {
      neuerRunStill();
      let sicher = 0;
      while (RUN && sicher++ < 3000) {
        if (imBoss() && !RUN.k.boss) RUN.k.boss = { hp: 100 };
        const x = ziehe(); const f = fuelle(x.ctx);
        aktuelle = { k: x.k, ctx: x.ctx, f, text: "" };
        if (!x.k.sonder) { RUN.k.benutzt[x.k.id] = 1; if (x.k.einmal || x.k.selten) RUN.einmal[x.k.id] = 1; }
        if (protokoll) {
          protokoll.gezogen[x.k.id] = (protokoll.gezogen[x.k.id] || 0) + 1;
          const ph = phaseJetzt(); protokoll.phase[ph] = (protokoll.phase[ph] || 0) + 1;
          for (const t of [x.k.text, ...x.k.opt.flatMap(o => [o.label, o.folge])]) {
            const e = ersetze(t, f);
            if (/\{\w+\}|undefined|null|NaN|\s,|^\s|\(\)|  /.test(e) || /(^|\s)(s|'s)\b/.test(e) && !/['’]s\b/.test(t)) (protokoll.fehler[x.k.id] = protokoll.fehler[x.k.id] || new Set()).add(e.slice(0, 140));
          }
        }
        let seite = Math.floor(zz() * x.k.opt.length);
        if (art === "gierig") { const sc = o => { const v = vorschauFuer(o); let s = 0; for (const b of "mlst") { let d = v[b]; if (d === "?") d = 0; const xx = RUN.b[b] + (d || 0) * STAERKE + DRIFT[b] * STAERKE * 2; s += Math.pow(xx - 52, 2); } return s; }; let best = Infinity; x.k.opt.forEach((o, i) => { const v = sc(o); if (v < best) { best = v; seite = i; } }); }
        const launeVorSim = RUN.spieler.map(s => s.laune);
        const ergSim = anwenden(seite);
        nachhall(x.k, seite, launeVorSim, ergSim.ereignisse, ersetze(x.k.opt[seite].label, f));
        const tot = balkenTot();
        if (tot) { ergebnisse.push({ ende: tot, karten: RUN.karten, kamp: RUN.kampagnenGeschafft || 0 }); RUN = null; break; }
        if (sessionVorbei()) { sessionAbschluss(); if (RUN.k.session >= RUN.k.sessions) kampagneAbschluss(); else neueSession(); }
      }
      if (RUN) { ergebnisse.push({ ende: "max", karten: RUN.karten, kamp: RUN.kampagnenGeschafft || 0 }); RUN = null; }
    }
    const alt = JSON.parse(metaAlt).stats;
    ergebnisse.stats = {}; for (const k of ["bosse", "ziele", "krisen", "bez", "selten", "kampagnen", "tode", "spieler", "wuerfe", "nat20", "nat1"]) ergebnisse.stats[k] = META.stats[k] - (alt[k] || 0);
    META = JSON.parse(metaAlt);
    if (protokoll) { for (const k in protokoll.fehler) protokoll.fehler[k] = [...protokoll.fehler[k]]; ergebnisse.protokoll = protokoll; protokoll = null; }
    return ergebnisse;
  }
  function neuerRunStill() {
    Z.s = (Math.random() * 4294967296) >>> 0;
    RUN = { v: 1, b: { m: zi(40, 60), l: zi(40, 60), s: zi(40, 60), t: zi(40, 60) }, spieler: [], karten: 0, hr: [], queue: [], einmal: {}, xp: 0, verlauf: [] };
    for (const t of mischen(Object.keys(TYPEN)).slice(0, 4)) RUN.spieler.push(neuerSpieler(t));
    startBeziehungen();
    neueKampagne();
  }
  /* Test-Hilfe: bestimmte Karte als nächste zeigen */
  function testKarte(id, opt) {
    if (!RUN || !KARTE[id]) return; opt = opt || {};
    const k = KARTE[id];
    const ctx = sprecherFinden(k) || { sp: aktiveSpieler()[0] };
    if (opt.sp != null) ctx.sp = RUN.spieler[opt.sp];
    if (opt.sp2 != null) { ctx.sp2 = RUN.spieler[opt.sp2]; const z = bezZwischen(ctx.sp, ctx.sp2); if (z) ctx.bez = z; }
    if (!TYPEN[k.wer] && !["spieler", "pausiert"].includes(k.wer) && !k.bez) ctx.sym = k.wer;
    if (k.wer === "pausiert") ctx.chat = true;
    const f = fuelle(ctx);
    aktuelle = { k, ctx, f, text: ersetze(k.text, f) };
    if (k.selten) { Viz.zeige("funkeln"); }
    zeigeKarte();
  }
  window.TNE = { sim, testKarte, zeichneTischbild, katzeLauf, staerke: v => { STAERKE = v; }, KARTEN, ZIEHBAR, META: () => META, RUN: () => RUN, akt: () => aktuelle, vorschau: vorschauFuer, Viz, stichwort, parseWirkung };
})();
