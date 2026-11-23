/* Friedrichs Waldbuch – Einstieg für Leute ohne Vorkenntnisse:
   Erste Schritte, bebildertes Wörterbuch, antippbare Fachwörter in allen Texten, Einsteiger-Stapel. */
(function () {
  "use strict";
  const W = window.WB; if (!W) return;
  const { ART, ARTEN, esc } = W;
  const $ = s => document.querySelector(s);

  /* ---------- Die ersten Arten ---------- */
  // Häufig, leicht zu erkennen, kaum zu verwechseln – und ein paar, die man als Warnung kennen muss.
  const ERSTE = ["rotbuche", "stieleiche", "fichte", "haengebirke", "hasel", "brennnessel", "loewenzahn", "gaensebluemchen", "brombeere", "fliegenpilz", "eichhoernchen", "buntspecht"];
  const EINSTEIGER = ERSTE.concat(["bergahorn", "spitzahorn", "esche", "winterlinde", "rosskastanie", "waldkiefer", "laerche", "holunder", "himbeere", "heidelbeere", "walderdbeere", "spitzwegerich", "klatschmohn", "rotklee", "schafgarbe", "buschwindroeschen", "huflattich", "taubnessel", "fingerhut", "zunderschwamm", "birkenporling", "reh", "fuchs", "igel", "feldhase", "wildschwein"]).filter(id => ART[id]);
  const kenntStufe = id => (W.STAND.kiste || {})[id] || 0;

  /* ---------- Zeichnungen (Strichskizzen, Erdfarben) ---------- */
  const BL = 'fill="#bcd08f" stroke="#4f6b2c" stroke-width="1.6"';
  const ST = 'stroke="#5c4229" stroke-width="2.6" stroke-linecap="round" fill="none"';
  const n1 = v => Math.round(v * 10) / 10;
  const ell = (cx, cy, rx, ry, rot, a) => '<ellipse cx="' + cx + '" cy="' + cy + '" rx="' + rx + '" ry="' + ry + '" transform="rotate(' + rot + " " + cx + " " + cy + ')" ' + (a || BL) + "/>";
  function randBlatt(art) {
    const N = art === "gelappt" ? 240 : art === "gesaegt" ? 64 : 120, p = [];
    for (let k = 0; k < N; k++) {
      const t = k / N * Math.PI * 2;
      let f = 1;
      if (art === "gesaegt") f = k % 2 ? 0.86 : 1.02;
      if (art === "gekerbt") f = 0.9 + 0.1 * Math.abs(Math.sin(t * 10));
      if (art === "gelappt") f = 0.62 + 0.38 * Math.pow(Math.abs(Math.sin(t * 4.5)), 0.7);
      const x = 60 + 27 * Math.sin(t) * (1 - 0.22 * Math.cos(t)) * f, y = 48 - 41 * Math.cos(t) * (art === "gelappt" ? (0.9 + 0.1 * f) : 1);
      p.push(n1(x) + "," + n1(y));
    }
    return '<polygon points="' + p.join(" ") + '" ' + BL + '/><path d="M60 8 V96" stroke="#4f6b2c" stroke-width="1.2" fill="none"/><path d="M60 89 V102" ' + ST + "/>";
  }
  const Z = {
    gegen: '<path d="M60 102 V4" ' + ST + "/>" + [22, 50, 78].map(y => ell(45, y, 15, 6, -22) + ell(75, y, 15, 6, 22)).join(""),
    wechsel: '<path d="M60 102 V4" ' + ST + "/>" + [16, 36, 56, 76].map((y, i) => i % 2 ? ell(75, y, 15, 6, 22) : ell(45, y, 15, 6, -22)).join(""),
    quirl: [0, 60, 120, 180, 240, 300].map(a => '<g transform="rotate(' + a + ' 60 52)">' + ell(81, 52, 18, 6, 0) + "</g>").join("") + '<circle cx="60" cy="52" r="5" fill="#5c4229"/><text x="60" y="101" text-anchor="middle" font-size="9" fill="#5c4229">von oben</text>',
    rosette: [0, 40, 80, 120, 160, 200, 240, 280, 320].map(a => '<g transform="rotate(' + a + ' 60 50)">' + ell(86, 50, 25, 7, 0) + "</g>").join("") + '<circle cx="60" cy="50" r="5" fill="#5c4229"/><text x="60" y="102" text-anchor="middle" font-size="9" fill="#5c4229">von oben</text>',
    fieder: '<path d="M3 54 H104" ' + ST + "/>" + [22, 42, 62, 82].map(x => ell(x, 41, 5.5, 11, -12) + ell(x, 67, 5.5, 11, 12)).join("") + ell(108, 54, 10, 5.5, 0),
    finger: '<path d="M60 102 V60" ' + ST + "/>" + [-66, -33, 0, 33, 66].map(a => '<g transform="rotate(' + a + ' 60 60)">' + ell(60, 34, 8, 23, 0) + "</g>").join(""),
    ganzrandig: randBlatt("glatt"), gesaegt: randBlatt("gesaegt"), gekerbt: randBlatt("gekerbt"), gelappt: randBlatt("gelappt"),
    dolde: '<path d="M60 104 V64" ' + ST + "/>" + [0, 1, 2, 3, 4, 5, 6].map(k => { const a = (-160 + k * 23.3) * Math.PI / 180, x = n1(60 + Math.cos(a) * 46), y = n1(64 + Math.sin(a) * 46); return '<path d="M60 64 L' + x + " " + y + '" stroke="#4f6b2c" stroke-width="1.3"/>' + [[-4, -2], [3, -3], [0, 3], [5, 2], [-4, 4]].map(([dx, dy]) => '<circle cx="' + (x + dx) + '" cy="' + (y + dy) + '" r="2.6" fill="#fffdf6" stroke="#7b6a55" stroke-width=".8"/>').join(""); }).join(""),
    kaetzchen: '<path d="M6 18 Q60 6 114 20" ' + ST + "/>" + [28, 60, 92].map(x => { const y = x === 60 ? 12 : 16; return '<ellipse cx="' + x + '" cy="' + (y + 26) + '" rx="5.5" ry="24" fill="#d9c27a" stroke="#8a6a2a" stroke-width="1.2"/>' + [0, 1, 2, 3, 4, 5, 6].map(i => '<path d="M' + (x - 5) + " " + (y + 10 + i * 5) + " L" + (x + 5) + " " + (y + 12 + i * 5) + '" stroke="#8a6a2a" stroke-width=".7"/>').join(""); }).join(""),
    korb: Array.from({ length: 18 }, (_, k) => '<g transform="rotate(' + k * 20 + ' 60 50)">' + ell(84, 50, 13, 4, 0, 'fill="#fffdf6" stroke="#9b8a70" stroke-width="1"') + "</g>").join("") + '<circle cx="60" cy="50" r="13" fill="#e2b33c" stroke="#a5781c"/>' + Array.from({ length: 19 }, (_, k) => { const r = k ? 4 + (k % 3) * 3 : 0, a = k * 2.4; return '<circle cx="' + n1(60 + Math.cos(a) * r) + '" cy="' + n1(50 + Math.sin(a) * r) + '" r="1.4" fill="#a5781c"/>'; }).join(""),
    lamellen: '<circle cx="60" cy="52" r="47" fill="#efe2c8" stroke="#8a6a3a" stroke-width="1.6"/>' + Array.from({ length: 64 }, (_, k) => { const a = k / 64 * Math.PI * 2, r0 = k % 2 ? 26 : 11; return '<path d="M' + n1(60 + Math.cos(a) * r0) + " " + n1(52 + Math.sin(a) * r0) + " L" + n1(60 + Math.cos(a) * 46) + " " + n1(52 + Math.sin(a) * 46) + '" stroke="#a88a5c" stroke-width=".9"/>'; }).join("") + '<circle cx="60" cy="52" r="10" fill="#f6efe0" stroke="#8a6a3a"/><text x="60" y="55" text-anchor="middle" font-size="7" fill="#5c4229">Stiel</text>',
    roehren: '<circle cx="60" cy="52" r="47" fill="#dcc66e" stroke="#8a6a3a" stroke-width="1.6"/>' + (() => { let o = ""; for (let y = 8; y <= 96; y += 5.2) for (let x = 14; x <= 106; x += 5.6) { const xx = x + ((Math.round((y - 8) / 5.2)) % 2 ? 2.8 : 0), d = Math.hypot(xx - 60, y - 52); if (d < 44 && d > 12) o += '<circle cx="' + n1(xx) + '" cy="' + n1(y) + '" r="1.7" fill="#9c7f2c"/>'; } return o; })() + '<circle cx="60" cy="52" r="10" fill="#f6efe0" stroke="#8a6a3a"/><text x="60" y="55" text-anchor="middle" font-size="7" fill="#5c4229">Stiel</text>',
    leisten: '<path d="M14 26 Q60 8 106 26 Q96 34 70 70 L70 100 L50 100 L50 70 Q24 34 14 26 Z" fill="#eab04a" stroke="#a8741a" stroke-width="1.4"/>' + [[22, 31], [34, 33], [47, 34], [60, 34], [73, 34], [86, 33], [98, 31]].map(([x, y]) => { const zx = 52 + (x - 14) / 92 * 16; return '<path d="M' + x + " " + y + " Q" + n1((x + zx) / 2) + " " + (y + 18) + " " + n1(zx) + ' 76" stroke="#b07316" stroke-width="1.3" fill="none"/><path d="M' + (x + (x < 60 ? 4 : -4)) + " " + (y + 1) + " L" + n1((x + zx) / 2 + (x < 60 ? 1 : -1)) + " " + (y + 12) + '" stroke="#b07316" stroke-width="1"/>'; }).join(""),
    volva: '<path d="M6 80 H114" stroke="#7b6a55" stroke-width="1.2" stroke-dasharray="4 3"/><text x="112" y="76" text-anchor="end" font-size="8" fill="#7b6a55">Erdboden</text>' +
      '<rect x="54" y="30" width="12" height="58" fill="#f6f1e2" stroke="#8a7a5a"/><path d="M20 32 Q60 -2 100 32 Z" fill="#c9d39a" stroke="#6f7a3a" stroke-width="1.4"/><path d="M22 33 H98" stroke="#efe9d6" stroke-width="3"/>' +
      '<path d="M50 44 Q60 49 70 44 L73 53 Q60 59 47 53 Z" fill="#fbf8ee" stroke="#8a7a5a"/><ellipse cx="60" cy="90" rx="13" ry="9" fill="#f6f1e2" stroke="#8a7a5a"/>' +
      '<path d="M44 84 Q42 101 60 102 Q78 101 76 84 L71 91 L65 84 L60 90 L55 84 L49 91 Z" fill="#fffaf0" stroke="#8a6a3a" stroke-width="1.3"/>' +
      '<text x="78" y="51" font-size="8.5" fill="#5c4229">Ring</text><text x="4" y="99" font-size="8.5" fill="#5c4229">Scheide</text><text x="4" y="62" font-size="8.5" fill="#5c4229">Stiel</text>',
    schalen: '<path d="M55 10 Q38 40 44 80 Q50 90 57 82 Q61 46 58 10 Z" fill="#8a765c" stroke="#4a3a26" stroke-width="1.3"/><path d="M65 10 Q82 40 76 80 Q70 90 63 82 Q59 46 62 10 Z" fill="#8a765c" stroke="#4a3a26" stroke-width="1.3"/>' +
      '<ellipse cx="38" cy="95" rx="4.5" ry="3.5" fill="#6a5840"/><ellipse cx="82" cy="95" rx="4.5" ry="3.5" fill="#6a5840"/><text x="60" y="104" text-anchor="middle" font-size="7.5" fill="#5c4229">Afterklauen</text>'
  };
  const zeichnung = (k, titel) => Z[k] ? '<svg viewBox="0 0 120 104" role="img" aria-label="Skizze: ' + esc(titel) + '">' + Z[k] + "</svg>" : "";

  /* ---------- Wörterbuch ---------- */
  // [Wort, Gruppe, Erklärung, Beispiele, Zeichnung, Suchmuster, nur in Kapitel]
  const G_BL = "Blätter", G_BF = "Blüten & Früchte", G_WU = "Wuchs & Rinde", G_PI = "Pilze", G_TI = "Tiere & Spuren", G_RE = "Schutz & Regeln";
  const WOERTER = [
    ["gegenständig", G_BL, "Zwei Blätter sitzen sich am Stängel genau gegenüber – auf derselben Höhe, wie zwei ausgestreckte Arme.", ["bergahorn", "esche", "holunder", "brennnessel"], "gegen", "gegenständig\\p{L}*"],
    ["wechselständig", G_BL, "Die Blätter sitzen einzeln, abwechselnd mal links, mal rechts – wie Treppenstufen.", ["rotbuche", "haengebirke", "hasel"], "wechsel", "wechselständig\\p{L}*"],
    ["quirlständig (Quirl)", G_BL, "Drei oder mehr Blätter wachsen auf derselben Höhe rund um den Stängel – wie die Speichen eines Rads.", ["waldmeister", "einbeere"], "quirl", "quirl\\p{L}*"],
    ["Rosette", G_BL, "Die Blätter liegen in einem flachen Kreis direkt über dem Boden und kommen alle aus einem Punkt.", ["loewenzahn", "gaensebluemchen", "spitzwegerich"], "rosette", "\\p{L}*rosette\\p{L}*"],
    ["ganzrandig", G_BL, "Der Blattrand ist glatt – ohne Zähne, ohne Einschnitte.", ["liguster", "faulbaum", "maigloeckchen"], "ganzrandig", "ganzrandig\\p{L}*"],
    ["gesägt", G_BL, "Der Rand hat viele kleine, spitze Zähne, die zur Blattspitze zeigen – wie eine Säge. Doppelt gesägt: Auf den großen Zähnen sitzen noch kleine.", ["hainbuche", "haengebirke", "brennnessel"], "gesaegt", "(?:doppelt |fein |grob )?gesägt\\p{L}*"],
    ["gekerbt", G_BL, "Der Rand hat rundliche Buckel statt spitzer Zähne.", ["gundermann"], "gekerbt", "gekerbt\\p{L}*"],
    ["gelappt", G_BL, "Das Blatt hat tiefe, gerundete Einbuchtungen; die Teile dazwischen heißen Lappen. Handförmig gelappt: Die Lappen gehen wie Finger von einem Punkt aus (Ahorn).", ["stieleiche", "spitzahorn", "bergahorn"], "gelappt", "(?:handförmig )?gelappt\\p{L}*|\\p{L}*lappig"],
    ["gefiedert", G_BL, "Ein einziges Blatt besteht aus vielen Blättchen, die links und rechts an einem gemeinsamen Stiel sitzen – wie bei einer Feder. Unpaarig gefiedert: Ganz vorn sitzt ein einzelnes Endblättchen. Mehrfach gefiedert: Die Blättchen sind selbst noch einmal gefiedert, das Blatt wirkt fein wie Petersilie oder Farn.", ["esche", "eberesche", "holunder", "wildemoehre"], "fieder", "(?:unpaarig |mehrfach |fein )?gefiedert\\p{L}*"],
    ["gefingert", G_BL, "Fünf bis sieben einzelne Blättchen strahlen wie die Finger einer Hand von der Spitze des Blattstiels aus.", ["rosskastanie"], "finger", "gefingert\\p{L}*"],
    ["lanzettlich", G_BL, "Lang und schmal, an beiden Enden spitz – geformt wie eine Lanzenspitze.", ["silberweide", "spitzwegerich", "baerlauch"], null, "lanzettlich\\p{L}*"],
    ["herablaufend", G_BL, "Der Blattgrund wächst als schmaler Saum (Flügel) ein Stück am Stängel hinunter.", ["beinwell"], null, "herablaufend\\p{L}*"],
    ["Nerven (Blattadern)", G_BL, "Die feinen Leitungsbahnen im Blatt. Bogennerven laufen im Bogen Richtung Blattspitze – typisch für Hartriegel.", ["kornelkirsche", "hartriegel"], null, "\\p{L}*nerven"],
    ["Kurztrieb", G_BL, "Ein winziger, stummeliger Seitenzweig. An ihm sitzen Nadeln oder Blätter als Büschel – typisch für die Lärche.", ["laerche"], null, "kurztrieb\\p{L}*"],
    ["immergrün / sommergrün", G_BL, "Immergrün: Die Pflanze behält ihre Blätter auch im Winter. Sommergrün: Sie wirft sie im Herbst ab – sogar ein Nadelbaum, die Lärche. Wintergrün: Die Blätter halten über den Winter und fallen erst, wenn im Frühjahr neue kommen.", ["stechpalme", "efeu", "laerche"], null, "immergrün\\p{L}*|sommergrün\\p{L}*|wintergrün\\p{L}*"],

    ["Dolde", G_BF, "Viele Blütenstiele entspringen alle an einem einzigen Punkt und spannen einen Schirm auf. Bei der Doppeldolde trägt jeder Stiel noch einmal ein kleines Döldchen.", ["wildemoehre", "giersch", "baerlauch"], "dolde", "\\p{L}*dolden?(?!\\p{L})|döldchen"],
    ["Doldenrispe / Schirmrispe / Trugdolde", G_BF, "Sieht aus wie eine Dolde, ist aber verzweigt: Die Blütenstiele entspringen an verschiedenen Stellen und enden trotzdem fast auf einer Höhe.", ["holunder", "eberesche", "schafgarbe", "hartriegel"], null, "doldenrispe\\p{L}*|schirmrispe\\p{L}*|trugdolde\\p{L}*"],
    ["Doldenblütler", G_BF, "Eine Pflanzenfamilie mit Dolden: Möhre, Kerbel, Giersch – aber auch der tödliche Schierling. Viele sehen sich so ähnlich, dass Anfänger sie gar nicht sammeln sollten.", ["schierling", "wiesenkerbel", "giersch"], "dolde", "doldenblütler\\p{L}*"],
    ["Hüllblätter", G_BF, "Kleine Blättchen direkt unter einer Dolde oder einem Döldchen – bei Doldenblütlern ein wichtiges Merkmal, etwa der „Bart“ der Hundspetersilie.", ["hundspetersilie", "wildemoehre"], null, "hüllblätt\\p{L}*"],
    ["Rispe", G_BF, "Ein verzweigter Blütenstand: An einer Achse sitzen Seitenzweige, die wieder Blüten tragen – oft kegelförmig.", ["liguster", "maedesuess"], null, "rispen?(?!\\p{L})"],
    ["Traube", G_BF, "Einzelne Blüten an kurzen Stielen entlang einer Achse – wie bei Weintrauben.", ["traubenkirsche", "robinie", "maigloeckchen"], null, "trauben?(?!\\p{L})"],
    ["Ähre", G_BF, "Wie eine Traube, nur sitzen die Blüten ohne Stiel direkt an der Achse.", ["spitzwegerich", "edelkastanie"], null, "ähren?(?!\\p{L})"],
    ["Kätzchen", G_BF, "Längliche, oft hängende Blütenstände aus vielen winzigen Blüten, deren Pollen der Wind verweht.", ["hasel", "haengebirke", "salweide"], "kaetzchen", "kätzchen"],
    ["Korbblüte (Körbchen)", G_BF, "Was wie eine einzige Blüte aussieht, sind Dutzende winzige Einzelblüten, dicht in einem „Korb“ zusammengepackt.", ["loewenzahn", "gaensebluemchen", "kamille"], "korb", "korbblüt\\p{L}*|körbchen"],
    ["Kelch", G_BF, "Der grüne Blättchenkranz unter den Blütenblättern. Bei manchen Beeren bleibt er als Krönchen oder Stern an der Frucht.", ["tollkirsche", "heidelbeere"], null, "kelch\\p{L}*"],
    ["Steinfrucht", G_BF, "Eine Frucht mit weichem Fleisch und einem harten Kern (Stein), in dem der Samen steckt – wie bei der Kirsche.", ["vogelkirsche", "schlehe", "kornelkirsche"], null, "steinfr\\p{L}*"],
    ["Kapsel", G_BF, "Eine trockene Frucht, die aufspringt und ihre Samen freigibt.", ["rosskastanie", "klatschmohn"], null, "\\p{L}*kapseln?(?!\\p{L})"],
    ["Achäne", G_BF, "Ein kleines, trockenes Früchtchen mit nur einem Samen, das nicht aufspringt. Beim Löwenzahn hängt es am Schirmchen.", ["loewenzahn"], null, "achäne\\p{L}*"],

    ["Staude", G_WU, "Eine krautige Pflanze, deren oberirdische Teile im Winter absterben – im Frühjahr treibt sie aus Wurzel, Knolle oder Zwiebel neu aus.", ["brennnessel", "beinwell"], null, "\\p{L}*staude\\p{L}*"],
    ["Zwergstrauch", G_WU, "Ein Strauch mit holzigen Zweigen, der nur etwa knöchel- bis kniehoch wird.", ["heidelbeere", "preiselbeere", "thymian"], null, "zwergstr\\p{L}*"],
    ["Ausläufer", G_WU, "Seitliche Triebe, die über oder unter der Erde wachsen und neue Pflänzchen bilden – so entstehen große Teppiche.", ["walderdbeere", "giersch", "maigloeckchen"], null, "ausläufer\\p{L}*"],
    ["Milchsaft", G_WU, "Weißer – bei manchen Pilzen auch farbiger – Saft, der austritt, wenn man Stängel, Blatt oder Pilz verletzt.", ["loewenzahn", "fichtenreizker"], null, "milchsaft\\p{L}*"],
    ["bereift", G_WU, "Mit einem feinen, abwischbaren Wachsbelag überzogen – wie bei einer Pflaume.", ["schierling", "heidelbeere", "schlehe"], null, "bereift\\p{L}*"],
    ["Korkwarzen", G_WU, "Kleine, helle Wülste oder Striche auf der Rinde junger Zweige und Stämme. Durch sie bekommt das Holz Luft.", ["faulbaum", "vogelkirsche", "holunder"], null, "korkwarze\\p{L}*"],

    ["Lamellen", G_PI, "Dünne, senkrecht stehende Blättchen unter dem Hut, wie die Seiten eines Buchs. Die gefährlichsten Giftpilze – Knollenblätterpilze und Gifthäubling – haben Lamellen.", ["wiesenchampignon", "gruenerknollenblaetterpilz", "fliegenpilz"], "lamellen", "lamelle\\p{L}*"],
    ["Röhren & Poren", G_PI, "Statt Lamellen sitzt unter dem Hut eine Schwammschicht aus dicht gepackten Röhrchen. Von unten sieht man deren Öffnungen als feine Löcher, die Poren. Pilze mit Röhren heißen Röhrlinge.", ["steinpilz", "marone", "satanspilz"], "roehren", "röhren(?!\\p{L})|poren(?!\\p{L})|röhrlinge?n?(?!\\p{L})", "pilz"],
    ["Leisten", G_PI, "Niedrige, dicke, oft gegabelte Falten unter dem Hut, die weit am Stiel herablaufen – keine dünnen Lamellen. Typisch für den Pfifferling.", ["pfifferling", "falscherpfifferling"], "leisten", "leisten(?!\\p{L})", "pilz"],
    ["Stacheln (beim Pilz)", G_PI, "Bei Stoppelpilzen hängen unter dem Hut kleine, brüchige Zäpfchen statt Lamellen.", ["semmelstoppel"], null, "stacheln(?!\\p{L})", "pilz"],
    ["Ring (Manschette)", G_PI, "Ein häutiger Kragen am Stiel – der Rest einer Haut, die beim jungen Pilz die Lamellen schützte. Ob er oben fein gerillt (gerieft) ist, kann entscheidend sein.", ["parasol", "perlpilz", "gruenerknollenblaetterpilz"], "volva", "ring(?!\\p{L})|manschette\\p{L}*", "pilz"],
    ["Knolle & Scheide (Volva)", G_PI, "Eine verdickte Stielbasis, oft in einer häutigen Hülle wie ein Eierbecher – und die steckt im Boden! Deshalb Pilze zum Bestimmen immer vorsichtig mit der ganzen Stielbasis herausdrehen. Eine Scheide ist das Warnzeichen der tödlichen Knollenblätterpilze.", ["gruenerknollenblaetterpilz", "weisserknollenblaetterpilz", "pantherpilz"], "volva", "knollen?(?!\\p{L})|knollig\\p{L}*|scheide(?!\\p{L})|volva", "pilz"],
    ["gerieft", G_PI, "Mit feinen, parallelen Rillen – wie mit einem Kamm gezogen.", ["perlpilz", "pantherpilz"], null, "gerieft\\p{L}*", "pilz"],
    ["Sporenpulver", G_PI, "Die Farbe der winzigen Sporen in großer Menge. Man legt den Hut über Nacht mit der Unterseite auf Papier – der Abdruck zeigt die Farbe. Ein wichtiges Bestimmungsmerkmal.", ["wiesenchampignon", "gruenerknollenblaetterpilz"], null, "sporenpulver|sporen(?!\\p{L})", "pilz"],
    ["Fruchtkörper & Myzel", G_PI, "Was wir „Pilz“ nennen, ist nur der Fruchtkörper. Der eigentliche Pilz ist ein feines Fadengeflecht im Boden oder Holz – das Myzel.", ["hallimasch", "steinpilz"], null, "fruchtkörper\\p{L}*|myzel\\p{L}*"],
    ["blauen", G_PI, "Fleisch oder Poren verfärben sich beim Anschneiden oder Drücken bläulich – eine Reaktion mit der Luft. Das ist weder ein Giftzeichen noch ein Zeichen für „essbar“.", ["hexenroehrling", "marone", "satanspilz"], null, "blau(?:t|en|end|ende|endes|ender)(?!\\p{L})", "pilz"],

    ["Losung", G_TI, "Jägersprache für den Kot von Wildtieren – oft das Erste, was man von ihnen findet.", ["reh", "fuchs", "fischotter"], null, "losung\\p{L}*", "tier"],
    ["Trittsiegel & Fährte", G_TI, "Trittsiegel: ein einzelner Fußabdruck. Fährte: eine ganze Reihe davon bei Huftieren; bei Raubtieren sagt man Spur.", ["reh", "rothirsch", "wildschwein"], null, "trittsiegel\\p{L}*|fährte\\p{L}*", "tier"],
    ["Schalen & Afterklauen", G_TI, "Schalen: die Hufe von Reh, Hirsch, Gämse und Wildschwein – zwei große Zehen. Afterklauen: zwei kleine Zehen weiter hinten. Beim Wildschwein drücken sie sich fast immer mit ab, beim Reh meist nur auf der Flucht oder in weichem Boden.", ["wildschwein", "reh", "gaemse"], "schalen", "schalen(?!\\p{L})|afterklaue\\p{L}*", "tier"],
    ["Paarhufer", G_TI, "Säugetiere, die auf zwei Zehen (Schalen) laufen: Reh, Hirsch, Gämse, Wildschwein.", ["reh", "gaemse"], "schalen", "paarhufer", "tier"],
    ["Gewölle", G_TI, "Ausgewürgte Ballen aus Haaren, Federn und Knochen, die Eulen und Greifvögel nicht verdauen können.", ["waldkauz"], null, "gewölle\\p{L}*", "tier"],
    ["Brunft & Ranz", G_TI, "Brunft: die Paarungszeit von Hirsch, Reh und Gämse. Ranz oder Ranzzeit: die Paarungszeit von Fuchs, Luchs, Wolf und Marder.", ["rothirsch", "fuchs"], null, "brunft\\p{L}*|ranz\\p{L}*", "tier"],
    ["Fegestelle", G_TI, "Rehböcke und Hirsche reiben die Basthaut ihres frisch gewachsenen Geweihs an jungen Bäumchen ab – die Rinde ist dann abgeschabt.", ["reh", "rothirsch"], null, "fegestelle\\p{L}*", "tier"],
    ["Suhle", G_TI, "Eine schlammige Pfütze, in der sich Wildschweine und Hirsche wälzen – gegen Parasiten und zum Abkühlen.", ["wildschwein", "rothirsch"], null, "suhle\\p{L}*", "tier"],
    ["Kobel", G_TI, "Das kugelige Nest des Eichhörnchens aus Zweigen, Moos und Blättern, hoch in einer Astgabel.", ["eichhoernchen"], null, "kobel", "tier"],
    ["Winterschlaf & Winterruhe", G_TI, "Winterschlaf: Körpertemperatur und Herzschlag sinken stark, das Tier schläft monatelang (Igel, Murmeltier). Winterruhe: Das Tier schläft viel, wacht aber immer wieder auf und frisst (Dachs).", ["igel", "murmeltier", "dachs"], null, "winterschlaf|winterruhe", "tier"],
    ["Latrine", G_TI, "Ein fester „Toilettenplatz“. Der Dachs gräbt dafür kleine Gruben.", ["dachs"], null, "latrine\\p{L}*", "tier"],
    ["Rotte, Bache, Keiler, Frischling", G_TI, "Wildschwein-Wörter: Rotte = Gruppe, Bache = Weibchen, Keiler = Männchen, Frischlinge = die gestreiften Jungen.", ["wildschwein"], null, "rotten?(?!\\p{L})|bachen?(?!\\p{L})|keiler|frischling\\p{L}*", "tier"],
    ["Lunte & Spiegel", G_TI, "Lunte: der buschige Schwanz des Fuchses. Spiegel: der helle Fleck am Hinterteil von Reh und Hirsch.", ["fuchs", "reh"], null, "lunte|spiegel", "tier"],

    ["geschützt", G_RE, "Besonders oder streng geschützte Arten dürfen nicht gepflückt, ausgegraben oder gestört werden (Bundesnaturschutzgesetz, Bundesartenschutzverordnung). Bei einigen Speisepilzen ist das Sammeln kleiner Mengen für den eigenen Bedarf erlaubt.", ["frauenschuh", "edelweiss", "steinpilz"], null, "(?:streng |besonders )?geschützt\\p{L}*"],
    ["Rote Liste & Vorwarnliste", G_RE, "Rote Liste: Verzeichnis gefährdeter Arten (für Bayern vom Landesamt für Umwelt). Vorwarnliste: noch nicht gefährdet, aber deutlich zurückgehend. Ein Eintrag allein bedeutet noch keinen gesetzlichen Schutz – stehen lassen sollte man solche Arten trotzdem.", ["eibe", "satanspilz"], null, "roten? liste|vorwarnliste"],
    ["invasiv (eingeschleppt)", G_RE, "Eine Art aus einem anderen Erdteil, die sich hier stark ausbreitet und heimische Arten verdrängt.", ["riesenbaerenklau", "waschbaer", "robinie"], null, "invasiv\\p{L}*|eingeschleppt\\p{L}*"]
  ].map(([wort, gruppe, text, bsp, bild, muster, nur], i) => ({ i, wort, gruppe, text, bsp: bsp.filter(id => ART[id]), bild, nur, re: new RegExp("(?<!\\p{L})(?:" + muster + ")(?!\\p{L})", "iu") }));
  const GRUPPEN = [G_BL, G_BF, G_WU, G_PI, G_TI, G_RE];
  const slug = w => w.toLowerCase().replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  /* ---------- Fachwörter in Texten antippbar machen ---------- */
  const ZIELE = ".karte-lern .frage, dl.merk dd, .art > div > p, .warnung, .unterschied li, .eselsbruecke, .karte-lern .erklaerung, .wort-text";
  function markieren(wurzel, kap) {
    const schon = new Set();
    wurzel.querySelectorAll(ZIELE).forEach(el => {
      if (el.closest(".wort-pop") || el.dataset.woerter) return;
      el.dataset.woerter = "1";
      const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, { acceptNode: n => n.parentElement.closest("a, button, .wort, b.hand") ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT });
      const knoten = []; while (walker.nextNode()) knoten.push(walker.currentNode);
      knoten.forEach(tn => {
        let text = tn.nodeValue, teile = [], rest = text;
        // wiederholt das früheste Fachwort im Rest suchen
        for (let schutz = 0; schutz < 12; schutz++) {
          let best = null;
          for (const w of WOERTER) {
            if (schon.has(w.i) || (w.nur && w.nur !== kap)) continue;
            const m = w.re.exec(rest); if (m && (!best || m.index < best.m.index || (m.index === best.m.index && m[0].length > best.m[0].length))) best = { w, m };
          }
          if (!best) break;
          schon.add(best.w.i);
          teile.push(document.createTextNode(rest.slice(0, best.m.index)));
          const b = document.createElement("button"); b.type = "button"; b.className = "wort"; b.dataset.w = best.w.i; b.textContent = best.m[0]; b.setAttribute("aria-label", best.m[0] + " – Erklärung");
          teile.push(b);
          rest = rest.slice(best.m.index + best.m[0].length);
        }
        if (!teile.length) return;
        teile.push(document.createTextNode(rest));
        const f = document.createDocumentFragment(); teile.forEach(t => f.appendChild(t));
        tn.parentNode.replaceChild(f, tn);
      });
    });
  }
  function seitenKap() {
    const m = /^#\/art\/([^/]+)/.exec(location.hash); if (m && ART[decodeURIComponent(m[1])]) return ART[decodeURIComponent(m[1])].kap;
    const k = /^#\/kapitel\/([^/]+)/.exec(location.hash); return k ? k[1] : null;
  }
  // Erklärkarte
  let pop = null;
  function popZu() { if (pop) { pop.remove(); pop = null; } }
  function popAuf(knopf) {
    const w = WOERTER[+knopf.dataset.w]; if (!w) return;
    popZu();
    const imRaetsel = !!knopf.closest(".karte-lern"); // im Rätsel keine Beispielarten – sonst wäre die Lösung verraten
    pop = document.createElement("div"); pop.className = "wort-pop"; pop.setAttribute("role", "dialog"); pop.setAttribute("aria-label", w.wort);
    pop.innerHTML = '<button class="wp-zu" aria-label="Schließen">✕</button>' + (w.bild ? '<div class="wp-bild">' + zeichnung(w.bild, w.wort) + "</div>" : "") +
      '<b class="hand">' + esc(w.wort) + "</b><p>" + esc(w.text) + "</p>" +
      (w.bsp.length && !imRaetsel ? '<p class="wp-bsp">Zum Beispiel: ' + w.bsp.slice(0, 3).map(id => '<a href="#/art/' + id + '">' + esc(ART[id].de) + "</a>").join(", ") + "</p>" : "") +
      (imRaetsel ? "" : '<a class="wp-mehr" href="#/woerter/' + slug(w.wort) + '">Alle Wörter im Wörterbuch →</a>');
    document.body.appendChild(pop);
    const r = knopf.getBoundingClientRect(), pw = Math.min(340, window.innerWidth - 20);
    pop.style.width = pw + "px";
    const left = Math.max(10, Math.min(window.innerWidth - pw - 10, r.left + r.width / 2 - pw / 2));
    const ph = pop.offsetHeight, unten = r.bottom + 8 + ph < window.innerHeight || r.top - ph - 8 < 0;
    pop.style.left = left + "px"; pop.style.top = (unten ? r.bottom + 8 : r.top - ph - 8) + window.scrollY + "px";
    pop.querySelector(".wp-zu").focus({ preventScroll: true });
  }
  document.addEventListener("click", e => {
    const k = e.target.closest(".wort");
    if (k) { e.preventDefault(); popAuf(k); return; }
    if (pop && (!e.target.closest(".wort-pop") || e.target.closest(".wp-zu") || e.target.closest("a"))) popZu();
  });
  document.addEventListener("keydown", e => { if (e.key === "Escape") popZu(); });
  window.addEventListener("hashchange", popZu);
  const seiteEl = $("#seite");
  let warte = 0;
  const lauf = () => { cancelAnimationFrame(warte); warte = requestAnimationFrame(() => { try { markieren(seiteEl, seitenKap()); } catch (err) { /* Text bleibt einfach unmarkiert */ } }); };
  if (seiteEl) new MutationObserver(lauf).observe(seiteEl, { childList: true, subtree: true });

  /* ---------- Seite: Erste Schritte ---------- */
  function ersteSchritte() {
    const gekannt = ERSTE.filter(id => kenntStufe(id) >= 2).length;
    W.seite('<div class="anfang">' +
      '<div class="anfang-kopf"><div><p class="leise" style="font-family:var(--fb);letter-spacing:.14em;text-transform:uppercase;margin:0">Für alle, die bei null anfangen</p><h1 class="hand">Erste Schritte in den Wald</h1>' +
      '<p style="font-size:1.1rem">Du musst nichts wissen, um hier anzufangen. Ich habe auch mal bei null angefangen – mit einer Brennnessel, die ich angefasst habe, weil ich sie für Minze hielt. Dieses Buch nimmt dich an die Hand: erst schauen, dann vergleichen, dann wiedererkennen.</p></div>' +
      '<img src="friedrich-frei.webp" alt="" class="anfang-fr"></div>' +

      '<h2 class="hand">So lernst du mit diesem Buch</h2><ol class="weg">' +
      '<li><b>Fang mit zwölf Arten an.</b> Nicht mit allen 192. Die zwölf unten sind häufig, fast überall in Bayern und kaum zu verwechseln. Tipp eine an und schau dir in Ruhe alle Fotos an.</li>' +
      '<li><b>Übe in der Lernkiste – im Stapel „Einsteiger“.</b> Fünf Minuten am Tag reichen. Was du kannst, kommt seltener dran, was du verwechselst, öfter.</li>' +
      '<li><b>Geh raus und such sie.</b> Im <a href="#/ausflug">Ausflug</a> bekommst du eine Suchliste für den Ort, an dem du gerade bist. Wenn du etwas findest, kleb es ins <a href="#/fundbuch">Fundbuch</a> – mit eigenem Foto.</li>' +
      '<li><b>Lies die Fachwörter mit.</b> Fachwörter sind gepunktet unterstrichen – zum Beispiel <button type="button" class="wort" data-w="8">gefiedert</button>. Tipp sie an, dann erkläre ich sie dir. Alle Wörter mit Zeichnungen stehen im <a href="#/woerter">Wörterbuch</a>.</li>' +
      '<li><b>Dann Schritt für Schritt mehr.</b> Wenn die zwölf sitzen, nimm dir ein Kapitel vor – Bäume sind ein guter zweiter Schritt, weil sie das ganze Jahr dastehen.</li></ol>' +

      '<h2 class="hand">Deine ersten zwölf</h2><p>' + gekannt + ' von 12 sitzen schon (zweimal richtig in der Lernkiste).</p><div class="erste">' +
      ERSTE.map(id => { const a = ART[id], k = kenntStufe(id) >= 2; return '<a class="erste-art' + (k ? " kann" : "") + '" href="#/art/' + id + '"><div class="bild">' + W.bildHtml(id) + "</div><b>" + esc(a.de) + "</b><small>" + esc(a.k) + "</small>" + (k ? '<span class="haken" aria-label="kann ich">✓</span>' : "") + "</a>"; }).join("") + "</div>" +
      '<div class="reihe"><a class="knopf" href="#/lernen/einsteiger">🧠 Jetzt üben: Einsteiger-Stapel</a><a class="knopf hell" href="#/woerter">📖 Wörterbuch mit Zeichnungen</a></div>' +

      '<h2 class="hand">So schaust du richtig hin</h2><p>Bestimmen heißt nicht raten, sondern Merkmale sammeln – wie ein Detektiv. Geh immer in dieser Reihenfolge vor:</p><div class="hinschauen">' +
      [["📍", "Wo?", "Wald, Wiese, Ufer, Berg? Nadel- oder Laubwald? Viele Arten wachsen nur an ganz bestimmten Orten."],
       ["📏", "Wie groß?", "Baum, Strauch, kniehohes Kraut oder winzig am Boden?"],
       ["🍃", "Die Blätter", "Form, Rand (glatt oder gezähnt), und wie sie am Stängel sitzen – gegenüber oder abwechselnd. Auch die Unterseite anschauen!"],
       ["🌼", "Blüte oder Frucht", "Farbe, Zahl der Blütenblätter, Form. Zähl nach – das hilft enorm."],
       ["👃", "Riechen, nicht kosten", "Viele Pflanzen verraten sich am Geruch, wenn man ein Blatt zerreibt. Aber nicht alles darf man anfassen: Eisenhut, Seidelbast und Riesen-Bärenklau sind schon auf der Haut gefährlich. Danach Hände waschen – und in den Mund kommt nichts, was du nicht hundertprozentig kennst."],
       ["🍄", "Bei Pilzen: unten nachschauen", "Lamellen, Röhren oder Leisten? Ring am Stiel? Und die Stielbasis – die steckt im Boden und verrät die gefährlichsten Giftpilze."],
       ["📷", "Foto von allen Seiten", "Oben, unten, Blatt, Rinde, Umgebung. Zu Hause kannst du in Ruhe vergleichen."]].map(([e, t, x]) => '<div><span class="hs-em">' + e + "</span><b>" + t + "</b><p class=\"wort-text\">" + x + "</p></div>").join("") + "</div>" +

      '<h2 class="hand">Friedrichs eiserne Regeln</h2><div class="regeln">' +
      ["<b>Nichts essen, was du nicht hundertprozentig kennst.</b> Nie allein nach einem Buch oder einer App – auch nicht nach diesem. Bei Pilzen: erst zur Pilzberatung.",
       "<b>Weiße Doldenblüten: Finger weg.</b> Wiesenkerbel, Giersch und der tödliche Schierling sehen sich zum Verwechseln ähnlich.",
       "<b>Unbekannte Beeren bleiben am Strauch.</b> Kinder früh lehren: Erst fragen, dann pflücken.",
       "<b>Nach dem Sammeln Hände waschen</b> und Waldfrüchte vom Boden gut waschen oder erhitzen (Fuchsbandwurm).",
       "<b>Nach jedem Waldtag nach Zecken absuchen.</b> Große Teile Bayerns sind Risikogebiet für FSME.",
       "<b>Geschützte Pflanzen bleiben stehen.</b> Im Naturschutzgebiet auf den Wegen bleiben. Jungtiere nie anfassen – die Mutter ist meist in der Nähe.",
       "<b>Im Notfall:</b> Giftnotruf München <a href=\"tel:+498919240\">089 19240</a> (rund um die Uhr), bei Lebensgefahr <a href=\"tel:112\">112</a>. Pflanzen- oder Pilzreste aufheben und mitnehmen."].map(t => "<p>" + t + "</p>").join("") + "</div>" +

      '<h2 class="hand">Was die Schilder bedeuten</h2><div class="schilder">' +
      [["essbar", "🍴 essbar", "Sicher bestimmt und richtig zubereitet genießbar."], ["bedingt", "⚠ bedingt essbar", "Nur bestimmte Teile, nur gekocht oder nur in kleinen Mengen – lies die Hinweise."], ["kein", "– nicht zum Essen", "Nicht giftig, aber auch keine Speise."], ["giftig", "☠ giftig", "Macht krank. Nicht essen."], ["toedlich", "☠☠ tödlich giftig", "Schon kleine Mengen können töten. Kennen lernen, um sie zu meiden."]]
        .map(([k, n, t]) => '<p><span class="ess-schild ' + k + '">' + n + "</span> " + t + "</p>").join("") + '<p><span class="ess-schild bedingt">🛡 geschützt</span> Steht unter Naturschutz – stehen lassen.</p></div>' +
      '<div class="notiz">Wenn du nach ein paar Wochen an einer Buche vorbeigehst und „Rotbuche“ denkst, ohne nachzudenken – dann hat es angefangen. Von da an sieht man den Wald nie wieder als grüne Wand.<span class="unterschrift">– Friedrich</span></div>' +
      "</div>");
  }

  /* ---------- Seite: Wörterbuch ---------- */
  function woerterSeite(ziel) {
    W.seite('<h1 class="hand">Friedrichs Wörterbuch</h1><p style="font-size:1.08rem">Die Wörter, die in Bestimmungsbüchern ständig vorkommen – einfach erklärt, die wichtigsten mit Zeichnung. Überall im Buch kannst du sie antippen, wenn sie so unterstrichen sind wie hier: <button type="button" class="wort" data-w="0">gegenständig</button>.</p>' +
      '<div class="chips" role="navigation" aria-label="Gruppen">' + GRUPPEN.map(g => '<a class="chip" href="#/woerter/' + slug(g) + '">' + esc(g) + "</a>").join("") + "</div>" +
      GRUPPEN.map(g => '<h2 class="hand" id="w-' + slug(g) + '">' + esc(g) + '</h2><div class="woerter">' +
        WOERTER.filter(w => w.gruppe === g).map(w => '<div class="wort-karte' + (w.bild ? "" : " ohne") + '" id="w-' + slug(w.wort) + '">' + (w.bild ? '<div class="wk-bild">' + zeichnung(w.bild, w.wort) + "</div>" : "") +
          '<div><b class="hand">' + esc(w.wort) + "</b><p>" + esc(w.text) + "</p>" + (w.bsp.length ? '<p class="wp-bsp">Zum Beispiel: ' + w.bsp.map(id => '<a href="#/art/' + id + '">' + esc(ART[id].de) + "</a>").join(", ") + "</p>" : "") + "</div></div>").join("") + "</div>").join(""));
    if (ziel) { const el = document.getElementById("w-" + ziel); if (el) { el.classList.add("glimm"); setTimeout(() => el.scrollIntoView({ block: "start", behavior: "instant" }), 150); } }
  }

  /* ---------- Anbinden ---------- */
  window.WB_START = { EINSTEIGER, ERSTE, WOERTER, markieren, zeichnung };
  if (window.WB_MEHR && WB_MEHR.seiten) { WB_MEHR.seiten.anfang = ersteSchritte; WB_MEHR.seiten.woerter = woerterSeite; }
  if (/^#\/(anfang|woerter)/.test(location.hash)) W.route(); else lauf();
})();
