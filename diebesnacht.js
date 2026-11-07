/* =====================================================================
   EZEKIELS LANGE NACHT – Schleich- und Taschendiebspiel in der Taverne
   Sechs Nächte mit je drei Stufen (Schankraum, Gewölbe, Hinterzimmer),
   danach geht die Nacht endlos weiter (gespiegelte Karten, schärfere Wachen).
   Tippen = schleichen. Gäste von hinten antippen = bestehlen, Wachen von
   hinten = ausschalten, Kerzen = auspusten, Truhen = Schloss knacken.
   Wachen haben Sichtkegel, Licht verrät dich, Fässer verstecken dich.
   Aufsehen wächst mit jedem Fehler und macht die Wachen wachsamer.
   Nach jeder Stufe wählt man eine Gabe (Schattenumhang, Münze werfen …).
   Gruppen-Gags: Friedrich am Tresen, Rex bellt, Barradin lenkt ab.
   Bestenliste wie bei Friedrichs Jagd (Supabase-Tabelle diebe_bestenliste,
   sonst nur auf diesem Gerät).
   ===================================================================== */
(function () {
  "use strict";
  const root = document.getElementById("diebesnacht");
  if (!root) return;

  const sprache = () => (document.documentElement.lang === "en" ? "en" : "de");
  const esc = s => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  let rnd = Math.random;
  const mulberry = a => () => { a |= 0; a = a + 0x6D2B79F5 | 0; let q = Math.imul(a ^ a >>> 15, 1 | a); q = q + Math.imul(q ^ q >>> 7, 61 | q) ^ q; return ((q ^ q >>> 14) >>> 0) / 4294967296; };
  const hashText = str => { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
  const zufall = l => l[Math.floor(rnd() * l.length)];
  const lies = (k, d) => { try { const v = localStorage.getItem(k); return v == null ? d : v; } catch (_) { return d; } };
  const schreib = (k, v) => { try { localStorage.setItem(k, v); } catch (_) {} };
  const ruhig = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const mischen = l => { for (let i = l.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [l[i], l[j]] = [l[j], l[i]]; } return l; };

  /* ---------- Texte ---------- */
  const TX = {
    de: {
      label: "Schurken-Probe", titel: "Ezekiels lange Nacht",
      text: "Sechs Nächte, achtzehn Orte: Ezekiel leert fremde Taschen, bleibt im Schatten, knackt jede Truhe und verschwindet, bevor jemand „Dieb!“ rufen kann. Was er dabei denkt, weiß nur Ezekiel.",
      steuerung: "Tippe auf einen Ort, um dorthin zu schleichen. Tippe Gäste, Wachen, Kerzen und Truhen an, um zu tun, was ein Schurke eben tut.",
      start: "▶ In die Nacht", los: "▶ Los", weiter: "▶ Weiter", nochmal: "↻ Neue Nacht", beenden: "Nacht beenden", erneut: "▶ Noch einmal",
      pause: "Im Schatten verharren", pauseText: "Niemand bemerkt dich, solange du stillhältst.",
      naechte: [["Phandalin", "Zum Schlafenden Riesen"], ["Die Schlossruine", "Bei den Roten Roben"], ["Donnerbaum", "Der verfallene Wachturm"], ["Gracklstugh", "Die Stadt der Duergar"], ["Das Unterreich", "Ilvaras Festung"], ["Gracklstugh", "Das gestohlene Drachenei"]],
      nacht: n => "Nacht " + n, endlos: k => "Endlose Nacht · " + k, endlosUnter: "Die Nacht nimmt kein Ende",
      kurz: (n, s) => "N" + n + " · " + s + "/3", kurzEndlos: k => "∞ " + k,
      lv: [
        ["Der Schankraum", "Tippe auf einen Ort, um dorthin zu schleichen. Tippe Gäste an, um sie zu bestehlen – am besten von hinten. Einer trägt den Kellerschlüssel."],
        ["Der Weinkeller", "Tippe Kerzen an, um sie auszupusten – Schatten verbergen dich. In Fässern bist du unsichtbar. Aber Wachen zünden Kerzen wieder an."],
        ["Glasstabs Versteck", "Tippe Wachen von hinten an, um sie auszuschalten – das macht Lärm. Ausgeschaltete Wachen tippst du nochmal an, um sie zu verstecken. Truhen knackst du, indem du tippst, sobald die Nadel im goldenen Feld steht."],
        ["Die Würfelstube", "An der Wand hängt eine rote Robe. Wer sie trägt, fällt nur noch aus nächster Nähe auf. Und Betrunkene merken ohnehin wenig."],
        ["Die Gewölbe", "Kein Schlüssel nötig. Nur ein Weg nach draußen – und viele Augen."],
        ["Der Kapellensaal", "Die Gläubigen beten zum Altar und schauen selten zurück. Die Truhe hinter dem Altar ist das Ziel."],
        ["Der Turmfuß", "Goblins tragen Fackeln – ihr Licht wandert mit ihnen. Morsche Dielen knarren, wenn du darüberläufst."],
        ["Die Wachstube", "Der Bugbear schläft – meistens. Wacht er auf, sieht er sich um. Er trägt den Schlüssel."],
        ["Venomfangs Hort", "Der Drache schläft auf seinem Gold. Öffnet er ein Auge, gleitet sein Blick durch die Höhle. Knacke die Truhe neben ihm."],
        ["Zum Rauchigen Amboss", "Duergar sehen weit. Und der Wirt hinter dem Tresen ruft sofort die Wache."],
        ["Die Schmiedegassen", "Eisengitter klirren unter deinen Füßen. Die Essen leuchten hell – meide ihr Licht."],
        ["Die magische Schmiede", "Die Truhe ist mit Blutrunen gesichert: Das goldene Feld wandert."],
        ["Die Zellen", "Drow sehen im Dunkeln. Schatten helfen nur, wenn du Abstand hältst. Der Kerkermeister trägt den Schlüssel."],
        ["Die Spinnweben", "Spinnweben halten dich fest – wer hindurch muss, ist langsam."],
        ["Das Grab", "Hier ruht eine Klinge, die leuchtet wie ein Sonnenaufgang. Trägst du sie, leuchtest du mit – und alle sehen dich."],
        ["Der Markt der Klingen", "Ein Grauer Geist mischt sich unters Volk. Er trägt ihr Abzeichen: eine faustgroße Goldmünze mit Drachenkopf. Nimm sie ihm ab – von hinten."],
        ["Die Slums der Grauen Geister", "Ganz unten in Gracklstugh. Die Späher der Grauen Geister sind flink und sehen im Dunkeln weit. Drokey hockt bei seiner Truhe – sobald Alarm geschlagen wird, haut er ab."],
        ["Themberchauds Halle", "Hier verschwand das Ei. Lava an allen Rändern verrät dich mit ihrem Schein, auf dem Goldberg schläft der Meister der Flammen. Lärm weckt ihn. Und eine Münze vom Berg … merkt doch keiner."]
      ],
      ziel: { schluessel: "Stiehl den Schlüssel", truhe: "Knacke die Truhe", frei: "Finde den Ausgang", schwert: "Hol dir die Klinge", ausgang: "✓ Zum Ausgang!" },
      zielWort: "Ziel: ",
      gold: n => "+" + n + " Gold", leer: "Leer.", schluesselDa: "Schlüssel!", he: "He!", wache: "Wache!", fehler: "Daneben!", offen: "Offen!",
      wegFrei: "Der Weg ist frei!", aus: "Ausgeschaltet", zuGross: "Zu groß.", wirtNein: "Der Wirt? Er schenkt doch aus.",
      pfft: "Pfft", wuff: "Wuff!", knarr: "Knarr …", klirr: "Klirr!", robe: "Verkleidet", schritt: "Schattenschritt!", zuWeit: "Zu weit.",
      keinWeg: "Kein Weg dorthin.", zielen: "Wohin werfen?", rexGut: "Rex wedelt.", lieberNicht: "Lieber nicht.", gaehn: "Gähn …", bruell: "GRAAAH!",
      drache: "Venomfang erwacht!", schwertDa: "Die Klinge leuchtet!", erwischt: "Erwischt!", erwischtText: n => n > 0 ? "Noch " + n + " Leben. Die Wache schleift dich zurück an den Anfang." : "",
      friedrich: ["… ich hab nichts gesehen.", "Rex, bleib.", "Lass mir was übrig.", "Heute zahlt Barradin."],
      barradin: ["Psst – ich lenke sie ab!", "Eine Strophe nur für dich!", "Ich singe später über dich. Ganz leise."],
      ezekielStumm: ["…", "Hm."],
      geschafft: "Stufe geschafft", beute: "Beute", ungesehen: "Ungesehen", ungesehenBonus: n => "Ungesehen: +" + n,
      nachtGeschafft: n => "Nacht " + n + " überstanden.", alleGeschafft: "Alle Nächte überstanden! Neue folgen, sobald die Gruppe weiterzieht – bis dahin nimmt die Nacht kein Ende …",
      zorn: "THE DESTROYER!", zornBereit: "Darkin-Zorn bereit!", zornKnopf: "Darkin-Zorn entfesseln", zornTipp: "Darkin-Zorn ist voll: Tippe unten auf 😈, um für ein paar Sekunden zum Destroyer zu werden.",
      zahm: "Braver Hund.", knurr: "Grrr!", keinHund: "Ezekiel tut keinem Hund was.",
      fauch: "Fauch!", fauchDrow: "Du schon wieder!", entlarvt: "Nezna entlarvt!", spinne: "„Die Spinne wird euch holen …“",
      neznaHinweis: "Gerücht: Eine schwarze Katze mit violetten Augen streift hier herum. Fang sie von hinten.", neznaDrow: "Nezna ist hier – diesmal ohne Verkleidung. Ezekiel kennt ihren Rücken.",
      hundHinweis: "Wachhunde riechen dich – sogar im Fass. Tippe sie an, bevor sie anschlagen, und Ezekiel füttert sie.",
      sterne: ["Ungesehen", "Alles Gold", "Ohne Blut"], neu: "neu!", sterneBonus: (a, b) => (a ? "Alles Gold: +" + a : "") + (a && b ? " · " : "") + (b ? "Ohne Blut: +" + b : ""),
      sterneGesamt: (a, b) => "★ " + a + " von " + b + " Sternen", neznaZahl: (a, b) => "🐈‍⬛ Nezna entlarvt: " + a + " von " + b,
      folgt: "Weitere Nächte folgen mit der Kampagne.",
      geschichte: [
        "Die Roten Roben halten Phandalin in Angst. Ihr Gold hält sie bei Laune. Noch.",
        "Schloss Crackmore. Rote Roben, Würfel, Wein – und hinter allem ein Name, den niemand laut sagt: die Spinne.",
        "Donnerbaum ist verlassen. Fast. Goblins, ein schlafender Bugbear – und etwas Grünes, das auf Gold schläft.",
        "In Gracklstugh wird Tag und Nacht geschmiedet. Und der Riese in der Gasse hört wieder Stimmen.",
        "Ilvaras Festung. Ketten, Spinnweben – und ein Grab, das schon viel zu lange wartet.",
        "Später, wieder in Gracklstugh: Ein Drachenei ist gestohlen. Ezekiel hört sich auf eigene Faust um – die Spur führt zu einer Goldmünze mit Drachenkopf und zu einem Dieb namens Drokey."
      ],
      alarmRuf: ["Die Glocke von Phandalin läutet!", "Die Kultglocke dröhnt durch die Ruine!", "Ein Goblin bläst ins Horn!", "Die Duergar schlagen Alarm auf dem Amboss!", "Ein Gong hallt durch das Unterreich!", "Ein Pfiff gellt durch die Gassen von Gracklstugh!"],
      alarm: "ALARM!", alarmSub: "Verstärkung kommt – die Kerzen brennen gleich wieder.", alarmHinweis: "Sobald du das Ziel hast, wird Alarm geschlagen: Verstärkung kommt, Kerzen werden wieder angezündet. Der Rückweg ist die eigentliche Prüfung.",
      leiche: "Eine Leiche! Alarm!", verborgen: "Versteckt.", leichenHinweis: "Ausgeschaltete Wachen werden gefunden. Tippe sie an, damit Ezekiel sie versteckt.",
      magier: "Arkanes Auge!", magierHinweis: "Ein Magier tastet regelmäßig mit einem Arkanen Auge durch Wände. Achte auf das violette Leuchten – dann ab ins Fass oder weg.",
      hauptmann: "Zu den Waffen!", hauptmannHinweis: "Der Hauptmann mit dem goldenen Helm ruft alle Wachen zusammen, sobald er dich entdeckt.",
      glasstabHinweis: "Glasstab ist hier. Sobald Alarm geschlagen wird, flieht er zum Ausgang – stell ihn, bevor er entkommt.",
      glasstabFlieht: "Glasstab flieht!", glasstabSieht: "Eindringling!", glasstabGefangen: "Glasstab gestellt!", glasstabSpruch: "„Die Spinne … wird euch …“", glasstabWeg: "Glasstab ist entkommen.",
      ilvaraHinweis: "Irgendwo hier lauert jemand, den ihr für tot gehalten habt.", ilvaraDa: "Ilvara! Den Sturz in den Fluss hat sie überlebt.",
      /* Lärm, Verkleidung, Taschendiebstahl, Nachstellung, Stimmung */
      laermHinweis: "Jeder Schritt macht Lärm: Holzdielen, Geröll und Pfützen sind laut, Teppich, Stroh und Moos schlucken ihn. Die Ringe um Ezekiel zeigen, wie weit man ihn hört – Wachen in Hörweite drehen sich um.",
      mondHinweis: "Mondlicht fällt durch die Fenster. Wer darin steht, steht im Rampenlicht – warte auf die nächste Wolke.",
      lauschen: ["Hm?", "War da was?", "Ratten …?", "Wer trampelt da?", "Barradin, bist du das?"],
      aufsehenWort: "Aufsehen", laermWort: "Lärm",
      grund: { holz: "Holzdielen", knarr: "Morsche Diele", gitter: "Eisengitter", stein: "Stein", fels: "Fels", teppich: "Teppich", stroh: "Stroh", moos: "Moos", asche: "Asche", kies: "Geröll", muenzen: "Münzgeröll", pfuetze: "Pfütze", netz: "Spinnweben" },
      maskeKnopf: "Verkleidung anlegen", maske: "Verkleidet!", maskeAus: "Die Verkleidung rutscht!",
      gruss: ["N'Abend.", "Schicke Hörner.", "Neu hier?", "Kenn ich dich?", "Weitermachen.", "Schon Schichtwechsel?", "Hübscher Umhang."],
      griff: { meister: "Meistergriff!", sauber: "Sauberer Griff!", patzer: "Patzer!", jetzt: "Jetzt tippen!" },
      griffHinweis: "Taschendiebstahl: Kurz erscheint eine Leiste – tippe, wenn die Hand im goldenen Feld ist, für Bonusgold. Wer daneben tippt, patzt. Wer gar nicht tippt, greift ganz normal zu.",
      nachstellung: "Nachstellung", nachstellungUnter: "So lief es wirklich", ueberspringen: "Überspringen ⏭", tippUeberspringen: "Tippen zum Überspringen", nochmalAnsehen: "🎞 Nachstellung ansehen", legendeE: "Ezekiel", legendeW: "Wachen",
      wetter: { klar: "✨ Sternklar", regen: "🌧 Regen", schnee: "❄ Schnee", wind: "🌬 Sturmwind", gewitter: "⛈ Gewitter", nebel: "🌫 Nebel" },
      tageszeit: { daemmerung: "Abenddämmerung", mitternacht: "Mitternacht", morgengrauen: "Kurz vor Morgengrauen" },
      /* Nacht-eigene Texte: überschreiben die allgemeinen, solange eine Karte dieser Nacht läuft */
      ueber: {
        6: { ziel: { schluessel: "Stiehl die Drachenmünze" }, schluesselDa: "Die Drachenmünze!", bossName: "Drokey", auftragBoss: "Stelle Drokey",
          glasstabHinweis: "Drokey ist hier. Sobald Alarm geschlagen wird, flieht er zum Ausgang – stell ihn, bevor er entkommt.",
          glasstabFlieht: "Drokey haut ab!", glasstabSieht: "Ein Schnüffler!", glasstabGefangen: "Drokey gestellt!", glasstabSpruch: "„Das Ei? Frag doch die Rotroben …“", glasstabWeg: "Drokey ist entkommen.",
          drache: "„Leg das zurück, kleiner Dieb.“", dracheWach: "Themberchaud öffnet ein Auge …",
          friedrich: ["Echo fragt den Händler nach Gundren. Wieder nein.", "Rex, bleib.", "Den Betäubungstrank hab ich vor fünf Minuten gekauft. Hat sich schon gelohnt.", "Lass mir was übrig."],
          barradin: ["Psst – ich lenke sie ab!", "Ein Reim auf „Drachenei“? Ich arbeite dran.", "Echo fragt gerade einen Riesen nach Gundren. Ich hab Zeit."] }
      },
      bed: {
        vollmond: ["🌕 Vollmond", "Selbst im Schatten sieht man dich auf größere Entfernung."],
        gewitter: ["⛈ Gewitter", "Blitze erhellen für einen Augenblick alles. Achte auf das Wetterleuchten."],
        fest: ["🍻 Fest", "Mehr Gäste, mehr Gold – und alle sind abgelenkter."],
        wachsam: ["⚔ Erhöhte Wachsamkeit", "Schärfere Augen, aber anderthalbfache Beute."],
        nebel: ["🌫 Nebel", "Alle sehen weniger weit."]
      },
      auftragWort: "Nebenauftrag: ",
      auftrag: { brief: "Finde den Brief", zeit: n => "Entkomme in " + n + " s", kerzen: "Alle Kerzen gleichzeitig aus", keinAlarm: "Keine Jagd, keine Leiche gefunden", nezna: "Entlarve Nezna", glasstab: "Stelle Glasstab" },
      auftragOk: "Nebenauftrag erfüllt!", auftragFehl: "Nebenauftrag verpatzt.", auftragBonus: n => "Nebenauftrag: +" + n,
      briefDa: "Ein Brief!", briefLesen: "Ezekiel überfliegt das Papier …",
      briefe: {
        n1: ["Ein Zettel der Roten Roben", "„Glasstab will die Gefangenen bis zum Neumond im Keller haben. Die Spinne zahlt gut – aber sie zahlt nicht für Fehler. Und haltet die Neuen vom Wein fern.“"],
        n2: ["Eine Liste in roter Tinte", "„Neue Rekruten: vier. Einer gehörnt, einer mit Laute, einer mit Hund, einer mit Hörnern UND Geweih. Glasstab sagt, wir sollen sie im Auge behalten.“"],
        n3: ["Goblin-Gekritzel", "„DRACHE ZÄHLT GOLD. JEDE NACHT. NICHT ANFASSEN. GRUK HAT ANGEFASST. GRUK IST JETZT GRÜN.“"],
        n4: ["Ein Befehl der Duergar", "„Der Riese in der Schmiedegasse hört wieder Stimmen. Doppelte Wachen an der Esse. Und niemand redet mit ihm über Spinnen.“"],
        n5: ["Ein Siegel des Hauses Mizzrym", "„Lasst niemanden ins Grab. Was dort leuchtet, gehört dem Haus Mizzrym. – I.“"],
        n6: ["Ein Zettel mit Drachenkopf", "„Die Ware ist warm. Sehr warm. Nicht schütteln, nicht fallen lassen. Übergabe unten am Abfluss, wenn der Amboss dreimal schlägt. Und kein Wort zu den Rotroben. – D.“"],
        e1: ["Ein Steckbrief", "„Gesucht: gehörnter Dieb in scharlachroter Rüstung. Spricht wenig. Belohnung: 500 Gold.“ Darunter, in anderer Schrift: „Viel Glück.“"],
        e2: ["Eine vergilbte Skizze", "Eine Statue, mit Kohle gezeichnet. Auf der Rückseite ein Name – verwischt, unleserlich. Ezekiel steckt sie ein, ohne ein Wort."],
        e3: ["Ein Liedtext", "„Oh Ezekiel, der Schatten Sohn, / er nimmt dein Gold und dankt dir schon …“ Unterschrieben mit einem schwungvollen B."],
        e4: ["Eine Notiz mit acht Tintenflecken", "„Sie sind näher, als sie denken. – S.“"]
      },
      versteck: "Diebesversteck", versteckKnopf: v => "🏴 Diebesversteck · " + v, versteckText: "Hier lagert Ezekiel, was er nicht ausgibt. Alles Gold aus deinen Nächten landet hier.",
      versteckGold: n => n + " Gold im Versteck", versteckPlus: n => "+" + n + " Gold ins Diebesversteck",
      ausruestung: "Ausrüstung", ruestungen: "Rüstungen", briefeTitel: "Gefundene Briefe", keineBriefe: "Noch keine. Briefe findest du über Nebenaufträge.",
      kaufen: n => n + " Gold", gekauft: "✓ Besitzt du", tragen: "Anlegen", getragen: "✓ Angelegt", zurueck: "← Zurück",
      ware: {
        rauch: ["Rauchbombe", "Eine pro Stufe: Tippe 🌫, und Wachen verlieren dich aus den Augen."],
        maske: ["Verkleidungskiste", "Einmal pro Stufe: Tippe 🎭, und Wachen halten dich ein paar Sekunden für einen der Ihren. Hunde fallen nicht drauf rein."],
        seil: ["Enterhaken", "Ezekiel klettert über Tische und Tresen. Wachen können das nicht."],
        dietrich: ["Dietrich-Set", "Ein größeres goldenes Feld beim Schlossknacken."],
        beutel: ["Tiefe Taschen", "+15 % Gold."],
        herz: ["Zähes Herz", "+1 Leben in jeder Nacht."],
        gabe: ["Gute Vorbereitung", "Jede Nacht beginnt mit einer zufälligen Gabe."]
      },
      skins: {
        scharlach: ["Scharlachrote Rüstung", "Wie immer."],
        robe: ["Rote Robe", "Aus Schloss Crackmore mitgenommen."],
        schatten: ["Schattenmantel", "Schwarz wie das Unterreich."],
        sonne: ["Sonnenglanz", "Schimmert wie die Klinge aus dem Grab."]
      },
      rauchKnopf: "Rauchbombe werfen", rauch: "Rauch!",
      taeglichKnopf: "📅 Tägliche Nacht", taeglichTitel: d => "Tägliche Nacht · " + d,
      taeglichText: "Jeden Tag eine neue Stufe – für alle gleich: eine Bedingung, ein Nebenauftrag, zwei Gaben. Wer holt das meiste Gold?",
      taeglichBest: n => "Dein Bestes heute: " + n + " Gold", taeglichListe: "🏆 Heute", taeglichGaben: "Deine Gaben heute:", gaben2: "Deine Gaben:",
      rast: "Atempause im Schatten", rastText: "Wähle eine Gabe für die nächste Stufe.",
      stufenTitel: "Schwierigkeit", stufen: { lehrling: "🕯 Lehrling", schurke: "🗡 Schurke", legende: "😈 Destroyer" },
      stufenText: { lehrling: "Langsamere, kurzsichtige Wachen. 5 Leben.", schurke: "Die Nacht, wie Ezekiel sie kennt. 3 Leben.", legende: "Wache Augen, schnelle Beine. 2 Leben." },
      nachtWahl: "Beginne in", pauseKnopf: "Pause", muenzeKnopf: "Münze werfen",
      bestenliste: "🏆 Bestenliste", nurHier: "Noch nur auf diesem Gerät gespeichert.", leer2: "Noch niemand – sei der erste Meisterdieb!",
      eintragen: "🏆 Eintragen", deinName: "Dein Name", eingetragen: p => "Eingetragen – Platz " + p + "!", eingetragenOhne: "Eingetragen!", sendet: "Wird eingetragen …",
      fehler: { "Bitte freundlich bleiben": "Dieser Name ist leider nicht erlaubt – bitte wähle einen anderen.", "Bitte kurz warten": "Zu viele Einträge in kurzer Zeit – bitte später nochmal.",
        "Bitte später nochmal": "Zu viele Einträge in kurzer Zeit – bitte später nochmal.", "Name fehlt": "Bitte gib einen Namen ein.",
        "falscher Tag": "Diese Tägliche Nacht ist schon vorbei – dein Ergebnis bleibt auf diesem Gerät.",
        netz: "Server nicht erreichbar – nur auf diesem Gerät gespeichert.", endgueltig: "Eintrag hat nicht geklappt – dein Ergebnis bleibt auf diesem Gerät.", _: "Eintrag hat nicht geklappt – bitte versuch es nochmal." },
      fortsetzen: "↻ Diebeszug fortsetzen", fortsetzenInfo: (st, p, l) => "Angefangener Diebeszug: Stufe " + st + " · " + p + " Gold · " + l + " ♥",
      fortsetzenErwischt: "Die Stufe wurde unterbrochen – Ezekiel beginnt sie neu, mit einem Leben weniger.", neuerZug: "▶ Neuer Diebeszug",
      spalten: ["#", "Name", "Gold", "Stufe"],
      stufe: (a, b) => "Stufe " + a + "/" + b,
      gaben: {
        umhang: [["Schattenumhang", "Wachen bemerken dich langsamer."], ["Mantel der Nacht", "Noch langsamer."]],
        sohlen: [["Leise Sohlen", "Du schleichst schneller und leiser."], ["Katzenpfoten", "Noch schneller, noch leiser."]],
        finger: [["Flinke Finger", "Klauen klappt auch von der Seite, Schlösser sind leichter."], ["Meisterdieb", "Klauen fast von vorn, noch leichtere Schlösser."]],
        muenze: [["Geworfene Münze", "Eine Münze pro Stufe: Lärm, wo du willst."], ["Münzbeutel", "Zwei Münzen pro Stufe."], ["Goldregen", "Drei Münzen pro Stufe."]],
        klinge: [["Stille Klinge", "Ausschalten macht keinen Lärm mehr."]],
        schritt: [["Schattenschritt", "Einmal pro Stufe entwischst du, wenn sie dich packen."]],
        ranken: [["Echos Ranken", "Wurzeln bremsen alle Wachen."], ["Dichte Ranken", "Die Wachen werden noch langsamer."]],
        sinne: [["Darkin-Sinne", "Du spürst immer, wer den Schlüssel trägt."]],
        lied: [["Barradins Ballade", "Barradin besingt dich überall: Aufsehen verfliegt mit der Zeit."]],
        rast: [["Heiltrank", "+1 Leben."]],
        blutdurst: [["Blutdurst", "Darkin-Zorn füllt sich schneller und hält länger."]]
      },
      ende: "Ezekiel wurde gefasst", punkte: "Gold",
      wert: { stufe: "Erreicht", bestohlen: "Bestohlen", aus: "Ausgeschaltet", geist: "Ungesehen", auftraege: "Aufträge", meister: "Meistergriffe" },
      rekord: (n, st) => "Dein Rekord (" + st + "): " + n + " Gold", neuRekord: "Neuer Rekord!",
      ton: ["🔊 Ton an", "🔈 Ton aus"],
      spruch: {
        schwach: ["…", "Zu laut.", "Morgen. Leiser."],
        mittel: ["Hm.", "Reicht für ein Bier.", "Nicht schlecht. Nicht gut."],
        gut: ["Gut.", "Niemand hat etwas gesehen.", "Ich war nie hier."],
        legende: ["Der Onkel wäre stolz.", "Barradin wird darüber singen. Leider.", "Destroyer. Nicht Dieb. Beides."]
      }
    },
    en: {
      label: "Rogue check", titel: "Ezekiel's Long Night",
      text: "Six nights, eighteen places: Ezekiel empties strangers' pockets, stays in the shadows, cracks every chest and vanishes before anyone can shout \"Thief!\". What he is thinking, only Ezekiel knows.",
      steuerung: "Tap a spot to sneak there. Tap guests, guards, candles and chests to do what a rogue does.",
      start: "▶ Into the night", los: "▶ Go", weiter: "▶ Continue", nochmal: "↻ New night", beenden: "End the night", erneut: "▶ Try again",
      pause: "Frozen in the shadows", pauseText: "Nobody notices you as long as you stay still.",
      naechte: [["Phandalin", "The Sleeping Giant"], ["The castle ruin", "Among the Red Robes"], ["Thundertree", "The crumbling watchtower"], ["Gracklstugh", "City of the duergar"], ["The Underdark", "Ilvara's fortress"], ["Gracklstugh", "The stolen dragon egg"]],
      nacht: n => "Night " + n, endlos: k => "Endless night · " + k, endlosUnter: "The night never ends",
      kurz: (n, s) => "N" + n + " · " + s + "/3", kurzEndlos: k => "∞ " + k,
      lv: [
        ["The taproom", "Tap a spot to sneak there. Tap guests to pick their pockets – best from behind. One of them carries the cellar key."],
        ["The wine cellar", "Tap candles to blow them out – shadows hide you. In barrels you are invisible. But guards light candles again."],
        ["Glasstaff's hideout", "Tap guards from behind to take them down – it makes noise. Tap them again to hide the body. Crack chests by tapping when the needle is in the golden field."],
        ["The dice room", "A red robe hangs on the wall. Whoever wears it only stands out up close. And drunks notice little anyway."],
        ["The vaults", "No key needed. Only one way out – and many eyes."],
        ["The chapel hall", "The faithful pray towards the altar and rarely look back. The chest behind the altar is the goal."],
        ["The tower foot", "Goblins carry torches – their light moves with them. Rotten floorboards creak when you walk on them."],
        ["The guardroom", "The bugbear is asleep – mostly. When he wakes, he looks around. He carries the key."],
        ["Venomfang's hoard", "The dragon sleeps on his gold. When he opens an eye, his gaze sweeps the cave. Crack the chest beside him."],
        ["The Smoky Anvil", "Duergar see far. And the innkeeper behind the bar calls the guard at once."],
        ["The forge alleys", "Iron grates clank under your feet. The forges glow brightly – avoid their light."],
        ["The magic forge", "The chest is sealed with blood runes: the golden field moves."],
        ["The cells", "Drow see in the dark. Shadows only help if you keep your distance. The jailer carries the key."],
        ["The webs", "Spider webs hold you fast – whoever has to pass through is slow."],
        ["The tomb", "Here rests a blade that shines like a sunrise. Once you carry it, you shine too – and everyone sees you."],
        ["The Market of Blades", "A Grey Ghost mingles with the crowd. He wears their token: a fist-sized gold coin with a dragon's head. Take it from him – from behind."],
        ["The Grey Ghosts' slums", "The very bottom of Gracklstugh. The Grey Ghost scouts are quick and see far in the dark. Drokey crouches by his chest – once the alarm is raised, he runs."],
        ["Themberchaud's hall", "This is where the egg vanished. Lava along every edge gives you away with its glow, and on the mountain of gold sleeps the Master of Flames. Noise wakes him. And one coin from the pile … nobody will notice."]
      ],
      ziel: { schluessel: "Steal the key", truhe: "Crack the chest", frei: "Find the exit", schwert: "Take the blade", ausgang: "✓ To the exit!" },
      zielWort: "Goal: ",
      gold: n => "+" + n + " gold", leer: "Empty.", schluesselDa: "The key!", he: "Hey!", wache: "Guards!", fehler: "Missed!", offen: "Open!",
      wegFrei: "The way is clear!", aus: "Taken down", zuGross: "Too big.", wirtNein: "The innkeeper? He pours the ale.",
      pfft: "Pfft", wuff: "Woof!", knarr: "Creak …", klirr: "Clink!", robe: "Disguised", schritt: "Shadow step!", zuWeit: "Too far.",
      keinWeg: "No way there.", zielen: "Throw where?", rexGut: "Rex wags his tail.", lieberNicht: "Better not.", gaehn: "Yawn …", bruell: "GRAAAH!",
      drache: "Venomfang awakens!", schwertDa: "The blade shines!", erwischt: "Caught!", erwischtText: n => n > 0 ? n + (n === 1 ? " life" : " lives") + " left. The guard drags you back to the start." : "",
      friedrich: ["… I didn't see anything.", "Rex, stay.", "Leave some for me.", "Barradin is paying tonight."],
      barradin: ["Psst – I'll distract them!", "A verse just for you!", "I'll sing about you later. Very quietly."],
      ezekielStumm: ["…", "Hm."],
      geschafft: "Stage cleared", beute: "Loot", ungesehen: "Unseen", ungesehenBonus: n => "Unseen: +" + n,
      nachtGeschafft: n => "Night " + n + " survived.", alleGeschafft: "All nights survived! More follow as the party moves on – until then, the night never ends …",
      zorn: "THE DESTROYER!", zornBereit: "Darkin rage ready!", zornKnopf: "Unleash Darkin rage", zornTipp: "Darkin rage is full: tap 😈 below to become the Destroyer for a few seconds.",
      zahm: "Good dog.", knurr: "Grrr!", keinHund: "Ezekiel would never hurt a dog.",
      fauch: "Hiss!", fauchDrow: "You again!", entlarvt: "Nezna unmasked!", spinne: "\"The spider will come for you …\"",
      neznaHinweis: "Rumour: a black cat with violet eyes prowls here. Catch her from behind.", neznaDrow: "Nezna is here – this time without disguise. Ezekiel knows her back.",
      hundHinweis: "Guard dogs smell you – even in a barrel. Tap them before they bark and Ezekiel feeds them.",
      sterne: ["Unseen", "All the gold", "No blood"], neu: "new!", sterneBonus: (a, b) => (a ? "All the gold: +" + a : "") + (a && b ? " · " : "") + (b ? "No blood: +" + b : ""),
      sterneGesamt: (a, b) => "★ " + a + " of " + b + " stars", neznaZahl: (a, b) => "🐈‍⬛ Nezna unmasked: " + a + " of " + b,
      folgt: "More nights follow with the campaign.",
      geschichte: [
        "The Red Robes keep Phandalin in fear. Their gold keeps them happy. For now.",
        "Castle Crackmore. Red robes, dice, wine – and behind it all a name nobody says out loud: the Spider.",
        "Thundertree is deserted. Almost. Goblins, a sleeping bugbear – and something green asleep on gold.",
        "In Gracklstugh the forges burn day and night. And the giant in the alley hears voices again.",
        "Ilvara's fortress. Chains, webs – and a tomb that has been waiting far too long.",
        "Later, back in Gracklstugh: a dragon egg has been stolen. Ezekiel makes his own enquiries – the trail leads to a gold coin with a dragon's head and to a thief called Drokey."
      ],
      alarmRuf: ["The bell of Phandalin rings!", "The cult bell booms through the ruin!", "A goblin blows the horn!", "The duergar beat the alarm on the anvil!", "A gong echoes through the Underdark!", "A whistle shrills through the alleys of Gracklstugh!"],
      alarm: "ALARM!", alarmSub: "Reinforcements are coming – the candles will soon be lit again.", alarmHinweis: "Once you reach the goal, the alarm is raised: reinforcements arrive, candles are lit again. The way back is the real test.",
      leiche: "A body! Alarm!", verborgen: "Hidden.", leichenHinweis: "Guards you took down will be found. Tap them so Ezekiel hides them.",
      magier: "Arcane eye!", magierHinweis: "A mage regularly probes through walls with an arcane eye. Watch for the violet glow – then into a barrel or away.",
      hauptmann: "To arms!", hauptmannHinweis: "The captain with the golden helmet calls every guard as soon as he spots you.",
      glasstabHinweis: "Glasstaff is here. Once the alarm is raised, he flees to the exit – catch him before he escapes.",
      glasstabFlieht: "Glasstaff flees!", glasstabSieht: "Intruder!", glasstabGefangen: "Glasstaff caught!", glasstabSpruch: "“The Spider … will …”", glasstabWeg: "Glasstaff escaped.",
      ilvaraHinweis: "Somewhere here lurks someone you thought was dead.", ilvaraDa: "Ilvara! She survived the fall into the river.",
      laermHinweis: "Every step makes noise: floorboards, gravel and puddles are loud, carpet, straw and moss swallow it. The rings around Ezekiel show how far he can be heard – guards within earshot turn around.",
      mondHinweis: "Moonlight falls through the windows. Stand in it and you're in the spotlight – wait for the next cloud.",
      lauschen: ["Hm?", "What was that?", "Rats …?", "Who's stomping?", "Barradin, is that you?"],
      aufsehenWort: "Attention", laermWort: "Noise",
      grund: { holz: "Floorboards", knarr: "Rotten board", gitter: "Iron grate", stein: "Stone", fels: "Rock", teppich: "Carpet", stroh: "Straw", moos: "Moss", asche: "Ash", kies: "Gravel", muenzen: "Loose coins", pfuetze: "Puddle", netz: "Webs" },
      maskeKnopf: "Put on disguise", maske: "Disguised!", maskeAus: "The disguise slips!",
      gruss: ["Evening.", "Nice horns.", "New here?", "Do I know you?", "Carry on.", "Shift change already?", "Lovely cloak."],
      griff: { meister: "Master grab!", sauber: "Clean grab!", patzer: "Fumbled!", jetzt: "Tap now!" },
      griffHinweis: "Pickpocketing: a bar appears briefly – tap while the hand is in the golden field for bonus gold. Tap outside it and you fumble. Don't tap at all and you just grab normally.",
      nachstellung: "Reenactment", nachstellungUnter: "How it really went", ueberspringen: "Skip ⏭", tippUeberspringen: "Tap to skip", nochmalAnsehen: "🎞 Watch the reenactment", legendeE: "Ezekiel", legendeW: "Guards",
      wetter: { klar: "✨ Starry", regen: "🌧 Rain", schnee: "❄ Snow", wind: "🌬 Gale", gewitter: "⛈ Thunderstorm", nebel: "🌫 Fog" },
      tageszeit: { daemmerung: "Dusk", mitternacht: "Midnight", morgengrauen: "Just before dawn" },
      ueber: {
        6: { ziel: { schluessel: "Steal the dragon coin" }, schluesselDa: "The dragon coin!", bossName: "Drokey", auftragBoss: "Catch Drokey",
          glasstabHinweis: "Drokey is here. Once the alarm is raised, he flees to the exit – catch him before he escapes.",
          glasstabFlieht: "Drokey bolts!", glasstabSieht: "A snoop!", glasstabGefangen: "Drokey caught!", glasstabSpruch: "“The egg? Go ask the Red Robes …”", glasstabWeg: "Drokey escaped.",
          drache: "“Put that back, little thief.”", dracheWach: "Themberchaud opens an eye …",
          friedrich: ["Echo asks the merchant about Gundren. No again.", "Rex, stay.", "Bought that sleeping potion five minutes ago. Already worth it.", "Leave some for me."],
          barradin: ["Psst – I'll distract them!", "A rhyme for “dragon egg”? Working on it.", "Echo is asking a giant about Gundren. I have time."] }
      },
      bed: {
        vollmond: ["🌕 Full moon", "Even in the shadows you can be seen from further away."],
        gewitter: ["⛈ Thunderstorm", "Lightning lights up everything for a moment. Watch for the sheet lightning."],
        fest: ["🍻 Feast", "More guests, more gold – and everyone is more distracted."],
        wachsam: ["⚔ High alert", "Sharper eyes, but one and a half times the loot."],
        nebel: ["🌫 Fog", "Everyone sees less far."]
      },
      auftragWort: "Side quest: ",
      auftrag: { brief: "Find the letter", zeit: n => "Escape within " + n + " s", kerzen: "All candles out at once", keinAlarm: "No chase, no body found", nezna: "Unmask Nezna", glasstab: "Catch Glasstaff" },
      auftragOk: "Side quest done!", auftragFehl: "Side quest failed.", auftragBonus: n => "Side quest: +" + n,
      briefDa: "A letter!", briefLesen: "Ezekiel skims the paper …",
      briefe: {
        n1: ["A Red Robes note", "“Glasstaff wants the prisoners kept in the cellar until the new moon. The Spider pays well – but she doesn't pay for mistakes. And keep the new ones away from the wine.”"],
        n2: ["A list in red ink", "“New recruits: four. One horned, one with a lute, one with a dog, one with horns AND antlers. Glasstaff says keep an eye on them.”"],
        n3: ["Goblin scribbles", "“DRAGON COUNTS GOLD. EVERY NIGHT. NO TOUCH. GRUK TOUCHED. GRUK IS GREEN NOW.”"],
        n4: ["A duergar order", "“The giant in the forge alley hears voices again. Double guards at the forge. And nobody talks to him about spiders.”"],
        n5: ["A seal of House Mizzrym", "“Let no one into the tomb. What shines there belongs to House Mizzrym. – I.”"],
        n6: ["A note with a dragon's head", "“The goods are warm. Very warm. Don't shake, don't drop. Handover down at the drain when the anvil strikes three times. And not a word to the Red Robes. – D.”"],
        e1: ["A wanted poster", "“Wanted: horned thief in scarlet armour. Speaks little. Reward: 500 gold.” Below, in a different hand: “Good luck.”"],
        e2: ["A yellowed sketch", "A statue, drawn in charcoal. On the back a name – smudged, illegible. Ezekiel pockets it without a word."],
        e3: ["Song lyrics", "“Oh Ezekiel, the shadow's son, / he takes your gold and thanks you, one by one …” Signed with a flourishing B."],
        e4: ["A note with eight ink blots", "“They are closer than they think. – S.”"]
      },
      versteck: "Thieves' hideout", versteckKnopf: v => "🏴 Hideout · " + v, versteckText: "Here Ezekiel keeps what he doesn't spend. All the gold from your nights ends up here.",
      versteckGold: n => n + " gold in the hideout", versteckPlus: n => "+" + n + " gold to the hideout",
      ausruestung: "Equipment", ruestungen: "Armour", briefeTitel: "Letters found", keineBriefe: "None yet. You find letters through side quests.",
      kaufen: n => n + " gold", gekauft: "✓ Owned", tragen: "Wear", getragen: "✓ Wearing", zurueck: "← Back",
      ware: {
        rauch: ["Smoke bomb", "One per stage: tap 🌫 and guards lose sight of you."],
        maske: ["Disguise kit", "Once per stage: tap 🎭 and guards take you for one of their own for a few seconds. Dogs aren't fooled."],
        seil: ["Grappling hook", "Ezekiel climbs over tables and counters. Guards can't."],
        dietrich: ["Lockpick set", "A larger golden field when picking locks."],
        beutel: ["Deep pockets", "+15% gold."],
        herz: ["Tough heart", "+1 life every night."],
        gabe: ["Good preparation", "Every night starts with a random gift."]
      },
      skins: {
        scharlach: ["Scarlet armour", "As always."],
        robe: ["Red robe", "Taken from Castle Crackmore."],
        schatten: ["Shadow cloak", "Black as the Underdark."],
        sonne: ["Sunlit sheen", "Shimmers like the blade from the tomb."]
      },
      rauchKnopf: "Throw smoke bomb", rauch: "Smoke!",
      taeglichKnopf: "📅 Daily night", taeglichTitel: d => "Daily night · " + d,
      taeglichText: "A new stage every day – the same for everyone: one condition, one side quest, two gifts. Who gets the most gold?",
      taeglichBest: n => "Your best today: " + n + " gold", taeglichListe: "🏆 Today", taeglichGaben: "Your gifts today:", gaben2: "Your gifts:",
      rast: "A breather in the shadows", rastText: "Choose a gift for the next stage.",
      stufenTitel: "Difficulty", stufen: { lehrling: "🕯 Apprentice", schurke: "🗡 Rogue", legende: "😈 Destroyer" },
      stufenText: { lehrling: "Slower, short-sighted guards. 5 lives.", schurke: "The night as Ezekiel knows it. 3 lives.", legende: "Sharp eyes, quick legs. 2 lives." },
      nachtWahl: "Start in", pauseKnopf: "Pause", muenzeKnopf: "Throw a coin",
      bestenliste: "🏆 Leaderboard", nurHier: "Only saved on this device for now.", leer2: "Nobody yet – be the first master thief!",
      eintragen: "🏆 Submit", deinName: "Your name", eingetragen: p => "Submitted – rank " + p + "!", eingetragenOhne: "Submitted!", sendet: "Submitting …",
      fehler: { "Bitte freundlich bleiben": "That name isn't allowed – please choose another one.", "Bitte kurz warten": "Too many entries in a short time – please try again later.",
        "Bitte später nochmal": "Too many entries in a short time – please try again later.", "Name fehlt": "Please enter a name.",
        "falscher Tag": "This daily night is already over – your score stays on this device.",
        netz: "Server unreachable – saved on this device only.", endgueltig: "Submitting didn't work – your score stays on this device.", _: "Submitting didn't work – please try again." },
      fortsetzen: "↻ Continue heist", fortsetzenInfo: (st, p, l) => "Unfinished heist: stage " + st + " · " + p + " gold · " + l + " ♥",
      fortsetzenErwischt: "The stage was interrupted – Ezekiel starts it over with one life less.", neuerZug: "▶ New heist",
      spalten: ["#", "Name", "Gold", "Stage"],
      stufe: (a, b) => "Level " + a + "/" + b,
      gaben: {
        umhang: [["Shadow cloak", "Guards notice you more slowly."], ["Cloak of night", "Even more slowly."]],
        sohlen: [["Soft soles", "You sneak faster and quieter."], ["Cat's paws", "Even faster, even quieter."]],
        finger: [["Nimble fingers", "Steal from the side too, locks are easier."], ["Master thief", "Steal almost from the front, even easier locks."]],
        muenze: [["Thrown coin", "One coin per stage: noise wherever you want."], ["Coin purse", "Two coins per stage."], ["Rain of gold", "Three coins per stage."]],
        klinge: [["Silent blade", "Takedowns no longer make noise."]],
        schritt: [["Shadow step", "Once per stage you slip away when they grab you."]],
        ranken: [["Echo's vines", "Roots slow down all guards."], ["Dense vines", "The guards get even slower."]],
        sinne: [["Darkin senses", "You always sense who carries the key."]],
        lied: [["Barradin's ballad", "Barradin sings of you everywhere: attention fades over time."]],
        rast: [["Healing potion", "+1 life."]],
        blutdurst: [["Bloodlust", "Darkin rage fills faster and lasts longer."]]
      },
      ende: "Ezekiel was caught", punkte: "gold",
      wert: { stufe: "Reached", bestohlen: "Pickpocketed", aus: "Taken down", geist: "Unseen", auftraege: "Side quests", meister: "Master grabs" },
      rekord: (n, st) => "Your record (" + st + "): " + n + " gold", neuRekord: "New record!",
      ton: ["🔊 Sound on", "🔈 Sound off"],
      spruch: {
        schwach: ["…", "Too loud.", "Tomorrow. Quieter."],
        mittel: ["Hm.", "Enough for an ale.", "Not bad. Not good."],
        gut: ["Good.", "Nobody saw anything.", "I was never here."],
        legende: ["My uncle would be proud.", "Barradin will sing about this. Sadly.", "Destroyer. Not thief. Both."]
      }
    }
  };
  const t = () => TX[sprache()];
  /* Text mit Nacht-Überschreibung (TX.ueber[n]), z. B. Drokey statt Glasstab in Nacht 6 */
  const tn = k => { const tx = t(), o = S && S.def && tx.ueber && tx.ueber[S.def.n]; return o && o[k] !== undefined ? o[k] : tx[k]; };
  const zielName = z => { const o = tn("ziel"); return (o && o[z]) || t().ziel[z]; };
  const auftragName = A => A.typ === "zeit" ? t().auftrag.zeit(A.limit) : A.typ === "glasstab" && tn("auftragBoss") ? tn("auftragBoss") : t().auftrag[A.typ];

  /* ---------- Welt ---------- */
  const COLS = 12, ROWS = 14, W = 400, C = W / COLS, GH = ROWS * C;
  /* Hochformat: Kopfleiste oben (OY), Karte, Fußleiste unten – Gesamtgröße W × H.
     Querformat (Vollbild auf breiten Bildschirmen): Karte ganz oben links, rechts daneben eine
     Seitenleiste (QUER_PANEL) mit allen Anzeigen – Gesamtgröße BW × H. W bleibt immer die Kartenbreite. */
  const QUER_PANEL = 170;
  let OY = 42, H = 560, FUSS_Y = OY + GH, BW = W, istQuer = false;
  const FONT_D = '"IM Fell English SC", "Palatino Linotype", Georgia, serif';
  const FONT_H = 'Caveat, "Segoe Print", cursive';
  const DIRW = { r: 0, d: Math.PI / 2, l: Math.PI, u: -Math.PI / 2 };
  const SPIEGEL_DIR = { r: "l", l: "r", u: "u", d: "d" };

  /* Wachen: Sichtweite (Felder), halber Sichtwinkel, Tempo, Jagdtempo, Sicht im Dunkeln */
  const WTYP = {
    rotmantel: { sicht: 4.2, halb: 0.6, tempo: 1.25, jagd: 2.25, dunkel: 1.6, r: 0.34, mantel: "#7e241d", kopf: "#c49a74", haube: "#5a1914" },
    rotrobe:   { sicht: 4.0, halb: 0.6, tempo: 1.2, jagd: 2.2, dunkel: 1.6, r: 0.34, mantel: "#9b231b", kopf: "#c49a74", haube: "#9b231b", spitz: true },
    goblin:    { sicht: 3.3, halb: 0.75, tempo: 1.5, jagd: 2.55, dunkel: 1.4, r: 0.27, mantel: "#5a4430", kopf: "#7c8f3e", fackel: true, ohren: true },
    bugbear:   { sicht: 5.0, halb: 0.5, tempo: 0.9, jagd: 1.9, dunkel: 1.8, r: 0.44, mantel: "#7a5530", kopf: "#a8783e", gross: true },
    duergar:   { sicht: 4.7, halb: 0.58, tempo: 1.15, jagd: 2.15, dunkel: 2.0, r: 0.33, mantel: "#5c5754", kopf: "#8c8580", bart: true },
    drow:      { sicht: 4.4, halb: 0.6, tempo: 1.3, jagd: 2.35, dunkel: 3.2, r: 0.32, mantel: "#2c2238", kopf: "#4a4160", haar: "#ece8f4" },
    magier:    { sicht: 3.6, halb: 0.6, tempo: 0.95, jagd: 2.0, dunkel: 1.8, r: 0.33, mantel: "#3b3a6e", kopf: "#c49a74", haube: "#2c2b5a", spitz: true, auge: true },
    hauptmann: { sicht: 4.6, halb: 0.62, tempo: 1.2, jagd: 2.3, dunkel: 1.8, r: 0.37, mantel: "#5a1914", kopf: "#c49a74", haube: "#e0a046", hauptmann: true },
    ilvara:    { sicht: 4.8, halb: 0.65, tempo: 1.45, jagd: 2.5, dunkel: 3.4, r: 0.34, mantel: "#2a5a3a", kopf: "#4a4160", haar: "#ece8f4", auge: true, hauptmann: true },
    hund:      { sicht: 2.8, halb: 0.9, tempo: 1.7, jagd: 3.0, dunkel: 2.2, r: 0.27, mantel: "#7a5e44", kopf: "#8e6e50", hund: true, nase: 1.75 },
    geist:     { sicht: 4.1, halb: 0.7, tempo: 1.5, jagd: 2.6, dunkel: 2.6, r: 0.3, mantel: "#4c4d54", kopf: "#8a8b92", haube: "#3a3b41" },
    feuerpriester: { sicht: 4.3, halb: 0.6, tempo: 1.1, jagd: 2.15, dunkel: 2.0, r: 0.34, mantel: "#a3261a", kopf: "#8c8580", haube: "#c2331f", spitz: true, bart: true, fackel: true },
    wirt:      { sicht: 2.8, halb: 0.85, tempo: 0, jagd: 0, dunkel: 1.3, r: 0.33, mantel: "#cfc4ad", kopf: "#c99c78", ruft: true, schuerze: true }
  };
  const STUFEN = {
    lehrling: { sicht: 0.85, tempo: 0.85, rate: 0.7, leben: 5, schloss: 1.25 },
    schurke:  { sicht: 1, tempo: 1, rate: 1, leben: 3, schloss: 1 },
    legende:  { sicht: 1.12, tempo: 1.12, rate: 1.3, leben: 2, schloss: 0.85 }
  };
  let stufeWahl = STUFEN[lies("imres-diebesnacht-stufe", "")] ? lies("imres-diebesnacht-stufe", "") : "schurke";
  let nachtWahl = 1;
  /* Neue Nächte: einfach drei weitere Karten an LEVELS anhängen (n = neue Nachtnummer) und in TX
     „naechte“ und „lv“ Namen und Tipps ergänzen. Nachtauswahl, Sterne und Freischalten passen sich an. */
  const NAECHTE = () => Math.floor(LEVELS.length / 3);
  const freiNaechte = () => Math.max(1, Math.min(NAECHTE(), parseInt(lies("imres-diebesnacht-nacht", "1"), 10) || 1));
  const sterneLesen = () => { try { const v = JSON.parse(localStorage.getItem("imres-diebesnacht-sterne") || "[]"); return Array.isArray(v) ? v : []; } catch (_) { return []; } };
  const neznaLesen = () => parseInt(lies("imres-diebesnacht-nezna", "0"), 10) || 0;
  const bits = n => (n & 1) + (n >> 1 & 1) + (n >> 2 & 1);

  const BED = ["vollmond", "gewitter", "fest", "wachsam", "nebel"];
  const WAREN = { rauch: 700, maske: 800, seil: 1200, dietrich: 400, beutel: 600, herz: 1000, gabe: 900 };
  const WARE_SYM = { rauch: "🌫️", maske: "🎭", seil: "🪝", dietrich: "🗝️", beutel: "👝", herz: "❤️", gabe: "🎒" };
  const SKINS = {
    scharlach: { u0: "#6b1c16", u1: "#2e0d0a", k: "#7a2018", a: "#ff6a3a", preis: 0 },
    robe: { u0: "#a3231c", u1: "#5a1410", k: "#b8302a", a: "#ffb03a", preis: 500 },
    schatten: { u0: "#2e2440", u1: "#0e0a16", k: "#3c2e52", a: "#c79bff", preis: 900 },
    sonne: { u0: "#8a6a24", u1: "#3a2a0c", k: "#b08a36", a: "#fff3b0", preis: 1600, glanz: true }
  };
  const BRIEFE_ENDLOS = ["e1", "e2", "e3", "e4"];
  const versteckLesen = () => { try { const v = JSON.parse(localStorage.getItem("imres-diebesnacht-versteck") || "{}") || {}; return { gold: v.gold || 0, kauf: v.kauf || {}, skin: SKINS[v.skin] ? v.skin : "scharlach", briefe: Array.isArray(v.briefe) ? v.briefe : [] }; } catch (_) { return { gold: 0, kauf: {}, skin: "scharlach", briefe: [] }; } };
  const versteckSchreiben = v => { try { localStorage.setItem("imres-diebesnacht-versteck", JSON.stringify(v)); } catch (_) {} };
  let VS = versteckLesen();
  const hat = k => !!VS.kauf[k];
  const ware = k => hat(k) && !(S && S.taeglich); // gekaufte Ware im Spiel – nicht in der Täglichen Nacht
  const heute = () => { const d = new Date(); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); };
  const datumKurz = d => d.slice(8, 10) + "." + d.slice(5, 7) + ".";
  const GABEN = { umhang: 2, sohlen: 2, finger: 2, muenze: 3, klinge: 1, schritt: 1, ranken: 2, sinne: 1, lied: 1, blutdurst: 1, rast: 99 };
  const GABE_SYM = { umhang: "🌑", sohlen: "👣", finger: "✋", muenze: "🪙", klinge: "🗡️", schritt: "💨", ranken: "🌿", sinne: "👁️", lied: "🎶", blutdurst: "🩸", rast: "🧪" };

  /* ---------- Karten ----------
     #  Wand          .  Boden        S  Start        A  Ausgang (öffnet sich, sobald das Ziel erfüllt ist)
     =  Tresen/Stein  o  Tisch/Bank   O  Fass (Versteck)              c  Kerze (auspustbar)
     L  Laterne       F  Feuer/Esse   K  Truhe        X  Schwert      $  Gold     R  rote Robe
     ~  knarrt        w  Spinnweben   D  Drache
     Gäste sitzen (Feld gesperrt) oder wandern; Wachen laufen ihren Weg im Kreis ab. */
  const LEVELS = [
    { n: 1, boden: "holz", ziel: "schluessel", schluesselZeigen: true,
      karte: ["############", "#F...c....L#", "#.......=..#", "#.o..o..=..#", "#.......=..#", "#O......=..#", "#..o..o....#", "#..........#", "#c.........#", "#...o..o..O#", "#..........#", "#..........#", "#S..O......A", "############"],
      wachen: [{ typ: "rotmantel", weg: [[9, 7], [9, 10], [2, 10], [2, 7]] }, { typ: "wirt", weg: [[9, 3]], blicke: ["l"] }],
      gaeste: [{ x: 2, y: 4, dir: "u", gold: 12 }, { x: 6, y: 3, dir: "l", gold: 15, key: true }, { x: 3, y: 7, dir: "u", gold: 10 }, { x: 6, y: 5, dir: "d", gold: 14 }, { x: 5, y: 9, dir: "l", gold: 9 }, { x: 7, y: 10, dir: "u", gold: 11 }, { x: 10, y: 6, gold: 20, wandert: true }],
      freunde: { friedrich: [7, 4, "r"], rex: [7, 6], barradin: [1, 10, "r"] } },
    { n: 1, boden: "stein", ziel: "frei",
      karte: ["############", "#S..O.#$..O#", "#.....#....#", "#..c..#.c..#", "#.....#....#", "##.####.####", "#.........O#", "#O...L.....#", "#..........#", "####.##.####", "#$...O#..c.#", "#..c..#....#", "#....K#...O#", "########A###"],
      wachen: [{ typ: "rotmantel", weg: [[9, 8], [1, 8], [1, 6], [9, 6]] }, { typ: "rotmantel", weg: [[8, 11]], blicke: ["u", "l", "d"] }, { typ: "rotmantel", weg: [[10, 4], [7, 4], [7, 2], [10, 2]] }],
      truhe: { gold: 40, pins: 3 }, nezna: "katze" },
    { n: 1, boden: "holz", ziel: "truhe",
      karte: ["############", "#O..c.#...K#", "#.....#....#", "#.o...#c...#", "#.....###.##", "#..........#", "###.##..O..#", "#O...#.....#", "#....#.L...#", "#.c..#...o.#", "#....#.....#", "#..........#", "#S...O...c.A", "############"],
      wachen: [{ typ: "rotmantel", weg: [[10, 5], [1, 5]] }, { typ: "rotmantel", weg: [[10, 11], [6, 11], [6, 7], [10, 7]] }, { typ: "rotmantel", weg: [[8, 2]], blicke: ["d", "l", "r"] }],
      gaeste: [{ x: 1, y: 3, dir: "r", gold: 18, typ: "rotmantel" }, { x: 3, y: 3, dir: "l", gold: 22, typ: "rotmantel" }, { x: 2, y: 2, dir: "d", gold: 15, typ: "rotmantel" }, { x: 2, y: 4, dir: "u", gold: 13, typ: "rotmantel" }],
      truhe: { gold: 80, pins: 4, ziel: true }, boss: { x: 9, y: 3, dir: "u" } },
    { n: 2, boden: "stein", ziel: "schluessel",
      karte: ["############", "#R...#..c..#", "#....#.o.o.#", "#.O..#.....#", "#....#.o.o.#", "##.###.....#", "#.....c....#", "#..........#", "#O...###.###", "#....#.....#", "#.c..#..O..#", "#....#.....A", "#S...#.....#", "############"],
      wachen: [{ typ: "rotrobe", weg: [[10, 7], [1, 7]] }, { typ: "rotrobe", weg: [[10, 12], [6, 12], [6, 9], [10, 9]] }, { typ: "rotrobe", weg: [[10, 1]], blicke: ["d", "l"] }],
      gaeste: [{ x: 6, y: 2, dir: "r", gold: 14, typ: "rotrobe", betrunken: true }, { x: 7, y: 3, dir: "u", gold: 16, typ: "rotrobe", betrunken: true }, { x: 8, y: 4, dir: "r", gold: 18, typ: "rotrobe", betrunken: true }, { x: 10, y: 2, dir: "l", gold: 12, typ: "rotrobe", betrunken: true, key: true }], nezna: "katze" },
    { n: 2, boden: "stein", ziel: "frei",
      karte: ["############", "#S.#......$#", "#..#.c.....#", "#.O#..##.O.#", "#..#..##...#", "#..........#", "##.##..##.##", "#.....L....#", "#.O........#", "##.##..##.##", "#..........#", "#.c..##..O.#", "#$...##....A", "############"],
      wachen: [{ typ: "rotrobe", weg: [[10, 5], [1, 5]] }, { typ: "rotrobe", weg: [[10, 8], [1, 8], [1, 7], [10, 7]] }, { typ: "hauptmann", weg: [[1, 10], [10, 10]] }, { typ: "rotrobe", weg: [[8, 2]], blicke: ["l", "d", "r"] }] },
    { n: 2, boden: "stein", ziel: "truhe",
      karte: ["############", "#..c.=K=.c.#", "#..........#", "#.o.o..o.o.#", "#..........#", "#.o.o..o.o.#", "#..........#", "#O........O#", "####.##.####", "#R...#.....#", "#..c.#..L..#", "#....#.....#", "#S.........A", "############"],
      wachen: [{ typ: "rotrobe", weg: [[10, 6], [1, 6], [1, 4], [10, 4]] }, { typ: "magier", weg: [[2, 2]], blicke: ["r", "d"] }, { typ: "rotrobe", weg: [[10, 9], [6, 9], [6, 11], [10, 11]] }],
      gaeste: [{ x: 3, y: 4, dir: "u", gold: 15, typ: "rotrobe", betet: true }, { x: 8, y: 4, dir: "u", gold: 18, typ: "rotrobe", betet: true }, { x: 3, y: 6, dir: "u", gold: 14, typ: "rotrobe", betet: true }, { x: 8, y: 6, dir: "u", gold: 20, typ: "rotrobe", betet: true }],
      truhe: { gold: 90, pins: 4, ziel: true } },
    { n: 3, boden: "stein", ziel: "frei",
      karte: ["############", "#S..~~...O.#", "#...~~.....#", "#.###..###.#", "#.#.....c#.#", "#.#.~~~..#.#", "#...~O~....#", "#.#.~~~..#.#", "#.#......#.#", "#.###..###.#", "#.....$....#", "#O...~~...O#", "#....~~....#", "#####A######"],
      wachen: [{ typ: "goblin", weg: [[10, 2], [10, 12]] }, { typ: "goblin", weg: [[8, 8], [3, 8], [3, 4], [7, 4]] }, { typ: "goblin", weg: [[9, 12], [1, 12]] }, { typ: "hund", weg: [[1, 10], [1, 4]] }] },
    { n: 3, boden: "holz", ziel: "schluessel",
      karte: ["############", "#.c..#..O..#", "#....#.....#", "#.o.......c#", "#....#.....#", "##.###~~####", "#.....~~...#", "#O.........#", "#...L...O..#", "###.####.###", "#.....#....#", "#.~~..#..$.#", "#S....#....A", "############"],
      wachen: [{ typ: "goblin", weg: [[10, 6], [10, 8], [1, 8], [1, 6]] }, { typ: "goblin", weg: [[9, 10]], blicke: ["l", "d", "r"] }],
      gaeste: [{ x: 1, y: 3, dir: "r", gold: 8, typ: "goblin" }, { x: 3, y: 3, dir: "l", gold: 9, typ: "goblin" }, { x: 2, y: 4, dir: "u", gold: 7, typ: "goblin" }, { x: 8, y: 3, dir: "d", gold: 30, typ: "bugbear", schlaeft: true, key: true }], nezna: "katze" },
    { n: 3, boden: "fels", ziel: "truhe",
      karte: ["############", "#$...c....$#", "#..........#", "#...##.....#", "#..........#", "#.$........#", "#......K...#", "#....DD..$.#", "#....DD....#", "#..........#", "#O..$...O..#", "##.####.####", "#S.........A", "############"],
      wachen: [{ typ: "goblin", weg: [[10, 2], [1, 2], [1, 9], [10, 9]] }],
      drache: true, truhe: { gold: 120, pins: 5, ziel: true } },
    { n: 4, boden: "schmiede", ziel: "schluessel",
      karte: ["############", "#F..c...=..#", "#.......=..#", "#.o..o..=..#", "#..........#", "#O.o..o...O#", "#..........#", "###.####.###", "#....#.....#", "#.c..#..o..#", "#....#.....#", "#O.......~~#", "#S...#..~~.A", "############"],
      wachen: [{ typ: "duergar", weg: [[10, 6], [4, 6], [4, 4], [10, 4]] }, { typ: "hauptmann", weg: [[10, 8], [6, 8], [6, 11], [10, 11]] }, { typ: "wirt", weg: [[9, 2]], blicke: ["l"] }],
      gaeste: [{ x: 2, y: 4, dir: "u", gold: 14, typ: "duergar" }, { x: 6, y: 3, dir: "l", gold: 16 }, { x: 7, y: 5, dir: "l", gold: 15, typ: "duergar", key: true }, { x: 3, y: 6, dir: "u", gold: 12 }, { x: 8, y: 10, dir: "u", gold: 18, typ: "duergar" }, { x: 9, y: 6, gold: 22, wandert: true, typ: "duergar" }], nezna: "katze" },
    { n: 4, boden: "schmiede", ziel: "frei",
      karte: ["############", "#S...#F#...#", "#....#.#.O.#", "#.O..~~~...#", "#....#.#...#", "###.##.###.#", "#~~.....L..#", "#~~..F.....#", "#......~~..#", "#.###.##.###", "#...#..$...#", "#.O.#.F..O.#", "#.....~~...#", "##########A#"],
      wachen: [{ typ: "duergar", weg: [[10, 4], [8, 4], [8, 1], [10, 1]] }, { typ: "duergar", weg: [[10, 8], [1, 8], [3, 6], [10, 6]] }, { typ: "duergar", weg: [[10, 12], [1, 12]] }, { typ: "magier", weg: [[8, 10]], blicke: ["l", "d", "r"] }, { typ: "hund", weg: [[3, 10], [1, 12]] }] },
    { n: 4, boden: "schmiede", ziel: "truhe",
      karte: ["############", "#....F.F...#", "#..........#", "#.O..===...#", "#....=K=..O#", "#..........#", "#.c......c.#", "##.##..##.##", "#....~~....#", "#.O..~~..O.#", "#..........#", "###.####.###", "#S.........A", "############"],
      wachen: [{ typ: "duergar", weg: [[1, 2], [10, 2], [10, 5], [1, 5]] }, { typ: "magier", weg: [[4, 6]], blicke: ["r", "u", "l"] }, { typ: "duergar", weg: [[10, 10], [1, 10], [1, 8], [10, 8]] }],
      truhe: { gold: 150, pins: 5, runen: true, ziel: true }, nezna: "drow" },
    { n: 5, boden: "unterreich", ziel: "schluessel",
      karte: ["############", "#.O#.....$.#", "#S.#.c.....#", "#..#..###..#", "#........o.#", "#..#.......#", "##.####.####", "#..........#", "#.#.#.#.#.##", "#..........#", "####.##.####", "#....#....O#", "#.c..#.L...A", "############"],
      wachen: [{ typ: "drow", weg: [[10, 1], [10, 3], [4, 5], [4, 1]] }, { typ: "drow", weg: [[10, 9], [1, 9], [1, 7], [10, 7]] }, { typ: "drow", weg: [[8, 11]], blicke: ["l", "r", "u"] }, { typ: "hund", weg: [[1, 11], [4, 12]] }],
      gaeste: [{ x: 9, y: 5, dir: "u", gold: 20, typ: "drow", key: true }], nezna: "katze" },
    { n: 5, boden: "unterreich", ziel: "frei",
      karte: ["############", "#S..w....O.#", "#...ww.....#", "#.##.w##.c.#", "#..w....w..#", "#O.www.....#", "##..w.####.#", "#....w...$.#", "#.w.....ww.#", "#.##.c.##..#", "#....w.....#", "#.ww....w.O#", "#$....ww...A", "############"],
      wachen: [{ typ: "drow", weg: [[10, 5], [6, 4], [6, 1], [10, 1]] }, { typ: "drow", weg: [[10, 10], [1, 10], [1, 7], [8, 7]] }, { typ: "magier", weg: [[10, 12], [2, 12]] }] },
    { n: 5, boden: "unterreich", ziel: "schwert",
      karte: ["############", "#.c.#.X.#.c#", "#...#...#..#", "#O..##.##..#", "#..........#", "#.==....==.#", "#..........#", "#.==.L..==.#", "#..........#", "##.##..##.##", "#O...c....O#", "#..........#", "#S.........A", "############"],
      wachen: [{ typ: "drow", weg: [[10, 8], [1, 8], [1, 4], [10, 4]] }, { typ: "drow", weg: [[6, 4]], blicke: ["d", "l", "r"] }, { typ: "drow", weg: [[9, 11], [2, 11]] }, { typ: "hund", weg: [[1, 6], [10, 6]] }],
      truhe: { gold: 200, pins: 6, runen: true, ziel: true, schwert: true }, flucht: ["ilvara"] },
    /* Nacht 6 – später in Gracklstugh: das gestohlene Drachenei */
    { n: 6, boden: "schmiede", ziel: "schluessel",
      karte: ["############", "#F..==..==F#", "#..........#", "#.o.=..=.o.#", "#...=..=...#", "#O........O#", "##.==..==.##", "#..........#", "#.L..oo..c.#", "#..........#", "#O.==..==.O#", "#..........#", "#S...~~....A", "############"],
      wachen: [{ typ: "duergar", weg: [[10, 11], [1, 11]] }, { typ: "duergar", weg: [[1, 2], [10, 2], [10, 4], [8, 4]] }, { typ: "duergar", weg: [[5, 6]], blicke: ["u", "d"] }],
      gaeste: [{ x: 3, y: 2, dir: "d", gold: 16, typ: "duergar" }, { x: 6, y: 3, dir: "l", gold: 18 }, { x: 8, y: 7, dir: "u", gold: 15, typ: "duergar" }, { x: 4, y: 9, dir: "u", gold: 14 }, { x: 7, y: 9, dir: "u", gold: 17, typ: "duergar" }, { x: 9, y: 9, dir: "l", gold: 24, typ: "geist", key: true }, { x: 5, y: 7, gold: 20, wandert: true, typ: "duergar" }],
      freunde: { friedrich: [10, 3, "l"], rex: [9, 5], barradin: [1, 8, "r"] }, nezna: "katze" },
    { n: 6, boden: "fels", ziel: "truhe",
      karte: ["############", "#S..#..O..K#", "#...#......#", "#.O.~~.##..#", "#...#..#...#", "##.###.#.###", "#.....c....#", "#.O.~~...O.#", "#....##....#", "###.###.##.#", "#$..#.....~#", "#...~..O...#", "#O..#....$.A", "############"],
      wachen: [{ typ: "geist", weg: [[10, 6], [1, 6], [1, 8], [10, 8]] }, { typ: "geist", weg: [[5, 1], [5, 4]] }, { typ: "geist", weg: [[5, 11], [10, 11], [10, 10], [5, 10]] }, { typ: "hund", weg: [[2, 10], [3, 12]] }],
      truhe: { gold: 130, pins: 5, ziel: true }, boss: { x: 9, y: 3, dir: "l" } },
    { n: 6, boden: "lava", ziel: "truhe",
      karte: ["############", "#VV.c..c.VV#", "#V..$K.$..V#", "#....$$....#", "#V...DD...V#", "#V...DD...V#", "#...$..$...#", "#V........V#", "##VV.==.VV##", "#O........O#", "#.c..VV..c.#", "#....VV....#", "#S.........A", "############"],
      wachen: [{ typ: "feuerpriester", weg: [[1, 6], [10, 6]] }, { typ: "feuerpriester", weg: [[2, 9], [9, 9]] }, { typ: "feuerpriester", weg: [[9, 3]], blicke: ["l", "d"] }],
      drache: "themberchaud", truhe: { gold: 180, pins: 5, ziel: true } }
  ];

  function spiegeln(def) {
    const sx = x => COLS - 1 - x;
    const d = JSON.parse(JSON.stringify(def));
    d.karte = def.karte.map(r => r.split("").reverse().join(""));
    (d.wachen || []).forEach(w => { w.weg = w.weg.map(([x, y]) => [sx(x), y]); if (w.blicke) w.blicke = w.blicke.map(b => SPIEGEL_DIR[b]); });
    (d.gaeste || []).forEach(g => { g.x = sx(g.x); if (g.dir) g.dir = SPIEGEL_DIR[g.dir]; });
    if (d.boss) { d.boss.x = sx(d.boss.x); if (d.boss.dir) d.boss.dir = SPIEGEL_DIR[d.boss.dir]; }
    if (d.freunde) Object.keys(d.freunde).forEach(k => { const f = d.freunde[k]; f[0] = sx(f[0]); if (f[2]) f[2] = SPIEGEL_DIR[f[2]]; });
    return d;
  }

  /* ---------- Klang (eigene Synthese, keine Dateien) ---------- */
  let ac = null, rauschen = null, tonAn = lies("imres-diebesnacht-ton", "1") === "1";
  function audio() {
    if (!tonAn) return null;
    if (!ac) { try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (_) { return null; } }
    if (ac.state === "suspended") ac.resume();
    if (!rauschen) {
      rauschen = ac.createBuffer(1, ac.sampleRate * 1.5, ac.sampleRate);
      const d = rauschen.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = rnd() * 2 - 1;
    }
    return ac;
  }
  function huelle(a, ziel, start, spitze, dauer) {
    const g = a.createGain(); g.gain.setValueAtTime(0.0001, start);
    g.gain.exponentialRampToValueAtTime(spitze, start + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, start + dauer);
    g.connect(ziel); return g;
  }
  function ton(typ, f1, f2, dauer, laut, verz, filt) {
    const a = audio(); if (!a) return;
    const t0 = a.currentTime + (verz || 0);
    const o = a.createOscillator(); o.type = typ;
    o.frequency.setValueAtTime(f1, t0); o.frequency.exponentialRampToValueAtTime(f2, t0 + dauer);
    let ziel = huelle(a, a.destination, t0, laut, dauer);
    if (filt) { const b = a.createBiquadFilter(); b.type = filt[0]; b.frequency.value = filt[1]; b.Q.value = filt[2] || 1; b.connect(ziel); ziel = b; }
    o.connect(ziel); o.start(t0); o.stop(t0 + dauer + 0.05);
  }
  function knistern(dauer, laut, typ, freq, verz, q) {
    const a = audio(); if (!a) return;
    const t0 = a.currentTime + (verz || 0);
    const s = a.createBufferSource(); s.buffer = rauschen;
    const b = a.createBiquadFilter(); b.type = typ; b.frequency.value = freq; if (q) b.Q.value = q;
    s.connect(b); b.connect(huelle(a, a.destination, t0, laut, dauer));
    s.start(t0, rnd() * 0.5); s.stop(t0 + dauer + 0.05);
  }
  const KLANG = {
    klau: () => { [1568, 2093].forEach((f, i) => ton("sine", f, f * 0.99, 0.12, 0.07, i * 0.06)); knistern(0.06, 0.05, "highpass", 5000); },
    schluessel: () => [988, 1319, 1568, 1976].forEach((f, i) => ton("triangle", f, f, 0.12, 0.07, i * 0.06)),
    he: () => { ton("sawtooth", 330, 240, 0.22, 0.11, 0, ["bandpass", 900, 2]); },
    entdeckt: () => { ton("sawtooth", 220, 330, 0.28, 0.1, 0, ["lowpass", 1400, 1]); ton("square", 233, 349, 0.28, 0.05); },
    gefasst: () => { knistern(0.25, 0.25, "lowpass", 500); [262, 220, 175].forEach((f, i) => ton("triangle", f, f * 0.97, 0.3, 0.12, 0.1 + i * 0.18)); },
    puste: () => knistern(0.4, 0.09, "bandpass", 900, 0, 0.8),
    anzuenden: () => { knistern(0.18, 0.06, "highpass", 3000); ton("sine", 500, 700, 0.15, 0.03); },
    klick: () => { knistern(0.04, 0.12, "highpass", 4000); ton("triangle", 1900, 1500, 0.05, 0.06); },
    fehler: () => { ton("square", 150, 100, 0.2, 0.07); knistern(0.12, 0.1, "lowpass", 800); },
    auf: () => [392, 523, 659, 784].forEach((f, i) => ton("triangle", f, f, 0.2, 0.1, i * 0.08)),
    aus: () => { knistern(0.18, 0.2, "lowpass", 700); ton("sine", 130, 50, 0.25, 0.2); },
    knarr: () => ton("sawtooth", 190, 150, 0.28, 0.05, 0, ["bandpass", 420, 5]),
    klirr: () => [2100, 2640, 2350].forEach((f, i) => ton("sine", f, f, 0.08, 0.06, i * 0.07)),
    bellen: () => { ton("sawtooth", 560, 280, 0.09, 0.12, 0, ["bandpass", 900, 2]); ton("sawtooth", 600, 300, 0.1, 0.12, 0.15, ["bandpass", 900, 2]); },
    laute: () => [392, 494, 587, 784, 587].forEach((f, i) => ton("triangle", f, f * 0.995, 0.35, 0.05, i * 0.16)),
    bruellen: () => { knistern(1, 0.25, "lowpass", 320); ton("sawtooth", 80, 45, 1, 0.18, 0, ["lowpass", 400, 1]); },
    sieg: () => [523, 659, 784, 1046].forEach((f, i) => ton("triangle", f, f, 0.22, 0.1, i * 0.09)),
    gabe: () => [659, 784, 988, 1319].forEach((f, i) => ton("triangle", f, f, 0.16, 0.08, i * 0.08)),
    schwert: () => [523, 784, 1046, 1568, 2093].forEach((f, i) => ton("sine", f, f, 0.6, 0.06, i * 0.1)),
    schritt: () => { knistern(0.4, 0.12, "bandpass", 400, 0, 0.7); ton("sine", 880, 220, 0.35, 0.06); },
    ende: () => [392, 330, 262, 196].forEach((f, i) => ton("triangle", f, f * 0.98, 0.35, 0.12, i * 0.22)),
    glocke: () => [0, 0.55, 1.1].forEach(v => { ton("sine", 784, 780, 1.1, 0.09, v); ton("sine", 1568, 1560, 0.7, 0.04, v); ton("triangle", 392, 390, 1.2, 0.05, v); }),
    donner: () => { knistern(1.6, 0.28, "lowpass", 180, 0.15); knistern(0.5, 0.18, "lowpass", 600, 0.1); },
    auge: () => { ton("sine", 300, 900, 0.5, 0.06); ton("sine", 450, 1350, 0.5, 0.03, 0.05); },
    rauchbombe: () => { knistern(0.8, 0.2, "bandpass", 700, 0, 0.6); ton("sine", 200, 80, 0.3, 0.1); },
    papier: () => { knistern(0.25, 0.08, "highpass", 3000); knistern(0.2, 0.06, "highpass", 2000, 0.15); },
    /* Schritte auf lautem Boden (ganz leise, nur als Rückmeldung) */
    tritt: art => {
      if (art === "kies") knistern(0.07, 0.035, "highpass", 2400);
      else if (art === "muenzen") { ton("sine", 2300 + rnd() * 500, 2200, 0.05, 0.02); knistern(0.04, 0.02, "highpass", 4000); }
      else if (art === "pfuetze") knistern(0.12, 0.035, "bandpass", 1300, 0, 1.2);
      else knistern(0.05, 0.03, "bandpass", 420, 0, 1.4);
    },
    maske: () => { knistern(0.3, 0.08, "highpass", 1800); [523, 659, 523].forEach((f, i) => ton("triangle", f, f, 0.12, 0.05, 0.12 + i * 0.09)); },
    griffGut: () => [1319, 1760].forEach((f, i) => ton("sine", f, f, 0.1, 0.06, i * 0.05)),
    griffMeister: () => { [1319, 1568, 2093, 2637].forEach((f, i) => ton("triangle", f, f, 0.14, 0.06, i * 0.05)); knistern(0.08, 0.05, "highpass", 5000, 0.15); },
    patzer: () => { ton("square", 320, 180, 0.16, 0.06); knistern(0.1, 0.08, "lowpass", 900); }
  };

  /* ---------- Spielzustand ---------- */
  let zustand = "start"; // start | intro | spiel | wahl | pause | gefasst | erwischt | ende
  let S = null, E = null, K = null;

  function neuesSpiel(stufeFest) {
    /* Feste Stufe = Tägliche Nacht: für alle gleich, gekaufte Waren zählen dort nicht */
    const stufe = stufeFest || stufeWahl, st = STUFEN[stufe], leben = st.leben + (hat("herz") && !stufeFest ? 1 : 0);
    const mitGabe = hat("gabe") && !stufeFest;
    S = {
      stufe, maxLeben: leben, leben, punkte: 0, aufsehen: 0, auftraege: 0, taeglich: null,
      klau: 0, aus: 0, geist: 0, meister: 0, erreicht: 0, startNacht: nachtWahl, zorn: 0, zornT: 0, sterneRun: 0, neznaRun: 0,
      gaben: { umhang: 0, sohlen: 0, finger: 0, muenze: 0, klinge: 0, schritt: 0, ranken: 0, sinne: 0, lied: 0, blutdurst: 0, rast: 0 },
      texte: [], teilchen: [], wachen: [], gaeste: [], kerzen: [], lichter: []
    };
    if (mitGabe) gabeZufall();
  }
  function gabeZufall() {
    const m = Object.keys(GABEN).filter(k => k !== "rast" && S.gaben[k] < GABEN[k]);
    if (m.length) S.gaben[zufall(m)]++;
  }

  const zeichen = (x, y) => (x < 0 || y < 0 || x >= COLS || y >= ROWS) ? "#" : K[y][x];
  const istWand = z => z === "#" || z === "A";
  function begehbar(x, y, wache) {
    const z = zeichen(x, y);
    if (!wache && (z === "o" || z === "=") && S.seil) return !S.belegt[y * COLS + x];
    if ("#=ocLFKXDV".indexOf(z) >= 0) return false; // V = Lava
    if (z === "A") return !wache && S.offen;
    if (wache && z === "O") return false;
    if (S.belegt[y * COLS + x]) return false;
    return true;
  }
  function sichtFrei(x1, y1, x2, y2) {
    const d = Math.hypot(x2 - x1, y2 - y1), n = Math.ceil(d / 0.17);
    for (let i = 1; i < n; i++) {
      const k = i / n;
      if (istWand(zeichen(Math.floor(x1 + (x2 - x1) * k), Math.floor(y1 + (y2 - y1) * k)))) return false;
    }
    return true;
  }
  const NACHBARN = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];
  function pfadSuchen(sx, sy, istZiel, wache) {
    const N = COLS * ROWS, vor = new Int16Array(N).fill(-2), start = sx + sy * COLS, q = [start];
    vor[start] = -1;
    for (let qi = 0; qi < q.length; qi++) {
      const i = q[qi], x = i % COLS, y = (i / COLS) | 0;
      if (istZiel(x, y)) {
        const p = []; let j = i;
        while (j !== start) { p.unshift({ x: j % COLS, y: (j / COLS) | 0 }); j = vor[j]; }
        return p;
      }
      for (const [dx, dy] of NACHBARN) {
        const nx = x + dx, ny = y + dy, j = nx + ny * COLS;
        if (nx < 0 || ny < 0 || nx >= COLS || ny >= ROWS || vor[j] !== -2) continue;
        if (!begehbar(nx, ny, wache)) continue;
        if (dx && dy && (!begehbar(x + dx, y, wache) || !begehbar(x, y + dy, wache))) continue;
        vor[j] = i; q.push(j);
      }
    }
    return null;
  }
  const zelle = e => ({ x: Math.floor(e.x), y: Math.floor(e.y) });
  const aufZelle = (e, z) => Math.floor(e.x) === z.x && Math.floor(e.y) === z.y && Math.hypot(e.x - z.x - 0.5, e.y - z.y - 0.5) < 0.08;
  const cheb = (a, b) => Math.max(Math.abs(Math.floor(a.x) - Math.floor(b.x)), Math.abs(Math.floor(a.y) - Math.floor(b.y)));
  const abstand = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const winkelDiff = (a, b) => { let d = (b - a) % (Math.PI * 2); if (d > Math.PI) d -= Math.PI * 2; if (d < -Math.PI) d += Math.PI * 2; return d; };
  function drehen(e, ziel, max) { const d = winkelDiff(e.ang, ziel); e.ang += Math.max(-max, Math.min(max, d)); }
  function laufen(e, tempo, dt, betreten) {
    let rest = tempo * dt;
    while (rest > 0 && e.pfad.length) {
      const z = e.pfad[0], tx = z.x + 0.5, ty = z.y + 0.5, dx = tx - e.x, dy = ty - e.y, d = Math.hypot(dx, dy);
      if (d > 0.001) e.zielAng = Math.atan2(dy, dx);
      if (d <= rest) { e.x = tx; e.y = ty; rest -= d; e.pfad.shift(); if (betreten) betreten(z.x, z.y); }
      else { e.x += dx / d * rest; e.y += dy / d * rest; rest = 0; }
    }
  }
  const neben = z => (x, y) => Math.max(Math.abs(x - z.x), Math.abs(y - z.y)) <= 1 && sichtFrei(x + 0.5, y + 0.5, z.x + 0.5, z.y + 0.5);
  const genau = z => (x, y) => x === z.x && y === z.y;

  /* ---------- Stufe laden ---------- */
  function levelDef(idx) {
    if (idx < LEVELS.length) return Object.assign({}, LEVELS[idx], { basisIdx: idx });
    let r; do { r = Math.floor(rnd() * LEVELS.length); } while (S.def && r === S.def.basisIdx && LEVELS.length > 1);
    const d = rnd() < 0.5 ? spiegeln(LEVELS[r]) : JSON.parse(JSON.stringify(LEVELS[r]));
    d.basis = LEVELS[r]; d.basisIdx = r; d.schluesselZeigen = false;
    return d;
  }
  const endlosK = () => Math.max(0, S.lvIdx - LEVELS.length + 1);

  function stufeLaden(idx, def) {
    S.lvIdx = idx; S.def = def || levelDef(idx);
    const D = S.def, st = STUFEN[S.stufe], k = endlosK();
    K = D.karte.map(r => r.split(""));
    S.mod = { sicht: st.sicht * (1 + 0.035 * Math.min(k, 10)), tempo: st.tempo * (1 + 0.035 * Math.min(k, 10)), rate: st.rate * (1 + 0.05 * Math.min(k, 10)), schloss: st.schloss * (ware("dietrich") ? 1.25 : 1), dunkel: 1 };
    if (D.bed === undefined) D.bed = idx < 3 ? null : (rnd() < (k ? 0.75 : 0.4) ? zufall(BED) : null);
    S.bed = D.bed;
    if (S.bed === "vollmond") S.mod.dunkel = 1.55;
    if (S.bed === "nebel") { S.mod.sicht *= 0.72; S.mod.dunkel = 0.8; }
    if (S.bed === "wachsam") { S.mod.sicht *= 1.12; S.mod.rate *= 1.18; }
    S.goldF = (S.bed === "wachsam" ? 1.5 : 1) * (ware("beutel") ? 1.15 : 1);
    S.seil = ware("seil"); S.rauchN = ware("rauch") ? 1 : 0; S.wolke = null; S.maskeN = ware("maske") ? 1 : 0; S.maskeT = 0;
    S.alarm = false; S.alarmT = 0; S.relightT = 0; S.blitzT = 0; S.gew = S.bed === "gewitter" ? { t: 6 + rnd() * 4, leuchten: false } : null;
    S.pulse = []; S.boss = null; S.brief = null; S.lvJagd = false; S.spawnQ = []; S.alarmBald = 0; S.spielZeit = 0; S.banner = null;
    S.offen = D.ziel === "frei"; S.schluessel = false; S.belegt = new Uint8Array(COLS * ROWS);
    S.lvGold = 0; S.lvGesehen = false; S.lvAus = 0; S.lvKlau = 0;
    S.schrittFrei = S.gaben.schritt > 0; S.muenzen = S.gaben.muenze; S.zielModus = false; S.muenzFlug = null;
    S.schloss = null; S.texte = []; S.teilchen = []; S.marke = null; S.zeit = 0; S.beben = 0;
    S.griff = null; S.ringe = []; S.laerm = 0; S.laermArt = ""; S.lvMeister = 0; S.amb = []; S.tiere = []; S.rep = null; S.hinweise = null;
    S.kerzen = []; S.lichter = []; S.gold = {}; S.robe = null; S.truhe = null; S.drache = null; S.ausgang = null;
    let start = { x: 1, y: 1 };
    const dZellen = [];
    for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
      const z = K[y][x];
      if (z === "S") start = { x, y };
      else if (z === "c") { const kz = { x, y, an: true, r: 2.6, art: "kerze", wird: false, phase: rnd() * 6, vis: 1 }; S.kerzen.push(kz); S.lichter.push(kz); }
      else if (z === "L") S.lichter.push({ x, y, an: true, r: 2.9, art: "laterne", phase: rnd() * 6, vis: 1 });
      else if (z === "F") S.lichter.push({ x, y, an: true, r: 3.3, art: "feuer", phase: rnd() * 6, vis: 1 });
      else if (z === "V") S.lichter.push({ x, y, an: true, r: 1.5, art: "lava", phase: rnd() * 6, vis: 1 });
      else if (z === "$") S.gold[x + "," + y] = Math.round((12 + Math.floor(rnd() * 14) + (D.n - 1) * 4) * S.goldF);
      else if (z === "R") S.robe = { x, y };
      else if (z === "K" || z === "X") {
        S.truhe = Object.assign({ x, y, offen: false, gold: 30, pins: 3 }, D.truhe || {});
        S.truhe.gold = Math.round(S.truhe.gold * S.goldF);
        if (z === "X") S.lichter.push({ x, y, an: true, r: 1.7, art: "schwert", phase: 0, vis: 1 });
      }
      else if (z === "D") dZellen.push({ x, y });
      else if (z === "A") S.ausgang = { x, y };
    }
    if (dZellen.length) {
      const mx = Math.min(...dZellen.map(z => z.x)), my = Math.min(...dZellen.map(z => z.y));
      S.drache = { x: mx + 1, y: my + 1, ang: -Math.PI / 2 - 0.3, basis: -Math.PI / 2, wach: false, t: 5 + rnd() * 2, a: 0, sweep: 0, augeT: 0 };
    }
    S.start = start;
    E = { x: start.x + 0.5, y: start.y + 0.5, ang: -Math.PI / 2, zielAng: -Math.PI / 2, pfad: [], absicht: null, versteckt: false, verkleidet: false, glut: false, repfad: 0, ruhe: 0, arbeit: null };
    // Gäste
    S.gaeste = (D.gaeste || []).map((g, i) => {
      const basis = g.dir ? DIRW[g.dir] : 0;
      const p = { x: g.x + 0.5, y: g.y + 0.5, ang: basis, basis, gold: Math.round((g.gold || 0) * S.goldF), key: !!g.key, typ: g.typ || "mensch", wandert: !!g.wandert, betrunken: !!g.betrunken, betet: !!g.betet, schlaeft: !!g.schlaeft,
        pfad: [], pause: 1 + rnd() * 2, blickT: 2 + rnd() * 4, blickAng: null, trinkT: 3 + rnd() * 5, trinkt: 0, wachsam: 0, abgelenkt: false,
        schlafT: 6 + rnd() * 3, wach: 0, a: 0, idx: i, farbe: GAST_FARBEN[(i * 3 + D.n) % GAST_FARBEN.length], haut: HAUT[(i * 5 + D.n) % HAUT.length], hut: (i + D.n) % 3 === 0 };
      if (!p.wandert) S.belegt[g.y * COLS + g.x] = 1;
      return p;
    });
    // Freunde
    S.freunde = {};
    if (D.freunde) Object.keys(D.freunde).forEach(n => {
      const f = D.freunde[n];
      S.freunde[n] = { x: f[0] + 0.5, y: f[1] + 0.5, ang: f[2] ? DIRW[f[2]] : 0, name: n, cd: 0, gestreichelt: false, sprech: 0 };
      if (n !== "rex") S.belegt[f[1] * COLS + f[0]] = 1;
    });
    S.lied = S.freunde.barradin ? { an: false, t: 5 } : null;
    // Wachen
    S.wachen = (D.wachen || []).map(wacheBauen);
    S.zornT = 0;
    // Fest: zusätzliche Gäste
    if (S.bed === "fest") {
      const frei = freieFelder(start, 3);
      for (let i = 0; i < 3 && frei.length; i++) {
        const z = frei.splice(Math.floor(rnd() * frei.length), 1)[0];
        S.gaeste.push({ x: z.x + 0.5, y: z.y + 0.5, ang: 0, basis: 0, gold: Math.round((10 + Math.floor(rnd() * 12)) * S.goldF), key: false, typ: "mensch", wandert: true, betrunken: true, betet: false, schlaeft: false,
          pfad: [], pause: 1 + rnd() * 2, blickT: 2 + rnd() * 4, blickAng: null, trinkT: 2 + rnd() * 3, trinkt: 0, wachsam: 0, abgelenkt: false, schlafT: 0, wach: 0, a: 0, idx: 10 + i,
          farbe: GAST_FARBEN[(i * 5 + 3) % GAST_FARBEN.length], haut: HAUT[(i * 3 + 1) % HAUT.length], hut: i % 2 === 0 });
      }
    }
    // Boss (Glasstab)
    if (D.boss) S.boss = { name: D.n === 6 ? "drokey" : "glasstab", x: D.boss.x + 0.5, y: D.boss.y + 0.5, ang: DIRW[D.boss.dir || "u"], basis: DIRW[D.boss.dir || "u"], zustand: "wartet", pfad: [], a: 0, t: 0, gefangen: false, entkommen: false, zielAng: 0 };
    neznaSetzen();
    auftragSetzen();
    dekoBauen();
    lichtPolygone();
    hintergrundBauen();
    lichtBerechnen();
    spurStart();
    muenzKnopfSetzen(); zornKnopfSetzen(); rauchKnopfSetzen(); maskeKnopfSetzen();
    if (!S.taeglich) zugSpeichern(false);
  }

  const VARIANTE = { 4: { mantel: "#4a4644", kopf: "#8c8580", bart: true, dunkel: 2.0 }, 5: { mantel: "#2c2238", kopf: "#4a4160", haar: "#ece8f4", dunkel: 3.2 } };
  function wacheBauen(w) {
    const weg = w.weg.map(([x, y]) => ({ x, y }));
    const blicke = (w.blicke || []).map(b => DIRW[b]);
    let T = WTYP[w.typ];
    if ((w.typ === "magier" || w.typ === "hauptmann") && S.def && VARIANTE[S.def.n]) T = Object.assign({}, T, VARIANTE[S.def.n]);
    const g = { typ: w.typ, T, weg, wi: weg.length > 1 ? 1 : 0, x: weg[0].x + 0.5, y: weg[0].y + 0.5, ang: 0, zielAng: 0, blicke, bi: 0,
      zustand: "patrouille", a: 0, t: 2.2, pfad: [], zuletzt: null, blind: 9, cd: 0, repfad: 0, ziel: null, sieht: false, aT: 0, dreh: rnd() < 0.5 ? 1 : -1, augeT: 5 + rnd() * 3 };
    if (blicke.length) g.ang = blicke[0];
    else if (weg.length > 1) g.ang = Math.atan2(weg[1].y - weg[0].y, weg[1].x - weg[0].x);
    g.zielAng = g.ang;
    return g;
  }
  function freieFelder(von, minAbstand) {
    const l = [];
    pfadSuchen(von.x, von.y, (x, y) => {
      const z = zeichen(x, y);
      if (z === "." && Math.hypot(x - von.x, y - von.y) >= minAbstand && !S.gaeste.some(p => Math.floor(p.x) === x && Math.floor(p.y) === y) && !S.wachen.some(g => g.weg.some(w => w.x === x && w.y === y))) l.push({ x, y });
      return false;
    }, true);
    return l;
  }
  function briefId() {
    if (endlosK() || S.taeglich) { const offen = BRIEFE_ENDLOS.filter(b => VS.briefe.indexOf(b) < 0); return zufall(offen.length ? offen : BRIEFE_ENDLOS); }
    return "n" + S.def.n;
  }
  function auftragSetzen() {
    const D = S.def;
    if (D.auftrag === undefined) {
      const w = [];
      if (S.boss) w.push(["glasstab", 99]);
      else {
        /* Tägliche Nacht: feste Gewichte, sonst bekäme jeder je nach eigenen Briefen einen anderen Auftrag */
        const briefNeu = !S.taeglich && VS.briefe.indexOf(endlosK() ? "x" : "n" + D.n) < 0;
        w.push(["brief", S.taeglich ? 2 : briefNeu ? 4 : 1], ["zeit", 2], ["keinAlarm", 2]);
        if (S.kerzen.length >= 2) w.push(["kerzen", 2]);
        if (S.nezna) w.push(["nezna", 3]);
      }
      const summe = w.reduce((a, b) => a + b[1], 0); let x = rnd() * summe;
      D.auftrag = w.find(e => (x -= e[1]) < 0)[0];
    }
    const typ = D.auftrag;
    S.auftrag = { typ, ok: false, fehl: false, limit: 0 };
    if (typ === "zeit") {
      const ziel = S.truhe ? { x: S.truhe.x, y: S.truhe.y } : null;
      const offen = S.offen; S.offen = true;
      const a = (S.ausgang && pfadSuchen(S.start.x, S.start.y, genau(S.ausgang), false) || []).length;
      const b = ziel ? (pfadSuchen(S.start.x, S.start.y, neben(ziel), false) || []).length * 2 : 0;
      S.offen = offen;
      S.auftrag.limit = Math.round((a + b) * 1.15 + 22 + (S.stufe === "lehrling" ? 12 : S.stufe === "legende" ? -4 : 0) + (D.ziel === "schluessel" ? 14 : 0));
    }
    if (typ === "brief") {
      if (D.briefPos === undefined) { const f = freieFelder(S.start, 5).filter(z => !(S.ausgang && Math.abs(z.x - S.ausgang.x) + Math.abs(z.y - S.ausgang.y) < 2)); D.briefPos = f.length ? zufall(f) : null; D.briefId = briefId(); }
      if (D.briefPos) S.brief = { x: D.briefPos.x, y: D.briefPos.y, id: D.briefId };
      else S.auftrag.typ = "keinAlarm";
    }
  }
  function auftragOk() {
    const A = S.auftrag; if (!A || A.ok || A.fehl) return;
    A.ok = true; textAuf(E.x, E.y - 1.3, t().auftragOk, "#ebe2cc", 19, 1.8); KLANG.gabe();
  }
  function auftragFehl() {
    const A = S.auftrag; if (!A || A.ok || A.fehl) return;
    A.fehl = true; textAuf(E.x, E.y - 1.3, t().auftragFehl, "#a89f8f", 16, 1.6);
  }

  const GAST_FARBEN = ["#6b4a30", "#3f5a6e", "#6e5a2c", "#4f3d5c", "#2f5240", "#7a5a3e", "#5c2e2a", "#4a4a3a"];
  const HAUT = ["#d9b08c", "#c49a74", "#a87a55", "#8a5e3c", "#e3c09c"];

  /* ---------- Licht ---------- */
  const LICHT = new Float32Array(COLS * ROWS);
  function aktiveLichter() {
    const l = S.lichter.filter(q => q.an && !(q.art === "schwert" && S.truhe && S.truhe.offen)).map(q => ({ x: q.x + 0.5, y: q.y + 0.5, r: q.r }));
    S.wachen.forEach(g => { if (g.T.fackel && g.zustand !== "aus") l.push({ x: g.x + Math.cos(g.ang) * 0.3, y: g.y + Math.sin(g.ang) * 0.3, r: 1.95 }); });
    if (E.glut) l.push({ x: E.x, y: E.y, r: 2.5 });
    if (S.zornT > 0) l.push({ x: E.x, y: E.y, r: 1.6 });
    return l;
  }
  function lichtBerechnen() {
    LICHT.fill(0);
    aktiveLichter().forEach(q => {
      const R = q.r, cx = Math.floor(q.x), cy = Math.floor(q.y), rr = Math.ceil(R);
      for (let y = cy - rr; y <= cy + rr; y++) for (let x = cx - rr; x <= cx + rr; x++) {
        if (x < 0 || y < 0 || x >= COLS || y >= ROWS) continue;
        const d = Math.hypot(x + 0.5 - q.x, y + 0.5 - q.y);
        if (d > R || istWand(zeichen(x, y))) continue;
        if (!sichtFrei(q.x, q.y, x + 0.5, y + 0.5)) continue;
        const v = Math.min(1, (1 - d / R) * 1.4), i = y * COLS + x;
        if (v > LICHT[i]) LICHT[i] = v;
      }
    });
    if (S.mond && S.mond.m > 0) S.mond.zellen.forEach(z => { const i = z.y * COLS + z.x, v = 0.45 * S.mond.m; if (v > LICHT[i]) LICHT[i] = v; });
    if (S.blitzT > 0) LICHT.fill(1);
  }
  const lichtBei = (x, y) => LICHT[Math.floor(y) * COLS + Math.floor(x)] || 0;

  /* ---------- Wahrnehmung ---------- */
  function sichtRate(g) {
    if (zustand !== "spiel" || g.zustand === "aus" || g.cd > 0) return 0;
    const T = g.T, dx = E.x - g.x, dy = E.y - g.y, d = Math.hypot(dx, dy);
    if (S.wolke && d > 1.0 && (Math.hypot(E.x - S.wolke.x, E.y - S.wolke.y) < 2.3 || Math.hypot(g.x - S.wolke.x, g.y - S.wolke.y) < 2.3)) return 0;
    const R = T.sicht * S.mod.sicht * (1 + S.aufsehen / 300);
    if (T.nase && d <= T.nase && sichtFrei(g.x, g.y, E.x, E.y)) { // riecht ihn – auch im Dunkeln und im Fass
      let rn = 0.95 * S.mod.rate * Math.pow(0.88, S.gaben.umhang);
      if (g.zustand === "jagd") rn *= 3;
      return rn;
    }
    if (d > R) return 0;
    if (d > 0.45 && Math.abs(winkelDiff(g.ang, Math.atan2(dy, dx))) > T.halb * (g.zustand === "jagd" ? 1.6 : 1)) return 0;
    if (E.versteckt && !(g.zustand === "jagd" && d < 1.5)) return 0;
    if (!sichtFrei(g.x, g.y, E.x, E.y)) return 0;
    const hell = lichtBei(E.x, E.y) >= 0.3 || E.glut;
    let rate;
    if (hell) rate = 1.45 * (1.3 - 0.9 * d / R);
    else { const dk = T.dunkel * S.mod.dunkel; if (d > dk) return 0; rate = 1.05 * (1.25 - 0.7 * d / dk); }
    if (E.verkleidet && d > 1.6) rate *= 0.2;
    rate *= S.mod.rate * Math.pow(0.76, S.gaben.umhang) * (1 + S.aufsehen / 170);
    if (g.zustand === "jagd") rate *= 3;
    /* Verkleidung: Die Wache sieht ihn – und hält ihn für einen Kollegen (nur Anrempeln fliegt auf) */
    if (S.maskeT > 0 && g.zustand !== "jagd" && d > 0.9) { g.getaeuscht = true; return 0; }
    return Math.max(0.05, rate);
  }
  function aufsehen(n) { S.aufsehen = Math.max(0, Math.min(100, S.aufsehen + n)); }
  function laerm(qx, qy, r, zx, zy, a0) {
    S.wachen.forEach(g => {
      if (g.zustand === "aus" || g.zustand === "jagd" || g.zustand === "flucht" || !g.T.tempo) return;
      if (S.boss && g === S.boss) return;
      if (Math.hypot(g.x - qx, g.y - qy) > r) return;
      g.zustand = "horchen"; g.ziel = { x: zx, y: zy }; g.pfad = []; g.t = 2.6; g.a = Math.max(g.a, a0 || 0.3);
      textAuf(g.x, g.y - 0.7, "?", "#e0a046", 22, 1);
    });
    S.gaeste.forEach(p => { if (p.schlaeft && !p.wach && Math.hypot(p.x - qx, p.y - qy) <= r) { p.wach = 3; p.schlafT = 0; } });
    if (S.drache && !S.drache.wach && Math.hypot(S.drache.x - qx, S.drache.y - qy) <= r + 0.5) { S.drache.wach = true; S.drache.t = 3.5; }
  }

  /* ---------- Schrittlärm ----------
     Jeder Schritt macht Lärm, je nach Boden (S.grund): Holz und Geröll laut, Teppich, Stroh und Moos leise.
     Wachen in Hörweite werden misstrauisch (Balken über dem Kopf); reicht es, drehen sie sich um und horchen. */
  const LAUT = { holz: 1, knarr: 1.25, gitter: 1.2, stein: 0.62, fels: 0.58, teppich: 0.2, stroh: 0.28, moos: 0.22, asche: 0.32, netz: 0.3, kies: 1.1, muenzen: 1.2, pfuetze: 1.05 };
  const SCHRITT_R = 2.3;
  const grundBei = (x, y) => (S.grund && S.grund[y * COLS + x]) || "stein";
  function schrittLaerm(x, y) {
    const art = grundBei(x, y), f = (LAUT[art] || 0.6) * Math.pow(0.85, S.gaben.sohlen) * (S.zornT > 0 ? 1.5 : 1);
    const r = SCHRITT_R * f, qx = x + 0.5, qy = y + 0.5;
    S.laerm = Math.max(S.laerm, f); S.laermArt = art;
    if (S.ringe.length < 8) S.ringe.push({ x: qx, y: qy, r, t: 0, f });
    if (f >= 0.9) KLANG.tritt(art);
    if (art === "knarr" || art === "gitter" || r < 0.8) return; // morsche Dielen und Gitter lösen ihren eigenen Lärm aus
    S.wachen.forEach(g => {
      if (!g.T.tempo || g.zustand === "aus" || g.zustand === "jagd" || g.zustand === "flucht") return;
      const d = Math.hypot(g.x - qx, g.y - qy); if (d > r) return;
      const k = (1 - d / r) * (sichtFrei(g.x, g.y, qx, qy) ? 1 : 0.5) * (g.T.hund ? 1.4 : 1);
      g.a = Math.min(0.9, g.a + 0.22 * k * S.mod.rate);
      if (g.zustand === "horchen") { g.ziel = { x: qx, y: qy }; g.t = Math.max(g.t, 2); return; }
      if (g.a >= 0.42 && g.zustand !== "suche" && g.zustand !== "verdacht") {
        if (g.zustand === "anzuenden" && g.kerze) g.kerze.wird = false;
        g.zustand = "horchen"; g.ziel = { x: qx, y: qy }; g.pfad = []; g.t = 2.2;
        textAuf(g.x, g.y - 0.75, zufall(t().lauschen), "#e0a046", 15, 1.3);
      }
    });
    S.gaeste.forEach(p => { if (p.schlaeft && !p.wach && Math.hypot(p.x - qx, p.y - qy) < r * 0.7) p.schlafT -= 1.2 * f; });
    const D = S.drache;
    if (D && !D.wach && Math.hypot(D.x - qx, D.y - qy) < r * 0.85 + 0.6) D.t = Math.min(D.t, 0.5 + rnd() * 0.5);
  }

  /* ---------- Teilchen & Texte ---------- */
  function textAuf(x, y, text, farbe, gr, dauer) { S.texte.push({ x, y, text, farbe, gr: gr || 18, t: 0, dauer: dauer || 1.2 }); }
  function funken(x, y, farben, n, tempo) {
    for (let i = 0; i < n; i++) {
      const a = rnd() * Math.PI * 2, v = (0.6 + rnd() * 1.6) * (tempo || 1);
      S.teilchen.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, leben: 0.5 + rnd() * 0.5, max: 1, farbe: zufall(farben), gr: 1.5 + rnd() * 2.5 });
    }
  }
  function rauch(x, y, n) { for (let i = 0; i < n; i++) { const a = rnd() * Math.PI * 2, v = 0.3 + rnd() * 0.9; S.teilchen.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 0.2, leben: 0.7 + rnd() * 0.6, max: 1.3, farbe: zufall(["rgba(40,34,46,.8)", "rgba(80,30,30,.7)", "rgba(20,16,24,.85)"]), gr: 5 + rnd() * 7, rund: true }); } }

  /* ---------- Ezekiel ---------- */
  function absichtZiel(a) {
    if (!a) return null;
    if (a.art === "klauen" || a.art === "aus" || a.art === "freund" || a.art === "nezna" || a.art === "boss" || a.art === "verbergen") return a.ref;
    return { x: a.ref.x + 0.5, y: a.ref.y + 0.5 };
  }
  function hintenOk(a, x, y) {
    if (!(a.art === "klauen" || a.art === "aus" || a.art === "nezna" || (a.art === "boss" && a.ref.zustand === "wartet"))) return true;
    const grenze = a.art === "klauen" ? [1.35, 0.95, 0.55][Math.min(2, S.gaben.finger)] : a.art === "nezna" ? 1.1 : 1.3;
    const blick = a.art === "klauen" && !a.ref.wandert && a.ref.basis !== undefined ? a.ref.basis : a.ref.ang;
    return Math.abs(winkelDiff(blick, Math.atan2(y + 0.5 - a.ref.y, x + 0.5 - a.ref.x))) > grenze;
  }
  function zuAbsicht() {
    const a = E.absicht, z = absichtZiel(a); if (!z) return false;
    const zz = zelle(z), n = neben(zz), sx = Math.floor(E.x), sy = Math.floor(E.y);
    let p = null;
    if (a.art === "klauen" || a.art === "aus" || a.art === "nezna" || (a.art === "boss" && a.ref.zustand === "wartet")) { // möglichst von hinten anschleichen
      const grenze = a.art === "klauen" ? [1.35, 0.95, 0.55][Math.min(2, S.gaben.finger)] : a.art === "nezna" ? 1.1 : 1.3;
      const blick = a.art === "klauen" && !a.ref.wandert && a.ref.basis !== undefined ? a.ref.basis : a.ref.ang;
      p = pfadSuchen(sx, sy, (x, y) => n(x, y) && Math.abs(winkelDiff(blick, Math.atan2(y + 0.5 - a.ref.y, x + 0.5 - a.ref.x))) > grenze, false);
    }
    if (!p) p = pfadSuchen(sx, sy, n, false);
    if (!p) return false;
    E.pfad = p; return true;
  }
  function tippen(p) {
    if (S.schloss) { schlossTippen(p); return; }
    if (S.griff) { griffTippen(); return; }
    if (E.arbeit) E.arbeit = null;
    if (E.lauer) E.lauer = null;
    if (p.y < OY || p.y >= FUSS_Y || p.x >= W) return;
    const gx = p.x / C, gy = (p.y - OY) / C, zx = Math.floor(gx), zy = Math.floor(gy);
    if (S.zielModus) { werfen(gx, gy); return; }
    // Figuren zuerst
    let best = null, bd = 0.62;
    const pruef = (e, art) => { const d = Math.hypot(e.x - gx, e.y - gy); if (d < bd) { bd = d; best = { art, ref: e }; } };
    S.gaeste.forEach(g => pruef(g, "klauen"));
    S.wachen.forEach(g => { if (g.zustand !== "aus") pruef(g, "aus"); });
    if (S.nezna && !S.nezna.gefangen) pruef(S.nezna, "nezna");
    if (S.boss && !S.boss.gefangen && !S.boss.entkommen) pruef(S.boss, "boss");
    if (!best) S.wachen.forEach(g => { if (g.zustand === "aus" && !g.zahm && !g.verborgen) pruef(g, "verbergen"); });
    Object.keys(S.freunde).forEach(n => pruef(S.freunde[n], "freund"));
    if (S.drache && Math.hypot(S.drache.x - gx, S.drache.y - gy) < 1.3) best = { art: "drache", ref: S.drache };
    if (!best) {
      const z = zeichen(zx, zy);
      const kz = S.kerzen.find(k => k.x === zx && k.y === zy);
      if (kz) best = { art: "kerze", ref: kz };
      else if ((z === "K" || z === "X") && S.truhe) best = { art: "truhe", ref: S.truhe };
    }
    S.marke = { x: zx + 0.5, y: zy + 0.5, t: 0 };
    if (best) {
      if (best.art === "drache") { textAuf(E.x, E.y - 0.8, t().lieberNicht, "#ebe2cc", 17); return; }
      E.absicht = best;
      if (!zuAbsicht()) { E.absicht = null; textAuf(E.x, E.y - 0.8, t().keinWeg, "#a89f8f", 16); }
      return;
    }
    E.absicht = null;
    let ziel = { x: zx, y: zy };
    if (!begehbar(zx, zy, false) && !(zx === Math.floor(E.x) && zy === Math.floor(E.y))) {
      // Finger knapp daneben (Wand, Tisch, Tresen …): das nächste freie Feld am Tipp-Punkt nehmen
      let bw = 1.25; ziel = null;
      for (let y = zy - 1; y <= zy + 1; y++) for (let x = zx - 1; x <= zx + 1; x++) {
        if (!begehbar(x, y, false) && !(x === Math.floor(E.x) && y === Math.floor(E.y))) continue;
        const w = Math.hypot(x + 0.5 - gx, y + 0.5 - gy);
        if (w < bw) { bw = w; ziel = { x, y }; }
      }
      if (!ziel) { S.marke.nein = true; return; }
      S.marke = { x: ziel.x + 0.5, y: ziel.y + 0.5, t: 0 };
    }
    if (ziel.x === Math.floor(E.x) && ziel.y === Math.floor(E.y)) { E.pfad = [{ x: ziel.x, y: ziel.y }]; return; }
    const p2 = pfadSuchen(Math.floor(E.x), Math.floor(E.y), genau(ziel), false);
    if (p2) E.pfad = p2; else { S.marke.nein = true; textAuf(E.x, E.y - 0.8, t().keinWeg, "#a89f8f", 16); }
  }
  function betreten(x, y) {
    const z = zeichen(x, y), key = x + "," + y;
    schrittLaerm(x, y);
    if (z === "~") { laerm(x + 0.5, y + 0.5, 2.7, x + 0.5, y + 0.5, 0.3); textAuf(x + 0.5, y - 0.1, t().knarr, "#a89f8f", 15, 0.9); KLANG.knarr(); }
    if (S.gold[key]) { const n = S.gold[key]; S.lvGold += n; delete S.gold[key]; textAuf(x + 0.5, y - 0.2, t().gold(n), "#e0a046", 18); funken(x + 0.5, y + 0.5, ["#e0a046", "#ffcf7a"], 8); KLANG.klau(); }
    if (S.robe && S.robe.x === x && S.robe.y === y) { S.robe = null; E.verkleidet = true; textAuf(x + 0.5, y - 0.2, t().robe, "#c4564a", 19); KLANG.klau(); }
    if (S.brief && S.brief.x === x && S.brief.y === y) briefFinden();
  }
  function ezekielUpdate(dt) {
    if (S.schloss) { E.versteckt = false; return; }
    if (S.griff) { E.versteckt = false; drehen(E, E.zielAng, 10 * dt); return; }
    if (E.lauer) {
      const L = E.lauer, p = L.ref;
      L.t += dt; E.zielAng = Math.atan2(p.y - E.y, p.x - E.x); drehen(E, E.zielAng, 10 * dt);
      if (E.pfad.length || E.absicht || cheb(E, p) > 1) E.lauer = null;
      else if (klauOk(p)) { E.lauer = null; klauen(p, true); }
      else if (L.t > 2.2 || p.wachsam > 0) { E.lauer = null; klauen(p, true); }
      return;
    }
    if (E.arbeit) {
      E.arbeit.t += dt; E.pfad = []; E.versteckt = false;
      if (E.arbeit.t >= E.arbeit.dauer) {
        const b = E.arbeit.ref; E.arbeit = null;
        b.verborgen = true; rauch(b.x, b.y, 6); textAuf(b.x, b.y - 0.5, t().verborgen, "#a89f8f", 16, 1); KLANG.puste();
      }
      return;
    }
    if (E.absicht) {
      const z = absichtZiel(E.absicht);
      if (!z || (E.absicht.art === "aus" && E.absicht.ref.zustand === "aus") || (E.absicht.art === "nezna" && E.absicht.ref.gefangen) || (E.absicht.art === "boss" && (E.absicht.ref.gefangen || E.absicht.ref.entkommen))) E.absicht = null;
      else if (cheb(E, z) <= 1 && Math.hypot(E.x - Math.floor(E.x) - 0.5, E.y - Math.floor(E.y) - 0.5) < 0.1 && sichtFrei(E.x, E.y, z.x, z.y) && (!E.pfad.length || hintenOk(E.absicht, Math.floor(E.x), Math.floor(E.y)))) { E.pfad = []; handeln(); }
      else if ((E.absicht.art === "klauen" && E.absicht.ref.wandert) || E.absicht.art === "aus" || E.absicht.art === "nezna" || E.absicht.art === "boss") {
        E.repfad -= dt;
        if (E.repfad <= 0) { E.repfad = 0.35; if (!zuAbsicht() && !E.pfad.length) E.absicht = null; }
      } else if (!E.pfad.length && !zuAbsicht()) E.absicht = null;
    }
    const netz = zeichen(Math.floor(E.x), Math.floor(E.y)) === "w";
    const zE = zeichen(Math.floor(E.x), Math.floor(E.y)), klettert = zE === "o" || zE === "=";
    const tempo = 2.7 * (1 + 0.16 * S.gaben.sohlen) * (netz ? 0.42 : 1) * (klettert ? 0.6 : 1) * (S.zornT > 0 ? 1.6 : 1);
    laufen(E, tempo, dt, betreten);
    E.versteckt = !E.pfad.length && zeichen(Math.floor(E.x), Math.floor(E.y)) === "O" && Math.hypot(E.x - Math.floor(E.x) - 0.5, E.y - Math.floor(E.y) - 0.5) < 0.05;
    drehen(E, E.zielAng, 10 * dt);
    if (netz && E.pfad.length && rnd() < dt * 3) S.teilchen.push({ x: E.x, y: E.y, vx: (rnd() - 0.5) * 0.4, vy: -0.2, leben: 0.6, max: 0.6, farbe: "rgba(235,226,204,.6)", gr: 1.5 });
    // Rex
    const rex = S.freunde.rex;
    if (rex) {
      rex.cd -= dt;
      if (!rex.gestreichelt && rex.cd <= 0 && abstand(E, rex) < 1.7) {
        rex.cd = 5; KLANG.bellen(); textAuf(rex.x, rex.y - 0.7, t().wuff, "#ebe2cc", 20); laerm(rex.x, rex.y, 4.5, E.x, E.y, 0.4);
      }
    }
    // Ausgang
    if (S.offen && S.ausgang && Math.floor(E.x) === S.ausgang.x && Math.floor(E.y) === S.ausgang.y) stufeGeschafft();
  }
  function handeln() {
    const a = E.absicht; E.absicht = null;
    const z = absichtZiel(a);
    if (z) E.zielAng = Math.atan2(z.y - E.y, z.x - E.x);
    if (a.art === "klauen") klauen(a.ref);
    else if (a.art === "aus") ausschalten(a.ref);
    else if (a.art === "kerze") kerze(a.ref);
    else if (a.art === "truhe") schlossStart(a.ref);
    else if (a.art === "freund") freund(a.ref);
    else if (a.art === "nezna") neznaFangen(a.ref);
    else if (a.art === "boss") bossFangen(a.ref);
    else if (a.art === "verbergen") { E.arbeit = { t: 0, dauer: 1.1, ref: a.ref }; }
  }
  function klauOk(p) {
    const nach = Math.atan2(E.y - p.y, E.x - p.x), diff = Math.abs(winkelDiff(p.ang, nach));
    const grenze = [1.35, 0.95, 0.55][Math.min(2, S.gaben.finger)];
    return p.wachsam <= 0 && (p.abgelenkt || diff > grenze || (p.schlaeft && !p.wach) || S.zornT > 0);
  }
  function klauen(p, sofort) {
    const tx = t();
    if (p.gold <= 0 && !p.key) { textAuf(p.x, p.y - 0.7, tx.leer, "#a89f8f", 16); return; }
    const nach = Math.atan2(E.y - p.y, E.x - p.x);
    const ok = klauOk(p);
    if (!ok && !sofort && p.wachsam <= 0) { E.lauer = { ref: p, t: 0 }; return; } // kurz abwarten, bis er wegschaut
    if (ok) {
      /* Taschen mit Gold: kurzer Griff mit Timing (im Darkin-Zorn geht es ohne) */
      if (p.gold > 0 && S.zornT <= 0) { griffStart(p); return; }
      beuteNehmen(p, 0);
    } else ertappt(p, 12);
  }
  function ertappt(p, auf) {
    const tx = t();
    p.wachsam = 3.5; p.ang = Math.atan2(E.y - p.y, E.x - p.x); S.lvGesehen = true;
    textAuf(p.x, p.y - 0.7, p.schlaeft ? tx.bruell : tx.he, "#c4564a", 22); KLANG.he();
    aufsehen(auf); laerm(p.x, p.y, p.schlaeft ? 7 : 5, E.x, E.y, 0.45);
    spurEreignis("gesehen", E.x, E.y);
    if (p.schlaeft) { KLANG.bruellen(); S.beben = 0.4; }
  }
  function beuteNehmen(p, bonus, keyHoch) {
    const tx = t();
    if (p.gold > 0) { const n = p.gold + (bonus || 0); S.lvGold += n; textAuf(p.x, p.y - 0.6, tx.gold(n), "#e0a046", 19); funken(p.x, p.y, ["#e0a046", "#ffcf7a"], 8 + (bonus ? 8 : 0)); KLANG.klau(); p.gold = 0; S.lvKlau++; spurEreignis("klau", p.x, p.y); }
    if (p.key) { p.key = false; S.schluessel = true; textAuf(p.x, p.y - (keyHoch ? 1.75 : 1.05), tn("schluesselDa"), "#ffcf7a", 22, 1.6); KLANG.schluessel(); spurEreignis("schluessel", p.x, p.y); zielPruefen(); }
  }

  /* ---------- Taschendiebstahl: der Griff ----------
     Eine Hand wandert einmal über eine kleine Leiste. Tippen im goldenen Feld = Bonusgold,
     genau in der Mitte = Meistergriff, daneben = Patzer (der Gast merkt es). Gar nicht tippen = normaler Griff. */
  function griffStart(p) {
    const n = parseInt(lies("imres-diebesnacht-griff-tipp", "0"), 10) || 0;
    S.griffTipp = n < 3; if (n < 3) schreib("imres-diebesnacht-griff-tipp", String(n + 1));
    S.griff = { p, t: 0, dauer: 1.2, zone: 0.42 + rnd() * 0.36, w: 0.2 * (1 + 0.25 * S.gaben.finger) * (ware("dietrich") ? 1.1 : 1) };
    E.pfad = []; E.absicht = null; E.zielAng = Math.atan2(p.y - E.y, p.x - E.x);
  }
  const griffK = g => Math.min(1, g.t / g.dauer);
  function griffTippen() {
    const g = S.griff; if (!g) return;
    const d = Math.abs(griffK(g) - g.zone);
    griffEnde(d <= g.w * 0.2 ? "meister" : d <= g.w / 2 ? "sauber" : "patzer");
  }
  function griffEnde(art) {
    const g = S.griff; if (!g) return;
    S.griff = null;
    const p = g.p, tx = t();
    if (art === "patzer") {
      const halb = Math.ceil(p.gold / 2);
      p.gold -= halb; S.lvGold += halb; S.lvKlau++;
      textAuf(p.x, p.y - 1.4, tx.griff.patzer, "#e08a7e", 18, 1.3); textAuf(p.x, p.y - 0.6, tx.gold(halb), "#a89f8f", 16);
      KLANG.patzer();
      if (p.key) { p.key = false; beuteNehmen({ x: p.x, y: p.y, gold: 0, key: true }, 0, true); } // den Schlüssel erwischt er trotzdem
      ertappt(p, 8);
      return;
    }
    let bonus = 0;
    if (art === "meister") { bonus = p.gold + 5; S.lvMeister++; KLANG.griffMeister(); textAuf(p.x, p.y - 1.4, tx.griff.meister, "#ffcf7a", 20, 1.4); funken(p.x, p.y - 0.2, ["#ffcf7a", "#fff4d0", "#e0a046"], 14, 1.3); }
    else if (art === "sauber") { bonus = Math.round(p.gold * 0.5) + 2; KLANG.griffGut(); textAuf(p.x, p.y - 1.4, tx.griff.sauber, "#ebe2cc", 17, 1.2); }
    beuteNehmen(p, bonus, art !== "normal");
  }
  function ausschalten(g) {
    const tx = t();
    if (g.T.ruft) { textAuf(g.x, g.y - 0.7, tx.wirtNein, "#ebe2cc", 15, 1.6); return; }
    if (g.T.hund) { // Hunde werden gefüttert, nicht ausgeschaltet
      if (g.zustand === "jagd" && S.zornT <= 0) { textAuf(g.x, g.y - 0.7, tx.knurr, "#c4564a", 18); return; }
      g.zustand = "aus"; g.zahm = true; g.aT = 0; g.pfad = [];
      textAuf(g.x, g.y - 0.7, S.zornT > 0 ? tx.keinHund : tx.zahm, "#ebe2cc", 16, 1.4); funken(g.x, g.y - 0.2, ["#c4564a", "#e0a046"], 6, 0.5); KLANG.klau();
      return;
    }
    const zorn = S.zornT > 0;
    if (!zorn && g.T.gross) { textAuf(g.x, g.y - 0.8, tx.zuGross, "#ebe2cc", 18); g.a = Math.max(g.a, 0.5); return; }
    if (!zorn && (g.zustand === "jagd" || sichtRate(g) > 0)) { g.a = 1; jagdStart(g); return; }
    g.zustand = "aus"; g.aT = 0; g.pfad = []; S.lvAus++;
    textAuf(g.x, g.y - 0.7, tx.aus, "#c4564a", 18); KLANG.aus(); funken(g.x, g.y, ["#9b3a2f", "#c4564a", "#5a1712"], zorn ? 22 : 12);
    spurEreignis("aus", g.x, g.y);
    if (!S.gaben.klinge) laerm(g.x, g.y, zorn ? 4.5 : 3.3, g.x, g.y, 0.35);
    aufsehen(5);
    if (!zorn) zornPlus(S.gaben.blutdurst ? 0.75 : 0.5);
  }
  /* ---------- Rauchbombe ---------- */
  function rauchWerfen() {
    if (zustand !== "spiel" || !S || S.rauchN <= 0) return;
    S.rauchN--; S.wolke = { x: E.x, y: E.y, t: 5 };
    rauch(E.x, E.y, 26); KLANG.rauchbombe(); textAuf(E.x, E.y - 0.9, t().rauch, "#ebe2cc", 18, 1);
    S.wachen.forEach(g => { if (g.zustand === "jagd" && Math.hypot(g.x - E.x, g.y - E.y) < 5) { g.zustand = "suche"; g.ziel = { x: E.x, y: E.y }; g.pfad = []; g.t = 2.5; g.a = 0.5; } });
    rauchKnopfSetzen();
  }
  function rauchKnopfSetzen() {
    if (!rauchKnopf) return;
    rauchKnopf.hidden = !(S && S.rauchN > 0);
  }
  /* ---------- Verkleidung (Ware aus dem Diebesversteck) ---------- */
  const MASKE_DAUER = 7;
  function maskeAnlegen() {
    if (zustand !== "spiel" || !S || S.maskeN <= 0 || S.maskeT > 0) return;
    S.maskeN--; S.maskeT = MASKE_DAUER;
    rauch(E.x, E.y, 12); KLANG.maske(); textAuf(E.x, E.y - 0.95, t().maske, "#ebe2cc", 19, 1.4);
    maskeKnopfSetzen();
  }
  function maskeKnopfSetzen() {
    if (!maskeKnopf) return;
    const an = !!(S && S.maskeT > 0);
    maskeKnopf.hidden = !(S && (S.maskeN > 0 || an));
    maskeKnopf.classList.toggle("an", an);
    maskeKnopf.style.setProperty("--f", an ? Math.round(S.maskeT / MASKE_DAUER * 100) + "%" : "0%");
  }
  /* ---------- Darkin-Zorn ---------- */
  function zornPlus(n) {
    const vorher = S.zorn;
    S.zorn = Math.min(1, S.zorn + n);
    if (S.zorn >= 1 && vorher < 1) {
      textAuf(E.x, E.y - 1.1, t().zornBereit, "#c4564a", 20, 1.8);
      if (!lies("imres-diebesnacht-zorn-tipp", "")) { schreib("imres-diebesnacht-zorn-tipp", "1"); textAuf(W / 2 / C, ROWS - 1.6, t().zornTipp, "#ebe2cc", 15, 4.5); }
    }
    zornKnopfSetzen();
  }
  function zornStarten() {
    if (zustand !== "spiel" || S.zorn < 1 || S.zornT > 0) return;
    S.zorn = 0; S.zornT = 6 + 2 * S.gaben.blutdurst; S.schloss = null; S.zielModus = false; if (S.griff) griffEnde("normal");
    KLANG.bruellen(); KLANG.entdeckt(); S.beben = 0.6;
    textAuf(E.x, E.y - 1.1, t().zorn, "#c4564a", 26, 1.8);
    funken(E.x, E.y, ["#c4564a", "#ff6a3a", "#9b3a2f"], 26, 1.6);
    aufsehen(10);
    S.wachen.forEach(g => { if (g.zustand === "jagd" || g.zustand === "verdacht") fliehen(g); });
    zornKnopfSetzen(); muenzKnopfSetzen();
  }
  function zornKnopfSetzen() {
    if (!zornKnopf) return;
    const an = !!(S && S.zornT > 0), f = S ? (an ? S.zornT / (6 + 2 * S.gaben.blutdurst) : S.zorn) : 0;
    zornKnopf.hidden = !(S && (S.zorn > 0 || an));
    zornKnopf.style.setProperty("--f", Math.round(f * 100) + "%");
    zornKnopf.classList.toggle("bereit", !!(S && S.zorn >= 1 && !an));
    zornKnopf.classList.toggle("an", an);
  }
  function fluchtWeg(e) {
    let best = null, bw = -1;
    pfadSuchen(Math.floor(e.x), Math.floor(e.y), (x, y) => { const w = Math.hypot(x + 0.5 - E.x, y + 0.5 - E.y); if (w > bw) { bw = w; best = { x, y }; } return false; }, true);
    return best ? (pfadSuchen(Math.floor(e.x), Math.floor(e.y), genau(best), true) || []) : [];
  }
  function fliehen(g) {
    if (g.zustand === "aus" || !g.T.tempo) return;
    g.zustand = "flucht"; g.pfad = fluchtWeg(g); g.repfad = 1; g.a = 0.6;
    textAuf(g.x, g.y - 0.75, "!", "#ebe2cc", 22, 0.8);
  }
  function kerze(k) {
    if (!k.an) return;
    k.an = false; k.wird = false; KLANG.puste(); textAuf(k.x + 0.5, k.y - 0.1, t().pfft, "#a89f8f", 16, 0.9);
    S.teilchen.push({ x: k.x + 0.5, y: k.y + 0.35, vx: 0, vy: -0.5, leben: 1.2, max: 1.2, farbe: "rgba(168,159,143,.5)", gr: 4, rund: true });
  }
  function freund(f) {
    const tx = t();
    if (f.name === "rex") { if (!f.gestreichelt) { f.gestreichelt = true; textAuf(f.x, f.y - 0.7, tx.rexGut, "#ebe2cc", 17); funken(f.x, f.y - 0.3, ["#c4564a", "#e0a046"], 5, 0.5); } else textAuf(f.x, f.y - 0.7, "♥", "#c4564a", 22); return; }
    if (f.name === "friedrich") { f.sprech = 2.2; f.spruch = zufall(tn("friedrich")); return; }
    if (f.name === "barradin") { f.sprech = 2.2; f.spruch = zufall(tn("barradin")); if (S.lied) { S.lied.an = true; S.lied.t = 10; KLANG.laute(); } }
  }

  /* ---------- Münze ---------- */
  function muenzKnopfSetzen() {
    if (!muenzKnopf) return;
    muenzKnopf.hidden = !(S && S.muenzen > 0);
    muenzKnopf.classList.toggle("an", !!(S && S.zielModus));
    if (S) muenzKnopf.querySelector("span").textContent = S.muenzen;
  }
  function werfen(gx, gy) {
    S.zielModus = false;
    if (Math.hypot(gx - E.x, gy - E.y) > 6.5) { textAuf(E.x, E.y - 0.8, t().zuWeit, "#a89f8f", 16); muenzKnopfSetzen(); return; }
    const zx = Math.floor(gx) + 0.5, zy = Math.floor(gy) + 0.5;
    S.muenzen--; S.muenzFlug = { x0: E.x, y0: E.y, x1: zx, y1: zy, t: 0 };
    muenzKnopfSetzen();
  }

  /* ---------- Schloss knacken ---------- */
  function schlossStart(tr) {
    if (tr.offen) return;
    const finger = S.gaben.finger;
    S.schloss = { tr, i: 0, ang: -Math.PI / 2, v: 2.4 + 0.25 * tr.pins, zone: 0, zv: 0, w: Math.max(0.3, (0.7 - 0.035 * tr.pins) * (1 + 0.3 * finger) * S.mod.schloss), blitz: 0, fehl: 0 };
    neueZone();
    E.pfad = [];
  }
  function neueZone() {
    const s = S.schloss;
    s.zone = s.ang + Math.PI * (0.7 + rnd() * 1.1);
    s.zv = s.tr.runen ? (rnd() < 0.5 ? -1 : 1) * (0.7 + 0.15 * s.i) : 0;
  }
  function schlossMitte() {
    const unten = E.y < ROWS / 2;
    return { x: W / 2, y: unten ? OY + GH - 2.4 * C : OY + 2.6 * C, r: 50 };
  }
  function schlossTippen(p) {
    const s = S.schloss, m = schlossMitte();
    if (Math.hypot(p.x - (m.x + m.r + 6), p.y - (m.y - m.r - 6)) < 22) { S.schloss = null; return; }
    if (Math.abs(winkelDiff(s.ang, s.zone)) <= s.w / 2) {
      s.i++; s.blitz = 0.25; KLANG.klick();
      if (s.i >= s.tr.pins) { truheAuf(s.tr); return; }
      neueZone();
    } else {
      s.fehl = 0.35; KLANG.fehler(); textAuf(E.x, E.y - 0.8, t().fehler, "#c4564a", 17, 0.8);
      /* Runenschloss (wandernde Zone): ein Fehlgriff kostet keinen Stift, macht nur ein wenig Lärm */
      if (s.tr.runen) { laerm(s.tr.x + 0.5, s.tr.y + 0.5, 2, s.tr.x + 0.5, s.tr.y + 0.5, 0.2); aufsehen(2); neueZone(); return; }
      laerm(s.tr.x + 0.5, s.tr.y + 0.5, 3, s.tr.x + 0.5, s.tr.y + 0.5, 0.3); aufsehen(3);
      s.i = Math.max(0, s.i - 1); neueZone();
    }
  }
  /* Fairness: Die Nadel muss mindestens SCHLOSS_FENSTER Sekunden in der goldenen Zone bleiben –
     wird sie (samt wandernder Zone) zu schnell, wird die Nadel gebremst. */
  const SCHLOSS_FENSTER = 0.12;
  function nadelTempo(s) {
    const roh = s.v * (1 + 0.1 * s.i), max = s.w / SCHLOSS_FENSTER, rel = roh - s.zv;
    return Math.abs(rel) > max ? Math.max(0.6, s.zv + Math.sign(rel) * max) : roh;
  }
  function schlossUpdate(dt) {
    const s = S.schloss; if (!s) return;
    s.ang += nadelTempo(s) * dt;
    s.zone += s.zv * dt;
    s.blitz = Math.max(0, s.blitz - dt); s.fehl = Math.max(0, s.fehl - dt);
  }
  function truheAuf(tr) {
    S.schloss = null; tr.offen = true; KLANG.auf();
    S.lvGold += tr.gold; textAuf(tr.x + 0.5, tr.y - 0.2, t().gold(tr.gold), "#ffcf7a", 22, 1.6); spurEreignis("truhe", tr.x + 0.5, tr.y + 0.5);
    funken(tr.x + 0.5, tr.y + 0.5, ["#e0a046", "#ffcf7a", "#ebe2cc"], 18);
    if (tr.schwert) { E.glut = true; textAuf(E.x, E.y - 1.1, t().schwertDa, "#ffcf7a", 22, 2); KLANG.schwert(); }
    if (tr.ziel) { S.zielErledigt = true; S.offen = true; textAuf(W / 2 / C, 4.2, t().wegFrei, "#ebe2cc", 24, 2); KLANG.sieg(); S.alarmBald = 0.9; }
  }
  function zielPruefen() {
    if (S.def.ziel === "schluessel" && S.schluessel && !S.offen) { S.offen = true; textAuf(W / 2 / C, 4.2, t().wegFrei, "#ebe2cc", 24, 2); KLANG.sieg(); S.alarmBald = 0.9; }
  }

  /* ---------- Alarm & Verstärkung ---------- */
  function hauptTyp() {
    const z = {};
    S.wachen.forEach(g => { if (g.T.tempo && !g.T.hund && !g.T.auge && !g.T.hauptmann) z[g.typ] = (z[g.typ] || 0) + 1; });
    const k = Object.keys(z).sort((a, b) => z[b] - z[a])[0];
    return k || ["rotmantel", "rotrobe", "goblin", "duergar", "drow", "geist"][S.def.n - 1] || "rotmantel";
  }
  function alarmAusloesen() {
    if (S.alarm || zustand !== "spiel") return;
    const tx = t();
    S.alarm = true; S.alarmT = 0; S.relightT = 3.5;
    const ruf = endlosK() || S.taeglich ? tx.alarm : tx.alarmRuf[S.def.n - 1] || tx.alarm;
    S.banner = { titel: tx.alarm, unter: ruf, t: 0, dauer: 2.6 };
    KLANG.glocke(); S.beben = 0.3; aufsehen(15);
    const n = { lehrling: 1, schurke: 2, legende: 3 }[S.stufe] + (endlosK() >= 3 ? 1 : 0);
    const typ = hauptTyp();
    for (let i = 0; i < n; i++) S.spawnQ.push({ t: 0.9 + i * 1.3, typ });
    (S.def.flucht || []).forEach((ty, i) => S.spawnQ.push({ t: 2.6 + i * 1.2, typ: ty, ruf: true }));
    if (S.boss && S.boss.zustand === "wartet") bossFlieht();
  }
  function verstaerkung(typ) {
    const ex = Math.floor(E.x), ey = Math.floor(E.y);
    let spawn = S.start;
    if (Math.hypot(S.start.x - ex, S.start.y - ey) < 4.5 || !begehbar(S.start.x, S.start.y, true)) {
      let bw = -1;
      pfadSuchen(ex, ey, (x, y) => { if (begehbar(x, y, true)) { const w = Math.hypot(x - ex, y - ey); if (w > bw) { bw = w; spawn = { x, y }; } } return false; }, false);
    }
    const kand = freieFelder(spawn, 2);
    const weg = [[spawn.x, spawn.y]];
    for (let i = 0; i < 2 && kand.length; i++) { const z = kand.splice(Math.floor(rnd() * kand.length), 1)[0]; weg.push([z.x, z.y]); }
    const g = wacheBauen({ typ, weg });
    g.zustand = "horchen"; g.ziel = { x: E.x, y: E.y }; g.pfad = []; g.t = 2.6; g.a = 0.4; g.neu = 1;
    S.wachen.push(g);
    rauch(g.x, g.y, 8); textAuf(g.x, g.y - 0.75, "!", "#c4564a", 22, 1);
  }

  /* ---------- Glasstab ---------- */
  function bossUpdate(dt) {
    const b = S.boss; if (!b || b.gefangen || b.entkommen) return;
    if (b.zustand === "wartet") {
      b.t += dt;
      drehen(b, b.basis + Math.sin(b.t * 0.6) * 0.9, 2 * dt);
      const dx = E.x - b.x, dy = E.y - b.y, d = Math.hypot(dx, dy);
      const sieht = !E.versteckt && d < 3 * S.mod.sicht && Math.abs(winkelDiff(b.ang, Math.atan2(dy, dx))) < 0.85 && sichtFrei(b.x, b.y, E.x, E.y) && (lichtBei(E.x, E.y) >= 0.3 || d < 1.6 || E.glut);
      b.sieht = sieht;
      if (sieht) { b.a += dt * 1.4 * S.mod.rate; if (b.a >= 1) { textAuf(b.x, b.y - 0.8, tn("glasstabSieht"), "#c4564a", 20, 1.4); S.lvGesehen = true; alarmAusloesen(); } }
      else b.a = Math.max(0, b.a - dt * 0.5);
    } else if (b.zustand === "flieht") {
      b.t -= dt;
      if (b.t > 0) { drehen(b, Math.atan2(E.y - b.y, E.x - b.x), 5 * dt); return; }
      if (!b.pfad.length) {
        const A = S.ausgang;
        b.pfad = A ? (pfadSuchen(Math.floor(b.x), Math.floor(b.y), (x, y) => Math.abs(x - A.x) + Math.abs(y - A.y) === 1, true) || []) : [];
        if (!b.pfad.length) { b.entkommen = true; auftragFehl(); textAuf(b.x, b.y - 0.8, tn("glasstabWeg"), "#a89f8f", 17, 1.6); rauch(b.x, b.y, 10); return; }
        b.ziel = b.pfad[b.pfad.length - 1];
      }
      laufen(b, 1.8 * S.mod.tempo, dt); drehen(b, b.zielAng, 8 * dt);
      if (Math.random() < dt * 8) S.teilchen.push({ x: b.x, y: b.y, vx: 0, vy: 0, leben: 0.5, max: 0.5, farbe: "rgba(150,200,230,.5)", gr: 2 });
      if (!b.pfad.length) { b.entkommen = true; auftragFehl(); textAuf(b.x, b.y - 0.8, tn("glasstabWeg"), "#a89f8f", 17, 1.6); rauch(b.x, b.y, 10); }
    }
  }
  function bossFlieht() {
    const b = S.boss; if (!b || b.zustand !== "wartet") return;
    b.zustand = "flieht"; b.t = 0.9; b.pfad = [];
    textAuf(b.x, b.y - 0.8, tn("glasstabFlieht"), "#c4564a", 20, 1.6);
  }
  function bossFangen(b) {
    if (b.gefangen || b.entkommen) return;
    const diff = Math.abs(winkelDiff(b.ang, Math.atan2(E.y - b.y, E.x - b.x)));
    if (b.zustand === "wartet" && S.zornT <= 0 && diff < 1.1) { b.a = 1; textAuf(b.x, b.y - 0.8, tn("glasstabSieht"), "#c4564a", 20, 1.4); S.lvGesehen = true; alarmAusloesen(); return; }
    const tx = t(), gold = 150;
    b.gefangen = true; S.lvGold += gold; spurEreignis("boss", b.x, b.y);
    funken(b.x, b.y, ["#9bd0ff", "#ebe2cc", "#e0a046"], 18); KLANG.aus(); KLANG.schluessel();
    textAuf(b.x, b.y - 0.9, tn("glasstabGefangen"), "#ebe2cc", 22, 2); textAuf(b.x, b.y - 0.3, tx.gold(gold), "#e0a046", 18, 1.8); textAuf(b.x, b.y - 1.5, tn("glasstabSpruch"), "#a89f8f", 15, 3);
    if (S.auftrag && S.auftrag.typ === "glasstab") auftragOk();
    if (S.zornT <= 0) zornPlus(0.5);
  }

  /* ---------- Briefe ---------- */
  function briefFinden() {
    const b = S.brief; if (!b) return;
    S.brief = null; KLANG.papier(); spurEreignis("brief", b.x + 0.5, b.y + 0.5);
    if (VS.briefe.indexOf(b.id) < 0) { VS.briefe.push(b.id); versteckSchreiben(VS); }
    if (S.auftrag && S.auftrag.typ === "brief") auftragOk();
    S.briefOffen = b.id; zustand = "brief"; E.pfad = []; E.absicht = null;
    briefZeigen();
  }
  function briefZeigen() {
    const tx = t(), [titel, text] = tx.briefe[S.briefOffen] || ["", ""];
    schleierAuf('<p class="dn-nacht">' + esc(tx.briefDa) + '</p><div class="dn-brief"><h5>' + esc(titel) + '</h5><p>' + esc(text) + '</p></div>' +
      '<button type="button" class="tav-knopf dn-haupt" data-tun="weiter">' + esc(tx.weiter) + '</button>');
  }

  /* ---------- Gäste ---------- */
  function gaesteUpdate(dt) {
    const lied = S.lied && S.lied.an, bard = S.freunde.barradin;
    S.gaeste.forEach(p => {
      p.abgelenkt = false;
      if (S.griff && S.griff.p === p) { p.abgelenkt = true; return; } // merkt nichts, solange Ezekiel in seiner Tasche ist
      if (p.wachsam > 0) { p.wachsam -= dt; drehen(p, Math.atan2(E.y - p.y, E.x - p.x), 6 * dt); return; }
      if (p.schlaeft) {
        if (p.wach > 0) {
          p.wach -= dt; p.blickT -= dt;
          if (p.blickT <= 0) { p.blickAng = p.basis + (rnd() - 0.5) * 3.4; p.blickT = 0.9; }
          drehen(p, p.blickAng == null ? p.basis : p.blickAng, 3 * dt);
          // wacher Bugbear sieht sich um
          const d = abstand(p, E);
          if (d < 3.2 && !E.versteckt && Math.abs(winkelDiff(p.ang, Math.atan2(E.y - p.y, E.x - p.x))) < 0.8 && sichtFrei(p.x, p.y, E.x, E.y) && (lichtBei(E.x, E.y) >= 0.3 || d < 1.8)) {
            p.a += dt * 1.6;
            if (p.a >= 1) { p.a = 0; p.wachsam = 3; S.lvGesehen = true; textAuf(p.x, p.y - 0.9, t().bruell, "#c4564a", 22); KLANG.bruellen(); S.beben = 0.5; aufsehen(15); laerm(p.x, p.y, 8, E.x, E.y, 0.6); }
          } else p.a = Math.max(0, p.a - dt * 0.5);
          if (p.wach <= 0) { p.schlafT = 7 + rnd() * 4; textAuf(p.x, p.y - 0.8, t().gaehn, "#a89f8f", 15); }
        } else {
          p.abgelenkt = true; p.schlafT -= dt;
          if (p.schlafT <= 0) { p.wach = 2.6; p.blickT = 0; }
        }
        return;
      }
      if (p.wandert) {
        if (p.pfad.length) { laufen(p, 0.9, dt); drehen(p, p.zielAng, 6 * dt); }
        else {
          p.pause -= dt;
          if (p.pause <= 0) {
            const ziel = { x: 1 + Math.floor(rnd() * (COLS - 2)), y: 1 + Math.floor(rnd() * (ROWS - 2)) };
            if (begehbar(ziel.x, ziel.y, true)) p.pfad = (pfadSuchen(Math.floor(p.x), Math.floor(p.y), genau(ziel), true) || []).slice(0, 7);
            p.pause = 1.5 + rnd() * 2.5;
          }
        }
      }
      if (lied && bard && abstand(p, bard) < 9) { drehen(p, Math.atan2(bard.y - p.y, bard.x - p.x), 4 * dt); p.abgelenkt = true; return; }
      // trinken
      p.trinkT -= dt;
      if (p.trinkt > 0) { p.trinkt -= dt; p.abgelenkt = true; }
      else if (p.trinkT <= 0) { p.trinkt = p.betrunken ? 2.6 : 1.6; p.trinkT = (p.betrunken ? 2 + rnd() * 3 : 4 + rnd() * 6) * (S.bed === "fest" ? 0.55 : 1); }
      if (p.betet) { p.abgelenkt = Math.sin(S.zeit * 0.7 + p.idx * 2) > -0.6; }
      if (p.wandert && p.pfad.length) return;
      p.blickT -= dt;
      if (p.blickT <= 0) {
        if (p.blickAng == null) { p.blickAng = p.basis + zufall([Math.PI / 2, -Math.PI / 2, Math.PI, 0.7, -0.7]); p.blickT = 1.3 + rnd(); }
        else { p.blickAng = null; p.blickT = (p.betet ? 5 : 2.5) + rnd() * 4; }
      }
      drehen(p, p.blickAng == null ? p.basis : p.blickAng, (p.betrunken ? 2.5 : 4) * dt);
    });
    // Barradins Lied
    if (S.lied) {
      S.lied.t -= dt;
      if (S.lied.t <= 0) { S.lied.an = !S.lied.an; S.lied.t = S.lied.an ? 8 : 9; if (S.lied.an && bard && abstand(E, bard) < 9) KLANG.laute(); }
      if (S.lied.an && bard && rnd() < dt * 2.5) S.teilchen.push({ x: bard.x + 0.3, y: bard.y - 0.3, vx: 0.3 + rnd() * 0.3, vy: -0.8, leben: 1.4, max: 1.4, farbe: "#e0a046", gr: 13, note: zufall(["♪", "♫"]) });
    }
    Object.keys(S.freunde).forEach(n => { const f = S.freunde[n]; if (f.sprech > 0) f.sprech -= dt; });
  }

  /* ---------- Wachen ---------- */
  function jagdStart(g, still) {
    if (g.zustand === "jagd") return;
    S.lvJagd = true; if (S.auftrag && S.auftrag.typ === "keinAlarm") auftragFehl();
    if (g.T.hauptmann && !still) {
      textAuf(g.x, g.y - 1.15, t().hauptmann, "#e0a046", 18, 1.4);
      S.wachen.forEach(o => { if (o !== g && o.T.tempo && !o.T.hund && o.zustand !== "aus" && o.zustand !== "flucht" && Math.hypot(o.x - g.x, o.y - g.y) < 10) { o.zuletzt = { x: E.x, y: E.y }; jagdStart(o, true); } });
    }
    g.zustand = "jagd"; g.repfad = 0; g.a = 1; g.pfad = []; g.blind = 0; g.zuletzt = { x: E.x, y: E.y };
    textAuf(g.x, g.y - 0.75, g.T.hund ? t().wuff : "!", "#c4564a", g.T.hund ? 22 : 28, 1.1); KLANG.entdeckt();
    if (g.T.hund) { KLANG.bellen(); laerm(g.x, g.y, 6, E.x, E.y, 0.6); }
    S.lvGesehen = true; aufsehen(15);
    S.schloss = null; if (S.griff) griffEnde("normal");
    spurEreignis("gesehen", E.x, E.y);
  }
  function wirtRuft(g) {
    g.a = 0; g.cd = 6; S.lvGesehen = true;
    textAuf(g.x, g.y - 0.8, t().wache, "#c4564a", 22, 1.4); KLANG.he();
    aufsehen(10); laerm(g.x, g.y, 11, E.x, E.y, 0.6);
    alarmAusloesen();
  }
  function kerzenPruefen(g) {
    if (g.T.hund) return;
    const R = g.T.sicht * S.mod.sicht;
    for (const k of S.kerzen) {
      if (k.an || k.wird) continue;
      const kx = k.x + 0.5, ky = k.y + 0.5, d = Math.hypot(kx - g.x, ky - g.y);
      if (d > R || Math.abs(winkelDiff(g.ang, Math.atan2(ky - g.y, kx - g.x))) > g.T.halb * 1.2) continue;
      if (!sichtFrei(g.x, g.y, kx, ky)) continue;
      k.wird = true; g.kerze = k; g.zustand = "anzuenden"; g.pfad = []; g.t = 1.3;
      return;
    }
  }
  function leicheSuchen(g) {
    if (!g.T.tempo || g.T.hund || g.zustand === "jagd" || g.zustand === "flucht" || g.zustand === "aus") return;
    for (const b of S.wachen) {
      if (b === g || b.zustand !== "aus" || b.zahm || b.verborgen || b.gefunden) continue;
      const dx = b.x - g.x, dy = b.y - g.y, d = Math.hypot(dx, dy);
      if (d > g.T.sicht * S.mod.sicht) continue;
      if (d > 0.6 && Math.abs(winkelDiff(g.ang, Math.atan2(dy, dx))) > g.T.halb * 1.1) continue;
      if (lichtBei(b.x, b.y) < 0.3 && d > g.T.dunkel * S.mod.dunkel * 1.3) continue;
      if (!sichtFrei(g.x, g.y, b.x, b.y)) continue;
      b.gefunden = true;
      textAuf(g.x, g.y - 0.8, t().leiche, "#c4564a", 19, 1.6); KLANG.he();
      aufsehen(18); laerm(g.x, g.y, 7, b.x, b.y, 0.55);
      g.zustand = "suche"; g.ziel = { x: b.x, y: b.y }; g.pfad = []; g.t = 3.5; g.a = Math.max(g.a, 0.55);
      if (S.auftrag && S.auftrag.typ === "keinAlarm") auftragFehl();
      return;
    }
  }
  function augeUpdate(g, dt) {
    if (!g.T.auge || g.zustand === "aus" || g.zustand === "flucht") return;
    g.augeT -= dt;
    if (g.augeT > 0) return;
    g.augeT = 7 + rnd() * 2.5;
    S.pulse.push({ x: g.x, y: g.y, t: 0, r: 3.4 });
    KLANG.auge();
    if (zustand === "spiel" && !E.versteckt && Math.hypot(E.x - g.x, E.y - g.y) <= 3.4 && !(S.zornT > 0)) {
      textAuf(g.x, g.y - 0.8, t().magier, "#b48ad8", 18, 1.3);
      g.zuletzt = { x: E.x, y: E.y }; g.a = Math.min(1, g.a + 0.7);
      if (g.a >= 1) jagdStart(g);
      else { g.zustand = "suche"; g.ziel = { x: E.x, y: E.y }; g.pfad = []; g.t = 3; }
    }
  }
  function wacheUpdate(g, dt) {
    if (g.zustand === "aus") { g.aT += dt; return; }
    leicheSuchen(g); augeUpdate(g, dt);
    g.getaeuscht = false;
    const T = g.T, rate = sichtRate(g);
    g.sieht = rate > 0;
    g.grussT = (g.grussT || 0) - dt;
    if (g.getaeuscht && g.grussT <= 0) { g.grussT = 7 + rnd() * 3; textAuf(g.x, g.y - 0.8, zufall(t().gruss), "#ebe2cc", 15, 1.7); }
    if (g.cd > 0) g.cd -= dt;
    if (g.sieht) { g.a = Math.min(1, g.a + rate * dt); g.zuletzt = { x: E.x, y: E.y }; g.blind = 0; }
    else { g.blind += dt; if (g.zustand !== "jagd" && g.zustand !== "horchen") g.a = Math.max(0, g.a - 0.2 * dt); }
    if (S.zornT > 0 && g.sieht && T.tempo && !T.ruft) { if (g.zustand !== "flucht") fliehen(g); }
    else if (g.zustand !== "jagd" && g.zustand !== "flucht" && g.sieht) {
      if (g.a >= 1) { if (T.ruft) wirtRuft(g); else jagdStart(g); }
      else if (g.a >= 0.42 && g.zustand !== "verdacht" && T.tempo) { g.zustand = "verdacht"; g.pfad = []; g.t = 0; textAuf(g.x, g.y - 0.75, "?", "#e0a046", 24, 0.9); }
    }
    const bremse = Math.pow(0.86, S.gaben.ranken);
    const tempo = T.tempo * S.mod.tempo * bremse, jtempo = T.jagd * S.mod.tempo * bremse;
    if (!T.tempo) { // Wirt
      g.t -= dt; if (g.t <= 0 && g.blicke.length > 1) { g.bi = (g.bi + 1) % g.blicke.length; g.t = 2.5; }
      drehen(g, g.sieht ? Math.atan2(E.y - g.y, E.x - g.x) : g.blicke[g.bi] + Math.sin(S.zeit * 0.9) * 0.5, 3 * dt);
      return;
    }
    const lauf = (tp) => { laufen(g, tp, dt); drehen(g, g.zielAng, 6 * dt); };
    switch (g.zustand) {
      case "flucht":
        if (g.pfad.length) { laufen(g, jtempo, dt); drehen(g, g.zielAng, 8 * dt); }
        else if (S.zornT > 0) { g.repfad -= dt; drehen(g, Math.atan2(E.y - g.y, E.x - g.x), 4 * dt); if (g.repfad <= 0) { g.pfad = fluchtWeg(g); g.repfad = 1; } }
        else { g.zustand = "suche"; g.ziel = null; g.t = 2.2; }
        break;
      case "patrouille":
        if (g.weg.length === 1) {
          if (!aufZelle(g, g.weg[0])) { g.zustand = "zurueck"; g.pfad = []; break; }
          g.t -= dt; if (g.t <= 0) { g.bi = (g.bi + 1) % g.blicke.length; g.t = 2.3 + rnd() * 1.2; }
          drehen(g, g.blicke[g.bi], 2.4 * dt);
        } else {
          if (!g.pfad.length) {
            const z = g.weg[g.wi];
            if (aufZelle(g, z)) { g.wi = (g.wi + 1) % g.weg.length; g.zustand = "umsehen"; g.t = 0.7 + rnd() * 0.7; g.umAng = g.ang; break; }
            g.pfad = pfadSuchen(Math.floor(g.x), Math.floor(g.y), genau(z), true) || [];
            if (!g.pfad.length) { g.wi = (g.wi + 1) % g.weg.length; break; }
          }
          lauf(tempo);
        }
        kerzenPruefen(g);
        break;
      case "umsehen":
        g.t -= dt; drehen(g, g.umAng + Math.sin(g.t * 3.5) * 0.7, 4 * dt);
        if (g.t <= 0) g.zustand = "patrouille";
        kerzenPruefen(g);
        break;
      case "verdacht": {
        const z = g.zuletzt || E;
        drehen(g, Math.atan2(z.y - g.y, z.x - g.x), 5 * dt);
        if (g.a < 0.2) { g.zustand = "zurueck"; g.pfad = []; }
        else if (!g.sieht && g.blind > 1.3) { g.zustand = "suche"; g.ziel = { x: z.x, y: z.y }; g.pfad = []; g.t = 3; }
        break; }
      case "jagd": {
        g.repfad -= dt;
        if (g.repfad <= 0) {
          const z = g.sieht ? E : (g.zuletzt || { x: E.x, y: E.y });
          g.pfad = pfadSuchen(Math.floor(g.x), Math.floor(g.y), neben(zelle(z)), true) || [];
          if (!g.pfad.length && cheb(g, z) > 1) g.pfad = pfadSuchen(Math.floor(g.x), Math.floor(g.y), genau(zelle(z)), true) || [];
          g.repfad = 0.25;
        }
        if (g.pfad.length) laufen(g, jtempo, dt);
        else if (g.sieht) { // letzter Schritt aufs Ziel zu
          const dx = E.x - g.x, dy = E.y - g.y, d = Math.hypot(dx, dy);
          if (d > 0.01) { const s = Math.min(d, jtempo * dt); g.x += dx / d * s * 0.5; g.y += dy / d * s * 0.5; }
        }
        drehen(g, g.sieht ? Math.atan2(E.y - g.y, E.x - g.x) : g.zielAng, 8 * dt);
        const d = abstand(g, E);
        if (g.sieht && d < 1.05) { gefasst(g); return; }
        if (g.blind > 3.2 || (!g.sieht && !g.pfad.length)) { g.zustand = "suche"; g.ziel = null; g.t = 3.2; g.pfad = []; }
        break; }
      case "suche":
      case "horchen":
        if (g.ziel) {
          if (!g.pfad.length) {
            if (cheb(g, g.ziel) <= 1) g.ziel = null;
            else { g.pfad = pfadSuchen(Math.floor(g.x), Math.floor(g.y), neben(zelle(g.ziel)), true) || []; if (!g.pfad.length) g.ziel = null; }
          }
          if (g.pfad.length) lauf(tempo * 1.2);
        } else {
          g.t -= dt; g.ang += 1.9 * dt * g.dreh;
          if (g.t <= 0) { g.zustand = "zurueck"; g.pfad = []; g.a = Math.min(g.a, 0.3); g.dreh = -g.dreh; }
        }
        break;
      case "anzuenden": {
        const k = g.kerze;
        if (!k || k.an) { g.zustand = "zurueck"; g.pfad = []; if (k) k.wird = false; break; }
        if (!g.pfad.length) {
          if (cheb(g, { x: k.x + 0.5, y: k.y + 0.5 }) <= 1) {
            drehen(g, Math.atan2(k.y + 0.5 - g.y, k.x + 0.5 - g.x), 6 * dt);
            g.t -= dt; if (g.t <= 0) { k.an = true; k.wird = false; KLANG.anzuenden(); g.zustand = "zurueck"; }
          } else {
            g.pfad = pfadSuchen(Math.floor(g.x), Math.floor(g.y), neben(k), true) || [];
            if (!g.pfad.length) { k.wird = false; g.zustand = "zurueck"; }
          }
        } else lauf(tempo);
        break; }
      case "zurueck": {
        const z = g.weg[g.weg.length === 1 ? 0 : g.wi];
        if (aufZelle(g, z)) { g.zustand = "patrouille"; g.pfad = []; if (g.weg.length === 1) g.t = 1.5; break; }
        if (!g.pfad.length) { g.pfad = pfadSuchen(Math.floor(g.x), Math.floor(g.y), genau(z), true) || []; if (!g.pfad.length) { g.x = z.x + 0.5; g.y = z.y + 0.5; } }
        lauf(tempo);
        break; }
    }
  }

  /* ---------- Venomfang ---------- */
  function dracheKopf() { const d = S.drache; return { x: d.x + Math.cos(d.ang) * 0.8, y: d.y + Math.sin(d.ang) * 0.8 }; }
  function dracheUpdate(dt) {
    const d = S.drache; if (!d) return;
    d.t -= dt;
    if (d.wach) {
      d.sweep += dt * 0.9; d.ang = d.basis + Math.sin(d.sweep) * 1.25;
      const k = dracheKopf(), dx = E.x - k.x, dy = E.y - k.y, dist = Math.hypot(dx, dy);
      const R = 5.6 * S.mod.sicht;
      let rate = 0;
      if (zustand === "spiel" && !E.versteckt && dist < R && Math.abs(winkelDiff(d.ang, Math.atan2(dy, dx))) < 0.62 && sichtFrei(k.x, k.y, E.x, E.y)) {
        const hell = lichtBei(E.x, E.y) >= 0.3 || E.glut;
        if (hell || dist < 3.6) rate = 1.5 * (1.3 - 0.8 * dist / R) * S.mod.rate * Math.pow(0.76, S.gaben.umhang);
      }
      d.sieht = rate > 0;
      d.a = rate > 0 ? Math.min(1, d.a + rate * dt) : Math.max(0, d.a - 0.3 * dt);
      if (d.a >= 1) { textAuf(d.x, d.y - 1.4, tn("drache"), "#c4564a", 22, 1.6); KLANG.bruellen(); S.beben = 0.7; d.a = 0; gefasst(null); return; }
      if (d.t <= 0) { d.wach = false; d.t = 6.5 + rnd() * 2.5; d.a = 0; }
    } else {
      d.sieht = false; d.ang += winkelDiff(d.ang, d.basis) * Math.min(1, dt * 2);
      if (d.t <= 0) { d.wach = true; d.t = 3.6; d.sweep = rnd() * 6; if (tn("dracheWach")) textAuf(d.x, d.y - 1.3, tn("dracheWach"), "#ffb07a", 16, 1.4); }
    }
  }

  /* ---------- Nezna ---------- */
  const NEZNA_LEVELS = LEVELS.map((l, i) => l.nezna ? i : -1).filter(i => i >= 0);
  function neznaSetzen() {
    S.nezna = null;
    if (S.def.neznaArt === undefined) S.def.neznaArt = S.def.nezna || (endlosK() && rnd() < 0.3 ? "katze" : null);
    const art = S.def.neznaArt;
    if (!art) return;
    const kand = [];
    pfadSuchen(S.start.x, S.start.y, (x, y) => { if (Math.hypot(x - S.start.x, y - S.start.y) >= 6 && zeichen(x, y) !== "~") kand.push({ x, y }); return false; }, true);
    if (!kand.length) return;
    const z = zufall(kand);
    S.nezna = { x: z.x + 0.5, y: z.y + 0.5, ang: rnd() * 6, zielAng: 0, pfad: [], form: art, pause: 1, a: 0, cd: 0, flucht: 0, gefangen: false, sieht: false };
  }
  function neznaUpdate(dt) {
    const n = S.nezna; if (!n || n.gefangen) return;
    const drow = n.form === "drow", R = drow ? 3.4 : 2.6, dx = E.x - n.x, dy = E.y - n.y, d = Math.hypot(dx, dy);
    n.cd = Math.max(0, n.cd - dt);
    n.sieht = n.cd <= 0 && !E.versteckt && d < R && Math.abs(winkelDiff(n.ang, Math.atan2(dy, dx))) < 0.9 && sichtFrei(n.x, n.y, E.x, E.y) && (lichtBei(E.x, E.y) >= 0.3 || d < 1.6 || (drow && d < 3) || E.glut);
    if (n.sieht) { n.a += dt * 1.8 * S.mod.rate; if (n.a >= 1) neznaFaucht(n); }
    else n.a = Math.max(0, n.a - dt * 0.6);
    if (n.flucht > 0) { n.flucht -= dt; laufen(n, 3, dt); }
    else if (n.pfad.length) laufen(n, drow ? 1.15 : 1.35, dt);
    else {
      n.pause -= dt;
      if (n.pause <= 0) {
        const ziel = { x: 1 + Math.floor(rnd() * (COLS - 2)), y: 1 + Math.floor(rnd() * (ROWS - 2)) };
        if (begehbar(ziel.x, ziel.y, true)) n.pfad = (pfadSuchen(Math.floor(n.x), Math.floor(n.y), genau(ziel), true) || []).slice(0, 6);
        n.pause = 1.2 + rnd() * 2.5;
      }
      if (rnd() < dt * 0.6) n.zielAng = n.ang + (rnd() - 0.5) * 3;
    }
    drehen(n, n.zielAng, 5 * dt);
  }
  function neznaFaucht(n) {
    const tx = t();
    n.a = 0; n.cd = 4.5; n.flucht = 3; n.pfad = fluchtWeg(n); S.lvGesehen = true;
    textAuf(n.x, n.y - 0.7, n.form === "drow" ? tx.fauchDrow : tx.fauch, "#b48ad8", 20, 1.2); KLANG.he();
    aufsehen(8); laerm(n.x, n.y, 6, E.x, E.y, 0.5);
  }
  function neznaFangen(n) {
    if (n.gefangen) return;
    const diff = Math.abs(winkelDiff(n.ang, Math.atan2(E.y - n.y, E.x - n.x)));
    if (S.zornT <= 0 && (n.sieht || diff < 1.0)) { neznaFaucht(n); return; }
    const tx = t(), gold = n.form === "drow" ? 100 : 60;
    n.gefangen = true; S.lvGold += gold; S.neznaRun++; spurEreignis("nezna", n.x, n.y);
    rauch(n.x, n.y, 12); funken(n.x, n.y, ["#b48ad8", "#e0a046"], 12);
    textAuf(n.x, n.y - 0.7, tx.entlarvt, "#b48ad8", 21, 1.8); textAuf(n.x, n.y - 0.2, tx.gold(gold), "#e0a046", 18, 1.6);
    if (n.form === "drow") textAuf(n.x, n.y - 1.3, tx.spinne, "#ebe2cc", 15, 3);
    KLANG.schluessel();
    if (S.lvIdx < LEVELS.length && !S.taeglich) schreib("imres-diebesnacht-nezna", String(neznaLesen() | (1 << S.lvIdx)));
    if (S.auftrag && S.auftrag.typ === "nezna") auftragOk();
    if (S.zornT <= 0) zornPlus(0.5);
  }

  /* ---------- Sterne ---------- */
  function allesGold() {
    return S.gaeste.every(p => p.gold <= 0) && !Object.keys(S.gold).length && (!S.truhe || S.truhe.offen);
  }
  function sterneJetzt() { return (S.lvGesehen ? 0 : 1) | (allesGold() ? 2 : 0) | (S.lvAus ? 0 : 4); }

  /* ---------- Gefasst / geschafft ---------- */
  function gefasst(g) {
    if (zustand !== "spiel" || S.zornT > 0) return;
    S.schloss = null; S.griff = null; E.absicht = null; E.pfad = []; E.arbeit = null; E.lauer = null;
    if (S.schrittFrei) { schattenschritt(); return; }
    zustand = "gefasst"; S.gefasstT = 0; S.faenger = g;
    KLANG.gefasst(); textAuf(E.x, E.y - 0.9, t().erwischt, "#c4564a", 26, 1.4); S.beben = 0.5;
    S.leben--;
  }
  function schattenschritt() {
    S.schrittFrei = false;
    rauch(E.x, E.y, 14);
    const kandidaten = [S.start];
    for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) if (K[y][x] === "O") kandidaten.push({ x, y });
    let best = S.start, bw = -1;
    kandidaten.forEach(z => {
      const w = Math.min(...S.wachen.filter(g => g.zustand !== "aus" && g.T.tempo).map(g => Math.hypot(g.x - z.x - 0.5, g.y - z.y - 0.5)).concat([99]));
      if (w > bw && pfadSuchen(Math.floor(E.x), Math.floor(E.y), genau(z), false)) { bw = w; best = z; }
    });
    E.x = best.x + 0.5; E.y = best.y + 0.5; E.pfad = [];
    rauch(E.x, E.y, 10); KLANG.schritt(); textAuf(E.x, E.y - 0.9, t().schritt, "#ebe2cc", 20, 1.4);
    S.wachen.forEach(g => { if (g.zustand === "jagd" || g.zustand === "verdacht") { g.zustand = "suche"; g.ziel = g.zuletzt; g.pfad = []; g.t = 2.5; g.a = 0.45; } });
    muenzKnopfSetzen();
  }
  /* ---------- Angefangenen Diebeszug merken ----------
     Gespeichert wird zu Beginn jeder Stufe (nicht in der Täglichen Nacht). Fortsetzen zählt ganz normal;
     war die Stufe schon losgegangen, beginnt sie neu – mit einem Leben weniger, damit niemand
     eine Stufe durch Schließen des Tabs beliebig wiederholen kann. Am Ende des Zugs wird gelöscht. */
  const ZUG_KEY = "imres-diebesnacht-zug";
  const ZUG_FELDER = ["stufe", "maxLeben", "leben", "punkte", "aufsehen", "auftraege", "klau", "aus", "geist", "meister", "erreicht", "startNacht", "sterneRun", "neznaRun", "gaben", "lvIdx"];
  function zugSpeichern(begonnen) {
    if (!S || S.taeglich) return;
    const d = { v: 1, begonnen: !!begonnen, zeit: Date.now(), def: S.def, s: {} };
    ZUG_FELDER.forEach(k => { d.s[k] = S[k]; });
    try { localStorage.setItem(ZUG_KEY, JSON.stringify(d)); } catch (_) {}
  }
  function zugLoeschen() { try { localStorage.removeItem(ZUG_KEY); } catch (_) {} }
  function zugLesen() {
    try {
      const d = JSON.parse(lies(ZUG_KEY, "null"));
      if (!d || d.v !== 1 || !d.s || !STUFEN[d.s.stufe] || !d.s.gaben || typeof d.s.gaben !== "object" || !d.def || !Array.isArray(d.def.karte)) return null;
      const z = k => Number.isFinite(d.s[k]) && d.s[k] >= 0;
      if (!["leben", "punkte", "maxLeben", "lvIdx"].every(z) || d.s.leben < 1) return null;
      if (!d.s.lvIdx && !d.s.punkte) return null; /* noch auf der ersten Stufe ohne Beute – nichts zu verlieren */
      return d;
    } catch (_) { return null; }
  }
  function zugFortsetzen() {
    const d = zugLesen(); if (!d) { startZeigen(); return; }
    const alt = stufeWahl; stufeWahl = d.s.stufe; neuesSpiel(); stufeWahl = alt;
    ZUG_FELDER.forEach(k => { if (d.s[k] !== undefined) S[k] = d.s[k]; });
    Object.keys(S.gaben).forEach(k => { S.gaben[k] = Math.max(0, Math.min(GABEN[k] || 0, d.s.gaben[k] | 0)); });
    if (d.begonnen) {
      S.leben -= 1;
      if (S.leben <= 0) { S.leben = 0; S.erreicht = S.lvIdx; spielEnde(); return; }
    }
    stufeLaden(S.lvIdx, d.def);
    S.fortsetzHinweis = d.begonnen;
    zustand = "intro"; introZeigen(); anwerfen();
  }
  function stufeGeschafft() {
    if (zustand !== "spiel") return;
    zustand = "wahl"; KLANG.sieg();
    const bonus = S.lvGesehen ? 0 : 40 + 10 * Math.min(5, Math.floor(S.lvIdx / 3));
    S.lvBonus = bonus;
    const st = sterneJetzt();
    S.lvSterne = st; S.lvGoldBonus = st & 2 ? 25 + 5 * S.def.n : 0; S.lvBlutBonus = st & 4 ? 20 : 0;
    S.sterneRun += bits(st);
    if (S.lvIdx < LEVELS.length && !S.taeglich) {
      const alle = sterneLesen(), alt = alle[S.lvIdx] || 0;
      S.lvSterneNeu = st & ~alt; alle[S.lvIdx] = alt | st;
      try { localStorage.setItem("imres-diebesnacht-sterne", JSON.stringify(alle)); } catch (_) {}
    } else S.lvSterneNeu = 0;
    const A = S.auftrag;
    if (A && !A.ok && !A.fehl && (A.typ === "zeit" || A.typ === "keinAlarm")) A.ok = true;
    S.lvAuftrag = A && A.ok ? 40 + 10 * Math.min(5, S.def.n) : 0;
    if (S.lvAuftrag) S.auftraege++;
    S.punkte += S.lvGold + bonus + S.lvGoldBonus + S.lvBlutBonus + S.lvAuftrag;
    S.klau += S.lvKlau; S.aus += S.lvAus; S.meister += S.lvMeister; if (!S.lvGesehen) S.geist++;
    S.erreicht = S.lvIdx + 1;
    S.nachtEnde = (S.lvIdx + 1) % 3 === 0;
    if (S.nachtEnde) S.aufsehen = 0; else aufsehen(-8);
    const naechste = S.lvIdx + 1;
    if (!S.taeglich && naechste < LEVELS.length && naechste % 3 === 0) {
      const n = naechste / 3 + 1;
      if (n > freiNaechte()) schreib("imres-diebesnacht-nacht", String(n));
    }
    /* erst die Nachstellung der Stufe, dann Gaben (bzw. in der Täglichen Nacht gleich das Ergebnis) */
    nachstellungStarten(() => { if (S.taeglich) { S.erreicht = 1; spielEnde(); } else { zustand = "wahl"; gabenZeigen(); } });
  }

  /* ---------- Update ---------- */
  function update(dt) {
    S.zeit += dt;
    lichtBerechnen();
    if (S.gaben.lied && !S.wachen.some(g => g.zustand === "jagd")) S.aufsehen = Math.max(0, S.aufsehen - 1.2 * dt);
    ezekielUpdate(dt);
    if (zustand !== "spiel") return;
    gaesteUpdate(dt);
    for (const g of S.wachen) { wacheUpdate(g, dt); if (zustand !== "spiel") return; }
    dracheUpdate(dt);
    if (zustand !== "spiel") return;
    neznaUpdate(dt);
    bossUpdate(dt);
    S.spielZeit += dt;
    if (S.alarmBald > 0) { S.alarmBald -= dt; if (S.alarmBald <= 0) alarmAusloesen(); }
    if (S.spawnQ.length) {
      S.spawnQ.forEach(q => { q.t -= dt; });
      S.spawnQ.filter(q => q.t <= 0).forEach(q => { verstaerkung(q.typ); if (q.ruf) { textAuf(W / 2 / C, 5.2, t().ilvaraDa, "#b48ad8", 18, 3); KLANG.bruellen(); } });
      S.spawnQ = S.spawnQ.filter(q => q.t > 0);
    }
    // Alarm: Kerzen wieder an
    if (S.alarm) { S.alarmT += dt; if (S.relightT > 0) { S.relightT -= dt; if (S.relightT <= 0) { let n = 0; S.kerzen.forEach(k => { if (!k.an) { k.an = true; n++; } }); if (n) KLANG.anzuenden(); } } }
    // Gewitter
    if (S.gew) {
      S.gew.t -= dt; S.blitzT = Math.max(0, S.blitzT - dt);
      S.gew.leuchten = S.gew.t < 1.1 && S.gew.t > 0;
      if (S.gew.t <= 0) { S.blitzT = 0.4; S.gew.t = 7 + rnd() * 5; setTimeout(KLANG.donner, 250); }
    }
    // Rauchwolke
    if (S.wolke) {
      S.wolke.t -= dt;
      if (rnd() < dt * 14) S.teilchen.push({ x: S.wolke.x + (rnd() - 0.5) * 3.2, y: S.wolke.y + (rnd() - 0.5) * 3.2, vx: (rnd() - 0.5) * 0.3, vy: -0.1, leben: 1.4, max: 1.4, farbe: "rgba(150,140,140,.45)", gr: 10 + rnd() * 8, rund: true });
      if (S.wolke.t <= 0) S.wolke = null;
    }
    // Magier-Pulse
    S.pulse.forEach(q => { q.t += dt; }); S.pulse = S.pulse.filter(q => q.t < 0.8);
    // Nebenaufträge
    const A = S.auftrag;
    if (A && !A.ok && !A.fehl) {
      if (A.typ === "zeit" && S.spielZeit > A.limit) auftragFehl();
      if (A.typ === "kerzen" && S.kerzen.length && S.kerzen.every(k => !k.an)) auftragOk();
    }
    if (S.zornT > 0) {
      S.zornT -= dt;
      if (rnd() < dt * 22) S.teilchen.push({ x: E.x + (rnd() - 0.5) * 0.6, y: E.y + (rnd() - 0.5) * 0.6, vx: (rnd() - 0.5) * 0.4, vy: -0.7, leben: 0.6, max: 0.6, farbe: zufall(["#c4564a", "#ff6a3a", "#e0a046"]), gr: 2.2 });
      if (S.zornT <= 0) S.zornT = 0;
      if (Math.floor(S.zornT * 4) !== S.zornAlt) { S.zornAlt = Math.floor(S.zornT * 4); zornKnopfSetzen(); }
    }
    schlossUpdate(dt);
    if (S.griff) { S.griff.t += dt; if (S.griff.t >= S.griff.dauer + 0.06) griffEnde("normal"); }
    if (S.maskeT > 0) {
      S.maskeT -= dt;
      if (S.maskeT <= 0) { S.maskeT = 0; textAuf(E.x, E.y - 0.95, t().maskeAus, "#a89f8f", 16, 1.4); rauch(E.x, E.y, 6); }
      if (Math.floor(S.maskeT * 4) !== S.maskeAlt) { S.maskeAlt = Math.floor(S.maskeT * 4); maskeKnopfSetzen(); }
    }
    spurAufnehmen(dt);
    tiereUpdate(dt);
    if (S.muenzFlug) {
      const m = S.muenzFlug; m.t += dt / 0.55;
      if (m.t >= 1) { S.muenzFlug = null; KLANG.klirr(); textAuf(m.x1, m.y1 - 0.4, t().klirr, "#e0a046", 17, 0.9); funken(m.x1, m.y1, ["#e0a046", "#ffcf7a"], 6, 0.6); laerm(m.x1, m.y1, 3.9, m.x1, m.y1, 0.3); }
    }
    nebenbei(dt);
  }
  function nebenbei(dt) {
    S.ringe.forEach(r => { r.t += dt; }); S.ringe = S.ringe.filter(r => r.t < 0.75);
    S.laerm = Math.max(0, S.laerm - dt * (E.pfad.length ? 0.9 : 2.2));
    S.lichter.forEach(q => { const z = q.an ? 1 : 0; q.vis += (z - q.vis) * Math.min(1, dt * 7); });
    stimmungUpdate(dt);
    S.teilchen.forEach(q => { q.leben -= dt; q.x += q.vx * dt; q.y += q.vy * dt; q.vx *= 0.96; q.vy *= 0.96; });
    S.teilchen = S.teilchen.filter(q => q.leben > 0);
    S.texte.forEach(x => { x.t += dt; x.y -= dt * 0.45; });
    if (S.banner) { S.banner.t += dt; if (S.banner.t > S.banner.dauer) S.banner = null; }
    S.texte = S.texte.filter(x => x.t < x.dauer);
    if (S.marke) { S.marke.t += dt; if (S.marke.t > 0.6) S.marke = null; }
    S.beben = Math.max(0, S.beben - dt * 1.4);
  }

  /* ---------- Kulisse: Boden, Krimskrams, Fenster, Mondlicht, Wetter, Tiere ----------
     Jede Stufe bekommt bei jedem Durchlauf eigene Kleinigkeiten: Teppiche, Pfützen, Geröll, Krimskrams,
     Wandschmuck, Fenster mit Wetter, Tageszeit, Ratten, Fledermäuse … Gewürfelt wird mit einem eigenen
     Startwert (S.def.dekoSeed), damit ein Neuversuch oder ein fortgesetzter Diebeszug dieselbe Kulisse zeigt.
     Die Bodenarten zählen fürs Spiel (Schrittlärm), Mondlicht durch Fenster ebenfalls (es macht hell). */
  const GRUND_BASIS = { holz: "holz", stein: "stein", fels: "fels", schmiede: "stein", unterreich: "fels", lava: "fels" };
  /* je Ort (Index in LEVELS): Bodenflecken [Art, Anzahl], Krimskrams, Wandschmuck, Tiere */
  const KULISSE = [
    { boden: [["teppich", 2]], kram: ["krug", "krug", "teller", "wuerfel", "knochen", "pfeife"], wand: ["schild", "geweih", "dartscheibe", "regal"], tiere: ["ratte", "katze"] },
    { boden: [["wein", 2], ["kies", 1]], kram: ["flasche", "flasche", "korken", "krug", "kiste"], wand: ["weinregal", "weinregal", "kette"], tiere: ["ratte", "ratte"] },
    { boden: [["teppich", 1], ["kies", 1]], kram: ["papier", "papier", "trank", "buch", "kerzenstumpf"], wand: ["buecher", "banner", "regal"], tiere: ["ratte"] },
    { boden: [["teppich", 2]], kram: ["karten", "wuerfel", "krug", "flasche"], wand: ["banner", "banner", "schild"], tiere: ["katze", "ratte"] },
    { boden: [["kies", 2], ["pfuetze", 1], ["stroh", 1]], kram: ["schaedel", "knochen", "kette", "kerzenstumpf"], wand: ["kette", "riss", "efeu"], tiere: ["ratte", "ratte"] },
    { boden: [["laeufer", 1], ["kies", 1]], kram: ["kerzenstumpf", "kerzenstumpf", "papier", "schaedel"], wand: ["banner", "banner", "riss"], tiere: ["ratte"] },
    { boden: [["stroh", 2], ["kies", 1], ["pfuetze", 1]], kram: ["kiste", "knochen", "speer", "krug"], wand: ["efeu", "riss", "kette"], tiere: ["ratte", "fledermaus"] },
    { boden: [["stroh", 2], ["teppich", 1]], kram: ["knochen", "krug", "kiste", "speer"], wand: ["waffen", "schild", "geweih"], tiere: ["ratte"] },
    { boden: [["kies", 2], ["moos", 2]], kram: ["knochen", "schaedel", "helm", "stein"], wand: ["tropfstein", "efeu"], tiere: ["fledermaus", "fledermaus"] },
    { boden: [["teppich", 1], ["asche", 1]], kram: ["krug", "krug", "barren", "zange"], wand: ["werkzeug", "schild", "zahnrad"], tiere: ["ratte"] },
    { boden: [["asche", 2], ["kies", 2]], kram: ["barren", "kohle", "zange", "kette"], wand: ["werkzeug", "zahnrad", "kette"], tiere: ["ratte"] },
    { boden: [["asche", 1], ["kies", 1]], kram: ["kohle", "barren", "rune", "rune"], wand: ["zahnrad", "werkzeug", "kristall"], tiere: [] },
    { boden: [["stroh", 3], ["pfuetze", 1]], kram: ["kette", "knochen", "napf", "schaedel"], wand: ["kette", "netz", "kristall"], tiere: ["ratte", "spinne"] },
    { boden: [["moos", 2], ["kies", 1]], kram: ["eier", "knochen", "schaedel", "pilz"], wand: ["netz", "netz", "kristall"], tiere: ["spinne", "spinne", "fledermaus"] },
    { boden: [["moos", 2], ["kies", 1]], kram: ["schaedel", "knochen", "pilz", "kristall"], wand: ["kristall", "netz", "riss"], tiere: ["fledermaus", "spinne"] },
    { boden: [["stroh", 1], ["asche", 1], ["teppich", 1]], kram: ["kiste", "kiste", "stoff", "krug"], wand: ["werkzeug", "banner", "zahnrad"], tiere: ["ratte"] },
    { boden: [["stroh", 2], ["pfuetze", 2], ["kies", 1]], kram: ["kiste", "knochen", "lumpen", "napf"], wand: ["riss", "kette", "netz"], tiere: ["ratte", "ratte", "ratte"] },
    { boden: [["muenzen", 3], ["kies", 1]], kram: ["helm", "knochen", "schaedel", "schlacke"], wand: ["glutriss", "glutriss"], tiere: [] }
  ];
  const TEPPICH_FARBEN = [["#5a1c18", "#7a2a22", "#c98a3a"], ["#5a4220", "#7a5a2c", "#d8b070"], ["#2f4428", "#45603a", "#c9b28a"], ["#4a2238", "#64304c", "#e0a046"]];
  const FREI = ".S";
  function dekoBauen() {
    const D = S.def;
    if (D.dekoSeed === undefined) D.dekoSeed = Math.floor(rnd() * 1e9);
    const r = mulberry(D.dekoSeed), wahl = l => l[Math.floor(r() * l.length)];
    const thema = D.boden, basis = GRUND_BASIS[thema] || "stein", ku = KULISSE[D.basisIdx] || KULISSE[0];
    const fensterOrt = thema === "holz" || thema === "stein";
    /* Boden */
    S.grund = new Array(COLS * ROWS);
    for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
      const z = K[y][x];
      S.grund[y * COLS + x] = z === "~" ? (thema === "holz" ? "knarr" : "gitter") : z === "w" ? "netz" : basis;
    }
    const deko = { flecken: [], kram: [], wand: [], ecken: [], fenster: [], tische: {}, tropfen: [] };
    const frei = (x, y) => x > 0 && y > 0 && x < COLS - 1 && y < ROWS - 1 && FREI.indexOf(K[y][x]) >= 0 && !S.belegt[y * COLS + x] && !(S.brief && S.brief.x === x && S.brief.y === y);
    const belegtDeko = new Uint8Array(COLS * ROWS);
    ku.boden.forEach(([art, n]) => {
      const anzahl = Math.max(1, n - (r() < 0.35 ? 1 : 0) + (r() < 0.25 ? 1 : 0));
      for (let i = 0; i < anzahl; i++) {
        for (let versuch = 0; versuch < 24; versuch++) {
          const x0 = 1 + Math.floor(r() * (COLS - 2)), y0 = 1 + Math.floor(r() * (ROWS - 2));
          if (!frei(x0, y0) || belegtDeko[y0 * COLS + x0]) continue;
          let zellen = [];
          if (art === "teppich" || art === "laeufer") { // rechteckig, darf unter Tische reichen
            const lang = art === "laeufer";
            const w = lang ? (r() < 0.5 ? 1 : 2) : 2 + Math.floor(r() * 2), h = lang ? 4 + Math.floor(r() * 3) : 1 + Math.floor(r() * 2);
            let ok = true;
            for (let y = y0; y < y0 + h && ok; y++) for (let x = x0; x < x0 + w && ok; x++) {
              if (x >= COLS - 1 || y >= ROWS - 1 || belegtDeko[y * COLS + x] || ".So".indexOf(K[y][x]) < 0) ok = false;
            }
            if (!ok) continue;
            for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) zellen.push({ x, y });
            deko.flecken.push({ art: "teppich", x: x0, y: y0, w, h, farbe: wahl(TEPPICH_FARBEN), zellen, lang });
          } else { // unregelmäßiger Fleck (Zufallsweg)
            const n2 = art === "pfuetze" || art === "wein" ? 1 + Math.floor(r() * 2) : 2 + Math.floor(r() * 4);
            let x = x0, y = y0;
            zellen.push({ x, y });
            for (let k = 0; k < n2 * 3 && zellen.length < n2; k++) {
              const [dx, dy] = wahl([[1, 0], [-1, 0], [0, 1], [0, -1]]); const nx = x + dx, ny = y + dy;
              if (!frei(nx, ny) || belegtDeko[ny * COLS + nx] || K[ny][nx] === "S") continue;
              x = nx; y = ny; if (!zellen.some(z => z.x === x && z.y === y)) zellen.push({ x, y });
            }
            if (K[y0][x0] === "S" && (art === "kies" || art === "muenzen" || art === "pfuetze")) continue;
            deko.flecken.push({ art, zellen, saat: Math.floor(r() * 1e6) });
            if ((art === "pfuetze" || art === "wein") && r() < 0.7) deko.tropfen.push({ x: zellen[0].x + 0.3 + r() * 0.4, y: zellen[0].y + 0.3 + r() * 0.4, t: r() * 3 });
          }
          zellen.forEach(z => { belegtDeko[z.y * COLS + z.x] = 1; if (K[z.y][z.x] !== "o") S.grund[z.y * COLS + z.x] = art === "laeufer" ? "teppich" : art === "wein" ? "pfuetze" : art; });
          break;
        }
      }
    });
    /* Krimskrams auf dem Boden (rein optisch, klein und gedämpft) */
    const kramN = 7 + Math.floor(r() * 6);
    for (let i = 0, versuch = 0; i < kramN && versuch < 80; versuch++) {
      const x = 1 + Math.floor(r() * (COLS - 2)), y = 1 + Math.floor(r() * (ROWS - 2));
      if (!frei(x, y) || K[y][x] === "S" || deko.kram.some(k => k.x === x && k.y === y)) continue;
      deko.kram.push({ x, y, art: wahl(ku.kram), ox: 0.18 + r() * 0.64, oy: 0.2 + r() * 0.6, rot: r() * 6.28, s: r() }); i++;
    }
    /* Wandschmuck: auf Wandstücken, deren Vorderseite man sieht (Boden darunter) */
    const wandKand = [];
    for (let y = 0; y < ROWS - 1; y++) for (let x = 0; x < COLS; x++) if (K[y][x] === "#" && !istWand(zeichen(x, y + 1))) wandKand.push({ x, y });
    mischenMit(wandKand, r);
    /* Fenster (nur Holz- und Steinorte, auf der Außenwand oben und an den Seiten) */
    if (fensterOrt) {
      const kand = [];
      for (let x = 1; x < COLS - 1; x++) if (K[0][x] === "#" && ".SO".indexOf(K[1][x]) >= 0) kand.push({ x, y: 0, dx: 0, dy: 1 });
      for (let y = 1; y < ROWS - 1; y++) {
        if (K[y][0] === "#" && ".SO".indexOf(K[y][1]) >= 0) kand.push({ x: 0, y, dx: 1, dy: 0 });
        if (K[y][COLS - 1] === "#" && ".SO".indexOf(K[y][COLS - 2]) >= 0) kand.push({ x: COLS - 1, y, dx: -1, dy: 0 });
      }
      mischenMit(kand, r);
      const anzahl = 1 + Math.floor(r() * 2.6);
      kand.forEach(f => { if (deko.fenster.length < anzahl && !deko.fenster.some(g => Math.abs(g.x - f.x) + Math.abs(g.y - f.y) < 3)) deko.fenster.push(Object.assign(f, { schraeg: (r() - 0.5) * 1.1, lang: 2 + Math.floor(r() * 2) })); });
    }
    const wandN = 4 + Math.floor(r() * 4);
    for (const w of wandKand) {
      if (deko.wand.length >= wandN) break;
      if (deko.fenster.some(f => f.x === w.x && f.y === w.y) || deko.wand.some(v => Math.abs(v.x - w.x) + Math.abs(v.y - w.y) < 2)) continue;
      deko.wand.push({ x: w.x, y: w.y, art: wahl(ku.wand), s: r() });
    }
    /* Spinnweben in Raumecken */
    const eckN = (thema === "unterreich" ? 4 : thema === "stein" || thema === "fels" ? 3 : 2) + Math.floor(r() * 2);
    const ecken = [];
    for (let y = 1; y < ROWS - 1; y++) for (let x = 1; x < COLS - 1; x++) {
      if (istWand(K[y][x])) continue;
      const o = istWand(K[y - 1][x]), l = istWand(K[y][x - 1]), re = istWand(K[y][x + 1]);
      if (o && l) ecken.push({ x, y, ecke: 0 }); if (o && re) ecken.push({ x, y, ecke: 1 });
    }
    mischenMit(ecken, r); deko.ecken = ecken.slice(0, eckN).map(e => Object.assign(e, { s: 0.5 + r() * 0.5 }));
    /* Tische: was darauf steht */
    for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) if (K[y][x] === "o" || K[y][x] === "=") {
      const dinge = [];
      const n = K[y][x] === "=" ? Math.floor(r() * 2.4) : 1 + Math.floor(r() * 3);
      for (let i = 0; i < n; i++) dinge.push({ art: wahl(thema === "schmiede" || thema === "lava" ? ["krug", "krug", "barren", "teller"] : D.basisIdx === 3 ? ["karten", "wuerfel", "krug"] : ["krug", "krug", "teller", "flasche", "brot", "kerzenstumpf", "karten"]), ox: 0.28 + r() * 0.44, oy: 0.28 + r() * 0.44, rot: r() * 6.28 });
      deko.tische[x + "," + y] = dinge;
    }
    /* Stimmung: Tageszeit und Wetter (Wetter sieht man nur durch Fenster) */
    const zeit = fensterOrt ? wahl(["daemmerung", "mitternacht", "mitternacht", "morgengrauen"]) : "tief";
    let wetter = S.bed === "gewitter" ? "gewitter" : S.bed === "nebel" ? "nebel" : S.bed === "vollmond" ? "klar" : wahl(["klar", "klar", "regen", "schnee", "wind"]);
    if (!fensterOrt) wetter = null;
    S.stimmung = {
      zeit, wetter,
      dunkel: { daemmerung: 0.69, mitternacht: 0.77, morgengrauen: 0.72, tief: 0.73 + r() * 0.04 }[zeit],
      toenung: { daemmerung: "rgba(150,72,30,.07)", morgengrauen: "rgba(160,118,128,.06)" }[zeit] || null
    };
    /* Mondlicht: ein Lichtstreifen je Fenster; die Felder darin gelten als hell, solange keine Wolke davor ist */
    S.mond = null;
    if (deko.fenster.length && wetter !== "nebel") {
      const MW = { klar: [0.72, 0.55, 1], regen: [0.22, 0.3, 1], schnee: [0.62, 0.5, 1], wind: [0.6, 0.6, 2.2], gewitter: [0.15, 0.22, 1.6] }[wetter] || [0.6, 0.5, 1];
      const M = { zellen: [], strahlen: [], m: 0, p: r() * 100, o1: r() * 6, o2: r() * 6, basis: MW[0], amp: MW[1], tempo: MW[2] };
      if (S.bed === "vollmond") { M.basis = 0.92; M.amp = 0.22; }
      deko.fenster.forEach(f => {
        const qx = -f.dy, qy = f.dx; // quer zur Einfallsrichtung
        const ox = f.x + 0.5 + f.dx * 0.5, oy = f.y + 0.5 + f.dy * 0.5; // Mitte der Fensteröffnung an der Wandkante
        let lang = f.lang;
        for (let k = 0; k < f.lang; k++) {
          const cx = ox + f.dx * (k + 0.5) + qx * f.schraeg * (k + 0.5), cy = oy + f.dy * (k + 0.5) + qy * f.schraeg * (k + 0.5);
          const zx = Math.floor(cx), zy = Math.floor(cy);
          if (istWand(zeichen(zx, zy))) { lang = k; break; }
          if (K[zy][zx] !== "S" && !M.zellen.some(z => z.x === zx && z.y === zy)) M.zellen.push({ x: zx, y: zy });
        }
        if (lang < 1) return;
        const b0 = 0.32, b1 = 0.62; // halbe Breite an der Wand und am Ende (der Strahl weitet sich)
        const ex = ox + f.dx * lang + qx * f.schraeg * lang, ey = oy + f.dy * lang + qy * f.schraeg * lang;
        const pts = [[ox - qx * b0, oy - qy * b0], [ox + qx * b0, oy + qy * b0], [ex + qx * b1, ey + qy * b1], [ex - qx * b1, ey - qy * b1]];
        const pfad = new Path2D(); pts.forEach((p, i) => i ? pfad.lineTo(p[0], p[1]) : pfad.moveTo(p[0], p[1])); pfad.closePath();
        M.strahlen.push({ pfad, ox, oy, ex, ey, qx, qy, b0, b1, f });
      });
      if (M.strahlen.length) S.mond = M;
    }
    /* Tiere */
    S.tiere = [];
    const tierArten = ku.tiere.filter(a => !(a === "katze" && S.nezna));
    const tierN = tierArten.length ? Math.min(tierArten.length, 1 + Math.floor(r() * tierArten.length)) : 0;
    mischenMit(tierArten, r).slice(0, tierN).forEach(art => {
      const pl = []; for (let y = 1; y < ROWS - 1; y++) for (let x = 1; x < COLS - 1; x++) if (frei(x, y) && K[y][x] !== "S" && Math.hypot(x - S.start.x, y - S.start.y) > 3) pl.push({ x, y });
      if (!pl.length) return;
      const p = wahl(pl);
      S.tiere.push({ art, x: p.x + 0.5, y: p.y + 0.5, ang: r() * 6.28, zielAng: 0, pfad: [], pause: 1 + r() * 4, t: r() * 10, schlaeft: art === "katze" && r() < 0.6, flieht: 0, farbe: art === "katze" ? wahl(["#a8642a", "#6e6258", "#c9a070", "#3a3230"]) : null });
    });
    S.deko = deko;
  }
  function mischenMit(l, r) { for (let i = l.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [l[i], l[j]] = [l[j], l[i]]; } return l; }

  /* Mond hinter Wolken, Tropfen, Staub, Glut, Sporen */
  function stimmungUpdate(dt) {
    const M = S.mond, st = S.stimmung;
    if (M) {
      M.p += dt * M.tempo;
      M.m = Math.max(0, Math.min(1, M.basis + M.amp * (0.6 * Math.sin(M.p * 0.23 + M.o1) + 0.4 * Math.sin(M.p * 0.61 + M.o2))));
    }
    if (!S.deko || ruhig) return;
    S.deko.tropfen.forEach(tr => {
      tr.t -= dt;
      if (tr.t <= 0) { tr.t = 1.6 + rnd() * 2.6; S.amb.push({ art: "welle", x: tr.x, y: tr.y, t: 0, max: 0.9 }); }
    });
    if (S.amb.length < 26 && rnd() < dt * 9) {
      const th = S.def.boden, an = S.lichter.filter(q => q.an && q.art !== "schwert");
      if ((th === "holz" || th === "stein") && an.length) {
        const q = an[Math.floor(rnd() * an.length)];
        S.amb.push({ art: "staub", x: q.x + 0.5 + (rnd() - 0.5) * 2.6, y: q.y + 0.5 + (rnd() - 0.5) * 2.6, vx: (rnd() - 0.5) * 0.08, vy: (rnd() - 0.5) * 0.06, t: 0, max: 3 + rnd() * 3 });
      } else if (th === "schmiede" || th === "lava") {
        const fe = an.filter(q => q.art === "feuer" || q.art === "lava");
        if (fe.length) { const q = fe[Math.floor(rnd() * fe.length)]; S.amb.push({ art: "glut", x: q.x + 0.3 + rnd() * 0.4, y: q.y + 0.4, vx: (rnd() - 0.5) * 0.25, vy: -0.35 - rnd() * 0.4, t: 0, max: 1.2 + rnd() * 1.4 }); }
      } else if (th === "unterreich" || th === "fels") {
        S.amb.push({ art: th === "unterreich" ? "spore" : "staub", x: 1 + rnd() * (COLS - 2), y: 1 + rnd() * (ROWS - 2), vx: (rnd() - 0.5) * 0.1, vy: -0.03 - rnd() * 0.05, t: 0, max: 3 + rnd() * 3, farbe: rnd() < 0.5 ? "180,138,216" : "150,200,110" });
      }
    }
    S.amb.forEach(a => { a.t += dt; if (a.vx !== undefined) { a.x += a.vx * dt; a.y += a.vy * dt; } });
    S.amb = S.amb.filter(a => a.t < a.max);
  }

  /* Tiere: Ratten huschen die Wände entlang und fliehen vor Ezekiel, Katzen dösen, Fledermäuse flattern vorbei.
     Rein zur Zierde – niemand bemerkt sie, und sie stehen niemandem im Weg. */
  function tiereUpdate(dt) {
    (S.tiere || []).forEach(a => {
      a.t += dt;
      if (a.art === "fledermaus") {
        if (!a.flug) { a.pause -= dt; if (a.pause <= 0 && !ruhig) { const l = rnd() < 0.5; a.flug = { x0: l ? -1 : COLS + 1, y0: 1 + rnd() * (ROWS - 2), x1: l ? COLS + 1 : -1, y1: 1 + rnd() * (ROWS - 2), k: 0, v: 0.12 + rnd() * 0.06, welle: rnd() * 6 }; } }
        else { const f = a.flug; f.k += dt * f.v; a.x = f.x0 + (f.x1 - f.x0) * f.k; a.y = f.y0 + (f.y1 - f.y0) * f.k + Math.sin(f.k * 9 + f.welle) * 0.8; a.ang = Math.atan2(f.y1 - f.y0, f.x1 - f.x0); if (f.k >= 1) { a.flug = null; a.pause = 7 + rnd() * 12; } }
        return;
      }
      const d = Math.hypot(E.x - a.x, E.y - a.y);
      if (a.art === "ratte" && d < 1.7 && !a.flieht) { a.flieht = 1.4; a.pfad = (fluchtWeg(a) || []).slice(0, 5); a.schlaeft = false; }
      if (a.art === "katze") { if (d < 1.3 && a.schlaeft) a.schlaeft = false; if (d < 2.2) a.zielAng = Math.atan2(E.y - a.y, E.x - a.x); }
      if (a.flieht > 0) a.flieht = Math.max(0, a.flieht - dt);
      const tempo = a.art === "ratte" ? (a.flieht ? 3.6 : 1.6) : a.art === "spinne" ? 0.35 : 0.7;
      if (a.pfad.length) { laufen(a, tempo, dt); drehen(a, a.zielAng, 9 * dt); }
      else {
        a.pause -= dt; drehen(a, a.zielAng, 3 * dt);
        if (a.pause <= 0) {
          a.pause = a.art === "katze" ? 5 + rnd() * 8 : 1.2 + rnd() * 3.5;
          if (a.art === "katze" && rnd() < 0.5) { a.schlaeft = !a.schlaeft; return; }
          if (a.schlaeft) return;
          const ziel = { x: 1 + Math.floor(rnd() * (COLS - 2)), y: 1 + Math.floor(rnd() * (ROWS - 2)) };
          if (begehbar(ziel.x, ziel.y, true) && Math.hypot(ziel.x - a.x, ziel.y - a.y) < 6) a.pfad = (pfadSuchen(Math.floor(a.x), Math.floor(a.y), genau(ziel), true) || []).slice(0, a.art === "spinne" ? 2 : 6);
        }
      }
    });
  }

  /* ---------- Lichtkegel mit weichen Schatten ----------
     Für jede Lichtquelle wird einmal ein Sichtbarkeits-Vieleck berechnet (Strahlen bis zur nächsten Wand, ein
     Stück in die Wand hinein, damit Wandflächen angestrahlt werden). Bewegte Lichter (Fackeln, die Klinge)
     werden jedes Bild neu berechnet. Gezeichnet wird in eine kleine Lichtebene, die weichgezeichnet wird. */
  function lichtPoly(x, y, R, n) {
    const p = new Path2D();
    for (let i = 0; i < n; i++) {
      const a = i / n * Math.PI * 2, cs = Math.cos(a), sn = Math.sin(a);
      let r = 0.04, ende = R;
      while (r < ende) {
        if (istWand(zeichen(Math.floor(x + cs * r), Math.floor(y + sn * r)))) { ende = Math.min(R, r + 0.3); break; }
        r += 0.07;
      }
      r = Math.min(ende, R);
      if (i) p.lineTo(x + cs * r, y + sn * r); else p.moveTo(x + cs * r, y + sn * r);
    }
    p.closePath();
    return p;
  }
  function lichtPolygone() {
    S.lichter.forEach(q => { q.pfad = lichtPoly(q.x + 0.5, q.y + 0.5, q.r, q.art === "lava" ? 28 : 72); });
  }
  const LICHT_FARBE = { kerze: "255,176,96", laterne: "255,190,110", feuer: "255,140,60", lava: "255,112,44", schwert: "255,236,170", fackel: "255,160,80", glut: "255,214,130", zorn: "220,64,40" };
  function lichtQuellen() {
    const l = [], fl = (ph, st) => ruhig ? 1 : 1 + st * (Math.sin(S.zeit * 11 + ph) * 0.6 + Math.sin(S.zeit * 27 + ph * 2) * 0.4);
    S.lichter.forEach(q => {
      if (q.vis < 0.01 || (q.art === "schwert" && S.truhe && S.truhe.offen)) return;
      l.push({ x: q.x + 0.5, y: q.y + 0.5, r: q.r * fl(q.phase, q.art === "lava" ? 0.05 : 0.025), st: q.vis, pfad: q.pfad, farbe: LICHT_FARBE[q.art], art: q.art });
    });
    S.wachen.forEach(g => {
      if (!g.T.fackel || g.zustand === "aus") return;
      const x = g.x + Math.cos(g.ang) * 0.3, y = g.y + Math.sin(g.ang) * 0.3;
      l.push({ x, y, r: 1.95 * fl(g.x * 3, 0.04), st: 1, pfad: lichtPoly(x, y, 1.95, 40), farbe: LICHT_FARBE.fackel });
    });
    if (E.glut) l.push({ x: E.x, y: E.y, r: 2.5, st: 1, pfad: lichtPoly(E.x, E.y, 2.5, 48), farbe: LICHT_FARBE.glut });
    if (S.zornT > 0) l.push({ x: E.x, y: E.y, r: 1.6, st: 0.8, pfad: lichtPoly(E.x, E.y, 1.6, 32), farbe: LICHT_FARBE.zorn });
    return l;
  }

  /* ---------- Nachstellung: Aufzeichnung ----------
     Alle 0,2 s werden Ezekiel und die Wachen gemerkt, dazu Ereignisse (Beute, Schlüssel, Ausgeschaltet, Entdeckt …).
     Nach der Stufe läuft das als kurze Animation über die Karte (überspringbar). */
  function spurStart() { S.spur = { dt: 0.2, acc: 0, n: 0, e: [], w: [], ev: [] }; }
  function spurBild() {
    const sp = S.spur;
    sp.e.push(E.x, E.y);
    S.wachen.forEach((g, i) => { let w = sp.w[i]; if (!w) w = sp.w[i] = { s: sp.n, p: [] }; w.p.push(g.x, g.y, g.zustand === "aus" ? 1 : g.zustand === "jagd" ? 2 : 0); });
    sp.n++;
    if (sp.n >= 1400) { // sehr lange Stufe: jedes zweite Bild verwerfen
      const halb = (arr, k, s) => arr.filter((_, i) => (s + Math.floor(i / k)) % 2 === 0);
      sp.e = halb(sp.e, 2, 0);
      sp.w.forEach(w => { w.p = halb(w.p, 3, w.s); w.s = Math.ceil(w.s / 2); });
      sp.ev.forEach(e => { e.i = Math.floor(e.i / 2); });
      sp.n = sp.e.length / 2; sp.dt *= 2;
    }
  }
  function spurAufnehmen(dt) {
    const sp = S.spur; if (!sp) return;
    sp.acc += dt; if (sp.acc < sp.dt) return;
    sp.acc -= sp.dt; spurBild();
  }
  function spurEreignis(art, x, y) {
    const sp = S && S.spur; if (!sp || zustand !== "spiel") return;
    const l = sp.ev[sp.ev.length - 1];
    if (l && l.art === art && sp.n - l.i < 6 && Math.hypot(l.x - x, l.y - y) < 1.5) return;
    sp.ev.push({ i: sp.n, x, y, art });
    if (sp.ev.length > 90) sp.ev.shift();
  }
  function nachstellungStarten(weiter) {
    const sp = S.spur;
    if (!sp || sp.n < 3) { weiter(); return; }
    if (!sp.fertig) { spurBild(); sp.fertig = true; } // letzter Stand: Ezekiel am Ausgang
    const T = sp.n * sp.dt;
    S.rep = { t: 0, dauer: ruhig ? 0 : Math.max(2.4, Math.min(5.5, T * 0.12)), halten: ruhig ? 3.5 : 1.4, weiter };
    zustand = "nachstellung"; schleierZu();
    buehne.classList.add("rep"); skipKnopf.textContent = t().ueberspringen; skipKnopf.hidden = false;
    anwerfen();
  }
  function nachstellungEnde() {
    if (zustand !== "nachstellung" || !S || !S.rep) return;
    const w = S.rep.weiter; S.rep = null;
    buehne.classList.remove("rep"); skipKnopf.hidden = true;
    w();
  }

  /* ---------- Zeichnen ---------- */
  const leinwand = document.createElement("canvas");
  const ctx = leinwand.getContext("2d");
  /* Lichtebene: klein (LS Pixel je logischer Einheit, LP Pixel Rand), wird weichgezeichnet und hochskaliert */
  const LS = 0.32, LP = 4, LW = Math.ceil(W * LS) + 2 * LP, LH = Math.ceil(GH * LS) + 2 * LP;
  const neueLein = () => { const c = document.createElement("canvas"); c.width = LW; c.height = LH; return c; };
  const lichtLein = neueLein(), lctx = lichtLein.getContext("2d"), weichLein = neueLein(), wctx = weichLein.getContext("2d");
  const FILTER_OK = typeof wctx.filter === "string";
  let skala = 1, hgBild = null, rexBild = null, startBild = null;
  const THEMEN = {
    holz:       { boden: "#33241a", fuge: "#22180f", hell: "rgba(224,160,70,.05)", wand: "#1f1b19", wandOben: "#3a312a", stein: false },
    stein:      { boden: "#29272c", fuge: "#1b1a1e", hell: "rgba(235,226,204,.04)", wand: "#18171b", wandOben: "#35323a", stein: true },
    fels:       { boden: "#2a2420", fuge: "#1b1714", hell: "rgba(168,159,143,.05)", wand: "#16120f", wandOben: "#302823", stein: true, fels: true },
    schmiede:   { boden: "#2b2320", fuge: "#1a1411", hell: "rgba(224,120,60,.06)", wand: "#1a1412", wandOben: "#3a2a22", stein: true },
    unterreich: { boden: "#1f1d27", fuge: "#141219", hell: "rgba(140,120,200,.05)", wand: "#121019", wandOben: "#2a2536", stein: true, pilze: true },
    lava:       { boden: "#2e1d17", fuge: "#1c100c", hell: "rgba(255,110,40,.07)", wand: "#1c0f0b", wandOben: "#3e1f16", stein: true, fels: true, glut: true }
  };
  function lcg(seed) { let s = seed; return () => (s = (s * 16807) % 2147483647) / 2147483647; }

  function hintergrundBauen() {
    const f = 2, c = document.createElement("canvas"); c.width = W * f; c.height = Math.ceil(GH * f);
    const x = c.getContext("2d"); x.scale(f, f);
    const th = THEMEN[S.def.boden] || THEMEN.stein, r = lcg(1 + (S.def.dekoSeed || S.lvIdx * 7) % 2147483000);
    // Boden
    x.fillStyle = th.boden; x.fillRect(0, 0, W, GH);
    if (!th.stein) {
      for (let y = 0; y < ROWS; y++) for (let k = 0; k < 2; k++) {
        const yy = y * C + k * C / 2;
        x.fillStyle = th.fuge; x.fillRect(0, yy, W, 1);
        for (let xx = (r() * 60) | 0; xx < W; xx += 50 + r() * 50) x.fillRect(xx, yy, 1, C / 2);
        x.fillStyle = th.hell; x.fillRect(0, yy + 1, W, 2);
      }
    } else {
      for (let y = 0; y < ROWS; y++) for (let xx = 0; xx < COLS; xx++) {
        const px = xx * C, py = y * C;
        x.fillStyle = "rgba(0,0,0," + (r() * 0.12).toFixed(3) + ")"; x.fillRect(px, py, C, C);
        x.strokeStyle = th.fuge; x.lineWidth = 1;
        if (th.fels) { x.beginPath(); x.moveTo(px + r() * C, py); x.lineTo(px + r() * C, py + C * (0.4 + r() * 0.6)); x.stroke(); }
        else { x.strokeRect(px + 0.5, py + 0.5, C - 1, C - 1); if (r() < 0.5) { x.beginPath(); x.moveTo(px + C / 2, py); x.lineTo(px + C / 2, py + C); x.stroke(); } }
        if (th.pilze && r() < 0.08) { x.fillStyle = "rgba(120,200,190,.35)"; x.beginPath(); x.arc(px + r() * C, py + r() * C, 1.4, 0, 7); x.fill(); }
        if (th.glut && r() < 0.1) { x.strokeStyle = "rgba(255,110,40,.35)"; x.lineWidth = 1.2; x.beginPath(); x.moveTo(px + r() * C, py + r() * C); x.lineTo(px + r() * C, py + r() * C); x.stroke(); x.lineWidth = 1; }
        if (S.def.boden === "schmiede" && r() < 0.06) { x.strokeStyle = "rgba(224,120,60,.3)"; x.beginPath(); x.moveTo(px + r() * C, py + r() * C); x.lineTo(px + r() * C, py + r() * C); x.stroke(); }
      }
    }
    bodenFleckenMalen(x, th);
    // Felder
    for (let y = 0; y < ROWS; y++) for (let xx = 0; xx < COLS; xx++) {
      const z = K[y][xx], px = xx * C, py = y * C;
      if (z === "#" || z === "A") {
        x.fillStyle = th.wand; x.fillRect(px, py, C, C);
        x.fillStyle = th.wandOben; x.fillRect(px, py, C, C * 0.62);
        x.strokeStyle = "rgba(0,0,0,.35)"; x.lineWidth = 1;
        for (let k = 0; k < 3; k++) { const yy = py + k * C * 0.21; x.beginPath(); x.moveTo(px, yy); x.lineTo(px + C, yy); x.stroke(); const off = (k % 2) * C / 2; x.beginPath(); x.moveTo(px + off + C / 4, yy); x.lineTo(px + off + C / 4, yy + C * 0.21); x.stroke(); }
        if (zeichen(xx, y + 1) !== "#" && zeichen(xx, y + 1) !== "A") { x.fillStyle = "rgba(0,0,0,.35)"; x.fillRect(px, py + C - 3, C, 3); }
      } else if (z === "~") {
        if (th.stein) { x.fillStyle = "#1e1c1c"; x.fillRect(px + 2, py + 2, C - 4, C - 4); x.strokeStyle = "#4a4440"; x.lineWidth = 1.6; for (let k = 1; k < 5; k++) { x.beginPath(); x.moveTo(px + 2 + k * (C - 4) / 5, py + 3); x.lineTo(px + 2 + k * (C - 4) / 5, py + C - 3); x.stroke(); } }
        else { x.fillStyle = "#2a1d14"; x.fillRect(px, py, C, C); x.strokeStyle = "#140d08"; x.lineWidth = 1.5; x.beginPath(); x.moveTo(px + 4, py + 8); x.lineTo(px + C * 0.5, py + C * 0.45); x.lineTo(px + C - 6, py + C * 0.6); x.moveTo(px + C * 0.5, py + C * 0.45); x.lineTo(px + C * 0.4, py + C - 4); x.stroke(); }
      } else if (z === "w") {
        x.strokeStyle = "rgba(235,226,204,.28)"; x.lineWidth = 0.8;
        const cx = px + C / 2, cy = py + C / 2;
        for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4 + r() * 0.3; x.beginPath(); x.moveTo(cx, cy); x.lineTo(cx + Math.cos(a) * C * 0.6, cy + Math.sin(a) * C * 0.6); x.stroke(); }
        for (let ring = 1; ring <= 3; ring++) { x.beginPath(); for (let k = 0; k <= 8; k++) { const a = k * Math.PI / 4, rr = ring * C * 0.16; const fx = cx + Math.cos(a) * rr, fy = cy + Math.sin(a) * rr; if (k) x.lineTo(fx, fy); else x.moveTo(fx, fy); } x.stroke(); }
      } else if (z === "o") {
        if (S.def.ziel === "truhe" && S.def.boden === "stein" && S.def.n === 2) { // Kirchenbank
          x.fillStyle = "#3a2a1c"; x.fillRect(px + 2, py + C * 0.3, C - 4, C * 0.4); x.fillStyle = "#4a3624"; x.fillRect(px + 2, py + C * 0.3, C - 4, 3);
        } else {
          x.fillStyle = "rgba(0,0,0,.35)"; x.beginPath(); x.arc(px + C / 2 + 2, py + C / 2 + 3, C * 0.42, 0, 7); x.fill();
          x.fillStyle = "#5a3e26"; x.beginPath(); x.arc(px + C / 2, py + C / 2, C * 0.42, 0, 7); x.fill();
          x.strokeStyle = "#3a2817"; x.lineWidth = 1.5; x.beginPath(); x.arc(px + C / 2, py + C / 2, C * 0.42, 0, 7); x.stroke();
          x.fillStyle = "rgba(255,230,180,.06)"; x.beginPath(); x.arc(px + C / 2 - 2, py + C / 2 - 2, C * 0.3, 0, 7); x.fill();
          (S.deko.tische[xx + "," + y] || []).forEach(d => kramMalen(x, d.art, px + d.ox * C, py + d.oy * C, d.rot, 0.85));
        }
      } else if (z === "=") {
        const holz = !th.stein || S.def.n === 4 && S.def.ziel !== "truhe" || S.def.n === 6 && S.def.ziel === "schluessel"; // Tresen bzw. Marktstände
        const l = zeichen(xx - 1, y) === "=" || zeichen(xx - 1, y) === "K", rr = zeichen(xx + 1, y) === "=" || zeichen(xx + 1, y) === "K", o = zeichen(xx, y - 1) === "=", u = zeichen(xx, y + 1) === "=";
        const x0 = px + (l ? 0 : 3), x1 = px + C - (rr ? 0 : 3), y0 = py + (o ? 0 : 3), y1 = py + C - (u ? 0 : 3);
        x.fillStyle = holz ? "#4a321f" : "#3d3a40"; x.fillRect(x0, y0, x1 - x0, y1 - y0);
        x.fillStyle = holz ? "#6a4a2e" : "#57525a"; x.fillRect(x0, y0, x1 - x0, 3);
        if (!holz && S.def.n === 5) { x.strokeStyle = "rgba(0,0,0,.4)"; x.strokeRect(x0 + 3, y0 + 3, x1 - x0 - 6, y1 - y0 - 6); }
        (S.deko.tische[xx + "," + y] || []).forEach(d => kramMalen(x, d.art, px + d.ox * C, py + d.oy * C, d.rot, 0.8));
      } else if (z === "O") {
        const cx = px + C / 2, cy = py + C / 2;
        x.fillStyle = "rgba(0,0,0,.35)"; x.beginPath(); x.arc(cx + 2, cy + 3, C * 0.38, 0, 7); x.fill();
        x.fillStyle = "#4e3520"; x.beginPath(); x.arc(cx, cy, C * 0.38, 0, 7); x.fill();
        x.strokeStyle = "#2a1c10"; x.lineWidth = 2; x.beginPath(); x.arc(cx, cy, C * 0.38, 0, 7); x.stroke();
        x.strokeStyle = "#7a6a58"; x.lineWidth = 1.5; x.beginPath(); x.arc(cx, cy, C * 0.29, 0, 7); x.stroke();
        x.fillStyle = "#3a2716"; x.beginPath(); x.arc(cx, cy, C * 0.22, 0, 7); x.fill();
        const fv = (xx * 7 + y * 13 + S.def.dekoSeed) % 4; // Fässer sehen nicht alle gleich aus
        if (fv === 0) { x.fillStyle = "#6a5a48"; x.beginPath(); x.arc(cx + C * 0.08, cy - C * 0.05, 2.2, 0, 7); x.fill(); }
        else if (fv === 1) { x.strokeStyle = "rgba(201,178,138,.5)"; x.lineWidth = 1; x.beginPath(); x.moveTo(cx - C * 0.2, cy); x.lineTo(cx + C * 0.2, cy); x.stroke(); }
        else if (fv === 2) { x.fillStyle = "rgba(122,40,30,.55)"; x.beginPath(); x.ellipse(cx + C * 0.3, cy + C * 0.32, 4, 2.4, 0.3, 0, 7); x.fill(); }
      } else if (z === "c") {
        const cx = px + C / 2, cy = py + C / 2;
        x.fillStyle = "#2a2622"; x.beginPath(); x.arc(cx, cy + 4, 6, 0, 7); x.fill();
        x.fillStyle = "#3e3832"; x.fillRect(cx - 1.5, cy - 6, 3, 10);
        x.fillStyle = "#e8dcc0"; x.fillRect(cx - 2.5, cy - 10, 5, 6);
      } else if (z === "L") {
        const cx = px + C / 2, cy = py + C / 2;
        x.fillStyle = "#2b2622"; x.fillRect(cx - 7, cy - 7, 14, 14);
        x.strokeStyle = "#5a5048"; x.lineWidth = 1.5; x.strokeRect(cx - 7, cy - 7, 14, 14);
      } else if (z === "F") {
        const cx = px + C / 2, cy = py + C / 2;
        x.fillStyle = "#2a2522"; x.beginPath(); x.arc(cx, cy, C * 0.46, 0, 7); x.fill();
        for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4; x.fillStyle = k % 2 ? "#4a423c" : "#5a5048"; x.beginPath(); x.arc(cx + Math.cos(a) * C * 0.38, cy + Math.sin(a) * C * 0.38, 4, 0, 7); x.fill(); }
        x.fillStyle = "#140f0c"; x.beginPath(); x.arc(cx, cy, C * 0.26, 0, 7); x.fill();
      } else if (z === "V") { // Lava
        const v = x.createRadialGradient(px + C / 2, py + C / 2, 2, px + C / 2, py + C / 2, C * 0.75);
        v.addColorStop(0, "#ffb347"); v.addColorStop(0.45, "#e5531c"); v.addColorStop(1, "#7a1a0c");
        x.fillStyle = v; x.fillRect(px, py, C, C);
        x.strokeStyle = "rgba(60,14,6,.75)"; x.lineWidth = 2;
        for (let k = 0; k < 3; k++) { x.beginPath(); x.moveTo(px + r() * C, py + r() * C); x.quadraticCurveTo(px + r() * C, py + r() * C, px + r() * C, py + r() * C); x.stroke(); }
        x.lineWidth = 1;
      } else if (z === "D") {
        x.fillStyle = "rgba(224,160,70,.12)"; x.fillRect(px, py, C, C);
        for (let k = 0; k < 6; k++) { x.fillStyle = r() < 0.5 ? "#c98a3a" : "#e0a046"; x.beginPath(); x.arc(px + r() * C, py + r() * C, 2 + r() * 2, 0, 7); x.fill(); }
      }
    }
    kulisseMalen(x, th);
    hgBild = c;
  }

  /* ---------- Kulisse malen (einmal je Stufe ins Hintergrundbild) ---------- */
  function rauten(x, cx, cy, k) { x.beginPath(); x.moveTo(cx, cy - k); x.lineTo(cx + k, cy); x.lineTo(cx, cy + k); x.lineTo(cx - k, cy); x.closePath(); }
  function bodenFleckenMalen(x) {
    S.deko.flecken.forEach(f => {
      const r = lcg(1 + (f.saat || 7919) % 2147483000);
      if (f.art === "teppich") {
        const [g, h, rand] = f.farbe, px = f.x * C + 3, py = f.y * C + 3, w = f.w * C - 6, hh = f.h * C - 6;
        x.fillStyle = "rgba(0,0,0,.3)"; x.fillRect(px + 2, py + 3, w, hh);
        x.fillStyle = g; x.fillRect(px, py, w, hh);
        x.globalAlpha = 0.6; x.strokeStyle = rand; x.lineWidth = 1.5; x.strokeRect(px + 3.5, py + 3.5, w - 7, hh - 7); x.globalAlpha = 1;
        x.strokeStyle = h; x.lineWidth = 1; x.strokeRect(px + 7, py + 7, w - 14, hh - 14);
        const n = Math.max(1, Math.round((f.lang ? hh : w) / 30)), k = Math.min(w, hh) * 0.2;
        for (let i = 0; i < n; i++) {
          const cx = f.lang ? px + w / 2 : px + (i + 0.5) * w / n, cy = f.lang ? py + (i + 0.5) * hh / n : py + hh / 2;
          x.fillStyle = h; rauten(x, cx, cy, k); x.fill();
          x.globalAlpha = 0.55; x.strokeStyle = rand; rauten(x, cx, cy, k * 0.55); x.stroke(); x.globalAlpha = 1;
        }
        x.globalAlpha = 0.55; x.strokeStyle = rand; x.lineWidth = 1; x.beginPath();
        if (f.lang) for (let k2 = px + 2; k2 < px + w - 1; k2 += 3) { x.moveTo(k2, py); x.lineTo(k2, py - 3); x.moveTo(k2, py + hh); x.lineTo(k2, py + hh + 3); }
        else for (let k2 = py + 2; k2 < py + hh - 1; k2 += 3) { x.moveTo(px, k2); x.lineTo(px - 3, k2); x.moveTo(px + w, k2); x.lineTo(px + w + 3, k2); }
        x.stroke(); x.globalAlpha = 1;
        for (let i = 0; i < 6; i++) { x.fillStyle = "rgba(0,0,0,.1)"; x.beginPath(); x.ellipse(px + r() * w, py + r() * hh, 3 + r() * 6, 2 + r() * 3, r() * 3, 0, 7); x.fill(); }
        return;
      }
      f.zellen.forEach(z => {
        const px = z.x * C, py = z.y * C, cx = px + C / 2, cy = py + C / 2;
        if (f.art === "stroh") {
          x.fillStyle = "rgba(160,130,60,.16)"; x.beginPath(); x.arc(cx, cy, C * 0.58, 0, 7); x.fill();
          x.lineWidth = 1.1; x.lineCap = "round";
          for (let i = 0; i < 30; i++) {
            const a = r() * Math.PI, l = 3 + r() * 6, sx = px + r() * C, sy = py + r() * C;
            x.strokeStyle = ["#b89a52", "#9a7e3e", "#d0b46a", "#7a6230"][i % 4]; x.globalAlpha = 0.75;
            x.beginPath(); x.moveTo(sx, sy); x.lineTo(sx + Math.cos(a) * l, sy + Math.sin(a) * l); x.stroke();
          }
          x.globalAlpha = 1;
        } else if (f.art === "moos") {
          for (let i = 0; i < 6; i++) { x.fillStyle = "rgba(58,86,42,.24)"; x.beginPath(); x.arc(px + r() * C, py + r() * C, 4 + r() * 7, 0, 7); x.fill(); }
          for (let i = 0; i < 10; i++) { x.fillStyle = "rgba(130,160,80,.28)"; x.beginPath(); x.arc(px + r() * C, py + r() * C, 0.9 + r() * 1.1, 0, 7); x.fill(); }
        } else if (f.art === "asche") {
          for (let i = 0; i < 5; i++) { x.fillStyle = "rgba(128,122,116,.2)"; x.beginPath(); x.arc(px + r() * C, py + r() * C, 5 + r() * 7, 0, 7); x.fill(); }
          for (let i = 0; i < 12; i++) { x.fillStyle = r() < 0.2 ? "rgba(224,120,60,.35)" : "rgba(20,18,16,.5)"; x.fillRect(px + r() * C, py + r() * C, 1.4, 1.4); }
        } else if (f.art === "kies") {
          for (let i = 0; i < 18; i++) {
            const ex = px + 2 + r() * (C - 4), ey = py + 2 + r() * (C - 4), rr = 1.2 + r() * 2.2;
            x.fillStyle = ["#5a5450", "#6e6660", "#48423e", "#7a7068"][i % 4]; x.beginPath(); x.ellipse(ex, ey, rr, rr * 0.75, r() * 3, 0, 7); x.fill();
            x.fillStyle = "rgba(255,255,255,.12)"; x.beginPath(); x.arc(ex - rr * 0.3, ey - rr * 0.3, rr * 0.35, 0, 7); x.fill();
          }
        } else if (f.art === "muenzen") {
          for (let i = 0; i < 13; i++) {
            const ex = px + 2 + r() * (C - 4), ey = py + 2 + r() * (C - 4), rr = 1.8 + r() * 1.2;
            x.fillStyle = r() < 0.5 ? "#8a6a2a" : "#a07a30"; x.beginPath(); x.ellipse(ex, ey, rr, rr * (0.4 + r() * 0.6), r() * 3, 0, 7); x.fill();
            x.strokeStyle = "rgba(60,40,16,.7)"; x.lineWidth = 0.6; x.stroke();
          }
        } else if (f.art === "pfuetze" || f.art === "wein") {
          const wein = f.art === "wein";
          x.fillStyle = wein ? "rgba(70,22,34,.42)" : "rgba(22,20,26,.4)";
          for (let k = 0; k < 3; k++) { x.beginPath(); x.ellipse(cx + (r() - 0.5) * 10, cy + (r() - 0.5) * 9, C * (0.2 + r() * 0.22), C * (0.14 + r() * 0.12), r() * 3, 0, 7); x.fill(); }
          x.strokeStyle = wein ? "rgba(200,90,90,.22)" : "rgba(235,226,204,.2)"; x.lineWidth = 1.2;
          x.beginPath(); x.ellipse(cx - 3, cy - 2, C * 0.22, C * 0.1, -0.4, 3.6, 5.2); x.stroke();
        }
      });
    });
  }
  /* kleiner Krimskrams (Boden und Tische) */
  function kramMalen(x, art, px, py, rot, alpha) {
    x.save(); x.translate(px, py); x.rotate(rot || 0); x.globalAlpha = alpha == null ? 1 : alpha;
    const kreis = (cx, cy, rr, f) => { x.fillStyle = f; x.beginPath(); x.arc(cx, cy, rr, 0, 7); x.fill(); };
    const ell = (cx, cy, a, b, f, w) => { x.fillStyle = f; x.beginPath(); x.ellipse(cx, cy, a, b, w || 0, 0, 7); x.fill(); };
    const strich = (x1, y1, x2, y2, f, lw) => { x.strokeStyle = f; x.lineWidth = lw || 1; x.lineCap = "round"; x.beginPath(); x.moveTo(x1, y1); x.lineTo(x2, y2); x.stroke(); };
    switch (art) {
      case "krug": x.fillStyle = "#5a3a1a"; x.fillRect(2.4, -1, 2.6, 2); kreis(0, 0, 3.6, "#8a6a44"); kreis(0, 0, 2.5, "#e8d8a8"); kreis(-0.6, -0.6, 0.9, "#fff6dc"); break;
      case "teller": kreis(0, 0, 4.4, "#b9a88a"); x.strokeStyle = "#8a7a5a"; x.lineWidth = 0.7; x.beginPath(); x.arc(0, 0, 3, 0, 7); x.stroke(); kreis(1, -0.6, 1.2, "#8a5a2a"); kreis(-1.2, 1, 0.8, "#a07a40"); break;
      case "brot": ell(0, 0, 4.2, 2.6, "#a8702e"); strich(-1.5, -1.6, -0.6, 1.6, "#d8a860", 0.8); strich(0.8, -1.6, 1.7, 1.6, "#d8a860", 0.8); break;
      case "wuerfel": [[-2.2, 0], [2, 1.2]].forEach(([dx, dy], i) => { x.save(); x.translate(dx, dy); x.rotate(i * 0.7); x.fillStyle = "#ebe2cc"; x.fillRect(-1.8, -1.8, 3.6, 3.6); x.fillStyle = "#2a2118"; x.fillRect(-0.5, -0.5, 1, 1); if (i) { x.fillRect(-1.3, -1.3, 0.8, 0.8); x.fillRect(0.6, 0.6, 0.8, 0.8); } x.restore(); }); break;
      case "knochen": strich(-4, 0, 4, 0, "#d8ccb0", 1.6); [-4, 4].forEach(e => { kreis(e, -1, 1.2, "#d8ccb0"); kreis(e, 1, 1.2, "#d8ccb0"); }); break;
      case "pfeife": strich(-4, 0, 2, 0, "#4a3020", 1.2); kreis(3, 0, 1.8, "#5a3a20"); kreis(3, 0, 0.9, "#1a1008"); break;
      case "flasche": ell(0, 0, 4.6, 2.2, "#34421f"); x.fillStyle = "#34421f"; x.fillRect(4, -0.8, 2.6, 1.6); ell(-1, -0.8, 2.4, 0.6, "rgba(235,226,204,.25)"); break;
      case "korken": ell(0, 0, 1.6, 1.1, "#b08a5a"); break;
      case "kiste": x.fillStyle = "rgba(0,0,0,.3)"; x.fillRect(-4, -3, 10, 9); x.fillStyle = "#5a3e22"; x.fillRect(-5, -5, 10, 10); x.strokeStyle = "#3a2612"; x.lineWidth = 1; x.strokeRect(-4.5, -4.5, 9, 9); strich(-4.5, -4.5, 4.5, 4.5, "#3a2612", 1); break;
      case "papier": x.fillStyle = "#d8ccb0"; x.fillRect(-3.5, -4.5, 7, 9); for (let i = -2; i <= 3; i += 1.6) strich(-2.4, i, 2.4, i, "rgba(60,40,30,.5)", 0.5); break;
      case "trank": kreis(0, 0, 3, "#7a2a6a"); kreis(-0.9, -0.9, 0.8, "rgba(255,230,255,.5)"); x.fillStyle = "#6a5a48"; x.fillRect(-0.8, -4.6, 1.6, 2); break;
      case "buch": x.fillStyle = "#5a1c18"; x.fillRect(-4, -5, 8, 10); x.fillStyle = "#e8dcc0"; x.fillRect(3, -4.4, 1, 8.8); strich(-2.5, -2, 1.5, -2, "#c98a3a", 0.8); break;
      case "kerzenstumpf": kreis(0, 0, 2.6, "#e8dcc0"); ell(1.6, 1.4, 1.6, 0.8, "#d8ccb0"); kreis(0, 0, 0.6, "#1a1210"); break;
      case "karten": [-0.5, 0, 0.5].forEach((w, i) => { x.save(); x.rotate(w); x.fillStyle = "#ebe2cc"; x.fillRect(-2, -3.4, 4, 6); x.fillStyle = i === 1 ? "#9b231b" : "#2a2118"; x.fillRect(-0.6, -1.2, 1.2, 1.6); x.restore(); }); break;
      case "schaedel": kreis(0, 0, 3.8, "#d8ccb0"); x.fillStyle = "#d8ccb0"; x.fillRect(-2, 2, 4, 2.2); kreis(-1.3, -0.2, 1, "#2a2118"); kreis(1.3, -0.2, 1, "#2a2118"); break;
      case "kette": for (let i = -2; i <= 2; i++) { x.strokeStyle = "#6a6460"; x.lineWidth = 0.9; x.beginPath(); x.ellipse(i * 2.4, 0, 1.6, i % 2 ? 0.6 : 1.1, 0, 0, 7); x.stroke(); } break;
      case "speer": strich(-8, 0, 6, 0, "#6a5030", 1.3); x.fillStyle = "#a8a29a"; x.beginPath(); x.moveTo(6, -1.4); x.lineTo(9.5, 0); x.lineTo(6, 1.4); x.fill(); break;
      case "helm": x.fillStyle = "#6e6862"; x.beginPath(); x.arc(0, 0, 4, Math.PI, 0); x.lineTo(4, 1.2); x.lineTo(-4, 1.2); x.fill(); strich(0, -4, 0, 1, "#8a847e", 0.8); break;
      case "stein": ell(0, 0, 3.4, 2.4, "#4e4844"); ell(-0.8, -0.6, 1.2, 0.7, "rgba(255,255,255,.1)"); break;
      case "barren": x.fillStyle = "#8a847e"; x.fillRect(-3.6, -1.8, 7.2, 3.6); x.fillStyle = "#a8a29a"; x.fillRect(-3, -1.8, 6, 1.2); break;
      case "zange": strich(-4, -2, 4, 1.5, "#5a5450", 1.1); strich(-4, 2, 4, -1.5, "#5a5450", 1.1); break;
      case "kohle": [[-2, 0], [1.5, -1], [0.5, 1.8], [2.4, 1.6]].forEach(([dx, dy]) => kreis(dx, dy, 1.4, "#141010")); kreis(1.5, -1, 0.6, "rgba(255,120,50,.65)"); break;
      case "rune": x.strokeStyle = "rgba(196,86,74,.5)"; x.lineWidth = 0.9; x.beginPath(); x.arc(0, 0, 4.6, 0, 7); x.stroke(); strich(-2, -2.6, 0, 2.6, "rgba(220,110,90,.6)", 0.9); strich(2, -2.6, 0, 2.6, "rgba(220,110,90,.6)", 0.9); strich(-2.6, 0, 2.6, 0, "rgba(220,110,90,.6)", 0.9); break;
      case "napf": kreis(0, 0, 3.4, "#5a5048"); kreis(0, 0, 2.2, "#2a2420"); break;
      case "eier": [[-2, -1], [1.8, -0.6], [0, 2]].forEach(([dx, dy]) => ell(dx, dy, 1.9, 2.4, "#d8d0c0")); x.strokeStyle = "rgba(235,226,204,.35)"; x.lineWidth = 0.5; x.beginPath(); x.moveTo(-5, -3); x.lineTo(5, 3); x.moveTo(-5, 3); x.lineTo(5, -3); x.stroke(); break;
      case "pilz": [[-2, 0, "#6a4a7a"], [1.6, -1.4, "#4a6a3a"], [1.2, 1.8, "#6a4a7a"]].forEach(([dx, dy, f]) => { kreis(dx, dy, 1.9, f); kreis(dx - 0.5, dy - 0.5, 0.5, "rgba(230,210,255,.55)"); }); break;
      case "kristall": x.fillStyle = "#7a4aa0"; x.beginPath(); x.moveTo(0, -5); x.lineTo(2, 0); x.lineTo(0, 3); x.lineTo(-2, 0); x.fill(); x.fillStyle = "#a07ac8"; x.beginPath(); x.moveTo(0, -5); x.lineTo(2, 0); x.lineTo(0, 0); x.fill(); x.fillStyle = "#5a3a80"; x.beginPath(); x.moveTo(3, -2); x.lineTo(4.4, 1); x.lineTo(2.6, 2.4); x.fill(); break;
      case "stoff": x.fillStyle = "#7a2a22"; x.fillRect(-5, -3, 10, 6); strich(-5, -0.5, 5, 0.5, "rgba(0,0,0,.25)", 1); strich(-2, -3, -1, 3, "rgba(255,200,150,.15)", 1); break;
      case "lumpen": ell(0, 0, 4.5, 3, "#4a3a2a", 0.4); ell(1.5, 0.6, 2.2, 1.4, "#5a4a34", 0.9); break;
      case "schlacke": [[-1.6, 0], [1.8, 0.8], [0, -1.8]].forEach(([dx, dy]) => { kreis(dx, dy, 1.8, "#1e1814"); }); kreis(0.6, 0.4, 0.8, "rgba(255,110,40,.5)"); break;
      default: kreis(0, 0, 2, "#5a5048");
    }
    x.restore();
  }
  /* Wandschmuck: auf der sichtbaren Vorderseite eines Wandstücks (unteres Drittel der Zelle) */
  function wandMalen(x, w) {
    const px = w.x * C, py = w.y * C, cx = px + C / 2, fy = py + C * 0.8, s = w.s;
    const strich = (x1, y1, x2, y2, f, lw) => { x.strokeStyle = f; x.lineWidth = lw || 1; x.lineCap = "round"; x.beginPath(); x.moveTo(x1, y1); x.lineTo(x2, y2); x.stroke(); };
    const kreis = (kx, ky, rr, f) => { x.fillStyle = f; x.beginPath(); x.arc(kx, ky, rr, 0, 7); x.fill(); };
    switch (w.art) {
      case "schild": kreis(cx, fy - 2, 6.5, ["#7a2a22", "#5a4220", "#2f4428", "#4a2238"][Math.floor(s * 4)]); x.strokeStyle = "#a8a29a"; x.lineWidth = 1.4; x.beginPath(); x.arc(cx, fy - 2, 6.5, 0, 7); x.stroke(); kreis(cx, fy - 2, 1.8, "#c9b28a"); break;
      case "geweih": [-1, 1].forEach(sg => { strich(cx, fy, cx + sg * 7, fy - 7, "#c9b28a", 1.4); strich(cx + sg * 3.5, fy - 3.5, cx + sg * 2, fy - 8, "#c9b28a", 1.1); strich(cx + sg * 5.5, fy - 5.5, cx + sg * 9, fy - 5, "#c9b28a", 1.1); }); kreis(cx, fy, 2.2, "#5a3a20"); break;
      case "dartscheibe": kreis(cx, fy - 1, 6, "#3a2a1a"); kreis(cx, fy - 1, 4.5, "#c9b28a"); kreis(cx, fy - 1, 3, "#7a2a22"); kreis(cx, fy - 1, 1.2, "#ebe2cc"); strich(cx + 1, fy - 2, cx + 5, fy - 5, "#a8a29a", 0.9); break;
      case "regal": x.fillStyle = "#4a321f"; x.fillRect(px + 3, fy + 1, C - 6, 2); [0.25, 0.45, 0.68].forEach((k, i) => { x.fillStyle = ["#34421f", "#7a2a6a", "#8a6a44"][i]; x.fillRect(px + C * k, fy - 5 + i % 2, 3, 6 - i % 2); }); break;
      case "weinregal": x.fillStyle = "#2a1a10"; x.fillRect(px + 2, py + C * 0.62, C - 4, C * 0.38); for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) kreis(px + 6 + i * (C - 12) / 3, py + C * 0.72 + j * 5, 1.9, (i + j) % 3 ? "#4a0e14" : "#34421f"); break;
      case "kette": for (let i = 0; i < 5; i++) { x.strokeStyle = "#6a6460"; x.lineWidth = 1; x.beginPath(); x.ellipse(cx + Math.sin(i) * 1.5, py + C * 0.66 + i * 3.4, i % 2 ? 0.8 : 1.5, 1.9, 0, 0, 7); x.stroke(); } break;
      case "buecher": x.fillStyle = "#4a321f"; x.fillRect(px + 2, fy + 2, C - 4, 2); for (let i = 0; i < 7; i++) { x.fillStyle = ["#5a1c18", "#2f4428", "#5a4220", "#4a2238", "#7a5a2c"][i % 5]; x.fillRect(px + 4 + i * 3.6, fy - 6 + (i % 3), 3, 8 - (i % 3)); } break;
      case "banner": {
        const rot = S.def.n <= 2 ? "#8a1e18" : S.def.n === 6 || S.def.n === 4 ? "#4a4644" : "#3a2a50";
        x.fillStyle = rot; x.beginPath(); x.moveTo(cx - 6, py + C * 0.6); x.lineTo(cx + 6, py + C * 0.6); x.lineTo(cx + 6, py + C * 1.22); x.lineTo(cx, py + C * 1.1); x.lineTo(cx - 6, py + C * 1.22); x.closePath(); x.fill();
        x.strokeStyle = "#c98a3a"; x.lineWidth = 0.9; x.stroke(); kreis(cx, py + C * 0.84, 2.4, "#c98a3a"); strich(cx - 7, py + C * 0.6, cx + 7, py + C * 0.6, "#4a3020", 1.6); break; }
      case "riss": x.strokeStyle = "rgba(0,0,0,.55)"; x.lineWidth = 1; x.beginPath(); x.moveTo(px + C * (0.2 + s * 0.5), py + C * 0.1); x.lineTo(px + C * (0.35 + s * 0.3), py + C * 0.45); x.lineTo(px + C * (0.25 + s * 0.4), py + C * 0.7); x.lineTo(px + C * (0.4 + s * 0.3), py + C * 0.98); x.stroke(); break;
      case "efeu": for (let i = 0; i < 9; i++) { const lx = px + 3 + (i / 8) * (C - 6), ly = py + C * (0.55 + 0.4 * Math.abs(Math.sin(i * 1.7 + s * 6))); x.fillStyle = i % 2 ? "#3d5a2a" : "#4f7034"; x.beginPath(); x.ellipse(lx, ly, 2.6, 1.6, i, 0, 7); x.fill(); } break;
      case "waffen": strich(cx - 8, fy + 4, cx + 6, fy - 8, "#a8a29a", 1.4); strich(cx + 8, fy + 4, cx - 6, fy - 8, "#a8a29a", 1.4); strich(cx - 8, fy + 4, cx - 5, fy + 1, "#5a3a20", 2.4); strich(cx + 8, fy + 4, cx + 5, fy + 1, "#5a3a20", 2.4); break;
      case "tropfstein": for (let i = 0; i < 3; i++) { const tx = px + C * (0.2 + i * 0.3 + s * 0.1); x.fillStyle = "#3a322c"; x.beginPath(); x.moveTo(tx - 3, py + C * 0.97); x.lineTo(tx + 3, py + C * 0.97); x.lineTo(tx, py + C * 1.2 + i * 2); x.fill(); } break;
      case "werkzeug": strich(cx - 5, fy - 7, cx - 5, fy + 3, "#5a3a20", 1.4); x.fillStyle = "#6e6862"; x.fillRect(cx - 8, fy - 8, 6, 3); strich(cx + 3, fy - 7, cx + 6, fy + 3, "#5a5450", 1.1); strich(cx + 7, fy - 7, cx + 4, fy + 3, "#5a5450", 1.1); break;
      case "zahnrad": x.fillStyle = "#5a5450"; for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; x.fillRect(cx + Math.cos(a) * 5.5 - 1.2, fy - 1 + Math.sin(a) * 5.5 - 1.2, 2.4, 2.4); } kreis(cx, fy - 1, 5, "#6a6460"); kreis(cx, fy - 1, 1.8, "#2a2420"); break;
      case "kristall": [[-4, 0, 6], [0, -2, 9], [4, 1, 5]].forEach(([dx, dy, hh]) => { x.fillStyle = "#7a4aa0"; x.beginPath(); x.moveTo(cx + dx - 2, fy + 4); x.lineTo(cx + dx, fy + 4 - hh + dy); x.lineTo(cx + dx + 2, fy + 4); x.fill(); x.fillStyle = "rgba(200,170,240,.5)"; x.fillRect(cx + dx - 0.4, fy + 4 - hh + dy + 2, 0.8, hh - 3); }); break;
      case "netz": x.strokeStyle = "rgba(235,226,204,.3)"; x.lineWidth = 0.6; for (let i = 0; i < 6; i++) { const a = Math.PI * (0.05 + i * 0.18); x.beginPath(); x.moveTo(cx, py + C * 0.62); x.lineTo(cx + Math.cos(a) * 12, py + C * 0.62 + Math.sin(a) * 12); x.stroke(); } for (let k = 1; k <= 3; k++) { x.beginPath(); x.arc(cx, py + C * 0.62, k * 3.6, 0.15, Math.PI - 0.15); x.stroke(); } break;
      case "glutriss": x.strokeStyle = "rgba(255,120,40,.65)"; x.lineWidth = 1.3; x.beginPath(); x.moveTo(px + C * 0.15, py + C * (0.6 + s * 0.2)); x.lineTo(px + C * 0.45, py + C * 0.8); x.lineTo(px + C * 0.6, py + C * 0.65); x.lineTo(px + C * 0.9, py + C * 0.9); x.stroke(); break;
    }
  }
  /* Glasfläche eines Fensters (Kartenkoordinaten ohne OY) */
  function fensterGlas(f) {
    const px = f.x * C, py = f.y * C;
    if (f.dy) return { x0: px + C * 0.22, y0: py + C * 0.64, x1: px + C * 0.78, y1: py + C * 0.95 };
    return f.dx > 0 ? { x0: px + C * 0.74, y0: py + C * 0.2, x1: px + C * 0.95, y1: py + C * 0.8 } : { x0: px + C * 0.05, y0: py + C * 0.2, x1: px + C * 0.26, y1: py + C * 0.8 };
  }
  function kulisseMalen(x) {
    const d = S.deko;
    /* Spinnweben in den Ecken */
    d.ecken.forEach(e => {
      const ox = e.x * C + (e.ecke ? C : 0), oy = e.y * C, sg = e.ecke ? -1 : 1, R = C * 0.6 * e.s;
      x.strokeStyle = "rgba(235,226,204,.22)"; x.lineWidth = 0.6;
      for (let i = 0; i <= 4; i++) { const a = i / 4 * Math.PI / 2; x.beginPath(); x.moveTo(ox, oy); x.lineTo(ox + sg * Math.cos(a) * R, oy + Math.sin(a) * R); x.stroke(); }
      for (let k = 1; k <= 3; k++) { x.beginPath(); for (let i = 0; i <= 4; i++) { const a = i / 4 * Math.PI / 2, rr = R * k / 3.4 * (i % 2 ? 0.9 : 1); const fx = ox + sg * Math.cos(a) * rr, fy = oy + Math.sin(a) * rr; if (i) x.lineTo(fx, fy); else x.moveTo(fx, fy); } x.stroke(); }
    });
    /* Fensterrahmen (das Glas selbst leuchtet später im Spiel) */
    d.fenster.forEach(f => {
      const g = fensterGlas(f);
      x.fillStyle = "#1e140c"; x.fillRect(g.x0 - 2, g.y0 - 2, g.x1 - g.x0 + 4, g.y1 - g.y0 + 4);
      x.fillStyle = "#14100c"; x.fillRect(g.x0, g.y0, g.x1 - g.x0, g.y1 - g.y0);
      if (f.dy) { x.fillStyle = "#4a3a2a"; x.fillRect(g.x0 - 3, g.y1 + 1, g.x1 - g.x0 + 6, 2.2); }
    });
    d.wand.forEach(w => wandMalen(x, w));
    d.kram.forEach(k => kramMalen(x, k.art, k.x * C + k.ox * C, k.y * C + k.oy * C, k.rot, 0.8));
  }

  /* ---------- Kulisse im Spiel (bewegt) ---------- */
  function fensterZeichnen() {
    const d = S.deko; if (!d || !d.fenster.length) return;
    const st = S.stimmung || {}, m = S.mond ? S.mond.m : 0.35, blitz = S.blitzT > 0 || (S.gew && S.gew.leuchten && Math.sin(S.zeit * 37) > 0.55);
    d.fenster.forEach((f, fi) => {
      const g = fensterGlas(f), x0 = g.x0, y0 = OY + g.y0, w = g.x1 - g.x0, h = g.y1 - g.y0;
      let farbe = st.wetter === "regen" ? "rgba(150,146,138,.5)" : st.wetter === "nebel" ? "rgba(196,192,182,.45)" : st.wetter === "gewitter" ? "rgba(110,108,104,.5)" : "rgba(228,220,194," + (0.22 + 0.55 * m).toFixed(2) + ")";
      if (blitz) farbe = "rgba(255,255,246,.92)";
      if (st.zeit === "daemmerung" && !blitz) farbe = "rgba(232,160,110," + (0.3 + 0.3 * m).toFixed(2) + ")";
      ctx.fillStyle = farbe; ctx.fillRect(x0, y0, w, h);
      ctx.save(); ctx.beginPath(); ctx.rect(x0, y0, w, h); ctx.clip();
      if (st.wetter === "regen" || st.wetter === "gewitter") {
        ctx.strokeStyle = "rgba(240,238,230,.55)"; ctx.lineWidth = 0.8;
        for (let i = 0; i < 4; i++) { const k = ruhig ? (i * 0.29) % 1 : (S.zeit * 1.9 + i * 0.37 + fi * 0.21) % 1, rx = x0 + (i + 0.5) / 4 * w; ctx.beginPath(); ctx.moveTo(rx, y0 + k * h * 1.3 - h * 0.3); ctx.lineTo(rx - 1, y0 + k * h * 1.3); ctx.stroke(); }
      } else if (st.wetter === "schnee") {
        ctx.fillStyle = "rgba(255,255,250,.85)";
        for (let i = 0; i < 5; i++) { const k = ruhig ? (i * 0.23) % 1 : (S.zeit * 0.35 + i * 0.2 + fi * 0.13) % 1; ctx.beginPath(); ctx.arc(x0 + ((i * 0.37 + Math.sin(S.zeit + i) * 0.08) % 1) * w, y0 + k * h, 0.9, 0, 7); ctx.fill(); }
      } else if (st.wetter === "wind" && !ruhig) {
        ctx.strokeStyle = "rgba(20,16,12,.7)"; ctx.lineWidth = 1.2; const sw = Math.sin(S.zeit * 2.6 + fi) * 2.5;
        ctx.beginPath(); ctx.moveTo(x0 - 2, y0 + h * 0.75); ctx.quadraticCurveTo(x0 + w * 0.5, y0 + h * 0.4 + sw, x0 + w + 2, y0 + h * 0.2 + sw); ctx.stroke();
      }
      ctx.restore();
      ctx.fillStyle = "#1e140c";
      if (f.dy) { ctx.fillRect(x0 + w / 2 - 0.8, y0, 1.6, h); ctx.fillRect(x0, y0 + h / 2 - 0.7, w, 1.4); }
      else { ctx.fillRect(x0, y0 + h / 2 - 0.8, w, 1.6); ctx.fillRect(x0 + w / 2 - 0.6, y0, 1.2, h); }
    });
  }
  function mondZeichnen() {
    const M = S.mond; if (!M || M.m < 0.02) return;
    ctx.save(); ctx.translate(0, OY); ctx.scale(C, C);
    M.strahlen.forEach((s, si) => {
      ctx.save(); ctx.clip(s.pfad);
      const g = ctx.createLinearGradient(s.ox, s.oy, s.ex, s.ey);
      g.addColorStop(0, "rgba(232,226,206," + (0.24 * M.m).toFixed(3) + ")"); g.addColorStop(1, "rgba(232,226,206," + (0.05 * M.m).toFixed(3) + ")");
      ctx.globalCompositeOperation = "lighter"; ctx.fillStyle = g; ctx.fill(s.pfad);
      ctx.globalCompositeOperation = "source-over";
      /* Fensterkreuz als Schatten im Lichtstreifen */
      ctx.strokeStyle = "rgba(7,6,14," + (0.32 * M.m).toFixed(3) + ")"; ctx.lineWidth = 0.08;
      ctx.beginPath(); ctx.moveTo(s.ox, s.oy); ctx.lineTo(s.ex, s.ey);
      const mx = (s.ox + s.ex) / 2, my = (s.oy + s.ey) / 2, mb = (s.b0 + s.b1) / 2 + 0.1;
      ctx.moveTo(mx - s.qx * mb, my - s.qy * mb); ctx.lineTo(mx + s.qx * mb, my + s.qy * mb); ctx.stroke();
      if (!ruhig) for (let i = 0; i < 6; i++) { // Staub im Mondlicht
        const u = (S.zeit * 0.045 + i * 0.173 + si * 0.31) % 1, v = Math.sin(S.zeit * 0.35 + i * 2.1) * 0.8, b = s.b0 + (s.b1 - s.b0) * u;
        const fx = s.ox + (s.ex - s.ox) * u + s.qx * v * b, fy = s.oy + (s.ey - s.oy) * u + s.qy * v * b;
        ctx.fillStyle = "rgba(255,250,232," + (0.55 * M.m * Math.sin(u * Math.PI)).toFixed(3) + ")"; ctx.beginPath(); ctx.arc(fx, fy, 0.035, 0, 7); ctx.fill();
      }
      ctx.restore();
    });
    ctx.restore();
  }
  function tiereZeichnen() {
    if (!S.tiere || !S.tiere.length) return;
    ctx.save(); ctx.beginPath(); ctx.rect(0, OY, W, GH); ctx.clip();
    S.tiere.forEach(a => {
      const px = PX(a.x), py = PY(a.y), lauf = a.pfad.length ? Math.sin(S.zeit * 22) : 0;
      ctx.save(); ctx.translate(px, py); ctx.rotate(a.ang);
      if (a.art === "ratte") {
        ctx.strokeStyle = "#6a5a50"; ctx.lineWidth = 0.9; ctx.beginPath(); ctx.moveTo(-4, 0); ctx.quadraticCurveTo(-8, 3 * lauf + 2, -11, lauf * 2); ctx.stroke();
        ctx.fillStyle = "#4a4038"; ctx.beginPath(); ctx.ellipse(0, 0, 4.6, 2.7, 0, 0, 7); ctx.fill();
        ctx.beginPath(); ctx.ellipse(4.4, 0, 2.2, 1.6, 0, 0, 7); ctx.fill();
        ctx.fillStyle = "#a87a70"; [-1, 1].forEach(s => { ctx.beginPath(); ctx.arc(3.4, s * 1.7, 0.9, 0, 7); ctx.fill(); });
      } else if (a.art === "katze") {
        const f = a.farbe;
        if (a.schlaeft && !a.pfad.length) {
          ctx.fillStyle = f; ctx.beginPath(); ctx.arc(0, 0, 5.4, 0, 7); ctx.fill();
          ctx.strokeStyle = f; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, 6, 0.4, 2.6); ctx.stroke();
          ctx.fillStyle = "rgba(0,0,0,.18)"; ctx.beginPath(); ctx.arc(1.4, -1, 2.4, 0, 7); ctx.fill();
        } else {
          const sw = Math.sin(a.t * 3) * 0.5;
          ctx.strokeStyle = f; ctx.lineWidth = 1.8; ctx.lineCap = "round"; ctx.beginPath(); ctx.moveTo(-5, 0); ctx.quadraticCurveTo(-9, sw * 6, -11, sw * 9 + 2); ctx.stroke();
          ctx.fillStyle = f; ctx.beginPath(); ctx.ellipse(-0.5, 0, 5.6, 3.3, 0, 0, 7); ctx.fill();
          ctx.beginPath(); ctx.arc(5, 0, 2.9, 0, 7); ctx.fill();
          [-1, 1].forEach(s => { ctx.beginPath(); ctx.moveTo(5.6, s * 1.2); ctx.lineTo(4.4, s * 3.8); ctx.lineTo(7, s * 2.2); ctx.fill(); });
        }
      } else if (a.art === "spinne") {
        ctx.strokeStyle = "#2a2226"; ctx.lineWidth = 0.7;
        for (let i = 0; i < 4; i++) [-1, 1].forEach(s => { const k = (i - 1.5) * 0.5 + lauf * 0.15; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(k) * 3, s * 2.6); ctx.lineTo(Math.cos(k) * 4.6, s * 4.6); ctx.stroke(); });
        ctx.fillStyle = "#1e181c"; ctx.beginPath(); ctx.ellipse(-0.8, 0, 2.6, 2, 0, 0, 7); ctx.fill(); ctx.beginPath(); ctx.arc(1.8, 0, 1.3, 0, 7); ctx.fill();
      } else if (a.art === "fledermaus" && a.flug) {
        const fl = ruhig ? 0.6 : Math.sin(S.zeit * 24) * 0.8;
        ctx.fillStyle = "#1a1418";
        [-1, 1].forEach(s => { ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(-1, s * 6 * fl, -3, s * 8 * Math.abs(fl) + s); ctx.lineTo(-1.5, s * 2.5); ctx.closePath(); ctx.fill(); });
        ctx.beginPath(); ctx.ellipse(0, 0, 2.6, 1.6, 0, 0, 7); ctx.fill();
      }
      ctx.restore();
    });
    ctx.restore();
  }
  function tierAugen() {
    (S.tiere || []).forEach(a => {
      if (a.art !== "katze" || a.schlaeft && !a.pfad.length) return;
      const ax = PX(a.x) + Math.cos(a.ang) * 5.6, ay = PY(a.y) + Math.sin(a.ang) * 5.6, qx = Math.cos(a.ang + Math.PI / 2), qy = Math.sin(a.ang + Math.PI / 2);
      ctx.fillStyle = "rgba(240,190,80,.85)"; [-1, 1].forEach(s => { ctx.beginPath(); ctx.arc(ax + qx * s * 1.2, ay + qy * s * 1.2, 0.8, 0, 7); ctx.fill(); });
    });
  }
  function ambZeichnen() {
    if (!S.amb || !S.amb.length) return;
    S.amb.forEach(a => {
      const k = a.t / a.max, px = PX(a.x), py = PY(a.y);
      if (a.art === "welle") { ctx.strokeStyle = "rgba(235,226,204," + (0.4 * (1 - k)).toFixed(2) + ")"; ctx.lineWidth = 0.9; ctx.beginPath(); ctx.ellipse(px, py, 2 + k * 8, 1 + k * 4, 0, 0, 7); ctx.stroke(); return; }
      const al = Math.sin(k * Math.PI);
      if (a.art === "staub") { ctx.fillStyle = "rgba(255,236,200," + (0.32 * al).toFixed(2) + ")"; ctx.fillRect(px, py, 1.3, 1.3); }
      else if (a.art === "glut") { ctx.fillStyle = "rgba(255," + (120 + Math.round(80 * (1 - k))) + ",60," + (0.85 * al).toFixed(2) + ")"; ctx.fillRect(px - 0.8, py - 0.8, 1.7, 1.7); }
      else if (a.art === "spore") { ctx.fillStyle = "rgba(" + a.farbe + "," + (0.55 * al).toFixed(2) + ")"; ctx.beginPath(); ctx.arc(px, py, 1.3, 0, 7); ctx.fill(); }
    });
  }
  /* Geräuschringe: so weit war der letzte Schritt zu hören */
  function ringeZeichnen() {
    S.ringe.forEach(r => {
      const k = r.t / 0.75, rad = r.r * C * (ruhig ? 1 : 0.3 + 0.7 * k);
      const farbe = r.f < 0.4 ? "235,226,204" : r.f < 0.85 ? "224,160,70" : "196,86,74";
      ctx.strokeStyle = "rgba(" + farbe + "," + ((1 - k) * (r.f < 0.4 ? 0.3 : 0.55)).toFixed(2) + ")"; ctx.lineWidth = r.f < 0.4 ? 1 : 1.6;
      if (r.f < 0.4) ctx.setLineDash([2, 3]);
      ctx.beginPath(); ctx.arc(PX(r.x), PY(r.y), Math.max(2, rad), 0, 7); ctx.stroke();
      ctx.setLineDash([]);
    });
  }
  /* Leiste für den Taschendiebstahl */
  function griffZeichnen() {
    const g = S.griff; if (!g) return;
    const p = g.p, bw = 108, bh = 16, k = griffK(g), innen = bw - 10;
    let cx = Math.max(bw / 2 + 6, Math.min(W - bw / 2 - 6, PX(p.x))), cy = PY(p.y) - C * 1.05;
    if (cy - bh / 2 < OY + 8) cy = PY(p.y) + C * 1.05;
    const x0 = cx - bw / 2, y0 = cy - bh / 2;
    ctx.save();
    ctx.fillStyle = "rgba(9,8,15,.55)"; ctx.fillRect(x0 - 3, y0 - 3, bw + 6, bh + 6);
    ctx.fillStyle = "#e8dcc0"; ctx.fillRect(x0, y0, bw, bh);
    ctx.strokeStyle = "#5a3a20"; ctx.lineWidth = 1.2; ctx.strokeRect(x0 + 0.5, y0 + 0.5, bw - 1, bh - 1);
    const zx = v => x0 + 5 + innen * v;
    ctx.fillStyle = "#e0a046"; ctx.shadowColor = "#ffcf7a"; ctx.shadowBlur = 8;
    ctx.fillRect(zx(g.zone - g.w / 2), y0 + 2, innen * g.w, bh - 4); ctx.shadowBlur = 0;
    ctx.fillStyle = "#fff0b8"; ctx.fillRect(zx(g.zone - g.w * 0.2), y0 + 2, innen * g.w * 0.4, bh - 4);
    const hx = zx(k);
    ctx.strokeStyle = "#2a2118"; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.moveTo(hx, y0 - 3); ctx.lineTo(hx, y0 + bh + 3); ctx.stroke();
    ctx.font = "13px sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "bottom"; ctx.fillText("✋", hx, y0 - 1);
    if (S.griffTipp) { ctx.font = "600 14px " + FONT_H; ctx.fillStyle = "#ffcf7a"; ctx.textBaseline = "top"; ctx.fillText(t().griff.jetzt, cx, y0 + bh + 3); }
    ctx.restore();
  }
  /* Lärm-Anzeige: fünf Balken, wie laut der letzte Schritt war */
  function laermBalken(x, yBasis, breite, hoehe) {
    const n = Math.min(5, Math.ceil(S.laerm / 1.25 * 5 - 0.01)), bw = (breite - 4 * 2.5) / 5;
    for (let i = 0; i < 5; i++) {
      const h = hoehe * (0.3 + 0.7 * i / 4);
      ctx.fillStyle = i < n ? (S.laerm < 0.4 ? "#ebe2cc" : S.laerm < 0.85 ? "#e0a046" : "#e0563a") : "rgba(235,226,204,.12)";
      ctx.fillRect(x + i * (bw + 2.5), yBasis - h, bw, h);
    }
  }

  function flamme(px, py, gr, phase, farbe) {
    const fl = ruhig ? 1 : 0.85 + 0.15 * Math.sin(S.zeit * 13 + phase) + 0.08 * Math.sin(S.zeit * 31 + phase * 2);
    ctx.save(); ctx.translate(px, py); ctx.scale(fl, 1 / fl);
    ctx.fillStyle = farbe || "#ffcf7a"; ctx.shadowColor = "#e0a046"; ctx.shadowBlur = gr * 2;
    ctx.beginPath(); ctx.moveTo(0, -gr * 1.6); ctx.quadraticCurveTo(gr, -gr * 0.2, 0, gr * 0.5); ctx.quadraticCurveTo(-gr, -gr * 0.2, 0, -gr * 1.6); ctx.fill();
    ctx.fillStyle = "#fff4d0"; ctx.shadowBlur = 0; ctx.beginPath(); ctx.arc(0, gr * 0.05, gr * 0.3, 0, 7); ctx.fill();
    ctx.restore();
  }
  const PX = x => x * C, PY = y => OY + y * C;

  function objekteZeichnen() {
    // Gold
    Object.keys(S.gold).forEach(k => {
      const [x, y] = k.split(",").map(Number), px = PX(x + 0.5), py = PY(y + 0.5);
      for (let i = 0; i < 5; i++) { ctx.fillStyle = i % 2 ? "#c98a3a" : "#e0a046"; ctx.beginPath(); ctx.ellipse(px - 5 + (i % 3) * 5, py + 3 - Math.floor(i / 3) * 4, 4, 2.6, 0, 0, 7); ctx.fill(); }
      const gl = 0.5 + 0.5 * Math.sin(S.zeit * 3 + x);
      ctx.fillStyle = "rgba(255,240,200," + gl.toFixed(2) + ")"; ctx.fillRect(px + 2, py - 4, 2, 2);
    });
    if (S.robe) {
      const px = PX(S.robe.x + 0.5), py = PY(S.robe.y + 0.5);
      ctx.fillStyle = "#3e3832"; ctx.fillRect(px - 2, py - C * 0.45, 4, 5);
      ctx.fillStyle = "#9b231b"; ctx.beginPath(); ctx.moveTo(px - 4, py - C * 0.38); ctx.lineTo(px + 4, py - C * 0.38); ctx.lineTo(px + 10, py + C * 0.36); ctx.lineTo(px - 10, py + C * 0.36); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = "#e0a046"; ctx.lineWidth = 1; ctx.stroke();
    }
    if (S.truhe) {
      const tr = S.truhe, px = PX(tr.x + 0.5), py = PY(tr.y + 0.5);
      if (tr.schwert) {
        ctx.fillStyle = "#3d3a40"; ctx.fillRect(px - C * 0.42, py - C * 0.3, C * 0.84, C * 0.6);
        ctx.fillStyle = "#57525a"; ctx.fillRect(px - C * 0.42, py - C * 0.3, C * 0.84, 3);
        if (!tr.offen) {
          ctx.save(); ctx.shadowColor = "#ffcf7a"; ctx.shadowBlur = 14 + 6 * Math.sin(S.zeit * 2);
          ctx.strokeStyle = "#fff0c0"; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(px - C * 0.36, py); ctx.lineTo(px + C * 0.26, py); ctx.stroke();
          ctx.strokeStyle = "#e0a046"; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(px + C * 0.26, py - 6); ctx.lineTo(px + C * 0.26, py + 6); ctx.stroke();
          ctx.restore();
        }
      } else {
        ctx.fillStyle = "rgba(0,0,0,.35)"; ctx.fillRect(px - C * 0.36 + 2, py - C * 0.24 + 3, C * 0.72, C * 0.5);
        ctx.fillStyle = "#5a3a20"; ctx.fillRect(px - C * 0.36, py - C * 0.24, C * 0.72, C * 0.5);
        ctx.fillStyle = "#c98a3a"; ctx.fillRect(px - C * 0.36, py - C * 0.05, C * 0.72, 3); ctx.fillRect(px - C * 0.2, py - C * 0.24, 3, C * 0.5); ctx.fillRect(px + C * 0.16, py - C * 0.24, 3, C * 0.5);
        if (tr.offen) { ctx.fillStyle = "#2a1a0e"; ctx.fillRect(px - C * 0.32, py - C * 0.2, C * 0.64, C * 0.2); ctx.fillStyle = "#e0a046"; ctx.fillRect(px - C * 0.26, py - C * 0.16, C * 0.52, 4); }
        else if (tr.runen) { ctx.fillStyle = "rgba(196,86,74," + (0.6 + 0.4 * Math.sin(S.zeit * 3)).toFixed(2) + ")"; ctx.font = "10px " + FONT_D; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText("ᛞ", px, py + 3); }
        else { ctx.fillStyle = "#2a2118"; ctx.fillRect(px - 2, py - 2, 4, 6); }
      }
    }
    if (S.ausgang) {
      const a = S.ausgang, px = PX(a.x), py = PY(a.y);
      if (S.offen) {
        const p = 0.55 + 0.45 * Math.sin(S.zeit * 4);
        ctx.fillStyle = "#0b0906"; ctx.fillRect(px + 3, py + 3, C - 6, C - 6);
        ctx.fillStyle = "rgba(224,160,70," + (0.25 + 0.35 * p).toFixed(2) + ")"; ctx.fillRect(px + 3, py + 3, C - 6, C - 6);
        ctx.strokeStyle = "#e0a046"; ctx.lineWidth = 2; ctx.strokeRect(px + 3, py + 3, C - 6, C - 6);
      } else {
        ctx.fillStyle = "#4a321f"; ctx.fillRect(px + 3, py + 3, C - 6, C - 6);
        ctx.strokeStyle = "#2a1c10"; ctx.lineWidth = 1; for (let k = 1; k < 4; k++) { ctx.beginPath(); ctx.moveTo(px + 3, py + 3 + k * (C - 6) / 4); ctx.lineTo(px + C - 3, py + 3 + k * (C - 6) / 4); ctx.stroke(); }
        ctx.fillStyle = "#8a8078"; ctx.beginPath(); ctx.arc(px + C / 2, py + C / 2, 3.5, 0, 7); ctx.fill();
      }
    }
  }
  function lichterZeichnen() {
    S.lichter.forEach(q => {
      const px = PX(q.x + 0.5), py = PY(q.y + 0.5);
      if (q.art === "kerze") {
        if (q.vis > 0.05) { ctx.globalAlpha = Math.min(1, q.vis * 1.2); flamme(px, py - 12, 3.2 * (0.55 + 0.45 * q.vis), q.phase); ctx.globalAlpha = 1; }
        else if (rnd() < 0.02) S.teilchen.push({ x: q.x + 0.5, y: q.y + 0.2, vx: 0, vy: -0.3, leben: 0.9, max: 0.9, farbe: "rgba(168,159,143,.35)", gr: 3, rund: true });
      } else if (q.art === "laterne") flamme(px, py + 1, 3.6, q.phase);
      else if (q.art === "feuer") { flamme(px - 5, py + 2, 5, q.phase, "#e0a046"); flamme(px + 5, py + 3, 4.5, q.phase + 2, "#e0a046"); flamme(px, py, 6.5, q.phase + 1); }
      else if (q.art === "lava") {
        const p = ruhig ? 0.5 : 0.5 + 0.5 * Math.sin(S.zeit * 1.7 + q.phase);
        ctx.fillStyle = "rgba(255,200,90," + (0.12 + 0.2 * p).toFixed(2) + ")"; ctx.fillRect(px - C / 2, py - C / 2, C, C);
        if (!ruhig && rnd() < 0.012) S.teilchen.push({ x: q.x + 0.3 + rnd() * 0.4, y: q.y + 0.5, vx: (rnd() - 0.5) * 0.3, vy: -0.6, leben: 0.8, max: 0.8, farbe: "rgba(255,170,70,.8)", gr: 2 });
      }
    });
  }

  function dunkelZeichnen(quellen) {
    const st = S.stimmung || {};
    let a = S.bed === "vollmond" ? 0.6 : (st.dunkel || 0.74);
    if (S.blitzT > 0) a *= 1 - Math.min(1, S.blitzT / 0.4) * 0.85;
    lctx.setTransform(1, 0, 0, 1, 0, 0); lctx.globalCompositeOperation = "source-over";
    lctx.clearRect(0, 0, LW, LH);
    lctx.fillStyle = "rgba(7,6,14," + a.toFixed(3) + ")"; lctx.fillRect(0, 0, LW, LH);
    lctx.globalCompositeOperation = "destination-out";
    lctx.setTransform(LS * C, 0, 0, LS * C, LP, LP);
    quellen.forEach(q => {
      const g = lctx.createRadialGradient(q.x, q.y, 0, q.x, q.y, q.r), s = q.st;
      g.addColorStop(0, "rgba(0,0,0," + s.toFixed(3) + ")"); g.addColorStop(0.5, "rgba(0,0,0," + (s * 0.88).toFixed(3) + ")");
      g.addColorStop(0.8, "rgba(0,0,0," + (s * 0.42).toFixed(3) + ")"); g.addColorStop(1, "rgba(0,0,0,0)");
      lctx.fillStyle = g; lctx.fill(q.pfad);
    });
    if (S.mond && S.mond.m > 0.02) { lctx.fillStyle = "rgba(0,0,0," + (0.62 * S.mond.m).toFixed(3) + ")"; S.mond.strahlen.forEach(m => lctx.fill(m.pfad)); }
    lctx.setTransform(1, 0, 0, 1, 0, 0); lctx.globalCompositeOperation = "source-over";
    let quelle = lichtLein;
    if (FILTER_OK) { wctx.clearRect(0, 0, LW, LH); wctx.filter = "blur(1.5px)"; wctx.drawImage(lichtLein, 0, 0); wctx.filter = "none"; quelle = weichLein; }
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(quelle, LP, LP, W * LS, GH * LS, 0, OY, W, GH);
    if (st.toenung) { ctx.fillStyle = st.toenung; ctx.fillRect(0, OY, W, GH); }
  }
  /* warmer Schein, nur wo das Licht wirklich hinfällt */
  function scheinZeichnen(quellen) {
    ctx.save(); ctx.translate(0, OY); ctx.scale(C, C); ctx.globalCompositeOperation = "lighter";
    quellen.forEach(q => {
      if (!q.farbe) return;
      const g = ctx.createRadialGradient(q.x, q.y, 0, q.x, q.y, q.r * 0.78), a = (q.art === "lava" ? 0.1 : 0.17) * q.st;
      g.addColorStop(0, "rgba(" + q.farbe + "," + a.toFixed(3) + ")"); g.addColorStop(0.55, "rgba(" + q.farbe + "," + (a * 0.45).toFixed(3) + ")"); g.addColorStop(1, "rgba(" + q.farbe + ",0)");
      ctx.fillStyle = g; ctx.fill(q.pfad);
    });
    ctx.restore();
  }

  function kegelZeichnen(x, y, ang, halb, R, farbe) {
    const n = 18, pts = [];
    for (let i = 0; i <= n; i++) {
      const a = ang - halb + 2 * halb * i / n, cs = Math.cos(a), sn = Math.sin(a);
      let r = 0.2;
      while (r < R) { const nx = x + cs * (r + 0.12), ny = y + sn * (r + 0.12); if (istWand(zeichen(Math.floor(nx), Math.floor(ny)))) break; r += 0.12; }
      pts.push([x + cs * r, y + sn * r]);
    }
    const g = ctx.createRadialGradient(PX(x), PY(y), 4, PX(x), PY(y), R * C);
    g.addColorStop(0, farbe.replace("A", ".34")); g.addColorStop(1, farbe.replace("A", "0"));
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(PX(x), PY(y)); pts.forEach(p => ctx.lineTo(PX(p[0]), PY(p[1]))); ctx.closePath(); ctx.fill();
  }
  function kegelAlle() {
    S.wachen.forEach(g => {
      if (g.zustand === "aus" || g.cd > 0) return;
      const R = g.T.sicht * S.mod.sicht * (1 + S.aufsehen / 300);
      if (g.zustand === "flucht") return;
      const farbe = g.zustand === "jagd" ? "rgba(196,86,74,A)" : g.a > 0.4 ? "rgba(232,150,70,A)" : "rgba(224,190,110,A)";
      kegelZeichnen(g.x, g.y, g.ang, g.T.halb * (g.zustand === "jagd" ? 1.6 : 1), R, farbe);
      if (g.T.nase) { ctx.strokeStyle = "rgba(224,190,110,.35)"; ctx.lineWidth = 1; ctx.setLineDash([2, 4]); ctx.beginPath(); ctx.arc(PX(g.x), PY(g.y), g.T.nase * C, 0, 7); ctx.stroke(); ctx.setLineDash([]); }
    });
    const nz = S.nezna;
    if (nz && !nz.gefangen && nz.cd <= 0) kegelZeichnen(nz.x, nz.y, nz.ang, 0.9, nz.form === "drow" ? 3.4 : 2.6, "rgba(180,138,216,A)");
    const d = S.drache;
    if (d && d.wach) { const k = dracheKopf(); kegelZeichnen(k.x, k.y, d.ang, 0.62, 5.6 * S.mod.sicht, d.a > 0.3 ? "rgba(196,86,74,A)" : dracheRot() ? "rgba(255,150,70,A)" : "rgba(160,200,90,A)"); }
    S.gaeste.forEach(p => { if (p.schlaeft && p.wach > 0) kegelZeichnen(p.x, p.y, p.ang, 0.8, 3.2, "rgba(224,190,110,A)"); });
  }

  /* Figuren von oben */
  function schatten(px, py, r) { ctx.fillStyle = "rgba(0,0,0,.38)"; ctx.beginPath(); ctx.ellipse(px + 2, py + 3, r * 1.05, r * 0.92, 0, 0, 7); ctx.fill(); }
  function koerper(px, py, ang, r, mantel, kopf) {
    ctx.save(); ctx.translate(px, py); ctx.rotate(ang);
    ctx.fillStyle = mantel; ctx.beginPath(); ctx.ellipse(-r * 0.08, 0, r * 0.74, r, 0, 0, 7); ctx.fill();
    ctx.strokeStyle = "rgba(0,0,0,.35)"; ctx.lineWidth = 1; ctx.stroke();
    ctx.fillStyle = kopf; ctx.beginPath(); ctx.arc(r * 0.12, 0, r * 0.5, 0, 7); ctx.fill();
    ctx.restore();
  }
  function ezekielZeichnen() {
    const px = PX(E.x), py = PY(E.y), r = C * 0.36;
    const a = E.versteckt ? 0.45 : 1;
    ctx.save(); ctx.globalAlpha = a;
    schatten(px, py, r);
    ctx.translate(px, py); ctx.rotate(E.ang);
    // Klingen
    ctx.strokeStyle = "#c9c0b8"; ctx.lineWidth = 2.2; ctx.lineCap = "round";
    [-1, 1].forEach(s => { ctx.beginPath(); ctx.moveTo(r * 0.2, s * r * 0.85); ctx.quadraticCurveTo(r * 0.9, s * r * 1.15, r * 1.25, s * r * 0.75); ctx.stroke(); });
    ctx.strokeStyle = "#9b3a2f"; ctx.lineWidth = 1.6; [-1, 1].forEach(s => { ctx.beginPath(); ctx.moveTo(r * 1.0, s * r * 0.98); ctx.lineTo(r * 1.25, s * r * 0.75); ctx.stroke(); });
    // Umhang
    const g = ctx.createRadialGradient(0, 0, 2, 0, 0, r * 1.1);
    const sk = SKINS[VS.skin] || SKINS.scharlach;
    if (sk.glanz) { ctx.save(); ctx.globalAlpha = 0.35 + 0.15 * Math.sin(S.zeit * 2.5); ctx.fillStyle = "#ffe08a"; ctx.shadowColor = "#ffcf7a"; ctx.shadowBlur = 12; ctx.beginPath(); ctx.arc(0, 0, r * 1.05, 0, 7); ctx.fill(); ctx.restore(); }
    /* Verkleidung: Ezekiel trägt die Farben der hiesigen Wachen (die Hörner schauen trotzdem raus) */
    const MT = S.maskeT > 0 && !(S.maskeT < 1.5 && Math.sin(S.zeit * 22) > 0) ? WTYP[hauptTyp()] : null;
    g.addColorStop(0, MT ? MT.mantel : E.verkleidet ? "#a3231c" : sk.u0); g.addColorStop(1, MT ? "#14100c" : E.verkleidet ? "#6a1410" : sk.u1);
    ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(-r * 0.1, 0, r * 0.8, r * 1.02, 0, 0, 7); ctx.fill();
    ctx.fillStyle = "#2a1a16"; [-1, 1].forEach(s => { ctx.beginPath(); ctx.moveTo(0, s * r * 0.55); ctx.lineTo(-r * 0.25, s * r * 1.05); ctx.lineTo(r * 0.25, s * r * 0.85); ctx.closePath(); ctx.fill(); });
    // Kapuze
    ctx.fillStyle = MT ? (MT.haube || MT.kopf) : E.verkleidet ? "#b8302a" : sk.k; ctx.beginPath(); ctx.arc(r * 0.1, 0, r * 0.5, 0, 7); ctx.fill();
    if (MT && MT.bart) { ctx.fillStyle = "#3a3634"; ctx.beginPath(); ctx.ellipse(r * 0.5, 0, r * 0.22, r * 0.28, 0, 0, 7); ctx.fill(); }
    // Hörner
    ctx.strokeStyle = "#1a1210"; ctx.lineWidth = 3; ctx.lineCap = "round";
    [-1, 1].forEach(s => { ctx.beginPath(); ctx.moveTo(r * 0.0, s * r * 0.35); ctx.quadraticCurveTo(-r * 0.35, s * r * 0.95, r * 0.25, s * r * 0.95); ctx.stroke(); });
    ctx.strokeStyle = "#4a3a32"; ctx.lineWidth = 1; [-1, 1].forEach(s => { ctx.beginPath(); ctx.moveTo(r * 0.0, s * r * 0.35); ctx.quadraticCurveTo(-r * 0.35, s * r * 0.95, r * 0.25, s * r * 0.95); ctx.stroke(); });
    ctx.restore();
  }
  function ezekielAugen() {
    const px = PX(E.x), py = PY(E.y), r = C * 0.36;
    if (E.lauer) { ctx.fillStyle = "rgba(235,226,204," + (0.5 + 0.4 * Math.sin(S.zeit * 8)).toFixed(2) + ")"; ctx.font = "600 16px " + FONT_H; ctx.textAlign = "center"; ctx.textBaseline = "bottom"; ctx.fillText("…", px, py - C * 0.5); }
    if (E.arbeit) { ctx.strokeStyle = "#ebe2cc"; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(px, py, C * 0.6, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * E.arbeit.t / E.arbeit.dauer); ctx.stroke(); }
    if (S.zornT > 0) {
      const p = 0.75 + 0.25 * Math.sin(S.zeit * 12), rr = C * (0.75 + 0.1 * p);
      const g = ctx.createRadialGradient(px, py, r * 0.6, px, py, rr);
      g.addColorStop(0, "rgba(196,40,30,0)"); g.addColorStop(0.6, "rgba(196,40,30," + (0.35 * p).toFixed(2) + ")"); g.addColorStop(1, "rgba(196,40,30,0)");
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(px, py, rr, 0, 7); ctx.fill();
    }
    ctx.save(); ctx.translate(px, py); ctx.rotate(E.ang);
    const sk = SKINS[VS.skin] || SKINS.scharlach;
    ctx.fillStyle = sk.a; ctx.shadowColor = sk.a; ctx.shadowBlur = 8;
    [-1, 1].forEach(s => { ctx.beginPath(); ctx.arc(r * 0.45, s * r * 0.17, 1.7, 0, 7); ctx.fill(); });
    ctx.restore();
    // dezenter Ring, damit man ihn im Dunkeln findet
    ctx.strokeStyle = E.versteckt ? "rgba(168,159,143,.45)" : "rgba(196,86,74,.4)"; ctx.lineWidth = 1.2; ctx.setLineDash([3, 3]);
    ctx.beginPath(); ctx.arc(px, py, C * 0.52, 0, 7); ctx.stroke(); ctx.setLineDash([]);
  }
  function wacheZeichnen(g) {
    const T = g.T, px = PX(g.x), py = PY(g.y), r = C * T.r;
    if (T.hund) { hundZeichnen(g, px, py, r); return; }
    if (g.zustand === "aus" && g.verborgen) return;
    if (g.zustand === "aus") {
      ctx.save(); ctx.globalAlpha = Math.max(0.35, 1 - g.aT * 0.3); ctx.translate(px, py); ctx.rotate(g.ang + Math.PI / 2);
      ctx.fillStyle = "rgba(90,23,18,.55)"; ctx.beginPath(); ctx.ellipse(3, 4, r * 1.1, r * 0.7, 0.3, 0, 7); ctx.fill();
      ctx.fillStyle = T.mantel; ctx.beginPath(); ctx.ellipse(0, 0, r * 1.05, r * 0.62, 0, 0, 7); ctx.fill();
      ctx.fillStyle = T.kopf; ctx.beginPath(); ctx.arc(r * 0.9, 0, r * 0.42, 0, 7); ctx.fill();
      ctx.restore(); return;
    }
    schatten(px, py, r);
    ctx.save(); ctx.translate(px, py); ctx.rotate(g.ang);
    // Waffe / Fackel
    if (T.auge) { ctx.strokeStyle = "#6a5a4a"; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.moveTo(-r * 0.3, r * 0.9); ctx.lineTo(r * 1.3, r * 0.7); ctx.stroke(); ctx.fillStyle = "#c79bff"; ctx.shadowColor = "#b48ad8"; ctx.shadowBlur = 8; ctx.beginPath(); ctx.arc(r * 1.35, r * 0.68, 3, 0, 7); ctx.fill(); ctx.shadowBlur = 0; }
    else if (T.fackel) { ctx.strokeStyle = "#5a4430"; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(r * 0.2, r * 0.7); ctx.lineTo(r * 1.15, r * 0.55); ctx.stroke(); }
    else if (!T.ruft) { ctx.strokeStyle = "#a8a29a"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(r * 0.1, r * 0.85); ctx.lineTo(r * 1.3, r * 0.75); ctx.stroke(); }
    ctx.fillStyle = T.mantel; ctx.beginPath(); ctx.ellipse(-r * 0.08, 0, r * 0.74, r, 0, 0, 7); ctx.fill();
    ctx.strokeStyle = "rgba(0,0,0,.4)"; ctx.lineWidth = 1; ctx.stroke();
    if (T.schuerze) { ctx.fillStyle = "#ebe2cc"; ctx.fillRect(r * 0.1, -r * 0.55, r * 0.45, r * 1.1); }
    if (T.gross) { ctx.strokeStyle = "#5a3a1a"; ctx.lineWidth = 1; for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; ctx.beginPath(); ctx.moveTo(Math.cos(a) * r * 0.5, Math.sin(a) * r * 0.7); ctx.lineTo(Math.cos(a) * r * 0.75, Math.sin(a) * r * 0.95); ctx.stroke(); } }
    ctx.fillStyle = T.haube || T.kopf; ctx.beginPath(); ctx.arc(r * 0.12, 0, r * 0.5, 0, 7); ctx.fill();
    if (T.spitz) { ctx.beginPath(); ctx.moveTo(-r * 0.2, -r * 0.3); ctx.lineTo(-r * 0.75, 0); ctx.lineTo(-r * 0.2, r * 0.3); ctx.fill(); }
    if (T.haube && !T.spitz) { ctx.fillStyle = T.kopf; ctx.beginPath(); ctx.arc(r * 0.32, 0, r * 0.26, 0, 7); ctx.fill(); }
    if (T.haar) { ctx.fillStyle = T.haar; ctx.beginPath(); ctx.ellipse(-r * 0.15, 0, r * 0.42, r * 0.36, 0, 0, 7); ctx.fill(); }
    if (T.bart) { ctx.fillStyle = "#3a3634"; ctx.beginPath(); ctx.ellipse(r * 0.55, 0, r * 0.25, r * 0.3, 0, 0, 7); ctx.fill(); }
    if (T.ohren) { ctx.fillStyle = T.kopf; [-1, 1].forEach(s => { ctx.beginPath(); ctx.moveTo(r * 0.1, s * r * 0.35); ctx.lineTo(-r * 0.25, s * r * 0.95); ctx.lineTo(r * 0.3, s * r * 0.45); ctx.fill(); }); }
    if (T.gross) { ctx.fillStyle = "#e8dcc0"; [-1, 1].forEach(s => { ctx.beginPath(); ctx.arc(r * 0.55, s * r * 0.18, 1.6, 0, 7); ctx.fill(); }); }
    if (T.hauptmann && !T.auge) { ctx.strokeStyle = "#e0a046"; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.arc(r * 0.12, 0, r * 0.55, 0, 7); ctx.stroke(); ctx.fillStyle = "#c4564a"; ctx.beginPath(); ctx.moveTo(-r * 0.1, 0); ctx.lineTo(-r * 0.85, -r * 0.18); ctx.lineTo(-r * 0.85, r * 0.18); ctx.fill(); }
    ctx.restore();
    if (g.neu) { g.neu = Math.max(0, g.neu - 0.01); ctx.strokeStyle = "rgba(196,86,74," + g.neu.toFixed(2) + ")"; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(px, py, r * 1.6, 0, 7); ctx.stroke(); }
    if (T.fackel) flamme(px + Math.cos(g.ang) * r * 1.15 + Math.cos(g.ang + 1.57) * r * 0.55, py + Math.sin(g.ang) * r * 1.15 + Math.sin(g.ang + 1.57) * r * 0.55, 3.4, g.x * 3);
  }
  function hundZeichnen(g, px, py, r) {
    const T = g.T, zahm = g.zahm, lauf = (g.pfad && g.pfad.length) ? Math.sin(S.zeit * 16) * 0.25 : 0;
    const farbe = S.def.n === 5 ? "#6a6070" : S.def.n === 3 ? "#7e7a72" : T.mantel, kopf = S.def.n === 5 ? "#7e7488" : S.def.n === 3 ? "#949088" : T.kopf;
    schatten(px, py, r * 1.1);
    ctx.save(); ctx.translate(px, py); ctx.rotate(g.ang);
    ctx.strokeStyle = farbe; ctx.lineWidth = 3; ctx.lineCap = "round";
    const wedel = zahm ? Math.sin(S.zeit * 14) * 0.6 : lauf;
    ctx.beginPath(); ctx.moveTo(-r * 1.1, 0); ctx.quadraticCurveTo(-r * 1.6, r * 0.2, -r * 1.75 + wedel * 3, r * 0.5 * (zahm ? Math.sin(S.zeit * 14) : 1)); ctx.stroke();
    ctx.fillStyle = farbe; ctx.beginPath(); ctx.ellipse(-r * 0.2, 0, r * 1.15, r * 0.62, 0, 0, 7); ctx.fill();
    ctx.fillStyle = kopf; ctx.beginPath(); ctx.arc(r * 0.95, 0, r * 0.5, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.ellipse(r * 1.45, 0, r * 0.32, r * 0.24, 0, 0, 7); ctx.fill();
    ctx.fillStyle = "#14100c"; ctx.beginPath(); ctx.arc(r * 1.72, 0, 1.6, 0, 7); ctx.fill();
    ctx.fillStyle = farbe; [-1, 1].forEach(s => { ctx.beginPath(); ctx.moveTo(r * 0.9, s * r * 0.25); ctx.lineTo(r * 0.55, s * r * 0.75); ctx.lineTo(r * 1.15, s * r * 0.45); ctx.fill(); });
    ctx.restore();
    if (zahm && Math.sin(S.zeit * 2 + g.x) > 0.6) { ctx.font = "12px " + FONT_D; ctx.fillStyle = "#c4564a"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText("♥", px, py - r * 1.8); }
  }
  function neznaZeichnen() {
    const n = S.nezna; if (!n || n.gefangen) return;
    const px = PX(n.x), py = PY(n.y);
    if (n.form === "drow") {
      const r = C * 0.31; schatten(px, py, r);
      ctx.save(); ctx.translate(px, py); ctx.rotate(n.ang);
      ctx.fillStyle = "#3a1f4a"; ctx.beginPath(); ctx.ellipse(-r * 0.08, 0, r * 0.74, r, 0, 0, 7); ctx.fill();
      ctx.strokeStyle = "rgba(180,138,216,.6)"; ctx.lineWidth = 1.2; ctx.stroke();
      ctx.fillStyle = "#4a4160"; ctx.beginPath(); ctx.arc(r * 0.12, 0, r * 0.5, 0, 7); ctx.fill();
      ctx.fillStyle = "#ece8f4"; ctx.beginPath(); ctx.ellipse(-r * 0.15, 0, r * 0.45, r * 0.4, 0, 0, 7); ctx.fill();
      ctx.restore(); return;
    }
    const r = C * 0.22, k = n.flucht > 0 || n.pfad.length ? Math.sin(S.zeit * 14) * 0.4 : Math.sin(S.zeit * 2) * 0.3;
    schatten(px, py, r);
    ctx.save(); ctx.translate(px, py); ctx.rotate(n.ang);
    ctx.strokeStyle = "#141018"; ctx.lineWidth = 2.6; ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(-r * 0.9, 0); ctx.quadraticCurveTo(-r * 1.8, k * r * 2, -r * 2.1, k * r * 3); ctx.stroke();
    ctx.fillStyle = "#141018"; ctx.beginPath(); ctx.ellipse(-r * 0.1, 0, r * 1.05, r * 0.62, 0, 0, 7); ctx.fill();
    ctx.strokeStyle = "rgba(180,138,216,.45)"; ctx.lineWidth = 1; ctx.stroke();
    ctx.beginPath(); ctx.arc(r * 0.95, 0, r * 0.55, 0, 7); ctx.fill();
    [-1, 1].forEach(s => { ctx.beginPath(); ctx.moveTo(r * 0.9, s * r * 0.2); ctx.lineTo(r * 0.75, s * r * 0.85); ctx.lineTo(r * 1.25, s * r * 0.45); ctx.fill(); });
    ctx.restore();
  }
  function neznaAugen() {
    const n = S.nezna; if (!n || n.gefangen) return;
    const r = C * (n.form === "drow" ? 0.31 : 0.22), ax = PX(n.x) + Math.cos(n.ang) * r * (n.form === "drow" ? 0.45 : 1.15), ay = PY(n.y) + Math.sin(n.ang) * r * (n.form === "drow" ? 0.45 : 1.15);
    ctx.save(); ctx.fillStyle = "#c79bff"; ctx.shadowColor = "#a46bff"; ctx.shadowBlur = 7;
    [-1, 1].forEach(s => { ctx.beginPath(); ctx.arc(ax + Math.cos(n.ang + Math.PI / 2) * s * 2.4, ay + Math.sin(n.ang + Math.PI / 2) * s * 2.4, 1.3, 0, 7); ctx.fill(); });
    ctx.restore();
    if (n.a > 0.05) { const px = PX(n.x), py = PY(n.y) - C * 0.55; ctx.fillStyle = "rgba(9,8,15,.6)"; ctx.fillRect(px - 8, py - 2, 16, 3); ctx.fillStyle = "#b48ad8"; ctx.fillRect(px - 8, py - 2, 16 * Math.min(1, n.a), 3); }
  }
  function bossZeichnen() {
    const b = S.boss; if (!b || b.gefangen || b.entkommen) return;
    const px = PX(b.x), py = PY(b.y), r = C * 0.34;
    schatten(px, py, r);
    ctx.save(); ctx.translate(px, py); ctx.rotate(b.ang);
    if (b.name === "drokey") { // Drokey: grauer Kapuzendieb, die Drachenmünze blitzt am Gürtel
      ctx.strokeStyle = "#a8a29a"; ctx.lineWidth = 1.8; ctx.beginPath(); ctx.moveTo(r * 0.1, r * 0.85); ctx.lineTo(r * 1.05, r * 0.8); ctx.stroke();
      ctx.fillStyle = "#3e3f46"; ctx.beginPath(); ctx.ellipse(-r * 0.08, 0, r * 0.76, r, 0, 0, 7); ctx.fill();
      ctx.strokeStyle = "rgba(170,172,180,.6)"; ctx.lineWidth = 1.2; ctx.stroke();
      ctx.fillStyle = "#2c2d33"; ctx.beginPath(); ctx.arc(r * 0.1, 0, r * 0.52, 0, 7); ctx.fill();
      ctx.fillStyle = "#8c8580"; ctx.beginPath(); ctx.arc(r * 0.36, 0, r * 0.24, 0, 7); ctx.fill();
      ctx.fillStyle = "#e0a046"; ctx.shadowColor = "#ffcf7a"; ctx.shadowBlur = 6 + 3 * Math.sin(S.zeit * 4); ctx.beginPath(); ctx.arc(-r * 0.2, -r * 0.72, 3.2, 0, 7); ctx.fill(); ctx.shadowBlur = 0;
      ctx.restore();
    } else {
    ctx.strokeStyle = "#8a6a44"; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.moveTo(-r * 0.3, r * 0.9); ctx.lineTo(r * 1.3, r * 0.7); ctx.stroke();
    ctx.fillStyle = "rgba(170,220,255,.9)"; ctx.shadowColor = "#9bd0ff"; ctx.shadowBlur = 10; ctx.beginPath(); ctx.arc(r * 1.35, r * 0.68, 3.4, 0, 7); ctx.fill(); ctx.shadowBlur = 0;
    ctx.fillStyle = "#7a1a16"; ctx.beginPath(); ctx.ellipse(-r * 0.08, 0, r * 0.78, r * 1.02, 0, 0, 7); ctx.fill();
    ctx.strokeStyle = "#e0a046"; ctx.lineWidth = 1.4; ctx.stroke();
    ctx.fillStyle = "#9b231b"; ctx.beginPath(); ctx.arc(r * 0.12, 0, r * 0.52, 0, 7); ctx.fill();
    ctx.fillStyle = "#d9b08c"; ctx.beginPath(); ctx.arc(r * 0.34, 0, r * 0.27, 0, 7); ctx.fill();
    ctx.restore();
    }
    ctx.font = "600 13px " + FONT_H; ctx.fillStyle = "rgba(235,226,204,.85)"; ctx.textAlign = "center"; ctx.textBaseline = "bottom";
    ctx.fillText(tn("bossName") || (sprache() === "en" ? "Glasstaff" : "Glasstab"), px, py - r * 1.5);
    if (b.zustand === "wartet") {
      const rr = C * 0.95, g = ctx.createRadialGradient(px, py, r * 0.6, px, py, rr);
      g.addColorStop(0, "rgba(235,226,204,.3)"); g.addColorStop(1, "rgba(235,226,204,0)");
      ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(px, py); ctx.arc(px, py, rr, b.ang - 0.85, b.ang + 0.85); ctx.closePath(); ctx.fill();
      if (b.a > 0.05) { ctx.fillStyle = "rgba(9,8,15,.6)"; ctx.fillRect(px - 9, py - r * 1.5 - 18, 18, 3); ctx.fillStyle = "#e0a046"; ctx.fillRect(px - 9, py - r * 1.5 - 18, 18 * Math.min(1, b.a), 3); }
    }
  }
  function briefZeichnen() {
    const b = S.brief; if (!b) return;
    const px = PX(b.x + 0.5), py = PY(b.y + 0.5), w = 0.5 + 0.5 * Math.sin(S.zeit * 3);
    ctx.save(); ctx.translate(px, py); ctx.rotate(-0.2);
    ctx.shadowColor = "rgba(255,230,170," + (0.5 + 0.4 * w).toFixed(2) + ")"; ctx.shadowBlur = 10 + 6 * w;
    ctx.fillStyle = "#e8dcc0"; ctx.fillRect(-8, -6, 16, 12); ctx.shadowBlur = 0;
    ctx.strokeStyle = "#a89f8f"; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(-8, -6); ctx.lineTo(0, 1); ctx.lineTo(8, -6); ctx.stroke();
    ctx.fillStyle = "#9b231b"; ctx.beginPath(); ctx.arc(0, 1, 2.6, 0, 7); ctx.fill();
    ctx.restore();
  }
  function pulseZeichnen() {
    S.pulse.forEach(q => {
      const k = q.t / 0.8; ctx.strokeStyle = "rgba(180,138,216," + (0.8 * (1 - k)).toFixed(2) + ")"; ctx.lineWidth = 3 * (1 - k) + 1;
      ctx.beginPath(); ctx.arc(PX(q.x), PY(q.y), q.r * C * Math.min(1, k * 1.6), 0, 7); ctx.stroke();
      ctx.fillStyle = "rgba(180,138,216," + (0.12 * (1 - k)).toFixed(3) + ")"; ctx.fill();
    });
    S.wachen.forEach(g => {
      if (!g.T.auge || g.zustand === "aus" || g.augeT > 1.3) return;
      const k = 1 - g.augeT / 1.3, px = PX(g.x), py = PY(g.y);
      ctx.strokeStyle = "rgba(180,138,216," + (0.25 + 0.5 * k).toFixed(2) + ")"; ctx.lineWidth = 1.2; ctx.setLineDash([3, 4]);
      ctx.beginPath(); ctx.arc(px, py, 3.4 * C, 0, 7); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = "rgba(200,160,255," + (0.4 + 0.5 * k * Math.abs(Math.sin(S.zeit * 12))).toFixed(2) + ")"; ctx.shadowColor = "#b48ad8"; ctx.shadowBlur = 14;
      ctx.beginPath(); ctx.arc(px, py - C * 0.15, 4 + 3 * k, 0, 7); ctx.fill(); ctx.shadowBlur = 0;
    });
  }
  function wetterZeichnen() {
    if (S.bed === "nebel") {
      ctx.save();
      for (let i = 0; i < 7; i++) {
        const x = ((S.zeit * (6 + i * 2) + i * 97) % (W + 160)) - 80, y = OY + ((i * 71) % GH);
        const g = ctx.createRadialGradient(x, y, 10, x, y, 110); g.addColorStop(0, "rgba(168,159,143,.16)"); g.addColorStop(1, "rgba(168,159,143,0)");
        ctx.fillStyle = g; ctx.fillRect(x - 110, y - 110, 220, 220);
      }
      ctx.restore();
    }
    if (S.bed === "vollmond") { ctx.fillStyle = "rgba(214,208,186,.05)"; ctx.fillRect(0, OY, W, GH); }
    if (S.gew) {
      if (S.gew.leuchten && Math.sin(S.zeit * 37) > 0.55) { ctx.fillStyle = "rgba(232,230,222,.07)"; ctx.fillRect(0, OY, W, GH); }
      if (S.blitzT > 0) { ctx.fillStyle = "rgba(246,244,236," + (0.35 * S.blitzT / 0.4).toFixed(2) + ")"; ctx.fillRect(0, OY, W, GH); }
    }
  }
  function sternPfad(x, y, ra) {
    ctx.beginPath();
    for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? ra * 0.45 : ra; ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
    ctx.closePath();
  }
  function wachenMarken() {
    S.wachen.forEach(g => {
      if (g.zustand === "aus") return;
      const px = PX(g.x), py = PY(g.y) - C * 0.62;
      if (g.zustand === "jagd") { ctx.font = "bold 20px " + FONT_D; ctx.fillStyle = "#c4564a"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText("!", px, py); }
      else if (g.zustand === "flucht") { ctx.font = "bold 16px " + FONT_D; ctx.fillStyle = "#ebe2cc"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText("!!", px, py); }
      else if (g.a > 0.05) {
        ctx.fillStyle = "rgba(9,8,15,.6)"; ctx.fillRect(px - 9, py - 2, 18, 4);
        ctx.fillStyle = g.a >= 0.42 ? "#e0a046" : "#a89f8f"; ctx.fillRect(px - 9, py - 2, 18 * g.a, 4);
        if (g.zustand === "horchen" || g.zustand === "suche" || g.zustand === "verdacht") { ctx.font = "bold 14px " + FONT_D; ctx.fillStyle = "#e0a046"; ctx.textAlign = "center"; ctx.textBaseline = "bottom"; ctx.fillText("?", px, py - 3); }
      }
    });
  }
  function gastZeichnen(p) {
    const px = PX(p.x), py = PY(p.y);
    const T = WTYP[p.typ];
    const r = C * (T ? T.r : 0.31);
    schatten(px, py, r);
    if (T) {
      ctx.save(); ctx.translate(px, py); ctx.rotate(p.ang);
      ctx.fillStyle = T.mantel; ctx.beginPath(); ctx.ellipse(-r * 0.08, 0, r * 0.74, r, 0, 0, 7); ctx.fill();
      ctx.fillStyle = T.haube || T.kopf; ctx.beginPath(); ctx.arc(r * 0.12, 0, r * 0.5, 0, 7); ctx.fill();
      if (T.spitz) { ctx.beginPath(); ctx.moveTo(-r * 0.2, -r * 0.3); ctx.lineTo(-r * 0.75, 0); ctx.lineTo(-r * 0.2, r * 0.3); ctx.fill(); }
      if (T.haube && !T.spitz) { ctx.fillStyle = T.kopf; ctx.beginPath(); ctx.arc(r * 0.32, 0, r * 0.26, 0, 7); ctx.fill(); }
      if (T.haar) { ctx.fillStyle = T.haar; ctx.beginPath(); ctx.ellipse(-r * 0.15, 0, r * 0.42, r * 0.36, 0, 0, 7); ctx.fill(); }
      if (T.bart) { ctx.fillStyle = "#3a3634"; ctx.beginPath(); ctx.ellipse(r * 0.55, 0, r * 0.25, r * 0.3, 0, 0, 7); ctx.fill(); }
      if (T.ohren) { ctx.fillStyle = T.kopf; [-1, 1].forEach(s => { ctx.beginPath(); ctx.moveTo(r * 0.1, s * r * 0.35); ctx.lineTo(-r * 0.25, s * r * 0.95); ctx.lineTo(r * 0.3, s * r * 0.45); ctx.fill(); }); }
      ctx.restore();
    } else {
      koerper(px, py, p.ang, r, p.farbe, p.haut);
      if (p.hut) { ctx.fillStyle = "#3a2c22"; ctx.beginPath(); ctx.arc(px + Math.cos(p.ang) * r * 0.06, py + Math.sin(p.ang) * r * 0.06, r * 0.4, 0, 7); ctx.fill(); }
    }
    if (p.trinkt > 0 && !p.schlaeft) { const hx = px + Math.cos(p.ang) * r * 0.75, hy = py + Math.sin(p.ang) * r * 0.75; ctx.fillStyle = "#b9a88a"; ctx.beginPath(); ctx.arc(hx, hy, 3.4, 0, 7); ctx.fill(); ctx.fillStyle = "#f1e7cf"; ctx.beginPath(); ctx.arc(hx, hy, 2, 0, 7); ctx.fill(); }
    if (p.betet && p.abgelenkt) { ctx.fillStyle = "rgba(224,160,70,.35)"; ctx.beginPath(); ctx.arc(px, py, r * 1.1, p.ang - 0.5, p.ang + 0.5); ctx.lineTo(px, py); ctx.fill(); }
  }
  function gastMarken() {
    const grenze = [1.35, 0.95, 0.55][Math.min(2, S.gaben.finger)];
    S.gaeste.forEach(p => {
      const px = PX(p.x), py = PY(p.y);
      const r = C * ((WTYP[p.typ] || {}).r || 0.31);
      const schlaeft = p.schlaeft && !p.wach;
      const lohnt = p.gold > 0 || p.key;
      // Blickfächer: Hier bemerkt der Gast dich. Fehlt er, ist der Gast gerade abgelenkt.
      if (lohnt && !schlaeft && (!p.abgelenkt || p.wachsam > 0)) {
        const rr = C * 0.98, rot = p.wachsam > 0;
        const g = ctx.createRadialGradient(px, py, r * 0.6, px, py, rr);
        g.addColorStop(0, rot ? "rgba(196,86,74,.5)" : "rgba(235,226,204,.34)"); g.addColorStop(1, rot ? "rgba(196,86,74,0)" : "rgba(235,226,204,0)");
        ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(px, py); ctx.arc(px, py, rr, p.ang - grenze, p.ang + grenze); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = rot ? "rgba(196,86,74,.55)" : "rgba(235,226,204,.3)"; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(px, py, rr * 0.92, p.ang - grenze, p.ang + grenze); ctx.stroke();
      }
      // Augen, auch im Dunkeln sichtbar
      if (!schlaeft) {
        const ax = px + Math.cos(p.ang) * r * 0.5, ay = py + Math.sin(p.ang) * r * 0.5, qx = Math.cos(p.ang + Math.PI / 2), qy = Math.sin(p.ang + Math.PI / 2);
        ctx.fillStyle = p.abgelenkt && p.wachsam <= 0 ? "rgba(235,226,204,.45)" : "#f1e7cf";
        [-1, 1].forEach(s => { ctx.beginPath(); ctx.arc(ax + qx * s * r * 0.22, ay + qy * s * r * 0.22, 1.5, 0, 7); ctx.fill(); });
      }
      if (p.gold > 0) { ctx.fillStyle = "rgba(224,160,70,.85)"; ctx.beginPath(); ctx.arc(px - C * 0.28, py + C * 0.22, 3, 0, 7); ctx.fill(); ctx.strokeStyle = "#5a3a20"; ctx.lineWidth = 0.8; ctx.stroke(); }
      if (p.key && (S.def.schluesselZeigen || S.gaben.sinne || abstand(p, E) < 2.6)) {
        const gl = 0.6 + 0.4 * Math.sin(S.zeit * 5);
        ctx.save(); ctx.globalAlpha = gl; ctx.font = "13px sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.shadowColor = "#ffcf7a"; ctx.shadowBlur = 8;
        ctx.fillText("🗝️", px + C * 0.3, py - C * 0.38); ctx.restore();
      }
      if (p.schlaeft && !p.wach && p.wachsam <= 0) { ctx.font = "600 15px " + FONT_H; ctx.fillStyle = "rgba(235,226,204,.75)"; ctx.textAlign = "left"; ctx.textBaseline = "middle"; const k = (S.zeit * 0.8) % 1; ctx.globalAlpha = 1 - k; ctx.fillText("z", px + 6 + k * 8, py - 10 - k * 12); ctx.globalAlpha = 1; }
      if (p.wachsam > 0) { ctx.font = "bold 16px " + FONT_D; ctx.fillStyle = "#c4564a"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText("!", px, py - C * 0.62); }
    });
  }
  function freundeZeichnen() {
    const f = S.freunde;
    if (f.friedrich) {
      const p = f.friedrich, px = PX(p.x), py = PY(p.y), r = C * 0.33;
      schatten(px, py, r);
      ctx.save(); ctx.translate(px, py); ctx.rotate(p.ang);
      ctx.strokeStyle = "#8a6a44"; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.arc(-r * 0.2, 0, r * 1.05, -1.2, 1.2); ctx.stroke();
      ctx.fillStyle = "#4a3a26"; ctx.beginPath(); ctx.ellipse(-r * 0.08, 0, r * 0.74, r, 0, 0, 7); ctx.fill();
      ctx.fillStyle = "#c9b28a"; ctx.beginPath(); ctx.ellipse(-r * 0.15, 0, r * 0.5, r * 0.85, 0, -1.5, 1.5); ctx.fill();
      ctx.fillStyle = "#5a3a20"; ctx.beginPath(); ctx.arc(r * 0.1, 0, r * 0.48, 0, 7); ctx.fill();
      ctx.fillStyle = "#c49a74"; ctx.beginPath(); ctx.arc(r * 0.3, 0, r * 0.3, 0, 7); ctx.fill();
      ctx.restore();
    }
    if (f.barradin) {
      const p = f.barradin, px = PX(p.x), py = PY(p.y), r = C * 0.33;
      schatten(px, py, r);
      ctx.save(); ctx.translate(px, py); ctx.rotate(p.ang);
      ctx.fillStyle = "#2a2420"; ctx.beginPath(); ctx.ellipse(-r * 0.08, 0, r * 0.74, r, 0, 0, 7); ctx.fill();
      ctx.strokeStyle = "#c98a3a"; ctx.lineWidth = 1; ctx.stroke();
      ctx.fillStyle = "#8a4a2a"; ctx.beginPath(); ctx.arc(r * 0.1, 0, r * 0.52, 0, 7); ctx.fill();
      ctx.fillStyle = "#e0b890"; ctx.beginPath(); ctx.arc(r * 0.32, 0, r * 0.28, 0, 7); ctx.fill();
      const wipp = S.lied && S.lied.an ? Math.sin(S.zeit * 8) * 0.15 : 0;
      ctx.rotate(wipp);
      ctx.fillStyle = "#8a5a2e"; ctx.beginPath(); ctx.ellipse(r * 0.8, r * 0.35, r * 0.4, r * 0.3, 0.4, 0, 7); ctx.fill();
      ctx.strokeStyle = "#5a3a1a"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(r * 0.9, r * 0.3); ctx.lineTo(r * 1.5, -r * 0.2); ctx.stroke();
      ctx.restore();
    }
    if (f.rex) {
      const p = f.rex, px = PX(p.x), py = PY(p.y), gr = C * 0.78;
      const hop = rexHop(p);
      if (rexBild) { ctx.save(); ctx.beginPath(); ctx.arc(px, py - hop, gr / 2, 0, 7); ctx.clip(); ctx.drawImage(rexBild, px - gr / 2, py - gr / 2 - hop, gr, gr); ctx.restore(); ctx.strokeStyle = "rgba(224,160,70,.5)"; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(px, py - hop, gr / 2, 0, 7); ctx.stroke(); }
      else { ctx.fillStyle = "#6a4a2e"; ctx.beginPath(); ctx.arc(px, py - hop, gr / 2.4, 0, 7); ctx.fill(); }
    }
  }
  const rexHop = p => (p.cd > 4.4 ? Math.abs(Math.sin((5 - p.cd) * 18)) * 4 : 0);
  function sprechblasen() {
    Object.keys(S.freunde).forEach(n => { const f = S.freunde[n]; if (f.sprech > 0 && f.spruch) blase(PX(f.x), PY(f.y) - C * 0.7, f.spruch, Math.min(1, f.sprech * 3)); });
  }
  function blase(x, y, txt, a) {
    ctx.save(); ctx.globalAlpha = a;
    ctx.font = "600 15px " + FONT_H;
    const tw = Math.min(W - 10, ctx.measureText(txt).width + 14), th = 22;
    const bx = Math.max(5, Math.min(W - tw - 5, x - tw / 2)), by = y - th;
    ctx.fillStyle = "rgba(241,231,207,.95)"; ctx.strokeStyle = "#e0a046"; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.rect(bx, by, tw, th); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#2a2118"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText(txt, bx + tw / 2, by + th / 2 + 1, tw - 8);
    ctx.restore();
  }
  /* Venomfang grün, Themberchaud rot (Nacht 6: nur Kulisse und Gefahr, kein Gegner) */
  const DRACHE_FARBEN = { gruen: ["#3f5a2e", "#2f4524", "#4f6e38", "#6f8a4a", "#2a3a1c", "#1a2412"], rot: ["#7a2216", "#5a160e", "#9a2e1c", "#c4562e", "#3a0e08", "#2a0a06"] };
  const dracheRot = () => S.def.drache === "themberchaud";
  function dracheZeichnen() {
    const d = S.drache; if (!d) return;
    const F = DRACHE_FARBEN[dracheRot() ? "rot" : "gruen"];
    const px = PX(d.x), py = PY(d.y), atem = 1 + Math.sin(S.zeit * (d.wach ? 3 : 1.2)) * 0.03;
    ctx.save(); ctx.translate(px, py);
    ctx.fillStyle = "rgba(0,0,0,.4)"; ctx.beginPath(); ctx.ellipse(3, 5, C * 1.05, C * 0.85, 0, 0, 7); ctx.fill();
    // Schwanz
    ctx.strokeStyle = F[0]; ctx.lineWidth = 7; ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(-C * 0.3, C * 0.5); ctx.quadraticCurveTo(-C * 1.2, C * 0.9, -C * 0.9, C * 0.1); ctx.stroke();
    ctx.scale(atem, atem);
    // Flügel
    ctx.fillStyle = F[1];
    [-1, 1].forEach(s => { ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(s * C * 0.95, -C * 0.35); ctx.lineTo(s * C * 0.85, C * 0.35); ctx.lineTo(s * C * 0.4, C * 0.55); ctx.closePath(); ctx.fill(); });
    ctx.fillStyle = F[2]; ctx.beginPath(); ctx.ellipse(0, C * 0.1, C * 0.55, C * 0.68, 0, 0, 7); ctx.fill();
    ctx.fillStyle = F[3]; for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.moveTo(-4, C * (0.55 - i * 0.24)); ctx.lineTo(0, C * (0.45 - i * 0.24)); ctx.lineTo(4, C * (0.55 - i * 0.24)); ctx.fill(); }
    ctx.restore();
    // Kopf
    const k = dracheKopf(), kx = PX(k.x), ky = PY(k.y);
    ctx.save(); ctx.translate(kx, ky); ctx.rotate(d.ang);
    ctx.fillStyle = F[2]; ctx.beginPath(); ctx.moveTo(C * 0.45, 0); ctx.lineTo(-C * 0.2, -C * 0.28); ctx.lineTo(-C * 0.3, C * 0.28); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = F[4]; ctx.lineWidth = 2.5; [-1, 1].forEach(s => { ctx.beginPath(); ctx.moveTo(-C * 0.15, s * C * 0.18); ctx.lineTo(-C * 0.42, s * C * 0.34); ctx.stroke(); });
    ctx.fillStyle = d.wach ? "#ffcf3a" : F[5]; if (d.wach) { ctx.shadowColor = "#ffcf3a"; ctx.shadowBlur = 8; }
    [-1, 1].forEach(s => { ctx.beginPath(); ctx.ellipse(C * 0.08, s * C * 0.12, d.wach ? 2.6 : 2.4, d.wach ? 2 : 0.7, 0, 0, 7); ctx.fill(); });
    ctx.restore();
  }
  function dracheZzz() {
    const d = S.drache; if (!d || d.wach) return;
    ctx.font = "600 18px " + FONT_H; ctx.fillStyle = dracheRot() ? "rgba(255,150,90,.85)" : "rgba(160,200,90,.8)"; ctx.textAlign = "left"; ctx.textBaseline = "middle";
    const k = (S.zeit * 0.6) % 1; ctx.globalAlpha = 1 - k; ctx.fillText("Z", PX(d.x) + C * 0.8 + k * 10, PY(d.y) - C * 0.9 - k * 16); ctx.globalAlpha = 1;
  }

  function schlossZeichnen() {
    const s = S.schloss; if (!s) return;
    const m = schlossMitte();
    ctx.save();
    ctx.fillStyle = "rgba(9,8,15,.82)"; ctx.beginPath(); ctx.arc(m.x, m.y, m.r + 14, 0, 7); ctx.fill();
    ctx.strokeStyle = "rgba(224,160,70,.45)"; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(m.x, m.y, m.r + 14, 0, 7); ctx.stroke();
    ctx.strokeStyle = "#3a332d"; ctx.lineWidth = 9; ctx.beginPath(); ctx.arc(m.x, m.y, m.r, 0, 7); ctx.stroke();
    ctx.strokeStyle = s.tr.runen ? "#c4564a" : "#e0a046"; ctx.lineWidth = 9; ctx.shadowColor = ctx.strokeStyle; ctx.shadowBlur = 10;
    ctx.beginPath(); ctx.arc(m.x, m.y, m.r, s.zone - s.w / 2, s.zone + s.w / 2); ctx.stroke(); ctx.shadowBlur = 0;
    // Stifte
    for (let i = 0; i < s.tr.pins; i++) { const a = -Math.PI / 2 + (i - (s.tr.pins - 1) / 2) * 0.32; ctx.fillStyle = i < s.i ? "#ffcf7a" : "#4a423c"; ctx.beginPath(); ctx.arc(m.x + Math.cos(a) * (m.r - 22), m.y + Math.sin(a) * (m.r - 22) + 26, 4, 0, 7); ctx.fill(); }
    // Schlüsselloch
    ctx.fillStyle = "#14110e"; ctx.beginPath(); ctx.arc(m.x, m.y - 6, 7, 0, 7); ctx.fill(); ctx.beginPath(); ctx.moveTo(m.x - 4, m.y - 3); ctx.lineTo(m.x + 4, m.y - 3); ctx.lineTo(m.x + 6, m.y + 12); ctx.lineTo(m.x - 6, m.y + 12); ctx.fill();
    // Nadel
    ctx.strokeStyle = s.fehl > 0 ? "#c4564a" : s.blitz > 0 ? "#fff4d0" : "#ebe2cc"; ctx.lineWidth = 2.5; ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(m.x, m.y - 6); ctx.lineTo(m.x + Math.cos(s.ang) * (m.r + 6), m.y - 6 * 0 + Math.sin(s.ang) * (m.r + 6)); ctx.stroke();
    // Schließen
    ctx.fillStyle = "rgba(9,8,15,.9)"; ctx.strokeStyle = "rgba(224,160,70,.6)"; ctx.lineWidth = 1;
    const kx = m.x + m.r + 6, ky = m.y - m.r - 6;
    ctx.beginPath(); ctx.arc(kx, ky, 12, 0, 7); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#ebe2cc"; ctx.font = "15px " + FONT_D; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText("×", kx, ky + 1);
    ctx.restore();
  }

  function hudLinks(tx) {
    const k = endlosK();
    return (S.taeglich ? "📅 " + datumKurz(S.taeglich) : k ? tx.kurzEndlos(k) : tx.kurz(S.def.n, S.lvIdx % 3 + 1)) + (S.bed ? " " + tx.bed[S.bed][0].split(" ")[0] : "");
  }
  function sterneHud(x0, y, gr, abst) {
    const st = sterneJetzt();
    [1, 2, 4].forEach((b, i) => {
      const sx = x0 + i * abst, ok = st & b;
      sternPfad(sx, y, gr);
      if (ok) { ctx.fillStyle = "#e0a046"; ctx.fill(); }
      else if (b === 2) { ctx.strokeStyle = "rgba(224,160,70,.6)"; ctx.lineWidth = 1; ctx.stroke(); }
      else { ctx.fillStyle = "rgba(168,159,143,.25)"; ctx.fill(); }
    });
  }
  /* Text mit Zeilenumbruch (für die Seitenleiste im Querformat) */
  function umbruch(txt, x, y, breite, zeile, maxZ) {
    const woerter = String(txt).split(" "); let z = "", n = 0;
    for (let i = 0; i < woerter.length; i++) {
      const probe = z ? z + " " + woerter[i] : woerter[i];
      if (ctx.measureText(probe).width > breite && z) { ctx.fillText(n === maxZ - 1 ? z + " …" : z, x, y + n * zeile, breite); n++; z = woerter[i]; if (n >= maxZ) return n; }
      else z = probe;
    }
    if (z) { ctx.fillText(z, x, y + n * zeile, breite); n++; }
    return n;
  }
  function hudZeichnen() {
    if (istQuer) { hudQuer(); return; }
    const tx = t();
    ctx.fillStyle = "rgba(9,8,15,.82)"; ctx.fillRect(0, 0, W, OY);
    ctx.textBaseline = "top"; ctx.font = "14px " + FONT_D; ctx.fillStyle = "#a89f8f"; ctx.textAlign = "left";
    const links = hudLinks(tx);
    ctx.fillText(links, 9, 8);
    sterneHud(9 + ctx.measureText(links).width + 12, 15, 5.2, 14);
    ctx.textAlign = "center"; ctx.fillStyle = "#e0a046"; ctx.font = "21px " + FONT_D;
    ctx.fillText(String(S.punkte + S.lvGold), W / 2 + 8, 4);
    const tw = ctx.measureText(String(S.punkte + S.lvGold)).width;
    ctx.fillStyle = "#e0a046"; ctx.beginPath(); ctx.arc(W / 2 - tw / 2 - 4, 15, 5, 0, 7); ctx.fill(); ctx.strokeStyle = "#5a3a20"; ctx.lineWidth = 1; ctx.stroke();
    ctx.textAlign = "right"; ctx.font = (S.maxLeben > 4 ? 13 : 16) + "px " + FONT_D;
    let hs = ""; for (let i = 0; i < S.maxLeben; i++) hs += i < S.leben ? "♥" : "♡";
    ctx.fillStyle = S.leben <= 1 ? "#c4564a" : "#e0a046"; ctx.fillText(hs, W - 9, 8);
    // Aufsehen (links) und Lärm (rechts)
    const bx = 22, bw = W - 112, by = 31;
    ctx.font = "11px sans-serif"; ctx.textAlign = "left"; ctx.globalAlpha = 0.75; ctx.fillText("👁", 6, by - 4); ctx.fillText("👣", W - 84, by - 4); ctx.globalAlpha = 1;
    ctx.fillStyle = "rgba(235,226,204,.08)"; ctx.fillRect(bx, by, bw, 4);
    const g = ctx.createLinearGradient(bx, 0, bx + bw, 0); g.addColorStop(0, "#9b3a2f"); g.addColorStop(1, "#e0563a");
    ctx.fillStyle = g; ctx.fillRect(bx, by, bw * S.aufsehen / 100, 4);
    laermBalken(W - 64, by + 6, 55, 11);
    if (S.alarm && zustand === "spiel") { ctx.globalAlpha = 0.55 + 0.45 * Math.sin(S.zeit * 6); ctx.font = "bold 13px " + FONT_D; ctx.textAlign = "center"; ctx.textBaseline = "top"; const aw = ctx.measureText("⚠ " + tx.alarm).width + 14; ctx.fillStyle = "rgba(9,8,15,.7)"; ctx.fillRect(W / 2 - aw / 2, OY, aw, 18); ctx.fillStyle = "#c4564a"; ctx.fillText("⚠ " + tx.alarm, W / 2, OY + 3); ctx.globalAlpha = 1; }
    // Fußleiste
    ctx.fillStyle = "rgba(9,8,15,.82)"; ctx.fillRect(0, FUSS_Y, W, H - FUSS_Y);
    if (zustand !== "spiel" && zustand !== "gefasst" && zustand !== "nachstellung") return; // unter Tafeln nichts durchscheinen lassen
    ctx.textAlign = "left"; ctx.textBaseline = "middle";
    const zielTxt = S.offen && S.def.ziel !== "frei" ? tx.ziel.ausgang : tx.zielWort + zielName(S.def.ziel);
    ctx.font = "600 17px " + FONT_H; ctx.fillStyle = S.offen && S.def.ziel !== "frei" ? "#e0a046" : "#ebe2cc";
    const rand = W - 9 - knopfBreite();
    ctx.fillText(zielTxt, 9, FUSS_Y + 15, rand - 9);
    const A = S.auftrag;
    if (A) {
      const atx = A.typ === "zeit" ? tx.auftrag.zeit(Math.max(0, Math.ceil(A.limit - S.spielZeit))) : auftragName(A);
      ctx.font = "600 14px " + FONT_H; ctx.fillStyle = A.ok ? "#e0a046" : A.fehl ? "rgba(168,159,143,.6)" : "#c9b0e8";
      ctx.fillText((A.ok ? "✓ " : A.fehl ? "✗ " : "◆ ") + atx, 9, FUSS_Y + 36, rand - 9);
    }
    if (S.zielModus) { ctx.font = "600 16px " + FONT_H; ctx.fillStyle = "#ffcf7a"; ctx.textAlign = "center"; ctx.fillText(t().zielen, W / 2, OY + 14); }
  }
  /* Seitenleiste im Querformat: alles untereinander, unten Platz für die Knöpfe */
  function hudQuer() {
    const tx = t(), x0 = W, pw = BW - W, px = x0 + 12, iw = pw - 24;
    const g0 = ctx.createLinearGradient(x0, 0, BW, 0); g0.addColorStop(0, "rgba(14,12,20,.97)"); g0.addColorStop(1, "rgba(9,8,15,.97)");
    ctx.fillStyle = g0; ctx.fillRect(x0, 0, pw, H);
    ctx.fillStyle = "rgba(224,160,70,.28)"; ctx.fillRect(x0, 0, 1, H);
    ctx.textAlign = "left"; ctx.textBaseline = "top";
    let y = 12;
    ctx.font = "14px " + FONT_D; ctx.fillStyle = "#a89f8f"; ctx.fillText(hudLinks(tx), px, y, iw);
    y += 24; sterneHud(px + 6, y + 6, 6, 18);
    let hs = ""; for (let i = 0; i < S.maxLeben; i++) hs += i < S.leben ? "♥" : "♡";
    ctx.textAlign = "right"; ctx.font = (S.maxLeben > 4 ? 14 : 17) + "px " + FONT_D; ctx.fillStyle = S.leben <= 1 ? "#c4564a" : "#e0a046"; ctx.fillText(hs, px + iw, y - 1);
    y += 24;
    const gold = String(S.punkte + S.lvGold);
    ctx.fillStyle = "#e0a046"; ctx.beginPath(); ctx.arc(px + 8, y + 15, 7, 0, 7); ctx.fill(); ctx.strokeStyle = "#5a3a20"; ctx.lineWidth = 1; ctx.stroke();
    ctx.textAlign = "left"; ctx.font = "28px " + FONT_D; ctx.fillText(gold, px + 22, y, iw - 22);
    y += 42;
    ctx.font = "13px " + FONT_D; ctx.fillStyle = "#a89f8f"; ctx.fillText("👁 " + tx.aufsehenWort, px, y, iw);
    y += 19;
    ctx.fillStyle = "rgba(235,226,204,.08)"; ctx.fillRect(px, y, iw, 6);
    const g = ctx.createLinearGradient(px, 0, px + iw, 0); g.addColorStop(0, "#9b3a2f"); g.addColorStop(1, "#e0563a");
    ctx.fillStyle = g; ctx.fillRect(px, y, iw * S.aufsehen / 100, 6);
    y += 16;
    ctx.font = "13px " + FONT_D; ctx.fillStyle = "#a89f8f";
    const art = S.laerm > 0.02 ? (tx.grund[S.laermArt] || "") : tx.grund[grundBei(Math.floor(E.x), Math.floor(E.y))] || "";
    ctx.fillText("👣 " + tx.laermWort + (art ? " · " + art : ""), px, y, iw);
    y += 19; laermBalken(px, y + 16, iw, 15);
    y += 26;
    if (S.alarm) { ctx.globalAlpha = 0.55 + 0.45 * Math.sin(S.zeit * 6); ctx.fillStyle = "#c4564a"; ctx.font = "bold 15px " + FONT_D; ctx.fillText("⚠ " + tx.alarm, px, y, iw); ctx.globalAlpha = 1; y += 22; }
    if (zustand === "spiel" || zustand === "gefasst" || zustand === "nachstellung") {
      ctx.fillStyle = "rgba(224,160,70,.2)"; ctx.fillRect(px, y, iw, 1); y += 9;
      const zielTxt = S.offen && S.def.ziel !== "frei" ? tx.ziel.ausgang : tx.zielWort + zielName(S.def.ziel);
      ctx.font = "600 17px " + FONT_H; ctx.fillStyle = S.offen && S.def.ziel !== "frei" ? "#e0a046" : "#ebe2cc";
      y += umbruch(zielTxt, px, y, iw, 19, 3) * 19 + 5;
      const A = S.auftrag;
      if (A) {
        const atx = A.typ === "zeit" ? tx.auftrag.zeit(Math.max(0, Math.ceil(A.limit - S.spielZeit))) : auftragName(A);
        ctx.font = "600 15px " + FONT_H; ctx.fillStyle = A.ok ? "#e0a046" : A.fehl ? "rgba(168,159,143,.6)" : "#c9b0e8";
        umbruch((A.ok ? "✓ " : A.fehl ? "✗ " : "◆ ") + atx, px, y, iw, 17, 2);
      }
    }
    if (S.zielModus) { ctx.font = "600 16px " + FONT_H; ctx.fillStyle = "#ffcf7a"; ctx.textAlign = "center"; ctx.textBaseline = "top"; ctx.fillText(t().zielen, W / 2, OY + 8); }
  }

  function knopfBreite() {
    if (!buehne || !leinwand.clientWidth) return 120;
    const k = buehne.querySelector(".dn-knoepfe"); if (!k || !k.offsetWidth) return 60;
    return (k.offsetWidth + 10) * W / leinwand.clientWidth;
  }
  function zeichnen() {
    if (!hgBild || !S || !S.def) { ctx.setTransform(skala, 0, 0, skala, 0, 0); ctx.fillStyle = "#0b0a12"; ctx.fillRect(0, 0, BW, H); if (startBild) startZeichnen(); return; }
    ctx.setTransform(skala, 0, 0, skala, 0, 0);
    ctx.fillStyle = "#0b0a12"; ctx.fillRect(0, 0, BW, H);
    if (zustand === "nachstellung" && S.rep) { nachstellungZeichnen(); return; }
    ctx.save();
    if (S.beben > 0 && !ruhig) ctx.translate((rnd() - 0.5) * 7 * S.beben, (rnd() - 0.5) * 7 * S.beben);
    ctx.drawImage(hgBild, 0, OY, W, GH);
    objekteZeichnen();
    tiereZeichnen();
    // Figuren nach Tiefe
    const figs = [];
    S.gaeste.forEach(p => figs.push([p.y, () => gastZeichnen(p)]));
    S.wachen.forEach(g => figs.push([g.zustand === "aus" ? -1 : g.y, () => wacheZeichnen(g)]));
    figs.push([E.y, ezekielZeichnen]);
    if (S.drache) figs.push([S.drache.y, dracheZeichnen]);
    if (S.nezna && !S.nezna.gefangen) figs.push([S.nezna.y, neznaZeichnen]);
    if (S.boss) figs.push([S.boss.y, bossZeichnen]);
    briefZeichnen();
    figs.sort((a, b) => a[0] - b[0]).forEach(f => f[1]());
    const quellen = lichtQuellen();
    dunkelZeichnen(quellen);
    freundeZeichnen();
    lichterZeichnen();
    scheinZeichnen(quellen);
    mondZeichnen(); fensterZeichnen();
    ambZeichnen(); tierAugen();
    kegelAlle();
    ringeZeichnen();
    if (S.marke) {
      const a = 1 - S.marke.t / 0.6, mx = PX(S.marke.x), my = PY(S.marke.y);
      ctx.strokeStyle = (S.marke.nein ? "rgba(168,159,143," : "rgba(224,160,70,") + a.toFixed(2) + ")"; ctx.lineWidth = 1.5;
      if (S.marke.nein) { const k = C * 0.2; ctx.beginPath(); ctx.moveTo(mx - k, my - k); ctx.lineTo(mx + k, my + k); ctx.moveTo(mx + k, my - k); ctx.lineTo(mx - k, my + k); ctx.stroke(); }
      else { ctx.beginPath(); ctx.arc(mx, my, C * (0.2 + S.marke.t * 0.4), 0, 7); ctx.stroke(); }
    }
    wetterZeichnen(); pulseZeichnen();
    ezekielAugen(); neznaAugen();
    gastMarken(); wachenMarken(); dracheZzz();
    if (S.muenzFlug) { const m = S.muenzFlug, k = m.t, x = m.x0 + (m.x1 - m.x0) * k, y = m.y0 + (m.y1 - m.y0) * k - Math.sin(k * Math.PI) * 1.4; ctx.fillStyle = "#ffcf7a"; ctx.shadowColor = "#e0a046"; ctx.shadowBlur = 6; ctx.beginPath(); ctx.arc(PX(x), PY(y), 3.5, 0, 7); ctx.fill(); ctx.shadowBlur = 0; }
    S.teilchen.forEach(q => {
      ctx.globalAlpha = Math.max(0, Math.min(1, q.leben / q.max));
      if (q.note) { ctx.font = q.gr + "px " + FONT_D; ctx.fillStyle = q.farbe; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(q.note, PX(q.x), PY(q.y)); }
      else if (q.rund) { ctx.fillStyle = q.farbe; ctx.beginPath(); ctx.arc(PX(q.x), PY(q.y), q.gr * (1.4 - q.leben / q.max * 0.4), 0, 7); ctx.fill(); }
      else { ctx.fillStyle = q.farbe; ctx.fillRect(PX(q.x) - q.gr / 2, PY(q.y) - q.gr / 2, q.gr, q.gr); }
    });
    ctx.globalAlpha = 1;
    sprechblasen();
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    S.texte.forEach(x => {
      ctx.globalAlpha = Math.max(0, 1 - x.t / x.dauer);
      ctx.font = (x.gr > 21 ? "" : "600 ") + x.gr + "px " + (x.gr > 21 ? FONT_D : FONT_H);
      const hw = Math.min(W - 20, ctx.measureText(x.text).width) / 2 + 6, px = Math.max(hw, Math.min(W - hw, PX(x.x))), py = PY(x.y);
      ctx.fillStyle = "rgba(9,8,15,.7)"; ctx.fillText(x.text, px + 1, py + 1, W - 20);
      ctx.fillStyle = x.farbe; ctx.fillText(x.text, px, py, W - 20);
    });
    ctx.globalAlpha = 1;
    if (S.zornT > 0) { const g = ctx.createRadialGradient(W / 2, OY + GH / 2, GH * 0.3, W / 2, OY + GH / 2, GH * 0.75); g.addColorStop(0, "rgba(155,30,20,0)"); g.addColorStop(1, "rgba(155,30,20," + (0.25 + 0.1 * Math.sin(S.zeit * 10)).toFixed(2) + ")"); ctx.fillStyle = g; ctx.fillRect(0, OY, W, GH); }
    if (zustand === "gefasst" || zustand === "erwischt") { const g = ctx.createRadialGradient(W / 2, OY + GH / 2, GH * 0.2, W / 2, OY + GH / 2, GH * 0.75); g.addColorStop(0, "rgba(155,58,47,0)"); g.addColorStop(1, "rgba(155,58,47,.45)"); ctx.fillStyle = g; ctx.fillRect(0, OY, W, GH); }
    schlossZeichnen(); griffZeichnen();
    if (S.banner && zustand === "spiel") {
      const b = S.banner, k = b.t / b.dauer, a = k < 0.12 ? k / 0.12 : k > 0.75 ? (1 - k) / 0.25 : 1;
      ctx.save(); ctx.globalAlpha = Math.max(0, a); ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillStyle = "rgba(9,8,15,.62)"; ctx.fillRect(0, OY + GH / 2 - 44, W, 82);
      ctx.fillStyle = "#c4564a"; ctx.font = "34px " + FONT_D; ctx.fillText(b.titel, W / 2, OY + GH / 2 - 18);
      ctx.fillStyle = "#ebe2cc"; ctx.font = "600 19px " + FONT_H; ctx.fillText(b.unter, W / 2, OY + GH / 2 + 12, W - 20);
      ctx.font = "13px " + FONT_D; ctx.fillStyle = "#a89f8f"; ctx.fillText(t().alarmSub, W / 2, OY + GH / 2 + 31, W - 20);
      ctx.restore();
    }
    ctx.restore();
    hudZeichnen();
  }
  function startZeichnen() {
    // Titelbild hinter dem Startschleier: Ezekiels Porträt, abgedunkelt
    const b = startBild, f = Math.max(BW / b.width, H / b.height), w = b.width * f, h = b.height * f;
    ctx.globalAlpha = 0.55; ctx.drawImage(b, (BW - w) / 2, (H - h) / 2 - 20, w, h); ctx.globalAlpha = 1;
  }
  /* ---------- Nachstellung zeichnen: Wachrouten und Ezekiels Weg als Linien über die Karte ---------- */
  function spurLinie(arr, schritt, von, bis, farbe, breite, strich) {
    const n = arr.length / schritt; bis = Math.min(bis, n - 1); if (bis <= von) return;
    ctx.strokeStyle = farbe; ctx.lineWidth = breite; ctx.lineCap = "round"; ctx.lineJoin = "round"; if (strich) ctx.setLineDash(strich);
    ctx.beginPath(); ctx.moveTo(PX(arr[von * schritt]), PY(arr[von * schritt + 1]));
    const ganz = Math.floor(bis);
    for (let i = von + 1; i <= ganz; i++) ctx.lineTo(PX(arr[i * schritt]), PY(arr[i * schritt + 1]));
    if (bis > ganz && ganz + 1 < n) { const k = bis - ganz, a = ganz * schritt, b = a + schritt; ctx.lineTo(PX(arr[a] + (arr[b] - arr[a]) * k), PY(arr[a + 1] + (arr[b + 1] - arr[a + 1]) * k)); }
    ctx.stroke(); ctx.setLineDash([]);
  }
  function spurPunkt(arr, schritt, i) {
    const n = arr.length / schritt; i = Math.max(0, Math.min(n - 1, i));
    const a = Math.floor(i) * schritt, b = Math.min(n - 1, Math.floor(i) + 1) * schritt, k = i - Math.floor(i);
    return { x: arr[a] + (arr[b] - arr[a]) * k, y: arr[a + 1] + (arr[b + 1] - arr[a + 1]) * k, z: arr[a + 2] };
  }
  function nachstellungZeichnen() {
    const sp = S.spur, R = S.rep, tx = t(), k = R.dauer ? Math.min(1, R.t / R.dauer) : 1, jetzt = k * (sp.n - 1);
    ctx.drawImage(hgBild, 0, OY, W, GH);
    ctx.fillStyle = "rgba(9,8,15,.66)"; ctx.fillRect(0, OY, W, GH);
    // Wachen: ganze Route blass gestrichelt, schon gelaufener Teil kräftiger
    sp.w.forEach(w => {
      const n = w.p.length / 3; if (n < 2) return;
      spurLinie(w.p, 3, 0, n - 1, "rgba(224,190,110,.16)", 1.2, [3, 4]);
      const bis = jetzt - w.s;
      if (bis > 0) spurLinie(w.p, 3, 0, bis, "rgba(224,170,90,.5)", 1.8);
      if (bis >= 0) {
        const p = spurPunkt(w.p, 3, bis), px = PX(p.x), py = PY(p.y);
        if (p.z === 1) { ctx.strokeStyle = "#a89f8f"; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(px - 4, py - 4); ctx.lineTo(px + 4, py + 4); ctx.moveTo(px + 4, py - 4); ctx.lineTo(px - 4, py + 4); ctx.stroke(); }
        else { ctx.fillStyle = p.z === 2 ? "#e0563a" : "#e0a046"; ctx.beginPath(); ctx.arc(px, py, 4, 0, 7); ctx.fill(); ctx.strokeStyle = "rgba(9,8,15,.8)"; ctx.lineWidth = 1; ctx.stroke(); }
      }
    });
    // Ezekiels Weg: glühende scharlachrote Spur
    ctx.save(); ctx.shadowColor = "#ff6a3a"; ctx.shadowBlur = 8;
    spurLinie(sp.e, 2, 0, jetzt, "rgba(255,106,58,.95)", 2.6);
    ctx.restore();
    // Ereignisse
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    sp.ev.forEach(e => {
      if (e.i > jetzt + 0.5) return;
      const alter = (jetzt - e.i) * sp.dt, s = ruhig ? 1 : Math.min(1, 0.4 + alter * 2.5), px = PX(e.x), py = PY(e.y);
      ctx.save(); ctx.translate(px, py); ctx.scale(s, s);
      if (e.art === "klau" || e.art === "truhe") { ctx.fillStyle = "#e0a046"; ctx.beginPath(); ctx.arc(0, 0, e.art === "truhe" ? 6 : 4, 0, 7); ctx.fill(); ctx.strokeStyle = "#5a3a20"; ctx.lineWidth = 1; ctx.stroke(); }
      else if (e.art === "aus") { ctx.strokeStyle = "#c4564a"; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(-5, -5); ctx.lineTo(5, 5); ctx.moveTo(5, -5); ctx.lineTo(-5, 5); ctx.stroke(); }
      else if (e.art === "gesehen") { ctx.fillStyle = "rgba(196,86,74,.9)"; ctx.beginPath(); ctx.arc(0, 0, 7, 0, 7); ctx.fill(); ctx.fillStyle = "#fff4d0"; ctx.font = "bold 12px " + FONT_D; ctx.fillText("!", 0, 1); }
      else if (e.art === "schluessel") { ctx.font = "14px sans-serif"; ctx.fillText("🗝️", 0, 0); }
      else if (e.art === "brief") { ctx.fillStyle = "#e8dcc0"; ctx.fillRect(-6, -4, 12, 8); ctx.fillStyle = "#9b231b"; ctx.beginPath(); ctx.arc(0, 1, 2, 0, 7); ctx.fill(); }
      else if (e.art === "nezna") { ctx.fillStyle = "#b48ad8"; [-1, 1].forEach(q => { ctx.beginPath(); ctx.arc(q * 2.6, 0, 1.6, 0, 7); ctx.fill(); }); }
      else if (e.art === "boss") { sternPfad(0, 0, 7); ctx.fillStyle = "#ebe2cc"; ctx.fill(); }
      ctx.restore();
    });
    // Ezekiel selbst
    const ep = spurPunkt(sp.e, 2, jetzt), ex = PX(ep.x), ey = PY(ep.y);
    ctx.fillStyle = "#6b1c16"; ctx.beginPath(); ctx.arc(ex, ey, 6, 0, 7); ctx.fill();
    ctx.strokeStyle = "#ff6a3a"; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.strokeStyle = "#1a1210"; ctx.lineWidth = 2; [-1, 1].forEach(s => { ctx.beginPath(); ctx.moveTo(ex + s * 2, ey - 3); ctx.quadraticCurveTo(ex + s * 6, ey - 6, ex + s * 5, ey - 9); ctx.stroke(); });
    // Titel und Legende
    ctx.fillStyle = "rgba(9,8,15,.75)"; ctx.fillRect(0, OY, W, 46);
    ctx.fillStyle = "#e0a046"; ctx.font = "22px " + FONT_D; ctx.fillText("🎞 " + tx.nachstellung, W / 2, OY + 16, W - 20);
    ctx.fillStyle = "#a89f8f"; ctx.font = "600 14px " + FONT_H; ctx.fillText(tx.nachstellungUnter + " · " + tx.lv[S.def.basisIdx !== undefined ? S.def.basisIdx : S.lvIdx][0], W / 2, OY + 35, W - 20);
    const ly = OY + GH - 14;
    ctx.fillStyle = "rgba(9,8,15,.75)"; ctx.fillRect(0, ly - 13, W, 27);
    ctx.font = "13px " + FONT_D; ctx.textAlign = "left";
    ctx.strokeStyle = "#ff6a3a"; ctx.lineWidth = 2.6; ctx.beginPath(); ctx.moveTo(12, ly); ctx.lineTo(32, ly); ctx.stroke();
    ctx.fillStyle = "#ebe2cc"; ctx.fillText(tx.legendeE, 38, ly);
    const lx = 46 + ctx.measureText(tx.legendeE).width;
    ctx.strokeStyle = "rgba(224,170,90,.8)"; ctx.lineWidth = 1.8; ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.moveTo(lx, ly); ctx.lineTo(lx + 20, ly); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillText(tx.legendeW, lx + 26, ly);
    hudZeichnen();
  }

  /* ---------- Schleife ---------- */
  let sichtbar = false, letzte = 0, rafId = 0;
  function schleife(jetzt) {
    rafId = 0;
    const dt = Math.min(0.033, (jetzt - (letzte || jetzt)) / 1000);
    letzte = jetzt;
    if (zustand === "spiel" && S) update(dt);
    else if (zustand === "gefasst" && S) {
      S.zeit += dt; nebenbei(dt); S.gefasstT += dt;
      if (S.gefasstT > 1.2) { if (S.leben <= 0) spielEnde(); else erwischtZeigen(); }
    } else if (zustand === "nachstellung" && S && S.rep) {
      S.zeit += dt; S.rep.t += dt;
      if (S.rep.t >= S.rep.dauer + S.rep.halten) nachstellungEnde();
    } else if (S && S.def && zustand !== "pause") { S.zeit += dt; nebenbei(dt); }
    zeichnen();
    if (sichtbar && !document.hidden && zustand !== "pause" && zustand !== "start") rafId = requestAnimationFrame(schleife);
  }
  function anwerfen() { if (!rafId && sichtbar && !document.hidden) { letzte = 0; rafId = requestAnimationFrame(schleife); } }

  /* ---------- DOM & Overlays ---------- */
  let buehne, schleier, tafel, fussRekord, tonKnopf, pauseKnopf, muenzKnopf, zornKnopf, rauchKnopf, maskeKnopf, skipKnopf, listeEl, startAnsicht = "start";
  const rekordKey = st => "imres-diebesnacht-rekord-" + st;
  const aktuelleStufe = () => (S && zustand !== "start" ? S.stufe : stufeWahl);

  function aufbauen() {
    const tx = t();
    root.innerHTML =
      '<p class="label" id="dn-label">' + esc(tx.label) + '</p>' +
      '<h3 id="dn-titel">' + esc(tx.titel) + '</h3>' +
      '<p class="tav-info" id="dn-text">' + esc(tx.text) + '</p>' +
      '<p class="dn-steuerung" id="dn-steuerung">' + esc(tx.steuerung) + '</p>' +
      '<div class="dn-buehne"><div class="dn-knoepfe"><button type="button" class="dn-maske" hidden><span aria-hidden="true">🎭</span></button><button type="button" class="dn-rauch" hidden><span aria-hidden="true">🌫️</span></button><button type="button" class="dn-zorn" hidden><span aria-hidden="true">😈</span></button><button type="button" class="dn-muenze" hidden><span>0</span></button><button type="button" class="dn-pause" aria-label="Pause"><span aria-hidden="true">❚❚</span></button></div><button type="button" class="dn-skip" hidden></button><div class="dn-schleier"><div class="dn-tafel"></div></div></div>' +
      '<div class="dn-fuss"><span class="dn-rekord"></span><button type="button" class="dn-ton"></button></div>' +
      '<div class="dn-liste" aria-live="polite"></div>';
    buehne = root.querySelector(".dn-buehne");
    buehne.insertBefore(leinwand, buehne.firstChild);
    leinwand.setAttribute("aria-label", tx.titel);
    schleier = root.querySelector(".dn-schleier");
    tafel = root.querySelector(".dn-tafel");
    fussRekord = root.querySelector(".dn-rekord");
    tonKnopf = root.querySelector(".dn-ton");
    pauseKnopf = root.querySelector(".dn-pause");
    muenzKnopf = root.querySelector(".dn-muenze");
    zornKnopf = root.querySelector(".dn-zorn");
    zornKnopf.addEventListener("click", zornStarten);
    rauchKnopf = root.querySelector(".dn-rauch");
    rauchKnopf.addEventListener("click", rauchWerfen);
    maskeKnopf = root.querySelector(".dn-maske");
    maskeKnopf.addEventListener("click", maskeAnlegen);
    skipKnopf = root.querySelector(".dn-skip");
    skipKnopf.addEventListener("click", nachstellungEnde);
    listeEl = root.querySelector(".dn-liste");
    tonKnopf.addEventListener("click", () => { tonAn = !tonAn; schreib("imres-diebesnacht-ton", tonAn ? "1" : "0"); fussSetzen(); if (tonAn) KLANG.klau(); });
    pauseKnopf.addEventListener("click", pausieren);
    muenzKnopf.addEventListener("click", () => { if (zustand !== "spiel" || !S || S.muenzen <= 0) return; S.zielModus = !S.zielModus; S.schloss = null; muenzKnopfSetzen(); });
    tafel.addEventListener("click", tafelKlick);
    tafel.addEventListener("keydown", e => { if (e.key === "Enter" && e.target.closest(".dn-name")) { e.preventDefault(); eintragen(); } });
    fussSetzen();
  }
  function fussSetzen() {
    const tx = t(), st = aktuelleStufe(), r = parseInt(lies(rekordKey(st), "0"), 10);
    fussRekord.textContent = r ? tx.rekord(r, tx.stufen[st]) : "";
    tonKnopf.textContent = tonAn ? tx.ton[0] : tx.ton[1];
    tonKnopf.setAttribute("aria-pressed", String(tonAn));
    pauseKnopf.setAttribute("aria-label", tx.pauseKnopf);
    muenzKnopf.setAttribute("aria-label", tx.muenzeKnopf);
    zornKnopf.setAttribute("aria-label", tx.zornKnopf); zornKnopf.title = tx.zornKnopf;
    rauchKnopf.setAttribute("aria-label", tx.rauchKnopf); rauchKnopf.title = tx.rauchKnopf;
    maskeKnopf.setAttribute("aria-label", tx.maskeKnopf); maskeKnopf.title = tx.maskeKnopf;
    skipKnopf.textContent = tx.ueberspringen;
    muenzKnopf.firstChild && (muenzKnopf.title = tx.muenzeKnopf);
  }
  function texteSetzen() {
    const tx = t();
    root.querySelector("#dn-label").textContent = tx.label;
    root.querySelector("#dn-titel").textContent = tx.titel;
    root.querySelector("#dn-text").textContent = tx.text;
    root.querySelector("#dn-steuerung").textContent = tx.steuerung;
    leinwand.setAttribute("aria-label", tx.titel);
    fussSetzen(); listeNeu();
    if (zustand === "start") startZeigen();
    else if (zustand === "pause") pauseZeigen();
    else if (zustand === "intro") introZeigen();
    else if (zustand === "brief") briefZeigen();
    else if (zustand === "wahl") gabenZeigen(true);
    else if (zustand === "erwischt") erwischtZeigen(true);
    else if (zustand === "ende") spielEnde(true);
  }
  /* Tafel: Der Inhalt darf scrollen, der Haupt-Knopf (und was direkt dazugehört) steht immer sichtbar darunter */
  function schleierAuf(html) {
    tafel.innerHTML = '<div class="dn-inhalt"><div class="dn-innen">' + html + '</div></div><div class="dn-tafel-fuss"></div>';
    const innen = tafel.querySelector(".dn-innen"), fuss = tafel.querySelector(".dn-tafel-fuss");
    Array.from(innen.children).forEach(el => { if (el.matches(".dn-haupt, .dn-leise, .dn-gaben")) fuss.appendChild(el); });
    schleier.hidden = false; buehne.classList.remove("laeuft");
    const inhalt = tafel.querySelector(".dn-inhalt");
    tafel.classList.toggle("scrollt", inhalt.scrollHeight > inhalt.clientHeight + 2);
  }
  function schleierZu() { schleier.hidden = true; buehne.classList.add("laeuft"); }

  function stufenHtml(tx) {
    const frei = freiNaechte();
    if (nachtWahl > frei) nachtWahl = 1;
    return '<div class="dn-stufen" role="radiogroup" aria-label="' + esc(tx.stufenTitel) + '">' +
      Object.keys(STUFEN).map(k => '<button type="button" role="radio" data-stufe="' + k + '" aria-checked="' + (k === stufeWahl) + '">' + esc(tx.stufen[k]) + '</button>').join("") +
      '</div><p class="dn-stufen-text">' + esc(tx.stufenText[stufeWahl]) + '</p>' +
      (frei > 1 ? '<div class="dn-naechte"><span>' + esc(tx.nachtWahl) + '</span>' + Array.from({ length: NAECHTE() }, (_, i) => i + 1).map(n => '<button type="button" data-nacht="' + n + '" aria-pressed="' + (n === nachtWahl) + '"' + (n > frei ? " disabled" : "") + ' title="' + esc(tx.naechte[n - 1][0]) + '">' + n + '</button>').join("") + '<button type="button" disabled title="' + esc(tx.folgt) + '">?</button></div>' : "") +
      sammlungHtml(tx);
  }
  function sammlungHtml(tx) {
    const st = sterneLesen().reduce((a, b) => a + bits(b || 0), 0), nz = NEZNA_LEVELS.filter(i => neznaLesen() & (1 << i)).length;
    if (!st && !nz) return "";
    return '<p class="dn-sammlung">' + esc(tx.sterneGesamt(st, LEVELS.length * 3)) + (nz ? " · " + esc(tx.neznaZahl(nz, NEZNA_LEVELS.length)) : "") + '</p>';
  }
  function sterneHtml(tx, st, neu) {
    return '<p class="dn-sterne">' + tx.sterne.map((n, i) => { const b = 1 << i; return '<span class="' + (st & b ? "an" : "") + (neu & b ? " neu" : "") + '" data-neu="' + esc(tx.neu) + '">' + (st & b ? "★" : "☆") + " " + esc(n) + '</span>'; }).join("") + '</p>';
  }
  function startZeigen() {
    const tx = t();
    if (startAnsicht === "versteck") return versteckZeigen();
    if (startAnsicht.indexOf("brief:") === 0) return archivBriefZeigen(startAnsicht.slice(6));
    if (startAnsicht === "taeglich") return taeglichZeigen();
    const zug = zugLesen();
    schleierAuf('<h4>' + esc(tx.titel) + '</h4>' +
      (zug ? '<div class="dn-fortsetzen"><button type="button" class="tav-knopf dn-haupt" data-tun="fortsetzen">' + esc(tx.fortsetzen) + '</button><p class="dn-stufen-text">' +
        esc(tx.fortsetzenInfo(stufeName(zug.s.lvIdx), zug.s.punkte, zug.s.leben) + " · " + tx.stufen[zug.s.stufe]) + '</p></div>' : "") +
      stufenHtml(tx) +
      '<button type="button" class="tav-knopf dn-haupt" data-tun="start">' + esc(zug ? tx.neuerZug : tx.start) + '</button>' +
      '<div class="dn-nebenwege"><button type="button" class="dn-weg" data-tun="taeglichZeigen">' + esc(tx.taeglichKnopf) + '</button>' +
      '<button type="button" class="dn-weg" data-tun="versteck">' + esc(tx.versteckKnopf(VS.gold)) + '</button></div>');
  }
  function versteckZeigen() {
    const tx = t();
    const waren = Object.keys(WAREN).map(k => {
      const [n, d] = tx.ware[k], h = hat(k), geht = VS.gold >= WAREN[k];
      return '<li><span class="sym">' + WARE_SYM[k] + '</span><span class="dn-ware-text"><strong>' + esc(n) + '</strong><small>' + esc(d) + '</small></span>' +
        (h ? '<span class="dn-hat">' + esc(tx.gekauft) + '</span>' : '<button type="button" class="dn-kauf" data-kauf="' + k + '"' + (geht ? "" : " disabled") + '>' + esc(tx.kaufen(WAREN[k])) + '</button>') + '</li>';
    }).join("");
    const skins = Object.keys(SKINS).map(k => {
      const [n, d] = tx.skins[k], sk = SKINS[k], h = k === "scharlach" || hat("skin_" + k), an = VS.skin === k;
      return '<li><span class="dn-farbe" style="background:radial-gradient(circle at 40% 40%,' + sk.k + ',' + sk.u1 + ')"><i style="background:' + sk.a + '"></i><i style="background:' + sk.a + '"></i></span><span class="dn-ware-text"><strong>' + esc(n) + '</strong><small>' + esc(d) + '</small></span>' +
        (an ? '<span class="dn-hat">' + esc(tx.getragen) + '</span>' : h ? '<button type="button" class="dn-kauf" data-skin="' + k + '">' + esc(tx.tragen) + '</button>' : '<button type="button" class="dn-kauf" data-skin="' + k + '"' + (VS.gold >= sk.preis ? "" : " disabled") + '>' + esc(tx.kaufen(sk.preis)) + '</button>') + '</li>';
    }).join("");
    const alle = ["n1", "n2", "n3", "n4", "n5"].concat(BRIEFE_ENDLOS);
    const briefe = VS.briefe.length ? '<ul class="dn-briefliste">' + alle.filter(b => VS.briefe.indexOf(b) >= 0).map(b => '<li><button type="button" data-brief="' + b + '">✉ ' + esc(tx.briefe[b][0]) + '</button></li>').join("") + '</ul>' : '<p class="dn-leer">' + esc(tx.keineBriefe) + '</p>';
    schleierAuf('<h4>' + esc(tx.versteck) + '</h4><p>' + esc(tx.versteckText) + '</p><p class="dn-gold">' + esc(tx.versteckGold(VS.gold)) + '</p>' +
      '<h5 class="dn-abschnitt">' + esc(tx.ausruestung) + '</h5><ul class="dn-waren">' + waren + '</ul>' +
      '<h5 class="dn-abschnitt">' + esc(tx.ruestungen) + '</h5><ul class="dn-waren">' + skins + '</ul>' +
      '<h5 class="dn-abschnitt">' + esc(tx.briefeTitel) + ' · ' + VS.briefe.length + '/' + alle.length + '</h5>' + briefe +
      '<button type="button" class="dn-leise" data-tun="zurueck">' + esc(tx.zurueck) + '</button>');
  }
  function archivBriefZeigen(id) {
    const tx = t(), [titel, text] = tx.briefe[id] || ["", ""];
    schleierAuf('<div class="dn-brief"><h5>' + esc(titel) + '</h5><p>' + esc(text) + '</p></div><button type="button" class="dn-leise" data-tun="versteck">' + esc(tx.zurueck) + '</button>');
  }
  function taeglichPlan(tag) {
    const alt = rnd; rnd = mulberry(hashText("imres-" + tag));
    const idx = Math.floor(rnd() * LEVELS.length), spiegel = rnd() < 0.5;
    const def = spiegel ? spiegeln(LEVELS[idx]) : JSON.parse(JSON.stringify(LEVELS[idx]));
    def.basisIdx = idx; def.bed = zufall(BED); def.schluesselZeigen = false;
    const g = mischen(Object.keys(GABEN).filter(k => k !== "rast" && k !== "schritt")).slice(0, 2);
    const seed = Math.floor(rnd() * 1e9);
    rnd = alt;
    return { idx, def, gaben: g, seed };
  }
  function taeglichZeigen() {
    const tx = t(), tag = heute(), plan = taeglichPlan(tag), best = parseInt(lies("imres-diebesnacht-tag-" + tag, "0"), 10);
    const [titel] = tx.lv[plan.idx], [bn, bt] = tx.bed[plan.def.bed];
    schleierAuf('<p class="dn-nacht">' + esc(tx.taeglichTitel(datumKurz(tag))) + '</p><h4>' + esc(titel) + '</h4><p>' + esc(tx.taeglichText) + '</p>' +
      '<p class="dn-extra"><b>' + esc(bn) + '</b> – ' + esc(bt) + '</p>' +
      '<p class="dn-gabenzeile">' + esc(tx.taeglichGaben) + ' ' + plan.gaben.map(k => GABE_SYM[k] + " " + esc(tx.gaben[k][0][0])).join(" · ") + '</p>' +
      (best ? '<p class="dn-gold">' + esc(tx.taeglichBest(best)) + '</p>' : "") +
      '<button type="button" class="tav-knopf dn-haupt" data-tun="taeglich">' + esc(tx.los) + '</button>' +
      '<button type="button" class="dn-leise" data-tun="zurueck">' + esc(tx.zurueck) + '</button>');
    tagLaden(tag);
  }
  function taeglichStarten() {
    const tag = heute(), plan = taeglichPlan(tag);
    neuesSpiel("schurke");
    S.taeglich = tag; S.tagSeed = plan.seed;
    plan.gaben.forEach(k => { if (S.gaben[k] < GABEN[k]) S.gaben[k]++; });
    rnd = mulberry(plan.seed); stufeLaden(plan.idx, plan.def); rnd = Math.random;
  }
  function introZeigen() {
    const tx = t(), k = endlosK(), idx = k ? S.def.basisIdx : S.lvIdx, [titel, tipp] = tx.lv[idx], nacht = tx.naechte[S.def.n - 1];
    const tg = S.taeglich, A = S.auftrag;
    if (!S.hinweise) { // neue Hinweise je ein paar Mal zeigen, dann nicht mehr
      const mal = (k, n) => { const v = parseInt(lies("imres-diebesnacht-tipp-" + k, "0"), 10) || 0; if (v >= n) return false; schreib("imres-diebesnacht-tipp-" + k, String(v + 1)); return true; };
      S.hinweise = {
        laerm: mal("laerm", 3),
        griff: S.gaeste.some(p => p.gold > 0) && mal("griff", 2),
        mond: !!(S.mond && S.mond.basis + S.mond.amp > 0.7) && mal("mond", 3)
      };
    }
    const H2 = S.hinweise, sti = S.stimmung;
    const extra = (txt, cls) => '<p class="dn-extra' + (cls ? " " + cls : "") + '">' + txt + '</p>';
    schleierAuf(
      '<p class="dn-nacht">' + esc(tg ? tx.taeglichTitel(datumKurz(tg)) : k ? tx.endlos(k) : tx.nacht(S.def.n) + " · " + nacht[0]) + '</p>' +
      '<h4>' + esc(titel) + '</h4>' +
      '<p class="dn-ort">' + esc(tg ? nacht[0] + " · " + nacht[1] : k ? tx.endlosUnter : nacht[1] + " · " + tx.stufe(S.lvIdx % 3 + 1, 3)) + '</p>' +
      (sti && sti.wetter ? '<p class="dn-stimmung">' + esc(tx.wetter[sti.wetter] + " · " + tx.tageszeit[sti.zeit]) + '</p>' : "") +
      (!k && !tg && S.lvIdx % 3 === 0 ? extra("„" + esc(tx.geschichte[S.def.n - 1]) + "“", "dn-geschichte") : "") +
      '<p class="dn-tipp">' + esc(tipp) + '</p>' +
      (S.fortsetzHinweis ? extra(esc(tx.fortsetzenErwischt), "dn-bed") : "") +
      (S.bed ? extra("<b>" + esc(tx.bed[S.bed][0]) + "</b> – " + esc(tx.bed[S.bed][1]), "dn-bed") : "") +
      (S.def.ziel !== "frei" && S.lvIdx < 3 && !k && !tg ? extra(esc(tx.alarmHinweis)) : "") +
      (S.wachen.some(g => g.T.auge) ? extra(esc(tx.magierHinweis)) : "") +
      (S.wachen.some(g => g.T.hauptmann && !g.T.auge) ? extra(esc(tx.hauptmannHinweis)) : "") +
      (S.boss ? extra(esc(tn("glasstabHinweis"))) : "") +
      ((S.def.flucht || []).length && !tg ? extra(esc(tx.ilvaraHinweis)) : "") +
      (S.lvIdx >= 3 && S.lvIdx < 6 && !k && !tg ? extra(esc(tx.leichenHinweis)) : "") +
      (S.wachen.some(g => g.T.hund) ? '<p class="dn-extra">' + esc(tx.hundHinweis) + '</p>' : "") +
      (S.nezna ? '<p class="dn-extra">' + esc(S.nezna.form === "drow" ? tx.neznaDrow : tx.neznaHinweis) + '</p>' : "") +
      (H2.laerm ? extra(esc(tx.laermHinweis)) : "") +
      (H2.griff ? extra(esc(tx.griffHinweis)) : "") +
      (H2.mond ? extra(esc(tx.mondHinweis)) : "") +
      '<p class="dn-zielzeile">' + esc(tx.zielWort + zielName(S.def.ziel)) + '</p>' +
      (A ? '<p class="dn-auftragzeile">◆ ' + esc(tx.auftragWort + auftragName(A)) + '</p>' : "") +
      (!k && !tg ? sterneHtml(tx, sterneLesen()[S.lvIdx] || 0, 0) : "") +
      '<button type="button" class="tav-knopf dn-haupt" data-tun="los">' + esc(tx.los) + '</button>');
  }
  function gabenListe(tx) {
    const g = Object.keys(S.gaben).filter(k => k !== "rast" && S.gaben[k] > 0);
    return g.length ? '<p class="dn-gabenzeile">' + esc(tx.gaben2) + ' ' + g.map(k => GABE_SYM[k] + " " + esc(tx.gaben[k][Math.min(S.gaben[k], tx.gaben[k].length) - 1][0])).join(" · ") + '</p>' : "";
  }
  function pauseZeigen() {
    const tx = t();
    schleierAuf('<h4>' + esc(tx.pause) + '</h4><p>' + esc(tx.pauseText) + '</p>' + gabenListe(tx) + '<button type="button" class="tav-knopf dn-haupt" data-tun="weiter">' + esc(tx.weiter) + '</button>' +
      '<button type="button" class="dn-leise" data-tun="beenden">' + esc(tx.beenden) + '</button>');
  }
  function erwischtZeigen(nurNeuZeichnen) {
    const tx = t();
    if (!nurNeuZeichnen) { zustand = "erwischt"; aufsehen(10); }
    schleierAuf('<h4>' + esc(tx.erwischt) + '</h4><p>' + esc(tx.erwischtText(S.leben)) + '</p>' +
      '<p class="dn-spruch">„' + esc(zufall(tx.ezekielStumm)) + '“ <span>– Ezekiel</span></p>' +
      '<button type="button" class="tav-knopf dn-haupt" data-tun="erneut">' + esc(tx.erneut) + '</button>' +
      '<button type="button" class="dn-leise" data-tun="beenden">' + esc(tx.beenden) + '</button>');
  }

  let angebot = [];
  function gabenZeigen(nurNeuZeichnen) {
    const tx = t();
    if (!nurNeuZeichnen) {
      const moegl = Object.keys(GABEN).filter(k => k === "rast" ? S.leben < S.maxLeben : S.gaben[k] < GABEN[k]);
      const ohneRast = moegl.filter(k => k !== "rast");
      const rastRein = moegl.includes("rast") && (S.leben <= 1 || rnd() < 0.35);
      angebot = mischen(ohneRast).slice(0, rastRein ? 2 : 3);
      if (rastRein) angebot.push("rast");
      if (!angebot.length) angebot = ["rast"];
      setTimeout(KLANG.gabe, 500);
    }
    const dreh = [-1.2, 0.8, -0.5];
    const karten = angebot.map((k, i) => {
      const lvl = S.gaben[k], stufen = tx.gaben[k], [name, text] = stufen[Math.min(lvl, stufen.length - 1)];
      const stufe = GABEN[k] > 1 && GABEN[k] < 99 ? '<span class="stufe">' + esc(tx.stufe(lvl + 1, GABEN[k])) + '</span>' : "";
      return '<button type="button" class="dn-gabe" data-gabe="' + k + '" style="--dreh:' + dreh[i] + 'deg"><span class="sym" aria-hidden="true">' + GABE_SYM[k] + '</span><span class="dn-gabe-text"><strong>' + esc(name) + stufe + '</strong><small>' + esc(text) + '</small></span></button>';
    }).join("");
    const nachtTxt = S.nachtEnde ? (S.lvIdx + 1 === LEVELS.length ? tx.alleGeschafft : tx.nachtGeschafft(S.def.n)) : "";
    schleierAuf('<h4>' + esc(tx.geschafft) + '</h4>' +
      sterneHtml(tx, S.lvSterne, S.lvSterneNeu) +
      '<p class="dn-bilanz">' + esc(tx.beute) + ': <b>+' + S.lvGold + '</b>' + (S.lvBonus ? ' · ' + esc(tx.ungesehenBonus(S.lvBonus)) : "") +
      (S.lvGoldBonus || S.lvBlutBonus ? '<br>' + esc(tx.sterneBonus(S.lvGoldBonus, S.lvBlutBonus)) : "") +
      (S.lvAuftrag ? '<br>' + esc(tx.auftragBonus(S.lvAuftrag)) : "") + '</p>' +
      (nachtTxt ? '<p class="dn-spruch">' + esc(nachtTxt) + '</p>' : "") +
      (S.spur && S.spur.n > 3 ? '<p class="dn-wieder"><button type="button" class="dn-leise" data-tun="nachstellung">' + esc(tx.nochmalAnsehen) + '</button></p>' : "") +
      '<p>' + esc(tx.rastText) + '</p>' +
      '<div class="dn-gaben">' + karten + '</div>' +
      '<button type="button" class="dn-leise" data-tun="beenden">' + esc(tx.beenden) + '</button>');
  }

  function spielEnde(nurNeuZeichnen) {
    const tx = t();
    if (!nurNeuZeichnen) {
      zustand = "ende";
      KLANG.ende();
      const alt = S.taeglich ? 0 : parseInt(lies(rekordKey(S.stufe), "0"), 10);
      S.neuerRekord = !S.taeglich && S.punkte > alt && S.punkte > 0;
      if (S.neuerRekord) schreib(rekordKey(S.stufe), String(S.punkte));
      S.altRekord = alt;
      const e = S.erreicht;
      S.spruchStufe = S.taeglich ? (S.leben <= 0 ? "schwach" : S.geist ? "gut" : "mittel") : e >= LEVELS.length ? "legende" : e >= 6 ? "gut" : e >= 3 ? "mittel" : "schwach";
      S.spruchIdx = Math.floor(rnd() * 3);
      S.eingetragen = ""; S.sendet = false; S.fehler = ""; S.endgueltig = false; S.lokal = null; S.nameEingabe = null;
      if (!S.taeglich) zugLoeschen();
      S.versteckPlus = S.punkte; VS.gold += S.punkte; versteckSchreiben(VS);
      if (S.taeglich) {
        const k = "imres-diebesnacht-tag-" + S.taeglich, alt2 = parseInt(lies(k, "0"), 10);
        if (S.punkte > alt2) schreib(k, String(S.punkte));
        S.neuerRekord = false; tagLaden(S.taeglich);
      }
    }
    const spruch = tx.spruch[S.spruchStufe][S.spruchIdx];
    schleierAuf(
      (S.taeglich ? '<p class="dn-nacht">' + esc(tx.taeglichTitel(datumKurz(S.taeglich))) + '</p>' : "") +
      '<h4>' + esc(S.leben > 0 ? tx.titel : tx.ende) + '</h4>' +
      '<p class="dn-gross">' + S.punkte + ' <span>' + esc(tx.punkte) + ' · ' + esc(tx.stufen[S.stufe]) + '</span></p>' +
      (S.versteckPlus ? '<p class="dn-gold">' + esc(tx.versteckPlus(S.versteckPlus)) + '</p>' : "") +
      (S.neuerRekord && S.altRekord ? '<p class="dn-neu">' + esc(tx.neuRekord) + '</p>' : "") +
      '<dl class="dn-werte">' +
      (S.taeglich ? "" : '<dt>' + esc(tx.wert.stufe) + '</dt><dd>' + esc(stufeName(S.lvIdx)) + '</dd>') +
      '<dt>' + esc(tx.wert.bestohlen) + '</dt><dd>' + S.klau + '</dd>' +
      '<dt>' + esc(tx.wert.aus) + '</dt><dd>' + S.aus + '</dd>' +
      '<dt>' + esc(tx.wert.geist) + '</dt><dd>' + S.geist + '</dd>' +
      '<dt>★</dt><dd>' + S.sterneRun + '</dd>' +
      (S.neznaRun ? '<dt>🐈‍⬛</dt><dd>' + S.neznaRun + '</dd>' : "") +
      (S.auftraege ? '<dt>' + esc(tx.wert.auftraege) + '</dt><dd>' + S.auftraege + '</dd>' : "") +
      (S.meister ? '<dt>' + esc(tx.wert.meister) + '</dt><dd>' + S.meister + '</dd>' : "") +
      '</dl>' +
      '<p class="dn-spruch">„' + esc(spruch) + '“ <span>– Ezekiel</span></p>' +
      eintragHtml(tx) +
      '<button type="button" class="tav-knopf dn-haupt" data-tun="neu">' + esc(tx.nochmal) + '</button>');
    fussSetzen(); listeNeu();
  }
  function stufeName(idx) {
    if (idx >= LEVELS.length) return "∞ " + (idx - LEVELS.length + 1);
    return Math.floor(idx / 3) + 1 + "·" + (idx % 3 + 1);
  }

  function tafelKlick(e) {
    const st = e.target.closest("[data-stufe]");
    if (st && zustand === "start") {
      stufeWahl = st.dataset.stufe; schreib("imres-diebesnacht-stufe", stufeWahl);
      startZeigen(); fussSetzen(); bestenLaden(stufeWahl);
      return;
    }
    const kauf = e.target.closest("[data-kauf]");
    if (kauf && zustand === "start") { const k = kauf.dataset.kauf; if (!hat(k) && VS.gold >= WAREN[k]) { VS.gold -= WAREN[k]; VS.kauf[k] = 1; versteckSchreiben(VS); KLANG.schluessel(); } versteckZeigen(); return; }
    const sk = e.target.closest("[data-skin]");
    if (sk && zustand === "start") { const k = sk.dataset.skin, frei = k === "scharlach" || hat("skin_" + k); if (!frei && VS.gold >= SKINS[k].preis) { VS.gold -= SKINS[k].preis; VS.kauf["skin_" + k] = 1; KLANG.schluessel(); } if (k === "scharlach" || hat("skin_" + k)) VS.skin = k; versteckSchreiben(VS); versteckZeigen(); return; }
    const br = e.target.closest("[data-brief]");
    if (br && zustand === "start") { startAnsicht = "brief:" + br.dataset.brief; KLANG.papier(); startZeigen(); return; }
    const na = e.target.closest("[data-nacht]");
    if (na && zustand === "start") { nachtWahl = parseInt(na.dataset.nacht, 10) || 1; startZeigen(); return; }
    const g = e.target.closest("[data-gabe]");
    if (g && zustand === "wahl") {
      const k = g.dataset.gabe;
      if (k === "rast") S.leben = Math.min(S.maxLeben, S.leben + 1); else S.gaben[k]++;
      audio();
      stufeLaden(S.lvIdx + 1);
      zustand = "intro"; introZeigen(); anwerfen();
      return;
    }
    if (e.target.closest(".dn-eintragen")) { eintragen(); return; }
    const b = e.target.closest("[data-tun]"); if (!b) return;
    const tun = b.dataset.tun;
    /* kleine Bildschirme: beim Start gleich ins Vollbild (muss direkt im Klick passieren) */
    if (tun === "start" || tun === "fortsetzen" || tun === "taeglich") { if (window.tavVollAuto) window.tavVollAuto("diebesnacht"); }
    audio();
    if (tun === "fortsetzen") { startAnsicht = "start"; zugFortsetzen(); fussSetzen(); listeNeu(); }
    else if (tun === "start") { startAnsicht = "start"; zugLoeschen(); neuesSpiel(); stufeLaden((nachtWahl - 1) * 3); zustand = "intro"; introZeigen(); fussSetzen(); listeNeu(); anwerfen(); }
    else if (tun === "versteck") { startAnsicht = "versteck"; VS = versteckLesen(); startZeigen(); }
    else if (tun === "taeglichZeigen") { startAnsicht = "taeglich"; startZeigen(); }
    else if (tun === "zurueck") { startAnsicht = "start"; startZeigen(); listeNeu(); }
    else if (tun === "taeglich") { startAnsicht = "start"; taeglichStarten(); zustand = "intro"; introZeigen(); fussSetzen(); listeNeu(); anwerfen(); }
    else if (tun === "los") { zustand = "spiel"; if (S.fortsetzHinweis) S.fortsetzHinweis = false; if (!S.taeglich) zugSpeichern(true); schleierZu(); muenzKnopfSetzen(); anwerfen(); }
    else if (tun === "erneut") { if (S.taeglich) rnd = mulberry(S.tagSeed); stufeLaden(S.lvIdx, S.def); rnd = Math.random; zugSpeichern(true); zustand = "spiel"; schleierZu(); anwerfen(); }
    else if (tun === "neu") { zustand = "start"; S = null; startAnsicht = "start"; startZeigen(); fussSetzen(); bestenLaden(stufeWahl); zeichnen(); }
    else if (tun === "weiter") { zustand = "spiel"; schleierZu(); anwerfen(); }
    else if (tun === "nachstellung" && zustand === "wahl") { nachstellungStarten(() => { zustand = "wahl"; gabenZeigen(true); }); }
    else if (tun === "beenden") { if (zustand === "wahl" || zustand === "erwischt") { /* Beute dieser Stufe zählt nicht */ } spielEnde(); }
  }

  function pausieren() {
    if (zustand !== "spiel") return;
    zustand = "pause"; S.zielModus = false; muenzKnopfSetzen();
    pauseZeigen();
  }
  document.addEventListener("keydown", e => {
    if (zustand === "nachstellung" && sichtbar && (e.key === "Escape" || e.key === " " || e.key === "Enter")) { e.preventDefault(); nachstellungEnde(); return; }
    if (zustand !== "spiel" || !sichtbar) return;
    if (e.key === "Escape" || e.key === "p" || e.key === "P") { e.preventDefault(); if (S.schloss) S.schloss = null; else pausieren(); }
    if (e.key === " " && (S.schloss || S.griff)) { e.preventDefault(); if (e.repeat) return; if (S.griff) griffTippen(); else { const m = schlossMitte(); schlossTippen({ x: m.x, y: m.y }); } }
  });

  /* ---------- Bestenliste: gemeinsam über Supabase (wie bei Friedrichs Jagd), sonst auf diesem Gerät ---------- */
  const SERVER = { url: "https://iszdxkwkgkksdemtqhwu.supabase.co", key: "sb_publishable_Bt3Vw5BSnLaVcTRPTS0ZsA_MeG6G2-Z" };
  /* Fehler kommen als { status, msg } zurück (msg = Meldung des Servers); nach 10 s wird abgebrochen */
  function server(pfad, body) {
    const h = { apikey: SERVER.key, "Content-Type": "application/json" };
    const opt = body === undefined ? { headers: h, cache: "no-store" } : { method: "POST", headers: h, body: JSON.stringify(body) };
    const ab = window.AbortController ? new AbortController() : null, uhr = ab && setTimeout(() => ab.abort(), 10000);
    if (ab) opt.signal = ab.signal;
    const fertig = () => clearTimeout(uhr);
    return fetch(SERVER.url + pfad, opt)
      .then(r => r.ok ? (r.status === 204 ? null : r.json()) : r.json().catch(() => ({})).then(j => Promise.reject({ status: r.status, msg: String((j && (j.message || j.hint)) || "") })))
      .then(v => { fertig(); return v; }, f => { fertig(); return Promise.reject(f && f.status ? f : { status: 0, msg: "", netz: true }); });
  }
  /* Servermeldung → freundlicher Text; endgueltig = nochmal senden hilft nicht */
  function fehlerText(f, T) {
    const m = (f && f.msg) || "";
    if (!f || f.netz || !f.status || f.status === 404 || f.status >= 500) return { text: T.fehler.netz };
    const k = Object.keys(T.fehler).find(x => x.length > 2 && m.indexOf(x) >= 0), endgueltig = /falscher Tag|ungültig/i.test(m);
    return { text: k ? T.fehler[k] : endgueltig ? T.fehler.endgueltig : T.fehler._, endgueltig };
  }
  const besten = {}, serverOk = {}; let meinEintrag = null;
  const lokalLesen = () => { try { return JSON.parse(localStorage.getItem("imres-diebesnacht-liste") || "{}") || {}; } catch (_) { return {}; } };
  const sortieren = l => l.sort((a, b) => b.punkte - a.punkte || b.level - a.level || String(a.erstellt).localeCompare(String(b.erstellt)));
  function bestenLaden(st) {
    return server("/rest/v1/diebe_bestenliste?select=name,punkte,level,erstellt&stufe=eq." + st + "&order=punkte.desc,level.desc,erstellt.asc&limit=10")
      .then(l => { besten[st] = Array.isArray(l) ? l : []; serverOk[st] = true; })
      .catch(() => { serverOk[st] = false; besten[st] = sortieren(lokalLesen()[st] || []).slice(0, 10); })
      .then(listeNeu);
  }
  const bestenTag = {}, tagOk = {};
  const tagLokal = () => { try { return JSON.parse(localStorage.getItem("imres-diebesnacht-tagliste") || "{}") || {}; } catch (_) { return {}; } };
  function tagLaden(tag) {
    return server("/rest/v1/diebe_taeglich?select=name,punkte,erstellt&tag=eq." + tag + "&order=punkte.desc,erstellt.asc&limit=10")
      .then(l => { bestenTag[tag] = Array.isArray(l) ? l : []; tagOk[tag] = true; })
      .catch(() => { tagOk[tag] = false; bestenTag[tag] = (tagLokal()[tag] || []).sort((a, b) => b.punkte - a.punkte).slice(0, 10); })
      .then(listeNeu);
  }
  function listeNeu() {
    if (!listeEl) return;
    const T = t();
    const tag = S && S.taeglich ? S.taeglich : (zustand === "start" && startAnsicht === "taeglich" ? heute() : null);
    if (tag) {
      const l = bestenTag[tag];
      if (!l) { listeEl.innerHTML = ""; return; }
      listeEl.innerHTML = '<h4>' + esc(T.taeglichListe) + " · " + esc(datumKurz(tag)) + "</h4>" +
        (l.length ? "<table><thead><tr><th>#</th><th>Name</th><th>" + esc(T.spalten[2]) + "</th></tr></thead><tbody>" +
          l.map((e, i) => "<tr" + (meinEintrag && e.erstellt === meinEintrag ? ' class="mein"' : "") + "><td>" + (i < 3 ? ["🥇", "🥈", "🥉"][i] : i + 1) + "</td><td>" + esc(e.name) + "</td><td>" + e.punkte + "</td></tr>").join("") +
          "</tbody></table>" : '<p class="dn-leer">' + esc(T.leer2) + "</p>") +
        (tagOk[tag] === false ? '<p class="dn-leer">' + esc(T.nurHier) + "</p>" : "");
      return;
    }
    const st = aktuelleStufe(), l = besten[st];
    if (!l) { listeEl.innerHTML = ""; return; }
    listeEl.innerHTML = '<h4>' + T.bestenliste + " · " + esc(T.stufen[st]) + "</h4>" +
      (l.length ? "<table><thead><tr>" + T.spalten.map(x => "<th>" + esc(x) + "</th>").join("") + "</tr></thead><tbody>" +
        l.map((e, i) => "<tr" + (meinEintrag && e.erstellt === meinEintrag ? ' class="mein"' : "") + "><td>" + (i < 3 ? ["🥇", "🥈", "🥉"][i] : i + 1) + "</td><td>" + esc(e.name) + "</td><td>" + e.punkte + "</td><td>" + esc(stufeName(Math.max(0, (e.level || 1) - 1))) + "</td></tr>").join("") +
        "</tbody></table>" : '<p class="dn-leer">' + esc(T.leer2) + "</p>") +
      (serverOk[st] === false ? '<p class="dn-leer">' + esc(T.nurHier) + "</p>" : "");
  }
  function eintragHtml(T) {
    if (!S || S.punkte <= 0) return "";
    if (S.eingetragen) return '<p class="dn-eingetragen">' + esc(S.eingetragen) + "</p>";
    if (S.endgueltig) return '<p class="dn-fehler" role="alert">' + esc(S.fehler) + "</p>";
    const name = S.nameEingabe != null ? S.nameEingabe : lies("imres-diebesnacht-name", "") || lies("imres-waldlauf-name", "") || lies("imres-auftritt-name", "");
    return '<div class="dn-eintrag">' + ImresKuerzel.feld({ klasse: "dn-name", aus: S.sendet }) +
      '<button type="button" class="tav-knopf dn-eintragen"' + (S.sendet ? " disabled" : "") + ">" + esc(S.sendet ? T.sendet : T.eintragen) + "</button></div>" +
      (S.fehler ? '<p class="dn-fehler" role="alert">' + esc(S.fehler) + "</p>" : "");
  }
  function endeNeu() { const alt = tafel.querySelector(".dn-inhalt"), y = alt ? alt.scrollTop : 0; spielEnde(true); const neu = tafel.querySelector(".dn-inhalt"); if (neu) neu.scrollTop = y; }
  /* gemeinsamer Ablauf für beide Listen: senden, bei Erfolg Platz zeigen, sonst freundlich erklären und Feld wieder freigeben */
  function senden(spiel, T, rpc, body, laden, finden) {
    spiel.fehler = ""; spiel.sendet = true; endeNeu();
    server(rpc, body).then(() => laden().then(() => {
      spiel.sendet = false;
      const l = finden(), platz = l.i + 1;
      if (platz) meinEintrag = l.e.erstellt;
      spiel.eingetragen = platz ? T.eingetragen(platz) : T.eingetragenOhne;
      if (S === spiel && zustand === "ende") endeNeu(); else listeNeu();
    }), f => {
      const F = fehlerText(f, T);
      spiel.sendet = false; spiel.fehler = F.text; spiel.endgueltig = !!F.endgueltig;
      return laden().then(() => {
        if (S !== spiel || zustand !== "ende") return;
        endeNeu();
        const fe = tafel.querySelector(".dn-name"); if (fe) { try { fe.focus({ preventScroll: true }); fe.select(); } catch (_) {} }
      });
    });
  }
  function eintragen() {
    if (!S || zustand !== "ende" || S.eingetragen || S.sendet || S.endgueltig) return;
    const feld = tafel.querySelector(".dn-name"), name = ImresKuerzel.wert(feld);
    if (!name) { if (feld) feld.focus(); return; }
    schreib("imres-diebesnacht-name", name);
    if (S.taeglich) { tagEintragen(name); return; }
    const T = t(), st = S.stufe, spiel = S;
    const e = { name, punkte: S.punkte, level: S.lvIdx + 1, erstellt: new Date().toISOString() };
    /* auf diesem Gerät merken – ein früherer, abgelehnter Versuch desselben Zugs wird ersetzt */
    const lok = lokalLesen(), alt = spiel.lokal; lok[st] = sortieren((lok[st] || []).filter(x => !alt || x.erstellt !== alt).concat([e])).slice(0, 10);
    schreib("imres-diebesnacht-liste", JSON.stringify(lok));
    spiel.lokal = e.erstellt; spiel.nameEingabe = name;
    senden(spiel, T, "/rest/v1/rpc/diebe_eintragen", { p_name: name, p_stufe: st, p_punkte: e.punkte, p_level: e.level }, () => bestenLaden(st), () => {
      const l = besten[st] || [], i = l.findIndex(x => x.name === name && x.punkte === e.punkte && x.level === e.level);
      return { i, e: l[i] };
    });
  }

  function tagEintragen(name) {
    const T = t(), tag = S.taeglich, spiel = S;
    const e = { name, punkte: S.punkte, erstellt: new Date().toISOString() };
    const lok = tagLokal(), alt = spiel.lokal; lok[tag] = (lok[tag] || []).filter(x => !alt || x.erstellt !== alt).concat([e]).sort((a, b) => b.punkte - a.punkte).slice(0, 10);
    Object.keys(lok).forEach(k => { if (k < tag.slice(0, 8) + "00" && Object.keys(lok).length > 14) delete lok[k]; });
    schreib("imres-diebesnacht-tagliste", JSON.stringify(lok));
    spiel.lokal = e.erstellt; spiel.nameEingabe = name;
    senden(spiel, T, "/rest/v1/rpc/diebe_taeglich_eintragen", { p_tag: tag, p_name: name, p_punkte: e.punkte }, () => tagLaden(tag), () => {
      const l = bestenTag[tag] || [], i = l.findIndex(x => x.name === name && x.punkte === e.punkte);
      return { i, e: l[i] };
    });
  }

  /* ---------- Eingabe ---------- */
  function punkt(ev) {
    const r = leinwand.getBoundingClientRect();
    return { x: (ev.clientX - r.left) * BW / r.width, y: (ev.clientY - r.top) * H / r.height };
  }
  const druecke = new Map();
  leinwand.addEventListener("pointerdown", ev => {
    if (zustand === "nachstellung") { ev.preventDefault(); nachstellungEnde(); return; }
    if (zustand !== "spiel") return;
    ev.preventDefault();
    audio();
    /* Schloss knacken und Taschendiebstahl: der Moment des Antippens zählt, nicht das Loslassen */
    if (S && S.griff) { druecke.delete(ev.pointerId); griffTippen(); return; }
    if (S && S.schloss) { druecke.delete(ev.pointerId); schlossTippen(punkt(ev)); muenzKnopfSetzen(); return; }
    druecke.set(ev.pointerId, { x: ev.clientX, y: ev.clientY, t: performance.now() });
  });
  leinwand.addEventListener("pointerup", ev => {
    const d = druecke.get(ev.pointerId); druecke.delete(ev.pointerId);
    if (!d || zustand !== "spiel") return;
    // leicht verrutschte Finger zählen trotzdem; nur deutliches Wischen wird ignoriert
    const weg = Math.hypot(ev.clientX - d.x, ev.clientY - d.y), lang = performance.now() - d.t;
    if (weg > 40 || (weg > 24 && lang > 450)) return;
    tippen(punkt({ clientX: (ev.clientX + d.x) / 2, clientY: (ev.clientY + d.y) / 2 }));
    muenzKnopfSetzen();
  });
  leinwand.addEventListener("pointercancel", ev => { druecke.delete(ev.pointerId); });
  leinwand.addEventListener("contextmenu", ev => ev.preventDefault());

  /* ---------- Größe ---------- */
  function groesse() {
    const r = leinwand.getBoundingClientRect(); if (!r.width) return;
    const dpr = Math.min(2.5, window.devicePixelRatio || 1);
    leinwand.width = Math.round(r.width * dpr); leinwand.height = Math.round(r.height * dpr);
    skala = leinwand.width / BW;
    const inhalt = tafel && tafel.querySelector(".dn-inhalt");
    if (inhalt) tafel.classList.toggle("scrollt", inhalt.scrollHeight > inhalt.clientHeight + 2);
    zeichnen();
  }
  /* Querformat-Aufteilung im Vollbild auf breiten Bildschirmen (Handy quer, Handheld, Laptop) */
  function layoutPruefen() {
    const quer = root.classList.contains("tav-voll") && window.innerWidth > window.innerHeight * 1.05;
    if (quer === istQuer) return;
    istQuer = quer;
    OY = quer ? 0 : 42; H = quer ? GH : 560; FUSS_Y = OY + GH; BW = quer ? W + QUER_PANEL : W;
    root.classList.toggle("dn-quer", quer);
    buehne.style.setProperty("--dn-ar", (BW / H).toFixed(5));
    groesse();
  }

  /* ---------- Stil ---------- */
  const css = document.createElement("style");
  css.textContent = `
.diebesnacht .dn-steuerung { font-size: .86rem; color: var(--ash); font-style: italic; }
.dn-buehne { position: relative; width: 100%; max-width: min(100%, calc(78vh * ${W / H})); justify-self: center; aspect-ratio: var(--dn-ar, ${W} / ${H}); container: dnb / size; border: 1px solid var(--line); background: #0b0a12; overflow: hidden; user-select: none; -webkit-user-select: none; -webkit-touch-callout: none; box-shadow: 0 14px 30px rgba(0,0,0,.45); }
.dn-buehne canvas { position: absolute; inset: 0; display: block; width: 100%; height: 100%; touch-action: pan-y; cursor: pointer; -webkit-tap-highlight-color: transparent; }
.dn-buehne.laeuft canvas { touch-action: none; }
.dn-schleier { position: absolute; inset: 0; z-index: 3; display: flex; justify-content: center; padding: clamp(.45rem, 3.5cqmin, 1.2rem); background: rgba(9,8,15,.94); -webkit-backdrop-filter: blur(3px); backdrop-filter: blur(3px); text-align: center; overflow: hidden; }
.dn-schleier[hidden] { display: none; }
/* Tafel: oben der Inhalt (darf scrollen), unten der Haupt-Knopf – der bleibt immer sichtbar */
.dn-tafel { display: flex; flex-direction: column; width: 100%; max-width: 30rem; height: 100%; min-height: 0; }
.dn-inhalt { flex: 1 1 auto; min-height: 0; overflow-y: auto; overscroll-behavior: contain; display: flex; flex-direction: column; scrollbar-width: thin; scrollbar-color: rgba(224,160,70,.35) transparent; }
.dn-innen { display: grid; grid-template-columns: minmax(0, 1fr); gap: .55rem; justify-items: center; margin: auto 0; padding: .15rem .1rem; }
.dn-innen > * { max-width: 100%; }
.dn-tafel-fuss { flex: none; display: grid; gap: .35rem; justify-items: center; padding-top: .55rem; }
.dn-tafel-fuss:empty { display: none; }
.dn-tafel.scrollt .dn-tafel-fuss { border-top: 1px solid rgba(224,160,70,.22); box-shadow: 0 -12px 14px -10px rgba(0,0,0,.7); }
.dn-tafel .dn-stimmung { font-size: .8rem; letter-spacing: .04em; color: #d8cfb8 !important; }
.dn-wieder { margin: 0; }
.dn-tafel h4 { font-family: var(--name); font-weight: 400; font-size: clamp(1.45rem, 5.5vw, 2rem); line-height: 1.05; color: var(--vellum); margin: 0; }
.dn-tafel p { color: var(--ash); font-size: .92rem; margin: 0; }
.dn-tafel .tav-knopf { justify-self: center; }
.dn-tafel .dn-haupt { font-size: 1rem; padding: .55rem 1.3rem; background: color-mix(in srgb, var(--blood) 22%, transparent); }
.dn-tafel .dn-nacht { font-family: var(--body); font-size: .72rem; font-weight: 600; letter-spacing: .18em; text-transform: uppercase; color: var(--ember) !important; }
.dn-tafel .dn-ort { font-style: italic; font-size: .86rem; }
.dn-tafel .dn-tipp { color: var(--vellum) !important; font-size: .95rem; line-height: 1.4; max-width: 24rem; }
.dn-tafel .dn-zielzeile { font-family: var(--hand); font-size: 1.3rem; color: var(--ember) !important; }
.dn-tafel .dn-bilanz { color: var(--vellum) !important; }
.dn-tafel .dn-bilanz b { color: var(--ember); }
.dn-tafel .dn-gross { font-family: var(--display); font-size: clamp(2.2rem, 9vw, 3rem); color: var(--ember) !important; line-height: 1; }
.dn-gross span { font-size: .4em; color: var(--ash); }
.dn-tafel .dn-neu { font-family: var(--hand); font-size: 1.35rem; color: var(--vellum) !important; }
.dn-werte { display: grid; grid-template-columns: auto auto; gap: .15rem 1.1rem; font-size: .88rem; margin: 0; text-align: left; }
.dn-werte dt { color: var(--ash); } .dn-werte dd { margin: 0; color: var(--vellum); font-weight: 600; text-align: right; }
.dn-tafel .dn-spruch { font-family: var(--hand); font-size: 1.25rem; line-height: 1.15; color: var(--ember) !important; }
.dn-spruch span { font-family: var(--body); font-size: .8rem; color: var(--ash); white-space: nowrap; }
.dn-gaben { display: grid; gap: .6rem; width: 100%; grid-template-columns: repeat(3, minmax(0, 1fr)); }
.dn-gabe { display: grid; gap: .3rem; justify-items: center; align-content: start; padding: .75rem .5rem .7rem; border: 0; cursor: pointer; font: inherit; text-align: center;
  background: linear-gradient(172deg, #f1e7cf, #ddcca8); color: #2a2118; box-shadow: 0 8px 18px rgba(0,0,0,.45);
  transform: rotate(var(--dreh, 0deg)); transition: transform .2s, box-shadow .2s; -webkit-tap-highlight-color: transparent; }
.dn-gabe:hover, .dn-gabe:focus-visible { transform: translateY(-3px) rotate(var(--dreh, 0deg)); box-shadow: 0 0 0 2px var(--blood), 0 12px 24px rgba(0,0,0,.5); outline: none; }
.dn-gabe .sym { font-size: 1.7rem; line-height: 1; }
.dn-gabe-text { display: grid; gap: .15rem; }
.dn-gabe strong { font-family: var(--name); font-weight: 400; font-size: 1.05rem; line-height: 1.1; color: #1d1610; }
.dn-gabe .stufe { display: block; font-family: var(--body); font-size: .66rem; letter-spacing: .06em; text-transform: uppercase; color: var(--blood); }
.dn-gabe small { font-size: .8rem; line-height: 1.25; color: #5a4a36; }
@media (max-width: 480px) {
  .dn-gaben { grid-template-columns: 1fr; gap: .45rem; }
  .dn-gabe { grid-template-columns: auto 1fr; justify-items: start; align-items: center; text-align: left; gap: .6rem; padding: .4rem .7rem; }
  .dn-gabe .sym { font-size: 1.35rem; }
  .dn-gabe strong { font-size: .98rem; }
  .dn-gabe .stufe { display: inline; margin-left: .35rem; }
  .dn-gabe small { font-size: .76rem; line-height: 1.2; }
  .dn-innen { gap: .4rem; }
  .dn-tafel h4 { font-size: 1.35rem; }
  .dn-tafel p { font-size: .85rem; }
  .dn-tafel .dn-tipp { font-size: .88rem; }
  .dn-tafel .dn-gross { font-size: 2.1rem; }
  .dn-werte { font-size: .78rem; gap: 0 .6rem; grid-template-columns: auto auto auto auto; }
  .dn-tafel .dn-spruch { font-size: 1.1rem; }
  .dn-tafel .dn-haupt { padding: .4rem 1.1rem; font-size: .95rem; }
}
.dn-leise { background: none; border: 0; color: var(--ash); font: inherit; font-size: .85rem; text-decoration: underline; text-underline-offset: 3px; cursor: pointer; padding: .2rem; }
@media (pointer: coarse) { .dn-leise { min-height: 2.4rem; min-width: 2.4rem; padding: .4rem .7rem; } }
.dn-knoepfe { position: absolute; right: 6px; bottom: 1.2%; z-index: 2; display: none; gap: 6px; height: max(7%, 36px); }
.dn-buehne.rep .dn-knoepfe { display: none !important; }
.dn-skip { position: absolute; right: 6px; bottom: 1.2%; z-index: 2; height: max(7%, 38px); padding: 0 .9rem; border: 1px solid var(--ember); border-radius: 999px; background: rgba(9,8,15,.8); color: var(--ember); font: inherit; font-size: .88rem; cursor: pointer; touch-action: manipulation; }
.dn-skip[hidden] { display: none; }
.dn-skip:hover, .dn-skip:focus-visible { background: var(--ember); color: var(--night, #0b0a12); outline: none; }
.dn-knoepfe .dn-maske { font-size: 1.05rem; background: linear-gradient(to top, rgba(224,160,70,.5) var(--f, 0%), rgba(9,8,15,.7) var(--f, 0%)); }
.dn-knoepfe .dn-maske.an { border-color: var(--ember); }
.dn-buehne.laeuft .dn-knoepfe { display: flex; }
.dn-knoepfe button { height: 100%; min-width: 2.6rem; padding: 0 .55rem; border: 1px solid var(--line); border-radius: 999px; background: rgba(9,8,15,.7); color: var(--vellum); font: inherit; font-size: .85rem; cursor: pointer; -webkit-tap-highlight-color: transparent; display: grid; place-items: center; }
.dn-knoepfe button[hidden] { display: none; }
.dn-knoepfe .dn-pause { letter-spacing: -.1em; aspect-ratio: 1; padding: 0; }
.dn-knoepfe .dn-muenze::before { content: "🪙 "; }
.dn-knoepfe .dn-zorn { font-size: 1.05rem; background: linear-gradient(to top, rgba(155,58,47,.85) var(--f, 0%), rgba(9,8,15,.7) var(--f, 0%)); }
.dn-knoepfe .dn-zorn:not(.bereit):not(.an) { opacity: .75; }
.dn-knoepfe .dn-zorn.bereit { border-color: #c4564a; box-shadow: 0 0 12px rgba(196,86,74,.8); animation: dn-puls 1s ease-in-out infinite; }
.dn-knoepfe .dn-zorn.an { border-color: #ff6a3a; }
@keyframes dn-puls { 50% { transform: scale(1.1); box-shadow: 0 0 20px rgba(196,86,74,1); } }
.dn-nebenwege { display: flex; flex-wrap: wrap; justify-content: center; gap: .4rem; }
.dn-weg { border: 1px solid var(--line); background: rgba(9,8,15,.45); color: var(--vellum); font: inherit; font-size: .84rem; padding: .38rem .7rem; cursor: pointer; }
.dn-weg:hover, .dn-weg:focus-visible { border-color: var(--ember); color: var(--ember); }
.dn-tafel .dn-gold { color: var(--ember) !important; font-family: var(--display); font-size: 1rem; }
.dn-tafel .dn-geschichte { color: var(--vellum) !important; font-family: var(--hand); font-size: 1.15rem; font-style: normal; }
.dn-tafel .dn-bed { color: #e2d6b8 !important; font-style: normal; }
.dn-tafel .dn-auftragzeile { font-family: var(--hand); font-size: 1.1rem; color: #c9b0e8 !important; }
.dn-tafel .dn-gabenzeile { font-size: .82rem; }
.dn-abschnitt { font-family: var(--display); font-weight: 400; font-size: .74rem; letter-spacing: .14em; text-transform: uppercase; color: var(--ember); margin: .4rem 0 0; justify-self: stretch; text-align: left; border-bottom: 1px solid var(--line); padding-bottom: .2rem; }
.dn-waren { list-style: none; margin: 0; padding: 0; display: grid; gap: .35rem; width: 100%; }
.dn-waren li { display: grid; grid-template-columns: 2rem minmax(0, 1fr) auto; gap: .55rem; align-items: center; text-align: left; padding: .3rem .4rem; background: rgba(235,226,204,.04); border: 1px solid rgba(224,160,70,.12); }
.dn-waren .sym { font-size: 1.3rem; text-align: center; }
.dn-ware-text { display: grid; gap: .05rem; }
.dn-ware-text strong { font-family: var(--name); font-weight: 400; color: var(--vellum); font-size: .98rem; }
.dn-ware-text small { color: var(--ash); font-size: .76rem; line-height: 1.2; }
.dn-kauf { border: 1px solid var(--ember); background: rgba(224,160,70,.14); color: var(--ember); font: inherit; font-size: .8rem; padding: .3rem .55rem; white-space: nowrap; cursor: pointer; }
.dn-kauf:disabled { opacity: .4; cursor: default; border-color: var(--line); color: var(--ash); background: none; }
.dn-hat { color: var(--ember); font-size: .8rem; white-space: nowrap; }
.dn-farbe { width: 1.7rem; height: 1.7rem; border-radius: 50%; display: flex; justify-content: center; align-items: center; gap: 4px; justify-self: center; box-shadow: 0 0 0 1px rgba(0,0,0,.5); }
.dn-farbe i { width: 4px; height: 4px; border-radius: 50%; box-shadow: 0 0 4px currentColor; }
.dn-briefliste { list-style: none; margin: 0; padding: 0; display: flex; flex-wrap: wrap; gap: .35rem; justify-content: center; }
.dn-briefliste button { border: 1px solid var(--line); background: rgba(235,226,204,.06); color: var(--vellum); font: inherit; font-size: .82rem; padding: .3rem .55rem; cursor: pointer; }
.dn-brief { background: linear-gradient(172deg, #f1e7cf, #ddcca8); color: #2a2118; padding: 1rem 1.1rem 1.1rem; max-width: 24rem; box-shadow: 0 10px 24px rgba(0,0,0,.5); transform: rotate(-.6deg); text-align: left; }
.dn-brief h5 { margin: 0 0 .45rem; font-family: var(--name); font-weight: 400; font-size: 1.1rem; color: #5a1712; }
.dn-tafel .dn-brief p { color: #2a2118 !important; font-family: var(--hand); font-size: 1.25rem; line-height: 1.25; }
.dn-knoepfe .dn-rauch { font-size: 1rem; }
.dn-sterne { display: flex; flex-wrap: wrap; justify-content: center; gap: .3rem .7rem; font-size: .85rem; margin: 0; }
.dn-sterne span { color: var(--ash); opacity: .55; white-space: nowrap; }
.dn-sterne span.an { color: var(--ember); opacity: 1; }
.dn-sterne span.neu::after { content: attr(data-neu); margin-left: .25rem; font-family: var(--hand); font-size: 1.05rem; color: var(--vellum); }
.dn-tafel .dn-sammlung { font-size: .82rem; color: var(--ash); }
.dn-tafel .dn-extra { font-size: .86rem; color: #c9b0e8 !important; font-style: italic; max-width: 24rem; }
.dn-knoepfe .dn-muenze.an { border-color: var(--ember); color: var(--ember); background: rgba(224,160,70,.18); }
.dn-knoepfe button:hover, .dn-knoepfe button:focus-visible { border-color: var(--ember); color: var(--ember); }
.dn-stufen { display: flex; flex-wrap: wrap; justify-content: center; gap: .3rem; }
.dn-stufen button, .dn-naechte button { border: 1px solid var(--line); background: rgba(9,8,15,.4); color: var(--vellum); font: inherit; font-size: .82rem; padding: .38rem .55rem; white-space: nowrap; cursor: pointer; }
.dn-stufen button[aria-checked="true"], .dn-naechte button[aria-pressed="true"] { border-color: var(--ember); background: rgba(224,160,70,.18); color: var(--ember); }
.dn-naechte { display: flex; flex-wrap: wrap; justify-content: center; align-items: center; gap: .3rem; font-size: .82rem; color: var(--ash); }
.dn-naechte button { min-width: 2.1rem; }
.dn-naechte button:disabled { opacity: .35; cursor: default; }
.dn-tafel .dn-stufen-text { font-style: italic; font-size: .85rem; min-height: 1.3em; }
.dn-eintrag { display: flex; flex-wrap: wrap; justify-content: center; gap: .4rem; }
.dn-name { background: rgba(0,0,0,.35); border: 1px solid var(--line); color: var(--vellum); font: inherit; font-size: .9rem; padding: .4rem .6rem; width: 10.5rem; min-width: 0; }
.dn-eintrag .tav-knopf { font-size: .88rem; padding: .4rem .8rem; }
.dn-tafel .dn-eingetragen { color: var(--ember); }
.dn-tafel .dn-fehler { color: #e08a7e; font-size: .88rem; }
.dn-eintrag input:disabled, .dn-eintrag button:disabled { opacity: .6; }
.dn-fortsetzen { display: grid; gap: .3rem; justify-items: center; }
.dn-buehne button, .dn-tafel button, .dn-fuss button { touch-action: manipulation; }
.dn-liste { width: 100%; max-width: min(100%, calc(78vh * ${W / H})); justify-self: center; }
.dn-liste:empty { display: none; }
.dn-liste h4 { font-family: var(--display); font-size: .78rem; letter-spacing: .14em; text-transform: uppercase; color: var(--ember); margin: .2rem 0 .4rem; font-weight: 400; }
.dn-liste table { width: 100%; border-collapse: collapse; font-size: .88rem; }
.dn-liste th { text-align: left; font-weight: normal; color: var(--ash); font-size: .75rem; border-bottom: 1px solid var(--line); padding: .25rem .4rem; }
.dn-liste td { padding: .3rem .4rem; border-bottom: 1px solid rgba(235,226,204,.06); }
.dn-liste td:nth-child(3), .dn-liste th:nth-child(3), .dn-liste td:nth-child(4), .dn-liste th:nth-child(4) { text-align: right; }
.dn-liste tr.mein td { color: var(--ember); }
.dn-leer { color: var(--ash); font-size: .85rem; font-style: italic; margin: .3rem 0 0; }
.dn-fuss { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: .5rem; font-size: .88rem; color: var(--ash); }
.dn-ton { background: none; border: 1px solid var(--line); color: var(--ash); font: inherit; font-size: .84rem; padding: .3rem .75rem; cursor: pointer; }
.dn-ton:hover { color: var(--vellum); border-color: var(--ember); }
@media (prefers-reduced-motion: reduce) { .dn-gabe { transition: none; } .dn-knoepfe .dn-zorn.bereit { animation: none; } }
/* niedrige Spielfläche: Tafeln kompakter (Mindestschrift bleibt gut lesbar) */
@container dnb (max-height: 600px) {
  .dn-tafel h4 { font-size: 1.4rem; }
  .dn-tafel p { font-size: .84rem; }
  .dn-tafel .dn-tipp { font-size: .88rem; line-height: 1.32; }
  .dn-tafel .dn-extra { font-size: .8rem; line-height: 1.3; }
  .dn-tafel .dn-geschichte { font-size: 1.02rem; line-height: 1.2; }
  .dn-tafel .dn-zielzeile { font-size: 1.15rem; }
  .dn-tafel .dn-auftragzeile { font-size: 1rem; }
  .dn-innen { gap: .4rem; }
  .dn-tafel .dn-haupt { padding: .42rem 1.2rem; }
}
@container dnb (max-height: 430px) {
  .dn-tafel h4 { font-size: 1.2rem; }
  .dn-tafel p, .dn-tafel .dn-tipp { font-size: .78rem; }
  .dn-tafel .dn-extra { font-size: .74rem; }
  .dn-tafel .dn-geschichte { font-size: .95rem; }
  .dn-tafel .dn-zielzeile { font-size: 1.05rem; }
  .dn-innen { gap: .3rem; }
  .dn-tafel-fuss { padding-top: .4rem; gap: .25rem; }
  .dn-tafel .dn-haupt { padding: .34rem 1.1rem; font-size: .95rem; }
  .dn-gabe { padding: .45rem .4rem; }
  .dn-gabe .sym { font-size: 1.3rem; }
  .dn-gabe small { font-size: .72rem; }
}
/* Querformat im Vollbild: Spielfeld links (Karte + Seitenleiste), Steuerung und Bestenliste rechts daneben */
.diebesnacht.dn-quer .dn-knoepfe { left: calc(${(W / (W + QUER_PANEL) * 100).toFixed(3)}% + 8px); right: 8px; bottom: 8px; height: auto; flex-wrap: wrap-reverse; justify-content: center; }
.diebesnacht.dn-quer .dn-knoepfe button { height: 40px; min-width: 40px; }
.diebesnacht.dn-quer .dn-skip { right: 8px; bottom: 8px; height: 40px; }
.tav-karte#diebesnacht.tav-voll.dn-quer { padding: .5rem !important; row-gap: .6rem; }
@media not all and (min-width: 2200px) and (min-height: 1200px) and (min-aspect-ratio: 19/10) {
  .tav-karte#diebesnacht.tav-voll.dn-quer { grid-template-columns: max-content minmax(0, 1fr); column-gap: 1rem; align-content: start; }
  .tav-karte#diebesnacht.tav-voll.dn-quer > .dn-buehne { grid-column: 1; grid-row: 1 / span 6; justify-self: start; max-width: none;
    width: min(calc(100vw - 1rem), calc((100vh - 1rem) * var(--dn-ar))); width: min(calc(100vw - 1rem), calc((100dvh - 1rem) * var(--dn-ar))); }
  .tav-karte#diebesnacht.tav-voll.dn-quer > :not(.dn-buehne):not(.tav-voll-knopf) { grid-column: 2; max-width: 28rem; width: 100%; justify-self: start; }
  .tav-karte#diebesnacht.tav-voll.dn-quer > .dn-steuerung { margin-top: 2.8rem; text-align: left; }
}
@media (max-width: 799px) {
  .tav-karte#diebesnacht.tav-voll.dn-quer { grid-template-columns: minmax(0, 1fr); }
  .tav-karte#diebesnacht.tav-voll.dn-quer > :not(.dn-buehne):not(.tav-voll-knopf) { grid-column: 1; max-width: none; }
  .tav-karte#diebesnacht.tav-voll.dn-quer > .dn-buehne { grid-row: auto; order: -1; }
  .tav-karte#diebesnacht.tav-voll.dn-quer > .dn-steuerung { margin-top: 0; }
}
@media (min-width: 2200px) and (min-height: 1200px) and (min-aspect-ratio: 19/10) {
  html body .tav-karte.tav-voll.dn-quer#diebesnacht .dn-buehne, html body #taverne.saal-einzeln .tav-karte.tav-voll.dn-quer#diebesnacht .dn-buehne { width: calc((100vh - 5rem) * var(--dn-ar)); max-width: none; }
}
`;
  document.head.appendChild(css);

  /* ---------- Start ---------- */
  aufbauen();
  bestenLaden(stufeWahl);
  laden("rex-guckt.webp", img => { rexBild = img; });
  laden("ezekiel.jpg", img => { startBild = img; if (zustand === "start") zeichnen(); });
  function laden(src, cb) { const i = new Image(); i.decoding = "async"; i.onload = () => cb(i); i.src = src; }
  startZeigen();
  if (window.ResizeObserver) new ResizeObserver(groesse).observe(buehne); else window.addEventListener("resize", groesse);
  window.addEventListener("resize", layoutPruefen);
  new MutationObserver(layoutPruefen).observe(root, { attributes: true, attributeFilter: ["class"] });
  layoutPruefen();
  groesse();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => zeichnen());
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(eintraege => {
      sichtbar = eintraege[0].isIntersecting;
      if (sichtbar) anwerfen(); else pausieren();
    }, { threshold: 0.15 }).observe(buehne);
  } else { sichtbar = true; anwerfen(); }
  document.addEventListener("visibilitychange", () => { if (document.hidden) pausieren(); else anwerfen(); });
  let letzteSprache = sprache();
  new MutationObserver(() => { if (sprache() === letzteSprache) return; letzteSprache = sprache(); texteSetzen(); zeichnen(); })
    .observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });

  /* Testzugang (für automatische Prüfungen, im Spiel unsichtbar) */
  root.__dn = { LEVELS, get S() { return S; }, get E() { return E; }, get zustand() { return zustand; }, set zustand(v) { zustand = v; },
    stufeLaden, neuesSpiel, begehbar, pfadSuchen, genau, neben, tippen, schlossStart, schlossTippen, schlossUpdate, schlossMitte, nadelTempo, zugLesen, setStufe: v => { stufeWahl = v; }, zeichnen, anwerfen, update, schleierZu,
    griffStart, griffTippen, maskeAnlegen, schrittLaerm, stufeGeschafft, nachstellungEnde, get quer() { return istQuer; }, get BW() { return BW; }, get H() { return H; } };
  /* ---------- Controller (controller.js) ---------- */
  /* W, H, OY und FUSS_Y sind Getter: im Querformat ändert sich die Aufteilung der Leinwand (W = ganze Leinwandbreite) */
  root._pad = {
    zustand: () => zustand, get W() { return BW; }, get H() { return H; }, C, get OY() { return OY; }, get FUSS_Y() { return FUSS_Y; }, leinwand,
    held: () => S && E ? { x: E.x * C, y: OY + E.y * C } : null,
    zorn: () => { if (zornKnopf && !zornKnopf.hidden) zornKnopf.click(); },
    rauch: () => { if (rauchKnopf && !rauchKnopf.hidden) rauchKnopf.click(); },
    muenze: () => { if (muenzKnopf && !muenzKnopf.hidden) muenzKnopf.click(); },
    schloss: () => !!(S && (S.schloss || S.griff)), // auch beim Taschendiebstahl: A = jetzt zugreifen
    griff: () => !!(S && S.griff),
    maske: () => { if (maskeKnopf && !maskeKnopf.hidden) maskeKnopf.click(); },
    quer: () => istQuer,
    zielt: () => !!(S && S.zielModus),
    tippen(p) { if (zustand !== "spiel" || !S) return; audio(); tippen(p); muenzKnopfSetzen(); },
    knacken() { if (S && S.griff) { griffTippen(); return; } if (S && S.schloss) { const m = schlossMitte(); schlossTippen({ x: m.x, y: m.y }); muenzKnopfSetzen(); } },
    abbrechen() { if (!S) return false; if (S.schloss) { S.schloss = null; return true; } if (S.zielModus) { S.zielModus = false; muenzKnopfSetzen(); return true; } return false; },
    pause: () => pausieren()
  };
})();
